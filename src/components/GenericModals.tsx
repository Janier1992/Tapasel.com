import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUpdate } from '../services/backendClient';

export const GenericViewModal = ({ record, onClose }: { record: any, onClose: () => void }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Vista Detallada de Registro</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(record).map(([key, value], idx) => {
              if (key === '_audit_role' || typeof value === 'object') return null;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-slate-800 font-medium break-words">{String(value || '-')}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const GenericEditModal = ({ record, tableName, onClose, onSaved }: { record: any, tableName: string, onClose: () => void, onSaved: (newRecord: any) => void }) => {
  const [formData, setFormData] = useState(record || {});
  const [loading, setLoading] = useState(false);

  if (!record) return null;

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!record.id) {
      toast.error('El registro no tiene un ID válido para editar');
      return;
    }
    
    setLoading(true);
    try {
      const cleanData = { ...formData };
      delete cleanData.id;
      delete cleanData.created_at;
      delete cleanData._audit_role;

      // Update in DB
      await apiUpdate(tableName, record.id, cleanData);
      
      toast.success('Registro actualizado exitosamente');
      onSaved(formData);
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-blue-50">
          <h2 className="text-lg font-bold text-blue-900">Editar Registro</h2>
          <button onClick={onClose} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(formData).map(([key, value], idx) => {
              if (key === 'id' || key === 'created_at' || key === '_audit_role' || typeof value === 'object') return null;
              return (
                <div key={idx} className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={value as string || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
