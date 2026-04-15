---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة التشفير التام بين الطرفين (E2EE) والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd730bb9d0c8a548ee48b20931b3222e9aa1e6e95f1390b0c236645e03f3576d
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix هو Plugin قناة مدمج في OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل الخاصة، والغرف، وسلاسل الرسائل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير التام بين الطرفين (E2EE).

## Plugin المدمج

يأتي Matrix كـ Plugin مدمج في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البنيات المجمعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Matrix، فثبّته
يدويًا:

ثبّت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

ثبّت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin وقواعد التثبيت.

## الإعداد

1. تأكد من أن Plugin Matrix متاح.
   - إصدارات OpenClaw المجمعة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على خادمك المنزلي.
3. هيّئ `channels.matrix` باستخدام أحد الخيارين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة خاصة مع البوت أو قم بدعوته إلى غرفة.
   - دعوات Matrix الجديدة تعمل فقط عندما يسمح `channels.matrix.autoJoin` بذلك.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: رمز وصول أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم جهاز اختياري
- ما إذا كان يجب تمكين التشفير التام بين الطرفين (E2EE)
- ما إذا كان يجب تهيئة الوصول إلى الغرف والانضمام التلقائي للدعوات

سلوكيات المعالج الأساسية:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة بالفعل في الإعدادات، فسيعرض المعالج اختصارًا لمتغيرات البيئة للإبقاء على المصادقة في متغيرات البيئة.
- تُطبّع أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل الخاصة `@user:server` مباشرةً؛ ولا تعمل الأسماء المعروضة إلا عندما يعثر البحث المباشر في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرةً. فضّل `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة أثناء التشغيل عند تحليل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوات الثابتة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لتحليل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته دون تعيين، فلن ينضم البوت إلى الغرف المدعو إليها أو الدعوات الجديدة بأسلوب الرسائل الخاصة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل الخاصة المدعو إليها ما لم تنضم يدويًا أولًا.

عيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو عيّن `autoJoin: "always"` إذا كنت تريد منه الانضمام إلى كل دعوة.

في وضع `allowlist`، لا يقبل `autoJoinAllowlist` إلا `!roomId:server` أو `#alias:server` أو `*`.
</Warning>

مثال على قائمة السماح:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

الانضمام إلى كل دعوة:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

إعداد بسيط يعتمد على الرمز المميز:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

إعداد يعتمد على كلمة المرور (يتم تخزين الرمز المميز مؤقتًا بعد تسجيل الدخول):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

يخزن Matrix بيانات الاعتماد المؤقتة في `~/.openclaw/credentials/matrix/`.
يستخدم الحساب الافتراضي `credentials.json`؛ وتستخدم الحسابات المسماة `credentials-<account>.json`.
عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مُهيأ لعمليات الإعداد وdoctor واكتشاف حالة القناة، حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرةً في الإعدادات.

المكافئات من متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد معيّنًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات بيئة على مستوى الحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

وبالنسبة إلى معرّف الحساب المطبّع `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يهرب Matrix علامات الترقيم في معرّفات الحسابات للحفاظ على عدم تعارض متغيرات البيئة المحددة بالنطاق.
على سبيل المثال، تتحول `-` إلى `_X2D_`، لذلك يُحوَّل `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولا يكون الحساب المحدد لديه بالفعل مصادقة Matrix محفوظة في الإعدادات.

## مثال على التهيئة

هذا إعداد أساسي عملي يتضمن إقران الرسائل الخاصة، وقائمة سماح للغرف، وتمكين التشفير التام بين الطرفين (E2EE):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل الخاصة. لا يمكن لـ OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة خاصة أو مجموعة عند وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. يُطبَّق `dm.policy` بعد انضمام البوت وتصنيف الغرفة على أنها رسالة خاصة.

## معاينات البث

