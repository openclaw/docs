---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو حالات فشل الاتصال
    - إعادة توليد مخطط البروتوكول ونماذجه
summary: 'بروتوكول WebSocket لـ Gateway: المصافحة، الإطارات، إدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-10T19:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل العقد** لـ
OpenClaw. يتصل جميع العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، والعقد عديمة الواجهة)
عبر WebSocket ويصرّحون بـ **الدور** + **النطاق** أثناء
المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- إطارات ما قبل الاتصال محددة بحد أقصى 64 KiB. بعد مصافحة ناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تُصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. ولا تحتفظ بنص الرسالة
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
    "minProtocol": 4,
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
إرجاع خطأ `UNAVAILABLE` قابل لإعادة المحاولة مع ضبط `details.reason` على
`"startup-sidecars"` و`retryAfterMs`. ينبغي للعملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية بدلا من عرضها كفشل نهائي
للمصافحة.

`server` و`features` و`snapshot` و`policy` كلها مطلوبة بواسطة المخطط
(`src/gateway/protocol/schema/frames.ts`). كذلك `auth` مطلوبة وتبلغ عن
الدور/النطاقات المتفاوض عليها. `pluginSurfaceUrls` اختيارية وتربط أسماء أسطح Plugin،
مثل `canvas`، بعناوين URL مستضافة ومحددة النطاق.

قد تنتهي صلاحية عناوين URL لأسطح Plugin محددة النطاق. يمكن للعقد استدعاء
`node.pluginSurface.refresh` مع `{ "surface": "canvas" }` لتلقي إدخال جديد
في `pluginSurfaceUrls`. لا تدعم إعادة هيكلة Plugin Canvas التجريبية
مسار التوافق المهمل `canvasHostUrl` أو `canvasCapability` أو
`node.canvas.capability.refresh`؛ يجب على العملاء الأصليين الحاليين
و Gateways استخدام أسطح Plugin.

عند عدم إصدار رمز مميز للجهاز، تبلغ `hello-ok.auth` عن الأذونات المتفاوض عليها
دون حقول الرموز المميزة:

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
لاستدعاءات RPC الداخلية الخاصة بمستوى التحكم، ويمنع خطوط أساس اقتران CLI/الجهاز القديمة من
حظر عمل الواجهة الخلفية المحلي مثل تحديثات جلسات الوكلاء الفرعيين. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء العقد، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الاقتران وترقية النطاق العادية.

عند إصدار رمز مميز للجهاز، يتضمن `hello-ok` أيضا:

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
إضافية ومحدودة في `deviceTokens`:

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

بالنسبة لتدفق تمهيد العقدة/المشغل المدمج، يبقى رمز العقدة الأساسي
`scopes: []` ويبقى أي رمز مشغل تم تسليمه محدودا بقائمة السماح الخاصة بمشغل التمهيد
(`operator.approvals` و`operator.read` و
`operator.talk.secrets` و`operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات المشغل لا تلبي إلا طلبات المشغل، وتظل الأدوار غير المشغلة
بحاجة إلى نطاقات تحت بادئة الدور الخاصة بها.

### مثال عقدة

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

للاطلاع على نموذج نطاق المشغل الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات المشغل](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/واجهة المستخدم/الأتمتة).
- `node` = مضيف القدرات (camera/screen/canvas/system.run).

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

قد تطلب أساليب RPC الخاصة بـ Gateway والمسجلة من Plugin نطاق المشغل الخاص بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`
و`update.*`) تتحول دائما إلى `operator.admin`.

نطاق الأسلوب هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب عمليات كتابة
`/config set` و`/config unset` الدائمة النطاق `operator.admin`.

لدى `node.pair.approve` أيضا فحص نطاق إضافي وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تتضمن أوامر عقد غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (العقدة)

تصرح العقد بادعاءات القدرة وقت الاتصال:

