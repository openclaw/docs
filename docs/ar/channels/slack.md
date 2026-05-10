---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو وضع Socket؛ كما تُدعَم عناوين URL لطلبات HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح عملية.
  </Card>
</CardGroup>

## اختيار وضع Socket أو عناوين URL لطلبات HTTP

كلا وسيلتَي النقل جاهزتان للإنتاج وتبلغان تكافؤ الميزات للمراسلة، وأوامر الشرطة المائلة، وواجهة App Home، والتفاعل. اختر بناءً على شكل النشر، لا الميزات.

| موضع الاهتمام                | وضع Socket (الافتراضي)                                                                 | عناوين URL لطلبات HTTP                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL عام للـ Gateway    | غير مطلوب                                                                              | مطلوب (DNS، وTLS، ووكيل عكسي أو نفق)                                                                           |
| الشبكة الصادرة               | يجب أن يكون WSS الصادر إلى `wss-primary.slack.com` قابلًا للوصول                       | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                                |
| الرموز المطلوبة              | رمز Bot (`xoxb-...`) + رمز على مستوى التطبيق (`xapp-...`) مع `connections:write`       | رمز Bot (`xoxb-...`) + سر التوقيع                                                                              |
| حاسوب التطوير / خلف جدار ناري | يعمل كما هو                                                                            | يحتاج إلى نفق عام (ngrok، Cloudflare Tunnel، Tailscale Funnel) أو Gateway مرحلي                                |
| التوسّع الأفقي               | جلسة وضع Socket واحدة لكل تطبيق لكل مضيف؛ تحتاج Gateways المتعددة إلى تطبيقات Slack منفصلة | معالج POST عديم الحالة؛ يمكن لنسخ Gateway المتعددة مشاركة تطبيق واحد خلف موزّع أحمال                          |
| حسابات متعددة على Gateway واحد | مدعوم؛ يفتح كل حساب اتصال WS خاصًا به                                                  | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات               |
| نقل أمر الشرطة المائلة       | يُسلَّم عبر اتصال WS؛ يتم تجاهل `slash_commands[].url`                                  | يرسل Slack طلبات POST إلى `slash_commands[].url`؛ الحقل مطلوب كي يُرسَل الأمر                                  |
| توقيع الطلب                  | غير مستخدم (المصادقة هي الرمز على مستوى التطبيق)                                      | يوقّع Slack كل طلب؛ يتحقق OpenClaw باستخدام `signingSecret`                                                     |
| التعافي عند انقطاع الاتصال   | يعيد Slack SDK الاتصال تلقائيًا؛ يُطبَّق ضبط نقل مهلة pong الخاص بالـ Gateway           | لا يوجد اتصال دائم لينقطع؛ تكون إعادة المحاولة لكل طلب من Slack                                               |

<Note>
  **اختر وضع Socket** لمضيفي Gateway الفرديين، وحواسيب التطوير، والشبكات المحلية التي تستطيع الوصول إلى `*.slack.com` صادرًا لكنها لا تستطيع قبول HTTPS وارد.

**اختر عناوين URL لطلبات HTTP** عند تشغيل نسخ Gateway متعددة خلف موزّع أحمال، أو عندما يكون WSS الصادر محظورًا لكن HTTPS الوارد مسموحًا، أو عندما تكون قد أنهيت Webhook الخاصة بـ Slack مسبقًا عند وكيل عكسي.
</Note>

