---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح حالات عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، والإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-26T11:30:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

بروتوكول Gateway عبر WS هو **مستوى التحكم الفردي + نقل Node** في
OpenClaw. تتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وNodes الخاصة بـ iOS/Android، وNodes عديمة الواجهة)
عبر WebSocket وتصرّح بـ **الدور** + **النطاق** الخاصين بها في
وقت المصافحة.

## النقل

- WebSocket، وإطارات نصية بحمولة JSON.
- **يجب** أن يكون الإطار الأول طلب `connect`.
- يتم تقييد الإطارات السابقة للاتصال عند 64 KiB. وبعد مصافحة ناجحة، ينبغي على العملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. وعند تفعيل التشخيصات،
  تصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن تغلق gateway أو تُسقط الإطار المتأثر. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز الأسباب الآمنة. لكنها لا تحتفظ بجسم الرسالة،
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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

تكون الحقول `server` و`features` و`snapshot` و`policy` كلها مطلوبة بحسب المخطط
(`src/gateway/protocol/schema/frames.ts`). ويكون `canvasHostUrl` اختياريًا. أما `auth`
فتبلغ عن الدور/النطاقات التي تم التفاوض عليها عند توفرها، وتضمّن `deviceToken`
عندما تصدر gateway واحدًا.

عندما لا يتم إصدار رمز جهاز، يمكن لـ `hello-ok.auth` مع ذلك الإبلاغ عن
الأذونات التي تم التفاوض عليها:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الواجهة الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`,
`client.mode: "backend"`) حذف `device` على اتصالات loopback المباشرة عندما
يصادقون باستخدام الرمز/كلمة المرور المشتركة الخاصة بالـ gateway. هذا المسار مخصص
لعمليات RPC الداخلية لمستوى التحكم ويحافظ على عدم قيام خطوط الأساس القديمة الخاصة بإقران CLI/الأجهزة
بحظر العمل المحلي للواجهة الخلفية مثل تحديثات جلسات الوكلاء الفرعيين. أما العملاء البعيدون،
والعملاء من أصل المتصفح، وعملاء node، والعملاء الصريحون لرمز الجهاز/هوية الجهاز
فيستخدمون فحوصات الإقران وترقية النطاقات العادية.

عندما يتم إصدار رمز جهاز، يتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم bootstrap الموثوق، قد يتضمن `hello-ok.auth` أيضًا إدخالات أدوار إضافية
محدودة ضمن `deviceTokens`:

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

بالنسبة إلى تدفق bootstrap المدمج لـ node/operator، يبقى رمز node الأساسي
`scopes: []` وتظل أي رموز operator مسلّمة محدودة بقائمة سماح operator الخاصة بـ bootstrap
(`operator.approvals`، و`operator.read`،
و`operator.talk.secrets`، و`operator.write`). وتبقى فحوصات نطاق bootstrap
مسبوقة بالدور: فإدخالات operator لا تلبّي إلا طلبات operator، بينما تحتاج الأدوار
غير operator إلى نطاقات ضمن بادئة دورها الخاص.

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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف القدرات (camera/screen/canvas/system.run).

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

يمكن لطرق RPC الخاصة بـ Gateway والمسجلة من Plugin أن تطلب نطاق operator خاصًا بها، لكن
البوادئ الإدارية الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
و`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة ليس سوى البوابة الأولى. فبعض أوامر slash التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال،
تتطلب عمليات الكتابة الدائمة للأمرين `/config set` و`/config unset`
`operator.admin`.

كما أن `node.pair.approve` لديه فحص نطاق إضافي في وقت الاعتماد فوق
النطاق الأساسي للطريقة:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر node غير exec: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (node)

تصرّح Nodes بادعاءات القدرات وقت الاتصال:

- `caps`: فئات القدرات عالية المستوى.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

