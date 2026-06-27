---
read_when:
    - إعداد بيئة تطوير macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد بيئة التطوير على macOS
x-i18n:
    generated_at: "2026-06-27T17:58:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد مطوّري macOS

ابنِ تطبيق OpenClaw على macOS وشغّله من المصدر.

## المتطلبات المسبقة

قبل بناء التطبيق، تأكد من تثبيت ما يلي:

1. **Xcode 26.2+**: مطلوب لتطوير Swift.
2. **Node.js 24 و pnpm**: موصى بهما لـ Gateway وCLI وسكربتات التحزيم. يظل Node 22 LTS، حاليًا `22.19+`، مدعومًا للتوافق.

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

لأوضاع التشغيل أثناء التطوير، وأعلام التوقيع، واستكشاف مشكلات Team ID، راجع ملف README لتطبيق macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **ملاحظة**: قد تؤدي التطبيقات الموقّعة بتوقيع مخصص إلى ظهور مطالبات أمان. إذا تعطل التطبيق فورًا مع "Abort trap 6"، فراجع قسم [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## 3. تثبيت CLI

يتوقع تطبيق macOS تثبيت CLI عام باسم `openclaw` لإدارة المهام في الخلفية.

**لتثبيته (موصى به):**

1. افتح تطبيق OpenClaw.
2. انتقل إلى تبويب إعدادات **عام**.
3. انقر على **"تثبيت CLI"**.

بدلًا من ذلك، ثبّته يدويًا:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا كل من `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`.
بالنسبة إلى وقت تشغيل Gateway، يظل Node هو المسار الموصى به.

## استكشاف الأخطاء وإصلاحها

### فشل البناء: عدم تطابق سلسلة الأدوات أو SDK

يتوقع بناء تطبيق macOS أحدث SDK لـ macOS وسلسلة أدوات Swift 6.2.

**اعتماديات النظام (مطلوبة):**

- **أحدث إصدار macOS متاح في Software Update** (مطلوب بواسطة SDKs الخاصة بـ Xcode 26.2)
- **Xcode 26.2** (سلسلة أدوات Swift 6.2)

**الفحوصات:**

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode وأعد تشغيل البناء.

### يتعطل التطبيق عند منح الإذن

إذا تعطل التطبيق عند محاولة السماح بالوصول إلى **التعرّف على الكلام** أو **الميكروفون**، فقد يكون السبب ذاكرة تخزين TCC مؤقتة تالفة أو عدم تطابق في التوقيع.

**الإصلاح:**

1. أعد تعيين أذونات TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، فغيّر `BUNDLE_ID` مؤقتًا في [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) لفرض "بداية نظيفة" من macOS.

### يظل Gateway على "جارٍ البدء..." إلى أجل غير مسمى

إذا بقيت حالة Gateway على "جارٍ البدء..."، فتحقق مما إذا كانت عملية عالقة تحتفظ بالمنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# إذا لم تكن تستخدم LaunchAgent (وضع التطوير / التشغيل اليدوي)، فابحث عن المستمع:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحتفظ بالمنفذ، فأوقف تلك العملية (Ctrl+C). وكحل أخير، أوقف PID الذي وجدته أعلاه.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
