---
read_when:
    - إعداد Slack أو استكشاف أخطاء وضع المقبس/HTTP في Slack وإصلاحها
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T21:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d902fbbad23cee9b3f0ab7d240845b7b229e2d2507c5ea1d1a0fa3baa915d80a
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما تُدعم HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    الرسائل المباشرة في Slack تستخدم وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (افتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

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

        بديل متغيرات البيئة (الحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="بدء تشغيل Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

      </Step>

      <Step title="تهيئة OpenClaw">

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

      <Step title="بدء تشغيل Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ضبط نقل Socket Mode

يضبط OpenClaw مهلة pong لعميل Slack SDK على 15 ثانية افتراضيًا لـ Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة العمل أو المضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات websocket pong/server-ping من Slack أو تعمل على مضيفين لديهم تجويع معروف في حلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK نبضة ping من العميل؛ و`serverPingTimeout` هو انتظار نبضات ping من خادم Slack. تبقى رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات لحيوية النقل.

## قائمة تحقق البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه لـ Socket Mode وHTTP Request URLs. يختلف فقط مقطع `settings` (و`url` الخاص بأمر الشرطة المائلة).

البيان الأساسي (Socket Mode افتراضيًا):

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

بالنسبة إلى وضع **HTTP Request URLs**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم عنوان URL عام:

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

### إعدادات بيان إضافية

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

يمكّن البيان الافتراضي تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا آمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو تهيئة خاصة. يبقى تبويب **Messages** مفعّلًا للرسائل المباشرة في Slack.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مهيأ مع قدر من التفصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن أمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (افتراضي)">

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
```

      </Tab>
      <Tab title="HTTP Request URLs">
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
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلاً من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات رمز المستخدم الاختيارية (عمليات القراءة)">
    إذا ضبطت `channels.slack.userToken`، فإن نطاقات القراءة النموذجية هي:

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

- `botToken` + `appToken` مطلوبان لـ Socket Mode.
- يتطلب وضع HTTP كلاً من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تتجاوز رموز الضبط بديل env.
- ينطبق بديل env المتمثل في `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالضبط فقط (بلا بديل env) ويكون افتراضياً بسلوك قراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سرّي آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يُضمّن `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما بالنسبة إلى عمليات الكتابة، فيظل رمز البوت مفضلاً؛ ولا يُسمح بكتابات رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
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

تشمل إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في مواضع ملفات الوارد، ويعيد معاينات صور للصور أو بيانات وصفية لملفات محلية لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة DM">
    يتحكم `channels.slack.dmPolicy` في وصول DM. ويُعد `channels.slack.allowFrom` قائمة السماح الأساسية لـ DM.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام DM:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (القيمة الافتراضية لـ DM الجماعي هي false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسمّاة `channels.slack.allowFrom` عندما لا يكون `allowFrom` الخاص بها مضبوطاً.
    - لا ترث الحسابات المسمّاة `channels.slack.accounts.default.allowFrom`.

    لا يزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في DM الأمر `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` ويجب **أن تستخدم معرّفات قنوات Slack المستقرة** (مثلاً `C12345678`) كمفاتيح ضبط.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقوداً بالكامل (إعداد env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيراً (حتى إذا كان `channels.defaults.groupPolicy` مضبوطاً).

    حل الاسم/المعرّف:

    - تُحل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح DM عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تُحفظ إدخالات أسماء القنوات غير المحلولة كما ضُبطت، لكنها تُتجاهل افتراضياً في التوجيه
    - يكون التفويض الوارد وتوجيه القنوات قائمين على المعرّف أولاً افتراضياً؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح القائمة على الاسم (`#channel-name` أو `channel-name`) تحت `groupPolicy: "allowlist"`. يكون بحث القناة قائماً على المعرّف أولاً افتراضياً، لذا لن ينجح مفتاح قائم على الاسم في التوجيه أبداً وستُحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوباً للتوجيه ويبدو أن المفتاح القائم على الاسم يعمل.

    استخدم دائماً معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — يظهر المعرّف (`C...`) في نهاية URL.

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
    تكون رسائل القنوات مقيّدة بالإشارات افتراضياً.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضواً في تلك المجموعة؛ تتطلب `usergroups:read`
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، مع بديل `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على سلسلة البوت (معطّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء عبر حل بدء التشغيل فقط أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُطابق `id:` فقط)

    `allowBots` محافظ للقنوات والقنوات الخاصة: لا تُقبل رسائل الغرف المؤلفة بواسطة بوت إلا عندما يكون البوت المُرسِل مدرجاً صراحة في قائمة سماح `users` الخاصة بتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضواً حالياً في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل بحث الأعضاء، يُسقط OpenClaw رسالة الغرفة المؤلفة بواسطة البوت.

  </Tab>
</Tabs>

## السلاسل والجلسات ووسوم الرد

- تُوجّه DM كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل روابط مسارات Slack معرّفات النظراء الخام بالإضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تُدمج DM في Slack في جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسات سلاسل (`:thread:<threadTs>`) عند الانطباق.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، يمنع الإشارات الضمنية في السلسلة بحيث لا يستجيب البوت إلا لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- بديل قديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطّل `replyToMode="off"` **كل** تسلسل الردود في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تُخفي سلاسل Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية ضمن السطر.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار بينما يعالج OpenClaw رسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزاً قصيرة (مثلاً `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالمياً.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (افتراضي): استبدال نص المعاينة بأحدث إخراج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة نفسها التي تُعدّل (الافتراضي: `true`). اضبطها على `false` لإبقاء رسائل الأداة/التقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- يمكن لجذور القنوات والمحادثات الجماعية وDM على المستوى الأعلى أن تستخدم معاينة المسودة العادية عندما يكون البث الأصلي غير متاح أو لا توجد سلسلة رد.
- تبقى DM في Slack على المستوى الأعلى خارج السلاسل افتراضياً، لذلك لا تُظهر معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ ينشر OpenClaw بدلاً من ذلك معاينة مسودة في DM ويعدلها.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهائيات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُرسل نهائيات النص/الكتل المؤهلة إلا عندما تستطيع تعديل المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلاً من بث النص الأصلي في Slack:

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

- يُرحّل `channels.slack.streamMode` (`replace | status_final | append`) تلقائياً إلى `channels.slack.streaming.mode`.
- تُرحّل القيمة المنطقية `channels.slack.streaming` تلقائياً إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يُرحّل `channels.slack.nativeStreaming` القديم تلقائياً إلى `channels.slack.streaming.nativeTransport`.

## بديل تفاعل الكتابة

يضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة بينما يعالج OpenClaw رداً، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضياً "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack الاختصارات النصية (على سبيل المثال `"hourglass_flowing_sand"`).
- يكون التفاعل بأفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلب مصادق بالرمز المميز) وكتابتها إلى مخزن الوسائط عند نجاح الجلب وسماح حدود الحجم. تتضمن عناصر نائب الملفات `fileId` الخاص بـ Slack حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهلًا محدودة للخمول والإجمالي. إذا تعطل استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى عنصر نائب الملف.

    يكون حد الحجم الوارد في وقت التشغيل افتراضيًا `20MB` ما لم يتم تجاوزه عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يعطي أولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للتحميل في Slack ويمكنها تضمين ردود السلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات إرسال القناة الافتراضيات حسب نوع MIME من مسار معالجة الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` لرسائل DM
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack DM النصية/الكتلية فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما تحميلات الملفات والإرسال ضمن السلاسل فتفتح رسالة DM عبر واجهات API لمحادثات Slack أولًا لأن هذه المسارات تتطلب معرّف محادثة ملموسًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو عدة أوامر أصلية. كوّن `channels.slack.slashCommand` لتغيير افتراضات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تمكينها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **متوقفًا** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع ترشيح غير متزامن للخيارات عند توفر معالجات خيارات التفاعل
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمزة إلى الأزرار

```txt
/think
```

تستخدم جلسات أوامر الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية في الردود التي ينشئها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

مكّنها عموميًا:

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

أو مكّنها لحساب Slack واحد فقط:

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

عند تمكينها، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُحوّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم رد النداء التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيمًا خامًا يكتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec `channels.slack.execApprovals.*` للتوجيه الأصلي إلى رسائل DM/القنوات.
- لا يزال بإمكان موافقات Plugin الحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- يظل تفويض الموافقين مفروضًا: لا يمكن إلا للمستخدمين المحددين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تمكين `interactivity` في إعدادات تطبيق Slack الخاص بك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يمكّن Slack موافقات exec الأصلية تلقائيًا عندما يكون `enabled` غير معيّن أو `"auto"` ويتم حل
موافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحة.
عيّن `enabled: true` لفرض تشغيل الموافقات الأصلية عند حل الموافقين.

السلوك الافتراضي من دون تكوين صريح لموافقة exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم التكوين الأصلي الصريح لـ Slack إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
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

يكون تمرير `approvals.exec` المشترك منفصلًا. استخدمه فقط عندما يجب أيضًا
توجيه مطالبات موافقة exec إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما يكون تمرير `approvals.plugin` المشترك
منفصلًا؛ لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلًا
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack ورسائل DM التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج تمرير الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُربط تعديلات/حذف الرسائل بأحداث النظام.
- تتم معالجة بث السلاسل (ردود السلاسل مع "الإرسال أيضًا إلى القناة") كرسائل مستخدم عادية.
- تُربط أحداث إضافة/إزالة التفاعلات بأحداث النظام.
- تُربط أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت بأحداث النظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القنوات عند تمكين `configWrites`.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وتعبئة سياق سجل السلسلة الأولي حسب قوائم السماح للمرسلين المكوّنة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، وبيانات `workflow_*` الوصفية
  - أحداث `view_submission` و`view_closed` للنوافذ مع بيانات القناة الوصفية الموجهة ومدخلات النماذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الإشارة">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- وصول DM: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (كسر طارئ؛ اتركه متوقفًا ما لم تكن هناك حاجة)
- وصول القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق بالترتيب:

    - `groupPolicy`
    - قائمة السماح للقنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح القائمة على الاسم بصمت ضمن `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الفأرة الأيمن على القناة في Slack → **نسخ الرابط** — تكون قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة السماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="يتم تجاهل رسائل DM">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث Slack Assistant DM: عادةً ما تعني السجلات المطولة التي تذكر `drop message_changed`
      أن Slack أرسل حدث سلسلة Assistant معدّلًا من دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket mode لا يتصل">
    تحقق من رموز bot + app وتمكين Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي لم يتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأمر الأصلي (`channels.slack.commands.native: true`) مع أوامر شرطة مائلة مطابقة مسجلة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع الرؤية للمرفقات

يمكن لـ Slack إرفاق الوسائط التي تم تنزيلها بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ بينما تُحتفظ بالملفات الأخرى كسياق ملفات قابلة للتنزيل بدلًا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                     | المصدر               | السلوك الحالي                                                                  | ملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack       | يتم تنزيلها وإرفاقها بالدورة لمعالجة قادرة على الرؤية                   | حد كل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack       | يتم تنزيلها وإتاحتها كسياق ملف للأدوات مثل `download-file` أو `pdf` | لا يحول الإدخال الوارد من Slack ملفات PDF تلقائيا إلى إدخال رؤية صوري |
| ملفات أخرى                    | عنوان URL لملف Slack       | يتم تنزيلها عند الإمكان وإتاحتها كسياق ملف                              | لا تعامل الملفات الثنائية كإدخال صوري                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن تهيئة ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم البوادئ التي تحتوي على ملفات فقط عنصرا نائبا للمرفق                          |
| رسائل متعددة الصور           | ملفات Slack متعددة | يتم تقييم كل ملف بشكل مستقل                                              | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                     |

### مسار الإدخال الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يكتب الملف في مخزن الوسائط عند النجاح.
3. تضاف مسارات الوسائط المنزلة وأنواع المحتوى إلى سياق الإدخال الوارد.
4. يمكن لمسارات النموذج/الأداة القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تظل الملفات غير الصورية متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عند وصول رسالة في سلسلة (لها أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذرية المضمنة تحتوي على ملفات، يمكن لـ Slack تهيئة ملفات الجذر كسياق بادئ للسلسلة.
- مرفقات الرد المباشرة لها أولوية على مرفقات الرسالة الجذرية.
- تمثل الرسالة الجذرية التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق، كي يظل بإمكان مسار الاحتياط تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يعالج كل مرفق بشكل مستقل عبر مسار الوسائط.
- تجمع مراجع الوسائط المنزلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل مرفق واحد معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **فشل التنزيل**: يتم تخطي الملفات التي يتعذر على Slack تقديمها، وعناوين URL المنتهية الصلاحية، والملفات غير القابلة للوصول، والملفات التي تتجاوز الحجم، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack، بدلا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### حدود معروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منته الصلاحية لملف Slack                 | يتم تخطي الملف؛ لا يظهر خطأ                                                 | أعد رفع الملف في Slack                                                |
| لم تتم تهيئة نموذج الرؤية            | تخزن مرفقات الصور كمراجع وسائط، لكنها لا تحلل كصور | هيئ `agents.defaults.imageModel` أو استخدم نموذج رد قادر على الرؤية |
| صور كبيرة جدا (> 20 MB افتراضيا) | يتم تخطيها حسب حد الحجم                                                         | زد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| المرفقات المعاد توجيهها/المشتركة           | النص والوسائط الصورية/الملفات المستضافة على Slack تعمل بأفضل جهد                       | أعد المشاركة مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تخزن كسياق ملف/وسائط، ولا توجه تلقائيا عبر الرؤية الصورية  | استخدم `download-file` للبيانات الوصفية للملف أو أداة `pdf` لتحليل PDF   |

### وثائق ذات صلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- ملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Slack بالـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك القنوات ورسائل DM الجماعية.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية الأمنية.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ar/gateway/configuration">
    تخطيط التهيئة وترتيب الأولوية.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر وسلوكها.
  </Card>
</CardGroup>
