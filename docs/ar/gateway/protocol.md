---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، الإطارات، تحديد الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-07-01T08:04:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** لـ
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** في
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- الإطارات قبل الاتصال محدودة بـ 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تصدر الإطارات الواردة الزائدة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة،
  أو محتويات المرفقات، أو نص الإطار الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية.

## المصافحة (connect)

Gateway → العميل (تحدي قبل الاتصال):

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

بينما لا يزال Gateway ينهي مكونات بدء التشغيل الجانبية، يمكن لطلب `connect`
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلا من عرضها كفشل مصافحة نهائي.

`server`، و`features`، و`snapshot`، و`policy` كلها مطلوبة بواسطة المخطط
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` مطلوب أيضا ويبلغ عن
الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL لأسطح Plugin المحددة النطاق. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` للحصول على إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Plugin التجريبية لـ Canvas
مسار التوافق المهمل `canvasHostUrl`، أو `canvasCapability`، أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين الحاليين وGateways
استخدام أسطح Plugin.

عند عدم إصدار رمز جهاز، يبلغ `hello-ok.auth` عن الأذونات المتفاوض عليها
من دون حقول رموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يمكن لعملاء الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور gateway المشتركة. هذا المسار مخصص لاستدعاءات RPC
الداخلية لمستوى التحكم، ويمنع أساسات إقران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. أما العملاء البعيدون،
والعملاء من أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
فما زالوا يستخدمون فحوصات الإقران وترقية النطاق المعتادة.

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

تمهيد رمز QR/رمز الإعداد المدمج هو مسار تسليم محمول جديد. يعيد اتصال
رمز الإعداد الأساسي الناجح رمز عقدة أساسيا بالإضافة إلى رمز عامل واحد محدود:

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

تسليم العامل محدود عمدا حتى يتمكن إعداد QR من بدء
حلقة عامل الهاتف المحمول من دون منح `operator.admin` أو `operator.pairing`.
ويتضمن `operator.talk.secrets` حتى يتمكن العميل الأصلي من قراءة تهيئة Talk
التي يحتاجها بعد التمهيد. تتطلب نطاقات الإدارة والإقران الأوسع
إقرانا منفصلا معتمدا للعامل أو تدفق رمز منفصلا. ينبغي للعملاء الاحتفاظ بـ
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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح إتاحة التكرار بأمان** (راجع المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاق العامل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات العامل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف الإمكانية (camera/screen/canvas/system.run).

### النطاقات (العامل)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` وجود `operator.talk.secrets`
(أو `operator.admin`).
عند تضمين الأسرار، ينبغي للعملاء قراءة اعتماد مزود Talk النشط
من `talk.resolved.config.apiKey`؛ يبقى `talk.providers.<id>.apiKey`
بشكل المصدر وقد يكون كائن SecretRef أو سلسلة منقحة.

يمكن لطرق RPC الخاصة بـ gateway والمسجلة بواسطة Plugin طلب نطاق عامل خاص بها، لكن
بادئات إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`،
و`update.*`) تتحول دائما إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب عمليات
كتابة `/config set` و`/config unset` المستمرة `operator.admin`.

يتضمن `node.pair.approve` أيضا فحص نطاق إضافيا وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run`، أو `system.run.prepare`، أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العقد ادعاءات الإمكانية وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera`، و`canvas`، و`screen`،
  و`location`، و`voice`، و`talk`.
- `commands`: قائمة سماح للأوامر من أجل invoke.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record`، و`camera.capture`).

يتعامل Gateway مع هذه بوصفها **ادعاءات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId`، و`roles`، و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل كـ **عامل** و**عقدة** في الوقت نفسه.
- يتضمن `node.list` حقلي `lastSeenAtMs` و`lastSeenReason` الاختياريين. تبلغ العقد المتصلة
  عن وقت اتصالها الحالي في `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضا الإبلاغ عن
  حضور خلفية دائم عندما يحدث حدث عقدة موثوق بيانات الإقران الوصفية الخاصة بها.

