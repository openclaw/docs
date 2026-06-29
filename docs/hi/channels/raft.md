---
read_when:
    - आप OpenClaw को Raft वर्कस्पेस से कनेक्ट करना चाहते हैं
    - आप एक Raft बाहरी एजेंट कॉन्फ़िगर कर रहे हैं
    - आप Raft वेक डिलीवरी को डिबग कर रहे हैं
sidebarTitle: Raft
summary: Raft CLI वेक ब्रिज के माध्यम से Raft बाहरी एजेंट समर्थन
title: बेड़ा
x-i18n:
    generated_at: "2026-06-28T22:39:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft समर्थन किसी OpenClaw एजेंट को स्थानीय Raft CLI के माध्यम से Raft बाहरी एजेंट से जोड़ता है। Raft Gateway को प्रमाणित वेक संकेत भेजता है। फिर एजेंट संदेशों की जांच करने और भेजने के लिए Raft CLI का उपयोग करता है।

## इंस्टॉल करें

Raft एक आधिकारिक बाहरी Plugin है। इसे Gateway होस्ट पर इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

विवरण: [Plugins](/hi/tools/plugin)

## आवश्यकताएँ

- एक Raft वर्कस्पेस जिसमें बाहरी एजेंट हो।
- OpenClaw Gateway वाले उसी होस्ट पर Raft CLI इंस्टॉल हो।
- एक Raft CLI प्रोफ़ाइल जो पहले से साइन इन हो और उस बाहरी एजेंट से जुड़ी हो।

Plugin Raft क्रेडेंशियल संग्रहीत नहीं करता। Raft CLI उस प्रमाणीकरण को अपनी
प्रोफ़ाइल में रखता है।

## कॉन्फ़िगर करें

कॉन्फ़िग में प्रोफ़ाइल सेट करें:

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

डिफ़ॉल्ट खाते के लिए, आप इसके बजाय Gateway परिवेश में `RAFT_PROFILE` सेट कर सकते हैं:

```bash
RAFT_PROFILE=openclaw
```

जब एक Gateway एक से अधिक Raft बाहरी एजेंट से जुड़ता है, तो नामित खाते का उपयोग करें:

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

इंटरैक्टिव सेटअप फ़्लो वही प्रोफ़ाइल रिकॉर्ड करता है:

```bash
openclaw channels setup raft
```

## यह कैसे काम करता है

जब Gateway शुरू होता है, तो Plugin:

1. एक अस्थायी पोर्ट पर केवल loopback वाला HTTP वेक एंडपॉइंट खोलता है।
2. उस एंडपॉइंट और प्रति-प्रक्रिया टोकन के साथ `raft --profile <profile> agent bridge` शुरू करता है।
3. स्थानीय ब्रिज से केवल प्रमाणित, सामग्री-रहित वेक संकेत स्वीकार करता है जिनमें रीप्ले पहचान हो।
4. `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id`, या `id` में से एक की आवश्यकता रखता है।
5. ब्रिज इवेंट आईडी के आधार पर हाल की दोबारा कोशिश की गई वेक डिलीवरी को डीडुप्लिकेट करता है, Gateway पुनरारंभों के पार भी।
6. मौजूदा ब्रिज के लिए एक स्थिर रनटाइम सेशन और Raft CLI प्रोटोकॉल के लिए एक खाली गतिविधि-ड्रेन बैच लौटाता है।
7. हर स्वीकार किए गए वेक के लिए एक क्रमबद्ध OpenClaw एजेंट टर्न शुरू करता है।

ब्रिज Raft डिलीवरी की दोबारा कोशिशों और पुनःकनेक्शन का स्वामी होता है। OpenClaw टर्न को केवल वेक सूचना मिलती है, कॉपी किया गया Raft संदेश बॉडी नहीं। यह लंबित संदेश पढ़ने और अपनी प्रतिक्रिया भेजने के लिए CLI का उपयोग करता है:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft कोई सामान्य पुश-संदेश ट्रांसपोर्ट नहीं है। OpenClaw मॉडल का अंतिम टेक्स्ट अपने आप ब्रिज के माध्यम से वापस नहीं भेजता, इसलिए एजेंट को वेक प्रोसेस करने के बाद Raft CLI का उपयोग करना होगा।
</Note>

## सत्यापित करें

जांचें कि OpenClaw CLI ढूंढ सकता है और उसके पास कॉन्फ़िगर की गई प्रोफ़ाइल है:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

फिर Raft बाहरी एजेंट को संदेश भेजें। Gateway लॉग में Raft ब्रिज शुरू होते हुए, उसके बाद इनबाउंड वेक दिखना चाहिए। एजेंट को अपने लंबित संदेशों की जांच के लिए कॉन्फ़िगर की गई Raft प्रोफ़ाइल का उपयोग करना चाहिए।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Raft CLI मौजूद नहीं है">
    Gateway होस्ट पर Raft CLI इंस्टॉल करें और `raft` को सेवा के `PATH` पर उपलब्ध कराएं। इसे `raft --help` से सत्यापित करें, फिर Gateway को पुनरारंभ करें।
  </Accordion>
  <Accordion title="ब्रिज तुरंत बंद हो जाता है">
    सत्यापित करें कि कॉन्फ़िगर की गई प्रोफ़ाइल साइन इन है और इच्छित Raft बाहरी एजेंट से संबंधित है। CLI डायग्नोस्टिक देखने के लिए `raft --profile <profile> agent bridge` सीधे चलाएं।
  </Accordion>
  <Accordion title="वेक आता है लेकिन कोई Raft प्रतिक्रिया नहीं भेजी जाती">
    जब एजेंट Raft CLI को invoke नहीं करता, तो यह अपेक्षित है। वेक ब्रिज संदेश बॉडी या स्वचालित अंतिम उत्तर नहीं ले जाता। एजेंट की टूल नीति जांचें और सुनिश्चित करें कि वह `raft --profile <profile> message
    check` और `message send` चला सकता है।
  </Accordion>
</AccordionGroup>

## संदर्भ

- [Raft](https://raft.build/)
- [Raft दस्तावेज़](https://docs.raft.build/welcome/)
- [Hermes Raft इंटीग्रेशन](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
