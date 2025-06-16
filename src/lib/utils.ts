
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React, { ReactNode } from "react";
import { UserCircle2, Users, PersonStanding, GripVertical, Target, Shield, MoreHorizontal } from 'lucide-react';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getPositionBadgeClass = (position?: string): string => {
  if (!position) return "bg-muted text-muted-foreground dark:bg-muted/70 dark:text-muted-foreground/70";
  switch (position?.toUpperCase()) {
    case 'QB':
      return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
    case 'RB':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
    case 'WR':
      return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
    case 'TE':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
    case 'K':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
    case 'DST':
    case 'DEF':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300';
    default:
      return "bg-muted text-muted-foreground dark:bg-muted/70 dark:text-muted-foreground/70";
  }
};

export const getPositionIcon = (position?: string): ReactNode => {
  if (!position) return (<MoreHorizontal size={18} className="text-muted-foreground" />);
  switch (position.toUpperCase()) {
    case 'QB':
      return (<UserCircle2 size={18} className="text-red-500 dark:text-red-400" />);
    case 'RB':
      return (<Users size={18} className="text-blue-500 dark:text-blue-400" />);
    case 'WR':
      return (<PersonStanding size={18} className="text-green-500 dark:text-green-400" />);
    case 'TE':
      return (<GripVertical size={18} className="text-yellow-500 dark:text-yellow-400" />);
    case 'K':
      return (<Target size={18} className="text-orange-500 dark:text-orange-400" />);
    case 'DST':
    case 'DEF':
      return (<Shield size={18} className="text-indigo-500 dark:text-indigo-400" />);
    default:
      return (<MoreHorizontal size={18} className="text-muted-foreground" />);
  }
};

export const getPositionName = (positionKey?: string): string => {
  if (!positionKey) return "N/A";
  const upperKey = positionKey.toUpperCase();
  switch (upperKey) {
    case 'QB': return 'Quarterback';
    case 'RB': return 'Running Back';
    case 'WR': return 'Wide Receiver';
    case 'TE': return 'Tight End';
    case 'K': return 'Kicker';
    case 'DST':
    case 'DEF': return 'Defense/Special Teams';
    case 'FLEX': return 'Flex (RB/WR/TE)';
    default: return positionKey;
  }
};

export const CHART_COLORS: { [key: string]: string } = {
  QB: 'hsl(var(--chart-1))',
  RB: 'hsl(var(--chart-2))',
  WR: 'hsl(var(--chart-3))',
  TE: 'hsl(var(--chart-4))',
  FLEX: 'hsl(var(--chart-5))',
  K: 'hsl(var(--destructive))',
  DST: 'hsl(var(--muted))',
  DEF: 'hsl(var(--muted))',
  DEFAULT: 'hsl(var(--foreground))'
};
