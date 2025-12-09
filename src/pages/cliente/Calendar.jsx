// CalendarPage.jsx (ADECUADO - SOLUCIÓN DEL CONTEXTO DE STRIPE)

import React, { useState, useEffect } from "react";
import { 
    startOfMonth, endOfMonth, startOfWeek, 
    addDays, format, isSameMonth, isToday, isWeekend, 
} from "date-fns";
import { es } from 'date-fns/locale';

// 🟢 Importaciones Adicionales de Stripe
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js'; // Necesario para cargar la llave

// 🟢 Importar íconos para la persuasión
import { FaChevronLeft, FaChevronRight, FaCalendarCheck, FaWhatsapp } from "react-icons/fa"; 
// 🟢 Importar el flujo modular completo
import { Step1PackageSelection, Step2ScheduleSelection, Step3Payment, Step4Confirmation } from "./ModularFlowComponents";
import "./Styles.css";

// ----------------------------------------------------
// ⚠️ 1. CONFIGURACIÓN CLAVE DE STRIPE
// ----------------------------------------------------
// Reemplaza 'pk_test_TU_LLAVE_PUBLICA_AQUI' con tu llave real de Stripe
const STRIPE_PUBLIC_KEY = 'pk_test_TU_LLAVE_PUBLICA_AQUI'; 
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);


// ----------------------------------------------------
// SIMULACIÓN DE DISPONIBILIDAD (Base de datos ficticia)
// ----------------------------------------------------
const MAX_SLOTS_WEEKDAY = 8;
const MAX_SLOTS_WEEKEND = 5;

const simulatedAvailability = {};
// 💡 Horarios Ajustados: Incluimos 4:00 PM para la clase muestra
const HOURS = ["8:00 AM", "10:00 AM", "4:00 PM", "6:00 PM", "8:00 PM"];

// Función para inicializar datos simulados (Se mantiene igual)
const initializeAvailability = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    let currentDate = monthStart;

    const currentMonthKey = format(date, 'yyyy-MM');
    Object.keys(simulatedAvailability).forEach(key => {
        if (key.startsWith(currentMonthKey)) {
            delete simulatedAvailability[key];
        }
    });

    while (currentDate <= monthEnd) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        
        simulatedAvailability[dateKey] = HOURS.map(hour => {
            const isWeekendDay = isWeekend(currentDate);
            const max = isWeekendDay ? MAX_SLOTS_WEEKEND : MAX_SLOTS_WEEKDAY;
            const reserved = Math.floor(Math.random() * (max + 1)); 
            
            return {
                hour,
                maxSlots: max,
                available: max - reserved
            };
        });
        currentDate = addDays(currentDate, 1);
    }
};

initializeAvailability(new Date());

