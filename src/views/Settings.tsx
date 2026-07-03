import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Sliders, 
  Database, 
  Save, 
  Upload, 
  HelpCircle,
  CheckCircle,
  Copy,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  Sparkles,
  ToggleLeft
} from 'lucide-react';
import { db, SUPABASE_SQL_SCRIPT, isSupabaseConnected } from '../lib/database';
import { Company, AppSettings } from '../types';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'companies' | 'numbering' | 'database'>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Active company to edit (0 or 1, since there are exactly 2 companies)
  const [selectedCompIndex, setSelectedCompIndex] = useState<number>(0);
  
  // Status feedback
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Loading indicator for image uploads
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [comps, setts] = await Promise.all([
          db.getCompanies(),
          db.getSettings()
        ]);
        setCompanies(comps);
        setSettings(setts);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (companies.length === 0) return;
    
    const activeCompany = companies[selectedCompIndex];
    try {
      await db.updateCompany(activeCompany);
      triggerFeedback('Company settings updated successfully!');
    } catch (err) {
      console.error('Error saving company:', err);
      triggerFeedback('Error updating company settings.');
    }
  };

  const handlePrefixSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    try {
      await db.saveSettings(settings);
      triggerFeedback('Numbering and prefix settings saved successfully!');
    } catch (err) {
      console.error('Error saving prefix settings:', err);
      triggerFeedback('Error saving prefixes.');
    }
  };

  const triggerFeedback = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleCompanyFieldChange = (field: keyof Company, value: any) => {
    const updated = [...companies];
    updated[selectedCompIndex] = {
      ...updated[selectedCompIndex],
      [field]: value
    };
    setCompanies(updated);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'letterheadUrl' | 'footerUrl' | 'signatureUrl' | 'qrCodeUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const publicUrl = await db.uploadImage(file);
      handleCompanyFieldChange(fieldName, publicUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  const activeComp = companies[selectedCompIndex];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="settings-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Configure company profiles, default terms, GST calculations, prefixes, and Supabase integration.
          </p>
        </div>

        {/* Save confirmation message */}
        {saveFeedback && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle size={14} />
            <span>{saveFeedback}</span>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all duration-150
            ${activeTab === 'companies' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }
          `}
        >
          <Building2 size={16} />
          <span>Entity & Bank Details</span>
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all duration-150
            ${activeTab === 'numbering' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }
          `}
        >
          <Sliders size={16} />
          <span>Document Sequences</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all duration-150
            ${activeTab === 'database' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }
          `}
        >
          <Database size={16} />
          <span>Supabase SQL Script</span>
        </button>
      </div>

      {/* Tab 1: Companies (2 Company profiles supported) */}
      {activeTab === 'companies' && activeComp && (
        <div className="space-y-6">
          {/* Company selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Operational Entity to Edit:</span>
            </div>
            
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              {companies.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompIndex(idx)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition
                    ${selectedCompIndex === idx 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {c.name || `Entity ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCompanySave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 & 2: Main Profile forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <span>General Information</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md font-bold uppercase tracking-wide">Entity {selectedCompIndex + 1}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                    <input 
                      type="text" 
                      required
                      value={activeComp.name}
                      onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Currency Code</label>
                    <select 
                      value={activeComp.currency}
                      onChange={(e) => handleCompanyFieldChange('currency', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="INR">INR (Rupees ₹)</option>
                      <option value="USD">USD (Dollars $)</option>
                      <option value="EUR">EUR (Euros €)</option>
                      <option value="GBP">GBP (Pounds £)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Coordinates *</label>
                    <input 
                      type="email" 
                      required
                      value={activeComp.email}
                      onChange={(e) => handleCompanyFieldChange('email', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Website Address</label>
                    <input 
                      type="text" 
                      value={activeComp.website}
                      onChange={(e) => handleCompanyFieldChange('website', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telephone No</label>
                    <input 
                      type="text" 
                      value={activeComp.phone}
                      onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mobile No *</label>
                    <input 
                      type="text" 
                      required
                      value={activeComp.mobile}
                      onChange={(e) => handleCompanyFieldChange('mobile', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Complete Office Address *</label>
                  <textarea 
                    rows={2}
                    required
                    value={activeComp.address}
                    onChange={(e) => handleCompanyFieldChange('address', e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Legal Registrations Tax settings */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Legal & Tax Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">GST Number</label>
                    <input 
                      type="text" 
                      value={activeComp.gstNumber}
                      onChange={(e) => handleCompanyFieldChange('gstNumber', e.target.value)}
                      placeholder="e.g. 19AAACA1234A1Z1"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">PAN Card No</label>
                    <input 
                      type="text" 
                      value={activeComp.pan}
                      onChange={(e) => handleCompanyFieldChange('pan', e.target.value)}
                      placeholder="e.g. AAACA1234A"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CIN (Corporate ID)</label>
                    <input 
                      type="text" 
                      value={activeComp.cin}
                      onChange={(e) => handleCompanyFieldChange('cin', e.target.value)}
                      placeholder="e.g. U72200WB2018PTC224567"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Default Tax (GST) Rate %</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={activeComp.taxRate}
                      onChange={(e) => handleCompanyFieldChange('taxRate', Number(e.target.value))}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Watermark Text (Optional)</label>
                    <input 
                      type="text" 
                      value={activeComp.watermark || ''}
                      onChange={(e) => handleCompanyFieldChange('watermark', e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bank details card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Remittance & Bank Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Beneficiary / Account Name</label>
                    <input 
                      type="text" 
                      value={activeComp.accountName}
                      onChange={(e) => handleCompanyFieldChange('accountName', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bank Name</label>
                    <input 
                      type="text" 
                      value={activeComp.bankName}
                      onChange={(e) => handleCompanyFieldChange('bankName', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Account Number</label>
                    <input 
                      type="text" 
                      value={activeComp.accountNumber}
                      onChange={(e) => handleCompanyFieldChange('accountNumber', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">IFSC Routing Code</label>
                    <input 
                      type="text" 
                      value={activeComp.ifsc}
                      onChange={(e) => handleCompanyFieldChange('ifsc', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Branch Address</label>
                    <input 
                      type="text" 
                      value={activeComp.branch}
                      onChange={(e) => handleCompanyFieldChange('branch', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SWIFT BIC (Optional)</label>
                    <input 
                      type="text" 
                      value={activeComp.swift || ''}
                      onChange={(e) => handleCompanyFieldChange('swift', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">UPI Virtual ID (Optional)</label>
                    <input 
                      type="text" 
                      value={activeComp.upiId || ''}
                      onChange={(e) => handleCompanyFieldChange('upiId', e.target.value)}
                      placeholder="e.g. company@upi"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and conditions */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Default Terms & Conditions</h3>
                <div>
                  <textarea 
                    rows={4}
                    value={activeComp.terms}
                    onChange={(e) => handleCompanyFieldChange('terms', e.target.value)}
                    placeholder="Enter default terms to pre-load..."
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Attachments / Toggle display details */}
            <div className="space-y-6">
              {/* Image Uploads */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Graphic Assets</h3>
                
                {/* Logo Upload */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Logo</span>
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                    {activeComp.logoUrl ? (
                      <div className="relative group">
                        <img src={activeComp.logoUrl} alt="Logo preview" className="max-h-20 object-contain rounded-lg" referrerPolicy="no-referrer" />
                        <button 
                          type="button" 
                          onClick={() => handleCompanyFieldChange('logoUrl', undefined)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={20} className={uploadingField === 'logoUrl' ? 'text-blue-500 animate-spin' : 'text-slate-400'} />
                        <span className="text-[11px] text-slate-500 text-center font-medium">
                          {uploadingField === 'logoUrl' ? 'Converting...' : 'Click to Upload Logo'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Letterhead Upload */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Letterhead Header Banner (A4 Width)</span>
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                    {activeComp.letterheadUrl ? (
                      <div className="relative group">
                        <img src={activeComp.letterheadUrl} alt="Letterhead Header" className="max-h-16 w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <button 
                          type="button" 
                          onClick={() => handleCompanyFieldChange('letterheadUrl', undefined)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={20} className={uploadingField === 'letterheadUrl' ? 'text-blue-500 animate-spin' : 'text-slate-400'} />
                        <span className="text-[11px] text-slate-500 text-center font-medium">
                          {uploadingField === 'letterheadUrl' ? 'Converting...' : 'Click to Upload Letterhead'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'letterheadUrl')} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Footer Banner */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Letterhead Footer Banner (A4 Width)</span>
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                    {activeComp.footerUrl ? (
                      <div className="relative group">
                        <img src={activeComp.footerUrl} alt="Letterhead Footer" className="max-h-16 w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <button 
                          type="button" 
                          onClick={() => handleCompanyFieldChange('footerUrl', undefined)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={20} className={uploadingField === 'footerUrl' ? 'text-blue-500 animate-spin' : 'text-slate-400'} />
                        <span className="text-[11px] text-slate-500 text-center font-medium">
                          {uploadingField === 'footerUrl' ? 'Converting...' : 'Click to Upload Footer'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'footerUrl')} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Combined Signature & Stamp */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Combined Signature & Stamp</span>
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                    {activeComp.signatureUrl ? (
                      <div className="relative group">
                        <img src={activeComp.signatureUrl} alt="Signature & Stamp" className="max-h-16 object-contain rounded-lg" referrerPolicy="no-referrer" />
                        <button 
                          type="button" 
                          onClick={() => handleCompanyFieldChange('signatureUrl', undefined)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={20} className={uploadingField === 'signatureUrl' ? 'text-blue-500 animate-spin' : 'text-slate-400'} />
                        <span className="text-[11px] text-slate-500 text-center font-medium">
                          {uploadingField === 'signatureUrl' ? 'Converting...' : 'Upload Signature + Stamp'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'signatureUrl')} />
                      </label>
                    )}
                  </div>
                </div>

                {/* UPI QR Code */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">UPI / Remittance QR Code</span>
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                    {activeComp.qrCodeUrl ? (
                      <div className="relative group">
                        <img src={activeComp.qrCodeUrl} alt="Bank QR" className="max-h-20 object-contain rounded-lg" referrerPolicy="no-referrer" />
                        <button 
                          type="button" 
                          onClick={() => handleCompanyFieldChange('qrCodeUrl', undefined)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={20} className={uploadingField === 'qrCodeUrl' ? 'text-blue-500 animate-spin' : 'text-slate-400'} />
                        <span className="text-[11px] text-slate-500 text-center font-medium">
                          {uploadingField === 'qrCodeUrl' ? 'Converting...' : 'Upload QR Code'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'qrCodeUrl')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggles Display Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">PDF Customizer</h3>
                
                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Show Letterhead Banner</span>
                    <input 
                      type="checkbox" 
                      checked={activeComp.showLetterhead} 
                      onChange={(e) => handleCompanyFieldChange('showLetterhead', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Show Letterhead Footer Banner</span>
                    <input 
                      type="checkbox" 
                      checked={activeComp.showFooter} 
                      onChange={(e) => handleCompanyFieldChange('showFooter', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Show Bank Remittance details</span>
                    <input 
                      type="checkbox" 
                      checked={activeComp.showBankDetails} 
                      onChange={(e) => handleCompanyFieldChange('showBankDetails', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Show Signature and Seal stamp</span>
                    <input 
                      type="checkbox" 
                      checked={activeComp.showSignature} 
                      onChange={(e) => handleCompanyFieldChange('showSignature', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Show Terms and Conditions box</span>
                    <input 
                      type="checkbox" 
                      checked={activeComp.showTerms} 
                      onChange={(e) => handleCompanyFieldChange('showTerms', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" 
                    />
                  </label>
                </div>
              </div>

              {/* Submit Company Profile */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-blue-500/10 transition"
              >
                <Save size={16} />
                <span>Save Entity Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Sequences */}
      {activeTab === 'numbering' && settings && (
        <form onSubmit={handlePrefixSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm max-w-2xl space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
            <span>Running Sequences Prefix Settings</span>
          </h3>

          <div className="space-y-4">
            {/* Invoice sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Prefix</label>
                <input 
                  type="text" 
                  required
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  placeholder="e.g. INV-2026-"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Running Number</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={settings.invoiceNextNumber}
                  onChange={(e) => setSettings({ ...settings, invoiceNextNumber: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quotation sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quotation Prefix</label>
                <input 
                  type="text" 
                  required
                  value={settings.quotationPrefix}
                  onChange={(e) => setSettings({ ...settings, quotationPrefix: e.target.value })}
                  placeholder="e.g. QT-2026-"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Running Number</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={settings.quotationNextNumber}
                  onChange={(e) => setSettings({ ...settings, quotationNextNumber: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Work Order sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Work Order Prefix</label>
                <input 
                  type="text" 
                  required
                  value={settings.workOrderPrefix}
                  onChange={(e) => setSettings({ ...settings, workOrderPrefix: e.target.value })}
                  placeholder="e.g. WO-2026-"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Running Number</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={settings.workOrderNextNumber}
                  onChange={(e) => setSettings({ ...settings, workOrderNextNumber: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition"
          >
            <Save size={16} />
            <span>Save Sequences</span>
          </button>
        </form>
      )}

      {/* Tab 3: Database & SQL Schema */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SQL Script Viewer */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Database size={18} className="text-blue-500" />
                <span>PostgreSQL Database Schema DDL</span>
              </h3>

              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100/20"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Schema</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Copy this full schema script and execute it in your <strong>Supabase SQL Editor</strong>. This defines all required indexes, data constraints, table structures, and cascades.
            </p>

            <pre className="p-4 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-2xl overflow-x-auto max-h-[450px] border border-slate-800">
              {SUPABASE_SQL_SCRIPT}
            </pre>
          </div>

          {/* Connection Instructions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm h-fit space-y-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span>Connect Supabase</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                To route your document data to your cloud Supabase account instead of your local browser cache:
              </p>

              <ol className="list-decimal list-inside space-y-2.5">
                <li>Create a free account on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase.com</a> and provision a project.</li>
                <li>Execute the schema script in your project's <strong>SQL Editor</strong> dashboard.</li>
                <li>Under project <strong>Settings &rarr; API</strong>, grab your <strong>Project URL</strong> and <strong>anon public API key</strong>.</li>
                <li>Open <strong>AI Studio Secrets / Environment</strong> variables and configure:
                  <ul className="list-disc list-inside ml-4 mt-1.5 space-y-1">
                    <li><code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code></li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code></li>
                  </ul>
                </li>
                <li>Your applet detects these credentials on hot-reload and switches instantly to remote Cloud execution!</li>
              </ol>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 mt-2">
                <HelpCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-500 leading-normal">
                  <strong>Note:</strong> We also support <strong>Supabase Authentication</strong>! Clicking the bottom left profile connector allows you to connect auth to secure user invoice databases!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