تتعامل Gateway مع هذه على أنها **ادعاءات** وتفرض قوائم سماح على جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بحسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` بحيث تستطيع واجهات المستخدم إظهار صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.

## تقييد نطاق أحداث البث

يتم تقييد أحداث البث المدفوعة من الخادم عبر WebSocket بالنطاق حتى لا تتلقى الجلسات ذات نطاق الإقران أو الجلسات الخاصة بـ node فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. وتتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **عمليات البث `plugin.*` المعرفة من Plugin** يتم تقييدها إلى `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat`، و`presence`، و`tick`، ودورة حياة الاتصال/قطع الاتصال، إلخ) تبقى غير مقيّدة حتى يظل من الممكن مراقبة سلامة النقل من كل جلسة مصادَق عليها.
- **عائلات أحداث البث غير المعروفة** يتم تقييدها بالنطاق افتراضيًا (فشل مغلق) ما لم يقم معالج مسجل بإرخائها صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل حتى تحافظ عمليات البث على الترتيب الأحادي التصاعد على ذلك المقبس حتى عندما ترى عملاء مختلفون مجموعات فرعية مختلفة مقيّدة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

إن سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. وهذا
ليس تفريغًا مولدًا — فالقائمة `hello-ok.features.methods` هي قائمة
اكتشاف محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات الطرق المحمّلة من Plugin/channel. تعامل معها على أنها اكتشاف ميزات، لا تعدادًا كاملًا لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة سلامة gateway المخبأة أو التي تم فحصها حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الحديث. وهو يحتفظ ببيانات تشغيلية وصفية مثل أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugins، ومعرّفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. ويتطلب نطاق operator للقراءة.
    - يعيد `status` ملخص gateway على نمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء operator ذوي النطاق الإداري.
    - يعيد `gateway.identity.get` هوية جهاز gateway المستخدمة في تدفقات relay والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة operator/node المتصلة.
    - يُلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على gateway.
  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` فهرس النماذج المسموح بها في وقت التشغيل.
    - يعيد `usage.status` ملخصات نوافذ استخدام الموفّر/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق زمني.
    - يعيد `doctor.memory.status` جاهزية الذاكرة المتجهية / التضمين لمساحة عمل الوكيل الافتراضي النشطة.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` سلسلة زمنية للاستخدام لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.
  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugins المضمنة والمجمعة.
    - يسجل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لموفّر القناة الحالية القادر على QR/الويب.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/الويب ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى Node iOS مسجلة.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.
  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر لعمليات الإرسال المستهدفة إلى قناة/حساب/خيط خارج مشغل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملفات gateway المضبوط مع عناصر التحكم في cursor/الحد الأقصى والحد الأقصى للبايتات.
  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.config` حمولة إعداد Talk الفعلية؛ ويتطلب `includeSecrets` النطاق `operator.talk.secrets` (أو `operator.admin`).
    - يعيّن/يبث `talk.mode` حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - يقوم `talk.speak` بتركيب الكلام عبر موفر الكلام النشط في Talk.
    - يعيد `tts.status` حالة تفعيل TTS، والموفر النشط، والموفرين الاحتياطيين، وحالة إعداد الموفّر.
    - يعيد `tts.providers` فهرس موفري TTS المرئيين.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` موفر TTS المفضل.
    - يشغّل `tts.convert` تحويل نص إلى كلام لمرة واحدة.
  </Accordion>

  <Accordion title="الأسرار، والإعداد، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة مرة أخرى ويبدّل حالة الأسرار في وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية وhash الخاص بها.
    - يكتب `config.set` حمولة إعداد تم التحقق من صحتها.
    - يدمج `config.patch` تحديث إعداد جزئيًا.
    - يتحقق `config.apply` من حمولة الإعداد الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعداد الحي المستخدم بواسطة Control UI وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات التوليد الوصفية، بما في ذلك بيانات مخطط Plugin + channel الوصفية عندما يستطيع وقت التشغيل تحميلها. ويتضمن المخطط بيانات الحقول `title` / `description` المشتقة من الملصقات نفسها ونصوص المساعدة التي تستخدمها واجهة المستخدم، بما في ذلك تفرعات الكائنات المتداخلة، وwildcard، وعناصر المصفوفات، وتركيبات `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة بالمسار لمسار إعداد واحد: المسار المطبع، وعقدة مخطط سطحية، وhint المطابق + `hintPath`، وملخصات الأبناء المباشرين لعمليات التعمق في UI/CLI. وتحتفظ عقد مخطط البحث بالوثائق المواجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). وتعرض ملخصات الأبناء `key`، و`path` المطبع، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث gateway ويجدول إعادة التشغيل فقط عندما ينجح التحديث نفسه.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.
  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المضبوطة.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات التهيئة الأولية لمساحة العمل المعروضة لوكيل.
    - يعيد `agent.identity.get` هوية المساعد الفعلية لوكيل أو جلسة.
    - ينتظر `agent.wait` حتى ينتهي التشغيل ويعيد اللقطة النهائية عند توفرها.
  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسة لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النسخة/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات محدودة للنسخة لمفاتيح جلسات محددة.
    - يحل `sessions.resolve` هدف جلسة أو يطبّعه.
    - ينشئ `sessions.create` إدخال جلسة جديدًا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يمثل `sessions.steer` صيغة المقاطعة وإعادة التوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة.
    - يحدّث `sessions.patch` بيانات الجلسة الوصفية/التجاوزات.
    - تنفّذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - يعيد `sessions.get` صف الجلسة المخزن بالكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء UI: حيث تُزال وسوم التوجيه المضمنة من النص المرئي، وتُزال حمولات XML الخاصة باستدعاء الأدوات في النص العادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) إضافةً إلى رموز التحكم الخاصة بالنموذج المسرّبة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد التي تحتوي فقط على رموز الصمت الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المعلقة والمقترنة المعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يبطل `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
  </Accordion>

  <Accordion title="إقران Node، والاستدعاء، والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.verify` إقران Node والتحقق من bootstrap.
    - يعيدان `node.list` و`node.describe` حالة Nodes المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمرًا إلى Node متصلة.
    - يعيد `node.invoke.result` النتيجة الخاصة بطلب invoke.
    - يحمل `node.event` الأحداث الصادرة من node إلى داخل gateway.
    - يحدّث `node.canvas.capability.refresh` رموز قدرات canvas محددة النطاق.
    - تمثل `node.pending.pull` و`node.pending.ack` واجهات طابور الـ node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لـ Nodes غير المتصلة/غير المتاحة.
  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec أحادية الاستخدام بالإضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - تنتظر `exec.approval.waitDecision` قرار موافقة exec واحدًا معلقًا وتعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقات exec الخاصة بـ gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقات exec المحلية في node عبر أوامر relay الخاصة بـ node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقات المعرفة من Plugin.
  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوري أو عند Heartbeat التالية؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`.
  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وأحداث الدردشة الأخرى الخاصة
  بالنسخة فقط.
- `session.message` و`session.tool`: تحديثات النسخة/تدفق الأحداث لجلسة
  مشترَك بها.
- `sessions.changed`: تم تغيير فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة الحضور للنظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة سلامة gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/وظيفة Cron.
- `shutdown`: إشعار إيقاف تشغيل gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران node.
- `node.invoke.request`: بث طلب invoke من node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تم تغيير إعداد مشغلات كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة
  موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة
  Plugin.

### طرق المساعدة الخاصة بـ Node

- يمكن لـ Nodes استدعاء `skills.bins` لجلب القائمة الحالية من الملفات التنفيذية الخاصة بـ Skills
  من أجل فحوصات السماح التلقائي.

### طرق المساعدة الخاصة بـ operator

- يمكن لـ operators استدعاء `commands.list` (`operator.read`) لجلب فهرس
  الأوامر في وقت التشغيل لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - تعيد `text` الرمز الأساسي للأمر النصي من دون الشرطة المائلة `/`
    - تعيد `native` ومسار `both` الافتراضي أسماء أصلية تراعي الموفّر
      عند توفرها
  - تحمل `textAliases` الأسماء المستعارة الدقيقة للأوامر المائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المراعي للموفر عندما يكون موجودًا.
  - يكون `provider` اختياريًا ويؤثر فقط في التسمية الأصلية بالإضافة إلى توافر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات الوسائط المتسلسلة من الاستجابة.
- يمكن لـ operators استدعاء `tools.catalog` (`operator.read`) لجلب فهرس الأدوات في وقت التشغيل
  لوكيل. وتتضمن الاستجابة أدوات مجمعة وبيانات وصفية للمصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما تكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن لـ operators استدعاء `tools.effective` (`operator.read`) لجلب فهرس الأدوات الفعال
  في وقت التشغيل لجلسة.
  - يكون `sessionKey` مطلوبًا.
  - تستمد gateway سياق وقت التشغيل الموثوق من الجلسة على جهة الخادم بدلًا من قبول
    سياق المصادقة أو التسليم الذي يوفّره المستدعي.
  - تكون الاستجابة محددة بالنطاق على مستوى الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك الأدوات الأساسية وأدوات Plugin والقنوات.
- يمكن لـ operators استدعاء `skills.status` (`operator.read`) لجلب فهرس
  الـ Skills المرئي لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - تتضمن الاستجابة الأهلية، والمتطلبات المفقودة، وفحوصات الإعداد، و
    خيارات التثبيت المنقحة من دون كشف القيم السرية الخام.
- يمكن لـ operators استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات اكتشاف ClawHub الوصفية.
- يمكن لـ operators استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: `{ source: "clawhub", slug, version?, force? }` يثبت
    مجلد Skill في دليل `skills/` الخاص بمساحة عمل الوكيل الافتراضي.
  - وضع مُثبّت Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` معلنًا على مضيف gateway.
