import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FiMap, FiList, FiTarget, FiPlus, FiTrash2, 
  FiDownload, FiLayers, FiArrowLeft 
} from "react-icons/fi";
import { fetchPoints, createPoint, deletePoint, fetchProjectById } from "../../topography/api/points";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const queryClient = useQueryClient();
  
  // Estado local
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'POINTS' | 'STATIONS' | 'LEVELING'>('POINTS');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    x: "",
    y: "",
    z: "",
    code: "",
    isFixed: false
  });

  // --- QUERIES (Lectura de datos) ---
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId // Solo ejecuta si hay ID
  });

  const { data: points, isLoading: isLoadingPoints } = useQuery({ 
    queryKey: ['points', projectId], 
    queryFn: () => fetchPoints(projectId),
    enabled: !!projectId
  });

  // --- MUTATIONS (Escritura de datos) ---
  const createMutation = useMutation({
    mutationFn: createPoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', projectId] });
      setIsModalOpen(false);
      // Limpiar form
      setFormData({ name: "", x: "", y: "", z: "", code: "", isFixed: false });
    },
    onError: (error) => {
      alert("Error al crear punto: " + error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['points', projectId] })
  });

  // Manejo del Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      projectId,
      name: formData.name,
      x: parseFloat(formData.x),
      y: parseFloat(formData.y),
      z: parseFloat(formData.z),
      code: formData.code,
      isFixed: formData.isFixed
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. HEADER DEL PROYECTO */}
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
            {points?.length || 0} Puntos registrados
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link to={`/project/${projectId}/cad`}>
            <Button variant="secondary" icon={<FiMap />}>Visor CAD</Button>
          </Link>
          <Button variant="outline" icon={<FiDownload />}>Excel</Button>
        </div>
      </div>

      {/* 2. TABS DE NAVEGACIÓN */}
      <div className="flex gap-6 border-b border-border overflow-x-auto">
        <button 
          onClick={() => setActiveTab('POINTS')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'POINTS' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <FiTarget /> Nube de Puntos
        </button>
        <button 
          onClick={() => setActiveTab('STATIONS')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'STATIONS' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <FiLayers /> Estaciones (Teodolito)
        </button>
        <button 
          onClick={() => setActiveTab('LEVELING')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LEVELING' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <FiList /> Nivelación
        </button>
      </div>

      {/* 3. CONTENIDO: TABLA DE PUNTOS */}
      {activeTab === 'POINTS' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800">
              💡 <b>Gestión de Coordenadas:</b> Aquí puedes ver los puntos calculados o agregar puntos base (BM) manualmente.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<FiPlus />}>Nuevo Punto</Button>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-text-muted font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Este (X)</th>
                    <th className="px-6 py-4">Norte (Y)</th>
                    <th className="px-6 py-4">Cota (Z)</th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingPoints ? (
                    <tr><td colSpan={6} className="p-8 text-center text-text-muted">Cargando datos...</td></tr>
                  ) : points?.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-text-muted">No hay puntos registrados aún.</td></tr>
                  ) : (
                    points?.map((point: any) => (
                      <tr key={point.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-3 font-medium text-text-main">
                          {point.name}
                          {point.isFixed && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">BASE</span>}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-600">{Number(point.x).toFixed(3)}</td>
                        <td className="px-6 py-3 font-mono text-slate-600">{Number(point.y).toFixed(3)}</td>
                        <td className="px-6 py-3 font-mono text-slate-600">{Number(point.z).toFixed(3)}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                            {point.code || "---"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => { if(confirm("¿Eliminar punto?")) deleteMutation.mutate(point.id) }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Eliminar punto"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. MODAL CREAR PUNTO */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Punto Manual">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre / ID" 
            placeholder="Ej: BM-1, E-0" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Este (X)" type="number" step="0.001" placeholder="1000.000"
              value={formData.x} onChange={e => setFormData({...formData, x: e.target.value})} required
            />
            <Input 
              label="Norte (Y)" type="number" step="0.001" placeholder="1000.000"
              value={formData.y} onChange={e => setFormData({...formData, y: e.target.value})} required
            />
            <Input 
              label="Cota (Z)" type="number" step="0.001" placeholder="100.000"
              value={formData.z} onChange={e => setFormData({...formData, z: e.target.value})} required
            />
          </div>
          <Input 
            label="Código / Descripción" placeholder="Ej: CLAVO, MOJON, ARBOL" 
            value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
          />
          
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
            <input 
              type="checkbox" id="isFixed" 
              checked={formData.isFixed} 
              onChange={e => setFormData({...formData, isFixed: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
            />
            <label htmlFor="isFixed" className="text-sm text-text-main select-none cursor-pointer">
              Marcar como <b>Punto Fijo (Base)</b>
              <p className="text-xs text-text-muted">Protege este punto de ser movido por recálculos.</p>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Guardar Punto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};