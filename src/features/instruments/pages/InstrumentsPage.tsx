import React, { useState } from "react";
import { FiPlus, FiTool, FiTrash2 } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../libs/axios";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

// --- API Functions ---
const fetchInstruments = async () => {
  // OJO: Aquí estoy hardcodeando el usuario 1. Luego pondremos Auth.
  const { data } = await api.get("/instruments/user/1"); 
  return data;
};

const createInstrument = async (data: any) => {
  return api.post("/instruments", { ...data, userId: 1 });
};

const deleteInstrument = async (id: number) => {
  return api.delete(`/instruments/${id}`);
};

// --- Componente Principal ---
export const InstrumentsPage = () => {
  const queryClient = useQueryClient();
  const { data: instruments, isLoading } = useQuery({ queryKey: ['instruments'], queryFn: fetchInstruments });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    type: "THEODOLITE",
    serial: "",
    stadiaConstant: 100
  });

  // Mutaciones (Acciones)
  const createMutation = useMutation({
    mutationFn: createInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      setIsModalOpen(false);
      setFormData({ name: "", type: "THEODOLITE", serial: "", stadiaConstant: 100 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInstrument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instruments'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Instrumentos</h2>
          <p className="text-text-muted">Gestiona tus Estaciones Totales, Teodolitos y Niveles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<FiPlus />}>Nuevo Equipo</Button>
      </div>

      {isLoading ? (
        <p>Cargando equipos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments?.map((inst: any) => (
            <Card key={inst.id} className="relative group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-primary rounded-lg">
                  <FiTool size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main">{inst.name}</h3>
                  <p className="text-sm text-text-muted">{inst.type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400 mt-1">S/N: {inst.serial || 'N/A'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                    if(confirm("¿Seguro que quieres borrar este instrumento?")) 
                        deleteMutation.mutate(inst.id)
                }}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiTrash2 />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Instrumento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre del Equipo" 
            placeholder="Ej: Leica TS06" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Tipo</label>
            <select 
              className="w-full px-4 py-2.5 bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-indigo-50"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="THEODOLITE">Teodolito (Mecánico/Digital)</option>
              <option value="TOTAL_STATION">Estación Total</option>
              <option value="LEVEL">Nivel de Ingeniero</option>
              <option value="GPS">GPS / GNSS</option>
            </select>
          </div>

          <Input 
            label="Número de Serie" 
            value={formData.serial}
            onChange={(e) => setFormData({...formData, serial: e.target.value})}
          />

          {formData.type === 'THEODOLITE' && (
             <Input 
               label="Constante Estadimétrica (K)" 
               type="number"
               value={formData.stadiaConstant}
               onChange={(e) => setFormData({...formData, stadiaConstant: Number(e.target.value)})}
             />
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Guardar Equipo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};