import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Droplets,
  Leaf,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  Sprout,
  FileText,
  RefreshCw,
  Bot,
} from 'lucide-react-native';
import { useCrops } from '@/lib/api/crops';
import { diagnoseCropHealth } from '@/lib/api/vision';
import {
  useCropDiagnoses,
  useSaveCropDiagnosis,
  useDeleteCropDiagnosis,
} from '@/lib/api/diagnosis';
import { useStore } from '@/lib/store';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical Alert',
    bg: '#FFEBEE',
    border: '#FFCDD2',
    text: '#C62828',
    icon: ShieldAlert,
  },
  high: {
    label: 'High Severity',
    bg: '#FFF3E0',
    border: '#FFE0B2',
    text: '#E65100',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Moderate Severity',
    bg: '#FFF8E1',
    border: '#FFECB3',
    text: '#F57F17',
    icon: AlertTriangle,
  },
  low: {
    label: 'Mild Symptoms',
    bg: '#F1F8E9',
    border: '#DCEDC8',
    text: '#33691E',
    icon: Leaf,
  },
  none: {
    label: 'Optimal Health',
    bg: '#E8F5E9',
    border: '#C8E6C9',
    text: '#2E7D32',
    icon: ShieldCheck,
  },
};

const SCAN_STAGES = [
  'Inspecting leaf pigmentation, margins & cellular lesions...',
  'Screening against 100+ South Asian agricultural pathogens & pests...',
  'Formulating organic bio-controls & CIBRC chemical prescriptions...',
];

