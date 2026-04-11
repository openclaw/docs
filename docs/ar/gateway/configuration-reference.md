---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو البوابة أو الأداة
summary: مرجع إعدادات البوابة لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-11T02:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32acb82e756e4740d13ef12277842081f4c90df7b67850c34f8a76701fcd37d0
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسية لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية، وتضع روابط خارجية عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/الـ plugins أو كل إعدادات الذاكرة/QMD العميقة في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالحزم المضمّنة/الـ plugins/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) من أجل `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/ar/tools/slash-commands) من أجل فهرس الأوامر الحالي المضمّن + المجمّع
- صفحات القنوات/الـ plugins المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يُسمح بالتعليقات والفواصل الختامية). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يكون قسم إعداداتها موجودًا (إلا إذا كان `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك |
| -------------------- | ------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist` | يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو مخزن السماح المقترن) |
| `open` | السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled` | تجاهل جميع الرسائل الخاصة الواردة |

| سياسة المجموعة | السلوك |
| -------------- | ------- |
| `allowlist` (الافتراضي) | تُسمح فقط للمجموعات المطابقة لقائمة السماح المُعدّة |
| `open` | تجاوز قوائم السماح للمجموعات (مع استمرار تطبيق شرط الإشارة) |
| `disabled` | حظر جميع رسائل المجموعات/الغرف |

<Note>
يحدد `channels.defaults.groupPolicy` السياسة الافتراضية عندما لا تكون `groupPolicy` الخاصة بموفر ما معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدّ عدد طلبات اقتران الرسائل الخاصة المعلّقة إلى **3 لكل قناة**.
إذا كانت كتلة الموفر مفقودة بالكامل (أي `channels.<provider>` غير موجودة)، فستعود سياسة المجموعة وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المُعدّة. ويُطبَّق تعيين القناة عندما لا تكون للجلسة بالفعل قيمة تجاوز للنموذج (على سبيل المثال، مُعيّنة عبر `/model`).

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

### القيم الافتراضية للقنوات والنبض

