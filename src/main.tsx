import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe Google AdsbyGoogle errors and push interceptor to prevent Uncaught TagErrors
(function() {
  if (typeof window !== "undefined") {
    // 1. Intercept console.error output to suppress direct error logging by AdSense libraries
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      try {
        const fullMessage = args.map(arg => {
          if (arg instanceof Error) {
            return arg.stack || arg.message || String(arg);
          }
          if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg); } catch(e) { return String(arg); }
          }
          return String(arg);
        }).join(' ');

        if (
          fullMessage.includes('adsbygoogle') || 
          fullMessage.includes('TagError') || 
          fullMessage.includes('No slot size') || 
          fullMessage.includes('already have ads in them')
        ) {
          console.warn("Safe Interceptor: Suppressed AdSense console.error cleanly:", args[0]);
          return;
        }
      } catch (err) {
        // Fallback safety in case string mapping throws
      }
      return originalConsoleError.apply(this, args);
    };

    // 2. Assign window.onerror to suppress uncaught custom TagError classes in older/specific browsers
    const oldOnerror = window.onerror;
    window.onerror = function(message, url, line, col, error) {
      const msgStr = String(message || '');
      const errStr = error ? (error.stack || error.message || String(error)) : '';
      if (
        msgStr.includes('adsbygoogle') || 
        msgStr.includes('TagError') || 
        msgStr.includes('No slot size') || 
        msgStr.includes('already have ads in them') ||
        errStr.includes('adsbygoogle') ||
        errStr.includes('TagError') ||
        errStr.includes('No slot size') ||
        errStr.includes('already have ads in them')
      ) {
        console.warn("Safe Interceptor: Suppressed AdSense exception via window.onerror");
        return true; // prevents default browser error box/reporting
      }
      if (oldOnerror) {
        return (oldOnerror as any).apply(this, arguments);
      }
      return false;
    };

    // 3. Intercept global error events to fully suppress Uncaught exceptions
    window.addEventListener('error', function(event) {
      const message = event.message || '';
      const error = event.error;
      const errorStr = error ? (error.stack || error.message || String(error)) : '';
      const errorName = (error && error.name) || '';

      if (
        message.includes('adsbygoogle') || 
        message.includes('TagError') || 
        message.includes('No slot size') || 
        message.includes('already have ads in them') ||
        errorName === 'TagError' ||
        errorStr.includes('adsbygoogle') ||
        errorStr.includes('TagError') ||
        errorStr.includes('No slot size') ||
        errorStr.includes('already have ads in them')
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.warn("Safe Interceptor: Suppressed AdSense TagError from runtime listener.");
        return true;
      }
    }, true);

    // 4. Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      const message = reason ? (reason.message || String(reason)) : '';
      const errorStr = reason && reason.stack ? reason.stack : '';

      if (
        message.includes('adsbygoogle') || 
        message.includes('TagError') || 
        message.includes('No slot size') || 
        message.includes('already have ads in them') ||
        errorStr.includes('adsbygoogle') ||
        errorStr.includes('TagError') ||
        errorStr.includes('No slot size') ||
        errorStr.includes('already have ads in them')
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.warn("Safe Interceptor: Suppressed AdSense Promise Rejection.");
      }
    }, true);

    // 5. Setup a safe array for adsbygoogle with error-handling push
    let originalArray = (window as any).adsbygoogle || [];
    if (!Array.isArray(originalArray)) {
      originalArray = [];
    }

    const wrapPush = (arr: any[]) => {
      const origPush = arr.push;
      arr.push = function(...args: any[]) {
        try {
          return origPush.apply(this, args);
        } catch (err) {
          console.warn("Safe Interceptor: Suppressed error within adsbygoogle.push():", err);
          return null;
        }
      };
    };

    wrapPush(originalArray);

    Object.defineProperty(window, 'adsbygoogle', {
      get() {
        return originalArray;
      },
      set(val) {
        if (Array.isArray(val)) {
          wrapPush(val);
          originalArray = val;
        } else if (val && typeof val === 'object') {
          // If AdSense replaces it with a custom object, wrap its push method as well
          const origPush = val.push;
          if (typeof origPush === 'function') {
            val.push = function(...args: any[]) {
              try {
                return origPush.apply(this, args);
              } catch (err) {
                console.warn("Safe Interceptor: Suppressed error within custom adsbygoogle.push():", err);
                return null;
              }
            };
          }
          originalArray = val;
        } else {
          originalArray = val;
        }
      },
      configurable: true
    });
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