- `caps`: فئات قدرات عالية المستوى مثل `camera` و`canvas` و`screen`
  و`location` و`voice` و`talk`.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه على أنها **ادعاءات** ويفرض قوائم السماح من جانب الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` بحيث تستطيع واجهات المستخدم إظهار صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معا.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تبلغ العقد المتصلة
  عن وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن للعقد المقترنة أيضا الإبلاغ عن
  حضور خلفي دائم عندما يحدث حدث عقدة موثوق بيانات تعريف الاقتران الخاصة بها.

### حدث بقاء العقدة في الخلفية

قد تستدعي العقد `node.event` مع `event: "node.presence.alive"` لتسجيل أن عقدة مقترنة كانت
حية أثناء إيقاظ في الخلفية دون تعليمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background` أو `silent_push` أو `bg_app_refresh`
أو `significant_location` أو `manual` أو `connect`. تُطبّع سلاسل المشغلات غير المعروفة إلى
`background` بواسطة Gateway قبل الاستمرار. لا يكون الحدث دائما إلا لجلسات أجهزة العقد
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

قد تظل Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ ينبغي للعملاء التعامل مع ذلك كاستدعاء RPC
تم الإقرار به، وليس كاستمرار دائم للحضور.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم لتقييد النطاق بحيث لا تتلقى الجلسات محددة الاقتران أو الخاصة بالعقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب `operator.read` على الأقل. تتجاوز الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة من Plugin** مقيدة إلى `operator.write` أو `operator.admin`، بحسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/قطع الاتصال، وما إلى ذلك) تبقى غير مقيدة بحيث تظل صحة النقل قابلة للمراقبة لكل جلسة مصادق عليها.
- **عائلات أحداث البث غير المعروفة** تكون مقيدة النطاق افتراضيا (تفشل مغلقة) ما لم يخففها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل بحيث تحافظ عمليات البث على ترتيب رتيب على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مفلترة حسب النطاق من تدفق الأحداث.

