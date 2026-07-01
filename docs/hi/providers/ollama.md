---
read_when:
    - आप Ollama के माध्यम से क्लाउड या स्थानीय मॉडल के साथ OpenClaw चलाना चाहते हैं
    - आपको Ollama सेटअप और कॉन्फ़िगरेशन मार्गदर्शन की आवश्यकता है
    - आप छवि समझने के लिए Ollama विज़न मॉडल चाहते हैं
summary: OpenClaw को Ollama के साथ चलाएँ (क्लाउड और स्थानीय मॉडल)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:45:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw, होस्टेड क्लाउड मॉडल और लोकल/स्व-होस्टेड Ollama सर्वरों के लिए Ollama की नेटिव API (`/api/chat`) के साथ एकीकृत होता है। आप Ollama को तीन मोड में उपयोग कर सकते हैं: पहुँच योग्य Ollama होस्ट के माध्यम से `Cloud + Local`, `https://ollama.com` के विरुद्ध `Cloud only`, या पहुँच योग्य Ollama होस्ट के विरुद्ध `Local only`।

OpenClaw सीधे Ollama Cloud उपयोग के लिए `ollama-cloud` को प्रथम-श्रेणी होस्टेड प्रदाता id के रूप में भी पंजीकृत करता है। जब आप लोकल `ollama` प्रदाता id साझा किए बिना केवल-क्लाउड रूटिंग चाहते हों, तो `ollama-cloud/kimi-k2.5:cloud` जैसे refs उपयोग करें।

समर्पित केवल-क्लाउड सेटअप पेज के लिए, [Ollama Cloud](/hi/providers/ollama-cloud) देखें।

<Warning>
**Remote Ollama users**: OpenClaw के साथ `/v1` OpenAI-संगत URL (`http://host:11434/v1`) का उपयोग न करें। इससे टूल कॉलिंग टूट जाती है और मॉडल कच्चे टूल JSON को सादे टेक्स्ट के रूप में आउटपुट कर सकते हैं। इसके बजाय नेटिव Ollama API URL का उपयोग करें: `baseUrl: "http://host:11434"` (`/v1` नहीं)।
</Warning>

Ollama प्रदाता कॉन्फिग में `baseUrl` कैननिकल कुंजी के रूप में उपयोग होता है। OpenClaw, OpenAI SDK-शैली उदाहरणों के साथ संगतता के लिए `baseURL` भी स्वीकार करता है, लेकिन नए कॉन्फिग में `baseUrl` को प्राथमिकता देनी चाहिए।

