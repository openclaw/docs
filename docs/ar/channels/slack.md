---
read_when:
    - إعداد Slack أو استكشاف أخطاء وضع المقبس/HTTP في Slack وإصلاحها
summary: إعداد Slack وسلوك وقت التشغيل (وضع المقبس + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما تُدعَم عناوين URL لطلبات HTTP.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    الرسائل المباشرة في Slack تستخدم وضع الإقران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات ودلائل إصلاح.
  </Card>
</CardGroup>

## اختيار Socket Mode أو عناوين URL لطلبات HTTP

كلا وسيلتي النقل جاهزتان للإنتاج وتحققان تكافؤًا في الميزات للمراسلة، وأوامر الشرطة المائلة، وApp Home، والتفاعل. اختر بناءً على شكل النشر، وليس الميزات.

| الاعتبار                    | Socket Mode (الافتراضي)                                                              | عناوين URL لطلبات HTTP                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL عام لـ Gateway     | غير مطلوب                                                                            | مطلوب (DNS، TLS، وكيل عكسي أو نفق)                                                                             |
| الشبكة الصادرة               | يجب أن يكون WSS الصادر إلى `wss-primary.slack.com` قابلًا للوصول                     | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                                |
| الرموز المطلوبة              | رمز البوت (`xoxb-...`) + رمز على مستوى التطبيق (`xapp-...`) مع `connections:write`   | رمز البوت (`xoxb-...`) + سر التوقيع                                                                            |
| حاسوب التطوير / خلف جدار ناري | يعمل كما هو                                                                          | يحتاج إلى نفق عام (ngrok، Cloudflare Tunnel، Tailscale Funnel) أو Gateway مرحلية                               |
| التوسع الأفقي                | جلسة Socket Mode واحدة لكل تطبيق لكل مضيف؛ تحتاج Gateways متعددة إلى تطبيقات Slack منفصلة | معالج POST عديم الحالة؛ يمكن لنسخ Gateway متعددة مشاركة تطبيق واحد خلف موازن تحميل                            |
| حسابات متعددة على Gateway واحدة | مدعوم؛ يفتح كل حساب WS خاصًا به                                                     | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (افتراضيًا `/slack/events`) حتى لا تتصادم التسجيلات               |
| نقل أمر الشرطة المائلة       | يُسلَّم عبر اتصال WS؛ يتم تجاهل `slash_commands[].url`                               | يرسل Slack طلبات POST إلى `slash_commands[].url`؛ الحقل مطلوب لإرسال الأمر                                    |
| توقيع الطلب                  | غير مستخدم (المصادقة هي الرمز على مستوى التطبيق)                                     | يوقّع Slack كل طلب؛ يتحقق OpenClaw باستخدام `signingSecret`                                                    |
| التعافي عند انقطاع الاتصال   | يعيد Slack SDK الاتصال تلقائيًا؛ تُطبَّق تهيئة نقل مهلة pong الخاصة بالـ Gateway      | لا يوجد اتصال مستمر لينقطع؛ تتم إعادة المحاولة لكل طلب من Slack                                               |

<Note>
  **اختر Socket Mode** للمضيفات ذات Gateway واحدة، وحواسيب التطوير، والشبكات المحلية التي يمكنها الوصول إلى `*.slack.com` صادرًا لكنها لا تستطيع قبول HTTPS وارد.

**اختر عناوين URL لطلبات HTTP** عند تشغيل نسخ Gateway متعددة خلف موازن تحميل، أو عندما يكون WSS الصادر محظورًا لكن HTTPS الوارد مسموحًا، أو عندما تنهي بالفعل Webhook الخاصة بـ Slack عند وكيل عكسي.
</Note>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد بيانات التعريف أدناه ← **Next** ← **Create**.

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
          **Recommended** يطابق مجموعة الميزات الكاملة لـ Plugin Slack المضمّن: App Home، وأوامر الشرطة المائلة، والملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية، وقراءات الرموز التعبيرية/مجموعات المستخدمين. اختر **Minimal** عندما تقيّد سياسة مساحة العمل النطاقات — فهو يغطي الرسائل المباشرة، وسجل القنوات/المجموعات، والإشارات، وأوامر الشرطة المائلة، لكنه يستبعد الملفات، والتفاعلات، والتثبيتات، والرسائل المباشرة الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read`. راجع [قائمة التحقق من بيان التعريف والنطاق](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق والخيارات الإضافية مثل أوامر الشرطة المائلة الإضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: أضف `connections:write`، واحفظ، وانسخ قيمة `xapp-...`.
        - **Install App → Install to Workspace**: انسخ رمز OAuth لمستخدم البوت `xoxb-...`.

      </Step>

      <Step title="تهيئة OpenClaw">

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

        احتياطي env (الحساب الافتراضي فقط):

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

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد بيانات التعريف أدناه ← استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام الخاص بـ Gateway لديك ← **Next** ← **Create**.

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
          يطابق **الموصى به** مجموعة الميزات الكاملة في Slack plugin المضمّن؛ أما **الحد الأدنى** فيُسقط الملفات والتفاعلات والدبابيس ورسائل المجموعة المباشرة (`mpim:*`) و`emoji:read` و`usergroups:read` لمساحات العمل المقيّدة. راجع [قائمة تحقق Manifest والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url` و`event_subscriptions.request_url` و`interactivity.request_url` / `message_menu_options_url`) كلها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط Manifest في Slack تسميتها بشكل منفصل، لكن OpenClaw يوجّه حسب نوع الحمولة، لذا يكفي `webhookPath` واحد (الافتراضي `/slack/events`). أوامر Slash من دون `slash_commands[].url` لن تنفّذ أي إجراء بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **المعلومات الأساسية → بيانات اعتماد التطبيق**: انسخ **سر التوقيع** للتحقق من الطلبات.
        - **تثبيت التطبيق → تثبيت في مساحة العمل**: انسخ رمز Bot User OAuth Token بصيغة `xoxb-...`.

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

