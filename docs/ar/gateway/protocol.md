---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - استكشاف أخطاء عدم تطابق البروتوكول أو فشل الاتصال وإصلاحها
    - إعادة توليد مخطط البروتوكول ونماذجه
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، الإطارات، إدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-01T07:40:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da9ce755b941789ae6b9e866247c8bebb86e9a1530fb8cb258fb0650b24b8a
    source_path: gateway/protocol.md
    workflow: 16
---

يعد بروتوكول Gateway WS **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعقد iOS/Android، والعقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحد إطارات ما قبل الاتصال عند 64 KiB. بعد مصافحة ناجحة، يجب على العملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز السبب الآمنة. ولا تحتفظ بنص الرسالة،
  أو محتويات المرفقات، أو جسم الإطار الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية.

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

بينما لا يزال Gateway ينهي تشغيل المكوّنات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
أن يرجع خطأ `UNAVAILABLE` قابلًا لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. يجب على العملاء إعادة محاولة ذلك الرد
ضمن ميزانية الاتصال الإجمالية لديهم بدلًا من عرضه كفشل مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوب في المخطط
(`src/gateway/protocol/schema/frames.ts`). كما أن `auth` مطلوب أيضًا ويبلّغ عن
الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عندما لا يصدر رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يجوز لعملاء الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار محجوز
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس إقران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الإقران وترقية النطاق المعتادة.

عند إصدار رمز جهاز، يتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضًا إدخالات أدوار
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

