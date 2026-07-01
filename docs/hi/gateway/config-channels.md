---
read_when:
    - चैनल Plugin कॉन्फ़िगर करना (प्रमाणीकरण, एक्सेस नियंत्रण, बहु-खाता)
    - प्रति-चैनल कॉन्फ़िगरेशन कुंजियों की समस्या निवारण
    - DM नीति, समूह नीति, या उल्लेख गेटिंग का ऑडिट करना
summary: 'चैनल कॉन्फ़िगरेशन: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, और अन्य में एक्सेस कंट्रोल, पेयरिंग, प्रति-चैनल कुंजियाँ'
title: कॉन्फ़िगरेशन — चैनल
x-i18n:
    generated_at: "2026-07-01T13:02:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` के अंतर्गत प्रति-चैनल कॉन्फ़िगरेशन कुंजियाँ। DM और समूह एक्सेस,
मल्टी-अकाउंट सेटअप, मेंशन गेटिंग, और Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage तथा अन्य बंडल किए गए चैनल Plugins के लिए प्रति-चैनल कुंजियाँ कवर करता है।

एजेंटों, टूल्स, Gateway रनटाइम, और अन्य शीर्ष-स्तरीय कुंजियों के लिए,
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## चैनल

हर चैनल अपना कॉन्फ़िग सेक्शन मौजूद होने पर अपने आप शुरू हो जाता है (जब तक `enabled: false` न हो)।

### DM और समूह एक्सेस

सभी चैनल DM नीतियों और समूह नीतियों का समर्थन करते हैं:

| DM नीति             | व्यवहार                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (डिफ़ॉल्ट) | अज्ञात प्रेषकों को एक बार इस्तेमाल होने वाला पेयरिंग कोड मिलता है; मालिक को अनुमोदन करना होगा |
| `allowlist`         | केवल `allowFrom` (या पेयर किए गए allow store) में मौजूद प्रेषक |
| `open`              | सभी इनबाउंड DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)        |
| `disabled`          | सभी इनबाउंड DM अनदेखा करें                                     |

| समूह नीति             | व्यवहार                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (डिफ़ॉल्ट) | केवल कॉन्फ़िगर की गई allowlist से मेल खाने वाले समूह |
| `open`                | समूह allowlists को बायपास करें (मेंशन-गेटिंग फिर भी लागू रहती है) |
| `disabled`            | सभी समूह/रूम संदेश ब्लॉक करें                         |

<Note>
`channels.defaults.groupPolicy` तब डिफ़ॉल्ट सेट करता है जब किसी प्रदाता का `groupPolicy` सेट न हो।
पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं। लंबित DM पेयरिंग अनुरोध **प्रति चैनल 3** तक सीमित हैं।
यदि कोई प्रदाता ब्लॉक पूरी तरह गायब है (`channels.<provider>` अनुपस्थित), तो रनटाइम समूह नीति स्टार्टअप चेतावनी के साथ `allowlist` (fail-closed) पर वापस जाती है।
</Note>

### चैनल मॉडल ओवरराइड

विशिष्ट चैनल ID या डायरेक्ट-मेसेज peers को किसी मॉडल से पिन करने के लिए `channels.modelByChannel` का उपयोग करें। मान `provider/model` या कॉन्फ़िगर किए गए मॉडल aliases स्वीकार करते हैं। चैनल मैपिंग तब लागू होती है जब किसी session में पहले से मॉडल ओवरराइड न हो (उदाहरण के लिए, `/model` के माध्यम से सेट किया गया)।

समूह/thread वार्तालापों के लिए, कुंजियाँ चैनल-विशिष्ट समूह ID, topic ID, या चैनल नाम होती हैं। डायरेक्ट-मेसेज (DM) वार्तालापों के लिए, कुंजियाँ चैनल की प्रेषक पहचान (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, या `SenderId`) से निकले peer identifiers होती हैं। सटीक कुंजी रूप चैनल पर निर्भर करता है:

| चैनल    | DM कुंजी रूप        | उदाहरण                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | कच्चा user ID       | `123456789`                                  |
| Discord  | कच्चा user ID       | `987654321`                                  |
| WhatsApp | फोन नंबर या JID     | `15551234567`                                |
| Matrix   | Matrix user ID      | `@user:matrix.org`                           |
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

DM-विशिष्ट कुंजियाँ केवल डायरेक्ट-मेसेज वार्तालापों में मेल खाती हैं; वे समूह/thread routing को प्रभावित नहीं करतीं।

### चैनल डिफ़ॉल्ट और Heartbeat

प्रदाताओं में साझा समूह-नीति और Heartbeat व्यवहार के लिए `channels.defaults` का उपयोग करें:

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

- `channels.defaults.groupPolicy`: provider-स्तर का `groupPolicy` सेट न होने पर fallback समूह नीति।
- `channels.defaults.contextVisibility`: सभी चैनलों के लिए डिफ़ॉल्ट पूरक context visibility mode। मान: `all` (डिफ़ॉल्ट, सभी quoted/thread/history context शामिल करें), `allowlist` (केवल allowlisted प्रेषकों का context शामिल करें), `allowlist_quote` (allowlist जैसा ही, लेकिन स्पष्ट quote/reply context रखें)। प्रति-चैनल ओवरराइड: `channels.<channel>.contextVisibility`।
- `channels.defaults.heartbeat.showOk`: Heartbeat output में स्वस्थ चैनल statuses शामिल करें।
- `channels.defaults.heartbeat.showAlerts`: Heartbeat output में degraded/error statuses शामिल करें।
- `channels.defaults.heartbeat.useIndicator`: compact indicator-style Heartbeat output render करें।

