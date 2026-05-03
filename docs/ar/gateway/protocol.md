---
read_when:
    - تنفيذ أو تحديث عملاء WS لـ Gateway
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket لـ Gateway: المصافحة، الإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-03T21:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويعلنون **دورهم** + **نطاقهم** في
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- إطارات ما قبل الاتصال محددة بسقف 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تطلق الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز السبب الآمنة. ولا تحتفظ بنص الرسالة
  أو محتويات المرفقات أو جسم الإطار الخام أو الرموز المميزة أو ملفات تعريف الارتباط أو القيم السرية.

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

بينما لا يزال Gateway ينهي تهيئة الملحقات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلا من عرضها كفشل مصافحة نهائي.

`server` و`features` و`snapshot` و`policy` كلها مطلوبة في المخطط
(`src/gateway/protocol/schema/frames.ts`). `auth` مطلوب أيضا ويعرض
الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عند عدم إصدار رمز جهاز، يعرض `hello-ok.auth` الأذونات المتفاوض عليها
دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يجوز لعملاء الخلفية الموثوقين في العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لنداءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس اقتران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكيل الفرعي. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الاقتران وترقية النطاق العادية.

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

في تدفق تمهيد العقدة/المشغل المدمج، يبقى رمز العقدة الأساسي
`scopes: []` وأي رمز مشغل يتم تسليمه يبقى محدودا بقائمة سماح
مشغل التمهيد (`operator.approvals` و`operator.read` و
`operator.talk.secrets` و`operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل تلبي طلبات المشغل فقط، ولا تزال الأدوار غير المشغلة
تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال عقدة

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

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح عدم التكرار** (انظر المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاقات المشغل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف الإمكانات (الكاميرا/الشاشة/اللوحة/system.run).

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

قد تطلب أساليب RPC الخاصة بـ Gateway والمسجلة من Plugin نطاق مشغل خاصا بها، لكن
بادئات إدارة النواة المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
و`update.*`) تتحول دائما إلى `operator.admin`.

نطاق الأسلوب هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب عمليات كتابة
`/config set` و`/config unset` الدائمة `operator.admin`.

لدى `node.pair.approve` أيضا فحص نطاق إضافي في وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تتضمن أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العقد مطالبات الإمكانات عند وقت الاتصال:

- `caps`: فئات الإمكانات عالية المستوى.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلا** و**عقدة** معا.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تعرض العقد المتصلة
  وقت اتصالها الحالي باعتباره `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضا عرض
  حضور خلفية دائم عندما يحدث حدث عقدة موثوق بيانات تعريف اقترانها.

### حدث بقاء العقدة في الخلفية

يمكن للعقد استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون وضع علامة عليها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. يطبع Gateway سلاسل المشغلات غير المعروفة إلى
`background` قبل الاستمرارية. يكون الحدث دائما فقط لجلسات أجهزة العقد المصادق عليها؛
وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد بوابات Gateway الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال بوابات Gateway الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك
كنداء RPC مؤكد، وليس كاستمرارية حضور دائمة.

## تحديد نطاق أحداث البث

أحداث بث WebSocket التي يدفعها الخادم مقيدة بالنطاق بحيث لا تتلقى الجلسات ذات نطاق الاقتران أو جلسات العقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب `operator.read` على الأقل. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة من Plugin** مقيدة بـ `operator.write` أو `operator.admin`، حسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) تبقى غير مقيدة حتى تبقى صحة النقل قابلة للمراقبة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** مقيدة بالنطاق افتراضيا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل، حتى تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مصفاة بالنطاق من تدفق الأحداث.

