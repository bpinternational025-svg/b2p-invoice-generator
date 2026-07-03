import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Eye, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  X,
  RefreshCw,
  Printer
} from 'lucide-react';
import { db } from '../lib/database';
import { Document, Company, Customer } from '../types';

export default function DocumentList() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [docs, comps, custs] = await Promise.all([
          db.getDocuments(),
          db.getCompanies(),
          db.getCustomers()
        ]);
        setDocuments(docs);
        setCompanies(comps);
        setCustomers(custs);
      } catch (err) {
        console.error('Error loading documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document?')) return;
    try {
      await db.deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const duplicateDocument = async (doc: Document) => {
    try {
      const runningNum = await db.incrementRunningNumber(doc.type);
      const prefix = doc.type === 'invoice' ? 'INV-2026-' : doc.type === 'quotation' ? 'QT-2026-' : 'WO-2026-';
      const padNum = String(runningNum).padStart(4, '0');
      const newDocNum = `${prefix}${padNum}`;

      const duplicated: Document = {
        ...doc,
        id: crypto.randomUUID(),
        documentNumber: newDocNum,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft'
      };

      await db.saveDocument(duplicated);
      setDocuments([duplicated, ...documents]);
    } catch (err) {
      console.error('Error duplicating document:', err);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCompany('all');
    setSelectedCustomer('all');
    setSelectedStatus('all');
  };

  const formatCurrency = (val: number, currency: string = 'INR') => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
    return `${symbol}${val.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
  };

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const term = searchTerm.toLowerCase();
    
    // Search match
    const searchMatch = 
      doc.documentNumber.toLowerCase().includes(term) ||
      doc.subject?.toLowerCase().includes(term) ||
      doc.notes?.toLowerCase().includes(term);

    // Type match
    const typeMatch = selectedType === 'all' || doc.type === selectedType;

    // Company match
    const companyMatch = selectedCompany === 'all' || doc.companyId === selectedCompany;

    // Customer match
    const customerMatch = selectedCustomer === 'all' || doc.customerId === selectedCustomer;

    // Status match
    const statusMatch = selectedStatus === 'all' || doc.status === selectedStatus;

    return searchMatch && typeMatch && companyMatch && customerMatch && statusMatch;
  });

  const colorMap = {
    Draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    Sent: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    Approved: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    Paid: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    Expired: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="documents-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Documents History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Search, filter, edit, and duplicate Invoices, Quotations, and Work Orders.
          </p>
        </div>

        {/* Create Document Direct Link */}
        <button
          onClick={() => navigate('/documents/new?type=invoice')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition shrink-0"
        >
          <Plus size={16} />
          <span>Create Document</span>
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 transition duration-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by number, description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition h-10"
            />
          </div>

          {/* Doc Type Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-10"
            >
              <option value="all">All Document Types</option>
              <option value="invoice">Invoices</option>
              <option value="quotation">Quotations</option>
              <option value="work_order">Work Orders</option>
            </select>
          </div>

          {/* Company Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-10"
            >
              <option value="all">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-10"
            >
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-10"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Helper */}
        {(searchTerm || selectedType !== 'all' || selectedCompany !== 'all' || selectedCustomer !== 'all' || selectedStatus !== 'all') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold transition"
            >
              <X size={13} />
              <span>Reset Active Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Document History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition duration-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Doc Number</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                    <FileText size={44} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No Documents Found</p>
                    <p className="text-xs mt-1">Adjust filters or create your very first billing entry.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const comp = companies.find(c => c.id === doc.companyId);
                  const cust = customers.find(c => c.id === doc.customerId);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition duration-150">
                      {/* Document ID/Type */}
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{doc.documentNumber}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-extrabold tracking-wider mt-0.5">
                            {doc.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400">
                          <span>{doc.date}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Due: {doc.dueDate}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cust?.name || 'Customer'}</span>
                          {cust?.companyName && (
                            <span className="text-[10px] text-slate-400 mt-0.5">{cust.companyName}</span>
                          )}
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">{comp?.name || 'Company'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 font-bold uppercase rounded-lg tracking-wider ${colorMap[doc.status]}`}>
                          {doc.status}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap text-sm md:text-base">
                        {formatCurrency(doc.grandTotal, comp?.currency)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-100/60 dark:border-slate-800 max-w-max mx-auto shrink-0">
                          <button
                            onClick={() => navigate(`/documents/${doc.id}`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                            title="Print / View PDF"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/documents/${doc.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => duplicateDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