بث الردود في Matrix يتم عبر الاشتراك الاختياري.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد أن يرسل OpenClaw معاينة مباشرة واحدة
للرد، ويحرر تلك المعاينة في مكانها أثناء توليد النموذج للنص، ثم يثبتها عند اكتمال
الرد:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` هو الإعداد الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- `streaming: "partial"` ينشئ رسالة معاينة واحدة قابلة للتحرير لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ ذلك على سلوك الإشعارات القديم في Matrix القائم على المعاينة أولًا، لذا قد ترسل التطبيقات القياسية إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة النهائية المكتملة.
- `streaming: "quiet"` ينشئ إشعار معاينة هادئًا واحدًا قابلًا للتحرير لكتلة المساعد الحالية. استخدم هذا فقط عندما تهيئ أيضًا قواعد دفع للمستلمين من أجل تعديلات المعاينات النهائية.
- يفعّل `blockStreaming: true` رسائل تقدم منفصلة في Matrix. وعند تمكين بث المعاينة، يحتفظ Matrix بالمسودة المباشرة للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عندما يكون بث المعاينة قيد التشغيل ويكون `blockStreaming` متوقفًا، يحرر Matrix المسودة المباشرة في مكانها ويثبت الحدث نفسه عند انتهاء الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- لا تزال ردود الوسائط ترسل المرفقات بشكل عادي. وإذا لم يعد من الآمن إعادة استخدام معاينة قديمة، يقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تكلف تعديلات المعاينة طلبات إضافية إلى Matrix API. اترك البث متوقفًا إذا كنت تريد السلوك الأكثر تحفظًا فيما يتعلق بحدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix القياسية من دون قواعد دفع مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` متوقفًا للتسليم النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مُرسِلة للإشعارات.
- يرسل `blockStreaming: false` الرد النهائي المكتمل فقط كرسالة Matrix عادية مُرسِلة للإشعارات.

### قواعد دفع مستضافة ذاتيًا للمعاينات الهادئة النهائية

إذا كنت تشغّل بنية Matrix الخاصة بك وتريد أن ترسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فعيّن `streaming: "quiet"` وأضف قاعدة دفع لكل مستخدم مستلم لتعديلات المعاينة النهائية.

يكون هذا عادةً إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عامًا في إعدادات الخادم المنزلي:

خريطة سريعة قبل البدء:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلم في استدعاءات API أدناه
- طابِق `sender` في قاعدة الدفع مع MXID الكامل لمستخدم البوت

1. هيّئ OpenClaw لاستخدام المعاينات الهادئة:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. تأكد من أن حساب المستلم يتلقى بالفعل إشعارات دفع Matrix العادية. لا تعمل
   قواعد المعاينات الهادئة إلا إذا كان لدى هذا المستخدم بالفعل pushers/أجهزة عاملة.

3. احصل على رمز وصول المستخدم المستلم.
   - استخدم رمز المستخدم المتلقي، وليس رمز البوت.
   - عادةً ما تكون إعادة استخدام رمز جلسة عميل موجودة هي الأسهل.
   - إذا كنت بحاجة إلى إصدار رمز جديد، يمكنك تسجيل الدخول عبر Matrix Client-Server API القياسي:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. تحقّق من أن حساب المستلم لديه بالفعل pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا أعاد هذا الاستدعاء عدم وجود pushers/أجهزة نشطة، فأصلح إشعارات Matrix العادية أولًا قبل إضافة
قاعدة OpenClaw أدناه.

يضع OpenClaw علامة على تعديلات المعاينات النهائية النصية فقط باستخدام:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. أنشئ قاعدة دفع من نوع override لكل حساب مستلم يجب أن يتلقى هذه الإشعارات:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

استبدل هذه القيم قبل تشغيل الأمر:

