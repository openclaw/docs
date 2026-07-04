---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، الإطارات، إدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-07-04T18:02:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** أثناء
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحدَّد إطارات ما قبل الاتصال بسعة 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة الزائدة الحجم والمخازن المؤقتة الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة،
  أو محتويات المرفقات، أو جسم الإطار الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية.

## المصافحة (`connect`)

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

بينما لا يزال Gateway ينهي مكونات بدء التشغيل الجانبية، يمكن أن
يعيد طلب `connect` خطأ `UNAVAILABLE` قابلا لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة هذه الاستجابة
ضمن ميزانية الاتصال الإجمالية بدلا من عرضها كفشل
مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوبة كلها في المخطط
(`packages/gateway-protocol/src/schema/frames.ts`). كذلك `auth` مطلوبة وتعرض
الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختيارية وتربط أسماء أسطح Plugin
، مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL لأسطح Plugin المحددة النطاق. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا يدعم إعادة بناء Plugin Canvas التجريبي
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين وGateway الحاليين
استخدام أسطح Plugin.

عندما لا يصدر رمز جهاز، يعرض `hello-ok.auth` الصلاحيات المتفاوض عليها
من دون حقول الرمز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الخلفية الموثوقين داخل العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` على اتصالات loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس إقران CLI/الأجهزة القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
ما زالوا يستخدمون فحوصات الإقران وترقية النطاق العادية.

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

تمهيد رمز QR/رمز الإعداد المدمج هو مسار تسليم محمول جديد. يعيد
اتصال رمز إعداد خط أساس ناجح رمز عقدة أساسيا إضافة إلى رمز
مشغل واحد محدود:

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

تسليم المشغل محدود عمدا حتى يتمكن إعداد QR من بدء
حلقة المشغل المحمول وإكمال الإعداد الأصلي من دون منح نطاقات
تغيير الإقران أو `operator.admin`. ويتضمن `operator.talk.secrets` حتى
يتمكن العميل الأصلي من قراءة إعدادات Talk التي يحتاجها بعد التمهيد. يتطلب
الوصول الأوسع للإقران والإدارة تدفق إقران مشغل أو رمز منفصلا ومعتمدا.
ينبغي للعملاء حفظ
`hello-ok.auth.deviceTokens` فقط
عندما يستخدم الاتصال مصادقة التمهيد على نقل موثوق مثل `wss://` أو
loopback/الإقران المحلي.

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

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح عدم التكرار** (انظر المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاق المشغل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف الإمكانية (camera/screen/canvas/system.run).

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
عند تضمين الأسرار، ينبغي للعملاء قراءة اعتماد موفر Talk النشط
من `talk.resolved.config.apiKey`؛ يبقى `talk.providers.<id>.apiKey`
بشكل المصدر وقد يكون كائن SecretRef أو سلسلة منقحة.

قد تطلب أساليب RPC الخاصة بـ Gateway والمسجلة بواسطة Plugin نطاق مشغل خاصا بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
و`update.*`) تُحل دائما إلى `operator.admin`.

نطاق الأسلوب هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` الدائمة `operator.admin`.

لدى `node.pair.approve` أيضا فحص نطاق إضافي وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر عقد غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الصلاحيات (العقدة)

تعلن العقد مطالبات الإمكانية وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen`
  و`location` و`voice` و`talk`.
- `commands`: قائمة سماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه كـ **مطالبات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغلا** و**عقدة** في الوقت نفسه.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تعرض العقد المتصلة
  وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضا عرض
  حضور خلفية دائم عندما يحدّث حدث عقدة موثوق بيانات تعريف الإقران الخاصة بها.

### حدث بقاء العقدة حية في الخلفية

