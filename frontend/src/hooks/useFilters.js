import { useMemo } from 'react';

export const useFilters = (data, filters = {}) => {
  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === `All ${key.charAt(0).toUpperCase() + key.slice(1)}` || value.startsWith('All ')) {
          return true;
        }
        return item[key] === value;
      });
    });
  }, [data, filters]);

  return { filteredData };
};