- `https://matrix.example.org`: عنوان URL الأساسي لخادمك المنزلي
- `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المتلقي
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا البوت لهذا المستخدم المتلقي
- `@bot:example.org`: معرّف MXID لبوت Matrix الخاص بـ OpenClaw، وليس MXID الخاص بالمستخدم المتلقي

مهم لإعدادات البوتات المتعددة:

- تُفهرس قواعد الدفع بواسطة `ruleId`. تؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة فقط.
- إذا كان على مستخدم مستلم واحد تلقي إشعارات لعدة حسابات بوت Matrix خاصة بـ OpenClaw، فأنشئ قاعدة واحدة لكل بوت مع معرّف قاعدة فريد لكل تطابق `sender`.
- نمط بسيط لذلك هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

تُقيَّم القاعدة على مرسل الحدث:

- صادِق باستخدام رمز المستخدم المستلم
- طابِق `sender` مع MXID الخاص ببوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تُظهر الغرفة مسودة معاينة هادئة، ويجب أن يرسل
   التعديل النهائي في المكان نفسه إشعارًا واحدًا عند انتهاء الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام رمز المستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام رمز وصول المستخدم المستلم، وليس رمز البوت.
- تُدرج قواعد `override` الجديدة المعرّفة من قبل المستخدم قبل قواعد المنع الافتراضية، لذلك لا حاجة إلى معلمة ترتيب إضافية.
- يؤثر هذا فقط على تعديلات المعاينة النصية فقط التي يمكن لـ OpenClaw إنهاؤها بأمان في المكان نفسه. أما بدائل الوسائط وبدائل المعاينات القديمة فتظل تستخدم تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم دفع Matrix عاملًا لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادةً بمفرده:

- لا يلزم إجراء تغيير خاص في `homeserver.yaml` لإشعارات معاينة OpenClaw النهائية.
- إذا كان نشر Synapse لديك يرسل بالفعل إشعارات دفع Matrix العادية، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا كنت تشغّل Synapse خلف وكيل عكسي أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من أن pushers تعمل بشكل سليم. تتم معالجة تسليم الدفع بواسطة العملية الرئيسية أو `synapse.app.pusher` / workers المهيأة للدفع.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء API الخاص بـ push-rule المعروض أعلاه:

- لا يلزم أي إعداد خاص بـ Tuwunel لعلامة المعاينة النهائية نفسها.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لهذا المستخدم، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا بدا أن الإشعارات تختفي بينما يكون المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` ممكّنًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه عمدًا منع إشعارات الدفع إلى الأجهزة الأخرى بينما يكون أحد الأجهزة نشطًا.

## غرف بوت إلى بوت

افتراضيًا، يتم تجاهل رسائل Matrix الواردة من حسابات OpenClaw Matrix الأخرى المهيأة.

استخدم `allowBots` عندما تريد عمدًا حركة Matrix بين الوكلاء:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- يقبل `allowBots: true` الرسائل من حسابات Matrix bot الأخرى المهيأة في الغرف والرسائل الخاصة المسموح بها.
- يقبل `allowBots: "mentions"` هذه الرسائل فقط عندما تذكر هذا البوت بشكل مرئي في الغرف. وتظل الرسائل الخاصة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- يواصل OpenClaw تجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة bot أصلية؛ ويتعامل OpenClaw مع "مؤلف بواسطة bot" على أنه "مرسل بواسطة حساب Matrix مهيأ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة bot إلى bot في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور مع المرفق الكامل. أما الغرف غير المشفرة فتظل تستخدم `thumbnail_url` العادي. لا حاجة إلى أي إعداد — إذ يكتشف Plugin حالة E2EE تلقائيًا.

تمكين التشفير:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

تحقق من حالة التحقق:

```bash
openclaw matrix verify status
```

