import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/Layout/MainLayout";
import { ProjectsPage } from "./features/projects/pages/ProjectsPage";
import { InstrumentsPage } from "./features/instruments/pages/InstrumentsPage";
import { ProjectDetailsPage } from "./features/projects/pages/ProjectDetailsPage"; // <--- Importante
import { CadViewerPage } from "./features/cad/pages/CadViewerPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rutas con el Layout Principal (Sidebar) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} /> {/* <--- Nueva Ruta */}
            <Route path="instruments" element={<InstrumentsPage />} />
            <Route path="calculator" element={<div className="p-8 text-slate-500">Próximamente...</div>} />
          </Route>

          {/* Ruta Fullscreen para el CAD (Sin Sidebar) */}
          <Route path="/project/:id/cad" element={<CadViewerPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;