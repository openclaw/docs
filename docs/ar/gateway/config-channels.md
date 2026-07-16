---
read_when:
    - إعداد Plugin قناة (المصادقة، والتحكم في الوصول، وتعدد الحسابات)
    - استكشاف أخطاء مفاتيح الإعدادات الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة أو سياسة المجموعات أو تقييد الإشارات
summary: 'تهيئة القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: الإعداد — القنوات
x-i18n:
    generated_at: "2026-07-16T14:03:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح إعداد كل قناة ضمن `channels.*`: الوصول إلى الرسائل المباشرة والمجموعات، وإعدادات الحسابات المتعددة، واشتراط الإشارة، والمفاتيح الخاصة بكل قناة في Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات.

بالنسبة إلى الوكلاء والأدوات ووقت تشغيل Gateway وغيرها من مفاتيح المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم إعدادها (ما لم يكن `enabled: false`). يأتي Telegram وiMessage ضمن حزمة `openclaw` الأساسية. تُثبَّت القنوات الرسمية الأخرى (Discord وSlack وWhatsApp وMatrix وMicrosoft Teams وIRC وGoogle Chat وSignal وMattermost وغيرها) بوصفها Plugins منفصلة باستخدام `openclaw plugins install <spec>`؛ راجع [القنوات](/ar/channels) للاطلاع على القائمة الكاملة ومواصفات التثبيت.

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة           | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران يُستخدم مرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)             |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المُعدّة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (يظل اشتراط الإشارة مطبقًا) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف                          |