حالة تفصيلية (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

ضمّن مفتاح الاسترداد المخزن في المخرجات القابلة للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة التوقيع المتبادل وحالة التحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap التفصيلية:

```bash
openclaw matrix verify bootstrap --verbose
```

افرض إعادة تعيين جديدة لهوية التوقيع المتبادل قبل bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

تحقّق من هذا الجهاز باستخدام مفتاح استرداد:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

تفاصيل التحقق من الجهاز بشكل تفصيلي:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

تحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات سلامة النسخ الاحتياطي بشكل تفصيلي:

```bash
openclaw matrix verify backup status --verbose
```

استعد مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات الاستعادة بشكل تفصيلي:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخة الاحتياطية المخزن بشكل سليم، فقد تؤدي إعادة التعيين هذه أيضًا إلى إعادة إنشاء التخزين السري بحيث
تتمكن عمليات البدء الباردة المستقبلية من تحميل مفتاح النسخة الاحتياطية الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيل SDK الداخلي الهادئ)، ولا تعرض تشخيصات مفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند البرمجة النصية.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني لـ Matrix ما لم تمرر `--account <id>`.
إذا هيأت عدة حسابات مسماة، فعيّن `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية تلك وتطلب منك اختيار حساب بشكل صريح.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الأجهزة حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطّلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح إعدادات ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### ما معنى "تم التحقق"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه تم التحقق منه فقط عندما يكون متحققًا منه بواسطة هوية التوقيع المتبادل الخاصة بك.
عمليًا، يكشف `openclaw matrix verify status --verbose` عن ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق من قبل العميل الحالي فقط
- `Cross-signing verified`: يفيد SDK بأن الجهاز متحقق منه عبر التوقيع المتبادل
- `Signed by owner`: الجهاز موقَّع بواسطة مفتاح التوقيع الذاتي الخاص بك

تصبح `Verified by owner` مساوية لـ `yes` فقط عند وجود تحقق بالتوقيع المتبادل أو توقيع من المالك.
أما الثقة المحلية وحدها فلا تكفي ليعتبر OpenClaw الجهاز متحققًا منه بالكامل.

### ما الذي يفعله bootstrap

الأمر `openclaw matrix verify bootstrap` هو أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
وهو ينفذ كل ما يلي بالترتيب:

- يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود متى أمكن
- يهيئ التوقيع المتبادل ويرفع مفاتيح التوقيع المتبادل العامة الناقصة
- يحاول تعليم الجهاز الحالي وتوقيعه عبر التوقيع المتبادل
- ينشئ نسخة احتياطية جديدة لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب مصادقة تفاعلية لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw الرفع أولًا من دون مصادقة، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما تكون `channels.matrix.password` مهيأة.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية التوقيع المتبادل الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخة الاحتياطية الحالية لمفاتيح الغرف وبدء
خط أساس جديد للنسخ الاحتياطي للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط عندما تقبل أن السجل المشفر القديم غير القابل للاسترداد سيظل
غير متاح وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل
سر النسخة الاحتياطية الحالي بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد الإبقاء على الرسائل المشفرة المستقبلية تعمل وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

### سلوك بدء التشغيل

عندما تكون `encryption: true`، يضبط Matrix القيمة الافتراضية لـ `startupVerification` على `"if-unverified"`.
عند بدء التشغيل، إذا ظل هذا الجهاز غير متحقق منه، فسيطلب Matrix التحقق الذاتي في عميل Matrix آخر،
ويتجاوز الطلبات المكررة ما دام أحدها معلقًا بالفعل، ويطبّق فترة تهدئة محلية قبل إعادة المحاولة بعد إعادة التشغيل.
وتُعاد محاولة الطلبات الفاشلة أسرع من إنشاء الطلبات الناجح افتراضيًا.
عيّن `startupVerification: "off"` لتعطيل طلبات بدء التشغيل التلقائية، أو اضبط `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفّذ بدء التشغيل أيضًا تمريرة bootstrap تشفيرية محافظة تلقائيًا.
تحاول هذه التمريرة أولًا إعادة استخدام التخزين السري الحالي وهوية التوقيع المتبادل الحالية، وتتجنب إعادة تعيين التوقيع المتبادل ما لم تشغّل تدفق إصلاح bootstrap صريحًا.

إذا وجد بدء التشغيل مع ذلك حالة bootstrap معطّلة، يمكن لـ OpenClaw محاولة مسار إصلاح محروس حتى عندما لا تكون `channels.matrix.password` مهيأة.
إذا كان الخادم المنزلي يتطلب UIA قائمًا على كلمة المرور لهذا الإصلاح، يسجل OpenClaw تحذيرًا ويحافظ على عدم جعل بدء التشغيل فادحًا بدلًا من إيقاف البوت.
إذا كان الجهاز الحالي موقّعًا بالفعل من المالك، يحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [ترحيل Matrix](/ar/install/migrating-matrix) للحصول على تدفق الترقية الكامل، والقيود، وأوامر الاسترداد، ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرةً في غرفة التحقق ذات الرسائل الخاصة الصارمة كرسائل `m.notice`.
ويشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشادات صريحة "تحقق عبر الرموز التعبيرية")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (الرموز التعبيرية والأرقام العشرية) عند توفرها

