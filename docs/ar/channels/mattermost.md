---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد بوت Mattermost وتهيئة OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T13:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل (رمز بوت + أحداث WebSocket). تُدعم القنوات والقنوات الخاصة والرسائل المباشرة الجماعية والرسائل المباشرة. Mattermost منصة مراسلة للفرق قابلة للاستضافة الذاتية ([mattermost.com](https://mattermost.com)).

## التثبيت

<Tabs>
  <Tab title="سجل npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="نسخة محلية">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

التفاصيل: [الإضافات](/ar/tools/plugin)

## الإعداد السريع

<Steps>
  <Step title="التأكد من توفر Plugin">
    ثبّت `@openclaw/mattermost` باستخدام الأمر أعلاه، ثم أعد تشغيل Gateway إذا كان قيد التشغيل بالفعل.
  </Step>
  <Step title="إنشاء بوت Mattermost">
    أنشئ حساب بوت في Mattermost، وانسخ **رمز البوت**، وأضف البوت إلى الفرق والقنوات التي ينبغي له قراءتها.
  </Step>
  <Step title="نسخ عنوان URL الأساسي">
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`). تُزال `/api/v4` اللاحقة تلقائيًا.
  </Step>
  <Step title="تهيئة OpenClaw وتشغيل Gateway">
    الحد الأدنى من التهيئة:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    بديل غير تفاعلي:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
عند استضافة Mattermost ذاتيًا على عنوان خاص/شبكة LAN/شبكة tailnet: تمر طلبات API الصادرة إلى Mattermost عبر آلية حماية من SSRF تحظر عناوين IP الخاصة والداخلية افتراضيًا. فعّل السماح باستخدام `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (لكل حساب: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## أوامر الشرطة المائلة الأصلية

أوامر الشرطة المائلة الأصلية اختيارية. عند تمكينها، يسجّل OpenClaw أوامر الشرطة المائلة `oc_*` في كل فريق يكون البوت عضوًا فيه، ويتلقى طلبات POST للاستدعاء على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // استخدمه عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً (وكيل عكسي/عنوان URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

الأوامر المسجّلة: `/oc_status`، و`/oc_model`، و`/oc_models`، و`/oc_new`، و`/oc_help`، و`/oc_think`، و`/oc_reasoning`، و`/oc_verbose`، و`/oc_queue`. باستخدام `nativeSkills: true`، تُسجّل أوامر Skills أيضًا بصيغة `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="ملاحظات السلوك">
    - القيمتان `native` و`nativeSkills` افتراضيًا هما `"auto"`، والتي تُحل إلى التعطيل في Mattermost. اضبطهما صراحةً على `true`.
    - القيمة الافتراضية لـ `callbackPath` هي `/api/channels/mattermost/command`.
    - إذا حُذفت `callbackUrl`، يشتق OpenClaw القيمة `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. تعود مضيفات الربط ذات أحرف البدل (`0.0.0.0`، و`::`) إلى `localhost`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (تتجاوز قيم الحساب حقول المستوى الأعلى).
    - تُترك أوامر الشرطة المائلة الحالية التي لها المشغّل نفسه وأنشأتها عمليات تكامل أخرى دون تغيير (يتخطى التسجيل تلك الأوامر)؛ أما الأوامر التي أنشأها البوت فتُحدّث أو يُعاد إنشاؤها عندما يتغير عنوان URL للاستدعاء.
    - يُتحقق من استدعاءات الأوامر باستخدام الرموز الخاصة بكل أمر التي يعيدها Mattermost عندما يسجّل OpenClaw أوامر `oc_*`.
    - يحدّث OpenClaw تسجيل أوامر Mattermost الحالي قبل قبول كل استدعاء، ولذلك يتوقف قبول الرموز القديمة لأوامر الشرطة المائلة المحذوفة أو المعاد إنشاؤها دون الحاجة إلى إعادة تشغيل Gateway.
    - يفشل التحقق من الاستدعاء بشكل مغلق إذا تعذر على API الخاص بـ Mattermost تأكيد أن الأمر لا يزال حاليًا؛ وتُخزّن عمليات التحقق الفاشلة مؤقتًا لفترة وجيزة، وتُدمج عمليات البحث المتزامنة، ويُحدّ معدل بدء عمليات البحث الجديدة لكل أمر للحد من ضغط إعادة التشغيل.
    - تفشل استدعاءات الشرطة المائلة بشكل مغلق عند فشل التسجيل، أو اكتمال بدء التشغيل جزئيًا، أو عدم تطابق رمز الاستدعاء مع الرمز المسجّل للأمر الذي جرى حله (لا يمكن لرمز صالح لأمر واحد الوصول إلى التحقق في المنبع لأمر مختلف).
    - يُقرّ باستلام الاستدعاءات المقبولة برد مؤقت "جارٍ المعالجة..."؛ وتصل الإجابة الفعلية كرسالة عادية.

  </Accordion>
  <Accordion title="متطلبات إمكانية الوصول">
    يجب أن تكون نقطة نهاية الاستدعاء قابلة للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف/مساحة أسماء الشبكة نفسها التي يعمل عليها OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost إلا إذا كان ذلك العنوان يمرر `/api/channels/mattermost/command` عبر وكيل عكسي إلى OpenClaw.
    - يمكن إجراء تحقق سريع باستخدام `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw، لا `404`.

  </Accordion>
  <Accordion title="قائمة السماح لاتصالات Mattermost الصادرة">
    إذا كانت استدعاءاتك تستهدف عناوين خاصة/tailnet/داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق الاستدعاء.

    استخدم إدخالات المضيف/النطاق، لا عناوين URL كاملة.

    - صحيح: `gateway.tailnet-name.ts.net`
    - خطأ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه المتغيرات على مضيف Gateway إذا كنت تفضّل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم التهيئة.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` في مساحة العمل؛ راجع [ملفات ‎.env لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يستجيب Mattermost للرسائل المباشرة تلقائيًا. تتحكم `chatmode` في سلوك القنوات:

<Tabs>
  <Tab title="oncall (الافتراضي)">
    لا يستجيب في القنوات إلا عند الإشارة إليه باستخدام @.
  </Tab>
  <Tab title="onmessage">
    يستجيب لكل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    يستجيب عندما تبدأ الرسالة ببادئة تشغيل.
  </Tab>
</Tabs>

مثال للتهيئة:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // الافتراضي
    },
  },
}
```

ملاحظات:

- تظل `onchar` تستجيب للإشارات الصريحة باستخدام @.
- تظل `channels.mattermost.requireMention` معتمدة، لكن يُفضّل استخدام `chatmode`. تتقدم إعدادات `groups.<channelId>.requireMention` الخاصة بكل قناة على كليهما.
- بعد أن يرسل البوت ردًا مرئيًا في سلسلة رسائل ضمن قناة، يُجاب عن الرسائل اللاحقة في سلسلة الرسائل نفسها دون إشارة جديدة باستخدام @ أو بادئة `onchar`، مما يسمح باستمرار محادثات سلسلة الرسائل متعددة الأدوار. يُتذكر الاشتراك لمدة 7 أيام بعد آخر رد للبوت في سلسلة الرسائل، ويستمر عبر عمليات إعادة تشغيل Gateway. لا تتأثر سلاسل الرسائل التي راقبها البوت فقط؛ ابدأ رسالة جديدة في المستوى الأعلى لطلب إشارة صريحة مرة أخرى.

## سلاسل الرسائل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم في بقاء ردود القنوات والمجموعات في القناة الرئيسية أو بدء سلسلة رسائل أسفل المنشور المشغّل.

- `off` (الافتراضي): لا ترد في سلسلة رسائل إلا عندما يكون المنشور الوارد موجودًا في سلسلة بالفعل.
- `first`: بالنسبة إلى منشورات القنوات/المجموعات في المستوى الأعلى، ابدأ سلسلة رسائل أسفل ذلك المنشور ووجّه المحادثة إلى جلسة ذات نطاق سلسلة الرسائل.
- `all` و`batched`: السلوك نفسه الذي تتبعه `first` في Mattermost حاليًا، لأنه بمجرد وجود جذر لسلسلة الرسائل في Mattermost، تستمر الأجزاء والوسائط اللاحقة ضمن سلسلة الرسائل نفسها.
- تستخدم الرسائل المباشرة `off` افتراضيًا حتى عند ضبط `replyToMode`.

استخدم `channels.mattermost.replyToModeByChatType` لتجاوز الوضع لدردشات `direct` أو `group` أو `channel`. اضبط `direct` لإدخال الرسائل المباشرة ضمن سلاسل الرسائل:

- `off` (الافتراضي): تظل الرسائل المباشرة خارج سلاسل الرسائل ضمن جلسة واحدة مستمرة.
- `first` أو `all` أو `batched`: تبدأ كل رسالة مباشرة في المستوى الأعلى سلسلة رسائل في Mattermost مدعومة بجلسة جديدة ومستقلة.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

ملاحظات:

- تستخدم الجلسات ذات نطاق سلسلة الرسائل معرّف المنشور المشغّل باعتباره جذر سلسلة الرسائل.
- تُعد `first` و`all` متكافئتين حاليًا، لأنه بمجرد وجود جذر لسلسلة الرسائل في Mattermost، تستمر الأجزاء والوسائط اللاحقة ضمن سلسلة الرسائل نفسها.
- تتقدم التجاوزات الخاصة بكل نوع دردشة على `replyToMode`. من دون تجاوز `direct`، تحتفظ عمليات النشر الحالية بالرسائل المباشرة المسطحة وغير المتفرعة إلى سلاسل رسائل.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يحصل المرسلون غير المعروفين على رمز إقران). القيم الأخرى: `allowlist`، و`open`، و`disabled`.
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]` (يفرض مخطط التهيئة حرف البدل).
- تقبل `channels.mattermost.allowFrom` معرّفات المستخدمين (موصى بها) وإدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (يتطلب إشارة).
- أدرج المرسلين في قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (يُوصى بمعرّفات المستخدمين).
- تقبل `channels.mattermost.groupAllowFrom` إدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).
- توجد تجاوزات الإشارة الخاصة بكل قناة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` للقيمة الافتراضية.
- مطابقة `@username` قابلة للتغيير ولا تُمكّن إلا عندما تكون `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (تتطلب إشارة).
- ترتيب الحل: `channels.mattermost.groupPolicy`، ثم `channels.defaults.groupPolicy`، ثم `"allowlist"`.
- ملاحظة حول وقت التشغيل: إذا كان قسم `channels.mattermost` مفقودًا بالكامل، يفشل وقت التشغيل بشكل مغلق إلى `groupPolicy="allowlist"` عند فحوصات المجموعات (حتى إذا ضُبطت `channels.defaults.groupPolicy`) ويسجّل تحذيرًا لمرة واحدة.

