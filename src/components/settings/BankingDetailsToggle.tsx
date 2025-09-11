'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BankingDetailsToggleProps {
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
  className?: string;
}

export function BankingDetailsToggle({ 
  isVisible, 
  onToggle, 
  className = '' 
}: BankingDetailsToggleProps) {
  const handleToggle = () => {
    onToggle(!isVisible);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={`flex items-center gap-2 ${className}`}
    >
      {isVisible ? (
        <>
          <EyeOff className="h-4 w-4" />
          Hide Details
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Show Details
        </>
      )}
    </Button>
  );
}

interface BankingFieldToggleProps {
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
  className?: string;
}

export function BankingFieldToggle({ 
  isVisible, 
  onToggle, 
  className = '' 
}: BankingFieldToggleProps) {
  const handleToggle = () => {
    onToggle(!isVisible);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-1 text-gray-500 hover:text-gray-700 ${className}`}
      title={isVisible ? 'Hide' : 'Show'}
    >
      {isVisible ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );
}