- يمكن لـ operators استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug متعقبًا واحدًا أو جميع عمليات تثبيت ClawHub المتعقبة في
    مساحة عمل الوكيل الافتراضي.
  - يقوم وضع الإعداد بترقيع قيم `skills.entries.<skillKey>` مثل `enabled`,
    و`apiKey`، و`env`.

## موافقات exec

- عندما يحتاج طلب exec إلى موافقة، تبث gateway الحدث `exec.approval.requested`.
- يحل عملاء operator الطلب عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (وهي `argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية المعيارية). وتُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد عمليات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` المعياري هذا بوصفه السياق المرجعي للأمر/`cwd`/الجلسة.
- إذا عدّل المستدعي `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وبين تمرير `system.run` النهائي المعتمد، فإن
  gateway ترفض التشغيل بدلًا من الوثوق بالحمولة المعدلة.

## التسليم الاحتياطي للوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- تحافظ `bestEffortDeliver=false` على السلوك الصارم: فالأهداف غير المحلولة أو الداخلية فقط الخاصة بالتسليم تعيد `INVALID_REQUEST`.
- تسمح `bestEffortDeliver=true` بالعودة إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل مسار تسليم خارجي قابل للتنفيذ (على سبيل المثال جلسات داخلية/WebChat أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. وتظل القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع للعملاء الخارجيين.

| الثابت                                   | الافتراضي                                              | المصدر                                                     |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                       | `3`                                                    | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| مهلة الطلب (لكل RPC)                     | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| مهلة ما قبل المصادقة / تحدي الاتصال      | `10_000` ms                                            | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| التراجع الأولي لإعادة الاتصال            | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                      |
| الحد الأقصى لتراجع إعادة الاتصال         | `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)              |
| تثبيت إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                       | `src/gateway/client.ts`                                    |
| مهلة الإيقاف القسري قبل `terminate()`    | `250` ms                                               | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| مهلة `stopAndWait()` الافتراضية          | `1_000` ms                                             | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| الفاصل الزمني الافتراضي للنبضة (قبل `hello-ok`) | `30_000` ms                                       | `src/gateway/client.ts`                                    |
| إغلاق مهلة النبضة                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2`   | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                             | `src/gateway/server-constants.ts`                          |

يعلن الخادم عن القيم الفعلية `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي للعملاء احترام هذه القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة gateway ذات السر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المضبوط.
- الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` على اتصال غير loopback
  تُلبّي فحص مصادقة الاتصال من
  رؤوس الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` في الإدخال الخاص مصادقة الاتصال ذات السر المشترك
  بالكامل؛ ولا تُعرّض هذا الوضع على إدخال عام/غير موثوق.
