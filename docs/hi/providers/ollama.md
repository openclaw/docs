---
read_when:
    - आप Ollama के ज़रिए क्लाउड या स्थानीय मॉडल के साथ OpenClaw चलाना चाहते हैं
    - आपको Ollama सेटअप और कॉन्फ़िगरेशन के लिए मार्गदर्शन चाहिए
    - आप छवि समझने के लिए Ollama विज़न मॉडल चाहते हैं
summary: Ollama के साथ OpenClaw चलाएँ (क्लाउड और स्थानीय मॉडल)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:39:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw hosted cloud models और local/self-hosted Ollama servers के लिए Ollama के native API (`/api/chat`) के साथ integrate करता है. आप Ollama को तीन modes में उपयोग कर सकते हैं: reachable Ollama host के ज़रिए `Cloud + Local`, `https://ollama.com` के विरुद्ध `Cloud only`, या reachable Ollama host के विरुद्ध `Local only`.

OpenClaw direct Ollama Cloud उपयोग के लिए `ollama-cloud` को first-class hosted provider id के रूप में भी register करता है. जब आप local `ollama` provider id share किए बिना cloud-only routing चाहते हैं, तो `ollama-cloud/kimi-k2.5:cloud` जैसे refs का उपयोग करें.

Dedicated cloud-only setup page के लिए, [Ollama Cloud](/hi/providers/ollama-cloud) देखें.

<Warning>
**Remote Ollama users**: OpenClaw के साथ `/v1` OpenAI-compatible URL (`http://host:11434/v1`) का उपयोग न करें. इससे tool calling टूट जाती है और models raw tool JSON को plain text के रूप में output कर सकते हैं. इसके बजाय native Ollama API URL का उपयोग करें: `baseUrl: "http://host:11434"` (`/v1` नहीं).
</Warning>

Ollama provider config canonical key के रूप में `baseUrl` का उपयोग करता है. OpenClaw OpenAI SDK-style examples के साथ compatibility के लिए `baseURL` भी accept करता है, लेकिन नए config में `baseUrl` को prefer करना चाहिए.

## Auth नियम

