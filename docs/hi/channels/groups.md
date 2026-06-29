---
read_when:
    - समूह चैट व्यवहार या उल्लेख गेटिंग बदलना
    - विशिष्ट समूह वार्तालापों तक mentionPatterns को सीमित करना
sidebarTitle: Groups
summary: सतहों पर समूह चैट व्यवहार (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: समूह
x-i18n:
    generated_at: "2026-06-28T22:35:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw सभी सतहों पर समूह चैट को एकसमान मानता है: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

हमेशा चालू रहने वाले उन रूम के लिए, जिन्हें एजेंट के स्पष्ट रूप से दृश्य संदेश भेजने तक शांत संदर्भ देना चाहिए, [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events) देखें।

## शुरुआती परिचय (2 मिनट)

OpenClaw आपके अपने मैसेजिंग खातों पर "रहता" है। कोई अलग WhatsApp बॉट उपयोगकर्ता नहीं होता। यदि **आप** किसी समूह में हैं, तो OpenClaw उस समूह को देख सकता है और वहीं जवाब दे सकता है।

डिफ़ॉल्ट व्यवहार:

- समूह प्रतिबंधित होते हैं (`groupPolicy: "allowlist"`)।
- जवाबों के लिए mention आवश्यक है, जब तक आप स्पष्ट रूप से mention gating बंद न करें।
- समूहों/चैनलों में दृश्य जवाब डिफ़ॉल्ट रूप से `message` टूल का उपयोग करते हैं।

अर्थ: allowlist में शामिल भेजने वाले OpenClaw को mention करके ट्रिगर कर सकते हैं।

<Note>
**TL;DR**

- **DM पहुंच** `*.allowFrom` से नियंत्रित होती है।
- **समूह पहुंच** `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`) से नियंत्रित होती है।
- **जवाब ट्रिगर करना** mention gating (`requireMention`, `/activation`) से नियंत्रित होता है।

</Note>

त्वरित प्रवाह (समूह संदेश के साथ क्या होता है):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## दृश्य जवाब

सामान्य समूह/चैनल अनुरोधों के लिए, OpenClaw डिफ़ॉल्ट रूप से `messages.groupChat.visibleReplies: "automatic"` का उपयोग करता है। अंतिम सहायक पाठ legacy दृश्य जवाब पथ से पोस्ट होता है, जब तक आप रूम को message-tool-only आउटपुट में ऑप्ट इन नहीं करते।

जब कोई साझा रूम एजेंट को `message(action=send)` कॉल करके बोलने का समय तय करने देना चाहिए, तब `messages.groupChat.visibleReplies: "message_tool"` उपयोग करें। यह GPT 5.5 जैसे नवीनतम पीढ़ी के, टूल-विश्वसनीय मॉडलों द्वारा समर्थित समूह रूम के लिए सबसे अच्छा काम करता है। यदि मॉडल वह टूल चूक जाता है और सार्थक अंतिम पाठ लौटाता है, तो OpenClaw उस अंतिम पाठ को रूम में पोस्ट करने के बजाय निजी रखता है।

कमज़ोर मॉडलों या ऐसे runtime के लिए `"automatic"` उपयोग करें जो tool-only delivery को भरोसेमंद ढंग से नहीं समझते। automatic मोड में, एजेंट का अंतिम सहायक पाठ दृश्य स्रोत जवाब पथ होता है, इसलिए जो मॉडल लगातार `message(action=send)` कॉल नहीं कर सकता, वह फिर भी सामान्य रूप से उत्तर दे सकता है।

automatic मोड में, सामान्य टेक्स्ट अंतिम जवाब सीधे रूम में पोस्ट किए जाते हैं। यदि दृश्य जवाब को फ़ाइलों, छवियों या अन्य attachments की आवश्यकता है, तो एजेंट उस attachment के लिए अंतिम टेक्स्ट जवाब से जबरन भेजने के बजाय फिर भी `message(action=send)` उपयोग कर सकता है।

यदि सक्रिय tool policy के अंतर्गत message टूल उपलब्ध नहीं है, तो OpenClaw प्रतिक्रिया को चुपचाप दबाने के बजाय automatic दृश्य जवाबों पर वापस लौटता है। `openclaw doctor` इस mismatch के बारे में चेतावनी देता है।

