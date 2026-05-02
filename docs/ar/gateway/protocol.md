---
read_when:
    - تنفيذ أو تحديث عملاء WS لـ Gateway
    - تصحيح أخطاء عدم تطابق البروتوكول أو إخفاقات الاتصال
    - إعادة توليد مخطط البروتوكول ونماذجه
summary: 'بروتوكول WebSocket في Gateway: المصافحة، الإطارات، إدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-02T07:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الواحد + نقل العُقد** لـ
OpenClaw. يتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعُقد iOS/Android، والعُقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** الخاصين بهم عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية ذات حمولات JSON.
- يجب أن يكون الإطار الأول **طلب `connect`**.
- إطارات ما قبل الاتصال محددة بـ 64 KiB. بعد نجاح المصافحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تصدر الإطارات الواردة الزائدة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
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

بينما لا يزال Gateway ينهي تشغيل العمليات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
أن يعيد خطأ `UNAVAILABLE` قابلًا لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية بدلًا من عرضها كفشل مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوب وفق المخطط
(`src/gateway/protocol/schema/frames.ts`). كذلك فإن `auth` مطلوب ويبلغ عن
الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عندما لا يُصدر رمز جهاز، يبلغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول الرمز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويحافظ على خطوط أساس اقتران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. العملاء البعيدون،
والعملاء من منشأ المتصفح، وعملاء العُقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
ما زالوا يستخدمون فحوصات الاقتران وترقية النطاق العادية.

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
`scopes: []` وأي رمز مشغل مُسلَّم يبقى محدودًا بقائمة سماح مشغل التمهيد
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تظل فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل تفي فقط بطلبات المشغل، وما زالت الأدوار غير المشغلة
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

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح التماثل** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف الإمكانات (camera/screen/canvas/system.run).

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

قد تطلب أساليب RPC الخاصة بـ Gateway والمسجلة من Plugin نطاق المشغل الخاص بها، لكن
بادئات إدارة النواة المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الأسلوب هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي تُوصل عبر
`chat.send` تطبق فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` الدائمة النطاق `operator.admin`.

يحتوي `node.pair.approve` أيضًا على فحص نطاق إضافي في وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي على أوامر Node غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions (Node)

تعلن العُقد مطالبات الإمكانات عند وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record`، `camera.capture`).

يعامل Gateway هذه باعتبارها **مطالبات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلًا** و**Node** في الوقت نفسه.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تبلغ العُقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعُقد المقترنة أيضًا الإبلاغ
  عن حضور خلفي دائم عندما يحدث حدث Node موثوق بيانات تعريف الاقتران الخاصة بها.

### حدث إبقاء Node حية في الخلفية

قد تستدعي العُقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن Node مقترنة كانت
حية أثناء تنبيه في الخلفية دون تمييزها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، أو `connect`. تُطبع سلاسل المشغلات غير المعروفة إلى
`background` بواسطة Gateway قبل الاستمرار. يكون الحدث دائمًا فقط لجلسات أجهزة Node
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

قد لا تزال Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك باعتباره
استدعاء RPC مُقرًا به، لا باعتباره استمرارًا دائمًا للحضور.

## تحديد نطاق أحداث البث