<AccordionGroup>
  <Accordion title="Local और LAN hosts">
    Local और LAN Ollama hosts को वास्तविक bearer token की आवश्यकता नहीं होती. OpenClaw local `ollama-local` marker का उपयोग केवल loopback, private-network, `.local`, और bare-hostname Ollama base URLs के लिए करता है.
  </Accordion>
  <Accordion title="Remote और Ollama Cloud hosts">
    Remote public hosts और Ollama Cloud (`https://ollama.com`) को `OLLAMA_API_KEY`, auth profile, या provider के `apiKey` के ज़रिए वास्तविक credential चाहिए. Direct hosted उपयोग के लिए, provider `ollama-cloud` prefer करें.
  </Accordion>
  <Accordion title="Custom provider ids">
    Custom provider ids जो `api: "ollama"` set करते हैं, वही नियम follow करते हैं. उदाहरण के लिए, private LAN Ollama host की ओर point करने वाला `ollama-remote` provider `apiKey: "ollama-local"` का उपयोग कर सकता है और sub-agents उस marker को missing credential मानने के बजाय Ollama provider hook के ज़रिए resolve करेंगे. Memory search `agents.defaults.memorySearch.provider` को उस custom provider id पर भी set कर सकता है ताकि embeddings matching Ollama endpoint का उपयोग करें.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` provider id के लिए credential store करता है. Endpoint settings (`baseUrl`, `api`, model ids, headers, timeouts) को `models.providers.<id>` में रखें. पुराने flat auth-profile files जैसे `{ "ollama-windows": { "apiKey": "ollama-local" } }` runtime format नहीं हैं; backup के साथ canonical `ollama-windows:default` API-key profile में rewrite करने के लिए `openclaw doctor --fix` चलाएं. उस file में `baseUrl` compatibility noise है और इसे provider config में move करना चाहिए.
  </Accordion>
  <Accordion title="Memory embedding scope">
    जब Ollama का उपयोग memory embeddings के लिए किया जाता है, bearer auth उसी host तक scoped होता है जहां इसे declared किया गया था:

    - Provider-level key केवल उस provider के Ollama host को भेजी जाती है.
    - `agents.*.memorySearch.remote.apiKey` केवल अपने remote embedding host को भेजी जाती है.
    - Pure `OLLAMA_API_KEY` env value को Ollama Cloud convention माना जाता है, default रूप से local या self-hosted hosts को नहीं भेजा जाता.

  </Accordion>
</AccordionGroup>

## शुरुआत करना

अपना preferred setup method और mode चुनें.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **इसके लिए सबसे अच्छा:** working Ollama cloud या local setup तक सबसे तेज़ रास्ता.

    <Steps>
      <Step title="Onboarding चलाएं">
        ```bash
        openclaw onboard
        ```

        Provider list से **Ollama** select करें.
      </Step>
      <Step title="अपना mode चुनें">
        - **Cloud + Local** — local Ollama host और उस host के ज़रिए routed cloud models
        - **Cloud only** — `https://ollama.com` के ज़रिए hosted Ollama models
        - **Local only** — केवल local models

      </Step>
      <Step title="Model select करें">
        `Cloud only` `OLLAMA_API_KEY` के लिए prompt करता है और hosted cloud defaults suggest करता है. `Cloud + Local` और `Local only` Ollama base URL मांगते हैं, available models discover करते हैं, और selected local model अभी available न हो तो उसे auto-pull करते हैं. जब Ollama installed `:latest` tag जैसे `gemma4:latest` report करता है, setup उस installed model को एक बार दिखाता है, `gemma4` और `gemma4:latest` दोनों दिखाने या bare alias को फिर से pull करने के बजाय. `Cloud + Local` यह भी check करता है कि वह Ollama host cloud access के लिए signed in है या नहीं.
      </Step>
      <Step title="Verify करें कि model available है">
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

    Optionally custom base URL या model specify करें:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **इसके लिए सबसे अच्छा:** cloud या local setup पर पूरा control.

    <Steps>
      <Step title="Cloud या local चुनें">
        - **Cloud + Local**: Ollama install करें, `ollama signin` से sign in करें, और cloud requests को उस host के ज़रिए route करें
        - **Cloud only**: `OLLAMA_API_KEY` के साथ `https://ollama.com` उपयोग करें
        - **Local only**: [ollama.com/download](https://ollama.com/download) से Ollama install करें

      </Step>
      <Step title="Local model pull करें (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw के लिए Ollama enable करें">
        `Cloud only` के लिए, अपना वास्तविक `OLLAMA_API_KEY` उपयोग करें. Host-backed setups के लिए, कोई भी placeholder value काम करती है:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="अपना model inspect और set करें">
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

## Cloud models

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` local और cloud दोनों models के control point के रूप में reachable Ollama host का उपयोग करता है. यह Ollama का preferred hybrid flow है.

    Setup के दौरान **Cloud + Local** का उपयोग करें. OpenClaw Ollama base URL के लिए prompt करता है, उस host से local models discover करता है, और `ollama signin` के साथ check करता है कि host cloud access के लिए signed in है या नहीं. जब host signed in होता है, OpenClaw `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, और `glm-5.1:cloud` जैसे hosted cloud defaults भी suggest करता है.

    अगर host अभी signed in नहीं है, तो OpenClaw setup को local-only रखता है जब तक आप `ollama signin` नहीं चलाते.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` Ollama के hosted API पर `https://ollama.com` के विरुद्ध चलता है.

    Setup के दौरान **Cloud only** का उपयोग करें. OpenClaw `OLLAMA_API_KEY` के लिए prompt करता है, `baseUrl: "https://ollama.com"` set करता है, और hosted cloud model list seed करता है. इस path को local Ollama server या `ollama signin` की आवश्यकता **नहीं** होती.

    `openclaw onboard` के दौरान दिखाई गई cloud model list live रूप से `https://ollama.com/api/tags` से populated होती है, 500 entries पर capped होती है, इसलिए picker static seed के बजाय current hosted catalog reflect करता है. अगर setup time पर `ollama.com` unreachable है या कोई models return नहीं करता, तो OpenClaw previous hardcoded suggestions पर fallback करता है ताकि onboarding फिर भी complete हो सके.

    आप first-class cloud provider को directly भी configure कर सकते हैं:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Local-only mode में, OpenClaw configured Ollama instance से models discover करता है. यह path local या self-hosted Ollama servers के लिए है.

    OpenClaw currently local default के रूप में `gemma4` suggest करता है.

  </Tab>
</Tabs>

## Model discovery (implicit provider)

जब आप `OLLAMA_API_KEY` (या auth profile) set करते हैं और `models.providers.ollama` या `api: "ollama"` वाले किसी अन्य custom remote provider को define **नहीं** करते, OpenClaw `http://127.0.0.1:11434` पर local Ollama instance से models discover करता है.

| व्यवहार             | विवरण                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog query        | `/api/tags` query करता है                                                                                                                                                  |
| Capability detection | `contextWindow`, expanded `num_ctx` Modelfile parameters, और vision/tools सहित capabilities पढ़ने के लिए best-effort `/api/show` lookups का उपयोग करता है                       |
| Vision models        | `/api/show` द्वारा reported `vision` capability वाले models को image-capable (`input: ["text", "image"]`) mark किया जाता है, इसलिए OpenClaw prompt में images auto-inject करता है  |
| Reasoning detection  | Available होने पर `/api/show` capabilities का उपयोग करता है, जिसमें `thinking` शामिल है; जब Ollama capabilities omit करता है तो model-name heuristic (`r1`, `reasoning`, `think`) पर fallback करता है |
| Token limits         | `maxTokens` को OpenClaw द्वारा उपयोग किए जाने वाले default Ollama max-token cap पर set करता है                                                                                                |
| Costs                | सभी costs को `0` पर set करता है                                                                                                                                                |

यह manual model entries से बचाता है और catalog को local Ollama instance के साथ aligned रखता है. आप local `infer model run` में `ollama/<pulled-model>:latest` जैसा full ref उपयोग कर सकते हैं; OpenClaw hand-written `models.json` entry की आवश्यकता के बिना उस installed model को Ollama के live catalog से resolve करता है.

Signed-in Ollama hosts के लिए, कुछ `:cloud` models `/api/tags` में appear होने से पहले `/api/chat`
और `/api/show` के ज़रिए usable हो सकते हैं. जब आप explicitly full
`ollama/<model>:cloud` ref select करते हैं, OpenClaw उस exact missing model को
`/api/show` से validate करता है और केवल तब runtime catalog में add करता है जब Ollama model
metadata confirm करता है. Typos auto-created होने के बजाय unknown models के रूप में fail होते हैं.

```bash
# See what models are available
ollama list
openclaw models list
```

Full agent tool surface से बचने वाले narrow text-generation smoke test के लिए,
full Ollama model ref के साथ local `infer model run` उपयोग करें:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

वह path अभी भी OpenClaw के configured provider, auth, और native Ollama
transport का उपयोग करता है, लेकिन chat-agent turn start नहीं करता या MCP/tool context load नहीं करता. अगर
यह succeed होता है जबकि normal agent replies fail होते हैं, तो अगला troubleshoot model की agent
prompt/tool capacity करें.

उसी lean path पर narrow vision-model smoke test के लिए, `infer model run` में एक या अधिक
image files add करें. यह prompt और image को directly selected Ollama vision model को भेजता है,
chat tools, memory, या prior session context load किए बिना:

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
JPEG, और WebP इनपुट शामिल हैं। गैर-छवि फ़ाइलें Ollama को कॉल करने से पहले अस्वीकार कर दी जाती हैं।
स्पीच रिकग्निशन के लिए, इसके बजाय `openclaw infer audio transcribe` का उपयोग करें।

जब आप किसी बातचीत को `/model ollama/<model>` से स्विच करते हैं, OpenClaw इसे
उपयोगकर्ता का सटीक चयन मानता है। यदि कॉन्फ़िगर किया गया Ollama `baseUrl`
पहुंच योग्य नहीं है, तो अगला उत्तर किसी अन्य कॉन्फ़िगर किए गए fallback मॉडल से चुपचाप
जवाब देने के बजाय provider त्रुटि के साथ विफल हो जाता है।

अलग-थलग cron jobs एजेंट टर्न शुरू करने से पहले एक अतिरिक्त स्थानीय सुरक्षा जांच करते हैं।
यदि चयनित मॉडल किसी स्थानीय, निजी-नेटवर्क, या `.local`
Ollama provider पर resolve होता है और `/api/tags` पहुंच योग्य नहीं है, तो OpenClaw उस cron run को
त्रुटि टेक्स्ट में चयनित `ollama/<model>` के साथ `skipped` के रूप में रिकॉर्ड करता है। endpoint
preflight 5 मिनट के लिए cache किया जाता है, इसलिए उसी बंद Ollama daemon की ओर इंगित कई cron jobs
सभी विफल मॉडल requests लॉन्च नहीं करते।

स्थानीय text path, native stream path, और embeddings को local Ollama के साथ live-verify करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API-key smoke tests के लिए, live test को `https://ollama.com`
पर point करें और वर्तमान catalog से hosted model चुनें:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

cloud smoke text, native stream, और web search चलाता है। यह
`https://ollama.com` के लिए default रूप से embeddings छोड़ देता है क्योंकि Ollama Cloud API keys
`/api/embed` को authorize नहीं कर सकतीं। जब आप स्पष्ट रूप से चाहते हैं कि
configured cloud key embed endpoint का उपयोग नहीं कर सकती तो live test विफल हो, तब
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` सेट करें।

नया मॉडल जोड़ने के लिए, उसे बस Ollama से pull करें:

```bash
ollama pull mistral
```

नया मॉडल अपने आप खोजा जाएगा और उपयोग के लिए उपलब्ध होगा।

<Note>
यदि आप `models.providers.ollama` को स्पष्ट रूप से सेट करते हैं, या `models.providers.ollama-cloud` जैसे custom remote provider को `api: "ollama"` के साथ configure करते हैं, तो auto-discovery छोड़ दी जाती है और आपको models manually define करने होंगे। `http://127.0.0.2:11434` जैसे loopback custom providers को अब भी local माना जाता है। नीचे explicit config section देखें।
</Note>

## Node-स्थानीय इन्फ़रेंस

एजेंट किसी छोटे कार्य को paired desktop या server node पर install किए गए Ollama model को delegate कर सकते हैं।
prompt और response मौजूदा authenticated
Gateway/node connection से गुजरते हैं; model request चयनित node पर उसके
standard loopback Ollama endpoint (`http://127.0.0.1:11434`) के विरुद्ध चलता है।

<Steps>
  <Step title="Node पर Ollama शुरू करें">
    कम से कम एक chat model pull करें और Ollama को चलाए रखें:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Node host connect करें">
    Ollama वाली उसी machine पर, एक node host को Gateway से connect करें:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    नए device और उसके declared node commands को Gateway host पर approve करें,
    फिर node verify करें:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    पहला connection और Ollama commands जोड़ने वाला upgrade, दोनों
    node-command approval trigger कर सकते हैं। यदि node `ollama.models` और `ollama.chat`
    advertise किए बिना connect होता है, तो `openclaw nodes pending` फिर से check करें।

  </Step>
  <Step title="एजेंट से local inference उपयोग करने को कहें">
    bundled Ollama plugin `node_inference` tool expose करता है। एजेंट पहले
    `action: "discover"` उपयोग करते हैं, फिर returned node और
    model के साथ `action: "run"`। यदि ठीक एक capable node connected है, तो `run` node omit कर सकता है।

    उदाहरण के लिए: “मेरे nodes पर Ollama models discover करें, फिर इस text को summarize करने के लिए सबसे तेज़
    loaded model का उपयोग करें।”

  </Step>
</Steps>

Discovery `/api/tags` पढ़ता है, `/api/show` capabilities check करता है, और जब उपलब्ध हो तो `/api/ps`
का उपयोग करके पहले से loaded models को पहले rank करता है। यह केवल local
chat-capable models return करता है: Ollama Cloud rows और embedding-only models exclude किए जाते हैं।
हर run Ollama से model thinking disable करने को कहता है और output को 512 tokens तक cap करता है,
जब तक tool call अलग `maxTokens` value request न करे। कुछ models, जैसे
GPT-OSS, thinking disable करने का support नहीं करते और फिर भी reasoning tokens उपयोग कर सकते हैं।

Ollama को node पर चलाते हुए agents के लिए उपलब्ध न कराने के लिए, उस node host द्वारा उपयोग किए गए config में
निम्न सेट करें:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

यदि node ऊपर setup से foreground `openclaw node run` command का उपयोग करता है,
तो उस process को stop करें और command फिर से run करें। यदि यह installed node
service का उपयोग करता है, तो `openclaw node restart` run करें।

node `ollama.models` और `ollama.chat` advertise करना बंद कर देता है; Ollama खुद और
Gateway का Ollama provider अपरिवर्तित रहते हैं। value को `true` पर set करें और
local inference को फिर से advertise करने के लिए node restart करें। बदला हुआ command surface
reconnect के बाद `openclaw nodes pending` के माध्यम से approval मांग सकता है।

आप agent turn के बिना वही node commands verify कर सकते हैं:

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

Node-स्थानीय इन्फ़रेंस जानबूझकर किसी remote या cloud
`models.providers.ollama.baseUrl` को reuse नहीं करता। node के standard loopback
endpoint पर Ollama start करें। node commands macOS, Linux, और
Windows node hosts पर default रूप से उपलब्ध हैं और सामान्य node pairing और command
policy के अधीन रहते हैं।

## विज़न और छवि विवरण

bundled Ollama plugin Ollama को image-capable media-understanding provider के रूप में register करता है। इससे OpenClaw explicit image-description requests और configured image-model defaults को local या hosted Ollama vision models के माध्यम से route कर सकता है।

local vision के लिए, images support करने वाला model pull करें:

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

`--model` एक full `<provider/model>` ref होना चाहिए। जब यह set होता है, तो `openclaw infer image describe` description छोड़ने के बजाय पहले उस model को try करता है क्योंकि model native vision support करता है। यदि model call fail होता है, तो OpenClaw configured `agents.defaults.imageModel.fallbacks` के माध्यम से continue कर सकता है; file या URL preparation errors fallback attempts से पहले ही fail होती हैं।

जब आप OpenClaw का image-understanding provider flow, configured `agents.defaults.imageModel`, और image-description output shape चाहते हैं, तो `infer image describe` उपयोग करें। जब आप custom prompt और एक या अधिक images के साथ raw multimodal model probe चाहते हैं, तो `infer model run --file` उपयोग करें।

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

full `ollama/<model>` ref को प्राथमिकता दें। यदि वही model `models.providers.ollama.models` के अंतर्गत `input: ["text", "image"]` के साथ listed है और कोई अन्य configured image provider उस bare model ID को expose नहीं करता, तो OpenClaw `qwen2.5vl:7b` जैसे bare `imageModel` ref को भी `ollama/qwen2.5vl:7b` में normalize करता है। यदि एक से अधिक configured image providers के पास same bare ID है, तो provider prefix explicitly उपयोग करें।

Slow local vision models को cloud models की तुलना में longer image-understanding timeout की जरूरत हो सकती है। वे constrained hardware पर Ollama द्वारा पूरा advertised vision context allocate करने की कोशिश करने पर crash या stop भी हो सकते हैं। capability timeout set करें, और जब आपको केवल normal image-description turn चाहिए हो तो model entry पर `num_ctx` cap करें:

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

यह timeout inbound image understanding और उस explicit `image` tool पर लागू होता है जिसे agent turn के दौरान call कर सकता है। Provider-level `models.providers.ollama.timeoutSeconds` अब भी normal model calls के लिए underlying Ollama HTTP request guard नियंत्रित करता है।

explicit image tool को local Ollama के विरुद्ध live-verify करें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

यदि आप `models.providers.ollama.models` manually define करते हैं, तो vision models को image input support के साथ mark करें:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw उन models के लिए image-description requests reject करता है जिन्हें image-capable mark नहीं किया गया है। implicit discovery के साथ, जब `/api/show` vision capability report करता है तो OpenClaw इसे Ollama से पढ़ता है।

## कॉन्फ़िगरेशन

<Tabs>
  <Tab title="बेसिक (implicit discovery)">
    सबसे सरल local-only enablement path environment variable के माध्यम से है:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    यदि `OLLAMA_API_KEY` set है, तो आप provider entry में `apiKey` omit कर सकते हैं और OpenClaw availability checks के लिए इसे भर देगा।
    </Tip>

  </Tab>

  <Tab title="स्पष्ट (manual models)">
    explicit config का उपयोग तब करें जब आप hosted cloud setup चाहते हैं, Ollama किसी दूसरे host/port पर चलता है, आप specific context windows या model lists force करना चाहते हैं, या आप पूरी तरह manual model definitions चाहते हैं।

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
    यदि Ollama किसी अलग host या port पर चल रहा है (explicit config auto-discovery disable करता है, इसलिए models manually define करें):

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
    URL में `/v1` न जोड़ें। `/v1` path OpenAI-compatible mode का उपयोग करता है, जहां tool calling reliable नहीं है। path suffix के बिना base Ollama URL उपयोग करें।
    </Warning>

  </Tab>
</Tabs>

## सामान्य विधियाँ

इन्हें शुरुआती बिंदु के रूप में उपयोग करें और मॉडल ID को `ollama list` या `openclaw models list --provider ollama` से मिले सटीक नामों से बदलें।

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    इसका उपयोग तब करें जब Ollama, Gateway वाली ही मशीन पर चल रहा हो और आप चाहते हों कि OpenClaw इंस्टॉल किए गए मॉडलों को अपने-आप खोजे।

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    यह पथ कॉन्फिग को न्यूनतम रखता है। जब तक आप मॉडलों को मैन्युअल रूप से परिभाषित नहीं करना चाहते, `models.providers.ollama` ब्लॉक न जोड़ें।

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    LAN होस्ट के लिए मूल Ollama URL का उपयोग करें। `/v1` न जोड़ें।

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

    `contextWindow` OpenClaw-पक्ष का संदर्भ बजट है। `params.num_ctx` अनुरोध के लिए Ollama को भेजा जाता है। जब आपका हार्डवेयर मॉडल के पूरे घोषित संदर्भ को नहीं चला सकता, तो इन्हें संरेखित रखें।

  </Accordion>

  <Accordion title="Ollama Cloud only">
    इसका उपयोग तब करें जब आप local daemon नहीं चला रहे हों और hosted Ollama मॉडल सीधे चाहते हों।

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
    इसका उपयोग तब करें जब local या LAN Ollama daemon `ollama signin` से साइन इन हो और उसे local मॉडल और `:cloud` मॉडल, दोनों उपलब्ध कराने हों।

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
    जब आपके पास एक से अधिक Ollama सर्वर हों, तो कस्टम provider ID का उपयोग करें। हर provider को अपना होस्ट, मॉडल, प्रमाणीकरण, timeout, और मॉडल refs मिलते हैं।

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

    जब OpenClaw अनुरोध भेजता है, तो सक्रिय provider prefix हटा दिया जाता है, ताकि `ollama-large/qwen3.5:27b` Ollama तक `qwen3.5:27b` के रूप में पहुँचे।

  </Accordion>

  <Accordion title="Lean local model profile">
    कुछ local मॉडल सरल prompts का उत्तर दे सकते हैं, लेकिन पूरे agent tool surface के साथ संघर्ष करते हैं। global runtime settings बदलने से पहले tools और context को सीमित करके शुरू करें।

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

    `compat.supportsTools: false` का उपयोग केवल तब करें जब मॉडल या सर्वर tool schemas पर लगातार विफल होता हो। यह स्थिरता के बदले agent capability घटाता है।
    `localModelLean` direct agent surface से browser, Cron, और message tools हटाता है और बड़े catalogs को structured Tool Search controls के पीछे default करता है, सिवाय तब जब किसी run को direct message delivery semantics बनाए रखने हों, लेकिन यह Ollama के runtime context या thinking mode को नहीं बदलता। छोटे Qwen-style thinking models के लिए, जो loop करते हैं या अपना response budget hidden reasoning पर खर्च कर देते हैं, इसे explicit `params.num_ctx` और `params.thinking: false` के साथ जोड़ें।

  </Accordion>
</AccordionGroup>

### मॉडल चयन

कॉन्फिगर होने के बाद, आपके सभी Ollama मॉडल उपलब्ध होते हैं:

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

कस्टम Ollama provider ids भी समर्थित हैं। जब कोई model ref सक्रिय
provider prefix का उपयोग करता है, जैसे `ollama-spark/qwen3:32b`, OpenClaw Ollama को कॉल करने से पहले केवल वही
prefix हटाता है, ताकि सर्वर को `qwen3:32b` मिले।

धीमे local models के लिए, पूरे agent runtime timeout को बढ़ाने से पहले provider-scoped request tuning को प्राथमिकता दें:

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
जब first-turn load time bottleneck हो, तो इसे प्रति मॉडल set करें।

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

remote hosts के लिए, `127.0.0.1` को `baseUrl` में उपयोग किए गए host से बदलें। यदि `curl` काम करता है लेकिन OpenClaw नहीं, तो जाँचें कि Gateway किसी अलग मशीन, container, या service account पर तो नहीं चल रहा।

## Ollama Web Search

OpenClaw bundled `web_search` provider के रूप में **Ollama Web Search** का समर्थन करता है।

| गुण         | विवरण                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| होस्ट       | आपके configured Ollama host का उपयोग करता है (`models.providers.ollama.baseUrl` set होने पर, अन्यथा `http://127.0.0.1:11434`); `https://ollama.com` hosted API को सीधे उपयोग करता है |
| प्रमाणीकरण  | signed-in local Ollama hosts के लिए key-free; direct `https://ollama.com` search या auth-protected hosts के लिए `OLLAMA_API_KEY` या configured provider auth               |
| आवश्यकता   | Local/self-hosted hosts चल रहे होने चाहिए और `ollama signin` से signed in होने चाहिए; direct hosted search के लिए `baseUrl: "https://ollama.com"` और असली Ollama API key चाहिए |

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
पूरे setup और behavior विवरण के लिए, [Ollama Web Search](/hi/tools/ollama-search) देखें।
</Note>

## उन्नत कॉन्फिगरेशन

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **OpenAI-compatible mode में tool calling विश्वसनीय नहीं है।** इस mode का उपयोग केवल तब करें जब आपको किसी proxy के लिए OpenAI format चाहिए और आप native tool calling behavior पर निर्भर न हों।
    </Warning>

    यदि आपको इसके बजाय OpenAI-compatible endpoint का उपयोग करना हो (उदाहरण के लिए, ऐसे proxy के पीछे जो केवल OpenAI format का समर्थन करता है), तो `api: "openai-completions"` स्पष्ट रूप से set करें:

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

    जब Ollama के साथ `api: "openai-completions"` उपयोग किया जाता है, तो OpenClaw default रूप से `options.num_ctx` inject करता है, ताकि Ollama चुपचाप 4096 context window पर वापस न जाए। यदि आपका proxy/upstream अज्ञात `options` fields reject करता है, तो इस behavior को disable करें:

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
    auto-discovered models के लिए, OpenClaw उपलब्ध होने पर Ollama द्वारा report की गई context window का उपयोग करता है, जिसमें custom Modelfiles से बड़े `PARAMETER num_ctx` values भी शामिल हैं। अन्यथा यह OpenClaw द्वारा उपयोग की जाने वाली default Ollama context window पर fall back करता है।

    आप उस Ollama प्रदाता के अंतर्गत हर मॉडल के लिए प्रदाता-स्तर के `contextWindow`, `contextTokens`, और `maxTokens` डिफ़ॉल्ट सेट कर सकते हैं, फिर आवश्यकता होने पर उन्हें प्रति मॉडल ओवरराइड कर सकते हैं। `contextWindow` OpenClaw का प्रॉम्प्ट और Compaction बजट है। नेटिव Ollama अनुरोध `options.num_ctx` को सेट नहीं करते, जब तक आप स्पष्ट रूप से `params.num_ctx` कॉन्फ़िगर नहीं करते, ताकि Ollama अपना मॉडल, `OLLAMA_CONTEXT_LENGTH`, या VRAM-आधारित डिफ़ॉल्ट लागू कर सके। Modelfile को दोबारा बनाए बिना Ollama के प्रति-अनुरोध रनटाइम संदर्भ को सीमित या बाध्य करने के लिए, `params.num_ctx` सेट करें; अमान्य, शून्य, ऋणात्मक, और अपरिमित मान अनदेखे किए जाते हैं। यदि आपने किसी पुराने कॉन्फ़िग को अपग्रेड किया है जो नेटिव Ollama अनुरोध संदर्भ को बाध्य करने के लिए केवल `contextWindow` या `maxTokens` का उपयोग करता था, तो उन स्पष्ट प्रदाता या मॉडल बजटों को `params.num_ctx` में कॉपी करने के लिए `openclaw doctor --fix` चलाएँ। OpenAI-संगत Ollama एडॉप्टर अभी भी कॉन्फ़िगर किए गए `params.num_ctx` या `contextWindow` से डिफ़ॉल्ट रूप से `options.num_ctx` इंजेक्ट करता है; यदि आपका अपस्ट्रीम `options` अस्वीकार करता है, तो इसे `injectNumCtxForOpenAICompat: false` से अक्षम करें।

    नेटिव Ollama मॉडल प्रविष्टियाँ `params` के अंतर्गत सामान्य Ollama रनटाइम विकल्प भी स्वीकार करती हैं, जिनमें `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, और `use_mmap` शामिल हैं। OpenClaw केवल Ollama अनुरोध कुंजियाँ आगे भेजता है, इसलिए `streaming` जैसे OpenClaw रनटाइम params Ollama तक लीक नहीं होते। शीर्ष-स्तरीय Ollama `think` भेजने के लिए `params.think` या `params.thinking` का उपयोग करें; `false` Qwen-शैली के thinking मॉडलों के लिए API-स्तर thinking को अक्षम करता है।

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

    प्रति-मॉडल `agents.defaults.models["ollama/<model>"].params.num_ctx` भी काम करता है। यदि दोनों कॉन्फ़िगर किए गए हैं, तो स्पष्ट प्रदाता मॉडल प्रविष्टि एजेंट डिफ़ॉल्ट पर प्राथमिकता पाती है।

  </Accordion>

  <Accordion title="Thinking नियंत्रण">
    नेटिव Ollama मॉडलों के लिए, OpenClaw thinking नियंत्रण को वैसे ही आगे भेजता है जैसे Ollama अपेक्षा करता है: शीर्ष-स्तरीय `think`, `options.think` नहीं। स्वतः खोजे गए मॉडल जिनकी `/api/show` प्रतिक्रिया में `thinking` क्षमता शामिल है, `/think low`, `/think medium`, `/think high`, और `/think max` उपलब्ध कराते हैं; non-thinking मॉडल केवल `/think off` उपलब्ध कराते हैं।

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    आप मॉडल डिफ़ॉल्ट भी सेट कर सकते हैं:

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

    प्रति-मॉडल `params.think` या `params.thinking` किसी विशिष्ट कॉन्फ़िगर किए गए मॉडल के लिए Ollama API thinking को अक्षम या बाध्य कर सकता है। OpenClaw उन स्पष्ट मॉडल params को तब सुरक्षित रखता है जब सक्रिय रन में केवल अंतर्निहित डिफ़ॉल्ट `off` हो; `/think medium` जैसे non-off रनटाइम कमांड फिर भी सक्रिय रन को ओवरराइड करते हैं।

  </Accordion>

  <Accordion title="Reasoning मॉडल">
    OpenClaw `deepseek-r1`, `reasoning`, या `think` जैसे नामों वाले मॉडलों को डिफ़ॉल्ट रूप से reasoning-सक्षम मानता है।

    ```bash
    ollama pull deepseek-r1:32b
    ```

    कोई अतिरिक्त कॉन्फ़िगरेशन आवश्यक नहीं है। OpenClaw उन्हें स्वचालित रूप से चिह्नित करता है।

  </Accordion>

  <Accordion title="मॉडल लागतें">
    Ollama मुफ़्त है और स्थानीय रूप से चलता है, इसलिए सभी मॉडल लागतें $0 पर सेट हैं। यह स्वतः खोजे गए और मैन्युअल रूप से परिभाषित, दोनों प्रकार के मॉडलों पर लागू होता है।
  </Accordion>

  <Accordion title="मेमरी embeddings">
    बंडल किया गया Ollama Plugin
    [मेमरी खोज](/hi/concepts/memory) के लिए मेमरी embedding प्रदाता पंजीकृत करता है। यह कॉन्फ़िगर किए गए Ollama आधार URL
    और API कुंजी का उपयोग करता है, Ollama के वर्तमान `/api/embed` endpoint को कॉल करता है, और संभव होने पर
    कई मेमरी chunks को एक `input` अनुरोध में batch करता है।

    जब `proxy.enabled=true` होता है, तो कॉन्फ़िगर किए गए `baseUrl` से निकले सटीक
    host-local loopback origin के लिए Ollama मेमरी embedding अनुरोध
    managed forward proxy के बजाय OpenClaw के संरक्षित direct path का उपयोग करते हैं। कॉन्फ़िगर किया गया hostname स्वयं `localhost` या loopback IP literal होना चाहिए;
    DNS नाम जो केवल loopback पर resolve होते हैं, वे फिर भी managed proxy path का उपयोग करते हैं।
    LAN, tailnet, private-network, और public Ollama hosts भी
    managed proxy path पर ही रहते हैं। किसी दूसरे host या port पर redirect trust inherit नहीं करता।
    ऑपरेटर फिर भी global `proxy.loopbackMode: "proxy"` setting सेट कर सकते हैं ताकि
    loopback traffic proxy के माध्यम से भेजा जाए, या `proxy.loopbackMode: "block"`
    ताकि connection खोलने से पहले loopback connections अस्वीकार किए जाएँ; इस setting के
    process-wide प्रभाव के लिए
    [Managed proxy](/hi/security/network-proxy#gateway-loopback-mode) देखें।

    | गुण      | मान               |
    | ------------- | ------------------- |
    | डिफ़ॉल्ट मॉडल | `nomic-embed-text`  |
    | Auto-pull     | हाँ — embedding मॉडल स्थानीय रूप से मौजूद न होने पर स्वचालित रूप से pull किया जाता है |

    Query-time embeddings उन मॉडलों के लिए retrieval prefixes का उपयोग करते हैं जिन्हें उनकी आवश्यकता होती है या जो उनकी अनुशंसा करते हैं, जिनमें `nomic-embed-text`, `qwen3-embedding`, और `mxbai-embed-large` शामिल हैं। मेमरी दस्तावेज़ batches raw रहते हैं ताकि मौजूदा indexes को format migration की आवश्यकता न हो।

    Ollama को मेमरी खोज embedding प्रदाता के रूप में चुनने के लिए:

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

  <Accordion title="Streaming कॉन्फ़िगरेशन">
    OpenClaw का Ollama integration डिफ़ॉल्ट रूप से **native Ollama API** (`/api/chat`) का उपयोग करता है, जो streaming और tool calling दोनों को साथ-साथ पूरी तरह support करता है। कोई विशेष कॉन्फ़िगरेशन आवश्यक नहीं है।

    native `/api/chat` अनुरोधों के लिए, OpenClaw thinking नियंत्रण को सीधे Ollama तक भी आगे भेजता है: `/think off` और `openclaw agent --thinking off` शीर्ष-स्तरीय `think: false` भेजते हैं, जब तक कोई स्पष्ट model `params.think`/`params.thinking` value कॉन्फ़िगर न हो, जबकि `/think low|medium|high` मेल खाती शीर्ष-स्तरीय `think` effort string भेजते हैं। `/think max` Ollama के सर्वोच्च native effort, `think: "high"`, पर map होता है।

    <Tip>
    यदि आपको OpenAI-संगत endpoint का उपयोग करना है, तो ऊपर “Legacy OpenAI-compatible mode” अनुभाग देखें। उस mode में streaming और tool calling साथ-साथ काम न कर सकते हैं।
    </Tip>

  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="WSL2 crash loop (बार-बार reboots)">
    NVIDIA/CUDA वाले WSL2 पर, आधिकारिक Ollama Linux installer `Restart=always` के साथ एक `ollama.service` systemd unit बनाता है। यदि वह service autostart होती है और WSL2 boot के दौरान GPU-backed model load करती है, तो model load होते समय Ollama host memory को pin कर सकता है। Hyper-V memory reclaim हमेशा उन pinned pages को reclaim नहीं कर सकता, इसलिए Windows WSL2 VM को terminate कर सकता है, systemd Ollama को फिर शुरू करता है, और loop दोहराता है।

    सामान्य प्रमाण:

    - Windows side से बार-बार WSL2 reboots या terminations
    - WSL2 startup के तुरंत बाद `app.slice` या `ollama.service` में उच्च CPU
    - Linux OOM-killer event के बजाय systemd से SIGTERM

    OpenClaw startup warning log करता है जब वह WSL2, `Restart=always` के साथ enabled `ollama.service`, और visible CUDA markers detect करता है।

    शमन:

    ```bash
    sudo systemctl disable ollama
    ```

    इसे Windows side पर `%USERPROFILE%\.wslconfig` में जोड़ें, फिर `wsl --shutdown` चलाएँ:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama service environment में shorter keep-alive सेट करें, या Ollama को केवल आवश्यकता होने पर manually start करें:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) देखें।

  </Accordion>

  <Accordion title="Ollama detect नहीं हुआ">
    सुनिश्चित करें कि Ollama चल रहा है और आपने `OLLAMA_API_KEY` (या कोई auth profile) सेट किया है, और आपने कोई स्पष्ट `models.providers.ollama` entry परिभाषित **नहीं** की है:

    ```bash
    ollama serve
    ```

    सत्यापित करें कि API accessible है:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="कोई मॉडल उपलब्ध नहीं">
    यदि आपका मॉडल सूचीबद्ध नहीं है, तो या तो model को locally pull करें या उसे `models.providers.ollama` में स्पष्ट रूप से define करें।

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

    - `baseUrl` `localhost` की ओर इंगित करता है, लेकिन Gateway Docker में या किसी दूसरे host पर चलता है।
    - URL `/v1` का उपयोग करता है, जो native Ollama के बजाय OpenAI-संगत behavior चुनता है।
    - remote host को Ollama side पर firewall या LAN binding changes की आवश्यकता है।
    - model आपके laptop के daemon पर मौजूद है लेकिन remote daemon पर नहीं।

  </Accordion>

  <Accordion title="मॉडल tool JSON को text के रूप में output करता है">
    इसका आम तौर पर अर्थ है कि provider OpenAI-संगत mode का उपयोग कर रहा है या model tool schemas संभाल नहीं सकता।

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

    यदि कोई छोटा local model फिर भी tool schemas पर विफल होता है, तो उस model entry पर `compat.supportsTools: false` सेट करें और फिर retest करें।

  </Accordion>

  <Accordion title="Kimi या GLM garbled symbols लौटाता है">
    Hosted Kimi/GLM प्रतिक्रियाएँ जो लंबी, non-linguistic symbol runs होती हैं, उन्हें सफल assistant answer के बजाय failed provider output माना जाता है। इससे corrupted text को session में persist किए बिना normal retry, fallback, या error handling takeover कर सकती है।

    यदि यह बार-बार होता है, तो raw model name, current session file, और क्या run ने `Cloud + Local` या `Cloud only` उपयोग किया, capture करें, फिर fresh session और fallback model आज़माएँ:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    बड़े local models को streaming शुरू होने से पहले लंबे first load की आवश्यकता हो सकती है। timeout को Ollama provider तक scoped रखें, और वैकल्पिक रूप से Ollama से turns के बीच model loaded रखने को कहें:

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

    यदि होस्ट स्वयं कनेक्शन स्वीकार करने में धीमा है, तो `timeoutSeconds` इस प्रदाता के लिए सुरक्षित Undici कनेक्ट टाइमआउट को भी बढ़ाता है।

  </Accordion>

  <Accordion title="बड़े-कॉन्टेक्स्ट वाला मॉडल बहुत धीमा है या मेमोरी खत्म हो जाती है">
    कई Ollama मॉडल ऐसे कॉन्टेक्स्ट विज्ञापित करते हैं जो आपके हार्डवेयर पर आराम से चलाने के लिए बहुत बड़े होते हैं। Native Ollama, Ollama का अपना रनटाइम कॉन्टेक्स्ट डिफ़ॉल्ट उपयोग करता है, जब तक आप `params.num_ctx` सेट नहीं करते। जब आपको अनुमानित first-token latency चाहिए, तो OpenClaw के बजट और Ollama के अनुरोध कॉन्टेक्स्ट, दोनों को सीमित करें:

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

    यदि OpenClaw बहुत अधिक prompt भेज रहा है, तो पहले `contextWindow` घटाएँ। यदि Ollama ऐसा रनटाइम कॉन्टेक्स्ट लोड कर रहा है जो मशीन के लिए बहुत बड़ा है, तो `params.num_ctx` घटाएँ। यदि generation बहुत देर तक चलता है, तो `maxTokens` घटाएँ।

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq).
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, मॉडल refs, और failover व्यवहार का अवलोकन।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/models" icon="brain">
    मॉडल कैसे चुनें और कॉन्फ़िगर करें।
  </Card>
  <Card title="Ollama वेब खोज" href="/hi/tools/ollama-search" icon="magnifying-glass">
    Ollama-संचालित वेब खोज के लिए पूरा सेटअप और व्यवहार विवरण।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    पूरा config संदर्भ।
  </Card>
</CardGroup>
