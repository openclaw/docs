---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، الإطارات، تحديد الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-07T13:19:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عُقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويصرّحون بـ **الدور** + **النطاق** عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحدَّد إطارات ما قبل الاتصال بسقف 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة الزائدة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يُسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة،
  أو محتويات المرفقات، أو نص الإطار الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية.

## المصافحة (connect)

Gateway → العميل (تحدي ما قبل الاتصال):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

العميل → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → العميل:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

بينما لا يزال Gateway يُكمل مكونات بدء التشغيل الجانبية، يمكن أن يعيد طلب `connect`
خطأ `UNAVAILABLE` قابلاً لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة ذلك الرد
ضمن ميزانية الاتصال الإجمالية لديهم بدلاً من عرضه كفشل نهائي
للمصافحة.

تتطلب المخططات `server` و`features` و`snapshot` و`policy` كلها
(`src/gateway/protocol/schema/frames.ts`). كما أن `auth` مطلوب أيضاً ويبلّغ
عن الدور/النطاقات المتفاوض عليها. أما `pluginSurfaceUrls` فهو اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL الخاصة بأسطح Plugin المحددة النطاق. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Canvas Plugin التجريبية
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ ويجب على العملاء الأصليين والـ gateways الحاليين استخدام أسطح Plugin.

عندما لا يُصدَر رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
من دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الخلفية الموثوقين داخل العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار محجوز
لنداءات RPC الداخلية لمستوى التحكم ويمنع خطوط أساس اقتران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء مصدر المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الاقتران وترقية النطاق العادية.

عند إصدار رمز جهاز، يتضمن `hello-ok` أيضاً:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضاً إدخالات أدوار
إضافية ومحدودة في `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

في تدفق تمهيد العقدة/المشغّل المضمّن، يبقى رمز العقدة الأساسي
`scopes: []` وأي رمز مشغّل مُسلَّم يبقى محدوداً بقائمة السماح لمشغّل التمهيد
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغّل لا تفي إلا بطلبات المشغّل، ولا تزال الأدوار
غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## التأطير

- **الطلب**: `{type:"req", id, method, params}`
- **الاستجابة**: `{type:"res", id, ok, payload|error}`
- **الحدث**: `{type:"event", event, payload, seq?, stateVersion?}`

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (انظر المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاق المشغّل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغّل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف الإمكانات (camera/screen/canvas/system.run).

### النطاقات (المشغّل)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` النطاق `operator.talk.secrets`
(أو `operator.admin`).

قد تطلب طرق RPC الخاصة بـ Gateway والمسجلة بواسطة Plugin نطاق مشغّل خاصاً بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`,
`update.*`) تُحل دائماً إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي تُستخدم عبر
`chat.send` تطبق فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب عمليات كتابة
`/config set` و`/config unset` الدائمة `operator.admin`.

يحتوي `node.pair.approve` أيضاً على فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي على أوامر عقد غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تصرّح العقد بمطالبات الإمكانات عند وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen` و
  `location` و`voice` و`talk`.
- `commands`: قائمة سماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` كي تتمكن واجهات UI من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغّلاً** و**عقدة** في الوقت نفسه.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تبلّغ العقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ كما يمكن للعقد المقترنة الإبلاغ
  عن حضور خلفي دائم عندما يحدّث حدث عقدة موثوق بيانات تعريف الاقتران الخاصة بها.

### حدث بقاء العقدة حية في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء تنبيه في الخلفية من دون تعليمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh` أو
`significant_location` أو `manual` أو `connect`. تُطبَّع سلاسل المشغّل غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائماً فقط لجلسات أجهزة العقد
المصادق عليها؛ أما الجلسات بلا جهاز أو غير المقترنة فتعيد `handled: false`.

تعيد gateways الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد تظل gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك كـ
RPC مُقرّ به، وليس كحفظ دائم للحضور.

## تحديد نطاق أحداث البث

أحداث بث WebSocket التي يدفعها الخادم محكومة بالنطاق بحيث لا تتلقى الجلسات محددة الاقتران أو المخصصة للعقد فقط محتوى الجلسة بشكل سلبي.

