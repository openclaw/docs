---
read_when:
    - تنفيذ عملاء Gateway WS أو تحديثهم
    - تصحيح عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket لـ Gateway: المصافحة والإطارات وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-06-27T17:42:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل كل العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد
بلا واجهة) عبر WebSocket ويعلنون **الدور** + **النطاق** أثناء
المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- إطارات ما قبل الاتصال محدودة بـ 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. مع تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، وأكواد السبب الآمنة. ولا تحتفظ بجسم الرسالة،
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

بينما لا يزال Gateway ينهي مكونات التشغيل الجانبية عند بدء التشغيل، يمكن لطلب `connect`
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلًا من عرضها كفشل مصافحة نهائي.

`server` و`features` و`snapshot` و`policy` كلها مطلوبة بواسطة المخطط
(`packages/gateway-protocol/src/schema/frames.ts`). كما أن `auth` مطلوب أيضًا ويبلّغ
عن الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL محددة النطاق لأسطح Plugin. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Plugin التجريبية لـ Canvas
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين والبوابات الحالية
استخدام أسطح Plugin.

عندما لا يُصدر رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
من دون حقول رموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يجوز لعملاء الخلفية الموثوقين داخل العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار محجوز
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع أساسات إقران CLI/الجهاز القديمة من
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

التمهيد المدمج عبر QR/رمز الإعداد هو مسار تسليم جديد للهاتف المحمول. يعيد اتصال
رمز إعداد أساسي ناجح رمز عقدة أساسيًا مع رمز مشغل واحد محدود:

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

تسليم المشغل محدود عمدًا حتى يتمكن إعداد QR من بدء حلقة المشغل
على الهاتف المحمول دون منح `operator.admin` أو `operator.pairing`.
وهو يتضمن `operator.talk.secrets` لكي يتمكن العميل الأصلي من قراءة إعداد Talk
الذي يحتاجه بعد التمهيد. تتطلب نطاقات الإدارة والإقران الأوسع
إقران مشغل منفصلًا وموافقًا عليه أو تدفق رمز. ينبغي للعملاء حفظ
`hello-ok.auth.deviceTokens` فقط
عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق مثل `wss://` أو
إقران loopback/محلي.

### مثال عقدة

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (راجع المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاقات المشغل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
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

قد تطلب طرق RPC في Gateway المسجلة من Plugin نطاق مشغل خاصًا بها، لكن
بادئات إدارة النواة المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
و`update.*`) تتحول دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر slash التي تُوصل عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` الدائمة `operator.admin`.

يتضمن `node.pair.approve` أيضًا فحص نطاق إضافيًا وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تتضمن أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العقد ادعاءات الإمكانات وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen`
  و`location` و`voice` و`talk`.
- `commands`: قائمة الأوامر المسموح بها للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه على أنها **ادعاءات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` لكي تتمكن واجهات المستخدم من إظهار صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلًا** و**عقدة**.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تبلّغ العقد المتصلة
  عن وقت اتصالها الحالي بوصفه `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضًا الإبلاغ
  عن حضور خلفي دائم عندما يحدّث حدث عقدة موثوق بيانات الإقران الوصفية الخاصة بها.

### حدث بقاء العقدة في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
نشطة أثناء إيقاظ في الخلفية دون وضع علامة عليها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغلات غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائمًا فقط لجلسات أجهزة العقد
المصادَق عليها؛ وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد البوابات الناجحة نتيجة مهيكلة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد تظل البوابات الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك
على أنه RPC مُقرّ به، وليس استمرار حضور دائم.

## تحديد نطاق أحداث البث

تكون أحداث بث WebSocket المدفوعة من الخادم مقيدة بالنطاق حتى لا تتلقى الجلسات المقيدة بالإقران أو الخاصة بالعقد فقط محتوى الجلسات بشكل سلبي.

