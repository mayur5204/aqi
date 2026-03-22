import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions, useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Text as SvgText, Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLatestReading } from "../../src/hooks/useAqi";
import { getAqiBand, AQI_BANDS, getTheme } from "../../src/theme";

const W = Dimensions.get("window").width - 32;
const H = 220;
const PAD = { top: 30, right: 16, bottom: 40, left: 40 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function ForecastChart({ points, isDark, theme }: { points: { hour: number; aqi: number; hour_offset: number }[], isDark: boolean, theme: any }) {
  if (!points.length) return null;
  const all = points.map((p) => p.aqi);
  const minAqi = Math.max(0, Math.min(...all) - 10);
  const maxAqi = Math.min(500, Math.max(...all) + 10);
  const range  = maxAqi - minAqi || 1;

  const toX = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * PLOT_W;
  const toY = (aqi: number) => PAD.top + PLOT_H - ((aqi - minAqi) / range) * PLOT_H;

  const polyPoints = points.map((p, i) => `${toX(i)},${toY(p.aqi)}`).join(" ");
  const areaPoints = `${toX(0)},${toY(minAqi)} ${polyPoints} ${toX(points.length - 1)},${toY(minAqi)}`;

  const yTicks = [0, 50, 100, 150, 200, 300, 400, 500].filter(
    (v) => v >= minAqi - 10 && v <= maxAqi + 10
  );

  return (
    <Svg width={W} height={H}>
      <Defs>
        <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.textPrimary} stopOpacity={isDark ? "0.2" : "0.1"} />
          <Stop offset="1" stopColor={theme.textPrimary} stopOpacity="0.0" />
        </SvgLinearGradient>
      </Defs>

      {/* Y-axis grid + labels */}
      {yTicks.map((v) => {
        const y = toY(v);
        if (y < PAD.top || y > PAD.top + PLOT_H) return null;
        return (
          <React.Fragment key={v}>
            <Line x1={PAD.left} y1={y} x2={PAD.left + PLOT_W} y2={y}
              stroke={theme.glassBorder} strokeWidth={1} strokeDasharray="4,4" />
            <SvgText x={PAD.left - 8} y={y + 4} fontSize={10}
              fill={theme.textSecondary} textAnchor="end">{v}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Filled Area */}
      <Polygon points={areaPoints} fill="url(#chartGradient)" />

      {/* Line */}
      <Polyline points={polyPoints} fill="none"
        stroke={theme.textPrimary} strokeWidth={3}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Points + labels */}
      {points.map((p, i) => {
        const x = toX(i);
        const y = toY(p.aqi);
        const band = getAqiBand(p.aqi);
        return (
          <React.Fragment key={i}>
            <Circle cx={x} cy={y} r={5} fill={band.color} stroke={theme.textPrimary} strokeWidth={2} />
            <SvgText x={x} y={y - 12} fontSize={11} fontWeight="700" fill={theme.textPrimary}
              textAnchor="middle">{Math.round(p.aqi)}</SvgText>
            <SvgText x={x} y={H - 12} fontSize={11}
              fill={theme.textSecondary} textAnchor="middle">
              {p.hour_offset === 0 ? "Now" : `+${p.hour_offset}h`}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function ForecastScreen() {
  const { data, isLoading } = useLatestReading();

  const isDark = useColorScheme() === 'dark';
  const theme = getTheme(isDark);
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  const forecastPoints = data
    ? [{ hour: new Date().getHours(), aqi: data.aqi, hour_offset: 0 }, ...(data.forecast || [])]
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>6-Hour Forecast</Text>
          <Text style={styles.headerSub}>Air quality trajectory</Text>

          {isLoading ? (
            <ActivityIndicator color={theme.textPrimary} style={{ marginTop: 40 }} size="large" />
          ) : (
            <>
              {/* Chart Card */}
              <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.chartCard}>
                <ForecastChart points={forecastPoints} isDark={isDark} theme={theme} />
              </BlurView>

              {/* Forecast list */}
              <Text style={styles.sectionTitle}>Hour-by-hour</Text>
              {(data?.forecast || []).map((f) => {
                const fBand = getAqiBand(f.aqi);
                return (
                  <BlurView key={f.hour_offset} intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.forecastRow}>
                    <Text style={styles.forecastHour}>
                      {`+${f.hour_offset}h`}
                      <Text style={styles.forecastHourSub}> ({f.hour}:00)</Text>
                    </Text>
                    <View style={[styles.forecastPill, { backgroundColor: fBand.color }]}>
                      <Text style={styles.forecastPillText}>
                        {fBand.label}
                      </Text>
                    </View>
                    <Text style={styles.forecastAqi}>
                      {Math.round(f.aqi)}
                    </Text>
                  </BlurView>
                );
              })}

              {/* AQI legend */}
              <Text style={styles.sectionTitle}>AQI scale</Text>
              <View style={styles.legendGrid}>
                {AQI_BANDS.map((b) => (
                  <BlurView key={b.key} intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.legendChip}>
                    <View style={[styles.legendIndicator, { backgroundColor: b.color }]} />
                    <View>
                      <Text style={styles.legendLabel}>{b.label}</Text>
                      <Text style={styles.legendRange}>{b.lo} – {b.hi}</Text>
                    </View>
                  </BlurView>
                ))}
              </View>
            </>
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
  scroll: { padding: 16, paddingBottom: 32 },
  
  headerTitle: { fontSize: 26, fontWeight: "600", color: theme.textPrimary, letterSpacing: 0.5, marginTop: 10 },
  headerSub: { fontSize: 14, color: theme.textSecondary, marginTop: 2, marginBottom: 20 },
  
  chartCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, paddingVertical: 10, paddingHorizontal: 0, marginBottom: 24, backgroundColor: theme.glassCard, ...theme.shadow },
  
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.textPrimary, marginBottom: 12, marginLeft: 4 },
  
  /* List Rows */
  forecastRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  forecastHour: { fontSize: 16, fontWeight: "600", color: theme.textPrimary, flex: 1 },
  forecastHourSub: { fontSize: 13, fontWeight: "400", color: theme.textSecondary },
  forecastPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 12, ...theme.shadow },
  forecastPillText: { fontSize: 12, fontWeight: "700", color: "#FFF", textTransform: "uppercase", letterSpacing: 0.5 },
  forecastAqi: { fontSize: 20, fontWeight: "600", color: theme.textPrimary, minWidth: 40, textAlign: "right" },

  /* Legend */
  legendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, width: "48%", overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, flexDirection: "row", alignItems: "center", ...theme.shadow },
  legendIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendLabel: { fontSize: 13, fontWeight: "600", color: theme.textPrimary },
  legendRange: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
});
