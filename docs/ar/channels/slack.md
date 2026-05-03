---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع المقبس + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T07:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن HTTP Request URLs مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تعتمد رسائل Slack المباشرة افتراضيًا على وضع الاقتران.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات وأدلة إصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **من ملف بيان** وحدد مساحة عمل لتطبيقك
        - الصق [ملف البيان المثال](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** ‏(`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

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

        بديل Env الاحتياطي (الحساب الافتراضي فقط):

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

        - اختر **من ملف بيان** وحدد مساحة عمل لتطبيقك
        - الصق [ملف البيان المثال](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

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

يضبط OpenClaw مهلة pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط مخصص لمساحة عمل أو مضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات pong/server-ping في WebSocket الخاص بـ Slack أو تعمل على مضيفين لديهم جوع معروف في حلقة الأحداث. `clientPingTimeout` هي مدة انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ و`serverPingTimeout` هي مدة انتظار إشارات ping من خادم Slack. تبقى رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات لحيوية النقل.

## قائمة تحقق ملف البيان والنطاقات

ملف بيان تطبيق Slack الأساسي هو نفسه لكل من Socket Mode وHTTP Request URLs. يختلف فقط قالب `settings` (و`url` الخاص بأمر slash).

ملف البيان الأساسي (افتراضي Socket Mode):

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

بالنسبة إلى وضع **HTTP Request URLs**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر slash. يلزم URL عام:

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

### إعدادات ملف بيان إضافية

اكشف ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

يمكّن ملف البيان الافتراضي تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا آمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو إعدادات خاصة. يبقى تبويب **Messages** ممكّنًا لرسائل Slack المباشرة.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    يمكن استخدام عدة [أوامر slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوّن مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر slash في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
  <Accordion title="Optional authorship scopes (write operations)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    إذا ضبطت `channels.slack.userToken`، تكون نطاقات القراءة المعتادة هي:

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

- يلزم `botToken` + `appToken` من أجل Socket Mode.
- يتطلب وضع HTTP وجود `botToken` + `signingSecret`.
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تتجاوز رموز الضبط المميزة بديل env.
- ينطبق بديل env ‏`SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) متاح عبر الضبط فقط (بلا بديل env) ويستخدم افتراضيا سلوكا للقراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل اعتماد (`botToken`، `appToken`، `signingSecret`، `userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر أسرار آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم المميز عند ضبطه. أما بالنسبة إلى الكتابات، فيظل رمز bot المميز مفضلا؛ ولا يسمح بكتابات رمز المستخدم المميز إلا عند ضبط `userTokenReadOnly: false` وعدم توفر رمز bot المميز.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | ------- |
| messages   | مفعل |
| reactions  | مفعل |
| pins       | مفعل |
| memberInfo | مفعل |
| emojiList  | مفعل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح الرسمية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (القيمة الافتراضية true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية قيمتها الافتراضية false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    ما زال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمان يقرآن للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك من دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` و**يجب أن تستخدم معرفات قنوات Slack الثابتة** (على سبيل المثال `C12345678`) كمفاتيح ضبط.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودا بالكامل (إعداد عبر env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطا).

    حل الاسم/المعرف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز المميز بذلك
    - تبقى إدخالات أسماء القنوات غير المحلولة كما ضبطت، لكنها تتجاهل للتوجيه افتراضيا
    - التخويل الوارد وتوجيه القنوات يعتمدان على المعرف أولا افتراضيا؛ تتطلب مطابقة اسم المستخدم/المعرّف النصي المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تطابق المفاتيح المعتمدة على الاسم (`#channel-name` أو `channel-name`) عند `groupPolicy: "allowlist"`. يكون البحث عن القناة معتمدا على المعرف أولا افتراضيا، لذلك لن ينجح مفتاح يعتمد على الاسم في التوجيه أبدا، وستحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبا للتوجيه ويبدو أن المفتاح المعتمد على الاسم يعمل.

    استخدم دائما معرف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — يظهر المعرف (`C...`) في نهاية عنوان URL.

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

    غير صحيح (يحظر بصمت عند `groupPolicy: "allowlist"`):

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
    رسائل القنوات محكومة بالمنشن افتراضيا.

    مصادر المنشن:

    - منشن صريح للتطبيق (`<@botId>`)
    - منشن مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم bot عضوا في مجموعة المستخدمين تلك؛ يتطلب `usergroups:read`
    - أنماط regex للمنشن (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة bot (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف بدل `"*"`
      (ما زالت المفاتيح القديمة بلا بادئة تطابق `id:` فقط)

    `allowBots` محافظ للقنوات والقنوات الخاصة: تقبل رسائل الغرف المكتوبة بواسطة bot فقط عندما يكون bot المرسل مدرجا صراحة في قائمة سماح `users` الخاصة بتلك الغرفة، أو عندما يكون معرف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوا حاليا في الغرفة. لا تفي أحرف البدل وإدخالات مالك اسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يسقط OpenClaw رسالة الغرفة المكتوبة بواسطة bot.

  </Tab>
</Tabs>

## السلاسل، والجلسات، ووسوم الرد

- توجه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل روابط مسار Slack معرفات النظراء الخام إضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تطوى رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسة السلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الحالية التي تجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه إلى `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تمنع المنشنات الضمنية في السلسلة لكي لا يستجيب bot إلا لمنشنات `@bot` الصريحة داخل السلاسل، حتى عندما يكون bot قد شارك بالفعل في السلسلة. من دون هذا، تتجاوز الردود في سلسلة شارك فيها bot بوابة `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- بديل قديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطل `replyToMode="off"` **كل** سلاسل الرد في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث ما زالت الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل عن القناة، بينما تبقى ردود Telegram مرئية ضمن السياق.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزا قصيرة (على سبيل المثال `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميا.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (افتراضي): استبدال نص المعاينة بأحدث خرج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجه تحديثات الأدوات/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه إلى `false` للاحتفاظ برسائل أدوات/تقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة حتى يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. ما زال اختيار السلسلة يتبع `replyToMode`.
- ما زال بإمكان القنوات، والدردشات الجماعية، وجذور الرسائل المباشرة في المستوى الأعلى استخدام معاينة المسودة العادية عندما لا يتوفر البث الأصلي أو لا توجد سلسلة رد.
- تبقى رسائل Slack المباشرة في المستوى الأعلى خارج السلسلة افتراضيا، لذلك لا تعرض معاينة البث/الحالة الأصلية بنمط سلسلة Slack؛ بدلا من ذلك ينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويعدلها.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي نهائيات الوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تدفع نهائيات النص/الكتل المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
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

## بديل تفاعل الكتابة

يضيف `typingReaction` تفاعلا مؤقتا إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزا قصيرة (على سبيل المثال `"hourglass_flowing_sand"`).
- التفاعل يبذل فيه أفضل جهد، وتتم محاولة التنظيف تلقائيا بعد اكتمال الرد أو مسار الفشل.

## الوسائط، والتجزئة، والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلبات موثّق بالرمز المميز) وتُكتب إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك. تتضمن العناصر النائبة للملفات `fileId` الخاص بـ Slack حتى يتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهل انتهاء محدودة للخمول والوقت الإجمالي. إذا تعطل استرداد ملفات Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى العنصر النائب للملف.

    حد الحجم الوارد أثناء التشغيل يكون افتراضيًا `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم مع أولوية الفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للرفع في Slack ويمكن أن تتضمن ردود السلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات الإرسال في القناة القيم الافتراضية حسب نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن للرسائل المباشرة في Slack التي تحتوي على نص/كتل فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما رفع الملفات والإرسال ضمن السلاسل فيفتحان الرسالة المباشرة أولًا عبر واجهات API لمحادثات Slack لأن هذه المسارات تتطلب معرّف محادثة محددًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوّن أو كأوامر أصلية متعددة. كوّن `channels.slack.slashCommand` لتغيير افتراضيات الأمر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **متوقفًا** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيّفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع ترشيح خيارات غير متزامن عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفّرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجّه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم للردود التفاعلية التي يكتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

تُجمَّع هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو الاختيارات مرة أخرى عبر مسار حدث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم رد الاتصال التفاعلية هي رموز مبهمة يولدها OpenClaw، وليست قيمًا خامًا يكتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec `channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- لا يزال بإمكان موافقات Plugin أن تُحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- لا يزال يتم فرض تفويض الموافقين: يمكن فقط للمستخدمين المحددين كموافقين قبول الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ وينبغي لـ OpenClaw
أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو `"auto"` ويتم حل
موافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحةً.
عيّن `enabled: true` لفرض تفعيل الموافقات الأصلية عندما يتم حل الموافقين.

السلوك الافتراضي من دون تكوين صريح لموافقة Exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا تكون التهيئة الأصلية الخاصة بـ Slack مطلوبة إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
اختيار التسليم إلى دردشة المنشأ:

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

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أن تُوجّه مطالبات موافقة Exec أيضًا
إلى دردشات أخرى أو أهداف صريحة خارج النطاق. إعادة توجيه `approvals.plugin` المشتركة منفصلة أيضًا؛
لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلًا
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر أصلًا. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات/حذف الرسائل إلى أحداث نظام.
- تُعالج بثوث السلاسل ("إرسال أيضًا إلى القناة" لردود السلاسل) كرسائل مستخدم عادية.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيتات إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عندما يكون `configWrites` مفعّلًا.
- تُعامل بيانات موضوع/غرض القناة الوصفية كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ السلسلة وبذر سياق محفوظات السلسلة الأولية بواسطة قوائم سماح المرسلين المكوّنة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظّمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات `workflow_*` الوصفية
  - أحداث `view_submission` و`view_closed` الخاصة بالنوافذ مع بيانات وصفية للقناة الموجّهة ومدخلات النماذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- وصول الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (للحالات الطارئة؛ أبقه متوقفًا إلا عند الحاجة)
- وصول القناة: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/المحفوظات: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، لا أسماء (`#channel-name`). تفشل المفاتيح المعتمدة على الأسماء بصمت ضمن `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack → **نسخ الرابط** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تجاهل رسائل الرسائل المباشرة">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الإقران / إدخالات قائمة السماح
    - أحداث رسائل Slack Assistant المباشرة: السجلات المطوّلة التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدث سلسلة Assistant معدّلًا من دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket غير متصل">
    تحقق من رموز bot + app وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا عرض `openclaw channels status --probe --json` الحالة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن، لكن وقت التشغيل الحالي تعذّر عليه حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل أحداثًا">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي تعذّر عليه
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأمر الأصلي (`channels.slack.commands.native: true`) مع أوامر الشرطة المائلة المطابقة المسجلة في Slack
    - أو وضع أمر الشرطة المائلة المفرد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المنزلة بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم بذلك. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ وتُحتفظ بالملفات الأخرى كسياق ملفات قابل للتنزيل بدلًا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                  | المصدر                      | السلوك الحالي                                                                       | ملاحظات                                                                                |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack | يتم تنزيلها وإرفاقها بالدور للمعالجة القادرة على الرؤية                             | حد لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack | يتم تنزيلها وإتاحتها كسياق ملف لأدوات مثل `download-file` أو `pdf`                 | لا يحوّل الإدخال الوارد من Slack ملفات PDF تلقائيًا إلى مُدخلات رؤية صور |
| ملفات أخرى                    | عنوان URL لملف Slack | يتم تنزيلها عند الإمكان وإتاحتها كسياق ملف                                          | لا تُعامل الملفات الثنائية كمُدخلات صور                                   |
| ردود السلاسل                 | ملفات الرسالة الأصلية للسلسلة | يمكن ترطيب ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة        | تستخدم الرسائل الأصلية التي تحتوي على ملفات فقط عنصرًا نائبًا للمرفق     |
| رسائل متعددة الصور           | ملفات Slack متعددة   | يتم تقييم كل ملف بشكل مستقل                                                        | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                            |

### مسار الإدخال الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. تتم كتابة الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزلة وأنواع المحتوى إلى سياق الإدخال الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات تعريف ملف أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### توريث مرفقات أصل السلسلة

عند وصول رسالة في سلسلة (تحتوي على أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذرية المضمّنة تحتوي على ملفات، يمكن لـ Slack ترطيب الملفات الجذرية كسياق بادئ السلسلة.
- تكون لمرفقات الرد المباشر أولوية على مرفقات الرسالة الجذرية.
- تُعرض الرسالة الجذرية التي تحتوي على ملفات فقط دون نص باستخدام عنصر نائب للمرفق حتى يتمكن المسار الاحتياطي من تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على مرفقات ملفات متعددة:

- تتم معالجة كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمع مراجع الوسائط المنزلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل مرفق واحد معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية، والملفات غير المتاحة، والملفات كبيرة الحجم، واستجابات HTML الخاصة بالمصادقة/تسجيل الدخول في Slack بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### حدود معروفة

| السيناريو                              | السلوك الحالي                                                               | الحل البديل                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهٍ لملف Slack             | يتم تخطي الملف؛ لا يظهر أي خطأ                                               | أعد رفع الملف في Slack                                                      |
| نموذج الرؤية غير مهيأ                 | تُخزن مرفقات الصور كمراجع وسائط، لكنها لا تُحلل كصور                         | هيّئ `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية      |
| صور كبيرة جدًا (> 20 MB افتراضيًا)    | يتم تخطيها حسب حد الحجم                                                      | زد `channels.slack.mediaMaxMb` إذا سمح Slack بذلك                          |
| مرفقات مُعاد توجيهها/مشاركتها         | يتم التعامل مع النصوص ووسائط الصور/الملفات المستضافة على Slack بأفضل جهد    | أعد مشاركتها مباشرة في سلسلة OpenClaw                                      |
| مرفقات PDF                            | تُخزن كسياق ملف/وسائط، ولا تُوجّه تلقائيًا عبر رؤية الصور                    | استخدم `download-file` لبيانات تعريف الملف أو أداة `pdf` لتحليل PDF        |

### وثائق ذات صلة

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
    سلوك القنوات ورسائل DM الجماعية.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية الأمنية.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ar/gateway/configuration">
    تخطيط الإعدادات وأسبقيتها.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر وسلوكها.
  </Card>
</CardGroup>