### WhatsApp

WhatsApp Gateway के web channel (Baileys Web) के माध्यम से चलता है। linked session मौजूद होने पर यह अपने आप शुरू हो जाता है।

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

- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` entries WhatsApp DM और समूहों के लिए persistent ACP bindings कॉन्फ़िगर करती हैं। `match.peer.id` में E.164 direct number या WhatsApp group JID का उपयोग करें। Field semantics [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।

<Accordion title="मल्टी-अकाउंट WhatsApp">

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

- Outbound commands, मौजूद होने पर account `default` पर डिफ़ॉल्ट होते हैं; अन्यथा पहले कॉन्फ़िगर किए गए account id (sorted) पर।
- वैकल्पिक `channels.whatsapp.defaultAccount` उस fallback default account selection को ओवरराइड करता है जब यह किसी कॉन्फ़िगर किए गए account id से मेल खाता है।
- Legacy single-account Baileys auth dir को `openclaw doctor` द्वारा `whatsapp/default` में migrate किया जाता है।
- प्रति-account ओवरराइड: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`।

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

- Bot token: `channels.telegram.botToken` या `channels.telegram.tokenFile` (केवल नियमित फ़ाइल; symlinks अस्वीकार), default account के fallback के रूप में `TELEGRAM_BOT_TOKEN` के साथ।
- `apiRoot` केवल Telegram Bot API root है। `https://api.telegram.org` या अपना self-hosted/proxy root उपयोग करें, `https://api.telegram.org/bot<TOKEN>` नहीं; `openclaw doctor --fix` गलती से लगे trailing `/bot<TOKEN>` suffix को हटाता है।
- वैकल्पिक `channels.telegram.defaultAccount` default account selection को तब ओवरराइड करता है जब यह किसी कॉन्फ़िगर किए गए account id से मेल खाता है।
- multi-account setups (2+ account ids) में, fallback routing से बचने के लिए explicit default (`channels.telegram.defaultAccount` या `channels.telegram.accounts.default`) सेट करें; यह गायब या अमान्य होने पर `openclaw doctor` चेतावनी देता है।
- `configWrites: false` Telegram-initiated config writes (supergroup ID migrations, `/config set|unset`) को ब्लॉक करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` entries forum topics के लिए persistent ACP bindings कॉन्फ़िगर करती हैं (`match.peer.id` में canonical `chatId:topic:topicId` का उपयोग करें)। Field semantics [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।
- Telegram stream previews `sendMessage` + `editMessageText` का उपयोग करते हैं (direct और group chats में काम करता है)।
- Retry policy: [Retry policy](/hi/concepts/retry) देखें।

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

- टोकन: `channels.discord.token`, डिफ़ॉल्ट खाते के लिए fallback के रूप में `DISCORD_BOT_TOKEN` के साथ।
- स्पष्ट Discord `token` देने वाली सीधी आउटबाउंड कॉल उस कॉल के लिए उसी टोकन का उपयोग करती हैं; खाते की retry/policy सेटिंग्स फिर भी सक्रिय runtime snapshot में चुने गए खाते से आती हैं।
- वैकल्पिक `channels.discord.defaultAccount` डिफ़ॉल्ट खाता चयन को तब override करता है जब यह किसी कॉन्फ़िगर किए गए account id से मेल खाता है।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` (guild channel) का उपयोग करें; केवल numeric IDs अस्वीकार किए जाते हैं।
- Guild slugs लोअरकेस होते हैं और spaces को `-` से बदला जाता है; channel keys slugged नाम का उपयोग करती हैं (`#` नहीं)। Guild IDs को प्राथमिकता दें।
- Bot-authored messages डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं। `allowBots: true` उन्हें सक्षम करता है; केवल उन bot messages को स्वीकार करने के लिए `allowBots: "mentions"` का उपयोग करें जो bot का उल्लेख करते हैं (अपने messages फिर भी filtered रहते हैं)।
- Bot-authored inbound messages का समर्थन करने वाले channels साझा [bot loop protection](/hi/channels/bot-loop-protection) का उपयोग कर सकते हैं। Baseline pair budgets के लिए `channels.defaults.botLoopProtection` सेट करें, फिर channel या account को केवल तब override करें जब किसी एक surface को अलग limits चाहिए हों।
- `channels.discord.guilds.<id>.ignoreOtherMentions` (और channel overrides) उन messages को drop करता है जो किसी दूसरे user या role का उल्लेख करते हैं लेकिन bot का नहीं (@everyone/@here को छोड़कर)।
- `channels.discord.mentionAliases` भेजने से पहले स्थिर outbound `@handle` text को Discord user IDs से map करता है, ताकि transient directory cache खाली होने पर भी ज्ञात teammates का deterministically उल्लेख किया जा सके। Per-account overrides `channels.discord.accounts.<accountId>.mentionAliases` के अंतर्गत रहते हैं।
- `maxLinesPerMessage` (डिफ़ॉल्ट 17) लंबे messages को 2000 chars से कम होने पर भी विभाजित करता है।
- `channels.discord.suppressEmbeds` का डिफ़ॉल्ट `true` है, इसलिए disabled न होने तक outbound URLs Discord link previews में expand नहीं होते। स्पष्ट `embeds` payloads फिर भी सामान्य रूप से भेजे जाते हैं; per-message tool calls `suppressEmbeds` से override कर सकते हैं।
- `channels.discord.threadBindings` Discord thread-bound routing को नियंत्रित करता है:
  - `enabled`: thread-bound session features (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और bound delivery/routing) के लिए Discord override
  - `idleHours`: inactivity auto-unfocus के लिए घंटों में Discord override (`0` disabled करता है)
  - `maxAgeHours`: hard max age के लिए घंटों में Discord override (`0` disabled करता है)
  - `spawnSessions`: `sessions_spawn({ thread: true })` और ACP thread-spawn auto thread creation/binding के लिए switch (डिफ़ॉल्ट: `true`)
  - `defaultSpawnContext`: thread-bound spawns के लिए native subagent context (डिफ़ॉल्ट रूप से `"fork"`)