استخدم `channels.defaults` من أجل سلوك سياسة المجموعات والنبض المشترك بين الموفرين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما لا تكون `groupPolicy` على مستوى الموفر معيّنة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق الإضافي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلاسل/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في خرج النبض.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في خرج النبض.
- `channels.defaults.heartbeat.useIndicator`: عرض خرج نبض مضغوط بأسلوب المؤشر.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في البوابة (Baileys Web). ويبدأ تلقائيًا عندما توجد جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فسيُستخدم أول معرّف حساب مُعدّ (بعد الفرز).
- يتيح `channels.whatsapp.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مُعدّ.
- يقوم `openclaw doctor` بترحيل دليل مصادقة Baileys القديم ذي الحساب الواحد إلى `whatsapp/default`.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع استخدام `TELEGRAM_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- يتيح `channels.telegram.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- في إعدادات الحسابات المتعددة (وجود معرفي حسابات أو أكثر)، عيّن قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما تكون هذه القيمة مفقودة أو غير صالحة.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيل معرّفات المجموعات الفائقة، وأوامر `/config set|unset`).
- تُهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). تتم مشاركة دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram `sendMessage` + `editMessageText` (وتعمل في الدردشات المباشرة ودردشات المجموعات).
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

- الرمز المميز: `channels.discord.token`، مع استخدام `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` خاصًا بـ Discord ذلك الرمز المميز لهذا الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مستمدة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يتيح `channels.discord.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة guild) كأهداف للتسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة للـ guilds بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي يكتبها البوت افتراضيًا. يفعّل `allowBots: true` هذه الرسائل؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائله الخاصة).
- يقوم `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) بإسقاط الرسائل التي تذكر مستخدمًا أو دورًا آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` (الافتراضي 17) بتقسيم الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لتفعيل الإنشاء/الربط التلقائي للسلاسل في `sessions_spawn({ thread: true })`
- تُهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). تتم مشاركة دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يحدد `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية مع تجاوزات اختيارية للانضمام التلقائي وTTS.
- يمرّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (والقيمان الافتراضيتان هما `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة صوتية وإعادة الانضمام إليها بعد تكرار إخفاقات فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع البث القياسي. ويتم ترحيل `streamMode` القديم وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` التوفر في وقت التشغيل بحالة حضور البوت (سليم => online، متدهور => idle، مستنزف => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين المطابقة القابلة للتغيير للاسم/الوسم (وضع توافق للكسر الزجاجي).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتخويل المعتمدين.
  - `enabled`: يمكن أن تكون `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. ويعود احتياطيًا إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (تطابق جزئي أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل الخاصة للمعتمدين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين معًا. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل المعتمدين الذين تم حلهم.
  - `cleanupAfterResolve`: عند تعيينها إلى `true`، تحذف الرسائل الخاصة الخاصة بالموافقات بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (بدون)، `own` (رسائل البوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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

- JSON لحساب الخدمة: مضمن (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- المتغيرات الاحتياطية للبيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` كأهداف للتسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين المطابقة القابلة للتغيير لعنوان البريد الإلكتروني الأساسي (وضع توافق للكسر الزجاجي).

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

- يتطلب **وضع Socket** كلاً من `botToken` و`appToken` (مع استخدام `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كخيار احتياطي من متغيرات البيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول مصدر/حالة لكل بيانات الاعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مُعدّ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتيح `channels.slack.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يُعد `channels.slack.streaming.mode` مفتاح وضع بث Slack القياسي. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي لـ Slack. ويتم ترحيل `streamMode` القديم، وقيم `streaming` المنطقية، و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` كأهداف للتسليم.

**أوضاع إشعارات التفاعل:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** تكون `thread.historyScope` لكل سلسلة على حدة (الافتراضي) أو مشتركة عبر القناة. يقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack مع حالة السلسلة بأسلوب المساعد "is typing..." هدف رد ضمن سلسلة. تظل الرسائل الخاصة ذات المستوى الأعلى خارج السلاسل افتراضيًا، ولذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بأسلوب السلسلة.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم الرمز المختصر لإيموجي Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتخويل المعتمدين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ---------------- | --------- | ------- |
| reactions        | مفعّل     | التفاعل + إدراج التفاعلات |
| messages         | مفعّل     | قراءة/إرسال/تحرير/حذف |
| pins             | مفعّل     | تثبيت/إزالة تثبيت/إدراج |
| memberInfo       | مفعّل     | معلومات العضو |
| emojiList        | مفعّل     | قائمة الإيموجي المخصص |

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

أوضاع الدردشة: `oncall` (الرد عند @-mention، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن تكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`) وليس URL كاملاً.
- يجب أن تشير `commands.callbackUrl` إلى نقطة نهاية بوابة OpenClaw وأن تكون قابلة للوصول من خادم Mattermost.
- تتم مصادقة عمليات الاستدعاء العكسي لأوامر slash الأصلية باستخدام الرموز المميزة
  لكل أمر التي يعيدها Mattermost أثناء تسجيل أوامر slash. إذا فشل التسجيل أو لم
  يتم تفعيل أي أوامر، يرفض OpenClaw عمليات الاستدعاء العكسي مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء العكسي الخاصين/الداخليين/tailnet، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` المضيف/النطاق الخاص بالاستدعاء العكسي.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- يتيح `channels.mattermost.configWrites` السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Mattermost.
- يفرض `channels.mattermost.requireMention` وجود `@mention` قبل الرد في القنوات.
- يوفر `channels.mattermost.groups.<channelId>.requireMention` تجاوزًا لكل قناة لشرط الإشارة (`"*"` للافتراضي).
- يتيح `channels.mattermost.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

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

**أوضاع إشعارات التفاعل:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: يثبت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: يسمح أو يمنع عمليات كتابة الإعدادات التي يبدأها Signal.
- يتيح `channels.signal.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعومًا عبر plugin، ويُضبط تحت `channels.bluebubbles`).

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
- يتيح `channels.bluebubbles.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تم توثيق إعدادات قناة BlueBubbles الكاملة في [BlueBubbles](/ar/channels/bluebubbles).

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

- يتيح `channels.imessage.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لإدراج الدردشات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف المرحّل موجود مسبقًا في `~/.ssh/known_hosts`.
- يتيح `channels.imessage.configWrites` السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضًا موحدًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تأتي Matrix مدعومة عبر extension ويتم إعدادها تحت `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. و`proxy` وخيار الاشتراك في الشبكة هذا عنصران مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها ودعوات الرسائل الخاصة الجديدة حتى تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتخويل المعتمدين.
  - `enabled`: يمكن أن تكون `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (تطابق جزئي أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل الخاصة في Matrix ضمن الجلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه إليه، بينما يعزل `per-room` كل غرفة رسائل خاصة.
- تستخدم فحوصات الحالة واستعلامات الدليل المباشرة في Matrix سياسة الوكيل نفسها المستخدمة في حركة وقت التشغيل.
- تم توثيق إعدادات Matrix الكاملة، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تأتي Microsoft Teams مدعومة عبر extension ويتم إعدادها تحت `channels.msteams`.

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
- تم توثيق إعدادات Teams الكاملة (بيانات الاعتماد، وwebhook، وسياسة الرسائل الخاصة/المجموعات، والتجاوزات لكل فريق/قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

تأتي IRC مدعومة عبر extension ويتم إعدادها تحت `channels.irc`.

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
- يتيح `channels.irc.defaultAccount` الاختياري تجاوز اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- تم توثيق إعدادات قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/فرض الإشارة) في [IRC](/ar/channels/irc).

### حسابات متعددة (جميع القنوات)

شغّل حسابات متعددة لكل قناة (لكل منها `accountId` خاص بها):

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

- يُستخدم `default` عند حذف `accountId` (في CLI + التوجيه).
- لا تنطبق رموز البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو onboarding القناة) بينما لا تزال على إعداد قناة ذي حساب واحد على المستوى الأعلى، فسيقوم OpenClaw أولًا بترقية القيم ذات النطاق الحسابي على المستوى الأعلى الخاصة بالحساب الواحد إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي موجود ومطابق.
- تظل ارتباطات القناة فقط الموجودة حاليًا (من دون `accountId`) مطابقة للحساب الافتراضي؛ وتظل الارتباطات ذات النطاق الحسابي اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل القيم ذات النطاق الحسابي على المستوى الأعلى الخاصة بالحساب الواحد إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي موجود ومطابق.

### قنوات extension أخرى

يتم إعداد العديد من قنوات extension على شكل `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### فرض الإشارة في الدردشة الجماعية

تفترض رسائل المجموعات افتراضيًا **اشتراط الإشارة** (إشارة في البيانات الوصفية أو أنماط regex آمنة). وينطبق ذلك على دردشات المجموعات في WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارة:**

- **الإشارات في البيانات الوصفية**: إشارات @-mentions الأصلية للمنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض اشتراط الإشارة إلا عندما يكون الكشف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يحدد `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطها على `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة خاصة → افتراضي الموفر → بلا حد (الاحتفاظ بالكل).

مدعوم في: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @-mentions الأصلية، ويرد فقط على أنماط النص):

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

- تقوم هذه الكتلة بتهيئة أسطح الأوامر. للاطلاع على فهرس الأوامر الحالي المضمّن + المجمّع، راجع [Slash Commands](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. تُوثَّق الأوامر المملوكة للقنوات/الـ plugins مثل `/bot-ping` و`/bot-help` و`/bot-logs` الخاصة بـ QQ Bot، و`/card` الخاصة بـ LINE، و`/pair` الخاصة بـ device-pair، و`/dreaming` الخاصة بالذاكرة، و`/phone` الخاصة بـ phone-control، و`/voice` الخاصة بـ Talk في صفحات القنوات/الـ plugins الخاصة بها بالإضافة إلى [Slash Commands](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- يؤدي `native: "auto"` إلى تشغيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يؤدي `nativeSkills: "auto"` إلى تشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يؤدي `bash: true` إلى تفعيل `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يؤدي `config: true` إلى تفعيل `/config` (قراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء `chat.send` في البوابة، تتطلب أيضًا عمليات الكتابة الدائمة عبر `/config set|unset` وجود `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحًا لعملاء المشغل العاديين ذوي نطاق الكتابة.
- يؤدي `mcp: true` إلى تفعيل `/mcp` لإعدادات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`.
- يؤدي `plugins: true` إلى تفعيل `/plugins` لاكتشاف الـ plugins وتثبيتها وضوابط تمكينها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم أيضًا `channels.<provider>.accounts.<id>.configWrites` في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل البوابة. القيمة الافتراضية: `true`.
- تمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك من أجل الأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في مطالبة النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصصة لكل موفر. عند تعيينها، تكون هي **المصدر الوحيد** للتفويض (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- يؤدي `useAccessGroups: false` إلى السماح للأوامر بتجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` معيّنة.
- خريطة وثائق الأوامر:
  - الفهرس المضمّن + المجمّع: [Slash Commands](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - dreaming الخاصة بالذاكرة: [Dreaming](/ar/concepts/dreaming)

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

جذر مستودع اختياري يظهر في سطر Runtime ضمن مطالبة النظام. إذا لم يتم تعيينه، يكتشفه OpenClaw تلقائيًا عبر التتبع صعودًا من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـ Skills للوكلاء الذين لا يعيّنون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
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

يتحكم في توقيت حقن ملفات bootstrap الخاصة بمساحة العمل في مطالبة النظام. الافتراضي: `"always"`.

- `"continuation-skip"`: تتجاوز أدوار المتابعة الآمنة (بعد اكتمال رد المساعد) إعادة حقن bootstrap الخاصة بمساحة العمل، مما يقلل حجم المطالبة. وتظل تشغيلات النبض وإعادات المحاولة بعد الضغط تعيد بناء السياق.

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

- `"off"`: لا تحقن نص التحذير أبدًا في مطالبة النظام.
- `"once"`: احقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

أقصى حجم بالبكسل لأطول ضلع في الصورة داخل كتل صور السجل/الأدوات قبل استدعاءات الموفر.
الافتراضي: `1200`.

تقلل القيم الأدنى عادةً من استخدام رموز الرؤية وحجم حمولة الطلب عند التشغيلات التي تحتوي على الكثير من لقطات الشاشة.
وتحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق مطالبة النظام (وليس للطوابع الزمنية للرسائل). وتعود احتياطيًا إلى المنطقة الزمنية للمضيف.

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
      params: { cacheRetention: "long" }, // القيم الافتراضية العامة لمعاملات الموفر
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

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يعيّن شكل السلسلة النموذج الأساسي فقط.
  - يعيّن شكل الكائن النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا للتوجيه الاحتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الصور المشتركة وأي سطح أداة/plugin مستقبلي يولّد الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا حددت موفرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API للموفر المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال بإمكان `image_generate` استنتاج موفر افتراضي مدعوم بالمصادقة. إذ يحاول أولًا الموفر الافتراضي الحالي، ثم بقية موفري توليد الصور المسجلين بترتيب معرّفات الموفرين.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الموسيقى المشتركة وأداة `music_generate` المضمّنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا تم حذفه، فلا يزال بإمكان `music_generate` استنتاج موفر افتراضي مدعوم بالمصادقة. إذ يحاول أولًا الموفر الافتراضي الحالي، ثم بقية موفري توليد الموسيقى المسجلين بترتيب معرّفات الموفرين.
  - إذا حددت موفرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API للموفر المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية توليد الفيديو المشتركة وأداة `video_generate` المضمّنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال بإمكان `video_generate` استنتاج موفر افتراضي مدعوم بالمصادقة. إذ يحاول أولًا الموفر الافتراضي الحالي، ثم بقية موفري توليد الفيديو المسجلين بترتيب معرّفات الموفرين.
  - إذا حددت موفرًا/نموذجًا مباشرةً، فقم أيضًا بإعداد مصادقة/مفتاح API للموفر المطابق.
  - يدعم موفر توليد الفيديو Qwen المضمّن ما يصل إلى فيديو خرج واحد، وصورة إدخال واحدة، و4 مقاطع فيديو إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى الموفر.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، تعود أداة PDF احتياطيًا إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` في الاعتبار.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: بالصيغة `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت الموفر، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم مطابقة فريدة لموفر مُعد لذلك مع معرّف النموذج المطابق تمامًا، وبعد ذلك فقط يعود احتياطيًا إلى الموفر الافتراضي المُعد (سلوك توافق قديم، لذا يُفضَّل استخدام `provider/model` بشكل صريح). إذا لم يعد ذلك الموفر يعرّض النموذج الافتراضي المُعد، فسيعود OpenClaw احتياطيًا إلى أول موفر/نموذج مُعد بدلًا من إظهار افتراضي قديم لموفر تمت إزالته.
- `models`: فهرس النماذج المُعد وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالموفر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معاملات الموفر الافتراضية العامة المطبقة على جميع النماذج. يتم تعيينها في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تتجاوزه `agents.list[].params` (لمعرّف الوكيل المطابق) بحسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل الافتراضية منخفضة المستوى للوكلاء المضمّنين. استخدم `runtime: "auto"` للسماح لـ plugin harnesses المسجلة باحتواء النماذج المدعومة، أو `runtime: "pi"` لفرض PI harness المضمّن، أو معرّف harness مسجل مثل `runtime: "codex"`. عيّن `fallback: "none"` لتعطيل العودة التلقائية إلى PI.
- تحفظ كاتبات الإعدادات التي تعدّل هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) الشكل القياسي للكائن، وتحافظ على قوائم الاحتياطي الموجودة عند الإمكان.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المنفذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمّن.
ينبغي لمعظم عمليات النشر الإبقاء على القيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر plugin موثوق harness أصليًا، مثل
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

- `runtime`: `"auto"` أو `"pi"` أو معرّف plugin harness مسجل. يسجل plugin Codex المضمّن `codex`.
- `fallback`: `"pi"` أو `"none"`. تُبقي `"pi"` على PI harness المضمّن بوصفه احتياطي التوافق. وتجعل `"none"` اختيار plugin harness المفقود أو غير المدعوم يفشل بدلًا من استخدام PI بصمت.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` العودة إلى PI لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، عيّن `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في chat harness المضمّن. أما توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS فما تزال تستخدم إعدادات الموفر/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمّنة** (لا تنطبق إلا عندما يكون النموذج موجودًا في `agents.defaults.models`):

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

تتغلب الأسماء المستعارة التي تعدّها أنت دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تعيّن `--thinking off` أو تحدد بنفسك `agents.defaults.models["zai/<model>"].params.thinking`.
وتفعّل نماذج Z.AI `tool_stream` افتراضيًا لبث استدعاءات الأدوات. عيّن `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيله.
وتستخدم نماذج Anthropic Claude 4.6 افتراضيًا التفكير `adaptive` عندما لا يكون مستوى التفكير محددًا صراحة.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع الاحتياطي النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كخيار احتياطي عند فشل موفري API.

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

- واجهات CLI الخلفية نصية أولًا؛ وتكون الأدوات دائمًا معطلة.
- الجلسات مدعومة عندما يتم تعيين `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل مطالبة النظام الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. عيّنها على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتكون القيم لكل وكيل لها الأولوية؛ ويتم تجاهل القيم الفارغة أو التي تحتوي على مسافات فقط. وهي مفيدة لتجارب المطالبات المضبوطة.

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

تشغيلات النبض الدورية.

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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). عيّنه إلى `0m` للتعطيل.
- `includeSystemPromptSection`: عند تعيينه إلى false، يحذف قسم Heartbeat من مطالبة النظام ويتجاوز حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند تعيينه إلى true، يمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات النبض.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل نبض قبل إيقافه. اتركه غير معيّن لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم إلى هدف مباشر. وتمنع `block` التسليم إلى الهدف المباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عند تعيينه إلى true، تستخدم تشغيلات النبض سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند تعيينه إلى true، يعمل كل نبض في جلسة جديدة من دون أي سجل محادثات سابق. وهو نفس نمط العزل في cron `sessionTarget: "isolated"`. ويقلل تكلفة الرموز لكل نبض من نحو 100 ألف إلى نحو 2-5 آلاف رمز.
- لكل وكيل: عيّن `agents.list[].heartbeat`. عندما يحدد أي وكيل `heartbeat`، **فإن هؤلاء الوكلاء فقط** هم الذين يشغّلون النبض.
- تشغّل عمليات النبض أدوار وكيل كاملة — والفواصل الأقصر تستهلك مزيدًا من الرموز.

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

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف plugin موفر compaction مسجل. عند تعيينه، يتم استدعاء `summarize()` الخاصة بالموفر بدلًا من تلخيص LLM المضمّن. ويعود احتياطيًا إلى التلخيص المضمّن عند الفشل. ويؤدي تعيين موفر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` (الافتراضي) أو `off` أو `custom`. تضيف `strict` تلقائيًا إرشادات مضمّنة للحفاظ على المعرّفات غير الشفافة أثناء تلخيص compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ عيّن `[]` لتعطيل إعادة الحقن. عند عدم تعيينها أو عند تعيين هذا الزوج الافتراضي صراحة، تُقبل أيضًا العناوين الأقدم `Every Session`/`Safety` كخيار احتياطي قديم.
- `model`: تجاوز اختياري من نوع `provider/model-id` لتلخيص compaction فقط. استخدم هذا عندما ينبغي أن تحتفظ الجلسة الرئيسية بنموذج معيّن بينما تعمل ملخصات compaction على نموذج آخر؛ وعند عدم تعيينه، تستخدم compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند تعيينه إلى `true`، يرسل إشعارًا موجزًا إلى المستخدم عند بدء compaction (مثل "Compacting context..."). يكون معطلًا افتراضيًا لإبقاء compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل compaction التلقائي لتخزين الذكريات الدائمة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل الإرسال إلى LLM. ولا يُعدّل سجل الجلسة على القرص.

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
- يتحكم `ttl` في عدد المرات التي يمكن بعدها تشغيل التقليم مجددًا (بعد آخر لمسة لذاكرة التخزين المؤقت).
- يقوم التقليم أولًا بالاقتطاع المرن لنتائج الأدوات كبيرة الحجم، ثم يزيل نهائيًا نتائج الأدوات الأقدم إذا لزم الأمر.

**الاقتطاع المرن** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**الإزالة النهائية** تستبدل نتيجة الأداة بالكامل بالنص النائب.

ملاحظات:

- لا يتم اقتطاع/إزالة كتل الصور مطلقًا.
- تعتمد النسب على عدد الأحرف (تقريبية)، وليست على عدد الرموز بدقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### البث على شكل كتل

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحة لتفعيل الردود على شكل كتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيراتها لكل حساب). وتستخدم Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. تعني `natural` = ‏800–2500 مللي ثانية. التجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) للحصول على تفاصيل السلوك + التقسيم إلى كتل.

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المذكور فيها.
- التجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعدادات خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل بحسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة مسبقًا تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: عناصر تحكم سياسة مفاتيح مضيف OpenSSH

**أسبقية مصادقة SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة Sandbox

**سلوك خلفية SSH:**

- يبذر مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي الأساسية
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح Sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل Sandbox لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تركيب مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعدادات plugin OpenShell:**

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

- `mirror`: يبذر البعيد من المحلي قبل exec، ثم يزامن عودةً بعد exec؛ وتظل مساحة العمل المحلية هي الأساسية
- `remote`: يبذر البعيد مرة واحدة عند إنشاء Sandbox، ثم يُبقي مساحة العمل البعيدة هي الأساسية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي أُجريت خارج OpenClaw إلى Sandbox تلقائيًا بعد خطوة البذر.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن plugin هو الذي يملك دورة حياة Sandbox ومزامنة mirror الاختيارية.

**`setupCommand`** يُشغَّل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — عيّنه إلى `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
أما `"host"` فمحظور. وتُحظر `"container:<id>"` افتراضيًا ما لم تعيّن صراحة
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (وضع كسر الزجاج).

**تُجهّز المرفقات الواردة** ضمن `media/inbound/*` في مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ ويتم دمج التركيبات العامة وتلك الخاصة بكل وكيل.

**متصفح Sandbox** (`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في مطالبة النظام. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- يؤدي `allowHostControl: false` (الافتراضي) إلى منع الجلسات داخل Sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحة اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- يركّب `sandbox.browser.binds` أدلة مضيف إضافية في حاوية متصفح Sandbox فقط. وعند تعيينه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف القيم الافتراضية للتشغيل في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/الرسوم ثلاثية الأبعاد يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير القيم الافتراضية للحاوية.

</Accordion>

يقتصر Sandboxing المتصفح و`sandbox.docker.binds` على Docker فقط.

أنشئ الصور:

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
- `default`: عند تعيين أكثر من وكيل، يفوز الأول (ويُسجَّل تحذير). وإذا لم يتم تعيين أي واحد، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز شكل السلسلة قيمة `primary` فقط؛ بينما يتجاوز شكل الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل القيم الاحتياطية العامة). وتظل مهام Cron التي تتجاوز `primary` فقط ترث القيم الاحتياطية الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معاملات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا من أجل تجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. وإذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلًا من الدمج، و`[]` تعني عدم استخدام أي Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: تجاوز اختياري لكل وكيل لرؤية reasoning (`on | off | stream`). ويُطبق عندما لا يكون هناك تجاوز لـ reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: قيمة افتراضية اختيارية لكل وكيل لوضع السرعة (`true | false`). وتُطبق عندما لا يكون هناك تجاوز لوضع السرعة لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لكل وكيل لسياسة harness منخفضة المستوى. استخدم `{ runtime: "codex", fallback: "none" }` لجعل أحد الوكلاء خاصًا بـ Codex فقط بينما يحتفظ الوكلاء الآخرون بخيار PI الاحتياطي الافتراضي.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية في `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما ينبغي أن يستخدم الوكيل جلسات ACP harness افتراضيًا.
- `identity.avatar`: مسار نسبي لمساحة العمل، أو `http(s)` URL، أو `data:` URI.
- تستنتج `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء من أجل `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب داخل Sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل خارج Sandbox.
- `subagents.requireAgentId`: عند تعيينه إلى true، يمنع استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

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

- `type` (اختياري): ‏`route` للتوجيه العادي (عند حذف النوع يكون الافتراضي route)، و`acp` لارتباطات محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ المحذوف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لـ `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالحل وفق هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding المذكور أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (بلا Sandbox)">

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

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

- **`scope`**: إستراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك جميع الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: يربط المعرّفات القياسية بالنظراء ذوي بادئة الموفر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعند إعداد الاثنين، يفوز ما تنتهي صلاحيته أولًا.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` المسموح به في الجلسة الأم عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل محادثة الأصل.
  - عيّن `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لدلو الدردشة المباشرة الرئيسي.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لعدد أدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). تؤدي القيمة `0` إلى تعطيل سلسلة ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. أول تطابق للمنع هو الذي يفوز.
- **`maintenance`**: عناصر تحكم تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يؤدي `warn` إلى إصدار تحذيرات فقط؛ بينما يطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر لإزالة الإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتكون قيمته الافتراضية هي `pruneAfter`؛ عيّنه إلى `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم المصنوعات/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. قيمته الافتراضية `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفرين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز بعد عدم النشاط بالساعات (`0` للتعطيل؛ ويمكن للموفرين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` للتعطيل؛ ويمكن للموفرين تجاوزه)

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

آلية الحل (الأكثر تحديدًا يفوز): الحساب ← القناة ← العام. تؤدي القيمة `""` إلى التعطيل وإيقاف التسلسل. وتؤدي `"auto"` إلى اشتقاق `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | المثال |
| ------- | ----- | ------ |
| `{model}` | اسم النموذج المختصر | `claude-opus-4-6` |
| `{modelFull}` | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}` | اسم الموفر | `anthropic` |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` و`low` و`off` |
| `{identity.name}` | اسم هوية الوكيل | (مثل `"auto"`) |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل التأكيد

- تكون قيمته الافتراضية `identity.emoji` الخاصة بالوكيل النشط، وإلا `"👀"`. عيّن `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← احتياطي الهوية.
- النطاق: `group-mentions` (الافتراضي) و`group-all` و`direct` و`all`.
- يؤدي `removeAckAfterReply` إلى إزالة التأكيد بعد الرد في Slack وDiscord وTelegram.
- يؤدي `messages.statusReactions.enabled` إلى تفعيل تفاعلات حالة دورة الحياة في Slack وDiscord وTelegram.
  وفي Slack وDiscord، يؤدي عدم تعيينه إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، عيّنه صراحة إلى `true` لتفعيل تفاعلات حالة دورة الحياة.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. ويتم تفريغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- تكون `modelOverrides` مفعّلة افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك اختياري).
- تعود مفاتيح API احتياطيًا إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية TTS الخاصة بـ OpenAI. ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست لـ OpenAI، يتعامل OpenClaw معها بوصفها خادم TTS متوافقًا مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند إعداد عدة موفري Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات احتياطيًا إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الاحتياطي `ELEVENLABS_API_KEY` إلا عندما لا يكون هناك مفتاح API مُعد لـ Talk.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المفرغ. ويؤدي عدم تعيينه إلى الإبقاء على نافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يحدد `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية onboarding المحلية الإعدادات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عند عدم تعيينه (وتُحفظ ملفات التعريف الصريحة الحالية).

| ملف التعريف | يتضمن |
| ----------- | ------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status` |
| `full`      | بلا تقييد (مثل غير المعيّن) |

### مجموعات الأدوات

| المجموعة | الأدوات |
| -------- | ------- |
| `group:runtime`    | `exec` و`process` و`code_execution` (يُقبل `bash` كاسم مستعار لـ `exec`) |
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
| `group:openclaw`   | جميع الأدوات المضمّنة (باستثناء provider plugins) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبق حتى عندما يكون Docker sandbox معطلًا.
__OC_I18N_900053__
### `tools.byProvider`

تفرض قيودًا إضافية على الأدوات لموفرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف الموفر ← السماح/المنع.
__OC_I18N_900054__
### `tools.elevated`

يتحكم في وصول exec المرتفع خارج Sandbox:
__OC_I18N_900055__
- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا أن يفرض مزيدًا من التقييد.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع Sandboxing ويستخدم مسار الهروب المُعد (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

### `tools.exec`
__OC_I18N_900056__
### `tools.loopDetection`

تكون فحوصات أمان حلقات الأدوات **معطلة افتراضيًا**. عيّن `enabled: true` لتفعيل الكشف.
يمكن تعريف الإعدادات عمومًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.
__OC_I18N_900057__
- `historySize`: الحد الأقصى لسجل استدعاءات الأدوات المحتفَظ به لتحليل الحلقات.
- `warningThreshold`: عتبة نمط التكرار بلا تقدم لإصدار التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: يحذر عند تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
- `detectors.knownPollNoProgress`: يحذر/يحظر أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك) عند عدم وجود تقدم.
- `detectors.pingPong`: يحذر/يحظر أنماط الأزواج المتناوبة بلا تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`
__OC_I18N_900058__
### `tools.media`

يُعدّ فهم الوسائط الواردة (الصور/الصوت/الفيديو):
__OC_I18N_900059__
<Accordion title="حقول إدخال نموذج الوسائط">

**إدخال الموفر** (`type: "provider"` أو عند حذفه):

- `provider`: معرّف موفر API (`openai` أو `anthropic` أو `google`/`gemini` أو `groq`، إلخ)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**حقول مشتركة:**

- `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود الإخفاقات احتياطيًا إلى الإدخال التالي.

تتبع مصادقة الموفر الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- عندما تكون `asyncCompletion.directSend` مساوية لـ `true`، تحاول المهام المكتملة غير المتزامنة الخاصة بـ `music_generate`
  و`video_generate` التسليم المباشر إلى القناة أولًا. والقيمة الافتراضية: `false`
  (مسار التنبيه/تسليم النموذج القديم الخاص بجلسة الطالب).

</Accordion>

### `tools.agentToAgent`
__OC_I18N_900060__
### `tools.sessions`

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`).

الافتراضي: `tree` (الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).
__OC_I18N_900061__
ملاحظات:

- `self`: مفتاح الجلسة الحالية فقط.
- `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
- `agent`: أي جلسة تابعة لمعرّف الوكيل الحالي (قد يشمل مستخدمين آخرين إذا كنت تشغل جلسات per-sender تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. وما يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد Sandbox: عندما تكون الجلسة الحالية داخل Sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض `visibility` على `tree` حتى إذا كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.
__OC_I18N_900062__
ملاحظات:

- لا تُدعم المرفقات إلا مع `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُنشأ الملفات فعليًا داخل مساحة عمل الطفل في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تلقائيًا إخفاء محتوى المرفقات من حفظ السجل.
- يتم التحقق من مدخلات Base64 باستخدام فحوصات صارمة للأبجدية/الحشو وحاجز حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: تؤدي `delete` دائمًا إلى إزالة المرفقات؛ وتؤدي `keep` إلى الاحتفاظ بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمّنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تمكين تلقائي صارمة لـ GPT-5 agentic.
__OC_I18N_900063__
ملاحظات:

- `planTool`: يفعّل أداة `update_plan` المهيكلة لتتبع الأعمال غير التافهة متعددة الخطوات.
- الافتراضي: `false` ما لم يتم تعيين `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) إلى `"strict-agentic"` لتشغيل OpenAI أو OpenAI Codex من عائلة GPT-5. عيّنه إلى `true` لفرض تشغيل الأداة خارج هذا النطاق، أو إلى `false` لإبقائها معطلة حتى في تشغيلات GPT-5 strict-agentic.
- عند التفعيل، تضيف مطالبة النظام أيضًا إرشادات استخدام لكي لا يستخدمها النموذج إلا للأعمال الجوهرية، مع إبقاء خطوة واحدة فقط كحد أقصى في حالة `in_progress`.

### `agents.defaults.subagents`
__OC_I18N_900064__
- `model`: النموذج الافتراضي للوكلاء الفرعيين الذين تم إنشاؤهم. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المتصل.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفين من أجل `sessions_spawn` عندما لا يعيّن الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما تحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المضمّن. أضف موفرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.
__OC_I18N_900065__
- استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
- تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير البيئة).
- أسبقية الدمج لمعرّفات الموفرين المتطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفر مُدارًا عبر SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
  - يتم تحديث قيم `apiKey` الخاصة بالموفر المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec) بدلًا من حفظ الأسرار المحلولة.
  - يتم تحديث قيم رؤوس الموفر المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المحذوفة من الوكيل احتياطيًا إلى `models.providers` في الإعدادات.
  - تستخدم القيم المتطابقة للنموذج في `contextWindow`/`maxTokens` القيمة الأعلى بين الإعدادات الصريحة وقيم الفهرس الضمنية.
  - تحافظ القيم المتطابقة للنموذج في `contextTokens` على حد وقت تشغيل صريح عندما يكون موجودًا؛ استخدمه لتقييد السياق الفعلي من دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول الموفر

- `models.mode`: سلوك فهرس الموفر (`merge` أو `replace`).
- `models.providers`: خريطة موفّرين مخصصين مفاتيحها هي معرّفات الموفرين.
- `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai`، إلخ).
- `models.providers.*.apiKey`: بيانات اعتماد الموفر (يُفضّل SecretRef/الاستبدال بمتغيرات البيئة).
- `models.providers.*.auth`: إستراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API العليا.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفر النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع القيم الافتراضية للموفر). تقبل القيم SecretRef.
  - `request.auth`: تجاوز إستراتيجية المصادقة. الأنماط: `"provider-default"` (استخدام المصادقة المضمّنة للموفر)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأنماط: `"env-proxy"` (استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` (مع `url`). يقبل كلا النمطين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (تقبل جميعها SecretRef) و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح بـ HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حاجز جلب HTTP الخاص بالموفر (اشتراك تشغيلي اختياري لنقاط نهاية OpenAI-compatible ذاتية الاستضافة الموثوق بها). ويستخدم WebSocket نفس `request` للترويسات/TLS ولكن ليس لهذا الحاجز الخاص بـ SSRF في الجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج موفر صريحة.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة سياق النموذج الأصلية.
- `models.providers.*.models.*.contextTokens`: حد اختياري لسياق وقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. أما `baseUrl` الفارغ/غير المعيّن فيُبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية chat المتوافقة مع OpenAI والتي تقبل السلاسل فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: عامل تصفية اختياري لمعرّف الموفر من أجل اكتشاف موجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الخرج للنماذج المكتشفة.

### أمثلة على الموفرين

<Accordion title="Cerebras ‏(GLM 4.6 / 4.7)">
__OC_I18N_900066__
استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ واستخدم `zai/glm-4.7` مع Z.AI المباشر.

</Accordion>

<Accordion title="OpenCode">
__OC_I18N_900067__
عيّن `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لفهرس Zen أو مراجع `opencode-go/...` لفهرس Go. اختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI ‏(GLM-4.7)">
__OC_I18N_900068__
عيّن `ZAI_API_KEY`. ويُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. اختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف موفرًا مخصصًا مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI ‏(Kimi)">
__OC_I18N_900069__
بالنسبة إلى نقطة النهاية الصينية: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل
`openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف الموفر المضمّن وحده.

</Accordion>

<Accordion title="Kimi Coding">
__OC_I18N_900070__
متوافق مع Anthropic، وموفر مضمّن. اختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic ‏(متوافق مع Anthropic)">
__OC_I18N_900071__
يجب أن يحذف عنوان URL الأساسي `/v1` (إذ يضيفه عميل Anthropic). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 ‏(مباشر)">
__OC_I18N_900072__
عيّن `MINIMAX_API_KEY`. الاختصارات:
`openclaw onboard --auth-choice minimax-global-api` أو
`openclaw onboard --auth-choice minimax-cn-api`.
يفترض فهرس النماذج قيمة M2.7 فقط.
وعلى مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضيًا ما لم تعيّن `thinking` بنفسك صراحة. ويقوم `/fast on` أو
`params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/gateway/local-models). الخلاصة: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة من أجل الاحتياط.

</Accordion>

---

## Skills
__OC_I18N_900073__
- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمّنة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون `true`، تفضّل مثبّتات Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعلن متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

---

## Plugins
__OC_I18N_900074__
- يُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف OpenClaw plugins الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل البوابة.**
- `allow`: قائمة سماح اختيارية (لا تُحمّل إلا الـ plugins المدرجة). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل ملاءمة لمفتاح API على مستوى plugin (عند دعمه من قبل plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة خاصة بـ plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core `before_prompt_build` ويتجاهل الحقول المعدّلة للمطالبة من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على plugin hooks الأصلية وأدلة hooks التي توفّرها الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً في هذا plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في تشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية من أجل تجاوزات الوكلاء الفرعيين الموثوق بها. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه plugin (ويُتحقق منه عبر مخطط OpenClaw plugin الأصلي عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر web-fetch في Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). ويعود احتياطيًا إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو `tools.web.fetch.firecrawl.apiKey` القديم، أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لواجهة API الخاصة بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي للصفحات فقط (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر ذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تفعيل موفر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات dreaming الخاصة بالذاكرة (تجريبية). راجع [Dreaming](/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: المفتاح الرئيسي لـ dreaming (الافتراضي `false`).
  - `frequency`: إيقاع cron لكل عملية dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجّهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لحزم Claude plugin المفعّلة أن تسهم بقيم Pi افتراضية مضمّنة من `settings.json`؛ ويطبّق OpenClaw هذه القيم كإعدادات وكيل منقّاة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف memory plugin النشط، أو `"none"` لتعطيل memory plugins.
- `plugins.slots.contextEngine`: اختر معرّف context engine plugin النشط؛ وتكون قيمته الافتراضية `"legacy"` ما لم تثبّت وتحدد محركًا آخر.
- `plugins.installs`: بيانات تعريف التثبيت التي يديرها CLI وتستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` بوصفها حالة مُدارة؛ ويفضّل استخدام أوامر CLI بدل التعديلات اليدوية.

راجع [Plugins](/tools/plugin).

---

## المتصفح
__OC_I18N_900075__
- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلًا عندما لا يتم تعيينه، لذلك تظل ملاحة المتصفح صارمة افتراضيًا.
- عيّن `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في ملاحة المتصفح داخل الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لحظر الشبكات الخاصة نفسه أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون الملفات الشخصية البعيدة في وضع attach-only (ويُعطّل البدء/الإيقاف/إعادة التعيين).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw ‏`/json/version`؛ واستخدم WS(S)
  عندما يزوّدك الموفر بعنوان DevTools WebSocket URL مباشر.
- تكون ملفات تعريف `existing-session` خاصة بالمضيف فقط وتستخدم Chrome MCP بدلًا من CDP.
- يمكن لملفات تعريف `existing-session` تعيين `userDataDir` لاستهداف ملف تعريف
  محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بالقيود الحالية لمسار Chrome MCP:
  إجراءات تعتمد على snapshot/ref بدل استهداف CSS selector، وخطافات رفع ملف واحد،
  ومن دون تجاوزات لمهلة dialog، ومن دون `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدُفعية.
- تقوم ملفات تعريف `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛ لا
  تعيّن `cdpUrl` صراحة إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- خدمة التحكم: loopback فقط (ويُشتق المنفذ من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu`، أو تحديد حجم النافذة، أو أعلام التصحيح).

---

## UI
__OC_I18N_900076__
- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (لون فقاعة Talk Mode، إلخ).
- `assistant`: تجاوز هوية Control UI. ويعود احتياطيًا إلى هوية الوكيل النشط.

---

## البوابة
__OC_I18N_900077__
<Accordion title="تفاصيل حقول البوابة">

- `mode`: ‏`local` (تشغيل البوابة) أو `remote` (الاتصال ببوابة بعيدة). وترفض البوابة البدء ما لم يكن `local`.
- `port`: منفذ متعدد الإرسال واحد لكل من WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان Tailscale IP فقط) أو `custom`.
- **الأسماء المستعارة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` (`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء المستعارة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع الربط الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge ‏(`-p 18789:18789`) تصل الحركة على `eth0`، لذا تصبح البوابة غير قابلة للوصول. استخدم `--network host` أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. وتتطلب عمليات الربط غير loopback مصادقة البوابة. وعمليًا يعني ذلك رمزًا مميزًا/كلمة مرور مشتركة أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج onboarding رمزًا مميزًا افتراضيًا.
- إذا تم إعداد كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مُعدَّين ويكون الوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط مع إعدادات local loopback موثوق بها؛ ولا يُعرض هذا عمدًا في مطالبات onboarding.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy واعٍ بالهوية وثق في ترويسات الهوية القادمة من `gateway.trustedProxies` (راجع [Trusted Proxy Auth](/gateway/trusted-proxy-auth)). ويتوقع هذا الوضع مصدر proxy **غير loopback**؛ ولا تستوفي reverse proxies ذات loopback على المضيف نفسه متطلبات trusted-proxy auth.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (بعد التحقق عبر `tailscale whois`). أما نقاط نهاية HTTP API فلا تستخدم مصادقة ترويسات Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي للبوابة. ويفترض هذا التدفق بلا رمز مميز أن مضيف البوابة موثوق. وتكون القيمة الافتراضية `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لفشل المصادقة. ويُطبَّق لكل عنوان IP للعميل ولكل نطاق مصادقة (يُتتبَّع السر المشترك ورمز الجهاز بشكل مستقل). وتُرجع المحاولات المحظورة `429` + `Retry-After`.
  - على مسار Control UI غير المتزامن عبر Tailscale Serve، تتم مَسلسلة المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذا يمكن للمحاولات المتزامنة السيئة من العميل نفسه أن تفعّل المحدِّد في الطلب الثاني بدلًا من أن يمر الاثنان كتعارضات عادية.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا إخضاع حركة localhost لتحديد المعدل أيضًا (في إعدادات الاختبار أو عمليات نشر proxy الصارمة).
- يتم دائمًا تقييد محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء loopback (كإجراء دفاعي إضافي ضد هجمات brute force على localhost من المتصفح).
- على loopback، تُعزل عمليات القفل ذات أصل المتصفح هذه لكل قيمة `Origin`
  مُطبَّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، مع ربط loopback) أو `funnel` (عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع الاحتياطي إلى أصل Host-header في عمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). وبالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز كسر الزجاج من جهة العميل يسمح باستخدام `ws://` غير المشفر مع عناوين IP موثوقة داخل الشبكات الخاصة؛ بينما يبقى الافتراضي مقصورًا على loopback فقط للنص الصريح.
- `gateway.remote.token` / `.password`: حقول بيانات اعتماد العميل البعيد. وهي لا تهيّئ مصادقة البوابة بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للـ APNs relay الخارجي الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالـ relay إلى البوابة. ويجب أن يطابق هذا العنوان عنوان relay المضمّن أثناء بناء إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من البوابة إلى relay بالمللي ثانية. الافتراضي `10000`.
- تُفوّض التسجيلات المدعومة بالـ relay إلى هوية بوابة محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرّر منحة إرسال خاصة بالتسجيل إلى البوابة. ولا يمكن لبوابة أخرى إعادة استخدام هذا التسجيل المخزَّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب مخصص للتطوير فقط لعناوين relay على loopback عبر HTTP. وينبغي أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. عيّنه إلى `0` لتعطيل إعادة التشغيل عبر مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. اجعل هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل عبر مراقب الصحة لكل قناة/حساب ضمن ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند تعيينه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء البوابة المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير معيّنة.
- إذا تم إعداد `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef وكان غير محلول، يفشل الحل بشكل مغلق (من دون إخفاء عبر احتياطي remote).
- `trustedProxies`: عناوين IP الخاصة بالـ reverse proxy التي تنهي TLS أو تحقن ترويسات العميل المُعاد توجيهها. أدرج فقط الـ proxies التي تتحكم بها. وتظل إدخالات loopback صالحة لإعدادات proxy على المضيف نفسه/كشف المحلي (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، تقبل البوابة `X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلبات HTTP ‏`POST /tools/invoke` (توسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة المنع الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطّلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية مدخلات URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنها فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد المثيلات

شغّل عدة بوابات على مضيف واحد مع منافذ وأدلة حالة فريدة:
__OC_I18N_900078__
أعلام ملاءمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [بوابات متعددة](/gateway/multiple-gateways).

### `gateway.tls`
__OC_I18N_900079__
- `enabled`: يفعّل إنهاء TLS عند مستمع البوابة (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: يُولّد تلقائيًا زوج cert/key محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مُعدّة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب إبقاء أذوناته مقيّدة.
- `caPath`: مسار اختياري لحزمة CA من أجل التحقق من العميل أو سلاسل الثقة المخصصة.

### `gateway.reload`
__OC_I18N_900080__
- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية البوابة دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب أولًا إعادة التحميل الساخنة؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة ارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

---

## Hooks
__OC_I18N_900081__
المصادقة: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
وتُرفض رموز hooks المميزة في query-string.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز البوابة.
- لا يمكن أن تكون `hooks.path` هي `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثل `["hook:"]`).

**نقاط النهاية:**

- `POST /hooks/wake` ← ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` ← تُحل عبر `hooks.mappings`

<Accordion title="تفاصيل الربط">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثل `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (وتُرفض المسارات المطلقة واجتياز المسارات).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة احتياطيًا إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو المحذوف = السماح للجميع، و`[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعِي `/hooks/agent` بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + الربط)، مثل `["hook:"]`.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل الخاص بـ hook (ويجب أن يكون مسموحًا به إذا كان فهرس النماذج معينًا).

</Accordion>

### تكامل Gmail
__OC_I18N_900082__
- تبدأ البوابة تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون معدًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب البوابة.

---

## Canvas host
__OC_I18N_900083__
- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ البوابة:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- مع الربط غير loopback: تتطلب مسارات canvas مصادقة البوابة (token/password/trusted-proxy)، مثل بقية أسطح HTTP الخاصة بالبوابة.
- لا ترسل Node WebViews عادةً ترويسات مصادقة؛ وبعد إقران node واتصاله، تعلن البوابة عناوين capability URLs خاصة بـ node للوصول إلى canvas/A2UI.
- ترتبط capability URLs بجلسة WS الخاصة بـ node النشطة وتنتهي صلاحيتها سريعًا. ولا يُستخدم احتياطي قائم على IP.
- يحقن عميل live-reload في HTML المُقدَّم.
- ينشئ تلقائيًا `index.html` ابتدائيًا عندما يكون المجلد فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل البوابة.
- عطّل live reload للأدلة الكبيرة أو عند أخطاء `EMFILE`.

---

## الاكتشاف

### mDNS ‏(Bonjour)
__OC_I18N_900084__
- `minimal` (الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area ‏(DNS-SD)
__OC_I18N_900085__
يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. وللاكتشاف عبر الشبكات، أقرنه مع خادم DNS ‏(يُوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات البيئة المضمنة)
__OC_I18N_900086__
- لا تُطبّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد ذلك المفتاح.
- ملفات `.env`: ‏`.env` في CWD + ‏`~/.openclaw/.env` (ولا يطغى أي منهما على المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/help/environment) لمعرفة الأسبقية الكاملة.

### الاستبدال بمتغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:
__OC_I18N_900087__
- لا تُطابق إلا الأسماء المكتوبة بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى إطلاق خطأ عند تحميل الإعدادات.
- اهرب باستخدام `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل أيضًا مع `$include`.

---

## الأسرار

إشارات السر Secret refs إضافية: لا تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحد:
__OC_I18N_900088__
التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` عند `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` عند `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة من نوع `.` أو `..` (على سبيل المثال يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج إشارات `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعدادات موفري الأسرار
__OC_I18N_900089__
ملاحظات:

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (ويجب أن تكون `id` مساوية لـ `"value"` في وضع singleValue).
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول على stdin/stdout.
- تُرفض مسارات أوامر الروابط الرمزية افتراضيًا. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من المسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، فيُطبّق فحص الدليل الموثوق على المسار الهدف المحلول.
- تكون بيئة الابن لـ `exec` دنيا افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل Secret refs وقت التفعيل إلى لقطة موجودة في الذاكرة، ثم تقرأ مسارات الطلب من اللقطة فقط.
- يُطبّق ترشيح السطح النشط أثناء التفعيل: تؤدي الإشارات غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

---

## تخزين المصادقة
__OC_I18N_900090__
- تُخزَّن الملفات الشخصية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` إشارات على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأنماط بيانات الاعتماد الثابتة.
- لا تدعم الملفات الشخصية ذات وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد الملفات الشخصية للمصادقة المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة وقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- الواردات القديمة لـ OAuth من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/gateway/secrets).

### `auth.cooldowns`
__OC_I18N_900091__
- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عند فشل ملف شخصي بسبب أخطاء حقيقية تتعلق بالفوترة/عدم كفاية الرصيد
  (الافتراضي: `5`). لا يزال من الممكن أن تصل نصوص الفوترة الصريحة
  إلى هذا المسار حتى مع استجابات `401`/`403`، لكن أدوات المطابقة النصية
  الخاصة بكل موفر تظل محصورة في الموفر الذي يملكها (على سبيل المثال OpenRouter
  `Key limit exceeded`). أما رسائل حد إنفاق
  نافذة الاستخدام القابلة لإعادة المحاولة في HTTP `402` أو الخاصة بالمؤسسة/مساحة العمل
  فتظل في مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفر لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات المصادقة ضمن الموفر نفسه لأخطاء الحمل الزائد قبل التبديل إلى احتياطي النموذج (الافتراضي: `1`). وتدخل هنا أشكال انشغال الموفر مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير ملف/موفر محمّل زيادةً عن الحد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات المصادقة ضمن الموفر نفسه لأخطاء تحديد المعدل قبل التبديل إلى احتياطي النموذج (الافتراضي: `1`). وتشمل فئة تحديد المعدل نصوصًا خاصة بالموفر مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

---

## التسجيل
__OC_I18N_900092__
- ملف السجل الافتراضي: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- عيّن `logging.file` لمسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبت عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = ‏500 MB). استخدم تدوير سجلات خارجيًا لعمليات النشر الإنتاجية.

---

## التشخيصات
__OC_I18N_900093__
- `enabled`: المفتاح الرئيسي لمخرجات القياس/الأدوات (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام تفعّل مخرجات السجل الموجّهة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات HTTP/gRPC metadata إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات الموارد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبعات من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل التفريغ الدوري لبيانات القياس عن بُعد بالمللي ثانية.
- `cacheTrace.enabled`: يسجل لقطات تتبع cache للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الخرج لملف cache trace بصيغة JSONL ‏(الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمَّن في خرج cache trace (وجميعها افتراضيًا: `true`).

---

## التحديث
__OC_I18N_900094__
- `channel`: قناة الإصدار لعمليات تثبيت npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء تشغيل البوابة (الافتراضي: `true`).
- `auto.enabled`: يفعّل التحديث التلقائي في الخلفية لعمليات تثبيت الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable ‏(الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

---

## ACP
__OC_I18N_900095__
- `enabled`: بوابة الميزات العامة لـ ACP ‏(الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP ‏(الافتراضي: `true`). عيّنها إلى `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق plugin وقت تشغيل ACP مسجلًا).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي المستهدف عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الكتلة قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تؤدي `"live"` إلى البث التدريجي؛ وتؤدي `"final_only"` إلى التخزين المؤقت حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج المساعد المُسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر الحالة/التحديث المسقطة لـ ACP.
- `stream.tagVisibility`: سجلّ لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعُمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري يُشغَّل عند تهيئة بيئة وقت تشغيل ACP.

---

## CLI
__OC_I18N_900096__
- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي في banner:
  - `"random"` (الافتراضي): شعارات نصية مضحكة/موسمية متناوبة.
  - `"default"`: شعار نصي ثابت ومحايد (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار (مع استمرار عرض عنوان banner/الإصدار).
- لإخفاء banner بالكامل (وليس الشعارات النصية فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات وصفية يكتبها CLI في تدفقات الإعداد الموجّهة (`onboard` و`configure` و`doctor`):
__OC_I18N_900097__
---

## الهوية

راجع حقول الهوية في `agents.list` تحت [القيم الافتراضية للوكلاء](#agent-defaults).

---

## Bridge ‏(قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (وسيفشل التحقق حتى تُزال؛ ويمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

<Accordion title="إعدادات bridge القديمة (مرجع تاريخي)">
__OC_I18N_900098__
</Accordion>

---

## Cron
__OC_I18N_900099__
- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل cron المعزولة المكتملة قبل حذفها من `sessions.json`. كما تتحكم أيضًا في تنظيف نصوص cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ عيّن `false` للتعطيل.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل الحذف. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفَظ بها عند تشغيل حذف سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer المميز المستخدم لتسليم POST إلى webhook في cron ‏(`delivery.mode = "webhook"`)، وإذا حُذف لا تُرسل أي ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم لـ webhook ‏(http/https) يُستخدم فقط للمهام المخزنة التي ما زال لديها `notify: true`.

### `cron.retry`
__OC_I18N_900100__
- `maxAttempts`: الحد الأقصى لإعادات المحاولة للمهام أحادية التشغيل عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة مع جميع الأنواع العابرة.

ينطبق ذلك فقط على مهام cron أحادية التشغيل. أما المهام المتكررة فلها معالجة إخفاق منفصلة.

### `cron.failureAlert`
__OC_I18N_900101__
- `enabled`: تفعيل تنبيهات الإخفاق لمهام cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — تؤدي `"announce"` إلى الإرسال عبر رسالة قناة؛ وتؤدي `"webhook"` إلى POST إلى webhook المُعد.
- `accountId`: معرّف حساب أو قناة اختياري لتحديد نطاق تسليم التنبيه.

### `cron.failureDestination`
__OC_I18N_900102__
- الوجهة الافتراضية لإشعارات إخفاق cron عبر جميع المهام.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ webhook. وهو مطلوب في وضع webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد الافتراضي العام.
- عندما لا يتم تعيين وجهة إخفاق عامة ولا لكل مهمة، تعود المهام التي تسلّم أصلًا عبر `announce` احتياطيًا إلى ذلك الهدف الأساسي لـ announce عند الإخفاق.
- لا يُدعم `delivery.failureDestination` إلا لمهام `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [وظائف Cron](/automation/cron-jobs). ويتم تتبع عمليات تنفيذ cron المعزولة بوصفها [مهام في الخلفية](/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقوالب الموسعة في `tools.media.models[].args`:

| المتغير | الوصف |
| ------- | ----- |
| `{{Body}}`         | النص الكامل للرسالة الواردة |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة |
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
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI |
| `{{ChatType}}`     | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد) |
| `{{SenderName}}`   | اسم العرض للمرسل (بأفضل جهد) |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد) |
| `{{Provider}}`     | تلميح الموفر (whatsapp أو telegram أو discord، إلخ) |

---

## تضمين الإعدادات (`$include`)

قسّم الإعدادات إلى عدة ملفات:
__OC_I18N_900103__
**سلوك الدمج:**

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمج بعمق بالترتيب (واللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` لـ `openclaw.json`). ويُسمح بالأشكال المطلقة/`../` فقط عندما تُحل مع ذلك داخل هذا الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
