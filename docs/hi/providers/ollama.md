---
read_when:
    - आप Ollama के माध्यम से क्लाउड या स्थानीय मॉडल्स के साथ OpenClaw चलाना चाहते हैं
    - आपको Ollama सेटअप और कॉन्फ़िगरेशन मार्गदर्शन चाहिए
    - आप छवि समझने के लिए Ollama विज़न मॉडल चाहते हैं
summary: OpenClaw को Ollama के साथ चलाएँ (क्लाउड और स्थानीय मॉडल)
title: Ollama
x-i18n:
    generated_at: "2026-06-29T00:01:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw होस्ट किए गए क्लाउड मॉडल और स्थानीय/स्व-होस्टेड Ollama सर्वरों के लिए Ollama के नेटिव API (`/api/chat`) के साथ एकीकृत होता है। आप Ollama को तीन मोड में उपयोग कर सकते हैं: पहुँच योग्य Ollama होस्ट के माध्यम से `Cloud + Local`, `https://ollama.com` के विरुद्ध `Cloud only`, या पहुँच योग्य Ollama होस्ट के विरुद्ध `Local only`।

OpenClaw सीधे Ollama Cloud उपयोग के लिए `ollama-cloud` को प्रथम-श्रेणी होस्टेड provider id के रूप में भी रजिस्टर करता है। जब आप स्थानीय `ollama` provider id साझा किए बिना केवल-क्लाउड routing चाहते हैं, तो `ollama-cloud/kimi-k2.5:cloud` जैसे refs का उपयोग करें।

समर्पित केवल-क्लाउड सेटअप पेज के लिए, [Ollama Cloud](/hi/providers/ollama-cloud) देखें।

<Warning>
**Remote Ollama उपयोगकर्ता**: OpenClaw के साथ `/v1` OpenAI-संगत URL (`http://host:11434/v1`) का उपयोग न करें। इससे tool calling टूट जाती है और मॉडल raw tool JSON को सादे टेक्स्ट के रूप में आउटपुट कर सकते हैं। इसके बजाय नेटिव Ollama API URL का उपयोग करें: `baseUrl: "http://host:11434"` (`/v1` नहीं)।
</Warning>

Ollama provider config canonical key के रूप में `baseUrl` का उपयोग करता है। OpenClaw OpenAI SDK-शैली के उदाहरणों के साथ compatibility के लिए `baseURL` भी स्वीकार करता है, लेकिन नए config में `baseUrl` को प्राथमिकता देनी चाहिए।

## Auth नियम

