---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو البوابة أو الأدوات
summary: مرجع إعدادات البوابة لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى المراجع الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-08T06:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f9ab34fb56897a77cb038d95bea21e8530d8f0402b66d1ee97c73822a1e8fd4
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسي لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتضع روابط خارجية عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل كتالوج أوامر مملوك لقناة/إضافة أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

المصدر البرمجي للحقيقة:

- `openclaw config schema` يطبع مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات الإضافات/القنوات/الملحقات المجمعة عند توفرها
- `config.schema.lookup` يعيد عقدة مخطط واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- `pnpm config:docs:check` / `pnpm config:docs:gen` يتحققان من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر Slash](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/الإضافات المالكة لأسطح الأوامر الخاصة بكل قناة

تنسيق الإعدادات هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يوجد قسم إعداداتها (إلا إذا كان `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك                                                        |
| -------------------- | ------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`          | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)             |
| `open`               | السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`           | تجاهل جميع الرسائل الخاصة الواردة                                |

| سياسة المجموعة         | السلوك                                               |
| ---------------------- | ---------------------------------------------------- |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المهيأة          |
| `open`                 | تجاوز قوائم السماح للمجموعات (مع استمرار تطبيق بوابة الإشارات) |
| `disabled`             | حظر جميع رسائل المجموعات/الغرف                        |

<Note>
يضبط `channels.defaults.groupPolicy` السياسة الافتراضية عندما لا تكون `groupPolicy` لموفّر ما معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى لطلبات اقتران الرسائل الخاصة المعلّقة عند **3 لكل قناة**.
إذا كانت كتلة الموفّر مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات وقت التشغيل إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معين. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المهيأة. ويُطبَّق تعيين القناة عندما لا تكون الجلسة تملك بالفعل تجاوزًا للنموذج (على سبيل المثال، تم تعيينه عبر `/model`).

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

### افتراضيات القنوات ونبض الحالة

استخدم `channels.defaults` لسلوك سياسة المجموعات ونبض الحالة المشترك عبر الموفّرين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى الموفّر معيّنة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق التكميلي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/الخيط/السجل)، `allowlist` (تضمين السياق فقط من المرسلين الموجودين في قائمة السماح)، `allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات نبض الحالة.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/الخطأ في مخرجات نبض الحالة.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات نبض الحالة بنمط مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بالبوابة (Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // العلامات الزرقاء (false في وضع الدردشة الذاتية)
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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا أول معرّف حساب مهيأ (بعد الفرز).
- يقوم `channels.whatsapp.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مهيأ.
- يُرحَّل دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
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
          systemPrompt: "اجعل الإجابات مختصرة.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "ابقَ ضمن الموضوع.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "نسخة احتياطية Git" },
        { command: "generate", description: "أنشئ صورة" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (الافتراضي: off؛ فعّل صراحةً لتجنب حدود المعدل الخاصة بتحرير المعاينة)
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

- رمز bot: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ الروابط الرمزية مرفوضة)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يقوم `channels.telegram.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- في إعدادات تعدد الحسابات (معرّفا حساب أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- `configWrites: false` يحظر عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، `/config set|unset`).
- تهيئ إدخالات `bindings[]` من المستوى الأعلى ذات `type: "acp"` روابط ACP دائمة لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات تدفق Telegram `sendMessage` + `editMessageText` (وتعمل في الدردشات المباشرة والجماعية).
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
              systemPrompt: "إجابات قصيرة فقط.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (يُحوَّل progress إلى partial على Discord)
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
        spawnSubagentSessions: false, // تفعيل اختياري لـ sessions_spawn({ thread: true })
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

- الرمز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord هذا الرمز للاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب آتية من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يقوم `channels.discord.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة guild) لأهداف التسليم؛ تُرفض المعرّفات الرقمية الخام.
- تكون slugs الخاصة بـ guilds بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحوّل إلى slug (بدون `#`). ويُفضَّل استخدام معرّفات guild.
- يتم تجاهل الرسائل التي أنشأها bot افتراضيًا. يفعّل `allowBots: true` التعامل معها؛ واستخدم `allowBots: "mentions"` لقبول رسائل bot التي تذكر bot فقط (مع استمرار تصفية الرسائل الخاصة به نفسه).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القناة) يُسقط الرسائل التي تذكر مستخدمًا أو دورًا آخر لكن لا تذكر bot (باستثناء @everyone/@here).
- `maxLinesPerMessage` (الافتراضي 17) يقسم الرسائل الطويلة عموديًا حتى لو كانت أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSubagentSessions`: مفتاح تفعيل اختياري لإنشاء/ربط الخيوط تلقائيًا عبر `sessions_spawn({ thread: true })`
- تهيئ إدخالات `bindings[]` من المستوى الأعلى ذات `type: "acp"` روابط ACP دائمة للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات الصوت في Discord والانضمام التلقائي الاختياري + تجاوزات TTS.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار فشل فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. تتم ترحيل القيم القديمة `streamMode` وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` توافر وقت التشغيل بحالة حضور bot (سليم => online، متدهور => idle، منهك => dnd) ويسمح بتجاوزات نص الحالة الاختيارية.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين مطابقة الاسم/الوسم القابل للتغيير (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. يعود إلى `commands.ownerAllowFrom` عند الحذف.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي) يرسل إلى الرسائل الخاصة للموافقين، و`"channel"` يرسل إلى القناة الأصلية، و`"both"` يرسل إلى كليهما. عندما يشمل الهدف `"channel"`، لا يمكن استخدام الأزرار إلا من قبل الموافقين الذين تم حلهم.
  - `cleanupAfterResolve`: عندما يكون `true`، يحذف رسائل الموافقة الخاصة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (لا شيء)، `own` (رسائل bot، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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

- JSON حساب الخدمة: مضمن (`serviceAccount`) أو معتمد على ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- القيم الاحتياطية من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة principal البريد الإلكتروني القابل للتغيير (وضع توافق طارئ).

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
          systemPrompt: "إجابات قصيرة فقط.",
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
        nativeTransport: true, // استخدم API البث الأصلي في Slack عندما يكون mode=partial
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

- **وضع Socket** يتطلب كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من البيئة للحساب الافتراضي).
- **وضع HTTP** يتطلب `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  نصية صريحة أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول مصدر/حالة لكل بيانات الاعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus` و، في وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مهيأ عبر SecretRef ولكن المسار الحالي للأمر/وقت التشغيل لم يتمكن
  من حل قيمة السر.
- `configWrites: false` يحظر عمليات كتابة الإعدادات التي يبدأها Slack.
- يقوم `channels.slack.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. تتم ترحيل القيم القديمة `streamMode` و`streaming` المنطقي و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات الخيوط:** يكون `thread.historyScope` لكل خيط (الافتراضي) أو مشتركًا عبر القناة. ويقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى الخيوط الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة الخيط بأسلوب "يكتب الآن..." هدف خيط رد. تبقى الرسائل الخاصة العليا خارج الخيوط افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من معاينة نمط الخيط.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم اختصار emoji في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`) و`approvers` (معرّفات مستخدمي Slack) و`agentFilter` و`sessionFilter` و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراء | الافتراضي | ملاحظات                  |
| -------------- | --------- | ------------------------ |
| reactions      | مفعّل     | التفاعل + سرد التفاعلات |
| messages       | مفعّل     | قراءة/إرسال/تعديل/حذف  |
| pins           | مفعّل     | تثبيت/إلغاء تثبيت/سرد   |
| memberInfo     | مفعّل     | معلومات العضو           |
| emojiList      | مفعّل     | قائمة emoji المخصصة     |