## إعداد سريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → اختر مساحة عملك → الصق أحد ملفات البيان أدناه → **Next** → **Create**.

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
          يطابق **Recommended** مجموعة الميزات الكاملة لـ Plugin Slack المضمّن: App Home، وأوامر الشرطة المائلة، والملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية، وقراءات الرموز التعبيرية/مجموعات المستخدمين. اختر **Minimal** عندما تقيّد سياسة مساحة العمل النطاقات — فهو يغطي الرسائل المباشرة، وسجل القنوات/المجموعات، والإشارات، وأوامر الشرطة المائلة، لكنه يستبعد الملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read`. راجع [قائمة التحقق للبيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبرر كل نطاق وخيارات الإضافة مثل أوامر الشرطة المائلة الإضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: أضف `connections:write`، واحفظ، وانسخ قيمة `xapp-...`.
        - **Install App → Install to Workspace**: انسخ رمز OAuth لمستخدم Bot بالقيمة `xoxb-...`.

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

        بديل env (للحساب الافتراضي فقط):

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
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → اختر مساحة عملك → الصق أحد ملفات البيان أدناه → استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام للـ Gateway لديك → **Next** → **Create**.

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
          يطابق **Recommended** مجموعة الميزات الكاملة الخاصة بـ Slack plugin المضمّن؛ أما **Minimal** فيزيل الملفات والتفاعلات والتثبيتات وDM الجماعي (`mpim:*`) و`emoji:read` و`usergroups:read` لمساحات العمل التقييدية. راجع [قائمة التحقق من البيان والنطاقات](#manifest-and-scope-checklist) للاطلاع على مبرر كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url` و`event_subscriptions.request_url` و`interactivity.request_url` / `message_menu_options_url`) كلها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط بيان Slack تسميتها بشكل منفصل، لكن OpenClaw يوجّه حسب نوع الحمولة، لذلك يكفي `webhookPath` واحد (الافتراضي `/slack/events`). أوامر Slash التي لا تحتوي على `slash_commands[].url` لن تنفّذ أي إجراء بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App Credentials**: انسخ **Signing Secret** للتحقق من الطلبات.
        - **Install App → Install to Workspace**: انسخ Bot User OAuth Token بصيغة `xoxb-...`.

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

## ضبط نقل Socket Mode

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة العمل أو بالمضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات انتهاء انتظار pong/websocket أو server-ping من Slack، أو التي تعمل على مضيفين لديهم تجويع معروف في حلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ و`serverPingTimeout` هو انتظار إشارات ping من خادم Slack. تظل رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات لحيوية النقل.

## قائمة التحقق من البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه في Socket Mode وHTTP Request URLs. يختلف فقط كتلة `settings` (و`url` الخاص بأمر Slash).

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

بالنسبة إلى **وضع HTTP Request URLs**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر Slash. يلزم URL عام:

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

اعرض ميزات مختلفة توسّع الافتراضيات أعلاه.

