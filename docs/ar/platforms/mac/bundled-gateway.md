---
read_when:
    - تغليف OpenClaw.app
    - تصحيح أخطاء خدمة Gateway launchd على macOS
    - تثبيت CLI الخاص بـ Gateway لنظام macOS
summary: وقت تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-07-04T06:36:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لم يعد OpenClaw.app يضم Node/Bun أو وقت تشغيل Gateway. يتوقع تطبيق macOS
تثبيتًا **خارجيًا** لـ CLI باسم `openclaw`، ولا يشغّل Gateway كعملية فرعية،
ويدير خدمة launchd لكل مستخدم لإبقاء Gateway قيد التشغيل (أو يتصل بـ Gateway
محلي موجود إذا كان يعمل بالفعل).

## الإعداد التلقائي

على Mac جديد، اختر **هذا الـ Mac** أثناء التهيئة. يشغّل التطبيق المثبّت الموقّع
المضمّن قبل معالج Gateway، ويثبّت وقت تشغيل Node في مساحة المستخدم
وحزمة CLI المطابقة `openclaw` ضمن `~/.openclaw`، ثم يثبّت خدمة launchd لكل
مستخدم ويبدأها. لا يتطلب هذا المسار Terminal أو Homebrew أو صلاحيات مسؤول.

يضم التطبيق سكربت المثبّت، وليس حمولة Node أو Gateway. لذلك يحتاج الإعداد
إلى اتصال بالإنترنت لتنزيل وقت التشغيل وحزمة OpenClaw المطابقة.

## الاسترداد اليدوي

يوصى باستخدام Node 24 للتثبيت اليدوي. يعمل أيضًا Node 22 LTS، حاليًا `22.19+`.
ثم ثبّت `openclaw` عالميًا:

```bash
npm install -g openclaw@<version>
```

استخدم **إعادة محاولة الإعداد** بعد فشل الإعداد التلقائي. إذا استمر الفشل، ثبّت
CLI يدويًا باستخدام الأمر أعلاه، ثم اختر **التحقق مرة أخرى** في التهيئة.
يبقى Node وقت تشغيل Gateway الموصى به.

## Launchd (Gateway كـ LaunchAgent)

التسمية:

- `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ قد تبقى `com.openclaw.*` القديمة)

موقع Plist (لكل مستخدم):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (أو `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

المدير:

- يملك تطبيق macOS تثبيت/تحديث LaunchAgent في الوضع المحلي.
- يمكن لـ CLI تثبيته أيضًا: `openclaw gateway install`.

السلوك:

- يفعّل/يعطّل "OpenClaw نشط" الـ LaunchAgent.
- لا يؤدي إنهاء التطبيق إلى إيقاف Gateway (يبقيه launchd حيًا).
- إذا كان Gateway يعمل بالفعل على المنفذ المضبوط، يتصل التطبيق به بدلًا من
  بدء Gateway جديد.

التسجيل:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية `gateway-<profile>.log`)
- launchd stderr: مكبوت

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار Gateway مقارنة بإصداره. تشغّل التهيئة الإعداد
المُدار تلقائيًا عندما يكون CLI موجودًا مفقودًا أو غير متوافق. استخدم
**إعادة محاولة الإعداد** لتكرار التثبيت أو **التحقق مرة أخرى** بعد إصلاح CLI خارجي.

## دليل الحالة على macOS

احتفظ بحالة OpenClaw على قرص محلي غير متزامن. تجنّب iCloud Drive والمجلدات
الأخرى المتزامنة سحابيًا لأن زمن تأخر المزامنة وأقفال الملفات يمكن أن تؤثر في
الجلسات، وبيانات الاعتماد، وحالة Gateway.

اضبط `OPENCLAW_STATE_DIR` إلى مسار محلي فقط عندما تحتاج إلى تجاوز.
يحذّر `openclaw doctor` من مسارات الحالة الشائعة المتزامنة سحابيًا ويوصي
بالعودة إلى التخزين المحلي. راجع
[متغيرات البيئة](/ar/help/environment#path-related-env-vars) و
[Doctor](/ar/gateway/doctor).

## تصحيح اتصال التطبيق

استخدم CLI التصحيح الخاص بـ macOS من نسخة مصدرية لاختبار مصافحة WebSocket
الخاصة بـ Gateway ومنطق الاكتشاف نفسه الذي يستخدمه التطبيق:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

يقبل `connect` الخيارات `--url` و`--token` و`--timeout` و`--json`. ويقبل
`discover` الخيارات `--timeout` و`--json` و`--include-local`. قارِن مخرجات
الاكتشاف مع `openclaw gateway discover --json` عندما تحتاج إلى فصل اكتشاف CLI
عن مشكلات الاتصال من جانب التطبيق.

## فحص سريع

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

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
