import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Stage, Layer, Circle, Text, Line, Group } from "react-konva";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FiArrowLeft, FiMinus, FiPlus, FiMaximize, 
  FiLayers, FiMove, FiEdit2, FiMousePointer, FiSave
} from "react-icons/fi";

// APIs
import { fetchPoints, fetchProjectById, updatePoint } from "../../topography/api/points";
import { fetchStations } from "../../topography/api/stations";
import { fetchLayers, createLayer, toggleLayerVisibility, updateLayer } from "../../topography/api/layers";

// --- TIPOS ---
type ToolType = 'PAN' | 'MOVE_POINT' | 'DRAW_LINE';

// --- UTILIDADES ---
const getColorByCode = (code: string) => {
  if (!code) return "#CBD5E1"; 
  const c = code.toUpperCase();
  if (c.includes("BASE") || c.includes("BM")) return "#EF4444"; 
  if (c.includes("ARBOL")) return "#22C55E";
  if (c.includes("VIA") || c.includes("CALLE")) return "#3B82F6"; 
  return "#94A3B8";
};

export const CadViewerPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const queryClient = useQueryClient();
  const stageRef = useRef<any>(null);

  // --- ESTADOS ---
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Herramientas
  const [activeTool, setActiveTool] = useState<ToolType>('PAN');
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null); // Para el primer punto de la línea
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null); // Capa donde estamos dibujando

  // Paneles
  const [isLayerPanelOpen, setLayerPanelOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  // --- QUERIES ---
  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProjectById(projectId) });
  const { data: points } = useQuery({ queryKey: ['points', projectId], queryFn: () => fetchPoints(projectId) });
  const { data: stations } = useQuery({ queryKey: ['stations', projectId], queryFn: () => fetchStations(projectId) });
  const { data: layers } = useQuery({ queryKey: ['layers', projectId], queryFn: () => fetchLayers(projectId) });

  // Seleccionar la primera capa por defecto si no hay ninguna activa
  useEffect(() => {
    if (layers && layers.length > 0 && !activeLayerId) {
      setActiveLayerId(layers[0].id);
    }
  }, [layers]);

  // --- MUTACIONES ---
  const movePointMut = useMutation({
    mutationFn: updatePoint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['points', projectId] })
  });

  const saveDrawingMut = useMutation({
    mutationFn: updateLayer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['layers', projectId] })
  });

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

  // --- LÓGICA DE DIBUJO ---
  
  // Función para conectar dos puntos
  const handlePointClick = (clickedPointId: number) => {
    if (activeTool !== 'DRAW_LINE') return;
    if (!activeLayerId) {
      alert("¡Crea o selecciona una capa primero!");
      setLayerPanelOpen(true);
      return;
    }

    if (selectedPointId === null) {
      // Primer clic: Seleccionamos el punto de inicio
      setSelectedPointId(clickedPointId);
    } else {
      // Segundo clic: Cerramos la línea
      if (selectedPointId === clickedPointId) {
        setSelectedPointId(null); // Cancelar si clic en el mismo
        return;
      }

      // 1. Buscar la capa activa
      const currentLayer = layers?.find((l: any) => l.id === activeLayerId);
      if (!currentLayer) return;

      // 2. Obtener data existente o iniciar array
      // Estructura esperada: { lines: [ {from: 1, to: 2}, ... ] }
      const currentData = (typeof currentLayer.drawingData === 'string' 
        ? JSON.parse(currentLayer.drawingData) 
        : currentLayer.drawingData) || { lines: [] };
      
      const newLines = [...(currentData.lines || []), { from: selectedPointId, to: clickedPointId }];

      // 3. Guardar en Backend
      saveDrawingMut.mutate({
        id: activeLayerId,
        drawingData: { ...currentData, lines: newLines }
      });

      // 4. Reset
      setSelectedPointId(clickedPointId); // Encadenar: el fin es el nuevo inicio (polilínea)
    }
  };

  // Función para mover puntos (Drag & Drop)
  const handlePointDragEnd = (e: any, pointId: number) => {
    const newX = e.target.x();
    const newY = -e.target.y(); // Invertimos Y de nuevo para coordenadas topo

    // Actualizar en backend
    movePointMut.mutate({
      id: pointId,
      x: newX,
      y: newY
    });
  };

  // --- CONFIGURACIÓN VISUAL ---
  
  // Auto-centrado inicial
  const initialView = useMemo(() => {
    if (!points || points.length === 0) return { scale: 5, x: window.innerWidth/2, y: window.innerHeight/2 };
    const padding = 100;
    const minX = Math.min(...points.map((p:any) => p.x));
    const maxX = Math.max(...points.map((p:any) => p.x));
    const minY = Math.min(...points.map((p:any) => p.y));
    const maxY = Math.max(...points.map((p:any) => p.y));
    const scaleX = (window.innerWidth - padding) / (maxX - minX || 1);
    const scaleY = (window.innerHeight - padding) / (maxY - minY || 1);
    const finalScale = Math.min(scaleX, scaleY);
    return {
      scale: finalScale,
      x: window.innerWidth / 2 - ((minX + maxX) / 2) * finalScale,
      y: window.innerHeight / 2 - (-(minY + maxY) / 2) * finalScale 
    };
  }, [points]);

  React.useEffect(() => {
    if (initialView && scale === 1) {
      setScale(initialView.scale);
      setPosition({ x: initialView.x, y: initialView.y });
    }
  }, [initialView]);

  // Zoom con rueda
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    setScale(newScale);
  };

  if (!points) return <div className="text-white text-center pt-20">Cargando...</div>;

  return (
    <div className="relative w-full h-screen bg-[#0F172A] overflow-hidden">
      
      {/* HEADER */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <Link to={`/projects/${projectId}`} className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-800/90 text-white rounded-lg shadow border border-slate-700 hover:bg-slate-700 transition">
          <FiArrowLeft /> Volver
        </Link>
        
        {/* BARRA DE HERRAMIENTAS CENTRAL */}
        <div className="pointer-events-auto flex gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 shadow-xl">
          <button 
            onClick={() => { setActiveTool('PAN'); setSelectedPointId(null); }}
            className={`p-2.5 rounded-lg transition ${activeTool === 'PAN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Mover Mapa (Pan)"
          >
            <FiMousePointer />
          </button>
          <button 
            onClick={() => { setActiveTool('MOVE_POINT'); setSelectedPointId(null); }}
            className={`p-2.5 rounded-lg transition ${activeTool === 'MOVE_POINT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Mover Puntos"
          >
            <FiMove />
          </button>
          <button 
            onClick={() => { setActiveTool('DRAW_LINE'); setSelectedPointId(null); }}
            className={`p-2.5 rounded-lg transition ${activeTool === 'DRAW_LINE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Dibujar Líneas (Unir Puntos)"
          >
            <FiEdit2 />
          </button>
        </div>

        <div className="pointer-events-auto bg-slate-800/90 text-white px-4 py-2 rounded-lg border border-slate-700 shadow text-sm text-right">
          <h1 className="font-bold">{project?.name}</h1>
          <p className="text-slate-400 text-xs">
            {activeTool === 'DRAW_LINE' 
              ? (selectedPointId ? "Selecciona el siguiente punto..." : "Selecciona punto de inicio") 
              : `${points.length} Puntos`}
          </p>
        </div>
      </div>

      {/* PANEL DE CAPAS */}
      <div className="absolute top-24 left-4 z-10 pointer-events-auto">
        <button 
          onClick={() => setLayerPanelOpen(!isLayerPanelOpen)}
          className={`p-3 text-white rounded-lg shadow border border-slate-700 transition ${isLayerPanelOpen ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}
        >
          <FiLayers />
        </button>
      </div>

      {isLayerPanelOpen && (
        <div className="absolute top-24 left-16 z-10 w-64 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl p-4 text-white pointer-events-auto animate-fade-in">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">Capas de Dibujo</h3>
          
          <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
            {layers?.map((layer: any) => (
              <div 
                key={layer.id} 
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${activeLayerId === layer.id ? 'bg-indigo-900/50 border border-indigo-500/30' : 'hover:bg-slate-700/50 border border-transparent'}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: layer.color}}></div>
                  <span className="text-sm font-medium">{layer.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleLayerMut.mutate({id: layer.id, vis: !layer.visible}); }} className="p-1 hover:text-white text-slate-400">
                  {layer.visible ? <FiLayers/> : <span className="opacity-30"><FiLayers/></span>}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-700 pt-3">
            <input 
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs w-full text-white outline-none focus:border-indigo-500"
              placeholder="Nombre nueva capa..."
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
            />
            <button 
              onClick={() => createLayerMut.mutate({ projectId, name: newLayerName, color: '#ffffff', visible: true })}
              className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-white"
            >
              <FiPlus />
            </button>
          </div>
        </div>
      )}

      {/* CANVAS KONVA */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={activeTool === 'PAN'}
        onDragEnd={(e) => {
          if (activeTool === 'PAN') setPosition({ x: e.target.x(), y: e.target.y() });
        }}
        ref={stageRef}
        style={{ cursor: activeTool === 'PAN' ? 'grab' : activeTool === 'DRAW_LINE' ? 'crosshair' : 'default' }}
      >
        <Layer>
          {/* 1. RADIACIONES (Líneas automáticas de estación) */}
          {stations?.map((station: any) => 
            station.observations?.map((obs: any) => {
               if(!obs.targetPoint) return null;
               return (
                 <Line 
                   key={`rad-${obs.id}`}
                   points={[station.occupiedPoint.x, -station.occupiedPoint.y, obs.targetPoint.x, -obs.targetPoint.y]}
                   stroke="#334155" strokeWidth={1 / scale} dash={[4 / scale, 4 / scale]} opacity={0.5}
                 />
               );
            })
          )}

          {/* 2. DIBUJOS MANUALES (Líneas guardadas en capas) */}
          {layers?.filter((l: any) => l.visible).map((layer: any) => {
             const data = (typeof layer.drawingData === 'string' ? JSON.parse(layer.drawingData) : layer.drawingData);
             if (!data?.lines) return null;

             return data.lines.map((line: any, idx: number) => {
               const p1 = points.find((p: any) => p.id === line.from);
               const p2 = points.find((p: any) => p.id === line.to);
               if (!p1 || !p2) return null;

               return (
                 <Line
                   key={`draw-${layer.id}-${idx}`}
                   points={[p1.x, -p1.y, p2.x, -p2.y]}
                   stroke={layer.color}
                   strokeWidth={2 / scale}
                   lineCap="round"
                   lineJoin="round"
                 />
               );
             });
          })}

          {/* 3. LÍNEA ELÁSTICA (Preview al dibujar) */}
          {activeTool === 'DRAW_LINE' && selectedPointId && (
             (() => {
               const startPoint = points.find((p: any) => p.id === selectedPointId);
               if (!startPoint) return null;
               // Necesitamos la posición del mouse relativa al escenario transformado...
               // Nota: Konva en React a veces complica obtener el mouse position reactivamente sin eventos.
               // Para simplificar, aquí no dibujamos la línea "elástica" que sigue al mouse, 
               // pero sí se dibujará apenas hagas clic en el segundo punto.
               return (
                 <Circle x={startPoint.x} y={-startPoint.y} radius={5 / scale} stroke="yellow" strokeWidth={2/scale} />
               );
             })()
          )}

          {/* 4. PUNTOS (Círculos Interactivos) */}
          {points.map((point: any) => (
            <Group 
              key={point.id} 
              x={point.x} 
              y={-point.y}
              draggable={activeTool === 'MOVE_POINT'}
              onDragEnd={(e) => handlePointDragEnd(e, point.id)}
              onClick={() => handlePointClick(point.id)}
              onTap={() => handlePointClick(point.id)}
              onMouseEnter={(e) => {
                const stage = e.target.getStage ? e.target.getStage() : null;
                const container = stage ? stage.container() : null;
                if (container) {
                  container.style.cursor = activeTool === 'MOVE_POINT' ? 'move' : activeTool === 'DRAW_LINE' ? 'crosshair' : 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage ? e.target.getStage() : null;
                const container = stage ? stage.container() : null;
                if (container) {
                  container.style.cursor = activeTool === 'PAN' ? 'grab' : 'default';
                }
              }}
            >
              <Circle
                radius={point.isFixed ? (5 / scale) : (3 / scale)}
                fill={activeTool === 'DRAW_LINE' && selectedPointId === point.id ? "yellow" : getColorByCode(point.code)}
                stroke="white"
                strokeWidth={1 / scale}
              />
              <Text
                text={point.name}
                fontSize={12 / scale}
                fill="#E2E8F0"
                y={6 / scale} x={6 / scale}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* CONTROLES ZOOM */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <button onClick={() => setScale(scale * 1.2)} className="p-3 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100"><FiPlus /></button>
        <button onClick={() => setScale(scale / 1.2)} className="p-3 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100"><FiMinus /></button>
        <button onClick={() => { setScale(initialView.scale); setPosition({x: initialView.x, y: initialView.y}) }} className="p-3 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700"><FiMaximize /></button>
      </div>
    </div>
  );
};