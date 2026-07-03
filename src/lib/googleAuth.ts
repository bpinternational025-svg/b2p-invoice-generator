import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Document } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth Provider
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in to Firebase but token is not in memory, we might need a re-auth/login click.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    
    // Store that we have a Google session (just as a boolean/flag, not the token)
    localStorage.setItem('dg_google_connected', 'true');
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('dg_google_connected');
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('dg_google_connected', 'true');
  } else {
    localStorage.removeItem('dg_google_connected');
  }
};

export const hasAccessToken = (): boolean => {
  return cachedAccessToken !== null;
};

// Spreadsheet ID management
export const getGoogleSheetsId = (): string | null => {
  return localStorage.getItem('dg_google_spreadsheet_id');
};

export const setGoogleSheetsId = (id: string | null) => {
  if (id) {
    localStorage.setItem('dg_google_spreadsheet_id', id);
  } else {
    localStorage.removeItem('dg_google_spreadsheet_id');
  }
};

export const getGoogleSheetsUrl = (): string | null => {
  const id = getGoogleSheetsId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
};

// CREATE A NEW SPREADSHEET
export const createGoogleSheet = async (accessToken: string): Promise<{ id: string; url: string }> => {
  try {
    // 1. Create Spreadsheet
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: 'DocGen Documents Log'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets creation failed: ${errText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl;

    // 2. Initialize Headers
    const headers = [
      'Document ID',
      'Date',
      'Due Date',
      'Document Number',
      'Type',
      'Company Name',
      'Customer Name',
      'Subject',
      'Subtotal',
      'Tax Amount',
      'Grand Total',
      'Status',
      'Synced At'
    ];

    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:M1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: 'Sheet1!A1:M1',
          majorDimension: 'ROWS',
          values: [headers]
        })
      }
    );

    if (!appendResponse.ok) {
      console.warn('Could not initialize Google Sheet headers. Trying default Sheet1 range.');
    }

    setGoogleSheetsId(spreadsheetId);
    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
};

// APPEND DOCUMENT TO SPREADSHEET
export const appendDocumentToGoogleSheet = async (
  accessToken: string,
  doc: Document,
  companyName: string,
  customerName: string
): Promise<boolean> => {
  try {
    let spreadsheetId = getGoogleSheetsId();
    
    // Create sheet if we don't have one cached
    if (!spreadsheetId) {
      const sheet = await createGoogleSheet(accessToken);
      spreadsheetId = sheet.id;
    }

    const formattedRow = [
      doc.id,
      doc.date,
      doc.dueDate,
      doc.documentNumber,
      doc.type.toUpperCase().replace('_', ' '),
      companyName,
      customerName,
      doc.subject || 'N/A',
      doc.subtotal,
      doc.taxAmount,
      doc.grandTotal,
      doc.status,
      new Date().toLocaleString()
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:M:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: 'Sheet1!A:M',
          majorDimension: 'ROWS',
          values: [formattedRow]
        })
      }
    );

    if (!response.ok) {
      // If it failed because of 404 (spreadsheet not found/deleted), let's clear cached ID and recreate
      if (response.status === 404) {
        console.warn('Cached spreadsheet not found. Creating a new one...');
        setGoogleSheetsId(null);
        return appendDocumentToGoogleSheet(accessToken, doc, companyName, customerName);
      }
      const errText = await response.text();
      throw new Error(`Google Sheets append failed: ${errText}`);
    }

    return true;
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    throw error;
  }
};
