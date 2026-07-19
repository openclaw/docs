---
read_when:
    - आप Ollama के माध्यम से क्लाउड या स्थानीय मॉडल के साथ OpenClaw चलाना चाहते हैं
    - आपको Ollama सेटअप और कॉन्फ़िगरेशन संबंधी मार्गदर्शन चाहिए
    - आप छवियों को समझने के लिए Ollama विज़न मॉडल चाहते हैं
summary: Ollama (क्लाउड और स्थानीय मॉडल) के साथ OpenClaw चलाएँ
title: Ollama
x-i18n:
    generated_at: "2026-07-19T09:33:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw Ollama के नेटिव API (`/api/chat`) से संचार करता है, OpenAI-संगत
`/v1` एंडपॉइंट से नहीं। तीन मोड समर्थित हैं:

| मोड          | यह क्या उपयोग करता है                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| क्लाउड + लोकल | पहुँच योग्य Ollama होस्ट, जो लोकल मॉडल और (साइन इन होने पर) `:cloud` मॉडल उपलब्ध कराता है |
| केवल क्लाउड    | सीधे `https://ollama.com`, कोई लोकल डेमन नहीं                                   |
| केवल लोकल    | पहुँच योग्य Ollama होस्ट, केवल लोकल मॉडल                                       |

समर्पित `ollama-cloud` प्रोवाइडर आईडी के साथ केवल-क्लाउड सेटअप के लिए,
[Ollama Cloud](/hi/providers/ollama-cloud) देखें। जब आप क्लाउड रूटिंग को लोकल `ollama` प्रोवाइडर से
अलग रखना चाहते हैं, तो `ollama-cloud/<model>` रेफ़रेंस का उपयोग करें।

<Warning>
`/v1` OpenAI-संगत URL (`http://host:11434/v1`) का उपयोग न करें। यह टूल कॉलिंग को बाधित करता है और मॉडल कच्चे टूल-कॉल JSON को सादे टेक्स्ट के रूप में उत्सर्जित कर सकते हैं। नेटिव URL का उपयोग करें: `baseUrl: "http://host:11434"` (`/v1` के बिना)।
</Warning>

कैनोनिकल कॉन्फ़िगरेशन कुंजी `baseUrl` है। OpenAI-SDK-शैली के उदाहरणों के लिए
`baseURL` भी स्वीकार की जाती है, लेकिन नए कॉन्फ़िगरेशन में `baseUrl` का उपयोग होना चाहिए।

## प्रमाणीकरण के नियम

<AccordionGroup>
  <Accordion title="लोकल और LAN होस्ट">
    लूपबैक, निजी-नेटवर्क, `.local`, और केवल-होस्टनाम वाले Ollama URL को वास्तविक बेयरर टोकन की आवश्यकता नहीं होती। OpenClaw इनके लिए `ollama-local` मार्कर का उपयोग करता है।
  </Accordion>
  <Accordion title="रिमोट और Ollama Cloud होस्ट">
    सार्वजनिक रिमोट होस्ट और `https://ollama.com` को वास्तविक क्रेडेंशियल की आवश्यकता होती है: `OLLAMA_API_KEY`, कोई प्रमाणीकरण प्रोफ़ाइल, या प्रोवाइडर का `apiKey`। सीधे होस्टेड उपयोग के लिए `ollama-cloud` प्रोवाइडर को प्राथमिकता दें।
  </Accordion>
  <Accordion title="कस्टम प्रोवाइडर आईडी">
    `api: "ollama"` वाला कस्टम प्रोवाइडर समान नियमों का पालन करता है। उदाहरण के लिए, निजी LAN होस्ट की ओर इंगित करने वाला `ollama-remote` प्रोवाइडर `apiKey: "ollama-local"` का उपयोग कर सकता है; सब-एजेंट उस मार्कर को अनुपस्थित क्रेडेंशियल मानने के बजाय Ollama प्रोवाइडर हुक के माध्यम से हल करते हैं। `agents.defaults.memorySearch.provider` भी किसी कस्टम प्रोवाइडर आईडी की ओर इंगित कर सकता है, ताकि एम्बेडिंग उस Ollama एंडपॉइंट का उपयोग करें।
  </Accordion>
  <Accordion title="प्रमाणीकरण प्रोफ़ाइल">
    `auth-profiles.json` किसी प्रोवाइडर आईडी का क्रेडेंशियल संग्रहीत करता है; एंडपॉइंट सेटिंग्स (`baseUrl`, `api`, मॉडल, हेडर, टाइमआउट) को `models.providers.<id>` में रखें। `{ "ollama-windows": { "apiKey": "ollama-local" } }` जैसी पुरानी फ़्लैट फ़ाइलें रनटाइम प्रारूप नहीं हैं; `openclaw doctor --fix` बैकअप बनाकर उन्हें कैनोनिकल `ollama-windows:default` API-कुंजी प्रोफ़ाइल में दोबारा लिखता है। उस लेगेसी फ़ाइल में मौजूद `baseUrl` मान अनावश्यक है और उसे प्रोवाइडर कॉन्फ़िगरेशन में स्थानांतरित किया जाना चाहिए।
  </Accordion>
  <Accordion title="मेमोरी एम्बेडिंग का दायरा">
    Ollama मेमोरी एम्बेडिंग के लिए बेयरर प्रमाणीकरण उस होस्ट तक सीमित होता है जिसके लिए उसे घोषित किया गया था:

    - प्रोवाइडर-स्तरीय कुंजी केवल उस प्रोवाइडर के होस्ट को भेजी जाती है।
    - `agents.*.memorySearch.remote.apiKey` केवल उसके रिमोट एम्बेडिंग होस्ट को भेजी जाती है।
    - शुद्ध `OLLAMA_API_KEY` env मान को Ollama Cloud परिपाटी माना जाता है और डिफ़ॉल्ट रूप से लोकल/स्वयं-होस्टेड होस्ट को नहीं भेजा जाता।

  </Accordion>
</AccordionGroup>

## शुरुआत करना

