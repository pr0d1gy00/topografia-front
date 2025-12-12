import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiFolder, FiMapPin, FiCalendar, FiTrash2, FiLayers } from "react-icons/fi";
import { fetchProjects, createProject, deleteProject } from "../api/projects";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

export const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: ""
  });

  // 1. Obtener Proyectos (READ)
  const { data: projects, isLoading, isError } = useQuery({ 
    queryKey: ['projects'], 
    queryFn: fetchProjects 
  });

  // 2. Crear Proyecto (CREATE)
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setFormData({ name: "", location: "", description: "" });
    },
    onError: (error) => {
      alert("Error al crear proyecto. Verifica que el Backend esté corriendo.");
      console.error(error);
    }
  });

  // 3. Eliminar Proyecto (DELETE)
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Filtrado simple en el cliente
  const filteredProjects = projects?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Mis Proyectos</h2>
          <p className="text-text-muted">Gestiona tus levantamientos y cálculos topográficos.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<FiPlus />}>
          Nuevo Proyecto
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-border shadow-sm max-w-lg">
        <FiSearch className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o ubicación..." 
          className="flex-1 outline-none text-sm bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENT GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
          Error al cargar proyectos. Revisa que el servidor Backend esté encendido en el puerto correcto.
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="text-center py-20 text-text-muted border-2 border-dashed border-slate-200 rounded-xl">
          <FiFolder className="mx-auto text-4xl mb-2 opacity-20" />
          <p>No se encontraron proyectos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects?.map((project: any) => (
            <div key={project.id} className="relative group">
              <Link to={`/projects/${project.id}`} className="block h-full">
                <Card className="hover:shadow-md transition-all cursor-pointer h-full hover:border-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-indigo-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <FiFolder size={24} />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-text-main mb-1">{project.name}</h3>
                  <p className="text-sm text-text-muted line-clamp-2 mb-4 flex items-center gap-1">
                    <FiMapPin size={14} /> {project.location || "Sin ubicación"}
                  </p>
                  
                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <FiCalendar /> {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                      <FiLayers /> {project._count?.points || 0} Puntos
                    </span>
                  </div>
                </Card>
              </Link>
              
              {/* Botón Flotante Eliminar (Fuera del Link para evitar navegación) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if(confirm("¿Estás seguro de eliminar este proyecto y todos sus datos?")) {
                    deleteMutation.mutate(project.id);
                  }
                }}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full shadow-sm z-10"
                title="Eliminar Proyecto"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR PROYECTO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Proyecto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre del Proyecto" 
            placeholder="Ej: Levantamiento Finca La Esperanza" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
          
          <Input 
            label="Ubicación" 
            placeholder="Ej: Barquisimeto, Lara" 
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Descripción (Opcional)</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-indigo-50 text-text-main min-h-[100px]"
              placeholder="Detalles sobre el trabajo..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar Proyecto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};