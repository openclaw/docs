---
read_when:
    - تكوين Plugin قناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح إعدادات كل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تهيئة القنوات: التحكم في الوصول، والإقران، ومفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-06-27T17:35:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح الإعداد لكل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، والمفاتيح الخاصة بكل قناة في Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات المضمنة.

بالنسبة إلى الوكلاء والأدوات ووقت تشغيل Gateway والمفاتيح العلوية الأخرى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم الإعداد الخاص بها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب على المالك الموافقة |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات التي تطابق قائمة السماح المكوّنة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (تظل بوابة الإشارات مطبقة) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد مضبوطة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. تُحد طلبات إقران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كان حظر المزوّد مفقودًا بالكامل (`channels.<provider>` غير موجود)، تعود سياسة مجموعة وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة أو أقران الرسائل المباشرة على نموذج. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكوّنة. يُطبق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (على سبيل المثال، مضبوط عبر `/model`).

بالنسبة إلى محادثات المجموعات/الخيوط، تكون المفاتيح معرّفات مجموعات خاصة بالقناة، أو معرّفات مواضيع، أو أسماء قنوات. بالنسبة إلى محادثات الرسائل المباشرة (DM)، تكون المفاتيح معرّفات أقران مشتقة من هوية مرسل القناة (`nativeDirectUserId` أو `origin.from` أو `origin.to` أو `OriginatingTo` أو `From` أو `SenderId`). يعتمد شكل المفتاح الدقيق على القناة:

| القناة  | شكل مفتاح الرسالة المباشرة         | مثال                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | معرّف المستخدم الخام         | `123456789`                                  |
| Discord  | معرّف المستخدم الخام         | `987654321`                                  |
| WhatsApp | رقم الهاتف أو JID | `15551234567`                                |
| Matrix   | معرّف مستخدم Matrix      | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

لا تتطابق المفاتيح الخاصة بالرسائل المباشرة إلا في محادثات الرسائل المباشرة؛ ولا تؤثر في توجيه المجموعات/الخيوط.

### افتراضيات القنوات وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعة وHeartbeat المشترك عبر المزوّدين:

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
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباسات/الخيوط/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل قائمة السماح ولكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مدمجة بأسلوب المؤشرات.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

- تهيئ إدخالات `bindings[]` العلوية ذات `type: "acp"` روابط ACP دائمة لرسائل WhatsApp المباشرة ومجموعاته. استخدم رقمًا مباشرًا بصيغة E.164 أو JID مجموعة WhatsApp في `match.peer.id`. دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

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

