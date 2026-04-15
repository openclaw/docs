---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو إلى القيم الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-15T14:40:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a4da3b41d0304389bd6359aac1185c231e529781b607656ab352f8a8104bdba
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

المرجع الأساسي لإعدادات `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية، وتوفّر روابط خارجية عندما يكون لنظام فرعي مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/Plugin أو كل خيار عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يعرض `openclaw config schema` مخطط JSON Schema الفعلي المستخدم للتحقق وControl UI، مع دمج بيانات القنوات/Plugin المجمّعة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة مقيّدة بمسار واحد لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

المراجع العميقة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر الحالي المضمّن + المجمّع
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (تُسمح التعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يكون قسم إعداداتها موجودًا (إلا إذا كان `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك |
| -------------------- | ------ |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist` | فقط المرسلون الموجودون في `allowFrom` (أو في مخزن السماح المقترن) |
| `open` | السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled` | تجاهل جميع الرسائل الخاصة الواردة |

| سياسة المجموعات | السلوك |
| --------------- | ------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المُعدّة |
| `open` | تجاوز قوائم السماح للمجموعات (مع استمرار تطبيق التقييد بالذكر) |
| `disabled` | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` السياسة الافتراضية عندما لا تكون `groupPolicy` الخاصة بمزوّد معيّن مضبوطة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى لطلبات اقتران الرسائل الخاصة المعلّقة بـ **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، فإن سياسة المجموعات أثناء التشغيل تعود إلى `allowlist` (إغلاق افتراضي آمن) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكوّنة. يُطبَّق تعيين القناة عندما لا تكون الجلسة تحتوي أصلًا على تجاوز للنموذج (على سبيل المثال، معيّن عبر `/model`).

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

### القيم الافتراضية للقنوات وHeartbeat

استخدم `channels.defaults` للسلوك المشترك لسياسة المجموعات وHeartbeat عبر المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد مضبوطة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق الإضافي لجميع القنوات. القيم: `all` (الافتراضي، يضمّن كل سياق الاقتباس/الخيط/السجل)، و`allowlist` (يضمّن السياق فقط من المرسلين الموجودين في قائمة السماح)، و`allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز على مستوى القناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بنمط مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في Gateway ‏(Baileys Web). ويبدأ تلقائيًا عندما توجد جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // علامات الصح الزرقاء (false في وضع الدردشة الذاتية)
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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فسيُستخدم أول معرّف حساب مُعدّ (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الافتراضي الاحتياطي للحساب عندما يطابق معرّف حساب مُعدًّا.
- ينقل `openclaw doctor` دليل مصادقة Baileys القديم ذي الحساب الواحد إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (الافتراضي: off؛ فعّل ذلك صراحةً لتجنّب حدود المعدّل الخاصة بتعديل المعاينات)
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- في إعدادات تعدد الحسابات (معرّفا حساب أو أكثر)، اضبط افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنّب التوجيه الاحتياطي؛ ويصدر `openclaw doctor` تحذيرًا عندما يكون هذا غير موجود أو غير صالح.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram ‏(عمليات ترحيل معرّفات المجموعات الفائقة، و`/config set|unset`).
- تُهيّئ الإدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram ‏`sendMessage` + `editMessageText` (وتعمل في المحادثات المباشرة والجماعية).
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
      streaming: "off", // off | partial | block | progress (يُطابِق progress إلى partial على Discord)
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
        spawnSubagentSessions: false, // تفعيل اختياري لجلسات sessions_spawn({ thread: true })
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

- الرمز المميّز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord ذلك الرمز المميّز لهذا الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسات الخاصة بالحساب مأخوذة من الحساب المحدد في اللقطة النشطة أثناء التشغيل.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة guild) كأهداف للتسليم؛ وتُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة لـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي يكتبها البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائل البوت نفسه).
- يقوم `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) بإسقاط الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر ولكنها لا تذكر البوت (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` (الافتراضي 17) بتقسيم الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح تفعيل اختياري لإنشاء/ربط الخيوط تلقائيًا عبر `sessions_spawn({ thread: true })`
- تُهيّئ الإدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية، مع تجاوزات اختيارية للانضمام التلقائي + TTS.
- يمرّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` مباشرة إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة صوتية ثم إعادة الانضمام إليها بعد تكرار حالات فشل فك التشفير.
- المفتاح القياسي لوضع البث هو `channels.discord.streaming`. وتُنقل تلقائيًا القيم القديمة `streamMode` وقيم `streaming` المنطقية.
- يربط `channels.discord.autoPresence` حالة التوفر أثناء التشغيل بحالة حضور البوت (سليم => online، متدهور => idle، مستنزف => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة بحسب الاسم/الوسم القابل للتغيير (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. تعود إلى `commands.ownerAllowFrom` عند الحذف.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: مكان إرسال طلبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل الخاصة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين الذين تم حلّهم.
  - `cleanupAfterResolve`: عندما تكون قيمته `true`، يحذف رسائل الموافقة الخاصة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (لا شيء)، و`own` (رسائل البوت، الافتراضي)، و`all` (كل الرسائل)، و`allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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

