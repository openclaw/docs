---
read_when:
    - البحث عن دعم أنظمة التشغيل أو مسارات التثبيت
    - تحديد مكان تشغيل Gateway
summary: نظرة عامة على دعم المنصات (Gateway + التطبيقات المرافقة)
title: المنصات
x-i18n:
    generated_at: "2026-05-06T08:03:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

جوهر OpenClaw مكتوب بلغة TypeScript. **Node هو وقت التشغيل الموصى به**.
لا يُوصى باستخدام Bun مع Gateway بسبب مشكلات معروفة في قنوات WhatsApp و
Telegram؛ راجع [Bun (تجريبي)](/ar/install/bun) للتفاصيل.

تتوفر تطبيقات مرافقة لنظام macOS (تطبيق شريط القوائم) والعُقد المحمولة (iOS/Android). تطبيقات Windows و
Linux المرافقة مخطط لها، لكن Gateway مدعوم بالكامل اليوم.
كما أن التطبيقات المرافقة الأصلية لنظام Windows مخطط لها أيضًا؛ ويوصى باستخدام Gateway عبر WSL2.

## اختر نظام التشغيل لديك

- macOS: [macOS](/ar/platforms/macos)
- iOS: [iOS](/ar/platforms/ios)
- Android: [Android](/ar/platforms/android)
- Windows: [Windows](/ar/platforms/windows)
- Linux: [Linux](/ar/platforms/linux)

## الخوادم الافتراضية والاستضافة

- مركز VPS: [استضافة VPS](/ar/vps)
- Fly.io: [Fly.io](/ar/install/fly)
- Hetzner (Docker): [Hetzner](/ar/install/hetzner)
- GCP (Compute Engine): [GCP](/ar/install/gcp)
- Azure (Linux VM): [Azure](/ar/install/azure)
- exe.dev (VM + وكيل HTTPS): [exe.dev](/ar/install/exe-dev)

## روابط شائعة

- دليل التثبيت: [بدء الاستخدام](/ar/start/getting-started)
- دليل تشغيل Gateway: [Gateway](/ar/gateway)
- إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- حالة الخدمة: `openclaw gateway status`

## تثبيت خدمة Gateway (CLI)

استخدم أحد هذه الخيارات (كلها مدعومة):

- المعالج (موصى به): `openclaw onboard --install-daemon`
- مباشر: `openclaw gateway install`
- مسار الإعداد: `openclaw configure` → حدّد **خدمة Gateway**
- الإصلاح/الترحيل: `openclaw doctor` (يعرض تثبيت الخدمة أو إصلاحها)

يعتمد هدف الخدمة على نظام التشغيل:

- macOS: LaunchAgent (`ai.openclaw.gateway` أو `ai.openclaw.<profile>`؛ القديم `com.openclaw.*`)
- Linux/WSL2: خدمة مستخدم systemd (`openclaw-gateway[-<profile>].service`)
- Windows الأصلي: مهمة مجدولة (`OpenClaw Gateway` أو `OpenClaw Gateway (<profile>)`)، مع عنصر تسجيل دخول احتياطي في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [تطبيق macOS](/ar/platforms/macos)
- [تطبيق iOS](/ar/platforms/ios)
