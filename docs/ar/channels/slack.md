---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع المقبس + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج لرسائل DM والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو وضع Socket؛ كما تُدعَم عناوين URL لطلبات HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل DM في Slack وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وإجراءات إصلاح تشغيلية.
  </Card>
</CardGroup>

## اختيار وضع Socket أو عناوين URL لطلبات HTTP

كلا الناقلين جاهزان للإنتاج ويحققان تكافؤًا في الميزات للمراسلة، وأوامر الشرطة المائلة، وApp Home، والتفاعل. اختر بناءً على شكل النشر، لا الميزات.

| الاعتبار                   | وضع Socket (افتراضي)                                                                | عناوين URL لطلبات HTTP                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL عام لـ Gateway     | غير مطلوب                                                                           | مطلوب (DNS وTLS ووكيل عكسي أو نفق)                                                                              |
| الشبكة الصادرة               | يجب أن يكون WSS الصادر إلى `wss-primary.slack.com` قابلًا للوصول                    | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                                 |
| الرموز المطلوبة              | رمز البوت (`xoxb-...`) + رمز على مستوى التطبيق (`xapp-...`) مع `connections:write`  | رمز البوت (`xoxb-...`) + سر التوقيع                                                                              |
| حاسوب التطوير / خلف جدار حماية | يعمل كما هو                                                                         | يحتاج إلى نفق عام (ngrok أو Cloudflare Tunnel أو Tailscale Funnel) أو Gateway مرحلية                           |
| التوسع الأفقي                | جلسة وضع Socket واحدة لكل تطبيق لكل مضيف؛ تحتاج Gateways المتعددة إلى تطبيقات Slack منفصلة | معالج POST عديم الحالة؛ يمكن لنسخ Gateway المتعددة مشاركة تطبيق واحد خلف موزان حمل                            |
| حسابات متعددة على Gateway واحدة | مدعوم؛ يفتح كل حساب اتصال WS خاصًا به                                               | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (افتراضيًا `/slack/events`) حتى لا تتصادم التسجيلات                 |
| ناقل أمر الشرطة المائلة      | يُسلَّم عبر اتصال WS؛ يتم تجاهل `slash_commands[].url`                               | يرسل Slack طلب POST إلى `slash_commands[].url`؛ الحقل مطلوب لإرسال الأمر                                        |
| توقيع الطلبات                | غير مستخدم (المصادقة هي الرمز على مستوى التطبيق)                                    | يوقّع Slack كل طلب؛ يتحقق OpenClaw باستخدام `signingSecret`                                                     |
| الاسترداد عند انقطاع الاتصال | يعيد Slack SDK الاتصال تلقائيًا؛ تنطبق تهيئة نقل مهلة pong في Gateway               | لا يوجد اتصال دائم يمكن أن ينقطع؛ تتم إعادة المحاولات لكل طلب من Slack                                          |

<Note>
  **اختر وضع Socket** للمضيفات ذات Gateway واحدة، وحواسيب التطوير، والشبكات المحلية التي يمكنها الوصول إلى `*.slack.com` صادرًا لكنها لا تستطيع قبول HTTPS وارد.

