---
read_when:
    - تنفيذ عملاء Gateway WS أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - جارٍ إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، الإطارات، تحديد الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-07-03T13:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم المفرد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعُقد iOS/Android، والعُقد بلا واجهة)
عبر WebSocket ويعلنون عن **الدور** + **النطاق** عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحدَّد إطارات ما قبل الاتصال بحد أقصى 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  الالتزام بحدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. ولا تحتفظ بجسم الرسالة
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

بينما لا يزال Gateway ينهي ملحقات بدء التشغيل الجانبية، يمكن لطلب `connect`
أن يُرجع خطأ `UNAVAILABLE` قابلًا لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية بدلًا من عرضها كفشل مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوبة في المخطط
(`packages/gateway-protocol/src/schema/frames.ts`). كذلك `auth` مطلوب ويبلّغ
عن الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL لأسطح Plugin محددة النطاق. يمكن للعُقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Plugin Canvas التجريبية
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين الحاليين وGateways
استخدام أسطح Plugin.

عندما لا يُصدر رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات loopback مباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس إقران CLI/الجهاز القديمة
من حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء منشأ المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الإقران وترقية النطاق العادية.

عندما يُصدر رمز جهاز، يتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

تمهيد QR/رمز الإعداد المدمج هو مسار تسليم جديد للهاتف المحمول. يعيد اتصال
رمز إعداد أساسي ناجح رمز عقدة أساسيًا بالإضافة إلى رمز مشغّل واحد محدود:

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

تسليم المشغّل محدود عمدًا بحيث يمكن لإعداد QR أن يبدأ
حلقة مشغّل الهاتف المحمول ويكمل الإعداد الأصلي دون منح نطاقات
تغيير الإقران أو `operator.admin`. ويتضمن `operator.talk.secrets` كي يتمكن
العميل الأصلي من قراءة تكوين Talk الذي يحتاجه بعد التمهيد. يتطلب الوصول الأوسع
للإقران والإدارة تدفق إقران مشغّل أو رمزًا منفصلًا وموافقًا عليه. ينبغي للعملاء الاحتفاظ بـ
`hello-ok.auth.deviceTokens` فقط
عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق مثل `wss://` أو
إقران loopback/محلي.

