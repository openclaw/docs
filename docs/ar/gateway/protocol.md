---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - استكشاف أخطاء عدم تطابق البروتوكول أو فشل الاتصال وإصلاحها
    - إعادة توليد مخطط البروتوكول ونماذجه
summary: 'بروتوكول Gateway WebSocket: المصافحة، الإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-11T20:32:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** أثناء
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحد إطارات ما قبل الاتصال بـ 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تمكين التشخيصات،
  تصدر الإطارات الواردة الزائدة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة
  أو محتويات المرفقات أو نص الإطار الخام أو الرموز المميزة أو ملفات تعريف الارتباط أو القيم السرية.

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

بينما لا يزال Gateway ينهي تشغيل الملحقات الجانبية عند بدء التشغيل، يمكن لطلب `connect`
أن يعيد خطأ `UNAVAILABLE` قابلا لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية بدلا من عرضها كفشل مصافحة نهائي.

كل من `server` و`features` و`snapshot` و`policy` مطلوب حسب المخطط
(`src/gateway/protocol/schema/frames.ts`). كذلك فإن `auth` مطلوب ويبلّغ
عن الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختياري ويربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL المحددة النطاق لأسطح Plugin. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا يدعم إعادة بناء Plugin Canvas التجريبية
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين وGateways الحاليين استخدام أسطح Plugin.

عندما لا يصدر رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول الرموز:

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
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويمنع خطوط أساس إقران CLI/الجهاز القديمة من
حظر عمل الواجهة الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
والعملاء الصادرون من المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الإقران وترقية النطاق العادية.

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

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضا إدخالات دور إضافية
محدودة في `deviceTokens`:

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

