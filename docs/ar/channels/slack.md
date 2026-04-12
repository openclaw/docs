---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-12T07:15:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b80c1a612b8815c46c675b688639c207a481f367075996dde3858a83637313b
    source_path: channels/slack.md
    workflow: 15
---

# Slack

الحالة: جاهز للإنتاج للرسائل الخاصة + القنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تكون الرسائل الخاصة في Slack افتراضيًا في وضع الاقتران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) من الأسفل وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض
      </Step>

      <Step title="كوّن OpenClaw">

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

        بديل متغيرات البيئة (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ البوابة">

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
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

      </Step>

      <Step title="كوّن OpenClaw">

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
        استخدم مسارات webhook فريدة لتكوين HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مختلفًا (الافتراضي `/slack/events`) حتى لا تتعارض عمليات التسجيل.
        </Note>

      </Step>

      <Step title="ابدأ البوابة">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## قائمة التحقق من البيان والنطاقات

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
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

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
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
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### إعدادات بيان إضافية

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوَّن، مع بعض الفروق الدقيقة:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (الافتراضي)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "بدء جلسة جديدة",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "إعادة تعيين الجلسة الحالية"
      },
      {
        "command": "/compact",
        "description": "ضغط سياق الجلسة",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "إيقاف التشغيل الحالي"
      },
      {
        "command": "/session",
        "description": "إدارة انتهاء ربط سلسلة المحادثة",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "تعيين مستوى التفكير",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>"
      },
      {
        "command": "/verbose",
        "description": "تبديل المخرجات التفصيلية",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "عرض الوضع السريع أو تعيينه",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "تبديل إظهار الاستدلال",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "تبديل الوضع المرتفع",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "عرض إعدادات exec الافتراضية أو تعيينها",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "عرض النموذج أو تعيينه",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "سرد المزوّدين أو نماذج مزوّد معيّن",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "عرض ملخص المساعدة المختصر"
      },
      {
        "command": "/commands",
        "description": "عرض كتالوج الأوامر المُولَّد"
      },
      {
        "command": "/tools",
        "description": "عرض ما يمكن للوكيل الحالي استخدامه الآن",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "عرض حالة وقت التشغيل، بما في ذلك استخدام/حصة المزوّد عند توفرها"
      },
      {
        "command": "/tasks",
        "description": "سرد مهام الخلفية النشطة/الحديثة للجلسة الحالية"
      },
      {
        "command": "/context",
        "description": "شرح كيفية تجميع السياق",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "عرض هوية المُرسِل الخاصة بك"
      },
      {
        "command": "/skill",
        "description": "تشغيل Skill بالاسم",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "طرح سؤال جانبي بدون تغيير سياق الجلسة",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "التحكم في تذييل الاستخدام أو عرض ملخص التكلفة",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="عناوين URL لطلبات HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "بدء جلسة جديدة",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "إعادة تعيين الجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "ضغط سياق الجلسة",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "إيقاف التشغيل الحالي",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "إدارة انتهاء ربط سلسلة المحادثة",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "تعيين مستوى التفكير",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "تبديل المخرجات التفصيلية",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "عرض الوضع السريع أو تعيينه",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "تبديل إظهار الاستدلال",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "تبديل الوضع المرتفع",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "عرض إعدادات exec الافتراضية أو تعيينها",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "عرض النموذج أو تعيينه",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "سرد المزوّدين أو نماذج مزوّد معيّن",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "عرض ملخص المساعدة المختصر",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "عرض كتالوج الأوامر المُولَّد",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "عرض ما يمكن للوكيل الحالي استخدامه الآن",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "عرض حالة وقت التشغيل، بما في ذلك استخدام/حصة المزوّد عند توفرها",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "سرد مهام الخلفية النشطة/الحديثة للجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "شرح كيفية تجميع السياق",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "عرض هوية المُرسِل الخاصة بك",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "تشغيل Skill بالاسم",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "طرح سؤال جانبي بدون تغيير سياق الجلسة",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "التحكم في تذييل الاستخدام أو عرض ملخص التكلفة",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصان) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة emoji، فإن Slack يتوقع صياغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات user token الاختيارية (عمليات القراءة)">
    إذا قمت بتكوين `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز المميزة

- `botToken` و `appToken` مطلوبان لـ Socket Mode.
- يتطلب وضع HTTP كلاً من `botToken` و `signingSecret`.
- تقبل `botToken` و `appToken` و `signingSecret` و `userToken` سلاسل نصية
  عادية أو كائنات SecretRef.
- تتجاوز رموز التكوين المميزة بديل متغيرات البيئة.
- ينطبق بديل متغيرات البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) متاح عبر التكوين فقط (من دون بديل متغيرات البيئة) ويكون افتراضيًا بسلوك للقراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و `*Status` لكل اعتماد
  (`botToken` و `appToken` و `signingSecret` و `userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مكوَّن عبر SecretRef
  أو مصدر أسرار آخر غير مضمن، ولكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode،
  يكون الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل user token عند تكوينه. أما في عمليات الكتابة، فيبقى bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة عبر user token إلا عندما يكون `userTokenReadOnly: false` ويكون bot token غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

تتضمن إجراءات رسائل Slack الحالية `send` و `upload-file` و `download-file` و `read` و `edit` و `delete` و `pin` و `unpin` و `list-pins` و `member-info` و `emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل الخاصة (الاسم القديم: `channels.slack.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`؛ الاسم القديم: `channels.slack.dm.allowFrom`)
    - `disabled`

    علامات الرسائل الخاصة:

    - `dm.enabled` (القيمة الافتراضية true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل الخاصة الجماعية تكون false افتراضيًا)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون قيمة `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل الخاصة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القناة">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات ضمن `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات ثابتة.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة بالكامل (إعداد يعتمد على متغيرات البيئة فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    تحليل الاسم/المعرّف:

    - تُحل مدخلات قائمة سماح القنوات ومدخلات قائمة سماح الرسائل الخاصة عند بدء التشغيل عندما يسمح الوصول بالرمز المميز بذلك
    - تُحتفظ بمدخلات أسماء القنوات غير المحلولة كما هي في التكوين ولكن يتم تجاهلها في التوجيه افتراضيًا
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ وتتطلب المطابقة المباشرة لاسم المستخدم/الاسم المختصر `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدمي القنوات">
    تكون رسائل القنوات مقيّدة بالإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة للتطبيق (`<@botId>`)
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - سلوك السلسلة الضمني للرد على البوت (يُعطَّل عندما تكون `thread.requireExplicitMention` مساوية لـ `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر التحليل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو wildcard `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُربط بـ `id:` فقط)

  </Tab>
</Tabs>

## سلاسل المحادثات والجلسات وعلامات الرد

- تُوجَّه الرسائل الخاصة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج الرسائل الخاصة في Slack ضمن الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تُنشئ ردود السلاسل لاحقات جلسة خاصة بالسلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطها على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عند تعيينها إلى `true`، يتم تعطيل الإشارات الضمنية في السلسلة حتى لا يرد البوت إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. ومن دون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في سلسلة الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- البديل القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **كل** سلاسل الرد في Slack، بما في ذلك علامات `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث لا تزال العلامات الصريحة مُعترفًا بها في وضع `"off"`. يعكس هذا الاختلاف نماذج السلاسل في المنصتين: إذ تخفي سلاسل Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية في التدفق الرئيسي للمحادثة.

## تفاعلات الإقرار

ترسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- البديل من emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack shortcodes (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو على المستوى العام.

## بث النص

تتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات المعاينة المقطعة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.

تتحكم `channels.slack.streaming.nativeTransport` في البث النصي الأصلي في Slack عندما تكون قيمة `channels.slack.streaming.mode` هي `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة حتى يظهر البث النصي الأصلي وحالة سلسلة مساعد Slack. ويظل اختيار السلسلة يتبع `replyToMode`.
- يمكن أن تستمر جذور القنوات ومحادثات المجموعات في استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تظل الرسائل الخاصة ذات المستوى الأعلى في Slack خارج السلسلة افتراضيًا، لذلك لا تعرض المعاينة بنمط السلسلة؛ استخدم ردود السلسلة أو `typingReaction` إذا كنت تريد تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من البث النصي الأصلي في Slack:

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

- تتم ترحيل `channels.slack.streamMode` (`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- تتم ترحيل `channels.slack.streaming` المنطقية تلقائيًا إلى `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport`.
- تتم ترحيل `channels.slack.nativeStreaming` القديمة تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## بديل تفاعل الكتابة

تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم تزيله عند انتهاء التشغيل. ويكون هذا مفيدًا بشكل خاص خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضي "is typing...".

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack shortcodes (مثل `"hourglass_flowing_sand"`).
- يكون التفاعل على أساس أفضل جهد، وتُحاول عملية التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقطيع والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة في Slack (تدفق طلبات موثّق بالرمز المميز) وتُكتب في مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك.

    يكون الحد الأقصى الافتراضي للحجم الوارد في وقت التشغيل `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم بحسب الفقرة أولًا
    - تستخدم عمليات إرسال الملفات واجهات Slack API للرفع ويمكن أن تتضمن ردود السلسلة (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات الإرسال عبر القنوات القيم الافتراضية حسب نوع MIME من مسار معالجة الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل الخاصة
    - `channel:<id>` للقنوات

    تُفتح الرسائل الخاصة في Slack عبر واجهات Slack API للمحادثات عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوَّن أو كعدة أوامر أصلية. قم بتكوين `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطّلًا** في Slack، لذلك لا يؤدي `commands.native: "auto"` إلى تفعيل أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط للحجج الأصلية استراتيجية عرض تكيفية تُظهر نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع تصفية خيارات غير متزامنة عندما تكون معالجات خيارات التفاعلية متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات الأوامر المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` ومع ذلك تظل توجه تنفيذات الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية للردود التي ينشئها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

فعّلها على مستوى عام:

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

تُترجم هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلي هي رموز مبهمة مولدة من OpenClaw، وليست قيمًا خامًا أنشأها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec المسار `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل الخاصة/القنوات.
- لا تزال موافقات plugin تُحل عبر نفس سطح الأزرار الأصلي في Slack عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- يظل تفويض الموافقين مطبقًا: يمكن فقط للمستخدمين المحددين بوصفهم موافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا نفس سطح أزرار الموافقة المشتركة مثل القنوات الأخرى. عندما تكون `interactivity` مفعلة في إعدادات تطبيق Slack، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة داخل المحادثة.
وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
أن يتضمن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة غير متاحة
أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يُفعّل Slack موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو تساوي `"auto"` وعند حلّ موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
واضبط `enabled: true` لفرض تفعيل الموافقات الأصلية عند حلّ الموافقين.

السلوك الافتراضي من دون تكوين صريح لموافقات Slack exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم تكوين Slack الأصلي الصريح إلا عندما تريد تجاوز الموافقين أو إضافة عوامل تصفية أو
الاشتراك في التسليم إلى محادثة المصدر:

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
توجيه مطالبات موافقة exec إلى محادثات أخرى أو أهداف صريحة خارج النطاق. كما أن توجيه `approvals.plugin` المشترك
منفصل أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات plugin عندما تصل تلك الطلبات بالفعل
إلى Slack.

كما يعمل `/approve` داخل نفس المحادثة في قنوات Slack والرسائل الخاصة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للحصول على نموذج توجيه الموافقة الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات الرسائل/حذفها/بث السلاسل إلى أحداث نظام.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عندما تكون `configWrites` مفعلة.
- يُتعامل مع بيانات موضوع/غرض القناة الوصفية على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشَّح رسائل بدء السلسلة وتغذية سياق سجل السلسلة الأولي وفقًا لقوائم سماح المرسلين المكوَّنة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ المشروطة أحداث نظام منظَّمة من نوع `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، وبيانات `workflow_*` الوصفية
  - أحداث النوافذ `view_submission` و `view_closed` مع بيانات القناة الموجَّهة ومدخلات النماذج

## مؤشرات مرجعية للتكوين

المرجع الأساسي:

- [مرجع التكوين - Slack](/ar/gateway/configuration-reference#slack)

  حقول Slack عالية الأهمية:
  - الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - وصول الرسائل الخاصة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ اتركه معطلًا ما لم تكن بحاجة إليه)
  - وصول القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب، من:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`)
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تجاهل رسائل DM">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket لا يتصل">
    تحقّق من bot token و app token وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوَّن ولكن وقت التشغيل الحالي لم يتمكن من حل
    القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - signing secret
    - webhook path
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مكوَّن ولكن وقت التشغيل الحالي لم يتمكن من
    حل signing secret المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر الشرطة المائلة المطابقة والمسجلة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقّق أيضًا من `commands.useAccessGroups` وقوائم سماح القناة/المستخدم.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [التكوين](/ar/gateway/configuration)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
