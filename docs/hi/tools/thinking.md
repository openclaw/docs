---
read_when:
    - सोच, फ़ास्ट-मोड, या वर्बोज़ निर्देश पार्सिंग या डिफ़ॉल्ट्स को समायोजित करना
summary: /think, /fast, /verbose, /trace, और reasoning दृश्यता के लिए निर्देश सिंटैक्स
title: सोचने के स्तर
x-i18n:
    generated_at: "2026-07-03T09:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## यह क्या करता है

- किसी भी आने वाली body में inline directive: `/t <level>`, `/think:<level>`, या `/thinking <level>`।
- स्तर (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (अधिकतम बजट)
  - xhigh → "ultrathink+" (GPT-5.2+ और Codex models, साथ ही Anthropic Claude Opus 4.7+ effort)
  - adaptive → प्रदाता-प्रबंधित adaptive thinking (Anthropic/Bedrock पर Claude 4.6, Anthropic Claude Opus 4.7+, और Google Gemini dynamic thinking के लिए समर्थित)
  - max → प्रदाता का अधिकतम reasoning (Anthropic Claude Opus 4.7+; Ollama इसे अपने सर्वोच्च native `think` effort पर मैप करता है)
  - `x-high`, `x_high`, `extra-high`, `extra high`, और `extra_high` `xhigh` पर मैप होते हैं।
  - `highest` `high` पर मैप होता है।
- प्रदाता नोट्स:
  - Thinking menus और pickers प्रदाता-profile संचालित होते हैं। Provider plugins चयनित model के लिए सटीक level set घोषित करते हैं, जिसमें binary `on` जैसे labels शामिल हैं।
  - `adaptive`, `xhigh`, और `max` केवल उन provider/model profiles के लिए दिखाए जाते हैं जो उन्हें support करते हैं। Unsupported levels के लिए typed directives उस model के valid options के साथ reject किए जाते हैं।
  - मौजूदा stored unsupported levels provider profile rank के अनुसार remap किए जाते हैं। non-adaptive models पर `adaptive` `medium` पर fallback करता है, जबकि `xhigh` और `max` चयनित model के लिए सबसे बड़े supported non-off level पर fallback करते हैं।
  - Anthropic Claude 4.6 models में, जब कोई explicit thinking level set नहीं होता, default `adaptive` होता है।
  - Anthropic Claude Opus 4.8 और Opus 4.7 में thinking off रहती है जब तक आप explicitly thinking level set नहीं करते। Adaptive thinking enabled होने के बाद Opus 4.8 का provider-owned effort default `high` है।
  - Anthropic Claude Opus 4.7+ `/think xhigh` को adaptive thinking और `output_config.effort: "xhigh"` पर मैप करता है, क्योंकि `/think` एक thinking directive है और `xhigh` Opus effort setting है।
  - Anthropic Claude Opus 4.7+ `/think max` भी expose करता है; यह उसी provider-owned max effort path पर मैप होता है।
  - Direct DeepSeek V4 models `/think xhigh|max` expose करते हैं; दोनों DeepSeek `reasoning_effort: "max"` पर मैप होते हैं, जबकि lower non-off levels `high` पर मैप होते हैं।
  - OpenRouter-routed DeepSeek V4 models `/think xhigh` expose करते हैं और DeepSeek-native top-level `reasoning_effort` के बजाय OpenRouter-supported `reasoning.effort` values भेजते हैं। Lower non-off levels `high` पर मैप होते हैं, और stored `max` overrides `xhigh` पर fallback करते हैं।
  - Ollama thinking-capable models `/think low|medium|high|max` expose करते हैं; `max` native `think: "high"` पर मैप होता है क्योंकि Ollama की native API `low`, `medium`, और `high` effort strings स्वीकार करती है।
  - OpenAI GPT models `/think` को model-specific Responses API effort support के जरिए मैप करते हैं। `/think off` केवल तब `reasoning.effort: "none"` भेजता है जब target model इसे support करता है; अन्यथा OpenClaw unsupported value भेजने के बजाय disabled reasoning payload छोड़ देता है।
  - Custom OpenAI-compatible catalog entries `"xhigh"` शामिल करने के लिए `models.providers.<provider>.models[].compat.supportedReasoningEfforts` set करके `/think xhigh` में opt in कर सकते हैं। यह वही compat metadata इस्तेमाल करता है जो outbound OpenAI reasoning effort payloads को मैप करता है, इसलिए menus, session validation, agent CLI, और `llm-task` transport behavior से सहमत रहते हैं।
  - Stale configured OpenRouter Hunter Alpha refs proxy reasoning injection छोड़ देते हैं क्योंकि वह retired route reasoning fields के जरिए final answer text लौटा सकता था।
  - Google Gemini `/think adaptive` को Gemini के provider-owned dynamic thinking पर मैप करता है। Gemini 3 requests fixed `thinkingLevel` छोड़ते हैं, जबकि Gemini 2.5 requests `thinkingBudget: -1` भेजते हैं; fixed levels अब भी उस model family के लिए निकटतम Gemini `thinkingLevel` या budget पर मैप होते हैं।
  - Anthropic-compatible streaming path पर MiniMax M2.x (`minimax/MiniMax-M2*`) default रूप से `thinking: { type: "disabled" }` रखता है, जब तक आप model params या request params में explicitly thinking set नहीं करते। इससे M2.x के non-native Anthropic stream format से leaked `reasoning_content` deltas बचते हैं। MiniMax-M3 (और M3.x) exempt है: M3 सही Anthropic thinking blocks emit करता है और thinking disabled होने पर empty content लौटाता है, इसलिए OpenClaw M3 को प्रदाता के omitted/adaptive thinking path पर रखता है।
  - Z.AI (`zai/*`) अधिकतर GLM models के लिए binary (`on`/`off`) है। GLM-5.2 exception है: यह `/think off|low|high|max` expose करता है, `low` और `high` को Z.AI `reasoning_effort: "high"` पर मैप करता है, और `max` को `reasoning_effort: "max"` पर मैप करता है।
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) हमेशा सोचता है। इसकी profile केवल `on` expose करती है, और OpenClaw Moonshot की आवश्यकता के अनुसार outbound `thinking` field छोड़ देता है। अन्य `moonshot/*` models `/think off` को `thinking: { type: "disabled" }` पर और किसी भी non-`off` level को `thinking: { type: "enabled" }` पर मैप करते हैं। Thinking enabled होने पर, Moonshot केवल `tool_choice` `auto|none` स्वीकार करता है; OpenClaw incompatible values को `auto` में normalize करता है।

