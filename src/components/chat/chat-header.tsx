'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ModelProvider } from '@/types';

interface ChatHeaderProps {
  modelProvider: ModelProvider;
  modelName: string;
  onModelChange: (provider: ModelProvider, name: string) => void;
}

const models = [
  { provider: 'openai' as ModelProvider, name: 'gpt-5.2', label: 'GPT-5.2' },
  { provider: 'openai' as ModelProvider, name: 'gpt-5.2-mini', label: 'GPT-5.2 Mini' },
  { provider: 'openai' as ModelProvider, name: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'openai' as ModelProvider, name: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { provider: 'gemini' as ModelProvider, name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { provider: 'gemini' as ModelProvider, name: 'gemini-1.5-pro', label: 'Gemini Pro' },
  { provider: 'gemini' as ModelProvider, name: 'gemini-1.5-flash', label: 'Gemini Flash' },
];

export function ChatHeader({
  modelProvider,
  modelName,
  onModelChange,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
      {models.map((model) => (
        <Button
          key={`${model.provider}-${model.name}`}
          variant="ghost"
          size="sm"
          onClick={() => onModelChange(model.provider, model.name)}
          className={cn(
            'text-xs whitespace-nowrap',
            modelProvider === model.provider && modelName === model.name
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground'
          )}
        >
          {model.label}
        </Button>
      ))}
    </div>
  );
}