- بعد الإقران، تصدر Gateway **رمز جهاز** محدد النطاق بحسب
  الدور + النطاقات الخاصة بالاتصال. ويُعاد في `hello-ok.auth.deviceToken` وينبغي أن
  يحتفظ به العميل لعمليات الاتصال المستقبلية.
- ينبغي للعملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- كما ينبغي لإعادة الاتصال باستخدام **رمز الجهاز المخزن** هذا أن تعيد استخدام مجموعة
  النطاقات المعتمدة المخزنة لذلك الرمز. وهذا يحافظ على صلاحيات
  القراءة/الفحص/الحالة التي تم منحها بالفعل ويتجنب انهيار عمليات إعادة الاتصال
  بصمت إلى نطاق إداري أضيق ضمني فقط.
- تجميع مصادقة الاتصال على جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - تكون `auth.password` متعامدة وتُمرَّر دائمًا عند ضبطها.
  - تُملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولًا،
    ثم `deviceToken` صريح، ثم رمز لكل جهاز مخزن (مفهرس بواسطة
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أيٌّ من القيم السابقة
    `auth.token`. ويمنعه وجود رمز مشترك أو أي رمز جهاز محلول.
  - يقتصر الترقية التلقائية لرمز الجهاز المخزن في إعادة المحاولة الوحيدة عند
    `AUTH_TOKEN_MISMATCH` على **النقاط النهائية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. أما `wss://` العام
    دون تثبيت فلا يفي بالشروط.
- تمثل إدخالات `hello-ok.auth.deviceTokens` الإضافية رموز تسليم bootstrap.
  ولا تحفظها إلا عندما يستخدم الاتصال مصادقة bootstrap على نقل موثوق
  مثل `wss://` أو loopback/الإقران المحلي.
- إذا قدّم العميل `deviceToken` **صريحًا** أو `scopes` صريحة، فإن
  مجموعة النطاقات المطلوبة من المستدعي تظل مرجعية؛ ولا يُعاد استخدام النطاقات المخزنة مؤقتًا إلا
  عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير رموز الأجهزة/إبطالها عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب ذلك النطاق `operator.pairing`).
