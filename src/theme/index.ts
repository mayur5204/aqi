export const Colors = {
  background:    '#F5F5F5',
  card:          '#FFFFFF',
  primary:       '#2563EB',
  border:        '#E5E5E5',
  textPrimary:   '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary:  '#A0A0A0',
  white:         '#FFFFFF',
  // Glassmorphism specific
  glassText:     '#FFFFFF',
  glassSubtext:  'rgba(255,255,255,0.7)',
  glassCard:     'rgba(255,255,255,0.15)',
  glassBorder:   'rgba(255,255,255,0.25)',
  glassDarkCard: 'rgba(0,0,0,0.25)',
};

export interface AqiBand {
  key: string;
  lo: number;
  hi: number;
  color: string;
  bg: string;
  text: string;
  label: string;
  gradients: readonly [string, string];
}

export const AQI_BANDS: AqiBand[] = [
  { key: "good",         lo: 0,   hi: 50,  color: "#1D9E75", bg: "#E1F5EE", text: "#085041", label: "Good",         gradients: ["#022E22", "#0F7D5A"] },
  { key: "satisfactory", lo: 51,  hi: 100, color: "#639922", bg: "#EAF3DE", text: "#27500A", label: "Satisfactory", gradients: ["#1F3D06", "#528514"] },
  { key: "moderate",     lo: 101, hi: 200, color: "#BA7517", bg: "#FAEEDA", text: "#633806", label: "Moderate",     gradients: ["#4A2D03", "#A8650A"] },
  { key: "poor",         lo: 201, hi: 300, color: "#D85A30", bg: "#FAECE7", text: "#712B13", label: "Poor",         gradients: ["#541C0A", "#C74418"] },
  { key: "very_poor",    lo: 301, hi: 400, color: "#A32D2D", bg: "#FCEBEB", text: "#501313", label: "Very Poor",    gradients: ["#450E0E", "#9C2222"] },
  { key: "severe",       lo: 401, hi: 500, color: "#534AB7", bg: "#EEEDFE", text: "#26215C", label: "Severe",       gradients: ["#1B1745", "#473EA3"] },
];

export const getAqiBand = (aqi: number): AqiBand => {
  for (const band of AQI_BANDS) {
    if (aqi >= band.lo && aqi <= band.hi) return band;
  }
  return AQI_BANDS[5];
};

export const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  low:      { color: "#1D9E75", bg: "#E1F5EE" },
  moderate: { color: "#BA7517", bg: "#FAEEDA" },
  high:     { color: "#D85A30", bg: "#FAECE7" },
  severe:   { color: "#A32D2D", bg: "#FCEBEB" },
};

export const CONDITION_LABELS: Record<string, string> = {
  asthma:        "Asthma / Respiratory",
  heart_disease: "Heart Disease",
  diabetes:      "Diabetes",
  pregnancy:     "Pregnancy",
  elderly:       "Elderly (65+)",
  children:      "Children (<12)",
  healthy:       "Generally Healthy",
};

// --- Theme Helper for Global Light/Dark Support ---
export const getTheme = (isDark: boolean) => ({
  backgroundGradients: isDark 
    ? ['#0A1931', '#15305B'] as const 
    : ['#E6F0FA', '#FFFFFF'] as const,
  textPrimary: isDark ? '#FFFFFF' : '#1A2B3C',
  textSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,43,60,0.7)',
  glassCard: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
  glassBorder: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
  tabBarBg: isDark ? 'rgba(10, 25, 49, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  shadow: isDark 
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }
});
