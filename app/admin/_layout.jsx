import { Tabs, Redirect, Slot, usePathname, useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Wallet,
  Shield,
  ArrowLeft,
  ChevronRight,
  LogOut,
  User,
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

const ADMIN_NAV_ITEMS = [
  { name: 'index', title: 'Dashboard', Icon: LayoutDashboard, href: '/admin' },
  { name: 'users', title: 'User Directory', Icon: Users, href: '/admin/users' },
  { name: 'crops', title: 'Crop Oversight', Icon: Sprout, href: '/admin/crops' },
  {
    name: 'transactions',
    title: 'Global Ledger',
    Icon: Wallet,
    href: '/admin/transactions',
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, session } = useStore();

  const getIsActive = (name) => {
    if (name === 'index')
      return pathname === '/admin' || pathname === '/admin/';
    return pathname === `/${name}` || pathname === `/admin/${name}`;
  };

  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Super Admin';

  return (
    <View
      style={{
        width: 270,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E8E4DF',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand & Back Button Header */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 28,
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EDE8',
        }}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
            backgroundColor: 'rgba(62,39,35,0.05)',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <ArrowLeft size={14} color="#6D4C41" strokeWidth={2.2} />
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 12,
              color: '#6D4C41',
              marginLeft: 6,
            }}
          >
            Back to Main App
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#E8F5E9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1.5,
              borderColor: 'rgba(46,125,50,0.2)',
            }}
          >
            <Shield size={24} color="#2E7D32" strokeWidth={2.2} />
          </View>
          <View>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: '#3E2723',
              }}
            >
              KhetiTantra
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(46,125,50,0.1)',
                paddingHorizontal: 7,
                paddingVertical: 1.5,
                borderRadius: 6,
                alignSelf: 'flex-start',
                marginTop: 2,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: '#2E7D32',
                  marginRight: 4,
                }}
              />
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 10,
                  color: '#2E7D32',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Control Panel
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Nav Navigation Items */}
      <View style={{ paddingTop: 18, paddingHorizontal: 14, flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 11,
            color: '#9E9189',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            paddingHorizontal: 12,
            marginBottom: 8,
          }}
        >
          Administration
        </Text>

        {ADMIN_NAV_ITEMS.map(({ name, title, Icon, href }) => {
          const active = getIsActive(name);
          return (
            <Pressable
              key={name}
              onPress={() => router.push(href)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: active ? 'rgba(46,125,50,0.08)' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: active ? 'rgba(46,125,50,0.15)' : 'transparent',
              }}
            >
              <Icon
                size={19}
                color={active ? '#2E7D32' : '#6D4C41'}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <Text
                style={{
                  fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                  fontSize: 14,
                  color: active ? '#2E7D32' : '#3E2723',
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                {title}
              </Text>
              {active && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#2E7D32',
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Bottom User Card / Footer */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#F0EDE8',
        }}
      >
        <View
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: '#F5F5F0',
            borderWidth: 1,
            borderColor: 'rgba(62,39,35,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#E8F5E9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              borderWidth: 1,
              borderColor: 'rgba(46,125,50,0.2)',
            }}
          >
            <User size={18} color="#2E7D32" strokeWidth={2.2} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <Shield size={10} color="#2E7D32" />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: '#2E7D32',
                }}
              >
                Super Admin
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 11,
            color: '#9E9189',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          KhetiTantra Admin Engine v2.4
        </Text>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const { session, isLoading } = useStore();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: '#FFEBEE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: '#FFCDD2',
          }}
        >
          <Shield size={44} color="#D32F2F" strokeWidth={1.8} />
        </View>
        <Text
          className="text-soil text-2xl font-bold text-center"
          style={{ fontFamily: 'Inter-Bold' }}
        >
          Admin Access Required
        </Text>
        <Text
          className="text-soil-muted text-sm text-center mt-2 max-w-sm"
          style={{ fontFamily: 'Inter-Regular', lineHeight: 20 }}
        >
          Your account is not recognized as a system super administrator. Access to this management zone is restricted.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={{
            marginTop: 24,
            backgroundColor: '#2E7D32',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 14 }}>
            Return to Main App
          </Text>
        </Pressable>
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
          height: Platform.OS === 'web' ? '100vh' : '100%',
          backgroundColor: theme.colors.background,
        }}
      >
        <AdminSidebar />
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
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#6D4C41',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8E4DF',
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
          title: 'Ledger',
          tabBarIcon: ({ color, size }) => (
            <Wallet color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
