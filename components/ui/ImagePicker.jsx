import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
export function AppImagePicker({
  label,
  value,
  onImageSelected,
  onImageRemoved,
  error,
  isUploading,
}) {
  const [loading, setLoading] = useState(false);
  const pickImage = async (useCamera) => {
    try {
      setLoading(true);
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission needed',
            'Camera access is required to take photos',
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission needed',
            'Gallery access is required to select photos',
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      }
      if (!result.canceled && result.assets[0].base64) {
        onImageSelected(result.assets[0].base64, result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View className="mb-4">
      {label && (
        <Text
          className="text-soil-muted text-sm mb-1.5"
          style={{ fontFamily: 'Inter-Medium' }}
        >
          {label}
        </Text>
      )}

      {value ? (
        <View className="relative w-full h-48 rounded-xl overflow-hidden border border-soil/15">
          <Image
            source={{ uri: value }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {(loading || isUploading) && (
            <View className="absolute inset-0 bg-black/30 items-center justify-center">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}

          <Pressable
            onPress={onImageRemoved}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
          >
            <Trash2 size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View
          className={`w-full h-32 rounded-xl border-2 border-dashed ${error ? 'border-clay bg-clay/5' : 'border-soil/15 bg-surface'} items-center justify-center flex-row gap-4`}
        >
          {loading ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <>
              <Pressable
                onPress={() => pickImage(false)}
                className="items-center p-3"
              >
                <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mb-1">
                  <ImageIcon size={24} color="#2E7D32" />
                </View>
                <Text
                  className="text-soil-muted text-xs"
                  style={{ fontFamily: 'Inter-Medium' }}
                >
                  Gallery
                </Text>
              </Pressable>

              <Pressable
                onPress={() => pickImage(true)}
                className="items-center p-3"
              >
                <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mb-1">
                  <Camera size={24} color="#2E7D32" />
                </View>
                <Text
                  className="text-soil-muted text-xs"
                  style={{ fontFamily: 'Inter-Medium' }}
                >
                  Camera
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {error && (
        <Text
          className="text-clay mt-1 text-sm"
          style={{ fontFamily: 'Inter-Regular' }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
