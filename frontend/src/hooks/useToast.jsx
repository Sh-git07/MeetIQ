import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext({
  showToast: () => {}
});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '' });
  const timerRef = useRef(null);

  const showToast = useCallback((message, duration = 2600) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ visible: true, message });
    timerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        id="tt"
        role="status"
        aria-live="polite"
        className={`fixed left-1/2 bottom-8 -translate-x-1/2 bg-[#1B1630] text-[#FAF3E8] px-5 py-3 rounded-xl shadow-xl z-[120] text-sm font-medium tracking-wide transition-all duration-300 pointer-events-none ${
          toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
