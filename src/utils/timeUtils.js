
import React from "react"

export const calculateWorkDetails = (startTimeISO, endTimeISO) => {
  const start = new Date(startTimeISO);
  const end = new Date(endTimeISO);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      durationHours: 0,
      nightHours: 0,
      expensesEuro: 0,
    };
  }

  const durationMs = end - start;
  const durationHours = durationMs / (1000 * 60 * 60);

  let nightHours = 0;
  let current = new Date(start);

  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setHours(current.getHours() + 1, 0, 0, 0);
    
    const segmentEnd = nextHour < end ? nextHour : end;
    const segmentDurationMs = segmentEnd - current;

    const hour = current.getHours();
    if (hour >= 22 || hour < 6) {
      nightHours += segmentDurationMs / (1000 * 60 * 60);
    }
    current = nextHour;
  }
  
  const expensesEuro = durationHours > 8 ? 13 : 0;

  return {
    durationHours: parseFloat(durationHours.toFixed(2)),
    nightHours: parseFloat(nightHours.toFixed(2)),
    expensesEuro,
  };
};

export const formatDate = (dateISO) => {
  if (!dateISO) return "";
  const date = new Date(dateISO);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatTime = (dateISO) => {
  if (!dateISO) return "";
  const date = new Date(dateISO);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (hours) => {
  if (typeof hours !== 'number' || isNaN(hours)) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};
  