تُحرس أحداث بث WebSocket المدفوعة من الخادم بالنطاق حتى لا تتلقى الجلسات محددة الاقتران أو جلسات Node فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب على الأقل `operator.read`. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة من Plugin** محروسة بـ `operator.write` أو `operator.admin`، اعتمادًا على كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat`، `presence`، `tick`، دورة حياة الاتصال/قطع الاتصال، إلخ) تظل غير مقيدة حتى تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تُحرس بالنطاق افتراضيًا (تفشل بإغلاق) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص بكل عميل حتى تحافظ عمليات البث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة بالنطاق من تدفق الأحداث.

## عائلات أساليب RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست عملية تفريغ مولدة — `hello-ok.features.methods` هي قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات أساليب
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتًا أو المفحوصة حديثًا.
    - يعيد `diagnostics.stability` مسجل استقرار التشخيصات المحدود الحديث. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugins، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة المشغل مطلوب.
    - يعيد `status` ملخص Gateway بأسلوب `/status`؛ ولا تُدرج الحقول الحساسة إلا لعملاء المشغل ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يلحق `system-event` حدثًا نظاميًا ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للاختيار (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات الاستخدام المجمعة للتكلفة ضمن نطاق تاريخ.
    - يعيد `doctor.memory.status` جاهزية الذاكرة المتجهية / تضمينات التخزين المؤقت لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمينات.
    - يعيد `doctor.memory.remHarness` معاينة محدودة وللقراءة فقط لحزمة اختبار REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤصلًا معروضًا، ومرشحين للترقية العميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة + المرفقة.
    - يسجّل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ القناة عند النجاح.
    - يرسل `push.test` إشعار APNs تجريبيًا إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - يُعد `send` استدعاء RPC المباشر للتسليم الصادر للإرسال الموجّه إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم بالمؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="التحدث وTTS">
    - يعيد `talk.config` حمولة إعداد Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الاحتياط، وحالة إعداد المزوّد.
    - يعيد `tts.providers` قائمة مزوّدي TTS المرئية.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من نص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعداد، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار الموجّهة للأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية والتجزئة.
    - يكتب `config.set` حمولة إعداد متحققًا منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا.
    - يتحقق `config.apply` من حمولة الإعداد الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعداد الحية المستخدمة بواسطة Control UI وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات التوليد الوصفية، بما في ذلك بيانات مخطط Plugin + القناة الوصفية عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات وصفية للحقلين `title` / `description` مشتقة من التسميات نفسها ونص المساعدة نفسه المستخدمين في الواجهة، بما في ذلك فروع تكوين الكائنات المتداخلة، وأحرف البدل، وعناصر المصفوفات، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث مقيّدة بالمسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرين للتنقل التفصيلي في الواجهة/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، والمسار المطبّع `path`، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة ودون فترة تهدئة بعد تبديل الحزمة حتى لا تواصل عملية Gateway القديمة التحميل الكسول من شجرة `dist` مستبدلة.
    - يعيد `update.status` أحدث مؤشر إعادة تشغيل تحديث مخزن مؤقتًا، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عندما يكون متاحًا.
    - تتيح `wizard.start`، و`wizard.next`، و`wizard.status`، و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات وقت التشغيل الوصفية.
    - تدير `agents.create`، و`agents.update`، و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list`، و`agents.files.get`، و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة لوكيل.
    - تتيح `artifacts.list`، و`artifacts.get`، و`artifacts.download` ملخصات وتنزيلات المخرجات المشتقة من النص لج نطاق صريح هو `sessionKey` أو `runId` أو `taskId`. تحل استعلامات التشغيل والمهام الجلسة المالكة على جانب الخادم ولا تعيد إلا وسائط النص ذات المصدر المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلًا من جلبها على جانب الخادم.
    - يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عندما تكون متاحة.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات `agentRuntime` الوصفية لكل صف عندما تكون خلفية وقت تشغيل الوكيل مكوّنة.
    - يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات لعميل WS الحالي.
    - يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نص محدودة لمفاتيح جلسات محددة.
    - يحل `sessions.resolve` هدف جلسة أو يجعله قياسيًا.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يُعد `sessions.steer` متغير المقاطعة والتوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده لعمليات التشغيل النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات الجلسة الوصفية/التجاوزات ويبلغ عن النموذج القياسي المحلول بالإضافة إلى `agentRuntime` الفعال.
    - تنفذ `sessions.reset`، و`sessions.delete`، و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزن بالكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history`، و`chat.send`، و`chat.abort`، و`chat.inject`. يكون `chat.history` مطبعًا للعرض لعملاء الواجهة: تُزال وسوم التوجيه المضمنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة) ورموز تحكم النموذج المسربة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والموافق عليها.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترن.
    - يمرّر `node.invoke` أمراً إلى Node متصل.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - ينقل `node.event` الأحداث الصادرة من Node إلى Gateway.
    - يحدّث `node.canvas.capability.refresh` رموز إمكانية اللوحة ذات النطاق المحدد.
    - تمثل `node.pending.pull` و`node.pending.ack` واجهات API لطابور Node المتصل.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لعُقد Node غير المتصلة أو المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة، بالإضافة إلى البحث عن الموافقات المعلقة وإعادة تشغيلها.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة التنفيذ في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فورياً أو عند Heartbeat التالي؛ تدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطات حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### أساليب مساعدة Node

- قد تستدعي Nodes `skills.bins` لجلب القائمة الحالية للملفات التنفيذية الخاصة بالمهارات لفحوصات السماح التلقائي.

### أساليب مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب جرد أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في الواجهة التي يستهدفها `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون علامة `/` البادئة
    - يعيد `native` ومسار `both` الافتراضي الأسماء الأصلية المراعية للمزوّد
      عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة ذات الشرطة المائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المراعي للمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر Plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات وصف الوسائط المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات وصف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب جرد الأدوات الفعال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدمه المستدعي.
  - تكون الاستجابة محددة النطاق للجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلولة
    `agentId`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` نمطية. تعيد الموافقة أو حالات رفض السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب جرد Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعداد وخيارات
    تثبيت منقّاة من دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات وصف الاكتشاف في ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }`
    مجلد مهارة في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرحا به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub اسما مختصرا واحدا متتبعا أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعداد قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` معدا، فالاستجابة هي الكتالوج المسموح؛ وإلا فالاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` معدا، فسيظل هو السائد. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عند عدم وجود أي صفوف نماذج معدة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيص وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحسم عملاء المشغّل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (بيانات `argv`/`cwd`/`rawCommand`/الجلسة المرجعية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام
  `systemRunPlan` المرجعي بوصفه سياق الأمر/cwd/الجلسة المعتمد.
- إذا عدّل مستدعٍ `command` أو`rawCommand` أو`cwd` أو`agentId` أو
  `sessionKey` بين التحضير وإعادة التوجيه النهائية المعتمدة لـ`system.run`، فإن
  Gateway يرفض التشغيل بدلا من الوثوق بالحمولة المعدّلة.

## احتياطي تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى تنفيذ خاص بالجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/webchat أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُولَّد المخططات والنماذج من تعريفات TypeBox:
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
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المقترنة) |
| تراجع إعادة الاتصال الأولي                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى تراجع لإعادة الاتصال                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                          | `src/gateway/client.ts`                                                                    |
| مهلة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم القيم الفعالة لـ`policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ يجب على العملاء احترام تلك القيم
بدلا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسرّ المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوَّن.
- تلبّي الأوضاع التي تحمل هوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو وضع غير loopback
  `gateway.auth.mode: "trusted-proxy"` فحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للدخول الخاص مصادقة الاتصال بالسرّ
  المشترك بالكامل؛ لا تعرّض هذا الوضع على دخول عام أو غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيّداً بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` ويجب أن
  يحتفظ به العميل للاتصالات المستقبلية.