## عائلات أساليب RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست نسخة مفرغة مولدة — `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات أساليب
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتا أو المفحوصة حديثا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الأخير. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة المشغل مطلوب.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ لا تدرج الحقول الحساسة إلا لعملاء المشغل ضمن نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/العقد المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للحصول على النماذج المكوّنة بحجم مناسب لأداة الاختيار (`agents.defaults.models` أولاً، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للحصول على الكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخي.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / تضمين الذاكرة المخبأة لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحة اختبار اتصال مباشر بمزوّد التضمين.
    - يعيد `doctor.memory.remHarness` معاينة REM محدودة وللقراءة فقط لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل ومقتطفات الذاكرة وMarkdown مثبتاً معروضاً ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة والمضمنة.
    - يسجل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفع APNs اختباري إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسالات المستهدفة حسب القناة/الحساب/السلسلة خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.config` حمولة تهيئة Talk الفعلية؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` حالة وضع Talk الحالي ويبثها لعملاء WebChat/واجهة التحكم.
    - ينشئ `talk.speak` كلاماً عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تفعيل TTS والمزوّد النشط ومزوّدي الاحتياط وحالة تهيئة المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلاً لمرة واحدة من نص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار والتهيئة والتحديث والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة للأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة التهيئة الحالية والهاش.
    - يكتب `config.set` حمولة تهيئة متحققاً منها.
    - يدمج `config.patch` تحديث تهيئة جزئياً.
    - يتحقق `config.apply` من حمولة التهيئة الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط التهيئة الحي المستخدمة بواسطة واجهة التحكم وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات التعريف الخاصة بالتوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقول `title` / `description` المشتقة من التسميات نفسها ونص المساعدة المستخدمين في الواجهة، بما في ذلك فروع تكوين الكائنات المتداخلة، وأحرف البدل، وعناصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار تهيئة واحد: المسار المعياري، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرة للتنقل التفصيلي في الواجهة/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، ورايات مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، والمسار المعياري `path`، و`type`، و`required`، و`hasChildren`، إضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` كي يستأنف بدء التشغيل دورة وكيل متابعة واحدة عبر قائمة انتظار استمرار إعادة التشغيل. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد استبدال الحزمة، كي لا تواصل عملية Gateway القديمة التحميل الكسول من شجرة `dist` مستبدلة.
    - يعيد `update.status` أحدث مؤشر إعادة تشغيل تحديث مخبأ، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عندما يكون متاحاً.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج التهيئة الأولية عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعلي وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة للوكيل.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات القطع الأثرية والتنزيلات المشتقة من النصوص لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة على جهة الخادم وتعيد فقط وسائط النص ذات المصدر المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلاً من جلبها من جهة الخادم.
    - يعيد `agent.identity.get` هوية المساعد الفعلية لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عندما تكون متاحة.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل وكيل مكوّنة.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسات لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصية محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحداً لمفتاح جلسة مطابق تماماً.
    - يحل `sessions.resolve` هدف جلسة أو يجعله معيارياً.
    - ينشئ `sessions.create` إدخال جلسة جديداً.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يجهض `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلغ عن النموذج المعياري المحلول إضافة إلى `agentRuntime` الفعلي.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء الواجهة: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML لاستدعاءات الأدوات كنص عادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج المسرّبة بنمط ASCII/العرض الكامل، وتحذف صفوف المساعد ذات الرموز الصامتة الصرفة مثل `NO_REPLY` / `no_reply` المطابقة تماماً، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والموافق عليها.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران العقد والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمراً إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الناشئة من Node عائدة إلى Gateway.
    - يحدّث `node.canvas.capability.refresh` رموز قدرة اللوحة المحددة النطاق.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لقائمة انتظار Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق المتين للعقد غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة إضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فورياً أو عند Heartbeat التالي؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list`، و`skills.*`، و`tools.catalog`، و`tools.effective`، و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة الواجهة مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها التعريفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّرت تهيئة مشغل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### أساليب مساعدة Node

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية لفحوص السماح التلقائي.

### أساليب مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون `/` البادئة
    - يعيد مسارا `native` و`both` الافتراضي أسماء أصلية واعية بالمزوّد
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة بشرطة مائلة دقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسائط المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`:‏ `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` ذات الأنواع. تعيد رفضات الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون
  Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعداد وخيارات
    التثبيت المنقّاة من دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات تعريف الاكتشاف في ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) بوضعين:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد Skills في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضي.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرحا به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub اختصارا متتبعا واحدا أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضي.
  - يرقّع وضع الإعداد قيما في `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### طرق عرض `models.list`

يقبل `models.list` معامل `view` اختياريا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مضبوطا، تكون الاستجابة هي الكتالوج المسموح؛ وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم منتقي. إذا كان `agents.defaults.models` مضبوطا، فإنه لا يزال يغلّب. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مضبوطة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway `exec.approval.requested`.
- يحسم عملاء المشغّل ذلك عبر استدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة المعتمدة). يتم رفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام
  `systemRunPlan` المعتمدة كسياق الأمر/cwd/الجلسة الموثوق.
- إذا عدّل مستدع `command` أو`rawCommand` أو`cwd` أو`agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي المعتمد إلى `system.run`، يرفض
  Gateway التشغيل بدلا من الوثوق بالحمولة المعدلة.

## احتياطي تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: أهداف التسليم غير المحلولة أو الداخلية فقط تعيد `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر protocol v3 وهي خط الأساس المتوقع لعملاء الجهات الخارجية.

