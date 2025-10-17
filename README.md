# Randevux

Profesyonel sağlık randevu sistemi için uçtan uca bir örnek proje. React + Tailwind tabanlı hasta arayüzü, Firebase destekli kimlik yönetimi ve Firestore veri katmanı, Google Sheets senkronizasyonu ile yönetici paneli içerir.

## İçindekiler
- [Özellikler](#özellikler)
- [Dizin Yapısı](#dizin-yapısı)
- [Kurulum](#kurulum)
- [Geliştirme Komutları](#geliştirme-komutları)
- [Çevresel Değişkenler](#çevresel-değişkenler)
- [Mimari Notlar](#mimari-notlar)

## Özellikler
- **Hasta Portalı**: 7 adımlı Türkçe randevu alma sihirbazı (doğrulama kodu, hizmet, doktor, tarih, saat seçimi ve ICS ekli e-posta).
- **Admin Paneli**: Dashboard, randevu yönetimi, hizmet/doktor CRUD, çalışma saatleri planlama ve Google Sheets entegrasyon ekranları.
  - Varsayılan kullanıcı: **salih / 123358Serkan** (Firebase Authentication üzerinden e-posta: `salih@randevux.local`).
  - Dashboard, randevu yönetimi, hizmet/doktor CRUD, çalışma saatleri planlama ve Google Sheets entegrasyon ekranları.
- **Firebase Cloud Functions**: Doğrulama kodu gönderimi, randevu oluşturma, ICS üretimi, Firestore kayıtları ve Google Sheets satır ekleme.
- **E-posta Şablonları**: Doğrulama, randevu onayı ve hatırlatma için Türkçe içerikler.
- **Türkçe Arayüz**: Tüm metinler, hata mesajları ve tarih formatları `DD.MM.YYYY` standartlarına göre uyarlanmıştır.

## Dizin Yapısı
```
.
├── docs/                 # Önceki mimari plan ve şablon dokümantasyonu
├── frontend/             # React + Vite uygulaması
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppointmentWizard.tsx
│   │   │   └── admin/
│   │   ├── context/
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
├── functions/            # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── index.ts
│   │   ├── lib/
│   │   └── templates/
│   └── package.json
├── firebase.json         # Firebase Hosting & Functions yapılandırması
├── package.json          # Monorepo yardımcı komutları
└── README.md
```

## Kurulum
> Node.js 18+ ve Firebase CLI gereklidir.

```bash
# Bağımlılıkları kur
npm install
npm --prefix frontend install
npm --prefix functions install

# Firebase CLI oturumu aç (bir kez)
firebase login
```

## Geliştirme Komutları
```bash
# Frontend geliştirme sunucusu
npm run dev

# Frontend üretim derlemesi
npm run build

# Cloud Functions TypeScript derlemesi
npm --prefix functions run build

# Functions yerel emülatörü (Firestore + Functions)
firebase emulators:start --only functions,firestore
```

## Çevresel Değişkenler
### Frontend (`frontend/.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Cloud Functions (Firebase parametreleri)
Aşağıdaki değerleri `firebase functions:config:set` komutu ile tanımlayın:
```bash
firebase functions:config:set \
  MAIL_FROM="destek@randevux.app" \
  SENDGRID_API_KEY="..." \
  SMTP_HOST="smtp.example.com" \
  SMTP_PORT=587 \
  SMTP_USER="kullanici" \
  SMTP_PASS="sifre" \
  GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com" \
  GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\\n..."
```
SendGrid kullanmak istemezseniz `SMTP_*` değişkenleri ile Nodemailer üzerinden SMTP gönderebilirsiniz.

## Mimari Notlar
- Doğrulama kodları `verificationCodes` koleksiyonunda 10 dakika süreyle saklanır ve randevu kaydında doğrulama sonrası otomatik silinir.
- Randevular `appointments` koleksiyonuna yazılır ve aynı anda ICS eki ile e-posta gönderilir.
- Google Sheets eşlemeleri `settings/googleSheets` dokümanında tutulur. Servis hesabı kimlik bilgileri girildiğinde satırlar otomatik olarak seçilen sheet'e eklenir.
- Admin panelindeki tüm veri çağrıları Firebase Cloud Functions üzerinden yapılır; Firestore güvenlik kurallarında sadece yetkili admin kullanıcılarına izin verecek şekilde kısıtlama yapılması önerilir.

Geliştirme yol haritası ve ek detaylar için `docs/` klasörüne göz atabilirsiniz.
