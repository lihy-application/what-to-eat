// 类型定义
export type DayOfWeek = '周一' | '周二' | '周三' | '周四' | '周五';
export type MealTime = '午餐' | '晚餐';

export interface WindowOption {
  id: string;
  name: string;        // 窗口名称，如"川菜窗口"
  description?: string; // 描述，如"麻辣香锅、水煮肉片"
}

export interface DayMeals {
  午餐: WindowOption[];
  晚餐: WindowOption[];
}

export interface SelectionRecord {
  id: string;
  day: DayOfWeek;
  mealTime: MealTime;
  selectedWindow: WindowOption;
  accepted: boolean;
  timestamp: number;
}

export interface AppData {
  windows: Record<DayOfWeek, DayMeals>;
  history: SelectionRecord[];
}

export const DAYS: DayOfWeek[] = ['周一', '周二', '周三', '周四', '周五'];
export const MEAL_TIMES: MealTime[] = ['午餐', '晚餐'];

// 默认空数据
export const createEmptyData = (): AppData => ({
  windows: {
    周一: { 午餐: [], 晚餐: [] },
    周二: { 午餐: [], 晚餐: [] },
    周三: { 午餐: [], 晚餐: [] },
    周四: { 午餐: [], 晚餐: [] },
    周五: { 午餐: [], 晚餐: [] },
  },
  history: [],
});