يمكّن البيان الافتراضي تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا وآمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو إعدادات خاصة. يظل تبويب **Messages** ممكّنًا لرسائل Slack DM.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    يمكن استخدام عدة [أوامر Slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مضبوط، مع بعض الفروق الدقيقة:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر Slash في وقت واحد.

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
        استخدم قائمة `slash_commands` نفسها كما في Socket Mode أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

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
    أضف نطاق البوت `chat:write.customize` إذا أردت أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلاً من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

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

- `botToken` + `appToken` مطلوبان من أجل Socket Mode.
- يتطلب وضع HTTP كلاً من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  عادية أو كائنات SecretRef.
- تتجاوز رموز الإعدادات بديل env الاحتياطي.
- ينطبق بديل env الاحتياطي `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) يكون في الإعدادات فقط (بلا بديل env احتياطي) ويكون افتراضياً بسلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل بيانات اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سر آخر غير مضمن، لكن مسار الأمر/التشغيل الحالي
  تعذر عليه حل القيمة الفعلية.
- في وضع HTTP، يُضمَّن `signingSecretStatus`؛ وفي Socket Mode يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما بالنسبة إلى الكتابة، فيبقى رمز البوت مفضلاً؛ ولا يُسمح بالكتابة عبر رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | ------- |
| messages   | مفعّل |
| reactions  | مفعّل |
| pins       | مفعّل |
| memberInfo | مفعّل |
| emojiList  | مفعّل |

تشمل إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات وصفية لملفات محلية لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح الرسمية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضياً false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تضبط `allowFrom` الخاصة بها.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا تزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمتان تُقرآن من أجل التوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك من دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات تحت `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack المستقرة** (مثلاً `C12345678`) كمفاتيح إعدادات.

    ملاحظة تشغيلية: إذا كان `channels.slack` مفقوداً بالكامل (إعداد env فقط)، يعود التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيراً (حتى إذا كان `channels.defaults.groupPolicy` مضبوطاً).

    حل الاسم/المعرّف:

    - تُحل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح الوصول إلى الرمز بذلك
    - تبقى إدخالات أسماء القنوات غير المحلولة كما ضُبطت ولكن تُتجاهل افتراضياً لأغراض التوجيه
    - تكون المصادقة الواردة وتوجيه القنوات بالمعرّف أولاً افتراضياً؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر مباشرةً `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح المستندة إلى الاسم (`#channel-name` أو `channel-name`) ضمن `groupPolicy: "allowlist"`. يكون البحث عن القناة بالمعرّف أولاً افتراضياً، لذلك لن ينجح مفتاح مستند إلى الاسم في التوجيه أبداً، وستُحظر جميع الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوباً للتوجيه ويبدو أن المفتاح المستند إلى الاسم يعمل.

    استخدم دائماً معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

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

  <Tab title="الإشارات ومستخدمي القنوات">
    تخضع رسائل القنوات افتراضياً لبوابة الإشارة.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضواً في تلك المجموعة؛ تتطلب `usergroups:read`
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، والبديل الاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة البوت (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - صيغة مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف بدل `"*"`
      (لا تزال المفاتيح القديمة بلا بادئة تُطابق `id:` فقط)

    `allowBots` محافظ بالنسبة إلى القنوات والقنوات الخاصة: لا تُقبل رسائل الغرفة المكتوبة بواسطة بوت إلا عندما يكون البوت المرسل مدرجاً صراحةً في قائمة سماح `users` الخاصة بتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضواً حالياً في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` من Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن الأعضاء، يُسقط OpenClaw رسالة الغرفة المكتوبة بواسطة بوت.

  </Tab>
</Tabs>

## سلاسل المحادثة والجلسات ووسوم الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIM كـ `group`.
- تقبل ارتباطات مسارات Slack معرّفات النظراء الخام بالإضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تُدمج رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القناة: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تنشئ ردود السلاسل لاحقات جلسة سلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- في القنوات التي يعالج فيها OpenClaw الرسائل ذات المستوى الأعلى من دون طلب إشارة صريحة، يوجه `replyToMode` غير `off` كل جذر مُعالَج إلى `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` لكي تُطابق سلسلة Slack المرئية جلسة OpenClaw واحدة منذ أول دور.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تكبت الإشارات الضمنية في السلسلة بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك مسبقاً في السلسلة. بدون ذلك، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- البديل الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

للردود الصريحة على سلاسل Slack من أداة `message`، اضبط `replyBroadcast: true` مع `action: "send"` و`threadId` أو `replyTo` لطلب أن يبث Slack أيضاً رد السلسلة إلى القناة الأصلية. يطابق هذا علم `reply_broadcast` في `chat.postMessage` من Slack، ولا يُدعم إلا لإرسالات النص أو Block Kit، وليس لعمليات رفع الوسائط.

عندما يعمل استدعاء أداة `message` داخل سلسلة Slack ويستهدف القناة نفسها، يرث OpenClaw عادةً سلسلة Slack الحالية وفقاً لـ `replyToMode`. اضبط `topLevel: true` على `action: "send"` أو `action: "upload-file"` لفرض رسالة جديدة في القناة الأصلية بدلاً من ذلك. يُقبل `threadId: null` كإلغاء اشتراك مكافئ على المستوى الأعلى.

<Note>
يعطّل `replyToMode="off"` **كل** تسلسل الردود في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث لا تزال الوسوم الصريحة محترمة في وضع `"off"`. تُخفي سلاسل Slack الرسائل من القناة، بينما تبقى ردود Telegram مرئية ضمنياً.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل emoji الاحتياطي لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack الرموز القصيرة (مثلاً `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالمياً.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث خرج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المحررة نفسها (الافتراضي: `true`). اضبطها على `false` للإبقاء على رسائل أداة/تقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطها على `status` للإبقاء على أسطر تقدم الأداة مضغوطة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر تقدم مضغوطة:

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
- لا يزال بإمكان جذور القناة ودردشة المجموعة والرسائل المباشرة ذات المستوى الأعلى استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا أو لا توجد سلسلة ردود.
- تبقى رسائل Slack المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذلك لا تعرض معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ بدلًا من ذلك، ينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويحررها.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي نهايات الوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ نهايات النص/الكتل المؤهلة إلا عندما يمكنها تحرير المعاينة في موضعها.
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

- `channels.slack.streamMode` (`replace | status_final | append`) هو اسم مستعار قديم في وقت التشغيل لـ `channels.slack.streaming.mode`.
- القيمة المنطقية `channels.slack.streaming` هي اسم مستعار قديم في وقت التشغيل لـ `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- المفتاح القديم `channels.slack.nativeStreaming` هو اسم مستعار في وقت التشغيل لـ `channels.slack.streaming.nativeTransport`.
- شغّل `openclaw doctor --fix` لإعادة كتابة إعداد بث Slack المحفوظ إلى المفاتيح القياسية.

## بديل تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw للرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا يقول "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا قصيرة (على سبيل المثال `"hourglass_flowing_sand"`).
- التفاعل مبذول بأفضل جهد، وتُحاول عملية التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="Inbound attachments">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلب مصادق عليه بالرمز المميز) وكتابتها إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك. تتضمن عناصر نائبة الملفات `fileId` الخاص بـ Slack حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلات خمول وإجمالية محدودة. إذا تعثر استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى العنصر النائب للملف.

    الحد الأقصى الافتراضي لحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم مع أولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للرفع في Slack ويمكن أن تتضمن ردود السلاسل (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات إرسال القناة الإعدادات الافتراضية لنوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="Delivery targets">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما عمليات رفع الملفات والإرسال ضمن السلاسل فتفتح الرسالة المباشرة أولًا عبر واجهات API لمحادثات Slack لأن هذه المسارات تتطلب معرّف محادثة محددًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو كأوامر أصلية متعددة. كوّن `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- وضع الأوامر الأصلية التلقائي **متوقف** لـ Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع تصفية خيارات غير متزامنة عندما تكون معالجات خيارات التفاعلية متاحة
- تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` ولا تزال توجه تنفيذات الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم ردود تفاعلية كتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

عند التمكين، يمكن للوكلاء إصدار توجيهات رد مقتصرة على Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو الاختيارات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تحوّل القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلي هي رموز معتمة يولّدها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا تجاوزت الكتل التفاعلية المولّدة حدود Slack Block Kit، يعود OpenClaw إلى رد النص الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات التنفيذ في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي بأزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات التنفيذ `channels.slack.execApprovals.*` للتوجيه الأصلي للرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على الحل عبر واجهة أزرار Slack الأصلية نفسها عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال تفويض المعتمدين مفروضًا: لا يستطيع الموافقة على الطلبات أو رفضها عبر Slack إلا المستخدمون المحددون كمعتمدين.

يستخدم هذا واجهة أزرار الموافقة المشتركة نفسها مثل القنوات الأخرى. عند تمكين `interactivity` في إعدادات تطبيق Slack، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
ألا يضمّن أمر `/approve` يدويًا إلا عندما تقول نتيجة الأداة إن موافقات الدردشة
غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يمكّن Slack موافقات التنفيذ الأصلية تلقائيًا عندما لا تكون `enabled` مضبوطة أو تكون `"auto"` ويتم حل
معتمِد واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحةً.
عيّن `enabled: true` لفرض تشغيل الموافقات الأصلية عند حل المعتمدين.

السلوك الافتراضي دون إعداد صريح لموافقة تنفيذ Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم إعداد Slack الأصلي الصريح إلا عندما تريد تجاوز المعتمدين، أو إضافة مرشحات، أو
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
توجيه مطالبات موافقة التنفيذ إلى دردشات أخرى أو أهداف صريحة خارج المسار. إعادة توجيه `approvals.plugin` المشتركة
منفصلة أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلًا
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر أصلًا. راجع [موافقات التنفيذ](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات الرسائل وحذفها إلى أحداث نظام.
- تُعالَج عمليات بث السلاسل (ردود السلاسل مع "إرسال إلى القناة أيضًا") كرسائل مستخدم عادية.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن أن يرحّل `channel_id_changed` مفاتيح إعداد القناة عند تمكين `configWrites`.
- تُعامل بيانات تعريف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وبذر سياق سجل السلسلة الأولي بحسب قوائم السماح للمرسلين المكوّنة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ النمطية أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات تعريف `workflow_*`
  - أحداث النوافذ النمطية `view_submission` و`view_closed` مع بيانات تعريف القناة الموجّهة ومدخلات النماذج

## مرجع الإعدادات

المرجع الرئيسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الدلالة">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ أبقه معطّلًا ما لم تكن هناك حاجة)
- الوصول إلى القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- المعاينات الموسعة: `unfurlLinks`, `unfurlMedia` للتحكم في معاينة الروابط/الوسائط في `chat.postMessage`
- التشغيل/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المعتمدة على الأسماء بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack → **نسخ الرابط** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تجاهل الرسائل المباشرة">
    تحقق:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث الرسائل المباشرة لمساعد Slack: السجلات المفصلة التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة مساعد معدّلًا دون مرسل بشري
      يمكن استعادته في بيانات تعريف الرسالة

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع المقابس لا يتصل">
    تحقق من رموز البوت والتطبيق ومن تفعيل وضع المقابس في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن، لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يتلقى الأحداث">
    تحقق من:

    - سرّ التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر Slash)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مهيأ، لكن وقت التشغيل الحالي لم يتمكن من
    حل سرّ التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر Slash لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر Slash مطابقة مسجلة في Slack
    - أو وضع أمر Slash واحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط التي تم تنزيلها بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم بذلك. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فيتم الاحتفاظ بها كسياق ملفات قابل للتنزيل بدلا من معاملتها كإدخال صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                    | المصدر              | السلوك الحالي                                                                    | ملاحظات                                                                  |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| صور JPEG / PNG / GIF / WebP    | عنوان URL لملف Slack | يتم تنزيلها وإرفاقها بالدورة للمعالجة القادرة على الرؤية                         | الحد لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)              |
| ملفات PDF                      | عنوان URL لملف Slack | يتم تنزيلها وعرضها كسياق ملف لأدوات مثل `download-file` أو `pdf`                 | لا يحول الإدخال الوارد من Slack ملفات PDF تلقائيا إلى إدخال رؤية صور    |
| ملفات أخرى                     | عنوان URL لملف Slack | يتم تنزيلها عند الإمكان وعرضها كسياق ملف                                         | لا تعامل الملفات الثنائية كإدخال صور                                    |
| ردود السلاسل                   | ملفات بادئ السلسلة  | يمكن إغناء ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة      | تستخدم البوادئ التي تحتوي على ملفات فقط عنصرا نائبًا للمرفق             |
| رسائل متعددة الصور             | ملفات Slack متعددة  | يتم تقييم كل ملف بشكل مستقل                                                      | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                           |

### مسار الإدخال الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. تتم كتابة الملف إلى مخزن الوسائط عند النجاح.
3. تتم إضافة مسارات الوسائط التي تم تنزيلها وأنواع المحتوى إلى سياق الإدخال الوارد.
4. يمكن لمسارات النموذج/الأداة القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تظل الملفات غير الصورية متاحة كبيانات تعريف للملفات أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### توريث مرفقات جذر السلسلة

عند وصول رسالة داخل سلسلة (تحتوي على أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذرية المضمنة تحتوي على ملفات، فيمكن لـ Slack إغناء الملفات الجذرية كسياق بادئ السلسلة.
- مرفقات الرد المباشر لها الأولوية على مرفقات الرسالة الجذرية.
- يتم تمثيل الرسالة الجذرية التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق حتى يتمكن الرجوع الاحتياطي من تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على مرفقات ملفات متعددة:

- تتم معالجة كل مرفق بشكل مستقل عبر مسار الوسائط.
- يتم تجميع مراجع الوسائط التي تم تنزيلها في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يؤدي فشل تنزيل مرفق واحد إلى حظر المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتكوين عبر `channels.slack.mediaMaxMb`.
- **فشل التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية، والملفات غير القابلة للوصول، والملفات الزائدة الحجم، واستجابات HTML للمصادقة/تسجيل الدخول في Slack، بدلا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### حدود معروفة

| السيناريو                              | السلوك الحالي                                                              | الحل البديل                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| عنوان URL منته لملف Slack              | يتم تخطي الملف؛ لا يظهر أي خطأ                                             | أعد رفع الملف في Slack                                                       |
| نموذج الرؤية غير مهيأ                  | تخزن مرفقات الصور كمراجع وسائط، لكنها لا تحلل كصور                        | هيئ `agents.defaults.imageModel` أو استخدم نموذج رد قادر على الرؤية          |
| صور كبيرة جدا (> 20 MB افتراضيا)       | يتم تخطيها وفقا لحد الحجم                                                  | زد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| المرفقات المعاد توجيهها/المشاركة       | النص والوسائط الصورية/الملفات المستضافة على Slack تتم بأفضل جهد           | أعد مشاركتها مباشرة في سلسلة OpenClaw                                        |
| مرفقات PDF                             | تخزن كسياق ملف/وسائط، ولا توجه تلقائيا عبر رؤية الصور                    | استخدم `download-file` لبيانات تعريف الملف أو أداة `pdf` لتحليل PDF         |

### وثائق ذات صلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Slack مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديدات والتحصين.
  </Card>
  <Card title="التكوين" icon="sliders" href="/ar/gateway/configuration">
    بنية التكوين والأسبقية.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