بالنسبة إلى تدفق تمهيد العقدة/المشغّل المدمج، يبقى رمز العقدة الأساسي
`scopes: []` وأي رمز مشغّل مُسلّم يبقى محدودا بقائمة السماح الخاصة بمشغّل التمهيد
(`operator.approvals`، `operator.read`,
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغّل تفي فقط بطلبات المشغّل، ولا تزال الأدوار غير المشغّلة
تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح عدم التكرار** (راجع المخطط).

## الأدوار + النطاقات

للاطلاع على نموذج نطاقات المشغّل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
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

قد تطلب طرق RPC الخاصة بـ Gateway والمسجلة من Plugin نطاق المشغّل الخاص بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تُحل دائما إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. بعض أوامر الشرطة المائلة التي تصل عبر
`chat.send` تطبق فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب كتابات
`/config set` و`/config unset` الدائمة `operator.admin`.

يملك `node.pair.approve` أيضا فحص نطاق إضافيا وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات مع أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العقد ادعاءات الإمكانات وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen`،
  و`location` و`voice` و`talk`.
- `commands`: قائمة السماح للأوامر الخاصة بالاستدعاء.
- `permissions`: مفاتيح تبديل تفصيلية (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه باعتبارها **ادعاءات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **مشغّلا** و**عقدة** معا.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تبلّغ العقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ كما يمكن للعقد المقترنة أن تبلّغ
  عن حضور خلفي دائم عندما يحدّث حدث عقدة موثوق بيانات تعريف إقرانها.

### حدث بقاء العقدة في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون وضع علامة عليها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغّل غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائما فقط لجلسات أجهزة العقد
المصادق عليها؛ وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد Gateways الناجحة نتيجة مهيكلة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك كـ
استدعاء RPC مُقر به، وليس كاستمرارية حضور دائمة.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات النطاق حتى لا تتلقى الجلسات محددة نطاق الإقران أو الخاصة بالعقدة فقط محتوى الجلسة بشكل سلبي.

- تتطلب **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) على الأقل `operator.read`. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تخضع **بثوث `plugin.*` المعرفة من Plugin** إلى `operator.write` أو `operator.admin`، حسب كيفية تسجيلها بواسطة Plugin.
- تبقى **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال وما إلى ذلك) غير مقيدة حتى تبقى صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- تخضع **عائلات أحداث البث غير المعروفة** لبوابة النطاق افتراضيا (فشل مغلق) ما لم يرخّصها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل حتى تحافظ البثوث على ترتيب أحادي التزايد على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مصفاة بالنطاق من دفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست تفريغا مولدا — `hello-ok.features.methods` قائمة اكتشاف محافظة
مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق Plugin/القناة
المحمّلة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتا أو المفحوصة حديثا.
    - يعيد `diagnostics.stability` مسجل استقرار التشخيصات المحدود الأخير. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، ومعرّفات الجلسات. ولا يحتفظ بنص الدردشة، أو نصوص Webhook، أو مخرجات الأدوات، أو نصوص الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. يتطلب نطاق قراءة المشغّل.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ لا تُضمن الحقول الحساسة إلا لعملاء المشغّل ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة في تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغّل/العقدة المتصلة.
    - يلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - تُرجع `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للمنتقي (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - تُرجع `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - تُرجع `usage.cost` ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - تُرجع `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمينات المخزنة مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً تنفيذ اختبار اتصال مباشر بمزوّد التضمين.
    - تُرجع `doctor.memory.remHarness` معاينة محدودة وللقراءة فقط لحزام REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤسّسًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - تُرجع `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - تُرجع `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - تُرجع `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - تُرجع `channels.status` ملخصات حالة القنوات/Plugin المدمجة + المحزّمة.
    - تُسجّل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - تبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - تنتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا وتبدأ القناة عند النجاح.
    - ترسل `push.test` دفعة APNs اختبارية إلى عقدة iOS مسجلة.
    - تُرجع `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - تحدّث `voicewake.set` مشغلات كلمة التنبيه وتبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسالات المستهدفة بالقناة/الحساب/المحادثة خارج مشغّل الدردشة.
    - تُرجع `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - تُرجع `talk.catalog` كتالوج مزوّدي Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرّفات المزوّدين، والتسميات، وحالة التهيئة، ومعرّفات النماذج/الأصوات المعروضة، والأوضاع القياسية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية، دون إرجاع أسرار المزوّد أو تعديل الإعدادات العامة.
    - تُرجع `talk.config` حمولة إعدادات Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - تنشئ `talk.session.create` جلسة Talk مملوكة من Gateway لـ `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. يتطلب `brain: "direct-tools"` الصلاحية `operator.admin`.
    - تتحقق `talk.session.join` من رمز جلسة غرفة مُدارة، وتصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، وتُرجع بيانات تعريف الغرفة/الجلسة مع أحداث Talk الحديثة دون رمز النص الصريح أو تجزئة الرمز المخزنة.
    - تضيف `talk.session.appendAudio` صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة من Gateway.
    - تقود `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` دورة حياة الدور في الغرفة المُدارة مع رفض الأدوار القديمة قبل مسح الحالة.
    - توقف `talk.session.cancelOutput` إخراج صوت المساعد، أساسًا للمقاطعة المقيّدة بـ VAD في جلسات ترحيل Gateway.
    - تُكمل `talk.session.submitToolResult` استدعاء أداة مزوّد صدر عن جلسة ترحيل فورية مملوكة من Gateway. مرّر `options: { willContinue: true }` لإخراج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تفي نتيجة الأداة باستدعاء المزوّد دون بدء استجابة مساعد فورية أخرى.
    - تغلق `talk.session.close` جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة من Gateway وتصدر أحداث Talk النهائية.
    - تضبط `talk.mode` حالة وضع Talk الحالية وتبثها لعملاء WebChat/واجهة التحكم.
    - تنشئ `talk.client.create` جلسة مزوّد فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما يمتلك Gateway الإعدادات وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - تتيح `talk.client.toolCall` لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. أول أداة مدعومة هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - `talk.event` هي قناة أحداث Talk الوحيدة للمحوّلات الفورية، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، والاجتماعات.
    - تُولّد `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - تُرجع `tts.status` حالة تمكين TTS، والمزوّد النشط، والمزوّدين الاحتياطيين، وحالة إعدادات المزوّد.
    - تُرجع `tts.providers` مخزون مزوّدي TTS المرئي.
    - تبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - تحدّث `tts.setProvider` مزوّد TTS المفضّل.
    - تُشغّل `tts.convert` تحويلًا لمرة واحدة من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعدادات، والتحديث، والمعالج">
    - تعيد `secrets.reload` حل SecretRefs النشطة وتبدّل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - تحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - تُرجع `config.get` لقطة الإعدادات الحالية والتجزئة.
    - تكتب `config.set` حمولة إعدادات تم التحقق منها.
    - تدمج `config.patch` تحديثًا جزئيًا للإعدادات.
    - تتحقق `config.apply` من حمولة الإعدادات الكاملة وتستبدلها.
    - تُرجع `config.schema` حمولة مخطط الإعدادات الحية المستخدمة بواسطة واجهة التحكم وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقول `title` / `description` المستمدة من التسميات ونص المساعدة نفسيهما المستخدمين بواسطة الواجهة، بما في ذلك فروع الكائنات المتداخلة، وأحرف البدل، وعناصر المصفوفات، وتركيبات `anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - تُرجع `config.schema.lookup` حمولة بحث محددة المسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرين للتنقل التفصيلي في واجهة المستخدم/CLI. تحتفظ عقد مخطط البحث بوثائق المستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - تُشغّل `update.run` تدفق تحديث Gateway وتجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين ذوي الجلسة تضمين `continuationMessage` حتى يستأنف بدء التشغيل دور وكيل متابعة واحد عبر قائمة انتظار متابعة إعادة التشغيل. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبلا فترة تهدئة بعد تبديل الحزمة حتى لا تستمر عملية Gateway القديمة في التحميل الكسول من شجرة `dist` مستبدلة.
    - تُرجع `update.status` أحدث علامة حارس مخزنة مؤقتًا لإعادة تشغيل التحديث، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - تُرجع `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات مساحة عمل الإقلاع المعروضة لوكيل.
    - تعرض `tasks.list` و`tasks.get` و`tasks.cancel` دفتر مهام Gateway لعملاء SDK والمشغّلين.
    - تعرض `artifacts.list` و`artifacts.get` و`artifacts.download` ملخصات وتنزيلات العناصر المشتقة من النصوص ضمن نطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة على جانب الخادم ولا تُرجع إلا وسائط النصوص ذات المصدر المطابق؛ وتُرجع مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلًا من الجلب من جانب الخادم.
    - تعرض `environments.list` و`environments.status` اكتشاف بيئات Gateway المحلية وبيئات العقد للقراءة فقط لعملاء SDK.
    - تُرجع `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - تنتظر `agent.wait` انتهاء تشغيل وتُرجع اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - تُرجع `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل وكيل مهيأة.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسة لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - تُرجع `sessions.preview` معاينات نصوص محدودة لمفاتيح جلسات محددة.
    - تُرجع `sessions.describe` صف جلسة Gateway واحدًا لمفتاح جلسة مطابق تمامًا.
    - تحل `sessions.resolve` هدف جلسة أو تضفي عليه صيغة قياسية.
    - تنشئ `sessions.create` إدخال جلسة جديدًا.
    - ترسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - تلغي `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - تحدّث `sessions.patch` بيانات تعريف الجلسة/التجاوزات وتبلّغ عن النموذج القياسي المحلول بالإضافة إلى `agentRuntime` الفعال.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - تُرجع `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء الواجهة: تُزال وسوم التوجيه المضمنة من النص المرئي، وتُزال حمولات XML النصية الصريحة لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) ورموز التحكم المسرّبة في النموذج ASCII/كاملة العرض، وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - تُرجع `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات إقران الأجهزة.
    - تدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - تلغي `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node، والاستدعاء، والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` إقران Node والتحقق من الإقلاع.
    - تُرجع `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - تحدّث `node.rename` تسمية Node مقترنة.
    - تمرر `node.invoke` أمرًا إلى Node متصلة.
    - تُرجع `node.invoke.result` نتيجة طلب استدعاء.
    - ينقل `node.event` الأحداث الصادرة من Node إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لقائمة انتظار Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق الدائم للعقد غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة، إضافة إلى البحث عن الموافقات المعلّقة وإعادة تشغيلها.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلّقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - يدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسات موافقة التنفيذ في Gateway.
    - يدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية على العقدة عبر أوامر ترحيل العقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فوري أو عند Heartbeat التالية؛ وتدير `cron.get` و`cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` الأعمال المجدولة.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث الدردشة الأخرى
  الخاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة
  مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطات حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة cron.
- `shutdown`: إشعار إيقاف تشغيل Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب استدعاء العقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعدادات محفّز كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق مساعدة العقدة

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية بملفات Skills التنفيذية
  لاستخدامها في فحوص السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغّل فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر
استدعاءات RPC لسجل المهام. تعيد هذه الطرق ملخصات مهام منقّحة، لا حالة
وقت التشغيل الخام.

- يتطلب `tasks.list` إذن `operator.read`.
  - المعلمات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"` أو
    `"failed"` أو `"cancelled"` أو `"timed_out"`) أو مصفوفة من تلك الحالات،
    و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى
    `500`، و`cursor` نصي اختياري.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` إذن `operator.read`.
  - المعلمات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرّفات المهام المفقودة شكل خطأ عدم العثور في Gateway.
- يتطلب `tasks.cancel` إذن `operator.write`.
  - المعلمات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يوضّح `found` ما إذا كان السجل يحتوي على مهمة مطابقة. ويوضّح `cancelled`
    ما إذا كان وقت التشغيل قد قبل الإلغاء أو سجّله.

يتضمن `TaskSummary` الحقول `id` و`status` وبيانات وصفية اختيارية مثل `kind`
و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey`
و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية
والتقدّم والملخص النهائي ونص الخطأ المنقّح.

### طرق مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي دون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضي الأسماء الأصلية الواعية بالمزوّد
      عندما تكون متاحة
  - يحمل `textAliases` الأسماء المستعارة المائلة الدقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توافر أوامر Plugin الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات المعلمات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل
  لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات وصفية عن المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما تكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال
  في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستنتج Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلاً من قبول
    سياق مصادقة أو تسليم يقدّمه المستدعي.
  - تكون الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` ذات أنواع. تعيد حالات رفض الموافقة أو السياسة `ok:false` في الحمولة بدلاً من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوص الإعدادات وخيارات التثبيت
    المنقّحة دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات وصفية لاكتشاف ClawHub.
- يمكن للمشغّلين استدعاء `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) لتجهيز أرشيف skill خاص
  قبل تثبيته. هذا مسار رفع إداري منفصل للعملاء الموثوقين،
  وليس تدفق تثبيت skill العادي من ClawHub، وهو معطّل افتراضياً ما لم يكن
  `skills.install.allowUploadedArchives` مفعّلاً.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    رفعاً مرتبطاً بتلك قيمة slug وقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` بايتات عند
    الإزاحة المفككة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. لا يؤدي commit إلا إلى إنهاء الرفع؛ ولا يثبّت skill.
  - أرشيفات skill المرفوعة هي أرشيفات zip تحتوي على جذر `SKILL.md`. ولا يحدد
    اسم الدليل الداخلي للأرشيف هدف التثبيت أبداً.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }` مجلد
    skill في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضية.
  - وضع الرفع: يثبّت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    رفعاً مكتمل commit في دليل `skills/<slug>` ضمن مساحة عمل الوكيل الافتراضية.
    يجب أن تطابق قيمة slug وقيمة force طلب
    `skills.upload.begin` الأصلي. يُرفض هذا الوضع ما لم يكن
    `skills.install.allowUploadedArchives` مفعّلاً. لا يؤثر الإعداد في
    تثبيتات ClawHub.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلناً على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) بوضعين:
  - يحدّث وضع ClawHub قيمة slug واحدة متتبعة أو جميع تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يطبّق وضع الإعدادات تصحيحات على قيم `skills.entries.<skillKey>` مثل `enabled`
    و`apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مهيأً، فستكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكياً لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` مهيأً، فإنه يظل صاحب الأولوية، بما في ذلك الاكتشاف المحدد بنطاق المزوّد لإدخالات `provider/*`. ومن دون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مهيأة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا لواجهات التشخيص والاكتشاف، لا لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحل عملاء المشغّل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` قيمة `systemRunPlan` (الحقول القانونية `argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام
  `systemRunPlan` القانونية تلك كسياق موثوق للأمر/cwd/الجلسة.
