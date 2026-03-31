import { useState, useEffect } from 'react';
import './App.css';
import type { AppData, DayOfWeek, MealTime, WindowOption, SelectionRecord } from './types';
import { DAYS, MEAL_TIMES, createEmptyData } from './types';
import { loadData, saveData, generateId, resetToDefault } from './storage';

// 图片路径映射
const getImagePath = (day: DayOfWeek, index: number): string => {
  return `/候选窗口/${day}/${index}.png`;
};

function App() {
  const [data, setData] = useState<AppData>(createEmptyData());
  const [currentView, setCurrentView] = useState<'home' | 'manage' | 'history'>('home');
  
  // 随机选择状态
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime | null>(null);
  const [randomOption, setRandomOption] = useState<WindowOption | null>(null);
  
  // 同时选择午餐和晚餐
  const [showBoth, setShowBoth] = useState(false);
  const [lunchOption, setLunchOption] = useState<WindowOption | null>(null);
  const [dinnerOption, setDinnerOption] = useState<WindowOption | null>(null);

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
  }, []);

  // 获取今天的日期对应的星期
  const getTodayDay = (): DayOfWeek => {
    const dayOfWeek = new Date().getDay();
    const mapping: Record<number, DayOfWeek> = {
      1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 0: '周一'
    };
    return mapping[dayOfWeek] || '周一';
  };

  // 随机选择一个窗口
  const handleRandomSelect = (day?: DayOfWeek, mealTime?: MealTime) => {
    const targetDay = day || getTodayDay();
    const targetMealTime = mealTime || '午餐';
    
    const options = data.windows[targetDay][targetMealTime];
    if (options.length === 0) {
      alert('当前没有可用的窗口，请先在窗口管理中添加');
      return;
    }

    const randomIndex = Math.floor(Math.random() * options.length);
    setSelectedDay(targetDay);
    setSelectedMealTime(targetMealTime);
    setRandomOption(options[randomIndex]);
  };

  // 同时选择午餐和晚餐
  const handleSelectBoth = (day?: DayOfWeek) => {
    const targetDay = day || getTodayDay();
    const lunchOptions = data.windows[targetDay]['午餐'];
    const dinnerOptions = data.windows[targetDay]['晚餐'];
    
    if (lunchOptions.length === 0 || dinnerOptions.length === 0) {
      alert('当前没有足够的窗口，请先在窗口管理中添加');
      return;
    }

    const lunchIndex = Math.floor(Math.random() * lunchOptions.length);
    const dinnerIndex = Math.floor(Math.random() * dinnerOptions.length);
    
    setSelectedDay(targetDay);
    setLunchOption(lunchOptions[lunchIndex]);
    setDinnerOption(dinnerOptions[dinnerIndex]);
    setShowBoth(true);
  };

  // 接受今日推荐
  const handleAcceptBoth = () => {
    if (!lunchOption || !dinnerOption || !selectedDay) return;

    const lunchRecord: SelectionRecord = {
      id: generateId(),
      day: selectedDay,
      mealTime: '午餐',
      selectedWindow: lunchOption,
      accepted: true,
      timestamp: Date.now(),
    };
    
    const dinnerRecord: SelectionRecord = {
      id: generateId(),
      day: selectedDay,
      mealTime: '晚餐',
      selectedWindow: dinnerOption,
      accepted: true,
      timestamp: Date.now(),
    };

    const newData = {
      ...data,
      history: [lunchRecord, dinnerRecord, ...data.history],
    };
    setData(newData);
    saveData(newData);
    
    alert(`午餐: ${lunchOption.name}\n晚餐: ${dinnerOption.name}`);
    setShowBoth(false);
    setLunchOption(null);
    setDinnerOption(null);
  };

  // 接受选择
  const handleAccept = () => {
    if (!randomOption || !selectedDay || !selectedMealTime) return;

    const record: SelectionRecord = {
      id: generateId(),
      day: selectedDay,
      mealTime: selectedMealTime,
      selectedWindow: randomOption,
      accepted: true,
      timestamp: Date.now(),
    };

    const newData = {
      ...data,
      history: [record, ...data.history],
    };
    setData(newData);
    saveData(newData);
    
    alert(`已选择: ${randomOption.name}`);
    setRandomOption(null);
  };

  // 拒绝选择，重新随机
  const handleReject = () => {
    if (selectedDay && selectedMealTime) {
      handleRandomSelect(selectedDay, selectedMealTime);
    }
  };

  // 更新窗口信息
  const updateWindow = (day: DayOfWeek, mealTime: MealTime, index: number, name: string, description: string) => {
    const newWindows = { ...data.windows };
    const option: WindowOption = {
      id: `${day}-${mealTime}-${index}`,
      name: name || `窗口 ${index}`,
      description,
    };
    newWindows[day][mealTime] = [...newWindows[day][mealTime]];
    newWindows[day][mealTime][index] = option;
    
    const newData = { ...data, windows: newWindows };
    setData(newData);
    saveData(newData);
  };

  // 添加窗口
  const addWindow = (day: DayOfWeek, mealTime: MealTime) => {
    const newWindows = { ...data.windows };
    const newOption: WindowOption = {
      id: generateId(),
      name: '',
      description: '',
    };
    newWindows[day][mealTime] = [...newWindows[day][mealTime], newOption];
    
    const newData = { ...data, windows: newWindows };
    setData(newData);
    saveData(newData);
  };

  // 删除窗口
  const deleteWindow = (day: DayOfWeek, mealTime: MealTime, index: number) => {
    const newWindows = { ...data.windows };
    newWindows[day][mealTime] = newWindows[day][mealTime].filter((_, i) => i !== index);
    
    const newData = { ...data, windows: newWindows };
    setData(newData);
    saveData(newData);
  };

  // 计算偏好
  const getPreferences = (): { windowName: string; count: number }[] => {
    const counts: Record<string, number> = {};
    data.history.filter(r => r.accepted).forEach(r => {
      counts[r.selectedWindow.name] = (counts[r.selectedWindow.name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ windowName: name, count }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <div className="app">
      <nav className="nav">
        <button 
          className={currentView === 'home' ? 'active' : ''} 
          onClick={() => setCurrentView('home')}
        >
          今天吃啥
        </button>
        <button 
          className={currentView === 'manage' ? 'active' : ''} 
          onClick={() => setCurrentView('manage')}
        >
          窗口管理
        </button>
        <button 
          className={currentView === 'history' ? 'active' : ''} 
          onClick={() => setCurrentView('history')}
        >
          历史记录
        </button>
      </nav>

      {currentView === 'home' && (
        <div className="home-view">
          <div className="hero-section">
            <h1>今天吃啥？</h1>
            <p className="subtitle">{getTodayDay()} · {new Date().toLocaleDateString('zh-CN')}</p>
          </div>

          {!randomOption && !showBoth ? (
            <div className="selection-panel">
              <button 
                className="both-btn"
                onClick={() => handleSelectBoth(getTodayDay())}
              >
                🍚 + 🍜 午餐和晚餐都选
              </button>
              <div className="meal-time-selector">
                <button 
                  className="meal-btn"
                  onClick={() => handleRandomSelect(getTodayDay(), '午餐')}
                >
                  🍚 随机选午餐
                </button>
                <button 
                  className="meal-btn"
                  onClick={() => handleRandomSelect(getTodayDay(), '晚餐')}
                >
                  🍜 随机选晚餐
                </button>
              </div>
              <div className="day-selector">
                {DAYS.map(day => (
                  <button 
                    key={day}
                    className={`day-btn ${day === getTodayDay() ? 'today' : ''}`}
                    onClick={() => handleRandomSelect(day, selectedMealTime || '午餐')}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          ) : showBoth ? (
            <div className="result-panel">
              <div className="both-result">
                <div className="result-card lunch-card">
                  <span className="meal-label">🍚 午餐</span>
                  <h2>{lunchOption?.name}</h2>
                  {lunchOption?.description && (
                    <p className="description">{lunchOption.description}</p>
                  )}
                </div>
                <div className="result-card dinner-card">
                  <span className="meal-label">🍜 晚餐</span>
                  <h2>{dinnerOption?.name}</h2>
                  {dinnerOption?.description && (
                    <p className="description">{dinnerOption.description}</p>
                  )}
                </div>
              </div>
              <div className="action-buttons">
                <button className="reject-btn" onClick={() => setShowBoth(false)}>
                  不满意 ⟳
                </button>
                <button className="accept-btn" onClick={handleAcceptBoth}>
                  就这样吃 ✓
                </button>
              </div>
            </div>
          ) : (
            <div className="result-panel">
              <div className="result-card">
                <h2>{randomOption.name}</h2>
                {randomOption.description && (
                  <p className="description">{randomOption.description}</p>
                )}
                <div className="result-meta">
                  <span>{selectedDay}</span>
                  <span>{selectedMealTime}</span>
                </div>
              </div>
              <div className="action-buttons">
                <button className="reject-btn" onClick={handleReject}>
                  不想要 ⟳
                </button>
                <button className="accept-btn" onClick={handleAccept}>
                  就吃这个 ✓
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === 'manage' && (
        <div className="manage-view">
          <div className="manage-header">
            <h2>窗口管理</h2>
            <button 
              className="reset-btn"
              onClick={() => {
                if (confirm('确定要重置为默认配置吗？这将清除所有自定义修改。')) {
                  const defaultData = resetToDefault();
                  setData(defaultData);
                  alert('已重置为默认配置！');
                }
              }}
            >
              🔄 重置为默认配置
            </button>
          </div>
          <p className="hint">当前配置：周一午餐14个窗口，晚餐15个窗口</p>
          
          <div className="manage-grid">
            {DAYS.map(day => (
              <div key={day} className="manage-day-card">
                <h3 className="manage-day-title">{day}</h3>
                {MEAL_TIMES.map(mealTime => (
                  <div key={mealTime} className="manage-meal-section">
                    <h4>{mealTime}</h4>
                    <div className="manage-windows">
                      {[1, 2, 3, 4, 5].map((imgIndex, idx) => {
                        const windowData = data.windows[day][mealTime]?.[idx];
                        return (
                          <div key={imgIndex} className="manage-window-item">
                            <div className="manage-window-img">
                              <img 
                                src={getImagePath(day, imgIndex)} 
                                alt={`窗口${imgIndex}`}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder={`窗口${imgIndex}名称`}
                              value={windowData?.name || ''}
                              onChange={(e) => updateWindow(day, mealTime, idx, e.target.value, windowData?.description || '')}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'history' && (
        <div className="history-view">
          <h2>历史记录</h2>
          
          <div className="preference-section">
            <h3>我的偏好</h3>
            {getPreferences().length > 0 ? (
              <div className="preference-list">
                {getPreferences().map((pref, idx) => (
                  <div key={idx} className="preference-item">
                    <span className="pref-name">{pref.windowName}</span>
                    <span className="pref-count">{pref.count}次</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">还没有选择记录</p>
            )}
          </div>

          <div className="history-section">
            <h3>选择历史</h3>
            {data.history.length > 0 ? (
              <div className="history-list">
                {data.history.map(record => (
                  <div 
                    key={record.id} 
                    className={`history-item ${record.accepted ? 'accepted' : 'rejected'}`}
                  >
                    <div className="history-info">
                      <span className="history-window">{record.selectedWindow.name}</span>
                      <span className="history-meta">{record.day} · {record.mealTime}</span>
                    </div>
                    <span className="history-status">
                      {record.accepted ? '✓ 已接受' : '✗ 已拒绝'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">还没有选择记录</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