- JSON الخاص بحساب الخدمة: مضمّن مباشرة (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- البدائل من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` كأهداف للتسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة البريد الإلكتروني القابلة للتغيير (وضع توافق طارئ).

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

- **وضع Socket** يتطلب كِلا `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كبديل من البيئة للحساب الافتراضي).
- **وضع HTTP** يتطلب `botToken` بالإضافة إلى `signingSecret` (على الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تكشف لقطات حساب Slack عن حقول مصدر/حالة لكل بيانات الاعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مُعدّ عبر SecretRef لكن مسار الأمر/التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- المفتاح القياسي لوضع البث في Slack هو `channels.slack.streaming.mode`. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. وتُنقل تلقائيًا القيم القديمة `streamMode` وقيم `streaming` المنطقية و`nativeStreaming`.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` كأهداف للتسليم.

**أوضاع إشعارات التفاعل:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات الخيوط:** يكون `thread.historyScope` لكل خيط على حدة (الافتراضي) أو مشتركًا على مستوى القناة. ويقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى الخيوط الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة الخيط بأسلوب Slack assistant "is typing..." هدف رد داخل خيط. تبقى الرسائل الخاصة ذات المستوى الأعلى خارج الخيط افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بأسلوب الخيط.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم رمزًا مختصرًا لإيموجي Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتخويل الموافقين. نفس مخطط Discord: ‏`enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ---------------- | --------- | ------- |
| reactions | مفعّل | التفاعل + عرض قائمة التفاعلات |
| messages | مفعّل | قراءة/إرسال/تعديل/حذف |
| pins | مفعّل | تثبيت/إلغاء تثبيت/عرض القائمة |
| memberInfo | مفعّل | معلومات العضو |
| emojiList | مفعّل | قائمة الإيموجي المخصصة |

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
        // عنوان URL صريح اختياري لبيئات النشر العامة/ذات الوكيل العكسي
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع الدردشة: `oncall` (الرد عند @-mention، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`) وليس عنوان URL كاملًا.
- يجب أن يُحل `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تُوثّق استدعاءات slash الأصلية الراجعة باستخدام الرموز المميّزة الخاصة بكل أمر
  التي يعيدها Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم
  تُفعَّل أي أوامر، يرفض OpenClaw الاستدعاءات الراجعة برسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الراجع من النوع private/tailnet/internal، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء الراجع.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز اشتراط الذكر لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // ربط حساب اختياري
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

**أوضاع إشعارات التفاعل:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعومًا بواسطة Plugin، ويُضبط ضمن `channels.bluebubbles`).

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
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- يمكن لإدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم BlueBubbles handle أو سلسلة الهدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- إعداد قناة BlueBubbles الكامل موثّق في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يقوم OpenClaw بتشغيل `imsg rpc` ‏(JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضَّل استخدام الأهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لعرض قائمة الدردشات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle مُطبّعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تتم إدارة Matrix عبر extension وتُضبط ضمن `channels.matrix`.

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

- تستخدم مصادقة الرمز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسمّاة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وهذا التفعيل الشبكي عنصرَي تحكم مستقلين.
- يختار `channels.matrix.defaultAccount` الحساب المفضّل في إعدادات تعدد الحسابات.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا تُتجاهل الغرف المدعوّة ودعوات الرسائل الخاصة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتخويل الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: مكان إرسال طلبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix الخاصة ضمن الجلسات: يشارك `per-user` (الافتراضي) حسب النظير الموجَّه، بينما يعزل `per-room` كل غرفة رسائل خاصة على حدة.
- تستخدم فحوصات الحالة في Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة لحركة التشغيل.
- إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تتم إدارة Microsoft Teams عبر extension وتُضبط ضمن `channels.msteams`.

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
- إعداد Teams الكامل (بيانات الاعتماد، وWebhook، وسياسة الرسائل الخاصة/المجموعات، والتجاوزات لكل فريق/قناة) موثّق في [Microsoft Teams](/ar/channels/msteams).

### IRC

تتم إدارة IRC عبر extension وتُضبط ضمن `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الذكر) موثّق في [IRC](/ar/channels/irc).

### تعدد الحسابات (جميع القنوات)

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

- يُستخدم `default` عند حذف `accountId` (CLI + التوجيه).
- لا تُطبّق رموز البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو عبر onboarding للقناة) بينما لا تزال تستخدم إعداد قناة من المستوى الأعلى بحساب واحد، فإن OpenClaw ينقل أولًا القيم العلوية ذات الحساب الواحد والمقيّدة بالحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي موجود ومطابق.
- تستمر الارتباطات الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات المقيّدة بالحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل القيم العلوية ذات الحساب الواحد والمقيّدة بالحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي موجود ومطابق.

### قنوات extension الأخرى

تُضبط العديد من قنوات extension على شكل `channels.<id>` وتُوثَّق في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الذكر في دردشات المجموعات

تكون رسائل المجموعات افتراضيًا **مطلِبة للذكر** (ذكر عبر البيانات الوصفية أو عبر أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الذكر:**

- **الذكر عبر البيانات الوصفية**: إشارات @ الأصلية في المنصة. تُتجاهل في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة ضمن `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الذكر إلا عندما يكون الاكتشاف ممكنًا (الذكر الأصلي أو وجود نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبط القيمة على `0` للتعطيل.

#### حدود سجل الرسائل الخاصة

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

آلية الحل: تجاوز لكل رسالة خاصة → افتراضي المزوّد → بلا حد (الاحتفاظ بكل شيء).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويرد فقط على أنماط النص):

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

- تهيّئ هذه الكتلة أسطح الأوامر. لفهرس الأوامر الحالي المضمّن + المجمّع، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وLINE ‏`/card`، وdevice-pair ‏`/pair`، وmemory ‏`/dreaming`، وphone-control ‏`/phone`، وTalk ‏`/voice` موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يعمل `native: "auto"` على تفعيل الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack معطّلًا.
- يعمل `nativeSkills: "auto"` على تفعيل أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack معطّلًا.
- يمكن التجاوز لكل قناة عبر `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجّلة سابقًا.
- يمكن تجاوز تسجيل Skills الأصلية لكل قناة عبر `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (لقراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء Gateway ‏`chat.send`، تتطلب كتابات `/config set|unset` الدائمة أيضًا `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعدادات خوادم MCP المُدارة بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها والتحكم في تفعيلها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في عمليات تغيير الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- يمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهو منفصل عن `allowFrom`.
- يؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في موجّه النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- يكون `allowFrom` لكل مزوّد. وعند ضبطه، يصبح **مصدر التفويض الوحيد** (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة وثائق الأوامر:
  - الفهرس المضمّن + المجمّع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - Dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في موجّه النظام. إذا لم يُضبط، يكتشفه OpenClaw تلقائيًا عبر الصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـ Skills للوكلاء الذين لا يضبطون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تكون القائمة غير الفارغة في `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛
  ولا يتم دمجها مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت إدراج ملفات bootstrap الخاصة بمساحة العمل في موجّه النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى دورات الاستكمال الآمنة (بعد اكتمال رد المساعد) إعادة إدراج bootstrap الخاص بمساحة العمل، مما يقلل حجم الموجّه. وتظل عمليات Heartbeat وإعادات المحاولة بعد Compaction تعيد بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المُدرجة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يتم اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يُدرج نص التحذير في موجّه النظام مطلقًا.
- `"once"`: يدرج التحذير مرة واحدة لكل بصمة اقتطاع فريدة (موصى به).
- `"always"`: يدرج التحذير في كل تشغيل عندما يوجد اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة داخل كتل صور السجل/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم الأقل عادةً من استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات التي تتضمن كثيرًا من لقطات الشاشة.
وتحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق موجّه النظام (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف إذا لم تُضبط.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في موجّه النظام. الافتراضي: `auto` (تفضيل نظام التشغيل).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // معلمات المزوّد الافتراضية العامة
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- يقبل `model` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يضبط شكل السلسلة النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج الإخفاق الاحتياطية المرتبة.
- يقبل `imageModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- يقبل `imageGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولد صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة/مفتاح API المطابق للمزوّد (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال `image_generate` قادرًا على استنتاج افتراضي مزوّد مدعوم بالمصادقة. فهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجّلين بترتيب معرّف المزوّد.
- يقبل `musicGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة وبواسطة الأداة المضمّنة `music_generate`.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا حُذف، فلا يزال `music_generate` قادرًا على استنتاج افتراضي مزوّد مدعوم بالمصادقة. فهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجّلين بترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة/مفتاح API المطابق للمزوّد.
- يقبل `videoGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة وبواسطة الأداة المضمّنة `video_generate`.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال `video_generate` قادرًا على استنتاج افتراضي مزوّد مدعوم بالمصادقة. فهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجّلين بترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة/مفتاح API المطابق للمزوّد.
  - يدعم مزوّد توليد الفيديو Qwen المجمّع حتى 1 فيديو ناتج، و1 صورة إدخال، و4 مقاطع فيديو إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- يقبل `pdfModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي الذي تم حلّه.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرَّر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` في الاعتبار.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: بالتنسيق `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت المزوّد، فإن OpenClaw يحاول أولًا اسمًا مستعارًا، ثم مزودًا مهيأً مطابقًا بشكل فريد لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق قديم مهمَل، لذا يُفضَّل استخدام `provider/model` الصريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، فإن OpenClaw يعود إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المهيأ وقائمة السماح للأمر `/model`. ويمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معلمات المزوّد الافتراضية العامة المطبّقة على جميع النماذج. تُضبط عند `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تتجاوز `agents.list[].params` (للوكيل المطابق في المعرّف) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل الافتراضية منخفضة المستوى للوكلاء المضمّنين. استخدم `runtime: "auto"` للسماح لـ plugin harnesses المسجّلة بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض PI harness المضمّن، أو معرّف harness مسجّل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- تحفظ كاتبات الإعدادات التي تغيّر هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة البدائل الاحتياطية) شكل الكائن القياسي وتحافظ على قوائم البدائل الاحتياطية الموجودة كلما أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكيل المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المُنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمّنة.
ينبغي أن تحافظ معظم البيئات على القيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق native harness، مثل
Codex app-server harness المجمّع.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف plugin harness مسجّل. يسجّل Plugin Codex المجمّع المعرّف `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. تُبقي `"pi"` على PI harness المضمّن كبديل توافق. وتجعل `"none"` اختيار plugin harness المفقود أو غير المدعوم يفشل بدلًا من استخدام PI بصمت.
- تجاوزات البيئة: يقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الرجوع إلى PI لتلك العملية.
- لبيئات Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في chat harness المضمّن. أما توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS فما تزال تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (تنطبق فقط عندما يكون النموذج ضمن `agents.defaults.models`):

| الاسم المستعار | النموذج |
| -------------- | ------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5.4-mini` |
| `gpt-nano` | `openai/gpt-5.4-nano` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تفوز الأسماء المستعارة التي تضبطها أنت دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI القيمة `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيلها.
وتستخدم نماذج Anthropic Claude 4.6 افتراضيًا نمط التفكير `adaptive` عندما لا يكون مستوى التفكير مضبوطًا صراحةً.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الاحتياط النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عندما تفشل مزوّدات API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- واجهات CLI الخلفية مخصّصة للنص أولًا؛ وتكون الأدوات دائمًا معطّلة.
- تكون الجلسات مدعومة عندما يكون `sessionArg` مضبوطًا.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات ملفات.

### `agents.defaults.systemPromptOverride`

استبدل موجّه النظام الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم لكل وكيل ذات أولوية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. وهو مفيد لتجارب الموجّهات المضبوطة.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

تشغيلات Heartbeat الدورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطّل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ تجعل false قسم Heartbeat يُحذف من موجّه النظام
        lightContext: false, // الافتراضي: false؛ تجعل true تحتفظ فقط بـ HEARTBEAT.md من ملفات bootstrap الخاصة بمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ تجعل true كل Heartbeat تعمل في جلسة جديدة (من دون سجل محادثة)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة API-key) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عندما تكون false، يحذف قسم Heartbeat من موجّه النظام ويتخطى إدراج `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عندما تكون true، تُخفى حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدور وكيل Heartbeat قبل إيقافه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/عبر الرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. وتمنع `block` التسليم إلى الهدف المباشر وتُصدر `reason=dm-blocked`.
- `lightContext`: عندما تكون true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عندما تكون true، تعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نفس نمط العزل الخاص بـ Cron ‏`sessionTarget: "isolated"`. ويقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم من يشغّلون Heartbeat.
- تشغّل Heartbeats أدوار وكيل كاملة — والفواصل الأقصر تستهلك رموزًا أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزوّد Compaction مسجّل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "احتفظ بمعرّفات النشر، ومعرّفات التذاكر، وأزواج host:port كما هي تمامًا.", // يُستخدم عندما تكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الإدراج
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // أرسل إشعارًا موجزًا عند بدء Compaction (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "تقترب الجلسة من Compaction. خزّن الذكريات الدائمة الآن.",
          prompt: "اكتب أي ملاحظات دائمة في memory/YYYY-MM-DD.md؛ وردّ بالرمز الصامت الدقيق NO_REPLY إذا لم يكن هناك شيء لتخزينه.",
        },
      },
    },
  },
}
```

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالمزوّد بدلًا من التلخيص المضمّن المعتمد على LLM. ويعود إلى المضمّن عند الفشل. يؤدي ضبط مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يقوم OpenClaw بإيقافها. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` (الافتراضي)، أو `off`، أو `custom`. تضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة قبل تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة إدراجها بعد Compaction. القيم الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبطها على `[]` لتعطيل إعادة الإدراج. وعند عدم ضبطها أو عند ضبطها صراحةً على ذلك الزوج الافتراضي، تُقبل أيضًا العناوين الأقدم `Every Session`/`Safety` كخيار احتياطي قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج معيّن بينما تُشغَّل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارًا موجزًا إلى المستخدم عند بدء Compaction (مثل: "Compacting context..."). وهو معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، الوحدة الافتراضية: الدقائق
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[تم مسح محتوى نتيجة أداة قديمة]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` عمليات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن بعدها تشغيل التقليم مرة أخرى (بعد آخر لمسة لذاكرة التخزين المؤقت).
- تقوم عملية التقليم أولًا بقص نتائج الأدوات كبيرة الحجم قصًا خفيفًا، ثم تمسح نتائج الأدوات الأقدم مسحًا كاملًا إذا لزم الأمر.

**القص الخفيف** يحتفظ بالبداية + النهاية ويُدرج `...` في المنتصف.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالنص البديل.

ملاحظات:

- لا يتم قص/مسح كتل الصور أبدًا.
- تعتمد النِّسب على الأحرف (تقريبية)، لا على عدد الرموز الدقيق.
- إذا وُجد أقل من `keepLastAssistants` من رسائل المساعد، يتم تخطي التقليم.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) لتفاصيل السلوك.

### البث على شكل كتل

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (استخدم minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتفعيل الردود على شكل كتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيراتها لكل حساب). تستخدم Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. تعني `natural` = ‏800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لسلوك + تفاصيل التجزئة.

### مؤشرات الكتابة

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

إعدادات sandbox اختيارية للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // كما أن SecretRefs / المحتويات المضمّنة مدعومة أيضًا:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="تفاصيل sandbox">

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد واجهة SSH الخلفية:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH ‏(الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمّنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر تحكم في سياسة مفاتيح المضيف الخاصة بـ OpenSSH

**أسبقية مصادقة SSH:**

- تتقدّم `identityData` على `identityFile`
- تتقدّم `certificateData` على `certificateFile`
- تتقدّم `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة sandbox

