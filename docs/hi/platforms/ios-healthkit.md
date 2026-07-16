---
read_when:
    - iPhone Node पर HealthKit सारांश सक्षम करना
    - health.summary को लागू करना या अनुपलब्ध स्वास्थ्य मेट्रिक्स की समस्या का निवारण करना
    - यह समीक्षा करना कि iPhone से कौन-सा स्वास्थ्य डेटा बाहर जा सकता है
summary: iPhone Node से गोपनीयता-नियंत्रित HealthKit सारांश सक्षम करें और उपयोग करें
title: HealthKit सारांश
x-i18n:
    generated_at: "2026-07-16T15:44:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit सारांश

OpenClaw कनेक्ट किए गए iPhone Node से वर्तमान कैलेंडर दिन का केवल-पढ़ने योग्य सारांश माँग सकता है। iPhone डिवाइस पर ही समेकन की गणना करता है और केवल कदमों की संख्या, नींद की अवधि, आराम के समय की औसत हृदय गति और वर्कआउट की संख्या/अवधि लौटाता है। अलग-अलग HealthKit नमूने, स्रोत, मेटाडेटा, क्लिनिकल रिकॉर्ड, बैकग्राउंड अंतर्ग्रहण और लेखन समर्थित नहीं हैं।

यह सुविधा डिफ़ॉल्ट रूप से बंद रहती है। इसके लिए iPhone पर अलग सहमति और Gateway पर प्राधिकरण आवश्यक है।

## आवश्यकताएँ

- OpenClaw iOS ऐप चलाने वाला ऐसा iPhone, जहाँ HealthKit स्वास्थ्य डेटा को उपलब्ध बताता हो।
- कनेक्ट और स्वीकृत iPhone Node। [iOS ऐप सेटअप](/hi/platforms/ios) देखें।
- ऐसा मौजूदा Gateway जो iPhone Node तक पहुँच सकता हो।
- जिन मेट्रिक को आप देखना चाहते हैं, उनके लिए पठनीय Health डेटा। Apple Watch, iPhone के Health स्टोर में डेटा जोड़ सकती है, लेकिन HealthKit सारांशों के लिए OpenClaw watchOS ऐप आवश्यक नहीं है।

## पहुँच सक्षम करें

### 1. Gateway कमांड को प्राधिकृत करें