تُتتبّع طلبات التحقق الواردة من عميل Matrix آخر ويقبلها OpenClaw تلقائيًا.
وبالنسبة إلى تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق عبر الرموز التعبيرية متاحًا ويؤكد جانبه بنفسه.
أما بالنسبة إلى طلبات التحقق من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر أن يستمر تدفق SAS بشكل طبيعي.
ولا يزال يتعين عليك مقارنة SAS الرمزي أو العشري في عميل Matrix لديك وتأكيد "إنها متطابقة" هناك لإكمال التحقق.

لا يقبل OpenClaw تلقائيًا التدفقات المكررة التي يبدأها بنفسه بشكل أعمى. ويتجاوز بدء التشغيل إنشاء طلب جديد عندما يكون طلب تحقق ذاتي معلقًا بالفعل.

لا تُمرر إشعارات بروتوكول/نظام التحقق إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw في الحساب وتجعل الثقة في الغرف المشفرة أصعب في الفهم.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw Matrix القديمة غير المستخدمة باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم Matrix E2EE مسار التشفير Rust الرسمي في `matrix-js-sdk` على Node، مع `fake-indexeddb` كطبقة IndexedDB بديلة. تُحفَظ حالة التشفير في ملف لقطة (`crypto-idb-snapshot.json`) وتُستعاد عند بدء التشغيل. ويُعد ملف اللقطة هذا حالة تشغيل حساسة تُخزَّن بأذونات ملفات مقيّدة.

توجد حالة التشغيل المشفرة تحت جذور لكل حساب ولكل مستخدم ولكل تجزئة رمز مميز في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
ويحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`)، ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`)، ولقطة IndexedDB (`crypto-idb-snapshot.json`)،
وروابط سلاسل الرسائل (`thread-bindings.json`)، وحالة التحقق عند بدء التشغيل (`startup-verification.json`).
وعندما يتغير الرمز المميز بينما تظل هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لهذه الثلاثية account/homeserver/user بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وروابط سلاسل الرسائل،
وحالة التحقق عند بدء التشغيل مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصور الرمزية من نوع `mxc://` مباشرةً. وعند تمرير عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يرفعها OpenClaw أولًا إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## سلاسل الرسائل

يدعم Matrix سلاسل رسائل Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أداة الرسائل.

- يحافظ `dm.sessionScope: "per-user"` (الافتراضي) على توجيه الرسائل الخاصة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل خاصة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل خاصة في Matrix داخل مفتاح جلسة خاص بها مع الاستمرار في استخدام المصادقة العادية للرسائل الخاصة وفحوصات قائمة السماح.
- لا تزال روابط محادثات Matrix الصريحة تتغلب على `dm.sessionScope`، لذلك تحتفظ الغرف وسلاسل الرسائل المرتبطة بجلسة الهدف المختارة لها.
- يُبقي `threadReplies: "off"` الردود في المستوى الأعلى، ويُبقي الرسائل الواردة ضمن سلسلة الرسائل على جلسة الرسالة الأصلية.
- يرد `threadReplies: "inbound"` داخل سلسلة الرسائل فقط عندما تكون الرسالة الواردة موجودة بالفعل في تلك السلسلة.
- يُبقي `threadReplies: "always"` ردود الغرف داخل سلسلة رسائل جذرها الرسالة المُشغِّلة، ويوجه تلك المحادثة عبر الجلسة المطابقة ذات النطاق الخاص بسلسلة الرسائل بدءًا من أول رسالة مُشغِّلة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل الخاصة فقط. على سبيل المثال، يمكنك إبقاء سلاسل رسائل الغرف معزولة مع إبقاء الرسائل الخاصة مسطحة.
- تتضمن الرسائل الواردة ضمن سلاسل الرسائل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أداة الرسائل سلسلة رسائل Matrix الحالية تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل الخاصة نفسه، ما لم يُوفَّر `threadId` صريح.
- لا يُفعَّل إعادة استخدام هدف مستخدم الرسائل الخاصة ضمن الجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية أنه النظير نفسه للرسائل الخاصة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ذي النطاق الخاص بالمستخدم.
- عندما يرى OpenClaw أن غرفة رسائل خاصة في Matrix تتعارض مع غرفة رسائل خاصة أخرى على جلسة Matrix DM المشتركة نفسها، فإنه ينشر `m.notice` لمرة واحدة في تلك الغرفة مع مخرج `/focus` عند تمكين روابط سلاسل الرسائل وتلميح `dm.sessionScope`.
- تُدعَم روابط سلاسل الرسائل أثناء التشغيل في Matrix. وتعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة رسائل في غرف Matrix ورسائلها الخاصة.
- يؤدي `/focus` في المستوى الأعلى لغرفة/رسالة خاصة في Matrix إلى إنشاء سلسلة رسائل Matrix جديدة وربطها بالجلسة المستهدفة عندما تكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة رسائل Matrix موجودة إلى ربط سلسلة الرسائل الحالية تلك بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل الخاصة وسلاسل رسائل Matrix الحالية إلى مساحات عمل ACP دائمة من دون تغيير واجهة الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو الغرفة أو سلسلة الرسائل الحالية في Matrix التي تريد الاستمرار في استخدامها.
- في رسالة خاصة أو غرفة Matrix من المستوى الأعلى، تظل الرسالة الخاصة/الغرفة الحالية هي واجهة الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة رسائل Matrix موجودة، يربط `--bind here` سلسلة الرسائل الحالية هذه في مكانها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة رسائل Matrix فرعية.
- لا تكون `threadBindings.spawnAcpSessions` مطلوبة إلا لـ `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة رسائل Matrix فرعية أو ربطها.

### تهيئة ربط سلاسل الرسائل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

أعلام الإنشاء المرتبط بسلاسل الرسائل في Matrix اختيارية:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` في المستوى الأعلى بإنشاء سلاسل رسائل Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل رسائل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- تخضع أدوات التفاعل الصادرة إلى `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يعرض `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يزيل `emoji=""` تفاعلات حساب البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من حساب البوت.

