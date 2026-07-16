---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'बहु-एजेंट रूटिंग: एजेंट सीमाएँ, चैनल खाते और बाइंडिंग्स'
title: मल्टी-एजेंट रूटिंग
x-i18n:
    generated_at: "2026-07-16T14:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

एक Gateway प्रक्रिया में कई _पृथक_ एजेंट चलाएँ, जिनमें प्रत्येक का अपना वर्कस्पेस, स्थिति डायरेक्टरी (`agentDir`), और SQLite-समर्थित सत्र इतिहास हो, साथ ही कई चैनल खाते (जैसे दो WhatsApp नंबर) हों। इनबाउंड संदेश **बाइंडिंग** के माध्यम से सही एजेंट तक रूट होते हैं।

एक **एजेंट** प्रति-पर्सोना का संपूर्ण दायरा है: वर्कस्पेस फ़ाइलें, प्रमाणीकरण प्रोफ़ाइल, मॉडल रजिस्ट्री और सत्र स्टोर। एक **बाइंडिंग** किसी चैनल खाते (Slack वर्कस्पेस, WhatsApp नंबर आदि) को उन एजेंटों में से किसी एक से मैप करती है।

## एक एजेंट क्या है

प्रत्येक एजेंट का अपना निम्नलिखित होता है:

- **वर्कस्पेस**: फ़ाइलें, `AGENTS.md`/`SOUL.md`/`USER.md`, स्थानीय नोट्स, पर्सोना नियम।
- **स्थिति डायरेक्टरी** (`agentDir`): प्रमाणीकरण प्रोफ़ाइल, मॉडल रजिस्ट्री, प्रति-एजेंट कॉन्फ़िगरेशन।
- **सत्र स्टोर**: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` में चैट इतिहास और रूटिंग स्थिति।

प्रमाणीकरण प्रोफ़ाइल प्रति-एजेंट होती हैं और यहाँ से पढ़ी जाती हैं:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` सत्रों के बीच स्मरण के लिए अधिक सुरक्षित मार्ग है: यह कच्चा ट्रांसक्रिप्ट डंप नहीं, बल्कि एक सीमित और संशोधित दृश्य लौटाता है। यह थिंकिंग-ब्लॉक हस्ताक्षर, टूल-परिणाम पेलोड विवरण, `<relevant-memories>` स्कैफ़ोल्डिंग, टूल-कॉल XML टैग (`<tool_call>`, `<function_call>`, और उनके बहुवचन/डाउनग्रेड किए गए रूप), तथा MiniMax टूल-कॉल XML हटाता है, फिर आउटपुट को छोटा करता है और बाइट आकार के अनुसार सीमित करता है।
</Note>

<Warning>
कभी भी एजेंटों के बीच `agentDir` का पुनः उपयोग न करें — इससे प्रमाणीकरण/सत्र स्थिति में टकराव होता है। जब किसी द्वितीयक एजेंट का स्थानीय OAuth क्रेडेंशियल समाप्त हो जाता है या उसका रीफ़्रेश विफल होता है, तो OpenClaw उसी प्रोफ़ाइल आईडी के लिए डिफ़ॉल्ट/मुख्य एजेंट के क्रेडेंशियल को पढ़ता है और जो भी टोकन सबसे नया हो उसे अपना लेता है, लेकिन रीफ़्रेश टोकन को द्वितीयक एजेंट के स्टोर में कॉपी नहीं करता। यदि पूर्णतः स्वतंत्र OAuth खाता चाहिए, तो उस एजेंट से साइन इन करें। यदि क्रेडेंशियल मैन्युअल रूप से कॉपी किए जाते हैं, तो केवल पोर्टेबल स्थिर `api_key` या `token` प्रोफ़ाइल कॉपी करें — OAuth रीफ़्रेश सामग्री डिफ़ॉल्ट रूप से पोर्टेबल नहीं होती (`copyToAgents` किसी प्रोफ़ाइल को स्पष्ट रूप से इसमें शामिल कर सकता है)।
</Warning>

