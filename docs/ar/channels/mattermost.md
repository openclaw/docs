---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T07:42:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin مضمّن (رمز بوت + أحداث WebSocket). القنوات والمجموعات والرسائل الخاصة مدعومة. Mattermost هو منصة مراسلة للفرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على [mattermost.com](https://mattermost.com) لتفاصيل المنتج والتنزيلات.

## Plugin مضمّن

<Note>
يأتي Mattermost كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج البُنى المعبأة العادية إلى تثبيت منفصل.
</Note>

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Mattermost، فثبّت حزمة npm حالية عند نشر واحدة:

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

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بنية
OpenClaw معبأة حالية أو مسار النسخة المحلية إلى أن تُنشر حزمة npm
أحدث.

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

<Steps>
  <Step title="تأكد من توفر Plugin">
    إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل. يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
  </Step>
  <Step title="أنشئ بوت Mattermost">
    أنشئ حساب بوت في Mattermost وانسخ **رمز البوت**.
  </Step>
  <Step title="انسخ عنوان URL الأساسي">
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثلًا، `https://chat.example.com`).
  </Step>
  <Step title="اضبط OpenClaw وابدأ Gateway">
    الحد الأدنى للإعدادات:

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

## أوامر slash الأصلية

أوامر slash الأصلية اختيارية. عند تفعيلها، يسجل OpenClaw أوامر slash من نمط `oc_*` عبر واجهة Mattermost API ويتلقى طلبات POST للردود الراجعة على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ملاحظات السلوك">
    - القيمة `native: "auto"` تكون معطلة افتراضيًا لـ Mattermost. اضبط `native: true` للتفعيل.
    - إذا حُذفت `callbackUrl`، يشتق OpenClaw واحدة من مضيف/منفذ Gateway + `callbackPath`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (تتجاوز قيم الحساب حقول المستوى الأعلى).
    - يتم التحقق من ردود الأوامر الراجعة باستخدام الرموز الخاصة بكل أمر التي يعيدها Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
    - تفشل ردود slash الراجعة بإغلاق آمن عندما يفشل التسجيل، أو يكون بدء التشغيل جزئيًا، أو لا يطابق رمز الرد الراجع أحد الأوامر المسجلة.

  </Accordion>
  <Accordion title="متطلب إمكانية الوصول">
    يجب أن يكون طرف الرد الراجع قابلًا للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف/نطاق الشبكة نفسه مثل OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost إلا إذا كان ذلك العنوان يمرر `/api/channels/mattermost/command` إلى OpenClaw عبر وكيل عكسي.
    - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET استجابة `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="قائمة السماح للخروج في Mattermost">
    إذا كانت أهداف الرد الراجع لديك عناوين خاصة/tailnet/داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق الرد الراجع.

    استخدم إدخالات المضيف/النطاق، وليس عناوين URL كاملة.

    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه على مضيف Gateway إذا كنت تفضل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم الإعدادات.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل الخاصة تلقائيًا. يتحكم `chatmode` بسلوك القناة:

<Tabs>
  <Tab title="oncall (الافتراضي)">
    الرد فقط عند الإشارة بـ @ في القنوات.
  </Tab>
  <Tab title="onmessage">
    الرد على كل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    الرد عندما تبدأ الرسالة ببادئة تشغيل.
  </Tab>
</Tabs>

مثال إعدادات:

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
- يتم احترام `channels.mattermost.requireMention` للإعدادات القديمة لكن `chatmode` هو المفضل.

## السلاسل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم في ما إذا كانت ردود القنوات والمجموعات تبقى في القناة الرئيسية أو تبدأ سلسلة تحت المنشور الذي شغّلها.

- `off` (الافتراضي): الرد في سلسلة فقط عندما يكون المنشور الوارد ضمن سلسلة بالفعل.
- `first`: للمنشورات ذات المستوى الأعلى في القنوات/المجموعات، ابدأ سلسلة تحت ذلك المنشور ووجّه المحادثة إلى جلسة محددة بنطاق السلسلة.
- `all`: السلوك نفسه مثل `first` في Mattermost حاليًا.
- تتجاهل الرسائل المباشرة هذا الإعداد وتبقى غير مسلسلة.

مثال إعدادات:

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

- تستخدم الجلسات محددة نطاق السلسلة معرّف المنشور الذي شغّلها كجذر للسلسلة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يكون لدى Mattermost جذر سلسلة، تستمر الأجزاء اللاحقة والوسائط في السلسلة نفسها.

## التحكم في الوصول (الرسائل الخاصة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يحصل المرسلون غير المعروفين على رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل الخاصة العامة: `channels.mattermost.dmPolicy="open"` بالإضافة إلى `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيّد بالإشارة).
- اسمح للمرسلين باستخدام `channels.mattermost.groupAllowFrom` (يوصى بمعرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` كقيمة افتراضية.
- مطابقة `@username` قابلة للتغيير ولا تُفعّل إلا عند `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيّدة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

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

استخدم تنسيقات الأهداف هذه مع `openclaw message send` أو cron/webhooks:

- `channel:<id>` لقناة
- `user:<id>` لرسالة خاصة
- `@username` لرسالة خاصة (تُحل عبر واجهة Mattermost API)

<Warning>
المعرّفات المعتمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم مقابل معرّف قناة).

