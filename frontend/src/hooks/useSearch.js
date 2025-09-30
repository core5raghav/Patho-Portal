import { useMemo } from 'react';

export const useSearch = (data, searchTerm, searchFields = []) => {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return searchFields.some(field => 
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm, searchFields]);

  return { filteredData };
};