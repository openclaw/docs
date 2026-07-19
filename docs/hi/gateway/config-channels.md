---
read_when:
    - चैनल Plugin कॉन्फ़िगर करना (प्रमाणीकरण, अभिगम नियंत्रण, एकाधिक खाते)
    - प्रति-चैनल कॉन्फ़िगरेशन कुंजियों की समस्या निवारण
    - DM नीति, समूह नीति या उल्लेख गेटिंग का ऑडिट करना
summary: 'चैनल कॉन्फ़िगरेशन: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage और अन्य में एक्सेस नियंत्रण, पेयरिंग और प्रति-चैनल कुंजियाँ'
title: कॉन्फ़िगरेशन — चैनल
x-i18n:
    generated_at: "2026-07-19T08:38:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c140baf821ecf9ebabebb365d3105d69fad742cd0cce1b6a8b9d8d46bb5e7642
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` के अंतर्गत प्रति-चैनल कॉन्फ़िगरेशन कुंजियाँ: DM और समूह पहुँच, बहु-अकाउंट सेटअप, उल्लेख गेटिंग, और Slack, Discord, Telegram, WhatsApp, Matrix, iMessage तथा अन्य चैनल plugins के लिए प्रति-चैनल कुंजियाँ।

एजेंट, टूल, Gateway रनटाइम और अन्य शीर्ष-स्तरीय कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## चैनल

जब प्रत्येक चैनल का कॉन्फ़िगरेशन अनुभाग मौजूद होता है, तो वह स्वतः शुरू हो जाता है (जब तक कि `enabled: false` न हो)। Telegram और iMessage मूल `openclaw` पैकेज में शामिल होते हैं। अन्य आधिकारिक चैनल (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost और अन्य) `openclaw plugins install <spec>` के साथ अलग plugins के रूप में इंस्टॉल होते हैं; पूरी सूची और इंस्टॉलेशन विनिर्देशों के लिए [चैनल](/hi/channels) देखें।

### DM और समूह पहुँच

सभी चैनल DM नीतियों और समूह नीतियों का समर्थन करते हैं:

| DM नीति           | व्यवहार                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (डिफ़ॉल्ट) | अज्ञात प्रेषकों को एक बार उपयोग होने वाला पेयरिंग कोड मिलता है; स्वामी को अनुमोदन करना आवश्यक है |
| `allowlist`         | केवल `allowFrom` (या पेयर किए गए अनुमति स्टोर) में शामिल प्रेषक             |
| `open`              | सभी इनबाउंड DM की अनुमति दें (`allowFrom: ["*"]` आवश्यक)             |
| `disabled`          | सभी इनबाउंड DM को अनदेखा करें                                          |

| समूह नीति          | व्यवहार                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (डिफ़ॉल्ट) | केवल कॉन्फ़िगर की गई अनुमति-सूची से मेल खाने वाले समूह          |
| `open`                | समूह अनुमति-सूचियों को बायपास करें (उल्लेख गेटिंग फिर भी लागू होती है) |
| `disabled`            | सभी समूह/रूम संदेशों को अवरुद्ध करें                          |

<Note>
जब किसी प्रदाता का `groupPolicy` सेट नहीं होता, तब `channels.defaults.groupPolicy` डिफ़ॉल्ट निर्धारित करता है।
पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं। लंबित पेयरिंग अनुरोधों की सीमा **प्रति अकाउंट 3** है (चैनल और अकाउंट आईडी के अनुसार सीमित)।
यदि प्रदाता ब्लॉक पूरी तरह अनुपस्थित है (`channels.<provider>` अनुपस्थित), तो रनटाइम समूह नीति स्टार्टअप चेतावनी के साथ `allowlist` (विफलता पर बंद) पर वापस जाती है।
</Note>

### चैनल मॉडल ओवरराइड

विशिष्ट चैनल आईडी या डायरेक्ट-मैसेज पीयर को किसी मॉडल से पिन करने के लिए `channels.modelByChannel` का उपयोग करें। मान `provider/model` या कॉन्फ़िगर किए गए मॉडल उपनाम स्वीकार करते हैं। चैनल मैपिंग केवल तभी लागू होती है, जब किसी सत्र में पहले से सक्रिय मॉडल ओवरराइड न हो (उदाहरण के लिए, `/model` के माध्यम से सेट किया गया ओवरराइड)।

समूह/थ्रेड वार्तालापों के लिए, कुंजियाँ चैनल-विशिष्ट समूह आईडी, विषय आईडी या चैनल नाम होती हैं। डायरेक्ट-मैसेज (DM) वार्तालापों के लिए, कुंजियाँ चैनल की प्रेषक पहचान (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` या `SenderId`) से प्राप्त पीयर पहचानकर्ता होती हैं। कुंजी का सटीक रूप चैनल पर निर्भर करता है:

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

DM-विशिष्ट कुंजियाँ केवल डायरेक्ट-मैसेज वार्तालापों में मेल खाती हैं; वे समूह/थ्रेड रूटिंग को प्रभावित नहीं करतीं।

### चैनल डिफ़ॉल्ट और Heartbeat