| الثابت                                    | الافتراضي                                             | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المقترنة) |
| تراجع إعادة الاتصال الأولي                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى تراجع لإعادة الاتصال                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة الإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم عن القيم الفعالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ يجب على العملاء احترام تلك القيم
بدلا من الافتراضات السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المكوّن.
- تفي الأوضاع التي تحمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير الخاصة بالاسترجاع المحلي بفحص مصادقة الاتصال من
  ترويسات الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محدود النطاق بدور الاتصال
  + النطاقات. يعاد في `hello-ok.auth.deviceToken` ويجب أن
  يحتفظ به العميل للاتصالات المستقبلية.
- يجب أن يحتفظ العملاء بـ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** هذا استخدام مجموعة النطاقات
  المعتمدة المخزنة لذلك الرمز أيضا. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح بالفعل ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى نطاق
  ضمني أضيق يقتصر على المسؤول فقط.
- تجميع مصادقة الاتصال من جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائما عند ضبطه.
  - تتم تعبئة `auth.token` حسب ترتيب الأولوية: رمز مشترك صريح أولا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - يرسل `auth.bootstrapToken` فقط عندما لا ينتج أي مما سبق
    `auth.token`. يؤدي وجود رمز مشترك أو أي رمز جهاز محلول إلى حجبه.
  - يخضع الترفيع التلقائي لرمز جهاز مخزن في إعادة المحاولة لمرة واحدة
    عند `AUTH_TOKEN_MISMATCH` لقيد **نقاط النهاية الموثوقة فقط** -
    الاسترجاع المحلي، أو `wss://` مع `tlsFingerprint` مثبتة. لا يتأهل `wss://`
    العام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم تمهيدية.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة تمهيدية على نقل موثوق
  مثل `wss://` أو اقتران الاسترجاع المحلي/المحلي.
- إذا قدم العميل `deviceToken` **صريحا** أو `scopes` صريحة، فتبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجع؛ لا يعاد استخدام النطاقات المخزنة مؤقتا إلا
  عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إلغاء رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط لاستدعاءات الجهاز نفسه التي تمت مصادقتها بالفعل برمز ذلك الجهاز،
  لكي يتمكن العملاء المعتمدون على الرمز فقط من الاحتفاظ ببديلهم قبل
  إعادة الاتصال. لا تكرر تدويرات المشترك/المسؤول رمز الحامل.
- يظل إصدار الرموز وتدويرها وإلغاؤها محدودا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع أو
  استهداف دور جهاز لم تمنحه موافقة الاقتران قط.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم
  يمتلك المستدعي أيضا `operator.admin`: لا يستطيع المستدعون غير المسؤولين إزالة/إلغاء/تدوير
  إلا إدخال جهازهم **الخاص**.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضا من مجموعة نطاقات رمز
  المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يمكن للمستدعين
  غير المسؤولين تدوير أو إلغاء رمز مشغل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يجوز للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن مؤقتا لكل جهاز.
  - إذا فشلت إعادة المحاولة هذه، يجب أن يوقف العملاء حلقات إعادة الاتصال التلقائية ويعرضوا إرشادات إجراء للمشغل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العقد هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways الرموز لكل جهاز + دور.
- موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي المحلي
  مفعلا.
- يتمحور الاعتماد التلقائي للاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضا مسار اتصال ذاتي ضيق محلي للخلفية/الحاوية لتدفقات المساعد
  الموثوقة ذات السر المشترك.
- تظل اتصالات نفس المضيف عبر tailnet أو LAN تعامل كاتصالات بعيدة للاقتران و
  تتطلب الموافقة.
- عادة ما يتضمن عملاء WS هوية `device` أثناء `connect` (المشغل +
  العقدة). الاستثناءات الوحيدة للمشغل من دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن الخاص بالمضيف المحلي فقط.
  - مصادقة Control UI للمشغل الناجحة عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (إجراء طارئ، تخفيض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر local loopback من `gateway-client` والمصادق عليها برمز/كلمة مرور
    Gateway المشتركة.
- يجب أن توقع كل الاتصالات قيمة nonce الخاصة بـ `connect.challenge` التي يقدمها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقرة.

إخفاقات الترحيل الشائعة:

| الرسالة                    | details.code                     | details.reason           | المعنى                                             |
| -------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسله فارغا).      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقع العميل باستخدام nonce قديمة/خاطئة.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام.          |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.                    |

هدف الترحيل:

- انتظر دائما `connect.challenge`.
- وقع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، إذ تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل تواقيع `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للأجهزة المقترنة ما زال يتحكم بسياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يجوز للعملاء اختياريا تثبيت بصمة شهادة Gateway (راجع إعدادات `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو خيار CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة برمجة تطبيقات Gateway كاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، إلخ). يحدد السطح الدقيق عبر مخططات
TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
