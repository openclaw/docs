---
read_when:
    - تنفيذ أو تحديث عملاء WS لـ Gateway
    - تصحيح أخطاء عدم تطابق البروتوكول أو إخفاقات الاتصال
    - إعادة توليد مخطط البروتوكول/نماذجه
summary: 'بروتوكول WebSocket في Gateway: المصافحة، والإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-30T08:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل Node** في
OpenClaw. يتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعقد iOS/Android، والعقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تقتصر إطارات ما قبل الاتصال على 64 KiB. بعد نجاح المصافحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تمكين التشخيصات،
  تصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة
  أو محتويات المرفقات أو جسم الإطار الخام أو الرموز أو ملفات تعريف الارتباط أو القيم السرية.

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
    "minProtocol": 3,
    "maxProtocol": 3,
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
    "protocol": 3,
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

بينما لا يزال Gateway ينهي تشغيل الخدمات الجانبية عند بدء التشغيل، يمكن أن
يعيد طلب `connect` خطأ `UNAVAILABLE` قابلا لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة ذلك الرد
ضمن ميزانية الاتصال الإجمالية لديهم بدلا من عرضه كفشل نهائي
في المصافحة.

كل من `server` و`features` و`snapshot` و`policy` مطلوب في المخطط
(`src/gateway/protocol/schema/frames.ts`). كما أن `auth` مطلوب أيضا ويبلغ عن
الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عند عدم إصدار رمز جهاز، يبلغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول رمز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الواجهة الخلفية الموثوقين داخل العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط الأساس القديمة لإقران CLI/الجهاز من
حظر عمل الواجهة الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء Node، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الإقران العادية وترقية النطاق.

عند إصدار رمز جهاز، يتضمن `hello-ok` أيضا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضا إدخالات أدوار
إضافية محدودة في `deviceTokens`:

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