### Mattermost

يُشحن Mattermost كإضافة: `openclaw plugins install @openclaw/mattermost`.

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
        native: true, // تفعيل اختياري
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL صريح اختياري لعمليات النشر خلف proxy عكسي/العامة
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع المحادثة: `oncall` (الرد عند @-mention، الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة المحفّز).

عندما تكون الأوامر الأصلية لـ Mattermost مفعلة:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`) وليس URL كاملًا.
- يجب أن يُحل `commands.callbackUrl` إلى نقطة نهاية بوابة OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز الخاصة بكل أمر التي
  يعيدها Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم
  تُفعّل أي أوامر، يرفض OpenClaw الاستدعاءات برسالة
  `Unauthorized: invalid command token.`
- بالنسبة لمضيفات الاستدعاء الخاصة/الداخلية/Tailscale، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس URLs كاملة.
- `channels.mattermost.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: يتطلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز لبوابة الإشارة لكل قناة (`"*"` للافتراضي).
- يقوم `channels.mattermost.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

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

- `channels.signal.account`: يثبت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Signal.
- يقوم `channels.signal.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### BlueBubbles

BlueBubbles هو المسار الموصى به لـ iMessage (مدعوم بإضافة، ومهيأ تحت `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl وpassword وwebhookPath وعناصر التحكم في المجموعات والإجراءات المتقدمة:
      // راجع /channels/bluebubbles
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles` و`channels.bluebubbles.dmPolicy`.
- يقوم `channels.bluebubbles.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يمكن لإدخالات `bindings[]` من المستوى الأعلى ذات `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم handle أو سلسلة هدف BlueBubbles (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- إعداد قناة BlueBubbles الكامل موثّق في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يقوم OpenClaw بتشغيل `imsg rpc` (JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يقوم `channels.imessage.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

- يتطلب Full Disk Access لقاعدة بيانات الرسائل.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى wrapper عبر SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود بالفعل في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` من المستوى الأعلى ذات `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle موحدًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال wrapper عبر SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تُدعَم Matrix عبر امتداد وتُهيّأ تحت `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر proxy HTTP(S) صريح. ويمكن للحسابات المسماة تجاوز ذلك عبر `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وهذا التفعيل للشبكة عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات تعدد الحسابات.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها والدعوات الجديدة بأسلوب الرسائل الخاصة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي) أو `"channel"` (الغرفة الأصلية) أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix الخاصة ضمن الجلسات: `per-user` (الافتراضي) يشارك حسب peer الموجَّه، بينما `per-room` يعزل كل غرفة رسالة خاصة.
- تستخدم مجسات حالة Matrix وعمليات البحث الحي في الدليل نفس سياسة الـ proxy الخاصة بحركة وقت التشغيل.
- إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد موثّقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تُدعَم Microsoft Teams عبر امتداد وتُهيّأ تحت `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId وappPassword وtenantId وwebhook وسياسات الفريق/القناة:
      // راجع /channels/msteams
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams` و`channels.msteams.configWrites`.
- إعداد Teams الكامل (بيانات الاعتماد، webhook، سياسة الرسائل الخاصة/المجموعات، التجاوزات لكل فريق/قناة) موثّق في [Microsoft Teams](/ar/channels/msteams).

### IRC

تُدعَم IRC عبر امتداد وتُهيّأ تحت `channels.irc`.

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
- يقوم `channels.irc.defaultAccount` الاختياري بتجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارات) موثّق في [IRC](/ar/channels/irc).

### تعدد الحسابات (جميع القنوات)

شغّل عدة حسابات لكل قناة (لكل منها `accountId` خاص بها):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "الـ bot الأساسي",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot التنبيهات",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- يُستخدم `default` عندما يُحذف `accountId` (CLI + التوجيه).
- تنطبق رموز البيئة فقط على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما لا تزال على إعداد قناة من المستوى الأعلى لحساب واحد، فإن OpenClaw يرقّي أولًا القيم أحادية الحساب العلوية ذات النطاق الحسابي إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي موجود ومطابق بدلًا من ذلك.
- تستمر روابط القناة فقط الموجودة مسبقًا (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل الروابط ذات النطاق الحسابي اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل القيم أحادية الحساب العلوية ذات النطاق الحسابي إلى الحساب المرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي موجود ومطابق بدلًا من ذلك.

### قنوات الامتدادات الأخرى

تُهيّأ العديد من قنوات الامتدادات على شكل `channels.<id>` وتُوثّق في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارات في دردشات المجموعات

تفترض رسائل المجموعات افتراضيًا **ضرورة الإشارة** (إشارة في البيانات الوصفية أو أنماط regex آمنة). ينطبق ذلك على WhatsApp وTelegram وDiscord وGoogle Chat ودردشات مجموعات iMessage.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- تُفرَض بوابة الإشارات فقط عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات التجاوز عبر `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

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

طريقة الحل: تجاوز لكل رسالة خاصة → افتراضي الموفّر → بلا حد (الاحتفاظ بكل شيء).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص ضمن `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية ويرد فقط على أنماط النص):

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
    native: "auto", // تسجيل الأوامر الأصلية عندما تكون مدعومة
    nativeSkills: "auto", // تسجيل أوامر المهارات الأصلية عندما تكون مدعومة
    text: true, // تحليل /commands في رسائل الدردشة
    bash: false, // السماح بـ ! (الاسم البديل: /bash)
    bashForegroundMs: 2000,
    config: false, // السماح بـ /config
    mcp: false, // السماح بـ /mcp
    plugins: false, // السماح بـ /plugins
    debug: false, // السماح بـ /debug
    restart: true, // السماح بـ /restart + أداة إعادة تشغيل البوابة
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

- تهيئ هذه الكتلة أسطح الأوامر. لكتالوج الأوامر المضمنة + المجمعة الحالي، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/الإضافات مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs` وLINE `/card` وdevice-pair `/pair` والذاكرة `/dreaming` وphone-control `/phone` وTalk `/voice` موثقة في صفحات القنوات/الإضافات الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- `native: "auto"` يشغّل الأوامر الأصلية لـ Discord/Telegram ويترك Slack متوقفًا.
- `nativeSkills: "auto"` يشغّل أوامر المهارات الأصلية لـ Discord/Telegram ويترك Slack متوقفًا.
- تجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي `false` إلى مسح الأوامر المسجّلة مسبقًا.
- تجاوز تسجيل المهارات الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية لقائمة bot في Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة لعملاء البوابة `chat.send`، تتطلب عمليات الكتابة الدائمة `/config set|unset` أيضًا `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي صلاحية الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المدار من OpenClaw تحت `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف الإضافات وتثبيتها وتمكينها/تعطيلها.
- تتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة للقنوات متعددة الحسابات، تتحكم أيضًا `channels.<provider>.accounts.<id>.configWrites` في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل البوابة. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في مطالبة النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` هو لكل موفّر. عند تعيينه، يكون **مصدر التفويض الوحيد** (يتم تجاهل قوائم سماح القناة/الاقتران و`useAccessGroups`).
- يتيح `useAccessGroups: false` للأوامر تجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّنًا.
- خريطة وثائق الأوامر:
  - الكتالوج المضمن + المجمّع: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [Pairing](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## افتراضيات الوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime في مطالبة النظام. إذا لم يتم تعيينه، يكتشفه OpenClaw تلقائيًا بالصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية للمهارات للوكلاء الذين لا يضبطون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الافتراضيات
      { id: "locked-down", skills: [] }, // بلا مهارات
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على مهارات غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الافتراضيات.
- اضبط `agents.list[].skills: []` لعدم وجود مهارات.
- تكون القائمة غير الفارغة `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛
  ولا تُدمَج مع الافتراضيات.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap لمساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتجاوز أدوار الاستمرار الآمنة (بعد رد مساعد مكتمل) إعادة حقن bootstrap لمساحة العمل، مما يقلل حجم المطالبة. تعيد تشغيلات نبض الحالة ومحاولات ما بعد الضغط بناء السياق مع ذلك.

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

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات bootstrap لمساحة العمل. الافتراضي: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا تحقن نص تحذير في مطالبة النظام أبدًا.
- `"once"`: احقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

الحد الأقصى لحجم البكسل لأطول ضلع للصورة في كتل الصور ضمن السجل/الأدوات قبل استدعاءات الموفّر.
الافتراضي: `1200`.

تقلل القيم الأقل عادةً من استخدام vision-token وحجم حمولة الطلب في التشغيلات الكثيفة بلقطات الشاشة.
أما القيم الأعلى فتحافظ على تفاصيل بصرية أكثر.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس طوابع الرسائل الزمنية). تعود إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في مطالبة النظام. الافتراضي: `auto` (تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // المعلمات العامة الافتراضية للمزوّد
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

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تعيّن صيغة السلسلة النموذج الأساسي فقط.
  - تعيّن صيغة الكائن النموذج الأساسي بالإضافة إلى نماذج الفشل الاحتياطية المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بصفته إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الصور المشتركة وأي سطح أداة/إضافة مستقبلي يولد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا حددت موفّرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API المزوّد المطابق (مثل `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` لـ `openai/*`، أو `FAL_KEY` لـ `fal/*`).
  - إذا حُذفت، فلا تزال `image_generate` قادرة على استنتاج افتراضي موفّر مدعوم بالمصادقة. تحاول أولًا الموفّر الافتراضي الحالي، ثم باقي موفّري توليد الصور المسجّلين بترتيب معرّف الموفّر.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الموسيقى المشتركة والأداة المضمنة `music_generate`.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا حُذفت، فلا تزال `music_generate` قادرة على استنتاج افتراضي موفّر مدعوم بالمصادقة. تحاول أولًا الموفّر الافتراضي الحالي، ثم باقي موفّري توليد الموسيقى المسجّلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API المزوّد المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة توليد الفيديو المشتركة والأداة المضمنة `video_generate`.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذفت، فلا تزال `video_generate` قادرة على استنتاج افتراضي موفّر مدعوم بالمصادقة. تحاول أولًا الموفّر الافتراضي الحالي، ثم باقي موفّري توليد الفيديو المسجّلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API المزوّد المطابق.
  - يدعم موفّر توليد الفيديو Qwen المجمّع حاليًا حتى 1 فيديو خرج، و1 صورة دخل، و4 فيديوهات دخل، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت المزوّد، يحاول OpenClaw أولًا الاسم المستعار، ثم مطابقة فريدة لمزوّد مهيأ لذلك المعرّف النموذجي الدقيق، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق قديم ومهمل، لذا يفضَّل `provider/model` الصريح). إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، فإن OpenClaw يعود إلى أول موفّر/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: كتالوج النماذج المهيأ وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: المعلمات العامة الافتراضية للمزوّد المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في الإعدادات): يتجاوز `agents.defaults.params` (القاعدة العامة) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (الوكلاء المطابقين بمعرّفهم) بالمفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- تحفظ أدوات كتابة الإعدادات التي تغيّر هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطيات) صيغة الكائن القانونية وتحافظ على قوائم fallback الموجودة متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع استمرار تسلسل كل جلسة). الافتراضي: 4.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| الاسم المستعار      | النموذج                                 |
