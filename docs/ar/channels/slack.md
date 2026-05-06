---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع المقابس + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ وتُدعَم أيضاً HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Slack وضع الاقتران افتراضياً.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات ودلائل إجراءات الإصلاح.
  </Card>
</CardGroup>

## اختيار Socket Mode أو HTTP Request URLs

كلتا وسيلتي النقل جاهزتان للإنتاج وتحققان تكافؤ الميزات في المراسلة، وأوامر الشرطة المائلة، وApp Home، والتفاعلية. اختر بناءً على شكل النشر، لا الميزات.

| الاعتبار                     | Socket Mode (افتراضي)                                                               | HTTP Request URLs                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL عام لـ Gateway     | غير مطلوب                                                                            | مطلوب (DNS وTLS ووكيل عكسي أو نفق)                                                                            |
| الشبكة الصادرة               | يجب أن يكون WSS الصادر إلى `wss-primary.slack.com` قابلاً للوصول                     | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                               |
| الرموز المطلوبة              | رمز البوت (`xoxb-...`) + App-Level Token (`xapp-...`) مع `connections:write`         | رمز البوت (`xoxb-...`) + سر التوقيع                                                                           |
| حاسوب التطوير المحمول / خلف جدار حماية | يعمل كما هو                                                                          | يحتاج إلى نفق عام (ngrok، Cloudflare Tunnel، Tailscale Funnel) أو Gateway مرحلية                              |
| التوسع الأفقي                | جلسة Socket Mode واحدة لكل تطبيق لكل مضيف؛ تحتاج عدة مثيلات Gateway إلى تطبيقات Slack منفصلة | معالج POST عديم الحالة؛ يمكن لعدة نسخ متماثلة من Gateway مشاركة تطبيق واحد خلف موزع حمل                       |
| حسابات متعددة على Gateway واحد | مدعوم؛ يفتح كل حساب اتصال WS خاصاً به                                                | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (الافتراضي `/slack/events`) كي لا تتصادم التسجيلات                 |
| نقل أوامر الشرطة المائلة     | تُسلَّم عبر اتصال WS؛ يتم تجاهل `slash_commands[].url`                               | يرسل Slack طلبات POST إلى `slash_commands[].url`؛ الحقل مطلوب لكي يُرسَل الأمر                                |
| توقيع الطلبات                | غير مستخدم (المصادقة هي App-Level Token)                                             | يوقّع Slack كل طلب؛ يتحقق OpenClaw باستخدام `signingSecret`                                                   |
| التعافي عند انقطاع الاتصال   | يعيد Slack SDK الاتصال تلقائياً؛ تنطبق إعدادات ضبط نقل مهلة pong في Gateway          | لا يوجد اتصال دائم يمكن أن ينقطع؛ تكون إعادة المحاولة لكل طلب من Slack                                        |

<Note>
  **اختر Socket Mode** لمضيفي Gateway المفرد، وحواسيب التطوير المحمولة، والشبكات المحلية التي يمكنها الوصول إلى `*.slack.com` صادراً لكنها لا تستطيع قبول HTTPS وارد.

