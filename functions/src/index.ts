import * as functions from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/firebase';
import { sendEmail } from './lib/mail';
import { generateIcs } from './lib/ics';
import {
  appendAppointmentRow,
  connectSheets as connectSheetsSettings,
  getSheetsSettings as getSheetsSettingsFromStore,
  listSheetColumns as listSheetColumnsFromSheets,
  saveSheetsSettings as saveSheetsSettingsToStore
} from './lib/sheets';
import { verificationTemplate } from './templates/verification';
import { appointmentConfirmationTemplate } from './templates/appointment-confirmation';

interface AppointmentPayload {
  fullName: string;
  phone: string;
  email: string;
  verificationCode: string;
  serviceId: string;
  doctorId: string;
  date: string;
  time: string;
  notes?: string;
}

const formatPhone = (phone: string) => phone.replace(/\s+/g, '');

const getService = async (serviceId: string) => {
  const serviceSnap = await db.collection('services').doc(serviceId).get();
  if (!serviceSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Seçilen hizmet bulunamadı.');
  }
  return serviceSnap.data() as any;
};

const getDoctor = async (doctorId: string) => {
  const doctorSnap = await db.collection('doctors').doc(doctorId).get();
  if (!doctorSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Seçilen doktor bulunamadı.');
  }
  return doctorSnap.data() as any;
};

const getVerificationDocId = (email: string) => email.toLowerCase();

export const sendVerificationCode = functions.https.onCall(async (data: any) => {
  const email: string = data.email;
  const name: string = data.name ?? '';
  const phone: string = data.phone ?? '';

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'E-posta adresi zorunludur.');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

  await db.collection('verificationCodes').doc(getVerificationDocId(email)).set({
    code,
    email,
    name,
    phone: formatPhone(phone),
    expiresAt,
    createdAt: Timestamp.now()
  });

  await sendEmail({
    to: email,
    subject: 'Randevux Doğrulama Kodunuz',
    text: verificationTemplate({ name, code })
  });

  return { success: true };
});

const validateVerificationCode = async (email: string, code: string) => {
  const doc = await db.collection('verificationCodes').doc(getVerificationDocId(email)).get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Doğrulama kodu bulunamadı.');
  }

  const data = doc.data();
  if (!data) {
    throw new functions.https.HttpsError('internal', 'Doğrulama kodu okunamadı.');
  }

  if (data.code !== code) {
    throw new functions.https.HttpsError('permission-denied', 'Doğrulama kodu hatalı.');
  }

  if (data.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('permission-denied', 'Doğrulama kodunun süresi dolmuş.');
  }

  await db.collection('verificationCodes').doc(getVerificationDocId(email)).delete();
  return data;
};

export const bookAppointment = functions.https.onCall(async (payload: AppointmentPayload) => {
  const {
    fullName,
    phone,
    email,
    verificationCode,
    serviceId,
    doctorId,
    date,
    time,
    notes
  } = payload;

  if (!fullName || !phone || !email || !verificationCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Gerekli alanlar eksik.');
  }

  await validateVerificationCode(email, verificationCode);

  const service = await getService(serviceId);
  const doctor = await getDoctor(doctorId);

  const appointmentDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new functions.https.HttpsError('invalid-argument', 'Geçersiz tarih veya saat.');
  }

  const appointmentRef = db.collection('appointments').doc();
  await appointmentRef.set({
    fullName,
    phone: formatPhone(phone),
    email,
    serviceId,
    serviceName: service.name,
    doctorId,
    doctorName: doctor.name,
    date,
    time,
    notes: notes ?? '',
    status: 'beklemede',
    createdAt: Timestamp.now()
  });

  const ics = generateIcs({
    title: `${service.name} - ${doctor.name}`,
    description: `Randevu: ${service.name} (${doctor.name})`,
    start: appointmentDate,
    durationMinutes: Number(service.duration) || 30
  });

  await sendEmail({
    to: email,
    subject: 'Randevunuz Oluşturuldu',
    text: appointmentConfirmationTemplate({
      name: fullName,
      service: service.name,
      doctor: doctor.name,
      date,
      time
    }),
    icsAttachment: {
      filename: 'randevu.ics',
      content: ics
    }
  });

  const sheetsSettings = await getSheetsSettingsFromStore();
  await appendAppointmentRow(sheetsSettings, {
    fullName,
    email,
    phone: formatPhone(phone),
    serviceName: service.name,
    doctorName: doctor.name,
    date,
    time
  });

  return { success: true };
});

export const listServices = functions.https.onCall(async () => {
  const snapshot = await db.collection('services').orderBy('name').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const createService = functions.https.onCall(async (data: any) => {
  const { name, description, duration, status } = data;
  if (!name || !description) {
    throw new functions.https.HttpsError('invalid-argument', 'Hizmet bilgileri eksik.');
  }

  await db.collection('services').add({
    name,
    description,
    duration: Number(duration) || 30,
    status
  });

  return { success: true };
});

export const updateService = functions.https.onCall(async (data: any) => {
  const { id, ...rest } = data;
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Hizmet ID gereklidir.');
  }

  await db
    .collection('services')
    .doc(id)
    .set(
      {
        ...rest,
        duration: rest.duration ? Number(rest.duration) : rest.duration
      },
      { merge: true }
    );
  return { success: true };
});

export const deleteService = functions.https.onCall(async (data: any) => {
  const { id } = data;
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Hizmet ID gereklidir.');
  }

  await db.collection('services').doc(id).delete();
  return { success: true };
});

