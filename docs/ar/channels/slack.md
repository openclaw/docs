---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-25T13:42:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Slack وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات المشتركة بين القنوات وأدلة الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) أدناه ثم تابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

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

        الرجوع إلى متغيرات البيئة (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ gateway">

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
        - احفظ **Signing Secret** للتحقق من الطلب
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

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

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتصادم عمليات التسجيل.
        </Note>

      </Step>

      <Step title="ابدأ gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## قائمة التحقق من manifest والنطاقات

manifest الأساسي لتطبيق Slack هو نفسه لكلٍّ من Socket Mode وعناوين URL لطلبات HTTP. يختلف فقط الجزء `settings` (وكذلك `url` الخاص بأمر الشرطة المائلة).

manifest الأساسي (Socket Mode الافتراضي):

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

بالنسبة إلى **وضع عناوين URL لطلبات HTTP**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم عنوان URL عام:

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

تُظهر ميزات مختلفة توسّع الإعدادات الافتراضية المذكورة أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مضبوط، مع بعض الفروقات:

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
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
        استخدم قائمة `slash_commands` نفسها كما في Socket Mode أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

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
    أضف نطاق bot `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة emoji، فإن Slack يتوقع الصيغة `:emoji_name:`.
  </Accordion>
  <Accordion title="نطاقات user-token الاختيارية (عمليات القراءة)">
    إذا قمت بضبط `channels.slack.userToken`، فإن نطاقات القراءة النموذجية هي:

    - `channels:history`، و`groups:history`، و`im:history`، و`mpim:history`
    - `channels:read`، و`groups:read`، و`im:read`، و`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز المميزة

- يلزم `botToken` + `appToken` لـ Socket Mode.
- يتطلب وضع HTTP كلاً من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تتجاوز الرموز المميزة في الإعدادات الرجوع إلى متغيرات البيئة.
- ينطبق الرجوع إلى متغيرات البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- يكون `userToken` (`xoxp-...`) مضبوطًا عبر الإعدادات فقط (من دون رجوع إلى متغيرات البيئة)، ويكون افتراضيًا بسلوك للقراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل بيانات اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر أسرار غير مضمن آخر، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode، فالزوج
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل user token عند ضبطه. أما في عمليات الكتابة، فيظل bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة عبر user token إلا عندما تكون `userTokenReadOnly: false` وbot token غير متاح.
</Tip>

## الإجراءات والقيود

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في العناصر النائبة للملفات الواردة ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة (الإرث: `channels.slack.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.slack.allowFrom` القيمة `"*"`؛ الإرث: `channels.slack.dm.allowFrom`)
    - `disabled`

    رايات الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (إرث)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية تعدد الحسابات:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا يكون `allowFrom` الخاص بها مضبوطًا.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل المباشرة الأمر `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح الخاصة بالقنوات تحت `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات ثابتة.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد عبر البيئة فقط)، فإن وقت التشغيل يعود إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    تحليل الاسم/المعرّف:

    - تُحل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز المميز بذلك
    - تُحتفَظ بإدخالات أسماء القنوات غير المحلولة كما هي مضبوطة ولكن يتم تجاهلها في التوجيه افتراضيًا
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ ويتطلب التطابق المباشر مع اسم المستخدم/slug القيمة `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدمو القنوات">
    تكون رسائل القنوات مقيّدة بالإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة للتطبيق (`<@botId>`)
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، والرجوع الاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني داخل سلسلة الرسائل على bot (يُعطَّل عندما تكون `thread.requireExplicitMention` مساوية لـ `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر التحليل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`، `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: ‏`id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُطابِق `id:` فقط)

  </Tab>
</Tabs>

## سلاسل الرسائل والجلسات ووسوم الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تندمج الرسائل المباشرة في Slack في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تنشئ ردود السلاسل لاحقات جلسة للسلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون قيمته `true`، يتم منع الإشارات الضمنية في السلاسل بحيث لا يرد bot إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون bot قد شارك بالفعل في السلسلة. وبدون ذلك، تتجاوز الردود في سلسلة شارك فيها bot تقييد `requireMention`.

عناصر التحكم في ربط الردود بالسلاسل:

- `channels.slack.replyToMode`: ‏`off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- رجوع احتياطي قديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

