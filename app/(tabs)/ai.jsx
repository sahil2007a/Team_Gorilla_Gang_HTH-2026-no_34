import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { AIMessage } from '../../components/AIMessage';
import { aiService, suggestedQuestions } from '../../services/aiService';
import { Send, Mic, Bell } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { CropScanner } from '../../components/CropScanner';

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm AgriFlow AI, your intelligent farming assistant.\n\nI can help you with crop diseases, irrigation advice, fertilizer schedules, market prices, yield predictions, and much more.\n\nWhat would you like to know about your farm today?",
};

export default function AIScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { farmer } = useAuth();
  const [activeTab, setActiveTab] = useState('Crop Scanner');
  
  // Chat State
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || thinking) return;
    setInput('');

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMsg,
    };
    setMessages((prev) => [...prev, userMessage]);
    setThinking(true);
    scrollToBottom();

    const response = await aiService.chat(userMsg, messages, language);
    setMessages((prev) => [...prev, response]);
    setThinking(false);
    scrollToBottom();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar matching Image 1 */}
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{farmer?.name?.[0] || 'R'}</Text>
        </View>
        <View style={styles.logoBox}>
          <Text style={styles.brandName}>{t('AgriFlow')}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
        >
          <Bell size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl 
          options={[t('Crop Scanner'), t('AI Chat')]} 
          selected={activeTab === 'Crop Scanner' ? t('Crop Scanner') : t('AI Chat')} 
          onChange={(val) => {
            if (val === t('Crop Scanner')) setActiveTab('Crop Scanner');
            else setActiveTab('AI Chat');
          }} 
        />
      </View>

      {activeTab === 'Crop Scanner' ? (
        <CropScanner />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <AIMessage key={msg.id} message={msg} />
            ))}

            {thinking && (
              <View style={styles.thinkingBubble}>
                <View style={styles.aiAvatar}>
                  <Text>🌿</Text>
                </View>
                <View style={styles.thinkingContent}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.thinkingText}>{t('Thinking...')}</Text>
                </View>
              </View>
            )}

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestTitle}>{t('Suggested Questions')}</Text>
                {suggestedQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestBtn}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestText}>{t(q)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('Ask AgriFlow AI anything about crops, pests...')}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={styles.micBtn}
              activeOpacity={0.8}
              onPress={() => {
                const sampleVoicePrompts = [
                  'How to treat yellow leaves in cotton?',
                  'What is the best pesticide for aphids in chilli?',
                  'How much water does soybean need this week?',
                  'Give me fertilizer dosage for 1 acre wheat.',
                ];
                const picked = sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];
                setInput(picked);
              }}
            >
              <Mic size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || thinking) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || thinking}
              activeOpacity={0.8}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  logoBox: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  messages: { flex: 1 },
  messagesContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thinkingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestions: {
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  suggestTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestBtn: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  suggestText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.base : Spacing.md,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
