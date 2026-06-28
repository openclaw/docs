---
read_when:
    - تحزيم OpenClaw.app
    - تصحيح أخطاء خدمة launchd الخاصة بـ Gateway على macOS
    - تثبيت CLI لـ Gateway على macOS
summary: تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-06-28T00:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لم يعد OpenClaw.app يضم Node/Bun أو وقت تشغيل Gateway. يتوقع تطبيق macOS
تثبيت CLI `openclaw` **خارجيًا**، ولا يشغّل Gateway كعملية
فرعية، ويدير خدمة launchd لكل مستخدم لإبقاء Gateway
قيد التشغيل (أو يتصل بـ Gateway محلي موجود إذا كان قيد التشغيل بالفعل).

## ثبّت CLI (مطلوب للوضع المحلي)

Node 24 هو وقت التشغيل الافتراضي على Mac. ما يزال Node 22 LTS، حاليًا `22.19+`، يعمل للتوافق. ثم ثبّت `openclaw` عالميًا:

```bash
npm install -g openclaw@<version>
```

زر **تثبيت CLI** في تطبيق macOS يشغّل مسار التثبيت العالمي نفسه الذي
يستخدمه التطبيق داخليًا: يفضّل npm أولًا، ثم pnpm، ثم bun إذا كان هو
مدير الحزم الوحيد المكتشف. يبقى Node وقت تشغيل Gateway الموصى به.

## launchd (Gateway بصفة LaunchAgent)

التسمية:

- `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ قد يبقى القديم `com.openclaw.*`)

موقع Plist (لكل مستخدم):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (أو `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

المدير:

- يملك تطبيق macOS تثبيت/تحديث LaunchAgent في الوضع المحلي.
- يمكن لـ CLI تثبيته أيضًا: `openclaw gateway install`.

السلوك:

- يفعّل "OpenClaw نشط" LaunchAgent أو يعطّله.
- لا يؤدي إنهاء التطبيق إلى إيقاف Gateway (يبقيه launchd نشطًا).
- إذا كان Gateway قيد التشغيل بالفعل على المنفذ المكوّن، يتصل التطبيق
  به بدلًا من بدء واحد جديد.

التسجيل:

- stdout الخاص بـ launchd: `~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية `gateway-<profile>.log`)
- stderr الخاص بـ launchd: مكتوم

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار Gateway مقابل إصداره هو. إذا كانا
غير متوافقين، فحدّث CLI العالمي ليطابق إصدار التطبيق.

## دليل الحالة على macOS

احتفظ بحالة OpenClaw على قرص محلي غير متزامن. تجنّب iCloud Drive والمجلدات
الأخرى المتزامنة مع السحابة، لأن تأخر المزامنة وأقفال الملفات يمكن أن تؤثر في الجلسات
وبيانات الاعتماد وحالة Gateway.

اضبط `OPENCLAW_STATE_DIR` على مسار محلي فقط عندما تحتاج إلى تجاوز.
يحذّر `openclaw doctor` من مسارات الحالة الشائعة المتزامنة مع السحابة ويوصي
بالعودة إلى التخزين المحلي. راجع
[متغيرات البيئة](/ar/help/environment#path-related-env-vars) و
[Doctor](/ar/gateway/doctor).

## تصحيح اتصال التطبيق

استخدم CLI تصحيح macOS من نسخة مصدرية لاختبار مصافحة WebSocket الخاصة بـ Gateway
ومنطق الاكتشاف نفسه الذي يستخدمه التطبيق:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

يقبل `connect` الخيارات `--url` و`--token` و`--timeout` و`--json`. يقبل `discover`
الخيارات `--timeout` و`--json` و`--include-local`. قارن مخرجات الاكتشاف
مع `openclaw gateway discover --json` عندما تحتاج إلى فصل اكتشاف CLI
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