مثال:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## أهداف التسليم الصادر

استخدم تنسيقات الأهداف التالية مع `openclaw message send` أو Cron/Webhook:

| الهدف                               | يُسلَّم إلى                                                     |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | قناة حسب المعرّف                                                 |
| `channel:<name>` أو `#channel-name` | قناة حسب الاسم، مع البحث عبر الفرق التي ينتمي إليها البوت |
| `user:<id>` أو `mattermost:<id>`    | رسالة مباشرة مع ذلك المستخدم                                             |
| `@username`                         | رسالة مباشرة (يُحل اسم المستخدم عبر API الخاص بـ Mattermost)                 |

تدعم عمليات الإرسال الصادرة مرفقًا واحدًا كحد أقصى لكل رسالة؛ قسّم الملفات المتعددة إلى عمليات إرسال منفصلة.

<Warning>
المعرّفات المبهمة المجرّدة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يحلّها OpenClaw **بأولوية المستخدم**:

- إذا كان المعرّف موجودًا كمستخدم (نجحت `GET /api/v4/users/<id>`)، يرسل OpenClaw **رسالة مباشرة** بحل القناة المباشرة عبر `/api/v4/channels/direct`.
- وإلا، يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج أولًا إلى تحديد القناة المباشرة، فإنه يعيد افتراضيًا محاولة إنشاء القناة المباشرة عند حدوث إخفاقات عابرة.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك بصورة عامة لـ Plugin ‏Mattermost، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد. القيم الافتراضية:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

