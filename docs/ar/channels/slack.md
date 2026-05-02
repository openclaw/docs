---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-02T07:19:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين HTTP Request URLs مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تعتمد رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح تشغيلية.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (افتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [نموذج البيان](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** ‏(`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

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

        بديل env الاحتياطي (الحساب الافتراضي فقط):

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
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [نموذج البيان](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** ‏(`xoxb-...`) المعروض

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
        استخدم مسارات webhook فريدة للحسابات المتعددة عبر HTTP

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتعارض التسجيلات.
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

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا في Socket Mode. تجاوز إعدادات النقل فقط عندما تحتاج إلى ضبط خاص بمساحة العمل أو المضيف:

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

استخدم هذا فقط لمساحات عمل Socket Mode التي تسجل مهل انتهاء Slack websocket pong/server-ping أو تعمل على مضيفين معروفين بوجود استنزاف في حلقة الأحداث لديهم. `clientPingTimeout` هو انتظار pong بعد أن ترسل SDK نبضة client ping؛ أما `serverPingTimeout` فهو انتظار نبضات ping من خادم Slack. تبقى رسائل التطبيق والأحداث حالة تطبيق، وليست إشارات لحيوية النقل.

## قائمة تحقق البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه في Socket Mode وHTTP Request URLs. يختلف فقط قالب `settings` (و`url` لأمر الشرطة المائلة).

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

بالنسبة إلى **وضع HTTP Request URLs**، استبدل `settings` بصيغة HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم عنوان URL عام:

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

يمكّن البيان الافتراضي تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل تبويب Home، ينشر OpenClaw عرض Home افتراضيًا وآمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو تكوين خاص. يظل تبويب **Messages** مفعّلًا لرسائل Slack المباشرة.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوّن، مع مراعاة التفاصيل التالية:

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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        استخدم قائمة `slash_commands` نفسها الخاصة بـ Socket Mode أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

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
  <Accordion title="نطاقات النسبة الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات رمز المستخدم الاختيارية (عمليات القراءة)">
    إذا ضبطت `channels.slack.userToken`، فالنطاقات النموذجية للقراءة هي:

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

- `botToken` + `appToken` مطلوبان لوضع Socket Mode.
- يتطلب وضع HTTP كلًا من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تتجاوز رموز الإعدادات بديل env.
- لا ينطبق بديل env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` إلا على الحساب الافتراضي.
- `userToken` (`xoxp-...`) مخصص للإعدادات فقط (لا يوجد بديل env) ويكون افتراضيًا بسلوك قراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- الحالة هي `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر أسرار آخر غير مضمّن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما بالنسبة إلى الكتابة، فيظل رمز البوت هو المفضل؛ ولا يُسمح بالكتابة عبر رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
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

تشمل إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. يقبل `download-file` معرّفات ملفات Slack الظاهرة في العناصر النائبة للملفات الواردة، ويعيد معاينات صور للصور أو بيانات وصفية لملفات محلية لأنواع الملفات الأخرى.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.slack.allowFrom` هي قائمة السماح المعتمدة للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    أعلام الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - لا ينطبق `channels.slack.accounts.default.allowFrom` إلا على الحساب `default`.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا يكون `allowFrom` الخاص بها مضبوطًا.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا تزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمتان تُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك من دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القناة">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` ويجب **أن تستخدم معرّفات قنوات Slack الثابتة** (مثل `C12345678`) كمفاتيح إعدادات.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز بذلك
    - تُحفظ إدخالات أسماء القنوات غير المحلولة كما ضُبطت لكنها تُتجاهل للتوجيه افتراضيًا
    - التفويض الوارد وتوجيه القنوات يعتمدان على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر المباشرة `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح المعتمدة على الاسم (`#channel-name` أو `channel-name`) ضمن `groupPolicy: "allowlist"`. البحث عن القناة يعتمد على المعرّف أولًا افتراضيًا، لذلك لن ينجح مفتاح يعتمد على الاسم في التوجيه أبدًا، وستُحظر كل الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح المعتمد على الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack كمفتاح. للعثور عليه: انقر بزر الفأرة الأيمن على القناة في Slack → **Copy link** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

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
    تكون رسائل القنوات مقيدة بالإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة تطبيق صريحة (`<@botId>`)
    - إشارة مجموعة مستخدمي Slack (`<!subteam^S...>`) عندما يكون مستخدم البوت عضوًا في مجموعة المستخدمين تلك؛ تتطلب `usergroups:read`
    - أنماط تعبيرات الإشارة النظامية (`agents.list[].groupChat.mentionPatterns`، وبديلها `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على سلسلة رسائل البوت (معطل عندما تكون `thread.requireExplicitMention` بالقيمة `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر حل بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُعيَّن إلى `id:` فقط)

    `allowBots` محافظ للقنوات والقنوات الخاصة: لا تُقبل رسائل الغرف المكتوبة بواسطة البوت إلا عندما يكون البوت المُرسل مدرجًا صراحة في قائمة سماح `users` لتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوًا حاليًا في الغرفة. لا تحقق أحرف البدل وإدخالات المالك بأسماء العرض شرط حضور المالك. يستخدم حضور المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن العضو، يسقط OpenClaw رسالة الغرفة المكتوبة بواسطة البوت.

  </Tab>
</Tabs>

## سلاسل الرسائل والجلسات ووسوم الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- تقبل ارتباطات توجيه Slack معرّفات الأقران الخام بالإضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع `session.dmScope=main` الافتراضي، تُدمج رسائل Slack المباشرة في جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن لردود السلاسل إنشاء لواحق جلسة سلسلة (`:thread:<threadTs>`) عند الاقتضاء.
- الافتراضي لـ `channels.slack.thread.historyScope` هو `thread`؛ والافتراضي لـ `thread.inheritParent` هو `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبط `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عند `true`، يكبت الإشارات الضمنية في السلاسل بحيث لا يستجيب البوت إلا لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. بدون هذا، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- البديل القديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
يعطل `replyToMode="off"` **كل** سلاسل الرد في Slack، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة محترمة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة، بينما تظل ردود Telegram مرئية ضمن السياق.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack الرموز القصيرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو عالميًا.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات معاينة مجزأة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، وجّه تحديثات الأداة/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبط `false` للاحتفاظ برسائل منفصلة للأداة/التقدم.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- يمكن لجذور القنوات ودردشات المجموعات أن تستمر في استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تبقى رسائل Slack المباشرة على المستوى الأعلى خارج السلسلة افتراضيًا، لذلك لا تعرض معاينة نمط السلسلة؛ استخدم ردود السلاسل أو `typingReaction` إذا أردت تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ النهايات النصية/الكتلية المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
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

- يتم ترحيل `channels.slack.streamMode` (`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- يتم ترحيل `channels.slack.streaming` المنطقي تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## بديل تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء معالجة OpenClaw لرد، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack الرموز القصيرة (مثل `"hourglass_flowing_sand"`).
- التفاعل بأفضل جهد، وتُحاوَل عملية التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلبات موثَّق بالرمز)، وتُكتب إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم. تتضمن عناصر نائبة للملفات `fileId` الخاص بـ Slack حتى تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مهل انتظار محدودة للخمول والإجمالي. إذا تعطل استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويعود إلى العنصر النائب للملف.

    الحد الأقصى الافتراضي لحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم مع إعطاء الأولوية للفقرات
    - تستخدم عمليات إرسال الملفات واجهات API للرفع في Slack ويمكن أن تتضمن ردود سلاسل المحادثات (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات الإرسال عبر القناة الإعدادات الافتراضية حسب نوع MIME من مسار معالجة الوسائط

  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack المباشرة النصية/المكوّنة من كتل فقط النشر مباشرة إلى معرفات المستخدمين؛ أما عمليات رفع الملفات والإرسال ضمن السلاسل فتفتح الرسالة المباشرة أولًا عبر واجهات API لمحادثات Slack لأن هذه المسارات تتطلب معرف محادثة محددًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوَّن أو كعدة أوامر أصلية. كوّن `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، وتُفعَّل باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- وضع الأوامر الأصلية التلقائي **معطّل** في Slack، لذا لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسيطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- 6-100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع ترشيح خيارات غير متزامن عندما تكون معالجات خيارات التفاعل متاحة
- تجاوز حدود Slack: تعود قيم الخيارات المشفرة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتظل توجه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم رد تفاعلية كتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

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

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة أزرار خاصة بها.
- قيم معاودة النداء التفاعلية هي رموز معتمة يولدها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات Exec في Slack

يمكن لـ Slack العمل كعميل موافقة أصلي باستخدام الأزرار والتفاعلات التفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec ‏`channels.slack.execApprovals.*` للتوجيه الأصلي إلى الرسائل المباشرة/القنوات.
- يمكن أن تظل موافقات Plugin تُحل عبر سطح الأزرار الأصلي نفسه في Slack عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرف الموافقة `plugin:`.
- لا يزال تفويض الموافقين مطبقًا: يمكن للمستخدمين المحددين كموافقين فقط الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه كالقنوات الأخرى. عندما يكون `interactivity` مفعّلًا في إعدادات تطبيق Slack، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، فهي تجربة الموافقة الأساسية؛ يجب ألا يضمّن OpenClaw
أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو `"auto"` ويتم حل
موافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي صراحةً.
عيّن `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يتم حل الموافقين.

السلوك الافتراضي من دون تكوين صريح لموافقة Exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم تكوين Slack الأصلي الصريح إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
اختيار التسليم إلى دردشة المصدر:

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
توجيه مطالبات موافقة Exec إلى دردشات أخرى أو أهداف صريحة خارج القناة. إعادة توجيه `approvals.plugin` المشتركة
منفصلة أيضًا؛ يمكن لأزرار Slack الأصلية أن تظل تحل موافقات Plugin عندما تصل تلك الطلبات بالفعل
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات/حذوفات الرسائل إلى أحداث نظام.
- تُعالَج عمليات بث السلاسل (ردود السلسلة "Also send to channel") كرسائل مستخدم عادية.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيتات إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القناة عندما يكون `configWrites` مفعّلًا.
- تُعامل بيانات وصف موضوع/غرض القناة كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشَّح بادئة السلسلة وبذر سياق سجل السلسلة الأولي بواسطة قوائم السماح المكونة للمرسلين عند الاقتضاء.
- تُصدر إجراءات الكتل وتفاعلات النوافذ أحداث نظام منظمة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المنتقي، وبيانات `workflow_*` الوصفية
  - أحداث `view_submission` و`view_closed` للنوافذ مع بيانات وصفية للقناة الموجَّهة ومدخلات النماذج

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (قديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ أبقه معطلًا ما لم تكن هناك حاجة)
- الوصول إلى القناة: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق بالترتيب:

    - `groupPolicy`
    - قائمة السماح للقنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح القائمة على الأسماء بصمت عند `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرف أولًا افتراضيًا. للعثور على معرف: انقر بزر الفأرة الأيمن على القناة في Slack → **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرف القناة.
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
    - موافقات الإقران / إدخالات قائمة السماح
    - أحداث DM الخاصة بـ Slack Assistant: السجلات المطوّلة التي تذكر `drop message_changed`
      تعني عادة أن Slack أرسل حدث سلسلة Assistant معدّلًا من دون
      مرسل بشري قابل للاسترداد في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket غير متصل">
    تحقق من رموز bot + app وتفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` قيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوَّن لكن وقت التشغيل الحالي تعذر عليه حل القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يتلقى الأحداث">
    تحقق من:

    - سر التوقيع
    - مسار Webhook
    - عناوين طلب Slack (الأحداث + التفاعل + أوامر الشرطة المائلة)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مكوَّن لكن وقت التشغيل الحالي تعذر عليه
    حل سر التوقيع المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقق مما إذا كنت تقصد:

    - وضع الأمر الأصلي (`channels.slack.commands.native: true`) مع أوامر شرطة مائلة مطابقة مسجلة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم السماح للقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## مرجع رؤية المرفقات

يمكن لـ Slack إرفاق الوسائط المنزلة بدور الوكيل عندما تنجح تنزيلات ملفات Slack وتسمح حدود الحجم. يمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرة إلى نموذج رد قادر على الرؤية؛ أما الملفات الأخرى فتُحتفظ بها كسياق ملفات قابل للتنزيل بدلًا من معاملتها كمدخلات صور.

### أنواع الوسائط المدعومة

| نوع الوسائط                     | المصدر               | السلوك الحالي                                                                  | الملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| صور JPEG / PNG / GIF / WebP | عنوان URL لملف Slack       | يتم تنزيلها وإرفاقها بالدور لمعالجة قادرة على الرؤية                   | حد كل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack       | يتم تنزيلها وإتاحتها كسياق ملف لأدوات مثل `download-file` أو `pdf` | لا يحوّل الإدخال الوارد من Slack ملفات PDF إلى إدخال رؤية صورية تلقائيًا |
| ملفات أخرى                    | عنوان URL لملف Slack       | يتم تنزيلها عند الإمكان وإتاحتها كسياق ملف                              | لا تُعامل الملفات الثنائية كإدخال صور                               |
| ردود السلاسل                 | ملفات بادئ السلسلة | يمكن تحميل ملفات الرسالة الجذر كسياق عندما لا يحتوي الرد على وسائط مباشرة  | تستخدم البوادئ التي تحتوي على ملفات فقط عنصرًا نائبًا للمرفق                          |
| الرسائل متعددة الصور           | ملفات Slack متعددة | يُقيّم كل ملف بشكل مستقل                                              | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                     |

### مسار الإدخال الوارد

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت (`xoxb-...`).
2. يُكتب الملف إلى مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط التي تم تنزيلها وأنواع المحتوى إلى سياق الإدخال الوارد.
4. يمكن لمسارات النماذج/الأدوات القادرة على الصور استخدام مرفقات الصور من ذلك السياق.
5. تبقى الملفات غير الصورية متاحة كبيانات وصفية للملفات أو كمراجع وسائط للأدوات التي يمكنها التعامل معها.

### وراثة مرفقات جذر السلسلة

عند وصول رسالة في سلسلة (تحتوي على أصل `thread_ts`):

- إذا لم يكن الرد نفسه يحتوي على وسائط مباشرة وكانت الرسالة الجذر المضمّنة تحتوي على ملفات، يمكن لـ Slack تحميل ملفات الجذر كسياق بادئ السلسلة.
- مرفقات الرد المباشرة لها أولوية على مرفقات الرسالة الجذر.
- تُمثَّل الرسالة الجذر التي تحتوي على ملفات فقط ولا تحتوي على نص بعنصر نائب للمرفق حتى يظل بإمكان الاحتياطي تضمين ملفاتها.

### التعامل مع المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يُعالج كل مرفق بشكل مستقل عبر مسار الوسائط.
- تُجمّع مراجع الوسائط التي تم تنزيلها في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل أحد المرفقات معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **فشل التنزيل**: يتم تخطي الملفات التي لا يستطيع Slack تقديمها، وعناوين URL المنتهية الصلاحية، والملفات غير القابلة للوصول، والملفات كبيرة الحجم، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المهيأ في `agents.defaults.imageModel`.

### الحدود المعروفة

| السيناريو                               | السلوك الحالي                                                             | الحل البديل                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| عنوان URL لملف Slack منتهي الصلاحية                 | يتم تخطي الملف؛ لا يظهر خطأ                                                 | أعد رفع الملف في Slack                                                |
| نموذج الرؤية غير مهيأ            | تُخزّن مرفقات الصور كمراجع وسائط، لكنها لا تُحلل كصور | هيّئ `agents.defaults.imageModel` أو استخدم نموذج رد قادرًا على الرؤية |
| صور كبيرة جدًا (> 20 MB افتراضيًا) | يتم تخطيها حسب حد الحجم                                                         | زِد `channels.slack.mediaMaxMb` إذا كان Slack يسمح بذلك                       |
| المرفقات المُعاد توجيهها/المشتركة           | النص والوسائط الصورية/الملفات المستضافة على Slack تُعالج بأفضل جهد                       | أعد مشاركتها مباشرة في سلسلة OpenClaw                                   |
| مرفقات PDF                        | تُخزّن كسياق ملف/وسائط، ولا تُوجّه تلقائيًا عبر رؤية الصور  | استخدم `download-file` لبيانات الملف الوصفية أو أداة `pdf` لتحليل PDF   |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [أداة PDF](/ar/tools/pdf)
- الملحمة: [#51349](https://github.com/openclaw/openclaw/issues/51349) — تمكين الرؤية لمرفقات Slack
- اختبارات الانحدار: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- التحقق المباشر: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Slack بـ gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك القنوات ورسائل DM الجماعية.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ar/gateway/configuration">
    بنية التكوين والأسبقية.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    كتالوج الأوامر وسلوكها.
  </Card>
</CardGroup>