// ----------------------------------------------------
// COMPONENTE CALENDAR PAGE
// ----------------------------------------------------
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [weekOffset, setWeekOffset] = useState(0); 
  
  // 🟢 ESTADOS PARA EL FLUJO MODULAR
  const [selectedDayData, setSelectedDayData] = useState(null); // Contiene toda la info del día
  const [modalStep, setModalStep] = useState(0); // 0: Cerrado, 1: Paquete/Clase, 2: Horario, 3: Pago, 4: Confirmación
  const [selectionData, setSelectionData] = useState({}); // Datos acumulados de la reserva
  
  // 🟢 SIMULACIÓN DE CRÉDITOS DEL CLIENTE (debe venir del Perfil/API)
  const [userCredits, setUserCredits] = useState(2); // 0: Sin créditos, >0: Con créditos

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    // Inicializar disponibilidad cuando la fecha cambia (montaje o cambio de mes)
    initializeAvailability(currentDate);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentDate]); // Dependencia agregada para re-inicializar en cambio de mes
  
  // --- Lógica de renderCalendarDays (Se mantiene igual) ---
  const renderCalendarDays = () => {
    let startDate;
    let days = [];
    const MAX_DAYS_DESKTOP = 28; 

    if (isMobile) {
        const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        startDate = addDays(startOfCurrentWeek, weekOffset * 7);
    } else {
        const monthStart = startOfMonth(currentDate);
        let startOfWeekDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        
        let daysToSkip = 0;
        let dayCheck = startOfWeekDate;
        while (!isSameMonth(dayCheck, monthStart)) {
            daysToSkip++;
            dayCheck = addDays(dayCheck, 1);
            if (daysToSkip > 6) break; 
        }
        
        const daysInMonth = (endOfMonth(monthStart).getDate());

        if ((daysToSkip >= 5) && (daysInMonth >= 30)) {
            startDate = addDays(startOfWeekDate, 7); 
        } else {
            startDate = startOfWeekDate; 
        }
    }

    let day = startDate;
    let counter = 0; 
    
    while (counter < (isMobile ? 7 : MAX_DAYS_DESKTOP)) {
        days.push(day);
        day = addDays(day, 1);
        counter++;
    }
    
    return days;
  };
  // -------------------------------------------------------

  const daysToRender = renderCalendarDays();
  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });
  
  const prepareDayData = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const availability = simulatedAvailability[dateKey] || [];
    
    return {
      date: day,
      dateKey: dateKey,
      isWeekend: isWeekend(day),
      dayName: format(day, 'EEEE', { locale: es }),
      availability: availability
    };
  };
  
  const changeMonth = (amount) => {
      if (!isMobile) {
          setCurrentDate(prev => {
              const newDate = new Date(prev.getFullYear(), prev.getMonth() + amount, 1);
              // La inicialización se maneja en useEffect, pero la mantenemos aquí por si acaso
              initializeAvailability(newDate); 
              return newDate;
          });
      } else {
          setWeekOffset(prev => prev + amount);
      }
  };
  
  const getDaySummary = (day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const availability = simulatedAvailability[dateKey] || [];
      const totalAvailable = availability.reduce((sum, item) => sum + item.available, 0);
      
      let status;
      if (availability.length === 0) {
          status = <p className="status-full">No Disp.</p>; 
      } else if (totalAvailable === 0) {
          status = <p className="status-full">Lleno</p>;
      } else if (totalAvailable <= 10 && totalAvailable > 0) {
          status = <p className="status-low">Quedan {totalAvailable} Lugares</p>;
      } else {
          status = <p className="status-ok">Disponible</p>;
      }
      
      return <div className="status-summary">{status}</div>;
  };
  
  // ---------------- LÓGICA DE FLUJO MODULAR ----------------
  
  const handleDayClick = (dayData) => {
    setSelectedDayData(dayData);
    const isDayWeekend = isWeekend(dayData.date);
    
    if (isDayWeekend || userCredits === 0) {
        setModalStep(1); 
    } else {
        setSelectionData({ 
            selectionType: 'credit', 
            date: dayData.date,
            dateKey: dayData.dateKey,
            credits: userCredits 
        });
        setModalStep(2); 
    }
  };
    
  const handleCloseModal = () => {
      setModalStep(0);
      setSelectedDayData(null);
      setSelectionData({});
  };

  const handleNextStep = (data) => {
      // Acumula la data, y añade la fecha y dateKey al objeto de selección si no están
      setSelectionData(prev => ({ 
          ...prev, 
          ...data, 
          date: prev.date || selectedDayData.date, 
          dateKey: prev.dateKey || selectedDayData.dateKey 
      }));
      
      // Avanza un paso
      if (modalStep < 4) {
          setModalStep(modalStep + 1);
      } else {
          // Último paso (Confirmación)
          handleCloseModal(); 
      }
  };
  
  const updateCredits = () => {
      setUserCredits(prev => Math.max(0, prev - 1)); // Descontar 1 crédito
  }
  
  const renderModalContent = () => {
    if (!selectedDayData) return null;
    
    const isDayWeekend = isWeekend(selectedDayData.date); 
    
    switch (modalStep) {
        case 1:
            return <Step1PackageSelection 
                        onNext={handleNextStep} 
                        isWeekend={isDayWeekend} 
                        onClose={handleCloseModal}
                        date={selectedDayData.date}
                    />;
        case 2:
            return <Step2ScheduleSelection 
                        selection={selectionData} 
                        onNext={handleNextStep} 
                        isWeekend={isDayWeekend}
                        availability={selectedDayData.availability}
                        onClose={handleCloseModal}
                    />;
        case 3:
            // 💡 Envolvemos el Step3Payment en <Elements> para el contexto de Stripe
            return (
                <Elements stripe={stripePromise}>
                    <Step3Payment 
                        selection={selectionData} 
                        onNext={handleNextStep} 
                        onClose={handleCloseModal}
                    />
                </Elements>
            );
        case 4:
            return <Step4Confirmation 
                        selection={selectionData} 
                        onClose={handleCloseModal}
                        updateCredits={updateCredits} // Función para actualizar créditos
                    />;
        default:
            return null;
    }
  };

  return (
    <div className="calendar-container page-content-padded"> 
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="calendar-header">
        <button onClick={() => changeMonth(-1)} className="nav-btn-glass" aria-label={`Anterior ${isMobile ? 'semana' : 'mes'}`}>
            <FaChevronLeft />
        </button>
        <h2 className="calendar-title">
            <FaCalendarCheck style={{ marginRight: '10px' }} />
            {isMobile ? `Semana de ${format(daysToRender[0], 'MMM dd', { locale: es })}` : monthName}
        </h2>
        <button onClick={() => changeMonth(1)} className="nav-btn-glass" aria-label={`Siguiente ${isMobile ? 'semana' : 'mes'}`}>
            <FaChevronRight />
        </button>
      </div>

      {/* 🟢 BANNER DE PERSUASIÓN AGRESIVA */}
   

      {/* Días de la semana para la vista de escritorio */}
      {!isMobile && (
        <div className="days-of-week">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="day-name">{day}</div>
            ))}
        </div>
      )}

      {/* GRID DE DÍAS */}
      <div className="calendar-grid">
        {daysToRender.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayNumber = format(day, 'd');
            const dayNameShort = format(day, 'E', { locale: es });
            const isGrayedOut = !isSameMonth(day, currentDate);
            const today = isToday(day);
            const dayData = prepareDayData(day);
            const isDayWeekend = isWeekend(day);
            
            if (isMobile && isGrayedOut) {
                return null; 
            }

            // Determinar texto del botón basado en la LÓGICA DE NEGOCIO
            let buttonText;
            if (isDayWeekend) {
                buttonText = 'Reservar';
            } else if (userCredits > 0 && !isGrayedOut) {
                buttonText = 'Usar Crédito';
            } else {
                buttonText = 'Comprar';
            }


            return (
              <div 
                key={dateKey} 
                className={`day-card ${isGrayedOut && !isMobile ? 'grayed-out' : ''} ${today ? 'today-card' : ''} ${isDayWeekend ? 'weekend-card' : ''}`}
                onClick={!isGrayedOut ? () => handleDayClick(dayData) : undefined}
              >
                {/* Contenido de la tarjeta del día */}
                {!isMobile ? (
                  <>
                     {/* <p className="desktop-day-name">{dayNameShort}</p> */}
                    <h3 className="desktop-day-number">{dayNumber}</h3> 
                    
                    {!isGrayedOut && (
                        <>
                            {getDaySummary(day)} 
                            <button
                                className="btn-reservar"
                                onClick={!isGrayedOut ? () => handleDayClick(dayData) : undefined} 
                            >
                                {buttonText}
                            </button>
                        </>
                    )}
                  </>
                ) : (
                  // Móvil (Lista Semanal)
                  <>
                      <div className="mobile-day-info">
                          <h3 className="mobile-day-name">{format(day, 'EEEE', { locale: es })}</h3>
                          <p className="mobile-day-date">{dayNumber}</p>
                          {getDaySummary(day)}
                      </div>
                      <button
                          className="btn-reservar"
                          onClick={!isGrayedOut ? () => handleDayClick(dayData) : undefined}
                      >
                          {buttonText}
                      </button>
                  </>
                )}
              </div>
            );
        })}
      </div>

      {/* 🟢 MODAL FLOTANTE (Flujo modular) */}
      {modalStep > 0 && (
          <div className="modal-overlay" onClick={handleCloseModal}>
              <div onClick={e => e.stopPropagation()}>
                  {renderModalContent()}
              </div>
          </div>
      )}
    </div>
  );
}