## ضبط نقل Socket Mode

يضبط OpenClaw مهلة pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة العمل أو المضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات Slack websocket pong أو مهلات server-ping، أو التي تعمل على مضيفين لديهم نقص معروف في حلقة الأحداث. `clientPingTimeout` هي مدة انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ و`serverPingTimeout` هي مدة انتظار إشارات ping من خادم Slack. تظل رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات حيوية للنقل.

## قائمة تحقق Manifest والنطاقات

يكون Manifest الأساسي لتطبيق Slack نفسه في Socket Mode وHTTP Request URLs. يختلف فقط قسم `settings` (و`url` لأمر Slash).

Manifest الأساسي (Socket Mode الافتراضي):

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

### إعدادات Manifest إضافية

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

يفعّل Manifest الافتراضي تبويب **الصفحة الرئيسية** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب الصفحة الرئيسية، ينشر OpenClaw عرضًا افتراضيًا آمنًا للصفحة الرئيسية باستخدام `views.publish`؛ ولا تُضمّن أي حمولة محادثة أو تكوين خاص. يظل تبويب **الرسائل** مفعّلًا لرسائل Slack المباشرة.

<AccordionGroup>
  <Accordion title="أوامر Slash الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر Slash أصلية](#commands-and-slash-behavior) بدلًا من أمر مكوّن واحد مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر Slash في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (افتراضي)">

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

        كرر قيمة `url` تلك في كل أمر ضمن القائمة.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، فإن Slack يتوقع صيغة `:emoji_name:`.

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
- يتطلب وضع HTTP كلا من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تتجاوز رموز الإعدادات بديل env.
- ينطبق بديل env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالإعدادات فقط (بلا بديل env) ويكون افتراضيا بسلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سر آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  تعذر عليه حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode،
  يكون الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. بالنسبة إلى عمليات الكتابة، يبقى رمز البوت مفضلا؛ ولا يسمح بكتابات رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ولا يكون رمز البوت متاحا.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة      | الافتراضي |
| ---------- | ------- |
| الرسائل   | مفعلة |
| التفاعلات  | مفعلة |
| التثبيتات       | مفعلة |
| معلومات الأعضاء | مفعلة |
| قائمة emoji  | مفعلة |

