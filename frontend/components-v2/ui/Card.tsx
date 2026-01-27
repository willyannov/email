import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  neon?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, neon = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-6',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
