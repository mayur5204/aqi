// src/services/api.ts
const BASE_URL = "https://mayur0264-aqi-monitor.hf.space";

export interface SensorReading {
  ts:          string;
  temperature: number;
  humidity:    number;
  heat_index?: number;
  pm25_ugm3?:  number;
  pm10_ugm3?:  number;
  dust_ugm3:   number;
  co_mgm3:     number;
  co_ppm?:     number;
  aqi:         number;
  bucket:      string;
  forecast:    ForecastPoint[];
}

export interface ForecastPoint {
  hour_offset: number;
  hour:        number;
  aqi:         number;
  bucket:      string;
}

export interface HistoryReading {
  ts:          string;
  aqi_predicted: number;
  aqi_bucket:  string;
  temperature: number;
  humidity:    number;
  dust_ugm3:   number;
  co_mgm3:     number;
}

export interface HealthAdvice {
  aqi:               number;
  aqi_label:         string;
  risk_level:        "low" | "moderate" | "high" | "critical";
  risk_color:        string;
  conditions_flagged: string[];
  primary_alert:     string | null;
  outdoor_advice:    string;
  mask_advice:       string;
  windows_advice:    string;
  activity_advice:   string;
  condition_specific: Record<string, string>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  getLatest: (deviceId = "esp32_pune_001") =>
    apiFetch<SensorReading>(`/latest?device_id=${deviceId}`),

  getHistory: (deviceId = "esp32_pune_001", limit = 48) =>
    apiFetch<{ readings: HistoryReading[] }>(
      `/history?device_id=${deviceId}&limit=${limit}`
    ),

  getHealthAdvice: (aqi: number, age: number, conditions: string[]) =>
    apiFetch<HealthAdvice>("/health-advice", {
      method: "POST",
      body: JSON.stringify({ aqi, age, conditions }),
    }),
};
