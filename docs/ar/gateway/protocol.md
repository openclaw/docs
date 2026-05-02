---
read_when:
    - تنفيذ أو تحديث عملاء WS لـ Gateway
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket لـ Gateway: المصافحة، الإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-02T20:46:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعُقد iOS/Android، والعُقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** عند وقت
المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحد إطارات ما قبل الاتصال عند 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة الزائدة الحجم والمخازن المؤقتة الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يُسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز الأسباب الآمنة. ولا تحتفظ بجسم الرسالة،
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

بينما لا يزال Gateway يُكمل تشغيل المكونات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة هذه الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلاً من عرضها كفشل مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوب في المخطط
(`src/gateway/protocol/schema/frames.ts`). و`auth` مطلوب أيضاً ويُبلغ
عن الدور/النطاقات المتفاوض عليها. أما `canvasHostUrl` فهو اختياري.

عندما لا يصدر رمز جهاز، يُبلغ `hello-ok.auth` عن الأذونات المتفاوض عليها
من دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الواجهة الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات الارتداد المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس إقران CLI/الجهاز القديمة من
حظر عمل الواجهة الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
ما زالوا يستخدمون فحوصات الإقران وترقية النطاق العادية.

عندما يصدر رمز جهاز، يتضمن `hello-ok` أيضاً:

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