| ------------------- | --------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`             |
| `sonnet`            | `anthropic/claude-sonnet-4-6`           |
| `gpt`               | `openai/gpt-5.4`                        |
| `gpt-mini`          | `openai/gpt-5.4-mini`                   |
| `gpt-nano`          | `openai/gpt-5.4-nano`                   |
| `gemini`            | `google/gemini-3.1-pro-preview`         |
| `gemini-flash`      | `google/gemini-3-flash-preview`         |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`  |

تتغلب الأسماء المستعارة المهيأة لديك دائمًا على الافتراضيات.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف بنفسك `agents.defaults.models["zai/<model>"].params.thinking`.
تفعّل نماذج Z.AI القيمة `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيل ذلك.
تفترض نماذج Anthropic Claude 4.6 الوضع `adaptive` للتفكير عندما لا يكون هناك مستوى تفكير صريح معيّن.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية للتشغيلات الاحتياطية النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عندما تفشل موفّرات API.

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

- واجهات CLI الخلفية موجهة للنص أولًا؛ وتكون الأدوات معطلة دائمًا.
- تُدعَم الجلسات عندما يكون `sessionArg` معيّنًا.
- يُدعَم تمرير الصور عندما يقبل `imageArg` مسارات ملفات.

### `agents.defaults.heartbeat`

تشغيلات نبض حالة دورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطّل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // الافتراضي: false؛ true يحتفظ فقط بـ HEARTBEAT.md من ملفات bootstrap لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل heartbeat في جلسة جديدة (بلا سجل محادثة)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "اقرأ HEARTBEAT.md إذا كان موجودًا...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطه على `0m` للتعطيل.
- `suppressToolErrorWarnings`: عندما تكون true، يتم كبت حمولات تحذير أخطاء الأدوات أثناء تشغيلات heartbeat.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. `allow` (الافتراضي) يسمح بالتسليم المستهدف المباشر. و`block` يمنع التسليم المستهدف المباشر ويُصدر `reason=dm-blocked`.
- `lightContext`: عندما تكون true، تستخدم تشغيلات heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap لمساحة العمل.
- `isolatedSession`: عندما تكون true، يعمل كل heartbeat في جلسة جديدة بلا أي سجل محادثة سابق. نفس نمط العزل مثل cron `sessionTarget: "isolated"`. يقلل تكلفة tokens لكل heartbeat من نحو ~100K إلى ~2-5K token.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم من يشغّلون heartbeat.
- تشغّل heartbeats أدوار الوكيل الكاملة — والفواصل الأقصر تستهلك tokens أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف إضافة موفّر compaction مسجّلة (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "احتفظ بمعرّفات النشر ومعرّفات التذاكر وأزواج host:port كما هي تمامًا.", // يُستخدم عندما يكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ compaction فقط
        notifyUser: true, // أرسل إشعارًا موجزًا عندما يبدأ compaction (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "الجلسة تقترب من compaction. خزّن الذكريات الدائمة الآن.",
          prompt: "اكتب أي ملاحظات دائمة إلى memory/YYYY-MM-DD.md؛ وردّ بالرمز الصامت الدقيق NO_REPLY إذا لم يكن هناك ما يجب تخزينه.",
        },
      },
    },
  },
}
```

