---
read_when:
    - मॉडल चुनना या बदलना, उपनाम कॉन्फ़िगर करना
    - मॉडल फ़ेलओवर / "सभी मॉडल विफल रहे" की डीबगिंग
    - प्रमाणीकरण प्रोफ़ाइलों को समझना और उन्हें प्रबंधित करना
sidebarTitle: Models FAQ
summary: 'अक्सर पूछे जाने वाले प्रश्न: मॉडल डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग, फ़ेलओवर और प्रमाणीकरण प्रोफ़ाइल'
title: 'FAQ: मॉडल और प्रमाणीकरण'
x-i18n:
    generated_at: "2026-07-20T07:13:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73272916f3db17d101c777639c5a5153bfbcfa887929a5726f3c94c3cb29aaf9
    source_path: help/faq-models.md
    workflow: 16
---

मॉडल और प्रमाणीकरण-प्रोफ़ाइल संबंधी प्रश्नोत्तर। सेटअप, सत्रों, Gateway, चैनलों और
समस्या निवारण के लिए मुख्य [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq) देखें।

## मॉडल: डिफ़ॉल्ट, चयन, उपनाम, स्विच करना

<AccordionGroup>
  <Accordion title='"डिफ़ॉल्ट मॉडल" क्या है?'>
    इसे इससे सेट करें:

    ```text
    agents.defaults.model.primary
    ```

    मॉडल `provider/model` संदर्भ होते हैं (उदाहरण: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`)। हमेशा `provider/model` स्पष्ट रूप से सेट करें। यदि
    आप प्रदाता छोड़ देते हैं, तो OpenClaw पहले उपनाम मिलान, फिर उस मॉडल आईडी के
    लिए एकमात्र कॉन्फ़िगर किए गए प्रदाता का मिलान करने का प्रयास करता है और फिर
    कॉन्फ़िगर किए गए डिफ़ॉल्ट प्रदाता पर वापस जाता है (बहिष्कृत संगतता पथ)। यदि
    उस प्रदाता के पास अब कॉन्फ़िगर किया गया डिफ़ॉल्ट मॉडल नहीं है, तो OpenClaw
    पुराने डिफ़ॉल्ट के बजाय पहले कॉन्फ़िगर किए गए प्रदाता/मॉडल पर वापस जाता है।

  </Accordion>

  <Accordion title="आप किस मॉडल की अनुशंसा करते हैं?">
    आपके प्रदाता स्टैक द्वारा उपलब्ध कराया गया नवीनतम पीढ़ी का सबसे शक्तिशाली मॉडल
    उपयोग करें, विशेष रूप से टूल-सक्षम या अविश्वसनीय इनपुट वाले एजेंटों के लिए —
    कमज़ोर या अत्यधिक क्वांटाइज़ किए गए मॉडल प्रॉम्प्ट इंजेक्शन और असुरक्षित
    व्यवहार के प्रति अधिक संवेदनशील होते हैं ([सुरक्षा](/hi/gateway/security) देखें)।
    एजेंट की भूमिका के अनुसार नियमित/कम-जोखिम वाली चैट को सस्ते मॉडलों पर रूट करें।

    प्रत्येक एजेंट के लिए मॉडल रूट करें और लंबे कार्यों को समानांतर करने हेतु उप-एजेंटों
    का उपयोग करें (प्रत्येक उप-एजेंट अपने टोकन उपयोग करता है)। [मॉडल](/hi/concepts/models),
    [उप-एजेंट](/hi/tools/subagents), [MiniMax](/hi/providers/minimax) और
    [स्थानीय मॉडल](/hi/gateway/local-models) देखें।

  </Accordion>

  <Accordion title="मैं अपना कॉन्फ़िग मिटाए बिना मॉडल कैसे बदलूँ?">
    केवल मॉडल फ़ील्ड बदलें — पूरे कॉन्फ़िग को प्रतिस्थापित करने से बचें।

    - `/model` चैट में (प्रति सत्र, [स्लैश कमांड](/hi/tools/slash-commands) देखें)
    - `openclaw models set ...` (केवल मॉडल कॉन्फ़िग अपडेट करता है)
    - `openclaw configure --section model` (इंटरैक्टिव)
    - `~/.openclaw/openclaw.json` में सीधे `agents.defaults.model` संपादित करें

    RPC संपादनों के लिए, पहले `config.schema.lookup` से निरीक्षण करें (सामान्यीकृत
    पथ, संक्षिप्त स्कीमा दस्तावेज़, चाइल्ड सारांश), फिर आंशिक ऑब्जेक्ट के साथ
    `config.apply` के बजाय `config.patch` को प्राथमिकता दें। यदि आपने
    कॉन्फ़िग अधिलेखित कर दिया है, तो बैकअप से पुनर्स्थापित करें या मरम्मत के लिए
    `openclaw doctor` चलाएँ।

    दस्तावेज़: [मॉडल](/hi/concepts/models), [कॉन्फ़िगर करें](/hi/cli/configure),
    [कॉन्फ़िग](/hi/cli/config), [Doctor](/hi/gateway/doctor)।

  </Accordion>

  <Accordion title="क्या मैं स्वयं होस्ट किए गए मॉडल (llama.cpp, vLLM, Ollama) उपयोग कर सकता हूँ?">
    हाँ — Ollama सबसे आसान तरीका है। त्वरित सेटअप:

    1. `https://ollama.com/download` से Ollama इंस्टॉल करें
    2. कोई स्थानीय मॉडल पुल करें, जैसे `ollama pull gemma4`
    3. क्लाउड मॉडलों के लिए भी `ollama signin` चलाएँ
    4. `openclaw onboard` चलाएँ, `Ollama` चुनें, फिर `Local` या `Cloud + Local` चुनें

    `Cloud + Local` आपको क्लाउड मॉडल और आपके स्थानीय Ollama मॉडल देता है;
    `kimi-k2.5:cloud` जैसे क्लाउड मॉडलों को स्थानीय रूप से पुल करने की आवश्यकता
    नहीं होती। मैन्युअल रूप से बदलने के लिए: `openclaw models list`, फिर
    `openclaw models set ollama/<model>`।

    छोटे/अत्यधिक क्वांटाइज़ किए गए मॉडल प्रॉम्प्ट इंजेक्शन के प्रति अधिक संवेदनशील
    होते हैं। टूल ऐक्सेस वाले किसी भी बॉट के लिए बड़े मॉडल उपयोग करें; यदि फिर भी
    छोटे मॉडल उपयोग करते हैं, तो सैंडबॉक्सिंग और सख़्त टूल अनुमति-सूचियाँ सक्षम करें।

    दस्तावेज़: [Ollama](/hi/providers/ollama), [स्थानीय मॉडल](/hi/gateway/local-models),
    [मॉडल प्रदाता](/hi/concepts/model-providers), [सुरक्षा](/hi/gateway/security),
    [सैंडबॉक्सिंग](/hi/gateway/sandboxing)।

  </Accordion>

  <Accordion title="मैं बिना पुनः आरंभ किए तुरंत मॉडल कैसे बदलूँ?">
    `/model <name>` को एक स्वतंत्र संदेश के रूप में भेजें। क्रमांकित चयनकर्ता
    (`/model`, `/model
    list`, `/model 3`), सत्र ओवरराइड
    हटाने के लिए `/model default` और एंडपॉइंट/API-मोड विवरण के लिए
    `/model status` सहित पूरी कमांड सूची के लिए
    [स्लैश कमांड](/hi/tools/slash-commands) देखें।

    `@profile` के साथ प्रत्येक सत्र के लिए कोई विशिष्ट प्रमाणीकरण प्रोफ़ाइल
    बाध्य करें:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    `@profile` के साथ सेट की गई प्रोफ़ाइल को अनपिन करने के लिए,
    प्रत्यय के बिना `/model` फिर से चलाएँ (जैसे
    `/model anthropic/claude-opus-4-6`), या `/model` से डिफ़ॉल्ट चुनें। सक्रिय
    प्रमाणीकरण प्रोफ़ाइल की पुष्टि करने के लिए `/model status` उपयोग करें।

  </Accordion>

  <Accordion title="यदि दो प्रदाता एक ही मॉडल आईडी उपलब्ध कराते हैं, तो /model किसका उपयोग करता है?">
    `/model provider/model` उसी सटीक प्रदाता रूट को चुनता है। उदाहरण के लिए,
    मॉडल आईडी समान होने के बावजूद `qianfan/deepseek-v4-flash` और `deepseek/deepseek-v4-flash`
    अलग-अलग संदर्भ हैं — केवल आईडी मिलने पर OpenClaw प्रदाताओं को चुपचाप नहीं बदलता।

    उपयोगकर्ता द्वारा चुना गया `/model` संदर्भ फ़ॉलबैक के लिए सख़्त
    होता है: यदि वह प्रदाता/मॉडल अनुपलब्ध हो जाता है, तो उत्तर
    `agents.defaults.model.fallbacks` पर फ़ॉलबैक होने के बजाय स्पष्ट रूप से विफल होता है।
    कॉन्फ़िगर की गई फ़ॉलबैक शृंखलाएँ अब भी कॉन्फ़िगर किए गए डिफ़ॉल्ट, Cron जॉब
    प्राइमरी और स्वतः चयनित फ़ॉलबैक स्थिति पर लागू होती हैं। जब सत्र ओवरराइड
    रहित रन को फ़ॉलबैक उपयोग करने की अनुमति होती है, तो OpenClaw पहले अनुरोधित
    प्रदाता/मॉडल, फिर कॉन्फ़िगर किए गए फ़ॉलबैक और फिर कॉन्फ़िगर किए गए प्राइमरी
    को आज़माता है — इसलिए समान बिना प्रदाता वाले मॉडल आईडी कभी सीधे डिफ़ॉल्ट
    प्रदाता पर वापस नहीं जाते।

    [मॉडल](/hi/concepts/models) और [मॉडल फ़ेलओवर](/hi/concepts/model-failover) देखें।

  </Accordion>

  <Accordion title="क्या मैं दैनिक कार्यों के लिए GPT 5.5 और कोडिंग के लिए Codex 5.5 उपयोग कर सकता हूँ?">
    हाँ — मॉडल का चयन और रनटाइम का चयन अलग-अलग हैं:

    - **नेटिव Codex कोडिंग एजेंट:** `agents.defaults.model.primary` को
      `openai/gpt-5.5` पर सेट करें। ChatGPT/Codex सदस्यता प्रमाणीकरण के लिए `openclaw models auth login --provider
      openai` से साइन इन करें।
    - **एजेंट लूप के बाहर प्रत्यक्ष OpenAI API कार्य:** इमेज, एम्बेडिंग,
      वाक्, रियलटाइम और अन्य गैर-एजेंट OpenAI API सतहों के लिए
      `OPENAI_API_KEY` कॉन्फ़िगर करें।
    - **OpenAI एजेंट API-कुंजी प्रमाणीकरण:** क्रमबद्ध
      `openai` API-कुंजी प्रोफ़ाइल के साथ `/model openai/gpt-5.5`।
    - **उप-एजेंट:** कोडिंग कार्यों को अपने स्वयं के
      `openai/gpt-5.5` मॉडल वाले Codex-केंद्रित एजेंट पर रूट करें।

    [मॉडल](/hi/concepts/models) और [स्लैश कमांड](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title="मैं GPT 5.5 के लिए फ़ास्ट मोड कैसे कॉन्फ़िगर करूँ?">
    - **प्रति सत्र:** `openai/gpt-5.5` उपयोग करते समय `/fast on` भेजें।
    - **प्रति मॉडल डिफ़ॉल्ट:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` को
      `true` पर सेट करें।
    - **स्वचालित कटऑफ़:** `/fast auto` या `params.fastMode: "auto"` नए
      मॉडल कॉल को कटऑफ़ तक फ़ास्ट चलाता है, फिर बाद की पुनः प्रयास, फ़ॉलबैक,
      टूल-परिणाम या निरंतरता कॉल को फ़ास्ट मोड के बिना चलाता है। कटऑफ़ डिफ़ॉल्ट
      रूप से 60 सेकंड है; मॉडल पर `params.fastAutoOnSeconds` से इसे ओवरराइड करें।

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

    फ़ास्ट मोड नेटिव OpenAI Responses अनुरोधों पर `service_tier = "priority"` से मैप
    होता है; मौजूदा `service_tier` मान संरक्षित रहते हैं और फ़ास्ट मोड
    `reasoning` या `text.verbosity` को पुनर्लेखित नहीं करता। सत्र
    `/fast` ओवरराइड कॉन्फ़िग डिफ़ॉल्ट से अधिक प्राथमिक होते हैं।

    [चिंतन और फ़ास्ट मोड](/hi/tools/thinking) और [OpenAI](/hi/providers/openai)
    प्रदाता पृष्ठ पर उन्नत कॉन्फ़िगरेशन के अंतर्गत फ़ास्ट मोड अनुभाग देखें।

  </Accordion>

  <Accordion title='मुझे "Model ... is not allowed" क्यों दिखाई देता है और फिर कोई उत्तर क्यों नहीं मिलता?'>
    यदि `agents.defaults.modelPolicy.allow` रिक्त नहीं है, तो यह `/model`, सत्र
    ओवरराइड और `--model` के लिए **अनुमति-सूची** बन जाती है। उस सूची
    से बाहर का मॉडल चुनने पर सामान्य उत्तर के बजाय यह लौटता है:

    ```text
    Model override "provider/model" is not allowed by agents.defaults.modelPolicy.allow.
    ```

    समाधान: नामित `modelPolicy.allow` सूची में सटीक मॉडल या
    `"provider/*"` जैसा प्रदाता वाइल्डकार्ड जोड़ें, उस सूची को हटाएँ/रिक्त
    करें, या `/model list` से कोई मॉडल चुनें। यदि कमांड में
    `--runtime codex` भी शामिल था, तो पहले अनुमति-सूची अपडेट करें और फिर वही
    `/model provider/model --runtime codex` कमांड दोबारा चलाएँ।

  </Accordion>

  <Accordion title='मुझे "Unknown model: minimax/MiniMax-M3" क्यों दिखाई देता है?'>
    यदि आप OpenClaw की पुरानी रिलीज़ पर हैं, तो पहले अपग्रेड करें (या स्रोत से
    `main` चलाएँ) और Gateway पुनः आरंभ करें — हो सकता है
    `MiniMax-M3` अभी आपकी इंस्टॉल की गई रिलीज़ के कैटलॉग में न हो। अन्यथा
    MiniMax प्रदाता कॉन्फ़िगर नहीं है (कोई प्रदाता प्रविष्टि या प्रमाणीकरण प्रोफ़ाइल
    नहीं मिली), इसलिए मॉडल का समाधान नहीं हो सकता। पूर्ण समाधान चेकलिस्ट,
    प्रदाता/मॉडल आईडी तालिका और कॉन्फ़िग-ब्लॉक उदाहरण के लिए
    [MiniMax](/hi/providers/minimax) प्रदाता पृष्ठ पर समस्या निवारण अनुभाग देखें।

  </Accordion>

  <Accordion title="क्या मैं MiniMax को डिफ़ॉल्ट और जटिल कार्यों के लिए OpenAI उपयोग कर सकता हूँ?">
    हाँ। MiniMax को डिफ़ॉल्ट के रूप में उपयोग करें और प्रत्येक सत्र में मॉडल
    बदलें — फ़ॉलबैक त्रुटियों के लिए होते हैं, "कठिन कार्यों" के लिए नहीं, इसलिए
    `/model` या अलग एजेंट उपयोग करें।

    **विकल्प A: प्रत्येक सत्र में बदलें**

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

    फिर `/model gpt`।

    **विकल्प B: अलग एजेंट** — एजेंट A का डिफ़ॉल्ट MiniMax और एजेंट B का
    डिफ़ॉल्ट OpenAI है; एजेंट के अनुसार रूट करें या बदलने के लिए
    `/agent` उपयोग करें।

    दस्तावेज़: [मॉडल](/hi/concepts/models), [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent),
    [MiniMax](/hi/providers/minimax), [OpenAI](/hi/providers/openai)।

  </Accordion>

  <Accordion title="क्या opus / sonnet / gpt अंतर्निहित शॉर्टकट हैं?">
    हाँ — अंतर्निहित संक्षिप्त रूप, जो केवल तब लागू होते हैं जब लक्ष्य मॉडल
    `agents.defaults.models` में मौजूद हो:

    | उपनाम | इसका समाधान |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    समान नाम वाला आपका अपना उपनाम अंतर्निहित उपनाम को ओवरराइड करता है।

  </Accordion>

  <Accordion title="मैं मॉडल शॉर्टकट (उपनाम) कैसे परिभाषित/ओवरराइड करूँ?">
    उपनाम `agents.defaults.models.<modelId>.alias` में होते हैं:

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

    फिर `/model sonnet` (या समर्थित होने पर `/<alias>`) उस मॉडल
    आईडी में हल होता है।

  </Accordion>

  <Accordion title="मैं OpenRouter या Z.AI जैसे अन्य प्रदाताओं से मॉडल कैसे जोड़ूँ?">
    OpenRouter (प्रति-टोकन भुगतान; कई मॉडल):

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    संदर्भित प्रदाता/मॉडल के लिए प्रदाता कुंजी न होने पर रनटाइम प्रमाणीकरण
    त्रुटि उत्पन्न होती है (जैसे `No API key found for provider "zai"`)।

    **नया एजेंट जोड़ने के बाद प्रदाता के लिए कोई API कुंजी नहीं मिली**

    नए एजेंट का प्रमाणीकरण स्टोर रिक्त होता है — प्रमाणीकरण प्रत्येक एजेंट के
    लिए अलग होता है और यहाँ संग्रहीत होता है:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    समाधान: `openclaw agents add <id>` चलाएँ और विज़ार्ड में प्रमाणीकरण कॉन्फ़िगर करें, या
    मुख्य एजेंट के स्टोर से केवल पोर्टेबल स्थिर `api_key`/`token` प्रोफ़ाइल
    कॉपी करें। OAuth के लिए, नए एजेंट से साइन इन करें जब उसे अपने
    स्वयं के खाते की आवश्यकता हो। पूर्ण `agentDir` पुनः उपयोग और क्रेडेंशियल-साझाकरण
    नियमों के लिए [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent) देखें — एजेंटों के बीच
    `agentDir` का कभी पुनः उपयोग न करें।

  </Accordion>
</AccordionGroup>

## मॉडल फ़ेलओवर और "सभी मॉडल विफल रहे"

<AccordionGroup>
  <Accordion title="फ़ेलओवर कैसे काम करता है?">
    दो चरण:

    1. एक ही प्रदाता के भीतर **प्रमाणीकरण प्रोफ़ाइल रोटेशन**।
    2. `agents.defaults.model.fallbacks` में अगले मॉडल पर **मॉडल फ़ॉलबैक**।

    विफल हो रही प्रोफ़ाइल पर कूलडाउन लागू होते हैं (एक्सपोनेंशियल बैकऑफ़), इसलिए
    प्रदाता की दर सीमित होने या अस्थायी रूप से विफल होने पर भी OpenClaw
    उत्तर देना जारी रखता है।

    दर-सीमा बकेट में केवल `429` से अधिक शामिल है: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted`, और आवधिक
    उपयोग-विंडो सीमाएँ (`weekly/monthly limit reached`) सभी
    फ़ेलओवर योग्य दर सीमाओं में गिनी जाती हैं।

    बिलिंग प्रतिक्रियाएँ हमेशा `402` नहीं होतीं, और कुछ `402`s
    बिलिंग लेन के बजाय अस्थायी/दर-सीमा बकेट में रहती हैं। `401`/`403` पर
    स्पष्ट बिलिंग टेक्स्ट अब भी बिलिंग की ओर रूट कर सकता है; प्रदाता-विशिष्ट
    टेक्स्ट मैचर (जैसे OpenRouter `Key limit exceeded`) अपने
    प्रदाता तक ही सीमित रहते हैं। ऐसा `402` जो पुनः प्रयास योग्य उपयोग-विंडो या
    संगठन/वर्कस्पेस व्यय सीमा जैसा हो (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), उसे लंबे बिलिंग निष्क्रियकरण के बजाय
    `rate_limit` माना जाता है।

    कॉन्टेक्स्ट-ओवरफ़्लो त्रुटियाँ फ़ॉलबैक पथ से पूरी तरह बाहर रहती हैं — 
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model`, या `ollama error: context length exceeded` जैसे संकेत
    मॉडल फ़ॉलबैक आगे बढ़ाने के बजाय Compaction/पुनः प्रयास पर जाते हैं।

    सामान्य सर्वर-त्रुटि टेक्स्ट का दायरा "जिसमें भी unknown/error हो"
    उससे अधिक सीमित है। प्रदाता-सीमित अस्थायी स्वरूप जो फ़ेलओवर
    संकेत माने जाते हैं: Anthropic का केवल `An unknown error occurred`, OpenRouter का केवल
    `Provider returned error`, `Unhandled stop reason:
    error` जैसी स्टॉप-रीज़न त्रुटियाँ, अस्थायी सर्वर टेक्स्ट (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`) वाले JSON `api_error` पेलोड,
    और प्रदाता संदर्भ मेल खाने पर `ModelNotReadyException` जैसी
    प्रदाता-व्यस्त त्रुटियाँ। `LLM request failed
    with an unknown error.` जैसा सामान्य आंतरिक फ़ॉलबैक टेक्स्ट
    सावधानीपूर्ण रहता है और अपने आप फ़ॉलबैक ट्रिगर नहीं करता।

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" का क्या अर्थ है?'>
    प्रमाणीकरण प्रोफ़ाइल आईडी `anthropic:default` में अपेक्षित प्रमाणीकरण
    स्टोर में कोई क्रेडेंशियल नहीं है।

    **समाधान जाँच-सूची:**

    - पुष्टि करें कि प्रोफ़ाइल कहाँ रहती हैं — वर्तमान:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; लेगेसी:
      `~/.openclaw/agent/*` (`openclaw doctor` द्वारा माइग्रेट किया गया)।
    - पुष्टि करें कि Gateway आपका एनवायरनमेंट वेरिएबल लोड करता है। केवल
      आपके शेल में सेट `ANTHROPIC_API_KEY` systemd/launchd द्वारा चलाए गए Gateway तक नहीं पहुँचेगा — इसे
      `~/.openclaw/.env` में रखें या `env.shellEnv` सक्षम करें।
    - पुष्टि करें कि आप सही एजेंट संपादित कर रहे हैं — बहु-एजेंट सेटअप में
      कई `auth-profiles.json` फ़ाइलें होती हैं।
    - कॉन्फ़िगर किए गए मॉडल और प्रदाता की प्रमाणीकरण स्थिति देखने के लिए
      `openclaw models status` चलाएँ।

    **"No credentials found for profile anthropic" (ईमेल प्रत्यय के बिना) के लिए:**

    रन ऐसी Anthropic प्रोफ़ाइल पर पिन है जिसे Gateway नहीं खोज सकता।

    - Claude CLI का उपयोग करें: Gateway होस्ट पर `openclaw models auth login --provider anthropic
      --method cli --set-default` चलाएँ।
    - इसके बजाय API कुंजी को प्राथमिकता दें: Gateway होस्ट पर
      `~/.openclaw/.env` में `ANTHROPIC_API_KEY` रखें, फिर अनुपलब्ध प्रोफ़ाइल को बाध्य करने वाला
      कोई भी पिन किया हुआ क्रम साफ़ करें:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - रिमोट मोड: प्रमाणीकरण प्रोफ़ाइल आपके लैपटॉप पर नहीं, Gateway मशीन पर रहती हैं — 
      पुष्टि करें कि आप वहीं कमांड चला रहे हैं।

  </Accordion>

  <Accordion title="इसने Google Gemini को भी क्यों आज़माया और विफल हुआ?">
    यदि आपके मॉडल कॉन्फ़िगरेशन में Google Gemini फ़ॉलबैक के रूप में शामिल है (या आपने
    Gemini शॉर्टहैंड पर स्विच किया है), तो OpenClaw फ़ॉलबैक के दौरान इसे आज़माता है।
    Google क्रेडेंशियल कॉन्फ़िगर न होने पर `No API key found for provider
    "google"` मिलता है। समाधान: Google प्रमाणीकरण जोड़ें, या
    `agents.defaults.model.fallbacks`/उपनामों से Google मॉडल हटाएँ।

    **LLM अनुरोध अस्वीकृत: थिंकिंग सिग्नेचर आवश्यक है (Google Antigravity)**

    कारण: सत्र इतिहास में बिना सिग्नेचर वाले थिंकिंग ब्लॉक हैं (अक्सर
    निरस्त/आंशिक स्ट्रीम के कारण); Google Antigravity को थिंकिंग ब्लॉक पर सिग्नेचर
    आवश्यक हैं। OpenClaw, Google Antigravity Claude के लिए बिना सिग्नेचर वाले थिंकिंग ब्लॉक
    हटा देता है; यदि यह फिर भी दिखाई दे, तो नया सत्र शुरू करें या उस एजेंट के लिए
    `/thinking off` सेट करें।

  </Accordion>
</AccordionGroup>

## प्रमाणीकरण प्रोफ़ाइल: वे क्या हैं और उनका प्रबंधन कैसे करें

संबंधित: [/concepts/oauth](/hi/concepts/oauth) (OAuth प्रवाह, टोकन भंडारण, बहु-खाता पैटर्न)

<AccordionGroup>
  <Accordion title="प्रमाणीकरण प्रोफ़ाइल क्या है?">
    प्रदाता से जुड़ा नामित क्रेडेंशियल रिकॉर्ड (OAuth या API कुंजी), जिसे यहाँ
    संग्रहीत किया जाता है:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    गोपनीय जानकारी उजागर किए बिना सहेजी गई प्रोफ़ाइल जाँचें: `openclaw models auth
    list` (वैकल्पिक रूप से `--provider <id>` या `--json`)। 
    [मॉडल CLI](/hi/cli/models#auth-profiles) देखें।

  </Accordion>

  <Accordion title="सामान्य प्रोफ़ाइल आईडी क्या होती हैं?">
    प्रदाता-उपसर्ग वाली: `anthropic:default` (जब कोई ईमेल पहचान उपलब्ध न हो तो सामान्य),
    OAuth पहचानों के लिए `anthropic:<email>`, या आपके द्वारा चुनी गई कस्टम आईडी
    (जैसे `anthropic:work`)।

  </Accordion>

  <Accordion title="क्या मैं नियंत्रित कर सकता हूँ कि कौन-सी प्रमाणीकरण प्रोफ़ाइल पहले आज़माई जाए?">
    हाँ। `auth.order.<provider>` कॉन्फ़िगरेशन प्रत्येक प्रदाता के लिए रोटेशन क्रम सेट करता है
    (केवल मेटाडेटा — कोई गोपनीय जानकारी संग्रहीत नहीं होती)।

    OpenClaw किसी प्रोफ़ाइल को छोटे **कूलडाउन** (दर सीमाएँ,
    टाइमआउट, प्रमाणीकरण विफलताएँ) या लंबे **निष्क्रिय** अवस्था
    (बिलिंग/अपर्याप्त क्रेडिट) में छोड़ सकता है। `openclaw models status
    --json` से जाँचें और `auth.unusableProfiles` देखें। दर-सीमा कूलडाउन
    मॉडल-सीमित हो सकते हैं — एक मॉडल के लिए कूलडाउन में गई प्रोफ़ाइल उसी प्रदाता के
    सहोदर मॉडल को अब भी सेवा दे सकती है; बिलिंग/निष्क्रिय विंडो पूरी
    प्रोफ़ाइल को अवरुद्ध करती हैं।

    प्रति-एजेंट क्रम ओवरराइड सेट करें (उस एजेंट के `auth-state.json` में संग्रहीत):

    ```bash
    # कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट का उपयोग करता है (--agent छोड़ दें)
    openclaw models auth order get --provider anthropic

    # रोटेशन को एक ही प्रोफ़ाइल तक सीमित करें
    openclaw models auth order set --provider anthropic anthropic:default

    # या स्पष्ट क्रम सेट करें (प्रदाता के भीतर फ़ॉलबैक)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # ओवरराइड साफ़ करें (कॉन्फ़िगरेशन auth.order / राउंड-रॉबिन पर वापस जाएँ)
    openclaw models auth order clear --provider anthropic

    # किसी विशिष्ट एजेंट को लक्षित करें
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    वास्तव में क्या आज़माया जाएगा, इसकी पुष्टि करें: `openclaw models status --probe`। स्पष्ट क्रम से
    छोड़ी गई संग्रहीत प्रोफ़ाइल को चुपचाप आज़माने के बजाय
    `excluded_by_auth_order` रिपोर्ट किया जाता है।

  </Accordion>

  <Accordion title="OAuth और API कुंजी में क्या अंतर है?">
    - जहाँ प्रदाता इसका समर्थन करता है, वहाँ **OAuth / CLI लॉगिन** अक्सर सदस्यता पहुँच का
      उपयोग करता है। Anthropic के लिए, OpenClaw का Claude CLI बैकएंड
      Claude Code `claude -p` का उपयोग करता है, जिसे Anthropic वर्तमान में सदस्यता उपयोग सीमाओं से
      व्यय होने वाला Agent SDK/प्रोग्रामेटिक उपयोग मानता है — वर्तमान बिलिंग-विराम
      स्थिति और स्रोत लिंक के लिए [Anthropic](/hi/providers/anthropic) देखें।
    - **API कुंजियाँ** प्रति-टोकन भुगतान वाली बिलिंग का उपयोग करती हैं।

    विज़ार्ड Anthropic Claude CLI, OpenAI Codex OAuth और API
    कुंजियों का समर्थन करता है।

  </Accordion>
</AccordionGroup>

## संबंधित

- [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq) — मुख्य अक्सर पूछे जाने वाले प्रश्न
- [अक्सर पूछे जाने वाले प्रश्न — त्वरित शुरुआत और प्रथम-रन सेटअप](/hi/help/faq-first-run)
- [मॉडल चयन](/hi/concepts/model-providers)
- [मॉडल फ़ेलओवर](/hi/concepts/model-failover)