- تتطلب **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) `operator.read` على الأقل. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تُقيّد **بثوث `plugin.*` المعرفة من Plugin** إلى `operator.write` أو `operator.admin`، حسب كيفية تسجيلها من Plugin.
- تظل **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) غير مقيدة حتى تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادَق عليها.
- تُقيّد **عائلات أحداث البث غير المعروفة** بالنطاق افتراضيًا (إغلاق عند الفشل) ما لم يرخّصها معالج مسجل صراحةً.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل، لكي تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة ومفلترة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست نسخة مولدة — إذ إن `hello-ok.features.methods` قائمة اكتشاف محافظة
مبنية من `src/gateway/server-methods-list.ts` إضافة إلى صادرات طرق
Plugin/القنوات المحملة. تعامل معها كاكتشاف للميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="النظام والهوية">
    - `health` يعيد لقطة صحة Gateway المخزنة مؤقتًا أو التي تم فحصها حديثًا.
    - `diagnostics.stability` يعيد مسجّل الاستقرار التشخيصي المحدود الأخير. يحتفظ ببيانات وصفية تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرّفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. يلزم نطاق قراءة المشغّل.
    - `status` يعيد ملخص Gateway بنمط `/status`؛ لا تُضمَّن الحقول الحساسة إلا لعملاء المشغّل ضمن نطاق المدير.
    - `gateway.identity.get` يعيد هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - `system-presence` يعيد لقطة الحضور الحالية لأجهزة المشغّل/Node المتصلة.
    - `system-event` يضيف حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - `last-heartbeat` يعيد أحدث حدث Heartbeat مستمر.
    - `set-heartbeats` يبدّل معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - `models.list` يعيد كتالوج النماذج المسموح بها في وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للمنتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - `usage.status` يعيد نوافذ استخدام الموفّر/ملخصات الحصة المتبقية.
    - `usage.cost` يعيد ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
      مرّر `agentId` لوكيل واحد، أو `agentScope: "all"` لتجميع الوكلاء المكوّنين.
    - `doctor.memory.status` يعيد جاهزية الذاكرة المتجهية / التضمينات المخزنة مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بموفّر التضمينات. يمكن للعملاء المدركون لـ Dreaming أيضًا تمرير `{ "agentId": "agent-id" }` لتقييد إحصاءات مخزن Dreaming بمساحة عمل وكيل محددة؛ حذف `agentId` يبقي رجوع الوكيل الافتراضي ويجمّع مساحات عمل Dreaming المكوّنة.
    - تقبل `doctor.memory.dreamDiary` و`doctor.memory.backfillDreamDiary` و`doctor.memory.resetDreamDiary` و`doctor.memory.resetGroundedShortTerm` و`doctor.memory.repairDreamingArtifacts` و`doctor.memory.dedupeDreamDiary` معاملات اختيارية `{ "agentId": "agent-id" }` لعرض/إجراءات Dreaming الخاصة بالوكيل المحدد. عند حذف `agentId`، تعمل على مساحة عمل الوكيل الافتراضي المكوّنة.
    - `doctor.memory.remHarness` يعيد معاينة محدودة للقراءة فقط لحزمة REM لعملاء مستوى التحكم عن بُعد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown المؤسّس المعروض، ومرشحي الترقية العميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - `sessions.usage` يعيد ملخصات الاستخدام لكل جلسة. مرّر `agentId` لوكيل واحد،
      أو `agentScope: "all"` لسرد الوكلاء المكوّنين معًا.
    - `sessions.usage.timeseries` يعيد استخدام السلاسل الزمنية لجلسة واحدة.
    - `sessions.usage.logs` يعيد إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدو تسجيل الدخول">
    - `channels.status` يعيد ملخصات حالة القنوات/Plugin المدمجة + المرفقة.
    - `channels.logout` يسجّل الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - `web.login.start` يبدأ تدفق تسجيل دخول QR/ويب لموفّر قناة الويب الحالي القادر على QR.
    - `web.login.wait` ينتظر اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ القناة عند النجاح.
    - `push.test` يرسل إشعار APNs اختباريًا إلى Node iOS مسجلة.
    - `voicewake.get` يعيد مشغّلات كلمة التنبيه المخزنة.
    - `voicewake.set` يحدّث مشغّلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسال الموجّه إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
    - `logs.tail` يعيد ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - `talk.catalog` يعيد كتالوج موفّري Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرّفات الموفّرين، والتسميات، وحالة التكوين، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع القانونية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/الإمكانات الفورية دون إعادة أسرار الموفّر أو تعديل الإعداد العام.
    - `talk.config` يعيد حمولة إعداد Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - `talk.session.create` ينشئ جلسة Talk مملوكة لـ Gateway لـ `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. بالنسبة إلى `stt-tts/managed-room`، يجب على مستدعي `operator.write` الذين يمررون `sessionKey` أن يمرروا أيضًا `spawnedBy` لرؤية مفتاح الجلسة ضمن النطاق؛ ويتطلب إنشاء `sessionKey` غير محدد النطاق و`brain: "direct-tools"` الصلاحية `operator.admin`.
    - `talk.session.join` يتحقق من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، ويعيد بيانات وصفية للغرفة/الجلسة بالإضافة إلى أحداث Talk الأخيرة دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - `talk.session.appendAudio` يضيف صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة لـ Gateway.
    - `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` تدير دورة حياة الدور في الغرفة المُدارة مع رفض الدور المتقادم قبل مسح الحالة.
    - `talk.session.cancelOutput` يوقف إخراج صوت المساعد، أساسًا للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - `talk.session.submitToolResult` يكمل استدعاء أداة من الموفّر صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway. مرّر `options: { willContinue: true }` لمخرج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تفي نتيجة الأداة باستدعاء الموفّر دون بدء استجابة مساعد فورية أخرى.
    - `talk.session.steer` يرسل تحكمًا صوتيًا للتشغيل النشط إلى جلسة Talk مدعومة بوكيل ومملوكة لـ Gateway. يقبل `{ sessionId, text, mode? }`، حيث يكون `mode` هو `status` أو `steer` أو `cancel` أو `followup`؛ ويُصنّف الوضع المحذوف من النص المنطوق.
    - `talk.session.close` يغلق جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة لـ Gateway ويصدر أحداث Talk نهائية.
    - `talk.mode` يعيّن/يبث حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - `talk.client.create` ينشئ جلسة موفّر فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما يملك Gateway الإعداد، وبيانات الاعتماد، والتعليمات، وسياسة الأدوات.
    - `talk.client.toolCall` يتيح لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات الموفّر إلى سياسة Gateway. الأداة المدعومة الأولى هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة العادية قبل إرسال نتيجة الأداة الخاصة بالموفّر.
    - `talk.client.steer` يرسل تحكمًا صوتيًا للتشغيل النشط لوسائل النقل الفورية المملوكة للعميل. يحل Gateway التشغيل المضمّن النشط من `sessionKey` ويعيد نتيجة منظمة مقبولة/مرفوضة بدلًا من إسقاط التوجيه بصمت.
    - `talk.event` هو قناة أحداث Talk الوحيدة للمحوّلات الفورية، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، والاجتماعات.
    - `talk.speak` يولّد الكلام عبر موفّر كلام Talk النشط.
    - `tts.status` يعيد حالة تفعيل TTS، والموفّر النشط، وموفّري الرجوع، وحالة إعداد الموفّر.
    - `tts.providers` يعيد مخزون موفّري TTS المرئي.
    - `tts.enable` و`tts.disable` يبدّلان حالة تفضيلات TTS.
    - `tts.setProvider` يحدّث موفّر TTS المفضّل.
    - `tts.convert` يشغّل تحويل النص إلى كلام لمرة واحدة.

  </Accordion>

  <Accordion title="الأسرار، والإعداد، والتحديث، والمعالج">
    - `secrets.reload` يعيد حل SecretRefs النشطة ويستبدل حالة سر وقت التشغيل فقط عند النجاح الكامل.
    - `secrets.resolve` يحل تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - `config.get` يعيد لقطة الإعداد الحالية والتجزئة.
    - `config.set` يكتب حمولة إعداد متحقَّقًا منها.
    - `config.patch` يدمج تحديث إعداد جزئيًا. يتطلب استبدال المصفوفة الإتلافي
      المسار المتأثر في `replacePaths`؛ تستخدم المصفوفات المتداخلة
      تحت إدخالات المصفوفة مسارات `[]` مثل `agents.list[].skills`.
    - `config.apply` يتحقق من حمولة الإعداد الكاملة + يستبدلها.
    - `config.schema` يعيد حمولة مخطط الإعداد الحية التي تستخدمها أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات وصفية للتوليد، بما في ذلك بيانات مخطط Plugin + القناة الوصفية عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات وصفية لحقلي `title` / `description` مشتقة من التسميات نفسها ونص المساعدة نفسه المستخدمين في واجهة المستخدم، بما في ذلك فروع الكائن المتداخل، وحرف البدل، وعنصر المصفوفة، وتركيب `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - `config.schema.lookup` يعيد حمولة بحث محددة المسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، و`reloadKind` اختياري، وملخصات الأبناء المباشرين للتنقل التفصيلي في واجهة المستخدم/CLI. تكون `reloadKind` واحدة من `restart` أو `hot` أو `none` وتعكس مخطط إعادة تحميل إعداد Gateway للمسار المطلوب. تحتفظ عقد مخطط البحث بوثائق المستخدم وحقول التحقق الشائعة (`title` و`description` و`type` و`enum` و`const` و`format` و`pattern` وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). تكشف ملخصات الأبناء `key`، والمسار المطبّع `path`، و`type`، و`required`، و`hasChildren`، و`reloadKind` اختياريًا، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - `update.run` يشغّل تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` كي يستأنف بدء التشغيل دورة وكيل متابعة واحدة عبر قائمة انتظار متابعة إعادة التشغيل. تستخدم تحديثات مدير الحزم وتحديثات git-checkout الخاضعة للإشراف من مستوى التحكم تسليمًا منفصلًا إلى خدمة مُدارة بدلًا من استبدال شجرة الحزمة أو تعديل مخرجات checkout/build داخل Gateway الحي. يعيد التسليم الذي بدأ `ok: true` مع `result.reason: "managed-service-handoff-started"` و`handoff.status: "started"`؛ وتعيد التسليمات غير المتاحة أو الفاشلة `ok: false` مع `managed-service-handoff-unavailable` أو `managed-service-handoff-failed`، بالإضافة إلى `handoff.command` عندما يكون تحديث shell يدوي مطلوبًا. يعني التسليم غير المتاح أن OpenClaw يفتقر إلى حد مشرف آمن أو هوية خدمة دائمة، مثل `OPENCLAW_SYSTEMD_UNIT` لـ systemd. أثناء تسليم بدأ، قد يبلغ حارس إعادة التشغيل لفترة وجيزة عن `stats.reason: "restart-health-pending"`؛ وتؤخَّر المتابعة حتى يتحقق CLI من Gateway المُعاد تشغيله ويكتب حارس `ok` النهائي.
    - `update.status` يحدّث ويعيد أحدث حارس لإعادة تشغيل التحديث، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` تكشف معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعّال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة للوكيل.
    - تعرض `tasks.list` و`tasks.get` و`tasks.cancel` سجل مهام Gateway لعملاء SDK والمشغّل.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات القطع الأثرية والتنزيلات المشتقة من النصوص لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهمة الجلسة المالكة من جهة الخادم ولا تعيد إلا وسائط النصوص ذات المصدر المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلاً من جلبها من جهة الخادم.
    - تعرض `environments.list` و`environments.status` اكتشاف بيئة Gateway المحلية وبيئة العقدة بصلاحية قراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعّالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عند تكوين خلفية وقت تشغيل وكيل.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسة لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النصوص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصوص محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحداً لمفتاح جلسة مطابق تماماً.
    - يحل `sessions.resolve` هدف جلسة أو يجعله قانونياً.
    - ينشئ `sessions.create` إدخال جلسة جديداً.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يمثّل `sessions.steer` متغير المقاطعة والتوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف الجلسة/تجاوزاتها ويبلّغ عن النموذج القانوني المحلول إضافة إلى `agentRuntime` الفعّال.
    - تنفّذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزّن كاملاً.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يجري تطبيع `chat.history` للعرض لعملاء الواجهة: تُزال وسوم التوجيه المضمّنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بصيغة نص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المبتورة) ورموز تحكم النموذج المسرّبة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد التي تحتوي رموزاً صامتة فقط مثل `NO_REPLY` / `no_reply` المطابقة تماماً، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
    - `chat.message.get` هو قارئ الرسالة الكاملة المحدود والإضافي لإدخال نص مرئي واحد. يمرر العملاء `sessionKey` و`agentId` اختياري عند كون اختيار الجلسة محدوداً بوكيل، إضافة إلى `messageId` نصي سبق عرضه عبر `chat.history`، ويعيد Gateway الإسقاط نفسه المطبع للعرض دون حد البتر الخفيف للتاريخ عندما يكون الإدخال المخزّن لا يزال متاحاً وليس كبير الحجم.
    - يقبل `chat.send` قيمة `fastMode: "auto"` لدورة واحدة لاستخدام الوضع السريع لاستدعاءات النموذج التي تبدأ قبل حد القطع التلقائي، ثم بدء استدعاءات إعادة المحاولة أو البديل أو نتيجة الأداة أو المتابعة لاحقاً دون الوضع السريع. القيمة الافتراضية للحد هي 60 ثانية ويمكن تكوينها لكل نموذج عبر `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. يستطيع مستدعي `chat.send` تمرير `fastAutoOnSeconds` لدورة واحدة لتجاوز الحد لذلك الطلب.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - يبطل `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران العقد والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران العقد والتحقق من التمهيد.
    - تعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية عقدة مقترنة.
    - يمرّر `node.invoke` أمراً إلى عقدة متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من العقدة مرة أخرى إلى Gateway.
    - تمثّل `node.pending.pull` و`node.pending.ack` واجهات API لطابور العقد المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم للعقد غير المتصلة/المفصولة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة إضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية للعقدة عبر أوامر ترحيل العقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرّفة من Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص إيقاظ فورياً أو عند Heartbeat التالي؛ وتدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - يبقى `cron.run` استدعاء RPC بنمط الإدراج في الطابور للتشغيلات اليدوية. يجب على العملاء الذين يحتاجون إلى دلالات الاكتمال قراءة `runId` المعاد واستطلاع `cron.runs`.
    - تقبل `cron.runs` مرشح `runId` اختيارياً غير فارغ بحيث يستطيع العملاء متابعة تشغيل يدوي واحد في الطابور دون التسابق مع إدخالات تاريخ أخرى للوظيفة نفسها.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة الواجهة مثل `chat.inject` وأحداث دردشة أخرى خاصة بالنصوص فقط. في البروتوكول v4، تحمل حمولات الفروق `deltaText`؛ وتبقى `message` لقطة المساعد التراكمية. تضبط الاستبدالات غير البادئة `replace=true` وتستخدم `deltaText` كنص الاستبدال.
