---
read_when:
    - تنفيذ أو تحديث عملاء Gateway WS
    - تصحيح حالات عدم تطابق البروتوكول أو إخفاقات الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، والإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-24T07:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# بروتوكول Gateway (WebSocket)

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + وسيلة نقل Node** في
OpenClaw. تتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعقد iOS/Android، والعقد
العاملة بلا واجهة) عبر WebSocket وتصرّح عن **الدور** + **النطاق** الخاصين بها وقت
المصافحة.

## النقل

- WebSocket، وإطارات نصية بحمولات JSON.
- **يجب** أن يكون أول إطار طلب `connect`.
- يتم تقييد الإطارات السابقة للاتصال عند 64 KiB. بعد المصافحة الناجحة، يجب على العملاء
  اتباع الحدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تصدر الإطارات الواردة كبيرة الحجم والمخازن المؤقتة الصادرة البطيئة أحداث `payload.large`
  قبل أن تغلق Gateway أو تُسقط الإطار المتأثر. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. وهي لا تحتفظ بجسم الرسالة،
  أو محتويات المرفقات، أو جسم الإطار الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية.

## المصافحة (connect)

Gateway → العميل (تحدٍّ قبل الاتصال):

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

تُعد `server` و`features` و`snapshot` و`policy` جميعها مطلوبة في المخطط
(`src/gateway/protocol/schema/frames.ts`). وتكون `canvasHostUrl` اختيارية. وتقوم `auth`
بالإبلاغ عن الدور/النطاقات التي تم التفاوض عليها عند توفرها، كما تتضمن `deviceToken`
عندما تصدره Gateway.

عندما لا يتم إصدار رمز جهاز مميز، يمكن لـ `hello-ok.auth` أن تعرض مع ذلك
الأذونات التي تم التفاوض عليها:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

عندما يتم إصدار رمز جهاز مميز، تتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم bootstrap الموثوق، قد تتضمن `hello-ok.auth` أيضًا
إدخالات أدوار إضافية محدودة في `deviceTokens`:

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

في تدفق bootstrap المدمج للعقدة/المشغّل، يبقى رمز العقدة الأساسي
`scopes: []`، وتبقى أي رموز operator مسلّمة مقيّدة بقائمة السماح الخاصة بمشغّل bootstrap (`operator.approvals` و`operator.read`،
`operator.talk.secrets` و`operator.write`). وتظل فحوصات نطاق bootstrap
مسبوقة بالدور: فإدخالات operator تلبّي فقط طلبات operator، بينما لا تزال الأدوار
غير operator تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

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

- **طلب**: `{type:"req", id, method, params}`
- **استجابة**: `{type:"res", id, ok, payload|error}`
- **حدث**: `{type:"event", event, payload, seq?, stateVersion?}`

تتطلب الطرق ذات الآثار الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف الإمكانات (`camera/screen/canvas/system.run`).

### النطاقات (operator)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` النطاق `operator.talk.secrets`
(أو `operator.admin`).

قد تطلب طرق Gateway RPC المسجلة بواسطة Plugin نطاق operator خاصًا بها، لكن
البوادئ الإدارية الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`،
`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. فبعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال،
تتطلب عمليات الكتابة المستمرة عبر `/config set` و`/config unset` وجود `operator.admin`.

كما أن `node.pair.approve` لديه أيضًا فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بدون أوامر: `operator.pairing`
- الطلبات ذات أوامر Node غير exec: ‏`operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  ‏`operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (node)

تعلن العقد عن مطالبات القدرات وقت الاتصال:

- `caps`: فئات قدرات عالية المستوى.
- `commands`: قائمة سماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

تتعامل Gateway مع هذه العناصر على أنها **مطالبات** وتفرض قوائم سماح على جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفاتيحها هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` بحيث يمكن لواجهات المستخدم إظهار صف واحد لكل جهاز
  حتى عندما يتصل كـ **operator** و**node** معًا.

## تحديد نطاق أحداث البث

تكون أحداث البث عبر WebSocket التي يدفعها الخادم مقيّدة بالنطاق بحيث لا تستقبل جلسات نطاق الاقتران أو الجلسات الخاصة بالعقدة فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. وتتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تكون **رسائل البث المعرفة من Plugin من نوع `plugin.*`** مقيّدة إلى `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- تبقى **أحداث الحالة ووسيلة النقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، إلخ) غير مقيّدة حتى تظل سلامة وسيلة النقل قابلة للملاحظة لكل جلسة مصادَق عليها.
- تكون **عائلات أحداث البث غير المعروفة** مقيّدة بالنطاق افتراضيًا (فشل مغلق) ما لم يقم معالج مسجل بإرخائها صراحةً.