بالنسبة إلى تدفق تمهيد Node/المشغل المدمج، يبقى رمز Node الأساسي
`scopes: []` ويبقى أي رمز مشغل مسلم محدودا بقائمة السماح
الخاصة بمشغل التمهيد (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل تفي بطلبات المشغل فقط، ولا تزال الأدوار غير المشغل
تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف القدرات (camera/screen/canvas/system.run).

### النطاقات (المشغل)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` النطاق `operator.talk.secrets`
(أو `operator.admin`).

يمكن لطرق RPC الخاصة بـ Gateway والمسجلة من Plugin طلب نطاق مشغل خاص بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تتحول دائما إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب كتابات
`/config set` و`/config unset` الدائمة `operator.admin`.

يحتوي `node.pair.approve` أيضا على فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر Node غير exec: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (Node)

تعلن Nodes عن مطالبات القدرة وقت الاتصال:

- `caps`: فئات القدرة عالية المستوى.
- `commands`: قائمة السماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تشغيل/إيقاف دقيقة (مثل `screen.record`، `camera.capture`).

يتعامل Gateway مع هذه كـ **مطالبات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلا** و**Node** معا.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تبلغ Nodes المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضا الإبلاغ عن
  حضور خلفية دائم عندما يحدث حدث Node موثوق بيانات الإقران الوصفية الخاصة بها.

### حدث بقاء Node في الخلفية

يمكن لـ Nodes استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن Node مقترنة كانت
حية أثناء تنبيه في الخلفية دون تعليمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تطبع Gateway سلاسل المشغلات غير المعروفة إلى
`background` قبل الحفظ. يكون الحدث دائما فقط لجلسات جهاز Node
المصادق عليها؛ وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد Gateways الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك على أنه
استدعاء RPC مؤكد، وليس حفظا دائما للحضور.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات النطاق بحيث لا تستقبل الجلسات ذات نطاق الإقران أو جلسات Node فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب `operator.read` على الأقل. الجلسات التي لا تملك `operator.read` تتجاوز هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة من Plugin** تخضع لبوابة `operator.write` أو `operator.admin`، اعتمادا على كيفية تسجيلها بواسطة Plugin.
- **أحداث الحالة والنقل** (`heartbeat`، `presence`، `tick`، دورة حياة الاتصال/قطع الاتصال، إلخ) تبقى غير مقيدة حتى تظل صحة النقل مرئية لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تخضع لبوابة النطاق افتراضيا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص بكل عميل حتى تحافظ البثوث على ترتيب أحادي متزايد على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة حسب النطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست تفريغا مولدا — `hello-ok.features.methods` هي قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتا أو المفحوصة حديثا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي الحديث والمحدود. يحتفظ ببيانات وصفية تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. مطلوب نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ ولا تدرج الحقول الحساسة إلا لعملاء المشغل ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يُرجع `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للاختيار (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يُرجع `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
    - يُرجع `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - يُرجع `doctor.memory.status` جاهزية الذاكرة المتجهية / التضمين المخزّن مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمين.
    - يُرجع `doctor.memory.remHarness` معاينة محدودة وللقراءة فقط لحاضنة REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقاطع ذاكرة، وMarkdown مستندًا إلى مصادر بعد عرضه، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يُرجع `sessions.usage` ملخصات استخدام لكل جلسة.
    - يُرجع `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يُرجع `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يُرجع `channels.status` ملخصات حالة القناة/Plugin المضمّنة + المجمّعة.
    - يسجّل `channels.logout` خروج قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى Node iOS مسجّل.
    - يُرجع `voicewake.get` مشغلات كلمة التنبيه المخزّنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - يُعد `send` استدعاء RPC المباشر للتسليم الصادر لعمليات الإرسال المستهدفة بالقناة/الحساب/السلسلة خارج مشغّل الدردشة.
    - يُرجع `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم بالمؤشر/الحد والحد الأقصى للبايت.

  </Accordion>

  <Accordion title="التحدث وTTS">
    - يُرجع `talk.config` حمولة تكوين التحدث الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` حالة وضع التحدث الحالية ويبثها لعملاء WebChat/واجهة التحكم.
    - ينشئ `talk.speak` كلامًا عبر مزوّد كلام التحدث النشط.
    - يُرجع `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الاحتياط، وحالة تكوين المزوّد.
    - يُرجع `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضّل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من النص إلى الكلام.

  </Accordion>

  <Accordion title="الأسرار والتكوين والتحديث والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يُرجع `config.get` لقطة التكوين الحالية والتجزئة.
    - يكتب `config.set` حمولة تكوين متحققًا منها.
    - يدمج `config.patch` تحديث تكوين جزئيًا.
    - يتحقق `config.apply` من حمولة التكوين الكاملة + يستبدلها.
    - يُرجع `config.schema` حمولة مخطط التكوين الحية المستخدمة بواسطة واجهة التحكم وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات نفسها ونص المساعدة المستخدمين بواسطة واجهة المستخدم، بما في ذلك فروع تركيب الكائنات المتداخلة، وحروف البدل، وعناصر المصفوفات، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يُرجع `config.schema.lookup` حمولة بحث محددة المسار لمسار تكوين واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرة للتنقل التفصيلي في واجهة المستخدم/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، إضافةً إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه.
    - يُرجع `update.status` أحدث مؤشر إعادة تشغيل تحديث مخزّن مؤقتًا، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - تعرض `wizard.start`، و`wizard.next`، و`wizard.status`، و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يُرجع `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create`، و`agents.update`، و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list`، و`agents.files.get`، و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة لوكيل.
    - يُرجع `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويُرجع اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - يُرجع `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل الوكيل مكوّنة.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يُرجع `sessions.preview` معاينات نصية محدودة لمفاتيح جلسات محددة.
    - يحل `sessions.resolve` هدف جلسة أو يطبّعه إلى صيغة قانونية.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يُعد `sessions.steer` صيغة المقاطعة والتوجيه لجلسة نشطة.
    - يجهض `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلّغ عن النموذج القانوني المحلول إضافةً إلى `agentRuntime` الفعال.
    - تنفّذ `sessions.reset`، و`sessions.delete`، و`sessions.compact` صيانة الجلسات.
    - يُرجع `sessions.get` صف الجلسة المخزّن بالكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history`، و`chat.send`، و`chat.abort`، و`chat.inject`. يكون `chat.history` مطبّعًا للعرض لعملاء واجهة المستخدم: تُزال وسوم التعليمات المضمنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات كنص عادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)، وتُزال رموز تحكم النموذج المتسربة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة الصرفة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يُرجع `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve`، و`device.pair.reject`، و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترنًا ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترنًا ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request`، و`node.pair.list`، و`node.pair.approve`، و`node.pair.reject`، و`node.pair.remove`، و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يُرجع `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترن.
    - يمرّر `node.invoke` أمرًا إلى Node متصل.
    - يُرجع `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من Node عائدةً إلى Gateway.
    - يحدّث `node.canvas.capability.refresh` رموز إمكانية اللوحة محددة النطاق.
    - يُعد `node.pending.pull` و`node.pending.ack` واجهات API لطابور Node المتصل.
    - يدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لعقد Node غير المتصلة/المفصولة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request`، و`exec.approval.get`، و`exec.approval.list`، و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة إضافةً إلى بحث/إعادة تشغيل الموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويُرجع القرار النهائي (أو `null` عند انتهاء المهلة).
    - يدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة التنفيذ في Gateway.
    - يدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request`، و`plugin.approval.list`، و`plugin.approval.waitDecision`، و`plugin.approval.resolve` تدفقات الموافقة المعرّفة بواسطة Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يقرر `wake` حقن نص تنبيه فوريًا أو عند Heartbeat التالي؛ تدير `cron.list`، و`cron.status`، و`cron.add`، و`cron.update`، و`cron.remove`، و`cron.run`، و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list`، و`skills.*`، و`tools.catalog`، و`tools.effective`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة
  مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها التعريفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق حدث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر تكوين مشغّل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### أساليب مساعدة Node

