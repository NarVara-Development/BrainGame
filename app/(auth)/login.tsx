import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { Button } from '@/components/ui/Button';

const SOCIAL_ICONS = {
  google: require('../../assets/social/google.png'),
} as const;

function SocialIcon({ name }: { name: keyof typeof SOCIAL_ICONS }) {
  return <Image source={SOCIAL_ICONS[name]} style={{ width: 22, height: 22 }} resizeMode="contain" />;
}
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { t } from '@/utils/languageManager';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useGameStore((s) => s.language);
  const { signIn, signUp, signInWithProvider, playAsGuest, loading } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const submit = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert('Offline', 'Supabase not configured. Play as guest instead.');
      return;
    }
    const res = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, username.trim() || email.split('@')[0]);
    if (res.error) Alert.alert('Error', res.error);
    else router.back();
  };

  const social = async (provider: string, label: string) => {
    if (!isSupabaseConfigured) {
      Alert.alert('Offline', 'Supabase not configured. Play as guest instead.');
      return;
    }
    const res = await signInWithProvider(provider);
    if (res.error) Alert.alert(label, res.error);
    else router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: Math.max(insets.top, StatusBar.currentHeight ?? 0, 24) + 24, paddingBottom: insets.bottom + 40, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <Text style={[TYPE.hero, { fontSize: 40 }]}>{mode === 'login' ? t('login', lang) : t('register', lang)}</Text>
        <Text style={[TYPE.body, { marginBottom: 24, marginTop: 6 }]}>NARVARA BRAINGAME</Text>

        {mode === 'register' && (
          <Field label={t('username', lang)} value={username} onChange={setUsername} autoCapitalize="none" />
        )}
        <Field label={t('email', lang)} value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label={t('password', lang)} value={password} onChange={setPassword} secureTextEntry />

        <Button label={mode === 'login' ? t('login', lang) : t('register', lang)} color={COLORS.green} fullWidth size="lg" onPress={submit} disabled={loading} style={{ marginTop: 8 }} />

        <Text style={[TYPE.label, { fontSize: 11, marginTop: 16, marginBottom: 8 }]}>
          {t('orSignInWith', lang)}
        </Text>
        <View style={styles.socialGrid}>
          <Button label="GOOGLE" size="sm" icon={<SocialIcon name="google" />} color={COLORS.white} onPress={() => social('google', 'Google')} disabled={loading} style={{ flex: 1 }} fullWidth />
        </View>

        <Button
          label={mode === 'login' ? `→ ${t('register', lang)}` : `→ ${t('login', lang)}`}
          color={COLORS.white}
          fullWidth
          onPress={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
          style={{ marginTop: 12 }}
        />

        <View style={styles.divider} />

        <Button
          label={t('playAsGuest', lang)}
          color={COLORS.yellow}
          fullWidth
          onPress={() => {
            playAsGuest(username.trim() || 'Guest');
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.ComponentProps<typeof TextInput>, 'onChange'>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[TYPE.label, { fontSize: 11, marginBottom: 6 }]}>{label}</Text>
      <View style={hardShadow(3)}>
        <TextInput
          value={value}
          onChangeText={onChange}
          style={styles.input}
          placeholderTextColor={COLORS.muted}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  socialGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  divider: { height: 3, backgroundColor: COLORS.ink, marginVertical: 22 },
});
