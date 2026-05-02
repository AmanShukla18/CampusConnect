import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ACADEMIC_EVENTS = [
  { id: '1', date: 'Oct 15', title: 'Midterm Exams Begin', type: 'exam' },
  { id: '2', date: 'Oct 28', title: 'Diwali Holidays', type: 'holiday' },
  { id: '3', date: 'Nov 10', title: 'TechFest 2026', type: 'event' },
  { id: '4', date: 'Dec 05', title: 'End Semester Exams', type: 'exam' },
];

export default function CalendarWidget() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Academic Calendar</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ACADEMIC_EVENTS.map((event) => {
          let dotColor = colors.primary;
          if (event.type === 'exam') dotColor = '#ef4444';
          else if (event.type === 'holiday') dotColor = '#10b981';

          return (
            <View key={event.id} style={[styles.eventCard, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]}>
              <View style={[styles.dateBubble, { backgroundColor: dotColor + '20' }]}>
                <Text style={[styles.dateText, { color: dotColor }]}>{event.date}</Text>
              </View>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                {event.title}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCard: {
    width: 130,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateBubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  }
});
