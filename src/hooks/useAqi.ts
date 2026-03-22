// src/hooks/useAqi.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

// Polls latest reading every 2 minutes
export function useLatestReading(deviceId = "esp32_pune_001") {
  return useQuery({
    queryKey:    ["latest", deviceId],
    queryFn:     () => api.getLatest(deviceId),
    refetchInterval: 2 * 60 * 1000,
    staleTime:       60 * 1000,
    retry: 3,
  });
}

// History — configurable limit
export function useHistory(deviceId = "esp32_pune_001", limit = 48) {
  return useQuery({
    queryKey:    ["history", deviceId, limit],
    queryFn:     () => api.getHistory(deviceId, limit),
    refetchInterval: 5 * 60 * 1000,
    staleTime:       2 * 60 * 1000,
  });
}

// Personalized health advice — depends on latest AQI + user profile
export function useHealthAdvice(
  params?: { aqi: number; age: number; conditions: string[] }
) {
  return useQuery({
    queryKey:    ["health", params?.aqi, params?.age, params?.conditions],
    queryFn:     () => api.getHealthAdvice(params!.aqi, params!.age, params!.conditions),
    enabled:     !!params && params.aqi > 0,
    staleTime:   5 * 60 * 1000,
  });
}
