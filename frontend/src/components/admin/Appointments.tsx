import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import clsx from 'clsx';

interface AppointmentItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  serviceName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'beklemede' | 'onaylandi' | 'iptal';
}

const statusMap: Record<AppointmentItem['status'], { label: string; color: string }> = {
  beklemede: { label: 'Beklemede', color: 'bg-amber-100 text-amber-700' },
  onaylandi: { label: 'Onaylandı', color: 'bg-emerald-100 text-emerald-700' },
  iptal: { label: 'İptal', color: 'bg-rose-100 text-rose-700' }
};

const Appointments = () => {
  const { callFunction } = useFirebase();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'hepsi' | AppointmentItem['status']>('hepsi');

  const loadAppointments = () => {
    callFunction<AppointmentItem[]>('listAppointments')
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filtered = appointments.filter((item) => (filter === 'hepsi' ? true : item.status === filter));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Randevular</h2>
          <p className="text-sm text-slate-500">Randevuları görüntüleyin, düzenleyin ve yönetin.</p>
        </div>
        <div className="flex gap-3">
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="hepsi">Tümü</option>
            <option value="beklemede">Beklemede</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="iptal">İptal</option>
          </select>
          <button
            type="button"
            onClick={() =>
              callFunction('syncGoogleSheet')
                .then(loadAppointments)
                .catch(() => alert('Google Sheets senkronizasyonu yapılamadı. Ayarları kontrol edin.'))
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Google Sheets'e Aktar
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Hasta</th>
              <th className="px-4 py-3">Hizmet</th>
              <th className="px-4 py-3">Doktor</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Saat</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{item.fullName}</div>
                    <div className="text-xs text-slate-500">{item.email}</div>
                    <div className="text-xs text-slate-500">{item.phone}</div>
                  </td>
                  <td className="px-4 py-3">{item.serviceName}</td>
                  <td className="px-4 py-3">{item.doctorName}</td>
                  <td className="px-4 py-3">{format(new Date(`${item.date}T00:00:00`), 'dd.MM.yyyy', { locale: tr })}</td>
                  <td className="px-4 py-3">{item.time}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', statusMap[item.status].color)}>
                      {statusMap[item.status].label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Appointments;
