'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseAuth, firestoreDB } from '@/lib/firebase';
import { validateLibyanPhone, normalizePhone, generateOTP, generateUniqueSlug } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  Store, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

type Step = 'form' | 'otp' | 'success';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpError, setOtpError] = useState('');

  const startCountdown = useCallback(() => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    const normalizedPhone = normalizePhone(formData.phone);
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!validateLibyanPhone(normalizedPhone)) {
      newErrors.phone = 'رقم الهاتف غير صالح. مثال: 0912345678';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }

    const normalizedPhone = normalizePhone(formData.phone);

    setLoading(true);

    try {
      const checkEmailPromise = firestoreDB.getUserProfileByEmail(formData.email);
      const checkPhonePromise = firestoreDB.getUserProfileByPhone(normalizedPhone);

      const [emailExists, phoneExists] = await Promise.all([
        checkEmailPromise,
        checkPhonePromise,
      ]);

      if (emailExists) {
        setErrors((prev) => ({ ...prev, email: 'البريد الإلكتروني مستخدم بالفعل' }));
        toast.error('البريد الإلكتروني مستخدم بالفعل');
        setLoading(false);
        return;
      }

      if (phoneExists) {
        setErrors((prev) => ({ ...prev, phone: 'رقم الهاتف مستخدم بالفعل' }));
        toast.error('رقم الهاتف مستخدم بالفعل');
        setLoading(false);
        return;
      }

      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await firestoreDB.saveOTP(normalizedPhone, otpCode, expiresAt);

      toast.success(`رمز التحقق: ${otpCode}`, { 
        duration: 15000,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
        }
      });

      setStep('otp');
      startCountdown();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setOtpError('أدخل رمز التحقق المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      const normalizedPhone = normalizePhone(formData.phone);
      const otpRecord = await firestoreDB.getOTP(normalizedPhone);

      if (!otpRecord) {
        setOtpError('رمز التحقق غير موجود. اطلب رمزاً جديداً');
        setLoading(false);
        return;
      }

      if (otpRecord.verified) {
        setOtpError('رمز التحقق مستخدم مسبقاً');
        setLoading(false);
        return;
      }

      if (otpRecord.expiresAt < new Date()) {
        setOtpError('رمز التحقق منتهي الصلاحية');
        setLoading(false);
        return;
      }

      if (otpRecord.code !== otp) {
        const newAttempts = (otpRecord.attempts || 0) + 1;
        await firestoreDB.incrementOTPAttempts(normalizedPhone, otpRecord.attempts || 0);

        if (newAttempts >= 3) {
          await firestoreDB.deleteOTP(normalizedPhone);
          setOtpError('تم تجاوز عدد المحاولات. اطلب رمزاً جديداً');
          setCountdown(0);
          setLoading(false);
          return;
        }

        setOtpError(`رمز التحقق غير صحيح. محاولة ${newAttempts} من 3`);
        setLoading(false);
        return;
      }

      await firestoreDB.verifyOTP(normalizedPhone);

      const userCredential = await firebaseAuth.register(formData.email, formData.password);
      const user = userCredential.user;

      await firebaseAuth.updateUserProfile(user, formData.fullName);

      await firestoreDB.createUserProfile(user.uid, {
        email: formData.email,
        phone: normalizedPhone,
        fullName: formData.fullName,
        avatarUrl: null,
        role: 'merchant',
        subscriptionStatus: 'inactive',
        subscriptionExpiresAt: null,
      });

      const slug = generateUniqueSlug(formData.fullName, user.uid);

      await firestoreDB.createStore({
        ownerId: user.uid,
        slug: slug,
        name: formData.fullName + ' Store',
        description: '',
        templateId: 1,
        primaryColor: '#C5A059',
        secondaryColor: '#0A0A0A',
        logoUrl: null,
        isActive: true,
      });

      await firestoreDB.deleteOTP(normalizedPhone);

      setStep('success');

      setTimeout(() => {
        router.push('/store-builder');
      }, 2000);
    } catch (error: any) {
      console.error('Verification error:', error);

      if (error.code === 'auth/email-already-in-use') {
        setErrors((prev) => ({ ...prev, email: 'البريد الإلكتروني مستخدم بالفعل' }));
        toast.error('البريد الإلكتروني مستخدم بالفعل');
        setStep('form');
      } else if (error.code === 'auth/invalid-email') {
        setErrors((prev) => ({ ...prev, email: 'البريد الإلكتروني غير صالح' }));
        toast.error('البريد الإلكتروني غير صالح');
        setStep('form');
      } else if (error.code === 'auth/weak-password') {
        setErrors((prev) => ({ ...prev, password: 'كلمة المرور ضعيفة جداً' }));
        toast.error('كلمة المرور ضعيفة جداً');
        setStep('form');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('خطأ في الاتصال بالشبكة. تحقق من اتصالك');
      } else {
        toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(formData.phone);
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await firestoreDB.saveOTP(normalizedPhone, otpCode, expiresAt);

      toast.success(`رمز التحقق الجديد: ${otpCode}`, {
        duration: 15000,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
        }
      });

      setOtp('');
      setOtpError('');
      startCountdown();
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إعادة إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp('');
    setOtpError('');
    setCountdown(0);
  };

  const getInputIconClass = (fieldName: string) => {
    const hasError = errors[fieldName as keyof FormErrors];
    return `absolute right-3.5 top-3.5 transition-colors duration-200 ${
      hasError ? 'text-red-400' : 'text-gray-500 group-focus-within:text-gold'
    }`;
  };

  const getInputClass = (fieldName: string) => {
    const hasError = errors[fieldName as keyof FormErrors];
    return `w-full bg-gray-900/80 border rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-600 transition-all duration-200 ${
      hasError
        ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-gray-700 focus:border-gold focus:ring-2 focus:ring-gold/20'
    }`;
  };

  if (step === 'success') {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6 animate-pulse-gold">
          <CheckCircle2 className="text-green-400" size={40} />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">تم إنشاء الحساب بنجاح!</h2>
        <p className="text-gray-400 mb-6">جاري توجيهك إلى لوحة التحكم...</p>
        
        <div className="w-12 h-12 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gold-gradient mb-4 shadow-lg shadow-gold/20">
          <Store className="text-black" size={32} />
        </div>
        <h1 className="text-4xl font-extrabold gold-gradient-text mb-2">LibyShop</h1>
        <p className="text-gray-400 text-sm">أنشئ متجرك الإلكتروني في دقائق</p>
      </div>

      {step === 'form' ? (
        <form onSubmit={handleSubmitForm} className="space-y-4" noValidate>
          <div className="group">
            <label className="block text-sm text-gray-400 mb-1.5 mr-1">
              الاسم الكامل <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className={getInputIconClass('fullName')} size={18} />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="محمد أحمد"
                className={getInputClass('fullName')}
              />
            </div>
            {errors.fullName && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 mr-1 animate-fade-in">
                <AlertCircle size={12} />
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm text-gray-400 mb-1.5 mr-1">
              البريد الإلكتروني <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className={getInputIconClass('email')} size={18} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={getInputClass('email')}
                dir="ltr"
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 mr-1 animate-fade-in">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm text-gray-400 mb-1.5 mr-1">
              رقم الهاتف <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className={getInputIconClass('phone')} size={18} />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className={getInputClass('phone')}
                dir="ltr"
              />
            </div>
            {errors.phone ? (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 mr-1 animate-fade-in">
                <AlertCircle size={12} />
                {errors.phone}
              </p>
            ) : (
              <p className="text-xs text-gray-600 mt-1 mr-1">
                أدخل الرقم بصيغة: 09XXXXXXXX
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm text-gray-400 mb-1.5 mr-1">
              كلمة المرور <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className={getInputIconClass('password')} size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`${getInputClass('password')} pl-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 mr-1 animate-fade-in">
                <AlertCircle size={12} />
                {errors.password}
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-sm text-gray-400 mb-1.5 mr-1">
              تأكيد كلمة المرور <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className={getInputIconClass('confirmPassword')} size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`${getInputClass('confirmPassword')} pl-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 mr-1 animate-fade-in">
                <AlertCircle size={12} />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-lift mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                جاري التسجيل...
              </span>
            ) : (
              'إنشاء حساب'
            )}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            لديك حساب بالفعل؟{' '}
            <Link 
              href="/login" 
              className="text-gold hover:underline font-medium transition-colors"
            >
              تسجيل الدخول
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/20 mb-4">
              <ShieldCheck className="text-gold" size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">التحقق من رقم الهاتف</h2>
            <p className="text-gray-400 text-sm">
              أدخل رمز التحقق المرسل إلى{' '}
              <span className="text-gold font-bold" dir="ltr">
                {normalizePhone(formData.phone)}
              </span>
            </p>
          </div>

          <div className="flex justify-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value);
                if (otpError) setOtpError('');
              }}
              className={`w-full max-w-[240px] bg-gray-900/80 border rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white placeholder-gray-600 transition-all duration-200 ${
                otpError
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-700 focus:border-gold focus:ring-2 focus:ring-gold/20'
              }`}
              dir="ltr"
              placeholder="______"
              autoFocus
            />
          </div>

          {otpError && (
            <p className="flex items-center justify-center gap-1.5 text-red-400 text-sm animate-fade-in">
              <AlertCircle size={14} />
              {otpError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full gold-gradient text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                جاري التحقق...
              </span>
            ) : (
              'تأكيد'
            )}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-500 text-sm">
                إعادة الإرسال بعد{' '}
                <span className="text-gold font-bold">{countdown}</span>{' '}
                ثانية
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-gold hover:underline text-sm font-medium disabled:opacity-50 transition-colors"
              >
                إعادة إرسال الرمز
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleBackToForm}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm py-2"
          >
            <ArrowLeft size={16} />
            تعديل البيانات
          </button>
        </form>
      )}
    </div>
  );
}
