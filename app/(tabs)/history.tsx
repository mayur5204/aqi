import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useHistory, useLatestReading } from "../../src/hooks/useAqi";
import { getAqiBand, Colors, getTheme } from "../../src/theme";
import { format } from "date-fns";

const LIMITS = [24, 48, 96];

export default function HistoryScreen() {
  const [limit, setLimit] = useState(48);
  const { data: latest } = useLatestReading();
  const { data, isLoading, refetch, isRefetching } = useHistory(undefined, limit);

  const isDark = useColorScheme() === 'dark';
  const theme = getTheme(isDark);
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Past continuous readings</Text>
          </View>
          <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.limitRow}>
            {LIMITS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.limitBtn, limit === l && styles.limitBtnActive]}
                onPress={() => setLimit(l)}
              >
                <Text style={[styles.limitText, limit === l && styles.limitTextActive]}>
                  {l === 24 ? "4h" : l === 48 ? "8h" : "16h"}
                </Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.textPrimary} style={{ marginTop: 40 }} size="large" />
        ) : (
          <FlatList
            data={data?.readings ?? []}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            ListEmptyComponent={
              <Text style={styles.empty}>No readings yet.</Text>
            }
            renderItem={({ item, index }) => {
              const itemBand = getAqiBand(item.aqi_predicted);
              const time = format(new Date(item.ts), "dd MMM · HH:mm");
              
              // Find trend (compared to next item which is older)
              const previousItem = data?.readings[index + 1];
              let trend = "";
              if (previousItem) {
                if (item.aqi_predicted > previousItem.aqi_predicted + 5) trend = "↗";
                else if (item.aqi_predicted < previousItem.aqi_predicted - 5) trend = "↘";
                else trend = "→";
              }

              return (
                <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTime}>{time}</Text>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowSensor}>
                        {item.temperature.toFixed(1)}°C  •  {item.humidity.toFixed(0)}% RH
                      </Text>
                      <Text style={styles.rowSensor}>
                        Dust: {item.dust_ugm3.toFixed(1)}  •  CO: {item.co_mgm3.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowRight}>
                    <View style={styles.aqiContainer}>
                      <Text style={styles.trendIcon}>{trend}</Text>
                      <Text style={styles.rowAqi}>
                        {Math.round(item.aqi_predicted)}
                      </Text>
                    </View>
                    <View style={[styles.rowPill, { backgroundColor: itemBand.color }]}>
                      <Text style={styles.rowPillText}>{itemBand.label}</Text>
                    </View>
                  </View>
                </BlurView>
              );
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container:    { flex: 1 },
  safe:         { flex: 1 },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingVertical: 20 },
  title:        { fontSize: 26, fontWeight: "600", color: theme.textPrimary, letterSpacing: 0.5 },
  subtitle:     { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  
  limitRow:     { flexDirection: "row", borderRadius: 24, overflow: "hidden", padding: 4, borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  limitBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  limitBtnActive: { backgroundColor: "rgba(128,128,128,0.2)" },
  limitText:    { fontSize: 13, color: theme.textSecondary, fontWeight: "500" },
  limitTextActive: { color: theme.textPrimary, fontWeight: "600" },
  
  list:         { padding: 16, paddingBottom: 100 },
  empty:        { textAlign: "center", color: theme.textSecondary, fontSize: 15, marginTop: 40 },
  
  row:          { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  rowLeft:      { flex: 1 },
  rowTime:      { fontSize: 15, fontWeight: "600", color: theme.textPrimary, marginBottom: 6 },
  rowMeta:      { gap: 4 },
  rowSensor:    { fontSize: 12, color: theme.textSecondary },
  
  rowRight:     { alignItems: "flex-end", gap: 6 },
  aqiContainer: { flexDirection: "row", alignItems: "baseline" },
  trendIcon:    { fontSize: 14, color: theme.textSecondary, marginRight: 6 },
  rowAqi:       { fontSize: 26, fontWeight: "500", letterSpacing: -0.5, color: theme.textPrimary },
  rowPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, ...theme.shadow },
  rowPillText:  { fontSize: 11, fontWeight: "700", color: "#FFF", letterSpacing: 0.5, textTransform: "uppercase" },
});
