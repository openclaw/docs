---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو إلى القيم الافتراضية.
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو البوابة أو الأداة.
summary: مرجع إعدادات البوابة لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-11T15:16:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 351a245bed59d852ea8582e4e9fec5017a5c623cd6f0034766cdea1b5330be3c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسية لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية، وتوفّر روابط خارجية عندما يكون لنظام فرعي مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/الـ plugin أو كل إعداد دقيق متعلق بالذاكرة/QMD في صفحة واحدة.

مرجع الشيفرة:

- يعرض `openclaw config schema` مخطط JSON المباشر المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالحِزم المضمنة/الـ plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة النطاق للمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس توثيق الإعدادات مقابل سطح المخطط الحالي

مراجع معمقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/ar/tools/slash-commands) لفهرس الأوامر الحالي المضمّن + المجمّع
- صفحات القنوات/الـ plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيماً افتراضية آمنة عند عدم تحديدها.

---

## القنوات

تبدأ كل قناة تلقائياً عند وجود قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك |
| ------------------- | ------ |
| `pairing` (افتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن) |
| `open`              | السماح بكل الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل كل الرسائل الخاصة الواردة |

| سياسة المجموعات        | السلوك |
| --------------------- | ------ |
| `allowlist` (افتراضي) | فقط المجموعات المطابقة لقائمة السماح المُعدّة |
| `open`                | تجاوز قوائم السماح الخاصة بالمجموعات (مع بقاء اشتراط الإشارة مطبقاً) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالموفر معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويقتصر عدد طلبات اقتران الرسائل الخاصة المعلقة على **3 لكل قناة**.
إذا كانت كتلة الموفر مفقودة بالكامل (عدم وجود `channels.<provider>`)، تعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق آمن افتراضياً) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج بعينه. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المُعدّة. يُطبَّق تعيين القناة عندما لا تكون الجلسة تملك بالفعل تجاوزاً للنموذج (على سبيل المثال، تم تعيينه عبر `/model`).

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

### القيم الافتراضية للقنوات وإشارة النبض

استخدم `channels.defaults` للسلوك المشترك الخاص بسياسة المجموعات وإشارة النبض عبر الموفرين:

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
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق الإضافي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، `allowlist` (تضمين السياق فقط من المرسلين الموجودين في قائمة السماح)، `allowlist_quote` (مثل allowlist لكن مع الإبقاء على سياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات إشارة النبض.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات إشارة النبض.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات إشارة النبض بأسلوب مؤشرات مدمج.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بالبوابة (Baileys Web). ويبدأ تلقائياً عندما توجد جلسة مرتبطة.

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

<Accordion title="حسابات WhatsApp متعددة">

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضياً إذا كان موجوداً؛ وإلا يُستخدم أول معرّف حساب مُعدّ (بعد الترتيب).
- يجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الافتراضي الاحتياطي للحساب عندما يطابق معرّف حساب مُعدّ.
- يُرحّل `openclaw doctor` دليل مصادقة Baileys القديم ذي الحساب الواحد إلى `whatsapp/default`.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- يجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، عيّن افتراضياً صريحاً (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما يكون هذا الإعداد مفقوداً أو غير صالح.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي تبدأ من Telegram (ترحيل معرّفات المجموعات الفائقة، وأوامر `/config set|unset`).
- تُعدّ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` إعداداً لارتباطات ACP الدائمة لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram `sendMessage` + `editMessageText` (وتعمل في المحادثات المباشرة والجماعية).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` خاصاً بـ Discord بشكل صريح ذلك الرمز المميز لهذا الاستدعاء؛ بينما تبقى إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مأخوذة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة خادم guild) كأهداف للتسليم؛ وتُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة لـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي ينشئها البوت افتراضياً. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائل البوت نفسه).
- يؤدي `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) إلى إسقاط الرسائل التي تذكر مستخدماً آخر أو دوراً آخر لكن لا تذكر البوت (باستثناء @everyone/@here).
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة عمودياً حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيوط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` يعطّل ذلك)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل ذلك)
  - `spawnSubagentSessions`: مفتاح تفعيل اختياري لإنشاء/ربط الخيوط تلقائياً عبر `sessions_spawn({ thread: true })`
