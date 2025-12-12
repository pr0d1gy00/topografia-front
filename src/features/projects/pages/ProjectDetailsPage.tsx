import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FiMap, FiList, FiTarget, FiPlus, FiTrash2, 
  FiDownload, FiLayers, FiArrowLeft, FiActivity, FiBook, FiCornerDownRight 
} from "react-icons/fi";
import { FiBox, FiUploadCloud } from "react-icons/fi"; // Nuevos iconos
import { fetchSurfaces, createSurface, addPointsToSurface } from "../../topography/api/surfaces";
// APIs
import { fetchPoints, createPoint, deletePoint, fetchProjectById } from "../../topography/api/points";
import { fetchStations, createStation, createObservation } from "../../topography/api/stations";
import { fetchLevelingRuns, createLevelingRun, addLevelingReading } from "../../topography/api/leveling";
import { api } from "../../../libs/axios"; 

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

// Fetcher simple para instrumentos
const fetchInstruments = async () => {
  const { data } = await api.get("/instruments/user/1");
  return data;
};

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const queryClient = useQueryClient();
  
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState<'POINTS' | 'STATIONS' | 'LEVELING' | 'SURFACES'>('POINTS');
  
  // Modales
  const [modalPointOpen, setModalPointOpen] = useState(false);
  const [modalStationOpen, setModalStationOpen] = useState(false);
  const [modalObsOpen, setModalObsOpen] = useState(false);
  const [modalRunOpen, setModalRunOpen] = useState(false);
  const [modalReadingOpen, setModalReadingOpen] = useState(false);
  
  // Estados de Selección
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  
  // Formularios
  const [formPoint, setFormPoint] = useState({ name: "", x: "", y: "", z: "", code: "", isFixed: false });
  const [formStation, setFormStation] = useState({ occupiedPointId: "", instrumentId: "", heightInstrument: "", backsightAngle: 0 });
  const [formObs, setFormObs] = useState({ 
    description: "", angleHorizontal: "", angleVertical: 90, 
    heightTarget: "", isStadia: true, 
    stadiaTop: "", stadiaBottom: "", stadiaMiddle: "",
    distanceSlope: "" 
  });
  const [formRun, setFormRun] = useState({ name: "" });
  const [formReading, setFormReading] = useState({ 
    pointId: "", backsight: "", intermediate: "", foresight: "" 
  });
// ... estados existentes
  const [modalSurfaceOpen, setModalSurfaceOpen] = useState(false);
  const [formSurface, setFormSurface] = useState({ name: "", type: "INITIAL" });

  // Query Superficies
  const { data: surfaces } = useQuery({ 
    queryKey: ['surfaces', projectId], 
    queryFn: () => fetchSurfaces(projectId).catch(() => []) 
  });

  // Mutación Crear Superficie
  const createSurfaceMut = useMutation({
    mutationFn: createSurface,
    onSuccess: (newSurface) => {
      // Truco: Al crear la superficie, le asignamos TODOS los puntos actuales automáticamente
      // para facilitar el cálculo (en un sistema real se seleccionan uno a uno)
      const allPointIds = points.map((p: any) => p.id);
      addPointsToSurface(newSurface.data.id, allPointIds).then(() => {
        queryClient.invalidateQueries({ queryKey: ['surfaces', projectId] });
      });
      setModalSurfaceOpen(false);
      setFormSurface({ name: "", type: "INITIAL" });
    }
  });

  const handleCreateSurface = (e: React.FormEvent) => {
    e.preventDefault();
    createSurfaceMut.mutate({ projectId, ...formSurface });
  };
  // --- QUERIES ---
  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProjectById(projectId) });
  const { data: points } = useQuery({ queryKey: ['points', projectId], queryFn: () => fetchPoints(projectId) });
  const { data: stations } = useQuery({ queryKey: ['stations', projectId], queryFn: () => fetchStations(projectId) });
  const { data: instruments } = useQuery({ queryKey: ['instruments'], queryFn: fetchInstruments });
  
  // Query Nivelación (Puede fallar si no hay Runs, manejamos array vacío)
  const { data: levelingRuns } = useQuery({ 
    queryKey: ['levelingRuns', projectId], 
    queryFn: () => fetchLevelingRuns(projectId).catch(() => []) 
  });

  // --- MUTATIONS ---
  
  // 1. Puntos
  const createPointMut = useMutation({
    mutationFn: createPoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', projectId] });
      setModalPointOpen(false);
      setFormPoint({ name: "", x: "", y: "", z: "", code: "", isFixed: false });
    }
  });

  const deletePointMut = useMutation({
    mutationFn: deletePoint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['points', projectId] })
  });

  // 2. Estaciones
  const createStationMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations', projectId] });
      setModalStationOpen(false);
      setFormStation({ occupiedPointId: "", instrumentId: "", heightInstrument: "", backsightAngle: 0 });
    }
  });

  // 3. Observaciones
