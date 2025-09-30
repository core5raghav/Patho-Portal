import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";

// Utility function for combining class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// DatePicker Component for single date selection
export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  className = "",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange?.(date);
    setIsOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white",
          className
        )}
      >
        <span className={cn(
          "text-sm",
          selectedDate ? "text-gray-900" : "text-gray-500"
        )}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}

// DateRangePicker Component for date range selection
export function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date range",
  className = "",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(value);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    onChange?.(range);
    
    // Close when both dates are selected
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  const formatDateRange = (range) => {
    if (!range?.from) return '';
    if (!range.to) {
      return `${range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ...`;
    }
    return `${range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${range.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white",
          className
        )}
      >
        <span className={cn(
          "text-sm",
          selectedRange?.from ? "text-gray-900" : "text-gray-500"
        )}>
          {selectedRange?.from ? formatDateRange(selectedRange) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}