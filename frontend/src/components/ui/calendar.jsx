"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Utility function for combining class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Button variants for styling
const buttonVariants = ({ variant = "default", size = "default" } = {}) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]}`;
};

// Calendar component with proper grid layout
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = "single",
  selected,
  onSelect,
  numberOfMonths = 1,
  ...props
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const getPreviousMonthDays = (date) => {
    const firstDay = getFirstDayOfMonth(date);
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    const days = [];
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isPreviousMonth: true,
        date: new Date(date.getFullYear(), date.getMonth() - 1, prevMonthDays - i)
      });
    }
    return days;
  };
  
  const getCurrentMonthDays = (date) => {
    const daysInMonth = getDaysInMonth(date);
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(date.getFullYear(), date.getMonth(), day)
      });
    }
    return days;
  };
  
  const getNextMonthDays = (date, currentDays) => {
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - currentDays;
    const days = [];
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNextMonth: true,
        date: new Date(date.getFullYear(), date.getMonth() + 1, day)
      });
    }
    return days;
  };
  
  const getAllDays = (date) => {
    const prevDays = getPreviousMonthDays(date);
    const currentDays = getCurrentMonthDays(date);
    const nextDays = getNextMonthDays(date, prevDays.length + currentDays.length);
    
    return [...prevDays, ...currentDays, ...nextDays];
  };
  
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };
  
  const isSelected = (day) => {
    if (!selected || !day.date) return false;
    
    if (mode === "single") {
      return selected && day.date.toDateString() === selected.toDateString();
    }
    
    if (mode === "range") {
      if (!selected?.from) return false;
      
      const dayTime = day.date.getTime();
      const fromTime = selected.from.getTime();
      
      if (!selected.to) {
        return dayTime === fromTime;
      }
      
      const toTime = selected.to.getTime();
      return dayTime >= fromTime && dayTime <= toTime;
    }
    
    return false;
  };
  
  const isRangeStart = (day) => {
    return mode === "range" && selected?.from && day.date.toDateString() === selected.from.toDateString();
  };
  
  const isRangeEnd = (day) => {
    return mode === "range" && selected?.to && day.date.toDateString() === selected.to.toDateString();
  };
  
  const isToday = (day) => {
    const today = new Date();
    return day.date.toDateString() === today.toDateString();
  };
  
  const handleDayClick = (day) => {
    if (!day.isCurrentMonth && !showOutsideDays) return;
    
    if (mode === "single") {
      onSelect?.(day.date);
    } else if (mode === "range") {
      if (!selected?.from || (selected.from && selected.to)) {
        onSelect?.({ from: day.date, to: null });
      } else if (selected.from && !selected.to) {
        if (day.date < selected.from) {
          onSelect?.({ from: day.date, to: selected.from });
        } else {
          onSelect?.({ from: selected.from, to: day.date });
        }
      }
    }
  };
  
  const renderMonth = (monthOffset = 0) => {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const allDays = getAllDays(monthDate);
    
    return (
      <div className="flex flex-col gap-4">
        {/* Month Header */}
        <div className="flex justify-between items-center mb-4 px-2">
          {monthOffset === 0 ? (
            <button
              onClick={() => navigateMonth(-1)}
              className="h-7 w-7 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800"
            >
              ‹
            </button>
          ) : (
            <div className="h-7 w-7"></div>
          )}
          
          <div className="text-sm font-medium">
            {months[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          
          {(numberOfMonths === 1 || monthOffset === numberOfMonths - 1) ? (
            <button
              onClick={() => navigateMonth(1)}
              className="h-7 w-7 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800"
            >
              ›
            </button>
          ) : (
            <div className="h-7 w-7"></div>
          )}
        </div>
        
        {/* Calendar Grid */}
        <table className="w-full border-collapse">
          {/* Week Days Header */}
          <thead>
            <tr className="flex">
              {weekDays.map((day) => (
                <th
                  key={day}
                  className="text-gray-600 rounded-md w-8 font-normal text-xs flex-1 text-center p-2"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Calendar Days */}
          <tbody>
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <tr key={weekIndex} className="flex w-full mt-2">
                {allDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <td
                    key={`${weekIndex}-${dayIndex}`}
                    className="relative p-0 text-center text-sm flex-1"
                  >
                    <button
                      onClick={() => handleDayClick(day)}
                      disabled={!day.isCurrentMonth && !showOutsideDays}
                      className={cn(
                        "h-8 w-8 p-0 font-normal rounded-md transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                        day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                        isSelected(day) && "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
                        isRangeStart(day) && "rounded-r-none",
                        isRangeEnd(day) && "rounded-l-none",
                        isToday(day) && !isSelected(day) && "bg-gray-100 text-gray-900",
                        (!day.isCurrentMonth && !showOutsideDays) && "invisible"
                      )}
                    >
                      {day.day}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={cn("p-3", className)}>
      <div className={cn(
        "flex gap-4",
        numberOfMonths === 2 ? "flex-row" : "flex-col"
      )}>
        {Array.from({ length: numberOfMonths }, (_, i) => (
          <div key={i}>
            {renderMonth(i)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Calendar };