const createObsMut = useMutation({
    mutationFn: createObservation,
    onSuccess: () => {
      // Invalidar ESTACIONES (para ver la nueva lectura en la tabla)
      queryClient.invalidateQueries({ queryKey: ['stations', projectId] });
      
      // Invalidar PUNTOS (para que aparezca el punto calculado)
      // Usamos refetchType: 'all' para forzar la actualización aunque la pestaña esté oculta
      queryClient.invalidateQueries({ 
        queryKey: ['points', projectId],
        refetchType: 'all' 
      });

      setModalObsOpen(false);
      // Resetear form...
      setFormObs({ ...formObs, description: "", angleHorizontal: "", stadiaTop: "", stadiaBottom: "", stadiaMiddle: "" });
    },
    onError: (err) => alert("Error registrando lectura: " + err)
  });

  // 4. Nivelación (Runs y Lecturas)
  const createRunMut = useMutation({
    mutationFn: (payload: any) => createLevelingRun(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levelingRuns', projectId] });
      setModalRunOpen(false);
      setFormRun({ name: "" });
    }
  });

  const addReadingMut = useMutation({
    mutationFn: (payload: any) => addLevelingReading(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levelingRuns', projectId] });
      setModalReadingOpen(false);
      setFormReading({ pointId: "", backsight: "", intermediate: "", foresight: "" });
    }
  });

  // --- HANDLERS ---

  const handleCreatePoint = (e: React.FormEvent) => {
    e.preventDefault();
    createPointMut.mutate({ projectId, ...formPoint, x: Number(formPoint.x), y: Number(formPoint.y), z: Number(formPoint.z) });
  };

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    createStationMut.mutate({ projectId, occupiedPointId: Number(formStation.occupiedPointId), instrumentId: Number(formStation.instrumentId), heightInstrument: Number(formStation.heightInstrument), backsightAngle: Number(formStation.backsightAngle) });
  };

  const handleCreateObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) return;
    const finalHeightTarget = formObs.isStadia ? Number(formObs.stadiaMiddle) : Number(formObs.heightTarget);

    createObsMut.mutate({
      stationId: selectedStationId, calculateCoordinates: true, description: formObs.description,
      angleHorizontal: Number(formObs.angleHorizontal), angleVertical: Number(formObs.angleVertical),
      heightTarget: finalHeightTarget || 0, isStadia: formObs.isStadia,
      stadiaTop: formObs.isStadia ? Number(formObs.stadiaTop) : undefined,
      stadiaBottom: formObs.isStadia ? Number(formObs.stadiaBottom) : undefined,
      stadiaMiddle: formObs.isStadia ? Number(formObs.stadiaMiddle) : undefined,
      distanceSlope: !formObs.isStadia ? Number(formObs.distanceSlope) : undefined
    });
  };

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    createRunMut.mutate({ projectId, name: formRun.name });
  };

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRunId) return;
    addReadingMut.mutate({
      runId: selectedRunId,
      pointId: formReading.pointId ? Number(formReading.pointId) : undefined,
      backsight: formReading.backsight ? Number(formReading.backsight) : undefined,
      intermediate: formReading.intermediate ? Number(formReading.intermediate) : undefined,
      foresight: formReading.foresight ? Number(formReading.foresight) : undefined,
    });
  };

  const openReadingModal = (runId: number) => {
    setSelectedRunId(runId);
    setModalReadingOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
            <FiArrowLeft /> Volver a Proyectos
          </Link>
          <h1 className="text-2xl font-bold text-text-main">
            {project?.name || `Proyecto #${projectId}`}
          </h1>
          <p className="text-text-muted flex items-center gap-2 text-sm">
            Ubicación: {project?.location || "No definida"} <span className="text-slate-300">|</span> 
            {points?.length || 0} Puntos
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/project/${projectId}/cad`}>
            <Button variant="secondary" icon={<FiMap />}>Visor CAD</Button>
          </Link>
          <Button variant="outline" icon={<FiDownload />}>Excel</Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-border overflow-x-auto">
        {[
          { id: 'POINTS', label: 'Nube de Puntos', icon: FiTarget },
          { id: 'STATIONS', label: 'Estaciones', icon: FiActivity },
          { id: 'LEVELING', label: 'Nivelación', icon: FiList },
{ id: 'SURFACES', label: 'Superficies & Vol.', icon: FiBox },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW: POINTS */}
      {activeTab === 'POINTS' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800">💡 Agrega aquí los <b>Puntos Base (BM)</b> antes de medir.</p>
            <Button  onClick={() => setModalPointOpen(true)} icon={<FiPlus />}>Nuevo Punto</Button>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-text-muted font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">X (Este)</th>
                    <th className="px-6 py-4">Y (Norte)</th>
                    <th className="px-6 py-4">Z (Cota)</th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {points?.map((point: any) => (
                    <tr key={point.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium flex items-center gap-2">
                        {point.name}
                        {point.isFixed && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 rounded">BASE</span>}
                      </td>
                      <td className="px-6 py-3 font-mono">{Number(point.x).toFixed(3)}</td>
                      <td className="px-6 py-3 font-mono">{Number(point.y).toFixed(3)}</td>
                      <td className="px-6 py-3 font-mono">{Number(point.z).toFixed(3)}</td>
                      <td className="px-6 py-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{point.code}</span></td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => deletePointMut.mutate(point.id)} className="text-slate-300 hover:text-red-500"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                  {points?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-text-muted">Sin puntos</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: STATIONS */}
      {activeTab === 'STATIONS' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-text-main">Libreta de Campo (Planimetría)</h3>
               <p className="text-sm text-text-muted">Gestiona tus puestas de aparato y mediciones.</p>
             </div>
             <Button onClick={() => setModalStationOpen(true)} icon={<FiLayers />}>Nueva Estación</Button>
          </div>
          {stations?.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-text-muted mb-2">No hay estaciones registradas.</p>
              <Button variant="secondary" onClick={() => setModalStationOpen(true)}>Crear Primera Estación</Button>
            </div>
          ) : (
            stations?.map((station: any) => (
              <Card key={station.id} className="relative overflow-hidden border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border pb-4 mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                      <FiActivity /> Estación en: {station.occupiedPoint?.name || `ID ${station.occupiedPointId}`}
                    </h4>
                    <div className="text-sm text-text-muted flex gap-4 mt-1">
                      <span>HI: <b>{station.heightInstrument} m</b></span>
                      <span>Ref: <b>{station.backsightAngle}°</b></span>
                    </div>
                  </div>
                  <Button  onClick={() => { setSelectedStationId(station.id); setModalObsOpen(true); }} icon={<FiPlus />}>Medir</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-text-muted uppercase">
                      <tr>
                        <th className="px-4 py-2">Punto</th>
                        <th className="px-4 py-2">Azimut</th>
                        <th className="px-4 py-2">Vertical</th>
                        <th className="px-4 py-2">Dist.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {station.observations?.map((obs: any) => (
                        <tr key={obs.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-indigo-600">{obs.targetPoint?.name || "Calc..."}</td>
                          <td className="px-4 py-2 font-mono">{obs.angleHorizontal}°</td>
                          <td className="px-4 py-2 font-mono">{obs.angleVertical}°</td>
                          <td className="px-4 py-2 font-mono font-bold">
                            {obs.isStadia ? ((obs.stadiaTop - obs.stadiaBottom) * 100).toFixed(2) : obs.distanceSlope} m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* VIEW: LEVELING (NUEVA IMPLEMENTACIÓN) */}
      {activeTab === 'LEVELING' && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-text-main">Libretas de Nivelación</h3>
               <p className="text-sm text-text-muted">Control de Altimetría (Nivel de Ingeniero).</p>
             </div>
             <Button onClick={() => setModalRunOpen(true)} icon={<FiBook />}>Nueva Libreta</Button>
          </div>

          {levelingRuns?.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
               <FiList className="mx-auto text-4xl text-slate-300 mb-2"/>
               <p className="text-text-muted mb-2">No tienes circuitos de nivelación.</p>
               <Button variant="secondary" onClick={() => setModalRunOpen(true)}>Crear Circuito</Button>
             </div>
          ) : (
            levelingRuns?.map((run: any) => (
              <Card key={run.id} className="overflow-hidden">
                <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
                  <h4 className="font-bold text-text-main flex items-center gap-2">
                    <FiBook className="text-primary"/> {run.name}
                  </h4>
                  <Button  variant="secondary" onClick={() => openReadingModal(run.id)} icon={<FiPlus />}>Agregar Lectura</Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center">
                    <thead className="bg-slate-50 text-xs text-text-muted uppercase font-semibold">
                      <tr>
                        <th className="px-2 py-2 text-left">Punto</th>
                        <th className="px-2 py-2">V. Atrás (+)</th>
                        <th className="px-2 py-2">V. Intermedia</th>
                        <th className="px-2 py-2">V. Adelante (-)</th>
                        <th className="px-2 py-2 text-indigo-600 bg-indigo-50">AI (Inst)</th>
                        <th className="px-2 py-2 text-emerald-600 bg-emerald-50">Cota (Z)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {run.readings?.map((read: any) => (
                        <tr key={read.id} className="hover:bg-slate-50">
                          <td className="px-2 py-2 text-left font-medium">{read.point?.name || `Pto #${read.id}`}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{read.backsight ? Number(read.backsight).toFixed(3) : "-"}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{read.intermediate ? Number(read.intermediate).toFixed(3) : "-"}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{read.foresight ? Number(read.foresight).toFixed(3) : "-"}</td>
                          <td className="px-2 py-2 font-mono font-bold text-indigo-600 bg-indigo-50/50">
                             {read.calculatedAI ? Number(read.calculatedAI).toFixed(3) : "-"}
                          </td>
                          <td className="px-2 py-2 font-mono font-bold text-emerald-600 bg-emerald-50/50">
                             {read.calculatedZ ? Number(read.calculatedZ).toFixed(3) : "-"}
                          </td>
                        </tr>
                      ))}
                      {run.readings?.length === 0 && (
                        <tr><td colSpan={6} className="py-4 text-xs text-muted italic">Sin lecturas. Agrega la primera (Vista Atrás a BM).</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
{/* VIEW: SURFACES (NUEVO) */}
      {activeTab === 'SURFACES' && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-text-main">Modelos Digitales (DTM)</h3>
               <p className="text-sm text-text-muted">Gestiona superficies para cálculo de volúmenes.</p>
             </div>
             <Button onClick={() => setModalSurfaceOpen(true)} icon={<FiBox />}>Nueva Superficie</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {surfaces?.map((surf: any) => (
              <Card key={surf.id} className="border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{surf.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${surf.type === 'INITIAL' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {surf.type === 'INITIAL' ? 'TERRENO ORIGINAL' : 'PROYECTO FINAL'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Puntos Asignados</p>
                    <p className="font-mono font-bold text-lg">{surf.points?.length || "Todos"}</p> 
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded text-sm text-slate-500 mb-3">
                   Configuración de Curvas: <br/>
                   Maestras: <b>{surf.contourIntervalMajor}m</b> | Secundarias: <b>{surf.contourIntervalMinor}m</b>
                </div>
                <Button variant="secondary" className="w-full" icon={<FiUploadCloud />}>
                   Recalcular Malla (TIN)
                </Button>
              </Card>
            ))}
            {surfaces?.length === 0 && (
              <div className="col-span-2 text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                 <p className="text-text-muted">No hay superficies definidas.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 1: CREATE POINT */}
      <Modal isOpen={modalPointOpen} onClose={() => setModalPointOpen(false)} title="Nuevo Punto Base">
        <form onSubmit={handleCreatePoint} className="space-y-4">
          <Input label="Nombre" value={formPoint.name} onChange={e => setFormPoint({...formPoint, name: e.target.value})} required autoFocus />
          <div className="grid grid-cols-3 gap-3">
             <Input label="X" type="number" step="0.001" value={formPoint.x} onChange={e => setFormPoint({...formPoint, x: e.target.value})} required />
             <Input label="Y" type="number" step="0.001" value={formPoint.y} onChange={e => setFormPoint({...formPoint, y: e.target.value})} required />
             <Input label="Z" type="number" step="0.001" value={formPoint.z} onChange={e => setFormPoint({...formPoint, z: e.target.value})} required />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={formPoint.isFixed} onChange={e => setFormPoint({...formPoint, isFixed: e.target.checked})} />
            <span className="text-sm">Es punto fijo (Base)</span>
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      {/* MODAL 2: CREATE STATION */}
      <Modal isOpen={modalStationOpen} onClose={() => setModalStationOpen(false)} title="Nueva Estación">
        <form onSubmit={handleCreateStation} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Punto Ocupado</label>
            <select className="w-full p-2 border rounded bg-white" 
              value={formStation.occupiedPointId} onChange={e => setFormStation({...formStation, occupiedPointId: e.target.value})} required>
              <option value="">-- Seleccionar Punto --</option>
              {points?.map((p: any) => <option key={p.id} value={p.id}>{p.name} (E:{p.x}, N:{p.y})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Instrumento</label>
            <select className="w-full p-2 border rounded bg-white"
               value={formStation.instrumentId} onChange={e => setFormStation({...formStation, instrumentId: e.target.value})} required>
               <option value="">-- Seleccionar Equipo --</option>
               {instruments?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="HI (Altura Inst)" type="number" step="0.001" value={formStation.heightInstrument} onChange={e => setFormStation({...formStation, heightInstrument: e.target.value})} required />
            <Input label="Azimut Ref (0°)" type="number" step="0.0001" value={formStation.backsightAngle} onChange={e => setFormStation({...formStation, backsightAngle: Number(e.target.value)})} />
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Crear Estación</Button></div>
        </form>
      </Modal>

      {/* MODAL 3: RECORD OBSERVATION */}
      <Modal isOpen={modalObsOpen} onClose={() => setModalObsOpen(false)} title="Registrar Lectura">
        <form onSubmit={handleCreateObs} className="space-y-4">
          <Input label="Descripción" value={formObs.description} onChange={e => setFormObs({...formObs, description: e.target.value})} autoFocus required />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Ángulo Hz" type="number" step="0.0001" value={formObs.angleHorizontal} onChange={e => setFormObs({...formObs, angleHorizontal: e.target.value})} required />
             <Input label="Ángulo V" type="number" step="0.0001" value={formObs.angleVertical} onChange={e => setFormObs({...formObs, angleVertical: Number(e.target.value)})} required />
          </div>
          <div className="bg-slate-50 p-3 rounded border border-border">
            <div className="flex gap-4 mb-3 border-b border-slate-200 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={formObs.isStadia} onChange={() => setFormObs({...formObs, isStadia: true})} /> <span className="text-sm font-medium">Estadía</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!formObs.isStadia} onChange={() => setFormObs({...formObs, isStadia: false})} /> <span className="text-sm font-medium">EDM</span>
              </label>
            </div>
            {formObs.isStadia ? (
              <div className="grid grid-cols-3 gap-2">
                 <Input label="Hilo Sup" type="number" step="0.001" value={formObs.stadiaTop} onChange={e => setFormObs({...formObs, stadiaTop: e.target.value})} />
                 <Input label="Hilo Med" type="number" step="0.001" value={formObs.stadiaMiddle} onChange={e => setFormObs({...formObs, stadiaMiddle: e.target.value})} />
                 <Input label="Hilo Inf" type="number" step="0.001" value={formObs.stadiaBottom} onChange={e => setFormObs({...formObs, stadiaBottom: e.target.value})} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                 <Input label="Distancia" type="number" step="0.001" value={formObs.distanceSlope} onChange={e => setFormObs({...formObs, distanceSlope: e.target.value})} />
                 <Input label="Alt. Prisma" type="number" step="0.001" value={formObs.heightTarget} onChange={e => setFormObs({...formObs, heightTarget: e.target.value})} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Registrar</Button></div>
        </form>
      </Modal>

      {/* MODAL 4: CREAR LIBRETA DE NIVELACIÓN */}
      <Modal isOpen={modalRunOpen} onClose={() => setModalRunOpen(false)} title="Nueva Libreta de Nivel">
        <form onSubmit={handleCreateRun} className="space-y-4">
          <Input label="Nombre del Circuito" placeholder="Ej: Circuito BM1 - BM2" value={formRun.name} onChange={e => setFormRun({...formRun, name: e.target.value})} required />
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Crear Libreta</Button></div>
        </form>
      </Modal>

      {/* MODAL 5: AGREGAR LECTURA DE NIVEL */}
      <Modal isOpen={modalReadingOpen} onClose={() => setModalReadingOpen(false)} title="Lectura de Nivel">
        <form onSubmit={handleAddReading} className="space-y-4">
           <div className="space-y-1">
            <label className="text-sm font-medium">Punto (Opcional)</label>
            <select className="w-full p-2 border rounded bg-white" 
              value={formReading.pointId} onChange={e => setFormReading({...formReading, pointId: e.target.value})}>
              <option value="">-- Sin Punto Asociado --</option>
              {points?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Input label="V. Atrás (+)" placeholder="0.000" type="number" step="0.001" value={formReading.backsight} onChange={e => setFormReading({...formReading, backsight: e.target.value})} />
            <Input label="V. Intermedia" placeholder="0.000" type="number" step="0.001" value={formReading.intermediate} onChange={e => setFormReading({...formReading, intermediate: e.target.value})} />
            <Input label="V. Adelante (-)" placeholder="0.000" type="number" step="0.001" value={formReading.foresight} onChange={e => setFormReading({...formReading, foresight: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Registrar</Button></div>
        </form>
      </Modal>
            {/* MODAL SUPERFICIE */}
      <Modal isOpen={modalSurfaceOpen} onClose={() => setModalSurfaceOpen(false)} title="Nueva Superficie">
        <form onSubmit={handleCreateSurface} className="space-y-4">
          <Input label="Nombre" placeholder="Ej: Terreno Natural, Plataforma 1" value={formSurface.name} onChange={e => setFormSurface({...formSurface, name: e.target.value})} required />
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo</label>
            <select className="w-full p-2 border rounded bg-white" 
              value={formSurface.type} onChange={e => setFormSurface({...formSurface, type: e.target.value})}>
              <option value="INITIAL">Terreno Inicial (Base)</option>
              <option value="FINAL">Terreno Final (Corte/Relleno)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit">Crear Modelo</Button></div>
        </form>
      </Modal>
    </div>
  );
};