- `mode`: `default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف إضافة موفّر compaction مسجّلة. عند تعيينه، تُستدعى `summarize()` الخاصة بالموفّر بدلًا من التلخيص المدمج المعتمد على LLM. ويعود إلى المدمج عند الفشل. يؤدي تعيين موفّر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: أقصى عدد ثوانٍ مسموح لعملية compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `900`.
- `identifierPolicy`: `strict` (الافتراضي) أو `off` أو `custom`. يضيف `strict` إرشاد الاحتفاظ بالمعرّفات المعتمة المدمج قبل تلخيص compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد compaction. القيم الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبطها على `[]` لتعطيل إعادة الحقن. عند عدم تعيينها أو عند تعيين الزوج الافتراضي نفسه صراحةً، تُقبل أيضًا العناوين القديمة `Every Session`/`Safety` كقيمة احتياطية قديمة.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج معين بينما تعمل ملخصات compaction على نموذج آخر؛ وعند حذفه، تستخدم compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارًا موجزًا إلى المستخدم عند بدء compaction (مثل "Compacting context..."). وهو معطّل افتراضيًا للإبقاء على compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل compaction التلقائي لتخزين الذكريات الدائمة. يتم تجاوزه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم باقتطاع **نتائج الأدوات القديمة** من السياق داخل الذاكرة قبل إرسالها إلى LLM. ولا يقوم **بتعديل** سجل الجلسة على القرص.

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
        hardClear: { enabled: true, placeholder: "[تمت إزالة محتوى نتيجة الأداة القديمة]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` عمليات الاقتطاع.
