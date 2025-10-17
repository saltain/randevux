export const appointmentConfirmationTemplate = ({
  name,
  service,
  doctor,
  date,
  time
}: {
  name: string;
  service: string;
  doctor: string;
  date: string;
  time: string;
}) => `Merhaba ${name},\n\n${date} tarihinde ${time} saatindeki randevunuz başarıyla oluşturuldu.\n\nHizmet: ${service}\nDoktor: ${doctor}\n\nRandevu detaylarını takvimine eklemek için ekteki ICS dosyasını kullanabilirsin.\n\nSevgilerimizle,\nRandevux Ekibi`;