- تتطلب **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) `operator.read` على الأقل. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تخضع **بثوث `plugin.*` المعرفة بواسطة Plugin** لـ `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- تبقى **أحداث الحالة والنقل** (`heartbeat`، `presence`، `tick`، دورة حياة الاتصال/قطع الاتصال، إلخ) غير مقيدة كي تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- تخضع **عائلات أحداث البث غير المعروفة** للنطاق افتراضياً (فشل مغلق) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل بحيث تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغاً مولداً — `hello-ok.features.methods` هي قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتاً أو المفحوصة حديثاً.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الحديث. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والعدادات، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو نصوص Webhook، أو مخرجات الأدوات، أو نصوص الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يتطلب نطاق قراءة المشغّل.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء المشغّل محددي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغّل/العقد المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح به في وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للمُنتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - يعيد `doctor.memory.status` جاهزية الذاكرة المتجهية / تضمينات الذاكرة المخبأة لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال حيًا بمزوّد التضمينات.
    - يعيد `doctor.memory.remHarness` معاينة REM محدودة وللقراءة فقط لعملاء مستوى التحكم البعيد. يمكن أن يتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤسسًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المضمنة + المجمّعة.
    - يسجل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` إشعار APNs اختباريًا إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` محفزات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC المباشر للتسليم الصادر لعمليات الإرسال المستهدفة حسب القناة/الحساب/المحادثة خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.catalog` كتالوج مزوّد Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرّفات المزوّدين، والتسميات، وحالة التكوين، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع القياسية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية دون إرجاع أسرار المزوّدين أو تعديل الإعدادات العامة.
    - يعيد `talk.config` حمولة إعدادات Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - ينشئ `talk.session.create` جلسة Talk مملوكة من Gateway لـ `realtime/gateway-relay`، أو `transcription/gateway-relay`، أو `stt-tts/managed-room`. يتطلب `brain: "direct-tools"` الصلاحية `operator.admin`.
    - يتحقق `talk.session.join` من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` عند الحاجة، ويعيد بيانات تعريف الغرفة/الجلسة إضافةً إلى أحداث Talk الحديثة دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - يضيف `talk.session.appendAudio` صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة من Gateway.
    - تقود `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة الدور في الغرفة المُدارة مع رفض الدور القديم قبل مسح الحالة.
    - يوقف `talk.session.cancelOutput` إخراج صوت المساعد، أساسًا للمقاطعة المقيّدة بـ VAD في جلسات ترحيل Gateway.
    - يكمل `talk.session.submitToolResult` استدعاء أداة مزوّد صادرًا عن جلسة ترحيل فورية مملوكة من Gateway.
    - يغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة من Gateway ويصدر أحداث Talk النهائية.
    - يضبط `talk.mode` حالة وضع Talk الحالي ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.client.create` جلسة مزوّد فورية مملوكة من العميل باستخدام `webrtc` أو `provider-websocket` بينما يملك Gateway الإعدادات وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - يتيح `talk.client.toolCall` لوسائل النقل الفورية المملوكة من العميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. أول أداة مدعومة هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - `talk.event` هي قناة أحداث Talk الوحيدة للوقت الفوري، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، ومحوّلات الاجتماعات.
    - يصنع `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تمكين TTS، والمزوّد النشط، ومزوّدي الرجوع الاحتياطي، وحالة إعدادات المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعدادات، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة الإعدادات الحالية والتجزئة.
    - يكتب `config.set` حمولة إعدادات متحققًا منها.
    - يدمج `config.patch` تحديث إعدادات جزئيًا.
    - يتحقق `config.apply` من حمولة الإعدادات الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعدادات الحية التي تستخدمها أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات ونص المساعدة نفسهما المستخدمين في الواجهة، بما في ذلك فروع تكوين الكائنات المتداخلة، وحروف البدل، وعناصر المصفوفات، و`anyOf` / `oneOf` / `allOf` عند وجود توثيق حقل مطابق.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار إعدادات واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرين للتنقل التفصيلي في UI/CLI. تحتفظ عقد مخطط البحث بالتوثيق الموجه للمستخدم وحقول التحقق الشائعة (`title` و`description` و`type` و`enum` و`const` و`format` و`pattern` وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). تكشف ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، إضافةً إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` لكي يستأنف بدء التشغيل دور وكيل متابعة واحدًا عبر طابور متابعة إعادة التشغيل. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبلا فترة تهدئة بعد تبديل الحزمة حتى لا تواصل عملية Gateway القديمة التحميل الكسول من شجرة `dist` مستبدلة.
    - يعيد `update.status` أحدث مؤشر إعادة تشغيل تحديث مخبأ، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - تكشف `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج التهيئة عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المكشوفة للوكيل.
    - تكشف `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات وتنزيلات الآثار المشتقة من النص لجطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة من جهة الخادم وتعيد فقط وسائط النص ذات المصدرية المطابقة؛ تعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدل الجلب من جهة الخادم.
    - تكشف `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية والعقد للقراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عند تكوين خلفية وقت تشغيل وكيل.
    - يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسة لعميل WS الحالي.
    - يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصية محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحدًا لمفتاح جلسة دقيق.
    - يحل `sessions.resolve` هدف جلسة أو يحوله إلى صيغة قياسية.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يجهض `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلغ عن النموذج القياسي المحلول إضافةً إلى `agentRuntime` الفعال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - يعيد `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يجري تطبيع `chat.history` للعرض لعملاء الواجهة: تُزال وسوم التعليمات المضمنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات ذات النص العادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة) ورموز التحكم في النماذج المتسربة بأسلوب ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة البحتة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف الضخمة بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node، والاستدعاء، والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمرًا إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - ينقل `node.event` الأحداث الصادرة من Node عائدةً إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - يدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لعقد Node غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقة">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة، إضافة إلى البحث عن الموافقات المعلّقة أو إعادة تشغيلها.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلّقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - يدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - يدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية للعقدة عبر أوامر ترحيل العقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` مسارات الموافقة التي يعرّفها plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يحدد `wake` موعد حقن نص إيقاظ فوري أو عند Heartbeat التالية؛ ويدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` الأعمال المجدولة.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى
  مقتصرة على النص المنسوخ.
