---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - استكشاف أخطاء عدم تطابق البروتوكول أو فشل الاتصال وإصلاحها
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket لـ Gateway: المصافحة، الإطارات، وتحديد الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-06T07:56:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** في
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عُقد iOS/Android، العُقد
بلا واجهة) عبر WebSocket ويعلنون عن **الدور** + **النطاق** عند
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- إطارات ما قبل الاتصال محددة بحد أقصى 64 KiB. بعد مصافحة ناجحة، يجب على العملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز الأسباب الآمنة. ولا تحتفظ بمتن الرسالة،
  أو محتويات المرفقات، أو متن الإطار الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية.

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

بينما لا يزال Gateway ينهي العوامل الجانبية لبدء التشغيل، يمكن لطلب `connect`
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. يجب على العملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلاً من عرضها كفشل نهائي
في المصافحة.

كل من `server` و`features` و`snapshot` و`policy` مطلوب وفق المخطط
(`src/gateway/protocol/schema/frames.ts`). كذلك `auth` مطلوب أيضًا ويبلّغ
عن الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عند عدم إصدار رمز جهاز، يبلّغ `hello-ok.auth` عن الأذونات المتفاوض عليها
بدون حقول رموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

قد يحذف عملاء الخلفية الموثوقون ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) الحقل `device` على اتصالات local loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار مخصص
لاستدعاءات RPC الداخلية لمستوى التحكم، ويحافظ على أساسيات إقران CLI/الجهاز القديمة من
حظر عمل الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العُقد، وعملاء رموز الجهاز/هوية الجهاز الصريحة
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

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضًا إدخالات دور
محدودة إضافية في `deviceTokens`:

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

بالنسبة إلى تدفق تمهيد العقدة/المشغل المدمج، يبقى رمز العقدة الأساسي
`scopes: []` وأي رمز مشغل مُسلَّم يبقى محدودًا بقائمة السماح لمشغل التمهيد
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل لا تلبي إلا طلبات المشغل، ولا تزال الأدوار غير المشغلة
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

قد تطلب طرق RPC الخاصة بـ Gateway المسجلة من Plugin نطاق مشغل خاصًا بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب كتابات
`/config set` و`/config unset` الدائمة النطاق `operator.admin`.

يملك `node.pair.approve` أيضًا فحص نطاق إضافيًا وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### الإمكانات/الأوامر/الأذونات (العقدة)

تعلن العُقد عن ادعاءات الإمكانات عند وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى مثل `camera` و`canvas` و`screen` و
  `location` و`voice` و`talk`.
- `commands`: قائمة السماح للأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل تفصيلية (مثل `screen.record`، `camera.capture`).

يتعامل Gateway مع هذه باعتبارها **ادعاءات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` كي تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تبلّغ العُقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعُقد المقترنة أيضًا الإبلاغ
  عن حضور خلفية دائم عندما يحدّث حدث عقدة موثوق بيانات تعريف الإقران الخاصة بها.

### حدث بقاء Node في الخلفية

قد تستدعي العُقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية بدون وسمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` هو تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh` أو
`significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغلات غير المعروفة إلى
`background` بواسطة Gateway قبل الاستمرار. يكون الحدث دائمًا فقط لجلسات جهاز العقدة
المصادق عليها؛ أما الجلسات بلا جهاز أو غير المقترنة فتعيد `handled: false`.

تعيد بوابات Gateway الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال بوابات Gateway الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ يجب على العملاء التعامل مع ذلك كاستدعاء RPC
مؤكد، وليس كاستمرارية حضور دائمة.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لبوابات النطاق بحيث لا تتلقى الجلسات محددة الإقران أو الخاصة بالعقدة فقط محتوى الجلسات بشكل سلبي.