<Note>
يحدد `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون قيمة `groupPolicy` الخاصة بموفّر معيّن مضبوطة.
تنتهي صلاحية رموز الإقران بعد 1 ساعة. يقتصر عدد طلبات الإقران المعلّقة على **3 لكل حساب** (ضمن نطاق القناة ومعرّف الحساب).
إذا كانت كتلة موفّر مفقودة بالكامل (`channels.<provider>` غير موجود)، فستعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة أو نظراء الرسائل المباشرة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء البديلة للنماذج المُعدّة. لا ينطبق تعيين القنوات إلا عندما لا تحتوي الجلسة بالفعل على تجاوز نشط للنموذج (على سبيل المثال، تجاوز ضُبط عبر `/model`).

بالنسبة إلى محادثات المجموعات/السلاسل، تكون المفاتيح معرّفات مجموعات أو معرّفات موضوعات أو أسماء قنوات خاصة بالقناة. وبالنسبة إلى محادثات الرسائل المباشرة (DM)، تكون المفاتيح معرّفات النظراء المشتقة من هوية مرسل القناة (`nativeDirectUserId` أو `origin.from` أو `origin.to` أو `OriginatingTo` أو `From` أو `SenderId`). يعتمد الشكل الدقيق للمفتاح على القناة:

| القناة  | شكل مفتاح الرسائل المباشرة         | مثال                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | معرّف المستخدم الخام         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | معرّف مستخدم Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | معرّف المستخدم الخام         | `123456789`                                  |
| WhatsApp | رقم الهاتف أو JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

لا تتطابق المفاتيح الخاصة بالرسائل المباشرة إلا في محادثات الرسائل المباشرة؛ ولا تؤثر في توجيه المجموعات/السلاسل.

### الإعدادات الافتراضية للقنوات وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك بين الموفّرين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون قيمة `groupPolicy` على مستوى الموفّر مضبوطة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، يتضمن جميع سياقات الاقتباس/السلسلة/السجل)، و`allowlist` (يتضمن فقط السياق من المرسلين المدرجين في قائمة السماح)، و`allowlist_quote` (مثل قائمة السماح، لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). التجاوز الخاص بكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat (القيمة الافتراضية `false`).
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الخطأ في مخرجات Heartbeat (القيمة الافتراضية `true`).
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مضغوطة بنمط المؤشر (القيمة الافتراضية `true`).

### WhatsApp

يعمل WhatsApp عبر قناة الويب في Gateway (Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (القيمة الافتراضية `25000`) و`connectTimeoutMs` (القيمة الافتراضية `60000`) و`defaultQueryTimeoutMs` (القيمة الافتراضية `60000`) تضبط مقبس Baileys.
- القيم الافتراضية لـ `web.reconnect`: `initialMs: 2000` و`maxMs: 30000` و`factor: 1.8` و`jitter: 0.25` و`maxAttempts: 12`. تجعل `maxAttempts: 0` إعادة المحاولة تستمر إلى الأبد بدلًا من الاستسلام.
- تُعدّ إدخالات `bindings[]` في المستوى الأعلى التي تحتوي على `type: "acp"` ارتباطات ACP دائمة لرسائل WhatsApp المباشرة ومجموعاته. استخدم رقمًا مباشرًا بتنسيق E.164 أو JID لمجموعة WhatsApp في `match.peer.id`. دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="حسابات WhatsApp المتعددة">

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فتستخدم أول معرّف حساب مُعدّ (بعد الفرز).
- تتجاوز قيمة `channels.whatsapp.defaultAccount` الاختيار الاحتياطي للحساب الافتراضي اختياريًا عندما تطابق معرّف حساب مُعدًّا.
- يرحّل `openclaw doctor` دليل مصادقة Baileys القديم ذي الحساب الواحد إلى `whatsapp/default`.
- التجاوزات الخاصة بكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع استخدام `TELEGRAM_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- يمثل `apiRoot` جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو الجذر المستضاف ذاتيًا/الوسيط، وليس `https://api.telegram.org/bot<TOKEN>`؛ وتزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` المضافة عرضًا.
- بالنسبة إلى خادم Bot API مستضاف ذاتيًا في وضع `--local`، تسرد `trustedLocalFileRoots` مسارات المضيف التي يجوز لـ OpenClaw قراءتها. اركب وحدة تخزين بيانات الخادم على مضيف OpenClaw وأعِدّ إما جذر بياناتها أو دليلًا لكل رمز؛ وتُعيَّن مسارات الحاوية ضمن `/var/lib/telegram-bot-api` إلى هذه الجذور. تظل المسارات المطلقة الأخرى مرفوضة.
- تتجاوز قيمة `channels.telegram.defaultAccount` الاختيار الافتراضي للحساب اختياريًا عندما تطابق معرّف حساب مُعدًّا.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط حسابًا افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ وتحذر `openclaw doctor` عندما تكون هذه القيمة مفقودة أو غير صالحة.
- تحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، `/config set|unset`).
- تُعدّ إدخالات `bindings[]` في المستوى الأعلى التي تحتوي على `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتدى (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تستخدم معاينات البث في Telegram ‏`sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة والجماعية).
- القيمة الافتراضية لـ `network.dnsResultOrder` هي `"ipv4first"` لتجنب حالات فشل الجلب الشائعة عبر IPv6.
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
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (الوضع الافتراضي في Discord: progress)
        chunkMode: "length", // length | newline
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

- الرمز المميز: `channels.discord.token`، مع استخدام `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord ذلك الرمز المميز للاستدعاء؛ وتظل إعدادات إعادة المحاولة/السياسة للحساب مأخوذة من الحساب المحدد في لقطة بيئة التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري تحديد الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة للخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحوّل إلى اسم مختصر (من دون `#`). يُفضّل استخدام معرّفات الخوادم.
- تُتجاهل الرسائل التي تنشئها البوتات افتراضيًا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل البوتات التي تذكر البوت فقط (تظل رسائله الخاصة مستبعدة).
- يمكن للقنوات التي تدعم الرسائل الواردة المنشأة بواسطة البوتات استخدام [الحماية المشتركة من حلقات البوتات](/ar/channels/bot-loop-protection). اضبط `channels.defaults.botLoopProtection` لميزانيات الأزواج الأساسية، ثم تجاوز إعداد القناة أو الحساب فقط عندما يحتاج أحد السطحين إلى حدود مختلفة.
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدمًا أو دورًا آخر دون ذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر والثابت بمعرّفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر زملاء الفريق المعروفين بصورة حتمية حتى عندما تكون ذاكرة التخزين المؤقت المؤقتة للدليل فارغة. توجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (القيمة الافتراضية `17`) الرسائل الطويلة رأسيًا حتى عندما يقل طولها عن 2000 حرف.
- تكون القيمة الافتراضية لـ `channels.discord.suppressEmbeds` هي `true`، لذلك لا تتوسع عناوين URL الصادرة إلى معاينات روابط Discord ما لم يُعطّل ذلك. تظل حمولات `embeds` الصريحة تُرسل بصورة طبيعية؛ ويمكن لاستدعاءات الأدوات الخاصة بكل رسالة التجاوز باستخدام `suppressEmbeds`.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل محادثات Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بسلاسل المحادثات (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّله)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّله)
  - `spawnSessions`: مفتاح تبديل لإنشاء/ربط سلاسل المحادثات تلقائيًا بواسطة `sessions_spawn({ thread: true })` وإنشاء سلاسل ACP (القيمة الافتراضية: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بسلاسل المحادثات (`"fork"` افتراضيًا)
- تهيئ إدخالات `bindings[]` ذات المستوى الأعلى التي تحتوي على `type: "acp"` ارتباطات ACP دائمة للقنوات وسلاسل المحادثات (استخدم معرّف القناة/سلسلة المحادثات في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord بالإصدار v2.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المُرسلة مسجلة. القيمة الافتراضية `1800000` (30 دقيقة)، والحد الأقصى `86400000` (24 ساعة). توجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. يُفضّل أقصر مدة صلاحية TTL تلائم سير العمل.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والانضمام التلقائي الاختياري وتجاوزات LLM وTTS. تترك إعدادات Discord النصية فقط الصوت معطّلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لاستجابات قنوات Discord الصوتية.
- يُمرَّر `channels.discord.voice.daveEncryption` (القيمة الافتراضية `true`) و`channels.discord.voice.decryptionFailureTolerance` (القيمة الافتراضية `24`) إلى خيارات DAVE في `@discordjs/voice`.
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار جاهزية `@discordjs/voice` الأولي لـ `/vc join` ومحاولات الانضمام التلقائي (القيمة الافتراضية `30000`).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوتية منقطعة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (القيمة الافتراضية `15000`).
- لا يتوقف تشغيل الصوت في Discord بسبب حدث بدء تحدث مستخدم آخر. ولتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة صوتية وإعادة الانضمام إليها بعد إخفاقات متكررة في فك التشفير.
- يمثل `channels.discord.streaming` مفتاح وضع البث الأساسي. يستخدم Discord القيمة الافتراضية `streaming.mode: "progress"` لتظهر أداة/تقدم العمل في رسالة معاينة واحدة معدّلة؛ اضبط `streaming.mode: "off"` لتعطيله. لم تعد المفاتيح القديمة المسطحة (`streamMode`، و`chunkMode`، و`blockStreaming`، و`draftChunk`، و`blockStreamingCoalesce`) تُقرأ في وقت التشغيل؛ شغّل `openclaw doctor --fix` لترحيل الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` توفر بيئة التشغيل بحضور البوت (سليم => متصل، متدهور => خامل، مستنفد => عدم الإزعاج) ويسمح بتجاوزات اختيارية لنص الحالة.
- يوجّه `channels.discord.guilds.<id>.presenceEvents` حالات وصول التوفر البشري إلى قناة Discord مهيأة واحدة على هيئة أحداث نظام للوكيل. يجب أن يتمكن الأعضاء المؤهلون من عرض `channelId`؛ ترث سلاسل المحادثات العامة رؤية القناة الأصل، بينما تتطلب سلاسل المحادثات الخاصة بالإضافة إلى ذلك العضوية أو صلاحية Manage Threads. يمكن لـ `users` تضييق هذا الجمهور أكثر. يبذر الأعضاء المتصلين حاليًا من لقطات `GUILD_CREATE` المكتملة، ويوجّه انتقالات الأعضاء المرصودة من غير متصل إلى متصل، ويعامل أول إشارة اتصال لاحقة لعضو غير مرئي على أنه أصبح متاحًا حديثًا دون الجزم بما إذا كان قد اتصل أو انضم بعد اللقطة. تتطلب الخوادم التي تتجاوز حد لقطات Discord البالغ 75,000 عضو تحديثًا صريحًا لحالة عدم الاتصال أولًا. عناصر التحكم في التقييد: `reconnectSuppressSeconds` (نافذة هدوء بعد جلسة Gateway جديدة بينما يُعاد بناء حالة حضور الخادم، القيمة الافتراضية 300، ويعطّلها `0`) و`burstLimit`/`burstWindowSeconds` (حد معدل الأحداث الموضوعة بنجاح في الطابور لكل خادم، القيمة الافتراضية 8 أحداث لكل نافذة منزلقة مدتها 60s). لا تبدأ الجلسات المستأنفة نافذة منع إعادة الاتصال. تظل فترة التهدئة الحالية لإعادة الترحيب بكل مستخدم ثماني ساعات. يتطلب ذلك `channels.discord.intents.presence=true`، وPresence Intent ذي الامتيازات في Developer Portal الخاص بـ Discord، وHeartbeat مفعّلًا للوكيل.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق للاستخدام عند الضرورة القصوى).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلي في Discord وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (القيمة الافتراضية). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن تحديد الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. يعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لإعادة توجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: موضع إرسال مطالبات الموافقة. يرسل `"dm"` (القيمة الافتراضية) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا بواسطة الموافقين الذين جرى تحديدهم.
  - `cleanupAfterResolve`: عندما تكون القيمة `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (لا شيء)، و`own` (رسائل البوت، القيمة الافتراضية)، و`all` (جميع الرسائل)، و`allowlist` (من `guilds.<id>.users` في جميع الرسائل).

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

- ملف JSON لحساب الخدمة: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- يُدعم أيضًا SecretRef لحساب الخدمة (`serviceAccountRef`).
- الخيارات الاحتياطية لمتغيرات البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (للحساب الافتراضي فقط).
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة هوية البريد الإلكتروني القابلة للتغيير (وضع توافق للاستخدام عند الضرورة القصوى).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
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

- يتطلب **وضع Socket** كلاً من `botToken` و`appToken` ‏(`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` للرجوع الاحتياطي إلى متغيرات بيئة الحساب الافتراضي).
- يتطلب **وضع HTTP** ‏`botToken` بالإضافة إلى `signingSecret` (على المستوى الجذري أو لكل حساب).
- يُدخل `enterpriseOrgInstall: true` حسابًا في مسار الأحداث على مستوى مؤسسة Slack Enterprise Grid
  بأكملها. يتحقق بدء التشغيل من رمز البوت باستخدام `auth.test`،
  ويفشل عندما لا يتطابق الوضع المُعدّ مع هوية تثبيت Slack.
  يجب تعطيل الرسائل المباشرة للمؤسسة أو استخدام `dmPolicy: "open"` مع
  `allowFrom: ["*"]` فعّال. يجب أن تستخدم سياسات القنوات والمستخدمين معرّفات Slack ثابتة؛
  وتتسبب الأسماء القابلة للتغيير وبادئات القنوات غير المدعومة في فشل بدء التشغيل. يتعامل الإصدار V1 فقط
  مع أحداث Socket Mode المباشرة أو أحداث HTTP ‏`message` و`app_mention` مع ردود
  فورية؛ ولا تتوفر عمليات الترحيل والأوامر والتفاعلات وApp Home ومستمعو أحداث التفاعلات
  والتثبيتات وأدوات الإجراءات والموافقات الأصلية والارتباطات والتسليم المؤجل وعمليات
  الإرسال الاستباقية. تظل إقرارات الاستلام والكتابة وتفاعلات الحالة التي يملكها المستمع
  متاحة باستخدام `reactions:write`؛ ولا تتوفر إشعارات التفاعلات الواردة ولا أدوات
  إجراءات التفاعل. راجع
  [عمليات التثبيت على مستوى مؤسسة Enterprise Grid بأكملها](/ar/channels/slack#enterprise-grid-org-wide-installs)
  للاطلاع على ملف البيان ذي أقل الصلاحيات وسير عمل الإعداد والقيود الكاملة.
- يمرر `socketMode` إعدادات ضبط نقل Socket Mode في Slack SDK إلى واجهة Bolt العامة للمستقبِل. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك اتصال websocket المتقادم. القيمة الافتراضية لـ `clientPingTimeout` هي `15000`؛ ولا يُمرر `serverPingTimeout` و`pingPongLoggingEnabled` إلا عند إعدادهما.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken`
  سلاسل نصية عادية أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل بيانات اعتماد، مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مُعدّ من خلال SecretRef، لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يمثل `channels.slack.streaming.mode` مفتاح وضع البث الأساسي في Slack (القيمة الافتراضية `"partial"`). يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack (القيمة الافتراضية `true`). لم تعد قيم `streamMode` القديمة، وقيمة `streaming` المنطقية، و`chunkMode`، و`blockStreaming`، و`blockStreamingCoalesce`، و`nativeStreaming` تُقرأ في وقت التشغيل؛ شغّل `openclaw doctor --fix` لترحيل الإعدادات المحفوظة إلى `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- يمرر `unfurlLinks` و`unfurlMedia` قيمتي Slack المنطقيتين `chat.postMessage` لإظهار معاينات الروابط والوسائط ضمن ردود البوت. القيمة الافتراضية لـ `unfurlLinks` هي `false`، لذا لا تتوسع روابط البوت الصادرة داخل النص ما لم يُفعّل ذلك؛ ويُحذف `unfurlMedia` ما لم يُعدّ. اضبط أيًا من القيمتين في `channels.slack.accounts.<accountId>` لتجاوز القيمة ذات المستوى الأعلى لحساب واحد.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

**عزل جلسات سلاسل المحادثات:** يكون `thread.historyScope` خاصًا بكل سلسلة محادثات (الافتراضي) أو مشتركًا على مستوى القناة. ينسخ `thread.inheritParent` نص محادثة القناة الأم إلى سلاسل المحادثات الجديدة. يضع `thread.initialHistoryLimit` (القيمة الافتراضية `20`) حدًا لعدد رسائل سلسلة المحادثات الحالية التي تُجلب عند بدء جلسة سلسلة محادثات جديدة؛ ويعطّل `0` جلب سجل سلسلة المحادثات.

- يتطلب البث الأصلي في Slack وحالة سلسلة المحادثات "is typing..." بأسلوب مساعد Slack هدف رد ضمن سلسلة محادثات. تظل الرسائل المباشرة ذات المستوى الأعلى خارج سلاسل المحادثات افتراضيًا، ولذلك لا يزال بإمكانها البث عبر معاينات مسودات Slack القائمة على النشر والتحرير بدلاً من إظهار معاينة البث/الحالة الأصلية بأسلوب سلاسل المحادثات.
- يضيف `typingReaction` تفاعلاً مؤقتًا إلى رسالة Slack الواردة أثناء إنشاء الرد، ثم يزيله عند الاكتمال. استخدم رمزًا مختصرًا لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم عميل الموافقات الأصلي في Slack وتفويض معتمدي التنفيذ. المخطط نفسه المستخدم في Discord: ‏`enabled` ‏(`true`/`false`/`"auto"`) و`approvers` (معرّفات مستخدمي Slack) و`agentFilter` و`sessionFilter` و`target` ‏(`"dm"` أو `"channel"` أو `"both"`). يمكن لموافقات Plugin استخدام مسار العميل الأصلي هذا للطلبات الواردة من Slack عند حل معتمدي Plugin في Slack؛ ويمكن أيضًا تمكين تسليم موافقات Plugin الأصلي في Slack من خلال `approvals.plugin` للجلسات الواردة من Slack أو أهداف Slack. تستخدم موافقات Plugin معتمدي Plugin في Slack من `allowFrom` والتوجيه الافتراضي، وليس معتمدي التنفيذ.

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | إضافة التفاعلات + سردها |
| messages     | مفعّل | القراءة/الإرسال/التحرير/الحذف  |
| pins         | مفعّل | التثبيت/إلغاء التثبيت/السرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يُثبّت Mattermost بوصفه Plugin منفصلاً، بالطريقة نفسها التي تُثبّت بها Discord وSlack وWhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

تحقق من [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) لمعرفة علامات التوزيع الحالية قبل تثبيت إصدار محدد.

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
      streaming: { chunkMode: "length" },
    },
  },
}
```

أوضاع الدردشة: `oncall` (الرد عند الإشارة باستخدام @، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملاً.
- يجب أن يؤدي `commands.callbackUrl` إلى نقطة نهاية Gateway في OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تُصادق استدعاءات أوامر الشرطة المائلة الأصلية باستخدام الرموز الخاصة بكل أمر التي يعيدها
  Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم تُفعّل أي
  أوامر، يرفض OpenClaw الاستدعاءات باستخدام
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين أو الداخليين أو الموجودين ضمن tailnet، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز شرط الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

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

**أوضاع إشعارات التفاعل:** `off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تقييد بدء تشغيل القناة بهوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها Signal أو رفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

