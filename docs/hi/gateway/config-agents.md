---
read_when:
    - एजेंट डिफ़ॉल्ट्स को ट्यून करना (मॉडल, सोच, कार्यक्षेत्र, Heartbeat, मीडिया, Skills)
    - बहु-एजेंट रूटिंग और बाइंडिंग कॉन्फ़िगर करना
    - सत्र, संदेश डिलीवरी, और talk-mode व्यवहार समायोजित करना
summary: एजेंट डिफ़ॉल्ट, मल्टी-एजेंट रूटिंग, सत्र, संदेश, और बातचीत कॉन्फ़िगरेशन
title: कॉन्फ़िगरेशन — एजेंट
x-i18n:
    generated_at: "2026-07-01T13:01:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`, `messages.*`, और `talk.*` के अंतर्गत एजेंट-स्कोप वाली कॉन्फ़िगरेशन कुंजियाँ। चैनलों, टूल्स, Gateway रनटाइम, और अन्य शीर्ष-स्तरीय कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## एजेंट डिफ़ॉल्ट

### `agents.defaults.workspace`

डिफ़ॉल्ट: सेट होने पर `OPENCLAW_WORKSPACE_DIR`, अन्यथा `~/.openclaw/workspace`।

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

स्पष्ट `agents.defaults.workspace` मान `OPENCLAW_WORKSPACE_DIR` पर प्राथमिकता लेता है। जब आप उस पथ को कॉन्फ़िग में लिखना नहीं चाहते, तब डिफ़ॉल्ट एजेंटों को माउंटेड वर्कस्पेस की ओर इंगित करने के लिए एनवायरनमेंट वैरिएबल का उपयोग करें।

### `agents.defaults.repoRoot`

सिस्टम प्रॉम्प्ट की रनटाइम पंक्ति में दिखाया जाने वाला वैकल्पिक रिपॉज़िटरी रूट। अगर सेट नहीं है, तो OpenClaw वर्कस्पेस से ऊपर की ओर चलते हुए स्वतः पहचानता है।

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

उन एजेंटों के लिए वैकल्पिक डिफ़ॉल्ट स्किल अनुमति-सूची जो `agents.list[].skills` सेट नहीं करते।

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

- डिफ़ॉल्ट रूप से अप्रतिबंधित स्किल्स के लिए `agents.defaults.skills` छोड़ दें।
- डिफ़ॉल्ट इनहेरिट करने के लिए `agents.list[].skills` छोड़ दें।
- कोई स्किल न रखने के लिए `agents.list[].skills: []` सेट करें।
- गैर-खाली `agents.list[].skills` सूची उस एजेंट के लिए अंतिम सेट है; यह डिफ़ॉल्ट के साथ मर्ज नहीं होती।

### `agents.defaults.skipBootstrap`

वर्कस्पेस बूटस्ट्रैप फ़ाइलों (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) के स्वतः निर्माण को अक्षम करता है।

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

आवश्यक बूटस्ट्रैप फ़ाइलें लिखते हुए भी चुनी गई वैकल्पिक वर्कस्पेस फ़ाइलों का निर्माण छोड़ता है। मान्य मान: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, और `IDENTITY.md`।

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

यह नियंत्रित करता है कि वर्कस्पेस बूटस्ट्रैप फ़ाइलें सिस्टम प्रॉम्प्ट में कब इंजेक्ट की जाती हैं। डिफ़ॉल्ट: `"always"`।

- `"continuation-skip"`: सुरक्षित निरंतरता टर्न (पूर्ण assistant प्रतिक्रिया के बाद) वर्कस्पेस बूटस्ट्रैप के पुनः-इंजेक्शन को छोड़ते हैं, जिससे प्रॉम्प्ट आकार घटता है। Heartbeat रन और Compaction के बाद के पुनःप्रयास फिर भी कॉन्टेक्स्ट दोबारा बनाते हैं।
- `"never"`: हर टर्न पर वर्कस्पेस बूटस्ट्रैप और कॉन्टेक्स्ट-फ़ाइल इंजेक्शन अक्षम करें। इसका उपयोग केवल उन एजेंटों के लिए करें जो अपने प्रॉम्प्ट जीवनचक्र को पूरी तरह स्वयं नियंत्रित करते हैं (कस्टम कॉन्टेक्स्ट इंजन, अपने कॉन्टेक्स्ट स्वयं बनाने वाले नेटिव रनटाइम, या विशेष बूटस्ट्रैप-मुक्त वर्कफ़्लो)। Heartbeat और Compaction-रिकवरी टर्न भी इंजेक्शन छोड़ते हैं।

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].contextInjection`। छोड़े गए मान `agents.defaults.contextInjection` से इनहेरिट होते हैं।

### `agents.defaults.bootstrapMaxChars`

काटे जाने से पहले प्रति वर्कस्पेस बूटस्ट्रैप फ़ाइल अधिकतम अक्षर। डिफ़ॉल्ट: `20000`।

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].bootstrapMaxChars`। छोड़े गए मान `agents.defaults.bootstrapMaxChars` से इनहेरिट होते हैं।

### `agents.defaults.bootstrapTotalMaxChars`