प्रत्यक्ष चैट और किसी भी अन्य स्रोत इवेंट के लिए, उसी tool-only दृश्य-जवाब व्यवहार को वैश्विक रूप से लागू करने के लिए `messages.visibleReplies: "message_tool"` उपयोग करें। आंतरिक WebChat प्रत्यक्ष turns automatic अंतिम-जवाब delivery पर डिफ़ॉल्ट होते हैं ताकि Pi और Codex को वही दृश्य-जवाब contract मिले। दृश्य आउटपुट के लिए जानबूझकर `message(action=send)` आवश्यक करने हेतु `messages.visibleReplies: "message_tool"` सेट करें। `messages.groupChat.visibleReplies` समूह/चैनल रूम के लिए अधिक विशिष्ट override बना रहता है।

यह पुराने पैटर्न को बदलता है जिसमें अधिकांश lurk-mode turns के लिए मॉडल को `NO_REPLY` उत्तर देने के लिए मजबूर किया जाता था। tool-only मोड में, prompt कोई `NO_REPLY` contract परिभाषित नहीं करता। कुछ भी दृश्य न करना बस message टूल कॉल न करने का अर्थ है।

Plugin-स्वामित्व वाली conversation bindings अपवाद हैं। जब कोई Plugin किसी thread को bind कर देता है और inbound turn का दावा करता है, तो Plugin द्वारा लौटाया गया reply ही दृश्य binding response होता है; उसे `message(action=send)` की आवश्यकता नहीं होती। वह reply Plugin runtime आउटपुट है, निजी मॉडल final text नहीं।

प्रत्यक्ष समूह अनुरोधों के लिए typing indicators अब भी भेजे जाते हैं। Ambient हमेशा-चालू रूम इवेंट, सक्षम होने पर, तब तक सख्त और शांत रहते हैं जब तक एजेंट message टूल कॉल नहीं करता।

Sessions डिफ़ॉल्ट रूप से verbose tool/progress summaries को दबा देते हैं। debugging के दौरान वर्तमान session के लिए वे summaries दिखाने हेतु `/verbose on` उपयोग करें, और final-reply-only व्यवहार पर लौटने के लिए `/verbose off`। वही verbose state प्रत्यक्ष चैट, समूहों, चैनलों और forum topics में लागू होती है।

बिना mention वाले हमेशा-चालू समूह chatter को user requests के बजाय शांत room context के रूप में जमा करने के लिए [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events) उपयोग करें:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

डिफ़ॉल्ट `unmentionedInbound: "user_request"` है।

Mention किए गए संदेश, commands, abort requests, और DMs user requests बने रहते हैं।

समूह/चैनल अनुरोधों के लिए दृश्य आउटपुट को message टूल से गुजरना आवश्यक करने के लिए:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

फ़ाइल सहेजे जाने के बाद Gateway `messages` config को hot-reload करता है। restart केवल तब करें जब deployment में file watching या config reload अक्षम हो।

हर स्रोत चैट के लिए दृश्य आउटपुट को message टूल से गुजरना आवश्यक करने के लिए:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Native slash commands (Discord, Telegram, और native command support वाली अन्य सतहें) `visibleReplies: "message_tool"` को bypass करते हैं और हमेशा दृश्य रूप से reply करते हैं ताकि channel-native command UI को अपेक्षित response मिले। यह केवल validated native command turns पर लागू होता है; text-typed `/...` commands और सामान्य chat turns अब भी configured group default का पालन करते हैं।

## संदर्भ दृश्यता और allowlists

समूह सुरक्षा में दो अलग नियंत्रण शामिल हैं:

- **Trigger authorization**: एजेंट को कौन trigger कर सकता है (`groupPolicy`, `groups`, `groupAllowFrom`, channel-specific allowlists)।
- **Context visibility**: मॉडल में कौन सा supplemental context डाला जाता है (reply text, quotes, thread history, forwarded metadata)।

