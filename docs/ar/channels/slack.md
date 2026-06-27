---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع مقبس Slack أو HTTP أو الترحيل
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode، وعناوين URL لطلبات HTTP، ووضع الترحيل)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:13:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا. وضع الترحيل مخصص للنشرات المُدارة حيث يملك موجّه موثوق دخول Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الإقران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وإجراءات إصلاح عبر القنوات.
  </Card>
</CardGroup>

## اختيار Socket Mode أو عناوين URL لطلبات HTTP

كلا الناقلين جاهز للإنتاج ويحققان تكافؤ الميزات للمراسلة، وأوامر slash، وApp Home، والتفاعل. اختر حسب شكل النشر، وليس الميزات.

| الاعتبار                    | Socket Mode (افتراضي)                                                                                                                               | عناوين URL لطلبات HTTP                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL عام للـ Gateway    | غير مطلوب                                                                                                                                           | مطلوب (DNS، وTLS، ووكيل عكسي أو نفق)                                                                          |
| الشبكة الصادرة              | يجب أن يكون WSS الصادر إلى `wss-primary.slack.com` قابلًا للوصول                                                                                    | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                               |
| الرموز المطلوبة             | رمز Bot + App-Level Token مع `connections:write`                                                                                                     | رمز Bot + Signing Secret                                                                                       |
| حاسوب التطوير / خلف جدار ناري | يعمل كما هو                                                                                                                                          | يحتاج إلى نفق عام (ngrok، أو Cloudflare Tunnel، أو Tailscale Funnel) أو Gateway مرحلي                          |
| التوسع الأفقي               | جلسة Socket Mode واحدة لكل تطبيق لكل مضيف؛ تحتاج Gateways المتعددة إلى تطبيقات Slack منفصلة                                                        | معالج POST عديم الحالة؛ يمكن لنسخ Gateway متعددة مشاركة تطبيق واحد خلف موازن حمل                              |
| حسابات متعددة على Gateway واحد | مدعوم؛ يفتح كل حساب WS الخاص به                                                                                                                     | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات               |
| نقل أوامر slash             | تُسلَّم عبر اتصال WS؛ يتم تجاهل `slash_commands[].url`                                                                                              | يرسل Slack طلبات POST إلى `slash_commands[].url`؛ الحقل مطلوب لتنفيذ الأمر                                    |
| توقيع الطلبات               | غير مستخدم (المصادقة هي App-Level Token)                                                                                                            | يوقّع Slack كل طلب؛ يتحقق OpenClaw باستخدام `signingSecret`                                                    |
| الاستعادة عند انقطاع الاتصال | إعادة الاتصال التلقائية في Slack SDK مفعّلة؛ يعيد OpenClaw أيضًا تشغيل جلسات Socket Mode الفاشلة بتراجع محدود. ينطبق ضبط نقل مهلة Pong.           | لا يوجد اتصال مستمر لينقطع؛ تتم إعادة المحاولة لكل طلب من Slack                                               |

<Note>
  **اختر Socket Mode** للمضيفين ذوي Gateway واحد، وحواسيب التطوير، والشبكات المحلية التي يمكنها الوصول إلى `*.slack.com` صادرًا لكنها لا تستطيع قبول HTTPS وارد.

**اختر عناوين URL لطلبات HTTP** عند تشغيل عدة نسخ Gateway خلف موازن حمل، أو عندما يكون WSS الصادر محظورًا بينما HTTPS الوارد مسموحًا، أو عندما تنهي Slack webhooks مسبقًا عند وكيل عكسي.
</Note>

### وضع الترحيل

يفصل وضع الترحيل دخول Slack عن OpenClaw gateway. يملك موجّه موثوق اتصال Slack Socket Mode
الوحيد، ويختار Gateway الوجهة، ويمرر حدثًا مضبوط النوع عبر websocket مصادق عليه. يستمر Gateway في استخدام رمز bot الخاص به
لاستدعاءات Slack Web API الصادرة.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

يجب أن يستخدم عنوان URL للترحيل `wss://` ما لم يكن يستهدف localhost. تعامل مع رمز bearer
وجدول توجيه الموجّه كجزء من حد تفويض Slack: تدخل الأحداث الموجّهة إلى
معالج رسائل Slack العادي كتفعيلات مصرح بها. يمكن لـ `slack_identity` المقدم من الموجّه
في إطار `hello` الخاص بـ websocket أن يضبط اسم المستخدم والأيقونة الافتراضيين للصادر؛ وتظل الهوية الصريحة
التي يوفرها المستدعي هي الغالبة. يعيد اتصال الترحيل الاتصال بنفس
توقيت التراجع المحدود المستخدم بواسطة Socket Mode ويمسح الهوية المقدمة من الموجّه كلما
انقطع الاتصال.

## التثبيت

