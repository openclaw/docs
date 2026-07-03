---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو حالات فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، الإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-07-03T09:39:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم + نقل العُقدة الوحيد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة ويب، تطبيق macOS، عُقد iOS/Android، العُقد
عديمة الواجهة) عبر WebSocket ويعلنون **الدور** + **النطاق** وقت
المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحد إطارات ما قبل الاتصال بـ 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم ومخازن الإرسال البطيئة أحداث `payload.large`
  قبل أن يغلق الـ gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
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

بينما لا يزال Gateway ينهي تشغيل المكونات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
أن يُرجع خطأ `UNAVAILABLE` قابلًا لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلًا من عرضها كفشل مصافحة
نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوب في المخطط
(`packages/gateway-protocol/src/schema/frames.ts`). كذلك `auth` مطلوب ويعرض
الدور/النطاقات التي جرى التفاوض عليها. `pluginSurfaceUrls` اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL الخاصة بأسطح Plugin المحددة النطاق. يمكن للعُقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Plugin Canvas التجريبية
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين الحاليين
والـ gateways استخدام أسطح Plugin.

عندما لا يُصدر رمز جهاز، يعرض `hello-ok.auth` الأذونات المتفاوض عليها
دون حقول رموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الواجهة الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم ويحافظ على خطوط أساس اقتران CLI/الجهاز القديمة من
حظر عمل الواجهة الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العُقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الاقتران وترقية النطاق العادية.

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

تمهيد QR/رمز الإعداد المدمج هو مسار تسليم جوال جديد. يُرجع اتصال
رمز إعداد أساسي ناجح رمز عُقدة أساسيًا بالإضافة إلى رمز مشغل واحد محدود:

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

تسليم المشغل محدود عمدًا بحيث يمكن لإعداد QR بدء
حلقة المشغل على الجوال دون منح `operator.admin` أو `operator.pairing`.
وهو يتضمن `operator.talk.secrets` كي يستطيع العميل الأصلي قراءة إعدادات Talk
التي يحتاجها بعد التمهيد. تتطلب نطاقات الإدارة والاقتران الأوسع
تدفق اقتران مشغل أو رمزًا منفصلًا ومعتمدًا. ينبغي للعملاء الاحتفاظ بـ
`hello-ok.auth.deviceTokens` فقط
عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق مثل `wss://` أو
اقتران loopback/local.

### مثال عُقدة

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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (انظر المخطط).

## الأدوار + النطاقات

للنموذج الكامل لنطاقات المشغل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف قدرات (camera/screen/canvas/system.run).

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
عند تضمين الأسرار، ينبغي للعملاء قراءة بيانات اعتماد موفر Talk النشط
من `talk.resolved.config.apiKey`؛ يبقى `talk.providers.<id>.apiKey`
بشكل المصدر وقد يكون كائن SecretRef أو سلسلة منقحة.

قد تطلب طرق RPC في gateway المسجلة بواسطة Plugin نطاق مشغل خاصًا بها، لكن
بادئات إدارة النواة المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
و`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` المستمرة `operator.admin`.

يحتوي `node.pair.approve` أيضًا على فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- طلبات بلا أوامر: `operator.pairing`
- طلبات مع أوامر عُقدة غير تنفيذية: `operator.pairing` + `operator.write`
- طلبات تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (العُقدة)

تعلن العُقد ادعاءات القدرات وقت الاتصال:

- `caps`: فئات قدرات عالية المستوى مثل `camera` و`canvas` و`screen`
  و`location` و`voice` و`talk`.