- `type: "acp"` वाली top-level `bindings[]` entries channels और threads के लिए persistent ACP bindings कॉन्फ़िगर करती हैं (`match.peer.id` में channel/thread id का उपयोग करें)। Field semantics [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।
- `channels.discord.ui.components.accentColor` Discord components v2 containers के लिए accent color सेट करता है।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord component callbacks कितनी देर तक registered रहते हैं। डिफ़ॉल्ट `1800000` (30 मिनट) है, अधिकतम `86400000` (24 घंटे) है, और per-account overrides `channels.discord.accounts.<accountId>.agentComponents.ttlMs` के अंतर्गत रहते हैं। लंबे values पुराने buttons/selects/forms को अधिक देर तक usable रखते हैं, इसलिए workflow में fit होने वाला सबसे छोटा TTL प्राथमिकता दें।
- `channels.discord.voice` Discord voice channel conversations और वैकल्पिक auto-join + LLM + TTS overrides सक्षम करता है। Text-only Discord configs डिफ़ॉल्ट रूप से voice off रखते हैं; opt in करने के लिए `channels.discord.voice.enabled=true` सेट करें।
- `channels.discord.voice.model` वैकल्पिक रूप से Discord voice channel responses के लिए इस्तेमाल किए गए LLM model को override करता है।
- `channels.discord.voice.daveEncryption` और `channels.discord.voice.decryptionFailureTolerance` `@discordjs/voice` DAVE options तक pass through करते हैं (डिफ़ॉल्ट रूप से `true` और `24`)।
- `channels.discord.voice.connectTimeoutMs` `/vc join` और auto-join attempts के लिए initial `@discordjs/voice` Ready wait को नियंत्रित करता है (डिफ़ॉल्ट रूप से `30000`)।
- `channels.discord.voice.reconnectGraceMs` नियंत्रित करता है कि disconnected voice session OpenClaw द्वारा destroy किए जाने से पहले reconnect signalling में enter करने के लिए कितनी देर ले सकता है (डिफ़ॉल्ट रूप से `15000`)।
- Discord voice playback किसी दूसरे user के speaking-start event से interrupted नहीं होता। Feedback loops से बचने के लिए, TTS चलने के दौरान OpenClaw नई voice capture को अनदेखा करता है।
- OpenClaw repeated decrypt failures के बाद voice session छोड़कर/दोबारा join करके voice receive recovery का अतिरिक्त प्रयास करता है।
- `channels.discord.streaming` canonical stream mode key है। Discord का डिफ़ॉल्ट `streaming.mode: "progress"` है ताकि tool/work progress एक edited preview message में दिखाई दे; इसे disabled करने के लिए `streaming.mode: "off"` सेट करें। Legacy `streamMode` और boolean `streaming` values runtime aliases बने रहते हैं; persisted config को rewrite करने के लिए `openclaw doctor --fix` चलाएं।
- `channels.discord.autoPresence` runtime availability को bot presence से map करता है (healthy => online, degraded => idle, exhausted => dnd) और वैकल्पिक status text overrides की अनुमति देता है।
- `channels.discord.dangerouslyAllowNameMatching` mutable name/tag matching को फिर से सक्षम करता है (आपातकालीन संगतता मोड)।
- `channels.discord.execApprovals`: Discord-native exec approval delivery और approver authorization।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। Auto mode में, exec approvals तब सक्रिय होते हैं जब approvers को `approvers` या `commands.ownerAllowFrom` से resolve किया जा सके।
  - `approvers`: Discord user IDs जिन्हें exec requests approve करने की अनुमति है। Omit होने पर `commands.ownerAllowFrom` पर fallback करता है।
  - `agentFilter`: वैकल्पिक agent ID allowlist। सभी agents के लिए approvals forward करने हेतु omit करें।
  - `sessionFilter`: वैकल्पिक session key patterns (substring या regex)।
  - `target`: approval prompts कहां भेजने हैं। `"dm"` (डिफ़ॉल्ट) approver DMs को भेजता है, `"channel"` originating channel को भेजता है, `"both"` दोनों को भेजता है। जब target में `"channel"` शामिल हो, buttons केवल resolved approvers द्वारा usable होते हैं।
  - `cleanupAfterResolve`: `true` होने पर approval, denial, या timeout के बाद approval DMs delete करता है।

**प्रतिक्रिया सूचना मोड:** `off` (कोई नहीं), `own` (bot के messages, डिफ़ॉल्ट), `all` (सभी messages), `allowlist` (सभी messages पर `guilds.<id>.users` से)।

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

- Service account JSON: inline (`serviceAccount`) या file-based (`serviceAccountFile`)।
- Service account SecretRef भी समर्थित है (`serviceAccountRef`)।
- Env fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` या `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`।
- Delivery targets के लिए `spaces/<spaceId>` या `users/<userId>` का उपयोग करें।
- `channels.googlechat.dangerouslyAllowNameMatching` mutable email principal matching को फिर से सक्षम करता है (आपातकालीन संगतता मोड)।

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

- **Socket मोड** के लिए `botToken` और `appToken` दोनों आवश्यक हैं (डिफ़ॉल्ट खाते के env fallback के लिए `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)।
- **HTTP मोड** के लिए `botToken` और `signingSecret` आवश्यक हैं (root पर या प्रति-खाता)।
- `socketMode` Slack SDK Socket Mode transport tuning को सार्वजनिक Bolt receiver API तक पास करता है। इसे केवल ping/pong timeout या stale websocket व्यवहार की जांच करते समय उपयोग करें। `clientPingTimeout` का डिफ़ॉल्ट `15000` है; `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर होने पर पास किए जाते हैं।
- `botToken`, `appToken`, `signingSecret`, और `userToken` plaintext
  strings या SecretRef objects स्वीकार करते हैं।
- Slack account snapshots प्रति-credential source/status fields दिखाते हैं, जैसे
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, और HTTP मोड में,
  `signingSecretStatus`। `configured_unavailable` का अर्थ है कि खाता
  SecretRef के माध्यम से कॉन्फ़िगर है लेकिन वर्तमान command/runtime path
  secret value resolve नहीं कर सका।
- `configWrites: false` Slack-initiated config writes को रोकता है।
- वैकल्पिक `channels.slack.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।
- `channels.slack.streaming.mode` canonical Slack stream mode key है। `channels.slack.streaming.nativeTransport` Slack के native streaming transport को नियंत्रित करता है। Legacy `streamMode`, boolean `streaming`, और `nativeStreaming` values runtime aliases बने रहते हैं; persisted config rewrite करने के लिए `openclaw doctor --fix` चलाएँ।
- `unfurlLinks` और `unfurlMedia` bot replies के लिए Slack के `chat.postMessage` link और media unfurl booleans पास करते हैं। `unfurlLinks` का डिफ़ॉल्ट `false` है ताकि outbound bot links सक्षम किए बिना inline expand न हों; `unfurlMedia` कॉन्फ़िगर न होने तक छोड़ा जाता है। एक खाते के लिए top-level value override करने हेतु किसी भी value को `channels.slack.accounts.<accountId>` पर सेट करें।
- delivery targets के लिए `user:<id>` (DM) या `channel:<id>` उपयोग करें।

