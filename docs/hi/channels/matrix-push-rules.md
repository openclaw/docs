---
read_when:
    - स्व-होस्टेड Synapse या Tuwunel के लिए Matrix शांत स्ट्रीमिंग सेट अप करना
    - उपयोगकर्ता केवल पूर्ण हुए ब्लॉक पर सूचनाएँ चाहते हैं, हर पूर्वावलोकन संपादन पर नहीं
summary: शांत अंतिम रूप दिए गए पूर्वावलोकन संपादनों के लिए प्रति-प्राप्तकर्ता Matrix push नियम
title: शांत पूर्वावलोकनों के लिए मैट्रिक्स पुश नियम
x-i18n:
    generated_at: "2026-06-28T22:36:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

जब `channels.matrix.streaming` `"quiet"` हो, तो OpenClaw एक ही प्रीव्यू इवेंट को उसी स्थान पर संपादित करता है और अंतिम संपादन को कस्टम कंटेंट फ्लैग से चिह्नित करता है। Matrix क्लाइंट अंतिम संपादन पर केवल तभी सूचना देते हैं जब प्रति-उपयोगकर्ता पुश नियम उस फ्लैग से मेल खाता हो। यह पेज उन ऑपरेटरों के लिए है जो Matrix को स्वयं होस्ट करते हैं और हर प्राप्तकर्ता खाते के लिए वह नियम इंस्टॉल करना चाहते हैं।

यदि आप केवल स्टॉक Matrix सूचना व्यवहार चाहते हैं, तो `streaming: "partial"` इस्तेमाल करें या स्ट्रीमिंग बंद रहने दें। [Matrix चैनल सेटअप](/hi/channels/matrix#streaming-previews) देखें।

## पूर्वापेक्षाएँ

- प्राप्तकर्ता उपयोगकर्ता = वह व्यक्ति जिसे सूचना मिलनी चाहिए
- बॉट उपयोगकर्ता = वह OpenClaw Matrix खाता जो जवाब भेजता है
- नीचे दिए गए API कॉल के लिए प्राप्तकर्ता उपयोगकर्ता का एक्सेस टोकन इस्तेमाल करें
- पुश नियम में `sender` को बॉट उपयोगकर्ता के पूर्ण MXID से मिलाएँ
- प्राप्तकर्ता खाते में पहले से कार्यरत पुशर होने चाहिए — quiet प्रीव्यू नियम केवल तब काम करते हैं जब सामान्य Matrix पुश डिलीवरी स्वस्थ हो

## चरण

<Steps>
  <Step title="quiet प्रीव्यू कॉन्फ़िगर करें">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="प्राप्तकर्ता का एक्सेस टोकन प्राप्त करें">
    जहाँ संभव हो, मौजूदा क्लाइंट सेशन टोकन का दोबारा इस्तेमाल करें। नया टोकन बनाने के लिए:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="सत्यापित करें कि पुशर मौजूद हैं">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

यदि कोई पुशर वापस नहीं आता, तो आगे बढ़ने से पहले इस खाते के लिए सामान्य Matrix पुश डिलीवरी ठीक करें।

  </Step>

  <Step title="ओवरराइड पुश नियम इंस्टॉल करें">
    OpenClaw अंतिम text-only प्रीव्यू संपादनों को `content["com.openclaw.finalized_preview"] = true` से चिह्नित करता है। ऐसा नियम इंस्टॉल करें जो उस मार्कर और sender के रूप में बॉट MXID, दोनों से मेल खाए:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    चलाने से पहले बदलें:

    - `https://matrix.example.org`: आपके होमसर्वर का बेस URL
    - `$USER_ACCESS_TOKEN`: प्राप्तकर्ता उपयोगकर्ता का एक्सेस टोकन
    - `openclaw-finalized-preview-botname`: प्रति बॉट प्रति प्राप्तकर्ता अद्वितीय नियम ID (पैटर्न: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: आपका OpenClaw बॉट MXID, प्राप्तकर्ता का नहीं

  </Step>

  <Step title="सत्यापित करें">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

फिर स्ट्रीम किए गए जवाब का परीक्षण करें। quiet मोड में रूम एक quiet ड्राफ्ट प्रीव्यू दिखाता है और ब्लॉक या टर्न पूरा होने पर एक बार सूचना देता है।

  </Step>
</Steps>

बाद में नियम हटाने के लिए, प्राप्तकर्ता के टोकन के साथ उसी नियम URL पर `DELETE` करें।

## मल्टी-बॉट नोट्स

पुश नियम `ruleId` से की किए जाते हैं: उसी ID पर `PUT` दोबारा चलाने से एक ही नियम अपडेट होता है। एक ही प्राप्तकर्ता को सूचना देने वाले कई OpenClaw बॉट के लिए, अलग sender मैच के साथ हर बॉट के लिए एक नियम बनाएँ।

नए उपयोगकर्ता-परिभाषित `override` नियम डिफ़ॉल्ट suppress नियमों से पहले डाले जाते हैं, इसलिए कोई अतिरिक्त क्रम पैरामीटर आवश्यक नहीं है। नियम केवल text-only प्रीव्यू संपादनों को प्रभावित करता है जिन्हें उसी स्थान पर अंतिम किया जा सकता है; मीडिया फॉलबैक और stale-preview फॉलबैक सामान्य Matrix डिलीवरी इस्तेमाल करते हैं।

## होमसर्वर नोट्स

<AccordionGroup>
  <Accordion title="Synapse">
    किसी विशेष `homeserver.yaml` बदलाव की आवश्यकता नहीं है। यदि सामान्य Matrix सूचनाएँ पहले से इस उपयोगकर्ता तक पहुँच रही हैं, तो ऊपर दिया गया प्राप्तकर्ता टोकन + `pushrules` कॉल मुख्य सेटअप चरण है।

    यदि आप Synapse को रिवर्स प्रॉक्सी या वर्करों के पीछे चलाते हैं, तो सुनिश्चित करें कि `/_matrix/client/.../pushrules/` Synapse तक ठीक से पहुँचे। पुश डिलीवरी मुख्य प्रक्रिया या `synapse.app.pusher` / कॉन्फ़िगर किए गए पुशर वर्करों द्वारा संभाली जाती है — सुनिश्चित करें कि वे स्वस्थ हैं।

    नियम `event_property_is` पुश-नियम कंडीशन (MSC3758, पुश नियम v1.10) इस्तेमाल करता है, जिसे 2023 में Synapse में जोड़ा गया था। पुराने Synapse रिलीज़ `PUT pushrules/...` कॉल स्वीकार करते हैं लेकिन चुपचाप कभी कंडीशन से मेल नहीं खाते — यदि अंतिम प्रीव्यू संपादन पर कोई सूचना नहीं आती, तो Synapse अपग्रेड करें।

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse जैसा ही फ्लो; अंतिम प्रीव्यू मार्कर के लिए कोई Tuwunel-विशिष्ट कॉन्फ़िग आवश्यक नहीं है।

    यदि उपयोगकर्ता के किसी अन्य डिवाइस पर सक्रिय होने पर सूचनाएँ गायब हो जाती हैं, तो जाँचें कि `suppress_push_when_active` सक्षम है या नहीं। Tuwunel ने यह विकल्प 1.4.2 (सितंबर 2025) में जोड़ा था और यह एक डिवाइस सक्रिय होने पर दूसरे डिवाइसों पर पुश को जानबूझकर suppress कर सकता है।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Matrix चैनल सेटअप](/hi/channels/matrix)
- [स्ट्रीमिंग अवधारणाएँ](/hi/concepts/streaming)
