---
read_when:
    - एजेंट डिफ़ॉल्ट्स को ट्यून करना (मॉडल, सोच, कार्यक्षेत्र, Heartbeat, मीडिया, Skills)
    - बहु-एजेंट रूटिंग और बाइंडिंग कॉन्फ़िगर करना
    - सत्र, संदेश वितरण, और बातचीत-मोड व्यवहार को समायोजित करना
summary: एजेंट डिफ़ॉल्ट, मल्टी-एजेंट रूटिंग, सत्र, संदेश, और टॉक कॉन्फ़िगरेशन
title: कॉन्फ़िगरेशन — एजेंट
x-i18n:
    generated_at: "2026-06-28T23:06:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, और `talk.*` के अंतर्गत एजेंट-स्कोप वाली कॉन्फ़िगरेशन कुंजियाँ। चैनलों, टूल्स, gateway runtime, और अन्य
शीर्ष-स्तरीय कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## एजेंट डिफ़ॉल्ट

### `agents.defaults.workspace`

डिफ़ॉल्ट: `OPENCLAW_WORKSPACE_DIR` सेट होने पर वही, अन्यथा `~/.openclaw/workspace`।

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

स्पष्ट `agents.defaults.workspace` मान
`OPENCLAW_WORKSPACE_DIR` पर प्राथमिकता लेता है। जब आप उस पथ को config में लिखना नहीं चाहते, तब डिफ़ॉल्ट एजेंटों को
माउंट किए गए workspace की ओर इंगित करने के लिए environment variable का उपयोग करें।

### `agents.defaults.repoRoot`

वैकल्पिक repository root जो system prompt की Runtime पंक्ति में दिखाया जाता है। सेट न होने पर, OpenClaw workspace से ऊपर की ओर चलते हुए स्वतः पता लगाता है।

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

उन एजेंटों के लिए वैकल्पिक डिफ़ॉल्ट skill allowlist जो
`agents.list[].skills` सेट नहीं करते।

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- डिफ़ॉल्ट रूप से अप्रतिबंधित skills के लिए `agents.defaults.skills` छोड़ दें।
- डिफ़ॉल्ट विरासत में लेने के लिए `agents.list[].skills` छोड़ दें।
- कोई skills नहीं चाहिए तो `agents.list[].skills: []` सेट करें।
- गैर-रिक्त `agents.list[].skills` सूची उस एजेंट के लिए अंतिम सेट होती है; यह
  डिफ़ॉल्ट के साथ merge नहीं होती।

### `agents.defaults.skipBootstrap`

workspace bootstrap फ़ाइलों (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) का स्वचालित निर्माण अक्षम करता है।

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

आवश्यक bootstrap फ़ाइलें लिखते हुए भी चुनी गई वैकल्पिक workspace फ़ाइलों का निर्माण छोड़ता है। मान्य मान: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, और `IDENTITY.md`।

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

नियंत्रित करता है कि workspace bootstrap फ़ाइलें system prompt में कब inject की जाती हैं। डिफ़ॉल्ट: `"always"`।

- `"continuation-skip"`: सुरक्षित continuation turns (पूर्ण assistant response के बाद) workspace bootstrap re-injection छोड़ देते हैं, जिससे prompt आकार घटता है। Heartbeat runs और post-compaction retries फिर भी context दोबारा बनाते हैं।
- `"never"`: हर turn पर workspace bootstrap और context-file injection अक्षम करें। इसे केवल उन एजेंटों के लिए उपयोग करें जो अपने prompt lifecycle का पूरा स्वामित्व रखते हैं (custom context engines, native runtimes जो अपना context स्वयं बनाते हैं, या विशेष bootstrap-free workflows)। Heartbeat और compaction-recovery turns भी injection छोड़ते हैं।

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

प्रति-एजेंट override: `agents.list[].contextInjection`। छोड़े गए मान
`agents.defaults.contextInjection` से विरासत में मिलते हैं।

### `agents.defaults.bootstrapMaxChars`

truncation से पहले प्रति workspace bootstrap फ़ाइल अधिकतम characters। डिफ़ॉल्ट: `20000`।

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

प्रति-एजेंट override: `agents.list[].bootstrapMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapMaxChars` से विरासत में मिलते हैं।

### `agents.defaults.bootstrapTotalMaxChars`

सभी workspace bootstrap फ़ाइलों में inject किए गए कुल अधिकतम characters। डिफ़ॉल्ट: `60000`।

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

प्रति-एजेंट override: `agents.list[].bootstrapTotalMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapTotalMaxChars` से विरासत में मिलते हैं।

### प्रति-एजेंट bootstrap profile overrides

जब किसी एक एजेंट को साझा डिफ़ॉल्ट से अलग prompt
injection व्यवहार चाहिए, तब प्रति-एजेंट bootstrap profile overrides का उपयोग करें। छोड़े गए fields
`agents.defaults` से विरासत में मिलते हैं।

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap context truncate होने पर एजेंट को दिखने वाले system-prompt notice को नियंत्रित करता है।
डिफ़ॉल्ट: `"always"`।

- `"off"`: system prompt में truncation notice text कभी inject न करें।
- `"once"`: प्रत्येक अनोखे truncation signature के लिए एक बार संक्षिप्त notice inject करें।
- `"always"`: truncation मौजूद होने पर हर run में संक्षिप्त notice inject करें (अनुशंसित)।

विस्तृत raw/injected counts और config tuning fields diagnostics जैसे
context/status reports और logs में रहते हैं; routine WebChat user/runtime context को केवल
संक्षिप्त recovery notice मिलता है।

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Context budget ownership map

OpenClaw में कई high-volume prompt/context budgets हैं, और उन्हें जानबूझकर
एक generic knob से गुज़ारने के बजाय subsystem के अनुसार विभाजित किया गया है।

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  सामान्य workspace bootstrap injection।
- `agents.defaults.startupContext.*`:
  one-shot reset/startup model-run prelude, जिसमें recent daily
  `memory/*.md` फ़ाइलें शामिल हैं। Bare chat `/new` और `/reset` commands को
  model invoke किए बिना acknowledge किया जाता है।
- `skills.limits.*`:
  system prompt में inject की गई compact skills list।
- `agents.defaults.contextLimits.*`:
  bounded runtime excerpts और injected runtime-owned blocks।
- `memory.qmd.limits.*`:
  indexed memory-search snippet और injection sizing।

केवल तब matching per-agent override का उपयोग करें जब किसी एक एजेंट को अलग
budget चाहिए:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

reset/startup model runs पर inject किए गए first-turn startup prelude को नियंत्रित करता है।
Bare chat `/new` और `/reset` commands model invoke किए बिना reset acknowledge करते हैं,
इसलिए वे यह prelude load नहीं करते।

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

bounded runtime context surfaces के लिए साझा डिफ़ॉल्ट।

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: truncation
  metadata और continuation notice जोड़े जाने से पहले डिफ़ॉल्ट `memory_get` excerpt cap।
