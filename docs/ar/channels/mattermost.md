---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد روبوت Mattermost وتهيئة OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T05:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل (رمز البوت + أحداث WebSocket). تُدعَم القنوات والقنوات الخاصة والرسائل المباشرة الجماعية والرسائل المباشرة. Mattermost منصة مراسلة للفرق يمكن استضافتها ذاتيًا ([mattermost.com](https://mattermost.com)).

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
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`). تُزال اللاحقة `/api/v4` تلقائيًا.
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
عند استخدام Mattermost مستضاف ذاتيًا على عنوان خاص أو ضمن شبكة LAN أو tailnet: تمر طلبات واجهة API الصادرة إلى Mattermost عبر آلية حماية من SSRF تحظر عناوين IP الخاصة والداخلية افتراضيًا. فعّل السماح صراحةً باستخدام `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (ولكل حساب: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## أوامر الشرطة المائلة الأصلية

أوامر الشرطة المائلة الأصلية اختيارية. عند تمكينها، يسجّل OpenClaw أوامر الشرطة المائلة `oc_*` في كل فريق يكون البوت عضوًا فيه، ويتلقى طلبات POST للاستدعاء العكسي على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // يُستخدم عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً (وكيل عكسي/عنوان URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

الأوامر المسجّلة: `/oc_status` و`/oc_model` و`/oc_models` و`/oc_new` و`/oc_help` و`/oc_think` و`/oc_reasoning` و`/oc_verbose` و`/oc_queue`. عند ضبط `nativeSkills: true`، تُسجّل أوامر Skills أيضًا بصيغة `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="ملاحظات السلوك">
    - القيمة الافتراضية لكل من `native` و`nativeSkills` هي `"auto"`، والتي تعني التعطيل في Mattermost. اضبطهما صراحةً على `true`.
    - القيمة الافتراضية لـ `callbackPath` هي `/api/channels/mattermost/command`.
    - إذا حُذفت `callbackUrl`، يشتق OpenClaw العنوان `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. وتعود عناوين ربط أحرف البدل (`0.0.0.0` و`::`) إلى `localhost`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (تتجاوز قيم الحساب حقول المستوى الأعلى).
    - تُترك أوامر الشرطة المائلة الحالية التي لها المشغّل نفسه وأنشأتها عمليات تكامل أخرى دون تغيير (يتخطاها التسجيل)؛ أما الأوامر التي أنشأها البوت فتُحدَّث أو يُعاد إنشاؤها عندما يتغير عنوان URL للاستدعاء العكسي.
    - تُتحقق استدعاءات الأوامر العكسية باستخدام الرموز الخاصة بكل أمر التي يعيدها Mattermost عندما يسجّل OpenClaw أوامر `oc_*`.
    - يحدّث OpenClaw تسجيل أوامر Mattermost الحالي قبل قبول كل استدعاء عكسي، ولذلك يتوقف قبول الرموز القديمة العائدة إلى أوامر شرطة مائلة محذوفة أو معاد إنشاؤها دون الحاجة إلى إعادة تشغيل Gateway.
    - يفشل التحقق من الاستدعاء العكسي بصورة مغلقة إذا تعذر على واجهة API لـ Mattermost تأكيد أن الأمر لا يزال حاليًا؛ وتُخزّن عمليات التحقق الفاشلة مؤقتًا لفترة وجيزة، وتُدمج عمليات البحث المتزامنة، ويُقيَّد معدل بدء عمليات البحث الجديدة لكل أمر للحد من ضغط إعادة التشغيل.
    - تفشل استدعاءات الشرطة المائلة بصورة مغلقة عند فشل التسجيل، أو اكتمال بدء التشغيل جزئيًا، أو عدم مطابقة رمز الاستدعاء العكسي للرمز المسجّل للأمر الذي جرى حله (لا يمكن لرمز صالح لأمر واحد الوصول إلى التحقق في المنبع لأمر مختلف).
    - يُقرّ باستلام الاستدعاءات العكسية المقبولة برد مؤقت "جارٍ المعالجة..."؛ وتصل الإجابة الفعلية كرسالة عادية.

  </Accordion>
  <Accordion title="متطلب إمكانية الوصول">
    يجب أن يكون طرف الاستدعاء العكسي قابلًا للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف نفسه أو ضمن مساحة اسم الشبكة نفسها التي يعمل فيها OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost ما لم يكن ذلك العنوان يمرر `/api/channels/mattermost/command` عبر وكيل عكسي إلى OpenClaw.
    - يمكن إجراء تحقق سريع باستخدام `curl https://<gateway-host>/api/channels/mattermost/command`؛ إذ يجب أن يعيد طلب GET الاستجابة `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="قائمة السماح للاتصالات الصادرة من Mattermost">
    إذا كان الاستدعاء العكسي يستهدف عناوين خاصة أو ضمن tailnet أو داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost بحيث يتضمن مضيف أو نطاق الاستدعاء العكسي.

    استخدم إدخالات المضيف أو النطاق، لا عناوين URL الكاملة.

    - صحيح: `gateway.tailnet-name.ts.net`
    - خطأ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط القيم التالية على مضيف Gateway إذا كنت تفضّل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة على الحساب **الافتراضي** (`default`) فقط. ويجب أن تستخدم الحسابات الأخرى قيم التهيئة.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات ‎.env لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يستجيب Mattermost تلقائيًا للرسائل المباشرة. ويتحكم `chatmode` في سلوك القنوات:

<Tabs>
  <Tab title="oncall (الافتراضي)">
    لا تستجب في القنوات إلا عند الإشارة إلى البوت باستخدام @.
  </Tab>
  <Tab title="onmessage">
    استجب لكل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    استجب عندما تبدأ الرسالة ببادئة تشغيل.
  </Tab>
</Tabs>

مثال على التهيئة:

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

- يستجيب `onchar` أيضًا للإشارات الصريحة باستخدام @.
- يظل `channels.mattermost.requireMention` معمولًا به، لكن يُفضَّل `chatmode`. وتتغلب إعدادات `groups.<channelId>.requireMention` الخاصة بكل قناة على كليهما.
- بعد أن يرسل البوت ردًا ظاهرًا في سلسلة محادثة ضمن قناة، يُجاب عن الرسائل اللاحقة في السلسلة نفسها دون إشارة جديدة باستخدام @ أو بادئة `onchar`، ما يضمن استمرار محادثات السلسلة متعددة الأدوار. ويُتذكّر الاشتراك لمدة 7 أيام بعد آخر رد للبوت في تلك السلسلة، ويستمر عبر عمليات إعادة تشغيل Gateway. ولا تتأثر السلاسل التي راقبها البوت فقط؛ ابدأ رسالة جديدة في المستوى الأعلى لفرض إشارة صريحة مجددًا.

## سلاسل المحادثات والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم في بقاء ردود القنوات والمجموعات داخل القناة الرئيسية أو بدء سلسلة محادثة أسفل المنشور المشغّل.

- `off` (الافتراضي): لا ترد داخل سلسلة إلا إذا كان المنشور الوارد موجودًا بالفعل في سلسلة.
- `first`: بالنسبة إلى منشورات القنوات أو المجموعات في المستوى الأعلى، ابدأ سلسلة أسفل ذلك المنشور ووجّه المحادثة إلى جلسة مقيّدة بنطاق السلسلة.
- `all` و`batched`: لهما السلوك نفسه الذي يملكه `first` في Mattermost حاليًا، لأنه بمجرد وجود جذر لسلسلة Mattermost، تستمر الأجزاء اللاحقة والوسائط ضمن السلسلة نفسها.
- القيمة الافتراضية للرسائل المباشرة هي `off` حتى عند ضبط `replyToMode`.

استخدم `channels.mattermost.replyToModeByChatType` لتجاوز الوضع في دردشات `direct` أو `group` أو `channel`. اضبط `direct` لتفعيل سلاسل المحادثات للرسائل المباشرة:

- `off` (الافتراضي): تبقى الرسائل المباشرة دون سلاسل ضمن جلسة متواصلة واحدة.
- `first` أو `all` أو `batched`: تبدأ كل رسالة مباشرة في المستوى الأعلى سلسلة Mattermost تدعمها جلسة جديدة مستقلة.

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

- تستخدم الجلسات المقيّدة بنطاق السلسلة معرّف المنشور المشغّل بوصفه جذر السلسلة.
- `first` و`all` متكافئان حاليًا، لأنه بمجرد وجود جذر لسلسلة Mattermost، تستمر الأجزاء اللاحقة والوسائط ضمن السلسلة نفسها.
- تتقدم التجاوزات الخاصة بنوع الدردشة على `replyToMode`. وبدون تجاوز `direct`، تحتفظ عمليات النشر الحالية بالرسائل المباشرة المسطحة التي لا تستخدم سلاسل.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يتلقى المرسلون غير المعروفين رمز إقران). القيم الأخرى: `allowlist` و`open` و`disabled`.
- وافق باستخدام:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` بالإضافة إلى `channels.mattermost.allowFrom=["*"]` (يفرض مخطط التهيئة حرف البدل).
- يقبل `channels.mattermost.allowFrom` معرّفات المستخدمين (موصى بها) وإدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (يتطلب الإشارة).
- أضف المرسلين إلى قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (يُوصى بمعرّفات المستخدمين).
- يقبل `channels.mattermost.groupAllowFrom` إدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).
- توجد تجاوزات الإشارة لكل قناة ضمن `channels.mattermost.groups.<channelId>.requireMention`، أو ضمن `channels.mattermost.groups["*"].requireMention` للقيمة الافتراضية.
- مطابقة `@username` قابلة للتغيير ولا تُفعَّل إلا عند ضبط `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (يتطلب الإشارة).
- ترتيب الحل: `channels.mattermost.groupPolicy`، ثم `channels.defaults.groupPolicy`، ثم `"allowlist"`.
- ملاحظة وقت التشغيل: إذا كان قسم `channels.mattermost` مفقودًا بالكامل، يفشل وقت التشغيل بصورة مغلقة إلى `groupPolicy="allowlist"` في فحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا)، ويسجّل تحذيرًا لمرة واحدة.

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

استخدم صيغ الأهداف التالية مع `openclaw message send` أو Cron/Webhook:

| الهدف                               | يتم التسليم إلى                                               |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | قناة حسب المعرّف                                               |
| `channel:<name>` أو `#channel-name` | قناة حسب الاسم، ويُبحث عنها عبر الفرق التي ينتمي إليها البوت   |
| `user:<id>` أو `mattermost:<id>`    | رسالة مباشرة مع ذلك المستخدم                                  |
| `@username`                         | رسالة مباشرة (يُحل اسم المستخدم عبر واجهة API لـ Mattermost) |

تدعم عمليات الإرسال الصادرة مرفقًا واحدًا كحد أقصى لكل رسالة؛ قسّم الملفات المتعددة إلى عمليات إرسال منفصلة.

<Warning>
المعرّفات المبهمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يحلّها OpenClaw مع **تقديم المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (ينجح `GET /api/v4/users/<id>`)، يرسل OpenClaw **رسالة مباشرة** عبر حل القناة المباشرة باستخدام `/api/v4/channels/direct`.
- وإلا، يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج أولًا إلى حل القناة المباشرة، فإنه يعيد افتراضيًا محاولة حالات الفشل المؤقتة في إنشاء القناة المباشرة.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عموميًا في Plugin الخاص بـ Mattermost، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد. القيم الافتراضية:

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

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس على كل استدعاء لواجهة Mattermost API.
- تستخدم عمليات إعادة المحاولة تراجعًا أُسّيًا مع تفاوت عشوائي، وتنطبق على حالات الفشل المؤقتة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا يُعاد تنفيذها.

## البث التدفقي للمعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي إلى **منشور معاينة مسودة** يُستكمل في موضعه عندما تصبح الإجابة النهائية آمنة للإرسال. في وضع `partial`، تُحدَّث المعاينة باستخدام معرّف المنشور نفسه بدلًا من إغراق القناة برسائل لكل جزء. في وضع `block`، تتناوب المعاينة بين النص المكتمل وكتل نشاط الأدوات، بحيث تظل الكتل السابقة ظاهرة كمنشورات مستقلة بدلًا من استبدالها بالكتلة التالية. تلغي النتائج النهائية التي تتضمن وسائط أو أخطاء تعديلات المعاينة المعلّقة، وتستخدم التسليم العادي بدلًا من إرسال منشور معاينة مؤقت عديم الفائدة.

يكون البث التدفقي للمعاينة **مفعّلًا افتراضيًا** في وضع `partial`. اضبطه عبر `channels.mattermost.streaming` (سلسلة تحدد الوضع، أو قيمة منطقية، أو كائن مثل `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="أوضاع البث التدفقي">
    - `partial` (الافتراضي): منشور معاينة واحد يُعدَّل مع نمو الرد، ثم يُستكمل بالإجابة الكاملة.
    - يتناوب `block` في المعاينة بين النص المكتمل وكتل نشاط الأدوات، بحيث تظل كل كتلة ظاهرة كمنشور مستقل بدلًا من استبدالها في موضعها. تتشارك تحديثات الأدوات المتوازية والمتتالية منشور نشاط الأدوات الحالي.
    - يعرض `progress` معاينة للحالة أثناء التوليد، ولا ينشر الإجابة النهائية إلا عند الاكتمال.
    - يعطّل `off` البث التدفقي للمعاينة. عند ضبط `blockStreaming: true`، تظل كتل المساعد المكتملة تُسلَّم كردود كتل عادية (منشورات منفصلة) بدلًا من منشور نهائي واحد مدمج.

  </Accordion>
  <Accordion title="ملاحظات حول سلوك البث التدفقي">
    - إذا تعذّر استكمال البث التدفقي في موضعه (مثلًا إذا حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا يضيع الرد مطلقًا.
    - تُحجب الحمولات التي تحتوي على التفكير فقط من منشورات القناة، بما في ذلك النص الذي يصل على هيئة اقتباس كتلي `> Thinking`. اضبط `/reasoning on` لرؤية التفكير في الواجهات الأخرى؛ بينما يحتفظ منشور Mattermost النهائي بالإجابة فقط.
    - راجع [البث التدفقي](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- يمثّل `messageId` معرّف منشور Mattermost.
- يقبل `emoji` أسماءً مثل `thumbsup` أو `:+1:` (النقطتان الرأسيتان اختياريتان).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- تُمرَّر أحداث إضافة التفاعل وإزالته كأحداث نظام إلى جلسة الوكيل الموجّهة، مع خضوعها لفحوصات سياسة الرسائل المباشرة/المجموعات نفسها المطبقة على الرسائل.

أمثلة:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

الإعداد:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (القيمة الافتراضية true).
- تجاوز خاص بكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر مستخدم على زر، يتلقى الوكيل الاختيار ويمكنه الرد.

تأتي الأزرار من حمولة `presentation` الدلالية (في ردود الوكيل العادية وفي `message action=send`). يعرض OpenClaw أزرار القيم كأزرار Mattermost تفاعلية، ويُبقي أزرار عناوين URL ظاهرة في نص الرسالة، ويحوّل قوائم التحديد إلى نص مقروء.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

حقول زر العرض:

<ParamField path="label" type="string" required>
  تسمية العرض (الاسم البديل: `text`).
</ParamField>
<ParamField path="value" type="string">
  القيمة التي تُعاد عند النقر، وتُستخدم معرّفًا للإجراء (الأسماء البديلة: `callback_data` و`callbackData`). مطلوبة للزر القابل للنقر ما لم يكن `url` مضبوطًا.
</ParamField>
<ParamField path="url" type="string">
  زر رابط؛ يُعرض كنص `label: url` في متن الرسالة بدلًا من زر تفاعلي.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  نمط الزر. يطبّق Mattermost النمط الافتراضي على القيم التي لا يدعمها.
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

عندما ينقر مستخدم على زر:

<Steps>
  <Step title="فحص الوصول">
    يجب أن يجتاز الناقر فحوصات سياسة الرسائل المباشرة/المجموعات نفسها المطبقة على مُرسل الرسالة؛ وتتلقى النقرات غير المصرح بها إشعارًا مؤقتًا وتُتجاهل.
  </Step>
  <Step title="استبدال الأزرار بالتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثلًا: "✓ تم تحديد **نعم** بواسطة @user").
  </Step>
  <Step title="تلقي الوكيل للاختيار">
    يتلقى الوكيل الاختيار كرسالة واردة (بالإضافة إلى حدث نظام) ثم يرد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات رجوع الأزرار التحقق باستخدام HMAC-SHA256 (تلقائي، ولا يتطلب إعدادًا).
    - تُستبدل كتلة المرفق بالكامل عند النقر، لذا تُزال جميع الأزرار معًا، ولا يمكن إزالتها جزئيًا.
    - تُعقَّم معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا (بسبب قيود توجيه Mattermost).
    - تُرفض النقرات التي لا يطابق فيها `action_id` إجراءً في المنشور الأصلي بالرمز `403` ("إجراء غير معروف").

  </Accordion>
  <Accordion title="الإعداد وإمكانية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتفعيل وصف أداة الأزرار في مطالبة نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لاستدعاءات رجوع الأزرار (مثلًا `https://gateway.example.com`). استخدمه عندما يتعذر على Mattermost الوصول مباشرةً إلى Gateway عند مضيف الربط الخاص به.
    - في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا حُذف `interactions.callbackBaseUrl`، يشتق OpenClaw عنوان URL لاستدعاء الرجوع من `gateway.customBindHost` + `gateway.port` (القيمة الافتراضية 18789)، ثم يعود إلى `http://localhost:<port>`. مسار استدعاء الرجوع هو `/mattermost/interactions/<accountId>`.
    - قاعدة إمكانية الوصول: يجب أن يكون عنوان URL لاستدعاء رجوع الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف/نطاق اسم الشبكة نفسه.
    - `channels.mattermost.interactions.allowedSourceIps`: قائمة سماح لعناوين IP المصدر الخاصة باستدعاءات رجوع الأزرار. بدونها، لا تُقبل سوى مصادر local loopback (`127.0.0.1` و`::1`)، لذا يجب إضافة خادم Mattermost البعيد إلى قائمة السماح هنا وإلا ستُرفض نقراته بالرمز `403`. عند العمل خلف وكيل عكسي، اضبط أيضًا `gateway.trustedProxies` حتى يُشتق عنوان IP الحقيقي للعميل من الترويسات المُمرَّرة.
    - إذا كان هدف استدعاء الرجوع خاصًا أو ضمن شبكة tailnet أو داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

  </Accordion>
</AccordionGroup>

### التكامل المباشر مع API (البرامج النصية الخارجية)

يمكن للبرامج النصية الخارجية وWebhooks نشر الأزرار مباشرةً عبر Mattermost REST API بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin متى أمكن؛ وإذا كنت تنشر JSON خامًا، فاتبع القواعد التالية:

**بنية الحمولة:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. توضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (إذ تُتجاهل بصمت).
2. يحتاج كل إجراء إلى `type: "button"`؛ وبدونه تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id`؛ إذ يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يتكوّن `id` الخاص بالإجراء من **أحرف وأرقام فقط** (`[a-zA-Z0-9]`). تؤدي الشرطات والشرطات السفلية إلى تعطيل توجيه الإجراءات على جانب خادم Mattermost (ويُرجع 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر؛ إذ يرفض Gateway النقرات التي لا يوجد `action_id` الخاص بها في المنشور.
6. `context.action_id` مطلوب؛ ويُرجع معالج التفاعل 400 بدونه.
7. يجب أن يكون عنوان IP مصدر استدعاء الرجوع مسموحًا به (راجع `interactions.allowedSourceIps` أعلاه).

</Warning>

**إنشاء رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب أن تُنشئ البرامج النصية الخارجية رموزًا تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتقاق السر من رمز البوت">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`، بترميز سداسي عشري.
  </Step>
  <Step title="إنشاء كائن السياق">
    أنشئ كائن السياق بجميع الحقول **باستثناء** `_token`.
  </Step>
  <Step title="إجراء التسلسل بمفاتيح مرتبة">
    أجرِ التسلسل باستخدام **مفاتيح مرتبة تكراريًا** و**من دون مسافات** (إذ يوحّد Gateway الكائنات المتداخلة أيضًا وينتج JSON مضغوطًا).
  </Step>
  <Step title="توقيع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="إضافة الرمز">
    أضف الملخّص السداسي العشري الناتج كقيمة `_token` في السياق.
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
    - وقّع دائمًا **جميع** حقول السياق (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية إلى فشل التحقق بصمت.
    - استخدم `sort_keys=True`؛ إذ يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز البوت (بصورة حتمية)، وليس من بايتات عشوائية. يجب أن يكون السر متماثلًا في العملية التي تنشئ الأزرار وفي Gateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محوّل الدليل

يتضمن Plugin الخاص بـ Mattermost محوّل دليل يحل أسماء القنوات والمستخدمين عبر Mattermost API. يتيح هذا استخدام الوجهات `#channel-name` و`@username` في `openclaw message send` وعمليات التسليم عبر Cron/Webhook.

لا يلزم أي إعداد؛ إذ يستخدم المحوّل رمز البوت من إعداد الحساب.

## الحسابات المتعددة

يدعم Mattermost حسابات متعددة ضمن `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "الأساسي", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "التنبيهات", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

تتجاوز قيم الحساب الحقول ذات المستوى الأعلى؛ ويحدد `channels.mattermost.defaultAccount` الحساب المستخدم عند عدم تحديد حساب.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تأكد من وجود البوت في القناة، ثم اذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو عيّن `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز البوت وعنوان URL الأساسي ومن تمكين الحساب.
    - مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة على حساب `default` فقط.
    - تحتاج مضيفات Mattermost الخاصة أو الموجودة على شبكة LAN إلى `network.dangerouslyAllowPrivateNetwork: true` (يحظر واقي SSRF عناوين IP الخاصة افتراضيًا).

  </Accordion>
  <Accordion title="فشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز الاستدعاء. تشمل الأسباب المعتادة:
      - فشل تسجيل أمر الشرطة المائلة أو اكتماله جزئيًا فقط عند بدء التشغيل
      - وصول الاستدعاء إلى Gateway أو الحساب الخطأ
      - لا يزال Mattermost يحتفظ بأوامر قديمة تشير إلى وجهة استدعاء سابقة
      - أُعيد تشغيل Gateway دون إعادة تفعيل أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا حُذف `callbackUrl` وحذرت السجلات من أن الاستدعاء حُلّ إلى عنوان local loopback مثل `http://localhost:18789/...`، فمن المحتمل ألا يكون عنوان URL هذا قابلًا للوصول إلا عندما يعمل Mattermost على المضيف أو نطاق أسماء الشبكة نفسه الذي يعمل عليه OpenClaw. عيّن بدلًا منه `commands.callbackUrl` صريحًا يمكن الوصول إليه خارجيًا.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء أو لا تظهر إطلاقًا: بيانات الزر غير صحيحة البنية. يحتاج كل زر عرض إلى `label` و`value` (تُستبعد الأزرار التي ينقصها أي منهما).
    - تظهر الأزرار، لكن النقر عليها لا يؤدي إلى شيء: تحقق من إمكانية وصول خادم Mattermost إلى Gateway، ومن تضمين عنوان IP لخادم Mattermost في `channels.mattermost.interactions.allowedSourceIps` (لا يُقبل سوى local loopback من دونه)، ومن أن `ServiceSettings.AllowedUntrustedInternalConnections` يتضمن مضيف الاستدعاء للوجهات الخاصة.
    - تُرجع الأزرار الخطأ 404 عند النقر: من المرجح أن يحتوي `id` الخاص بالزر على شرطات أو شرطات سفلية. يتعطل موجّه إجراءات Mattermost عند استخدام معرّفات تحتوي على محارف غير أبجدية رقمية. استخدم `[a-zA-Z0-9]` فقط.
    - تسجل سجلات Gateway الرسالة `rejected callback source`: جاءت النقرة من عنوان IP خارج `interactions.allowedSourceIps`. أضف خادم Mattermost أو نقطة الدخول إلى قائمة السماح، وعيّن `gateway.trustedProxies` عند العمل خلف وكيل عكسي.
    - تسجل سجلات Gateway الرسالة `invalid _token`: عدم تطابق HMAC. تحقق من توقيع جميع حقول السياق (لا مجموعة فرعية منها)، واستخدام مفاتيح مرتبة، واستخدام JSON مضغوط (من دون مسافات). راجع قسم HMAC أعلاه.
    - تسجل سجلات Gateway الرسالة `missing _token in context`: الحقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند إنشاء حمولة التكامل.
    - يرفض Gateway النقرة بالرسالة `Unknown action`: لا يطابق `context.action_id` أي `id` لإجراء في المنشور. عيّنهما كليهما على القيمة المنقحة نفسها.
    - لا يعرض الوكيل أزرارًا: أضف `capabilities: ["inlineButtons"]` إلى إعدادات قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك المحادثات الجماعية والتحكم بالوصول عبر الإشارة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
