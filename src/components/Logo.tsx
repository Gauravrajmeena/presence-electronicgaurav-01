
import React from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("font-semibold tracking-tight flex items-center gap-2", sizeClasses[size], className)}>
      <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-indigo-600/40 animate-pulse-subtle"></div>
        <GraduationCap className="w-6 h-6 relative z-10 text-primary animate-float" />
      </div>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">Presence</span>
    </div>
  );
};

export default Logo;
