import { useState } from "react";
import { Link } from "react-router-dom"; // <--- Importante importar Link
import { FiPlus, FiSearch, FiFolder, FiMoreVertical, FiCalendar } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../libs/axios";

const fetchProjects = async () => {
  const { data } = await api.get("/projects/user/1"); // Hardcoded user 1
  return data;
};

export const ProjectsPage = () => {
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Mis Proyectos</h2>
          <p className="text-text-muted">Gestiona tus levantamientos y cálculos topográficos.</p>
        </div>
        <Button icon={<FiPlus />}>Nuevo Proyecto</Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-border shadow-sm max-w-lg">
        <FiSearch className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Buscar proyecto..." 
          className="flex-1 outline-none text-sm bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-text-muted">Cargando proyectos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project: any) => (
            // AQUI ESTA EL CAMBIO CLAVE: Usamos Link
            <Link to={`/projects/${project.id}`} key={project.id} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    <FiFolder size={24} />
                  </div>
                  <button className="text-slate-400 hover:text-text-main"><FiMoreVertical /></button>
                </div>
                
                <h3 className="font-semibold text-lg text-text-main mb-1">{project.name}</h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-4">
                  {project.location || "Sin ubicación especificada"}
                </p>
                
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <FiCalendar /> {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                    Activo
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};