## عائلات أساليب RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست تفريغا مولدا — `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى
صادرات أساليب Plugin/القناة المحملة. تعامل معها كاكتشاف للميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتا أو المفحوصة حديثا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الحديث. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والعدادات، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugins، ومعرفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية. يتطلب نطاق قراءة المشغل.
    - يعيد `status` ملخص Gateway بأسلوب `/status`؛ ولا تُدرج الحقول الحساسة إلا لعملاء المشغلين محددي النطاق الإداري.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات الترحيل والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة المشغل/العقدة المتصلة.
    - يلحق `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - `models.list` يعيد كتالوج النماذج المسموح به وقت التشغيل. مرّر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للمُنتقي (`agents.defaults.models` أولاً، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - `usage.status` يعيد ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - `usage.cost` يعيد ملخصات مجمّعة لاستخدام التكلفة لنطاق تاريخي.
    - `doctor.memory.status` يعيد جاهزية الذاكرة المتجهية / التضمين المخزّن مؤقتاً لمساحة عمل الوكيل الافتراضي النشط. مرّر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحةً اختبار اتصال مباشر بمزوّد التضمين.
    - `doctor.memory.remHarness` يعيد معاينة محدودة وللقراءة فقط لحزام REM لعملاء مستوى التحكم البعيد. يمكن أن يتضمن مسارات مساحة العمل، ومقتطفات ذاكرة، وMarkdown مرتكزاً معروضاً، ومرشحي ترقية عميقة، لذا يحتاج المستدعون إلى `operator.read`.
    - `sessions.usage` يعيد ملخصات الاستخدام لكل جلسة.
    - `sessions.usage.timeseries` يعيد استخدام السلاسل الزمنية لجلسة واحدة.
    - `sessions.usage.logs` يعيد إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - `channels.status` يعيد ملخصات حالة القنوات/Plugin المضمنة والمجمّعة.
    - `channels.logout` يسجّل الخروج من قناة/حساب محدد حيث تدعم القناة تسجيل الخروج.
    - `web.login.start` يبدأ تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - `web.login.wait` ينتظر اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - `push.test` يرسل دفعة APNs اختبارية إلى Node iOS مسجّل.
    - `voicewake.get` يعيد مشغّلات كلمة التنبيه المخزّنة.
    - `voicewake.set` يحدّث مشغّلات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC التسليم الصادر المباشر للإرسالات المستهدفة بقناة/حساب/سلسلة خارج مشغّل الدردشة.
    - `logs.tail` يعيد ذيل سجل ملف Gateway المكوّن مع عناصر التحكم بالمؤشر/الحد الأقصى والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="Talk وTTS">
    - `talk.catalog` يعيد كتالوج مزوّدي Talk للقراءة فقط للكلام، والنسخ المتدفق، والصوت الفوري. يتضمن معرّفات المزوّدين، والتسميات، وحالة التكوين، ومعرّفات النماذج/الأصوات المكشوفة، والأوضاع القانونية، ووسائط النقل، واستراتيجيات الدماغ، وأعلام الصوت/القدرات الفورية دون إعادة أسرار المزوّد أو تعديل التكوين العام.
    - `talk.config` يعيد حمولة تكوين Talk الفعالة؛ يتطلب `includeSecrets` صلاحية `operator.talk.secrets` (أو `operator.admin`).
    - `talk.session.create` ينشئ جلسة Talk مملوكة من Gateway لـ `realtime/gateway-relay` أو `transcription/gateway-relay` أو `stt-tts/managed-room`. يتطلب `brain: "direct-tools"` صلاحية `operator.admin`.
    - `talk.session.join` يتحقق من رمز جلسة غرفة مُدارة، ويصدر أحداث `session.ready` أو `session.replaced` حسب الحاجة، ويعيد بيانات الغرفة/الجلسة الوصفية إضافة إلى أحداث Talk الحديثة دون الرمز النصي الصريح أو تجزئة الرمز المخزّنة.
    - `talk.session.appendAudio` يضيف صوت إدخال PCM بترميز base64 إلى جلسات الترحيل الفوري والنسخ المملوكة من Gateway.
    - `talk.session.startTurn` و`talk.session.endTurn` و`talk.session.cancelTurn` تقود دورة حياة الدور في الغرفة المُدارة مع رفض الأدوار القديمة قبل مسح الحالة.
    - `talk.session.cancelOutput` يوقف إخراج صوت المساعد، وبالأساس للمقاطعة المحكومة بـ VAD في جلسات ترحيل Gateway.
    - `talk.session.submitToolResult` يكمل استدعاء أداة مزوّد صادر عن جلسة ترحيل فورية مملوكة من Gateway. مرّر `options: { willContinue: true }` لإخراج أداة مؤقت عندما ستتبعه نتيجة نهائية، أو `options: { suppressResponse: true }` عندما يجب أن تلبّي نتيجة الأداة استدعاء المزوّد دون بدء استجابة مساعد فورية أخرى.
    - `talk.session.close` يغلق جلسة ترحيل أو نسخ أو غرفة مُدارة مملوكة من Gateway ويصدر أحداث Talk نهائية.
    - `talk.mode` يضبط/يبث حالة وضع Talk الحالية لعملاء WebChat/Control UI.
    - `talk.client.create` ينشئ جلسة مزوّد فورية مملوكة من العميل باستخدام `webrtc` أو `provider-websocket` بينما يملك Gateway التكوين وبيانات الاعتماد والتعليمات وسياسة الأدوات.
    - `talk.client.toolCall` يتيح لوسائط النقل الفورية المملوكة من العميل تمرير استدعاءات أدوات المزوّد إلى سياسة Gateway. أول أداة مدعومة هي `openclaw_agent_consult`؛ يتلقى العملاء معرّف تشغيل وينتظرون أحداث دورة حياة الدردشة المعتادة قبل إرسال نتيجة الأداة الخاصة بالمزوّد.
    - `talk.event` هو قناة أحداث Talk الوحيدة للفوري، والنسخ، وSTT/TTS، والغرفة المُدارة، والاتصالات الهاتفية، ومحوّلات الاجتماعات.
    - `talk.speak` يولّد الكلام عبر مزوّد الكلام النشط في Talk.
    - `tts.status` يعيد حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الرجوع الاحتياطي، وحالة تكوين المزوّد.
    - `tts.providers` يعيد مخزون مزوّدي TTS المرئي.
    - `tts.enable` و`tts.disable` يبدّلان حالة تفضيلات TTS.
    - `tts.setProvider` يحدّث مزوّد TTS المفضّل.
    - `tts.convert` يشغّل تحويل النص إلى كلام لمرة واحدة.

  </Accordion>

  <Accordion title="الأسرار والتكوين والتحديث والمعالج">
    - `secrets.reload` يعيد حل SecretRefs النشطة ويستبدل حالة الأسرار وقت التشغيل فقط عند النجاح الكامل.
    - `secrets.resolve` يحل تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
    - `config.get` يعيد لقطة التكوين الحالية والتجزئة.
    - `config.set` يكتب حمولة تكوين متحققاً منها.
    - `config.patch` يدمج تحديث تكوين جزئياً.
    - `config.apply` يتحقق من حمولة التكوين الكاملة ويستبدلها.
    - `config.schema` يعيد حمولة مخطط التكوين الحي التي تستخدمها أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات التوليد الوصفية، بما في ذلك بيانات مخطط Plugin + القناة الوصفية عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات وصفية للحقل `title` / `description` مشتقة من التسميات ونص المساعدة نفسهما المستخدمين في الواجهة، بما في ذلك فروع تركيب الكائنات المتداخلة، وحرف البدل، وعنصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - `config.schema.lookup` يعيد حمولة بحث محددة المسار لمسار تكوين واحد: المسار الموحّد، وعقدة مخطط سطحية، وتلميحاً مطابقاً + `hintPath`، وملخصات فورية للأبناء للتعمق عبر UI/CLI. تحتفظ عقد مخطط البحث بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` الموحّد، و`type`، و`required`، و`hasChildren`، إضافة إلى `hint` / `hintPath` المطابقين.
    - `update.run` يشغّل تدفق تحديث Gateway ويجدول إعادة التشغيل فقط عندما ينجح التحديث نفسه؛ يمكن للمستدعين الذين لديهم جلسة تضمين `continuationMessage` بحيث يستأنف بدء التشغيل دور وكيل متابعة واحداً عبر طابور استمرار إعادة التشغيل. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد تبديل الحزمة حتى لا تستمر عملية Gateway القديمة في التحميل الكسول من شجرة `dist` مستبدلة.
    - `update.status` يعيد أحدث حارس إعادة تشغيل تحديث مخزّن مؤقتاً، بما في ذلك إصدار التشغيل بعد إعادة التشغيل عند توفره.
    - `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` تكشف معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - `agents.list` يعيد إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات وقت التشغيل الوصفية.
    - `agents.create` و`agents.update` و`agents.delete` تدير سجلات الوكلاء وربط مساحة العمل.
    - `agents.files.list` و`agents.files.get` و`agents.files.set` تدير ملفات مساحة عمل الإقلاع المكشوفة لوكيل.
    - `tasks.list` و`tasks.get` و`tasks.cancel` تكشف سجل مهام Gateway لعملاء SDK والمشغّل.
    - `artifacts.list` و`artifacts.get` و`artifacts.download` تكشف ملخصات وتنزيلات العناصر المشتقة من النص المنسوخ لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهام الجلسة المالكة على جانب الخادم ولا تعيد إلا وسائط النص المنسوخ ذات الأصل المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلاً من جلبها على جانب الخادم.
    - `environments.list` و`environments.status` تكشفان اكتشاف بيئات Gateway المحلية وNode للقراءة فقط لعملاء SDK.
    - `agent.identity.get` يعيد هوية المساعد الفعالة لوكيل أو جلسة.
    - `agent.wait` ينتظر انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسات">
    - `sessions.list` يعيد فهرس الجلسات الحالي، بما في ذلك بيانات `agentRuntime` الوصفية لكل صف عندما تكون خلفية وقت تشغيل الوكيل مكوّنة.
    - `sessions.subscribe` و`sessions.unsubscribe` يبدّلان اشتراكات أحداث تغيير الجلسات لعميل WS الحالي.
    - `sessions.messages.subscribe` و`sessions.messages.unsubscribe` يبدّلان اشتراكات أحداث النص المنسوخ/الرسائل لجلسة واحدة.
    - `sessions.preview` يعيد معاينات نص منسوخ محدودة لمفاتيح جلسات محددة.
    - `sessions.describe` يعيد صف جلسة Gateway واحداً لمفتاح جلسة دقيق.
    - `sessions.resolve` يحل هدف جلسة أو يجعله قانونياً.
    - `sessions.create` ينشئ إدخال جلسة جديداً.
    - `sessions.send` يرسل رسالة إلى جلسة قائمة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - `sessions.abort` يوقف العمل النشط لجلسة. يجوز للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يمكن لـ Gateway حلها إلى جلسة.
    - `sessions.patch` يحدّث بيانات الجلسة الوصفية/التجاوزات ويبلّغ عن النموذج القانوني المحلول إضافة إلى `agentRuntime` الفعال.
    - `sessions.reset` و`sessions.delete` و`sessions.compact` تنفذ صيانة الجلسات.
    - `sessions.get` يعيد صف الجلسة المخزّن كاملاً.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم تطبيع `chat.history` للعرض لعملاء UI: تُزال وسوم التوجيه المضمّنة من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) ورموز التحكم في النموذج المسرّبة بنمط ASCII/كامل العرض، وتُحذف صفوف المساعد ذات الرموز الصامتة فقط مثل `NO_REPLY` / `no_reply` الدقيقة، ويمكن استبدال الصفوف مفرطة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - `device.pair.list` يعيد الأجهزة المقترنة المعلقة والمعتمدة.
    - `device.pair.approve` و`device.pair.reject` و`device.pair.remove` تدير سجلات إقران الأجهزة.
    - `device.token.rotate` يدوّر رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.
    - `device.token.revoke` يلغي رمز جهاز مقترن ضمن حدود دوره المعتمد ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.remove` و`node.pair.verify` تغطي إقران Node والتحقق من الإقلاع.
    - `node.list` و`node.describe` يعيدان حالة Node المعروفة/المتصلة.
    - `node.rename` يحدّث تسمية Node مقترن.
    - `node.invoke` يمرر أمراً إلى Node متصل.
    - `node.invoke.result` يعيد نتيجة طلب استدعاء.
    - `node.event` يحمل الأحداث الصادرة من Node مرة أخرى إلى Gateway.
    - `node.pending.pull` و`node.pending.ack` هما واجهات API لطابور Node المتصل.
    - `node.pending.enqueue` و`node.pending.drain` تديران العمل المعلق الدائم لـ Node غير المتصلة/غير المتاحة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - يغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات الموافقة لمرة واحدة على التنفيذ، إضافة إلى البحث عن الموافقات المعلقة وإعادة تشغيلها.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - يدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة التنفيذ في Gateway.
    - يدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية للعقدة عبر أوامر ترحيل العقدة.
    - يغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة وSkills والأدوات">
    - الأتمتة: يحدد `wake` حقن نص إيقاظ فوري أو عند Heartbeat التالية؛ ويدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` الأعمال المجدولة.
    - Skills والأدوات: `commands.list`، و`skills.*`، و`tools.catalog`، و`tools.effective`، و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث دردشة أخرى خاصة
  بالنص المسجل فقط.