- `session.message` و`session.tool`: تحديثات النص المنسوخ/تدفق الأحداث لجلسة
  مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة وجود النظام.
- `tick`: حدث دوري للحفاظ على الاتصال / التحقق من الحيوية.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب استدعاء العقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغّل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة plugin.

### طرق مساعدة العقدة

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية
  لاستخدامها في فحوصات السماح التلقائي.

### طرق مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي دون الشرطة المائلة `/` البادئة
    - يعيد `native` والمسار الافتراضي `both` أسماء أصلية واعية بالمزوّد
      عند توفرها
  - يحمل `textAliases` أسماء بديلة بشرطة مائلة دقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات وسيطات متسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات وصفية للمصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدّمه المستدعي.
  - الاستجابة محددة النطاق بالجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وplugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، يجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة عبارة عن غلاف موجه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` مهيكلة. تعيد حالات رفض الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعدادات وخيارات تثبيت
    منقّاة دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات ClawHub الوصفية للاكتشاف.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }`
    مجلد skill في دليل `skills/` داخل مساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرّحا به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug واحدا متتبعا أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` وسيط `view` اختياريا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مهيئا، تكون الاستجابة هي الكتالوج المسموح؛ وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم منتقي النماذج. إذا كان `agents.defaults.models` مهيئا، يظل هو الغالب. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مهيأة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا لواجهات التشخيص والاكتشاف، وليس لمنتقيات النماذج العادية.

## موافقات exec

- عندما يحتاج طلب exec إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحل عملاء المشغّل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (بيانات `argv`/`cwd`/`rawCommand`/الجلسة الوصفية القياسية). ترفض الطلبات التي لا تحتوي على `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المحالة استخدام
  `systemRunPlan` القياسية تلك كسياق موثوق للأمر/cwd/الجلسة.
- إذا عدّل المستدعي `command` أو`rawCommand` أو`cwd` أو`agentId` أو
  `sessionKey` بين التحضير وتمرير `system.run` النهائي الموافق عليه، يرفض
  Gateway التشغيل بدلا من الوثوق بالحمولة المعدّلة.

## رجوع تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى تنفيذ مقتصر على الجلسة عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يعيش `PROTOCOL_VERSION` في `src/gateway/protocol/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُنشأ المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر البروتوكول v4 وهي خط الأساس المتوقع لعملاء الأطراف الثالثة.

| الثابت                                    | الافتراضي                                           | المصدر                                                                                     |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                 | `src/gateway/protocol/version.ts`                                                          |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                         | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال      | `15_000` ms                                         | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/البيئة رفع ميزانية الخادم/العميل المقترنين) |
| التراجع الأولي لإعادة الاتصال             | `1_000` ms                                          | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى للتراجع عند إعادة الاتصال     | `30_000` ms                                         | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| مهلة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                          | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فترة tick الافتراضية (قبل `hello-ok`)     | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| إغلاق بسبب مهلة tick                      | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                          | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم عن القيم الفعّالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ ويجب على العملاء احترام تلك القيم
بدلا من القيم الافتراضية قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسرّ المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المُكوَّن.
- تفي الأوضاع التي تحمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير حلقة الإرجاع
  `gateway.auth.mode: "trusted-proxy"` بفحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للمدخلات الخاصة مصادقة الاتصال بالسرّ
  المشترك بالكامل؛ لا تعرض هذا الوضع على مدخلات عامة/غير موثوقة.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محدد النطاق بدور الاتصال
  + النطاقات. يُرجع في `hello-ok.auth.deviceToken` ويجب أن يحتفظ به
  العميل للاتصالات المستقبلية.
