import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Edit3, 
  Copy, 
  ArrowLeft, 
  Share2, 
  Eye, 
  Sparkles, 
  FileText, 
  Download,
  Building2,
  Lock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { db } from '../lib/database';
import { Document, Company, Customer } from '../types';

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Zoom control for A4 Previewer on desktop
  const [zoom, setZoom] = useState<number>(100);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocumentDetails() {
      if (!id) return;
      try {
        const doc = await db.getDocumentById(id);
        if (doc) {
          setDocument(doc);
          const [comps, custs] = await Promise.all([
            db.getCompanies(),
            db.getCustomers()
          ]);
          const comp = comps.find(c => c.id === doc.companyId) || comps[0];
          const cust = custs.find(c => c.id === doc.customerId) || custs[0];
          setCompany(comp);
          setCustomer(cust);
        } else {
          navigate('/documents');
        }
      } catch (err) {
        console.error('Error loading document detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocumentDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = async () => {
    if (!document) return;
    try {
      const runningNum = await db.incrementRunningNumber(document.type);
      const prefix = document.type === 'invoice' ? 'INV-2026-' : document.type === 'quotation' ? 'QT-2026-' : 'WO-2026-';
      const padNum = String(runningNum).padStart(4, '0');
      const newDocNum = `${prefix}${padNum}`;

      const duplicated: Document = {
        ...document,
        id: crypto.randomUUID(),
        documentNumber: newDocNum,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft'
      };

      await db.saveDocument(duplicated);
      triggerFeedback('Document duplicated! Redirecting...');
      setTimeout(() => navigate(`/documents/${duplicated.id}/edit`), 1200);
    } catch (err) {
      console.error('Error duplicating document:', err);
    }
  };

  const handleShare = () => {
    if (!document) return;
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    triggerFeedback('Shareable link copied to clipboard!');
  };

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const formatCurrency = (val: number, currency: string = 'INR') => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
    return `${symbol}${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  if (!document || !company || !customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Error: Document details could not be loaded from database.</p>
        <button onClick={() => navigate('/documents')} className="mt-4 text-blue-500 hover:underline">
          Back to list
        </button>
      </div>
    );
  }

  const isInv = document.type === 'invoice';
  const isQ = document.type === 'quotation';
  const labelMap = {
    invoice: 'Tax Invoice',
    quotation: 'Commercial Quotation',
    work_order: 'Work Service Order'
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto" id="detail-view">
      
      {/* Print Controls Top Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200/20"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document Previewer</span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-none mt-1">
              {document.documentNumber}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/10">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 px-1">{zoom}%</span>
            <button 
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => setZoom(100)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition"
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition h-10 shrink-0"
          >
            <Printer size={15} />
            <span>Print PDF</span>
          </button>

          <button
            onClick={() => navigate(`/documents/${document.id}/edit`)}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition h-10 shadow-sm shrink-0"
          >
            <Edit3 size={15} />
            <span>Edit</span>
          </button>

          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition h-10 shadow-sm shrink-0"
          >
            <Copy size={15} />
            <span>Duplicate</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition h-10 shadow-sm shrink-0"
          >
            <Share2 size={15} />
            <span>Share Link</span>
          </button>
        </div>

        {feedback && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle size={14} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* A4 PAPER AREA FOR HTML PREVIEW & SYSTEM BROWSER PRINTING */}
      <div className="flex justify-center overflow-x-auto p-4 bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 print:p-0 print:border-none print:bg-transparent print:rounded-none">
        
        {/* A4 Container Box */}
        <div 
          id="printable-document"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[20mm] shadow-xl relative select-text transition-transform duration-200 print:transform-none print:shadow-none print:p-0 print:w-full print:min-h-0 print:m-0"
        >
          
          {/* Watermark Diagonal Overlay if enabled */}
          {document.watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
              <span className="text-[120px] font-black tracking-widest text-slate-100/40 dark:text-slate-100/10 uppercase transform -rotate-45 leading-none">
                {document.watermark}
              </span>
            </div>
          )}

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[257mm] print:min-h-[297mm]">
            <div>
              {/* 1. Letterhead Image Banner (if enabled) */}
              {document.showLetterhead && company.letterheadUrl ? (
                <div className="w-full mb-6 shrink-0">
                  <img src={company.letterheadUrl} alt="Letterhead Banner" className="w-full h-auto max-h-36 object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                /* Pure HTML Corporate Header standard fallback */
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 pb-6 border-b border-slate-200/80">
                  {/* Sender Details */}
                  <div className="space-y-2">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="Logo" className="max-h-14 object-contain mb-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-blue-600 rounded"></span>
                        <span>{company.name}</span>
                      </div>
                    )}
                    <h2 className="font-extrabold text-slate-800 text-lg leading-tight">{company.name}</h2>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm whitespace-pre-line">{company.address}</p>
                    <div className="text-[9px] text-slate-400 space-y-0.5 pt-1">
                      {company.phone && <p>Ph: <span className="font-medium text-slate-600">{company.phone}</span></p>}
                      {company.mobile && <p>Mo: <span className="font-medium text-slate-600">{company.mobile}</span></p>}
                      {company.email && <p>Mail: <span className="font-medium text-slate-600">{company.email}</span></p>}
                      {company.website && <p>Web: <span className="font-medium text-slate-600">{company.website}</span></p>}
                    </div>
                  </div>

                  {/* Legal credentials & Doc Title */}
                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{labelMap[document.type]}</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight mt-1">{document.documentNumber}</span>
                    <div className="text-[9px] text-slate-400 text-right space-y-0.5 pt-2">
                      {company.gstNumber && <p>GSTIN: <span className="font-bold text-slate-700">{company.gstNumber}</span></p>}
                      {company.pan && <p>PAN No: <span className="font-bold text-slate-700">{company.pan}</span></p>}
                      {company.cin && <p>CIN No: <span className="font-bold text-slate-700">{company.cin}</span></p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Client & Document metadata block (dates, due dates) */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Billing details recipient */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bill To recipient</span>
                  <h3 className="font-bold text-slate-800 text-xs">{customer.name}</h3>
                  {customer.companyName && (
                    <p className="text-[10px] text-blue-600 font-semibold">{customer.companyName}</p>
                  )}
                  <p className="text-[9px] text-slate-500 leading-normal max-w-xs whitespace-pre-line pt-1">{customer.address}</p>
                  <div className="text-[9px] text-slate-400 space-y-0.5 pt-1.5">
                    {customer.mobile && <p>Mobile: <span className="font-semibold text-slate-600">{customer.mobile}</span></p>}
                    {customer.email && <p>Email: <span className="font-semibold text-slate-600">{customer.email}</span></p>}
                    {customer.gstNumber && <p>Client GSTIN: <span className="font-bold text-slate-700">{customer.gstNumber}</span></p>}
                  </div>
                </div>

                {/* Agreement metadata */}
                <div className="text-right space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Agreement Details</span>
                  <div className="text-[10px] space-y-1 pt-1 text-slate-600">
                    <p>Issue Date: <span className="font-bold text-slate-800">{document.date}</span></p>
                    <p>{isInv ? 'Due Date:' : isQ ? 'Valid Until:' : 'Deadline Date:'} <span className="font-bold text-slate-800">{document.dueDate}</span></p>
                    {document.referenceNumber && (
                      <p>PO / Ref No: <span className="font-bold text-slate-800">{document.referenceNumber}</span></p>
                    )}
                    <p>Currency: <span className="font-bold text-slate-800">{company.currency} ({company.currency === 'INR' ? '₹' : company.currency === 'USD' ? '$' : ''})</span></p>
                  </div>
                </div>
              </div>

              {/* Subject description */}
              {document.subject && (
                <div className="mb-6 p-3.5 bg-slate-50 border-l-2 border-blue-600 rounded-r-xl">
                  <span className="text-[8px] uppercase font-extrabold text-blue-600 tracking-widest block mb-0.5">Subject / Engagement description</span>
                  <p className="text-[11px] font-bold text-slate-800 leading-snug">{document.subject}</p>
                </div>
              )}

              {/* 3. Main Particulars Table */}
              <table className="w-full text-left text-[10px] mb-8 border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wide">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Particulars & Deliverables</th>
                    <th className="py-2.5 px-3 text-right w-24">Rate</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty/Days</th>
                    <th className="py-2.5 px-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {document.items.map((item, idx) => (
                    <tr key={item.id} className="text-slate-700">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 leading-relaxed whitespace-pre-line max-w-sm">{item.particulars}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.rate, company.currency)}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">{item.qty}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatCurrency(item.total, company.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 4. Financial calculations ledger split columns */}
              <div className="grid grid-cols-12 gap-8 mb-8 items-start">
                
                {/* Left column: terms, words, QR code */}
                <div className="col-span-7 space-y-4">
                  {/* Words */}
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Amount in Words</span>
                    <p className="text-[10px] font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                      {document.amountInWords}
                    </p>
                  </div>

                  {/* Terms box */}
                  {document.showTerms && document.terms && (
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Terms & Conditions</span>
                      <p className="text-[9px] text-slate-500 whitespace-pre-line leading-relaxed max-w-md bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {document.terms}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right column: ledger subtotals */}
                <div className="col-span-5 space-y-2 text-right text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(document.subtotal, company.currency)}</span>
                  </div>

                  {document.discount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Discount (Flat):</span>
                      <span className="font-mono text-rose-600">- {formatCurrency(document.discount, company.currency)}</span>
                    </div>
                  )}

                  {document.additionalCharges > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Addl Charges:</span>
                      <span className="font-mono text-emerald-600">+ {formatCurrency(document.additionalCharges, company.currency)}</span>
                    </div>
                  )}

                  {document.taxType === 'GST' && (
                    <div className="pt-1.5 border-t border-slate-100 space-y-1">
                      {document.gstType === 'CGST_SGST' ? (
                        <>
                          <div className="flex justify-between text-slate-400">
                            <span>CGST ({((document.customGstRate || company.taxRate) / 2).toFixed(1)}%):</span>
                            <span className="font-mono">{formatCurrency(document.taxAmount / 2, company.currency)}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>SGST ({((document.customGstRate || company.taxRate) / 2).toFixed(1)}%):</span>
                            <span className="font-mono">{formatCurrency(document.taxAmount / 2, company.currency)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-slate-400">
                          <span>{document.gstType === 'IGST' ? 'IGST' : 'GST'} ({document.customGstRate || company.taxRate}%):</span>
                          <span className="font-mono">{formatCurrency(document.taxAmount, company.currency)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3.5 border-t border-slate-300 flex justify-between text-slate-900 font-black">
                    <span className="text-xs uppercase">Grand Total:</span>
                    <span className="text-sm font-mono text-blue-600">
                      {formatCurrency(document.grandTotal, company.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Footer: signature QR code and Bank remittance banners */}
            <div className="shrink-0 space-y-6">
              {/* Remittance & Sign block */}
              <div className="grid grid-cols-12 gap-8 border-t border-slate-100 pt-6 items-end">
                {/* Remittance block */}
                <div className="col-span-8 flex gap-4 items-center">
                  {document.showBankDetails && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] uppercase font-black text-slate-400 tracking-wider">Remittance / Bank Details</span>
                      <div className="text-[9px] text-slate-500 leading-normal space-y-0.5">
                        <p>A/C Name: <span className="font-semibold text-slate-700">{company.accountName}</span></p>
                        <p>Bank: <span className="font-semibold text-slate-700">{company.bankName}</span></p>
                        <p>A/C No: <span className="font-mono font-bold text-slate-800">{company.accountNumber}</span></p>
                        <p>IFSC Code: <span className="font-mono font-bold text-slate-800">{company.ifsc}</span></p>
                        <p>Branch: <span className="font-semibold text-slate-700">{company.branch}</span></p>
                        {company.swift && <p>SWIFT Code: <span className="font-mono text-slate-600">{company.swift}</span></p>}
                        {company.upiId && <p>UPI ID: <span className="font-mono text-blue-600">{company.upiId}</span></p>}
                      </div>
                    </div>
                  )}

                  {/* QR code logo if enabled */}
                  {document.showBankDetails && company.qrCodeUrl && (
                    <div className="p-1 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                      <img src={company.qrCodeUrl} alt="Bank QR" className="w-20 h-20 object-contain" referrerPolicy="no-referrer" />
                      <span className="block text-[7px] text-slate-400 text-center font-bold uppercase tracking-wide mt-1">Scan to Pay</span>
                    </div>
                  )}
                </div>

                {/* Signature Block */}
                <div className="col-span-4 text-right flex flex-col items-end justify-end space-y-1 h-full min-h-24">
                  {document.showSignature && company.signatureUrl ? (
                    <div className="mb-1">
                      <img src={company.signatureUrl} alt="Auth Signature" className="max-h-14 object-contain max-w-44" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="h-12 border-b border-dashed border-slate-300 w-36 mb-2"></div>
                  )}
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Authorized Signatory</span>
                  <span className="text-[9px] font-bold text-slate-700">{company.name}</span>
                </div>
              </div>

              {/* 6. Letterhead Footer Banner Overlay (if enabled) */}
              {document.showFooter && company.footerUrl && (
                <div className="w-full mt-4 shrink-0 border-t border-slate-100 pt-3">
                  <img src={company.footerUrl} alt="Letterhead Footer Banner" className="w-full h-auto max-h-16 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
