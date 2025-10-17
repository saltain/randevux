# Randevux Sistem Mimarisi

Bu doküman, Profesyonel Randevu Sistemi'nin teknik bileşenlerini ve katmanlar arası entegrasyon akışlarını detaylandırır.

## Genel Bakış

- **Frontend**: React 18 + Vite, Tailwind CSS ile komponent tabanlı UI.
- **Backend**: Firebase ekosistemi (Authentication, Firestore, Cloud Functions, Cloud Storage).
- **E-posta Servisi**: Firebase Functions üzerinde Nodemailer (SendGrid SMTP) ile Türkçe içerikli mailler.
- **Google Sheets Entegrasyonu**: Cloud Functions üzerinden OAuth 2.0 ile Google Sheets API v4.
- **Takvim Entegrasyonu**: Cloud Functions'ta ICS (iCalendar) dosyası oluşturma ve e-postalara ekleme.

## Katmanlar

### 1. İstemci (React)
- Çok adımlı randevu alma sihirbazı.
- Firebase Authentication ile e-posta OTP doğrulama akışı.
- Firestore'dan gerçek zamanlı hizmet, doktor, çalışma saatleri verisi çekimi.
- Tailwind CSS ile responsive, mobil öncelikli tasarım.
- Admin paneli için `react-router` ile korumalı rotalar ve rol tabanlı guard.

### 2. Backend (Firebase)
- **Authentication**: Email link/OTP doğrulaması. Admin için özel kullanıcı + custom claims.
- **Firestore**: Aşağıdaki koleksiyonlar önerilir:
  - `services`: { name, description, durationMinutes, status }
  - `doctors`: { name, specialty, contact, services[], status }
  - `doctorSchedules`: { doctorId, dayOfWeek, slots[], breaks[], holidays[] }
  - `appointments`: { userRef, doctorRef, serviceRef, date, startTime, endTime, status, verificationCode }
  - `settings`: Google Sheets eşleştirme ve entegrasyon ayarları.
- **Cloud Functions**:
  - `sendVerificationCode`: OTP üretimi ve e-posta.
  - `createAppointment`: Slot müsaitlik kontrolü, kaydetme, ICS oluşturma, e-posta gönderimi, Google Sheets'e yazma.
  - `syncToGoogleSheets`: Manuel veya cron tabanlı eşitleme.
  - `sendReminderEmails`: Opsiyonel hatırlatma.
  - `updateDoctorSchedule`: Admin panelinden gelen değişiklikleri normalize etme.

### 3. Entegrasyonlar
- **Google Sheets**: OAuth tokenları Firestore `settings` altında şifrelenmiş olarak saklanır. Column mapping dinamik.
- **Nodemailer/SendGrid**: Şablonlar `email-templates` dizininde markdown/txt olarak tutulur, Functions build aşamasında bundlanır.
- **ICS Dosyası**: `ics` npm paketi ile. Dosya memory içinde oluşturulup email attachment olarak eklenir.

## Veri Akışı
1. Kullanıcı bilgilerini girer → `sendVerificationCode` fonksiyonu çağrılır.
2. OTP doğrulandıktan sonra kullanıcı Firestore `appointments` koleksiyonunda geçici kayıt oluşturur.
3. Hizmet ve doktora göre `doctorSchedules` sorgulanır, uygun slotlar hesaplanır.
4. Onay ekranında tüm veriler toplanır, `createAppointment` fonksiyonuna gönderilir.
5. Fonksiyon:
   - Slot uygunluk kontrolü (transaction)
   - Randevuyu kesinleştirme
   - ICS üretme
   - Email gönderme
   - Google Sheets'e yazma (async queue)
6. Başarı ekranı ile süreç tamamlanır.

## Güvenlik
- Firestore Security Rules ile sadece doğrulanmış kullanıcıların kendi randevularına erişimi.
- Admin kullanıcıları için custom claims (`role: "admin"`).
- Google OAuth tokenları KMS veya Firebase Config ile şifrelenmiş saklanır.
- Rate limiting: Cloud Functions üzerinde reCAPTCHA Enterprise veya Firebase App Check.

## DevOps / CI-CD
- Firebase Hosting + Functions için GitHub Actions pipeline.
- PR tetiklerinde lint/test, staging deploy; main branch merge sonrası prod deploy.

## Yerelleştirme
- Tüm UI metinleri `src/locales/tr.json` dosyasında tutulur.
- Tarih/saat işlemleri `date-fns` ve `date-fns/locale/tr` ile yapılır.

## Loglama & İzleme
- Cloud Logging ile fonksiyon logları.
- Sentry (opsiyonel) frontend için hata takibi.
- Google Analytics 4 ile randevu dönüşüm ölçümü.

## Açık Sorular
- SMS doğrulama ihtiyacı (Firebase Phone Auth?)
- Hatırlatma mailleri için zamanlama (cron vs. event driven)
- Otomatik Google Sheets sync sıklığı.

Bu tasarım ilerleyen sprintlerde daha detaylı sekmelere ayrılacaktır.