الوسوم اليدوية للرد مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: تؤدي القيمة `replyToMode="off"` إلى تعطيل **كل** ربط الردود بالسلاسل في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. ويختلف هذا عن Telegram، حيث لا تزال الوسوم الصريحة محترمة في وضع `"off"` — إذ تخفي سلاسل Slack الرسائل من القناة بينما تظل ردود Telegram مرئية ضمنيًا داخل السطر.

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الرجوع الاحتياطي إلى emoji هوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

ملاحظات:

- يتوقع Slack shortcodes (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لذلك الحساب في Slack أو على مستوى عام.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات المعاينة المجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، يتم توجيه تحديثات الأدوات/التقدم إلى رسالة المعاينة نفسها بعد تحريرها (الافتراضي: `true`). اضبطها على `false` للإبقاء على رسائل الأدوات/التقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما تكون `channels.slack.streaming.mode` مساوية لـ `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة حتى يظهر بث النص الأصلي في Slack وحالة سلسلة مساعد Slack. ولا يزال اختيار السلسلة يتبع `replyToMode`.
- يمكن لجذور القنوات والدردشات الجماعية أن تستخدم معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تبقى الرسائل المباشرة العليا في Slack خارج السلسلة افتراضيًا، لذلك لا تُظهر معاينة بنمط السلسلة؛ استخدم ردود السلسلة أو `typingReaction` إذا أردت تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تؤدي النهائيات الخاصة بالوسائط/الأخطاء إلى إلغاء تعديلات المعاينة المعلقة؛ أما النهائيات النصية/الكتلية المؤهلة فلا تُفرَّغ إلا عندما يمكنها تحرير المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من بث النص الأصلي في Slack:

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

- تتم الترحيل التلقائي لـ `channels.slack.streamMode` (`replace | status_final | append`) إلى `channels.slack.streaming.mode`.
- تتم الترحيل التلقائي لـ `channels.slack.streaming` المنطقي إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- تتم الترحيل التلقائي لـ `channels.slack.nativeStreaming` القديم إلى `channels.slack.streaming.nativeTransport`.

## الرجوع الاحتياطي لتفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. وهذا مفيد أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا من نوع "is typing...".

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack shortcodes (مثل `"hourglass_flowing_sand"`).
- يكون التفاعل بأفضل جهد وتُجرى محاولة تنظيفه تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتجزئة والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (مسار طلبات مصادقة عبر الرمز المميز) وكتابتها إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم. تتضمن العناصر النائبة للملفات معرّف Slack `fileId` حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    يبلغ الحد الأقصى الافتراضي لحجم البيانات الواردة في وقت التشغيل `20MB` ما لم يتم تجاوزه عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم بحسب الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات Slack upload API ويمكن أن تتضمن ردودًا داخل السلسلة (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة قيمة `channels.slack.mediaMaxMb` عند ضبطها؛ وإلا فإن عمليات الإرسال عبر القناة تستخدم القيم الافتراضية حسب نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يتم فتح الرسائل المباشرة في Slack عبر واجهات Slack conversation API عند الإرسال إلى أهداف المستخدم.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مضبوط أو عدة أوامر أصلية. اضبط `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تمكينها عبر `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطّلًا** في Slack، لذلك فإن `commands.native: "auto"` لا يفعّل الأوامر الأصلية في Slack.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيفية تُظهر نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع ترشيح خيارات غير متزامن عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وما تزال توجه عمليات تنفيذ الأوامر إلى جلسة محادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم في الردود التفاعلية التي يكتبها الوكيل، لكن هذه الميزة معطّلة افتراضيًا.

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

عند التمكين، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم نداءات التفاعل هي رموز opaque ينشئها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المُنشأة ستتجاوز حدود Slack Block Kit، فإن OpenClaw يعود إلى الرد النصي الأصلي بدلًا من إرسال حمولة blocks غير صالحة.

## موافقات Exec في Slack

يمكن لـ Slack أن يعمل كعميل موافقة أصلي بأزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec الإعداد `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin تُحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال تفويض المعتمِد مطبقًا: لا يمكن إلا للمستخدمين المحددين على أنهم معتمدون الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا السطح نفسه المشترك لأزرار الموافقة كما في القنوات الأخرى. عندما يكون `interactivity` مفعّلًا في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة داخل المحادثة.
وعندما تكون هذه الأزرار موجودة، فإنها تكون واجهة تجربة الموافقة الأساسية؛ ويجب على OpenClaw
ألا يضمّن أمر `/approve` اليدوي إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`، `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويوجد
على الأقل معتمِد واحد تم تحليله. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
واضبط `enabled: true` لفرض تفعيل الموافقات الأصلية عندما يتم تحليل المعتمِدين.

السلوك الافتراضي من دون إعداد صريح لموافقات Exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم إعداد Slack-native صريح إلا عندما تريد تجاوز المعتمِدين، أو إضافة عوامل تصفية، أو
تفعيل التسليم إلى دردشة المصدر:

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
توجيه مطالبات موافقة exec إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما أن توجيه `approvals.plugin` المشترك
منفصل أيضًا؛ ولا تزال الأزرار الأصلية في Slack قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلًا
إلى Slack.

كما يعمل `/approve` داخل الدردشة نفسها في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُربط تعديلات/حذف الرسائل بأحداث نظام.
- تُعالج عمليات بث السلاسل ("Also send to channel" في ردود السلاسل) كرسائل مستخدم عادية.
- تُربط أحداث إضافة/إزالة التفاعلات بأحداث نظام.
- تُربط أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيتات بأحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعداد القناة عندما يكون `configWrites` مفعّلًا.
- تُعامل بيانات topic/purpose الخاصة بالقناة على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة والسياق الأولي لسجل السلسلة المزروع وفقًا لقوائم سماح المرسلين المهيأة عند الاقتضاء.
- تُصدر إجراءات الكتل وتفاعلات النوافذ المنبثقة أحداث نظام منظَّمة من النوع `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقيات، وبيانات `workflow_*`
  - أحداث النافذة المنبثقة `view_submission` و`view_closed` مع بيانات تعريف القناة الموجَّهة ومدخلات النموذج

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
- وصول الرسائل المباشرة: `dm.enabled`، `dmPolicy`، `allowFrom` (الإرث: `dm.policy`، `dm.allowFrom`) ،`dm.groupEnabled`، `dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (وضع كسر الزجاج؛ اتركه معطلًا ما لم تكن بحاجة إليه)
- وصول القناة: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`، `replyToModeByChatType`، `thread.*`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- التسليم: `textChunkLimit`، `chunkMode`، `mediaMaxMb`، `streaming`، `streaming.nativeTransport`، `streaming.preview.toolProgress`
- التشغيل/الميزات: `configWrites`، `commands.native`، `slashCommand.*`، `actions.*`، `userToken`، `userTokenReadOnly`

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
    - أحداث الرسائل المباشرة لـ Slack Assistant: تشير السجلات المطوّلة التي تذكر `drop message_changed`
      عادةً إلى أن Slack أرسل حدث سلسلة Assistant معدّلًا من دون
      مرسل بشري قابل للاسترجاع في بيانات تعريف الرسالة

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket لا يتصل">
    تحقّق من صحة bot وapp tokens ومن تفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مضبوط لكن وقت التشغيل الحالي لم يتمكن من تحليل القيمة
    المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقّق من:

    - signing secret
    - webhook path
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مضبوط لكن وقت التشغيل الحالي لم يتمكن
    من تحليل signing secret المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    وتحقّق أيضًا من `commands.useAccessGroups` وقوائم سماح القناة/المستخدم.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقتران مستخدم Slack مع gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="الإعدادات" icon="sliders" href="/ar/gateway/configuration">
    تخطيط الإعدادات والأولوية.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر والسلوك.
  </Card>
</CardGroup>
