---
read_when:
    - تعبئة OpenClaw.app
    - تصحيح أخطاء خدمة launchd الخاصة بـ gateway على macOS
    - تثبيت CLI الخاصة بـ gateway على macOS
summary: بيئة تشغيل Gateway على macOS (خدمة launchd خارجية)
title: Gateway على macOS
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

لم يعد OpenClaw.app يضمّن Node/Bun أو بيئة تشغيل Gateway. يتوقع تطبيق macOS
وجود تثبيت **خارجي** لـ CLI باسم `openclaw`، ولا يقوم بتشغيل Gateway كعملية
فرعية، بل يدير خدمة launchd لكل مستخدم للحفاظ على تشغيل Gateway
(أو يتصل بـ Gateway محلية موجودة بالفعل إذا كانت تعمل مسبقًا).

## تثبيت CLI (مطلوب للوضع المحلي)

تُعد Node 24 بيئة التشغيل الافتراضية على Mac. وما تزال Node 22 LTS، حاليًا `22.14+`، تعمل من أجل التوافق. ثم ثبّت `openclaw` بشكل عام:

```bash
npm install -g openclaw@<version>
```

يقوم زر **Install CLI** في تطبيق macOS بتشغيل تدفق التثبيت العام نفسه الذي يستخدمه التطبيق
داخليًا: إذ يفضّل npm أولًا، ثم pnpm، ثم bun إذا كان هذا هو مدير الحزم
الوحيد المكتشف. وتظل Node هي بيئة تشغيل Gateway الموصى بها.

## launchd (Gateway كـ LaunchAgent)

التسمية:

- `ai.openclaw.gateway` (أو `ai.openclaw.<profile>`؛ وقد تبقى الأسماء القديمة `com.openclaw.*`)

موقع plist (لكل مستخدم):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (أو `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

المدير:

- يملك تطبيق macOS عملية تثبيت/تحديث LaunchAgent في الوضع المحلي.
- ويمكن لـ CLI أيضًا تثبيتها: `openclaw gateway install`.

السلوك:

- يؤدي خيار “OpenClaw Active” إلى تفعيل/تعطيل LaunchAgent.
- **إغلاق التطبيق** لا يوقف gateway (تحافظ launchd على بقائها حية).
- إذا كانت Gateway تعمل بالفعل على المنفذ المضبوط، فإن التطبيق يتصل
  بها بدلًا من بدء تشغيل واحدة جديدة.

التسجيل:

- stdout/err الخاصة بـ launchd: `/tmp/openclaw/openclaw-gateway.log`

## توافق الإصدارات

يفحص تطبيق macOS إصدار gateway مقارنةً بإصداره هو. وإذا كانا
غير متوافقين، فحدّث CLI المثبتة عالميًا لتطابق إصدار التطبيق.

## فحص smoke

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
