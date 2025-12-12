import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLayers, FiZoomIn, FiZoomOut, FiCpu } from "react-icons/fi";
// Asumimos que aquí importas tu componente Canvas de Konva que vimos antes
// import TopographyCanvas from "../components/TopographyCanvas";

export const CadViewerPage = () => {
  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex flex-col">
      
      {/* Toolbar Flotante Superior */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex justify-between items-start">
          
          {/* Botón Volver (Glassmorphism) */}
          <Link to="/" className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg">
            <FiArrowLeft /> <span className="text-sm font-medium">Salir</span>
          </Link>

          {/* Panel de Info Central */}
          <div className="pointer-events-auto px-6 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-lg flex items-center gap-6 text-slate-300 text-sm">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span>Conectado</span>
             </div>
             <div className="h-4 w-px bg-slate-700"></div>
             <span>Proyecto: <b>Levantamiento Finca Norte</b></span>
             <div className="h-4 w-px bg-slate-700"></div>
             <span>Coord: <b>1000.00, 1000.00</b></span>
          </div>

          {/* Acciones Derecha */}
          <div className="pointer-events-auto flex gap-2">
            <button className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <FiCpu /> {/* Botón Calcular */}
            </button>
            <button className="p-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700">
              <FiLayers />
            </button>
          </div>
        </div>
      </div>

      {/* Aquí iría el componente Canvas de React Konva */}
      <div className="flex-1 flex items-center justify-center text-slate-600">
         {/* <TopographyCanvas /> */}
         <p>El Mapa Interactivo va aquí...</p>
      </div>

      {/* Controles de Zoom Flotantes Inferiores */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <button className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-100">
          <FiZoomIn size={20} />
        </button>
        <button className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-100">
          <FiZoomOut size={20} />
        </button>
      </div>
    </div>
  );
};