- يمكن لعقد Node استدعاء `skills.bins` لجلب القائمة الحالية لتنفيذيات Skills
  لفحوصات السماح التلقائي.

### أساليب مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون `/` البادئة
    - يعيد مسارا `native` و`both` الافتراضي أسماء أصلية مدركة للمزوّد
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة دقيقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المدرك للمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر
    Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات تعريف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق المصادقة أو التسليم المقدم من المستدعي.
  - تكون الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات الناقصة، وفحوصات الإعداد، وخيارات
    التثبيت المنقحة من دون كشف القيم السرية الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات تعريف الاكتشاف في ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد مهارة في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضية.
  - وضع مثبت Gateway: يشغل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرحا به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدث وضع ClawHub اسما مختصرا واحدا متتبعا أو كل عمليات تثبيت ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقع وضع الإعداد قيما ضمن `skills.entries.<skillKey>` مثل `enabled`،
    و`apiKey`، و`env`.

### عروض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مكوّنا، تكون الاستجابة هي الكتالوج المسموح؛ وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` مكوّنا، فسيظل له الأولوية. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مكوّنة.
- `"all"`: كتالوج Gateway الكامل، متجاوزا `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحسم عملاء المشغّل الطلب باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القياسية). ترفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام `systemRunPlan` القياسي
  كسياق الأمر/cwd/الجلسة المرجعي.
- إذا عدّل مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وإعادة التوجيه النهائية المعتمدة لـ`system.run`، فإن
  Gateway يرفض التشغيل بدلا من الوثوق بالحمولة المعدلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ ضمن الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (على سبيل المثال جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم عدم التطابق.
- تُولّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع لعملاء الجهات الخارجية.

| الثابت                                    | الافتراضي                                            | المصدر                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المقترنة) |
| التراجع الأولي لإعادة الاتصال             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتراجع إعادة الاتصال          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| تثبيت إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| المهلة الافتراضية لـ`stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم قيم `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` الفعّالة في `hello-ok`؛ يجب على العملاء احترام هذه القيم
بدلا من القيم الافتراضية قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، وفقا لوضع المصادقة المكوّن.
- تفي الأوضاع التي تحمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` خارج loopback
  بفحص مصادقة الاتصال من رؤوس الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محدد النطاق بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` ويجب أن
  يحتفظ به العميل للاتصالات المستقبلية.
