---
read_when:
    - أنت بحاجة إلى دلالات إعدادات دقيقة على مستوى الحقول أو إلى القيم الافتراضية.
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة.
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-22T07:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0d6fc076f54e84bef5beefbcc42d8f172cc79792c716f76103894303e3042ac
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسية لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتربط إلى الخارج عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/Plugin أو كل إعداد تفصيلي عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يعرض `openclaw config schema` مخطط JSON Schema الفعلي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالعناصر المجمّعة/Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة مقيّدة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

المراجع العميقة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر الحالي المضمّن + المجمّع
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بكل قناة

تنسيق الإعدادات هو **JSON5** (يُسمح بالتعليقات + الفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيماً افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائياً عند وجود قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك |
| -------------------- | ------ |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب على المالك الموافقة |
| `allowlist` | فقط المرسلون الموجودون في `allowFrom` (أو في مخزن السماح المقترن) |
| `open` | السماح بكل الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled` | تجاهل كل الرسائل الخاصة الواردة |

| سياسة المجموعة | السلوك |
| -------------- | ------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المكوّنة |
| `open` | تجاوز قوائم السماح للمجموعات (مع استمرار تطبيق التقييد بالذكر) |
| `disabled` | حظر كل رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما تكون `groupPolicy` الخاصة بالمزوّد غير مضبوطة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى لطلبات اقتران الرسائل الخاصة المعلّقة عند **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (غياب `channels.<provider>`)، تعود سياسة المجموعة في وقت التشغيل إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكوّنة. يُطبَّق تعيين القناة عندما لا تكون للجلسة بالفعل قيمة تجاوز للنموذج (على سبيل المثال، مضبوطة عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك عبر المزوّدات:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما تكون `groupPolicy` على مستوى المزوّد غير مضبوطة.
- `channels.defaults.contextVisibility`: وضع إظهار السياق الإضافي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/المحادثة المتفرعة/السجل)، و`allowlist` (تضمين السياق فقط من المرسلين الموجودين في قائمة السماح)، و`allowlist_quote` (مثل allowlist ولكن مع الإبقاء على سياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مدمجة بنمط المؤشر.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في Gateway ‏(Baileys Web). ويبدأ تلقائياً عند وجود جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضياً إذا كان موجوداً؛ وإلا يُستخدم أول معرّف حساب مُكوَّن (بعد الترتيب).
- يجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي هذا عندما يطابق معرّف حساب مُكوَّناً.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفَض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط افتراضياً صريحاً (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عند غياب هذا أو عدم صحته.
- يمنع `configWrites: false` عمليات كتابة الإعدادات المُبادَر بها من Telegram ‏(ترحيل معرّفات المجموعات الفائقة، و`/config set|unset`).
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط ACP دائماً لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). تتم مشاركة دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram ‏`sendMessage` + `editMessageText` (وتعمل في الدردشات المباشرة والجماعية).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` خاصاً بـ Discord ذلك الرمز المميز للاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مأخوذة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة guild) لأهداف التسليم؛ تُرفَض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة لـ guilds بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي يكتبها البوت افتراضياً. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائله الذاتية).
- تقوم `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) بإسقاط الرسائل التي تذكر مستخدماً آخر أو دوراً آخر لكن لا تذكر البوت (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` (الافتراضي 17) بتقسيم الرسائل الطويلة عمودياً حتى عندما تكون أقل من 2000 حرف.
- تتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` يعطّل ذلك)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل ذلك)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لإنشاء/ربط السلاسل تلقائياً لـ `sessions_spawn({ thread: true })`
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط ACP دائماً للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). تتم مشاركة دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات القنوات الصوتية في Discord مع تجاوزات اختيارية للانضمام التلقائي وTTS.
- يمرّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضاً استعادة استقبال الصوت عبر مغادرة جلسة الصوت وإعادة الانضمام إليها بعد تكرار حالات فشل فك التشفير.
- إن `channels.discord.streaming` هو مفتاح وضع البث القياسي. وتتم ترحيل القيم القديمة `streamMode` والقيم المنطقية `streaming` تلقائياً.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحالة حضور البوت (سليم => online، متدهور => idle، مستنزف => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين المطابقة بالاسم/الوسم القابل للتغيير (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية لـ Discord وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تتفعّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. يعود إلى `commands.ownerAllowFrom` عند الحذف.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة جزئية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. ترسل `"dm"` (الافتراضي) إلى الرسائل الخاصة للموافقين، وترسل `"channel"` إلى القناة الأصلية، وترسل `"both"` إلى الاثنين. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين الذين تم حلهم.
  - `cleanupAfterResolve`: عند ضبطه على `true`، يحذف رسائل الموافقة الخاصة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (لا شيء)، و`own` (رسائل البوت، الافتراضي)، و`all` (كل الرسائل)، و`allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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

