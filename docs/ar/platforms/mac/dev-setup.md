---
read_when:
    - إعداد بيئة التطوير على macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد بيئة التطوير على macOS
x-i18n:
    generated_at: "2026-07-16T14:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد المطوّرين على macOS

أنشئ تطبيق OpenClaw لنظام macOS وشغّله من المصدر.

## المتطلبات الأساسية

- **Xcode 26.2+** (سلسلة أدوات Swift 6.2)، على أحدث إصدار متاح من macOS في
  Software Update.
- **Node.js 24.15+ وpnpm** للـ Gateway والـ CLI ونصوص الحزم. يعمل Node
  22.22.3+ أيضًا.

## 1. تثبيت التبعيات

```bash
pnpm install
```

## 2. إنشاء التطبيق وتحزيمه

```bash
./scripts/package-mac-app.sh
```

يُنتج `dist/OpenClaw.app`. عند عدم توفر شهادة Apple Developer ID، يعود
النص البرمجي إلى التوقيع المخصص.

للاطلاع على أوضاع تشغيل التطوير، وخيارات التوقيع، واستكشاف أخطاء Team ID وإصلاحها، راجع
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
دورة تطوير سريعة من جذر المستودع: `scripts/restart-mac.sh` (أضف `--no-sign` لإجراء
توقيع مخصص؛ لا تستمر أذونات TCC مع `--no-sign`).

<Note>
قد تؤدي التطبيقات الموقّعة توقيعًا مخصصًا إلى ظهور مطالبات أمنية. إذا تعطّل التطبيق
فورًا مع "Abort trap 6"، فراجع [استكشاف الأخطاء وإصلاحها](#troubleshooting).
</Note>

## 3. تثبيت CLI وGateway

يتضمن التطبيق المحزّم مثبّت `scripts/install-cli.sh` القياسي. في ملف تعريف
جديد، اختر **This Mac** أثناء الإعداد الأولي؛ يثبّت التطبيق CLI وبيئة التشغيل
المتطابقتين في مساحة المستخدم قبل بدء معالج Gateway.

للاستعادة اليدوية في بيئة التطوير، ثبّت CLI المطابق بنفسك:

```bash
npm install -g openclaw@<version>
```

يعمل `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`
أيضًا. يظل Node بيئة التشغيل الموصى بها للـ Gateway نفسه.

## استكشاف الأخطاء وإصلاحها

### فشل الإنشاء: عدم تطابق سلسلة الأدوات أو SDK

يتطلب إنشاء تطبيق macOS أحدث إصدار من macOS SDK وسلسلة أدوات Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS/Xcode وأعد تشغيل عملية الإنشاء.

### تعطّل التطبيق عند منح الإذن

إذا تعطّل التطبيق عند محاولة السماح بالوصول إلى **Speech Recognition** أو
**Microphone**، فقد يكون السبب ذاكرة تخزين مؤقت تالفة لـ TCC أو عدم تطابق التوقيع.

1. أعد تعيين أذونات TCC لمعرّف حزمة تصحيح الأخطاء:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، فغيّر مؤقتًا `BUNDLE_ID` في
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   لإجبار macOS على البدء من حالة نظيفة.

### بقاء Gateway في حالة "Starting..." إلى أجل غير مسمى

تحقّق مما إذا كانت عملية معلّقة تحجز المنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# إذا كنت لا تستخدم LaunchAgent (وضع التطوير / التشغيل اليدوي)، فابحث عن العملية المستمعة:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يحجز المنفذ، فأوقفه (Ctrl+C)، أو أنهِ العملية ذات PID الموجودة أعلاه
كحل أخير.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
