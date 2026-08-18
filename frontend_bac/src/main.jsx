import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";  // Ensure App.jsx is correctly imported
import "./index.css";  // Tailwind ya custom CSS ka reference yahan rahega
import { WallpaperProvider } from "./contexts/WallpaperContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WallpaperProvider>
      <App />
    </WallpaperProvider>
  </React.StrictMode>
);
