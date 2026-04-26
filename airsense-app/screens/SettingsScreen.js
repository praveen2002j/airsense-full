import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import CardAccent from '../components/CardAccent';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = createStyles(theme);

  const [compactCards, setCompactCards] = useState(false);
  const [alertSound, setAlertSound] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [botSuggestions, setBotSuggestions] = useState(true);
  const [selectedRefresh, setSelectedRefresh] = useState('15s');
  const [selectedDensity, setSelectedDensity] = useState('Comfort');

  const refreshOptions = ['15s', '30s', '60s'];
  const densityOptions = ['Comfort', 'Compact'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Icon name="settings-outline" size={22} color={theme.colors.white} />
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Preferences</Text>
          </View>
        </View>
        <Text style={styles.kicker}>Workspace setup</Text>
        <Text style={styles.title}>Settings panel</Text>
        <Text style={styles.text}>
          Personalize the app experience, notification behavior, and dashboard feel from one place without changing your analytics data or workflows.
        </Text>
      </View>

      <SectionTitle theme={theme} title="Appearance" subtitle="Visual preferences for the interface." />
      <View style={styles.groupCard}>
        <CardAccent color={theme.colors.blue} radius={theme.borderRadius.xl} />
        <SettingToggle
          theme={theme}
          title="Dark theme"
          description="Switch the interface between light and dark whenever you want."
          value={isDark}
          onValueChange={toggleTheme}
        />
        <Divider theme={theme} />
        <SettingToggle
          theme={theme}
          title="Compact metric cards"
          description="Preview a denser information layout inside the settings experience."
          value={compactCards}
          onValueChange={setCompactCards}
        />
        <Divider theme={theme} />
        <SettingSelector
          theme={theme}
          title="Content density"
          description="Choose how spacious the interface should feel."
          options={densityOptions}
          selected={selectedDensity}
          onSelect={setSelectedDensity}
        />
      </View>

      <SectionTitle theme={theme} title="Notifications" subtitle="Control how alerts are surfaced to you." />
      <View style={styles.groupCard}>
        <CardAccent color={theme.colors.yellow} radius={theme.borderRadius.xl} />
        <SettingToggle
          theme={theme}
          title="Alert sound"
          description="Keep an audible cue ready for high-priority alerts."
          value={alertSound}
          onValueChange={setAlertSound}
        />
        <Divider theme={theme} />
        <SettingToggle
          theme={theme}
          title="Daily summary"
          description="Preview a summary preference for future daily reporting."
          value={dailySummary}
          onValueChange={setDailySummary}
        />
      </View>

      <SectionTitle theme={theme} title="Dashboard" subtitle="Tune how often dashboard data updates." />
      <View style={styles.groupCard}>
        <CardAccent color={theme.colors.cyan} radius={theme.borderRadius.xl} />
        <SettingSelector
          theme={theme}
          title="Refresh interval"
          description="Choose the preferred live refresh cadence."
          options={refreshOptions}
          selected={selectedRefresh}
          onSelect={setSelectedRefresh}
        />
      </View>

      <SectionTitle theme={theme} title="AI assistant" subtitle="Preferences for the chatbot experience." />
      <View style={styles.groupCard}>
        <CardAccent color={theme.colors.purple} radius={theme.borderRadius.xl} />
        <SettingToggle
          theme={theme}
          title="Suggested prompts"
          description="Keep example prompts visible when opening the assistant."
          value={botSuggestions}
          onValueChange={setBotSuggestions}
        />
        <Divider theme={theme} />
        <InfoRow
          theme={theme}
          icon="sparkles-outline"
          title="Assistant mode"
          value="Decision support"
        />
      </View>
    </ScrollView>
  );
}

function SectionTitle({ theme, title, subtitle }) {
  const styles = createSectionStyles(theme);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function SettingToggle({ theme, title, description, value, onValueChange }) {
  const styles = createItemStyles(theme);
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.divider, true: theme.colors.blue }}
        thumbColor={theme.colors.white}
      />
    </View>
  );
}

function SettingSelector({ theme, title, description, options, selected, onSelect }) {
  const styles = createItemStyles(theme);
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{description}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function InfoRow({ theme, icon, title, value }) {
  const styles = createItemStyles(theme);
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIcon}>
          <Icon name={icon} size={18} color={theme.colors.blue} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Divider({ theme }) {
  return <View style={{ height: 1, backgroundColor: theme.colors.divider, marginVertical: theme.spacing.md }} />;
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 96,
  },
  heroCard: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.blueDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  heroBadgeText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  kicker: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  groupCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
});

const createSectionStyles = (theme) => StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});

const createItemStyles = (theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  selectorWrap: {},
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  optionChipActive: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextActive: {
    color: theme.colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoValue: {
    color: theme.colors.blue,
    fontSize: 13,
    fontWeight: '700',
  },
});
