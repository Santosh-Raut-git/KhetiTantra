import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { Send, Bot, AlertCircle, Sparkles, RefreshCw } from 'lucide-react-native';
import { useChatHistory, useSendMessage } from '@/lib/api/chat';
import Animated, {
  SlideInRight,
  SlideInLeft,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useStore } from '@/lib/store';

const FARMER_SUGGESTIONS = [
  'What crops grow best in black soil with moderate rain?',
  'How do I treat yellow leaf curl disease in tomatoes?',
  'Recommended organic fertilizer schedule for wheat crop',
  'Best sowing time and soil prep for Zaid season',
];

const RETAILER_SUGGESTIONS = [
  'What are current mandi wholesale price trends for onions?',
  'How do seasonal weather shifts affect tomato supply?',
  'Recommended storage conditions to prevent potato spoilage',
  'Key quality checkpoints when sourcing bulk wheat',
];

export default function AssistantScreen() {
  const { profile, session } = useStore();
  const rawRole = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = rawRole === 'retailer';

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const {
    data: chatData,
    isLoading: historyLoading,
    error: historyError,
    refetch,
  } = useChatHistory();
  const sendMessage = useSendMessage();
  const messages = chatData?.messages || [];
  const conversationId = chatData?.conversationId;

  const sendScale = useSharedValue(1);
  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = (textToSend) => {
    const message = (textToSend || inputText).trim();
    if (!message || !conversationId) return;
    setInputText('');
    sendMessage.mutate({ message, conversationId, history: messages });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, sendMessage.isPending]);

  const suggestions = isRetailer ? RETAILER_SUGGESTIONS : FARMER_SUGGESTIONS;

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <Animated.View
          entering={SlideInRight.duration(260)}
          style={{
            alignSelf: 'flex-end',
            maxWidth: '75%',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#2E7D32',
              borderRadius: 20,
              borderBottomRightRadius: 4,
              paddingHorizontal: 18,
              paddingVertical: 12,
              shadowColor: '#2E7D32',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 15,
                color: '#FFFFFF',
                lineHeight: 22,
              }}
            >
              {item.content}
            </Text>
          </View>
        </Animated.View>
      );
    }

    // Assistant response card
    return (
      <Animated.View
        entering={SlideInLeft.duration(260)}
        style={{
          alignSelf: 'flex-start',
          maxWidth: '85%',
          width: '100%',
          marginBottom: 20,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 22,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(62,39,35,0.08)',
            padding: 20,
            shadowColor: '#3E2723',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          {/* Header row inside assistant bubble */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(62,39,35,0.05)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: '#E8F5E9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} color="#2E7D32" strokeWidth={2.2} />
              </View>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#2E7D32' }}>
                Kheti AI
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(46,125,50,0.08)',
                  paddingHorizontal: 7,
                  paddingVertical: 1.5,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: '#2E7D32' }}>
                  {isRetailer ? 'Trade Analyst' : 'Agronomist'}
                </Text>
              </View>
            </View>
          </View>

          {/* Markdown Content */}
          <Markdown
            style={{
              body: {
                fontFamily: 'Inter-Regular',
                fontSize: 15,
                lineHeight: 24,
                color: '#3E2723',
              },
              strong: {
                fontFamily: 'Inter-Bold',
                color: '#1B5E20',
              },
              heading1: {
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: '#2E7D32',
                marginTop: 12,
                marginBottom: 6,
              },
              heading2: {
                fontFamily: 'Inter-Bold',
                fontSize: 16,
                color: '#2E7D32',
                marginTop: 10,
                marginBottom: 4,
              },
              heading3: {
                fontFamily: 'Inter-Bold',
                fontSize: 15,
                color: '#3E2723',
                marginTop: 8,
                marginBottom: 4,
              },
              paragraph: {
                marginTop: 0,
                marginBottom: 10,
              },
              bullet_list: {
                marginBottom: 8,
              },
              ordered_list: {
                marginBottom: 8,
              },
              list_item: {
                marginVertical: 3,
              },
            }}
          >
            {item.content}
          </Markdown>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* SaaS Chat Top Header Bar */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(62,39,35,0.08)',
          paddingHorizontal: 24,
          paddingVertical: 14,
          shadowColor: '#3E2723',
          shadowOpacity: 0.02,
          shadowRadius: 4,
          zIndex: 10,
        }}
      >
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: '#E8F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                borderWidth: 1,
                borderColor: 'rgba(46,125,50,0.15)',
              }}
            >
              <Bot size={22} color="#2E7D32" strokeWidth={2} />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#3E2723' }}>
                  Kheti AI
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,125,50,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32', marginRight: 5 }} />
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#2E7D32' }}>
                    Online
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }}>
                {isRetailer ? 'Procurement & Wholesale Market Specialist' : 'Personal Agronomist & Crop Specialist'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)' }}>
            <Sparkles size={14} color="#2E7D32" />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#6D4C41', marginLeft: 6 }}>
              Gemini Powered
            </Text>
          </View>
        </View>
      </View>

      {/* Main Conversation Stream */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {historyLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : historyError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <AlertCircle size={44} color="#D32F2F" />
            <Text
              style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#3E2723', marginTop: 14, textAlign: 'center' }}
            >
              Unable to load conversation
            </Text>
            <Text
              style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 6, textAlign: 'center', maxWidth: 360 }}
            >
              {historyError.message || 'Please check your connection and try again.'}
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={{
                marginTop: 18,
                backgroundColor: '#2E7D32',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 14 }}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 24,
                      backgroundColor: '#E8F5E9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(46,125,50,0.15)',
                    }}
                  >
                    <Bot size={32} color="#2E7D32" strokeWidth={1.8} />
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: '#3E2723', textAlign: 'center' }}>
                    Welcome to Kheti AI
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Regular',
                      fontSize: 14,
                      color: '#9E9189',
                      textAlign: 'center',
                      marginTop: 6,
                      marginBottom: 32,
                      maxWidth: 480,
                      lineHeight: 22,
                    }}
                  >
                    {isRetailer
                      ? 'Ask questions about wholesale price forecasts, produce storage, regional crop arrivals, and procurement logistics.'
                      : 'Ask questions about soil health, pest identification, fertilizer schedules, crop diseases, and harvest timings.'}
                  </Text>

                  {/* Suggestion prompt cards */}
                  <View style={{ width: '100%' }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#6D4C41', marginBottom: 12 }}>
                      Suggested topics to get started:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {suggestions.map((prompt, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => handleSend(prompt)}
                          style={{
                            width: 'calc(50% - 6px)',
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: 'rgba(62,39,35,0.08)',
                            borderRadius: 14,
                            padding: 14,
                            shadowColor: '#3E2723',
                            shadowOpacity: 0.03,
                            shadowRadius: 4,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Sparkles size={13} color="#2E7D32" />
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#2E7D32' }}>
                              Prompt {idx + 1}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#3E2723', lineHeight: 18 }} numberOfLines={2}>
                            {prompt}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}
              ListFooterComponent={() => (
                <>
                  {sendMessage.isPending && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(62,39,35,0.08)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        shadowColor: '#3E2723',
                        shadowOpacity: 0.03,
                        shadowRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <ActivityIndicator size="small" color="#2E7D32" />
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: '#6D4C41' }}>
                        Kheti AI is analyzing your inquiry...
                      </Text>
                    </View>
                  )}
                  {sendMessage.isError && !sendMessage.isPending && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#FFEBEE',
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: '#FFCDD2',
                        marginBottom: 16,
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#D32F2F' }}>
                        Failed to send message. Please check your network and try again.
                      </Text>
                    </View>
                  )}
                </>
              )}
            />
          </View>
        )}

        {/* Input Bar pinned cleanly at bottom */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(62,39,35,0.08)',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            shadowColor: '#3E2723',
            shadowOpacity: 0.03,
            shadowRadius: 6,
          }}
        >
          <View style={{ width: '100%' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                backgroundColor: '#F5F5F0',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.12)',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: 'Inter-Regular',
                  fontSize: 15,
                  color: '#3E2723',
                  paddingVertical: 4,
                  minHeight: 36,
                  maxHeight: 120,
                  outline: 'none',
                }}
                placeholder="Ask Kheti AI anything about farming, crops, or market rates..."
                placeholderTextColor="#9E9189"
                multiline
                value={inputText}
                onChangeText={setInputText}
                editable={!sendMessage.isPending}
              />
              <Animated.View style={sendAnimatedStyle} className="ml-2 mb-0.5">
                <Pressable
                  onPress={() => handleSend()}
                  onPressIn={() => {
                    sendScale.value = withSpring(0.9, { damping: 12, stiffness: 400 });
                  }}
                  onPressOut={() => {
                    sendScale.value = withSpring(1, { damping: 12, stiffness: 400 });
                  }}
                  disabled={!inputText.trim() || sendMessage.isPending || !conversationId}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor:
                      !inputText.trim() || sendMessage.isPending || !conversationId
                        ? 'rgba(46,125,50,0.35)'
                        : '#2E7D32',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#2E7D32',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  }}
                >
                  <Send size={17} color="#FFFFFF" strokeWidth={2.2} />
                </Pressable>
              </Animated.View>
            </View>

            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 11,
                color: '#9E9189',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Kheti AI provides insights based on agricultural knowledge bases. Verify chemical application rates with certified local authorities.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
