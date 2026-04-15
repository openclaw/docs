---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة التشفير من الطرف إلى الطرف (E2EE) والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-15T07:17:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 631f6fdcfebc23136c1a66b04851a25c047535d13cceba5650b8b421bc3afcf8
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix هو Plugin قناة مضمّن لـ OpenClaw.
وهو يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل الخاصة، والغرف، وسلاسل الرسائل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير من الطرف إلى الطرف.

## Plugin مضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
عمليات البناء المجمّعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Matrix، فثبّته
يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugins وقواعد التثبيت.

## الإعداد

1. تأكد من أن Plugin Matrix متاح.
   - إصدارات OpenClaw المجمّعة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على الخادم المنزلي الخاص بك.
3. هيّئ `channels.matrix` باستخدام أحد الخيارين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة خاصة مع البوت أو ادعه إلى غرفة.
   - لا تعمل دعوات Matrix الجديدة إلا عندما يسمح بها `channels.matrix.autoJoin`.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: رمز وصول أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان يجب تمكين التشفير من الطرف إلى الطرف
- ما إذا كان يجب إعداد وصول الغرف والانضمام التلقائي للدعوات

السلوكيات الأساسية للمعالج:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة في الإعدادات بعد، فسيعرض المعالج اختصارًا لاستخدام البيئة للإبقاء على المصادقة في متغيرات البيئة.
- تتم تسوية أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل الخاصة `@user:server` مباشرةً؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث المباشر في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرةً. يُفضَّل `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة وقت التشغيل عند حل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف دعوات مستقرة: `!roomId:server` أو `#alias:server` أو `*`. يتم رفض أسماء الغرف العادية.
- لحل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته غير مضبوط، فلن ينضم البوت إلى الغرف المدعو إليها أو إلى دعوات الرسائل الخاصة الجديدة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل الخاصة المدعو إليها ما لم تنضم يدويًا أولًا.

اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو اضبط `autoJoin: "always"` إذا كنت تريده أن ينضم إلى كل دعوة.

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

إعداد أساسي باستخدام الرمز المميز:

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

إعداد باستخدام كلمة المرور (يتم تخزين الرمز المميز مؤقتًا بعد تسجيل الدخول):

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

يخزن Matrix بيانات الاعتماد المخزنة مؤقتًا في `~/.openclaw/credentials/matrix/`.
يستخدم الحساب الافتراضي `credentials.json`؛ وتستخدم الحسابات المسماة `credentials-<account>.json`.
عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مُهيأ لأغراض الإعداد وdoctor واكتشاف حالة القناة، حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرةً في الإعدادات.

مكافئات متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات البيئة ذات النطاق الخاص بالحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

لمعرّف الحساب المطبّع `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يقوم Matrix بتهريب علامات الترقيم في معرّفات الحسابات لإبقاء متغيرات البيئة ذات النطاق الخاص خالية من التعارضات.
على سبيل المثال، يتحول `-` إلى `_X2D_`، لذا يتم تعيين `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولا تكون مصادقة Matrix محفوظة في الإعدادات للحساب المحدد.

## مثال على التهيئة

هذا إعداد أساسي عملي مع اقتران الرسائل الخاصة، وقائمة سماح للغرف، وتمكين التشفير من الطرف إلى الطرف:

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

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك دعوات نمط الرسائل الخاصة. لا يستطيع OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة خاصة أو مجموعة في وقت الدعوة، لذلك تمر كل الدعوات عبر `autoJoin`
أولًا. يتم تطبيق `dm.policy` بعد انضمام البوت وتصنيف الغرفة على أنها رسالة خاصة.

## معاينات البث

بث الردود في Matrix اختياري.

