import { Tabs, Redirect, Slot, usePathname } from 'expo-router';
import { House, Wallet, Bot, User, Sprout } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { Platform, useWindowDimensions, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Sidebar (web only, wide viewport)
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: House, href: '/(tabs)' },
  { name: 'crops', title: 'Crops', Icon: Sprout, href: '/(tabs)/crops' },
  { name: 'ledger', title: 'Ledger', Icon: Wallet, href: '/(tabs)/ledger' },
  { name: 'assistant', title: 'AI Assistant', Icon: Bot, href: '/(tabs)/assistant' },
  { name: 'profile', title: 'Profile', Icon: User, href: '/(tabs)/profile' },
] as const;

function WebSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const getIsActive = (name: string) => {
    if (name === 'index') return pathname === '/' || pathname === '';
    return pathname === `/${name}`;
  };

  return (
    <View
      style={{
        width: 260,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: '#E8E4DF',
        height: '100%' as any,
      }}
    >
      {/* Logo / App Name */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 28,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EDE8',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: theme.colors.text }}>
              KhetiTantra
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#6D4C41', marginTop: 1 }}>
              Farm Management
            </Text>
          </View>
        </View>
      </View>

      {/* Nav Items */}
      <View style={{ paddingTop: 16, paddingHorizontal: 12, flex: 1 }}>
        {NAV_ITEMS.map(({ name, title, Icon, href }) => {
          const active = getIsActive(name);
          return (
            <Pressable
              key={name}
              onPress={() => router.push(href as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: active ? 'rgba(46,125,50,0.08)' : 'transparent',
              }}
            >
              <Icon
                size={20}
                color={active ? theme.colors.primary : theme.colors.text}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <Text
                style={{
                  fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                  fontSize: 15,
                  color: active ? theme.colors.primary : theme.colors.text,
                  marginLeft: 14,
                }}
              >
                {title}
              </Text>
              {active && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#F0EDE8',
        }}
      >
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
          © 2026 KhetiTantra
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export default function TabLayout() {
  const { session, isLoading } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  // ── Wide-screen web: sidebar + Slot ───────────────────────
  const isWideWeb = Platform.OS === 'web' && width >= 768;

  if (isWideWeb) {
    return (
      <View style={{ flexDirection: 'row', flex: 1, backgroundColor: theme.colors.background }}>
        <WebSidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    );
  }

  // ── Mobile / narrow: default bottom tabs ──────────────────
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.background,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
