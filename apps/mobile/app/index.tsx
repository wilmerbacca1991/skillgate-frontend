import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function EntryScreen() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#fb923c" />
          <Text style={styles.loadingText}>Loading SkillGate Mobile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040a16',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
});