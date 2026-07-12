---
read_when:
    - البحث عن دعم أنظمة التشغيل أو مسارات التثبيت
    - تحديد مكان تشغيل Gateway
summary: نظرة عامة على دعم المنصات (Gateway + التطبيقات المصاحبة)
title: المنصات
x-i18n:
    generated_at: "2026-07-12T06:12:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

نواة OpenClaw مكتوبة بلغة TypeScript. **Node هي بيئة التشغيل الموصى بها**.
لا يُنصح باستخدام Bun مع Gateway — بسبب مشكلات معروفة في قنوات WhatsApp و
Telegram؛ راجع [Bun (تجريبي)](/ar/install/bun) لمزيد من التفاصيل.

تتوفر تطبيقات مصاحبة لـ Windows Hub وmacOS (تطبيق شريط القوائم) والعُقد المحمولة
(iOS/Android). تطبيقات Linux المصاحبة مخطط لها، لكن Gateway مدعومة بالكامل
حاليًا. على Windows، اختر Windows Hub لتطبيق سطح المكتب، أو التثبيت الأصلي عبر
PowerShell للاستخدام الذي يركز على الطرفية، أو WSL2 للحصول على بيئة تشغيل
Gateway الأكثر توافقًا مع Linux.

## اختر نظام التشغيل

- macOS: [macOS](/ar/platforms/macos)
- iOS: [iOS](/ar/platforms/ios)
- Android: [Android](/ar/platforms/android)
- Windows: [Windows](/ar/platforms/windows)
- Linux: [Linux](/ar/platforms/linux)

## الخوادم الافتراضية الخاصة والاستضافة

- مركز VPS: [استضافة VPS](/ar/vps)
- Fly.io: [Fly.io](/ar/install/fly)
- Hetzner (Docker): [Hetzner](/ar/install/hetzner)
- GCP ‏(Compute Engine): [GCP](/ar/install/gcp)
- Azure ‏(جهاز Linux افتراضي): [Azure](/ar/install/azure)
- exe.dev (جهاز افتراضي + وكيل HTTPS): [exe.dev](/ar/install/exe-dev)
- EasyRunner ‏(Podman + Caddy): [EasyRunner](/ar/platforms/easyrunner)

## روابط شائعة

- دليل التثبيت: [بدء الاستخدام](/ar/start/getting-started)
- Windows Hub: [Windows](/ar/platforms/windows)
- دليل تشغيل Gateway: [Gateway](/ar/gateway)
- تهيئة Gateway: [التهيئة](/ar/gateway/configuration)
- حالة الخدمة: `openclaw gateway status`

## تثبيت خدمة Gateway ‏(CLI)

استخدم أحد الخيارات التالية (جميعها مدعومة):

- المعالج (موصى به): `openclaw onboard --install-daemon`
- مباشرةً: `openclaw gateway install`
- مسار التهيئة: `openclaw configure` ← اختر **خدمة Gateway**
- الإصلاح/الترحيل: `openclaw doctor` (يعرض تثبيت الخدمة أو إصلاحها)

تعتمد الخدمة المستهدفة على نظام التشغيل:

- macOS: ‏LaunchAgent ‏(`ai.openclaw.gateway`، أو `ai.openclaw.<profile>` لملف تعريف مُسمّى)
- Linux/WSL2: خدمة مستخدم systemd ‏(`openclaw-gateway[-<profile>].service`)
- Windows الأصلي: مهمة مجدولة (`OpenClaw Gateway` أو `OpenClaw Gateway (<profile>)`)، مع عنصر احتياطي لتسجيل الدخول في مجلد Startup لكل مستخدم إذا رُفض إنشاء المهمة

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Windows Hub](/ar/platforms/windows)
- [تطبيق macOS](/ar/platforms/macos)
- [تطبيق iOS](/ar/platforms/ios)
