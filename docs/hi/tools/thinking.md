---
read_when:
    - सोच, फ़ास्ट-मोड, या विस्तृत निर्देश पार्सिंग या डिफ़ॉल्ट को समायोजित करना
summary: /think, /fast, /verbose, /trace, और reasoning visibility के लिए डायरेक्टिव सिंटैक्स
title: सोच के स्तर
x-i18n:
    generated_at: "2026-06-29T00:24:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## यह क्या करता है

- किसी भी इनबाउंड बॉडी में इनलाइन निर्देश: `/t <level>`, `/think:<level>`, या `/thinking <level>`।
- स्तर (उपनाम): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (अधिकतम बजट)
  - xhigh → "ultrathink+" (GPT-5.2+ और Codex मॉडल, साथ ही Anthropic Claude Opus 4.7+ effort)
  - adaptive → प्रदाता-प्रबंधित अनुकूली सोच (Anthropic/Bedrock पर Claude 4.6, Anthropic Claude Opus 4.7+, और Google Gemini dynamic thinking के लिए समर्थित)
  - max → प्रदाता का अधिकतम reasoning (Anthropic Claude Opus 4.7+; Ollama इसे अपने सर्वोच्च नेटिव `think` effort पर मैप करता है)
  - `x-high`, `x_high`, `extra-high`, `extra high`, और `extra_high` `xhigh` पर मैप होते हैं।
  - `highest` `high` पर मैप होता है।