- تُعدّ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` إعداداً لارتباطات ACP الدائمة للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية بالإضافة إلى تجاوزات الانضمام التلقائي وTTS الاختيارية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` مباشرة إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضاً استرداد استقبال الصوت عبر مغادرة جلسة صوتية ثم إعادة الانضمام إليها بعد تكرار فشل فك التشفير.
- يُعدّ `channels.discord.streaming` مفتاح وضع البث القياسي. وتُرحَّل تلقائياً القيم القديمة `streamMode` وقيم `streaming` المنطقية.
- يربط `channels.discord.autoPresence` بين حالة التوفر في وقت التشغيل وحضور البوت (سليم => online، متدهور => idle، مستنفد => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة القابلة للتغيير حسب الاسم/الوسم (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. يعود إلى `commands.ownerAllowFrom` عند عدم تحديده.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفه لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح الجلسات الاختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل الخاصة للموافق، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين معاً. عندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا من قبل الموافقين الذين تم التعرف عليهم.
  - `cleanupAfterResolve`: عندما تكون قيمته `true`، يحذف رسائل الموافقة الخاصة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (لا شيء)، `own` (رسائل البوت، افتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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

- JSON حساب الخدمة: مضمن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضاً (`serviceAccountRef`).
- البدائل من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` كأهداف للتسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة مبدأ البريد الإلكتروني القابلة للتغيير (وضع توافق طارئ).

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

- يتطلب **وضع Socket** كلاً من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كبديل بيئي للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقولاً لكل اعتماد تتعلق بالمصدر/الحالة مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مُعدّ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي تبدأ من Slack.
- يجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يُعدّ `channels.slack.streaming.mode` مفتاح وضع بث Slack القياسي. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. وتُرحَّل تلقائياً القيم القديمة `streamMode` وقيم `streaming` المنطقية و`nativeStreaming`.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` كأهداف للتسليم.

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات الخيوط:** يكون `thread.historyScope` لكل خيط على حدة (الافتراضي) أو مشتركاً عبر القناة. ويؤدي `thread.inheritParent` إلى نسخ سجل القناة الأصلية إلى الخيوط الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة الخيط بأسلوب "is typing..." الخاصة بمساعد Slack هدف رد ضمن خيط. تبقى الرسائل الخاصة ذات المستوى الأعلى خارج الخيوط افتراضياً، لذلك تستخدم `typingReaction` أو التسليم العادي بدلاً من المعاينة بأسلوب الخيط.
- تضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء تنفيذ الرد، ثم تزيله عند الاكتمال. استخدم shortcode لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`) و`approvers` (معرّفات مستخدمي Slack) و`agentFilter` و`sessionFilter` و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تعديل/حذف |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد |
| memberInfo   | مفعّل | معلومات العضو |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة |

### Mattermost

يأتي Mattermost كـ plugin: `openclaw plugins install @openclaw/mattermost`.

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

أوضاع الدردشة: `oncall` (الرد عند @-mention، افتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مساراً (على سبيل المثال `/api/channels/mattermost/command`)، وليس URL كاملاً.
- يجب أن يشير `commands.callbackUrl` إلى نقطة نهاية بوابة OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز المميزة الخاصة بكل أمر التي
  يعيدها Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم يتم
  تفعيل أي أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء private/tailnet/internal، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` المضيف/النطاق الخاص بالاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- يتحكم `channels.mattermost.configWrites` في السماح أو منع عمليات كتابة الإعدادات التي تبدأ من Mattermost.
- يتطلب `channels.mattermost.requireMention` وجود `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز اشتراط الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
- يجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

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
- `channels.signal.configWrites`: السماح أو منع عمليات كتابة الإعدادات التي تبدأ من Signal.
- يجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعوماً عبر plugin، ويُعد ضمن `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles`، و`channels.bluebubbles.dmPolicy`.
- يجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة الهدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- إعداد قناة BlueBubbles الكامل موثّق في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضَّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى مغلف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققاً صارماً من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقاً في `~/.ssh/known_hosts`.
- يتحكم `channels.imessage.configWrites` في السماح أو منع عمليات كتابة الإعدادات التي تبدأ من iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضاً مطبعاً أو هدف محادثة صريحاً (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على مغلف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم عبر إضافة extension ويُعد ضمن `channels.matrix`.

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
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وخيار الشبكة هذا عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا تُتجاهل الغرف المدعو إليها ودعوات الرسائل الخاصة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح الجلسات الاختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - التجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل الخاصة في Matrix داخل الجلسات: يشارك `per-user` (الافتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل خاصة.
- تستخدم مجسات حالة Matrix وعمليات البحث المباشر في الدليل نفس سياسة الوكيل المستخدمة لحركة وقت التشغيل.
- إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم عبر extension ويُعد ضمن `channels.msteams`.

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
- إعداد Teams الكامل (بيانات الاعتماد، webhook، سياسة الرسائل الخاصة/المجموعات، والتجاوزات لكل فريق/قناة) موثق في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم عبر extension ويُعد ضمن `channels.irc`.

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
- يجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/اشتراط الإشارة) موثق في [IRC](/ar/channels/irc).

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

- يُستخدم `default` عندما يتم حذف `accountId` (في CLI + التوجيه).
- لا تنطبق رموز البيئة المميزة إلا على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حساباً غير افتراضي عبر `openclaw channels add` (أو عبر إعداد القناة) بينما ما زلت تستخدم إعداد قناة أحادي الحساب على المستوى الأعلى، فسيقوم OpenClaw أولاً بترقية القيم الأحادية الخاصة بالحساب الموجودة على المستوى الأعلى إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ بينما يمكن لـ Matrix بدلاً من ذلك الإبقاء على هدف named/default مطابق موجود.
- تستمر الارتباطات الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات ذات النطاق الخاص بالحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضاً بإصلاح الأشكال المختلطة عبر نقل القيم الأحادية على المستوى الأعلى ذات النطاق الخاص بالحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ بينما يمكن لـ Matrix الإبقاء على هدف named/default مطابق موجود.

### قنوات extension الأخرى

تُعدّ العديد من قنوات extension على شكل `channels.<id>` ومُوثقة في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### اشتراط الإشارة في الدردشة الجماعية

تفترض رسائل المجموعات افتراضياً **اشتراط الإشارة** (إشارة من بيانات التعريف أو أنماط regex آمنة). ينطبق هذا على محادثات المجموعات في WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارات:**

- **إشارات بيانات التعريف**: إشارات @ الأصلية على المنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- يُفرض اشتراط الإشارة فقط عندما يكون الاكتشاف ممكناً (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها عبر `channels.<channel>.historyLimit` (أو لكل حساب). اضبط القيمة على `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة خاصة → القيمة الافتراضية للموفر → بلا حد (الاحتفاظ بكل شيء).

مدعوم في: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص ضمن `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويستجيب فقط لأنماط النص):

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

- تهيئ هذه الكتلة أسطح الأوامر. للاطلاع على فهرس الأوامر الحالي المضمّن + المجمّع، راجع [Slash Commands](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/الـ plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` الخاصة بـ QQ Bot، و`/card` الخاصة بـ LINE، و`/pair` الخاصة بـ device-pair، و`/dreaming` الخاصة بالذاكرة، و`/phone` الخاصة بـ phone-control، و`/voice` الخاصة بـ Talk موثقة في صفحات القنوات/الـ plugin الخاصة بها بالإضافة إلى [Slash Commands](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- يؤدي `native: "auto"` إلى تشغيل الأوامر الأصلية في Discord/Telegram، ويترك Slack معطلاً.
- يؤدي `nativeSkills: "auto"` إلى تشغيل أوامر Skills الأصلية في Discord/Telegram، ويترك Slack معطلاً.
- يمكن التجاوز لكل قناة عبر `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة مسبقاً.
- يمكن تجاوز تسجيل Skills الأصلية لكل قناة عبر `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل موجوداً في `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (لقراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء البوابة `chat.send`، تتطلب عمليات الكتابة الدائمة عبر `/config set|unset` أيضاً `operator.admin`؛ بينما يظل `/config show` للقراءة فقط متاحاً لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP الذي يديره OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف الـ plugin وتثبيتها وعناصر التحكم في التفعيل/التعطيل.
- يتحكم `channels.<provider>.configWrites` في تغييرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضاً في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل البوابة. الافتراضي: `true`.
- تمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- تؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في مطالبة النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- تكون `allowFrom` لكل موفّر. وعند تعيينها، تصبح **المصدر الوحيد** للتفويض (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقنوات و`useAccessGroups`).
- تسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` معينة.
- خريطة توثيق الأوامر:
  - الفهرس المضمّن + المجمّع: [Slash Commands](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [Pairing](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - dreaming الخاص بالذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## القيم الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري المعروض في سطر Runtime ضمن مطالبة النظام. إذا لم يُعيَّن، يكتشفه OpenClaw تلقائياً عبر الصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة السماح الافتراضية الاختيارية لـ Skills للوكلاء الذين لا يضبطون
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

- احذف `agents.defaults.skills` للسماح بكل Skills افتراضياً من دون قيود.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك الوكيل؛
  ولا تندمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات التمهيد الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات التمهيد الخاصة بمساحة العمل داخل مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار الاستكمال الآمنة (بعد اكتمال رد المساعد) إعادة حقن تمهيد مساحة العمل، مما يقلل حجم المطالبة. وتظل عمليات heartbeat وإعادات المحاولة بعد الضغط تعيد بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف تمهيد لمساحة العمل قبل الاقتطاع. الافتراضي: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي لعدد الأحرف المحقونة عبر جميع ملفات تمهيد مساحة العمل. الافتراضي: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يتم اقتطاع سياق التمهيد.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص التحذير أبداً في مطالبة النظام.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

الحد الأقصى لحجم البكسلات لأطول ضلع في الصورة داخل كتل صور السجل/الأدوات قبل استدعاءات الموفّر.
الافتراضي: `1200`.

تقلل القيم الأدنى عادةً من استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات التي تحتوي على لقطات شاشة كثيرة.
وتحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس للطوابع الزمنية للرسائل). تعود إلى المنطقة الزمنية للمضيف.

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
      params: { cacheRetention: "long" }, // القيم الافتراضية العامة لمعاملات الموفّر
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

- تقبل `model` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يضبط الشكل النصي النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج التبديل الاحتياطي المرتبة.
- تقبل `imageModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - تُستخدم في مسار أداة `image` بوصفها إعداد نموذج الرؤية.
  - وتُستخدم أيضاً كتوجيه احتياطي عندما لا يتمكن النموذج المحدد/الافتراضي من قبول إدخال الصور.
- تقبل `imageGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - تُستخدم في إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا اخترت موفّراً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة الموفّر/مفتاح API المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا تزال `image_generate` قادرة على استنتاج قيمة افتراضية لموفّر مدعوم بالمصادقة. فهي تحاول أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الصور المسجلين بترتيب معرّف الموفّر.
- تقبل `musicGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - تُستخدم في إمكانية توليد الموسيقى المشتركة وفي أداة `music_generate` المضمنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا حُذف، فلا تزال `music_generate` قادرة على استنتاج قيمة افتراضية لموفّر مدعوم بالمصادقة. فهي تحاول أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الموسيقى المسجلين بترتيب معرّف الموفّر.
  - إذا اخترت موفّراً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة الموفّر/مفتاح API المطابق.
- تقبل `videoGenerationModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - تُستخدم في إمكانية توليد الفيديو المشتركة وفي أداة `video_generate` المضمنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا تزال `video_generate` قادرة على استنتاج قيمة افتراضية لموفّر مدعوم بالمصادقة. فهي تحاول أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الفيديو المسجلين بترتيب معرّف الموفّر.
  - إذا اخترت موفّراً/نموذجاً مباشرةً، فاضبط أيضاً مصادقة الموفّر/مفتاح API المطابق.
  - يدعم موفّر توليد الفيديو Qwen المضمّن حتى فيديو إخراج واحداً، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى الموفّر.
- تقبل `pdfModel` إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - تُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات elevated الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: بالصيغة `provider/model` (مثلاً `openai/gpt-5.4`). إذا حذفت الموفّر، يحاول OpenClaw أولاً اسماً مستعاراً، ثم مواءمة موفّر مُعدّ فريد لهذا المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى الموفّر الافتراضي المُعدّ (سلوك توافق قديم ومهجور، لذا يُفضّل استخدام `provider/model` الصريح). وإذا لم يعد ذلك الموفّر يوفّر النموذج الافتراضي المُعدّ، يعود OpenClaw إلى أول موفّر/نموذج مُعدّ بدلاً من إظهار قيمة افتراضية قديمة لموفّر تمت إزالته.
- `models`: فهرس النماذج المُعدّ وقائمة السماح لأمر `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالموفّر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معاملات الموفّر الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (لمعرّف الوكيل المطابق) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل المضمن منخفض المستوى الافتراضية للوكلاء. استخدم `runtime: "auto"` للسماح لـ plugin harnesses المسجلة بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض PI harness المضمّن، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- تحفظ أدوات كتابة الإعدادات التي تعدّل هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) شكل الكائن القياسي وتحافظ على قوائم الاحتياطي الموجودة متى أمكن.
- `maxConcurrent`: الحد الأقصى للتشغيلات المتوازية للوكلاء عبر الجلسات (مع بقاء كل جلسة متسلسلة داخلياً). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في أي منفّذ منخفض المستوى يشغّل أدوار الوكيل المضمنة.
يجب على معظم البيئات الاحتفاظ بالقيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر plugin موثوق harness أصلياً، مثل
Codex app-server harness المضمّن.

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

- `runtime`: `"auto"` أو `"pi"` أو معرّف harness plugin مسجل. يسجّل Codex plugin المضمّن القيمة `codex`.
- `fallback`: `"pi"` أو `"none"`. تُبقي `"pi"` على PI harness المضمّن كخيار احتياطي للتوافق. وتجعل `"none"` غياب اختيار plugin harness أو عدم دعمه يؤدي إلى الفشل بدلاً من استخدام PI بصمت.
- تجاوزات البيئة: تؤدي `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` إلى تجاوز `runtime`؛ وتؤدي `OPENCLAW_AGENT_HARNESS_FALLBACK=none` إلى تعطيل الرجوع إلى PI لهذه العملية.
- في البيئات المخصصة لـ Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في chat harness المضمن. أما توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS فتبقى تستخدم إعدادات الموفّر/النموذج الخاصة بها.

**اختصارات alias المضمنة** (لا تنطبق إلا عندما يكون النموذج موجوداً في `agents.defaults.models`):

| Alias               | النموذج |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تتغلب الأسماء المستعارة التي تضبطها أنت دائماً على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائياً ما لم تضبط `--thinking off` أو تعرّف بنفسك `agents.defaults.models["zai/<model>"].params.thinking`.
وتفعّل نماذج Z.AI القيمة `tool_stream` افتراضياً لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيلها.
وتستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` للتفكير عندما لا يكون هناك مستوى تفكير صريح مضبوط.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع الاحتياطي النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عندما تفشل موفّرات API.

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

- واجهات CLI الخلفية موجهة للنص أولاً؛ وتكون الأدوات معطلة دائماً.
- تكون الجلسات مدعومة عندما يكون `sessionArg` مضبوطاً.
- يكون تمرير الصور مدعوماً عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. اضبطها على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم الخاصة بكل وكيل ذات أولوية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات بيضاء فقط. وهي مفيدة لتجارب prompt المضبوطة.

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

تشغيلات heartbeat الدورية.

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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند القيمة false، يحذف قسم Heartbeat من مطالبة النظام ويتخطى حقن `HEARTBEAT.md` في سياق التمهيد. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند القيمة true، يحجب حمولات تحذير أخطاء الأدوات أثناء تشغيلات heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل heartbeat قبل إيقافه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم المباشر إلى الهدف. وتمنع `block` التسليم المباشر إلى الهدف وتنتج `reason=dm-blocked`.
- `lightContext`: عند القيمة true، تستخدم تشغيلات heartbeat سياق تمهيد خفيفاً وتحتفظ فقط بملف `HEARTBEAT.md` من ملفات تمهيد مساحة العمل.
- `isolatedSession`: عند القيمة true، يعمل كل heartbeat في جلسة جديدة بلا سجل محادثة سابق. وهو نفس نمط العزل في cron `sessionTarget: "isolated"`. ويقلل كلفة الرموز لكل heartbeat من نحو ~100K إلى ~2-5K رموز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **لا يشغّل heartbeat إلا هؤلاء الوكلاء فقط**.
- تنفّذ heartbeat أدوار وكيل كاملة — الفواصل الأقصر تستهلك مزيداً من الرموز.

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
        notifyUser: true, // send a brief notice when compaction starts (default: false)
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

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للتواريخ الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف plugin موفّر compaction مسجل. عند تعيينه، يتم استدعاء `summarize()` الخاصة بالموفّر بدلاً من تلخيص LLM المضمن. ويعود إلى المضمن عند الفشل. ويؤدي تعيين موفّر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية compaction واحدة قبل أن يقوم OpenClaw بإيقافها. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` (الافتراضي) أو `off` أو `custom`. تضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات غير الشفافة قبل تلخيص compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبطها على `[]` لتعطيل إعادة الحقن. وعند تركها غير معيّنة أو تعيينها صراحةً إلى هذا الزوج الافتراضي، تُقبل أيضاً عناوين `Every Session`/`Safety` الأقدم كخيار احتياطي قديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج معيّن بينما تعمل ملخصات compaction على نموذج آخر؛ وعند عدم تعيينه، تستخدم compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعاراً موجزاً إلى المستخدم عند بدء compaction (على سبيل المثال: "Compacting context..."). يكون معطلاً افتراضياً حتى تظل compaction صامتة.
- `memoryFlush`: دور وكيل صامت قبل compaction التلقائي لتخزين الذكريات الدائمة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقتطع **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

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

- يفعّل `mode: "cache-ttl"` عمليات الاقتطاع.
- تتحكم `ttl` في عدد المرات التي يمكن بعدها تشغيل الاقتطاع مجدداً (بعد آخر لمسة للذاكرة المؤقتة).
- يقوم الاقتطاع أولاً باقتطاع نتائج الأدوات الكبيرة جزئياً، ثم يزيل بالكامل نتائج الأدوات الأقدم إذا لزم الأمر.

**الاقتطاع الجزئي** يحتفظ بالبداية + النهاية ويُدرج `...` في المنتصف.

**الإزالة الكاملة** تستبدل نتيجة الأداة بالكامل بالنص البديل.

ملاحظات:

- لا يتم اقتطاع/إزالة كتل الصور أبداً.
- تعتمد النسب على عدد الأحرف (تقريبياً)، لا على عدد الرموز الدقيق.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي الاقتطاع.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

### حظر البث

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتفعيل الردود المجمعة.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تكون القيم الافتراضية في Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود المجمعة. تعني `natural` = ‏800–2500ms. تجاوز كل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التقسيم إلى أجزاء.

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

- القيم الافتراضية: `instant` للمحادثات المباشرة/الإشارات، و`message` للمحادثات الجماعية غير المشار فيها.
- تجاوزات كل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

الحماية الاختيارية للوكيل المضمن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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

<Accordion title="تفاصيل sandbox">

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام يعتمد على SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد الواجهة الخلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة يمررها OpenClaw إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المعتمدة على SecretRef من اللقطة النشطة لأسرار وقت التشغيل قبل بدء جلسة sandbox

**سلوك الواجهة الخلفية SSH:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي النسخة المعتمدة
- يوجه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائياً
- لا يدعم حاويات متصفح sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل sandbox بحسب النطاق ضمن `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تركيب مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد OpenShell plugin:**

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

- `mirror`: زرع البعيد من المحلي قبل التنفيذ، ثم المزامنة العكسية بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي النسخة المعتمدة
- `remote`: زرع البعيد مرة واحدة عند إنشاء sandbox، ثم إبقاء مساحة العمل البعيدة هي النسخة المعتمدة

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw إلى sandbox تلقائياً بعد خطوة الزرع.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن الـ plugin يملك دورة حياة sandbox ومزامنة mirror الاختيارية.

يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويتطلب خروجاً للشبكة، وجذراً قابلاً للكتابة، ومستخدم root.

**تكون القيمة الافتراضية للحاويات هي `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. كما يتم حظر `"container:<id>"` افتراضياً ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (خيار طارئ).

تُجهّز **المرفقات الواردة** داخل `media/inbound/*` في مساحة العمل النشطة.

يقوم `docker.binds` بتركيب أدلة مضيف إضافية؛ ويتم دمج التركيبات العامة وتلك الخاصة بكل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في مطالبة النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضياً ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلاً من كشف كلمة المرور في عنوان URL المشترك).

- يؤدي `allowHostControl: false` (الافتراضي) إلى حظر استهداف جلسات sandbox للمتصفح الموجود على المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عاماً.
- يقيّد `cdpSourceRange` اختيارياً دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة مضيف إضافية داخل حاوية متصفح sandbox فقط. وعند تعيينه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` بالنسبة إلى حاوية المتصفح.
- تُعرّف القيم الافتراضية للتشغيل في `scripts/sandbox-browser-entrypoint.sh` وتكون مضبوطة لمضيفي الحاويات:
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
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعلة افتراضياً ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    الحد الافتراضي للعمليات في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما تكون `noSandbox` مفعلة.
  - تمثل القيم الافتراضية خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير القيم الافتراضية للحاوية.

</Accordion>

يقتصر عزل المتصفح و`sandbox.docker.binds` على Docker فقط.

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
- `default`: عند تعيين أكثر من واحد، يفوز الأول (مع تسجيل تحذير). وإذا لم يُعيَّن أي واحد، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز الشكل النصي `primary` فقط؛ بينما يتجاوز شكل الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل القيم الاحتياطية العامة). وظائف Cron التي لا تتجاوز سوى `primary` تستمر في وراثة القيم الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا للتجاوزات الخاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلاً من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: تجاوز اختياري لكل وكيل لرؤية الاستدلال (`on | off | stream`). ويُطبّق عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لكل وكيل للوضع السريع (`true | false`). وتُطبّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفض المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل أحد الوكلاء مخصصاً لـ Codex فقط بينما يحتفظ الآخرون برجوع PI الافتراضي.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع قيم `runtime.acp` الافتراضية (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل جلسات ACP harness افتراضياً.
- `identity.avatar`: مسار نسبي لمساحة العمل، أو URL من نوع `http(s)`، أو URI من نوع `data:`.
- تستنتج `identity` قيماً افتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حارس وراثة sandbox: إذا كانت جلسة الطالب داخل sandbox، يرفض `sessions_spawn` الأهداف التي ستعمل خارج sandbox.
- `subagents.requireAgentId`: عندما تكون true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف شخصي صريح؛ الافتراضي: false).

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

### حقول مطابقة الارتباط

- `type` (اختياري): `route` للتوجيه العادي (يؤدي غياب النوع إلى استخدام route افتراضياً)، و`acp` لارتباطات محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط مع `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يجري OpenClaw الحل وفق هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding أعلاه.

### ملفات الوصول لكل وكيل

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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصوداً).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك كل الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القياسية بنظراء مسبوقين بالموفّر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. تعيد `daily` التعيين عند `atHour` حسب التوقيت المحلي؛ وتعيد `idle` التعيين بعد `idleMinutes`. وعند ضبط الاثنين معاً، يفوز أيهما تنتهي صلاحيته أولاً.
- **`resetByType`**: تجاوزات لكل نوع (`direct` و`group` و`thread`). وتُقبل القيمة القديمة `dm` كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لقيمة `totalTokens` في الجلسة الأصلية المسموح بها عند إنشاء جلسة خيط متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الجلسة الأصلية أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلاً من وراثة سجل الجلسة الأصلية.
  - اضبطها على `0` لتعطيل هذا الحارس والسماح دائماً بالتفريع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائماً `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، النطاق: `0`–`5`). تؤدي القيمة `0` إلى تعطيل التسلسل المتبادل.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. ويفوز أول منع.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: تصدر `warn` تحذيرات فقط؛ بينما تطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات الراكدة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عند تجاوزه هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتعود افتراضياً إلى `pruneAfter`؛ واضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولاً.
  - `highWaterBytes`: الهدف الاختياري بعد تنظيف الميزانية. ويكون افتراضياً `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفّرين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` يعطّل ذلك؛ ويمكن للموفّرين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل ذلك؛ ويمكن للموفّرين تجاوزه)

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

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

آلية الحل (الأكثر تحديداً يفوز): الحساب ← القناة ← العام. تعطل `""` الميزة وتوقف التسلسل. تستنتج `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف                 | المثال                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | الاسم المختصر للنموذج  | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل   | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم الموفّر            | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي   | `high`، `low`، `off`        |
| `{identity.name}` | اسم هوية الوكيل        | (مثل `"auto"`)              |

المتغيرات غير حساسة لحالة الأحرف. وتمثل `{think}` اسماً مستعاراً لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يعود افتراضياً إلى `identity.emoji` للوكيل النشط، وإلا إلى `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← الرجوع إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، و`group-all`، و`direct`، و`all`.
- يزيل `removeAckAfterReply` تفاعل الإقرار بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة المرتبطة بدورة الحياة في Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي تركه غير مضبوط إلى إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتمكين تفاعلات الحالة المرتبطة بدورة الحياة.

### إزالة الارتداد للوارد

يجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فوراً. وتتجاوز أوامر التحكم إزالة الارتداد.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن للأمر `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للملخص التلقائي.
- تكون `modelOverrides` مفعلة افتراضياً؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تفعيل اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست لـ OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

القيم الافتراضية لوضع Talk ‏(macOS/iOS/Android).

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

- يجب أن تطابق `talk.provider` مفتاحاً في `talk.providers` عندما يتم إعداد عدة موفّري Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط، وتُرحّل تلقائياً إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- تقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُستخدم البديل `ELEVENLABS_API_KEY` إلا عندما لا يكون هناك مفتاح API مُعدّ لـ Talk.
- تسمح `providers.*.voiceAliases` لتوجيهات Talk باستخدام أسماء سهلة.
- تتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال النص المنسوخ. وتركها غير معيّنة يبقي نافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة السماح الأساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية الإعداد المحلي الإعدادات المحلية الجديدة افتراضياً على `tools.profile: "coding"` عند عدم تعيينه (مع الحفاظ على الملفات التعريفية الصريحة الحالية).

| الملف التعريفي | يتضمن |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status` |
| `full`      | بلا تقييد (مماثل لعدم التعيين) |

### مجموعات الأدوات

| المجموعة           | الأدوات |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec` و`process` و`code_execution` (`bash` مقبول كاسم مستعار لـ `exec`) |
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
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء provider plugins) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبق حتى عندما يكون Docker sandbox معطلاً.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقيّد الأدوات أكثر لموفّرين أو نماذج محددة. الترتيب: الملف التعريفي الأساسي ← ملف تعريف الموفّر ← السماح/المنع.

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

- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا أن يقيّد أكثر.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ بينما تطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع sandboxing ويستخدم مسار الإفلات المُعدّ (`gateway` افتراضياً، أو `node` عندما يكون هدف exec هو `node`).

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
- `warningThreshold`: عتبة نمط التكرار من دون تقدم لإصدار التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: التحذير عند تكرار استدعاءات نفس الأداة/نفس الوسائط.
- `detectors.knownPollNoProgress`: التحذير/الحظر عند أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: التحذير/الحظر عند الأنماط الزوجية المتناوبة بلا تقدم.
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

يهيئ فهم الوسائط الواردة (الصورة/الصوت/الفيديو):

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

**إدخال الموفّر** (`type: "provider"` أو عند الحذف):

- `provider`: معرّف موفّر API (`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: وسائط مبنية على القوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**حقول مشتركة:**

- `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود حالات الفشل إلى الإدخال التالي.

تتبع مصادقة الموفّر الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة التسليم المباشر
  إلى القناة أولاً. الافتراضي: `false`
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
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تشغل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- قيد sandbox: عندما تكون الجلسة الحالية داخل sandbox وتكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض القيمة `tree` على الرؤية حتى لو كانت `tools.sessions.visibility="all"`.

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

- المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُحوَّل الملفات إلى مساحة عمل الطفل ضمن `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يُحجب محتوى المرفقات تلقائياً من حفظ السجل.
- تُتحقق مدخلات Base64 باستخدام فحوصات صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: تؤدي `delete` دائماً إلى إزالة المرفقات؛ بينما تحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضياً ما لم تنطبق قاعدة تمكين تلقائي صارمة لـ GPT-5 agentic.

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

- `planTool`: يفعّل أداة `update_plan` المنظمة لتتبع الأعمال متعددة الخطوات غير البسيطة.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. اضبطها على `true` لفرض تشغيل الأداة خارج هذا النطاق، أو على `false` لإبقائها معطلة حتى في تشغيلات GPT-5 الصارمة agentic.
- عند التفعيل، تضيف مطالبة النظام أيضاً إرشادات استخدام بحيث لا يستخدمها النموذج إلا في الأعمال الجوهرية ويحافظ على خطوة واحدة فقط بحالة `in_progress`.

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
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفين من `sessions_spawn` عندما لا يضبط وكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المضمّن. أضف موفّرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- تجاوز جذر إعداد الوكيل عبر `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير بيئة).
- أسبقية الدمج لمعرّفات الموفّر المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفّر مُداراً عبر SecretRef في سياق الإعداد/ملف المصادقة الحالي.
  - تُحدَّث قيم `apiKey` للموفّرين المُدارين عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلاً من حفظ الأسرار المحلولة.
  - تُحدَّث قيم رؤوس الموفّر المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو غير الموجودة في الوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين الإعدادات الصريحة وقيم الفهرس الضمنية.
  - تحتفظ `contextTokens` للنموذج المطابق بحد وقت التشغيل الصريح عندما يكون موجوداً؛ استخدمها لتقييد السياق الفعلي دون تغيير البيانات الوصفية الأصلية للنموذج.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات مرجعياً بحسب المصدر: تُكتب العلامات من لقطة إعداد المصدر النشطة (قبل الحل)، لا من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول الموفّر

- `models.mode`: سلوك فهرس الموفّرين (`merge` أو `replace`).
- `models.providers`: خريطة الموفّرين المخصصين مفاتيحها معرّفات الموفّر.
- `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وما إلى ذلك).
- `models.providers.*.apiKey`: اعتماد الموفّر (يُفضّل SecretRef/الاستبدال عبر البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: في Ollama + `openai-completions`، يحقن `options.num_ctx` داخل الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل الاعتماد داخل ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API upstream.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفّر النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع القيم الافتراضية للموفّر). تقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام المصادقة المضمنة للموفّر)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` (استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`)، و`"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائناً فرعياً اختيارياً `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef) و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حارس جلب HTTP الخاص بالموفّر (تفعيل اختياري من المشغّل لنقاط نهاية OpenAI المتوافقة المستضافة ذاتياً والموثوقة). يستخدم WebSocket نفس `request` للترويسات/TLS لكن ليس لحارس SSRF الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج الموفّر الصريحة.
- `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيفه ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. ويبقي `baseUrl` الفارغ/المحذوف سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية chat المتوافقة مع OpenAI والتي تقبل سلاسل فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح معرّف موفّر اختياري للاكتشاف الموجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الإخراج للنماذج المكتشفة.

### أمثلة على الموفّرين

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

استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ و`zai/glm-4.7` مع Z.AI المباشر.

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

اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لفهرس Zen أو المراجع `opencode-go/...` لفهرس Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. ويُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف موفّراً مخصصاً مع تجاوز `baseUrl`.

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
وليس على معرّف الموفّر المضمن وحده.

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

متوافق مع Anthropic، وموفّر مضمّن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب ألا يتضمن `baseUrl` المسار `/v1` (لأن عميل Anthropic يضيفه). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
يفترض فهرس النماذج M2.7 فقط.
في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضياً ما لم تضبط `thinking` بنفسك صراحةً. ويعيد `/fast on` أو
`params.fastMode: true` كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجاً محلياً كبيراً عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة كخيار احتياطي.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمنة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (الأدنى أولوية).
- `install.preferBrew`: عندما تكون true، يفضّل مثبّتات Homebrew عندما يكون `brew`
  متاحاً قبل الرجوع إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة ملائمة لـ Skills التي تعرّف متغير بيئة أساسياً (سلسلة نصية صريحة أو كائن SecretRef).

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
- يقبل الاكتشاف إضافات OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل البوابة.**
- `allow`: قائمة سماح اختيارية (يتم تحميل الإضافات المدرجة فقط). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل ملائم لمفتاح API على مستوى الـ plugin (عندما يدعمه الـ plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق الـ plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core الخطاف `before_prompt_build` ويتجاهل الحقول القديمة المعدِّلة للـ prompt من `before_agent_start`، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على خطافات الـ plugin الأصلية وعلى أدلة الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا الـ plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في التشغيلات الخلفية للوكلاء الفرعيين.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكلاء الفرعيين الموثوق بها. استخدم `"*"` فقط عندما تريد عمداً السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعداد يعرّفه الـ plugin (ويتم التحقق منه عبر مخطط OpenClaw plugin الأصلي عندما يكون متاحاً).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفّر web-fetch الخاص بـ Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). ويعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر للذاكرة المؤقتة بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تفعيل موفّر X Search.
  - `model`: نموذج Grok المراد استخدامه في البحث (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات dreaming الخاصة بالذاكرة (تجريبية). راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: المفتاح الرئيسي لـ dreaming (الافتراضي `false`).
  - `frequency`: تردد cron لكل عملية dreaming كاملة (`"0 3 * * *"` افتراضياً).
  - تعد سياسة المراحل والعتبات تفاصيل تنفيذ داخلية (وليست مفاتيح إعدادات موجّهة للمستخدم).
- يوجد إعداد الذاكرة الكامل في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضاً لإضافات Claude bundle المفعلة أن تساهم بقيم Pi افتراضية مضمنة من `settings.json`؛ ويطبّقها OpenClaw كإعدادات وكيل منقحة، لا كتصحيحات إعدادات OpenClaw خام.
- `plugins.slots.memory`: اختر معرّف plugin الذاكرة النشط، أو `"none"` لتعطيل إضافات الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف plugin محرك السياق النشط؛ ويكون الافتراضي `"legacy"` ما لم تثبّت محركاً آخر وتحدده.
- `plugins.installs`: بيانات تعريف التثبيت التي تديرها CLI وتستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

راجع [Plugins](/ar/tools/plugin).

---

## Browser

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

- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- تكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة عند عدم تعيينها، لذا تبقى ملاحة Browser صارمة افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بملاحة Browser عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوصات الوصول/الاكتشاف.
- تبقى `ssrfPolicy.allowPrivateNetwork` مدعومة كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون الملفات التعريفية البعيدة في وضع attach-only (ويُعطّل البدء/الإيقاف/إعادة التعيين).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يوفّر لك مزوّدك عنوان WebSocket مباشر لـ DevTools.
- تكون ملفات `existing-session` التعريفية خاصة بالمضيف فقط وتستخدم Chrome MCP بدلاً من CDP.
- يمكن لملفات `existing-session` التعريفية تعيين `userDataDir` لاستهداف
  ملف تعريف محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات `existing-session` التعريفية بحدود مسار Chrome MCP الحالية:
  إجراءات تعتمد على snapshot/ref بدلاً من استهداف CSS selectors، وخطافات رفع
  ملف واحد، وعدم وجود تجاوزات لمهلة dialogs، وعدم وجود `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تخصص ملفات `openclaw` المحلية المُدارة القيمتين `cdpPort` و`cdpUrl` تلقائياً؛ ولا
  تضبط `cdpUrl` صراحةً إلا في حالة CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- خدمة التحكم: على loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحديد حجم النافذة أو أعلام التصحيح).

---

## UI

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

- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (صبغة فقاعة وضع Talk، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. ويعود إلى هوية الوكيل النشط.

---

## البوابة

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

<Accordion title="تفاصيل حقول البوابة">

- `mode`: ‏`local` (تشغيل البوابة) أو `remote` (الاتصال ببوابة بعيدة). وترفض البوابة بدء التشغيل ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لكل من WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **الأسماء المستعارة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` (`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء المستعارة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع الربط الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع Docker bridge networking ‏(`-p 18789:18789`) تصل الحركة إلى `eth0`، لذلك تصبح البوابة غير قابلة للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضياً. وتتطلب عمليات الربط غير loopback مصادقة البوابة. وعملياً يعني ذلك رمزاً مميزاً/كلمة مرور مشتركة أو reverse proxy واعياً بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج الإعداد رمزاً مميزاً افتراضياً.
- إذا تم إعداد كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مُعداً ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط في إعدادات local loopback الموثوقة؛ ولا يُعرض هذا عمداً في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy واعٍ بالهوية وثق في ترويسات الهوية القادمة من `gateway.trustedProxies` (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع **مصدراً وكيلاً غير loopback**؛ ولا تستوفي reverse proxies المحلية على المضيف نفسه متطلبات مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (بعد التحقق عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة ترويسات Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي للبوابة. ويفترض هذا التدفق من دون رمز مميز أن مضيف البوابة موثوق. وتكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. ويُطبَّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز كلٌ على حدة). وتُرجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن لـ Tailscale Serve، تتم سلسلة المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك قد تؤدي المحاولات السيئة المتزامنة من العميل نفسه إلى تشغيل المحدِّد عند الطلب الثاني بدلاً من أن يمر الطلبان معاً كحالات عدم تطابق عادية.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمداً أن تخضع حركة localhost أيضاً للتحديد بالمعدل (لإعدادات الاختبار أو عمليات نشر proxy الصارمة).
- يتم دائماً تقييد محاولات مصادقة WS ذات الأصل المتصفحي مع تعطيل إعفاء loopback (دفاعاً إضافياً ضد محاولات التخمين العنيف لـ localhost من المتصفح).
- على loopback، تكون عمليات القفل هذه ذات الأصل المتصفحي معزولة حسب
  قيمة `Origin` المطَبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد
  تلقائياً إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، مع bind على loopback) أو `funnel` (عام، ويتطلب المصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات WebSocket الخاصة بالبوابة. وهي مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل Host-header لعمليات النشر التي تعتمد عمداً على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن يكون `remote.url` بصيغة `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باستخدام `ws://` النصي مع عناوين IP للشبكات الخاصة الموثوقة؛ ويظل الافتراضي مقصوراً على loopback فقط للاتصالات النصية.
- الحقلان `gateway.remote.token` / `.password` هما حقلا اعتماد للعميل البعيد. وهما لا يهيئان مصادقة البوابة بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لمرحل APNs الخارجي الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالمرحل إلى البوابة. ويجب أن يطابق هذا العنوان عنوان المرحل المضمن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من البوابة إلى المرحل بالمللي ثانية. القيمة الافتراضية هي `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية محددة للبوابة. حيث يجلب تطبيق iOS المقترن القيمة `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال ضمن نطاق التسجيل إلى البوابة. ولا يمكن لبوابة أخرى إعادة استخدام هذا التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئية مؤقتة لإعداد المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ طوارئ مخصص للتطوير لعناوين URL الخاصة بمرحل HTTP على loopback. ويجب أن تبقى عناوين URL الخاصة بالمرحل الإنتاجي على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبطه على `0` لتعطيل إعادة تشغيل مراقب الصحة على مستوى العالم. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. اجعلها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العام مفعلاً.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. وعند تعيينه، تكون له أولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء البوابة المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما لا تكون `gateway.auth.*` معينة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` مُعدّة صراحةً عبر SecretRef وكانت غير محلولة، فإن الحل يفشل بإغلاق آمن (من دون إخفاء عبر رجوع احتياطي بعيد).
- `trustedProxies`: عناوين IP الخاصة بالـ reverse proxy التي تنهي TLS أو تحقن ترويسات العميل المُمرَّر. أدرج فقط الوكلاء الذين تتحكم بهم. وتظل إدخالات loopback صالحة لإعدادات اكتشاف proxy المحلي/المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، تقبل البوابة `X-Real-IP` إذا كان `X-Forwarded-For` مفقوداً. الافتراضي `false` لسلوك إغلاق آمن.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لاستدعاء HTTP `POST /tools/invoke` (تمتد فوق قائمة الحظر الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الحظر الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضياً. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية URL-input الخاصة بـ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد المثيلات

شغّل عدة بوابات على مضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`) و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Multiple Gateways](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع البوابة (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: يولّد تلقائياً زوج شهادة/مفتاح محلياً موقّعاً ذاتياً عندما لا تكون الملفات الصريحة مُعدّة؛ للاستخدام المحلي/التطويري فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب تقييد أذوناته.
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
  - `"restart"`: أعد تشغيل عملية البوابة دائماً عند تغير الإعداد.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): حاول أولاً إعادة التحميل الحي؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعداد (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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
تُرفض رموز hook المميزة في سلسلة الاستعلام.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز البوابة.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مساراً فرعياً مخصصاً مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).

**نقاط النهاية:**

- `POST /hooks/wake` ← ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا تُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` ← يتم حلها عبر `hooks.mappings`

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلاً `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلاً من الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مساراً نسبياً وأن يبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة وعمليات traversal).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لتشغيل هذا hook (ويجب أن يكون مسموحاً به إذا كان فهرس النماذج مضبوطاً).

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

- تبدأ البوابة تلقائياً `gog gmail watch serve` عند الإقلاع عندما يكون مضبطاً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلاً إلى جانب البوابة.

---

## مضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير من الوكيل عبر HTTP تحت منفذ البوابة:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- في عمليات الربط غير loopback: تتطلب مسارات canvas مصادقة البوابة (token/password/trusted-proxy)، مثلها مثل أسطح HTTP الأخرى للبوابة.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ وبعد إقران عقدة واتصالها، تعلن البوابة عناوين URL للقدرات ضمن نطاق العقدة للوصول إلى canvas/A2UI.
- ترتبط عناوين URL الخاصة بالقدرات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها سريعاً. ولا يُستخدم الرجوع الاحتياطي المعتمد على IP.
- يحقن عميل live-reload في HTML المقدم.
- ينشئ تلقائياً ملف `index.html` ابتدائياً عند الفراغ.
- يقدّم أيضاً A2UI على `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل البوابة.
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
- يكون اسم المضيف افتراضياً `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال ضمن `~/.openclaw/dns/`. وللاكتشاف عبر الشبكات، أقرنه بخادم DNS ‏(يُوصى بـ CoreDNS) + ‏Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات البيئة المضمنة)

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

- لا تُطبّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + الملف `~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف login shell لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### استبدال متغيرات البيئة

ارجع إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى رمي خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفياً.
- يعمل ذلك مع `$include`.

---

## الأسرار

تُعد مراجع الأسرار إضافية: ولا تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحداً:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` عند `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثلاً `"/providers/openai/apiKey"`)
- نمط `id` عند `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (مثلاً `a/../b` مرفوض)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد موفّري الأسرار

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

- يدعم موفّر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (ويجب أن تكون `id` هي `"value"` في وضع singleValue).
- يتطلب موفّر `exec` مسار `command` مطلقاً ويستخدم حمولات البروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضياً. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، فيُطبَّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة عملية الابن لـ `exec` محدودة افتراضياً؛ مرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب تلك اللقطة فقط.
- يُطبّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعلة إلى فشل بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

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

- تُخزّن الملفات التعريفية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم الملفات التعريفية في وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد auth-profile المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة لوقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة backoff الأساسية بالساعات عندما يفشل ملف تعريفي بسبب
  أخطاء حقيقية في الفوترة/عدم كفاية الرصيد (الافتراضي: `5`). ويمكن للنص الصريح
  الخاص بالفوترة أن يقع هنا حتى في استجابات `401`/`403`، لكن مطابِقات النصوص
  الخاصة بكل موفّر تبقى محصورة في الموفّر الذي يملكها (مثلاً OpenRouter
  `Key limit exceeded`). بينما تبقى رسائل `402` القابلة لإعادة المحاولة الخاصة
  بنافذة الاستخدام أو حد الإنفاق الخاص بالمؤسسة/مساحة العمل ضمن مسار `rate_limit`
  بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفّر لساعات backoff الخاصة بالفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لـ backoff الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة backoff الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو backoff الخاص بـ `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات backoff (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile ضمن الموفّر نفسه لأخطاء التحميل الزائد قبل التبديل إلى النموذج الاحتياطي (الافتراضي: `1`). وتقع هنا أشكال انشغال الموفّر مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير موفّر/ملف تعريفي محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile ضمن الموفّر نفسه لأخطاء تحديد المعدل قبل التبديل إلى النموذج الاحتياطي (الافتراضي: `1`). ويتضمن مسار تحديد المعدل هذا نصوصاً ذات شكل خاص بالموفّر مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- اضبط `logging.file` لمسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبح عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = ‏500 MB). استخدم تدوير السجلات الخارجي في بيئات الإنتاج.

---

## التشخيص

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

- `enabled`: المفتاح الرئيسي لمخرجات أدوات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام التي تفعّل مخرجات سجل موجّهة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالمللي ثانية لإصدار تحذيرات الجلسة العالقة بينما تظل الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبعات من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل التفريغ الدوري للقياسات بالمللي ثانية.
- `cacheTrace.enabled`: يسجل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لملف JSONL الخاص بتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يتم تضمينه في مخرجات تتبع الذاكرة المؤقتة (وجميعها افتراضياً: `true`).

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
- `checkOnStart`: التحقق من تحديثات npm عند بدء البوابة (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable ‏(الافتراضي: `12`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة الميزة العامة لـ ACP ‏(الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لتوزيع أدوار جلسات ACP ‏(الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق ACP runtime plugin مسجلاً).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي المستهدف عندما لا تحدد عمليات الإنشاء هدفاً صريحاً.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يحجب أسطر الحالة/الأدوات المكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يبث تدريجياً؛ بينما `final_only` يخزن مؤقتاً حتى الأحداث النهائية للدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر الحالة/التحديث المسقطة الخاصة بـ ACP.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في أسلوب الشعار النصي:
  - `"random"` (الافتراضي): شعارات نصية متناوبة طريفة/موسمية.
  - `"default"`: شعار نصي ثابت ومحايد (`كل محادثاتك، OpenClaw واحد.`).
  - `"off"`: بدون نص شعار (مع استمرار عرض عنوان اللافتة/الإصدار).
- لإخفاء اللافتة بالكامل (وليس فقط الشعارات النصية)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية يكتبها CLI أثناء تدفقات الإعداد الموجهة (`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` ضمن [القيم الافتراضية للوكلاء](#agent-defaults).

---

## Bridge ‏(قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن TCP bridge. تتصل العقد عبر WebSocket الخاص بالبوابة. ولم تعد مفاتيح `bridge.*` جزءاً من مخطط الإعدادات (وسيفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

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

- `sessionRetention`: المدة التي تُحتفظ خلالها بجلسات تشغيل cron المعزولة المكتملة قبل اقتطاعها من `sessions.json`. كما تتحكم أيضاً في تنظيف نُسخ نصوص cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ واضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل الاقتطاع. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يتم الاحتفاظ بها عند تشغيل اقتطاع سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer يُستخدم في تسليم POST إلى webhook الخاص بـ cron ‏(`delivery.mode = "webhook"`). وإذا حُذف، لا يتم إرسال ترويسة مصادقة.
- `webhook`: عنوان URL قديم ومهجور لـ webhook ‏(http/https) يُستخدم فقط للوظائف المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف ذات التشغيل الواحد عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات backoff بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة مع جميع الأنواع العابرة.

ينطبق هذا فقط على وظائف cron ذات التشغيل الواحد. أما الوظائف المتكررة فلها معالجة إخفاقات منفصلة.

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

- `enabled`: يفعّل تنبيهات الفشل لوظائف cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة لنفس الوظيفة (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ترسل `"announce"` عبر رسالة قناة؛ بينما تنشر `"webhook"` إلى webhook المُعد.
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

- الوجهة الافتراضية لإشعارات فشل cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما توجد بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. تؤدي `"last"` إلى إعادة استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ webhook. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب عند التسليم.
- يتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تكون الوجهة العامة ولا الوجهة الخاصة بكل وظيفة مضبوطة، فإن الوظائف التي تسلّم بالفعل عبر `announce` تعود عند الفشل إلى هدف announce الأساسي نفسه.
- لا تكون `delivery.failureDestination` مدعومة إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). ويتم تتبع تشغيلات cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائبة للقوالب يتم توسيعها في `tools.media.models[].args`:

| المتغير           | الوصف |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات |
| `{{From}}`         | معرّف المرسل |
| `{{To}}`           | معرّف الوجهة |
| `{{MessageSid}}`   | معرّف رسالة القناة |
| `{{SessionId}}`    | UUID الجلسة الحالية |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة |
| `{{MediaUrl}}`     | pseudo-URL للوسائط الواردة |
| `{{MediaPath}}`    | المسار المحلي للوسائط |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…) |
| `{{Transcript}}`   | النص المفرغ للصوت |
| `{{Prompt}}`       | media prompt المحلول لإدخالات CLI |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI |
| `{{ChatType}}`     | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد) |
| `{{SenderName}}`   | الاسم المعروض للمرسل (بأفضل جهد) |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد) |
| `{{Provider}}`     | تلميح الموفّر (whatsapp أو telegram أو discord وما إلى ذلك) |

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
- مصفوفة ملفات: يتم دمجها عميقاً بالترتيب (حيث تتجاوز القيم اللاحقة القيم السابقة).
- المفاتيح المجاورة: تُدمج بعد التضمينات (وتتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: يتم حلها بالنسبة إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى مستوى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الصيغ المطلقة/`../` فقط عندما تُحل داخل ذلك الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة على الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