डिफ़ॉल्ट रूप से, OpenClaw सामान्य चैट व्यवहार को प्राथमिकता देता है और context को अधिकांशतः जैसा प्राप्त हुआ वैसा रखता है। इसका अर्थ है कि allowlists मुख्य रूप से तय करते हैं कि actions कौन trigger कर सकता है, न कि हर quoted या historical snippet के लिए सार्वभौमिक redaction boundary।

<AccordionGroup>
  <Accordion title="वर्तमान व्यवहार चैनल-विशिष्ट है">
    - कुछ चैनल पहले से ही specific paths में supplemental context के लिए sender-based filtering लागू करते हैं (उदाहरण के लिए Slack thread seeding, Matrix reply/thread lookups)।
    - अन्य चैनल अब भी quote/reply/forward context को जैसा प्राप्त हुआ वैसा पास करते हैं।

  </Accordion>
  <Accordion title="Hardening दिशा (योजनाबद्ध)">
    - `contextVisibility: "all"` (डिफ़ॉल्ट) वर्तमान as-received व्यवहार रखता है।
    - `contextVisibility: "allowlist"` supplemental context को allowlisted senders तक filter करता है।
    - `contextVisibility: "allowlist_quote"` `allowlist` है और साथ में एक स्पष्ट quote/reply exception है।

    जब तक यह hardening model सभी चैनलों में एकसमान रूप से लागू नहीं हो जाता, सतह के अनुसार अंतर अपेक्षित रखें।

  </Accordion>
</AccordionGroup>

![समूह संदेश प्रवाह](/images/groups-flow.svg)

यदि आप चाहते हैं...

| लक्ष्य                                         | क्या सेट करें                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| सभी समूहों को अनुमति दें लेकिन केवल @mentions पर reply करें | `groups: { "*": { requireMention: true } }`                |
| सभी समूह replies अक्षम करें                    | `groupPolicy: "disabled"`                                  |
| केवल विशिष्ट समूह                         | `groups: { "<group-id>": { ... } }` (कोई `"*"` key नहीं)         |
| समूहों में केवल आप trigger कर सकते हैं               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| चैनलों में एक भरोसेमंद sender set दोबारा उपयोग करें | `groupAllowFrom: ["accessGroup:operators"]`                |

Reusable sender allowlists के लिए, [Access groups](/hi/channels/access-groups) देखें।

## Session keys

- समूह sessions `agent:<agentId>:<channel>:group:<id>` session keys उपयोग करते हैं (rooms/channels `agent:<agentId>:<channel>:channel:<id>` उपयोग करते हैं)।
- Telegram forum topics समूह id में `:topic:<threadId>` जोड़ते हैं ताकि हर topic का अपना session हो।
- Direct chats main session उपयोग करते हैं (या configured होने पर per-sender)।
- समूह sessions के लिए Heartbeats छोड़ दिए जाते हैं।

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## पैटर्न: व्यक्तिगत DMs + सार्वजनिक समूह (single agent)

हाँ — यह अच्छी तरह काम करता है यदि आपका "personal" traffic **DMs** है और आपका "public" traffic **groups** है।

कारण: single-agent mode में, DMs आमतौर पर **main** session key (`agent:main:main`) में जाते हैं, जबकि groups हमेशा **non-main** session keys (`agent:main:<channel>:group:<id>`) उपयोग करते हैं। यदि आप `mode: "non-main"` के साथ sandboxing सक्षम करते हैं, तो वे group sessions configured sandbox backend में चलते हैं जबकि आपका main DM session on-host रहता है। यदि आप कोई backend नहीं चुनते, तो Docker डिफ़ॉल्ट backend है।

इससे आपको एक agent "brain" (shared workspace + memory) मिलता है, लेकिन दो execution postures:

- **DMs**: full tools (host)
- **Groups**: sandbox + restricted tools

<Note>
यदि आपको सचमुच अलग workspaces/personas चाहिए ("personal" और "public" कभी mix नहीं होने चाहिए), तो दूसरा agent + bindings उपयोग करें। [Multi-Agent Routing](/hi/concepts/multi-agent) देखें।
</Note>

