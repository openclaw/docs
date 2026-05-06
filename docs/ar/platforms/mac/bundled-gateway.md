---
read_when:
    - حزم OpenClaw.app
    - استكشاف أخطاء خدمة Gateway launchd على macOS وإصلاحها
    - تثبيت CLI الخاص بـ Gateway لنظام macOS
summary: بيئة تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
    generated_at: "2026-05-06T08:04:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

لم يعد OpenClaw.app يضم Node/Bun أو بيئة تشغيل Gateway. يتوقع تطبيق macOS
تثبيت CLI `openclaw` **خارجيًا**، ولا يشغّل Gateway كعملية فرعية،
ويدير خدمة launchd لكل مستخدم لإبقاء Gateway
قيد التشغيل (أو يتصل بـ Gateway محلي موجود إذا كان يعمل بالفعل).

## ثبّت CLI (مطلوب للوضع المحلي)

Node 24 هو بيئة التشغيل الافتراضية على Mac. ما زال Node 22 LTS، حاليًا `22.14+`، يعمل للتوافق. ثم ثبّت `openclaw` عالميًا:

```bash
npm install -g openclaw@<version>
```

يشغّل زر **تثبيت CLI** في تطبيق macOS مسار التثبيت العالمي نفسه الذي يستخدمه التطبيق
داخليًا: يفضّل npm أولًا، ثم pnpm، ثم bun إذا كان هذا هو مدير الحزم الوحيد
المكتشف. يظل Node بيئة تشغيل Gateway الموصى بها.

## Launchd (Gateway بوصفه LaunchAgent)

التسمية:

- `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ قد تبقى `com.openclaw.*` القديمة)

موقع Plist (لكل مستخدم):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (أو `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

المدير:

- يملك تطبيق macOS تثبيت/تحديث LaunchAgent في الوضع المحلي.
- يمكن لـ CLI تثبيته أيضًا: `openclaw gateway install`.

السلوك:

- يفعّل/يعطّل "OpenClaw نشط" LaunchAgent.
- لا يؤدي إنهاء التطبيق إلى إيقاف Gateway (يبقيه launchd قيد التشغيل).
- إذا كان Gateway يعمل بالفعل على المنفذ المكوّن، يتصل التطبيق
  به بدلًا من بدء واحد جديد.

التسجيل:

- خرج/خطأ launchd: `/tmp/openclaw/openclaw-gateway.log`

## توافق الإصدارات

يتحقق تطبيق macOS من إصدار Gateway مقابل إصداره الخاص. إذا كانا
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

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
