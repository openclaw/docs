---
read_when:
    - تكوين Plugin قناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح الإعدادات لكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة أو سياسة المجموعات أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والإقران، ومفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والمزيد'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-04-30T16:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba14cb43e1fe914cc7c03f41bed1b5915cc6b2ad8e0f1d47f58b7e98c1b3915
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح التكوين الخاصة بكل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، والمفاتيح الخاصة بكل قناة في Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وPlugins القنوات المضمّنة الأخرى.

للوكلاء والأدوات ووقت تشغيل Gateway والمفاتيح العليا الأخرى، راجع
[مرجع التكوين](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم التكوين الخاص بها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو في مخزن السماح المقترن) |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة |

| سياسة المجموعة | السلوك |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المكوّنة فقط |
| `open`                | تجاوز قوائم السماح للمجموعات (تظل بوابة الإشارات مطبقة) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. تُحد طلبات اقتران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (غياب `channels.<provider>`)، فستعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المكوّنة. يُطبق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (مثلًا عند تعيينه عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك عبر المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد معيّنة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق من المرسلين المسموح لهم فقط)، و`allowlist_quote` (مثل قائمة السماح، لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في إخراج Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في إخراج Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض إخراج Heartbeat بنمط مؤشرات مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

- تعتمد الأوامر الصادرة افتراضيًا على الحساب `default` إذا كان موجودًا؛ وإلا فعلى أول معرّف حساب مكوّن (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي ذلك عندما يطابق معرّف حساب مكوّنًا.
- يُرحّل دليل مصادقة Baileys القديم للحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
- تجاوزات كل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، و`channels.whatsapp.accounts.<id>.dmPolicy`، و`channels.whatsapp.accounts.<id>.allowFrom`.

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

- رمز الروبوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` زائدة أُضيفت بالخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عند فقدانه أو كونه غير صالح.
- يمنع `configWrites: false` عمليات كتابة التكوين التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تهيئ إدخالات `bindings[]` العليا ذات `type: "acp"` ارتباطات ACP مستمرة لموضوعات المنتديات (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات بث Telegram `sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة ومحادثات المجموعات).
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
- تستخدم المكالمات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord ذلك الرمز المميز للمكالمة؛ وتظل إعدادات إعادة محاولة الحساب/السياسة مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون اختصارات الخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (بدون `#`). يُفضّل استخدام معرّفات الخوادم.
- يتم تجاهل الرسائل التي أنشأها البوت افتراضيًا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل البوت فقط عندما تذكر البوت (وتظل الرسائل الخاصة به مُرشّحة).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدمًا أو دورًا آخر دون ذكر البوت (باستثناء @everyone/@here).
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيوط (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّل ذلك)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل ذلك)
  - `spawnSubagentSessions`: مفتاح اشتراك لإنشاء/ربط الخيط تلقائيًا عبر `sessions_spawn({ thread: true })`
- تهيئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والانضمام التلقائي الاختياري + تجاوزات LLM + TTS.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لاستجابات قنوات Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE الخاصة بـ `@discordjs/voice` (`true` و`24` افتراضيًا).
- يحاول OpenClaw أيضًا استرداد استقبال الصوت بمغادرة جلسة صوتية وإعادة الانضمام إليها بعد إخفاقات فك تشفير متكررة.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. يتم ترحيل قيم `streamMode` القديمة وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحضور البوت (healthy => online، degraded => idle، exhausted => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true`، أو `false`، أو `"auto"` (افتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. ترسل `"dm"` (افتراضيًا) إلى الرسائل المباشرة للموافقين، وترسل `"channel"` إلى القناة الأصلية، وترسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من الموافقين الذين تم حلهم.
  - `cleanupAfterResolve`: عند `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعار التفاعل:** `off` (لا شيء)، `own` (رسائل البوت، افتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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

- JSON حساب الخدمة: مضمّن (`serviceAccount`) أو قائم على ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- احتياطيات البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة أساس البريد الإلكتروني القابلة للتغيير (وضع توافق كسر الزجاج).

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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كاحتياطي بيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` إضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل Socket Mode في Slack SDK إلى واجهة برمجة تطبيقات مستقبل Bolt العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket القديم.
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد، مثل
  `botTokenSource`، و`botTokenStatus`، و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مهيأ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة التهيئة التي تبدأ من Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي الخاص بـ Slack. يتم ترحيل قيم `streamMode` القديمة وقيم `streaming` المنطقية وقيم `nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعار التفاعل:** `off`، و`own` (افتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

**عزل جلسة الخيط:** يكون `thread.historyScope` لكل خيط (افتراضيًا) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى الخيوط الجديدة.

- يتطلب البث الأصلي في Slack مع حالة الخيط بنمط مساعد Slack "is typing..." هدف خيط للرد. تبقى الرسائل المباشرة ذات المستوى الأعلى خارج الخيط افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بنمط الخيط.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزًا قصيرًا لرموز Slack التعبيرية مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض الموافقين. المخطط نفسه مثل Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"`، أو `"channel"`، أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | تفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يأتي Mattermost كـ Plugin مضمن في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البناءات المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`؛ إذا أبلغ npm أن الحزمة
المملوكة لـ OpenClaw مهملة، فاستخدم Plugin المضمن أو نسخة محلية
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

أوضاع الدردشة: `oncall` (الرد عند @-mention، افتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة مشغّل).

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام رموز كل أمر التي يعيدها
  Mattermost أثناء تسجيل أمر slash. إذا فشل التسجيل أو لم يتم تفعيل أي
  أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/على tailnet/الداخليين، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، لا عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو رفض عمليات كتابة التهيئة التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الذكر لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

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

- `channels.signal.account`: يثبّت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: يسمح بكتابة الإعدادات التي يبدأها Signal أو يرفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنًا.

### BlueBubbles

BlueBubbles هو مسار iMessage الموصى به (مدعوم بـ Plugin، ومكوّن ضمن `channels.bluebubbles`).

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
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنًا.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP مستمرة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنًا.

- يتطلب Full Disk Access لقاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى مغلّف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP فحصًا صارمًا لمفاتيح المضيفين، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: يسمح بكتابة الإعدادات التي يبدأها iMessage أو يرفضها.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضًا مطبّعًا أو هدف محادثة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال مغلّف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ومكوّن ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة Matrix HTTP عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم المنازل الخاصة/الداخلية. `proxy` وهذا الاشتراك الشبكي عنصرَا تحكم مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف التي تتم دعوتك إليها والدعوات الجديدة بأسلوب الرسائل المباشرة حتى تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، يتم تفعيل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لإعادة توجيه الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة في جلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه، بينما `per-room` يعزل كل غرفة رسالة مباشرة.
- تستخدم فحوص حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها مثل حركة وقت التشغيل.
- تم توثيق إعداد Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ومكوّن ضمن `channels.msteams`.

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

IRC مدعوم بـ Plugin ومكوّن ضمن `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنًا.
- تم توثيق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارات) في [IRC](/ar/channels/irc).

### حسابات متعددة (كل القنوات)

شغّل عدة حسابات لكل قناة (لكل منها `accountId` الخاص به):

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

- يتم استخدام `default` عندما يُحذف `accountId` (CLI + التوجيه).
- لا تنطبق رموز البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة الأولي) بينما لا تزال على إعداد قناة أحادية الحساب في المستوى الأعلى، فإن OpenClaw يرقّي أولًا قيم الحساب الواحد ذات المستوى الأعلى والمرتبطة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ يمكن لـ Matrix بدلًا من ذلك الاحتفاظ بهدف مسمى/افتراضي مطابق موجود.
- تستمر الارتباطات الحالية المقتصرة على القناة (بدون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات ذات نطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة بنقل قيم الحساب الواحد ذات المستوى الأعلى والمرتبطة بنطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ يمكن لـ Matrix بدلًا من ذلك الاحتفاظ بهدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin أخرى

تُكوَّن العديد من قنوات Plugin على أنها `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارات في دردشة المجموعة

تتطلب رسائل المجموعة افتراضيًا **إشارة** (إشارة بيانات وصفية أو أنماط regex آمنة). ينطبق ذلك على محادثات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

يتم التحكم في الردود المرئية بشكل منفصل. غرف المجموعات/القنوات تستخدم افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`: لا يزال OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. عيّن `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى إلى الغرفة. لتطبيق سلوك الردود المرئية عبر الأداة فقط نفسه على الدردشات المباشرة أيضًا، عيّن `messages.visibleReplies: "message_tool"`.

يعيد Gateway تحميل إعداد `messages` تلقائيًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعداد معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية للمنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا تُفرض بوابة الإشارات إلا عندما يكون الكشف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يعيّن `messages.groupChat.historyLimit` القيمة الافتراضية العامة. يمكن للقنوات تجاوز ذلك باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدور المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأدوار المصدر في المجموعات/القنوات. لا تزال قوائم سماح القنوات وبوابة الإشارات تحدد ما إذا كان سيتم معالجة الدور.

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

التحليل: تجاوز لكل رسالة مباشرة → الافتراضي لدى المزوّد → بلا حد (يتم الاحتفاظ بالكل).

مدعوم: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

- يضبط هذا المقطع أسطح الأوامر. للاطلاع على كتالوج الأوامر المدمجة + المرفقة الحالي، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعداد**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، وLINE `/card`، وإقران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` موثقة في صفحات القناة/Plugin الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية في Discord/Telegram، ويُبقي Slack معطلاً.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية في Discord/Telegram، ويُبقي Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقاً.
- تجاوز تسجيل Skills الأصلي لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الصيغة `! <cmd>` لصدفة المضيف. يتطلب ذلك `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء `chat.send` في Gateway، تتطلب عمليات الكتابة الدائمة عبر `/config set|unset` أيضاً `operator.admin`؛ ويبقى الأمر `/config show` للقراءة فقط متاحاً لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في تفعيلها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعداد لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضاً في عمليات الكتابة التي تستهدف ذلك الحساب (مثلاً `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات المخصصة للمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرفات المالك في موجّه النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل مزود. عند ضبطه، يكون هو **مصدر التخويل الوحيد** (يتم تجاهل قوائم السماح/الإقران الخاصة بالقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطاً.
- خريطة توثيق الأوامر:
  - الكتالوج المدمج + المرفق: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعداد](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعداد — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