يستخدم نطاق تفاعلات الإقرار ترتيب التحليل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى الرمز التعبيري الخاص بهوية الوكيل

ويُحل نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

ويُحل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي ألّفها البوت.
- يعطّل `reactionNotifications: "off"` أحداث نظام التفاعل.
- لا تُحوَّل إزالة التفاعلات إلى أحداث نظام اصطناعية لأن Matrix يعرضها كعمليات حذف redactions، وليس كإزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الأخيرة المضمّنة كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما معيّنًا، تكون القيمة الفعالة الافتراضية `0`. عيّن `0` للتعطيل.
- يكون سجل غرف Matrix خاصًا بالغرف فقط. وتواصل الرسائل الخاصة استخدام سجل الجلسة العادي.
- يكون سجل غرف Matrix خاصًا بالرسائل المعلّقة فقط: يضع OpenClaw رسائل الغرفة التي لم تُطلِق ردًا بعد في مخزن مؤقت، ثم يلتقط لقطة لتلك النافذة عند وصول ذكر أو مُشغِّل آخر.
- لا تُضمَّن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل غرف أحدث.

## إظهار السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرف مثل نصوص الردود المجلبة، وجذور سلاسل الرسائل، والسجل المعلّق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يُحتفَظ بالسياق الإضافي كما تم استلامه.
- يرشّح `contextVisibility: "allowlist"` السياق الإضافي إلى المرسلين المسموح لهم بموجب فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تُطلق ردًا.
ولا تزال صلاحية التشغيل تأتي من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسات الرسائل الخاصة.

## سياسة الرسائل الخاصة والغرف

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

راجع [Groups](/ar/channels/groups) لمعرفة سلوك تقييد الذكر وقائمة السماح.

مثال على الإقران لرسائل Matrix الخاصة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير المعتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الإقران المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إنشاء رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق إقران الرسائل الخاصة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا خرجت حالة الرسائل المباشرة عن التزامن، فقد ينتهي الأمر بـ OpenClaw مع تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة الخاصة النشطة. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة خاصة صارمة 1:1 مُعيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة خاصة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة خاصة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. فهو يختار فقط الرسالة الخاصة السليمة ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة مرة أخرى.

