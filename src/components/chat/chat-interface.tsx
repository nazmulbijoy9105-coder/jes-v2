'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ChatMessage } from '@/lib/types';
import { ReligionModal } from './religion-modal';
import { SafetyBanner } from './safety-banner';
import { ConfidenceBadge } from './confidence-badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Shield, BookOpen, Loader2 } from 'lucide-react';

export function ChatInterface() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReligionModal, setShowReligionModal] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setStreamingContent('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          language: profile?.preferred_language || 'english',
          religion: profile?.religion,
          isPaid: profile?.is_paid || false
        })
      });

      const data = await response.json();

      if (data.response?.requiresReligion) {
        setShowReligionModal(true);
        setIsLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        metadata: {
          area: data.response?.metadata?.area,
          confidence: data.response?.confidence,
          citations: data.response?.citations,
          safetyFlags: data.response?.safetyChecks
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      const content = data.response.content;
      let currentText = '';
      for (let i = 0; i < content.length; i++) {
        currentText += content[i];
        setStreamingContent(currentText);
        await new Promise(resolve => setTimeout(resolve, 8));
      }

      setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, content } : m));
      setStreamingContent('');

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, profile]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">JesAI Law & Order</h1>
            <p className="text-sm text-gray-500">Free Legal AI for Bangladesh v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">Safety-First</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl rounded-2xl px-4 py-3 ${
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                {message.role === 'assistant' && message.metadata?.safetyFlags?.some(f => f.severity === 'critical') && (
                  <SafetyBanner flags={message.metadata.safetyFlags} />
                )}
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {message.content || streamingContent}
                </div>
                {message.role === 'assistant' && message.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-3">
                    <ConfidenceBadge level={message.metadata.confidence} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">Analyzing your legal question...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about Bangladesh law..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white rounded-xl px-6 py-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          ⚠️ General legal literacy only, not legal advice. Consult a qualified advocate for your specific situation.
        </p>
      </div>

      <ReligionModal 
        isOpen={showReligionModal} 
        onClose={() => setShowReligionModal(false)}
        onSelect={() => setShowReligionModal(false)}
      />
    </div>
  );
}