- يجب أن يحتفظ العملاء بـ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن يعيد الاتصال باستخدام رمز الجهاز **المخزّن** أيضاً استخدام مجموعة
  النطاقات المعتمدة المخزّنة لذلك الرمز. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح سابقاً، ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى نطاق ضمني أضيق
  للمسؤول فقط.
- تجميع مصادقة الاتصال من جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرَّر دائماً عند ضبطه.
  - يُملأ `auth.token` بترتيب الأولوية: الرمز المشترك الصريح أولاً،
    ثم `deviceToken` صريح، ثم رمز مخزّن لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا ينتج أي مما سبق
    `auth.token`. يمنعه الرمز المشترك أو أي رمز جهاز تم حله.
  - الترقية التلقائية لرمز جهاز مخزّن في إعادة المحاولة الوحيدة بعد
    `AUTH_TOKEN_MISMATCH` محكومة بـ **نقاط النهاية الموثوقة فقط** —
    حلقة الإرجاع، أو `wss://` مع `tlsFingerprint` مثبّت. لا يتأهل
    `wss://` العام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم للتمهيد.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق
  مثل `wss://` أو اقتران حلقة الإرجاع/المحلي.
- إذا قدّم العميل `deviceToken` **صريحاً** أو `scopes` صريحة، فتبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجع؛ لا يُعاد استخدام النطاقات
  المخزّنة مؤقتاً إلا عندما يعيد العميل استخدام الرمز المخزّن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يُرجع `device.token.rotate` بيانات وصفية للتدوير. يعيد رمز الحامل البديل
  فقط لاستدعاءات الجهاز نفسه التي صودق عليها مسبقاً باستخدام رمز ذلك الجهاز،
  بحيث يستطيع العملاء المعتمدون على الرمز فقط الاحتفاظ ببديلهم قبل إعادة
  الاتصال. تدويرات المشاركة/المسؤول لا تعيد رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محدوداً بمجموعة الأدوار المعتمدة
  المسجلة في إدخال الاقتران لذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع دور
  جهاز أو استهداف دور جهاز لم يمنحه اعتماد الاقتران مطلقاً.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضاً `operator.admin`: يمكن للمستدعين غير المسؤولين إزالة/إبطال/تدوير
  إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و `device.token.revoke` أيضاً من مجموعة نطاقات
  رمز المشغّل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون
  غير المسؤولين تدوير أو إبطال رمز مشغّل أوسع مما لديهم بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` مع تلميحات استرداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - يجوز للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزّن مؤقتاً لكل جهاز.
  - إذا فشلت إعادة المحاولة هذه، يجب أن يوقف العملاء حلقات إعادة الاتصال التلقائية ويعرضوا إرشادات إجراء المشغّل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العُقد هوية جهاز مستقرة (`device.id`) مشتقة من بصمة
  زوج مفاتيح.
- تصدر Gateways رموزاً لكل جهاز + دور.
- اعتمادات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي المحلي
  مفعّلاً.
- يتمحور الاعتماد التلقائي للاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضاً مسار اتصال ذاتي ضيق محلي للخلفية/الحاوية لتدفقات
  المساعد الموثوقة ذات السرّ المشترك.
- لا تزال اتصالات tailnet على المضيف نفسه أو اتصالات LAN تُعامل كاتصالات بعيدة للاقتران
  وتتطلب اعتماداً.
- يضمّن عملاء WS عادة هوية `device` أثناء `connect` (المشغّل +
  العقدة). استثناءات المشغّل من دون جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` للتوافق مع HTTP غير الآمن على المضيف المحلي فقط.
  - مصادقة واجهة التحكم للمشغّل الناجحة عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر طارئ للحماية، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر حلقة الإرجاع لـ `gateway-client` المصادق عليها باستخدام رمز/كلمة مرور Gateway المشتركة.
- يجب أن توقّع جميع الاتصالات قيمة nonce في `connect.challenge` المقدمة من الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغاً).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل بقيمة nonce قديمة/خاطئة.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائماً `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و `deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تبقى تواقيع `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للجهاز المقترن لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختيارياً تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو خيار CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة API الكاملة لـ Gateway** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العُقد، الاعتمادات، إلخ). يُعرَّف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
