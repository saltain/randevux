export const reminderTemplate = ({
  name,
  date,
  time,
  service,
  doctor
}: {
  name: string;
  date: string;
  time: string;
  service: string;
  doctor: string;
}) => `Merhaba ${name},\n\nYarın (${date}) ${time} saatindeki ${service} randevunuzu hatırlatmak isteriz.\nDoktor: ${doctor}\n\nHerhangi bir değişiklik yapmanız gerekiyorsa lütfen bizimle iletişime geçin.\n\nSevgilerimizle,\nRandevux Ekibi`;
