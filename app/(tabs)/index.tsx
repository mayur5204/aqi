import React, { useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLatestReading, useHealthAdvice } from "../../src/hooks/useAqi";
import { useUserProfile } from "../../src/hooks/useUserProfile";
import { getAqiBand, RISK_COLORS, getTheme } from "../../src/theme";
import { formatDistanceToNow } from "date-fns";

// ─── Glowing AQI Orb ───────────────────────────────────────────────────────
function GlowingOrb({ aqi, band, themeStyles }: { aqi: number; band: ReturnType<typeof getAqiBand>, themeStyles: any }) {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={themeStyles.orbContainer}>
      <Animated.View style={[themeStyles.orbGlow, { backgroundColor: band.color }, animatedStyle]} />
      <View style={[themeStyles.orbInner, { backgroundColor: band.color, shadowColor: band.color }]}>
        <Text style={themeStyles.orbText}>{Math.round(aqi)}</Text>
        <Text style={themeStyles.orbLabel}>AQI</Text>
      </View>
    </View>
  );
}

// ─── Pollutant Bar ────────────────────────────────────────────────────────
function PollutantBar({ label, value, unit, max, color, themeStyles }: { label: string; value: number; unit: string; max: number; color: string; themeStyles: any }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={themeStyles.barContainer}>
      <View style={themeStyles.barHeader}>
        <Text style={themeStyles.barLabel}>{label}</Text>
        <Text style={themeStyles.barValue}>{value.toFixed(1)} <Text style={themeStyles.barUnit}>{unit}</Text></Text>
      </View>
      <View style={themeStyles.barTrack}>
        <View style={[themeStyles.barFill, { width: `${isNaN(pct) ? 0 : pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Health Advice Card ───────────────────────────────────────────────────
function DetailedAdvice({ advice, isDark, themeStyles }: { advice: any, isDark: boolean, themeStyles: any }) {
  if (!advice) return null;
  const riskKey = (advice.risk_level || "low") as string;
  const risk = RISK_COLORS[riskKey] || RISK_COLORS.low;

  return (
    <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={themeStyles.adviceCard}>
      <Text style={[themeStyles.adviceRisk, { color: risk.color }]}>
        Risk Level: {(advice.risk_level || "").toUpperCase()}
      </Text>
      {advice.primary_alert && (
        <View style={[themeStyles.alertBanner, { backgroundColor: risk.color }]}>
          <Text style={themeStyles.alertText}>{advice.primary_alert}</Text>
        </View>
      )}
      <View style={themeStyles.adviceSection}>
        <Text style={themeStyles.adviceLabel}>Outdoors</Text>
        <Text style={themeStyles.adviceText}>{advice.outdoor_advice}</Text>
      </View>
      <View style={themeStyles.adviceSpacer} />
      <View style={themeStyles.adviceSection}>
        <Text style={themeStyles.adviceLabel}>Mask</Text>
        <Text style={themeStyles.adviceText}>{advice.mask_advice}</Text>
      </View>
      <View style={themeStyles.adviceSpacer} />
      <View style={themeStyles.adviceSection}>
        <Text style={themeStyles.adviceLabel}>Windows & Indoors</Text>
        <Text style={themeStyles.adviceText}>{advice.windows_advice}</Text>
      </View>
      <View style={themeStyles.adviceSpacer} />
      <View style={themeStyles.adviceSection}>
        <Text style={themeStyles.adviceLabel}>Activity</Text>
        <Text style={themeStyles.adviceText}>{advice.activity_advice}</Text>
      </View>
    </BlurView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useLatestReading();
  const { user, profile } = useUserProfile();
  const { data: advice } = useHealthAdvice(data ? {
    aqi: data.aqi,
    age: user && profile?.age ? profile.age : 30,
    conditions: user && profile?.conditions?.length ? profile.conditions : ['healthy'],
  } : undefined);

  const isDark = useColorScheme() === 'dark';
  const theme = getTheme(isDark);
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  const band = data ? getAqiBand(data.aqi) : null;
  const ago = data?.ts ? formatDistanceToNow(new Date(data.ts), { addSuffix: true }) : null;

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
          <Text style={styles.loadingText}>Analyzing Air Quality…</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorText}>Could not load atmospheric data.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe}>
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.textPrimary} />}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.cityText}>Pune, MH</Text>
              <Text style={styles.liveIndicator}>● Live Sensor Data</Text>
            </View>
            <Text style={styles.timeText}>{ago}</Text>
          </View>

          {band && (
            <View style={styles.orbSection}>
              <GlowingOrb aqi={data.aqi} band={band} themeStyles={styles} />
              <View style={[styles.bandPill, { backgroundColor: theme.glassCard }]}>
                <Text style={styles.bandPillText}>{band.label}</Text>
              </View>
            </View>
          )}

          <BlurView intensity={isDark ? 25 : 60} tint={isDark ? "dark" : "light"} style={styles.blurCard}>
            <Text style={styles.sectionTitle}>Pollutants</Text>
            <PollutantBar label="PM2.5" value={data.pm25_ugm3 ?? data.dust_ugm3} unit="µg/m³" max={100} color="#FF5A5F" themeStyles={styles} />
            {data.pm10_ugm3 !== undefined && (
              <PollutantBar label="PM10" value={data.pm10_ugm3} unit="µg/m³" max={200} color="#FF9A00" themeStyles={styles} />
            )}
            <PollutantBar label="CO" value={data.co_ppm ?? data.co_mgm3} unit={data.co_ppm !== undefined ? "ppm" : "mg/m³"} max={data.co_ppm !== undefined ? 50 : 10} color="#00A699" themeStyles={styles} />
            
            <View style={styles.microMetrics}>
              <View style={styles.microMetric}>
                <Text style={styles.microLabel}>Temp</Text>
                <Text style={styles.microValue}>{data.temperature.toFixed(1)}°C</Text>
              </View>
              <View style={styles.microDivider} />
              <View style={styles.microMetric}>
                <Text style={styles.microLabel}>Humidity</Text>
                <Text style={styles.microValue}>{data.humidity.toFixed(1)}%</Text>
              </View>
              {data.heat_index !== undefined && (
                <>
                  <View style={styles.microDivider} />
                  <View style={styles.microMetric}>
                    <Text style={styles.microLabel}>Heat Idx</Text>
                    <Text style={styles.microValue}>{data.heat_index.toFixed(1)}°C</Text>
                  </View>
                </>
              )}
            </View>
          </BlurView>

          {advice && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitleOver}>{user ? "Your Health Advisory" : "General Health Advisory"}</Text>
              <DetailedAdvice advice={advice} isDark={isDark} themeStyles={styles} />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  scroll: { padding: 20 },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 },
  cityText: { fontSize: 24, fontWeight: "600", color: theme.textPrimary, letterSpacing: 0.5 },
  liveIndicator: { fontSize: 13, color: theme.textSecondary, marginTop: 4, fontWeight: "500" },
  timeText: { fontSize: 12, color: theme.textSecondary, marginTop: 6 },
  
  orbSection: { alignItems: "center", marginBottom: 40 },
  orbContainer: { width: 220, height: 220, alignItems: "center", justifyContent: "center", position: "relative" },
  orbGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, opacity: 0.4 },
  orbInner: { width: 170, height: 170, borderRadius: 85, alignItems: "center", justifyContent: "center", ...theme.shadow },
  orbText: { fontSize: 62, fontWeight: "700", color: "#FFF", letterSpacing: -1 },
  orbLabel: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginTop: -5 },
  bandPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 30, marginTop: -10, borderWidth: 1, borderColor: theme.glassBorder },
  bandPillText: { color: theme.textPrimary, fontSize: 15, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },

  blurCard: { borderRadius: 20, padding: 20, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, ...theme.shadow, backgroundColor: theme.glassCard },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.textPrimary, marginBottom: 16 },
  sectionTitleOver: { fontSize: 16, fontWeight: "600", color: theme.textPrimary, marginBottom: 12, marginLeft: 4 },

  barContainer: { marginBottom: 16 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: "500" },
  barValue: { fontSize: 14, color: theme.textPrimary, fontWeight: "600" },
  barUnit: { fontSize: 11, color: theme.textSecondary, fontWeight: "400" },
  barTrack: { height: 8, backgroundColor: theme.glassBorder, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },

  microMetrics: { flexDirection: "row", marginTop: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.glassBorder },
  microMetric: { flex: 1, alignItems: "center" },
  microDivider: { width: 1, backgroundColor: theme.glassBorder },
  microLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  microValue: { fontSize: 16, color: theme.textPrimary, fontWeight: "600" },

  adviceCard:     { borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, overflow: "hidden", ...theme.shadow },
  adviceRisk:     { fontSize: 18, fontWeight: "700", letterSpacing: 0.5, marginBottom: 16 },
  alertBanner:    { padding: 16, borderRadius: 12, marginBottom: 20 },
  alertText:      { fontSize: 16, fontWeight: "600", color: "#FFF", lineHeight: 24 },
  adviceSection:  { gap: 8 },
  adviceSpacer:   { height: 1, backgroundColor: theme.glassBorder, marginVertical: 16 },
  adviceLabel:    { fontSize: 14, fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
  adviceText:     { fontSize: 16, color: theme.textPrimary, lineHeight: 24 },

  loadingText: { color: theme.textSecondary, marginTop: 12, fontSize: 15, fontWeight: "500" },
  errorText: { color: theme.textPrimary, fontSize: 16, fontWeight: "500", textAlign: "center", marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.glassCard, borderRadius: 12, borderWidth: 1, borderColor: theme.glassBorder },
  retryText: { color: theme.textPrimary, fontSize: 15, fontWeight: "600" },
});
