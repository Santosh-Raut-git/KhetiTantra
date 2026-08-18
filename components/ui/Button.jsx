import { TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
export function Button({
  label,
  variant = 'primary',
  icon,
  className,
  disabled,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  ...props
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isIconOnly = !label;
  const baseStyle = `min-h-[48px] flex-row items-center justify-center rounded-xl ${isIconOnly ? '' : 'px-4 py-3'}`;
  const variants = {
    primary: 'bg-leaf active:bg-leaf-dark',
    secondary: 'bg-harvest active:bg-harvest-dark',
    danger: 'bg-clay active:bg-clay-dark',
  };
  const textColors = {
    primary: 'text-white',
    secondary: 'text-soil',
    danger: 'text-white',
  };
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        className={`${baseStyle} ${variants[variant]} ${className || ''}`}
        activeOpacity={0.9}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label || 'Button'}
        onPressIn={(e) => {
          if (!disabled)
            scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
          onPressInProp?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
          onPressOutProp?.(e);
        }}
        {...props}
      >
        {icon}
        {!!label && (
          <Text
            className={`${textColors[variant]} font-medium ${icon ? 'ml-2' : ''}`}
            style={{ fontFamily: 'Inter-Medium', fontSize: 16 }}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
