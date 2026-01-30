'use client';

import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

interface SelectionPopoverProps {
  position: { x: number; y: number };
  onAddToChat: () => void;
  onClose: () => void;
}

export function SelectionPopover({
  position,
  onAddToChat,
  onClose,
}: SelectionPopoverProps) {
  return (
    <div
      className="selection-popover absolute z-50 bg-background rounded-lg shadow-lg border border-border p-1 flex gap-1 animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onAddToChat();
        }}
        className="gap-2"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Ask AI
      </Button>
    </div>
  );
}
