import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли токен в `localStorage`
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  return isAuthenticated;
};
