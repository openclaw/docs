---
read_when:
    - إعداد بيئة تطوير macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد بيئة التطوير على macOS
x-i18n:
    generated_at: "2026-07-04T06:35:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد مطور macOS

ابنِ وشغّل تطبيق OpenClaw لنظام macOS من المصدر.

## المتطلبات الأساسية

قبل بناء التطبيق، تأكد من تثبيت ما يلي لديك:

1. **Xcode 26.2+**: مطلوب لتطوير Swift.
2. **Node.js 24 و pnpm**: موصى بهما من أجل Gateway وCLI وسكربتات التحزيم. يظل Node 22 LTS، حاليًا `22.19+`، مدعومًا للتوافق.

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

إذا لم تكن لديك شهادة Apple Developer ID، فسيستخدم السكربت تلقائيًا **التوقيع المخصص** (`-`).

لأوضاع التشغيل التطويرية، وأعلام التوقيع، واستكشاف مشكلات معرّف الفريق وإصلاحها، راجع ملف README لتطبيق macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **ملاحظة**: قد تؤدي التطبيقات الموقعة توقيعًا مخصصًا إلى ظهور مطالبات أمان. إذا تعطل التطبيق فورًا مع "إحباط المصيدة 6"، فراجع قسم [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## 3. تثبيت CLI وGateway

يتضمن التطبيق المحزّم مثبّت `scripts/install-cli.sh` المعتمد. على ملف
تعريف جديد، اختر **هذا الـ Mac** أثناء الإعداد الأولي؛ يثبّت التطبيق
CLI ومسار التشغيل المطابقين في مساحة المستخدم قبل بدء معالج Gateway.

للاسترداد اليدوي أثناء التطوير، ثبّت CLI المطابق بنفسك:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`.
بالنسبة إلى مسار تشغيل Gateway، يظل Node هو المسار الموصى به.

## استكشاف الأخطاء وإصلاحها

### فشل البناء: عدم تطابق سلسلة الأدوات أو SDK

يتوقع بناء تطبيق macOS أحدث SDK لنظام macOS وسلسلة أدوات Swift 6.2.

**اعتماديات النظام (مطلوبة):**

- **أحدث إصدار macOS متاح في تحديث البرامج** (مطلوب بواسطة SDKs الخاصة بـ Xcode 26.2)
- **Xcode 26.2** (سلسلة أدوات Swift 6.2)

**الفحوصات:**

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode وأعد تشغيل البناء.

### تعطل التطبيق عند منح الأذونات

إذا تعطل التطبيق عندما تحاول السماح بالوصول إلى **التعرّف على الكلام** أو **الميكروفون**، فقد يكون السبب ذاكرة TCC مؤقتة تالفة أو عدم تطابق في التوقيع.

**الإصلاح:**

1. أعد ضبط أذونات TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، فغيّر `BUNDLE_ID` مؤقتًا في [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) لفرض "بداية نظيفة" من macOS.

### بقاء Gateway على "جارٍ البدء..." إلى أجل غير مسمى

إذا ظلت حالة Gateway على "جارٍ البدء..."، فتحقق مما إذا كانت عملية خاملة تحتفظ بالمنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحتفظ بالمنفذ، فأوقف تلك العملية (Ctrl+C). كحل أخير، أنهِ PID الذي وجدته أعلاه.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