export default function CropDiagnoseScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, session } = useStore();

  const { data: crops = [] } = useCrops();
  const { data: pastDiagnoses = [], isLoading: historyLoading } = useCropDiagnoses();
  const saveDiagnosisMutation = useSaveCropDiagnosis();
  const deleteDiagnosisMutation = useDeleteCropDiagnosis();

  // Selected crop ID from params or dropdown
  const [selectedCropId, setSelectedCropId] = useState(params.crop_id || '');
  const [customCropName, setCustomCropName] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');

  // Image state
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  // Diagnostic state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStageIndex, setScanStageIndex] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [activePrescriptionTab, setActivePrescriptionTab] = useState('organic');
  const [viewingSavedScan, setViewingSavedScan] = useState(null);

  // Set default crop name if params crop_id matches
  useEffect(() => {
    if (params.crop_id && crops.length > 0) {
      const match = crops.find((c) => c.id === params.crop_id);
      if (match) {
        setSelectedCropId(match.id);
      }
    }
  }, [params.crop_id, crops]);

  // Handle stage timer during analysis
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setScanStageIndex(0);
      interval = setInterval(() => {
        setScanStageIndex((prev) => (prev < SCAN_STAGES.length - 1 ? prev + 1 : prev));
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Pick Image (Camera or Library)
  const pickImage = async (useCamera = false) => {
    try {
      setImagePickerLoading(true);
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera Permission Needed', 'Allow camera access to photograph crop leaves.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Gallery Permission Needed', 'Allow gallery access to select crop photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64);
        setDiagnosisResult(null);
        setViewingSavedScan(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to load photo: ' + (err.message || 'Unknown error'));
    } finally {
      setImagePickerLoading(false);
    }
  };

  // Run Gemini Diagnostic
  const handleRunDiagnosis = async () => {
    if (!imageBase64) {
      Alert.alert('Photo Required', 'Please photograph or select a crop leaf or stem photo first.');
      return;
    }

    const matchedCrop = crops.find((c) => c.id === selectedCropId);
    const cropHint = matchedCrop ? `${matchedCrop.crop_name} (${matchedCrop.season})` : customCropName;

    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setViewingSavedScan(null);

    try {
      const result = await diagnoseCropHealth({
        base64Image: imageBase64,
        cropType: cropHint,
        notes: fieldNotes,
      });

      setDiagnosisResult(result);

      // Auto-save diagnosis to Supabase
      saveDiagnosisMutation.mutate({
        cropId: selectedCropId || null,
        cropName: result.crop_name || cropHint || 'Crop',
        diagnosis: result,
        notes: fieldNotes,
        base64Image: imageBase64,
        localImageUri: imageUri,
      });
    } catch (err) {
      Alert.alert(
        'Diagnostic Error',
        err.message || 'Failed to complete diagnosis. Ensure EXPO_PUBLIC_GEMINI_API_KEY is configured.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inspect previous scan from history
  const handleSelectHistoricalScan = (scan) => {
    setViewingSavedScan(scan);
    setDiagnosisResult({
      crop_name: scan.crop_name,
      health_status: scan.health_status,
      confidence_score: scan.confidence_score,
      diagnosis_title: scan.diagnosis_title,
      scientific_name: scan.scientific_name,
      severity: scan.severity,
      urgency_message: scan.urgency_message,
      symptoms: scan.symptoms || [],
      cause: scan.cause,
      treatments: scan.treatments || {},
    });
    setImageUri(scan.image_url || null);
    setImageBase64(null);
    setSelectedCropId(scan.crop_id || '');
  };

  // Delete historical scan
  const handleDeleteHistoricalScan = (scanId, e) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this saved crop diagnosis?')) {
        deleteDiagnosisMutation.mutate(scanId);
        if (viewingSavedScan?.id === scanId) {
          setViewingSavedScan(null);
          setDiagnosisResult(null);
        }
      }
    } else {
      Alert.alert('Delete Diagnosis', 'Are you sure you want to delete this scan?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDiagnosisMutation.mutate(scanId);
            if (viewingSavedScan?.id === scanId) {
              setViewingSavedScan(null);
              setDiagnosisResult(null);
            }
          },
        },
      ]);
    }
  };

  const activeResult = diagnosisResult;
  const severityCfg = activeResult
    ? SEVERITY_CONFIG[activeResult.severity] || SEVERITY_CONFIG.medium
    : SEVERITY_CONFIG.medium;
  const SeverityIcon = severityCfg.icon;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 90,
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 20,
          flexGrow: 1,
        }}
      >
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            marginBottom: 24,
            paddingBottom: 18,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.1)',
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 6,
              }}
              hitSlop={8}
            >
              <ArrowLeft size={19} color="#3E2723" strokeWidth={2.4} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: isMobile ? 22 : 28, color: '#3E2723' }}>
                  AI Crop Doctor
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(46,125,50,0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Sparkles size={11} color="#2E7D32" />
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#2E7D32' }}>
                    Gemini 2.5
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 2 }}>
                Instant visual disease diagnosis, pathogen detection, and dosage prescription
              </Text>
            </View>
          </View>

          {/* Quick AI Assistant Shortcut */}
          <Pressable
            onPress={() => router.push('/(tabs)/assistant')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(46,125,50,0.2)',
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 12,
              gap: 6,
            }}
          >
            <Bot size={16} color="#2E7D32" strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#2E7D32' }}>
              Chat with Agronomist
            </Text>
          </Pressable>
        </View>

        {/* Main 2-Column Responsive Body */}
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
          {/* Left Column: Image Capture & Inputs (Desktop ~420px, Mobile 100%) */}
          <View style={{ width: isDesktop ? 420 : '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Image Box Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.06)',
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723', marginBottom: 12 }}>
                1. Capture or Upload Crop Photo
              </Text>

              {imageUri ? (
                <View
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 240,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.1)',
                    backgroundColor: '#000000',
                  }}
                >
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />

                  {/* Retake / Change Buttons Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      right: 10,
                      flexDirection: 'row',
                      gap: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <Pressable
                      onPress={() => pickImage(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        gap: 6,
                      }}
                    >
                      <Camera size={14} color="#FFFFFF" />
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#FFFFFF' }}>Retake</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => pickImage(false)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        gap: 6,
                      }}
                    >
                      <ImageIcon size={14} color="#FFFFFF" />
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#FFFFFF' }}>Gallery</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setImageUri(null);
                        setImageBase64(null);
                        setDiagnosisResult(null);
                        setViewingSavedScan(null);
                      }}
                      style={{
                        backgroundColor: 'rgba(211,47,47,0.85)',
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(62,39,35,0.18)',
                    backgroundColor: '#FAF7F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(46,125,50,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Leaf size={26} color="#2E7D32" strokeWidth={1.8} />
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723', textAlign: 'center' }}>
                    Select or snap leaf/stem photo
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', textAlign: 'center', marginTop: 3 }}>
                    Close-ups with clear lighting produce the most accurate diagnosis
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <Pressable
                      onPress={() => pickImage(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#2E7D32',
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 10,
                        gap: 6,
                        shadowColor: '#2E7D32',
                        shadowOpacity: 0.15,
                        shadowRadius: 5,
                      }}
                    >
                      <Camera size={15} color="#FFFFFF" strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: '#FFFFFF' }}>Take Photo</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => pickImage(false)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: 'rgba(62,39,35,0.15)',
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 10,
                        gap: 6,
                      }}
                    >
                      <ImageIcon size={15} color="#6D4C41" strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: '#6D4C41' }}>Choose Image</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Context & Field Observations Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.06)',
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723', marginBottom: 12 }}>
                2. Target Crop & Field Notes
              </Text>

              {/* Crop Selector from Farmer's Registered Batches */}
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginBottom: 6 }}>
                Link to Registered Crop Batch (Optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                <Pressable
                  onPress={() => setSelectedCropId('')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9,
                    borderWidth: 1,
                    backgroundColor: !selectedCropId ? '#2E7D32' : '#FFFFFF',
                    borderColor: !selectedCropId ? '#2E7D32' : 'rgba(62,39,35,0.12)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: !selectedCropId ? 'Inter-Bold' : 'Inter-Medium',
                      fontSize: 12,
                      color: !selectedCropId ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    Auto Detect
                  </Text>
                </Pressable>

                {crops.map((c) => {
                  const isSel = selectedCropId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedCropId(c.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 9,
                        borderWidth: 1,
                        backgroundColor: isSel ? '#2E7D32' : '#FFFFFF',
                        borderColor: isSel ? '#2E7D32' : 'rgba(62,39,35,0.12)',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: isSel ? 'Inter-Bold' : 'Inter-Medium',
                          fontSize: 12,
                          color: isSel ? '#FFFFFF' : '#6D4C41',
                        }}
                      >
                        {c.crop_name} ({c.season})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!selectedCropId && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginBottom: 4 }}>
                    Crop Name (If not in your registered crops)
                  </Text>
                  <TextInput
                    value={customCropName}
                    onChangeText={setCustomCropName}
                    placeholder="e.g. Tomato, Cotton, Sugarcane..."
                    placeholderTextColor="#9E9189"
                    style={{
                      backgroundColor: '#FAF7F2',
                      borderWidth: 1,
                      borderColor: 'rgba(62,39,35,0.1)',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontFamily: 'Inter-Regular',
                      fontSize: 13,
                      color: '#3E2723',
                    }}
                  />
                </View>
              )}

              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginBottom: 4 }}>
                Farmer Observations (Weather, soil, days since first seen)
              </Text>
              <TextInput
                value={fieldNotes}
                onChangeText={setFieldNotes}
                placeholder="e.g. Lower leaves yellowing after 3 days of cloudy drizzle; slight white powder underneath..."
                placeholderTextColor="#9E9189"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#FAF7F2',
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.1)',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontFamily: 'Inter-Regular',
                  fontSize: 13,
                  color: '#3E2723',
                  minHeight: 70,
                  textAlignVertical: 'top',
                }}
              />

              {/* Analyze CTA */}
              <Pressable
                onPress={handleRunDiagnosis}
                disabled={isAnalyzing || !imageBase64}
                style={{
                  marginTop: 18,
                  backgroundColor: isAnalyzing || !imageBase64 ? '#A5D6A7' : '#2E7D32',
                  paddingVertical: 13,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: '#2E7D32',
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#FFFFFF' }}>
                      Kheti Doctor Analyzing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#FFFFFF' }}>
                      Diagnose Crop Health
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Historical Scans Drawer (Visible on Desktop Left or Bottom on Mobile) */}
            {pastDiagnoses.length > 0 && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }}>
                    Historical Scans ({pastDiagnoses.length})
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                    Recent diagnostics
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pastDiagnoses.slice(0, 5).map((scan) => {
                    const isSelected = viewingSavedScan?.id === scan.id;
                    const sev = SEVERITY_CONFIG[scan.severity] || SEVERITY_CONFIG.medium;
                    return (
                      <Pressable
                        key={scan.id}
                        onPress={() => handleSelectHistoricalScan(scan)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 10,
                          borderRadius: 12,
                          backgroundColor: isSelected ? 'rgba(46,125,50,0.08)' : '#FAF7F2',
                          borderWidth: 1,
                          borderColor: isSelected ? '#2E7D32' : 'rgba(62,39,35,0.06)',
                          gap: 10,
                        }}
                      >
                        {scan.image_url ? (
                          <Image
                            source={{ uri: scan.image_url }}
                            style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#E0E0E0' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              backgroundColor: sev.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Leaf size={18} color={sev.text} />
                          </View>
                        )}

                        <View style={{ flex: 1, overflow: 'hidden' }}>
                          <Text
                            style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#3E2723' }}
                            numberOfLines={1}
                          >
                            {scan.diagnosis_title}
                          </Text>
                          <Text
                            style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189', marginTop: 1 }}
                            numberOfLines={1}
                          >
                            {scan.crop_name} • {new Date(scan.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <Pressable
                          onPress={(e) => handleDeleteHistoricalScan(scan.id, e)}
                          style={{ padding: 6 }}
                          hitSlop={6}
                        >
                          <Trash2 size={14} color="#9E9189" />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Right Column: Diagnostic Report & Prescriptions (Desktop flex-1, Mobile 100%) */}
          <View style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Analyzing Indicator Radar */}
            {isAnalyzing && (
              <Animated.View entering={FadeInUp.duration(300)}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(46,125,50,0.2)',
                    shadowColor: '#2E7D32',
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                  }}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: 'rgba(46,125,50,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      borderWidth: 2,
                      borderColor: 'rgba(46,125,50,0.2)',
                    }}
                  >
                    <ActivityIndicator size="large" color="#2E7D32" />
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#3E2723', textAlign: 'center' }}>
                    Kheti Doctor Agronomic Screening
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 13,
                      color: '#2E7D32',
                      textAlign: 'center',
                      marginTop: 8,
                      lineHeight: 20,
                      maxWidth: 440,
                    }}
                  >
                    {SCAN_STAGES[scanStageIndex]}
                  </Text>

                  {/* Stage Dots */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
                    {SCAN_STAGES.map((_, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: idx === scanStageIndex ? 22 : 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: idx === scanStageIndex ? '#2E7D32' : 'rgba(46,125,50,0.2)',
                        }}
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Diagnostic Report Card */}
            {activeResult && !isAnalyzing && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: isMobile ? 18 : 26,
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.06)',
                    shadowColor: '#3E2723',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    gap: 20,
                  }}
                >
                  {/* Hero Diagnosis Header */}
                  <View
                    style={{
                      backgroundColor: severityCfg.bg,
                      borderRadius: 16,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: severityCfg.border,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: severityCfg.border,
                        shrink: 0,
                      }}
                    >
                      <SeverityIcon size={24} color={severityCfg.text} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <View
                          style={{
                            backgroundColor: '#FFFFFF',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: severityCfg.border,
                          }}
                        >
                          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: severityCfg.text }}>
                            {severityCfg.label}
                          </Text>
                        </View>
                        {activeResult.confidence_score && (
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#3E2723' }}>
                              {activeResult.confidence_score}% Confidence
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={{
                          fontFamily: 'Inter-Bold',
                          fontSize: isMobile ? 20 : 24,
                          color: '#3E2723',
                          marginTop: 6,
                        }}
                      >
                        {activeResult.diagnosis_title}
                      </Text>

                      {activeResult.scientific_name && activeResult.scientific_name !== 'N/A' && (
                        <Text
                          style={{
                            fontFamily: 'Inter-Regular',
                            fontSize: 13,
                            color: '#6D4C41',
                            fontStyle: 'italic',
                            marginTop: 2,
                          }}
                        >
                          Pathogen: {activeResult.scientific_name}
                        </Text>
                      )}

                      <Text
                        style={{
                          fontFamily: 'Inter-Medium',
                          fontSize: 12,
                          color: '#6D4C41',
                          marginTop: 4,
                        }}
                      >
                        Target Crop: {activeResult.crop_name}
                      </Text>
                    </View>
                  </View>

                  {/* Urgency Alert Message */}
                  {activeResult.urgency_message && (
                    <View
                      style={{
                        backgroundColor: '#FFF8E1',
                        borderRadius: 12,
                        padding: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: '#F57F17',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Clock size={18} color="#F57F17" strokeWidth={2.2} />
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: '#B45309', flex: 1 }}>
                        {activeResult.urgency_message}
                      </Text>
                    </View>
                  )}

                  {/* Observable Symptoms */}
                  {activeResult.symptoms && activeResult.symptoms.length > 0 && (
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723', marginBottom: 8 }}>
                        Visual Symptoms Identified
                      </Text>
                      <View style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {activeResult.symptoms.map((symptom, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#2E7D32',
                                marginTop: 6,
                              }}
                            />
                            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#3E2723', flex: 1, lineHeight: 18 }}>
                              {symptom}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Cause & Environmental Triggers */}
                  {activeResult.cause && (
                    <View
                      style={{
                        backgroundColor: '#FAF7F2',
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(62,39,35,0.06)',
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#3E2723', marginBottom: 4 }}>
                        Biological & Environmental Cause
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#6D4C41', lineHeight: 19 }}>
                        {activeResult.cause}
                      </Text>
                    </View>
                  )}

                  {/* Treatment Prescription Section */}
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(62,39,35,0.06)', paddingTop: 16 }}>
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723', marginBottom: 12 }}>
                      Recommended Agronomic Protocols
                    </Text>

                    {/* Prescription Tabs */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <Pressable
                        onPress={() => setActivePrescriptionTab('organic')}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: activePrescriptionTab === 'organic' ? '#2E7D32' : '#FFFFFF',
                          borderColor: activePrescriptionTab === 'organic' ? '#2E7D32' : 'rgba(62,39,35,0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Leaf size={14} color={activePrescriptionTab === 'organic' ? '#FFFFFF' : '#2E7D32'} />
                        <Text
                          style={{
                            fontFamily: 'Inter-Bold',
                            fontSize: 12,
                            color: activePrescriptionTab === 'organic' ? '#FFFFFF' : '#3E2723',
                          }}
                        >
                          🌿 Organic & Bio
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setActivePrescriptionTab('chemical')}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: activePrescriptionTab === 'chemical' ? '#1565C0' : '#FFFFFF',
                          borderColor: activePrescriptionTab === 'chemical' ? '#1565C0' : 'rgba(62,39,35,0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Droplets size={14} color={activePrescriptionTab === 'chemical' ? '#FFFFFF' : '#1565C0'} />
                        <Text
                          style={{
                            fontFamily: 'Inter-Bold',
                            fontSize: 12,
                            color: activePrescriptionTab === 'chemical' ? '#FFFFFF' : '#3E2723',
                          }}
                        >
                          🧪 Chemical Dosage
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setActivePrescriptionTab('preventive')}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: activePrescriptionTab === 'preventive' ? '#F57F17' : '#FFFFFF',
                          borderColor: activePrescriptionTab === 'preventive' ? '#F57F17' : 'rgba(62,39,35,0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <ShieldCheck size={14} color={activePrescriptionTab === 'preventive' ? '#FFFFFF' : '#F57F17'} />
                        <Text
                          style={{
                            fontFamily: 'Inter-Bold',
                            fontSize: 12,
                            color: activePrescriptionTab === 'preventive' ? '#FFFFFF' : '#3E2723',
                          }}
                        >
                          🛡️ Preventive Field Plan
                        </Text>
                      </Pressable>
                    </View>

                    {/* Prescription Content List */}
                    <View
                      style={{
                        backgroundColor: '#FAF7F2',
                        borderRadius: 14,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(62,39,35,0.06)',
                      }}
                    >
                      {activePrescriptionTab === 'organic' && (
                        <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(activeResult.treatments?.organic || [
                            'Spray cold-pressed Neem Oil (1500 ppm) @ 5 ml per liter of water with soap surfactant.',
                            'Apply Trichoderma viride / harzianum bio-fungicide @ 5g/L foliar spray.',
                            'Remove and safely dispose of severely infected lower leaves away from the plot.',
                          ]).map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
                              <View
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 11,
                                  backgroundColor: 'rgba(46,125,50,0.12)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  shrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#2E7D32' }}>
                                  {idx + 1}
                                </Text>
                              </View>
                              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#3E2723', flex: 1, lineHeight: 19 }}>
                                {item}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {activePrescriptionTab === 'chemical' && (
                        <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(activeResult.treatments?.chemical || [
                            'Foliar spray of Mancozeb 75% WP @ 2.0 to 2.5 g per liter of clean water.',
                            'In severe cases, spray Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L.',
                            'Observe Pre-Harvest Interval (PHI) of at least 7-10 days before harvesting.',
                          ]).map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
                              <View
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 11,
                                  backgroundColor: 'rgba(21,101,192,0.12)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  shrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#1565C0' }}>
                                  {idx + 1}
                                </Text>
                              </View>
                              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#3E2723', flex: 1, lineHeight: 19 }}>
                                {item}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {activePrescriptionTab === 'preventive' && (
                        <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(activeResult.treatments?.preventive || [
                            'Avoid late afternoon or evening overhead sprinkler irrigation to keep leaf canopy dry overnight.',
                            'Ensure adequate intra-row spacing to facilitate healthy air ventilation across rows.',
                            'Follow crop rotation with non-host botanical families in upcoming Kharif/Rabi cycle.',
                          ]).map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
                              <View
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 11,
                                  backgroundColor: 'rgba(245,127,23,0.12)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  shrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#F57F17' }}>
                                  {idx + 1}
                                </Text>
                              </View>
                              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#3E2723', flex: 1, lineHeight: 19 }}>
                                {item}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Connected Workflow Actions */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(62,39,35,0.06)',
                      paddingTop: 16,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 10,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        const targetCrop = crops.find((c) => c.id === selectedCropId);
                        const desc = encodeURIComponent(`Prescription for ${activeResult.diagnosis_title}`);
                        const cropParam = targetCrop ? `&crop_id=${targetCrop.id}` : '';
                        router.push(`/ledger/new?category=Pesticides&type=expense&description=${desc}${cropParam}`);
                      }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2E7D32',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8,
                        shadowColor: '#2E7D32',
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                      }}
                    >
                      <FileText size={16} color="#FFFFFF" strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#FFFFFF' }}>
                        Record Treatment in Farm Ledger
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push('/(tabs)/assistant')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: 'rgba(46,125,50,0.2)',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        gap: 6,
                      }}
                    >
                      <Bot size={16} color="#2E7D32" strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#2E7D32' }}>
                        Ask Assistant
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Empty State when no image selected */}
            {!activeResult && !isAnalyzing && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                  minHeight: 380,
                }}
              >
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: '#FAF7F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.08)',
                  }}
                >
                  <Sparkles size={32} color="#2E7D32" strokeWidth={1.7} />
                </View>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#3E2723', textAlign: 'center' }}>
                  Ready to Examine Your Crop
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    color: '#9E9189',
                    textAlign: 'center',
                    marginTop: 6,
                    maxWidth: 400,
                    lineHeight: 20,
                  }}
                >
                  Take a photo of any suspicious leaf spots, insect larvae, or wilting foliage. Kheti Doctor will identify the disease, calculate severity, and output organic & chemical remedies.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

