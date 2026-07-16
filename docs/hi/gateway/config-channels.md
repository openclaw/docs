---
read_when:
    - चैनल Plugin को कॉन्फ़िगर करना (प्रमाणीकरण, अभिगम नियंत्रण, एकाधिक खाते)
    - प्रति-चैनल कॉन्फ़िगरेशन कुंजियों की समस्या निवारण
    - DM नीति, समूह नीति या उल्लेख गेटिंग का ऑडिट करना
summary: 'चैनल कॉन्फ़िगरेशन: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage और अन्य में एक्सेस नियंत्रण, पेयरिंग और प्रति-चैनल कुंजियाँ'
title: कॉन्फ़िगरेशन — चैनल
x-i18n:
    generated_at: "2026-07-16T14:44:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` के अंतर्गत प्रति-चैनल कॉन्फ़िगरेशन कुंजियाँ: DM और समूह एक्सेस, बहु-अकाउंट सेटअप, उल्लेख गेटिंग, और Slack, Discord, Telegram, WhatsApp, Matrix, iMessage तथा अन्य चैनल Plugin के लिए प्रति-चैनल कुंजियाँ।

एजेंट, टूल, Gateway रनटाइम और अन्य शीर्ष-स्तरीय कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## चैनल

प्रत्येक चैनल का कॉन्फ़िगरेशन अनुभाग मौजूद होने पर वह स्वतः शुरू हो जाता है (जब तक कि `enabled: false` न हो)। Telegram और iMessage मुख्य `openclaw` पैकेज में शामिल होते हैं। अन्य आधिकारिक चैनल (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost और अन्य) `openclaw plugins install <spec>` के साथ अलग-अलग Plugin के रूप में इंस्टॉल होते हैं; पूरी सूची और इंस्टॉलेशन विनिर्देशों के लिए [चैनल](/hi/channels) देखें।

### DM और समूह एक्सेस

सभी चैनल DM नीतियों और समूह नीतियों का समर्थन करते हैं:

| DM नीति           | व्यवहार                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (डिफ़ॉल्ट) | अज्ञात प्रेषकों को एक बार उपयोग होने वाला पेयरिंग कोड मिलता है; स्वामी को अनुमोदन करना आवश्यक है |
| `allowlist`         | केवल `allowFrom` (या पेयर किए गए अनुमति स्टोर) के प्रेषक             |
| `open`              | आने वाले सभी DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)             |
| `disabled`          | आने वाले सभी DM को अनदेखा करें                                          |

| समूह नीति          | व्यवहार                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (डिफ़ॉल्ट) | केवल कॉन्फ़िगर की गई अनुमति-सूची से मेल खाने वाले समूह          |
| `open`                | समूह अनुमति-सूचियों को बायपास करें (उल्लेख गेटिंग फिर भी लागू होती है) |
| `disabled`            | सभी समूह/रूम संदेशों को अवरुद्ध करें                          |

<Note>
जब किसी प्रदाता का `groupPolicy` सेट न हो, तब `channels.defaults.groupPolicy` डिफ़ॉल्ट निर्धारित करता है।
पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं। लंबित पेयरिंग अनुरोधों की सीमा **प्रति अकाउंट 3** है (चैनल और अकाउंट आईडी के अनुसार सीमित)।
यदि प्रदाता ब्लॉक पूरी तरह अनुपस्थित हो (`channels.<provider>` अनुपस्थित), तो रनटाइम समूह नीति स्टार्टअप चेतावनी के साथ `allowlist` (विफल होने पर बंद) पर फ़ॉलबैक करती है।
</Note>

### चैनल मॉडल ओवरराइड

विशिष्ट चैनल आईडी या सीधे-संदेश वाले पीयर को किसी मॉडल पर पिन करने के लिए `channels.modelByChannel` का उपयोग करें। मान `provider/model` या कॉन्फ़िगर किए गए मॉडल उपनाम स्वीकार करते हैं। चैनल मैपिंग केवल तब लागू होती है, जब किसी सत्र में पहले से कोई सक्रिय मॉडल ओवरराइड न हो (उदाहरण के लिए, `/model` के माध्यम से सेट किया गया ओवरराइड)।

