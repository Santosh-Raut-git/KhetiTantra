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
import { Send, Bot, User, AlertCircle } from 'lucide-react-native';
import { useChatHistory, useSendMessage } from '@/lib/api/chat';
import Animated, {
  SlideInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useStore } from '@/lib/store';
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
  const handleSend = () => {
    if (!inputText.trim() || !conversationId) return;
    const message = inputText.trim();
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
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View
        entering={
          isUser
            ? SlideInRight.duration(280).springify()
            : SlideInLeft.duration(280).springify()
        }
        style={{ marginBottom: 16 }}
      >
        <View
          className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          {!isUser && (
            <View className="w-8 h-8 rounded-full bg-leaf/20 items-center justify-center mr-2 mt-1">
              <Bot size={18} color="#2E7D32" />
            </View>
          )}
          <View
            className={`max-w-[80%] rounded-2xl p-3 ${isUser ? 'bg-leaf rounded-tr-none' : 'bg-surface border border-soil/10 rounded-tl-none'}`}
          >
            {isUser ? (
              <Text
                className="text-white text-base"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                {item.content}
              </Text>
            ) : (
              <Markdown
                style={{
                  body: {
                    fontFamily: 'Inter-Regular',
                    fontSize: 16,
                    color: '#3E2723',
                  },
                  strong: { fontFamily: 'Inter-Bold', color: '#2E7D32' },
                  paragraph: { marginTop: 0, marginBottom: 8 },
                }}
              >
                {item.content}
              </Markdown>
            )}
          </View>
          {isUser && (
            <View className="w-8 h-8 rounded-full bg-sand items-center justify-center ml-2 mt-1 border border-soil/10">
              <User size={18} color="#6D4C41" />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-soil/5 bg-sand z-10 md:max-w-2xl md:w-full md:self-center">
        <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mr-3">
          <Bot size={24} color="#2E7D32" strokeWidth={1.5} />
        </View>
        <View>
          <Text
            className="text-soil text-xl font-bold"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Kheti AI
          </Text>
          <Text
            className="text-soil-muted text-xs"
            style={{ fontFamily: 'Inter-Medium' }}
          >
            {isRetailer ? 'Your business analyst' : 'Your personal agronomist'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {historyLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : historyError ? (
          <View className="flex-1 justify-center items-center px-8">
            <AlertCircle size={48} color="#D32F2F" />
            <Text
              className="text-soil text-lg font-bold mt-4 text-center"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Unable to load chat
            </Text>
            <Text
              className="text-soil-muted text-center mt-2"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              {historyError.message ||
                'Please check your connection and try again.'}
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-4 bg-leaf px-6 py-3 rounded-full"
            >
              <Text
                className="text-white font-bold"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerClassName="p-5 pb-2 md:max-w-2xl md:w-full md:self-center"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center mt-20 opacity-60">
                <Bot size={48} color="#2E7D32" />
                <Text
                  className="text-soil text-lg font-bold mt-4"
                  style={{ fontFamily: 'Inter-Bold' }}
                >
                  How can I help you today?
                </Text>
                <Text
                  className="text-soil-muted text-center mt-2"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  {isRetailer 
                    ? 'Ask me about market prices, crop availability, or supply chain logistics.' 
                    : 'Ask me about crop diseases, fertilizers, or general farming advice.'}
                </Text>
              </View>
            )}
            ListFooterComponent={() => (
              <>
                {sendMessage.isPending && (
                  <View className="flex-row justify-start mb-4">
                    <View className="w-8 h-8 rounded-full bg-leaf/20 items-center justify-center mr-2">
                      <Bot size={18} color="#2E7D32" />
                    </View>
                    <View className="bg-surface border border-soil/10 rounded-2xl rounded-tl-none p-4 justify-center items-center">
                      <ActivityIndicator size="small" color="#2E7D32" />
                    </View>
                  </View>
                )}
                {sendMessage.isError && !sendMessage.isPending && (
                  <View className="flex-row justify-start mb-4">
                    <View className="w-8 h-8 rounded-full bg-clay/20 items-center justify-center mr-2">
                      <AlertCircle size={18} color="#D32F2F" />
                    </View>
                    <View className="max-w-[80%] bg-clay/10 border border-clay/20 rounded-2xl rounded-tl-none p-3">
                      <Text
                        className="text-clay text-sm"
                        style={{ fontFamily: 'Inter-Medium' }}
                      >
                        Failed to get response. Please try again.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          />
        )}

        <View className="p-4 bg-surface border-t border-soil/5 flex-row items-end md:max-w-2xl md:w-full md:self-center">
          <View className="flex-1 min-h-[48px] max-h-[120px] bg-sand border border-soil/15 rounded-2xl px-4 py-3 mr-3 justify-center">
            <TextInput
              className="text-soil text-base p-0"
              style={{ fontFamily: 'Inter-Regular' }}
              placeholder="Ask a question..."
              placeholderTextColor="#9E9189"
              multiline
              value={inputText}
              onChangeText={setInputText}
              editable={!sendMessage.isPending}
            />
          </View>
          <Animated.View style={sendAnimatedStyle}>
            <Pressable
              onPress={handleSend}
              onPressIn={() => {
                sendScale.value = withSpring(0.85, {
                  damping: 12,
                  stiffness: 400,
                });
              }}
              onPressOut={() => {
                sendScale.value = withSpring(1, {
                  damping: 12,
                  stiffness: 400,
                });
              }}
              disabled={
                !inputText.trim() || sendMessage.isPending || !conversationId
              }
              className={`w-12 h-12 rounded-full items-center justify-center ${!inputText.trim() || sendMessage.isPending || !conversationId ? 'bg-leaf/50' : 'bg-leaf'}`}
            >
              <Send
                size={20}
                color="#FFFFFF"
                style={{ marginLeft: -2, marginTop: 2 }}
              />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