- يتحكم `ttl` في عدد المرات التي يمكن أن يعمل فيها الاقتطاع مجددًا (بعد آخر لمس لذاكرة التخزين المؤقت).
- يقوم الاقتطاع أولًا باقتطاع نتائج الأدوات الكبيرة بشكل مرن، ثم يمسح نتائج الأدوات الأقدم بالكامل إذا لزم الأمر.

**الاقتطاع المرن** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم اقتطاع/مسح كتل الصور أبدًا.
- النِّسَب تعتمد على عدد الأحرف (تقريبية)، وليست على عدد tokens الدقيق.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي الاقتطاع.

</Accordion>

راجع [اقتطاع الجلسة](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

### البث الكتلي

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتفعيل الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` (وأشكالها لكل حساب). القيم الافتراضية لـ Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. `natural` = 800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة السلوك + تفاصيل التجزئة.

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

- الافتراضيات: `instant` للمحادثات المباشرة/الإشارات، و`message` لمحادثات المجموعات غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

تفعيل sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل.

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
          // SecretRefs / المحتويات المضمنة مدعومة أيضًا:
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

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد واجهة SSH الخلفية:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر تحكم سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- تُحل القيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة sandbox

**سلوك واجهة SSH الخلفية:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة العمل البعيدة عبر SSH هي المرجع القانوني
- ويوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- ولا يزامن التغييرات البعيدة إلى المضيف تلقائيًا
- ولا يدعم حاويات متصفح sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل sandbox بحسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد إضافة OpenShell:**

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
          policy: "strict", // معرّف سياسة OpenShell اختياري
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

- `mirror`: زرع البعيد من المحلي قبل exec، والمزامنة عكسيًا بعد exec؛ وتبقى مساحة العمل المحلية هي المرجع القانوني
- `remote`: زرع البعيد مرة واحدة عند إنشاء sandbox، ثم إبقاء مساحة العمل البعيدة هي المرجع القانوني

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى sandbox تلقائيًا بعد خطوة الزرع.
النقل يتم عبر SSH إلى sandbox الخاص بـ OpenShell، لكن الإضافة تملك دورة حياة sandbox والمزامنة المرآتية الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكة، وجذر قابل للكتابة، ومستخدم root.

**تكون الحاويات افتراضيًا على `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
تُحظر `"host"`. وتُحظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (وضع طارئ).

**المرفقات الواردة** تُجهّز ضمن `media/inbound/*` في مساحة العمل النشطة.

**`docker.binds`** يركب دلائل إضافية من المضيف؛ ويتم دمج bind العامة ومع bind لكل وكيل.

**متصفح sandbox** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. يتم حقن URL الخاص بـ noVNC في مطالبة النظام. لا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم الوصول للمراقبة عبر noVNC مصادقة VNC افتراضيًا ويُصدر OpenClaw URL رمزيًا قصير العمر (بدلًا من كشف كلمة المرور في الرابط المشترك).

- `allowHostControl: false` (الافتراضي) يمنع الجلسات داخل sandbox من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند طرف الحاوية إلى نطاق CIDR (مثل `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب دلائل مضيف إضافية داخل حاوية متصفح sandbox فقط. وعند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` بالنسبة لحاوية المتصفح.
- تُعرَّف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة لمضيفات الحاويات:
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
  - `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير العمل
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
  - الافتراضيات هي خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

Sandboxing المتصفح و`sandbox.docker.binds` مدعومان حاليًا فقط مع Docker.

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
        name: "الوكيل الرئيسي",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى التفكير لكل وكيل
        reasoningDefault: "on", // تجاوز ظهور reasoning لكل وكيل
        fastModeDefault: false, // تجاوز fast mode لكل وكيل
        params: { cacheRetention: "none" }, // يتجاوز defaults.models.params المطابقة بحسب المفتاح
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند تعيينه
        identity: {
          name: "Samantha",
          theme: "كسلان مفيد",
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
- `default`: عند تعيين عدة قيم، يفوز الأول (مع تسجيل تحذير). وإذا لم يُعيَّن أي منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تتجاوز `primary` فقط؛ وصيغة الكائن `{ primary, fallbacks }` تتجاوز كليهما (`[]` يعطّل fallback العامة). تظل وظائف Cron التي تتجاوز `primary` فقط ترث fallback الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النموذج كاملًا.
- `skills`: قائمة سماح مهارات اختيارية لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة الافتراضيات بدلًا من دمجها، و`[]` تعني عدم وجود مهارات.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). يتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يوجد تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: ظهور reasoning الافتراضي الاختياري لكل وكيل (`on | off | stream`). يُطبَّق عندما لا يوجد تجاوز reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية للوضع السريع لكل وكيل (`true | false`). تُطبَّق عندما لا يوجد تجاوز للوضع السريع لكل رسالة أو جلسة.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع افتراضيات `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يفترض الوكيل جلسات harness من ACP افتراضيًا.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو URL `http(s)`، أو URI `data:`.
- تستمد `identity` افتراضيات: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حارس وراثة sandbox: إذا كانت جلسة الطالب داخل sandbox، يرفض `sessions_spawn` الأهداف التي ستعمل خارج sandbox.
- `subagents.requireAgentId`: عندما تكون true، يحظر استدعاءات `sessions_spawn` التي تُحذف منها `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل بوابة واحدة. راجع [Multi-Agent](/ar/concepts/multi-agent).

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

- `type` (اختياري): `route` للتوجيه العادي (النوع المفقود يفترض route)، و`acp` لروابط محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة لإدخالات `type: "acp"`، يحل OpenClaw بالاعتماد على هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route أعلاه.

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

<Accordion title="بلا وصول إلى نظام الملفات (مراسلة فقط)">

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // تخطَّ fork الخيط الأب فوق هذا العدد من tokens (0 يعطّل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // اختياري ميزانية صارمة
      highWaterBytes: "400mb", // اختياري هدف التنظيف
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (وقت التشغيل يستخدم دائمًا "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسة الأساسية لسياقات دردشات المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عندما يكون المقصود سياقًا مشتركًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشارك جميع الرسائل الخاصة الجلسة الرئيسية.
  - `per-peer`: العزل بحسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القانونية بـ peers مسبوقة بموفّر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعندما يُهيَّأ الاثنان معًا، يفوز ما تنتهي صلاحيته أولًا.
- **`resetByType`**: تجاوزات بحسب النوع (`direct` و`group` و`thread`). وتُقبل `dm` القديمة كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` المسموح به لجلسة الأب عند إنشاء جلسة خيط forked (الافتراضي `100000`).
  - إذا كانت `totalTokens` الخاصة بالأب أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلًا من وراثة سجل الجلسة الأب.
  - اضبطه على `0` لتعطيل هذا الحارس والسماح دائمًا بعمل fork من الأب.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل الآن دائمًا `"main"` لسلة الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، المجال: `0`–`5`). وتؤدي `0` إلى تعطيل سلسلة ping-pong.
- **`sendPolicy`**: المطابقة بواسطة `channel` أو `chatType` (`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. يفوز أول deny.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: `warn` يطلق تحذيرات فقط؛ و`enforce` يطبق التنظيف.
  - `pruneAfter`: حد عمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. القيمة الافتراضية هي `pruneAfter`؛ اضبطه على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم القطع/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. القيمة الافتراضية `80%` من `maxDiskBytes`.
- **`threadBindings`**: افتراضيات عامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: المفتاح الافتراضي الرئيسي (يمكن للموفّرين التجاوز؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: تجاوز افتراضي لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` يعطّل؛ ويمكن للموفّرين التجاوز)
  - `maxAgeHours`: تجاوز افتراضي للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل؛ ويمكن للموفّرين التجاوز)

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

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

