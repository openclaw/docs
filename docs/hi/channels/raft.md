---
read_when:
    - आप OpenClaw को Raft वर्कस्पेस से कनेक्ट करना चाहते हैं
    - आप एक Raft बाहरी एजेंट कॉन्फ़िगर कर रहे हैं
    - आप Raft वेक डिलीवरी को डीबग कर रहे हैं
sidebarTitle: Raft
summary: Raft CLI वेक ब्रिज के माध्यम से Raft बाहरी एजेंट समर्थन
title: Raft
x-i18n:
    generated_at: "2026-07-16T13:24:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft स्थानीय Raft CLI के माध्यम से OpenClaw एजेंट को Raft External Agent से जोड़ता है। Raft Gateway को प्रमाणित वेक संकेत भेजता है; इसके बाद एजेंट संदेश जाँचने और भेजने के लिए Raft CLI का उपयोग करता है। केवल सीधे चैट के लिए (समूहों के लिए नहीं)।

## इंस्टॉल करें

Raft एक आधिकारिक बाहरी Plugin है। इसे Gateway होस्ट पर इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

विवरण: [Plugins](/hi/tools/plugin)

## पूर्वापेक्षाएँ

- External Agent वाला एक Raft कार्यस्थान।
- OpenClaw Gateway वाले उसी होस्ट पर, सेवा के
  `PATH` में इंस्टॉल किया गया Raft CLI।
- एक Raft CLI प्रोफ़ाइल, जिसमें पहले से साइन इन किया गया हो और जो उस
  External Agent से संबद्ध हो।

Plugin Raft क्रेडेंशियल संग्रहीत नहीं करता; Raft CLI उस प्रमाणीकरण को अपनी प्रोफ़ाइल में रखता है।

## कॉन्फ़िगर करें

कॉन्फ़िगरेशन में प्रोफ़ाइल सेट करें:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

डिफ़ॉल्ट खाते के लिए, इसके बजाय Gateway परिवेश में `RAFT_PROFILE` सेट किया जा सकता है:

```bash
RAFT_PROFILE=openclaw
```

जब एक Gateway एक से अधिक Raft External Agent से जुड़ता है, तो नामित खाते का उपयोग करें:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

इंटरैक्टिव सेटअप उसी प्रोफ़ाइल को रिकॉर्ड करता है:

```bash
openclaw channels add --channel raft
```

## यह कैसे काम करता है

Gateway शुरू होने पर Plugin:

1. एक अस्थायी पोर्ट पर केवल लूपबैक के लिए HTTP वेक एंडपॉइंट खोलता है।
2. उस एंडपॉइंट और प्रति-प्रक्रिया टोकन के साथ `raft --profile <profile> agent bridge` शुरू करता है।
3. स्थानीय ब्रिज से केवल प्रमाणित, सामग्री-रहित और रीप्ले पहचान वाले वेक संकेत स्वीकार करता है।
4. प्रत्येक वेक पेलोड में `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id`, या `id` में से एक को आवश्यक बनाता है।
5. ब्रिज इवेंट आईडी के आधार पर दोबारा किए गए वेक वितरणों को 24 घंटे तक डुप्लिकेट-मुक्त करता है,
   जिसमें Gateway के पुनः आरंभ भी शामिल हैं।
6. वर्तमान ब्रिज के लिए एक स्थिर रनटाइम सत्र और Raft CLI प्रोटोकॉल के लिए एक खाली
   गतिविधि-निकासी बैच लौटाता है।
7. प्रत्येक स्वीकृत वेक के लिए एक क्रमबद्ध OpenClaw एजेंट टर्न शुरू करता है।

Raft वितरण के पुनः प्रयासों और पुनः कनेक्शन का स्वामित्व ब्रिज के पास होता है। OpenClaw टर्न को केवल वेक सूचना मिलती है, कॉपी किया गया Raft संदेश निकाय नहीं। यह लंबित संदेश पढ़ने और अपनी प्रतिक्रिया भेजने के लिए CLI का उपयोग करता है:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft पुश-संदेश परिवहन नहीं है। OpenClaw मॉडल का अंतिम टेक्स्ट ब्रिज के माध्यम से स्वचालित रूप से वापस नहीं भेजता, इसलिए वेक को संसाधित करने के बाद एजेंट को Raft CLI का उपयोग करना आवश्यक है।
</Note>

## सत्यापित करें

जाँचें कि OpenClaw CLI को खोज सकता है और प्रोफ़ाइल कॉन्फ़िगर की गई है:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

फिर Raft External Agent को एक संदेश भेजें। Gateway लॉग में पहले Raft ब्रिज का शुरू होना और उसके बाद इनबाउंड वेक दिखाई देना चाहिए। एजेंट को अपने लंबित संदेश जाँचने के लिए कॉन्फ़िगर की गई Raft प्रोफ़ाइल का उपयोग करना चाहिए।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Raft CLI उपलब्ध नहीं है">
    Gateway होस्ट पर Raft CLI इंस्टॉल करें और सेवा के `PATH` में `raft` उपलब्ध कराएँ।
    इसे `raft --help` से सत्यापित करें, फिर Gateway को पुनः आरंभ करें।
  </Accordion>
  <Accordion title="ब्रिज तुरंत बंद हो जाता है">
    सत्यापित करें कि कॉन्फ़िगर की गई प्रोफ़ाइल में साइन इन किया गया है और वह अपेक्षित
    Raft External Agent से संबंधित है। CLI निदान देखने के लिए सीधे `raft --profile <profile> agent bridge` चलाएँ।
  </Accordion>
  <Accordion title="वेक आता है लेकिन कोई Raft प्रतिक्रिया नहीं भेजी जाती">
    जब एजेंट Raft CLI का उपयोग नहीं करता, तो यह अपेक्षित व्यवहार है। वेक ब्रिज
    संदेश निकाय या स्वचालित अंतिम प्रतिक्रियाएँ नहीं पहुँचाता। एजेंट की टूल नीति जाँचें
    और सुनिश्चित करें कि वह `raft --profile <profile>
    message check` और `message send` चला सकता है।
  </Accordion>
</AccordionGroup>

## संदर्भ

- [Raft](https://raft.build/)
- [Raft दस्तावेज़](https://docs.raft.build/welcome/)
- [Hermes Raft एकीकरण](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
