---
read_when:
    - إعداد Mattermost
    - استكشاف أخطاء توجيه Mattermost وإصلاحها
sidebarTitle: Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T07:43:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل (رمز bot + أحداث WebSocket). القنوات والمجموعات والرسائل المباشرة مدعومة. Mattermost منصة مراسلة فرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على [mattermost.com](https://mattermost.com) لتفاصيل المنتج والتنزيلات.

## التثبيت

ثبّت Mattermost قبل تهيئة القناة:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

<Steps>
  <Step title="Ensure plugin is available">
    تتضمن إصدارات OpenClaw الحالية المحزّمة هذا Plugin بالفعل. يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
  </Step>
  <Step title="Create a Mattermost bot">
    أنشئ حساب bot في Mattermost وانسخ **رمز bot**.
  </Step>
  <Step title="Copy the base URL">
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
    الحد الأدنى من الإعداد:

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

أوامر slash الأصلية اختيارية. عند تمكينها، يسجّل OpenClaw أوامر slash من نوع `oc_*` عبر واجهة Mattermost API ويتلقى طلبات POST للردود على خادم HTTP الخاص بـ Gateway.

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
  <Accordion title="Behavior notes">
    - القيمة `native: "auto"` تكون معطلة افتراضيًا في Mattermost. اضبط `native: true` للتمكين.
    - إذا حُذفت `callbackUrl`، يشتق OpenClaw واحدة من مضيف/منفذ Gateway + `callbackPath`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز حقول المستوى الأعلى).
    - يتم التحقق من ردود الأوامر باستخدام رموز كل أمر التي يعيدها Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
    - يحدّث OpenClaw تسجيل أوامر Mattermost الحالي قبل قبول كل رد بحيث لا تظل الرموز القديمة من أوامر slash المحذوفة أو المعاد إنشاؤها مقبولة دون إعادة تشغيل Gateway.
    - يفشل التحقق من الرد بالإغلاق إذا لم تتمكن واجهة Mattermost API من تأكيد أن الأمر لا يزال حاليًا؛ تُخزّن عمليات التحقق الفاشلة مؤقتًا لفترة وجيزة، وتُدمج عمليات البحث المتزامنة، وتُقيّد بدايات البحث الجديدة بمعدل لكل أمر للحد من ضغط إعادة التشغيل.
    - تفشل ردود slash بالإغلاق عندما يفشل التسجيل، أو يكون بدء التشغيل جزئيًا، أو لا يطابق رمز الرد الرمز المسجل للأمر المحلول (لا يمكن لرمز صالح لأمر واحد الوصول إلى التحقق upstream لأمر مختلف).

  </Accordion>
  <Accordion title="Reachability requirement">
    يجب أن تكون نقطة نهاية الرد قابلة للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف نفسه/مساحة أسماء الشبكة نفسها مثل OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost إلا إذا كان ذلك العنوان يعكس عبر وكيل `/api/channels/mattermost/command` إلى OpenClaw.
    - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET الرمز `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    إذا كانت ردودك تستهدف عناوين خاصة/tailnet/داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق الرد.

    استخدم إدخالات المضيف/النطاق، لا عناوين URL كاملة.

    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه على مضيف Gateway إذا كنت تفضل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم الإعداد.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` خاص بمساحة العمل؛ راجع [ملفات `.env` الخاصة بمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل المباشرة تلقائيًا. يتحكم `chatmode` في سلوك القناة:

<Tabs>
  <Tab title="oncall (default)">
    الرد فقط عند @الإشارة في القنوات.
  </Tab>
  <Tab title="onmessage">
    الرد على كل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    الرد عندما تبدأ الرسالة ببادئة تشغيل.
  </Tab>
</Tabs>

مثال الإعداد:

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

- لا يزال `onchar` يرد على @الإشارات الصريحة.
- يتم احترام `channels.mattermost.requireMention` للإعدادات القديمة، لكن `chatmode` مفضّل.

## المحادثات المتسلسلة والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت ردود القنوات والمجموعات تبقى في القناة الرئيسية أو تبدأ سلسلة محادثة تحت المنشور المشغّل.

- `off` (افتراضي): الرد في سلسلة محادثة فقط عندما يكون المنشور الوارد موجودًا فيها بالفعل.
- `first`: لمنشورات القناة/المجموعة ذات المستوى الأعلى، ابدأ سلسلة محادثة تحت ذلك المنشور ووجّه المحادثة إلى جلسة بنطاق سلسلة المحادثة.
- `all`: السلوك نفسه مثل `first` في Mattermost اليوم.
- تتجاهل الرسائل المباشرة هذا الإعداد وتبقى غير متسلسلة.

مثال الإعداد:

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

- تستخدم الجلسات بنطاق سلسلة المحادثة معرّف المنشور المشغّل كجذر لسلسلة المحادثة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يصبح لدى Mattermost جذر سلسلة محادثة، تستمر المقاطع اللاحقة والوسائط في سلسلة المحادثة نفسها.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يحصل المرسلون غير المعروفين على رمز إقران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` بالإضافة إلى `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيّدة بالإشارة).
- اسمح للمرسلين باستخدام `channels.mattermost.groupAllowFrom` (يوصى بمعرّفات المستخدمين).
- تجاوزات الإشارة لكل قناة موجودة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` كافتراضي.
- مطابقة `@username` قابلة للتغيير ولا تُفعّل إلا عندما تكون `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيّدة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا تمامًا، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

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