**اختر HTTP Request URLs** عند تشغيل عدة نسخ متماثلة من Gateway خلف موزع حمل، أو عندما يكون WSS الصادر محظوراً لكن HTTPS الوارد مسموحاً، أو عندما تنهي بالفعل طلبات Webhook من Slack عند وكيل عكسي.
</Note>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (افتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **إنشاء تطبيق جديد** ← **من ملف بيان** ← اختر مساحة عملك ← الصق أحد ملفات البيان أدناه ← **التالي** ← **إنشاء**.

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
          **الموصى به** يطابق مجموعة الميزات الكاملة لـ Plugin Slack المضمّن: App Home، وأوامر الشرطة المائلة، والملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية، وقراءة الرموز التعبيرية/مجموعات المستخدمين. اختر **الحد الأدنى** عندما تقيّد سياسة مساحة العمل النطاقات — فهو يغطي الرسائل المباشرة، وسجل القنوات/المجموعات، والإشارات، وأوامر الشرطة المائلة، لكنه لا يتضمن الملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read`. راجع [قائمة تحقق البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق وخيارات الإضافة مثل أوامر الشرطة المائلة الإضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **المعلومات الأساسية ← الرموز على مستوى التطبيق ← إنشاء رمز ونطاقات**: أضف `connections:write`، واحفظ، وانسخ قيمة `xapp-...`.
        - **تثبيت التطبيق ← التثبيت في مساحة العمل**: انسخ رمز OAuth لمستخدم البوت `xoxb-...`.

      </Step>

      <Step title="تكوين OpenClaw">

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

        الرجوع الاحتياطي عبر متغيرات البيئة (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **إنشاء تطبيق جديد** ← **من ملف بيان** ← اختر مساحة عملك ← الصق أحد ملفات البيان أدناه ← استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام لـ Gateway لديك ← **التالي** ← **إنشاء**.

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
          يطابق **Recommended** مجموعة الميزات الكاملة في Slack Plugin المضمّن؛ ويحذف **Minimal** الملفات والتفاعلات والتثبيتات والرسائل المباشرة الجماعية (`mpim:*`) و`emoji:read` و`usergroups:read` لمساحات العمل المقيّدة. راجع [قائمة التحقق من البيان والنطاق](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url` و`event_subscriptions.request_url` و`interactivity.request_url` / `message_menu_options_url`) كلها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط بيان Slack تسميتها بشكل منفصل، لكن OpenClaw يوجّه حسب نوع الحمولة، لذا يكفي `webhookPath` واحد (الافتراضي `/slack/events`). أوامر Slash التي لا تحتوي على `slash_commands[].url` لن تفعل شيئًا بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App Credentials**: انسخ **Signing Secret** للتحقق من الطلبات.
        - **Install App → Install to Workspace**: انسخ رمز Bot User OAuth Token بصيغة `xoxb-...`.

      </Step>

      <Step title="تكوين OpenClaw">

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

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ضبط نقل وضع Socket Mode

يضبط OpenClaw مهلة pong لعميل Slack SDK على 15 ثانية افتراضيًا في وضع Socket Mode. لا تتجاوز إعدادات النقل إلا عند الحاجة إلى ضبط خاص بمساحة العمل أو بالمضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات Slack websocket pong/server-ping أو تعمل على مضيفين لديهم جوع معروف في حلقة الأحداث. `clientPingTimeout` هي مدة انتظار pong بعد أن يرسل SDK اختبار ping من العميل؛ و`serverPingTimeout` هي مدة انتظار اختبارات ping من خادم Slack. تظل رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات حياة للنقل.

## قائمة التحقق من البيان والنطاق

بيان تطبيق Slack الأساسي هو نفسه في Socket Mode وعناوين HTTP Request URLs. يختلف فقط قالب `settings` (وعنوان `url` الخاص بأمر Slash).

البيان الأساسي (الافتراضي في Socket Mode):

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

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

يمكّن البيان الافتراضي تبويب Slack App Home **Home** ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا آمنًا باستخدام `views.publish`؛ ولا تُضمّن أي حمولة محادثة أو إعدادات خاصة. يظل تبويب **Messages** ممكّنًا لرسائل Slack المباشرة.

