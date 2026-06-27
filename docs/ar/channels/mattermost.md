---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
sidebarTitle: Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل (رمز بوت + أحداث WebSocket). القنوات والمجموعات والرسائل المباشرة مدعومة. Mattermost منصة مراسلة فرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على [mattermost.com](https://mattermost.com) لتفاصيل المنتج والتنزيلات.

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
    ثبّت `@openclaw/mattermost` باستخدام الأمر أعلاه، ثم أعد تشغيل Gateway إذا كان قيد التشغيل بالفعل.
  </Step>
  <Step title="Create a Mattermost bot">
    أنشئ حساب بوت Mattermost وانسخ **رمز البوت**.
  </Step>
  <Step title="Copy the base URL">
    انسخ **عنوان URL الأساسي** لـ Mattermost (مثلًا، `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

## أوامر الشرطة المائلة الأصلية

أوامر الشرطة المائلة الأصلية اختيارية. عند تفعيلها، يسجّل OpenClaw أوامر الشرطة المائلة `oc_*` عبر Mattermost API ويتلقى طلبات POST للردود على خادم HTTP الخاص بالـ Gateway.

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
    - الإعداد `native: "auto"` يكون معطّلًا افتراضيًا لـ Mattermost. عيّن `native: true` للتفعيل.
    - إذا حُذف `callbackUrl`، يشتق OpenClaw واحدًا من مضيف/منفذ Gateway + `callbackPath`.
    - في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو ضمن `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز الحقول ذات المستوى الأعلى).
    - تُتحقق ردود الأوامر باستخدام الرموز الخاصة بكل أمر التي يرجعها Mattermost عندما يسجّل OpenClaw أوامر `oc_*`.
    - يحدّث OpenClaw تسجيل أوامر Mattermost الحالي قبل قبول كل رد حتى تتوقف الرموز القديمة من أوامر الشرطة المائلة المحذوفة أو المعاد إنشاؤها عن القبول دون إعادة تشغيل Gateway.
    - يفشل تحقق الرد بإغلاق آمن إذا تعذر على Mattermost API تأكيد أن الأمر لا يزال حاليًا؛ تُخزّن عمليات التحقق الفاشلة مؤقتًا لوقت قصير، وتُدمج عمليات البحث المتزامنة، وتُقيّد بدايات البحث الجديدة بمعدل لكل أمر للحد من ضغط إعادة التشغيل.
    - تفشل ردود الشرطة المائلة بإغلاق آمن عند فشل التسجيل، أو كان بدء التشغيل جزئيًا، أو لم يطابق رمز الرد الرمز المسجل للأمر المحلول (لا يمكن لرمز صالح لأمر واحد الوصول إلى تحقق المنبع لأمر مختلف).

  </Accordion>
  <Accordion title="Reachability requirement">
    يجب أن تكون نقطة نهاية الرد قابلة للوصول من خادم Mattermost.

    - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف نفسه/نطاق الشبكة نفسه مثل OpenClaw.
    - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost لديك إلا إذا كان ذلك العنوان يمرر `/api/channels/mattermost/command` إلى OpenClaw عبر وكيل عكسي.
    - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`؛ يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw، وليس `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    إذا كانت وجهة الرد تستهدف عناوين خاصة/داخل tailnet/داخلية، فاضبط `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost لتضمين مضيف/نطاق الرد.

    استخدم إدخالات المضيف/النطاق، وليس عناوين URL كاملة.

    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه على مضيف Gateway إذا كنت تفضّل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم الإعدادات.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل المباشرة تلقائيًا. يتحكم `chatmode` في سلوك القنوات:

<Tabs>
  <Tab title="oncall (default)">
    يرد فقط عند @الإشارة إليه في القنوات.
  </Tab>
  <Tab title="onmessage">
    يرد على كل رسالة في القناة.
  </Tab>
  <Tab title="onchar">
    يرد عندما تبدأ الرسالة ببادئة تشغيل.
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

- لا يزال `onchar` يرد على @الإشارات الصريحة.
- يُحترم `channels.mattermost.requireMention` للإعدادات القديمة، لكن `chatmode` هو المفضل.
- بعد أن يرسل البوت ردًا مرئيًا في سلسلة قناة، تُجاب الرسائل اللاحقة في السلسلة نفسها دون @إشارة جديدة أو بادئة `onchar`، لذلك تستمر محادثات السلاسل متعددة الجولات. تُتذكّر المشاركة لمدة 7 أيام من خمول السلسلة (وتُحدّث عند كل رد) وتستمر عبر عمليات إعادة تشغيل Gateway. لا تتأثر السلاسل التي راقبها البوت فقط؛ ابدأ رسالة جديدة في المستوى الأعلى لطلب إشارة صريحة مرة أخرى.

## السلاسل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت ردود القناة والمجموعة تبقى في القناة الرئيسية أو تبدأ سلسلة تحت المنشور الذي شغّلها.

- `off` (الافتراضي): الرد في سلسلة فقط عندما يكون المنشور الوارد موجودًا بالفعل في سلسلة.
- `first`: لمنشورات القناة/المجموعة في المستوى الأعلى، ابدأ سلسلة تحت ذلك المنشور ووجّه المحادثة إلى جلسة بنطاق السلسلة.
- `all`: السلوك نفسه مثل `first` لـ Mattermost حاليًا.
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

- تستخدم الجلسات بنطاق السلسلة معرّف المنشور المشغّل كجذر للسلسلة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يكون لدى Mattermost جذر سلسلة، تستمر المقاطع اللاحقة والوسائط في السلسلة نفسها.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (المرسلون غير المعروفين يحصلون على رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` بالإضافة إلى `channels.mattermost.allowFrom=["*"]`.
- يقبل `channels.mattermost.allowFrom` إدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (محكوم بالإشارة).
- اسمح للمرسلين باستخدام `channels.mattermost.groupAllowFrom` (يُوصى بمعرّفات المستخدمين).
- يقبل `channels.mattermost.groupAllowFrom` إدخالات `accessGroup:<name>`. راجع [مجموعات الوصول](/ar/channels/access-groups).
- تعيش تجاوزات الإشارة لكل قناة ضمن `channels.mattermost.groups.<channelId>.requireMention` أو `channels.mattermost.groups["*"].requireMention` كافتراضي.
- مطابقة `@username` قابلة للتغيير ولا تُفعّل إلا عند `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (محكومة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

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

استخدم صيغ الأهداف هذه مع `openclaw message send` أو cron/webhooks:

- `channel:<id>` لقناة
- `user:<id>` لرسالة مباشرة
- `@username` لرسالة مباشرة (تُحل عبر Mattermost API)

<Warning>
المعرّفات المعتمة العارية (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم مقابل معرّف قناة).

يحلها OpenClaw **بالمستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (ينجح `GET /api/v4/users/<id>`)، يرسل OpenClaw **رسالة مباشرة** عبر حل القناة المباشرة من خلال `/api/v4/channels/direct`.
- وإلا يُعامل المعرّف باعتباره **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البوادئ الصريحة (`user:<id>` / `channel:<id>`).
</Warning>

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج إلى حل القناة المباشرة أولًا، فإنه يعيد محاولة إخفاقات إنشاء القناة المباشرة المؤقتة افتراضيًا.

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

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس كل استدعاء لـ Mattermost API.
- تنطبق إعادة المحاولة على الإخفاقات المؤقتة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو المهلة.
- تُعامل أخطاء العميل 4xx غير `429` كدائمة ولا تُعاد محاولتها.

## بث المعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي في **منشور معاينة مسودة** واحد يُنهى في مكانه عندما يكون الجواب النهائي آمنًا للإرسال. تُحدّث المعاينة على معرّف المنشور نفسه بدل إغراق القناة برسائل لكل مقطع. تلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدل تفريغ منشور معاينة مؤقت.

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
    - `partial` هو الخيار المعتاد: منشور معاينة واحد يُحرر مع نمو الرد، ثم يُنهى بالجواب الكامل.
    - يستخدم `block` مقاطع مسودة بأسلوب الإلحاق داخل منشور المعاينة.
    - يعرض `progress` معاينة حالة أثناء التوليد وينشر الجواب النهائي فقط عند الاكتمال.
    - يعطل `off` بث المعاينة.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - إذا تعذر إنهاء البث في مكانه (على سبيل المثال، حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا يضيع الرد أبدًا.
    - تُحجب حمولات التفكير فقط من منشورات القناة، بما في ذلك النص الذي يصل كاقتباس كتلي `> Thinking`. اضبط `/reasoning on` لرؤية التفكير في أسطح أخرى؛ يحتفظ المنشور النهائي في Mattermost بالجواب فقط.
    - راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) لمصفوفة ربط القنوات.

  </Accordion>
</AccordionGroup>

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان الرأسيتان اختياريتان).
- اضبط `remove=true` (منطقي) لإزالة تفاعل.
- تُمرر أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة.

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

يمكن أن تتضمن ردود الوكيل العادية أيضًا حمولات `presentation` دلالية. يعرض OpenClaw أزرار القيم كأزرار تفاعلية في Mattermost، ويبقي أزرار URL مرئية في نص الرسالة، ويحوّل قوائم الاختيار إلى نص مقروء.

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

حقول الأزرار:

<ParamField path="text" type="string" required>
  تسمية العرض.
</ParamField>
<ParamField path="callback_data" type="string" required>
  القيمة المُرسلة عند النقر (تُستخدم كمعرّف الإجراء).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  نمط الزر.
</ParamField>

عندما ينقر مستخدم زرًا:

<Steps>
  <Step title="استبدال الأزرار بتأكيد">
    تُستبدل كل الأزرار بسطر تأكيد (مثلًا، "✓ **Yes** selected by @user").
  </Step>
  <Step title="يتلقى الوكيل الاختيار">
    يتلقى الوكيل الاختيار كرسالة واردة ويرد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ملاحظات التنفيذ">
    - تستخدم استدعاءات الأزرار التحقق HMAC-SHA256 (تلقائي، لا يحتاج إلى إعداد).
    - يزيل Mattermost بيانات الاستدعاء من استجابات API الخاصة به (ميزة أمان)، لذلك تُزال كل الأزرار عند النقر - الإزالة الجزئية غير ممكنة.
    - تُعقّم معرّفات الإجراءات التي تحتوي على واصلات أو شرطات سفلية تلقائيًا (قيد في توجيه Mattermost).

  </Accordion>
  <Accordion title="الإعداد وقابلية الوصول">
    - `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` لتفعيل وصف أداة الأزرار في مطالبة نظام الوكيل.
    - `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لاستدعاءات الأزرار (على سبيل المثال `https://gateway.example.com`). استخدم هذا عندما لا يستطيع Mattermost الوصول إلى Gateway مباشرة على مضيف الربط الخاص به.
    - في إعدادات الحسابات المتعددة، يمكنك أيضًا تعيين الحقل نفسه ضمن `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - إذا حُذف `interactions.callbackBaseUrl`، يشتق OpenClaw عنوان URL للاستدعاء من `gateway.customBindHost` + `gateway.port`، ثم يعود إلى `http://localhost:<port>`.
    - قاعدة قابلية الوصول: يجب أن يكون عنوان URL لاستدعاء الزر قابلًا للوصول من خادم Mattermost. لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف نفسه/مساحة أسماء الشبكة نفسها.
    - إذا كان هدف الاستدعاء خاصًا/ضمن tailnet/داخليًا، فأضف مضيفه/نطاقه إلى `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

  </Accordion>
</AccordionGroup>

### التكامل المباشر مع API (السكربتات الخارجية)

يمكن للسكربتات الخارجية وwebhooks نشر الأزرار مباشرة عبر REST API الخاص بـ Mattermost بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من Plugin عندما يكون ذلك ممكنًا؛ وإذا كنت تنشر JSON خامًا، فاتبع هذه القواعد:

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
2. يحتاج كل إجراء إلى `type: "button"` - وبدونه تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` - يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تكسر الواصلات والشرطات السفلية توجيه الإجراءات من جهة خادم Mattermost (يرجع 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تعرض رسالة التأكيد اسم الزر (مثلًا، "Approve") بدلًا من معرّف خام.
6. `context.action_id` مطلوب - يعيد معالج التفاعل 400 بدونه.

</Warning>

**توليد رمز HMAC**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على السكربتات الخارجية توليد رموز تطابق منطق التحقق في Gateway:

<Steps>
  <Step title="اشتق السر من رمز bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="أنشئ كائن السياق">
    أنشئ كائن السياق بكل الحقول **باستثناء** `_token`.
  </Step>
  <Step title="سلسل باستخدام مفاتيح مرتبة">
    سلسل باستخدام **مفاتيح مرتبة** و**دون مسافات** (يستخدم Gateway `JSON.stringify` مع مفاتيح مرتبة، ما ينتج خرجًا مضغوطًا).
  </Step>
  <Step title="وقّع الحمولة">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="أضف الرمز">
    أضف ملخص hex الناتج كـ `_token` في السياق.
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
    - وقّع دائمًا **كل** حقول السياق (ناقص `_token`). يزيل Gateway `_token` ثم يوقّع كل ما يتبقى. توقيع مجموعة فرعية يسبب فشل تحقق صامتًا.
    - استخدم `sort_keys=True` - يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost ترتيب حقول السياق عند تخزين الحمولة.
    - اشتق السر من رمز bot (حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر نفسه في العملية التي تنشئ الأزرار وفي Gateway الذي يتحقق منها.

  </Accordion>
</AccordionGroup>

## محوّل الدليل

يتضمن Plugin الخاص بـ Mattermost محوّل دليل يحل أسماء القنوات والمستخدمين عبر API الخاص بـ Mattermost. يتيح هذا أهداف `#channel-name` و`@username` في `openclaw message send` وتسليمات cron/webhook.

لا يلزم أي إعداد - يستخدم المحوّل رمز bot من إعداد الحساب.

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
    تأكد من أن bot موجود في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو عيّن `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="أخطاء المصادقة أو الحسابات المتعددة">
    - تحقق من رمز bot، وعنوان URL الأساسي، وما إذا كان الحساب مفعّلًا.
    - مشكلات الحسابات المتعددة: لا تنطبق متغيرات env إلا على الحساب `default`.

  </Accordion>
  <Accordion title="تفشل أوامر slash الأصلية">
    - `Unauthorized: invalid command token.`: لم يقبل OpenClaw رمز الاستدعاء. الأسباب المعتادة:
      - فشل تسجيل أمر slash أو اكتمل جزئيًا فقط عند بدء التشغيل
      - يصل الاستدعاء إلى Gateway/الحساب الخطأ
      - لا يزال لدى Mattermost أوامر قديمة تشير إلى هدف استدعاء سابق
      - أعيد تشغيل Gateway دون إعادة تنشيط أوامر slash
    - إذا توقفت أوامر slash الأصلية عن العمل، فتحقق من السجلات بحثًا عن `mattermost: failed to register slash commands` أو `mattermost: native slash commands enabled but no commands could be registered`.
    - إذا حُذف `callbackUrl` وحذرت السجلات من أن الاستدعاء حُل إلى `http://127.0.0.1:18789/...`، فمن المحتمل ألا يكون عنوان URL هذا قابلًا للوصول إلا عندما يعمل Mattermost على المضيف نفسه/مساحة أسماء الشبكة نفسها مثل OpenClaw. عيّن `commands.callbackUrl` صريحًا وقابلًا للوصول خارجيًا بدلًا من ذلك.

  </Accordion>
  <Accordion title="مشكلات الأزرار">
    - تظهر الأزرار كمربعات بيضاء: قد يرسل الوكيل بيانات أزرار غير صحيحة البنية. تحقق من أن كل زر يحتوي على حقلي `text` و`callback_data`.
    - تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في إعداد خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` هو `true` في ServiceSettings.
    - تعيد الأزرار 404 عند النقر: من المحتمل أن يحتوي `id` الزر على واصلات أو شرطات سفلية. يتعطل موجّه إجراءات Mattermost عند المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
    - تسجل سجلات Gateway `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع كل حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (دون مسافات). راجع قسم HMAC أعلاه.
    - تسجل سجلات Gateway `missing _token in context`: حقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند إنشاء حمولة التكامل.
    - يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: لا يطابق `context.action_id` قيمة `id` الخاصة بالزر. عيّن كليهما إلى القيمة المنقحة نفسها.
    - لا يعرف الوكيل عن الأزرار: أضف `capabilities: ["inlineButtons"]` إلى إعداد قناة Mattermost.

  </Accordion>
</AccordionGroup>

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الذكر
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