### iMessage

يشغّل OpenClaw ‏`imsg rpc` ‏(JSON-RPC عبر stdio). لا يلزم برنامج خفي أو منفذ. هذا هو المسار المفضّل لعمليات إعداد iMessage الجديدة في OpenClaw عندما يمكن للمضيف منح أذونات قاعدة بيانات Messages والأتمتة.

أُزيل دعم BlueBubbles. لا يمثل `channels.bluebubbles` سطح إعداد وقت تشغيل مدعومًا في OpenClaw الحالي. رحّل الإعدادات القديمة إلى `channels.imessage`؛ واستخدم [إزالة BlueBubbles ومسار imsg في iMessage](/ar/announcements/bluebubbles-imessage) للاطلاع على النسخة المختصرة و[الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) للاطلاع على جدول التحويل الكامل.

إذا لم يكن Gateway يعمل على جهاز Mac المسجّل دخوله إلى Messages، فأبقِ `channels.imessage.enabled=true` واضبط `channels.imessage.cliPath` على غلاف SSH يشغّل `imsg "$@"` على جهاز Mac ذلك. مسار `imsg` المحلي الافتراضي مخصص لنظام macOS فقط.

قبل الاعتماد على غلاف SSH لعمليات الإرسال في بيئة الإنتاج، تحقق من عملية `imsg send` صادرة عبر ذلك الغلاف نفسه. تُسند بعض حالات TCC في macOS أتمتة Messages إلى `/usr/libexec/sshd-keygen-wrapper`، ما قد يسمح بنجاح القراءات وعمليات الفحص بينما تفشل عمليات الإرسال مع `-1743` في AppleEvents؛ راجع قسم استكشاف أخطاء غلاف SSH وإصلاحها في [iMessage](/ar/channels/imessage).

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

