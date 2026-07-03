import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Briefcase, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  FileCheck, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  Printer,
  Copy
} from 'lucide-react';
import { db } from '../lib/database';
import { Document, Company } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [docs, comps] = await Promise.all([
          db.getDocuments(),
          db.getCompanies()
        ]);
        setDocuments(docs);
        setCompanies(comps);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute Metrics
  const invoices = documents.filter(d => d.type === 'invoice');
  const quotations = documents.filter(d => d.type === 'quotation');
  const workOrders = documents.filter(d => d.type === 'work_order');

  const totalInvoicesCount = invoices.length;
  const totalQuotationsCount = quotations.length;
  const totalWorkOrdersCount = workOrders.length;

  const totalRevenue = invoices
    .filter(d => d.status === 'Paid')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  const pendingRevenue = invoices
    .filter(d => d.status === 'Sent' || d.status === 'Draft')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  const recentDocuments = documents.slice(0, 5);

  const formatCurrency = (val: number, currency: string = 'INR') => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
    return `${symbol}${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const duplicateDocument = async (doc: Document) => {
    const runningNum = await db.incrementRunningNumber(doc.type);
    const company = companies.find(c => c.id === doc.companyId) || companies[0];
    const prefix = doc.type === 'invoice' ? 'INV-2026-' : doc.type === 'quotation' ? 'QT-2026-' : 'WO-2026-';
    const padNum = String(runningNum).padStart(4, '0');
    const newDocNum = `${prefix}${padNum}`;

    const duplicated: Document = {
      ...doc,
      id: crypto.randomUUID(),
      documentNumber: newDocNum,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
      status: 'Draft'
    };

    await db.saveDocument(duplicated);
    setDocuments([duplicated, ...documents]);
  };

  const filteredRecentDocs = recentDocuments.filter(doc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.documentNumber.toLowerCase().includes(term) ||
      doc.subject?.toLowerCase().includes(term) ||
      doc.grandTotal.toString().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse" id="loading-dashboard">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl lg:col-span-2" />
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="dashboard-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Welcome back!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Here's a breakdown of your multi-company business operations.
          </p>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/documents/new?type=invoice')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition"
          >
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={() => navigate('/documents/new?type=quotation')}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            <span>Quotation</span>
          </button>
          <button
            onClick={() => navigate('/documents/new?type=work_order')}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            <span>Work Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/15 border border-blue-400/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Revenue (Paid)</span>
            <div className="p-2 bg-white/10 rounded-xl">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-black">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-blue-100/80 mt-2 flex items-center gap-1">
            <TrendingUp size={14} />
            <span>Successfully cleared receipts</span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoices</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <FileCheck size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalInvoicesCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Pending receivable: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{formatCurrency(pendingRevenue)}</strong>
          </div>
        </div>

        {/* Total Quotations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quotations</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <Clock size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalQuotationsCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Active proposals awaiting approval
          </div>
        </div>

        {/* Total Work Orders */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Work Orders</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Briefcase size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalWorkOrdersCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Active deliverable service agreements
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents list - 2 Cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Recent Documents</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick oversight of your most recently processed agreements.</p>
            </div>
            
            {/* Simple Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search recent..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredRecentDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold">No documents found</p>
                <p className="text-xs mt-1">Create a new document to get started!</p>
              </div>
            ) : (
              filteredRecentDocs.map((doc) => {
                const isInv = doc.type === 'invoice';
                const isQ = doc.type === 'quotation';
                const comp = companies.find(c => c.id === doc.companyId);
                const colorMap = {
                  Draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                  Sent: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
                  Approved: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
                  Paid: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
                  Expired: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                };

                return (
                  <div key={doc.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-150">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isInv ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' :
                        isQ ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' :
                        'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {doc.documentNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-lg tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {doc.type.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-lg tracking-wider ${colorMap[doc.status]}`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {doc.subject || 'No subject description'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Date: <span className="font-semibold">{doc.date}</span> &bull; Co: <span className="font-semibold">{comp?.name || 'Company'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="font-black text-slate-800 dark:text-slate-100 text-base">
                          {formatCurrency(doc.grandTotal, comp?.currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Includes taxes/discounts</p>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                          title="View PDF"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/documents/${doc.id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                          title="Edit Document"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => duplicateDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {documents.length > 5 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <button
                onClick={() => navigate('/documents')}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition"
              >
                <span>View All {documents.length} Documents</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar/Bento Info Section */}
        <div className="space-y-6">
          {/* Quick Stats Overview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm transition-colors duration-200">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Company Coverage</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Manage details and settings for your two operational entities.</p>
            
            <div className="space-y-4">
              {companies.map((comp) => {
                const compDocs = documents.filter(d => d.companyId === comp.id);
                const revenue = compDocs.filter(d => d.type === 'invoice' && d.status === 'Paid').reduce((sum, d) => sum + d.grandTotal, 0);

                return (
                  <div key={comp.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{comp.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold uppercase rounded-lg">
                        {comp.currency}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Total Generated Docs:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{compDocs.length}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Paid Revenue:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue, comp.currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl transform translate-x-4 -translate-y-4" />
            <h3 className="font-bold text-base mb-1">System Health</h3>
            <p className="text-xs text-slate-400 mb-4">Need to move your tables to the cloud?</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You can get the fully generated SQL database schemas inside Settings. Simply copy and execute them in your Supabase SQL editor.
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs py-2.5 rounded-xl transition"
            >
              <span>View Database SQL Schema</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