- JSON الخاص بحساب الخدمة: مضمن (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- كما يتم دعم SecretRef الخاص بحساب الخدمة (`serviceAccountRef`).
- القيم الاحتياطية من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة principal البريد الإلكتروني القابلة للتغيير (وضع توافق طارئ).

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

- يتطلب **Socket mode** كلاً من `botToken` و`appToken` (مع `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من البيئة للحساب الافتراضي).
- يتطلب **HTTP mode** القيمة `botToken` مع `signingSecret` (في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة أو كائنات SecretRef.
- تكشف لقطات حساب Slack عن حقول المصدر/الحالة لكل اعتماد، مثل `botTokenSource` و`botTokenStatus` و`appTokenStatus` و، في HTTP mode، `signingSecretStatus`. تعني `configured_unavailable` أن الحساب مُكوَّن عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات المُبادَر بها من Slack.
- يجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.
- إن `channels.slack.streaming.mode` هو مفتاح وضع البث القياسي لـ Slack. وتتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. وتتم ترحيل القيم القديمة `streamMode` والقيم المنطقية `streaming` و`nativeStreaming` تلقائياً.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** تكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركة عبر القناة. وتقوم `thread.inheritParent` بنسخ سجل القناة الأصل إلى السلاسل الجديدة.

- يتطلب البث الأصلي لـ Slack مع حالة السلسلة على نمط مساعد Slack "is typing..." هدف سلسلة رد. وتبقى الرسائل الخاصة ذات المستوى الأعلى خارج السلاسل افتراضياً، لذا تستخدم `typingReaction` أو التسليم العادي بدلاً من المعاينة على نمط السلسلة.
- تضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم رمز Slack emoji مختصراً مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية لـ Slack وتفويض الموافقين. نفس مخطط Discord: ‏`enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ---------------- | --------- | ------- |
| reactions | مفعّل | التفاعل + سرد التفاعلات |
| messages | مفعّل | قراءة/إرسال/تحرير/حذف |
| pins | مفعّل | تثبيت/إلغاء تثبيت/سرد |
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

أوضاع الدردشة: `oncall` (الرد عند @-mention، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مساراً (على سبيل المثال `/api/channels/mattermost/command`) وليس عنوان URL كاملاً.
- يجب أن يُحلّ `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة عمليات رد نداء slash الأصلية باستخدام الرموز المميزة لكل أمر التي يعيدها Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم يتم تفعيل أي أوامر، يرفض OpenClaw عمليات الرد الندائي برسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مستضيفي الرد الندائي الخاصين/على tailnet/الداخليين، قد يتطلب Mattermost أن تتضمن
  `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الرد الندائي.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بعمليات كتابة الإعدادات المُبادَر بها من Mattermost أو رفضها.
- `channels.mattermost.requireMention`: يتطلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الذكر لكل قناة (`"*"` للقيمة الافتراضية).
- يجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.

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

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح بعمليات كتابة الإعدادات المُبادَر بها من Signal أو رفضها.
- يجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage ‏(مدعوماً عبر Plugin، ويُضبط ضمن `channels.bluebubbles`).

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
- يجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة الهدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تم توثيق إعدادات قناة BlueBubbles الكاملة في [BlueBubbles](/ar/channels/bluebubbles).

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

- يجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ واضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- تقيد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققاً صارماً من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقاً في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بعمليات كتابة الإعدادات المُبادَر بها من iMessage أو رفضها.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضاً مُطبَّعاً أو هدف دردشة صريحاً (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تتم إدارة Matrix عبر Plugin وتُضبط ضمن `channels.matrix`.

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

- تستخدم مصادقة الرمز المميز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه عبر `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وهذا الاشتراك الاختياري للشبكة عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضّل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا يتم تجاهل الغرف المدعوّة ودعوات الرسائل الخاصة الجديدة إلى أن تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية لـ Matrix وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تتفعّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة جزئية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - التجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- تتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل الخاصة في Matrix ضمن جلسات: ‏`per-user` (الافتراضي) يشارك حسب النظير الموجّه إليه، بينما يعزل `per-room` كل غرفة رسائل خاصة.
- تستخدم فحوصات الحالة في Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة في حركة وقت التشغيل.
- تم توثيق إعدادات Matrix الكاملة وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تتم إدارة Microsoft Teams عبر Plugin وتُضبط ضمن `channels.msteams`.

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
- تم توثيق إعدادات Teams الكاملة (بيانات الاعتماد، وWebhook، وسياسة الرسائل الخاصة/المجموعات، والتجاوزات لكل فريق/لكل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

تتم إدارة IRC عبر Plugin وتُضبط ضمن `channels.irc`.

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
- يجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُكوَّناً.
- تم توثيق إعدادات قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الذكر) في [IRC](/ar/channels/irc).

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

- يُستخدم `default` عند حذف `accountId` ‏(CLI + التوجيه).
- لا تنطبق رموز البيئة إلا على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حساباً غير افتراضي عبر `openclaw channels add` ‏(أو عبر إعداد القناة) بينما ما زلت تستخدم إعداد قناة أحادي الحساب على المستوى الأعلى، يقوم OpenClaw أولاً بترقية القيم أحادية الحساب ذات المستوى الأعلى والمقيّدة بالحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الاحتفاظ بهدف مسمّى/افتراضي موجود ومطابق.
- تستمر الروابط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل الروابط المقيّدة بالحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضاً بإصلاح الأشكال المختلطة عبر نقل القيم أحادية الحساب ذات المستوى الأعلى والمقيّدة بالحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الاحتفاظ بهدف مسمّى/افتراضي موجود ومطابق.

### قنوات Plugin الأخرى

تُضبط العديد من قنوات Plugin على شكل `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الذكر في الدردشات الجماعية

تكون رسائل المجموعات افتراضياً **تتطلب الذكر** (ذكر في البيانات الوصفية أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الذكر:**

- **الذكر في البيانات الوصفية**: إشارات @ الأصلية للمنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الذكر إلا عندما يكون الاكتشاف ممكناً (إشارات أصلية أو وجود نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها عبر `channels.<channel>.historyLimit` ‏(أو لكل حساب). اضبطها على `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة خاصة → افتراضي المزوّد → بلا حد (الاحتفاظ بالجميع).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتمكين وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويستجيب فقط لأنماط النص):

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

- تضبط هذه الكتلة أسطح الأوامر. للاطلاع على فهرس الأوامر الحالي المضمّن + المجمّع، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` الخاصة بـ QQ Bot، و`/card` الخاصة بـ LINE، و`/pair` الخاصة بـ device-pair، و`/dreaming` الخاصة بالذاكرة، و`/phone` الخاصة بـ phone-control، و`/voice` الخاصة بـ Talk موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- يقوم `native: "auto"` بتشغيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يقوم `nativeSkills: "auto"` بتشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- تجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). تقوم `false` بمسح الأوامر المسجلة مسبقاً.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- تضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لواجهة shell الخاصة بالمضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` ‏(قراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء `chat.send` في Gateway، تتطلب أيضاً عمليات الكتابة الدائمة عبر `/config set|unset` الصلاحية `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحاً لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعدادات خادم MCP المُدار من OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيته والتحكم في تمكينه/تعطيله.
- تتحكم `channels.<provider>.configWrites` في تعديلات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، تتحكم أيضاً `channels.<provider>.accounts.<id>.configWrites` في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- تمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- تقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- تكون `allowFrom` لكل مزوّد. وعند ضبطها، تصبح مصدر التفويض **الوحيد** (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` مضبوطة.
- خريطة وثائق الأوامر:
  - الفهرس المضمّن + المجمّع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: ‏[QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر بطاقة LINE: ‏[LINE](/ar/channels/line)
  - dreaming الخاصة بالذاكرة: [Dreaming](/ar/concepts/dreaming)

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

جذر مستودع اختياري يظهر في سطر Runtime ضمن system prompt. إذا لم يكن مضبوطاً، يكتشفه OpenClaw تلقائياً عبر الصعود من مساحة العمل إلى الأعلى.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضياً.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل القائمة غير الفارغة `agents.list[].skills` المجموعة النهائية لذلك الوكيل؛
  ولا تُدمَج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في توقيت حقن ملفات bootstrap الخاصة بمساحة العمل في system prompt. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: في أدوار المتابعة الآمنة (بعد اكتمال رد من المساعد)، يتم تخطي إعادة حقن bootstrap الخاص بمساحة العمل، مما يقلل حجم prompt. وتستمر عمليات Heartbeat وإعادة المحاولة بعد Compaction في إعادة بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف في كل ملف bootstrap لمساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يتم اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يتم حقن نص تحذير في system prompt أبداً.
- `"once"`: يتم حقن التحذير مرة واحدة لكل بصمة اقتطاع فريدة (موصى به).
- `"always"`: يتم حقن التحذير في كل تشغيل عندما يوجد اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة الحجم للـ prompt/السياق، وهي
مقسّمة عمداً حسب النظام الفرعي بدلاً من تمريرها كلها عبر
مفتاح تحكم عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  تمهيد بدء تشغيل لمرة واحدة لأوامر `/new` و`/reset`، بما في ذلك
  ملفات `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل مملوكة لوقت التشغيل يتم حقنها.
- `memory.qmd.limits.*`:
  حجم مقتطفات البحث في الذاكرة المفهرسة وحقنها.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل لأول دور، والذي يُحقن في عمليات
`/new` و`/reset` المجردة.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

إعدادات افتراضية مشتركة لأسطح سياق وقت التشغيل المحدودة.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة
  بيانات الاقتطاع الوصفية وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عندما يتم
  حذف `lines`.
- `toolResultMaxChars`: الحد الحي لنتائج الأدوات والمستخدم للنتائج المحفوظة
  واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف `AGENTS.md` المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. ترث الحقول المحذوفة
من `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

حد عام لقائمة Skills المدمجة المحقونة في system prompt. وهذا
لا يؤثر في قراءة ملفات `SKILL.md` عند الطلب.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

تجاوز لكل وكيل لميزانية prompt الخاصة بـ Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

أقصى حجم بالبكسل لأطول ضلع في الصورة داخل كتل الصور في السجل/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تؤدي القيم المنخفضة عادةً إلى تقليل استخدام رموز الرؤية وحجم حمولة الطلب في العمليات التي تكثر فيها لقطات الشاشة.
وتحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف إذا لم تُضبط.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. الافتراضي: `auto` (تفضيل نظام التشغيل).

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
        primary: "openai/gpt-image-2",
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
      params: { cacheRetention: "long" }, // global default provider params
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

- يقبل `model` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يضبط شكل السلسلة النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- يقبل `imageModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضاً كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- يقبل `imageGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ صوراً.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لإنشاء الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images.
  - إذا اخترت مزوّداً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة المزوّد/مفتاح API المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال بإمكان `image_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. إذ يحاول أولاً المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الصور المسجلين بترتيب معرّف المزوّد.
- يقبل `musicGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم المعتادة: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا تم حذفه، فلا يزال بإمكان `music_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. إذ يحاول أولاً المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّداً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة المزوّد/مفتاح API المطابق.
- يقبل `videoGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم المعتادة: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال بإمكان `video_generate` استنتاج قيمة افتراضية لمزوّد مدعوم بالمصادقة. إذ يحاول أولاً المزوّد الافتراضي الحالي، ثم بقية مزوّدي إنشاء الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا اخترت مزوّداً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزوّد إنشاء الفيديو Qwen المجمّع حتى 1 فيديو خرج، و1 صورة دخل، و4 فيديوهات دخل، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- يقبل `pdfModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- يمثّل `pdfMaxBytesMb` الحد الافتراضي لحجم PDF لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- يمثّل `pdfMaxPages` الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الاستخراج الاحتياطي في أداة `pdf`.
- يمثّل `verboseDefault` مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- يمثّل `elevatedDefault` مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: بالتنسيق `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت المزوّد، فسيحاول OpenClaw أولاً اسماً مستعاراً، ثم مطابقة فريدة لمزوّد مُكوَّن لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُكوَّن (سلوك توافق قديم مُهمل، لذا يُفضَّل استخدام `provider/model` صريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُكوَّن، يعود OpenClaw إلى أول مزوّد/نموذج مُكوَّن بدلاً من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المُكوَّن وقائمة السماح الخاصة بـ `/model`. ويمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تقوم `agents.list[].params` (معرّف الوكيل المطابق) بالتجاوز حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل الافتراضية منخفضة المستوى للوكلاء المضمّنين. استخدم `runtime: "auto"` للسماح لـ Plugin harnesses المسجلة بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض PI harness المضمّن، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- تقوم كُتّاب الإعدادات الذين يغيّرون هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) بحفظ الشكل الكائني القياسي والحفاظ على قوائم الاحتياطي الموجودة عند الإمكان.
- `maxConcurrent`: الحد الأقصى للتشغيلات المتوازية للوكلاء عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في أي منفّذ منخفض المستوى يشغّل أدوار الوكيل المضمّن.
يجب أن تُبقي معظم البيئات على القيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
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

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف Plugin harness مسجل. يقوم Plugin ‏Codex المجمّع بتسجيل `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. يبقي `"pi"` على PI harness المضمّن بوصفه الرجوع الاحتياطي للتوافق عندما لا يتم اختيار Plugin harness. أما `"none"` فيجعل اختيار Plugin harness المفقود أو غير المدعوم يفشل بدلاً من استخدام PI بصمت. وتظهر حالات فشل Plugin harness المحدد دائماً مباشرةً.
- تجاوزات البيئة: يقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الرجوع الاحتياطي إلى PI لتلك العملية.
- بالنسبة إلى البيئات المعتمدة على Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا في chat harness المضمّن فقط. أما إنشاء الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS فتظل تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (لا تنطبق إلا عندما يكون النموذج ضمن `agents.defaults.models`):

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

تفوز أسماؤك المستعارة المكوّنة دائماً على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائياً ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتفعّل نماذج Z.AI القيمة `tool_stream` افتراضياً لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيلها.
وتستخدم نماذج Anthropic Claude 4.6 افتراضياً التفكير `adaptive` عندما لا يكون هناك مستوى تفكير صريح مضبوط.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع الاحتياطي النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عند فشل مزوّدي API.

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

- واجهات CLI الخلفية نصية أولاً؛ ويتم دائماً تعطيل الأدوات.
- يتم دعم الجلسات عند ضبط `sessionArg`.
- يتم دعم تمرير الصور عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدال system prompt الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم لكل وكيل ذات أولوية أعلى؛ ويتم تجاهل القيمة الفارغة أو المؤلفة من مسافات فقط. وهو مفيد لتجارب prompt المضبوطة.

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
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (`ms/s/m/h`). الافتراضي: `30m` (مصادقة API-key) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند ضبطها على false، تحذف قسم Heartbeat من system prompt وتتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطها على true، يتم كبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح لدور وكيل Heartbeat قبل إيقافه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. وتمنع `block` التسليم إلى الهدف المباشر وتنتج `reason=dm-blocked`.
- `lightContext`: عند ضبطها على true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفاً وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند ضبطها على true، يعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه الخاص بـ Cron ‏`sessionTarget: "isolated"`. ويقلل تكلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **يعمل Heartbeat لهؤلاء الوكلاء فقط**.
- تشغّل Heartbeats أدوار وكلاء كاملة — والفواصل الأقصر تستهلك مزيداً من الرموز.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: ‏`default` أو `safeguard` (تلخيص مُجزّأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجّل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالمزوّد بدلاً من التلخيص المضمّن المعتمد على LLM. ويعود إلى المضمّن عند الفشل. يؤدي ضبط مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يقوم OpenClaw بإيقافها. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` (الافتراضي) أو `off` أو `custom`. تقوم `strict` بإضافة إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للمحافظة على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. عند عدم ضبطها أو عند ضبطها صراحةً على هذا الزوج الافتراضي، يتم أيضاً قبول العناوين الأقدم `Every Session`/`Safety` كبديل قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون قيمته `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "Compacting context..." و"Compaction complete"). ويكون معطلاً افتراضياً للحفاظ على صمت Compaction.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. وهو **لا** يعدّل سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن أن يعمل فيها التقليم مجدداً (بعد آخر لمسة لذاكرة التخزين المؤقت).
- يقوم التقليم أولاً باقتطاع نتائج الأدوات كبيرة الحجم اقتطاعاً خفيفاً، ثم يفرّغ نتائج الأدوات الأقدم تفريغاً كاملاً عند الحاجة.

**الاقتطاع الخفيف** يحتفظ بالبداية + النهاية ويُدرج `...` في المنتصف.

**التفريغ الكامل** يستبدل نتيجة الأداة بالكامل بالنص النائب.

ملاحظات:

- لا يتم أبداً اقتطاع/تفريغ كتل الصور.
- تستند النسب إلى عدد الأحرف (تقريبية)، وليس إلى عدد الرموز الدقيق.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [تقليم الجلسة](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

### البث الكتلي

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتمكين الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تستخدم Signal/Slack/Discord/Google Chat افتراضياً `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. تعني `natural` = ‏800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) للحصول على تفاصيل السلوك + التجزئة.

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المذكورة.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

وضع Sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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
          // SecretRefs / inline contents also supported:
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

<Accordion title="تفاصيل Sandbox">

**الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة مسبقاً يتم تمريرها إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من اللقطة النشطة لأسرار وقت التشغيل قبل بدء جلسة Sandbox

**سلوك خلفية SSH:**

- يهيّئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة العمل البعيدة عبر SSH هي المرجع الأساسي
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة تلقائياً إلى المضيف
- لا يدعم حاويات متصفح Sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل Sandbox بحسب النطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، مع تثبيت مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: يتم تثبيت مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعدادات Plugin ‏OpenShell:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: يهيّئ البعيد من المحلي قبل التنفيذ، ويزامن العودة بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: يهيّئ البعيد مرة واحدة عند إنشاء Sandbox، ثم يُبقي مساحة العمل البعيدة هي المرجع الأساسي

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى Sandbox تلقائياً بعد خطوة التهيئة.
يكون النقل عبر SSH إلى OpenShell Sandbox، لكن Plugin يملك دورة حياة Sandbox ومزامنة المرآة الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى اتصال شبكة صادر، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضياً `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضياً ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (وضع طارئ).

**يتم تجهيز المرفقات الواردة** ضمن `media/inbound/*` في مساحة العمل النشطة.

يقوم **`docker.binds`** بتثبيت أدلة إضافية من المضيف؛ ويتم دمج bindings العامة ومع bindings الخاصة بكل وكيل.

**متصفح Sandbox** ‏(`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضياً، ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلاً من كشف كلمة المرور في عنوان URL المشترك).

- يمنع `allowHostControl: false` (الافتراضي) الجلسات المعزولة في Sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عاماً.
- يقيّد `cdpSourceRange` اختيارياً دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتثبيت أدلة إضافية من المضيف داخل حاوية متصفح Sandbox فقط. وعند ضبطه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
  - `--disable-extensions` (مفعّل افتراضياً)
  - يتم تفعيل `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    افتراضياً ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    الحد الافتراضي لعمليات Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلاً.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

إن عزل المتصفح داخل Sandbox و`sandbox.docker.binds` خاصان بـ Docker فقط.

إنشاء الصور:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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
- `default`: عند ضبط عدة قيم، تفوز الأولى (مع تسجيل تحذير). وإذا لم تُضبط أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز شكل السلسلة `primary` فقط؛ بينما يتجاوز شكل الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل القيم الاحتياطية العامة). تستمر مهام Cron التي تتجاوز `primary` فقط في وراثة القيم الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات بث لكل وكيل يتم دمجها فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدمها لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلاً من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: تجاوز اختياري لكل وكيل لمستوى التفكير الافتراضي (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو لكل جلسة.
- `reasoningDefault`: تجاوز اختياري لكل وكيل لإظهار reasoning افتراضياً (`on | off | stream`). ويُطبّق عندما لا يكون هناك تجاوز للـ reasoning لكل رسالة أو لكل جلسة.
- `fastModeDefault`: افتراضي اختياري لكل وكيل لوضع السرعة (`true | false`). ويُطبّق عندما لا يكون هناك تجاوز لوضع السرعة لكل رسالة أو لكل جلسة.
- `embeddedHarness`: تجاوز اختياري لكل وكيل لسياسة harness منخفضة المستوى. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد يعتمد على Codex فقط بينما تحتفظ الوكلاء الأخرى بالرجوع الاحتياطي الافتراضي إلى PI.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية لـ `runtime.acp` ‏(`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل جلسات ACP harness افتراضياً.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو URI من نوع `data:`.
- تستمد `identity` قيماً افتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لأجل `sessions_spawn` ‏(`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حارس وراثة Sandbox: إذا كانت جلسة الطالب تعمل داخل Sandbox، يرفض `sessions_spawn` الأهداف التي ستعمل خارج Sandbox.
- `subagents.requireAgentId`: عند ضبطه على true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [الوكلاء المتعددين](/ar/concepts/multi-agent).

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

- `type` (اختياري): `route` للتوجيه العادي (عند غياب النوع يكون الافتراضي route)، و`acp` لروابط المحادثة الدائمة الخاصة بـ ACP.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والمحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالحل حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات route binding أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (من دون Sandbox)">

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

راجع [Sandbox والأدوات في الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مُرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصوداً).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك جميع الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المُرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مُرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مُرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: ربط المعرّفات القياسية بالنظراء ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة الضبط الأساسية. تقوم `daily` بإعادة الضبط عند `atHour` حسب التوقيت المحلي؛ وتقوم `idle` بإعادة الضبط بعد `idleMinutes`. وعند ضبط الاثنين، تفوز القيمة التي تنتهي أولاً.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). يُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى المسموح به لقيمة `totalTokens` لجلسة الأصل عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` للأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلاً من وراثة سجل محادثة الأصل.
  - اضبطه على `0` لتعطيل هذا الحارس والسماح دائماً بتفريع الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائماً `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، المجال: `0`–`5`). تعطل `0` سلسلة التبادل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` ‏(`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. ويفوز أول رفض.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: ‏`warn` يصدر تحذيرات فقط؛ و`enforce` يطبق التنظيف.
  - `pruneAfter`: حد العمر للمدخلات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد المدخلات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتكون افتراضياً مساوية لـ `pruneAfter`؛ اضبطها على `false` لتعطيلها.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولاً.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضياً `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدات تجاوزه؛ ويستخدم Discord ‏`channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل؛ ويمكن للمزوّدات تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ ويمكن للمزوّدات تجاوزه)

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
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

آلية الحل (الأكثر تحديداً يفوز): الحساب → القناة → العام. يقوم `""` بالتعطيل وإيقاف التسلسل. ويشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | المثال |
| ------- | ----- | ------ |
| `{model}` | اسم النموذج المختصر | `claude-opus-4-6` |
| `{modelFull}` | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}` | اسم المزوّد | `anthropic` |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` أو `low` أو `off` |
| `{identity.name}` | اسم هوية الوكيل | (نفس `"auto"`) |

المتغيرات غير حساسة لحالة الأحرف. و`{think}` اسم مستعار لـ `{thinkingLevel}`.

### تفاعل التأكيد

- تكون قيمته الافتراضية `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبط `""` لتعطيله.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → رجوع هوية احتياطي.
- النطاق: `group-mentions` (الافتراضي) أو `group-all` أو `direct` أو `all`.
- تزيل `removeAckAfterReply` تفاعل التأكيد بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة المرتبطة بدورة الحياة في Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي تركه غير مضبوط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، اضبطه صراحة على `true` لتمكين تفاعلات الحالة المرتبطة بدورة الحياة.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة من المُرسل نفسه في دور وكيل واحد. وتقوم الوسائط/المرفقات بالتفريغ فوراً. وتتجاوز أوامر التحكم إزالة الارتداد.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يقوم `summaryModel` بتجاوز `agents.defaults.model.primary` للملخص التلقائي.
- تكون `modelOverrides` مفعّلة افتراضياً؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يقوم `openai.baseUrl` بتجاوز نقطة نهاية OpenAI TTS. ويكون ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها بوصفها خادم TTS متوافقاً مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن تطابق `talk.provider` مفتاحاً في `talk.providers` عند ضبط عدة مزوّدي Talk.
- مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط، ويتم ترحيلها تلقائياً إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- تقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق الرجوع الاحتياطي إلى `ELEVENLABS_API_KEY` فقط عندما لا يكون هناك مفتاح API مضبوط لـ Talk.
- تتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- تتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. ويؤدي عدم ضبطها إلى الإبقاء على نافذة التوقف الافتراضية للمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تقوم الإعدادات المحلية الجديدة أثناء الإعداد المحلي بتهيئة `tools.profile: "coding"` عند عدم ضبطه (ويتم الحفاظ على ملفات التعريف الصريحة الموجودة).

| ملف التعريف | يتضمن |
| ----------- | ------ |
| `minimal` | `session_status` فقط |
| `coding` | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status` |
| `full` | بلا تقييد (مثل عدم الضبط) |

### مجموعات الأدوات

| المجموعة | الأدوات |
| -------- | ------- |
| `group:runtime` | `exec` و`process` و`code_execution` (ويُقبل `bash` كاسم مستعار لـ `exec`) |
| `group:fs` | `read` و`write` و`edit` و`apply_patch` |
| `group:sessions` | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory` | `memory_search` و`memory_get` |
| `group:web` | `web_search` و`x_search` و`web_fetch` |
| `group:ui` | `browser` و`canvas` |
| `group:automation` | `cron` و`gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list` |
| `group:media` | `image` و`image_generate` و`video_generate` و`tts` |
| `group:openclaw` | جميع الأدوات المضمّنة (باستثناء Plugins الخاصة بالمزوّد) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (يفوز المنع). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبّق حتى عندما يكون Docker sandbox معطلاً.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقيّد الأدوات بشكل إضافي لمزوّدات أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف المزوّد → allow/deny.

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

يتحكم في وصول `exec` المرتفع خارج Sandbox:

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

- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا أن يزيد التقييد.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع وضع Sandbox ويستخدم مسار الهروب المكوَّن (`gateway` افتراضياً، أو `node` عندما يكون هدف exec هو `node`).

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

تكون فحوصات أمان حلقات الأدوات **معطلة افتراضياً**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عالمياً في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
- `warningThreshold`: حد نمط التكرار بلا تقدم لإصدار التحذيرات.
- `criticalThreshold`: حد تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: حد توقف صارم لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: يحذر عند تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
- `detectors.knownPollNoProgress`: يحذر/يحظر عند أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: يحذر/يحظر عند الأنماط الزوجية المتناوبة بلا تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

يضبط فهم الوسائط الواردة (صورة/صوت/فيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

**إدخال المزوّد** (`type: "provider"` أو محذوف):

- `provider`: معرّف مزوّد API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف التعريف من `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود حالات الفشل إلى الإدخال التالي.

تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون قيمته `true`، تحاول المهام
  المكتملة غير المتزامنة الخاصة بـ `music_generate`
  و`video_generate` التسليم المباشر إلى القناة أولاً. الافتراضي: `false`
  (مسار الاستيقاظ/تسليم النموذج القديم المعتمد على جلسة الطالب).

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
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد تشمل مستخدمين آخرين إذا كنت تشغّل جلسات لكل مُرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ويظل الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- قيد Sandbox: عندما تكون الجلسة الحالية داخل Sandbox وتكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، يتم فرض `visibility` على `tree` حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- لا تُدعم المرفقات إلا لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- يتم تحويل الملفات إلى مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تلقائياً حجب محتوى المرفقات من حفظ السجل.
- يتم التحقق من مدخلات Base64 باستخدام فحوص صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: تقوم `delete` دائماً بإزالة المرفقات؛ وتحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضياً ما لم تنطبق قاعدة تمكين تلقائي صارمة لوكيلية GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

ملاحظات:

- `planTool`: يفعّل أداة `update_plan` البنيوية لتتبع الأعمال متعددة الخطوات غير التافهة.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` لتشغيل OpenAI أو OpenAI Codex من عائلة GPT-5. اضبطه على `true` لفرض تشغيل الأداة خارج هذا النطاق، أو على `false` لإبقائها معطلة حتى في تشغيلات GPT-5 الصارمة الوكيلية.
- عند تفعيلها، يضيف system prompt أيضاً إرشادات استخدام حتى لا يستخدمها النموذج إلا للأعمال المهمة ويحافظ على خطوة واحدة فقط بحالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. وإذا تم حذفه، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لأجل `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدات المخصصة وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المضمّن. أضف مزوّدات مخصصة عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
- تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير البيئة).
- أسبقية الدمج لمعرّفات المزوّد المطابقة:
  - تفوز القيم غير الفارغة `baseUrl` في `models.json` الخاصة بالوكيل.
  - تفوز القيم غير الفارغة `apiKey` الخاصة بالوكيل فقط عندما لا يكون ذلك المزوّد مُداراً عبر SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
  - يتم تحديث قيم `apiKey` للمزوّدات المُدارة عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلاً من حفظ الأسرار المحلولة.
  - يتم تحديث قيم رؤوس المزوّد المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
  - تعود القيم الفارغة أو المحذوفة `apiKey`/`baseUrl` الخاصة بالوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيم المطابقة `contextWindow`/`maxTokens` للنموذج القيمة الأعلى بين الإعدادات الصريحة وقيم الفهرس الضمنية.
  - تحافظ القيم المطابقة `contextTokens` للنموذج على حد وقت التشغيل الصريح عند وجوده؛ استخدمه لتقييد السياق الفعلي دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات خاضعاً للمصدر: تتم كتابة العلامات من اللقطة النشطة لإعدادات المصدر (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول المزوّد

- `models.mode`: سلوك فهرس المزوّد (`merge` أو `replace`).
- `models.providers`: خريطة المزوّدات المخصصة مفهرسة حسب معرّف المزوّد.
- `models.providers.*.api`: محوّل الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وما إلى ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يُفضّل SecretRef/الاستبدال من البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يقوم بحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في رأس `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API العلوي.
- `models.providers.*.headers`: رؤوس ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.
  - `request.headers`: رؤوس إضافية (تُدمَج مع افتراضيات المزوّد). تقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام المصادقة المضمّنة للمزوّد)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` (استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائناً فرعياً اختيارياً `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون قيمته `true`، يسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حارس جلب HTTP الخاص بالمزوّد (اشتراك اختياري من المشغّل لنقاط نهاية OpenAI-compatible ذاتية الاستضافة والموثوقة). تستخدم WebSocket نفس `request` للرؤوس/TLS ولكن ليس حارس SSRF الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج صريحة للمزوّد.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. أما `baseUrl` الفارغ/المحذوف فيحافظ على سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة OpenAI-compatible التي تقبل السلاسل فقط. عندما تكون قيمته `true`، يقوم OpenClaw بتسطيح المصفوفات النصية الخالصة `messages[].content` إلى سلاسل عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: عامل تصفية اختياري لمعرّف المزوّد للاكتشاف الموجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستقصاء لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي لرموز الإخراج للنماذج المكتشفة.

### أمثلة المزوّدات

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

استخدم `cerebras/zai-glm-4.7` لـ Cerebras؛ واستخدم `zai/glm-4.7` لـ Z.AI المباشر.

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

اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لفهرس Zen أو المراجع `opencode-go/...` لفهرس Go. اختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. ويُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. اختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف مزوّداً مخصصاً مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

بالنسبة إلى نقطة النهاية الخاصة بالصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل
`openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس فقط على معرّف المزوّد المضمّن.

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

متوافق مع Anthropic، ومزوّد مضمّن. اختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب أن يحذف `baseUrl` المقطع `/v1` (إذ يضيفه عميل Anthropic). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
يستخدم فهرس النماذج M2.7 فقط افتراضياً.
في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضياً ما لم تضبط `thinking` بنفسك صراحةً. يقوم `/fast on` أو
`params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجاً محلياً كبيراً عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة من أجل الرجوع الاحتياطي.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمّعة فقط (ولا تتأثر Skills المُدارة/Skills مساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون قيمته true، يفضّل أدوات التثبيت عبر Homebrew عندما يكون `brew` متاحاً
  قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مدير Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطّل Skill حتى لو كانت مجمّعة/مثبتة.
- `entries.<skillKey>.apiKey`: حقل مريح لـ Skills التي تعلن عن متغير بيئة أساسي (سلسلة نصية صريحة أو كائن SecretRef).

---

## Plugins

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins الأصلية الخاصة بـ OpenClaw بالإضافة إلى حِزم Codex المتوافقة وحِزم Claude، بما في ذلك حِزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (يتم تحميل Plugins المدرجة فقط). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح على مستوى Plugin لمفتاح API (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون قيمته `false`، يقوم core بحظر `before_prompt_build` ويتجاهل الحقول المعدّلة لـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الأصلية للـ Plugin وعلى أدلة hooks التي توفرها الحِزم والمدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية للتجاوزات الموثوقة للوكلاء الفرعيين. استخدم `"*"` فقط عندما تريد عمداً السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (يتم التحقق منه باستخدام مخطط Plugin الأصلي لـ OpenClaw عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد Firecrawl الخاص بـ web-fetch.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl (يقبل SecretRef). ويعود احتياطياً إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو إلى `tools.web.fetch.firecrawl.apiKey` القديم، أو إلى متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان Firecrawl API الأساسي (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر الذاكرة المؤقتة بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تمكين مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والحدود.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل جولة Dreaming كاملة (الافتراضي `"0 3 * * *"`).
  - سياسة المراحل والحدود هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضاً لحِزم Claude المفعّلة أن تسهم بإعدادات Pi مضمّنة افتراضية من `settings.json`؛ ويطبق OpenClaw هذه الإعدادات كإعدادات وكيل مُنقّحة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي هو `"legacy"` ما لم تثبّت محركاً آخر وتحدده.
- `plugins.installs`: بيانات تعريف التثبيت المُدارة عبر CLI والمستخدمة بواسطة `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - اعتبر `plugins.installs.*` حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

راجع [Plugins](/ar/tools/plugin).

---

## المتصفح

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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

- يقوم `evaluateEnabled: false` بتعطيل `act:evaluate` و`wait --fn`.
- تكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة عند عدم ضبطها، لذا يبقى تنقل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح عبر الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة قابلة للإرفاق فقط (بدء/إيقاف/إعادة ضبط معطل).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw ‏`/json/version`؛ واستخدم WS(S)
  عندما يزوّدك المزوّد بعنوان DevTools WebSocket مباشر.
- تستخدم ملفات تعريف `existing-session` القيمة Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر browser node متصل.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف
  ملف تعريف محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بالقيود الحالية لمسار Chrome MCP:
  إجراءات مبنية على snapshot/ref بدلاً من الاستهداف بواسطة CSS-selector، وخطافات رفع ملف واحد،
  ومن دون تجاوزات مهلة الحوار، ومن دون `wait --load networkidle`، وكذلك من دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تقوم ملفات تعريف `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائياً؛
  اضبط `cdpUrl` صراحةً فقط لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة التحكم: على loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تغيير حجم النافذة أو أعلام التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: لون التمييز لواجهة التطبيقات الأصلية (لون فقاعة Talk Mode، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. ويعود احتياطياً إلى هوية الوكيل النشط.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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
- `port`: منفذ متعدد واحد لـ WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **الأسماء المستعارة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء المستعارة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع الربط الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge ‏(`-p 18789:18789`) تصل الحركة إلى `eth0`، لذلك يصبح Gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضياً. تتطلب الروابط غير المعتمدة على loopback مصادقة Gateway. وعملياً يعني ذلك رمزاً مشتركاً/كلمة مرور مشتركة أو reverse proxy واعياً بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولد معالج الإعداد رمزاً افتراضياً.
- إذا تم ضبط كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مضبوطين ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا لا يُعرض عمداً في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy واعٍ بالهوية واثق برؤوس الهوية القادمة من `gateway.trustedProxies` (راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). ويتوقع هذا الوضع مصدر proxy **غير loopback**؛ إذ لا تستوفي reverse proxies المعتمدة على loopback على المضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون قيمته `true`، يمكن لرؤوس هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket ‏(يتم التحقق منها عبر `tailscale whois`). أما نقاط نهاية HTTP API فلا تستخدم مصادقة رؤوس Tailscale هذه؛ بل تتبع وضع HTTP auth العادي الخاص بـ Gateway. ويفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. وتكون القيمة الافتراضية `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز بشكل مستقل). وتُرجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، يتم تسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذا يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تشغّل المحدد في الطلب الثاني بدلاً من مرور الاثنين معاً كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمداً تقييد حركة localhost أيضاً (لإعدادات الاختبار أو عمليات النشر الصارمة عبر proxy).
- يتم دائماً تقليل سرعة محاولات مصادقة WS ذات المصدر المتصفح مع تعطيل إعفاء loopback (دفاعاً إضافياً ضد محاولات القوة الغاشمة على localhost المعتمدة على المتصفح).
- على loopback، يتم عزل حالات القفل هذه ذات المصدر المتصفح لكل قيمة `Origin`
  مُطبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائياً
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، مع ربط loopback) أو `funnel` (عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطر يفعّل الرجوع الاحتياطي إلى أصل Host-header لعمليات النشر التي تعتمد عمداً على سياسة الأصل المستندة إلى Host-header.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` ‏(ws/wss). بالنسبة إلى `direct`، يجب أن يكون `remote.url` من النوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باتصالات `ws://` النصية العادية إلى عناوين IP موثوقة ضمن الشبكات الخاصة؛ وتبقى القيمة الافتراضية مقصورة على loopback فقط للاتصالات النصية العادية.
- إن `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد للعميل البعيد. ولا يضبطان مصادقة Gateway بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لـ APNs relay الخارجي المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى relay بالميلي ثانية. الافتراضي `10000`.
- يتم تفويض التسجيلات المدعومة بالـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرّر صلاحية إرسال ضمن نطاق التسجيل إلى Gateway. ولا يستطيع Gateway آخر إعادة استخدام ذلك التسجيل المخزّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين relay المعتمدة على loopback عبر HTTP. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبطه على `0` لتعطيل إعادة تشغيل مراقبة الصحة عالمياً. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد الركود للمقبس بالدقائق. اجعله أكبر من أو مساوياً لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقبة الصحة مع إبقاء المراقبة العامة مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. وعند ضبطه، تكون له الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كقيمة احتياطية فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وكان غير محلول، يفشل الحل بشكل مغلق (من دون إخفاء عبر الرجوع الاحتياطي البعيد).
- `trustedProxies`: عناوين IP الخاصة بـ reverse proxy التي تنهي TLS أو تحقن رؤوس العميل المُمرَّر. اذكر فقط الـ proxies التي تتحكم بها. وتظل إدخالات loopback صالحة لإعدادات الكشف المحلي/الـ proxy على المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون قيمته `true`، يقبل Gateway الرأس `X-Real-IP` إذا كان `X-Forwarded-For` مفقوداً. الافتراضي `false` لسلوك فشل مغلق.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP ‏`POST /tools/invoke` (تمدد قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة المنع الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية OpenAI-compatible

- Chat Completions: معطل افتراضياً. قم بتمكينه عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    يتم التعامل مع قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- رأس تقوية استجابة اختياري:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطه فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد النسخ

شغّل عدة Gateways على مضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Gateways المتعددة](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: يولّد تلقائياً زوج cert/key محلياً موقّعاً ذاتياً عندما لا تكون الملفات الصريحة مضبوطة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب إبقاء الأذونات عليه مقيّدة.
- `caPath`: مسار اختياري إلى حزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات وقت التشغيل.
  - `"off"`: تجاهل التعديلات المباشرة؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: إعادة تشغيل عملية Gateway دائماً عند تغير الإعدادات.
  - `"hot"`: تطبيق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب hot reload أولاً؛ وارجع إلى إعادة التشغيل عند الحاجة.
- `debounceMs`: نافذة إزالة ارتداد بالميلي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى بالميلي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
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
ويتم رفض رموز Hook الموجودة في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويتم رفض إعادة استخدام رمز Gateway.
- لا يمكن أن تكون `hooks.path` هي `/`؛ استخدم مساراً فرعياً مخصصاً مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` قالبياً، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. ولا تتطلب مفاتيح mapping الثابتة هذا الاشتراك الاختياري.

**نقاط النهاية:**

- `POST /hooks/wake` ← `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` ← يتم حله عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في mapping الناتجة عن القوالب على أنها مقدمة خارجياً، وتتطلب أيضاً `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل Mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثال: `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلاً من الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء Hook.
  - يجب أن يكون `transform.module` مساراً نسبياً ويبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة وعمليات الاجتياز).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: تقيد التوجيه الصريح (`*` أو الحذف = السماح للجميع، و`[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل Hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ولمفاتيح الجلسات في mappings المعتمدة على القوالب بضبط `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` قالبية.
- `deliver: true` يرسل الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يقوم `model` بتجاوز LLM لهذا التشغيل الخاص بالـ Hook (ويجب أن يكون مسموحاً به إذا كان فهرس النماذج مضبوطاً).

</Accordion>

### تكامل Gmail

- يستخدم Gmail preset المضمّن القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` بحيث تطابق نطاق Gmail، على سبيل المثال `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فقم بتجاوز preset باستخدام `sessionKey` ثابت بدلاً من القيمة القالبية الافتراضية.

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

- يبدأ Gateway تلقائياً `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطاً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلاً إلى جانب Gateway.

---

## مستضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم ملفات HTML/CSS/JS وA2UI القابلة للتحرير من الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الروابط غير المعتمدة على loopback: تتطلب مسارات canvas مصادقة Gateway (رمز/كلمة مرور/trusted-proxy)، مثل بقية أسطح HTTP الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً رؤوس المصادقة؛ وبعد إقران node واتصاله، يعلن Gateway عناوين capability URLs ضمن نطاق node للوصول إلى canvas/A2UI.
- تكون capability URLs مرتبطة بجلسة WS النشطة الخاصة بـ node وتنتهي صلاحيتها بسرعة. ولا يُستخدم الرجوع الاحتياطي المعتمد على IP.
- يحقن عميل live-reload داخل HTML المقدّم.
- ينشئ تلقائياً ملف `index.html` ابتدائياً عندما يكون فارغاً.
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
- يكون اسم المضيف الافتراضي هو `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال ضمن `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، قم بإقرانه مع خادم DNS ‏(يوصى بـ CoreDNS) + DNS تقسيم Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات بيئة مضمنة)

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

- لا يتم تطبيق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف login shell الخاص بك.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### الاستبدال بمتغيرات البيئة

ارجع إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تتسبب المتغيرات المفقودة/الفارغة في خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب إلى `${VAR}` حرفياً.
- يعمل ذلك مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: ولا تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكلاً واحداً للكائن:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `source: "env"` لـ id: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط `source: "exec"` لـ id: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (على سبيل المثال يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- يتم تضمين مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعدادات مزوّدي الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

- يدعم مزوّد `file` الوضعين `mode: "json"` و`mode: "singleValue"` (ويجب أن يكون `id` هو `"value"` في وضع singleValue).
- يتطلب مزوّد `exec` مسار `command` مطلقاً ويستخدم حمولات البروتوكول على stdin/stdout.
- يتم افتراضياً رفض مسارات الأوامر الرمزية symlink. اضبط `allowSymlinkCommand: true` للسماح بمسارات symlink مع التحقق من مسار الهدف المحلول.
- إذا تم ضبط `trustedDirs`، فسيُطبَّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة الابن الخاصة بـ `exec` محدودة افتراضياً؛ مرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- يتم حل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب من اللقطة فقط.
- يتم تطبيق تصفية السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

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

- يتم تخزين ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key` و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم ملفات التعريف ذات وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة لوقت التشغيل من لقطات محلولة داخل الذاكرة؛ ويتم تنظيف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يتم استيراد OAuth القديم من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب
  أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). ويمكن أن
  تهبط نصوص الفوترة الصريحة هنا حتى على استجابات `401`/`403`، لكن
  تظل مطابقات النص الخاصة بالمزوّد ضمن نطاق المزوّد الذي يملكها (مثل OpenRouter
  ‏`Key limit exceeded`). أما رسائل `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو
  حدود إنفاق المؤسسة/مساحة العمل فتظل ضمن مسار `rate_limit`
  بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات التراجع الخاصة بالفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو التراجع الخاص بـ `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء الحمل الزائد قبل التحول إلى نموذج احتياطي (الافتراضي: `1`). وتندرج هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير ملف تعريف/مزوّد محمّل فوق الحد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء rate-limit قبل التحول إلى نموذج احتياطي (الافتراضي: `1`). وتشمل سلة rate-limit هذه نصوصاً مشكلة حسب المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- ترتفع قيمة `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبت الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير السجلات الخارجي لعمليات النشر الإنتاجية.

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

- `enabled`: مفتاح رئيسي لمخرجات القياس instrumentation (الافتراضي: `true`).
- `flags`: مصفوفة سلاسل flags لتمكين مخرجات سجل موجهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد العمر بالميلي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL الخاص بالمجمّع لتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: رؤوس بيانات وصفية إضافية لـ HTTP/gRPC يتم إرسالها مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير traces أو metrics أو logs.
- `otel.sampleRate`: معدل أخذ عينات traces من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياس الدوري بالميلي ثانية.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة cache trace للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ cache trace بصيغة JSONL (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يتم تضمينه في مخرجات cache trace (جميعها افتراضياً: `true`).

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
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway ‏(الافتراضي: `true`).
- `auto.enabled`: تمكين التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة انتشار إضافية لقناة stable بالساعات (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسة ACP ‏(الافتراضي: `true`). اضبطها على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف ACP runtime backend الافتراضي (ويجب أن يطابق ACP runtime plugin مسجلاً).
- `defaultAgent`: معرّف وكيل ACP الهدف الاحتياطي عندما لا تحدد عمليات spawn هدفاً صريحاً.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات ACP runtime؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم chunk قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: قمع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تقوم `"live"` بالبث تدريجياً؛ بينما تقوم `"final_only"` بالتخزين المؤقت حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر الحالة/التحديث المسقطة الخاصة بـ ACP.
- `stream.tagVisibility`: سجل لأسماء الوسوم مع تجاوزات إظهار منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعاملات جلسة ACP قبل أن تصبح مؤهلة للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري لتشغيله عند تهيئة بيئة ACP runtime.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي في الـ banner:
  - `"random"` (الافتراضي): شعارات فرعية مضحكة/موسمية متبدلة.
  - `"default"`: شعار فرعي محايد ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: من دون نص شعار فرعي (مع استمرار إظهار عنوان/version الـ banner).
- لإخفاء الـ banner بالكامل (وليس الشعارات الفرعية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات وصفية تكتبها تدفقات الإعداد الإرشادي في CLI ‏(`onboard` و`configure` و`doctor`):

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

## Bridge ‏(قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءاً من مخطط الإعدادات (ويفشل التحقق إلى أن تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

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
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: المدة التي يتم خلالها الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. كما تتحكم أيضاً في تنظيف نُسخ النصوص المحذوفة المؤرشفة الخاصة بـ Cron. الافتراضي: `24h`؛ اضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم ملف سجل كل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يتم الاحتفاظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer المستخدم لتسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلا يتم إرسال رأس مصادقة.
- `webhook`: عنوان Webhook احتياطي قديم ومُهمل (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحمل `notify: true`.

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
- `backoffMs`: مصفوفة تأخيرات التراجع بالميلي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة على جميع الأنواع العابرة.

ينطبق ذلك فقط على مهام Cron أحادية التشغيل. أما المهام المتكررة فتستخدم معالجة فشل منفصلة.

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

- `enabled`: تمكين تنبيهات فشل مهام Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالميلي ثانية بين التنبيهات المتكررة لنفس المهمة (عدد صحيح غير سالب).
- `mode`: وضع التسليم — تقوم `"announce"` بالإرسال عبر رسالة قناة؛ وتقوم `"webhook"` بالنشر إلى Webhook المكوَّن.
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

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع المهام.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما توجد بيانات هدف كافية.
- `channel`: تجاوز قناة لتسليم announce. وتقوم `"last"` بإعادة استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook URL. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- تقوم `delivery.failureDestination` لكل مهمة بتجاوز هذا الافتراضي العام.
- عندما لا تكون هناك وجهة فشل عامة أو لكل مهمة، فإن المهام التي تسلّم بالفعل عبر `announce` تعود عند الفشل إلى هدف announce الأساسي نفسه.
- لا يتم دعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). ويتم تتبع عمليات Cron المعزولة على أنها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات القالب لنموذج الوسائط

عناصر نائبة للقالب يتم توسيعها في `tools.media.models[].args`:

| المتغير | الوصف |
| ------- | ----- |
| `{{Body}}` | كامل نص الرسالة الواردة |
| `{{RawBody}}` | النص الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات |
| `{{From}}` | معرّف المرسل |
| `{{To}}` | معرّف الوجهة |
| `{{MessageSid}}` | معرّف رسالة القناة |
| `{{SessionId}}` | UUID الجلسة الحالية |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة |
| `{{MediaUrl}}` | عنوان pseudo-URL للوسائط الواردة |
| `{{MediaPath}}` | مسار الوسائط المحلي |
| `{{MediaType}}` | نوع الوسائط (صورة/صوت/مستند/…) |
| `{{Transcript}}` | النص المنسوخ من الصوت |
| `{{Prompt}}` | media prompt المحلول لإدخالات CLI |
| `{{MaxChars}}` | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI |
| `{{ChatType}}` | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (best effort) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (best effort) |
| `{{SenderName}}` | اسم عرض المرسل (best effort) |
| `{{SenderE164}}` | رقم هاتف المرسل (best effort) |
| `{{Provider}}` | تلميح المزوّد (whatsapp أو telegram أو discord وما إلى ذلك) |

---

## تضمين الإعدادات (`$include`)

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
- مصفوفة ملفات: يتم دمجها عميقاً بالترتيب (ويقوم اللاحق بتجاوز السابق).
- المفاتيح المجاورة: يتم دمجها بعد التضمينات (فتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: يتم حلها نسبةً إلى الملف المضمِّن، ولكن يجب أن تبقى داخل دليل الإعدادات الأعلى مستوى (`dirname` الخاص بـ `openclaw.json`). ويُسمح بالأشكال المطلقة/`../` فقط عندما تستمر في الحل داخل هذا الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