استخدم صيغ الأهداف هذه مع `openclaw message send` أو cron/webhooks:

- `channel:<id>` لقناة
- `user:<id>` لرسالة مباشرة
- `@username` لرسالة مباشرة (تُحل عبر واجهة Mattermost API)

<Warning>
المعرّفات المعتمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم مقابل معرّف قناة).

يحلها OpenClaw **المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (ينجح `GET /api/v4/users/<id>`)، يرسل OpenClaw **رسالة مباشرة** عبر حل القناة المباشرة من خلال `/api/v4/channels/direct`.
- وإلا يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج إلى حل القناة المباشرة أولًا، فإنه يعيد محاولة إخفاقات إنشاء القناة المباشرة العابرة افتراضيًا.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عمومًا لـ Mattermost plugin، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

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

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس كل استدعاء لواجهة Mattermost API.
- تنطبق إعادة المحاولة على الإخفاقات العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx غير `429` على أنها دائمة ولا تُعاد محاولتها.

## بث المعاينة

يبث Mattermost التفكير، ونشاط الأدوات، ونص الرد الجزئي في **منشور معاينة مسودة** واحد يُنهى في مكانه عندما تكون الإجابة النهائية آمنة للإرسال. تُحدّث المعاينة على معرّف المنشور نفسه بدل إغراق القناة برسائل لكل مقطع. تلغي النهائيات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدل تفريغ منشور معاينة مؤقت.

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
  <Accordion title="Streaming modes">
    - `partial` هو الخيار المعتاد: منشور معاينة واحد يُحرّر مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
    - يستخدم `block` مقاطع مسودة بنمط الإلحاق داخل منشور المعاينة.
    - يعرض `progress` معاينة حالة أثناء التوليد وينشر الإجابة النهائية فقط عند الاكتمال.
    - يعطّل `off` بث المعاينة.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - إذا تعذر إنهاء البث في مكانه (مثلًا إذا حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا يُفقد الرد أبدًا.
    - تُحجب الحمولات الخاصة بالاستدلال فقط من منشورات القناة، بما في ذلك النص الذي يصل كاقتباس كتلي `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في واجهات أخرى؛ يحتفظ المنشور النهائي في Mattermost بالإجابة فقط.
    - راجع [البث](/ar/concepts/streaming#preview-streaming-modes) لمصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختياريتان).
- اضبط `remove=true` (منطقي) لإزالة تفاعل.
- تُمرر أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

الإعداد:

- `channels.mattermost.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (افتراضيًا true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل مع أزرار قابلة للنقر. عندما ينقر المستخدم زرًا، يتلقى الوكيل الاختيار ويمكنه الرد.

مكّن الأزرار بإضافة `inlineButtons` إلى إمكانات القناة:

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

حقول الأزرار:

<ParamField path="text" type="string" required>
  تسمية العرض.
</ParamField>
<ParamField path="callback_data" type="string" required>
  القيمة المرسلة مرة أخرى عند النقر (تُستخدم كمعرّف الإجراء).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  نمط الزر.
</ParamField>

عندما ينقر مستخدم على زر:

<Steps>
  <Step title="استُبدلت الأزرار بتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثل: "✓ **Yes** selected by @user").
  </Step>
  <Step title="يتلقى الوكيل الاختيار">
    يتلقى الوكيل الاختيار كرسالة واردة ويرد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات الأزرار التحقق عبر HMAC-SHA256 (تلقائي، ولا يحتاج إلى إعداد).
    - يزيل Mattermost بيانات الاستدعاء من استجابات API الخاصة به (ميزة أمان)، لذلك تُزال جميع الأزرار عند النقر - ولا يمكن الإزالة الجزئية.
    - تُنظَّف معرّفات الإجراءات التي تحتوي على واصلات أو شرطات سفلية تلقائيًا (قيد في توجيه Mattermost).

  </Accordion>
  <Accordion title="الإعداد وقابلية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتمكين وصف أداة الأزرار في موجّه نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لاستدعاءات الأزرار (مثل `https://gateway.example.com`). استخدم هذا عندما لا يستطيع Mattermost الوصول إلى Gateway عند مضيف الربط مباشرة.
    - في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا حُذف `interactions.callbackBaseUrl`، يستنتج OpenClaw عنوان URL للاستدعاء من `gateway.customBindHost` + `gateway.port`، ثم يرجع إلى `http://localhost:<port>`.
    - قاعدة قابلية الوصول: يجب أن يكون عنوان URL لاستدعاء الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف نفسه/مساحة أسماء الشبكة نفسها.
    - إذا كان هدف الاستدعاء خاصًا/ضمن tailnet/داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

  </Accordion>
</AccordionGroup>

### تكامل API مباشر (نصوص برمجية خارجية)

يمكن للنصوص البرمجية الخارجية وWebhooks نشر الأزرار مباشرة عبر واجهة برمجة تطبيقات Mattermost REST بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin عندما يكون ذلك ممكنًا؛ وإذا نشرت JSON خامًا، فاتبع هذه القواعد:

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
2. يحتاج كل إجراء إلى `type: "button"` - بدونه، تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` - يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` للإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تكسر الواصلات والشرطات السفلية توجيه الإجراءات من جهة خادم Mattermost (يعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` للزر كي تعرض رسالة التأكيد اسم الزر (مثل "Approve") بدلًا من معرّف خام.
6. `context.action_id` مطلوب - يعيد معالج التفاعل 400 بدونه.

</Warning>

**توليد رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على النصوص البرمجية الخارجية توليد رموز تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتق السر من رمز bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="ابنِ كائن السياق">
    ابنِ كائن السياق بجميع الحقول **باستثناء** `_token`.
  </Step>
  <Step title="سلسِل بمفاتيح مرتبة">
    سلسِل باستخدام **مفاتيح مرتبة** و**دون مسافات** (يستخدم Gateway `JSON.stringify` مع مفاتيح مرتبة، ما ينتج خرجًا مضغوطًا).
  </Step>
  <Step title="وقّع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="أضف الرمز">
    أضف الملخص الست عشري الناتج باسم `_token` في السياق.
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
    - يضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم `separators=(",", ":")` لمطابقة الخرج المضغوط في JavaScript (`{"key":"val"}`).
    - وقّع دائمًا **كل** حقول السياق (باستثناء `_token`). يزيل Gateway `_token` ثم يوقّع كل ما يتبقى. يؤدي توقيع مجموعة فرعية إلى فشل تحقق صامت.
    - استخدم `sort_keys=True` - يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز bot (حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر نفسه في العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محوّل الدليل

يتضمن Mattermost Plugin محوّل دليل يحل أسماء القنوات والمستخدمين عبر واجهة برمجة تطبيقات Mattermost. يتيح هذا أهداف `#channel-name` و`@username` في `openclaw message send` وتسليمات Cron/Webhook.

لا حاجة إلى إعداد - يستخدم المحوّل رمز bot من إعداد الحساب.

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

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تأكد من وجود bot في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز bot، وعنوان URL الأساسي، وما إذا كان الحساب ممكّنًا.
    - مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة على الحساب `default` فقط.

  </Accordion>
  <Accordion title="فشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز الاستدعاء. الأسباب النموذجية:
      - فشل تسجيل أمر الشرطة المائلة أو اكتمل جزئيًا فقط عند بدء التشغيل
      - يصل الاستدعاء إلى Gateway/الحساب الخطأ
      - ما زالت لدى Mattermost أوامر قديمة تشير إلى هدف استدعاء سابق
      - أُعيد تشغيل Gateway دون إعادة تنشيط أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا حُذف `callbackUrl` وحذّرت السجلات من أن الاستدعاء حُلّ إلى `http://127.0.0.1:18789/...`، فمن المحتمل أن عنوان URL هذا لا يمكن الوصول إليه إلا عندما يعمل Mattermost على المضيف نفسه/مساحة أسماء الشبكة نفسها مثل OpenClaw. اضبط `commands.callbackUrl` صريحًا وقابلًا للوصول خارجيًا بدلًا من ذلك.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء: قد يرسل الوكيل بيانات أزرار مشوّهة. تحقق من أن كل زر يحتوي على حقلي `text` و`callback_data`.
    - تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في إعداد خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` مضبوط على `true` في ServiceSettings.
    - تعيد الأزرار 404 عند النقر: من المحتمل أن يحتوي `id` للزر على واصلات أو شرطات سفلية. ينكسر موجّه الإجراءات في Mattermost عند المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
    - تسجّل Gateway `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (دون مسافات). راجع قسم HMAC أعلاه.
    - تسجّل Gateway `missing _token in context`: حقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند بناء حمولة التكامل.
    - يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: لا يطابق `context.action_id` قيمة `id` للزر. اضبط كليهما على القيمة المنظّفة نفسها.
    - لا يعرف الوكيل عن الأزرار: أضف `capabilities: ["inlineButtons"]` إلى إعداد قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك محادثات المجموعات وبوابة الإشارات
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
