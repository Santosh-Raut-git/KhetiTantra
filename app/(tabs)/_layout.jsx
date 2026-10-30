import { Tabs, Redirect, Slot, usePathname } from 'expo-router';
import { House, Wallet, Bot, User, Sprout, Store, ShoppingCart, Package, Users } from 'lucide-react-native';
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
} from 'react-native';
import { useRouter } from 'expo-router';

const FARMER_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: House, href: '/(tabs)' },
  { name: 'crops', title: 'Crops', Icon: Sprout, href: '/(tabs)/crops' },
  { name: 'ledger', title: 'Ledger', Icon: Wallet, href: '/(tabs)/ledger' },
  { name: 'marketplace', title: 'Marketplace', Icon: Store, href: '/(tabs)/marketplace' },
  { name: 'assistant', title: 'AI Assistant', Icon: Bot, href: '/(tabs)/assistant' },
  { name: 'profile', title: 'Profile', Icon: User, href: '/(tabs)/profile' },
];

const RETAILER_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: House, href: '/(tabs)' },
  { name: 'marketplace', title: 'Marketplace', Icon: Store, href: '/(tabs)/marketplace' },
  { name: 'orders', title: 'Orders', Icon: Package, href: '/(tabs)/orders' },
  { name: 'network', title: 'Network', Icon: Users, href: '/(tabs)/network' },
  { name: 'assistant', title: 'AI Assistant', Icon: Bot, href: '/(tabs)/assistant' },
  { name: 'profile', title: 'Profile', Icon: User, href: '/(tabs)/profile' },
];

function WebSidebar({ role, profile, session }) {
  const pathname = usePathname();
  const router = useRouter();

  const getIsActive = (name) => {
    if (name === 'index') return pathname === '/' || pathname === '' || pathname === '/(tabs)' || pathname === '/(tabs)/';
    return pathname === `/${name}` || pathname === `/(tabs)/${name}`;
  };

  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
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

      {/* Nav Items */}
      <View style={{ paddingTop: 16, paddingHorizontal: 12, flex: 1 }}>
        {(role === 'retailer' ? RETAILER_NAV_ITEMS : FARMER_NAV_ITEMS).map(({ name, title, Icon, href }) => {
          const active = getIsActive(name);
          return (
            <Pressable
              key={name}
              onPress={() => router.push(href)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: active
                  ? 'rgba(46,125,50,0.08)'
                  : 'transparent',
              }}
            >
              <Icon
                size={19}
                color={active ? theme.colors.primary : theme.colors.text}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <Text
                style={{
                  fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                  fontSize: 14,
                  color: active ? theme.colors.primary : theme.colors.text,
                  marginLeft: 13,
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

      {/* User profile strip */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile')}
        style={{
          marginHorizontal: 12,
          marginBottom: 10,
          padding: 10,
          borderRadius: 14,
          backgroundColor: getIsActive('profile') ? 'rgba(46,125,50,0.08)' : '#F5F5F0',
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.05)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
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

export default function TabLayout() {
  const { session, profile, isLoading } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (!isLoading && !session) {
    return <Redirect href="/(auth)" />;
  }
  
  const role = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = role === 'retailer';
  const isWideWeb = Platform.OS === 'web' && width >= 768;

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
          <Slot />
        </View>
      </View>
    );
  }

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
      }}
    >
      {/* Shared Tabs — Dashboard + Marketplace visible to all */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2} /> }}
      />

      {/* Farmer-only Tabs */}
      {!isRetailer && (
        <Tabs.Screen
          name="crops"
          options={{ title: 'Crops', tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} strokeWidth={2} /> }}
        />
      )}
      {!isRetailer && (
        <Tabs.Screen
          name="ledger"
          options={{ title: 'Ledger', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} strokeWidth={2} /> }}
        />
      )}

      <Tabs.Screen
        name="marketplace"
        options={{ title: 'Marketplace', tabBarIcon: ({ color, size }) => <Store color={color} size={size} strokeWidth={2} /> }}
      />

      {/* Retailer-only Tabs */}
      {isRetailer && (
        <Tabs.Screen
          name="orders"
          options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Package color={color} size={size} strokeWidth={2} /> }}
        />
      )}
      {isRetailer && (
        <Tabs.Screen
          name="network"
          options={{ title: 'Network', tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} /> }}
        />
      )}

      {/* Shared Tabs */}
      <Tabs.Screen
        name="assistant"
        options={{ title: 'AI Assistant', tabBarIcon: ({ color, size }) => <Bot color={color} size={size} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} /> }}
      />

      {/* Hide role-specific routes from the other role's tab bar */}
      {isRetailer && (
        <Tabs.Screen name="crops" options={{ href: null }} />
      )}
      {isRetailer && (
        <Tabs.Screen name="ledger" options={{ href: null }} />
      )}
      {!isRetailer && (
        <Tabs.Screen name="orders" options={{ href: null }} />
      )}
      {!isRetailer && (
        <Tabs.Screen name="network" options={{ href: null }} />
      )}
    </Tabs>
  );
}
