import { useEffect, useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DashboardStats {
  today: number;
  week: number;
  total: number;
}

const Dashboard = () => {
  const { callFunction } = useFirebase();
  const [stats, setStats] = useState<DashboardStats>({ today: 0, week: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callFunction<DashboardStats>('dashboardStats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, [callFunction]);

  return (
    <section>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Genel Bakış</h2>
        <p className="text-sm text-slate-500">
          {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Bugünkü Randevular', value: stats.today },
          { label: 'Haftalık Randevular', value: stats.week },
          { label: 'Toplam Randevu', value: stats.total }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? '...' : item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Dashboard;
