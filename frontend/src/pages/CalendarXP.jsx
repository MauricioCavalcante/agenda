import React, { useContext } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext, getTodayString } from '../context/AppContext';

export default function CalendarXP() {
  const navigate = useNavigate();
  const {
    calendarXp,
    calYear,
    calMonth,
    date,
    setDate,
    changeCalendarMonth,
    getDaysInMonthGrid,
    getMonthName
  } = useContext(AppContext);

  return (
    <div className="glass-panel calendar-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>
          <Calendar size={22} style={{ color: 'var(--color-system)', marginRight: '8px', verticalAlign: 'middle' }} />
          Painel de Evolução Mensal (Calendar)
        </h2>
        <div className="date-picker">
          <button onClick={() => changeCalendarMonth(-1)} className="date-btn">
            <ChevronLeft size={18} />
          </button>
          <div style={{ minWidth: '150px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
            {getMonthName(calMonth)} {calYear}
          </div>
          <button onClick={() => changeCalendarMonth(1)} className="date-btn">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
          <div key={day} className="calendar-weekday-header">{day}</div>
        ))}

        {/* Grid days */}
        {getDaysInMonthGrid(calYear, calMonth).map((cell, idx) => {
          const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const dayXp = calendarXp[cellDateStr] || 0;
          const isToday = cellDateStr === getTodayString();
          const isActive = cellDateStr === date;
          
          return (
            <div 
              key={idx} 
              onClick={() => {
                if (cell.isCurrentMonth) {
                  setDate(cellDateStr);
                  navigate('/dashboard');
                }
              }}
              className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`}
            >
              <span className="calendar-day-num">{cell.day}</span>
              {dayXp > 0 && (
                <span className="calendar-day-xp-badge has-xp">
                  +{dayXp} XP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
