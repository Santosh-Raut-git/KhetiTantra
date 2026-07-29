import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6 mt-8">
      <View className="w-20 h-20 rounded-full bg-leaf/10 items-center justify-center mb-5">
        {icon}
      </View>
      <Text className="text-soil text-xl font-bold text-center mb-2" style={{ fontFamily: 'Inter-Bold' }}>
        {title}
      </Text>
      <Text className="text-soil-muted text-base text-center mb-6" style={{ fontFamily: 'Inter-Regular', lineHeight: 24 }}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button 
          label={actionLabel} 
          onPress={onAction}
          className="w-full max-w-[280px]"
        />
      )}
    </View>
  );
}