- **إطارات المحادثة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب `operator.read` على الأقل. الجلسات التي لا تملك `operator.read` تتجاوز هذه الإطارات بالكامل.
- **عمليات بث `plugin.*` المعرفة من Plugin** تخضع لـ `operator.write` أو `operator.admin`، حسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، إلخ) تبقى غير مقيدة كي تظل صحة النقل قابلة للملاحظة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تخضع لبوابات النطاق افتراضيًا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحافظ كل اتصال عميل على رقم تسلسلي خاص به لكل عميل حتى تحفظ عمليات البث الترتيب الرتيب على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مفلترة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغًا مولدًا — `hello-ok.features.methods` هي قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق
Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، وليس تعدادًا كاملاً
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتًا أو المفحوصة حديثًا.
    - يعيد `diagnostics.stability` مسجل استقرار التشخيصات الحديث والمحدود. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugins، ومعرفات الجلسات. ولا يحتفظ بنص المحادثة، أو متون Webhook، أو مخرجات الأدوات، أو متون الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة المشغل مطلوب.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ تُضمّن الحقول الحساسة فقط لعملاء المشغلين ذوي نطاق الإدارة.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/العقدة المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - `models.list` يُرجع كتالوج النماذج المسموح بها في وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للاختيار (`agents.defaults.models` أولًا، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - `usage.status` يُرجع ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - `usage.cost` يُرجع ملخصات استخدام التكلفة المجمّعة لنطاق تاريخ.
    - `doctor.memory.status` يُرجع جاهزية الذاكرة المتجهية / التضمينات المخزنة مؤقتًا لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمينات.
    - `doctor.memory.remHarness` يُرجع معاينة محدودة وللقراءة فقط لأداة REM لعملاء مستوى التحكم البعيد. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown مؤسسًا معروضًا، ومرشحي ترقية عميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - `sessions.usage` يُرجع ملخصات الاستخدام لكل جلسة.
    - `sessions.usage.timeseries` يُرجع استخدام السلاسل الزمنية لجلسة واحدة.
    - `sessions.usage.logs` يُرجع إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - `channels.status` يُرجع ملخصات حالة القنوات/Plugin المدمجة والمضمّنة.
    - `channels.logout` يسجّل الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - `web.login.start` يبدأ تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - `web.login.wait` ينتظر اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - `push.test` يرسل إشعار APNs اختباريًا إلى Node iOS مسجلة.
    - `voicewake.get` يُرجع مشغلات كلمة التنبيه المخزنة.
    - `voicewake.set` يحدّث مشغلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسال الموجّه إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
    - `logs.tail` يُرجع ذيل سجل ملف Gateway المكوّن مع عناصر تحكم المؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - `talk.catalog` يُرجع كتالوج مزوّد Talk للقراءة فقط للكلام، والتفريغ المتدفق، والصوت الفوري. يتضمن معرّفات المزوّدين، والتسميات، وحالة التكوين، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع القياسية، ووسائل النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية من دون إرجاع أسرار المزوّدين أو تعديل الإعدادات العامة.
    - `talk.config` يُرجع حمولة إعدادات Talk الفعلية؛ يتطلب `includeSecrets` صلاحية `operator.talk.secrets` (أو `operator.admin`).
    - `talk.session.create` ينشئ جلسة Talk مملوكة لـ Gateway لـ `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. يتطلب `brain: "direct-tools"` صلاحية `operator.admin`.
    - `talk.session.join` يتحقق من صحة رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، ويُرجع بيانات تعريف الغرفة/الجلسة بالإضافة إلى أحداث Talk الحديثة من دون الرمز النصي الصريح أو تجزئة الرمز المخزنة.
    - `talk.session.appendAudio` يضيف صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والتفريغ المملوكة لـ Gateway.
    - `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` تقود دورة حياة الدور في الغرفة المُدارة مع رفض الدور القديم قبل مسح الحالة.
    - `talk.session.cancelOutput` يوقف إخراج صوت المساعد، أساسًا للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - `talk.session.submitToolResult` يُكمل استدعاء أداة مزوّد صادرًا عن جلسة ترحيل فورية مملوكة لـ Gateway.
    - `talk.session.close` يغلق جلسة ترحيل أو تفريغ أو غرفة مُدارة مملوكة لـ Gateway ويصدر أحداث Talk نهائية.
    - `talk.mode` يعيّن/يبث حالة وضع Talk الحالي لعملاء WebChat/Control UI.
    - `talk.client.create` ينشئ جلسة مزوّد فورية مملوكة للعميل باستخدام `webrtc` أو `provider-websocket` بينما تملك Gateway الإعدادات وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - `talk.client.toolCall` يتيح لوسائل النقل الفورية المملوكة للعميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. الأداة المدعومة الأولى هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة العادية قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - `talk.event` هي قناة أحداث Talk الوحيدة للمحوّلات الفورية، والتفريغ، وSTT/TTS، والغرفة المُدارة، والاتصال الهاتفي، والاجتماعات.
    - `talk.speak` يركّب الكلام عبر مزوّد كلام Talk النشط.
    - `tts.status` يُرجع حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الاحتياط، وحالة إعدادات المزوّد.
    - `tts.providers` يُرجع مخزون مزوّدي TTS المرئي.
    - `tts.enable` و`tts.disable` يبدّلان حالة تفضيلات TTS.
    - `tts.setProvider` يحدّث مزوّد TTS المفضّل.
    - `tts.convert` يشغّل تحويلًا واحدًا من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار والإعدادات والتحديث والمعالج">
    - `secrets.reload` يعيد حل SecretRefs النشطة ويستبدل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - `secrets.resolve` يحل تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - `config.get` يُرجع لقطة الإعدادات الحالية والتجزئة.
    - `config.set` يكتب حمولة إعدادات مُتحققًا منها.
    - `config.patch` يدمج تحديث إعدادات جزئيًا.
    - `config.apply` يتحقق من حمولة الإعدادات الكاملة ويستبدلها.
    - `config.schema` يُرجع حمولة مخطط الإعدادات الحية المستخدمة بواسطة أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف الحقول `title` / `description` المشتقة من التسميات نفسها ونص المساعدة المستخدمين في واجهة المستخدم، بما في ذلك فروع تكوين الكائنات المتداخلة، والبدل، وعناصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقل مطابقة.
    - `config.schema.lookup` يُرجع حمولة بحث محددة المسار لمسار إعداد واحد: المسار الموحّد، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرة للتنقل التفصيلي في UI/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
    - `update.run` يشغّل تدفق تحديث Gateway ويجدول إعادة التشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` لكي يستأنف بدء التشغيل دور وكيل متابعة واحدًا عبر طابور استمرار إعادة التشغيل. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة ومن دون فترة تهدئة بعد تبديل الحزمة حتى لا تستمر عملية Gateway القديمة في التحميل الكسول من شجرة `dist` مستبدلة.
    - `update.status` يُرجع أحدث علامة مخزنة مؤقتًا لإعادة تشغيل التحديث، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عندما يكون متاحًا.
    - `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` تعرض معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - `agents.list` يُرجع إدخالات الوكيل المكوّنة، بما في ذلك النموذج الفعلي وبيانات تعريف وقت التشغيل.
    - `agents.create` و`agents.update` و`agents.delete` تدير سجلات الوكلاء وربط مساحة العمل.
    - `agents.files.list` و`agents.files.get` و`agents.files.set` تدير ملفات مساحة عمل التمهيد المعروضة لوكيل.
    - `artifacts.list` و`artifacts.get` و`artifacts.download` تعرض ملخصات وتنزيلات الآثار المشتقة من النص المنسوخ لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة من جهة الخادم ولا تُرجع إلا وسائط النص المنسوخ ذات المصدر المطابق؛ وتُرجع مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلًا من الجلب من جهة الخادم.
    - `environments.list` و`environments.status` تعرضان اكتشاف بيئات Gateway المحلية وNode للقراءة فقط لعملاء SDK.
    - `agent.identity.get` يُرجع هوية المساعد الفعلية لوكيل أو جلسة.
    - `agent.wait` ينتظر انتهاء تشغيل ويُرجع اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - `sessions.list` يُرجع فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون واجهة خلفية لوقت تشغيل الوكيل مكوّنة.
    - `sessions.subscribe` و`sessions.unsubscribe` يبدّلان اشتراكات أحداث تغيير الجلسة لعميل WS الحالي.
    - `sessions.messages.subscribe` و`sessions.messages.unsubscribe` يبدّلان اشتراكات أحداث النص المنسوخ/الرسائل لجلسة واحدة.
    - `sessions.preview` يُرجع معاينات نص منسوخ محدودة لمفاتيح جلسات محددة.
    - `sessions.describe` يُرجع صف جلسة Gateway واحدًا لمفتاح جلسة مطابق تمامًا.
    - `sessions.resolve` يحل هدف جلسة أو يجعله قياسيًا.
    - `sessions.create` ينشئ إدخال جلسة جديدًا.
    - `sessions.send` يرسل رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - `sessions.abort` يجهض العمل النشط لجلسة. يمكن للمستدعي تمرير `key` بالإضافة إلى `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي تستطيع Gateway حلها إلى جلسة.
    - `sessions.patch` يحدّث بيانات تعريف/تجاوزات الجلسة ويبلّغ عن النموذج القياسي المحلول بالإضافة إلى `agentRuntime` الفعلي.
    - `sessions.reset` و`sessions.delete` و`sessions.compact` تنفذ صيانة الجلسة.
    - `sessions.get` يُرجع صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء واجهة المستخدم: تُزال وسوم التوجيه المضمنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المبتورة) ورموز تحكم النموذج المسرّبة ASCII/كاملة العرض، وتُحذف صفوف المساعد ذات الرموز الصامتة الصرفة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - `device.pair.list` يُرجع الأجهزة المقترنة المعلقة والموافق عليها.
    - `device.pair.approve` و`device.pair.reject` و`device.pair.remove` تدير سجلات إقران الأجهزة.
    - `device.token.rotate` يدوّر رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.
    - `device.token.revoke` يلغي رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` تغطي إقران Node والتحقق من التمهيد.
    - `node.list` و`node.describe` يُرجعان حالة Node المعروفة/المتصلة.
    - `node.rename` يحدّث تسمية Node مقترنة.
    - `node.invoke` يمرر أمرًا إلى Node متصلة.
    - `node.invoke.result` يُرجع نتيجة طلب استدعاء.
    - `node.event` يحمل الأحداث الصادرة من Node عائدة إلى Gateway.
    - `node.canvas.capability.refresh` يحدّث رموز قدرة canvas محددة النطاق.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - `node.pending.enqueue` و`node.pending.drain` تديران العمل المعلق المتين لعُقد Node غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - يغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة إضافة إلى البحث عن الموافقات المعلقة وإعادة تشغيلها.
    - ينتظر `exec.approval.waitDecision` موافقة exec معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - يدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في Gateway.
    - يدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية على Node عبر أوامر ترحيل Node.
    - يغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يحدد `wake` موعد حقن نص إيقاظ فوري أو عند Heartbeat التالي؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective` و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وغيرها من أحداث الدردشة الخاصة بالسجل فقط.
- `session.message` و`session.tool`: تحديثات السجل/تدفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو البيانات الوصفية.
- `presence`: تحديثات لقطات حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعدادات مشغّل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق Node المساعدة

- يمكن للعُقد استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية من أجل فحوصات السماح التلقائي.

### طرق المشغّل المساعدة

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون الشرطة المائلة البادئة `/`
    - يعيد `native` ومسار `both` الافتراضيان أسماء أصلية واعية بالمزوّد عند توفرها
  - يحمل `textAliases` أسماء بديلة بشرطة مائلة مطابقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات وصفية للمصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستنتج Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلاً من قبول سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن، بما في ذلك أدوات core وPlugin والقناة.
- يمكن للمشغّلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و`idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول `agentId`.
  - الاستجابة هي غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول `error` منمّطة. تعيد حالات الرفض بسبب الموافقة أو السياسة `ok:false` في الحمولة بدلاً من تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات الناقصة وفحوصات الإعدادات وخيارات التثبيت المنقّاة من دون كشف قيم الأسرار الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) لبيانات تعريف الاكتشاف في ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }` مجلد skill في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` إجراء `metadata.openclaw.install` مصرّحاً به على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug واحداً متتبعاً أو كل تثبيتات ClawHub المتتبعة في مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و`apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معامل `view` اختيارياً:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا تم إعداد `agents.defaults.models`، فستكون الاستجابة هي الكتالوج المسموح؛ وإلا فستكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا تم إعداد `agents.defaults.models`، فسيظل له الأسبقية. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج معدّة.
- `"all"`: كتالوج Gateway الكامل، متجاوزاً `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات exec

