---
read_when:
    - ब्रॉडकास्ट समूह कॉन्फ़िगर करना
    - WhatsApp में बहु-एजेंट जवाबों की डिबगिंग
sidebarTitle: Broadcast groups
status: experimental
summary: कई एजेंटों को WhatsApp संदेश प्रसारित करें
title: प्रसारण समूह
x-i18n:
    generated_at: "2026-07-01T08:03:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**स्थिति:** प्रायोगिक। 2026.1.9 में जोड़ा गया।
</Note>

## अवलोकन

प्रसारण समूह कई एजेंटों को एक ही संदेश को साथ-साथ प्रोसेस करने और उसका उत्तर देने में सक्षम बनाते हैं। इससे आप विशिष्ट एजेंट टीम बना सकते हैं जो एक ही WhatsApp समूह या DM में मिलकर काम करती हैं — सब कुछ एक फोन नंबर का उपयोग करके।

वर्तमान दायरा: **केवल WhatsApp** (वेब चैनल)।

प्रसारण समूहों का मूल्यांकन चैनल allowlists और समूह सक्रियण नियमों के बाद किया जाता है। WhatsApp समूहों में, इसका मतलब है कि प्रसारण तब होते हैं जब OpenClaw सामान्य रूप से उत्तर देता (उदाहरण के लिए: मेंशन पर, आपकी समूह सेटिंग्स पर निर्भर करते हुए)।

लाइव WhatsApp QA लेन में `whatsapp-broadcast-group-fanout` शामिल है, जो सत्यापित करता है कि एक मेंशन किया गया समूह संदेश दो कॉन्फ़िगर किए गए एजेंटों से अलग-अलग दृश्यमान उत्तर उत्पन्न कर सकता है।

## उपयोग के मामले

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    कई एजेंटों को परमाण्विक, केंद्रित जिम्मेदारियों के साथ तैनात करें:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    प्रत्येक एजेंट उसी संदेश को प्रोसेस करता है और अपना विशिष्ट दृष्टिकोण प्रदान करता है।

  </Accordion>
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन

### मूल सेटअप

एक शीर्ष-स्तरीय `broadcast` अनुभाग जोड़ें (`bindings` के पास)। कुंजियां WhatsApp पीयर IDs हैं:

- समूह चैट: समूह JID (जैसे `120363403215116621@g.us`)
- DMs: E.164 फोन नंबर (जैसे `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**परिणाम:** जब OpenClaw इस चैट में उत्तर देता, तो यह तीनों एजेंटों को चलाएगा।

### प्रोसेसिंग रणनीति

एजेंट संदेशों को कैसे प्रोसेस करते हैं, इसे नियंत्रित करें:

<Tabs>
  <Tab title="parallel (default)">
    सभी एजेंट साथ-साथ प्रोसेस करते हैं:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    एजेंट क्रम में प्रोसेस करते हैं (एक पिछले के समाप्त होने की प्रतीक्षा करता है):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### पूरा उदाहरण

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## यह कैसे काम करता है

### संदेश प्रवाह

<Steps>
  <Step title="Incoming message arrives">
    एक WhatsApp समूह या DM संदेश आता है।
  </Step>
  <Step title="Route and admission">
    OpenClaw चैनल allowlists, समूह सक्रियण नियम और कॉन्फ़िगर किए गए ACP बाइंडिंग स्वामित्व लागू करता है।
  </Step>
  <Step title="Broadcast check">
    यदि कोई कॉन्फ़िगर किया गया ACP बाइंडिंग रूट का स्वामी नहीं है, तो OpenClaw जांचता है कि पीयर ID `broadcast` में है या नहीं।
  </Step>
  <Step title="If broadcast applies">
    - सभी सूचीबद्ध एजेंट संदेश को प्रोसेस करते हैं।
    - प्रत्येक एजेंट की अपनी सेशन कुंजी और अलग संदर्भ होता है।
    - एजेंट समानांतर (डिफ़ॉल्ट) या क्रमिक रूप से प्रोसेस करते हैं।

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw सामान्य रूट या रूटिंग के दौरान चुने गए कॉन्फ़िगर किए गए ACP सेशन रूट को डिस्पैच करता है।
  </Step>
</Steps>

<Note>
प्रसारण समूह चैनल allowlists या समूह सक्रियण नियमों (मेंशन/कमांड/आदि) को बाइपास नहीं करते। वे केवल यह बदलते हैं कि जब कोई संदेश प्रोसेसिंग के लिए पात्र होता है, तब _कौन से एजेंट चलते हैं_।
</Note>

### सेशन अलगाव

प्रसारण समूह में प्रत्येक एजेंट पूरी तरह अलग रखता है:

- **सेशन कुंजियां** (`agent:alfred:whatsapp:group:120363...` बनाम `agent:baerbel:whatsapp:group:120363...`)
- **बातचीत इतिहास** (एजेंट दूसरे एजेंटों के संदेश नहीं देखता)
- **वर्कस्पेस** (यदि कॉन्फ़िगर किया गया हो तो अलग सैंडबॉक्स)
- **टूल एक्सेस** (अलग अनुमति/अस्वीकृति सूचियां)
- **मेमोरी/संदर्भ** (अलग IDENTITY.md, SOUL.md, आदि)
- **समूह संदर्भ बफ़र** (संदर्भ के लिए उपयोग किए गए हाल के समूह संदेश) प्रति पीयर साझा होता है, इसलिए ट्रिगर होने पर सभी प्रसारण एजेंट वही संदर्भ देखते हैं

इससे प्रत्येक एजेंट के पास हो सकता है:

- अलग व्यक्तित्व
- अलग टूल एक्सेस (जैसे, केवल-पढ़ने वाला बनाम पढ़ने-लिखने वाला)
- अलग मॉडल (जैसे, opus बनाम sonnet)
- अलग Skills इंस्टॉल किए गए

### उदाहरण: अलग सेशन

समूह `120363403215116621@g.us` में एजेंटों `["alfred", "baerbel"]` के साथ:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## सर्वोत्तम अभ्यास

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
    प्रत्येक एजेंट को एकल, स्पष्ट जिम्मेदारी के साथ डिज़ाइन करें:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **अच्छा:** प्रत्येक एजेंट का एक काम है। ❌ **खराब:** एक सामान्य "dev-helper" एजेंट।

  </Accordion>
  <Accordion title="2. Use descriptive names">
    यह स्पष्ट करें कि प्रत्येक एजेंट क्या करता है:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Configure different tool access">
    एजेंटों को केवल वे टूल दें जिनकी उन्हें आवश्यकता है:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` केवल-पढ़ने वाला है। `fixer` पढ़ और लिख सकता है।

  </Accordion>
  <Accordion title="4. Monitor performance">
    कई एजेंटों के साथ, विचार करें:

    - गति के लिए `"strategy": "parallel"` (डिफ़ॉल्ट) का उपयोग करना
    - प्रसारण समूहों को 5-10 एजेंटों तक सीमित रखना
    - सरल एजेंटों के लिए तेज मॉडल का उपयोग करना

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    एजेंट स्वतंत्र रूप से विफल होते हैं। एक एजेंट की त्रुटि दूसरों को ब्लॉक नहीं करती:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## संगतता

### प्रदाता

प्रसारण समूह वर्तमान में इनके साथ काम करते हैं:

- ✅ WhatsApp (लागू किया गया)
- 🚧 Telegram (योजनाबद्ध)
- 🚧 Discord (योजनाबद्ध)
- 🚧 Slack (योजनाबद्ध)

### रूटिंग

प्रसारण समूह मौजूदा रूटिंग के साथ काम करते हैं:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: केवल alfred उत्तर देता है (सामान्य रूटिंग)।
- `GROUP_B`: agent1 और agent2 उत्तर देते हैं (प्रसारण)।

<Note>
**प्राथमिकता:** `broadcast` सामान्य रूट बाइंडिंग पर प्राथमिकता लेता है। कॉन्फ़िगर किए गए ACP बाइंडिंग (`bindings[].type="acp"`) विशेष होते हैं: जब कोई मेल खाता है, तो OpenClaw फैन-आउट प्रसारण के बजाय कॉन्फ़िगर किए गए ACP सेशन पर डिस्पैच करता है।
</Note>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Agents not responding">
    **जांचें:**

    1. एजेंट IDs `agents.list` में मौजूद हैं।
    2. पीयर ID प्रारूप सही है (जैसे, `120363403215116621@g.us`)।
    3. एजेंट deny lists में नहीं हैं।

    **डिबग करें:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **कारण:** पीयर ID सामान्य रूट बाइंडिंग में हो सकती है लेकिन `broadcast` में नहीं, या यह किसी विशेष कॉन्फ़िगर किए गए ACP बाइंडिंग से मेल खा सकती है।

    **सुधार:** सामान्य route-bound पीयर्स को प्रसारण कॉन्फ़िग में जोड़ें, या यदि फैन-आउट प्रसारण चाहिए तो कॉन्फ़िगर किए गए ACP बाइंडिंग को हटाएं/बदलें।

  </Accordion>
  <Accordion title="Performance issues">
    यदि कई एजेंटों के साथ धीमा हो:

    - प्रति समूह एजेंटों की संख्या कम करें।
    - हल्के मॉडल का उपयोग करें (opus के बजाय sonnet)।
    - सैंडबॉक्स स्टार्टअप समय जांचें।

  </Accordion>
</AccordionGroup>

## उदाहरण

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **उपयोगकर्ता भेजता है:** कोड स्निपेट।

    **उत्तर:**

    - code-formatter: "इंडेंटेशन ठीक किया और टाइप हिंट जोड़े"
    - security-scanner: "⚠️ पंक्ति 12 में SQL इंजेक्शन भेद्यता"
    - test-coverage: "कवरेज 45% है, त्रुटि मामलों के लिए टेस्ट गायब हैं"
    - docs-checker: "फ़ंक्शन `process_data` के लिए docstring गायब है"

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API संदर्भ

### कॉन्फ़िग स्कीमा

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### फ़ील्ड

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  एजेंटों को कैसे प्रोसेस करना है। `parallel` सभी एजेंटों को एक साथ चलाता है; `sequential` उन्हें array क्रम में चलाता है।
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp समूह JID, E.164 नंबर, या अन्य peer ID। मान उन एजेंट ID की array है जिन्हें संदेश प्रोसेस करने चाहिए।
</ParamField>

## सीमाएँ

1. **अधिकतम एजेंट:** कोई कठोर सीमा नहीं, लेकिन 10+ एजेंट धीमे हो सकते हैं।
2. **साझा context:** एजेंट एक-दूसरे की प्रतिक्रियाएँ नहीं देखते (डिजाइन के अनुसार)।
3. **संदेश क्रम:** समानांतर प्रतिक्रियाएँ किसी भी क्रम में आ सकती हैं।
4. **रेट सीमाएँ:** सभी एजेंट WhatsApp रेट सीमाओं में गिने जाते हैं।

## भविष्य के सुधार

नियोजित सुविधाएँ:

- [ ] साझा context मोड (एजेंट एक-दूसरे की प्रतिक्रियाएँ देखते हैं)
- [ ] एजेंट समन्वय (एजेंट एक-दूसरे को संकेत दे सकते हैं)
- [ ] गतिशील एजेंट चयन (संदेश सामग्री के आधार पर एजेंट चुनें)
- [ ] एजेंट प्राथमिकताएँ (कुछ एजेंट दूसरों से पहले प्रतिक्रिया देते हैं)

## संबंधित

- [चैनल रूटिंग](/hi/channels/channel-routing)
- [समूह](/hi/channels/groups)
- [Multi-agent sandbox tools](/hi/tools/multi-agent-sandbox-tools)
- [Pairing](/hi/channels/pairing)
- [Session management](/hi/concepts/session)
