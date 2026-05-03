---
read_when:
    - تنفيذ أو تحديث عملاء WS لـ Gateway
    - استكشاف أخطاء عدم تطابق البروتوكول أو فشل الاتصال وإصلاحها
    - إعادة توليد مخطط البروتوكول ونماذجه
summary: 'بروتوكول WebSocket في Gateway: المصافحة، الإطارات، إدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-05-03T07:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

بروتوكول Gateway WS هو **مستوى التحكم الوحيد + نقل Node** الخاص بـ
OpenClaw. يتصل كل العملاء (CLI، واجهة الويب، تطبيق macOS، عقد iOS/Android، العقد بلا واجهة)
عبر WebSocket ويعلنون **الدور** + **النطاق** الخاصين بهم
وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- يجب أن يكون الإطار الأول طلب `connect`.
- تُحد إطارات ما قبل الاتصال بـ 64 KiB. بعد مصافحة ناجحة، يجب على العملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تفعيل التشخيصات،
  تصدر الإطارات الواردة كبيرة الحجم والمخازن الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام، والحدود، والأسطح، ورموز السبب الآمنة. وهي لا تحتفظ بنص الرسالة،
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

بينما لا يزال Gateway ينهي تشغيل الخدمات الجانبية عند بدء التشغيل، يمكن أن
يعيد طلب `connect` خطأ `UNAVAILABLE` قابلا لإعادة المحاولة مع تعيين `details.reason` إلى
`"startup-sidecars"` و`retryAfterMs`. يجب على العملاء إعادة محاولة تلك الاستجابة
ضمن ميزانية الاتصال الإجمالية لديهم بدلا من عرضها كفشل نهائي
في المصافحة.

`server`، و`features`، و`snapshot`، و`policy` كلها مطلوبة بواسطة المخطط
(`src/gateway/protocol/schema/frames.ts`). كذلك `auth` مطلوب أيضا ويعرض
الدور/النطاقات المتفاوض عليها. `canvasHostUrl` اختياري.

عندما لا يصدر رمز جهاز، يعرض `hello-ok.auth` الأذونات المتفاوض عليها
دون حقول الرموز:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

يجوز لعملاء الخلفية الموثوقين ضمن العملية نفسها (`client.id: "gateway-client"`،
`client.mode: "backend"`) حذف `device` في اتصالات loopback المباشرة عندما
يصادقون باستخدام رمز/كلمة مرور Gateway المشتركة. هذا المسار محجوز
لـ RPCs مستوى التحكم الداخلية ويحافظ على أساسيات إقران CLI/الجهاز القديمة من
منع عمل الخلفية المحلي مثل تحديثات جلسات الوكيل الفرعي. لا يزال العملاء البعيدون،
وعملاء أصل المتصفح، وعملاء Node، وعملاء رمز الجهاز/هوية الجهاز الصريحون
يستخدمون فحوصات الإقران وترقية النطاق العادية.

عندما يصدر رمز جهاز، يتضمن `hello-ok` أيضا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم التمهيد الموثوق، قد يتضمن `hello-ok.auth` أيضا إدخالات
أدوار محدودة إضافية في `deviceTokens`:

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

في تدفق تمهيد Node/operator المدمج، يبقى رمز Node الأساسي
`scopes: []` ويبقى أي رمز operator تم تسليمه محدودا إلى قائمة السماح لمشغل
التمهيد (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). تبقى فحوصات نطاق التمهيد
مسبوقة بالدور: إدخالات operator لا تلبي إلا طلبات operator، ولا تزال
الأدوار غير operator تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

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

للاطلاع على نموذج نطاقات operator الكامل، وفحوصات وقت الموافقة، ودلالات السر المشترك،
راجع [نطاقات Operator](/ar/gateway/operator-scopes).

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف القدرة (camera/screen/canvas/system.run).

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

قد تطلب طرق Gateway RPC المسجلة من Plugin نطاق operator الخاص بها، لكن
بادئات إدارة النواة المحجوزة (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) تتحول دائما إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر الشرطة المائلة التي يتم الوصول إليها عبر
`chat.send` فحوصات أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
كتابات `/config set` و`/config unset` الدائمة `operator.admin`.

