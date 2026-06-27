---
read_when:
    - البحث عن دعم نظام التشغيل أو مسارات التثبيت
    - تحديد مكان تشغيل Gateway
summary: نظرة عامة على دعم المنصات (Gateway + التطبيقات المرافقة)
title: المنصات
x-i18n:
    generated_at: "2026-06-27T17:57:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core مكتوب بلغة TypeScript. **Node هو وقت التشغيل الموصى به**.
لا يُنصح باستخدام Bun مع Gateway — توجد مشكلات معروفة في قنوات WhatsApp و
Telegram؛ راجع [Bun (تجريبي)](/ar/install/bun) للتفاصيل.

توجد تطبيقات مرافقة لـ Windows Hub وmacOS (تطبيق شريط القوائم) والعُقد المحمولة
(iOS/Android). تطبيقات Linux المرافقة مخطط لها، لكن Gateway مدعوم بالكامل
اليوم. على Windows، اختر Windows Hub لتطبيق سطح المكتب، أو تثبيت PowerShell
الأصلي للاستخدام الذي يبدأ من الطرفية، أو WSL2 للحصول على وقت تشغيل Gateway
الأكثر توافقًا مع Linux.

## اختر نظام التشغيل لديك

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
- exe.dev (VM + وكيل HTTPS): [exe.dev](/ar/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/ar/platforms/easyrunner)

## روابط شائعة

- دليل التثبيت: [بدء الاستخدام](/ar/start/getting-started)
- Windows Hub: [Windows](/ar/platforms/windows)
- دليل تشغيل Gateway: [Gateway](/ar/gateway)
- تهيئة Gateway: [التهيئة](/ar/gateway/configuration)
- حالة الخدمة: `openclaw gateway status`

## تثبيت خدمة Gateway (CLI)

استخدم أحد هذه الخيارات (كلها مدعومة):

- المعالج (موصى به): `openclaw onboard --install-daemon`
- مباشر: `openclaw gateway install`
- مسار التهيئة: `openclaw configure` ← اختر **خدمة Gateway**
- الإصلاح/الترحيل: `openclaw doctor` (يعرض تثبيت الخدمة أو إصلاحها)

يعتمد هدف الخدمة على نظام التشغيل:

- macOS: LaunchAgent (`ai.openclaw.gateway` أو `ai.openclaw.<profile>`؛ قديمًا `com.openclaw.*`)
- Linux/WSL2: خدمة مستخدم systemd (`openclaw-gateway[-<profile>].service`)
- Windows الأصلي: مهمة مجدولة (`OpenClaw Gateway` أو `OpenClaw Gateway (<profile>)`)، مع بديل عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Windows Hub](/ar/platforms/windows)
- [تطبيق macOS](/ar/platforms/macos)
- [تطبيق iOS](/ar/platforms/ios)
