import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FieldHelpProps = {
  text: string;
};

export default function FieldHelp({ text }: FieldHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.icon} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.iconText}>!</Text>
      </TouchableOpacity>
      {open ? <Text style={styles.tooltip}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.5)',
    backgroundColor: 'rgba(251,146,60,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fdba74',
    fontSize: 12,
    fontWeight: '800',
  },
  tooltip: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
    backgroundColor: 'rgba(2,6,23,0.95)',
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 260,
  },
});
