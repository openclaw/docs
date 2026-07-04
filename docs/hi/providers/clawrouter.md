---
read_when:
    - आप कई मॉडल प्रदाताओं के लिए एक प्रबंधित कुंजी चाहते हैं
    - आपको OpenClaw में ClawRouter मॉडल खोज या कोटा रिपोर्टिंग चाहिए
summary: क्रेडेंशियल-स्कोप वाले मॉडलों को ClawRouter के माध्यम से रूट करें और प्रबंधित कोटा दिखाएँ
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:48:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter, OpenClaw को कई अपस्ट्रीम मॉडल
प्रदाताओं के लिए एक नीति-स्कोप्ड कुंजी देता है। बंडल किया गया Plugin केवल उस कुंजी के लिए अनुमत मॉडलों को खोजता है,
हर मॉडल को उसके घोषित प्रोटोकॉल के ज़रिए रूट करता है, और OpenClaw उपयोग सतहों पर कुंजी का बजट
और कुल उपयोग रिपोर्ट करता है।

आप OpenClaw होस्ट पर हर अपस्ट्रीम प्रदाता Plugin को इंस्टॉल या प्रमाणित नहीं करते। अपस्ट्रीम क्रेडेंशियल और प्रदाता-विशिष्ट फ़ॉरवर्डिंग
ClawRouter में रहते हैं। OpenClaw को केवल बंडल किए गए `@openclaw/clawrouter` Plugin और जारी किए गए
ClawRouter क्रेडेंशियल की ज़रूरत होती है।

| गुण          | मान                                      |
| ------------- | ---------------------------------------- |
| प्रदाता       | `clawrouter`                             |
| पैकेज        | `@openclaw/clawrouter`                   |
| प्रमाणीकरण    | `CLAWROUTER_API_KEY`                     |
| डिफ़ॉल्ट URL  | `https://clawrouter.openclaw.ai`         |
| मॉडल कैटलॉग  | `/v1/catalog` के ज़रिए क्रेडेंशियल-स्कोप्ड |
| कोटा         | `/v1/usage` के ज़रिए मासिक बजट और उपयोग |

## शुरू करना