सभी प्रदाताओं में साझा समूह-नीति, अंतर्निहित-उल्लेख और Heartbeat व्यवहार के लिए `channels.defaults` का उपयोग करें:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
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
- `channels.defaults.contextVisibility`: सभी चैनलों के लिए डिफ़ॉल्ट पूरक संदर्भ दृश्यता मोड। मान: `all` (डिफ़ॉल्ट, सभी उद्धृत/थ्रेड/इतिहास संदर्भ शामिल करें), `allowlist` (केवल अनुमति-सूचीबद्ध प्रेषकों का संदर्भ शामिल करें), `allowlist_quote` (अनुमति-सूची जैसा ही, लेकिन स्पष्ट उद्धरण/उत्तर संदर्भ बनाए रखें)। प्रति-चैनल ओवरराइड: `channels.<channel>.contextVisibility`।
- `channels.defaults.implicitMentions`: यह नियंत्रित करता है कि कौन-से समर्थित इनबाउंड तथ्य उल्लेख माने जाते हैं। `replyToBot`, `quotedBot` और `threadParticipation` में से प्रत्येक का डिफ़ॉल्ट `true` है, जिससे वर्तमान व्यवहार संरक्षित रहता है। प्रति चैनल `channels.<channel>.implicitMentions` या प्रति अकाउंट `channels.<channel>.accounts.<id>.implicitMentions` के साथ ओवरराइड करें; प्रत्येक फ़्लैग स्वतंत्र रूप से अकाउंट -> चैनल -> डिफ़ॉल्ट क्रम में हल होता है। नाम सकारात्मक हैं: उस तथ्य को उल्लेख गेटिंग बायपास करने से रोकने के लिए फ़्लैग को `false` पर सेट करें। मूल स्पष्ट उल्लेखों की हमेशा अनुमति होती है, और जब चैनल वह तथ्य उत्पन्न नहीं करता, तब फ़्लैग का कोई प्रभाव नहीं होता। वर्तमान उत्पादक मैट्रिक्स के लिए [उल्लेख गेटिंग](/hi/channels/groups#mention-gating-default) देखें। ये सेटिंग आउटबाउंड उत्तर/थ्रेड मोड या अधिकृत कमांड प्रबंधन नहीं बदलतीं।
- `channels.defaults.heartbeat.showOk`: Heartbeat आउटपुट में स्वस्थ चैनल स्थितियाँ शामिल करें (डिफ़ॉल्ट `false`)।
- `channels.defaults.heartbeat.showAlerts`: Heartbeat आउटपुट में अवनत/त्रुटि स्थितियाँ शामिल करें (डिफ़ॉल्ट `true`)।
- `channels.defaults.heartbeat.useIndicator`: संक्षिप्त संकेतक-शैली का Heartbeat आउटपुट रेंडर करें (डिफ़ॉल्ट `true`)।

### WhatsApp

WhatsApp, Gateway के वेब चैनल (Baileys Web) के माध्यम से चलता है। लिंक किया गया सत्र मौजूद होने पर यह स्वतः शुरू हो जाता है।

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

- `web.whatsapp.keepAliveIntervalMs` (डिफ़ॉल्ट `25000`), `connectTimeoutMs` (डिफ़ॉल्ट `60000`) और `defaultQueryTimeoutMs` (डिफ़ॉल्ट `60000`) Baileys सॉकेट को समायोजित करते हैं।
- `web.reconnect` के डिफ़ॉल्ट: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`। `maxAttempts: 0` हार मानने के बजाय अनिश्चित काल तक पुनः प्रयास करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ WhatsApp DM और समूहों के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं। `match.peer.id` में E.164 डायरेक्ट नंबर या WhatsApp समूह JID का उपयोग करें। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।

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

- यदि अकाउंट `default` मौजूद है, तो आउटबाउंड कमांड डिफ़ॉल्ट रूप से उसका उपयोग करते हैं; अन्यथा कॉन्फ़िगर किया गया पहला अकाउंट आईडी (क्रमबद्ध) उपयोग होता है।
- यदि वैकल्पिक `channels.whatsapp.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट आईडी से मेल खाता है, तो वह इस फ़ॉलबैक डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।
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

- बॉट टोकन: `channels.telegram.botToken` या `channels.telegram.tokenFile` (केवल सामान्य फ़ाइल; सिमलिंक अस्वीकृत), डिफ़ॉल्ट खाते के लिए फ़ॉलबैक के रूप में `TELEGRAM_BOT_TOKEN`।
- `apiRoot` केवल Telegram Bot API रूट है। `https://api.telegram.org/bot<TOKEN>` के बजाय `https://api.telegram.org` या अपने स्वयं-होस्टेड/प्रॉक्सी रूट का उपयोग करें; `openclaw doctor --fix` अनजाने में जुड़े अंतिम `/bot<TOKEN>` प्रत्यय को हटा देता है।
- `--local` मोड में स्वयं-होस्टेड Bot API सर्वर के लिए, `trustedLocalFileRoots` उन होस्ट पथों को सूचीबद्ध करता है जिन्हें OpenClaw पढ़ सकता है। सर्वर डेटा वॉल्यूम को OpenClaw होस्ट पर माउंट करें और या तो उसका डेटा रूट या प्रति-टोकन डायरेक्टरी कॉन्फ़िगर करें; `/var/lib/telegram-bot-api` के अंतर्गत कंटेनर पथ उन रूट में मैप किए जाते हैं। अन्य निरपेक्ष पथ अस्वीकृत रहते हैं।
- वैकल्पिक `channels.telegram.defaultAccount`, किसी कॉन्फ़िगर किए गए खाता आईडी से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।
- बहु-खाता सेटअप (2+ खाता आईडी) में, फ़ॉलबैक रूटिंग से बचने के लिए स्पष्ट डिफ़ॉल्ट (`channels.telegram.defaultAccount` या `channels.telegram.accounts.default`) सेट करें; इसके अनुपस्थित या अमान्य होने पर `openclaw doctor` चेतावनी देता है।
- `configWrites: false`, Telegram द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन (सुपरग्रुप आईडी माइग्रेशन, `/config set|unset`) को अवरुद्ध करता है।
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ फ़ोरम विषयों के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं (`match.peer.id` में प्रामाणिक `chatId:topic:topicId` का उपयोग करें)। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।
- Telegram स्ट्रीम पूर्वावलोकन `sendMessage` + `editMessageText` का उपयोग करते हैं (प्रत्यक्ष और समूह चैट में काम करता है)।
- सामान्य IPv6 फ़ेच विफलताओं से बचने के लिए `network.dnsResultOrder` का डिफ़ॉल्ट `"ipv4first"` है।
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
              systemPrompt: "केवल संक्षिप्त उत्तर।",
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
- स्पष्ट Discord `token` प्रदान करने वाली प्रत्यक्ष आउटबाउंड कॉल उस कॉल के लिए उसी टोकन का उपयोग करती हैं; खाता पुनः प्रयास/नीति सेटिंग्स फिर भी सक्रिय रनटाइम स्नैपशॉट में चयनित खाते से आती हैं।
- वैकल्पिक `channels.discord.defaultAccount` किसी कॉन्फ़िगर किए गए खाता आईडी से मेल खाने पर डिफ़ॉल्ट खाता चयन को ओवरराइड करता है।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` (गिल्ड चैनल) का उपयोग करें; केवल संख्यात्मक आईडी अस्वीकार कर दी जाती हैं।
- गिल्ड स्लग लोअरकेस में होते हैं और स्पेस को `-` से बदला जाता है; चैनल कुंजियाँ स्लग किए गए नाम का उपयोग करती हैं (`#` के बिना)। गिल्ड आईडी को प्राथमिकता दें।
- बॉट द्वारा लिखे गए संदेश डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं। `allowBots: true` उन्हें सक्षम करता है; केवल उन बॉट संदेशों को स्वीकार करने के लिए `allowBots: "mentions"` का उपयोग करें जिनमें बॉट का उल्लेख हो (उसके अपने संदेश फिर भी फ़िल्टर किए जाते हैं)।
- बॉट द्वारा लिखे गए इनबाउंड संदेशों का समर्थन करने वाले चैनल साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग कर सकते हैं। आधारभूत युग्म बजट के लिए `channels.defaults.botLoopProtection` सेट करें, फिर चैनल या खाते को केवल तभी ओवरराइड करें जब किसी एक सतह को अलग सीमाओं की आवश्यकता हो।
- `channels.discord.guilds.<id>.ignoreOtherMentions` (और चैनल ओवरराइड) उन संदेशों को हटा देता है जिनमें किसी अन्य उपयोगकर्ता या भूमिका का उल्लेख है, लेकिन बॉट का नहीं (@everyone/@here को छोड़कर)।
- `channels.discord.mentionAliases` भेजने से पहले स्थिर आउटबाउंड `@handle` टेक्स्ट को Discord उपयोगकर्ता आईडी से मैप करता है, ताकि क्षणिक डायरेक्टरी कैश खाली होने पर भी ज्ञात टीम-साथियों का निर्धारणात्मक रूप से उल्लेख किया जा सके। प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.mentionAliases` के अंतर्गत होते हैं।
- `maxLinesPerMessage` (डिफ़ॉल्ट `17`) लंबे संदेशों को 2000 वर्णों से कम होने पर भी विभाजित करता है।
- `channels.discord.suppressEmbeds` का डिफ़ॉल्ट `true` है, इसलिए अक्षम किए जाने तक आउटबाउंड URL Discord लिंक पूर्वावलोकनों में विस्तृत नहीं होते। स्पष्ट `embeds` पेलोड फिर भी सामान्य रूप से भेजे जाते हैं; प्रति-संदेश टूल कॉल `suppressEmbeds` से इसे ओवरराइड कर सकती हैं।
- `channels.discord.threadBindings` Discord की थ्रेड-बाउंड रूटिंग नियंत्रित करता है:
  - `enabled`: थ्रेड-बाउंड सत्र सुविधाओं के लिए Discord ओवरराइड (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, और बाउंड डिलीवरी/रूटिंग)
  - `idleHours`: घंटों में निष्क्रियता पर स्वचालित अनफ़ोकस के लिए Discord ओवरराइड (`0` अक्षम करता है)
  - `maxAgeHours`: घंटों में अधिकतम आयु की कठोर सीमा के लिए Discord ओवरराइड (`0` अक्षम करता है)
  - `spawnSessions`: `sessions_spawn({ thread: true })` और ACP थ्रेड-स्पॉन की स्वचालित थ्रेड रचना/बाइंडिंग के लिए स्विच (डिफ़ॉल्ट: `true`)
  - `defaultSpawnContext`: थ्रेड-बाउंड स्पॉन के लिए मूल सबएजेंट संदर्भ (डिफ़ॉल्ट रूप से `"fork"`)
- `type: "acp"` वाली शीर्ष-स्तरीय `bindings[]` प्रविष्टियाँ चैनलों और थ्रेड के लिए स्थायी ACP बाइंडिंग कॉन्फ़िगर करती हैं (`match.peer.id` में चैनल/थ्रेड आईडी का उपयोग करें)। फ़ील्ड के अर्थ [ACP एजेंट](/hi/tools/acp-agents#persistent-channel-bindings) में साझा किए गए हैं।
- `channels.discord.ui.components.accentColor` Discord components v2 कंटेनरों के लिए एक्सेंट रंग सेट करता है।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord कंपोनेंट कॉलबैक कितने समय तक पंजीकृत रहें। डिफ़ॉल्ट `1800000` (30 मिनट), अधिकतम `86400000` (24 घंटे)। प्रति-खाता ओवरराइड `channels.discord.accounts.<accountId>.agentComponents.ttlMs` के अंतर्गत होते हैं। वर्कफ़्लो के अनुरूप सबसे छोटे TTL को प्राथमिकता दें।
- `channels.discord.voice` Discord वॉइस चैनल वार्तालाप और वैकल्पिक ऑटो-जॉइन + LLM + TTS ओवरराइड सक्षम करता है। केवल-टेक्स्ट Discord कॉन्फ़िगरेशन में वॉइस डिफ़ॉल्ट रूप से बंद रहती है; इसे चुनने के लिए `channels.discord.voice.enabled=true` सेट करें।
- `channels.discord.voice.model` वैकल्पिक रूप से Discord वॉइस चैनल प्रतिक्रियाओं के लिए उपयोग किए जाने वाले LLM मॉडल को ओवरराइड करता है।
- `channels.discord.voice.daveEncryption` (डिफ़ॉल्ट `true`) और `channels.discord.voice.decryptionFailureTolerance` (डिफ़ॉल्ट `24`) `@discordjs/voice` DAVE विकल्पों को यथावत आगे भेजते हैं।
- `channels.discord.voice.connectTimeoutMs`, `/vc join` और ऑटो-जॉइन प्रयासों के लिए आरंभिक `@discordjs/voice` Ready प्रतीक्षा नियंत्रित करता है (डिफ़ॉल्ट `30000`)।
- `channels.discord.voice.reconnectGraceMs` नियंत्रित करता है कि डिस्कनेक्ट हुआ वॉइस सत्र OpenClaw द्वारा नष्ट किए जाने से पहले पुनः कनेक्ट संकेत अवस्था में प्रवेश करने के लिए कितना समय ले सकता है (डिफ़ॉल्ट `15000`)।
- किसी अन्य उपयोगकर्ता के बोलना शुरू करने की घटना से Discord वॉइस प्लेबैक बाधित नहीं होता। फ़ीडबैक लूप से बचने के लिए, TTS चलते समय OpenClaw नई वॉइस कैप्चर को अनदेखा करता है।
- बार-बार डिक्रिप्शन विफल होने के बाद OpenClaw वॉइस सत्र छोड़कर पुनः जुड़ते हुए वॉइस रिसीव की पुनर्प्राप्ति का भी प्रयास करता है।
- `channels.discord.streaming` प्रामाणिक स्ट्रीम मोड कुंजी है। Discord का डिफ़ॉल्ट `streaming.mode: "progress"` है, ताकि टूल/कार्य की प्रगति एक संपादित पूर्वावलोकन संदेश में दिखाई दे; इसे अक्षम करने के लिए `streaming.mode: "off"` सेट करें। पुराने फ़्लैट कुंजी मान (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) अब रनटाइम पर नहीं पढ़े जाते; स्थायी कॉन्फ़िगरेशन माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
- `channels.discord.autoPresence` रनटाइम उपलब्धता को बॉट उपस्थिति से मैप करता है (स्वस्थ => ऑनलाइन, अवनत => निष्क्रिय, समाप्त => dnd) और वैकल्पिक स्थिति टेक्स्ट ओवरराइड की अनुमति देता है।
- `channels.discord.guilds.<id>.presenceEvents` मानव उपलब्धता के आगमन को एजेंट सिस्टम घटनाओं के रूप में एक कॉन्फ़िगर किए गए Discord चैनल में रूट करता है। पात्र सदस्यों को `channelId` देखने में सक्षम होना चाहिए; सार्वजनिक थ्रेड मूल दृश्यता प्राप्त करते हैं, जबकि निजी थ्रेड के लिए अतिरिक्त रूप से सदस्यता या Manage Threads आवश्यक है। `users` उस दर्शक-वर्ग को और सीमित कर सकता है। यह पूर्ण `GUILD_CREATE` स्नैपशॉट से वर्तमान ऑनलाइन सदस्यों को आरंभिक रूप से भरता है, देखे गए ऑफ़लाइन-से-ऑनलाइन संक्रमणों को रूट करता है, और किसी पहले न देखे गए सदस्य के बाद में मिले पहले ऑनलाइन संकेत को नई उपलब्धता मानता है—यह दावा किए बिना कि वह ऑनलाइन आया या स्नैपशॉट के बाद जुड़ा। Discord की 75,000-सदस्य स्नैपशॉट सीमा से बड़े गिल्ड के लिए पहले एक स्पष्ट ऑफ़लाइन अपडेट आवश्यक है। थ्रॉटलिंग नियंत्रण: `reconnectSuppressSeconds` (नए Gateway सत्र के बाद गिल्ड उपस्थिति स्थिति पुनर्निर्मित होते समय शांत अवधि, डिफ़ॉल्ट 300, `0` अक्षम करता है) और `burstLimit`/`burstWindowSeconds` (प्रति-गिल्ड सफलतापूर्वक कतारबद्ध घटना दर सीमा, डिफ़ॉल्ट रूप से 60s की स्लाइडिंग विंडो में 8 घटनाएँ)। पुनः आरंभ किए गए सत्र पुनः कनेक्ट दमन विंडो शुरू नहीं करते। मौजूदा प्रति-उपयोगकर्ता पुनः अभिवादन कूलडाउन आठ घंटे रहता है। इसके लिए `channels.discord.intents.presence=true`, Discord के Developer Portal में विशेषाधिकार प्राप्त Presence Intent और सक्षम एजेंट Heartbeat आवश्यक हैं।
- `channels.discord.dangerouslyAllowNameMatching` परिवर्तनीय नाम/टैग मिलान को पुनः सक्षम करता है (आपातकालीन संगतता मोड)।
- `channels.discord.execApprovals`: Discord-मूल exec अनुमोदन डिलीवरी और अनुमोदक प्राधिकरण।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। स्वचालित मोड में, exec अनुमोदन तब सक्रिय होते हैं जब अनुमोदकों को `approvers` या `commands.ownerAllowFrom` से निर्धारित किया जा सके।
  - `approvers`: exec अनुरोधों को अनुमोदित करने की अनुमति वाले Discord उपयोगकर्ता आईडी। छोड़े जाने पर `commands.ownerAllowFrom` का फ़ॉलबैक उपयोग करता है।
  - `agentFilter`: वैकल्पिक एजेंट आईडी अनुमतिसूची। सभी एजेंटों के अनुमोदन अग्रेषित करने के लिए इसे छोड़ दें।
  - `sessionFilter`: वैकल्पिक सत्र कुंजी पैटर्न (सबस्ट्रिंग या रेगेक्स)।
  - `target`: अनुमोदन प्रॉम्प्ट कहाँ भेजने हैं। `"dm"` (डिफ़ॉल्ट) अनुमोदक के DM में भेजता है, `"channel"` मूल चैनल में भेजता है, `"both"` दोनों में भेजता है। जब लक्ष्य में `"channel"` शामिल हो, तो बटन केवल निर्धारित अनुमोदकों द्वारा उपयोग किए जा सकते हैं।
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
- `channels.googlechat.dangerouslyAllowNameMatching` परिवर्तनीय ईमेल प्रिंसिपल मिलान को पुनः सक्षम करता है (आपातकालीन संगतता मोड)।

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

- **सॉकेट मोड** के लिए `botToken` और `appToken` दोनों आवश्यक हैं (डिफ़ॉल्ट अकाउंट env फ़ॉलबैक के लिए `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)।
- **HTTP मोड** के लिए `botToken` के साथ `signingSecret` आवश्यक है (रूट पर या प्रति-अकाउंट)।
- **उपयोगकर्ता पहचान** (`identity: "user"`) अधिकृत करने वाले व्यक्ति के रूप में पोस्ट करती और पढ़ती है। इसके लिए सॉकेट मोड में `userToken` के साथ `appToken`, या HTTP मोड में `userToken` के साथ `signingSecret` आवश्यक है। किसी बॉट टोकन या बॉट उपयोगकर्ता की आवश्यकता नहीं है। उपयोगकर्ता स्कोप और इवेंट सब्सक्रिप्शन के लिए [उपयोगकर्ता पहचान](/hi/channels/slack#user-identity-post-as-a-real-person) देखें।
- `enterpriseOrgInstall: true` किसी अकाउंट को Slack Enterprise Grid के
  संगठन-व्यापी इवेंट पथ में शामिल करता है। स्टार्टअप `auth.test` के साथ बॉट टोकन सत्यापित करता है और
  कॉन्फ़िगर किया गया मोड Slack की इंस्टॉलेशन पहचान से मेल न खाने पर
  विफल हो जाता है। Enterprise DM अक्षम होने चाहिए या उन्हें प्रभावी
  `allowFrom: ["*"]` के साथ `dmPolicy: "open"` का उपयोग करना चाहिए। चैनल और उपयोगकर्ता नीतियों में स्थिर Slack ID का उपयोग होना चाहिए;
  परिवर्तनशील नाम और असमर्थित चैनल प्रीफ़िक्स स्टार्टअप को विफल कर देते हैं। V1 केवल
  तत्काल उत्तरों वाले सीधे सॉकेट मोड या HTTP `message` और `app_mention` इवेंट संभालता है;
  रिले, कमांड, इंटरैक्शन, App Home, रिएक्शन इवेंट लिसनर,
  पिन, एक्शन टूल, नेटिव अप्रूवल, बाइंडिंग, स्थगित डिलीवरी और
  सक्रिय रूप से भेजना उपलब्ध नहीं है। लिसनर के स्वामित्व वाली अभिस्वीकृति, टाइपिंग और
  स्टेटस रिएक्शन `reactions:write` के साथ उपलब्ध रहते हैं; इनबाउंड रिएक्शन
  नोटिफ़िकेशन और रिएक्शन एक्शन टूल उपलब्ध नहीं हैं। न्यूनतम-विशेषाधिकार मैनिफ़ेस्ट,
  सेटअप वर्कफ़्लो और संपूर्ण प्रतिबंधों के लिए
  [Enterprise Grid संगठन-व्यापी इंस्टॉलेशन](/hi/channels/slack#enterprise-grid-org-wide-installs)
  देखें।
- `socketMode` Slack SDK सॉकेट मोड ट्रांसपोर्ट ट्यूनिंग को सार्वजनिक Bolt रिसीवर API तक पहुँचाता है। इसका उपयोग केवल ping/pong टाइमआउट या पुराने websocket व्यवहार की जाँच करते समय करें। `clientPingTimeout` का डिफ़ॉल्ट `15000` है; `serverPingTimeout` और `pingPongLoggingEnabled` केवल कॉन्फ़िगर होने पर पास किए जाते हैं।
- `botToken`, `appToken`, `signingSecret`, और `userToken` प्लेनटेक्स्ट
  स्ट्रिंग या SecretRef ऑब्जेक्ट स्वीकार करते हैं।
- Slack अकाउंट स्नैपशॉट प्रति-क्रेडेंशियल स्रोत/स्थिति फ़ील्ड दिखाते हैं, जैसे
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus`, और HTTP मोड में `signingSecretStatus`।
  `configured_unavailable` का अर्थ है कि अकाउंट
  SecretRef के माध्यम से कॉन्फ़िगर है, लेकिन वर्तमान कमांड/रनटाइम पथ
  सीक्रेट मान को रिज़ॉल्व नहीं कर सका।
- `configWrites: false` Slack द्वारा शुरू किए गए कॉन्फ़िग लेखन को अवरुद्ध करता है।
- वैकल्पिक `channels.slack.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट ID से मेल खाने पर डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।
- `channels.slack.streaming.mode` मानक Slack स्ट्रीम मोड कुंजी है (डिफ़ॉल्ट `"partial"`)। `channels.slack.streaming.nativeTransport` Slack के नेटिव स्ट्रीमिंग ट्रांसपोर्ट को नियंत्रित करता है (डिफ़ॉल्ट `true`)। पुराने `streamMode`, बूलियन `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce`, और `nativeStreaming` मान अब रनटाइम पर नहीं पढ़े जाते; सहेजे गए कॉन्फ़िग को `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` में माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
- `unfurlLinks` और `unfurlMedia` बॉट उत्तरों के लिए Slack के `chat.postMessage` लिंक और मीडिया अनफ़र्ल बूलियन को आगे भेजते हैं। `unfurlLinks` का डिफ़ॉल्ट `false` है, इसलिए सक्षम किए बिना आउटबाउंड बॉट लिंक इनलाइन विस्तृत नहीं होते; कॉन्फ़िगर न होने पर `unfurlMedia` छोड़ दिया जाता है। किसी एक अकाउंट के लिए शीर्ष-स्तरीय मान को ओवरराइड करने हेतु दोनों में से कोई भी मान `channels.slack.accounts.<accountId>` पर सेट करें।
- डिलीवरी लक्ष्यों के लिए `user:<id>` (DM) या `channel:<id>` का उपयोग करें।

**रिएक्शन नोटिफ़िकेशन मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

**थ्रेड सेशन पृथक्करण:** `thread.historyScope` प्रति-थ्रेड (डिफ़ॉल्ट) होता है या पूरे चैनल में साझा होता है। `thread.inheritParent` पैरेंट चैनल ट्रांसक्रिप्ट को नए थ्रेड में कॉपी करता है। `thread.initialHistoryLimit` (डिफ़ॉल्ट `20`) यह सीमित करता है कि नया थ्रेड सेशन शुरू होने पर कितने मौजूदा थ्रेड संदेश प्राप्त किए जाएँ; `0` थ्रेड इतिहास प्राप्त करना अक्षम करता है।

- Slack नेटिव स्ट्रीमिंग और Slack सहायक-शैली के "टाइप कर रहा है..." थ्रेड स्टेटस के लिए उत्तर थ्रेड लक्ष्य आवश्यक है। शीर्ष-स्तरीय DM डिफ़ॉल्ट रूप से थ्रेड से बाहर रहते हैं, इसलिए वे थ्रेड-शैली का नेटिव स्ट्रीम/स्टेटस पूर्वावलोकन दिखाने के बजाय Slack ड्राफ़्ट पोस्ट-और-संपादन पूर्वावलोकनों के माध्यम से अब भी स्ट्रीम कर सकते हैं।
- `typingReaction` उत्तर चलते समय इनबाउंड Slack संदेश में एक अस्थायी रिएक्शन जोड़ता है, फिर पूर्ण होने पर उसे हटा देता है। `"hourglass_flowing_sand"` जैसे Slack इमोजी शॉर्टकोड का उपयोग करें।
- `channels.slack.execApprovals`: Slack-नेटिव अप्रूवल-क्लाइंट डिलीवरी और exec अनुमोदक प्राधिकरण। Discord जैसी ही स्कीमा: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack उपयोगकर्ता ID), `agentFilter`, `sessionFilter`, और `target` (`"dm"`, `"channel"`, या `"both"`)। Slack Plugin अनुमोदक रिज़ॉल्व होने पर Plugin अप्रूवल Slack-उद्गम अनुरोधों के लिए इस नेटिव-क्लाइंट पथ का उपयोग कर सकते हैं; Slack-नेटिव Plugin अप्रूवल डिलीवरी को Slack-उद्गम सेशन या Slack लक्ष्यों के लिए `approvals.plugin` के माध्यम से भी सक्षम किया जा सकता है। Plugin अप्रूवल exec अनुमोदकों के बजाय `allowFrom` के Slack Plugin अनुमोदकों और डिफ़ॉल्ट रूटिंग का उपयोग करते हैं।

| एक्शन समूह | डिफ़ॉल्ट | टिप्पणियाँ                  |
| ------------ | ------- | ---------------------- |
| reactions    | सक्षम | रिएक्ट करें + रिएक्शन सूचीबद्ध करें |
| messages     | सक्षम | पढ़ें/भेजें/संपादित करें/हटाएँ  |
| pins         | सक्षम | पिन करें/अनपिन करें/सूचीबद्ध करें         |
| memberInfo   | सक्षम | सदस्य जानकारी            |
| emojiList    | सक्षम | कस्टम इमोजी सूची      |

### Mattermost

Mattermost एक अलग Plugin के रूप में इंस्टॉल होता है, ठीक वैसे ही जैसे Discord, Slack और WhatsApp होते हैं:

```bash
openclaw plugins install @openclaw/mattermost
```

संस्करण पिन करने से पहले वर्तमान dist-tags के लिए [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) देखें।

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
        // रिवर्स-प्रॉक्सी/सार्वजनिक डिप्लॉयमेंट के लिए वैकल्पिक स्पष्ट URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

चैट मोड: `oncall` (@-मेंशन पर उत्तर दें, डिफ़ॉल्ट), `onmessage` (प्रत्येक संदेश), `onchar` (ट्रिगर प्रीफ़िक्स से शुरू होने वाले संदेश)।

जब Mattermost नेटिव कमांड सक्षम हों:

- `commands.callbackPath` एक पथ होना चाहिए (उदाहरण के लिए `/api/channels/mattermost/command`), पूर्ण URL नहीं।
- `commands.callbackUrl` को OpenClaw Gateway एंडपॉइंट पर रिज़ॉल्व होना चाहिए और Mattermost सर्वर से पहुँच योग्य होना चाहिए।
- नेटिव स्लैश कॉलबैक को स्लैश कमांड पंजीकरण के दौरान Mattermost द्वारा लौटाए गए
  प्रति-कमांड टोकन से प्रमाणित किया जाता है। यदि पंजीकरण विफल होता है या कोई
  कमांड सक्रिय नहीं होता, तो OpenClaw कॉलबैक को
  `Unauthorized: invalid command token.` के साथ अस्वीकार करता है।
- निजी/tailnet/आंतरिक कॉलबैक होस्ट के लिए, Mattermost को
  कॉलबैक होस्ट/डोमेन शामिल करने हेतु `ServiceSettings.AllowedUntrustedInternalConnections` की आवश्यकता हो सकती है।
  पूर्ण URL के बजाय होस्ट/डोमेन मानों का उपयोग करें।
- `channels.mattermost.configWrites`: Mattermost द्वारा शुरू किए गए कॉन्फ़िग लेखन को अनुमति दें या अस्वीकार करें।
- `channels.mattermost.requireMention`: चैनलों में उत्तर देने से पहले `@mention` आवश्यक बनाएँ।
- `channels.mattermost.groups.<channelId>.requireMention`: प्रति-चैनल मेंशन-गेटिंग ओवरराइड (डिफ़ॉल्ट के लिए `"*"`)।
- वैकल्पिक `channels.mattermost.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट ID से मेल खाने पर डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // वैकल्पिक अकाउंट बाइंडिंग
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

**रिएक्शन नोटिफ़िकेशन मोड:** `off`, `own` (डिफ़ॉल्ट), `all`, `allowlist` (`reactionAllowlist` से)।

- `channels.signal.account`: चैनल स्टार्टअप को किसी विशिष्ट Signal अकाउंट पहचान से बाँधें।
- `channels.signal.configWrites`: Signal द्वारा शुरू किए गए कॉन्फ़िग लेखन को अनुमति दें या अस्वीकार करें।
- वैकल्पिक `channels.signal.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट ID से मेल खाने पर डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।

### iMessage

OpenClaw `imsg rpc` को शुरू करता है (stdio पर JSON-RPC)। किसी डेमन या पोर्ट की आवश्यकता नहीं है। जब होस्ट Messages डेटाबेस और Automation अनुमतियाँ दे सकता है, तब नए OpenClaw iMessage सेटअप के लिए यह पसंदीदा पथ है।

BlueBubbles समर्थन हटा दिया गया है। वर्तमान OpenClaw में `channels.bluebubbles` समर्थित रनटाइम कॉन्फ़िग सतह नहीं है। पुराने कॉन्फ़िग को `channels.imessage` में माइग्रेट करें; संक्षिप्त संस्करण के लिए [BlueBubbles हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) और संपूर्ण रूपांतरण तालिका के लिए [BlueBubbles से आना](/hi/channels/imessage-from-bluebubbles) देखें।

यदि Gateway साइन-इन किए हुए Messages Mac पर नहीं चल रहा है, तो `channels.imessage.enabled=true` बनाए रखें और `channels.imessage.cliPath` को ऐसे SSH रैपर पर सेट करें जो उस Mac पर `imsg "$@"` चलाता हो। डिफ़ॉल्ट स्थानीय `imsg` पथ केवल macOS के लिए है।

प्रोडक्शन प्रेषण के लिए SSH रैपर पर निर्भर होने से पहले, उसी रैपर के माध्यम से आउटबाउंड `imsg send` सत्यापित करें। कुछ macOS TCC स्थितियाँ Messages Automation को `/usr/libexec/sshd-keygen-wrapper` को सौंपती हैं, जिससे पठन और जाँच काम कर सकते हैं जबकि प्रेषण AppleEvents `-1743` के साथ विफल होते हैं; [iMessage](/hi/channels/imessage) पर SSH रैपर समस्या-निवारण अनुभाग देखें।

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

- वैकल्पिक `channels.imessage.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट आईडी से मेल खाने पर डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।
- Messages DB के लिए Full Disk Access आवश्यक है।
- `chat_id:<id>` लक्ष्यों को प्राथमिकता दें। चैट सूचीबद्ध करने के लिए `imsg chats --limit 20` का उपयोग करें।
- `cliPath` किसी SSH रैपर की ओर संकेत कर सकता है; SCP से अटैचमेंट प्राप्त करने के लिए `remoteHost` (`host` या `user@host`) सेट करें।
- `attachmentRoots` और `remoteAttachmentRoots` इनबाउंड अटैचमेंट पथों को प्रतिबंधित करते हैं (डिफ़ॉल्ट: `/Users/*/Library/Messages/Attachments`)।
- SCP सख़्त होस्ट-की जाँच का उपयोग करता है, इसलिए सुनिश्चित करें कि रिले होस्ट की कुंजी पहले से `~/.ssh/known_hosts` में मौजूद हो।
- `channels.imessage.configWrites`: iMessage द्वारा शुरू किए गए कॉन्फ़िगरेशन लेखन को अनुमति दें या अस्वीकार करें।
- `channels.imessage.sendTransport`: सामान्य आउटबाउंड उत्तरों के लिए पसंदीदा `imsg` RPC प्रेषण ट्रांसपोर्ट। `auto` (डिफ़ॉल्ट) चालू होने पर मौजूदा चैट के लिए IMCore ब्रिज का उपयोग करता है, फिर AppleScript पर फ़ॉलबैक करता है; `bridge` के लिए निजी-API डिलीवरी आवश्यक है; `applescript` सार्वजनिक Messages ऑटोमेशन पथ को बाध्य करता है।
- `channels.imessage.actions.*`: निजी API क्रियाएँ सक्षम करें, जो `imsg status` / `openclaw channels status --probe` द्वारा भी नियंत्रित होती हैं।
- `channels.imessage.includeAttachments` डिफ़ॉल्ट रूप से बंद है; एजेंट टर्न में इनबाउंड मीडिया की अपेक्षा करने से पहले इसे `true` पर सेट करें।
- ब्रिज/Gateway पुनरारंभ के बाद इनबाउंड पुनर्प्राप्ति स्वचालित होती है (GUID डीडुप्लिकेशन और पुराने बैकलॉग के लिए आयु-सीमा)। मौजूदा `channels.imessage.catchup.enabled: true` कॉन्फ़िगरेशन को अब भी अप्रचलित संगतता प्रोफ़ाइल के रूप में स्वीकार किया जाता है; `catchup` डिफ़ॉल्ट रूप से अक्षम है।
- `channels.imessage.groups`: समूह रजिस्ट्री और प्रति-समूह सेटिंग्स। `groupPolicy: "allowlist"` के साथ, स्पष्ट `chat_id` कुंजियाँ या `"*"` वाइल्डकार्ड प्रविष्टि कॉन्फ़िगर करें, ताकि समूह संदेश रजिस्ट्री गेट से गुजर सकें।
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
- `channels.matrix.proxy` Matrix HTTP ट्रैफ़िक को स्पष्ट HTTP(S) प्रॉक्सी के माध्यम से रूट करता है। नामित अकाउंट इसे `channels.matrix.accounts.<id>.proxy` से ओवरराइड कर सकते हैं।
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` निजी/आंतरिक होमसर्वर की अनुमति देता है। `proxy` और यह नेटवर्क ऑप्ट-इन स्वतंत्र नियंत्रण हैं।
- `channels.matrix.defaultAccount` बहु-अकाउंट सेटअप में पसंदीदा अकाउंट चुनता है।
- `channels.matrix.autoJoin` का डिफ़ॉल्ट `"off"` है, इसलिए आमंत्रित कमरे और नए DM-जैसे आमंत्रण तब तक अनदेखे किए जाते हैं, जब तक आप `autoJoin: "allowlist"` को `autoJoinAllowlist` या `autoJoin: "always"` के साथ सेट नहीं करते।
- `channels.matrix.execApprovals`: Matrix-मूल निष्पादन अनुमोदन डिलीवरी और अनुमोदक प्राधिकरण।
  - `enabled`: `true`, `false`, या `"auto"` (डिफ़ॉल्ट)। स्वचालित मोड में, जब अनुमोदकों को `approvers` या `commands.ownerAllowFrom` से निर्धारित किया जा सकता है, तब निष्पादन अनुमोदन सक्रिय होते हैं।
  - `approvers`: वे Matrix उपयोगकर्ता आईडी (उदा. `@owner:example.org`) जिन्हें निष्पादन अनुरोध स्वीकृत करने की अनुमति है।
  - `agentFilter`: वैकल्पिक एजेंट आईडी अनुमति-सूची। सभी एजेंटों के अनुमोदन अग्रेषित करने के लिए इसे छोड़ दें।
  - `sessionFilter`: वैकल्पिक सत्र कुंजी पैटर्न (सबस्ट्रिंग या रेगेक्स)।
  - `target`: अनुमोदन प्रॉम्प्ट कहाँ भेजे जाएँ। `"dm"` (डिफ़ॉल्ट), `"channel"` (मूल कमरा), या `"both"`।
  - प्रति-अकाउंट ओवरराइड: `channels.matrix.accounts.<id>.execApprovals`।
- `channels.matrix.dm.sessionScope` नियंत्रित करता है कि Matrix DM सत्रों में कैसे समूहित होते हैं: `per-user` (डिफ़ॉल्ट) रूट किए गए पीयर के अनुसार साझा करता है, जबकि `per-room` प्रत्येक DM कमरे को अलग रखता है।
- Matrix स्थिति जाँच और लाइव डायरेक्टरी लुकअप रनटाइम ट्रैफ़िक जैसी ही प्रॉक्सी नीति का उपयोग करते हैं।
- पूर्ण Matrix कॉन्फ़िगरेशन, लक्ष्यीकरण नियम और सेटअप उदाहरण [Matrix](/hi/channels/matrix) में प्रलेखित हैं।

### Microsoft Teams

Microsoft Teams Plugin-समर्थित है और `channels.msteams` के अंतर्गत कॉन्फ़िगर किया जाता है।

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, टीम/चैनल नीतियाँ:
      // /channels/msteams देखें
    },
  },
}
```

- यहाँ शामिल मुख्य कुंजी पथ: `channels.msteams`, `channels.msteams.configWrites`।
- पूर्ण Teams कॉन्फ़िगरेशन (क्रेडेंशियल, Webhook, DM/समूह नीति, प्रति-टीम/प्रति-चैनल ओवरराइड) [Microsoft Teams](/hi/channels/msteams) में प्रलेखित है।

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
- वैकल्पिक `channels.irc.defaultAccount` किसी कॉन्फ़िगर किए गए अकाउंट आईडी से मेल खाने पर डिफ़ॉल्ट अकाउंट चयन को ओवरराइड करता है।
- पूर्ण IRC चैनल कॉन्फ़िगरेशन (होस्ट/पोर्ट/TLS/चैनल/अनुमति-सूचियाँ/मेंशन गेटिंग) [IRC](/hi/channels/irc) में प्रलेखित है।

### बहु-अकाउंट (सभी चैनल)

प्रति चैनल कई अकाउंट चलाएँ (प्रत्येक का अपना `accountId` हो):

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

- `accountId` छोड़े जाने पर `default` का उपयोग किया जाता है (CLI + रूटिंग)।
- पर्यावरण टोकन केवल **डिफ़ॉल्ट** अकाउंट पर लागू होते हैं।
- मूल चैनल सेटिंग्स सभी अकाउंट पर लागू होती हैं, जब तक उन्हें प्रति अकाउंट ओवरराइड न किया जाए।
- प्रत्येक अकाउंट को अलग एजेंट पर रूट करने के लिए `bindings[].match.accountId` का उपयोग करें।
- यदि आप अभी भी एकल-अकाउंट शीर्ष-स्तरीय चैनल कॉन्फ़िगरेशन का उपयोग करते हुए `openclaw channels add` (या चैनल ऑनबोर्डिंग) के माध्यम से कोई गैर-डिफ़ॉल्ट अकाउंट जोड़ते हैं, तो OpenClaw पहले अकाउंट-स्कोप वाली शीर्ष-स्तरीय एकल-अकाउंट वैल्यू को चैनल अकाउंट मैप में स्थानांतरित करता है, ताकि मूल अकाउंट काम करता रहे। अधिकांश चैनल उन्हें `channels.<channel>.accounts.default` में ले जाते हैं; इसके बजाय Matrix किसी मौजूदा मेल खाते नामित/डिफ़ॉल्ट लक्ष्य को बनाए रख सकता है।
- मौजूदा केवल-चैनल बाइंडिंग (`accountId` के बिना) डिफ़ॉल्ट अकाउंट से मेल खाती रहती हैं; अकाउंट-स्कोप वाली बाइंडिंग वैकल्पिक रहती हैं।
- `openclaw doctor --fix` मिश्रित संरचनाओं की भी मरम्मत करता है और अकाउंट-स्कोप वाली शीर्ष-स्तरीय एकल-अकाउंट वैल्यू को उस चैनल के लिए चुने गए पदोन्नत अकाउंट में ले जाता है। अधिकांश चैनल `accounts.default` का उपयोग करते हैं; इसके बजाय Matrix किसी मौजूदा मेल खाते नामित/डिफ़ॉल्ट लक्ष्य को बनाए रख सकता है।

### अन्य Plugin चैनल

कई Plugin चैनल `channels.<id>` के रूप में कॉन्फ़िगर किए जाते हैं और उनके समर्पित चैनल पृष्ठों में प्रलेखित हैं (उदाहरण के लिए Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch और Zalo)।
पूरा चैनल सूचकांक देखें: [चैनल](/hi/channels)।

### समूह चैट मेंशन गेटिंग

समूह संदेशों के लिए डिफ़ॉल्ट रूप से **मेंशन आवश्यक** होता है (मेटाडेटा मेंशन या सुरक्षित रेगेक्स पैटर्न)। यह WhatsApp, Telegram, Discord, Google Chat और iMessage समूह चैट पर लागू होता है।

दृश्यमान उत्तरों को अलग से नियंत्रित किया जाता है। सामान्य समूह, चैनल और आंतरिक WebChat प्रत्यक्ष अनुरोध डिफ़ॉल्ट रूप से स्वचालित अंतिम डिलीवरी का उपयोग करते हैं: अंतिम सहायक टेक्स्ट पुराने दृश्यमान उत्तर पथ से पोस्ट होता है। जब मॉडल द्वारा बनाए गए स्रोत उत्तर एजेंट के `message(action=send)` कॉल करने के बाद ही पोस्ट होने चाहिए, तब `messages.visibleReplies: "message_tool"` या `messages.groupChat.visibleReplies: "message_tool"` चुनें। यदि मॉडल किसी ऑप्ट-इन केवल-टूल मोड में संदेश टूल को कॉल किए बिना कोई सार्थक अंतिम उत्तर लौटाता है, तो वह अंतिम टेक्स्ट निजी रहता है, Gateway का वर्बोज़ लॉग दबाए गए पेलोड का मेटाडेटा दर्ज करता है और OpenClaw मॉडल से वही उत्तर `message(action=send)` के माध्यम से डिलीवर करने को कहते हुए एक पुनर्प्राप्ति पुनःप्रयास कतार में जोड़ता है।

केवल-टूल नीति सहायक के स्रोत उत्तरों और सामान्य टूल मीडिया को नियंत्रित करती है। यह अधिकृत कमांड प्रतिक्रियाओं, स्थायी पूर्णता सूचनाओं या स्वामी हार्नेस द्वारा स्पष्ट रूप से होस्ट-स्वामित्व वाली वर्गीकृत प्रदाता-मूल कलाकृतियों जैसे रनटाइम-स्वामित्व वाले टर्मिनल आउटपुट को नहीं दबाती। होस्ट-स्वामित्व वाली कलाकृतियाँ सामान्य चैनल डिस्पैच पथ के माध्यम से डिलीवर की जाती हैं और फिर भी आउटबाउंड `sendPolicy` अस्वीकृति का पालन करती हैं। परिवेशी `room_event` टर्न तब तक शांत रहते हैं, जब तक वे स्पष्ट कमांड न हों, भले ही रनटाइम आउटपुट को होस्ट-स्वामित्व वाला चिह्नित किया गया हो।

केवल-टूल दृश्यमान उत्तरों के लिए ऐसा मॉडल/रनटाइम आवश्यक है जो विश्वसनीय रूप से टूल कॉल करता हो, और GPT-5.6 Sol जैसे नवीनतम पीढ़ी के मॉडलों पर साझा परिवेशी कमरों के लिए इनकी अनुशंसा की जाती है। कुछ कमज़ोर मॉडल अंतिम टेक्स्ट में उत्तर दे सकते हैं, लेकिन यह समझने में विफल रहते हैं कि स्रोत-दृश्यमान आउटपुट को `message(action=send)` के साथ भेजा जाना चाहिए। OpenClaw सामान्य रूप से अटके हुए अंतिम उत्तर की स्थिति से डिफ़ॉल्ट रूप से केवल तभी उबरता है, जब अंतिम उत्तर सार्थक हो, स्रोत टर्न कमरे की घटना न हो, प्रेषण नीति ने डिलीवरी अस्वीकार न की हो और कोई स्रोत उत्तर पहले से न भेजा गया हो। पुनर्प्राप्ति एक पुनःप्रयास तक सीमित है; यह कृत्रिम पुनःप्रयास प्रॉम्प्ट की स्थायित्व प्रक्रिया को रोकती है और उस पुनःप्रयास को संग्रह बैचिंग से बाहर रखती है, ताकि वह असंबंधित कतारबद्ध प्रॉम्प्ट के साथ विलय न हो सके। यदि पुनःप्रयास भी अटक जाता है या उसे कतार में नहीं जोड़ा जा सकता, तो OpenClaw केवल साफ़ किया हुआ निदान संदेश डिलीवर करता है, जैसे "मैंने एक उत्तर बनाया, लेकिन उसे इस चैट में डिलीवर नहीं कर सका। कृपया फिर से प्रयास करें।" मूल निजी अंतिम टेक्स्ट को स्वचालित स्रोत डिलीवरी के लिए कभी चिह्नित नहीं किया जाता। बार-बार उत्तर अटका देने वाले मॉडलों के लिए `"automatic"` का उपयोग करें, ताकि अंतिम सहायक टर्न दृश्यमान उत्तर पथ बने; अधिक सक्षम टूल-कॉलिंग मॉडल पर स्विच करें; दबाए गए पेलोड सारांश के लिए Gateway का वर्बोज़ लॉग देखें; या प्रत्येक समूह/चैनल अनुरोध के लिए दृश्यमान अंतिम उत्तरों का उपयोग करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें।

यदि सक्रिय टूल नीति के अंतर्गत संदेश टूल उपलब्ध नहीं है, तो OpenClaw प्रतिक्रिया को चुपचाप दबाने के बजाय स्वचालित दृश्यमान उत्तरों पर फ़ॉलबैक करता है। `openclaw doctor` इस विसंगति के बारे में चेतावनी देता है।

यह नियम सामान्य एजेंट अंतिम टेक्स्ट पर लागू होता है। Plugin-स्वामित्व वाली वार्तालाप बाइंडिंग, दावा किए गए बाउंड-थ्रेड टर्न के दृश्यमान उत्तर के रूप में स्वामी Plugin द्वारा लौटाए गए उत्तर का उपयोग करती हैं; उन बाइंडिंग उत्तरों के लिए Plugin को `message(action=send)` कॉल करने की आवश्यकता नहीं है।

**समस्या निवारण: समूह @मेंशन टाइपिंग शुरू करता है, फिर मौन रहता है (कोई त्रुटि नहीं)**

लक्षण: किसी समूह/चैनल में @मेंशन टाइपिंग संकेतक दिखाता है और Gateway लॉग `dispatch complete (queuedFinal=false, replies=0)` रिपोर्ट करता है, लेकिन कमरे में कोई संदेश नहीं पहुँचता। उसी एजेंट को भेजे गए DM सामान्य रूप से उत्तर देते हैं।

कारण: समूह/चैनल का दृश्यमान-उत्तर मोड `"message_tool"` पर रिज़ॉल्व होता है, इसलिए OpenClaw टर्न चलाता है लेकिन अंतिम सहायक टेक्स्ट को तब तक दबाए रखता है जब तक एजेंट `message(action=send)` को कॉल नहीं करता। इस मोड में कोई `NO_REPLY` अनुबंध नहीं है; message-tool कॉल न होने का अर्थ है कि मूल अंतिम टेक्स्ट निजी है। सार्थक स्रोत टर्न के लिए OpenClaw अब एक सुरक्षित रिकवरी पुनःप्रयास करता है; छोटे नोट, स्पष्ट मौन, रूम इवेंट, भेजने की नीति द्वारा अस्वीकृत टर्न और पहले ही डिलीवर किए गए टर्न का पुनःप्रयास नहीं किया जाता। सामान्य समूह और चैनल टर्न डिफ़ॉल्ट रूप से `"automatic"` का उपयोग करते हैं, इसलिए यह लक्षण केवल तब दिखाई देता है जब `messages.groupChat.visibleReplies` (या वैश्विक `messages.visibleReplies`) को स्पष्ट रूप से `"message_tool"` पर सेट किया गया हो। हार्नेस `defaultVisibleReplies` यहाँ लागू नहीं होता — समूह/चैनल रिज़ॉल्वर इसे अनदेखा करता है; यह केवल डायरेक्ट/स्रोत चैट को प्रभावित करता है (Codex हार्नेस इसी तरह डायरेक्ट-चैट के अंतिम उत्तरों को दबाता है)।

समाधान: या तो अधिक सक्षम टूल-कॉलिंग मॉडल चुनें, `"automatic"` डिफ़ॉल्ट पर वापस जाने के लिए स्पष्ट `"message_tool"` ओवरराइड हटाएँ, या प्रत्येक समूह/चैनल अनुरोध के लिए दृश्यमान उत्तर बाध्य करने हेतु `messages.groupChat.visibleReplies: "automatic"` सेट करें। कोई सार्थक अटकी हुई अंतिम प्रतिक्रिया अब मौन सफलता के रूप में समाप्त नहीं होनी चाहिए; उसे या तो एक `message(action=send)` पुनःप्रयास से रिकवर होना चाहिए या स्वच्छ किया गया डिलीवरी-विफलता निदान दिखाना चाहिए। फ़ाइल सहेजे जाने के बाद Gateway `messages` कॉन्फ़िगरेशन को हॉट-रीलोड करता है; Gateway को केवल तभी पुनः आरंभ करें जब डिप्लॉयमेंट में फ़ाइल निगरानी या कॉन्फ़िगरेशन रीलोड अक्षम हो।

**उल्लेख के प्रकार:**

- **मेटाडेटा उल्लेख**: प्लेटफ़ॉर्म के मूल @-उल्लेख। WhatsApp सेल्फ़-चैट मोड में अनदेखे किए जाते हैं।
- **टेक्स्ट पैटर्न**: `agents.list[].groupChat.mentionPatterns` में सुरक्षित regex पैटर्न। अमान्य पैटर्न और असुरक्षित नेस्टेड पुनरावृत्ति को अनदेखा किया जाता है।
- उल्लेख गेटिंग केवल तभी लागू होती है जब पहचान संभव हो (मूल उल्लेख या कम-से-कम एक पैटर्न)।

```json5
{
  messages: {
    visibleReplies: "automatic", // डायरेक्ट/स्रोत चैट के लिए पुराने स्वचालित अंतिम उत्तर बाध्य करें
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // हमेशा चालू रहने वाली बिना उल्लेख की रूम बातचीत शांत संदर्भ बन जाती है
      visibleReplies: "message_tool", // ऑप्ट-इन; दृश्यमान रूम उत्तरों के लिए message(action=send) आवश्यक बनाएँ
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` वैश्विक डिफ़ॉल्ट सेट करता है। चैनल `channels.<channel>.historyLimit` (या प्रति-अकाउंट) से इसे ओवरराइड कर सकते हैं। अक्षम करने के लिए `0` सेट करें।

`messages.groupChat.unmentionedInbound: "room_event"` समर्थित चैनलों पर बिना उल्लेख वाले हमेशा चालू समूह/चैनल संदेशों को शांत रूम संदर्भ के रूप में सबमिट करता है। उल्लेख वाले संदेश, कमांड और डायरेक्ट संदेश उपयोगकर्ता अनुरोध बने रहते हैं। Discord, Slack और Telegram के संपूर्ण उदाहरणों के लिए [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events) देखें।

`messages.visibleReplies` वैश्विक स्रोत-इवेंट डिफ़ॉल्ट है; समूह/चैनल स्रोत इवेंट के लिए `messages.groupChat.visibleReplies` इसे ओवरराइड करता है। जब `messages.visibleReplies` सेट नहीं होता, तो डायरेक्ट/स्रोत चैट चयनित रनटाइम या हार्नेस डिफ़ॉल्ट का उपयोग करती हैं, लेकिन आंतरिक WebChat डायरेक्ट टर्न Pi/Codex प्रॉम्प्ट समानता के लिए स्वचालित अंतिम डिलीवरी का उपयोग करते हैं। दृश्यमान आउटपुट के लिए जानबूझकर `message(action=send)` आवश्यक बनाने हेतु `messages.visibleReplies: "message_tool"` सेट करें। चैनल अनुमति-सूचियाँ और उल्लेख गेटिंग फिर भी तय करती हैं कि किसी इवेंट को प्रोसेस किया जाएगा या नहीं।

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

यह रिज़ॉल्वर ऐसे किसी भी चैनल के लिए `channels.<provider>.dmHistoryLimit` और `channels.<provider>.dms.<id>.historyLimit` पढ़ता है जिसकी सेशन कुंजी मानक `provider:direct:<id>` (या पुराने `provider:dm:<id>`) स्वरूप का पालन करती है, इसलिए यह केवल किसी निश्चित सूची तक सीमित न रहकर बंडल किए गए और Plugin चैनलों, दोनों पर काम करता है।

#### सेल्फ़-चैट मोड

सेल्फ़-चैट मोड सक्षम करने के लिए `allowFrom` में अपना नंबर शामिल करें (मूल @-उल्लेखों को अनदेखा करता है, केवल टेक्स्ट पैटर्न का उत्तर देता है):

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
- यह पृष्ठ **कॉन्फ़िगरेशन-कुंजी संदर्भ** है, संपूर्ण कमांड कैटलॉग नहीं। QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, डिवाइस-पेयर `/pair`, मेमोरी `/dreaming`, फ़ोन-कंट्रोल `/phone` और Talk `/voice` जैसे चैनल/Plugin-स्वामित्व वाले कमांड उनके चैनल/Plugin पृष्ठों के साथ-साथ [स्लैश कमांड](/hi/tools/slash-commands) में प्रलेखित हैं।
- टेक्स्ट कमांड अग्रणी `/` वाले **स्वतंत्र** संदेश होने चाहिए।
- `native: "auto"` Discord/Telegram के लिए मूल कमांड चालू करता है और Slack को बंद रखता है।
- `nativeSkills: "auto"` Discord/Telegram के लिए मूल skill कमांड चालू करता है और Slack को बंद रखता है।
- प्रति चैनल ओवरराइड करें: `channels.discord.commands.native` (बूलियन या `"auto"`)। Discord के लिए, `false` स्टार्टअप के दौरान मूल कमांड पंजीकरण और क्लीनअप छोड़ देता है।
- `channels.<provider>.commands.nativeSkills` से प्रति चैनल मूल skill पंजीकरण ओवरराइड करें।
- `channels.telegram.customCommands` अतिरिक्त Telegram बॉट मेन्यू प्रविष्टियाँ जोड़ता है।
- `bash: true` होस्ट शेल के लिए `! <cmd>` सक्षम करता है। इसके लिए `tools.elevated.enabled` और `tools.elevated.allowFrom.<channel>` में प्रेषक होना आवश्यक है।
- `config: true` `/config` सक्षम करता है (`openclaw.json` को पढ़ता/लिखता है)। Gateway `chat.send` क्लाइंट के लिए, स्थायी `/config set|unset` लेखन को `operator.admin` भी आवश्यक है; केवल-पढ़ने योग्य `/config show` सामान्य लेखन-स्कोप वाले ऑपरेटर क्लाइंट के लिए उपलब्ध रहता है।
- `mcp: true` `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP सर्वर कॉन्फ़िगरेशन के लिए `/mcp` सक्षम करता है।
- `plugins: true` Plugin खोज, इंस्टॉलेशन और सक्षम/अक्षम नियंत्रणों के लिए `/plugins` सक्षम करता है।
- `channels.<provider>.configWrites` प्रति चैनल कॉन्फ़िगरेशन परिवर्तनों को नियंत्रित करता है (डिफ़ॉल्ट: true)।
- बहु-अकाउंट चैनलों के लिए, `channels.<provider>.accounts.<id>.configWrites` उस अकाउंट को लक्षित करने वाले लेखन को भी नियंत्रित करता है (उदाहरण के लिए `/allowlist --config --account <id>` या `/config set channels.<provider>.accounts.<id>...`)।
- `restart: false` `/restart` और बाहरी `SIGUSR1` पुनः आरंभ अनुरोधों को अक्षम करता है। डिफ़ॉल्ट: `true`।
- `ownerAllowFrom` केवल-स्वामी कमांड और स्वामी-नियंत्रित चैनल कार्रवाइयों के लिए स्पष्ट स्वामी अनुमति-सूची है। यह `allowFrom` से अलग है।
- `ownerDisplay: "hash"` सिस्टम प्रॉम्प्ट में स्वामी आईडी को हैश करता है। हैशिंग नियंत्रित करने के लिए `ownerDisplaySecret` सेट करें।
- `allowFrom` प्रति-प्रदाता है। सेट होने पर यह प्राधिकरण का **एकमात्र** स्रोत होता है (चैनल अनुमति-सूचियों/पेयरिंग और `useAccessGroups` को अनदेखा किया जाता है)।
- `useAccessGroups: false` सेट न होने पर `allowFrom` कमांड को पहुँच-समूह नीतियाँ बायपास करने देता है।
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
- [चैनल अवलोकन](/hi/channels)