تشمل إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات وصفية لملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول عبر الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح القانونية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيا false)
    - `dm.groupChannels` (قائمة سماح اختيارية لـ MPIM)

    أسبقية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تضبط `allowFrom` الخاصة بها.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا تزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمتان تقرآن للتوافق. يرحلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات تحت `channels.slack.channels` و**يجب أن تستخدم معرفات قنوات Slack الثابتة** (مثل `C12345678`) كمفاتيح إعدادات.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة تماما (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    حل الاسم/المعرف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تبقى إدخالات أسماء القنوات غير المحلولة كما ضبطت لكنها تتجاهل للتوجيه افتراضيا
    - التفويض الوارد وتوجيه القنوات يعتمدان على المعرف أولا افتراضيا؛ تتطلب المطابقة المباشرة لاسم المستخدم/المعرف المختصر `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    المفاتيح المستندة إلى الاسم (`#channel-name` أو `channel-name`) **لا** تطابق تحت `groupPolicy: "allowlist"`. البحث عن القناة يعتمد على المعرف أولا افتراضيا، لذلك لن ينجح مفتاح مستند إلى الاسم في التوجيه أبدا وسيتم حظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبا للتوجيه ويبدو أن المفتاح المستند إلى الاسم يعمل.

    استخدم دائما معرف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — يظهر المعرف (`C...`) في نهاية عنوان URL.

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

  <Tab title="الإشارات ومستخدمي القنوات">
    تكون رسائل القنوات مقيدة بالإشارة افتراضيا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضوا في مجموعة المستخدمين تلك؛ تتطلب `usergroups:read`
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، وبديل احتياطي `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة البوت (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `channel:` أو `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تطابق `id:` فقط)

    `allowBots` محافظ بالنسبة إلى القنوات والقنوات الخاصة: لا تقبل رسائل الغرف التي كتبها بوت إلا عندما يكون البوت المرسل مدرجا صراحة في قائمة سماح `users` لتلك الغرفة، أو عندما يكون معرف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوا حاليا في الغرفة. لا تلبي أحرف البدل وإدخالات المالك باسم العرض شرط حضور المالك. يستخدم حضور المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل بحث الأعضاء، يسقط OpenClaw رسالة الغرفة التي كتبها البوت.

  </Tab>
</Tabs>

## السلاسل والجلسات ووسوم الرد

- توجه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل ارتباطات مسارات Slack معرفات النظراء الخام إضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تطوى رسائل Slack المباشرة إلى الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسة السلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- في القنوات التي يعالج فيها OpenClaw الرسائل ذات المستوى الأعلى دون طلب إشارة صريحة، يوجه `replyToMode` غير `off` كل جذر معالج إلى `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` بحيث ترتبط سلسلة Slack المرئية بجلسة OpenClaw واحدة من أول دور.
- الافتراضي لـ `channels.slack.thread.historyScope` هو `thread`؛ والافتراضي لـ `thread.inheritParent` هو `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطها إلى `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تكبح الإشارات الضمنية في السلاسل بحيث لا يستجيب البوت إلا لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. دون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- البديل الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

للردود الصريحة على سلاسل Slack من أداة `message`، اضبط `replyBroadcast: true` مع `action: "send"` و`threadId` أو `replyTo` لطلب أن يبث Slack أيضا رد السلسلة إلى القناة الأصل. يطابق هذا علم `reply_broadcast` في `chat.postMessage` لدى Slack ويدعم فقط لإرسال النصوص أو Block Kit، لا لرفع الوسائط.

عندما يعمل استدعاء أداة `message` داخل سلسلة Slack ويستهدف القناة نفسها، يرث OpenClaw عادة سلسلة Slack الحالية وفقا لـ `replyToMode`. اضبط `topLevel: true` على `action: "send"` أو `action: "upload-file"` لفرض رسالة جديدة في القناة الأصل بدلا من ذلك. تقبل `threadId: null` كإلغاء اختيار المستوى الأعلى نفسه.

<Note>
يعطل `replyToMode="off"` **كل** تسلسل الردود في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة بينما تبقى ردود Telegram مرئية ضمن السطر.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack الرموز المختصرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميا.

## بث النص

تتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بآخر مخرجات جزئية.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجه تحديثات الأدوات/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطها إلى `false` للإبقاء على رسائل الأدوات/التقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطها إلى `status` للإبقاء على أسطر تقدم الأدوات مضغوطة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

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

تتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة ردود متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. يظل اختيار السلسلة يتبع `replyToMode`.
- يمكن لجذور القنوات، ودردشات المجموعات، والرسائل المباشرة ذات المستوى الأعلى الاستمرار في استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا أو لا توجد سلسلة ردود.
- تبقى رسائل Slack المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذلك لا تعرض معاينة البث/الحالة الأصلية بأسلوب سلاسل Slack؛ وبدلًا من ذلك ينشر OpenClaw معاينة مسودة ويحررها داخل الرسالة المباشرة.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النتائج النهائية للوسائط/الأخطاء تحريرات المعاينة المعلقة؛ أما النتائج النهائية النصية/الكتلية المؤهلة فتُرسل فقط عندما يمكنها تحرير المعاينة في مكانها.
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

