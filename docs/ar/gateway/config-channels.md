---
read_when:
    - تكوين Plugin للقناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح التهيئة الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والإقران، ومفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-06T17:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح الإعدادات الخاصة بكل قناة ضمن `channels.*`. تغطي الوصول عبر الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارة بالذكر، والمفاتيح الخاصة بكل قناة في Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وملحقات القنوات المضمّنة الأخرى.

للوكلاء والأدوات ووقت تشغيل Gateway والمفاتيح العلوية الأخرى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائياً عند وجود قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول عبر الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون فقط في `allowFrom` (أو مخزن السماح المقترن) |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة |

| سياسة المجموعة | السلوك |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المضبوطة فقط |
| `open`                | تجاوز قوائم السماح للمجموعات (تبقى بوابة الإشارة بالذكر مطبقة) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد مضبوطة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. تُحد طلبات إقران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (غياب `channels.<provider>`)، تعود سياسة المجموعة في وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المضبوطة. يُطبق تعيين القنوات عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (مثلاً، عند ضبطه عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك بين المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد مضبوطة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/المحادثة الفرعية/السجل)، و`allowlist` (تضمين السياق من المرسلين المسموحين فقط)، و`allowlist_quote` (مثل قائمة السماح لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بنمط مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائياً عند وجود جلسة مرتبطة.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
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
}
```

<Accordion title="Multi-account WhatsApp">

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

- تُوجَّه الأوامر الصادرة افتراضياً إلى الحساب `default` إذا كان موجوداً؛ وإلا فإلى أول معرّف حساب مضبوط (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مضبوطاً.
- يُرحَّل دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، و`channels.whatsapp.accounts.<id>.dmPolicy`، و`channels.whatsapp.accounts.<id>.allowFrom`.

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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية في النهاية.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط افتراضياً صريحاً (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما يكون ذلك مفقوداً أو غير صالح.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تضبط إدخالات `bindings[]` العلوية ذات `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتديات (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تستخدم معاينات بث Telegram `sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة والجماعية).
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
      streaming: "off", // off | partial | block | progress
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord ذلك الرمز المميز للاستدعاء؛ ولا تزال إعدادات إعادة محاولة الحساب/السياسة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة نقابة) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون اختصارات النقابات بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (بلا `#`). يُفضَّل استخدام معرفات النقابات.
- تُتجاهل الرسائل المنشأة بواسطة البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ استخدم `allowBots: "mentions"` لقبول رسائل البوتات التي تذكر البوت فقط (مع استمرار ترشيح رسائله الذاتية).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر لكنها لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر الثابت بمعرفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر أعضاء الفريق المعروفين بشكل حتمي حتى عندما تكون ذاكرة التخزين المؤقتة المؤقتة للدليل فارغة. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون دون 2000 حرف.
- يتحكم `channels.discord.threadBindings` في توجيه Discord المرتبط بسلاسل النقاش:
  - `enabled`: تجاوز Discord لميزات الجلسة المرتبطة بسلسلة النقاش (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز تلقائيًا عند عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSessions`: مفتاح لـ `sessions_spawn({ thread: true })` وإنشاء/ربط سلاسل النقاش تلقائيًا عند تفريخ سلاسل ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات التفريخ المرتبطة بسلسلة النقاش (الافتراضي `"fork"`)
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات وسلاسل النقاش (استخدم معرف القناة/سلسلة النقاش في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والتجاوزات الاختيارية للانضمام التلقائي + LLM + TTS. تترك إعدادات Discord النصية فقط الصوت معطّلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لاستجابات قناة Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيًا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيًا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوتية منقطعة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيًا).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد إخفاقات فك تشفير متكررة.
- `channels.discord.streaming` هو مفتاح وضع البث الرسمي. تبقى قيم `streamMode` القديمة و`streaming` المنطقية أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحالة حضور البوت (healthy => online، degraded => idle، exhausted => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين المحلولين.
  - `cleanupAfterResolve`: عند `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (لا شيء)، `own` (رسائل البوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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

- حساب الخدمة بصيغة JSON: مضمن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- احتياطيات البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة أصل البريد الإلكتروني القابلة للتغيير (وضع توافق كسر الزجاج).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
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

- **وضع Socket** يتطلب كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كاحتياطي بيئة للحساب الافتراضي).
- **وضع HTTP** يتطلب `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل وضع Socket في Slack SDK إلى واجهة مستقبل Bolt العامة. استخدمه فقط عند التحقيق في انتهاء مهلة ping/pong أو سلوك websocket القديم.
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تكشف لقطات حساب Slack حقول مصدر/حالة لكل اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. يعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يستطع
  حل قيمة السر.
- يمنع `configWrites: false` كتابات الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack الرسمي. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تبقى قيم `streamMode` القديمة و`streaming` المنطقية و`nativeStreaming` أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسة سلسلة النقاش:** يكون `thread.historyScope` لكل سلسلة نقاش (الافتراضي) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` سجل القناة الأصلية إلى سلاسل النقاش الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة سلسلة النقاش بأسلوب مساعد Slack "is typing..." هدف سلسلة نقاش للرد. تبقى الرسائل المباشرة ذات المستوى الأعلى خارج سلاسل النقاش افتراضيًا، لذلك يمكنها الاستمرار في البث عبر معاينات مسودة Slack بالنشر والتحرير بدلًا من عرض معاينة البث/الحالة الأصلية بأسلوب سلسلة النقاش.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزًا قصيرًا لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض الموافقين. المخطط نفسه كما في Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مُمكّن | التفاعل + سرد التفاعلات |
| messages     | مُمكّن | قراءة/إرسال/تحرير/حذف  |
| pins         | مُمكّن | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مُمكّن | معلومات العضو            |
| emojiList    | مُمكّن | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يُشحن Mattermost كـ Plugin مرفق في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البُنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. راجع
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
لمعرفة dist-tags الحالية قبل تثبيت إصدار محدد.

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

أوضاع المحادثة: `oncall` (الرد عند @-mention، الافتراضي)، `onmessage` (كل رسالة)، `onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يحلّ `commands.callbackUrl` إلى نقطة نهاية OpenClaw Gateway وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز المميزة الخاصة بكل أمر والتي يعيدها
  Mattermost أثناء تسجيل أمر slash. إذا فشل التسجيل أو لم يتم تفعيل أي
  أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/ضمن tailnet/الداخليين، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: اسمح بكتابات الإعدادات التي يبدأها Mattermost أو ارفضها.
- `channels.mattermost.requireMention`: اشترط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز اشتراط الذكر لكل قناة (`"*"` للوضع الافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.

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

**أوضاع إشعارات التفاعل:** `off`، `own` (افتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: ثبّت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: اسمح بكتابات الإعدادات التي يبدأها Signal أو ارفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.

### BlueBubbles

BlueBubbles هو مسار iMessage الموصى به (مدعوم بـ Plugin، ومضبوط ضمن `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى التي تحتوي على `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تم توثيق إعداد قناة BlueBubbles الكامل في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.

- يتطلب وصولًا كاملًا إلى القرص لقاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP فحصًا صارمًا لمفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: اسمح بكتابات الإعدادات التي يبدأها iMessage أو ارفضها.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى التي تحتوي على `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضًا مطبّعًا أو هدف محادثة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ومضبوط ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة مرور HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. `proxy` وهذا الاشتراك الاختياري في الشبكة عنصران تحكميان مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها والدعوات الجديدة بنمط الرسائل المباشرة حتى تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضي). في الوضع التلقائي، تتفعل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (افتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix ضمن الجلسات: `per-user` (افتراضي) يشارك حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات بحث الدليل الحية سياسة الوكيل نفسها مثل حركة مرور وقت التشغيل.
- تم توثيق إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ومضبوط ضمن `channels.msteams`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.msteams`، `channels.msteams.configWrites`.
- تم توثيق إعداد Teams الكامل (بيانات الاعتماد، Webhook، سياسة الرسائل المباشرة/المجموعات، التجاوزات لكل فريق/لكل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ومضبوط ضمن `channels.irc`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.
- تم توثيق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/اشتراط الذكر) في [IRC](/ar/channels/irc).

### حسابات متعددة (كل القنوات)

شغّل عدة حسابات لكل قناة (كل حساب له `accountId` خاص به):

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

- يُستخدم `default` عندما يُحذف `accountId` (CLI + التوجيه).
- تنطبق رموز env المميزة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو تهيئة القناة) بينما لا تزال على إعداد قناة ذي مستوى أعلى لحساب واحد، يرقّي OpenClaw أولًا القيم ذات المستوى الأعلى الخاصة بحساب واحد والمحددة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر الربوط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الربوط المحددة بنطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عبر نقل القيم ذات المستوى الأعلى الخاصة بحساب واحد والمحددة بنطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin أخرى

يتم ضبط العديد من قنوات Plugin بصيغة `channels.<id>` وتوثيقها في صفحات القنوات المخصصة لها (مثل Feishu، وMatrix، وLINE، وNostr، وZalo، وNextcloud Talk، وSynology Chat، وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### اشتراط الذكر في دردشة المجموعة

تتطلب رسائل المجموعات افتراضيًا **ذكرًا** (ذكرًا في البيانات الوصفية أو أنماط regex آمنة). ينطبق ذلك على WhatsApp، وTelegram، وDiscord، وGoogle Chat، ودردشات مجموعات iMessage.

يتم التحكم في الردود المرئية بشكل منفصل. القيمة الافتراضية لغرف المجموعات/القنوات هي `messages.groupChat.visibleReplies: "message_tool"`: يظل OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. عيّن `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق سلوك الرد المرئي المقتصر على الأداة نفسه على الدردشات المباشرة أيضًا، عيّن `messages.visibleReplies: "message_tool"`؛ كما يستخدم حزام Codex هذا السلوك المقتصر على الأداة كافتراضي غير معيّن للدردشة المباشرة.

تتطلب الردود المرئية المقتصرة على الأداة نموذجًا/وقت تشغيل يستدعي الأدوات بشكل موثوق. إذا
أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن
النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء أداة الرسائل.
انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو عيّن
`messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية القديمة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعداد `messages` تحميلًا ساخنًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

**أنواع الذكر:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. تُتجاهل في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرارات المتداخلة غير الآمنة.
- لا يُفرض اشتراط الإشارة إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

يضبط `messages.groupChat.historyLimit` الإعداد الافتراضي العام. يمكن للقنوات التجاوز باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدوران المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لدورات مصدر المجموعة/القناة. عندما يكون `messages.visibleReplies` غير مضبوط، يمكن لحاضنة أن توفر إعدادها الافتراضي المباشر/المصدر الخاص بها؛ تضبط حاضنة Codex الإعداد الافتراضي إلى `message_tool`. لا تزال قوائم السماح للقنوات واشتراط الإشارة تحدد ما إذا كانت الدورة ستُعالج.

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

الحل: تجاوز لكل رسالة مباشرة → الإعداد الافتراضي للموفر → بلا حد (يُحتفظ بكل شيء).

مدعوم: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

- تهيئ هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر الحالي المدمج + المرفق، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع مفاتيح إعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل أوامر QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وأمر LINE ‏`/card`، وأمر إقران الجهاز `/pair`، وأمر الذاكرة `/dreaming`، وأمر التحكم بالهاتف `/phone`، وأمر Talk ‏`/voice` موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون أوامر النص رسائل **مستقلة** تبدأ بـ `/`.
- يشغّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يشغّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، يتخطى `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` استخدام `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء `chat.send` في Gateway، تتطلب عمليات الكتابة الدائمة لـ `/config set|unset` أيضًا `operator.admin`؛ ويبقى أمر القراءة فقط `/config show` متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار من OpenClaw تحت `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيته وعناصر التحكم في التفعيل/التعطيل.
- يتحكم `channels.<provider>.configWrites` في تغييرات الإعدادات لكل قناة (الإعداد الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الإعداد الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات المخصصة للمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في موجه النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل موفر. عند ضبطه، يكون هو مصدر التخويل **الوحيد** (تُتجاهل قوائم سماح القنوات/الإقران و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة مستندات الأوامر:
  - الكتالوج المدمج + المرفق: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