**Reaction notification मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

**Thread session isolation:** `thread.historyScope` प्रति-thread (डिफ़ॉल्ट) या channel में shared है। `thread.inheritParent` parent channel transcript को नए threads में copy करता है।

- Slack native streaming और Slack assistant-style "is typing..." thread status के लिए reply thread target आवश्यक है। Top-level DMs डिफ़ॉल्ट रूप से off-thread रहते हैं, इसलिए वे thread-style native stream/status preview दिखाने के बजाय Slack draft post-and-edit previews के माध्यम से अब भी stream कर सकते हैं।
- `typingReaction` reply चलने के दौरान inbound Slack message में temporary reaction जोड़ता है, फिर completion पर उसे हटा देता है। `"hourglass_flowing_sand"` जैसा Slack emoji shortcode उपयोग करें।
- `channels.slack.execApprovals`: Slack-native approval-client delivery और exec approver authorization। Discord जैसा ही schema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter`, और `target` (`"dm"`, `"channel"`, या `"both"`)। Slack plugin approvers resolve होने पर Plugin approvals Slack-origin requests के लिए इस native-client path का उपयोग कर सकते हैं; Slack-origin sessions या Slack targets के लिए Slack-native plugin approval delivery को `approvals.plugin` के माध्यम से भी सक्षम किया जा सकता है। Plugin approvals `allowFrom` और default routing से Slack plugin approvers उपयोग करते हैं, exec approvers नहीं।

| Action group | डिफ़ॉल्ट | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | सक्षम | React + reactions list करें |
| messages     | सक्षम | Read/send/edit/delete  |
| pins         | सक्षम | Pin/unpin/list         |
| memberInfo   | सक्षम | Member info            |
| emojiList    | सक्षम | Custom emoji list      |

### Mattermost

Mattermost वर्तमान OpenClaw releases में bundled plugin के रूप में आता है। पुराने या
custom builds वर्तमान npm package को
`openclaw plugins install @openclaw/mattermost` से install कर सकते हैं। Version pin करने से पहले current dist-tags के लिए
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
देखें।

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

Chat modes: `oncall` (@-mention पर respond करें, डिफ़ॉल्ट), `onmessage` (हर message), `onchar` (trigger prefix से शुरू होने वाले messages)।

जब Mattermost native commands सक्षम हों:

- `commands.callbackPath` एक path होना चाहिए (उदाहरण के लिए `/api/channels/mattermost/command`), full URL नहीं।
- `commands.callbackUrl` OpenClaw gateway endpoint पर resolve होना चाहिए और Mattermost server से reachable होना चाहिए।
- Native slash callbacks उन per-command tokens से authenticated होते हैं जो
  slash command registration के दौरान Mattermost लौटाता है। अगर registration fail हो जाए या कोई
  commands activate न हों, तो OpenClaw callbacks को
  `Unauthorized: invalid command token.` के साथ reject करता है।
- Private/tailnet/internal callback hosts के लिए, Mattermost को
  `ServiceSettings.AllowedUntrustedInternalConnections` में callback host/domain शामिल करने की आवश्यकता हो सकती है।
  Host/domain values उपयोग करें, full URLs नहीं।
- `channels.mattermost.configWrites`: Mattermost-initiated config writes को allow या deny करें।
- `channels.mattermost.requireMention`: channels में reply करने से पहले `@mention` आवश्यक करें।
- `channels.mattermost.groups.<channelId>.requireMention`: per-channel mention-gating override (डिफ़ॉल्ट के लिए `"*"`)।
- वैकल्पिक `channels.mattermost.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।

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