اضبط `channels.matrix.streaming` على `"partial"` عندما تريد أن يرسل OpenClaw معاينة مباشرة واحدة
للرد، ويعدّل هذه المعاينة في مكانها بينما يقوم النموذج بإنشاء النص، ثم ينهيها عند اكتمال
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
- `streaming: "partial"` ينشئ رسالة معاينة واحدة قابلة للتحرير لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعارات القديم في Matrix القائم على المعاينة أولًا، لذا قد تُرسل التطبيقات القياسية إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- `streaming: "quiet"` ينشئ إشعار معاينة هادئًا واحدًا قابلًا للتحرير لكتلة المساعد الحالية. استخدم هذا فقط عندما تهيئ أيضًا قواعد دفع للمستلمين من أجل تعديلات المعاينات النهائية.
- `blockStreaming: true` يمكّن رسائل تقدم Matrix المنفصلة. عند تمكين بث المعاينة، يحتفظ Matrix بالمسودة الحية للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عند تشغيل بث المعاينة وإيقاف `blockStreaming`، يقوم Matrix بتحرير المسودة الحية في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- ما زالت ردود الوسائط ترسل المرفقات بشكل طبيعي. إذا تعذر إعادة استخدام معاينة قديمة بأمان، فسيقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تكلف تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطّلًا إذا كنت تريد السلوك الأكثر تحفظًا من ناحية حدود المعدل.

