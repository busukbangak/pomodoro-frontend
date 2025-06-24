import React, { createContext, useContext, useState } from 'react';

const RefreshContext = createContext<{ refreshKey: number; triggerRefresh: () => void }>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const useRefresh = () => useContext(RefreshContext);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);
  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

// Helper to check merge pending from storage (for non-React code and effects)
export function isMergePendingStorage() {
  return localStorage.getItem('mergePending') === '1';
} 