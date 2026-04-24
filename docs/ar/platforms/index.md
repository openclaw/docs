---
read_when:
    - البحث عن دعم أنظمة التشغيل أو مسارات التثبيت
    - تحديد المكان المناسب لتشغيل Gateway
summary: نظرة عامة على دعم المنصات (Gateway + التطبيقات المصاحبة)
title: المنصات
x-i18n:
    generated_at: "2026-04-24T07:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

تُكتب نواة OpenClaw بلغة TypeScript. **Node هي بيئة التشغيل الموصى بها**.
ولا يُنصح باستخدام Bun مع Gateway — توجد مشكلات معروفة مع قناتي WhatsApp وTelegram؛
راجع [Bun (experimental)](/ar/install/bun) لمعرفة التفاصيل.

توجد تطبيقات مصاحبة لأنظمة macOS (تطبيق شريط القوائم) والعُقد المحمولة (iOS/Android). أما التطبيقات المصاحبة لـ Windows و
Linux فهي مخططة، لكن Gateway مدعومة بالكامل اليوم.
كما أن التطبيقات المصاحبة الأصلية لـ Windows مخططة أيضًا؛ ويُوصى بتشغيل Gateway عبر WSL2.

## اختر نظام التشغيل

- macOS: [macOS](/ar/platforms/macos)
- iOS: [iOS](/ar/platforms/ios)
- Android: [Android](/ar/platforms/android)
- Windows: [Windows](/ar/platforms/windows)
- Linux: [Linux](/ar/platforms/linux)

## VPS والاستضافة

- مركز VPS: [استضافة VPS](/ar/vps)
- Fly.io: [Fly.io](/ar/install/fly)
- Hetzner (Docker): [Hetzner](/ar/install/hetzner)
- GCP (Compute Engine): [GCP](/ar/install/gcp)
- Azure (Linux VM): [Azure](/ar/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/ar/install/exe-dev)

## روابط شائعة

- دليل التثبيت: [البدء](/ar/start/getting-started)
- دليل تشغيل Gateway: [Gateway](/ar/gateway)
- إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- حالة الخدمة: `openclaw gateway status`

## تثبيت خدمة Gateway (CLI)

استخدم أحد هذه الخيارات (جميعها مدعومة):

- المعالج (موصى به): `openclaw onboard --install-daemon`
- مباشر: `openclaw gateway install`
- تدفق الإعداد: `openclaw configure` → اختر **Gateway service**
- الإصلاح/الترحيل: `openclaw doctor` (يقترح تثبيت الخدمة أو إصلاحها)

يعتمد هدف الخدمة على نظام التشغيل:

- macOS: LaunchAgent (`ai.openclaw.gateway` أو `ai.openclaw.<profile>`؛ والقديم `com.openclaw.*`)
- Linux/WSL2: خدمة systemd للمستخدم (`openclaw-gateway[-<profile>].service`)
- Windows الأصلي: Scheduled Task (`OpenClaw Gateway` أو `OpenClaw Gateway (<profile>)`)، مع بديل عنصر تسجيل دخول في مجلد Startup لكل مستخدم إذا تم رفض إنشاء المهمة

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [تطبيق macOS](/ar/platforms/macos)
- [تطبيق iOS](/ar/platforms/ios)
