import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExpirationTimerProps {
  expiresAt: string;
  className?: string;
  showIcon?: boolean;
  format?: 'full' | 'compact';
}

export function ExpirationTimer({ 
  expiresAt, 
  className = '',
  showIcon = true,
  format = 'full'
}: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setIsExpired(true);
        return;
      }

      // Check if less than 5 minutes left (critical)
      setIsCritical(diff < 5 * 60 * 1000);

      // Calculate time components
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format based on time remaining
      if (format === 'compact') {
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        // Full format
        const parts = [];
        if (days > 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
        if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
        if (parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
        
        setTimeLeft(parts.join(', '));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, format]);

  const getColorClasses = () => {
    if (isExpired) {
      return 'text-destructive bg-destructive/10 border-destructive/20';
    }
    if (isCritical) {
      return 'text-orange-600 bg-orange-50 border-orange-200 animate-pulse';
    }
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${getColorClasses()} ${className}`}>
      {showIcon && (
        <>
          {isExpired || isCritical ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </>
      )}
      <span className="text-sm font-medium">
        {isExpired ? 'Expirado' : timeLeft}
      </span>
    </div>
  );
}
