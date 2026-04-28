---
read_when:
    - إعداد بيئة تطوير macOS
summary: دليل إعداد للمطورين الذين يعملون على تطبيق OpenClaw لنظام macOS
title: إعداد تطوير macOS
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# إعداد تطوير macOS

يغطي هذا الدليل الخطوات اللازمة لبناء تطبيق OpenClaw لنظام macOS وتشغيله من المصدر.

## المتطلبات المسبقة

قبل بناء التطبيق، تأكد من تثبيت ما يلي:

1. **Xcode 26.2+**: مطلوب لتطوير Swift.
2. **Node.js 24 وpnpm**: موصى بهما من أجل gateway وCLI وسكربتات التعبئة. وما تزال Node 22 LTS، حاليًا `22.14+`، مدعومة من أجل التوافق.

## 1. تثبيت التبعيات

ثبّت تبعيات المشروع على مستوى المستودع:

```bash
pnpm install
```

## 2. بناء التطبيق وتعبئته

لبناء تطبيق macOS وتعبئته داخل `dist/OpenClaw.app`، شغّل:

```bash
./scripts/package-mac-app.sh
```

إذا لم يكن لديك شهادة Apple Developer ID، فسيستخدم السكربت تلقائيًا **التوقيع ad-hoc** (`-`).

بالنسبة إلى أوضاع التشغيل التطويرية، وأعلام التوقيع، وتصحيح أخطاء Team ID، راجع README الخاصة بتطبيق macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **ملاحظة**: قد تؤدي التطبيقات الموقعة بتوقيع ad-hoc إلى ظهور مطالبات أمان. وإذا تعطل التطبيق فورًا مع "Abort trap 6"، فراجع قسم [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## 3. تثبيت CLI

يتوقع تطبيق macOS وجود تثبيت عام لـ CLI باسم `openclaw` لإدارة المهام الخلفية.

**لتثبيتها (موصى به):**

1. افتح تطبيق OpenClaw.
2. انتقل إلى تبويب الإعدادات **General**.
3. انقر **"Install CLI"**.

أو ثبّتها يدويًا:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`.
وبالنسبة إلى بيئة تشغيل Gateway، تظل Node هي المسار الموصى به.

## استكشاف الأخطاء وإصلاحها

### فشل البناء: عدم تطابق Toolchain أو SDK

يتوقع بناء تطبيق macOS أحدث macOS SDK وأداة Swift 6.2.

**تبعيات النظام (مطلوبة):**

- **أحدث إصدار macOS متاح في Software Update** (مطلوب من أجل Xcode 26.2 SDKs)
- **Xcode 26.2** (أداة Swift 6.2)

**الفحوصات:**

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode وأعد تشغيل البناء.

### تعطل التطبيق عند منح الإذن

إذا تعطل التطبيق عندما تحاول السماح بوصول **Speech Recognition** أو **Microphone**، فقد يكون السبب ذاكرة TCC تالفة أو عدم تطابق في التوقيع.

**الإصلاح:**

1. أعد ضبط أذونات TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا لم ينجح ذلك، فغيّر `BUNDLE_ID` مؤقتًا في [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) لفرض "بداية نظيفة" من macOS.

### بقاء حالة Gateway على "Starting..." إلى ما لا نهاية

إذا بقيت حالة gateway عند "Starting..."، فتحقق مما إذا كانت هناك عملية zombie تحتجز المنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# إذا لم تكن تستخدم LaunchAgent (وضع التطوير / التشغيلات اليدوية)، فابحث عن المستمع:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحتجز المنفذ، فأوقف تلك العملية (Ctrl+C). وكحل أخير، اقتل PID الذي وجدته أعلاه.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