**اختر عناوين URL لطلبات HTTP** عند تشغيل عدة نسخ Gateway خلف موزان حمل، أو عندما يكون WSS الصادر محظورًا بينما HTTPS الوارد مسموحًا، أو عندما تنهي Webhook الخاصة بـ Slack بالفعل عند وكيل عكسي.
</Note>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد ملفات البيان أدناه ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          يطابق **Recommended** مجموعة الميزات الكاملة لـ Plugin Slack المضمّن: App Home، وأوامر الشرطة المائلة، والملفات، والتفاعلات، والتثبيتات، ورسائل DM الجماعية، وقراءات الرموز التعبيرية/مجموعات المستخدمين. اختر **Minimal** عندما تقيّد سياسة مساحة العمل النطاقات؛ فهو يغطي رسائل DM، وسجل القنوات/المجموعات، والإشارات، وأوامر الشرطة المائلة، لكنه يستبعد الملفات، والتفاعلات، والتثبيتات، ورسائل DM الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read`. راجع [قائمة تحقق البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق والخيارات الإضافية مثل أوامر الشرطة المائلة الإضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: أضف `connections:write`، واحفظ، وانسخ قيمة `xapp-...`.
        - **Install App → Install to Workspace**: انسخ رمز OAuth لمستخدم البوت `xoxb-...`.

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

        الرجوع إلى متغيرات البيئة (الحساب الافتراضي فقط):

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
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد ملفات البيان أدناه ← استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام لـ Gateway لديك ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **موصى به** يطابق مجموعة الميزات الكاملة في Slack Plugin المضمن؛ أما **Minimal** فيحذف الملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read` لمساحات العمل المقيّدة. راجع [قائمة تحقق البيان والنطاق](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url`، و`event_subscriptions.request_url`، و`interactivity.request_url` / `message_menu_options_url`) كلها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط بيان Slack تسميتها بشكل منفصل، لكن OpenClaw يوجّه حسب نوع الحمولة، لذا يكفي `webhookPath` واحد (الافتراضي `/slack/events`). أوامر الشرطة المائلة التي لا تحتوي على `slash_commands[].url` لن تنفذ أي إجراء بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **المعلومات الأساسية → بيانات اعتماد التطبيق**: انسخ **سر التوقيع** للتحقق من الطلبات.
        - **تثبيت التطبيق → التثبيت في مساحة العمل**: انسخ رمز Bot User OAuth Token بصيغة `xoxb-...`.

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
        استخدم مسارات Webhook فريدة لوضع HTTP متعدد الحسابات

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

## ضبط نقل Socket Mode

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. تجاوز إعدادات النقل فقط عندما تحتاج إلى ضبط خاص بمساحة العمل أو بالمضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل انتهاء مهلة pong في WebSocket الخاص بـ Slack أو انتهاء مهلة server-ping، أو التي تعمل على مضيفين لديهم استنزاف معروف في حلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ أما `serverPingTimeout` فهو انتظار إشارات ping من خادم Slack. تظل رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات حيوية للنقل.

## قائمة تحقق البيان والنطاق

بيان تطبيق Slack الأساسي هو نفسه في Socket Mode وعناوين URL لطلبات HTTP. يختلف فقط كتلة `settings` (و`url` الخاص بأمر الشرطة المائلة).

البيان الأساسي (افتراضي Socket Mode):

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

بالنسبة إلى **وضع عناوين URL لطلبات HTTP**، استبدل `settings` بصيغة HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم توفر URL عام:

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

يفعّل البيان الافتراضي تبويب **Home** في صفحة Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا وآمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو إعدادات خاصة. يظل تبويب **Messages** مفعّلًا لرسائل Slack المباشرة.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مضبوط، مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

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
        استخدم قائمة `slash_commands` نفسها مثل Socket Mode أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

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
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة رمز تعبيري، يتوقع Slack صيغة `:emoji_name:`.

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
- رموز الإعداد تتجاوز بديل env الاحتياطي.
- ينطبق بديل env الاحتياطي `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالإعداد فقط (لا يوجد بديل env احتياطي) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken`، `appToken`، `signingSecret`، `userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- يعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سرّي آخر غير مضمن مباشرة، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode، فالزوج
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. بالنسبة إلى عمليات الكتابة، يبقى رمز البوت هو المفضل؛ ولا يُسمح بكتابات رمز المستخدم إلا عندما يكون `userTokenReadOnly: false` ورمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة      | الافتراضي |
| ---------- | ------- |
| messages   | مفعّل |
| reactions  | مفعّل |
| pins       | مفعّل |
| memberInfo | مفعّل |
| emojiList  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في وصول الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (افتراضيًا true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    ما زال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمان يُقرآن للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القناة">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات ضمن `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack الثابتة** (مثل `C12345678`) كمفاتيح إعداد.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تُحفظ إدخالات أسماء القنوات غير المحلولة كما ضُبطت، لكنها تُتجاهل للتوجيه افتراضيًا
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر مباشرةً `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    المفاتيح المستندة إلى الاسم (`#channel-name` أو `channel-name`) **لا** تطابق ضمن `groupPolicy: "allowlist"`. يكون البحث عن القناة معتمدًا على المعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح مستند إلى الاسم في التوجيه مطلقًا، وستُحظر جميع الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح المستند إلى الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **نسخ الرابط** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

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

    غير صحيح (محظور بصمت ضمن `groupPolicy: "allowlist"`):

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

  <Tab title="الإشارات ومستخدمو القناة">
    رسائل القنوات مقيدة بالإشارات افتراضيا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضوا في مجموعة المستخدمين تلك؛ تتطلب `usergroups:read`
    - أنماط التعبير النمطي للإشارات (`agents.list[].groupChat.mentionPatterns`، والبديل الاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على سلسلة رسائل البوت (يعطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:`, `e164:`, `username:`, `name:`، أو حرف البدل `"*"`
      (المفاتيح القديمة بلا بادئة لا تزال تطابق `id:` فقط)

    `allowBots` محافظ للقنوات والقنوات الخاصة: تقبل رسائل الغرف المكتوبة بواسطة بوت فقط عندما يكون البوت المرسل مدرجا صراحة في قائمة سماح `users` لتلك الغرفة، أو عندما يكون معرف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوا حاليا في الغرفة. لا تفي أحرف البدل ولا إدخالات المالك باسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يسقط OpenClaw رسالة الغرفة المكتوبة بواسطة البوت.

  </Tab>
</Tabs>

## سلاسل الرسائل والجلسات ووسوم الرد

- توجه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIM كـ `group`.
- تقبل ارتباطات مسارات Slack معرفات النظراء الخام إضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تطوى رسائل Slack المباشرة في جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود سلاسل الرسائل إنشاء لواحق جلسات سلاسل الرسائل (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل سلسلة الرسائل الموجودة التي يتم جلبها عندما تبدأ جلسة سلسلة رسائل جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، يكبت الإشارات الضمنية في سلاسل الرسائل بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل سلاسل الرسائل، حتى عندما يكون البوت قد شارك بالفعل في سلسلة الرسائل. من دون هذا، تتجاوز الردود في سلسلة رسائل شارك فيها البوت قيد `requireMention`.

عناصر التحكم في ربط الردود بسلاسل الرسائل:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- البديل الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطل `replyToMode="off"` **كل** ربط للردود بسلاسل الرسائل في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة معتمدة في وضع `"off"`. تخفي سلاسل رسائل Slack الرسائل من القناة بينما تظل ردود Telegram مرئية ضمن السياق.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الرمز التعبيري الاحتياطي لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزا مختصرة (مثلا `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو على مستوى عام.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث خرج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجه تحديثات الأداة/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه على `false` للإبقاء على رسائل الأداة/التقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطه على `status` للإبقاء على أسطر تقدم الأداة الموجزة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

إخفاء نص الأمر/التنفيذ الخام مع إبقاء أسطر التقدم الموجزة:

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

- يجب أن تكون سلسلة ردود متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- لا تزال جذور القنوات ومحادثات المجموعات والرسائل المباشرة ذات المستوى الأعلى قادرة على استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحا أو لا توجد سلسلة ردود.
- تظل رسائل Slack المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيا، لذلك لا تعرض معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ بدلا من ذلك ينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويعدلها.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهائيات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا ترسل نهائيات النص/الكتل المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
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

- يهاجر `channels.slack.streamMode` (`replace | status_final | append`) تلقائيا إلى `channels.slack.streaming.mode`.
- تهاجر قيمة `channels.slack.streaming` المنطقية تلقائيا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يهاجر `channels.slack.nativeStreaming` القديم تلقائيا إلى `channels.slack.streaming.nativeTransport`.

## بديل تفاعل الكتابة

`typingReaction` يضيف تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw الرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا مختصرة (على سبيل المثال `"hourglass_flowing_sand"`).
- التفاعل يتم وفق أفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL الخاصة المستضافة لدى Slack (تدفق طلبات مصادقة بالرمز المميز) وتُكتب إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم. تتضمن العناصر النائبة للملفات `fileId` الخاص بـ Slack بحيث يمكن للوكلاء جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلات خمول وإجمالية محدودة. إذا توقف استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى العنصر النائب للملف.

    الحد الأقصى الافتراضي لحجم الوارد أثناء وقت التشغيل هو `20MB` ما لم يتم تجاوزه عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يعطي الأولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات برمجة تطبيقات الرفع في Slack ويمكن أن تتضمن ردود السلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات الإرسال عبر القناة افتراضات نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما رفع الملفات والإرسال ضمن السلاسل فيفتحان الرسالة المباشرة أولًا عبر واجهات برمجة تطبيقات محادثات Slack لأن تلك المسارات تتطلب معرّف محادثة محددًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو عدة أوامر أصلية. كوّن `channels.slack.slashCommand` لتغيير افتراضات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- وضع الأمر الأصلي التلقائي **متوقف** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية استراتيجية عرض تكيفية تُظهر نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع تصفية خيارات غير متزامنة عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه عمليات تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم ردود تفاعلية يكتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

تُحوّل هذه التوجيهات إلى Slack Block Kit وتوجه النقرات أو التحديدات مرة أخرى عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلية هي رموز مبهمة يولدها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المُنشأة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات التنفيذ في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي باستخدام الأزرار والتفاعلات التفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات التنفيذ `channels.slack.execApprovals.*` لتوجيه الرسائل المباشرة/القنوات الأصلي.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- لا يزال فرض تفويض الموافقين قائمًا: يمكن فقط للمستخدمين المعرّفين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack الخاص بك، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عندما تكون هذه الأزرار موجودة، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير معيّنة أو `"auto"` ويتم حل
موافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحةً.
عيّن `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يتم حل الموافقين.

السلوك الافتراضي دون تكوين صريح لموافقة تنفيذ Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم التكوين الأصلي الصريح لـ Slack إلا عندما تريد تجاوز الموافقين أو إضافة عوامل تصفية أو
الاشتراك في تسليم دردشة المصدر:

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

توجيه `approvals.exec` المشترك منفصل. استخدمه فقط عندما يجب أيضًا
توجيه مطالبات موافقة التنفيذ إلى دردشات أخرى أو أهداف صريحة خارج النطاق. توجيه `approvals.plugin` المشترك منفصل أيضًا؛ لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل هذه الطلبات بالفعل
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات التنفيذ](/ar/tools/exec-approvals) للاطلاع على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- يتم تحويل تعديلات/حذف الرسائل إلى أحداث نظام.
- تُعالج بثوث السلاسل (ردود السلاسل "Also send to channel") كرسائل مستخدم عادية.
- يتم تحويل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- يتم تحويل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عند تفعيل `configWrites`.
- تُعامل بيانات تعريف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وبذر سياق سجل السلسلة الأولي حسب قوائم السماح للمرسلين المكوّنة عند الانطباق.
- تُصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات تعريف `workflow_*`
  - أحداث نافذة `view_submission` و`view_closed` مع بيانات تعريف القناة الموجهة ومدخلات النموذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الإشارة">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (كسر زجاج للطوارئ؛ أبقه متوقفًا ما لم تكن هناك حاجة)
- الوصول إلى القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة السماح للقنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح القائمة على الأسماء بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة السماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تم تجاهل رسائل الرسائل المباشرة">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث رسائل Slack Assistant المباشرة: السجلات التفصيلية التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة Assistant معدّلًا دون
      مرسل بشري قابل للاسترداد في بيانات تعريف الرسالة

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع المقبس لا يتصل">
    تحقق من رموز bot + app المميزة وتمكين Socket Mode في إعدادات تطبيق Slack.

    إذا عرض `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي لم يتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر شرطة مائلة مطابقة مسجلة في Slack
    - أو وضع أمر شرطة مائلة واحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط التي تم تنزيلها بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرةً إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملف قابل للتنزيل بدلًا من معاملتها كمدخل صورة.

### أنواع الوسائط المدعومة

| نوع الوسائط                   | المصدر                 | السلوك الحالي                                                                 | ملاحظات                                                                        |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack | تُنزَّل وتُرفق بالدورة لمعالجة تدعم الرؤية                                    | حدّ لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack | تُنزَّل وتُعرض كسياق ملف لأدوات مثل `download-file` أو `pdf` | الوارد من Slack لا يحوّل ملفات PDF تلقائيًا إلى مُدخلات رؤية صورية |
| ملفات أخرى                    | عنوان URL لملف Slack | تُنزَّل عند الإمكان وتُعرض كسياق ملف                              | لا تُعامل الملفات الثنائية كمُدخلات صور                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن تحميل ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم البوادئ التي تحتوي على ملفات فقط عنصرًا نائبًا للمرفق                          |
| رسائل متعددة الصور           | ملفات Slack متعددة | يُقيَّم كل ملف بشكل مستقل                                              | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                     |

### مسار الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المُنزَّلة وأنواع المحتوى إلى سياق الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على التعامل مع الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عند وصول رسالة ضمن سلسلة (تحتوي على أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذرية المضمّنة تحتوي على ملفات، يمكن لـ Slack تحميل ملفات الجذر كسياق لبادئ السلسلة.
- تكون لمرفقات الرد المباشرة أولوية على مرفقات الرسالة الجذرية.
- تُمثَّل الرسالة الجذرية التي تحتوي على ملفات فقط بلا نص بعنصر نائب للمرفق كي يظل بإمكان المسار الاحتياطي تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على مرفقات ملفات متعددة:

- يُعالج كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمَّع مراجع الوسائط المُنزَّلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل مرفق واحد معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنماذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للضبط عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: تُتخطى الملفات التي يتعذر على Slack تقديمها، وعناوين URL المنتهية، والملفات غير القابلة للوصول، والملفات المتجاوزة للحجم، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المُهيأ في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهي لملف Slack                 | يُتخطى الملف؛ لا يظهر خطأ                                                 | أعد تحميل الملف في Slack                                                |
| نموذج الرؤية غير مُهيأ            | تُخزَّن مرفقات الصور كمراجع وسائط، لكنها لا تُحلَّل كصور | هيّئ `agents.defaults.imageModel` أو استخدم نموذج رد يدعم الرؤية |
| صور كبيرة جدًا (> 20 MB افتراضيًا) | تُتخطى حسب حد الحجم                                                         | زِد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| المرفقات المُعاد توجيهها/المشتركة           | النص ووسائط الصور/الملفات المستضافة على Slack تعمل بأفضل جهد                       | أعد المشاركة مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزَّن كسياق ملف/وسائط، ولا تُمرَّر تلقائيًا عبر رؤية الصور  | استخدم `download-file` لبيانات الملف الوصفية أو أداة `pdf` لتحليل PDF   |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- ملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Slack بـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ar/gateway/configuration">
    تخطيط الإعدادات والأسبقية.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر وسلوكها.
  </Card>
</CardGroup>