### مثال العقدة

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

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح عدم التكرار** (راجع المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاق المشغّل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغّل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
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
عند تضمين الأسرار، ينبغي للعملاء قراءة اعتماد موفّر Talk النشط
من `talk.resolved.config.apiKey`؛ يبقى `talk.providers.<id>.apiKey`
بشكل المصدر وقد يكون كائن SecretRef أو سلسلة منقحة.

قد تطلب أساليب Gateway RPC المسجلة بواسطة Plugin نطاق مشغّل خاصًا بها، لكن
بادئات إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
و`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الأسلوب هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي تُوصل عبر
`chat.send` فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب كتابات
`/config set` و`/config unset` الدائمة `operator.admin`.

يتضمن `node.pair.approve` أيضًا فحص نطاق إضافيًا وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر العقد غير التنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العقد عن مطالبات الإمكانات عند وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen`
  و`location` و`voice` و`talk`.
- `commands`: قائمة سماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` كي تتمكن واجهات المستخدم من إظهار صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغّلًا** و**عقدة** معًا.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تبلّغ العقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضًا الإبلاغ
  عن حضور خلفية دائم عندما يحدّث حدث عقدة موثوق بيانات تعريف الإقران الخاصة بها.

### حدث بقاء العقدة في الخلفية

يمكن للعقد استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون تعليمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبَّع سلاسل المشغّل غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائمًا فقط لجلسات أجهزة العقد
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

قد تظل Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك باعتباره
RPC مُقرًا به، لا باعتباره حفظًا دائمًا للحضور.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات نطاق بحيث لا تتلقى الجلسات محددة النطاق بالإقران أو الخاصة بالعقد فقط محتوى الجلسة بشكل سلبي.

- تتطلب **إطارات المحادثة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) `operator.read` على الأقل. تتجاوز الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تخضع **بثوث `plugin.*` المعرفة بواسطة Plugin** لبوابة `operator.write` أو `operator.admin`، بحسب كيفية تسجيلها بواسطة Plugin.
- تبقى **أحداث الحالة والنقل** (`heartbeat`، و`presence`، و`tick`، ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) غير مقيّدة كي تظل صحة النقل قابلة للمراقبة لكل جلسة مصادق عليها.
- تخضع **عائلات أحداث البث غير المعروفة** لبوابة النطاق افتراضيًا (إغلاق آمن) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص بكل عميل، بحيث تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة بالنطاق من مجرى الأحداث.

## عائلات أساليب RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست تفريغًا مولدًا — `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات أساليب
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتًا أو المفحوصة حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي الحديث والمحدود. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والعدادات، وأحجام البايتات، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. ولا يحتفظ بنصوص المحادثات، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يتطلب ذلك نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء المشغل ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` فهرس النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم منتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للفهرس الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام الموفر/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق تاريخ.
      مرّر `agentId` لوكيل واحد، أو `agentScope: "all"` لتجميع الوكلاء المكوّنين.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمين المخزن مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بموفر التضمين. يمكن للعملاء المدركين لـ Dreaming أيضًا تمرير `{ "agentId": "agent-id" }` لحصر إحصاءات مخزن Dreaming في مساحة عمل وكيل محددة؛ يؤدي حذف `agentId` إلى إبقاء الرجوع الاحتياطي للوكيل الافتراضي وتجميع مساحات عمل Dreaming المكوّنة.
    - تقبل `doctor.memory.dreamDiary` و`doctor.memory.backfillDreamDiary` و`doctor.memory.resetDreamDiary` و`doctor.memory.resetGroundedShortTerm` و`doctor.memory.repairDreamingArtifacts` و`doctor.memory.dedupeDreamDiary` معاملات اختيارية `{ "agentId": "agent-id" }` لعروض/إجراءات Dreaming الخاصة بالوكيل المحدد. عند حذف `agentId`، تعمل على مساحة عمل الوكيل الافتراضي المكوّنة.
    - يعيد `doctor.memory.remHarness` معاينة REM محدودة وللقراءة فقط لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحات العمل، ومقتطفات الذاكرة، وMarkdown مؤرضًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة. مرّر `agentId` لوكيل واحد
      أو `agentScope: "all"` لسرد الوكلاء المكوّنين معًا.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة والمجمعة.
    - يسجّل `channels.logout` خروج قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لموفر قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل الدخول QR/ويب ذلك، ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة اختبار APNs إلى Node iOS مسجل.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسالات المستهدفة إلى قناة/حساب/سلسلة خارج مشغل المحادثة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.catalog` فهرس موفري Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرفات الموفرين القياسية، والأسماء المستعارة في السجل، والتسميات، والحالة المكوّنة، ونتيجة `ready` اختيارية على مستوى المجموعة، ومعرفات النماذج/الأصوات المكشوفة، والأوضاع القياسية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية دون إعادة أسرار الموفر أو تعديل الإعدادات العامة. تضبط Gateways الحالية `ready` بعد تطبيق اختيار موفر وقت التشغيل؛ يجب على العملاء التعامل مع غيابها على أنه غير متحقق منه للتوافق مع Gateways الأقدم.
    - يعيد `talk.config` حمولة إعدادات Talk الفعلية؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - ينشئ `talk.session.create` جلسة Talk مملوكة لـ Gateway من أجل `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. بالنسبة إلى `stt-tts/managed-room`، يجب على مستدعي `operator.write` الذين يمررون `sessionKey` تمرير `spawnedBy` أيضًا لرؤية مفتاح الجلسة محددة النطاق؛ ويتطلب إنشاء `sessionKey` غير محدد النطاق و`brain: "direct-tools"` الصلاحية `operator.admin`.
    - يتحقق `talk.session.join` من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` عند الحاجة، ويعيد بيانات تعريف الغرفة/الجلسة بالإضافة إلى أحداث Talk الحديثة دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - يضيف `talk.session.appendAudio` صوت إدخال PCM مرمزًا بـ base64 إلى جلسات الترحيل الفوري والنسخ المملوكة لـ Gateway.
    - تقود `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة دور الغرفة المُدارة مع رفض الدور القديم قبل مسح الحالة.
    - يوقف `talk.session.cancelOutput` إخراج صوت المساعد، وذلك أساسًا للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - يكمل `talk.session.submitToolResult` استدعاء أداة موفر صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway. مرّر `options: { willContinue: true }` لمخرج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تلبي نتيجة الأداة استدعاء الموفر دون بدء استجابة مساعد فورية أخرى.
    - يرسل `talk.session.steer` تحكمًا صوتيًا لتشغيل نشط إلى جلسة Talk مدعومة بوكيل ومملوكة لـ Gateway. يقبل `{ sessionId, text, mode? }`، حيث يكون `mode` هو `status` أو `steer` أو `cancel` أو `followup`؛ ويُصنّف الوضع المحذوف من النص المنطوق.
    - يغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة لـ Gateway، ويصدر أحداث Talk نهائية.
    - يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.client.create` جلسة موفر فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما تملك Gateway الإعدادات، وبيانات الاعتماد، والتعليمات، وسياسة الأدوات.
    - يتيح `talk.client.toolCall` لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات الموفر إلى سياسة Gateway. الأداة المدعومة الأولى هي `openclaw_agent_consult`؛ يتلقى العملاء معرف تشغيل وينتظرون أحداث دورة حياة المحادثة العادية قبل إرسال نتيجة الأداة الخاصة بالموفر.
    - يرسل `talk.client.steer` تحكمًا صوتيًا لتشغيل نشط لوسائل النقل الفورية المملوكة للعميل. تحل Gateway التشغيل المضمن النشط من `sessionKey` وتعيد نتيجة مقبولة/مرفوضة منظمة بدلًا من إسقاط التوجيه بصمت.
    - `talk.event` هي قناة أحداث Talk الوحيدة للفورية، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، ومحولات الاجتماعات.
    - يركّب `talk.speak` الكلام عبر موفر كلام Talk النشط.
    - يعيد `tts.status` حالة تمكين TTS، والموفر النشط، والموفرين الاحتياطيين، وحالة إعدادات الموفر.
    - يعيد `tts.providers` مخزون موفري TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` موفر TTS المفضل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعدادات، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة الإعدادات الحالية والتجزئة.
    - يكتب `config.set` حمولة إعدادات متحققًا منها.
    - يدمج `config.patch` تحديث إعدادات جزئيًا. يتطلب استبدال المصفوفة
      الهدّام وجود المسار المتأثر في `replacePaths`؛ وتستخدم المصفوفات المتداخلة
      ضمن إدخالات المصفوفة مسارات `[]` مثل `agents.list[].skills`.
    - يتحقق `config.apply` من حمولة الإعدادات الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعدادات الحية المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات ونص المساعدة نفسيهما المستخدمين في واجهة المستخدم، بما في ذلك فروع الكائنات المتداخلة، والبدائل، وعناصر المصفوفات، وتركيبات `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار إعداد واحد: المسار الموحّد، وعقدة مخطط سطحية، وتلميحًا مطابقًا + `hintPath`، و`reloadKind` اختياريًا، وملخصات الأبناء المباشرين للتنقل التفصيلي في واجهة المستخدم/CLI. يكون `reloadKind` أحد `restart` أو `hot` أو `none` ويعكس مخطط إعادة تحميل إعدادات Gateway للمسار المطلوب. تحتفظ عقد مخطط البحث بوثائق المستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، و`reloadKind` اختياريًا، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` كي يستأنف بدء التشغيل دور وكيل متابعة واحدًا عبر طابور متابعة إعادة التشغيل. تستخدم تحديثات مدير الحزم وتحديثات git-checkout الخاضعة للإشراف من مستوى التحكم تسليمًا منفصلًا إلى خدمة مُدارة بدلًا من استبدال شجرة الحزمة أو تعديل مخرجات checkout/البناء داخل Gateway الحية. يعيد التسليم الذي بدأ `ok: true` مع `result.reason: "managed-service-handoff-started"` و`handoff.status: "started"`؛ أما التسليمات غير المتاحة أو الفاشلة فتعيد `ok: false` مع `managed-service-handoff-unavailable` أو `managed-service-handoff-failed`، بالإضافة إلى `handoff.command` عندما يكون تحديث الصدفة اليدوي مطلوبًا. يعني التسليم غير المتاح أن OpenClaw يفتقر إلى حد مشرف آمن أو هوية خدمة متينة، مثل `OPENCLAW_SYSTEMD_UNIT` لـ systemd. أثناء التسليم الذي بدأ، قد يبلغ مؤشر إعادة التشغيل مؤقتًا `stats.reason: "restart-health-pending"`؛ وتُؤخر المتابعة حتى يتحقق CLI من Gateway المعاد تشغيلها ويكتب مؤشر `ok` النهائي.
    - يحدّث `update.status` ويعيد أحدث مؤشر إعادة تشغيل للتحديث، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عند توفره.
    - تكشف `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج التهيئة عبر WS RPC.

  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعّال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة للوكيل.
    - تعرض `tasks.list` و`tasks.get` و`tasks.cancel` سجل مهام Gateway لعملاء SDK والمشغّلين.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات العناصر الناتجة والتنزيلات المشتقة من السجل النصي لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة على جانب الخادم، ولا تعيد إلا وسائط السجل النصي ذات المصدر المطابق؛ أما مصادر URL غير الآمنة أو المحلية فتعيد تنزيلات غير مدعومة بدلا من الجلب على جانب الخادم.
    - تعرض `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية والعقد للقراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعّالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="Session control">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عند تهيئة خلفية وقت تشغيل وكيل.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث السجل النصي/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات سجل نصي محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحدا لمفتاح جلسة مطابق تماما.
    - يحل `sessions.resolve` هدف جلسة أو يحوله إلى الشكل القانوني.
    - ينشئ `sessions.create` إدخال جلسة جديدا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - يمثل `sessions.steer` صيغة المقاطعة والتوجيه لجلسة نشطة.
    - يجهض `sessions.abort` العمل النشط لجلسة. يمكن للمتصل تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف الجلسة/التجاوزات ويبلغ عن النموذج القانوني المحلول إضافة إلى `agentRuntime` الفعّال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - يعيد `sessions.get` صف الجلسة المخزن كاملا.
    - لا يزال تنفيذ المحادثة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء واجهة المستخدم: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML النصية العادية لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاءات الأدوات المقتطعة) ورموز التحكم بالنموذج المسرّبة ASCII/كاملة العرض، وتحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تماما، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
    - `chat.message.get` هو قارئ الرسالة الكاملة المحدود والإضافي لإدخال سجل نصي مرئي واحد. يمرر العملاء `sessionKey`، و`agentId` اختياري عند كون اختيار الجلسة محددا بالوكيل، إضافة إلى `messageId` لسجل نصي سبق عرضه عبر `chat.history`، ويعيد Gateway الإسقاط نفسه المطبع للعرض من دون سقف الاقتطاع الخفيف الخاص بالسجل عندما يظل الإدخال المخزن متاحا وغير كبير الحجم.
    - يقبل `chat.send` قيمة `fastMode: "auto"` لدورة واحدة لاستخدام الوضع السريع لاستدعاءات النموذج التي تبدأ قبل حد القطع التلقائي، ثم بدء استدعاءات إعادة المحاولة اللاحقة أو الرجوع الاحتياطي أو نتائج الأدوات أو المتابعة من دون الوضع السريع. القيمة الافتراضية لحد القطع هي 60 ثانية، ويمكن تهيئتها لكل نموذج باستخدام `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. يمكن لمتصل `chat.send` تمرير `fastAutoOnSeconds` لدورة واحدة لتجاوز حد القطع لذلك الطلب.

  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلّقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.
    - يبطل `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.

  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران العقد والتحقق من التمهيد.
    - تعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية عقدة مقترنة.
    - يمرر `node.invoke` أمرا إلى عقدة متصلة.
    - يعيد `node.invoke.result` النتيجة لطلب استدعاء.
    - ينقل `node.event` الأحداث الصادرة من العقدة مرة أخرى إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور العقدة المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلّق الدائم للعقد غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="Approval families">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec أحادية الاستخدام إضافة إلى البحث/إعادة التشغيل للموافقات المعلّقة.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلّقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية للعقدة عبر أوامر ترحيل العقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرّفة من Plugin.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - الأتمتة: يجدول `wake` حقن نص إيقاظ فوري أو عند Heartbeat التالي؛ وتدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - يظل `cron.run` استدعاء RPC بأسلوب الإدراج في الطابور للتشغيلات اليدوية. على العملاء الذين يحتاجون إلى دلالات الاكتمال قراءة `runId` المعاد واستطلاع `cron.runs`.
    - يقبل `cron.runs` مرشح `runId` اختياريا وغير فارغ كي يتمكن العملاء من متابعة تشغيل يدوي واحد في الطابور من دون التسابق مع إدخالات سجل أخرى للمهمة نفسها.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات محادثة واجهة المستخدم مثل `chat.inject` وأحداث المحادثة الأخرى الخاصة بالسجل النصي فقط. في البروتوكول v4، تحمل حمولات الفروق `deltaText`؛ وتبقى `message` لقطة المساعد التراكمية. تضبط الاستبدالات التي ليست بادئة `replace=true` وتستخدم `deltaText` كنص الاستبدال.
- `session.message` و`session.operation` و`session.tool`: تحديثات السجل النصي، وعملية الجلسة الجارية، وتدفق الأحداث لجلسة مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بيانات التعريف.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق حدث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب استدعاء عقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّرت تهيئة مشغل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرائق مساعدة Node

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية للمهارات من أجل فحوصات السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغّلين فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر استدعاءات RPC لسجل المهام. تعيد هذه الطرائق ملخصات مهام منقّاة، لا حالة وقت التشغيل الخام.

- يتطلب `tasks.list` الإذن `operator.read`.
  - المعاملات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من هذه الحالات، و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى `500`، وسلسلة `cursor` اختيارية.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` الإذن `operator.read`.
  - المعاملات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرّفات المهام المفقودة شكل خطأ غير موجود الخاص بـ Gateway.
- يتطلب `tasks.cancel` الإذن `operator.write`.
  - المعاملات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يبلّغ `found` عما إذا كان السجل يحتوي على مهمة مطابقة. يبلّغ `cancelled` عما إذا كان وقت التشغيل قد قبل الإلغاء أو سجله.

يتضمن `TaskSummary` الحقول `id` و`status` وبيانات تعريف اختيارية مثل `kind` و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey` و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية والتقدم والملخص النهائي ونص الخطأ المنقّى. يحدد `agentId` الوكيل المنفذ للمهمة؛ ويحافظ `sessionKey` و`ownerKey` على سياق الطالب والتحكم.

### طرائق مساعدة للمشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي بدون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضيان الأسماء الأصلية الواعية بالمزوّد
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة مائلة دقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية بالإضافة إلى توفر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة على جهة الخادم بدلاً من قبول سياق المصادقة أو التسليم المقدم من المستدعي.
  - الاستجابة هي إسقاط مشتق من الخادم ومحدّد بنطاق الجلسة للمخزون النشط،
    بما في ذلك أدوات النواة وPlugin والقناة وأدوات خادم MCP المكتشفة مسبقًا.
  - `tools.effective` للقراءة فقط بالنسبة إلى MCP: قد يسقط كتالوج MCP لجلسة دافئة عبر سياسة الأدوات النهائية، لكنه لا ينشئ أوقات تشغيل MCP، ولا يربط وسائل النقل، ولا يصدر `tools/list`. إذا لم يوجد كتالوج دافئ مطابق، فقد تتضمن الاستجابة إشعارًا مثل `mcp-not-yet-connected` أو `mcp-not-yet-listed` أو `mcp-stale-catalog`.
  - تستخدم إدخالات الأدوات الفعّالة `source="core"` أو `source="plugin"` أو `source="channel"` أو
    `source="mcp"`.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة متاحة واحدة عبر مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا وُجد كل من `sessionKey` و`agentId`، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - تتطلب مغلفات النواة المخصصة للمالك فقط مثل `cron` و`gateway` و`nodes`
    هوية مالك/مسؤول (`operator.admin`) رغم أن طريقة `tools.invoke`
    نفسها هي `operator.write`.
  - الاستجابة هي غلاف موجه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` مطبوعة. تعيد رفضات الموافقة أو السياسة `ok:false` في الحمولة بدلاً من
    تجاوز خط أنابيب سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات الناقصة، وفحوصات الإعدادات، وخيارات التثبيت المنقحة بدون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) لبيانات تعريف اكتشاف ClawHub.
