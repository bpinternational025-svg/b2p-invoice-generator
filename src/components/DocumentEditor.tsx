import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Calendar, 
  Sparkles, 
  FileText,
  Percent,
  Calculator,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/database';
import { numberToWords } from '../lib/numberToWords';
import { Company, Customer, Service, Document, DocumentItem, DocumentType, AppSettings } from '../types';
import { getAccessToken, appendDocumentToGoogleSheet } from '../lib/googleAuth';

export default function DocumentEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type') as DocumentType || 'invoice';

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Core Document State
  const [docId, setDocId] = useState<string>('');
  const [docType, setDocType] = useState<DocumentType>(queryType);
  const [companyId, setCompanyId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Table Items
  const [items, setItems] = useState<DocumentItem[]>([]);

  // Financial overrides
  const [discount, setDiscount] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [taxType, setTaxType] = useState<'None' | 'GST'>('GST');
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST' | 'Custom'>('CGST_SGST');
  const [customGstRate, setCustomGstRate] = useState<number>(18);
  const [terms, setTerms] = useState<string>('');
  const [status, setStatus] = useState<Document['status']>('Draft');

  // Interactive UI Helpers
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadEditorData() {
      try {
        const [comps, custs, servs, setts] = await Promise.all([
          db.getCompanies(),
          db.getCustomers(),
          db.getServices(),
          db.getSettings()
        ]);

        setCompanies(comps);
        setCustomers(custs);
        setServices(servs);
        setSettings(setts);

        if (id) {
          // Editing existing document
          const doc = await db.getDocumentById(id);
          if (doc) {
            setDocId(doc.id);
            setDocType(doc.type);
            setCompanyId(doc.companyId);
            setCustomerId(doc.customerId);
            setDocumentNumber(doc.documentNumber);
            setDate(doc.date);
            setDueDate(doc.dueDate);
            setReferenceNumber(doc.referenceNumber || '');
            setSubject(doc.subject || '');
            setNotes(doc.notes || '');
            setItems(doc.items);
            setDiscount(doc.discount);
            setAdditionalCharges(doc.additionalCharges);
            setTaxType(doc.taxType);
            setGstType(doc.gstType);
            setCustomGstRate(doc.customGstRate || comps.find(c => c.id === doc.companyId)?.taxRate || 18);
            setTerms(doc.terms || '');
            setStatus(doc.status);
            
            const docComp = comps.find(c => c.id === doc.companyId);
            if (docComp) setActiveCompany(docComp);
          } else {
            // Not found, redirect
            navigate('/documents');
          }
        } else {
          // Creating fresh new document
          const type = queryType;
          setDocId(crypto.randomUUID());
          setDocType(type);
          
          // Default selection to Company 1
          const defComp = comps[0];
          if (defComp) {
            setCompanyId(defComp.id);
            setActiveCompany(defComp);
            setTerms(defComp.terms || '');
            setCustomGstRate(defComp.taxRate || 18);
          }

          // Default selection to Customer 1
          if (custs[0]) setCustomerId(custs[0].id);

          // Default Dates
          const today = new Date().toISOString().split('T')[0];
          setDate(today);
          const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          setDueDate(futureDate);

          // Auto Document Number generation
          const runNum = await db.incrementRunningNumber(type);
          const prefix = type === 'invoice' ? setts.invoicePrefix : type === 'quotation' ? setts.quotationPrefix : setts.workOrderPrefix;
          const padNum = String(runNum).padStart(4, '0');
          setDocumentNumber(`${prefix}${padNum}`);

          // Seed single blank row
          setItems([{
            id: crypto.randomUUID(),
            particulars: '',
            rate: 0,
            qty: 1,
            total: 0
          }]);
        }
      } catch (err) {
        console.error('Error loading editor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditorData();
  }, [id, queryType]);

  // Handle active company change
  const handleCompanyChange = (id: string) => {
    setCompanyId(id);
    const comp = companies.find(c => c.id === id);
    if (comp) {
      setActiveCompany(comp);
      setTerms(comp.terms || '');
      setCustomGstRate(comp.taxRate || 18);
    }
  };

  // Re-calculate individual rows
  const handleItemRowChange = (rowId: string, field: keyof DocumentItem, value: any) => {
    setItems(items.map((item) => {
      if (item.id === rowId) {
        const updated = { ...item, [field]: value };
        if (field === 'rate' || field === 'qty') {
          updated.total = Number(updated.rate) * Number(updated.qty);
        }
        return updated;
      }
      return item;
    }));
  };

  // Pre-populate row from Service library selection
  const handleAddServiceToRow = (rowId: string, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setItems(items.map((item) => {
      if (item.id === rowId) {
        return {
          ...item,
          particulars: `${service.name} - ${service.description}`,
          rate: service.defaultRate,
          qty: 1,
          total: service.defaultRate
        };
      }
      return item;
    }));
  };

  // Row Manipulation features
  const addRow = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      particulars: '',
      rate: 0,
      qty: 1,
      total: 0
    }]);
  };

  const deleteRow = (rowId: string) => {
    if (items.length <= 1) return; // keep at least one row
    setItems(items.filter(i => i.id !== rowId));
  };

  const duplicateRow = (row: DocumentItem) => {
    const duplicated: DocumentItem = {
      ...row,
      id: crypto.randomUUID()
    };
    const idx = items.findIndex(i => i.id === row.id);
    const updated = [...items];
    updated.splice(idx + 1, 0, duplicated);
    setItems(updated);
  };

  const moveRow = (rowId: string, direction: 'up' | 'down') => {
    const index = items.findIndex(i => i.id === rowId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    // swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setItems(updated);
  };

  // Computed Financials
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRatePercent = taxType === 'GST' ? customGstRate : 0;
  const taxableAmount = Math.max(0, subtotal - discount + additionalCharges);
  const taxAmount = (taxableAmount * taxRatePercent) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const amountWordsText = numberToWords(grandTotal, activeCompany?.currency || 'INR');

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!companyId) errs.company = 'Selecting a company is required';
    if (!customerId) errs.customer = 'Selecting a customer is required';
    if (!documentNumber.trim()) errs.documentNumber = 'Document Number sequence is required';
    if (!subject.trim()) errs.subject = 'Document subject description is required';
    
    // validate items
    const emptyItem = items.some(i => !i.particulars.trim());
    if (emptyItem) errs.items = 'All rows must have valid particulars descriptions';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const savedDoc: Document = {
      id: docId,
      type: docType,
      companyId,
      customerId,
      documentNumber: documentNumber.trim(),
      date,
      dueDate,
      referenceNumber: referenceNumber.trim() || undefined,
      subject: subject.trim(),
      notes: notes.trim() || undefined,
      items,
      subtotal,
      discount,
      additionalCharges,
      taxType,
      gstType,
      customGstRate: taxType === 'GST' ? customGstRate : undefined,
      taxAmount,
      grandTotal,
      amountInWords: amountWordsText,
      terms: terms.trim() || undefined,
      status,
      // Pass display overrides directly from entity settings at the time of document creation/save
      showLetterhead: activeCompany?.showLetterhead ?? true,
      showFooter: activeCompany?.showFooter ?? true,
      showSignature: activeCompany?.showSignature ?? true,
      showBankDetails: activeCompany?.showBankDetails ?? true,
      showTerms: activeCompany?.showTerms ?? true,
      watermark: activeCompany?.watermark || undefined
    };

    try {
      await db.saveDocument(savedDoc);
      
      // Auto-sync to Google Sheets if connected
      let syncedFeedback = 'Document saved successfully!';
      const token = await getAccessToken();
      if (token) {
        try {
          const comp = companies.find(c => c.id === companyId);
          const cust = customers.find(cu => cu.id === customerId);
          await appendDocumentToGoogleSheet(
            token,
            savedDoc,
            comp?.name || 'Unknown Company',
            cust?.name || 'Unknown Customer'
          );
          syncedFeedback = 'Saved & Synced to Google Sheets!';
        } catch (sheetErr) {
          console.error('Google Sheets sync failed:', sheetErr);
          syncedFeedback = 'Saved locally (Sheets sync failed)';
        }
      }
      
      setFeedback(syncedFeedback);
      setTimeout(() => {
        setFeedback(null);
        navigate(`/documents/${docId}`); // Go straight to beautiful print preview page!
      }, 1200);
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Failed to save document. Please check database permissions.');
    }
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

  const colorBorderMap = {
    invoice: 'border-blue-600 focus:ring-blue-500/20 focus:border-blue-500',
    quotation: 'border-purple-600 focus:ring-purple-500/20 focus:border-purple-500',
    work_order: 'border-amber-600 focus:ring-amber-500/20 focus:border-amber-500'
  };

  const colorBadgeMap = {
    invoice: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    quotation: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    work_order: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="editor-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-sm shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {id ? 'Modify Document' : 'Draft New Document'}
              </h1>
              <span className={`text-xs px-2.5 py-1 font-extrabold uppercase rounded-lg tracking-wider ${colorBadgeMap[docType]}`}>
                {docType.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
              Standardized modular editor with auto GST percentages and terms.
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle size={14} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleFormSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Editor column - 9 Cols */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Metadata Grid (Company, Customer, sequence details) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Agreement Context</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Selected Company */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Building2 size={13} />
                  <span>Sender Entity *</span>
                </label>
                <select
                  required
                  value={companyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Corporate Sender --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.company && <p className="text-[10px] text-rose-500 mt-1">{errors.company}</p>}
              </div>

              {/* Selected Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User size={13} />
                  <span>Client / Recipient *</span>
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Recipient Client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                  ))}
                </select>
                {errors.customer && <p className="text-[10px] text-rose-500 mt-1">{errors.customer}</p>}
                <p className="text-[10px] text-slate-400 mt-1">Need a customer? Manage them in the sidebar.</p>
              </div>

              {/* Document sequence number */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document Number *</label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.documentNumber && <p className="text-[10px] text-rose-500 mt-1">{errors.documentNumber}</p>}
              </div>
            </div>

            {/* Dates sequence PO info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar size={13} />
                  <span>Issue Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar size={13} />
                  <span>{docType === 'invoice' ? 'Due Date *' : docType === 'quotation' ? 'Valid Until *' : 'Deadline Date *'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reference / PO Number (Optional)</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PO-77123 / Email request"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Subject heading */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Agreement Subject / Brief Description *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Phase 2 Cloud Infrastructure and backend API deployment"
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.subject && <p className="text-[10px] text-rose-500 mt-1">{errors.subject}</p>}
            </div>
          </div>

          {/* ITEM TABLE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Line Particulars Table</h3>
              
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-blue-100/20 transition shadow-sm shrink-0"
              >
                <Plus size={14} />
                <span>Add Row</span>
              </button>
            </div>

            {errors.items && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errors.items}</span>
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 space-y-3 relative group"
                >
                  {/* Top bar of row: Number and quick actions */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-lg">Row {index + 1}</span>
                      
                      {/* Catalog pre-populate dropdown */}
                      <select
                        onChange={(e) => handleAddServiceToRow(item.id, e.target.value)}
                        className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Apply Service Template --</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                        ))}
                      </select>
                    </div>

                    {/* Order up/down, duplicate, delete */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                      <button
                        type="button"
                        onClick={() => moveRow(item.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded transition"
                        title="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(item.id, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded transition"
                        title="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateRow(item)}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                        title="Duplicate Row"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(item.id)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition"
                        title="Delete Row"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Inputs layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Particulars description */}
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Particulars Description *</label>
                      <textarea
                        rows={1}
                        required
                        value={item.particulars}
                        onChange={(e) => handleItemRowChange(item.id, 'particulars', e.target.value)}
                        placeholder="Detailed deliverables description of works or hours..."
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-10"
                      />
                    </div>

                    {/* Rate */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Rate</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate || ''}
                        onChange={(e) => handleItemRowChange(item.id, 'rate', Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty / Days</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.qty || ''}
                        onChange={(e) => handleItemRowChange(item.id, 'qty', Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 h-10"
                      />
                    </div>

                    {/* Row Total */}
                    <div className="md:col-span-1.5 text-right">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm h-10 flex items-center justify-end px-2 bg-slate-100/50 dark:bg-slate-800 rounded-xl border border-slate-200/20">
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Summary under rows */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={addRow}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center gap-1 transition"
              >
                <Plus size={14} />
                <span>Add Row Particulars</span>
              </button>
            </div>
          </div>

          {/* Default terms and notes overrides */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-50 dark:border-slate-800 pb-3">Notes & Default Overrides</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Overrides company default terms..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Private Memo / Client Notes (Optional)</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Pre-agreed scope / project parameters..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar calculations column - 3 Cols */}
        <div className="lg:col-span-3 space-y-6 h-fit sticky top-6">
          
          {/* Status Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-50 dark:border-slate-800 pb-2">Status & Parameters</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document State</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Document['status'])}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Tax Module calculations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-50 dark:border-slate-800 pb-2">Tax Gating Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Configuration</label>
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/10">
                  <button
                    type="button"
                    onClick={() => setTaxType('None')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition
                      ${taxType === 'None' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }
                    `}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxType('GST')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition
                      ${taxType === 'GST' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }
                    `}
                  >
                    GST Enabled
                  </button>
                </div>
              </div>

              {taxType === 'GST' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Routing Type</label>
                    <select
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value as Document['gstType'])}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="CGST_SGST">Local Intra (CGST + SGST)</option>
                      <option value="IGST">Inter-State (IGST)</option>
                      <option value="Custom">Custom Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Percentage %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customGstRate}
                      onChange={(e) => setCustomGstRate(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pricing Ledger summary card */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <h3 className="font-bold text-sm border-b border-white/10 pb-2 text-white/90">Financial Ledger</h3>
            
            <div className="space-y-3 text-xs">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Subtotal:</span>
                <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Discount flat input */}
              <div className="flex items-center justify-between text-slate-400 gap-2">
                <span>Discount (Flat):</span>
                <div className="relative w-28 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Additional charges flat input */}
              <div className="flex items-center justify-between text-slate-400 gap-2">
                <span>Addl Charges:</span>
                <div className="relative w-28 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={additionalCharges || ''}
                    onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GST breakdown (CGST SGST IGST) */}
              {taxType === 'GST' && (
                <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400">
                  {gstType === 'CGST_SGST' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>CGST ({(customGstRate / 2).toFixed(1)}%):</span>
                        <span className="font-mono">₹{(taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SGST ({(customGstRate / 2).toFixed(1)}%):</span>
                        <span className="font-mono">₹{(taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{gstType === 'IGST' ? 'IGST' : 'Custom GST'} ({customGstRate}%):</span>
                      <span className="font-mono">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between text-white">
                  <span className="font-bold text-sm">Grand Total:</span>
                  <span className="font-mono font-black text-lg text-blue-400">
                    {activeCompany?.currency === 'INR' ? '₹' : activeCompany?.currency === 'USD' ? '$' : ''}
                    {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* Words */}
                <p className="text-[9px] text-slate-400 leading-normal text-right italic font-medium mt-1">
                  {amountWordsText}
                </p>
              </div>
            </div>
          </div>

          {/* Action trigger button */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-md shadow-blue-500/10 transition"
          >
            <Save size={16} />
            <span>Generate Document</span>
          </button>
        </div>
      </form>
    </div>
  );
}
