---
read_when:
    - إضافة أو تعديل التقاط الكاميرا على عُقد iOS/Android أو macOS
    - توسيع مسارات عمل ملفات MEDIA المؤقتة القابلة للوصول من الوكيل
summary: 'التقاط الكاميرا (عُقد iOS/Android + تطبيق macOS) لاستخدام الوكيل: صور (`jpg`) ومقاطع فيديو قصيرة (`mp4`)'
title: التقاط الكاميرا
x-i18n:
    generated_at: "2026-04-24T07:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

يدعم OpenClaw **التقاط الكاميرا** ضمن مهام سير عمل الوكيل:

- **عقدة iOS** ‏(مقترنة عبر Gateway): التقاط **صورة** (`jpg`) أو **مقطع فيديو قصير** (`mp4`، مع صوت اختياري) عبر `node.invoke`.
- **عقدة Android** ‏(مقترنة عبر Gateway): التقاط **صورة** (`jpg`) أو **مقطع فيديو قصير** (`mp4`، مع صوت اختياري) عبر `node.invoke`.
- **تطبيق macOS** ‏(عقدة عبر Gateway): التقاط **صورة** (`jpg`) أو **مقطع فيديو قصير** (`mp4`، مع صوت اختياري) عبر `node.invoke`.

تخضع كل عمليات الوصول إلى الكاميرا إلى **إعدادات يتحكم بها المستخدم**.

## عقدة iOS

### إعداد المستخدم (مفعّل افتراضيًا)

- تبويب Settings في iOS → **Camera** → **Allow Camera** ‏(`camera.enabled`)
  - الافتراضي: **مفعّل** (ويُعامل المفتاح المفقود على أنه مفعّل).
  - عند الإيقاف: تعيد أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### الأوامر (عبر Gateway ‏`node.invoke`)

- `camera.list`
  - حمولة الاستجابة:
    - `devices`: مصفوفة من `{ id, name, position, deviceType }`

- `camera.snap`
  - المعلمات:
    - `facing`: ‏`front|back` ‏(الافتراضي: `front`)
    - `maxWidth`: رقم (اختياري؛ الافتراضي `1600` على عقدة iOS)
    - `quality`: ‏`0..1` ‏(اختياري؛ الافتراضي `0.9`)
    - `format`: حاليًا `jpg`
    - `delayMs`: رقم (اختياري؛ الافتراضي `0`)
    - `deviceId`: سلسلة (اختياري؛ من `camera.list`)
  - حمولة الاستجابة:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - حارس الحمولة: تُعاد ضغط الصور للحفاظ على حمولة base64 تحت 5 MB.

- `camera.clip`
  - المعلمات:
    - `facing`: ‏`front|back` ‏(الافتراضي: `front`)
    - `durationMs`: رقم (الافتراضي `3000`، ويُقيد بحد أقصى `60000`)
    - `includeAudio`: قيمة منطقية (الافتراضي `true`)
    - `format`: حاليًا `mp4`
    - `deviceId`: سلسلة (اختياري؛ من `camera.list`)
  - حمولة الاستجابة:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### شرط الواجهة الأمامية

مثل `canvas.*`، تسمح عقدة iOS بأوامر `camera.*` فقط عندما تكون في **الواجهة الأمامية**. وتعطي الاستدعاءات في الخلفية القيمة `NODE_BACKGROUND_UNAVAILABLE`.

### مساعد CLI ‏(ملفات مؤقتة + MEDIA)

أسهل طريقة للحصول على المرفقات هي عبر مساعد CLI، الذي يكتب الوسائط المفككة إلى ملف مؤقت ويطبع `MEDIA:<path>`.

أمثلة:

```bash
openclaw nodes camera snap --node <id>               # الافتراضي: كلا الاتجاهين الأمامي + الخلفي (سطران من MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

ملاحظات:

- يستخدم `nodes camera snap` افتراضيًا **كلا** الاتجاهين لإعطاء الوكيل العرضين.
- تكون ملفات الخرج مؤقتة (في دليل temp الخاص بنظام التشغيل) ما لم تنشئ غلافك الخاص.

## عقدة Android

### إعداد المستخدم في Android ‏(مفعّل افتراضيًا)

- لوحة Settings في Android → **Camera** → **Allow Camera** ‏(`camera.enabled`)
  - الافتراضي: **مفعّل** (ويُعامل المفتاح المفقود على أنه مفعّل).
  - عند الإيقاف: تعيد أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### الأذونات

- يتطلب Android أذونات وقت التشغيل:
  - `CAMERA` لكل من `camera.snap` و`camera.clip`.
  - `RECORD_AUDIO` من أجل `camera.clip` عندما تكون `includeAudio=true`.

إذا كانت الأذونات مفقودة، فسيطلبها التطبيق عندما يكون ذلك ممكنًا؛ وإذا تم رفضها، فإن طلبات `camera.*` تفشل مع
خطأ `*_PERMISSION_REQUIRED`.

### شرط الواجهة الأمامية في Android

مثل `canvas.*`، تسمح عقدة Android بأوامر `camera.*` فقط عندما تكون في **الواجهة الأمامية**. وتعطي الاستدعاءات في الخلفية القيمة `NODE_BACKGROUND_UNAVAILABLE`.

### أوامر Android ‏(عبر Gateway ‏`node.invoke`)

- `camera.list`
  - حمولة الاستجابة:
    - `devices`: مصفوفة من `{ id, name, position, deviceType }`

### حارس الحمولة

تُعاد ضغط الصور للحفاظ على حمولة base64 تحت 5 MB.

## تطبيق macOS

### إعداد المستخدم (معطل افتراضيًا)

يكشف التطبيق المرافق على macOS مربع اختيار:

- **Settings → General → Allow Camera** ‏(`openclaw.cameraEnabled`)
  - الافتراضي: **معطل**
  - عند الإيقاف: تعيد طلبات الكاميرا الرسالة “Camera disabled by user”.

### مساعد CLI ‏(node invoke)

استخدم CLI الرئيسي الخاص بـ `openclaw` لاستدعاء أوامر الكاميرا على عقدة macOS.

أمثلة:

```bash
openclaw nodes camera list --node <id>            # عرض معرّفات الكاميرات
openclaw nodes camera snap --node <id>            # يطبع MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # يطبع MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # يطبع MEDIA:<path> (علم قديم)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

ملاحظات:

- يستخدم `openclaw nodes camera snap` افتراضيًا `maxWidth=1600` ما لم يتم تجاوزه.
- على macOS، ينتظر `camera.snap` قيمة `delayMs` ‏(الافتراضية 2000ms) بعد الإحماء/استقرار التعريض قبل الالتقاط.
- تُعاد ضغط حمولات الصور للحفاظ على base64 تحت 5 MB.

## الأمان + الحدود العملية

- يؤدي الوصول إلى الكاميرا والميكروفون إلى ظهور مطالبات الأذونات المعتادة لنظام التشغيل (ويتطلب سلاسل الاستخدام في Info.plist).
- تُقيد مقاطع الفيديو (حاليًا `<= 60s`) لتجنب حمولات العقدة الضخمة (حمل base64 الزائد + حدود الرسائل).

## فيديو الشاشة على macOS ‏(على مستوى النظام)

بالنسبة إلى فيديو **الشاشة** (وليس الكاميرا)، استخدم تطبيق macOS المرافق:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # يطبع MEDIA:<path>
```

ملاحظات:

- يتطلب إذن macOS **Screen Recording** ‏(TCC).

## ذو صلة

- [دعم الصور والوسائط](/ar/nodes/images)
- [فهم الوسائط](/ar/nodes/media-understanding)
- [أمر الموقع](/ar/nodes/location-command)
