---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو القيم الافتراضية.
    - أنت تتحقق من صحة كتل إعدادات القنوات أو النماذج أو Gateway أو الأدوات.
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bdb0f3e56e4a4d767fb4d6150526ae9b3926ef5b213b458001f41d02762436d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسي لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتضع روابط خارجية عندما يكون لنظام فرعي مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/Plugin أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON Schema الفعلي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالحِزم المضمّنة/Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة ضمن نطاق مسار محدد لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

المراجع العميقة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر الحالي المدمج + المضمّن
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بكل قناة

تنسيق الإعدادات هو **JSON5** (مسموح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيماً افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائياً عندما يوجد قسم إعداداتها (إلا إذا كان `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن) |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة |

| سياسة المجموعات | السلوك |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المضبوطة |
| `open`                | تجاوز قوائم السماح للمجموعات (مع بقاء تقييد الإشارة مطبقاً) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` السياسة الافتراضية عندما لا تكون قيمة `groupPolicy` لموفّر ما معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدّ عدد طلبات اقتران الرسائل المباشرة المعلّقة عند **3 لكل قناة**.
إذا كانت كتلة الموفّر مفقودة بالكامل (عدم وجود `channels.<provider>`)، تعود سياسة المجموعات وقت التشغيل إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المضبوطة. يُطبَّق ربط القناة عندما لا تكون للجلسة بالفعل قيمة تجاوز للنموذج (على سبيل المثال، مضبوطة عبر `/model`).

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

استخدم `channels.defaults` للسلوك المشترك لسياسة المجموعات وHeartbeat عبر الموفّرين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون قيمة `groupPolicy` على مستوى الموفّر معيّنة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/الخيط/السجل)، `allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، `allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مضغوطة بأسلوب المؤشر.

### WhatsApp

يعمل WhatsApp من خلال قناة الويب الخاصة بـ Gateway ‏(Baileys Web). يبدأ تلقائياً عندما توجد جلسة مرتبطة.

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

- تفترض الأوامر الصادرة الحساب `default` إذا كان موجوداً؛ وإلا فسيُستخدم أول معرّف حساب مضبوط (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي ذلك عندما يطابق معرّف حساب مضبوطاً.
- ينقل `openclaw doctor` دليل المصادقة القديم أحادي الحساب لـ Baileys إلى `whatsapp/default`.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- في إعدادات الحسابات المتعددة (معرّفا حسابين أو أكثر)، عيّن قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما تكون هذه القيمة مفقودة أو غير صالحة.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي تبدأ من Telegram ‏(ترحيلات معرّف supergroup، و`/config set|unset`).
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة لمواضيع المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
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

- الرمز المميّز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحاً لـ Discord ذلك الرمز المميّز في الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مأخوذة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` ‏(قناة guild) لأهداف التسليم؛ تُرفض المعرّفات الرقمية الخام.
- تكون أسماء slug الخاصة بـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحوّل إلى slug ‏(من دون `#`). يُفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي ينشئها البوت افتراضياً. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع الاستمرار في تصفية رسائل البوت نفسه).
- تُسقط `channels.discord.guilds.<id>.ignoreOtherMentions` ‏(وتجاوزات القنوات) الرسائل التي تذكر مستخدماً آخر أو دوراً آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` ‏(الافتراضي 17) بتقسيم الرسائل الطويلة عمودياً حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيوط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`، بالإضافة إلى التسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لإنشاء/ربط الخيوط تلقائياً عبر `sessions_spawn({ thread: true })`
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية، مع تجاوزات اختيارية للانضمام التلقائي + TTS.
- تمرِّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` ‏(`true` و`24` افتراضياً).
- يحاول OpenClaw أيضاً استعادة استقبال الصوت عبر مغادرة جلسة الصوت ثم إعادة الانضمام إليها بعد تكرار حالات فشل فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع البث القياسي. وتُرحَّل تلقائياً القيم القديمة `streamMode` وقيم `streaming` المنطقية.
- يربط `channels.discord.autoPresence` حالة التوفّر وقت التشغيل بحضور البوت (سليم => online، متدهور => idle، exhausted => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة بالأسماء/الوسوم القابلة للتغيير (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. وتعود القيمة إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح الجلسات الاختيارية (substring أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` ‏(الافتراضي) إلى الرسائل المباشرة للموافق، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين معاً. وعندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين الذين تم حلهم.
  - `cleanupAfterResolve`: عند ضبطه على `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` ‏(لا شيء)، `own` ‏(رسائل البوت، الافتراضي)، `all` ‏(كل الرسائل)، `allowlist` ‏(من `guilds.<id>.users` على جميع الرسائل).

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

- JSON لحساب الخدمة: مضمن (`serviceAccount`) أو معتمد على ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضاً (`serviceAccountRef`).
- القيم الاحتياطية من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل المطابقة بعناوين البريد الإلكتروني القابلة للتغيير (وضع توافق طارئ).

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

- يتطلب **Socket mode** كلاً من `botToken` و`appToken` ‏(`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من البيئة للحساب الافتراضي).
- يتطلب **HTTP mode** ‏`botToken` بالإضافة إلى `signingSecret` ‏(على المستوى الجذري أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول مصدر/حالة لكل بيانات اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مضبوط عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي تبدأ من Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- يُعد `channels.slack.streaming.mode` مفتاح وضع بث Slack القياسي. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. وتُرحَّل تلقائياً القيم القديمة `streamMode` وقيم `streaming` المنطقية و`nativeStreaming`.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off` و`own` ‏(الافتراضي) و`all` و`allowlist` ‏(من `reactionAllowlist`).

**عزل جلسة الخيط:** يكون `thread.historyScope` لكل خيط على حدة (الافتراضي) أو مشتركاً على مستوى القناة. ينسخ `thread.inheritParent` سجل القناة الأصلية إلى الخيوط الجديدة.

- يتطلب كل من البث الأصلي في Slack وحالة الخيط بأسلوب مساعد Slack ‏"is typing..." هدف رد ضمن خيط. تبقى الرسائل المباشرة ذات المستوى الأعلى خارج الخيوط افتراضياً، لذلك تستخدم `typingReaction` أو التسليم العادي بدلاً من المعاينة بأسلوب الخيط.
- تضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء تنفيذ الرد، ثم تزيله عند الاكتمال. استخدم shortcode لرمز Slack التعبيري مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض الموافقين. نفس المخطط كما في Discord: ‏`enabled` ‏(`true`/`false`/`"auto"`)، و`approvers` ‏(معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` ‏(`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

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

أوضاع الدردشة: `oncall` ‏(الرد عند @-mention، الافتراضي)، و`onmessage` ‏(كل رسالة)، و`onchar` ‏(الرسائل التي تبدأ ببادئة المشغّل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مساراً (على سبيل المثال `/api/channels/mattermost/command`) وليس عنوان URL كاملاً.
- يجب أن يُحل `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز المميزة لكل أمر التي يعيدها
  Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم تُفعَّل أي
  أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/الداخليين/ضمن tailnet، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` المضيف/النطاق الخاص بالاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي تبدأ من Mattermost.
- `channels.mattermost.requireMention`: يتطلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الإشارة لكل قناة (`"*"` كافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.

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

**أوضاع إشعارات التفاعل:** `off` و`own` ‏(الافتراضي) و`all` و`allowlist` ‏(من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي تبدأ من Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.

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
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم BlueBubbles handle أو سلسلة target ‏(`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضَّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى SSH wrapper؛ اضبط `remoteHost` ‏(`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقاً في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي تبدأ من iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle مطبعاً أو هدف دردشة صريحاً (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على SSH wrapper لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

يعمل Matrix عبر extension ويُضبط ضمن `channels.matrix`.

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
- يمرّر `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر HTTP(S) proxy صريح. ويمكن للحسابات المسمّاة تجاوزه عبر `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وهذا الاشتراك الشبكي تحكمين مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا تُتجاهل الغرف المدعوّة ودعوات الرسائل المباشرة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح الجلسات الاختيارية (substring أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` ‏(الافتراضي) أو `"channel"` ‏(الغرفة الأصلية) أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix ضمن الجلسات: `per-user` ‏(الافتراضي) يشارك حسب النظير الموجّه، بينما `per-room` يعزل كل غرفة رسالة مباشرة.
- تستخدم مجسات حالة Matrix وعمليات البحث الحية في الدليل سياسة proxy نفسها الخاصة بحركة وقت التشغيل.
- إعداد Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

يعمل Microsoft Teams عبر extension ويُضبط ضمن `channels.msteams`.

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
- إعداد Teams الكامل (بيانات الاعتماد، وWebhook، وسياسة الرسائل المباشرة/المجموعات، والتجاوزات لكل فريق/قناة) موثّق في [Microsoft Teams](/ar/channels/msteams).

### IRC

يعمل IRC عبر extension ويُضبط ضمن `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- إعداد قناة IRC الكامل (host/port/TLS/channels/allowlists/mention gating) موثّق في [IRC](/ar/channels/irc).

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
- تنطبق رموز البيئة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حساباً غير افتراضي عبر `openclaw channels add` ‏(أو onboarding للقناة) بينما لا تزال على إعداد قناة أحادي الحساب على المستوى الأعلى، فإن OpenClaw يرقّي أولاً القيم أحادية الحساب على المستوى الأعلى ذات النطاق الحسابي إلى خريطة حسابات القناة بحيث يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الاحتفاظ بهدف مسمّى/افتراضي موجود ومطابق.
- تستمر ارتباطات القنوات الحالية فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل الارتباطات ذات النطاق الحسابي اختيارية.
- يقوم `openclaw doctor --fix` أيضاً بإصلاح الأشكال المختلطة عبر نقل القيم أحادية الحساب على المستوى الأعلى ذات النطاق الحسابي إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الاحتفاظ بهدف مسمّى/افتراضي موجود ومطابق.

### قنوات extension أخرى

تُضبط العديد من قنوات extension كـ `channels.<id>` وتوثَّق في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الإشارة في الدردشات الجماعية

تتطلب رسائل المجموعات افتراضياً **وجود إشارة** (إشارة ضمن البيانات الوصفية أو أنماط regex آمنة). ينطبق ذلك على دردشات المجموعات في WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @-mention الأصلية للمنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الإشارة إلا عندما يكون الاكتشاف ممكناً (إشارات أصلية أو وجود نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها عبر `channels.<channel>.historyLimit` ‏(أو لكل حساب). اضبط `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة مباشرة → افتراضي الموفّر → بلا حد (الاحتفاظ بكل شيء).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @-mention الأصلية، ويستجيب فقط لأنماط النص):

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

- تضبط هذه الكتلة أسطح الأوامر. لفهرس الأوامر الحالي المدمج + المضمّن، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` في QQ Bot، و`/card` في LINE، و`/pair` في device-pair، و`/dreaming` في الذاكرة، و`/phone` في phone-control، و`/voice` في Talk موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- يقوم `native: "auto"` بتشغيل الأوامر الأصلية في Discord/Telegram، ويُبقي Slack معطلاً.
- يقوم `nativeSkills: "auto"` بتشغيل أوامر Skills الأصلية في Discord/Telegram، ويُبقي Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجّلة مسبقاً.
- تجاوز تسجيل Skills الأصلية لكل قناة عبر `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` ‏(لقراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء Gateway ‏`chat.send`، تتطلب أيضاً عمليات الكتابة الدائمة عبر `/config set|unset` وجود `operator.admin`؛ بينما يبقى الأمر `config show/` للقراءة فقط متاحاً لعملاء المشغّل ذوي نطاق الكتابة العادي.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها والتحكم في تمكينها/تعطيلها.
- تضبط `channels.<provider>.configWrites` بوابة تعديلات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، تضبط `channels.<provider>.accounts.<id>.configWrites` أيضاً عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك لأوامر/أدوات المالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` خاص بكل موفّر. عند ضبطه، يكون هو **مصدر التفويض الوحيد** (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطاً.
- خريطة وثائق الأوامر:
  - الفهرس المدمج + المضمّن: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: ‏[QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: ‏[LINE](/ar/channels/line)
  - Dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

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

جذر المستودع الاختياري المعروض في سطر Runtime ضمن system prompt. إذا لم يُضبط، يكتشفه OpenClaw تلقائياً عبر الصعود من مساحة العمل.

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
      { id: "locked-down", skills: [] }, // بدون Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضياً.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل القائمة غير الفارغة في `agents.list[].skills` المجموعة النهائية لذلك الوكيل؛
  ولا تُدمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap الخاصة بمساحة العمل في system prompt. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد اكتمال رد من المساعد) إعادة حقن bootstrap الخاص بمساحة العمل، مما يقلل حجم prompt. تظل عمليات Heartbeat وعمليات إعادة المحاولة بعد Compaction تعيد بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المحقونة عبر جميع ملفات bootstrap في مساحة العمل. الافتراضي: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: عدم حقن نص التحذير في system prompt مطلقاً.
- `"once"`: حقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (مستحسن).
- `"always"`: حقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة الحجم لـ prompt/السياق، وهي
مقسّمة عمداً حسب النظام الفرعي بدلاً من تمريرها جميعاً عبر إعداد
عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  التمهيد الأولي لمرة واحدة في `/new` و`/reset`، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت التشغيل المحدودة والكتل المملوكة لوقت التشغيل المحقونة.
- `memory.qmd.limits.*`:
  حجم مقتطفات البحث المفهرس في الذاكرة والحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في التمهيد الأولي عند أول دور، والمحقون في تشغيلات `/new` و`/reset`
العادية.

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

القيم الافتراضية المشتركة لأسطح سياق وقت التشغيل المحدودة.

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
  بيانات وصفية للاقتطاع وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عند
  حذف `lines`.
- `toolResultMaxChars`: الحد المستخدم لنتائج الأدوات الحية للنتائج
  المحفوظة واستعادة الفائض.
- `postCompactionMaxChars`: حد مقتطف `AGENTS.md` المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لإعدادات `contextLimits` المشتركة. ترث الحقول المحذوفة
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

الحد العام لقائمة Skills المضغوطة المحقونة في system prompt. لا
يؤثر هذا في قراءة ملفات `SKILL.md` عند الطلب.

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

أقصى حجم بالبكسل لأطول ضلع في الصورة ضمن كتل الصور في السجل/الأدوات قبل استدعاءات الموفّر.
الافتراضي: `1200`.

تؤدي القيم الأقل عادةً إلى تقليل استخدام vision-token وحجم حمولة الطلب في التشغيلات التي تكثر فيها لقطات الشاشة.
وتحافظ القيم الأعلى على قدر أكبر من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt ‏(وليست للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف عند عدم ضبطها.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. الافتراضي: `auto` ‏(تفضيل نظام التشغيل).

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

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يضبط نموذج السلسلة النموذج الأساسي فقط.
  - يضبط نموذج الكائن النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه إعداد نموذج الرؤية.
  - ويُستخدم أيضاً كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا حددت موفّراً/نموذجاً مباشرة، فاضبط أيضاً المصادقة/مفتاح API المطابق للموفّر (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا حُذف، فلا يزال `image_generate` قادراً على استنتاج موفّر افتراضي مدعوم بالمصادقة. حيث يجرّب أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الصور المسجلين بترتيب معرّف الموفّر.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الموسيقى المشتركة وأداة `music_generate` المدمجة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا حُذف، فلا يزال `music_generate` قادراً على استنتاج موفّر افتراضي مدعوم بالمصادقة. حيث يجرّب أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الموسيقى المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّراً/نموذجاً مباشرة، فاضبط أيضاً المصادقة/مفتاح API المطابق للموفّر.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الفيديو المشتركة وأداة `video_generate` المدمجة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا حُذف، فلا يزال `video_generate` قادراً على استنتاج موفّر افتراضي مدعوم بالمصادقة. حيث يجرّب أولاً الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الفيديو المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّراً/نموذجاً مباشرة، فاضبط أيضاً المصادقة/مفتاح API المطابق للموفّر.
  - يدعم موفّر توليد الفيديو المضمّن Qwen حتى فيديو خرج واحد، وصورة دخل واحدة، و4 مقاطع فيديو دخل، ومدة 10 ثوانٍ، وخيارات على مستوى الموفّر لـ `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائناً (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا حُذف، تعود أداة PDF إلى `imageModel`، ثم إلى نموذج الجلسة/النموذج الافتراضي الذي تم حله.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي بعين الاعتبار في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: بالتنسيق `provider/model` ‏(مثل `openai/gpt-5.4`). إذا حذفت الموفّر، يحاول OpenClaw أولاً اسماً مستعاراً، ثم مطابقة فريدة لموفّر مضبوط لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى الموفّر الافتراضي المضبوط (سلوك توافق قديم، لذا يُفضَّل `provider/model` الصريح). إذا لم يعد ذلك الموفّر يوفّر النموذج الافتراضي المضبوط، يعود OpenClaw إلى أول موفّر/نموذج مضبوط بدلاً من إظهار افتراضي قديم لموفّر تمت إزالته.
- `models`: فهرس النماذج المضبوطة وقائمة السماح الخاصة بـ `/model`. يمكن أن يتضمن كل إدخال `alias` ‏(اختصار) و`params` ‏(خاصة بالموفّر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معلمات الموفّر الافتراضية العامة المطبقة على جميع النماذج. تُضبط عند `agents.defaults.params` ‏(مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` ‏(في الإعدادات): يتم تجاوز `agents.defaults.params` ‏(الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` ‏(لكل نموذج)، ثم تتجاوزها `agents.list[].params` ‏(لدى معرّف الوكيل المطابق) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل الافتراضية منخفضة المستوى للوكلاء المضمّنين. استخدم `runtime: "auto"` للسماح لـ harnesses المسجلة من Plugin بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض harness ‏PI المدمج، أو معرّف harness مسجّل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- تحفظ أدوات كتابة الإعدادات التي تعدّل هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) نموذج الكائن القياسي وتحافظ على قوائم الاحتياطي الحالية متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في أي منفّذ منخفض المستوى يشغّل أدوار الوكيل المضمّن.
يجب أن تحتفظ معظم البيئات بالقيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصلياً، مثل harness
خادم تطبيق Codex المضمّن.

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

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف harness مسجّل من Plugin. يسجّل Plugin ‏Codex المضمّن `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. تُبقي `"pi"` harness ‏PI المدمج كخيار احتياطي للتوافق. وتجعل `"none"` اختيار harness المفقود أو غير المدعوم يفشل بدلاً من استخدام PI بصمت.
- تجاوزات البيئة: يقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الرجوع إلى PI لتلك العملية.
- لبيئات Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في harness الدردشة المضمّنة. بينما تظل توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS تستخدم إعدادات الموفّر/النموذج الخاصة بها.

**اختصارات alias المدمجة** (تنطبق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

| Alias               | النموذج                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تتغلب الأسماء المستعارة التي تضبطها دائماً على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائياً ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتفعّل نماذج Z.AI القيمة `tool_stream` افتراضياً لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
وتستخدم نماذج Anthropic Claude 4.6 التفكير `adaptive` افتراضياً عندما لا يكون هناك مستوى تفكير صريح مضبوط.

### `agents.defaults.cliBackends`

واجهات CLI اختيارية للتشغيلات الاحتياطية النصية فقط (من دون استدعاءات أدوات). مفيدة كخيار احتياطي عند فشل موفّري API.

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

- واجهات CLI الخلفية موجّهة للنص أولاً؛ وتكون الأدوات معطلة دائماً.
- تكون الجلسات مدعومة عند ضبط `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل system prompt الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم لكل وكيل ذات أولوية؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. وهو مفيد لتجارب prompt المضبوطة.

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

- `every`: سلسلة مدة (`ms/s/m/h`). الافتراضي: `30m` ‏(مصادقة مفتاح API) أو `1h` ‏(مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند ضبطه على false، يحذف قسم Heartbeat من system prompt ويتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطه على true، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إيقافه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل المباشرة. تسمح `allow` ‏(الافتراضي) بالتسليم المباشر المستهدف. بينما تمنع `block` التسليم المباشر المستهدف وتنتج `reason=dm-blocked`.
- `lightContext`: عند ضبطه على true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفاً وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند ضبطه على true، يعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نفس نمط العزل في Cron ‏`sessionTarget: "isolated"`. يقلل كلفة الرموز لكل Heartbeat من نحو 100 ألف إلى 2-5 آلاف رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **يشغَّل Heartbeat لهؤلاء الوكلاء فقط**.
- تشغّل Heartbeat أدوار وكلاء كاملة — لذا تؤدي الفواصل الأقصر إلى استهلاك مزيد من الرموز.

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

- `mode`: ‏`default` أو `safeguard` ‏(تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin موفّر Compaction مسجّل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفّر بدلاً من التلخيص المدمج المعتمد على LLM. ويعود إلى السلوك المدمج عند الفشل. يؤدي ضبط موفّر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` ‏(الافتراضي) أو `off` أو `custom`. تقوم `strict` بإضافة إرشادات مدمجة للاحتفاظ بالمعرّفات غير الشفافة أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. وعند عدم ضبطه أو عند ضبطه صراحةً على هذا الزوج الافتراضي، تُقبل أيضاً العناوين القديمة `Every Session`/`Safety` كاحتياط للتوافق القديم.
- `model`: تجاوز اختياري بصيغة `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج معيّن بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند ضبطه على `true`، يرسل إشعاراً موجزاً إلى المستخدم عند بدء Compaction ‏(على سبيل المثال "Compacting context..."). وهو معطّل افتراضياً للحفاظ على صمت Compaction.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. يتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

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

- يؤدي `mode: "cache-ttl"` إلى تفعيل تمريرات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن بعدها تشغيل التقليم مجدداً (بعد آخر لمسة للذاكرة المؤقتة).
- يقوم التقليم أولاً باقتطاع نتائج الأدوات الكبيرة اقتطاعاً ليناً، ثم بمسح نتائج الأدوات الأقدم مسحاً صارماً عند الحاجة.

**الاقتطاع اللين** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم اقتطاع/مسح كتل الصور أبداً.
- تعتمد النِّسب على عدد الأحرف (تقريبياً)، وليس على أعداد الرموز الدقيقة.
- إذا وُجدت رسائل مساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### بث الكتل

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتمكين الردود على شكل كتل.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` ‏(ومتغيرات كل حساب). تستخدم Signal/Slack/Discord/Google Chat افتراضياً `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. وتعني `natural` = ‏800–2500ms. التجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التجزئة.

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المذكور فيها البوت.
- تجاوزات كل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

العزل الاختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بـ SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد الواجهة الخلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH ‏(الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: إعدادات سياسة مفاتيح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- تُحل القيم `*Data` المدعومة بـ SecretRef من لقطة وقت التشغيل النشطة للأسرار قبل بدء جلسة Sandbox

**سلوك الواجهة الخلفية SSH:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يحافظ على مساحة عمل SSH البعيدة بوصفها الحالة القياسية
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة تلقائياً إلى المضيف
- لا يدعم حاويات متصفح Sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل Sandbox بحسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تُركَّب مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد Plugin ‏OpenShell:**

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

- `mirror`: يزرع البعيد من المحلي قبل `exec`، ثم يزامن العودة بعد `exec`؛ وتبقى مساحة العمل المحلية هي الحالة القياسية
- `remote`: يزرع البعيد مرة واحدة عند إنشاء Sandbox، ثم يحافظ على مساحة العمل البعيدة بوصفها الحالة القياسية

في وضع `remote`، لا تُزامن تعديلات المضيف المحلية التي تتم خارج OpenClaw تلقائياً إلى Sandbox بعد خطوة الزرع.
يكون النقل عبر SSH إلى Sandbox الخاص بـ OpenShell، لكن Plugin يمتلك دورة حياة Sandbox ومزامنة mirror الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكي وجذر قابل للكتابة ومستخدم root.

**تستخدم الحاويات افتراضياً `network: "none"`** — اضبطها على `"bridge"` ‏(أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يُحظر `"host"`. ويُحظر `"container:<id>"` افتراضياً ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ‏(وضع طارئ).

تُجهَّز **المرفقات الواردة** ضمن `media/inbound/*` في مساحة العمل النشطة.

يقوم **`docker.binds`** بتركيب أدلة مضيف إضافية؛ ويتم دمج bind العامة وتلك الخاصة بكل وكيل.

**متصفح Sandbox** ‏(`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم حقن عنوان URL الخاص بـ noVNC في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضياً، ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلاً من كشف كلمة المرور في عنوان URL المشترك).

- يؤدي `allowHostControl: false` ‏(الافتراضي) إلى حظر الجلسات المعزولة من استهداف متصفح المضيف.
- القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` ‏(شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عاماً.
- يقيّد `cdpSourceRange` اختيارياً دخول CDP عند حافة الحاوية إلى نطاق CIDR ‏(على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة مضيف إضافية في حاوية متصفح Sandbox فقط. وعند ضبطه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرّف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وتُضبط لبيئات الحاويات:
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
  - `--disable-extensions` ‏(مفعّل افتراضياً)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضياً، ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عند تفعيل `noSandbox`.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير القيم الافتراضية للحاوية.

</Accordion>

يقتصر عزل المتصفح و`sandbox.docker.binds` على Docker فقط.

أنشئ الصور:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` ‏(تجاوزات لكل وكيل)

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
- `default`: عند ضبط أكثر من واحد، يفوز الأول (مع تسجيل تحذير). وإذا لم يُضبط أيٌّ منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز نموذج السلسلة `primary` فقط؛ بينما يتجاوز نموذج الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل القيم الاحتياطية العامة). وتظل مهام Cron التي تتجاوز `primary` فقط ترث القيم الاحتياطية الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات بث لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتحل القائمة الصريحة محل القيم الافتراضية بدلاً من الدمج، وتعني `[]` عدم وجود أي Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: مستوى رؤية reasoning الافتراضي الاختياري لكل وكيل (`on | off | stream`). ويُطبّق عندما لا يكون هناك تجاوز reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لكل وكيل للوضع السريع (`true | false`). وتُطبّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد يعمل مع Codex فقط بينما يحتفظ الوكلاء الآخرون بالرجوع الافتراضي إلى PI.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية لـ `runtime.acp` ‏(`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل جلسات ACP harness افتراضياً.
- `identity.avatar`: مسار نسبي لمساحة العمل، أو عنوان URL ‏`http(s)`، أو URI من نوع `data:`.
- تستخلص `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء من أجل `sessions_spawn` ‏(`["*"]` = أي وكيل؛ والافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب داخل Sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل من دون Sandbox.
- `subagents.requireAgentId`: عند ضبطه على true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` ‏(يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [متعدد الوكلاء](/ar/concepts/multi-agent).

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

- `type` ‏(اختياري): ‏`route` للتوجيه العادي (والنوع المفقود يعود افتراضياً إلى route)، و`acp` لارتباطات محادثات ACP الدائمة.
- `match.channel` ‏(مطلوب)
- `match.accountId` ‏(اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` ‏(اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` ‏(اختياري؛ خاص بالقناة)
- `acp` ‏(اختياري؛ فقط لـ `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` ‏(مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` ‏(على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding أعلاه.

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

راجع [Sandbox والأدوات في بيئة متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

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
  - `per-sender` ‏(الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق القناة.
  - `global`: يشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصوداً).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (مستحسن لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (مستحسن لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القياسية بالنظراء ذوي بادئة الموفّر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. تعيد `daily` التعيين عند `atHour` حسب التوقيت المحلي؛ وتعاد `idle` بعد `idleMinutes`. وعند ضبط الاثنين معاً، يفوز ما تنتهي صلاحيته أولاً.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى المسموح به لـ `totalTokens` في الجلسة الأصل عند إنشاء جلسة خيط متشعبة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلاً من وراثة سجل transcript الخاص بالأصل.
  - اضبط `0` لتعطيل هذا الحاجز والسماح دائماً بالتشعب من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائماً `"main"` لدلو الدردشة المباشرة الرئيسي.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، المجال: `0`–`5`). تؤدي القيمة `0` إلى تعطيل تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` ‏(`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. ويفوز أول رفض.
- **`maintenance`**: عناصر تحكم تنظيف + الاحتفاظ بمخزن الجلسات.
  - `mode`: تؤدي `warn` إلى إطلاق تحذيرات فقط؛ بينما تطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` ‏(الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات transcript ذات الصيغة `*.reset.<timestamp>`. وتعود افتراضياً إلى `pruneAfter`؛ واضبط `false` لتعطيلها.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولاً.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. وتعود افتراضياً إلى `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفّرين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: القيمة الافتراضية لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` للتعطيل؛ ويمكن للموفّرين تجاوزها)
  - `maxAgeHours`: القيمة الافتراضية للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل؛ ويمكن للموفّرين تجاوزها)

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

التجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

آلية الحل (الأكثر تحديداً يفوز): الحساب → القناة → العام. تؤدي `""` إلى التعطيل وإيقاف التسلسل. وتستخرج `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | المثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر       | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم الموفّر          | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`, `low`, `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسماً بديلاً لـ `{thinkingLevel}`.

### تفاعل التأكيد

- يعود افتراضياً إلى `identity.emoji` الخاص بالوكيل النشط، وإلا إلى `"👀"`. اضبط `""` لتعطيله.
- التجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الاحتياطي من الهوية.
- النطاق: `group-mentions` ‏(الافتراضي) أو `group-all` أو `direct` أو `all`.
- يزيل `removeAckAfterReply` تفاعل التأكيد بعد الرد في Slack وDiscord وTelegram.
- يؤدي `messages.statusReactions.enabled` إلى تفعيل تفاعلات الحالة الدورية في Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي عدم الضبط إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات الحالة الدورية.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فوراً. وتتجاوز أوامر التحكم إزالة الارتداد.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن للأمر `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلاً افتراضياً؛ وتعود القيمة الافتراضية لـ `modelOverrides.allowProvider` إلى `false` ‏(اشتراك اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية OpenAI الخاصة بـ TTS. وترتيب الحل هو: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست تابعة لـ OpenAI، يتعامل OpenClaw معها كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن تطابق `talk.provider` مفتاحاً في `talk.providers` عند ضبط عدة موفّرين لـ Talk.
- مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصّصة للتوافق فقط، وتُرحّل تلقائياً إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات احتياطياً إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- تقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق الاحتياطي `ELEVENLABS_API_KEY` فقط عندما لا يكون مفتاح API الخاص بـ Talk مضبوطاً.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل أن يرسل transcript. وعند عدم ضبطه، يحتفظ بنافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية onboarding المحلية الإعدادات المحلية الجديدة افتراضياً على `tools.profile: "coding"` عند عدم الضبط (مع الحفاظ على ملفات التعريف الصريحة الحالية).

| ملف التعريف     | يتضمن                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                       |
| `full`      | بلا تقييد (مثل عدم الضبط)                                                                                                  |

### مجموعات الأدوات

| المجموعة              | الأدوات                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec` و`process` و`code_execution` ‏(`bash` مقبول كاسم بديل لـ `exec`)                                         |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get`                                                                                           |
| `group:web`        | `web_search` و`x_search` و`web_fetch`                                                                                   |
| `group:ui`         | `browser` و`canvas`                                                                                                     |
| `group:automation` | `cron` و`gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts`                                                                      |
| `group:openclaw`   | جميع الأدوات المدمجة (باستثناء إضافات الموفّر)                                                                          |

### `tools.allow` / `tools.deny`

سياسة السماح/الرفض العامة للأدوات (الرفض يفوز). غير حساسة لحالة الأحرف، وتدعم محارف البدل `*`. وتُطبّق حتى عندما يكون Docker sandbox معطلاً.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقيّد الأدوات أكثر لموفّرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف الموفّر → السماح/الرفض.

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

يتحكم في وصول exec المرتفع خارج Sandbox:

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

- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا أن يفرض مزيداً من التقييد.
- يخزّن `/elevated on|off|ask|full` الحالة لكل جلسة؛ بينما تنطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل ويستخدم مسار الهروب المضبوط (`gateway` افتراضياً، أو `node` عندما يكون هدف exec هو `node`).

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

فحوصات الأمان الخاصة بحلقات الأدوات تكون **معطلة افتراضياً**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات على المستوى العام في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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

- `historySize`: الحد الأقصى لسجل استدعاءات الأدوات المحتفَظ به لتحليل الحلقات.
- `warningThreshold`: عتبة نمط التكرار من دون تقدم لإطلاق التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل من دون تقدم.
- `detectors.genericRepeat`: التحذير من تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
- `detectors.knownPollNoProgress`: التحذير/الحظر لأدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: التحذير/الحظر لأنماط الأزواج المتناوبة من دون تقدم.
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

يضبط فهم الوسائط الواردة (الصورة/الصوت/الفيديو):

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

- `provider`: معرّف موفّر API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq`، وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المطلوب تشغيله
- `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}`، وما إلى ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` → صورة، و`google` → صورة+صوت+فيديو، و`groq` → صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود حالات الفشل إلى الإدخال التالي.

تتبع مصادقة الموفّر الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عند ضبطه على `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة التسليم المباشر إلى القناة أولاً. الافتراضي: `false`
  (مسار التنبيه/تسليم النموذج القديم لجلسة الطالب).

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

الافتراضي: `tree` ‏(الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

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
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد يشمل مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. وما زال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- قيد Sandbox: عندما تكون الجلسة الحالية داخل Sandbox وتكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض القيمة `tree` على الرؤية حتى لو كانت `tools.sessions.visibility="all"`.

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
- تُجسّد الملفات في مساحة العمل الفرعية عند `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يُحجب محتوى المرفقات تلقائياً من حفظ transcript.
- يتم التحقق من مدخلات Base64 بفحوصات صارمة للأبجدية/الحشو مع حاجز لحجم ما قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: حيث يؤدي `delete` دائماً إلى إزالة المرفقات؛ بينما يحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

إشارات الأدوات المدمجة التجريبية. تكون معطلة افتراضياً ما لم تُطبّق قاعدة تمكين تلقائي صارمة للوكيل في GPT-5.

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

- `planTool`: يفعّل أداة `update_plan` المهيكلة التجريبية لتتبع الأعمال غير البسيطة متعددة الخطوات.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` ‏(أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` لتشغيل OpenAI أو OpenAI Codex من عائلة GPT-5. اضبط `true` لفرض تشغيل الأداة خارج هذا النطاق، أو `false` لإبقائها معطلة حتى في تشغيلات GPT-5 الصارمة الوكيلية.
- عند التفعيل، يضيف system prompt أيضاً إرشادات استخدام حتى لا يستخدمها النموذج إلا للأعمال الجوهرية، مع الإبقاء على خطوة واحدة فقط بحالة `in_progress` كحد أقصى.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لـ `sessions_spawn` عندما لا يضبط وكيل الطالب قيمة `subagents.allowAgents` الخاصة به (`["*"]` = أي وكيل؛ والافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المدمج. أضف موفّرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- تجاوز جذر إعدادات الوكيل عبر `OPENCLAW_AGENT_DIR` ‏(أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير بيئة).
- أسبقية الدمج لمعرّفات الموفّرين المتطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفّر مُداراً عبر SecretRef في سياق الإعدادات/ملف المصادقة الحالي.
  - تُحدَّث قيم `apiKey` الخاصة بالموفّرين المُدارين عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec) بدلاً من حفظ الأسرار المحلولة.
  - تُحدَّث قيم رؤوس الموفّرين المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة الخاصة بالوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيم المتطابقة للنموذج `contextWindow`/`maxTokens` القيمة الأعلى بين الإعدادات الصريحة وقيم الفهرس الضمنية.
  - يحافظ `contextTokens` للنموذج المتطابق على حد وقت تشغيل صريح عند وجوده؛ استخدمه لتقييد السياق الفعلي من دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - حفظ العلامات يعتمد على المصدر بوصفه صاحب الحقيقة: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول الموفّر

- `models.mode`: سلوك فهرس الموفّرين (`merge` أو `replace`).
- `models.providers`: خريطة الموفّرين المخصصين مفهرسة بحسب معرّف الموفّر.
- `models.providers.*.api`: محوّل الطلبات (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai`، وما إلى ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد الموفّر (ويُفضَّل استخدام SecretRef/الاستبدال عبر البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في رأس `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API المصدر.
- `models.providers.*.headers`: رؤوس ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفّر النموذج.
  - `request.headers`: رؤوس إضافية (تُدمج مع القيم الافتراضية للموفّر). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` ‏(استخدام المصادقة المدمجة للموفّر)، و`"authorization-bearer"` ‏(مع `token`)، و`"header"` ‏(مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` ‏(استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` ‏(مع `url`). ويقبل الوضعان كائناً فرعياً اختيارياً `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` ‏(كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عند ضبطه على `true`، يسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حاجز جلب HTTP الخاص بالموفّر (اشتراك اختياري من المشغّل لنقاط نهاية OpenAI-compatible ذاتية الاستضافة الموثوقة). ويستخدم WebSocket الكائن `request` نفسه للرؤوس/TLS لكن ليس حاجز SSRF الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس النماذج الصريحة الخاصة بالموفّر.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة سياق النموذج الأصلية.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (`host` ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. بينما يُبقي `baseUrl` الفارغ/المحذوف سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة OpenAI-compatible التي تقبل النصوص فقط. وعند ضبطه على `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف الموفّر من أجل اكتشاف موجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الخرج للنماذج المكتشفة.

### أمثلة على الموفّرين

<Accordion title="Cerebras ‏(GLM 4.6 / 4.7)">

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

استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ واستخدم `zai/glm-4.7` مع Z.AI مباشرة.

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

اضبط `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لفهرس Zen أو المراجع `opencode-go/...` لفهرس Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI ‏(GLM-4.7)">

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

اضبط `ZAI_API_KEY`. ويُقبل كل من `z.ai/*` و`z-ai/*` كأسماء بديلة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف موفّراً مخصصاً مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI ‏(Kimi)">

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

تعلن نقاط نهاية Moonshot الأصلية توافق استخدام البث على النقل المشترك
`openai-completions`، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف الموفّر المدمج وحده.

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

متوافق مع Anthropic، وهو موفّر مدمج. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic ‏(متوافق مع Anthropic)">

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

يجب أن يحذف `baseUrl` المسار `/v1` ‏(لأن عميل Anthropic يضيفه). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 ‏(مباشر)">

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
يفترض فهرس النماذج القيمة M2.7 فقط.
في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax
افتراضياً ما لم تضبط `thinking` بنفسك صراحةً. ويعيد `/fast on` أو
`params.fastMode: true` كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجاً محلياً كبيراً عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة كاحتياط.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمّنة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عند ضبطه على true، يفضّل مثبّتات Homebrew عندما تكون `brew` متاحة
  قبل الرجوع إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعرّف متغير بيئة أساسي (سلسلة نصية صريحة أو كائن SecretRef).

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف إضافات OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (تُحمَّل فقط الإضافات المدرجة). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core الخطاف `before_prompt_build` ويتجاهل الحقول المعدِّلة للـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على خطافات Plugin الأصلية وأدلة الخطافات التي توفّرها الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً في هذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية للأهداف القياسية `provider/model` الخاصة بتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمداً السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (ويُتحقق منه عبر مخطط Plugin الأصلي لـ OpenClaw عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفّر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl ‏(يقبل SecretRef). ويعود احتياطياً إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان API الأساسي لـ Firecrawl ‏(الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر الذاكرة المؤقتة بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تفعيل موفّر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضياً).
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- يوجد إعداد الذاكرة الكامل في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضاً لإضافات حزم Claude المفعّلة أن تساهم في القيم الافتراضية المضمّنة لـ Pi من `settings.json`؛ ويطبّق OpenClaw هذه القيم كإعدادات وكيل مُنقّاة، وليس كتصحيحات إعدادات خام لـ OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل إضافات الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin لمحرك السياق النشط؛ ويكون الافتراضي `"legacy"` ما لم تثبت وتحدد محركاً آخر.
- `plugins.installs`: بيانات تعريف تثبيت يديرها CLI ويستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` بوصفها حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

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
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عند عدم ضبطه، لذلك يبقى تنقل Browser صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً في تنقل Browser داخل الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة attach-only ‏(بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`؛ واستخدم WS(S)
  عندما يوفّر لك المزوّد عنوان DevTools WebSocket مباشراً.
- تكون ملفات تعريف `existing-session` مخصصة للمضيف فقط وتستخدم Chrome MCP بدلاً من CDP.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف
  ملف تعريف محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بقيود مسار Chrome MCP الحالية:
  إجراءات معتمدة على اللقطة/المرجع بدلاً من الاستهداف عبر CSS selector، وخطافات رفع ملف واحد،
  ومن دون تجاوزات لمهلة الحوارات، ومن دون `wait --load networkidle`،
  أو `responsebody`، أو تصدير PDF، أو اعتراض التنزيل، أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة القيمتين `cdpPort` و`cdpUrl` تلقائياً؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` إشارات تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحديد حجم النافذة أو إشارات التصحيح).

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

- `seamColor`: لون التمييز لعناصر واجهة التطبيق الأصلية (مثل تلوين فقاعة Talk Mode، وما إلى ذلك).
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

- `mode`: ‏`local` ‏(تشغيل Gateway) أو `remote` ‏(الاتصال بـ Gateway بعيد). ويرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **أسماء bind البديلة القديمة**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس أسماء host البديلة (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع Docker bridge networking ‏(`-p 18789:18789`) تصل الحركة إلى `eth0`، لذلك يصبح Gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` ‏(أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضياً. وتتطلب قيم bind غير loopback مصادقة Gateway. وعملياً يعني ذلك رمزاً مميزاً/كلمة مرور مشتركة أو reverse proxy مدركاً للهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج onboarding رمزاً مميزاً افتراضياً.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مضبوطين ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح من دون مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا الوضع غير معروض عمداً في مطالبات onboarding.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy مدرك للهوية واثق برؤوس الهوية من `gateway.trustedProxies` ‏(راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). ويتوقع هذا الوضع مصدراً proxy **غير loopback**؛ ولا تستوفي reverse proxyات loopback على المضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عند ضبطه على `true`، يمكن لرؤوس هوية Tailscale Serve استيفاء مصادقة Control UI/WebSocket ‏(تم التحقق منها عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة رؤوس Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي لـ Gateway بدلاً من ذلك. ويفترض هذا التدفق من دون رمز مميز أن مضيف Gateway موثوق. وتكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. ويُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز بشكل مستقل). وتعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن لـ Tailscale Serve، تُسلسَل المحاولات الفاشلة للقيمة نفسها `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدِّد في الطلب الثاني بدلاً من مرور الطلبين كعدم تطابق عادي.
  - تعود القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` إلى `true`؛ اضبطها على `false` عندما تريد عمداً أيضاً فرض التحديد على حركة localhost (لإعدادات الاختبار أو عمليات نشر proxy الصارمة).
- تُخفَّض دائماً محاولات مصادقة WS ذات الأصل browser-origin مع تعطيل إعفاء loopback (كإجراء دفاعي إضافي ضد هجمات brute force على localhost من المتصفح).
- على loopback، تُعزل حالات القفل ذات الأصل browser-origin لكل قيمة `Origin`
  مطبَّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائياً
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(ضمن tailnet فقط، مع bind loopback) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول browser-origin لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الاحتياط إلى أصل Host-header لعمليات النشر التي تعتمد عمداً على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` ‏(الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن تكون `remote.url` بصيغة `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باستخدام `ws://` النصي مع عناوين IP موثوقة ضمن الشبكة الخاصة؛ بينما يبقى الافتراضي مقتصراً على loopback فقط للاتصالات النصية.
- `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد للعميل البعيد. وهما لا يضبطان مصادقة Gateway بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لـ APNs relay الخارجي المستخدم من قِبل إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في بنية iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى relay بالميلي ثانية. والافتراضي هو `10000`.
- تُفوَّض التسجيلات المدعومة بـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن القيمة `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرّر تفويض إرسال ضمن نطاق التسجيل إلى Gateway. ولا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج طوارئ مخصص للتطوير لعناوين relay من نوع loopback HTTP. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: الفاصل الزمني لمراقبة صحة القناة بالدقائق. اضبط `0` لتعطيل إعادة التشغيل الخاصة بمراقبة الصحة على مستوى العالم. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. حافظ على كونها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: اشتراك اختياري للإلغاء على مستوى القناة لإعادات تشغيل مراقبة الصحة مع إبقاء المراقب العام مفعلاً.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند ضبطه، تكون له الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كاحتياط فقط عندما لا تكون `gateway.auth.*` مضبوطة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` مضبوطة صراحةً عبر SecretRef ولكن لم يتم حلها، يفشل الحل بشكل مغلق (من دون احتياط بعيد يخفي الحالة).
- `trustedProxies`: عناوين IP الخاصة بـ reverse proxy التي تنهي TLS أو تحقن رؤوس العميل المُمرَّر. أدرج فقط الوكلاء الذين تتحكم فيهم. وتظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (على سبيل المثال Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند ضبطه على `true`، يقبل Gateway القيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. والافتراضي `false` لسلوك فشل مغلق.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لاستدعاء HTTP ‏`POST /tools/invoke` ‏(تمدد قائمة الرفض الافتراضية).
- `gateway.tools.allow`: يزيل أسماء الأدوات من قائمة الرفض الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضياً. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية مدخلات URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- رأس تقوية اختياري للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` ‏(اضبطه فقط لأصول HTTPS التي تتحكم فيها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateway على مضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

إشارات مريحة: `--dev` ‏(تستخدم `~/.openclaw-dev` + المنفذ `19001`) و`--profile <name>` ‏(تستخدم `~/.openclaw-<name>`).

راجع [Gateway متعددة](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) ‏(الافتراضي: `false`).
- `autoGenerate`: يولّد تلقائياً زوج شهادة/مفتاح محلي موقّع ذاتياً عندما لا تكون الملفات الصريحة مضبوطة؛ للاستخدام المحلي/التطويري فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ وحافظ على تقييد أذوناته.
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
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائماً عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` ‏(الافتراضي): حاول أولاً إعادة التحميل السريع؛ ثم ارجع إلى إعادة التشغيل عند الحاجة.
- `debounceMs`: نافذة إزالة الارتداد بالميلي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى للوقت بالميلي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway المميز.
- لا يمكن أن تكون `hooks.path` هي `/`؛ استخدم مساراً فرعياً مخصصاً مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).

**نقاط النهاية:**

- `POST /hooks/wake` ← `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا تُقبل القيمة `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` ‏(الافتراضي: `false`).
- `POST /hooks/<name>` ← يتم حله عبر `hooks.mappings`

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` ‏(مثل `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلاً في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مساراً نسبياً ويبقى ضمن `hooks.transformsDir` (وتُرفض المسارات المطلقة وعمليات الاجتياز).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، و`[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمتصلّي `/hooks/agent` بتعيين `sessionKey` ‏(الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات الخاصة بقيم `sessionKey` الصريحة (في الطلب + التعيين)، مثل `["hook:"]`.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل من hook ‏(ويجب أن يكون مسموحاً به إذا كان فهرس النموذج مضبوطاً).

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

- يبدأ Gateway تلقائياً تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطاً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلاً إلى جانب Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: احتفظ بـ `gateway.bind: "loopback"` ‏(الافتراضي).
- مع قيم bind غير loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثل بقية أسطح HTTP الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً رؤوس المصادقة؛ وبعد إقران node واتصاله، يعلن Gateway عناوين URL لقدرات ضمن نطاق node للوصول إلى canvas/A2UI.
- ترتبط عناوين URL الخاصة بالقدرات بجلسة WS النشطة لـ node وتنتهي صلاحيتها بسرعة. ولا يُستخدم الاحتياط المعتمد على IP.
- يحقن عميل live-reload في HTML المقدمة.
- ينشئ تلقائياً ملف `index.html` ابتدائياً عند الفراغ.
- يقدّم أيضاً A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل live reload للأدلة الكبيرة أو عند ظهور أخطاء `EMFILE`.

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

- `minimal` ‏(الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يعود اسم المضيف افتراضياً إلى `openclaw`. وتجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال ضمن `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، اقترنه مع خادم DNS ‏(ويُوصى بـ CoreDNS) + DNS مجزأ في Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات البيئة المضمّنة)

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
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` ‏(ولا يطغى أي منهما على المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف profile الخاص بصدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### استبدال متغيرات البيئة

أشِر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى إطلاق خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب إلى `${VAR}` حرفياً.
- يعمل ذلك مع `$include`.

---

## الأسرار

تُعد مراجع الأسرار إضافةً تراكمية: ما زالت القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكلاً واحداً للكائن:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` مع `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط `id` مع `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار محددة بشرطة مائلة من نوع `.` أو `..` ‏(على سبيل المثال يُرفض `a/../b`)

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

- يدعم موفّر `file` الوضعين `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن تكون `id` هي `"value"` في وضع singleValue).
- يتطلب موفّر `exec` مسار `command` مطلقاً ويستخدم حمولات البروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضياً. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` مضبوطاً، فسيُطبّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة الابن في `exec` محدودة افتراضياً؛ ومرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- يُطبّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

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

- تُخزَّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم ملفات تعريف وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة وقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- عمليات استيراد OAuth القديمة تأتي من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف التعريف بسبب أخطاء حقيقية
  في الفوترة/عدم كفاية الرصيد (الافتراضي: `5`). ولا يزال من الممكن أن
  يقع نص الفوترة الصريح هنا حتى في استجابات `401`/`403`، لكن
  تبقى مطابقات النص الخاصة بكل موفّر ضمن نطاق الموفّر الذي يملكها (على سبيل المثال OpenRouter
  ‏`Key limit exceeded`). وتبقى رسائل نوافذ الاستخدام القابلة لإعادة المحاولة عبر HTTP `402`
  أو رسائل حدود الإنفاق على المؤسسة/مساحة العمل ضمن مسار `rate_limit`
  بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفّر لساعات التراجع الخاصة بالفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: النافذة المتحركة بالساعات المستخدمة لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملفات تعريف المصادقة ضمن الموفّر نفسه لأخطاء الحمل الزائد قبل الانتقال إلى الاحتياطي على مستوى النموذج (الافتراضي: `1`). وتقع هنا أشكال انشغال الموفّر مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير ملف تعريف/موفّر محمّل أكثر من اللازم (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملفات تعريف المصادقة ضمن الموفّر نفسه لأخطاء تحديد المعدل قبل الانتقال إلى الاحتياطي على مستوى النموذج (الافتراضي: `1`). ويتضمن ذلك مستودع تحديد المعدل نصوصاً على شكل موفّر مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- ترتفع قيمة `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبح عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = ‏500 ميغابايت). استخدم تدوير السجلات الخارجي لعمليات النشر الإنتاجية.

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

- `enabled`: المفتاح الرئيسي لإخراج أدوات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الإشارات التي تفعّل مخرجات السجل الموجّهة (وتدعم محارف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالميلي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل خط تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL الخاص بالمجمّع لتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` ‏(الافتراضي) أو `"grpc"`.
- `otel.headers`: رؤوس بيانات وصفية إضافية لـ HTTP/gRPC تُرسَل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الأثر أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ العينات للأثر من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ telemetry الدوري بالميلي ثانية.
- `cacheTrace.enabled`: يسجل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الخرج لملف JSONL الخاص بتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يُضمَّن في خرج تتبع الذاكرة المؤقتة (جميعها افتراضياً: `true`).

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

- `channel`: قناة الإصدار لعمليات تثبيت npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway ‏(الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لعمليات تثبيت الحِزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية لقناة stable بالساعات (الافتراضي: `12`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP ‏(الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق Plugin وقت تشغيل ACP مسجلاً).
- `defaultAgent`: معرّف وكيل هدف احتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفاً صريحاً.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الكتلة قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأداة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يقوم `"live"` بالبث تدريجياً؛ بينما يقوم `"final_only"` بالتخزين المؤقت حتى أحداث إنهاء الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر الحالة/التحديث المعروضة الخاصة بـ ACP.
- `stream.tagVisibility`: سجل يربط أسماء الوسوم بتجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعُمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي:
  - `"random"` ‏(الافتراضي): عبارات فرعية دوّارة مضحكة/موسمية.
  - `"default"`: عبارة فرعية محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: من دون نص عبارة فرعية (مع استمرار عرض عنوان الشعار/الإصدار).
- لإخفاء الشعار بالكامل (وليس العبارات الفرعية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

راجع حقول الهوية في `agents.list` ضمن [القيم الافتراضية للوكلاء](#agent-defaults).

---

## Bridge ‏(قديم، أُزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءاً من مخطط الإعدادات (وسيفشل التحقق حتى تُزال؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعداد bridge القديم (مرجع تاريخي)">

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

- `sessionRetention`: المدة التي يجب الاحتفاظ خلالها بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. وتتحكم أيضاً في تنظيف أرشيفات نصوص Cron المحذوفة. الافتراضي: `24h`؛ اضبط `false` لتعطيله.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفَظ بها عند تفعيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer يُستخدم لتسليم POST إلى Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل أي رأس مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook ‏(http/https) يُستخدم فقط للمهام المخزّنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للمهام أحادية التنفيذ عند حدوث أخطاء عابرة (الافتراضي: `3`؛ المجال: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالميلي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تفعّل إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة مع جميع الأنواع العابرة.

ينطبق هذا فقط على مهام Cron أحادية التنفيذ. أما المهام المتكررة فتستخدم معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات الفشل لمهام Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالميلي ثانية بين التنبيهات المتكررة لنفس المهمة (عدد صحيح غير سالب).
- `mode`: وضع التسليم — تقوم `"announce"` بالإرسال عبر رسالة قناة؛ بينما تقوم `"webhook"` بالنشر إلى Webhook المضبوط.
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
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. وتقوم `"last"` بإعادة استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ Webhook. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- تتجاوز `delivery.failureDestination` الخاصة بكل مهمة هذا الافتراضي العام.
- عندما لا تكون وجهة الفشل العامة ولا وجهة الفشل الخاصة بكل مهمة مضبوطة، تعود المهام التي تسلّم بالفعل عبر `announce` عند الفشل إلى هدف announce الأساسي نفسه.
- لا تكون `delivery.failureDestination` مدعومة إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). وتُتتبّع عمليات تنفيذ Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قوالب نماذج الوسائط

العناصر النائبة للقوالب التي يتم توسيعها في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | pseudo-URL للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | النص المفرغ للصوت                                  |
| `{{Prompt}}`       | Prompt الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد)               |
| `{{SenderName}}`   | الاسم المعروض للمرسل (أفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (أفضل جهد)                 |
| `{{Provider}}`     | تلميح الموفّر (whatsapp أو telegram أو discord، إلخ.) |

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
- مصفوفة ملفات: تُدمج بعمق حسب الترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