- `commands`: قائمة السماح للأوامر عند الاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **ادعاءات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` كي تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلًا** و**عُقدة** معًا.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تعرض العُقد المتصلة
  وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ كما يمكن للعُقد المقترنة عرض
  حضور خلفي دائم عندما يحدّث حدث عُقدة موثوق بيانات تعريف الاقتران الخاصة بها.

### حدث بقاء العُقدة في الخلفية

يمكن للعُقد استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن عُقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون تمييزها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغل غير المعروفة إلى
`background` بواسطة gateway قبل الحفظ. يكون الحدث دائمًا فقط لجلسات جهاز عُقدة
مصادق عليها؛ أما الجلسات بلا جهاز أو غير المقترنة فتعيد `handled: false`.

تعيد الـ gateways الناجحة نتيجة مهيكلة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد تستمر الـ gateways الأقدم في إعادة `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك على أنه
استدعاء RPC مُقر به، وليس حفظًا دائمًا للحضور.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم للنطاقات بحيث لا تتلقى الجلسات محددة الاقتران أو الخاصة بالعُقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب `operator.read` على الأقل. تتجاوز الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **عمليات بث `plugin.*` المعرّفة من Plugin** محكومة بـ `operator.write` أو `operator.admin`، بحسب كيفية تسجيلها بواسطة Plugin.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، إلخ) تبقى غير مقيدة كي تظل صحة النقل قابلة للمراقبة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تكون محكومة بالنطاق افتراضيًا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل، بحيث تحافظ عمليات البث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى العملاء المختلفون مجموعات فرعية مختلفة مفلترة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغًا مولدًا — `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى
صادرات طرق Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتًا أو التي تم فحصها حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الأخير. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرّفات الجلسات. ولا يحتفظ بنصوص الدردشة، أو نصوص Webhook، أو مخرجات الأدوات، أو نصوص الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يلزم نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بأسلوب `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء المشغلين ضمن نطاق المسؤول.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها في وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المهيأة بحجم مناسب للاختيار (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
      مرّر `agentId` لوكيل واحد، أو `agentScope: "all"` لتجميع الوكلاء المهيئين.
    - يعيد `doctor.memory.status` جاهزية الذاكرة المتجهية / التضمين المخزن مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال حيًا بمزوّد التضمين. يمكن للعملاء المدركين لـ Dreaming أيضًا تمرير `{ "agentId": "agent-id" }` لحصر إحصاءات مخزن Dreaming في مساحة عمل وكيل محددة؛ ويؤدي حذف `agentId` إلى إبقاء الرجوع إلى الوكيل الافتراضي وتجميع مساحات عمل Dreaming المهيأة.
    - تقبل `doctor.memory.dreamDiary` و`doctor.memory.backfillDreamDiary` و`doctor.memory.resetDreamDiary` و`doctor.memory.resetGroundedShortTerm` و`doctor.memory.repairDreamingArtifacts` و`doctor.memory.dedupeDreamDiary` معاملات اختيارية `{ "agentId": "agent-id" }` لطرق عرض/إجراءات Dreaming الخاصة بالوكيل المحدد. عند حذف `agentId`، تعمل على مساحة عمل الوكيل الافتراضي المهيأ.
    - يعيد `doctor.memory.remHarness` معاينة محدودة للقراءة فقط لحزمة REM لعملاء مستوى التحكم البعيد. يمكن أن يتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤسسًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة. مرّر `agentId` لوكيل واحد،
      أو `agentScope: "all"` لسرد الوكلاء المهيئين معًا.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة + المرفقة.
    - يسجّل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` إشعار APNs تجريبيًا إلى Node iOS مسجل.
    - يعيد `voicewake.get` محفزات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرساليات الموجهة إلى قناة/حساب/سلسلة خارج مشغل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملفات Gateway المهيأ مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايت.

  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.catalog` كتالوج مزوّدي Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. ويتضمن معرّفات المزوّدين الرسمية، وأسماء السجل البديلة، والتسميات، وحالة التهيئة، ونتيجة `ready` اختيارية على مستوى المجموعة، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع الرسمية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية من دون إعادة أسرار المزوّد أو تعديل التكوين العام. تعيّن Gateways الحالية `ready` بعد تطبيق اختيار مزوّد وقت التشغيل؛ ويجب على العملاء التعامل مع غيابها باعتباره غير متحقق منه للتوافق مع Gateways الأقدم.
    - يعيد `talk.config` حمولة تكوين Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - ينشئ `talk.session.create` جلسة Talk مملوكة لـ Gateway من أجل `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. بالنسبة إلى `stt-tts/managed-room`، يجب على مستدعي `operator.write` الذين يمررون `sessionKey` تمرير `spawnedBy` أيضًا لرؤية مفتاح الجلسة ضمن النطاق؛ ويتطلب إنشاء `sessionKey` غير محدد النطاق و`brain: "direct-tools"` الصلاحية `operator.admin`.
    - يتحقق `talk.session.join` من رمز جلسة الغرفة المُدارة، ويصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، ويعيد بيانات تعريف الغرفة/الجلسة بالإضافة إلى أحداث Talk الأخيرة من دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - يضيف `talk.session.appendAudio` صوت إدخال PCM مرمزًا بـ base64 إلى جلسات الترحيل الفوري والنسخ المملوكة لـ Gateway.
    - تقود `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة الدور في الغرفة المُدارة مع رفض الدور القديم قبل مسح الحالة.
    - يوقف `talk.session.cancelOutput` خرج صوت المساعد، أساسًا للمقاطعة المقيّدة بـ VAD في جلسات ترحيل Gateway.
    - يكمل `talk.session.submitToolResult` استدعاء أداة مزوّد صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway. مرّر `options: { willContinue: true }` لخرج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تفي نتيجة الأداة باستدعاء المزوّد من دون بدء استجابة مساعد فورية أخرى.
    - يرسل `talk.session.steer` تحكمًا صوتيًا للتشغيل النشط إلى جلسة Talk مدعومة بوكيل ومملوكة لـ Gateway. يقبل `{ sessionId, text, mode? }`، حيث يكون `mode` هو `status` أو `steer` أو `cancel` أو `followup`؛ ويُصنّف الوضع المحذوف من النص المنطوق.
    - يغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة لـ Gateway ويصدر أحداث Talk نهائية.
    - يعيّن/يبث `talk.mode` حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - ينشئ `talk.client.create` جلسة مزوّد فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما تملك Gateway التكوين، وبيانات الاعتماد، والتعليمات، وسياسة الأدوات.
    - يتيح `talk.client.toolCall` لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. أول أداة مدعومة هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - يرسل `talk.client.steer` تحكمًا صوتيًا للتشغيل النشط لوسائل النقل الفورية المملوكة للعميل. تحل Gateway التشغيل المضمّن النشط من `sessionKey` وتعيد نتيجة منظمة مقبولة/مرفوضة بدلًا من إسقاط التوجيه بصمت.
    - `talk.event` هي قناة أحداث Talk الوحيدة للفوري، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، ومحوّلات الاجتماعات.
    - يصطنع `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تمكين TTS، والمزوّد النشط، ومزوّدي الرجوع، وحالة تكوين المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويل نص إلى كلام لمرة واحدة.

  </Accordion>

  <Accordion title="الأسرار، والتكوين، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار الموجهة إلى الأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة التكوين الحالية والتجزئة.
    - يكتب `config.set` حمولة تكوين تم التحقق منها.
    - يدمج `config.patch` تحديث تكوين جزئيًا. يتطلب استبدال المصفوفة
      الهدّام المسار المتأثر في `replacePaths`؛ وتستخدم المصفوفات المتداخلة
      تحت إدخالات المصفوفة مسارات `[]` مثل `agents.list[].skills`.
    - يتحقق `config.apply` من حمولة التكوين الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط التكوين الحي المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخططات Plugin + القنوات عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات نفسها ونص المساعدة المستخدمين في واجهة المستخدم، بما في ذلك الكائنات المتداخلة، وحرف البدل، وعنصر المصفوفة، وفروع تركيب `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقل مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار تكوين واحد: المسار الموحّد، وعقدة مخطط سطحية، وتلميح مطابق + `hintPath`، و`reloadKind` اختياري، وملخصات الأبناء المباشرين للتنقل التفصيلي في UI/CLI. يكون `reloadKind` واحدًا من `restart` أو `hot` أو `none` ويعكس مخطط إعادة تحميل تكوين Gateway للمسار المطلوب. تحتفظ عقد مخطط البحث بوثائق المستخدم وحقول التحقق الشائعة (`title` و`description` و`type` و`enum` و`const` و`format` و`pattern` وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، و`reloadKind` الاختياري، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة التشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` حتى يستأنف بدء التشغيل دور وكيل متابعة واحدًا عبر قائمة انتظار متابعة إعادة التشغيل. تستخدم تحديثات مدير الحزم وتحديثات git-checkout الخاضعة للإشراف من مستوى التحكم تسليمًا منفصلًا لخدمة مُدارة بدلًا من استبدال شجرة الحزمة أو تعديل خرج checkout/البناء داخل Gateway الحي. يعيد التسليم الذي بدأ `ok: true` مع `result.reason: "managed-service-handoff-started"` و`handoff.status: "started"`؛ وتعيد التسليمات غير المتاحة أو الفاشلة `ok: false` مع `managed-service-handoff-unavailable` أو `managed-service-handoff-failed`، بالإضافة إلى `handoff.command` عندما يكون تحديث shell يدويًا مطلوبًا. يعني التسليم غير المتاح أن OpenClaw يفتقر إلى حد مشرف آمن أو هوية خدمة دائمة، مثل `OPENCLAW_SYSTEMD_UNIT` لـ systemd. أثناء التسليم الذي بدأ، قد يبلّغ مؤشر إعادة التشغيل لفترة وجيزة عن `stats.reason: "restart-health-pending"`؛ وتؤخَّر المتابعة حتى يتحقق CLI من Gateway المعاد تشغيله ويكتب مؤشر `ok` النهائي.
    - يحدّث `update.status` ويعيد أحدث مؤشر لإعادة تشغيل التحديث، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عند توفره.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المهيأة، بما في ذلك النموذج الفعّال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة للوكيل.
    - تعرض `tasks.list` و`tasks.get` و`tasks.cancel` سجل مهام Gateway لعملاء SDK والمشغّل.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات العناصر الناتجة من سجل المحادثة وتنزيلاتها لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تستنتج استعلامات التشغيل والمهام الجلسة المالكة من جهة الخادم ولا تعيد إلا وسائط سجل المحادثة ذات المصدر المطابق؛ مصادر URL غير الآمنة أو المحلية تعيد تنزيلات غير مدعومة بدلا من جلبها من جهة الخادم.
    - تعرض `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية وNode بصلاحية القراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعّالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عند تهيئة خلفية وقت تشغيل وكيل.
    - يبدل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسات لعميل WS الحالي.
    - يبدل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث سجل المحادثة/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات محدودة لسجل المحادثة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحدا لمفتاح جلسة مطابق تماما.
    - يحل `sessions.resolve` هدف جلسة أو يجعله قانونيا.
    - ينشئ `sessions.create` إدخال جلسة جديدا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يلغي `sessions.abort` العمل النشط لجلسة. يمكن للمتصل تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway ربطها بجلسة.
    - يحدث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلغ عن النموذج القانوني المحلول إضافة إلى `agentRuntime` الفعّال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزن بالكامل.
    - ما زال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء الواجهة: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج ASCII/كاملة العرض المسرّبة، وتحذف صفوف المساعد ذات الرموز الصامتة البحتة مثل `NO_REPLY` / `no_reply` المطابقة تماما، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
    - `chat.message.get` هو قارئ الرسالة الكاملة المحدود الإضافي لإدخال واحد مرئي في سجل المحادثة. يمرر العملاء `sessionKey`، و`agentId` اختياريا عندما يكون اختيار الجلسة مقيدا بوكيل، إضافة إلى `messageId` من سجل المحادثة سبق عرضه عبر `chat.history`، ويعيد Gateway إسقاط العرض المطبع نفسه من دون حد الاقتطاع الخفيف لتاريخ الدردشة عندما يظل الإدخال المخزن متاحا وليس كبير الحجم.
    - يقبل `chat.send` قيمة `fastMode: "auto"` لدورة واحدة لاستخدام الوضع السريع لاستدعاءات النموذج التي بدأت قبل حد الإيقاف التلقائي، ثم بدء استدعاءات إعادة المحاولة أو الرجوع الاحتياطي أو نتائج الأدوات أو المتابعة اللاحقة من دون الوضع السريع. القيمة الافتراضية للحد هي 60 ثانية ويمكن تهيئتها لكل نموذج باستخدام `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. يمكن لمتصل `chat.send` تمرير `fastAutoOnSeconds` لدورة واحدة لتجاوز الحد لذلك الطلب.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.
    - يلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمرا إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - ينقل `node.event` الأحداث الصادرة من Node عائدة إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لـNode غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقة">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة إضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرفة من Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يحدد `wake` حقن نص إيقاظ فوريا أو عند Heartbeat التالي؛ تدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - يظل `cron.run` استدعاء RPC بأسلوب الإدراج في الطابور للتشغيلات اليدوية. ينبغي للعملاء الذين يحتاجون دلالات الاكتمال قراءة `runId` المعاد واستطلاع `cron.runs`.
    - يقبل `cron.runs` عامل تصفية `runId` اختياريا غير فارغ حتى يتمكن العملاء من تتبع تشغيل يدوي واحد في الطابور من دون التنافس مع إدخالات سجل أخرى للمهمة نفسها.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة الواجهة مثل `chat.inject` وأحداث الدردشة الأخرى
  الخاصة بسجل المحادثة فقط. في البروتوكول v4، تحمل حمولات delta قيمة `deltaText`؛ وتظل `message`
  لقطة المساعد التراكمية. تضبط الاستبدالات غير السابقة `replace=true`
  وتستخدم `deltaText` كنص الاستبدال.
- `session.message` و`session.operation` و`session.tool`: تحديثات سجل المحادثة،
  وعملية الجلسة قيد التنفيذ، وتدفق الأحداث لجلسة مشتركة.
- `sessions.changed`: تغير فهرس الجلسات أو بيانات التعريف.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث إبقاء الاتصال/الحيوية الدوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيرت تهيئة مشغل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرائق مساعدة Node

- يمكن لـNodes استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية
  لفحوص السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغّل فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر
استدعاءات RPC لسجل المهام. تعيد هذه الطرائق ملخصات مهام منقحة، وليس حالة
وقت التشغيل الخام.

- يتطلب `tasks.list` قيمة `operator.read`.
  - المعلمات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو
    `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من تلك الحالات،
    و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى
    `500`، وسلسلة `cursor` اختيارية.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` قيمة `operator.read`.
  - المعلمات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرفات المهام المفقودة شكل خطأ عدم العثور في Gateway.
- يتطلب `tasks.cancel` قيمة `operator.write`.
  - المعلمات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يبلغ `found` عما إذا كان السجل يحتوي على مهمة مطابقة. ويبلغ `cancelled`
    عما إذا كان وقت التشغيل قد قبل الإلغاء أو سجله.

يتضمن `TaskSummary` الحقول `id` و`status` وبيانات تعريف اختيارية مثل `kind`
و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey`
و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية والتقدم
والملخص النهائي ونص الخطأ المنقح. يحدد `agentId` الوكيل الذي
ينفذ المهمة؛ وتحافظ `sessionKey` و`ownerKey` على سياق الطالب والتحكم.

### طرائق مساعدة المشغّل

- يجوز للمشغلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز الأمر النصي الأساسي من دون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضي الأسماء الأصلية المدركة للمزود
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة مائلة دقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المدرك للمزود عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسائط المتسلسلة من الاستجابة.
- يجوز للمشغلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل
  لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات تعريف المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يجوز للمشغلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعال
  في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق المصادقة أو التسليم المقدم من المستدعي.
  - الاستجابة هي إسقاط مشتق من الخادم ومحدد بنطاق الجلسة للمخزون النشط،
    بما في ذلك أدوات النواة وPlugin والقناة وأدوات خوادم MCP المكتشفة مسبقا.
  - `tools.effective` للقراءة فقط بالنسبة إلى MCP: قد يعرض كتالوج MCP لجلسة دافئة عبر
    سياسة الأدوات النهائية، لكنه لا ينشئ أوقات تشغيل MCP، ولا يربط وسائل النقل، ولا يصدر
    `tools/list`. إذا لم يوجد كتالوج دافئ مطابق، فقد تتضمن الاستجابة إشعارا مثل
    `mcp-not-yet-connected` أو `mcp-not-yet-listed` أو `mcp-stale-catalog`.
  - تستخدم إدخالات الأدوات الفعالة `source="core"` أو `source="plugin"` أو `source="channel"` أو
    `source="mcp"`.
- يجوز للمشغلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - تتطلب أغلفة النواة المخصصة للمالك فقط مثل `cron` و`gateway` و`nodes`
    هوية مالك/مسؤول (`operator.admin`) رغم أن طريقة `tools.invoke`
    نفسها هي `operator.write`.
  - الاستجابة غلاف موجه إلى SDK يتضمن `ok` و`toolName` و`output` الاختياري وحقول
    `error` منمطة. ترجع حالات رفض الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يجوز للمشغلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعدادات وخيارات
    التثبيت المنقاة من دون كشف قيم الأسرار الخام.
- يجوز للمشغلين استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات تعريف اكتشاف ClawHub.
- يجوز للمشغلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) لتهيئة أرشيف skill خاص
  قبل تثبيته. هذا مسار تحميل مسؤول منفصل للعملاء الموثوقين،
  وليس تدفق تثبيت skill العادي من ClawHub، وهو معطل افتراضيا ما لم يتم تمكين
  `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    تحميلا مرتبطا بذلك slug وقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` البايتات عند
    الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. لا ينهي commit إلا التحميل؛ ولا يثبت skill.
  - أرشيفات skill المحملة هي أرشيفات zip تحتوي على جذر `SKILL.md`. لا يحدد
    اسم الدليل الداخلي للأرشيف هدف التثبيت أبدا.
- يجوز للمشغلين استدعاء `skills.install` (`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد skill في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع التحميل: يثبت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    تحميلا مؤكدا في دليل `skills/<slug>` لمساحة عمل الوكيل الافتراضية.
    يجب أن تتطابق قيمتا slug وforce مع طلب
    `skills.upload.begin` الأصلي. يرفض هذا الوضع ما لم يتم تمكين
    `skills.install.allowUploadedArchives`. لا يؤثر هذا الإعداد في تثبيتات
    ClawHub.
  - وضع مثبت Gateway: يشغل `{ name, installId, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلنا على مضيف Gateway.
    قد يظل العملاء الأقدم يرسلون `dangerouslyForceUnsafeInstall`؛ هذا الحقل
    مهمل، ولا يقبل إلا لتوافق البروتوكول، ويتم تجاهله. استخدم
    `security.installPolicy` لقرارات التثبيت المملوكة للمشغل.
- يجوز للمشغلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدث وضع ClawHub قيمة slug متتبعة واحدة أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقع وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### طرق عرض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا تم إعداد `agents.defaults.models`، تكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكيا لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا تم إعداد `agents.defaults.models`، فإنه لا يزال يتقدم، بما في ذلك الاكتشاف المحدد بنطاق المزود لإدخالات `provider/*`. من دون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج معدة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيص وواجهات اكتشاف المستخدم، لا منتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحسم عملاء المشغل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (الحقول القانونية `argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة). ترفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` القانوني هذا كسياق الأمر/cwd/الجلسة المرجعي.
- إذا عدل المستدعي `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وتمرير `system.run` النهائي الموافق عليه، يرفض
  Gateway التشغيل بدلا من الوثوق بالحمولة المعدلة.

## الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ الخاص بالجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (على سبيل المثال جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يكون التسليم
  مطلوبا، باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed`
  نفسها الموثقة في [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ يرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي. يتطلب العملاء والخوادم الحاليون
  البروتوكول v4.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر البروتوكول v4 وهي خط الأساس المتوقع للعملاء الخارجيين.

| الثابت                                  | الافتراضي                                               | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلة الطلب (لكل RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعدادات/البيئة رفع ميزانية الخادم/العميل المقترنة) |
| تراجع إعادة الاتصال الأولي                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتراجع إعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| سماحية الإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم قيم `policy.tickIntervalMs` و`policy.maxPayload` و
`policy.maxBufferedBytes` الفعالة في `hello-ok`؛ ينبغي للعملاء احترام هذه القيم
بدلا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، وفقًا لوضع المصادقة المكوّن.
- تلبي الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` فحص مصادقة الاتصال من
  ترويسات الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال
  بالسر المشترك بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** بنطاق مقيد بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` وينبغي
  أن يحتفظ به العميل للاتصالات المستقبلية.
- ينبغي أن يحتفظ العملاء برمز `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أيضًا أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** استخدام
  مجموعة النطاقات المعتمدة المخزنة لذلك الرمز. يحافظ هذا على وصول
  القراءة/الفحص/الحالة الذي مُنح بالفعل، ويتجنب تقليص عمليات إعادة الاتصال
  بصمت إلى نطاق أضيق ضمني يقتصر على المدير فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائمًا عند ضبطه.
  - تتم تعبئة `auth.token` بترتيب أولوية: الرمز المشترك الصريح أولًا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا ينتج أي مما سبق
    `auth.token`. يثبطه الرمز المشترك أو أي رمز جهاز محلول.
  - الترقية التلقائية لرمز جهاز مخزن عند إعادة محاولة
    `AUTH_TOKEN_MISMATCH` ذات اللقطة الواحدة مقيدة **بنقاط النهاية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يؤهل `wss://`
    العام بلا تثبيت.
- يعيد تمهيد رمز الإعداد المدمج رمز جهاز العقدة الأساسي
  `hello-ok.auth.deviceToken` إضافة إلى رمز مشغل محدود في
  `hello-ok.auth.deviceTokens` لتسليم محمول موثوق. يتضمن رمز المشغل
  `operator.talk.secrets` لقراءات إعداد Talk الأصلية ويستبعد
  `operator.admin` و`operator.pairing`.
- أثناء انتظار تمهيد رمز إعداد غير أساسي للموافقة، تتضمن تفاصيل `PAIRING_REQUIRED`
  ‏`recommendedNextStep: "wait_then_retry"` و`retryable: true`
  و`pauseReconnect: false`. ينبغي أن يستمر العملاء في إعادة الاتصال برمز
  التمهيد نفسه حتى تتم الموافقة على الطلب أو يصبح الرمز غير صالح.
- احتفظ بـ `hello-ok.auth.deviceTokens` فقط عندما يستخدم الاتصال مصادقة تمهيد
  عبر نقل موثوق مثل `wss://` أو اقتران loopback/محلي.
- إذا قدم عميل `deviceToken` **صريحًا** أو `scopes` صريحة، تبقى مجموعة
  النطاقات التي طلبها المستدعي هي المرجع؛ لا يُعاد استخدام النطاقات المخزنة
  مؤقتًا إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إلغاء رموز الجهاز عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`). كما يتطلب تدوير
  أو إلغاء عقدة أو أي دور آخر غير مشغل `operator.admin`.
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط لاستدعاءات الجهاز نفسه المصادق عليها بالفعل برمز ذلك الجهاز، حتى
  يتمكن العملاء المعتمدون على الرمز فقط من الاحتفاظ بالبديل قبل إعادة
  الاتصال. لا تكرر عمليات التدوير المشتركة/الإدارية رمز الحامل.
- يظل إصدار الرمز وتدويره وإلغاؤه محدودًا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع دور جهاز
  أو استهداف دور لم تمنحه موافقة الاقتران مطلقًا.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة ذاتية النطاق ما لم
  يكن لدى المستدعي أيضًا `operator.admin`: يستطيع المستدعون غير الإداريين
  إدارة رمز المشغل فقط لإدخال جهازهم **الخاص**. إدارة رموز العقد والأدوار
  الأخرى غير المشغلين إدارية فقط، حتى لجهاز المستدعي نفسه.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضًا من مجموعة نطاقات
  رمز المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون
  غير الإداريين تدوير أو إلغاء رمز مشغل أوسع مما لديهم بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن مؤقتًا لكل جهاز.
  - إذا فشلت إعادة المحاولة، ينبغي أن يوقف العملاء حلقات إعادة الاتصال التلقائية وأن يعرضوا إرشادات إجراء المشغل.
- يعني `AUTH_SCOPE_MISMATCH` أنه تم التعرف على رمز الجهاز لكنه لا يغطي
  الدور/النطاقات المطلوبة. ينبغي ألا يعرض العملاء ذلك كرمز سيئ؛ اطلب
  من المشغل إعادة الاقتران أو الموافقة على عقد نطاق أضيق/أوسع.

## هوية الجهاز + الاقتران

- ينبغي أن تتضمن العقد هوية جهاز ثابتة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم تكن الموافقة
  التلقائية المحلية مفعلة.
- تتركز الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- يحتوي OpenClaw أيضًا على مسار اتصال ذاتي ضيق خاص بالخلفية/الحاوية المحلية
  لتدفقات المساعد ذات السر المشترك الموثوقة.
- ما تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة
  للاقتران وتتطلب موافقة.
- عادةً ما تتضمن عملاء WS هوية `device` أثناء `connect` (مشغل +
  عقدة). الاستثناءات الوحيدة للمشغل بلا جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` للتوافق مع HTTP غير الآمن على المضيف المحلي فقط.
  - مصادقة Control UI ناجحة للمشغل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر زجاج، تخفيض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback لـ `gateway-client` على مسار
    المساعد الداخلي المحجوز.
- حذف هوية الجهاز له تبعات على النطاق. عندما يُسمح باتصال مشغل بلا جهاز عبر
  مسار ثقة صريح، يظل OpenClaw يمسح النطاقات المعلنة ذاتيًا إلى مجموعة فارغة
  ما لم يكن لذلك المسار استثناء مسمى لحفظ النطاق. تفشل بعد ذلك الطرق
  المحكومة بالنطاق مع `missing scope`.
- يُعد `gateway.controlUi.dangerouslyDisableDeviceAuth=true` مسارًا لكسر الزجاج
  في Control UI يحافظ على النطاق. لا يمنح نطاقات لعملاء WebSocket مخصصين
  اعتباطيين على هيئة خلفية أو CLI.
- يحافظ مسار مساعد الخلفية المحجوز `gateway-client` عبر loopback المباشر
  على النطاقات فقط لاستدعاءات RPC المحلية الداخلية لمستوى التحكم؛ لا تحصل
  معرفات الخلفية المخصصة على هذا الاستثناء.
- يجب أن توقع جميع الاتصالات قيمة nonce في `connect.challenge` التي يقدمها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدماء الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` ثابت.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغًا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل بقيمة nonce قديمة/خاطئة.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، وهي تربط `platform` و`deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للأجهزة المقترنة يظل يتحكم بسياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة Gateway (انظر إعداد `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة API الكاملة لـ Gateway** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، وما إلى ذلك). يحدد السطح الدقيق
مخططات TypeBox في `packages/gateway-protocol/src/schema.ts`.

## ذات صلة

- [بروتوكول Bridge](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
