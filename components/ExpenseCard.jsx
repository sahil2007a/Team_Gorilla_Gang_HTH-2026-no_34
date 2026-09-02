import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';

export const ExpenseCard = ({ expense }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>{expense.label}</Text>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.date}>{expense.date}</Text>
      </View>
      <Text style={styles.amount}>₹{expense.amount.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
});