- `session.message` و`session.operation` و`session.tool`: تحديثات النصوص وعملية الجلسة قيد التنفيذ وتدفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها التعريفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/وظيفة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب استدعاء العقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر تكوين مشغّل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق مساعدة العقد

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية للـ Skills لفحوص السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغّل فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر استدعاءات RPC لسجل المهام. تعيد هذه الطرق ملخصات مهام منقّحة، لا حالة وقت التشغيل الخام.

- تتطلب `tasks.list` صلاحية `operator.read`.
  - المعاملات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من تلك الحالات، و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى `500`، و`cursor` نصي اختياري.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- تتطلب `tasks.get` صلاحية `operator.read`.
  - المعاملات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرّفات المهام المفقودة شكل خطأ غير موجود الخاص بـ Gateway.
- تتطلب `tasks.cancel` صلاحية `operator.write`.
  - المعاملات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يبلّغ `found` عما إذا كان السجل يحتوي مهمة مطابقة. ويبلّغ `cancelled` عما إذا كان وقت التشغيل قد قبل الإلغاء أو سجّله.

يتضمن `TaskSummary` كلاً من `id` و`status` وبيانات تعريف اختيارية مثل `kind` و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey` و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية والتقدم والملخص النهائي ونص الخطأ المنقّح. يحدد `agentId` الوكيل الذي ينفذ المهمة؛ وتحافظ `sessionKey` و`ownerKey` على سياق الطالب والتحكم.

### طرق مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل للوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي بدون البادئة `/`
    - يعيد `native` ومسار `both` الافتراضيان الأسماء الأصلية الواعية بالموفّر عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالموفّر عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسائط المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما تكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلاً من قبول سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة هي إسقاط مشتق من الخادم ومحدد بنطاق الجلسة للمخزون النشط، بما في ذلك أدوات النواة وPlugin والقناة وأدوات خوادم MCP المكتشفة مسبقاً.
  - `tools.effective` للقراءة فقط بالنسبة إلى MCP: قد يعرض كتالوج MCP لجلسة دافئة عبر سياسة الأدوات النهائية، لكنه لا ينشئ أوقات تشغيل MCP، ولا يربط وسائل النقل، ولا يصدر `tools/list`. إذا لم يوجد كتالوج دافئ مطابق، فقد تتضمن الاستجابة إشعاراً مثل `mcp-not-yet-connected` أو `mcp-not-yet-listed` أو `mcp-stale-catalog`.
  - تستخدم إدخالات الأدوات الفعّالة `source="core"` أو `source="plugin"` أو `source="channel"` أو `source="mcp"`.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و`idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول `agentId`.
  - تتطلب مغلفات النواة الخاصة بالمالك فقط مثل `cron` و`gateway` و`nodes` هوية مالك/مسؤول (`operator.admin`) رغم أن طريقة `tools.invoke` نفسها هي `operator.write`.
  - الاستجابة هي مغلف موجه إلى SDK يتضمن `ok` و`toolName` و`output` اختيارياً وحقول `error` نمطية. تعيد رفضيات الموافقة أو السياسة `ok:false` في الحمولة بدلاً من تجاوز خط معالجة سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات المفقودة، وفحوصات الإعدادات، وخيارات التثبيت المنقّحة دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) لبيانات تعريف اكتشاف ClawHub.
