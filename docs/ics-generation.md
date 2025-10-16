# ICS Dosyası Oluşturma Rehberi

## Kullanılacak Paket
- `ics` npm paketi veya `ical-generator`.
- Cloud Functions ortamında `ics` paketi hafif olduğundan tercih edilir.

## Fonksiyon Örneği
```ts
import { createEvents } from 'ics';

export async function buildAppointmentIcs(appointment: Appointment): Promise<{ filename: string; content: string; }> {
  return new Promise((resolve, reject) => {
    const eventConfig = {
      title: `${appointment.serviceName} - ${appointment.doctorName}`,
      description: `Randevu sahibi: ${appointment.fullName}\nTelefon: ${appointment.phone}`,
      start: [appointment.start.year, appointment.start.month, appointment.start.day, appointment.start.hour, appointment.start.minute],
      duration: { minutes: appointment.durationMinutes },
      location: appointment.location,
      organizer: { name: 'Randevux', email: 'destek@randevux.com' },
      status: 'CONFIRMED',
      alarms: [
        { action: 'display', description: 'Randevu hatırlatma', trigger: { hours: 1, before: true } }
      ]
    };

    createEvents([eventConfig], (error, value) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ filename: `randevu-${appointment.id}.ics`, content: value });
    });
  });
}
```

## E-posta'ya Eklenmesi
- Nodemailer ile `attachments: [{ filename, content, contentType: 'text/calendar' }]` kullanılır.
- UTF-8 bozulmaması için `base64` encoding seçeneği değerlendirilebilir.

## Test
- Jest ile ICS çıktısında `BEGIN:VCALENDAR` ve `SUMMARY` alanlarının bulunması doğrulanır.
