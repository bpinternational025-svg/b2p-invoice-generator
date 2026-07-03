import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Badge,
  TrendingUp,
  Tag
} from 'lucide-react';
import { db } from '../lib/database';
import { Service, ServiceUnit } from '../types';

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultRate: '',
    unit: 'Hours' as ServiceUnit
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await db.getServices();
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      defaultRate: '',
      unit: 'Hours'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      defaultRate: service.defaultRate.toString(),
      unit: service.unit
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Service Name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.defaultRate.trim() || isNaN(Number(formData.defaultRate)) || Number(formData.defaultRate) < 0) {
      errors.defaultRate = 'Valid default rate is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const saved: Service = {
      id: editingService?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      defaultRate: Number(formData.defaultRate),
      unit: formData.unit
    };

    try {
      await db.saveService(saved);
      if (editingService) {
        setServices(services.map(s => s.id === saved.id ? saved : s));
      } else {
        setServices([...services, saved]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving service:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this service? This action is irreversible.')) return;
    try {
      await db.deleteService(id);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const filteredServices = services.filter(serv => {
    const term = searchTerm.toLowerCase();
    return (
      serv.name.toLowerCase().includes(term) ||
      serv.description.toLowerCase().includes(term) ||
      serv.unit.toLowerCase().includes(term)
    );
  });

  const units: ServiceUnit[] = ['Days', 'Hours', 'Months', 'Quantity', 'Fixed'];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="services-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Service Library</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Maintain your master list of standardized offerings, pricing templates, and units.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition shrink-0"
        >
          <Plus size={16} />
          <span>Add Standard Service</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 transition duration-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search offerings by title or descriptions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span>Active Items: <strong className="font-semibold text-slate-800 dark:text-slate-200">{filteredServices.length}</strong></span>
        </div>
      </div>

      {/* Service Directory Cards */}
      {filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-16 rounded-3xl text-center max-w-xl mx-auto transition duration-200">
          <Briefcase size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Offerings Listed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {searchTerm ? 'No results matched your filter.' : 'Populate your catalog to allow one-click document item pre-population.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus size={14} />
              <span>Register Service</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-snug truncate" title={service.name}>
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold rounded-lg tracking-wide uppercase">
                        {service.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-0.5 rounded-xl shrink-0">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                      title="Edit Service"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                      title="Delete Service"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Rate Metric footer */}
              <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400">
                  <Tag size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Base Rate</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                  ₹{service.defaultRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  <span className="text-[10px] text-slate-400 font-normal"> / {service.unit.slice(0, -1)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {editingService ? 'Edit Catalog Service' : 'Add Catalog Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Senior Frontend Consulting"
                  className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.name && <p className="text-[10px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Rate & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Default Rate (INR/₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.defaultRate}
                    onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                    placeholder="e.g. 1500"
                    className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.defaultRate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                  {formErrors.defaultRate && <p className="text-[10px] text-rose-500 mt-1">{formErrors.defaultRate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Standard Billing Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as ServiceUnit })}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe details, deliverables, and parameters..."
                  className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.description && <p className="text-[10px] text-rose-500 mt-1">{formErrors.description}</p>}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition"
                >
                  {editingService ? 'Save Changes' : 'Create Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
