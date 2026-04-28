---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد روبوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

الحالة: Plugin مضمن (رمز bot المميز + أحداث WebSocket). القنوات والمجموعات والرسائل الخاصة مدعومة. Mattermost منصة مراسلة جماعية قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على [mattermost.com](https://mattermost.com) للحصول على تفاصيل المنتج والتنزيلات.

## Plugin المضمن

<Note>
يأتي Mattermost كـ Plugin مضمن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المجمعة العادية إلى تثبيت منفصل.
</Note>

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Mattermost، فثبّته يدويًا:

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

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

<Steps>
  <Step title="تأكد من توفر Plugin">
    تتضمنه إصدارات OpenClaw المجمعة الحالية بالفعل. أما التثبيتات الأقدم أو المخصصة، فيمكنها إضافته يدويًا باستخدام الأوامر أعلاه.
  </Step>
  <Step title="أنشئ bot في Mattermost">
    أنشئ حساب bot في Mattermost وانسخ **رمز bot المميز**.
  </Step>
  <Step title="انسخ URL الأساسي">
    انسخ **URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`).
  </Step>
  <Step title="كوّن OpenClaw وابدأ Gateway">
    الحد الأدنى من التكوين:

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

  </Step>
</Steps>

## أوامر الشرطة المائلة الأصلية

أوامر الشرطة المائلة الأصلية هي ميزة اختيارية. عند تفعيلها، يسجل OpenClaw أوامر الشرطة المائلة `oc_*` عبر Mattermost API ويتلقى طلبات POST للاستدعاء على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // استخدم هذا عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً (وكيل عكسي/URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ملاحظات السلوك">
    - القيمة الافتراضية لـ `native: "auto"` في Mattermost هي التعطيل. اضبط `native: true` للتفعيل.
    - إذا تم حذف `callbackUrl`، فسيشتقه OpenClaw من مضيف/منفذ Gateway مع `callbackPath`.
    - في إعدادات الحسابات المتعددة، يمكن تعيين `commands` على المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز الحقول ذات المستوى الأعلى).
    - يتم التحقق من استدعاءات الأوامر عبر الرموز المميزة الخاصة بكل أمر التي يعيدها Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
    - تُغلق استدعاءات أوامر الشرطة المائلة تلقائيًا عند الفشل إذا فشل التسجيل، أو كان بدء التشغيل جزئيًا، أو لم يتطابق رمز callback المميز مع أحد الأوامر المسجلة.
  </Accordion>
  <Accordion title="متطلب إمكانية الوصول">
    يجب أن تكون نقطة نهاية callback قابلة للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` ما لم يكن Mattermost يعمل على نفس المضيف/مساحة اسم الشبكة نفسها التي يعمل عليها OpenClaw.
    - لا تضبط `callbackUrl` على URL Mattermost الأساسي لديك ما لم يكن هذا URL يمرر `/api/channels/mattermost/command` عبر وكيل عكسي إلى OpenClaw.
    - للتحقق السريع، استخدم `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET الاستجابة `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="قائمة السماح لحركة الخروج في Mattermost">
    إذا كان callback يستهدف عناوين خاصة أو tailnet أو عناوين داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق callback.

    استخدم إدخالات المضيف/النطاق، وليس URL كاملة.

    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه المتغيرات على مضيف Gateway إذا كنت تفضل استخدام متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم التكوين.

لا يمكن تعيين `MATTERMOST_URL` من ملف `.env` الخاص بمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل الخاصة تلقائيًا. ويتم التحكم في سلوك القنوات بواسطة `chatmode`:

<Tabs>
  <Tab title="oncall (الافتراضي)">
    يرد فقط عند الإشارة إليه بـ @ في القنوات.
  </Tab>
  <Tab title="onmessage">
    يرد على كل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    يرد عندما تبدأ الرسالة ببادئة تشغيل.
  </Tab>
</Tabs>

مثال للتكوين:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

ملاحظات:

- يظل `onchar` يرد على إشارات @ الصريحة.
- لا يزال `channels.mattermost.requireMention` مدعومًا للتكوينات القديمة، لكن يُفضَّل استخدام `chatmode`.

## سلاسل الرسائل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت الردود في القنوات والمجموعات ستبقى في القناة الرئيسية أو ستبدأ سلسلة رسائل تحت المنشور المُحفِّز.

- `off` (الافتراضي): لا يرد في سلسلة رسائل إلا إذا كان المنشور الوارد موجودًا فيها بالفعل.
- `first`: بالنسبة إلى منشورات القنوات/المجموعات ذات المستوى الأعلى، ابدأ سلسلة رسائل تحت هذا المنشور ووجّه المحادثة إلى جلسة بنطاق سلسلة الرسائل.
- `all`: السلوك نفسه لـ `first` في Mattermost حاليًا.
- تتجاهل الرسائل الخاصة هذا الإعداد وتبقى بدون سلاسل رسائل.

مثال للتكوين:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

ملاحظات:

- تستخدم الجلسات ذات نطاق سلسلة الرسائل معرّف المنشور المُحفِّز باعتباره جذر سلسلة الرسائل.
- إن `first` و`all` متكافئان حاليًا لأن Mattermost، بمجرد وجود جذر لسلسلة الرسائل، يواصل إرسال الأجزاء اللاحقة والوسائط داخل تلك السلسلة نفسها.

## التحكم في الوصول (الرسائل الخاصة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يحصل المرسلون غير المعروفين على رمز اقتران).
- وافق عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل الخاصة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيّدة بالإشارة).
- أضف المرسلين إلى قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (يُفضَّل استخدام معرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` كإعداد افتراضي.
- مطابقة `@username` قابلة للتغير ولا تُفعَّل إلا عند تعيين `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيّدة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، فسيعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى لو كان `channels.defaults.groupPolicy` مضبوطًا).

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

