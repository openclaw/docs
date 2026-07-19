---
read_when:
    - ब्रॉडकास्ट समूह कॉन्फ़िगर करना
    - WhatsApp में मल्टी-एजेंट उत्तरों की डीबगिंग
sidebarTitle: Broadcast groups
status: experimental
summary: एक WhatsApp संदेश कई एजेंटों को प्रसारित करें
title: प्रसारण समूह
x-i18n:
    generated_at: "2026-07-19T07:56:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**स्थिति:** प्रयोगात्मक। 2026.1.9 में जोड़ा गया। केवल WhatsApp (वेब चैनल)।
</Note>

## अवलोकन

ब्रॉडकास्ट समूह एक ही आने वाले संदेश पर **कई एजेंट** चलाते हैं। प्रत्येक एजेंट संदेश को अपने अलग-थलग सत्र में संसाधित करता है और अपना उत्तर पोस्ट करता है, इसलिए एक WhatsApp नंबर एक ही समूह चैट या DM में विशिष्ट एजेंटों की टीम होस्ट कर सकता है।

ब्रॉडकास्ट समूहों का मूल्यांकन चैनल अनुमति-सूचियों और समूह सक्रियण नियमों के बाद किया जाता है। WhatsApp समूहों में ब्रॉडकास्ट तब होते हैं, जब OpenClaw सामान्यतः उत्तर देता (उदाहरण के लिए: आपके समूह की सेटिंग के आधार पर उल्लेख किए जाने पर)। वे केवल यह बदलते हैं कि **कौन-से एजेंट चलते हैं**, यह कभी नहीं कि कोई संदेश संसाधन के योग्य है या नहीं।

लाइव WhatsApp QA लेन में `whatsapp-broadcast-group-fanout` शामिल है, जो सत्यापित करता है कि समूह में उल्लेख वाला एक संदेश दो कॉन्फ़िगर किए गए एजेंटों से अलग-अलग दृश्यमान उत्तर उत्पन्न कर सकता है।

## कॉन्फ़िगरेशन

### मूल सेटअप

एक शीर्ष-स्तरीय `broadcast` अनुभाग (`bindings` के पास) जोड़ें। कुंजियाँ WhatsApp पीयर आईडी हैं और मान एजेंट आईडी की सरणियाँ हैं:

- समूह चैट: समूह JID (उदा. `120363403215116621@g.us`)
- DM: प्रेषक का E.164 फ़ोन नंबर (उदा. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**परिणाम:** जब OpenClaw इस चैट में उत्तर देता, तो यह तीनों एजेंट चलाता है।

सूचीबद्ध प्रत्येक एजेंट आईडी का `agents.list` में मौजूद होना आवश्यक है: कॉन्फ़िगरेशन सत्यापन अज्ञात आईडी की सूचना देता है और रनटाइम उन्हें `Broadcast agent <id> not found in agents.list; skipping` चेतावनी के साथ छोड़ देता है।

### संसाधन कार्यनीति

`broadcast.strategy` निर्धारित करता है कि एजेंट संदेश को कैसे संसाधित करते हैं:

| कार्यनीति             | व्यवहार                                                              |
| -------------------- | --------------------------------------------------------------------- |
| `parallel` (डिफ़ॉल्ट) | सभी एजेंट एक साथ संसाधित करते हैं; उत्तर किसी भी क्रम में आते हैं।       |
| `sequential`         | एजेंट सरणी के क्रम में संसाधित करते हैं; प्रत्येक पिछले एजेंट के पूरा होने की प्रतीक्षा करता है। |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### संपूर्ण उदाहरण

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
  <Step title="आने वाला संदेश पहुँचता है">
    WhatsApp समूह या DM संदेश पहुँचता है।
  </Step>
  <Step title="रूटिंग और प्रवेश">
    OpenClaw चैनल अनुमति-सूचियाँ, समूह सक्रियण नियम और कॉन्फ़िगर किए गए ACP बाइंडिंग स्वामित्व लागू करता है।
  </Step>
  <Step title="ब्रॉडकास्ट जाँच">
    यदि कोई कॉन्फ़िगर की गई ACP बाइंडिंग रूट की स्वामी नहीं है, तो OpenClaw जाँचता है कि पीयर आईडी `broadcast` में है या नहीं।
  </Step>
  <Step title="यदि ब्रॉडकास्ट लागू होता है">
    - सूचीबद्ध सभी एजेंट संदेश संसाधित करते हैं।
    - प्रत्येक एजेंट की अपनी सत्र कुंजी और अलग-थलग संदर्भ होता है।
    - एजेंट समानांतर (डिफ़ॉल्ट) या क्रमिक रूप से संसाधित करते हैं।
    - फैन-आउट से पहले ऑडियो अटैचमेंट का एक बार लिप्यंतरण किया जाता है, इसलिए अलग-अलग STT कॉल करने के बजाय एजेंट एक ही प्रतिलेख साझा करते हैं।

  </Step>
  <Step title="यदि ब्रॉडकास्ट लागू नहीं होता है">
    OpenClaw सामान्य रूट या रूटिंग के दौरान चुने गए कॉन्फ़िगर किए गए ACP सत्र रूट को प्रेषित करता है।
  </Step>
</Steps>

<Note>
ब्रॉडकास्ट समूह चैनल अनुमति-सूचियों या समूह सक्रियण नियमों (उल्लेख/कमांड/आदि) को दरकिनार नहीं करते। जब कोई संदेश संसाधन के योग्य होता है, तब वे केवल यह बदलते हैं कि _कौन-से एजेंट चलते हैं_।
</Note>

### सत्र पृथक्करण

ब्रॉडकास्ट समूह का प्रत्येक एजेंट निम्न को पूरी तरह अलग रखता है:

- **सत्र कुंजियाँ** (`agent:alfred:whatsapp:group:120363...` बनाम `agent:baerbel:whatsapp:group:120363...`)
- **वार्तालाप इतिहास** (एक एजेंट अन्य एजेंटों के उत्तर नहीं देखता)
- **कार्यस्थान** (कॉन्फ़िगर किए जाने पर अलग सैंडबॉक्स)
- **टूल एक्सेस** (अलग-अलग अनुमति/अस्वीकृति सूचियाँ)
- **मेमोरी/संदर्भ** (अलग `IDENTITY.md`, `SOUL.md`, आदि)

एक अपवाद जानबूझकर साझा किया जाता है: **समूह संदर्भ बफ़र** (संदर्भ के लिए उपयोग किए गए हाल के समूह संदेश) प्रत्येक पीयर के लिए साझा होता है, इसलिए ट्रिगर होने पर सभी ब्रॉडकास्ट एजेंट समान संदर्भ देखते हैं। फैन-आउट पूरा होने के बाद इसे एक बार साफ़ किया जाता है।

इससे प्रत्येक एजेंट के अलग व्यक्तित्व, मॉडल, कौशल और टूल एक्सेस हो सकते हैं (उदाहरण के लिए केवल-पठन बनाम पठन-लेखन)।

### उदाहरण: अलग-थलग सत्र

`120363403215116621@g.us` समूह में `["alfred", "baerbel"]` एजेंटों के साथ:

<Tabs>
  <Tab title="Alfred का संदर्भ">
    ```text
    सत्र: agent:alfred:whatsapp:group:120363403215116621@g.us
    इतिहास: [उपयोगकर्ता संदेश, alfred के पिछले उत्तर]
    कार्यस्थान: ~/openclaw-alfred/
    टूल: पढ़ना, लिखना, निष्पादित करना
    ```
  </Tab>
  <Tab title="Baerbel का संदर्भ">
    ```text
    सत्र: agent:baerbel:whatsapp:group:120363403215116621@g.us
    इतिहास: [उपयोगकर्ता संदेश, baerbel के पिछले उत्तर]
    कार्यस्थान: ~/openclaw-baerbel/
    टूल: केवल पढ़ना
    ```
  </Tab>
</Tabs>

## उपयोग के मामले

- **विशिष्ट एजेंट टीमें**: एक डेवलपमेंट समूह, जहाँ `code-reviewer`, `security-auditor`, `test-generator` और `docs-checker` प्रत्येक एक ही संदेश का अपने दृष्टिकोण से उत्तर देते हैं।
- **बहुभाषी सहायता**: `support-en`, `support-de`, `support-es` वाली एक सहायता चैट, जिसमें वे अपनी-अपनी भाषाओं में उत्तर देते हैं।
- **गुणवत्ता आश्वासन**: `support-agent` उत्तर देता है, जबकि `qa-agent` समीक्षा करता है और केवल समस्याएँ मिलने पर उत्तर देता है।
- **कार्य स्वचालन**: `task-tracker`, `time-logger` और `report-generator` सभी समान स्थिति अपडेट का उपयोग करते हैं।

## सर्वोत्तम अभ्यास

<AccordionGroup>
  <Accordion title="1. एजेंटों को केंद्रित रखें">
    प्रत्येक एजेंट को एक सामान्य "dev-helper" एजेंट के बजाय एक स्पष्ट जिम्मेदारी (`formatter`, `linter`, `tester`) दें।
  </Accordion>
  <Accordion title="2. वर्णनात्मक आईडी और नामों का उपयोग करें">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. अलग-अलग टूल एक्सेस कॉन्फ़िगर करें">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` केवल-पठन है। `fixer` पढ़ और लिख सकता है।

  </Accordion>
  <Accordion title="4. प्रदर्शन की निगरानी करें">
    कई एजेंटों के साथ, `"strategy": "parallel"` (डिफ़ॉल्ट) को प्राथमिकता दें, ब्रॉडकास्ट समूहों को कुछ ही एजेंटों तक सीमित रखें और सरल एजेंटों के लिए तेज़ मॉडल का उपयोग करें।
  </Accordion>
  <Accordion title="5. विफलताएँ अलग-थलग रहती हैं">
    एजेंट स्वतंत्र रूप से विफल होते हैं। एक एजेंट की त्रुटि लॉग की जाती है (`Broadcast agent <id> failed: ...`) और अन्य एजेंट अवरुद्ध नहीं होते।
  </Accordion>
</AccordionGroup>

## संगतता

### प्रदाता

ब्रॉडकास्ट समूह वर्तमान में केवल WhatsApp (वेब चैनल) के लिए लागू किए गए हैं। अन्य चैनल `broadcast` कॉन्फ़िगरेशन की अनदेखी करते हैं।

### रूटिंग

ब्रॉडकास्ट समूह मौजूदा रूटिंग के साथ काम करते हैं:

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
- `GROUP_B`: agent1 और agent2 उत्तर देते हैं (ब्रॉडकास्ट)।

<Note>
**प्राथमिकता:** `broadcast` सामान्य रूट बाइंडिंग पर प्राथमिकता लेता है। कॉन्फ़िगर की गई ACP बाइंडिंग (`bindings[].type="acp"`) विशिष्ट होती हैं: जब कोई बाइंडिंग मेल खाती है, तो OpenClaw फैन-आउट ब्रॉडकास्ट के बजाय कॉन्फ़िगर किए गए ACP सत्र को प्रेषित करता है।
</Note>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="एजेंट उत्तर नहीं दे रहे हैं">
    **जाँचें:**

    1. एजेंट आईडी `agents.list` में मौजूद हैं (कॉन्फ़िगरेशन सत्यापन अज्ञात आईडी अस्वीकार करता है)।
    2. पीयर आईडी प्रारूप सही है (समूह JID जैसे `120363403215116621@g.us`, या DM के लिए E.164 जैसे `+15551234567`)।
    3. संदेश सामान्य गेटिंग से गुज़रा है (उल्लेख/सक्रियण नियम अभी भी लागू होते हैं)।

    **डीबग:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    सफल फैन-आउट `Broadcasting message to <n> agents (<strategy>)` लॉग करता है।

  </Accordion>
  <Accordion title="केवल एक एजेंट उत्तर दे रहा है">
    **कारण:** पीयर आईडी सामान्य रूट बाइंडिंग में हो सकती है, लेकिन `broadcast` में नहीं, या वह किसी विशिष्ट कॉन्फ़िगर की गई ACP बाइंडिंग से मेल खा सकती है।

    **समाधान:** सामान्य रूट से बंधे पीयर को ब्रॉडकास्ट कॉन्फ़िगरेशन में जोड़ें, या यदि फैन-आउट ब्रॉडकास्ट चाहिए तो कॉन्फ़िगर की गई ACP बाइंडिंग को हटाएँ/बदलें।

  </Accordion>
  <Accordion title="प्रदर्शन संबंधी समस्याएँ">
    यदि कई एजेंटों के साथ धीमापन हो: प्रत्येक समूह में एजेंटों की संख्या घटाएँ, हल्के मॉडल का उपयोग करें और सैंडबॉक्स आरंभ होने का समय जाँचें।
  </Accordion>
</AccordionGroup>

## उदाहरण

<AccordionGroup>
  <Accordion title="उदाहरण 1: कोड समीक्षा टीम">
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

    समूह में एक कोड स्निपेट चार उत्तर उत्पन्न करता है: फ़ॉर्मेटिंग सुधार, एक सुरक्षा निष्कर्ष, एक कवरेज अंतर और दस्तावेज़ों से संबंधित एक छोटी त्रुटि।

  </Accordion>
  <Accordion title="उदाहरण 2: बहुभाषी पाइपलाइन">
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

### कॉन्फ़िगरेशन स्कीमा

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
  एजेंटों को कैसे संसाधित करना है। `parallel` सभी एजेंटों को एक साथ चलाता है; `sequential` उन्हें सरणी के क्रम में चलाता है।
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp समूह JID या E.164 फ़ोन नंबर। मान उन एजेंट आईडी की सरणी है, जिन्हें उस पीयर से आने वाले सभी संदेश संसाधित करने चाहिए।
</ParamField>

## सीमाएँ

1. **अधिकतम एजेंट:** कोई निश्चित सीमा नहीं है, लेकिन कई एजेंट (10+) धीमे हो सकते हैं।
2. **साझा संदर्भ:** एजेंट एक-दूसरे की प्रतिक्रियाएँ नहीं देखते हैं (यह डिज़ाइन के अनुसार है)।
3. **संदेश क्रम:** समानांतर प्रतिक्रियाएँ किसी भी क्रम में आ सकती हैं।
4. **दर सीमाएँ:** सभी उत्तर एक WhatsApp खाते से आते हैं, इसलिए प्रत्येक एजेंट का उत्तर समान WhatsApp दर सीमाओं में गिना जाता है।

## संबंधित

- [चैनल रूटिंग](/hi/channels/channel-routing)
- [समूह](/hi/channels/groups)
- [मल्टी-एजेंट सैंडबॉक्स टूल](/hi/tools/multi-agent-sandbox-tools)
- [पेयरिंग](/hi/channels/pairing)
- [सेशन प्रबंधन](/hi/concepts/session)
