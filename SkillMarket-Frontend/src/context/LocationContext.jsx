import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('clientLocation');
    return saved ? JSON.parse(saved) : null;
  });

  const saveLocation = (loc) => {
    setLocation(loc);
    localStorage.setItem('clientLocation', JSON.stringify(loc));
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem('clientLocation');
  };

  return (
    <LocationContext.Provider value={{ location, saveLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation2 = () => useContext(LocationContext);