- يستبدل `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيّأ.
- يتطلب الوصول الكامل إلى القرص لقاعدة بيانات Messages.
- يُفضّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لعرض المحادثات.
- يمكن أن يشير `cliPath` إلى مغلّف SSH؛ اضبط `remoteHost` ‏(`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها iMessage أو رفضها.
- `channels.imessage.sendTransport`: وسيلة إرسال RPC المفضلة في `imsg` للردود الصادرة العادية. يستخدم `auto` (الافتراضي) جسر IMCore للمحادثات الحالية عندما يكون قيد التشغيل، ثم يعود إلى AppleScript؛ ويتطلب `bridge` التسليم عبر واجهة API خاصة؛ بينما يفرض `applescript` مسار الأتمتة العام في Messages.
- `channels.imessage.actions.*`: تمكين إجراءات واجهة API الخاصة التي تخضع أيضًا لقيود `imsg status` / `openclaw channels status --probe`.
- يكون `channels.imessage.includeAttachments` معطّلًا افتراضيًا؛ اضبطه على `true` قبل توقّع ورود الوسائط ضمن دورات الوكيل.
- تتم استعادة الرسائل الواردة تلقائيًا بعد إعادة تشغيل الجسر/Gateway (إزالة التكرار باستخدام GUID بالإضافة إلى حد زمني لتقادم التراكم). ما تزال إعدادات `channels.imessage.catchup.enabled: true` الحالية مدعومة بوصفها ملف توافق مهمَلًا؛ ويكون `catchup` معطّلًا افتراضيًا.
- `channels.imessage.groups`: سجل المجموعات وإعدادات كل مجموعة. عند استخدام `groupPolicy: "allowlist"`، هيّئ إما مفاتيح `chat_id` صريحة أو إدخال حرف بدل `"*"` كي تتمكن رسائل المجموعة من اجتياز بوابة السجل.
- يمكن لإدخالات `bindings[]` في المستوى الأعلى التي تتضمن `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم معرّفًا مُطبّعًا أو هدف محادثة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال على مغلّف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تدعم Plugin قناة Matrix وتُهيّأ ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة مرور HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة استبداله باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم المنازل الخاصة/الداخلية. ويُعد `proxy` وهذا الاشتراك الشبكي عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في الإعدادات متعددة الحسابات.
- تكون قيمة `channels.matrix.autoJoin` الافتراضية هي `"off"`، لذلك تُتجاهل الغرف المدعو إليها ودعوات الرسائل المباشرة الجديدة حتى تضبط `autoJoin: "allowlist"` باستخدام `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتخويل الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن تحديد الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لإعادة توجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: وجهة إرسال مطالبات الموافقة. `"dm"` (الافتراضي) أو `"channel"` (الغرفة الأصلية) أو `"both"`.
  - تجاوزات كل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة ضمن جلسات: يشارك `per-user` (الافتراضي) الجلسة حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة لحركة مرور وقت التشغيل.
