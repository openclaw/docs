---
read_when:
    - إضافة التقاط الكاميرا أو تعديله على عُقد iOS/Android أو macOS
    - توسيع سير عمل ملفات MEDIA المؤقتة المتاحة للوكيل
summary: 'التقاط الصور بالكاميرا (عُقد iOS/Android + تطبيق macOS) لاستخدام الوكيل: صور (jpg) ومقاطع فيديو قصيرة (mp4)'
title: التقاط صورة بالكاميرا
x-i18n:
    generated_at: "2026-07-12T06:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

يدعم OpenClaw التقاط الكاميرا لسير عمل الوكيل على عُقد **iOS** و**Android** و**macOS** المقترنة: التقاط صورة (`jpg`) أو مقطع فيديو قصير (`mp4`، مع صوت اختياري) عبر `node.invoke` في Gateway.

يخضع كل وصول إلى الكاميرا لإعداد يتحكم فيه المستخدم على كل منصة.

## عقدة iOS

### إعداد مستخدم iOS

- علامة تبويب iOS Settings ‏→ **Camera** ‏→ **Allow Camera** ‏(`camera.enabled`).
  - الافتراضي: **مفعّل** (يُعامل المفتاح المفقود على أنه مفعّل).
  - عند إيقافه: تُرجع أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### أوامر iOS (عبر `node.invoke` في Gateway)

- `camera.list`
  - حمولة الاستجابة: `devices` — مصفوفة من `{ id, name, position, deviceType }`.

- `camera.snap`
  - المعاملات:
    - `facing`:‏ `front|back` (الافتراضي: `front`)
    - `maxWidth`: رقم (اختياري؛ الافتراضي `1600`)
    - `quality`:‏ `0..1` (اختياري؛ الافتراضي `0.9`، ومقيّد إلى `[0.05, 1.0]`)
    - `format`: حاليًا `jpg`
    - `delayMs`: رقم (اختياري؛ الافتراضي `0`، والحد الداخلي الأقصى `10000`)
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة: `format: "jpg"`، و`base64`، و`width`، و`height`.
  - قيد الحمولة: يُعاد ضغط الصور لإبقاء الحمولة المرمّزة بنظام base64 دون 5 ميغابايت.

- `camera.clip`
  - المعاملات:
    - `facing`:‏ `front|back` (الافتراضي: `front`)
    - `durationMs`: رقم (الافتراضي `3000`، ومقيّد إلى `[250, 60000]`)
    - `includeAudio`: قيمة منطقية (الافتراضي `true`)
    - `format`: حاليًا `mp4`
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة: `format: "mp4"`، و`base64`، و`durationMs`، و`hasAudio`.

### اشتراط وجود iOS في الواجهة الأمامية

كما هو الحال مع `canvas.*`، لا تسمح عقدة iOS بأوامر `camera.*` إلا في **الواجهة الأمامية**. تُرجع الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`.

### أداة CLI المساعدة

أسهل طريقة للحصول على ملفات الوسائط هي استخدام أداة CLI المساعدة، التي تكتب الوسائط المفكوكة الترميز في ملف مؤقت وتطبع المسار المحفوظ.

```bash
openclaw nodes camera snap --node <id>                 # الافتراضي: الأمامية والخلفية معًا (سطران من MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

يستخدم `nodes camera snap` افتراضيًا `--facing both`، فيلتقط من الكاميرتين الأمامية والخلفية لتزويد الوكيل بكلا المنظورين؛ مرّر `--device-id` مع اتجاه واحد محدد صراحةً (تُرفض القيمة `both` عند تعيين `--device-id`). تكون ملفات الإخراج مؤقتة (في دليل الملفات المؤقتة لنظام التشغيل) ما لم تنشئ غلافك الخاص.

## عقدة Android

### إعداد مستخدم Android

- لوحة Android Settings ‏→ **Camera** ‏→ **Allow Camera** ‏(`camera.enabled`).
  - **الإعداد الافتراضي للتثبيتات الجديدة هو الإيقاف.** تُرحّل التثبيتات الحالية التي تسبق هذا الإعداد إلى حالة **التشغيل** كي لا تفقد الترقيات بصمت إمكانية الوصول إلى الكاميرا التي كانت تعمل سابقًا.
  - عند إيقافه: تُرجع أوامر `camera.*` القيمة `CAMERA_DISABLED: enable Camera in Settings`.

### الأذونات

