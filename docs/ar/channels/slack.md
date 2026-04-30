---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع المقابس + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما تُدعم HTTP Request URLs أيضًا.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تعتمد رسائل Slack المباشرة وضع الإقران افتراضيًا.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وخطط إصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (افتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack، اضغط زر **[إنشاء تطبيق جديد](https://api.slack.com/apps/new)**:

        - اختر **من manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** ‏(`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

      </Step>

      <Step title="اضبط OpenClaw">

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

        بديل env الاحتياطي (الحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack، اضغط زر **[إنشاء تطبيق جديد](https://api.slack.com/apps/new)**:

        - اختر **من manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

      </Step>

      <Step title="اضبط OpenClaw">

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
        استخدم مسارات Webhook فريدة للحسابات المتعددة عبر HTTP

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات.
        </Note>

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ضبط نقل Socket Mode

يضبط OpenClaw مهلة pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة عمل أو مضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهل Slack websocket pong/server-ping أو تعمل على مضيفين لديهم جوع معروف في حلقة الأحداث. `clientPingTimeout` هي مدة انتظار pong بعد أن يرسل SDK إشارة ping من العميل؛ و`serverPingTimeout` هي مدة انتظار إشارات ping من خادم Slack. تظل رسائل التطبيق والأحداث حالة للتطبيق، وليست إشارات لحيوية النقل.

## قائمة تحقق manifest والنطاقات

Manifest تطبيق Slack الأساسي هو نفسه في Socket Mode وHTTP Request URLs. يختلف فقط مقطع `settings` (و`url` الخاص بأمر slash).

Manifest الأساسي (Socket Mode افتراضي):

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

بالنسبة إلى **وضع HTTP Request URLs**، استبدل `settings` بمتغير HTTP وأضف `url` إلى كل أمر slash. يلزم URL عام:

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

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر slash أصلية اختيارية">

    يمكن استخدام عدة [أوامر slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مضبوط، مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر slash في وقت واحد.

    استبدل مقطع `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

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
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، يتوقع Slack صياغة `:emoji_name:`.

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

## نموذج الرمز

- يلزم توفير `botToken` + `appToken` لاستخدام Socket Mode.
- يتطلب وضع HTTP توفير `botToken` + `signingSecret`.
- يقبل كل من `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تتجاوز رموز التهيئة الاحتياطي عبر env.
- ينطبق احتياطي env عبر `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) مخصص للتهيئة فقط (لا يوجد احتياطي عبر env) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مهيأ عبر SecretRef
  أو مصدر سر آخر غير مضمّن مباشرة، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة للإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند تهيئته. بالنسبة للكتابات، يظل رمز البوت هو المفضل؛ ولا يُسمح بالكتابات عبر رمز المستخدم إلا عندما يكون `userTokenReadOnly: false` ورمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | --------- |
| messages   | مفعّل |
| reactions  | مفعّل |
| pins       | مفعّل |
| memberInfo | مفعّل |
| emojiList  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack الظاهرة في عناصر نائب الملفات الواردة ويعيد معاينات صور للصور أو بيانات تعريف ملفات محلية لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.slack.dmPolicy` في الوصول عبر DM. تُعد `channels.slack.allowFrom` قائمة السماح الرسمية للـ DM.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام DM:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (DMs الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا يزال يتم قراءة `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمين للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في DMs الأمر `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    يتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات تحت `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack المستقرة** (مثل `C12345678`) كمفاتيح تهيئة.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا تمامًا (إعداد env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح DM عند بدء التشغيل عندما يسمح الوصول بالرمز
    - تُحفظ إدخالات أسماء القنوات غير المحلولة كما هي مهيأة لكنها تُتجاهل افتراضيًا للتوجيه
    - يكون التفويض الوارد وتوجيه القنوات قائمين على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح القائمة على الاسم (`#channel-name` أو `channel-name`) ضمن `groupPolicy: "allowlist"`. يتم البحث عن القناة بالمعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح قائم على الاسم في التوجيه أبدًا وسيتم حظر جميع الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح القائم على الاسم يعمل.

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
    تكون رسائل القنوات مقيدة بالذكر افتراضيًا.

    مصادر الذكر:

    - ذكر التطبيق الصريح (`<@botId>`)
    - أنماط التعبير النمطي للذكر (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك سلسلة الرد على البوت الضمني (معطل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُربط بـ `id:` فقط)

    يكون `allowBots` محافظًا للقنوات والقنوات الخاصة: لا تُقبل رسائل الغرف التي يؤلفها البوت إلا عندما يكون البوت المرسل مدرجًا صراحة في قائمة سماح `users` الخاصة بتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوًا حاليًا في الغرفة. لا تفي أحرف البدل وإدخالات المالك باسم العرض بوجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يسقط OpenClaw رسالة الغرفة التي ألّفها البوت.

  </Tab>
</Tabs>

## السلاسل، والجلسات، ووسوم الرد

- تُوجّه DMs كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع `session.dmScope=main` الافتراضي، تُطوى DMs في Slack إلى الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسات سلسلة (`:thread:<threadTs>`) عند انطباق ذلك.
- الافتراضي لـ `channels.slack.thread.historyScope` هو `thread`؛ والافتراضي لـ `thread.inheritParent` هو `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الحالية التي يتم جلبها عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عند `true`، يكبح إشارات السلسلة الضمنية بحيث لا يستجيب البوت إلا لذكور `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. بدون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- احتياطي قديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطل `replyToMode="off"` **كل** سلاسل الرد في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة بينما تبقى ردود Telegram مرئية ضمن السطر.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- احتياطي رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميًا.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (افتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أداة/تقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي من Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- لا يزال بإمكان جذور القنوات والمحادثات الجماعية استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تظل DMs عالية المستوى في Slack خارج السلسلة افتراضيًا، لذلك لا تعرض معاينة نمط السلسلة؛ استخدم ردود السلاسل أو `typingReaction` إذا أردت تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ نهايات النص/الكتل المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من بث النص الأصلي من Slack:

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

- يتم ترحيل `channels.slack.streamMode` (`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- يتم ترحيل `channels.slack.streaming` المنطقي تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## احتياطي تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا مفيدًا أكثر خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"hourglass_flowing_sand"`).
- التفاعل على أساس أفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الوسائط، والتجزئة، والتسليم

<AccordionGroup>
  <Accordion title="Inbound attachments">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL الخاصة المستضافة على Slack (تدفق طلب موثق بالرمز) وكتابتها إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم. تتضمن عناصر نائب الملفات `fileId` الخاص بـ Slack حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهل خمول ومهل إجمالية محدودة. إذا توقف استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى عنصر نائب الملف.

    الحد الأقصى الافتراضي لحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يقدّم الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات رفع Slack ويمكن أن تتضمن ردودًا في السلاسل (`thread_ts`)
    - يتبع حد الوسائط الصادرة `channels.slack.mediaMaxMb` عند ضبطه؛ وإلا تستخدم عمليات الإرسال في القنوات الافتراضيات حسب نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    تُفتح رسائل Slack المباشرة عبر واجهات محادثات Slack عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مضبوط أو كعدة أوامر أصلية. اضبط `channels.slack.slashCommand` لتغيير افتراضيات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack لديك وتُفعّل بدلًا من ذلك باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة.

- وضع الأوامر الأصلية التلقائي **متوقف** لـ Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع ترشيح غير متزامن للخيارات عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذ الأوامر إلى جلسة المحادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية في الردود التي يكتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

فعّلها عموميًا:

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

تُجمّع هذه التوجيهات إلى Slack Block Kit وتوجه النقرات أو الاختيارات مجددًا عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم معاودة الاتصال التفاعلية هي رموز مبهمة ينشئها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات التنفيذ في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات التنفيذ `channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- يمكن أن تظل موافقات Plugin تُحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلًا إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- يظل تفويض الموافقين مفروضًا: لا يمكن إلا للمستخدمين المعرّفين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack لديك، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عندما تكون هذه الأزرار موجودة، فهي تجربة الموافقة الأساسية؛ وينبغي لـ OpenClaw
ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack تلقائيًا موافقات التنفيذ الأصلية عندما يكون `enabled` غير مضبوط أو `"auto"` ويُحلّ موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack صراحة كعميل موافقة أصلي.
اضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يُحلّ الموافقون.

السلوك الافتراضي دون إعداد صريح لموافقة تنفيذ Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم الإعداد الصريح الأصلي لـ Slack إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
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

إعادة التوجيه المشتركة `approvals.exec` منفصلة. استخدمها فقط عندما يجب أيضًا توجيه مطالبات موافقة التنفيذ
إلى دردشات أخرى أو أهداف صريحة خارج المسار. إعادة التوجيه المشتركة `approvals.plugin` منفصلة أيضًا؛
يمكن لأزرار Slack الأصلية أن تظل تحل موافقات Plugin عندما تصل هذه الطلبات أصلًا
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر أصلًا. راجع [موافقات التنفيذ](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُربط تعديلات الرسائل وحذفها بأحداث النظام.
- تُعالج بثوث السلاسل ("الإرسال إلى القناة أيضًا" في ردود السلاسل) كرسائل مستخدم عادية.
- تُربط أحداث إضافة/إزالة التفاعلات بأحداث النظام.
- تُربط أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيت بأحداث النظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعداد القنوات عند تفعيل `configWrites`.
- تُعامل بيانات وصف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشح بادئة السلسلة وبذر سياق سجل السلسلة الأولي حسب قوائم السماح للمرسلين المضبوطة عند انطباقها.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، وبيانات `workflow_*` الوصفية
  - أحداث modal `view_submission` و`view_closed` مع بيانات وصفية للقناة الموجهة ومدخلات النموذج

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ اتركه متوقفًا ما لم تكن بحاجة إليه)
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
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المستندة إلى الاسم بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولًا افتراضيًا. للعثور على معرّف: انقر بزر الفأرة الأيمن على القناة في Slack ← **نسخ الرابط** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
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
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث رسائل Slack Assistant المباشرة: السجلات المفصلة التي تذكر `drop message_changed`
      تعني عادة أن Slack أرسل حدث سلسلة Assistant معدّلًا بدون
      مرسل بشري قابل للاسترداد في بيانات وصف الرسالة

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع المقبس لا يتصل">
    تحقق من رموز bot + app وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` القيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مضبوط لكن وقت التشغيل الحالي لم يتمكن من حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين طلب Slack URL (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مضبوط لكن وقت التشغيل الحالي لم يتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر الشرطة المائلة المطابقة المسجلة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المنزلة بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ وتُحفظ الملفات الأخرى كسياق ملفات قابل للتنزيل بدلًا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                    | المصدر              | السلوك الحالي                                                                      | ملاحظات                                                                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان ملف Slack URL | تُنزّل وتُرفق بالدورة لمعالجة قادرة على الرؤية                                   | حد كل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان ملف Slack URL | تُنزّل وتُعرض كسياق ملف لأدوات مثل `download-file` أو `pdf`                      | لا يحوّل وارد Slack ملفات PDF تلقائيًا إلى مدخلات رؤية الصور            |
| ملفات أخرى                    | عنوان ملف Slack URL | تُنزّل عندما يكون ذلك ممكنًا وتُعرض كسياق ملف                                    | لا تُعامل الملفات الثنائية كمدخلات صور                                   |
| ردود السلاسل                  | ملفات بادئ السلسلة | يمكن ترطيب ملفات رسالة الجذر كسياق عندما لا يحتوي الرد على وسائط مباشرة         | تستخدم بادئات الملفات فقط عنصرًا نائبًا للمرفق                           |
| رسائل متعددة الصور            | عدة ملفات Slack     | يُقيّم كل ملف بشكل مستقل                                                          | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                            |

### المسار الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزّلة وأنواع المحتوى إلى السياق الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على معالجة الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات القادرة على التعامل معها.

### وراثة مرفقات جذر السلسلة

عندما تصل رسالة في سلسلة (لها أصل `thread_ts`):

- إذا لم يتضمن الرد نفسه وسائط مباشرة وكانت رسالة الجذر المضمّنة تحتوي على ملفات، فيمكن لـ Slack تعبئة ملفات الجذر كسياق بادئ للسلسلة.
- تكون لمرفقات الرد المباشرة أولوية على مرفقات رسالة الجذر.
- تُمثَّل رسالة الجذر التي تحتوي على ملفات فقط دون نص بعنصر نائب للمرفق بحيث يظل بإمكان المسار الاحتياطي تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يُعالَج كل مرفق بشكل مستقل عبر مسار معالجة الوسائط.
- تُجمَّع مراجع الوسائط المنزّلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل مرفق واحد معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 ميغابايت لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: تُتخطى الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية، والملفات غير القابلة للوصول، والملفات المتجاوزة للحجم، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack بدلاً من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهي لملف Slack                 | يُتخطى الملف؛ لا يظهر أي خطأ                                                 | أعد رفع الملف في Slack                                                |
| نموذج الرؤية غير مهيأ            | تُخزَّن مرفقات الصور كمراجع وسائط، لكنها لا تُحلَّل كصور | هيّئ `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية |
| صور كبيرة جدًا (> 20 ميغابايت افتراضيًا) | تُتخطى وفق حد الحجم                                                         | زِد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| مرفقات مُعاد توجيهها/مشاركتها           | يُتعامل مع النص ووسائط الصور/الملفات المستضافة على Slack بأفضل جهد                       | أعد المشاركة مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزَّن كسياق ملف/وسائط، ولا تُوجَّه تلقائيًا عبر رؤية الصور  | استخدم `download-file` لبيانات الملف الوصفية أو أداة `pdf` لتحليل PDF   |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- الملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق الحي: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Slack بالـ Gateway.
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
    تخطيط التهيئة والأسبقية.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
