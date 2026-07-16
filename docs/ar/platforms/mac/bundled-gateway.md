---
read_when:
    - حزم OpenClaw.app
    - تصحيح أخطاء خدمة Gateway ‏launchd على macOS
    - تثبيت CLI الخاص بـ Gateway لنظام macOS
summary: وقت تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-07-16T14:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لا تتضمن OpenClaw.app حزمة Node أو بيئة تشغيل Gateway. يتوقع تطبيق macOS
تثبيتًا **خارجيًا** لـ CLI ‏`openclaw`، ولا يشغّل Gateway كعملية
فرعية، ويدير خدمة launchd لكل مستخدم لإبقاء Gateway
قيد التشغيل (أو يتصل بـ Gateway محلي قيد التشغيل بالفعل).

## الإعداد التلقائي

على جهاز Mac جديد، اختر **This Mac** أثناء الإعداد الأولي. يشغّل التطبيق
برنامج التثبيت النصي الموقّع والمضمّن قبل معالج Gateway: إذ يثبّت
بيئة تشغيل Node ضمن مساحة المستخدم وCLI ‏`openclaw` المطابق ضمن `~/.openclaw`،
ثم يثبّت خدمة launchd لكل مستخدم ويشغّلها. لا يتطلب هذا المسار
Terminal أو Homebrew أو صلاحيات المسؤول.

لا يتضمن التطبيق سوى برنامج التثبيت النصي، وليس حزمة Node أو Gateway؛
يتطلب الإعداد اتصالًا بالإنترنت لتنزيل بيئة التشغيل وحزمة
OpenClaw المطابقة.

## الاسترداد اليدوي

يوصى باستخدام Node 24.15+ للتثبيت اليدوي؛ ويعمل Node 22.22.3+ أيضًا. ثبّت
`openclaw` عموميًا:

```bash
npm install -g openclaw@<version>
```

استخدم **Retry setup** بعد فشل الإعداد التلقائي. إذا استمر الفشل،
فثبّت CLI يدويًا باستخدام الأمر أعلاه، ثم اختر **Check again**
أثناء الإعداد الأولي.

## Launchd ‏(Gateway بصفته LaunchAgent)

التسمية: `ai.openclaw.gateway` (الملف الشخصي الافتراضي)، أو `ai.openclaw.<profile>`
لملف شخصي مسمّى.

موقع ملف Plist (لكل مستخدم): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(أو `ai.openclaw.<profile>.plist`).

يتولى تطبيق macOS تثبيت LaunchAgent وتحديثه للملف الشخصي الافتراضي في
الوضع المحلي. ويمكن لـ CLI أيضًا تثبيته مباشرةً: `openclaw gateway install`
(تُحدَّد الملفات الشخصية المسمّاة عبر متغير البيئة `OPENCLAW_PROFILE`).

السلوك:

- يؤدي "OpenClaw Active" إلى تمكين LaunchAgent أو تعطيله.
- لا يؤدي إنهاء التطبيق إلى إيقاف Gateway (يبقيه launchd قيد التشغيل).
- إذا كان Gateway قيد التشغيل بالفعل على المنفذ المُهيّأ، يتصل التطبيق
  به بدلًا من تشغيل واحد جديد.

التسجيل:

- المخرجات القياسية لـ launchd: ‏`~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية
  `gateway-<profile>.log`)
- الأخطاء القياسية لـ launchd: معطّلة
- إذا دخل المضيف في حلقة تتكرر فيها `EADDRINUSE` أو عمليات إعادة تشغيل سريعة، فتحقق من
  وجود LaunchAgents مكررة من `ai.openclaw.gateway` / `ai.openclaw.node` ومن
  الحل البديل الخاص بعلامة launchd في
  [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار Gateway مقارنةً بإصداره. يشغّل الإعداد الأولي
الإعداد المُدار تلقائيًا عندما يكون CLI الحالي مفقودًا أو
غير متوافق. استخدم **Retry setup** لتكرار التثبيت، أو **Check again**
بعد إصلاح CLI خارجي.

## دليل الحالة على macOS

احتفظ بحالة OpenClaw على قرص محلي غير متزامن. تجنّب iCloud Drive وغيره من
المجلدات المتزامنة سحابيًا؛ فقد يؤثر تأخر المزامنة وأقفال الملفات في الجلسات
وبيانات الاعتماد وحالة Gateway.

اضبط `OPENCLAW_STATE_DIR` على مسار محلي فقط عند الحاجة إلى تجاوز.
يحذّر `openclaw doctor` من مسارات الحالة الشائعة المتزامنة سحابيًا ويوصي
بالعودة إلى التخزين المحلي. راجع
[متغيرات البيئة](/ar/help/environment#path-related-env-vars) و
[Doctor](/ar/gateway/doctor).

## تصحيح اتصال التطبيق

استخدم CLI الخاص بتصحيح أخطاء macOS من نسخة مصدرية لاختبار مصافحة
WebSocket نفسها ومنطق الاكتشاف في Gateway اللذين يستخدمهما التطبيق:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

يقبل `connect` الخيارات `--url` و`--token` و`--timeout` و`--probe` و`--json`
(بالإضافة إلى تجاوزات هوية العميل؛ شغّله باستخدام `--help` لعرض القائمة الكاملة).
يقبل `discover` الخيارات `--timeout` و`--json` و`--include-local`. قارن
مخرجات الاكتشاف مع `openclaw gateway discover --json` عندما تحتاج إلى
فصل مشكلات اكتشاف CLI عن مشكلات الاتصال من جانب التطبيق.

## فحص تمهيدي

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

ثم:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
