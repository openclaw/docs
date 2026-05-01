---
read_when:
    - تكوين Plugin خاص بالقناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح الإعدادات لكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-01T07:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce1571d51e026182d49b935780a986780a90b05afc0acca027b2541b80a1aac2
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح التكوين لكل قناة تحت `channels.*`. يغطي الوصول عبر الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات بالذكر، والمفاتيح الخاصة بكل قناة لـ Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات المضمنة.

بالنسبة إلى الوكلاء والأدوات وتشغيل Gateway والمفاتيح العليا الأخرى، راجع
[مرجع التكوين](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيا عندما يكون قسم التكوين الخاص بها موجودا (ما لم يكن `enabled: false`).

### الوصول عبر الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (افتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون فقط في `allowFrom` (أو مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (افتراضي) | المجموعات المطابقة لقائمة السماح المكونة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (تظل بوابة الإشارات بالذكر مطبقة) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما تكون `groupPolicy` لمزود غير معينة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. يتم تحديد طلبات إقران الرسائل المباشرة المعلقة بحد أقصى **3 لكل قناة**.
إذا كانت كتلة مزود مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات وقت التشغيل إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكونة. يطبق تعيين القناة عندما لا تملك الجلسة بالفعل تجاوزا للنموذج (على سبيل المثال، مضبوطا عبر `/model`).

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

### إعدادات القنوات الافتراضية وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك عبر المزودين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما تكون `groupPolicy` على مستوى المزود غير معينة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (افتراضي، تضمين كل سياق الاقتباس/الخيط/السجل)، `allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، `allowlist_quote` (مثل قائمة السماح لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بنمط مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp من خلال قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائيا عندما توجد جلسة مرتبطة.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيا إذا كان موجودا؛ وإلا تستخدم أول معرف حساب مكون (مرتبا).
- يجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرف حساب مكونا.
- يتم ترحيل دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
- التجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، و`channels.whatsapp.accounts.<id>.dmPolicy`، و`channels.whatsapp.accounts.<id>.allowFrom`.

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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ يتم رفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل الخاص بك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` زائدة أضيفت بالخطأ.
- يجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكونا.
- في إعدادات الحسابات المتعددة (معرفا حساب أو أكثر)، عيّن افتراضيا صريحا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما يكون هذا مفقودا أو غير صالح.
- يمنع `configWrites: false` عمليات كتابة التكوين التي تبدأ من Telegram (ترحيلات معرفات المجموعات الفائقة، `/config set|unset`).
- تهيئ إدخالات `bindings[]` العليا ذات `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتديات (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). تتم مشاركة دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
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

- الرمز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر Discord `token` صريحًا ذلك الرمز للاستدعاء؛ وتظل إعدادات إعادة محاولة الحساب/السياسة مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة نقابة) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون أسماء النقابات المختصرة بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضّل استخدام معرّفات النقابات.
- تُتجاهل الرسائل التي أنشأها البوت افتراضيًا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل البوتات التي تذكر البوت فقط (مع استمرار تصفية رسائله الذاتية).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر لكن لا تذكر البوت (باستثناء @everyone/@here).
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 محرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسة المرتبطة بالسلاسل (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، والتسليم/التوجيه المرتبطين)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّل ذلك)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل ذلك)
  - `spawnSubagentSessions`: مفتاح اشتراك لإنشاء/ربط السلاسل تلقائيًا عبر `sessions_spawn({ thread: true })`
