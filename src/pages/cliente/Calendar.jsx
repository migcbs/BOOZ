import React, { useState, useEffect, useCallback } from "react";
import { startOfMonth, startOfWeek, addDays, format, isSameMonth, isToday, getDay } from "date-fns";
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReservaPopup from "./ReservaPopup";
import "./Calendar.css";
import API_BASE_URL from '../../apiConfig';

export default function CalendarPage() {
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 768);
  const [weekOffset, setWeekOffset]       = useState(0);
  const [userCredits, setUserCredits]     = useState(0);
  const [availability, setAvailability]   = useState({});
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [loading, setLoading]             = useState(true);

  // ✅ CORRECCIÓN: clave booz_user
  const fetchUserCredits = useCallback(() => {
    const storedUser = localStorage.getItem("booz_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserCredits(user?.creditosDisponibles || 0);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="calendar-container page-content-padded">

      {/* HEADER */}
      <div className="calendar-header">
        <button
          onClick={() => isMobile ? setWeekOffset(w => w - 1) : setCurrentDate(d => addDays(d, -30))}
          className="nav-btn-glass"
          aria-label="Anterior"
        >
          <FaChevronLeft />
        </button>

        <div className="calendar-title-group">
          <h2 className="calendar-title">
            {isMobile
              ? `Semana ${format(daysToRender[0], 'dd MMM', { locale: es })}`
              : format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()}
          </h2>
          {/* ✅ Badge de créditos más visible */}
          <span className="credits-badge">
            Tus créditos: <b>{userCredits}</b>
          </span>
        </div>

        <button
          onClick={() => isMobile ? setWeekOffset(w => w + 1) : setCurrentDate(d => addDays(d, 30))}
          className="nav-btn-glass"
          aria-label="Siguiente"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="calendar-loading">
          <div className="calendar-spinner" />
          <p>Cargando clases...</p>
        </div>
      ) : (
        <div className="calendar-grid">
          {daysToRender.map((day) => {
            const dateKey   = format(day, 'yyyy-MM-dd');
            const classes   = availability[dateKey] || [];
            const isGray    = !isSameMonth(day, currentDate);
            const hasClases = classes.length > 0;

            return (
              <div
                key={dateKey}
                className={`day-card
                  ${isGray && !isMobile ? 'grayed-out' : ''}
                  ${isToday(day) ? 'today-card' : ''}
                  ${hasClases ? 'has-sessions' : ''}
                `}
                onClick={() => setSelectedDayData({
                  date: day,
                  dayName: format(day, 'EEEE', { locale: es }),
                  availableClasses: classes
                })}
              >
                {/* Día */}
                <div className="day-header-info">
                  <span className="day-name-mini">
                    {format(day, 'EEE', { locale: es }).toUpperCase()}
                  </span>
                  <span className="day-number">{format(day, 'd')}</span>
                </div>

                {/* Sesiones */}
                <div className="sessions-preview">
                  {hasClases ? (
                    <>
                      {classes.slice(0, 3).map((clase, idx) => (
                        <div
                          key={idx}
                          className="session-dot-line"
                          style={{ borderLeftColor: clase.color || '#8FD9FB' }}
                        >
                          <b>{format(new Date(clase.fecha), 'HH:mm')}</b>
                          <span>{clase.nombre}</span>
                        </div>
                      ))}
                      {classes.length > 3 && (
                        <span className="more-sessions">+{classes.length - 3} más</span>
                      )}
                    </>
                  ) : (
                    <span className="no-class-label">Sin clase</span>
                  )}
                </div>

                {/* Botón */}
                <button className={`btn-reservar-ios ${hasClases ? 'pulse-btn' : ''}`}>
                  {hasClases ? `Ver ${classes.length} clase${classes.length > 1 ? 's' : ''}` : 'Disponible'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
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