- `channels.slack.streamMode` (`replace | status_final | append`) هو اسم مستعار قديم وقت التشغيل لـ `channels.slack.streaming.mode`.
- القيمة المنطقية `channels.slack.streaming` هي اسم مستعار قديم وقت التشغيل لـ `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` القديم هو اسم مستعار وقت التشغيل لـ `channels.slack.streaming.nativeTransport`.
- شغّل `openclaw doctor --fix` لإعادة كتابة إعدادات بث Slack المحفوظة إلى المفاتيح القياسية.

## الرجوع إلى تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. يكون هذا مفيدًا أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا قصيرة (على سبيل المثال `"hourglass_flowing_sand"`).
- يكون التفاعل بأفضل جهد، وتُجرى محاولة التنظيف تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الوسائط، والتجزئة، والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلب موثّق بالرمز المميز) وتُكتب إلى مخزن الوسائط عند نجاح الجلب وسماح حدود الحجم. تتضمن عناصر الملفات النائبة `fileId` الخاص بـ Slack حتى يتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلات خمول وإجمالية محدودة. إذا توقف استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى عنصر الملف النائب.

    الحد الأقصى لحجم الوارد وقت التشغيل افتراضيًا هو `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم مع أولوية الفقرات
    - تستخدم عمليات إرسال الملفات واجهات برمجة تطبيقات الرفع في Slack ويمكن أن تتضمن ردود السلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا فتستخدم عمليات إرسال القنوات القيم الافتراضية لنوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط أن تُنشر مباشرة إلى معرفات المستخدمين؛ تفتح عمليات رفع الملفات والإرسال ضمن السلاسل الرسالة المباشرة أولًا عبر واجهات برمجة تطبيقات محادثات Slack لأن هذه المسارات تتطلب معرف محادثة ملموسًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو أوامر أصلية متعددة. اضبط `channels.slack.slashCommand` لتغيير افتراضيات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack لديك، وتُفعّل باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- وضع الأوامر الأصلية التلقائي **متوقف** لـ Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع ترشيح خيارات غير متزامن عندما تكون معالجات خيارات التفاعلية متاحة
- تجاوز حدود Slack: تعود قيم الخيارات المرمزة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذ الأوامر إلى جلسة المحادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم رد تفاعلية من إنشاء الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

تُحوّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو الاختيارات مرة أخرى عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة أزرارها الخاصة.
- قيم رد الاتصال التفاعلية هي رموز مبهمة منشأة بواسطة OpenClaw، وليست قيمًا أولية من إنشاء الوكيل.
- إذا كانت الكتل التفاعلية المنشأة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي مع أزرار وتفاعلات، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec `channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرف الموافقة `plugin:`.
- لا يزال تفويض الموافقين مطبقًا: يمكن فقط للمستخدمين المحددين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ يجب على OpenClaw
تضمين أمر `/approve` يدوي فقط عندما تقول نتيجة الأداة إن موافقات الدردشة
غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما يكون `enabled` غير معيّن أو `"auto"` ويتم حل
موافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحةً.
عيّن `enabled: true` لفرض تشغيل الموافقات الأصلية عند حل الموافقين.

السلوك الافتراضي دون تكوين صريح لموافقة Exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم التكوين الأصلي الصريح في Slack إلا عندما تريد تجاوز الموافقين، أو إضافة عوامل تصفية، أو
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

تمرير `approvals.exec` المشترك منفصل. استخدمه فقط عندما يجب أيضًا
توجيه مطالبات موافقة Exec إلى دردشات أخرى أو أهداف صريحة خارج القناة. تمرير `approvals.plugin` المشترك
منفصل أيضًا؛ لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلًا
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج تمرير الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوّل تحريرات/حذوفات الرسائل إلى أحداث نظام.
- تُعالج بثوث السلاسل ("Also send to channel" في ردود السلاسل) كرسائل مستخدم عادية.
- تُحوّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عند تفعيل `configWrites`.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشّح بادئ السلسلة وبذر سياق تاريخ السلسلة الأولي بواسطة قوائم السماح للمرسلين المكوّنة عند الاقتضاء.
- تُصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات `workflow_*` الوصفية
  - أحداث `view_submission` و`view_closed` للنوافذ مع بيانات القناة الوصفية الموجهة ومدخلات النماذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ اتركه متوقفًا ما لم تكن هناك حاجة)
