import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';

interface DoctorItem {
  id: string;
  name: string;
}

interface WorkingHoursForm {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isHoliday: boolean;
}

const defaultForm: WorkingHoursForm = {
  doctorId: '',
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '17:00',
  breakStart: '12:30',
  breakEnd: '13:00',
  isHoliday: false
};

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const WorkingHours = () => {
  const { callFunction } = useFirebase();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [schedule, setSchedule] = useState<WorkingHoursForm[]>([]);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    callFunction<DoctorItem[]>('listDoctors').then(setDoctors);
    callFunction<WorkingHoursForm[]>('listWorkingHours').then(setSchedule);
  }, [callFunction]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await callFunction('upsertWorkingHours', form);
    callFunction<WorkingHoursForm[]>('listWorkingHours').then(setSchedule);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Doktor</th>
              <th className="px-4 py-3">Gün</th>
              <th className="px-4 py-3">Çalışma Saatleri</th>
              <th className="px-4 py-3">Mola</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.map((item, index) => {
              const doctor = doctors.find((d) => d.id === item.doctorId);
              return (
                <tr key={`${item.doctorId}-${item.dayOfWeek}-${index}`}>
                  <td className="px-4 py-3">{doctor?.name ?? 'Bilinmiyor'}</td>
                  <td className="px-4 py-3">{days[item.dayOfWeek]}</td>
                  <td className="px-4 py-3">
                    {item.startTime} - {item.endTime}
                  </td>
                  <td className="px-4 py-3">
                    {item.breakStart && item.breakEnd ? `${item.breakStart} - ${item.breakEnd}` : 'Mola yok'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isHoliday
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.isHoliday ? 'Tatilde' : 'Aktif'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Çalışma Saati Tanımla</h2>
          <p className="text-sm text-slate-500">Doktor ve gün seçip çalışma saatini kaydedin.</p>
        </div>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Doktor</span>
          <select
            required
            value={form.doctorId}
            onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
          >
            <option value="">Doktor seçiniz</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Gün</span>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
          >
            {days.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Başlangıç</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Bitiş</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Mola Başlangıcı</span>
            <input
              type="time"
              value={form.breakStart}
              onChange={(e) => setForm((prev) => ({ ...prev, breakStart: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Mola Bitişi</span>
            <input
              type="time"
              value={form.breakEnd}
              onChange={(e) => setForm((prev) => ({ ...prev, breakEnd: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.isHoliday}
            onChange={(e) => setForm((prev) => ({ ...prev, isHoliday: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Tatil (Randevu alınamaz)
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Kaydet
        </button>
      </form>
    </section>
  );
};

export default WorkingHours;