ثبّت Slack قبل تكوين القناة:

```bash
openclaw plugins install @openclaw/slack
```

يسجّل `plugins install` الـ plugin ويفعّله. لا يزال الـ plugin لا يفعل شيئًا حتى تكوّن تطبيق Slack وإعدادات القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك الـ plugin العام وقواعد التثبيت.

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← اختر مساحة عملك ← الصق أحد ملفات البيان أدناه ← **Next** ← **Create**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          يطابق **Recommended** مجموعة ميزات Slack plugin الكاملة: App Home، وأوامر slash، والملفات، والتفاعلات، والدبابيس، والرسائل المباشرة الجماعية، وقراءات الرموز التعبيرية/مجموعات المستخدمين. اختر **Minimal** عندما تقيد سياسة مساحة العمل النطاقات — فهو يغطي الرسائل المباشرة، وسجل القنوات/المجموعات، والإشارات، وأوامر slash، لكنه يستبعد الملفات، والتفاعلات، والدبابيس، والرسائل المباشرة الجماعية (`mpim:*`)، و`emoji:read`، و`usergroups:read`. راجع [قائمة تحقق البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق وخيارات الإضافة مثل أوامر slash إضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: أضف `connections:write`، ثم احفظ، وانسخ App-Level Token.
        - **Install App -> Install to Workspace**: انسخ Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **إنشاء تطبيق جديد** ← **من بيان** ← حدّد مساحة عملك ← الصق أحد البيانات أدناه ← استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام لـ Gateway لديك ← **التالي** ← **إنشاء**.

        <CodeGroup>

```json موصى به
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json الحد الأدنى
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          يطابق **موصى به** مجموعة الميزات الكاملة لـ Plugin الخاص بـ Slack؛ أما **الحد الأدنى** فيُسقط الملفات والتفاعلات والدبابيس والرسائل المباشرة الجماعية (`mpim:*`) و`emoji:read` و`usergroups:read` لمساحات العمل المقيّدة. راجع [قائمة التحقق من البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة سبب كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url` و`event_subscriptions.request_url` و`interactivity.request_url` / `message_menu_options_url`) كلها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط بيان Slack تسميتها كلًّا على حدة، لكن OpenClaw يوجّه حسب نوع الحمولة، لذا يكفي `webhookPath` واحد (افتراضيًا `/slack/events`). أوامر الشرطة المائلة من دون `slash_commands[].url` لن تنفّذ شيئًا بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **المعلومات الأساسية ← بيانات اعتماد التطبيق**: انسخ **سر التوقيع** للتحقق من الطلبات.
        - **تثبيت التطبيق -> التثبيت في مساحة العمل**: انسخ رمز OAuth لمستخدم البوت.

      </Step>

      <Step title="Configure OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        امنح كل حساب `webhookPath` مميزًا (افتراضيًا `/slack/events`) حتى لا تتصادم التسجيلات.
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

## ضبط نقل وضع Socket Mode

يضبط OpenClaw مهلة انتظار pong في عميل Slack SDK على 15 ثانية افتراضيًا في وضع Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة العمل أو بالمضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات Slack websocket pong أو server-ping، أو التي تعمل على مضيفين معروفين باستنفاد حلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ و`serverPingTimeout` هو انتظار إشارات ping من خادم Slack. تبقى رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات لحيوية النقل.

ملاحظات:

- يتم تجاهل `socketMode` في وضع HTTP Request URL.
- تنطبق إعدادات `channels.slack.socketMode` الأساسية على جميع حسابات Slack ما لم يتم تجاوزها. تستخدم التجاوزات لكل حساب `channels.slack.accounts.<accountId>.socketMode`؛ ولأن هذا تجاوز كائن، أدرج كل حقل ضبط socket تريده لذلك الحساب.
- لدى `clientPingTimeout` فقط قيمة افتراضية من OpenClaw (`15000`). يتم تمرير `serverPingTimeout` و`pingPongLoggingEnabled` إلى Slack SDK فقط عند تكوينهما.
- يبدأ التراجع قبل إعادة تشغيل Socket Mode عند نحو ثانيتين ويصل إلى حد أقصى يقارب 30 ثانية. تتم إعادة محاولة إخفاقات البدء القابلة للاسترداد، وانتظار البدء، وقطع الاتصال إلى أن تتوقف القناة. أما أخطاء الحساب وبيانات الاعتماد الدائمة مثل المصادقة غير الصالحة أو الرموز الملغاة أو النطاقات المفقودة فتفشل سريعًا بدلًا من إعادة المحاولة إلى الأبد.

## قائمة التحقق من البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه لوضع Socket Mode وعناوين HTTP Request URLs. يختلف فقط مقطع `settings` (و`url` الخاص بأمر الشرطة المائلة).

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

