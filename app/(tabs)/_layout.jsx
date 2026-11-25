import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import {
  House,
  Wallet,
  Bot,
  User,
  Sprout,
  Store,
  Package,
  Users,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { useStore } from '@/lib/store';
import {
  Platform,
  useWindowDimensions,
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInRight,
  FadeInLeft,
  FadeInUp,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

const FARMER_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: House, href: '/(tabs)' },
  { name: 'crops', title: 'Crops', Icon: Sprout, href: '/(tabs)/crops' },
  { name: 'ledger', title: 'Ledger', Icon: Wallet, href: '/(tabs)/ledger' },
  { name: 'marketplace', title: 'Marketplace', Icon: Store, href: '/(tabs)/marketplace' },
  { name: 'orders', title: 'Orders & Sales', Icon: Package, href: '/(tabs)/orders' },
  { name: 'assistant', title: 'AI Assistant', Icon: Bot, href: '/(tabs)/assistant' },
  { name: 'profile', title: 'Profile', Icon: User, href: '/(tabs)/profile' },
];

const RETAILER_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: House, href: '/(tabs)' },
  { name: 'marketplace', title: 'Marketplace', Icon: Store, href: '/(tabs)/marketplace' },
  { name: 'orders', title: 'Orders', Icon: Package, href: '/(tabs)/orders' },
  { name: 'network', title: 'Grower Network', Icon: Users, href: '/(tabs)/network' },
  { name: 'assistant', title: 'AI Assistant', Icon: Bot, href: '/(tabs)/assistant' },
  { name: 'profile', title: 'Profile', Icon: User, href: '/(tabs)/profile' },
];

const NAV_ITEM_HEIGHT = 44;
const NAV_ITEM_MARGIN = 4;
const NAV_ITEM_STEP = NAV_ITEM_HEIGHT + NAV_ITEM_MARGIN; // 48px

function getActiveNavIndex(items, pathname) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.name === 'index') {
      if (
        pathname === '/' ||
        pathname === '' ||
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/'
      ) {
        return i;
      }
    } else {
      if (
        pathname === '/' + item.name ||
        pathname === '/(tabs)/' + item.name ||
        pathname.startsWith('/' + item.name + '/') ||
        pathname.startsWith('/(tabs)/' + item.name + '/')
      ) {
        return i;
      }
    }
  }
  return -1;
}

// ── Web Styles for Smooth Directional Motion Blur ─────────────────────────
const contentStyles = StyleSheet.create({
  slideDownBlur: {
    animationKeyframes: {
      '0%': { transform: [{ translateY: -130 }], opacity: 0.05, filter: 'blur(16px)' },
      '35%': { opacity: 0.75, filter: 'blur(8px)' },
      '75%': { opacity: 0.95, filter: 'blur(2px)' },
      '100%': { transform: [{ translateY: 0 }], opacity: 1, filter: 'blur(0px)' },
    },
    animationDuration: '460ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.28, 1)',
    animationFillMode: 'both',
  },
  slideUpBlur: {
    animationKeyframes: {
      '0%': { transform: [{ translateY: 130 }], opacity: 0.05, filter: 'blur(16px)' },
      '35%': { opacity: 0.75, filter: 'blur(8px)' },
      '75%': { opacity: 0.95, filter: 'blur(2px)' },
      '100%': { transform: [{ translateY: 0 }], opacity: 1, filter: 'blur(0px)' },
    },
    animationDuration: '460ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.28, 1)',
    animationFillMode: 'both',
  },
  slideRightBlur: {
    animationKeyframes: {
      '0%': { transform: [{ translateX: -110 }], opacity: 0.05, filter: 'blur(14px)' },
      '35%': { opacity: 0.75, filter: 'blur(6px)' },
      '75%': { opacity: 0.95, filter: 'blur(2px)' },
      '100%': { transform: [{ translateX: 0 }], opacity: 1, filter: 'blur(0px)' },
    },
    animationDuration: '380ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.28, 1)',
    animationFillMode: 'both',
  },
  slideLeftBlur: {
    animationKeyframes: {
      '0%': { transform: [{ translateX: 110 }], opacity: 0.05, filter: 'blur(14px)' },
      '35%': { opacity: 0.75, filter: 'blur(6px)' },
      '75%': { opacity: 0.95, filter: 'blur(2px)' },
      '100%': { transform: [{ translateX: 0 }], opacity: 1, filter: 'blur(0px)' },
    },
    animationDuration: '380ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.28, 1)',
    animationFillMode: 'both',
  },
  subtleFadeIn: {
    animationKeyframes: {
      '0%': { opacity: 0.7 },
      '100%': { opacity: 1 },
    },
    animationDuration: '180ms',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  },
});