<Tabs>
  <Tab title="ऑनबोर्डिंग (अनुशंसित)">
    <Steps>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard
        ```

        **Ollama** चुनें, फिर एक मोड चुनें: **क्लाउड + लोकल**, **केवल क्लाउड**, या **केवल लोकल**।

        नए निर्देशित सेटअप में, OpenClaw पहले डिफ़ॉल्ट या कॉन्फ़िगर किए गए
        Ollama होस्ट की जाँच करता है। यदि कोई इंस्टॉल किया गया मॉडल टूल समर्थन घोषित करता है, तो साझा
        CLI/macOS सेटअप क्रम उसे तुरंत प्रस्तुत करता है और वास्तविक
        कम्प्लीशन के साथ सत्यापित करता है। यह स्वचालित जाँच कभी कोई मॉडल पुल नहीं करती; यदि कोई उपयुक्त
        इंस्टॉल किया गया मॉडल मौजूद नहीं है, तो ऑनबोर्डिंग सामान्य Ollama चयनकर्ता पर जारी रहती है।
      </Step>
      <Step title="मॉडल चुनें">
        `Cloud only`, `OLLAMA_API_KEY` के लिए संकेत देता है और होस्टेड क्लाउड डिफ़ॉल्ट सुझाता है। `Cloud + Local` और `Local only`, Ollama बेस URL के लिए संकेत देते हैं, उपलब्ध मॉडल खोजते हैं और चयनित लोकल मॉडल अनुपस्थित होने पर उसे स्वतः पुल करते हैं। `gemma4:latest` जैसा इंस्टॉल किया गया `:latest` टैग, `gemma4` की प्रतिलिपि बनाने के बजाय एक बार दिखाया जाता है। `Cloud + Local` यह भी जाँचता है कि होस्ट क्लाउड एक्सेस के लिए साइन इन है या नहीं।
      </Step>
      <Step title="सत्यापित करें">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    गैर-इंटरैक्टिव:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` और `--custom-model-id` वैकल्पिक हैं; इन्हें छोड़ने पर लोकल डिफ़ॉल्ट होस्ट और `gemma4` सुझाया गया मॉडल उपयोग होता है।

  </Tab>

  <Tab title="मैन्युअल सेटअप">
    <Steps>
      <Step title="Ollama इंस्टॉल और शुरू करें">
        इसे [ollama.com/download](https://ollama.com/download) से प्राप्त करें, फिर कोई मॉडल पुल करें:

        ```bash
        ollama pull gemma4
        ```

        हाइब्रिड क्लाउड एक्सेस के लिए, उसी होस्ट पर `ollama signin` चलाएँ।
      </Step>
      <Step title="क्रेडेंशियल सेट करें">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # लोकल/LAN होस्ट, कोई भी मान काम करता है
        export OLLAMA_API_KEY="your-real-key"   # केवल https://ollama.com
        ```

        या कॉन्फ़िगरेशन में: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`।
      </Step>
      <Step title="मॉडल चुनें">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        या कॉन्फ़िगरेशन में:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## लोकल होस्ट के माध्यम से क्लाउड मॉडल

`Cloud + Local` लोकल और `:cloud` दोनों मॉडलों को एक पहुँच योग्य
Ollama होस्ट के माध्यम से रूट करता है — यह Ollama का हाइब्रिड प्रवाह है और जब आप दोनों चाहते हैं,
तो सेटअप के दौरान यही मोड चुनना चाहिए।

OpenClaw बेस URL के लिए संकेत देता है, लोकल मॉडल खोजता है और
`ollama signin` स्थिति की जाँच करता है। साइन इन होने पर, यह होस्टेड डिफ़ॉल्ट
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`) सुझाता है। यदि
साइन इन नहीं है, तो `ollama signin` चलाने तक सेटअप केवल-लोकल रहता है।

लोकल डेमन के बिना केवल-क्लाउड एक्सेस के लिए, `openclaw onboard --auth-choice ollama-cloud` का उपयोग करें और [Ollama Cloud](/hi/providers/ollama-cloud) देखें — उस पथ को `ollama signin` या चल रहे सर्वर की आवश्यकता नहीं होती:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` के दौरान दिखाई गई क्लाउड मॉडल सूची
`https://ollama.com/api/tags` से लाइव भरी जाती है और 500 प्रविष्टियों तक सीमित होती है, इसलिए चयनकर्ता
वर्तमान होस्टेड कैटलॉग दिखाता है। यदि सेटअप के समय `ollama.com` तक पहुँचा नहीं जा सकता या वह कोई
मॉडल नहीं लौटाता, तो OpenClaw अपनी हार्डकोडेड सुझाई गई सूची का उपयोग करता है, ताकि
ऑनबोर्डिंग फिर भी पूरी हो जाए।

## मॉडल खोज (अंतर्निहित प्रोवाइडर)

जब `OLLAMA_API_KEY` (या कोई प्रमाणीकरण प्रोफ़ाइल) सेट हो और न तो
`models.providers.ollama`, न ही `api: "ollama"` वाला कोई अन्य कस्टम प्रोवाइडर
परिभाषित हो, तो OpenClaw `http://127.0.0.1:11434` से मॉडल खोजता है:

| व्यवहार             | विवरण                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| कैटलॉग क्वेरी        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| क्षमता पहचान | सर्वोत्तम-प्रयास `/api/show`, `contextWindow`, `num_ctx` Modelfile पैरामीटर और क्षमताएँ (विज़न/टूल/चिंतन) पढ़ता है                                                                                                                                                                       |
| विज़न मॉडल        | `/api/show` से मिली `vision` क्षमता मॉडल को छवि-सक्षम (`input: ["text", "image"]`) चिह्नित करती है                                                                                                                                                                                             |
| रीजनिंग पहचान  | उपलब्ध होने पर `/api/show` से `thinking` क्षमता का उपयोग करती है; जब Ollama क्षमताएँ छोड़ देता है, तो नाम ह्यूरिस्टिक (`r1`, `reason`, `reasoning`, `think`) का उपयोग करती है। रिपोर्ट की गई क्षमताओं की परवाह किए बिना `glm-5.2:cloud` और `deepseek-v4-flash\|pro:cloud` को हमेशा रीजनिंग मॉडल माना जाता है। |
| टोकन सीमाएँ         | `maxTokens` डिफ़ॉल्ट रूप से OpenClaw की Ollama अधिकतम-टोकन सीमा का उपयोग करता है                                                                                                                                                                                                                                       |
| लागत                | सभी लागतें `0` हैं                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

स्पष्ट `models` ऐरे के साथ `models.providers.ollama` सेट करना, या
`api: "ollama"` और गैर-लूपबैक `baseUrl` वाला कस्टम प्रोवाइडर,
स्वतः-खोज को अक्षम करता है; तब मॉडलों को मैन्युअल रूप से परिभाषित करना आवश्यक है (
[कॉन्फ़िगरेशन](#configuration) देखें)। होस्टेड `https://ollama.com` की ओर इंगित करने वाली
`models.providers.ollama` प्रविष्टि भी खोज छोड़ देती है, क्योंकि Ollama Cloud मॉडल
प्रोवाइडर द्वारा प्रबंधित होते हैं। `http://127.0.0.2:11434` जैसे लूपबैक कस्टम प्रोवाइडर
फिर भी लोकल माने जाते हैं और स्वतः-खोज चालू रखते हैं।

आप हस्तलिखित `models.json` प्रविष्टि के बिना `ollama/<pulled-model>:latest` जैसे पूर्ण रेफ़रेंस का उपयोग कर सकते हैं; OpenClaw इसे लाइव हल करता है। साइन-इन किए गए
होस्ट के लिए, सूचीबद्ध न किया गया `ollama/<model>:cloud` रेफ़रेंस चुनने पर उसी
मॉडल को `/api/show` के साथ सत्यापित किया जाता है और Ollama द्वारा
मेटाडेटा की पुष्टि किए जाने पर ही उसे रनटाइम कैटलॉग में जोड़ा जाता है — टाइपो अब भी अज्ञात मॉडल के रूप में विफल होते हैं।

### स्मोक परीक्षण

पूर्ण एजेंट टूल सतह को छोड़ने वाली सीमित टेक्स्ट जाँच के लिए:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "ठीक यही उत्तर दें: pong" \
    --json
```

हल्की विज़न-मॉडल जाँच के लिए किसी छवि के साथ `--file` जोड़ें (PNG/JPEG/WebP स्वीकार करता है;
Ollama को कॉल करने से पहले गैर-छवि फ़ाइलें अस्वीकार कर दी जाती हैं — ऑडियो के लिए
`openclaw infer audio transcribe` का उपयोग करें):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "इस छवि का वर्णन एक वाक्य में करें।" \
    --file ./photo.jpg \
    --json
```

कोई भी पथ चैट टूल, मेमोरी या सेशन संदर्भ लोड नहीं करता। यदि यह सफल होता है
जबकि सामान्य एजेंट उत्तर विफल होते हैं, तो समस्या संभवतः मॉडल की टूल/एजेंट
क्षमता में है, एंडपॉइंट में नहीं।

`/model ollama/<model>` के साथ मॉडल चुनना उपयोगकर्ता की सटीक पसंद है: यदि
कॉन्फ़िगर किया गया `baseUrl` पहुँच योग्य नहीं है, तो अगला उत्तर किसी अन्य कॉन्फ़िगर किए गए मॉडल पर चुपचाप फ़ॉलबैक करने के बजाय प्रोवाइडर
त्रुटि के साथ विफल होता है।

अलग किए गए cron जॉब एजेंट टर्न शुरू करने से पहले एक स्थानीय सुरक्षा जाँच जोड़ते हैं:
यदि चुना गया मॉडल किसी स्थानीय/निजी-नेटवर्क/`.local` Ollama
प्रोवाइडर पर रिज़ॉल्व होता है और `/api/tags` पहुँच योग्य नहीं है, तो OpenClaw उस रन को
त्रुटि टेक्स्ट में मॉडल के साथ `skipped` के रूप में दर्ज करता है। यह एंडपॉइंट जाँच प्रत्येक
होस्ट के लिए 5 मिनट तक कैश रहती है, इसलिए रुके हुए डेमन के विरुद्ध बार-बार चलने वाले cron जॉब
सभी विफल होने वाले अनुरोध शुरू नहीं करते।

लाइव सत्यापन:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud के लिए, उसी लाइव परीक्षण को होस्ट किए गए एंडपॉइंट पर इंगित करें (डिफ़ॉल्ट रूप से
एम्बेडिंग छोड़ देता है; `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` से बाध्य करें क्योंकि
क्लाउड कुंजी `/api/embed` को अधिकृत नहीं कर सकती):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

मॉडल जोड़ने के लिए, उसे पुल करें और वह स्वचालित रूप से खोज लिया जाता है:

```bash
ollama pull mistral
```

## Node-स्थानीय इनफ़रेंस

एजेंट किसी युग्मित डेस्कटॉप या सर्वर Node पर Ollama मॉडल को छोटा कार्य सौंप सकते हैं।
प्रॉम्प्ट और प्रतिक्रिया मौजूदा प्रमाणित Gateway/Node कनेक्शन से होकर जाते हैं; अनुरोध
Node के अपने लूपबैक Ollama एंडपॉइंट (`http://127.0.0.1:11434`) पर चलता है।

<Steps>
  <Step title="Node पर Ollama शुरू करें">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Node होस्ट कनेक्ट करें">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway होस्ट पर डिवाइस और उसके Node कमांड अनुमोदित करें, फिर सत्यापित करें:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    पहला कनेक्शन, या Ollama कमांड जोड़ने वाला अपग्रेड, Node-कमांड अनुमोदन ट्रिगर कर सकता है।
    यदि Node `ollama.models` और `ollama.chat` का विज्ञापन किए बिना कनेक्ट होता है,
    तो `openclaw nodes pending` फिर से जाँचें।

  </Step>
  <Step title="इसे एजेंट से उपयोग करें">
    बंडल किया गया Ollama Plugin `node_inference` टूल उपलब्ध कराता है। एजेंट पहले
    `action: "discover"` कॉल करते हैं, फिर उस परिणाम से मिले Node और मॉडल के साथ
    `action: "run"` कॉल करते हैं (जब ठीक एक सक्षम Node कनेक्ट हो, तो
    `run` में Node छोड़ा जा सकता है)। उदाहरण के लिए: "मेरे Node पर Ollama
    मॉडल खोजें, फिर इस टेक्स्ट का सारांश बनाने के लिए सबसे तेज़ लोड किए गए मॉडल का उपयोग करें।"
  </Step>
</Steps>

खोज `/api/tags` पढ़ती है, `/api/show` क्षमताएँ जाँचती है, और उपलब्ध होने पर
पहले से लोड किए गए मॉडलों को पहले रैंक करने के लिए `/api/ps` का उपयोग करती है। यह
केवल वे स्थानीय मॉडल लौटाती है जिन्हें Ollama चैट-सक्षम (`completion` क्षमता) बताता है —
Ollama Cloud पंक्तियाँ और केवल-एम्बेडिंग मॉडल बाहर रखे जाते हैं। प्रत्येक रन मॉडल थिंकिंग अक्षम
करता है और आउटपुट को डिफ़ॉल्ट रूप से 512 टोकन (हार्ड कैप 8192) पर रखता है, जब तक टूल कॉल
कोई अलग `maxTokens` अनुरोध न करे; कुछ मॉडल (उदाहरण के लिए GPT-OSS) थिंकिंग अक्षम
करने का समर्थन नहीं करते और फिर भी रीजनिंग टोकन उत्सर्जित कर सकते हैं।

Ollama को एजेंटों के सामने उजागर किए बिना Node पर चालू रखने के लिए:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node को पुनः शुरू करें (`openclaw node restart`, या फ़ोरग्राउंड सत्र के लिए
`openclaw node run` रोककर दोबारा चलाएँ)। Node `ollama.models` और
`ollama.chat` का विज्ञापन बंद कर देता है; स्वयं Ollama और Gateway का Ollama प्रोवाइडर
अप्रभावित रहते हैं। फिर से सक्षम करने के लिए मान को वापस `true` पर सेट करके
पुनः शुरू करें; बदली हुई कमांड सतह को दोबारा कनेक्ट होने के बाद फिर से
`openclaw nodes pending` अनुमोदन की आवश्यकता हो सकती है।

एजेंट टर्न के बिना, Node कमांड सीधे सत्यापित करें:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` यह सीमित करता है कि Node के पास कमांड चलाने के लिए कितना समय है;
`--timeout` समग्र Gateway कॉल को सीमित करता है और इसे अधिक होना चाहिए।

Node-स्थानीय इनफ़रेंस हमेशा Node के अपने लूपबैक एंडपॉइंट का उपयोग करता है — यह किसी
कॉन्फ़िगर किए गए रिमोट/क्लाउड `models.providers.ollama.baseUrl` का पुनः उपयोग नहीं करता। Node कमांड
macOS, Linux और Windows Node होस्ट पर डिफ़ॉल्ट रूप से उपलब्ध हैं और सामान्य Node
युग्मन/कमांड नीति के अधीन रहते हैं।

## विज़न और छवि वर्णन

बंडल किया गया Ollama Plugin, Ollama को छवि-सक्षम मीडिया-समझ प्रोवाइडर के रूप में पंजीकृत
करता है, ताकि OpenClaw स्पष्ट छवि-वर्णन अनुरोधों और कॉन्फ़िगर किए गए छवि-मॉडल डिफ़ॉल्ट को
स्थानीय या होस्ट किए गए Ollama विज़न मॉडलों से रूट कर सके।

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` एक पूर्ण `<provider/model>` रेफ़ होना चाहिए; सेट होने पर,
`infer image
describe` उन मॉडलों के लिए वर्णन छोड़ने के बजाय पहले उस मॉडल को आज़माता है जो
पहले से नेटिव विज़न का समर्थन करते हैं। कॉल विफल होने पर OpenClaw
`agents.defaults.imageModel.fallbacks` के माध्यम से आगे बढ़ सकता है; फ़ाइल/URL तैयारी त्रुटियाँ फ़ॉलबैक का
प्रयास होने से पहले विफल हो जाती हैं। OpenClaw के छवि-समझ प्रवाह और कॉन्फ़िगर किए गए
`imageModel` के लिए `infer image describe` का उपयोग करें; कस्टम प्रॉम्प्ट वाली कच्ची
मल्टीमोडल जाँच के लिए `infer model run
--file` का उपयोग करें।

इनबाउंड मीडिया के लिए Ollama को डिफ़ॉल्ट छवि-समझ प्रोवाइडर बनाने हेतु:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

पूर्ण `ollama/<model>` रेफ़ को प्राथमिकता दें। `qwen2.5vl:7b` जैसा नंगा
`imageModel` रेफ़ केवल तभी `ollama/qwen2.5vl:7b` में सामान्यीकृत होता है, जब वही
सटीक मॉडल `models.providers.ollama.models` के अंतर्गत `input: ["text", "image"]` के साथ सूचीबद्ध हो और कोई
अन्य कॉन्फ़िगर किया गया छवि प्रोवाइडर वही नंगा आईडी उपलब्ध न कराता हो; अन्यथा प्रोवाइडर
प्रीफ़िक्स का स्पष्ट रूप से उपयोग करें।

धीमे स्थानीय विज़न मॉडलों को क्लाउड मॉडलों की तुलना में अधिक लंबी छवि-समझ टाइमआउट की
आवश्यकता हो सकती है, और यदि Ollama मॉडल का पूरा विज्ञापित विज़न कॉन्टेक्स्ट आवंटित करने
का प्रयास करे तो सीमित हार्डवेयर पर क्रैश हो सकते हैं। क्षमता टाइमआउट सेट करें और
`num_ctx` को सीमित करें:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

यह टाइमआउट इनबाउंड छवि समझ और स्पष्ट `image` टूल पर लागू होता है।
`models.providers.ollama.timeoutSeconds` सामान्य मॉडल कॉल के लिए अंतर्निहित Ollama HTTP अनुरोध गार्ड को
अब भी नियंत्रित करता है।

लाइव सत्यापन:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

यदि आप `models.providers.ollama.models` को मैन्युअल रूप से परिभाषित करते हैं, तो विज़न मॉडलों को
स्पष्ट रूप से चिह्नित करें:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw उन मॉडलों के लिए छवि-वर्णन अनुरोध अस्वीकार करता है जिन्हें छवि-सक्षम चिह्नित
नहीं किया गया है। अप्रत्यक्ष खोज में, यह `/api/show` की विज़न क्षमता से आता है।

## कॉन्फ़िगरेशन

<Tabs>
  <Tab title="मूलभूत (अप्रत्यक्ष खोज)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    यदि `OLLAMA_API_KEY` सेट है, तो आप प्रोवाइडर प्रविष्टि में `apiKey` छोड़ सकते हैं; उपलब्धता जाँच के लिए OpenClaw इसे भर देता है।
    </Tip>

  </Tab>

  <Tab title="स्पष्ट (मैन्युअल मॉडल)">
    होस्ट किए गए क्लाउड सेटअप, गैर-डिफ़ॉल्ट होस्ट/पोर्ट, बाध्य कॉन्टेक्स्ट विंडो या पूरी तरह
    मैन्युअल मॉडल सूचियों के लिए स्पष्ट कॉन्फ़िगरेशन का उपयोग करें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="कस्टम बेस URL">
    स्पष्ट कॉन्फ़िगरेशन स्वतः-खोज अक्षम कर देता है, इसलिए मॉडल सूचीबद्ध किए जाने चाहिए:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 नहीं - नेटिव Ollama API URL
            api: "ollama", // स्पष्ट: नेटिव टूल-कॉलिंग व्यवहार सुनिश्चित करता है
            timeoutSeconds: 300, // वैकल्पिक: ठंडे स्थानीय मॉडलों के लिए लंबा कनेक्ट/स्ट्रीम बजट
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // वैकल्पिक: टर्न के बीच मॉडल को लोड रखा जाता है
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` न जोड़ें। वह पथ OpenAI-संगत मोड चुनता है, जहाँ टूल कॉलिंग विश्वसनीय नहीं है।
    </Warning>

  </Tab>
</Tabs>

## सामान्य विधियाँ

मॉडल आईडी को `ollama list` या `openclaw models list --provider ollama` से मिले सटीक नामों से बदलें।

<AccordionGroup>
  <Accordion title="स्वतः-खोज वाला स्थानीय मॉडल">
    Gateway वाली ही मशीन पर Ollama, स्वचालित रूप से खोजा गया:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    मैन्युअल मॉडलों की आवश्यकता न हो, तो `models.providers.ollama` ब्लॉक न जोड़ें।

  </Accordion>

  <Accordion title="मैन्युअल मॉडलों वाला LAN Ollama होस्ट">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` OpenClaw का कॉन्टेक्स्ट बजट है; `params.num_ctx` Ollama को
    भेजा जाता है। जब हार्डवेयर मॉडल का पूरा विज्ञापित कॉन्टेक्स्ट नहीं चला सकता, तो उन्हें
    संरेखित रखें।

  </Accordion>

  <Accordion title="केवल Ollama Cloud">
    कोई स्थानीय डेमन नहीं, सीधे होस्ट किए गए मॉडल:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    इस संरचना के बजाय समर्पित `ollama-cloud` प्रदाता आईडी के लिए, देखें
    [Ollama Cloud](/hi/providers/ollama-cloud)।

  </Accordion>

  <Accordion title="साइन-इन किए हुए डेमन के माध्यम से क्लाउड और लोकल">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="एकाधिक Ollama होस्ट">
    एक से अधिक Ollama सर्वर चलाते समय कस्टम प्रदाता आईडी; प्रत्येक को अपना
    होस्ट, मॉडल, प्रमाणीकरण और टाइमआउट मिलता है।

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw, Ollama को कॉल करने से पहले सक्रिय प्रदाता उपसर्ग हटा देता है
    (और न मिलने पर केवल `ollama/` उपसर्ग का उपयोग करता है), इसलिए `ollama-large/qwen3.5:27b`
    Ollama तक `qwen3.5:27b` के रूप में पहुँचता है।

  </Accordion>

  <Accordion title="हल्की लोकल मॉडल प्रोफ़ाइल">
    कुछ लोकल मॉडल सरल प्रॉम्प्ट संभाल लेते हैं, लेकिन संपूर्ण एजेंट
    टूल सतह के साथ कठिनाई अनुभव करते हैं। वैश्विक रनटाइम सेटिंग्स को बदलने से पहले
    टूल और कॉन्टेक्स्ट सीमित करें:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    `compat.supportsTools: false` का उपयोग केवल तब करें, जब मॉडल या सर्वर टूल स्कीमा पर
    विश्वसनीय रूप से विफल होता हो—यह स्थिरता के बदले एजेंट क्षमता कम करता है।
    `localModelLean`, स्पष्ट रूप से आवश्यक न होने पर, सीधे एजेंट सतह से भारी ब्राउज़र,
    Cron, संदेश, मीडिया-जनरेशन, वॉइस और PDF टूल हटा देता है,
    और बड़े कैटलॉग को टूल खोज के पीछे रखता है। यह Ollama के
    रनटाइम कॉन्टेक्स्ट या चिंतन मोड को नहीं बदलता। लूप में फँसने वाले या
    छिपे हुए तर्क पर अपना बजट खर्च करने वाले छोटे Qwen-शैली के चिंतन मॉडल के लिए इसे
    `params.num_ctx` और `params.thinking: false` के साथ उपयोग करें।

  </Accordion>
</AccordionGroup>

### मॉडल चयन

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

कस्टम प्रदाता आईडी भी इसी तरह काम करती हैं: सक्रिय प्रदाता
उपसर्ग का उपयोग करने वाले रेफ़रेंस, जैसे `ollama-spark/qwen3:32b`, के लिए OpenClaw,
Ollama को कॉल करने से पहले वह उपसर्ग हटाकर `qwen3:32b` भेजता है।

धीमे लोकल मॉडल के लिए, पूरे एजेंट रनटाइम का टाइमआउट बढ़ाने से पहले
प्रदाता-स्कोप्ड ट्यूनिंग को प्राथमिकता दें:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` मॉडल HTTP अनुरोध को कवर करता है: कनेक्शन सेटअप, हेडर,
बॉडी स्ट्रीमिंग और सुरक्षित फ़ेच का कुल निरस्तीकरण। मूल `/api/chat` अनुरोधों पर
`params.keep_alive` को शीर्ष-स्तरीय `keep_alive` के रूप में फ़ॉरवर्ड किया जाता है; जब
पहली बारी का लोड समय बाधा हो, तो इसे प्रति मॉडल सेट करें।

### त्वरित सत्यापन

```bash
# Ollama डेमन इस मशीन को दिखाई दे रहा है
curl http://127.0.0.1:11434/api/tags

# OpenClaw कैटलॉग और चयनित मॉडल
openclaw models list --provider ollama
openclaw models status

# प्रत्यक्ष मॉडल स्मोक परीक्षण
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "ठीक इसी तरह उत्तर दें: ok"
```

रिमोट होस्ट के लिए, `127.0.0.1` को `baseUrl` होस्ट से बदलें। यदि `curl`
काम करता है, लेकिन OpenClaw नहीं, तो जाँचें कि Gateway किसी दूसरी
मशीन, कंटेनर या सेवा खाते पर तो नहीं चल रहा है।

## Ollama वेब खोज

OpenClaw में **Ollama वेब खोज** एक `web_search` प्रदाता के रूप में शामिल है।

| गुण         | विवरण                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| होस्ट       | सेट होने पर `models.providers.ollama.baseUrl`, अन्यथा `http://127.0.0.1:11434`; `https://ollama.com` सीधे होस्ट किए गए API का उपयोग करता है                          |
| प्रमाणीकरण  | साइन-इन किए हुए लोकल होस्ट के लिए बिना कुंजी; सीधे `https://ollama.com` खोज या प्रमाणीकरण-संरक्षित होस्ट के लिए `OLLAMA_API_KEY` या कॉन्फ़िगर किया गया प्रदाता प्रमाणीकरण           |
| आवश्यकता    | लोकल/स्वयं-होस्ट किए गए होस्ट चालू होने चाहिए और `ollama signin` से साइन-इन होना चाहिए; सीधे होस्ट की गई खोज के लिए `baseUrl: "https://ollama.com"` और एक वास्तविक API कुंजी आवश्यक है |

इसे `openclaw onboard` या `openclaw configure --section web` के दौरान चुनें, या यह सेट करें:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Ollama Cloud के माध्यम से सीधे होस्ट की गई खोज के लिए:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

स्वयं-होस्ट किए गए होस्ट के लिए, OpenClaw पहले लोकल `/api/experimental/web_search`
प्रॉक्सी आज़माता है, फिर उसी होस्ट पर होस्ट किए गए `/api/web_search` पथ का उपयोग करता है;
साइन-इन किया हुआ लोकल डेमन सामान्यतः लोकल प्रॉक्सी के माध्यम से उत्तर देता है। सीधे
`https://ollama.com` कॉल हमेशा होस्ट किए गए `/api/web_search` एंडपॉइंट का उपयोग करते हैं।

<Note>
संपूर्ण सेटअप और व्यवहार के लिए, [Ollama वेब खोज](/hi/tools/ollama-search) देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="लेगेसी OpenAI-संगत मोड">
    <Warning>
    **इस मोड में टूल कॉलिंग विश्वसनीय नहीं है।** इसका उपयोग केवल तब करें, जब किसी प्रॉक्सी को OpenAI प्रारूप की आवश्यकता हो और आप मूल टूल कॉलिंग पर निर्भर न हों।
    </Warning>

    `/v1/chat/completions` के पीछे मौजूद प्रॉक्सी के लिए `api: "openai-completions"` को
    स्पष्ट रूप से सेट करें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // डिफ़ॉल्ट: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    यह मोड स्ट्रीमिंग और टूल कॉलिंग का एक साथ समर्थन न कर पाए; आपको
    मॉडल पर `params: { streaming: false }` की आवश्यकता हो सकती है।

    OpenClaw इस मोड में डिफ़ॉल्ट रूप से `options.num_ctx` इंजेक्ट करता है, ताकि Ollama
    चुपचाप 4096-टोकन कॉन्टेक्स्ट पर वापस न जाए। यदि आपका प्रॉक्सी
    अज्ञात `options` फ़ील्ड अस्वीकार करता है, तो इसे अक्षम करें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="कॉन्टेक्स्ट विंडो">
    स्वतः खोजे गए मॉडल के लिए, OpenClaw उस कॉन्टेक्स्ट विंडो का उपयोग करता है जिसे
    `/api/show` रिपोर्ट करता है, जिसमें कस्टम Modelfiles के बड़े
    `PARAMETER num_ctx` मान भी शामिल हैं; अन्यथा यह OpenClaw की डिफ़ॉल्ट Ollama कॉन्टेक्स्ट
    विंडो का उपयोग करता है।

    प्रदाता-स्तरीय `contextWindow`, `contextTokens` और `maxTokens` उस प्रदाता के अंतर्गत
    प्रत्येक मॉडल के लिए डिफ़ॉल्ट सेट करते हैं और इन्हें प्रति मॉडल ओवरराइड किया जा सकता है।
    `contextWindow` OpenClaw का अपना प्रॉम्प्ट/Compaction बजट है। मूल
    `/api/chat` अनुरोधों में `options.num_ctx` तब तक सेट नहीं रहता, जब तक आप
    `params.num_ctx` स्पष्ट रूप से सेट न करें, इसलिए Ollama अपना मॉडल,
    `OLLAMA_CONTEXT_LENGTH` या VRAM-आधारित डिफ़ॉल्ट लागू करता है; अमान्य, शून्य, ऋणात्मक
    या अससीमित `params.num_ctx` मान अनदेखे किए जाते हैं। यदि किसी पुराने कॉन्फ़िगरेशन ने
    मूल अनुरोध कॉन्टेक्स्ट को बाध्य करने के लिए केवल `contextWindow`/`maxTokens` का उपयोग किया था, तो
    उन्हें `params.num_ctx` में कॉपी करने के लिए `openclaw doctor --fix` चलाएँ।
    OpenAI-संगत अडैप्टर अब भी कॉन्फ़िगर किए गए `params.num_ctx` या
    `contextWindow` से डिफ़ॉल्ट रूप से `options.num_ctx` इंजेक्ट करता है; यदि अपस्ट्रीम
    `options` अस्वीकार करता है, तो इसे `injectNumCtxForOpenAICompat: false` से अक्षम करें।

    मूल मॉडल प्रविष्टियाँ `params` के अंतर्गत सामान्य Ollama रनटाइम विकल्प भी
    स्वीकार करती हैं, जिन्हें मूल `/api/chat` `options` के रूप में फ़ॉरवर्ड किया जाता है: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` और `num_thread`।
    कुछ कुंजियाँ (`format`, `keep_alive`, `truncate`, `shift`) नेस्टेड `options` के बजाय
    शीर्ष-स्तरीय अनुरोध फ़ील्ड के रूप में फ़ॉरवर्ड की जाती हैं। OpenClaw केवल
    इन Ollama अनुरोध कुंजियों को फ़ॉरवर्ड करता है, इसलिए केवल-रनटाइम पैरामीटर, जैसे
    `streaming`, Ollama को कभी नहीं भेजे जाते। शीर्ष-स्तरीय `think` सेट करने के लिए
    `params.think` (या `params.thinking`) का उपयोग करें; `false`, Qwen-शैली के
    चिंतन मॉडल के लिए API-स्तरीय चिंतन अक्षम करता है।

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    प्रति-मॉडल `agents.defaults.models["ollama/<model>"].params.num_ctx` भी
    काम करता है; यदि दोनों सेट हों, तो स्पष्ट प्रदाता मॉडल प्रविष्टि प्रभावी होती है।

  </Accordion>

  <Accordion title="चिंतन नियंत्रण">
    OpenClaw चिंतन को Ollama की अपेक्षा के अनुसार फ़ॉरवर्ड करता है: शीर्ष-स्तरीय `think`,
    न कि `options.think`। स्वतः खोजे गए वे मॉडल, जिनका `/api/show`
    एक `thinking` क्षमता रिपोर्ट करता है, `/think low`, `/think medium`, `/think high`
    और `/think max` उपलब्ध कराते हैं; गैर-चिंतन मॉडल केवल `/think off` उपलब्ध कराते हैं।

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    या किसी मॉडल का डिफ़ॉल्ट सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    प्रति-मॉडल `params.think`/`params.thinking` किसी विशिष्ट मॉडल के लिए API
    चिंतन को अक्षम या बाध्य कर सकता है। जब सक्रिय रन में केवल अंतर्निहित
    `off` डिफ़ॉल्ट हो, तब OpenClaw उस स्पष्ट कॉन्फ़िगरेशन को बनाए रखता
    है; `/think medium` जैसी नॉन-ऑफ़ रनटाइम कमांड फिर भी उसे ओवरराइड करती है।
    स्पष्ट रूप से `reasoning: false` चिह्नित मॉडल को सत्य-मूल्य वाला चिंतन अनुरोध
    कभी नहीं भेजा जाता; `think: false` अनुरोध हमेशा भेजा जाता है।

  </Accordion>

  <Accordion title="रीज़निंग मॉडल">
    `deepseek-r1`, `reasoning`, `reason`, या `think` नामक मॉडल
    डिफ़ॉल्ट रूप से रीज़निंग-सक्षम माने जाते हैं — किसी अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता नहीं:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="मॉडल लागत">
    Ollama स्थानीय रूप से चलता है और निःशुल्क है, इसलिए स्वतः खोजे गए और
    मैन्युअल रूप से परिभाषित दोनों मॉडलों की सभी लागतें `0` हैं।
  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग">
    बंडल किया गया Ollama plugin [मेमोरी खोज](/hi/concepts/memory) के लिए एक मेमोरी
    एम्बेडिंग प्रदाता पंजीकृत करता है। यह कॉन्फ़िगर किए गए Ollama बेस URL और
    API कुंजी का उपयोग करता है, `/api/embed` को कॉल करता है, और संभव होने पर
    कई मेमोरी खंडों को एक `input` अनुरोध में बैच करता है।

    जब `proxy.enabled=true` हो, तब कॉन्फ़िगर किए गए `baseUrl` से प्राप्त
    ठीक उसी होस्ट-लोकल लूपबैक मूल के लिए एम्बेडिंग अनुरोध, प्रबंधित फ़ॉरवर्ड
    प्रॉक्सी के बजाय OpenClaw के सुरक्षित प्रत्यक्ष पथ का उपयोग करते हैं।
    कॉन्फ़िगर किया गया होस्टनाम स्वयं `localhost` या लूपबैक IP लिटरल होना
    चाहिए — केवल लूपबैक पर रिज़ॉल्व होने वाले DNS नाम फिर भी प्रबंधित प्रॉक्सी
    पथ का उपयोग करते हैं। LAN, टेलनेट, निजी-नेटवर्क और सार्वजनिक Ollama होस्ट
    हमेशा प्रबंधित प्रॉक्सी पथ पर रहते हैं, और किसी अन्य होस्ट/पोर्ट पर
    रीडायरेक्ट को भरोसा विरासत में नहीं मिलता। `proxy.loopbackMode: "proxy"` फिर भी
    लूपबैक ट्रैफ़िक को प्रॉक्सी से रूट करता है; `proxy.loopbackMode: "block"` कनेक्ट करने
    से पहले उसे अस्वीकार करता है — [प्रबंधित प्रॉक्सी](/hi/security/network-proxy#gateway-loopback-mode) देखें।

    | गुण | मान |
    | --- | --- |
    | डिफ़ॉल्ट मॉडल | `nomic-embed-text` |
    | स्वतः पुल | हाँ, यदि स्थानीय रूप से मौजूद न हो |
    | डिफ़ॉल्ट इनलाइन समवर्तीता | 1 (अन्य प्रदाताओं में डिफ़ॉल्ट अधिक है; यदि होस्ट इसे संभाल सकता है, तो `nonBatchConcurrency` से बढ़ाएँ) |

    क्वेरी-समय एम्बेडिंग उन मॉडलों के लिए पुनर्प्राप्ति प्रीफ़िक्स का उपयोग करती
    हैं जिन्हें उनकी आवश्यकता होती है या जो उनकी अनुशंसा करते हैं:
    `nomic-embed-text`, `qwen3-embedding`, और `mxbai-embed-large`। दस्तावेज़ बैच
    अपरिवर्तित रहते हैं, इसलिए मौजूदा इंडेक्स को प्रारूप माइग्रेशन की आवश्यकता नहीं।

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama के लिए डिफ़ॉल्ट। यदि पुनः इंडेक्स करना बहुत धीमा हो, तो बड़े होस्ट पर बढ़ाएँ।
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    दूरस्थ एम्बेडिंग होस्ट के लिए, प्रमाणीकरण को उसी होस्ट तक सीमित रखें:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="स्ट्रीमिंग कॉन्फ़िगरेशन">
    Ollama डिफ़ॉल्ट रूप से **नेटिव API** (`/api/chat`) का उपयोग करता है,
    जो स्ट्रीमिंग और टूल कॉलिंग दोनों को एक साथ समर्थित करता है — किसी विशेष
    कॉन्फ़िगरेशन की आवश्यकता नहीं।

    नेटिव अनुरोधों के लिए, चिंतन नियंत्रण सीधे अग्रेषित होता है:
    `/think off` और `openclaw agent --thinking off` शीर्ष-स्तरीय `think: false` भेजते
    हैं, जब तक कि कोई स्पष्ट `params.think`/`params.thinking` कॉन्फ़िगर न
    हो; `/think
    low|medium|high` मेल खाती प्रयास स्ट्रिंग भेजता है; `/think max`
    Ollama के उच्चतम प्रयास, `think: "high"`, पर मैप होता है।

    <Tip>
    इसके बजाय OpenAI-संगत एंडपॉइंट के लिए, ऊपर "लेगेसी OpenAI-संगत मोड" देखें — वहाँ स्ट्रीमिंग और टूल कॉलिंग एक साथ काम न करें।
    </Tip>

  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="WSL2 क्रैश लूप (बार-बार रीबूट)">
    NVIDIA/CUDA वाले WSL2 पर, आधिकारिक Ollama Linux इंस्टॉलर
    `Restart=always` के साथ एक `ollama.service` systemd यूनिट बनाता है। यदि वह
    सेवा स्वतः शुरू होकर WSL2 बूट के दौरान GPU-समर्थित मॉडल लोड करती है, तो
    Ollama लोड करते समय होस्ट मेमोरी को पिन कर सकता है; Hyper-V मेमोरी पुनर्प्राप्ति
    हमेशा उन पृष्ठों को पुनः प्राप्त नहीं कर सकती, इसलिए Windows WSL2 VM को
    समाप्त कर सकता है, systemd Ollama को पुनः शुरू करता है, और लूप दोहराता है।

    प्रमाण: बार-बार WSL2 रीबूट/समापन, WSL2 स्टार्टअप के तुरंत बाद
    `app.slice` या `ollama.service` में उच्च CPU उपयोग, और Linux OOM
    किलर के बजाय systemd से SIGTERM।

    जब OpenClaw WSL2, `Restart=always` के साथ सक्षम `ollama.service`, और
    दृश्यमान CUDA मार्कर का पता लगाता है, तो यह स्टार्टअप चेतावनी लॉग करता है।

    निवारण:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows की ओर, इसे `%USERPROFILE%\.wslconfig` में जोड़ें, फिर
    `wsl --shutdown` चलाएँ:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    या कीप-अलाइव अवधि घटाएँ / केवल आवश्यकता होने पर Ollama को मैन्युअल रूप से शुरू करें:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) देखें।

  </Accordion>

  <Accordion title="Ollama का पता नहीं चला">
    पुष्टि करें कि Ollama चल रहा है, `OLLAMA_API_KEY` (या कोई प्रमाणीकरण प्रोफ़ाइल)
    सेट है, और `models.providers.ollama` स्पष्ट रूप से परिभाषित **नहीं** है:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="कोई मॉडल उपलब्ध नहीं">
    मॉडल को स्थानीय रूप से पुल करें, या उसे `models.providers.ollama` में स्पष्ट रूप से
    परिभाषित करें:

    ```bash
    ollama list  # देखें कि क्या इंस्टॉल है
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # या कोई अन्य मॉडल
    ```

  </Accordion>

  <Accordion title="कनेक्शन अस्वीकृत">
    ```bash
    # जाँचें कि Ollama चल रहा है या नहीं
    ps aux | grep ollama

    # या Ollama को पुनः शुरू करें
    ollama serve
    ```

  </Accordion>

  <Accordion title="दूरस्थ होस्ट curl के साथ काम करता है, लेकिन OpenClaw के साथ नहीं">
    उसी मशीन और रनटाइम से सत्यापित करें जो Gateway चलाता है:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    सामान्य कारण:

    - `baseUrl` `localhost` की ओर इंगित करता है, लेकिन Gateway Docker में या किसी अन्य होस्ट पर चलता है।
    - URL `/v1` का उपयोग करता है, जिससे नेटिव Ollama के बजाय OpenAI-संगत व्यवहार चुना जाता है।
    - दूरस्थ होस्ट को फ़ायरवॉल या LAN बाइंडिंग में बदलाव चाहिए।
    - मॉडल आपके लैपटॉप के डेमन पर है, लेकिन दूरस्थ डेमन पर नहीं।

  </Accordion>

  <Accordion title="मॉडल टूल JSON को टेक्स्ट के रूप में आउटपुट करता है">
    सामान्यतः प्रदाता OpenAI-संगत मोड में होता है, या मॉडल टूल स्कीमा को संभाल
    नहीं सकता। नेटिव मोड को प्राथमिकता दें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    यदि कोई छोटा स्थानीय मॉडल फिर भी टूल स्कीमा पर विफल होता है, तो उस मॉडल
    प्रविष्टि पर `compat.supportsTools: false` सेट करें और पुनः परीक्षण करें।

  </Accordion>

  <Accordion title="Kimi या GLM विकृत प्रतीक लौटाता है">
    होस्ट किए गए Kimi/GLM प्रत्युत्तर जो लंबे, गैर-भाषाई प्रतीक अनुक्रम होते हैं,
    उन्हें सफल उत्तर के बजाय विफल प्रदाता कॉल माना जाता है, ताकि दूषित टेक्स्ट
    को सत्र में सहेजने के बजाय सामान्य पुनः प्रयास/फ़ॉलबैक/त्रुटि प्रबंधन लागू हो।

    यदि यह फिर से हो, तो मॉडल का नाम, वर्तमान सत्र फ़ाइल, और रन में
    `Cloud + Local` या `Cloud only` में से किसका उपयोग हुआ था, कैप्चर
    करें; फिर नए सत्र और फ़ॉलबैक मॉडल को आज़माएँ:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "ठीक यही उत्तर दें: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="ठंडा स्थानीय मॉडल टाइम आउट हो जाता है">
    बड़े स्थानीय मॉडलों को पहली बार लोड होने में लंबा समय लग सकता है। टाइमआउट
    को Ollama प्रदाता तक सीमित करें और वैकल्पिक रूप से मॉडल को टर्न के बीच लोड
    रखा रहने दें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    यदि होस्ट स्वयं कनेक्शन स्वीकार करने में धीमा है, तो `timeoutSeconds` इस
    प्रदाता के लिए सुरक्षित कनेक्ट टाइमआउट भी बढ़ाता है।

  </Accordion>

  <Accordion title="बड़े-कॉन्टेक्स्ट वाला मॉडल बहुत धीमा है या उसकी मेमोरी समाप्त हो जाती है">
    कई मॉडल ऐसे कॉन्टेक्स्ट का दावा करते हैं जिन्हें आपका हार्डवेयर आराम से
    चला नहीं सकता। जब तक `params.num_ctx` सेट न हो, नेटिव Ollama अपने रनटाइम
    डिफ़ॉल्ट का उपयोग करता है। पूर्वानुमेय प्रथम-टोकन विलंबता के लिए OpenClaw के
    बजट और Ollama के अनुरोध कॉन्टेक्स्ट, दोनों को सीमित करें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    यदि OpenClaw बहुत अधिक प्रॉम्प्ट भेजता है, तो `contextWindow` घटाएँ।
    यदि Ollama का रनटाइम कॉन्टेक्स्ट मशीन के लिए बहुत बड़ा है, तो
    `params.num_ctx` घटाएँ। यदि जनरेशन बहुत लंबी चलती है, तो
    `maxTokens` घटाएँ।

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/hi/providers/ollama-cloud" icon="cloud">
    समर्पित `ollama-cloud` प्रदाता के साथ केवल-क्लाउड सेटअप।
  </Card>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का अवलोकन।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/models" icon="brain">
    मॉडल चुनने और कॉन्फ़िगर करने का तरीका।
  </Card>
  <Card title="Ollama वेब खोज" href="/hi/tools/ollama-search" icon="magnifying-glass">
    Ollama-संचालित वेब खोज के लिए पूर्ण सेटअप और व्यवहार विवरण।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