- `session.message` و`session.tool`: تحديثات النص المسجل/دفق الأحداث لجلسة
  مشترك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث دفق حدث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب استدعاء العقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغّل كلمة الإيقاظ.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة
  التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة
  Plugin.

### طرق مساعدة العقدة

- قد تستدعي العقد `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية
  لفحوص السماح التلقائي.

### استدعاءات RPC لسجل المهام

يمكن لعملاء المشغل فحص سجلات مهام Gateway الخلفية وإلغاؤها عبر استدعاءات RPC
لسجل المهام. تعيد هذه الطرق ملخصات مهام منقحة، لا حالة وقت التشغيل الخام.

- يتطلب `tasks.list` صلاحية `operator.read`.
  - المعاملات: `status` اختياري (`"queued"` أو `"running"` أو `"completed"`،
    أو `"failed"`، أو `"cancelled"`، أو `"timed_out"`) أو مصفوفة من تلك الحالات،
    و`agentId` اختياري، و`sessionKey` اختياري، و`limit` اختياري من `1` إلى
    `500`، وسلسلة `cursor` اختيارية.
  - النتيجة: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- يتطلب `tasks.get` صلاحية `operator.read`.
  - المعاملات: `{ "taskId": string }`.
  - النتيجة: `{ "task": TaskSummary }`.
  - تعيد معرّفات المهام المفقودة شكل خطأ عدم العثور الخاص بـ Gateway.
- يتطلب `tasks.cancel` صلاحية `operator.write`.
  - المعاملات: `{ "taskId": string, "reason"?: string }`.
  - النتيجة:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - يوضح `found` ما إذا كان السجل يحتوي على مهمة مطابقة. ويوضح `cancelled`
    ما إذا كان وقت التشغيل قد قبل الإلغاء أو سجله.

يتضمن `TaskSummary` الحقول `id` و`status` وبيانات وصفية اختيارية مثل `kind`
و`runtime` و`title` و`agentId` و`sessionKey` و`childSessionKey` و`ownerKey`
و`runId` و`taskId` و`flowId` و`parentTaskId` و`sourceId` والطوابع الزمنية
والتقدم والملخص النهائي ونص الخطأ المنقح.

### طرق مساعدة المشغل

- قد يستدعي المشغلون `commands.list` (`operator.read`) لجلب مخزون أوامر وقت
  التشغيل لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون `/` البادئة
    - يعيد `native` والمسار الافتراضي `both` أسماء أصلية واعية بالمزود
      عند توفرها
  - يحمل `textAliases` أسماء مستعارة مائلة دقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزود عند وجوده.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر
    Plugin الأصلية.
  - يحذف `includeArgs=false` بيانات وسيطات مسلسلة من الاستجابة.
- قد يستدعي المشغلون `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات وصفية عن المصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- قد يستدعي المشغلون `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال في وقت التشغيل
  لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت تشغيل موثوقا من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة محددة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقنوات.
- قد يستدعي المشغلون `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة غلاف موجه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` ذات أنواع. تعيد حالات الرفض بسبب الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز خط أنابيب سياسة أدوات Gateway.
- قد يستدعي المشغلون `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضي.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوص الإعدادات وخيارات
    التثبيت المنقحة من دون كشف قيم الأسرار الخام.
