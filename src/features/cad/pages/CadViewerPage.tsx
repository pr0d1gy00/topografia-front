import React, { useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Stage, Layer, Circle, Text, Line, Group } from "react-konva";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft, FiMinus, FiPlus, FiMaximize } from "react-icons/fi";
import { fetchPoints, fetchProjectById } from "../../topography/api/points";
import { fetchStations } from "../../topography/api/stations";
import { FiEye, FiEyeOff, FiTrash2, FiLayers } from "react-icons/fi";
import { fetchLayers, createLayer, toggleLayerVisibility, deleteLayer } from "../../topography/api/layers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Colores por código
const getColorByCode = (code: string) => {
  if (!code) return "#CBD5E1"; // Gris default
  const c = code.toUpperCase();
  if (c.includes("BASE") || c.includes("BM") || c.includes("EST")) return "#EF4444"; // Rojo
  if (c.includes("ARBOL")) return "#22C55E"; // Verde
  if (c.includes("VIA") || c.includes("CALLE")) return "#3B82F6"; // Azul
  if (c.includes("POSTE")) return "#F59E0B"; // Naranja
  return "#94A3B8";
};

export const CadViewerPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const stageRef = useRef<any>(null);

  // Estados del Viewport
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Cargar datos
  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProjectById(projectId) });
  const { data: points } = useQuery({ queryKey: ['points', projectId], queryFn: () => fetchPoints(projectId) });
  const { data: stations } = useQuery({ queryKey: ['stations', projectId], queryFn: () => fetchStations(projectId) });