**Reaction notification मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

- `channels.signal.account`: channel startup को किसी specific Signal account identity पर pin करें।
- `channels.signal.configWrites`: Signal-initiated config writes को allow या deny करें।
- वैकल्पिक `channels.signal.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।

### iMessage

OpenClaw `imsg rpc` spawn करता है (stdio पर JSON-RPC)। किसी daemon या port की आवश्यकता नहीं। जब host Messages database और Automation permissions दे सकता है, तो नए OpenClaw iMessage setups के लिए यह preferred path है।

BlueBubbles support हटा दिया गया था। वर्तमान OpenClaw पर `channels.bluebubbles` supported runtime config surface नहीं है। पुराने configs को `channels.imessage` पर migrate करें; संक्षिप्त संस्करण के लिए [BlueBubbles removal and the imsg iMessage path](/hi/announcements/bluebubbles-imessage) और पूरी translation table के लिए [Coming from BlueBubbles](/hi/channels/imessage-from-bluebubbles) उपयोग करें।

अगर Gateway signed-in Messages Mac पर नहीं चल रहा है, तो `channels.imessage.enabled=true` रखें और `channels.imessage.cliPath` को ऐसे SSH wrapper पर सेट करें जो उस Mac पर `imsg "$@"` चलाता हो। डिफ़ॉल्ट local `imsg` path केवल macOS है।

Production sends के लिए SSH wrapper पर निर्भर होने से पहले, उसी exact wrapper के माध्यम से outbound `imsg send` verify करें। कुछ macOS TCC states Messages Automation को `/usr/libexec/sshd-keygen-wrapper` को assign करते हैं, जिससे reads और probes काम कर सकते हैं जबकि sends AppleEvents `-1743` के साथ fail हो जाते हैं; देखें [SSH wrapper sends fail with AppleEvents -1743](/hi/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)।

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

- वैकल्पिक `channels.imessage.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।

- Messages DB के लिए Full Disk Access आवश्यक है।
- `chat_id:<id>` targets को प्राथमिकता दें। Chats list करने के लिए `imsg chats --limit 20` उपयोग करें।
- `cliPath` SSH wrapper की ओर point कर सकता है; SCP attachment fetching के लिए `remoteHost` (`host` या `user@host`) सेट करें।
- `attachmentRoots` और `remoteAttachmentRoots` inbound attachment paths को restrict करते हैं (डिफ़ॉल्ट: `/Users/*/Library/Messages/Attachments`)।
- SCP strict host-key checking उपयोग करता है, इसलिए सुनिश्चित करें कि relay host key पहले से `~/.ssh/known_hosts` में मौजूद है।
- `channels.imessage.configWrites`: iMessage-initiated config writes को allow या deny करें।
- `channels.imessage.sendTransport`: normal outbound replies के लिए preferred `imsg` RPC send transport। `auto` (डिफ़ॉल्ट) existing chats के लिए IMCore bridge उपयोग करता है जब वह चल रहा हो, फिर AppleScript पर fallback करता है; `bridge` private-API delivery मांगता है; `applescript` public Messages automation path को force करता है।
- `channels.imessage.actions.*`: private API actions सक्षम करें जो `imsg status` / `openclaw channels status --probe` द्वारा भी gated हैं।
- `channels.imessage.includeAttachments` डिफ़ॉल्ट रूप से off है; agent turns में inbound media की अपेक्षा करने से पहले इसे `true` पर सेट करें।
- Bridge/gateway restart के बाद inbound recovery automatic है (GUID dedupe plus stale-backlog age fence)। मौजूदा `channels.imessage.catchup.enabled: true` configs अब भी deprecated compatibility profile के रूप में honored हैं।
- `channels.imessage.groups`: group registry और per-group settings। `groupPolicy: "allowlist"` के साथ, या तो explicit `chat_id` keys या `"*"` wildcard entry configure करें ताकि group messages registry gate से pass हो सकें।
- Top-level `bindings[]` entries जिनमें `type: "acp"` है, iMessage conversations को persistent ACP sessions से bind कर सकते हैं। `match.peer.id` में normalized handle या explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) उपयोग करें। Shared field semantics: [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings)।

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix plugin-backed है और `channels.matrix` के अंतर्गत configured है।

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

