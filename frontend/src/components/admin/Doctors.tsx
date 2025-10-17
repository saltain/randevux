import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';

interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  services: string[];
  status: 'aktif' | 'pasif';
}

interface ServiceItem {
  id: string;
  name: string;
}

const initialForm: Omit<DoctorItem, 'id'> = {
  name: '',
  specialty: '',
  email: '',
  phone: '',
  services: [],
  status: 'aktif'
};

const Doctors = () => {
  const { callFunction } = useFirebase();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const [doctorList, serviceList] = await Promise.all([
      callFunction<DoctorItem[]>('listDoctors'),
      callFunction<ServiceItem[]>('listServices')
    ]);
    setDoctors(doctorList);
    setServices(serviceList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      await callFunction('updateDoctor', { id: editingId, ...form });
    } else {
      await callFunction('createDoctor', form);
    }
    setForm(initialForm);
    setEditingId(null);
    load();
  };

  const handleEdit = (doctor: DoctorItem) => {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email,
      phone: doctor.phone,
      services: doctor.services,
      status: doctor.status
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu doktoru silmek istediğinize emin misiniz?')) return;
    await callFunction('deleteDoctor', { id });
    load();
  };

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Doktor</th>
              <th className="px-4 py-3">Uzmanlık</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Hizmetler</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{doctor.name}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      doctor.status === 'aktif'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {doctor.status === 'aktif' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">{doctor.specialty}</td>
                <td className="px-4 py-3 text-slate-500">{doctor.email}</td>
                <td className="px-4 py-3 text-slate-500">{doctor.phone}</td>
                <td className="px-4 py-3 text-slate-500">
                  <div className="flex flex-wrap gap-2">
                    {doctor.services.map((id) => {
                      const service = services.find((s) => s.id === id);
                      return (
                        <span key={id} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          {service?.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => handleEdit(doctor)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="text-sm text-rose-500 hover:underline"
                      onClick={() => handleDelete(doctor.id)}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Doktoru Güncelle' : 'Yeni Doktor Ekle'}
          </h2>
          <p className="text-sm text-slate-500">Doktor bilgilerini giriniz.</p>
        </div>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Uzmanlık</span>
          <input
            type="text"
            required
            value={form.specialty}
            onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">E-posta</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Telefon</span>
          <input
            type="tel"
            required
            placeholder="0XXX XXX XX XX"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Verdiği Hizmetler</span>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                type="button"
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  form.services.includes(service.id)
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Durum</span>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as DoctorItem['status'] }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
          >
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
          </select>
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          {editingId ? 'Güncelle' : 'Ekle'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
            }}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary"
          >
            İptal
          </button>
        )}
      </form>
    </section>
  );
};

export default Doctors;