- عندما يحتاج طلب exec إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحل عملاء المشغّل ذلك عبر استدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` قيمة `systemRunPlan` (بيانات وصفية معيارية لـ `argv`/`cwd`/`rawCommand`/الجلسة). تُرفض الطلبات التي لا تتضمن `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام `systemRunPlan` المعياري هذا بصفته سياق الأمر/cwd/الجلسة الموثوق.
- إذا غيّر مستدعٍ `command` أو `rawCommand` أو `cwd` أو `agentId` أو `sessionKey` بين التحضير وإعادة توجيه `system.run` النهائية الموافق عليها، يرفض Gateway التشغيل بدلاً من الوثوق بالحمولة المعدّلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).

## تعيين الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُولّد المخططات والنماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم مستقرة عبر protocol v3 وهي خط الأساس المتوقع لعملاء الجهات الخارجية.

| الثابت                                    | الافتراضي                                            | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة Preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للإعدادات/البيئة رفع ميزانية الخادم/العميل المقترنين) |
| التراجع الأولي لإعادة الاتصال            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتراجع إعادة الاتصال         | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| قيد إعادة المحاولة السريعة بعد إغلاق device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| مهلة السماح لإيقاف قسري قبل `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل tick الافتراضي (قبل `hello-ok`)      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق مهلة tick                           | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 ميغابايت)                     | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم قيم `policy.tickIntervalMs` و`policy.maxPayload` و`policy.maxBufferedBytes` الفعالة في `hello-ok`؛ ينبغي للعملاء الالتزام بهذه القيم بدلاً من الافتراضات السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المُهيأ.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير `loopback`
  `gateway.auth.mode: "trusted-proxy"` تستوفي فحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال
  بالسر المشترك بالكامل؛ لا تعرض هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** بنطاق يقتصر على دور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` وينبغي أن يحتفظ به
  العميل للاتصالات المستقبلية.