طريقة الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تؤدي `""` إلى التعطيل وإيقاف التسلسل. وتشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف                | المثال                     |
| ---------------- | -------------------- | -------------------------- |
| `{model}`        | اسم النموذج المختصر  | `claude-opus-4-6`          |
| `{modelFull}`    | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}`     | اسم الموفّر          | `anthropic`                |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`       |
| `{identity.name}` | اسم هوية الوكيل      | (نفس `"auto"`)            |

المتغيرات غير حساسة لحالة الأحرف. و`{think}` اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- القيمة الافتراضية هي `identity.emoji` للوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، `group-all`، `direct`، `all`.
- يزيل `removeAckAfterReply` تفاعل الإقرار بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  في Slack وDiscord، يعني عدم التعيين إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة من نفس المرسل في دور وكيل واحد. ويتم تفريغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

### TTS (تحويل النص إلى كلام)

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، بينما يعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- تكون `modelOverrides` مفعلة افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تفعيل اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية TTS الخاصة بـ OpenAI. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست OpenAI، يعاملها OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

الافتراضيات لوضع Talk (macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عندما يكون هناك عدة موفّري Talk مهيئين.
- مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط وتُرحَّل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الاحتياطي `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح API لـ Talk مهيأ.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المفرّغ. يؤدي عدم تعيينه إلى الاحتفاظ بنافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## الأدوات

### ملفات الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية الإعداد المحلي الافتراضي الإعدادات المحلية الجديدة إلى `tools.profile: "coding"` عندما لا تكون معيّنة (وتُحفَظ الملفات الصريحة الموجودة).

| الملف     | يتضمن                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal` | `session_status` فقط                                                                                                          |
| `coding`  | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                   |
| `full`    | بلا تقييد (نفس عدم التعيين)                                                                                                  |

### مجموعات الأدوات

| المجموعة          | الأدوات                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`   | `exec` و`process` و`code_execution` (يُقبل `bash` كاسم بديل لـ `exec`)                                                 |
| `group:fs`        | `read` و`write` و`edit` و`apply_patch`                                                                                   |
| `group:sessions`  | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`    | `memory_search` و`memory_get`                                                                                            |
| `group:web`       | `web_search` و`x_search` و`web_fetch`                                                                                    |
| `group:ui`        | `browser` و`canvas`                                                                                                      |
| `group:automation` | `cron` و`gateway`                                                                                                       |
| `group:messaging` | `message`                                                                                                                |
| `group:nodes`     | `nodes`                                                                                                                  |
| `group:agents`    | `agents_list`                                                                                                            |
| `group:media`     | `image` و`image_generate` و`video_generate` و`tts`                                                                       |
| `group:openclaw`  | جميع الأدوات المضمنة (باستثناء إضافات الموفّرين)                                                                       |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (يفوز المنع). غير حساسة لحالة الأحرف، وتدعم wildcards `*`. وتُطبَّق حتى عندما يكون Docker sandbox متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

يقيّد الأدوات أكثر لموفّرين أو نماذج محددة. الترتيب: الملف الأساسي → ملف الموفّر → السماح/المنع.

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

يتحكم في وصول exec المرتفع خارج sandbox:

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

- يمكن لتجاوز كل وكيل (`agents.list[].tools.elevated`) أن يقيّد فقط بشكل إضافي.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع sandboxing ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

فحوصات أمان حلقات الأدوات تكون **معطلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
- `warningThreshold`: عتبة النمط المتكرر بلا تقدم للتحذيرات.
- `criticalThreshold`: عتبة أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: يحذر من استدعاءات الأداة نفسها/الوسائط نفسها المتكررة.
- `detectors.knownPollNoProgress`: يحذر/يحظر الأدوات المعروفة للاستطلاع (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: يحذر/يحظر أنماط الأزواج المتبادلة بلا تقدم.
- إذا كان `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

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

يهيئ فهم الوسائط الواردة (صورة/صوت/فيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // تفعيل اختياري: إرسال الموسيقى/الفيديو غير المتزامن المكتمل مباشرة إلى القناة
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

**إدخال الموفّر** (`type: "provider"` أو محذوف):

- `provider`: معرّف موفّر API (`openai` أو `anthropic` أو `google`/`gemini` أو `groq`، إلخ)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المطلوب تشغيله
- `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وغيرها)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` → صورة، `google` → صورة+صوت+فيديو، `groq` → صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود حالات الفشل إلى الإدخال التالي.

تتبع مصادقة الموفّر الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`, تحاول المهام المكتملة غير المتزامنة لـ `music_generate`
  و`video_generate` التسليم المباشر للقناة أولًا. الافتراضي: `false`
  (المسار القديم للإيقاظ/التسليم بالنموذج من جلسة الطالب).

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

الافتراضي: `tree` (الجلسة الحالية + الجلسات الناتجة عنها، مثل الوكلاء الفرعيين).

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
- `agent`: أي جلسة تابعة لمعرّف الوكيل الحالي (قد يشمل مستخدمين آخرين إذا كنت تشغّل جلسات per-sender تحت نفس معرّف الوكيل).
- `all`: أي جلسة. ما زال الاستهداف عبر وكلاء مختلفين يتطلب `tools.agentToAgent`.
- قيد sandbox: عندما تكون الجلسة الحالية داخل sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض القيمة `tree` على visibility حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // تفعيل اختياري: اضبط true للسماح بالمرفقات الملفية المضمنة
        maxTotalBytes: 5242880, // 5 MB إجماليًا عبر جميع الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // الاحتفاظ بالمرفقات عندما يكون cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُحوَّل الملفات إلى مساحة عمل الابن عند `.openclaw/attachments/<uuid>/` مع `.manifest.json`.
- يُحجَب محتوى المرفقات تلقائيًا من حفظ السجل.
- تُتحقق المدخلات Base64 باستخدام فحوص صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- أذونات الملفات هي `0700` للدلائل و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: يؤدي `delete` دائمًا إلى إزالة المرفقات؛ بينما يحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تفعيل تلقائي خاصة بوقت تشغيل معين.

```json5
{
  tools: {
    experimental: {
      planTool: true, // فعّل update_plan التجريبية
    },
  },
}
```

ملاحظات:

- `planTool`: يفعّل الأداة المهيكلة `update_plan` لتتبع الأعمال غير التافهة متعددة الخطوات.
- الافتراضي: `false` للموفّرين غير OpenAI. وتُفعَّل تلقائيًا في تشغيلات OpenAI وOpenAI Codex عندما لا تكون معيّنة؛ اضبطها على `false` لتعطيل هذا التفعيل التلقائي.
- عند التفعيل، تضيف مطالبة النظام أيضًا إرشادات استخدام حتى لا يستخدمها النموذج إلا للأعمال الجوهرية ويحافظ على خطوة واحدة فقط `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. إذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لـ `sessions_spawn` عندما لا يضبط وكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وbase URLs

يستخدم OpenClaw كتالوج النماذج المضمّن. أضف موفّرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- تجاوز جذر إعدادات الوكيل عبر `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير بيئة).
- أسبقية الدمج لمعرّفات الموفّر المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفّر مُدارًا عبر SecretRef في سياق الإعداد/ملف المصادقة الحالي.
  - تُحدّث قيم `apiKey` الخاصة بالموفّر المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec) بدلًا من حفظ الأسرار المحلولة.
  - تُحدّث قيم رؤوس الموفّر المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المحذوفة للوكيل إلى `models.providers` في الإعدادات.
  - تستخدم قيم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين الإعداد الصريح وقيم الكتالوج الضمنية.
  - يحافظ `contextTokens` للنموذج المطابق على حد وقت تشغيل صريح عند وجوده؛ استخدمه لتقييد السياق الفعلي دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعداد المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول الموفّر