- يمكن للمشغّلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و`skills.upload.commit` (`operator.admin`) لتهيئة أرشيف Skills خاص قبل تثبيته. هذا مسار رفع إداري منفصل للعملاء الموثوقين، وليس تدفق تثبيت Skills العادي من ClawHub، وهو معطل افتراضياً ما لم يتم تمكين `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` رفعاً مرتبطاً بذلك الـ slug وقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` البايتات عند الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي وSHA-256. لا ينهي commit إلا الرفع؛ ولا يثبت Skills.
  - أرشيفات Skills المرفوعة هي أرشيفات zip تحتوي على جذر `SKILL.md`. لا يحدد اسم الدليل الداخلي للأرشيف هدف التثبيت أبداً.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }` مجلد Skills في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع الرفع: يثبت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` رفعاً ملتزماً في دليل `skills/<slug>` لمساحة عمل الوكيل الافتراضية. يجب أن يطابق الـ slug وقيمة force طلب `skills.upload.begin` الأصلي. يُرفض هذا الوضع ما لم يتم تمكين `skills.install.allowUploadedArchives`. لا يؤثر الإعداد في تثبيتات ClawHub.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, timeoutMs? }` إجراء `metadata.openclaw.install` معلناً على مضيف Gateway. قد يظل العملاء الأقدم يرسلون `dangerouslyForceUnsafeInstall`؛ هذا الحقل مهمل، ومقبول فقط لتوافق البروتوكول، ويتم تجاهله. استخدم `security.installPolicy` لقرارات التثبيت المملوكة للمشغّل.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub slug واحداً متتبعاً أو كل تثبيتات ClawHub المتتبعة في مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و`apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا تم تكوين `agents.defaults.models`، تكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكياً لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم منتقي. إذا تم تكوين `agents.defaults.models`، فسيظل هو الغالب، بما في ذلك الاكتشاف المحدد بنطاق الموفّر لإدخالات `provider/*`. بدون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مكوّنة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway `exec.approval.requested`.
- يحسم عملاء المشغّل الطلب باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` قيمة `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القياسية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المُمررة استخدام `systemRunPlan` القياسي هذا كسياق الأمر/cwd/الجلسة المعتمد.
- إذا عدّل المستدعي `command` أو `rawCommand` أو `cwd` أو `agentId` أو `sessionKey` بين التحضير والتمرير النهائي المعتمد لـ `system.run`، يرفض Gateway التشغيل بدلاً من الوثوق بالحمولة المعدلة.

## احتياط تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: أهداف التسليم غير المحلولة أو الداخلية فقط تعيد `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما يتعذر حل أي مسار قابل للتسليم الخارجي (على سبيل المثال جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يُطلب التسليم، باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed` نفسها الموثقة لـ [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## تعيين الإصدارات

- يوجد `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم النطاقات التي لا تتضمن بروتوكوله الحالي. يتطلب العملاء والخوادم الحالية البروتوكول v4.
- تُولَّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه الافتراضات. القيم مستقرة عبر البروتوكول v4 وهي خط الأساس المتوقع للعملاء الخارجيين.

| الثابت                                    | الافتراضي                                             | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلة الطلب (لكل RPC)                     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعدادات/env رفع ميزانية الخادم/العميل المزدوجة) |
| تراجع إعادة الاتصال الأولي               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى تراجع لإعادة الاتصال                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم قيم `policy.tickIntervalMs` و`policy.maxPayload` و`policy.maxBufferedBytes` الفعّالة في `hello-ok`؛ ويجب أن يلتزم العملاء بهذه القيم بدلاً من الافتراضات السابقة للمصافحة.

## المصادقة

- يستخدم مصادقة Gateway بالسرّ المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المُكوَّن.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير المعتمدة على local loopback تستوفي فحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للمدخل الخاص مصادقة الاتصال بالسرّ المشترك
  بالكامل؛ لا تعرض هذا الوضع على مداخل عامة/غير موثوقة.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيَّدًا بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` وينبغي أن يحفظه
  العميل للاتصالات المستقبلية.
- ينبغي للعملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أن يعيد الاتصال باستخدام رمز الجهاز **المحفوظ** هذا أيضًا استخدام مجموعة النطاقات المعتمدة المحفوظة
  لذلك الرمز. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح بالفعل ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى
  نطاق ضمني أضيق مخصص للمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرَّر دائمًا عند ضبطه.
  - تُملأ `auth.token` وفق ترتيب الأولوية: الرمز المشترك الصريح أولاً،
    ثم `deviceToken` صريح، ثم رمز محفوظ لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق
    `auth.token`. يوقف الرمز المشترك أو أي رمز جهاز محلول إرساله.
  - الترقية التلقائية لرمز جهاز محفوظ عند إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة مقتصرة على **النقاط الطرفية الموثوقة فقط** —
    local loopback، أو `wss://` مع `tlsFingerprint` مثبَّت. لا يتأهل `wss://`
    العام بلا تثبيت.
- تُعيد تهيئة رمز الإعداد المدمجة رمز الجهاز للعقدة الأساسية
  `hello-ok.auth.deviceToken` بالإضافة إلى رمز مشغل محدود في
  `hello-ok.auth.deviceTokens` للتسليم الموثوق إلى الهاتف المحمول. يتضمن رمز المشغل
  `operator.talk.secrets` لقراءات إعداد Talk الأصلية
  ويستثني `operator.admin` و`operator.pairing`.
- بينما تنتظر تهيئة رمز إعداد غير أساسي الموافقة، تتضمن تفاصيل `PAIRING_REQUIRED`
  `recommendedNextStep: "wait_then_retry"` و`retryable: true`
  و`pauseReconnect: false`. ينبغي للعملاء مواصلة إعادة الاتصال باستخدام رمز
  التهيئة نفسه إلى أن تتم الموافقة على الطلب أو يصبح الرمز غير صالح.
- احفظ `hello-ok.auth.deviceTokens` فقط عندما يستخدم الاتصال مصادقة التهيئة
  عبر نقل موثوق مثل `wss://` أو الاقتران عبر loopback/local.
- إذا قدّم العميل `deviceToken` **صريحًا** أو `scopes` صريحة، فتبقى
  مجموعة النطاقات المطلوبة من ذلك المستدعي هي المرجع المعتمد؛ لا يُعاد استخدام النطاقات المخزنة مؤقتًا إلا
  عندما يعيد العميل استخدام الرمز المحفوظ لكل جهاز.
- يمكن تدوير/إلغاء رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`). يتطلب تدوير أو
  إلغاء رمز عقدة أو أي دور آخر غير المشغل `operator.admin` أيضًا.
- يعيد `device.token.rotate` بيانات وصفية للتدوير. لا يردّد رمز الحامل البديل
  إلا للنداءات من الجهاز نفسه التي سبق أن تمت مصادقتها باستخدام
  رمز ذلك الجهاز، بحيث يستطيع العملاء المعتمدون على الرمز فقط حفظ البديل قبل
  إعادة الاتصال. لا تردّد عمليات التدوير المشتركة/الإدارية رمز الحامل.
- يظل إصدار الرموز وتدويرها وإلغاؤها محدودًا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال الاقتران لذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع
  دور جهاز أو استهداف دور جهاز لم تمنحه موافقة الاقتران أصلًا.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضًا `operator.admin`: لا يستطيع المستدعون غير الإداريين إدارة إلا
  رمز المشغل لإدخال جهازهم **الخاص**. إدارة رموز العقد والأدوار الأخرى غير المشغلة
  مخصصة للمسؤول فقط، حتى لجهاز المستدعي نفسه.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضًا من مجموعة نطاقات رمز المشغل
  المستهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون غير الإداريين
  تدوير أو إلغاء رمز مشغل أوسع مما لديهم بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يجوز للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن مؤقتًا لكل جهاز.
  - إذا فشلت تلك المحاولة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات إجراء المشغل.
- يعني `AUTH_SCOPE_MISMATCH` أن رمز الجهاز تم التعرف عليه لكنه لا يغطي
  الدور/النطاقات المطلوبة. ينبغي ألا يعرض العملاء هذا كرمز سيئ؛
  اطلب من المشغل إعادة الاقتران أو الموافقة على عقد نطاق أضيق/أوسع.

## هوية الجهاز + الاقتران

- ينبغي للعُقد تضمين هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- يصدر Gateway الرموز لكل جهاز + دور.
- تكون موافقات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة التلقائية المحلية
  مفعلة.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضًا مسار اتصال ذاتي ضيق داخل الخلفية/الحاوية
  لتدفقات المساعد الموثوقة بالسرّ المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة لأغراض الاقتران
  وتتطلب الموافقة.
- يضمّن عملاء WS عادةً هوية `device` أثناء `connect` (المشغل +
  العقدة). استثناءات المشغل بلا جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن على localhost فقط.
  - مصادقة Control UI ناجحة للمشغل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر طوارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback من `gateway-client` على مسار المساعد الداخلي
    المحجوز.
- يترتب على حذف هوية الجهاز آثار على النطاق. عندما يُسمح لاتصال مشغل بلا جهاز
  عبر مسار ثقة صريح، لا يزال OpenClaw يمسح
  النطاقات المعلنة ذاتيًا إلى مجموعة فارغة ما لم يكن لذلك المسار استثناء
  مسمى لحفظ النطاق. عندها تفشل الطرق المحكومة بالنطاق مع
  `missing scope`.
- يُعد `gateway.controlUi.dangerouslyDisableDeviceAuth=true` مسار حفظ نطاق لكسر الطوارئ في Control UI.
  لا يمنح نطاقات لعملاء WebSocket خلفيين مخصصين أو على نمط CLI بشكل عشوائي.
- يحافظ مسار مساعد الخلفية المحجوز `gateway-client` المباشر عبر loopback
  على النطاقات فقط لاستدعاءات RPC الداخلية المحلية لمستوى التحكم؛ لا تتلقى معرّفات الخلفية المخصصة
  هذا الاستثناء.
- يجب أن توقّع جميع الاتصالات nonce `connect.challenge` المقدَّم من الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين لا يزالون يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقَّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية للجهاز المقترن
  لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يجوز للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة API الكاملة لـ Gateway** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، إلخ). يحدد السطح الدقيق
مخططات TypeBox في `packages/gateway-protocol/src/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