### حدث بقاء العقدة حية في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية من دون وضع علامة عليها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` هو تعداد مغلق: `background`، أو `silent_push`، أو `bg_app_refresh`،
أو `significant_location`، أو `manual`، أو `connect`. تطبع سلاسل المشغل غير المعروفة إلى
`background` بواسطة gateway قبل الاستمرار. يكون الحدث دائما فقط لجلسات جهاز العقدة
المصادق عليها؛ أما الجلسات بلا جهاز أو غير المقترنة فتعود بـ `handled: false`.

تعيد Gateways الناجحة نتيجة مهيكلة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد تظل Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك
كاستدعاء RPC مؤكد، وليس كاستمرار حضور دائم.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات النطاق حتى لا تتلقى الجلسات محددة الإقران أو الخاصة بالعقد فقط محتوى الجلسة بشكل سلبي.

- تتطلب **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) وجود `operator.read` على الأقل. تتجاوز الجلسات التي لا تحتوي على `operator.read` هذه الإطارات بالكامل.
- تخضع **بثوث `plugin.*` المعرفة بواسطة Plugin** لـ `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- تبقى **أحداث الحالة والنقل** (`heartbeat`، و`presence`، و`tick`، ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) غير مقيدة حتى تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- تخضع **عائلات أحداث البث غير المعروفة** لبوابات النطاق افتراضيا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل حتى تحافظ البثوث على ترتيب تصاعدي على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغا مولدا — `hello-ok.features.methods` هي قائمة اكتشاف محافظة
مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة سلامة Gateway المخزنة مؤقتًا أو التي تم فحصها حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الحديث. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرّفات الجلسات. لا يحتفظ بنص المحادثة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة المشغل مطلوب.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ لا تُضمّن الحقول الحساسة إلا لعملاء المشغلين ضمن نطاق المسؤول.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/Node المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المهيأة بحجم المنتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات مجمّعة لاستخدام التكلفة ضمن نطاق تاريخ.
      مرّر `agentId` لوكيل واحد، أو `agentScope: "all"` لتجميع الوكلاء المهيئين.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمينات المخزنة مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً فحص اتصال مباشر بمزوّد التضمينات. يمكن للعملاء المدركون لـ Dreaming أيضًا تمرير `{ "agentId": "agent-id" }` لقصر إحصاءات مخزن Dreaming على مساحة عمل وكيل محددة؛ إبقاء `agentId` محذوفًا يحافظ على الرجوع إلى الوكيل الافتراضي ويجمع مساحات عمل Dreaming المهيأة.
    - تقبل `doctor.memory.dreamDiary` و`doctor.memory.backfillDreamDiary` و`doctor.memory.resetDreamDiary` و`doctor.memory.resetGroundedShortTerm` و`doctor.memory.repairDreamingArtifacts` و`doctor.memory.dedupeDreamDiary` معاملات اختيارية `{ "agentId": "agent-id" }` لعروض/إجراءات Dreaming الخاصة بالوكيل المحدد. عند حذف `agentId`، تعمل على مساحة عمل الوكيل الافتراضي المهيأة.
    - يعيد `doctor.memory.remHarness` معاينة محدودة للقراءة فقط لحزمة REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحات العمل، ومقتطفات الذاكرة، وMarkdown مؤرضًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات استخدام لكل جلسة. مرّر `agentId` لوكيل واحد
      أو `agentScope: "all"` لسرد الوكلاء المهيئين معًا.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugin المضمنة + المجمعة.
    - يسجّل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى Node iOS مسجلة.
    - يعيد `voicewake.get` محفزات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسال الموجّه إلى القناة/الحساب/الخيط خارج مشغّل المحادثة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المهيأ مع عناصر تحكم المؤشر/الحد الأقصى والحد الأقصى للبايت.

  </Accordion>

  <Accordion title="التحدث وTTS">
    - يعيد `talk.catalog` كتالوج مزوّدي التحدث للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرّفات المزوّدين، والتسميات، وحالة التهيئة، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع القياسية، ووسائط النقل، واستراتيجيات العقل، ورايات الصوت/القدرات الفورية دون إرجاع أسرار المزوّدين أو تعديل الإعداد العام.
    - يعيد `talk.config` حمولة إعداد التحدث الفعالة؛ يتطلب `includeSecrets` صلاحية `operator.talk.secrets` (أو `operator.admin`).
    - ينشئ `talk.session.create` جلسة تحدث مملوكة لـ Gateway لـ `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. بالنسبة إلى `stt-tts/managed-room`، يجب على مستدعي `operator.write` الذين يمررون `sessionKey` تمرير `spawnedBy` أيضًا لرؤية مفتاح الجلسة ضمن النطاق؛ يتطلب إنشاء `sessionKey` غير محدود النطاق و`brain: "direct-tools"` صلاحية `operator.admin`.
    - يتحقق `talk.session.join` من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، ويعيد بيانات تعريف الغرفة/الجلسة إضافة إلى أحداث التحدث الحديثة دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - يضيف `talk.session.appendAudio` صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة لـ Gateway.
    - تدير `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة الدور في الغرفة المُدارة مع رفض الدور المتقادم قبل مسح الحالة.
    - يوقف `talk.session.cancelOutput` خرج صوت المساعد، خصوصًا للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - يكمل `talk.session.submitToolResult` استدعاء أداة من المزوّد صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway. مرّر `options: { willContinue: true }` لخرج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تفي نتيجة الأداة باستدعاء المزوّد دون بدء استجابة مساعد فورية أخرى.
    - يرسل `talk.session.steer` تحكمًا صوتيًا للتشغيل النشط إلى جلسة تحدث مدعومة بوكيل ومملوكة لـ Gateway. يقبل `{ sessionId, text, mode? }`، حيث يكون `mode` هو `status` أو `steer` أو `cancel` أو `followup`؛ ويُصنّف الوضع المحذوف من النص المنطوق.
    - يغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة لـ Gateway ويصدر أحداث تحدث نهائية.
    - يضبط/يبث `talk.mode` حالة وضع التحدث الحالية لعملاء WebChat/Control UI.
    - ينشئ `talk.client.create` جلسة مزوّد فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما يملك Gateway الإعدادات وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - يتيح `talk.client.toolCall` لوسائط النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. الأداة المدعومة الأولى هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة المحادثة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - يرسل `talk.client.steer` تحكمًا صوتيًا للتشغيل النشط لوسائط النقل الفورية المملوكة للعميل. يحل Gateway التشغيل المضمن النشط من `sessionKey` ويعيد نتيجة قبول/رفض منظمة بدلًا من إسقاط التوجيه بصمت.
    - `talk.event` هي قناة أحداث التحدث الوحيدة للفوري، والنسخ، وSTT/TTS، والغرفة المُدارة، والمهاتفة، ومحوّلات الاجتماعات.
    - يصنّع `talk.speak` الكلام عبر مزوّد كلام التحدث النشط.
    - يعيد `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الرجوع، وحالة إعداد المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلًا لمرة واحدة من نص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعداد، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية والتجزئة.
    - يكتب `config.set` حمولة إعداد تم التحقق منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا. يتطلب استبدال المصفوفات
      التدميري المسار المتأثر في `replacePaths`؛ تستخدم المصفوفات المتداخلة
      ضمن إدخالات المصفوفة مسارات `[]` مثل `agents.list[].skills`.
    - يتحقق `config.apply` من حمولة الإعداد الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعداد الحية المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات نفسها ونص المساعدة المستخدمين في واجهة المستخدم، بما في ذلك فروع التكوين للكائن المتداخل، وحرف البدل، وعنصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقل مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محدودة بالمسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، وتلميحًا مطابقًا + `hintPath`، و`reloadKind` اختياريًا، وملخصات فورية للأبناء للتنقل التفصيلي في UI/CLI. يكون `reloadKind` واحدًا من `restart` أو `hot` أو `none` ويطابق مخطط إعادة تحميل إعداد Gateway للمسار المطلوب. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، ورايات مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، و`reloadKind` اختياريًا، إضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة التشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` حتى يستأنف بدء التشغيل دور وكيل متابعة واحد عبر قائمة انتظار متابعة إعادة التشغيل. تستخدم تحديثات مدير الحزم وتحديثات git-checkout الخاضعة للإشراف من مستوى التحكم تسليمًا منفصلًا إلى خدمة مُدارة بدلًا من استبدال شجرة الحزمة أو تعديل مخرجات checkout/build داخل Gateway الحي. يعيد التسليم الذي بدأ `ok: true` مع `result.reason: "managed-service-handoff-started"` و`handoff.status: "started"`؛ وتعيد التسليمات غير المتاحة أو الفاشلة `ok: false` مع `managed-service-handoff-unavailable` أو `managed-service-handoff-failed`، إضافة إلى `handoff.command` عندما يكون تحديث shell يدوي مطلوبًا. يعني التسليم غير المتاح أن OpenClaw يفتقر إلى حد مشرف آمن أو هوية خدمة دائمة، مثل `OPENCLAW_SYSTEMD_UNIT` لـ systemd. أثناء التسليم الذي بدأ، قد يبلّغ مؤشّر إعادة التشغيل مؤقتًا عن `stats.reason: "restart-health-pending"`؛ وتتأخر المتابعة حتى يتحقق CLI من Gateway المعاد تشغيله ويكتب مؤشر `ok` النهائي.
    - يحدّث `update.status` ويعيد أحدث مؤشر لإعادة تشغيل التحديث، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المهيأة، بما في ذلك النموذج الفعلي وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل التمهيد المعروضة لوكيل.
    - تعرض `tasks.list` و`tasks.get` و`tasks.cancel` سجل مهام Gateway لعملاء SDK والمشغلين.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات القطع الأثرية المشتقة من النصوص والتنزيلات لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة على جانب الخادم ولا تعيد إلا وسائط النصوص ذات المصدر المطابق؛ وتعيد مصادر عناوين URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلا من الجلب على جانب الخادم.
    - تعرض `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية وNode للقراءة فقط لعملاء SDK.
    - يعيد `agent.identity.get` هوية المساعد الفعلية لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل الوكيل مهيأة.
    - تبدل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسات لعميل WS الحالي.
    - تبدل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النصوص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصوص محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحدا لمفتاح جلسة مطابق تماما.
    - يحل `sessions.resolve` هدف جلسة أو يجعله قانونيا.
    - ينشئ `sessions.create` إدخال جلسة جديدا.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يلغي `sessions.abort` العمل النشط لجلسة. يمكن للمتصل تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلغ عن النموذج القانوني المحلول إضافة إلى `agentRuntime` الفعلي.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزن كاملا.
    - لا يزال تنفيذ المحادثة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. تتم تسوية `chat.history` للعرض لعملاء واجهة المستخدم: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاءات الأدوات المبتورة) ورموز تحكم النموذج ASCII/العريضة المتسربة، وتحذف صفوف المساعد ذات الرموز الصامتة الصرفة مثل `NO_REPLY` / `no_reply` المطابقة تماما، ويمكن استبدال الصفوف الضخمة بعناصر نائبة.
    - `chat.message.get` هو قارئ الرسائل الكاملة المحدود والإضافي لإدخال نص مرئي واحد. يمرر العملاء `sessionKey`، و`agentId` اختياري عندما يكون اختيار الجلسة محدودا بنطاق وكيل، إضافة إلى `messageId` للنص سبق عرضه عبر `chat.history`، ويعيد Gateway الإسقاط نفسه المسوى للعرض من دون حد الاقتطاع الخفيف لسجل المحادثة عندما يظل الإدخال المخزن متاحا وغير ضخم.
    - يقبل `chat.send` الإعداد أحادي الدور `fastMode: "auto"` لاستخدام الوضع السريع لاستدعاءات النموذج التي تبدأ قبل حد القطع التلقائي، ثم بدء استدعاءات إعادة المحاولة أو الرجوع أو نتيجة الأداة أو المتابعة لاحقا من دون الوضع السريع. يكون حد القطع افتراضيا 60 ثانية ويمكن تهيئته لكل نموذج باستخدام `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. يمكن لمتصل `chat.send` تمرير `fastAutoOnSeconds` أحادي الدور لتجاوز حد القطع لذلك الطلب.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - يدور `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.
    - يبطل `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المتصل.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - تعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمرا إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الصادرة من Node عائدة إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم لعقد Node غير المتصلة/المفصولة.

  </Accordion>

  <Accordion title="عائلات الموافقة">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ أحادية الاستخدام إضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة تنفيذ Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرفة من Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوري أو عند Heartbeat التالي؛ وتدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - يظل `cron.run` إجراء RPC بنمط الإضافة إلى الطابور للتشغيلات اليدوية. ينبغي للعملاء الذين يحتاجون دلالات الإكمال قراءة `runId` المعاد واستطلاع `cron.runs`.
    - يقبل `cron.runs` مرشح `runId` اختياريا غير فارغ بحيث يمكن للعملاء متابعة تشغيل يدوي واحد في الطابور من دون التسابق مع إدخالات سجل أخرى للوظيفة نفسها.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات محادثة واجهة المستخدم مثل `chat.inject` وأحداث المحادثة الأخرى الخاصة بالنصوص فقط. في البروتوكول v4، تحمل حمولات الفروقات `deltaText`؛ وتبقى `message` لقطة المساعد التراكمية. تضبط الاستبدالات غير البادئة `replace=true` وتستخدم `deltaText` كنص بديل.
- `session.message` و`session.operation` و`session.tool`: تحديثات النصوص، وعملية الجلسة قيد التنفيذ، وتدفق الأحداث لجلسة مشتركة.
- `sessions.changed`: تغير فهرس الجلسات أو بيانات التعريف.
- `presence`: تحديثات لقطات حضور النظام.
- `tick`: حدث دوري لحفظ الاتصال / الحيوية.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/وظيفة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغير تهيئة مشغل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### أساليب مساعد Node

- يمكن لعقد Node استدعاء `skills.bins` لجلب القائمة الحالية لتنفيذيات Skills لفحوصات السماح التلقائي.

### إجراءات RPC لسجل المهام

يمكن لعملاء المشغلين فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر إجراءات RPC لسجل المهام. تعيد هذه الأساليب ملخصات مهام منقحة، وليس حالة وقت التشغيل الخام.

- يتطلب `tasks.list` الإذن `operator.read`.
  - المعلمات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من تلك الحالات، و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى `500`، و`cursor` نصي اختياري.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` الإذن `operator.read`.
  - المعلمات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرفات المهام المفقودة شكل خطأ عدم العثور الخاص بـ Gateway.