بالنسبة إلى تدفق تمهيد العقدة/المشغل المدمج، يبقى رمز العقدة الأساسي
`scopes: []`، ويبقى أي رمز مشغل مُسلَّم محدوداً بقائمة السماح لمشغل التمهيد
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل تلبي طلبات المشغل فقط، ولا تزال الأدوار غير المشغلة
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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (انظر المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف القدرات (camera/screen/canvas/system.run).

### النطاقات (المشغل)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` نطاق `operator.talk.secrets`
(أو `operator.admin`).

قد تطلب طرق RPC الخاصة بـ Gateway والمسجلة عبر Plugin نطاق مشغل خاصاً بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تُحل دائماً إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` الدائمة نطاق `operator.admin`.

لدى `node.pair.approve` أيضاً فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي على أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (العقدة)

تعلن العقد مطالبات القدرة عند وقت الاتصال:

- `caps`: فئات القدرات عالية المستوى.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يعامل Gateway هذه كـ **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` لكي تتمكن الواجهات من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلاً** و**عقدة** معاً.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تُبلغ العقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضاً الإبلاغ
  عن حضور خلفي دائم عندما يحدث حدث عقدة موثوق بيانات تعريف الإقران الخاصة بها.

### حدث بقاء Node في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
نشطة أثناء تنبيه خلفي من دون وسمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh` أو
`significant_location` أو `manual` أو `connect`. تُطبع سلاسل المشغلات غير المعروفة إلى
`background` بواسطة Gateway قبل الاستمرار. يكون الحدث دائماً فقط لجلسات أجهزة العقد
المصادق عليها؛ وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد بوابات Gateway الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال بوابات Gateway الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك كاستدعاء RPC
مؤكد، وليس كاستمرار حضور دائم.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات النطاق بحيث لا تتلقى الجلسات ذات نطاق الإقران أو المخصصة للعقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. الجلسات التي لا تملك `operator.read` تتخطى هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة بواسطة Plugin** تُقيد إلى `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat`، `presence`، `tick`، دورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) تبقى غير مقيدة حتى تظل صحة النقل مرئية لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تخضع لبوابة النطاق افتراضياً (إغلاق عند الفشل) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل، بحيث تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست نسخة مولدة بالكامل — `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` إضافة إلى صادرات طرق
Plugin/القنوات المحملة. تعامل معها كاكتشاف للميزات، وليس كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتاً أو المفحوصة حديثاً.
    - يعيد `diagnostics.stability` مسجل استقرار التشخيصات الحديث والمحدود. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugins، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يتطلب نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بأسلوب `/status`؛ تُضمن الحقول الحساسة فقط لعملاء المشغلين ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/العقدة المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - تُرجع `models.list` فهرس النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المهيأة بحجم مناسب للاختيار (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للفهرس الكامل.
    - تُرجع `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
    - تُرجع `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخي.
    - تُرجع `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمين المخزن مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً إرسال اختبار حي إلى مزوّد التضمين.
    - تُرجع `doctor.memory.remHarness` معاينة REM محدودة وللقراءة فقط لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقاطع ذاكرة، وMarkdown مؤسسًا مُصيّرًا، ومرشحين للترقية العميقة، لذا يحتاج المستدعون إلى `operator.read`.
    - تُرجع `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - تُرجع `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - تُرجع `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - تُرجع `channels.status` ملخصات حالة القنوات/Plugins المضمنة + المرفقة.
    - تُسجّل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ القناة عند النجاح.
    - يرسل `push.test` إشعار دفع APNs اختباريًا إلى iOS node مسجل.
    - تُرجع `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - تُحدّث `voicewake.set` مشغلات كلمة التنبيه وتبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسالات المستهدفة إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
    - تُرجع `logs.tail` ذيل سجل ملف Gateway المهيأ مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="التحدث وTTS">
    - تُرجع `talk.config` حمولة إعداد Talk الفعلية؛ يتطلب `includeSecrets` صلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` ويبث حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - يُولّد `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - تُرجع `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الاحتياط، وحالة إعداد المزوّد.
    - تُرجع `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يُحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يُشغّل `tts.convert` تحويلًا أحاديًا من نص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار والإعداد والتحديث والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يُرجع `config.get` لقطة الإعداد الحالية والهاش.
    - يكتب `config.set` حمولة إعداد مُتحققًا منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا.
    - يتحقق `config.apply` من حمولة الإعداد الكاملة ويستبدلها.
    - يُرجع `config.schema` حمولة مخطط الإعداد الحي المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف حقلي `title` / `description` المستمدة من التسميات نفسها ونص المساعدة المستخدمَين في واجهة المستخدم، بما في ذلك فروع تركيب الكائنات المتداخلة، والبدائل العامة، وعناصر المصفوفات، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يُرجع `config.schema.lookup` حمولة بحث مقيّدة بالمسار لمسار إعداد واحد: المسار المُطبع، وعقدة مخطط سطحية، وتلميحًا مطابقًا + `hintPath`، وملخصات الأبناء المباشرة للتنقل التفصيلي في UI/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأعداد/السلاسل/المصفوفات/الكائنات، ورايات مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المُطبع، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يُشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد استبدال الحزمة حتى لا تواصل عملية Gateway القديمة التحميل الكسول من شجرة `dist` مستبدلة.
    - يُرجع `update.status` أحدث حارس إعادة تشغيل تحديث مخزن مؤقتًا، بما في ذلك الإصدار العامل بعد إعادة التشغيل عندما يكون متاحًا.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج التهيئة عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - تُرجع `agents.list` إدخالات الوكلاء المهيأة، بما في ذلك النموذج الفعلي وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة لوكيل.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات وتنزيلات القطع المشتقة من النصوص المنسوخة لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهمة الجلسة المالكة من جهة الخادم ولا تُرجع إلا وسائط النص المنسوخ ذات المصدر المطابق؛ وتُرجع مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلًا من جلبها من جهة الخادم.
    - يُرجع `agent.identity.get` هوية المساعد الفعلية لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويُرجع اللقطة النهائية عندما تكون متاحة.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - تُرجع `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون واجهة خلفية لوقت تشغيل الوكيل مهيأة.
    - يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسة لعميل WS الحالي.
    - يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص المنسوخ/الرسائل لجلسة واحدة.
    - تُرجع `sessions.preview` معاينات نصوص منسوخة محدودة لمفاتيح جلسات محددة.
    - تُرجع `sessions.describe` صف جلسة Gateway واحدًا لمفتاح جلسة مطابق تمامًا.
    - يحل `sessions.resolve` هدف جلسة أو يجعله قانونيًا.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يُحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلّغ عن النموذج القانوني المحلول بالإضافة إلى `agentRuntime` الفعلي.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يُرجع `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يكون `chat.history` مُطبع العرض لعملاء واجهة المستخدم: تُزال وسوم التوجيه المضمنة من النص المرئي، وتُزال حمولات XML لمكالمات الأدوات كنص عادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل مكالمات الأدوات المبتورة) ورموز تحكم النموذج ASCII/العريضة المسرّبة، وتُحذف صفوف المساعد ذات الرموز الصامتة البحتة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - تُرجع `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - تُرجع `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يُحدّث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمرًا إلى Node متصلة.
    - يُرجع `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من Node إلى Gateway.
    - يُحدّث `node.canvas.capability.refresh` رموز إمكانية canvas المقيّدة بالنطاق.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لعُقد Node غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقة">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ الأحادية بالإضافة إلى بحث/إعادة تشغيل الموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويُرجع القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقات تنفيذ Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقات التنفيذ المحلية لـ Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرّفة بواسطة Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوريًا أو عند Heartbeat التالية؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list`، و`skills.*`، و`tools.catalog`، و`tools.effective`، و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنص المنسوخ فقط.
