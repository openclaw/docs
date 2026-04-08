---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-08T06:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cad132131ddce688517def7c14703ad314441c67aacc4cc2a2a721e1d1c01942
    source_path: channels/slack.md
    workflow: 15
---

# Slack

الحالة: جاهز للإنتاج للرسائل المباشرة + القنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن HTTP Request URLs مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات التشخيص عبر القنوات ودلائل الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [نموذج البيان](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) الظاهر
      </Step>

      <Step title="تكوين OpenClaw">

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

        الرجوع إلى المتغيرات البيئية (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="بدء البوابة">

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
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) الظاهر

      </Step>

      <Step title="تكوين OpenClaw">

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
        استخدم مسارات webhook فريدة لـ HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مختلفًا (الافتراضي `/slack/events`) حتى لا تتصادم التسجيلات.
        </Note>

      </Step>

      <Step title="بدء البوابة">

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
    "description": "Slack connector for OpenClaw"
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

<AccordionGroup>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، فإن Slack يتوقع صيغة `:emoji_name:`.
  </Accordion>
  <Accordion title="نطاقات user-token الاختيارية (عمليات القراءة)">
    إذا قمت بتكوين `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات البحث في Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرمز المميز

- يلزم `botToken` + `appToken` من أجل Socket Mode.
- يتطلب وضع HTTP `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تتجاوز الرموز المميزة في التكوين الرجوع إلى المتغيرات البيئية.
- ينطبق الرجوع إلى متغيرات البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- إن `userToken` (`xoxp-...`) خاص بالتكوين فقط (لا يوجد رجوع إلى المتغيرات البيئية) ويستخدم افتراضيًا سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status` لكل اعتماد
  (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مُكوَّن عبر SecretRef
  أو مصدر أسرار آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode، فإن
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة للإجراءات/قراءات الدليل، يمكن تفضيل user token عند تكوينه. أما للكتابة، فيبقى bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة عبر user-token إلا عندما تكون `userTokenReadOnly: false` ويكون bot token غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة | الافتراضي |
| ---------- | ------- |
| messages   | مفعّل |
| reactions  | مفعّل |
| pins       | مفعّل |
| memberInfo | مفعّل |
| emojiList  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في وصول الرسائل المباشرة (القديم: `channels.slack.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`؛ القديم: `channels.slack.dm.allowFrom`)
    - `disabled`

    علامات الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية تعدد الحسابات:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    تتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات تحت `channels.slack.channels` ويجب أن تستخدم معرّفات القنوات الثابتة.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة بالكامل (إعداد عبر المتغيرات البيئية فقط)، فإن وقت التشغيل يعود إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    تحليل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما تسمح صلاحية الرمز المميز بذلك
    - يتم الاحتفاظ بإدخالات أسماء القنوات غير المحلولة كما هي في التكوين ولكن يتم تجاهلها افتراضيًا عند التوجيه
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ ويتطلب المطابقة المباشرة لاسم المستخدم/الاسم المختصر `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدمي القنوات">
    تكون رسائل القنوات مقيّدة بالإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - أنماط regex للإشارة (`agents.list[].groupChat.mentionPatterns`، والرجوع إلى `messages.groupChat.mentionPatterns`)
    - سلوك الخيط الضمني للرد على البوت (يُعطَّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: ‏`id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُربط إلى `id:` فقط)

  </Tab>
</Tabs>

## الخيوط والجلسات وعلامات الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تنشئ ردود الخيوط لواحق جلسات خيط (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل الخيط الحالية التي يتم جلبها عند بدء جلسة خيط جديدة (الافتراضي `20`؛ اضبطها إلى `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، يتم منع الإشارات الضمنية في الخيط بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل الخيوط، حتى عندما يكون البوت قد شارك بالفعل في الخيط. بدون هذا، تتجاوز الردود في خيط شارك فيه البوت بوابة `requireMention`.

عناصر التحكم في خيوط الرد:

- `channels.slack.replyToMode`: ‏`off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- الرجوع القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **كل** خيوط الرد في Slack، بما في ذلك علامات `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث لا تزال العلامات الصريحة محترمة في وضع `"off"`. يعكس هذا الاختلاف نماذج الخيوط في المنصات: إذ تخفي خيوط Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية في تدفق الدردشة الرئيسي.

## تفاعلات الإقرار

يرسل `ackReaction` emoji إقرار أثناء معالجة OpenClaw لرسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الرجوع إلى emoji هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

ملاحظات:

- يتوقع Slack أسماء shortcodes (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو بشكل عام.

## بث النص

تتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: تعطيل بث المعاينة الحية.
- `partial` (الافتراضي): استبدال نص المعاينة بآخر إخراج جزئي.
- `block`: إلحاق تحديثات المعاينة المقسمة إلى أجزاء.
- `progress`: إظهار نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.

تتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن يكون خيط الرد متاحًا حتى يظهر بث النص الأصلي وحالة خيط Slack assistant. ولا يزال اختيار الخيط يتبع `replyToMode`.
- لا يزال بإمكان جذور القنوات ودردشات المجموعة استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تبقى رسائل Slack المباشرة ذات المستوى الأعلى خارج الخيوط افتراضيًا، لذلك لا تعرض المعاينة بنمط الخيط؛ استخدم ردود الخيوط أو `typingReaction` إذا أردت تقدمًا مرئيًا هناك.
- تعود الحمولات الإعلامية وغير النصية إلى التسليم العادي.
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
- يتم ترحيل القيمة المنطقية `channels.slack.streaming` تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## الرجوع إلى تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. يكون هذا مفيدًا أكثر خارج ردود الخيوط، التي تستخدم مؤشر حالة افتراضيًا من نوع "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack أسماء shortcodes (مثل `"hourglass_flowing_sand"`).
- هذا التفاعل يبذل قصارى جهده، وتُجرى محاولة التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتجزئة والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلبات موثَّق بالرمز المميز) وكتابتها إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك.

    الحد الأقصى الافتراضي للحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يتيح `channels.slack.chunkMode="newline"` التقسيم بحسب الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات رفع Slack API ويمكن أن تتضمن ردود الخيوط (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا فإن عمليات إرسال القنوات تستخدم القيم الافتراضية حسب نوع MIME من مسار الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    يتم فتح رسائل Slack المباشرة عبر Slack conversation APIs عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

- وضع الأوامر الأصلية التلقائي **معطل** لـ Slack (لا يؤدي `commands.native: "auto"` إلى تمكين الأوامر الأصلية في Slack).
- فعّل معالجات أوامر Slack الأصلية باستخدام `channels.slack.commands.native: true` (أو `commands.native: true` عالميًا).
- عند تمكين الأوامر الأصلية، سجّل أوامر الشرطة المائلة المطابقة في Slack (أسماء `/<command>`)، مع استثناء واحد:
  - سجّل `/agentstatus` لأمر الحالة (يحجز Slack الأمر `/status`)
- إذا لم تكن الأوامر الأصلية مفعلة، يمكنك تشغيل أمر شرطة مائلة واحد مكوَّن عبر `channels.slack.slashCommand`.
- تتكيف قوائم الوسيطات الأصلية الآن في استراتيجية العرض:
  - حتى 5 خيارات: كتل أزرار
  - من 6 إلى 100 خيار: قائمة اختيار ثابتة
  - أكثر من 100 خيار: اختيار خارجي مع تصفية خيارات غير متزامنة عند توفر معالجات خيارات التفاعل
  - إذا تجاوزت قيم الخيارات المرمّزة حدود Slack، يعود التدفق إلى الأزرار
- بالنسبة لحمولات الخيارات الطويلة، تستخدم قوائم وسائط أوامر الشرطة المائلة مربع حوار تأكيد قبل إرسال القيمة المحددة.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

تستخدم جلسات الشرطة المائلة مفاتيح معزولة:

- `agent:<agentId>:slack:slash:<userId>`

ومع ذلك تستمر في توجيه تنفيذ الأوامر مقابل جلسة المحادثة المستهدفة (`CommandTargetSessionKey`).

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

عند التمكين، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُترجم هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم ردود النداء التفاعلية هي رموز opaque يُنشئها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المُنشأة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات exec في Slack

يمكن لـ Slack أن يعمل كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى Web UI أو الطرفية.

- تستخدم موافقات Exec المسار `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل المباشرة/القنوات.
- لا تزال موافقات الإضافات قادرة على الحل عبر سطح أزرار Slack الأصلي نفسه عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال تفويض الموافقين مفروضًا: فقط المستخدمون المحددون كموافقين يمكنهم الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا نفس سطح أزرار الموافقة المشترك مثل القنوات الأخرى. عند تمكين `interactivity` في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة داخل المحادثة.
وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الموافقة الأساسية؛ ويجب على OpenClaw
أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن
موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`، `sessionFilter`

يقوم Slack بتمكين موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` وعندما يُحلّ على الأقل
موافق واحد. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
واضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يُحل الموافقون.

السلوك الافتراضي دون أي تكوين صريح لموافقات exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم التكوين الأصلي الصريح لـ Slack إلا عندما تريد تجاوز الموافقين أو إضافة عوامل تصفية أو
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

يُعد توجيه `approvals.exec` المشترك منفصلًا. استخدمه فقط عندما يجب أن تُوجَّه مطالبات موافقة exec أيضًا
إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما أن توجيه `approvals.plugin` المشترك منفصل أيضًا؛
ولا تزال أزرار Slack الأصلية قادرة على حل موافقات الإضافات عندما تصل تلك الطلبات بالفعل
إلى Slack.

كما يعمل `/approve` في نفس الدردشة أيضًا ضمن قنوات ورسائل Slack المباشرة التي تدعم الأوامر بالفعل. راجع [Exec approvals](/ar/tools/exec-approvals) للاطلاع على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُربط تعديلات الرسائل/حذفها/بث الخيوط إلى أحداث نظام.
- تُربط أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُربط أحداث انضمام/مغادرة الأعضاء وإنشاء/إعادة تسمية القنوات وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القنوات عندما تكون `configWrites` مفعلة.
- تُعامل بيانات topic/purpose الخاصة بالقناة على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ الخيط وبذر سياق سجل الخيط الأولي بواسطة قوائم السماح المكوَّنة للمرسلين عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النوافذ المشروطة أحداث نظام منظَّمة بصيغة `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم المحددات، وبيانات `workflow_*`
  - أحداث النافذة المشروطة `view_submission` و`view_closed` مع بيانات القناة الموجّهة ومدخلات النموذج

## مؤشرات إلى مرجع التكوين

المرجع الأساسي:

- [مرجع التكوين - Slack](/ar/gateway/configuration-reference#slack)

  حقول Slack عالية الإشارة:
  - الوضع/المصادقة: `mode`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
  - وصول الرسائل المباشرة: `dm.enabled`، `dmPolicy`، `allowFrom` (القديم: `dm.policy`، `dm.allowFrom`)، `dm.groupEnabled`، `dm.groupChannels`
  - مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ فقط؛ اتركه معطلًا ما لم تكن بحاجة إليه)
  - وصول القنوات: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
  - الخيوط/السجل: `replyToMode`، `replyToModeByChatType`، `thread.*`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
  - التسليم: `textChunkLimit`، `chunkMode`، `mediaMaxMb`، `streaming`، `streaming.nativeTransport`
  - العمليات/الميزات: `configWrites`، `commands.native`، `slashCommand.*`، `actions.*`، `userToken`، `userTokenReadOnly`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق، بالترتيب:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`)
    - `requireMention`
    - قائمة السماح `users` لكل قناة

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
    تحقق من صلاحية رموز bot + app ومن تمكين Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` القيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مُكوَّن ولكن وقت التشغيل الحالي لم يتمكن من حل
    القيمة المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - signing secret
    - مسار webhook
    - Slack Request URLs ‏(Events + Interactivity + Slash Commands)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهرت `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مُكوَّن ولكن وقت التشغيل الحالي لم يتمكن
    من حل signing secret المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة الفردي (`channels.slack.slashCommand.enabled: true`)

    وتحقق أيضًا من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

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