- يتطلب `tasks.cancel` الإذن `operator.write`.
  - المعلمات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يبلغ `found` عما إذا كان السجل يحتوي على مهمة مطابقة. ويبلغ `cancelled` عما إذا كان وقت التشغيل قبل الإلغاء أو سجله.

يتضمن `TaskSummary` الحقول `id` و`status` وبيانات تعريف اختيارية مثل `kind` و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey` و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية والتقدم والملخص النهائي ونص الخطأ المنقح. يحدد `agentId` الوكيل الذي ينفذ المهمة؛ وتحافظ `sessionKey` و`ownerKey` على سياق الطالب والتحكم.

### أساليب مساعد المشغل

- يمكن للمشغّلين استدعاء `commands.list` ‏(`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي بدون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضي الأسماء الأصلية الواعية بالمزوّد
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة دقيقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` ‏(`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المصدر:
  - `source`: ‏`core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` ‏(`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق المصادقة أو التسليم المقدم من المستدعي.
  - الاستجابة هي إسقاط مشتق من الخادم ومحدد بنطاق الجلسة للمخزون النشط،
    بما في ذلك أدوات الخادم الأساسية وPlugin والقناة وخوادم MCP المكتشفة مسبقا.
  - `tools.effective` للقراءة فقط بالنسبة إلى MCP: قد يعرض كتالوج MCP لجلسة دافئة عبر
    سياسة الأدوات النهائية، لكنه لا ينشئ أوقات تشغيل MCP، ولا يربط وسائل النقل، ولا يصدر
    `tools/list`. إذا لم يوجد كتالوج دافئ مطابق، فقد تتضمن الاستجابة إشعارا مثل
    `mcp-not-yet-connected` أو `mcp-not-yet-listed` أو `mcp-stale-catalog`.
  - تستخدم إدخالات الأدوات الفعّالة `source="core"` أو `source="plugin"` أو `source="channel"` أو
    `source="mcp"`.
- يمكن للمشغّلين استدعاء `tools.invoke` ‏(`operator.write`) لاستدعاء أداة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا وُجد كل من `sessionKey` و`agentId`، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - تتطلب أغلفة النواة الخاصة بالمالك فقط مثل `cron` و`gateway` و`nodes`
    هوية مالك/مسؤول (`operator.admin`) رغم أن طريقة `tools.invoke`
    نفسها هي `operator.write`.
  - الاستجابة مغلف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` ذات نوع. تعيد رفضات الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز خط أنابيب سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` ‏(`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوصات الإعداد وخيارات التثبيت
    المنقّاة دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` ‏(`operator.read`) للحصول على
  بيانات تعريف اكتشاف ClawHub.
- يمكن للمشغّلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` ‏(`operator.admin`) لتهيئة أرشيف مهارة خاصة
  قبل تثبيتها. هذا مسار تحميل إداري منفصل للعملاء الموثوقين،
  وليس تدفق تثبيت Skills العادي في ClawHub، وهو معطل افتراضيا ما لم يتم تمكين
  `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    تحميلا مرتبطا بذلك الـ slug وقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` البايتات عند
    الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. ينجز Commit التحميل فقط؛ ولا يثبت المهارة.
  - أرشيفات Skills المحمّلة هي أرشيفات zip تحتوي على جذر `SKILL.md`. ولا يحدد
    اسم الدليل الداخلي للأرشيف هدف التثبيت أبدا.
- يمكن للمشغّلين استدعاء `skills.install` ‏(`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد مهارة في دليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع التحميل: يثبت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    تحميلا منجزا في دليل `skills/<slug>` لمساحة عمل الوكيل الافتراضية.
    يجب أن تتطابق قيمة slug وقيمة force مع طلب
    `skills.upload.begin` الأصلي. يُرفض هذا الوضع ما لم يتم تمكين
    `skills.install.allowUploadedArchives`. ولا يؤثر هذا الإعداد في تثبيتات ClawHub.
  - وضع مثبت Gateway: يشغّل `{ name, installId, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلنا على مضيف Gateway.
    قد يظل العملاء الأقدم يرسلون `dangerouslyForceUnsafeInstall`؛ هذا الحقل
    مهمل، ولا يُقبل إلا لتوافق البروتوكول، ويتم تجاهله. استخدم
    `security.installPolicy` لقرارات التثبيت التي يملكها المشغّل.
- يمكن للمشغّلين استدعاء `skills.update` ‏(`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub قيمة slug واحدة متتبعة أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يصحح وضع الإعداد قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معامل `view` اختياريا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا تم ضبط `agents.defaults.models`، تكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكيا لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا تم ضبط `agents.defaults.models`، فإنه يظل صاحب الأولوية، بما في ذلك الاكتشاف محدد النطاق بالمزوّد لإدخالات `provider/*`. بدون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مهيأة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، لا منتقيات النماذج العادية.

## موافقات Exec

- عندما يحتاج طلب exec إلى موافقة، يبث Gateway ‏`exec.approval.requested`.
- يحل عملاء المشغّل ذلك عبر استدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` ‏`systemRunPlan` (‏`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة القانونية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` القانوني ذاك كسياق الأمر/cwd/الجلسة المعتمد.
- إذا عدّل مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي المعتمد لـ `system.run`، فإن
  Gateway يرفض التشغيل بدلا من الوثوق بالحمولة المعدّلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` ‏`deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ الخاص بالجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/webchat أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يكون التسليم
  مطلوبا، باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed`
  نفسها الموثقة لـ [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## إدارة الإصدارات

- يعيش `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي. يتطلب العملاء والخوادم الحاليون
  البروتوكول v4.
- تُنشأ المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه الافتراضات. القيم
مستقرة عبر البروتوكول v4 وهي خط الأساس المتوقع لعملاء الجهات الخارجية.

| الثابت                                    | الافتراضي                                            | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة Preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعداد/env رفع ميزانية الخادم/العميل المزدوجة) |
| تراجع إعادة الاتصال الأولي               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتراجع إعادة الاتصال          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| فترة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل tick الافتراضي (قبل `hello-ok`)      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة tick                           | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم عن `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` الفعّالة في `hello-ok`؛ وينبغي للعملاء احترام تلك القيم
بدلا من افتراضات ما قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوّن.
- تلبّي الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` فحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للدخول الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيّداً بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` ويجب أن
  يحتفظ به العميل للاتصالات المستقبلية.
- يجب على العملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن تؤدي إعادة الاتصال باستخدام رمز الجهاز **المحفوظ** هذا أيضاً إلى إعادة استخدام
  مجموعة النطاقات المعتمدة المحفوظة لذلك الرمز. يحافظ هذا على وصول
  القراءة/الفحص/الحالة الذي مُنح بالفعل ويتجنب تقليص إعادة الاتصال بصمت إلى
  نطاق ضمني أضيق مخصص للمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائماً عند ضبطه.
  - يُملأ `auth.token` وفق ترتيب أولوية: الرمز المشترك الصريح أولاً،
    ثم `deviceToken` صريح، ثم رمز محفوظ لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق
    `auth.token`. أي رمز مشترك أو أي رمز جهاز محلول يمنع إرساله.
  - الترقية التلقائية لرمز جهاز محفوظ في إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة مقيّدة بـ **النقاط النهائية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبتة. لا يتأهل `wss://` العام
    من دون تثبيت.
- يعيد تمهيد رمز الإعداد المدمج رمز الجهاز للعقدة الأساسية
  `hello-ok.auth.deviceToken` إضافة إلى رمز مشغّل محدود في
  `hello-ok.auth.deviceTokens` لتسليم موثوق إلى الهاتف المحمول. يتضمن رمز المشغّل
  `operator.talk.secrets` لقراءات تهيئة Talk الأصلية ويستبعد
  `operator.admin` و`operator.pairing`.
- أثناء انتظار اعتماد تمهيد رمز إعداد غير أساسي، تتضمن تفاصيل `PAIRING_REQUIRED`
  ‏`recommendedNextStep: "wait_then_retry"` و`retryable: true`
  و`pauseReconnect: false`. يجب أن يواصل العملاء إعادة الاتصال باستخدام رمز
  التمهيد نفسه إلى أن يُعتمد الطلب أو يصبح الرمز غير صالح.
- احفظ `hello-ok.auth.deviceTokens` فقط عندما يستخدم الاتصال مصادقة التمهيد
  على نقل موثوق مثل `wss://` أو اقتران loopback/محلي.
- إذا قدم العميل `deviceToken` **صريحاً** أو `scopes` صريحة، تبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجع؛ لا يُعاد استخدام النطاقات المخبأة إلا
  عندما يعيد العميل استخدام الرمز المحفوظ لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`). كما يتطلب تدوير أو
  إبطال عقدة أو دور آخر غير مشغّل `operator.admin`.
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط للاستدعاءات من الجهاز نفسه التي صودقت مسبقاً باستخدام
  رمز ذلك الجهاز، بحيث يستطيع العملاء المعتمدون على الرمز فقط حفظ البديل قبل
  إعادة الاتصال. لا تكرر تدويرات المشترك/المسؤول رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محدوداً بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع دور جهاز أو
  استهداف دور جهاز لم يمنحه اعتماد الاقتران قط.
- بالنسبة لجلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة ذاتية النطاق ما لم يكن لدى
  المستدعي أيضاً `operator.admin`: يستطيع المستدعون غير المسؤولين إدارة
  رمز المشغّل فقط لإدخال جهازهم **الخاص**. إدارة رموز العقد والأدوار الأخرى غير المشغّل
  مخصصة للمسؤول فقط، حتى لجهاز المستدعي نفسه.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضاً من مجموعة نطاقات رمز المشغّل
  المستهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون غير المسؤولين
  تدوير أو إبطال رمز مشغّل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - قد يحاول العملاء الموثوقون إعادة محاولة محدودة واحدة باستخدام رمز مخبأ لكل جهاز.
  - إذا فشلت تلك المحاولة، يجب أن يوقف العملاء حلقات إعادة الاتصال التلقائية ويعرضوا إرشادات إجراء للمشغّل.
- يعني `AUTH_SCOPE_MISMATCH` أنه تم التعرف على رمز الجهاز لكنه لا يغطي
  الدور/النطاقات المطلوبة. يجب ألا يعرض العملاء هذا كرمز غير صحيح؛
  اطلب من المشغّل إعادة الاقتران أو اعتماد عقد نطاق أضيق/أوسع.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العقد هوية جهاز ثابتة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways الرموز لكل جهاز + دور.
- تكون اعتمادات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي المحلي
  مفعلاً.
- يتمحور الاعتماد التلقائي للاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضاً مسار اتصال ذاتي ضيق محلي للواجهة الخلفية/الحاوية
  لتدفقات المساعد الموثوقة بالسر المشترك.
- لا تزال اتصالات tailnet على المضيف نفسه أو LAN تُعامل كاتصالات بعيدة لأغراض الاقتران وتتطلب
  اعتماداً.
- يدرج عملاء WS عادة هوية `device` أثناء `connect` (مشغّل +
  عقدة). الاستثناءات الوحيدة للمشغّل من دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن على localhost فقط.
  - مصادقة مشغّل Control UI الناجحة عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر زجاج الطوارئ، تخفيض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback لـ `gateway-client` على مسار
    المساعد الداخلي المحجوز.
- لإغفال هوية الجهاز تبعات على النطاق. عندما يُسمح باتصال مشغّل بلا جهاز
  عبر مسار ثقة صريح، لا يزال OpenClaw يمسح
  النطاقات المعلنة ذاتياً إلى مجموعة فارغة ما لم يكن لذلك المسار استثناء مسمى
  للحفاظ على النطاق. عندها تفشل الطرق المحكومة بالنطاق مع
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` هو مسار حفظ نطاق لكسر زجاج الطوارئ في Control UI. لا يمنح نطاقات لعملاء WebSocket عشوائيين
  مخصصين للواجهة الخلفية أو على هيئة CLI.
- يحافظ مسار مساعد الواجهة الخلفية المحجوز المباشر عبر loopback لـ `gateway-client`
  على النطاقات فقط لاستدعاءات RPC الداخلية المحلية لمستوى التحكم؛ لا تحصل معرّفات الواجهة الخلفية المخصصة
  على هذا الاستثناء.
- يجب على كل الاتصالات توقيع قيمة nonce الخاصة بـ `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين لا يزالون يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` ثابت.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائماً `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، والتي تربط `platform` و`deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تبقى توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات الأجهزة المقترنة
  الوصفية لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختيارياً تثبيت بصمة شهادة Gateway (راجع تهيئة `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة Gateway API الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الاعتمادات، إلخ). يُعرّف السطح الدقيق بواسطة
مخططات TypeBox في `packages/gateway-protocol/src/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