- `memoryGetDefaultLines`: `lines` छोड़े जाने पर डिफ़ॉल्ट `memory_get` line window।
- `toolResultMaxChars`: persisted
  results और overflow recovery के लिए उपयोग की जाने वाली advanced live tool-result ceiling। model-context auto cap के लिए unset छोड़ें:
  100K tokens से नीचे `16000` chars, 100K+ tokens पर `32000` chars, और 200K+ tokens पर `64000`
  chars। long-context models के लिए `1000000` तक के स्पष्ट मान स्वीकार किए जाते हैं,
  लेकिन effective cap फिर भी model context window के लगभग 30% तक सीमित रहता है। `openclaw doctor --deep` effective cap प्रिंट करता है,
  और doctor केवल तब चेतावनी देता है जब कोई explicit override stale हो या उसका कोई प्रभाव न हो।
- `postCompactionMaxChars`: post-compaction
  refresh injection के दौरान उपयोग किया गया AGENTS.md excerpt cap।

#### `agents.list[].contextLimits`

साझा `contextLimits` knobs के लिए प्रति-एजेंट override। छोड़े गए fields
`agents.defaults.contextLimits` से विरासत में मिलते हैं।

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

system prompt में inject की गई compact skills list के लिए global cap। यह
मांग पर `SKILL.md` फ़ाइलें पढ़ने को प्रभावित नहीं करता।

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

skills prompt budget के लिए प्रति-एजेंट override।

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

provider calls से पहले transcript/tool image blocks में सबसे लंबे image side का अधिकतम pixel size।
डिफ़ॉल्ट: `1200`।

कम मान आम तौर पर screenshot-heavy runs के लिए vision-token usage और request payload size घटाते हैं।
अधिक मान अधिक visual detail सुरक्षित रखते हैं।

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

file paths, URLs, और media references से load की गई images के लिए image-tool compression/detail preference।
डिफ़ॉल्ट: `auto`।

OpenClaw चयनित image model के अनुसार resize ladder को adapt करता है। उदाहरण के लिए, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL, और hosted Llama 4 vision models पुराने/default high-detail vision paths की तुलना में बड़ी images का उपयोग कर सकते हैं, जबकि token और latency cost नियंत्रित करने के लिए multi-image turns को `auto` mode में अधिक aggressive ढंग से compress किया जाता है।

मान:

- `auto`: model limits और image count के अनुसार adapt करें।
- `efficient`: कम token और byte usage के लिए छोटी images को प्राथमिकता दें।
- `balanced`: standard middle-ground ladder का उपयोग करें।
- `high`: screenshots, diagrams, और document images के लिए अधिक detail सुरक्षित रखें।

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

system prompt context के लिए timezone (message timestamps नहीं)। host timezone पर fallback करता है।

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt में time format। डिफ़ॉल्ट: `auto` (OS preference)।

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - स्ट्रिंग रूप केवल प्राथमिक मॉडल सेट करता है।
  - ऑब्जेक्ट रूप प्राथमिक के साथ क्रमबद्ध failover मॉडल सेट करता है।
- `imageModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - `image` tool path द्वारा उसके vision-model config के रूप में उपयोग किया जाता है।
  - जब चयनित/डिफ़ॉल्ट मॉडल image input स्वीकार नहीं कर सकता, तब fallback routing के रूप में भी उपयोग किया जाता है।
  - स्पष्ट `provider/model` refs को प्राथमिकता दें। Bare IDs compatibility के लिए स्वीकार किए जाते हैं; यदि कोई bare ID `models.providers.*.models` में कॉन्फ़िगर की गई image-capable entry से अद्वितीय रूप से मेल खाता है, तो OpenClaw उसे उस provider के लिए qualify करता है। अस्पष्ट कॉन्फ़िगर किए गए matches के लिए स्पष्ट provider prefix आवश्यक है।
- `imageGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा image-generation capability और images generate करने वाले किसी भी future tool/plugin surface द्वारा उपयोग किया जाता है।
  - सामान्य values: native Gemini image generation के लिए `google/gemini-3.1-flash-image-preview`, fal के लिए `fal/fal-ai/flux/dev`, OpenAI Images के लिए `openai/gpt-image-2`, या transparent-background OpenAI PNG/WebP output के लिए `openai/gpt-image-1.5`।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth भी configure करें (उदाहरण के लिए `google/*` के लिए `GEMINI_API_KEY` या `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` के लिए `OPENAI_API_KEY` या OpenAI Codex OAuth, `fal/*` के लिए `FAL_KEY`)।
  - यदि छोड़ा गया है, तो `image_generate` अब भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id order में बाकी registered image-generation providers।
- `musicGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा music-generation capability और built-in `music_generate` tool द्वारा उपयोग किया जाता है।
  - सामान्य values: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, या `minimax/music-2.6`।
  - यदि छोड़ा गया है, तो `music_generate` अब भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id order में बाकी registered music-generation providers।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth/API key भी configure करें।
- `videoGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा video-generation capability और built-in `video_generate` tool द्वारा उपयोग किया जाता है।
  - सामान्य values: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, या `qwen/wan2.7-r2v`।
  - यदि छोड़ा गया है, तो `video_generate` अब भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id order में बाकी registered video-generation providers।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth/API key भी configure करें।
  - आधिकारिक Qwen video-generation Plugin अधिकतम 1 output video, 1 input image, 4 input videos, 10 seconds duration, और provider-level `size`, `aspectRatio`, `resolution`, `audio`, और `watermark` options का समर्थन करता है।
