import {
  Network,
  Database,
  Terminal,
  Cpu,
  Globe,
  BookOpen,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';

export interface SubjectTheme {
  code: string;
  shortName: string;
  icon: LucideIcon;
  emoji: string;
  gradientBg: string;
  lightBg: string;
  accentColor: string;
  borderHover: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
}

const themeMap: Record<string, SubjectTheme> = {
  'sub-cn': {
    code: 'CS-301',
    shortName: 'CN',
    icon: Network,
    emoji: '🌐',
    gradientBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    lightBg: 'bg-emerald-500/10',
    accentColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  'sub-dbms': {
    code: 'CS-302',
    shortName: 'DBMS',
    icon: Database,
    emoji: '🗄️',
    gradientBg: 'from-sky-500/20 via-blue-500/10 to-transparent',
    lightBg: 'bg-sky-500/10',
    accentColor: 'text-sky-400',
    borderHover: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    badgeText: 'text-sky-300',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
  },
  'sub-os': {
    code: 'CS-303',
    shortName: 'OS',
    icon: Terminal,
    emoji: '💻',
    gradientBg: 'from-violet-500/20 via-purple-500/10 to-transparent',
    lightBg: 'bg-violet-500/10',
    accentColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
    badgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    badgeText: 'text-violet-300',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
  },
  'sub-ml': {
    code: 'CS-304',
    shortName: 'ML',
    icon: Cpu,
    emoji: '🤖',
    gradientBg: 'from-amber-500/20 via-orange-500/10 to-transparent',
    lightBg: 'bg-amber-500/10',
    accentColor: 'text-amber-400',
    borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    badgeText: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  'sub-wt': {
    code: 'CS-305',
    shortName: 'WT',
    icon: Globe,
    emoji: '🚀',
    gradientBg: 'from-rose-500/20 via-pink-500/10 to-transparent',
    lightBg: 'bg-rose-500/10',
    accentColor: 'text-rose-400',
    borderHover: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    badgeText: 'text-rose-300',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
  },
  'sub-cs': {
    code: 'CS-306',
    shortName: 'Security',
    icon: ShieldCheck,
    emoji: '🛡️',
    gradientBg: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    lightBg: 'bg-cyan-500/10',
    accentColor: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    badgeText: 'text-cyan-300',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
};

const defaultTheme: SubjectTheme = {
  code: 'COURSE',
  shortName: 'SUB',
  icon: BookOpen,
  emoji: '📚',
  gradientBg: 'from-indigo-500/20 via-blue-500/10 to-transparent',
  lightBg: 'bg-indigo-500/10',
  accentColor: 'text-indigo-400',
  borderHover: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
  badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  badgeText: 'text-indigo-300',
  iconBg: 'bg-indigo-500/20',
  iconColor: 'text-indigo-400',
};

export function getSubjectTheme(subjectIdOrCode?: string): SubjectTheme {
  if (!subjectIdOrCode) return defaultTheme;
  const key = subjectIdOrCode.toLowerCase();
  for (const [id, theme] of Object.entries(themeMap)) {
    if (key.includes(id) || key.includes(theme.code.toLowerCase())) {
      return theme;
    }
  }
  return defaultTheme;
}