- يظل إصدار الرمز وتدويره وإبطاله محدودًا ضمن مجموعة الأدوار المعتمدة
  المسجلة في إدخال إقران ذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع
  أو استهداف دور جهاز لم يمنحه اعتماد الإقران أصلًا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضًا `operator.admin`: إذ لا يمكن للمستدعين غير الإداريين إزالة/إبطال/تدوير
  إلا إدخال **أجهزتهم**.
- تتحقق `device.token.rotate` و`device.token.revoke` أيضًا من مجموعة نطاقات
  رمز operator المستهدف مقابل نطاقات جلسة المستدعي الحالية. ولا يمكن للمستدعين غير الإداريين
  تدوير أو إبطال رمز operator أوسع من الذي يملكونه بالفعل.
- تتضمن حالات فشل المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - قد تحاول العملاء الموثوقة إعادة محاولة واحدة محدودة باستخدام رمز مخزن لكل جهاز.
  - إذا فشلت تلك المحاولة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراءات المشغل.

## هوية الجهاز + الإقران

- ينبغي أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- تكون موافقات الإقران مطلوبة لمعرّفات الأجهزة الجديدة ما لم يكن التفعيل التلقائي المحلي
  مفعّلًا.
- يتمحور التفعيل التلقائي للإقران حول اتصالات loopback المحلية المباشرة.
- كما يحتوي OpenClaw على مسار ضيق للاتصال الذاتي المحلي للواجهة الخلفية/الحاوية من أجل
  تدفقات المساعدة الموثوقة ذات السر المشترك.
- لا تزال الاتصالات عبر tailnet أو LAN على المضيف نفسه تُعامل على أنها بعيدة لأغراض الإقران
  وتتطلب اعتمادًا.
- عادةً ما تتضمن عملاء WS هوية `device` أثناء `connect` (operator +
  node). والاستثناءات الوحيدة لـ operator من دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` من أجل توافق HTTP غير الآمن على localhost فقط.
  - نجاح مصادقة operator الخاصة بـ Control UI في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (خيار كسر الزجاج، وتراجع أمني شديد).
  - عمليات RPC الخلفية `gateway-client` على loopback المباشر والمصادق عليها باستخدام
    الرمز/كلمة المرور المشتركة الخاصة بالـ gateway.
- يجب على جميع الاتصالات توقيع قيمة `connect.challenge` nonce التي يوفّرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القديمة التي لا تزال تستخدم سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز التفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع قيمة `error.details.reason` مستقرة.

حالات فشل الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسل قيمة فارغة).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديمة/خاطئة.          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.                 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح به.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام.         |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.                   |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخاصة بالخادم.
- أرسل nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- لا تزال توقيعات `v2` القديمة مقبولة من أجل التوافق، لكن تثبيت بيانات
  الجهاز المقترن الوصفية يظل يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة gateway الكاملة** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، وNodes، والموافقات، إلخ). ويتم تعريف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [بروتوكول Bridge](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