<AccordionGroup>
  <Accordion title="أوامر Slash أصلية اختيارية">

    يمكن استخدام عدة [أوامر Slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوّن، مع بعض التفصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر Slash في وقت واحد.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (الافتراضي)">

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
  <Accordion title="Optional authorship scopes (write operations)">
    أضِف نطاق الروبوت `chat:write.customize` إذا أردت أن تستخدم الرسائل الصادرة هوية الوكيل النشطة (اسم مستخدم وأيقونة مخصصين) بدلاً من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة رموز تعبيرية، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    إذا ضبطت `channels.slack.userToken`، فالنطاقات المعتادة للقراءة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرمز

- `botToken` + `appToken` مطلوبان من أجل Socket Mode.
- يتطلب وضع HTTP وجود `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تتجاوز رموز الإعدادات بديل env الاحتياطي.
- ينطبق بديل env الاحتياطي `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالإعدادات فقط (لا يوجد بديل env احتياطي) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سرّي آخر غير مضمن مباشرة، لكن مسار الأمر/وقت التشغيل الحالي
  تعذر عليه حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة للإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما للكتابة، فيظل رمز الروبوت هو المفضل؛ ولا يُسمح بكتابات رمز المستخدم إلا عندما يكون `userTokenReadOnly: false` ورمز الروبوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة      | الافتراضي |
| ---------- | ------- |
| الرسائل   | مفعّل |
| التفاعلات  | مفعّل |
| الدبابيس       | مفعّل |
| معلومات العضو | مفعّل |
| قائمة الرموز التعبيرية  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack الظاهرة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.slack.dmPolicy` في الوصول عبر الرسائل المباشرة. تُعد `channels.slack.allowFrom` قائمة السماح الرسمية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الافتراضي للرسائل المباشرة الجماعية false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    ما زال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack المستقرة** (مثل `C12345678`) كمفاتيح إعدادات.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا تمامًا (إعداد يعتمد على env فقط)، يرجع وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    حل الاسم/المعرّف:

    - تُحل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تُحفظ إدخالات أسماء القنوات غير المحلولة كما ضُبطت، لكنها تُتجاهل للتوجيه افتراضيًا
    - يكون التفويض الوارد وتوجيه القنوات قائمين على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    المفاتيح القائمة على الاسم (`#channel-name` أو `channel-name`) **لا** تطابق ضمن `groupPolicy: "allowlist"`. فالبحث عن القناة قائم على المعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح قائم على الاسم في التوجيه أبدًا، وستُحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح القائم على الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack → **نسخ الرابط** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

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

    غير صحيح (يُحظر بصمت ضمن `groupPolicy: "allowlist"`):

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
    رسائل القنوات مقيدة بالإشارات افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم الروبوت عضوًا في تلك المجموعة؛ تتطلب `usergroups:read`
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة الروبوت (يُعطّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - صيغة مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (ما زالت المفاتيح القديمة غير المسبوقة تُعيّن إلى `id:` فقط)

    `allowBots` محافظ للقنوات والقنوات الخاصة: لا تُقبل رسائل الغرف المنشأة بواسطة روبوت إلا عندما يكون الروبوت المرسل مدرجًا صراحةً في قائمة سماح `users` لتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوًا حاليًا في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق يملك نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل بحث الأعضاء، يُسقط OpenClaw رسالة الغرفة المنشأة بواسطة الروبوت.

  </Tab>
</Tabs>

## السلاسل، والجلسات، ووسوم الرد

- تُوجّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل روابط توجيه Slack معرّفات الأقران الخام، إضافةً إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تُطوى رسائل Slack المباشرة إلى جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لاحقات جلسات سلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- الافتراضي لـ `channels.slack.thread.historyScope` هو `thread`؛ والافتراضي لـ `thread.inheritParent` هو `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تكبح الإشارات الضمنية في السلاسل بحيث لا يستجيب الروبوت إلا لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون الروبوت قد شارك بالفعل في السلسلة. من دون هذا، تتجاوز الردود في سلسلة شارك فيها الروبوت بوابة `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- الاحتياطي القديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطّل `replyToMode="off"` **كل** سلاسل الرد في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة، بينما تبقى ردود Telegram مرئية ضمن السطر.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل الرموز التعبيرية لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميًا.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، يوجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المحررة نفسها (الافتراضي: `true`). اضبطه على `false` لإبقاء رسائل الأداة/التقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطه على `status` للإبقاء على أسطر تقدم الأدوات مضغوطة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

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

- يجب أن تكون سلسلة رد متاحة كي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. ما زال اختيار السلسلة يتبع `replyToMode`.
- لا يزال بإمكان القنوات ودردشات المجموعات وجذور الرسائل المباشرة العليا استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا أو لا توجد سلسلة رد.
- تبقى رسائل Slack المباشرة العليا خارج السلاسل افتراضيًا، لذلك لا تُظهر معاينة البث/الحالة الأصلية بأسلوب سلاسل Slack؛ ينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويحررها بدلًا من ذلك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهائيات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ نهائيات النص/الكتل المؤهلة إلا عندما تستطيع تحرير المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدام معاينة المسودة بدلًا من بث النص الأصلي في Slack:

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
- القيمة المنطقية `channels.slack.streaming` هي اسم مستعار قديم في وقت التشغيل لـ `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` القديم هو اسم مستعار في وقت التشغيل لـ `channels.slack.streaming.nativeTransport`.
- شغّل `openclaw doctor --fix` لإعادة كتابة إعدادات بث Slack المحفوظة إلى المفاتيح القياسية.

## الرجوع الاحتياطي لتفاعل الكتابة

يضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء معالجة OpenClaw للرد، ثم يزيله عند انتهاء التشغيل. يكون هذا مفيداً أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضي "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزاً قصيرة (على سبيل المثال `"hourglass_flowing_sand"`).
- التفاعل يبذل أفضل جهد، وتتم محاولة التنظيف تلقائياً بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتجزئة والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلب موثّق برمز) وتُكتب إلى مخزن الوسائط عند نجاح الجلب وسماح حدود الحجم بذلك. تتضمن عناصر نائبة للملفات `fileId` الخاص بـ Slack حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهل خمول وإجمالية محدودة. إذا توقف استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويرجع إلى عنصر الملف النائب.

    يكون الحد الأقصى لحجم الوارد في وقت التشغيل افتراضياً `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يفضل الفقرات أولاً
    - تستخدم عمليات إرسال الملفات واجهات برمجة تطبيقات الرفع في Slack ويمكن أن تتضمن ردود سلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند ضبطه؛ وإلا تستخدم عمليات الإرسال عبر القناة افتراضات نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما رفع الملفات والإرسال ضمن السلاسل فيفتحان الرسالة المباشرة عبر واجهات برمجة تطبيقات محادثات Slack أولاً لأن هذه المسارات تتطلب معرّف محادثة محدداً.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك slash

تظهر أوامر slash في Slack إما كأمر واحد مضبوط أو عدة أوامر أصلية. اضبط `channels.slack.slashCommand` لتغيير افتراضات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلاً من ذلك.

- الوضع التلقائي للأوامر الأصلية **متوقف** لـ Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع ترشيح خيارات غير متزامن عند توفر معالجات خيارات التفاعل
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات slash مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذات الأوامر إلى جلسة المحادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية للردود التي ينشئها الوكلاء، لكن هذه الميزة معطلة افتراضياً.

فعّلها عالمياً:

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

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجه النقرات أو الاختيارات مرة أخرى عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيماً خاماً كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يرجع OpenClaw إلى الرد النصي الأصلي بدلاً من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي باستخدام أزرار وتفاعلات تفاعلية، بدلاً من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec‏ `channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح أزرار Slack الأصلي نفسه عندما يصل الطلب أصلاً إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- لا يزال تفويض الموافق مطبقاً: يمكن للمستخدمين المعرّفين كموافقين فقط الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ يجب على OpenClaw
تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعدادات:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يرجع إلى `commands.ownerAllowFrom` عند الإمكان)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائياً عندما تكون `enabled` غير مضبوطة أو `"auto"` ويتم حل موافق واحد على الأقل.
اضبط `enabled: false` لتعطيل Slack صراحةً كعميل موافقة أصلي.
اضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عند حل الموافقين.