Skills प्रत्येक एजेंट वर्कस्पेस और `~/.openclaw/skills` जैसे साझा रूट से लोड होते हैं, फिर प्रभावी एजेंट Skill अनुमति-सूची के अनुसार फ़िल्टर होते हैं। साझा आधाररेखा के लिए `agents.defaults.skills` और प्रति-एजेंट प्रतिस्थापन के लिए `agents.list[].skills` का उपयोग करें (स्पष्ट प्रविष्टियाँ डिफ़ॉल्ट को प्रतिस्थापित करती हैं, उनका विलय नहीं करतीं)। [Skills: प्रति-एजेंट बनाम साझा](/hi/tools/skills#per-agent-vs-shared-skills) और [Skills: एजेंट अनुमति-सूचियाँ](/hi/tools/skills#agent-allowlists) देखें।

Plugin-स्वामित्व वाला स्टोरेज उस Plugin के कॉन्फ़िगरेशन का पालन करता है; दूसरा एजेंट जोड़ने से प्रत्येक वैश्विक Plugin स्टोर अपने-आप विभाजित नहीं होता। उदाहरण के लिए, जब पर्सोना को संकलित विकी ज्ञान साझा नहीं करना चाहिए, तब
[Memory Wiki प्रति-एजेंट वॉल्ट](/hi/concepts/multi-agent#per-agent-memory-wiki-vaults)
कॉन्फ़िगर करें।

<Note>
**वर्कस्पेस नोट:** प्रत्येक एजेंट का वर्कस्पेस **डिफ़ॉल्ट cwd** है, कोई कठोर सैंडबॉक्स नहीं। सापेक्ष पथ वर्कस्पेस के भीतर रिज़ॉल्व होते हैं, लेकिन सैंडबॉक्सिंग सक्षम न होने पर निरपेक्ष पथ होस्ट के अन्य स्थानों तक पहुँच सकते हैं। [सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।
</Note>

## पथ

| क्या                              | डिफ़ॉल्ट                                                                                | ओवरराइड                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| कॉन्फ़िगरेशन                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| स्थिति डायरेक्टरी                | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| डिफ़ॉल्ट एजेंट का वर्कस्पेस      | `~/.openclaw/workspace` (या जब `OPENCLAW_PROFILE` सेट हो तब `workspace-<profile>`)      | `agents.list[].workspace`, फिर `agents.defaults.workspace`, या `OPENCLAW_WORKSPACE_DIR` |
| अन्य एजेंटों का वर्कस्पेस        | `<stateDir>/workspace-<agentId>` (या सेट होने पर `<agents.defaults.workspace>/<agentId>`) | `agents.list[].workspace`                                                                |
| एजेंट डायरेक्टरी                 | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| सत्र और ट्रांसक्रिप्ट            | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| लेगेसी/संग्रहित सत्र आर्टिफ़ैक्ट | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### एकल-एजेंट मोड (डिफ़ॉल्ट)

यदि कुछ भी कॉन्फ़िगर नहीं किया जाता, तो OpenClaw एक एजेंट चलाता है:

- `agentId` का डिफ़ॉल्ट `main` है।
- सत्रों की कुंजी `agent:main:<mainKey>` के रूप में होती है (डिफ़ॉल्ट `mainKey`, `main` है)।
- वर्कस्पेस का डिफ़ॉल्ट `~/.openclaw/workspace` है (या जब `OPENCLAW_PROFILE` को `default` के अलावा किसी अन्य मान पर सेट किया गया हो, तब `workspace-<profile>`)।
- स्थिति का डिफ़ॉल्ट `~/.openclaw/agents/main/agent` है।

## एजेंट सहायक

एक नया पृथक एजेंट जोड़ें:

```bash
openclaw agents add work
```

फ़्लैग: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (दोहराया जा सकता है), `--non-interactive` (इसके लिए `--workspace` आवश्यक है)।

इनबाउंड संदेशों को रूट करने के लिए `bindings` जोड़ें (विज़ार्ड यह आपके लिए करने की पेशकश करता है), फिर सत्यापित करें:

```bash
openclaw agents list --bindings
```

## त्वरित शुरुआत

<Steps>
  <Step title="प्रत्येक एजेंट वर्कस्पेस बनाएँ">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    प्रत्येक एजेंट को `SOUL.md`, `AGENTS.md`, और वैकल्पिक `USER.md` वाला अपना वर्कस्पेस मिलता है, साथ ही एक समर्पित `agentDir` और `~/.openclaw/agents/<agentId>` के अंतर्गत सत्र स्टोर मिलता है।

  </Step>
  <Step title="चैनल खाते बनाएँ">
    पसंदीदा चैनलों पर प्रत्येक एजेंट के लिए एक खाता बनाएँ:

    - Discord: प्रत्येक एजेंट के लिए एक बॉट, Message Content Intent सक्षम करें, प्रत्येक टोकन कॉपी करें।
    - Telegram: BotFather के माध्यम से प्रत्येक एजेंट के लिए एक बॉट, प्रत्येक टोकन कॉपी करें।
    - WhatsApp: प्रत्येक खाते के लिए प्रत्येक फ़ोन नंबर लिंक करें।

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    चैनल मार्गदर्शिकाएँ देखें: [Discord](/hi/channels/discord), [Telegram](/hi/channels/telegram), [WhatsApp](/hi/channels/whatsapp)।

  </Step>
  <Step title="एजेंट, खाते और बाइंडिंग जोड़ें">
    `agents.list` के अंतर्गत एजेंट, `channels.<channel>.accounts` के अंतर्गत चैनल खाते जोड़ें, और उन्हें `bindings` से कनेक्ट करें (नीचे उदाहरण दिए गए हैं)।
  </Step>
  <Step title="पुनः आरंभ करें और सत्यापित करें">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## कई एजेंट, कई पर्सोना

प्रत्येक कॉन्फ़िगर किया गया `agentId`, मुख्य एजेंट स्थिति के लिए एक अलग पर्सोना सीमा है:

- प्रत्येक चैनल के लिए अलग-अलग खाते (प्रति `accountId`)।
- अलग-अलग व्यक्तित्व (प्रति-एजेंट `AGENTS.md`/`SOUL.md`)।
- अलग प्रमाणीकरण और सत्र, जहाँ एजेंटों के बीच पहुँच केवल स्पष्ट सुविधाओं या Plugin कॉन्फ़िगरेशन के माध्यम से सक्षम होती है।

इससे मुख्य एजेंट स्थिति को अलग रखते हुए कई लोग एक Gateway साझा कर सकते हैं।

## प्रति-एजेंट Memory Wiki वॉल्ट

Memory Wiki डिफ़ॉल्ट रूप से एक वैश्विक वॉल्ट का उपयोग करता है। किसी सहायता एजेंट के
संकलित ज्ञान को मार्केटिंग एजेंट के ज्ञान से अलग रखने के लिए,
`plugins.entries.memory-wiki.config.vault.scope` को `agent` पर सेट करें:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

कॉन्फ़िगर किया गया पथ पैरेंट डायरेक्टरी है। OpenClaw सामान्यीकृत
एजेंट आईडी जोड़ता है, जिससे `~/.openclaw/wiki/support` और
`~/.openclaw/wiki/marketing` जैसे पथ बनते हैं। कई एजेंट कॉन्फ़िगर होने पर एजेंट-स्कोप वाले CLI और Gateway संचालनों के लिए
एक स्पष्ट एजेंट आवश्यक होता है। ब्रिज
फ़िल्टरिंग, माइग्रेशन और विश्वास-सीमा के विवरण के लिए
[Memory Wiki प्रति-एजेंट वॉल्ट](/hi/plugins/memory-wiki#per-agent-vaults) देखें।

## एजेंटों के बीच QMD मेमोरी खोज

एक एजेंट को दूसरे एजेंट के QMD सत्र ट्रांसक्रिप्ट खोजने देने के लिए, `agents.list[].memorySearch.qmd.extraCollections` के अंतर्गत अतिरिक्त संग्रह जोड़ें। जब प्रत्येक एजेंट को समान संग्रह साझा करने चाहिए, तब `agents.defaults.memorySearch.qmd.extraCollections` का उपयोग करें।

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
            extraCollections: [{ path: "notes" }], // वर्कस्पेस के भीतर रिज़ॉल्व होता है -> "notes-main" नाम वाला संग्रह
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

एक अतिरिक्त-संग्रह पथ एजेंटों के बीच साझा किया जा सकता है, लेकिन जब पथ एजेंट वर्कस्पेस के बाहर हो तो उसका `name` स्पष्ट रहता है। वर्कस्पेस के भीतर के पथ एजेंट-स्कोप वाले रहते हैं, ताकि प्रत्येक एजेंट अपना ट्रांसक्रिप्ट खोज सेट बनाए रखे।

## एक WhatsApp नंबर, कई लोग (DM विभाजन)

प्रेषक E.164 (`+15551234567`) का `peer.kind: "direct"` से मिलान करके **एक** WhatsApp खाते पर अलग-अलग WhatsApp DM को अलग-अलग एजेंटों तक रूट करें। उत्तर फिर भी उसी WhatsApp नंबर से आते हैं — प्रति-एजेंट प्रेषक पहचान नहीं होती।

<Note>
प्रत्यक्ष चैट डिफ़ॉल्ट रूप से एजेंट की मुख्य सत्र कुंजी में समाहित हो जाती हैं, इसलिए वास्तविक पृथक्करण के लिए प्रत्येक व्यक्ति हेतु एक एजेंट आवश्यक है।
</Note>

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

DM पहुँच नियंत्रण (पेयरिंग/अनुमति-सूची) प्रति WhatsApp खाते वैश्विक होता है, प्रति एजेंट नहीं। साझा समूहों के लिए, समूह को किसी एक एजेंट से बाइंड करें या [ब्रॉडकास्ट समूह](/hi/channels/broadcast-groups) का उपयोग करें।

## रूटिंग नियम

बाइंडिंग निर्धारक होती हैं और सबसे विशिष्ट का चयन होता है। संपूर्ण स्तर क्रम (सटीक पीयर, पैरेंट पीयर, पीयर वाइल्डकार्ड, गिल्ड+भूमिकाएँ, गिल्ड, टीम, खाता, चैनल, डिफ़ॉल्ट एजेंट) के लिए [चैनल रूटिंग](/hi/channels/channel-routing#routing-rules-how-an-agent-is-chosen) देखें। यहाँ कुछ उल्लेखनीय नियम हैं:

- यदि एक ही स्तर में कई बाइंडिंग मेल खाती हैं, तो कॉन्फ़िगरेशन क्रम में पहली बाइंडिंग चुनी जाती है।
- यदि कोई बाइंडिंग कई मिलान फ़ील्ड सेट करती है (उदाहरण के लिए `peer` + `guildId`), तो सभी निर्दिष्ट फ़ील्ड का मेल खाना आवश्यक है (`AND` अर्थविज्ञान)।
- जो बाइंडिंग `accountId` को छोड़ देती है, वह केवल डिफ़ॉल्ट खाते से मेल खाती है, प्रत्येक खाते से नहीं। चैनल-व्यापी फ़ॉलबैक के लिए `accountId: "*"`, या किसी एक खाते के लिए `accountId: "<name>"` का उपयोग करें। स्पष्ट खाता आईडी के साथ वही बाइंडिंग फिर से जोड़ने पर मौजूदा केवल-चैनल बाइंडिंग की प्रतिलिपि बनाने के बजाय उसे अपग्रेड किया जाता है।

## कई खाते / फ़ोन नंबर

कई खातों का समर्थन करने वाले चैनल (जैसे WhatsApp) प्रत्येक लॉगिन की पहचान करने के लिए `accountId` का उपयोग करते हैं। प्रत्येक `accountId` अपने एजेंट तक रूट होता है, इसलिए एक सर्वर सत्रों को मिलाए बिना कई फ़ोन नंबर होस्ट कर सकता है।

`accountId` न दिए जाने पर उपयोग किए जाने वाले खाते को चुनने के लिए `channels.<channel>.defaultAccount` सेट करें। सेट न होने पर, यदि `default` मौजूद है तो OpenClaw उसका उपयोग करता है, अन्यथा पहले कॉन्फ़िगर किए गए खाता आईडी (क्रमबद्ध) का।

एकाधिक खातों का समर्थन करने वाले चैनल: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`।

## अवधारणाएँ

- `agentId`: एक "मस्तिष्क" (वर्कस्पेस, प्रति-एजेंट प्रमाणीकरण, प्रति-एजेंट सत्र स्टोर)।
- `accountId`: एक चैनल खाता इंस्टेंस (उदाहरण के लिए WhatsApp खाता `personal` बनाम `biz`)।
- `binding`: आने वाले संदेशों को `(channel, accountId, peer)` और वैकल्पिक रूप से गिल्ड/टीम आईडी के आधार पर किसी `agentId` तक रूट करता है।
- प्रत्यक्ष चैट `agent:<agentId>:<mainKey>` में समाहित हो जाती हैं (प्रति-एजेंट "मुख्य"; `session.mainKey` देखें)।

## प्लेटफ़ॉर्म उदाहरण

<AccordionGroup>
  <Accordion title="प्रति एजेंट Discord बॉट">
    प्रत्येक Discord बॉट खाता एक अद्वितीय `accountId` से मैप होता है। प्रत्येक खाते को किसी एजेंट से बाइंड करें और प्रत्येक बॉट के लिए अलग अनुमति-सूचियाँ बनाए रखें।

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

    - BotFather से प्रत्येक एजेंट के लिए एक बॉट बनाएँ और प्रत्येक टोकन कॉपी करें।
    - टोकन `channels.telegram.accounts.<id>.botToken` में रहते हैं (डिफ़ॉल्ट खाता `TELEGRAM_BOT_TOKEN` का उपयोग कर सकता है)।
    - एक ही Telegram समूह में एकाधिक बॉट के लिए, प्रत्येक बॉट को आमंत्रित करें और उस बॉट का उल्लेख करें जिसे उत्तर देना चाहिए।
    - प्रत्येक समूह बॉट के लिए BotFather Privacy Mode अक्षम करें (`/setprivacy` -> Disable), फिर बॉट को हटाकर दोबारा जोड़ें, ताकि Telegram सेटिंग लागू कर सके।
    - `channels.telegram.groups` के साथ समूहों को अनुमति दें, या केवल विश्वसनीय समूह परिनियोजनों के लिए `groupPolicy: "open"` का उपयोग करें।
    - प्रेषक उपयोगकर्ता आईडी को `groupAllowFrom` में रखें। समूह और सुपरग्रुप आईडी `groupAllowFrom` में नहीं, बल्कि `channels.telegram.groups` में रखी जाती हैं।
    - `accountId` के आधार पर बाइंड करें, ताकि प्रत्येक बॉट अपने एजेंट तक रूट हो।

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

      // नियतात्मक रूटिंग: पहला मिलान प्रभावी होता है (सबसे विशिष्ट पहले)।
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // वैकल्पिक प्रति-पीयर ओवरराइड (उदाहरण: किसी विशिष्ट समूह को कार्य एजेंट के पास भेजें)।
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // डिफ़ॉल्ट रूप से बंद: एजेंट-से-एजेंट संदेश-प्रेषण को स्पष्ट रूप से सक्षम करके अनुमति-सूची में रखना आवश्यक है।
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
              // वैकल्पिक ओवरराइड। डिफ़ॉल्ट: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // वैकल्पिक ओवरराइड। डिफ़ॉल्ट: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp दैनिक कार्य + Telegram गहन कार्य">
    चैनल के आधार पर विभाजित करें: WhatsApp को तेज़ दैनिक एजेंट और Telegram को Opus एजेंट तक रूट करें।

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

    इन उदाहरणों में `accountId: "*"` का उपयोग किया गया है, ताकि बाद में खाते जोड़ने पर भी बाइंडिंग काम करती रहें। शेष को चैट पर रखते हुए किसी एक DM/समूह को Opus तक रूट करने के लिए, उस पीयर हेतु `match.peer` बाइंडिंग जोड़ें — पीयर मिलान हमेशा चैनल-व्यापी नियमों पर प्राथमिकता पाते हैं।

  </Tab>
  <Tab title="एक ही चैनल, एक पीयर Opus के लिए">
    WhatsApp को तेज़ एजेंट पर रखें, लेकिन एक DM को Opus तक रूट करें:

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

    पीयर बाइंडिंग हमेशा प्राथमिकता पाती हैं, इसलिए उन्हें चैनल-व्यापी नियम के ऊपर रखें।

  </Tab>
  <Tab title="WhatsApp समूह से बाइंड किया गया पारिवारिक एजेंट">
    उल्लेख गेटिंग और अधिक कड़ी टूल नीति के साथ, एक समर्पित पारिवारिक एजेंट को किसी एक WhatsApp समूह से बाइंड करें:

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

    टूल की अनुमति/अस्वीकृति सूचियाँ **टूल** हैं, Skills नहीं। यदि किसी Skill को बाइनरी चलाने की आवश्यकता है, तो सुनिश्चित करें कि `exec` अनुमत है और बाइनरी सैंडबॉक्स में मौजूद है। अधिक कड़ी गेटिंग के लिए, `agents.list[].groupChat.mentionPatterns` सेट करें और चैनल के लिए समूह अनुमति-सूचियाँ सक्षम रखें।

  </Tab>
</Tabs>

## प्रति-एजेंट सैंडबॉक्स और टूल कॉन्फ़िगरेशन

प्रत्येक एजेंट के अपने सैंडबॉक्स और टूल प्रतिबंध हो सकते हैं:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // व्यक्तिगत एजेंट के लिए कोई सैंडबॉक्स नहीं
        },
        // कोई टूल प्रतिबंध नहीं - सभी टूल उपलब्ध हैं
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // हमेशा सैंडबॉक्स में
          scope: "agent",  // प्रत्येक एजेंट के लिए एक कंटेनर
          docker: {
            // कंटेनर बनने के बाद वैकल्पिक एक-बार का सेटअप
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // केवल पढ़ने वाला टूल
          deny: ["exec", "write", "edit", "apply_patch"],    // अन्य को अस्वीकार करें
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`, `sandbox.docker` के अंतर्गत रहता है और कंटेनर बनाते समय एक बार चलता है। समाधान किया गया स्कोप `"shared"` होने पर प्रति-एजेंट `sandbox.docker.*` ओवरराइड अनदेखे किए जाते हैं।
</Note>

इससे आपको मिलता है:

- **सुरक्षा पृथक्करण**: अविश्वसनीय एजेंटों के लिए टूल प्रतिबंधित करें।
- **संसाधन नियंत्रण**: अन्य एजेंटों को होस्ट पर रखते हुए विशिष्ट एजेंटों को सैंडबॉक्स में रखें।
- **लचीली नीतियाँ**: प्रत्येक एजेंट के लिए अलग अनुमतियाँ।

<Note>
`tools.elevated` में वैश्विक गेट (`tools.elevated.enabled`/`allowFrom`) और प्रति-एजेंट गेट (`agents.list[].tools.elevated.enabled`/`allowFrom`), दोनों होते हैं। प्रति-एजेंट गेट वैश्विक गेट को केवल और प्रतिबंधित कर सकता है — उन्नत कमांड चलाने के लिए दोनों को किसी प्रेषक की अनुमति देनी होगी। समूह लक्ष्यीकरण के लिए, `agents.list[].groupChat.mentionPatterns` का उपयोग करें, ताकि @उल्लेख इच्छित एजेंट से स्पष्ट रूप से मैप हों।
</Note>

विस्तृत उदाहरणों के लिए [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) देखें।

## संबंधित

- [ACP एजेंट](/hi/tools/acp-agents) — बाहरी कोडिंग हार्नेस चलाना
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेश एजेंट तक कैसे रूट होते हैं
- [उपस्थिति](/hi/concepts/presence) — एजेंट की उपस्थिति और उपलब्धता
- [सत्र](/hi/concepts/session) — सत्र पृथक्करण और रूटिंग
- [उप-एजेंट](/hi/tools/subagents) — पृष्ठभूमि में एजेंट रन शुरू करना