## الأهداف للتسليم الصادر

استخدم صيغ الأهداف هذه مع `openclaw message send` أو Cron/Webhooks:

- `channel:<id>` لقناة
- `user:<id>` لرسالة خاصة
- `@username` لرسالة خاصة (يتم حلها عبر Mattermost API)

<Warning>
المعرّفات المعتمة المجرّدة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يحلّها OpenClaw بأسلوب **المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (`GET /api/v4/users/<id>` ينجح)، يرسل OpenClaw **رسالة خاصة** عبر حل القناة المباشرة باستخدام `/api/v4/channels/direct`.
- بخلاف ذلك، يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة المحاولة لقناة الرسائل الخاصة

عندما يرسل OpenClaw إلى هدف رسالة خاصة في Mattermost ويحتاج أولًا إلى حل القناة المباشرة، فإنه يعيد المحاولة افتراضيًا عند حدوث إخفاقات عابرة في إنشاء القناة المباشرة.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عالميًا لـ Plugin Mattermost، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

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

- ينطبق هذا فقط على إنشاء قناة الرسائل الخاصة (`/api/v4/channels/direct`)، وليس على كل استدعاء لـ Mattermost API.
- تنطبق إعادة المحاولة على الإخفاقات العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو المهلة.
- تُعامَل أخطاء العميل 4xx غير `429` على أنها دائمة ولا تُعاد محاولتها.

## بث المعاينة

يبث Mattermost حالة التفكير، ونشاط الأدوات، ونص الرد الجزئي داخل **منشور معاينة مسودة** واحد يُنهى في مكانه عندما تصبح الإجابة النهائية آمنة للإرسال. تُحدَّث المعاينة على معرّف المنشور نفسه بدلًا من إغراق القناة برسائل لكل جزء. تؤدي النهايات الخاصة بالوسائط/الأخطاء إلى إلغاء تعديلات المعاينة المعلقة واستخدام التسليم العادي بدلًا من تفريغ منشور معاينة مؤقت غير مفيد.