بالنسبة إلى تدفق تمهيد العقدة/المشغل المدمج، يبقى رمز العقدة الأساسي
`scopes: []`، ويبقى أي رمز مشغل مُسلّم محدودًا بقائمة السماح لمشغل التمهيد
(`operator.approvals`، و`operator.read`،
`operator.talk.secrets`، و`operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل تفي بطلبات المشغل فقط، ولا تزال الأدوار غير المشغلة
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
- `node` = مضيف الإمكانات (camera/screen/canvas/system.run).

### النطاقات (operator)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` وجود `operator.talk.secrets`
(أو `operator.admin`).

قد تطلب طرق Gateway RPC المسجلة بواسطة Plugin نطاق المشغل الخاص بها، لكن
بادئات إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
و`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب كتابات
`/config set` و`/config unset` الدائمة وجود `operator.admin`.

لدى `node.pair.approve` أيضًا فحص نطاق إضافي في وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تتضمن أوامر عقدة غير exec: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions (node)

تعلن العقد مطالبات الإمكانات وقت الاتصال:

- `caps`: فئات الإمكانات عالية المستوى.
- `commands`: قائمة السماح للأوامر من أجل الاستدعاء.
- `permissions`: مفاتيح تبديل تفصيلية (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يرجع `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` بحيث يمكن لواجهات المستخدم عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.
- يتضمن `node.list` حقلَي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تبلّغ العقد المتصلة
  عن وقت الاتصال الحالي الخاص بها في `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضًا الإبلاغ
  عن حضور خلفية دائم عندما يحدث حدث عقدة موثوق بيانات تعريف الإقران الخاصة بها.

### حدث بقاء Node في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون تمييزها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` هو تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغّل غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائمًا فقط لجلسات أجهزة العقد
المصادق عليها؛ أما الجلسات بلا جهاز أو غير المقترنة فترجع `handled: false`.

ترجع Gateways الناجحة نتيجة مهيكلة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال Gateways الأقدم ترجع `{ "ok": true }` من أجل `node.event`؛ يجب على العملاء التعامل مع ذلك باعتباره
استدعاء RPC مُقرًا به، لا باعتباره حفظًا دائمًا للحضور.

## تحديد نطاق أحداث البث

تُقيّد أحداث بث WebSocket المدفوعة من الخادم بالنطاق بحيث لا تتلقى الجلسات محددة الإقران أو الخاصة بالعقد فقط محتوى الجلسة بشكل سلبي.

- تتطلب **إطارات الدردشة، والوكيل، ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) وجود `operator.read` على الأقل. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تُقيّد **بثوث `plugin.*` المعرفة بواسطة Plugin** إلى `operator.write` أو `operator.admin`، حسب الطريقة التي سجلها بها Plugin.
- تبقى **أحداث الحالة والنقل** (`heartbeat`، و`presence`، و`tick`، ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) غير مقيدة بحيث تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- تُقيّد **عائلات أحداث البث غير المعروفة** بالنطاق افتراضيًا (فشل مغلق) ما لم يرخّصها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسلي خاص به لكل عميل بحيث تحافظ عمليات البث على ترتيب أحادي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مفلترة بالنطاق من دفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغًا مولدًا — فـ`hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق
Plugin/القناة المحملة. تعامل معها كاكتشاف للميزات، لا كتعداد كامل
لـ`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يرجع `health` لقطة صحة Gateway المخزنة مؤقتًا أو المفحوصة حديثًا.
    - يرجع `diagnostics.stability` مسجل استقرار التشخيصات المحدود الأخير. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلب أو الاستجابة الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة المشغل مطلوب.
    - يرجع `status` ملخص Gateway بنمط `/status`؛ ولا تُضمّن الحقول الحساسة إلا لعملاء المشغل ضمن نطاق الإدارة.
    - يرجع `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات الترحيل والإقران.
    - يرجع `system-presence` لقطة الحضور الحالية لأجهزة المشغل/العقد المتصلة.
    - يلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يرجع `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح به وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم المنتقي (`agents.defaults.models` أولاً، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين / الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمين المخزّن مؤقتاً لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمين.
    - يعيد `doctor.memory.remHarness` معاينة REM محدودة وللقراءة فقط لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤسّساً معروضاً، ومرشحين للترقية العميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة + المرفقة.
    - يسجّل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذاك ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى عقدة iOS مسجّلة.
    - يعيد `voicewake.get` مشغّلات كلمة التنبيه المخزّنة.
    - يحدّث `voicewake.set` مشغّلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر لعمليات الإرسال المستهدفة بالقناة/الحساب/السلسلة خارج مشغّل المحادثة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="الكلام وTTS">
    - يعيد `talk.config` حمولة تكوين Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.speak` كلاماً عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الرجوع الاحتياطي، وحالة تكوين المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضّل.
    - يشغّل `tts.convert` تحويلاً لمرة واحدة من النص إلى الكلام.

  </Accordion>

  <Accordion title="الأسرار، والتكوين، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة الأسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة التكوين الحالية والتجزئة.
    - يكتب `config.set` حمولة تكوين متحقّقاً منها.
    - يدمج `config.patch` تحديث تكوين جزئياً.
    - يتحقق `config.apply` من حمولة التكوين الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط التكوين الحي المستخدمة بواسطة Control UI وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات التعريف الخاصة بالتوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المستمدة من التسميات ونص المساعدة نفسيهما المستخدمين في واجهة المستخدم، بما في ذلك فروع تركيب الكائنات المتداخلة، وحرف البدل، وعناصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار تكوين واحد: المسار الموحّد، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرين للتعمق في UI/CLI. تحتفظ عقد مخطط البحث بالوثائق المواجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، إضافةً إلى `hint` / `hintPath` المطابق.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه.
    - يعيد `update.status` أحدث حارس إعادة تشغيل تحديث مخزّن مؤقتاً، بما في ذلك الإصدار قيد التشغيل بعد إعادة التشغيل عندما يكون متاحاً.
    - تكشف `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج التهيئة عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وتوصيل مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المكشوفة لوكيل.
    - تكشف `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات وتنزيلات القطع المشتقة من النص المنقول لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة من جهة الخادم وتعيد فقط وسائط النص المنقول ذات المصدر المطابق؛ تعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلاً من الجلب من جهة الخادم.
    - يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عندما تكون متاحة.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل الوكيل مكوّنة.
    - يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات لعميل WS الحالي.
    - يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص المنقول/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصوص منقولة محدودة لمفاتيح جلسات محددة.
    - يحل `sessions.resolve` هدف جلسة أو يجعله معيارياً.
    - ينشئ `sessions.create` إدخال جلسة جديداً.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يلغي `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده لعمليات التشغيل النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلّغ عن النموذج المعياري المحلول إضافةً إلى `agentRuntime` الفعال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزّن كاملاً.
    - لا يزال تنفيذ المحادثة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يكون `chat.history` موحّداً للعرض لعملاء واجهة المستخدم: تُزال وسوم التوجيه المضمّنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج المسرّبة بنمط ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` الدقيقة، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلّقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلّق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرّر `node.invoke` أمراً إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من Node عائداً إلى Gateway.
    - يحدّث `node.canvas.capability.refresh` رموز قدرة اللوحة محددة النطاق.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلّق المتين للعُقد غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة إضافةً إلى بحث/إعادة تشغيل الموافقات المعلّقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلّقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة التنفيذ في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرّفة بواسطة Plugin.

  </Accordion>

  <Accordion title="الأتمتة، وSkills، والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوري أو عند Heartbeat التالي؛ تدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات محادثة واجهة المستخدم مثل `chat.inject` وأحداث المحادثة الأخرى الخاصة بالنص المنقول فقط.
- `session.message` و`session.tool`: تحديثات النص المنقول/تدفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها التعريفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث إبقاء اتصال / حيوية دوري.
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

### طرق مساعدة Node

- يجوز للعُقد استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية لفحوصات السماح التلقائي.

### طرق مساعدة المشغّل

- يمكن للمشغلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل للوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون `/` البادئة
    - يعيد مسارا `native` والافتراضي `both` الأسماء الأصلية الواعية بالمزود عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة ذات الشرطة المائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزود عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسائط المسلسلة من الاستجابة.
- يمكن للمشغلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات تعريف المنشأ:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعال في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة من جهة الخادم بدلا من قبول سياق المصادقة أو التسليم المقدم من المستدعي.
  - الاستجابة مقيدة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن، بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوصات الإعداد وخيارات التثبيت المنقحة من دون كشف قيم الأسرار الخام.
- يمكن للمشغلين استدعاء `skills.search` و`skills.detail` (`operator.read`) لبيانات تعريف اكتشاف ClawHub.
- يمكن للمشغلين استدعاء `skills.install` (`operator.admin`) بوضعين:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }` مجلد Skill في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع مثبت Gateway: يشغل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` إجراء `metadata.openclaw.install` مصرحا به على مضيف Gateway.
- يمكن للمشغلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدث وضع ClawHub اسما مختصرا واحدا متتبعا أو كل تثبيتات ClawHub المتتبعة في مساحة عمل الوكيل الافتراضية.
  - يصحح وضع الإعداد قيم `skills.entries.<skillKey>` مثل `enabled` و`apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معاملا اختياريا هو `view`:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` معدا، تكون الاستجابة هي الكتالوج المسموح؛ وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم منتقي. إذا كان `agents.defaults.models` معدا، فإنه يظل ذا أولوية. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عند عدم وجود صفوف نماذج معدة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات مستخدم الاكتشاف، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway حدث `exec.approval.requested`.
- يحسم عملاء المشغل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` قيمة `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القانونية). ترفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام `systemRunPlan` القانونية كسياق الأمر/cwd/الجلسة الموثوق.
- إذا عدل مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو `sessionKey` بين التحضير وإعادة توجيه `system.run` النهائية الموافق عليها، يرفض Gateway التشغيل بدلا من الوثوق بالحمولة المعدلة.

## الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: أهداف التسليم غير المحلولة أو الداخلية فقط تعيد `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى تنفيذ الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات internal/webchat أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- توجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تولد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم مستقرة عبر protocol v3 وهي خط الأساس المتوقع لعملاء الجهات الخارجية.

| الثابت                                    | الافتراضي                                             | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة Preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المقترنة) |
| التأخير الأولي لإعادة الاتصال             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتأخير إعادة الاتصال          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| سماح الإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| المهلة الافتراضية لـ `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | code `4000` عندما يتجاوز الصمت `tickIntervalMs * 2`  | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم القيم الفعالة `policy.tickIntervalMs` و`policy.maxPayload` و`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي للعملاء احترام تلك القيم بدلا من افتراضات ما قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو `connect.params.auth.password`، بحسب وضع المصادقة المعد.
- تستوفي الأوضاع الحاملة للهوية مثل Tailscale Serve (`gateway.auth.allowTailscale: true`) أو `gateway.auth.mode: "trusted-proxy"` غير local loopback فحص مصادقة الاتصال من ترويسات الطلب بدلا من `connect.params.auth.*`.
- يتخطى `gateway.auth.mode: "none"` للمدخل الخاص مصادقة الاتصال بالسر المشترك بالكامل؛ لا تعرض هذا الوضع على مدخل عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيدا بدور الاتصال + النطاقات. يعاد في `hello-ok.auth.deviceToken` وينبغي أن يحتفظ به العميل للاتصالات المستقبلية.
- ينبغي للعملاء الاحتفاظ بـ `hello-ok.auth.deviceToken` الأساسي بعد أي اتصال ناجح.
- ينبغي أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** ذاك استخدام مجموعة النطاقات المعتمدة المخزنة لذلك الرمز أيضا. يحافظ هذا على وصول القراءة/الفحص/الحالة الذي سبق منحه ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى نطاق ضمني أضيق خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في `src/gateway/client.ts`):
  - `auth.password` مستقل ويرسل دائما عند تعيينه.
  - يملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولا، ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفتاحه `deviceId` + `role`).
  - يرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق `auth.token`. يثبطه وجود رمز مشترك أو أي رمز جهاز محلول.
  - تخضع الترقية التلقائية لرمز جهاز مخزن عند إعادة محاولة `AUTH_TOKEN_MISMATCH` لمرة واحدة إلى **نقاط النهاية الموثوقة فقط** — local loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://` العام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم Bootstrap. احتفظ بها فقط عندما يستخدم الاتصال مصادقة Bootstrap على نقل موثوق مثل `wss://` أو الاقتران local loopback/المحلي.
