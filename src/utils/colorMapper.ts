export interface ColorTheme {
  background: string;
  text: string;
  border: string;
  ring: string;
  badge: string;
  gradient: string;
  hover: string;
}

export const COLOR_MAP: Record<string, ColorTheme> = {
  rose: {
    background: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'focus:ring-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    gradient: 'from-rose-400 to-pink-500',
    hover: 'hover:bg-rose-100/50',
  },
  pink: {
    background: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    ring: 'focus:ring-pink-500',
    badge: 'bg-pink-100 text-pink-800 border-pink-200',
    gradient: 'from-pink-400 to-rose-500',
    hover: 'hover:bg-pink-100/50',
  },
  amber: {
    background: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-250',
    ring: 'focus:ring-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-400 to-orange-500',
    hover: 'hover:bg-amber-100/50',
  },
  emerald: {
    background: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-400 to-teal-500',
    hover: 'hover:bg-emerald-100/50',
  },
  blue: {
    background: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'focus:ring-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    gradient: 'from-blue-400 to-indigo-500',
    hover: 'hover:bg-blue-100/50',
  },
  indigo: {
    background: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    ring: 'focus:ring-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    gradient: 'from-indigo-400 to-purple-500',
    hover: 'hover:bg-indigo-100/50',
  },
  violet: {
    background: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    ring: 'focus:ring-violet-500',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    gradient: 'from-violet-400 to-fuchsia-500',
    hover: 'hover:bg-violet-100/50',
  },
  sky: {
    background: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    ring: 'focus:ring-sky-500',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    gradient: 'from-sky-400 to-blue-500',
    hover: 'hover:bg-sky-100/50',
  },
};

export function getColors(color: string | undefined): ColorTheme {
  return COLOR_MAP[color || 'amber'] || COLOR_MAP.amber;
}