- إذا عدّل مستدعٍ `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتوجيه النهائي الموافق عليه إلى `system.run`، فإن
  Gateway يرفض التشغيل بدلاً من الوثوق بالحمولة المعدّلة.

## رجوع تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: أهداف التسليم غير المحلولة أو الداخلية فقط تعيد `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ الخاص بالجلسة فقط عندما يتعذر حل مسار خارجي قابل للتسليم (على سبيل المثال جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات مبهمة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يكون التسليم
  مطلوباً، باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed`
  نفسها الموثقة لـ [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## تحديد الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي. تستخدم العملاء الأصلية حداً أدنى v3 حتى تتمكن
  عملاء v4 الإضافية من الوصول إلى بوابات v3.
- تُولَّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
ثابتة عبر protocol v4 وهي خط الأساس المتوقع للعملاء الخارجيين.

| الثابت                                  | الافتراضي                                               | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| مهلة الطلب (لكل RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن أن يرفع config/env ميزانية الخادم/العميل المقترنة) |
| تأخير إعادة الاتصال الأولي                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى تأخير لإعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| فترة السماح للإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة النبض                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 ميغابايت)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم عن القيم الفعلية لـ `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي للعملاء الالتزام بهذه القيم
بدلا من الافتراضيات السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المكوَّن.
- أوضاع حاملة الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير المعتمدة على local loopback تفي بفحص مصادقة الاتصال من
  ترويسات الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للإدخال الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على إدخال عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيَّدا بدور الاتصال + النطاقات. يُعاد في `hello-ok.auth.deviceToken` وينبغي
  أن يحفظه العميل لاستخدامه في الاتصالات المستقبلية.
- ينبغي للعملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزَّن** استخدام
  مجموعة النطاقات الموافق عليها والمخزنة لذلك الرمز أيضا. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي مُنح مسبقا، ويتجنب تضييق إعادة الاتصالات بصمت إلى
  نطاق ضمني مقتصر على المدير فقط.
- تجميع مصادقة الاتصال من جانب العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل، ويُمرَّر دائما عند ضبطه.
  - يُملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا ينتج أي مما سبق
    `auth.token`. يمنعه الرمز المشترك أو أي رمز جهاز محلول.
  - تخضع الترقية التلقائية لرمز جهاز مخزن عند إعادة محاولة
    `AUTH_TOKEN_MISMATCH` لمرة واحدة لـ **نقاط النهاية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم bootstrap.
  احفظها فقط عندما يستخدم الاتصال مصادقة bootstrap على نقل موثوق
  مثل `wss://` أو الاقتران عبر loopback/محلي.
- إذا قدّم العميل `deviceToken` **صريحا** أو `scopes` صريحة، فإن
  مجموعة النطاقات التي طلبها المستدعي تبقى المرجع؛ لا يُعاد استخدام النطاقات المخزنة مؤقتا إلا
  عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يعكس رمز الحامل البديل
  فقط للاستدعاءات من الجهاز نفسه التي تمت مصادقتها بالفعل باستخدام
  رمز ذلك الجهاز، بحيث يمكن للعملاء المعتمدين على الرمز فقط حفظ البديل قبل
  إعادة الاتصال. لا تعكس تدويرات السر المشترك/المدير رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محصورا في مجموعة الأدوار الموافق عليها
  والمسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع أو
  استهداف دور جهاز لم تمنحه موافقة الاقتران مطلقا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن لدى
  المستدعي أيضا `operator.admin`: يستطيع المستدعون غير المديرين إزالة/إبطال/تدوير
  إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضا من مجموعة نطاقات
  رمز المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون غير المديرين
  تدوير أو إبطال رمز مشغل أوسع مما لديهم بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز مخزن لكل جهاز.
  - إذا فشلت تلك المحاولة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء للمشغل.
- يعني `AUTH_SCOPE_MISMATCH` أن رمز الجهاز تم التعرف عليه لكنه لا يغطي
  الدور/النطاقات المطلوبة. ينبغي ألا يقدّم العملاء هذا على أنه رمز سيئ؛
  اطلب من المشغل إعادة الاقتران أو الموافقة على عقد نطاق أضيق/أوسع.

## هوية الجهاز + الاقتران

- ينبغي أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزا لكل جهاز + دور.
- موافقات الاقتران مطلوبة لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة التلقائية المحلية
  مفعّلة.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- يمتلك OpenClaw أيضا مسار اتصال ذاتي ضيق للخلفية/الحاوية المحلية من أجل
  تدفقات المساعد الموثوقة بالسر المشترك.
- ما تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة للاقتران
  وتتطلب موافقة.
- عادةً ما يتضمن عملاء WS هوية `device` أثناء `connect` (المشغل +
  node). استثناءات المشغل دون جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن المقتصر على localhost.
  - نجاح مصادقة واجهة Control UI للمشغل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر طارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback لـ `gateway-client` والمصادق عليها باستخدام
    رمز/كلمة مرور Gateway المشتركة.
- يجب على جميع الاتصالات توقيع nonce في `connect.challenge` المقدم من الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسله فارغا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام.         |

هدف الترحيل:

- انتظر دائما `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، والتي تربط `platform` و`deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية للأجهزة
  المقترنة ما يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريا تثبيت بصمة شهادة Gateway (راجع إعداد `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة Gateway API الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، Nodes، الموافقات، إلخ). يُعرَّف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
