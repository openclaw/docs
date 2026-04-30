---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T07:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين HTTP Request URLs مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وكتيبات إصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

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

        بديل env الاحتياطي (الحساب الافتراضي فقط):

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
        - الصق [البيان النموذجي](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

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

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتعارض التسجيلات.
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

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. لا تتجاوز إعدادات النقل إلا عندما تحتاج إلى ضبط خاص بمساحة العمل أو المضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهلات Slack websocket pong/server-ping أو تعمل على مضيفين لديهم تجويع معروف في حلقة الأحداث. `clientPingTimeout` هو انتظار pong بعد أن يرسل SDK ping من العميل؛ و`serverPingTimeout` هو انتظار ping من خوادم Slack. تبقى رسائل التطبيق وأحداثه حالة تطبيق، وليست إشارات حيوية للنقل.

## قائمة تحقق البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه لكل من Socket Mode وHTTP Request URLs. يختلف فقط مقطع `settings` (و`url` لأمر slash).

البيان الأساسي (Socket Mode الافتراضي):

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

بالنسبة إلى **وضع HTTP Request URLs**، استبدل `settings` بنسخة HTTP وأضف `url` إلى كل أمر slash. يلزم عنوان URL عام:

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

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    يمكن استخدام عدة [أوامر slash أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مُعدّ مع بعض الفروق الدقيقة:

    - استخدم `/agentstatus` بدلًا من `/status` لأن أمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر slash في الوقت نفسه.

    استبدل مقطع `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

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
    إذا أعددت `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

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

- `botToken` + `appToken` مطلوبان لـ Socket Mode.
- يتطلب وضع HTTP كلاً من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تتجاوز رموز الإعدادات الرجوع الاحتياطي إلى env.
- ينطبق الرجوع الاحتياطي إلى env عبر `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالإعدادات فقط (بلا رجوع احتياطي إلى env) ويستخدم افتراضياً سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل بيانات اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- الحالة هي `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر سرّي آخر غير مضمّن مباشرة، لكن مسار الأمر/وقت التشغيل الحالي
  تعذر عليه حل القيمة الفعلية.
- في وضع HTTP، يُضمَّن `signingSecretStatus`؛ وفي Socket Mode،
  يكون الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما بالنسبة إلى عمليات الكتابة، فيبقى رمز البوت مفضلاً؛ ولا يُسمح بعمليات الكتابة عبر رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
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

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack المعروضة في عناصر نائبة للملفات الواردة ويعيد معاينات صور للصور أو بيانات تعريف ملف محلي لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح القياسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    علامات الرسائل المباشرة:

    - `dm.enabled` (افتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضياً false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على حساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا تزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمتان تُقرأان للتوافق. ينقل `openclaw doctor --fix` هذه القيم إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك من دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القناة">
    تتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` و**يجب أن تستخدم معرّفات قنوات Slack المستقرة** (مثلاً `C12345678`) كمفاتيح إعداد.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة تماماً (إعداد env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيراً (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    حل الاسم/المعرّف:

    - تُحل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تبقى إدخالات أسماء القنوات غير المحلولة كما ضُبطت، لكنها تُتجاهل للتوجيه افتراضياً
    - تكون صلاحية الوارد وتوجيه القنوات مبنيين على المعرّف أولاً افتراضياً؛ وتتطلب مطابقة اسم المستخدم/المعرف النصي مباشرةً `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    المفاتيح المعتمدة على الاسم (`#channel-name` أو `channel-name`) لا تتطابق ضمن `groupPolicy: "allowlist"`. يكون البحث عن القناة مبنياً على المعرّف أولاً افتراضياً، لذا لن ينجح المفتاح المعتمد على الاسم أبداً في التوجيه وستُحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوباً للتوجيه ويبدو أن المفتاح المعتمد على الاسم يعمل.

    استخدم دائماً معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack → **نسخ الرابط** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

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

  <Tab title="الإشارات ومستخدمي القنوات">
    تكون رسائل القناة محكومة بالإشارة افتراضياً.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، مع رجوع احتياطي إلى `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على سلسلة البوت (يُعطّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو محرف بدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُعيّن إلى `id:` فقط)

  </Tab>
</Tabs>

## السلاسل، والجلسات، ووسوم الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع `session.dmScope=main` الافتراضي، تُدمج رسائل Slack المباشرة في جلسة الوكيل الرئيسية.
- جلسات القناة: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسات للسلاسل (`:thread:<threadTs>`) عند انطباق ذلك.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (افتراضياً `20`؛ اضبطها على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (افتراضياً `false`): عندما تكون `true`، تكبح الإشارات الضمنية في السلسلة بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون ذلك، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.replyToMode`: `off|first|all|batched` (افتراضياً `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- الرجوع الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
تعطل `replyToMode="off"` **كل** تسلسل الردود في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة بينما تبقى ردود Telegram مرئية ضمنياً.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزاً تعبيرياً للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الرجوع الاحتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack الرموز المختصرة (مثلاً `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالمياً.

## بث النص

تتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (افتراضي): استبدال نص المعاينة بأحدث ناتج جزئي.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: إظهار نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المحررة نفسها (افتراضياً: `true`). اضبطها على `false` للإبقاء على رسائل الأداة/التقدم منفصلة.

تتحكم `channels.slack.streaming.nativeTransport` في بث نص Slack الأصلي عندما يكون `channels.slack.streaming.mode` هو `partial` (افتراضياً: `true`).

- يجب أن تكون سلسلة رد متاحة ليظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- لا تزال جذور القنوات ومحادثات المجموعات تستطيع استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحاً.
- تبقى رسائل Slack المباشرة في المستوى الأعلى خارج السلسلة افتراضياً، لذلك لا تعرض المعاينة بنمط السلسلة؛ استخدم ردود السلاسل أو `typingReaction` إذا أردت تقدماً مرئياً هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهائيات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ النهائيات النصية/الكتلية المؤهلة إلا عندما تستطيع تحرير المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلاً من بث نص Slack الأصلي:

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

- يُنقل `channels.slack.streamMode` (`replace | status_final | append`) تلقائياً إلى `channels.slack.streaming.mode`.
- تُنقل `channels.slack.streaming` المنطقية تلقائياً إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يُنقل `channels.slack.nativeStreaming` القديم تلقائياً إلى `channels.slack.streaming.nativeTransport`.

## الرجوع الاحتياطي لتفاعل الكتابة

يضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضي "يكتب...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack الرموز المختصرة (مثلاً `"hourglass_flowing_sand"`).
- التفاعل مبذول بأفضل جهد وتُحاول عملية التنظيف تلقائياً بعد اكتمال الرد أو مسار الفشل.

## الوسائط، والتجزئة، والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزّل مرفقات ملفات Slack من عناوين URL الخاصة المستضافة لدى Slack (تدفق طلب مصادق عليه بالرمز) وتُكتب إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك. تتضمن عناصر الملفات النائبة `fileId` الخاص بـ Slack بحيث يستطيع الوكلاء جلب الملف الأصلي عبر `download-file`.

    تستخدم التنزيلات مهل خمول وإجمال محددة. إذا توقف جلب ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى عنصر الملف النائب.

    الحد الأقصى لحجم الوارد في وقت التشغيل هو افتراضياً `20MB` ما لم تتجاوزه `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (افتراضياً 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم الذي يفضل الفقرات
    - تستخدم عمليات إرسال الملفات APIs رفع Slack ويمكن أن تتضمن ردود سلاسل (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند ضبطه؛ وإلا تستخدم عمليات إرسال القناة افتراضيات نوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    تُفتح رسائل Slack المباشرة عبر APIs محادثات Slack عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر slash

تظهر أوامر slash في Slack إما كأمر واحد مضبوط أو كأوامر أصلية متعددة. اضبط `channels.slack.slashCommand` لتغيير افتراضيات الأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلا من ذلك.

- وضع الأوامر الأصلية التلقائي **متوقف** في Slack، لذلك لا يؤدي `commands.native: "auto"` إلى تفعيل أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية لاستدعاء الأوامر استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع تصفية خيارات غير متزامنة عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذ الأوامر إلى جلسة المحادثة الهدف باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم ردود تفاعلية كتبها الوكيل، لكن هذه الميزة معطلة افتراضيا.

فعّلها عاما:

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

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو الاختيارات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة أزرارها الخاصة.
- قيم الاستدعاء التفاعلية هي رموز مبهمة مولدة من OpenClaw، وليست قيما أولية كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلا من إرسال حمولة كتل غير صالحة.

## موافقات التنفيذ في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات التنفيذ `channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب أصلا إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- يظل تفويض الموافقين مطبقا: يمكن فقط للمستخدمين المحددين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه مثل القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack الخاص بك، تظهر مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ينبغي لـ OpenClaw
ألا يضمّن أمر `/approve` يدوي إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات التنفيذ الأصلية تلقائيا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويتم حل موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحة.
اضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يتم حل الموافقين.

السلوك الافتراضي من دون تكوين صريح لموافقة تنفيذ Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم التكوين الصريح الأصلي لـ Slack إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
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

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أيضا
توجيه مطالبات موافقة التنفيذ إلى دردشات أخرى أو أهداف صريحة خارج النطاق. إعادة توجيه `approvals.plugin` المشتركة منفصلة أيضا؛ لا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل تلك الطلبات أصلا إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر أصلا. راجع [موافقات التنفيذ](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات/حذوفات الرسائل إلى أحداث نظام.
- تُعالَج بثوث السلاسل (ردود السلاسل "Also send to channel") كرسائل مستخدم عادية.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القناة، وإضافة/إزالة الدبابيس إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عند تفعيل `configWrites`.
- تُعامل بيانات وصف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشَّح بادئة السلسلة وبذر سياق سجل السلسلة الأولي حسب قوائم السماح للمرسلين المكوّنة عند انطباق ذلك.
- تصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، وبيانات `workflow_*` الوصفية
  - أحداث modal `view_submission` و `view_closed` مع بيانات وصفية للقناة الموجهة ومدخلات النماذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الإشارة">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح التوافق: `dangerouslyAllowNameMatching` (كسر زجاج؛ أبقه متوقفا ما لم تكن هناك حاجة)
- الوصول إلى القناة: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- التشغيل/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المعتمدة على الاسم بصمت تحت `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّف أولا افتراضيا. للعثور على معرّف: انقر بزر الماوس الأيمن على القناة في Slack → **Copy link** — قيمة `C...` في نهاية URL هي معرّف القناة.
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تُتجاهل رسائل DM">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح
    - أحداث Slack Assistant DM: السجلات المطولة التي تذكر `drop message_changed`
      تعني عادة أن Slack أرسل حدث سلسلة Assistant معدلا من دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket لا يتصل">
    تحقق من رموز البوت + التطبيق وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` الحالة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوّن لكن وقت التشغيل الحالي لم يستطع حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مكوّن لكن وقت التشغيل الحالي لم يستطع
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع أوامر شرطة مائلة مطابقة مسجلة في Slack
    - أو وضع أمر شرطة مائلة واحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضا من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المحملة بدورة الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملفات قابل للتنزيل بدلا من معاملتها كمدخل صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                   | المصدر               | السلوك الحالي                                                                   | ملاحظات                                                                  |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | URL ملف Slack       | تُنزّل وتُرفق بالدورة للمعالجة القادرة على الرؤية                                | حد لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                |
| ملفات PDF                    | URL ملف Slack       | تُنزّل وتُعرض كسياق ملف لأدوات مثل `download-file` أو `pdf`                     | الوارد من Slack لا يحول ملفات PDF إلى مدخل رؤية صور تلقائيا              |
| ملفات أخرى                   | URL ملف Slack       | تُنزّل عندما يكون ذلك ممكنا وتُعرض كسياق ملف                                    | لا تُعامل الملفات الثنائية كمدخل صور                                    |
| ردود السلاسل                 | ملفات بادئة السلسلة | يمكن ترطيب ملفات رسالة الجذر كسياق عندما لا يحتوي الرد على وسائط مباشرة        | تستخدم البادئات التي تحتوي على ملفات فقط عنصرا نائبا للمرفق             |
| رسائل متعددة الصور           | ملفات Slack متعددة  | يُقيّم كل ملف بشكل مستقل                                                        | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                           |

### مسار الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المحملة وأنواع المحتوى إلى سياق الوارد.
4. يمكن لمسارات النموذج/الأداة القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تظل الملفات غير الصورية متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عند وصول رسالة في سلسلة (لها أصل `thread_ts`):

- إذا لم يكن للرد نفسه وسائط مباشرة وكانت رسالة الجذر المضمّنة تحتوي على ملفات، يمكن لـ Slack ترطيب ملفات الجذر كسياق لبداية السلسلة.
- تحظى مرفقات الرد المباشر بالأولوية على مرفقات رسالة الجذر.
- تُمثَّل رسالة الجذر التي تحتوي فقط على ملفات ولا تحتوي على نص بعنصر نائب للمرفق حتى يظل بإمكان المسار الاحتياطي تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- تتم معالجة كل مرفق بشكل مستقل عبر مسار معالجة الوسائط.
- تُجمَّع مراجع الوسائط التي تم تنزيلها في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يؤدي فشل تنزيل أحد المرفقات إلى حظر المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 ميغابايت لكل ملف. قابل للتكوين عبر `channels.slack.mediaMaxMb`.
- **إخفاقات التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية الصلاحية، والملفات غير القابلة للوصول، والملفات التي تتجاوز الحجم المسموح، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack بدلاً من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المكوَّن في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                              | السلوك الحالي                                                              | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL منتهي الصلاحية لملف Slack   | يتم تخطي الملف؛ لا يظهر أي خطأ                                               | أعد رفع الملف في Slack                                                     |
| نموذج الرؤية غير مكوَّن                | تُخزَّن مرفقات الصور كمراجع وسائط، لكنها لا تُحلَّل كصور                    | كوّن `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية     |
| صور كبيرة جدًا (> 20 ميغابايت افتراضيًا) | يتم تخطيها وفق حد الحجم                                                     | زد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                     |
| المرفقات المعاد توجيهها/المشتركة       | تتم معالجة النص ووسائط الصور/الملفات المستضافة على Slack بأفضل جهد ممكن    | أعد مشاركتها مباشرة في سلسلة OpenClaw                                      |
| مرفقات PDF                            | تُخزَّن كسياق ملف/وسائط، ولا تُمرَّر تلقائيًا عبر رؤية الصور                | استخدم `download-file` لبيانات تعريف الملف أو أداة `pdf` لتحليل PDF       |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- الملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تفعيل رؤية مرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Slack مع Gateway.
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
    بنية التكوين والأسبقية.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