يحتفظ كل اتصال عميل برقم تسلسلي خاص به لكل عميل بحيث تحافظ عمليات البث على ترتيب أحادي متزايد على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة من تدفق الأحداث تمت تصفيتها بحسب النطاق.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغًا مولّدًا — فالقيمة `hello-ok.features.methods` هي قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات
طرق Plugin/القناة المحمّلة. تعامل معها على أنها لاكتشاف الميزات، وليس
كتعداد كامل للملفات `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة سلامة Gateway المخزنة مؤقتًا أو التي تم فحصها حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي الحديث والمحدود. وهو يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والعدادات، وأحجام البايتات، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرّفات الجلسات. ولا يحتفظ بنصوص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. ويتطلب نطاق operator.read.
    - يعيد `status` ملخص Gateway على نمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء operator ذوي النطاق الإداري.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات relay والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية للأجهزة المتصلة من نوع operator/node.
    - يلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.
  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` فهرس النماذج المسموح بها أثناء التشغيل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - يعيد `doctor.memory.status` جاهزية vector-memory / التضمين لمساحة عمل الوكيل الافتراضي النشط.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` سلسلة زمنية للاستخدام لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.
  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/الإضافات المضمّنة والمجمّعة.
    - يسجل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/الويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/الويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs تجريبية إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` محفزات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.
  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو Gateway RPC للإرسال الصادر المباشر لعمليات الإرسال المستهدفة حسب القناة/الحساب/سلسلة الرسائل خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملفات Gateway المهيأ مع أدوات cursor/limit والتحكم الأقصى بالبايتات.
  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.config` حمولة إعداد Talk الفعلية؛ ويتطلب `includeSecrets` النطاق `operator.talk.secrets` (أو `operator.admin`).
    - يضبط/يبث `talk.mode` حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - يقوم `talk.speak` بتركيب الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الرجوع الاحتياطي، وحالة إعداد المزوّد.
    - يعيد `tts.providers` قائمة مزوّدي TTS المرئية.
    - يبدّل كل من `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويل نص إلى كلام لمرة واحدة.
  </Accordion>

  <Accordion title="الأسرار، والإعداد، والتحديث، والمعالج">
    - يقوم `secrets.reload` بإعادة حل SecretRefs النشطة ويبدّل حالة الأسرار أثناء التشغيل فقط عند النجاح الكامل.
    - يقوم `secrets.resolve` بحل تعيينات الأسرار المستهدفة بالأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية وhash الخاصة بها.
    - يكتب `config.set` حمولة إعداد تم التحقق منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا.
    - يقوم `config.apply` بالتحقق من حمولة الإعداد الكاملة واستبدالها.
    - يعيد `config.schema` حمولة مخطط الإعداد الحي المستخدمة بواسطة Control UI وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. ويتضمن المخطط بيانات تعريف الحقول `title` / `description` المشتقة من التسميات نفسها ونصوص المساعدة المستخدمة في واجهة المستخدم، بما في ذلك الكائنات المتداخلة، وwildcard، وعناصر المصفوفات، وفروع التركيب `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث مقيّدة بالمسار لمسار إعداد واحد: المسار الموحّد، وعقدة مخطط سطحية، وhint مطابق + `hintPath`، وملخصات الأبناء المباشرين للتعمق عبر UI/CLI. وتحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title` و`description` و`type` و`enum` و`const` و`format` و`pattern` وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). وتعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج onboarding عبر WS RPC.
  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المهيأة.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات bootstrap الخاصة بمساحة العمل المعروضة لوكيل.
    - يعيد `agent.identity.get` هوية المساعد الفعلية لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.
  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسة لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصية محدودة لمفاتيح جلسات محددة.
    - يقوم `sessions.resolve` بحل أو توحيد هدف جلسة.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يشكل `sessions.steer` صيغة المقاطعة وإعادة التوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة.
    - يحدّث `sessions.patch` بيانات تعريف الجلسة/تجاوزاتها.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - يعيد `sessions.get` صف الجلسة المخزن بالكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. ويكون `chat.history` موحدًا للعرض لعملاء UI: تتم إزالة وسوم التوجيه المضمنة من النص المرئي، وتتم إزالة حمولات XML الخاصة باستدعاء الأدوات في النص العادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) وكذلك رموز التحكم الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل، ويتم حذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
  </Accordion>

  <Accordion title="اقتران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات اقتران الأجهزة.
    - يقوم `device.token.rotate` بتدوير رمز جهاز مقترن ضمن حدود دوره ونطاقه المعتمدين.
    - يقوم `device.token.revoke` بإبطال رمز جهاز مقترن.
  </Accordion>

  <Accordion title="اقتران Node والاستدعاء والعمل المعلّق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.verify` اقتران Node والتحقق من bootstrap.
    - تعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرّر `node.invoke` أمرًا إلى Node متصلة.
    - يعيد `node.invoke.result` النتيجة الخاصة بطلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من Node عائدًا إلى Gateway.
    - يقوم `node.canvas.capability.refresh` بتحديث رموز قدرات canvas المقيّدة بالنطاق.
    - تشكل `node.pending.pull` و`node.pending.ack` واجهات API لطابور العقد المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلّق الدائم للعقد غير المتصلة/المنفصلة.
  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec الأحادية بالإضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - تنتظر `exec.approval.waitDecision` قرارًا واحدًا لموافقة exec معلقة وتعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية للعقدة عبر أوامر relay الخاصة بالعقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرفة بواسطة Plugin.
  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يقوم `wake` بجدولة حقن نص تنبيه فوري أو عند Heartbeat التالي؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`.
  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة
  مشتركة.
- `sessions.changed`: تغيّر فهرس الجلسات أو بيانات التعريف الخاصة بها.
- `presence`: تحديثات لقطة الحضور الخاصة بالنظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة سلامة Gateway.
- `heartbeat`: تحديث تدفق حدث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة Cron.
- `shutdown`: إشعار بإيقاف تشغيل Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة اقتران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغلات كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة
  موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة
  موافقة Plugin.

### طرق مساعدة Node

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية الخاصة بـ Skills
  من أجل فحوصات السماح التلقائي.

### طرق مساعدة operator

- يمكن لـ operator استدعاء `commands.list` (`operator.read`) لجلب
  مخزون الأوامر أثناء التشغيل لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` الرمز النصي الأساسي للأمر من دون الشرطة المائلة `/`
    - يعيد `native` والمسار الافتراضي `both` أسماء أصلية مدركة للمزوّد
      عند توفرها
  - تحمل `textAliases` الأسماء المستعارة الدقيقة ذات الشرطة المائلة مثل `/model` و`/m`.
  - تحمل `nativeName` اسم الأمر الأصلي المدرك للمزوّد عند وجوده.
  - يكون `provider` اختياريًا ويؤثر فقط في التسمية الأصلية وتوفر أوامر
    Plugin الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات تعريف الوسائط المتسلسلة من الاستجابة.