يمكن للعقد استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية من دون تمييزها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. يطبع Gateway سلاسل المشغلات غير المعروفة إلى
`background` قبل الحفظ. يكون الحدث دائما فقط لجلسات أجهزة العقد المصادق عليها؛
تعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد Gateway الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد تظل Gateway الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك كاستدعاء
RPC مؤكد، وليس كاستمرار حضور دائم.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم للنطاقات، حتى لا تتلقى الجلسات المحددة بنطاق الإقران أو جلسات العقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب على الأقل `operator.read`. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة بواسطة Plugin** تخضع لـ `operator.write` أو `operator.admin`، بناء على كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) تبقى غير مقيدة حتى تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تخضع للنطاقات افتراضيا (تفشل مغلقة) ما لم يرخها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل حتى تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس، حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مفلترة بالنطاق من تدفق الأحداث.

## عائلات أساليب RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست نسخة مولدة — `hello-ok.features.methods` قائمة اكتشاف محافظة
مبنية من `src/gateway/server-methods-list.ts` إضافة إلى صادرات أساليب
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة حالة Gateway المخزنة مؤقتًا أو المفحوصة حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود حديثًا. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. لا يحتفظ بنصوص المحادثات، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. يلزم نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء المشغلين ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يضيف `system-event` حدث نظام، ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها في وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم المنتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق تاريخ.
      مرّر `agentId` لوكيل واحد، أو `agentScope: "all"` لتجميع الوكلاء المكوّنين.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمين المخزن مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمين. يمكن للعملاء المدركين لـ Dreaming أيضًا تمرير `{ "agentId": "agent-id" }` لتقييد إحصاءات مخزن Dreaming بمساحة عمل وكيل محددة؛ يؤدي حذف `agentId` إلى إبقاء الرجوع إلى الوكيل الافتراضي وتجميع مساحات عمل Dreaming المكوّنة.
    - تقبل `doctor.memory.dreamDiary` و`doctor.memory.backfillDreamDiary` و`doctor.memory.resetDreamDiary` و`doctor.memory.resetGroundedShortTerm` و`doctor.memory.repairDreamingArtifacts` و`doctor.memory.dedupeDreamDiary` معاملات اختيارية `{ "agentId": "agent-id" }` لطرق عرض/إجراءات Dreaming للوكيل المحدد. عند حذف `agentId`، تعمل على مساحة عمل الوكيل الافتراضي المكوّنة.
    - يعيد `doctor.memory.remHarness` معاينة محدودة وللقراءة فقط لحزام REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown المؤرض المعروض، ومرشحي الترقية العميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة. مرّر `agentId` لوكيل
      واحد، أو `agentScope: "all"` لسرد الوكلاء المكوّنين معًا.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدو تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المدمجة + المرفقة.
    - يسجّل `channels.logout` خروج قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى Node iOS مسجّل.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC المباشر للتسليم الصادر للإرسال المستهدف إلى قناة/حساب/سلسلة خارج مشغل المحادثة.
    - يعيد `logs.tail` ذيل سجل ملفات Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.catalog` كتالوج مزوّدي Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرفات المزوّدين القانونية، وأسماء السجل المستعارة، والتسميات، وحالة التكوين، ونتيجة اختيارية `ready` على مستوى المجموعة، ومعرفات النماذج/الأصوات المعروضة، والأوضاع القانونية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية من دون إرجاع أسرار المزوّد أو تعديل الإعدادات العامة. تضبط Gateways الحالية `ready` بعد تطبيق اختيار مزوّد وقت التشغيل؛ ينبغي للعملاء اعتبار غيابها غير متحقق منه للتوافق مع Gateways الأقدم.
    - يعيد `talk.config` حمولة إعداد Talk الفعالة؛ يتطلب `includeSecrets` إذن `operator.talk.secrets` (أو `operator.admin`).
    - ينشئ `talk.session.create` جلسة Talk مملوكة لـ Gateway من أجل `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. بالنسبة إلى `stt-tts/managed-room`، يجب على مستدعي `operator.write` الذين يمررون `sessionKey` أن يمرروا أيضًا `spawnedBy` لرؤية مفتاح الجلسة محدودة النطاق؛ ويتطلب إنشاء `sessionKey` غير محدود النطاق و`brain: "direct-tools"` إذن `operator.admin`.
    - يتحقق `talk.session.join` من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` عند الحاجة، ويعيد بيانات تعريف الغرفة/الجلسة بالإضافة إلى أحداث Talk الحديثة من دون الرمز بالنص الصريح أو تجزئة الرمز المخزنة.
    - يضيف `talk.session.appendAudio` صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة لـ Gateway.
    - تقود `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة دور الغرفة المُدارة مع رفض الدور القديم قبل مسح الحالة.
    - يوقف `talk.session.cancelOutput` خرج صوت المساعد، أساسًا للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - يكمل `talk.session.submitToolResult` استدعاء أداة مزوّد صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway. مرّر `options: { willContinue: true }` لخرج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما ينبغي لنتيجة الأداة أن تلبي استدعاء المزوّد من دون بدء استجابة مساعد فورية أخرى.
    - يرسل `talk.session.steer` تحكمًا صوتيًا لتشغيل نشط إلى جلسة Talk مدعومة بوكيل ومملوكة لـ Gateway. يقبل `{ sessionId, text, mode? }`، حيث يكون `mode` هو `status` أو `steer` أو `cancel` أو `followup`؛ ويُصنَّف الوضع المحذوف من النص المنطوق.
    - يغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة لـ Gateway، ويصدر أحداث Talk نهائية.
    - يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.client.create` جلسة مزوّد فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما تمتلك Gateway الإعدادات وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - يتيح `talk.client.toolCall` لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. أول أداة مدعومة هي `openclaw_agent_consult`؛ يتلقى العملاء معرف تشغيل وينتظرون أحداث دورة حياة المحادثة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - يرسل `talk.client.steer` تحكمًا صوتيًا لتشغيل نشط لوسائل النقل الفورية المملوكة للعميل. تحل Gateway التشغيل المضمّن النشط من `sessionKey` وتعيد نتيجة منظمة مقبولة/مرفوضة بدلًا من إسقاط التوجيه بصمت.
    - `talk.event` هي قناة أحداث Talk الوحيدة لمحولات الوقت الفوري، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، والاجتماعات.
    - يصطنع `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تمكين TTS، والمزوّد النشط، ومزوّدي الرجوع، وحالة إعداد المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعدادات، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل عند النجاح الكامل فقط.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية والتجزئة.
    - يكتب `config.set` حمولة إعداد متحققًا منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا. يتطلب استبدال المصفوفة
      المدمر المسار المتأثر في `replacePaths`؛ تستخدم المصفوفات المتداخلة
      ضمن إدخالات المصفوفة مسارات `[]` مثل `agents.list[].skills`.
    - يتحقق `config.apply` من حمولة الإعداد الكاملة + يستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعدادات الحية المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المستمدة من التسميات نفسها ونص المساعدة المستخدمين في واجهة المستخدم، بما في ذلك فروع الكائنات المتداخلة، وحروف البدل، وعنصر المصفوفة، وتركيبات `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقل مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محدودة المسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، و`reloadKind` اختياري، وملخصات الأبناء المباشرين للتنقل التفصيلي في UI/CLI. `reloadKind` هو أحد `restart` أو `hot` أو `none` ويعكس مخطط إعادة تحميل إعدادات Gateway للمسار المطلوب. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، و`reloadKind` الاختياري، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين ذوي الجلسة تضمين `continuationMessage` كي يستأنف بدء التشغيل دور وكيل متابعة واحدًا عبر طابور متابعة إعادة التشغيل. تستخدم تحديثات مدير الحزم وتحديثات git-checkout الخاضعة للإشراف من مستوى التحكم تسليمًا منفصلًا لخدمة مُدارة بدلًا من استبدال شجرة الحزم أو تعديل مخرجات checkout/build داخل Gateway الحية. يعيد التسليم الذي بدأ `ok: true` مع `result.reason: "managed-service-handoff-started"` و`handoff.status: "started"`؛ وتعيد عمليات التسليم غير المتاحة أو الفاشلة `ok: false` مع `managed-service-handoff-unavailable` أو `managed-service-handoff-failed`، بالإضافة إلى `handoff.command` عندما يكون تحديث shell يدوي مطلوبًا. يعني التسليم غير المتاح أن OpenClaw يفتقر إلى حد مشرف آمن أو هوية خدمة دائمة، مثل `OPENCLAW_SYSTEMD_UNIT` لـ systemd. أثناء التسليم الذي بدأ، قد يبلّغ حارس إعادة التشغيل لفترة وجيزة `stats.reason: "restart-health-pending"`؛ وتُؤخر المتابعة حتى يتحقق CLI من Gateway المعاد تشغيلها ويكتب حارس `ok` النهائي.
    - يحدّث `update.status` أحدث حارس لإعادة تشغيل التحديث ويعيده، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عند توفره.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعّال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المكشوفة للوكيل.
    - تكشف `tasks.list` و`tasks.get` و`tasks.cancel` سجل مهام Gateway لعملاء SDK والمشغّلين.
    - تكشف `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات العناصر الناتجة من النصوص المنسوخة والتنزيلات لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة من جهة الخادم ولا تعيد إلا وسائط النصوص المنسوخة ذات المصدر المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلا من الجلب من جهة الخادم.
    - تكشف `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية وبيئات العقدة للقراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعّالة لوكيل أو جلسة.
    - ينتظر `agent.wait` حتى يكتمل تشغيل، ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عند تكوين خلفية وقت تشغيل وكيل.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص المنسوخ/الرسائل لجلسة واحدة.
    - تعيد `sessions.preview` معاينات نصوص منسوخة محدودة لمفاتيح جلسات محددة.
    - تعيد `sessions.describe` صف جلسة Gateway واحدا لمفتاح جلسة مطابق تماما.
    - تحل `sessions.resolve` هدف جلسة أو تجعله معياريا.
    - تنشئ `sessions.create` إدخال جلسة جديدا.
    - ترسل `sessions.send` رسالة إلى جلسة موجودة.
    - تمثل `sessions.steer` صيغة المقاطعة والتوجيه لجلسة نشطة.
    - تلغي `sessions.abort` العمل النشط لجلسة. يمكن للمتصل تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - تحدّث `sessions.patch` بيانات تعريف الجلسة/التجاوزات وتبلغ عن النموذج المعياري المحلول إضافة إلى `agentRuntime` الفعّال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - تعيد `sessions.get` صف الجلسة المخزن بالكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يكون `chat.history` مطبّعا للعرض لعملاء الواجهة: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المبتورة) ورموز تحكم النموذج المسربة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة فقط مثل `NO_REPLY` / `no_reply` المطابقة تماما، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
    - `chat.message.get` هو قارئ الرسالة الكاملة المحدودة الإضافي لإدخال نص منسوخ مرئي واحد. يمرر العملاء `sessionKey`، و`agentId` اختياريا عندما يكون اختيار الجلسة محدودا بنطاق الوكيل، إضافة إلى `messageId` للنص المنسوخ سبق عرضه عبر `chat.history`، ويعيد Gateway الإسقاط نفسه المطبّع للعرض من دون حد الاقتطاع الخفيف للسجل عندما لا يزال الإدخال المخزن متاحا وليس كبير الحجم.
    - يقبل `chat.send` قيمة `fastMode: "auto"` لدورة واحدة لاستخدام الوضع السريع لاستدعاءات النموذج التي تبدأ قبل حد القطع التلقائي، ثم بدء استدعاءات إعادة المحاولة أو الرجوع الاحتياطي أو نتيجة الأداة أو المتابعة اللاحقة من دون الوضع السريع. يكون حد القطع افتراضيا 60 ثانية ويمكن تكوينه لكل نموذج باستخدام `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. يمكن لمتصل `chat.send` تمرير `fastAutoOnSeconds` لدورة واحدة لتجاوز حد القطع لذلك الطلب.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - تعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تنشئ `device.pair.setupCode` رمز إعداد للجوال، وافتراضيا URL بيانات QR بصيغة PNG. تتطلب `operator.admin` وهي محذوفة عمدا من الاكتشاف المعلن. تتضمن النتيجة `setupCode` و`qrDataUrl` اختياريا و`gatewayUrl` وتسمية `auth` غير السرية و`urlSource`.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - تدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.
    - تلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.

    يضمّن رمز الإعداد اعتماد تمهيد قصير العمر. يجب ألا يسجله العملاء
    أو يحتفظوا به بعد تدفق الإقران.

  </Accordion>

  <Accordion title="إقران العقدة والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران العقدة والتحقق من التمهيد.
    - تعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - تحدّث `node.rename` تسمية عقدة مقترنة.
    - تمرر `node.invoke` أمرا إلى عقدة متصلة.
    - تعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من العقدة مرة أخرى إلى Gateway.
    - تمثل `node.pending.pull` و`node.pending.ack` واجهات API لطابور العقدة المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق المتين للعقد غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقة">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة إضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة تنفيذ Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية للعقدة عبر أوامر ترحيل العقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوري أو عند Heartbeat التالي؛ وتدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - يبقى `cron.run` استدعاء RPC بأسلوب الإضافة إلى قائمة الانتظار للتشغيل اليدوي. يجب على العملاء الذين يحتاجون إلى دلالات الإكمال قراءة `runId` المُعاد واستطلاع `cron.runs`.
    - يقبل `cron.runs` عامل تصفية اختياريًا غير فارغ باسم `runId` حتى يتمكن العملاء من متابعة تشغيل يدوي واحد في قائمة الانتظار دون التسابق مع إدخالات سجل أخرى للمهمة نفسها.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى خاصة
  بالنص المنسوخ فقط. في بروتوكول v4، تحمل حمولات الفروقات `deltaText`؛ ويبقى `message`
  لقطة المساعد التراكمية. تضبط الاستبدالات غير البادئة `replace=true`
  وتستخدم `deltaText` كنص الاستبدال.