لا يقوم `blockStreaming` بتمكين معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت بحاجة إلى إشعارات Matrix القياسية من دون قواعد دفع مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطّلًا للتسليم النهائي فقط. عند استخدام `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مُرسِلة للإشعارات.
- يرسل `blockStreaming: false` الرد المكتمل النهائي فقط كرسالة Matrix عادية مُرسِلة للإشعارات.

### قواعد دفع مستضافة ذاتيًا للمعاينات الهادئة النهائية

إذا كنت تشغّل بنية Matrix التحتية الخاصة بك وتريد أن ترسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فاضبط `streaming: "quiet"` وأضف قاعدة دفع لكل مستخدم من أجل تعديلات المعاينات النهائية.

يكون هذا عادة إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عامًا في إعدادات الخادم المنزلي:

خريطة سريعة قبل أن تبدأ:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلم في استدعاءات API أدناه
- طابق `sender` في قاعدة الدفع مع MXID الكامل لمستخدم البوت

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
   قواعد المعاينات الهادئة إلا إذا كان لذلك المستخدم pushers/devices عاملة بالفعل.

3. احصل على رمز وصول المستخدم المستلم.
   - استخدم رمز المستخدم المتلقي، وليس رمز البوت.
   - غالبًا ما يكون إعادة استخدام رمز جلسة عميل موجودة هو الأسهل.
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

4. تحقق من أن حساب المستلم لديه بالفعل pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا لم يُرجع هذا أي pushers/devices نشطة، فأصلح إشعارات Matrix العادية أولًا قبل إضافة
قاعدة OpenClaw أدناه.

يضع OpenClaw علامة على تعديلات المعاينات النهائية النصية فقط بالقيمة التالية:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. أنشئ قاعدة دفع override لكل حساب مستلم يجب أن يتلقى هذه الإشعارات:

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

- `https://matrix.example.org`: عنوان URL الأساسي للخادم المنزلي لديك
- `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المتلقي
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا البوت لهذا المستخدم المتلقي
- `@bot:example.org`: MXID بوت Matrix الخاص بـ OpenClaw لديك، وليس MXID المستخدم المتلقي

مهم لإعدادات تعدد البوتات:

- تتم فهرسة قواعد الدفع باستخدام `ruleId`. تؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة فقط.
- إذا كان يجب على مستخدم مستلم واحد تلقي إشعارات من عدة حسابات Matrix bot خاصة بـ OpenClaw، فأنشئ قاعدة واحدة لكل bot مع معرّف قاعدة فريد لكل تطابق `sender`.
- نمط بسيط لذلك هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

يتم تقييم القاعدة مقابل مرسل الحدث:

- صادق باستخدام رمز المستخدم المستلم
- طابق `sender` مع MXID الخاص ببوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تعرض الغرفة معاينة مسودة هادئة، ويجب أن يرسل
   التعديل النهائي في مكانه إشعارًا واحدًا عند اكتمال الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام رمز المستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام رمز وصول المستخدم المستلم، وليس رمز bot.
- يتم إدراج قواعد `override` الجديدة المعرّفة من قبل المستخدم قبل قواعد الكتم الافتراضية، لذلك لا حاجة إلى أي معامل ترتيب إضافي.
- يؤثر هذا فقط في تعديلات المعاينات النصية النهائية التي يستطيع OpenClaw إنهاءها بأمان في مكانها. أما بدائل الوسائط وبدائل المعاينات القديمة فتستمر في استخدام تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم دفع Matrix عاملًا لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادةً بمفرده:

- لا يلزم أي تغيير خاص في `homeserver.yaml` لإشعارات معاينات OpenClaw النهائية.
- إذا كان نشر Synapse لديك يرسل بالفعل إشعارات دفع Matrix العادية، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا كنت تشغّل Synapse خلف reverse proxy أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من أن pushers سليمة. تتم معالجة تسليم الدفع بواسطة العملية الرئيسية أو `synapse.app.pusher` / workers الخاصة بـ pusher المهيأة.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء API الخاص بـ push-rule الموضح أعلاه:

- لا يلزم أي إعداد خاص بـ Tuwunel لمؤشر المعاينة النهائية نفسه.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لذلك المستخدم، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا بدا أن الإشعارات تختفي بينما يكون المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مُمكّنًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه عمدًا كتم الإشعارات إلى الأجهزة الأخرى أثناء نشاط أحد الأجهزة.

## غرف bot إلى bot

بشكل افتراضي، يتم تجاهل رسائل Matrix الواردة من حسابات Matrix OpenClaw الأخرى المهيأة.

استخدم `allowBots` عندما تريد عمدًا حركة مرور Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات Matrix bot الأخرى المهيأة في الغرف المسموح بها والرسائل الخاصة.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا bot بوضوح داخل الغرف. وتبقى الرسائل الخاصة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- ما زال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة bot أصلية؛ ويتعامل OpenClaw مع "مكتوب بواسطة bot" على أنه "مرسل بواسطة حساب Matrix آخر مهيأ على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة bot إلى bot في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث يتم تشفير معاينات الصور إلى جانب المرفق الكامل. أما الغرف غير المشفرة فتستمر في استخدام `thumbnail_url` العادي. لا يلزم أي إعداد — يكتشف Plugin حالة E2EE تلقائيًا.

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

التحقق من حالة التحقق:

```bash
openclaw matrix verify status
```

حالة مفصّلة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين مفتاح الاسترداد المخزن في مخرجات قابلة للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة حالة cross-signing والتحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap مفصلة:

```bash
openclaw matrix verify bootstrap --verbose
```

فرض إعادة تعيين جديدة لهوية cross-signing قبل bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

تحقق من هذا الجهاز باستخدام مفتاح استرداد:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

تفاصيل مفصلة للتحقق من الجهاز:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات مفصلة لسلامة النسخ الاحتياطي:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات مفصلة للاستعادة:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخ الاحتياطي المخزن بشكل سليم، فيمكن لإعادة التعيين هذه أيضًا إعادة إنشاء التخزين السري بحيث
تتمكن عمليات البدء البارد المستقبلية من تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة بشكل افتراضي (بما في ذلك تسجيل SDK الداخلي الهادئ) ولا تعرض تشخيصات مفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند الاستخدام في السكربتات.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية هذه وتطلب منك اختيار حساب صراحةً.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطّلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح إعداد هذا الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### ما معنى "مُتحقَّق منه"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه مُتحقَّق منه فقط عندما يتم التحقق منه بواسطة هوية cross-signing الخاصة بك.
عمليًا، يعرض `openclaw matrix verify status --verbose` ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق من قبل العميل الحالي فقط
- `Cross-signing verified`: يفيد SDK بأن الجهاز مُتحقَّق منه عبر cross-signing
- `Signed by owner`: تم توقيع الجهاز بواسطة مفتاح self-signing الخاص بك

تصبح قيمة `Verified by owner` هي `yes` فقط عند وجود تحقق cross-signing أو توقيع من المالك.
ولا تكفي الثقة المحلية وحدها لكي يعامل OpenClaw الجهاز على أنه مُتحقَّق منه بالكامل.

### ما الذي يفعله bootstrap

الأمر `openclaw matrix verify bootstrap` هو أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
وهو ينفذ كل ما يلي بالترتيب:

- يهيّئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود متى أمكن
- يهيّئ cross-signing ويرفع مفاتيح cross-signing العامة الناقصة
- يحاول تعليم الجهاز الحالي وتوقيعه عبر cross-signing
- ينشئ نسخة احتياطية جديدة لمفاتيح الغرف على جهة الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب مصادقة تفاعلية لرفع مفاتيح cross-signing، يحاول OpenClaw الرفع أولًا من دون مصادقة، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما تكون `channels.matrix.password` مهيأة.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية cross-signing الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخة الاحتياطية الحالية لمفاتيح الغرف وبدء
خط أساس جديد للنسخ الاحتياطي للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط عندما تكون موافقًا على أن السجل المشفر القديم غير القابل للاسترداد سيبقى
غير متاح، وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل سر النسخ الاحتياطي الحالي
بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد الإبقاء على الرسائل المشفرة المستقبلية عاملة وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

### سلوك بدء التشغيل

عندما تكون `encryption: true`، تكون القيمة الافتراضية لـ Matrix في `startupVerification` هي `"if-unverified"`.
عند بدء التشغيل، إذا كان هذا الجهاز ما يزال غير متحقق منه، فسيطلب Matrix التحقق الذاتي في عميل Matrix آخر،
وسيتخطى الطلبات المكررة عندما يكون أحدها قيد الانتظار بالفعل، ويطبق فترة تهدئة محلية قبل إعادة المحاولة بعد إعادة التشغيل.
تعاد محاولة الطلبات الفاشلة أسرع افتراضيًا من إنشاء الطلبات الناجحة.
اضبط `startupVerification: "off"` لتعطيل طلبات بدء التشغيل التلقائية، أو عدّل `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفذ بدء التشغيل أيضًا تمريرة bootstrap مشفرة متحفظة تلقائيًا.
تحاول هذه التمريرة أولًا إعادة استخدام التخزين السري الحالي وهوية cross-signing الحالية، وتتجنب إعادة تعيين cross-signing ما لم تشغّل تدفق إصلاح bootstrap صريحًا.

