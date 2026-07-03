import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Company, Customer, Service, Document, AppSettings, UserProfile } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export function isSupabaseConnected(): boolean {
  return supabase !== null;
}

// ============================================================================
// MOCK DATA SEEDING (For Local Storage fallback and Initial State)
// ============================================================================

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'company-1',
    name: 'Apex Solutions Pvt Ltd',
    address: '101, Tech Park, Sector V, Salt Lake, Kolkata, WB, 700091',
    phone: '+91 33 2345 6789',
    mobile: '+91 98300 12345',
    email: 'billing@apexsolutions.com',
    website: 'www.apexsolutions.com',
    gstNumber: '19AAACA1234A1Z1',
    pan: 'AAACA1234A',
    cin: 'U72200WB2018PTC224567',
    currency: 'INR',
    bankName: 'HDFC Bank',
    accountName: 'Apex Solutions Private Limited',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0000123',
    branch: 'Salt Lake Sector V',
    swift: 'HDFCINBBXXX',
    upiId: 'apexsolutions@hdfc',
    terms: '1. Payment is due within 15 days of invoice date.\n2. Interest of 12% per annum will be charged on late payments.\n3. Goods once sold will not be taken back.',
    taxRate: 18,
    showLetterhead: true,
    showFooter: true,
    showSignature: true,
    showBankDetails: true,
    showTerms: true,
    watermark: 'ORIGINAL'
  },
  {
    id: 'company-2',
    name: 'ByteCraft Consulting Inc',
    address: 'Suite 404, Innovation Hub, MG Road, Bengaluru, KA, 560001',
    phone: '+91 80 4123 4567',
    mobile: '+91 99000 54321',
    email: 'accounts@bytecraft.io',
    website: 'www.bytecraft.io',
    gstNumber: '29AABCB5678B2Z2',
    pan: 'AABCB5678B',
    cin: 'U72900KA2020PTC135790',
    currency: 'USD',
    bankName: 'ICICI Bank',
    accountName: 'ByteCraft Consulting Inc',
    accountNumber: '000205123456',
    ifsc: 'ICIC0000002',
    branch: 'MG Road Bengaluru',
    swift: 'ICICINBBXXX',
    upiId: 'bytecraft@icici',
    terms: '1. 50% advance, remaining on completion.\n2. Invoices are subject to local taxes if applicable.\n3. Support is provided for 30 days post-delivery.',
    taxRate: 18,
    showLetterhead: true,
    showFooter: true,
    showSignature: true,
    showBankDetails: true,
    showTerms: true,
    watermark: 'CONFIDENTIAL'
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Kshitiz Sharma',
    companyName: 'Zephyr Technologies LLC',
    address: '45, Koramangala 8th Block, Bengaluru, KA, 560095',
    gstNumber: '29ABCDE1234E1Z0',
    contactPerson: 'Kshitiz Sharma (CEO)',
    mobile: '+91 98765 43210',
    email: 'kshitiz@zephyrtech.com',
    notes: 'Preferred client. Demands clean documentation.'
  },
  {
    id: 'cust-2',
    name: 'Sarah Jenkins',
    companyName: 'Velocity Digital Ltd',
    address: '12th Floor, Trade Tower, Bandra Kurla Complex, Mumbai, MH, 400051',
    gstNumber: '27AABC9999X1Z2',
    contactPerson: 'Sarah Jenkins (Finance Director)',
    mobile: '+91 91234 56789',
    email: 'finance@velocitydigital.io',
    notes: 'Requires swift routing of work orders.'
  }
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'serv-1',
    name: 'Full Stack Web Development',
    description: 'Design, development, and deployment of reactive full-stack web applications using React, Node.js, and Cloud services.',
    defaultRate: 5000,
    unit: 'Hours'
  },
  {
    id: 'serv-2',
    name: 'Cloud Infrastructure Setup',
    description: 'Architecture design, Terraform scripting, and deployment of Kubernetes/Docker instances on AWS, GCP, or Azure.',
    defaultRate: 75000,
    unit: 'Fixed'
  },
  {
    id: 'serv-3',
    name: 'Dedicated Consulting Engagements',
    description: 'Senior enterprise architecture review and technology advisory services, scheduled on weekly/monthly sprints.',
    defaultRate: 150000,
    unit: 'Months'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  invoicePrefix: 'INV-2026-',
  invoiceNextNumber: 1,
  quotationPrefix: 'QT-2026-',
  quotationNextNumber: 1,
  workOrderPrefix: 'WO-2026-',
  workOrderNextNumber: 1,
  theme: 'light'
};