<Steps>
  <Step title="Get a scoped credential">
    अपने ClawRouter व्यवस्थापक से ऐसा क्रेडेंशियल मांगें जिसकी नीति में वे
    प्रदाता, मॉडल और मासिक बजट शामिल हों जिनका आपको उपयोग करना चाहिए। क्रेडेंशियल जारी किए जाने पर
    एक बार दिखाए जाते हैं।
  </Step>
  <Step title="Configure OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Plugin OpenClaw के साथ बंडल किया गया है। अगर आपका कॉन्फ़िगरेशन
    `plugins.allow` सेट करता है, तो इसे सक्षम करने से पहले उस सूची में `clawrouter` जोड़ें। कस्टम
    डिप्लॉयमेंट के लिए, `models.providers.clawrouter.baseUrl` को
    ClawRouter origin पर सेट करें; डिफ़ॉल्ट `https://clawrouter.openclaw.ai` है।

  </Step>
  <Step title="List granted models">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    लौटाए गए मॉडल refs का ठीक उसी तरह उपयोग करें जैसे दिखाए गए हैं। वे अपस्ट्रीम
    namespace बनाए रखते हैं, जैसे `clawrouter/openai/...`, `clawrouter/anthropic/...`, या
    `clawrouter/google/...`। अगर आपके कॉन्फ़िगरेशन में `agents.defaults.models` एक allowlist है,
    तो हर चुने गए ClawRouter ref को उसमें जोड़ें।

  </Step>
  <Step title="Select a model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    आप एक रन के लिए लौटाए गए मॉडल को
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` से भी चुन सकते हैं।

  </Step>
</Steps>

## मॉडल खोज

`GET /v1/catalog` सत्य का स्रोत है। OpenClaw, ClawRouter मॉडलों की कोई दूसरी,
स्थिर सूची शिप नहीं करता। ClawRouter में कॉन्फ़िगर किया गया मॉडल तब दिखाई देता है जब:

- क्रेडेंशियल की नीति उसके प्रदाता को अनुमति देती है;
- प्रदाता कनेक्शन सक्षम और तैयार है;
- कैटलॉग मॉडल समर्थित LLM क्षमता का विज्ञापन करता है; और
- कैटलॉग ऐसा transport contract दिखाता है जिसे Plugin समर्थन देता है।

इसलिए समर्थित ClawRouter प्रदाता में कोई और मॉडल जोड़ने के लिए
OpenClaw रिलीज़ या किसी दूसरे प्रदाता Plugin की ज़रूरत नहीं होती। अगला कैटलॉग
refresh उसे खोज लेता है। जिस मॉडल को नए wire protocol की ज़रूरत है, उसे OpenClaw द्वारा विज्ञापित करने से पहले
ClawRouter Plugin में समर्थन चाहिए।

## प्रोटोकॉल और प्रदाता Plugins

आपको हर अपस्ट्रीम कंपनी का auth Plugin इंस्टॉल करने की ज़रूरत नहीं है। ClawRouter
अपस्ट्रीम क्रेडेंशियल का स्वामी है; उसका कैटलॉग OpenClaw को बताता है कि कौन-सा transport उपयोग करना है।
Plugin इसका समर्थन करता है:

| कैटलॉग route                  | OpenClaw transport     |
| ------------------------------ | ---------------------- |
| OpenAI-संगत चैट               | `openai-completions`   |
| OpenAI-संगत Responses         | `openai-responses`     |
| नेटिव Anthropic Messages      | `anthropic-messages`   |
| नेटिव Google Gemini streaming | `google-generative-ai` |

Plugin उन परिवारों के लिए मेल खाती replay और tool-schema नीतियां भी लागू करता है।
किसी दूसरे request/stream फ़ॉर्मैट का उपयोग करने वाली कैटलॉग पंक्तियों को जानबूझकर
OpenClaw text models के रूप में विज्ञापित नहीं किया जाता। असंगत payload भेजने के बजाय
उन प्रदाताओं को ClawRouter में समर्थित contracts में से किसी एक पर normalize करें।

## कोटा और उपयोग

ClawRouter का `/v1/usage` response सामान्य OpenClaw provider-usage
सतहों को फ़ीड करता है। `/status` और संबंधित dashboard status, कुंजी की सीमा होने पर मासिक बजट window,
साथ ही request, token और spend totals दिखाते हैं। Unmetered कुंजियां
बिना percentage window के भी कुल उपयोग दिखाती हैं।

Quota lookup, model discovery जैसी ही scoped key का उपयोग करता है। असफल quota lookup
model execution को block नहीं करता।

लाइव snapshot देखें:

```bash
openclaw status --usage
openclaw models status
```

वही provider snapshot चैट में `/status` और OpenClaw के
usage UI के लिए उपलब्ध है। बजट policy-wide होता है, इसलिए उसी
ClawRouter policy का उपयोग करने वाले किसी दूसरे client द्वारा किए गए requests शेष percentage बदल सकते हैं।

## समस्या निवारण

| लक्षण                                    | जांचें                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| कोई ClawRouter मॉडल नहीं                 | पुष्टि करें कि Plugin enabled है और `plugins.allow` द्वारा allowed है, फिर जांचें कि credential active है और कम से कम एक ready provider grant करता है। |
| कॉन्फ़िगर किया गया ClawRouter मॉडल गायब है | उसकी `/v1/catalog` capability और route format निरीक्षण करें। Unsupported transport contracts जानबूझकर filtered होते हैं।                             |
| `Unknown model: clawrouter/...`          | जब उस configuration map का allowlist के रूप में उपयोग हो रहा हो, तो exact catalog ref को `agents.defaults.models` में जोड़ें।                               |
| catalog या usage से `401` या `403`       | ClawRouter credential को फिर से जारी करें या फिर से scope करें; OpenClaw upstream provider keys पर fall back नहीं करता।                                          |
| discovery के बाद model call fail होता है | ClawRouter में provider connection और upstream health जांचें, फिर उसकी readiness state recover होने के बाद retry करें।                                |
| Usage में totals हैं लेकिन percentage नहीं | policy unmetered है; percentage window expose करने के लिए ClawRouter में monthly budget जोड़ें।                                                     |

## सुरक्षा व्यवहार

- Catalog discovery configured proxy key तक scoped है और per key cached है।
- Proxy key केवल request dispatch पर attached होती है; यह model metadata में stored नहीं होती।
- Native Anthropic और Gemini model ids केवल dispatch पर उनके upstream ids में rewritten होते हैं।
- Unsupported या ungranted catalog rows fail closed होते हैं और selectable नहीं होते।

## संबंधित

<CardGroup cols={2}>
  <Card title="Model providers" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता कॉन्फ़िगरेशन और मॉडल चयन।
  </Card>
  <Card title="Usage tracking" href="/hi/concepts/usage-tracking" icon="chart-line">
    OpenClaw उपयोग और status सतहें।
  </Card>
</CardGroup>
