import { CategoryKey, type TechCategory } from '~~/types';

export const categories: TechCategory[] = [
  { key: CategoryKey.FRONTEND, label: 'Frontend'},
  { key: CategoryKey.BACKEND, label: 'Backend'},
  { key: CategoryKey.COMMUNICATION, label: 'Communication' },
  { key: CategoryKey.DATABASE, label: 'Database' },
  { key: CategoryKey.DEVOPS, label: 'DevOps' },
  { key: CategoryKey.CLOUD, label: 'Cloud' },
  { key: CategoryKey.MOBILE, label: 'Mobile'},
]


export const categoryColors: Record<
  string,
  { border: string; bg: string; text: string; accent: string }
> = {
  [CategoryKey.FRONTEND]: {
    border: "border-red-500 dark:border-red-400",
    bg: "bg-red-50 dark:bg-red-900",
    text: "text-red-600 dark:text-red-300",
    accent: "bg-red-500 dark:bg-red-500",
  },
  [CategoryKey.BACKEND]: {
    border: "border-emerald-500 dark:border-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
    accent: "bg-emerald-500 dark:bg-emerald-500",
  },
  [CategoryKey.COMMUNICATION]: {
    border: "border-purple-500 dark:border-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900",
    text: "text-purple-700 dark:text-purple-300",
    accent: "bg-purple-500 dark:bg-purple-500",
  },
  [CategoryKey.DATABASE]: {
    border: "border-indigo-500 dark:border-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
    accent: "bg-indigo-500 dark:bg-indigo-500",
  },
  [CategoryKey.DEVOPS]: {
    border: "border-amber-500 dark:border-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
    accent: "bg-amber-500 dark:bg-amber-500",
  },
  [CategoryKey.CLOUD]: {
    border: "border-sky-400 dark:border-sky-300",
    bg: "bg-sky-50 dark:bg-sky-900",
    text: "text-sky-600 dark:text-sky-200",
    accent: "bg-sky-400 dark:bg-sky-400",
  },
  [CategoryKey.MOBILE]: {
    border: "border-teal-400 dark:border-teal-300",
    bg: "bg-teal-50 dark:bg-teal-900",
    text: "text-teal-700 dark:text-teal-200",
    accent: "bg-teal-400 dark:bg-teal-400",
  },
};
