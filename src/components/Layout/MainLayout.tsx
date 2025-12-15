// src/components/Layout/MainLayout.tsx
import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  FiMap, FiLayers, FiDatabase, FiSettings, FiLogOut, FiMenu, FiCpu 
} from "react-icons/fi";
import { BiWorld } from "react-icons/bi";

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
      active 
        ? "bg-indigo-50 text-primary font-medium" 
        : "text-text-muted hover:bg-slate-50 hover:text-text-main"
    }`}
  >
    <Icon className={`text-lg ${active ? "text-primary" : "text-slate-400 group-hover:text-text-main"}`} />
    <span>{label}</span>
  </Link>
);

export const MainLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="p-2 bg-primary rounded-lg">
            <BiWorld className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-text-main leading-tight">TopoSystem</h1>
            <p className="text-xs text-text-muted">Pro Edition</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Gestión
          </div>
          <SidebarItem to="/" icon={FiDatabase} label="Mis Proyectos" active={location.pathname === "/"} />
          <SidebarItem to="/instruments" icon={FiSettings} label="Instrumentos" active={location.pathname.includes("instruments")} />
          
          <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Utilidades
          </div>
          {/* Calculadora puede ser una página simple o un modal futuro */}
          <SidebarItem to="/calculator" icon={FiCpu} label="Calculadora Geodésica" active={location.pathname.includes("calculator")} />
          
          {/* El Visor CAD no suele ir en el sidebar porque depende de un proyecto, 
              pero puedes poner un acceso directo al último proyecto si quisieras */}
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex w-full items-center gap-3 px-3 py-2 text-text-muted hover:text-red-600 transition-colors text-sm">
            <FiLogOut />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-surface border-b border-border flex items-center px-6 justify-between md:hidden">
           <span className="font-bold text-text-main">TopoSystem</span>
           <button className="p-2 text-text-muted"><FiMenu size={24} /></button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};