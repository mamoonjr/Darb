# Darb (درب)

تطبيق توصيل ونقل — MVP كامل مع خرائط، GPS، دفع، إشعارات، تقييم، ولوحة تحكم.

## هيكل المشروع

```
Darb/
├── backend/     # API (Express + Prisma + PostgreSQL + Socket.io)
├── mobile/      # تطبيق Expo React Native
├── admin/       # لوحة تحكم Admin (React + Vite)
├── docs/        # التوثيق
└── docker-compose.yml  # PostgreSQL للتطوير والإنتاج
```

## المتطلبات

- Node.js 18+
- Docker (لـ PostgreSQL)
- Expo Go أو محاكي Android/iOS
- Google Maps API Key (للخرائط)

## التشغيل السريع

### 1. قاعدة البيانات (PostgreSQL)

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

الـ API: `http://localhost:3000`

### 3. Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

> على جهاز حقيقي، غيّر `localhost` إلى IP جهازك في `mobile/.env`  
> أضف Google Maps API Key في `mobile/app.json` و `.env`

### 4. Admin Dashboard

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

لوحة التحكم: `http://localhost:5173`

## حسابات تجريبية

| الدور   | البريد            | كلمة المرور  |
|---------|-------------------|--------------|
| راكب    | rider@darb.app    | password123  |
| سائق    | driver@darb.app   | password123  |
| مدير    | admin@darb.app    | password123  |

## الميزات المُنفّذة

- **خرائط Google Maps** — اختيار نقطة الانطلاق والوجهة على الخريطة
- **تتبّع GPS فعلي** — السائق يرسل موقعه كل 4 ثوانٍ أثناء الرحلة
- **الدفع الإلكتروني** — بطاقة / مدى / Apple Pay (بوابة mock جاهزة للربط مع Stripe/Tap)
- **إشعارات Push** — Expo Push عند تغيّر حالة الرحلة
- **نظام التقييم** — تقييم السائق 1–5 نجوم بعد اكتمال الرحلة
- **لوحة تحكم Admin** — إحصائيات، مستخدمون، رحلات، سائقون متصلون
- **PostgreSQL** — قاعدة بيانات إنتاج مع Docker و Prisma Migrate

## API Endpoints

| Method | Path                         | الوصف                    |
|--------|------------------------------|--------------------------|
| GET    | /api/health                  | فحص الصحة                |
| POST   | /api/auth/register           | تسجيل                   |
| POST   | /api/auth/login              | دخول                    |
| GET    | /api/auth/me                 | الملف الشخصي            |
| PATCH  | /api/users/push-token        | تسجيل Push Token        |
| POST   | /api/rides                   | طلب رحلة                |
| GET    | /api/rides                   | قائمة الرحلات           |
| GET    | /api/rides/:id               | تفاصيل رحلة             |
| POST   | /api/rides/:id/accept        | قبول (سائق)             |
| PATCH  | /api/rides/:id/status        | تحديث الحالة            |
| POST   | /api/rides/:id/pay           | الدفع                   |
| GET    | /api/rides/:id/payment       | حالة الدفع              |
| POST   | /api/rides/:id/rate          | تقييم السائق            |
| PATCH  | /api/driver/location         | موقع السائق             |
| PATCH  | /api/driver/availability     | توفر السائق             |
| GET    | /api/admin/stats             | إحصائيات (Admin)        |
| GET    | /api/admin/users             | المستخدمون (Admin)      |
| PATCH  | /api/admin/users/:id/toggle  | تفعيل/إيقاف (Admin)     |
| GET    | /api/admin/rides             | الرحلات (Admin)         |
| GET    | /api/admin/drivers/active    | سائقون متصلون (Admin)   |

## الإنتاج

1. استخدم PostgreSQL مُدار (Railway, Supabase, AWS RDS)
2. عيّن `DATABASE_URL` في `.env`
3. `npm run db:migrate:deploy && npm run db:seed`
4. عيّن `PAYMENT_PROVIDER=stripe` أو `tap` مع مفاتيح API
5. أضف FCM/APNs credentials لـ Expo Push

## الترخيص

MIT