- إذا قدم عميل `deviceToken` **صريحا** أو `scopes` صريحة، تبقى مجموعة النطاقات التي طلبها المستدعي هي الموثوقة؛ لا يعاد استخدام النطاقات المخزنة مؤقتا إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و`device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات تعريف التدوير. يكرر رمز الحامل البديل فقط لاستدعاءات الجهاز نفسه التي تمت مصادقتها بالفعل برمز ذلك الجهاز، حتى يتمكن عملاء الرمز فقط من الاحتفاظ ببديلهم قبل إعادة الاتصال. لا تكرر تدويرات المشترك/المسؤول رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها مقيدا بمجموعة الأدوار المعتمدة المسجلة في إدخال اقتران ذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع دور جهاز أو استهداف دور لم تمنحه موافقة الاقتران قط.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن لدى المستدعي `operator.admin` أيضا: يستطيع المستدعون غير المسؤولين إزالة/إبطال/تدوير إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضا من مجموعة نطاق رمز المشغل المستهدف مقابل نطاقات الجلسة الحالية للمستدعي. لا يستطيع المستدعون غير المسؤولين تدوير أو إبطال رمز مشغل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل بالنسبة إلى `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن مؤقتا لكل جهاز.
  - إذا فشلت تلك المحاولة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات إجراء المشغل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن Nodes هوية جهاز ثابتة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- تكون موافقات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة التلقائية المحلية
  مفعّلة.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضًا مسار ضيق للاتصال الذاتي المحلي على الخلفية/الحاوية من أجل
  تدفقات المساعد الموثوقة ذات السر المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة للاقتران
  وتتطلب موافقة.
- عادةً ما يضمّن عملاء WS هوية `device` أثناء `connect` (المشغّل +
  Node). الاستثناءات الوحيدة للمشغّل بلا جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن المقتصر على localhost.
  - مصادقة واجهة التحكم للمشغّل الناجحة عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (خيار طوارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback من `gateway-client` والمصادَق عليها باستخدام رمز/كلمة مرور Gateway المشتركة.
- يجب أن توقّع كل الاتصالات قيمة nonce الخاصة بـ `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، أصبح `connect` يعيد الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` ثابت.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  إضافةً إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات تعريف الجهاز المقترن
  ما زال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة برمجة تطبيقات Gateway الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، Nodes، الموافقات، إلخ). يحدد السطح الدقيق عبر
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