- يجب أن يحتفظ العملاء بالرمز الأساسي `hello-ok.auth.deviceToken` بعد أي
  اتصال ناجح.
- يجب أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزّن** استخدام مجموعة
  النطاقات المعتمدة المخزّنة لذلك الرمز أيضاً. يحافظ هذا على وصول
  القراءة/الفحص/الحالة الذي سبق منحه، ويتجنب تضييق إعادة الاتصال صامتاً إلى
  نطاق ضمني أضيق خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرَّر دائماً عند ضبطه.
  - تتم تعبئة `auth.token` بترتيب الأولوية: الرمز المشترك الصريح أولاً،
    ثم `deviceToken` صريح، ثم رمز مخزّن لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا ينتج أي مما سبق
    `auth.token`. يلغيه الرمز المشترك أو أي رمز جهاز محلول.
  - الترقية التلقائية لرمز جهاز مخزّن عند إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة محكومة بـ **نقاط النهاية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبّتة. لا يُعد
    `wss://` العام من دون تثبيت مؤهلاً.
- الإدخالات الإضافية في `hello-ok.auth.deviceTokens` هي رموز تسليم للتمهيد.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق
  مثل `wss://` أو اقتران loopback/local.
- إذا وفّر العميل `deviceToken` **صريحاً** أو `scopes` صريحة، تبقى مجموعة
  النطاقات التي طلبها المستدعي هي المرجع؛ لا يُعاد استخدام النطاقات
  المخبأة إلا عندما يعيد العميل استخدام الرمز المخزّن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات تعريف التدوير. ولا يكرر رمز الحامل
  البديل إلا لاستدعاءات الجهاز نفسه التي صودق عليها مسبقاً باستخدام رمز ذلك
  الجهاز، حتى يتمكن العملاء المعتمدون على الرمز فقط من الاحتفاظ بالبديل قبل
  إعادة الاتصال. تدويرات المشاركة/المسؤول لا تكرر رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محدوداً بمجموعة الأدوار المعتمدة
  المسجلة في إدخال الاقتران لذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع دور
  جهاز أو استهداف دور جهاز لم تمنحه موافقة الاقتران قط.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضاً `operator.admin`: يمكن للمستدعين غير المسؤولين
  إزالة/إبطال/تدوير إدخال جهازهم **هم فقط**.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضاً من مجموعة نطاقات
  رمز المشغّل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع
  المستدعون غير المسؤولين تدوير أو إبطال رمز مشغّل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - قد يحاول العملاء الموثوقون إعادة محاولة واحدة محدودة باستخدام رمز مخبأ لكل جهاز.
  - إذا فشلت تلك المحاولة، يجب أن يوقف العملاء حلقات إعادة الاتصال التلقائية ويعرضوا إرشادات إجراء للمشغّل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العقد هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزاً لكل جهاز + دور.
- موافقات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم يكن الاعتماد
  التلقائي المحلي مفعّلاً.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضاً مسار ضيق للاتصال الذاتي المحلي للخلفية/الحاوية من أجل
  تدفقات المساعد الموثوقة ذات السرّ المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة
  للاقتران وتتطلب موافقة.
- عادةً ما يتضمن عملاء WS هوية `device` أثناء `connect` (المشغّل +
  العقدة). استثناءات المشغّل بلا جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` للتوافق مع HTTP غير الآمن المقتصر على localhost.
  - نجاح مصادقة واجهة تحكم المشغّل في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر الزجاج، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback في `gateway-client` المصادق
    عليها برمز/كلمة مرور Gateway المشتركة.
- يجب أن توقّع كل الاتصالات قيمة nonce في `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائماً `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، إذ تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات تعريف الجهاز
  المقترن لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختيارياً تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة برمجة تطبيقات Gateway الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، وغير ذلك). السطح الدقيق تحدده
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