// Initialize localStorage if empty
function initializeLocalStorage() {
  if (!localStorage.getItem('dg_companies')) {
    localStorage.setItem('dg_companies', JSON.stringify(DEFAULT_COMPANIES));
  }
  if (!localStorage.getItem('dg_customers')) {
    localStorage.setItem('dg_customers', JSON.stringify(DEFAULT_CUSTOMERS));
  }
  if (!localStorage.getItem('dg_services')) {
    localStorage.setItem('dg_services', JSON.stringify(DEFAULT_SERVICES));
  }
  if (!localStorage.getItem('dg_settings')) {
    localStorage.setItem('dg_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('dg_documents')) {
    localStorage.setItem('dg_documents', JSON.stringify([]));
  }
}

// Run immediately
initializeLocalStorage();

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

export const db = {
  // --------------------------------------------------------------------------
  // COMPANIES (Support exactly 2 companies, seeded at startup)
  // --------------------------------------------------------------------------
  async getCompanies(): Promise<Company[]> {
    if (supabase) {
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (!error && data && data.length > 0) return data as Company[];
    }
    // Fallback to LocalStorage
    return JSON.parse(localStorage.getItem('dg_companies') || '[]');
  },

  async updateCompany(company: Company): Promise<Company> {
    if (supabase) {
      const { data, error } = await supabase
        .from('companies')
        .upsert(company)
        .select()
        .single();
      if (!error && data) return data as Company;
    }
    // Fallback to LocalStorage
    const companies = await this.getCompanies();
    const updated = companies.map(c => c.id === company.id ? company : c);
    localStorage.setItem('dg_companies', JSON.stringify(updated));
    return company;
  },

  // --------------------------------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------------------------------
  async getCustomers(): Promise<Customer[]> {
    if (supabase) {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (!error && data) return data as Customer[];
    }
    return JSON.parse(localStorage.getItem('dg_customers') || '[]');
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .upsert(customer)
        .select()
        .single();
      if (!error && data) return data as Customer;
    }
    const customers = await this.getCustomers();
    const exists = customers.find(c => c.id === customer.id);
    let updated;
    if (exists) {
      updated = customers.map(c => c.id === customer.id ? customer : c);
    } else {
      updated = [...customers, customer];
    }
    localStorage.setItem('dg_customers', JSON.stringify(updated));
    return customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) return true;
    }
    const customers = await this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem('dg_customers', JSON.stringify(filtered));
    return true;
  },

  // --------------------------------------------------------------------------
  // SERVICES
  // --------------------------------------------------------------------------
  async getServices(): Promise<Service[]> {
    if (supabase) {
      const { data, error } = await supabase.from('services').select('*').order('name');
      if (!error && data) return data as Service[];
    }
    return JSON.parse(localStorage.getItem('dg_services') || '[]');
  },

  async saveService(service: Service): Promise<Service> {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .upsert(service)
        .select()
        .single();
      if (!error && data) return data as Service;
    }
    const services = await this.getServices();
    const exists = services.find(s => s.id === service.id);
    let updated;
    if (exists) {
      updated = services.map(s => s.id === service.id ? service : s);
    } else {
      updated = [...services, service];
    }
    localStorage.setItem('dg_services', JSON.stringify(updated));
    return service;
  },

  async deleteService(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (!error) return true;
    }
    const services = await this.getServices();
    const filtered = services.filter(s => s.id !== id);
    localStorage.setItem('dg_services', JSON.stringify(filtered));
    return true;
  },

  // --------------------------------------------------------------------------
  // SETTINGS
  // --------------------------------------------------------------------------
  async getSettings(): Promise<AppSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) return data as AppSettings;
    }
    return JSON.parse(localStorage.getItem('dg_settings') || JSON.stringify(DEFAULT_SETTINGS));
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    if (supabase) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 'global_settings', ...settings })
        .select()
        .single();
      if (!error && data) return data as AppSettings;
    }
    localStorage.setItem('dg_settings', JSON.stringify(settings));
    return settings;
  },

  // Increment Running Number for a document type
  async incrementRunningNumber(type: 'invoice' | 'quotation' | 'work_order'): Promise<number> {
    const settings = await this.getSettings();
    let currentNumber = 1;
    if (type === 'invoice') {
      currentNumber = settings.invoiceNextNumber;
      settings.invoiceNextNumber += 1;
    } else if (type === 'quotation') {
      currentNumber = settings.quotationNextNumber;
      settings.quotationNextNumber += 1;
    } else if (type === 'work_order') {
      currentNumber = settings.workOrderNextNumber;
      settings.workOrderNextNumber += 1;
    }
    await this.saveSettings(settings);
    return currentNumber;
  },

  // --------------------------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------------------------
  async getDocuments(): Promise<Document[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data) return data as Document[];
    }
    return JSON.parse(localStorage.getItem('dg_documents') || '[]');
  },

  async getDocumentById(id: string): Promise<Document | null> {
    const docs = await this.getDocuments();
    return docs.find(d => d.id === id) || null;
  },

  async saveDocument(document: Document): Promise<Document> {
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .upsert(document)
        .select()
        .single();
      if (!error && data) return data as Document;
    }
    const docs = await this.getDocuments();
    const exists = docs.find(d => d.id === document.id);
    let updated;
    if (exists) {
      updated = docs.map(d => d.id === document.id ? document : d);
    } else {
      updated = [document, ...docs];
    }
    localStorage.setItem('dg_documents', JSON.stringify(updated));
    return document;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (!error) return true;
    }
    const docs = await this.getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem('dg_documents', JSON.stringify(filtered));
    return true;
  },

  // --------------------------------------------------------------------------
  // IMAGES / STORAGE UPLOADS
  // --------------------------------------------------------------------------
  async uploadImage(file: File, bucket: string = 'company-assets'): Promise<string> {
    if (supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    }

    // Fallback: Convert to base64 Data URL so it is fully persistent in local storage!
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
};

