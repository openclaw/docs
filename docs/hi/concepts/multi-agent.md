---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'मल्टी-एजेंट रूटिंग: अलग-थलग एजेंट, चैनल खाते, और बाइंडिंग'
title: बहु-एजेंट रूटिंग
x-i18n:
    generated_at: "2026-06-28T23:00:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

कई _अलग-थलग_ एजेंट चलाएँ — हर एक का अपना कार्यक्षेत्र, स्थिति निर्देशिका (`agentDir`), और सत्र इतिहास — साथ ही एक चलते हुए Gateway में कई चैनल खाते (जैसे दो WhatsApp) चलाएँ। आने वाले संदेश बाइंडिंग के ज़रिए सही एजेंट तक रूट किए जाते हैं।

यहाँ **एजेंट** पूरा प्रति-पर्सोना स्कोप है: कार्यक्षेत्र फ़ाइलें, auth प्रोफ़ाइल, मॉडल रजिस्ट्री, और सत्र स्टोर। `agentDir` वह ऑन-डिस्क स्थिति निर्देशिका है जो इस प्रति-एजेंट कॉन्फ़िग को `~/.openclaw/agents/<agentId>/` पर रखती है। **बाइंडिंग** किसी चैनल खाते (जैसे Slack कार्यक्षेत्र या WhatsApp नंबर) को उन एजेंटों में से किसी एक से मैप करती है।

## "एक एजेंट" क्या है?

**एजेंट** अपने स्वयं के साथ पूरी तरह स्कोप किया हुआ ब्रेन है:

- **कार्यस्थान** (फ़ाइलें, AGENTS.md/SOUL.md/USER.md, स्थानीय नोट्स, पर्सोना नियम)।
- **स्थिति निर्देशिका** (`agentDir`) auth प्रोफ़ाइल, मॉडल रजिस्ट्री, और प्रति-एजेंट कॉन्फ़िग के लिए।
- **सत्र स्टोर** (चैट इतिहास + रूटिंग स्थिति) `~/.openclaw/agents/<agentId>/sessions` के अंतर्गत।

