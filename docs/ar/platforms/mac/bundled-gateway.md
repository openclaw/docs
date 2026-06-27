---
read_when:
    - حزم OpenClaw.app
    - تصحيح أخطاء خدمة launchd الخاصة بـ Gateway على macOS
    - تثبيت CLI الخاصة بـ Gateway على macOS
summary: وقت تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-06-27T17:58:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لم يعد OpenClaw.app يضم Node/Bun أو وقت تشغيل Gateway. يتوقع تطبيق macOS
تثبيت CLI `openclaw` **خارجيًا**، ولا يشغّل Gateway كعملية
فرعية، ويدير خدمة launchd لكل مستخدم لإبقاء Gateway
قيد التشغيل (أو يتصل بـ Gateway محلي موجود إذا كان يعمل بالفعل).

## تثبيت CLI (مطلوب للوضع المحلي)

Node 24 هو وقت التشغيل الافتراضي على Mac. ما زال Node 22 LTS، حاليًا `22.19+`، يعمل للتوافق. بعد ذلك ثبّت `openclaw` عالميًا:

```bash
npm install -g openclaw@<version>
```

يشغّل زر **تثبيت CLI** في تطبيق macOS مسار التثبيت العالمي نفسه الذي يستخدمه التطبيق
داخليًا: يفضّل npm أولًا، ثم pnpm، ثم bun إذا كان هو مدير الحزم الوحيد
المكتشف. يظل Node وقت تشغيل Gateway الموصى به.

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

- يفعّل/يعطّل "OpenClaw Active" الـ LaunchAgent.
- لا يوقف إنهاء التطبيق الـ gateway (يبقيه launchd قيد التشغيل).
- إذا كان Gateway يعمل بالفعل على المنفذ المضبوط، يتصل التطبيق
  به بدلًا من بدء واحد جديد.

التسجيل:

- stdout الخاص بـ launchd: `~/Library/Logs/openclaw/gateway.log` (تستخدم الملفات الشخصية `gateway-<profile>.log`)
- stderr الخاص بـ launchd: مكبوت

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار gateway مقابل إصداره هو. إذا كانا
غير متوافقين، فحدّث CLI العالمي ليطابق إصدار التطبيق.

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
