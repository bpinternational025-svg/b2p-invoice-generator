import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  MapPin, 
  FileCheck,
  Building2,
  X,
  FileText
} from 'lucide-react';
import { db } from '../lib/database';
import { Customer } from '../types';

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    address: '',
    gstNumber: '',
    contactPerson: '',
    mobile: '',
    email: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await db.getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      companyName: '',
      address: '',
      gstNumber: '',
      contactPerson: '',
      mobile: '',
      email: '',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      companyName: cust.companyName || '',
      address: cust.address,
      gstNumber: cust.gstNumber || '',
      contactPerson: cust.contactPerson || '',
      mobile: cust.mobile,
      email: cust.email,
      notes: cust.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Customer Name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.mobile.trim()) errors.mobile = 'Mobile number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const saved: Customer = {
      id: editingCustomer?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      companyName: formData.companyName.trim() || undefined,
      address: formData.address.trim(),
      gstNumber: formData.gstNumber.trim() || undefined,
      contactPerson: formData.contactPerson.trim() || undefined,
      mobile: formData.mobile.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim() || undefined
    };

    try {
      await db.saveCustomer(saved);
      if (editingCustomer) {
        setCustomers(customers.map(c => c.id === saved.id ? saved : c));
      } else {
        setCustomers([...customers, saved]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this customer? This action is irreversible.')) return;
    try {
      await db.deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase();
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.companyName?.toLowerCase().includes(term) ||
      cust.email.toLowerCase().includes(term) ||
      cust.mobile.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="customers-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Manage your client base, contact coordinates, and invoice details.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition shrink-0"
        >
          <Plus size={16} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 transition duration-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clients by name, business, email, or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
          <span>Total Records: <strong className="font-semibold text-slate-800 dark:text-slate-200">{filteredCustomers.length}</strong></span>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-16 rounded-3xl text-center max-w-xl mx-auto transition duration-200">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Customers Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {searchTerm ? 'Try adjusting your search keywords.' : 'Add your very first client profile to populate the directory.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus size={14} />
              <span>Create Profile</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <div 
              key={cust.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug truncate" title={cust.name}>
                      {cust.name}
                    </h3>
                    {cust.companyName && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 truncate" title={cust.companyName}>
                        <Building2 size={12} className="shrink-0" />
                        <span>{cust.companyName}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-0.5 rounded-xl shrink-0">
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                      title="Edit Customer"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                      title="Delete Customer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <a href={`mailto:${cust.email}`} className="hover:underline hover:text-blue-600 truncate">{cust.email}</a>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <a href={`tel:${cust.mobile}`} className="hover:underline hover:text-blue-600">{cust.mobile}</a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed" title={cust.address}>{cust.address}</span>
                  </div>
                </div>
              </div>

              {/* Extra Badges / Notes */}
              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
                {cust.gstNumber ? (
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold tracking-wider rounded-lg uppercase">
                    GST: {cust.gstNumber}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No tax registration registered</span>
                )}
                {cust.notes && (
                  <span className="text-[10px] text-slate-400 max-w-[150px] truncate" title={cust.notes}>
                    &bull; {cust.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {editingCustomer ? 'Modify Client Profile' : 'Register New Client Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Gupta"
                    className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                  {formErrors.name && <p className="text-[10px] text-rose-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Contact Person (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Rahul (Director)"
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Company & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Business / Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. WebCraft Enterprises"
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tax / GST Identification Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 19AAACA1234A1Z1"
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Primary Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. +91 98300 98300"
                    className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.mobile ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                  {formErrors.mobile && <p className="text-[10px] text-rose-500 mt-1">{formErrors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Primary Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@webcraft.com"
                    className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                  {formErrors.email && <p className="text-[10px] text-rose-500 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Complete Billing Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city, state, postal code..."
                  className={`w-full p-2.5 text-sm rounded-xl border ${formErrors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.address && <p className="text-[10px] text-rose-500 mt-1">{formErrors.address}</p>}
              </div>

              {/* Private Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Private Reference Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Demands GST invoice / payment is split..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
                  {editingCustomer ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
