import { View, Text, Modal, Pressable, FlatList } from 'react-native';
import { useState } from 'react';
export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  error,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
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

      <Pressable
        onPress={() => setModalVisible(true)}
        className={`border ${error ? 'border-clay' : 'border-soil/15'} rounded-xl bg-surface min-h-[48px] px-4 justify-center`}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Text
          className={selectedOption ? 'text-soil' : 'text-[#9E9189]'}
          style={{ fontFamily: 'Inter-Regular', fontSize: 16 }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </Pressable>

      {error && (
        <Text
          className="text-clay mt-1 text-sm"
          style={{ fontFamily: 'Inter-Regular' }}
        >
          {error}
        </Text>
      )}

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-surface rounded-t-3xl pb-8 max-h-[70%]">
            <View className="px-5 py-4 border-b border-soil/5">
              <Text
                className="text-soil text-lg font-bold"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                {label || 'Select option'}
              </Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  className="px-5 py-4 border-b border-soil/5"
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    className={`text-soil ${item.value === value ? 'font-bold text-leaf' : ''}`}
                    style={{
                      fontFamily:
                        item.value === value ? 'Inter-Bold' : 'Inter-Regular',
                      fontSize: 16,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