## Resolution order

1. Message पर inline directive (केवल उस message पर लागू होता है)।
2. Session override (directive-only message भेजकर set किया गया)।
3. Per-agent default (config में `agents.list[].thinkingDefault`)।
4. Global default (config में `agents.defaults.thinkingDefault`)।
5. Fallback: उपलब्ध होने पर provider-declared default; अन्यथा reasoning-capable models `medium` या उस model के लिए निकटतम supported non-`off` level पर resolve होते हैं, और non-reasoning models `off` रहते हैं।

## Session default set करना

- ऐसा message भेजें जो **केवल** directive हो (whitespace allowed), जैसे `/think:medium` या `/t high`।
- यह current session के लिए टिकता है (default रूप से per-sender)। Session override clear करने और configured/provider default inherit करने के लिए `/think default` इस्तेमाल करें; aliases में `inherit`, `clear`, `reset`, और `unpin` शामिल हैं।
- `/think off` explicit off override store करता है। यह thinking को तब तक disable रखता है जब तक आप session override बदलते या clear नहीं करते।
- Confirmation reply भेजा जाता है (`Thinking level set to high.` / `Thinking disabled.`)। अगर level invalid है (जैसे `/thinking big`), command hint के साथ reject होता है और session state unchanged रहती है।
- Current thinking level देखने के लिए बिना argument के `/think` (या `/think:`) भेजें।

## Agent द्वारा application

- **Embedded OpenClaw**: resolved level in-process OpenClaw agent runtime को pass किया जाता है।
- **Claude CLI backend**: `claude-cli` इस्तेमाल करते समय non-off levels Claude Code को `--effort` के रूप में pass किए जाते हैं; [CLI backends](/hi/gateway/cli-backends) देखें।

## Fast mode (/fast)