## प्रमाणीकरण नियम

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    लोकल और LAN Ollama होस्ट को वास्तविक bearer token की आवश्यकता नहीं होती। OpenClaw लोकल `ollama-local` मार्कर केवल loopback, निजी-नेटवर्क, `.local`, और bare-hostname Ollama base URL के लिए उपयोग करता है।
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    रिमोट सार्वजनिक होस्ट और Ollama Cloud (`https://ollama.com`) को `OLLAMA_API_KEY`, auth प्रोफ़ाइल, या प्रदाता के `apiKey` के माध्यम से वास्तविक क्रेडेंशियल की आवश्यकता होती है। सीधे होस्टेड उपयोग के लिए, प्रदाता `ollama-cloud` को प्राथमिकता दें।
  </Accordion>
  <Accordion title="Custom provider ids">
    कस्टम प्रदाता ids जो `api: "ollama"` सेट करते हैं, वही नियम अपनाते हैं। उदाहरण के लिए, निजी LAN Ollama होस्ट की ओर इशारा करने वाला `ollama-remote` प्रदाता `apiKey: "ollama-local"` उपयोग कर सकता है और उप-एजेंट उस मार्कर को गायब क्रेडेंशियल मानने के बजाय Ollama प्रदाता hook के माध्यम से resolve करेंगे। Memory search `agents.defaults.memorySearch.provider` को उस कस्टम प्रदाता id पर भी सेट कर सकता है ताकि embeddings मिलते-जुलते Ollama endpoint का उपयोग करें।
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` प्रदाता id के लिए क्रेडेंशियल संग्रहीत करता है। endpoint सेटिंग्स (`baseUrl`, `api`, model ids, headers, timeouts) को `models.providers.<id>` में रखें। पुराने flat auth-profile files जैसे `{ "ollama-windows": { "apiKey": "ollama-local" } }` runtime format नहीं हैं; उन्हें backup के साथ canonical `ollama-windows:default` API-key profile में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ। उस फ़ाइल में `baseUrl` compatibility noise है और उसे provider config में ले जाना चाहिए।
  </Accordion>
  <Accordion title="Memory embedding scope">
    जब Ollama memory embeddings के लिए उपयोग होता है, bearer auth उसी होस्ट तक scoped होता है जहाँ वह घोषित किया गया था:

    - प्रदाता-स्तरीय key केवल उस प्रदाता के Ollama host को भेजी जाती है।
    - `agents.*.memorySearch.remote.apiKey` केवल उसके remote embedding host को भेजी जाती है।
    - शुद्ध `OLLAMA_API_KEY` env value को Ollama Cloud convention माना जाता है, और default रूप से local या self-hosted hosts को नहीं भेजा जाता।

  </Accordion>
</AccordionGroup>

## शुरू करना

अपनी पसंदीदा setup method और mode चुनें।

<Tabs>
  <Tab title="Onboarding (recommended)">
    **इसके लिए सर्वोत्तम:** काम कर रहे Ollama cloud या local setup तक सबसे तेज़ रास्ता।

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        provider list से **Ollama** चुनें।
      </Step>
      <Step title="Choose your mode">
        - **क्लाउड + लोकल** — local Ollama host और उस host के माध्यम से routed cloud models
        - **केवल क्लाउड** — `https://ollama.com` के माध्यम से hosted Ollama models
        - **केवल लोकल** — केवल local models

      </Step>
      <Step title="Select a model">
        `Cloud only` `OLLAMA_API_KEY` के लिए prompt करता है और hosted cloud defaults सुझाता है। `Cloud + Local` और `Local only` Ollama base URL माँगते हैं, उपलब्ध models discover करते हैं, और चुने गए local model को यदि वह अभी उपलब्ध नहीं है तो auto-pull करते हैं। जब Ollama installed `:latest` tag जैसे `gemma4:latest` रिपोर्ट करता है, setup उस installed model को एक बार दिखाता है, बजाय इसके कि `gemma4` और `gemma4:latest` दोनों दिखाए जाएँ या bare alias को फिर से pull किया जाए। `Cloud + Local` यह भी जाँचता है कि वह Ollama host cloud access के लिए signed in है या नहीं।
      </Step>
      <Step title="Verify the model is available">
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
    **इसके लिए सर्वोत्तम:** cloud या local setup पर पूर्ण नियंत्रण।

    <Steps>
      <Step title="Choose cloud or local">
        - **क्लाउड + लोकल**: Ollama install करें, `ollama signin` से sign in करें, और cloud requests को उस host के माध्यम से route करें
        - **केवल क्लाउड**: `OLLAMA_API_KEY` के साथ `https://ollama.com` उपयोग करें
        - **केवल लोकल**: [ollama.com/download](https://ollama.com/download) से Ollama install करें

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        `Cloud only` के लिए, अपना वास्तविक `OLLAMA_API_KEY` उपयोग करें। host-backed setups के लिए, कोई भी placeholder value काम करती है:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        या config में default set करें:

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

## क्लाउड मॉडल

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` local और cloud models दोनों के लिए reachable Ollama host को control point के रूप में उपयोग करता है। यह Ollama का preferred hybrid flow है।

    setup के दौरान **क्लाउड + लोकल** उपयोग करें। OpenClaw Ollama base URL के लिए prompt करता है, उस host से local models discover करता है, और जाँचता है कि host `ollama signin` के साथ cloud access के लिए signed in है या नहीं। जब host signed in होता है, OpenClaw `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, और `glm-5.1:cloud` जैसे hosted cloud defaults भी सुझाता है।

    यदि host अभी signed in नहीं है, तो OpenClaw setup को local-only रखता है जब तक आप `ollama signin` नहीं चलाते।

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` Ollama की hosted API के विरुद्ध `https://ollama.com` पर चलता है।

    setup के दौरान **केवल क्लाउड** उपयोग करें। OpenClaw `OLLAMA_API_KEY` के लिए prompt करता है, `baseUrl: "https://ollama.com"` सेट करता है, और hosted cloud model list seed करता है। इस path को local Ollama server या `ollama signin` की आवश्यकता **नहीं** होती।

    `openclaw onboard` के दौरान दिखाई गई cloud model list `https://ollama.com/api/tags` से live populated होती है, 500 entries तक capped रहती है, इसलिए picker static seed के बजाय current hosted catalog को दर्शाता है। यदि setup समय पर `ollama.com` unreachable है या कोई models वापस नहीं करता, तो OpenClaw previous hardcoded suggestions पर fallback करता है ताकि onboarding फिर भी complete हो जाए।

    आप first-class cloud provider को सीधे भी configure कर सकते हैं:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    local-only mode में, OpenClaw configured Ollama instance से models discover करता है। यह path local या self-hosted Ollama servers के लिए है।

    OpenClaw वर्तमान में `gemma4` को local default के रूप में सुझाता है।

  </Tab>
</Tabs>

## Model discovery (implicit provider)

जब आप `OLLAMA_API_KEY` (या auth profile) set करते हैं और `models.providers.ollama` या `api: "ollama"` वाले किसी अन्य custom remote provider को define **नहीं** करते, OpenClaw local Ollama instance से `http://127.0.0.1:11434` पर models discover करता है।

| व्यवहार             | विवरण                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog query        | `/api/tags` query करता है                                                                                                                                                  |
| Capability detection | `contextWindow`, expanded `num_ctx` Modelfile parameters, और vision/tools सहित capabilities पढ़ने के लिए best-effort `/api/show` lookups उपयोग करता है                       |
| Vision models        | `/api/show` द्वारा reported `vision` capability वाले models को image-capable (`input: ["text", "image"]`) के रूप में marked किया जाता है, इसलिए OpenClaw images को prompt में auto-inject करता है  |
| Reasoning detection  | उपलब्ध होने पर `/api/show` capabilities उपयोग करता है, जिसमें `thinking` शामिल है; जब Ollama capabilities omit करता है, तो model-name heuristic (`r1`, `reasoning`, `think`) पर fallback करता है |
| Token limits         | `maxTokens` को OpenClaw द्वारा उपयोग किए जाने वाले default Ollama max-token cap पर set करता है                                                                                                |
| Costs                | सभी costs को `0` पर set करता है                                                                                                                                                |

यह manual model entries से बचाता है और catalog को local Ollama instance के साथ aligned रखता है। आप local `infer model run` में `ollama/<pulled-model>:latest` जैसे full ref का उपयोग कर सकते हैं; OpenClaw उस installed model को Ollama के live catalog से resolve करता है, बिना hand-written `models.json` entry की आवश्यकता के।

signed-in Ollama hosts के लिए, कुछ `:cloud` models `/api/tags` में दिखाई देने से पहले `/api/chat` और `/api/show` के माध्यम से usable हो सकते हैं। जब आप स्पष्ट रूप से full `ollama/<model>:cloud` ref चुनते हैं, OpenClaw उस exact missing model को `/api/show` से validate करता है और उसे runtime catalog में तभी जोड़ता है जब Ollama model metadata confirm करता है। Typos अभी भी unknown models के रूप में fail होते हैं, auto-created नहीं होते।

```bash
# See what models are available
ollama list
openclaw models list
```

full agent tool surface से बचने वाले narrow text-generation smoke test के लिए, full Ollama model ref के साथ local `infer model run` उपयोग करें:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

वह path फिर भी OpenClaw के configured provider, auth, और native Ollama transport का उपयोग करता है, लेकिन chat-agent turn शुरू नहीं करता या MCP/tool context load नहीं करता। यदि यह सफल होता है जबकि normal agent replies fail होते हैं, तो आगे model की agent prompt/tool capacity troubleshoot करें।

उसी lean path पर narrow vision-model smoke test के लिए, `infer model run` में एक या अधिक image files जोड़ें। यह prompt और image को सीधे selected Ollama vision model को भेजता है, chat tools, memory, या prior session context load किए बिना:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` उन फ़ाइलों को स्वीकार करता है जिन्हें `image/*` के रूप में पहचाना गया हो, जिनमें सामान्य PNG,
JPEG, और WebP इनपुट शामिल हैं। गैर-इमेज फ़ाइलें Ollama को कॉल करने से पहले अस्वीकार कर दी जाती हैं।
स्पीच रिकग्निशन के लिए, इसके बजाय `openclaw infer audio transcribe` का उपयोग करें।

जब आप किसी बातचीत को `/model ollama/<model>` से स्विच करते हैं, तो OpenClaw उसे
उपयोगकर्ता के सटीक चयन के रूप में मानता है। यदि कॉन्फ़िगर किया गया Ollama `baseUrl`
पहुँच योग्य नहीं है, तो अगला उत्तर किसी अन्य कॉन्फ़िगर किए गए फ़ॉलबैक मॉडल से चुपचाप
उत्तर देने के बजाय provider त्रुटि के साथ विफल होता है।

अलग-थलग cron jobs agent turn शुरू करने से पहले एक अतिरिक्त स्थानीय सुरक्षा जाँच करते हैं।
यदि चयनित मॉडल किसी स्थानीय, निजी-नेटवर्क, या `.local` Ollama provider पर resolve होता है
और `/api/tags` पहुँच योग्य नहीं है, तो OpenClaw उस cron run को error text में चयनित
`ollama/<model>` के साथ `skipped` के रूप में रिकॉर्ड करता है। endpoint preflight 5 मिनट के लिए
cached रहता है, इसलिए एक ही रुके हुए Ollama daemon की ओर इशारा करने वाले कई cron jobs
सभी विफल model requests शुरू नहीं करते।

स्थानीय text path, native stream path, और embeddings को स्थानीय Ollama के विरुद्ध live-verify करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API-key smoke tests के लिए, live test को `https://ollama.com` पर point करें
और current catalog से hosted model चुनें:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

cloud smoke text, native stream, और web search चलाता है। यह `https://ollama.com` के लिए
डिफ़ॉल्ट रूप से embeddings छोड़ देता है क्योंकि Ollama Cloud API keys `/api/embed` को authorize
नहीं कर सकती हैं। जब आप स्पष्ट रूप से चाहते हैं कि configured cloud key embed endpoint का उपयोग
न कर सके तो live test विफल हो, तब `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` सेट करें।

नया model जोड़ने के लिए, बस उसे Ollama से pull करें:

```bash
ollama pull mistral
```

नया model अपने-आप खोजा जाएगा और उपयोग के लिए उपलब्ध होगा।

<Note>
यदि आप `models.providers.ollama` को स्पष्ट रूप से सेट करते हैं, या `api: "ollama"` के साथ `models.providers.ollama-cloud` जैसे custom remote provider को configure करते हैं, तो auto-discovery छोड़ दी जाती है और आपको models मैन्युअल रूप से define करने होंगे। `http://127.0.0.2:11434` जैसे loopback custom providers को फिर भी स्थानीय माना जाता है। नीचे explicit config section देखें।
</Note>

## Vision और image description

bundled Ollama Plugin, Ollama को image-capable media-understanding provider के रूप में register करता है। इससे OpenClaw explicit image-description requests और configured image-model defaults को स्थानीय या hosted Ollama vision models के माध्यम से route कर सकता है।

local vision के लिए, images को support करने वाला model pull करें:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

फिर infer CLI से verify करें:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` एक पूरा `<provider/model>` ref होना चाहिए। जब यह set होता है, तो `openclaw infer image describe` description को skip करने के बजाय पहले उसी model को try करता है क्योंकि model native vision support करता है। यदि model call विफल होता है, तो OpenClaw configured `agents.defaults.imageModel.fallbacks` के माध्यम से जारी रह सकता है; file या URL preparation errors fallback attempts से पहले ही विफल होते हैं।

जब आप OpenClaw का image-understanding provider flow, configured `agents.defaults.imageModel`, और image-description output shape चाहते हैं, तब `infer image describe` का उपयोग करें। जब आप custom prompt और एक या अधिक images के साथ raw multimodal model probe चाहते हैं, तब `infer model run --file` का उपयोग करें।

inbound media के लिए Ollama को default image-understanding model बनाने के लिए, `agents.defaults.imageModel` configure करें:

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

पूरे `ollama/<model>` ref को प्राथमिकता दें। यदि वही model `models.providers.ollama.models` के अंतर्गत `input: ["text", "image"]` के साथ listed है और कोई अन्य configured image provider वह bare model ID expose नहीं करता, तो OpenClaw `qwen2.5vl:7b` जैसे bare `imageModel` ref को भी `ollama/qwen2.5vl:7b` में normalize करता है। यदि एक से अधिक configured image provider के पास वही bare ID है, तो provider prefix स्पष्ट रूप से उपयोग करें।

धीमे local vision models को cloud models की तुलना में लंबा image-understanding timeout चाहिए हो सकता है। वे constrained hardware पर Ollama द्वारा पूर्ण advertised vision context allocate करने की कोशिश करने पर crash या stop भी कर सकते हैं। capability timeout सेट करें, और जब आपको केवल सामान्य image-description turn चाहिए हो, तब model entry पर `num_ctx` cap करें:

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

यह timeout inbound image understanding और agent द्वारा turn के दौरान call किए जा सकने वाले explicit `image` tool पर लागू होता है। Provider-level `models.providers.ollama.timeoutSeconds` अभी भी normal model calls के लिए underlying Ollama HTTP request guard को नियंत्रित करता है।

स्थानीय Ollama के विरुद्ध explicit image tool को live-verify करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

यदि आप `models.providers.ollama.models` मैन्युअल रूप से define करते हैं, तो vision models को image input support के साथ mark करें:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw उन models के लिए image-description requests अस्वीकार करता है जिन्हें image-capable के रूप में mark नहीं किया गया है। implicit discovery के साथ, जब `/api/show` vision capability report करता है, तो OpenClaw इसे Ollama से पढ़ता है।

## Configuration

<Tabs>
  <Tab title="Basic (implicit discovery)">
    सबसे सरल local-only enablement path environment variable के माध्यम से है:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    यदि `OLLAMA_API_KEY` सेट है, तो आप provider entry में `apiKey` छोड़ सकते हैं और OpenClaw availability checks के लिए इसे भर देगा।
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    explicit config का उपयोग तब करें जब आप hosted cloud setup चाहते हों, Ollama किसी अन्य host/port पर चलता हो, आप specific context windows या model lists force करना चाहते हों, या आप पूरी तरह manual model definitions चाहते हों।

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
    यदि Ollama किसी अलग host या port पर चल रहा है (explicit config auto-discovery को disable करता है, इसलिए models मैन्युअल रूप से define करें):

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
    URL में `/v1` न जोड़ें। `/v1` path OpenAI-compatible mode का उपयोग करता है, जहाँ tool calling भरोसेमंद नहीं है। path suffix के बिना base Ollama URL का उपयोग करें।
    </Warning>

  </Tab>
</Tabs>

## सामान्य recipes

इन्हें starting points के रूप में उपयोग करें और model IDs को `ollama list` या `openclaw models list --provider ollama` से मिले सटीक names से बदलें।

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    इसका उपयोग तब करें जब Ollama Gateway वाली ही machine पर चलता हो और आप चाहते हों कि OpenClaw installed models को अपने-आप discover करे।

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    यह path config को न्यूनतम रखता है। जब तक आप models मैन्युअल रूप से define नहीं करना चाहते, `models.providers.ollama` block न जोड़ें।

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    LAN hosts के लिए native Ollama URLs का उपयोग करें। `/v1` न जोड़ें।

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

    `contextWindow` OpenClaw-side context budget है। request के लिए `params.num_ctx` Ollama को भेजा जाता है। जब आपका hardware model का पूरा advertised context नहीं चला सकता, तो इन्हें aligned रखें।

  </Accordion>

  <Accordion title="Ollama Cloud only">
    इसका उपयोग तब करें जब आप local daemon नहीं चलाते और hosted Ollama models सीधे चाहते हों।

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
    इसका उपयोग तब करें जब local या LAN Ollama daemon `ollama signin` से signed in हो और उसे local models तथा `:cloud` models दोनों serve करने हों।

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

  <Accordion title="कई Ollama होस्ट">
    जब आपके पास एक से अधिक Ollama सर्वर हों, तो कस्टम provider IDs का उपयोग करें। हर provider को अपना अलग host, models, auth, timeout, और model refs मिलता है।

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

    जब OpenClaw अनुरोध भेजता है, तो सक्रिय provider prefix हटा दिया जाता है ताकि `ollama-large/qwen3.5:27b` Ollama तक `qwen3.5:27b` के रूप में पहुंचे।

  </Accordion>

  <Accordion title="हल्की local model profile">
    कुछ local models सरल prompts का उत्तर दे सकते हैं, लेकिन पूरे agent tool surface के साथ संघर्ष करते हैं। global runtime settings बदलने से पहले tools और context को सीमित करके शुरू करें।

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

    `compat.supportsTools: false` का उपयोग केवल तब करें जब model या server tool schemas पर भरोसेमंद रूप से विफल होता हो। यह स्थिरता के बदले agent capability कम करता है।
    `localModelLean` direct agent surface से browser, cron, और message tools हटाता है और बड़े catalogs को structured Tool Search controls के पीछे default करता है, सिवाय तब जब किसी run को direct message delivery semantics बनाए रखने हों, लेकिन यह Ollama के runtime context या thinking mode को नहीं बदलता। छोटे Qwen-style thinking models के लिए, जो loop करते हैं या अपना response budget hidden reasoning पर खर्च करते हैं, इसे explicit `params.num_ctx` और `params.thinking: false` के साथ जोड़ें।

  </Accordion>
</AccordionGroup>

### Model selection

configure हो जाने के बाद, आपके सभी Ollama models उपलब्ध होते हैं:

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

कस्टम Ollama provider ids भी supported हैं। जब कोई model ref सक्रिय
provider prefix का उपयोग करता है, जैसे `ollama-spark/qwen3:32b`, तो OpenClaw Ollama को call करने से पहले केवल वही
prefix हटाता है, ताकि server को `qwen3:32b` मिले।

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
headers, body streaming, और कुल guarded-fetch abort शामिल हैं। `params.keep_alive`
native `/api/chat` requests पर top-level `keep_alive` के रूप में Ollama को forwarded होता है;
जब first-turn load time bottleneck हो, तो इसे प्रति model set करें।

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

remote hosts के लिए, `127.0.0.1` को `baseUrl` में उपयोग किए गए host से बदलें। यदि `curl` काम करता है लेकिन OpenClaw नहीं, तो जांचें कि Gateway किसी अलग machine, container, या service account पर तो नहीं चल रहा।

## Ollama Web Search

OpenClaw **Ollama Web Search** को bundled `web_search` provider के रूप में support करता है।

| Property    | Detail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | आपके configured Ollama host का उपयोग करता है (जब set हो तो `models.providers.ollama.baseUrl`, अन्यथा `http://127.0.0.1:11434`); `https://ollama.com` hosted API को सीधे उपयोग करता है |
| Auth        | signed-in local Ollama hosts के लिए key-free; direct `https://ollama.com` search या auth-protected hosts के लिए `OLLAMA_API_KEY` या configured provider auth               |
| Requirement | Local/self-hosted hosts चल रहे होने चाहिए और `ollama signin` से signed in होने चाहिए; direct hosted search के लिए `baseUrl: "https://ollama.com"` और वास्तविक Ollama API key चाहिए |

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

signed-in local daemon के लिए, OpenClaw daemon के `/api/experimental/web_search` proxy का उपयोग करता है। `https://ollama.com` के लिए, यह hosted `/api/web_search` endpoint को सीधे call करता है।

<Note>
पूरे setup और behavior details के लिए, [Ollama Web Search](/hi/tools/ollama-search) देखें।
</Note>

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **OpenAI-compatible mode में tool calling भरोसेमंद नहीं है।** इस mode का उपयोग केवल तब करें जब आपको proxy के लिए OpenAI format चाहिए और आप native tool calling behavior पर निर्भर नहीं हैं।
    </Warning>

    यदि आपको इसके बजाय OpenAI-compatible endpoint का उपयोग करना हो (उदाहरण के लिए, ऐसे proxy के पीछे जो केवल OpenAI format support करता है), तो `api: "openai-completions"` explicit रूप से set करें:

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

    यह mode streaming और tool calling को एक साथ support नहीं कर सकता। आपको model config में `params: { streaming: false }` के साथ streaming disable करनी पड़ सकती है।

    जब `api: "openai-completions"` Ollama के साथ उपयोग किया जाता है, तो OpenClaw default रूप से `options.num_ctx` inject करता है ताकि Ollama चुपचाप 4096 context window पर fallback न करे। यदि आपका proxy/upstream unknown `options` fields reject करता है, तो इस behavior को disable करें:

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
    auto-discovered models के लिए, OpenClaw उपलब्ध होने पर Ollama द्वारा report की गई context window का उपयोग करता है, जिसमें custom Modelfiles से बड़े `PARAMETER num_ctx` values शामिल हैं। अन्यथा यह OpenClaw द्वारा उपयोग की गई default Ollama context window पर fallback करता है।

    आप उस Ollama provider के तहत हर model के लिए provider-level `contextWindow`, `contextTokens`, और `maxTokens` defaults set कर सकते हैं, फिर जरूरत पड़ने पर उन्हें प्रति model override कर सकते हैं। `contextWindow` OpenClaw का prompt और compaction budget है। Native Ollama requests `options.num_ctx` unset छोड़ते हैं जब तक आप explicit रूप से `params.num_ctx` configure नहीं करते, ताकि Ollama अपना model, `OLLAMA_CONTEXT_LENGTH`, या VRAM-based default लागू कर सके। Modelfile rebuild किए बिना Ollama के per-request runtime context को cap या force करने के लिए, `params.num_ctx` set करें; invalid, zero, negative, और non-finite values ignore किए जाते हैं। यदि आपने कोई पुराना config upgrade किया है जो native Ollama request context force करने के लिए केवल `contextWindow` या `maxTokens` उपयोग करता था, तो उन explicit provider या model budgets को `params.num_ctx` में copy करने के लिए `openclaw doctor --fix` चलाएं। OpenAI-compatible Ollama adapter अभी भी configured `params.num_ctx` या `contextWindow` से default रूप से `options.num_ctx` inject करता है; यदि आपका upstream `options` reject करता है, तो इसे `injectNumCtxForOpenAICompat: false` से disable करें।

    Native Ollama model entries `params` के तहत common Ollama runtime options भी accept करती हैं, जिनमें `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, और `use_mmap` शामिल हैं। OpenClaw केवल Ollama request keys forward करता है, इसलिए `streaming` जैसे OpenClaw runtime params Ollama तक leak नहीं होते। top-level Ollama `think` भेजने के लिए `params.think` या `params.thinking` का उपयोग करें; `false` Qwen-style thinking models के लिए API-level thinking disable करता है।

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

    Per-model `agents.defaults.models["ollama/<model>"].params.num_ctx` भी काम करता है। यदि दोनों configured हैं, तो explicit provider model entry agent default पर प्राथमिकता लेती है।

  </Accordion>

  <Accordion title="Thinking control">
    Native Ollama models के लिए, OpenClaw thinking control को Ollama की अपेक्षा के अनुसार forward करता है: top-level `think`, `options.think` नहीं। Auto-discovered models जिनकी `/api/show` response में `thinking` capability शामिल है, `/think low`, `/think medium`, `/think high`, और `/think max` expose करते हैं; non-thinking models केवल `/think off` expose करते हैं।

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

    Per-model `params.think` या `params.thinking` किसी specific configured model के लिए Ollama API thinking को disable या force कर सकता है। OpenClaw उन explicit model params को preserve करता है जब active run में केवल implicit default `off` हो; `/think medium` जैसे non-off runtime commands अभी भी active run को override करते हैं।

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw `deepseek-r1`, `reasoning`, या `think` जैसे names वाले models को default रूप से reasoning-capable मानता है।

    ```bash
    ollama pull deepseek-r1:32b
    ```

    कोई अतिरिक्त configuration आवश्यक नहीं है। OpenClaw उन्हें automatic रूप से mark करता है।

  </Accordion>

  <Accordion title="मॉडल लागतें">
    Ollama मुफ़्त है और स्थानीय रूप से चलता है, इसलिए सभी मॉडल लागतें $0 पर सेट हैं। यह स्वतः खोजे गए और मैन्युअल रूप से परिभाषित, दोनों तरह के मॉडलों पर लागू होता है।
  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग्स">
    बंडल किया गया Ollama Plugin
    [मेमोरी खोज](/hi/concepts/memory) के लिए एक मेमोरी एम्बेडिंग प्रदाता रजिस्टर करता है। यह कॉन्फ़िगर किए गए Ollama बेस URL
    और API कुंजी का उपयोग करता है, Ollama के मौजूदा `/api/embed` endpoint को कॉल करता है, और संभव होने पर
    कई मेमोरी chunks को एक `input` request में बैच करता है।

    जब `proxy.enabled=true` होता है, तो कॉन्फ़िगर किए गए `baseUrl` से निकले सटीक
    host-local loopback origin पर Ollama मेमोरी एम्बेडिंग requests, managed forward proxy के बजाय
    OpenClaw के guarded direct path का उपयोग करती हैं। कॉन्फ़िगर किया गया hostname स्वयं `localhost` या loopback IP literal होना चाहिए;
    DNS names जो केवल loopback पर resolve होते हैं, फिर भी managed proxy path का उपयोग करते हैं।
    LAN, tailnet, private-network, और public Ollama hosts भी
    managed proxy path पर ही रहते हैं। किसी दूसरे host या port पर redirects trust inherit नहीं करते।
    Operators अभी भी loopback traffic को proxy से भेजने के लिए global `proxy.loopbackMode: "proxy"` setting,
    या connection खोलने से पहले loopback connections को deny करने के लिए `proxy.loopbackMode: "block"`
    सेट कर सकते हैं; इस setting के process-wide effect के लिए
    [Managed proxy](/hi/security/network-proxy#gateway-loopback-mode) देखें।

    | प्रॉपर्टी      | मान               |
    | ------------- | ------------------- |
    | डिफ़ॉल्ट मॉडल | `nomic-embed-text`  |
    | Auto-pull     | हाँ — embedding model यदि स्थानीय रूप से मौजूद नहीं है तो अपने आप pull किया जाता है |

    Query-time embeddings उन मॉडलों के लिए retrieval prefixes का उपयोग करती हैं जिन्हें उनकी आवश्यकता होती है या जिनके लिए उनकी सिफ़ारिश की जाती है, जिनमें `nomic-embed-text`, `qwen3-embedding`, और `mxbai-embed-large` शामिल हैं। मेमोरी document batches raw रहती हैं ताकि मौजूदा indexes को format migration की आवश्यकता न पड़े।

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

    remote embedding host के लिए, auth को उसी host तक सीमित रखें:

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
    OpenClaw का Ollama integration डिफ़ॉल्ट रूप से **native Ollama API** (`/api/chat`) का उपयोग करता है, जो streaming और tool calling को साथ-साथ पूरी तरह support करता है। किसी विशेष configuration की आवश्यकता नहीं है।

    native `/api/chat` requests के लिए, OpenClaw thinking control को सीधे Ollama तक भी forward करता है: `/think off` और `openclaw agent --thinking off` top-level `think: false` भेजते हैं, जब तक कि कोई explicit model `params.think`/`params.thinking` value configured न हो, जबकि `/think low|medium|high` matching top-level `think` effort string भेजते हैं। `/think max` Ollama के highest native effort, `think: "high"` पर map होता है।

    <Tip>
    यदि आपको OpenAI-compatible endpoint का उपयोग करना है, तो ऊपर "Legacy OpenAI-compatible mode" section देखें। उस mode में streaming और tool calling साथ-साथ काम नहीं कर सकते।
    </Tip>

  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="WSL2 क्रैश लूप (बार-बार रीबूट)">
    NVIDIA/CUDA के साथ WSL2 पर, official Ollama Linux installer `Restart=always` के साथ एक `ollama.service` systemd unit बनाता है। यदि वह service autostart होती है और WSL2 boot के दौरान GPU-backed model load करती है, तो model load होने के दौरान Ollama host memory को pin कर सकता है। Hyper-V memory reclaim हमेशा उन pinned pages को reclaim नहीं कर सकता, इसलिए Windows WSL2 VM को terminate कर सकता है, systemd Ollama को फिर से start करता है, और loop दोहराता है।

    सामान्य evidence:

    - Windows side से बार-बार WSL2 reboots या terminations
    - WSL2 startup के तुरंत बाद `app.slice` या `ollama.service` में high CPU
    - Linux OOM-killer event के बजाय systemd से SIGTERM

    OpenClaw startup warning log करता है जब यह WSL2, `Restart=always` के साथ enabled `ollama.service`, और visible CUDA markers detect करता है।

    Mitigation:

    ```bash
    sudo systemctl disable ollama
    ```

    इसे Windows side पर `%USERPROFILE%\.wslconfig` में जोड़ें, फिर `wsl --shutdown` चलाएँ:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama service environment में shorter keep-alive सेट करें, या Ollama को केवल ज़रूरत होने पर manually start करें:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) देखें।

  </Accordion>

  <Accordion title="Ollama detect नहीं हुआ">
    सुनिश्चित करें कि Ollama चल रहा है और आपने `OLLAMA_API_KEY` (या auth profile) सेट किया है, और आपने explicit `models.providers.ollama` entry परिभाषित **नहीं** की है:

    ```bash
    ollama serve
    ```

    Verify करें कि API accessible है:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="कोई मॉडल उपलब्ध नहीं">
    यदि आपका model सूचीबद्ध नहीं है, तो या तो model को locally pull करें या उसे `models.providers.ollama` में explicitly define करें।

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
    उसी machine और runtime से verify करें जो Gateway चलाता है:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    सामान्य कारण:

    - `baseUrl` `localhost` की ओर point करता है, लेकिन Gateway Docker में या किसी दूसरे host पर चलता है।
    - URL `/v1` का उपयोग करता है, जो native Ollama के बजाय OpenAI-compatible behavior चुनता है।
    - remote host को Ollama side पर firewall या LAN binding changes चाहिए।
    - model आपके laptop के daemon पर मौजूद है लेकिन remote daemon पर नहीं।

  </Accordion>

  <Accordion title="मॉडल tool JSON को text के रूप में output करता है">
    इसका आमतौर पर मतलब है कि provider OpenAI-compatible mode का उपयोग कर रहा है या model tool schemas handle नहीं कर सकता।

    native Ollama mode को प्राथमिकता दें:

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

    यदि छोटा local model फिर भी tool schemas पर fail होता है, तो उस model entry पर `compat.supportsTools: false` सेट करें और retest करें।

  </Accordion>

  <Accordion title="Kimi या GLM garbled symbols लौटाता है">
    Hosted Kimi/GLM responses जो लंबे, non-linguistic symbol runs हैं, उन्हें successful assistant answer के बजाय failed provider output माना जाता है। इससे normal retry, fallback, या error handling session में corrupted text persist किए बिना take over कर सकते हैं।

    यदि यह बार-बार होता है, तो raw model name, current session file, और run ने `Cloud + Local` या `Cloud only` का उपयोग किया था या नहीं, capture करें, फिर fresh session और fallback model आज़माएँ:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="ठंडा local model timeout हो जाता है">
    बड़े local models को streaming शुरू होने से पहले लंबा first load चाहिए हो सकता है। timeout को Ollama provider तक scoped रखें, और वैकल्पिक रूप से Ollama से turns के बीच model को loaded रखने को कहें:

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

    यदि host स्वयं connections accept करने में slow है, तो `timeoutSeconds` इस provider के लिए guarded Undici connect timeout को भी extend करता है।

  </Accordion>

  <Accordion title="Large-context model बहुत धीमा है या memory खत्म हो जाती है">
    कई Ollama models ऐसे contexts advertise करते हैं जो आपके hardware पर आराम से चलने के लिए बहुत बड़े होते हैं। Native Ollama, Ollama के अपने runtime context default का उपयोग करता है जब तक आप `params.num_ctx` सेट न करें। जब predictable first-token latency चाहिए, तो OpenClaw के budget और Ollama के request context, दोनों को cap करें:

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

    यदि OpenClaw बहुत अधिक prompt भेज रहा है तो पहले `contextWindow` घटाएँ। यदि Ollama ऐसा runtime context load कर रहा है जो machine के लिए बहुत बड़ा है, तो `params.num_ctx` घटाएँ। यदि generation बहुत देर तक चलता है तो `maxTokens` घटाएँ।

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    सभी providers, model refs, और failover behavior का overview।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/models" icon="brain">
    models चुनने और configure करने का तरीका।
  </Card>
  <Card title="Ollama Web Search" href="/hi/tools/ollama-search" icon="magnifying-glass">
    Ollama-powered web search के लिए पूरा setup और behavior details।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    पूरा config reference।
  </Card>
</CardGroup>
