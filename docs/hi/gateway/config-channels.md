---
read_when:
    - Channel Plugin कॉन्फ़िगर करना (प्रमाणीकरण, अभिगम नियंत्रण, बहु-खाता)
    - प्रति-चैनल कॉन्फ़िग कुंजियों का समस्या निवारण
    - DM नीति, समूह नीति, या उल्लेख गेटिंग का ऑडिट करना
summary: 'चैनल कॉन्फ़िगरेशन: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage और अन्य में एक्सेस कंट्रोल, पेयरिंग, प्रति-चैनल कुंजियाँ'
title: Configuration — चैनल
x-i18n:
    generated_at: "2026-06-28T23:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` के अंतर्गत प्रति-चैनल कॉन्फ़िगरेशन कुंजियाँ। इसमें DM और समूह पहुँच,
मल्टी-अकाउंट सेटअप, mention gating, और Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage तथा अन्य bundled channel Plugin के लिए प्रति-चैनल कुंजियाँ शामिल हैं।

एजेंट, टूल, Gateway रनटाइम, और अन्य शीर्ष-स्तरीय कुंजियों के लिए,
[कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## चैनल

हर चैनल तब अपने-आप शुरू होता है जब उसका कॉन्फ़िग सेक्शन मौजूद हो (जब तक `enabled: false` न हो)।

### DM और समूह पहुँच

सभी चैनल DM नीतियों और समूह नीतियों का समर्थन करते हैं:

| DM नीति             | व्यवहार                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (डिफ़ॉल्ट) | अज्ञात प्रेषकों को एक बार का pairing कोड मिलता है; स्वामी को स्वीकृति देनी होगी |
| `allowlist`         | केवल `allowFrom` (या paired allow store) में मौजूद प्रेषक       |
| `open`              | सभी आने वाले DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)      |
| `disabled`          | सभी आने वाले DM को अनदेखा करें                                 |

| समूह नीति             | व्यवहार                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (डिफ़ॉल्ट) | केवल कॉन्फ़िगर की गई allowlist से मेल खाने वाले समूह  |
| `open`                | समूह allowlist को बायपास करें (mention-gating फिर भी लागू होता है) |
| `disabled`            | सभी समूह/रूम संदेशों को ब्लॉक करें                    |

<Note>
`channels.defaults.groupPolicy` तब डिफ़ॉल्ट सेट करता है जब किसी प्रदाता का `groupPolicy` सेट न हो।
Pairing कोड 1 घंटे के बाद समाप्त हो जाते हैं। लंबित DM pairing अनुरोधों की सीमा **प्रति चैनल 3** है।
अगर कोई प्रदाता ब्लॉक पूरी तरह गायब है (`channels.<provider>` अनुपस्थित), तो रनटाइम समूह नीति startup चेतावनी के साथ `allowlist` (fail-closed) पर लौटती है।
</Note>

### चैनल मॉडल ओवरराइड

विशिष्ट चैनल ID या direct-message peers को किसी मॉडल से पिन करने के लिए `channels.modelByChannel` का उपयोग करें। मान `provider/model` या कॉन्फ़िगर किए गए मॉडल aliases स्वीकार करते हैं। चैनल मैपिंग तब लागू होती है जब किसी सत्र में पहले से मॉडल ओवरराइड न हो (उदाहरण के लिए, `/model` के जरिए सेट किया गया)।

