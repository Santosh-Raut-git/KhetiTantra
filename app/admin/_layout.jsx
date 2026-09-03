import { Tabs, Redirect, Slot, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Wallet,
  Shield,
  ArrowLeft,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { useIsAdmin } from '@/lib/api/admin';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const ADMIN_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: LayoutDashboard, href: '/admin' },
  { name: 'users', title: 'Users', Icon: Users, href: '/admin/users' },
  { name: 'crops', title: 'Crops', Icon: Sprout, href: '/admin/crops' },
  {
    name: 'transactions',
    title: 'Transactions',
    Icon: Wallet,
    href: '/admin/transactions',
  },
];
function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const getIsActive = (name) => {
    if (name === 'index')
      return pathname === '/' || pathname === '' || pathname === '/admin';
    return pathname === `/${name}` || pathname === `/admin/${name}`;
  };
  return (
    <View
      style={{
        width: 260,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: '#E8E4DF',
        height: '100%',
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 28,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EDE8',
        }}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} color="#6D4C41" />
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 13,
              color: '#6D4C41',
              marginLeft: 6,
            }}
          >
            Back to App
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
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
              Super Admin
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 12,
                color: '#6D4C41',
                marginTop: 1,
              }}
            >
              Control Panel
            </Text>
          </View>
        </View>
      </View>

      {/* Nav Items */}
      <View style={{ paddingTop: 16, paddingHorizontal: 12, flex: 1 }}>
        {ADMIN_NAV_ITEMS.map(({ name, title, Icon, href }) => {
          const active = getIsActive(name);
          return (
            <Pressable
              key={name}
              onPress={() => router.push(href)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: active
                  ? 'rgba(46,125,50,0.08)'
                  : 'transparent',
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
    </View>
  );
}

export default function AdminLayout() {
  const { session, isLoading } = useStore();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (isLoading || adminLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }
  if (!session) {
    return <Redirect href="/(auth)" />;
  }
  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center px-8">
        <Shield size={64} color="#D32F2F" strokeWidth={1.5} />
        <Text
          className="text-soil text-2xl font-bold mt-6 text-center"
          style={{ fontFamily: 'Inter-Bold' }}
        >
          Access Denied
        </Text>
        <Text
          className="text-soil-muted text-base text-center mt-3"
          style={{ fontFamily: 'Inter-Regular' }}
        >
          You do not have super admin privileges to access this panel.
        </Text>
      </SafeAreaView>
    );
  }
  const isWideWeb = Platform.OS === 'web' && width >= 768;
  if (isWideWeb) {
    return (
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <AdminSidebar />
        <View style={{ flex: 1 }}>
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color, size }) => (
            <Sprout color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Wallet color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
