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
import { theme } from '../styles/theme';
import { sendChatMessage } from '../services/api';

const SUGGESTED = [
  'Is the air quality safe right now?',
  'What caused the CO2 spike?',
  'What should I do?',
  'Show me temperature trends',
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', text: 'Hi! I\'m AirSense AI. Ask me anything about your air quality data.' },
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const getHistory = () =>
    messages.slice(1).map(m => ({ role: m.role, content: m.text }));

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(userText, getHistory());
      setMessages(prev => [...prev, { id: Date.now().toString() + 'a', role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'assistant', text: 'Sorry, I could not connect. Please check your network.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.role === 'assistant' && (
        <View style={styles.aiIcon}>
          <Icon name="sparkles" size={12} color={theme.colors.blue} />
        </View>
      )}
      <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>{item.text}</Text>
    </View>
  );

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Icon name="chatbubble-ellipses" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon name="sparkles" size={16} color={theme.colors.blue} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AirSense AI</Text>
                  <Text style={styles.headerSub}>Powered by your live data</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Icon name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />

            {/* Suggested prompts (show only at start) */}
            {messages.length <= 1 && (
              <View style={styles.suggestions}>
                {SUGGESTED.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggestion} onPress={() => send(s)}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Loading indicator */}
            {loading && (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={theme.colors.blue} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about air quality..."
                placeholderTextColor={theme.colors.textSecondary}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => send()}
                disabled={!input.trim() || loading}
              >
                <Icon name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.blue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  headerSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiBubble: {
    backgroundColor: theme.colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.colors.blue,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiIcon: {
    marginTop: 2,
  },
  bubbleText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: '#fff',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  suggestion: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  suggestionText: {
    color: theme.colors.blue,
    fontSize: 12,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  typingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.divider,
  },
});