- प्रदाता नोट्स:
  - सोच मेनू और पिकर प्रदाता-प्रोफाइल से संचालित होते हैं। प्रदाता Plugin चुने गए मॉडल के लिए सटीक स्तर सेट घोषित करते हैं, जिसमें बाइनरी `on` जैसे लेबल शामिल हैं।
  - `adaptive`, `xhigh`, और `max` केवल उन प्रदाता/मॉडल प्रोफाइल के लिए दिखाए जाते हैं जो उन्हें समर्थित करते हैं। असमर्थित स्तरों के लिए टाइप किए गए निर्देश उस मॉडल के मान्य विकल्पों के साथ अस्वीकार कर दिए जाते हैं।
  - मौजूदा संग्रहीत असमर्थित स्तर प्रदाता प्रोफाइल रैंक के अनुसार रीमैप किए जाते हैं। गैर-अनुकूली मॉडलों पर `adaptive` `medium` पर वापस जाता है, जबकि `xhigh` और `max` चुने गए मॉडल के लिए सबसे बड़े समर्थित गैर-`off` स्तर पर वापस जाते हैं।
  - Anthropic Claude 4.6 मॉडल तब डिफ़ॉल्ट रूप से `adaptive` पर रहते हैं जब कोई स्पष्ट सोच स्तर सेट नहीं होता।
  - Anthropic Claude Opus 4.8 और Opus 4.7 सोच को बंद रखते हैं, जब तक आप स्पष्ट रूप से सोच स्तर सेट न करें। adaptive thinking सक्षम होने के बाद Opus 4.8 का प्रदाता-स्वामित्व वाला effort डिफ़ॉल्ट `high` है।
  - Anthropic Claude Opus 4.7+ `/think xhigh` को adaptive thinking और `output_config.effort: "xhigh"` पर मैप करता है, क्योंकि `/think` एक सोच निर्देश है और `xhigh` Opus effort सेटिंग है।
  - Anthropic Claude Opus 4.7+ `/think max` भी उपलब्ध कराता है; यह उसी प्रदाता-स्वामित्व वाले अधिकतम effort पथ पर मैप होता है।
  - Direct DeepSeek V4 मॉडल `/think xhigh|max` उपलब्ध कराते हैं; दोनों DeepSeek `reasoning_effort: "max"` पर मैप होते हैं, जबकि निचले गैर-off स्तर `high` पर मैप होते हैं।
  - OpenRouter-रूट किए गए DeepSeek V4 मॉडल `/think xhigh` उपलब्ध कराते हैं और OpenRouter-समर्थित `reasoning_effort` मान भेजते हैं। संग्रहीत `max` overrides `xhigh` पर वापस जाते हैं।
  - Ollama के सोच-सक्षम मॉडल `/think low|medium|high|max` उपलब्ध कराते हैं; `max` नेटिव `think: "high"` पर मैप होता है क्योंकि Ollama की नेटिव API `low`, `medium`, और `high` effort स्ट्रिंग स्वीकार करती है।
  - OpenAI GPT मॉडल `/think` को मॉडल-विशिष्ट Responses API effort समर्थन के माध्यम से मैप करते हैं। `/think off` केवल तब `reasoning.effort: "none"` भेजता है जब लक्ष्य मॉडल इसे समर्थित करता हो; अन्यथा OpenClaw असमर्थित मान भेजने के बजाय अक्षम reasoning payload को छोड़ देता है।
  - कस्टम OpenAI-संगत कैटलॉग प्रविष्टियां `models.providers.<provider>.models[].compat.supportedReasoningEfforts` में `"xhigh"` शामिल करके `/think xhigh` में ऑप्ट इन कर सकती हैं। यह वही compat metadata उपयोग करता है जो आउटबाउंड OpenAI reasoning effort payloads को मैप करता है, इसलिए मेनू, सत्र सत्यापन, एजेंट CLI, और `llm-task` ट्रांसपोर्ट व्यवहार से सहमत रहते हैं।
  - पुराने कॉन्फ़िगर किए गए OpenRouter Hunter Alpha refs proxy reasoning injection छोड़ देते हैं क्योंकि वह रिटायर्ड रूट reasoning fields के माध्यम से अंतिम उत्तर टेक्स्ट लौटा सकता था।
  - Google Gemini `/think adaptive` को Gemini के प्रदाता-स्वामित्व वाले dynamic thinking पर मैप करता है। Gemini 3 अनुरोध कोई निश्चित `thinkingLevel` नहीं भेजते, जबकि Gemini 2.5 अनुरोध `thinkingBudget: -1` भेजते हैं; निश्चित स्तर फिर भी उस मॉडल परिवार के लिए सबसे निकट Gemini `thinkingLevel` या बजट पर मैप होते हैं।
  - Anthropic-संगत streaming पथ पर MiniMax M2.x (`minimax/MiniMax-M2*`) डिफ़ॉल्ट रूप से `thinking: { type: "disabled" }` उपयोग करता है, जब तक आप मॉडल params या अनुरोध params में स्पष्ट रूप से thinking सेट न करें। इससे M2.x के गैर-नेटिव Anthropic stream format से लीक हुए `reasoning_content` deltas से बचा जाता है। MiniMax-M3 (और M3.x) इससे मुक्त है: M3 उचित Anthropic thinking blocks उत्सर्जित करता है और thinking अक्षम होने पर खाली content लौटाता है, इसलिए OpenClaw M3 को प्रदाता के omitted/adaptive thinking पथ पर रखता है।
  - Z.AI (`zai/*`) अधिकतर GLM मॉडलों के लिए बाइनरी (`on`/`off`) है। GLM-5.2 अपवाद है: यह `/think off|low|high|max` उपलब्ध कराता है, `low` और `high` को Z.AI `reasoning_effort: "high"` पर मैप करता है, और `max` को `reasoning_effort: "max"` पर मैप करता है।
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) हमेशा सोचता है। इसका प्रोफाइल केवल `on` उपलब्ध कराता है, और OpenClaw Moonshot की आवश्यकता के अनुसार आउटबाउंड `thinking` field छोड़ देता है। अन्य `moonshot/*` मॉडल `/think off` को `thinking: { type: "disabled" }` पर और किसी भी गैर-`off` स्तर को `thinking: { type: "enabled" }` पर मैप करते हैं। जब thinking सक्षम होती है, Moonshot केवल `tool_choice` `auto|none` स्वीकार करता है; OpenClaw असंगत मानों को `auto` में सामान्यीकृत करता है।

## समाधान क्रम

1. संदेश पर इनलाइन निर्देश (केवल उसी संदेश पर लागू होता है)।
2. सत्र override (directive-only संदेश भेजकर सेट किया गया)।
3. प्रति-एजेंट डिफ़ॉल्ट (config में `agents.list[].thinkingDefault`)।
4. वैश्विक डिफ़ॉल्ट (config में `agents.defaults.thinkingDefault`)।
5. Fallback: उपलब्ध होने पर प्रदाता-घोषित डिफ़ॉल्ट; अन्यथा reasoning-सक्षम मॉडल `medium` या उस मॉडल के लिए निकटतम समर्थित गैर-`off` स्तर पर resolve होते हैं, और गैर-reasoning मॉडल `off` रहते हैं।

## सत्र डिफ़ॉल्ट सेट करना

