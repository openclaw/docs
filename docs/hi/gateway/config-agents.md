---
read_when:
    - एजेंट डिफ़ॉल्ट्स को ट्यून करना (मॉडल, सोच, कार्यक्षेत्र, Heartbeat, मीडिया, Skills)
    - मल्टी-एजेंट रूटिंग और बाइंडिंग्स कॉन्फ़िगर करना
    - सत्र, संदेश वितरण, और टॉक-मोड व्यवहार समायोजित करना
summary: एजेंट डिफ़ॉल्ट, बहु-एजेंट रूटिंग, सत्र, संदेश और talk कॉन्फ़िगरेशन
title: कॉन्फ़िगरेशन — एजेंट
x-i18n:
    generated_at: "2026-07-03T13:32:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, और `talk.*` के अंतर्गत एजेंट-स्कोप्ड कॉन्फ़िगरेशन कुंजियां। चैनल, टूल, gateway runtime, और अन्य
टॉप-लेवल कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## एजेंट डिफ़ॉल्ट

### `agents.defaults.workspace`

डिफ़ॉल्ट: सेट होने पर `OPENCLAW_WORKSPACE_DIR`, अन्यथा `~/.openclaw/workspace`।

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

स्पष्ट `agents.defaults.workspace` मान `OPENCLAW_WORKSPACE_DIR` से प्राथमिकता लेता है। जब आप उस पथ को config में नहीं लिखना चाहते, तब डिफ़ॉल्ट एजेंटों को माउंट किए गए workspace की ओर इंगित करने के लिए environment variable का उपयोग करें।

### `agents.defaults.repoRoot`

सिस्टम prompt की Runtime पंक्ति में दिखाया जाने वाला वैकल्पिक repository root। यदि सेट नहीं है, तो OpenClaw workspace से ऊपर की ओर चलते हुए अपने-आप पता लगाता है।

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
- कोई skills नहीं रखने के लिए `agents.list[].skills: []` सेट करें।
- गैर-खाली `agents.list[].skills` सूची उस एजेंट के लिए अंतिम सेट है; यह
  डिफ़ॉल्ट के साथ merge नहीं होती।

### `agents.defaults.skipBootstrap`

workspace bootstrap फ़ाइलों (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) की स्वचालित रचना अक्षम करता है।

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

आवश्यक bootstrap फ़ाइलें लिखते हुए भी चुनी गई वैकल्पिक workspace फ़ाइलों की रचना छोड़ता है। मान्य मान: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, और `IDENTITY.md`।

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

- `"continuation-skip"`: सुरक्षित continuation turns (पूरी हो चुकी assistant response के बाद) workspace bootstrap re-injection छोड़ देते हैं, जिससे prompt आकार घटता है। Heartbeat runs और post-compaction retries फिर भी context दोबारा बनाते हैं।
- `"never"`: हर turn पर workspace bootstrap और context-file injection अक्षम करें। इसका उपयोग केवल उन agents के लिए करें जो अपनी prompt lifecycle पूरी तरह स्वयं संभालते हैं (custom context engines, native runtimes जो अपना context स्वयं बनाते हैं, या specialized bootstrap-free workflows)। Heartbeat और compaction-recovery turns भी injection छोड़ देते हैं।

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

प्रति-एजेंट override: `agents.list[].contextInjection`। छोड़े गए मान
`agents.defaults.contextInjection` विरासत में लेते हैं।

### `agents.defaults.bootstrapMaxChars`

truncation से पहले प्रति workspace bootstrap फ़ाइल अधिकतम अक्षर। डिफ़ॉल्ट: `20000`।

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

प्रति-एजेंट override: `agents.list[].bootstrapMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapMaxChars` विरासत में लेते हैं।

### `agents.defaults.bootstrapTotalMaxChars`

सभी workspace bootstrap फ़ाइलों में inject किए गए कुल अधिकतम अक्षर। डिफ़ॉल्ट: `60000`।

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

प्रति-एजेंट override: `agents.list[].bootstrapTotalMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapTotalMaxChars` विरासत में लेते हैं।

### प्रति-एजेंट bootstrap profile overrides

जब किसी एक एजेंट को साझा डिफ़ॉल्ट से अलग prompt injection behavior चाहिए, तब प्रति-एजेंट bootstrap profile overrides का उपयोग करें। छोड़ी गई fields
`agents.defaults` से विरासत में मिलती हैं।

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

bootstrap context truncate होने पर agent-visible system-prompt notice नियंत्रित करता है।
डिफ़ॉल्ट: `"always"`।

- `"off"`: system prompt में truncation notice text कभी inject न करें।
- `"once"`: प्रत्येक unique truncation signature के लिए एक बार संक्षिप्त notice inject करें।
- `"always"`: truncation मौजूद होने पर हर run पर संक्षिप्त notice inject करें (अनुशंसित)।

विस्तृत raw/injected counts और config tuning fields diagnostics जैसे
context/status reports और logs में रहते हैं; routine WebChat user/runtime context को केवल संक्षिप्त recovery notice मिलता है।

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Context budget ownership map

OpenClaw में कई high-volume prompt/context budgets हैं, और उन्हें
जानबूझकर subsystem के आधार पर विभाजित किया गया है, बजाय इसके कि सब एक generic
knob से गुजरें।

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  सामान्य workspace bootstrap injection।
- `agents.defaults.startupContext.*`:
  one-shot reset/startup model-run prelude, जिसमें हाल की दैनिक
  `memory/*.md` फ़ाइलें शामिल हैं। Bare chat `/new` और `/reset` commands
  model invoke किए बिना acknowledge किए जाते हैं।
- `skills.limits.*`:
  system prompt में inject की गई compact skills सूची।
- `agents.defaults.contextLimits.*`:
  bounded runtime excerpts और injected runtime-owned blocks।
- `memory.qmd.limits.*`:
  indexed memory-search snippet और injection sizing।

matching प्रति-एजेंट override का उपयोग केवल तब करें जब किसी एक एजेंट को अलग
budget चाहिए:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

reset/startup model runs पर inject किए जाने वाले first-turn startup prelude को नियंत्रित करता है।
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

- `memoryGetMaxChars`: truncation metadata और continuation notice जोड़े जाने से पहले डिफ़ॉल्ट `memory_get` excerpt cap।
- `memoryGetDefaultLines`: जब `lines` छोड़ा जाता है, तब डिफ़ॉल्ट `memory_get` line window।
- `toolResultMaxChars`: persisted results और overflow recovery के लिए उपयोग की जाने वाली advanced live tool-result ceiling। model-context auto cap के लिए unset छोड़ें:
  100K tokens से नीचे `16000` chars, 100K+ tokens पर `32000` chars, और 200K+ tokens पर `64000`
  chars। long-context models के लिए `1000000` तक के स्पष्ट मान स्वीकार किए जाते हैं, लेकिन effective cap फिर भी model context window के लगभग 30% तक सीमित रहता है। `openclaw doctor --deep` effective cap print करता है,
  और doctor केवल तब warn करता है जब explicit override stale हो या उसका कोई प्रभाव न हो।
- `postCompactionMaxChars`: post-compaction refresh injection के दौरान उपयोग किया जाने वाला AGENTS.md excerpt cap।

#### `agents.list[].contextLimits`

साझा `contextLimits` knobs के लिए प्रति-एजेंट override। छोड़ी गई fields
`agents.defaults.contextLimits` से विरासत में मिलती हैं।

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

system prompt में inject की गई compact skills सूची के लिए global cap। यह
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

provider calls से पहले transcript/tool image blocks में सबसे लंबी image side के लिए अधिकतम pixel size।
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