- `models.mode`: سلوك كتالوج الموفّر (`merge` أو `replace`).
- `models.providers`: خريطة موفّرين مخصصين بمفاتيح هي معرّفات الموفّرين.
- `models.providers.*.api`: مهيّئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai`، إلخ).
- `models.providers.*.apiKey`: بيانات اعتماد الموفّر (يفضَّل SecretRef/الاستبدال من البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يتم حقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: فرض نقل بيانات الاعتماد في رأس `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API upstream.
- `models.providers.*.headers`: رؤوس ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفّر النموذج.
  - `request.headers`: رؤوس إضافية (تُدمج مع افتراضيات الموفّر). تقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام مصادقة الموفّر المضمنة)، `"authorization-bearer"` (مع `token`)، `"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` (استخدام `HTTP_PROXY`/`HTTPS_PROXY` من البيئة)، `"explicit-proxy"` (مع `url`). ويقبل كلا الوضعين عنصر `tls` فرعيًا اختياريًا.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
- `models.providers.*.models`: إدخالات كتالوج نماذج صريحة للمزوّد.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدم هذا عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة على `false` وقت التشغيل. ويؤدي `baseUrl` الفارغ/المحذوف إلى الاحتفاظ بسلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI التي تدعم النص فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل نصية بسيطة قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف الموفّر للاكتشاف الموجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة سياق احتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الخرج للنماذج المكتشفة.

