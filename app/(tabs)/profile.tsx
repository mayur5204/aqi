import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Switch, Alert, useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  GoogleSignin,
  statusCodes,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth";
import { auth } from "../../src/services/firebase";
import { useUserProfile } from "../../src/hooks/useUserProfile";
import { CONDITION_LABELS, Colors, getTheme } from "../../src/theme";

// Configure Google Sign-In with the Web Client ID
GoogleSignin.configure({
  webClientId:
    "607702686689-76n0288vlqovt5a1bajkvrfbmit4rjr0.apps.googleusercontent.com",
});

const CONDITIONS = Object.entries(CONDITION_LABELS);

// ─── Google Sign-In button ────────────────────────────────────────────────
function AuthSection({ onDone, isDark, theme }: { onDone: () => void, isDark: boolean, theme: any }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErr("");

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      const idToken = signInResult?.data?.idToken;
      if (!idToken) {
        setErr("Failed to get Google ID token");
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      onDone();
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setErr("Sign-in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErr("Google Play Services not available");
      } else {
        setErr(error.message ?? "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  return (
    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.authCard}>
      <Text style={styles.authTitle}>Sign in to AQI Monitor</Text>
      <Text style={styles.authSub}>Sync your personalized health profile</Text>

      {err ? <Text style={styles.errText}>{err}</Text> : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.textPrimary} />
        </View>
      ) : (
        <View style={styles.googleBtnWrapper}>
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={isDark ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={{ width: '100%', height: 48 }}
          />
        </View>
      )}
    </BlurView>
  );
}


// ─── Main screen ──────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, profile, loading, saving, updateProfile } = useUserProfile();
  const [authed, setAuthed] = useState(!!user);

  const isDark = useColorScheme() === 'dark';
  const theme = getTheme(isDark);
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  useEffect(() => { setAuthed(!!user); }, [user]);

  const [name, setName]     = useState("");
  const [ageStr, setAgeStr] = useState("");
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAgeStr(profile.age ? profile.age.toString() : "");
    }
  }, [profile]);

  const handleSave = async () => {
    const age = parseInt(ageStr);
    await updateProfile({
      name: name.trim(),
      ...(ageStr && !isNaN(age) && age > 0 && age < 120 ? { age } : {}),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleCondition = (key: string) => {
    if (!profile) return;
    let updated: string[];
    if (key === "healthy") {
      updated = ["healthy"];
    } else {
      const without = (profile.conditions || []).filter((c) => c !== "healthy" && c !== key);
      updated = (profile.conditions || []).includes(key)
        ? without.length ? without : ["healthy"]
        : [...without, key];
    }
    updateProfile({ conditions: updated });
  };

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive",
        onPress: async () => {
          try { await GoogleSignin.signOut(); } catch {}
          await signOut(auth);
          setAuthed(false);
        }
      },
    ]);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  // Not signed in
  if (!authed) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.pageTitle}>Profile</Text>
            <AuthSection onDone={() => setAuthed(true)} isDark={isDark} theme={theme} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Signed in
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.backgroundGradients} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Profile</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Account */}
          <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Signed in as</Text>
            <Text style={styles.fieldValue}>{user?.displayName || user?.email}</Text>
            {user?.email && user?.displayName && (
              <Text style={[styles.fieldLabel, { marginTop: 4 }]}>{user.email}</Text>
            )}
          </BlurView>

          {/* Details */}
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.formCard}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Your age"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={ageStr}
              onChangeText={setAgeStr}
            />
            <Text style={styles.fieldHint}>
              Affects your personalized health advice.
            </Text>
          </BlurView>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnDone]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={theme.textPrimary} />
              : <Text style={[styles.saveBtnText, saved && { color: "#FFF" }]}>{saved ? "All Changes Saved ✓" : "Save Profile"}</Text>
            }
          </TouchableOpacity>

          {/* Conditions */}
          <Text style={styles.sectionHeader}>Health Conditions</Text>
          <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.cardList}>
            {CONDITIONS.map(([key, label], i) => {
              const isActive = (profile?.conditions || []).includes(key);
              return (
                <View key={key} style={[styles.conditionRow, i < CONDITIONS.length - 1 && styles.borderBottom]}>
                  <Text style={[styles.conditionLabel, isActive && { fontWeight: "600", color: theme.textPrimary }]}>{label}</Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleCondition(key)}
                    trackColor={{ true: "rgba(128,128,128,0.5)", false: "rgba(128,128,128,0.2)" }}
                    thumbColor={isActive ? Colors.primary : theme.textSecondary}
                  />
                </View>
              );
            })}
          </BlurView>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container:      { flex: 1 },
  safe:           { flex: 1 },
  center:         { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll:         { padding: 20 },
  pageHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, marginTop: 10 },
  pageTitle:      { fontSize: 32, fontWeight: "600", color: theme.textPrimary, letterSpacing: 0.5 },
  signOutBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(128,128,128,0.15)" },
  signOutText:    { fontSize: 13, fontWeight: "600", color: theme.textPrimary },
  
  sectionHeader:  { fontSize: 16, fontWeight: "600", color: theme.textPrimary, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  sectionCard:    { borderRadius: 16, padding: 20, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  
  fieldLabel:     { fontSize: 13, color: theme.textSecondary, fontWeight: "500", letterSpacing: 0.5 },
  fieldValue:     { fontSize: 18, color: theme.textPrimary, fontWeight: "600", marginTop: 4 },
  
  formCard:       { borderRadius: 16, padding: 20, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  inputLabel:     { fontSize: 13, color: theme.textSecondary, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input:          { backgroundColor: "rgba(128,128,128,0.1)", borderRadius: 12, padding: 14, fontSize: 16, color: theme.textPrimary, borderWidth: 1, borderColor: theme.glassBorder },
  fieldHint:      { fontSize: 12, color: theme.textSecondary, marginTop: 8, fontStyle: "italic" },

  cardList:       { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, ...theme.shadow },
  conditionRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  borderBottom:   { borderBottomWidth: 1, borderBottomColor: theme.glassBorder },
  conditionLabel: { fontSize: 16, color: theme.textPrimary },
  
  saveBtn:        { backgroundColor: theme.textPrimary, borderRadius: 16, padding: 16, alignItems: "center", marginTop: 20, ...theme.shadow },
  saveBtnDone:    { backgroundColor: "#1D9E75" },
  saveBtnText:    { color: theme.backgroundGradients[theme.backgroundGradients.length - 1], fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },

  // Auth card
  authCard:       { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.glassBorder, backgroundColor: theme.glassCard, overflow: "hidden", marginTop: 40, ...theme.shadow },
  authTitle:      { fontSize: 24, fontWeight: "600", color: theme.textPrimary, marginBottom: 6 },
  authSub:        { fontSize: 15, color: theme.textSecondary, marginBottom: 20 },
  loadingContainer: { alignItems: "center", paddingVertical: 10 },
  googleBtnWrapper: { width: "100%", alignItems: "center" },
  errText:        { fontSize: 14, color: "#FF5A5F", marginBottom: 16, fontWeight: "500" },

});