- ينبغي للعملاء الاحتفاظ بالرمز الأساسي `hello-ok.auth.deviceToken` بعد أي
  اتصال ناجح.
- يجب أن تؤدي إعادة الاتصال باستخدام رمز الجهاز **المخزن** هذا أيضاً إلى
  إعادة استخدام مجموعة النطاقات المعتمدة والمخزنة لذلك الرمز. يحافظ ذلك على
  وصول القراءة/الفحص/الحالة الذي مُنح مسبقاً ويتجنب تضييق إعادة الاتصال
  بصمت إلى نطاق ضمني أضيق يقتصر على المسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائماً عند ضبطه.
  - يُملأ `auth.token` حسب ترتيب الأولوية: رمز مشترك صريح أولاً،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا ينتج أي مما سبق
    `auth.token`. يمنع إرساله وجود رمز مشترك أو أي رمز جهاز محسوم.
  - تخضع الترقية التلقائية لرمز جهاز مخزن عند إعادة المحاولة لمرة واحدة بسبب
    `AUTH_TOKEN_MISMATCH` إلى **النقاط الطرفية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم تمهيدية.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة تمهيدية على نقل موثوق مثل
  `wss://` أو الاقتران عبر loopback/محلي.
- إذا قدم العميل `deviceToken` **صريحاً** أو `scopes` صريحة، فتبقى مجموعة
  النطاقات التي طلبها ذلك المستدعي هي المرجع؛ لا يُعاد استخدام النطاقات
  المخزنة مؤقتاً إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. ولا يعكس رمز الحامل
  البديل إلا لاستدعاءات الجهاز نفسه التي تكون مصادقاً عليها مسبقاً برمز ذلك
  الجهاز، حتى يتمكن العملاء المعتمدون على الرمز فقط من الاحتفاظ بالبديل قبل
  إعادة الاتصال. تدويرات الرموز المشتركة/المسؤول لا تعكس رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محصوراً بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز أن يوسع أو يستهدف
  دور جهاز لم يمنحه اعتماد الاقتران من قبل.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي أيضاً `operator.admin`: لا يستطيع المستدعون غير المسؤولين
  إزالة/إبطال/تدوير إلا إدخال جهازهم **الخاص**.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضاً من مجموعة نطاقات
  رمز المشغل الهدف مقابل نطاقات الجلسة الحالية للمستدعي. لا يستطيع
  المستدعون غير المسؤولين تدوير أو إبطال رمز مشغل أوسع مما يملكونه بالفعل.
