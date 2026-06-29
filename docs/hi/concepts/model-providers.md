---
read_when:
    - आपको प्रदाता-दर-प्रदाता मॉडल सेटअप संदर्भ चाहिए
    - आप मॉडल प्रदाताओं के लिए उदाहरण कॉन्फ़िग या CLI ऑनबोर्डिंग कमांड चाहते हैं
sidebarTitle: Model providers
summary: उदाहरण कॉन्फ़िगरेशन और CLI प्रवाह के साथ मॉडल प्रदाता अवलोकन
title: मॉडल प्रदाता
x-i18n:
    generated_at: "2026-06-28T23:00:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/model providers के लिए संदर्भ (WhatsApp/Telegram जैसे chat channels नहीं)। model चयन नियमों के लिए, [Models](/hi/concepts/models) देखें।

## त्वरित नियम

<AccordionGroup>
  <Accordion title="Model refs और CLI helpers">
    - Model refs `provider/model` का उपयोग करते हैं (उदाहरण: `opencode/claude-opus-4-6`)।
    - सेट होने पर `agents.defaults.models` allowlist की तरह काम करता है।
    - CLI helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`।
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` provider-स्तर के defaults सेट करते हैं; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` उन्हें प्रति model override करते हैं।
    - Fallback नियम, cooldown probes, और session-override persistence: [Model failover](/hi/concepts/model-failover)।

  </Accordion>
  <Accordion title="Provider auth जोड़ने से आपका primary model नहीं बदलता">
    जब आप किसी provider को जोड़ते या reauth करते हैं, तो `openclaw configure` मौजूदा `agents.defaults.model.primary` को सुरक्षित रखता है। `openclaw models auth login` भी ऐसा ही करता है, जब तक आप `--set-default` पास न करें। Provider plugins अपने auth config patch में अब भी recommended default model लौटा सकते हैं, लेकिन जब primary model पहले से मौजूद हो, तो OpenClaw इसे "इस model को उपलब्ध कराएं" के रूप में मानता है, "मौजूदा primary model को बदलें" के रूप में नहीं।

    Default model को जानबूझकर बदलने के लिए, `openclaw models set <provider/model>` या `openclaw models auth login --provider <id> --set-default` का उपयोग करें।

  </Accordion>
  <Accordion title="OpenAI provider/runtime विभाजन">
    OpenAI-family routes prefix-specific हैं:

    - `openai/<model>` default रूप से agent turns के लिए native Codex app-server harness का उपयोग करता है। यह सामान्य ChatGPT/Codex subscription setup है।
    - legacy Codex model refs legacy config हैं जिन्हें doctor `openai/<model>` में फिर से लिखता है।
    - `openai/<model>` और provider/model `agentRuntime.id: "openclaw"` explicit API-key या compatibility routes के लिए OpenClaw के built-in runtime का उपयोग करते हैं।

    [OpenAI](/hi/providers/openai) और [Codex harness](/hi/plugins/codex-harness) देखें। अगर provider/runtime विभाजन भ्रमित कर रहा है, तो पहले [Agent runtimes](/hi/concepts/agent-runtimes) पढ़ें।

    Plugin auto-enable वही boundary follow करता है: `openai/*` agent refs default route के लिए Codex plugin enable करते हैं, और explicit provider/model `agentRuntime.id: "codex"` या legacy `codex/<model>` refs को भी इसकी आवश्यकता होती है।

    GPT-5.5 default रूप से `openai/gpt-5.5` पर native Codex app-server harness के माध्यम से उपलब्ध है, और OpenClaw runtime के माध्यम से तब उपलब्ध है जब provider/model runtime policy स्पष्ट रूप से `openclaw` चुनती है।

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes वही विभाजन उपयोग करते हैं: `anthropic/claude-*` या `google/gemini-*` जैसे canonical model refs चुनें, फिर जब आपको local CLI backend चाहिए हो, तो provider/model runtime policy को `claude-cli` या `google-gemini-cli` पर सेट करें।

    Legacy `claude-cli/*` और `google-gemini-cli/*` refs वापस canonical provider refs में migrate होते हैं, runtime अलग से recorded रहता है। Legacy `codex-cli/*` refs `openai/*` में migrate होते हैं और Codex app-server route का उपयोग करते हैं; OpenClaw अब bundled Codex CLI backend नहीं रखता।

  </Accordion>
</AccordionGroup>

## Plugin-owned provider behavior

अधिकांश provider-specific logic provider plugins (`registerProvider(...)`) में रहता है, जबकि OpenClaw generic inference loop रखता है। Plugins onboarding, model catalogs, auth env-var mapping, transport/config normalization, tool-schema cleanup, failover classification, OAuth refresh, usage reporting, thinking/reasoning profiles, और बहुत कुछ own करते हैं।

provider-SDK hooks और bundled-plugin examples की पूरी सूची [Provider plugins](/hi/plugins/sdk-provider-plugins) में है। जिस provider को पूरी तरह custom request executor चाहिए, वह एक अलग, गहरा extension surface है।

<Note>
Provider-owned runner behavior explicit provider hooks पर रहता है, जैसे replay policy, tool-schema normalization, stream wrapping, और transport/request helpers। Legacy `ProviderPlugin.capabilities` static bag केवल compatibility के लिए है और shared runner logic अब इसे नहीं पढ़ता।
</Note>

## API key rotation

<AccordionGroup>
  <Accordion title="Key sources और priority">
    कई keys इस तरह configure करें:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single live override, सबसे उच्च priority)
    - `<PROVIDER>_API_KEYS` (comma या semicolon list)
    - `<PROVIDER>_API_KEY` (primary key)
    - `<PROVIDER>_API_KEY_*` (numbered list, जैसे `<PROVIDER>_API_KEY_1`)

    Google providers के लिए, `GOOGLE_API_KEY` भी fallback के रूप में शामिल है। Key selection order priority को सुरक्षित रखता है और values को deduplicate करता है।

  </Accordion>
  <Accordion title="Rotation कब शुरू होता है">
    - Requests को अगली key के साथ केवल rate-limit responses पर retry किया जाता है (उदाहरण के लिए `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, या periodic usage-limit messages)।
    - Non-rate-limit failures तुरंत fail होते हैं; कोई key rotation attempt नहीं किया जाता।
    - जब सभी candidate keys fail हो जाती हैं, तो अंतिम error last attempt से लौटाया जाता है।

  </Accordion>
</AccordionGroup>

## Official provider plugins

Official provider plugins अपनी model catalog rows publish करते हैं। इन providers को **किसी** `models.providers` model entries की आवश्यकता नहीं होती; provider plugin enable करें, auth सेट करें, और model चुनें। `models.providers` का उपयोग केवल explicit custom providers या timeouts जैसी narrow request settings के लिए करें।

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optional rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, साथ में `OPENCLAW_LIVE_OPENAI_KEY` (single override)
- Example models: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- अगर कोई specific install या API key अलग तरह से behave करती है, तो `openclaw models list --provider openai` से account/model availability verify करें।
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Default transport `auto` है; OpenClaw transport choice को shared model runtime में pass करता है।
- प्रति model override करें `agents.defaults.models["openai/<model>"].params.transport` के जरिए (`"sse"`, `"websocket"`, या `"auto"`)
- OpenAI priority processing `agents.defaults.models["openai/<model>"].params.serviceTier` के जरिए enable की जा सकती है
- `/fast` और `params.fastMode` direct `openai/*` Responses requests को `api.openai.com` पर `service_tier=priority` से map करते हैं
- जब shared `/fast` toggle की जगह explicit tier चाहिए हो, तो `params.serviceTier` का उपयोग करें
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) केवल `api.openai.com` पर native OpenAI traffic पर लागू होते हैं, generic OpenAI-compatible proxies पर नहीं
- Native OpenAI routes Responses `store`, prompt-cache hints, और OpenAI reasoning-compat payload shaping भी बनाए रखते हैं; proxy routes ऐसा नहीं करते
- `openai/gpt-5.3-codex-spark` ChatGPT/Codex OAuth subscription auth के माध्यम से उपलब्ध है जब आपका signed-in account इसे expose करता है; OpenClaw अब भी इस model के लिए direct OpenAI API-key और Azure API-key routes को suppress करता है क्योंकि वे transports इसे reject करते हैं

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optional rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, साथ में `OPENCLAW_LIVE_ANTHROPIC_KEY` (single override)
- Example model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direct public Anthropic requests shared `/fast` toggle और `params.fastMode` support करते हैं, जिसमें `api.anthropic.com` पर भेजा गया API-key और OAuth-authenticated traffic शामिल है; OpenClaw इसे Anthropic `service_tier` (`auto` बनाम `standard_only`) से map करता है
- Preferred Claude CLI config model ref को canonical रखता है और CLI
  backend को अलग से चुनता है: `anthropic/claude-opus-4-8` के साथ
  model-scoped `agentRuntime.id: "claude-cli"`। Legacy
  `claude-cli/claude-opus-4-7` refs compatibility के लिए अब भी काम करते हैं।

<Note>
Anthropic staff ने हमें बताया कि OpenClaw-style Claude CLI usage फिर से allowed है, इसलिए OpenClaw इस integration के लिए Claude CLI reuse और `claude -p` usage को sanctioned मानता है, जब तक Anthropic कोई नई policy publish न करे। Anthropic setup-token एक supported OpenClaw token path के रूप में उपलब्ध रहता है, लेकिन OpenClaw अब उपलब्ध होने पर Claude CLI reuse और `claude -p` को prefer करता है।
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Auth: OAuth (ChatGPT)
- Legacy OpenAI Codex model ref: `openai/gpt-5.5`
- Native Codex app-server harness ref: `openai/gpt-5.5`
- Native Codex app-server harness docs: [Codex harness](/hi/plugins/codex-harness)
- Legacy model refs: `codex/gpt-*`
- Plugin boundary: `openai/*` OpenAI plugin load करता है; native Codex app-server plugin Codex harness runtime द्वारा चुना जाता है।
- CLI: `openclaw onboard --auth-choice openai` या `openclaw models auth login --provider openai`
- Default transport `auto` है (WebSocket-first, SSE fallback)
- प्रति OpenAI Codex model override करें `agents.defaults.models["openai/<model>"].params.transport` के जरिए (`"sse"`, `"websocket"`, या `"auto"`)
- `params.serviceTier` native Codex Responses requests (`chatgpt.com/backend-api`) पर भी forward किया जाता है
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) केवल `chatgpt.com/backend-api` पर native Codex traffic पर attached होते हैं, generic OpenAI-compatible proxies पर नहीं
- Direct `openai/*` जैसा वही `/fast` toggle और `params.fastMode` config share करता है; OpenClaw इसे `service_tier=priority` से map करता है
- `openai/gpt-5.5` Codex catalog native `contextWindow = 400000` और default runtime `contextTokens = 272000` का उपयोग करता है; runtime cap को `models.providers.openai.models[].contextTokens` से override करें
- Policy note: OpenAI Codex OAuth OpenClaw जैसे external tools/workflows के लिए स्पष्ट रूप से supported है।
- Common subscription plus native Codex runtime route के लिए, `openai` auth से sign in करें और `openai/gpt-5.5` configure करें; OpenAI agent turns default रूप से Codex चुनते हैं।
- Provider/model `agentRuntime.id: "openclaw"` का उपयोग केवल तब करें जब आपको built-in OpenClaw route चाहिए; अन्यथा `openai/gpt-5.5` को default Codex harness पर रखें।
- legacy Codex GPT refs legacy state हैं, live provider route नहीं। नए agent config के लिए native Codex runtime पर `openai/gpt-5.5` का उपयोग करें, और पुराने legacy Codex model refs को canonical `openai/*` refs में migrate करने के लिए `openclaw doctor --fix` चलाएं।

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### अन्य subscription-style hosted options

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/hi/providers/zai">
    Z.AI Coding Plan या general API endpoints।
  </Card>
  <Card title="MiniMax" href="/hi/providers/minimax">
    MiniMax Coding Plan OAuth या API key access।
  </Card>
  <Card title="Qwen Cloud" href="/hi/providers/qwen">
    Qwen Cloud provider surface plus Alibaba DashScope और Coding Plan endpoint mapping।
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- Example models: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` या `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- प्रदाता: `google`
- प्रमाणीकरण: `GEMINI_API_KEY`
- वैकल्पिक रोटेशन: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` फ़ॉलबैक, और `OPENCLAW_LIVE_GEMINI_KEY` (एकल ओवरराइड)
- उदाहरण मॉडल: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- संगतता: `google/gemini-3.1-flash-preview` का उपयोग करने वाला लेगेसी OpenClaw कॉन्फ़िग `google/gemini-3-flash-preview` में सामान्यीकृत किया जाता है
- उपनाम: `google/gemini-3.1-pro` स्वीकार किया जाता है और Google के लाइव Gemini API id, `google/gemini-3.1-pro-preview`, में सामान्यीकृत किया जाता है
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- सोच: `/think adaptive` Google dynamic thinking का उपयोग करता है। Gemini 3/3.1 एक निश्चित `thinkingLevel` छोड़ते हैं; Gemini 2.5 `thinkingBudget: -1` भेजता है।
- सीधे Gemini रन `agents.defaults.models["google/<model>"].params.cachedContent` (या लेगेसी `cached_content`) भी स्वीकार करते हैं, ताकि प्रदाता-नेटिव `cachedContents/...` हैंडल आगे भेजा जा सके; Gemini कैश हिट OpenClaw `cacheRead` के रूप में दिखते हैं

### Google Vertex और Gemini CLI

- प्रदाता: `google-vertex`, `google-gemini-cli`
- प्रमाणीकरण: Vertex gcloud ADC का उपयोग करता है; Gemini CLI अपने OAuth फ़्लो का उपयोग करता है

<Warning>
OpenClaw में Gemini CLI OAuth एक अनौपचारिक इंटीग्रेशन है। कुछ उपयोगकर्ताओं ने तृतीय-पक्ष क्लाइंट इस्तेमाल करने के बाद Google खाते पर प्रतिबंधों की रिपोर्ट की है। आगे बढ़ने का चुनाव करने पर Google की शर्तों की समीक्षा करें और गैर-महत्वपूर्ण खाते का उपयोग करें।
</Warning>

Gemini CLI OAuth बंडल किए गए `google` Plugin के हिस्से के रूप में शिप किया जाता है।

<Steps>
  <Step title="Gemini CLI इंस्टॉल करें">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin सक्षम करें">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="लॉग इन करें">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    डिफ़ॉल्ट मॉडल: `google-gemini-cli/gemini-3-flash-preview`। आप `openclaw.json` में क्लाइंट id या सीक्रेट पेस्ट **नहीं** करते। CLI लॉगिन फ़्लो Gateway होस्ट पर auth प्रोफ़ाइलों में टोकन स्टोर करता है।

  </Step>
  <Step title="प्रोजेक्ट सेट करें (यदि आवश्यक हो)">
    यदि लॉगिन के बाद अनुरोध विफल हों, तो Gateway होस्ट पर `GOOGLE_CLOUD_PROJECT` या `GOOGLE_CLOUD_PROJECT_ID` सेट करें।
  </Step>
</Steps>

Gemini CLI डिफ़ॉल्ट रूप से `stream-json` का उपयोग करता है। OpenClaw assistant stream
संदेश पढ़ता है और `stats.cached` को `cacheRead` में सामान्यीकृत करता है; लेगेसी
`--output-format json` ओवरराइड अब भी `response` से उत्तर टेक्स्ट पढ़ते हैं।

### Z.AI (GLM)

- प्रदाता: `zai`
- प्रमाणीकरण: `ZAI_API_KEY`
- उदाहरण मॉडल: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - मॉडल refs canonical `zai/*` प्रदाता ID का उपयोग करते हैं।
  - `zai-api-key` मिलते-जुलते Z.AI endpoint को अपने आप पहचानता है; `zai-coding-global`, `zai-coding-cn`, `zai-global`, और `zai-cn` किसी विशिष्ट सतह को बाध्य करते हैं

### Vercel AI Gateway

- प्रदाता: `vercel-ai-gateway`
- प्रमाणीकरण: `AI_GATEWAY_API_KEY`
- उदाहरण मॉडल: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### अन्य बंडल किए गए प्रदाता Plugin

| प्रदाता                                 | Id                               | प्रमाणीकरण env                                      | उदाहरण मॉडल                                                |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` या `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/hi/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth या `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/hi/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth या `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### जानने योग्य विचित्रताएं

<AccordionGroup>
  <Accordion title="OpenRouter">
    अपने app-attribution headers और Anthropic `cache_control` markers केवल सत्यापित `openrouter.ai` routes पर लागू करता है। DeepSeek, Moonshot, और ZAI refs OpenRouter-प्रबंधित prompt caching के लिए cache-TTL योग्य हैं, लेकिन Anthropic cache markers प्राप्त नहीं करते। proxy-शैली OpenAI-compatible पथ के रूप में, यह native-OpenAI-only shaping (`serviceTier`, Responses `store`, prompt-cache hints, OpenAI reasoning-compat) छोड़ देता है। Gemini-backed refs केवल proxy-Gemini thought-signature sanitation बनाए रखते हैं।
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-backed refs वही proxy-Gemini sanitation पथ अपनाते हैं; `kilocode/kilo/auto` और अन्य proxy-reasoning-unsupported refs proxy reasoning injection छोड़ देते हैं।
  </Accordion>
  <Accordion title="MiniMax">
    API-key onboarding स्पष्ट M3 और M2.7 chat model definitions लिखता है; image understanding Plugin-स्वामित्व वाले `MiniMax-VL-01` media provider पर रहता है।
  </Accordion>
  <Accordion title="NVIDIA">
    मॉडल ids `nvidia/<vendor>/<model>` namespace का उपयोग करते हैं (उदाहरण के लिए `nvidia/moonshotai/kimi-k2.5` के साथ `nvidia/nvidia/nemotron-...`); pickers literal `<provider>/<model-id>` composition को बनाए रखते हैं, जबकि API को भेजी जाने वाली canonical key single-prefixed रहती है।
  </Accordion>
  <Accordion title="xAI">
    xAI Responses पथ का उपयोग करता है। अनुशंसित पथ SuperGrok/X Premium OAuth है; API keys अब भी `XAI_API_KEY` या Plugin config के माध्यम से काम करती हैं, और Grok `web_search` API-key fallback से पहले वही auth profile फिर से उपयोग करता है। `grok-4.3` बंडल किया गया default chat model है, और `grok-build-0.1` build/coding-focused कार्य के लिए चुना जा सकता है। `/fast` या `params.fastMode: true` `grok-3`, `grok-3-mini`, `grok-4`, और `grok-4-0709` को उनके `*-fast` variants में rewrite करता है। `tool_stream` डिफ़ॉल्ट रूप से चालू है; `agents.defaults.models["xai/<model>"].params.tool_stream=false` से अक्षम करें।
  </Accordion>
</AccordionGroup>

## `models.providers` के माध्यम से प्रदाता (custom/base URL)

**custom** providers या OpenAI/Anthropic-compatible proxies जोड़ने के लिए `models.providers` (या `models.json`) का उपयोग करें।

नीचे दिए गए कई बंडल किए गए प्रदाता Plugin पहले से ही default catalog प्रकाशित करते हैं। स्पष्ट `models.providers.<id>` entries केवल तब उपयोग करें जब आप default base URL, headers, या model list को override करना चाहते हों।

Gateway मॉडल क्षमता जांचें स्पष्ट `models.providers.<id>.models[]` मेटाडेटा भी पढ़ती हैं। यदि कोई कस्टम या प्रॉक्सी मॉडल इमेज स्वीकार करता है, तो उस मॉडल पर `input: ["text", "image"]` सेट करें ताकि WebChat और node-origin अटैचमेंट पथ इमेज को केवल-टेक्स्ट मीडिया refs के बजाय नेटिव मॉडल इनपुट के रूप में पास करें।

`agents.defaults.models["provider/model"]` केवल एजेंटों के लिए मॉडल दृश्यता, aliases, और प्रति-मॉडल मेटाडेटा नियंत्रित करता है। यह अपने आप नया runtime मॉडल रजिस्टर नहीं करता। कस्टम provider मॉडल के लिए, कम से कम मिलते-जुलते `id` के साथ `models.providers.<provider>.models[]` भी जोड़ें।

### Moonshot AI (Kimi)

ऑनबोर्डिंग से पहले `@openclaw/moonshot-provider` इंस्टॉल करें। स्पष्ट `models.providers.moonshot` प्रविष्टि केवल तब जोड़ें जब आपको base URL या मॉडल मेटाडेटा ओवरराइड करना हो:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- उदाहरण मॉडल: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` या `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 मॉडल IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi coding

Kimi Coding Moonshot AI के Anthropic-compatible endpoint का उपयोग करता है:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- उदाहरण मॉडल: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

लेगेसी `kimi/kimi-code` और `kimi/k2p5` compatibility model ids के रूप में स्वीकार किए जाते हैं और Kimi के स्थिर API मॉडल id में normalize होते हैं।

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) चीन में Doubao और अन्य मॉडलों तक पहुंच प्रदान करता है।

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- उदाहरण मॉडल: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

ऑनबोर्डिंग डिफ़ॉल्ट रूप से coding surface का उपयोग करती है, लेकिन सामान्य `volcengine/*` catalog उसी समय रजिस्टर हो जाता है।

ऑनबोर्डिंग/कॉन्फ़िगर मॉडल पिकर में, Volcengine auth विकल्प `volcengine/*` और `volcengine-plan/*` दोनों पंक्तियों को प्राथमिकता देता है। अगर वे मॉडल अभी तक लोड नहीं हुए हैं, तो OpenClaw खाली provider-स्कोप्ड पिकर दिखाने के बजाय अनफ़िल्टर्ड कैटलॉग पर वापस जाता है।

<Tabs>
  <Tab title="मानक मॉडल">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="कोडिंग मॉडल (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (अंतरराष्ट्रीय)

BytePlus ARK अंतरराष्ट्रीय उपयोगकर्ताओं के लिए Volcano Engine जैसे ही मॉडल तक पहुंच देता है।

- Provider: `byteplus` (कोडिंग: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- उदाहरण मॉडल: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

ऑनबोर्डिंग डिफ़ॉल्ट रूप से कोडिंग सतह का उपयोग करती है, लेकिन सामान्य `byteplus/*` कैटलॉग भी उसी समय पंजीकृत होता है।

ऑनबोर्डिंग/कॉन्फ़िगर मॉडल पिकर में, BytePlus auth विकल्प `byteplus/*` और `byteplus-plan/*` दोनों पंक्तियों को प्राथमिकता देता है। अगर वे मॉडल अभी तक लोड नहीं हुए हैं, तो OpenClaw खाली provider-स्कोप्ड पिकर दिखाने के बजाय अनफ़िल्टर्ड कैटलॉग पर वापस जाता है।

<Tabs>
  <Tab title="मानक मॉडल">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="कोडिंग मॉडल (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic `synthetic` provider के पीछे Anthropic-संगत मॉडल उपलब्ध कराता है:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- उदाहरण मॉडल: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax को `models.providers` के जरिए कॉन्फ़िगर किया जाता है क्योंकि यह कस्टम endpoints का उपयोग करता है:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` के लिए `MINIMAX_API_KEY`; `minimax-portal` के लिए `MINIMAX_OAUTH_TOKEN` या `MINIMAX_API_KEY`

सेटअप विवरण, मॉडल विकल्पों और कॉन्फ़िग स्निपेट के लिए [/providers/minimax](/hi/providers/minimax) देखें।

<Note>
MiniMax के Anthropic-संगत स्ट्रीमिंग पथ पर, OpenClaw M2.x परिवार के लिए डिफ़ॉल्ट रूप से thinking बंद कर देता है, जब तक कि आप इसे स्पष्ट रूप से सेट न करें; MiniMax-M3 (और M3.x) डिफ़ॉल्ट रूप से provider के omitted/adaptive thinking पथ पर रहता है। `/fast on` `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में फिर से लिखता है।
</Note>

Plugin-स्वामित्व वाली क्षमता विभाजन:

- टेक्स्ट/चैट डिफ़ॉल्ट `minimax/MiniMax-M3` पर रहते हैं
- इमेज जनरेशन `minimax/image-01` या `minimax-portal/image-01` है
- इमेज समझना दोनों MiniMax auth पथों पर Plugin-स्वामित्व वाला `MiniMax-VL-01` है
- वेब खोज provider id `minimax` पर रहती है

### LM Studio

LM Studio एक bundled provider Plugin के रूप में शिप होता है, जो native API का उपयोग करता है:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- डिफ़ॉल्ट inference base URL: `http://localhost:1234/v1`

फिर एक मॉडल सेट करें (`http://localhost:1234/api/v1/models` द्वारा लौटाए गए IDs में से किसी एक से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw खोज + auto-load के लिए LM Studio के native `/api/v1/models` और `/api/v1/models/load` का उपयोग करता है, और डिफ़ॉल्ट रूप से inference के लिए `/v1/chat/completions` का। अगर आप चाहते हैं कि LM Studio JIT loading, TTL, और auto-evict मॉडल lifecycle का स्वामित्व लें, तो `models.providers.lmstudio.params.preload: false` सेट करें। सेटअप और troubleshooting के लिए [/providers/lmstudio](/hi/providers/lmstudio) देखें।

### Ollama

Ollama एक bundled provider Plugin के रूप में शिप होता है और Ollama के native API का उपयोग करता है:

- Provider: `ollama`
- Auth: आवश्यक नहीं (local server)
- उदाहरण मॉडल: `ollama/llama3.3`
- इंस्टॉलेशन: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

जब आप `OLLAMA_API_KEY` के साथ opt in करते हैं, तो Ollama को स्थानीय रूप से `http://127.0.0.1:11434` पर detect किया जाता है, और bundled provider Plugin Ollama को सीधे `openclaw onboard` और मॉडल पिकर में जोड़ देता है। ऑनबोर्डिंग, cloud/local mode, और कस्टम कॉन्फ़िगरेशन के लिए [/providers/ollama](/hi/providers/ollama) देखें।

### vLLM

vLLM local/self-hosted OpenAI-संगत सर्वरों के लिए bundled provider Plugin के रूप में शिप होता है:

- Provider: `vllm`
- Auth: वैकल्पिक (आपके server पर निर्भर)
- डिफ़ॉल्ट base URL: `http://127.0.0.1:8000/v1`

स्थानीय रूप से auto-discovery में opt in करने के लिए (अगर आपका server auth लागू नहीं करता, तो कोई भी value काम करती है):

```bash
export VLLM_API_KEY="vllm-local"
```

फिर एक मॉडल सेट करें (`/v1/models` द्वारा लौटाए गए IDs में से किसी एक से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

विवरण के लिए [/providers/vllm](/hi/providers/vllm) देखें।

### SGLang

SGLang तेज self-hosted OpenAI-संगत सर्वरों के लिए bundled provider Plugin के रूप में शिप होता है:

- Provider: `sglang`
- Auth: वैकल्पिक (आपके server पर निर्भर)
- डिफ़ॉल्ट base URL: `http://127.0.0.1:30000/v1`

स्थानीय रूप से auto-discovery में opt in करने के लिए (अगर आपका server auth लागू नहीं करता है, तो कोई भी value काम करती है):

```bash
export SGLANG_API_KEY="sglang-local"
```

फिर एक मॉडल सेट करें (`/v1/models` द्वारा लौटाए गए IDs में से किसी एक से बदलें):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

विवरण के लिए [/providers/sglang](/hi/providers/sglang) देखें।

### Local proxies (LM Studio, vLLM, LiteLLM, आदि)

उदाहरण (OpenAI-संगत):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="डिफ़ॉल्ट वैकल्पिक फ़ील्ड">
    कस्टम providers के लिए, `reasoning`, `input`, `cost`, `contextWindow`, और `maxTokens` वैकल्पिक हैं। छोड़े जाने पर, OpenClaw डिफ़ॉल्ट रूप से ये मान उपयोग करता है:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    अनुशंसित: ऐसे स्पष्ट मान सेट करें जो आपकी proxy/model सीमाओं से मेल खाते हों।

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - non-native endpoints (कोई भी non-empty `baseUrl` जिसका host `api.openai.com` नहीं है) पर `api: "openai-completions"` के लिए, OpenClaw असमर्थित `developer` भूमिकाओं के लिए provider 400 errors से बचने हेतु `compat.supportsDeveloperRole: false` बाध्य करता है।
    - Proxy-style OpenAI-संगत routes native OpenAI-only request shaping को भी छोड़ देते हैं: कोई `service_tier` नहीं, कोई Responses `store` नहीं, कोई Completions `store` नहीं, कोई prompt-cache hints नहीं, कोई OpenAI reasoning-compat payload shaping नहीं, और कोई hidden OpenClaw attribution headers नहीं।
    - vendor-specific fields की जरूरत वाले OpenAI-संगत Completions proxies के लिए, outbound request body में अतिरिक्त JSON merge करने हेतु `agents.defaults.models["provider/model"].params.extra_body` (या `extraBody`) सेट करें।
    - vLLM chat-template controls के लिए, `agents.defaults.models["provider/model"].params.chat_template_kwargs` सेट करें। bundled vLLM Plugin session thinking level बंद होने पर `vllm/nemotron-3-*` के लिए अपने-आप `enable_thinking: false` और `force_nonempty_content: true` भेजता है।
    - धीमे local models या remote LAN/tailnet hosts के लिए, `models.providers.<id>.timeoutSeconds` सेट करें। यह connect, headers, body streaming, और कुल guarded-fetch abort सहित provider model HTTP request handling को बढ़ाता है, पूरे agent runtime timeout को बढ़ाए बिना। अगर `agents.defaults.timeoutSeconds` या run-specific timeout कम है, तो वह ceiling भी बढ़ाएं; provider timeouts पूरे run को extend नहीं कर सकते।
    - Model provider HTTP calls configured provider `baseUrl` hostname के लिए ही `198.18.0.0/15` और `fc00::/7` में Surge, Clash, और sing-box fake-IP DNS answers की अनुमति देते हैं। Custom/local provider endpoints guarded model requests के लिए ठीक उसी configured `scheme://host:port` origin पर भी भरोसा करते हैं, जिसमें loopback, LAN, और tailnet hosts शामिल हैं। यह कोई नया config option नहीं है; आपका configured `baseUrl` केवल उस origin के लिए request policy को extend करता है। Fake-IP hostname allowance और exact-origin trust स्वतंत्र mechanisms हैं। अन्य private, loopback, link-local, metadata destinations, और अलग ports के लिए अब भी explicit `models.providers.<id>.request.allowPrivateNetwork: true` opt-in चाहिए। exact-origin trust से opt out करने के लिए `models.providers.<id>.request.allowPrivateNetwork: false` सेट करें।
    - अगर `baseUrl` खाली/छोड़ा गया है, तो OpenClaw डिफ़ॉल्ट OpenAI behavior रखता है (जो `api.openai.com` पर resolve होता है)।
    - सुरक्षा के लिए, explicit `compat.supportsDeveloperRole: true` भी non-native `openai-completions` endpoints पर override हो जाता है।
    - non-direct endpoints (canonical `anthropic` के अलावा कोई भी provider, या ऐसा custom `models.providers.anthropic.baseUrl` जिसका host public `api.anthropic.com` endpoint नहीं है) पर `api: "anthropic-messages"` के लिए, OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14`, और OAuth markers जैसे implicit Anthropic beta headers दबा देता है, ताकि custom Anthropic-संगत proxies unsupported beta flags को reject न करें। अगर आपके proxy को specific beta features चाहिए, तो `models.providers.<id>.headers["anthropic-beta"]` स्पष्ट रूप से सेट करें।

  </Accordion>
</AccordionGroup>

## CLI उदाहरण

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

यह भी देखें: पूरे कॉन्फ़िगरेशन उदाहरणों के लिए [Configuration](/hi/gateway/configuration)।

## संबंधित

- [Configuration reference](/hi/gateway/config-agents#agent-defaults) - मॉडल config keys
- [Model failover](/hi/concepts/model-failover) - fallback chains और retry behavior
- [Models](/hi/concepts/models) - मॉडल configuration और aliases
- [Providers](/hi/providers) - प्रति-provider setup guides
