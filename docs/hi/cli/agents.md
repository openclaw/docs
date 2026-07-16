---
read_when:
    - आप कई पृथक एजेंट चाहते हैं (वर्कस्पेस + रूटिंग + प्रमाणीकरण)
summary: '`openclaw agents` के लिए CLI संदर्भ (सूची/जोड़ना/हटाना/बाइंडिंग/बाइंड करना/अनबाइंड करना/पहचान सेट करना)'
title: एजेंट्स
x-i18n:
    generated_at: "2026-07-16T13:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

पृथक एजेंटों (वर्कस्पेस + प्रमाणीकरण + रूटिंग) का प्रबंधन करें। बिना किसी उपकमांड के `openclaw agents` चलाना `openclaw agents list` के समान है।

संबंधित:

- [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent)
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)
- [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config): skill दृश्यता कॉन्फ़िगरेशन।

## उदाहरण

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## कमांड सतह

### `agents list`

विकल्प: `--json`, `--bindings` (केवल प्रति-एजेंट गणना/सारांश ही नहीं, बल्कि पूर्ण रूटिंग नियम शामिल करें)।

### `agents add [name]`

विकल्प: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (दोहराया जा सकता है), `--non-interactive`, `--json`।

- कोई भी स्पष्ट जोड़ने वाला फ़्लैग देने पर कमांड गैर-इंटरैक्टिव पथ पर चला जाता है।
- गैर-इंटरैक्टिव मोड के लिए एजेंट का नाम और `--workspace` दोनों आवश्यक हैं।
- `main` आरक्षित है और इसे नए एजेंट आईडी के रूप में उपयोग नहीं किया जा सकता।
- इंटरैक्टिव मोड केवल पोर्टेबल स्थिर क्रेडेंशियल (`api_key` और स्थिर `token` प्रोफ़ाइल) कॉपी करके प्रमाणीकरण को आरंभिक डेटा देता है, जब तक कि कोई क्रेडेंशियल `copyToAgents: false` के साथ इससे बाहर न हो जाए; OAuth रीफ़्रेश-टोकन प्रोफ़ाइल तब तक कॉपी नहीं की जातीं, जब तक कोई प्रदाता `copyToAgents: true` के साथ इसमें शामिल न हो। कॉपी न होने पर OAuth केवल वास्तविक `main` एजेंट स्टोर से रीड-थ्रू इनहेरिटेंस के माध्यम से उपलब्ध रहता है। यदि कॉन्फ़िगर किया गया डिफ़ॉल्ट एजेंट `main` नहीं है, तो नए एजेंट पर OAuth प्रोफ़ाइल के लिए अलग से साइन इन करें।

### `agents bindings`

विकल्प: `--agent <id>`, `--json`।

### `agents bind`

विकल्प: `--agent <id>` (डिफ़ॉल्ट रूप से वर्तमान डिफ़ॉल्ट एजेंट), `--bind <channel[:accountId]>` (दोहराया जा सकता है), `--json`।

### `agents unbind`

विकल्प: `--agent <id>` (डिफ़ॉल्ट रूप से वर्तमान डिफ़ॉल्ट एजेंट), `--bind <channel[:accountId]>` (दोहराया जा सकता है), `--all`, `--json`। यह या तो `--all` या एक अथवा अधिक `--bind` मान स्वीकार करता है, दोनों नहीं।

### `agents set-identity`