ملاحظات:

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس على كل استدعاء لواجهة Mattermost البرمجية.
- تستخدم إعادة المحاولة تراجعًا أُسّيًا مع تفاوت عشوائي، وتنطبق على الإخفاقات العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا تُعاد محاولتها.

## البث التدفقي للمعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي إلى **منشور معاينة مسودة** يُستكمل في موضعه عندما تصبح الإجابة النهائية آمنة للإرسال. في وضع `partial`، تُحدَّث المعاينة باستخدام معرّف المنشور نفسه بدلًا من إغراق القناة برسائل لكل جزء. وفي وضع `block`، تتناوب المعاينة بين النص المكتمل وكتل نشاط الأدوات، بحيث تظل الكتل السابقة ظاهرة كمنشورات مستقلة بدلًا من استبدالها بالكتلة التالية. تلغي النتائج النهائية للوسائط/الأخطاء تعديلات المعاينة المعلّقة وتستخدم التسليم العادي بدلًا من إرسال منشور معاينة مؤقت.

يكون البث التدفقي للمعاينة **مفعّلًا افتراضيًا** في وضع `partial`. اضبطه عبر `channels.mattermost.streaming.mode` (يرحّل `openclaw doctor --fix` قيم `streaming` العددية/المنطقية القديمة):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="أوضاع البث التدفقي">
    - `partial` (الافتراضي): منشور معاينة واحد يُعدَّل مع نمو الرد، ثم يُستكمل بالإجابة الكاملة.
    - يُناوب `block` المعاينة بين النص المكتمل وكتل نشاط الأدوات، بحيث تظل كل كتلة ظاهرة كمنشور مستقل بدلًا من استبدالها في موضعها. تشترك تحديثات الأدوات المتوازية والمتتالية في منشور نشاط الأدوات الحالي.
    - يعرض `progress` معاينة للحالة أثناء الإنشاء، ولا ينشر الإجابة النهائية إلا عند الاكتمال.
    - يعطّل `off` البث التدفقي للمعاينة. مع `streaming.block.enabled: true`، تستمر كتل المساعد المكتملة في الوصول كردود كتل عادية (منشورات منفصلة) بدلًا من منشور نهائي واحد مدمج.

  </Accordion>
  <Accordion title="ملاحظات حول سلوك البث التدفقي">
    - إذا تعذر استكمال البث في موضعه (مثلًا إذا حُذف المنشور في أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد لضمان عدم فقدان الرد.
    - تُحجب الحمولات التي تحتوي على التفكير فقط من منشورات القناة، بما في ذلك النص الذي يصل كاقتباس كتلي `> Thinking`. اضبط `/reasoning on` لرؤية التفكير في واجهات أخرى؛ ويحتفظ منشور Mattermost النهائي بالإجابة فقط.
    - راجع [البث التدفقي](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان الرأسيتان اختياريتان).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- تُمرَّر أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة، مع خضوعها لفحوص سياسة الرسائل المباشرة/المجموعات نفسها المطبقة على الرسائل.

أمثلة:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

الإعداد:

- `channels.mattermost.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (القيمة الافتراضية true).
- التجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تتضمن أزرارًا قابلة للنقر. عندما ينقر مستخدم زرًا، يتلقى الوكيل التحديد ويمكنه الرد.

تأتي الأزرار من حمولة `presentation` الدلالية (في ردود الوكيل العادية وفي `message action=send`). يعرض OpenClaw أزرار القيم كأزرار Mattermost تفاعلية، ويُبقي أزرار عناوين URL ظاهرة في نص الرسالة، ويحوّل قوائم التحديد إلى نص مقروء.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"نعم","value":"yes"},{"label":"لا","value":"no"}]}]}
```

حقول زر العرض:

<ParamField path="label" type="string" required>
  تسمية العرض (الاسم البديل: `text`).
</ParamField>
<ParamField path="value" type="string">
  القيمة المُعادة عند النقر، وتُستخدم كمعرّف الإجراء (الأسماء البديلة: `callback_data`، `callbackData`). مطلوبة للزر القابل للنقر ما لم يُضبط `url`.
</ParamField>
<ParamField path="url" type="string">
  زر رابط؛ يُعرض كنص `label: url` في متن الرسالة بدلًا من زر تفاعلي.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  نمط الزر. يطبق Mattermost التنسيق الافتراضي على القيم التي لا يدعمها.
</ParamField>

للإعلان عن دعم الأزرار في مطالبة نظام الوكيل، أضف `inlineButtons` إلى إمكانات القناة:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

عندما ينقر مستخدم زرًا:

<Steps>
  <Step title="التحقق من الوصول">
    يجب أن يجتاز الناقر فحوص سياسة الرسائل المباشرة/المجموعات نفسها التي يجتازها مرسل الرسالة؛ تتلقى النقرات غير المصرّح بها إشعارًا مؤقتًا وتُتجاهل.
  </Step>
  <Step title="استبدال الأزرار بتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثلًا: "✓ اختار @user ‏**نعم**").
  </Step>
  <Step title="يتلقى الوكيل التحديد">
    يتلقى الوكيل التحديد كرسالة واردة (إضافةً إلى حدث نظام) ويرد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات الأزرار الراجعة التحقق باستخدام HMAC-SHA256 (تلقائي، ولا يحتاج إلى إعداد).
    - تُستبدل كتلة المرفق بأكملها عند النقر، لذلك تُزال جميع الأزرار معًا، ولا يمكن إزالتها جزئيًا.
    - تُطهَّر معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا (بسبب قيد توجيه في Mattermost).
    - تُرفض النقرات التي لا يطابق فيها `action_id` إجراءً في المنشور الأصلي باستخدام `403` ("إجراء غير معروف").

  </Accordion>
  <Accordion title="الإعداد وإمكانية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتمكين وصف أداة الأزرار في مطالبة نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لاستدعاءات الأزرار الراجعة (مثلًا `https://gateway.example.com`). استخدمه عندما يتعذر على Mattermost الوصول مباشرةً إلى Gateway عبر مضيف الربط الخاص به.
    - في إعدادات الحسابات المتعددة، يمكن أيضًا ضبط الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا أُغفل `interactions.callbackBaseUrl`، يشتق OpenClaw عنوان URL للاستدعاء الراجع من `gateway.customBindHost` + `gateway.port` (القيمة الافتراضية 18789)، ثم يعود إلى `http://localhost:<port>`. مسار الاستدعاء الراجع هو `/mattermost/interactions/<accountId>`.
    - قاعدة إمكانية الوصول: يجب أن يكون عنوان URL لاستدعاء الزر الراجع قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف/نطاق أسماء الشبكة نفسه.
    - `channels.mattermost.interactions.allowedSourceIps`: قائمة سماح بعناوين IP المصدر لاستدعاءات الأزرار الراجعة. من دونها، لا تُقبل إلا المصادر المحلية (`127.0.0.1`، `::1`)؛ لذلك يجب إضافة خادم Mattermost البعيد إلى قائمة السماح هنا، وإلا تُرفض نقراته باستخدام `403`. وعند العمل خلف وكيل عكسي، اضبط أيضًا `gateway.trustedProxies` كي يُشتق عنوان IP الحقيقي للعميل من الترويسات المُمرّرة.
    - إذا كان هدف الاستدعاء الراجع خاصًا/ضمن شبكة tailnet/داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

  </Accordion>
</AccordionGroup>

### التكامل المباشر مع واجهة API (البرامج النصية الخارجية)

يمكن للبرامج النصية الخارجية وWebhooks نشر الأزرار مباشرةً عبر واجهة Mattermost REST API بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. يُفضَّل استخدام أداة `message` الخاصة بـ OpenClaw. للتكاملات المباشرة، استورد `buildButtonAttachments` من `@openclaw/mattermost/api.js`؛ وإذا كنت تنشر JSON خامًا، فاتبع هذه القواعد:

**بنية الحمولة:**

```json5
{
  channel_id: "<channelId>",
  message: "اختر خيارًا:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // أحرف وأرقام فقط - انظر أدناه
            type: "button", // مطلوب، وإلا تُتجاهل النقرات بصمت
            name: "موافقة", // تسمية العرض
            style: "primary", // اختياري: "default"، "primary"، "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // يجب أن يطابق معرّف الزر
                action: "approve",
                // ... أي حقول مخصصة ...
                _token: "<hmac>", // راجع قسم HMAC أدناه
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**قواعد بالغة الأهمية**

1. توضع المرفقات في `props.attachments`، وليس في `attachments` ذي المستوى الأعلى (يُتجاهل بصمت).
2. يحتاج كل إجراء إلى `type: "button"`؛ ومن دونه، تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id`؛ يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الخاص بالإجراء مكوّنًا من **أحرف وأرقام فقط** (`[a-zA-Z0-9]`). تؤدي الشرطات والشرطات السفلية إلى تعطيل توجيه الإجراءات على جانب خادم Mattermost (يُرجع 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر؛ يرفض Gateway النقرات التي لا يوجد `action_id` الخاص بها في المنشور.
6. `context.action_id` مطلوب؛ يُرجع معالج التفاعل 400 من دونه.
7. يجب السماح بعنوان IP مصدر الاستدعاء الراجع (راجع `interactions.allowedSourceIps` أعلاه).

</Warning>

**إنشاء رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب أن تنشئ البرامج النصية الخارجية رموزًا تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتقاق السر من رمز البوت">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`، بترميز سداسي عشري.
  </Step>
  <Step title="إنشاء كائن السياق">
    أنشئ كائن السياق بكل الحقول **باستثناء** `_token`.
  </Step>
  <Step title="التسلسل بمفاتيح مرتبة">
    نفّذ التسلسل باستخدام **مفاتيح مرتبة تكراريًا** و**من دون مسافات** (يطبّع Gateway الكائنات المتداخلة أيضًا وينتج JSON مضغوطًا).
  </Step>
  <Step title="توقيع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="إضافة الرمز">
    أضف الملخص السداسي العشري الناتج باسم `_token` في السياق.
  </Step>
</Steps>

مثال بلغة Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="أخطاء HMAC الشائعة">
    - تضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
    - وقّع دائمًا **جميع** حقول السياق (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية إلى فشل صامت في التحقق.
    - استخدم `sort_keys=True`؛ إذ يرتّب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز البوت (بصورة حتمية)، وليس من بايتات عشوائية. يجب أن يكون السر متطابقًا بين العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محوّل الدليل

يتضمن Plugin الخاص بـ Mattermost محوّل دليل يحل أسماء القنوات والمستخدمين عبر واجهة Mattermost API. يتيح ذلك استخدام هدفي `#channel-name` و`@username` في عمليات التسليم عبر `openclaw message send` وcron/webhook.

لا يلزم أي إعداد؛ إذ يستخدم المحوّل رمز البوت من إعدادات الحساب.

## حسابات متعددة

يدعم Mattermost حسابات متعددة ضمن `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

تتجاوز قيم الحساب الحقول ذات المستوى الأعلى؛ ويحدد `channels.mattermost.defaultAccount` الحساب المستخدم عند عدم تحديد حساب.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تأكد من وجود البوت في القناة والإشارة إليه (oncall)، أو استخدم بادئة تشغيل (onchar)، أو عيّن `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز البوت وعنوان URL الأساسي وما إذا كان الحساب مفعّلًا.
    - مشكلات الحسابات المتعددة: لا تنطبق متغيرات البيئة إلا على حساب `default`.
    - تحتاج مضيفات Mattermost الخاصة أو الموجودة على الشبكة المحلية إلى `network.dangerouslyAllowPrivateNetwork: true` (يحظر واقي SSRF عناوين IP الخاصة افتراضيًا).

  </Accordion>
  <Accordion title="فشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز معاودة الاتصال. تشمل الأسباب المعتادة:
      - فشل تسجيل أمر الشرطة المائلة أو اكتماله جزئيًا فقط عند بدء التشغيل
      - وصول معاودة الاتصال إلى Gateway أو الحساب الخطأ
      - احتفاظ Mattermost بأوامر قديمة تشير إلى هدف معاودة اتصال سابق
      - إعادة تشغيل Gateway دون إعادة تنشيط أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا حُذف `callbackUrl` وحذرت السجلات من أن معاودة الاتصال تحولت إلى عنوان URL للاسترجاع الحلقي مثل `http://localhost:18789/...`، فمن المرجح ألا يكون عنوان URL هذا قابلًا للوصول إلا عندما يعمل Mattermost على المضيف أو نطاق الشبكة نفسه الذي يعمل عليه OpenClaw. عيّن بدلًا منه `commands.callbackUrl` صريحًا يمكن الوصول إليه خارجيًا.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء أو لا تظهر إطلاقًا: بيانات الزر غير صحيحة. يحتاج كل زر عرض إلى `label` و`value` (تُستبعد الأزرار التي تفتقد أيًا منهما).
    - تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من إمكانية وصول خادم Mattermost إلى Gateway، ومن تضمين عنوان IP لخادم Mattermost في `channels.mattermost.interactions.allowedSourceIps` (لا يُقبل من دونه إلا الاسترجاع الحلقي)، ومن أن `ServiceSettings.AllowedUntrustedInternalConnections` يتضمن مضيف معاودة الاتصال للأهداف الخاصة.
    - تعيد الأزرار الخطأ 404 عند النقر: يُرجح أن يحتوي `id` الخاص بالزر على واصلات أو شرطات سفلية. يتعطل موجّه إجراءات Mattermost مع المعرّفات التي تحتوي محارف غير أبجدية رقمية. استخدم `[a-zA-Z0-9]` فقط.
    - يسجل Gateway الرسالة `rejected callback source`: جاءت النقرة من عنوان IP خارج `interactions.allowedSourceIps`. أضف خادم Mattermost أو نقطة الدخول إلى قائمة السماح، وعيّن `gateway.trustedProxies` عند استخدام وكيل عكسي.
    - يسجل Gateway الرسالة `invalid _token`: عدم تطابق HMAC. تحقق من توقيع جميع حقول السياق (وليس مجموعة فرعية)، واستخدام مفاتيح مرتبة، واستخدام JSON مضغوط (من دون مسافات). راجع قسم HMAC أعلاه.
    - يسجل Gateway الرسالة `missing _token in context`: الحقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند إنشاء حمولة التكامل.
    - يرفض Gateway النقرة مع `Unknown action`: لا يطابق `context.action_id` أي `id` لإجراء في المنشور. عيّن كليهما إلى القيمة المنقّحة نفسها.
    - لا يعرض الوكيل أزرارًا: أضف `capabilities: ["inlineButtons"]` إلى إعدادات قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك المحادثات الجماعية والتحكم عبر الإشارات
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