- يُوثّق إعداد Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تدعم Plugin قناة Microsoft Teams وتُهيّأ ضمن `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // سياسات appId وappPassword وtenantId وwebhook والفريق/القناة:
      // راجع /channels/msteams
    },
  },
}
```

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.msteams`، `channels.msteams.configWrites`.
- يُوثّق إعداد Teams الكامل (بيانات الاعتماد وWebhook وسياسة الرسائل المباشرة/المجموعات والتجاوزات الخاصة بكل فريق/قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

تدعم Plugin قناة IRC وتُهيّأ ضمن `channels.irc`.

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
- يستبدل `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيّأ.
- يُوثّق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/اشتراط الإشارة) في [IRC](/ar/channels/irc).

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

- يُستخدم `default` عند حذف `accountId` ‏(CLI + التوجيه).
- لا تنطبق رموز البيئة المميزة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُستبدل لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) مع استمرار استخدام إعداد قناة أحادية الحساب في المستوى الأعلى، فإن OpenClaw ينقل أولًا قيم الحساب الواحد الموجودة في المستوى الأعلى والمحددة النطاق للحساب إلى خريطة حسابات القناة، كي يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ بينما يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي حالي مطابق بدلًا من ذلك.
- تستمر الارتباطات الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات محددة النطاق للحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة من خلال نقل قيم الحساب الواحد الموجودة في المستوى الأعلى والمحددة النطاق للحساب إلى الحساب المنقول المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ بينما يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي حالي مطابق بدلًا من ذلك.

