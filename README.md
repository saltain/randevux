# Randevux

Profesyonel Randevu Sistemi için teknik gereksinimler, mimari plan ve içerik şablonlarını içeren depo.

## Proje Özeti
- **Frontend**: React 18, Vite, Tailwind CSS.
- **Backend**: Firebase Authentication, Firestore, Cloud Functions.
- **Entegrasyonlar**: Nodemailer/SendGrid e-posta, Google Sheets API v4, ICS takvim dosyaları.
- **Dil**: Türkçe arayüz ve mesajlar.

## İçerikler
- `docs/architecture.md`: Sistem mimarisi ve bileşenleri.
- `docs/user-flow.md`: Kullanıcı ve admin paneli akışları.
- `docs/google-sheets-integration.md`: Sheets entegrasyon planı.
- `docs/ics-generation.md`: ICS dosyası oluşturma rehberi.
- `docs/email-templates/`: Türkçe e-posta şablonları.

## Kurulum (Planlanan)
1. `pnpm create vite` ile frontend kurulumu.
2. `firebase init` ile Functions ve Hosting yapılandırması.
3. Tailwind CSS ve gerekli UI kütüphanelerinin eklenmesi.
4. CI/CD için GitHub Actions çalışma dosyalarının eklenmesi.

## Geliştirme Yol Haritası
1. Tasarım sisteminin hazırlanması (Inter font, #007AFF ana renk, responsive layout).
2. Randevu alma sihirbazı adımlarının uygulanması.
3. Admin paneli modüllerinin geliştirilmesi.
4. Firebase Functions üzerinde OTP, randevu oluşturma ve e-posta gönderimi.
5. Google Sheets OAuth ve senkronizasyon modülü.
6. Hatırlatma otomasyonları ve raporlama.

## Lisans
Bu depo planlama amaçlıdır; lisans bilgisi daha sonra eklenecektir.
