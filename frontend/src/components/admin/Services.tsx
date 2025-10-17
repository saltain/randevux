import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration: number;
  status: 'aktif' | 'pasif';
}

const initialForm: Omit<ServiceItem, 'id'> = {
  name: '',
  description: '',
  duration: 30,
  status: 'aktif'
};

const Services = () => {
  const { callFunction } = useFirebase();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadServices = () => {
    callFunction<ServiceItem[]>('listServices').then(setServices);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await callFunction('updateService', { id: editingId, ...form });
      } else {
        await callFunction('createService', form);
      }
      setForm(initialForm);
      setEditingId(null);
      loadServices();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      status: service.status
    });
    setEditingId(service.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    await callFunction('deleteService', { id });
    loadServices();
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Hizmet</th>
              <th className="px-4 py-3">Süre</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.description}</p>
                </td>
                <td className="px-4 py-3">{service.duration} dk</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      service.status === 'aktif'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {service.status === 'aktif' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => handleEdit(service)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="text-sm text-rose-500 hover:underline"
                      onClick={() => handleDelete(service.id)}
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
            {editingId ? 'Hizmeti Güncelle' : 'Yeni Hizmet Ekle'}
          </h2>
          <p className="text-sm text-slate-500">Ad, açıklama, süre ve durum bilgilerini giriniz.</p>
        </div>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Hizmet Adı</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Açıklama</span>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Süre (dakika)</span>
          <input
            type="number"
            min={5}
            max={240}
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Durum</span>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ServiceItem['status'] }))}
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
          >
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          {loading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
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

export default Services;