يحلها OpenClaw **المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (ينجح `GET /api/v4/users/<id>`)، يرسل OpenClaw **رسالة خاصة** عبر حل القناة المباشرة من خلال `/api/v4/channels/direct`.
- وإلا فيُعامل المعرّف كـ **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل الخاصة

عندما يرسل OpenClaw إلى هدف رسالة خاصة في Mattermost ويحتاج إلى حل القناة المباشرة أولًا، يعيد محاولة حالات فشل إنشاء القناة المباشرة العابرة افتراضيًا.

استخدم `channels.mattermost.dmChannelRetry` لضبط ذلك السلوك عموميًا لـ Plugin الخاص بـ Mattermost، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

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

- ينطبق هذا فقط على إنشاء قناة الرسائل الخاصة (`/api/v4/channels/direct`)، وليس على كل استدعاء لواجهة Mattermost API.
- تنطبق إعادة المحاولة على حالات الفشل العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx غير `429` كأخطاء دائمة ولا تُعاد محاولتها.

## بث المعاينة

يبث Mattermost التفكير، ونشاط الأدوات، ونص الرد الجزئي في **منشور معاينة مسودة** واحد يُنهى في مكانه عندما تكون الإجابة النهائية آمنة للإرسال. تُحدّث المعاينة على معرّف المنشور نفسه بدل إغراق القناة برسائل لكل جزء. تلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدل تفريغ منشور معاينة مؤقت.