### قنوات Plugin الأخرى

تُهيّأ العديد من قنوات Plugin بصيغة `channels.<id>` وتُوثّق في صفحات القنوات المخصصة لها (مثل Feishu وLINE وNextcloud Talk وNostr وQQ Bot وSynology Chat وTwitch وZalo).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### اشتراط الإشارة في المحادثات الجماعية

تتطلب رسائل المجموعات **الإشارة افتراضيًا** (إشارة ضمن البيانات الوصفية أو أنماط تعبيرات نمطية آمنة). ينطبق ذلك على محادثات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

يُتحكم في الردود المرئية بشكل منفصل. تستخدم الطلبات المباشرة العادية في المجموعات والقنوات وWebChat الداخلي التسليم النهائي التلقائي افتراضيًا: يُنشر نص المساعد النهائي عبر مسار الرد المرئي القديم. اشترك في `messages.visibleReplies: "message_tool"` أو `messages.groupChat.visibleReplies: "message_tool"` عندما يجب ألا يُنشر الإخراج المرئي إلا بعد استدعاء الوكيل `message(action=send)`. إذا أعاد النموذج إجابة نهائية ذات مضمون من دون استدعاء أداة الرسائل في وضع مقتصر على الأدوات تم الاشتراك فيه، فسيظل ذلك النص النهائي خاصًا، ويسجّل السجل التفصيلي لـ Gateway البيانات الوصفية للحمولة المحجوبة، ويضع OpenClaw محاولة استرداد واحدة في قائمة الانتظار، طالبًا من النموذج تسليم الرد نفسه عبر `message(action=send)`.