- `session.message` و`session.tool`: تحديثات النص المنسوخ/دفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بيانات التعريف.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث دفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغّل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق المساعدة الخاصة بـ Node

- قد تستدعي عُقد Node `skills.bins` لجلب القائمة الحالية للملفات التنفيذية للمهارات لفحوص السماح التلقائي.

### طرق المساعدة الخاصة بالمشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون الشرطة المائلة البادئة `/`
    - يعيد `native` ومسار `both` الافتراضي أسماء أصلية واعية بالمزوّد
      عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة ذات الشرطة المائلة مثل `/model` و `/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin
    الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب فهرس أدوات وقت التشغيل
  لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يستنتج Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلاً من قبول
    سياق المصادقة أو التسليم المقدم من المستدعي.
  - الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة متاحة واحدة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. `args` و `sessionKey` و `agentId` و `confirm` و
    `idempotencyKey` اختيارية.
  - إذا كان كل من `sessionKey` و `agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و `toolName` و `output` اختياري وحقول
    `error`Typed. تعيد حالات رفض الموافقة أو السياسة `ok:false` في الحمولة بدلاً من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعداد وخيارات
    التثبيت المنقّاة من دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و `skills.detail` (`operator.read`) من أجل
  بيانات تعريف اكتشاف ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) بوضعين:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }`
    مجلد مهارة في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرحاً به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub اسماً مختصراً متتبّعاً واحداً أو كل تثبيتات ClawHub المتتبّعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعداد قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و `env`.

### عروض `models.list`

يقبل `models.list` معلّمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مكوّناً، تكون الاستجابة هي الفهرس المسموح به؛ وإلا تكون الاستجابة هي فهرس Gateway الكامل.
- `"configured"`: سلوك بحجم منتقي. إذا كان `agents.defaults.models` مكوّناً، فإنه يظل صاحب الأولوية. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الفهرس الكامل فقط عند عدم وجود صفوف نماذج مكوّنة.
- `"all"`: فهرس Gateway الكامل، متجاوزاً `agents.defaults.models`. استخدم هذا للتشخيص وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- تحل عملاء المشغّل الطلب عبر استدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القانونية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام ذلك
  `systemRunPlan` القانوني كسياق الأمر/cwd/الجلسة الموثوق.
- إذا عدّل مستدعٍ `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي الموافق عليه إلى `system.run`، فإن
  Gateway يرفض التشغيل بدلاً من الوثوق بالحمولة المعدّلة.

## رجوع تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تُرجع أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى تنفيذ على مستوى الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ يرفض الخادم حالات عدم التطابق.
- تُنشأ المخططات والنماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر protocol v3 وهي الأساس المتوقع لعملاء الأطراف الثالثة.

| الثابت                                  | الافتراضي                                               | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المقترنة) |
| تأخير إعادة الاتصال الأولي                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتأخير إعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| تقييد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة السماح للإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                        | code `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم `policy.tickIntervalMs` و `policy.maxPayload` و
`policy.maxBufferedBytes` الفعّالة في `hello-ok`؛ ينبغي للعملاء احترام تلك القيم
بدلاً من القيم الافتراضية قبل المصافحة.

## المصادقة

- يستخدم مصادقة Gateway عبر السرّ المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المُكوَّن.
- الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` تُجري فحص مصادقة الاتصال من
  ترويسات الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال عبر
  السرّ المشترك بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الإقران، يُصدر Gateway **رمز جهاز** محدودًا بدور الاتصال + النطاقات.
  يُعاد في `hello-ok.auth.deviceToken` وينبغي أن يحفظه العميل للاستخدام في
  الاتصالات المستقبلية.