OpenClaw selected image model के अनुसार resize ladder अनुकूलित करता है। उदाहरण के लिए, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL, और hosted Llama 4 vision models older/default high-detail vision paths की तुलना में बड़ी images उपयोग कर सकते हैं, जबकि multi-image turns को token और latency cost नियंत्रित करने के लिए `auto` mode में अधिक आक्रामक रूप से compress किया जाता है।

मान:

- `auto`: model limits और image count के अनुसार अनुकूलित करें।
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
  - ऑब्जेक्ट रूप प्राथमिक के साथ क्रमबद्ध फेलओवर मॉडल सेट करता है।
- `imageModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - `image` टूल पथ द्वारा इसके विज़न-मॉडल कॉन्फ़िग के रूप में उपयोग किया जाता है।
  - जब चुना गया/डिफ़ॉल्ट मॉडल छवि इनपुट स्वीकार नहीं कर सकता, तब फॉलबैक रूटिंग के रूप में भी उपयोग किया जाता है।
  - स्पष्ट `provider/model` रेफ़रेंस को प्राथमिकता दें। संगतता के लिए बेयर ID स्वीकार किए जाते हैं; यदि कोई बेयर ID `models.providers.*.models` में कॉन्फ़िगर की गई छवि-सक्षम प्रविष्टि से विशिष्ट रूप से मेल खाता है, तो OpenClaw उसे उस प्रदाता से क्वालिफ़ाई करता है। अस्पष्ट कॉन्फ़िगर किए गए मेल के लिए स्पष्ट प्रदाता प्रीफ़िक्स आवश्यक है।
- `imageGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा छवि-जेनरेशन क्षमता और छवियां जनरेट करने वाले किसी भी भविष्य के टूल/Plugin सतह द्वारा उपयोग किया जाता है।
  - सामान्य मान: नेटिव Gemini छवि जेनरेशन के लिए `google/gemini-3.1-flash-image-preview`, fal के लिए `fal/fal-ai/flux/dev`, OpenAI Images के लिए `openai/gpt-image-2`, या पारदर्शी-पृष्ठभूमि OpenAI PNG/WebP आउटपुट के लिए `openai/gpt-image-1.5`।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो मेल खाता प्रदाता प्रमाणीकरण भी कॉन्फ़िगर करें (उदाहरण के लिए `google/*` के लिए `GEMINI_API_KEY` या `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` के लिए `OPENAI_API_KEY` या OpenAI Codex OAuth, `fal/*` के लिए `FAL_KEY`)।
  - यदि छोड़ा गया है, तो `image_generate` फिर भी प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट अनुमानित कर सकता है। यह पहले मौजूदा डिफ़ॉल्ट प्रदाता आज़माता है, फिर प्रदाता-id क्रम में बाकी पंजीकृत छवि-जेनरेशन प्रदाताओं को।
- `musicGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा संगीत-जेनरेशन क्षमता और अंतर्निहित `music_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, या `minimax/music-2.6`।
  - यदि छोड़ा गया है, तो `music_generate` फिर भी प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट अनुमानित कर सकता है। यह पहले मौजूदा डिफ़ॉल्ट प्रदाता आज़माता है, फिर प्रदाता-id क्रम में बाकी पंजीकृत संगीत-जेनरेशन प्रदाताओं को।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो मेल खाता प्रदाता प्रमाणीकरण/API कुंजी भी कॉन्फ़िगर करें।
- `videoGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा वीडियो-जेनरेशन क्षमता और अंतर्निहित `video_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, या `qwen/wan2.7-r2v`।
  - यदि छोड़ा गया है, तो `video_generate` फिर भी प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट अनुमानित कर सकता है। यह पहले मौजूदा डिफ़ॉल्ट प्रदाता आज़माता है, फिर प्रदाता-id क्रम में बाकी पंजीकृत वीडियो-जेनरेशन प्रदाताओं को।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो मेल खाता प्रदाता प्रमाणीकरण/API कुंजी भी कॉन्फ़िगर करें।
  - आधिकारिक Qwen वीडियो-जेनरेशन Plugin अधिकतम 1 आउटपुट वीडियो, 1 इनपुट छवि, 4 इनपुट वीडियो, 10 सेकंड अवधि, और प्रदाता-स्तरीय `size`, `aspectRatio`, `resolution`, `audio`, और `watermark` विकल्पों का समर्थन करता है।