- टोकन auth `accessToken` का उपयोग करता है; पासवर्ड auth `userId` + `password` का उपयोग करता है।
- `channels.matrix.proxy` Matrix HTTP ट्रैफिक को एक स्पष्ट HTTP(S) proxy के माध्यम से route करता है। नामित खाते इसे `channels.matrix.accounts.<id>.proxy` से override कर सकते हैं।
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` private/internal homeservers की अनुमति देता है। `proxy` और यह network opt-in स्वतंत्र controls हैं।
- `channels.matrix.defaultAccount` multi-account setups में पसंदीदा account चुनता है।
- `channels.matrix.autoJoin` का default `off` है, इसलिए invited rooms और नए DM-style invites को तब तक ignore किया जाता है जब तक आप `autoJoin: "allowlist"` को `autoJoinAllowlist` के साथ या `autoJoin: "always"` सेट नहीं करते।
- `channels.matrix.execApprovals`: Matrix-native exec approval delivery और approver authorization।
  - `enabled`: `true`, `false`, या `"auto"` (default)। auto mode में, exec approvals तब activate होते हैं जब approvers को `approvers` या `commands.ownerAllowFrom` से resolve किया जा सकता है।
  - `approvers`: Matrix user IDs (जैसे `@owner:example.org`) जिन्हें exec requests approve करने की अनुमति है।
  - `agentFilter`: वैकल्पिक agent ID allowlist। सभी agents के लिए approvals forward करने हेतु omit करें।
  - `sessionFilter`: वैकल्पिक session key patterns (substring या regex)।
  - `target`: approval prompts कहाँ भेजने हैं। `"dm"` (default), `"channel"` (originating room), या `"both"`।
  - प्रति-account overrides: `channels.matrix.accounts.<id>.execApprovals`।
- `channels.matrix.dm.sessionScope` नियंत्रित करता है कि Matrix DMs sessions में कैसे group होते हैं: `per-user` (default) routed peer के अनुसार share करता है, जबकि `per-room` हर DM room को isolate करता है।
- Matrix status probes और live directory lookups runtime traffic जैसी ही proxy policy का उपयोग करते हैं।
- पूरा Matrix configuration, targeting rules, और setup examples [Matrix](/hi/channels/matrix) में documented हैं।

### Microsoft Teams

Microsoft Teams Plugin-backed है और `channels.msteams` के अंतर्गत configured है।

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

- यहाँ cover किए गए core key paths: `channels.msteams`, `channels.msteams.configWrites`।
- पूरा Teams config (credentials, Webhook, DM/group policy, per-team/per-channel overrides) [Microsoft Teams](/hi/channels/msteams) में documented है।

### IRC

IRC Plugin-backed है और `channels.irc` के अंतर्गत configured है।

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

- यहाँ cover किए गए core key paths: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`।
- वैकल्पिक `channels.irc.defaultAccount` default account selection को override करता है जब यह configured account id से match करता है।
- पूरा IRC channel configuration (host/port/TLS/channels/allowlists/mention gating) [IRC](/hi/channels/irc) में documented है।

### Multi-account (सभी channels)

प्रति channel कई accounts चलाएँ (हर एक का अपना `accountId` हो):

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

- `accountId` omit होने पर `default` का उपयोग किया जाता है (CLI + routing)।
- Env tokens केवल **default** account पर लागू होते हैं।
- Base channel settings सभी accounts पर लागू होती हैं जब तक कि प्रति account override न की जाए।
- हर account को अलग agent पर route करने के लिए `bindings[].match.accountId` का उपयोग करें।
- यदि आप single-account top-level channel config पर रहते हुए `openclaw channels add` (या channel onboarding) के माध्यम से non-default account जोड़ते हैं, तो OpenClaw पहले account-scoped top-level single-account values को channel account map में promote करता है ताकि original account काम करता रहे। अधिकांश channels उन्हें `channels.<channel>.accounts.default` में move करते हैं; Matrix इसके बजाय existing matching named/default target preserve कर सकता है।
- मौजूदा channel-only bindings (बिना `accountId`) default account से match करते रहते हैं; account-scoped bindings वैकल्पिक रहते हैं।
- `openclaw doctor --fix` भी mixed shapes को repair करता है, account-scoped top-level single-account values को उस channel के लिए चुने गए promoted account में move करके। अधिकांश channels `accounts.default` का उपयोग करते हैं; Matrix इसके बजाय existing matching named/default target preserve कर सकता है।

### अन्य Plugin channels

कई Plugin channels `channels.<id>` के रूप में configured होते हैं और अपने dedicated channel pages में documented होते हैं (उदाहरण के लिए Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, और Twitch)।
पूरा channel index देखें: [Channels](/hi/channels)।

