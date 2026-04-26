import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../styles/theme';
import { sendChatMessage } from '../services/api';
import CardAccent from './CardAccent';

const SUGGESTED = [
  'Is the air quality safe right now?',
  'What caused the CO2 spike?',
  'What should I do next?',
  'Show me temperature trends',
];

export default function ChatBot() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', text: 'Hi, I am AirSense AI. Ask me about live air quality, trends, anomalies, or recommended actions.' },
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const getHistory = () =>
    messages.slice(1).map((m) => ({ role: m.role, content: m.text }));

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(userText, getHistory());
      setMessages((prev) => [...prev, { id: `${Date.now()}a`, role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}e`, role: 'assistant', text: 'I could not connect right now. Please verify the backend and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.bubbleWrap, item.role === 'user' ? styles.userWrap : styles.aiWrap]}>
      <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        {item.role === 'assistant' ? <CardAccent color={theme.colors.cyan} radius={18} /> : null}
        {item.role === 'assistant' ? (
          <View style={styles.aiIcon}>
            <Icon name="sparkles" size={12} color={theme.colors.cyan} />
          </View>
        ) : null}
        <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <View style={styles.fabInner}>
          <Icon name="sparkles" size={18} color={theme.colors.white} />
        </View>
        <Text style={styles.fabLabel}>AI</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon name="sparkles" size={18} color={theme.colors.cyan} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AirSense AI Analyst</Text>
                  <Text style={styles.headerSub}>Conversational guidance for data exploration</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextCard}>
              <CardAccent color={theme.colors.cyan} radius={theme.borderRadius.lg} />
              <Text style={styles.contextLabel}>Suggested use</Text>
              <Text style={styles.contextText}>Ask about trends, abnormal patterns, comparisons, likely causes, or what action the dashboard supports.</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />

            {messages.length <= 1 ? (
              <View style={styles.suggestions}>
                {SUGGESTED.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggestion} onPress={() => send(s)}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {loading ? (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={theme.colors.cyan} />
                <Text style={styles.typingText}>Analyzing current data...</Text>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask a decision-support question..."
                placeholderTextColor={theme.colors.textMuted}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => send()}
                disabled={!input.trim() || loading}
              >
                <Icon name="arrow-up" size={18} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (theme) => StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.blueDeep,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(116, 174, 255, 0.22)' : 'rgba(255,255,255,0.12)',
    ...theme.shadows.card,
    zIndex: 999,
  },
  fabInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.backgroundAlt,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '84%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 16 },
  headerSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  contextCard: {
    margin: 16,
    marginBottom: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    paddingLeft: 22,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  contextLabel: {
    color: theme.colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  messageList: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  bubbleWrap: { marginBottom: 8 },
  aiWrap: { alignItems: 'flex-start' },
  userWrap: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
  aiBubble: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.divider,
    borderBottomLeftRadius: 6,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: theme.colors.blueDeep,
    borderColor: theme.isDark ? 'rgba(116, 174, 255, 0.16)' : 'rgba(255,255,255,0.08)',
    borderBottomRightRadius: 6,
  },
  aiIcon: { marginTop: 2 },
  bubbleText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20, flex: 1 },
  userText: { color: theme.colors.white },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  suggestion: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  suggestionText: { color: theme.colors.blue, fontSize: 12, fontWeight: '700' },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  typingText: { color: theme.colors.textSecondary, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.colors.divider },
});