- يمكن للمشغّلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) لتجهيز أرشيف مهارة خاص قبل تثبيته. هذا مسار رفع إداري منفصل للعملاء الموثوقين، وليس تدفق تثبيت مهارة ClawHub العادي، وهو معطّل افتراضيًا ما لم يتم تمكين
  `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    رفعًا مرتبطًا بذلك المعرّف والقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` البايتات عند
    الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. لا يؤدي الاعتماد إلا إلى إنهاء الرفع؛ ولا يثبت المهارة.
  - أرشيفات المهارات المرفوعة هي أرشيفات zip تحتوي على جذر `SKILL.md`. لا يحدد اسم الدليل الداخلي للأرشيف هدف التثبيت أبدًا.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد مهارة في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع الرفع: يثبت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    رفعًا معتمدًا في دليل `skills/<slug>` لمساحة عمل الوكيل الافتراضية. يجب أن يطابق المعرّف وقيمة force طلب
    `skills.upload.begin` الأصلي. يُرفض هذا الوضع ما لم يتم تمكين
    `skills.install.allowUploadedArchives`. لا يؤثر الإعداد في تثبيتات ClawHub.
  - وضع مثبت Gateway: يشغّل `{ name, installId, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلنًا على مضيف Gateway.
    قد يظل العملاء الأقدم يرسلون `dangerouslyForceUnsafeInstall`؛ هذا الحقل
    مهمل، ومقبول فقط لتوافق البروتوكول، ويتم تجاهله. استخدم
    `security.installPolicy` لقرارات التثبيت المملوكة للمشغّل.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub معرّفًا متعقبًا واحدًا أو كل تثبيتات ClawHub المتعقبة في
    مساحة عمل الوكيل الافتراضية.
  - يصحّح وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معامل `view` اختياريًا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مهيّأ، تكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكيًا لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` مهيّأ، فإنه يظل هو الغالب، بما في ذلك الاكتشاف المحدد بنطاق المزوّد لإدخالات `provider/*`. بدون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مهيأة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway `exec.approval.requested`.