### Group chat mention gating

Group messages का default **mention require** करना है (metadata mention या safe regex patterns)। यह WhatsApp, Telegram, Discord, Google Chat, और iMessage group chats पर लागू होता है।

Visible replies अलग से controlled हैं। Normal group, channel, और internal WebChat direct requests का default automatic final delivery है: final assistant text legacy visible reply path के माध्यम से post होता है। जब visible output केवल agent के `message(action=send)` call करने के बाद post होना चाहिए, तो `messages.visibleReplies: "message_tool"` या `messages.groupChat.visibleReplies: "message_tool"` opt into करें। यदि model opted-in tool-only mode में message tool call किए बिना final text return करता है, तो वह final text private रहता है और gateway verbose log suppressed payload metadata record करता है।

Tool-only visible replies के लिए ऐसा model/runtime चाहिए जो भरोसेमंद तरीके से tools call करता हो, और इन्हें GPT 5.5 जैसे latest-generation models पर shared ambient rooms के लिए recommended किया जाता है। कुछ weaker models final text answer कर सकते हैं लेकिन यह समझने में fail हो सकते हैं कि source-visible output `message(action=send)` के साथ भेजना होगा। उन models के लिए, `"automatic"` का उपयोग करें ताकि final assistant turn visible reply path हो। यदि session log में `didSendViaMessagingTool: false` के साथ assistant text दिखता है, तो model ने message tool call करने के बजाय private final text produce किया। उस channel के लिए stronger tool-calling model पर switch करें, suppressed payload summary के लिए gateway verbose log inspect करें, या हर group/channel request के लिए visible final replies उपयोग करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें।

यदि active tool policy के अंतर्गत message tool unavailable है, तो OpenClaw response को silently suppress करने के बजाय automatic visible replies पर fall back करता है। `openclaw doctor` इस mismatch के बारे में warn करता है।

यह rule normal agent final text पर लागू होता है। Plugin-owned conversation bindings claimed bound-thread turns के लिए owning plugin की returned reply को visible response के रूप में उपयोग करते हैं; उन binding replies के लिए plugin को `message(action=send)` call करने की जरूरत नहीं है।

**Troubleshooting: group @mention typing trigger करता है फिर silence (no error)**

Symptom: group/channel @mention typing indicator दिखाता है और gateway log `dispatch complete (queuedFinal=false, replies=0)` report करता है, लेकिन room में कोई message नहीं आता। उसी agent को DMs normally reply करते हैं।

Cause: group/channel visible-reply mode `"message_tool"` पर resolve होता है, इसलिए OpenClaw turn run करता है लेकिन final assistant text को suppress करता है जब तक agent `message(action=send)` call नहीं करता। इस mode में कोई `NO_REPLY` contract नहीं है; no message-tool call का अर्थ है no source reply। कोई error नहीं है क्योंकि suppression configured behavior है। Normal group और channel turns का default `"automatic"` है, इसलिए यह symptom केवल तब दिखता है जब `messages.groupChat.visibleReplies` (या global `messages.visibleReplies`) explicitly `"message_tool"` पर set हो। Harness `defaultVisibleReplies` यहाँ apply नहीं होता — group/channel resolver इसे ignore करता है; यह केवल direct/source chats को affect करता है (Codex harness direct-chat finals को इसी तरह suppress करता है)।

Fix: या तो stronger tool-calling model चुनें, `"automatic"` default पर fall back करने के लिए explicit `"message_tool"` override हटाएँ, या हर group/channel request के लिए visible replies force करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें। file save होने के बाद gateway `messages` config को hot-reload करता है; gateway को केवल तब restart करें जब deployment में file watching या config reload disabled हो।

**Mention types:**

- **Metadata mentions**: Native platform @-mentions। WhatsApp self-chat mode में ignore किए जाते हैं।
- **Text patterns**: `agents.list[].groupChat.mentionPatterns` में safe regex patterns। Invalid patterns और unsafe nested repetition ignore किए जाते हैं।
- Mention gating केवल तब enforced है जब detection संभव हो (native mentions या कम से कम एक pattern)।

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

`messages.groupChat.historyLimit` global default set करता है। Channels `channels.<channel>.historyLimit` (या per-account) के साथ override कर सकते हैं। Disable करने के लिए `0` set करें।

`messages.groupChat.unmentionedInbound: "room_event"` supported channels पर unmentioned always-on group/channel messages को quiet room context के रूप में submit करता है। Mentioned messages, commands, और direct messages user requests रहते हैं। पूरे Discord, Slack, और Telegram examples के लिए [Ambient room events](/hi/channels/ambient-room-events) देखें।

`messages.visibleReplies` global source-event default है; `messages.groupChat.visibleReplies` group/channel source events के लिए इसे override करता है। जब `messages.visibleReplies` unset हो, direct/source chats selected runtime या harness default का उपयोग करते हैं, लेकिन internal WebChat direct turns Pi/Codex prompt parity के लिए automatic final delivery का उपयोग करते हैं। Visible output के लिए जानबूझकर `message(action=send)` require करने हेतु `messages.visibleReplies: "message_tool"` set करें। Channel allowlists और mention gating अभी भी decide करते हैं कि event processed होगा या नहीं।

