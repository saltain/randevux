import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import { db } from './firebase';

interface SheetsSettings {
  connected: boolean;
  spreadsheetId?: string;
  sheetName?: string;
  mappings: Record<string, string>;
  mode: 'otomatik' | 'manuel';
}

const serviceAccountEmail = functions.params.defineString('GOOGLE_SERVICE_ACCOUNT_EMAIL', {
  default: ''
});

const serviceAccountKey = functions.params.defineString('GOOGLE_SERVICE_ACCOUNT_KEY', {
  default: ''
});

const collectionRef = db.collection('settings').doc('googleSheets');

const getJwtClient = () => {
  const email = serviceAccountEmail.value();
  const key = serviceAccountKey.value();

  if (!email || !key) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Google Sheets entegrasyonu için servis hesabı kimlik bilgileri gereklidir.'
    );
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
};

export const getSheetsSettings = async (): Promise<SheetsSettings> => {
  const snap = await collectionRef.get();
  return {
    connected: false,
    mappings: {},
    mode: 'otomatik',
    ...(snap.exists ? snap.data() : {})
  } as SheetsSettings;
};

export const saveSheetsSettings = async (settings: SheetsSettings) => {
  await collectionRef.set(settings, { merge: true });
};

export const connectSheets = async () => {
  const settings = await getSheetsSettings();
  if (!settings.connected) {
    settings.connected = true;
  }
  await saveSheetsSettings(settings);
  return settings;
};

export const listSheetColumns = async (settings: SheetsSettings): Promise<string[]> => {
  if (!settings.spreadsheetId || !settings.sheetName) {
    return [];
  }

  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: settings.spreadsheetId,
    range: `${settings.sheetName}!1:1`
  });

  const [headerRow] = response.data.values ?? [[]];
  return headerRow as string[];
};

export const appendAppointmentRow = async (
  settings: SheetsSettings,
  row: Record<string, string>
) => {
  if (!settings.connected || settings.mode !== 'otomatik') {
    return;
  }

  if (!settings.spreadsheetId || !settings.sheetName) {
    console.warn('Sheet ayarları eksik, satır eklenemedi.');
    return;
  }

  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const columnOrder = Object.entries(settings.mappings);
  const values = [columnOrder.map(([key]) => row[key] ?? '')];

  await sheets.spreadsheets.values.append({
    spreadsheetId: settings.spreadsheetId,
    range: settings.sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values
    }
  });
};