- ऐसा संदेश भेजें जो **केवल** निर्देश हो (whitespace अनुमत), जैसे `/think:medium` या `/t high`।
- यह मौजूदा सत्र के लिए बना रहता है (डिफ़ॉल्ट रूप से प्रति-प्रेषक)। सत्र override साफ़ करने और कॉन्फ़िगर किए गए/प्रदाता डिफ़ॉल्ट को inherit करने के लिए `/think default` उपयोग करें; उपनामों में `inherit`, `clear`, `reset`, और `unpin` शामिल हैं।
- `/think off` एक स्पष्ट off override संग्रहीत करता है। यह सोच को तब तक अक्षम करता है जब तक आप सत्र override बदलें या साफ़ न करें।
- पुष्टि उत्तर भेजा जाता है (`Thinking level set to high.` / `Thinking disabled.`)। यदि स्तर अमान्य है (जैसे `/thinking big`), कमांड संकेत के साथ अस्वीकार कर दी जाती है और सत्र स्थिति अपरिवर्तित रहती है।
- वर्तमान सोच स्तर देखने के लिए बिना argument के `/think` (या `/think:`) भेजें।

## एजेंट द्वारा अनुप्रयोग

- **Embedded OpenClaw**: resolved स्तर in-process OpenClaw एजेंट runtime को पास किया जाता है।
- **Claude CLI backend**: `claude-cli` उपयोग करते समय गैर-off स्तर Claude Code को `--effort` के रूप में पास किए जाते हैं; [CLI backends](/hi/gateway/cli-backends) देखें।

## तेज़ मोड (/fast)

