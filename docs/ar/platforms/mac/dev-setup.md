---
read_when:
    - إعداد بيئة التطوير على macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد بيئة التطوير على macOS
x-i18n:
    generated_at: "2026-05-06T08:04:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد مطوّر macOS

ابنِ تطبيق OpenClaw لنظام macOS وشغّله من المصدر.

## المتطلبات الأساسية

قبل بناء التطبيق، تأكد من تثبيت ما يلي:

1. **Xcode 26.2+**: مطلوب لتطوير Swift.
2. **Node.js 24 وpnpm**: موصى بهما لـ Gateway وCLI وسكربتات التغليف. يظل Node 22 LTS، وحاليًا `22.14+`، مدعومًا للتوافق.

## 1. تثبيت التبعيات

ثبّت التبعيات على مستوى المشروع:

```bash
pnpm install
```

## 2. بناء التطبيق وتغليفه

لبناء تطبيق macOS وتغليفه في `dist/OpenClaw.app`، شغّل:

```bash
./scripts/package-mac-app.sh
```

إذا لم يكن لديك شهادة Apple Developer ID، فسيستخدم السكربت تلقائيًا **التوقيع المخصص** (`-`).

لأوضاع التشغيل التطويرية، وأعلام التوقيع، واستكشاف أخطاء Team ID وإصلاحها، راجع ملف README لتطبيق macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **ملاحظة**: قد تؤدي التطبيقات الموقّعة توقيعًا مخصصًا إلى ظهور مطالبات أمان. إذا تعطل التطبيق فورًا مع "Abort trap 6"، فراجع قسم [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## 3. تثبيت CLI

يتوقع تطبيق macOS تثبيت CLI عام باسم `openclaw` لإدارة المهام الخلفية.

**لتثبيته (موصى به):**

1. افتح تطبيق OpenClaw.
2. انتقل إلى تبويب إعدادات **عام**.
3. انقر على **"تثبيت CLI"**.

بدلًا من ذلك، ثبّته يدويًا:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`.
بالنسبة إلى وقت تشغيل Gateway، يظل Node هو المسار الموصى به.

## استكشاف الأخطاء وإصلاحها

### فشل البناء: عدم تطابق سلسلة الأدوات أو SDK

يتوقع بناء تطبيق macOS أحدث macOS SDK وسلسلة أدوات Swift 6.2.

**تبعيات النظام (مطلوبة):**

- **أحدث إصدار من macOS متاح في Software Update** (مطلوب بواسطة SDKs الخاصة بـ Xcode 26.2)
- **Xcode 26.2** (سلسلة أدوات Swift 6.2)

**الفحوصات:**

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode ثم أعد تشغيل البناء.

### يتعطل التطبيق عند منح الإذن

إذا تعطل التطبيق عند محاولة السماح بالوصول إلى **التعرّف على الكلام** أو **الميكروفون**، فقد يكون السبب ذاكرة تخزين TCC تالفة أو عدم تطابق في التوقيع.

**الإصلاح:**

1. أعِد ضبط أذونات TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، فغيّر `BUNDLE_ID` مؤقتًا في [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) لفرض "بداية نظيفة" من macOS.

### Gateway عالق على "جارٍ البدء..." إلى أجل غير مسمى

إذا ظلت حالة Gateway على "جارٍ البدء..."، فتحقق مما إذا كانت عملية زومبي تحتجز المنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحتجز المنفذ، فأوقف تلك العملية (Ctrl+C). كحل أخير، اقتل PID الذي وجدته أعلاه.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