لدى `node.pair.approve` أيضا فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات ذات أوامر Node غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### القدرات/الأوامر/الأذونات (Node)

تعلن Nodes ادعاءات القدرة وقت الاتصال:

- `caps`: فئات القدرة عالية المستوى.
- `commands`: قائمة السماح بالأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record`، `camera.capture`).

يعامل Gateway هذه كـ **ادعاءات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بهوية الجهاز.
- تتضمن إدخالات الحضور `deviceId`، و`roles`، و`scopes` حتى تتمكن الواجهات من عرض صف واحد لكل جهاز
  حتى عندما يتصل باعتباره **operator** و**node** معا.
- يتضمن `node.list` الحقلين الاختياريين `lastSeenAtMs` و`lastSeenReason`. تعرض Nodes المتصلة
  وقت اتصالها الحالي كـ `lastSeenAtMs` مع السبب `connect`؛ ويمكن لـ Nodes المقترنة أيضا عرض
  حضور خلفية دائم عندما يحدث حدث Node موثوق بيانات تعريف الإقران لديها.

### حدث بقاء Node في الخلفية

يجوز لـ Nodes استدعاء `node.event` مع `event: "node.presence.alive"` لتسجيل أن Node مقترنة كانت
حية أثناء إيقاظ في الخلفية دون تعليمها كمتصلة.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` تعداد مغلق: `background`، أو `silent_push`، أو `bg_app_refresh`،
أو `significant_location`، أو `manual`، أو `connect`. تطبع سلاسل المشغل غير المعروفة إلى
`background` بواسطة Gateway قبل الحفظ. يكون الحدث دائما فقط لجلسات أجهزة Node
المصادقة؛ وتعيد الجلسات بلا جهاز أو غير المقترنة `handled: false`.

تعيد Gateways الناجحة نتيجة منظمة:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

قد لا تزال Gateways الأقدم تعيد `{ "ok": true }` لـ `node.event`؛ يجب على العملاء التعامل مع ذلك كـ
RPC تم الإقرار به، وليس كحفظ دائم للحضور.

## تحديد نطاق أحداث البث