- يمكن لـ operator استدعاء `tools.catalog` (`operator.read`) لجلب فهرس الأدوات أثناء التشغيل لوكيل.
  تتضمن الاستجابة الأدوات المجمعة وبيانات تعريف المصدر:
  - `source`: ‏`core` أو `plugin`
  - `pluginId`: مالك Plugin عندما تكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن لـ operator استدعاء `tools.effective` (`operator.read`) لجلب
  فهرس الأدوات الفعلي أثناء التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - تشتق Gateway سياق التشغيل الموثوق من الجلسة على جانب الخادم بدلًا من قبول
    سياق مصادقة أو إرسال يورده المتصل.
  - تكون الاستجابة مقيّدة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك الأدوات الأساسية، وأدوات Plugin، وأدوات القنوات.
- يمكن لـ operator استدعاء `skills.status` (`operator.read`) لجلب
  مخزون Skills المرئي لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات المفقودة، وفحوصات الإعداد، و
    خيارات التثبيت المنقحة من دون كشف القيم السرية الخام.
- يمكن لـ operator استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات تعريف الاكتشاف الخاصة بـ ClawHub.
- يمكن لـ operator استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: ‏`{ source: "clawhub", slug, version?, force? }` يثبت
    مجلد Skill في دليل `skills/` الخاص بمساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: ‏`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` معلنًا على مضيف Gateway.