Auth प्रोफ़ाइल **प्रति-एजेंट** होती हैं। हर एजेंट अपनी स्वयं की इस जगह से पढ़ता है:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` यहाँ भी अधिक सुरक्षित क्रॉस-सत्र रिकॉल पथ है: यह कच्चा ट्रांसक्रिप्ट डंप नहीं, बल्कि सीमित और सैनिटाइज़ किया हुआ दृश्य लौटाता है। असिस्टेंट रिकॉल thinking टैग, `<relevant-memories>` स्कैफ़ोल्डिंग, प्लेन-टेक्स्ट टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और कटे हुए टूल-कॉल ब्लॉक शामिल हैं), डाउनग्रेड की हुई टूल-कॉल स्कैफ़ोल्डिंग, लीक हुए ASCII/फुल-विथ मॉडल नियंत्रण टोकन, और गलत रूप वाले MiniMax टूल-कॉल XML को redaction/truncation से पहले हटा देता है।
</Note>

<Warning>
एजेंटों के बीच कभी भी `agentDir` का दोबारा उपयोग न करें (इससे auth/session टकराव होते हैं)। एजेंटों के पास स्थानीय प्रोफ़ाइल न होने पर वे default/main एजेंट की auth प्रोफ़ाइल तक पढ़ सकते हैं, लेकिन OpenClaw OAuth refresh tokens को secondary agent store में क्लोन नहीं करता। यदि आपको स्वतंत्र OAuth खाता चाहिए, तो उस एजेंट से साइन इन करें; यदि आप credentials मैन्युअल रूप से कॉपी करते हैं, तो केवल पोर्टेबल static `api_key` या `token` प्रोफ़ाइल कॉपी करें।
</Warning>

Skills हर एजेंट कार्यक्षेत्र और `~/.openclaw/skills` जैसे साझा roots से लोड होती हैं, फिर कॉन्फ़िगर होने पर प्रभावी एजेंट skill allowlist के आधार पर फ़िल्टर होती हैं। साझा बेसलाइन के लिए `agents.defaults.skills` और प्रति-एजेंट replacement के लिए `agents.list[].skills` का उपयोग करें। देखें [Skills: प्रति-एजेंट बनाम साझा](/hi/tools/skills#per-agent-vs-shared-skills) और [Skills: एजेंट skill allowlists](/hi/tools/skills#agent-allowlists)।

Gateway **एक एजेंट** (डिफ़ॉल्ट) या **कई एजेंटों** को साथ-साथ होस्ट कर सकता है।

<Note>
**कार्यस्थान नोट:** हर एजेंट का कार्यस्थान **डिफ़ॉल्ट cwd** है, कोई कठोर sandbox नहीं। Relative paths कार्यस्थान के अंदर resolve होते हैं, लेकिन sandboxing enabled न हो तो absolute paths अन्य host locations तक पहुँच सकते हैं। देखें [Sandboxing](/hi/gateway/sandboxing)।
</Note>

## पथ (त्वरित मैप)

- कॉन्फ़िग: `~/.openclaw/openclaw.json` (या `OPENCLAW_CONFIG_PATH`)
- स्थिति dir: `~/.openclaw` (या `OPENCLAW_STATE_DIR`)
- कार्यस्थान: `~/.openclaw/workspace` (या `~/.openclaw/workspace-<agentId>`)
- एजेंट dir: `~/.openclaw/agents/<agentId>/agent` (या `agents.list[].agentDir`)
- सत्र: `~/.openclaw/agents/<agentId>/sessions`

### सिंगल-एजेंट मोड (डिफ़ॉल्ट)

यदि आप कुछ नहीं करते, OpenClaw एक single agent चलाता है:

- `agentId` डिफ़ॉल्ट रूप से **`main`** होता है।
- सत्र `agent:main:<mainKey>` के रूप में key किए जाते हैं।
- कार्यस्थान डिफ़ॉल्ट रूप से `~/.openclaw/workspace` होता है (या `OPENCLAW_PROFILE` सेट होने पर `~/.openclaw/workspace-<profile>`)।
- स्थिति डिफ़ॉल्ट रूप से `~/.openclaw/agents/main/agent` होती है।

## एजेंट helper

नया isolated agent जोड़ने के लिए agent wizard का उपयोग करें:

```bash
openclaw agents add work
```

फिर आने वाले संदेशों को route करने के लिए `bindings` जोड़ें (या wizard को यह करने दें)।

इससे सत्यापित करें:

```bash
openclaw agents list --bindings
```

## त्वरित शुरुआत

<Steps>
  <Step title="Create each agent workspace">
    wizard का उपयोग करें या workspaces मैन्युअल रूप से बनाएँ:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    हर एजेंट को `SOUL.md`, `AGENTS.md`, और वैकल्पिक `USER.md` के साथ अपना कार्यस्थान मिलता है, साथ ही `~/.openclaw/agents/<agentId>` के अंतर्गत dedicated `agentDir` और session store मिलता है।

  </Step>
  <Step title="Create channel accounts">
    अपने पसंदीदा चैनलों पर हर एजेंट के लिए एक खाता बनाएँ:

    - Discord: हर एजेंट के लिए एक bot, Message Content Intent enable करें, हर token copy करें।
    - Telegram: BotFather के ज़रिए हर एजेंट के लिए एक bot, हर token copy करें।
    - WhatsApp: हर खाते के लिए हर phone number link करें।

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    चैनल गाइड देखें: [Discord](/hi/channels/discord), [Telegram](/hi/channels/telegram), [WhatsApp](/hi/channels/whatsapp)।

  </Step>
  <Step title="Add agents, accounts, and bindings">
    `agents.list` के अंतर्गत agents, `channels.<channel>.accounts` के अंतर्गत channel accounts जोड़ें, और उन्हें `bindings` से connect करें (नीचे उदाहरण हैं)।
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## कई एजेंट = कई लोग, कई व्यक्तित्व

**कई एजेंटों** के साथ, हर `agentId` एक **पूरी तरह isolated persona** बन जाता है:

- **अलग phone numbers/accounts** (प्रति channel `accountId`)।
- **अलग personalities** (प्रति-एजेंट कार्यस्थान फ़ाइलें जैसे `AGENTS.md` और `SOUL.md`)।
- **अलग auth + sessions** (जब तक स्पष्ट रूप से enable न किया जाए, कोई cross-talk नहीं)।

इससे **कई लोग** अपने AI "brains" और data को अलग रखते हुए एक Gateway server साझा कर सकते हैं।

## क्रॉस-एजेंट QMD memory search

यदि किसी एक एजेंट को दूसरे एजेंट के QMD session transcripts search करने चाहिए, तो `agents.list[].memorySearch.qmd.extraCollections` के अंतर्गत extra collections जोड़ें। `agents.defaults.memorySearch.qmd.extraCollections` का उपयोग केवल तब करें जब हर एजेंट को वही shared transcript collections inherit करनी हों।

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Extra collection path agents के बीच shared हो सकता है, लेकिन जब path agent workspace के बाहर होता है तो collection name explicit रहता है। Workspace के अंदर के paths agent-scoped रहते हैं ताकि हर एजेंट अपना transcript search set रखे।

## एक WhatsApp नंबर, कई लोग (DM split)

आप **एक WhatsApp account** पर रहते हुए **अलग-अलग WhatsApp DMs** को अलग-अलग agents तक route कर सकते हैं। Sender E.164 (जैसे `+15551234567`) पर `peer.kind: "direct"` के साथ match करें। Replies फिर भी उसी WhatsApp number से आती हैं (कोई प्रति-एजेंट sender identity नहीं)।

<Note>
Direct chats agent की **main session key** पर collapse होती हैं, इसलिए true isolation के लिए **हर व्यक्ति के लिए एक agent** चाहिए।
</Note>

उदाहरण:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

नोट्स:

- DM access control **हर WhatsApp account के लिए global** है (pairing/allowlist), प्रति agent नहीं।
- Shared groups के लिए, group को एक agent से bind करें या [Broadcast groups](/hi/channels/broadcast-groups) का उपयोग करें।

## Routing rules (messages कैसे agent चुनते हैं)

Bindings **deterministic** हैं और **सबसे-specific जीतता है**:

<Steps>
  <Step title="peer match">
    Exact DM/group/channel id।
  </Step>
  <Step title="parentPeer match">
    Thread inheritance।
  </Step>
  <Step title="guildId + roles">
    Discord role routing।
  </Step>
  <Step title="guildId">
    Discord।
  </Step>
  <Step title="teamId">
    Slack।
  </Step>
  <Step title="accountId match for a channel">
    प्रति-account fallback।
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`।
  </Step>
  <Step title="Default agent">
    `agents.list[].default` पर fallback, नहीं तो पहली list entry, डिफ़ॉल्ट: `main`।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - यदि एक ही tier में कई bindings match करती हैं, तो config order में पहली जीतती है।
    - यदि कोई binding कई match fields set करती है (उदाहरण के लिए `peer` + `guildId`), तो सभी specified fields आवश्यक होते हैं (`AND` semantics)।

  </Accordion>
  <Accordion title="Account-scope detail">
    - `accountId` omit करने वाली binding केवल default account से match करती है। यह सभी accounts से match नहीं करती।
    - सभी accounts पर channel-wide fallback के लिए `accountId: "*"` का उपयोग करें।
    - किसी एक account से match करने के लिए `accountId: "<name>"` का उपयोग करें।
    - यदि आप बाद में उसी agent के लिए explicit account id के साथ वही binding जोड़ते हैं, तो OpenClaw existing channel-only binding को duplicate करने के बजाय account-scoped में upgrade करता है।

  </Accordion>
