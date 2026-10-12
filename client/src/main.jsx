import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./views/ErrorBoundary.jsx";
import StoreView from "./views/StoreView.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><BrowserRouter><StoreView /></BrowserRouter></ErrorBoundary>
);
