'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, Key, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key_encrypted, gemini_api_key_encrypted')
        .single();

      if (profile) {
        const typedProfile = profile as unknown as { openai_api_key_encrypted: string | null; gemini_api_key_encrypted: string | null };
        setHasOpenaiKey(!!typedProfile.openai_api_key_encrypted);
        setHasGeminiKey(!!typedProfile.gemini_api_key_encrypted);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const updates: Record<string, string | null> = {};

      if (openaiKey) {
        updates.openai_api_key_encrypted = openaiKey;
      }
      if (geminiKey) {
        updates.gemini_api_key_encrypted = geminiKey;
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save' });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setOpenaiKey('');
      setGeminiKey('');
      if (updates.openai_api_key_encrypted) setHasOpenaiKey(true);
      if (updates.gemini_api_key_encrypted) setHasGeminiKey(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header showTabs={false} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header showTabs={false} />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          {/* API Keys Section */}
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">API Keys</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Add your API keys to enable AI features. Your keys are stored securely and never shared.
            </p>

            {/* OpenAI Key */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <label htmlFor="openaiKey" className="text-sm font-medium">
                  OpenAI API Key
                </label>
                {hasOpenaiKey && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Configured
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="openaiKey"
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={hasOpenaiKey ? '••••••••••••' : 'sk-...'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOpenaiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* Gemini Key */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <label htmlFor="geminiKey" className="text-sm font-medium">
                  Google Gemini API Key
                </label>
                {hasGeminiKey && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Configured
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="geminiKey"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={hasGeminiKey ? '••••••••••••' : 'AI...'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm mb-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save API Keys'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
