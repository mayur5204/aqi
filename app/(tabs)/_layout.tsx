import { Tabs } from 'expo-router';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { StyleSheet, useColorScheme } from 'react-native';
import { Colors, getTheme } from '../../src/theme';

const TabIcon = ({ name, color, size }: { name: string, color: string, size: number }) => {
  switch (name) {
    case 'live':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Circle cx="12" cy="12" r="4" />
        </Svg>
      );
    case 'forecast':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
      );
    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = getTheme(isDark);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.textPrimary,
      tabBarInactiveTintColor: theme.textSecondary,
      headerShown: false,
      tabBarStyle: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: theme.tabBarBg,
        borderTopWidth: 0,
        elevation: theme.shadow.elevation,
        shadowColor: theme.shadow.shadowColor,
        shadowOffset: theme.shadow.shadowOffset,
        shadowOpacity: theme.shadow.shadowOpacity,
        shadowRadius: theme.shadow.shadowRadius,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: theme.glassBorder,
      },
      tabBarBackground: () => null,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Live',
          tabBarIcon: ({ color, size }) => <TabIcon name="live" color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="forecast" 
        options={{ 
          title: 'Forecast',
          tabBarIcon: ({ color, size }) => <TabIcon name="forecast" color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarIcon: ({ color, size }) => <TabIcon name="history" color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} />
        }} 
      />
    </Tabs>
  );
}
