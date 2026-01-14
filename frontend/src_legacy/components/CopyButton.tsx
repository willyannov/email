import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function CopyButton({ 
  text, 
  label = 'Copiar',
  variant = 'outline',
  size = 'default',
  className = '',
  showLabel = true
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`${copied ? 'bg-green-500 hover:bg-green-600 text-white' : ''} ${className}`}
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {showLabel && <span className="ml-2">Copiado!</span>}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {showLabel && <span className="ml-2">{label}</span>}
        </>
      )}
    </Button>
  );
}
