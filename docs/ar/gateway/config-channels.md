---
read_when:
    - تهيئة Plugin قناة (المصادقة، والتحكم في الوصول، والحسابات المتعددة)
    - استكشاف أخطاء مفاتيح الإعدادات الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو بوابة الإشارة بالاسم
summary: 'إعدادات القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: الإعدادات — القنوات
x-i18n:
    generated_at: "2026-04-24T07:40:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

مفاتيح الإعدادات الخاصة بكل قناة تحت `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارة، والمفاتيح الخاصة بكل قناة لـ Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات المضمّنة الأخرى.

بالنسبة إلى الوكلاء، والأدوات، ووقت تشغيل Gateway، والمفاتيح الأخرى على المستوى الأعلى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عندما يكون قسم إعداداتها موجودًا (ما لم تكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك |
| ---------------------- | ------ |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب على المالك الموافقة |
| `allowlist` | فقط المرسلون المدرجون في `allowFrom` (أو مخزن السماح المقترن) |
| `open` | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled` | تجاهل جميع الرسائل المباشرة الواردة |

| سياسة المجموعات | السلوك |
| --------------- | ------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المضبوطة |
| `open` | تجاوز قوائم سماح المجموعات (مع استمرار تطبيق بوابة الإشارة) |
| `disabled` | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما تكون `groupPolicy` الخاصة بمزوّد ما غير مضبوطة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويكون الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة هو **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق آمن) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المضبوطة. ويُطبَّق ربط القناة عندما لا تكون الجلسة تملك بالفعل تجاوزًا للنموذج (على سبيل المثال، تم ضبطه عبر `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### الإعدادات الافتراضية للقنوات وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك بين المزودين:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما تكون `groupPolicy` على مستوى المزوّد غير مضبوطة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق الإضافي لجميع القنوات. القيم: `all` (الافتراضي، تضمين جميع سياقات الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق فقط من المرسلين المدرجين في قائمة السماح)، و`allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مضغوطة على نمط المؤشر.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في gateway ‏(Baileys Web). ويبدأ تلقائيًا عندما توجد جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp متعدد الحسابات">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا أول معرّف حساب مضبوط (بعد الفرز).
- يؤدي `channels.whatsapp.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مضبوط.
- يُرحَّل دليل مصادقة Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
- التجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: ‏`channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كرجوع احتياطي للحساب الافتراضي.
- يؤدي `channels.telegram.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.
- في إعدادات الحسابات المتعددة (معرّفا حسابين أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما تكون هذه القيمة مفقودة أو غير صالحة.
- يمنع `configWrites: false` عمليات الكتابة إلى الإعدادات التي يبدأها Telegram ‏(ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` روابط ACP دائمة لموضوعات المنتدى (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). تتشارك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram كلاً من `sendMessage` و`editMessageText` (وتعمل في الدردشات المباشرة والجماعية).
- سياسة إعادة المحاولة: راجع [سياسة إعادة المحاولة](/ar/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- الرمز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كرجوع احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord ذلك الرمز في الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يؤدي `channels.discord.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` ‏(قناة guild) كأهداف للتسليم؛ وتُرفض المعرّفات الرقمية المجردة.
- تكون slugs الخاصة بـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحوّل إلى slug (من دون `#`). ويفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي ينشئها bot افتراضيًا. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل bot التي تذكر bot فقط (مع استمرار تصفية الرسائل الخاصة به).
- يؤدي `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) إلى إسقاط الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر ولكن لا تذكر bot (باستثناء @everyone/@here).
- يؤدي `maxLinesPerMessage` (الافتراضي 17) إلى تقسيم الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- تتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلسلة (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord للإلغاء التلقائي للتركيز بسبب عدم النشاط بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصلب للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح اشتراك لـ `sessions_spawn({ thread: true })` من أجل إنشاء/ربط السلاسل تلقائيًا
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` روابط ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). تتشارك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية بالإضافة إلى تجاوزات الانضمام التلقائي + TTS الاختيارية.
- تمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار إخفاقات فك التشفير.
- تعد `channels.discord.streaming` مفتاح وضع البث الرسمي. ويتم ترحيل القيم القديمة `streamMode` وقيم `streaming` المنطقية تلقائيًا.
- تعيّن `channels.discord.autoPresence` توافر وقت التشغيل إلى حالة حضور bot ‏(سليم => online، متدهور => idle، مستنزف => dnd) وتسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة القابلة للتغيير للاسم/الوسم (وضع توافق للطوارئ).
- `channels.discord.execApprovals`: تسليم موافقات Exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). وفي الوضع التلقائي، تُفعّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. ويعود إلى `commands.ownerAllowFrom` عند عدم ضبطه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتوجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (كسلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. وعندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا من قبل الموافقين المحلولين.
  - `cleanupAfterResolve`: عندما تكون `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** ‏`off` (لا شيء)، و`own` (رسائل bot، الافتراضي)، و`all` (كل الرسائل)، و`allowlist` (من `guilds.<id>.users` على جميع الرسائل).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON حساب الخدمة: مضمن (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- كما أن SecretRef الخاص بحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- الرجوع الاحتياطي عبر البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` كأهداف للتسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل المطابقة القابلة للتغيير لعنوان البريد الإلكتروني الأساسي (وضع توافق للطوارئ).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **وضع Socket** يتطلب كلاً من `botToken` و`appToken` ‏(`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كرجوع احتياطي عبر البيئة للحساب الافتراضي).
- **وضع HTTP** يتطلب `botToken` بالإضافة إلى `signingSecret` (على الجذر أو لكل حساب).
- يقبل كل من `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  صريحة أو كائنات SecretRef.
- تكشف لقطات حساب Slack عن حقول مصدر/حالة لكل اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مضبوط عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يمنع `configWrites: false` عمليات الكتابة إلى الإعدادات التي يبدأها Slack.
- يؤدي `channels.slack.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.
- تُعد `channels.slack.streaming.mode` مفتاح وضع البث الرسمي في Slack. وتتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي في Slack. ويتم ترحيل القيم القديمة `streamMode`، والقيم المنطقية `streaming`، و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` كأهداف للتسليم.

**أوضاع إشعارات التفاعل:** ‏`off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** تكون `thread.historyScope` لكل سلسلة على حدة (الافتراضي) أو مشتركة عبر القناة. وتقوم `thread.inheritParent` بنسخ سجل القناة الأب إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة السلسلة على نمط Slack assistant ‏"is typing..." هدف سلسلة رد. وتبقى الرسائل المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بنمط السلسلة.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تنفيذ الرد، ثم تزيله عند الاكتمال. استخدم shortcode لرمز Slack التعبيري مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات Exec الأصلية في Slack وتفويض الموافقين. المخطط نفسه كما في Discord: ‏`enabled` ‏(`true`/`false`/`"auto"`)، و`approvers` ‏(معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` ‏(`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ---------------- | ---------- | -------- |
| reactions | مفعّل | التفاعل + سرد التفاعلات |
| messages | مفعّل | القراءة/الإرسال/التحرير/الحذف |
| pins | مفعّل | التثبيت/إزالة التثبيت/السرد |
| memberInfo | مفعّل | معلومات العضو |
| emojiList | مفعّل | قائمة emoji المخصصة |

### Mattermost

يأتي Mattermost كـ Plugin: ‏`openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع الدردشة: ‏`oncall` (الرد عند @-mention، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`) وليس عنوان URL كاملًا.
- يجب أن يُحل `commands.callbackUrl` إلى نقطة نهاية OpenClaw gateway وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة callbacks الخاصة بالشرطة المائلة الأصلية باستخدام الرموز الخاصة بكل أمر التي يعيدها
  Mattermost أثناء تسجيل أوامر الشرطة المائلة. وإذا فشل التسجيل أو لم تُفعَّل
  أي أوامر، يرفض OpenClaw callbacks مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي callback الخاصين/الداخليين/ضمن tailnet، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` المضيف/النطاق الخاص بالـ callback.
  استخدم قيم المضيف/النطاق، وليس عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو منع عمليات الكتابة إلى الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
- يؤدي `channels.mattermost.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**أوضاع إشعارات التفاعل:** ‏`off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو منع عمليات الكتابة إلى الإعدادات التي يبدأها Signal.
- يؤدي `channels.signal.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.

### BlueBubbles

يُعد BlueBubbles هو المسار الموصى به لـ iMessage (مدعومًا بـ Plugin، ومضبوطًا تحت `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles` و`channels.bluebubbles.dmPolicy`.
- يؤدي `channels.bluebubbles.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم handle في BlueBubbles أو سلسلة هدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تم توثيق إعدادات قناة BlueBubbles الكاملة في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` ‏(JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- يؤدي `channels.imessage.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.

- يتطلب Full Disk Access لقاعدة بيانات Messages.
- فضّل الأهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى SSH wrapper؛ اضبط `remoteHost` ‏(`host` أو `user@host`) لجلب المرفقات عبر SCP.
- تقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو منع عمليات الكتابة إلى الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle مُطبّعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على SSH wrapper لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تأتي Matrix مدعومة بـ Plugin ويتم ضبطها تحت `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- تستخدم مصادقة الرمز `accessToken`؛ بينما تستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` باستخدام homeservers الخاصة/الداخلية. ويُعد `proxy` وهذا الاشتراك الشبكي عنصرَي تحكم مستقلين.
- يختار `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعوّة والدعوات الجديدة على نمط الرسائل المباشرة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات Exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). وفي الوضع التلقائي، تُفعّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتوجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (كسلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - التجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- تتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة في جلسات: تشارك `per-user` (الافتراضي) حسب النظير الموجّه، بينما تعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات الحالة وعمليات البحث المباشر في الدليل في Matrix سياسة الوكيل نفسها المستخدمة في حركة وقت التشغيل.
- تم توثيق إعدادات Matrix الكاملة، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تأتي Microsoft Teams مدعومة بـ Plugin ويتم ضبطها تحت `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams` و`channels.msteams.configWrites`.
- تم توثيق إعدادات Teams الكاملة (بيانات الاعتماد، وwebhook، وسياسة الرسائل المباشرة/المجموعات، والتجاوزات لكل فريق/قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

تأتي IRC مدعومة بـ Plugin ويتم ضبطها تحت `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.irc` و`channels.irc.dmPolicy` و`channels.irc.configWrites` و`channels.irc.nickserv.*`.
- يؤدي `channels.irc.defaultAccount` الاختياري إلى تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوط.
- تم توثيق إعدادات قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارة) في [IRC](/ar/channels/irc).

### الحسابات المتعددة (كل القنوات)

شغّل عدة حسابات لكل قناة (لكل منها `accountId` خاص بها):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- تُستخدم `default` عند حذف `accountId` (في CLI + التوجيه).
- تنطبق رموز البيئة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو onboarding القناة) بينما كنت لا تزال تستخدم إعداد قناة أحادي الحساب على المستوى الأعلى، يقوم OpenClaw أولًا بترقية القيم أحادية الحساب على المستوى الأعلى الخاصة بالحساب إلى خريطة حسابات القناة بحيث يواصل الحساب الأصلي العمل. وتنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ أما Matrix فيمكنها بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.
- تستمر الروابط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الروابط الخاصة بالحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل قيم أحادية الحساب على المستوى الأعلى الخاصة بالحساب إلى الحساب المُرقّى المختار لتلك القناة. وتستخدم معظم القنوات `accounts.default`؛ أما Matrix فيمكنها الحفاظ على هدف مسمّى/افتراضي مطابق موجود بدلًا من ذلك.

### قنوات Plugin الأخرى

يتم ضبط كثير من قنوات Plugins على شكل `channels.<id>` وتوثيقها في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارة في الدردشة الجماعية

تتطلب رسائل المجموعات افتراضيًا **إشارة** (إشارة من بيانات التعريف أو أنماط regex آمنة). ينطبق ذلك على مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارة:**

- **الإشارات عبر بيانات التعريف**: إشارات @ الأصلية في المنصة. ويتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. وتُتجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا تُفرض بوابة الإشارة إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو وجود نمط واحد على الأقل).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات التجاوز عبر `channels.<channel>.historyLimit` (أو لكل حساب). اضبط `0` للتعطيل.

#### حدود سجل الرسائل المباشرة

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

آلية الحلّ: تجاوز لكل رسالة مباشرة → القيمة الافتراضية للمزوّد → من دون حد (الاحتفاظ بالجميع).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويرد فقط على الأنماط النصية):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### الأوامر (معالجة أوامر الدردشة)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="تفاصيل الأوامر">

- تضبط هذه الكتلة أسطح الأوامر. وبالنسبة إلى فهرس الأوامر المضمنة + المجمعة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/Plugins مثل QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وLINE ‏`/card`، وdevice-pair ‏`/pair`، وmemory ‏`/dreaming`، وphone-control ‏`/phone`، وTalk ‏`/voice` موثقة في صفحات القنوات/Plugins الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يؤدي `native: "auto"` إلى تشغيل الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- يؤدي `nativeSkills: "auto"` إلى تشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- التجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). وتؤدي `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- تضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة bot في Telegram.
- يؤدي `bash: true` إلى تفعيل `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يؤدي `config: true` إلى تفعيل `/config` ‏(قراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء gateway ‏`chat.send`، تتطلب عمليات الكتابة الدائمة بواسطة `/config set|unset` أيضًا `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحًا لعملاء المشغل العاديين ذوي نطاق الكتابة.
- يؤدي `mcp: true` إلى تفعيل `/mcp` لإعدادات خادم MCP الذي يديره OpenClaw تحت `mcp.servers`.
- يؤدي `plugins: true` إلى تفعيل `/plugins` لاكتشاف Plugins وتثبيتها وعناصر التحكم في التفعيل/التعطيل.
- تتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- وبالنسبة إلى القنوات متعددة الحسابات، تتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل gateway. الافتراضي: `true`.
- تُعد `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- تؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- تكون `allowFrom` لكل provider. وعند ضبطها، تصبح **مصدر التفويض الوحيد** (ويتم تجاهل قوائم سماح القنوات/الاقتران و`useAccessGroups`).
- يؤدي `useAccessGroups: false` إلى السماح للأوامر بتجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` مضبوطة.
- خريطة توثيق الأوامر:
  - الفهرس المضمن + المجمع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - dreaming الخاصة بالذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — المفاتيح ذات المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