**سلوك واجهة SSH الخلفية:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي المرجع الأساسي
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح sandbox

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل sandbox لكل نطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تركيب مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // اختياري
          gatewayEndpoint: "https://lab.example", // اختياري
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // اختياري
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: زرع البعيد من المحلي قبل `exec`، ثم المزامنة العكسية بعد `exec`؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: زرع البعيد مرة واحدة عند إنشاء sandbox، ثم إبقاء مساحة العمل البعيدة هي المرجع الأساسي

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى sandbox تلقائيًا بعد خطوة الزرع.
النقل يتم عبر SSH إلى sandbox الخاص بـ OpenShell، لكن Plugin يملك دورة حياة sandbox والمزامنة العكسية الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويتطلب خروجًا شبكيًا، وجذرًا قابلًا للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. كما يتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (وضع طارئ).

**تُجهَّز المرفقات الواردة** في `media/inbound/*` ضمن مساحة العمل النشطة.

يقوم **`docker.binds`** بتركيب أدلة إضافية من المضيف؛ ويتم دمج عمليات التركيب العامة وتلك الخاصة بكل وكيل.

**متصفح sandbox** ‏(`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم إدراج رابط noVNC في موجّه النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويُصدر OpenClaw رابط رمز مميّز قصير العمر (بدلًا من كشف كلمة المرور في الرابط المشترك).

- يؤدي `allowHostControl: false` (الافتراضي) إلى منع الجلسات المعزولة من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة إضافية من المضيف داخل حاوية متصفح sandbox فقط. وعند ضبطه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` بالنسبة إلى حاوية المتصفح.
- تُعرَّف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وتُضبط لمضيفات الحاويات:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (مفعّل افتراضيًا)
  - يتم تفعيل `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    افتراضيًا، ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/الرسوم ثلاثية الأبعاد يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كانت
    سيرتك تعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عند تفعيل `noSandbox`.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير الإعدادات الافتراضية للحاوية.

</Accordion>

يتوفر عزل المتصفح و`sandbox.docker.binds` في Docker فقط.

أنشئ الصور:

```bash
scripts/sandbox-setup.sh           # صورة sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` (تجاوزات لكل وكيل)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى التفكير الافتراضي لكل وكيل
        reasoningDefault: "on", // تجاوز إظهار الاستدلال الافتراضي لكل وكيل
        fastModeDefault: false, // تجاوز الوضع السريع الافتراضي لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز مفاتيح params المطابقة في defaults.models
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند ضبطه
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند ضبط عدة وكلاء، يفوز الأول (مع تسجيل تحذير). وإذا لم يُضبط أيٌّ منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز شكل السلسلة `primary` فقط؛ بينما يتجاوز شكل الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل البدائل الاحتياطية العامة). تظل مهام Cron التي تتجاوز `primary` فقط ترث البدائل الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلًا من دمجها، بينما تعني `[]` عدم وجود Skills.
- `thinkingDefault`: تجاوز اختياري لمستوى التفكير الافتراضي لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو لكل جلسة.
- `reasoningDefault`: تجاوز اختياري لإظهار الاستدلال الافتراضي لكل وكيل (`on | off | stream`). ويُطبَّق عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو لكل جلسة.
- `fastModeDefault`: افتراضي اختياري للوضع السريع لكل وكيل (`true | false`). ويُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو لكل جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد يستخدم Codex فقط بينما يحتفظ الوكلاء الآخرون بالرجوع الافتراضي إلى PI.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية في `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل افتراضيًا جلسات ACP harness.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL ‏`http(s)`، أو URI من نوع `data:`.
- تستمد `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لاستخدام `sessions_spawn` (`["*"]` = أي وكيل؛ والافتراضي: الوكيل نفسه فقط).
- حارس وراثة sandbox: إذا كانت جلسة الطالب داخل sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل من دون sandbox.
- `subagents.requireAgentId`: عندما تكون true، تُحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [تعدد الوكلاء](/ar/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### حقول مطابقة الربط

- `type` (اختياري): القيمة `route` للتوجيه العادي (ويؤدي غياب النوع إلى اعتبار القيمة route افتراضيًا)، و`acp` لارتباطات محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لإدخالات `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة بالكامل)
6. الوكيل الافتراضي

ضمن كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالحل حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات ربط route المذكور أعلاه.

### ملفات وصول لكل وكيل

<Accordion title="وصول كامل (من دون sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="أدوات + مساحة عمل للقراءة فقط">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="من دون وصول إلى نظام الملفات (مراسلة فقط)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) لتفاصيل الأولوية.

---

## الجلسة

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // تخطّي تفريع الخيط الأصل إذا تجاوز هذا العدد من الرموز (0 يعطّل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية قصوى اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // الإلغاء التلقائي الافتراضي للتركيز بعد عدم النشاط بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (يستخدم وقت التشغيل دائمًا "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات دردشات المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك كل الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القياسية بالنظراء ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` حسب الوقت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعند ضبطهما معًا، يفوز أول ما تنتهي صلاحيتهما.
- **`resetByType`**: تجاوزات لكل نوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى المسموح به لـ `totalTokens` في الجلسة الأصلية عند إنشاء جلسة خيط متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلًا من وراثة سجل المحادثة من الأصل.
  - اضبطها على `0` لتعطيل هذا الحارس والسماح دائمًا بالتفريع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لدلو الدردشة المباشرة الرئيسي.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات الوكيل إلى الوكيل (عدد صحيح، المجال: `0`–`5`). تؤدي القيمة `0` إلى تعطيل سلسلة ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. وأول رفض يفوز.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يؤدي `warn` إلى إصدار تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. ويكون افتراضيًا مساويًا لـ `pruneAfter`؛ واضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالخيط.
  - `enabled`: المفتاح الافتراضي الرئيسي (يمكن للمزوّدين تجاوزه؛ ويستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز بعد عدم النشاط بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // أو "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 يعطّل
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الاستجابة

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

آلية الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تؤدي القيمة `""` إلى التعطيل وإيقاف التسلسل. وتقوم `"auto"` باشتقاق `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | المثال |
| ------- | ------ | ------- |
| `{model}` | الاسم المختصر للنموذج | `claude-opus-4-6` |
| `{modelFull}` | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}` | اسم المزوّد | `anthropic` |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` أو `low` أو `off` |
| `{identity.name}` | اسم هوية الوكيل | (مثل `"auto"`) |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل التأكيد

- يكون افتراضيًا مساويًا لـ `identity.emoji` الخاص بالوكيل النشط، وإلا فالقيمة `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، أو `group-all`، أو `direct`، أو `all`.
- يزيل `removeAckAfterReply` تفاعل التأكيد بعد الرد على Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة الخاصة بدورة الحياة على Slack وDiscord وTelegram.
  وفي Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات الحالة الخاصة بدورة الحياة.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. وتُفرَّغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

### TTS ‏(تحويل النص إلى كلام)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن للأمر `/tts on|off` تجاوز التفضيلات المحلية، بينما يعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ بينما تكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تفعيل اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية TTS الخاصة بـ OpenAI. وترتيب الحل هو: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست OpenAI، فإن OpenClaw يعاملها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk ‏(macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عندما تكون عدة مزوّدات Talk مهيّأة.
- مفاتيح Talk القديمة المسطّحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصّصة للتوافق فقط، ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الرجوع إلى `ELEVENLABS_API_KEY` إلا عندما لا يكون أي مفتاح API لـ Talk مهيّأ.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودّية.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المفرّغ. وعند عدم ضبطه، يحتفظ بنافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية onboarding المحلية الإعدادات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عندما لا تكون مضبوطة (مع الحفاظ على ملفات التعريف الصريحة الموجودة).

| ملف التعريف | يتضمن |
| ----------- | ------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status` |
| `full`      | بلا تقييد (مثل غير المضبوط) |

### مجموعات الأدوات

| المجموعة | الأدوات |
| -------- | ------- |
| `group:runtime`    | `exec` و`process` و`code_execution` (ويُقبل `bash` كاسم مستعار لـ `exec`) |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch` |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get` |
| `group:web`        | `web_search` و`x_search` و`web_fetch` |
| `group:ui`         | `browser` و`canvas` |
| `group:automation` | `cron` و`gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes` |
| `group:agents`     | `agents_list` |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts` |
| `group:openclaw`   | جميع الأدوات المضمّنة (باستثناء Plugins الخاصة بالمزوّدات) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبَّق حتى عندما يكون Docker sandbox معطّلًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لمزوّدات أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف المزوّد → السماح/المنع.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

يتحكم في وصول `exec` المرتفع خارج sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا أن يقيّد أكثر.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ بينما تنطبق التوجيهات المضمّنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل في sandbox ويستخدم مسار الهروب المُعدّ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

فحوصات أمان حلقات الأدوات تكون **معطّلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عمومًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: الحد الأقصى لسجل استدعاءات الأدوات المحتفظ به لتحليل الحلقات.
- `warningThreshold`: عتبة النمط المتكرر من دون تقدم لإصدار التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل من دون تقدم.
- `detectors.genericRepeat`: التحذير عند تكرار استدعاءات الأداة نفسها/المعاملات نفسها.
- `detectors.knownPollNoProgress`: التحذير/الحظر على أدوات polling المعروفة (`process.poll` و`command_status` وغيرها).
- `detectors.pingPong`: التحذير/الحظر على أنماط الأزواج المتناوبة من دون تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو BRAVE_API_KEY من البيئة
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // اختياري؛ احذفه للكشف التلقائي
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

يهيّئ فهم الوسائط الواردة (الصورة/الصوت/الفيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // تفعيل اختياري: أرسل الموسيقى/الفيديو غير المتزامن المكتمل مباشرة إلى القناة
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="حقول إدخال نموذج الوسائط">

**إدخال المزوّد** (`type: "provider"` أو عند الحذف):

- `provider`: معرّف مزوّد API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وغير ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: معاملات بقوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وغير ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود حالات الفشل إلى الإدخال التالي.

تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة أولًا التسليم المباشر إلى القناة. الافتراضي: `false`
  (مسار legacy requester-session wake/model-delivery).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`).

الافتراضي: `tree` (الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

ملاحظات:

- `self`: مفتاح الجلسة الحالية فقط.
- `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد sandbox: عندما تكون الجلسة الحالية داخل sandbox وكانت `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض القيمة `tree` على الرؤية حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمّنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // تفعيل اختياري: اضبطه على true للسماح بمرفقات ملفات مضمّنة
        maxTotalBytes: 5242880, // 5 MB إجمالًا عبر كل الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // احتفظ بالمرفقات عندما تكون cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُحوَّل الملفات إلى مساحة عمل الابن ضمن `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تلقائيًا حجب محتوى المرفقات من حفظ السجل.
- يتم التحقق من مدخلات Base64 باستخدام فحوصات صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- أذونات الملفات هي `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: تقوم `delete` دائمًا بإزالة المرفقات؛ بينما تحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمّنة التجريبية. تكون معطّلة افتراضيًا ما لم تُطبَّق قاعدة تفعيل تلقائي صارمة لوكيلية GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // تفعيل update_plan التجريبية
    },
  },
}
```

ملاحظات:

- `planTool`: يفعّل الأداة المنظَّمة `update_plan` لتتبع العمل غير البسيط متعدد الخطوات.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. اضبطه على `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو على `false` للإبقاء عليها معطّلة حتى في تشغيلات strict-agentic GPT-5.
- عند التفعيل، يضيف موجّه النظام أيضًا إرشادات استخدام بحيث يستخدمها النموذج فقط في الأعمال الجوهرية ويحافظ على خطوة واحدة فقط كحد أقصى في حالة `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: النموذج الافتراضي للوكلاء الفرعيين الذين يتم إنشاؤهم. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفة في `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ والافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني القيمة `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدات المخصصة وBase URLs

يستخدم OpenClaw فهرس النماذج المضمّن. أضف مزوّدات مخصصة عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (الافتراضي) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
- تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير بيئة).
- أسبقية الدمج لمعرّفات المزوّد المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق الإعدادات/ملف المصادقة الحالي.
  - يتم تحديث قيم `apiKey` للمزوّدات المُدارة عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
  - يتم تحديث قيم ترويسات المزوّدات المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المحذوفة في الوكيل إلى `models.providers` في الإعدادات.
  - تستخدم قيم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين الإعداد الصريح وقيم الفهرس الضمنية.
  - يحافظ `contextTokens` للنموذج المطابق على حد وقت التشغيل الصريح عندما يكون موجودًا؛ استخدمه لتقييد السياق الفعلي من دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول المزوّد

- `models.mode`: سلوك فهرس المزوّد (`merge` أو `replace`).
- `models.providers`: خريطة المزوّدات المخصصة مفهرسة بحسب معرّف المزوّد.
- `models.providers.*.api`: مكيّف الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وغير ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يُفضَّل استخدام SecretRef/استبدال متغيرات البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يدرج `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API في المصدر.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع القيم الافتراضية للمزوّد). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز لاستراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدم مصادقة المزوّد المضمّنة)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدم متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` (مع `url`). ويقبل كلا الوضعين كائن `tls` فرعيًا اختياريًا.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef)، و`serverName`، و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، يسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حارس جلب HTTP الخاص بالمزوّد (تفعيل اختياري من المشغّل لنقاط نهاية OpenAI-compatible ذاتية الاستضافة والموثوق بها). ويستخدم WebSocket الكائن `request` نفسه للترويسات/TLS لكن ليس حارس SSRF هذا الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس النماذج الصريحة للمزوّد.
- `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة سياق النموذج الأصلية.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. أما `baseUrl` الفارغ/المحذوف فيُبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية chat المتوافقة مع OpenAI والتي تقبل النصوص فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد للاكتشاف الموجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة polling لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الإخراج للنماذج المكتشفة.

### أمثلة على المزوّدات

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ واستخدم `zai/glm-4.7` مع Z.AI مباشرةً.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لفهرس Zen أو مراجع `opencode-go/...` لفهرس Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

اضبط `ZAI_API_KEY`. وتُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف مزودًا مخصصًا مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

بالنسبة إلى نقطة نهاية الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل
`openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف المزوّد المضمّن وحده.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

متوافق مع Anthropic، ومزوّد مضمّن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (متوافق مع Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

يجب أن يحذف Base URL المقطع `/v1` (لأن عميل Anthropic يضيفه). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (مباشر)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

اضبط `MINIMAX_API_KEY`. الاختصارات:
`openclaw onboard --auth-choice minimax-global-api` أو
`openclaw onboard --auth-choice minimax-cn-api`.
يفترض فهرس النماذج استخدام M2.7 فقط.
في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. ويعيد `/fast on` أو
`params.fastMode: true` كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجةً كبديل احتياطي.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية صريحة
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمّعة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عندما تكون true، تُفضَّل أدوات التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع التثبيت الأخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعلن متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- يُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح لمفتاح API على مستوى Plugin (عندما يكون مدعومًا من Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core الخطاف `before_prompt_build` ويتجاهل الحقول المعدِّلة للموجّه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على خطافات Plugin الأصلية وعلى أدلة الخطافات التي توفرها الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في عمليات الوكلاء الفرعيين الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكلاء الفرعيين الموثوق بها. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (ويتحقق منه مخطط Plugin الأصلي في OpenClaw عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد web-fetch الخاص بـ Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). ويعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان API الأساسي لـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر لذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تفعيل مزوّد X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - تعد سياسة المراحل والعتبات من تفاصيل التنفيذ (وليست مفاتيح إعدادات موجهة للمستخدم).
- يوجد إعداد الذاكرة الكامل في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لحزم Claude المفعّلة أن تساهم بإعدادات Pi مضمّنة افتراضية من `settings.json`؛ ويطبّق OpenClaw هذه القيم كإعدادات وكيل منظّفة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي هو `"legacy"` ما لم تثبّت محركًا آخر وتحدده.
- `plugins.installs`: بيانات تعريف التثبيت التي يديرها CLI وتُستخدم بواسطة `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ ويفضَّل استخدام أوامر CLI بدلًا من التعديلات اليدوية.

راجع [Plugin](/ar/tools/plugin).

---

## المتصفح

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // فعّل فقط عند الثقة المقصودة في الوصول إلى الشبكات الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح إلى الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة في وضع attach-only (ويتم تعطيل البدء/الإيقاف/إعادة التعيين).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك المزوّد بعنوان DevTools WebSocket مباشر.
- تكون ملفات تعريف `existing-session` خاصة بالمضيف فقط وتستخدم Chrome MCP بدلًا من CDP.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف
  ملف تعريف متصفح معيّن قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بالقيود الحالية لمسار Chrome MCP:
  إجراءات تعتمد على اللقطات/المراجع بدلًا من استهداف محددات CSS، وخطافات رفع
  ملف واحد، ومن دون تجاوزات لمهلات مربعات الحوار، ومن دون `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدفعية.
- تقوم ملفات تعريف `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يقوم `extraArgs` بإلحاق أعلام تشغيل إضافية ببدء Chromium المحلي (مثل
  `--disable-gpu`، أو تغيير حجم النافذة، أو أعلام التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // إيموجي، نص قصير، URL لصورة، أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (مثل تلوين فقاعة Talk Mode، وما إلى ذلك).
- `assistant`: تجاوز لهوية Control UI. ويعود إلى هوية الوكيل النشط.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // أو OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // للوضع mode=trusted-proxy؛ راجع /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // خطير: السماح بعناوين تضمين خارجية مطلقة http(s)
      // allowedOrigins: ["https://control.example.com"], // مطلوب لـ Control UI غير loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع خطير للرجوع إلى الأصل عبر ترويسة Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // اختياري. الافتراضي false.
    allowRealIpFallback: false,
    tools: {
      // عمليات منع HTTP إضافية لـ /tools/invoke
      deny: ["browser"],
      // إزالة أدوات من قائمة المنع الافتراضية لـ HTTP
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="تفاصيل حقول Gateway">

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). ويرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ متعدد الإرسال واحد لكل من WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` (عنوان Tailscale IP فقط) أو `custom`.
- **الأسماء المستعارة القديمة لـ bind**: استخدم قيم وضع bind في `gateway.bind` (`auto` و`loopback` و`lan` و`tailnet` و`custom`) وليس الأسماء المستعارة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: الربط الافتراضي `loopback` يستمع على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge ‏(`-p 18789:18789`) تصل الحركة إلى `eth0`، لذا يصبح Gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب الروابط غير loopback مصادقة Gateway. وعمليًا يعني ذلك استخدام رمز مميّز/كلمة مرور مشتركة أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. وينشئ معالج onboarding رمزًا مميّزًا افتراضيًا.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مهيأتين (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً إلى `token` أو `password`. وتفشل عمليات البدء وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأً ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط في إعدادات local loopback الموثوق بها؛ وهذا الخيار غير معروض عمدًا في موجّهات onboarding.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy واعٍ بالهوية وثق في ترويسات الهوية القادمة من `gateway.trustedProxies` (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر proxy **غير loopback**؛ إذ لا تستوفي reverse proxies ذات الـ loopback على المضيف نفسه متطلبات مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة Control UI/WebSocket (بعد التحقق عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي في Gateway. ويفترض هذا التدفق بلا رمز مميّز أن مضيف Gateway موثوق. وتكون القيمة الافتراضية `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. ويُطبَّق لكل عنوان IP للعميل ولكل نطاق مصادقة (تُتتبّع الأسرار المشتركة ورموز الأجهزة بشكل مستقل). وتعيد المحاولات المحجوبة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن في Tailscale Serve، يتم تسلسل المحاولات الفاشلة للزوج نفسه `{scope, clientIp}` قبل كتابة الفشل. ولذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد في الطلب الثاني بدلًا من مرور الطلبين كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ واضبطها على `false` عندما تريد عمدًا فرض التقييد على حركة localhost أيضًا (لاختبارات أو إعدادات proxy صارمة).
- تخضع محاولات مصادقة WS ذات أصل المتصفح دائمًا للتقييد مع تعطيل إعفاء loopback (دفاع إضافي ضد محاولات التخمين القسري من المتصفح إلى localhost).
- في loopback، تكون عمليات الحظر هذه ذات أصل المتصفح معزولة لكل قيمة `Origin`
  مُطبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد إلى
  حظر أصل مختلف تلقائيًا.
- `tailscale.mode`: ‏`serve` (tailnet فقط، مع bind على loopback) أو `funnel` (عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقَّع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى الأصل عبر ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة الأصل القائمة على ترويسة Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن تكون `remote.url` من النوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باستخدام `ws://` النصي إلى عناوين IP موثوق بها داخل الشبكات الخاصة؛ بينما يبقى الافتراضي مقصورًا على loopback بالنسبة إلى النقل النصي.
- `gateway.remote.token` / `.password`: حقول بيانات اعتماد عميل بعيد. وهي لا تهيّئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للـ relay الخارجي الخاص بـ APNs والمستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمَّن في بنية iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى relay بالمللي ثانية. والافتراضي `10000`.
- تُفوَّض التسجيلات المدعومة بـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرّر إلى Gateway منحة إرسال مرتبطة بالتسجيل. ولا يستطيع Gateway آخر إعادة استخدام ذلك التسجيل المخزَّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات مؤقتة من البيئة لإعداد relay المذكور أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين relay من نوع HTTP على loopback. ويجب أن تبقى عناوين relay في الإنتاج على HTTPS.
- `gateway.channelHealthCheckMinutes`: فترة مراقبة صحة القناة بالدقائق. اضبطها على `0` لتعطيل إعادة تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس الراكد بالدقائق. اجعلها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع الإبقاء على المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند ضبطه، تكون له الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما لا تكون `gateway.auth.*` مضبوطة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` مهيأة صراحةً عبر SecretRef وغير محلولة، يفشل الحل بشكل مغلق (من دون إخفاء ذلك عبر رجوع احتياطي بعيد).
- `trustedProxies`: عناوين IP لـ reverse proxy التي تنهي TLS أو تحقن ترويسات العميل المُعاد توجيهها. أدرج فقط الوكلاء الذين تتحكم بهم. وتظل إدخالات loopback صالحة لإعدادات proxy/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway الترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك مغلق افتراضيًا.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP ‏`POST /tools/invoke` (توسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة المنع الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطّلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية مدخلات URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد النسخ

شغّل عدة Gateways على مضيف واحد باستخدام منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Gateways متعددة](/ar/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح ذاتي التوقيع محلي عندما لا تكون ملفات صريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات لملف شهادة TLS.
- `keyPath`: مسار نظام الملفات لملف المفتاح الخاص بـ TLS؛ ويجب تقييد أذوناته.
- `caPath`: مسار اختياري لحزمة CA من أجل تحقق العميل أو سلاسل الثقة المخصصة.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): حاول أولًا إعادة التحميل الحي؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

---

## الخطافات

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

المصادقة: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
وتُرفض رموز hook المميزة في سلسلة الاستعلام.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن تكون `hooks.path` هي `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقَيِّد `hooks.allowedSessionKeyPrefixes` (مثل `["hook:"]`).

**نقاط النهاية:**

- `POST /hooks/wake` → ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثل `/hooks/gmail` ← `gmail`).
- يطابق `match.source` أحد حقول الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (وتُرفض المسارات المطلقة وعمليات التنقل عبر المسار).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، و`[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمتصلّي `/hooks/agent` بضبط `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (في الطلب + التعيين)، مثل `["hook:"]`.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لتشغيل هذا hook (ويجب أن يكون مسموحًا به إذا كان فهرس النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مهيّأً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // أو OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير من الوكيل عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: احتفظ بـ `gateway.bind: "loopback"` (الافتراضي).
- الروابط غير loopback: تتطلب مسارات canvas مصادقة Gateway (token/password/trusted-proxy)، تمامًا مثل أسطح HTTP الأخرى في Gateway.
- عادةً لا ترسل Node WebViews ترويسات مصادقة؛ وبعد إقران Node واتصاله، يعلن Gateway عن عناوين قدرة ضمن نطاق Node للوصول إلى canvas/A2UI.
- ترتبط عناوين القدرة بجلسة WS النشطة الخاصة بـ Node وتنتهي صلاحيتها بسرعة. ولا يُستخدم الرجوع الاحتياطي القائم على IP.
- يحقن عميل live-reload في HTML المقدَّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون المسار فارغًا.
- كما يقدّم A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل live reload للأدلة الكبيرة أو عند أخطاء `EMFILE`.

---

## الاكتشاف

### mDNS ‏(Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال ضمن `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، اجمعه مع خادم DNS ‏(يوصى بـ CoreDNS) + تقسيم DNS عبر Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات بيئة مضمّنة)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- لا تُطبَّق متغيرات البيئة المضمّنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ‏`.env` في CWD و`~/.openclaw/.env` (ولا يطغى أيٌّ منهما على المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف shell الخاص بتسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### الاستبدال بمتغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل ذلك مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: فما تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` لـ `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` لـ `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة من نوع `.` أو `..` (على سبيل المثال، يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد مزوّدات الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // مزوّد env صريح اختياري
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

ملاحظات:

- يدعم مزوّد `file` النمطين `mode: "json"` و`mode: "singleValue"` (ويجب أن تكون قيمة `id` هي `"value"` في نمط singleValue).
- يتطلب مزوّد `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات الأوامر الرمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات symlink مع التحقق من المسار الهدف المحلول.
- إذا كانت `trustedDirs` مضبوطة، فإن فحص الدليل الموثوق يُطبَّق على المسار الهدف المحلول.
- تكون بيئة الابن في `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم لا تقرأ مسارات الطلب سوى من تلك اللقطة.
- يُطبّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل البدء/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

---

## تخزين المصادقة

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- تُخزَّن الملفات الشخصية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم الملفات الشخصية في وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات المصادقة المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة وقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يتم استيراد OAuth القديم من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: [إدارة الأسرار](/ar/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف شخصي بسبب
  أخطاء الفوترة/نقص الرصيد الحقيقية (الافتراضي: `5`). ولا يزال النص الصريح للفوترة
  قد يصل إلى هذا المسار حتى على استجابات `401`/`403`، لكن
  أدوات مطابقة النص الخاصة بالمزوّدات تظل محصورة في المزوّد الذي يملكها (مثل
  OpenRouter ‏`Key limit exceeded`). أما رسائل نافذة الاستخدام القابلة لإعادة المحاولة في HTTP ‏`402`
  أو رسائل حدود الإنفاق الخاصة بالمؤسسة/مساحة العمل فتبقى في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: حد أقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: حد أقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات المصادقة ضمن المزوّد نفسه عند أخطاء التحميل الزائد قبل التحول إلى بديل النموذج (الافتراضي: `1`). وتقع هنا الأشكال التي تعبّر عن انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة المحاولة لتدوير ملف شخصي/مزوّد مثقل (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات المصادقة ضمن المزوّد نفسه عند أخطاء تحديد المعدّل قبل التحول إلى بديل النموذج (الافتراضي: `1`). ويشمل ذلك دلو تحديد المعدّل نصوصًا على نمط المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

---

## التسجيل

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ملف السجل الافتراضي: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- اضبط `logging.file` للحصول على مسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبح عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير السجلات الخارجي في بيئات الإنتاج.

---

## التشخيصات

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: المفتاح الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام لتفعيل مخرجات سجل موجهة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار التصدير الخاص بـ OpenTelemetry (الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبعات من `0` إلى `1`.
- `otel.flushIntervalMs`: فترة التفريغ الدوري للقياس عن بعد بالمللي ثانية.
- `cacheTrace.enabled`: يسجل لقطات تتبع cache للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL الخاص بتتبع cache (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُدرج في مخرجات تتبع cache (وجميعها افتراضيًا: `true`).

---

## التحديث

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: قناة الإصدار لتثبيتات npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات إجراء فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: بوابة ميزات ACP العامة (الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضي لوقت تشغيل ACP (ويجب أن يطابق Plugin وقت تشغيل ACP مسجّلًا).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي المستهدف عندما لا تحدد عمليات spawn هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يبث بشكل تدريجي؛ بينما `final_only` يخزّن حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر الحالة/التحديث الخاصة بـ ACP المعروضة.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعُمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تمهيد بيئة وقت تشغيل ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي:
  - `"random"` (الافتراضي): شعارات دوّارة طريفة/موسمية.
  - `"default"`: شعار ثابت ومحايد (`كل محادثاتك، OpenClaw واحد.`).
  - `"off"`: من دون نص شعار (مع بقاء عنوان الشريط/الإصدار ظاهرًا).
- لإخفاء الشريط بالكامل (وليس الشعارات فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية يكتبها CLI في تدفقات الإعداد الموجّهة (`onboard` و`configure` و`doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## الهوية

راجع حقول الهوية في `agents.list` ضمن [الإعدادات الافتراضية للوكيل](#agent-defaults).

---

## Bridge (قديم، أُزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (ويفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعدادات bridge القديمة (مرجع تاريخي)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // بديل قديم مهمَل للمهام المخزنة ذات notify:true
    webhookToken: "replace-with-dedicated-token", // رمز bearer اختياري لمصادقة Webhook الصادرة
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: المدة التي يتم خلالها الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. كما تتحكم أيضًا في تنظيف أرشيفات نصوص Cron المحذوفة. الافتراضي: `24h`؛ واضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفَظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer يُستخدم لتسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلا يتم إرسال ترويسة مصادقة.
- `webhook`: عنوان Webhook احتياطي قديم مهمَل (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للمهام أحادية التشغيل عند الأخطاء العابرة (الافتراضي: `3`؛ المجال: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

ينطبق هذا فقط على مهام Cron أحادية التشغيل. أما المهام المتكررة فتستخدم معالجة فشل منفصلة.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: تفعيل تنبيهات الفشل لمهام Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ترسل `"announce"` عبر رسالة قناة؛ بينما تنشر `"webhook"` إلى Webhook المهيّأ.
- `accountId`: معرّف حساب أو قناة اختياري لتحديد نطاق تسليم التنبيه.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما توجد بيانات هدف كافية.
- `channel`: تجاوز للقناة من أجل تسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook. ويكون مطلوبًا في وضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- تتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تكون هناك وجهة فشل عامة ولا وجهة لكل وظيفة، فإن الوظائف التي تسلّم أصلًا عبر `announce` تعود عند الفشل إلى هدف announce الأساسي نفسه.
- لا تكون `delivery.failureDestination` مدعومة إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). وتُتتبَّع عمليات Cron المعزولة على أنها [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقالب التي يتم توسيعها في `tools.media.models[].args`:

| المتغير | الوصف |
| ------- | ------ |
| `{{Body}}` | متن الرسالة الواردة الكامل |
| `{{RawBody}}` | المتن الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | المتن بعد إزالة إشارات المجموعة |
| `{{From}}` | معرّف المرسل |
| `{{To}}` | معرّف الوجهة |
| `{{MessageSid}}` | معرّف رسالة القناة |
| `{{SessionId}}` | UUID للجلسة الحالية |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة |
| `{{MediaUrl}}` | URL زائف للوسائط الواردة |
| `{{MediaPath}}` | المسار المحلي للوسائط |
| `{{MediaType}}` | نوع الوسائط (image/audio/document/…) |
| `{{Transcript}}` | النص المفرّغ من الصوت |
| `{{Prompt}}` | موجّه الوسائط المحلول لإدخالات CLI |
| `{{MaxChars}}` | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI |
| `{{ChatType}}` | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد) |
| `{{SenderName}}` | اسم العرض للمرسل (بأفضل جهد) |
| `{{SenderE164}}` | رقم هاتف المرسل (بأفضل جهد) |
| `{{Provider}}` | تلميح للمزوّد (whatsapp أو telegram أو discord أو غير ذلك) |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى عدة ملفات:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**سلوك الدمج:**

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمج بعمق بالترتيب (واللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (فتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبيًا إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` لـ `openclaw.json`). ويُسمح بالأشكال المطلقة/`../` فقط عندما تظل تُحل داخل هذا الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة على الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
