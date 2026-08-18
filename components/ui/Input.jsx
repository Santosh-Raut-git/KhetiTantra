import { TextInput, View, Text } from 'react-native';
export function Input({ label, error, className, value, ...props }) {
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
      <View
        className={`border ${error ? 'border-clay' : 'border-soil/15'} rounded-xl bg-surface`}
      >
        <TextInput
          className={`min-h-[48px] px-4 text-soil ${className || ''}`}
          placeholderTextColor="#9E9189"
          style={{ fontFamily: 'Inter-Regular', fontSize: 16 }}
          accessible={true}
          accessibilityLabel={label || props.placeholder}
          value={value ?? ''}
          {...props}
        />
      </View>
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