- تشمل إخفاقات المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة برمز مخزن مؤقتاً لكل جهاز.
  - إذا فشلت إعادة المحاولة تلك، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء للمشغل.

## هوية الجهاز + الاقتران

- ينبغي للعُقد تضمين هوية جهاز مستقرة (`device.id`) مشتقة من بصمة
  زوج مفاتيح.
- تصدر Gateways رموزاً لكل جهاز + دور.
- يلزم اعتماد الاقتران لمعرفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي
  المحلي مفعلاً.
- يتركز الاعتماد التلقائي للاقتران على اتصالات local loopback المباشرة.
- لدى OpenClaw أيضاً مسار اتصال ذاتي ضيق محلي للخلفية/الحاوية لتدفقات
  المساعد الموثوقة ذات السر المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة
  للاقتران وتتطلب اعتماداً.
- عادةً ما يتضمن عملاء WS هوية `device` أثناء `connect` (المشغل +
  العقدة). الاستثناءات الوحيدة للمشغل دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن الخاص بالمضيف المحلي فقط.
  - نجاح مصادقة واجهة تحكم المشغل في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (إجراء طارئ، خفض أمني شديد).
  - استدعاءات RPC الخلفية المباشرة عبر loopback من `gateway-client` والمصادق عليها
    برمز/كلمة مرور Gateway المشتركة.
- يجب على كل الاتصالات توقيع قيمة nonce في `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين لا يزالون يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` ثابت.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقع العميل بقيمة nonce قديمة/خاطئة.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائماً `connect.challenge`.
- وقع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، والتي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للجهاز المقترن يظل يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختيارياً تثبيت بصمة شهادة Gateway (راجع تهيئة `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة برمجة تطبيقات Gateway الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الاعتمادات، وما إلى ذلك). يُحدد السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
