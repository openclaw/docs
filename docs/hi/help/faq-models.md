---
read_when:
    - मॉडल चुनना या बदलना, उपनाम कॉन्फ़िगर करना
    - मॉडल फ़ेलओवर की डीबगिंग / "सभी मॉडल विफल रहे"
    - प्रमाणीकरण प्रोफ़ाइलों को समझना और उन्हें प्रबंधित करना
sidebarTitle: Models FAQ
summary: 'FAQ: मॉडल डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग, फ़ेलओवर, और प्रमाणीकरण प्रोफ़ाइल'
title: 'FAQ: मॉडल और प्रमाणीकरण'
x-i18n:
    generated_at: "2026-06-28T23:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  मॉडल और auth-profile Q&A। सेटअप, सेशन, Gateway, चैनल और
  समस्या-निवारण के लिए, मुख्य [FAQ](/hi/help/faq) देखें।

  ## मॉडल: डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग

  <AccordionGroup>
  <Accordion title='“डिफ़ॉल्ट मॉडल” क्या है?'>
    OpenClaw का डिफ़ॉल्ट मॉडल वह है जिसे आप इस रूप में सेट करते हैं:

    ```
    agents.defaults.model.primary
    ```

    मॉडल `provider/model` के रूप में संदर्भित होते हैं (उदाहरण: `openai/gpt-5.5` या `anthropic/claude-sonnet-4-6`)। अगर आप provider छोड़ देते हैं, तो OpenClaw पहले किसी उपनाम को आज़माता है, फिर उस सटीक model id के लिए एक अद्वितीय configured-provider मिलान, और उसके बाद ही एक deprecated compatibility path के रूप में कॉन्फ़िगर किए गए डिफ़ॉल्ट provider पर लौटता है। अगर वह provider अब कॉन्फ़िगर किया गया डिफ़ॉल्ट मॉडल उजागर नहीं करता, तो OpenClaw stale removed-provider default दिखाने के बजाय पहले कॉन्फ़िगर किए गए provider/model पर लौटता है। फिर भी आपको `provider/model` **स्पष्ट रूप से** सेट करना चाहिए।

  </Accordion>

  <Accordion title="आप कौन-सा मॉडल सुझाते हैं?">
    **अनुशंसित डिफ़ॉल्ट:** अपने provider stack में उपलब्ध सबसे मज़बूत latest-generation मॉडल का उपयोग करें।
    **टूल-सक्षम या अविश्वसनीय-इनपुट agents के लिए:** लागत से अधिक मॉडल की क्षमता को प्राथमिकता दें।
    **नियमित/कम-जोखिम चैट के लिए:** सस्ते fallback models का उपयोग करें और agent भूमिका के आधार पर route करें।

    MiniMax के अपने docs हैं: [MiniMax](/hi/providers/minimax) और
    [स्थानीय मॉडल](/hi/gateway/local-models)।

    सामान्य नियम: उच्च-जोखिम काम के लिए **सबसे अच्छा मॉडल जिसका खर्च आप वहन कर सकते हैं** उपयोग करें, और नियमित चैट या सारांशों के लिए सस्ता
    मॉडल। आप प्रति agent मॉडल route कर सकते हैं और लंबे कार्यों को parallelize करने के लिए sub-agents का उपयोग कर सकते हैं (हर sub-agent tokens खपत करता है)। [मॉडल](/hi/concepts/models) और
    [Sub-agents](/hi/tools/subagents) देखें।

    कड़ी चेतावनी: कमजोर/अत्यधिक quantized मॉडल prompt
    injection और असुरक्षित व्यवहार के प्रति अधिक संवेदनशील होते हैं। [सुरक्षा](/hi/gateway/security) देखें।

    अधिक संदर्भ: [मॉडल](/hi/concepts/models)।

  </Accordion>

  <Accordion title="मैं अपनी config मिटाए बिना मॉडल कैसे बदलूं?">
    **model commands** का उपयोग करें या केवल **model** fields संपादित करें। पूरी config replace करने से बचें।

    सुरक्षित विकल्प:

    - चैट में `/model` (त्वरित, प्रति-session)
    - `openclaw models set ...` (केवल model config अपडेट करता है)
    - `openclaw configure --section model` (interactive)
    - `~/.openclaw/openclaw.json` में `agents.defaults.model` संपादित करें

    जब तक आप पूरी config replace करना नहीं चाहते, partial object के साथ `config.apply` से बचें।
    RPC edits के लिए, पहले `config.schema.lookup` से inspect करें और `config.patch` को प्राथमिकता दें। lookup payload आपको normalized path, shallow schema docs/constraints, और immediate child summaries देता है।
    partial updates के लिए।
    अगर आपने config overwrite कर दी है, तो backup से restore करें या repair के लिए `openclaw doctor` फिर से चलाएं।

    Docs: [मॉडल](/hi/concepts/models), [Configure](/hi/cli/configure), [Config](/hi/cli/config), [Doctor](/hi/gateway/doctor)।

  </Accordion>

  <Accordion title="क्या मैं self-hosted मॉडल (llama.cpp, vLLM, Ollama) उपयोग कर सकता हूं?">
    हां। स्थानीय मॉडल के लिए Ollama सबसे आसान रास्ता है।

    सबसे तेज़ सेटअप:

    1. `https://ollama.com/download` से Ollama install करें
    2. कोई स्थानीय मॉडल pull करें, जैसे `ollama pull gemma4`
    3. अगर आप cloud models भी चाहते हैं, तो `ollama signin` चलाएं
    4. `openclaw onboard` चलाएं और `Ollama` चुनें
    5. `Local` या `Cloud + Local` चुनें

    नोट्स:

    - `Cloud + Local` आपको cloud models के साथ आपके स्थानीय Ollama models देता है
    - `kimi-k2.5:cloud` जैसे cloud models को local pull की आवश्यकता नहीं होती
    - manual switching के लिए, `openclaw models list` और `openclaw models set ollama/<model>` उपयोग करें

    सुरक्षा नोट: छोटे या अत्यधिक quantized मॉडल prompt
    injection के प्रति अधिक संवेदनशील होते हैं। हम tools उपयोग कर सकने वाले किसी भी bot के लिए **बड़े मॉडल** की कड़ी अनुशंसा करते हैं।
    अगर आप फिर भी छोटे मॉडल चाहते हैं, तो sandboxing और strict tool allowlists सक्षम करें।

    Docs: [Ollama](/hi/providers/ollama), [स्थानीय मॉडल](/hi/gateway/local-models),
    [मॉडल providers](/hi/concepts/model-providers), [सुरक्षा](/hi/gateway/security),
    [Sandboxing](/hi/gateway/sandboxing)।

  </Accordion>

  <Accordion title="OpenClaw, Flawd, और Krill मॉडल के लिए क्या उपयोग करते हैं?">
    - ये deployments अलग हो सकते हैं और समय के साथ बदल सकते हैं; कोई fixed provider recommendation नहीं है।
    - हर gateway पर current runtime setting `openclaw models status` से जांचें।
    - security-sensitive/tool-enabled agents के लिए, उपलब्ध सबसे मज़बूत latest-generation मॉडल उपयोग करें।

  </Accordion>

  <Accordion title="मैं चलते-चलते मॉडल कैसे बदलूं (restart किए बिना)?">
    `/model` command को standalone message के रूप में उपयोग करें:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    ये built-in aliases हैं। Custom aliases `agents.defaults.models` के ज़रिए जोड़े जा सकते हैं।

    आप उपलब्ध मॉडल `/model`, `/model list`, या `/model status` से list कर सकते हैं।

    `/model` (और `/model list`) compact, numbered picker दिखाता है। नंबर से चुनें:

    ```
    /model 3
    ```

    आप provider के लिए कोई specific auth profile भी force कर सकते हैं (प्रति session):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    सुझाव: `/model status` दिखाता है कि कौन-सा agent active है, कौन-सी `auth-profiles.json` file उपयोग हो रही है, और अगला कौन-सा auth profile आज़माया जाएगा।
    उपलब्ध होने पर यह configured provider endpoint (`baseUrl`) और API mode (`api`) भी दिखाता है।

    **@profile से सेट की गई profile को unpin कैसे करूं?**

    `@profile` suffix **बिना** `/model` फिर से चलाएं:

    ```
    /model anthropic/claude-opus-4-6
    ```

    अगर आप default पर लौटना चाहते हैं, तो उसे `/model` से चुनें (या `/model <default provider/model>` भेजें)।
    कौन-सा auth profile active है, इसकी पुष्टि के लिए `/model status` उपयोग करें।

  </Accordion>

  <Accordion title="अगर दो providers वही model id expose करते हैं, तो /model किसका उपयोग करता है?">
    `/model provider/model` session के लिए वही exact provider route चुनता है।

    उदाहरण के लिए, `qianfan/deepseek-v4-flash` और `deepseek/deepseek-v4-flash` अलग model refs हैं, भले ही दोनों में `deepseek-v4-flash` शामिल है। OpenClaw को केवल bare model id match होने के कारण एक provider से दूसरे पर silently switch नहीं करना चाहिए।

    user-selected `/model` ref fallback policy के लिए भी strict होता है। अगर वह selected provider/model unavailable है, तो reply `agents.defaults.model.fallbacks` से answer करने के बजाय visibly fail होता है। Configured fallback chains अभी भी configured defaults, cron job primaries, और auto-selected fallback state पर लागू होती हैं।

    अगर किसी non-session override से शुरू हुआ run fallback उपयोग करने की अनुमति रखता है, तो OpenClaw पहले requested provider/model आज़माता है, फिर configured fallbacks, और उसके बाद ही configured primary। इससे duplicate bare model ids सीधे default provider पर वापस jump नहीं करते।

    [मॉडल](/hi/concepts/models) और [मॉडल failover](/hi/concepts/model-failover) देखें।

  </Accordion>

  <Accordion title="क्या मैं daily tasks के लिए GPT 5.5 और coding के लिए Codex 5.5 उपयोग कर सकता हूं?">
    हां। model choice और runtime choice को अलग-अलग मानें:

    - **Native Codex coding agent:** `agents.defaults.model.primary` को `openai/gpt-5.5` पर सेट करें। जब आप ChatGPT/Codex subscription auth चाहते हैं, तो `openclaw models auth login --provider openai` से sign in करें।
    - **agent loop के बाहर Direct OpenAI API tasks:** images, embeddings, speech, realtime, और अन्य non-agent OpenAI API surfaces के लिए `OPENAI_API_KEY` configure करें।
    - **OpenAI agent API-key auth:** ordered `openai` API-key profile के साथ `/model openai/gpt-5.5` उपयोग करें।
    - **Sub-agents:** coding tasks को अपने `openai/gpt-5.5` model वाले Codex-focused agent पर route करें।

    [मॉडल](/hi/concepts/models) और [Slash commands](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title="मैं GPT 5.5 के लिए fast mode कैसे configure करूं?">
    session toggle या config default में से किसी एक का उपयोग करें:

    - **प्रति session:** जब session `openai/gpt-5.5` उपयोग कर रहा हो, तब `/fast on` भेजें।
    - **प्रति model default:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` को `true` पर सेट करें।
    - **Automatic cutoff:** नए model calls को auto cutoff तक fast शुरू करने के लिए `/fast auto` या `params.fastMode: "auto"` उपयोग करें, फिर बाद की retry, fallback, tool-result, या continuation calls को fast mode के बिना शुरू करें। cutoff default 60 seconds है; इसे बदलने के लिए active model पर `params.fastAutoOnSeconds` सेट करें।

    उदाहरण:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI के लिए, fast mode supported native Responses requests पर `service_tier = "priority"` से map होता है। Session `/fast` overrides config defaults से ऊपर होते हैं। Codex app-server turns केवल turn start पर tier receive कर सकते हैं, इसलिए `auto` पहले से चल रहे app-server turn के अंदर नहीं, बल्कि अगले OpenClaw-started model turn पर लागू होता है।

    [Thinking and fast mode](/hi/tools/thinking) और [OpenAI fast mode](/hi/providers/openai#fast-mode) देखें।

  </Accordion>

  <Accordion title='मुझे "Model ... is not allowed" क्यों दिखता है और फिर कोई reply क्यों नहीं आता?'>
    अगर `agents.defaults.models` सेट है, तो यह `/model` और किसी भी
    session overrides के लिए **allowlist** बन जाता है। उस list में न होने वाला मॉडल चुनने पर यह लौटता है:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    वह error normal reply **के बजाय** लौटता है। Fix: exact model को
    `agents.defaults.models` में जोड़ें, dynamic provider catalogs के लिए `"provider/*": {}` जैसा provider wildcard जोड़ें, allowlist हटाएं, या `/model list` से model चुनें।
    अगर command में `--runtime codex` भी शामिल था, तो पहले allowlist अपडेट करें और फिर वही
    `/model provider/model --runtime codex` command फिर से चलाएं।

  </Accordion>

  <Accordion title='मुझे "Unknown model: minimax/MiniMax-M3" क्यों दिखता है?'>
    इसका मतलब है कि **provider configured नहीं है** (कोई MiniMax provider config या auth
    profile नहीं मिला), इसलिए model resolve नहीं हो सकता।

    Fix checklist:

    1. current OpenClaw release पर upgrade करें (या source `main` से चलाएं), फिर gateway restart करें।
    2. सुनिश्चित करें कि MiniMax configured है (wizard या JSON), या MiniMax auth
       env/auth profiles में मौजूद है ताकि matching provider inject किया जा सके
       (`MINIMAX_API_KEY` for `minimax`, `MINIMAX_OAUTH_TOKEN` या stored MiniMax
       OAuth for `minimax-portal`)।
    3. अपने auth path के लिए exact model id (case-sensitive) उपयोग करें:
       API-key setup के लिए `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, या
       `minimax/MiniMax-M2.7-highspeed`, या OAuth setup के लिए
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, या
       `minimax-portal/MiniMax-M2.7-highspeed`।
    4. चलाएं:

       ```bash
       openclaw models list
       ```

       और list से चुनें (या chat में `/model list`)।

    [MiniMax](/hi/providers/minimax) और [मॉडल](/hi/concepts/models) देखें।

  </Accordion>

  <Accordion title="क्या मैं MiniMax को default और OpenAI को complex tasks के लिए उपयोग कर सकता हूं?">
    हां। **MiniMax को default** के रूप में उपयोग करें और ज़रूरत पड़ने पर **प्रति session** models switch करें।
    Fallbacks **errors** के लिए हैं, "hard tasks" के लिए नहीं, इसलिए `/model` या अलग agent उपयोग करें।

    **विकल्प A: प्रति session switch करें**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    फिर:

    ```
    /model gpt
    ```

    **विकल्प B: अलग agents**

    - Agent A default: MiniMax
    - Agent B default: OpenAI
    - Agent के आधार पर route करें या switch करने के लिए `/agent` उपयोग करें

    दस्तावेज़: [मॉडल](/hi/concepts/models), [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent), [MiniMax](/hi/providers/minimax), [OpenAI](/hi/providers/openai).

  </Accordion>

  <Accordion title="क्या opus / sonnet / gpt बिल्ट-इन शॉर्टकट हैं?">
    हाँ। OpenClaw कुछ डिफ़ॉल्ट शॉर्टहैंड के साथ आता है (केवल तब लागू होते हैं जब मॉडल `agents.defaults.models` में मौजूद हो):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    यदि आप उसी नाम से अपना alias सेट करते हैं, तो आपकी वैल्यू प्राथमिकता लेती है।

  </Accordion>

  <Accordion title="मैं मॉडल शॉर्टकट (aliases) कैसे परिभाषित/ओवरराइड करूँ?">
    Aliases `agents.defaults.models.<modelId>.alias` से आते हैं। उदाहरण:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    फिर `/model sonnet` (या समर्थित होने पर `/<alias>`) उस मॉडल ID पर रिज़ॉल्व होता है।

  </Accordion>

  <Accordion title="मैं OpenRouter या Z.AI जैसे अन्य providers से मॉडल कैसे जोड़ूँ?">
    OpenRouter (प्रति-token भुगतान; कई मॉडल):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM मॉडल):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    यदि आप किसी provider/model का संदर्भ देते हैं लेकिन आवश्यक provider कुंजी मौजूद नहीं है, तो आपको runtime auth त्रुटि मिलेगी (उदाहरण: `No API key found for provider "zai"`).

    **नया एजेंट जोड़ने के बाद provider के लिए कोई API कुंजी नहीं मिली**

    आमतौर पर इसका मतलब है कि **नए एजेंट** का auth store खाली है। Auth प्रति-एजेंट होता है और इसमें संग्रहीत रहता है:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    सुधार विकल्प:

    - `openclaw agents add <id>` चलाएँ और wizard के दौरान auth कॉन्फ़िगर करें।
    - या मुख्य एजेंट के auth store से केवल portable static `api_key` / `token` profiles को नए एजेंट के auth store में कॉपी करें।
    - OAuth profiles के लिए, जब नए एजेंट को अपने खाते की आवश्यकता हो तो नए एजेंट से sign in करें; अन्यथा OpenClaw refresh tokens को clone किए बिना default/main एजेंट तक read through कर सकता है।

    एजेंटों के बीच `agentDir` का पुनः उपयोग **न करें**; इससे auth/session टकराव होते हैं।

  </Accordion>