- تكوّن إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية وخيارات الانضمام التلقائي + LLM + TTS الاختيارية.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لردود قنوات Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` خيارات DAVE إلى `@discordjs/voice` (`true` و`24` افتراضيًا).
- يحاول OpenClaw أيضًا استرداد استقبال الصوت عبر مغادرة جلسة صوتية وإعادة الانضمام إليها بعد تكرار إخفاقات فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث المعتمد. تُرحّل قيم `streamMode` القديمة وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحالة حضور البوت (healthy => online، degraded => idle، exhausted => dnd) ويتيح تجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند إهمالها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو تعبير نمطي).
  - `target`: المكان الذي تُرسل إليه مطالبات الموافقة. يرسل `"dm"` (افتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، تكون الأزرار قابلة للاستخدام فقط من الموافقين الذين تم حلهم.
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

- حساب الخدمة JSON: مضمّن (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- بدائل البيئة الاحتياطية: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة هوية البريد الإلكتروني القابلة للتغيير (وضع توافق كسر الزجاج).

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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كبديل بيئة احتياطي للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل Slack SDK Socket Mode إلى واجهة Bolt receiver API العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket قديم.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تكشف لقطات حساب Slack حقول مصدر/حالة لكل اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. يعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack المعتمد. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تُرحّل قيم `streamMode` القديمة، وقيم `streaming` المنطقية، وقيم `nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off`، و`own` (افتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (افتراضيًا) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack وحالة سلسلة نمط مساعد Slack "is typing..." هدف سلسلة رد. تبقى الرسائل المباشرة ذات المستوى الأعلى خارج السلاسل افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بنمط السلسلة.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزًا مختصرًا لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض الموافقين. المخطط نفسه مثل Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يأتي Mattermost باعتباره Plugin مضمنًا في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`؛ إذا أبلغ npm أن
الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم Plugin المضمن أو نسخة محلية
إلى أن تُنشر حزمة npm أحدث.

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

أوضاع المحادثة: `oncall` (يرد عند @-mention، افتراضيًا)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`) لا عنوان URL كاملًا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية Gateway في OpenClaw وأن يكون قابلًا للوصول من خادم Mattermost.
- تُصادَق استدعاءات الشرطة المائلة الأصلية باستخدام الرموز الخاصة بكل أمر التي يعيدها
  Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم
  تُفعّل أي أوامر، يرفض OpenClaw الاستدعاءات بالرسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/على tailnet/الداخليين، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، لا عناوين URL كاملة.
- `channels.mattermost.configWrites`: يسمح أو يرفض عمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: يتطلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الذكر لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.

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

**أوضاع إشعارات التفاعل:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: ثبّت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: اسمح بكتابات الإعدادات التي يبدأها Signal أو ارفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### BlueBubbles

BlueBubbles هو مسار iMessage الموصى به (مدعوم بـ Plugin، ومهيأ ضمن `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يمكن لمدخلات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP مستمرة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- وُثّق إعداد قناة BlueBubbles الكامل في [BlueBubbles](/ar/channels/bluebubbles).

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققا صارما من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: اسمح بكتابات الإعدادات التي يبدأها iMessage أو ارفضها.
- يمكن لمدخلات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضا مطبعا أو هدف محادثة صريحا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ومهيأ ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. `proxy` وهذا الاشتراك الصريح في الشبكة عنصران مستقلان للتحكم.
- يختار `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- يكون `channels.matrix.autoJoin` افتراضيا `off`، لذا يتم تجاهل الغرف المدعو إليها والدعوات الجديدة بنمط الرسائل المباشرة إلى أن تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: ‏`true`، أو `false`، أو `"auto"` (الافتراضي). في الوضع التلقائي، يتم تفعيل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة المنشئة)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة في جلسات: يشارك `per-user` (الافتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة في حركة وقت التشغيل.
- وُثّقت إعدادات Matrix الكاملة، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ومهيأ ضمن `channels.msteams`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams`، `channels.msteams.configWrites`.
- وُثّقت إعدادات Teams الكاملة (بيانات الاعتماد، Webhook، سياسة الرسائل المباشرة/المجموعات، والتجاوزات لكل فريق/قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ومهيأ ضمن `channels.irc`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- وُثّق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الإشارات) في [IRC](/ar/channels/irc).

### حسابات متعددة (كل القنوات)

