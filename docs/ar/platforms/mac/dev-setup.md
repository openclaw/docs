---
read_when:
    - إعداد بيئة التطوير على macOS
summary: دليل الإعداد للمطورين العاملين على تطبيق OpenClaw لنظام macOS
title: إعداد بيئة التطوير على macOS
x-i18n:
    generated_at: "2026-07-12T06:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# إعداد بيئة التطوير على macOS

أنشئ تطبيق OpenClaw لنظام macOS وشغّله من الشيفرة المصدرية.

## المتطلبات الأساسية

- **Xcode 26.2+** (سلسلة أدوات Swift 6.2)، على أحدث إصدار متاح من macOS في
  Software Update.
- **Node.js 24 وpnpm** من أجل Gateway وCLI ونصوص الحزم. يعمل Node
  22.19+ أيضًا.

## 1. تثبيت الاعتماديات

```bash
pnpm install
```

## 2. إنشاء التطبيق وتحزيمه

```bash
./scripts/package-mac-app.sh
```

ينتج `dist/OpenClaw.app`. في حال عدم وجود شهادة Apple Developer ID، يعود
النص البرمجي إلى التوقيع المخصص.

للاطلاع على أوضاع التشغيل للتطوير، وخيارات التوقيع، واستكشاف أخطاء Team ID وإصلاحها، راجع
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
حلقة تطوير سريعة من جذر المستودع: `scripts/restart-mac.sh` (أضف `--no-sign`
للتوقيع المخصص؛ لا تستمر أذونات TCC عند استخدام `--no-sign`).

<Note>
قد تؤدي التطبيقات ذات التوقيع المخصص إلى ظهور مطالبات أمنية. إذا تعطل التطبيق
فورًا مع ظهور "Abort trap 6"، فراجع [استكشاف الأخطاء وإصلاحها](#troubleshooting).
</Note>

## 3. تثبيت CLI وGateway

يتضمن التطبيق المحزّم مثبّت `scripts/install-cli.sh` القياسي. في ملف تعريف
جديد، اختر **This Mac** أثناء الإعداد الأولي؛ يثبّت التطبيق CLI المتوافق
وبيئة التشغيل ضمن مساحة المستخدم قبل بدء معالج Gateway.

للاسترداد اليدوي في بيئة التطوير، ثبّت CLI المتوافق بنفسك:

```bash
npm install -g openclaw@<version>
```

يعمل أيضًا كل من `pnpm add -g openclaw@<version>` و`bun add -g openclaw@<version>`.
يظل Node بيئة التشغيل الموصى بها لـGateway نفسه.

## استكشاف الأخطاء وإصلاحها

### فشل الإنشاء: عدم تطابق سلسلة الأدوات أو SDK

يتطلب إنشاء تطبيق macOS أحدث إصدار من macOS SDK وسلسلة أدوات Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

إذا لم تتطابق الإصدارات، فحدّث macOS وXcode ثم أعد تشغيل عملية الإنشاء.

### تعطل التطبيق عند منح الإذن

إذا تعطل التطبيق عند محاولة السماح بالوصول إلى **Speech Recognition** أو
**Microphone**، فقد يرجع ذلك إلى تلف ذاكرة التخزين المؤقت لـTCC أو عدم تطابق التوقيع.

1. أعد تعيين أذونات TCC لمعرّف الحزمة الخاص بتصحيح الأخطاء:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. إذا فشل ذلك، فغيّر `BUNDLE_ID` مؤقتًا في
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   لإجبار macOS على البدء من حالة نظيفة.

### بقاء Gateway في حالة "Starting..." إلى أجل غير مسمى

تحقق مما إذا كانت عملية معلّقة تشغل المنفذ:

```bash
openclaw gateway status
openclaw gateway stop

# إذا لم تكن تستخدم LaunchAgent (وضع التطوير / التشغيل اليدوي)، فابحث عن العملية المستمعة:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

إذا كان تشغيل يدوي يشغل المنفذ، فأوقفه (Ctrl+C)، أو أنهِ PID الذي عُثر عليه أعلاه
كحل أخير.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [نظرة عامة على التثبيت](/ar/install)