export const listDoctors = functions.https.onCall(async () => {
  const snapshot = await db.collection('doctors').orderBy('name').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const createDoctor = functions.https.onCall(async (data: any) => {
  const { name, specialty, email, phone, services, status } = data;
  if (!name || !specialty) {
    throw new functions.https.HttpsError('invalid-argument', 'Doktor bilgileri eksik.');
  }

  await db.collection('doctors').add({
    name,
    specialty,
    email,
    phone,
    services,
    status
  });
  return { success: true };
});

export const updateDoctor = functions.https.onCall(async (data: any) => {
  const { id, ...rest } = data;
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Doktor ID gereklidir.');
  }
  await db.collection('doctors').doc(id).set(rest, { merge: true });
  return { success: true };
});

export const deleteDoctor = functions.https.onCall(async (data: any) => {
  const { id } = data;
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Doktor ID gereklidir.');
  }
  await db.collection('doctors').doc(id).delete();
  return { success: true };
});

interface WorkingHoursInput {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isHoliday: boolean;
}

const workingHoursDocId = ({ doctorId, dayOfWeek }: WorkingHoursInput) => `${doctorId}_${dayOfWeek}`;

export const listWorkingHours = functions.https.onCall(async () => {
  const snapshot = await db.collection('workingHours').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const upsertWorkingHours = functions.https.onCall(async (data: WorkingHoursInput) => {
  if (!data.doctorId) {
    throw new functions.https.HttpsError('invalid-argument', 'Doktor ID gereklidir.');
  }

  await db
    .collection('workingHours')
    .doc(workingHoursDocId(data))
    .set(
      {
        ...data,
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );

  return { success: true };
});

export const listSlots = functions.https.onCall(async (data: any) => {
  const { doctorId, date } = data;
  if (!doctorId || !date) {
    throw new functions.https.HttpsError('invalid-argument', 'Doktor ve tarih gereklidir.');
  }

  const jsDay = new Date(`${date}T00:00:00`).getDay();
  const dayOfWeek = (jsDay + 6) % 7;
  const docId = `${doctorId}_${dayOfWeek}`;
  const workingDoc = await db.collection('workingHours').doc(docId).get();
  if (!workingDoc.exists) {
    return [];
  }

  const workingData = workingDoc.data() as WorkingHoursInput;
  if (workingData.isHoliday) {
    return [];
  }

  const existingSnapshot = await db
    .collection('appointments')
    .where('doctorId', '==', doctorId)
    .where('date', '==', date)
    .get();
  const taken = new Set(existingSnapshot.docs.map((doc) => doc.data().time));

  const slots: { time: string; available: boolean }[] = [];
  let current = toMinutes(workingData.startTime);
  const end = toMinutes(workingData.endTime);
  while (current < end) {
    const timeLabel = minutesToTime(current);
    const inBreak = isInBreak(current, workingData);
    const available = !inBreak && !taken.has(timeLabel);
    slots.push({ time: timeLabel, available });
    current += 30;
  }

  return slots;
});

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const isInBreak = (minutes: number, data: WorkingHoursInput) => {
  if (!data.breakStart || !data.breakEnd) {
    return false;
  }
  const start = toMinutes(data.breakStart);
  const end = toMinutes(data.breakEnd);
  return minutes >= start && minutes < end;
};

export const listAppointments = functions.https.onCall(async () => {
  const snapshot = await db.collection('appointments').orderBy('date', 'desc').orderBy('time', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const dashboardStats = functions.https.onCall(async () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekStr = startOfWeek.toISOString().split('T')[0];

  const [todaySnap, weekSnap, totalSnap] = await Promise.all([
    db.collection('appointments').where('date', '==', todayStr).get(),
    db.collection('appointments').where('date', '>=', weekStr).get(),
    db.collection('appointments').get()
  ]);

  return {
    today: todaySnap.size,
    week: weekSnap.size,
    total: totalSnap.size
  };
});

export const syncGoogleSheet = functions.https.onCall(async () => {
  const settings = await getSheetsSettingsFromStore();
  if (!settings.connected) {
    throw new functions.https.HttpsError('failed-precondition', 'Google Sheets bağlantısı yok.');
  }

  const snapshot = await db.collection('appointments').orderBy('date').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    await appendAppointmentRow(settings, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      serviceName: data.serviceName,
      doctorName: data.doctorName,
      date: data.date,
      time: data.time
    });
  }
  return { success: true };
});

export const getSheetsSettings = functions.https.onCall(async () => getSheetsSettingsFromStore());
export const saveSheetsSettings = functions.https.onCall(async (data: any) => {
  await saveSheetsSettingsToStore(data);
  return { success: true };
});
export const connectSheets = functions.https.onCall(async () => connectSheetsSettings());
export const listSheetColumns = functions.https.onCall(async (data: any) => {
  const settings = await getSheetsSettingsFromStore();
  return listSheetColumnsFromSheets({ ...settings, ...data });
});