فعّل ذلك عبر `channels.mattermost.streaming`:

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
  <Accordion title="أوضاع البث">
    - `partial` هو الخيار المعتاد: منشور معاينة واحد يتم تعديله مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
    - يستخدم `block` أجزاء مسودة بأسلوب الإلحاق داخل منشور المعاينة.
    - يعرض `progress` معاينة للحالة أثناء التوليد ثم ينشر الإجابة النهائية فقط عند الاكتمال.
    - يعطّل `off` بث المعاينة.
  </Accordion>
  <Accordion title="ملاحظات سلوك البث">
    - إذا تعذر إنهاء البث في مكانه (مثلًا إذا حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا تضيع الإجابة أبدًا.
    - تُحجب الحمولة الخاصة بالتفكير فقط من منشورات القنوات، بما في ذلك النص الذي يصل على هيئة blockquote `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في أسطح أخرى؛ ويحتفظ المنشور النهائي في Mattermost بالإجابة فقط.
    - راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة ربط القنوات.
  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- القيمة `messageId` هي معرّف المنشور في Mattermost.
- تقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختياريتان).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- تُمرَّر أحداث إضافة/إزالة التفاعل كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

التكوين:

- `channels.mattermost.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر المستخدم زرًا، يتلقى الوكيل الاختيار ويمكنه الرد.

فعّل الأزرار بإضافة `inlineButtons` إلى إمكانات القناة:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

استخدم `message action=send` مع المعلَمة `buttons`. الأزرار عبارة عن مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

<ParamField path="text" type="string" required>
  تسمية العرض.
</ParamField>
<ParamField path="callback_data" type="string" required>
  القيمة التي تُرسل مرة أخرى عند النقر (تُستخدم كمعرّف للإجراء).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  نمط الزر.
</ParamField>

عندما ينقر المستخدم زرًا:

<Steps>
  <Step title="استبدال الأزرار بتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثل: "✓ تم اختيار **Yes** بواسطة @user").
  </Step>
  <Step title="يتلقى الوكيل الاختيار">
    يتلقى الوكيل الاختيار كرسالة واردة ويرد عليها.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات الأزرار تحقق HMAC-SHA256 (تلقائي، ولا حاجة إلى إعدادات).
    - يزيل Mattermost بيانات callback من استجابات API الخاصة به (ميزة أمان)، لذلك تُزال جميع الأزرار عند النقر — ولا يمكن الإزالة الجزئية.
    - تُنظَّف معرّفات الإجراءات التي تحتوي على واصلات أو شرطات سفلية تلقائيًا (بسبب قيود التوجيه في Mattermost).
  </Accordion>
  <Accordion title="التكوين وإمكانية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتمكين وصف أداة الأزرار في مطالبة النظام الخاصة بالوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL أساسي خارجي اختياري لاستدعاءات الأزرار (مثل `https://gateway.example.com`). استخدمه عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً على مضيف الربط الخاص به.
    - في إعدادات الحسابات المتعددة، يمكنك أيضًا تعيين الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا تم حذف `interactions.callbackBaseUrl`، فسيشتق OpenClaw URL الاستدعاء من `gateway.customBindHost` و`gateway.port`، ثم يعود إلى `http://localhost:<port>`.
    - قاعدة إمكانية الوصول: يجب أن يكون URL استدعاء الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف نفسه/ضمن مساحة اسم الشبكة نفسها.
    - إذا كان هدف callback خاصًا أو tailnet أو داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.
  </Accordion>
</AccordionGroup>

### تكامل API المباشر (البرامج النصية الخارجية)

يمكن للبرامج النصية الخارجية وWebhooks نشر الأزرار مباشرة عبر Mattermost REST API بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin متى أمكن؛ وإذا كنت سترسل JSON خامًا، فاتبع هذه القواعد:

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
            id: "mybutton01", // أبجدي رقمي فقط — انظر أدناه
            type: "button", // مطلوب، وإلا فسيتم تجاهل النقرات بصمت
            name: "موافقة", // تسمية العرض
            style: "primary", // اختياري: "default"، "primary"، "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // يجب أن يطابق id الخاص بالزر (لاستخدامه في البحث عن الاسم)
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
**قواعد حرجة**

1. توضع attachments داخل `props.attachments`، وليس في `attachments` على المستوى الأعلى (وإلا فسيتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — وبدونه تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الخاص بالإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تؤدي الواصلات والشرطات السفلية إلى كسر توجيه الإجراءات على جانب خادم Mattermost (فتعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تعرض رسالة التأكيد اسم الزر (مثل "موافقة") بدلًا من معرّف خام.
6. الحقل `context.action_id` مطلوب — إذ يعيد معالج التفاعل 400 عند غيابه.
</Warning>

**إنشاء رمز HMAC المميز**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على البرامج النصية الخارجية إنشاء رموز مميزة تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتقاق السر من رمز bot المميز">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="بناء كائن السياق">
    أنشئ كائن السياق مع جميع الحقول **باستثناء** `_token`.
  </Step>
  <Step title="التسلسل بمفاتيح مرتبة">
    قم بالتسلسل باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway `JSON.stringify` مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
  </Step>
  <Step title="توقيع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="إضافة الرمز المميز">
    أضف ناتج hex digest الناتج كقيمة `_token` في السياق.
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
    - وقّع دائمًا **جميع** حقول السياق (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية فقط إلى فشل صامت في التحقق.
    - استخدم `sort_keys=True` — إذ يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز bot المميز (بشكل حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر هو نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.
  </Accordion>
</AccordionGroup>

## مهايئ الدليل

يتضمن Plugin الخاص بـ Mattermost مهايئ دليل يحل أسماء القنوات والمستخدمين عبر Mattermost API. يتيح ذلك استخدام الأهداف `#channel-name` و`@username` في `openclaw message send` وعمليات التسليم عبر Cron/Webhooks.

لا حاجة لأي إعدادات — يستخدم المهايئ رمز bot المميز من تكوين الحساب.

## الحسابات المتعددة

يدعم Mattermost عدة حسابات ضمن `channels.mattermost.accounts`:

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

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تأكد من أن bot موجود في القناة، ثم أشر إليه (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز bot المميز وURL الأساسي وما إذا كان الحساب ممكّنًا.
    - مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة فقط على الحساب `default`.
  </Accordion>
  <Accordion title="فشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز callback المميز. ومن الأسباب المعتادة:
      - فشل تسجيل أوامر الشرطة المائلة أو اكتمل جزئيًا فقط عند بدء التشغيل
      - يصل callback إلى Gateway/حساب غير صحيح
      - لا يزال Mattermost يحتوي على أوامر قديمة تشير إلى هدف callback سابق
      - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا تم حذف `callbackUrl` وحذرت السجلات من أن callback تم حله إلى `http://127.0.0.1:18789/...`، فمن المحتمل أن يكون هذا العنوان قابلًا للوصول فقط عندما يعمل Mattermost على المضيف نفسه/ضمن مساحة اسم الشبكة نفسها التي يعمل فيها OpenClaw. اضبط بدلًا من ذلك `commands.callbackUrl` صريحًا وقابلًا للوصول خارجيًا.
  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار غير صحيحة. تحقق من أن كل زر يحتوي على الحقلين `text` و`callback_data`.
    - تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في تكوين خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` مضبوط على `true` في `ServiceSettings`.
    - تعيد الأزرار 404 عند النقر: من المحتمل أن يحتوي `id` الخاص بالزر على واصلات أو شرطات سفلية. يتعطل موجه إجراءات Mattermost مع المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
    - يسجل Gateway `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
    - يسجل Gateway `missing _token in context`: الحقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند إنشاء حمولة integration.
    - يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: `context.action_id` لا يطابق `id` الخاص بالزر. اضبط القيمتين على نفس القيمة المنظفة.
    - الوكيل لا يعرف الأزرار: أضف `capabilities: ["inlineButtons"]` إلى تكوين قناة Mattermost.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