إذا اكتشف بدء التشغيل حالة bootstrap معطوبة وكانت `channels.matrix.password` مهيأة، يمكن لـ OpenClaw محاولة مسار إصلاح أكثر صرامة.
إذا كان الجهاز الحالي موقّعًا بالفعل من المالك، فسيحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [Matrix migration](/ar/install/migrating-matrix) لمعرفة تدفق الترقية الكامل والقيود وأوامر الاسترداد ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرةً داخل غرفة الرسائل الخاصة الصارمة الخاصة بالتحقق كرسائل `m.notice`.
ويشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشاد صريح "تحقق عبر emoji")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (emoji والأرقام العشرية) عند توفرها

تتم متابعة طلبات التحقق الواردة من عميل Matrix آخر وقبولها تلقائيًا بواسطة OpenClaw.
وفي تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق عبر emoji متاحًا ويؤكد جانبه بنفسه.
أما طلبات التحقق من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر أن يستمر تدفق SAS بشكل طبيعي.
وما زلت بحاجة إلى مقارنة SAS المكوّن من emoji أو الأرقام العشرية في عميل Matrix لديك وتأكيد "They match" هناك لإكمال التحقق.

لا يقبل OpenClaw التدفقات المكررة التي يبدأها بنفسه بشكل أعمى. ويتخطى بدء التشغيل إنشاء طلب جديد عندما يكون طلب التحقق الذاتي قيد الانتظار بالفعل.

