import { createEvent } from 'ics';

interface IcsOptions {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
  location?: string;
}

export const generateIcs = ({ title, description, start, durationMinutes, location }: IcsOptions) => {
  const startArray = [
    start.getUTCFullYear(),
    start.getUTCMonth() + 1,
    start.getUTCDate(),
    start.getUTCHours(),
    start.getUTCMinutes()
  ] as const;

  const { value } = createEvent({
    title,
    description,
    start: startArray,
    duration: { minutes: durationMinutes },
    location,
    status: 'CONFIRMED'
  });

  if (!value) {
    throw new Error('ICS dosyası oluşturulamadı.');
  }

  return value;
};