विकल्प: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`। नीचे [पहचान सेट करें](#set-identity) देखें।

### `agents delete <id>`

विकल्प: `--force`, `--json`।

- `main` को हटाया नहीं जा सकता।
- `--force` के बिना इंटरैक्टिव पुष्टि आवश्यक है (गैर-TTY सत्र में विफल होता है; `--force` के साथ फिर से चलाएँ)।
- वर्कस्पेस, एजेंट स्थिति और सत्र ट्रांसक्रिप्ट निर्देशिकाएँ स्थायी रूप से हटाने के बजाय ट्रैश में भेजी जाती हैं।
- जब Gateway तक पहुँचा जा सकता है, तो हटाने की प्रक्रिया Gateway के माध्यम से रूट होती है, ताकि कॉन्फ़िगरेशन और सत्र-स्टोर की सफ़ाई रनटाइम ट्रैफ़िक वाले ही राइटर का उपयोग करे। यदि Gateway तक नहीं पहुँचा जा सकता, तो CLI ऑफ़लाइन स्थानीय पथ का उपयोग करता है।
- यदि किसी अन्य एजेंट का वर्कस्पेस समान पथ पर है, इस वर्कस्पेस के भीतर है या इस वर्कस्पेस को समाहित करता है, तो वर्कस्पेस बनाए रखा जाता है और `--json`, `workspaceRetained`, `workspaceRetainedReason` तथा `workspaceSharedWith` की रिपोर्ट करता है।

## रूटिंग बाइंडिंग

इनबाउंड चैनल ट्रैफ़िक को किसी विशिष्ट एजेंट से बाँधने के लिए रूटिंग बाइंडिंग का उपयोग करें।

यदि आप प्रत्येक एजेंट के लिए अलग-अलग दिखाई देने वाली skills भी चाहते हैं, तो `openclaw.json` में `agents.defaults.skills` और `agents.list[].skills` कॉन्फ़िगर करें। [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config) और [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agentsdefaultsskills) देखें।

बाइंडिंग की सूची दिखाएँ:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

बाइंडिंग जोड़ें:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

एजेंट बनाते समय भी बाइंडिंग जोड़ी जा सकती हैं:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

यदि आप `accountId` (`--bind <channel>`) छोड़ देते हैं, तो OpenClaw इसे Plugin सेटअप हुक, बाध्य खाता बाइंडिंग या चैनल की कॉन्फ़िगर की गई खाता संख्या से निर्धारित करता है।

यदि आप `bind` या `unbind` के लिए `--agent` छोड़ देते हैं, तो OpenClaw वर्तमान डिफ़ॉल्ट एजेंट को लक्षित करता है।

### `--bind` प्रारूप

| प्रारूप                       | अर्थ                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | चैनल के सभी खातों से मिलान करें।                                                                 |
| `--bind <channel>:<account>` | एक खाते से मिलान करें।                                                                                 |
| `--bind <channel>`           | केवल डिफ़ॉल्ट खाते से मिलान करें, जब तक कि CLI किसी Plugin-विशिष्ट खाता-स्कोप को सुरक्षित रूप से निर्धारित न कर सके। |

### बाइंडिंग स्कोप का व्यवहार

- `accountId` के बिना संग्रहीत बाइंडिंग केवल चैनल के डिफ़ॉल्ट खाते से मिलान करती है।
- `accountId: "*"` पूरे चैनल का फ़ॉलबैक (सभी खाते) है और किसी स्पष्ट खाता बाइंडिंग से कम विशिष्ट है।
- यदि उसी एजेंट के पास पहले से `accountId` के बिना मेल खाने वाली चैनल बाइंडिंग है और बाद में आप किसी स्पष्ट या निर्धारित `accountId` के साथ बाइंड करते हैं, तो OpenClaw डुप्लिकेट जोड़ने के बजाय उसी मौजूदा बाइंडिंग को वहीं अपग्रेड कर देता है।

उदाहरण:

```bash
# चैनल के सभी खातों से मिलान करें
openclaw agents bind --agent work --bind telegram:*

# किसी विशिष्ट खाते से मिलान करें
openclaw agents bind --agent work --bind telegram:ops

# प्रारंभिक केवल-चैनल बाइंडिंग
openclaw agents bind --agent work --bind telegram

# बाद में खाता-स्कोप वाली बाइंडिंग में अपग्रेड करें
openclaw agents bind --agent work --bind telegram:alerts
```

अपग्रेड के बाद उस बाइंडिंग की रूटिंग `telegram:alerts` तक सीमित होती है। यदि आप डिफ़ॉल्ट-खाता रूटिंग भी चाहते हैं, तो उसे स्पष्ट रूप से जोड़ें (उदाहरण के लिए `--bind telegram:default`)।

बाइंडिंग हटाएँ:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## पहचान फ़ाइलें

प्रत्येक एजेंट वर्कस्पेस में वर्कस्पेस रूट पर एक `IDENTITY.md` शामिल हो सकता है:

- उदाहरण पथ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` वर्कस्पेस रूट (या किसी स्पष्ट `--identity-file`) से पढ़ता है।

अवतार पथ वर्कस्पेस रूट के सापेक्ष निर्धारित होते हैं और सिमलिंक के माध्यम से भी उससे बाहर नहीं जा सकते।

## पहचान सेट करें

`set-identity`, `agents.list[].identity` में ये फ़ील्ड लिखता है: `name`, `theme`, `emoji`, `avatar` (वर्कस्पेस-सापेक्ष पथ, http(s) URL या डेटा URI)।

- `--agent` या `--workspace` लक्ष्य एजेंट चुनता है। यदि `--workspace` एक से अधिक एजेंट से मेल खाता है, तो कमांड विफल हो जाता है और आपसे `--agent` देने को कहता है।
- स्थानीय वर्कस्पेस-सापेक्ष अवतार छवि फ़ाइलें 2 MB तक सीमित हैं। HTTP(S) URL और `data:` URI की जाँच स्थानीय फ़ाइल-आकार सीमा के विरुद्ध नहीं की जाती।
- जब कोई स्पष्ट पहचान फ़ील्ड नहीं दिया जाता, तो कमांड `IDENTITY.md` से पहचान डेटा पढ़ता है।

`IDENTITY.md` से लोड करें:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

फ़ील्ड को स्पष्ट रूप से ओवरराइड करें:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

कॉन्फ़िगरेशन नमूना:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent)
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)