सभी वर्कस्पेस बूटस्ट्रैप फ़ाइलों में इंजेक्ट किए गए कुल अधिकतम अक्षर। डिफ़ॉल्ट: `60000`।

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].bootstrapTotalMaxChars`। छोड़े गए मान `agents.defaults.bootstrapTotalMaxChars` से इनहेरिट होते हैं।

### प्रति-एजेंट बूटस्ट्रैप प्रोफ़ाइल ओवरराइड

जब किसी एक एजेंट को साझा डिफ़ॉल्ट से अलग प्रॉम्प्ट इंजेक्शन व्यवहार चाहिए, तब प्रति-एजेंट बूटस्ट्रैप प्रोफ़ाइल ओवरराइड का उपयोग करें। छोड़े गए फ़ील्ड `agents.defaults` से इनहेरिट होते हैं।

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

बूटस्ट्रैप कॉन्टेक्स्ट कटने पर एजेंट को दिखने वाली सिस्टम-प्रॉम्प्ट सूचना नियंत्रित करता है।
डिफ़ॉल्ट: `"always"`।

- `"off"`: सिस्टम प्रॉम्प्ट में कभी भी काटे जाने की सूचना का टेक्स्ट इंजेक्ट न करें।
- `"once"`: हर अद्वितीय ट्रंकेशन सिग्नेचर के लिए एक बार संक्षिप्त सूचना इंजेक्ट करें।
- `"always"`: जब भी ट्रंकेशन मौजूद हो, हर रन पर संक्षिप्त सूचना इंजेक्ट करें (अनुशंसित)।

विस्तृत कच्ची/इंजेक्ट की गई गणनाएँ और कॉन्फ़िग ट्यूनिंग फ़ील्ड निदान में रहते हैं, जैसे कॉन्टेक्स्ट/स्थिति रिपोर्ट और लॉग; नियमित WebChat उपयोगकर्ता/रनटाइम कॉन्टेक्स्ट को केवल संक्षिप्त रिकवरी सूचना मिलती है।

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### कॉन्टेक्स्ट बजट स्वामित्व मानचित्र

OpenClaw में कई उच्च-वॉल्यूम प्रॉम्प्ट/कॉन्टेक्स्ट बजट हैं, और उन्हें जानबूझकर एक सामान्य नॉब से गुजारने के बजाय सबसिस्टम के आधार पर विभाजित किया गया है।

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  सामान्य वर्कस्पेस बूटस्ट्रैप इंजेक्शन।
- `agents.defaults.startupContext.*`:
  एक-बार का रीसेट/स्टार्टअप मॉडल-रन प्रील्यूड, जिसमें हाल की दैनिक `memory/*.md` फ़ाइलें शामिल हैं। साधारण चैट `/new` और `/reset` कमांड मॉडल को इनवोक किए बिना स्वीकार किए जाते हैं।
- `skills.limits.*`:
  सिस्टम प्रॉम्प्ट में इंजेक्ट की गई कॉम्पैक्ट Skills सूची।
- `agents.defaults.contextLimits.*`:
  सीमित रनटाइम अंश और इंजेक्ट किए गए रनटाइम-स्वामित्व वाले ब्लॉक।
- `memory.qmd.limits.*`:
  इंडेक्स की गई मेमोरी-सर्च स्निपेट और इंजेक्शन आकार।

मेल खाते प्रति-एजेंट ओवरराइड का उपयोग केवल तब करें जब किसी एक एजेंट को अलग बजट चाहिए:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

रीसेट/स्टार्टअप मॉडल रन पर इंजेक्ट किए गए प्रथम-टर्न स्टार्टअप प्रील्यूड को नियंत्रित करता है। साधारण चैट `/new` और `/reset` कमांड मॉडल को इनवोक किए बिना रीसेट स्वीकार करते हैं, इसलिए वे यह प्रील्यूड लोड नहीं करते।

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

सीमित रनटाइम कॉन्टेक्स्ट सतहों के लिए साझा डिफ़ॉल्ट।

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

- `memoryGetMaxChars`: ट्रंकेशन मेटाडेटा और निरंतरता सूचना जोड़े जाने से पहले डिफ़ॉल्ट `memory_get` अंश सीमा।
- `memoryGetDefaultLines`: जब `lines` छोड़ा गया हो, तब डिफ़ॉल्ट `memory_get` पंक्ति विंडो।
- `toolResultMaxChars`: स्थायी परिणामों और ओवरफ़्लो रिकवरी के लिए इस्तेमाल होने वाली उन्नत लाइव टूल-रिज़ल्ट सीमा। मॉडल-कॉन्टेक्स्ट ऑटो कैप के लिए अनसेट छोड़ें: 100K टोकन से नीचे `16000` अक्षर, 100K+ टोकन पर `32000` अक्षर, और 200K+ टोकन पर `64000` अक्षर। लंबे-कॉन्टेक्स्ट मॉडल के लिए `1000000` तक के स्पष्ट मान स्वीकार किए जाते हैं, लेकिन प्रभावी कैप फिर भी मॉडल कॉन्टेक्स्ट विंडो के लगभग 30% तक सीमित रहती है। `openclaw doctor --deep` प्रभावी कैप प्रिंट करता है, और doctor केवल तब चेतावनी देता है जब कोई स्पष्ट ओवरराइड पुराना हो या उसका कोई प्रभाव न हो।
- `postCompactionMaxChars`: Compaction के बाद रिफ़्रेश इंजेक्शन के दौरान उपयोग की जाने वाली AGENTS.md अंश सीमा।

#### `agents.list[].contextLimits`

साझा `contextLimits` नॉब्स के लिए प्रति-एजेंट ओवरराइड। छोड़े गए फ़ील्ड `agents.defaults.contextLimits` से इनहेरिट होते हैं।

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

सिस्टम प्रॉम्प्ट में इंजेक्ट की गई कॉम्पैक्ट Skills सूची के लिए वैश्विक कैप। यह मांग पर `SKILL.md` फ़ाइलें पढ़ने को प्रभावित नहीं करता।

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

Skills प्रॉम्प्ट बजट के लिए प्रति-एजेंट ओवरराइड।

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

प्रोवाइडर कॉल से पहले ट्रांसक्रिप्ट/टूल इमेज ब्लॉकों में सबसे लंबी इमेज साइड के लिए अधिकतम पिक्सेल आकार।
डिफ़ॉल्ट: `1200`।

कम मान आमतौर पर स्क्रीनशॉट-भारी रन के लिए विज़न-टोकन उपयोग और अनुरोध पेलोड आकार घटाते हैं।
अधिक मान अधिक दृश्य विवरण सुरक्षित रखते हैं।

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

फ़ाइल पथों, URLs, और मीडिया संदर्भों से लोड की गई इमेजों के लिए इमेज-टूल संपीड़न/विवरण प्राथमिकता।
डिफ़ॉल्ट: `auto`।

OpenClaw चुने गए इमेज मॉडल के अनुसार रीसाइज़ लैडर अनुकूलित करता है। उदाहरण के लिए, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL, और होस्टेड Llama 4 विज़न मॉडल पुराने/डिफ़ॉल्ट उच्च-विवरण विज़न पथों की तुलना में बड़ी इमेजों का उपयोग कर सकते हैं, जबकि `auto` मोड में टोकन और लेटेंसी लागत नियंत्रित करने के लिए मल्टी-इमेज टर्न अधिक आक्रामक रूप से संपीड़ित किए जाते हैं।

मान:

- `auto`: मॉडल सीमाओं और इमेज संख्या के अनुसार अनुकूलित करें।
- `efficient`: कम टोकन और बाइट उपयोग के लिए छोटी इमेजों को प्राथमिकता दें।
- `balanced`: मानक मध्य-मार्ग लैडर का उपयोग करें।
- `high`: स्क्रीनशॉट, डायग्राम, और दस्तावेज़ इमेजों के लिए अधिक विवरण सुरक्षित रखें।

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

सिस्टम प्रॉम्प्ट कॉन्टेक्स्ट के लिए टाइमज़ोन (संदेश टाइमस्टैम्प नहीं)। होस्ट टाइमज़ोन पर फ़ॉलबैक करता है।

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

सिस्टम प्रॉम्प्ट में समय प्रारूप। डिफ़ॉल्ट: `auto` (OS प्राथमिकता)।

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

- `model`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - स्ट्रिंग रूप केवल प्राथमिक मॉडल सेट करता है।
  - ऑब्जेक्ट रूप प्राथमिक के साथ क्रमबद्ध failover मॉडल सेट करता है।
- `imageModel`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - `image` टूल पथ द्वारा उसके vision-model कॉन्फ़िगरेशन के रूप में उपयोग किया जाता है।
  - चयनित/डिफ़ॉल्ट मॉडल image इनपुट स्वीकार नहीं कर सकता, तो fallback routing के रूप में भी उपयोग किया जाता है।
  - स्पष्ट `provider/model` रेफरेंस को प्राथमिकता दें। संगतता के लिए bare IDs स्वीकार किए जाते हैं; यदि कोई bare ID `models.providers.*.models` में कॉन्फ़िगर की गई image-सक्षम एंट्री से विशिष्ट रूप से मेल खाती है, तो OpenClaw उसे उस provider के लिए qualify करता है। अस्पष्ट कॉन्फ़िगर किए गए matches के लिए स्पष्ट provider prefix आवश्यक है।
- `imageGenerationModel`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा image-generation capability और भविष्य के किसी भी ऐसे टूल/Plugin सतह द्वारा उपयोग किया जाता है जो images generate करता है।
  - सामान्य मान: native Gemini image generation के लिए `google/gemini-3.1-flash-image-preview`, fal के लिए `fal/fal-ai/flux/dev`, OpenAI Images के लिए `openai/gpt-image-2`, या transparent-background OpenAI PNG/WebP output के लिए `openai/gpt-image-1.5`।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth भी कॉन्फ़िगर करें (उदाहरण के लिए `google/*` के लिए `GEMINI_API_KEY` या `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` के लिए `OPENAI_API_KEY` या OpenAI Codex OAuth, `fal/*` के लिए `FAL_KEY`)।
  - यदि छोड़ा गया है, तो `image_generate` फिर भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id क्रम में शेष registered image-generation providers।
- `musicGenerationModel`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा music-generation capability और built-in `music_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, या `minimax/music-2.6`।
  - यदि छोड़ा गया है, तो `music_generate` फिर भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id क्रम में शेष registered music-generation providers।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth/API key भी कॉन्फ़िगर करें।
- `videoGenerationModel`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा video-generation capability और built-in `video_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, या `qwen/wan2.7-r2v`।
  - यदि छोड़ा गया है, तो `video_generate` फिर भी auth-backed provider default infer कर सकता है। यह पहले current default provider आज़माता है, फिर provider-id क्रम में शेष registered video-generation providers।
  - यदि आप सीधे कोई provider/model चुनते हैं, तो matching provider auth/API key भी कॉन्फ़िगर करें।
  - आधिकारिक Qwen video-generation Plugin अधिकतम 1 output video, 1 input image, 4 input videos, 10 seconds duration, और provider-level `size`, `aspectRatio`, `resolution`, `audio`, और `watermark` विकल्पों का समर्थन करता है।
- `pdfModel`: या तो स्ट्रिंग (`"provider/model"`) या ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - model routing के लिए `pdf` टूल द्वारा उपयोग किया जाता है।
  - यदि छोड़ा गया है, तो PDF टूल `imageModel` पर, फिर resolved session/default model पर fallback करता है।
- `pdfMaxBytesMb`: `pdf` टूल के लिए डिफ़ॉल्ट PDF size limit, जब call time पर `maxBytesMb` पास नहीं किया जाता।
- `pdfMaxPages`: `pdf` टूल में extraction fallback mode द्वारा विचार किए जाने वाले pages की डिफ़ॉल्ट अधिकतम संख्या।
- `verboseDefault`: agents के लिए डिफ़ॉल्ट verbose level। मान: `"off"`, `"on"`, `"full"`। डिफ़ॉल्ट: `"off"`।
- `toolProgressDetail`: `/verbose` tool summaries और progress-draft tool lines के लिए detail mode। मान: `"explain"` (डिफ़ॉल्ट, संक्षिप्त human labels) या `"raw"` (उपलब्ध होने पर raw command/detail append करें)। Per-agent `agents.list[].toolProgressDetail` इस डिफ़ॉल्ट को override करता है।
- `reasoningDefault`: agents के लिए डिफ़ॉल्ट reasoning visibility। मान: `"off"`, `"on"`, `"stream"`। Per-agent `agents.list[].reasoningDefault` इस डिफ़ॉल्ट को override करता है। कॉन्फ़िगर किए गए reasoning defaults केवल owners, authorized senders, या operator-admin gateway contexts के लिए लागू होते हैं, जब कोई per-message या session reasoning override सेट नहीं है।
- `elevatedDefault`: agents के लिए डिफ़ॉल्ट elevated-output level। मान: `"off"`, `"on"`, `"ask"`, `"full"`। डिफ़ॉल्ट: `"on"`।
- `model.primary`: फ़ॉर्मैट `provider/model` (जैसे OpenAI API-key या Codex OAuth access के लिए `openai/gpt-5.5`)। यदि आप provider छोड़ते हैं, तो OpenClaw पहले alias आज़माता है, फिर उस exact model id के लिए unique configured-provider match, और केवल उसके बाद configured default provider पर fallback करता है (deprecated compatibility behavior, इसलिए स्पष्ट `provider/model` को प्राथमिकता दें)। यदि वह provider अब configured default model expose नहीं करता, तो OpenClaw stale removed-provider default दिखाने के बजाय पहले configured provider/model पर fallback करता है।
- `models`: `/model` के लिए configured model catalog और allowlist। हर entry में `alias` (shortcut) और `params` (provider-specific, उदाहरण के लिए `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` routing, `chat_template_kwargs`, `extra_body`/`extraBody`) शामिल हो सकते हैं।
  - हर model id को manually list किए बिना selected providers के लिए सभी discovered models दिखाने के लिए `"openai/*": {}` या `"vllm/*": {}` जैसे `provider/*` entries का उपयोग करें।
  - जब उस provider के हर dynamically discovered model को वही runtime उपयोग करना चाहिए, तो `provider/*` entry में `agentRuntime` जोड़ें। Exact `provider/model` runtime policy फिर भी wildcard पर प्राथमिकता रखती है।
  - सुरक्षित edits: entries जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। `config set` उन replacements को मना करता है जो existing allowlist entries हटाएंगे, जब तक आप `--replace` पास नहीं करते।
  - Provider-scoped configure/onboarding flows selected provider models को इस map में merge करते हैं और पहले से configured unrelated providers को preserve करते हैं।
  - direct OpenAI Responses models के लिए, server-side compaction automatically enabled है। `context_management` inject करना रोकने के लिए `params.responsesServerCompaction: false` का उपयोग करें, या threshold override करने के लिए `params.responsesCompactThreshold` का। [OpenAI server-side compaction](/hi/providers/openai#server-side-compaction-responses-api) देखें।
- `params`: सभी models पर लागू global default provider parameters। `agents.defaults.params` पर सेट करें (जैसे `{ cacheRetention: "long" }`)।
- `params` merge precedence (config): `agents.defaults.params` (global base) को `agents.defaults.models["provider/model"].params` (per-model) override करता है, फिर `agents.list[].params` (matching agent id) key के अनुसार override करता है। विवरण के लिए [Prompt Caching](/hi/reference/prompt-caching) देखें।
- `models.providers.openrouter.params.provider`: OpenRouter-wide default provider-routing policy। OpenClaw इसे OpenRouter के request `provider` object में forward करता है; per-model `agents.defaults.models["openrouter/<model>"].params.provider` और agent params key के अनुसार override करते हैं। [OpenRouter provider routing](/hi/providers/openrouter#advanced-configuration) देखें।
- `params.extra_body`/`params.extraBody`: OpenAI-compatible proxies के लिए `api: "openai-completions"` request bodies में merge किया गया advanced pass-through JSON। यदि यह generated request keys से collide करता है, तो extra body wins; non-native completions routes फिर भी बाद में OpenAI-only `store` strip करते हैं।
- `params.chat_template_kwargs`: vLLM/OpenAI-compatible chat-template arguments, जिन्हें top-level `api: "openai-completions"` request bodies में merge किया जाता है। thinking off के साथ `vllm/nemotron-3-*` के लिए, bundled vLLM Plugin automatically `enable_thinking: false` और `force_nonempty_content: true` भेजता है; explicit `chat_template_kwargs` generated defaults को override करता है, और `extra_body.chat_template_kwargs` फिर भी final precedence रखता है। Configured vLLM Qwen और Nemotron thinking models multi-level effort ladder के बजाय binary `/think` choices (`off`, `on`) expose करते हैं।
- `compat.thinkingFormat`: OpenAI-compatible thinking payload style। Together-style `reasoning.enabled` के लिए `"together"`, Qwen-style top-level `enable_thinking` के लिए `"qwen"`, या request-level chat-template kwargs का समर्थन करने वाले Qwen-family backends, जैसे vLLM, पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` उपयोग करें। OpenClaw disabled thinking को `false` और enabled thinking को `true` में map करता है, और configured vLLM Qwen models इन formats के लिए binary `/think` choices expose करते हैं।
- `compat.supportedReasoningEfforts`: per-model OpenAI-compatible reasoning effort list। उन custom endpoints के लिए `"xhigh"` शामिल करें जो इसे सचमुच स्वीकार करते हैं; OpenClaw फिर उस configured provider/model के लिए command menus, Gateway session rows, session patch validation, agent CLI validation, और `llm-task` validation में `/think xhigh` expose करता है। जब backend canonical level के लिए provider-specific value चाहता हो, तो `compat.reasoningEffortMap` का उपयोग करें।
- `params.preserveThinking`: preserved thinking के लिए Z.AI-only opt-in। enabled होने और thinking on होने पर, OpenClaw `thinking.clear_thinking: false` भेजता है और पूर्व `reasoning_content` replay करता है; [Z.AI thinking and preserved thinking](/hi/providers/zai#thinking-and-preserved-thinking) देखें।
- `localService`: local/self-hosted model servers के लिए optional provider-level process manager। जब selected model उस provider से संबंधित होता है, तो OpenClaw `healthUrl` (या `baseUrl + "/models"`) probe करता है, endpoint down होने पर `args` के साथ `command` start करता है, `readyTimeoutMs` तक wait करता है, फिर model request भेजता है। `command` absolute path होना चाहिए। `idleStopMs: 0` process को OpenClaw exit होने तक alive रखता है; positive value उतने idle milliseconds के बाद OpenClaw-spawned process को stop करती है। [Local model services](/hi/gateway/local-model-services) देखें।
- Runtime policy providers या models पर होती है, `agents.defaults` पर नहीं। provider-wide rules के लिए `models.providers.<provider>.agentRuntime` या model-specific rules के लिए `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` उपयोग करें। आधिकारिक OpenAI provider पर OpenAI agent models default रूप से Codex चुनते हैं।
- इन fields को mutate करने वाले config writers (उदाहरण के लिए `/models set`, `/models set-image`, और fallback add/remove commands) canonical object form save करते हैं और संभव होने पर existing fallback lists preserve करते हैं।
- `maxConcurrent`: sessions में max parallel agent runs (हर session फिर भी serialized रहता है)। डिफ़ॉल्ट: 4।

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

- `id`: `"auto"`, `"openclaw"`, कोई पंजीकृत plugin harness id, या समर्थित CLI backend alias। bundled Codex plugin `codex` पंजीकृत करता है; bundled Anthropic plugin `claude-cli` CLI backend देता है।
- `id: "auto"` पंजीकृत plugin harnesses को समर्थित turns claim करने देता है और कोई harness match न होने पर OpenClaw का उपयोग करता है। `id: "codex"` जैसा explicit plugin runtime उस harness की मांग करता है और वह अनुपलब्ध होने या विफल होने पर fails closed करता है।
- `id: "pi"` केवल `openclaw` के deprecated alias के रूप में स्वीकार किया जाता है, ताकि v2026.5.22 और उससे पहले के shipped configs सुरक्षित रहें। नए config में `openclaw` का उपयोग करना चाहिए।
- Runtime precedence में पहले exact model policy आती है (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, या `models.providers.<provider>.models[]`), फिर `agents.list[]` / `agents.defaults.models["provider/*"]`, फिर `models.providers.<provider>.agentRuntime` पर provider-wide policy।
- Whole-agent runtime keys legacy हैं। `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins, और `OPENCLAW_AGENT_RUNTIME` को runtime selection द्वारा अनदेखा किया जाता है। stale values हटाने के लिए `openclaw doctor --fix` चलाएँ।
- OpenAI agent models default रूप से Codex harness का उपयोग करते हैं; जब आप इसे explicit बनाना चाहते हैं, तब provider/model `agentRuntime.id: "codex"` valid रहता है।
- Claude CLI deployments के लिए, `model: "anthropic/claude-opus-4-8"` और model-scoped `agentRuntime.id: "claude-cli"` को प्राथमिकता दें। Legacy `claude-cli/claude-opus-4-7` model refs compatibility के लिए अभी भी काम करते हैं, लेकिन नए config में provider/model selection canonical रखना चाहिए और execution backend को provider/model runtime policy में रखना चाहिए।
- यह केवल text agent-turn execution को नियंत्रित करता है। Media generation, vision, PDF, music, video, और TTS अब भी अपनी provider/model settings का उपयोग करते हैं।

**Built-in alias shorthands** (केवल तब लागू होते हैं जब model `agents.defaults.models` में हो):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

आपके configured aliases हमेशा defaults से प्राथमिकता पाते हैं।

Z.AI GLM-4.x models अपने आप thinking mode enable करते हैं, जब तक आप `--thinking off` set न करें या `agents.defaults.models["zai/<model>"].params.thinking` खुद define न करें।
Z.AI models tool call streaming के लिए default रूप से `tool_stream` enable करते हैं। इसे disable करने के लिए `agents.defaults.models["zai/<model>"].params.tool_stream` को `false` पर set करें।
Anthropic Claude Opus 4.8 OpenClaw में default रूप से thinking off रखता है; जब adaptive thinking explicit रूप से enable हो, Anthropic का provider-owned effort default `high` होता है। Claude 4.6 models तब `adaptive` पर default होते हैं जब कोई explicit thinking level set न हो।

### `agents.defaults.cliBackends`

text-only fallback runs के लिए optional CLI backends (कोई tool calls नहीं)। API providers विफल होने पर backup के रूप में उपयोगी।

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
- `sessionArg` set होने पर sessions समर्थित होते हैं।
- `imageArg` file paths स्वीकार करता हो तो image pass-through समर्थित होता है।
- `reseedFromRawTranscriptWhenUncompacted: true` backend को first compaction summary मौजूद होने से पहले bounded raw OpenClaw transcript tail से safe invalidated sessions recover करने देता है। Auth profile या credential-epoch changes अब भी कभी raw-reseed नहीं करते।

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
- Legacy `plugins.entries.openai.config.personality` अब भी तब read किया जाता है जब यह shared setting unset हो।

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

- `every`: duration string (ms/s/m/h)। Default: `30m` (API-key auth) या `1h` (OAuth auth)। disable करने के लिए `0m` पर set करें।
- `includeSystemPromptSection`: false होने पर system prompt से Heartbeat section हटाता है और bootstrap context में `HEARTBEAT.md` injection skip करता है। Default: `true`।
- `suppressToolErrorWarnings`: true होने पर heartbeat runs के दौरान tool error warning payloads suppress करता है।
- `timeoutSeconds`: heartbeat agent turn abort होने से पहले अनुमत अधिकतम समय, seconds में। Unset छोड़ने पर, set होने पर `agents.defaults.timeoutSeconds` उपयोग होता है, अन्यथा heartbeat cadence 600 seconds पर capped रहती है।
- `directPolicy`: direct/DM delivery policy। `allow` (default) direct-target delivery की अनुमति देता है। `block` direct-target delivery suppress करता है और `reason=dm-blocked` emit करता है।
- `lightContext`: true होने पर heartbeat runs lightweight bootstrap context का उपयोग करते हैं और workspace bootstrap files में से केवल `HEARTBEAT.md` रखते हैं।
- `isolatedSession`: true होने पर प्रत्येक heartbeat बिना prior conversation history के fresh session में चलता है। cron `sessionTarget: "isolated"` जैसा ही isolation pattern। Per-heartbeat token cost को ~100K से ~2-5K tokens तक घटाता है।
- `skipWhenBusy`: true होने पर heartbeat runs उस agent की extra busy lanes पर defer करते हैं: उसका अपना session-keyed subagent या nested command work। Cron lanes हमेशा heartbeats defer करती हैं, इस flag के बिना भी।
- Per-agent: `agents.list[].heartbeat` set करें। जब कोई भी agent `heartbeat` define करता है, **केवल वही agents** heartbeats चलाते हैं।
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
- `provider`: पंजीकृत Compaction प्रदाता Plugin की id। सेट होने पर, अंतर्निहित LLM सारांशीकरण के बजाय प्रदाता का `summarize()` कॉल किया जाता है। विफलता पर अंतर्निहित पर वापस चला जाता है। प्रदाता सेट करने से `mode: "safeguard"` बाध्य होता है। [Compaction](/hi/concepts/compaction) देखें।
- `timeoutSeconds`: एकल Compaction कार्रवाई के लिए OpenClaw द्वारा उसे निरस्त करने से पहले अनुमत अधिकतम सेकंड। डिफ़ॉल्ट: `180`।
- `keepRecentTokens`: सबसे हालिया ट्रांसक्रिप्ट टेल को यथावत रखने के लिए एजेंट कट-पॉइंट बजट। मैनुअल `/compact` इसे स्पष्ट रूप से सेट होने पर मानता है; अन्यथा मैनुअल Compaction एक हार्ड चेकपॉइंट है।
- `identifierPolicy`: `strict` (डिफ़ॉल्ट), `off`, या `custom`। `strict` Compaction सारांशीकरण के दौरान अंतर्निहित अपारदर्शी पहचानकर्ता संरक्षण मार्गदर्शन जोड़ता है।
- `identifierInstructions`: `identifierPolicy=custom` होने पर उपयोग किया जाने वाला वैकल्पिक कस्टम पहचानकर्ता-संरक्षण टेक्स्ट।
- `qualityGuard`: safeguard सारांशों के लिए खराब-आउटपुट-पर-पुनःप्रयास जांचें। safeguard मोड में डिफ़ॉल्ट रूप से सक्षम; ऑडिट छोड़ने के लिए `enabled: false` सेट करें।
- `midTurnPrecheck`: वैकल्पिक टूल-लूप दबाव जांच। जब `enabled: true` हो, OpenClaw टूल परिणाम जोड़े जाने के बाद और अगली मॉडल कॉल से पहले संदर्भ दबाव जांचता है। यदि संदर्भ अब फिट नहीं होता, तो यह प्रॉम्प्ट सबमिट करने से पहले मौजूदा प्रयास निरस्त कर देता है और टूल परिणामों को छोटा करने या compact करके पुनःप्रयास करने के लिए मौजूदा precheck रिकवरी पथ का पुनःउपयोग करता है। `default` और `safeguard` दोनों Compaction मोड के साथ काम करता है। डिफ़ॉल्ट: अक्षम।
- `postCompactionSections`: Compaction के बाद फिर से इंजेक्ट करने के लिए वैकल्पिक AGENTS.md H2/H3 अनुभाग नाम। unset होने या `[]` पर सेट होने पर reinjection अक्षम रहती है। `["Session Startup", "Red Lines"]` को स्पष्ट रूप से सेट करने से वह जोड़ी सक्षम होती है और विरासत `Every Session`/`Safety` fallback सुरक्षित रहता है। इसे केवल तब सक्षम करें जब अतिरिक्त संदर्भ Compaction सारांश में पहले से कैप्चर किए गए प्रोजेक्ट मार्गदर्शन की नकल के जोखिम के योग्य हो।
- `model`: केवल Compaction सारांशीकरण के लिए वैकल्पिक `provider/model-id` या `agents.defaults.models` से bare alias। Bare aliases dispatch से पहले resolve होते हैं; कॉन्फ़िगर किए गए literal model IDs collisions पर precedence बनाए रखते हैं। इसका उपयोग तब करें जब मुख्य सत्र एक मॉडल रखे लेकिन Compaction सारांश दूसरे पर चलें; unset होने पर, Compaction सत्र के primary model का उपयोग करता है।
- `maxActiveTranscriptBytes`: वैकल्पिक byte threshold (`number` या `"20mb"` जैसी strings) जो active JSONL के threshold से आगे बढ़ने पर run से पहले सामान्य local Compaction trigger करता है। `truncateAfterCompaction` आवश्यक है ताकि सफल Compaction छोटे successor transcript पर rotate कर सके। unset या `0` होने पर अक्षम।
- `notifyUser`: `true` होने पर, Compaction शुरू होने और पूरा होने पर उपयोगकर्ता को संक्षिप्त सूचनाएं भेजता है (उदाहरण के लिए, "संदर्भ compact किया जा रहा है..." और "Compaction पूरा हुआ")। Compaction को मौन रखने के लिए डिफ़ॉल्ट रूप से अक्षम।
- `memoryFlush`: टिकाऊ स्मृतियों को संग्रहीत करने के लिए auto-compaction से पहले मौन agentic turn। जब यह housekeeping turn किसी local model पर रहना चाहिए, तो `model` को `ollama/qwen3:8b` जैसे सटीक provider/model पर सेट करें; override active session fallback chain को inherit नहीं करता। workspace read-only होने पर skipped।

### `agents.defaults.runRetries`

विफलता रिकवरी के दौरान अनंत execution loops रोकने के लिए embedded agent runtime के outer run loop retry iteration boundaries। ध्यान दें कि यह setting अभी केवल embedded agent runtime पर लागू होती है, ACP या CLI runtimes पर नहीं।

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
- `ttl` नियंत्रित करता है कि pruning फिर कितनी बार चल सकती है (अंतिम cache touch के बाद)।
- Pruning पहले oversized tool results को soft-trim करती है, फिर जरूरत पड़ने पर पुराने tool results को hard-clear करती है।
- `softTrimRatio` और `hardClearRatio` `0.0` से `1.0` तक के मान स्वीकार करते हैं; config validation इस range के बाहर के मानों को reject करता है।

**सॉफ्ट-ट्रिम** शुरुआत + अंत रखता है और बीच में `...` insert करता है।

**हार्ड-क्लियर** पूरे tool result को placeholder से बदल देता है।

नोट्स:

- Image blocks कभी trim/clear नहीं किए जाते।
- Ratios character-based (approximate) हैं, exact token counts नहीं।
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

- Non-Telegram channels को block replies सक्षम करने के लिए explicit `*.blockStreaming: true` चाहिए।
- Channel overrides: `channels.<channel>.blockStreamingCoalesce` (और per-account variants)। Signal/Slack/Discord/Google Chat default `minChars: 1500`।
- `humanDelay`: block replies के बीच randomized pause। `natural` = 800–2500ms। Per-agent override: `agents.list[].humanDelay`।

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

Embedded agent के लिए वैकल्पिक sandboxing। पूर्ण guide के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।

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

**बैकएंड:**

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

- `identityData`, `identityFile` पर वरीयता रखता है
- `certificateData`, `certificateFile` पर वरीयता रखता है
- `knownHostsData`, `knownHostsFile` पर वरीयता रखता है
- SecretRef-backed `*Data` values sandbox session शुरू होने से पहले active secrets runtime snapshot से resolved होते हैं

**SSH backend behavior:**

- create या recreate के बाद remote workspace को एक बार seed करता है
- फिर remote SSH workspace को canonical रखता है
- `exec`, file tools, और media paths को SSH पर route करता है
- remote changes को host पर अपने आप sync नहीं करता
- sandbox browser containers का समर्थन नहीं करता

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

- `mirror`: exec से पहले local से remote को seed करें, exec के बाद वापस sync करें; local workspace canonical रहता है
- `remote`: sandbox बनने पर remote को एक बार seed करें, फिर remote workspace को canonical रखें

`remote` मोड में, OpenClaw के बाहर किए गए host-local edits seed चरण के बाद sandbox में अपने-आप sync नहीं होते।
Transport OpenShell sandbox में SSH है, लेकिन plugin sandbox lifecycle और वैकल्पिक mirror sync का मालिक है।

**`setupCommand`** container creation के बाद एक बार चलता है (`sh -lc` के माध्यम से)। network egress, writable root, root user चाहिए।

**Containers का default `network: "none"` होता है** — अगर agent को outbound access चाहिए, तो इसे `"bridge"` (या custom bridge network) पर सेट करें।
`"host"` blocked है। `"container:<id>"` default रूप से blocked है, जब तक आप स्पष्ट रूप से
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) सेट नहीं करते।
active OpenClaw sandbox में Codex app-server turns अपने native code-mode network access के लिए यही egress setting उपयोग करते हैं।

**Inbound attachments** active workspace में `media/inbound/*` में staged किए जाते हैं।

**`docker.binds`** अतिरिक्त host directories mount करता है; global और per-agent binds merge किए जाते हैं।

**Sandboxed browser** (`sandbox.browser.enabled`): container में Chromium + CDP। noVNC URL system prompt में inject किया जाता है। `openclaw.json` में `browser.enabled` की आवश्यकता नहीं है।
noVNC observer access default रूप से VNC auth का उपयोग करता है और OpenClaw shared URL में password expose करने के बजाय short-lived token URL emit करता है।

- `allowHostControl: false` (default) sandboxed sessions को host browser target करने से रोकता है।
- `network` default रूप से `openclaw-sandbox-browser` (dedicated bridge network) होता है। केवल तब `bridge` पर सेट करें जब आप स्पष्ट रूप से global bridge connectivity चाहते हों।
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
  - `--disable-extensions` (default enabled)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, और `--disable-gpu`
    default रूप से enabled हैं और अगर WebGL/3D usage को इसकी जरूरत हो तो
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` से disabled किए जा सकते हैं।
  - अगर आपका workflow extensions पर निर्भर करता है, तो `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    extensions को फिर से enable करता है।
  - `--renderer-process-limit=2` को
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` से बदला जा सकता है; Chromium की
    default process limit उपयोग करने के लिए `0` सेट करें।
  - साथ में `--no-sandbox`, जब `noSandbox` enabled हो।
  - Defaults container image baseline हैं; container defaults बदलने के लिए custom
    entrypoint के साथ custom browser image उपयोग करें।

</Accordion>

Browser sandboxing और `sandbox.docker.binds` केवल Docker के लिए हैं।

Images build करें (source checkout से):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

source checkout के बिना npm installs के लिए, inline `docker build` commands हेतु [Sandboxing § Images and setup](/hi/gateway/sandboxing#images-and-setup) देखें।

### `agents.list` (per-agent overrides)

किसी agent को अपना TTS provider, voice, model,
style, या auto-TTS mode देने के लिए `agents.list[].tts` उपयोग करें। agent block global
`messages.tts` के ऊपर deep-merge होता है, इसलिए shared credentials एक जगह रह सकते हैं जबकि individual
agents केवल अपने जरूरी voice या provider fields override करते हैं। active agent का
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
- `default`: जब multiple set हों, पहला wins (warning logged)। अगर कोई set नहीं है, तो first list entry default है।
- `model`: string form बिना model fallback के strict per-agent primary set करता है; object form `{ primary }` भी strict है जब तक आप `fallbacks` नहीं जोड़ते। उस agent को fallback में opt in करने के लिए `{ primary, fallbacks: [...] }`, या strict behavior को explicit बनाने के लिए `{ primary, fallbacks: [] }` उपयोग करें। Cron jobs जो केवल `primary` override करते हैं, वे तब भी default fallbacks inherit करते हैं जब तक आप `fallbacks: []` सेट नहीं करते।
- `params`: per-agent stream params `agents.defaults.models` में selected model entry के ऊपर merge होते हैं। पूरे model catalog को duplicate किए बिना `cacheRetention`, `temperature`, या `maxTokens` जैसे agent-specific overrides के लिए इसका उपयोग करें।
- `tts`: वैकल्पिक per-agent text-to-speech overrides। block `messages.tts` के ऊपर deep-merge होता है, इसलिए shared provider credentials और fallback policy को `messages.tts` में रखें और यहां केवल persona-specific values जैसे provider, voice, model, style, या auto mode set करें।
- `skills`: वैकल्पिक per-agent skill allowlist। अगर omitted है, तो agent set होने पर `agents.defaults.skills` inherit करता है; explicit list defaults को merge करने के बजाय replace करती है, और `[]` का अर्थ कोई skills नहीं है।
- `thinkingDefault`: वैकल्पिक per-agent default thinking level (`off | minimal | low | medium | high | xhigh | adaptive | max`)। जब कोई per-message या session override set नहीं है, तो इस agent के लिए `agents.defaults.thinkingDefault` override करता है। selected provider/model profile नियंत्रित करता है कि कौन-सी values valid हैं; Google Gemini के लिए, `adaptive` provider-owned dynamic thinking बनाए रखता है (Gemini 3/3.1 पर `thinkingLevel` omitted, Gemini 2.5 पर `thinkingBudget: -1`)।
- `reasoningDefault`: वैकल्पिक per-agent default reasoning visibility (`on | off | stream`)। जब कोई per-message या session reasoning override set नहीं है, तो इस agent के लिए `agents.defaults.reasoningDefault` override करता है।
- `fastModeDefault`: fast mode के लिए वैकल्पिक per-agent default (`"auto" | true | false`)। जब कोई per-message या session fast-mode override set नहीं है, तब लागू होता है।
- `models`: full `provider/model` ids द्वारा keyed वैकल्पिक per-agent model catalog/runtime overrides। per-agent runtime exceptions के लिए `models["provider/model"].agentRuntime` उपयोग करें।
- `runtime`: वैकल्पिक per-agent runtime descriptor। जब agent को ACP harness sessions default करने चाहिए, तो `runtime.acp` defaults (`agent`, `backend`, `mode`, `cwd`) के साथ `type: "acp"` उपयोग करें।
- `identity.avatar`: workspace-relative path, `http(s)` URL, या `data:` URI।
- Local workspace-relative `identity.avatar` image files 2 MB तक सीमित हैं। `http(s)` URLs और `data:` URIs को local file-size limit से check नहीं किया जाता।
- `identity` defaults derive करता है: `emoji` से `ackReaction`, `name`/`emoji` से `mentionPatterns`।
- `subagents.allowAgents`: explicit `sessions_spawn.agentId` targets के लिए configured agent ids की allowlist (`["*"]` = कोई भी configured target; default: केवल वही agent)। जब self-targeted `agentId` calls allowed होने चाहिए, तो requester id शामिल करें। stale entries जिनका agent config delete हो चुका है, `sessions_spawn` द्वारा rejected होती हैं और `agents_list` से omitted होती हैं; उन्हें clean up करने के लिए `openclaw doctor --fix` चलाएँ, या अगर वह target defaults inherit करते हुए spawnable रहना चाहिए तो minimal `agents.list[]` entry जोड़ें।
- Sandbox inheritance guard: अगर requester session sandboxed है, तो `sessions_spawn` ऐसे targets reject करता है जो unsandboxed run होंगे।
- `subagents.requireAgentId`: true होने पर, `agentId` omit करने वाली `sessions_spawn` calls block करें (explicit profile selection force करता है; default: false)।

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

- `type` (optional): normal routing के लिए `route` (missing type default route है), persistent ACP conversation bindings के लिए `acp`।
- `match.channel` (required)
- `match.accountId` (optional; `*` = कोई भी account; omitted = default account)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; channel-specific)
- `acp` (optional; केवल `type: "acp"` के लिए): `{ mode, label, cwd, backend }`

**Deterministic match order:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, कोई peer/guild/team नहीं)
5. `match.accountId: "*"` (channel-wide)
6. Default agent

हर tier के भीतर, पहली matching `bindings` entry wins।

`type: "acp"` entries के लिए, OpenClaw exact conversation identity (`match.channel` + account + `match.peer.id`) द्वारा resolve करता है और ऊपर दिए गए route binding tier order का उपयोग नहीं करता।

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

<Accordion title="फ़ाइल सिस्टम एक्सेस नहीं (केवल संदेश भेजना)">

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

प्राथमिकता विवरण के लिए [मल्टी-एजेंट Sandbox और टूल](/hi/tools/multi-agent-sandbox-tools) देखें।

---

## सत्र

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

<Accordion title="सत्र फ़ील्ड विवरण">

- **`scope`**: समूह-चैट संदर्भों के लिए मूल सत्र समूहकरण रणनीति।
  - `per-sender` (डिफ़ॉल्ट): प्रत्येक भेजने वाले को चैनल संदर्भ के भीतर एक अलग सत्र मिलता है।
  - `global`: चैनल संदर्भ में सभी प्रतिभागी एक ही सत्र साझा करते हैं (सिर्फ तब उपयोग करें जब साझा संदर्भ अपेक्षित हो)।
- **`dmScope`**: DM कैसे समूहित किए जाते हैं।
  - `main`: सभी DM मुख्य सत्र साझा करते हैं।
  - `per-peer`: चैनलों में भेजने वाले id के आधार पर अलग करता है।
  - `per-channel-peer`: प्रति चैनल + भेजने वाले के आधार पर अलग करता है (बहु-उपयोगकर्ता इनबॉक्स के लिए अनुशंसित)।
  - `per-account-channel-peer`: प्रति खाता + चैनल + भेजने वाले के आधार पर अलग करता है (बहु-खाता के लिए अनुशंसित)।
- **`identityLinks`**: क्रॉस-चैनल सत्र साझाकरण के लिए कैननिकल id को provider-prefixed peers से मैप करें। `/dock_discord` जैसे Dock कमांड सक्रिय सत्र के उत्तर मार्ग को किसी अन्य लिंक किए गए चैनल peer पर स्विच करने के लिए वही मैप उपयोग करते हैं; [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।
- **`reset`**: प्राथमिक रीसेट नीति। `daily`, `atHour` स्थानीय समय पर रीसेट करता है; `idle`, `idleMinutes` के बाद रीसेट करता है। जब दोनों कॉन्फ़िगर हों, जो पहले समाप्त हो वही लागू होता है। दैनिक रीसेट ताज़गी सत्र पंक्ति के `sessionStartedAt` का उपयोग करती है; निष्क्रिय रीसेट ताज़गी `lastInteractionAt` का उपयोग करती है। Heartbeat, Cron wakeups, exec notifications, और Gateway bookkeeping जैसे पृष्ठभूमि/सिस्टम-इवेंट लेखन `updatedAt` को अपडेट कर सकते हैं, लेकिन वे दैनिक/निष्क्रिय सत्रों को ताज़ा नहीं रखते।
- **`resetByType`**: प्रति-प्रकार ओवरराइड (`direct`, `group`, `thread`)। पुराने `dm` को `direct` के alias के रूप में स्वीकार किया जाता है।
- **`mainKey`**: पुराना फ़ील्ड। Runtime मुख्य direct-chat bucket के लिए हमेशा `"main"` का उपयोग करता है।
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent आदान-प्रदान के दौरान agents के बीच अधिकतम reply-back turns (पूर्णांक, सीमा: `0`-`20`, डिफ़ॉल्ट: `5`)। `0` ping-pong chaining को अक्षम करता है।
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, पुराने `dm` alias के साथ), `keyPrefix`, या `rawKeyPrefix` से मिलान करें। पहला deny जीतता है।
- **`maintenance`**: सत्र-स्टोर cleanup + retention controls।
  - `mode`: `enforce` cleanup लागू करता है और डिफ़ॉल्ट है; `warn` केवल warnings निकालता है।
  - `pruneAfter`: stale entries के लिए age cutoff (डिफ़ॉल्ट `30d`)।
  - `maxEntries`: `sessions.json` में entries की अधिकतम संख्या (डिफ़ॉल्ट `500`)। Runtime production-sized caps के लिए छोटे high-water buffer के साथ batch cleanup लिखता है; `openclaw sessions cleanup --enforce` cap तुरंत लागू करता है।
  - अल्पकालिक Gateway model-run probe sessions fixed `24h` retention उपयोग करते हैं, लेकिन cleanup pressure-gated है: यह stale strict model-run probe rows को केवल तब हटाता है जब session-entry maintenance/cap pressure पहुंचता है। केवल `agent:*:explicit:model-run-<uuid>` से मेल खाने वाली strict explicit probe keys पात्र हैं; सामान्य direct, group, thread, Cron, hook, Heartbeat, ACP, और sub-agent sessions इस 24h retention को inherit नहीं करते। जब model-run cleanup चलता है, यह व्यापक `pruneAfter` stale-entry cleanup और `maxEntries` cap से पहले चलता है।
  - `rotateBytes`: deprecated और ignored; `openclaw doctor --fix` इसे पुराने configs से हटाता है।
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archives के लिए retention। डिफ़ॉल्ट `pruneAfter`; अक्षम करने के लिए `false` सेट करें।
  - `maxDiskBytes`: वैकल्पिक sessions-directory disk budget। `warn` mode में यह warnings log करता है; `enforce` mode में यह सबसे पुराने artifacts/sessions पहले हटाता है।
  - `highWaterBytes`: budget cleanup के बाद वैकल्पिक target। डिफ़ॉल्ट `maxDiskBytes` का `80%`।
- **`threadBindings`**: thread-bound session features के लिए global defaults।
  - `enabled`: master default switch (providers override कर सकते हैं; Discord `channels.discord.threadBindings.enabled` उपयोग करता है)
  - `idleHours`: घंटों में default inactivity auto-unfocus (`0` अक्षम करता है; providers override कर सकते हैं)
  - `maxAgeHours`: घंटों में default hard max age (`0` अक्षम करता है; providers override कर सकते हैं)
  - `spawnSessions`: `sessions_spawn` और ACP thread spawns से thread-bound work sessions बनाने के लिए default gate। Thread bindings enabled होने पर default `true`; providers/accounts override कर सकते हैं।
  - `defaultSpawnContext`: thread-bound spawns के लिए default native subagent context (`"fork"` या `"isolated"`)। डिफ़ॉल्ट `"fork"` है।

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

### Response prefix

प्रति-channel/account ओवरराइड: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolution (सबसे specific जीतता है): account → channel → global। `""` अक्षम करता है और cascade रोकता है। `"auto"` `[{identity.name}]` से derive करता है।

**Template variables:**

| Variable          | विवरण                  | उदाहरण                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | छोटा model नाम         | `claude-opus-4-6`           |
| `{modelFull}`     | पूरा model identifier  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider नाम           | `anthropic`                 |
| `{thinkingLevel}` | वर्तमान thinking level | `high`, `low`, `off`        |
| `{identity.name}` | Agent identity नाम     | (`"auto"` जैसा)             |

Variables case-insensitive हैं। `{think}` `{thinkingLevel}` का alias है।

### Ack reaction

- डिफ़ॉल्ट active agent का `identity.emoji` है, अन्यथा `"👀"`। अक्षम करने के लिए `""` सेट करें।
- प्रति-channel overrides: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolution क्रम: account → channel → `messages.ackReaction` → identity fallback।
- Scope: `group-mentions` (डिफ़ॉल्ट), `group-all`, `direct`, `all`।
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp, और iMessage जैसे reaction-capable channels पर reply के बाद ack हटाता है।
- `messages.statusReactions.enabled`: Slack, Discord, Telegram, और WhatsApp पर lifecycle status reactions सक्षम करता है।
  Slack और Discord पर, unset होने पर ack reactions सक्रिय होने पर status reactions enabled रहते हैं।
  Telegram और WhatsApp पर, lifecycle status reactions सक्षम करने के लिए इसे स्पष्ट रूप से `true` पर सेट करें।
- `messages.statusReactions.emojis`: lifecycle emoji keys override करता है:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, और `stallHard`.
  Telegram केवल fixed reaction set की अनुमति देता है, इसलिए unsupported configured emoji उस chat के लिए निकटतम supported status variant पर fall back करते हैं।

### Inbound debounce

एक ही sender से तेज़ text-only messages को एक single agent turn में batch करता है। Media/attachments तुरंत flush होते हैं। Control commands debouncing को bypass करते हैं।

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
- `modelOverrides` डिफ़ॉल्ट रूप से सक्षम है; `modelOverrides.allowProvider` डिफ़ॉल्ट रूप से `false` है (ऑप्ट-इन)।
- API कुंजियाँ `ELEVENLABS_API_KEY`/`XI_API_KEY` और `OPENAI_API_KEY` पर फ़ॉलबैक करती हैं।
- बंडल किए गए speech प्रदाता Plugin-स्वामित्व वाले हैं। यदि `plugins.allow` सेट है, तो हर उस TTS प्रदाता Plugin को शामिल करें जिसका आप उपयोग करना चाहते हैं, उदाहरण के लिए Edge TTS के लिए `microsoft`। पुराना `edge` प्रदाता id `microsoft` के alias के रूप में स्वीकार किया जाता है।
- `providers.openai.baseUrl` OpenAI TTS endpoint को ओवरराइड करता है। रिज़ॉल्यूशन क्रम config, फिर `OPENAI_TTS_BASE_URL`, फिर `https://api.openai.com/v1` है।
- जब `providers.openai.baseUrl` किसी गैर-OpenAI endpoint की ओर संकेत करता है, तो OpenClaw उसे OpenAI-संगत TTS server मानता है और model/voice सत्यापन को ढीला करता है।

---

## बातचीत

बातचीत मोड (macOS/iOS/Android) के लिए डिफ़ॉल्ट।

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

- कई बातचीत प्रदाता configure होने पर `talk.provider` को `talk.providers` की किसी key से मेल खाना चाहिए।
- पुराने flat बातचीत keys (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) केवल compatibility के लिए हैं। Persisted config को `talk.providers.<provider>` में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ।
- Voice IDs `ELEVENLABS_VOICE_ID` या `SAG_VOICE_ID` पर फ़ॉलबैक करते हैं।
- `providers.*.apiKey` plaintext strings या SecretRef objects स्वीकार करता है।
- `ELEVENLABS_API_KEY` फ़ॉलबैक केवल तब लागू होता है जब कोई बातचीत API key configured न हो।
- `providers.*.voiceAliases` बातचीत directives को friendly names इस्तेमाल करने देता है।
- `providers.mlx.modelId` macOS local MLX helper द्वारा उपयोग किया जाने वाला Hugging Face repo चुनता है। यदि छोड़ा गया हो, तो macOS `mlx-community/Soprano-80M-bf16` का उपयोग करता है।
- macOS MLX playback मौजूद होने पर बंडल किए गए `openclaw-mlx-tts` helper के माध्यम से चलता है, या `PATH` पर मौजूद executable के माध्यम से; `OPENCLAW_MLX_TTS_BIN` development के लिए helper path को ओवरराइड करता है।
- `consultThinkingLevel` Control UI बातचीत realtime `openclaw_agent_consult` calls के पीछे पूरे OpenClaw agent run के लिए thinking level नियंत्रित करता है। सामान्य session/model व्यवहार सुरक्षित रखने के लिए इसे unset छोड़ें।
- `consultFastMode` session की सामान्य fast-mode setting बदले बिना Control UI बातचीत realtime consults के लिए one-shot fast-mode override सेट करता है।
- `speechLocale` iOS/macOS बातचीत speech recognition द्वारा उपयोग की जाने वाली BCP 47 locale id सेट करता है। device default उपयोग करने के लिए इसे unset छोड़ें।
- `silenceTimeoutMs` नियंत्रित करता है कि user silence के बाद transcript भेजने से पहले बातचीत मोड कितनी देर प्रतीक्षा करता है। Unset रखने से platform default pause window बनी रहती है (`700 ms on macOS and Android, 900 ms on iOS`)।
- `realtime.instructions` OpenClaw के built-in realtime prompt में provider-facing system instructions जोड़ता है, ताकि default `openclaw_agent_consult` guidance खोए बिना voice style configure की जा सके।
- `realtime.consultRouting` Gateway relay फ़ॉलबैक नियंत्रित करता है जब realtime प्रदाता `openclaw_agent_consult` के बिना final user transcript बनाता है: `provider-direct` direct provider replies को सुरक्षित रखता है, जबकि `force-agent-consult` finalized request को OpenClaw के माध्यम से route करता है।

---

## संबंधित

- [Configuration reference](/hi/gateway/configuration-reference) — अन्य सभी config keys
- [Configuration](/hi/gateway/configuration) — सामान्य कार्य और quick setup
- [Configuration examples](/hi/gateway/configuration-examples)