فعّل عبر `channels.mattermost.streaming`:

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
    - `partial` هو الخيار المعتاد: منشور معاينة واحد يُعدّل مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
    - يستخدم `block` أجزاء مسودة بأسلوب الإلحاق داخل منشور المعاينة.
    - يعرض `progress` معاينة حالة أثناء التوليد ولا ينشر الإجابة النهائية إلا عند الاكتمال.
    - يعطل `off` بث المعاينة.

  </Accordion>
  <Accordion title="ملاحظات سلوك البث">
    - إذا تعذر إنهاء البث في مكانه (على سبيل المثال، حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا يضيع الرد أبدًا.
    - تُحجب الحمولات المخصصة للاستدلال فقط من منشورات القناة، بما في ذلك النص الذي يصل كاقتباس كتلي `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في أسطح أخرى؛ يحتفظ منشور Mattermost النهائي بالإجابة فقط.
    - راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) لمصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختياريتان).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- تُمرر أحداث إضافة/إزالة التفاعل كأحداث نظام إلى جلسة الوكيل الموجهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

الإعدادات:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل بأزرار قابلة للنقر. عندما ينقر مستخدم زرًا، يتلقى الوكيل الاختيار ويمكنه الرد.

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

استخدم `message action=send` مع معامل `buttons`. الأزرار مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

<ParamField path="text" type="string" required>
  تسمية العرض.
</ParamField>
<ParamField path="callback_data" type="string" required>
  القيمة المرسلة مرة أخرى عند النقر (تُستخدم كمعرّف الإجراء).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  نمط الزر.
</ParamField>

عندما ينقر مستخدم زرًا:

<Steps>
  <Step title="استُبدلت الأزرار بتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثلًا: "✓ **Yes** selected by @user").
  </Step>
  <Step title="يتلقى الوكيل الاختيار">
    يتلقى الوكيل الاختيار كرسالة واردة ويرد عليها.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات الأزرار التحقق عبر HMAC-SHA256 (تلقائيًا، ولا حاجة إلى إعداد).
    - يزيل Mattermost بيانات الاستدعاء من استجابات API الخاصة به (ميزة أمنية)، لذلك تُزال جميع الأزرار عند النقر — ولا تكون الإزالة الجزئية ممكنة.
    - تُنظَّف معرفات الإجراءات التي تحتوي على واصلات أو شرطات سفلية تلقائيًا (قيد في توجيه Mattermost).

  </Accordion>
  <Accordion title="الإعداد وقابلية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتفعيل وصف أداة الأزرار في موجه نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لاستدعاءات الأزرار (على سبيل المثال `https://gateway.example.com`). استخدم هذا عندما لا يستطيع Mattermost الوصول إلى Gateway على مضيف الربط الخاص به مباشرة.
    - في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا حُذف `interactions.callbackBaseUrl`، يشتق OpenClaw عنوان URL للاستدعاء من `gateway.customBindHost` + `gateway.port`، ثم يرجع إلى `http://localhost:<port>`.
    - قاعدة قابلية الوصول: يجب أن يكون عنوان URL لاستدعاء الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف نفسه/مساحة أسماء الشبكة نفسها.
    - إذا كان هدف الاستدعاء خاصًا/داخل tailnet/داخليًا، فأضف مضيفه/نطاقه إلى Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### تكامل API مباشر (نصوص خارجية)

يمكن للنصوص الخارجية وwebhooks نشر الأزرار مباشرة عبر Mattermost REST API بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin عندما يكون ذلك ممكنًا؛ وإذا كنت تنشر JSON خامًا، فاتبع هذه القواعد:

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
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
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
**قواعد حرجة**

1. توضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (تُتجاهل بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — من دونه، تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرفات.
4. يجب أن يكون `id` الإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تكسر الواصلات والشرطات السفلية توجيه الإجراءات من جهة خادم Mattermost (وتُرجع 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر لكي تعرض رسالة التأكيد اسم الزر (مثلًا: "Approve") بدلًا من معرف خام.
6. `context.action_id` مطلوب — يعيد معالج التفاعل 400 من دونه.

</Warning>

**إنشاء رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على النصوص الخارجية إنشاء رموز تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتق السر من رمز البوت">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="أنشئ كائن السياق">
    أنشئ كائن السياق مع جميع الحقول **باستثناء** `_token`.
  </Step>
  <Step title="سلسله مع مفاتيح مرتبة">
    سلسله باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway `JSON.stringify` مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
  </Step>
  <Step title="وقّع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="أضف الرمز">
    أضف بصمة hex الناتجة باسم `_token` في السياق.
  </Step>
</Steps>

مثال Python:

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
    - يضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
    - وقّع دائمًا **كل** حقول السياق (ناقص `_token`). يزيل Gateway `_token` ثم يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية إلى فشل التحقق بصمت.
    - استخدم `sort_keys=True` — يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز البوت (حتميًا)، وليس من بايتات عشوائية. يجب أن يكون السر هو نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محول الدليل

يتضمن Mattermost Plugin محول دليل يحل أسماء القنوات والمستخدمين عبر Mattermost API. يتيح ذلك أهداف `#channel-name` و`@username` في `openclaw message send` وتسليمات cron/webhook.

لا حاجة إلى إعداد — يستخدم المحول رمز البوت من إعداد الحساب.

## الحسابات المتعددة

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

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تأكد من أن البوت موجود في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز البوت، وعنوان URL الأساسي، وما إذا كان الحساب مفعّلًا.
    - مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة فقط على حساب `default`.

  </Accordion>
  <Accordion title="تفشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز الاستدعاء. الأسباب المعتادة:
      - فشل تسجيل أمر الشرطة المائلة أو اكتمل جزئيًا فقط عند بدء التشغيل
      - يصل الاستدعاء إلى Gateway/الحساب الخطأ
      - لا يزال Mattermost يحتوي على أوامر قديمة تشير إلى هدف استدعاء سابق
      - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا حُذف `callbackUrl` وحذّرت السجلات من أن الاستدعاء حُلّ إلى `http://127.0.0.1:18789/...`، فمن المحتمل أن يكون عنوان URL هذا قابلًا للوصول فقط عندما يعمل Mattermost على المضيف نفسه/مساحة أسماء الشبكة نفسها مثل OpenClaw. اضبط `commands.callbackUrl` صريحًا وقابلًا للوصول خارجيًا بدلًا من ذلك.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار مشوهة. تحقق من أن كل زر يحتوي على حقلي `text` و`callback_data`.
    - تظهر الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في إعداد خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` مضبوط على `true` في ServiceSettings.
    - تُرجع الأزرار 404 عند النقر: غالبًا يحتوي `id` الزر على واصلات أو شرطات سفلية. يتعطل موجّه الإجراءات في Mattermost عند المعرفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
    - تسجل Gateway `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع كل حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
    - تسجل Gateway `missing _token in context`: حقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند بناء حمولة التكامل.
    - يعرض التأكيد معرفًا خامًا بدلًا من اسم الزر: لا يطابق `context.action_id` قيمة `id` الخاصة بالزر. اضبط كليهما على القيمة المنظفة نفسها.
    - لا يعرف الوكيل شيئًا عن الأزرار: أضف `capabilities: ["inlineButtons"]` إلى إعداد قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الذكر
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