## موافقات exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. وتظل
عناصر تحكم التوجيه الأصلية للرسائل الخاصة/القنوات موجودة تحت تهيئة موافقات exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يعود إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير معيّنة أو `"auto"` ويُمكن تحليل موافق واحد على الأقل. تستخدم موافقات exec أولًا `execApprovals.approvers` ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتُخوِّل موافقات Plugin عبر `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي بشكل صريح. وإلا تعود طلبات الموافقة إلى مسارات الموافقة المهيأة الأخرى أو إلى سياسة الرجوع للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقات:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل الخاصة/القنوات لطلبات الموافقة في Matrix.
- تستخدم موافقات exec مجموعة الموافقين الخاصة بالتنفيذ من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح للرسائل الخاصة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على موافقات exec وموافقات Plugin معًا.

قواعد التسليم:

- يرسل `target: "dm"` طلبات الموافقة إلى الرسائل الخاصة للموافقين
- يرسل `target: "channel"` الطلب مرة أخرى إلى غرفة أو رسالة Matrix الأصلية
- يرسل `target: "both"` إلى الرسائل الخاصة للموافقين وإلى غرفة أو رسالة Matrix الأصلية

تزرع طلبات الموافقة في Matrix اختصارات تفاعل على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به بموجب سياسة exec الفعالة

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم تحليلهم الموافقة أو الرفض. وبالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذلك لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

التجاوز على مستوى الحساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [موافقات Exec](/ar/tools/exec-approvals)

## حسابات متعددة

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

تعمل القيم ذات المستوى الأعلى في `channels.matrix` كقيم افتراضية للحسابات المسماة ما لم يقم حساب ما بتجاوزها.
يمكنك تقييد إدخالات الغرف الموروثة بحساب Matrix واحد باستخدام `groups.<room>.account`.
تظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما تظل الإدخالات التي تحتوي على `account: "default"` تعمل عندما يكون الحساب الافتراضي مهيأ مباشرةً على المستوى الأعلى في `channels.matrix.*`.
لا تؤدي القيم الافتراضية المشتركة الجزئية للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا يُنشئ OpenClaw الحساب الأعلى مستوى `default` إلا عندما تكون لهذا الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من خلال `homeserver` مع `userId` عندما تلبّي بيانات الاعتماد المخزنة مؤقتًا المصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد `accounts.default`. ولا تُنقل إلى ذلك الحساب المُرقّى إلا مفاتيح مصادقة/Bootstrap الخاصة بـ Matrix؛ وتبقى مفاتيح سياسات التسليم المشتركة في المستوى الأعلى.
عيّن `defaultAccount` عندما تريد من OpenClaw تفضيل حساب Matrix مسمى واحد للتوجيه الضمني، والاستقصاء، وعمليات CLI.
إذا كانت عدة حسابات Matrix مهيأة وكان أحد معرّفات الحسابات هو `default`، فسيستخدم OpenClaw هذا الحساب ضمنيًا حتى لو لم يكن `defaultAccount` معيّنًا.
إذا قمت بتهيئة عدة حسابات مسماة، فعيّن `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار الحساب الضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لحساب لأمر واحد.