لا تتم إعادة توجيه إشعارات التحقق الخاصة بالبروتوكول/النظام إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw في الحساب وتجعل الثقة في الغرف المشفرة أصعب في الفهم.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw Matrix القديمة باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم Matrix E2EE مسار التشفير Rust الرسمي في `matrix-js-sdk` على Node، مع `fake-indexeddb` كطبقة IndexedDB بديلة. تُحفَظ حالة التشفير في ملف snapshot (`crypto-idb-snapshot.json`) وتُستعاد عند بدء التشغيل. يُعد ملف snapshot حالة تشغيل حساسة ويتم تخزينه بأذونات ملفات مقيّدة.

توجد حالة التشغيل المشفرة تحت جذور لكل حساب ولكل مستخدم بحسب تجزئة الرمز المميز في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
ويحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`) ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`)، وsnapshot لـ IndexedDB (`crypto-idb-snapshot.json`)،
وربط سلاسل الرسائل (`thread-bindings.json`)، وحالة التحقق عند بدء التشغيل (`startup-verification.json`).
عندما يتغير الرمز المميز بينما تبقى هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لهذا الثلاثي account/homeserver/user بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وروابط سلاسل الرسائل،
وحالة التحقق عند بدء التشغيل مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية بصيغة `mxc://` مباشرةً. وعندما تمرر عنوان URL للصورة الرمزية بصيغة `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو تجاوز الحساب المحدد).

## سلاسل الرسائل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أدوات الرسائل.

- يحتفظ `dm.sessionScope: "per-user"` (الافتراضي) بتوجيه Matrix DM على نطاق المرسل، بحيث يمكن لعدة غرف DM مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة Matrix DM داخل مفتاح جلسة خاص بها مع الاستمرار في استخدام مصادقة DM العادية وفحوصات قائمة السماح.
- تظل روابط محادثات Matrix الصريحة لها الأولوية على `dm.sessionScope`، لذلك تحتفظ الغرف وسلاسل الرسائل المرتبطة بالجلسة المستهدفة التي تم اختيارها.
- يجعل `threadReplies: "off"` الردود على المستوى الأعلى ويحافظ على الرسائل الواردة ضمن سلاسل الرسائل على جلسة الرسالة الأصلية.
- يرد `threadReplies: "inbound"` داخل سلسلة رسائل فقط عندما تكون الرسالة الواردة موجودة بالفعل في تلك السلسلة.
- يجعل `threadReplies: "always"` ردود الغرف ضمن سلسلة رسائل جذرها الرسالة المحفزة ويوجّه تلك المحادثة عبر الجلسة المطابقة ذات نطاق سلسلة الرسائل بدءًا من أول رسالة محفزة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل الخاصة فقط. على سبيل المثال، يمكنك إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل الخاصة مسطحة.
- تتضمن الرسائل الواردة ضمن سلاسل الرسائل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أدوات الرسائل سلسلة Matrix الحالية تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم DM نفسه، ما لم يتم توفير `threadId` صريح.
- لا يعمل إعادة استخدام هدف مستخدم DM للجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية وجود النظير نفسه في DM وعلى حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي على نطاق المستخدم.
- عندما يكتشف OpenClaw أن غرفة Matrix DM تتصادم مع غرفة DM أخرى على جلسة Matrix DM المشتركة نفسها، فإنه ينشر `m.notice` لمرة واحدة في تلك الغرفة مع مخرج `/focus` عند تمكين روابط سلاسل الرسائل وتلميح `dm.sessionScope`.
- يتم دعم روابط سلاسل الرسائل أثناء التشغيل في Matrix. تعمل أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة رسائل في غرف Matrix والرسائل الخاصة.
- ينشئ `/focus` على مستوى غرفة/DM في Matrix سلسلة Matrix جديدة ويربطها بالجلسة المستهدفة عندما تكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة الحالية بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل الخاصة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير سطح الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix الخاصة، أو الغرفة، أو سلسلة الرسائل الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة Matrix خاصة أو غرفة من المستوى الأعلى، يبقى DM/الغرفة الحالية هي سطح الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الرابط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- تكون `threadBindings.spawnAcpSessions` مطلوبة فقط مع `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### تهيئة ربط سلاسل الرسائل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

