import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SkillGate Mobile Roadmap</Text>
        <Text style={styles.copy}>
          This mobile app is now a branded MVP shell. The next step is wiring it to the
          backend so candidates can view assessments, review attempt summaries, and read
          AI feedback directly from live data.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next mobile milestones</Text>
          <Text style={styles.cardCopy}>1. Candidate login state</Text>
          <Text style={styles.cardCopy}>2. Assessment list from the backend</Text>
          <Text style={styles.cardCopy}>3. Attempt summary and AI feedback screen</Text>
        </View>

        <Link href="/" dismissTo style={styles.button}>
          <Text style={styles.buttonText}>Back to dashboard</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040a16',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  copy: {
    marginTop: 12,
    color: 'rgba(203,213,225,0.82)',
    lineHeight: 24,
    fontSize: 15,
  },
  card: {
    marginTop: 24,
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(8,16,31,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardCopy: {
    color: 'rgba(226,232,240,0.82)',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    marginTop: 22,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#fb923c',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
