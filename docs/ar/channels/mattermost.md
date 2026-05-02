---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد روبوت Mattermost وتهيئة OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T07:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل (رمز bot + أحداث WebSocket). القنوات والمجموعات والرسائل المباشرة مدعومة. Mattermost منصة مراسلة فرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على [mattermost.com](https://mattermost.com) للحصول على تفاصيل المنتج والتنزيلات.

## التثبيت

ثبّت Mattermost قبل تهيئة القناة:

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
    إصدارات OpenClaw المحزّمة الحالية تتضمنه بالفعل. يمكن للتثبيتات الأقدم/المخصصة إضافته يدويا باستخدام الأوامر أعلاه.
  </Step>
  <Step title="أنشئ bot في Mattermost">
    أنشئ حساب bot في Mattermost وانسخ **رمز bot**.
  </Step>
  <Step title="انسخ عنوان URL الأساسي">
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`).
  </Step>
  <Step title="هيّئ OpenClaw وابدأ Gateway">
    الحد الأدنى من الإعدادات:

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

أوامر slash الأصلية اختيارية. عند تفعيلها، يسجل OpenClaw أوامر slash باسم `oc_*` عبر Mattermost API ويتلقى طلبات POST الراجعة على خادم HTTP الخاص بـ Gateway.

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
    - `native: "auto"` تكون معطلة افتراضيا لـ Mattermost. اضبط `native: true` للتفعيل.
    - إذا حُذف `callbackUrl`، يشتق OpenClaw واحدا من مضيف/منفذ Gateway + `callbackPath`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز حقول المستوى الأعلى).
    - تُتحقق عمليات الاستدعاء الراجعة للأوامر باستخدام الرموز لكل أمر التي يعيدها Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
    - يحدّث OpenClaw تسجيل أوامر Mattermost الحالي قبل قبول كل استدعاء راجع، بحيث تتوقف الرموز القديمة من أوامر slash المحذوفة أو المعاد توليدها عن القبول دون إعادة تشغيل Gateway.
    - يفشل التحقق من الاستدعاء الراجع بالإغلاق إذا تعذر على Mattermost API تأكيد أن الأمر لا يزال حاليا؛ تُخزن عمليات التحقق الفاشلة مؤقتا لفترة وجيزة، وتُدمج عمليات البحث المتزامنة، وتُقيّد بدايات البحث الجديدة بمعدل لكل أمر للحد من ضغط إعادة التشغيل.
    - تفشل استدعاءات slash الراجعة بالإغلاق عند فشل التسجيل، أو اكتمال بدء التشغيل جزئيا، أو عدم تطابق رمز الاستدعاء الراجع مع الرمز المسجل للأمر المحلول (لا يمكن لرمز صالح لأمر واحد الوصول إلى التحقق العلوي لأمر مختلف).

  </Accordion>
  <Accordion title="متطلب قابلية الوصول">
    يجب أن تكون نقطة نهاية الاستدعاء الراجع قابلة للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف نفسه/مساحة أسماء الشبكة نفسها مثل OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost إلا إذا كان ذلك العنوان يعكس عبر proxy المسار `/api/channels/mattermost/command` إلى OpenClaw.
    - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="قائمة سماح خروج Mattermost">
    إذا كانت وجهة الاستدعاء الراجع عناوين خاصة/tailnet/داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق الاستدعاء الراجع.

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

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل المباشرة تلقائيا. يتحكم `chatmode` في سلوك القنوات:

<Tabs>
  <Tab title="oncall (افتراضي)">
    لا ترد إلا عند الإشارة بـ @ في القنوات.
  </Tab>
  <Tab title="onmessage">
    الرد على كل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    الرد عندما تبدأ رسالة ببادئة تشغيل.
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

- لا يزال `onchar` يرد على إشارات @ الصريحة.
- يُحترم `channels.mattermost.requireMention` في الإعدادات القديمة، لكن `chatmode` هو المفضل.

## السلاسل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت ردود القنوات والمجموعات تبقى في القناة الرئيسية أو تبدأ سلسلة تحت المنشور المحفز.

- `off` (افتراضي): الرد في سلسلة فقط عندما يكون المنشور الوارد موجودا بالفعل في واحدة.
- `first`: للمنشورات العليا في القنوات/المجموعات، ابدأ سلسلة تحت ذلك المنشور ووجّه المحادثة إلى جلسة بنطاق السلسلة.
- `all`: السلوك نفسه مثل `first` في Mattermost حاليا.
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

- تستخدم الجلسات ذات نطاق السلسلة معرف المنشور المحفز كجذر السلسلة.
- `first` و`all` متكافئان حاليا لأنه بمجرد أن يكون لدى Mattermost جذر سلسلة، تستمر المقاطع اللاحقة والوسائط في السلسلة نفسها.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يحصل المرسلون غير المعروفين على رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (محكومة بالإشارة).
- اسمح بالمرسلين باستخدام `channels.mattermost.groupAllowFrom` (يوصى بمعرفات المستخدمين).
- تجاوزات الإشارة لكل قناة موجودة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` كإعداد افتراضي.
- مطابقة `@username` قابلة للتغيير ولا تُفعّل إلا عند `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (محكومة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطا).

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
- `user:<id>` لرسالة مباشرة
- `@username` لرسالة مباشرة (تُحل عبر Mattermost API)

<Warning>
المعرفات المعتمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرف مستخدم مقابل معرف قناة).

يحلها OpenClaw **بالمستخدم أولا**:

- إذا كان المعرف موجودا كمستخدم (`GET /api/v4/users/<id>` ينجح)، يرسل OpenClaw **رسالة مباشرة** عبر حل القناة المباشرة من خلال `/api/v4/channels/direct`.
- وإلا فيُعامل المعرف كـ **معرف قناة**.

إذا كنت تحتاج سلوكا حتميا، فاستخدم دائما البادئات الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج إلى حل القناة المباشرة أولا، فإنه يعيد محاولة حالات فشل إنشاء القناة المباشرة العابرة افتراضيا.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عالميا لـ Mattermost Plugin، أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

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

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس على كل استدعاء لـ Mattermost API.
- تنطبق إعادة المحاولة على حالات الفشل العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو المهلة.
- تُعامل أخطاء العميل 4xx باستثناء `429` كدائمة ولا يُعاد محاولتها.

## بث المعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي في **منشور معاينة مسودة** واحد يُنهى في مكانه عندما تصبح الإجابة النهائية آمنة للإرسال. تُحدّث المعاينة على معرف المنشور نفسه بدلا من إغراق القناة برسائل لكل مقطع. تلغي نهايات الوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدلا من دفع منشور معاينة مؤقت.

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
    - `partial` هو الخيار المعتاد: منشور معاينة واحد يُعدل مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
    - يستخدم `block` مقاطع مسودة بأسلوب الإلحاق داخل منشور المعاينة.
    - يعرض `progress` معاينة حالة أثناء التوليد ولا ينشر الإجابة النهائية إلا عند الاكتمال.
    - يعطل `off` بث المعاينة.

  </Accordion>
  <Accordion title="ملاحظات سلوك البث">
    - إذا تعذر إنهاء البث في مكانه (على سبيل المثال، حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا يضيع الرد أبدا.
    - تُحجب الحمولات المخصصة للتفكير فقط عن منشورات القناة، بما في ذلك النص الذي يصل كاقتباس كتلي `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في الأسطح الأخرى؛ يحتفظ منشور Mattermost النهائي بالإجابة فقط.
    - راجع [البث](/ar/concepts/streaming#preview-streaming-modes) لمصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختياريتان).
- اضبط `remove=true` (منطقي) لإزالة تفاعل.
- تُمرر أحداث إضافة/إزالة التفاعل كأحداث نظام إلى جلسة الوكيل الموجهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

الإعدادات:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (افتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل بأزرار قابلة للنقر. عندما ينقر مستخدم زرا، يتلقى الوكيل الاختيار ويمكنه الرد.

فعّل الأزرار بإضافة `inlineButtons` إلى قدرات القناة:

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
  القيمة المُرسلة مرة أخرى عند النقر (تُستخدم كمعرّف الإجراء).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  نمط الزر.
</ParamField>

عندما ينقر المستخدم زرًا:

<Steps>
  <Step title="استبدال الأزرار بتأكيد">
    تُستبدل جميع الأزرار بسطر تأكيد (مثلًا: "✓ تم تحديد **نعم** بواسطة @user").
  </Step>
  <Step title="يتلقى الوكيل التحديد">
    يتلقى الوكيل التحديد كرسالة واردة ويردّ.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم عمليات رد نداء الأزرار تحقق HMAC-SHA256 (تلقائي، لا يلزم أي إعداد).
    - يزيل Mattermost بيانات رد النداء من استجابات API الخاصة به (ميزة أمان)، لذلك تُزال جميع الأزرار عند النقر — ولا يمكن الإزالة الجزئية.
    - تُنظّف معرّفات الإجراءات التي تحتوي على واصلات أو شرطات سفلية تلقائيًا (قيد في توجيه Mattermost).

  </Accordion>
  <Accordion title="الإعداد وقابلية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل القدرات. أضف `"inlineButtons"` لتمكين وصف أداة الأزرار في موجّه نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لعمليات رد نداء الأزرار (مثل `https://gateway.example.com`). استخدم هذا عندما لا يستطيع Mattermost الوصول إلى Gateway مباشرةً عند مضيف الربط الخاص به.
    - في الإعدادات متعددة الحسابات، يمكنك أيضًا تعيين الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا تم حذف `interactions.callbackBaseUrl`، يستنتج OpenClaw عنوان URL لرد النداء من `gateway.customBindHost` + `gateway.port`، ثم يرجع إلى `http://localhost:<port>`.
    - قاعدة قابلية الوصول: يجب أن يكون عنوان URL لرد نداء الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف نفسه/نطاق أسماء الشبكة نفسه.
    - إذا كان هدف رد النداء خاصًا/ضمن tailnet/داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

  </Accordion>
</AccordionGroup>

### تكامل API المباشر (البرامج النصية الخارجية)

يمكن للبرامج النصية الخارجية وWebhooks نشر الأزرار مباشرةً عبر Mattermost REST API بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin عندما يكون ذلك ممكنًا؛ وإذا كنت تنشر JSON خامًا، فاتبع هذه القواعد:

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
**قواعد بالغة الأهمية**

1. توضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (يتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — وبدونه، يتم تجاهل النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تؤدي الواصلات والشرطات السفلية إلى تعطيل توجيه الإجراءات على جانب خادم Mattermost (يعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` للزر لكي تعرض رسالة التأكيد اسم الزر (مثل "Approve") بدلًا من معرّف خام.
6. `context.action_id` مطلوب — يعيد معالج التفاعل 400 بدونه.

</Warning>

**توليد رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب أن تولّد البرامج النصية الخارجية رموزًا تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتق السر من رمز البوت">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="أنشئ كائن السياق">
    أنشئ كائن السياق بجميع الحقول **باستثناء** `_token`.
  </Step>
  <Step title="سلسل بالمفاتيح المرتبة">
    سلسل باستخدام **مفاتيح مرتبة** و**بلا مسافات** (يستخدم Gateway `JSON.stringify` مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
  </Step>
  <Step title="وقّع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="أضف الرمز">
    أضف الخلاصة السداسية عشرية الناتجة كـ `_token` في السياق.
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
  <Accordion title="الأخطاء الشائعة في HMAC">
    - تضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
    - وقّع دائمًا **جميع** حقول السياق (باستثناء `_token`). يزيل Gateway `_token` ثم يوقّع كل ما يتبقى. يؤدي توقيع مجموعة فرعية إلى فشل تحقق صامت.
    - استخدم `sort_keys=True` — يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز البوت (حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محوّل الدليل

يتضمن Plugin Mattermost محوّل دليل يحل أسماء القنوات والمستخدمين عبر Mattermost API. يتيح هذا أهداف `#channel-name` و`@username` في `openclaw message send` وعمليات تسليم Cron/Webhook.

لا يلزم أي إعداد — يستخدم المحوّل رمز البوت من إعداد الحساب.

## الحسابات المتعددة

يدعم Mattermost عدة حسابات ضمن `channels.mattermost.accounts`:

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
    تأكد من أن البوت موجود في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو عيّن `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز البوت، وعنوان URL الأساسي، وما إذا كان الحساب ممكّنًا.
    - مشكلات الحسابات المتعددة: لا تنطبق متغيرات البيئة إلا على حساب `default`.

  </Accordion>
  <Accordion title="فشل أوامر الشرطة المائلة الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز رد النداء. الأسباب المعتادة:
      - فشل تسجيل أمر الشرطة المائلة أو اكتمل جزئيًا فقط عند بدء التشغيل
      - يصل رد النداء إلى Gateway/حساب خاطئ
      - لا يزال لدى Mattermost أوامر قديمة تشير إلى هدف رد نداء سابق
      - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر الشرطة المائلة
    - إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا تم حذف `callbackUrl` وحذرت السجلات من أن رد النداء حُلّ إلى `http://127.0.0.1:18789/...`، فمن المحتمل ألا يكون عنوان URL هذا قابلًا للوصول إلا عندما يعمل Mattermost على المضيف نفسه/نطاق أسماء الشبكة نفسه مثل OpenClaw. عيّن `commands.callbackUrl` صريحًا وقابلًا للوصول خارجيًا بدلًا من ذلك.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار مشوهة. تحقق من أن كل زر يحتوي على حقلي `text` و`callback_data`.
    - تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في إعداد خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` هي `true` في ServiceSettings.
    - تعيد الأزرار 404 عند النقر: من المحتمل أن يحتوي `id` الزر على واصلات أو شرطات سفلية. يتعطل موجّه إجراءات Mattermost عند المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
    - تسجل Gateway ‏`invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (بلا مسافات). راجع قسم HMAC أعلاه.
    - تسجل Gateway ‏`missing _token in context`: حقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند بناء حمولة التكامل.
    - يعرض التأكيد المعرّف الخام بدلًا من اسم الزر: لا يطابق `context.action_id` قيمة `id` للزر. عيّن كليهما إلى القيمة المنظّفة نفسها.
    - لا يعرف الوكيل عن الأزرار: أضف `capabilities: ["inlineButtons"]` إلى إعداد قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارات
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
