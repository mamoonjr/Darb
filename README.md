<div align="center">

# 🚗 Darb (درب)

**منصة توصيل ونقل متكاملة — Ride-Hailing Platform**

تطبيق حجز رحلات كامل (MVP) مع خرائط، تتبّع GPS مباشر، دفع إلكتروني، إشعارات، تقييم، ولوحة تحكم إدارية.

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Docker-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [الميزات](#-الميزات)
- [التقنيات](#-التقنيات)
- [هيكل المشروع](#-هيكل-المشروع)
- [المتطلبات](#-المتطلبات)
- [التشغيل السريع](#-التشغيل-السريع)
- [حسابات تجريبية](#-حسابات-تجريبية)
- [واجهة الـ API](#-واجهة-ال-api)
- [أحداث WebSocket](#-أحداث-websocket)
- [دورة حياة الرحلة](#-دورة-حياة-الرحلة)
- [النشر للإنتاج](#-النشر-للإنتاج)
- [متغيّرات البيئة](#-متغيّرات-البيئة)
- [الترخيص](#-الترخيص)

---

## 🎯 نظرة عامة

**Darb** (درب) تطبيق حجز رحلات لمنطقة الشرق الأوسط، مشابه لـ Uber/Careem. يدعم ثلاثة أدوار:

| الدور | الوصف |
|-------|-------|
| 🧍 **الراكب (Rider)** | يطلب رحلة على الخريطة، يدفع، يتتبّع السائق مباشرة، ويقيّمه |
| 🚕 **السائق (Driver)** | يقبل الرحلات المدفوعة، يبثّ موقعه الحيّ، ويدير مراحل الرحلة |
| 🛠️ **المدير (Admin)** | لوحة تحكم للإحصائيات، المستخدمين، الرحلات، والسائقين المتصلين |

---

## ✨ الميزات

- 🗺️ **خرائط Google Maps** — اختيار نقطة الانطلاق والوجهة تفاعلياً
- 📍 **تتبّع GPS مباشر** — السائق يرسل موقعه كل 4 ثوانٍ أثناء الرحلة عبر Socket.io
- 💳 **دفع إلكتروني** — بطاقة / مدى / Apple Pay (بوابة mock جاهزة للربط مع Stripe/Tap)
- 🔔 **إشعارات Push** — عبر Expo Push عند تغيّر حالة الرحلة
- ⭐ **نظام تقييم** — تقييم السائق من 1 إلى 5 نجوم بعد اكتمال الرحلة
- 🌐 **تعدد اللغات** — عربي (افتراضي) وإنجليزي عبر i18next
- 🔐 **مصادقة آمنة** — JWT + bcrypt مع أدوار (RBAC)
- 📊 **لوحة تحكم إدارية** — إحصائيات، إيرادات، إدارة مستخدمين، ومراقبة الرحلات
- 🐘 **PostgreSQL للإنتاج** — عبر Docker و Prisma Migrate

---

## 🧰 التقنيات

| الطبقة | التقنية |
|--------|---------|
| **Backend** | Node.js · Express · Prisma · PostgreSQL |
| **Real-time** | Socket.io |
| **Mobile** | Expo (SDK 54) · React Native · react-native-maps |
| **Admin** | React 18 · Vite · React Router |
| **Push** | Expo Notifications + Push API |
| **Payments** | بوابة mock (جاهزة لـ Stripe / Tap) |
| **i18n** | i18next (عربي افتراضي، إنجليزي) |
| **Auth** | JWT + bcrypt |
| **Validation** | Zod |

---

## 📁 هيكل المشروع

```
Darb/
├── backend/            # API — Express + Prisma + PostgreSQL + Socket.io
│   ├── prisma/         # المخطط (schema)، الهجرات (migrations)، والبذور (seed)
│   └── src/            # المسارات، الخدمات، والوسطاء (middleware)
├── mobile/             # تطبيق Expo React Native
│   └── src/            # الشاشات، المكوّنات، الخدمات، الـ i18n
├── admin/              # لوحة تحكم Admin — React + Vite
├── docs/               # التوثيق (PRODUCT.md · API.md)
└── docker-compose.yml  # PostgreSQL للتطوير والإنتاج
```

---

## ⚙️ المتطلبات

- **Node.js** 18 أو أحدث
- **Docker** (لتشغيل PostgreSQL)
- **Expo Go** أو محاكي Android/iOS
- **Google Maps API Key** (للخرائط)

---

## 🚀 التشغيل السريع

### 1️⃣ قاعدة البيانات (PostgreSQL)

```bash
docker compose up -d
```

### 2️⃣ الخادم (Backend)

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup      # generate + migrate + seed
npm run dev
```
> الـ API متاح على: `http://localhost:3000`

### 3️⃣ تطبيق الجوال (Mobile)

```bash
cd mobile
cp .env.example .env
npm install
npm start
```
> 📱 على جهاز حقيقي: غيّر `localhost` إلى IP جهازك في `mobile/.env`، وأضف Google Maps API Key.

### 4️⃣ لوحة التحكم (Admin)

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```
> لوحة التحكم على: `http://localhost:5173`

---

## 👤 حسابات تجريبية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| 🧍 راكب | `rider@darb.app` | `password123` |
| 🚕 سائق | `driver@darb.app` | `password123` |
| 🛠️ مدير | `admin@darb.app` | `password123` |

---

## 🔌 واجهة الـ API

**Base URL:** `http://localhost:3000/api` — التفاصيل الكاملة في [`docs/API.md`](docs/API.md).

<details>
<summary>عرض أهم المسارات (Endpoints)</summary>

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/health` | فحص الصحة |
| POST | `/api/auth/register` | تسجيل |
| POST | `/api/auth/login` | دخول |
| GET | `/api/auth/me` | الملف الشخصي |
| PATCH | `/api/users/push-token` | تسجيل Push Token |
| POST | `/api/rides` | طلب رحلة |
| GET | `/api/rides` | قائمة الرحلات |
| GET | `/api/rides/:id` | تفاصيل رحلة |
| POST | `/api/rides/:id/accept` | قبول (سائق) |
| PATCH | `/api/rides/:id/status` | تحديث الحالة |
| POST | `/api/rides/:id/pay` | الدفع |
| GET | `/api/rides/:id/payment` | حالة الدفع |
| POST | `/api/rides/:id/rate` | تقييم السائق |
| PATCH | `/api/driver/location` | موقع السائق |
| PATCH | `/api/driver/availability` | توفّر السائق |
| GET | `/api/admin/stats` | إحصائيات (Admin) |
| GET | `/api/admin/users` | المستخدمون (Admin) |
| PATCH | `/api/admin/users/:id/toggle` | تفعيل/إيقاف (Admin) |
| GET | `/api/admin/rides` | الرحلات (Admin) |
| GET | `/api/admin/drivers/active` | سائقون متصلون (Admin) |

</details>

---

## 📡 أحداث WebSocket

الاتصال بـ `http://localhost:3000` مع `auth: { token: '<jwt>' }`.

| الحدث | الاتجاه | الحمولة |
|-------|---------|---------|
| `ride:join` / `ride:leave` | client → server | `rideId` |
| `ride:requested` | server → all | Ride object |
| `ride:accepted` | server → all | Ride object |
| `ride:updated` | server → room | Ride object |
| `driver:location` | bidirectional | `{ rideId, driverId, lat, lng }` |

---

## 🔄 دورة حياة الرحلة

```
REQUESTED → (pay) → ACCEPTED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED → (rate)
                 ↘ CANCELLED (من معظم الحالات)
```

---

## 🌍 النشر للإنتاج

1. استخدم PostgreSQL مُدار (Railway · Supabase · AWS RDS)
2. عيّن `DATABASE_URL` في `.env`
3. نفّذ: `npm run db:migrate:deploy && npm run db:seed`
4. عيّن `PAYMENT_PROVIDER=stripe` أو `tap` مع مفاتيح API الحقيقية
5. أضف بيانات FCM/APNs لـ Expo Push
6. ابنِ الجوال عبر EAS: `npm run build:android` / `npm run build:ios`

> ⚠️ **أمان:** لا تستخدم أبداً القيم التجريبية في الإنتاج. أنشئ `JWT_SECRET` وكلمات مرور قوية جديدة.

---

## 🔑 متغيّرات البيئة

كل جزء يحتوي ملف `.env.example` كمرجع:

- `backend/.env.example` — `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PAYMENT_PROVIDER`
- `mobile/.env.example` — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`, Google Maps Key
- `admin/.env.example` — `VITE_API_URL`

> ملفات `.env` الحقيقية مستبعدة من Git لحماية الأسرار.

---

## 📄 الترخيص

هذا المشروع مرخّص تحت رخصة **MIT**.

<div align="center">

صُنع بـ ❤️ لمنطقة الشرق الأوسط

</div>
