import type { ComponentType } from 'react';
import {
  Sprout,
  FlaskConical,
  Bug,
  HardHat,
  Droplets,
  Tractor,
  Truck,
  Wheat,
  Banknote,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Wallet,
  Send,
  Sparkles,
  MessageCircle,
  CircleAlert,
  Plus,
  Search,
  ChevronRight,
  CalendarDays,
  Trash2,
  House,
  Bot,
} from 'lucide-react-native';

export type CategoryKey =
  | 'seed'
  | 'fertiliser'
  | 'pesticide'
  | 'labour'
  | 'irrigation'
  | 'machinery'
  | 'transport'
  | 'crop_sale'
  | 'subsidy'
  | 'other';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'seed', label: 'Seed', icon: Sprout },
  { key: 'fertiliser', label: 'Fertiliser', icon: FlaskConical },
  { key: 'pesticide', label: 'Pesticide', icon: Bug },
  { key: 'labour', label: 'Labour', icon: HardHat },
  { key: 'irrigation', label: 'Irrigation', icon: Droplets },
  { key: 'machinery', label: 'Machinery', icon: Tractor },
  { key: 'transport', label: 'Transport', icon: Truck },
  { key: 'crop_sale', label: 'Crop Sale', icon: Wheat },
  { key: 'subsidy', label: 'Subsidy', icon: Banknote },
  { key: 'other', label: 'Other', icon: MoreHorizontal },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<CategoryKey, CategoryMeta>,
);

export const Icons = {
  TrendingUp,
  TrendingDown,
  Wallet,
  Send,
  Sparkles,
  MessageCircle,
  CircleAlert,
  Plus,
  Search,
  ChevronRight,
  CalendarDays,
  Trash2,
  House,
  Bot,
};