- स्तर: `auto|on|off|default`।
- Directive-only संदेश सत्र fast-mode override को toggle करता है और `Fast mode set to auto.`, `Fast mode enabled.`, या `Fast mode disabled.` उत्तर देता है। सत्र override साफ़ करने और कॉन्फ़िगर किया गया डिफ़ॉल्ट inherit करने के लिए `/fast default` उपयोग करें; उपनामों में `inherit`, `clear`, `reset`, और `unpin` शामिल हैं।
- वर्तमान प्रभावी fast-mode स्थिति देखने के लिए बिना mode के `/fast` (या `/fast status`) भेजें।
- OpenClaw fast mode को इस क्रम में resolve करता है:
  1. Inline/directive-only `/fast auto|on|off` override (`/fast default` इस परत को साफ़ करता है)
  2. सत्र override
  3. प्रति-एजेंट डिफ़ॉल्ट (`agents.list[].fastModeDefault`)
  4. प्रति-मॉडल config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` सत्र/config mode को auto के रूप में रखता है लेकिन प्रत्येक नए मॉडल call को स्वतंत्र रूप से resolve करता है। auto cutoff से पहले शुरू होने वाली calls में fast mode सक्षम होता है; बाद की retry, fallback, tool-result, या continuation calls fast mode अक्षम के साथ शुरू होती हैं। cutoff डिफ़ॉल्ट रूप से 60 सेकंड है; इसे बदलने के लिए सक्रिय मॉडल पर `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` सेट करें।
- `openai/*` के लिए, fast mode समर्थित Responses अनुरोधों पर `service_tier=priority` भेजकर OpenAI priority processing पर मैप होता है।
- Codex-backed `openai/*` / `openai-codex/*` मॉडलों के लिए, fast mode Codex Responses पर वही `service_tier=priority` flag भेजता है। Native Codex app-server turns को tier केवल `turn/start` या thread start/resume पर मिलता है, इसलिए `auto` पहले से चल रहे app-server turn को retier नहीं कर सकता; यह OpenClaw द्वारा शुरू किए गए अगले model turn पर लागू होता है।
- OAuth-authenticated traffic सहित direct public `anthropic/*` अनुरोधों के लिए, जो `api.anthropic.com` को भेजे जाते हैं, fast mode Anthropic service tiers पर मैप होता है: `/fast on` `service_tier=auto` सेट करता है, `/fast off` `service_tier=standard_only` सेट करता है।
- Anthropic-संगत path पर `minimax/*` के लिए, `/fast on` (या `params.fastMode: true`) `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में rewrite करता है।
- जब दोनों सेट हों, स्पष्ट Anthropic `serviceTier` / `service_tier` model params fast-mode default को override करते हैं। OpenClaw फिर भी गैर-Anthropic proxy base URLs के लिए Anthropic service-tier injection छोड़ देता है।
- `/status` fast mode सक्षम होने पर `Fast` दिखाता है और configured mode auto होने पर `Fast:auto` दिखाता है।

## Verbose निर्देश (/verbose या /v)

- स्तर: `on` (minimal) | `full` | `off` (default)।
- Directive-only संदेश session verbose को toggle करता है और `Verbose logging enabled.` / `Verbose logging disabled.` उत्तर देता है; अमान्य स्तर स्थिति बदले बिना संकेत लौटाते हैं।
- `/verbose off` एक स्पष्ट session override संग्रहीत करता है; इसे Sessions UI में `inherit` चुनकर साफ़ करें।
- अधिकृत external channel senders session verbose override को persist कर सकते हैं। Internal gateway/webchat clients को इसे persist करने के लिए `operator.admin` चाहिए।
- Inline directive केवल उसी संदेश को प्रभावित करता है; अन्यथा session/global defaults लागू होते हैं।
- वर्तमान verbose level देखने के लिए बिना argument के `/verbose` (या `/verbose:`) भेजें।
- जब verbose on हो, structured tool results emit करने वाले agents प्रत्येक tool call को अपने metadata-only संदेश के रूप में वापस भेजते हैं, उपलब्ध होने पर `<emoji> <tool-name>: <arg>` prefix के साथ। ये tool summaries प्रत्येक tool शुरू होते ही भेजी जाती हैं (अलग bubbles), streaming deltas के रूप में नहीं।
- Tool failure summaries सामान्य mode में दिखाई देती रहती हैं, लेकिन raw error detail suffixes तब तक छिपे रहते हैं जब तक verbose `full` न हो।
- जब verbose `full` हो, tool outputs completion के बाद भी forward किए जाते हैं (अलग bubble, safe length तक truncated)। यदि आप run in-flight रहते हुए `/verbose on|full|off` toggle करते हैं, तो बाद की tool bubbles नई setting का पालन करती हैं।
- `agents.defaults.toolProgressDetail` `/verbose` tool summaries और progress-draft tool lines का आकार नियंत्रित करता है। `🛠️ Exec: checking JS syntax` जैसे compact human labels के लिए `"explain"` (default) उपयोग करें; debugging के लिए raw command/detail भी appended चाहिए हो तो `"raw"` उपयोग करें। प्रति-एजेंट `agents.list[].toolProgressDetail` default को override करता है।
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin trace निर्देश (/trace)

- स्तर: `on` | `off` (default)।
- Directive-only संदेश session plugin trace output को toggle करता है और `Plugin trace enabled.` / `Plugin trace disabled.` उत्तर देता है।
- Inline directive केवल उसी संदेश को प्रभावित करता है; अन्यथा session/global defaults लागू होते हैं।
- वर्तमान trace level देखने के लिए बिना argument के `/trace` (या `/trace:`) भेजें।
- `/trace`, `/verbose` से संकरा है: यह केवल Plugin-स्वामित्व वाली trace/debug lines उजागर करता है, जैसे Active Memory debug summaries।
- Trace lines `/status` में और सामान्य assistant reply के बाद follow-up diagnostic message के रूप में दिखाई दे सकती हैं।

## Reasoning दृश्यता (/reasoning)

- स्तर: `on|off|stream`।
- Directive-only संदेश replies में thinking blocks दिखाए जाने हैं या नहीं, इसे toggle करता है।
- सक्षम होने पर, reasoning को `Thinking` prefix वाले **अलग संदेश** के रूप में भेजा जाता है।
- `stream`: जब active channel reasoning previews का समर्थन करता है, reply generate होते समय reasoning stream करता है, फिर reasoning के बिना अंतिम उत्तर भेजता है।
- उपनाम: `/reason`।
- वर्तमान reasoning level देखने के लिए बिना argument के `/reasoning` (या `/reasoning:`) भेजें।
- समाधान क्रम: inline directive, फिर session override, फिर प्रति-एजेंट default (`agents.list[].reasoningDefault`), फिर global default (`agents.defaults.reasoningDefault`), फिर fallback (`off`)।

विकृत local-model तर्क टैग को सावधानीपूर्वक संभाला जाता है। बंद `<think>...</think>` ब्लॉक सामान्य उत्तरों में छिपे रहते हैं, और पहले से दिखाई दे चुके पाठ के बाद का अधूरा तर्क भी छिपा रहता है। यदि कोई उत्तर पूरी तरह एक अकेले अधूरे ओपनिंग टैग में लिपटा है और अन्यथा खाली पाठ के रूप में डिलीवर होता, तो OpenClaw विकृत ओपनिंग टैग को हटा देता है और शेष पाठ डिलीवर करता है।

## संबंधित

- उन्नत मोड के दस्तावेज़ [उन्नत मोड](/hi/tools/elevated) में हैं।

## Heartbeats

- Heartbeat प्रोब बॉडी कॉन्फ़िगर किया गया heartbeat प्रॉम्प्ट है (डिफ़ॉल्ट: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`)। heartbeat संदेश में इनलाइन निर्देश सामान्य रूप से लागू होते हैं (लेकिन heartbeats से सत्र डिफ़ॉल्ट बदलने से बचें)।
- Heartbeat डिलीवरी डिफ़ॉल्ट रूप से केवल अंतिम पेलोड होती है। अलग `Thinking` संदेश भी भेजने के लिए (जब उपलब्ध हो), `agents.defaults.heartbeat.includeReasoning: true` या प्रति-एजेंट `agents.list[].heartbeat.includeReasoning: true` सेट करें।

## वेब चैट UI

- पेज लोड होने पर वेब चैट thinking चयनकर्ता इनबाउंड सत्र स्टोर/कॉन्फ़िग से सत्र के संग्रहीत स्तर को प्रतिबिंबित करता है।
- कोई दूसरा स्तर चुनने पर `sessions.patch` के ज़रिए सत्र ओवरराइड तुरंत लिखा जाता है; यह अगले भेजने का इंतज़ार नहीं करता और यह एकबारगी `thinkingOnce` ओवरराइड नहीं है।
- पहला विकल्प हमेशा ओवरराइड साफ़ करने का विकल्प होता है। यह `Inherited: <resolved level>` दिखाता है, जिसमें inherited thinking अक्षम होने पर `Inherited: Off` भी शामिल है।
- स्पष्ट चयनकर्ता विकल्प अपने सीधे स्तर लेबल का उपयोग करते हैं और मौजूद होने पर प्रदाता लेबल को बनाए रखते हैं (उदाहरण के लिए प्रदाता-लेबल वाले `max` विकल्प के लिए `Maximum`)।
- चयनकर्ता gateway सत्र पंक्ति/डिफ़ॉल्ट से लौटाए गए `thinkingLevels` का उपयोग करता है, और `thinkingOptions` को legacy लेबल सूची के रूप में रखा जाता है। ब्राउज़र UI अपनी प्रदाता regex सूची नहीं रखता; plugins model-विशिष्ट स्तर सेट के स्वामी होते हैं।
- `/think:<level>` अभी भी काम करता है और उसी संग्रहीत सत्र स्तर को अपडेट करता है, इसलिए चैट निर्देश और चयनकर्ता सिंक में रहते हैं।

## प्रदाता प्रोफ़ाइल

- प्रदाता plugins मॉडल के समर्थित स्तरों और डिफ़ॉल्ट को परिभाषित करने के लिए `resolveThinkingProfile(ctx)` एक्सपोज़ कर सकते हैं।
- Claude मॉडल को प्रॉक्सी करने वाले प्रदाता plugins को `openclaw/plugin-sdk/provider-model-shared` से `resolveClaudeThinkingProfile(modelId)` का फिर से उपयोग करना चाहिए, ताकि सीधे Anthropic और प्रॉक्सी कैटलॉग संरेखित रहें।
- प्रत्येक प्रोफ़ाइल स्तर में एक संग्रहीत canonical `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, या `max`) होता है और इसमें display `label` शामिल हो सकता है। बाइनरी प्रदाता `{ id: "low", label: "on" }` का उपयोग करते हैं।
- प्रोफ़ाइल hooks उपलब्ध होने पर merged catalog facts प्राप्त करते हैं, जिनमें `reasoning`, `compat.thinkingFormat`, और `compat.supportedReasoningEfforts` शामिल हैं। इन facts का उपयोग बाइनरी या custom प्रोफ़ाइल केवल तब एक्सपोज़ करने के लिए करें जब कॉन्फ़िगर किया गया request contract मेल खाते पेलोड का समर्थन करता हो।
- जिन tool plugins को स्पष्ट thinking override validate करना है, उन्हें `api.runtime.agent.resolveThinkingPolicy({ provider, model })` और `api.runtime.agent.normalizeThinkingLevel(...)` का उपयोग करना चाहिए; उन्हें अपनी प्रदाता/model स्तर सूचियाँ नहीं रखनी चाहिए।
- कॉन्फ़िगर किए गए custom model metadata तक पहुँच वाले tool plugins `resolveThinkingPolicy` में `catalog` पास कर सकते हैं, ताकि `compat.supportedReasoningEfforts` opt-ins plugin-side validation में प्रतिबिंबित हों।
- प्रकाशित legacy hooks (`supportsXHighThinking`, `isBinaryThinking`, और `resolveDefaultThinkingLevel`) compatibility adapters के रूप में बने रहते हैं, लेकिन नए custom level sets को `resolveThinkingProfile` का उपयोग करना चाहिए।
- Gateway पंक्तियाँ/डिफ़ॉल्ट `thinkingLevels`, `thinkingOptions`, और `thinkingDefault` एक्सपोज़ करते हैं, ताकि ACP/chat clients वही profile ids और labels render करें जिनका runtime validation उपयोग करता है।