<AccordionGroup>
  <Accordion title="स्थानीय और LAN होस्ट">
    स्थानीय और LAN Ollama होस्ट को वास्तविक bearer token की आवश्यकता नहीं होती। OpenClaw केवल loopback, private-network, `.local`, और bare-hostname Ollama base URLs के लिए स्थानीय `ollama-local` marker का उपयोग करता है।
  </Accordion>
  <Accordion title="Remote और Ollama Cloud होस्ट">
    Remote public hosts और Ollama Cloud (`https://ollama.com`) को `OLLAMA_API_KEY`, auth profile, या provider के `apiKey` के माध्यम से वास्तविक credential की आवश्यकता होती है। सीधे hosted उपयोग के लिए, provider `ollama-cloud` को प्राथमिकता दें।
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"` सेट करने वाले custom provider ids समान नियमों का पालन करते हैं। उदाहरण के लिए, निजी LAN Ollama host की ओर संकेत करने वाला `ollama-remote` provider `apiKey: "ollama-local"` का उपयोग कर सकता है और sub-agents उस marker को missing credential मानने के बजाय Ollama provider hook के माध्यम से resolve करेंगे। Memory search `agents.defaults.memorySearch.provider` को उस custom provider id पर भी सेट कर सकता है ताकि embeddings मेल खाते Ollama endpoint का उपयोग करें।
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` किसी provider id के लिए credential संग्रहीत करता है। Endpoint settings (`baseUrl`, `api`, model ids, headers, timeouts) को `models.providers.<id>` में रखें। पुराने flat auth-profile files जैसे `{ "ollama-windows": { "apiKey": "ollama-local" } }` runtime format नहीं हैं; उन्हें backup के साथ canonical `ollama-windows:default` API-key profile में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ। उस file में `baseUrl` compatibility noise है और उसे provider config में ले जाना चाहिए।
  </Accordion>
  <Accordion title="Memory embedding scope">
    जब Ollama का उपयोग memory embeddings के लिए किया जाता है, तो bearer auth उसी host तक scoped होता है जहाँ उसे घोषित किया गया था:

    - Provider-level key केवल उस provider के Ollama host को भेजी जाती है।
    - `agents.*.memorySearch.remote.apiKey` केवल उसके remote embedding host को भेजी जाती है।
    - शुद्ध `OLLAMA_API_KEY` env value को Ollama Cloud convention माना जाता है, और default रूप से स्थानीय या self-hosted hosts को नहीं भेजा जाता।

  </Accordion>
</AccordionGroup>

## शुरुआत करना

अपनी पसंदीदा setup method और mode चुनें।

<Tabs>
  <Tab title="Onboarding (अनुशंसित)">
    **इसके लिए सर्वोत्तम:** काम करने वाले Ollama cloud या local setup तक सबसे तेज़ रास्ता।

    <Steps>
      <Step title="Onboarding चलाएँ">
        ```bash
        openclaw onboard
        ```

        Provider list से **Ollama** चुनें।
      </Step>
      <Step title="अपना mode चुनें">
        - **क्लाउड + स्थानीय** — स्थानीय Ollama host और उस host के माध्यम से routed cloud models
        - **केवल क्लाउड** — `https://ollama.com` के माध्यम से hosted Ollama models
        - **केवल स्थानीय** — केवल स्थानीय models

      </Step>
      <Step title="एक model चुनें">
        `Cloud only` `OLLAMA_API_KEY` के लिए prompt करता है और hosted cloud defaults सुझाता है। `Cloud + Local` और `Local only` Ollama base URL माँगते हैं, उपलब्ध models discover करते हैं, और चयनित local model अभी उपलब्ध न होने पर उसे auto-pull करते हैं। जब Ollama `gemma4:latest` जैसा installed `:latest` tag report करता है, तो setup `gemma4` और `gemma4:latest` दोनों दिखाने या bare alias को फिर से pull करने के बजाय उस installed model को एक बार दिखाता है। `Cloud + Local` यह भी जाँचता है कि वह Ollama host cloud access के लिए signed in है या नहीं।
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Non-interactive mode

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    वैकल्पिक रूप से custom base URL या model निर्दिष्ट करें:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **इसके लिए सर्वोत्तम:** cloud या local setup पर पूरा नियंत्रण।

    <Steps>
      <Step title="Cloud या local चुनें">
        - **क्लाउड + स्थानीय**: Ollama install करें, `ollama signin` से sign in करें, और cloud requests को उस host के माध्यम से route करें
        - **केवल क्लाउड**: `OLLAMA_API_KEY` के साथ `https://ollama.com` का उपयोग करें
        - **केवल स्थानीय**: [ollama.com/download](https://ollama.com/download) से Ollama install करें

      </Step>
      <Step title="Local model pull करें (केवल local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw के लिए Ollama enable करें">
        `Cloud only` के लिए, अपना वास्तविक `OLLAMA_API_KEY` उपयोग करें। Host-backed setups के लिए, कोई भी placeholder value काम करती है:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="अपने model का निरीक्षण करें और सेट करें">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        या config में default सेट करें:

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

## Cloud models

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` स्थानीय और cloud models दोनों के लिए control point के रूप में पहुँच योग्य Ollama host का उपयोग करता है। यह Ollama का पसंदीदा hybrid flow है।

    Setup के दौरान **Cloud + Local** का उपयोग करें। OpenClaw Ollama base URL के लिए prompt करता है, उस host से local models discover करता है, और `ollama signin` के साथ जाँचता है कि host cloud access के लिए signed in है या नहीं। जब host signed in होता है, तो OpenClaw `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, और `glm-5.1:cloud` जैसे hosted cloud defaults भी सुझाता है।

    यदि host अभी signed in नहीं है, तो जब तक आप `ollama signin` नहीं चलाते OpenClaw setup को local-only रखता है।

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` `https://ollama.com` पर Ollama के hosted API के विरुद्ध चलता है।

    Setup के दौरान **Cloud only** का उपयोग करें। OpenClaw `OLLAMA_API_KEY` के लिए prompt करता है, `baseUrl: "https://ollama.com"` सेट करता है, और hosted cloud model list seed करता है। इस path को local Ollama server या `ollama signin` की आवश्यकता **नहीं** है।

    `openclaw onboard` के दौरान दिखाई गई cloud model list `https://ollama.com/api/tags` से live populate होती है, 500 entries तक सीमित होती है, इसलिए picker static seed के बजाय वर्तमान hosted catalog को दर्शाता है। यदि `ollama.com` setup time पर unreachable है या कोई model return नहीं करता, तो OpenClaw पिछले hardcoded suggestions पर fall back करता है ताकि onboarding फिर भी पूरा हो जाए।

    आप first-class cloud provider को सीधे भी configure कर सकते हैं:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Local-only mode में, OpenClaw configured Ollama instance से models discover करता है। यह path local या self-hosted Ollama servers के लिए है।

    OpenClaw currently `gemma4` को local default के रूप में सुझाता है।

  </Tab>
</Tabs>

## Model discovery (implicit provider)

जब आप `OLLAMA_API_KEY` (या auth profile) सेट करते हैं और `models.providers.ollama` या `api: "ollama"` वाले किसी अन्य custom remote provider को define **नहीं** करते, तो OpenClaw `http://127.0.0.1:11434` पर स्थानीय Ollama instance से models discover करता है।

| व्यवहार             | विवरण                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog query        | `/api/tags` query करता है                                                                                                                                                  |
| Capability detection | `contextWindow`, expanded `num_ctx` Modelfile parameters, और vision/tools सहित capabilities पढ़ने के लिए best-effort `/api/show` lookups का उपयोग करता है                       |
| Vision models        | `/api/show` द्वारा report की गई `vision` capability वाले models को image-capable (`input: ["text", "image"]`) के रूप में mark किया जाता है, इसलिए OpenClaw images को prompt में auto-inject करता है  |
| Reasoning detection  | उपलब्ध होने पर `/api/show` capabilities का उपयोग करता है, जिसमें `thinking` भी शामिल है; जब Ollama capabilities omit करता है, तो model-name heuristic (`r1`, `reasoning`, `think`) पर fall back करता है |
| Token limits         | `maxTokens` को OpenClaw द्वारा उपयोग किए जाने वाले default Ollama max-token cap पर सेट करता है                                                                                                |
| Costs                | सभी costs को `0` पर सेट करता है                                                                                                                                                |

यह manual model entries से बचाता है और catalog को स्थानीय Ollama instance के साथ aligned रखता है। आप local `infer model run` में `ollama/<pulled-model>:latest` जैसे full ref का उपयोग कर सकते हैं; OpenClaw hand-written `models.json` entry की आवश्यकता के बिना Ollama के live catalog से उस installed model को resolve करता है।

Signed-in Ollama hosts के लिए, कुछ `:cloud` models `/api/tags` में दिखाई देने से पहले `/api/chat`
और `/api/show` के माध्यम से usable हो सकते हैं। जब आप explicit रूप से full
`ollama/<model>:cloud` ref चुनते हैं, तो OpenClaw उस exact missing model को
`/api/show` से validate करता है और केवल तभी उसे runtime catalog में जोड़ता है जब Ollama model
metadata confirm करता है। Typos अब भी auto-created होने के बजाय unknown models के रूप में fail होते हैं।

```bash
# See what models are available
ollama list
openclaw models list
```

Full agent tool surface से बचने वाले narrow text-generation smoke test के लिए,
full Ollama model ref के साथ local `infer model run` का उपयोग करें:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

वह path अब भी OpenClaw के configured provider, auth, और native Ollama
transport का उपयोग करता है, लेकिन chat-agent turn शुरू नहीं करता या MCP/tool context load नहीं करता। यदि
यह सफल होता है जबकि normal agent replies fail होते हैं, तो आगे model के agent
prompt/tool capacity को troubleshoot करें।

उसी lean path पर narrow vision-model smoke test के लिए, `infer model run` में एक या अधिक
image files जोड़ें। यह prompt और image को chat tools, memory, या prior
session context load किए बिना सीधे selected Ollama vision model को भेजता है:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` `image/*` के रूप में पहचानी गई फ़ाइलें स्वीकार करता है, जिनमें सामान्य PNG,
JPEG, और WebP इनपुट शामिल हैं। गैर-इमेज फ़ाइलें Ollama को कॉल करने से पहले अस्वीकार कर दी जाती हैं।
स्पीच रिकग्निशन के लिए, इसके बजाय `openclaw infer audio transcribe` का उपयोग करें।

जब आप किसी बातचीत को `/model ollama/<model>` से स्विच करते हैं, OpenClaw इसे
उपयोगकर्ता के सटीक चयन के रूप में मानता है। यदि कॉन्फ़िगर किया गया Ollama `baseUrl`
पहुँच योग्य नहीं है, तो अगला उत्तर किसी अन्य कॉन्फ़िगर किए गए फॉलबैक मॉडल से चुपचाप
उत्तर देने के बजाय प्रदाता त्रुटि के साथ विफल हो जाता है।

आइसोलेटेड Cron जॉब्स एजेंट टर्न शुरू करने से पहले एक अतिरिक्त स्थानीय सुरक्षा जाँच करते हैं।
यदि चयनित मॉडल किसी लोकल, प्राइवेट-नेटवर्क, या `.local` Ollama प्रदाता पर रिज़ॉल्व होता है
और `/api/tags` पहुँच योग्य नहीं है, तो OpenClaw उस Cron रन को त्रुटि टेक्स्ट में चयनित
`ollama/<model>` के साथ `skipped` के रूप में रिकॉर्ड करता है। एंडपॉइंट प्रीफ़्लाइट
5 मिनट के लिए कैश होता है, इसलिए एक ही बंद Ollama डेमन की ओर इंगित कई Cron जॉब्स
सभी विफल मॉडल अनुरोध लॉन्च नहीं करते।

लोकल Ollama के विरुद्ध स्थानीय टेक्स्ट पाथ, नेटिव स्ट्रीम पाथ, और एम्बेडिंग्स को लाइव सत्यापित करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API-की स्मोक टेस्ट के लिए, लाइव टेस्ट को `https://ollama.com`
पर इंगित करें और मौजूदा कैटलॉग से एक होस्टेड मॉडल चुनें:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

क्लाउड स्मोक टेक्स्ट, नेटिव स्ट्रीम, और वेब खोज चलाता है। यह `https://ollama.com`
के लिए डिफ़ॉल्ट रूप से एम्बेडिंग्स छोड़ देता है क्योंकि Ollama Cloud API कीज़
`/api/embed` को अधिकृत नहीं कर सकतीं। जब आप स्पष्ट रूप से चाहते हैं कि कॉन्फ़िगर की गई
क्लाउड की एम्बेड एंडपॉइंट का उपयोग नहीं कर सकती तो लाइव टेस्ट विफल हो, तब
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` सेट करें।

नया मॉडल जोड़ने के लिए, उसे बस Ollama के साथ पुल करें:

```bash
ollama pull mistral
```

नया मॉडल अपने आप खोज लिया जाएगा और उपयोग के लिए उपलब्ध होगा।

<Note>
यदि आप `models.providers.ollama` को स्पष्ट रूप से सेट करते हैं, या `api: "ollama"` के साथ `models.providers.ollama-cloud` जैसे कस्टम रिमोट प्रदाता को कॉन्फ़िगर करते हैं, तो ऑटो-डिस्कवरी छोड़ दी जाती है और आपको मॉडल मैन्युअली परिभाषित करने होंगे। `http://127.0.0.2:11434` जैसे लूपबैक कस्टम प्रदाता अब भी लोकल माने जाते हैं। नीचे स्पष्ट कॉन्फ़िग सेक्शन देखें।
</Note>

## विज़न और इमेज विवरण

बंडल किया गया Ollama Plugin, Ollama को इमेज-सक्षम मीडिया-अंडरस्टैंडिंग प्रदाता के रूप में रजिस्टर करता है। इससे OpenClaw स्पष्ट इमेज-विवरण अनुरोधों और कॉन्फ़िगर किए गए इमेज-मॉडल डिफ़ॉल्ट्स को लोकल या होस्टेड Ollama विज़न मॉडल्स के माध्यम से रूट कर सकता है।

लोकल विज़न के लिए, ऐसा मॉडल पुल करें जो इमेज सपोर्ट करता हो:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

फिर infer CLI से सत्यापित करें:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` एक पूरा `<provider/model>` रेफ़ होना चाहिए। जब यह सेट होता है, तो `openclaw infer image describe` उस मॉडल को सीधे चलाता है, विवरण को इसलिए छोड़ने के बजाय कि मॉडल नेटिव विज़न सपोर्ट करता है।

जब आप OpenClaw का इमेज-अंडरस्टैंडिंग प्रदाता फ्लो, कॉन्फ़िगर किया गया `agents.defaults.imageModel`, और इमेज-विवरण आउटपुट आकार चाहते हैं, तब `infer image describe` का उपयोग करें। जब आप कस्टम प्रॉम्प्ट और एक या अधिक इमेज के साथ कच्चा मल्टीमॉडल मॉडल प्रोब चाहते हैं, तब `infer model run --file` का उपयोग करें।

इनबाउंड मीडिया के लिए Ollama को डिफ़ॉल्ट इमेज-अंडरस्टैंडिंग मॉडल बनाने के लिए, `agents.defaults.imageModel` कॉन्फ़िगर करें:

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

पूरा `ollama/<model>` रेफ़ प्राथमिकता दें। यदि वही मॉडल `models.providers.ollama.models` के अंतर्गत `input: ["text", "image"]` के साथ सूचीबद्ध है और कोई अन्य कॉन्फ़िगर किया गया इमेज प्रदाता उस बेयर मॉडल ID को एक्सपोज़ नहीं करता, तो OpenClaw `qwen2.5vl:7b` जैसे बेयर `imageModel` रेफ़ को भी `ollama/qwen2.5vl:7b` में नॉर्मलाइज़ करता है। यदि एक से अधिक कॉन्फ़िगर किए गए इमेज प्रदाताओं के पास वही बेयर ID है, तो प्रदाता प्रीफ़िक्स स्पष्ट रूप से उपयोग करें।

धीमे लोकल विज़न मॉडल्स को क्लाउड मॉडल्स की तुलना में अधिक लंबा इमेज-अंडरस्टैंडिंग टाइमआउट चाहिए हो सकता है। वे सीमित हार्डवेयर पर Ollama द्वारा पूरे विज्ञापित विज़न कॉन्टेक्स्ट को आवंटित करने की कोशिश करने पर क्रैश या बंद भी हो सकते हैं। जब आपको केवल सामान्य इमेज-विवरण टर्न चाहिए, तो कैपेबिलिटी टाइमआउट सेट करें और मॉडल एंट्री पर `num_ctx` सीमित करें:

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

यह टाइमआउट इनबाउंड इमेज अंडरस्टैंडिंग और उस स्पष्ट `image` टूल पर लागू होता है जिसे एजेंट टर्न के दौरान कॉल कर सकता है। प्रदाता-स्तर का `models.providers.ollama.timeoutSeconds` अब भी सामान्य मॉडल कॉल्स के लिए अंतर्निहित Ollama HTTP अनुरोध गार्ड को नियंत्रित करता है।

लोकल Ollama के विरुद्ध स्पष्ट इमेज टूल को लाइव सत्यापित करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

यदि आप `models.providers.ollama.models` को मैन्युअली परिभाषित करते हैं, तो विज़न मॉडल्स को इमेज इनपुट सपोर्ट के साथ चिह्नित करें:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw उन मॉडल्स के लिए इमेज-विवरण अनुरोध अस्वीकार करता है जिन्हें इमेज-सक्षम के रूप में चिह्नित नहीं किया गया है। इम्प्लिसिट डिस्कवरी के साथ, जब `/api/show` विज़न कैपेबिलिटी रिपोर्ट करता है, तो OpenClaw इसे Ollama से पढ़ता है।

## कॉन्फ़िगरेशन

<Tabs>
  <Tab title="Basic (implicit discovery)">
    सबसे सरल लोकल-ओनली सक्षम करने का पाथ एनवायरनमेंट वेरिएबल के माध्यम से है:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    यदि `OLLAMA_API_KEY` सेट है, तो आप प्रदाता एंट्री में `apiKey` छोड़ सकते हैं और OpenClaw उपलब्धता जाँचों के लिए इसे भर देगा।
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    जब आप होस्टेड क्लाउड सेटअप चाहते हैं, Ollama किसी अन्य होस्ट/पोर्ट पर चलता है, आप विशिष्ट कॉन्टेक्स्ट विंडो या मॉडल सूची बाध्य करना चाहते हैं, या पूरी तरह मैन्युअल मॉडल परिभाषाएँ चाहते हैं, तब स्पष्ट कॉन्फ़िग का उपयोग करें।

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

  <Tab title="Custom base URL">
    यदि Ollama किसी अलग होस्ट या पोर्ट पर चल रहा है (स्पष्ट कॉन्फ़िग ऑटो-डिस्कवरी अक्षम करता है, इसलिए मॉडल्स मैन्युअली परिभाषित करें):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    URL में `/v1` न जोड़ें। `/v1` पाथ OpenAI-संगत मोड का उपयोग करता है, जहाँ टूल कॉलिंग भरोसेमंद नहीं है। बिना पाथ सफ़िक्स वाला बेस Ollama URL उपयोग करें।
    </Warning>

  </Tab>
</Tabs>

## सामान्य रेसिपी

इन्हें शुरुआती बिंदुओं के रूप में उपयोग करें और मॉडल IDs को `ollama list` या `openclaw models list --provider ollama` से मिले सटीक नामों से बदलें।

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    इसका उपयोग तब करें जब Ollama Gateway वाली उसी मशीन पर चलता है और आप चाहते हैं कि OpenClaw इंस्टॉल किए गए मॉडल्स को अपने आप खोजे।

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    यह पाथ कॉन्फ़िग को न्यूनतम रखता है। जब तक आप मॉडल्स मैन्युअली परिभाषित नहीं करना चाहते, `models.providers.ollama` ब्लॉक न जोड़ें।

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    LAN होस्ट्स के लिए नेटिव Ollama URLs उपयोग करें। `/v1` न जोड़ें।

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

    `contextWindow` OpenClaw-साइड कॉन्टेक्स्ट बजट है। `params.num_ctx` अनुरोध के लिए Ollama को भेजा जाता है। जब आपका हार्डवेयर मॉडल के पूरे विज्ञापित कॉन्टेक्स्ट को नहीं चला सकता, तो इन्हें संरेखित रखें।

  </Accordion>

  <Accordion title="Ollama Cloud only">
    इसका उपयोग तब करें जब आप लोकल डेमन नहीं चलाते और सीधे होस्टेड Ollama मॉडल्स चाहते हैं।

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

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    इसका उपयोग तब करें जब लोकल या LAN Ollama डेमन `ollama signin` के साथ साइन इन है और उसे लोकल मॉडल्स और `:cloud` मॉडल्स दोनों सर्व करने चाहिए।

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

  <Accordion title="Multiple Ollama hosts">
    जब आपके पास एक से अधिक Ollama सर्वर हों, तब कस्टम प्रदाता IDs का उपयोग करें। प्रत्येक प्रदाता को अपना होस्ट, मॉडल्स, ऑथ, टाइमआउट, और मॉडल रेफ़्स मिलते हैं।

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

    जब OpenClaw अनुरोध भेजता है, तो सक्रिय प्रदाता prefix हटा दिया जाता है ताकि `ollama-large/qwen3.5:27b` Ollama तक `qwen3.5:27b` के रूप में पहुंचे।

  </Accordion>

  <Accordion title="Lean local model profile">
    कुछ स्थानीय मॉडल सरल prompts का उत्तर दे सकते हैं, लेकिन पूरे agent tool surface के साथ संघर्ष करते हैं। वैश्विक runtime settings बदलने से पहले tools और context को सीमित करके शुरू करें।

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

    `compat.supportsTools: false` का उपयोग केवल तब करें जब मॉडल या server tool schemas पर विश्वसनीय रूप से विफल होता हो। यह स्थिरता के लिए agent capability का समझौता करता है।
    `localModelLean` direct agent surface से browser, cron, और message tools को हटाता है और बड़े catalogs को structured Tool Search controls के पीछे default करता है, सिवाय तब जब किसी run को direct message delivery semantics बनाए रखना जरूरी हो, लेकिन यह Ollama के runtime context या thinking mode को नहीं बदलता। छोटे Qwen-शैली thinking models के लिए इसे explicit `params.num_ctx` और `params.thinking: false` के साथ जोड़ें, जो loop करते हैं या अपना response budget hidden reasoning पर खर्च करते हैं।

  </Accordion>
</AccordionGroup>

### मॉडल चयन

Configure हो जाने के बाद, आपके सभी Ollama models उपलब्ध होते हैं:

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

Custom Ollama provider ids भी समर्थित हैं। जब कोई model ref active
provider prefix का उपयोग करता है, जैसे `ollama-spark/qwen3:32b`, तो OpenClaw Ollama को call करने से पहले केवल वही
prefix हटाता है ताकि server को `qwen3:32b` मिले।

धीमे local models के लिए, पूरे agent runtime timeout को बढ़ाने से पहले
provider-scoped request tuning को प्राथमिकता दें:

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

`timeoutSeconds` model HTTP request पर लागू होता है, जिसमें connection setup,
headers, body streaming, और total guarded-fetch abort शामिल हैं। `params.keep_alive`
native `/api/chat` requests पर top-level `keep_alive` के रूप में Ollama को forward किया जाता है;
जब first-turn load time bottleneck हो, तो इसे per model set करें।

### त्वरित सत्यापन

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Remote hosts के लिए, `127.0.0.1` को `baseUrl` में उपयोग किए गए host से बदलें। यदि `curl` काम करता है लेकिन OpenClaw नहीं करता, तो जांचें कि क्या Gateway किसी अलग machine, container, या service account पर चल रहा है।

## Ollama Web Search

OpenClaw bundled `web_search` provider के रूप में **Ollama Web Search** का समर्थन करता है।

| गुण | विवरण |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| होस्ट | आपके configured Ollama host का उपयोग करता है (`models.providers.ollama.baseUrl` set होने पर, अन्यथा `http://127.0.0.1:11434`); `https://ollama.com` hosted API का सीधे उपयोग करता है |
| प्रमाणीकरण | signed-in local Ollama hosts के लिए key-free; direct `https://ollama.com` search या auth-protected hosts के लिए `OLLAMA_API_KEY` या configured provider auth |
| आवश्यकता | Local/self-hosted hosts चल रहे होने चाहिए और `ollama signin` के साथ signed in होने चाहिए; direct hosted search के लिए `baseUrl: "https://ollama.com"` और वास्तविक Ollama API key चाहिए |

`openclaw onboard` या `openclaw configure --section web` के दौरान **Ollama Web Search** चुनें, या set करें:

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

Ollama Cloud के माध्यम से direct hosted search के लिए:

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

Signed-in local daemon के लिए, OpenClaw daemon के `/api/experimental/web_search` proxy का उपयोग करता है। `https://ollama.com` के लिए, यह hosted `/api/web_search` endpoint को सीधे call करता है।

<Note>
पूरे setup और behavior details के लिए, [Ollama Web Search](/hi/tools/ollama-search) देखें।
</Note>

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **OpenAI-compatible mode में tool calling विश्वसनीय नहीं है।** इस mode का उपयोग केवल तब करें जब आपको proxy के लिए OpenAI format चाहिए और आप native tool calling behavior पर निर्भर नहीं हैं।
    </Warning>

    यदि आपको इसके बजाय OpenAI-compatible endpoint का उपयोग करना है (उदाहरण के लिए, ऐसे proxy के पीछे जो केवल OpenAI format का समर्थन करता है), तो `api: "openai-completions"` स्पष्ट रूप से set करें:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    यह mode streaming और tool calling को साथ-साथ support नहीं कर सकता। आपको model config में `params: { streaming: false }` के साथ streaming disable करनी पड़ सकती है।

    जब Ollama के साथ `api: "openai-completions"` उपयोग किया जाता है, तो OpenClaw default रूप से `options.num_ctx` inject करता है ताकि Ollama चुपचाप 4096 context window पर वापस न चला जाए। यदि आपका proxy/upstream अज्ञात `options` fields को reject करता है, तो इस behavior को disable करें:

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

  <Accordion title="Context windows">
    Auto-discovered models के लिए, OpenClaw उपलब्ध होने पर Ollama द्वारा report की गई context window का उपयोग करता है, जिसमें custom Modelfiles से बड़े `PARAMETER num_ctx` values शामिल हैं। अन्यथा यह OpenClaw द्वारा उपयोग की जाने वाली default Ollama context window पर fallback करता है।

    आप उस Ollama provider के अंतर्गत हर model के लिए provider-level `contextWindow`, `contextTokens`, और `maxTokens` defaults set कर सकते हैं, फिर जरूरत पड़ने पर per model उन्हें override कर सकते हैं। `contextWindow` OpenClaw का prompt और compaction budget है। Native Ollama requests `options.num_ctx` को unset छोड़ते हैं जब तक आप स्पष्ट रूप से `params.num_ctx` configure न करें, ताकि Ollama अपना model, `OLLAMA_CONTEXT_LENGTH`, या VRAM-based default लागू कर सके। Modelfile rebuild किए बिना Ollama के per-request runtime context को cap या force करने के लिए, `params.num_ctx` set करें; invalid, zero, negative, और non-finite values ignore किए जाते हैं। यदि आपने पुराने config को upgrade किया है जो native Ollama request context को force करने के लिए केवल `contextWindow` या `maxTokens` का उपयोग करता था, तो उन explicit provider या model budgets को `params.num_ctx` में copy करने के लिए `openclaw doctor --fix` चलाएं। OpenAI-compatible Ollama adapter अब भी configured `params.num_ctx` या `contextWindow` से default रूप से `options.num_ctx` inject करता है; यदि आपका upstream `options` reject करता है, तो उसे `injectNumCtxForOpenAICompat: false` के साथ disable करें।

    Native Ollama model entries `params` के अंतर्गत common Ollama runtime options भी accept करती हैं, जिनमें `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, और `use_mmap` शामिल हैं। OpenClaw केवल Ollama request keys forward करता है, इसलिए `streaming` जैसे OpenClaw runtime params Ollama तक leak नहीं होते। Top-level Ollama `think` भेजने के लिए `params.think` या `params.thinking` का उपयोग करें; `false` Qwen-शैली thinking models के लिए API-level thinking disable करता है।

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

    Per-model `agents.defaults.models["ollama/<model>"].params.num_ctx` भी काम करता है। यदि दोनों configured हैं, तो explicit provider model entry agent default पर प्राथमिकता पाती है।

  </Accordion>

  <Accordion title="Thinking control">
    Native Ollama models के लिए, OpenClaw thinking control को उसी तरह forward करता है जैसे Ollama अपेक्षा करता है: top-level `think`, `options.think` नहीं। Auto-discovered models जिनकी `/api/show` response में `thinking` capability शामिल है, `/think low`, `/think medium`, `/think high`, और `/think max` expose करते हैं; non-thinking models केवल `/think off` expose करते हैं।

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    आप model default भी set कर सकते हैं:

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

    Per-model `params.think` या `params.thinking` किसी specific configured model के लिए Ollama API thinking को disable या force कर सकता है। OpenClaw उन explicit model params को preserve करता है जब active run में केवल implicit default `off` होता है; `/think medium` जैसे non-off runtime commands अब भी active run को override करते हैं।

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw `deepseek-r1`, `reasoning`, या `think` जैसे नामों वाले models को default रूप से reasoning-capable मानता है।

    ```bash
    ollama pull deepseek-r1:32b
    ```

    कोई अतिरिक्त configuration जरूरी नहीं है। OpenClaw उन्हें automatically mark करता है।

  </Accordion>

  <Accordion title="Model costs">
    Ollama free है और locally चलता है, इसलिए सभी model costs $0 पर set किए जाते हैं। यह auto-discovered और manually defined दोनों models पर लागू होता है।
  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग">
    बंडल किया गया Ollama plugin
    [मेमोरी खोज](/hi/concepts/memory) के लिए एक मेमोरी एम्बेडिंग provider पंजीकृत करता है। यह कॉन्फ़िगर किए गए Ollama base URL
    और API कुंजी का उपयोग करता है, Ollama के वर्तमान `/api/embed` endpoint को कॉल करता है, और संभव होने पर
    कई मेमोरी chunks को एक `input` अनुरोध में batch करता है।

    जब `proxy.enabled=true` होता है, तो कॉन्फ़िगर किए गए `baseUrl` से निकले ठीक
    host-local loopback origin पर Ollama मेमोरी एम्बेडिंग अनुरोध managed forward proxy के बजाय
    OpenClaw के guarded direct path का उपयोग करते हैं। कॉन्फ़िगर किया गया hostname स्वयं `localhost` या कोई loopback IP literal होना चाहिए;
    DNS नाम जो केवल loopback पर resolve होते हैं, वे फिर भी managed proxy path का उपयोग करते हैं।
    LAN, tailnet, private-network, और public Ollama hosts भी
    managed proxy path पर ही रहते हैं। किसी दूसरे host या port पर redirects trust inherit नहीं करते।
    Operators फिर भी loopback traffic को proxy के माध्यम से भेजने के लिए global `proxy.loopbackMode: "proxy"` setting सेट कर सकते हैं,
    या connection खोलने से पहले loopback connections को deny करने के लिए `proxy.loopbackMode: "block"` सेट कर सकते हैं; इस setting के
    process-wide प्रभाव के लिए
    [Managed proxy](/hi/security/network-proxy#gateway-loopback-mode) देखें।

    | Property      | Value               |
    | ------------- | ------------------- |
    | Default model | `nomic-embed-text`  |
    | Auto-pull     | हाँ — embedding model स्थानीय रूप से मौजूद न होने पर अपने-आप pull किया जाता है |

    Query-time embeddings उन models के लिए retrieval prefixes का उपयोग करते हैं जिन्हें उनकी आवश्यकता होती है या जिनके लिए वे recommended हैं, जिनमें `nomic-embed-text`, `qwen3-embedding`, और `mxbai-embed-large` शामिल हैं। मेमोरी document batches raw रहती हैं ताकि existing indexes को format migration की आवश्यकता न पड़े।

    Ollama को memory search embedding provider के रूप में चुनने के लिए:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    remote embedding host के लिए, auth को उसी host तक scoped रखें:

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

  <Accordion title="Streaming कॉन्फ़िगरेशन">
    OpenClaw का Ollama integration default रूप से **native Ollama API** (`/api/chat`) का उपयोग करता है, जो streaming और tool calling दोनों को एक साथ पूरी तरह support करता है। किसी विशेष configuration की आवश्यकता नहीं है।

    native `/api/chat` अनुरोधों के लिए, OpenClaw thinking control को भी सीधे Ollama तक forward करता है: `/think off` और `openclaw agent --thinking off` top-level `think: false` भेजते हैं, जब तक कि कोई explicit model `params.think`/`params.thinking` value configured न हो, जबकि `/think low|medium|high` matching top-level `think` effort string भेजते हैं। `/think max` Ollama के highest native effort, `think: "high"` पर map होता है।

    <Tip>
    यदि आपको OpenAI-compatible endpoint का उपयोग करना है, तो ऊपर "Legacy OpenAI-compatible mode" अनुभाग देखें। उस mode में streaming और tool calling एक साथ काम नहीं कर सकते।
    </Tip>

  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="WSL2 crash loop (बार-बार reboot)">
    NVIDIA/CUDA के साथ WSL2 पर, official Ollama Linux installer `Restart=always` के साथ एक `ollama.service` systemd unit बनाता है। यदि वह service autostart होती है और WSL2 boot के दौरान GPU-backed model load करती है, तो model load होते समय Ollama host memory को pin कर सकता है। Hyper-V memory reclaim हमेशा उन pinned pages को reclaim नहीं कर पाता, इसलिए Windows WSL2 VM को terminate कर सकता है, systemd Ollama को फिर से शुरू करता है, और loop दोहराता है।

    सामान्य evidence:

    - Windows side से बार-बार WSL2 reboot या termination
    - WSL2 startup के तुरंत बाद `app.slice` या `ollama.service` में high CPU
    - Linux OOM-killer event के बजाय systemd से SIGTERM

    OpenClaw startup warning log करता है जब उसे WSL2, `Restart=always` के साथ enabled `ollama.service`, और visible CUDA markers मिलते हैं।

    Mitigation:

    ```bash
    sudo systemctl disable ollama
    ```

    इसे Windows side पर `%USERPROFILE%\.wslconfig` में जोड़ें, फिर `wsl --shutdown` चलाएँ:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama service environment में shorter keep-alive सेट करें, या Ollama को केवल जरूरत पड़ने पर manually start करें:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) देखें।

  </Accordion>

  <Accordion title="Ollama detect नहीं हुआ">
    सुनिश्चित करें कि Ollama चल रहा है और आपने `OLLAMA_API_KEY` (या कोई auth profile) सेट किया है, और आपने explicit `models.providers.ollama` entry define **नहीं** की है:

    ```bash
    ollama serve
    ```

    सत्यापित करें कि API accessible है:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="कोई model उपलब्ध नहीं">
    यदि आपका model सूचीबद्ध नहीं है, तो model को locally pull करें या उसे `models.providers.ollama` में explicitly define करें।

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    जाँचें कि Ollama सही port पर चल रहा है:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host curl के साथ काम करता है लेकिन OpenClaw के साथ नहीं">
    उसी machine और runtime से सत्यापित करें जो Gateway चलाता है:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    सामान्य कारण:

    - `baseUrl` `localhost` की ओर point करता है, लेकिन Gateway Docker में या किसी दूसरे host पर चलता है।
    - URL `/v1` का उपयोग करता है, जो native Ollama के बजाय OpenAI-compatible behavior चुनता है।
    - remote host को Ollama side पर firewall या LAN binding changes की आवश्यकता है।
    - model आपके laptop के daemon पर मौजूद है, लेकिन remote daemon पर नहीं।

  </Accordion>

  <Accordion title="Model tool JSON को text के रूप में output करता है">
    इसका आम तौर पर मतलब है कि provider OpenAI-compatible mode का उपयोग कर रहा है या model tool schemas handle नहीं कर सकता।

    native Ollama mode को prefer करें:

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

    यदि कोई छोटा local model फिर भी tool schemas पर fail होता है, तो उस model entry पर `compat.supportsTools: false` सेट करें और retest करें।

  </Accordion>

  <Accordion title="Kimi या GLM garbled symbols लौटाता है">
    Hosted Kimi/GLM responses जो लंबे, non-linguistic symbol runs होते हैं, उन्हें successful assistant answer के बजाय failed provider output माना जाता है। इससे corrupted text को session में persist किए बिना normal retry, fallback, या error handling take over कर सकते हैं।

    यदि यह बार-बार होता है, तो raw model name, current session file, और यह कि run ने `Cloud + Local` या `Cloud only` का उपयोग किया था, capture करें, फिर fresh session और fallback model आज़माएँ:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model timeout हो जाता है">
    बड़े local models को streaming शुरू होने से पहले लंबे first load की आवश्यकता हो सकती है। timeout को Ollama provider तक scoped रखें, और वैकल्पिक रूप से Ollama से turns के बीच model को loaded रखने के लिए कहें:

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

    यदि host स्वयं connections accept करने में धीमा है, तो `timeoutSeconds` इस provider के लिए guarded Undici connect timeout को भी extend करता है।

  </Accordion>

  <Accordion title="Large-context model बहुत धीमा है या memory खत्म हो जाती है">
    कई Ollama models ऐसे contexts advertise करते हैं जो आपके hardware के आराम से चलाने की क्षमता से बड़े होते हैं। Native Ollama अपना runtime context default उपयोग करता है, जब तक कि आप `params.num_ctx` सेट न करें। जब आपको predictable first-token latency चाहिए, तो OpenClaw के budget और Ollama के request context दोनों को cap करें:

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

    यदि OpenClaw बहुत अधिक prompt भेज रहा है, तो पहले `contextWindow` घटाएँ। यदि Ollama machine के लिए बहुत बड़ा runtime context load कर रहा है, तो `params.num_ctx` घटाएँ। यदि generation बहुत लंबा चलता है, तो `maxTokens` घटाएँ।

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model providers" href="/hi/concepts/model-providers" icon="layers">
    सभी providers, model refs, और failover behavior का overview।
  </Card>
  <Card title="Model selection" href="/hi/concepts/models" icon="brain">
    models को चुनने और configure करने का तरीका।
  </Card>
  <Card title="Ollama Web Search" href="/hi/tools/ollama-search" icon="magnifying-glass">
    Ollama-powered web search के लिए पूरा setup और behavior details।
  </Card>
  <Card title="Configuration" href="/hi/gateway/configuration" icon="gear">
    पूरा config reference।
  </Card>
</CardGroup>