### أمثلة الموفّرين

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

استخدم `cerebras/zai-glm-4.7` لـ Cerebras؛ و`zai/glm-4.7` لاتصال Z.AI المباشر.

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

اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لكتالوج Zen أو مراجع `opencode-go/...` لكتالوج Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. ويُقبل `z.ai/*` و`z-ai/*` كأسماء بديلة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضي): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف موفّرًا مخصصًا مع تجاوز base URL.

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

بالنسبة إلى نقطة النهاية الصينية: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل
`openai-completions` المشترك، ويعتمد OpenClaw الآن على إمكانات نقطة النهاية
بدلًا من معرّف الموفّر المضمن وحده.

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

متوافق مع Anthropic، وهو موفّر مضمن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب أن يحذف base URL اللاحقة `/v1` (عميل Anthropic يضيفها). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
يفترض كتالوج النماذج الآن القيمة M2.7 فقط.
على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax
افتراضيًا ما لم تضبط `thinking` صراحةً. وتؤدي `/fast on` أو
`params.fastMode: true` إلى إعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بدمج النماذج المستضافة كخيار احتياطي.

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

- `allowBundled`: قائمة سماح اختيارية للمهارات المجمّعة فقط (لا تتأثر المهارات المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور مهارات مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون true، تُفضَّل أدوات التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل أداة إدارة Node لمواصفات
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطّل المهارة حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة للمهارات التي تعلن متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

---

## الإضافات

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

- تُحمّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف إضافات OpenClaw الأصلية بالإضافة إلى الحزم المتوافقة مع Codex وClaude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل البوابة.**
- `allow`: قائمة سماح اختيارية (تُحمّل فقط الإضافات المدرجة). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح لمفتاح API على مستوى الإضافة (عندما تدعمه الإضافة).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ذات نطاق للإضافة.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر core قيمة `before_prompt_build` ويتجاهل الحقول المعدّلة للمطالبة من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على hooks الإضافات الأصلية والدلائل المدعومة للحزم التي توفّر hooks.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذه الإضافة لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكيل الفرعي الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف من الإضافة (يتم التحقق منه بواسطة مخطط إضافة OpenClaw الأصلية عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفّر web-fetch لـ Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر لذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000