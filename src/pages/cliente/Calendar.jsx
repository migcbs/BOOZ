import React, { useState, useEffect, useCallback } from "react";
import { startOfMonth, startOfWeek, addDays, format, isSameMonth, isToday, getDay } from "date-fns";
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaCalendarCheck } from "react-icons/fa"; 
import ReservaPopup from "./ReservaPopup";
import "./Styles.css";
// 🟢 IMPORTACIÓN DINÁMICA (Ajustada a 2 niveles si estás en src/pages/cliente)
import API_BASE_URL from '../../apiConfig'; 

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [weekOffset, setWeekOffset] = useState(0); 
  const [userCredits, setUserCredits] = useState(0);
  const [availability, setAvailability] = useState({}); 
  const [selectedDayData, setSelectedDayData] = useState(null);

  const fetchUserCredits = useCallback(() => {
    // 🟢 Agregamos un try-catch o validación para evitar errores de null
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserCredits(user?.creditosDisponibles || 0);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      /**
       * 🟢 ADECUACIÓN PARA VERCEL:
       * Usamos API_BASE_URL. El backend procesará /api/clases/disponibles
       */
      const response = await fetch(`${API_BASE_URL}/clases/disponibles`);
      const clases = await response.json();
      
      const newAvail = {};
      clases.forEach(c => {
        const key = format(new Date(c.fecha), 'yyyy-MM-dd');
        if (!newAvail[key]) newAvail[key] = [];
        newAvail[key].push(c);
      });
      setAvailability(newAvail);
    } catch (e) { 
        console.error("Error cargando disponibilidad:", e); 
    }
  }, []);

  useEffect(() => {
    fetchUserCredits();
    loadAvailability();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchUserCredits, loadAvailability]);

  const daysToRender = (() => {
    let start = isMobile 
      ? addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7) 
      : startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    return Array.from({ length: isMobile ? 7 : 35 }, (_, i) => addDays(start, i));
  })();

  return (
    <div className="calendar-container page-content-padded animate-ios-entry" style={{fontFamily: "'Nunito', sans-serif"}}> 
      
      <div className="calendar-header">
        <button onClick={() => isMobile ? setWeekOffset(w => w - 1) : setCurrentDate(d => addDays(d, -30))} className="nav-btn-glass">
          <FaChevronLeft />
        </button>
        
        <div className="calendar-title-group">
            <h2 className="calendar-title">
                {isMobile 
                  ? `Semana ${format(daysToRender[0], 'dd MMM', { locale: es })}` 
                  : format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()}
            </h2>
            <span className="credits-badge">Tus créditos: <b>{userCredits}</b></span>
        </div>
        
        <button onClick={() => isMobile ? setWeekOffset(w => w + 1) : setCurrentDate(d => addDays(d, 30))} className="nav-btn-glass">
          <FaChevronRight />
        </button>
      </div>

      <div className="calendar-grid">
        {daysToRender.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const classes = availability[dateKey] || [];
            const isGray = !isSameMonth(day, currentDate);
            const dayOfWeek = getDay(day);

            return (
              <div 
                key={dateKey} 
                className={`day-card 
                  ${isGray && !isMobile ? 'grayed-out' : ''} 
                  ${isToday(day) ? 'today-card' : ''} 
                  ${classes.length > 0 ? 'has-sessions' : ''}
                `}
                onClick={() => setSelectedDayData({ 
                  date: day, 
                  dayName: format(day, 'EEEE', { locale: es }),
                  availableClasses: classes 
                })}
              >
                <div className="day-header-info">
                    <span className="day-number">{format(day, 'd')}</span>
                    <span className="day-name-mini">
                        {format(day, 'EEE', { locale: es }).toUpperCase()}
                    </span>
                </div>
                
                <div className="sessions-preview">
                  {classes.length > 0 ? (
                    <>
                      {classes.slice(0, 4).map((clase, idx) => (
                        <div 
                          key={idx} 
                          className="session-dot-line"
                          style={{ borderLeft: `3px solid ${clase.color || '#8FD9FB'}` }}
                        >
                          <b>{format(new Date(clase.fecha), 'HH:mm')}</b> &nbsp; {clase.nombre}
                        </div>
                      ))}
                      {classes.length > 4 && (
                        <span className="more-sessions">+{classes.length - 4} clases más</span>
                      )}
                    </>
                  ) : (
                    <div style={{ opacity: 0.3, fontSize: '10px', marginTop: '10px', fontWeight: 700 }}>
                      DISPONIBLE
                    </div>
                  )}
                </div>

                <button className={`btn-reservar-ios ${classes.length > 0 ? 'pulse-btn' : ''}`}>
                  {classes.length > 0 ? "VER CLASES" : "SIN CLASE"}
                </button>
              </div>
            );
        })}
      </div>

      {selectedDayData && (
          <ReservaPopup 
            dayData={selectedDayData} 
            close={() => { 
              setSelectedDayData(null); 
              fetchUserCredits();
              loadAvailability(); 
            }} 
          />
      )}
    </div>
  );
}