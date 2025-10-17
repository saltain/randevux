import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';

interface SheetsState {
  connected: boolean;
  spreadsheetId?: string;
  sheetName?: string;
  mappings: Record<string, string>;
  mode: 'otomatik' | 'manuel';
}

const GoogleSheets = () => {
  const { callFunction } = useFirebase();
  const [state, setState] = useState<SheetsState>({ connected: false, mappings: {}, mode: 'otomatik' });
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    callFunction<SheetsState>('getSheetsSettings').then((data) => {
      setState({ connected: false, mappings: {}, mode: 'otomatik', ...data });
      if (data.sheetName) {
        callFunction<string[]>('listSheetColumns', data).then(setColumns);
      }
    });
  }, [callFunction]);

  const connect = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await callFunction<SheetsState>('connectSheets');
      setState(result);
      setMessage('Google Sheets bağlantısı doğrulandı.');
    } catch (error) {
      console.error(error);
      setMessage('Bağlantı kurulamadı. Kimlik bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    setMessage('');
    try {
      await callFunction('saveSheetsSettings', state);
      setMessage('Ayarlar başarıyla kaydedildi.');
    } catch (error) {
      console.error(error);
      setMessage('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const testSync = async () => {
    setLoading(true);
    setMessage('');
    try {
      await callFunction('syncGoogleSheet');
      setMessage('Test senkronizasyonu başarıyla tamamlandı.');
    } catch (error) {
      console.error(error);
      setMessage('Test senkronizasyonu başarısız. Ayarlarınızı gözden geçirin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Google Sheets Entegrasyonu</h2>
        <p className="text-sm text-slate-500">OAuth ile bağlanın, sheet seçin ve eşlemeleri kaydedin.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Bağlantı Durumu</p>
              <p className="text-xs text-slate-500">
                {state.connected ? 'Google Sheets bağlı.' : 'Henüz bağlantı kurulmadı.'}
              </p>
            </div>
            <button
              type="button"
              onClick={connect}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
              disabled={loading}
            >
              {state.connected ? 'Yeniden Yetkilendir' : "Sheet'e Bağlan"}
            </button>
          </div>
          {state.connected && (
            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Spreadsheet ID</span>
                <input
                  type="text"
                  value={state.spreadsheetId ?? ''}
                  onChange={(e) => setState((prev) => ({ ...prev, spreadsheetId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Sheet Adı</span>
                <input
                  type="text"
                  value={state.sheetName ?? ''}
                  onChange={(e) => setState((prev) => ({ ...prev, sheetName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <label key={field} className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <select
                      value={state.mappings[field] ?? ''}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          mappings: { ...prev.mappings, [field]: e.target.value }
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <option value="">Sütun seçiniz</option>
                      {columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Senkronizasyon Modu</span>
                <select
                  value={state.mode}
                  onChange={(e) => setState((prev) => ({ ...prev, mode: e.target.value as SheetsState['mode'] }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3"
                >
                  <option value="otomatik">Otomatik</option>
                  <option value="manuel">Manuel</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={save}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                  disabled={loading}
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={testSync}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary"
                  disabled={loading}
                >
                  Test Senkronizasyonu
                </button>
              </div>
            </div>
          )}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      </div>
    </section>
  );
};

const fieldLabels: Record<string, string> = {
  fullName: 'Ad Soyad',
  email: 'E-posta',
  phone: 'Telefon',
  serviceName: 'Hizmet',
  doctorName: 'Doktor',
  date: 'Tarih',
  time: 'Saat'
};

export default GoogleSheets;