</AccordionGroup>

## मॉडल failover और "All models failed"

<AccordionGroup>
  <Accordion title="Failover कैसे काम करता है?">
    Failover दो चरणों में होता है:

    1. उसी provider के भीतर **auth profile rotation**।
    2. `agents.defaults.model.fallbacks` में अगले मॉडल पर **मॉडल fallback**।

    विफल profiles पर cooldowns लागू होते हैं (exponential backoff), इसलिए OpenClaw तब भी जवाब देना जारी रख सकता है जब कोई provider rate-limited हो या अस्थायी रूप से विफल हो रहा हो।

    rate-limit bucket में केवल सामान्य `429` responses से अधिक शामिल है। OpenClaw
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, और आवधिक
    उपयोग-window सीमाएँ (`weekly/monthly limit reached`) जैसे संदेशों को भी failover-योग्य
    rate limits मानता है।

    कुछ billing जैसे दिखने वाले responses `402` नहीं होते, और कुछ HTTP `402`
    responses भी उसी transient bucket में रहते हैं। यदि कोई provider `401` या `403` पर
    स्पष्ट billing text लौटाता है, तो OpenClaw उसे अभी भी
    billing lane में रख सकता है, लेकिन provider-specific text matchers उसी
    provider तक scoped रहते हैं जो उनका owner है (उदाहरण के लिए OpenRouter `Key limit exceeded`)। यदि कोई `402`
    संदेश इसके बजाय retryable usage-window या
    organization/workspace spend limit जैसा दिखता है (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), तो OpenClaw इसे
    `rate_limit` मानता है, long billing disable नहीं।

    Context-overflow errors अलग हैं: जैसे signatures
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, या `ollama error: context length
    exceeded` मॉडल
    fallback को आगे बढ़ाने के बजाय compaction/retry path पर रहते हैं।

    Generic server-error text जानबूझकर "unknown/error वाली कोई भी चीज़"
    से संकरा है। OpenClaw provider-scoped transient shapes
    जैसे Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, stop-reason errors जैसे `Unhandled stop reason:
    error`, transient server text वाले JSON `api_error` payloads
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), और provider-busy errors जैसे `ModelNotReadyException` को
    failover-योग्य timeout/overloaded signals मानता है जब provider context
    match करता है।
    Generic internal fallback text जैसे `LLM request failed with an unknown
    error.` conservative रहता है और अपने-आप model fallback trigger नहीं करता।

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    इसका मतलब है कि system ने auth profile ID `anthropic:default` का उपयोग करने की कोशिश की, लेकिन expected auth store में उसके credentials नहीं मिले।

    **सुधार checklist:**

    - **पुष्टि करें कि auth profiles कहाँ रहते हैं** (नए बनाम legacy paths)
      - वर्तमान: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (`openclaw doctor` द्वारा migrated)
    - **पुष्टि करें कि आपका env var Gateway द्वारा loaded है**
      - यदि आपने अपने shell में `ANTHROPIC_API_KEY` सेट किया है लेकिन Gateway को systemd/launchd के माध्यम से चलाते हैं, तो हो सकता है वह इसे inherit न करे। इसे `~/.openclaw/.env` में रखें या `env.shellEnv` enable करें।
    - **सुनिश्चित करें कि आप सही एजेंट को edit कर रहे हैं**
      - Multi-agent setups का मतलब है कि कई `auth-profiles.json` files हो सकती हैं।
    - **मॉडल/auth status की sanity-check करें**
      - configured models और providers authenticated हैं या नहीं, यह देखने के लिए `openclaw models status` का उपयोग करें।

    **"No credentials found for profile anthropic" के लिए सुधार checklist**

    इसका मतलब है कि run एक Anthropic auth profile पर pinned है, लेकिन Gateway
    उसे अपने auth store में नहीं ढूँढ पा रहा है।

    - **Claude CLI का उपयोग करें**
      - gateway host पर `openclaw models auth login --provider anthropic --method cli --set-default` चलाएँ।
    - **यदि आप इसके बजाय API key का उपयोग करना चाहते हैं**
      - **gateway host** पर `~/.openclaw/.env` में `ANTHROPIC_API_KEY` रखें।
      - किसी भी pinned order को clear करें जो missing profile को force करता है:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **पुष्टि करें कि आप gateway host पर commands चला रहे हैं**
      - remote mode में, auth profiles gateway machine पर रहते हैं, आपके laptop पर नहीं।

  </Accordion>

  <Accordion title="इसने Google Gemini को भी क्यों आज़माया और विफल हुआ?">
    यदि आपके मॉडल config में Google Gemini fallback के रूप में शामिल है (या आपने Gemini shorthand पर switch किया है), तो OpenClaw model fallback के दौरान उसे आज़माएगा। यदि आपने Google credentials कॉन्फ़िगर नहीं किए हैं, तो आपको `No API key found for provider "google"` दिखाई देगा।

    सुधार: या तो Google auth प्रदान करें, या `agents.defaults.model.fallbacks` / aliases में Google models हटाएँ/टालें ताकि fallback वहाँ route न हो।

    **LLM request rejected: thinking signature required (Google Antigravity)**

    कारण: session history में **signatures के बिना thinking blocks** हैं (अक्सर
    aborted/partial stream से)। Google Antigravity को thinking blocks के लिए signatures चाहिए।

    सुधार: OpenClaw अब Google Antigravity Claude के लिए unsigned thinking blocks हटा देता है। यदि यह फिर भी दिखाई देता है, तो **नया session** शुरू करें या उस एजेंट के लिए `/thinking off` सेट करें।

  </Accordion>