// SQL DDL generator script helper for the settings page copy-paste
export const SUPABASE_SQL_SCRIPT = `-- SUPABASE TABLE SCHEMAS FOR DOCUMENT GENERATOR
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO INITIALIZE THE DATABASE

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. COMPANIES TABLE
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logoUrl text,
  letterheadUrl text,
  footerUrl text,
  signatureUrl text,
  qrCodeUrl text,
  address text not null,
  phone text,
  mobile text,
  email text,
  website text,
  gstNumber text,
  pan text,
  cin text,
  currency text default 'INR',
  bankName text,
  accountName text,
  accountNumber text,
  ifsc text,
  branch text,
  swift text,
  upiId text,
  terms text,
  taxRate numeric default 18,
  showLetterhead boolean default true,
  showFooter boolean default true,
  showSignature boolean default true,
  showBankDetails boolean default true,
  showTerms boolean default true,
  watermark text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CUSTOMERS TABLE
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  companyName text,
  address text not null,
  gstNumber text,
  contactPerson text,
  mobile text,
  email text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SERVICES TABLE
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  defaultRate numeric not null,
  unit text not null check (unit in ('Days', 'Hours', 'Months', 'Quantity', 'Fixed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SETTINGS TABLE
create table if not exists settings (
  id text primary key default 'global_settings',
  invoicePrefix text default 'INV-2026-',
  invoiceNextNumber integer default 1,
  quotationPrefix text default 'QT-2026-',
  quotationNextNumber integer default 1,
  workOrderPrefix text default 'WO-2026-',
  workOrderNextNumber integer default 1,
  theme text default 'light',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. DOCUMENTS TABLE
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('invoice', 'quotation', 'work_order')),
  companyId text not null,
  customerId text not null,
  documentNumber text not null unique,
  date date not null,
  dueDate date not null,
  referenceNumber text,
  subject text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  additionalCharges numeric not null default 0,
  taxType text not null default 'GST' check (taxType in ('None', 'GST')),
  gstType text not null default 'CGST_SGST' check (gstType in ('CGST_SGST', 'IGST', 'Custom')),
  customGstRate numeric,
  taxAmount numeric not null default 0,
  grandTotal numeric not null default 0,
  amountInWords text,
  terms text,
  showLetterhead boolean default true,
  showFooter boolean default true,
  showSignature boolean default true,
  showBankDetails boolean default true,
  showTerms boolean default true,
  watermark text,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Approved', 'Paid', 'Expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table companies enable row level security;
alter table customers enable row level security;
alter table services enable row level security;
alter table settings enable row level security;
alter table documents enable row level security;

-- Create basic access policies (Public or Authenticated as needed)
create policy "Allow all operations for public users" on companies for all using (true);
create policy "Allow all operations for public users" on customers for all using (true);
create policy "Allow all operations for public users" on services for all using (true);
create policy "Allow all operations for public users" on settings for all using (true);
create policy "Allow all operations for public users" on documents for all using (true);

-- Create Storage Bucket
-- Make sure to create a public storage bucket named 'company-assets' in Supabase Storage dashboard
`;
