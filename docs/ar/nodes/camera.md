---
read_when:
    - إضافة التقاط الصور بالكاميرا أو تعديله على منصات Node
    - توسيع سير عمل ملفات MEDIA المؤقتة التي يمكن للوكيل الوصول إليها
summary: التقاط الصور بالكاميرا ومقاطع الفيديو القصيرة على عُقد iOS وAndroid وmacOS وLinux
title: التقاط الصور بالكاميرا
x-i18n:
    generated_at: "2026-07-16T14:32:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

يدعم OpenClaw التقاط الصور بالكاميرا لسير عمل الوكيل على عُقد **iOS** و**Android** و**macOS** و**Linux** المقترنة: التقاط صورة (`jpg`) أو مقطع فيديو قصير (`mp4`، مع صوت اختياري) عبر `node.invoke` في Gateway.

يخضع كل وصول إلى الكاميرا لإعداد يتحكم فيه المستخدم على كل منصة.

## عقدة iOS

### إعداد المستخدم في iOS

- علامة تبويب iOS Settings → **Camera** → **Allow Camera**‏ (`camera.enabled`).
  - الإعداد الافتراضي: **مفعّل** (يُعامل المفتاح المفقود على أنه مفعّل).
  - عند إيقافه: تُرجع أوامر `camera.*` القيمة `CAMERA_DISABLED`.

### أوامر iOS (عبر `node.invoke` في Gateway)

- `camera.list`
  - حمولة الاستجابة: `devices` — مصفوفة من `{ id, name, position, deviceType }`.

- `camera.snap`
  - المعاملات:
    - `facing`: ‏`front|back` (الافتراضي: `front`)
    - `maxWidth`: رقم (اختياري؛ الافتراضي `1600`)
    - `quality`: ‏`0..1` (اختياري؛ الافتراضي `0.9`، ويُقيّد إلى `[0.05, 1.0]`)
    - `format`: حاليًا `jpg`
    - `delayMs`: رقم (اختياري؛ الافتراضي `0`، ويُحد داخليًا عند `10000`)
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة: `format: "jpg"`، و`base64`، و`width`، و`height`.
  - حاجز الحمولة: يُعاد ضغط الصور لإبقاء الحمولة المرمّزة باستخدام base64 دون 5MB.

- `camera.clip`
  - المعاملات:
    - `facing`: ‏`front|back` (الافتراضي: `front`)
    - `durationMs`: رقم (الافتراضي `3000`، ويُقيّد إلى `[250, 60000]`)
    - `includeAudio`: قيمة منطقية (الافتراضي `true`)
    - `format`: حاليًا `mp4`
    - `deviceId`: سلسلة نصية (اختياري؛ من `camera.list`)
  - حمولة الاستجابة: `format: "mp4"`، و`base64`، و`durationMs`، و`hasAudio`.

### متطلب وجود iOS في المقدمة

مثل `canvas.*`، لا تسمح عقدة iOS بأوامر `camera.*` إلا في **المقدمة**. تُرجع الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE`.

### أداة CLI المساعدة

أسهل طريقة للحصول على ملفات الوسائط هي استخدام أداة CLI المساعدة، التي تكتب الوسائط المفككة الترميز إلى ملف مؤقت وتطبع المسار المحفوظ.

```bash
openclaw nodes camera snap --node <id>                 # الافتراضي: الأمامية والخلفية معًا (سطران MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

القيمة الافتراضية لـ `nodes camera snap` هي `--facing both`، ما يلتقط من الكاميرتين الأمامية والخلفية لمنح الوكيل كلا المنظورين؛ مرّر `--device-id` مع اتجاه واحد محدد صراحةً (يُرفض `both` عند تعيين `--device-id`). تكون ملفات الإخراج مؤقتة (في دليل الملفات المؤقتة لنظام التشغيل) ما لم تنشئ غلافك الخاص.

## عقدة Android

### إعداد المستخدم في Android

