import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import clsx from 'clsx';
import { useFirebase } from '../context/FirebaseContext';

const appointmentSchema = z.object({
  fullName: z.string().min(3, 'Ad Soyad zorunludur.'),
  phone: z
    .string()
    .regex(/^0\d{3} \d{3} \d{2} \d{2}$/u, 'Telefon 0XXX XXX XX XX formatında olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  verificationCode: z.string().length(6, 'Kod 6 haneli olmalıdır.'),
  serviceId: z.string().min(1, 'Lütfen hizmet seçiniz.'),
  doctorId: z.string().min(1, 'Lütfen doktor seçiniz.'),
  date: z.string().min(1, 'Lütfen tarih seçiniz.'),
  time: z.string().min(1, 'Lütfen saat seçiniz.'),
  notes: z.string().optional()
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

type Step =
  | 'contact'
  | 'verification'
  | 'service'
  | 'doctor'
  | 'date'
  | 'time'
  | 'summary'
  | 'success';

const steps: Step[] = ['contact', 'verification', 'service', 'doctor', 'date', 'time', 'summary'];

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration: number;
  status: 'aktif' | 'pasif';
}

interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  services: string[];
  status: 'aktif' | 'pasif';
}

interface SlotItem {
  time: string;
  available: boolean;
}

const AppointmentWizard = () => {
  const [step, setStep] = useState<Step>('contact');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const { callFunction } = useFirebase();

  const methods = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      verificationCode: '',
      serviceId: '',
      doctorId: '',
      date: '',
      time: '',
      notes: ''
    }
  });

  const { watch, trigger, setValue, getValues } = methods;
  const selectedService = watch('serviceId');
  const selectedDoctor = watch('doctorId');
  const selectedTime = watch('time');
  const selectedDate = watch('date');

  const serviceFilteredDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.services.includes(selectedService)),
    [doctors, selectedService]
  );

  useEffect(() => {
    callFunction<ServiceItem[]>('listServices').then(setServices).catch(console.error);
    callFunction<DoctorItem[]>('listDoctors').then(setDoctors).catch(console.error);
  }, [callFunction]);

  useEffect(() => {
    if (!selectedService) {
      setValue('doctorId', '');
      return;
    }

    if (selectedDoctor && !serviceFilteredDoctors.some((doctor) => doctor.id === selectedDoctor)) {
      setValue('doctorId', '');
    }
  }, [selectedService, selectedDoctor, serviceFilteredDoctors, setValue]);

  useEffect(() => {
    setSlots([]);
    setValue('time', '');
  }, [selectedDoctor, selectedDate, setValue]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      callFunction<SlotItem[]>('listSlots', {
        doctorId: selectedDoctor,
        date: selectedDate
      }).then(setSlots);
    }
  }, [callFunction, selectedDoctor, selectedDate]);

  const nextStep = async () => {
    const currentIndex = steps.indexOf(step);
    const currentStep = steps[currentIndex];
    const fields: (keyof AppointmentFormValues)[] = {
      contact: ['fullName', 'phone', 'email'],
      verification: ['verificationCode'],
      service: ['serviceId'],
      doctor: ['doctorId'],
      date: ['date'],
      time: ['time'],
      summary: []
    }[currentStep];

    if (fields && fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) {
        return;
      }
    }

    if (currentStep === 'summary') {
      handleSubmit();
      return;
    }

    setStep(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSendVerification = async () => {
    const valid = await trigger(['fullName', 'phone', 'email']);
    if (!valid) return;
    setIsVerifying(true);
    try {
      await callFunction('sendVerificationCode', {
        email: getValues('email'),
        name: getValues('fullName'),
        phone: getValues('phone')
      });
      setStep('verification');
    } catch (error) {
      console.error(error);
      alert('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = getValues();
      await callFunction('bookAppointment', payload);
      setShowSuccess(true);
      setStep('success');
    } catch (error) {
      console.error(error);
      alert('Randevu oluşturulurken bir hata oluştu. Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'contact':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Randevu oluşturmak için lütfen iletişim bilgilerinizi giriniz.
            </p>
            <div className="grid gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...methods.register('fullName')}
                  placeholder="Adınız Soyadınız"
                />
                <ErrorText name="fullName" />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Telefon</span>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...methods.register('phone')}
                  placeholder="0XXX XXX XX XX"
                />
                <ErrorText name="phone" />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">E-posta</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...methods.register('email')}
                  placeholder="ornek@mail.com"
                />
                <ErrorText name="email" />
              </label>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white transition hover:bg-primary/90"
              onClick={handleSendVerification}
              disabled={isVerifying}
            >
              <EnvelopeIcon className="h-5 w-5" />
              {isVerifying ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
            </button>
          </div>
        );
      case 'verification':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-primary/5 p-4 text-sm text-primary">
              E-posta adresinize gönderilen 6 haneli kodu giriniz.
            </div>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Doğrulama Kodu</span>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...methods.register('verificationCode')}
                placeholder="000000"
                maxLength={6}
              />
              <ErrorText name="verificationCode" />
            </label>
            <WizardActions prev={prevStep} next={nextStep} />
          </div>
        );
      case 'service':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Hizmet Seçimi</h2>
            <p className="text-sm text-slate-600">
              Randevu almak istediğiniz hizmeti kartlardan seçiniz.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={clsx(
                    'flex flex-col rounded-2xl border px-5 py-4 text-left transition hover:shadow-md',
                    selectedService === service.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 bg-white'
                  )}
                  onClick={() => setValue('serviceId', service.id)}
                >
                  <span className="text-base font-semibold text-slate-900">{service.name}</span>
                  <span className="mt-2 text-sm text-slate-600">{service.description}</span>
                  <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {service.duration} dk
                  </span>
                </button>
              ))}
            </div>
            <ErrorText name="serviceId" />
            <WizardActions prev={prevStep} next={nextStep} />
          </div>
        );
      case 'doctor':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Doktor Seçimi</h2>
            <p className="text-sm text-slate-600">Seçilen hizmete uygun doktorlardan birini seçiniz.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {serviceFilteredDoctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  className={clsx(
                    'rounded-2xl border px-5 py-4 text-left transition hover:shadow-md',
                    selectedDoctor === doctor.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 bg-white'
                  )}
                  onClick={() => setValue('doctorId', doctor.id)}
                >
                  <span className="text-base font-semibold text-slate-900">{doctor.name}</span>
                  <span className="mt-1 text-sm text-primary">{doctor.specialty}</span>
                  <span className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircleIcon className="h-4 w-4" /> {doctor.services.length} hizmet
                  </span>
                </button>
              ))}
            </div>
            <ErrorText name="doctorId" />
            <WizardActions prev={prevStep} next={nextStep} />
          </div>
        );
      case 'date':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Tarih Seçimi</h2>
            <p className="text-sm text-slate-600">Uygun bir tarih seçiniz. Geçmiş tarihleri seçemezsiniz.</p>
            <input
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...methods.register('date')}
            />
            <ErrorText name="date" />
            <WizardActions prev={prevStep} next={nextStep} />
          </div>
        );
      case 'time':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Saat Seçimi</h2>
            <p className="text-sm text-slate-600">
              Uygun 30 dakikalık saat dilimlerinden birini seçiniz.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setValue('time', slot.time)}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-sm font-medium transition',
                    slot.available
                      ? selectedTime === slot.time
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary'
                      : 'cursor-not-allowed border-dashed border-slate-200 bg-slate-100 text-slate-400'
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            <ErrorText name="time" />
            <WizardActions prev={prevStep} next={nextStep} />
          </div>
        );
      case 'summary':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Randevu Özeti</h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <SummaryRow icon={<UserIcon className="h-5 w-5" />} label="Ad Soyad" value={watch('fullName')} />
              <SummaryRow
                icon={<PhoneIcon className="h-5 w-5" />} label="Telefon" value={watch('phone')}
              />
              <SummaryRow
                icon={<EnvelopeIcon className="h-5 w-5" />} label="E-posta" value={watch('email')}
              />
              <SummaryRow
                icon={<CheckCircleIcon className="h-5 w-5" />} label="Hizmet"
                value={services.find((s) => s.id === watch('serviceId'))?.name}
              />
              <SummaryRow
                icon={<CheckCircleIcon className="h-5 w-5" />} label="Doktor"
                value={doctors.find((d) => d.id === watch('doctorId'))?.name}
              />
              <SummaryRow
                icon={<CheckCircleIcon className="h-5 w-5" />} label="Tarih"
                value={watch('date') ? format(new Date(watch('date')), 'dd.MM.yyyy', { locale: tr }) : ''}
              />
              <SummaryRow
                icon={<CheckCircleIcon className="h-5 w-5" />} label="Saat" value={watch('time')}
              />
            </div>
            <div>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Notlar (opsiyonel)</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  {...methods.register('notes')}
                  placeholder="Eklemek istediğiniz bilgi varsa yazabilirsiniz."
                />
              </label>
            </div>
            <WizardActions prev={prevStep} next={nextStep} submitting={isSubmitting} />
          </div>
        );
      case 'success':
        return (
          <Transition.Root show={showSuccess} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setShowSuccess(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-slate-900/50" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                      <div className="flex flex-col items-center gap-4">
                        <CheckCircleIcon className="h-14 w-14 text-primary" />
                        <Dialog.Title className="text-2xl font-semibold text-slate-900">
                          Randevunuz Oluşturuldu
                        </Dialog.Title>
                        <p className="text-center text-sm text-slate-600">
                          Randevu detaylarınız e-posta adresinize gönderildi. Görüşmek üzere!
                        </p>
                        <button
                          type="button"
                          className="mt-4 rounded-lg bg-primary px-4 py-2 text-white"
                          onClick={() => {
                            setShowSuccess(false);
                            setStep('contact');
                            methods.reset();
                          }}
                        >
                          Yeni Randevu Oluştur
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition.Root>
        );
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row">
          <div className="lg:w-2/5">
            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Profesyonel Randevu</h1>
                  <p className="text-sm text-slate-600">Hızlı, güvenli ve profesyonel randevu yönetimi</p>
                </div>
              </div>
              <ol className="mt-8 space-y-4">
                {steps.map((s, idx) => (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                        steps.indexOf(step) === idx
                          ? 'bg-primary text-white'
                          : steps.indexOf(step) > idx
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{stepLabels[s]}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="lg:w-3/5">
            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <FormHeader step={step} />
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

const FormHeader = ({ step }: { step: Step }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-slate-900">{stepTitles[step]}</h2>
      <p className="text-sm text-slate-500">{stepSubtitles[step]}</p>
    </div>
  );
};

const WizardActions = ({
  prev,
  next,
  submitting
}: {
  prev: () => void;
  next: () => void;
  submitting?: boolean;
}) => {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={prev}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
      >
        <ArrowLeftIcon className="h-5 w-5" /> Geri
      </button>
      <button
        type="button"
        onClick={next}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
        disabled={submitting}
      >
        {submitting ? 'Kaydediliyor...' : 'Devam Et'}
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const SummaryRow = ({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

const ErrorText = ({ name }: { name: keyof AppointmentFormValues }) => {
  const {
    formState: { errors }
  } = useFormContextSafe();
  const error = errors[name]?.message;
  if (!error) return null;
  return <p className="text-xs text-red-500">{String(error)}</p>;
};

const useFormContextSafe = () => {
  try {
    return useFormContext();
  } catch (error) {
    throw new Error('Form bileşenleri FormProvider içinde kullanılmalıdır.');
  }
};

const stepLabels: Record<Step, string> = {
  contact: 'İletişim',
  verification: 'Doğrulama',
  service: 'Hizmet',
  doctor: 'Doktor',
  date: 'Tarih',
  time: 'Saat',
  summary: 'Özet',
  success: 'Başarı'
};

const stepTitles: Record<Step, string> = {
  contact: 'İletişim Bilgileri',
  verification: 'Doğrulama Kodu',
  service: 'Hizmetinizi Seçin',
  doctor: 'Doktorunuzu Seçin',
  date: 'Tarih Belirleyin',
  time: 'Saat Dilimi',
  summary: 'Randevu Özeti',
  success: 'Randevu Oluşturuldu'
};

const stepSubtitles: Record<Step, string> = {
  contact: 'Ad, telefon ve e-posta adresinizi giriniz.',
  verification: 'E-posta adresinize gelen kodu girin.',
  service: 'Size en uygun hizmeti seçin.',
  doctor: 'Doktor seçiminizi yapın.',
  date: 'Müsait bir gün belirleyin.',
  time: 'Uygun saat dilimini seçin.',
  summary: 'Bilgilerinizi gözden geçirin ve onaylayın.',
  success: 'Randevunuz başarıyla oluşturuldu.'
};

export default AppointmentWizard;