شغّل حسابات متعددة لكل قناة (لكل منها `accountId` الخاص بها):

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
- لا تنطبق رموز البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابا غير افتراضي عبر `openclaw channels add` (أو أثناء إعداد القناة) بينما ما زلت على إعداد قناة من مستوى أعلى بحساب واحد، يرفع OpenClaw القيم ذات المستوى الأعلى الخاصة بالحساب الواحد والمحددة بنطاق الحساب إلى خريطة حسابات القناة أولا حتى يظل الحساب الأصلي يعمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix أن يحافظ بدلا من ذلك على هدف مسمى/افتراضي مطابق موجود.
- تظل الارتباطات الحالية الخاصة بالقناة فقط (بدون `accountId`) مطابقة للحساب الافتراضي؛ وتظل الارتباطات المحددة بنطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضا الأشكال المختلطة بنقل القيم ذات المستوى الأعلى الخاصة بالحساب الواحد والمحددة بنطاق الحساب إلى الحساب المرفوع المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix أن يحافظ بدلا من ذلك على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin أخرى

تُهيأ قنوات Plugin كثيرة بصيغة `channels.<id>` وتوثق في صفحات القنوات المخصصة لها (على سبيل المثال Feishu، وMatrix، وLINE، وNostr، وZalo، وNextcloud Talk، وSynology Chat، وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الإشارات في محادثات المجموعات

تتطلب رسائل المجموعات افتراضيا **إشارة إلزامية** (إشارة بيانات وصفية أو أنماط regex آمنة). ينطبق ذلك على محادثات مجموعات WhatsApp، وTelegram، وDiscord، وGoogle Chat، وiMessage.

يتم التحكم في الردود المرئية بشكل منفصل. تكون غرف المجموعات/القنوات افتراضيا `messages.groupChat.visibleReplies: "message_tool"`: يظل OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. عيّن `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق سلوك الرد المرئي المقتصر على الأداة نفسه على المحادثات المباشرة أيضا، عيّن `messages.visibleReplies: "message_tool"`.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلا من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعدادات `messages` فوريا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع المحادثة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يفرض تقييد الإشارات إلا عندما يكون الكشف ممكنا (إشارات أصلية أو نمط واحد على الأقل).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

يضبط `messages.groupChat.historyLimit` الافتراضي العام. يمكن للقنوات التجاوز باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن `0` للتعطيل.

`messages.visibleReplies` هو الافتراضي العام لدور المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأدوار مصادر المجموعات/القنوات. ما تزال قوائم السماح في القنوات وتقييد الإشارات تحدد ما إذا كان سيتم معالجة الدور.

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

الحل: تجاوز لكل رسالة مباشرة → افتراضي المزود → بلا حد (كلها محفوظة).

مدعوم: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### وضع المحادثة الذاتية

أدرج رقمك الخاص في `allowFrom` لتمكين وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يرد إلا على أنماط النص):

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

### الأوامر (معالجة أوامر المحادثة)

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

- تضبط هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر الحالي المدمج + المرفق، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقناة/Plugin مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، وLINE `/card`، وdevice-pair `/pair`، وmemory `/dreaming`، وphone-control `/phone`، وTalk `/voice` موثقة في صفحات القناة/Plugin الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الصيغة `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (قراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء Gateway `chat.send`، تتطلب عمليات الكتابة الدائمة `/config set|unset` أيضًا `operator.admin`؛ ويبقى `/config show` للقراءة فقط متاحًا لعملاء المشغل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار من OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugins وتثبيتها وعناصر التحكم في تفعيلها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في تعديلات الإعدادات لكل قناة (الافتراضي: true).
- في القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات المخصصة للمالك فقط. وهي منفصلة عن `allowFrom`.
- يؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في مطالبة النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل مزود. عند تعيينه، يكون هو مصدر التخويل **الوحيد** (يتم تجاهل قوائم السماح/الإقران الخاصة بالقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معينًا.
- خريطة وثائق الأوامر:
  - الكتالوج المدمج + المرفق: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
