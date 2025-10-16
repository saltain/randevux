# Google Sheets Entegrasyon Planı

## OAuth 2.0 Akışı
1. Admin panelindeki "Sheet'e Bağlan" butonu Cloud Functions üzerinden Google OAuth url'si üretir.
2. Admin kullanıcı Google hesabında oturum açar ve yetki verir.
3. Callback URL'i Firebase Functions'ta `handleGoogleOAuthCallback` fonksiyonudur.
4. Alınan access token + refresh token Firestore `settings/googleSheets` dokümanında saklanır (şifrelenmiş).

## Sheet Seçimi
- Token kaydedildikten sonra Sheets API ile kullanıcının sheet listesi alınır.
- Admin paneli dropdown üzerinden bir sheet seçer.
- Seçilen sheet id'si `settings/googleSheets.sheetId` alanına yazılır.

## Sütun Eşleştirme
- API ile sheet'in header satırı okunur.
- Admin panelinde alanların (Ad Soyad, Email, Telefon, Hizmet, Doktor, Tarih, Saat) drag&drop veya select input ile eşlenmesi sağlanır.
- Eşleştirme `settings/googleSheets.columnMappings` alanında saklanır.

## Senkronizasyon
- **Otomatik**: `syncToGoogleSheets` fonksiyonu Firebase Scheduler ile her 15 dakikada bir tetiklenir.
- **Manuel**: Admin panelindeki "Şimdi Senkronize Et" butonu fonksiyonu tetikler.
- Yeni randevular append modunda sheet'e eklenir.
- Başarısız yazımlar için retry mekanizması (Pub/Sub queue) planlanır.

## Test Butonu
- Admin panelindeki test butonu, mevcut ayarlarla deneme satırı yazıp hemen siler.
- Başarılı/başarısız sonuçlar Türkçe toast bildirim olarak gösterilir.

## Güvenlik Notları
- OAuth client secret Firebase Config'te tutulur.
- Refresh token'lar KMS ile şifrelenir.
- Loglarda kişisel veri maskelenir.