- يمكن لـ operator استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يقوم وضع ClawHub بتحديث slug متعقَّب واحد أو كل تثبيتات ClawHub المتعقبة في
    مساحة عمل الوكيل الافتراضية.
  - يقوم وضع الإعداد بترقيع قيم `skills.entries.<skillKey>` مثل `enabled`،
    و`apiKey`، و`env`.

## موافقات Exec

- عندما يحتاج طلب exec إلى موافقة، تبث Gateway الحدث `exec.approval.requested`.
- يقوم عملاء operator بالحسم عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن تتضمن `exec.approval.request` الحقل `systemRunPlan` (‏`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة المعيارية). وتُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المُمرَّرة استخدام
  `systemRunPlan` المعياري هذا بوصفه السياق المرجعي للأمر/الدليل العامل/session.
- إذا غيّر متصل ما `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وعمليات التمرير النهائية الموافق عليها لـ `system.run`، فإن
  Gateway ترفض التشغيل بدلًا من الثقة بالحمولة المعدلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- تُبقي `bestEffortDeliver=false` السلوك الصارم: إذ تعيد أهداف التسليم غير المحلولة أو الداخلية فقط الخطأ `INVALID_REQUEST`.
- تسمح `bestEffortDeliver=true` بالرجوع الاحتياطي إلى التنفيذ على مستوى الجلسة فقط عندما يتعذر حل أي مسار تسليم خارجي قابل للإرسال (مثل جلسات internal/webchat أو إعدادات القنوات المتعددة الملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. وتكون هذه القيم
ثابتة عبر البروتوكول v3، وهي خط الأساس المتوقع للعملاء من الجهات الخارجية.

| الثابت | الافتراضي | المصدر |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| مهلة الطلب (لكل RPC) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| مهلة ما قبل المصادقة / تحدي connect | `10_000` ms | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| تراجع إعادة الاتصال الأولي | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| الحد الأقصى لتراجع إعادة الاتصال | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| clamp لإعادة المحاولة السريعة بعد إغلاق device-token | `250` ms | `src/gateway/client.ts` |
| مهلة السماح القسري قبل `terminate()` | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| مهلة `stopAndWait()` الافتراضية | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| الفاصل الافتراضي لـ tick (قبل `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| إغلاق مهلة tick | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

يعلن الخادم عن القيم الفعلية `policy.tickIntervalMs` و`policy.maxPayload`،
و`policy.maxBufferedBytes` في `hello-ok`؛ ويجب على العملاء الالتزام بهذه القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway ذات السر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، اعتمادًا على وضع المصادقة المهيأ.
- تلبّي الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` على غير loopback فحص المصادقة الخاص بالاتصال
  من ترويسات الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` على ingress الخاص فحص مصادقة الاتصال
  ذي السر المشترك بالكامل؛ ولا تعرّض هذا الوضع على ingress عام/غير موثوق.
- بعد الاقتران، تصدر Gateway **رمز جهاز مميزًا** مقيّدًا بدور الاتصال +
  النطاقات. ويُعاد هذا في `hello-ok.auth.deviceToken`، ويجب على العميل
  حفظه للاتصالات المستقبلية.
- يجب على العملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أن تؤدي إعادة الاتصال باستخدام **رمز الجهاز المخزّن** هذا أيضًا إلى إعادة استخدام
  مجموعة النطاقات المعتمدة المخزّنة لذلك الرمز. وهذا يحافظ على
  صلاحيات القراءة/الفحص/الحالة التي مُنحت بالفعل ويمنع تقليص إعادة الاتصال بصمت
  إلى نطاق إداري ضمني أضيق.
- تجميع مصادقة الاتصال على جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - يكون `auth.password` متعامدًا ويُمرَّر دائمًا عند ضبطه.
  - تُملأ `auth.token` حسب ترتيب الأولوية: أولًا الرمز المشترك الصريح،
    ثم `deviceToken` الصريح، ثم رمز لكل جهاز مخزّن (مفتاحه
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أي من
    ما سبق قيمة `auth.token`. يؤدي الرمز المشترك أو أي رمز جهاز محلول إلى كبحه.
  - يكون الترقي التلقائي لرمز جهاز مخزّن في إعادة المحاولة الأحادية لـ
    `AUTH_TOKEN_MISMATCH` مقيّدًا إلى **نقاط نهاية موثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبّتة. أما `wss://` العام
    من دون pinning فلا يُعد مؤهلًا.
- الإدخالات الإضافية في `hello-ok.auth.deviceTokens` هي رموز تسليم bootstrap.
  احفظها فقط عندما يستخدم الاتصال مصادقة bootstrap على وسيلة نقل موثوقة
  مثل `wss://` أو loopback/الاقتران المحلي.
- إذا قدم عميل **`deviceToken` صريحًا** أو `scopes` صريحة، فإن
  مجموعة النطاقات المطلوبة من المتصل تظل المرجع النهائي؛ ولا تُعاد استخدام النطاقات المخزنة مؤقتًا
  إلا عندما يعيد العميل استخدام الرمز المخزّن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب النطاق `operator.pairing`).
- يظل إصدار/تدوير الرمز مقيدًا بمجموعة الأدوار المعتمدة المسجلة في
  إدخال الاقتران لذلك الجهاز؛ ولا يمكن لتدوير رمز أن يوسّع الجهاز إلى
  دور لم تمنحه موافقة الاقتران قط.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز مقيّدة بالنطاق الذاتي ما لم يكن
  لدى المتصل أيضًا `operator.admin`: إذ لا يمكن لغير الإداريين إزالة/إبطال/تدوير
  سوى إدخال أجهزتهم **هم**.
- يتحقق `device.token.rotate` أيضًا من مجموعة نطاقات operator المطلوبة في مقابل
  نطاقات الجلسة الحالية للمتصل. ولا يمكن لغير الإداريين تدوير رمز إلى
  مجموعة نطاقات operator أوسع من التي يملكونها بالفعل.
- تتضمن أعطال المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (قيمة منطقية)
  - `error.details.recommendedNextStep` (`retry_with_device_token`، `update_auth_configuration`، `update_auth_credentials`، `wait_then_retry`، `review_auth_configuration`)
- سلوك العميل بالنسبة إلى `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز لكل جهاز مخزّن مؤقتًا.
  - إذا فشلت إعادة المحاولة هذه، فيجب على العملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات الإجراء للمشغّل.

## هوية الجهاز + الاقتران

- يجب على العقد تضمين هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateway رموزًا لكل جهاز + دور.
- تُطلب موافقات الاقتران لمعرّفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي المحلي
  مفعّلًا.
- يتركز الاعتماد التلقائي للاقتران على اتصالات loopback المحلية المباشرة.
- لدى OpenClaw أيضًا مسار ذاتي ضيّق للاتصال المحلي بالحاوية/الواجهة الخلفية من أجل
  تدفقات المساعدة الموثوقة ذات السر المشترك.
- لا تزال اتصالات tailnet أو الشبكة المحلية على نفس المضيف تُعامل على أنها بعيدة فيما يتعلق بالاقتران
  وتتطلب موافقة.
- يجب على جميع عملاء WS تضمين هوية `device` أثناء `connect` (operator + node).
  لا يمكن لـ Control UI حذفها إلا في الأوضاع التالية:
  - `gateway.controlUi.allowInsecureAuth=true` من أجل توافق HTTP غير الآمن على localhost فقط.
  - مصادقة operator ناجحة لـ Control UI مع `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (خيار طوارئ، تخفيض أمني شديد).
- يجب على جميع الاتصالات توقيع nonce الخاص بـ `connect.challenge` الذي يقدمه الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز التفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع قيمة `error.details.reason` ثابتة.

إخفاقات الترحيل الشائعة:

| الرسالة | details.code | details.reason | المعنى |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | حذف العميل `device.nonce` (أو أرسله فارغًا). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | وقّع العميل باستخدام nonce قديم/خاطئ. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | حمولة التوقيع لا تطابق حمولة v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | يقع الطابع الزمني الموقّع خارج الانحراف المسموح به. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | فشل تنسيق/توحيد المفتاح العام. |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخاصة بالخادم.
- أرسل nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- لا تزال توقيعات `v2` القديمة مقبولة من أجل التوافق، لكن
  تثبيت بيانات تعريف الجهاز المقترن لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء تثبيت بصمة شهادة Gateway اختياريًا (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة Gateway API الكاملة** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، وغير ذلك). ويتم تعريف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