`openclaw.json` में मौजूदा `gateway.nodes.allowCommands` सरणी में `health.summary` जोड़ें। पहले से मौजूद सभी कमांड यथावत रखें:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` को अत्यधिक गोपनीयता-संवेदनशील के रूप में वर्गीकृत किया गया है और iOS प्लेटफ़ॉर्म के डिफ़ॉल्ट द्वारा इसकी अनुमति कभी नहीं दी जाती। `gateway.nodes.denyCommands` में कोई प्रविष्टि अनुमति वाली प्रविष्टि को ओवरराइड करती है। [Node कमांड नीति](/hi/nodes#command-policy) देखें।

### 2. iPhone पर साझाकरण सक्षम करें

iOS ऐप में:

1. **Settings -> Permissions -> Privacy & Access -> Health Summaries** खोलें।
2. **Enable & Share Summaries** पर टैप करें।
3. प्रकटीकरण पढ़ें, फिर Apple की अनुमति शीट में चुनें कि OpenClaw किन Health श्रेणियों को पढ़ सकता है।

स्विच आपकी स्पष्ट OpenClaw साझाकरण पसंद रिकॉर्ड करता है। यह दावा नहीं करता कि Apple ने अनुरोध की गई प्रत्येक श्रेणी की अनुमति दे दी है।

Health सारांश सक्षम करने पर Node की घोषित कमांड सतह में `health.summary` जुड़ जाता है। इसके परिणामस्वरूप होने वाले Node पेयरिंग अपडेट को स्वीकृत करें:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

फिर सत्यापित करें कि कनेक्ट किया गया iPhone प्रभावी `health.summary` कमांड उपलब्ध कराता है:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## आज का सारांश माँगें

केवल `today` समर्थित है। इसमें iPhone के वर्तमान कैलेंडर और समय क्षेत्र के अनुसार स्थानीय मध्यरात्रि से अनुरोध के समय तक की अवधि शामिल होती है।

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

एजेंट `nodes` टूल से यही कमांड कॉल कर सकते हैं:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

सारांश पेलोड में ये शामिल होते हैं:

| फ़ील्ड                    | अर्थ                                       |
| ------------------------ | --------------------------------------------- |
| `period`                 | हमेशा `today`                                |
| `startISO`               | दिन की स्थानीय शुरुआत, ISO इंस्टेंट के रूप में एन्कोड की गई |
| `endISO`                 | अनुरोध का समय, ISO इंस्टेंट के रूप में एन्कोड किया गया       |
| `timeZoneIdentifier`     | iPhone समय-क्षेत्र पहचानकर्ता                   |
| `stepCount`              | पूर्णांकित संचयी कदम                      |
| `sleepDurationMinutes`   | डुप्लिकेट हटाया गया नींद का समय, आज तक सीमित    |
| `restingHeartRateBpm`    | आराम के समय की औसत हृदय गति                    |
| `workoutCount`           | आज शुरू हुए वर्कआउट                   |
| `workoutDurationMinutes` | उन वर्कआउट की कुल अवधि              |

मेट्रिक फ़ील्ड वैकल्पिक हैं और जब HealthKit कोई पठनीय मान नहीं लौटाता, तो उन्हें छोड़ दिया जाता है। अवधि की गणना से पहले नींद के चरणों और ओवरलैप करने वाले स्रोतों को मिला दिया जाता है, इसलिए एक ही मिनट की दो बार गणना नहीं होती।

## गोपनीयता व्यवहार

- समेकन iPhone पर होता है। कच्चे नमूने डिवाइस से बाहर नहीं जाते।
- अनुरोधित समेकित डेटा आपके Gateway के माध्यम से iPhone से बाहर जाता है। जब कोई एजेंट इसका अनुरोध करता है, तो समेकित डेटा कॉन्फ़िगर किए गए AI प्रदाता तक पहुँचता है और चैट इतिहास में रह सकता है। सीधे CLI से किए गए आह्वान में यह CLI ऑपरेटर को लौटाया जाता है।
- OpenClaw केवल पढ़ने की पहुँच माँगता है। यह Health डेटा जोड़ या संशोधित नहीं कर सकता।
- OpenClaw केवल `health.summary` का आह्वान होने पर HealthKit पढ़ता है। बैकग्राउंड में स्वास्थ्य डेटा का अंतर्ग्रहण नहीं होता।
- HealthKit जानबूझकर यह प्रकट नहीं करता कि पढ़ने की पहुँच अस्वीकृत हुई थी या नहीं। किसी मेट्रिक के अनुपलब्ध होने का अर्थ अस्वीकृत पहुँच, कोई मेल खाता नमूना न होना या डेटा प्रकार का अनुपलब्ध होना हो सकता है। OpenClaw इन स्थितियों के बीच अंतर नहीं कर सकता।
- सारांश व्यक्तिगत स्वास्थ्य और फ़िटनेस संदर्भ के लिए है, निदान या चिकित्सीय सलाह के लिए नहीं।

साझाकरण रोकने के लिए **Health Summaries** पर वापस जाएँ और **Disable** पर टैप करें। इसके बाद iPhone अपनी Node सतह से Health क्षमता और `health.summary` कमांड हटा देता है। Gateway की ओर का द्वार बंद करने के लिए आप `gateway.nodes.allowCommands` से `health.summary` भी हटा सकते हैं।

## समस्या निवारण

### कमांड Node द्वारा घोषित नहीं है

पुष्टि करें कि iOS ऐप में Health सारांश सक्षम हैं और iPhone कनेक्ट है। `openclaw nodes pending` चलाएँ और किसी भी क्षमता अपडेट को स्वीकृत करें, फिर `openclaw nodes describe --node "<iPhone name>"` का दोबारा निरीक्षण करें।

### कमांड के लिए स्पष्ट ऑप्ट-इन आवश्यक है

`gateway.nodes.allowCommands` में `health.summary` जोड़ें। यह भी जाँचें कि `gateway.nodes.denyCommands` में यह शामिल न हो; अस्वीकृति सूची को प्राथमिकता मिलती है।

### `HEALTH_ACCESS_DISABLED`

ऐप की ओर का साझाकरण स्विच बंद है। iPhone पर **Privacy & Access** के अंतर्गत **Health Summaries** सक्षम करें।

### सारांश सफल होता है, लेकिन मेट्रिक अनुपलब्ध हैं

Apple का Health ऐप खोलें और पुष्टि करें कि आज का डेटा मौजूद है। Apple की Health सेटिंग में OpenClaw की पहुँच की समीक्षा करें, लेकिन खाली परिणाम को पहुँच अस्वीकृत होने का प्रमाण न मानें: HealthKit जानबूझकर इस अंतर को छिपाता है।

### पुरानी अवधियाँ विफल होती हैं

कमांड केवल `{"period":"today"}` स्वीकार करता है। कई दिनों और ऐतिहासिक अवधियों के सारांश समर्थित नहीं हैं।

## संबंधित

- [iOS ऐप](/hi/platforms/ios)
- [Nodes](/hi/nodes)
- [Gateway कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#gateway)
- [सुरक्षा ऑडिट](/hi/gateway/security)