समूह/थ्रेड वार्तालापों के लिए, कुंजियाँ चैनल-विशिष्ट समूह आईडी, विषय आईडी या चैनल नाम होती हैं। सीधे-संदेश (DM) वार्तालापों के लिए, कुंजियाँ चैनल की प्रेषक पहचान (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` या `SenderId`) से प्राप्त पीयर पहचानकर्ता होती हैं। कुंजी का सटीक रूप चैनल पर निर्भर करता है:

| चैनल  | DM कुंजी का रूप         | उदाहरण                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | अपरिष्कृत उपयोगकर्ता आईडी         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix उपयोगकर्ता आईडी      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | अपरिष्कृत उपयोगकर्ता आईडी         | `123456789`                                  |
| WhatsApp | फ़ोन नंबर या JID | `15551234567`                                |

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

DM-विशिष्ट कुंजियाँ केवल सीधे-संदेश वाले वार्तालापों में मेल खाती हैं; वे समूह/थ्रेड रूटिंग को प्रभावित नहीं करतीं।

### चैनल डिफ़ॉल्ट और Heartbeat

सभी प्रदाताओं में साझा समूह-नीति और Heartbeat व्यवहार के लिए `channels.defaults` का उपयोग करें:

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

- `channels.defaults.groupPolicy`: जब प्रदाता-स्तरीय `groupPolicy` सेट न हो, तब फ़ॉलबैक समूह नीति।
- `channels.defaults.contextVisibility`: सभी चैनलों के लिए डिफ़ॉल्ट पूरक संदर्भ दृश्यता मोड। मान: `all` (डिफ़ॉल्ट, सभी उद्धृत/थ्रेड/इतिहास संदर्भ शामिल करें), `allowlist` (केवल अनुमति-सूचीबद्ध प्रेषकों का संदर्भ शामिल करें), `allowlist_quote` (अनुमति-सूची के समान, लेकिन स्पष्ट उद्धरण/उत्तर संदर्भ बनाए रखें)। प्रति-चैनल ओवरराइड: `channels.<channel>.contextVisibility`।
- `channels.defaults.heartbeat.showOk`: Heartbeat आउटपुट में स्वस्थ चैनल स्थितियाँ शामिल करें (डिफ़ॉल्ट `false`)।
- `channels.defaults.heartbeat.showAlerts`: Heartbeat आउटपुट में निम्नीकृत/त्रुटि स्थितियाँ शामिल करें (डिफ़ॉल्ट `true`)।
- `channels.defaults.heartbeat.useIndicator`: संक्षिप्त संकेतक-शैली का Heartbeat आउटपुट रेंडर करें (डिफ़ॉल्ट `true`)।

### WhatsApp

WhatsApp, Gateway के वेब चैनल (Baileys Web) के माध्यम से चलता है। लिंक किया गया सत्र मौजूद होने पर यह स्वतः शुरू होता है।

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
      maxAttempts: 12, // 0 = अनंत काल तक पुनः प्रयास करें
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // नीले निशान (स्वयं-चैट मोड में false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (डिफ़ॉल्ट `25000`), `connectTimeoutMs` (डिफ़ॉल्ट `60000`) और `defaultQueryTimeoutMs` (डिफ़ॉल्ट `60000`) Baileys सॉकेट को समायोजित करते हैं।
- `web.reconnect` के डिफ़ॉल्ट: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`। `maxAttempts: 0` प्रयास छोड़ने के बजाय अनंत काल तक पुनः प्रयास करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ WhatsApp DM और समूहों के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं। `match.peer.id` में E.164 सीधा नंबर या WhatsApp समूह JID का उपयोग करें। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।

<Accordion title="बहु-अकाउंट WhatsApp">

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

- यदि अकाउंट `default` मौजूद हो, तो आउटबाउंड कमांड डिफ़ॉल्ट रूप से उसका उपयोग करते हैं; अन्यथा कॉन्फ़िगर किया गया पहला अकाउंट आईडी (क्रमबद्ध) उपयोग होता है।
- वैकल्पिक `channels.whatsapp.defaultAccount` उस फ़ॉलबैक डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है, जब वह कॉन्फ़िगर किए गए किसी अकाउंट आईडी से मेल खाता हो।
- पुरानी एकल-अकाउंट Baileys प्रमाणीकरण डायरेक्टरी को `openclaw doctor` द्वारा `whatsapp/default` में माइग्रेट किया जाता है।
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
          systemPrompt: "उत्तर संक्षिप्त रखें।",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "विषय पर बने रहें।",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git बैकअप" },
        { command: "generate", description: "एक छवि बनाएँ" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: { mode: "partial" }, // off | partial | block | progress (डिफ़ॉल्ट: partial)
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

- बॉट टोकन: `channels.telegram.botToken` या `channels.telegram.tokenFile` (केवल सामान्य फ़ाइल; सिमलिंक अस्वीकार किए जाते हैं), डिफ़ॉल्ट अकाउंट के लिए फ़ॉलबैक के रूप में `TELEGRAM_BOT_TOKEN`।
- `apiRoot` केवल Telegram Bot API रूट है। `https://api.telegram.org/bot<TOKEN>` के बजाय `https://api.telegram.org` या अपने स्वयं-होस्टेड/प्रॉक्सी रूट का उपयोग करें; `openclaw doctor --fix` गलती से लगे अंतिम `/bot<TOKEN>` प्रत्यय को हटा देता है।
- `--local` मोड में स्वयं-होस्टेड Bot API सर्वर के लिए, `trustedLocalFileRoots` उन होस्ट पथों को सूचीबद्ध करता है जिन्हें OpenClaw पढ़ सकता है। सर्वर डेटा वॉल्यूम को OpenClaw होस्ट पर माउंट करें और या तो उसका डेटा रूट या प्रति-टोकन डायरेक्टरी कॉन्फ़िगर करें; `/var/lib/telegram-bot-api` के अंतर्गत कंटेनर पथों को उन रूट में मैप किया जाता है। अन्य निरपेक्ष पथ अस्वीकार ही रहते हैं।
- वैकल्पिक `channels.telegram.defaultAccount` डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है, जब वह कॉन्फ़िगर किए गए किसी अकाउंट आईडी से मेल खाता हो।
- बहु-अकाउंट सेटअप (2+ अकाउंट आईडी) में, फ़ॉलबैक रूटिंग से बचने के लिए स्पष्ट डिफ़ॉल्ट (`channels.telegram.defaultAccount` या `channels.telegram.accounts.default`) सेट करें; यह अनुपस्थित या अमान्य होने पर `openclaw doctor` चेतावनी देता है।
- `configWrites: false` Telegram द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन (सुपरग्रुप आईडी माइग्रेशन, `/config set|unset`) को अवरुद्ध करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ फ़ोरम विषयों के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं (`match.peer.id` में मानक `chatId:topic:topicId` का उपयोग करें)। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।
- Telegram स्ट्रीम पूर्वावलोकन `sendMessage` + `editMessageText` का उपयोग करते हैं (सीधी और समूह चैट में कार्य करता है)।
- सामान्य IPv6 फ़ेच विफलताओं से बचने के लिए `network.dnsResultOrder` का डिफ़ॉल्ट `"ipv4first"` होता है।
- पुनः प्रयास नीति: [पुनः प्रयास नीति](/hi/concepts/retry) देखें।

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
              systemPrompt: "केवल संक्षिप्त उत्तर दें।",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord डिफ़ॉल्ट: progress)
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

- टोकन: `channels.discord.token`, डिफ़ॉल्ट खाते के लिए फ़ॉलबैक के रूप में `DISCORD_BOT_TOKEN` के साथ।
- स्पष्ट Discord `token` प्रदान करने वाली प्रत्यक्ष आउटबाउंड कॉल उस कॉल के लिए उसी टोकन का उपयोग करती हैं; खाते की पुनः प्रयास/नीति सेटिंग अभी भी सक्रिय रनटाइम स्नैपशॉट में चयनित खाते से आती हैं।
- वैकल्पिक `channels.discord.defaultAccount`, कॉन्फ़िगर किए गए खाता आईडी से मेल खाने पर डिफ़ॉल्ट खाते के चयन को ओवरराइड करता है।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` (गिल्ड चैनल) का उपयोग करें; केवल संख्यात्मक आईडी अस्वीकार कर दिए जाते हैं।
- गिल्ड स्लग लोअरकेस में होते हैं और रिक्त स्थानों को `-` से बदला जाता है; चैनल कुंजियाँ स्लग किए गए नाम का उपयोग करती हैं (`#` के बिना)। गिल्ड आईडी को प्राथमिकता दें।
- बॉट द्वारा लिखे गए संदेश डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं। `allowBots: true` उन्हें सक्षम करता है; केवल उन बॉट संदेशों को स्वीकार करने के लिए `allowBots: "mentions"` का उपयोग करें जिनमें बॉट का उल्लेख हो (स्वयं के संदेश फिर भी फ़िल्टर किए जाते हैं)।
- बॉट द्वारा लिखे गए इनबाउंड संदेशों का समर्थन करने वाले चैनल साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग कर सकते हैं। आधारभूत युग्म बजट के लिए `channels.defaults.botLoopProtection` सेट करें, फिर केवल तब चैनल या खाते को ओवरराइड करें जब किसी एक सतह को अलग सीमाओं की आवश्यकता हो।
- `channels.discord.guilds.<id>.ignoreOtherMentions` (और चैनल ओवरराइड) ऐसे संदेशों को छोड़ देता है जिनमें किसी अन्य उपयोगकर्ता या भूमिका का उल्लेख हो, लेकिन बॉट का नहीं (@everyone/@here को छोड़कर)।
- `channels.discord.mentionAliases`, भेजने से पहले स्थिर आउटबाउंड `@handle` टेक्स्ट को Discord उपयोगकर्ता आईडी से मैप करता है, ताकि क्षणिक डायरेक्टरी कैश खाली होने पर भी ज्ञात टीम-साथियों का उल्लेख नियतात्मक रूप से किया जा सके। प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.mentionAliases` के अंतर्गत रहते हैं।
- `maxLinesPerMessage` (डिफ़ॉल्ट `17`) लंबे संदेशों को 2000 वर्णों से कम होने पर भी विभाजित करता है।
- `channels.discord.suppressEmbeds` का डिफ़ॉल्ट `true` है, इसलिए अक्षम किए जाने तक आउटबाउंड URL Discord लिंक पूर्वावलोकन में विस्तृत नहीं होते। स्पष्ट `embeds` पेलोड फिर भी सामान्य रूप से भेजे जाते हैं; प्रति-संदेश टूल कॉल `suppressEmbeds` से इसे ओवरराइड कर सकती हैं।
- `channels.discord.threadBindings` Discord के थ्रेड-बाउंड रूटिंग को नियंत्रित करता है:
  - `enabled`: थ्रेड-बाउंड सत्र सुविधाओं के लिए Discord ओवरराइड (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और बाउंड डिलीवरी/रूटिंग)
  - `idleHours`: घंटों में निष्क्रियता के बाद स्वतः अनफ़ोकस के लिए Discord ओवरराइड (`0` इसे अक्षम करता है)
  - `maxAgeHours`: घंटों में कठोर अधिकतम आयु के लिए Discord ओवरराइड (`0` इसे अक्षम करता है)
  - `spawnSessions`: `sessions_spawn({ thread: true })` और ACP थ्रेड-स्पॉन के स्वतः थ्रेड निर्माण/बाइंडिंग का स्विच (डिफ़ॉल्ट: `true`)
  - `defaultSpawnContext`: थ्रेड-बाउंड स्पॉन के लिए मूल सबएजेंट संदर्भ (डिफ़ॉल्ट रूप से `"fork"`)
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ चैनलों और थ्रेड के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं (`match.peer.id` में चैनल/थ्रेड आईडी का उपयोग करें)। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।
- `channels.discord.ui.components.accentColor` Discord components v2 कंटेनरों के लिए एक्सेंट रंग सेट करता है।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord कंपोनेंट कॉलबैक कितनी देर तक पंजीकृत रहें। डिफ़ॉल्ट `1800000` (30 मिनट), अधिकतम `86400000` (24 घंटे)। प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.agentComponents.ttlMs` के अंतर्गत रहते हैं। वर्कफ़्लो के अनुकूल सबसे छोटी TTL को प्राथमिकता दें।
- `channels.discord.voice` Discord वॉइस चैनल वार्तालाप और वैकल्पिक स्वतः-जुड़ाव + LLM + TTS ओवरराइड सक्षम करता है। केवल-टेक्स्ट Discord कॉन्फ़िगरेशन में वॉइस डिफ़ॉल्ट रूप से बंद रहती है; इसे चुनने के लिए `channels.discord.voice.enabled=true` सेट करें।
- `channels.discord.voice.model` वैकल्पिक रूप से Discord वॉइस चैनल प्रतिक्रियाओं के लिए उपयोग किए जाने वाले LLM मॉडल को ओवरराइड करता है।
- `channels.discord.voice.daveEncryption` (डिफ़ॉल्ट `true`) और `channels.discord.voice.decryptionFailureTolerance` (डिफ़ॉल्ट `24`) को `@discordjs/voice` DAVE विकल्पों तक यथावत भेजा जाता है।
- `channels.discord.voice.connectTimeoutMs`, `/vc join` और स्वतः-जुड़ने के प्रयासों के लिए प्रारंभिक `@discordjs/voice` Ready प्रतीक्षा को नियंत्रित करता है (डिफ़ॉल्ट `30000`)।
- `channels.discord.voice.reconnectGraceMs` नियंत्रित करता है कि OpenClaw द्वारा किसी डिस्कनेक्ट वॉइस सत्र को नष्ट करने से पहले वह पुनः कनेक्शन संकेत की अवस्था में प्रवेश करने में कितना समय ले सकता है (डिफ़ॉल्ट `15000`)।
- किसी अन्य उपयोगकर्ता के बोलना-आरंभ करने की घटना से Discord वॉइस प्लेबैक बाधित नहीं होता। फ़ीडबैक लूप से बचने के लिए, TTS चलने के दौरान OpenClaw नया वॉइस कैप्चर अनदेखा करता है।
- बार-बार डिक्रिप्शन विफल होने के बाद OpenClaw वॉइस सत्र को छोड़कर उसमें फिर से शामिल होने के माध्यम से वॉइस रिसीव रिकवरी का भी प्रयास करता है।
- `channels.discord.streaming` मानक स्ट्रीम मोड कुंजी है। Discord का डिफ़ॉल्ट `streaming.mode: "progress"` है, ताकि टूल/कार्य की प्रगति एक संपादित पूर्वावलोकन संदेश में दिखाई दे; इसे अक्षम करने के लिए `streaming.mode: "off"` सेट करें। पुराने फ़्लैट कुंजियों (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) को अब रनटाइम पर नहीं पढ़ा जाता; स्थायी कॉन्फ़िगरेशन माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
- `channels.discord.autoPresence` रनटाइम उपलब्धता को बॉट उपस्थिति से मैप करता है (स्वस्थ => ऑनलाइन, अवनत => निष्क्रिय, समाप्त => dnd) और वैकल्पिक स्थिति टेक्स्ट ओवरराइड की अनुमति देता है।
- `channels.discord.guilds.<id>.presenceEvents` मानव उपलब्धता आगमन को एजेंट सिस्टम घटनाओं के रूप में एक कॉन्फ़िगर किए गए Discord चैनल में रूट करता है। पात्र सदस्यों को `channelId` देखने में सक्षम होना चाहिए; सार्वजनिक थ्रेड मूल चैनल की दृश्यता प्राप्त करते हैं, जबकि निजी थ्रेड के लिए सदस्यता या Manage Threads भी आवश्यक है। `users` उस दर्शक-वर्ग को और सीमित कर सकता है। यह पूर्ण `GUILD_CREATE` स्नैपशॉट से वर्तमान ऑनलाइन सदस्यों को आरंभिक रूप से भरता है, देखे गए ऑफ़लाइन-से-ऑनलाइन संक्रमणों को रूट करता है, और किसी न देखे गए सदस्य के लिए बाद में मिलने वाले पहले ऑनलाइन संकेत को नई उपलब्धता मानता है, बिना यह दावा किए कि वे ऑनलाइन आए या स्नैपशॉट के बाद शामिल हुए। Discord की 75,000-सदस्य स्नैपशॉट सीमा से बड़े गिल्ड में पहले एक स्पष्ट ऑफ़लाइन अपडेट आवश्यक है। थ्रॉटलिंग नियंत्रण: `reconnectSuppressSeconds` (नए Gateway सत्र के बाद गिल्ड उपस्थिति स्थिति के पुनर्निर्माण के दौरान शांत अवधि, डिफ़ॉल्ट 300, `0` इसे अक्षम करता है) और `burstLimit`/`burstWindowSeconds` (प्रति-गिल्ड सफलतापूर्वक कतारबद्ध घटना दर सीमा, डिफ़ॉल्ट रूप से 60s की स्लाइडिंग विंडो में 8 घटनाएँ)। पुनः आरंभ किए गए सत्र पुनः कनेक्शन दमन विंडो प्रारंभ नहीं करते। मौजूदा प्रति-उपयोगकर्ता पुनः-अभिवादन कूलडाउन आठ घंटे रहता है। इसके लिए `channels.discord.intents.presence=true`, Discord के Developer Portal में विशेषाधिकार-प्राप्त Presence Intent, और सक्षम एजेंट Heartbeat आवश्यक हैं।
- `channels.discord.dangerouslyAllowNameMatching` परिवर्तनीय नाम/टैग मिलान को फिर से सक्षम करता है (आपातकालीन संगतता मोड)।
- `channels.discord.execApprovals`: Discord-मूल exec अनुमोदन डिलीवरी और अनुमोदक प्राधिकरण।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। स्वतः मोड में, जब अनुमोदकों को `approvers` या `commands.ownerAllowFrom` से हल किया जा सकता है, तब exec अनुमोदन सक्रिय हो जाते हैं।
  - `approvers`: exec अनुरोधों को अनुमोदित करने की अनुमति वाले Discord उपयोगकर्ता आईडी। छोड़े जाने पर `commands.ownerAllowFrom` का फ़ॉलबैक उपयोग होता है।
  - `agentFilter`: वैकल्पिक एजेंट आईडी अनुमति-सूची। सभी एजेंटों के अनुमोदन अग्रेषित करने के लिए इसे छोड़ दें।
  - `sessionFilter`: वैकल्पिक सत्र कुंजी पैटर्न (सबस्ट्रिंग या रेगेक्स)।
  - `target`: अनुमोदन प्रॉम्प्ट कहाँ भेजे जाएँ। `"dm"` (डिफ़ॉल्ट) अनुमोदकों के DM में भेजता है, `"channel"` मूल चैनल में भेजता है, `"both"` दोनों में भेजता है। जब लक्ष्य में `"channel"` शामिल हो, तो बटन केवल हल किए गए अनुमोदक ही उपयोग कर सकते हैं।
  - `cleanupAfterResolve`: `true` होने पर अनुमोदन, अस्वीकृति या समय-समाप्ति के बाद अनुमोदन DM हटा देता है।

**प्रतिक्रिया सूचना मोड:** `off` (कोई नहीं), `own` (बॉट के संदेश, डिफ़ॉल्ट), `all` (सभी संदेश), `allowlist` (सभी संदेशों पर `guilds.<id>.users` से)।

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

- सेवा खाता JSON: इनलाइन (`serviceAccount`) या फ़ाइल-आधारित (`serviceAccountFile`)।
- सेवा खाता SecretRef भी समर्थित है (`serviceAccountRef`)।
- पर्यावरण फ़ॉलबैक: `GOOGLE_CHAT_SERVICE_ACCOUNT` या `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (केवल डिफ़ॉल्ट खाता)।
- डिलीवरी लक्ष्यों के लिए `spaces/<spaceId>` या `users/<userId>` का उपयोग करें।
- `channels.googlechat.dangerouslyAllowNameMatching` परिवर्तनीय ईमेल प्रिंसिपल मिलान को फिर से सक्षम करता है (आपातकालीन संगतता मोड)।

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
          systemPrompt: "केवल संक्षिप्त उत्तर दें।",
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
        nativeTransport: true, // mode=partial होने पर Slack की मूल स्ट्रीमिंग API का उपयोग करें
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

- **Socket मोड** के लिए `botToken` और `appToken` दोनों आवश्यक हैं (डिफ़ॉल्ट खाते के env फ़ॉलबैक के लिए `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)।
- **HTTP मोड** के लिए `botToken` के साथ `signingSecret` आवश्यक है (रूट पर या प्रति-खाता)।
- `enterpriseOrgInstall: true` किसी खाते को Slack Enterprise Grid के
  संगठन-व्यापी इवेंट पथ में शामिल करता है। स्टार्टअप `auth.test` के साथ बॉट टोकन सत्यापित करता है और
  कॉन्फ़िगर किया गया मोड Slack की इंस्टॉलेशन पहचान से मेल न खाने पर
  विफल हो जाता है। Enterprise DM अक्षम होने चाहिए या प्रभावी
  `allowFrom: ["*"]` के साथ `dmPolicy: "open"` का उपयोग करना चाहिए। चैनल और उपयोगकर्ता नीतियों में स्थिर Slack ID का उपयोग होना चाहिए;
  परिवर्तनशील नाम और असमर्थित चैनल प्रीफ़िक्स के कारण स्टार्टअप विफल हो जाता है। V1 केवल
  प्रत्यक्ष Socket Mode या तत्काल उत्तरों वाले HTTP `message` और `app_mention` इवेंट संभालता है;
  रिले, कमांड, इंटरैक्शन, App Home, प्रतिक्रिया इवेंट लिसनर,
  पिन, एक्शन टूल, मूल अनुमोदन, बाइंडिंग, विलंबित डिलीवरी और
  सक्रिय रूप से भेजना उपलब्ध नहीं हैं। लिसनर के स्वामित्व वाली अभिस्वीकृति, टाइपिंग और
  स्थिति प्रतिक्रियाएँ `reactions:write` के साथ उपलब्ध रहती हैं; इनबाउंड प्रतिक्रिया
  सूचनाएँ और प्रतिक्रिया एक्शन टूल उपलब्ध नहीं हैं। न्यूनतम-विशेषाधिकार मैनिफ़ेस्ट,
  सेटअप वर्कफ़्लो और संपूर्ण प्रतिबंधों के लिए
  [Enterprise Grid के संगठन-व्यापी इंस्टॉलेशन](/hi/channels/slack#enterprise-grid-org-wide-installs)
  देखें।
- `socketMode` Slack SDK Socket Mode ट्रांसपोर्ट ट्यूनिंग को सार्वजनिक Bolt रिसीवर API तक अग्रेषित करता है। इसका उपयोग केवल ping/pong टाइमआउट या पुराने websocket व्यवहार की जाँच करते समय करें। `clientPingTimeout` का डिफ़ॉल्ट `15000` है; `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर होने पर अग्रेषित किए जाते हैं।
- `botToken`, `appToken`, `signingSecret` और `userToken` प्लेनटेक्स्ट
  स्ट्रिंग या SecretRef ऑब्जेक्ट स्वीकार करते हैं।
- Slack खाते के स्नैपशॉट प्रति-क्रेडेंशियल स्रोत/स्थिति फ़ील्ड दिखाते हैं, जैसे
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` और HTTP मोड में
  `signingSecretStatus`। `configured_unavailable` का अर्थ है कि खाता
  SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड/रनटाइम पथ
  सीक्रेट मान को हल नहीं कर सका।
- `configWrites: false` Slack द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन को अवरुद्ध करता है।
- वैकल्पिक `channels.slack.defaultAccount` किसी कॉन्फ़िगर किए गए खाता ID से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।
- `channels.slack.streaming.mode` Slack स्ट्रीम मोड की कैनोनिकल कुंजी है (डिफ़ॉल्ट `"partial"`)। `channels.slack.streaming.nativeTransport` Slack के मूल स्ट्रीमिंग ट्रांसपोर्ट को नियंत्रित करता है (डिफ़ॉल्ट `true`)। पुराने `streamMode`, बूलियन `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` और `nativeStreaming` मान अब रनटाइम पर नहीं पढ़े जाते; स्थायी कॉन्फ़िगरेशन को `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` में माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
- `unfurlLinks` और `unfurlMedia` बॉट उत्तरों के लिए Slack के `chat.postMessage` लिंक और मीडिया अनफ़र्ल बूलियन को अग्रेषित करते हैं। `unfurlLinks` का डिफ़ॉल्ट `false` है, ताकि सक्षम किए बिना आउटबाउंड बॉट लिंक इनलाइन विस्तृत न हों; कॉन्फ़िगर न होने पर `unfurlMedia` छोड़ दिया जाता है। किसी एक खाते के लिए शीर्ष-स्तरीय मान को ओवरराइड करने हेतु दोनों में से कोई भी मान `channels.slack.accounts.<accountId>` पर सेट करें।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` का उपयोग करें।

**प्रतिक्रिया सूचना मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

**थ्रेड सत्र पृथक्करण:** `thread.historyScope` प्रति-थ्रेड (डिफ़ॉल्ट) होता है या पूरे चैनल में साझा होता है। `thread.inheritParent` पैरेंट चैनल की ट्रांसक्रिप्ट को नए थ्रेड में कॉपी करता है। `thread.initialHistoryLimit` (डिफ़ॉल्ट `20`) यह सीमित करता है कि नया थ्रेड सत्र शुरू होने पर कितने मौजूदा थ्रेड संदेश प्राप्त किए जाएँ; `0` थ्रेड इतिहास प्राप्त करना अक्षम करता है।

- Slack की मूल स्ट्रीमिंग और Slack सहायक-शैली की "is typing..." थ्रेड स्थिति के लिए उत्तर का लक्ष्य कोई थ्रेड होना आवश्यक है। शीर्ष-स्तरीय DM डिफ़ॉल्ट रूप से थ्रेड से बाहर रहते हैं, इसलिए वे थ्रेड-शैली की मूल स्ट्रीम/स्थिति झलक दिखाने के बजाय Slack की ड्राफ़्ट पोस्ट-और-संपादन झलक के माध्यम से अब भी स्ट्रीम कर सकते हैं।
- `typingReaction` उत्तर चलने के दौरान इनबाउंड Slack संदेश पर एक अस्थायी प्रतिक्रिया जोड़ता है, फिर पूरा होने पर उसे हटा देता है। `"hourglass_flowing_sand"` जैसा Slack इमोजी शॉर्टकोड उपयोग करें।
- `channels.slack.execApprovals`: Slack-मूल अनुमोदन-क्लाइंट डिलीवरी और exec अनुमोदक प्राधिकरण। Discord जैसी ही स्कीमा: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack उपयोगकर्ता ID), `agentFilter`, `sessionFilter` और `target` (`"dm"`, `"channel"` या `"both"`)। Slack Plugin अनुमोदक हल होने पर Plugin अनुमोदन Slack से आरंभ हुए अनुरोधों के लिए इस मूल-क्लाइंट पथ का उपयोग कर सकते हैं; Slack-मूल Plugin अनुमोदन डिलीवरी को Slack से आरंभ हुए सत्रों या Slack लक्ष्यों के लिए `approvals.plugin` के माध्यम से भी सक्षम किया जा सकता है। Plugin अनुमोदन `allowFrom` के Slack Plugin अनुमोदकों और डिफ़ॉल्ट रूटिंग का उपयोग करते हैं, exec अनुमोदकों का नहीं।

| एक्शन समूह | डिफ़ॉल्ट | टिप्पणियाँ                  |
| ------------ | ------- | ---------------------- |
| reactions    | सक्षम | प्रतिक्रिया दें + प्रतिक्रियाएँ सूचीबद्ध करें |
| messages     | सक्षम | पढ़ें/भेजें/संपादित करें/हटाएँ  |
| pins         | सक्षम | पिन करें/पिन हटाएँ/सूचीबद्ध करें         |
| memberInfo   | सक्षम | सदस्य की जानकारी            |
| emojiList    | सक्षम | कस्टम इमोजी सूची      |

### Mattermost

Mattermost एक अलग Plugin के रूप में इंस्टॉल होता है, ठीक उसी तरह जैसे Discord, Slack और WhatsApp होते हैं:

```bash
openclaw plugins install @openclaw/mattermost
```

किसी संस्करण को पिन करने से पहले वर्तमान dist-tags के लिए [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) जाँचें।

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
        native: true, // ऑप्ट-इन
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // रिवर्स-प्रॉक्सी/सार्वजनिक परिनियोजन के लिए वैकल्पिक स्पष्ट URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

चैट मोड: `oncall` (@-उल्लेख पर उत्तर, डिफ़ॉल्ट), `onmessage` (प्रत्येक संदेश), `onchar` (ट्रिगर प्रीफ़िक्स से शुरू होने वाले संदेश)।

जब Mattermost के मूल कमांड सक्षम हों:

- `commands.callbackPath` एक पथ होना चाहिए (उदाहरण के लिए `/api/channels/mattermost/command`), पूर्ण URL नहीं।
- `commands.callbackUrl` को OpenClaw Gateway एंडपॉइंट पर हल होना चाहिए और Mattermost सर्वर से पहुँच योग्य होना चाहिए।
- मूल स्लैश कॉलबैक का प्रमाणीकरण प्रति-कमांड टोकन से किया जाता है, जिन्हें
  Mattermost स्लैश कमांड पंजीकरण के दौरान लौटाता है। यदि पंजीकरण विफल होता है या कोई
  कमांड सक्रिय नहीं होता, तो OpenClaw कॉलबैक को
  `Unauthorized: invalid command token.` के साथ अस्वीकार करता है।
- निजी/tailnet/आंतरिक कॉलबैक होस्ट के लिए Mattermost को
  कॉलबैक होस्ट/डोमेन शामिल करने हेतु `ServiceSettings.AllowedUntrustedInternalConnections` की आवश्यकता हो सकती है।
  होस्ट/डोमेन मान उपयोग करें, पूर्ण URL नहीं।
- `channels.mattermost.configWrites`: Mattermost द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन को अनुमति दें या अस्वीकार करें।
- `channels.mattermost.requireMention`: चैनलों में उत्तर देने से पहले `@mention` आवश्यक बनाएँ।
- `channels.mattermost.groups.<channelId>.requireMention`: प्रति-चैनल उल्लेख-गेटिंग ओवरराइड (डिफ़ॉल्ट के लिए `"*"`)।
- वैकल्पिक `channels.mattermost.defaultAccount` किसी कॉन्फ़िगर किए गए खाता ID से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // वैकल्पिक खाता बाइंडिंग
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

**प्रतिक्रिया सूचना मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

- `channels.signal.account`: चैनल स्टार्टअप को किसी विशिष्ट Signal खाता पहचान से पिन करें।
- `channels.signal.configWrites`: Signal द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन को अनुमति दें या अस्वीकार करें।
- वैकल्पिक `channels.signal.defaultAccount` किसी कॉन्फ़िगर किए गए खाता ID से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।

### iMessage

OpenClaw `imsg rpc` आरंभ करता है (stdio पर JSON-RPC)। किसी डेमन या पोर्ट की आवश्यकता नहीं है। जब होस्ट Messages डेटाबेस और Automation अनुमतियाँ प्रदान कर सकता हो, तब नए OpenClaw iMessage सेटअप के लिए यह पसंदीदा पथ है।

BlueBubbles समर्थन हटा दिया गया है। वर्तमान OpenClaw में `channels.bluebubbles` समर्थित रनटाइम कॉन्फ़िगरेशन सतह नहीं है। पुराने कॉन्फ़िगरेशन को `channels.imessage` में माइग्रेट करें; संक्षिप्त संस्करण के लिए [BlueBubbles हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) तथा संपूर्ण अनुवाद तालिका के लिए [BlueBubbles से आना](/hi/channels/imessage-from-bluebubbles) देखें।

यदि Gateway साइन-इन किए हुए Messages Mac पर नहीं चल रहा है, तो `channels.imessage.enabled=true` बनाए रखें और `channels.imessage.cliPath` को ऐसे SSH रैपर पर सेट करें जो उस Mac पर `imsg "$@"` चलाता हो। डिफ़ॉल्ट स्थानीय `imsg` पथ केवल macOS के लिए है।

उत्पादन प्रेषण के लिए SSH रैपर पर निर्भर होने से पहले, उसी सटीक रैपर के माध्यम से आउटबाउंड `imsg send` सत्यापित करें। कुछ macOS TCC स्थितियाँ Messages Automation को `/usr/libexec/sshd-keygen-wrapper` को सौंपती हैं, जिससे पढ़ना और जाँच करना काम कर सकता है जबकि प्रेषण AppleEvents `-1743` के साथ विफल हो जाता है; [iMessage](/hi/channels/imessage) पर SSH रैपर समस्या-निवारण अनुभाग देखें।

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

- वैकल्पिक `channels.imessage.defaultAccount` कॉन्फ़िगर किए गए खाता आईडी से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।
- Messages DB के लिए Full Disk Access आवश्यक है।
- `chat_id:<id>` लक्ष्यों को प्राथमिकता दें। चैट सूचीबद्ध करने के लिए `imsg chats --limit 20` का उपयोग करें।
- `cliPath` किसी SSH रैपर की ओर इंगित कर सकता है; SCP से अटैचमेंट प्राप्त करने के लिए `remoteHost` (`host` या `user@host`) सेट करें।
- `attachmentRoots` और `remoteAttachmentRoots` इनबाउंड अटैचमेंट पथों को सीमित करते हैं (डिफ़ॉल्ट: `/Users/*/Library/Messages/Attachments`)।
- SCP सख्त होस्ट-कुंजी जाँच का उपयोग करता है, इसलिए सुनिश्चित करें कि रिले होस्ट की कुंजी पहले से `~/.ssh/known_hosts` में मौजूद हो।
- `channels.imessage.configWrites`: iMessage द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन को अनुमति दें या अस्वीकार करें।
- `channels.imessage.sendTransport`: सामान्य आउटबाउंड उत्तरों के लिए पसंदीदा `imsg` RPC प्रेषण ट्रांसपोर्ट। `auto` (डिफ़ॉल्ट) चालू होने पर मौजूदा चैट के लिए IMCore ब्रिज का उपयोग करता है, फिर AppleScript पर वापस जाता है; `bridge` के लिए निजी-API डिलीवरी आवश्यक है; `applescript` सार्वजनिक Messages ऑटोमेशन पथ को बाध्य करता है।
- `channels.imessage.actions.*`: निजी API क्रियाएँ सक्षम करें, जिन्हें `imsg status` / `openclaw channels status --probe` द्वारा भी नियंत्रित किया जाता है।
- `channels.imessage.includeAttachments` डिफ़ॉल्ट रूप से बंद है; एजेंट टर्न में इनबाउंड मीडिया की अपेक्षा करने से पहले इसे `true` पर सेट करें।
- ब्रिज/Gateway पुनरारंभ होने के बाद इनबाउंड पुनर्प्राप्ति स्वचालित है (GUID डीडुप्लिकेशन और पुरानी बैकलॉग आयु-सीमा)। मौजूदा `channels.imessage.catchup.enabled: true` कॉन्फ़िगरेशन को अब भी बहिष्कृत संगतता प्रोफ़ाइल के रूप में स्वीकार किया जाता है; `catchup` डिफ़ॉल्ट रूप से अक्षम है।
- `channels.imessage.groups`: समूह रजिस्ट्री और प्रति-समूह सेटिंग। `groupPolicy: "allowlist"` के साथ, स्पष्ट `chat_id` कुंजियाँ या `"*"` वाइल्डकार्ड प्रविष्टि कॉन्फ़िगर करें, ताकि समूह संदेश रजिस्ट्री गेट से गुजर सकें।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ iMessage वार्तालापों को स्थायी ACP सत्रों से बाँध सकती हैं। `match.peer.id` में सामान्यीकृत हैंडल या स्पष्ट चैट लक्ष्य (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) का उपयोग करें। साझा फ़ील्ड अर्थविज्ञान: [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings)।

<Accordion title="iMessage SSH रैपर का उदाहरण">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix Plugin-समर्थित है और `channels.matrix` के अंतर्गत कॉन्फ़िगर किया जाता है।

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

- टोकन प्रमाणीकरण `accessToken` का उपयोग करता है; पासवर्ड प्रमाणीकरण `userId` + `password` का उपयोग करता है।
- `channels.matrix.proxy` Matrix HTTP ट्रैफ़िक को स्पष्ट HTTP(S) प्रॉक्सी के माध्यम से रूट करता है। नामित खाते इसे `channels.matrix.accounts.<id>.proxy` से ओवरराइड कर सकते हैं।
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` निजी/आंतरिक होमसर्वर की अनुमति देता है। `proxy` और यह नेटवर्क ऑप्ट-इन स्वतंत्र नियंत्रण हैं।
- `channels.matrix.defaultAccount` बहु-खाता सेटअप में पसंदीदा खाता चुनता है।
- `channels.matrix.autoJoin` का डिफ़ॉल्ट `"off"` है, इसलिए आमंत्रित रूम और नए DM-जैसे आमंत्रण तब तक अनदेखे किए जाते हैं, जब तक आप `autoJoin: "allowlist"` को `autoJoinAllowlist` या `autoJoin: "always"` के साथ सेट नहीं करते।
- `channels.matrix.execApprovals`: Matrix-मूल निष्पादन अनुमोदन डिलीवरी और अनुमोदक प्राधिकरण।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। स्वचालित मोड में, निष्पादन अनुमोदन तब सक्रिय होते हैं जब अनुमोदकों को `approvers` या `commands.ownerAllowFrom` से निर्धारित किया जा सकता है।
  - `approvers`: निष्पादन अनुरोधों को अनुमोदित करने की अनुमति वाले Matrix उपयोगकर्ता आईडी (उदाहरण: `@owner:example.org`)।
  - `agentFilter`: वैकल्पिक एजेंट आईडी अनुमति-सूची। सभी एजेंटों के अनुमोदन अग्रेषित करने के लिए इसे छोड़ दें।
  - `sessionFilter`: वैकल्पिक सत्र कुंजी पैटर्न (सबस्ट्रिंग या रेगेक्स)।
  - `target`: अनुमोदन प्रॉम्प्ट कहाँ भेजने हैं। `"dm"` (डिफ़ॉल्ट), `"channel"` (मूल रूम), या `"both"`।
  - प्रति-खाता ओवरराइड: `channels.matrix.accounts.<id>.execApprovals`।
- `channels.matrix.dm.sessionScope` नियंत्रित करता है कि Matrix DM सत्रों में कैसे समूहित होते हैं: `per-user` (डिफ़ॉल्ट) रूट किए गए पीयर के अनुसार साझा करता है, जबकि `per-room` प्रत्येक DM रूम को अलग रखता है।
- Matrix स्थिति जाँच और लाइव डायरेक्टरी लुकअप रनटाइम ट्रैफ़िक जैसी ही प्रॉक्सी नीति का उपयोग करते हैं।
- संपूर्ण Matrix कॉन्फ़िगरेशन, लक्ष्यीकरण नियम और सेटअप उदाहरण [Matrix](/hi/channels/matrix) में प्रलेखित हैं।

### Microsoft Teams

Microsoft Teams Plugin-समर्थित है और `channels.msteams` के अंतर्गत कॉन्फ़िगर किया जाता है।

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

- यहाँ शामिल मुख्य कुंजी पथ: `channels.msteams`, `channels.msteams.configWrites`।
- Teams का संपूर्ण कॉन्फ़िगरेशन (क्रेडेंशियल, Webhook, DM/समूह नीति, प्रति-टीम/प्रति-चैनल ओवरराइड) [Microsoft Teams](/hi/channels/msteams) में प्रलेखित है।

### IRC

IRC Plugin-समर्थित है और `channels.irc` के अंतर्गत कॉन्फ़िगर किया जाता है।

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

- यहाँ शामिल मुख्य कुंजी पथ: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`।
- वैकल्पिक `channels.irc.defaultAccount` कॉन्फ़िगर किए गए खाता आईडी से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।
- संपूर्ण IRC चैनल कॉन्फ़िगरेशन (होस्ट/पोर्ट/TLS/चैनल/अनुमति-सूचियाँ/उल्लेख गेटिंग) [IRC](/hi/channels/irc) में प्रलेखित है।

### बहु-खाता (सभी चैनल)

प्रत्येक चैनल के लिए कई खाते चलाएँ (हर खाते का अपना `accountId` होगा):

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

- `accountId` छोड़े जाने पर `default` का उपयोग होता है (CLI + रूटिंग)।
- पर्यावरण टोकन केवल **डिफ़ॉल्ट** खाते पर लागू होते हैं।
- मूल चैनल सेटिंग सभी खातों पर लागू होती हैं, जब तक उन्हें प्रति खाते ओवरराइड न किया जाए।
- प्रत्येक खाते को अलग एजेंट पर रूट करने के लिए `bindings[].match.accountId` का उपयोग करें।
- यदि आप एकल-खाता शीर्ष-स्तरीय चैनल कॉन्फ़िगरेशन पर रहते हुए `openclaw channels add` (या चैनल ऑनबोर्डिंग) के माध्यम से कोई गैर-डिफ़ॉल्ट खाता जोड़ते हैं, तो OpenClaw पहले खाता-सीमित शीर्ष-स्तरीय एकल-खाता मानों को चैनल खाता मैप में पदोन्नत करता है, ताकि मूल खाता काम करता रहे। अधिकांश चैनल इन्हें `channels.<channel>.accounts.default` में ले जाते हैं; इसके बजाय Matrix किसी मौजूदा मेल खाते नामित/डिफ़ॉल्ट लक्ष्य को बनाए रख सकता है।
- मौजूदा केवल-चैनल बाइंडिंग (`accountId` के बिना) डिफ़ॉल्ट खाते से मेल खाती रहती हैं; खाता-सीमित बाइंडिंग वैकल्पिक रहती हैं।
- `openclaw doctor --fix` मिश्रित संरचनाओं की भी मरम्मत करता है। इसके लिए वह खाता-सीमित शीर्ष-स्तरीय एकल-खाता मानों को उस चैनल के लिए चुने गए पदोन्नत खाते में ले जाता है। अधिकांश चैनल `accounts.default` का उपयोग करते हैं; इसके बजाय Matrix किसी मौजूदा मेल खाते नामित/डिफ़ॉल्ट लक्ष्य को बनाए रख सकता है।

### अन्य Plugin चैनल

कई Plugin चैनल `channels.<id>` के रूप में कॉन्फ़िगर किए जाते हैं और उनके समर्पित चैनल पृष्ठों में प्रलेखित हैं (उदाहरण के लिए Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch और Zalo)।
संपूर्ण चैनल अनुक्रमणिका देखें: [चैनल](/hi/channels)।

### समूह चैट उल्लेख गेटिंग

समूह संदेशों में डिफ़ॉल्ट रूप से **उल्लेख आवश्यक** होता है (मेटाडेटा उल्लेख या सुरक्षित रेगेक्स पैटर्न)। यह WhatsApp, Telegram, Discord, Google Chat और iMessage समूह चैट पर लागू होता है।

दृश्यमान उत्तरों को अलग से नियंत्रित किया जाता है। सामान्य समूह, चैनल और आंतरिक WebChat प्रत्यक्ष अनुरोधों में डिफ़ॉल्ट रूप से अंतिम डिलीवरी स्वचालित होती है: सहायक का अंतिम टेक्स्ट पुराने दृश्यमान उत्तर पथ से पोस्ट होता है। जब दृश्यमान आउटपुट केवल एजेंट द्वारा `message(action=send)` कॉल किए जाने के बाद पोस्ट होना चाहिए, तब `messages.visibleReplies: "message_tool"` या `messages.groupChat.visibleReplies: "message_tool"` चुनें। यदि मॉडल केवल-टूल मोड चुने जाने पर संदेश टूल कॉल किए बिना कोई सार्थक अंतिम उत्तर देता है, तो वह अंतिम टेक्स्ट निजी रहता है, Gateway का वर्बोज़ लॉग दबाए गए पेलोड का मेटाडेटा दर्ज करता है और OpenClaw मॉडल से वही उत्तर `message(action=send)` के माध्यम से देने के लिए कहते हुए एक पुनर्प्राप्ति पुनःप्रयास कतारबद्ध करता है।

केवल-टूल दृश्यमान उत्तरों के लिए ऐसे मॉडल/रनटाइम की आवश्यकता होती है जो विश्वसनीय रूप से टूल कॉल करे, और GPT-5.6 Sol जैसे नवीनतम पीढ़ी के मॉडलों पर साझा परिवेशी रूम के लिए इनकी अनुशंसा की जाती है। कुछ कमज़ोर मॉडल अंतिम टेक्स्ट से उत्तर दे सकते हैं, लेकिन यह समझने में विफल रहते हैं कि स्रोत पर दृश्यमान आउटपुट `message(action=send)` से भेजना आवश्यक है। OpenClaw सामान्य रूप से अटके अंतिम उत्तर की स्थिति से डिफ़ॉल्ट रूप से केवल तभी उबरता है, जब अंतिम उत्तर सार्थक हो, स्रोत टर्न कोई रूम इवेंट न हो, प्रेषण नीति ने डिलीवरी अस्वीकार न की हो और कोई स्रोत उत्तर पहले से न भेजा गया हो। पुनर्प्राप्ति एक पुनःप्रयास तक सीमित है; यह कृत्रिम पुनःप्रयास प्रॉम्प्ट के स्थायीकरण को रोकती है और उस पुनःप्रयास को संग्रह बैचिंग से बाहर रखती है, ताकि वह असंबंधित कतारबद्ध प्रॉम्प्ट के साथ विलय न हो सके। यदि पुनःप्रयास भी अटक जाता है या कतारबद्ध नहीं किया जा सकता, तो OpenClaw केवल स्वच्छ किया हुआ निदान संदेश देता है, जैसे "मैंने एक उत्तर तैयार किया, लेकिन उसे इस चैट में नहीं पहुँचा सका। कृपया फिर से प्रयास करें।" मूल निजी अंतिम टेक्स्ट को स्वचालित स्रोत डिलीवरी के लिए कभी चिह्नित नहीं किया जाता। बार-बार उत्तर अटकाने वाले मॉडलों के लिए `"automatic"` का उपयोग करें, ताकि सहायक का अंतिम टर्न दृश्यमान उत्तर पथ बने; अधिक सक्षम टूल-कॉलिंग मॉडल अपनाएँ; दबाए गए पेलोड सारांश के लिए Gateway का वर्बोज़ लॉग देखें; या प्रत्येक समूह/चैनल अनुरोध के लिए दृश्यमान अंतिम उत्तरों का उपयोग करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें।

यदि सक्रिय टूल नीति के अंतर्गत संदेश टूल उपलब्ध नहीं है, तो OpenClaw उत्तर को चुपचाप दबाने के बजाय स्वचालित दृश्यमान उत्तरों पर वापस जाता है। `openclaw doctor` इस असंगति के बारे में चेतावनी देता है।

यह नियम एजेंट के सामान्य अंतिम टेक्स्ट पर लागू होता है। Plugin के स्वामित्व वाली वार्तालाप बाइंडिंग, दावा किए गए बाउंड-थ्रेड टर्न के दृश्यमान उत्तर के रूप में स्वामी Plugin द्वारा लौटाए गए उत्तर का उपयोग करती हैं; उन बाइंडिंग उत्तरों के लिए Plugin को `message(action=send)` कॉल करने की आवश्यकता नहीं है।

**समस्या निवारण: समूह @mention से टाइपिंग शुरू होती है, फिर मौन रहता है (कोई त्रुटि नहीं)**

लक्षण: किसी समूह/चैनल में @mention टाइपिंग संकेतक दिखाता है और Gateway लॉग `dispatch complete (queuedFinal=false, replies=0)` रिपोर्ट करता है, लेकिन रूम में कोई संदेश नहीं पहुँचता। उसी एजेंट को भेजे गए DM का उत्तर सामान्य रूप से मिलता है।

कारण: समूह/चैनल का दृश्य-उत्तर मोड `"message_tool"` पर रिज़ॉल्व होता है, इसलिए OpenClaw टर्न चलाता है लेकिन अंतिम सहायक टेक्स्ट को तब तक प्रदर्शित नहीं करता जब तक एजेंट `message(action=send)` को कॉल न करे। इस मोड में कोई `NO_REPLY` अनुबंध नहीं है; message-tool कॉल न होने का अर्थ है कि मूल अंतिम टेक्स्ट निजी है। सार्थक स्रोत टर्न के लिए OpenClaw अब एक सुरक्षित पुनर्प्राप्ति पुनः प्रयास करता है; छोटे नोट, स्पष्ट मौन, रूम इवेंट, भेजने की नीति द्वारा अस्वीकृत टर्न और पहले ही डिलीवर किए जा चुके टर्न का पुनः प्रयास नहीं किया जाता। सामान्य समूह और चैनल टर्न डिफ़ॉल्ट रूप से `"automatic"` का उपयोग करते हैं, इसलिए यह लक्षण केवल तब दिखाई देता है जब `messages.groupChat.visibleReplies` (या वैश्विक `messages.visibleReplies`) को स्पष्ट रूप से `"message_tool"` पर सेट किया गया हो। Harness `defaultVisibleReplies` यहाँ लागू नहीं होता — समूह/चैनल रिज़ॉल्वर इसे अनदेखा करता है; यह केवल प्रत्यक्ष/स्रोत चैट को प्रभावित करता है (Codex harness इसी तरह प्रत्यक्ष-चैट के अंतिम उत्तरों को प्रदर्शित होने से रोकता है)।

समाधान: या तो अधिक सक्षम टूल-कॉलिंग मॉडल चुनें, `"automatic"` डिफ़ॉल्ट पर वापस जाने के लिए स्पष्ट `"message_tool"` ओवरराइड हटाएँ, या प्रत्येक समूह/चैनल अनुरोध के लिए दृश्य उत्तर बाध्य करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें। कोई सार्थक अटकी हुई अंतिम प्रतिक्रिया अब मौन सफलता के रूप में समाप्त नहीं होनी चाहिए; उसे या तो एक `message(action=send)` पुनः प्रयास से पुनर्प्राप्त होना चाहिए या सैनिटाइज़ किया हुआ डिलीवरी-विफलता निदान दिखाना चाहिए। फ़ाइल सहेजे जाने के बाद Gateway `messages` कॉन्फ़िगरेशन को हॉट-रीलोड करता है; Gateway को केवल तभी पुनः आरंभ करें जब डिप्लॉयमेंट में फ़ाइल वॉचिंग या कॉन्फ़िगरेशन रीलोड अक्षम हो।

**मेंशन के प्रकार:**

- **मेटाडेटा मेंशन**: मूल प्लेटफ़ॉर्म के @-मेंशन। WhatsApp स्व-चैट मोड में अनदेखे किए जाते हैं।
- **टेक्स्ट पैटर्न**: `agents.list[].groupChat.mentionPatterns` में सुरक्षित regex पैटर्न। अमान्य पैटर्न और असुरक्षित नेस्टेड पुनरावृत्ति अनदेखी की जाती हैं।
- मेंशन गेटिंग केवल तभी लागू की जाती है जब पहचान संभव हो (मूल मेंशन या कम-से-कम एक पैटर्न)।

```json5
{
  messages: {
    visibleReplies: "automatic", // प्रत्यक्ष/स्रोत चैट के लिए पुराने स्वचालित अंतिम उत्तर बाध्य करें
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // हमेशा सक्रिय बिना-मेंशन वाली रूम बातचीत शांत संदर्भ बन जाती है
      visibleReplies: "message_tool", // ऑप्ट-इन; दृश्य रूम उत्तरों के लिए message(action=send) आवश्यक बनाएँ
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` वैश्विक डिफ़ॉल्ट सेट करता है। चैनल `channels.<channel>.historyLimit` (या प्रति-अकाउंट) से इसे ओवरराइड कर सकते हैं। अक्षम करने के लिए `0` सेट करें।

`messages.groupChat.unmentionedInbound: "room_event"` समर्थित चैनलों पर बिना-मेंशन वाले हमेशा सक्रिय समूह/चैनल संदेशों को शांत रूम संदर्भ के रूप में सबमिट करता है। मेंशन वाले संदेश, कमांड और प्रत्यक्ष संदेश उपयोगकर्ता अनुरोध बने रहते हैं। Discord, Slack और Telegram के संपूर्ण उदाहरणों के लिए [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events) देखें।

`messages.visibleReplies` वैश्विक स्रोत-इवेंट डिफ़ॉल्ट है; समूह/चैनल स्रोत इवेंट के लिए `messages.groupChat.visibleReplies` इसे ओवरराइड करता है। जब `messages.visibleReplies` सेट न हो, तब प्रत्यक्ष/स्रोत चैट चयनित रनटाइम या harness डिफ़ॉल्ट का उपयोग करती हैं, लेकिन आंतरिक WebChat प्रत्यक्ष टर्न Pi/Codex प्रॉम्प्ट समानता के लिए स्वचालित अंतिम डिलीवरी का उपयोग करते हैं। दृश्य आउटपुट के लिए जानबूझकर `message(action=send)` आवश्यक बनाने हेतु `messages.visibleReplies: "message_tool"` सेट करें। चैनल अनुमत-सूचियाँ और मेंशन गेटिंग अब भी तय करती हैं कि किसी इवेंट को प्रोसेस किया जाए या नहीं।

#### DM इतिहास सीमाएँ

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

रिज़ॉल्यूशन: प्रति-DM ओवरराइड → प्रदाता डिफ़ॉल्ट → कोई सीमा नहीं (सभी बनाए रखे जाते हैं)।

यह रिज़ॉल्वर ऐसे किसी भी चैनल के लिए `channels.<provider>.dmHistoryLimit` और `channels.<provider>.dms.<id>.historyLimit` पढ़ता है जिसकी सेशन कुंजी मानक `provider:direct:<id>` (या लेगेसी `provider:dm:<id>`) संरचना का पालन करती है, इसलिए यह केवल किसी निश्चित सूची तक सीमित न रहकर बंडल किए गए और Plugin चैनलों, दोनों में काम करता है।

#### स्व-चैट मोड

स्व-चैट मोड सक्षम करने के लिए `allowFrom` में अपना नंबर शामिल करें (मूल @-मेंशन अनदेखे करता है, केवल टेक्स्ट पैटर्न का उत्तर देता है):

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

### कमांड (चैट कमांड प्रबंधन)

```json5
{
  commands: {
    native: "auto", // समर्थित होने पर मूल कमांड पंजीकृत करें
    nativeSkills: "auto", // समर्थित होने पर मूल skill कमांड पंजीकृत करें
    text: true, // चैट संदेशों में /commands पार्स करें
    bash: false, // ! की अनुमति दें (उपनाम: /bash)
    bashForegroundMs: 2000,
    config: false, // /config की अनुमति दें
    mcp: false, // /mcp की अनुमति दें
    plugins: false, // /plugins की अनुमति दें
    debug: false, // /debug की अनुमति दें
    restart: true, // /restart + बाहरी SIGUSR1 पुनः आरंभ अनुरोधों की अनुमति दें
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

<Accordion title="कमांड विवरण">

- यह ब्लॉक कमांड सतहों को कॉन्फ़िगर करता है। वर्तमान अंतर्निहित + बंडल किए गए कमांड कैटलॉग के लिए [स्लैश कमांड](/hi/tools/slash-commands) देखें।
- यह पृष्ठ **कॉन्फ़िगरेशन-कुंजी संदर्भ** है, संपूर्ण कमांड कैटलॉग नहीं। चैनल/Plugin के स्वामित्व वाले कमांड, जैसे QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, डिवाइस-पेयर `/pair`, मेमोरी `/dreaming`, फ़ोन-कंट्रोल `/phone` और Talk `/voice`, उनके चैनल/Plugin पृष्ठों के साथ-साथ [स्लैश कमांड](/hi/tools/slash-commands) में प्रलेखित हैं।
- टेक्स्ट कमांड अग्रणी `/` वाले **अलग** संदेश होने चाहिए।
- `native: "auto"` Discord/Telegram के लिए मूल कमांड चालू करता है और Slack के लिए उन्हें बंद रखता है।
- `nativeSkills: "auto"` Discord/Telegram के लिए मूल skill कमांड चालू करता है और Slack के लिए उन्हें बंद रखता है।
- प्रति चैनल ओवरराइड करें: `channels.discord.commands.native` (bool या `"auto"`)। Discord के लिए, `false` स्टार्टअप के दौरान मूल कमांड पंजीकरण और क्लीनअप छोड़ देता है।
- `channels.<provider>.commands.nativeSkills` से प्रति चैनल मूल skill पंजीकरण ओवरराइड करें।
- `channels.telegram.customCommands` अतिरिक्त Telegram bot मेनू प्रविष्टियाँ जोड़ता है।
- `bash: true` होस्ट शेल के लिए `! <cmd>` सक्षम करता है। इसके लिए `tools.elevated.enabled` और प्रेषक का `tools.elevated.allowFrom.<channel>` में होना आवश्यक है।
- `config: true` `/config` सक्षम करता है (`openclaw.json` को पढ़ता/लिखता है)। Gateway `chat.send` क्लाइंट के लिए, स्थायी `/config set|unset` लेखन हेतु `operator.admin` भी आवश्यक है; केवल-पढ़ने योग्य `/config show` सामान्य लेखन-स्कोप वाले ऑपरेटर क्लाइंट के लिए उपलब्ध रहता है।
- `mcp: true` `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP सर्वर कॉन्फ़िगरेशन के लिए `/mcp` सक्षम करता है।
- `plugins: true` Plugin खोज, इंस्टॉलेशन और सक्षम/अक्षम नियंत्रणों के लिए `/plugins` सक्षम करता है।
- `channels.<provider>.configWrites` प्रति चैनल कॉन्फ़िगरेशन परिवर्तन नियंत्रित करता है (डिफ़ॉल्ट: true)।
- बहु-अकाउंट चैनलों के लिए, `channels.<provider>.accounts.<id>.configWrites` उस अकाउंट को लक्षित करने वाले लेखन को भी नियंत्रित करता है (उदाहरण के लिए `/allowlist --config --account <id>` या `/config set channels.<provider>.accounts.<id>...`)।
- `restart: false` `/restart` और बाहरी `SIGUSR1` पुनः आरंभ अनुरोधों को अक्षम करता है। डिफ़ॉल्ट: `true`।
- `ownerAllowFrom` केवल-स्वामी कमांड और स्वामी-नियंत्रित चैनल कार्रवाइयों के लिए स्पष्ट स्वामी अनुमत-सूची है। यह `allowFrom` से अलग है।
- `ownerDisplay: "hash"` सिस्टम प्रॉम्प्ट में स्वामी आईडी को हैश करता है। हैशिंग नियंत्रित करने के लिए `ownerDisplaySecret` सेट करें।
- `allowFrom` प्रति-प्रदाता है। सेट होने पर यह प्राधिकरण का **एकमात्र** स्रोत होता है (चैनल अनुमत-सूचियाँ/पेयरिंग और `useAccessGroups` अनदेखे किए जाते हैं)।
- `useAccessGroups: false`, `allowFrom` सेट न होने पर कमांड को एक्सेस-समूह नीतियाँ बायपास करने देता है।
- कमांड दस्तावेज़ मानचित्र:
  - अंतर्निहित + बंडल किया गया कैटलॉग: [स्लैश कमांड](/hi/tools/slash-commands)
  - चैनल-विशिष्ट कमांड सतहें: [चैनल](/hi/channels)
  - QQ Bot कमांड: [QQ Bot](/hi/channels/qqbot)
  - पेयरिंग कमांड: [पेयरिंग](/hi/channels/pairing)
  - LINE कार्ड कमांड: [LINE](/hi/channels/line)
  - मेमोरी Dreaming: [Dreaming](/hi/concepts/dreaming)

</Accordion>

---

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — शीर्ष-स्तरीय कुंजियाँ
- [कॉन्फ़िगरेशन — एजेंट](/hi/gateway/config-agents)
- [चैनलों का अवलोकन](/hi/channels)