- تُوجَّه الأوامر الصادرة افتراضيًا إلى الحساب `default` إذا كان موجودًا؛ وإلا فإلى أول معرّف حساب مكوّن (مرتّب).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مكوّنًا.
- يُهاجَر دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل الخاص بك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` زائدة بالخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يحظر `configWrites: false` عمليات كتابة الإعداد التي تبدأ من Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تهيئ إدخالات `bindings[]` العلوية ذات `type: "acp"` روابط ACP دائمة لمواضيع المنتديات (استخدم `chatId:topic:topicId` القانوني في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحا لـ Discord ذلك الرمز المميز للاستدعاء؛ ولا تزال إعدادات إعادة المحاولة/السياسة للحساب تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون اختصارات الخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (بدون `#`). فضّل معرّفات الخوادم.
- يتم تجاهل الرسائل التي كتبها البوت افتراضيا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (تظل الرسائل الذاتية مصفّاة).
- يمكن للقنوات التي تدعم الرسائل الواردة المكتوبة بواسطة البوت استخدام [حماية حلقة البوت](/ar/channels/bot-loop-protection) المشتركة. عيّن `channels.defaults.botLoopProtection` لميزانيات الأزواج الأساسية، ثم تجاوز القناة أو الحساب فقط عندما يحتاج سطح واحد إلى حدود مختلفة.
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدما آخر أو دورا آخر لكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر المستقر بمعرّفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر أعضاء الفريق المعروفين بحتمية حتى عندما تكون ذاكرة التخزين المؤقت للدليل العابر فارغة. توجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسّم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون دون 2000 حرف.
- يكون `channels.discord.suppressEmbeds` افتراضيا `true`، لذلك لا تتوسع عناوين URL الصادرة إلى معاينات روابط Discord ما لم يتم تعطيله. تظل حمولات `embeds` الصريحة تُرسل بشكل طبيعي؛ ويمكن لاستدعاءات الأدوات لكل رسالة التجاوز باستخدام `suppressEmbeds`.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسة المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي عند عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSessions`: مفتاح تبديل لـ `sessions_spawn({ thread: true })` وإنشاء/ربط سلاسل ACP التلقائي عند إنشاء سلسلة (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` افتراضيا)
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` روابط ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يعيّن `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المرسلة مسجلة. القيمة الافتراضية هي `1800000` (30 دقيقة)، والحد الأقصى هو `86400000` (24 ساعة)، وتوجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. القيم الأطول تبقي الأزرار/القوائم/النماذج القديمة قابلة للاستخدام لمدة أطول، لذلك فضّل أقصر TTL يناسب سير العمل.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والانضمام التلقائي الاختياري وتجاوزات LLM وTTS. تترك إعدادات Discord النصية فقط الصوت معطّلا افتراضيا؛ عيّن `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريا نموذج LLM المستخدم لاستجابات قناة Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار `@discordjs/voice` الأولي لحالة Ready لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي قد تستغرقها جلسة صوتية منقطعة للدخول في إشارة إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيا).
- لا تتم مقاطعة تشغيل صوت Discord بسبب حدث بدء تحدث مستخدم آخر. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد فشل فك التشفير المتكرر.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. تكون إعدادات Discord الافتراضية `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة معدلة؛ عيّن `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة وقيم `streaming` المنطقية أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحضور البوت (سليم => متصل، متدهور => خامل، مستنفد => dnd) ويسمح بتجاوزات نص الحالة الاختيارية.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلي في Discord وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى رسائل الموافقين المباشرة، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، تكون الأزرار قابلة للاستخدام فقط بواسطة الموافقين المحلولين.
  - `cleanupAfterResolve`: عندما تكون `true`، تحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

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

- JSON حساب الخدمة: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضا (`serviceAccountRef`).
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
      unfurlLinks: false,
      unfurlMedia: false,
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

- يتطلب **وضع Socket** كلاً من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كاحتياطي افتراضي لبيئة الحساب).
- يتطلب **وضع HTTP** وجود `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرّر `socketMode` ضبط نقل Slack SDK Socket Mode إلى واجهة Bolt receiver API العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket قديم. القيمة الافتراضية لـ`clientPingTimeout` هي `15000`؛ ولا يتم تمرير `serverPingTimeout` و`pingPongLoggingEnabled` إلا عند تكوينهما.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تكشف لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد، مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef، لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يحظر `configWrites: false` عمليات كتابة التكوين التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تبقى قيم `streamMode` القديمة، و`streaming` المنطقية، و`nativeStreaming` كأسماء بديلة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة التكوين المحفوظ.
- يمرّر `unfurlLinks` و`unfurlMedia` قيم Slack المنطقية لفرد الروابط والوسائط في `chat.postMessage` لردود البوت. القيمة الافتراضية لـ`unfurlLinks` هي `false` كي لا تتوسع روابط البوت الصادرة داخل السطر ما لم يتم تمكين ذلك؛ ويتم حذف `unfurlMedia` ما لم يكن مكوّناً. عيّن أي قيمة منهما في `channels.slack.accounts.<accountId>` لتجاوز قيمة المستوى الأعلى لحساب واحد.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off`، `own` (افتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسة السلسلة:** يكون `thread.historyScope` لكل سلسلة (افتراضي) أو مشتركاً عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى السلاسل الجديدة.

- يتطلب بث Slack الأصلي وحالة سلسلة نمط مساعد Slack "جارٍ بالكتابة..." هدف سلسلة رد. تبقى الرسائل المباشرة في المستوى الأعلى خارج السلسلة افتراضياً، لذلك يمكنها الاستمرار في البث عبر معاينات منشور Slack المسودة وتحريرها بدلاً من إظهار معاينة البث/الحالة الأصلية بنمط السلسلة.
- يضيف `typingReaction` تفاعلاً مؤقتاً إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزاً مختصراً لرمز Slack التعبيري مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم عميل الموافقة الأصلي في Slack وتفويض موافق exec. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`). يمكن لموافقات Plugin استخدام مسار العميل الأصلي هذا لطلبات Slack الأصل عندما يتم حل موافقي Slack plugin؛ ويمكن أيضاً تمكين تسليم موافقة Plugin الأصلي في Slack عبر `approvals.plugin` لجلسات Slack الأصل أو أهداف Slack. تستخدم موافقات Plugin موافقي Slack plugin من `allowFrom` والتوجيه الافتراضي، وليس موافقي exec.

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | تفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة رموز تعبيرية مخصصة      |

