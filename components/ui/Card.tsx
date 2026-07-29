import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View 
      className={`bg-surface rounded-2xl p-4 border border-soil/5 ${className || ''}`}
      style={{
        shadowColor: '#3E2723',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