- `pdfModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - model routing के लिए `pdf` tool द्वारा उपयोग किया जाता है।
  - यदि छोड़ा गया है, तो PDF tool `imageModel` पर, फिर resolved session/default model पर fallback करता है।
- `pdfMaxBytesMb`: `pdf` tool के लिए default PDF size limit, जब call time पर `maxBytesMb` pass नहीं किया जाता।
- `pdfMaxPages`: `pdf` tool में extraction fallback mode द्वारा consider किए जाने वाले default maximum pages।
- `verboseDefault`: agents के लिए default verbose level। Values: `"off"`, `"on"`, `"full"`। Default: `"off"`।
- `toolProgressDetail`: `/verbose` tool summaries और progress-draft tool lines के लिए detail mode। Values: `"explain"` (default, compact human labels) या `"raw"` (उपलब्ध होने पर raw command/detail append करें)। Per-agent `agents.list[].toolProgressDetail` इस default को override करता है।
- `reasoningDefault`: agents के लिए default reasoning visibility। Values: `"off"`, `"on"`, `"stream"`। Per-agent `agents.list[].reasoningDefault` इस default को override करता है। Configured reasoning defaults केवल owners, authorized senders, या operator-admin gateway contexts के लिए लागू होते हैं, जब कोई per-message या session reasoning override set नहीं होता।
- `elevatedDefault`: agents के लिए default elevated-output level। Values: `"off"`, `"on"`, `"ask"`, `"full"`। Default: `"on"`।
- `model.primary`: format `provider/model` (जैसे OpenAI API-key या Codex OAuth access के लिए `openai/gpt-5.5`)। यदि आप provider छोड़ते हैं, तो OpenClaw पहले alias आज़माता है, फिर उस exact model id के लिए unique configured-provider match, और केवल उसके बाद configured default provider पर fallback करता है (deprecated compatibility behavior, इसलिए explicit `provider/model` को प्राथमिकता दें)। यदि वह provider अब configured default model expose नहीं करता, तो OpenClaw stale removed-provider default surface करने के बजाय पहले configured provider/model पर fallback करता है।
- `models`: `/model` के लिए configured model catalog और allowlist। हर entry में `alias` (shortcut) और `params` (provider-specific, उदाहरण के लिए `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` routing, `chat_template_kwargs`, `extra_body`/`extraBody`) शामिल हो सकते हैं।
  - हर model id manually list किए बिना selected providers के सभी discovered models दिखाने के लिए `"openai/*": {}` या `"vllm/*": {}` जैसे `provider/*` entries का उपयोग करें।
  - जब उस provider के लिए dynamically discovered हर model को वही runtime use करना चाहिए, तो `provider/*` entry में `agentRuntime` जोड़ें। Exact `provider/model` runtime policy फिर भी wildcard पर प्राथमिकता रखती है।
  - सुरक्षित edits: entries जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। जब तक आप `--replace` pass नहीं करते, `config set` ऐसे replacements को मना करता है जो existing allowlist entries हटा देंगे।
  - Provider-scoped configure/onboarding flows selected provider models को इस map में merge करते हैं और पहले से configured unrelated providers को preserve करते हैं।
  - direct OpenAI Responses models के लिए, server-side compaction अपने आप enabled होता है। `context_management` inject करना रोकने के लिए `params.responsesServerCompaction: false`, या threshold override करने के लिए `params.responsesCompactThreshold` का उपयोग करें। [OpenAI server-side compaction](/hi/providers/openai#server-side-compaction-responses-api) देखें।
- `params`: सभी models पर लागू global default provider parameters। `agents.defaults.params` पर set करें (जैसे `{ cacheRetention: "long" }`)।
- `params` merge precedence (config): `agents.defaults.params` (global base) को `agents.defaults.models["provider/model"].params` (per-model) override करता है, फिर `agents.list[].params` (matching agent id) key के हिसाब से override करता है। विवरण के लिए [Prompt Caching](/hi/reference/prompt-caching) देखें।
- `models.providers.openrouter.params.provider`: OpenRouter-wide default provider-routing policy। OpenClaw इसे OpenRouter के request `provider` object को forward करता है; per-model `agents.defaults.models["openrouter/<model>"].params.provider` और agent params key के हिसाब से override करते हैं। [OpenRouter provider routing](/hi/providers/openrouter#advanced-configuration) देखें।
- `params.extra_body`/`params.extraBody`: OpenAI-compatible proxies के लिए `api: "openai-completions"` request bodies में merged advanced pass-through JSON। यदि यह generated request keys से collide करता है, तो extra body जीतता है; non-native completions routes बाद में भी OpenAI-only `store` को strip करते हैं।
- `params.chat_template_kwargs`: vLLM/OpenAI-compatible chat-template arguments जो top-level `api: "openai-completions"` request bodies में merge होते हैं। `vllm/nemotron-3-*` के लिए thinking off होने पर, bundled vLLM Plugin अपने आप `enable_thinking: false` और `force_nonempty_content: true` भेजता है; explicit `chat_template_kwargs` generated defaults को override करते हैं, और `extra_body.chat_template_kwargs` की final precedence बनी रहती है। Configured vLLM Qwen और Nemotron thinking models multi-level effort ladder के बजाय binary `/think` choices (`off`, `on`) expose करते हैं।
- `compat.thinkingFormat`: OpenAI-compatible thinking payload style। Together-style `reasoning.enabled` के लिए `"together"`, Qwen-style top-level `enable_thinking` के लिए `"qwen"`, या request-level chat-template kwargs support करने वाले Qwen-family backends, जैसे vLLM, पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` का उपयोग करें। OpenClaw disabled thinking को `false` और enabled thinking को `true` पर map करता है, और configured vLLM Qwen models इन formats के लिए binary `/think` choices expose करते हैं।
- `compat.supportedReasoningEfforts`: per-model OpenAI-compatible reasoning effort list। Custom endpoints के लिए `"xhigh"` शामिल करें जो वास्तव में इसे accept करते हैं; तब OpenClaw उस configured provider/model के लिए command menus, Gateway session rows, session patch validation, agent CLI validation, और `llm-task` validation में `/think xhigh` expose करता है। जब backend canonical level के लिए provider-specific value चाहता हो, तो `compat.reasoningEffortMap` का उपयोग करें।
- `params.preserveThinking`: preserved thinking के लिए Z.AI-only opt-in। Enabled होने और thinking on होने पर, OpenClaw `thinking.clear_thinking: false` भेजता है और prior `reasoning_content` replay करता है; [Z.AI thinking and preserved thinking](/hi/providers/zai#thinking-and-preserved-thinking) देखें।
- `localService`: local/self-hosted model servers के लिए optional provider-level process manager। जब selected model उस provider से संबंधित होता है, OpenClaw `healthUrl` (या `baseUrl + "/models"`) probe करता है, endpoint down होने पर `args` के साथ `command` start करता है, `readyTimeoutMs` तक wait करता है, फिर model request भेजता है। `command` absolute path होना चाहिए। `idleStopMs: 0` process को OpenClaw exit होने तक alive रखता है; positive value उतने idle milliseconds के बाद OpenClaw-spawned process को stop करती है। [Local model services](/hi/gateway/local-model-services) देखें।
- Runtime policy providers या models पर होती है, `agents.defaults` पर नहीं। Provider-wide rules के लिए `models.providers.<provider>.agentRuntime` या model-specific rules के लिए `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` का उपयोग करें। Official OpenAI provider पर OpenAI agent models default रूप से Codex select करते हैं।
- इन fields को mutate करने वाले config writers (उदाहरण के लिए `/models set`, `/models set-image`, और fallback add/remove commands) canonical object form save करते हैं और संभव होने पर existing fallback lists preserve करते हैं।
- `maxConcurrent`: sessions के across max parallel agent runs (हर session अभी भी serialized है)। Default: 4।

### Runtime policy

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, कोई पंजीकृत plugin harness id, या समर्थित CLI backend alias. bundled Codex plugin `codex` पंजीकृत करता है; bundled Anthropic plugin `claude-cli` CLI backend देता है।
- `id: "auto"` पंजीकृत plugin harnesses को समर्थित turns claim करने देता है और जब कोई harness match नहीं करता, तब OpenClaw का उपयोग करता है। कोई explicit plugin runtime जैसे `id: "codex"` उस harness की मांग करता है और अगर वह अनुपलब्ध हो या fail हो, तो fail closed करता है।
- `id: "pi"` केवल `openclaw` के deprecated alias के रूप में स्वीकार किया जाता है, ताकि v2026.5.22 और उससे पहले के shipped configs सुरक्षित रहें। नए config में `openclaw` का उपयोग करना चाहिए।
- Runtime precedence पहले exact model policy है (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, या `models.providers.<provider>.models[]`), फिर `agents.list[]` / `agents.defaults.models["provider/*"]`, फिर `models.providers.<provider>.agentRuntime` पर provider-wide policy।
- Whole-agent runtime keys legacy हैं। `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins, और `OPENCLAW_AGENT_RUNTIME` को runtime selection अनदेखा करता है। stale values हटाने के लिए `openclaw doctor --fix` चलाएँ।
- OpenAI agent models default रूप से Codex harness का उपयोग करते हैं; जब आप इसे explicit बनाना चाहते हैं, तब provider/model `agentRuntime.id: "codex"` वैध रहता है।
- Claude CLI deployments के लिए, `model: "anthropic/claude-opus-4-8"` और model-scoped `agentRuntime.id: "claude-cli"` को प्राथमिकता दें। Legacy `claude-cli/claude-opus-4-7` model refs compatibility के लिए अभी भी काम करते हैं, लेकिन नए config में provider/model selection canonical रखना चाहिए और execution backend को provider/model runtime policy में रखना चाहिए।
- यह केवल text agent-turn execution को नियंत्रित करता है। Media generation, vision, PDF, music, video, और TTS अभी भी अपनी provider/model settings का उपयोग करते हैं।

**Built-in alias shorthands** (केवल तब लागू होते हैं जब model `agents.defaults.models` में हो):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

आपके configured aliases हमेशा defaults पर प्राथमिकता लेते हैं।

Z.AI GLM-4.x models automatically thinking mode enable करते हैं, जब तक आप `--thinking off` set नहीं करते या `agents.defaults.models["zai/<model>"].params.thinking` स्वयं define नहीं करते।
Z.AI models tool call streaming के लिए default रूप से `tool_stream` enable करते हैं। इसे disable करने के लिए `agents.defaults.models["zai/<model>"].params.tool_stream` को `false` set करें।
Anthropic Claude Opus 4.8 OpenClaw में default रूप से thinking off रखता है; जब adaptive thinking explicit रूप से enable हो, तब Anthropic का provider-owned effort default `high` होता है। Claude 4.6 models default रूप से `adaptive` का उपयोग करते हैं जब कोई explicit thinking level set नहीं हो।

### `agents.defaults.cliBackends`

text-only fallback runs (कोई tool calls नहीं) के लिए optional CLI backends। API providers fail होने पर backup के रूप में उपयोगी।

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backends text-first हैं; tools हमेशा disabled रहते हैं।
- Sessions तब supported हैं जब `sessionArg` set हो।
- Image pass-through तब supported है जब `imageArg` file paths स्वीकार करता हो।
- `reseedFromRawTranscriptWhenUncompacted: true` backend को पहले compaction summary के मौजूद होने से पहले bounded raw OpenClaw transcript tail से safe invalidated sessions recover करने देता है। Auth profile या credential-epoch changes फिर भी कभी raw-reseed नहीं करते।

### `agents.defaults.promptOverlays`

OpenClaw-assembled prompt surfaces पर model family के अनुसार लागू provider-independent prompt overlays। GPT-5-family model ids को OpenClaw/provider routes में shared behavior contract मिलता है; `personality` केवल friendly interaction-style layer को नियंत्रित करता है। Native Codex app-server routes इस OpenClaw GPT-5 overlay के बजाय Codex-owned base/model instructions रखते हैं, और OpenClaw native threads के लिए Codex की built-in personality disable करता है।

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (default) और `"on"` friendly interaction-style layer enable करते हैं।
- `"off"` केवल friendly layer disable करता है; tagged GPT-5 behavior contract enabled रहता है।
- Legacy `plugins.entries.openai.config.personality` अभी भी तब read किया जाता है जब यह shared setting unset हो।

### `agents.defaults.heartbeat`

Periodic heartbeat runs।

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: duration string (ms/s/m/h)। Default: `30m` (API-key auth) या `1h` (OAuth auth)। disable करने के लिए `0m` set करें।
- `includeSystemPromptSection`: false होने पर, system prompt से Heartbeat section हटाता है और bootstrap context में `HEARTBEAT.md` injection skip करता है। Default: `true`।
- `suppressToolErrorWarnings`: true होने पर, heartbeat runs के दौरान tool error warning payloads suppress करता है।
- `timeoutSeconds`: heartbeat agent turn abort होने से पहले अनुमत अधिकतम समय, seconds में। unset छोड़ें ताकि set होने पर `agents.defaults.timeoutSeconds` उपयोग हो, अन्यथा heartbeat cadence 600 seconds पर capped हो।
- `directPolicy`: direct/DM delivery policy। `allow` (default) direct-target delivery की अनुमति देता है। `block` direct-target delivery suppress करता है और `reason=dm-blocked` emit करता है।
- `lightContext`: true होने पर, heartbeat runs lightweight bootstrap context का उपयोग करते हैं और workspace bootstrap files से केवल `HEARTBEAT.md` रखते हैं।
- `isolatedSession`: true होने पर, प्रत्येक heartbeat बिना prior conversation history के fresh session में चलता है। cron `sessionTarget: "isolated"` जैसा ही isolation pattern। per-heartbeat token cost को ~100K से ~2-5K tokens तक घटाता है।
- `skipWhenBusy`: true होने पर, heartbeat runs उस agent की extra busy lanes पर defer होते हैं: उसका अपना session-keyed subagent या nested command work। Cron lanes हमेशा heartbeats defer करती हैं, इस flag के बिना भी।
- Per-agent: `agents.list[].heartbeat` set करें। जब कोई agent `heartbeat` define करता है, **केवल वे agents** heartbeats चलाते हैं।
- Heartbeats full agent turns चलाते हैं — छोटे intervals अधिक tokens खर्च करते हैं।

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` या `safeguard` (लंबे इतिहासों के लिए खंडित सारांशीकरण)। [Compaction](/hi/concepts/compaction) देखें।
- `provider`: पंजीकृत Compaction प्रदाता plugin की आईडी। सेट होने पर, अंतर्निहित LLM सारांशीकरण के बजाय प्रदाता का `summarize()` कॉल किया जाता है। विफलता पर अंतर्निहित पर वापस चला जाता है। प्रदाता सेट करने से `mode: "safeguard"` बाध्य होता है। [Compaction](/hi/concepts/compaction) देखें।
- `timeoutSeconds`: किसी एक Compaction ऑपरेशन के लिए OpenClaw द्वारा उसे रोकने से पहले अनुमत अधिकतम सेकंड। डिफ़ॉल्ट: `180`।
- `keepRecentTokens`: सबसे हाल की ट्रांसक्रिप्ट पूंछ को शब्दशः रखने के लिए एजेंट कट-पॉइंट बजट। मैन्युअल `/compact` इसे तब मानता है जब इसे स्पष्ट रूप से सेट किया गया हो; अन्यथा मैन्युअल Compaction एक हार्ड चेकपॉइंट है।
- `identifierPolicy`: `strict` (डिफ़ॉल्ट), `off`, या `custom`। `strict` Compaction सारांशीकरण के दौरान अंतर्निहित अपारदर्शी पहचानकर्ता संरक्षण मार्गदर्शन को पहले जोड़ता है।
- `identifierInstructions`: `identifierPolicy=custom` होने पर उपयोग किया जाने वाला वैकल्पिक कस्टम पहचानकर्ता-संरक्षण टेक्स्ट।
- `qualityGuard`: सुरक्षा सारांशों के लिए विकृत-आउटपुट पर फिर से प्रयास करने वाली जांचें। सुरक्षा मोड में डिफ़ॉल्ट रूप से सक्षम; ऑडिट छोड़ने के लिए `enabled: false` सेट करें।
- `midTurnPrecheck`: वैकल्पिक टूल-लूप दबाव जांच। जब `enabled: true` होता है, OpenClaw टूल परिणाम जोड़े जाने के बाद और अगले मॉडल कॉल से पहले संदर्भ दबाव जांचता है। यदि संदर्भ अब फिट नहीं होता, तो यह प्रॉम्प्ट सबमिट करने से पहले वर्तमान प्रयास को रोक देता है और टूल परिणामों को छोटा करने या compact कर फिर से प्रयास करने के लिए मौजूदा प्रीचेक रिकवरी पथ का पुनः उपयोग करता है। `default` और `safeguard` दोनों Compaction मोड के साथ काम करता है। डिफ़ॉल्ट: अक्षम।
- `postCompactionSections`: Compaction के बाद फिर से इंजेक्ट करने के लिए वैकल्पिक AGENTS.md H2/H3 सेक्शन नाम। unset होने या `[]` पर सेट होने पर रीइंजेक्शन अक्षम रहता है। स्पष्ट रूप से `["Session Startup", "Red Lines"]` सेट करने से वह जोड़ी सक्षम होती है और विरासत `Every Session`/`Safety` fallback सुरक्षित रहता है। इसे केवल तब सक्षम करें जब अतिरिक्त संदर्भ, Compaction सारांश में पहले से कैप्चर किए गए प्रोजेक्ट मार्गदर्शन की नकल करने के जोखिम के लायक हो।
- `model`: केवल Compaction सारांशीकरण के लिए वैकल्पिक `provider/model-id` या `agents.defaults.models` से साधारण alias। साधारण alias dispatch से पहले resolve होते हैं; टकराव होने पर कॉन्फ़िगर किए गए literal model IDs की प्राथमिकता बनी रहती है। इसका उपयोग तब करें जब मुख्य सेशन को एक मॉडल रखना चाहिए लेकिन Compaction सारांश दूसरे पर चलने चाहिए; unset होने पर, Compaction सेशन के प्राथमिक मॉडल का उपयोग करता है।
- `maxActiveTranscriptBytes`: वैकल्पिक बाइट सीमा (`number` या `"20mb"` जैसी strings) जो active JSONL के सीमा से आगे बढ़ने पर run से पहले सामान्य local Compaction ट्रिगर करती है। `truncateAfterCompaction` आवश्यक है ताकि सफल Compaction छोटे successor transcript पर rotate कर सके। unset या `0` होने पर अक्षम।
- `notifyUser`: `true` होने पर, Compaction शुरू होने और पूरा होने पर उपयोगकर्ता को संक्षिप्त सूचनाएं भेजता है (उदाहरण के लिए, "Compacting context..." और "Compaction complete")। Compaction को silent रखने के लिए डिफ़ॉल्ट रूप से अक्षम।
- `memoryFlush`: auto-compaction से पहले durable memories संग्रहीत करने के लिए silent agentic turn। जब यह housekeeping turn local model पर ही रहना चाहिए, तो `model` को `ollama/qwen3:8b` जैसे exact provider/model पर सेट करें; override active session fallback chain inherit नहीं करता। workspace read-only होने पर छोड़ दिया जाता है।

### `agents.defaults.runRetries`

विफलता रिकवरी के दौरान अनंत execution loops रोकने के लिए embedded agent runtime के outer run loop retry iteration boundaries। ध्यान दें कि यह setting वर्तमान में केवल embedded agent runtime पर लागू होती है, ACP या CLI runtimes पर नहीं।

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: outer run loop के लिए run retry iterations की base संख्या। डिफ़ॉल्ट: `24`।
- `perProfile`: प्रति fallback profile candidate दिए जाने वाले अतिरिक्त run retry iterations। डिफ़ॉल्ट: `8`।
- `min`: run retry iterations के लिए न्यूनतम absolute limit। डिफ़ॉल्ट: `32`।
- `max`: runaway execution रोकने के लिए run retry iterations की अधिकतम absolute limit। डिफ़ॉल्ट: `160`।

### `agents.defaults.contextPruning`

LLM को भेजने से पहले in-memory context से **पुराने tool results** prune करता है। डिस्क पर session history को modify **नहीं** करता।

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` pruning passes सक्षम करता है।
- `ttl` नियंत्रित करता है कि pruning फिर से कितनी बार चल सकती है (last cache touch के बाद)।
- Pruning पहले oversized tool results को soft-trim करती है, फिर आवश्यकता होने पर पुराने tool results को hard-clear करती है।
- `softTrimRatio` और `hardClearRatio` `0.0` से `1.0` तक मान स्वीकार करते हैं; config validation उस range से बाहर के मानों को reject करता है।

**Soft-trim** शुरुआत + अंत रखता है और बीच में `...` insert करता है।

**Hard-clear** पूरे tool result को placeholder से बदल देता है।

नोट्स:

- Image blocks को कभी trim/clear नहीं किया जाता।
- Ratios character-based (approximate) हैं, exact token counts नहीं।
- यदि `keepLastAssistants` से कम assistant messages मौजूद हों, तो pruning छोड़ दी जाती है।

</Accordion>

व्यवहार विवरण के लिए [Session Pruning](/hi/concepts/session-pruning) देखें।

### ब्लॉक streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Non-Telegram channels को block replies सक्षम करने के लिए स्पष्ट `*.blockStreaming: true` चाहिए।
- Channel overrides: `channels.<channel>.blockStreamingCoalesce` (और per-account variants)। Signal/Slack/Discord/Google Chat डिफ़ॉल्ट `minChars: 1500`।
- `humanDelay`: block replies के बीच randomized pause। `natural` = 800–2500ms। Per-agent override: `agents.list[].humanDelay`।

व्यवहार + chunking विवरण के लिए [Streaming](/hi/concepts/streaming) देखें।

### Typing indicators

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- डिफ़ॉल्ट: direct chats/mentions के लिए `instant`, unmentioned group chats के लिए `message`।
- Per-session overrides: `session.typingMode`, `session.typingIntervalSeconds`।

[Typing Indicators](/hi/concepts/typing-indicators) देखें।

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

embedded agent के लिए वैकल्पिक sandboxing। पूर्ण गाइड के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend:**

- `docker`: local Docker runtime (डिफ़ॉल्ट)
- `ssh`: generic SSH-backed remote runtime
- `openshell`: OpenShell runtime

जब `backend: "openshell"` चुना जाता है, runtime-specific settings
`plugins.entries.openshell.config` में चली जाती हैं।

**SSH backend config:**

- `target`: `user@host[:port]` रूप में SSH target
- `command`: SSH client command (डिफ़ॉल्ट: `ssh`)
- `workspaceRoot`: per-scope workspaces के लिए उपयोग किया गया absolute remote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH को पास की गई मौजूदा local files
- `identityData` / `certificateData` / `knownHostsData`: inline contents या SecretRefs जिन्हें OpenClaw runtime पर temp files में materialize करता है
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key policy knobs

**SSH auth precedence:**

- `identityData`, `identityFile` पर प्राथमिकता रखता है
- `certificateData`, `certificateFile` पर प्राथमिकता रखता है
- `knownHostsData`, `knownHostsFile` पर प्राथमिकता रखता है
- SecretRef-backed `*Data` values sandbox session शुरू होने से पहले active secrets runtime snapshot से resolve किए जाते हैं

**SSH backend behavior:**

- create या recreate के बाद remote workspace को एक बार seed करता है
- फिर remote SSH workspace को canonical रखता है
- `exec`, file tools, और media paths को SSH के ऊपर route करता है
- remote changes को host पर automatically sync नहीं करता
- sandbox browser containers का support नहीं करता

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` के तहत per-scope sandbox workspace
- `ro`: `/workspace` पर sandbox workspace, `/agent` पर agent workspace read-only mount किया गया
- `rw`: `/workspace` पर agent workspace read/write mount किया गया

**Scope:**

- `session`: per-session container + workspace
- `agent`: प्रति agent एक container + workspace (डिफ़ॉल्ट)
- `shared`: shared container और workspace (कोई cross-session isolation नहीं)

**OpenShell plugin config:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // वैकल्पिक
          gatewayEndpoint: "https://lab.example", // वैकल्पिक
          policy: "strict", // वैकल्पिक OpenShell policy id
          providers: ["openai"], // वैकल्पिक
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell मोड:**

- `mirror`: exec से पहले local से remote को seed करें, exec के बाद वापस sync करें; local workspace canonical रहता है
- `remote`: sandbox बनने पर remote को एक बार seed करें, फिर remote workspace को canonical रखें

`remote` मोड में, OpenClaw के बाहर किए गए host-local edits seed step के बाद sandbox में अपने-आप sync नहीं होते।
Transport OpenShell sandbox में SSH है, लेकिन sandbox lifecycle और वैकल्पिक mirror sync का स्वामित्व plugin के पास है।

**`setupCommand`** container creation के बाद एक बार चलता है (`sh -lc` के ज़रिए)। Network egress, writable root, root user चाहिए।

**Containers default रूप से `network: "none"` होते हैं** — अगर agent को outbound access चाहिए, तो इसे `"bridge"` (या custom bridge network) पर set करें।
`"host"` blocked है। `"container:<id>"` default रूप से blocked है, जब तक आप स्पष्ट रूप से
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) set नहीं करते।
सक्रिय OpenClaw sandbox में Codex app-server turns अपने native code-mode network access के लिए यही egress setting इस्तेमाल करते हैं।

**Inbound attachments** सक्रिय workspace में `media/inbound/*` में staged किए जाते हैं।

**`docker.binds`** अतिरिक्त host directories mount करता है; global और per-agent binds merge किए जाते हैं।

**Sandboxed browser** (`sandbox.browser.enabled`): container में Chromium + CDP। noVNC URL system prompt में inject किया जाता है। `openclaw.json` में `browser.enabled` की जरूरत नहीं है।
noVNC observer access default रूप से VNC auth इस्तेमाल करता है और OpenClaw shared URL में password expose करने के बजाय short-lived token URL emit करता है।

- `allowHostControl: false` (default) sandboxed sessions को host browser target करने से रोकता है।
- `network` default रूप से `openclaw-sandbox-browser` (dedicated bridge network) होता है। इसे `bridge` पर तभी set करें जब आप स्पष्ट रूप से global bridge connectivity चाहते हों।
- `cdpSourceRange` वैकल्पिक रूप से container edge पर CDP ingress को CIDR range तक सीमित करता है (उदाहरण के लिए `172.21.0.1/32`)।
- `sandbox.browser.binds` अतिरिक्त host directories को केवल sandbox browser container में mount करता है। Set होने पर (`[]` सहित), यह browser container के लिए `docker.binds` को replace करता है।
- Launch defaults `scripts/sandbox-browser-entrypoint.sh` में defined हैं और container hosts के लिए tuned हैं:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (default enabled)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, और `--disable-gpu`
    default रूप से enabled हैं और WebGL/3D usage को इसकी जरूरत होने पर
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` से disabled किए जा सकते हैं।
  - अगर आपका workflow extensions पर निर्भर करता है, तो `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    extensions को फिर से enable करता है।
  - `--renderer-process-limit=2` को
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` से बदला जा सकता है; Chromium की
    default process limit इस्तेमाल करने के लिए `0` set करें।
  - साथ में `--no-sandbox`, जब `noSandbox` enabled हो।
  - Defaults container image baseline हैं; container defaults बदलने के लिए custom
    entrypoint वाली custom browser image इस्तेमाल करें।

</Accordion>

Browser sandboxing और `sandbox.docker.binds` केवल Docker के लिए हैं।

Images build करें (source checkout से):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Source checkout के बिना npm installs के लिए, inline `docker build` commands हेतु [Sandboxing § Images and setup](/hi/gateway/sandboxing#images-and-setup) देखें।

### `agents.list` (per-agent overrides)

Agent को अपना TTS provider, voice, model,
style, या auto-TTS mode देने के लिए `agents.list[].tts` इस्तेमाल करें। Agent block global
`messages.tts` पर deep-merge होता है, इसलिए shared credentials एक जगह रह सकते हैं जबकि individual
agents केवल अपनी जरूरत के voice या provider fields override करते हैं। Active agent का
override automatic spoken replies, `/tts audio`, `/tts status`, और
`tts` agent tool पर apply होता है। Provider examples और precedence के लिए [Text-to-speech](/hi/tools/tts#per-agent-voice-overrides)
देखें।

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stable agent id (required).
- `default`: कई set होने पर, पहला जीतता है (warning logged)। अगर कोई set नहीं है, तो पहली list entry default है।
- `model`: string form बिना model fallback के strict per-agent primary set करता है; object form `{ primary }` भी strict है, जब तक आप `fallbacks` add नहीं करते। उस agent को fallback में opt करने के लिए `{ primary, fallbacks: [...] }` इस्तेमाल करें, या strict behavior explicit करने के लिए `{ primary, fallbacks: [] }`। Cron jobs जो केवल `primary` override करते हैं, वे फिर भी default fallbacks inherit करते हैं जब तक आप `fallbacks: []` set नहीं करते।
- `params`: per-agent stream params `agents.defaults.models` में selected model entry पर merge होते हैं। पूरे model catalog को duplicate किए बिना `cacheRetention`, `temperature`, या `maxTokens` जैसे agent-specific overrides के लिए इसका इस्तेमाल करें।
- `tts`: वैकल्पिक per-agent text-to-speech overrides। Block `messages.tts` पर deep-merge होता है, इसलिए shared provider credentials और fallback policy को `messages.tts` में रखें और यहां केवल provider, voice, model, style, या auto mode जैसे persona-specific values set करें।
- `skills`: वैकल्पिक per-agent skill allowlist। Omit करने पर, agent set होने पर `agents.defaults.skills` inherit करता है; explicit list defaults को merge करने के बजाय replace करती है, और `[]` का अर्थ कोई Skills नहीं है।
- `thinkingDefault`: वैकल्पिक per-agent default thinking level (`off | minimal | low | medium | high | xhigh | adaptive | max`)। जब कोई per-message या session override set नहीं है, तो इस agent के लिए `agents.defaults.thinkingDefault` override करता है। Selected provider/model profile नियंत्रित करता है कि कौन-सी values valid हैं; Google Gemini के लिए, `adaptive` provider-owned dynamic thinking रखता है (Gemini 3/3.1 पर `thinkingLevel` omitted, Gemini 2.5 पर `thinkingBudget: -1`)।
- `reasoningDefault`: वैकल्पिक per-agent default reasoning visibility (`on | off | stream`)। जब कोई per-message या session reasoning override set नहीं है, तो इस agent के लिए `agents.defaults.reasoningDefault` override करता है।
- `fastModeDefault`: fast mode के लिए वैकल्पिक per-agent default (`"auto" | true | false`)। जब कोई per-message या session fast-mode override set नहीं है, तब लागू होता है।
- `models`: वैकल्पिक per-agent model catalog/runtime overrides, full `provider/model` ids से keyed। Per-agent runtime exceptions के लिए `models["provider/model"].agentRuntime` इस्तेमाल करें।
- `runtime`: वैकल्पिक per-agent runtime descriptor। जब agent को default रूप से ACP harness sessions इस्तेमाल करने चाहिए, तो `runtime.acp` defaults (`agent`, `backend`, `mode`, `cwd`) के साथ `type: "acp"` इस्तेमाल करें।
- `identity.avatar`: workspace-relative path, `http(s)` URL, या `data:` URI।
- Local workspace-relative `identity.avatar` image files 2 MB तक सीमित हैं। `http(s)` URLs और `data:` URIs को local file-size limit से check नहीं किया जाता।
- `identity` defaults derive करता है: `emoji` से `ackReaction`, `name`/`emoji` से `mentionPatterns`।
- `subagents.allowAgents`: explicit `sessions_spawn.agentId` targets के लिए configured agent ids की allowlist (`["*"]` = कोई भी configured target; default: वही agent only)। जब self-targeted `agentId` calls allowed होने चाहिए, तो requester id शामिल करें। जिन stale entries का agent config delete हो गया है, उन्हें `sessions_spawn` reject करता है और `agents_list` से omit करता है; उन्हें clean up करने के लिए `openclaw doctor --fix` चलाएं, या अगर वह target defaults inherit करते हुए spawnable रहना चाहिए तो minimal `agents.list[]` entry add करें।
- Sandbox inheritance guard: अगर requester session sandboxed है, तो `sessions_spawn` ऐसे targets reject करता है जो unsandboxed चलेंगे।
- `subagents.requireAgentId`: true होने पर, `agentId` omit करने वाली `sessions_spawn` calls को block करें (explicit profile selection force करता है; default: false)।

---

## Multi-agent routing

एक Gateway के अंदर कई isolated agents चलाएं। [Multi-Agent](/hi/concepts/multi-agent) देखें।

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Binding match fields

- `type` (वैकल्पिक): normal routing के लिए `route` (missing type defaults to route), persistent ACP conversation bindings के लिए `acp`।
- `match.channel` (required)
- `match.accountId` (वैकल्पिक; `*` = कोई भी account; omitted = default account)
- `match.peer` (वैकल्पिक; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (वैकल्पिक; channel-specific)
- `acp` (वैकल्पिक; केवल `type: "acp"` के लिए): `{ mode, label, cwd, backend }`

**Deterministic match order:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, no peer/guild/team)
5. `match.accountId: "*"` (channel-wide)
6. Default agent

हर tier के अंदर, पहली matching `bindings` entry जीतती है।

`type: "acp"` entries के लिए, OpenClaw exact conversation identity (`match.channel` + account + `match.peer.id`) से resolve करता है और ऊपर दिए गए route binding tier order का उपयोग नहीं करता।

### Per-agent access profiles

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="कोई filesystem एक्सेस नहीं (केवल messaging)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

precedence विवरण के लिए [Multi-Agent Sandbox & Tools](/hi/tools/multi-agent-sandbox-tools) देखें।

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field विवरण">

- **`scope`**: group-chat संदर्भों के लिए आधार session grouping रणनीति।
  - `per-sender` (डिफ़ॉल्ट): प्रत्येक sender को channel संदर्भ के भीतर एक अलग session मिलता है।
  - `global`: channel संदर्भ में सभी participants एक ही session साझा करते हैं (केवल तब उपयोग करें जब shared context इरादा हो)।
- **`dmScope`**: DMs को कैसे group किया जाता है।
  - `main`: सभी DMs मुख्य session साझा करते हैं।
  - `per-peer`: channels में sender id के आधार पर अलग करें।
  - `per-channel-peer`: प्रति channel + sender अलग करें (multi-user inboxes के लिए अनुशंसित)।
  - `per-account-channel-peer`: प्रति account + channel + sender अलग करें (multi-account के लिए अनुशंसित)।
- **`identityLinks`**: cross-channel session sharing के लिए canonical ids को provider-prefixed peers से map करें। `/dock_discord` जैसे Dock commands इसी map का उपयोग करके active session के reply route को किसी दूसरे linked channel peer पर switch करते हैं; [Channel docking](/hi/concepts/channel-docking) देखें।
- **`reset`**: प्राथमिक reset policy। `daily`, `atHour` local time पर reset करता है; `idle`, `idleMinutes` के बाद reset करता है। जब दोनों configured हों, जो पहले expire हो वही लागू होता है। Daily reset freshness session row के `sessionStartedAt` का उपयोग करती है; idle reset freshness `lastInteractionAt` का उपयोग करती है। heartbeat, cron wakeups, exec notifications, और gateway bookkeeping जैसे background/system-event writes `updatedAt` को update कर सकते हैं, लेकिन वे daily/idle sessions को fresh नहीं रखते।
- **`resetByType`**: प्रति-type overrides (`direct`, `group`, `thread`)। Legacy `dm` को `direct` के alias के रूप में स्वीकार किया जाता है।
- **`mainKey`**: legacy field। Runtime हमेशा मुख्य direct-chat bucket के लिए `"main"` का उपयोग करता है।
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent exchanges के दौरान agents के बीच अधिकतम reply-back turns (integer, range: `0`-`20`, default: `5`)। `0` ping-pong chaining को disable करता है।
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, legacy `dm` alias के साथ), `keyPrefix`, या `rawKeyPrefix` से match करें। पहला deny जीतता है।
- **`maintenance`**: session-store cleanup + retention controls।
  - `mode`: `enforce` cleanup लागू करता है और default है; `warn` केवल warnings emit करता है।
  - `pruneAfter`: stale entries के लिए age cutoff (default `30d`)।
  - `maxEntries`: `sessions.json` में entries की अधिकतम संख्या (default `500`)। Runtime production-sized caps के लिए छोटे high-water buffer के साथ batch cleanup writes करता है; `openclaw sessions cleanup --enforce` cap को तुरंत लागू करता है।
  - Short-lived gateway model-run probe sessions fixed `24h` retention का उपयोग करते हैं, लेकिन cleanup pressure-gated है: यह stale strict model-run probe rows को केवल तब हटाता है जब session-entry maintenance/cap pressure पहुँचता है। केवल `agent:*:explicit:model-run-<uuid>` से match करने वाली strict explicit probe keys eligible हैं; सामान्य direct, group, thread, cron, hook, heartbeat, ACP, और sub-agent sessions यह 24h retention inherit नहीं करते। जब model-run cleanup चलता है, तो यह व्यापक `pruneAfter` stale-entry cleanup और `maxEntries` cap से पहले चलता है।
  - `rotateBytes`: deprecated और ignored; `openclaw doctor --fix` इसे पुराने configs से हटाता है।
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archives के लिए retention। Defaults to `pruneAfter`; disable करने के लिए `false` set करें।
  - `maxDiskBytes`: optional sessions-directory disk budget। `warn` mode में यह warnings log करता है; `enforce` mode में यह सबसे पुराने artifacts/sessions पहले हटाता है।
  - `highWaterBytes`: budget cleanup के बाद optional target। Defaults to `maxDiskBytes` का `80%`।
- **`threadBindings`**: thread-bound session features के लिए global defaults।
  - `enabled`: master default switch (providers override कर सकते हैं; Discord `channels.discord.threadBindings.enabled` का उपयोग करता है)
  - `idleHours`: hours में default inactivity auto-unfocus (`0` disables; providers override कर सकते हैं)
  - `maxAgeHours`: hours में default hard max age (`0` disables; providers override कर सकते हैं)
  - `spawnSessions`: `sessions_spawn` और ACP thread spawns से thread-bound work sessions बनाने के लिए default gate। Thread bindings enabled होने पर defaults to `true`; providers/accounts override कर सकते हैं।
  - `defaultSpawnContext`: thread-bound spawns के लिए default native subagent context (`"fork"` या `"isolated"`)। Defaults to `"fork"`।

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Response prefix

Per-channel/account overrides: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolution (सबसे specific जीतता है): account → channel → global। `""` disable करता है और cascade रोकता है। `"auto"` derives `[{identity.name}]`।

**Template variables:**

| Variable          | Description             | Example                     |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | छोटा model name         | `claude-opus-4-6`           |
| `{modelFull}`     | पूरा model identifier   | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider name           | `anthropic`                 |
| `{thinkingLevel}` | वर्तमान thinking level  | `high`, `low`, `off`        |
| `{identity.name}` | Agent identity name     | (`"auto"` जैसा ही)          |

Variables case-insensitive हैं। `{think}` `{thinkingLevel}` का alias है।

### Ack reaction

- Defaults to active agent का `identity.emoji`, अन्यथा `"👀"`। Disable करने के लिए `""` set करें।
- Per-channel overrides: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolution order: account → channel → `messages.ackReaction` → identity fallback.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp, और iMessage जैसे reaction-capable channels पर reply के बाद ack हटाता है।
- `messages.statusReactions.enabled`: Slack, Discord, Telegram, और WhatsApp पर lifecycle status reactions enable करता है।
  Slack और Discord पर, unset status reactions को तब enabled रखता है जब ack reactions active हों।
  Telegram और WhatsApp पर, lifecycle status reactions enable करने के लिए इसे स्पष्ट रूप से `true` set करें।
- `messages.statusReactions.emojis`: lifecycle emoji keys override करता है:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, और `stallHard`।
  Telegram केवल fixed reaction set allow करता है, इसलिए unsupported configured emoji उस chat के लिए
  निकटतम supported status variant पर fall back करते हैं।

### Inbound debounce

एक ही sender से आने वाले तेज़ text-only messages को एक single agent turn में batch करता है। Media/attachments तुरंत flush होते हैं। Control commands debouncing bypass करते हैं।

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` डिफ़ॉल्ट auto-TTS मोड नियंत्रित करता है: `off`, `always`, `inbound`, या `tagged`। `/tts on|off` स्थानीय प्राथमिकताओं को ओवरराइड कर सकता है, और `/tts status` प्रभावी स्थिति दिखाता है।
- `summaryModel` auto-summary के लिए `agents.defaults.model.primary` को ओवरराइड करता है।
- `modelOverrides` डिफ़ॉल्ट रूप से सक्षम है; `modelOverrides.allowProvider` का डिफ़ॉल्ट `false` है (opt-in)।
- API कुंजियाँ `ELEVENLABS_API_KEY`/`XI_API_KEY` और `OPENAI_API_KEY` पर फ़ॉलबैक करती हैं।
- बंडल किए गए speech provider Plugin-स्वामित्व वाले हैं। यदि `plugins.allow` सेट है, तो हर वह TTS provider Plugin शामिल करें जिसे आप उपयोग करना चाहते हैं, उदाहरण के लिए Edge TTS के लिए `microsoft`। पुराने `edge` provider id को `microsoft` के alias के रूप में स्वीकार किया जाता है।
- `providers.openai.baseUrl` OpenAI TTS endpoint को ओवरराइड करता है। समाधान क्रम config, फिर `OPENAI_TTS_BASE_URL`, फिर `https://api.openai.com/v1` है।
- जब `providers.openai.baseUrl` किसी non-OpenAI endpoint की ओर इशारा करता है, OpenClaw उसे OpenAI-संगत TTS server मानता है और model/voice validation को ढीला करता है।

---

## Talk

Talk मोड (macOS/iOS/Android) के लिए डिफ़ॉल्ट।

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- जब कई Talk provider कॉन्फ़िगर किए गए हों, तो `talk.provider` को `talk.providers` में किसी कुंजी से मेल खाना चाहिए।
- पुराने flat Talk keys (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) केवल compatibility के लिए हैं। persisted config को `talk.providers.<provider>` में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ।
- Voice IDs `ELEVENLABS_VOICE_ID` या `SAG_VOICE_ID` पर फ़ॉलबैक करते हैं।
- `providers.*.apiKey` plaintext strings या SecretRef objects स्वीकार करता है।
- `ELEVENLABS_API_KEY` fallback केवल तब लागू होता है जब कोई Talk API key कॉन्फ़िगर नहीं की गई हो।
- `providers.*.voiceAliases` Talk directives को दोस्ताना नाम उपयोग करने देता है।
- `providers.mlx.modelId` macOS local MLX helper द्वारा उपयोग किया जाने वाला Hugging Face repo चुनता है। यदि छोड़ा गया हो, तो macOS `mlx-community/Soprano-80M-bf16` का उपयोग करता है।
- macOS MLX playback मौजूद होने पर बंडल किए गए `openclaw-mlx-tts` helper के माध्यम से चलता है, या `PATH` पर किसी executable के माध्यम से; `OPENCLAW_MLX_TTS_BIN` development के लिए helper path को ओवरराइड करता है।
- `consultThinkingLevel` Control UI Talk realtime `openclaw_agent_consult` calls के पीछे पूरे OpenClaw agent run के लिए thinking level नियंत्रित करता है। सामान्य session/model behavior बनाए रखने के लिए unset छोड़ें।
- `consultFastMode` session की सामान्य fast-mode setting बदले बिना Control UI Talk realtime consults के लिए one-shot fast-mode override सेट करता है।
- `speechLocale` iOS/macOS Talk speech recognition द्वारा उपयोग की जाने वाली BCP 47 locale id सेट करता है। device default का उपयोग करने के लिए unset छोड़ें।
- `silenceTimeoutMs` नियंत्रित करता है कि user silence के बाद transcript भेजने से पहले Talk mode कितनी देर प्रतीक्षा करे। Unset platform default pause window (`700 ms on macOS and Android, 900 ms on iOS`) बनाए रखता है।
- `realtime.instructions` OpenClaw के built-in realtime prompt में provider-facing system instructions जोड़ता है, ताकि default `openclaw_agent_consult` guidance खोए बिना voice style कॉन्फ़िगर की जा सके।
- `realtime.consultRouting` Gateway relay fallback नियंत्रित करता है जब realtime provider `openclaw_agent_consult` के बिना final user transcript उत्पन्न करता है: `provider-direct` direct provider replies को सुरक्षित रखता है, जबकि `force-agent-consult` finalized request को OpenClaw के माध्यम से route करता है।

---

## संबंधित

- [Configuration reference](/hi/gateway/configuration-reference) — बाकी सभी config keys
- [Configuration](/hi/gateway/configuration) — सामान्य tasks और quick setup
- [Configuration examples](/hi/gateway/configuration-examples)