- الوصول إلى القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/التاريخ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- المعاينات الموسعة: `unfurlLinks`, `unfurlMedia` للتحكم في معاينة الروابط/الوسائط في `chat.postMessage`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح القائمة على الأسماء بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرف أولًا افتراضيًا. للعثور على معرف: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرف القناة.
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
    تحقق:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث رسائل Slack Assistant المباشرة: السجلات التفصيلية التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة Assistant محررًا دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket غير متصل">
    تحقق من رموز bot + app وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقّق من:

    - سرّ التوقيع
    - مسار webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر Slash)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مكوّن، لكن وقت التشغيل الحالي تعذّر عليه
    حل سرّ التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر Slash لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأمر الأصلي (`channels.slack.commands.native: true`) مع أوامر Slash مطابقة مسجّلة في Slack
    - أو وضع أمر Slash واحد (`channels.slack.slashCommand.enabled: true`)

    تحقّق أيضًا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المنزّلة بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملف قابل للتنزيل بدلًا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                     | المصدر               | السلوك الحالي                                                                  | ملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack       | تُنزّل وتُرفق بالدورة للمعالجة القادرة على الرؤية                   | حدّ لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack       | تُنزّل وتُعرض كسياق ملف لأدوات مثل `download-file` أو `pdf` | وارد Slack لا يحوّل ملفات PDF تلقائيًا إلى مدخلات رؤية صور |
| ملفات أخرى                    | عنوان URL لملف Slack       | تُنزّل عند الإمكان وتُعرض كسياق ملف                              | لا تُعامل الملفات الثنائية كمدخلات صور                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن ترطيب ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم البوادئ التي تحتوي على ملفات فقط عنصرًا نائبًا للمرفق                          |
| رسائل متعددة الصور           | ملفات Slack متعددة | يُقيّم كل ملف بشكل مستقل                                              | معالجة Slack محددة بثمانية ملفات لكل رسالة                     |

### مسار الوارد

عندما تصل رسالة Slack مع مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزّلة وأنواع المحتوى إلى سياق الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عندما تصل رسالة في سلسلة (لديها أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذرية المضمّنة تحتوي على ملفات، فيمكن لـ Slack ترطيب ملفات الجذر كسياق بادئ السلسلة.
- تكون لمرفقات الرد المباشرة أولوية على مرفقات الرسالة الجذرية.
- تُعرض الرسالة الجذرية التي تحتوي على ملفات فقط من دون نص بعنصر نائب للمرفق حتى يتمكن البديل من تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يُعالج كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمع مراجع الوسائط المنزّلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يؤدي فشل تنزيل مرفق واحد إلى حظر المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية، والملفات غير القابلة للوصول، والملفات الزائدة الحجم، واستجابات HTML الخاصة بالمصادقة/تسجيل الدخول في Slack بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المكوّن في `agents.defaults.imageModel`.

### حدود معروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهٍ لملف Slack                 | يُتخطى الملف؛ لا يظهر خطأ                                                 | أعد رفع الملف في Slack                                                |
| نموذج الرؤية غير مكوّن            | تُخزن مرفقات الصور كمراجع وسائط، لكنها لا تُحلل كصور | هيّئ `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية |
| صور كبيرة جدًا (> 20 MB افتراضيًا) | تُتخطى وفق حد الحجم                                                         | زِد `channels.slack.mediaMaxMb` إذا سمح Slack بذلك                       |
| مرفقات مُعاد توجيهها/مُشاركة           | يُتعامل مع النص ووسائط الصور/الملفات المستضافة على Slack على أساس أفضل جهد                       | أعد مشاركتها مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزن كسياق ملف/وسائط، ولا تُوجّه تلقائيًا عبر رؤية الصور  | استخدم `download-file` لبيانات الملف الوصفية أو أداة `pdf` لتحليل PDF   |

### وثائق ذات صلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- الملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Slack بـ gateway.
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
  <Card title="التهيئة" icon="sliders" href="/ar/gateway/configuration">
    تخطيط التهيئة والأسبقية.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