// ── Screen Transition Container with Motion Blur ───────────────────────────
function AnimatedContentArea({ pathname, direction, axis = 'vertical', children }) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'kheti-motion-blur-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @keyframes khetiSlideDownBlur {
          0% { opacity: 0.05; transform: translateY(-130px); filter: blur(16px); }
          35% { opacity: 0.75; filter: blur(8px); }
          75% { opacity: 0.95; filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes khetiSlideUpBlur {
          0% { opacity: 0.05; transform: translateY(130px); filter: blur(16px); }
          35% { opacity: 0.75; filter: blur(8px); }
          75% { opacity: 0.95; filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes khetiSlideRightBlur {
          0% { opacity: 0.05; transform: translateX(-110px); filter: blur(14px); }
          35% { opacity: 0.75; filter: blur(6px); }
          75% { opacity: 0.95; filter: blur(2px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0px); }
        }
        @keyframes khetiSlideLeftBlur {
          0% { opacity: 0.05; transform: translateX(110px); filter: blur(14px); }
          35% { opacity: 0.75; filter: blur(6px); }
          75% { opacity: 0.95; filter: blur(2px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0px); }
        }
        .kheti-slide-down-blur {
          animation: khetiSlideDownBlur 460ms cubic-bezier(0.16, 1, 0.28, 1) both !important;
          will-change: transform, filter, opacity;
          backface-visibility: hidden;
        }
        .kheti-slide-up-blur {
          animation: khetiSlideUpBlur 460ms cubic-bezier(0.16, 1, 0.28, 1) both !important;
          will-change: transform, filter, opacity;
          backface-visibility: hidden;
        }
        .kheti-slide-right-blur {
          animation: khetiSlideRightBlur 380ms cubic-bezier(0.16, 1, 0.28, 1) both !important;
          will-change: transform, filter, opacity;
          backface-visibility: hidden;
        }
        .kheti-slide-left-blur {
          animation: khetiSlideLeftBlur 380ms cubic-bezier(0.16, 1, 0.28, 1) both !important;
          will-change: transform, filter, opacity;
          backface-visibility: hidden;
        }
      `;
    }
  }, []);

  const isWeb = Platform.OS === 'web';
  const isForward = direction === 'forward';
  const isBackward = direction === 'backward';

  let webClassName = '';
  let webStyle = contentStyles.subtleFadeIn;

  if (axis === 'vertical') {
    // Desktop: Forward (downward in list) enters from bottom; Backward (upward in list) enters from top
    if (isForward) {
      webClassName = 'kheti-slide-up-blur';
      webStyle = contentStyles.slideUpBlur;
    } else if (isBackward) {
      webClassName = 'kheti-slide-down-blur';
      webStyle = contentStyles.slideDownBlur;
    }
  } else {
    // Smartphone: Forward (tapping right) enters from right; Backward (tapping left) enters from left
    if (isForward) {
      webClassName = 'kheti-slide-left-blur';
      webStyle = contentStyles.slideLeftBlur;
    } else if (isBackward) {
      webClassName = 'kheti-slide-right-blur';
      webStyle = contentStyles.slideRightBlur;
    }
  }

  // Native Reanimated Entering animation for Android / iOS
  const nativeEntering =
    axis === 'horizontal'
      ? isForward
        ? FadeInRight.duration(240).springify().damping(22).stiffness(260)
        : isBackward
        ? FadeInLeft.duration(240).springify().damping(22).stiffness(260)
        : FadeIn.duration(150)
      : isForward
      ? FadeInUp.duration(240).springify().damping(22).stiffness(260)
      : isBackward
      ? FadeInDown.duration(240).springify().damping(22).stiffness(260)
      : FadeIn.duration(150);

  if (!isWeb) {
    return (
      <Animated.View
        key={pathname}
        entering={nativeEntering}
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View
      key={pathname}
      className={webClassName}
      style={[
        {
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        webStyle,
      ]}
    >
      {children}
    </View>
  );
}

// ── Mobile Bottom Navigation Bar (Clean & Minimal Icon Dock) ───────────────
function MobileBottomBar({ role, pathname, insets }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const navItems = role === 'retailer' ? RETAILER_NAV_ITEMS : FARMER_NAV_ITEMS;

  const activeIndex = useMemo(
    () => getActiveNavIndex(navItems, pathname),
    [navItems, pathname],
  );

  const tabCount = navItems.length || 1;
  const tabWidth = width / tabCount;
  const pillMargin = 3;
  const pillWidth = Math.max(20, tabWidth - pillMargin * 2);

  const translateX = useSharedValue(
    activeIndex >= 0 ? activeIndex * tabWidth + pillMargin : 0,
  );
  const pillOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);
  const isInitial = useRef(true);

  useEffect(() => {
    if (activeIndex >= 0) {
      const targetX = activeIndex * tabWidth + pillMargin;
      if (isInitial.current) {
        isInitial.current = false;
        translateX.value = targetX;
        pillOpacity.value = 1;
      } else {
        translateX.value = withSpring(targetX, {
          damping: 24,
          stiffness: 280,
          mass: 0.75,
        });
        pillOpacity.value = withTiming(1, { duration: 150 });
      }
    } else {
      pillOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [activeIndex, tabWidth]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: pillOpacity.value,
  }));

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: '#E8E4DF',
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      {/* Animated Sliding Highlight Pill (Slides left/right) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            left: 0,
            width: pillWidth,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(46,125,50,0.08)',
            zIndex: 0,
            pointerEvents: 'none',
          },
          animatedPillStyle,
        ]}
      >
        {/* Top green accent indicator */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: Math.max(0, (pillWidth - 18) / 2),
            width: 18,
            height: 2.5,
            borderRadius: 1.5,
            backgroundColor: theme.colors.primary,
          }}
        />
      </Animated.View>

      {/* Tab Icon Buttons (Clean, icon-only) */}
      {navItems.map((item, index) => {
        const isFocused = activeIndex === index;
        const Icon = item.Icon;

        const handlePress = () => {
          if (!isFocused) {
            router.navigate(item.href);
          }
        };

        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={item.title}
            onPress={handlePress}
            style={{
              flex: 1,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              cursor: 'pointer',
            }}
          >
            <Icon
              color={isFocused ? theme.colors.primary : '#9E9189'}
              size={22}
              strokeWidth={isFocused ? 2.3 : 2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Desktop Sidebar Layout ────────────────────────────────────────────────
function WebSidebar({ role, profile, session }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === 'retailer' ? RETAILER_NAV_ITEMS : FARMER_NAV_ITEMS;

  const activeIndex = useMemo(
    () => getActiveNavIndex(navItems, pathname),
    [navItems, pathname],
  );

  const translateY = useSharedValue(
    activeIndex >= 0 ? activeIndex * NAV_ITEM_STEP : 0,
  );
  const indicatorOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (activeIndex >= 0) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        translateY.value = activeIndex * NAV_ITEM_STEP;
        indicatorOpacity.value = 1;
      } else {
        translateY.value = withSpring(activeIndex * NAV_ITEM_STEP, {
          damping: 24,
          stiffness: 280,
          mass: 0.75,
        });
        indicatorOpacity.value = withTiming(1, { duration: 150 });
      }
    } else {
      indicatorOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [activeIndex]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: indicatorOpacity.value,
  }));

  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    'User';

  return (
    <View
      style={{
        width: 260,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: '#E8E4DF',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo / App Name */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 28,
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EDE8',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 44, height: 44, borderRadius: 12, marginRight: 12 }}
            resizeMode="contain"
          />
          <View>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: theme.colors.text,
              }}
            >
              KhetiTantra
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(46,125,50,0.08)',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 6,
                alignSelf: 'flex-start',
                marginTop: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 10,
                  color: '#2E7D32',
                  textTransform: 'capitalize',
                }}
              >
                {role} Workspace
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Nav Items Container with Animated Sliding Highlight */}
      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 12,
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Animated Highlight Indicator Pill that glides up/down */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 12,
              right: 12,
              top: 16,
              height: NAV_ITEM_HEIGHT,
              borderRadius: 12,
              backgroundColor: 'rgba(46,125,50,0.08)',
              zIndex: 0,
              pointerEvents: 'none',
            },
            animatedIndicatorStyle,
          ]}
        >
          {/* Left Vertical Indicator Accent */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 8,
              bottom: 8,
              width: 3.5,
              borderRadius: 2,
              backgroundColor: theme.colors.primary,
            }}
          />
        </Animated.View>

        {/* Navigation Buttons */}
        {navItems.map((item, index) => {
          const active = activeIndex === index;
          const Icon = item.Icon;

          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.href)}
              style={({ hovered }) => ({
                height: NAV_ITEM_HEIGHT,
                marginBottom: NAV_ITEM_MARGIN,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor:
                  hovered && !active ? 'rgba(62,39,35,0.03)' : 'transparent',
                zIndex: 1,
                cursor: 'pointer',
              })}
            >
              <Icon
                color={active ? theme.colors.primary : '#9E9189'}
                size={20}
                strokeWidth={active ? 2.3 : 2}
              />
              <Text
                style={{
                  fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                  fontSize: 14,
                  color: active ? theme.colors.primary : '#6D4C41',
                  marginLeft: 14,
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* User profile strip */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile')}
        style={({ hovered }) => ({
          marginHorizontal: 12,
          marginBottom: 10,
          padding: 10,
          borderRadius: 14,
          backgroundColor: hovered ? '#EFEFEA' : '#F5F5F0',
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.05)',
          flexDirection: 'row',
          alignItems: 'center',
          cursor: 'pointer',
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#E8F5E9',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: 'rgba(46,125,50,0.15)',
          }}
        >
          <User size={18} color="#2E7D32" strokeWidth={2} />
        </View>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 13,
              color: '#3E2723',
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 11,
              color: '#9E9189',
              textTransform: 'capitalize',
            }}
          >
            {role} account
          </Text>
        </View>
      </Pressable>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingBottom: 20,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#F0EDE8',
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 11,
            color: '#9E9189',
          }}
        >
          © 2026 KhetiTantra
        </Text>
      </View>
    </View>
  );
}

// ── Root Tab Layout ────────────────────────────────────────────────────────
export default function TabLayout() {
  const { session, profile, isLoading } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const role = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = role === 'retailer';
  const isWideWeb = Platform.OS === 'web' && width >= 768;

  const navItems = isRetailer ? RETAILER_NAV_ITEMS : FARMER_NAV_ITEMS;
  const currentNavIndex = useMemo(
    () => getActiveNavIndex(navItems, pathname),
    [navItems, pathname],
  );

  // Synchronous direction derivation: calculates transition direction DURING render
  // so the incoming screen mounts with the correct animation class on frame 0 with ZERO split-second flash!
  const [navState, setNavState] = useState({
    prevPathname: pathname,
    prevIndex: currentNavIndex,
    direction: 'none',
  });

  if (pathname !== navState.prevPathname) {
    let newDirection = 'none';
    if (
      currentNavIndex !== -1 &&
      navState.prevIndex !== -1 &&
      currentNavIndex !== navState.prevIndex
    ) {
      newDirection = currentNavIndex > navState.prevIndex ? 'forward' : 'backward';
    }
    setNavState({
      prevPathname: pathname,
      prevIndex: currentNavIndex,
      direction: newDirection,
    });
  }

  const direction = navState.direction;

  if (!isLoading && !session) {
    return <Redirect href="/(auth)" />;
  }

  // Desktop Layout (Left Sidebar + Vertical Slide with Motion Blur)
  if (isWideWeb) {
    return (
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          height: Platform.OS === 'web' ? '100vh' : '100%',
          backgroundColor: theme.colors.background,
        }}
      >
        <WebSidebar role={role} profile={profile} session={session} />
        <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          <AnimatedContentArea
            pathname={pathname}
            direction={direction}
            axis="vertical"
          >
            <Slot />
          </AnimatedContentArea>
        </View>
      </View>
    );
  }

  // Smartphone Layout (Horizontal Slide with Motion Blur + Minimal Bottom Bar)
  return (
    <View
      style={{
        flex: 1,
        height: Platform.OS === 'web' ? '100vh' : '100%',
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatedContentArea
          pathname={pathname}
          direction={direction}
          axis="horizontal"
        >
          <Slot />
        </AnimatedContentArea>
      </View>
      <MobileBottomBar
        role={role}
        pathname={pathname}
        insets={insets}
      />
    </View>
  );
}