- स्तर: `auto|on|off|default`।
- Directive-only message session fast-mode override toggle करता है और `Fast mode set to auto.`, `Fast mode enabled.`, या `Fast mode disabled.` reply करता है। Session override clear करने और configured default inherit करने के लिए `/fast default` इस्तेमाल करें; aliases में `inherit`, `clear`, `reset`, और `unpin` शामिल हैं।
- Current effective fast-mode state देखने के लिए बिना mode के `/fast` (या `/fast status`) भेजें।
- OpenClaw fast mode को इस क्रम में resolve करता है:
  1. Inline/directive-only `/fast auto|on|off` override (`/fast default` इस layer को clear करता है)
  2. Session override
  3. Per-agent default (`agents.list[].fastModeDefault`)
  4. Per-model config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` session/config mode को auto के रूप में रखता है लेकिन हर नए model call को independently resolve करता है। Auto cutoff से पहले शुरू होने वाले calls में fast mode enabled होता है; बाद के retry, fallback, tool-result, या continuation calls fast mode disabled के साथ शुरू होते हैं। Cutoff default रूप से 60 seconds है; इसे बदलने के लिए active model पर `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` set करें।
- `openai/*` के लिए, fast mode supported Responses requests पर `service_tier=priority` भेजकर OpenAI priority processing पर मैप होता है।
- Codex-backed `openai/*` / `openai-codex/*` models के लिए, fast mode Codex Responses पर वही `service_tier=priority` flag भेजता है। Native Codex app-server turns को tier केवल `turn/start` या thread start/resume पर मिलता है, इसलिए `auto` पहले से running app-server turn को retier नहीं कर सकता; यह OpenClaw द्वारा शुरू किए जाने वाले अगले model turn पर लागू होता है।
- OAuth-authenticated traffic सहित direct public `anthropic/*` requests के लिए, जो `api.anthropic.com` को भेजा जाता है, fast mode Anthropic service tiers पर मैप होता है: `/fast on` `service_tier=auto` set करता है, `/fast off` `service_tier=standard_only` set करता है।
- Anthropic-compatible path पर `minimax/*` के लिए, `/fast on` (या `params.fastMode: true`) `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में rewrite करता है।
- Explicit Anthropic `serviceTier` / `service_tier` model params दोनों set होने पर fast-mode default को override करते हैं। OpenClaw अब भी non-Anthropic proxy base URLs के लिए Anthropic service-tier injection skip करता है।
- `/status` fast mode enabled होने पर `Fast` दिखाता है और configured mode auto होने पर `Fast:auto` दिखाता है।

## Verbose directives (/verbose or /v)

- स्तर: `on` (minimal) | `full` | `off` (default)।
- Directive-only message session verbose toggle करता है और `Verbose logging enabled.` / `Verbose logging disabled.` reply करता है; invalid levels state बदले बिना hint लौटाते हैं।
- `/verbose off` explicit session override store करता है; Sessions UI में `inherit` चुनकर इसे clear करें।
- Authorized external channel senders session verbose override persist कर सकते हैं। Internal gateway/webchat clients को इसे persist करने के लिए `operator.admin` चाहिए।
- Inline directive केवल उस message को affect करता है; session/global defaults अन्यथा लागू होते हैं।
- Current verbose level देखने के लिए बिना argument के `/verbose` (या `/verbose:`) भेजें।
- Verbose on होने पर, structured tool results emit करने वाले agents हर tool call को अपने metadata-only message के रूप में वापस भेजते हैं, उपलब्ध होने पर `<emoji> <tool-name>: <arg>` prefix के साथ। ये tool summaries हर tool शुरू होते ही भेजे जाते हैं (अलग bubbles), streaming deltas के रूप में नहीं।
- Tool failure summaries normal mode में visible रहती हैं, लेकिन raw error detail suffixes तब तक hidden रहते हैं जब तक verbose `full` न हो।
- Verbose `full` होने पर, tool outputs completion के बाद भी forward किए जाते हैं (अलग bubble, safe length तक truncated)। अगर आप run in-flight होने के दौरान `/verbose on|full|off` toggle करते हैं, तो subsequent tool bubbles नई setting का सम्मान करते हैं।
- `agents.defaults.toolProgressDetail` `/verbose` tool summaries और progress-draft tool lines की shape control करता है। `🛠️ Exec: checking JS syntax` जैसे compact human labels के लिए `"explain"` (default) इस्तेमाल करें; debugging के लिए raw command/detail appended भी चाहिए तो `"raw"` इस्तेमाल करें। Per-agent `agents.list[].toolProgressDetail` default को override करता है।
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin trace directives (/trace)

- स्तर: `on` | `off` (default)।
- Directive-only message session plugin trace output toggle करता है और `Plugin trace enabled.` / `Plugin trace disabled.` reply करता है।
- Inline directive केवल उस message को affect करता है; session/global defaults अन्यथा लागू होते हैं।
- Current trace level देखने के लिए बिना argument के `/trace` (या `/trace:`) भेजें।
- `/trace`, `/verbose` से narrower है: यह केवल plugin-owned trace/debug lines जैसे Active Memory debug summaries expose करता है।
- Trace lines `/status` में और normal assistant reply के बाद follow-up diagnostic message के रूप में दिखाई दे सकती हैं।

## Reasoning visibility (/reasoning)

- स्तर: `on|off|stream`।
- Directive-only message toggle करता है कि replies में thinking blocks दिखाए जाएं या नहीं।
- Enabled होने पर, reasoning को `Thinking` prefix के साथ **अलग message** के रूप में भेजा जाता है।
- `stream`: जब active channel reasoning previews support करता है, reply generate होते समय reasoning stream करता है, फिर final answer बिना reasoning भेजता है।
- Alias: `/reason`।
- Current reasoning level देखने के लिए बिना argument के `/reasoning` (या `/reasoning:`) भेजें।
- Resolution order: inline directive, फिर session override, फिर per-agent default (`agents.list[].reasoningDefault`), फिर global default (`agents.defaults.reasoningDefault`), फिर fallback (`off`)।

विकृत स्थानीय-मॉडल तर्क टैग को सावधानी से संभाला जाता है। बंद `<think>...</think>` ब्लॉक सामान्य उत्तरों में छिपे रहते हैं, और पहले से दिखाई दे रहे टेक्स्ट के बाद का अनबंद तर्क भी छिपाया जाता है। यदि कोई उत्तर पूरी तरह एक ही अनबंद ओपनिंग टैग में लिपटा हो और अन्यथा खाली टेक्स्ट के रूप में डिलीवर होता, तो OpenClaw विकृत ओपनिंग टैग हटा देता है और बचा हुआ टेक्स्ट डिलीवर करता है।

## संबंधित

- Elevated mode दस्तावेज़ [Elevated mode](/hi/tools/elevated) में हैं।

## Heartbeat

- Heartbeat probe body कॉन्फ़िगर किया गया heartbeat prompt है (डिफ़ॉल्ट: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`)। Heartbeat संदेश में inline directives सामान्य रूप से लागू होते हैं (लेकिन heartbeats से session defaults बदलने से बचें)।
- Heartbeat delivery डिफ़ॉल्ट रूप से केवल final payload पर सेट होती है। अलग `Thinking` संदेश भी भेजने के लिए (जब उपलब्ध हो), `agents.defaults.heartbeat.includeReasoning: true` या प्रति-agent `agents.list[].heartbeat.includeReasoning: true` सेट करें।

## वेब चैट UI

- पेज लोड होने पर वेब चैट thinking selector inbound session store/config से session का संग्रहीत level प्रतिबिंबित करता है।
- दूसरा level चुनने पर session override तुरंत `sessions.patch` के ज़रिए लिखा जाता है; यह अगले send का इंतज़ार नहीं करता और यह one-shot `thinkingOnce` override नहीं है।
- पहला विकल्प हमेशा clear-override विकल्प होता है। यह `Inherited: <resolved level>` दिखाता है, जिसमें inherited thinking disabled होने पर `Inherited: Off` भी शामिल है।
- स्पष्ट picker विकल्प अपने direct level labels का उपयोग करते हैं, जबकि provider labels मौजूद होने पर उन्हें संरक्षित रखते हैं (उदाहरण के लिए provider-labeled `max` विकल्प के लिए `Maximum`)।
- picker gateway session row/defaults द्वारा लौटाए गए `thinkingLevels` का उपयोग करता है, और `thinkingOptions` को legacy label list के रूप में रखा जाता है। browser UI अपनी provider regex list नहीं रखता; plugins model-specific level sets के स्वामी होते हैं।
- `/think:<level>` अब भी काम करता है और उसी stored session level को अपडेट करता है, इसलिए chat directives और picker sync में रहते हैं।

## प्रदाता प्रोफ़ाइल

- Provider plugins model के supported levels और default को परिभाषित करने के लिए `resolveThinkingProfile(ctx)` expose कर सकते हैं।
- Claude models को proxy करने वाले Provider plugins को `openclaw/plugin-sdk/provider-model-shared` से `resolveClaudeThinkingProfile(modelId)` reuse करना चाहिए ताकि direct Anthropic और proxy catalogs aligned रहें।
- प्रत्येक profile level में stored canonical `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, या `max`) होता है और इसमें display `label` शामिल हो सकता है। Binary providers `{ id: "low", label: "on" }` का उपयोग करते हैं।
- Profile hooks उपलब्ध होने पर merged catalog facts प्राप्त करते हैं, जिनमें `reasoning`, `compat.thinkingFormat`, और `compat.supportedReasoningEfforts` शामिल हैं। इन facts का उपयोग binary या custom profiles को केवल तभी expose करने के लिए करें जब configured request contract matching payload को support करता हो।
- जिन Tool plugins को explicit thinking override validate करना हो, उन्हें `api.runtime.agent.resolveThinkingPolicy({ provider, model })` और `api.runtime.agent.normalizeThinkingLevel(...)` का उपयोग करना चाहिए; उन्हें अपनी provider/model level lists नहीं रखनी चाहिए।
- Configured custom model metadata तक access वाले Tool plugins `catalog` को `resolveThinkingPolicy` में pass कर सकते हैं ताकि `compat.supportedReasoningEfforts` opt-ins plugin-side validation में reflect हों।
- Published legacy hooks (`supportsXHighThinking`, `isBinaryThinking`, और `resolveDefaultThinkingLevel`) compatibility adapters के रूप में बने रहते हैं, लेकिन नए custom level sets को `resolveThinkingProfile` का उपयोग करना चाहिए।
- Gateway rows/defaults `thinkingLevels`, `thinkingOptions`, और `thinkingDefault` expose करते हैं ताकि ACP/chat clients वही profile ids और labels render करें जिनका runtime validation उपयोग करता है।