تخضع أحداث بث WebSocket المدفوعة من الخادم للتحكم بالنطاق حتى لا تتلقى الجلسات ذات نطاق الإقران أو جلسات Node فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاءات الأدوات) تتطلب `operator.read` على الأقل. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **بثوث `plugin.*` المعرفة بواسطة Plugin** مقيدة بـ `operator.write` أو `operator.admin`، حسب طريقة تسجيلها بواسطة Plugin.
- **أحداث الحالة والنقل** (`heartbeat`، و`presence`، و`tick`، ودورة حياة الاتصال/قطع الاتصال، إلخ) تبقى غير مقيدة حتى تبقى صحة النقل قابلة للمراقبة لكل جلسة مصادقة.
- **عائلات أحداث البث غير المعروفة** تكون مقيدة بالنطاق افتراضيا (تفشل مغلقة) ما لم يرخصها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسل خاص به لكل عميل حتى تحافظ البثوث على ترتيب رتيب على ذلك المقبس حتى عندما يرى عملاء مختلفون مجموعات فرعية مختلفة مرشحة حسب النطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذا
ليس تفريغا مولدا — إن `hello-ok.features.methods` قائمة اكتشاف
محافظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات
طرق Plugin/القناة المحملة. تعامل معها كاكتشاف ميزات، لا كتعداد كامل
لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة صحة Gateway المخزنة مؤقتا أو المفحوصة حديثا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الأخير. يحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، ومعرفات الجلسات. لا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية. نطاق قراءة operator مطلوب.
    - يعيد `status` ملخص Gateway بنمط `/status`؛ ولا تتضمن الحقول الحساسة إلا لعملاء operator ذوي نطاق admin.
    - يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات الترحيل والإقران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة operator/Node المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يبدل `set-heartbeats` معالجة Heartbeat على Gateway.

  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها وقت التشغيل. مرر `{ "view": "configured" }` للنماذج المكوّنة بحجم مناسب للمنتقي (`agents.defaults.models` أولاً، ثم `models.providers.*.models`)، أو `{ "view": "all" }` للكتالوج الكامل.
    - يعيد `usage.status` ملخصات نوافذ استخدام المزوّدين/الحصة المتبقية.
    - يعيد `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق تاريخي.
    - يعيد `doctor.memory.status` جاهزية ذاكرة المتجهات / التضمينات المخزنة مؤقتاً لمساحة عمل الوكيل الافتراضي النشط. مرر `{ "probe": true }` أو `{ "deep": true }` فقط عندما يريد المستدعي صراحة اختبار اتصال مباشر بمزوّد التضمينات.
    - يعيد `doctor.memory.remHarness` معاينة محدودة وللقراءة فقط لأداة REM لعملاء مستوى التحكم البعيدين. يمكن أن تتضمن مسارات مساحة العمل، ومقتطفات الذاكرة، وMarkdown المرتكز المعروض، ومرشحي الترقية العميقة، لذلك يحتاج المستدعون إلى `operator.read`.
    - يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugins المضمنة والمجمعة.
    - يسجل `channels.logout` الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب الحالي القادر على QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ القناة عند النجاح.
    - يرسل `push.test` إشعار دفع اختباري عبر APNs إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` محفزات كلمة التنبيه المخزنة.
    - يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.

  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - `send` هو RPC للتسليم الصادر المباشر للإرسال الموجه إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملف Gateway المكوّن مع عناصر تحكم للمؤشر/الحد والحد الأقصى للبايتات.

  </Accordion>

  <Accordion title="التحدث وTTS">
    - يعيد `talk.config` حمولة إعداد Talk الفعالة؛ يتطلب `includeSecrets` الصلاحية `operator.talk.secrets` (أو `operator.admin`).
    - يعيّن `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - ينشئ `talk.speak` الكلام عبر مزوّد كلام Talk النشط.
    - يعيد `tts.status` حالة تفعيل TTS، والمزوّد النشط، ومزوّدي الاحتياط، وحالة إعداد المزوّد.
    - يعيد `tts.providers` مخزون مزوّدي TTS المرئي.
    - يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
    - يحدّث `tts.setProvider` مزوّد TTS المفضل.
    - يشغّل `tts.convert` تحويلاً لمرة واحدة من النص إلى كلام.

  </Accordion>

  <Accordion title="الأسرار، والإعدادات، والتحديث، والمعالج">
    - يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة أسرار وقت التشغيل فقط عند النجاح الكامل.
    - يحل `secrets.resolve` تعيينات الأسرار الموجهة إلى الأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية والهاش.
    - يكتب `config.set` حمولة إعدادات تم التحقق منها.
    - يدمج `config.patch` تحديث إعدادات جزئياً.
    - يتحقق `config.apply` من حمولة الإعدادات الكاملة ويستبدلها.
    - يعيد `config.schema` حمولة مخطط الإعدادات الحية التي تستخدمها أدوات Control UI وCLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. يتضمن المخطط بيانات تعريف حقلي `title` / `description` المشتقة من التسميات ونص المساعدة نفسيهما المستخدمين في واجهة المستخدم، بما في ذلك فروع تركيب الكائن المتداخل، وحرف البدل، وعنصر المصفوفة، و`anyOf` / `oneOf` / `allOf` عندما توجد وثائق حقول مطابقة.
    - يعيد `config.schema.lookup` حمولة بحث محددة المسار لمسار إعداد واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء المباشرين للتنقل التفصيلي في UI/CLI. تحتفظ عقد مخطط البحث بوثائق المستخدم وحقول التحقق الشائعة (`title`، و`description`، و`type`، و`enum`، و`const`، و`format`، و`pattern`، وحدود الأرقام/السلاسل/المصفوفات/الكائنات، والأعلام مثل `additionalProperties`، و`deprecated`، و`readOnly`، و`writeOnly`). تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`، و`hasChildren`، إضافة إلى `hint` / `hintPath` المطابقين.
    - يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه. تفرض تحديثات مدير الحزم إعادة تشغيل تحديث غير مؤجلة وبدون فترة تهدئة بعد تبديل الحزمة حتى لا تستمر عملية Gateway القديمة في التحميل الكسول من شجرة `dist` مستبدلة.
    - يعيد `update.status` أحدث مؤشر إعادة تشغيل تحديث مخزن مؤقتاً، بما في ذلك الإصدار الجاري بعد إعادة التشغيل عند توفره.
    - تكشف `wizard.start`، و`wizard.next`، و`wizard.status`، و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.

  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكلاء المكوّنة، بما في ذلك النموذج الفعال وبيانات تعريف وقت التشغيل.
    - تدير `agents.create`، و`agents.update`، و`agents.delete` سجلات الوكلاء وربط مساحة العمل.
    - تدير `agents.files.list`، و`agents.files.get`، و`agents.files.set` ملفات مساحة عمل التمهيد المكشوفة لوكيل.
    - تكشف `artifacts.list`، و`artifacts.get`، و`artifacts.download` ملخصات القطع الأثرية المشتقة من النصوص والتنزيلات لنطاق `sessionKey` أو `runId` أو `taskId` صريح. تحل استعلامات التشغيل والمهمة الجلسة المالكة من جهة الخادم ولا تعيد إلا وسائط النصوص ذات المصدر المطابق؛ وتعيد مصادر URL غير الآمنة أو المحلية تنزيلات غير مدعومة بدلاً من جلبها من جهة الخادم.
    - يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند توفرها.

  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسات الحالي، بما في ذلك بيانات تعريف `agentRuntime` لكل صف عندما تكون خلفية وقت تشغيل وكيل مكوّنة.
    - يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسات لعميل WS الحالي.
    - يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث النص/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات نصوص محدودة لمفاتيح جلسات محددة.
    - يعيد `sessions.describe` صف جلسة Gateway واحداً لمفتاح جلسة مطابق تماماً.
    - يحل `sessions.resolve` هدف جلسة أو يجعله معيارياً.
    - ينشئ `sessions.create` إدخال جلسة جديداً.
    - يرسل `sessions.send` رسالة إلى جلسة موجودة.
    - `sessions.steer` هو متغير المقاطعة والتوجيه لجلسة نشطة.
    - يوقف `sessions.abort` العمل النشط لجلسة. يمكن للمستدعي تمرير `key` مع `runId` اختياري، أو تمرير `runId` وحده للتشغيلات النشطة التي يستطيع Gateway حلها إلى جلسة.
    - يحدّث `sessions.patch` بيانات تعريف/تجاوزات الجلسة ويبلّغ عن النموذج المعياري المحلول إضافة إلى `agentRuntime` الفعال.
    - تنفذ `sessions.reset`، و`sessions.delete`، و`sessions.compact` صيانة الجلسات.
    - يعيد `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history`، و`chat.send`، و`chat.abort`، و`chat.inject`. يكون `chat.history` مطبّع العرض لعملاء واجهة المستخدم: تزال وسوم التوجيه المضمنة من النص المرئي، وتزال حمولات XML لاستدعاءات الأدوات كنص عادي (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج المسرّبة بصيغة ASCII/العرض الكامل، وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تماماً، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

  </Accordion>

  <Accordion title="إقران الأجهزة ورموز الأجهزة">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والموافق عليها.
    - تدير `device.pair.approve`، و`device.pair.reject`، و`device.pair.remove` سجلات إقران الأجهزة.
    - يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.
    - يبطل `device.token.revoke` رمز جهاز مقترن ضمن حدود دوره الموافق عليه ونطاق المستدعي.

  </Accordion>

  <Accordion title="إقران Node والاستدعاء والعمل المعلق">
    - تغطي `node.pair.request`، و`node.pair.list`، و`node.pair.approve`، و`node.pair.reject`، و`node.pair.remove`، و`node.pair.verify` إقران Node والتحقق من التمهيد.
    - يعيد `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
    - يحدّث `node.rename` تسمية Node مقترنة.
    - يمرر `node.invoke` أمراً إلى Node متصلة.
    - يعيد `node.invoke.result` نتيجة طلب استدعاء.
    - يحمل `node.event` الأحداث الناشئة من Node إلى Gateway.
    - يحدّث `node.canvas.capability.refresh` رموز قدرة اللوحة المحددة النطاق.
    - `node.pending.pull` و`node.pending.ack` هما واجهتا API لطابور Node المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق المتين لـ Nodes غير المتصلة/المنفصلة.

  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request`، و`exec.approval.get`، و`exec.approval.list`، و`exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة إضافة إلى بحث/إعادة تشغيل الموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` موافقة تنفيذ معلقة واحدة ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة تنفيذ Gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة التنفيذ المحلية في Node عبر أوامر ترحيل Node.
    - تغطي `plugin.approval.request`، و`plugin.approval.list`، و`plugin.approval.waitDecision`، و`plugin.approval.resolve` تدفقات الموافقة التي يعرّفها Plugin.

  </Accordion>

  <Accordion title="الأتمتة، وSkills، والأدوات">
    - الأتمتة: يجدول `wake` حقن نص تنبيه فورياً أو عند Heartbeat التالية؛ وتدير `cron.list`، و`cron.status`، و`cron.add`، و`cron.update`، و`cron.remove`، و`cron.run`، و`cron.runs` العمل المجدول.
    - Skills والأدوات: `commands.list`، و`skills.*`، و`tools.catalog`، و`tools.effective`، و`tools.invoke`.

  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة واجهة المستخدم مثل `chat.inject` وأحداث الدردشة الأخرى الخاصة بالنصوص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث لجلسة مشترَك فيها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها التعريفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة صحة Gateway.
- `heartbeat`: تحديث تدفق حدث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد محفز كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق مساعدة Node

- يمكن لـ Nodes استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية للمهارات لفحوصات السماح التلقائي.

### طرق مساعدة المشغّل

- يمكن للمشغلين استدعاء `commands.list` (`operator.read`) لجلب مخزون أوامر وقت التشغيل
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز الأمر النصي الأساسي من دون `/` البادئة
    - يعيد `native` ومسار `both` الافتراضيان الأسماء الأصلية الواعية بالمزوّد
      عندما تكون متاحة
  - يحمل `textAliases` الأسماء المستعارة الدقيقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عندما يوجد.
  - `provider` اختياري ولا يؤثر إلا في التسمية الأصلية إضافة إلى توفر أوامر Plugin
    الأصلية.
  - يحذف `includeArgs=false` بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج أدوات وقت التشغيل
  لوكيل. تتضمن الاستجابة أدوات مجمّعة وبيانات تعريف المنشأ:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغلين استدعاء `tools.effective` (`operator.read`) لجلب مخزون الأدوات الفعّال
  في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستمد Gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلا من قبول
    سياق مصادقة أو تسليم يقدمه المستدعي.
  - الاستجابة مقيّدة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات النواة وPlugin والقناة.
- يمكن للمشغلين استدعاء `tools.invoke` (`operator.write`) لاستدعاء أداة واحدة متاحة عبر
  مسار سياسة Gateway نفسه مثل `/tools/invoke`.
  - `name` مطلوب. أما `args` و`sessionKey` و`agentId` و`confirm` و
    `idempotencyKey` فهي اختيارية.
  - إذا كان كل من `sessionKey` و`agentId` موجودين، فيجب أن يطابق وكيل الجلسة المحلول
    `agentId`.
  - الاستجابة غلاف موجّه إلى SDK يحتوي على `ok` و`toolName` و`output` اختياري وحقول
    `error` ذات أنواع. تعيد رفضات الموافقة أو السياسة `ok:false` في الحمولة بدلا من
    تجاوز مسار سياسة أدوات Gateway.
- يمكن للمشغلين استدعاء `skills.status` (`operator.read`) لجلب مخزون Skills المرئي
  لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات الناقصة، وفحوصات التكوين، وخيارات تثبيت
    منقّحة من دون كشف قيم الأسرار الخام.
- يمكن للمشغلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات تعريف الاكتشاف في ClawHub.
- يمكن للمشغلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: يثبّت `{ source: "clawhub", slug, version?, force? }` مجلد Skill
    في دليل `skills/` في مساحة عمل الوكيل الافتراضية.
  - وضع مثبّت Gateway: يشغّل `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    إجراء `metadata.openclaw.install` معلنا على مضيف Gateway.
- يمكن للمشغلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug واحدا متتبعا أو كل تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يرقّع وضع التكوين قيم `skills.entries.<skillKey>` مثل `enabled` و
    `apiKey` و`env`.

### عروض `models.list`

يقبل `models.list` معلمة `view` اختيارية:

- محذوفة أو `"default"`: سلوك وقت التشغيل الحالي. إذا كان `agents.defaults.models` مكوّنا، تكون الاستجابة هي الكتالوج المسموح؛ وإلا تكون الاستجابة هي كتالوج Gateway الكامل.
- `"configured"`: سلوك بحجم المنتقي. إذا كان `agents.defaults.models` مكوّنا، فسيظل هو الفائز. وإلا تستخدم الاستجابة إدخالات `models.providers.*.models` الصريحة، مع الرجوع إلى الكتالوج الكامل فقط عندما لا توجد صفوف نماذج مكوّنة.
- `"all"`: كتالوج Gateway الكامل، مع تجاوز `agents.defaults.models`. استخدم هذا للتشخيصات وواجهات اكتشاف المستخدم، وليس لمنتقيات النماذج العادية.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث Gateway حدث `exec.approval.requested`.
- يحسم عملاء المشغل ذلك باستدعاء `exec.approval.resolve` (يتطلب نطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الخطة `systemRunPlan` (`argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة المعيارية). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` المعيارية كسياق الأمر/cwd/الجلسة المعتمد.
- إذا عدّل مستدع `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي المعتمد إلى `system.run`، يرفض
  Gateway التشغيل بدلا من الوثوق بالحمولة المعدّلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: تعيد أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما لا يمكن حل أي مسار خارجي قابل للتسليم (مثل جلسات داخلية/دردشة ويب أو تكوينات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُولّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه الافتراضات. القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع للعملاء التابعين لجهات خارجية.

| الثابت                                  | الافتراضي                                               | المصدر                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلة الطلب (لكل RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلة المصادقة المسبقة / تحدي الاتصال       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (يمكن للتكوين/البيئة رفع ميزانية الخادم/العميل المقترنة) |
| تأخير إعادة الاتصال الأولي                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| الحد الأقصى لتأخير إعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| حد المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| فترة السماح للإيقاف القسري قبل `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلة `stopAndWait()` الافتراضية           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصل النبض الافتراضي (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| إغلاق بسبب مهلة النبض                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 ميغابايت)                            | `src/gateway/server-constants.ts`                                                          |

يعلن الخادم عن القيم الفعّالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ ويجب على العملاء احترام تلك القيم
بدلا من افتراضات ما قبل المصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوّن.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو غير local loopback
  `gateway.auth.mode: "trusted-proxy"` تستوفي فحص مصادقة الاتصال من
  ترويسات الطلب بدلاً من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` للمدخل الخاص مصادقة الاتصال بالسر المشترك
  بالكامل؛ لا تعرض هذا الوضع على مدخل عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** محددًا بدور الاتصال
  + النطاقات. يُعاد في `hello-ok.auth.deviceToken` وينبغي
  أن يستبقيه العميل للاتصالات المستقبلية.
- ينبغي للعملاء استبقاء `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- ينبغي أن تعيد إعادة الاتصال باستخدام رمز الجهاز **المخزن** ذاك استخدام
  مجموعة النطاقات المعتمدة المخزنة لذلك الرمز أيضًا. يحافظ هذا على وصول
  القراءة/الفحص/الحالة الذي مُنح مسبقًا ويتجنب تقليص عمليات إعادة الاتصال
  صامتًا إلى نطاق أضيق ضمني خاص بالمسؤول فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرر دائمًا عند تعيينه.
  - يُملأ `auth.token` بترتيب الأولوية: الرمز المشترك الصريح أولاً،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - يُرسل `auth.bootstrapToken` فقط عندما لا يحل أي مما سبق إلى
    `auth.token`. وجود رمز مشترك أو أي رمز جهاز محلول يمنع إرساله.
  - الترقية التلقائية لرمز جهاز مخزن عند إعادة المحاولة لمرة واحدة بعد
    `AUTH_TOKEN_MISMATCH` مقيدة بـ **النقاط الطرفية الموثوقة فقط** —
    local loopback، أو `wss://` مع `tlsFingerprint` مثبت. لا يؤهل
    `wss://` عام من دون تثبيت.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم للتمهيد.
  استبقها فقط عندما يستخدم الاتصال مصادقة تمهيد على نقل موثوق
  مثل `wss://` أو الاقتران عبر local loopback/local.
- إذا وفر العميل `deviceToken` **صريحًا** أو `scopes` صريحة، فتبقى
  مجموعة النطاقات التي طلبها المستدعي هي المرجع؛ لا تُعاد استخدام النطاقات
  المخزنة مؤقتًا إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إبطال رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب نطاق `operator.pairing`).
- يعيد `device.token.rotate` بيانات وصفية للتدوير. يردد رمز الحامل البديل
  فقط للنداءات من الجهاز نفسه والمصادق عليها مسبقًا برمز ذلك الجهاز، كي
  يتمكن العملاء المعتمدون على الرمز فقط من استبقاء بديلهم قبل إعادة الاتصال.
  تدويرات السر المشترك/المسؤول لا تردد رمز الحامل.
- يظل إصدار الرموز وتدويرها وإبطالها محدودًا بمجموعة الأدوار المعتمدة
  المسجلة في إدخال اقتران ذلك الجهاز؛ لا يمكن لتعديل الرموز توسيع دور جهاز
  أو استهداف دور جهاز لم يمنحه اعتماد الاقتران قط.
- في جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز ذاتية النطاق ما لم يكن
  لدى المستدعي `operator.admin` أيضًا: يمكن للمستدعين غير المسؤولين
  إزالة/إبطال/تدوير إدخال جهازهم **الخاص** فقط.
- يتحقق `device.token.rotate` و`device.token.revoke` أيضًا من مجموعة نطاقات
  رمز المشغل الهدف مقابل نطاقات جلسة المستدعي الحالية. لا يمكن للمستدعين
  غير المسؤولين تدوير أو إبطال رمز مشغل أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` إضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - يجوز للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز مخزن مؤقتًا لكل جهاز.
  - إذا فشلت إعادة المحاولة تلك، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات إجراء المشغل.

## هوية الجهاز + الاقتران

- ينبغي أن تتضمن العقد هوية جهاز ثابتة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- تكون موافقات الاقتران مطلوبة لمعرفات الأجهزة الجديدة ما لم يكن الاعتماد التلقائي المحلي
  مفعلاً.
- يتمحور الاعتماد التلقائي للاقتران حول اتصالات local loopback المباشرة.
- لدى OpenClaw أيضًا مسار اتصال ذاتي ضيق محلي للواجهة الخلفية/الحاوية من أجل
  تدفقات المساعد الموثوقة ذات السر المشترك.
- لا تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل كاتصالات بعيدة للاقتران
  وتتطلب موافقة.
- عادةً ما يضم عملاء WS هوية `device` أثناء `connect` (المشغل +
  node). استثناءات المشغلين بلا جهاز الوحيدة هي مسارات الثقة الصريحة:
  - `gateway.controlUi.allowInsecureAuth=true` للتوافق غير الآمن عبر HTTP على localhost فقط.
  - مصادقة Control UI ناجحة للمشغل عبر `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (إجراء كسر زجاج، خفض أمني شديد).
  - نداءات RPC الخلفية المباشرة عبر local loopback من `gateway-client` والمصادق عليها بالرمز/كلمة المرور المشتركة للـ Gateway.
- يجب أن توقع جميع الاتصالات قيمة nonce في `connect.challenge` التي يوفرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين لا يزالون يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` ضمن `error.details.code` مع `error.details.reason` ثابت.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | أغفل العميل `device.nonce` (أو أرسله فارغًا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقع خارج الانحراف المسموح.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` لا يطابق بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  إضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- لا تزال توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية
  للجهاز المقترن يظل يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يجوز للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع تكوين `gateway.tls`
  إضافة إلى `gateway.remote.tlsFingerprint` أو CLI `--tls-fingerprint`).

## النطاق

يعرض هذا البروتوكول **واجهة API الكاملة للـ Gateway** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، العقد، الموافقات، وما إلى ذلك). يحدد السطح الدقيق عبر
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذات صلة

- [بروتوكول الجسر](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