<Tabs>
  <Tab title="DMs host पर, groups sandboxed">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Groups केवल allowlisted folder देखते हैं">
    "no host access" के बजाय "groups can only see folder X" चाहते हैं? `workspaceAccess: "none"` रखें और sandbox में केवल allowlisted paths mount करें:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

संबंधित:

- Configuration keys और defaults: [Gateway configuration](/hi/gateway/config-agents#agentsdefaultssandbox)
- कोई tool क्यों blocked है, debug करना: [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mounts details: [Sandboxing](/hi/gateway/sandboxing#custom-bind-mounts)

## Display labels

- UI labels उपलब्ध होने पर `displayName` उपयोग करते हैं, जिसे `<channel>:<token>` के रूप में format किया जाता है।
- `#room` rooms/channels के लिए reserved है; group chats `g-<slug>` उपयोग करते हैं (lowercase, spaces -> `-`, `#@+._-` रखें)।

## Group policy

प्रति चैनल group/room messages कैसे handled होते हैं, नियंत्रित करें:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| नीति        | व्यवहार                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | समूह allowlists को बायपास करते हैं; mention-gating अब भी लागू रहती है।      |
| `"disabled"`  | सभी समूह संदेशों को पूरी तरह ब्लॉक करें।                           |
| `"allowlist"` | केवल उन समूहों/रूम को अनुमति दें जो कॉन्फ़िगर की गई allowlist से मेल खाते हैं। |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` mention-gating से अलग है (जिसके लिए @mentions आवश्यक हैं)।
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` का उपयोग करें (fallback: स्पष्ट `allowFrom`)।
    - Signal: `groupAllowFrom` इनबाउंड Signal समूह id या भेजने वाले के फ़ोन/UUID, दोनों में से किसी से भी मेल खा सकता है।
    - DM पेयरिंग अनुमोदन (`*-allowFrom` स्टोर प्रविष्टियां) केवल DM पहुंच पर लागू होते हैं; समूह भेजने वाले की अनुमति समूह allowlists के लिए स्पष्ट रहती है।
    - Discord: allowlist `channels.discord.guilds.<id>.channels` का उपयोग करती है।
    - Slack: allowlist `channels.slack.channels` का उपयोग करती है।
    - Matrix: allowlist `channels.matrix.groups` का उपयोग करती है। रूम IDs या aliases को प्राथमिकता दें; joined-room नाम lookup सर्वोत्तम-प्रयास है, और अनसुलझे नाम runtime पर अनदेखे किए जाते हैं। भेजने वालों को प्रतिबंधित करने के लिए `channels.matrix.groupAllowFrom` का उपयोग करें; प्रति-रूम `users` allowlists भी समर्थित हैं।
    - समूह DMs अलग से नियंत्रित होते हैं (`channels.discord.dm.*`, `channels.slack.dm.*`)।
    - Telegram allowlist user IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) या usernames (`"@alice"` या `"alice"`) से मेल खा सकती है; prefixes case-insensitive हैं।
    - डिफ़ॉल्ट `groupPolicy: "allowlist"` है; यदि आपकी समूह allowlist खाली है, तो समूह संदेश ब्लॉक हो जाते हैं।
    - Runtime सुरक्षा: जब कोई provider ब्लॉक पूरी तरह अनुपस्थित हो (`channels.<provider>` अनुपस्थित), तो समूह नीति `channels.defaults.groupPolicy` से इनहेरिट करने के बजाय fail-closed मोड (आमतौर पर `allowlist`) पर fallback करती है।

  </Accordion>
</AccordionGroup>

त्वरित मानसिक मॉडल (समूह संदेशों के लिए मूल्यांकन क्रम):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)।
  </Step>
  <Step title="Group allowlists">
    समूह allowlists (`*.groups`, `*.groupAllowFrom`, channel-specific allowlist)।
  </Step>
  <Step title="Mention gating">
    Mention gating (`requireMention`, `/activation`)।
  </Step>
</Steps>

## Mention gating (डिफ़ॉल्ट)

समूह संदेशों के लिए mention आवश्यक होता है, जब तक कि प्रति समूह उसे override न किया गया हो। डिफ़ॉल्ट `*.groups."*"` के अंतर्गत प्रति subsystem रहते हैं।

जब channel reply metadata का समर्थन करता है, तो bot संदेश का उत्तर देना implicit mention माना जाता है। जिन channels में quote metadata उपलब्ध होता है, वहां bot संदेश को quote करना भी implicit mention माना जा सकता है। मौजूदा built-in मामलों में Telegram, WhatsApp, Slack, Discord, Microsoft Teams, और ZaloUser शामिल हैं।

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## कॉन्फ़िगर किए गए mention patterns को scope करें

कॉन्फ़िगर किए गए `mentionPatterns` regex fallback triggers हैं। उनका उपयोग तब करें जब
platform कोई native bot mention expose नहीं करता, या जब आप चाहते हों कि plain text जैसे
`openclaw:` mention माना जाए। Native platform mentions अलग हैं:
जब Discord, Slack, Telegram, Matrix, या कोई अन्य channel यह साबित कर सकता है कि संदेश ने
bot को स्पष्ट रूप से mention किया है, तो वह native mention फिर भी trigger करता है, भले ही
कॉन्फ़िगर किए गए regex patterns deny किए गए हों।

डिफ़ॉल्ट रूप से, कॉन्फ़िगर किए गए mention patterns हर उस जगह लागू होते हैं जहां वह channel
provider और conversation facts को mention detection में पास करता है। broad patterns को
हर समूह में agent को जगाने से रोकने के लिए, उन्हें प्रति channel
`channels.<channel>.mentionPatterns` के साथ scope करें।

जब regex mention patterns किसी
channel के लिए डिफ़ॉल्ट रूप से बंद होने चाहिए, तो `mode: "deny"` का उपयोग करें, फिर specific rooms में `allowIn` के साथ opt in करें:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

जब regex mention patterns
व्यापक रूप से लागू होने चाहिए, तो डिफ़ॉल्ट `mode: "allow"` का उपयोग करें (या `mode` छोड़ दें), फिर शोर-भरे rooms में उन्हें `denyIn` के साथ बंद करें:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

नीति समाधान:

| फ़ील्ड           | प्रभाव                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | रेगेक्स मेंशन पैटर्न सक्षम होते हैं, जब तक conversation ID `denyIn` में न हो। यह डिफ़ॉल्ट है।                    |
| `mode: "deny"`  | रेगेक्स मेंशन पैटर्न अक्षम होते हैं, जब तक conversation ID `allowIn` में न हो।                                       |
| `allowIn`       | वे conversation ID जहाँ deny मोड में रेगेक्स मेंशन पैटर्न सक्षम होते हैं।                                               |
| `denyIn`        | वे conversation ID जहाँ रेगेक्स मेंशन पैटर्न अक्षम होते हैं। अगर दोनों में वही ID शामिल हो, तो `denyIn`, `allowIn` पर प्राथमिकता लेता है। |

आज समर्थित scoped रेगेक्स नीति:

| चैनल  | `allowIn` / `denyIn` में उपयोग की गई ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord चैनल ID।                                         |
| Matrix   | Matrix रूम ID।                                             |
| Slack    | Slack चैनल ID।                                           |
| Telegram | समूह चैट ID, या फ़ोरम विषयों के लिए `chatId:topic:threadId`। |
| WhatsApp | WhatsApp conversation ID जैसे `123@g.us`।                |

Account-level चैनल कॉन्फ़िग वही नीति
`channels.<channel>.accounts.<accountId>.mentionPatterns` के अंतर्गत सेट कर सकते हैं, जब वह चैनल
कई खातों का समर्थन करता है। उस खाते के लिए account नीति top-level
चैनल नीति पर प्राथमिकता लेती है।

<AccordionGroup>
  <Accordion title="मेंशन गेटिंग नोट्स">
    - `mentionPatterns` case-insensitive सुरक्षित रेगेक्स पैटर्न हैं; अमान्य पैटर्न और असुरक्षित nested-repetition रूपों को अनदेखा किया जाता है।
    - जो सतहें स्पष्ट मेंशन देती हैं, वे फिर भी पास होती हैं; कॉन्फ़िगर किए गए रेगेक्स पैटर्न fallback हैं।
    - `channels.<channel>.mentionPatterns.mode: "deny"` उस चैनल के लिए कॉन्फ़िगर किए गए मेंशन पैटर्न को डिफ़ॉल्ट रूप से अक्षम करता है; चुनी हुई conversations को `allowIn` से फिर से सक्षम करें।
    - `channels.<channel>.mentionPatterns.denyIn` विशिष्ट conversation ID के लिए कॉन्फ़िगर किए गए मेंशन पैटर्न अक्षम करता है, जबकि native platform @mentions फिर भी पास होते हैं।
    - प्रति-agent override: `agents.list[].groupChat.mentionPatterns` (जब कई agents एक समूह साझा करते हैं तो उपयोगी)।
    - मेंशन गेटिंग केवल तब लागू होती है जब मेंशन पहचान संभव हो (native mentions या `mentionPatterns` कॉन्फ़िगर किए गए हों)।
    - किसी समूह या sender को allowlist करने से मेंशन गेटिंग अक्षम नहीं होती; जब सभी संदेश trigger होने चाहिए, तो उस समूह का `requireMention` `false` पर सेट करें।
    - Automatic group chat prompt context हर turn में resolved silent-reply निर्देश साथ रखता है; workspace files को `NO_REPLY` mechanics दोहराने नहीं चाहिए।
    - जिन समूहों में automatic silent replies की अनुमति है, वे साफ़ खाली या केवल reasoning वाले model turns को silent मानते हैं, जो `NO_REPLY` के बराबर है। Direct chats को कभी `NO_REPLY` guidance नहीं मिलता, और message-tool-only group replies `message(action=send)` को call न करके शांत रहते हैं।
    - Ambient always-on group chatter डिफ़ॉल्ट रूप से user-request semantics का उपयोग करता है। इसके बजाय इसे quiet context के रूप में submit करने के लिए `messages.groupChat.unmentionedInbound: "room_event"` सेट करें। सेटअप उदाहरणों के लिए [Ambient room events](/hi/channels/ambient-room-events) देखें।
    - Room events को नकली user requests के रूप में stored नहीं किया जाता, और no-message-tool room events से private assistant text को chat history के रूप में replay नहीं किया जाता।
    - Discord defaults `channels.discord.guilds."*"` में रहते हैं (प्रति guild/channel override किए जा सकते हैं)।
    - Group history context सभी channels में एकसमान रूप से wrapped होता है। Mention-gated groups pending skipped messages रखते हैं; always-on groups हाल के processed room messages भी रख सकते हैं, जब channel इसका समर्थन करता हो। Global default के लिए `messages.groupChat.historyLimit` और overrides के लिए `channels.<channel>.historyLimit` (या `channels.<channel>.accounts.*.historyLimit`) का उपयोग करें। अक्षम करने के लिए `0` सेट करें।

  </Accordion>
</AccordionGroup>

## समूह/चैनल tool restrictions (वैकल्पिक)

कुछ चैनल कॉन्फ़िग यह सीमित करने का समर्थन करते हैं कि **किसी विशिष्ट group/room/channel के अंदर** कौन से tools उपलब्ध हैं।

- `tools`: पूरे समूह के लिए tools को allow/deny करें।
- `toolsBySender`: समूह के भीतर प्रति-sender overrides। स्पष्ट key prefixes का उपयोग करें: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, और `"*"` wildcard। Channel ids canonical OpenClaw channel ids का उपयोग करते हैं; `teams` जैसे aliases `msteams` में normalize होते हैं। Legacy unprefixed keys अभी भी स्वीकार की जाती हैं और केवल `id:` के रूप में matched होती हैं।

Resolution order (सबसे specific जीतता है):

<Steps>
  <Step title="Group toolsBySender">
    Group/channel `toolsBySender` match.
  </Step>
  <Step title="Group tools">
    Group/channel `tools`.
  </Step>
  <Step title="Default toolsBySender">
    Default (`"*"`) `toolsBySender` match.
  </Step>
  <Step title="Default tools">
    Default (`"*"`) `tools`.
  </Step>
</Steps>

उदाहरण (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Group/channel tool restrictions global/agent tool नीति के अतिरिक्त लागू की जाती हैं (deny फिर भी जीतता है)। कुछ channels rooms/channels के लिए अलग nesting का उपयोग करते हैं (जैसे, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)।
</Note>

## Group allowlists

जब `channels.whatsapp.groups`, `channels.telegram.groups`, या `channels.imessage.groups` कॉन्फ़िगर किया जाता है, तो keys group allowlist के रूप में काम करती हैं। सभी groups को allow करने के लिए `"*"` का उपयोग करें, साथ ही default mention behavior सेट करना जारी रखें।

<Warning>
सामान्य भ्रम: DM पेयरिंग अनुमोदन समूह प्राधिकरण जैसा नहीं है। DM पेयरिंग का समर्थन करने वाले चैनलों के लिए, पेयरिंग स्टोर केवल DM अनलॉक करता है। समूह कमांड के लिए अभी भी config अनुमति-सूचियों जैसे `groupAllowFrom` या उस चैनल के लिए दस्तावेजीकृत config fallback से स्पष्ट समूह प्रेषक प्राधिकरण आवश्यक है।
</Warning>

सामान्य उद्देश्य (कॉपी/पेस्ट):

<Tabs>
  <Tab title="सभी समूह उत्तर अक्षम करें">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="केवल विशिष्ट समूहों को अनुमति दें (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="सभी समूहों को अनुमति दें लेकिन mention आवश्यक करें">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="केवल स्वामी ट्रिगर (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## सक्रियण (केवल स्वामी)

समूह स्वामी प्रति-समूह सक्रियण टॉगल कर सकते हैं:

- `/activation mention`
- `/activation always`

स्वामी `channels.whatsapp.allowFrom` से निर्धारित होता है (या सेट न होने पर बॉट के अपने E.164 से)। कमांड को अलग संदेश के रूप में भेजें। अन्य सतहें अभी `/activation` को अनदेखा करती हैं।

## संदर्भ फ़ील्ड

समूह इनबाउंड पेलोड सेट करते हैं:

- `ChatType=group`
- `GroupSubject` (यदि ज्ञात हो)
- `GroupMembers` (यदि ज्ञात हो)
- `WasMentioned` (mention gating परिणाम)
- Telegram फ़ोरम विषयों में `MessageThreadId` और `IsForum` भी शामिल होते हैं।

एजेंट सिस्टम प्रॉम्प्ट में नए समूह सत्र के पहले turn पर समूह परिचय शामिल होता है। यह मॉडल को मनुष्य की तरह जवाब देने, खाली पंक्तियों को कम रखने और सामान्य चैट spacing का पालन करने, और literal `\n` sequences टाइप करने से बचने की याद दिलाता है। गैर-Telegram समूह Markdown tables को भी हतोत्साहित करते हैं; Telegram rich-text guidance Telegram चैनल प्रॉम्प्ट से आती है। चैनल-स्रोत समूह नाम और सहभागी labels fenced untrusted metadata के रूप में render किए जाते हैं, inline system instructions के रूप में नहीं।

## iMessage विशेषताएँ

- routing या allowlisting करते समय `chat_id:<id>` को प्राथमिकता दें।
- chats सूचीबद्ध करें: `imsg chats --limit 20`।
- समूह उत्तर हमेशा उसी `chat_id` पर वापस जाते हैं।

## WhatsApp सिस्टम प्रॉम्प्ट

canonical WhatsApp सिस्टम प्रॉम्प्ट नियमों के लिए [WhatsApp](/hi/channels/whatsapp#system-prompts) देखें, जिसमें समूह और direct prompt resolution, wildcard behavior, और account override semantics शामिल हैं।

## WhatsApp विशेषताएँ

WhatsApp-only behavior (history injection, mention handling details) के लिए [समूह संदेश](/hi/channels/group-messages) देखें।

## संबंधित

- [Broadcast समूह](/hi/channels/broadcast-groups)
- [चैनल routing](/hi/channels/channel-routing)
- [समूह संदेश](/hi/channels/group-messages)
- [Pairing](/hi/channels/pairing)