- يحل عملاء المشغّل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القانونية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` القانوني هذا بوصفه سياق الأمر/cwd/الجلسة الموثوق.
- إذا عدّل مستدعٍ `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي الموافق عليه إلى `system.run`، يرفض
  Gateway التشغيل بدلاً من الوثوق بالحمولة المعدّلة.

## احتياطي تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى تنفيذ خاص بالجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات internal/webchat أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يُطلب التسليم،
  باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed` نفسها
  الموثقة لـ [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## تحديد الإصدارات

- يوجد `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ يرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي. يتطلب العملاء والخوادم الحاليون
  البروتوكول v4.
- تُولّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر البروتوكول v4 وهي الأساس المتوقع للعملاء الخارجيين.

| الثابت                                    | الافتراضي                                             | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلة الطلب (لكل RPC)                     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال      | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/البيئة رفع ميزانية الخادم/العميل المقترنة) |
| تراجع إعادة الاتصال الأولي               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتراجع إعادة الاتصال          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| تثبيت إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة الإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم القيم الفعّالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ يجب على العملاء احترام تلك القيم
بدلاً من القيم الافتراضية قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسرّ المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المضبوط.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` تفي بفحص مصادقة الاتصال من
  ترويسات الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للدخول الخاص مصادقة الاتصال بالسرّ
  المشترك بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محدودا بدور الاتصال + النطاقات.
  ويعاد في `hello-ok.auth.deviceToken` وينبغي للعميل حفظه للاتصالات المستقبلية.
- ينبغي للعملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي اتصال ناجح.
- ينبغي أن يعيد الاتصال بذلك الرمز **المحفوظ** للجهاز استخدام مجموعة النطاقات
  المعتمدة والمحفوظة لذلك الرمز أيضا. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح سابقا، ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى نطاق ضمني أضيق
  مخصص للمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائما عند ضبطه.
  - يُملأ `auth.token` بترتيب أولوية: الرمز المشترك الصريح أولا،
    ثم `deviceToken` صريح، ثم رمز محفوظ لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أي مما سبق
    `auth.token`. وجود رمز مشترك أو أي رمز جهاز محلول يمنع إرساله.
  - تخضع الترقية التلقائية لرمز جهاز محفوظ عند إعادة المحاولة لمرة واحدة بسبب
    `AUTH_TOKEN_MISMATCH` إلى **النقاط الطرفية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام دون تثبيت.
- يعيد تمهيد رمز الإعداد المدمج رمز الجهاز الأساسي لـ Node
  `hello-ok.auth.deviceToken` إضافة إلى رمز مشغّل محدود في
  `hello-ok.auth.deviceTokens` للتسليم الموثوق إلى الهاتف المحمول. يتضمن رمز
  المشغّل `operator.talk.secrets` لقراءات إعداد Talk الأصلية، لكنه يستثني
  نطاقات تعديل الاقتران و`operator.admin`.
- أثناء انتظار تمهيد رمز إعداد غير أساسي للموافقة، تتضمن تفاصيل `PAIRING_REQUIRED`
  `recommendedNextStep: "wait_then_retry"` و`retryable: true`
  و`pauseReconnect: false`. ينبغي للعملاء مواصلة إعادة الاتصال باستخدام رمز
  التمهيد نفسه إلى أن تتم الموافقة على الطلب أو يصبح الرمز غير صالح.
- احفظ `hello-ok.auth.deviceTokens` فقط عندما يستخدم الاتصال مصادقة التمهيد
  على نقل موثوق مثل `wss://` أو الاقتران عبر loopback/local.