- `session.message` و`session.operation` و`session.tool`: تحديثات النص المنسوخ،
  وعملية الجلسة الجارية، وتدفق الأحداث لجلسة مشترك
  فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطات حضور النظام.
- `tick`: حدث إبقاء اتصال دوري / حيوية.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق حدث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق مساعدة Node

- يمكن للعُقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية الخاصة بالـ Skills
  لفحوصات السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغّل فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر
استدعاءات RPC لسجل المهام. تعيد هذه الطرق ملخصات مهام منقّحة، لا حالة
تشغيل خام.

- يتطلب `tasks.list` الإذن `operator.read`.
  - المعاملات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو
    `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من هذه الحالات،
    و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى
    `500`، وسلسلة `cursor` اختيارية.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` الإذن `operator.read`.
  - المعاملات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرّفات المهام المفقودة بنية خطأ عدم العثور الخاصة بـ Gateway.
- يتطلب `tasks.cancel` الإذن `operator.write`.
  - المعاملات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يبلّغ `found` عما إذا كان السجل يحتوي على مهمة مطابقة. ويبلّغ `cancelled`
    عما إذا كان وقت التشغيل قد قبل الإلغاء أو سجّله.

يتضمن `TaskSummary` كلًا من `id` و`status` وبيانات وصفية اختيارية مثل `kind`
و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey`
و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية والتقدم
والملخص النهائي ونص الخطأ المنقّح. يحدد `agentId` الوكيل
الذي ينفذ المهمة؛ وتحافظ `sessionKey` و`ownerKey` على سياق الطالب والتحكم.

### طرق مساعدة المشغّل

- يجوز للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز الأمر النصي الأساسي من دون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضي الأسماء الأصلية المراعية للمزوّد
      عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المراعي للمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفّر أوامر Plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يجوز للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`:‏ `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يجوز للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة هي إسقاط مشتق من الخادم ومقيّد بالجلسة للمخزون النشط،
    بما في ذلك أدوات الخادم الأساسية وPlugin والقناة وخادم MCP المكتشفة مسبقا.
  - `tools.effective` للقراءة فقط بالنسبة إلى MCP: قد يسقط كتالوج MCP لجلسة دافئة عبر
    سياسة الأدوات النهائية، لكنه لا ينشئ أوقات تشغيل MCP، ولا يوصّل وسائل النقل، ولا يصدر
    `tools/list`. إذا لم يوجد كتالوج دافئ مطابق، فقد تتضمن الاستجابة إشعارا مثل
    `mcp-not-yet-connected` أو `mcp-not-yet-listed` أو `mcp-stale-catalog`.
  - تستخدم إدخالات الأدوات الفعّالة `source="core"` أو `source="plugin"` أو `source="channel"` أو
    `source="mcp"`.
- يجوز للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - تتطلب أغلفة النواة الخاصة بالمالك فقط مثل `cron` و`gateway` و`nodes`
    هوية مالك/مسؤول (`operator.admin`) رغم أن طريقة `tools.invoke`
    نفسها هي `operator.write`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` نمطية. ترجع رفضات الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يجوز للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوصات الإعدادات وخيارات تثبيت
    منقّاة من دون كشف قيم الأسرار الخام.