السلوك الافتراضي دون إعداد صريح لموافقة Exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا تكون إعدادات Slack الأصلية الصريحة مطلوبة إلا عندما تريد تجاوز الموافقين أو إضافة عوامل تصفية أو
الاشتراك في التسليم إلى الدردشة الأصلية:

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

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أيضاً توجيه مطالبات موافقة Exec
إلى دردشات أخرى أو أهداف صريحة خارج المسار. إعادة توجيه `approvals.plugin` المشتركة منفصلة أيضاً؛
لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلاً
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضاً في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوّل تعديلات/حذف الرسائل إلى أحداث نظام.
- تتم معالجة بث السلاسل ("Also send to channel" ردود السلاسل) كرسائل مستخدم عادية.
- تُحوّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعدادات القنوات عند تفعيل `configWrites`.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وبذر سياق تاريخ السلسلة الأولي وفق قوائم السماح للمرسلين المضبوطة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات `workflow_*` الوصفية
  - أحداث نافذة `view_submission` و `view_closed` مع بيانات وصفية للقناة الموجهة ومدخلات النماذج

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الإشارة">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (كسر الزجاج؛ أبقه متوقفاً ما لم تكن هناك حاجة)
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
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المبنية على الأسماء بصمت ضمن `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولاً افتراضياً. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="يتم تجاهل رسائل الرسائل المباشرة">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو `channels.slack.dm.policy` القديم)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث رسائل Slack Assistant المباشرة: السجلات المفصلة التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة Assistant معدلاً دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket غير متصل">
    تحقق من رموز البوت + التطبيق وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مضبوط لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يتلقى الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعل + أوامر Slash)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مضبوط لكن وقت التشغيل الحالي لم يتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/slash لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر slash مطابقة مسجلة في Slack
    - أو وضع أمر slash واحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضاً من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط التي تم تنزيلها بدور الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم بذلك. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملفات قابل للتنزيل بدلا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                    | المصدر               | السلوك الحالي                                                                     | ملاحظات                                                                    |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack | تُنزّل وتُرفق بالدور للمعالجة القادرة على الرؤية                                  | الحد الأقصى لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)         |
| ملفات PDF                      | عنوان URL لملف Slack | تُنزّل وتُعرض كسياق ملف لأدوات مثل `download-file` أو `pdf`                       | الإدخال الوارد من Slack لا يحوّل ملفات PDF إلى مدخلات رؤية صورية تلقائيا |
| ملفات أخرى                    | عنوان URL لملف Slack | تُنزّل عندما يكون ذلك ممكنا وتُعرض كسياق ملف                                      | لا تُعامل الملفات الثنائية كمدخلات صور                                     |
| ردود السلاسل                  | ملفات بادئ السلسلة  | يمكن ترطيب ملفات الرسالة الجذر كسياق عندما لا يحتوي الرد على وسائط مباشرة        | تستخدم بادئات الملفات فقط عنصرا نائبا للمرفق                               |
| رسائل متعددة الصور            | عدة ملفات من Slack   | يُقيّم كل ملف على نحو مستقل                                                       | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                              |

### مسار الإدخال الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان Slack الخاص باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط التي تم تنزيلها وأنواع المحتوى إلى سياق الإدخال الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تظل الملفات غير الصورية متاحة كبيانات تعريفية للملفات أو مراجع وسائط للأدوات التي تستطيع التعامل معها.

### توريث مرفقات جذر السلسلة

عند وصول رسالة داخل سلسلة (لديها أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذر المضمّنة تحتوي على ملفات، يمكن لـ Slack ترطيب ملفات الجذر كسياق بادئ للسلسلة.
- مرفقات الرد المباشرة لها الأولوية على مرفقات الرسالة الجذر.
- تُمثل الرسالة الجذر التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق حتى يتمكن مسار الرجوع من تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يُعالج كل مرفق على نحو مستقل عبر مسار الوسائط.
- تُجمع مراجع الوسائط التي تم تنزيلها في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل مرفق واحد تنزيل المرفقات الأخرى.

### حدود الحجم والتنزيل والنماذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: تُتخطى الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية الصلاحية، والملفات غير القابلة للوصول، والملفات الأكبر من الحد، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack بدلا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### حدود معروفة

| السيناريو                              | السلوك الحالي                                                                 | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهي الصلاحية لملف Slack   | يُتخطى الملف؛ لا يظهر خطأ                                                     | أعد رفع الملف في Slack                                                     |
| نموذج الرؤية غير مهيأ                 | تُخزن مرفقات الصور كمراجع وسائط، لكنها لا تُحلل كصور                         | هيئ `agents.defaults.imageModel` أو استخدم نموذج رد قادر على الرؤية        |
| صور كبيرة جدا (> 20 MB افتراضيا)      | تُتخطى وفق حد الحجم                                                           | زد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                     |
| المرفقات المعاد توجيهها/المشتركة      | النص والوسائط الصورية/الملفات المستضافة على Slack تُعامل بأفضل جهد           | أعد المشاركة مباشرة في سلسلة OpenClaw                                      |
| مرفقات PDF                            | تُخزن كسياق ملف/وسائط، ولا تُوجّه تلقائيا عبر رؤية الصور                    | استخدم `download-file` للبيانات التعريفية للملف أو أداة `pdf` لتحليل PDF  |

### وثائق ذات صلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- ملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق الحي: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Slack بالـ Gateway.
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
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
