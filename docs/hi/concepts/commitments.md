---
read_when:
    - आप चाहते हैं कि OpenClaw स्वाभाविक फ़ॉलो-अप याद रखे
    - आप समझना चाहते हैं कि अनुमानित check-ins reminders से कैसे अलग हैं
    - आप फ़ॉलो-अप प्रतिबद्धताओं की समीक्षा करना या उन्हें खारिज करना चाहते हैं
sidebarTitle: Commitments
summary: उन चेक-इन के लिए अनुमानित फ़ॉलो-अप मेमोरी जो सटीक रिमाइंडर नहीं हैं
title: अनुमानित प्रतिबद्धताएँ
x-i18n:
    generated_at: "2026-06-28T22:56:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

कमिटमेंट्स अल्पकालिक follow-up यादें हैं। सक्षम होने पर, OpenClaw यह देख सकता है कि किसी बातचीत ने भविष्य में check-in का अवसर बनाया है और उसे बाद में वापस लाने के लिए याद रख सकता है।

उदाहरण:

- आप कल के इंटरव्यू का उल्लेख करते हैं। OpenClaw बाद में check in कर सकता है।
- आप कहते हैं कि आप थके हुए हैं। OpenClaw बाद में पूछ सकता है कि आपने नींद ली या नहीं।
- एजेंट कहता है कि कुछ बदलने के बाद वह follow up करेगा। OpenClaw उस खुले loop को track कर सकता है।

कमिटमेंट्स `MEMORY.md` जैसे टिकाऊ तथ्य नहीं हैं, और वे सटीक reminders भी नहीं हैं। वे memory और automation के बीच स्थित होते हैं: OpenClaw बातचीत-से-बंधी बाध्यता को याद रखता है, फिर Heartbeat उसे नियत समय पर deliver करता है।

## कमिटमेंट्स सक्षम करें

कमिटमेंट्स डिफ़ॉल्ट रूप से बंद होते हैं। इन्हें config में सक्षम करें:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

समतुल्य `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` सीमित करता है कि rolling day में प्रति agent session कितने inferred follow-ups deliver किए जा सकते हैं। डिफ़ॉल्ट `3` है।

## यह कैसे काम करता है

एजेंट के जवाब के बाद, OpenClaw अलग context में एक hidden background extraction pass चला सकता है। वह pass केवल inferred follow-up commitments खोजता है। यह visible conversation में नहीं लिखता और extraction पर reason करने के लिए main agent से नहीं कहता।

जब इसे कोई high-confidence candidate मिलता है, OpenClaw इन चीज़ों के साथ एक commitment store करता है:

- agent id
- session key
- original channel और delivery target
- due window
- एक छोटा suggested check-in
- Heartbeat को यह तय करने के लिए non-instructional metadata कि इसे भेजना है या नहीं

Delivery Heartbeat के माध्यम से होती है। जब कोई commitment due हो जाता है, Heartbeat उसी agent और channel scope के लिए commitment को Heartbeat turn में जोड़ता है। model एक स्वाभाविक check-in भेज सकता है या उसे dismiss करने के लिए `HEARTBEAT_OK` reply कर सकता है। यदि Heartbeat `target: "none"` के साथ configured है, तो due commitments internal रहते हैं और external check-ins नहीं भेजते। Commitment delivery prompts original conversation text को replay नहीं करते, और due commitment Heartbeat turns OpenClaw tools के बिना चलते हैं।

OpenClaw किसी inferred commitment को लिखने के तुरंत बाद कभी deliver नहीं करता। due time को commitment बनने के बाद कम से कम एक Heartbeat interval तक clamp किया जाता है, ताकि follow-up उसी क्षण echo back न कर सके जब उसे infer किया गया था।

## Scope

कमिटमेंट्स उसी exact agent और channel context तक scoped होते हैं जहाँ वे बनाए गए थे। Discord में एक agent से बात करते समय inferred follow-up किसी दूसरे agent, दूसरे channel, या unrelated session द्वारा deliver नहीं किया जाता।

यह scope इस feature का हिस्सा है। Natural check-ins को ऐसा लगना चाहिए जैसे वही बातचीत आगे बढ़ रही है, न कि कोई global reminder system।

## कमिटमेंट्स बनाम reminders

| आवश्यकता                                      | उपयोग                                    |
| ----------------------------------------------- | ---------------------------------------- |
| "मुझे 3 PM पर याद दिलाएँ"                             | [Scheduled tasks](/hi/automation/cron-jobs) |
| "मुझे 20 minutes में ping करें"                         | [Scheduled tasks](/hi/automation/cron-jobs) |
| "इस report को हर weekday चलाएँ"                 | [Scheduled tasks](/hi/automation/cron-jobs) |
| "मेरा कल interview है"                  | कमिटमेंट्स                              |
| "मैं पूरी रात जागा रहा"                            | कमिटमेंट्स                              |
| "यदि मैं इस open thread का उत्तर न दूँ तो follow up करें" | कमिटमेंट्स                              |

सटीक user requests पहले से scheduler path के अंतर्गत आते हैं। कमिटमेंट्स केवल inferred follow-ups के लिए हैं: वे क्षण जहाँ user ने reminder नहीं मांगा, लेकिन बातचीत ने स्पष्ट रूप से एक उपयोगी future check-in बनाया।

## कमिटमेंट्स प्रबंधित करें

stored commitments को inspect और clear करने के लिए CLI का उपयोग करें:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

command reference के लिए [`openclaw commitments`](/hi/cli/commitments) देखें।

## Privacy और cost

Commitment extraction एक LLM pass का उपयोग करता है, इसलिए इसे सक्षम करने से eligible turns के बाद background model usage जुड़ता है। pass user-visible conversation से hidden है, लेकिन यह यह तय करने के लिए आवश्यक recent exchange पढ़ सकता है कि follow-up मौजूद है या नहीं।

Stored commitments local OpenClaw state हैं। वे operational memory हैं, long-term memory नहीं। feature को इससे disable करें:

```bash
openclaw config set commitments.enabled false
```

## Troubleshooting

यदि अपेक्षित follow-ups दिखाई नहीं दे रहे हैं:

- पुष्टि करें कि `commitments.enabled` `true` है।
- pending, dismissed, snoozed, या expired records के लिए `openclaw commitments --all` देखें।
- सुनिश्चित करें कि agent के लिए Heartbeat चल रहा है।
- जाँचें कि क्या उस agent session के लिए `commitments.maxPerDay` पहले ही पहुँच चुका है।
- याद रखें कि exact reminders commitment extraction द्वारा skip किए जाते हैं और इसके बजाय [scheduled tasks](/hi/automation/cron-jobs) के अंतर्गत दिखाई देने चाहिए।

## Related

- [Memory overview](/hi/concepts/memory)
- [Active memory](/hi/concepts/active-memory)
- [Heartbeat](/hi/gateway/heartbeat)
- [Scheduled tasks](/hi/automation/cron-jobs)
- [`openclaw commitments`](/hi/cli/commitments)
- [Configuration reference](/hi/gateway/configuration-reference#commitments)
