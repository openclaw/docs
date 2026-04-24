---
read_when:
    - إعداد Slack أو تصحيح وضع socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-24T07:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Slack وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وخطط إصلاح.
  </Card>
</CardGroup>

## إعداد سريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) الظاهر
      </Step>

      <Step title="اضبط OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        الرجوع الاحتياطي عبر البيئة (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) الظاهر

      </Step>

      <Step title="اضبط OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        استخدم مسارات webhook فريدة لـ HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مختلفًا (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات.
        </Note>

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## قائمة التحقق من manifest والنطاقات

manifest الأساسي لتطبيق Slack هو نفسه لكل من Socket Mode وعناوين URL لطلبات HTTP. يختلف فقط جزء `settings` (وكذلك `url` الخاص بأمر الشرطة المائلة).

manifest الأساسي (الافتراضي لـ Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

بالنسبة إلى **وضع عناوين URL لطلبات HTTP**، استبدل `settings` بنسخة HTTP وأضف `url` إلى كل أمر شرطة مائلة. مطلوب عنوان URL عام:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### إعدادات manifest إضافية

تكشف الميزات المختلفة التي توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مضبوط مع بعض الفروقات:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (الافتراضي)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="عناوين URL لطلبات HTTP">
        استخدم قائمة `slash_commands` نفسها الموجودة أعلاه لـ Socket Mode، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق bot ‏`chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة emoji، فإن Slack يتوقع الصيغة `:emoji_name:`.
  </Accordion>
  <Accordion title="نطاقات user-token الاختيارية (عمليات القراءة)">
    إذا قمت بضبط `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history` و`groups:history` و`im:history` و`mpim:history`
    - `channels:read` و`groups:read` و`im:read` و`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز

- يلزم `botToken` + `appToken` لـ Socket Mode.
- يتطلب وضع HTTP ‏`botToken` + `signingSecret`.
- يقبل كل من `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تتجاوز الرموز الموجودة في الإعدادات الرجوع الاحتياطي عبر البيئة.
- ينطبق الرجوع الاحتياطي عبر البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) متاح عبر الإعدادات فقط (من دون رجوع احتياطي عبر البيئة) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتعقب فحص حساب Slack الحقول `*Source` و`*Status`
  لكل اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر أسرار آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode، فالزوج
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل user token عند ضبطه. أما في عمليات الكتابة، فيظل bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة باستخدام user token إلا عندما تكون `userTokenReadOnly: false` ويكون bot token غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة | الافتراضي |
| -------- | ---------- |
| messages | مفعّل |
| reactions | مفعّل |
| pins | مفعّل |
| memberInfo | مفعّل |
| emojiList | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة (الإرث: `channels.slack.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`؛ الإرث: `channels.slack.dm.allowFrom`)
    - `disabled`

    علامات الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (إرث)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات تحت `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات ثابتة.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة بالكامل (إعداد يعتمد على البيئة فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    حلّ الاسم/المعرّف:

    - يتم حلّ إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - يتم الاحتفاظ بإدخالات أسماء القنوات غير المحلولة كما هي مضبوطة ولكن يتم تجاهلها للتوجيه افتراضيًا
    - يكون تفويض الإدخال الوارد وتوجيه القنوات قائمًا على المعرّفات أولًا افتراضيًا؛ ويتطلب التطابق المباشر مع اسم المستخدم/slug ضبط `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدمي القنوات">
    تكون رسائل القنوات محكومة ببوابة الإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة للتطبيق (`<@botId>`)
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، والرجوع الاحتياطي إلى `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على bot في سلسلة المحادثة (يتم تعطيله عندما تكون `thread.requireExplicitMention` مساوية لـ `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحلّ عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: ‏`id:` أو `e164:` أو `username:` أو `name:` أو البطاقة العامة `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُطابق `id:` فقط)

  </Tab>
</Tabs>

## سلاسل المحادثات والجلسات ووسوم الرد

- يتم توجيه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج الرسائل المباشرة في Slack في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود سلاسل المحادثات إنشاء لاحقات جلسات للسلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبط `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، يتم منع الإشارات الضمنية داخل السلسلة بحيث لا يرد bot إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون bot قد شارك بالفعل في السلسلة. ومن دون ذلك، تتجاوز الردود في سلسلة شارك فيها bot بوابة `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: ‏`off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- الرجوع الاحتياطي القديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **كل** سلاسل الرد في Slack، بما في ذلك الوسوم الصريحة `[[reply_to_*]]`. وهذا يختلف عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"` — إذ تخفي سلاسل Slack الرسائل من القناة بينما تظل ردود Telegram مرئية ضمن السطر.

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحلّ:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الرجوع الاحتياطي إلى emoji هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack shortcodes (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو بشكل عام.

## بث النص

تتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة مفعّلة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المحررة نفسها (الافتراضي: `true`). اضبط `false` للإبقاء على رسائل الأداة/التقدم منفصلة.

تتحكم `channels.slack.streaming.nativeTransport` في البث النصي الأصلي لـ Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة لكي يظهر البث النصي الأصلي وحالة سلسلة Slack assistant. ويظل اختيار السلسلة متبعًا لـ `replyToMode`.
- لا تزال جذور القنوات والدردشات الجماعية تستطيع استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تبقى الرسائل المباشرة العليا المستوى في Slack خارج السلاسل افتراضيًا، لذلك لا تُظهر معاينة بنمط السلسلة؛ استخدم ردود السلاسل أو `typingReaction` إذا أردت تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهايات النهائية للوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا يتم تفريغ النهايات النصية/الكتلية المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من البث النصي الأصلي لـ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

المفاتيح القديمة:

- يتم ترحيل `channels.slack.streamMode` ‏(`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- يتم ترحيل القيمة المنطقية `channels.slack.streaming` تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## الرجوع الاحتياطي لتفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw للرد، ثم يزيله عند انتهاء التشغيل. ويكون هذا مفيدًا أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضي "is typing...".

ترتيب الحلّ:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack shortcodes (مثل `"hourglass_flowing_sand"`).
- يكون التفاعل بأفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقطيع والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلبات موثّق بالرمز) وكتابتها إلى مخزن الوسائط عند نجاح الجلب والسماح بحدود الحجم.

    يكون الحد الأقصى الافتراضي للحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم المعتمد على الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات رفع Slack ويمكن أن تتضمن ردود سلاسل (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند ضبطه؛ وإلا فإن عمليات الإرسال عبر القناة تستخدم افتراضيات نوع MIME من مسار الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يتم فتح الرسائل المباشرة في Slack عبر واجهات Slack الخاصة بالمحادثات عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مضبوط أو كأوامر أصلية متعددة. اضبط `channels.slack.slashCommand` لتغيير افتراضيات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack لديك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطلًا** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط للوسيطات الأصلية استراتيجية عرض تكيفية تُظهر modal تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع تصفية خيارات غير متزامنة عند توفر معالجات خيارات interactivity
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وما تزال توجه تنفيذات الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية للردود التي أنشأها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

فعّلها عالميًا:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

أو فعّلها لحساب Slack واحد فقط:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

عند التفعيل، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُترجم هذه التوجيهات إلى Slack Block Kit وتُوجّه النقرات أو الاختيارات مرة أخرى عبر مسار حدث تفاعلات Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم رد النداء التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن لـ Slack أن يعمل كعميل موافقات أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec ‏`channels.slack.execApprovals.*` للتوجيه الأصلي للرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin تُحل عبر سطح أزرار Slack الأصلي نفسه عندما يكون الطلب قد وصل بالفعل إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال تفويض الموافقين مفروضًا: يمكن فقط للمستخدمين المحددين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه المستخدم في القنوات الأخرى. عندما تكون `interactivity` مفعلة في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة داخل المحادثة.
وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الموافقة الأساسية؛ ويجب على OpenClaw
ألا يتضمن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن
موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ ويعود إلى `commands.ownerAllowFrom` عند الإمكان)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`، `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو مساوية لـ `"auto"` وعندما يمكن حلّ معتمِد واحد على الأقل.
اضبط `enabled: false` لتعطيل Slack صراحةً كعميل موافقات أصلي.
واضبط `enabled: true` لفرض تفعيل الموافقات الأصلية عندما يمكن حلّ الموافقين.

السلوك الافتراضي من دون إعداد صريح لموافقات Slack Exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يكون إعداد Slack الأصلي الصريح مطلوبًا إلا عندما تريد تجاوز الموافقين، أو إضافة عوامل تصفية، أو
الاشتراك في التسليم إلى دردشة المصدر:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

يكون توجيه `approvals.exec` المشترك منفصلًا. استخدمه فقط عندما يجب أيضًا
توجيه مطالبات موافقة exec إلى دردشات أخرى أو إلى أهداف صريحة خارج النطاق. كما أن توجيه `approvals.plugin` المشترك
منفصل أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل هذه الطلبات بالفعل
إلى Slack.

كما أن `/approve` في الدردشة نفسها يعمل أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- يتم تعيين تعديلات/حذف الرسائل وبث سلاسل المحادثات إلى أحداث نظام.
- يتم تعيين أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- يتم تعيين أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيتات إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعدادات القنوات عندما تكون `configWrites` مفعلة.
- تُعامل بيانات تعريف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ سلسلة المحادثة وتهيئة سياق السجل الأولي للسلسلة بواسطة قوائم السماح المضبوطة للمرسلين عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات modal أحداث نظام منظمة بصيغة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أداة الاختيار، وبيانات تعريف `workflow_*`
  - أحداث modal من نوع `view_submission` و`view_closed` مع بيانات تعريف القناة الموجّهة ومدخلات النماذج

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode` و`botToken` و`appToken` و`signingSecret` و`webhookPath` و`accounts.*`
- وصول الرسائل المباشرة: `dm.enabled` و`dmPolicy` و`allowFrom` (الإرث: `dm.policy` و`dm.allowFrom`) و`dm.groupEnabled` و`dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ اتركه معطلًا ما لم تكن بحاجة إليه)
- وصول القنوات: `groupPolicy` و`channels.*` و`channels.*.users` و`channels.*.requireMention`
- السلاسل/السجل: `replyToMode` و`replyToModeByChatType` و`thread.*` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
- التسليم: `textChunkLimit` و`chunkMode` و`mediaMaxMb` و`streaming` و`streaming.nativeTransport` و`streaming.preview.toolProgress`
- التشغيل/الميزات: `configWrites` و`commands.native` و`slashCommand.*` و`actions.*` و`userToken` و`userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقّق، بالترتيب، من:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`)
    - `requireMention`
    - قائمة السماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="يتم تجاهل رسائل الرسائل المباشرة">
    تحقّق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو الإرث `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="عدم اتصال وضع Socket">
    تحقّق من صحة bot + app tokens وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مضبوط لكن وقت التشغيل الحالي لم يتمكن من حل القيمة
    المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="عدم استلام الأحداث في وضع HTTP">
    تحقّق من:

    - signing secret
    - مسار webhook
    - عناوين URL لطلبات Slack ‏(الأحداث + Interactivity + Slash Commands)
    - قيمة `webhookPath` فريدة لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مضبوط لكن وقت التشغيل الحالي لم يتمكن
    من حل signing secret المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقّق أيضًا من `commands.useAccessGroups` وقوائم سماح القناة/المستخدم.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقترن بمستخدم Slack مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديدات والتعزيز الأمني.
  </Card>
  <Card title="الإعدادات" icon="sliders" href="/ar/gateway/configuration">
    تخطيط الإعدادات والأولوية.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر والسلوك.
  </Card>
</CardGroup>
