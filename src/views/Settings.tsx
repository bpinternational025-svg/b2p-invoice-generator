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
  ToggleLeft,
  FileSpreadsheet,
  ExternalLink,
  LogOut,
  CloudLightning
} from 'lucide-react';
import { db, SUPABASE_SQL_SCRIPT, isSupabaseConnected } from '../lib/database';
import { Company, AppSettings } from '../types';
import { 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken, 
  getGoogleSheetsId, 
  getGoogleSheetsUrl, 
  createGoogleSheet,
  setGoogleSheetsId,
  hasAccessToken
} from '../lib/googleAuth';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'companies' | 'numbering' | 'database' | 'google'>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Google Sheets states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customSheetIdInput, setCustomSheetIdInput] = useState('');

  
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

  useEffect(() => {
    async function loadGoogleState() {
      try {
        const token = await getAccessToken();
        setGoogleToken(token);
        const currentSheetId = getGoogleSheetsId();
        setSheetId(currentSheetId);
        setSheetUrl(getGoogleSheetsUrl());
        if (currentSheetId) {
          setCustomSheetIdInput(currentSheetId);
        }
      } catch (err) {
        console.error('Error loading Google state:', err);
      }
    }
    loadGoogleState();
  }, [activeTab]);

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleToken(result.accessToken);
        setGoogleUser(result.user);
        setSheetId(getGoogleSheetsId());
        setSheetUrl(getGoogleSheetsUrl());
        triggerFeedback('Google Account connected successfully!');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      triggerFeedback('Failed to connect Google account.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await logoutGoogle();
      setGoogleToken(null);
      setGoogleUser(null);
      setSheetId(null);
      setSheetUrl(null);
      triggerFeedback('Google account disconnected.');
    } catch (err) {
      console.error('Disconnect error:', err);
      triggerFeedback('Failed to disconnect.');
    }
  };

  const handleCreateSheet = async () => {
    if (!googleToken) {
      triggerFeedback('Please connect your Google Account first.');
      return;
    }
    setCreatingSheet(true);
    try {
      const res = await createGoogleSheet(googleToken);
      setSheetId(res.id);
      setSheetUrl(res.url);
      setCustomSheetIdInput(res.id);
      triggerFeedback('New Google Sheet created successfully!');
    } catch (err) {
      console.error('Create sheet error:', err);
      triggerFeedback('Failed to create Google Sheet.');
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleSaveCustomSheetId = () => {
    if (!customSheetIdInput.trim()) {
      setGoogleSheetsId(null);
      setSheetId(null);
      setSheetUrl(null);
      triggerFeedback('Google Sheet unlinked.');
      return;
    }
    setGoogleSheetsId(customSheetIdInput.trim());
    setSheetId(customSheetIdInput.trim());
    setSheetUrl(getGoogleSheetsUrl());
    triggerFeedback('Google Sheet ID saved successfully!');
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

        <button
          onClick={() => setActiveTab('google')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all duration-150
            ${activeTab === 'google' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }
          `}
        >
          <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-500" />
          <span>Google Sheets Sync</span>
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

      {/* Tab 4: Google Sheets Sync */}
      {activeTab === 'google' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-500" />
                <span>Google Sheets Integration Settings</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Establish a live-sync log of all your generated documents inside Google Sheets.
              </p>
            </div>

            {/* Connection Status */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Connection Status</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {googleToken ? 'Connected and authorized for Spreadsheet logging.' : 'Not connected. Authenticate to enable automatic spreadsheet logging.'}
                  </p>
                </div>

                {googleToken ? (
                  <button
                    onClick={handleGoogleDisconnect}
                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 hover:dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-200/40 transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {googleLoading ? (
                      <RefreshCw size={14} className="animate-spin text-blue-500" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.92 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.79C6.01 7.07 8.74 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.46c-.28 1.45-1.1 2.68-2.33 3.51l3.6 2.79c2.1-1.94 3.31-4.79 3.31-8.39z" />
                        <path fill="#FBBC05" d="M5.1 14.71c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.5 7.38C.54 9.31 0 11.48 0 13.8s.54 4.49 1.5 6.42l3.6-2.81z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1.1.74-2.5 1.18-4.36 1.18-3.26 0-5.99-2.03-6.98-5.25l-3.6 2.81C3.39 20.35 7.35 23 12 23z" />
                      </svg>
                    )}
                    <span>Connect Google Account</span>
                  </button>
                )}
              </div>

              {googleToken && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 animate-fade-in">
                  <CheckCircle size={14} className="shrink-0" />
                  <span>Google Account connected. Spreadsheet Logging is ready!</span>
                </div>
              )}
            </div>

            {/* Sheet setup section */}
            {googleToken && (
              <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Spreadsheet Selection</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose to create a brand new Google Sheet or link an existing Spreadsheet ID.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Create Auto */}
                  <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-4 bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                      <span className="inline-block bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">Recommended</span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">Create New Spreadsheet</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Automatically create a sheet named "DocGen Documents Log" with all required headers initialized.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateSheet}
                      disabled={creatingSheet}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer"
                    >
                      {creatingSheet ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Creating Sheet...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Create New Sheet</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option B: Manual Input */}
                  <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-4 bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">Custom Sheet</span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">Link Existing Spreadsheet ID</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Paste the Spreadsheet ID from any Google Sheet URL to append log rows to it.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customSheetIdInput}
                        onChange={(e) => setCustomSheetIdInput(e.target.value)}
                        placeholder="Spreadsheet ID (from URL)"
                        className="w-full p-2 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveCustomSheetId}
                        className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-[11px] py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Link Spreadsheet
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active sheet ID & link display */}
                {sheetId && (
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/40 dark:border-emerald-900/20 space-y-3 animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Linked Google Sheet ID</span>
                        <code className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{sheetId}</code>
                      </div>
                      
                      {sheetUrl && (
                        <a
                          href={sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold shrink-0"
                        >
                          <span>Open Sheet</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Log auto-sync is active. Any document you save from now on will append to this sheet!</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Guide card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
              <CloudLightning size={16} className="text-emerald-500" />
              <span>Real-time Log Benefits</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Connecting Google Sheets allows you to maintain central bookkeeping with zero extra effort:
              </p>

              <ul className="list-disc list-inside space-y-2.5">
                <li><strong>Automatic Records</strong>: Every document saved (Invoices, Quotations, and Work Orders) adds a descriptive log entry row.</li>
                <li><strong>Central Dashboard</strong>: View aggregate financial counts, dates, and statuses of all generated items directly in Google Drive.</li>
                <li><strong>Easy Sharing</strong>: Collaborate with accounting, tax professionals, or leadership by sharing the read-only or editable Sheet link.</li>
                <li><strong>Audit Ready</strong>: Download spreadsheets as Excel, PDF, or CSV formats instantly from your Google account.</li>
              </ul>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 mt-2">
                <HelpCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-500 leading-normal">
                  <strong>Access scope note:</strong> Your connection uses the secure <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded font-mono text-[10px]">drive.file</code> scope which restricts our app to accessing only the specific files created by this tool.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
