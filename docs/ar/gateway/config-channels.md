---
read_when:
    - تكوين Plugin قناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح إعدادات كل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والاقتران، والمفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والمزيد'
title: Configuration — القنوات
x-i18n:
    generated_at: "2026-07-01T13:06:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح تهيئة كل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، ومفاتيح كل قناة لـ Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وبقية Plugins القنوات المضمّنة.

بالنسبة إلى الوكلاء والأدوات ووقت تشغيل Gateway والمفاتيح العليا الأخرى، راجع
[مرجع التهيئة](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائياً عند وجود قسم التهيئة الخاص بها (ما لم تكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو في مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المهيأة فقط          |
| `open`                | تجاوز قوائم السماح للمجموعات (مع استمرار تطبيق بوابة الإشارات) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما تكون `groupPolicy` الخاصة بالمزوّد غير مضبوطة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. وتُحد طلبات اقتران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كانت كتلة مزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة مجموعات وقت التشغيل إلى `allowlist` (إغلاق آمن عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة أو أقران رسائل مباشرة على نموذج. تقبل القيم `provider/model` أو الأسماء البديلة للنماذج المهيأة. يُطبّق تعيين القناة عندما لا تملك الجلسة تجاوزاً للنموذج مسبقاً (مثلاً، مضبوطاً عبر `/model`).

بالنسبة إلى محادثات المجموعات/السلاسل، تكون المفاتيح معرّفات مجموعات خاصة بالقناة أو معرّفات موضوعات أو أسماء قنوات. وبالنسبة إلى محادثات الرسائل المباشرة، تكون المفاتيح معرّفات أقران مشتقة من هوية مرسل القناة (`nativeDirectUserId` أو `origin.from` أو `origin.to` أو `OriginatingTo` أو `From` أو `SenderId`). يعتمد شكل المفتاح الدقيق على القناة:

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

لا تتطابق المفاتيح الخاصة بالرسائل المباشرة إلا في محادثات الرسائل المباشرة؛ ولا تؤثر في توجيه المجموعات/السلاسل.

### افتراضيات القناة وHeartbeat

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما تكون `groupPolicy` على مستوى المزوّد غير مضبوطة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل قائمة السماح لكن مع إبقاء سياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بأسلوب مؤشرات مضغوط.

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

- تهيئ إدخالات `bindings[]` العليا ذات `type: "acp"` روابط ACP دائمة لرسائل ومجموعات WhatsApp المباشرة. استخدم رقماً مباشراً بصيغة E.164 أو JID لمجموعة WhatsApp في `match.peer.id`. دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضياً إذا كان موجوداً؛ وإلا تستخدم أول معرّف حساب مهيأ (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي هذا عندما يطابق معرّف حساب مهيأ.
- يُرحّل دليل مصادقة Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
- تجاوزات كل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: partial)
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
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` الزائدة بالخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط افتراضياً صريحاً (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما يكون هذا مفقوداً أو غير صالح.
- يحظر `configWrites: false` عمليات كتابة التهيئة التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تهيئ إدخالات `bindings[]` العليا ذات `type: "acp"` روابط ACP دائمة لموضوعات المنتدى (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحا لـ Discord ذلك الرمز المميز للاستدعاء؛ وتظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ تُرفض المعرفات الرقمية المجردة.
- تكون أسماء الخوادم المختصرة بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضّل استخدام معرفات الخوادم.
- تُتجاهل الرسائل التي كتبها الروبوت افتراضيا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل الروبوت التي تذكر الروبوت فقط (مع استمرار تصفية رسائله الذاتية).
- يمكن للقنوات التي تدعم الرسائل الواردة المكتوبة بواسطة الروبوت استخدام [حماية حلقة الروبوت](/ar/channels/bot-loop-protection) المشتركة. اضبط `channels.defaults.botLoopProtection` لميزانيات الأزواج الأساسية، ثم تجاوز القناة أو الحساب فقط عندما يحتاج سطح واحد إلى حدود مختلفة.
- يُسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدما آخر أو دورا آخر ولكن لا تذكر الروبوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر المستقر بمعرفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر الزملاء المعروفين بصورة حتمية حتى عندما تكون ذاكرة التخزين المؤقت العابرة للدليل فارغة. توجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسّم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يكون `channels.discord.suppressEmbeds` افتراضيا `true`، لذلك لا تتوسع عناوين URL الصادرة إلى معاينات روابط Discord ما لم يُعطّل ذلك. تظل حمولات `embeds` الصريحة تُرسل بشكل طبيعي؛ ويمكن لاستدعاءات الأدوات لكل رسالة التجاوز باستخدام `suppressEmbeds`.
- يتحكم `channels.discord.threadBindings` في توجيه Discord المرتبط بالخيوط:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيوط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSessions`: مفتاح لـ `sessions_spawn({ thread: true })` وإنشاء/ربط الخيط التلقائي عند إنشاء خيط ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالخيوط (`"fork"` افتراضيا)
- تُكوّن إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والخيوط (استخدم معرف القناة/الخيط في `match.peer.id`). تشترك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المرسلة مسجلة. القيمة الافتراضية هي `1800000` (30 دقيقة)، والحد الأقصى هو `86400000` (24 ساعة)، وتوجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. تُبقي القيم الأطول الأزرار/القوائم/النماذج القديمة قابلة للاستخدام لمدة أطول، لذلك فضّل أقصر مدة TTL تناسب سير العمل.
- يفعّل `channels.discord.voice` محادثات قنوات الصوت في Discord وتجاوزات اختيارية للانضمام التلقائي + LLM + TTS. تترك إعدادات Discord النصية فقط الصوت متوقفا افتراضيا؛ اضبط `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريا نموذج LLM المستخدم لاستجابات قنوات الصوت في Discord.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوت منفصلة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيا).
- لا تتم مقاطعة تشغيل صوت Discord بحدث بدء تحدث مستخدم آخر. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضا استعادة استقبال الصوت بمغادرة جلسة صوت وإعادة الانضمام إليها بعد تكرار فشل فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث المعياري. يستخدم Discord افتراضيا `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة محررة؛ اضبط `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة وقيم `streaming` المنطقية أسماء مستعارة وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحالة حضور الروبوت (سليم => متصل، متدهور => خامل، مستنفد => عدم الإزعاج) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق لكسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تنشط موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. يعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافق، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين معا. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قِبل الموافقين المحلولين.
  - `cleanupAfterResolve`: عندما تكون `true`، تحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (لا شيء)، `own` (رسائل الروبوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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
- SecretRef لحساب الخدمة مدعوم أيضا (`serviceAccountRef`).
- بدائل البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة كيان البريد الإلكتروني القابلة للتغيير (وضع توافق لكسر الزجاج).

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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` لاستخدام حساب fallback الافتراضي من env).
- يتطلب **وضع HTTP** وجود `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل Slack SDK Socket Mode إلى واجهة Bolt receiver API العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket القديم. القيمة الافتراضية لـ `clientPingTimeout` هي `15000`؛ ولا يتم تمرير `serverPingTimeout` و`pingPongLoggingEnabled` إلا عند ضبطهما.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  عادية أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد، مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مضبوط عبر SecretRef لكن مسار الأمر/التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مضبوطًا.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القياسي. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تبقى قيم `streamMode` القديمة، و`streaming` المنطقية، و`nativeStreaming` أسماء بديلة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يمرر `unfurlLinks` و`unfurlMedia` القيم المنطقية الخاصة بفك روابط ووسائط `chat.postMessage` في Slack لردود البوت. القيمة الافتراضية لـ `unfurlLinks` هي `false` حتى لا تتوسع روابط البوت الصادرة داخل السطر ما لم يتم تفعيل ذلك؛ ويتم حذف `unfurlMedia` ما لم يُضبط. عيّن أيًا من القيمتين في `channels.slack.accounts.<accountId>` لتجاوز قيمة المستوى الأعلى لحساب واحد.
- استخدم `user:<id>` (DM) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسة الخيط:** يكون `thread.historyScope` لكل خيط (الافتراضي) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى الخيوط الجديدة.

- يتطلب البث الأصلي في Slack مع حالة الخيط بأسلوب مساعد Slack "is typing..." هدف خيط للرد. تبقى رسائل DM في المستوى الأعلى خارج الخيط افتراضيًا، لذلك لا يزال بإمكانها البث عبر معاينات منشور مسودة Slack وتحريرها بدلًا من إظهار معاينة البث/الحالة الأصلية بأسلوب الخيط.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم اختصار رمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم عميل الموافقات الأصلي في Slack وتخويل موافق التنفيذ. المخطط نفسه كما في Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`). يمكن لموافقات Plugin استخدام مسار العميل الأصلي هذا للطلبات الصادرة من Slack عندما يتم حل موافقي Slack plugin؛ كما يمكن تفعيل تسليم موافقات Plugin الأصلية في Slack عبر `approvals.plugin` لجلسات منشؤها Slack أو أهداف Slack. تستخدم موافقات Plugin موافقي Slack plugin من `allowFrom` والتوجيه الافتراضي، وليس موافقي التنفيذ.

| مجموعة الإجراء | الافتراضي | الملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يُشحن Mattermost بوصفه Plugin مضمّنًا في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. تحقق من
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
لوسوم التوزيع الحالية قبل تثبيت إصدار محدد.

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

أوضاع الدردشة: `oncall` (الرد عند @-mention، الافتراضي)، `onmessage` (كل رسالة)، `onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس URL كاملًا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية OpenClaw Gateway وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات الشرطة المائلة الأصلية باستخدام الرموز المميزة لكل أمر التي يعيدها
  Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم يتم
  تفعيل أي أوامر، يرفض OpenClaw الاستدعاءات باستخدام
  `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/داخل tailnet/الداخليين، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: يتطلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مضبوطًا.

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

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها Signal أو رفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مضبوطًا.

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم daemon أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw iMessage الجديدة عندما يستطيع المضيف منح أذونات قاعدة بيانات Messages وAutomation.

تمت إزالة دعم BlueBubbles. `channels.bluebubbles` ليس سطح إعدادات وقت تشغيل مدعومًا في OpenClaw الحالي. انقل الإعدادات القديمة إلى `channels.imessage`؛ استخدم [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) للنسخة المختصرة و[القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) لجدول الترجمة الكامل.

إذا لم يكن Gateway يعمل على جهاز Mac المسجل دخوله إلى Messages، فأبقِ `channels.imessage.enabled=true` وعيّن `channels.imessage.cliPath` إلى مغلف SSH يشغّل `imsg "$@"` على ذلك Mac. مسار `imsg` المحلي الافتراضي خاص بـ macOS فقط.

قبل الاعتماد على مغلف SSH لإرسالات الإنتاج، تحقق من إرسال صادر عبر `imsg send` باستخدام ذلك المغلف نفسه. بعض حالات macOS TCC تسند Automation الخاصة بـ Messages إلى `/usr/libexec/sshd-keygen-wrapper`، ما قد يجعل القراءات والفحوصات تعمل بينما تفشل الإرسالات مع AppleEvents `-1743`؛ راجع [فشل إرسال مغلف SSH مع AppleEvents -1743](/ar/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مضبوطًا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى مغلف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بعمليات كتابة الإعدادات التي يبدأها iMessage أو رفضها.
- `channels.imessage.sendTransport`: نقل إرسال `imsg` RPC المفضل للردود الصادرة العادية. يستخدم `auto` (الافتراضي) جسر IMCore للدردشات الموجودة عندما يكون قيد التشغيل، ثم يعود إلى AppleScript؛ يتطلب `bridge` تسليمًا عبر API خاص؛ ويفرض `applescript` مسار Automation العام في Messages.
- `channels.imessage.actions.*`: تفعيل إجراءات API الخاصة المحكومة أيضًا بواسطة `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` معطل افتراضيًا؛ عيّنه إلى `true` قبل توقع وسائط واردة في دورات الوكيل.
- الاسترداد الوارد بعد إعادة تشغيل الجسر/gateway تلقائي (إزالة تكرار GUID بالإضافة إلى حد عمر لسجل متأخر قديم). لا تزال إعدادات `channels.imessage.catchup.enabled: true` الحالية محترمة كملف توافق مهجور.
- `channels.imessage.groups`: سجل المجموعات وإعدادات كل مجموعة. مع `groupPolicy: "allowlist"`، اضبط إما مفاتيح `chat_id` صريحة أو إدخال بدل `"*"` حتى تتمكن رسائل المجموعة من اجتياز بوابة السجل.
- يمكن لإدخالات `bindings[]` في المستوى الأعلى ذات `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضًا موحدًا أو هدف دردشة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال مغلف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بواسطة Plugin ويُضبط ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة مرور Matrix HTTP عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. يُعد `proxy` وهذا الاشتراك الشبكي عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك تُتجاهل الغرف المدعو إليها والدعوات الجديدة ذات نمط الرسائل المباشرة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (افتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة ضمن الجلسات: يشارك `per-user` (افتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها مثل حركة مرور وقت التشغيل.
- وُثّقت تهيئة Matrix الكاملة وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

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
- وُثّقت تهيئة Teams الكاملة (بيانات الاعتماد، Webhook، سياسة الرسائل المباشرة/المجموعات، وتجاوزات كل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

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
- وُثّقت تهيئة قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارات) في [IRC](/ar/channels/irc).

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

- يُستخدم `default` عند حذف `accountId` (CLI + التوجيه).
- تنطبق رموز البيئة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُتجاوز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما لا تزال تستخدم تهيئة قناة علوية لحساب واحد، فإن OpenClaw يرقّي أولًا قيم الحساب الواحد العلوية ذات نطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر ارتباطات القناة فقط الموجودة (بدون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات ذات نطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عبر نقل قيم الحساب الواحد العلوية ذات نطاق الحساب إلى الحساب المرَقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin الأخرى

تُهيأ قنوات Plugin كثيرة بصيغة `channels.<id>` وتُوثّق في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارات في دردشة المجموعات

تتطلب رسائل المجموعات افتراضيًا **إشارة إلزامية** (إشارة بيانات وصفية أو أنماط تعبيرات نمطية آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

تُتحكم الردود المرئية بشكل منفصل. تكون طلبات المجموعات والقنوات وWebChat الداخلية المباشرة الافتراضية مهيأة للتسليم النهائي التلقائي: يُنشر نص المساعد النهائي عبر مسار الرد المرئي القديم. اشترك في `messages.visibleReplies: "message_tool"` أو `messages.groupChat.visibleReplies: "message_tool"` عندما يجب ألا يُنشر الإخراج المرئي إلا بعد أن يستدعي الوكيل `message(action=send)`. إذا أعاد النموذج نصًا نهائيًا دون استدعاء أداة الرسائل في وضع أداة فقط مشترك فيه، يبقى ذلك النص النهائي خاصًا ويسجل سجل Gateway التفصيلي بيانات وصفية للحمولة المكبوتة.

تتطلب الردود المرئية ذات الأداة فقط نموذجًا/وقت تشغيل يستدعي الأدوات بشكل موثوق، ويُوصى بها للغرف المحيطة المشتركة على نماذج الجيل الأحدث مثل GPT 5.5. يمكن لبعض النماذج الأضعف أن تجيب بنص نهائي لكنها تفشل في فهم أن الإخراج المرئي للمصدر يجب أن يُرسل باستخدام `message(action=send)`. لهذه النماذج، استخدم `"automatic"` بحيث تكون دورة المساعد النهائية هي مسار الرد المرئي. إذا أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فقد أنتج النموذج نصًا نهائيًا خاصًا بدلًا من استدعاء أداة الرسائل. انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو افحص سجل Gateway التفصيلي لملخص الحمولة المكبوتة، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستخدام الردود النهائية المرئية لكل طلب مجموعة/قناة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كبت الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

تنطبق هذه القاعدة على النص النهائي العادي للوكيل. تستخدم ارتباطات المحادثة المملوكة لـ Plugin الرد الذي يعيده Plugin المالك كاستجابة مرئية لدورات السلاسل المرتبطة المطالب بها؛ ولا يحتاج Plugin إلى استدعاء `message(action=send)` لتلك الردود الخاصة بالارتباطات.

**استكشاف الأخطاء وإصلاحها: تؤدي إشارة @mention في المجموعة إلى الكتابة ثم الصمت (بلا خطأ)**

العَرَض: تُظهر إشارة @mention في مجموعة/قناة مؤشر الكتابة ويُبلغ سجل Gateway عن `dispatch complete (queuedFinal=false, replies=0)`، لكن لا تصل أي رسالة إلى الغرفة. ترد الرسائل المباشرة إلى الوكيل نفسه بشكل طبيعي.

السبب: يُحل وضع الرد المرئي للمجموعة/القناة إلى `"message_tool"`، لذلك يشغّل OpenClaw الدورة لكنه يكبت نص المساعد النهائي ما لم يستدعِ الوكيل `message(action=send)`. لا يوجد عقد `NO_REPLY` في هذا الوضع؛ وعدم وجود استدعاء لأداة الرسائل يعني عدم وجود رد للمصدر. لا يوجد خطأ لأن الكبت هو السلوك المهيأ. تكون دورات المجموعات والقنوات العادية افتراضيًا `"automatic"`، لذلك لا يظهر هذا العرض إلا عندما يكون `messages.groupChat.visibleReplies` (أو `messages.visibleReplies` العام) مضبوطًا صراحة على `"message_tool"`. لا ينطبق `defaultVisibleReplies` الخاص بالحزمة هنا — إذ يتجاهله محلل المجموعة/القناة؛ فهو يؤثر فقط في الدردشات المباشرة/المصدرية (تكبت حزمة Codex النهائيات في الدردشة المباشرة بهذه الطريقة).

الإصلاح: إما اختر نموذجًا أقوى في استدعاء الأدوات، أو أزل تجاوز `"message_tool"` الصريح للرجوع إلى الافتراضي `"automatic"`، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لفرض الردود المرئية لكل طلب مجموعة/قناة. يعيد Gateway تحميل تهيئة `messages` مباشرة بعد حفظ الملف؛ ولا تُعد تشغيل Gateway إلا عندما تكون مراقبة الملفات أو إعادة تحميل التهيئة معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية للمنصة. تُتجاهل في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط تعبيرات نمطية آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرارات المتداخلة غير الآمنة.
- تُفرض بوابة الإشارات فقط عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` الافتراضي العام. يمكن للقنوات التجاوز باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

يرسل `messages.groupChat.unmentionedInbound: "room_event"` رسائل المجموعات/القنوات غير المشار إليها والدائمة التشغيل كسياق غرفة هادئ على القنوات المدعومة. تبقى الرسائل المشار إليها والأوامر والرسائل المباشرة طلبات مستخدم. راجع [أحداث الغرف المحيطة](/ar/channels/ambient-room-events) للحصول على أمثلة كاملة لـ Discord وSlack وTelegram.

`messages.visibleReplies` هو الافتراضي العام لحدث المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأحداث مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` مضبوطًا، تستخدم دردشات المصدر/المباشرة الافتراضي المختار لوقت التشغيل أو الحزمة، لكن دورات WebChat الداخلية المباشرة تستخدم التسليم النهائي التلقائي لتكافؤ مطالبات Pi/Codex. اضبط `messages.visibleReplies: "message_tool"` لطلب `message(action=send)` عمدًا للإخراج المرئي. لا تزال قوائم سماح القنوات وبوابة الإشارات تقرر ما إذا كان الحدث سيُعالَج.

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

التحليل: تجاوز لكل رسالة مباشرة → افتراضي المزوّد → بلا حد (كل شيء محفوظ).

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

<Accordion title="Command details">

- تُهيئ هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المضمّنة + المرفقة الحالي، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل أوامر QQ Bot `/bot-ping` و`/bot-help` و`/bot-logs`، وLINE `/card`، وإقران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` موثقة في صفحات القنوات/Plugin الخاصة بها، إضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، تتخطى `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الصيغة `! <cmd>` لصدفة المضيف. يتطلب ذلك `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (لقراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء Gateway `chat.send`، تتطلب عمليات الكتابة الدائمة عبر `/config set|unset` أيضًا `operator.admin`؛ يظل `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في تفعيلها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر الخاصة بالمالك فقط وإجراءات القناة المحكومة بالمالك. وهي منفصلة عن `allowFrom`.
- يجزّئ `ownerDisplay: "hash"` معرّفات المالك في مطالبة النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل موفّر. عند ضبطه، يكون هو مصدر التفويض **الوحيد** (يتم تجاهل قوائم سماح القنوات/الإقران و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة وثائق الأوامر:
  - الكتالوج المضمّن + المرفق: [أوامر Slash](/ar/tools/slash-commands)
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