### Mattermost

يُشحن Mattermost كـPlugin مضمّن في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. راجع
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
لوسوم dist-tags الحالية قبل تثبيت إصدار محدد.

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

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مساراً (مثلاً `/api/channels/mattermost/command`)، وليس عنوان URL كاملاً.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية OpenClaw gateway وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash callbacks الأصلية باستخدام رموز كل أمر التي يعيدها
  Mattermost أثناء تسجيل slash command. إذا فشل التسجيل أو لم يتم تنشيط أي
  أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/داخل tailnet/الداخليين، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح أو رفض عمليات كتابة التكوين التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز حجب الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
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

**أوضاع إشعارات التفاعلات:** `off`، `own` (افتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو رفض عمليات كتابة التكوين التي يبدأها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم daemon أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw iMessage الجديدة عندما يستطيع المضيف منح أذونات قاعدة بيانات Messages وAutomation.

تمت إزالة دعم BlueBubbles. لا يُعد `channels.bluebubbles` سطح تكوين وقت تشغيل مدعوماً في OpenClaw الحالي. انقل التكوينات القديمة إلى `channels.imessage`؛ استخدم [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) للنسخة المختصرة و[القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) لجدول الترجمة الكامل.

إذا لم يكن Gateway يعمل على Mac المسجل الدخول إلى Messages، فأبقِ `channels.imessage.enabled=true` واضبط `channels.imessage.cliPath` على مغلف SSH يشغّل `imsg "$@"` على ذلك Mac. مسار `imsg` المحلي الافتراضي مخصص لـmacOS فقط.

قبل الاعتماد على مغلف SSH للإرسال في الإنتاج، تحقق من إرسال `imsg send` صادر عبر ذلك المغلف نفسه. بعض حالات macOS TCC تسند Messages Automation إلى `/usr/libexec/sshd-keygen-wrapper`، ما قد يجعل القراءات والفحوصات تعمل بينما يفشل الإرسال مع AppleEvents `-1743`؛ راجع [تفشل عمليات إرسال مغلف SSH مع AppleEvents -1743](/ar/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّن.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى مغلف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (افتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP فحصاً صارماً لمفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقاً في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو رفض عمليات كتابة التكوين التي يبدأها iMessage.
- `channels.imessage.sendTransport`: نقل إرسال `imsg` RPC المفضل للردود الصادرة العادية. يستخدم `auto` (افتراضي) جسر IMCore للدردشات القائمة عندما يكون قيد التشغيل، ثم يعود إلى AppleScript؛ يتطلب `bridge` تسليماً عبر private-API؛ ويفرض `applescript` مسار Automation العام في Messages.
- `channels.imessage.actions.*`: تمكين إجراءات private API التي تخضع أيضاً لبوابة `imsg status` / `openclaw channels status --probe`.
- يكون `channels.imessage.includeAttachments` متوقفاً افتراضياً؛ اضبطه على `true` قبل توقع الوسائط الواردة في دورات الوكيل.
- يكون الاسترداد الوارد بعد إعادة تشغيل bridge/gateway تلقائياً (إزالة تكرار GUID بالإضافة إلى حاجز عمر backlog قديم). لا تزال تكوينات `channels.imessage.catchup.enabled: true` القائمة محترمة كملف توافق مهمل.
- `channels.imessage.groups`: سجل المجموعات وإعدادات كل مجموعة. مع `groupPolicy: "allowlist"`، كوّن إما مفاتيح `chat_id` صريحة أو إدخال بدل `"*"` حتى تتمكن رسائل المجموعة من عبور بوابة السجل.
- يمكن لإدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضاً مطبعاً أو هدف دردشة صريحاً (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال مغلف iMessage SSH">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم عبر Plugin ومكوّن ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة مرور Matrix HTTP عبر وكيل HTTP(S) صريح. يمكن للحسابات المسمّاة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. يتحكم `proxy` وهذا الاشتراك الشبكي كل منهما بشكل مستقل.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها ودعوات DM الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتخويل الموافقين.
  - `enabled`:‏ `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تتفعّل موافقات التنفيذ عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (جزء نصي أو تعبير منتظم).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix DM ضمن الجلسات: يشارك `per-user` (الافتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة DM.
- تستخدم فحوصات حالة Matrix وعمليات البحث الحية في الدليل سياسة الوكيل نفسها المستخدمة لحركة مرور وقت التشغيل.
- تم توثيق إعداد Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ويتم تكوينه ضمن `channels.msteams`.

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
- تم توثيق إعداد Teams الكامل (بيانات الاعتماد، Webhook، سياسة DM/المجموعات، وتجاوزات كل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ويتم تكوينه ضمن `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّناً.
- تم توثيق تكوين قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارات) في [IRC](/ar/channels/irc).

### الحسابات المتعددة (كل القنوات)

شغّل عدة حسابات لكل قناة (لكل منها `accountId` خاص به):

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

- يُستخدم `default` عندما يُحذف `accountId` ‏(CLI + التوجيه).
- تنطبق رموز البيئة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حساباً غير افتراضي عبر `openclaw channels add` (أو تهيئة قناة) بينما لا تزال تستخدم تكوين قناة علوي بحساب واحد، يرقّي OpenClaw أولاً القيم العلوية ذات النطاق الحسابي للحساب الواحد إلى خريطة حسابات القناة كي يظل الحساب الأصلي يعمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.
- تستمر ارتباطات القناة فقط الحالية (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات ذات النطاق الحسابي اختيارية.
- يصلح `openclaw doctor --fix` أيضاً الأشكال المختلطة عن طريق نقل القيم العلوية ذات النطاق الحسابي للحساب الواحد إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلاً من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.

### قنوات Plugin أخرى

يتم تكوين كثير من قنوات Plugin بصيغة `channels.<id>` وتوثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارات في دردشة المجموعات

تتطلب رسائل المجموعات افتراضياً **إشارة** (إشارة بيانات وصفية أو أنماط تعبيرات منتظمة آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

يتم التحكم في الردود المرئية بشكل منفصل. تستخدم طلبات المجموعات والقنوات وطلبات WebChat الداخلية المباشرة افتراضياً التسليم النهائي التلقائي: ينشر نص المساعد النهائي عبر مسار الرد المرئي القديم. اشترك في `messages.visibleReplies: "message_tool"` أو `messages.groupChat.visibleReplies: "message_tool"` عندما يجب ألا يُنشر الإخراج المرئي إلا بعد أن يستدعي الوكيل `message(action=send)`. إذا أعاد النموذج نصاً نهائياً من دون استدعاء أداة الرسائل في وضع أداة فقط مشترك فيه، يبقى ذلك النص النهائي خاصاً، ويسجل سجل gateway المفصّل بيانات وصفية للحمولة المكبوتة.

تتطلب الردود المرئية المعتمدة على الأداة فقط نموذجاً/وقت تشغيل يستدعي الأدوات بموثوقية، ويوصى بها للغرف المحيطة المشتركة على نماذج الجيل الأحدث مثل GPT 5.5. يمكن لبعض النماذج الأضعف أن تجيب بنص نهائي لكنها تفشل في فهم أن الإخراج المرئي للمصدر يجب إرساله باستخدام `message(action=send)`. لتلك النماذج، استخدم `"automatic"` كي يكون دور المساعد النهائي هو مسار الرد المرئي. إذا أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أنتج نصاً نهائياً خاصاً بدلاً من استدعاء أداة الرسائل. انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو افحص سجل gateway المفصّل للاطلاع على ملخص الحمولة المكبوتة، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستخدام الردود النهائية المرئية لكل طلب مجموعة/قناة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يتراجع OpenClaw إلى الردود المرئية التلقائية بدلاً من كبت الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

تنطبق هذه القاعدة على نص الوكيل النهائي العادي. تستخدم ارتباطات المحادثة المملوكة لـ Plugin الرد الذي يعيده Plugin المالك بوصفه الاستجابة المرئية لأدوار السلاسل المرتبطة المطالب بها؛ ولا يحتاج Plugin إلى استدعاء `message(action=send)` لتلك الردود المرتبطة.

**استكشاف الأخطاء وإصلاحها: تؤدي إشارة @mention في المجموعة إلى ظهور الكتابة ثم الصمت (من دون خطأ)**

العَرَض: تعرض إشارة @mention في مجموعة/قناة مؤشر الكتابة، ويبلغ سجل gateway عن `dispatch complete (queuedFinal=false, replies=0)`، لكن لا تصل أي رسالة إلى الغرفة. ترد رسائل DM إلى الوكيل نفسه بشكل طبيعي.

السبب: يتم حل وضع الرد المرئي للمجموعة/القناة إلى `"message_tool"`، لذلك يشغّل OpenClaw الدور لكنه يكبت نص المساعد النهائي ما لم يستدع الوكيل `message(action=send)`. لا يوجد عقد `NO_REPLY` في هذا الوضع؛ عدم وجود استدعاء لأداة الرسائل يعني عدم وجود رد مصدر. لا يوجد خطأ لأن الكبت هو السلوك المكوّن. تستخدم أدوار المجموعات والقنوات العادية افتراضياً `"automatic"`، لذلك لا يظهر هذا العَرَض إلا عندما يتم ضبط `messages.groupChat.visibleReplies` (أو `messages.visibleReplies` العام) صراحةً على `"message_tool"`. لا ينطبق `defaultVisibleReplies` الخاص بالحزام هنا — يتجاهله محلل المجموعة/القناة؛ فهو يؤثر فقط في الدردشات المباشرة/المصدر (يكبت حزام Codex النهائيات في الدردشة المباشرة بهذه الطريقة).

الإصلاح: إما اختر نموذجاً أقوى في استدعاء الأدوات، أو أزل تجاوز `"message_tool"` الصريح للرجوع إلى الافتراضي `"automatic"`، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لفرض الردود المرئية لكل طلب مجموعة/قناة. يعيد gateway تحميل تكوين `messages` تحميلًا ساخناً بعد حفظ الملف؛ أعد تشغيل gateway فقط عندما تكون مراقبة الملفات أو إعادة تحميل التكوين معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية للمنصة. يتم تجاهلها في وضع دردشة WhatsApp الذاتية.
- **أنماط النص**: أنماط تعبيرات منتظمة آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- تُفرض بوابة الإشارات فقط عندما يكون الاكتشاف ممكناً (إشارات أصلية أو نمط واحد على الأقل).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

يضبط `messages.groupChat.historyLimit` الافتراضي العام. يمكن للقنوات تجاوزه باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

يرسل `messages.groupChat.unmentionedInbound: "room_event"` رسائل المجموعات/القنوات دائمة التشغيل غير المشار إليها بوصفها سياق غرفة هادئاً على القنوات المدعومة. تبقى الرسائل المشار إليها والأوامر والرسائل المباشرة طلبات مستخدم. راجع [أحداث الغرف المحيطة](/ar/channels/ambient-room-events) للحصول على أمثلة Discord وSlack وTelegram كاملة.

`messages.visibleReplies` هو الافتراضي العام لأحداث المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأحداث مصدر المجموعة/القناة. عندما لا يتم ضبط `messages.visibleReplies`، تستخدم الدردشات المباشرة/المصدر افتراضي وقت التشغيل أو الحزام المحدد، لكن أدوار WebChat الداخلية المباشرة تستخدم التسليم النهائي التلقائي لتوافق مطالبات Pi/Codex. اضبط `messages.visibleReplies: "message_tool"` لتطلب عمداً `message(action=send)` للإخراج المرئي. لا تزال قوائم السماح للقنوات وبوابة الإشارات تحدد ما إذا كان الحدث سيُعالج.

#### حدود سجل DM

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

الحل: تجاوز لكل DM → افتراضي المزوّد → بلا حد (يُحتفظ بكل شيء).

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

- تكوّن هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المدمجة + المضمنة الحالي، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل QQ Bot `/bot-ping` و`/bot-help` و`/bot-logs`، وLINE `/card`، وإقران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` موثقة في صفحات القنوات/Plugin الخاصة بها إضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack متوقفًا.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack متوقفًا.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، يتجاوز `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` استخدام `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء Gateway `chat.send`، تتطلب كتابات `/config set|unset` الدائمة أيضًا `operator.admin`؛ يظل `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعدادات خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في تفعيلها/تعطيلها.
- تضبط `channels.<provider>.configWrites` طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، تضبط `channels.<provider>.accounts.<id>.configWrites` أيضًا الكتابات التي تستهدف ذلك الحساب (مثلًا `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أدوات إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر الخاصة بالمالك فقط وإجراءات القنوات المقيدة بالمالك. وهي منفصلة عن `allowFrom`.
- يجزّئ `ownerDisplay: "hash"` معرّفات المالك في مطالبة النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` خاص بكل مزوّد. عند ضبطه، يكون هو مصدر التفويض **الوحيد** (يتم تجاهل قوائم السماح/الإقران الخاصة بالقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة مستندات الأوامر:
  - الكتالوج المدمج + المضمن: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