تتطلب الردود المرئية المقتصرة على الأدوات نموذجًا/بيئة تشغيل تستدعي الأدوات بموثوقية، ويُوصى بها للغرف المحيطة المشتركة مع نماذج الجيل الأحدث مثل GPT-5.6 Sol. يمكن لبعض النماذج الأضعف تقديم نص نهائي، لكنها تفشل في فهم أن الإخراج المرئي في المصدر يجب إرساله باستخدام `message(action=send)`. يستعيد OpenClaw افتراضيًا حالة الرد النهائي العالق الشائعة فقط عندما يكون الرد النهائي ذا مضمون، ولم تكن دورة المصدر حدث غرفة، ولم تمنع سياسة الإرسال التسليم، ولم يُرسل أي رد إلى المصدر مسبقًا. يقتصر الاسترداد على محاولة واحدة؛ إذ يمنع حفظ مطالبة إعادة المحاولة الاصطناعية ويستبعد تلك المحاولة من تجميع التحصيل كي لا تندمج مع مطالبات أخرى غير مرتبطة في قائمة الانتظار. إذا علقت محاولة إعادة المحاولة أيضًا أو تعذر وضعها في قائمة الانتظار، فلا يسلّم OpenClaw سوى تشخيص منقّى مثل "أنشأت ردًا، لكن تعذر عليّ تسليمه إلى هذه المحادثة. يُرجى المحاولة مجددًا." ولا يُعلّم النص النهائي الخاص الأصلي مطلقًا للتسليم التلقائي إلى المصدر. بالنسبة إلى النماذج التي تُبقي الردود عالقة مرارًا، استخدم `"automatic"` كي تكون دورة المساعد النهائية هي مسار الرد المرئي، أو انتقل إلى نموذج أقوى في استدعاء الأدوات، أو افحص السجل التفصيلي لـ Gateway للاطلاع على ملخص الحمولة المحجوبة، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستخدام الردود النهائية المرئية لكل طلب مجموعة/قناة.

إذا لم تكن أداة الرسائل متاحة بموجب سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من حجب الاستجابة بصمت. يحذّر `openclaw doctor` من عدم التطابق هذا.

تنطبق هذه القاعدة على النص النهائي العادي للوكيل. تستخدم ارتباطات المحادثات التي تملكها Plugin الرد الذي تعيده Plugin المالكة بوصفه الاستجابة المرئية لدورات سلسلة المحادثة المرتبطة التي تمت المطالبة بها؛ ولا تحتاج Plugin إلى استدعاء `message(action=send)` لردود الارتباط تلك.

**استكشاف الأخطاء وإصلاحها: تؤدي الإشارة إلى @ في المجموعة إلى ظهور مؤشر الكتابة ثم الصمت (من دون خطأ)**

العَرَض: تُظهر الإشارة إلى @ في مجموعة/قناة مؤشر الكتابة، ويبلغ سجل Gateway عن `dispatch complete (queuedFinal=false, replies=0)`، لكن لا تصل أي رسالة إلى الغرفة. ترد الرسائل المباشرة إلى الوكيل نفسه بصورة طبيعية.

السبب: يُحسم وضع الرد المرئي للمجموعة/القناة إلى `"message_tool"`، لذا يشغّل OpenClaw الدورة لكنه يحجب النص النهائي للمساعد ما لم يستدعِ الوكيل `message(action=send)`. لا يوجد عقد `NO_REPLY` في هذا الوضع؛ وعدم استدعاء أداة الرسائل يعني أن النص النهائي الأصلي خاص. بالنسبة إلى دورات المصدر ذات المحتوى الجوهري، يحاول OpenClaw الآن إعادة محاولة استرداد واحدة محمية؛ ولا تُعاد محاولة الملاحظات القصيرة، والصمت الصريح، وأحداث الغرفة، والدورات المرفوضة بسبب سياسة الإرسال، والدورات التي سُلّمت بالفعل. تكون القيمة الافتراضية لدورات المجموعات والقنوات العادية هي `"automatic"`، لذا لا يظهر هذا العَرَض إلا عند تعيين `messages.groupChat.visibleReplies` (أو `messages.visibleReplies` العام) صراحةً إلى `"message_tool"`. لا ينطبق `defaultVisibleReplies` الخاص بحاضنة الاختبار هنا — إذ يتجاهله محلّل المجموعة/القناة؛ ولا يؤثر إلا في محادثات المصدر/المحادثات المباشرة (تحجب حاضنة Codex النهايات في المحادثات المباشرة بهذه الطريقة).

الإصلاح: إما اختيار نموذج أقوى في استدعاء الأدوات، أو إزالة تجاوز `"message_tool"` الصريح للرجوع إلى القيمة الافتراضية `"automatic"`، أو تعيين `messages.groupChat.visibleReplies: "automatic"` لفرض الردود المرئية لكل طلب مجموعة/قناة. ينبغي ألّا تنتهي بعد الآن نتيجة نهائية جوهرية عالقة على أنها نجاح صامت؛ بل ينبغي إما استردادها عبر إعادة محاولة `message(action=send)` واحدة أو عرض تشخيص منقّح لفشل التسليم. يعيد Gateway تحميل إعدادات `messages` آنيًا بعد حفظ الملف؛ ولا تُعِد تشغيل Gateway إلا عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطّلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ أصلية للمنصة. تُتجاهل في وضع المحادثة الذاتية في WhatsApp.
- **أنماط النص**: أنماط تعبيرات نمطية آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرارات المتداخلة غير الآمنة.
- لا يُفرض اشتراط الإشارة إلا عندما يكون اكتشافها ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