راجع [مرجع التهيئة](/ar/gateway/configuration-reference#multi-account-all-channels) لمعرفة نمط الحسابات المتعددة المشترك.

## الخوادم المنزلية الخاصة/خوادم LAN

افتراضيًا، يمنع OpenClaw الخوادم المنزلية الخاصة/الداخلية لـ Matrix للحماية من SSRF ما لم
تقم بتفعيلها صراحةً لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost أو عنوان IP لشبكة LAN/Tailscale أو اسم مضيف داخلي، ففعّل
`network.dangerouslyAllowPrivateNetwork` لذلك الحساب في Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

مثال على الإعداد عبر CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا التفعيل الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. أما الخوادم المنزلية العامة غير المشفرة مثل
`http://matrix.example.org:8008` فتظل محظورة. ويفضَّل استخدام `https://` كلما أمكن.

## توجيه حركة Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى Proxy صريح لحركة HTTP(S) الصادرة، فعيّن `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

يمكن للحسابات المسماة تجاوز الإعداد الافتراضي الأعلى مستوى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد Proxy نفسه لحركة Matrix أثناء التشغيل ولاستقصاءات حالة الحساب.

## تحليل الهدف

يقبل Matrix صيغ الأهداف التالية في كل مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث المباشر في الدليل حساب Matrix المسجّل دخوله:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على ذلك الخادم المنزلي.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرةً، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث باسم الغرفة المنضم إليها على أساس أفضل جهد. وإذا تعذر تحليل اسم غرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله أثناء التشغيل عند تحليل قائمة السماح.

## مرجع التهيئة

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند تهيئة عدة حسابات Matrix.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بالخوادم المنزلية الخاصة/الداخلية. فعّل هذا عندما يُحل الخادم المنزلي إلى `localhost` أو عنوان IP لشبكة LAN/Tailscale أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) Proxy لحركة Matrix. ويمكن للحسابات المسماة تجاوز الإعداد الافتراضي الأعلى مستوى باستخدام `proxy` خاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: رمز وصول للمصادقة المستندة إلى الرمز. القيم النصية الصريحة وقيم SecretRef مدعومة في `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).
- `password`: كلمة مرور لتسجيل الدخول المستند إلى كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون `true`، تتم ترقية سياسة الغرف `open` إلى `allowlist`، وتُفرَض جميع سياسات الرسائل الخاصة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. ولا يؤثر ذلك في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات OpenClaw Matrix الأخرى المهيأة (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع إظهار سياق الغرفة الإضافي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. يجب أن تكون الإدخالات معرّفات مستخدمي Matrix كاملة؛ وتُتجاهل الأسماء غير المحلولة أثناء التشغيل.
- `historyLimit`: الحد الأقصى لرسائل الغرف المضمنة كسياق سجل للمجموعة. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما معيّنًا، تكون القيمة الفعالة الافتراضية `0`. عيّن `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: تهيئة اختيارية لعرض Markdown لنص Matrix الصادر.
- `streaming`: `off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يفعّل `"partial"` و`true` تحديثات المسودات بنمط المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُرسِلة للإشعار لإعدادات push-rule المستضافة ذاتيًا. ويكافئ `false` القيمة `"off"`.
- `blockStreaming`: يفعّل `true` رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودات.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بسلاسل الرسائل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم أجزاء الرسالة الصادرة بالأحرف (يُطبَّق عندما يكون `chunkMode` هو `length`).
- `chunkMode`: يقسّم `length` الرسائل حسب عدد الأحرف؛ ويقسّم `newline` عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تسبق جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت لعمليات الإرسال الصادرة ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. وتنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل الخاصة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. وتُحل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل الخاصة (`enabled` و`policy` و`allowFrom` و`sessionScope` و`threadReplies`).
- `dm.policy`: يتحكم في الوصول إلى الرسائل الخاصة بعد انضمام OpenClaw إلى الغرفة وتصنيفها على أنها رسالة خاصة. ولا يغيّر ما إذا كانت الدعوة ستنضم تلقائيًا.
- `dm.allowFrom`: يجب أن تكون الإدخالات معرّفات مستخدمي Matrix كاملة ما لم تكن قد حللتها بالفعل عبر البحث المباشر في الدليل.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن تحتفظ كل غرفة رسائل خاصة في Matrix بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة سلاسل الرسائل خاص بالرسائل الخاصة (`off` أو `inbound` أو `always`). ويتجاوز الإعداد الأعلى مستوى `threadReplies` لكل من موضع الرد وعزل الجلسة في الرسائل الخاصة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` و`approvers` و`target` و`agentFilter` و`sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما يحدّد `dm.allowFrom` الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. وتعمل القيم ذات المستوى الأعلى في `channels.matrix` كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. فضّل معرّفات الغرف أو الأسماء المستعارة؛ وتُتجاهل أسماء الغرف غير المحلولة أثناء التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد التحليل.
- `groups.<room>.account`: قصر إدخال غرفة موروث واحد على حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من البوتات المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز لتقييد الذكر على مستوى الغرفة. تؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ وتعيد `false` فرضها.
- `groups.<room>.skills`: عامل تصفية Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` و`reactions` و`pins` و`profile` و`memberInfo` و`channelInfo` و`verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد الذكر
- [توجيه القناة](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
