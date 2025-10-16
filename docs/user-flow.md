# Kullanıcı Akışları

## Randevu Alma Sihirbazı

1. **Giriş Formu**
   - Alanlar: Ad Soyad, Telefon (+90 format maskesi), E-posta.
   - Validasyon: Zorunlu alanlar, telefon format kontrolü, e-posta regex.
   - "Devam Et" butonu: Validasyon sonrası OTP gönderim fonksiyonunu tetikler.

2. **Doğrulama**
   - Kullanıcı e-posta adresine 6 haneli doğrulama kodu alır.
   - Form: 6 kutucuklu OTP girişi, geri sayım ve yeniden gönder butonu.
   - Başarılı doğrulamada local state'te `verifiedUser` oluşturulur.

3. **Hizmet Seçimi**
   - Card layout: Başlık, açıklama, süre, fiyat (varsa).
   - Firestore `services` koleksiyonundan `status === 'active'` olan kayıtlar.
   - Seçilen hizmet state'te saklanır.

4. **Doktor Seçimi**
   - Hizmete bağlı filtrelenmiş doktor listesi.
   - Her kartta ad, uzmanlık, müsait günler.
   - Doktor seçimi ile bir sonraki adım aktif olur.

5. **Tarih Seçimi**
   - Türkçe takvim komponenti (`react-day-picker` önerilir).
   - Geçmiş tarihler ve doktorun tatil günleri disable.

6. **Saat Seçimi**
   - Seçilen tarihe göre 30 dakikalık slot listesi.
   - Doluluk kontrolü Firestore `appointments` + `doctorSchedules` ile yapılır.
   - Seçim sonrası onay adımına geçilir.

7. **Onay**
   - Özet: Hizmet, Doktor, Tarih (DD.MM.YYYY), Saat, Kullanıcı bilgileri.
   - "Onayla ve Randevu Al" butonu `createAppointment` fonksiyonunu çağırır.

8. **Başarı Ekranı**
   - Teşekkür mesajı, ICS indirme linki.
   - Randevu detayları ve destek iletişim bilgisi.

## Admin Panel Akışları

### Giriş
- Kullanıcı adı/şifre formu (Firebase Auth custom token).
- Başarılı girişte dashboard rotasına yönlendirme.

### Dashboard
- Kartlar: Bugünkü randevu sayısı, haftalık, toplam.
- Grafik: Haftalık randevu trendi.

### Randevular Modülü
- Tablo: Ad Soyad, Hizmet, Doktor, Tarih, Saat, Durum.
- Filtreler: Tarih aralığı, doktor, hizmet, durum.
- Eylemler: Düzenle (modal), Sil, Google Sheets'e aktar.

### Hizmetler Modülü
- Liste ve detay formları.
- Yeni hizmet ekleme, mevcutları düzenleme, durum değiştirme.

### Doktorlar Modülü
- Doktor kartları + detay sayfası.
- Hizmet eşleştirme multi-select.
- İletişim bilgileri ve aktiflik durumu.

### Çalışma Saatleri
- Doktor bazlı takvim veya tablo.
- Günlük çalışma saat aralıkları, mola saatleri ve özel tatiller.
- Drag&drop veya form tabanlı düzenleme.

### Google Sheets Ayarları
- OAuth bağlantısı butonu.
- Sheet seçimi dropdown.
- Sütun eşleştirme için sürükle bırak veya select input.
- Otomatik/manuel senkron ayarları + Test düğmesi.

## Hata Senaryoları
- OTP yanlış: "Doğrulama kodu hatalı, lütfen tekrar deneyin." mesajı.
- Slot çatışması: "Seçtiğiniz saat aralığı artık uygun değil, lütfen başka bir saat seçin.".
- Sunucu hatası: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.".

## Erişilebilirlik
- Form alanlarına etiketler ve Türkçe `aria-label` kullanımı.
- Klavye ile adımlar arasında gezinme.
- Kontrast standartlarına uygun renkler.