- يجوز للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات تعريف اكتشاف ClawHub.
- يجوز للمشغّلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) لتهيئة أرشيف Skill خاص
  قبل تثبيته. هذا مسار رفع إداري منفصل للعملاء الموثوقين،
  وليس تدفق تثبيت Skills العادي في ClawHub، وهو معطّل افتراضيا ما لم يتم تفعيل
  `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    رفعا مرتبطا بذلك المعرّف وقيمة الفرض.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` البايتات عند
    الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. ينجز الالتزام الرفع فقط؛ ولا يثبّت Skill.
  - أرشيفات Skills المرفوعة هي أرشيفات zip تحتوي على جذر `SKILL.md`. لا يحدد
    اسم الدليل الداخلي في الأرشيف هدف التثبيت مطلقا.
- يجوز للمشغّلين استدعاء `skills.install` (`operator.admin`) في ثلاثة أوضاع:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }`
    مجلد Skill في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضية.
  - وضع الرفع: يثبّت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    رفعا ملتزما في دليل `skills/<slug>` ضمن مساحة عمل الوكيل الافتراضية.
    يجب أن يطابق المعرّف وقيمة الفرض طلب
    `skills.upload.begin` الأصلي. يرفض هذا الوضع ما لم يتم تفعيل
    `skills.install.allowUploadedArchives`. لا يؤثر الإعداد في عمليات تثبيت ClawHub.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلنا على مضيف Gateway.
    قد يستمر العملاء الأقدم في إرسال `dangerouslyForceUnsafeInstall`؛ هذا الحقل
    مهمل، ولا يقبل إلا للتوافق البروتوكولي، ويتم تجاهله. استخدم
    `security.installPolicy` لقرارات التثبيت المملوكة للمشغّل.
- يجوز للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub معرّفا متتبعا واحدا أو كل عمليات تثبيت ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعدادات قيما مثل `skills.entries.<skillKey>` مثل `enabled`
    و`apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معامل `view` اختياريا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مكوّنا، تكون الاستجابة هي الكتالوج المسموح به، بما في ذلك النماذج المكتشفة ديناميكيا لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` مكوّنا، فإنه يظل هو السائد، بما في ذلك الاكتشاف المقيّد بالمزوّد لإدخالات `provider/*`. من دون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مكوّنة.
- `"all"`: كتالوج Gateway الكامل، متجاوزا `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس منتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway‏ `exec.approval.requested`.
- يحل عملاء المشغّل ذلك عبر استدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (بيانات `argv`/`cwd`/`rawCommand`/الجلسة القياسية). ترفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام
  `systemRunPlan` القياسي كسياق موثوق للأمر/cwd/الجلسة.
- إذا غيّر مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وإعادة التوجيه النهائية المعتمدة إلى `system.run`، فإن
  Gateway يرفض التشغيل بدلا من الوثوق بالحمولة المعدّلة.

## رجوع تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يكون التسليم
  مطلوبا، باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed`
  نفسها الموثقة في [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## تحديد الإصدارات

- يوجد `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي. يتطلب العملاء والخوادم الحاليون
  البروتوكول v4.
- يتم إنشاء المخططات + النماذج من تعريفات TypeBox:
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
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/البيئة رفع ميزانية الخادم/العميل المزدوجة) |
| تراجع إعادة الاتصال الأولي                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى تراجع لإعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| تثبيت إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلة الإنهاء القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| الفاصل الافتراضي للنبضات (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبضة                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم القيم الفعّالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي للعملاء احترام تلك القيم
بدلا من القيم الافتراضية قبل المصافحة.

## المصادقة

- يستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوّن.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` تفي بفحص مصادقة الاتصال من
  رؤوس الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للدخول الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مخصصا لدور الاتصال
  + النطاقات. ويعاد في `hello-ok.auth.deviceToken` ويجب أن
  يستمر العميل في حفظه للاتصالات المستقبلية.
- يجب أن يستمر العملاء في حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن يعيد الاتصال بذلك رمز الجهاز **المخزن** استخدام مجموعة النطاقات
  الموافق عليها والمخزنة لذلك الرمز أيضا. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي سبق منحه ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى
  نطاق ضمني أضيق خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويمرر دائما عند ضبطه.
  - يملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - يرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق
    `auth.token`. رمز مشترك أو أي رمز جهاز محلول يمنعه.
  - الترقية التلقائية لرمز جهاز مخزن عند إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة مشروطة بـ **نقاط نهاية موثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام من دون تثبيت.
- يعيد تمهيد رمز الإعداد المدمج رمز الجهاز للعقدة الأساسية
  `hello-ok.auth.deviceToken` بالإضافة إلى رمز مشغل محدود في
  `hello-ok.auth.deviceTokens` للتسليم الموثوق إلى الهاتف المحمول. يتضمن رمز المشغل
  `operator.talk.secrets` لقراءات إعداد Talk الأصلية، لكنه
  يستثني نطاقات تعديل الاقتران و`operator.admin`.
- أثناء انتظار تمهيد رمز إعداد غير أساسي للموافقة، تتضمن تفاصيل `PAIRING_REQUIRED`
  `recommendedNextStep: "wait_then_retry"`، و`retryable: true`،
  و`pauseReconnect: false`. يجب على العملاء متابعة إعادة الاتصال بالرمز
  التمهيدي نفسه حتى تتم الموافقة على الطلب أو يصبح الرمز غير صالح.
- احفظ `hello-ok.auth.deviceTokens` فقط عندما يستخدم الاتصال مصادقة التمهيد
  على نقل موثوق مثل `wss://` أو اقتران loopback/محلي.
- إذا قدم عميل `deviceToken` **صريحا** أو `scopes` صريحة، تظل
  مجموعة النطاقات التي طلبها المستدعي هي المعتمدة؛ لا يعاد استخدام النطاقات المخزنة مؤقتا
  إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`). تدوير أو
  إبطال عقدة أو دور آخر غير مشغل يتطلب أيضا `operator.admin`.
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط لاستدعاءات الجهاز نفسه التي تمت مصادقتها بالفعل باستخدام
  رمز ذلك الجهاز، حتى يتمكن العملاء المعتمدون على الرموز فقط من حفظ البديل قبل
  إعادة الاتصال. لا تكرر تدويرات المشترك/المسؤول رمز الحامل.
- يظل إصدار الرموز وتدويرها وإبطالها محدودا بمجموعة الأدوار الموافق عليها
  والمسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع أو
  استهداف دور جهاز لم تمنحه موافقة الاقتران قط.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضا `operator.admin`: يمكن للمستدعين غير المسؤولين إدارة
  رمز المشغل لإدخال جهازهم **الخاص** فقط. إدارة رموز العقد وغيرها من
  الرموز غير المشغلة خاصة بالمسؤول فقط، حتى لجهاز المستدعي نفسه.
- يفحص `device.token.rotate` و`device.token.revoke` أيضا مجموعة نطاقات رمز
  المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يمكن للمستدعين غير المسؤولين
  تدوير أو إبطال رمز مشغل أوسع مما يحملونه بالفعل.
- تتضمن حالات فشل المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل لـ `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز مخزن مؤقتا لكل جهاز.
  - إذا فشلت تلك المحاولة، يجب على العملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات إجراء المشغل.
- يعني `AUTH_SCOPE_MISMATCH` أن رمز الجهاز تم التعرف عليه لكنه لا يغطي
  الدور/النطاقات المطلوبة. يجب ألا يعرض العملاء هذا باعتباره رمزا سيئا؛
  اطلب من المشغل إعادة الاقتران أو الموافقة على عقد النطاق الأضيق/الأوسع.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العقد هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways الرموز لكل جهاز + دور.
- موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم تكن الموافقة التلقائية المحلية
  مفعلة.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضا مسار اتصال ذاتي ضيق داخل الخلفية/الحاوية
  لتدفقات المساعد الموثوقة ذات السر المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تعامل على أنها بعيدة للاقتران و
  تتطلب موافقة.
- يتضمن عملاء WS عادة هوية `device` أثناء `connect` (مشغل +
  عقدة). استثناءات المشغلين من دون جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير آمن على المضيف المحلي فقط.
  - مصادقة Control UI للمشغل عبر `gateway.auth.mode: "trusted-proxy"` الناجحة.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر طارئ، خفض أمان شديد).
  - RPCs خلفية `gateway-client` عبر direct-loopback على مسار المساعد
    الداخلي المحجوز.
- لحذف هوية الجهاز عواقب على النطاقات. عندما يسمح باتصال مشغل
  من دون جهاز عبر مسار ثقة صريح، يظل OpenClaw يمسح
  النطاقات المعلنة ذاتيا إلى مجموعة فارغة ما لم يكن لذلك المسار استثناء مسمى
  لحفظ النطاقات. عندها تفشل الطرق المحكومة بالنطاقات مع
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` هو مسار حفظ نطاقات
  كسر طارئ لـ Control UI. لا يمنح نطاقات إلى
  عملاء WebSocket مخصصين عشوائيين بشكل خلفية أو CLI.
- يحافظ مسار مساعد الخلفية المحجوز `gateway-client` عبر direct-loopback
  على النطاقات فقط لـ RPCs مستوى التحكم المحلي الداخلية؛ لا تحصل معرفات الخلفية المخصصة
  على هذا الاستثناء.
- يجب أن توقع كل الاتصالات على قيمة nonce التي يوفرها الخادم `connect.challenge`.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح به.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق المفتاح العام/توحيده.         |

هدف الترحيل:

- انتظر دائما `connect.challenge`.
- وقع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية للجهاز المقترن
  لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريا تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة برمجة تطبيقات Gateway الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، إلخ). يحدد السطح الدقيق بواسطة
مخططات TypeBox في `packages/gateway-protocol/src/schema.ts`.

## ذو صلة

- [بروتوكول Bridge](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