समूह/thread बातचीत के लिए, कुंजियाँ चैनल-विशिष्ट समूह ID, topic ID, या चैनल नाम होती हैं। direct-message (DM) बातचीत के लिए, कुंजियाँ चैनल की प्रेषक पहचान (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From`, या `SenderId`) से निकाले गए peer identifiers होती हैं। सटीक कुंजी रूप चैनल पर निर्भर करता है:

| चैनल    | DM कुंजी रूप          | उदाहरण                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | कच्चा user ID       | `123456789`                                  |
| Discord  | कच्चा user ID       | `987654321`                                  |
| WhatsApp | फ़ोन नंबर या JID    | `15551234567`                                |
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

DM-विशिष्ट कुंजियाँ केवल direct-message बातचीत में मेल खाती हैं; वे समूह/thread routing को प्रभावित नहीं करतीं।

### चैनल डिफ़ॉल्ट और Heartbeat

प्रदाताओं में साझा group-policy और Heartbeat व्यवहार के लिए `channels.defaults` का उपयोग करें:

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

- `channels.defaults.groupPolicy`: जब प्रदाता-स्तर का `groupPolicy` सेट न हो, तब fallback समूह नीति।
- `channels.defaults.contextVisibility`: सभी चैनलों के लिए डिफ़ॉल्ट supplemental context visibility मोड। मान: `all` (डिफ़ॉल्ट, सभी quoted/thread/history context शामिल करें), `allowlist` (केवल allowlisted प्रेषकों का context शामिल करें), `allowlist_quote` (allowlist जैसा ही, लेकिन explicit quote/reply context रखें)। प्रति-चैनल ओवरराइड: `channels.<channel>.contextVisibility`।
- `channels.defaults.heartbeat.showOk`: Heartbeat आउटपुट में स्वस्थ चैनल स्थितियाँ शामिल करें।
- `channels.defaults.heartbeat.showAlerts`: Heartbeat आउटपुट में degraded/error स्थितियाँ शामिल करें।
- `channels.defaults.heartbeat.useIndicator`: compact indicator-style Heartbeat आउटपुट रेंडर करें।

### WhatsApp

WhatsApp Gateway के web channel (Baileys Web) के जरिए चलता है। linked session मौजूद होने पर यह अपने-आप शुरू होता है।

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

- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ WhatsApp DM और समूहों के लिए persistent ACP bindings कॉन्फ़िगर करती हैं। `match.peer.id` में E.164 direct number या WhatsApp group JID का उपयोग करें। फ़ील्ड semantics [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।

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

- Outbound commands मौजूद होने पर account `default` पर डिफ़ॉल्ट होते हैं; अन्यथा पहला configured account id (sorted)।
- वैकल्पिक `channels.whatsapp.defaultAccount` उस fallback default account selection को ओवरराइड करता है जब वह किसी configured account id से मेल खाता है।
- Legacy single-account Baileys auth dir को `openclaw doctor` द्वारा `whatsapp/default` में migrate किया जाता है।
- प्रति-अकाउंट ओवरराइड: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`।

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

- Bot token: `channels.telegram.botToken` या `channels.telegram.tokenFile` (केवल regular file; symlinks अस्वीकार किए जाते हैं), default account के लिए fallback के रूप में `TELEGRAM_BOT_TOKEN`।
- `apiRoot` केवल Telegram Bot API root है। `https://api.telegram.org` या अपने self-hosted/proxy root का उपयोग करें, `https://api.telegram.org/bot<TOKEN>` का नहीं; `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` suffix हटाता है।
- वैकल्पिक `channels.telegram.defaultAccount` default account selection को तब ओवरराइड करता है जब वह किसी configured account id से मेल खाता है।
- मल्टी-अकाउंट सेटअप (2+ account ids) में, fallback routing से बचने के लिए explicit default (`channels.telegram.defaultAccount` या `channels.telegram.accounts.default`) सेट करें; यह missing या invalid होने पर `openclaw doctor` चेतावनी देता है।
- `configWrites: false` Telegram-initiated config writes (supergroup ID migrations, `/config set|unset`) को ब्लॉक करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ forum topics के लिए persistent ACP bindings कॉन्फ़िगर करती हैं (`match.peer.id` में canonical `chatId:topic:topicId` का उपयोग करें)। फ़ील्ड semantics [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।
- Telegram stream previews `sendMessage` + `editMessageText` का उपयोग करते हैं (direct और group chats में काम करता है)।
- Retry नीति: [Retry नीति](/hi/concepts/retry) देखें।

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

- टोकन: `channels.discord.token`, डिफ़ॉल्ट खाते के लिए फ़ॉलबैक के रूप में `DISCORD_BOT_TOKEN` के साथ।
- स्पष्ट Discord `token` देने वाली सीधी आउटबाउंड कॉल उस कॉल के लिए वही टोकन इस्तेमाल करती हैं; खाता retry/policy सेटिंग अब भी सक्रिय रनटाइम स्नैपशॉट में चुने गए खाते से आती हैं।
- वैकल्पिक `channels.discord.defaultAccount` डिफ़ॉल्ट खाता चयन को ओवरराइड करता है, जब यह किसी कॉन्फ़िगर किए गए खाता id से मेल खाता है।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` (गिल्ड चैनल) इस्तेमाल करें; केवल संख्यात्मक IDs अस्वीकार किए जाते हैं।
- गिल्ड स्लग lowercase होते हैं, जिनमें spaces को `-` से बदला जाता है; चैनल keys स्लग किए गए नाम का उपयोग करती हैं (`#` नहीं)। गिल्ड IDs को प्राथमिकता दें।
- बॉट द्वारा लिखे संदेश डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं। `allowBots: true` उन्हें सक्षम करता है; केवल उन बॉट संदेशों को स्वीकार करने के लिए `allowBots: "mentions"` इस्तेमाल करें जो बॉट का mention करते हैं (अपने संदेश अब भी फ़िल्टर होते हैं)।
- बॉट-लेखित इनबाउंड संदेशों का समर्थन करने वाले चैनल साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) इस्तेमाल कर सकते हैं। baseline pair budgets के लिए `channels.defaults.botLoopProtection` सेट करें, फिर चैनल या खाते को केवल तब ओवरराइड करें जब किसी एक सतह को अलग limits चाहिए हों।
- `channels.discord.guilds.<id>.ignoreOtherMentions` (और चैनल ओवरराइड) उन संदेशों को छोड़ देता है जो किसी दूसरे user या role को mention करते हैं लेकिन बॉट को नहीं (@everyone/@here को छोड़कर)।
- `channels.discord.mentionAliases` भेजने से पहले स्थिर आउटबाउंड `@handle` text को Discord user IDs से मैप करता है, ताकि transient directory cache खाली होने पर भी ज्ञात teammates को deterministic रूप से mention किया जा सके। प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.mentionAliases` के अंतर्गत रहते हैं।
- `maxLinesPerMessage` (डिफ़ॉल्ट 17) लंबे संदेशों को 2000 chars से कम होने पर भी विभाजित करता है।
- `channels.discord.suppressEmbeds` डिफ़ॉल्ट रूप से `true` होता है, इसलिए disabled न होने तक आउटबाउंड URLs Discord link previews में expand नहीं होते। स्पष्ट `embeds` payloads फिर भी सामान्य रूप से भेजे जाते हैं; प्रति-संदेश tool calls `suppressEmbeds` से ओवरराइड कर सकते हैं।
- `channels.discord.threadBindings` Discord थ्रेड-बाउंड routing नियंत्रित करता है:
  - `enabled`: थ्रेड-बाउंड session features (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और bound delivery/routing) के लिए Discord ओवरराइड
  - `idleHours`: inactivity auto-unfocus के लिए घंटों में Discord ओवरराइड (`0` disabled करता है)
  - `maxAgeHours`: hard max age के लिए घंटों में Discord ओवरराइड (`0` disabled करता है)
  - `spawnSessions`: `sessions_spawn({ thread: true })` और ACP thread-spawn auto thread creation/binding के लिए स्विच (डिफ़ॉल्ट: `true`)
  - `defaultSpawnContext`: थ्रेड-बाउंड spawns के लिए native subagent context (डिफ़ॉल्ट रूप से `"fork"`)
- `type: "acp"` वाली top-level `bindings[]` entries चैनलों और थ्रेड्स के लिए persistent ACP bindings कॉन्फ़िगर करती हैं (`match.peer.id` में channel/thread id इस्तेमाल करें)। Field semantics [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings) में साझा हैं।
- `channels.discord.ui.components.accentColor` Discord components v2 containers के लिए accent color सेट करता है।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord component callbacks कितनी देर तक registered रहें। डिफ़ॉल्ट `1800000` (30 मिनट) है, अधिकतम `86400000` (24 घंटे) है, और प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.agentComponents.ttlMs` के अंतर्गत रहते हैं। लंबे values पुराने buttons/selects/forms को अधिक देर तक उपयोगी रखते हैं, इसलिए workflow में फिट होने वाला सबसे छोटा TTL प्राथमिकता दें।
- `channels.discord.voice` Discord voice channel conversations और वैकल्पिक auto-join + LLM + TTS ओवरराइड सक्षम करता है। केवल-text Discord configs voice को डिफ़ॉल्ट रूप से बंद रखते हैं; opt in करने के लिए `channels.discord.voice.enabled=true` सेट करें।
- `channels.discord.voice.model` वैकल्पिक रूप से Discord voice channel responses के लिए इस्तेमाल होने वाले LLM model को ओवरराइड करता है।
- `channels.discord.voice.daveEncryption` और `channels.discord.voice.decryptionFailureTolerance` `@discordjs/voice` DAVE options तक pass through करते हैं (डिफ़ॉल्ट रूप से `true` और `24`)।
- `channels.discord.voice.connectTimeoutMs` `/vc join` और auto-join attempts के लिए शुरुआती `@discordjs/voice` Ready wait नियंत्रित करता है (डिफ़ॉल्ट रूप से `30000`)।
- `channels.discord.voice.reconnectGraceMs` नियंत्रित करता है कि disconnected voice session को OpenClaw द्वारा destroy करने से पहले reconnect signalling में enter करने के लिए कितनी देर मिल सकती है (डिफ़ॉल्ट रूप से `15000`)।
- Discord voice playback किसी दूसरे user के speaking-start event से बाधित नहीं होता। feedback loops से बचने के लिए, TTS playing के दौरान OpenClaw नया voice capture ignore करता है।
- OpenClaw repeated decrypt failures के बाद voice session छोड़कर/rejoin करके voice receive recovery का अतिरिक्त प्रयास करता है।
- `channels.discord.streaming` canonical stream mode key है। Discord डिफ़ॉल्ट रूप से `streaming.mode: "progress"` इस्तेमाल करता है ताकि tool/work progress एक edited preview message में दिखाई दे; इसे disable करने के लिए `streaming.mode: "off"` सेट करें। Legacy `streamMode` और boolean `streaming` values runtime aliases बने रहते हैं; persisted config को rewrite करने के लिए `openclaw doctor --fix` चलाएं।
- `channels.discord.autoPresence` runtime availability को bot presence से map करता है (healthy => online, degraded => idle, exhausted => dnd) और वैकल्पिक status text overrides की अनुमति देता है।
- `channels.discord.dangerouslyAllowNameMatching` mutable name/tag matching को फिर से सक्षम करता है (break-glass compatibility mode)।
- `channels.discord.execApprovals`: Discord-native exec approval delivery और approver authorization।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। auto mode में, exec approvals तब activate होते हैं जब approvers को `approvers` या `commands.ownerAllowFrom` से resolve किया जा सकता है।
  - `approvers`: exec requests approve करने की अनुमति वाले Discord user IDs। छोड़े जाने पर `commands.ownerAllowFrom` पर fallback करता है।
  - `agentFilter`: वैकल्पिक agent ID allowlist। सभी agents के approvals forward करने के लिए छोड़ दें।
  - `sessionFilter`: वैकल्पिक session key patterns (substring या regex)।
  - `target`: approval prompts कहां भेजने हैं। `"dm"` (डिफ़ॉल्ट) approver DMs को भेजता है, `"channel"` originating channel को भेजता है, `"both"` दोनों को भेजता है। जब target में `"channel"` शामिल हो, buttons केवल resolved approvers द्वारा usable होते हैं।
  - `cleanupAfterResolve`: `true` होने पर approval, denial, या timeout के बाद approval DMs delete करता है।

**Reaction notification modes:** `off` (कोई नहीं), `own` (बॉट के संदेश, डिफ़ॉल्ट), `all` (सभी संदेश), `allowlist` (सभी संदेशों पर `guilds.<id>.users` से)।

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
- delivery targets के लिए `spaces/<spaceId>` या `users/<userId>` इस्तेमाल करें।
- `channels.googlechat.dangerouslyAllowNameMatching` mutable email principal matching को फिर से सक्षम करता है (break-glass compatibility mode)।

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
- **HTTP मोड** के लिए `botToken` के साथ `signingSecret` आवश्यक है (root पर या प्रति-खाता)।
- `socketMode` Slack SDK Socket Mode transport tuning को सार्वजनिक Bolt receiver API तक पास करता है। इसे केवल ping/pong timeout या stale websocket व्यवहार की जांच करते समय उपयोग करें। `clientPingTimeout` का डिफ़ॉल्ट `15000` है; `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर होने पर पास किए जाते हैं।
- `botToken`, `appToken`, `signingSecret`, और `userToken` plaintext
  strings या SecretRef objects स्वीकार करते हैं।
- Slack account snapshots प्रति-credential source/status fields दिखाते हैं, जैसे
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, और HTTP मोड में,
  `signingSecretStatus`। `configured_unavailable` का अर्थ है कि account
  SecretRef के माध्यम से configured है, लेकिन मौजूदा command/runtime path
  secret value resolve नहीं कर सका।
- `configWrites: false` Slack-initiated config writes को ब्लॉक करता है।
- वैकल्पिक `channels.slack.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।
- `channels.slack.streaming.mode` canonical Slack stream mode key है। `channels.slack.streaming.nativeTransport` Slack के native streaming transport को नियंत्रित करता है। Legacy `streamMode`, boolean `streaming`, और `nativeStreaming` values runtime aliases बने रहते हैं; persisted config को rewrite करने के लिए `openclaw doctor --fix` चलाएं।
- `unfurlLinks` और `unfurlMedia` bot replies के लिए Slack के `chat.postMessage` link और media unfurl booleans को पास करते हैं। `unfurlLinks` का डिफ़ॉल्ट `false` है ताकि outbound bot links enabled न होने तक inline expand न हों; `unfurlMedia` configured न होने तक omit किया जाता है। एक account के लिए top-level value को override करने हेतु कोई भी value `channels.slack.accounts.<accountId>` पर set करें।
- delivery targets के लिए `user:<id>` (DM) या `channel:<id>` का उपयोग करें।

**Reaction notification modes:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

**Thread session isolation:** `thread.historyScope` प्रति-thread (डिफ़ॉल्ट) है या channel में shared है। `thread.inheritParent` parent channel transcript को नए threads में copy करता है।

- Slack native streaming और Slack assistant-style "is typing..." thread status के लिए reply thread target आवश्यक है। Top-level DMs डिफ़ॉल्ट रूप से off-thread रहते हैं, इसलिए वे thread-style native stream/status preview दिखाने के बजाय Slack draft post-and-edit previews के माध्यम से अब भी stream कर सकते हैं।
- `typingReaction` inbound Slack message में reply चलने के दौरान temporary reaction जोड़ता है, फिर completion पर उसे हटा देता है। Slack emoji shortcode जैसे `"hourglass_flowing_sand"` का उपयोग करें।
- `channels.slack.execApprovals`: Slack-native approval-client delivery और exec approver authorization। Discord जैसा ही schema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter`, और `target` (`"dm"`, `"channel"`, या `"both"`)। Plugin approvals Slack-origin requests के लिए इस native-client path का उपयोग कर सकते हैं जब Slack plugin approvers resolve हों; Slack-native plugin approval delivery को Slack-origin sessions या Slack targets के लिए `approvals.plugin` के माध्यम से भी enabled किया जा सकता है। Plugin approvals `allowFrom` और default routing से Slack plugin approvers का उपयोग करते हैं, exec approvers का नहीं।

| Action group | Default | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + reactions list |
| messages     | enabled | Read/send/edit/delete  |
| pins         | enabled | Pin/unpin/list         |
| memberInfo   | enabled | Member info            |
| emojiList    | enabled | Custom emoji list      |

### Mattermost

Mattermost मौजूदा OpenClaw releases में bundled plugin के रूप में आता है। पुराने या
custom builds मौजूदा npm package को
`openclaw plugins install @openclaw/mattermost` से install कर सकते हैं। version pin करने से पहले current dist-tags के लिए
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

जब Mattermost native commands enabled हों:

- `commands.callbackPath` path होना चाहिए (उदाहरण के लिए `/api/channels/mattermost/command`), full URL नहीं।
- `commands.callbackUrl` को OpenClaw Gateway endpoint पर resolve होना चाहिए और Mattermost server से reachable होना चाहिए।
- Native slash callbacks उन per-command tokens से authenticated होते हैं जो
  slash command registration के दौरान Mattermost द्वारा लौटाए जाते हैं। यदि registration fail हो जाता है या कोई
  commands activated नहीं हैं, तो OpenClaw callbacks को
  `Unauthorized: invalid command token.` के साथ reject करता है।
- private/tailnet/internal callback hosts के लिए, Mattermost को
  `ServiceSettings.AllowedUntrustedInternalConnections` में callback host/domain शामिल करने की आवश्यकता हो सकती है।
  host/domain values का उपयोग करें, full URLs का नहीं।
- `channels.mattermost.configWrites`: Mattermost-initiated config writes को allow या deny करें।
- `channels.mattermost.requireMention`: channels में reply करने से पहले `@mention` आवश्यक करें।
- `channels.mattermost.groups.<channelId>.requireMention`: प्रति-channel mention-gating override (डिफ़ॉल्ट के लिए `"*"`).
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

**Reaction notification modes:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

- `channels.signal.account`: channel startup को किसी specific Signal account identity पर pin करें।
- `channels.signal.configWrites`: Signal-initiated config writes को allow या deny करें।
- वैकल्पिक `channels.signal.defaultAccount` डिफ़ॉल्ट account selection को override करता है जब यह configured account id से मेल खाता है।

### iMessage

OpenClaw `imsg rpc` spawn करता है (stdio पर JSON-RPC)। कोई daemon या port आवश्यक नहीं है। जब host Messages database और Automation permissions दे सकता है, तो यह नए OpenClaw iMessage setups के लिए preferred path है।

BlueBubbles support हटा दिया गया था। `channels.bluebubbles` मौजूदा OpenClaw पर supported runtime config surface नहीं है। पुराने configs को `channels.imessage` में migrate करें; short version के लिए [BlueBubbles removal and the imsg iMessage path](/hi/announcements/bluebubbles-imessage) और full translation table के लिए [Coming from BlueBubbles](/hi/channels/imessage-from-bluebubbles) का उपयोग करें।

यदि Gateway signed-in Messages Mac पर नहीं चल रहा है, तो `channels.imessage.enabled=true` रखें और `channels.imessage.cliPath` को ऐसे SSH wrapper पर set करें जो उस Mac पर `imsg "$@"` चलाता हो। डिफ़ॉल्ट local `imsg` path केवल macOS के लिए है।

production sends के लिए SSH wrapper पर भरोसा करने से पहले, उसी exact wrapper के माध्यम से outbound `imsg send` verify करें। कुछ macOS TCC states Messages Automation को `/usr/libexec/sshd-keygen-wrapper` assign करती हैं, जिससे reads और probes काम कर सकते हैं जबकि sends AppleEvents `-1743` के साथ fail हो जाते हैं; देखें [SSH wrapper sends fail with AppleEvents -1743](/hi/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
- `chat_id:<id>` targets को प्राथमिकता दें। chats list करने के लिए `imsg chats --limit 20` का उपयोग करें।
- `cliPath` SSH wrapper की ओर point कर सकता है; SCP attachment fetching के लिए `remoteHost` (`host` या `user@host`) set करें।
- `attachmentRoots` और `remoteAttachmentRoots` inbound attachment paths को restrict करते हैं (डिफ़ॉल्ट: `/Users/*/Library/Messages/Attachments`)।
- SCP strict host-key checking का उपयोग करता है, इसलिए सुनिश्चित करें कि relay host key पहले से `~/.ssh/known_hosts` में मौजूद है।
- `channels.imessage.configWrites`: iMessage-initiated config writes को allow या deny करें।
- `channels.imessage.sendTransport`: normal outbound replies के लिए preferred `imsg` RPC send transport। `auto` (डिफ़ॉल्ट) existing chats के लिए IMCore bridge का उपयोग करता है जब वह running हो, फिर AppleScript पर fallback करता है; `bridge` को private-API delivery की आवश्यकता होती है; `applescript` public Messages automation path को force करता है।
- `channels.imessage.actions.*`: private API actions enable करें जो `imsg status` / `openclaw channels status --probe` द्वारा भी gated हैं।
- `channels.imessage.includeAttachments` डिफ़ॉल्ट रूप से off है; agent turns में inbound media की अपेक्षा करने से पहले इसे `true` पर set करें।
- bridge/gateway restart के बाद inbound recovery automatic है (GUID dedupe plus stale-backlog age fence)। मौजूदा `channels.imessage.catchup.enabled: true` configs को अब भी deprecated compatibility profile के रूप में honored किया जाता है।
- `channels.imessage.groups`: group registry और per-group settings। `groupPolicy: "allowlist"` के साथ, explicit `chat_id` keys या `"*"` wildcard entry में से कोई configure करें ताकि group messages registry gate से pass हो सकें।
- `type: "acp"` वाली top-level `bindings[]` entries iMessage conversations को persistent ACP sessions से bind कर सकती हैं। `match.peer.id` में normalized handle या explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) का उपयोग करें। Shared field semantics: [ACP Agents](/hi/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix plugin-backed है और `channels.matrix` के तहत configured है।

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

- Token auth `accessToken` का उपयोग करता है; password auth `userId` + `password` का उपयोग करता है।
- `channels.matrix.proxy` Matrix HTTP ट्रैफ़िक को एक स्पष्ट HTTP(S) proxy के माध्यम से रूट करता है। नामित खाते इसे `channels.matrix.accounts.<id>.proxy` से override कर सकते हैं।
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` private/internal homeservers की अनुमति देता है। `proxy` और यह network opt-in स्वतंत्र नियंत्रण हैं।
- `channels.matrix.defaultAccount` multi-account setups में पसंदीदा खाते का चयन करता है।
- `channels.matrix.autoJoin` का default `off` है, इसलिए आमंत्रित rooms और नए DM-style invites तब तक अनदेखे किए जाते हैं जब तक आप `autoJoinAllowlist` के साथ `autoJoin: "allowlist"` या `autoJoin: "always"` सेट नहीं करते।
- `channels.matrix.execApprovals`: Matrix-native exec approval delivery और approver authorization।
  - `enabled`: `true`, `false`, या `"auto"` (default)। auto mode में, exec approvals तब सक्रिय होते हैं जब approvers को `approvers` या `commands.ownerAllowFrom` से resolve किया जा सकता है।
  - `approvers`: Matrix user IDs (उदा. `@owner:example.org`) जिन्हें exec requests approve करने की अनुमति है।
  - `agentFilter`: optional agent ID allowlist। सभी agents के लिए approvals forward करने हेतु omit करें।
  - `sessionFilter`: optional session key patterns (substring या regex)।
  - `target`: approval prompts कहां भेजने हैं। `"dm"` (default), `"channel"` (originating room), या `"both"`।
  - Per-account overrides: `channels.matrix.accounts.<id>.execApprovals`।
- `channels.matrix.dm.sessionScope` नियंत्रित करता है कि Matrix DMs sessions में कैसे group होते हैं: `per-user` (default) routed peer द्वारा share करता है, जबकि `per-room` प्रत्येक DM room को isolate करता है।
- Matrix status probes और live directory lookups runtime traffic जैसी ही proxy policy का उपयोग करते हैं।
- पूर्ण Matrix configuration, targeting rules, और setup examples [Matrix](/hi/channels/matrix) में documented हैं।

### Microsoft Teams

Microsoft Teams Plugin-backed है और `channels.msteams` के अंतर्गत configured होता है।

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

- यहां cover किए गए core key paths: `channels.msteams`, `channels.msteams.configWrites`।
- पूर्ण Teams config (credentials, webhook, DM/group policy, per-team/per-channel overrides) [Microsoft Teams](/hi/channels/msteams) में documented है।

### IRC

IRC Plugin-backed है और `channels.irc` के अंतर्गत configured होता है।

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

- यहां cover किए गए core key paths: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`।
- Optional `channels.irc.defaultAccount` default account selection को override करता है जब यह configured account id से match करता है।
- पूर्ण IRC channel configuration (host/port/TLS/channels/allowlists/mention gating) [IRC](/hi/channels/irc) में documented है।

### Multi-account (सभी चैनल)

प्रति channel कई accounts चलाएं (प्रत्येक का अपना `accountId`):

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

- `default` तब उपयोग किया जाता है जब `accountId` omit किया गया हो (CLI + routing)।
- Env tokens केवल **default** account पर apply होते हैं।
- Base channel settings सभी accounts पर apply होती हैं, जब तक प्रति account override न किया जाए।
- प्रत्येक account को अलग agent पर route करने के लिए `bindings[].match.accountId` का उपयोग करें।
- यदि आप single-account top-level channel config पर रहते हुए `openclaw channels add` (या channel onboarding) के माध्यम से non-default account जोड़ते हैं, तो OpenClaw पहले account-scoped top-level single-account values को channel account map में promote करता है ताकि original account काम करता रहे। अधिकांश channels उन्हें `channels.<channel>.accounts.default` में move करते हैं; Matrix इसके बजाय किसी मौजूदा matching named/default target को preserve कर सकता है।
- Existing channel-only bindings (कोई `accountId` नहीं) default account से match करते रहते हैं; account-scoped bindings optional बने रहते हैं।
- `openclaw doctor --fix` भी account-scoped top-level single-account values को उस channel के लिए चुने गए promoted account में move करके mixed shapes repair करता है। अधिकांश channels `accounts.default` का उपयोग करते हैं; Matrix इसके बजाय किसी मौजूदा matching named/default target को preserve कर सकता है।

### अन्य Plugin चैनल

कई Plugin channels `channels.<id>` के रूप में configured होते हैं और उनके dedicated channel pages में documented होते हैं (उदाहरण के लिए Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, और Twitch)।
पूरा channel index देखें: [चैनल](/hi/channels)।

### Group chat mention gating

Group messages default रूप से **require mention** होते हैं (metadata mention या safe regex patterns)। यह WhatsApp, Telegram, Discord, Google Chat, और iMessage group chats पर apply होता है।

Visible replies अलग से नियंत्रित होते हैं। Normal group, channel, और internal WebChat direct requests का default automatic final delivery है: final assistant text legacy visible reply path के माध्यम से post होता है। जब visible output केवल agent द्वारा `message(action=send)` call करने के बाद ही post होना चाहिए, तब `messages.visibleReplies: "message_tool"` या `messages.groupChat.visibleReplies: "message_tool"` में opt in करें। यदि model opted-in tool-only mode में message tool call किए बिना final text return करता है, तो वह final text private रहता है और gateway verbose log suppressed payload metadata record करता है।

Tool-only visible replies के लिए ऐसा model/runtime चाहिए जो tools को भरोसेमंद रूप से call करे, और GPT 5.5 जैसे latest-generation models पर shared ambient rooms के लिए इन्हें recommend किया जाता है। कुछ weaker models final text answer कर सकते हैं, लेकिन यह समझने में fail हो सकते हैं कि source-visible output को `message(action=send)` के साथ भेजना आवश्यक है। उन models के लिए, `"automatic"` का उपयोग करें ताकि final assistant turn visible reply path हो। यदि session log `didSendViaMessagingTool: false` के साथ assistant text दिखाता है, तो model ने message tool call करने के बजाय private final text produce किया। उस channel के लिए stronger tool-calling model पर switch करें, suppressed payload summary के लिए gateway verbose log inspect करें, या हर group/channel request के लिए visible final replies उपयोग करने हेतु `messages.groupChat.visibleReplies: "automatic"` set करें।

यदि active tool policy के अंतर्गत message tool unavailable है, तो OpenClaw response को silently suppress करने के बजाय automatic visible replies पर fall back करता है। `openclaw doctor` इस mismatch के बारे में warn करता है।

यह rule normal agent final text पर apply होता है। Plugin-owned conversation bindings claimed bound-thread turns के लिए owning plugin के returned reply को visible response के रूप में उपयोग करते हैं; plugin को उन binding replies के लिए `message(action=send)` call करने की आवश्यकता नहीं है।

**समस्या निवारण: group @mention typing trigger करता है फिर silence (कोई error नहीं)**

Symptom: कोई group/channel @mention typing indicator दिखाता है और gateway log `dispatch complete (queuedFinal=false, replies=0)` report करता है, लेकिन room में कोई message नहीं आता। उसी agent को DMs सामान्य रूप से reply करते हैं।

Cause: group/channel visible-reply mode `"message_tool"` पर resolve होता है, इसलिए OpenClaw turn चलाता है लेकिन final assistant text को suppress करता है जब तक agent `message(action=send)` call न करे। इस mode में कोई `NO_REPLY` contract नहीं है; message-tool call न होने का अर्थ source reply न होना है। कोई error नहीं है क्योंकि suppression configured behavior है। Normal group और channel turns का default `"automatic"` है, इसलिए यह symptom केवल तब दिखाई देता है जब `messages.groupChat.visibleReplies` (या global `messages.visibleReplies`) को स्पष्ट रूप से `"message_tool"` पर set किया गया हो। Harness `defaultVisibleReplies` यहां apply नहीं होता — group/channel resolver इसे ignore करता है; यह केवल direct/source chats को affect करता है (Codex harness direct-chat finals को इस तरह suppress करता है)।

Fix: या तो stronger tool-calling model चुनें, `"automatic"` default पर वापस fall back करने के लिए explicit `"message_tool"` override हटाएं, या हर group/channel request के लिए visible replies force करने हेतु `messages.groupChat.visibleReplies: "automatic"` set करें। File saved होने के बाद gateway `messages` config hot-reload करता है; gateway को केवल तब restart करें जब deployment में file watching या config reload disabled हो।

**Mention types:**

- **Metadata mentions**: Native platform @-mentions। WhatsApp self-chat mode में ignored।
- **Text patterns**: `agents.list[].groupChat.mentionPatterns` में safe regex patterns। Invalid patterns और unsafe nested repetition ignored हैं।
- Mention gating केवल तब enforce होती है जब detection संभव हो (native mentions या कम से कम एक pattern)।

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

`messages.groupChat.historyLimit` global default set करता है। Channels `channels.<channel>.historyLimit` (या per-account) से override कर सकते हैं। Disable करने के लिए `0` set करें।

`messages.groupChat.unmentionedInbound: "room_event"` supported channels पर unmentioned always-on group/channel messages को quiet room context के रूप में submit करता है। Mentioned messages, commands, और direct messages user requests बने रहते हैं। पूर्ण Discord, Slack, और Telegram examples के लिए [परिवेशी room events](/hi/channels/ambient-room-events) देखें।

`messages.visibleReplies` global source-event default है; `messages.groupChat.visibleReplies` इसे group/channel source events के लिए override करता है। जब `messages.visibleReplies` unset हो, direct/source chats selected runtime या harness default का उपयोग करते हैं, लेकिन internal WebChat direct turns Pi/Codex prompt parity के लिए automatic final delivery का उपयोग करते हैं। Visible output के लिए जानबूझकर `message(action=send)` require करने हेतु `messages.visibleReplies: "message_tool"` set करें। Channel allowlists और mention gating फिर भी तय करते हैं कि कोई event process किया जाएगा या नहीं।

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

Resolution: per-DM override → provider default → no limit (all retained)।

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

- यह ब्लॉक कमांड सतहों को कॉन्फ़िगर करता है। मौजूदा बिल्ट-इन + बंडल किए गए कमांड कैटलॉग के लिए, [स्लैश कमांड](/hi/tools/slash-commands) देखें।
- यह पेज **कॉन्फ़िग-की संदर्भ** है, पूरा कमांड कैटलॉग नहीं। चैनल/Plugin-स्वामित्व वाले कमांड जैसे QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, डिवाइस-पेयर `/pair`, मेमोरी `/dreaming`, फोन-कंट्रोल `/phone`, और Talk `/voice` उनके चैनल/Plugin पेजों और [स्लैश कमांड](/hi/tools/slash-commands) में दस्तावेज़ित हैं।
- टेक्स्ट कमांड अग्रणी `/` के साथ **अलग से** संदेश होने चाहिए।
- `native: "auto"` Discord/Telegram के लिए नेटिव कमांड चालू करता है, Slack को बंद रखता है।
- `nativeSkills: "auto"` Discord/Telegram के लिए नेटिव Skills कमांड चालू करता है, Slack को बंद रखता है।
- प्रति चैनल ओवरराइड करें: `channels.discord.commands.native` (bool या `"auto"`)। Discord के लिए, `false` स्टार्टअप के दौरान नेटिव कमांड पंजीकरण और क्लीनअप छोड़ देता है।
- `channels.<provider>.commands.nativeSkills` के साथ प्रति चैनल नेटिव Skills पंजीकरण ओवरराइड करें।
- `channels.telegram.customCommands` अतिरिक्त Telegram bot मेनू प्रविष्टियां जोड़ता है।
- `bash: true` होस्ट शेल के लिए `! <cmd>` सक्षम करता है। इसके लिए `tools.elevated.enabled` और प्रेषक का `tools.elevated.allowFrom.<channel>` में होना आवश्यक है।
- `config: true` `/config` सक्षम करता है (`openclaw.json` पढ़ता/लिखता है)। Gateway `chat.send` क्लाइंट के लिए, स्थायी `/config set|unset` लेखन के लिए `operator.admin` भी आवश्यक है; रीड-ओनली `/config show` सामान्य लेखन-स्कोप वाले ऑपरेटर क्लाइंट के लिए उपलब्ध रहता है।
- `mcp: true` `mcp.servers` के तहत OpenClaw-प्रबंधित MCP सर्वर कॉन्फ़िग के लिए `/mcp` सक्षम करता है।
- `plugins: true` Plugin खोज, इंस्टॉल, और सक्षम/अक्षम नियंत्रणों के लिए `/plugins` सक्षम करता है।
- `channels.<provider>.configWrites` प्रति चैनल कॉन्फ़िग म्यूटेशन को गेट करता है (डिफ़ॉल्ट: true)।
- मल्टी-अकाउंट चैनलों के लिए, `channels.<provider>.accounts.<id>.configWrites` उस अकाउंट को लक्षित करने वाले लेखन को भी गेट करता है (उदाहरण के लिए `/allowlist --config --account <id>` या `/config set channels.<provider>.accounts.<id>...`)।
- `restart: false` `/restart` और Gateway रीस्टार्ट टूल कार्रवाइयों को अक्षम करता है। डिफ़ॉल्ट: `true`।
- `ownerAllowFrom` केवल-स्वामी कमांड और स्वामी-गेटेड चैनल कार्रवाइयों के लिए स्पष्ट स्वामी allowlist है। यह `allowFrom` से अलग है।
- `ownerDisplay: "hash"` सिस्टम प्रॉम्प्ट में स्वामी ids को हैश करता है। हैशिंग नियंत्रित करने के लिए `ownerDisplaySecret` सेट करें।
- `allowFrom` प्रति-प्रदाता है। सेट होने पर, यह **एकमात्र** प्राधिकरण स्रोत होता है (चैनल allowlists/पेयरिंग और `useAccessGroups` अनदेखा किए जाते हैं)।
- `useAccessGroups: false` कमांड को access-group नीतियों को बायपास करने देता है जब `allowFrom` सेट न हो।
- कमांड दस्तावेज़ मैप:
  - बिल्ट-इन + बंडल किया गया कैटलॉग: [स्लैश कमांड](/hi/tools/slash-commands)
  - चैनल-विशिष्ट कमांड सतहें: [चैनल](/hi/channels)
  - QQ Bot कमांड: [QQ Bot](/hi/channels/qqbot)
  - पेयरिंग कमांड: [पेयरिंग](/hi/channels/pairing)
  - LINE कार्ड कमांड: [LINE](/hi/channels/line)
  - मेमोरी dreaming: [Dreaming](/hi/concepts/dreaming)

</Accordion>

---

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — शीर्ष-स्तरीय कुंजियां
- [कॉन्फ़िगरेशन — एजेंट](/hi/gateway/config-agents)
- [चैनल अवलोकन](/hi/channels)