- ينبغي للعملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي اتصال ناجح.
- ينبغي أن يعيد الاتصال باستخدام رمز الجهاز **المخزّن** ذاك استخدام مجموعة
  النطاقات المعتمدة المخزّنة لذلك الرمز أيضًا. يحافظ ذلك على وصول
  القراءة/الفحص/الحالة الذي مُنح بالفعل، ويتجنب تقليص عمليات إعادة الاتصال
  بصمت إلى نطاق ضمني أضيق خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرَّر دائمًا عند ضبطه.
  - يُملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولًا،
    ثم `deviceToken` صريح، ثم رمز مخزّن لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - يُرسَل `auth.bootstrapToken` فقط عندما لا ينتج أي مما سبق
    `auth.token`. وجود رمز مشترك أو أي رمز جهاز محلول يمنع إرساله.
  - الترقية التلقائية لرمز جهاز مخزّن في إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة محصورة في **النقاط النهائية الموثوقة فقط** —
    local loopback، أو `wss://` مع `tlsFingerprint` مثبّت. لا يتأهل
    `wss://` عام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم تمهيدية.
  احفظها فقط عندما يستخدم الاتصال مصادقة تمهيدية عبر نقل موثوق مثل
  `wss://` أو الإقران عبر loopback/محلي.
- إذا قدّم العميل `deviceToken` **صريحًا** أو `scopes` صريحة، تبقى مجموعة
  النطاقات التي طلبها المستدعي هي المرجع المعتمد؛ ولا يُعاد استخدام النطاقات
  المخزّنة مؤقتًا إلا عندما يعيد العميل استخدام الرمز المخزّن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط لاستدعاءات الجهاز نفسه التي تمت مصادقتها بالفعل باستخدام رمز ذلك
  الجهاز، لكي يتمكن العملاء المعتمدون على الرمز فقط من حفظ البديل قبل
  إعادة الاتصال. تدويرات السرّ المشترك/المسؤول لا تكرر رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محصورًا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال إقران ذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع دور جهاز
  أو استهداف دور جهاز لم تمنحه موافقة الإقران أصلًا.
- بالنسبة لجلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة ذاتية النطاق ما
  لم يكن لدى المستدعي أيضًا `operator.admin`: يستطيع المستدعون غير المسؤولين
  إزالة/إبطال/تدوير إدخال جهازهم **هم فقط**.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضًا من مجموعة نطاقات
  رمز المشغّل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون
  غير المسؤولين تدوير أو إبطال رمز مشغّل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافةً إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (قيمة منطقية)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز مخزّن مؤقتًا لكل جهاز.
  - إذا فشلت إعادة المحاولة تلك، ينبغي أن يوقف العملاء حلقات إعادة الاتصال التلقائية وأن يعرضوا إرشادات إجراء المشغّل.

## هوية الجهاز + الإقران

- ينبغي أن تتضمن عُقَد Node هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر مثيلات Gateway الرموز لكل جهاز + دور.
- موافقات الإقران مطلوبة لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة
  التلقائية المحلية مفعّلة.
- تتمحور الموافقة التلقائية على الإقران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضًا مسار اتصال ذاتي ضيق محلي للخلفية/الحاوية لتدفقات
  المساعد الموثوقة القائمة على السرّ المشترك.
- لا تزال اتصالات نفس المضيف عبر tailnet أو LAN تُعامل كاتصالات بعيدة
  لأغراض الإقران وتتطلب موافقة.
- يتضمن عملاء WS عادةً هوية `device` أثناء `connect` (operator +
  node). استثناءات operator الوحيدة من دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن الخاص بـ localhost فقط.
  - مصادقة Control UI الخاصة بـ operator الناجحة مع `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر زجاج للطوارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback من `gateway-client` والمصادق عليها
    برمز/كلمة مرور Gateway المشتركين.
- يجب أن توقّع جميع الاتصالات قيمة nonce في `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسلها فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  إضافةً إلى حقول device/client/role/scopes/token/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات الجهاز المقترن
  الوصفية ما زال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع تكوين `gateway.tls`
  إضافةً إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة برمجة تطبيقات Gateway الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، إلخ). يُعرَّف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