بالنسبة إلى **وضع HTTP Request URLs**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم عنوان URL عام:

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

يعرض البيان الافتراضي علامة التبويب **الرئيسية** في صفحة تطبيق Slack الرئيسية ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل علامة التبويب الرئيسية، ينشر OpenClaw عرضًا افتراضيًا آمنًا للصفحة الرئيسية باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو إعدادات خاصة. تبقى علامة التبويب **الرسائل** مفعلة لرسائل Slack المباشرة. يفعّل البيان أيضًا سلاسل مساعد Slack باستخدام `features.assistant_view` و`assistant:write` و`assistant_thread_started` و`assistant_thread_context_changed`؛ تُوجَّه سلاسل المساعد إلى جلسات سلاسل OpenClaw الخاصة بها وتُبقي سياق السلسلة المقدم من Slack متاحًا للوكيل.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوّن، مع مراعاة ما يلي:

    - استخدم `/agentstatus` بدلًا من `/status` لأن أمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في وقت واحد.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="وضع Socket (الافتراضي)">

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      <Tab title="عناوين URL لطلبات HTTP">
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

        كرّر قيمة `url` هذه في كل أمر في القائمة.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق بوت `chat:write.customize` إذا أردت أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصان) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات رمز المستخدم الاختيارية (عمليات القراءة)">
    إذا كوّنت `channels.slack.userToken`، تكون نطاقات القراءة النموذجية هي:

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

- `botToken` + `appToken` مطلوبان لوضع Socket.
- يتطلب وضع HTTP وجود `botToken` + `signingSecret`.
- يتطلب وضع Relay وجود `botToken` بالإضافة إلى `relay.url` و`relay.authToken` و`relay.gatewayId`؛ ولا يستخدم رمز تطبيق أو سر توقيع.
- تقبل `botToken` و`appToken` و`signingSecret` و`relay.authToken` و`userToken` سلاسل نص عادي
  أو كائنات SecretRef.