</AccordionGroup>

## कई accounts / phone numbers

जो channels **कई accounts** support करते हैं (जैसे WhatsApp), वे हर login की पहचान के लिए `accountId` का उपयोग करते हैं। हर `accountId` अलग agent तक route हो सकता है, इसलिए एक server sessions मिलाए बिना कई phone numbers host कर सकता है।

यदि `accountId` omitted होने पर आपको channel-wide default account चाहिए, तो `channels.<channel>.defaultAccount` (optional) set करें। Unset होने पर, OpenClaw मौजूद होने पर `default` पर fallback करता है, अन्यथा पहली configured account id (sorted) पर।

इस pattern को support करने वाले common channels में शामिल हैं:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId`: एक "brain" (workspace, per-agent auth, per-agent session store)।
- `accountId`: एक channel account instance (जैसे WhatsApp account `"personal"` बनाम `"biz"`)।
- `binding`: `(channel, accountId, peer)` और optionally guild/team ids के आधार पर inbound messages को `agentId` तक route करता है।
- Direct chats `agent:<agentId>:<mainKey>` पर collapse होती हैं (per-agent "main"; `session.mainKey`)।

## Platform examples

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    हर Discord bot account एक unique `accountId` से map होता है। हर account को एक agent से bind करें और allowlists प्रति bot रखें।

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - प्रत्येक बॉट को गिल्ड में आमंत्रित करें और Message Content Intent सक्षम करें।
    - टोकन `channels.discord.accounts.<id>.token` में रहते हैं (डिफ़ॉल्ट खाता `DISCORD_BOT_TOKEN` का उपयोग कर सकता है)।

  </Accordion>
  <Accordion title="प्रति एजेंट Telegram बॉट">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - BotFather के साथ प्रति एजेंट एक बॉट बनाएं और प्रत्येक टोकन कॉपी करें।
    - टोकन `channels.telegram.accounts.<id>.botToken` में रहते हैं (डिफ़ॉल्ट खाता `TELEGRAM_BOT_TOKEN` का उपयोग कर सकता है)।
    - एक ही Telegram समूह में कई बॉट के लिए, प्रत्येक बॉट को आमंत्रित करें और उस बॉट का उल्लेख करें जिसे उत्तर देना चाहिए।
    - प्रत्येक समूह बॉट के लिए BotFather Privacy Mode अक्षम करें, फिर बॉट को दोबारा जोड़ें ताकि Telegram सेटिंग लागू करे।
    - `channels.telegram.groups` के साथ समूहों को अनुमति दें, या केवल भरोसेमंद समूह डिप्लॉयमेंट के लिए `groupPolicy: "open"` का उपयोग करें।
    - प्रेषक उपयोगकर्ता ID को `groupAllowFrom` में रखें। समूह और सुपरग्रुप ID `channels.telegram.groups` में होते हैं, `groupAllowFrom` में नहीं।
    - `accountId` से बाइंड करें ताकि प्रत्येक बॉट अपने ही एजेंट तक रूट हो।

  </Accordion>
  <Accordion title="प्रति एजेंट WhatsApp नंबर">
    Gateway शुरू करने से पहले प्रत्येक खाते को लिंक करें:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## सामान्य पैटर्न

<Tabs>
  <Tab title="WhatsApp दैनिक + Telegram गहन कार्य">
    चैनल के अनुसार विभाजित करें: WhatsApp को तेज़ रोज़मर्रा के एजेंट पर और Telegram को Opus एजेंट पर रूट करें।

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    नोट्स:

    - ये उदाहरण `accountId: "*"` का उपयोग करते हैं ताकि बाद में खाते जोड़ने पर भी बाइंडिंग काम करती रहें।
    - बाकी को चैट पर रखते हुए किसी एक DM/समूह को Opus पर रूट करने के लिए, उस peer के लिए `match.peer` बाइंडिंग जोड़ें; peer मिलान हमेशा चैनल-व्यापी नियमों पर प्राथमिकता लेते हैं।

  </Tab>
  <Tab title="वही चैनल, एक peer Opus पर">
    WhatsApp को तेज़ एजेंट पर रखें, लेकिन एक DM को Opus पर रूट करें:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Peer बाइंडिंग हमेशा प्राथमिकता लेती हैं, इसलिए उन्हें चैनल-व्यापी नियम के ऊपर रखें।

  </Tab>
  <Tab title="WhatsApp समूह से बाइंड किया गया पारिवारिक एजेंट">
    एक समर्पित पारिवारिक एजेंट को एकल WhatsApp समूह से बाइंड करें, mention gating और अधिक कड़ी टूल नीति के साथ:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    नोट्स:

    - टूल allow/deny सूचियां **tools** हैं, Skills नहीं। यदि किसी skill को बाइनरी चलानी है, तो सुनिश्चित करें कि `exec` अनुमत है और बाइनरी sandbox में मौजूद है।
    - अधिक कड़ी gating के लिए, `agents.list[].groupChat.mentionPatterns` सेट करें और चैनल के लिए समूह allowlists सक्षम रखें।

  </Tab>
</Tabs>

## प्रति-एजेंट sandbox और टूल कॉन्फ़िगरेशन

प्रत्येक एजेंट का अपना sandbox और टूल प्रतिबंध हो सकते हैं:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` `sandbox.docker` के अंतर्गत रहता है और कंटेनर बनने पर एक बार चलता है। जब resolved scope `"shared"` हो, तो प्रति-एजेंट `sandbox.docker.*` overrides अनदेखे किए जाते हैं।
</Note>

