import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FiMap, FiList, FiTarget, FiPlus, FiTrash2, 
  FiDownload, FiLayers, FiArrowLeft, FiActivity, FiBook, FiRefreshCw, FiBox, FiUploadCloud 
} from "react-icons/fi";

// APIs
import { fetchPoints, createPoint, deletePoint, fetchProjectById } from "../../topography/api/points";
import { fetchStations, createStation, createObservation } from "../../topography/api/stations";
import { fetchLevelingRuns, createLevelingRun, addLevelingReading } from "../../topography/api/leveling";
import { fetchSurfaces, createSurface, addPointsToSurface } from "../../topography/api/surfaces"; 
import { api } from "../../../libs/axios"; 

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

const fetchInstruments = async () => {
  const { data } = await api.get("/instruments/user/1");
  return data;
};

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'POINTS' | 'STATIONS' | 'LEVELING' | 'SURFACES'>('POINTS');
  
  // Modales
  const [modalPointOpen, setModalPointOpen] = useState(false);
  const [modalStationOpen, setModalStationOpen] = useState(false);
  const [modalObsOpen, setModalObsOpen] = useState(false);
  const [modalRunOpen, setModalRunOpen] = useState(false);
  const [modalReadingOpen, setModalReadingOpen] = useState(false);
  const [modalSurfaceOpen, setModalSurfaceOpen] = useState(false);
  
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
  const [formReading, setFormReading] = useState({ pointId: "", backsight: "", intermediate: "", foresight: "" });
  const [formSurface, setFormSurface] = useState({ name: "", type: "INITIAL" });

  // --- QUERIES (Importante: extraemos 'refetch' para el botón manual) ---
  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProjectById(projectId) });
  
  // AQUÍ ESTABA EL ERROR ANTES: Faltaba sacar 'refetch'
  const { data: points, refetch: refetchPoints } = useQuery({ queryKey: ['points', projectId], queryFn: () => fetchPoints(projectId) });
  const { data: stations, refetch: refetchStations } = useQuery({ queryKey: ['stations', projectId], queryFn: () => fetchStations(projectId) });
  
  const { data: instruments } = useQuery({ queryKey: ['instruments'], queryFn: fetchInstruments });
  const { data: levelingRuns } = useQuery({ queryKey: ['levelingRuns', projectId], queryFn: () => fetchLevelingRuns(projectId).catch(() => []) });
  const { data: surfaces } = useQuery({ queryKey: ['surfaces', projectId], queryFn: () => fetchSurfaces(projectId).catch(() => []) });

  // --- MUTATIONS ---
  
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

  const createStationMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations', projectId] });
      setModalStationOpen(false);
      setFormStation({ occupiedPointId: "", instrumentId: "", heightInstrument: "", backsightAngle: 0 });
    }
  });

  const createObsMut = useMutation({
    mutationFn: createObservation,
    onSuccess: () => {
      // Forzar recarga de todo al medir
      queryClient.invalidateQueries({ queryKey: ['stations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['points', projectId], refetchType: 'all' });
      setModalObsOpen(false);
      setFormObs({ ...formObs, description: "", angleHorizontal: "", stadiaTop: "", stadiaBottom: "", stadiaMiddle: "" });
    },
    onError: (err) => alert("Error: " + err)
  });

  const createRunMut = useMutation({
    mutationFn: createLevelingRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levelingRuns', projectId] });
      setModalRunOpen(false);
      setFormRun({ name: "" });
    }
  });

  const addReadingMut = useMutation({
    mutationFn: addLevelingReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levelingRuns', projectId] });
      setModalReadingOpen(false);
      setFormReading({ pointId: "", backsight: "", intermediate: "", foresight: "" });
    }
  });

  const createSurfaceMut = useMutation({
    mutationFn: createSurface,
    onSuccess: (newSurface) => {
      if(points && points.length > 0) {
        const allPointIds = points.map((p: any) => p.id);
        addPointsToSurface(newSurface.data.id, allPointIds).then(() => {
          queryClient.invalidateQueries({ queryKey: ['surfaces', projectId] });
        });
      }
      setModalSurfaceOpen(false);
      setFormSurface({ name: "", type: "INITIAL" });
    }
  });

  // --- HANDLERS ---
  const handleCreatePoint = (e: React.FormEvent) => { e.preventDefault(); createPointMut.mutate({ projectId, ...formPoint, x: Number(formPoint.x), y: Number(formPoint.y), z: Number(formPoint.z) }); };
  const handleCreateStation = (e: React.FormEvent) => { e.preventDefault(); createStationMut.mutate({ projectId, occupiedPointId: Number(formStation.occupiedPointId), instrumentId: Number(formStation.instrumentId), heightInstrument: Number(formStation.heightInstrument), backsightAngle: Number(formStation.backsightAngle) }); };
  
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

  const handleCreateRun = (e: React.FormEvent) => { e.preventDefault(); createRunMut.mutate({ projectId, name: formRun.name }); };
  const handleAddReading = (e: React.FormEvent) => { e.preventDefault(); if (!selectedRunId) return; addReadingMut.mutate({ runId: selectedRunId, pointId: formReading.pointId ? Number(formReading.pointId) : undefined, backsight: formReading.backsight ? Number(formReading.backsight) : undefined, intermediate: formReading.intermediate ? Number(formReading.intermediate) : undefined, foresight: formReading.foresight ? Number(formReading.foresight) : undefined, }); };
  const handleCreateSurface = (e: React.FormEvent) => { e.preventDefault(); createSurfaceMut.mutate({ projectId, ...formSurface }); };

    function openReadingModal(id: any): void {
        setSelectedRunId(typeof id === "number" ? id : Number(id));
        setFormReading({ pointId: "", backsight: "", intermediate: "", foresight: "" });
        setModalReadingOpen(true);
    }
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
            <FiArrowLeft /> Volver a Proyectos
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-main">{project?.name || `Proyecto #${projectId}`}</h1>
            
            {/* BOTÓN REFRESCAR MANUAL (IMPORTANTE PARA VER CAMBIOS) */}
            <button 
              onClick={() => { refetchPoints(); refetchStations(); queryClient.invalidateQueries(); }} 
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors" 
              title="Forzar actualización"
            >
              <FiRefreshCw size={14} />
            </button>

          </div>
          <p className="text-text-muted flex items-center gap-2 text-sm">
            Ubicación: {project?.location || "No definida"} <span className="text-slate-300">|</span> {points?.length || 0} Puntos
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
          { id: 'SURFACES', label: 'Superficies', icon: FiBox },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}>
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW: POINTS */}
      {activeTab === 'POINTS' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800">💡 Puntos Base (BM)</p>
            <Button  onClick={() => setModalPointOpen(true)} icon={<FiPlus />}>Nuevo Punto</Button>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-text-muted font-medium border-b border-border sticky top-0">
                  <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">X</th><th className="px-6 py-4">Y</th><th className="px-6 py-4">Z</th><th className="px-6 py-4">Código</th><th className="px-6 py-4 text-right"></th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {points?.map((point: any) => (
                    <tr key={point.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium">{point.name} {point.isFixed && <span className="bg-red-100 text-red-600 text-[10px] px-1 ml-1 rounded">BM</span>}</td>
                      <td className="px-6 py-3 font-mono">{Number(point.x).toFixed(3)}</td>
                      <td className="px-6 py-3 font-mono">{Number(point.y).toFixed(3)}</td>
                      <td className="px-6 py-3 font-mono">{Number(point.z).toFixed(3)}</td>
                      <td className="px-6 py-3"><span className="bg-slate-100 px-2 rounded text-xs">{point.code}</span></td>
                      <td className="px-6 py-3 text-right"><button onClick={() => deletePointMut.mutate(point.id)} className="text-slate-300 hover:text-red-500"><FiTrash2 /></button></td>
                    </tr>
                  ))}
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
             <h3 className="font-semibold text-text-main">Libreta Planimetría</h3>
             <Button onClick={() => setModalStationOpen(true)} icon={<FiLayers />}>Nueva Estación</Button>
          </div>
          {stations?.map((station: any) => (
            <Card key={station.id} className="relative border-l-4 border-l-primary">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border pb-4 mb-4">
                <div>
                  <h4 className="font-bold text-lg text-primary">Estación: {station.occupiedPoint?.name}</h4>
                  <div className="text-sm text-text-muted flex gap-4 mt-1"><span>HI: {station.heightInstrument}m</span><span>Ref: {station.backsightAngle}°</span></div>
                </div>
                <Button  onClick={() => { setSelectedStationId(station.id); setModalObsOpen(true); }} icon={<FiPlus />}>Medir</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-text-muted uppercase"><tr><th className="px-4 py-2">Punto</th><th className="px-4 py-2">Azimut</th><th className="px-4 py-2">Vertical</th><th className="px-4 py-2">Dist.</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {station.observations?.map((obs: any) => (
                      <tr key={obs.id} className="hover:bg-slate-50"><td className="px-4 py-2 text-indigo-600 font-medium">{obs.targetPoint?.name || "Calc..."}</td><td className="px-4 py-2 font-mono">{obs.angleHorizontal}°</td><td className="px-4 py-2 font-mono">{obs.angleVertical}°</td><td className="px-4 py-2 font-mono">{obs.isStadia ? ((obs.stadiaTop - obs.stadiaBottom) * 100).toFixed(2) : obs.distanceSlope} m</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW: LEVELING */}
      {activeTab === 'LEVELING' && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex justify-between items-center"><h3 className="font-semibold text-text-main">Nivelación</h3><Button onClick={() => setModalRunOpen(true)} icon={<FiBook />}>Nueva Libreta</Button></div>
           {levelingRuns?.map((run: any) => (
             <Card key={run.id}><div className="flex justify-between border-b pb-2 mb-2"><h4 className="font-bold">{run.name}</h4><Button  variant="secondary" onClick={() => openReadingModal(run.id)} icon={<FiPlus />}>Lectura</Button></div>
               <table className="w-full text-sm text-center"><thead className="bg-slate-50 text-xs uppercase"><tr><th className="text-left px-2">Pto</th><th>V.Atrás</th><th>V.Adel</th><th className="bg-indigo-50">AI</th><th className="bg-emerald-50">Cota</th></tr></thead>
                 <tbody>{run.readings?.map((r:any) => (<tr key={r.id}><td className="text-left font-medium">{r.point?.name}</td><td>{r.backsight}</td><td>{r.foresight}</td><td className="bg-indigo-50/50 font-bold">{r.calculatedAI}</td><td className="bg-emerald-50/50 font-bold">{r.calculatedZ}</td></tr>))}</tbody>
               </table>
             </Card>
           ))}
        </div>
      )}

      {/* VIEW: SURFACES */}
      {activeTab === 'SURFACES' && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex justify-between items-center"><h3 className="font-semibold text-text-main">Modelos Digitales (DTM)</h3><Button onClick={() => setModalSurfaceOpen(true)} icon={<FiBox />}>Nueva Superficie</Button></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {surfaces?.map((surf: any) => (
               <Card key={surf.id} className="border border-slate-200">
                 <h4 className="font-bold text-lg">{surf.name}</h4>
                 <span className={`text-xs px-2 py-1 rounded font-bold ${surf.type === 'INITIAL' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{surf.type}</span>
                 <p className="text-sm mt-2 text-slate-500">Puntos: {surf.points?.length || "Todos"}</p>
                 <Button variant="secondary" className="w-full mt-4" icon={<FiUploadCloud />}>Recalcular Malla</Button>
               </Card>
             ))}
           </div>
        </div>
      )}

      {/* MODALES */}
      <Modal isOpen={modalPointOpen} onClose={() => setModalPointOpen(false)} title="Punto"><form onSubmit={handleCreatePoint} className="space-y-4"><Input label="Nombre" value={formPoint.name} onChange={e=>setFormPoint({...formPoint, name:e.target.value})} required/><div className="grid grid-cols-3 gap-2"><Input label="X" value={formPoint.x} onChange={e=>setFormPoint({...formPoint, x:e.target.value})}/><Input label="Y" value={formPoint.y} onChange={e=>setFormPoint({...formPoint, y:e.target.value})}/><Input label="Z" value={formPoint.z} onChange={e=>setFormPoint({...formPoint, z:e.target.value})}/></div><Button type="submit">Guardar</Button></form></Modal>
      
      <Modal isOpen={modalStationOpen} onClose={() => setModalStationOpen(false)} title="Estación"><form onSubmit={handleCreateStation} className="space-y-4"><select className="w-full p-2 border rounded" value={formStation.occupiedPointId} onChange={e=>setFormStation({...formStation, occupiedPointId:e.target.value})}><option>Punto Ocupado</option>{points?.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className="w-full p-2 border rounded" value={formStation.instrumentId} onChange={e=>setFormStation({...formStation, instrumentId:e.target.value})}><option>Instrumento</option>{instruments?.map((i:any)=><option key={i.id} value={i.id}>{i.name}</option>)}</select><Input label="HI" value={formStation.heightInstrument} onChange={e=>setFormStation({...formStation, heightInstrument:e.target.value})}/><Input label="Azimut" value={formStation.backsightAngle} onChange={e=>setFormStation({...formStation, backsightAngle:Number(e.target.value)})}/><Button type="submit">Crear</Button></form></Modal>
      
      <Modal isOpen={modalObsOpen} onClose={() => setModalObsOpen(false)} title="Lectura"><form onSubmit={handleCreateObs} className="space-y-4"><Input label="Desc" value={formObs.description} onChange={e=>setFormObs({...formObs, description:e.target.value})} autoFocus/><div className="grid grid-cols-2 gap-2"><Input label="Hz" value={formObs.angleHorizontal} onChange={e=>setFormObs({...formObs, angleHorizontal:e.target.value})}/><Input label="V" value={formObs.angleVertical} onChange={e=>setFormObs({...formObs, angleVertical:Number(e.target.value)})}/></div><div className="p-2 border rounded bg-slate-50"><label className="flex gap-2 mb-2"><input type="checkbox" checked={formObs.isStadia} onChange={e=>setFormObs({...formObs, isStadia:e.target.checked})}/> Modo Estadía</label>{formObs.isStadia ? <div className="grid grid-cols-3 gap-2"><Input label="Sup" value={formObs.stadiaTop} onChange={e=>setFormObs({...formObs, stadiaTop:e.target.value})}/><Input label="Med" value={formObs.stadiaMiddle} onChange={e=>setFormObs({...formObs, stadiaMiddle:e.target.value})}/><Input label="Inf" value={formObs.stadiaBottom} onChange={e=>setFormObs({...formObs, stadiaBottom:e.target.value})}/></div> : <div className="grid grid-cols-2 gap-2"><Input label="Distancia" value={formObs.distanceSlope} onChange={e=>setFormObs({...formObs, distanceSlope:e.target.value})}/><Input label="Alt. Prisma" value={formObs.heightTarget} onChange={e=>setFormObs({...formObs, heightTarget:e.target.value})}/></div>}</div><Button type="submit">Registrar</Button></form></Modal>

      <Modal isOpen={modalRunOpen} onClose={() => setModalRunOpen(false)} title="Libreta"><form onSubmit={handleCreateRun} className="space-y-4"><Input label="Nombre" value={formRun.name} onChange={e=>setFormRun({...formRun, name:e.target.value})}/><Button type="submit">Crear</Button></form></Modal>
      <Modal isOpen={modalReadingOpen} onClose={() => setModalReadingOpen(false)} title="Lectura Nivel"><form onSubmit={handleAddReading} className="space-y-4"><select className="w-full p-2 border rounded" value={formReading.pointId} onChange={e=>setFormReading({...formReading, pointId:e.target.value})}><option value="">Sin Punto</option>{points?.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="grid grid-cols-3 gap-2"><Input label="Atras" value={formReading.backsight} onChange={e=>setFormReading({...formReading, backsight:e.target.value})}/><Input label="Inter" value={formReading.intermediate} onChange={e=>setFormReading({...formReading, intermediate:e.target.value})}/><Input label="Adel" value={formReading.foresight} onChange={e=>setFormReading({...formReading, foresight:e.target.value})}/></div><Button type="submit">Guardar</Button></form></Modal>
      <Modal isOpen={modalSurfaceOpen} onClose={() => setModalSurfaceOpen(false)} title="Superficie"><form onSubmit={handleCreateSurface} className="space-y-4"><Input label="Nombre" value={formSurface.name} onChange={e=>setFormSurface({...formSurface, name:e.target.value})}/><select className="w-full p-2 border rounded" value={formSurface.type} onChange={e=>setFormSurface({...formSurface, type:e.target.value})}><option value="INITIAL">Original</option><option value="FINAL">Final</option></select><Button type="submit">Crear</Button></form></Modal>
    </div>
  );
};