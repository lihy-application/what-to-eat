import { AppData, DayMeals } from './types';
import { defaultWindows } from './defaultWindows';

const STORAGE_KEY = 'what-to-eat-data';

// 创建空数据
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

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  // 使用默认窗口配置
  return {
    windows: defaultWindows,
    history: [],
  };
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const resetToDefault = (): AppData => {
  localStorage.removeItem(STORAGE_KEY);
  return {
    windows: defaultWindows,
    history: [],
  };
};