- `pdfModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - मॉडल रूटिंग के लिए `pdf` टूल द्वारा उपयोग किया जाता है।
  - यदि छोड़ा गया है, तो PDF टूल `imageModel` पर, फिर हल किए गए सत्र/डिफ़ॉल्ट मॉडल पर फॉलबैक करता है।
- `pdfMaxBytesMb`: `pdf` टूल के लिए डिफ़ॉल्ट PDF आकार सीमा, जब कॉल समय पर `maxBytesMb` पास नहीं किया जाता।
- `pdfMaxPages`: `pdf` टूल में एक्सट्रैक्शन फॉलबैक मोड द्वारा विचार किए जाने वाले डिफ़ॉल्ट अधिकतम पृष्ठ।
- `verboseDefault`: एजेंटों के लिए डिफ़ॉल्ट वर्बोज़ स्तर। मान: `"off"`, `"on"`, `"full"`। डिफ़ॉल्ट: `"off"`।
- `toolProgressDetail`: `/verbose` टूल सारांशों और प्रगति-ड्राफ़्ट टूल लाइनों के लिए विवरण मोड। मान: `"explain"` (डिफ़ॉल्ट, संक्षिप्त मानव लेबल) या `"raw"` (उपलब्ध होने पर कच्चा कमांड/विवरण जोड़ें)। प्रति-एजेंट `agents.list[].toolProgressDetail` इस डिफ़ॉल्ट को ओवरराइड करता है।
- `reasoningDefault`: एजेंटों के लिए डिफ़ॉल्ट रीज़निंग दृश्यता। मान: `"off"`, `"on"`, `"stream"`। प्रति-एजेंट `agents.list[].reasoningDefault` इस डिफ़ॉल्ट को ओवरराइड करता है। कॉन्फ़िगर किए गए रीज़निंग डिफ़ॉल्ट केवल मालिकों, अधिकृत प्रेषकों, या ऑपरेटर-एडमिन gateway संदर्भों के लिए लागू किए जाते हैं, जब कोई प्रति-संदेश या सत्र रीज़निंग ओवरराइड सेट नहीं होता।
- `elevatedDefault`: एजेंटों के लिए डिफ़ॉल्ट एलिवेटेड-आउटपुट स्तर। मान: `"off"`, `"on"`, `"ask"`, `"full"`। डिफ़ॉल्ट: `"on"`।
- `model.primary`: प्रारूप `provider/model` (उदा. OpenAI API-key या Codex OAuth एक्सेस के लिए `openai/gpt-5.5`)। यदि आप प्रदाता छोड़ते हैं, तो OpenClaw पहले कोई alias आज़माता है, फिर उस सटीक मॉडल id के लिए विशिष्ट कॉन्फ़िगर-प्रदाता मेल, और केवल उसके बाद कॉन्फ़िगर किए गए डिफ़ॉल्ट प्रदाता पर फॉलबैक करता है (अप्रचलित संगतता व्यवहार, इसलिए स्पष्ट `provider/model` को प्राथमिकता दें)। यदि वह प्रदाता अब कॉन्फ़िगर किए गए डिफ़ॉल्ट मॉडल को उजागर नहीं करता, तो OpenClaw पुराने हटाए गए-प्रदाता डिफ़ॉल्ट को दिखाने के बजाय पहले कॉन्फ़िगर किए गए प्रदाता/मॉडल पर फॉलबैक करता है।
- `models`: `/model` के लिए कॉन्फ़िगर किया गया मॉडल कैटलॉग और allowlist। प्रत्येक प्रविष्टि में `alias` (शॉर्टकट) और `params` (प्रदाता-विशिष्ट, उदाहरण के लिए `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` रूटिंग, `chat_template_kwargs`, `extra_body`/`extraBody`) शामिल हो सकते हैं।
  - हर मॉडल id को मैन्युअल रूप से सूचीबद्ध किए बिना चुने गए प्रदाताओं के लिए सभी खोजे गए मॉडल दिखाने हेतु `"openai/*": {}` या `"vllm/*": {}` जैसी `provider/*` प्रविष्टियों का उपयोग करें।
  - किसी `provider/*` प्रविष्टि में `agentRuntime` जोड़ें जब उस प्रदाता के हर डायनेमिक रूप से खोजे गए मॉडल को वही रनटाइम उपयोग करना चाहिए। सटीक `provider/model` रनटाइम नीति फिर भी वाइल्डकार्ड पर प्राथमिकता रखती है।
  - सुरक्षित संपादन: प्रविष्टियां जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। `config set` ऐसे प्रतिस्थापन अस्वीकार करता है जो मौजूदा allowlist प्रविष्टियां हटा देंगे, जब तक आप `--replace` पास नहीं करते।
  - प्रदाता-स्कोप किए गए configure/onboarding फ़्लो चयनित प्रदाता मॉडलों को इस मैप में मर्ज करते हैं और पहले से कॉन्फ़िगर किए गए असंबंधित प्रदाताओं को सुरक्षित रखते हैं।
  - सीधे OpenAI Responses मॉडलों के लिए, सर्वर-साइड Compaction स्वचालित रूप से सक्षम होती है। `context_management` इंजेक्ट करना रोकने के लिए `params.responsesServerCompaction: false` का उपयोग करें, या थ्रेशहोल्ड ओवरराइड करने के लिए `params.responsesCompactThreshold`। देखें [OpenAI सर्वर-साइड compaction](/hi/providers/openai#server-side-compaction-responses-api)।
- `params`: सभी मॉडलों पर लागू वैश्विक डिफ़ॉल्ट प्रदाता पैरामीटर। `agents.defaults.params` पर सेट करें (उदा. `{ cacheRetention: "long" }`)।
- `params` मर्ज प्राथमिकता (कॉन्फ़िग): `agents.defaults.params` (वैश्विक आधार) को `agents.defaults.models["provider/model"].params` (प्रति-मॉडल) ओवरराइड करता है, फिर `agents.list[].params` (मेल खाता एजेंट id) कुंजी के अनुसार ओवरराइड करता है। विवरण के लिए [Prompt Caching](/hi/reference/prompt-caching) देखें।
- `models.providers.openrouter.params.provider`: OpenRouter-व्यापी डिफ़ॉल्ट प्रदाता-रूटिंग नीति। OpenClaw इसे OpenRouter के अनुरोध `provider` ऑब्जेक्ट को फ़ॉरवर्ड करता है; प्रति-मॉडल `agents.defaults.models["openrouter/<model>"].params.provider` और एजेंट params कुंजी के अनुसार ओवरराइड करते हैं। देखें [OpenRouter प्रदाता रूटिंग](/hi/providers/openrouter#advanced-configuration)।
- `params.extra_body`/`params.extraBody`: OpenAI-संगत प्रॉक्सी के लिए `api: "openai-completions"` अनुरोध बॉडी में मर्ज किया गया उन्नत पास-थ्रू JSON। यदि यह जनरेट की गई अनुरोध कुंजियों से टकराता है, तो अतिरिक्त बॉडी प्राथमिकता रखती है; गैर-नेटिव completions रूट इसके बाद भी OpenAI-केवल `store` को हटा देते हैं।
- `params.chat_template_kwargs`: vLLM/OpenAI-संगत चैट-टेम्पलेट आर्ग्युमेंट, जो शीर्ष-स्तरीय `api: "openai-completions"` अनुरोध बॉडी में मर्ज किए जाते हैं। thinking बंद होने पर `vllm/nemotron-3-*` के लिए, बंडल किया गया vLLM Plugin स्वचालित रूप से `enable_thinking: false` और `force_nonempty_content: true` भेजता है; स्पष्ट `chat_template_kwargs` जनरेट किए गए डिफ़ॉल्ट को ओवरराइड करते हैं, और `extra_body.chat_template_kwargs` फिर भी अंतिम प्राथमिकता रखता है। कॉन्फ़िगर किए गए vLLM Qwen और Nemotron thinking मॉडल बहु-स्तरीय effort ladder के बजाय बाइनरी `/think` विकल्प (`off`, `on`) उजागर करते हैं।
- `compat.thinkingFormat`: OpenAI-संगत thinking payload शैली। Together-शैली `reasoning.enabled` के लिए `"together"`, Qwen-शैली शीर्ष-स्तरीय `enable_thinking` के लिए `"qwen"`, या vLLM जैसे request-level chat-template kwargs का समर्थन करने वाले Qwen-family बैकएंड पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` का उपयोग करें। OpenClaw अक्षम thinking को `false` और सक्षम thinking को `true` में मैप करता है, और कॉन्फ़िगर किए गए vLLM Qwen मॉडल इन फ़ॉर्मैट के लिए बाइनरी `/think` विकल्प उजागर करते हैं।
- `compat.supportedReasoningEfforts`: प्रति-मॉडल OpenAI-संगत रीज़निंग effort सूची। कस्टम endpoints के लिए `"xhigh"` शामिल करें जो वास्तव में इसे स्वीकार करते हैं; इसके बाद OpenClaw उस कॉन्फ़िगर किए गए प्रदाता/मॉडल के लिए कमांड मेनू, Gateway सत्र पंक्तियों, सत्र पैच validation, एजेंट CLI validation, और `llm-task` validation में `/think xhigh` उजागर करता है। जब बैकएंड किसी canonical स्तर के लिए प्रदाता-विशिष्ट मान चाहता है, तो `compat.reasoningEffortMap` का उपयोग करें।
- `params.preserveThinking`: संरक्षित thinking के लिए Z.AI-केवल opt-in। सक्षम होने और thinking ऑन होने पर, OpenClaw `thinking.clear_thinking: false` भेजता है और पूर्व `reasoning_content` को replay करता है; देखें [Z.AI thinking और संरक्षित thinking](/hi/providers/zai#thinking-and-preserved-thinking)।
- `localService`: स्थानीय/स्वयं-होस्ट किए गए मॉडल सर्वरों के लिए वैकल्पिक प्रदाता-स्तरीय process manager। जब चयनित मॉडल उस प्रदाता से संबंधित होता है, OpenClaw `healthUrl` (या `baseUrl + "/models"`) probe करता है, endpoint डाउन होने पर `args` के साथ `command` शुरू करता है, `readyTimeoutMs` तक प्रतीक्षा करता है, फिर मॉडल अनुरोध भेजता है। `command` एक absolute path होना चाहिए। `idleStopMs: 0` प्रक्रिया को OpenClaw के बाहर निकलने तक जीवित रखता है; सकारात्मक मान उतने idle milliseconds के बाद OpenClaw-spawned प्रक्रिया को रोकता है। देखें [स्थानीय मॉडल सेवाएं](/hi/gateway/local-model-services)।
- रनटाइम नीति प्रदाताओं या मॉडलों पर होती है, `agents.defaults` पर नहीं। प्रदाता-व्यापी नियमों के लिए `models.providers.<provider>.agentRuntime` या मॉडल-विशिष्ट नियमों के लिए `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` का उपयोग करें। आधिकारिक OpenAI प्रदाता पर OpenAI एजेंट मॉडल डिफ़ॉल्ट रूप से Codex चुनते हैं।
- इन फ़ील्ड को बदलने वाले कॉन्फ़िग लेखक (उदाहरण के लिए `/models set`, `/models set-image`, और fallback add/remove commands) canonical object form सहेजते हैं और संभव होने पर मौजूदा fallback सूचियों को सुरक्षित रखते हैं।
- `maxConcurrent`: सत्रों में अधिकतम समानांतर एजेंट रन (प्रत्येक सत्र फिर भी serialized रहता है)। डिफ़ॉल्ट: 4।

### रनटाइम नीति

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

- `id`: `"auto"`, `"openclaw"`, कोई पंजीकृत plugin harness id, या समर्थित CLI backend alias। Bundled Codex plugin `codex` पंजीकृत करता है; bundled Anthropic plugin `claude-cli` CLI backend प्रदान करता है।
- `id: "auto"` पंजीकृत plugin harnesses को समर्थित turns claim करने देता है और कोई harness match न होने पर OpenClaw का उपयोग करता है। `id: "codex"` जैसा explicit plugin runtime उस harness की आवश्यकता रखता है और यदि वह अनुपलब्ध हो या विफल हो जाए तो fail closed करता है।
- `id: "pi"` केवल `openclaw` के deprecated alias के रूप में स्वीकार किया जाता है, ताकि v2026.5.22 और उससे पहले के shipped configs सुरक्षित रहें। नई config में `openclaw` का उपयोग करना चाहिए।
- Runtime precedence पहले exact model policy है (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, या `models.providers.<provider>.models[]`), फिर `agents.list[]` / `agents.defaults.models["provider/*"]`, फिर `models.providers.<provider>.agentRuntime` पर provider-wide policy।
- Whole-agent runtime keys legacy हैं। `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins, और `OPENCLAW_AGENT_RUNTIME` को runtime selection अनदेखा करता है। Stale values हटाने के लिए `openclaw doctor --fix` चलाएँ।
- OpenAI agent models default रूप से Codex harness का उपयोग करते हैं; provider/model `agentRuntime.id: "codex"` तब भी मान्य रहता है जब आप इसे explicit बनाना चाहते हों।
- Claude CLI deployments के लिए, `model: "anthropic/claude-opus-4-8"` के साथ model-scoped `agentRuntime.id: "claude-cli"` को प्राथमिकता दें। Legacy `claude-cli/claude-opus-4-7` model refs compatibility के लिए अभी भी काम करते हैं, लेकिन नई config में provider/model selection canonical रखना चाहिए और execution backend को provider/model runtime policy में रखना चाहिए।
- यह केवल text agent-turn execution को नियंत्रित करता है। Media generation, vision, PDF, music, video, और TTS अब भी अपने provider/model settings का उपयोग करते हैं।

**Built-in alias shorthands** (केवल तब लागू होते हैं जब model `agents.defaults.models` में हो):

| उपनाम               | मॉडल                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

आपके configured aliases हमेशा defaults से ऊपर रहते हैं।

Z.AI GLM-4.x models अपने-आप thinking mode सक्षम करते हैं, जब तक आप `--thinking off` सेट न करें या `agents.defaults.models["zai/<model>"].params.thinking` स्वयं define न करें।
Z.AI models tool call streaming के लिए default रूप से `tool_stream` सक्षम करते हैं। इसे disable करने के लिए `agents.defaults.models["zai/<model>"].params.tool_stream` को `false` पर सेट करें।
Anthropic Claude Opus 4.8 OpenClaw में default रूप से thinking off रखता है; जब adaptive thinking explicit रूप से enabled हो, तो Anthropic का provider-owned effort default `high` होता है। Claude 4.6 models में कोई explicit thinking level सेट न होने पर default `adaptive` होता है।

### `agents.defaults.cliBackends`

Text-only fallback runs के लिए optional CLI backends (कोई tool calls नहीं)। API providers विफल होने पर backup के रूप में उपयोगी।

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

- CLI backends text-first होते हैं; tools हमेशा disabled रहते हैं।
- Sessions तब समर्थित होते हैं जब `sessionArg` सेट हो।
- Image pass-through तब समर्थित होता है जब `imageArg` file paths स्वीकार करता हो।
- `reseedFromRawTranscriptWhenUncompacted: true` किसी backend को पहले compaction summary के मौजूद होने से पहले bounded raw OpenClaw transcript tail से safe invalidated sessions recover करने देता है। Auth profile या credential-epoch changes फिर भी कभी raw-reseed नहीं करते।

### `agents.defaults.promptOverlays`

OpenClaw-assembled prompt surfaces पर model family के अनुसार applied provider-independent prompt overlays। GPT-5-family model ids को OpenClaw/provider routes में shared behavior contract मिलता है; `personality` केवल friendly interaction-style layer को नियंत्रित करता है। Native Codex app-server routes इस OpenClaw GPT-5 overlay के बजाय Codex-owned base/model instructions रखते हैं, और OpenClaw native threads के लिए Codex की built-in personality disable करता है।

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

- `"friendly"` (default) और `"on"` friendly interaction-style layer को enable करते हैं।
- `"off"` केवल friendly layer को disable करता है; tagged GPT-5 behavior contract enabled रहता है।
- Legacy `plugins.entries.openai.config.personality` तब भी read किया जाता है जब यह shared setting unset हो।

### `agents.defaults.heartbeat`

Periodic Heartbeat runs।

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

- `every`: duration string (ms/s/m/h)। Default: `30m` (API-key auth) या `1h` (OAuth auth)। Disable करने के लिए `0m` पर सेट करें।
- `includeSystemPromptSection`: false होने पर, system prompt से Heartbeat section हटा देता है और bootstrap context में `HEARTBEAT.md` injection skip करता है। Default: `true`।
- `suppressToolErrorWarnings`: true होने पर, heartbeat runs के दौरान tool error warning payloads suppress करता है।
- `timeoutSeconds`: heartbeat agent turn को abort करने से पहले अनुमत अधिकतम समय seconds में। Unset छोड़ें ताकि सेट होने पर `agents.defaults.timeoutSeconds` का उपयोग हो, अन्यथा heartbeat cadence 600 seconds पर capped रहे।
- `directPolicy`: direct/DM delivery policy। `allow` (default) direct-target delivery की अनुमति देता है। `block` direct-target delivery को suppress करता है और `reason=dm-blocked` emit करता है।
- `lightContext`: true होने पर, heartbeat runs lightweight bootstrap context का उपयोग करते हैं और workspace bootstrap files से केवल `HEARTBEAT.md` रखते हैं।
- `isolatedSession`: true होने पर, प्रत्येक heartbeat बिना prior conversation history के fresh session में चलता है। Cron `sessionTarget: "isolated"` जैसा ही isolation pattern। Per-heartbeat token cost को ~100K से ~2-5K tokens तक घटाता है।
- `skipWhenBusy`: true होने पर, heartbeat runs उस agent की extra busy lanes पर defer करते हैं: उसका अपना session-keyed subagent या nested command work। Cron lanes हमेशा heartbeats defer करती हैं, इस flag के बिना भी।
- Per-agent: `agents.list[].heartbeat` सेट करें। जब कोई agent `heartbeat` define करता है, तो **केवल वे agents** heartbeats चलाते हैं।
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

- `mode`: `default` या `safeguard` (लंबे इतिहासों के लिए खंडित सारांशकरण)। [Compaction](/hi/concepts/compaction) देखें।
- `provider`: पंजीकृत Compaction provider Plugin की आईडी। सेट होने पर, अंतर्निहित LLM सारांशकरण के बजाय provider का `summarize()` कॉल किया जाता है। विफलता पर अंतर्निहित पर वापस आ जाता है। provider सेट करने से `mode: "safeguard"` बाध्य होता है। [Compaction](/hi/concepts/compaction) देखें।
- `timeoutSeconds`: किसी एक Compaction कार्रवाई के लिए अनुमत अधिकतम सेकंड, जिसके बाद OpenClaw उसे रोक देता है। डिफ़ॉल्ट: `180`।
- `keepRecentTokens`: सबसे हाल की ट्रांसक्रिप्ट पूंछ को यथावत रखने के लिए एजेंट कट-पॉइंट बजट। मैन्युअल `/compact` इसे तब मानता है जब इसे स्पष्ट रूप से सेट किया गया हो; अन्यथा मैन्युअल Compaction एक कठोर चेकपॉइंट है।
- `identifierPolicy`: `strict` (डिफ़ॉल्ट), `off`, या `custom`। `strict`, Compaction सारांशकरण के दौरान अंतर्निहित अपारदर्शी पहचानकर्ता संरक्षण मार्गदर्शन पहले जोड़ता है।
- `identifierInstructions`: वैकल्पिक कस्टम पहचानकर्ता-संरक्षण पाठ, जिसका उपयोग `identifierPolicy=custom` होने पर किया जाता है।
- `qualityGuard`: safeguard सारांशों के लिए विकृत-आउटपुट पर पुनर्प्रयास जांचें। safeguard मोड में डिफ़ॉल्ट रूप से सक्षम; ऑडिट छोड़ने के लिए `enabled: false` सेट करें।
- `midTurnPrecheck`: वैकल्पिक टूल-लूप दबाव जांच। जब `enabled: true` हो, OpenClaw टूल परिणाम जोड़े जाने के बाद और अगले मॉडल कॉल से पहले संदर्भ दबाव जांचता है। यदि संदर्भ अब फिट नहीं बैठता, तो यह प्रॉम्प्ट सबमिट करने से पहले वर्तमान प्रयास रोक देता है और टूल परिणामों को छोटा करने या compact करके पुनर्प्रयास करने के लिए मौजूदा precheck recovery path का फिर से उपयोग करता है। `default` और `safeguard`, दोनों Compaction मोड के साथ काम करता है। डिफ़ॉल्ट: अक्षम।
- `postCompactionSections`: वैकल्पिक AGENTS.md H2/H3 सेक्शन नाम जिन्हें Compaction के बाद फिर से इंजेक्ट करना है। unset होने पर या `[]` पर सेट होने पर reinjection अक्षम रहता है। स्पष्ट रूप से `["Session Startup", "Red Lines"]` सेट करने से वह जोड़ी सक्षम होती है और legacy `Every Session`/`Safety` fallback संरक्षित रहता है। इसे केवल तब सक्षम करें जब अतिरिक्त संदर्भ, Compaction सारांश में पहले से कैप्चर किए गए प्रोजेक्ट मार्गदर्शन की नकल करने के जोखिम के लायक हो।
- `model`: केवल Compaction सारांशकरण के लिए वैकल्पिक `provider/model-id` या `agents.defaults.models` से bare alias। Bare aliases dispatch से पहले resolve होते हैं; configured literal model IDs collisions पर precedence बनाए रखते हैं। इसका उपयोग तब करें जब मुख्य session को एक मॉडल रखना चाहिए, लेकिन Compaction सारांश दूसरे पर चलने चाहिए; unset होने पर, Compaction session के primary model का उपयोग करता है।
- `maxActiveTranscriptBytes`: वैकल्पिक byte threshold (`number` या `"20mb"` जैसी strings), जो active JSONL threshold से आगे बढ़ने पर run से पहले सामान्य local Compaction trigger करता है। `truncateAfterCompaction` आवश्यक है ताकि सफल Compaction एक छोटे successor transcript पर rotate कर सके। unset या `0` होने पर अक्षम।
- `notifyUser`: जब `true` हो, Compaction शुरू होने और पूरा होने पर user को संक्षिप्त notices भेजता है (उदाहरण के लिए, "Compacting context..." और "Compaction complete")। Compaction को silent रखने के लिए डिफ़ॉल्ट रूप से अक्षम।
- `memoryFlush`: टिकाऊ memories store करने के लिए auto-compaction से पहले silent agentic turn। जब यह housekeeping turn local model पर ही रहना चाहिए, तो `model` को किसी सटीक provider/model, जैसे `ollama/qwen3:8b`, पर सेट करें; override active session fallback chain inherit नहीं करता। workspace read-only होने पर skipped।

### `agents.defaults.runRetries`

विफलता recovery के दौरान infinite execution loops रोकने के लिए embedded agent runtime के outer run loop retry iteration boundaries। ध्यान दें कि यह setting अभी केवल embedded agent runtime पर लागू होती है, ACP या CLI runtimes पर नहीं।

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

- `base`: outer run loop के लिए run retry iterations की आधार संख्या। डिफ़ॉल्ट: `24`।
- `perProfile`: प्रत्येक fallback profile candidate के लिए दिए गए अतिरिक्त run retry iterations। डिफ़ॉल्ट: `8`।
- `min`: run retry iterations के लिए न्यूनतम absolute limit। डिफ़ॉल्ट: `32`।
- `max`: runaway execution रोकने के लिए run retry iterations की अधिकतम absolute limit। डिफ़ॉल्ट: `160`।

### `agents.defaults.contextPruning`

LLM को भेजने से पहले in-memory context से **पुराने टूल परिणामों** को prune करता है। disk पर session history को modify **नहीं** करता।

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
- `ttl` नियंत्रित करता है कि pruning फिर कितनी बार चल सकती है (last cache touch के बाद)।
- Pruning पहले oversized tool results को soft-trim करती है, फिर जरूरत होने पर पुराने tool results को hard-clear करती है।
- `softTrimRatio` और `hardClearRatio` `0.0` से `1.0` तक के values स्वीकार करते हैं; config validation उस range के बाहर के values reject करता है।

**सॉफ्ट-ट्रिम** शुरुआत + अंत रखता है और बीच में `...` inserts करता है।

**हार्ड-क्लियर** पूरे tool result को placeholder से बदल देता है।

नोट्स:

- Image blocks को कभी trim/clear नहीं किया जाता।
- Ratios character-based हैं (approximate), exact token counts नहीं।
- यदि `keepLastAssistants` से कम assistant messages मौजूद हों, तो pruning skipped होती है।

</Accordion>

व्यवहार विवरण के लिए [Session Pruning](/hi/concepts/session-pruning) देखें।

### ब्लॉक स्ट्रीमिंग

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

- Non-Telegram channels में block replies सक्षम करने के लिए explicit `*.blockStreaming: true` आवश्यक है।
- Channel overrides: `channels.<channel>.blockStreamingCoalesce` (और per-account variants)। Signal/Slack/Discord/Google Chat default `minChars: 1500`।
- `humanDelay`: block replies के बीच randomized pause। `natural` = 800-2500ms। Per-agent override: `agents.list[].humanDelay`।

व्यवहार + chunking विवरण के लिए [Streaming](/hi/concepts/streaming) देखें।

### टाइपिंग संकेतक

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

- Defaults: direct chats/mentions के लिए `instant`, unmentioned group chats के लिए `message`।
- Per-session overrides: `session.typingMode`, `session.typingIntervalSeconds`।

[Typing Indicators](/hi/concepts/typing-indicators) देखें।

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

embedded agent के लिए वैकल्पिक sandboxing। पूरी guide के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।

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

- `target`: `user@host[:port]` form में SSH target
- `command`: SSH client command (डिफ़ॉल्ट: `ssh`)
- `workspaceRoot`: per-scope workspaces के लिए उपयोग किया गया absolute remote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH को pass की गई मौजूदा local files
- `identityData` / `certificateData` / `knownHostsData`: inline contents या SecretRefs जिन्हें OpenClaw runtime पर temp files में materialize करता है
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key policy knobs

**SSH auth precedence:**

- `identityData`, `identityFile` पर जीतता है
- `certificateData`, `certificateFile` पर जीतता है
- `knownHostsData`, `knownHostsFile` पर जीतता है
- SecretRef-backed `*Data` values sandbox session शुरू होने से पहले active secrets runtime snapshot से resolved होते हैं

**SSH backend behavior:**

- create या recreate के बाद remote workspace को एक बार seed करता है
- फिर remote SSH workspace को canonical रखता है
- `exec`, file tools, और media paths को SSH के ऊपर route करता है
- remote changes को host पर automatically sync नहीं करता
- sandbox browser containers support नहीं करता

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` के अंतर्गत per-scope sandbox workspace
- `ro`: `/workspace` पर sandbox workspace, `/agent` पर read-only mounted agent workspace
- `rw`: `/workspace` पर read/write mounted agent workspace

**Scope:**

- `session`: per-session container + workspace
- `agent`: प्रति agent एक container + workspace (डिफ़ॉल्ट)
- `shared`: shared container और workspace (कोई cross-session isolation नहीं)

**OpenShell Plugin config:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell मोड:**

- `mirror`: exec से पहले स्थानीय से रिमोट को सीड करें, exec के बाद वापस सिंक करें; स्थानीय कार्यक्षेत्र canonical रहता है
- `remote`: सैंडबॉक्स बनने पर रिमोट को एक बार सीड करें, फिर रिमोट कार्यक्षेत्र को canonical रखें

`remote` मोड में, OpenClaw के बाहर किए गए होस्ट-स्थानीय संपादन सीड चरण के बाद अपने-आप सैंडबॉक्स में सिंक नहीं होते।
परिवहन OpenShell सैंडबॉक्स में SSH है, लेकिन Plugin सैंडबॉक्स lifecycle और वैकल्पिक mirror sync का स्वामी है।

**`setupCommand`** कंटेनर बनने के बाद एक बार चलता है (`sh -lc` के ज़रिए)। इसके लिए नेटवर्क egress, writable root, root user चाहिए।

**कंटेनर डिफ़ॉल्ट रूप से `network: "none"` होते हैं** — अगर एजेंट को outbound access चाहिए, तो इसे `"bridge"` (या custom bridge network) पर सेट करें।
`"host"` अवरुद्ध है। `"container:<id>"` डिफ़ॉल्ट रूप से अवरुद्ध है, जब तक आप स्पष्ट रूप से
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) सेट नहीं करते।
सक्रिय OpenClaw सैंडबॉक्स में Codex app-server turns अपने native code-mode network access के लिए इसी egress setting का उपयोग करते हैं।

**इनबाउंड attachments** सक्रिय कार्यक्षेत्र में `media/inbound/*` में staged होते हैं।

**`docker.binds`** अतिरिक्त host directories mount करता है; global और per-agent binds merge किए जाते हैं।

**सैंडबॉक्स किया गया ब्राउज़र** (`sandbox.browser.enabled`): container में Chromium + CDP। noVNC URL system prompt में inject किया जाता है। `openclaw.json` में `browser.enabled` की आवश्यकता नहीं है।
noVNC observer access डिफ़ॉल्ट रूप से VNC auth का उपयोग करता है और OpenClaw साझा URL में password expose करने के बजाय short-lived token URL emit करता है।

- `allowHostControl: false` (डिफ़ॉल्ट) sandboxed sessions को host browser target करने से रोकता है।
- `network` डिफ़ॉल्ट रूप से `openclaw-sandbox-browser` (dedicated bridge network) है। `bridge` तभी सेट करें जब आप स्पष्ट रूप से global bridge connectivity चाहते हों।
- `cdpSourceRange` वैकल्पिक रूप से container edge पर CDP ingress को CIDR range तक सीमित करता है (उदाहरण के लिए `172.21.0.1/32`)।
- `sandbox.browser.binds` अतिरिक्त host directories को केवल sandbox browser container में mount करता है। सेट होने पर (`[]` सहित), यह browser container के लिए `docker.binds` को replace करता है।
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
  - `--disable-extensions` (डिफ़ॉल्ट enabled)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, और `--disable-gpu`
    डिफ़ॉल्ट रूप से enabled हैं और अगर WebGL/3D usage को इसकी आवश्यकता हो, तो इन्हें
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` से disabled किया जा सकता है।
  - अगर आपका workflow extensions पर निर्भर करता है, तो `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    extensions को फिर से enabled करता है।
  - `--renderer-process-limit=2` को
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` से बदला जा सकता है; Chromium की
    default process limit का उपयोग करने के लिए `0` सेट करें।
  - साथ में `--no-sandbox`, जब `noSandbox` enabled हो।
  - Defaults container image baseline हैं; container defaults बदलने के लिए custom
    entrypoint वाली custom browser image का उपयोग करें।

</Accordion>

Browser sandboxing और `sandbox.docker.binds` केवल Docker के लिए हैं।

Images build करें (source checkout से):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

source checkout के बिना npm installs के लिए, inline `docker build` commands के लिए [Sandboxing § Images and setup](/hi/gateway/sandboxing#images-and-setup) देखें।

### `agents.list` (per-agent overrides)

किसी एजेंट को अपना TTS provider, voice, model,
style, या auto-TTS mode देने के लिए `agents.list[].tts` का उपयोग करें। agent block global
`messages.tts` के ऊपर deep-merge होता है, इसलिए shared credentials एक ही जगह रह सकते हैं जबकि individual
agents केवल अपनी ज़रूरत के voice या provider fields override करते हैं। active agent का
override automatic spoken replies, `/tts audio`, `/tts status`, और
`tts` agent tool पर लागू होता है। provider examples और precedence के लिए [Text-to-speech](/hi/tools/tts#per-agent-voice-overrides)
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

- `id`: stable agent id (required)।
- `default`: जब कई set हों, तो पहला जीतता है (warning logged)। अगर कोई set नहीं है, तो first list entry default है।
- `model`: string form बिना model fallback के strict per-agent primary set करता है; object form `{ primary }` भी strict है, जब तक आप `fallbacks` नहीं जोड़ते। उस agent को fallback में opt करने के लिए `{ primary, fallbacks: [...] }` का उपयोग करें, या strict behavior को explicit बनाने के लिए `{ primary, fallbacks: [] }` का उपयोग करें। Cron jobs जो केवल `primary` override करते हैं, तब भी default fallbacks inherit करते हैं, जब तक आप `fallbacks: []` set नहीं करते।
- `params`: selected model entry के ऊपर per-agent stream params merge किए जाते हैं `agents.defaults.models` में। पूरे model catalog को duplicate किए बिना `cacheRetention`, `temperature`, या `maxTokens` जैसे agent-specific overrides के लिए इसका उपयोग करें।
- `tts`: optional per-agent text-to-speech overrides। block `messages.tts` के ऊपर deep-merge होता है, इसलिए shared provider credentials और fallback policy को `messages.tts` में रखें और यहाँ केवल persona-specific values जैसे provider, voice, model, style, या auto mode set करें।
- `skills`: optional per-agent skill allowlist। अगर omitted है, तो agent `agents.defaults.skills` को inherit करता है जब वह set हो; explicit list defaults को merge करने के बजाय replace करती है, और `[]` का मतलब no skills है।
- `thinkingDefault`: optional per-agent default thinking level (`off | minimal | low | medium | high | xhigh | adaptive | max`)। जब कोई per-message या session override set नहीं है, तो इस agent के लिए `agents.defaults.thinkingDefault` को override करता है। selected provider/model profile control करता है कि कौन से values valid हैं; Google Gemini के लिए, `adaptive` provider-owned dynamic thinking रखता है (Gemini 3/3.1 पर `thinkingLevel` omitted, Gemini 2.5 पर `thinkingBudget: -1`)।
- `reasoningDefault`: optional per-agent default reasoning visibility (`on | off | stream`)। जब कोई per-message या session reasoning override set नहीं है, तो इस agent के लिए `agents.defaults.reasoningDefault` को override करता है।
- `fastModeDefault`: fast mode के लिए optional per-agent default (`"auto" | true | false`)। जब कोई per-message या session fast-mode override set नहीं है, तो लागू होता है।
- `models`: optional per-agent model catalog/runtime overrides, full `provider/model` ids द्वारा keyed। per-agent runtime exceptions के लिए `models["provider/model"].agentRuntime` का उपयोग करें।
- `runtime`: optional per-agent runtime descriptor। जब agent को ACP harness sessions default करने चाहिए, तो `runtime.acp` defaults (`agent`, `backend`, `mode`, `cwd`) के साथ `type: "acp"` का उपयोग करें।
- `identity.avatar`: workspace-relative path, `http(s)` URL, या `data:` URI।
- Local workspace-relative `identity.avatar` image files 2 MB तक सीमित हैं। `http(s)` URLs और `data:` URIs को local file-size limit से checked नहीं किया जाता।
- `identity` defaults derive करता है: `emoji` से `ackReaction`, `name`/`emoji` से `mentionPatterns`।
- `subagents.allowAgents`: explicit `sessions_spawn.agentId` targets के लिए configured agent ids की allowlist (`["*"]` = कोई भी configured target; default: same agent only)। जब self-targeted `agentId` calls allowed होनी चाहिए, तो requester id include करें। stale entries जिनका agent config delete किया गया था, `sessions_spawn` द्वारा rejected होती हैं और `agents_list` से omitted होती हैं; उन्हें clean up करने के लिए `openclaw doctor --fix` चलाएँ, या अगर वह target defaults inherit करते हुए spawnable रहना चाहिए, तो minimal `agents.list[]` entry जोड़ें।
- Sandbox inheritance guard: अगर requester session sandboxed है, तो `sessions_spawn` उन targets को reject करता है जो unsandboxed run करेंगे।
- `subagents.requireAgentId`: true होने पर, `sessions_spawn` calls को block करें जो `agentId` omit करते हैं (explicit profile selection force करता है; default: false)।

---

## Multi-agent routing

एक Gateway के अंदर कई isolated agents चलाएँ। [Multi-Agent](/hi/concepts/multi-agent) देखें।

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

- `type` (optional): normal routing के लिए `route` (missing type defaults to route), persistent ACP conversation bindings के लिए `acp`।
- `match.channel` (required)
- `match.accountId` (optional; `*` = कोई भी account; omitted = default account)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; channel-specific)
- `acp` (optional; केवल `type: "acp"` के लिए): `{ mode, label, cwd, backend }`

**Deterministic match order:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, no peer/guild/team)
5. `match.accountId: "*"` (channel-wide)
6. Default agent

हर tier के भीतर, पहली matching `bindings` entry जीतती है।

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

<Accordion title="फ़ाइल सिस्टम एक्सेस नहीं (केवल मैसेजिंग)">

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

प्राथमिकता विवरण के लिए [Multi-Agent Sandbox & Tools](/hi/tools/multi-agent-sandbox-tools) देखें।

---

## सेशन

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

<Accordion title="सेशन फ़ील्ड विवरण">

- **`scope`**: ग्रुप-चैट संदर्भों के लिए आधार सेशन समूहीकरण रणनीति।
  - `per-sender` (डिफ़ॉल्ट): प्रत्येक प्रेषक को चैनल संदर्भ के भीतर अलग सेशन मिलता है।
  - `global`: चैनल संदर्भ में सभी प्रतिभागी एक ही सेशन साझा करते हैं (केवल तब उपयोग करें जब साझा संदर्भ अपेक्षित हो)।
- **`dmScope`**: DM कैसे समूहित किए जाते हैं।
  - `main`: सभी DM मुख्य सेशन साझा करते हैं।
  - `per-peer`: चैनलों के पार प्रेषक id के आधार पर अलग करें।
  - `per-channel-peer`: प्रति चैनल + प्रेषक अलग करें (बहु-उपयोगकर्ता इनबॉक्स के लिए अनुशंसित)।
  - `per-account-channel-peer`: प्रति अकाउंट + चैनल + प्रेषक अलग करें (बहु-अकाउंट के लिए अनुशंसित)।
- **`identityLinks`**: क्रॉस-चैनल सेशन साझा करने के लिए कैननिकल ids को प्रदाता-प्रीफ़िक्स्ड peers से मैप करें। `/dock_discord` जैसे Dock कमांड सक्रिय सेशन के reply route को दूसरे लिंक किए गए channel peer पर स्विच करने के लिए इसी मैप का उपयोग करते हैं; [Channel docking](/hi/concepts/channel-docking) देखें।
- **`reset`**: प्राथमिक रीसेट नीति। `daily` स्थानीय समय में `atHour` पर रीसेट करता है; `idle` `idleMinutes` के बाद रीसेट करता है। जब दोनों कॉन्फ़िगर हों, जो पहले समाप्त हो वही लागू होता है। दैनिक रीसेट ताज़गी सेशन पंक्ति के `sessionStartedAt` का उपयोग करती है; idle रीसेट ताज़गी `lastInteractionAt` का उपयोग करती है। Heartbeat, Cron wakeups, exec notifications, और Gateway bookkeeping जैसे background/system-event writes `updatedAt` को अपडेट कर सकते हैं, लेकिन वे daily/idle sessions को ताज़ा नहीं रखते।
- **`resetByType`**: प्रति-प्रकार overrides (`direct`, `group`, `thread`)। Legacy `dm` को `direct` के alias के रूप में स्वीकार किया जाता है।
- **`mainKey`**: legacy फ़ील्ड। Runtime मुख्य direct-chat bucket के लिए हमेशा `"main"` का उपयोग करता है।
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent exchanges के दौरान agents के बीच अधिकतम reply-back turns (integer, range: `0`-`20`, default: `5`)। `0` ping-pong chaining को अक्षम करता है।
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, legacy `dm` alias के साथ), `keyPrefix`, या `rawKeyPrefix` से match करें। पहला deny लागू होता है।
- **`maintenance`**: session-store cleanup + retention controls।
  - `mode`: `enforce` cleanup लागू करता है और डिफ़ॉल्ट है; `warn` केवल warnings emit करता है।
  - `pruneAfter`: stale entries के लिए age cutoff (default `30d`)।
  - `maxEntries`: `sessions.json` में entries की अधिकतम संख्या (default `500`)। Runtime production-sized caps के लिए छोटे high-water buffer के साथ batch cleanup लिखता है; `openclaw sessions cleanup --enforce` cap को तुरंत लागू करता है।
  - अल्पकालिक Gateway model-run probe sessions fixed `24h` retention का उपयोग करते हैं, लेकिन cleanup pressure-gated है: यह stale strict model-run probe rows को केवल तब हटाता है जब session-entry maintenance/cap pressure पहुँचता है। केवल `agent:*:explicit:model-run-<uuid>` से match करने वाली strict explicit probe keys पात्र हैं; सामान्य direct, group, thread, Cron, hook, Heartbeat, ACP, और sub-agent sessions यह 24h retention inherit नहीं करते। जब model-run cleanup चलता है, यह व्यापक `pruneAfter` stale-entry cleanup और `maxEntries` cap से पहले चलता है।
  - `rotateBytes`: deprecated और ignored; `openclaw doctor --fix` इसे पुराने configs से हटाता है।
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archives के लिए retention। डिफ़ॉल्ट `pruneAfter`; अक्षम करने के लिए `false` सेट करें।
  - `maxDiskBytes`: वैकल्पिक sessions-directory disk budget। `warn` mode में यह warnings log करता है; `enforce` mode में यह सबसे पुराने artifacts/sessions पहले हटाता है।
  - `highWaterBytes`: budget cleanup के बाद वैकल्पिक target। डिफ़ॉल्ट `maxDiskBytes` का `80%`।
- **`threadBindings`**: thread-bound session features के लिए global defaults।
  - `enabled`: master default switch (providers override कर सकते हैं; Discord `channels.discord.threadBindings.enabled` का उपयोग करता है)
  - `idleHours`: घंटों में default inactivity auto-unfocus (`0` अक्षम करता है; providers override कर सकते हैं)
  - `maxAgeHours`: घंटों में default hard max age (`0` अक्षम करता है; providers override कर सकते हैं)
  - `spawnSessions`: `sessions_spawn` और ACP thread spawns से thread-bound work sessions बनाने के लिए default gate। Thread bindings enabled होने पर डिफ़ॉल्ट `true`; providers/accounts override कर सकते हैं।
  - `defaultSpawnContext`: thread-bound spawns के लिए default native subagent context (`"fork"` या `"isolated"`)। डिफ़ॉल्ट `"fork"`।

</Accordion>

---

## संदेश

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

### प्रतिक्रिया प्रीफ़िक्स

प्रति-चैनल/अकाउंट overrides: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolution (सबसे विशिष्ट लागू होता है): account → channel → global। `""` अक्षम करता है और cascade रोकता है। `"auto"` `[{identity.name}]` derive करता है।

**टेम्पलेट variables:**

| Variable          | विवरण                 | उदाहरण                     |
| ----------------- | --------------------- | -------------------------- |
| `{model}`         | छोटा model नाम        | `claude-opus-4-6`          |
| `{modelFull}`     | पूरा model identifier | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider नाम          | `anthropic`                |
| `{thinkingLevel}` | वर्तमान thinking level | `high`, `low`, `off`       |
| `{identity.name}` | Agent identity name   | (`"auto"` जैसा ही)         |

Variables case-insensitive हैं। `{think}` `{thinkingLevel}` का alias है।

### Ack reaction

- डिफ़ॉल्ट active agent का `identity.emoji`, अन्यथा `"👀"`। अक्षम करने के लिए `""` सेट करें।
- प्रति-चैनल overrides: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolution order: account → channel → `messages.ackReaction` → identity fallback.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp, और iMessage जैसे reaction-capable channels पर reply के बाद ack हटाता है।
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram, और WhatsApp पर lifecycle status reactions सक्षम करता है।
  Slack और Discord पर, unset होने पर ack reactions active होने पर status reactions enabled रहते हैं।
  Signal, Telegram, और WhatsApp पर, lifecycle status reactions सक्षम करने के लिए इसे स्पष्ट रूप से `true` सेट करें।
- `messages.statusReactions.emojis`: lifecycle emoji keys override करता है:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, और `stallHard`.
  Telegram केवल fixed reaction set की अनुमति देता है, इसलिए unsupported configured emoji उस chat के लिए निकटतम supported status variant पर fall back करते हैं।

### Inbound debounce

एक ही प्रेषक के तेज़ text-only messages को एक single agent turn में batch करता है। Media/attachments तुरंत flush होते हैं। Control commands debouncing को bypass करते हैं।

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
- `modelOverrides` डिफ़ॉल्ट रूप से सक्षम है; `modelOverrides.allowProvider` का डिफ़ॉल्ट `false` है (सहमति-आधारित)।
- API कुंजियाँ `ELEVENLABS_API_KEY`/`XI_API_KEY` और `OPENAI_API_KEY` पर फ़ॉलबैक करती हैं।
- बंडल किए गए speech providers Plugin के स्वामित्व वाले हैं। यदि `plugins.allow` सेट है, तो वह हर TTS provider Plugin शामिल करें जिसे आप उपयोग करना चाहते हैं, उदाहरण के लिए Edge TTS के लिए `microsoft`। पुराने `edge` provider id को `microsoft` के alias के रूप में स्वीकार किया जाता है।
- `providers.openai.baseUrl` OpenAI TTS endpoint को ओवरराइड करता है। समाधान क्रम config, फिर `OPENAI_TTS_BASE_URL`, फिर `https://api.openai.com/v1` है।
- जब `providers.openai.baseUrl` किसी non-OpenAI endpoint की ओर संकेत करता है, तो OpenClaw उसे OpenAI-संगत TTS server मानता है और model/voice validation को ढीला करता है।

---

## वार्ता

वार्ता मोड (macOS/iOS/Android) के लिए डिफ़ॉल्ट।

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

- जब कई वार्ता providers configured हों, तो `talk.provider` को `talk.providers` की किसी कुंजी से मेल खाना चाहिए।
- पुराने flat वार्ता keys (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) केवल compatibility के लिए हैं। persisted config को `talk.providers.<provider>` में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ।
- Voice IDs `ELEVENLABS_VOICE_ID` या `SAG_VOICE_ID` पर फ़ॉलबैक करते हैं।
- `providers.*.apiKey` plaintext strings या SecretRef objects स्वीकार करता है।
- `ELEVENLABS_API_KEY` फ़ॉलबैक केवल तब लागू होता है जब कोई वार्ता API key configured न हो।
- `providers.*.voiceAliases` वार्ता directives को friendly names उपयोग करने देता है।
- `providers.mlx.modelId` macOS local MLX helper द्वारा उपयोग किया जाने वाला Hugging Face repo चुनता है। यदि छोड़ा गया हो, तो macOS `mlx-community/Soprano-80M-bf16` उपयोग करता है।
- macOS MLX playback, मौजूद होने पर bundled `openclaw-mlx-tts` helper के माध्यम से चलता है, या `PATH` पर किसी executable से; development के लिए `OPENCLAW_MLX_TTS_BIN` helper path को ओवरराइड करता है।
- `consultThinkingLevel` Control UI वार्ता realtime `openclaw_agent_consult` calls के पीछे पूर्ण OpenClaw agent run के लिए thinking level नियंत्रित करता है। सामान्य session/model behavior को बनाए रखने के लिए इसे unset छोड़ें।
- `consultFastMode` Control UI वार्ता realtime consults के लिए session की सामान्य fast-mode setting बदले बिना one-shot fast-mode override सेट करता है।
- `speechLocale` iOS/macOS वार्ता speech recognition द्वारा उपयोग की जाने वाली BCP 47 locale id सेट करता है। device default उपयोग करने के लिए इसे unset छोड़ें।
- `silenceTimeoutMs` नियंत्रित करता है कि user silence के बाद transcript भेजने से पहले वार्ता मोड कितनी देर प्रतीक्षा करता है। Unset रखने पर platform default pause window रहता है (`700 ms on macOS and Android, 900 ms on iOS`)।
- `realtime.instructions` OpenClaw के built-in realtime prompt में provider-facing system instructions जोड़ता है, ताकि default `openclaw_agent_consult` guidance खोए बिना voice style configured किया जा सके।
- `realtime.consultRouting` realtime provider द्वारा `openclaw_agent_consult` के बिना final user transcript बनाने पर Gateway relay fallback नियंत्रित करता है: `provider-direct` direct provider replies को बनाए रखता है, जबकि `force-agent-consult` finalized request को OpenClaw के माध्यम से route करता है।

---

## संबंधित

- [Configuration reference](/hi/gateway/configuration-reference) — बाकी सभी config keys
- [Configuration](/hi/gateway/configuration) — सामान्य tasks और quick setup
- [Configuration examples](/hi/gateway/configuration-examples)