**लाभ:**

- **सुरक्षा पृथक्करण**: अविश्वसनीय एजेंटों के लिए टूल सीमित करें।
- **संसाधन नियंत्रण**: कुछ एजेंटों को sandbox में रखें जबकि बाकी को host पर रखें।
- **लचीली नीतियां**: प्रति एजेंट अलग-अलग अनुमतियां।

<Note>
`tools.elevated` **global** और sender-based है; इसे प्रति एजेंट कॉन्फ़िगर नहीं किया जा सकता। यदि आपको प्रति-एजेंट सीमाएं चाहिए, तो `exec` को deny करने के लिए `agents.list[].tools` का उपयोग करें। समूह targeting के लिए, `agents.list[].groupChat.mentionPatterns` का उपयोग करें ताकि @mentions साफ़ तौर पर लक्षित एजेंट से मैप हों।
</Note>

विस्तृत उदाहरणों के लिए [Multi-agent sandbox and tools](/hi/tools/multi-agent-sandbox-tools) देखें।

## संबंधित

- [ACP एजेंट](/hi/tools/acp-agents) — बाहरी coding harnesses चलाना
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेश एजेंटों तक कैसे रूट होते हैं
- [उपस्थिति](/hi/concepts/presence) — एजेंट की उपस्थिति और उपलब्धता
- [सत्र](/hi/concepts/session) — सत्र पृथक्करण और रूटिंग
- [उप-एजेंट](/hi/tools/subagents) — पृष्ठभूमि एजेंट runs spawn करना