- يلزم `CAMERA` لكل من `camera.snap` و`camera.clip`؛ ويُرجع الإذن المفقود أو المرفوض `CAMERA_PERMISSION_REQUIRED`.
- يلزم `RECORD_AUDIO` للأمر `camera.clip` عندما تكون `includeAudio` بالقيمة `true`؛ ويُرجع الإذن المفقود أو المرفوض `MIC_PERMISSION_REQUIRED`.

يطلب التطبيق أذونات وقت التشغيل عندما يكون ذلك ممكنًا.

### اشتراط وجود Android في الواجهة الأمامية

كما هو الحال مع `canvas.*`، لا تسمح عقدة Android بأوامر `camera.*` إلا في **الواجهة الأمامية**. تُرجع الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### أوامر Android (عبر `node.invoke` في Gateway)

- `camera.list`
  - حمولة الاستجابة: `devices` — مصفوفة من `{ id, name, position, deviceType }`.

- `camera.snap`
  - المعاملات: `facing` ‏(`front|back`، الافتراضي `front`)، و`quality` (الافتراضي `0.95`، ومقيّد إلى `[0.1, 1.0]`)، و`maxWidth` (الافتراضي `1600`)، و`deviceId` (اختياري؛ يفشل المعرّف غير المعروف بالقيمة `INVALID_REQUEST`).
  - حمولة الاستجابة: `format: "jpg"`، و`base64`، و`width`، و`height`.
  - قيد الحمولة: يُعاد الضغط لإبقاء base64 دون 5 ميغابايت (الحد نفسه المستخدم في iOS).

- `camera.clip`
  - المعاملات: `facing` (الافتراضي `front`)، و`durationMs` (الافتراضي `3000`، ومقيّد إلى `[200, 60000]`)، و`includeAudio` (الافتراضي `true`)، و`deviceId` (اختياري).
  - حمولة الاستجابة: `format: "mp4"`، و`base64`، و`durationMs`، و`hasAudio`.
  - قيد الحمولة: يقتصر حجم MP4 الخام على 18 ميغابايت قبل ترميز base64؛ وتفشل المقاطع التي تتجاوز الحجم بالقيمة `PAYLOAD_TOO_LARGE` (قلّل `durationMs` وأعد المحاولة).

## تطبيق macOS

### إعداد مستخدم macOS

يعرض التطبيق المرافق لنظام macOS مربع اختيار:

- **Settings → General → Allow Camera** ‏(`openclaw.cameraEnabled`).
  - الافتراضي: **متوقف**.
  - عند إيقافه: تُرجع طلبات الكاميرا `CAMERA_DISABLED: enable Camera in Settings`.

### أداة CLI المساعدة (استدعاء العقدة)

استخدم CLI الرئيسي لـ`openclaw` لاستدعاء أوامر الكاميرا على عقدة macOS.

```bash
openclaw nodes camera list --node <id>                     # يسرد معرّفات الكاميرات
openclaw nodes camera snap --node <id>                     # يطبع المسار المحفوظ
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # يطبع المسار المحفوظ
openclaw nodes camera clip --node <id> --duration-ms 3000   # يطبع المسار المحفوظ (علامة قديمة)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- يستخدم `openclaw nodes camera snap` افتراضيًا `maxWidth=1600` ما لم يُتجاوز.
- ينتظر `camera.snap` مدة `delayMs` (الافتراضي 2000 مللي ثانية، ومقيّدة إلى `[0, 10000]`) بعد استقرار الإحماء والتعريض قبل الالتقاط.
- يُعاد ضغط حمولات الصور لإبقاء base64 دون 5 ميغابايت.

## السلامة والحدود العملية

- يؤدي الوصول إلى الكاميرا والميكروفون إلى ظهور مطالبات أذونات نظام التشغيل المعتادة (ويتطلب سلاسل استخدام في `Info.plist`).
- تقتصر مقاطع الفيديو على 60 ثانية لتجنب حمولات العقدة المفرطة في الحجم (الزيادة الناتجة عن base64 بالإضافة إلى حدود الرسائل).

## فيديو شاشة macOS (على مستوى نظام التشغيل)

لفيديو _الشاشة_ (وليس الكاميرا)، استخدم التطبيق المرافق لنظام macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # يطبع المسار المحفوظ
```

يتطلب إذن **Screen Recording** في macOS ‏(TCC).

## ذو صلة

- [دعم الصور والوسائط](/ar/nodes/images)
- [فهم الوسائط](/ar/nodes/media-understanding)
- [أمر الموقع](/ar/nodes/location-command)