- إذا قدم العميل `deviceToken` **صريحا** أو `scopes` صريحة، فتبقى مجموعة
  النطاقات التي طلبها المستدعي هي المرجع الحاسم؛ لا تُعاد استخدام النطاقات
  المخزنة مؤقتا إلا عندما يعيد العميل استخدام الرمز المحفوظ لكل جهاز.
- يمكن تدوير/إلغاء رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`). ويتطلب تدوير أو
  إلغاء رمز Node أو أي دور آخر غير مشغّل `operator.admin` أيضا.
- يعيد `device.token.rotate` بيانات وصفية للتدوير. ولا يعكس رمز الحامل البديل
  إلا لاستدعاءات الجهاز نفسه التي صودق عليها مسبقا بذلك الرمز، كي يتمكن
  عملاء الرمز فقط من حفظ البديل قبل إعادة الاتصال. لا تعكس تدويرات
  المشترك/المسؤول رمز الحامل.
- يظل إصدار الرموز وتدويرها وإلغاؤها محدودا بمجموعة الأدوار المعتمدة المسجلة
  في إدخال اقتران ذلك الجهاز؛ ولا يمكن لتعديل الرمز توسيع دور جهاز أو استهداف
  دور لم تمنحه موافقة الاقتران قط.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز محددة ذاتيا ما لم يكن لدى
  المستدعي `operator.admin` أيضا: يستطيع المستدعون غير المسؤولين إدارة رمز
  المشغّل فقط لإدخال جهازهم **الخاص**. إدارة رموز Node وغيرها من الرموز غير
  الخاصة بالمشغّل مخصصة للمسؤولين فقط، حتى لجهاز المستدعي نفسه.
- يفحص `device.token.rotate` و`device.token.revoke` أيضا مجموعة نطاقات رمز
  المشغّل المستهدف مقابل نطاقات جلسة المستدعي الحالية. لا يمكن للمستدعين غير
  المسؤولين تدوير أو إلغاء رمز مشغّل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - قد يحاول العملاء الموثوقون إعادة محاولة واحدة محدودة باستخدام رمز مخزن مؤقتا لكل جهاز.
  - إذا فشلت تلك المحاولة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء المشغّل.
- يعني `AUTH_SCOPE_MISMATCH` أن رمز الجهاز تم التعرف عليه لكنه لا يغطي
  الدور/النطاقات المطلوبة. ينبغي ألا يعرض العملاء هذا على أنه رمز سيئ؛
  اطلب من المشغّل إعادة الاقتران أو اعتماد عقد نطاق أضيق/أوسع.

## هوية الجهاز + الاقتران

- ينبغي أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزا لكل جهاز + دور.
- تكون موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم يتم تمكين
  الموافقة التلقائية المحلية.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضا مسار اتصال ذاتي ضيق محلي للواجهة الخلفية/الحاوية
  لتدفقات المساعد الموثوقة ذات السرّ المشترك.
- لا تزال اتصالات tailnet على المضيف نفسه أو اتصالات LAN تُعامل كاتصالات
  بعيدة لأغراض الاقتران وتتطلب الموافقة.
- عادة ما يضمّن عملاء WS هوية `device` أثناء `connect` (المشغّل +
  Node). الاستثناءات الوحيدة للمشغّل بلا جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن المحلي فقط.
  - مصادقة Control UI ناجحة للمشغّل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (حل طارئ، تخفيض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback من `gateway-client` على مسار
    المساعد الداخلي المحجوز.
- حذف هوية الجهاز له تبعات على النطاق. عندما يُسمح باتصال مشغّل بلا جهاز
  عبر مسار ثقة صريح، لا يزال OpenClaw يمسح النطاقات المعلنة ذاتيا إلى مجموعة
  فارغة ما لم يكن لذلك المسار استثناء مسمى يحافظ على النطاق. بعد ذلك تفشل
  الطرق المحكومة بالنطاق مع `missing scope`.
- يمثل `gateway.controlUi.dangerouslyDisableDeviceAuth=true` مسار حفاظ على
  النطاق للطوارئ في Control UI. ولا يمنح نطاقات لعملاء WebSocket الخلفيين
  المخصصين أو المشابهين لـ CLI عشوائيا.
- يحافظ مسار مساعد الواجهة الخلفية المحجوز والمباشر عبر loopback في
  `gateway-client` على النطاقات فقط لاستدعاءات RPC الداخلية المحلية لمستوى
  التحكم؛ ولا تحصل معرفات الواجهة الخلفية المخصصة على هذا الاستثناء.
- يجب أن توقع كل الاتصالات قيمة nonce الخاصة بـ `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدماء الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام.         |

هدف الترحيل:

- انتظر دائما `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، والتي تربط `platform` و`deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للجهاز المقترن لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريا تثبيت بصمة شهادة Gateway (انظر إعداد `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة API الكاملة لـ Gateway** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، وNodes، والموافقات، وغير ذلك). يحدد السطح الدقيق بواسطة
مخططات TypeBox في `packages/gateway-protocol/src/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