- قد يستدعي المشغلون `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات وصفية لاكتشاف ClawHub.
- قد يستدعي المشغلون `skills.upload.begin` و`skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) لتجهيز أرشيف Skill خاص قبل
  تثبيته. هذا مسار تحميل إداري منفصل للعملاء الموثوقين،
  وليس تدفق تثبيت Skill العادي من ClawHub، وهو معطل افتراضيا ما لم يتم تمكين
  `skills.install.allowUploadedArchives`.
  - ينشئ `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    تحميلا مرتبطا بذلك الـ slug وقيمة force.
  - يضيف `skills.upload.chunk({ uploadId, offset, dataBase64 })` بايتات عند
    الإزاحة المفكوكة الدقيقة.
  - يتحقق `skills.upload.commit({ uploadId, sha256? })` من الحجم النهائي و
    SHA-256. لا يؤدي commit إلا إلى إنهاء التحميل؛ ولا يثبت Skill.
  - أرشيفات Skills المحملة هي أرشيفات zip تحتوي على جذر `SKILL.md`. ولا
    يحدد اسم الدليل الداخلي للأرشيف هدف التثبيت أبدا.
- قد يستدعي المشغلون `skills.install` (`operator.admin`) بثلاثة أوضاع:
  - وضع ClawHub: يثبت `{ source: "clawhub", slug, version?, force? }`
    مجلد Skill في دليل `skills/` ضمن مساحة عمل الوكيل الافتراضي.
  - وضع التحميل: يثبت `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    تحميلا منجزا في دليل `skills/<slug>` ضمن مساحة عمل الوكيل الافتراضي.
    يجب أن تتطابق قيمة slug وforce مع طلب
    `skills.upload.begin` الأصلي. يرفض هذا الوضع ما لم يكن
    `skills.install.allowUploadedArchives` مفعلا. لا يؤثر هذا الإعداد في
    تثبيتات ClawHub.
  - وضع مثبت Gateway: يشغل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` مصرحا به على مضيف Gateway.
- قد يستدعي المشغلون `skills.update` (`operator.admin`) بوضعين:
  - يحدث وضع ClawHub قيمة slug متتبعة واحدة أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضي.
  - يعدل وضع الإعدادات قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معامل `view` اختياريا:

- محذوف أو `"default"`: سلوك وقت التشغيل الحالي. إذا تم إعداد `agents.defaults.models`، تكون الاستجابة هي الكتالوج المسموح، بما في ذلك النماذج المكتشفة ديناميكيا لإدخالات `provider/*`. وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا تم إعداد `agents.defaults.models`، فسيظل هو الغالب، بما في ذلك الاكتشاف محدود النطاق بالمزود لإدخالات `provider/*`. ومن دون قائمة سماح، تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج معدة.
- `"all"`: كتالوج Gateway الكامل، متجاوزا `agents.defaults.models`. استخدم هذا لواجهات التشخيص والاكتشاف، لا لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحل عملاء المشغل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية القانونية). ترفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المعاد توجيهها استخدام
  `systemRunPlan` القانوني كسياق موثوق للأمر/cwd/الجلسة.
- إذا عدل مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وإعادة توجيه `system.run` النهائية الموافق عليها، يرفض
  Gateway التشغيل بدلا من الثقة بالحمولة المعدلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن لطلبات `agent` تضمين `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل مسار خارجي قابل للتسليم (على سبيل المثال جلسات داخلية/دردشة ويب أو إعدادات متعددة القنوات ملتبسة).
- قد تتضمن نتائج `agent` النهائية `result.deliveryStatus` عندما يتم طلب التسليم،
  باستخدام حالات `sent` و`suppressed` و`partial_failed` و`failed` نفسها
  الموثقة لـ [`openclaw agent --json --deliver`](/ar/cli/agent#json-delivery-status).

## تعيين الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر protocol v4 وهي خط الأساس المتوقع للعملاء الخارجيين.

| الثابت                                   | الافتراضي                                             | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| مهلة الطلب (لكل RPC)                     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة ما قبل المصادقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن أن ترفع config/env ميزانية الخادم/العميل المقترنة) |
| مهلة التراجع الأولية لإعادة الاتصال       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| أقصى مهلة تراجع لإعادة الاتصال            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| فترة السماح للإيقاف القسري قبل `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبضات الافتراضي (قبل `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق بسبب مهلة النبضات                   | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2`  | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 ميغابايت)                      | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم قيم `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` الفعالة في `hello-ok`؛ ينبغي للعملاء الالتزام بهذه القيم
بدلا من الإعدادات الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المهيأ.
- الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير local loopback تفي بفحص مصادقة الاتصال من
  رؤوس الطلب بدلا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالدخول الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تكشف هذا الوضع على دخول عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محدد النطاق بدور الاتصال
  + النطاقات. يعاد في `hello-ok.auth.deviceToken` وينبغي أن يحتفظ به
  العميل للاتصالات المستقبلية.
- ينبغي للعملاء الاحتفاظ برمز `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** هذا أيضا استخدام
  مجموعة النطاقات المعتمدة المخزنة لذلك الرمز. يحافظ هذا على وصول القراءة/الفحص/الحالة
  الذي سبق منحه ويتجنب تضييق عمليات إعادة الاتصال بصمت إلى نطاق ضمني خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويرسل دائما عند ضبطه.
  - يملأ `auth.token` حسب ترتيب الأولوية: الرمز المشترك الصريح أولا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - يرسل `auth.bootstrapToken` فقط عندما لا ينتج أي مما سبق
    `auth.token`. يمنع إرساله رمز مشترك أو أي رمز جهاز محلول.
  - الترقية التلقائية لرمز جهاز مخزن عند إعادة محاولة `AUTH_TOKEN_MISMATCH`
    لمرة واحدة مقيدة بـ **نقاط النهاية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يتأهل `wss://`
    العام دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم bootstrap.
  احتفظ بها فقط عندما يستخدم الاتصال مصادقة bootstrap على نقل موثوق
  مثل `wss://` أو الاقتران عبر loopback/محلي.
- إذا قدم العميل `deviceToken` **صريحا** أو `scopes` صريحة، تبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجع؛ لا يعاد استخدام النطاقات المخزنة
  مؤقتا إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يكرر رمز الحامل البديل
  فقط لنداءات الجهاز نفسه التي صودقت بالفعل برمز ذلك الجهاز، بحيث يستطيع
  العملاء المعتمدون على الرمز فقط الاحتفاظ بالبديل قبل إعادة الاتصال. لا تكرر
  تدويرات المشاركة/المسؤول رمز الحامل.
- يبقى إصدار الرموز وتدويرها وإبطالها محدودا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرمز توسيع دور جهاز
  أو استهداف دور لم يمنحه اعتماد الاقتران قط.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة ذاتية النطاق ما لم يكن
  لدى المستدعي أيضا `operator.admin`: يستطيع المستدعون غير المسؤولين إزالة/إبطال/تدوير
  إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضا من مجموعة نطاقات رمز
  المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يستطيع المستدعون غير المسؤولين
  تدوير أو إبطال رمز مشغل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يجوز للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن لكل جهاز.
  - إذا فشلت تلك الإعادة، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء للمشغل.

## هوية الجهاز + الاقتران

- ينبغي أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزا لكل جهاز + دور.
- تكون موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم يكن الاعتماد المحلي التلقائي
  مفعلا.
- يتمحور الاعتماد التلقائي للاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضا مسار اتصال ذاتي ضيق محلي للواجهة الخلفية/الحاوية لتدفقات
  المساعد الموثوقة ذات السر المشترك.
- تظل اتصالات tailnet أو LAN على المضيف نفسه تعامل كاتصالات بعيدة لأغراض الاقتران
  وتتطلب موافقة.
- يتضمن عملاء WS عادة هوية `device` أثناء `connect` (المشغل +
  node). الاستثناءات الوحيدة للمشغل دون جهاز هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` لتوافق HTTP غير الآمن الخاص بـ localhost فقط.
  - نجاح مصادقة واجهة تحكم المشغل في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (إجراء طارئ، خفض أمني شديد).
  - نداءات RPC الخلفية المباشرة عبر loopback في `gateway-client` المصادق عليها برمز/كلمة مرور
    Gateway المشتركة.
- يجب أن توقع كل الاتصالات قيمة `connect.challenge` nonce التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` مستقر.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسل قيمة فارغة).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائما `connect.challenge`.
- وقع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تظل توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للجهاز المقترن لا يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريا تثبيت بصمة شهادة Gateway (راجع تهيئة `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة Gateway API الكاملة** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، إلخ). يحدد السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
