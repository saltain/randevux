import { useState } from 'react';

const templates: Record<string, string> = {
  verification: `Merhaba {{adSoyad}},\n\nDoğrulama kodunuz: {{kod}}\nKodun 10 dakika içinde kullanılması gerekmektedir.`,
  confirmation: `Merhaba {{adSoyad}},\n\n{{tarih}} tarihli {{saat}} saatindeki randevunuz onaylandı.\nHizmet: {{hizmet}}\nDoktor: {{doktor}}`,
  reminder: `Merhaba {{adSoyad}},\n\nYarın {{saat}} saatindeki randevunuzu hatırlatmak isteriz. Görüşmek üzere!`
};

const VerificationEmails = () => {
  const [selected, setSelected] = useState<keyof typeof templates>('verification');

  return (
    <section className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Şablonlar</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <button
              type="button"
              onClick={() => setSelected('verification')}
              className={`w-full rounded-lg px-3 py-2 text-left ${
                selected === 'verification' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Doğrulama Kodu
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setSelected('confirmation')}
              className={`w-full rounded-lg px-3 py-2 text-left ${
                selected === 'confirmation' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Randevu Onayı
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setSelected('reminder')}
              className={`w-full rounded-lg px-3 py-2 text-left ${
                selected === 'reminder' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hatırlatma
            </button>
          </li>
        </ul>
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Önizleme</h2>
          <p className="text-sm text-slate-500">Şablon değişkenleri: {{adSoyad}}, {{kod}}, {{tarih}}, {{saat}}, {{hizmet}}, {{doktor}}</p>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
{templates[selected]}
        </pre>
        <p className="text-xs text-slate-500">
          Güncelleme için <code>functions/src/templates</code> klasöründeki dosyaları düzenleyebilirsiniz.
        </p>
      </div>
    </section>
  );
};

export default VerificationEmails;
