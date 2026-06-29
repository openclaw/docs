---
read_when:
    - नई कोर क्षमता और Plugin पंजीकरण सतह जोड़ना
    - निर्णय करना कि कोड core, किसी vendor Plugin, या किसी feature Plugin में होना चाहिए
    - चैनलों या टूल्स के लिए नया runtime helper वायर करना
sidebarTitle: Adding capabilities
summary: OpenClaw Plugin सिस्टम में नई साझा क्षमता जोड़ने के लिए योगदानकर्ता मार्गदर्शिका
title: क्षमताएँ जोड़ना (योगदानकर्ता मार्गदर्शिका)
x-i18n:
    generated_at: "2026-06-28T23:30:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  यह OpenClaw कोर डेवलपरों के लिए **योगदानकर्ता गाइड** है। यदि आप
  कोई बाहरी Plugin बना रहे हैं, तो इसके बजाय [Plugin बनाना](/hi/plugins/building-plugins)
  देखें। गहरे आर्किटेक्चर संदर्भ (क्षमता मॉडल, स्वामित्व,
  लोड पाइपलाइन, रनटाइम हेल्पर) के लिए, [Plugin internals](/hi/plugins/architecture) देखें।
</Info>

इसका उपयोग तब करें जब OpenClaw को embeddings, इमेज
जनरेशन, वीडियो जनरेशन, या भविष्य के किसी विक्रेता-समर्थित फीचर क्षेत्र जैसे नए साझा डोमेन की आवश्यकता हो।

नियम:

- **Plugin** = स्वामित्व सीमा
- **क्षमता** = साझा कोर अनुबंध

किसी विक्रेता को सीधे किसी चैनल या टूल में वायर करके शुरू न करें। क्षमता को परिभाषित करके शुरू करें।

## क्षमता कब बनाएं

नई क्षमता तब बनाएं जब इनमें से **सभी** सही हों:

1. एक से अधिक विक्रेता इसे संभवतः लागू कर सकते हों।
2. चैनल, टूल, या फीचर Plugin को विक्रेता की परवाह किए बिना इसका उपयोग करना चाहिए।
3. कोर को fallback, नीति, कॉन्फिग, या डिलीवरी व्यवहार का स्वामित्व चाहिए।

यदि काम केवल विक्रेता-विशिष्ट है और अभी तक कोई साझा अनुबंध मौजूद नहीं है, तो रुकें और पहले अनुबंध परिभाषित करें।

## मानक क्रम

1. टाइप किया हुआ कोर अनुबंध परिभाषित करें।
2. उस अनुबंध के लिए Plugin पंजीकरण जोड़ें।
3. साझा रनटाइम हेल्पर जोड़ें।
4. प्रमाण के रूप में एक वास्तविक विक्रेता Plugin वायर करें।
5. फीचर/चैनल उपभोक्ताओं को रनटाइम हेल्पर पर ले जाएं।
6. अनुबंध टेस्ट जोड़ें।
7. ऑपरेटर-फेसिंग कॉन्फिग और स्वामित्व मॉडल का दस्तावेजीकरण करें।

## क्या कहां जाता है

**कोर:**

- अनुरोध/प्रतिक्रिया प्रकार।
- Provider रजिस्ट्री + रिज़ॉल्यूशन।
- Fallback व्यवहार।
- nested object, wildcard, array-item, और composition nodes पर प्रसारित `title` / `description` docs metadata के साथ कॉन्फिग schema।
- रनटाइम हेल्पर सतह।

**विक्रेता Plugin:**

- विक्रेता API कॉल।
- विक्रेता auth हैंडलिंग।
- विक्रेता-विशिष्ट अनुरोध normalization।
- क्षमता implementation का पंजीकरण।

**फीचर/चैनल Plugin:**

- `api.runtime.*` या मेल खाते `plugin-sdk/*-runtime` हेल्पर को कॉल करता है।
- किसी विक्रेता implementation को सीधे कभी कॉल नहीं करता।

## Provider और harness seams

जब व्यवहार generic agent loop के बजाय model provider contract से संबंधित हो, तो **provider hooks** का उपयोग करें। उदाहरणों में transport selection के बाद provider-specific request params, auth-profile preference, prompt overlays, और model/profile failover के बाद follow-up fallback routing शामिल हैं।

जब व्यवहार उस runtime से संबंधित हो जो turn execute कर रहा है, तो **agent harness hooks** का उपयोग करें। Harnesses खाली output, visible output के बिना reasoning, या final answer के बिना structured plan जैसे explicit protocol outcomes को classify कर सकते हैं, ताकि outer model fallback policy retry decision ले सके।

दोनों seams को संकीर्ण रखें:

- कोर retry/fallback policy का स्वामी है।
- Provider plugins provider-specific request/auth/routing hints के स्वामी हैं।
- Harness plugins runtime-specific attempt classification के स्वामी हैं।
- Third-party plugins hints लौटाते हैं, core state के direct mutations नहीं।

## फ़ाइल checklist

नई क्षमता के लिए, इन क्षेत्रों को छूने की अपेक्षा करें:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- एक या अधिक bundled Plugin packages।
- कॉन्फिग, docs, tests।

## काम किया हुआ उदाहरण: image generation

Image generation मानक आकार का पालन करता है:

1. कोर `ImageGenerationProvider` परिभाषित करता है।
2. कोर `registerImageGenerationProvider(...)` expose करता है।
3. कोर `runtime.imageGeneration.generate(...)` expose करता है।
4. `openai`, `google`, `fal`, और `minimax` plugins vendor-backed implementations register करते हैं।
5. भविष्य के vendors channels/tools बदले बिना वही contract register करते हैं।

कॉन्फिग key को vision-analysis routing से जानबूझकर अलग रखा गया है:

- `agents.defaults.imageModel` images का analysis करता है।
- `agents.defaults.imageGenerationModel` images generate करता है।

इन्हें अलग रखें ताकि fallback और policy explicit रहें।

## Embedding providers

Reusable vector embedding providers के लिए `embeddingProviders` का उपयोग करें। यह contract
जानबूझकर memory से व्यापक है: tools, search, retrieval, importers, या
future feature plugins memory
engine पर निर्भर हुए बिना embeddings consume कर सकते हैं।

Memory search generic `embeddingProviders` consume कर सकता है। पुराना
`memoryEmbeddingProviders` contract deprecated compatibility है जबकि मौजूदा
memory-specific providers migrate होते हैं; नए reusable embedding providers को
`embeddingProviders` का उपयोग करना चाहिए।

## Review checklist

नई क्षमता ship करने से पहले, सत्यापित करें:

- कोई channel/tool vendor code को सीधे import नहीं करता।
- runtime helper shared path है।
- कम से कम एक contract test bundled ownership assert करता है।
- Config docs नए model/config key का नाम देते हैं।
- Plugin docs ownership boundary समझाते हैं।

यदि कोई PR capability layer को छोड़कर vendor behavior को channel/tool में hardcode करता है, तो उसे वापस भेजें और पहले contract define करें।

## संबंधित

- [Plugin internals](/hi/plugins/architecture) — capability model, ownership, load pipeline, runtime helpers।
- [Plugin बनाना](/hi/plugins/building-plugins) — first-plugin tutorial।
- [SDK overview](/hi/plugins/sdk-overview) — import map और registration API reference।
- [Skills बनाना](/hi/tools/creating-skills) — companion contributor surface।