- لوحة Android Settings → **Camera** → **Allow Camera**‏ (`camera.enabled`).
  - **تكون القيمة الافتراضية للتثبيتات الجديدة هي الإيقاف.** تُرحّل التثبيتات الحالية التي تسبق هذا الإعداد إلى **التشغيل** كي لا تفقد الترقيات بصمت إمكانية الوصول إلى الكاميرا التي كانت تعمل سابقًا.
  - عند إيقافه: تُرجع أوامر `camera.*` القيمة `CAMERA_DISABLED: enable Camera in Settings`.

### الأذونات

- يلزم `CAMERA` لكل من `camera.snap` و`camera.clip`؛ ويؤدي غياب الإذن أو رفضه إلى إرجاع `CAMERA_PERMISSION_REQUIRED`.
- يلزم `RECORD_AUDIO` لـ `camera.clip` عندما تكون قيمة `includeAudio` هي `true`؛ ويؤدي غياب الإذن أو رفضه إلى إرجاع `MIC_PERMISSION_REQUIRED`.

يطالب التطبيق بأذونات وقت التشغيل متى أمكن ذلك.

### متطلب وجود Android في المقدمة

مثل `canvas.*`، لا تسمح عقدة Android بأوامر `camera.*` إلا في **المقدمة**. تُرجع الاستدعاءات في الخلفية `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### أوامر Android (عبر `node.invoke` في Gateway)

- `camera.list`
  - حمولة الاستجابة: `devices` — مصفوفة من `{ id, name, position, deviceType }`.

- `camera.snap`
  - المعاملات: `facing`‏ (`front|back`، الافتراضي `front`)، و`quality` (الافتراضي `0.95`، ويُقيّد إلى `[0.1, 1.0]`)، و`maxWidth` (الافتراضي `1600`)، و`deviceId` (اختياري؛ يؤدي المعرّف غير المعروف إلى الفشل مع `INVALID_REQUEST`).
  - حمولة الاستجابة: `format: "jpg"`، و`base64`، و`width`، و`height`.
  - حاجز الحمولة: يُعاد الضغط لإبقاء base64 دون 5MB (الميزانية نفسها المستخدمة في iOS).

- `camera.clip`
  - المعاملات: `facing` (الافتراضي `front`)، و`durationMs` (الافتراضي `3000`، ويُقيّد إلى `[200, 60000]`)، و`includeAudio` (الافتراضي `true`)، و`deviceId` (اختياري).
  - حمولة الاستجابة: `format: "mp4"`، و`base64`، و`durationMs`، و`hasAudio`.
  - حاجز الحمولة: يُحد حجم ملف MP4 الخام عند 18MB قبل ترميز base64؛ وتفشل المقاطع التي تتجاوز الحد مع `PAYLOAD_TOO_LARGE` (قلّل `durationMs` وأعد المحاولة).

## تطبيق macOS

### إعداد المستخدم في macOS

يعرض تطبيق macOS المصاحب مربع اختيار:

- **Settings → General → Allow Camera**‏ (`openclaw.cameraEnabled`).
  - الإعداد الافتراضي: **إيقاف**.
  - عند إيقافه: تُرجع طلبات الكاميرا `CAMERA_DISABLED: enable Camera in Settings`.

### أداة CLI المساعدة (استدعاء العقدة)

استخدم CLI الرئيسي `openclaw` لاستدعاء أوامر الكاميرا على عقدة macOS.

```bash
openclaw nodes camera list --node <id>                     # يسرد معرّفات الكاميرا
openclaw nodes camera snap --node <id>                     # يطبع المسار المحفوظ
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # يطبع المسار المحفوظ
openclaw nodes camera clip --node <id> --duration-ms 3000   # يطبع المسار المحفوظ (علامة قديمة)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- تكون القيمة الافتراضية لـ `openclaw nodes camera snap` هي `maxWidth=1600` ما لم تُستبدل.
- ينتظر `camera.snap` مدة `delayMs` (الافتراضي 2000ms، ويُقيّد إلى `[0, 10000]`) بعد استقرار الإحماء/التعريض قبل الالتقاط.
- يُعاد ضغط حمولات الصور لإبقاء base64 دون 5MB.

