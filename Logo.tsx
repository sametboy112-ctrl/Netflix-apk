import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-1.5 select-none', className)}>
      <div className="relative bg-[#141414] rounded-lg p-1 border border-white/10">
        <Play className="w-5 h-5 fill-red-600 text-red-600" />
      </div>
      {!iconOnly && <span className="text-2xl font-black tracking-tighter text-white uppercase italic">flixvzn</span>}
    </div>
  );
}
