export const verificationTemplate = ({
  name,
  code
}: {
  name: string;
  code: string;
}) => `Merhaba ${name},\n\nRandevu sistemimizi kullanmaya başladığınız için teşekkür ederiz. Doğrulama kodunuz: ${code}\n\nBu kodu 10 dakika içinde kullanmayı unutmayın. Sorularınız için yanıtla butonunu kullanabilirsiniz.\n\nSevgilerimizle,\nRandevux Ekibi`;
