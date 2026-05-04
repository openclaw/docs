---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو وضع Socket؛ كما تُدعم عناوين URL لطلبات HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Slack وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح عملية.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [مثال البيان](#manifest-and-scope-checklist) أدناه وتابع لإنشائه
        - أنشئ **رمزًا مميزًا على مستوى التطبيق** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **رمز Bot المميز** (`xoxb-...`) المعروض

      </Step>

      <Step title="Configure OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        الرجوع الاحتياطي إلى متغيرات البيئة (الحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [مثال البيان](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **سر التوقيع** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **رمز Bot المميز** (`xoxb-...`) المعروض

      </Step>

      <Step title="Configure OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        استخدم مسارات Webhook فريدة لحسابات HTTP المتعددة

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ضبط نقل وضع Socket

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا لوضع Socket. تجاوز إعدادات النقل فقط عندما تحتاج إلى ضبط خاص بمساحة العمل أو المضيف:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

استخدم هذا فقط لمساحات عمل وضع Socket التي تسجل مهل انتهاء websocket pong/server-ping في Slack أو تعمل على مضيفين لديهم استنزاف معروف لحلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK نبضة ping من العميل؛ و`serverPingTimeout` هو انتظار نبضات ping من خادم Slack. تبقى رسائل التطبيق والأحداث حالةً للتطبيق، وليست إشارات لحيوية النقل.

## قائمة تحقق البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه لوضع Socket وعناوين URL لطلبات HTTP. يختلف فقط مقطع `settings` (وعنوان `url` لأمر slash).

البيان الأساسي (وضع Socket الافتراضي):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

بالنسبة إلى **وضع عناوين URL لطلبات HTTP**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر slash. يلزم عنوان URL عام:

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
        "app_home_opened",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### إعدادات بيان إضافية

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

يمكّن البيان الافتراضي تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا آمنًا باستخدام `views.publish`؛ ولا تُضمّن أي حمولة محادثة أو إعدادات خاصة. يبقى تبويب **Messages** مفعّلًا للرسائل المباشرة في Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    يمكن استخدام عدة [أوامر slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مُهيّأ مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر slash في وقت واحد.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        استخدم قائمة `slash_commands` نفسها كما في وضع Socket أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

```json
{
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
  ]
}
```

        كرر قيمة `url` هذه في كل أمر في القائمة.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضِف نطاق البوت `chat:write.customize` إذا أردت أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة رمز تعبيري، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات رمز المستخدم الاختيارية (عمليات القراءة)">
    إذا ضبطت `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز

- `botToken` + `appToken` مطلوبان لوضع Socket Mode.
- يتطلب وضع HTTP وجود `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تتجاوز رموز التهيئة بديل env الاحتياطي.
- ينطبق بديل env الاحتياطي `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) مخصص للتهيئة فقط (لا يوجد بديل env احتياطي) ويستخدم سلوك القراءة فقط افتراضيًا (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- الحالة هي `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سري آخر غير مضمّن مباشرة، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. وبالنسبة إلى عمليات الكتابة، يظل رمز البوت هو المفضل؛ ولا تُسمح كتابات رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة      | الافتراضي |
| ---------- | ------- |
| الرسائل   | مفعّل |
| التفاعلات  | مفعّل |
| التثبيتات       | مفعّل |
| معلومات العضو | مفعّل |
| قائمة الرموز التعبيرية  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات وصفية لملفات محلية لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.slack.dmPolicy` في الوصول عبر الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح الرسمية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح اختيارية لـ MPIM)

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها معيّنة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا يزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك بدون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات تحت `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack الثابتة** (مثل `C12345678`) كمفاتيح تهيئة.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة السماح للقنوات وإدخالات قائمة السماح للرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تُترك إدخالات أسماء القنوات غير المحلولة كما ضُبطت، لكنها تُتجاهل للتوجيه افتراضيًا
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/المعرّف المختصر المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح المعتمدة على الاسم (`#channel-name` أو `channel-name`) تحت `groupPolicy: "allowlist"`. يكون البحث عن القناة معتمدًا على المعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح معتمد على الاسم في التوجيه أبدًا، وستُحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح المعتمد على الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

    صحيح:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    غير صحيح (محظور بصمت تحت `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    تكون رسائل القنوات مقيدة بالإشارة افتراضيا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضوا في مجموعة المستخدمين تلك؛ يتطلب `usergroups:read`
    - أنماط تعبيرات منتظمة للإشارة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على سلسلة البوت (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل البدء أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`، `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة ترتبط بـ `id:` فقط)

    `allowBots` محافظ في القنوات والقنوات الخاصة: لا تقبل رسائل الغرف المكتوبة بواسطة البوت إلا عندما يكون البوت المرسل مدرجا صراحة في قائمة سماح `users` لتلك الغرفة، أو عندما يكون معرف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوا حاليا في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بمتطلب وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يسقط OpenClaw رسالة الغرفة المكتوبة بواسطة البوت.

  </Tab>
</Tabs>

## السلاسل والجلسات ووسوم الرد

- يتم توجيه الرسائل الخاصة بوصفها `direct`؛ والقنوات بوصفها `channel`؛ وMPIMs بوصفها `group`.
- تقبل ارتباطات مسارات Slack معرفات النظير الخام إضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تدمج رسائل Slack الخاصة في جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسات سلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تكبح إشارات السلسلة الضمنية بحيث لا يستجيب البوت إلا لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون هذا، تتجاوز الردود في سلسلة شارك فيها البوت قيد `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- احتياطي قديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطل `replyToMode="off"` **كل** سلاسل الرد في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة، بينما تبقى ردود Telegram مرئية ضمن السطر.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- احتياطي رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزا قصيرة (على سبيل المثال `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميا.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث ناتج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأدوات/التقدم إلى رسالة المعاينة المحررة نفسها (الافتراضي: `true`). اضبطها على `false` للإبقاء على رسائل أدوات/تقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطها على `status` للإبقاء على أسطر تقدم الأدوات مدمجة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر التقدم المدمجة:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة حتى يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- لا يزال بإمكان جذور القنوات ومحادثات المجموعات والرسائل الخاصة على المستوى الأعلى استخدام معاينة المسودة العادية عندما لا يتوفر البث الأصلي أو لا توجد سلسلة رد.
- تبقى رسائل Slack الخاصة على المستوى الأعلى خارج السلسلة افتراضيا، لذلك لا تعرض معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ ينشر OpenClaw معاينة مسودة في الرسالة الخاصة ويحررها بدلا من ذلك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهايات النهائية للوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تدفق النهايات النهائية النصية/الكتلية المؤهلة إلا عندما يمكنها تحرير المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلا من بث النص الأصلي في Slack:

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

- يتم ترحيل `channels.slack.streamMode` (`replace | status_final | append`) تلقائيا إلى `channels.slack.streaming.mode`.
- يتم ترحيل `channels.slack.streaming` المنطقي تلقائيا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيا إلى `channels.slack.streaming.nativeTransport`.

## احتياطي تفاعل الكتابة

`typingReaction` يضيف تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا مفيدًا أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack الرموز القصيرة (مثل `"hourglass_flowing_sand"`).
- التفاعل مبني على أفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الوسائط، والتجزئة، والتسليم

<AccordionGroup>
  <Accordion title="Inbound attachments">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلب مصادق عليه بالرمز المميز) وكتابتها إلى مخزن الوسائط عند نجاح الجلب وسماح حدود الحجم بذلك. تتضمن عناصر نائبة الملفات `fileId` الخاص بـ Slack حتى يتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلًا محدودة للخمول والإجمالي. إذا توقف استرجاع ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى عنصر الملف النائب.

    يكون الحد الأقصى الافتراضي لحجم الوارد في وقت التشغيل `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم مع إعطاء الأولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للتحميل في Slack ويمكن أن تتضمن ردود السلاسل (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم إرسالات القناة الإعدادات الافتراضية لنوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="Delivery targets">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما تحميلات الملفات والإرسالات ذات السلاسل فتفتح الرسالة المباشرة عبر واجهات API لمحادثات Slack أولًا لأن هذه المسارات تتطلب معرّف محادثة ملموسًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو كعدة أوامر أصلية. كوّن `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأمر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack لديك ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **متوقفًا** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة خيار محدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع ترشيح غير متزامن للخيارات عند توفر معالجات خيارات التفاعل
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذات الأوامر إلى جلسة المحادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية في الردود التي ينشئها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

عند تفعيلها، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُترجم هذه التوجيهات إلى Slack Block Kit وتعيد توجيه النقرات أو الاختيارات عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة أزرارها الخاصة.
- قيم ردود الاتصال التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيمًا خامًا ينشئها الوكيل.
- إذا كانت الكتل التفاعلية المنشأة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات تنفيذ الأوامر في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي بأزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات تنفيذ الأوامر `channels.slack.execApprovals.*` لتوجيه الرسائل المباشرة/القنوات الأصلي.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- يظل تفويض الموافقين مفروضًا: وحدهم المستخدمون المعرّفون كموافقين يمكنهم الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون تجربة الموافقة الأساسية؛ ينبغي لـ OpenClaw
أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعدادات:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات تنفيذ الأوامر الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويتم حل
موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack صراحة كعميل موافقة أصلي.
اضبط `enabled: true` لفرض الموافقات الأصلية عند حل الموافقين.

السلوك الافتراضي دون إعداد صريح لموافقة تنفيذ أوامر Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا تكون الإعدادات الأصلية الخاصة بـ Slack مطلوبة إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
الاشتراك في التسليم إلى دردشة المنشأ:

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

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أيضًا
توجيه مطالبات موافقة تنفيذ الأوامر إلى دردشات أخرى أو أهداف صريحة خارج النطاق. إعادة توجيه `approvals.plugin` المشتركة
منفصلة أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل هذه الطلبات بالفعل
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات تنفيذ الأوامر](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- يتم تعيين تعديلات/حذف الرسائل إلى أحداث نظام.
- تتم معالجة بث السلاسل (ردود السلاسل "Also send to channel") كرسائل مستخدم عادية.
- يتم تعيين أحداث إضافة/إزالة التفاعل إلى أحداث نظام.
- يتم تعيين أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعدادات القناة عند تفعيل `configWrites`.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وبذر سياق سجل السلسلة الأولي بواسطة قوائم السماح المكوّنة للمرسلين عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات `workflow_*` الوصفية
  - أحداث النافذة `view_submission` و`view_closed` مع بيانات وصفية موجهة للقناة ومدخلات النموذج

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ أبقه متوقفًا ما لم يكن مطلوبًا)
- الوصول إلى القناة: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="No replies in channels">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القناة (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات القنوات** (`C12345678`)، وليس الأسماء (`#channel-name`). تفشل المفاتيح المعتمدة على الأسماء بصمت ضمن `groupPolicy: "allowlist"` لأن توجيه القناة يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — تكون قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث الرسائل المباشرة لمساعد Slack: السجلات التفصيلية التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة مساعد معدلًا دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    تحقق من رموز البوت + التطبيق وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا عرض `openclaw channels status --probe --json` الحالة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي لم يتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    تحقق مما إذا كنت تقصد:

    - وضع الأمر الأصلي (`channels.slack.commands.native: true`) مع أوامر الشرطة المائلة المطابقة المسجلة في Slack
    - أو وضع أمر شرطة مائلة واحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المنزلة بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم بذلك. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملف قابل للتنزيل بدلًا من معاملتها كإدخال صورة.

### أنواع الوسائط المدعومة

| نوع الوسائط                     | المصدر               | السلوك الحالي                                                                  | ملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack       | تُنزَّل وتُرفَق بالدور للمعالجة القادرة على الرؤية                   | حد لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 ميغابايت)                 |
| ملفات PDF                      | عنوان URL لملف Slack       | تُنزَّل وتُعرَض كسياق ملف لأدوات مثل `download-file` أو `pdf` | لا يحوّل وارد Slack ملفات PDF تلقائيًا إلى مُدخلات رؤية الصور |
| ملفات أخرى                    | عنوان URL لملف Slack       | تُنزَّل عند الإمكان وتُعرَض كسياق ملف                              | لا تُعامل الملفات الثنائية كمُدخلات صور                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن إغناء ملفات رسالة الجذر كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم بادئات الملفات فقط عنصرًا نائبًا للمرفق                          |
| رسائل متعددة الصور           | ملفات Slack متعددة | يُقيَّم كل ملف بشكل مستقل                                              | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                     |

### مسار الوارد

عند وصول رسالة Slack تتضمن مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزّلة وأنواع المحتوى إلى سياق الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تظل الملفات غير الصورية متاحة كبيانات تعريف ملف أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عند وصول رسالة في سلسلة (لها أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت رسالة الجذر المضمّنة تحتوي على ملفات، يمكن لـ Slack إغناء ملفات الجذر كسياق بادئ السلسلة.
- تأخذ مرفقات الرد المباشر أولوية على مرفقات رسالة الجذر.
- تُمثَّل رسالة الجذر التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق كي يظل بإمكان الاحتياط تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على مرفقات ملفات متعددة:

- يُعالَج كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمَّع مراجع الوسائط المنزّلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل أحد المرفقات بقية المرفقات.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 ميغابايت لكل ملف. قابل للتكوين عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: تُتخطى الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية، والملفات غير القابلة للوصول، والملفات التي تتجاوز الحجم، واستجابات HTML الخاصة بالمصادقة/تسجيل الدخول في Slack بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المكوَّن في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهٍ لملف Slack                 | يُتخطى الملف؛ لا يظهر خطأ                                                 | أعِد رفع الملف في Slack                                                |
| نموذج الرؤية غير مكوَّن            | تُخزَّن مرفقات الصور كمراجع وسائط، لكنها لا تُحلَّل كصور | كوّن `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية |
| صور كبيرة جدًا (> 20 ميغابايت افتراضيًا) | تُتخطى وفق حد الحجم                                                         | زد `channels.slack.mediaMaxMb` إذا سمح Slack بذلك                       |
| مرفقات مُعاد توجيهها/مشاركتها           | النص ووسائط الصور/الملفات المستضافة على Slack تُعالَج بأفضل جهد                       | أعِد مشاركتها مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزَّن كسياق ملف/وسائط، ولا تُوجَّه تلقائيًا عبر رؤية الصور  | استخدم `download-file` لبيانات تعريف الملف أو أداة `pdf` لتحليل PDF   |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- ملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    أقرِن مستخدم Slack بالـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك القناة والرسائل المباشرة الجماعية.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ar/gateway/configuration">
    تخطيط التكوين والأسبقية.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر وسلوكها.
  </Card>
</CardGroup>