إشارات الإنشاء المرتبط بسلسلة الرسائل في Matrix اختيارية:

- اضبط `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` من المستوى الأعلى بإنشاء سلاسل Matrix جديدة وربطها.
- اضبط `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات التأكيد الواردة.

- يتم ضبط أدوات التفاعل الصادر بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يؤدي `emoji=""` إلى إزالة تفاعلات حساب bot نفسه على ذلك الحدث.
- يؤدي `remove: true` إلى إزالة تفاعل emoji المحدد فقط من حساب bot.

يستخدم نطاق تفاعلات التأكيد ترتيب الحل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى emoji هوية الوكيل

يُحل نطاق تفاعلات التأكيد بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يقوم `reactionNotifications: "own"` بتمرير أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix صادرة عن bot.
- يقوم `reactionNotifications: "off"` بتعطيل أحداث نظام التفاعل.
- لا تتم محاكاة إزالة التفاعلات كأحداث نظام لأن Matrix يعرضها كعمليات redact، وليس كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرف الأخيرة التي يتم تضمينها كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يتم ضبط الاثنين، فالقيمة الافتراضية الفعلية هي `0`. اضبط `0` للتعطيل.
- يكون سجل غرف Matrix خاصًا بالغرفة فقط. وتستمر الرسائل الخاصة في استخدام سجل الجلسة العادي.
- يكون سجل غرف Matrix معلّقًا فقط: يخزّن OpenClaw رسائل الغرف التي لم تؤدِّ إلى رد بعد، ثم يلتقط snapshot لتلك النافذة عند وصول mention أو محفز آخر.
- لا يتم تضمين رسالة التحفيز الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد إعادة محاولة الحدث نفسه في Matrix استخدام snapshot السجل الأصلي بدلًا من الانجراف إلى رسائل الغرفة الأحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرفة، مثل نص الرد الذي تم جلبه، وجذور سلاسل الرسائل، والسجل المعلق.

- `contextVisibility: "all"` هو الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما تم استلامه.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق الإضافي إلى المرسلين المسموح بهم وفقًا لفحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تؤدي إلى رد.
ويظل تفويض التحفيز ناتجًا عن إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسات الرسائل الخاصة.

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

راجع [Groups](/ar/channels/groups) لمعرفة سلوك تقييد mentions وقائمة السماح.

مثال اقتران لرسائل Matrix الخاصة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير المعتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إنشاء رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق اقتران الرسائل الخاصة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا أصبحت حالة الرسائل المباشرة غير متزامنة، فقد ينتهي الأمر بـ OpenClaw إلى وجود تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من DM الحي. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل DM صارمًا 1:1 تم تعيينه بالفعل في `m.direct`
- يعود إلى أي DM صارم 1:1 منضم إليه حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد DM سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار DM السليمة فقط ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى، الغرفة الصحيحة مرة أخرى.

## موافقات Exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. وتظل
عناصر توجيه DM/القناة الأصلية موجودة تحت تهيئة موافقات exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يرجع إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يقوم Matrix بتمكين الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حل موافق واحد على الأقل. تستخدم موافقات Exec `execApprovals.approvers` أولًا ويمكنها الرجوع إلى `channels.matrix.dm.allowFrom`. وتفوض موافقات Plugin عبر `channels.matrix.dm.allowFrom`. اضبط `enabled: false` لتعطيل Matrix كعميل موافقة أصلي صراحةً. وإلا ستعود طلبات الموافقة إلى مسارات موافقة مهيأة أخرى أو إلى سياسة الرجوع الخاصة بالموافقة.

يدعم التوجيه الأصلي في Matrix نوعَي الموافقة:

- تتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل الخاصة/القنوات لمطالبات الموافقة في Matrix.
- تستخدم موافقات Exec مجموعة الموافقين الخاصة بـ exec من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح للرسائل الخاصة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على كل من موافقات exec وPlugin.

قواعد التسليم:

- يرسل `target: "dm"` مطالبات الموافقة إلى الرسائل الخاصة للموافقين
- يرسل `target: "channel"` المطالبة مرة أخرى إلى غرفة Matrix أو الرسالة الخاصة الأصلية
- يرسل `target: "both"` إلى الرسائل الخاصة للموافقين وإلى غرفة Matrix أو الرسالة الخاصة الأصلية

تُنشئ مطالبات الموافقة في Matrix اختصارات تفاعل على رسالة الموافقة الأساسية:

- `✅` = سماح مرة واحدة
- `❌` = رفض
- `♾️` = سماح دائم عندما يكون هذا القرار مسموحًا به وفق سياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر الشرطة المائلة البديلة: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم حلهم الموافقة أو الرفض. بالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا لا تمكّن `channel` أو `both` إلا في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

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

تعمل القيم في `channels.matrix` على المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يقم حساب ما بتجاوزها.
يمكنك تقييد إدخالات الغرف الموروثة بحساب Matrix واحد باستخدام `groups.<room>.account`.
تظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما أن الإدخالات التي تحتوي على `account: "default"` تستمر في العمل عندما يكون الحساب الافتراضي مهيأ مباشرةً على `channels.matrix.*` في المستوى الأعلى.
لا تؤدي القيم الافتراضية الجزئية المشتركة للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا ينشئ OpenClaw حساب `default` في المستوى الأعلى إلا عندما تكون لدى هذا الحساب الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن أن تظل الحسابات المسماة قابلة للاكتشاف من خلال `homeserver` مع `userId` عندما تلبّي بيانات الاعتماد المخزنة مؤقتًا المصادقة لاحقًا.
إذا كان لدى Matrix بالفعل حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. يتم نقل مفاتيح مصادقة/bootstrap الخاصة بـ Matrix فقط إلى ذلك الحساب المُرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.
اضبط `defaultAccount` عندما تريد أن يفضّل OpenClaw حساب Matrix مسمى واحدًا للتوجيه الضمني، والفحص، وعمليات CLI.
إذا كانت هناك عدة حسابات Matrix مهيأة وكان أحد معرّفات الحسابات هو `default`، فإن OpenClaw يستخدم ذلك الحساب ضمنيًا حتى إذا لم يكن `defaultAccount` مضبوطًا.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار الحساب الضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لأمر واحد.

راجع [Configuration reference](/ar/gateway/configuration-reference#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## الخوادم المنزلية الخاصة/ضمن الشبكة المحلية

بشكل افتراضي، يمنع OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم
تفعّل ذلك صراحةً لكل حساب.

إذا كان الخادم المنزلي يعمل على localhost، أو عنوان IP ضمن LAN/Tailscale، أو اسم مضيف داخلي، فقم بتمكين
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

يسمح هذا التفعيل فقط بالأهداف الخاصة/الداخلية الموثوقة. أما الخوادم المنزلية العامة غير المشفرة مثل
`http://matrix.example.org:8008` فتظل محظورة. ويُفضَّل استخدام `https://` كلما أمكن.

