import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUserProfile } from '../src/hooks/useUserProfile';

const queryClient = new QueryClient();

// A wrapper component that initializes our hooks at the root level
function RootHookInitializer({ children }: { children: React.ReactNode }) {
  useUserProfile(); // Load user profile immediately and keep it synchronized across the app
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootHookInitializer>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </RootHookInitializer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