```json5
{
  messages: {
    visibleReplies: "automatic", // فرض الردود النهائية التلقائية القديمة لمحادثات المصدر/المحادثات المباشرة
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // تتحول أحاديث الغرفة المستمرة بلا إشارة إلى سياق هادئ
      visibleReplies: "message_tool", // اشتراك اختياري؛ يتطلب message(action=send) لردود الغرفة المرئية
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

يعيّن `messages.groupChat.historyLimit` القيمة الافتراضية العامة. يمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن `0` للتعطيل.

يرسل `messages.groupChat.unmentionedInbound: "room_event"` رسائل المجموعات/القنوات المستمرة بلا إشارة كسياق غرفة هادئ على القنوات المدعومة. تظل الرسائل المشار فيها، والأوامر، والرسائل المباشرة طلبات مستخدم. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) للاطلاع على أمثلة كاملة لـ Discord وSlack وTelegram.

يمثل `messages.visibleReplies` القيمة الافتراضية العامة لأحداث المصدر؛ ويتجاوزها `messages.groupChat.visibleReplies` لأحداث مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` معيّنًا، تستخدم محادثات المصدر/المحادثات المباشرة القيمة الافتراضية لبيئة التشغيل أو حاضنة الاختبار المحددة، لكن الدورات المباشرة الداخلية في WebChat تستخدم التسليم النهائي التلقائي لتحقيق تكافؤ الموجّهات بين Pi وCodex. عيّن `messages.visibleReplies: "message_tool"` لفرض طلب `message(action=send)` عمدًا للحصول على مخرجات مرئية. تظل قوائم السماح للقنوات واشتراط الإشارة هي التي تحدد ما إذا كان الحدث سيُعالَج.

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

ترتيب الحسم: تجاوز لكل رسالة مباشرة ← القيمة الافتراضية للموفّر ← بلا حد (يُحتفظ بالجميع).

يقرأ هذا المحلّل `channels.<provider>.dmHistoryLimit` و`channels.<provider>.dms.<id>.historyLimit` لأي قناة يتبع مفتاح جلستها صيغة `provider:direct:<id>` القياسية (أو صيغة `provider:dm:<id>` القديمة)، لذا فهو يعمل عبر القنوات المضمّنة وقنوات Plugin على حد سواء، وليس لقائمة ثابتة فقط.

#### وضع المحادثة الذاتية

أدرج رقمك في `allowFrom` لتمكين وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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
    native: "auto", // تسجيل الأوامر الأصلية عند دعمها
    nativeSkills: "auto", // تسجيل أوامر Skills الأصلية عند دعمها
    text: true, // تحليل /commands في رسائل المحادثة
    bash: false, // السماح بـ ! (اسم بديل: /bash)
    bashForegroundMs: 2000,
    config: false, // السماح بـ /config
    mcp: false, // السماح بـ /mcp
    plugins: false, // السماح بـ /plugins
    debug: false, // السماح بـ /debug
    restart: true, // السماح بـ /restart + طلبات إعادة التشغيل الخارجية SIGUSR1
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

- تضبط هذه الكتلة واجهات الأوامر. للاطلاع على الفهرس الحالي للأوامر المضمنة + المرفقة، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. تُوثَّق الأوامر المملوكة للقنوات/Plugin، مثل QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وLINE ‏`/card`، وإقران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم في الهاتف `/phone`، وTalk ‏`/voice`، في صفحات القنوات/Plugin الخاصة بها، بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord وTelegram، ويُبقيها معطّلة في Slack.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord وTelegram، ويُبقيها معطّلة في Slack.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، يتخطى `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل أوامر Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء Gateway من نوع `chat.send`، تتطلب عمليات الكتابة الدائمة عبر `/config set|unset` أيضًا `operator.admin`؛ ويظل `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP الذي يديره OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في تمكينها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في تعديلات الإعدادات لكل قناة (القيمة الافتراضية: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وطلبات إعادة التشغيل الخارجية `SIGUSR1`. القيمة الافتراضية: `true`.
- يمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر المخصصة للمالك وإجراءات القنوات المقيّدة بالمالك. وهو منفصل عن `allowFrom`.
- يُجزّئ `ownerDisplay: "hash"` معرّفات المالك في موجّه النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- يكون `allowFrom` خاصًا بكل موفّر. عند تعيينه، يصبح مصدر التفويض **الوحيد** (وتُتجاهل قوائم السماح/الإقران الخاصة بالقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّنًا.
- خريطة وثائق الأوامر:
  - فهرس الأوامر المضمنة + المرفقة: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - واجهات الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: ‏[QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: ‏[LINE](/ar/channels/line)
  - Dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