- تتجاوز رموز الإعدادات بديل env الاحتياطي.
- ينطبق بديل env الاحتياطي `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` مخصص للإعدادات فقط (من دون بديل env احتياطي) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- الحالة هي `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مكوّن عبر SecretRef
  أو مصدر سر غير مضمن آخر، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي وضع Socket، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى قراءات الإجراءات/الدليل، يمكن تفضيل رمز المستخدم عند تكوينه. بالنسبة إلى عمليات الكتابة، يبقى رمز البوت مفضّلًا؛ ولا يُسمح بعمليات الكتابة برمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة | الافتراضي |
| ---------- | ------- |
| الرسائل | مفعّل |
| التفاعلات | مفعّل |
| الدبابيس | مفعّل |
| معلومات العضو | مفعّل |
| قائمة emoji | مفعّل |

تشمل إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack الظاهرة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

  <Tabs>
  <Tab title="DM policy">
    يتحكم `channels.slack.dmPolicy` في وصول الرسائل المباشرة. تُعد `channels.slack.allowFrom` قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح اختيارية لـ MPIM)

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على حساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا يزال يتم قراءة `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمين للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` و**يجب أن تستخدم معرفات قنوات Slack المستقرة** (مثل `C12345678`) كمفاتيح إعداد.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز المميز
    - تبقى إدخالات أسماء القنوات غير المحلولة كما تم إعدادها، لكنها تُتجاهل للتوجيه افتراضيًا
    - التخويل الوارد وتوجيه القنوات يعتمدان على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/المعرّف النصي المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    المفاتيح المعتمدة على الاسم (`#channel-name` أو `channel-name`) **لا** تطابق ضمن `groupPolicy: "allowlist"`. البحث عن القناة يعتمد على المعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح معتمد على الاسم في التوجيه أبدًا، وسيتم حظر جميع الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح المعتمد على الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — يظهر المعرّف (`C...`) في نهاية URL.

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

  <Tab title="Mentions and channel users">
    رسائل القنوات تتطلب الإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضوًا في مجموعة المستخدمين تلك؛ تتطلب `usergroups:read`
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة البوت (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `channel:` أو `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُربط بـ `id:` فقط)

    `allowBots` محافظ بالنسبة إلى القنوات والقنوات الخاصة: لا تُقبل رسائل الغرف المنشأة بواسطة البوت إلا عندما يكون البوت المرسل مدرجًا صراحةً في قائمة السماح `users` الخاصة بتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوًا حاليًا في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بشرط حضور المالك. يستخدم حضور المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يتجاهل OpenClaw رسالة الغرفة المنشأة بواسطة البوت.

    تستخدم رسائل Slack المقبولة والمنشأة بواسطة البوت [حماية حلقة البوت](/ar/channels/bot-loop-protection) المشتركة. اضبط `channels.defaults.botLoopProtection` للميزانية الافتراضية، ثم تجاوزها باستخدام `channels.slack.botLoopProtection` أو `channels.slack.channels.<id>.botLoopProtection` عندما تحتاج مساحة عمل أو قناة إلى حد مختلف.

  </Tab>
</Tabs>

## سلاسل المحادثات والجلسات وعلامات الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل ارتباطات مسارات Slack معرّفات النظراء الخام بالإضافة إلى صيغ أهداف Slack مثل `channel:C12345678`، و`user:U12345678`، و`<@U12345678>`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- تبقى رسائل القنوات العادية في المستوى الأعلى على الجلسة الخاصة بكل قناة، حتى عندما يكون `replyToMode` غير `off`.
- تستخدم ردود سلاسل Slack قيمة `thread_ts` الخاصة بالرسالة الأصل في Slack كلواحق للجلسات (`:thread:<threadTs>`)، حتى عند تعطيل تسلسل الردود الصادرة باستخدام `replyToMode="off"`.
- يزرع OpenClaw جذر قناة مؤهلًا في المستوى الأعلى داخل `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` عندما يُتوقع أن يبدأ ذلك الجذر سلسلة Slack مرئية، بحيث يشارك الجذر وردود السلسلة اللاحقة جلسة OpenClaw واحدة. ينطبق هذا على أحداث `app_mention`، ومطابقات البوت الصريحة أو أنماط الذكر المكوّنة، والقنوات ذات `requireMention: false` مع `replyToMode` غير `off`.
- الإعداد الافتراضي لـ `channels.slack.thread.historyScope` هو `thread`؛ والإعداد الافتراضي لـ `thread.inheritParent` هو `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عند `true`، يمنع الذكر الضمني داخل السلاسل بحيث لا يستجيب البوت إلا لذكريات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- رجوع قديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

للردود الصريحة في سلاسل Slack من أداة `message`، اضبط `replyBroadcast: true` مع `action: "send"` و`threadId` أو `replyTo` لطلب أن يبث Slack أيضًا رد السلسلة إلى القناة الأصل. يُطابق هذا علم `reply_broadcast` في `chat.postMessage` لدى Slack، وهو مدعوم فقط للإرسال النصي أو إرسال Block Kit، وليس لرفع الوسائط.

عندما يعمل استدعاء أداة `message` داخل سلسلة Slack ويستهدف القناة نفسها، يرث OpenClaw عادةً سلسلة Slack الحالية وفقًا لـ `replyToMode`. اضبط `topLevel: true` على `action: "send"` أو `action: "upload-file"` لفرض رسالة جديدة في القناة الأصل بدلًا من ذلك. يُقبل `threadId: null` كخيار انسحاب مكافئ إلى المستوى الأعلى.

<Note>
يعطل `replyToMode="off"` تسلسل ردود Slack الصادرة، بما في ذلك علامات `[[reply_to_*]]` الصريحة. ولا يسطّح جلسات سلاسل Slack الواردة: فالرسائل المنشورة بالفعل داخل سلسلة Slack ما زالت تُوجَّه إلى جلسة `:thread:<threadTs>`. يختلف هذا عن Telegram، حيث تظل العلامات الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل عن القناة بينما تبقى ردود Telegram مرئية ضمن السياق.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. يحدد `ackReactionScope` _متى_ يُرسل ذلك الرمز التعبيري فعليًا.

### الرمز التعبيري (`ackReaction`)

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- رجوع إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"eyes"` / 👀)

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عمومًا.

### النطاق (`messages.ackReactionScope`)

يقرأ مزود Slack النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد اليوم تجاوز على مستوى حساب Slack أو قناة Slack؛ القيمة عامة على Gateway.

القيم:

- `"all"`: تفاعل في الرسائل المباشرة والمجموعات.
- `"direct"`: تفاعل في الرسائل المباشرة فقط.
- `"group-all"`: تفاعل مع كل رسالة مجموعة (دون رسائل مباشرة).
- `"group-mentions"` (الافتراضي): تفاعل في المجموعات، لكن فقط عندما يُذكر البوت (أو في قابلِي الذكر الجماعية التي اختارت الاشتراك). **الرسائل المباشرة مستثناة.**
- `"off"` / `"none"`: لا تتفاعل أبدًا.

<Note>
النطاق الافتراضي (`"group-mentions"`) لا يطلق تفاعلات الإقرار في الرسائل المباشرة. لرؤية `ackReaction` المكوّن (مثل `"eyes"`) على رسائل Slack المباشرة الواردة، اضبط `messages.ackReactionScope` على `"direct"` أو `"all"`. يُقرأ `messages.ackReactionScope` عند بدء تشغيل مزود Slack، لذلك يلزم إعادة تشغيل Gateway حتى يدخل التغيير حيز التنفيذ.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // التفاعل في الرسائل المباشرة والمجموعات
  },
}
```

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث ناتج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأدوات/التقدم إلى رسالة المعاينة المعدّلة نفسها (الافتراضي: `true`). اضبطه على `false` للإبقاء على رسائل أدوات/تقدم منفصلة.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطه على `status` للإبقاء على أسطر تقدم الأدوات موجزة مع إخفاء نص الأمر/التنفيذ الخام (الافتراضي: `raw`).

إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر تقدم موجزة:

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

بطاقات مهام التقدم الأصلية في Slack اختيارية لوضع التقدم. اضبط `channels.slack.streaming.progress.nativeTaskCards` على `true` مع `channels.slack.streaming.mode="progress"` لإرسال بطاقة خطة/مهمة أصلية في Slack أثناء تشغيل العمل، ثم تحديث بطاقة المهمة نفسها عند الاكتمال. من دون هذا العلم، يحافظ وضع التقدم على سلوك معاينة المسودة المحمول.

- يجب أن تكون سلسلة رد متاحة حتى يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. ما زال اختيار السلسلة يتبع `replyToMode`.
- ما زالت جذور القنوات ودردشات المجموعات والرسائل المباشرة في المستوى الأعلى قادرة على استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا أو لا توجد سلسلة رد.
- تبقى رسائل Slack المباشرة في المستوى الأعلى خارج السلاسل افتراضيًا، لذلك لا تعرض معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ ينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويعدلها بدلًا من ذلك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ النهايات النصية/الكتلية المؤهلة إلا عندما تستطيع تعديل المعاينة في مكانها.
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

الاشتراك في بطاقات مهام التقدم الأصلية في Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

المفاتيح القديمة:

- `channels.slack.streamMode` (`replace | status_final | append`) هو اسم مستعار قديم في وقت التشغيل لـ `channels.slack.streaming.mode`.
- القيمة المنطقية `channels.slack.streaming` هي اسم مستعار قديم في وقت التشغيل لـ `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` القديم هو اسم مستعار في وقت التشغيل لـ `channels.slack.streaming.nativeTransport`.
- شغّل `openclaw doctor --fix` لإعادة كتابة إعدادات بث Slack المحفوظة إلى المفاتيح المعيارية.

## رجوع تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "يكتب...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"hourglass_flowing_sand"`).
- التفاعل على أساس أفضل جهد، وتُحاول عملية التنظيف تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الوسائط والتجزئة والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL الخاصة المستضافة على Slack (تدفق طلبات مصادق عليه بالرمز) وتُكتب إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم. تتضمن العناصر النائبة للملفات `fileId` الخاص بـ Slack بحيث يمكن للوكلاء جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلات خمول وإجمالية محدودة. إذا توقّف استرجاع ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى العنصر النائب للملف.

    الحد الأقصى لحجم الوارد في وقت التشغيل هو `20MB` افتراضيًا ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يعطي الأولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للرفع في Slack ويمكن أن تتضمن ردود سلاسل (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم إرساليات القناة افتراضيات نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما عمليات رفع الملفات والإرسال ضمن السلاسل فتفتح الرسالة المباشرة عبر واجهات API للمحادثات في Slack أولًا لأن تلك المسارات تتطلب معرّف محادثة ملموسًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر مكوّن واحد أو كأوامر أصلية متعددة. اضبط `channels.slack.slashCommand` لتغيير افتراضيات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack لديك وتُفعّل باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- وضع الأوامر الأصلية التلقائي **متوقف** لـ Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية استراتيجية عرض تكيفية تُظهر نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع ترشيح خيارات غير متزامن عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات Slash مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>`، وتظل توجّه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية للردود التي ينشئها الوكيل، لكن هذه الميزة معطلة افتراضيا.
بالنسبة إلى مخرجات الوكيل الجديد وCLI وPlugin، فضّل أزرار `presentation` المشتركة أو كتل التحديد. فهي تستخدم مسار تفاعل Slack نفسه، مع التراجع أيضا على القنوات الأخرى.

فعّلها بشكل عام:

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

عند تفعيلها، لا يزال بإمكان الوكلاء إصدار توجيهات رد قديمة خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُصرّف هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو الاختيارات مرة أخرى عبر مسار حدث تفاعل Slack الحالي. أبقها للمطالبات القديمة ومنافذ الخروج الخاصة بـ Slack؛ استخدم العرض التقديمي المشترك لعناصر التحكم المحمولة الجديدة.

واجهات API لمصرّف التوجيهات مهملة أيضا في كود المنتج الجديد:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

استخدم حمولات `presentation` و`buildSlackPresentationBlocks(...)` لعناصر التحكم الجديدة المعروضة في Slack.

ملاحظات:

- هذه واجهة مستخدم قديمة خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم رد الاتصال التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيما خاما من إنشاء الوكيل.
- إذا كانت الكتل التفاعلية المنشأة ستتجاوز حدود Slack Block Kit، يتراجع OpenClaw إلى الرد النصي الأصلي بدلا من إرسال حمولة كتل غير صالحة.

### عمليات إرسال النوافذ المنبثقة المملوكة من Plugin

يمكن لـ Slack plugins التي تسجل معالج تفاعل أن تستقبل أيضا أحداث دورة الحياة `view_submission` و`view_closed` قبل أن يضغط OpenClaw الحمولة لحدث النظام المرئي للوكيل. استخدم أحد أنماط التوجيه هذه عند فتح نافذة Slack منبثقة:

- اضبط `callback_id` على `openclaw:<namespace>:<payload>`.
- أو احتفظ بـ `callback_id` موجود وضع `pluginInteractiveData:
"<namespace>:<payload>"` في `private_metadata` للنافذة المنبثقة.

يتلقى المعالج `ctx.interaction.kind` بوصفه `view_submission` أو `view_closed`، و`inputs` المطبّعة، وكائن `stateValues` الخام الكامل من Slack. التوجيه اعتمادا على معرّف رد الاتصال فقط كاف لاستدعاء معالج Plugin؛ أدرج حقول توجيه المستخدم/الجلسة الموجودة في `private_metadata` للنافذة المنبثقة عندما يجب أن تنتج النافذة أيضا حدث نظام مرئيا للوكيل. يتلقى الوكيل حدث نظام مضغوطا ومنقحا بصيغة `Slack interaction: ...`. إذا أعاد المعالج `systemEvent.summary` أو `systemEvent.reference` أو `systemEvent.data`، تُدرج هذه الحقول في ذلك الحدث المضغوط حتى يتمكن الوكيل من الإشارة إلى التخزين المملوك من Plugin دون رؤية حمولة النموذج الكاملة.

## الموافقات الأصلية في Slack

يمكن لـ Slack أن يعمل كعميل موافقة أصلي بأزرار وتفاعلات تفاعلية، بدلا من التراجع إلى واجهة الويب أو الطرفية.

- يمكن عرض موافقات Exec وPlugin كمطالبات Slack-native Block Kit.
- يظل `channels.slack.execApprovals.*` هو إعداد تمكين عميل موافقات exec الأصلي وتكوين توجيه الرسائل الخاصة/القناة.
- تستخدم رسائل موافقة Exec الخاصة `channels.slack.execApprovals.approvers` أو `commands.ownerAllowFrom`.
- تستخدم موافقات Plugin أزرار Slack-native عندما يكون Slack مفعلا كعميل موافقة أصلي للجلسة المنشئة، أو عندما يوجّه `approvals.plugin` إلى جلسة Slack المنشئة أو هدف Slack.
- تستخدم رسائل موافقة Plugin الخاصة معتمدي Slack plugin من `channels.slack.allowFrom` أو `allowFrom` للحساب المسمى أو المسار الافتراضي للحساب.
- لا يزال تفويض المعتمدين مفروضا: لا يمكن للمعتمدين الخاصين بـ exec فقط الموافقة على طلبات Plugin إلا إذا كانوا أيضا معتمدي Plugin.

يستخدم هذا سطح زر الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ يجب أن يدرج OpenClaw أمرا يدويا `/approve` فقط عندما تقول نتيجة الأداة إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يتراجع إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات exec الأصلية تلقائيا عندما يكون `enabled` غير مضبوط أو `"auto"` ويتم حل معتمد exec واحد على الأقل. يمكن لـ Slack أيضا التعامل مع موافقات Plugin الأصلية عبر مسار العميل الأصلي هذا عندما يتم حل معتمدي Slack plugin ويطابق الطلب عوامل تصفية العميل الأصلي. اضبط `enabled: false` لتعطيل Slack صراحة كعميل موافقة أصلي. اضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يتم حل المعتمدين. تعطيل موافقات Slack exec لا يعطل تسليم موافقة Slack plugin الأصلية المفعلة عبر `approvals.plugin`؛ يستخدم تسليم موافقة Plugin معتمدي Slack plugin بدلا من ذلك.

السلوك الافتراضي دون تكوين صريح لموافقة Slack exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم تكوين Slack-native صريح إلا عندما تريد تجاوز المعتمدين أو إضافة عوامل تصفية أو الاشتراك في التسليم إلى دردشة المصدر:

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

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أيضا توجيه مطالبات موافقة exec إلى دردشات أخرى أو أهداف صريحة خارج النطاق. إعادة توجيه `approvals.plugin` المشتركة منفصلة أيضا؛ لا يمنع تسليم Slack الأصلي ذلك التراجع إلا عندما يستطيع Slack التعامل مع طلب موافقة Plugin محليا.

يعمل `/approve` في الدردشة نفسها أيضا في قنوات Slack والرسائل الخاصة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقة الكامل.

## الأحداث والسلوك التشغيلي

- تُحوّل تعديلات/حذف الرسائل إلى أحداث نظام.
- تُعالج بثوث السلاسل ("Also send to channel" في ردود السلاسل) كرسائل مستخدم عادية.
- تُحوّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عند تفعيل `configWrites`.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشّح بادئة السلسلة وبذر سياق سجل السلسلة الأولي بواسطة قوائم السماح للمرسلين المكوّنة عند الاقتضاء.
- تصدر إجراءات الكتل والاختصارات وتفاعلات النوافذ المنبثقة أحداث نظام `Slack interaction: ...` منظمة بحقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، التسميات، قيم المنتقي، وبيانات `workflow_*` الوصفية
  - الاختصارات العامة: بيانات رد الاتصال والفاعل الوصفية، موجّهة إلى جلسة الفاعل المباشرة
  - اختصارات الرسائل: رد الاتصال والفاعل والقناة والسلسلة وسياق الرسالة المحددة
  - أحداث `view_submission` و`view_closed` للنوافذ المنبثقة مع بيانات القناة الوصفية الموجهة ومدخلات النموذج

عرّف اختصارات عامة أو اختصارات رسائل في تكوين تطبيق Slack واستخدم أي معرّف رد اتصال غير فارغ. يقر OpenClaw بحمولات الاختصارات المطابقة، ويطبق سياسة مرسل الرسائل الخاصة/القناة نفسها مثل تفاعلات Slack الأخرى، ويضع الحدث المنقح في قائمة انتظار جلسة الوكيل الموجهة. تُنقح معرفات المشغلات وعناوين URL للاستجابة من سياق الوكيل.

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل الخاصة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح توافق: `dangerouslyAllowNameMatching` (للطوارئ؛ أبقه معطلا إلا عند الحاجة)
- الوصول إلى القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- معاينات الروابط: `unfurlLinks` (الافتراضي: `false`)، و`unfurlMedia` للتحكم في معاينة الروابط/الوسائط في `chat.postMessage`؛ اضبط `unfurlLinks: true` لإعادة الاشتراك في معاينات الروابط
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة السماح للقنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المستندة إلى الاسم بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولا افتراضيا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة السماح `users` لكل قناة
    - `messages.groupChat.visibleReplies`: افتراض طلبات المجموعة/القناة العادية هو `"automatic"`. إذا اشتركت في `"message_tool"` وأظهرت السجلات نص المساعد دون استدعاء `message(action=send)`، فقد فات النموذج مسار أداة الرسالة المرئية. يبقى النص النهائي خاصا في هذا الوضع؛ افحص سجل Gateway المفصل بحثا عن بيانات حمولة وصفية مكبوتة، أو اضبطه على `"automatic"` إذا كنت تريد نشر كل رد نهائي عادي للمساعد عبر المسار القديم.
    - `messages.groupChat.unmentionedInbound`: إذا كان `"room_event"`، فإن كلام القناة المسموح غير المذكور سياق محيط ويبقى صامتا إلا إذا استدعى الوكيل أداة `message`. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="رسائل DM يتم تجاهلها">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح (`dmPolicy: "open"` لا يزال يتطلب `channels.slack.allowFrom: ["*"]`)
    - تستخدم رسائل DM الجماعية معالجة MPIM؛ فعّل `channels.slack.dm.groupEnabled`، وإذا كان مكوّنا، أدرج MPIM في `channels.slack.dm.groupChannels`
    - أحداث DM الخاصة بـ Slack Assistant: السجلات المفصلة التي تذكر `drop message_changed`
      تعني عادة أن Slack أرسل حدث سلسلة Assistant معدلا دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket لا يتصل">
    تحقق من رموز bot + app وتمكين Socket Mode في إعدادات تطبيق Slack.
    يحتاج App-Level Token إلى `connections:write`، ويجب أن ينتمي رمز Bot User OAuth Token
    الخاص بالروبوت إلى تطبيق/مساحة عمل Slack نفسها مثل رمز التطبيق.

    إذا أظهر `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن، لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

    تُعد السجلات مثل `slack socket mode failed to start; retry ...` إخفاقات بدء
    قابلة للتعافي. أما النطاقات المفقودة، والرموز المميزة الملغاة، والمصادقة غير الصالحة فتفشل بسرعة
    بدلاً من ذلك. يعني سجل `slack token mismatch ...` أن رمز البوت ورمز التطبيق
    يبدوان تابعين لتطبيقَي Slack مختلفين؛ أصلح بيانات اعتماد تطبيق Slack.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقّق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP
    - ينهي عنوان URL العام TLS ويمرر الطلبات إلى مسار Gateway
    - يطابق مسار `request_url` لتطبيق Slack تماماً `channels.slack.webhookPath` (الافتراضي `/slack/events`)

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي تعذّر عليه
    حل سر التوقيع المدعوم بـ SecretRef.

    يعني سجل `slack: webhook path ... already registered` المتكرر أن حسابَي HTTP
    يستخدمان `webhookPath` نفسه؛ امنح كل حساب مساراً مميزاً.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر الشرطة المائلة المطابقة المسجلة في Slack
    - أو وضع أمر شرطة مائلة واحد (`channels.slack.slashCommand.enabled: true`)

    لا ينشئ Slack أو يزيل أوامر الشرطة المائلة تلقائياً. لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية؛ استخدم `true` وأنشئ الأوامر المطابقة في تطبيق Slack. في وضع HTTP، يجب أن يتضمن كل أمر شرطة مائلة من Slack عنوان URL الخاص بـ Gateway. في Socket Mode، تصل حمولات الأوامر عبر websocket ويتجاهل Slack `slash_commands[].url`.

    تحقّق أيضاً من `commands.useAccessGroups`، وتخويل الرسائل المباشرة، وقوائم السماح للقنوات،
    وقوائم السماح `users` لكل قناة. يعيد Slack أخطاء عابرة للمرسلين
    المحظورين لأوامر الشرطة المائلة، ومنها:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط التي تم تنزيلها بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم بذلك. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرةً إلى نموذج رد قادر على الرؤية؛ وتُحتفظ بالملفات الأخرى كسياق ملفات قابل للتنزيل بدلاً من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                     | المصدر               | السلوك الحالي                                                                  | ملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack       | يتم تنزيلها وإرفاقها بالدورة للمعالجة القادرة على الرؤية                   | حد لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack       | يتم تنزيلها وتقديمها كسياق ملف لأدوات مثل `download-file` أو `pdf` | لا يحوّل وارد Slack ملفات PDF إلى مدخلات رؤية الصور تلقائياً |
| ملفات أخرى                    | عنوان URL لملف Slack       | يتم تنزيلها عندما يكون ذلك ممكناً وتقديمها كسياق ملف                              | لا تُعامل الملفات الثنائية كمدخلات صور                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن إغناء ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم البوادئ التي تحتوي على ملفات فقط عنصراً نائباً للمرفق                          |
| رسائل متعددة الصور           | ملفات Slack متعددة | يتم تقييم كل ملف بشكل مستقل                                              | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                     |

### مسار الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت.
2. يُكتب الملف في مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزلة وأنواع المحتوى إلى السياق الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات تعريف ملف أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### توريث مرفقات جذر السلسلة

عند وصول رسالة في سلسلة (لها أصل `thread_ts`):

- إذا لم يكن للرد نفسه أي وسائط مباشرة وكانت الرسالة الجذرية المضمنة تحتوي على ملفات، يمكن لـ Slack إغناء ملفات الجذر كسياق لبداية السلسلة.
- تكون لمرفقات الرد المباشرة أولوية على مرفقات الرسالة الجذرية.
- تُمثَّل الرسالة الجذرية التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق حتى يظل بإمكان المسار الاحتياطي تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- تتم معالجة كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمّع مراجع الوسائط المنزلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل أحد المرفقات معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتكوين عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية الصلاحية، والملفات غير القابلة للوصول، والملفات التي تتجاوز الحجم المسموح، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack، بدلاً من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المكوّن في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهي الصلاحية لملف Slack                 | يتم تخطي الملف؛ لا يظهر أي خطأ                                                 | أعد تحميل الملف في Slack                                                |
| نموذج الرؤية غير مكوّن            | تُخزّن مرفقات الصور كمراجع وسائط، لكن لا تُحلّل كصور | كوّن `agents.defaults.imageModel` أو استخدم نموذج رد قادر على الرؤية |
| صور كبيرة جداً (> 20 MB افتراضياً) | يتم تخطيها حسب حد الحجم                                                         | زِد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| المرفقات المُعاد توجيهها/المشتركة           | النص والوسائط الصورية/الملفية المستضافة على Slack تكون على أساس أفضل جهد                       | أعد مشاركتها مباشرةً في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزّن كسياق ملف/وسائط، ولا تُوجّه تلقائياً عبر رؤية الصور  | استخدم `download-file` لبيانات تعريف الملف أو أداة `pdf` لتحليل PDF   |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- الملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق الحي: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Slack بالبوابة.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="التكوين" icon="sliders" href="/ar/gateway/configuration">
    تخطيط التكوين والأولوية.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر والسلوك.
  </Card>
</CardGroup>