## تمرير حركة Matrix عبر proxy

إذا كان نشر Matrix لديك يحتاج إلى HTTP(S) proxy صريح للصادر، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
ويستخدم OpenClaw إعداد proxy نفسه لكل من حركة Matrix أثناء التشغيل وعمليات فحص حالة الحساب.

## حل الأهداف

يقبل Matrix صيغ الأهداف التالية في أي موضع يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث الحي في الدليل حساب Matrix المسجل دخوله:

- تستعلم عمليات بحث المستخدمين من دليل مستخدمي Matrix على ذلك الخادم المنزلي.
- تقبل عمليات بحث الغرف معرّفات الغرف الصريحة والأسماء المستعارة مباشرةً، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- البحث في أسماء الغرف المنضم إليها هو جهد أفضل. إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله أثناء حل قائمة السماح وقت التشغيل.

## مرجع التهيئة

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند تهيئة عدة حسابات Matrix.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بخوادم منزلية خاصة/داخلية. فعّل هذا عندما يُحل الخادم المنزلي إلى `localhost` أو عنوان IP ضمن LAN/Tailscale أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) proxy لحركة Matrix. ويمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `proxy` الخاصة بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: رمز وصول للمصادقة المعتمدة على الرمز. تُدعم القيم النصية الصريحة وقيم SecretRef في `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر مزودي env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول المعتمد على كلمة المرور. تُدعم القيم النصية الصريحة وقيم SecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون قيمته `true`، يقوم بترقية سياسة الغرف `open` إلى `allowlist`، ويفرض جميع سياسات الرسائل الخاصة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. ولا يؤثر في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات Matrix OpenClaw الأخرى المهيأة (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة الإضافي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. يجب أن تكون الإدخالات معرّفات مستخدمي Matrix كاملة؛ ويتم تجاهل الأسماء غير المحلولة وقت التشغيل.
- `historyLimit`: الحد الأقصى لرسائل الغرف التي تُضمَّن كسياق سجل للمجموعة. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يتم ضبط الاثنين، فالقيمة الافتراضية الفعلية هي `0`. اضبط `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: تهيئة اختيارية لتصيير Markdown للنصوص الصادرة في Matrix.
- `streaming`: `off` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو `true`، أو `false`. تؤدي `"partial"` و`true` إلى تمكين تحديثات المسودات بأسلوب المعاينة أولًا باستخدام رسائل Matrix النصية العادية. وتستخدم `"quiet"` إشعارات معاينة غير مُرسِلة للتنبيه لإعدادات push-rule المستضافة ذاتيًا. ويكافئ `false` القيمة `"off"`.
- `blockStreaming`: تؤدي القيمة `true` إلى تمكين رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بسلاسل الرسائل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تجزئة الرسائل الصادرة بعدد الأحرف (يُطبّق عندما تكون `chunkMode` هي `length`).
- `chunkMode`: تقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ وتقوم `newline` بالتقسيم عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُسبق بها جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل التأكيد لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل التأكيد (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت للإرسال الصادر ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. تنطبق على جميع دعوات Matrix، بما في ذلك دعوات نمط الرسائل الخاصة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. يتم حل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوات؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل الخاصة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في وصول الرسائل الخاصة بعد أن ينضم OpenClaw إلى الغرفة ويصنّفها على أنها DM. ولا يغيّر ما إذا كانت الدعوة تُضم تلقائيًا.
- `dm.allowFrom`: يجب أن تكون الإدخالات معرّفات مستخدمي Matrix كاملة ما لم تكن قد قمت بالفعل بحلّها عبر البحث الحي في الدليل.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن تحتفظ كل غرفة Matrix DM بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة سلاسل الرسائل خاص بالرسائل الخاصة (`off` أو `inbound` أو `always`). وهو يتجاوز إعداد `threadReplies` في المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل الخاصة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما تحدد `dm.allowFrom` الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. وتعمل قيم `channels.matrix` في المستوى الأعلى كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. يُفضَّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة وقت التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد الحل.
- `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من bots المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات سماح/منع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لتقييد mentions. تؤدي `true` إلى تعطيل متطلبات mention لتلك الغرفة؛ وتؤدي `false` إلى فرضها مجددًا.
- `groups.<room>.skills`: مرشح Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [Channels Overview](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [Groups](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد mentions
- [Channel Routing](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [Security](/ar/gateway/security) — نموذج الوصول والتقوية
