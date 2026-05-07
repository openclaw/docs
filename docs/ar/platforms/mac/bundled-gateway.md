---
read_when:
    - حزم OpenClaw.app
    - تصحيح أخطاء خدمة launchd الخاصة بـ Gateway على macOS
    - تثبيت Gateway CLI لنظام macOS
summary: وقت تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-05-07T13:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لم يعد OpenClaw.app يضم Node/Bun أو وقت تشغيل Gateway. يتوقع تطبيق macOS
تثبيت CLI `openclaw` **خارجي**، ولا يشغّل Gateway كعملية
فرعية، ويدير خدمة launchd خاصة بكل مستخدم لإبقاء Gateway
قيد التشغيل (أو يتصل بـ Gateway محلي موجود إذا كان أحدها قيد التشغيل بالفعل).

## تثبيت CLI (مطلوب للوضع المحلي)

Node 24 هو وقت التشغيل الافتراضي على Mac. لا يزال Node 22 LTS، حاليًا `22.16+`، يعمل للتوافق. ثم ثبّت `openclaw` عالميًا:

```bash
npm install -g openclaw@<version>
```

يشغّل زر **تثبيت CLI** في تطبيق macOS مسار التثبيت العالمي نفسه الذي يستخدمه التطبيق
داخليًا: يفضل npm أولًا، ثم pnpm، ثم bun إذا كان ذلك هو مدير الحزم الوحيد
المكتشف. يبقى Node وقت التشغيل الموصى به لـ Gateway.

## Launchd (Gateway بوصفه LaunchAgent)

التسمية:

- `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ قد يبقى القديم `com.openclaw.*`)

موقع Plist (لكل مستخدم):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (أو `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

المدير:

- يملك تطبيق macOS تثبيت/تحديث LaunchAgent في الوضع المحلي.
- يمكن لـ CLI تثبيته أيضًا: `openclaw gateway install`.

السلوك:

- يفعّل/يعطّل "OpenClaw نشط" LaunchAgent.
- لا يؤدي إنهاء التطبيق إلى إيقاف Gateway (يبقيه launchd قيد التشغيل).
- إذا كان Gateway قيد التشغيل بالفعل على المنفذ المكوّن، يتصل التطبيق به
  بدلًا من بدء واحد جديد.

التسجيل:

- stdout/err الخاص بـ launchd: `/tmp/openclaw/openclaw-gateway.log`

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار Gateway مقابل إصداره هو. إذا كانا
غير متوافقين، فحدّث CLI العالمي ليطابق إصدار التطبيق.

## فحص Smoke

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