## مضيف عقدة Linux

يضيف Plugin عقدة Linux المضمّن إمكانية التقاط الكاميرا إلى خدمة `openclaw node` في CLI. ويعمل على مضيف بلا واجهة رسومية ولا يتطلب تطبيق سطح مكتب Linux.

يكون الوصول إلى الكاميرا معطّلًا افتراضيًا. فعّله ضمن إدخال Plugin، ثم أعد تشغيل خدمة العقدة لكي يُعاد إنشاء إعلانها في Gateway:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

المتطلبات:

- ‏FFmpeg مع إدخال V4L2، و`libx264`، ودعم AAC
- جهاز `/dev/video*` يمكن لمستخدم خدمة العقدة قراءته؛ وفي التوزيعات الشائعة، أضف ذلك المستخدم إلى مجموعة `video`
- للمقاطع ذات الإعداد الافتراضي `includeAudio: true`، يلزم خادم PulseAudio يعمل أو طبقة توافق PipeWire مع PulseAudio تتضمن مصدرًا افتراضيًا

يعيد Linux مسارات أجهزة V4L2 القابلة للالتقاط والقراءة من `camera.list`؛ ويفحص FFmpeg كل مرشح `/dev/video*` ويستبعد عُقد البيانات الوصفية أو عُقد الإخراج فقط. يكون `position` للجهاز هو `unknown`، لذلك تنتج طلبات الاتجاه التي لا تتضمن `deviceId` صورة أو مقطعًا واحدًا بالموضع `unknown` بدلًا من الادعاء بأنها كاميرا أمامية أو خلفية. استخدم `deviceId` عندما يحتوي المضيف على عدة كاميرات. يستخدم `camera.snap` إحماء إدخال FFmpeg لمدة `delayMs` ويحافظ على نسبة العرض إلى الارتفاع مع تقييد العرض. يسجل `camera.clip` صوت الميكروفون بصفته مسار الصوت في MP4؛ ولا يعرض OpenClaw عمدًا أي أمر مستقل للميكروفون.

يستخدم Plugin الترميز `libx264` لفيديو MP4 ولا يغيّر برامج الترميز بصمت. يُرجع إصدار FFmpeg الذي يفتقر إلى الإدخال أو برامج الترميز المطلوبة `CAMERA_UNAVAILABLE`. تفشل الصور والمقاطع التي ستتجاوز ميزانية حمولة base64 البالغة 25MB مع `PAYLOAD_TOO_LARGE`.

يظل `camera.snap` و`camera.clip` أمرين خطيرين. أضفهما إلى `gateway.nodes.allowCommands` فقط عندما تنوي تسليح الالتقاط؛ فتفعيل Plugin وحده لا يتجاوز سياسة Gateway.

## السلامة والحدود العملية

- يؤدي الوصول إلى الكاميرا والميكروفون إلى تشغيل مطالبات الأذونات المعتادة لنظام التشغيل (ويتطلب سلاسل الاستخدام في `Info.plist`).
- تُحد مقاطع الفيديو عند 60s لتجنب حمولات العقدة كبيرة الحجم (الحمل الإضافي لـ base64 إضافةً إلى حدود الرسائل).

## فيديو شاشة macOS (على مستوى نظام التشغيل)

لفيديو _الشاشة_ (وليس الكاميرا)، استخدم تطبيق macOS المصاحب:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # يطبع المسار المحفوظ
```

يتطلب إذن **Screen Recording** في macOS ‏(TCC).

## ذو صلة

- [دعم الصور والوسائط](/ar/nodes/images)
- [فهم الوسائط](/ar/nodes/media-understanding)
- [أمر الموقع](/ar/nodes/location-command)