// ... dentro de CadViewerPage
  const queryClient = useQueryClient();
  const [isLayerPanelOpen, setLayerPanelOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  // Cargar Capas
  const { data: layers } = useQuery({ queryKey: ['layers', projectId], queryFn: () => fetchLayers(projectId) });

  // Mutaciones Capas
  const createLayerMut = useMutation({
    mutationFn: createLayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layers', projectId] });
      setNewLayerName("");
    }
  });

  const toggleLayerMut = useMutation({
    mutationFn: ({id, vis}: {id: number, vis: boolean}) => toggleLayerVisibility(id, vis),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['layers', projectId] })
  });
  // 1. CALCULAR LÍMITES (BOUNDING BOX) PARA CENTRAR EL DIBUJO
  // Esto es matemática pura para encajar el mapa en la pantalla al iniciar
  const initialView = useMemo(() => {
    if (!points || points.length === 0) return { scale: 5, x: window.innerWidth/2, y: window.innerHeight/2 };

    const padding = 50;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Encontrar extremos
    const minX = Math.min(...points.map((p:any) => p.x));
    const maxX = Math.max(...points.map((p:any) => p.x));
    const minY = Math.min(...points.map((p:any) => p.y));
    const maxY = Math.max(...points.map((p:any) => p.y));

    const dataWidth = maxX - minX || 10; // Evitar división por cero
    const dataHeight = maxY - minY || 10;

    // Calcular escala para que quepa
    const scaleX = (width - padding * 2) / dataWidth;
    const scaleY = (height - padding * 2) / dataHeight;
    const finalScale = Math.min(scaleX, scaleY);

    // Centrar
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      scale: finalScale,
      // OJO: Y invertida (-centerY) porque Canvas Y va hacia abajo
      x: width / 2 - centerX * finalScale,
      y: height / 2 - (-centerY) * finalScale 
    };
  }, [points]);

  // Aplicar vista inicial solo la primera vez que cargan los puntos
  React.useEffect(() => {
    if (initialView && scale === 1) {
      setScale(initialView.scale);
      setPosition({ x: initialView.x, y: initialView.y });
    }
  }, [initialView]);


  // 2. MANEJO DEL ZOOM (RUEDA DEL MOUSE)
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    setScale(newScale);
  };

  if (!points) return <div className="text-white text-center pt-20">Cargando mapa...</div>;

  return (
    <div className="relative w-full h-screen bg-[#0F172A] overflow-hidden">
      
      {/* UI: HEADER FLOTANTE */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <Link to={`/projects/${projectId}`} className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-800/90 text-white rounded-lg shadow border border-slate-700 hover:bg-slate-700 transition">
          <FiArrowLeft /> Volver
        </Link>
        <div className="pointer-events-auto bg-slate-800/90 text-white px-4 py-2 rounded-lg border border-slate-700 shadow text-sm">
          <h1 className="font-bold">{project?.name}</h1>
          <p className="text-slate-400 text-xs">{points.length} Puntos | Escala: {scale.toFixed(2)}x</p>
        </div>
      </div>

      {/* UI: CONTROLES ZOOM */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <button onClick={() => setScale(scale * 1.2)} className="p-3 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100"><FiPlus /></button>
        <button onClick={() => setScale(scale / 1.2)} className="p-3 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100"><FiMinus /></button>
        <button onClick={() => { setScale(initialView.scale); setPosition({x: initialView.x, y: initialView.y}) }} className="p-3 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700"><FiMaximize /></button>
      </div>

      {/* CANVAS KONVA */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
        ref={stageRef}
      >
        {/* BOTÓN TOGGLE PANEL CAPAS */}
      <div className="absolute top-20 left-4 z-10 pointer-events-auto">
        <button 
          onClick={() => setLayerPanelOpen(!isLayerPanelOpen)}
          className="p-3 bg-slate-800 text-white rounded-lg shadow border border-slate-700 hover:bg-slate-700"
          title="Gestor de Capas"
        >
          <FiLayers />
        </button>
      </div>

      {/* PANEL DE CAPAS */}
      {isLayerPanelOpen && (
        <div className="absolute top-20 left-16 z-10 w-64 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl p-4 text-white pointer-events-auto animate-fade-in">
          <h3 className="font-bold mb-4 flex items-center gap-2"><FiLayers/> Capas</h3>
          
          {/* Lista */}
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {layers?.map((layer: any) => (
              <div key={layer.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: layer.color}}></div>
                  <span className="text-sm">{layer.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleLayerMut.mutate({id: layer.id, vis: !layer.visible})} className="p-1 hover:text-indigo-400">
                    {layer.visible ? <FiEye/> : <FiEyeOff className="text-slate-500"/>}
                  </button>
                  {/* Aquí podrías agregar deleteLayer */}
                </div>
              </div>
            ))}
          </div>

          {/* Crear Nueva */}
          <div className="flex gap-2">
            <input 
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs w-full text-white"
              placeholder="Nueva Capa..."
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
            />
            <button 
              onClick={() => createLayerMut.mutate({ projectId, name: newLayerName, color: '#ffffff', visible: true })}
              className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-xs"
            >
              +
            </button>
          </div>
        </div>
      )}
        <Layer>
          {/* 1. DIBUJAR RADIACIONES (LÍNEAS DESDE ESTACIÓN A PUNTOS) */}
          {stations?.map((station: any) => 
            station.observations?.map((obs: any) => {
               if(!obs.targetPoint) return null;
               return (
                 <Line 
                   key={`line-${obs.id}`}
                   points={[
                     station.occupiedPoint.x, 
                     -station.occupiedPoint.y, // Y Negativa
                     obs.targetPoint.x, 
                     -obs.targetPoint.y       // Y Negativa
                   ]}
                   stroke="#334155"
                   strokeWidth={1 / scale} // Mantener línea fina al hacer zoom
                   dash={[4 / scale, 4 / scale]}
                 />
               );
            })
          )}

          {/* 2. DIBUJAR PUNTOS */}
          {points.map((point: any) => (
            <Group 
              key={point.id} 
              x={point.x} 
              y={-point.y} // IMPORTANTE: Invertimos Y para coordenada Norte
            >
              {/* Círculo del punto */}
              <Circle
                radius={point.isFixed ? (6 / scale) : (3 / scale)}
                fill={getColorByCode(point.code)}
                stroke="white"
                strokeWidth={1 / scale}
              />
              
              {/* Texto (Nombre) */}
              <Text
                text={point.name}
                fontSize={12 / scale}
                fill="#E2E8F0"
                y={6 / scale} // Offset para que no tape el punto
                x={6 / scale}
              />
              
              {/* Texto (Cota Z) - Opcional, más pequeño */}
              <Text
                text={`Z:${Number(point.z).toFixed(2)}`}
                fontSize={8 / scale}
                fill="#64748B"
                y={18 / scale}
                x={6 / scale}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};