</AccordionGroup>

## Auth profiles: वे क्या हैं और उन्हें कैसे manage करें

संबंधित: [/concepts/oauth](/hi/concepts/oauth) (OAuth flows, token storage, multi-account patterns)

<AccordionGroup>
  <Accordion title="Auth profile क्या है?">
    auth profile एक named credential record (OAuth या API key) है जो provider से जुड़ा होता है। Profiles यहाँ रहते हैं:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    secrets dump किए बिना saved profiles inspect करने के लिए, `openclaw models auth list` चलाएँ (वैकल्पिक रूप से `--provider <id>` या `--json`)। विवरण के लिए [Models CLI](/hi/cli/models#auth-profiles) देखें।

  </Accordion>

  <Accordion title="सामान्य profile IDs क्या होते हैं?">
    OpenClaw provider-prefixed IDs का उपयोग करता है, जैसे:

    - `anthropic:default` (जब कोई email identity मौजूद न हो तो common)
    - OAuth identities के लिए `anthropic:<email>`
    - आपके चुने हुए custom IDs (जैसे `anthropic:work`)

  </Accordion>

  <Accordion title="क्या मैं नियंत्रित कर सकता हूँ कि कौन-सा auth profile पहले आज़माया जाए?">
    हाँ। Config profiles के लिए optional metadata और प्रति-provider ordering (`auth.order.<provider>`) support करता है। यह secrets store **नहीं** करता; यह IDs को provider/mode पर map करता है और rotation order set करता है।

    यदि कोई profile छोटे **cooldown** (rate limits/timeouts/auth failures) या लंबे **disabled** state (billing/insufficient credits) में है, तो OpenClaw उसे अस्थायी रूप से skip कर सकता है। इसे inspect करने के लिए, `openclaw models status --json` चलाएँ और `auth.unusableProfiles` देखें। Tuning: `auth.cooldowns.billingBackoffHours*`।

    Rate-limit cooldowns model-scoped हो सकते हैं। एक profile जो
    एक मॉडल के लिए cooling down है, उसी provider पर sibling model के लिए अभी भी usable हो सकता है,
    जबकि billing/disabled windows पूरे profile को block करते रहते हैं।

    आप CLI के माध्यम से **per-agent** order override भी सेट कर सकते हैं (उस एजेंट के `auth-state.json` में stored):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    किसी specific एजेंट को target करने के लिए:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    यह verify करने के लिए कि वास्तव में क्या आज़माया जाएगा, उपयोग करें:

    ```bash
    openclaw models status --probe
    ```

    यदि stored profile explicit order से omitted है, तो probe उसे silently try करने के बजाय उस profile के लिए
    `excluded_by_auth_order` report करता है।

  </Accordion>

  <Accordion title="OAuth बनाम API key - अंतर क्या है?">
    OpenClaw दोनों support करता है:

    - **OAuth / CLI login** अक्सर subscription access का लाभ उठाता है जहाँ
      provider उसे support करता है। Anthropic के लिए, OpenClaw का Claude CLI backend
      Claude Code `claude -p` का उपयोग करता है; Anthropic फिलहाल इसे Agent
      SDK/programmatic usage मानता है। Anthropic ने 15 जून, 2026 के separate Agent
      SDK credit change को pause कर दिया है, इसलिए अभी यह subscription usage
      limits से ही draw करता है। वर्तमान pause notice के लिए Anthropic का [Agent SDK plan
      article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      देखें।
    - **API keys** प्रति-token billing का उपयोग करती हैं।

    wizard Anthropic Claude CLI, OpenAI Codex OAuth, और API keys को स्पष्ट रूप से support करता है।

  </Accordion>
</AccordionGroup>

## संबंधित

- [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq) — मुख्य अक्सर पूछे जाने वाले प्रश्न
- [अक्सर पूछे जाने वाले प्रश्न — त्वरित शुरुआत और पहली बार चलाने का सेटअप](/hi/help/faq-first-run)
- [मॉडल चयन](/hi/concepts/model-providers)
- [मॉडल विफलता पर स्विचओवर](/hi/concepts/model-failover)
