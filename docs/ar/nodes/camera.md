---
read_when:
    - إضافة أو تعديل التقاط الكاميرا على عقد iOS/Android أو macOS
    - توسيع سير عمل ملفات MEDIA المؤقتة المتاحة للوكلاء
summary: 'التقاط الكاميرا (عُقد iOS/Android + تطبيق macOS) لاستخدام الوكيل: صور (jpg) ومقاطع فيديو قصيرة (mp4)'
title: التقاط الكاميرا
x-i18n:
    generated_at: "2026-06-27T17:54:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

يدعم OpenClaw **التقاط الكاميرا** لسير عمل الوكلاء:

- **عقدة iOS** (مقترنة عبر Gateway): التقط **صورة** (`jpg`) أو **مقطع فيديو قصيرًا** (`mp4`، مع صوت اختياري) عبر `node.invoke`.
- **عقدة Android** (مقترنة عبر Gateway): التقط **صورة** (`jpg`) أو **مقطع فيديو قصيرًا** (`mp4`، مع صوت اختياري) عبر `node.invoke`.
- **تطبيق macOS** (عقدة عبر Gateway): التقط **صورة** (`jpg`) أو **مقطع فيديو قصيرًا** (`mp4`، مع صوت اختياري) عبر `node.invoke`.

كل وصول إلى الكاميرا محمي خلف **إعدادات يتحكم بها المستخدم**.

## عقدة iOS

### إعداد المستخدم (مفعّل افتراضيًا)

- تبويب إعدادات iOS ← **الكاميرا** ← **السماح بالكاميرا** (`camera.enabled`)
  - الافتراضي: **مفعّل** (يُعامل المفتاح المفقود على أنه مفعّل).
  - عند إيقافه: تعيد أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### الأوامر (عبر Gateway `node.invoke`)

- `camera.list`
  - حمولة الاستجابة:
    - `devices`: مصفوفة من `{ id, name, position, deviceType }`

- `camera.snap`
  - المعاملات:
    - `facing`: `front|back` (الافتراضي: `front`)
    - `maxWidth`: رقم (اختياري؛ الافتراضي `1600` على عقدة iOS)
    - `quality`: `0..1` (اختياري؛ الافتراضي `0.9`)
    - `format`: حاليًا `jpg`
    - `delayMs`: رقم (اختياري؛ الافتراضي `0`)
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - حماية الحمولة: يُعاد ضغط الصور لإبقاء حمولة base64 أقل من 5 ميغابايت.

- `camera.clip`
  - المعاملات:
    - `facing`: `front|back` (الافتراضي: `front`)
    - `durationMs`: رقم (الافتراضي `3000`، ومحدود بحد أقصى `60000`)
    - `includeAudio`: قيمة منطقية (الافتراضي `true`)
    - `format`: حاليًا `mp4`
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### متطلب الواجهة الأمامية

مثل `canvas.*`، لا تسمح عقدة iOS بأوامر `camera.*` إلا في **الواجهة الأمامية**. تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`.

### مساعد CLI

أسهل طريقة للحصول على ملفات الوسائط هي عبر مساعد CLI، الذي يكتب الوسائط المفكوكة الترميز إلى ملف مؤقت ويطبع المسار المحفوظ.

أمثلة:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

ملاحظات:

- يستخدم `nodes camera snap` كلا الاتجاهين **معًا** افتراضيًا ليمنح الوكيل كلا المنظورين.
- ملفات الإخراج مؤقتة (في دليل النظام المؤقت) ما لم تبنِ مغلّفك الخاص.

## عقدة Android

### إعداد مستخدم Android (مفعّل افتراضيًا)

- ورقة إعدادات Android ← **الكاميرا** ← **السماح بالكاميرا** (`camera.enabled`)
  - الافتراضي: **مفعّل** (يُعامل المفتاح المفقود على أنه مفعّل).
  - عند إيقافه: تعيد أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### الأذونات

- يتطلب Android أذونات وقت التشغيل:
  - `CAMERA` لكل من `camera.snap` و`camera.clip`.
  - `RECORD_AUDIO` لـ `camera.clip` عندما تكون `includeAudio=true`.

إذا كانت الأذونات مفقودة، فسيطلبها التطبيق عندما يكون ذلك ممكنًا؛ وإذا رُفضت، تفشل طلبات `camera.*` بخطأ
`*_PERMISSION_REQUIRED`.

### متطلب الواجهة الأمامية في Android

مثل `canvas.*`، لا تسمح عقدة Android بأوامر `camera.*` إلا في **الواجهة الأمامية**. تعيد الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`.

### أوامر Android (عبر Gateway `node.invoke`)

- `camera.list`
  - حمولة الاستجابة:
    - `devices`: مصفوفة من `{ id, name, position, deviceType }`

### حماية الحمولة

يُعاد ضغط الصور لإبقاء حمولة base64 أقل من 5 ميغابايت.

## تطبيق macOS

### إعداد المستخدم (متوقف افتراضيًا)

يعرض التطبيق المرافق على macOS مربع اختيار:

- **الإعدادات ← عام ← السماح بالكاميرا** (`openclaw.cameraEnabled`)
  - الافتراضي: **متوقف**
  - عند إيقافه: تعيد طلبات الكاميرا "Camera disabled by user".

### مساعد CLI (استدعاء العقدة)

استخدم CLI الرئيسي `openclaw` لاستدعاء أوامر الكاميرا على عقدة macOS.

أمثلة:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

ملاحظات:

- يستخدم `openclaw nodes camera snap` القيمة `maxWidth=1600` افتراضيًا ما لم يتم تجاوزها.
- على macOS، ينتظر `camera.snap` مدة `delayMs` (الافتراضي 2000ms) بعد الإحماء/استقرار التعريض قبل الالتقاط.
- يُعاد ضغط حمولات الصور لإبقاء base64 أقل من 5 ميغابايت.

## السلامة والحدود العملية

- يؤدي الوصول إلى الكاميرا والميكروفون إلى مطالبات أذونات نظام التشغيل المعتادة (ويتطلب سلاسل استخدام في Info.plist).
- تُقيّد مقاطع الفيديو (حاليًا `<= 60s`) لتجنب حمولات العقد كبيرة الحجم (تكلفة base64 الإضافية + حدود الرسائل).

## فيديو شاشة macOS (على مستوى نظام التشغيل)

بالنسبة إلى فيديو _الشاشة_ (وليس الكاميرا)، استخدم المرافق على macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

ملاحظات:

- يتطلب إذن **تسجيل الشاشة** في macOS (TCC).

## ذات صلة

- [دعم الصور والوسائط](/ar/nodes/images)
- [فهم الوسائط](/ar/nodes/media-understanding)
- [أمر الموقع](/ar/nodes/location-command)
