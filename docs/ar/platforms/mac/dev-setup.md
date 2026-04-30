---
read_when:
    - إعداد بيئة التطوير على macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد التطوير على macOS
x-i18n:
    generated_at: "2026-04-30T08:11:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد مطوري macOS

ابنِ تطبيق OpenClaw لنظام macOS وشغّله من المصدر.

## المتطلبات الأساسية

قبل بناء التطبيق، تأكد من تثبيت ما يلي لديك:

1. **Xcode 26.2+**: مطلوب لتطوير Swift.
2. **Node.js 24 و pnpm**: موصى بهما للـ Gateway والـ CLI وسكربتات التحزيم. يظل Node 22 LTS، حاليًا `22.14+`، مدعومًا للتوافق.

## 1. تثبيت الاعتماديات

ثبّت الاعتماديات على مستوى المشروع:

```bash
pnpm install
```

## 2. بناء التطبيق وتحزيمه

لبناء تطبيق macOS وتحزيمه في `dist/OpenClaw.app`، شغّل:

```bash
./scripts/package-mac-app.sh
```

إذا لم يكن لديك شهادة Apple Developer ID، فسيستخدم السكربت تلقائيًا **التوقيع ad-hoc** (`-`).

لأوضاع التشغيل أثناء التطوير، وأعلام التوقيع، واستكشاف مشكلات Team ID وإصلاحها، راجع ملف README الخاص بتطبيق macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **ملاحظة**: قد تؤدي التطبيقات الموقعة بتوقيع ad-hoc إلى ظهور مطالبات أمنية. إذا تعطل التطبيق فورًا برسالة "Abort trap 6"، فراجع قسم [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## 3. تثبيت CLI

يتوقع تطبيق macOS تثبيت CLI عام لـ `openclaw` لإدارة مهام الخلفية.

**لتثبيته (موصى به):**

1. افتح تطبيق OpenClaw.
2. انتقل إلى تبويب إعدادات **عام**.
3. انقر على **"تثبيت CLI"**.

بدلًا من ذلك، ثبّته يدويًا:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا كل من `pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>`.
بالنسبة إلى وقت تشغيل Gateway، يظل Node هو المسار الموصى به.

## استكشاف الأخطاء وإصلاحها

### فشل البناء: عدم تطابق سلسلة الأدوات أو SDK

يتوقع بناء تطبيق macOS أحدث SDK لنظام macOS وسلسلة أدوات Swift 6.2.

**اعتماديات النظام (مطلوبة):**

- **أحدث إصدار من macOS متاح في Software Update** (مطلوب بواسطة حزم SDK الخاصة بـ Xcode 26.2)
- **Xcode 26.2** (سلسلة أدوات Swift 6.2)

**الفحوصات:**

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode ثم أعد تشغيل البناء.

### تعطل التطبيق عند منح الإذن

إذا تعطل التطبيق عند محاولة السماح بالوصول إلى **التعرّف على الكلام** أو **الميكروفون**، فقد يكون ذلك بسبب تلف ذاكرة TCC المؤقتة أو عدم تطابق التوقيع.

**الإصلاح:**

1. أعد ضبط أذونات TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، غيّر `BUNDLE_ID` مؤقتًا في [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) لفرض "بداية نظيفة" من macOS.

### Gateway عالق على "جارٍ البدء..." إلى أجل غير مسمى

إذا بقيت حالة Gateway على "جارٍ البدء..."، فتحقق مما إذا كانت عملية zombie تحتجز المنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحتجز المنفذ، فأوقف تلك العملية (Ctrl+C). كملاذ أخير، أنهِ PID الذي وجدته أعلاه.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
