import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";

import "@/index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/SupabaseAuthContext";

// Service Worker'ni ro'yxatdan o'tkazish
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker ro\'yxatdan o\'tkazildi:', registration);
      })
      .catch(error => {
        console.error('Service Worker ro\'yxatdan o\'tkazishda xatolik:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);