- يجب على العملاء الاحتفاظ بـ`hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** هذا استخدام مجموعة النطاقات
  المعتمدة المخزنة لذلك الرمز. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح بالفعل ويتجنب تضييق عمليات إعادة الاتصال بصمت إلى نطاق
  ضمني إداري فقط.
- تجميع مصادقة الاتصال على جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائما عند ضبطه.
  - تتم تعبئة `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق
    `auth.token`. يمنعه الرمز المشترك أو أي رمز جهاز محلول.
  - الترقية التلقائية لرمز جهاز مخزن عند إعادة المحاولة لمرة واحدة بسبب
    `AUTH_TOKEN_MISMATCH` محكومة بـ**النقاط النهائية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم تمهيدية.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة تمهيدية على نقل موثوق
  مثل `wss://` أو اقتران loopback/local.
- إذا قدم العميل `deviceToken` **صريحا** أو `scopes` صريحة، فتبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجعية؛ ولا يعاد استخدام النطاقات المخبأة إلا
  عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات تعريف التدوير. يكرر رمز الحامل البديل
  فقط للاستدعاءات من الجهاز نفسه المصادق عليها مسبقا بذلك
  الرمز، حتى يتمكن العملاء المعتمدون على الرمز فقط من الاحتفاظ بالبديل قبل
  إعادة الاتصال. تدويرات السر المشترك/الإدارة لا تكرر رمز الحامل.
- يظل إصدار الرموز وتدويرها وإبطالها محدودا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع
  دور جهاز أو استهداف دور لم تمنحه موافقة الاقتران قط.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة ذاتية النطاق ما لم يكن
  لدى المستدعي أيضا `operator.admin`: يمكن للمستدعين غير الإداريين إزالة/إبطال/تدوير
  إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضا من مجموعة نطاقات رمز المشغّل
  المستهدف مقارنة بنطاقات جلسة المستدعي الحالية. لا يمكن للمستدعين غير الإداريين
  تدوير أو إبطال رمز مشغّل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقية)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز مخزن لكل جهاز.
  - إذا فشلت إعادة المحاولة تلك، فيجب على العملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء المشغّل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من بصمة زوج مفاتيح.
- تصدر مثيلات Gateway رموزًا مميزة لكل جهاز + دور.
- تكون موافقات الإقران مطلوبة لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة التلقائية المحلية
  مفعّلة.
- تتمحور الموافقة التلقائية على الإقران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضًا مسار ضيق للاتصال الذاتي من الخلفية/الحاوية المحلية
  لتدفقات المساعد الموثوق المعتمدة على سر مشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة للإقران
  وتتطلب الموافقة.
- عادةً ما تتضمن عملاء WS هوية `device` أثناء `connect` (المشغّل +
  العقدة). الاستثناءات الوحيدة للمشغّل بلا جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن على localhost فقط.
  - مصادقة Control UI ناجحة للمشغّل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (إجراء طارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر local loopback لـ `gateway-client` والمصادَق عليها بواسطة رمز/كلمة مرور
    Gateway المشتركة.
- يجب أن توقّع جميع الاتصالات قيمة nonce الخاصة بـ `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القديمة التي لا تزال تستخدم سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

أعطال الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسله فارغًا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.             |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.      |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام.          |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق المفتاح العام/توحيده.                   |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات تعريف الجهاز المقترن
  لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع إعدادات `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة API الكاملة لـ Gateway** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، وما إلى ذلك). يحدد السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