#### DM history limits

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

Resolution: per-DM override → provider default → कोई limit नहीं (all retained)।

Supported: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`।

#### Self-chat mode

Self-chat mode enable करने के लिए `allowFrom` में अपना number include करें (native @-mentions ignore करता है, केवल text patterns पर respond करता है):

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

### Commands (chat command handling)

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

- यह ब्लॉक कमांड सतहों को कॉन्फ़िगर करता है। मौजूदा अंतर्निहित + बंडल किए गए कमांड कैटलॉग के लिए, [स्लैश कमांड](/hi/tools/slash-commands) देखें।
- यह पेज **कॉन्फ़िग-की संदर्भ** है, पूरा कमांड कैटलॉग नहीं। चैनल/Plugin-स्वामित्व वाले कमांड जैसे QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, डिवाइस-पेयर `/pair`, मेमोरी `/dreaming`, फ़ोन-कंट्रोल `/phone`, और Talk `/voice` उनके चैनल/Plugin पेजों और [स्लैश कमांड](/hi/tools/slash-commands) में दस्तावेज़ित हैं।
- टेक्स्ट कमांड अग्रणी `/` के साथ **स्वतंत्र** संदेश होने चाहिए।
- `native: "auto"` Discord/Telegram के लिए नेटिव कमांड चालू करता है, Slack को बंद रहने देता है।
- `nativeSkills: "auto"` Discord/Telegram के लिए नेटिव skill कमांड चालू करता है, Slack को बंद रहने देता है।
- प्रति चैनल ओवरराइड करें: `channels.discord.commands.native` (bool या `"auto"`)। Discord के लिए, `false` स्टार्टअप के दौरान नेटिव कमांड पंजीकरण और क्लीनअप को छोड़ देता है।
- `channels.<provider>.commands.nativeSkills` के साथ प्रति चैनल नेटिव skill पंजीकरण ओवरराइड करें।
- `channels.telegram.customCommands` अतिरिक्त Telegram bot मेनू प्रविष्टियां जोड़ता है।
- `bash: true` होस्ट शेल के लिए `! <cmd>` सक्षम करता है। इसके लिए `tools.elevated.enabled` और प्रेषक का `tools.elevated.allowFrom.<channel>` में होना आवश्यक है।
- `config: true` `/config` सक्षम करता है (`openclaw.json` पढ़ता/लिखता है)। Gateway `chat.send` क्लाइंट के लिए, स्थायी `/config set|unset` लेखन को `operator.admin` भी चाहिए; केवल-पढ़ने वाला `/config show` सामान्य write-scoped ऑपरेटर क्लाइंट के लिए उपलब्ध रहता है।
- `mcp: true` `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP सर्वर कॉन्फ़िग के लिए `/mcp` सक्षम करता है।
- `plugins: true` Plugin खोज, इंस्टॉल, और सक्षम/अक्षम नियंत्रणों के लिए `/plugins` सक्षम करता है।
- `channels.<provider>.configWrites` प्रति चैनल कॉन्फ़िग परिवर्तन को नियंत्रित करता है (डिफ़ॉल्ट: true)।
- मल्टी-अकाउंट चैनलों के लिए, `channels.<provider>.accounts.<id>.configWrites` उस खाते को लक्षित करने वाले लेखन को भी नियंत्रित करता है (उदाहरण के लिए `/allowlist --config --account <id>` या `/config set channels.<provider>.accounts.<id>...`)।
- `restart: false` `/restart` और Gateway पुनरारंभ टूल कार्रवाइयों को अक्षम करता है। डिफ़ॉल्ट: `true`।
- `ownerAllowFrom` केवल-स्वामी कमांड और स्वामी-नियंत्रित चैनल कार्रवाइयों के लिए स्पष्ट स्वामी allowlist है। यह `allowFrom` से अलग है।
- `ownerDisplay: "hash"` सिस्टम प्रॉम्प्ट में स्वामी IDs को हैश करता है। हैशिंग नियंत्रित करने के लिए `ownerDisplaySecret` सेट करें।
- `allowFrom` प्रति-प्रदाता है। सेट होने पर, यह **एकमात्र** प्राधिकरण स्रोत होता है (चैनल allowlists/pairing और `useAccessGroups` अनदेखे किए जाते हैं)।
- `useAccessGroups: false` कमांड को access-group नीतियों को बायपास करने देता है जब `allowFrom` सेट नहीं होता।
- कमांड दस्तावेज़ मानचित्र:
  - अंतर्निहित + बंडल कैटलॉग: [स्लैश कमांड](/hi/tools/slash-commands)
  - चैनल-विशिष्ट कमांड सतहें: [चैनल](/hi/channels)
  - QQ Bot कमांड: [QQ Bot](/hi/channels/qqbot)
  - पेयरिंग कमांड: [पेयरिंग](/hi/channels/pairing)
  - LINE कार्ड कमांड: [LINE](/hi/channels/line)
  - मेमोरी Dreaming: [Dreaming](/hi/concepts/dreaming)

</Accordion>

---

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — शीर्ष-स्तरीय कुंजियां
- [कॉन्फ़िगरेशन — एजेंट](/hi/gateway/config-agents)
- [चैनल अवलोकन](/hi/channels)
