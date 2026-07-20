---
read_when:
    - एजेंट के डिफ़ॉल्ट समायोजित करना (मॉडल, चिंतन, कार्यक्षेत्र, Heartbeat, मीडिया, Skills)
    - मल्टी-एजेंट रूटिंग और बाइंडिंग कॉन्फ़िगर करना
    - सत्र, संदेश वितरण और वार्ता-मोड व्यवहार को समायोजित करना
summary: एजेंट डिफ़ॉल्ट, मल्टी-एजेंट रूटिंग, सेशन, संदेश और बातचीत का कॉन्फ़िगरेशन
title: कॉन्फ़िगरेशन — एजेंट्स
x-i18n:
    generated_at: "2026-07-20T16:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b42bd47b953d5e970a125df8250f76ae70891fc5bd12fee3120f03365b5af597
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, और `talk.*` के अंतर्गत एजेंट-स्कोप वाले कॉन्फ़िगरेशन कुंजियाँ। चैनलों, टूल, Gateway रनटाइम और अन्य
शीर्ष-स्तरीय कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## एजेंट डिफ़ॉल्ट

### `agents.defaults.workspace`

डिफ़ॉल्ट: सेट होने पर `OPENCLAW_WORKSPACE_DIR`, अन्यथा `~/.openclaw/workspace` (या जब `OPENCLAW_PROFILE` को किसी गैर-डिफ़ॉल्ट प्रोफ़ाइल पर सेट किया गया हो, तब `~/.openclaw/workspace-<profile>`)।

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

स्पष्ट `agents.defaults.workspace` मान को
`OPENCLAW_WORKSPACE_DIR` पर प्राथमिकता मिलती है। जब आप उस पथ को कॉन्फ़िगरेशन में नहीं लिखना चाहते हों, तब डिफ़ॉल्ट एजेंटों को
माउंट किए गए कार्यक्षेत्र की ओर इंगित करने के लिए पर्यावरण चर का उपयोग करें।

### `agents.defaults.repoRoot`

सिस्टम प्रॉम्प्ट की Runtime पंक्ति में दिखाई जाने वाली वैकल्पिक रिपॉज़िटरी रूट। सेट न होने पर, OpenClaw कार्यक्षेत्र से ऊपर की ओर खोजकर इसका स्वतः पता लगाता है।

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

उन एजेंटों के लिए वैकल्पिक डिफ़ॉल्ट स्किल अनुमति-सूची जो
`agents.list[].skills` सेट नहीं करते।

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather इनहेरिट करता है
      { id: "docs", skills: ["docs-search"] }, // डिफ़ॉल्ट को प्रतिस्थापित करता है
      { id: "locked-down", skills: [] }, // कोई स्किल नहीं
    ],
  },
}
```

- डिफ़ॉल्ट रूप से अप्रतिबंधित स्किल के लिए `agents.defaults.skills` को छोड़ दें।
- डिफ़ॉल्ट इनहेरिट करने के लिए `agents.list[].skills` को छोड़ दें।
- कोई स्किल न रखने के लिए `agents.list[].skills: []` सेट करें।
- गैर-रिक्त `agents.list[].skills` सूची उस एजेंट के लिए अंतिम सेट है; यह
  डिफ़ॉल्ट के साथ मर्ज नहीं होती।

### `agents.defaults.skipBootstrap`

कार्यस्थान बूटस्ट्रैप फ़ाइलों (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) का स्वचालित निर्माण अक्षम करता है।

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

आवश्यक बूटस्ट्रैप फ़ाइलें (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) लिखते हुए भी चुनी गई वैकल्पिक कार्यस्थान फ़ाइलों का निर्माण छोड़ देता है। मान्य मान: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, और `IDENTITY.md`।

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

यह नियंत्रित करता है कि कार्यस्थान बूटस्ट्रैप फ़ाइलें सिस्टम प्रॉम्प्ट में कब इंजेक्ट की जाती हैं। डिफ़ॉल्ट: `"always"`।

- `"continuation-skip"`: सुरक्षित निरंतरता टर्न (सहायक की पूर्ण प्रतिक्रिया के बाद) कार्यस्थान बूटस्ट्रैप को दोबारा इंजेक्ट करना छोड़ देते हैं, जिससे प्रॉम्प्ट का आकार घटता है। Heartbeat रन और Compaction के बाद के पुनः प्रयास फिर भी संदर्भ को दोबारा बनाते हैं।
- `"never"`: प्रत्येक टर्न पर कार्यस्थान बूटस्ट्रैप और संदर्भ-फ़ाइल इंजेक्शन अक्षम करता है। इसका उपयोग केवल उन एजेंटों के लिए करें जो अपने प्रॉम्प्ट जीवनचक्र का पूर्ण स्वामित्व रखते हैं (कस्टम संदर्भ इंजन, अपना स्वयं का संदर्भ बनाने वाले नेटिव रनटाइम, या बूटस्ट्रैप-रहित विशेषीकृत कार्यप्रवाह)। Heartbeat और Compaction-पुनर्प्राप्ति टर्न भी इंजेक्शन छोड़ देते हैं।

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].contextInjection`। छोड़े गए मान
`agents.defaults.contextInjection` को इनहेरिट करते हैं।

### `agents.defaults.bootstrapMaxChars`

काटे जाने से पहले प्रत्येक कार्यस्थान बूटस्ट्रैप फ़ाइल के लिए अधिकतम वर्ण। डिफ़ॉल्ट: `20000`।

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].bootstrapMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapMaxChars` को इनहेरिट करते हैं।

### `agents.defaults.bootstrapTotalMaxChars`

सभी कार्यस्थान बूटस्ट्रैप फ़ाइलों में इंजेक्ट किए गए कुल वर्णों की अधिकतम संख्या। डिफ़ॉल्ट: `60000`।

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

प्रति-एजेंट ओवरराइड: `agents.list[].bootstrapTotalMaxChars`। छोड़े गए मान
`agents.defaults.bootstrapTotalMaxChars` को इनहेरिट करते हैं।

### प्रति-एजेंट बूटस्ट्रैप प्रोफ़ाइल ओवरराइड

जब किसी एजेंट को साझा डिफ़ॉल्ट से अलग प्रॉम्प्ट
इंजेक्शन व्यवहार चाहिए, तब प्रति-एजेंट बूटस्ट्रैप प्रोफ़ाइल ओवरराइड का उपयोग करें। छोड़े गए फ़ील्ड
`agents.defaults` से इनहेरिट होते हैं।

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

बूटस्ट्रैप संदर्भ काटे जाने पर एजेंट को दिखाई देने वाली सिस्टम-प्रॉम्प्ट सूचना को नियंत्रित करता है।
डिफ़ॉल्ट: `"always"`।

- `"off"`: सिस्टम प्रॉम्प्ट में कटौती सूचना का टेक्स्ट कभी इंजेक्ट न करें।
- `"once"`: प्रत्येक अद्वितीय कटौती हस्ताक्षर के लिए एक बार संक्षिप्त सूचना इंजेक्ट करें।
- `"always"`: कटौती मौजूद होने पर प्रत्येक रन में संक्षिप्त सूचना इंजेक्ट करें (अनुशंसित)।

विस्तृत मूल/इंजेक्ट की गई गणनाएँ और कॉन्फ़िगरेशन ट्यूनिंग फ़ील्ड संदर्भ/स्थिति रिपोर्ट और लॉग जैसे
निदान में बने रहते हैं; नियमित WebChat उपयोगकर्ता/रनटाइम संदर्भ को केवल
संक्षिप्त पुनर्प्राप्ति सूचना मिलती है।

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // बंद | एक बार | हमेशा
}
```

### संदर्भ बजट स्वामित्व मानचित्र

OpenClaw में कई उच्च-मात्रा वाले प्रॉम्प्ट/संदर्भ बजट हैं, और उन्हें
जानबूझकर एक सामान्य नॉब के माध्यम से प्रवाहित करने के बजाय उप-प्रणाली के अनुसार विभाजित किया गया है।

| बजट                                                         | इसमें शामिल है                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | सामान्य कार्यस्थान बूटस्ट्रैप इंजेक्शन                                                                                                                            |
| `agents.defaults.startupContext.*`                             | एक-बार रीसेट/स्टार्टअप मॉडल-रन प्रस्तावना, जिसमें हाल की दैनिक `memory/*.md` फ़ाइलें शामिल हैं। साधारण चैट `/new` और `/reset` को मॉडल का आह्वान किए बिना स्वीकार किया जाता है |
| `skills.limits.*`                                              | सिस्टम प्रॉम्प्ट में इंजेक्ट की गई संक्षिप्त स्किल सूची                                                                                                         |
| `agents.defaults.contextLimits.*`                              | सीमाबद्ध रनटाइम अंश और इंजेक्ट किए गए रनटाइम-स्वामित्व वाले ब्लॉक                                                                                                      |
| `memory.qmd.limits.*`                                          | अनुक्रमित मेमोरी-खोज स्निपेट और इंजेक्शन आकार निर्धारण                                                                                                              |

मिलते-जुलते प्रति-एजेंट ओवरराइड:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

रीसेट/स्टार्टअप मॉडल रन पर इंजेक्ट की गई प्रथम-टर्न स्टार्टअप प्रस्तावना को नियंत्रित करता है।
साधारण चैट `/new` और `/reset` कमांड मॉडल का आह्वान किए बिना रीसेट को स्वीकार करते हैं,
इसलिए वे यह प्रस्तावना लोड नहीं करते।

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

सीमाबद्ध रनटाइम संदर्भ सतहों के लिए साझा डिफ़ॉल्ट।

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

- `memoryGetMaxChars`: कटौती
  मेटाडेटा और निरंतरता सूचना जोड़े जाने से पहले डिफ़ॉल्ट `memory_get` अंश सीमा।
- `memoryGetDefaultLines`: जब `lines` को
  छोड़ दिया जाता है, तब डिफ़ॉल्ट `memory_get` पंक्ति विंडो।
- `toolResultMaxChars`: स्थायी किए गए
  परिणामों और अतिप्रवाह पुनर्प्राप्ति के लिए उपयोग की जाने वाली उन्नत लाइव टूल-परिणाम सीमा। मॉडल-संदर्भ की स्वचालित सीमा के लिए इसे सेट न करें:
  100K टोकन से कम पर `16000` वर्ण, 100K+ टोकन पर `32000` वर्ण, और 200K+ टोकन पर `64000`
  वर्ण। लंबे-संदर्भ वाले मॉडल के लिए `1000000` तक के स्पष्ट मान स्वीकार किए जाते हैं,
  लेकिन प्रभावी सीमा फिर भी मॉडल संदर्भ विंडो के लगभग 30% तक सीमित रहती है।
  `openclaw doctor --deep` प्रभावी सीमा प्रिंट करता है,
  और doctor केवल तभी चेतावनी देता है जब कोई स्पष्ट ओवरराइड पुराना हो या उसका कोई प्रभाव न हो।
- `postCompactionMaxChars`: Compaction के बाद
  रीफ़्रेश इंजेक्शन के दौरान उपयोग की जाने वाली AGENTS.md अंश सीमा।

#### `agents.list[].contextLimits`

साझा `contextLimits` नॉब के लिए प्रति-एजेंट ओवरराइड। छोड़े गए फ़ील्ड
`agents.defaults.contextLimits` से इनहेरिट होते हैं।

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // इस एजेंट के लिए उन्नत सीमा
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

सिस्टम प्रॉम्प्ट में इंजेक्ट की गई संक्षिप्त स्किल सूची के लिए वैश्विक सीमा। यह
माँग पर `SKILL.md` फ़ाइलें पढ़ने को प्रभावित नहीं करता।

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

स्किल प्रॉम्प्ट बजट के लिए प्रति-एजेंट ओवरराइड।

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

प्रदाता कॉल से पहले ट्रांसक्रिप्ट/टूल इमेज ब्लॉक में छवि की सबसे लंबी भुजा के लिए अधिकतम पिक्सेल आकार।
डिफ़ॉल्ट: `1200`।

कम मान सामान्यतः स्क्रीनशॉट-प्रधान रन के लिए विज़न-टोकन उपयोग और अनुरोध पेलोड आकार घटाते हैं।
अधिक मान अधिक दृश्य विवरण सुरक्षित रखते हैं।

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

फ़ाइल पथों, URL और मीडिया संदर्भों से लोड की गई छवियों के लिए इमेज-टूल संपीड़न/विवरण प्राथमिकता।
डिफ़ॉल्ट: `auto`।

OpenClaw आकार बदलने की श्रेणी को चुने गए इमेज मॉडल के अनुसार अनुकूलित करता है। उदाहरण के लिए, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL और होस्ट किए गए Llama 4 विज़न मॉडल पुराने/डिफ़ॉल्ट उच्च-विवरण विज़न पथों की तुलना में बड़ी छवियों का उपयोग कर सकते हैं, जबकि टोकन और विलंब लागत नियंत्रित करने के लिए `auto` मोड में बहु-छवि टर्न को अधिक आक्रामक रूप से संपीड़ित किया जाता है।

मान:

- `auto`: मॉडल सीमाओं और छवि संख्या के अनुसार अनुकूलित करें।
- `efficient`: कम टोकन और बाइट उपयोग के लिए छोटी छवियों को प्राथमिकता दें।
- `balanced`: मानक मध्यवर्ती श्रेणी का उपयोग करें।
- `high`: स्क्रीनशॉट, आरेख और दस्तावेज़ छवियों के लिए अधिक विवरण सुरक्षित रखें।

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

सिस्टम प्रॉम्प्ट संदर्भ के लिए समय क्षेत्र (संदेश टाइमस्टैम्प के लिए नहीं)। होस्ट समय क्षेत्र पर फ़ॉलबैक करता है।

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

सिस्टम प्रॉम्प्ट में समय प्रारूप। डिफ़ॉल्ट: `auto` (OS प्राथमिकता)।

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // स्वतः | 12 | 24
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
      utilityModel: "openai/gpt-5.4-mini",
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // वैश्विक डिफ़ॉल्ट प्रदाता पैरामीटर
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - स्ट्रिंग रूप केवल प्राथमिक मॉडल सेट करता है।
  - ऑब्जेक्ट रूप प्राथमिक मॉडल के साथ क्रमबद्ध फ़ेलओवर मॉडल सेट करता है।
- `utilityModel`: छोटे आंतरिक कार्यों के लिए वैकल्पिक `provider/model` संदर्भ या उपनाम। यह वर्तमान में जनरेट किए गए Control UI सत्र शीर्षकों, Telegram DM विषय शीर्षकों, Discord स्वचालित-थ्रेड शीर्षकों और [प्रगति-ड्राफ़्ट विवरण](/hi/concepts/progress-drafts#narrated-status) को संचालित करता है। सेट न होने पर, जहाँ प्राथमिक प्रदाता का घोषित छोटा-मॉडल डिफ़ॉल्ट उपलब्ध होता है, OpenClaw उसे प्राप्त करता है (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); अन्यथा शीर्षक कार्य एजेंट के प्राथमिक मॉडल का उपयोग करते हैं और विवरण बंद रहता है। यदि कोई अलग उपयोगिता मॉडल जनरेट किए गए शीर्षक को तैयार या पूरा नहीं कर पाता, तो OpenClaw उस शीर्षक के लिए प्राथमिक मॉडल के साथ एक बार पुनः प्रयास करता है। डैशबोर्ड शीर्षकों के लिए, स्वचालित उपयोगिता निर्धारण और नियमित फ़ॉलबैक प्रभावी सत्र प्रदाता तथा प्रमाणीकरण प्रोफ़ाइल का उपयोग करते हैं; स्पष्ट उपयोगिता मॉडल अपने कॉन्फ़िगर किए गए प्रदाता/प्रमाणीकरण को बनाए रखता है। वैकल्पिक उपयोगिता मार्ग छोड़ने के लिए `utilityModel: ""` सेट करें; डैशबोर्ड शीर्षक जनरेशन फिर भी सीधे नियमित सत्र मॉडल पर आगे बढ़ता है। `agents.list[].utilityModel` डिफ़ॉल्ट को ओवरराइड करता है और किसी ऑपरेशन-विशिष्ट मॉडल का ओवरराइड दोनों पर प्राथमिकता रखता है। उपयोगिता कार्य अलग-अलग मॉडल कॉल करते हैं और चयनित मॉडल प्रदाता को कार्य-विशिष्ट सामग्री भेजते हैं। डैशबोर्ड शीर्षक जनरेशन पहले गैर-कमांड संदेश के अधिकतम प्रथम 1,000 वर्ण भेजता है; विवरण आने वाला अनुरोध और संक्षिप्त संशोधित टूल सारांश भेजता है। ऐसा प्रदाता चुनें जो आपकी लागत और डेटा-प्रबंधन आवश्यकताओं के अनुरूप हो।
- `imageModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - जब सक्रिय मॉडल छवियाँ स्वीकार नहीं कर सकता, तब `image` टूल पथ द्वारा इसके विज़न-मॉडल कॉन्फ़िगरेशन के रूप में उपयोग किया जाता है। इसके बजाय मूल विज़न मॉडल लोड की गई छवि बाइट सीधे प्राप्त करते हैं।
  - जब चयनित/डिफ़ॉल्ट मॉडल छवि इनपुट स्वीकार नहीं कर सकता, तब फ़ॉलबैक रूटिंग के रूप में भी उपयोग किया जाता है।
  - स्पष्ट `provider/model` संदर्भों को प्राथमिकता दें। संगतता के लिए केवल ID स्वीकार किए जाते हैं; यदि कोई केवल ID, `models.providers.*.models` में कॉन्फ़िगर की गई छवि-सक्षम प्रविष्टि से अद्वितीय रूप से मेल खाती है, तो OpenClaw उसे उस प्रदाता के साथ पूर्ण करता है। अस्पष्ट कॉन्फ़िगर किए गए मिलानों के लिए स्पष्ट प्रदाता उपसर्ग आवश्यक है।
- `imageGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा छवि-जनरेशन क्षमता और छवियाँ जनरेट करने वाले किसी भी भावी टूल/Plugin सतह द्वारा उपयोग किया जाता है।
  - सामान्य मान: मूल Gemini छवि जनरेशन के लिए `google/gemini-3.1-flash-image`, fal के लिए `fal/fal-ai/flux/dev`, OpenAI Images के लिए `openai/gpt-image-2`, या पारदर्शी-पृष्ठभूमि वाले OpenAI PNG/WebP आउटपुट के लिए `openai/gpt-image-1.5`।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो उससे मेल खाने वाला प्रदाता प्रमाणीकरण भी कॉन्फ़िगर करें (उदाहरण के लिए `google/*` हेतु `GEMINI_API_KEY` या `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` हेतु `OPENAI_API_KEY` या OpenAI Codex OAuth, और `fal/*` हेतु `FAL_KEY`)।
  - छोड़े जाने पर भी `image_generate` प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट का अनुमान लगा सकता है। यह पहले वर्तमान डिफ़ॉल्ट प्रदाता को आज़माता है, फिर प्रदाता-ID क्रम में शेष पंजीकृत छवि-जनरेशन प्रदाताओं को।
- `musicGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा संगीत-जनरेशन क्षमता और अंतर्निहित `music_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, या `minimax/music-2.6`।
  - छोड़े जाने पर भी `music_generate` प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट का अनुमान लगा सकता है। यह पहले वर्तमान डिफ़ॉल्ट प्रदाता को आज़माता है, फिर प्रदाता-ID क्रम में शेष पंजीकृत संगीत-जनरेशन प्रदाताओं को।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो उससे मेल खाने वाला प्रदाता प्रमाणीकरण/API कुंजी भी कॉन्फ़िगर करें।
- `videoGenerationModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - साझा वीडियो-जनरेशन क्षमता और अंतर्निहित `video_generate` टूल द्वारा उपयोग किया जाता है।
  - सामान्य मान: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, या `qwen/wan2.7-r2v`।
  - छोड़े जाने पर भी `video_generate` प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट का अनुमान लगा सकता है। यह पहले वर्तमान डिफ़ॉल्ट प्रदाता को आज़माता है, फिर प्रदाता-ID क्रम में शेष पंजीकृत वीडियो-जनरेशन प्रदाताओं को।
  - यदि आप सीधे कोई प्रदाता/मॉडल चुनते हैं, तो उससे मेल खाने वाला प्रदाता प्रमाणीकरण/API कुंजी भी कॉन्फ़िगर करें।
  - आधिकारिक Qwen वीडियो-जनरेशन Plugin अधिकतम 1 आउटपुट वीडियो, 1 इनपुट छवि, 4 इनपुट वीडियो, 10 सेकंड की अवधि और प्रदाता-स्तरीय `size`, `aspectRatio`, `resolution`, `audio`, तथा `watermark` विकल्पों का समर्थन करता है।
- `pdfModel`: या तो एक स्ट्रिंग (`"provider/model"`) या एक ऑब्जेक्ट (`{ primary, fallbacks }`) स्वीकार करता है।
  - मॉडल रूटिंग के लिए `pdf` टूल द्वारा उपयोग किया जाता है।
  - छोड़े जाने पर, PDF टूल पहले `imageModel`, फिर निर्धारित सत्र/डिफ़ॉल्ट मॉडल का फ़ॉलबैक के रूप में उपयोग करता है।
- `pdfMaxBytesMb`: कॉल के समय `maxBytesMb` न दिए जाने पर `pdf` टूल के लिए डिफ़ॉल्ट PDF आकार सीमा।
- `pdfMaxPages`: `pdf` टूल में निष्कर्षण फ़ॉलबैक मोड द्वारा विचार किए जाने वाले पृष्ठों की डिफ़ॉल्ट अधिकतम संख्या।
- `verboseDefault`: एजेंटों के लिए डिफ़ॉल्ट विवरण स्तर। मान: `"off"`, `"on"`, `"full"`। डिफ़ॉल्ट: `"off"`।
- `toolProgressDetail`: `/verbose` टूल सारांशों और प्रगति-ड्राफ़्ट टूल पंक्तियों के लिए विवरण मोड। मान: `"explain"` (डिफ़ॉल्ट, संक्षिप्त मानव-पठनीय लेबल) या `"raw"` (उपलब्ध होने पर अपरिष्कृत कमांड/विवरण जोड़ें)। प्रति-एजेंट `agents.list[].toolProgressDetail` इस डिफ़ॉल्ट को ओवरराइड करता है।
- `reasoningDefault`: एजेंटों के लिए तर्क की डिफ़ॉल्ट दृश्यता। मान: `"off"`, `"on"`, `"stream"`। प्रति-एजेंट `agents.list[].reasoningDefault` इस डिफ़ॉल्ट को ओवरराइड करता है। कॉन्फ़िगर किए गए तर्क डिफ़ॉल्ट केवल स्वामियों, अधिकृत प्रेषकों या ऑपरेटर-व्यवस्थापक Gateway संदर्भों के लिए लागू होते हैं, जब कोई प्रति-संदेश या सत्र तर्क ओवरराइड सेट न हो।
- `elevatedDefault`: एजेंटों के लिए डिफ़ॉल्ट उन्नत-आउटपुट स्तर। मान: `"off"`, `"on"`, `"ask"`, `"full"`। डिफ़ॉल्ट: `"on"`।
- `model.primary`: प्रारूप `provider/model` (जैसे Codex OAuth अभिगम के लिए `openai/gpt-5.6-sol`)। यदि आप प्रदाता छोड़ देते हैं, तो OpenClaw पहले कोई उपनाम, फिर उसी सटीक मॉडल ID के लिए अद्वितीय कॉन्फ़िगर-प्रदाता मिलान आज़माता है और उसके बाद ही कॉन्फ़िगर किए गए डिफ़ॉल्ट प्रदाता का फ़ॉलबैक के रूप में उपयोग करता है (बहिष्कृत संगतता व्यवहार, इसलिए स्पष्ट `provider/model` को प्राथमिकता दें)। यदि वह प्रदाता अब कॉन्फ़िगर किया गया डिफ़ॉल्ट मॉडल उपलब्ध नहीं कराता, तो OpenClaw हटाए जा चुके प्रदाता का पुराना डिफ़ॉल्ट दिखाने के बजाय पहले कॉन्फ़िगर किए गए प्रदाता/मॉडल का फ़ॉलबैक के रूप में उपयोग करता है।
- `models`: कॉन्फ़िगर किए गए उपनाम और प्रति-मॉडल सेटिंग्स। प्रत्येक प्रविष्टि में `alias` (शॉर्टकट) और `params` (प्रदाता-विशिष्ट, उदाहरण के लिए `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` रूटिंग, `chat_template_kwargs`, `extra_body`/`extraBody`) शामिल हो सकते हैं। प्रविष्टियाँ जोड़ने से मॉडल ओवरराइड प्रतिबंधित नहीं होते।
  - हर मॉडल ID को मैन्युअल रूप से सूचीबद्ध किए बिना चयनित प्रदाताओं के सभी खोजे गए मॉडल दिखाने के लिए `"openai/*": {}` या `"vllm/*": {}` जैसी `provider/*` प्रविष्टियों का उपयोग करें।
  - जब उस प्रदाता के लिए गतिशील रूप से खोजे गए प्रत्येक मॉडल को समान रनटाइम का उपयोग करना हो, तो किसी `provider/*` प्रविष्टि में `agentRuntime` जोड़ें। सटीक `provider/model` रनटाइम नीति फिर भी वाइल्डकार्ड पर प्राथमिकता रखती है।
  - सुरक्षित मेटाडेटा संपादन: प्रविष्टियाँ जोड़ने के लिए `openclaw config set agents.defaults.models '<json>' --strict-json --merge` का उपयोग करें। जब तक आप `--replace` पास नहीं करते, `config set` ऐसे प्रतिस्थापनों को अस्वीकार करता है जो मौजूदा प्रविष्टियाँ हटा देंगे।
- `modelPolicy.allow`: स्पष्ट ओवरराइड अनुमति-सूची। उपनाम, सटीक `provider/model` संदर्भ और `openai/*` या `clawrouter/anthropic/*` जैसे अंतिम उपसर्ग वाइल्डकार्ड स्वीकार करता है। किसी भी मॉडल को अनुमति देने के लिए इसे छोड़ दें या `[]` का उपयोग करें। `agents.list[].modelPolicy.allow` उस एजेंट के लिए डिफ़ॉल्ट नीति को प्रतिस्थापित करता है; एक स्पष्ट रिक्त सूची उस एजेंट के लिए सभी को अनुमति देना चुनती है।
  - प्रदाता-क्षेत्रीय कॉन्फ़िगरेशन/ऑनबोर्डिंग प्रवाह चयनित प्रदाता मॉडल को इस मैप में मर्ज करते हैं और पहले से कॉन्फ़िगर असंबंधित प्रदाताओं को सुरक्षित रखते हैं।
  - प्रत्यक्ष OpenAI Responses मॉडल के लिए सर्वर-साइड Compaction स्वचालित रूप से सक्षम होता है। `context_management` का अंतःक्षेपण रोकने के लिए `params.responsesServerCompaction: false` या सीमा को ओवरराइड करने के लिए `params.responsesCompactThreshold` का उपयोग करें। [OpenAI सर्वर-साइड Compaction](/hi/providers/openai#advanced-configuration) देखें।
- `params`: सभी मॉडलों पर लागू वैश्विक डिफ़ॉल्ट प्रदाता पैरामीटर। `agents.defaults.params` पर सेट करें (जैसे `{ cacheRetention: "long" }`)।
- `params` मर्ज प्राथमिकता (कॉन्फ़िगरेशन): `agents.defaults.params` (वैश्विक आधार) को `agents.defaults.models["provider/model"].params` (प्रति-मॉडल) ओवरराइड करता है, फिर `agents.list[].params` (मिलती हुई एजेंट ID) कुंजी के अनुसार ओवरराइड करता है। विवरण के लिए [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching) देखें।
- `models.providers.openrouter.params.provider`: OpenRouter-व्यापी डिफ़ॉल्ट प्रदाता-रूटिंग नीति। OpenClaw इसे OpenRouter के अनुरोध `provider` ऑब्जेक्ट में अग्रेषित करता है; प्रति-मॉडल `agents.defaults.models["openrouter/<model>"].params.provider` और एजेंट पैरामीटर कुंजी के अनुसार ओवरराइड करते हैं। [OpenRouter प्रदाता रूटिंग](/hi/providers/openrouter#advanced-configuration) देखें।
- `params.extra_body`/`params.extraBody`: OpenAI-संगत प्रॉक्सी के `api: "openai-completions"` अनुरोध निकायों में मर्ज किया गया उन्नत पास-थ्रू JSON। यदि यह जनरेट की गई अनुरोध कुंजियों से टकराता है, तो अतिरिक्त निकाय को प्राथमिकता मिलती है; गैर-मूल पूर्णता मार्ग इसके बाद भी केवल-OpenAI `store` को हटा देते हैं।
- `params.chat_template_kwargs`: शीर्ष-स्तरीय `api: "openai-completions"` अनुरोध निकायों में मर्ज किए गए vLLM/OpenAI-संगत चैट-टेम्पलेट तर्क। `vllm/nemotron-3-*` के लिए सोच बंद होने पर, बंडल किया गया vLLM Plugin स्वचालित रूप से `enable_thinking: false` और `force_nonempty_content: true` भेजता है; स्पष्ट `chat_template_kwargs` जनरेट किए गए डिफ़ॉल्ट को ओवरराइड करते हैं और `extra_body.chat_template_kwargs` को फिर भी अंतिम प्राथमिकता मिलती है। कॉन्फ़िगर किए गए vLLM Qwen और Nemotron सोच मॉडल बहु-स्तरीय प्रयास क्रम के बजाय द्विआधारी `/think` विकल्प (`off`, `on`) उपलब्ध कराते हैं।
- `compat.thinkingFormat`: OpenAI-संगत सोच पेलोड शैली। Together-शैली `reasoning.enabled` के लिए `"together"`, Qwen-शैली शीर्ष-स्तरीय `enable_thinking` के लिए `"qwen"`, या vLLM जैसे अनुरोध-स्तरीय चैट-टेम्पलेट kwargs का समर्थन करने वाले Qwen-परिवार बैकएंड पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` का उपयोग करें। OpenClaw अक्षम सोच को `false` और सक्षम सोच को `true` से मैप करता है तथा कॉन्फ़िगर किए गए vLLM Qwen मॉडल इन प्रारूपों के लिए द्विआधारी `/think` विकल्प उपलब्ध कराते हैं।
- `compat.supportedReasoningEfforts`: प्रति-मॉडल OpenAI-संगत तर्क-प्रयास सूची। इसे वास्तव में स्वीकार करने वाले कस्टम एंडपॉइंट के लिए `"xhigh"` शामिल करें; इसके बाद OpenClaw उस कॉन्फ़िगर किए गए प्रदाता/मॉडल के लिए कमांड मेनू, Gateway सत्र पंक्तियों, सत्र पैच सत्यापन, एजेंट CLI सत्यापन और `llm-task` सत्यापन में `/think xhigh` उपलब्ध कराता है। जब बैकएंड किसी मानक स्तर के लिए प्रदाता-विशिष्ट मान चाहता हो, तो `compat.reasoningEffortMap` का उपयोग करें।
- `params.preserveThinking`: संरक्षित सोच के लिए केवल Z.AI का वैकल्पिक चयन। सक्षम होने और सोच चालू होने पर, OpenClaw `thinking.clear_thinking: false` भेजता है और पिछले `reasoning_content` को पुनः चलाता है; [Z.AI सोच और संरक्षित सोच](/hi/providers/zai#advanced-configuration) देखें।
- `localService`: स्थानीय/स्व-होस्टेड मॉडल सर्वरों के लिए वैकल्पिक प्रदाता-स्तरीय प्रक्रिया प्रबंधक। जब चयनित मॉडल उस प्रदाता का होता है, तो OpenClaw `healthUrl` (या `baseUrl + "/models"`) की जाँच करता है, एंडपॉइंट बंद होने पर `args` के साथ `command` शुरू करता है, `readyTimeoutMs` तक प्रतीक्षा करता है, फिर मॉडल अनुरोध भेजता है। `command` एक निरपेक्ष पथ होना चाहिए। `idleStopMs: 0` प्रक्रिया को OpenClaw के बंद होने तक चालू रखता है; धनात्मक मान, उतने निष्क्रिय मिलीसेकंड के बाद OpenClaw द्वारा शुरू की गई प्रक्रिया को रोक देता है। [स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services) देखें।
- रनटाइम नीति `agents.defaults` पर नहीं, बल्कि प्रदाताओं या मॉडलों पर होती है। प्रदाता-व्यापी नियमों के लिए `models.providers.<provider>.agentRuntime` या मॉडल-विशिष्ट नियमों के लिए `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` का उपयोग करें। केवल प्रदाता/मॉडल उपसर्ग कभी भी हार्नेस का चयन नहीं करता। रनटाइम सेट न होने या `auto` होने पर, OpenAI केवल बिना किसी लिखित अनुरोध ओवरराइड वाले सटीक आधिकारिक HTTPS Platform Responses या ChatGPT Responses रूट के लिए Codex को अप्रत्यक्ष रूप से चुन सकता है। [OpenAI का अप्रत्यक्ष एजेंट रनटाइम](/hi/providers/openai#implicit-agent-runtime) देखें।
- इन फ़ील्ड को बदलने वाले कॉन्फ़िगरेशन राइटर (उदाहरण के लिए `/models set`, `/models set-image`, और फ़ॉलबैक जोड़ने/हटाने वाली कमांड) कैनोनिकल ऑब्जेक्ट प्रारूप सहेजते हैं और जहाँ संभव हो, मौजूदा फ़ॉलबैक सूचियाँ बनाए रखते हैं।
- `maxConcurrent`: सभी सत्रों में समानांतर एजेंट रन की अधिकतम संख्या (प्रत्येक सत्र अब भी क्रमबद्ध रहता है)। डिफ़ॉल्ट: `4`।

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, कोई पंजीकृत Plugin हार्नेस आईडी, या कोई समर्थित CLI बैकएंड उपनाम। बंडल किया गया Codex Plugin `codex` पंजीकृत करता है; बंडल किया गया Anthropic Plugin `claude-cli` CLI बैकएंड प्रदान करता है।
- `id: "auto"` पंजीकृत Plugin हार्नेस को उन प्रभावी रूटों का दावा करने देता है जो उनके समर्थन अनुबंध की घोषणा करते हैं या अन्यथा उसे पूरा करते हैं, और कोई हार्नेस मेल न खाने पर OpenClaw का उपयोग करता है। `id: "codex"` जैसे स्पष्ट Plugin रनटाइम के लिए वह हार्नेस और एक संगत प्रभावी रूट आवश्यक हैं; दोनों में से कोई अनुपलब्ध होने या निष्पादन विफल होने पर यह बंद होकर विफल होता है।
- `id: "pi"` को v2026.5.22 और उससे पहले के जारी किए गए कॉन्फ़िगरेशन सुरक्षित रखने के लिए केवल `openclaw` के अप्रचलित उपनाम के रूप में स्वीकार किया जाता है। नए कॉन्फ़िगरेशन में `openclaw` का उपयोग होना चाहिए।
- रनटाइम वरीयता में पहले सटीक मॉडल नीति (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, या `models.providers.<provider>.models[]`), फिर `agents.list[]` / `agents.defaults.models["provider/*"]`, और उसके बाद `models.providers.<provider>.agentRuntime` पर प्रदाता-व्यापी नीति आती है।
- पूरे एजेंट की रनटाइम कुंजियाँ विरासती हैं। रनटाइम चयन में `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, सत्र रनटाइम पिन और `OPENCLAW_AGENT_RUNTIME` को अनदेखा किया जाता है। पुराने मान हटाने के लिए `openclaw doctor --fix` चलाएँ।
- बिना किसी लिखित अनुरोध ओवरराइड वाले पात्र, सटीक और आधिकारिक HTTPS OpenAI Responses/ChatGPT रूट Codex हार्नेस का अंतर्निहित रूप से उपयोग कर सकते हैं। प्रदाता/मॉडल `agentRuntime.id: "codex"` Codex को बंद होकर विफल होने वाली आवश्यकता बनाता है, लेकिन किसी असंगत रूट को संगत नहीं बनाता।
- Claude CLI परिनियोजनों के लिए `model: "anthropic/claude-opus-4-8"` के साथ मॉडल-क्षेत्रीय `agentRuntime.id: "claude-cli"` को प्राथमिकता दें। विरासती `claude-cli/<model>` संदर्भ संगतता के लिए अब भी काम करते हैं, लेकिन नए कॉन्फ़िगरेशन में प्रदाता/मॉडल चयन को मानक रखना चाहिए और निष्पादन बैकएंड को प्रदाता/मॉडल रनटाइम नीति में रखना चाहिए।
- यह केवल टेक्स्ट एजेंट-टर्न निष्पादन नियंत्रित करता है। मीडिया जनरेशन, विज़न, PDF, संगीत, वीडियो और TTS अब भी अपनी प्रदाता/मॉडल सेटिंग का उपयोग करते हैं।

**अंतर्निहित उपनाम संक्षिप्तियाँ** (केवल तब लागू होती हैं जब मॉडल `agents.defaults.models` में हो):

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

आपके कॉन्फ़िगर किए गए उपनाम हमेशा डिफ़ॉल्ट पर प्राथमिकता पाते हैं।

यदि आप `--thinking off` सेट नहीं करते या स्वयं `agents.defaults.models["zai/<model>"].params.thinking` परिभाषित नहीं करते, तो Z.AI GLM-4.x मॉडल स्वचालित रूप से थिंकिंग मोड सक्षम करते हैं।
टूल कॉल स्ट्रीमिंग के लिए Z.AI मॉडल डिफ़ॉल्ट रूप से `tool_stream` सक्षम करते हैं। इसे अक्षम करने के लिए `agents.defaults.models["zai/<model>"].params.tool_stream` को `false` पर सेट करें।
OpenClaw में Anthropic Claude Opus 4.8 डिफ़ॉल्ट रूप से थिंकिंग बंद रखता है; जब अनुकूली थिंकिंग स्पष्ट रूप से सक्षम होती है, तो Anthropic का प्रदाता-स्वामित्व वाला प्रयास डिफ़ॉल्ट `high` होता है। कोई स्पष्ट थिंकिंग स्तर सेट न होने पर Claude 4.6 मॉडल डिफ़ॉल्ट रूप से `adaptive` का उपयोग करते हैं।

### `agents.defaults.cliBackends`

केवल-टेक्स्ट फ़ॉलबैक रन के लिए वैकल्पिक CLI बैकएंड (कोई टूल कॉल नहीं)। API प्रदाता विफल होने पर बैकअप के रूप में उपयोगी।

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
          // या जब CLI कोई प्रॉम्प्ट फ़ाइल फ़्लैग स्वीकार करता हो, तब systemPromptFileArg का उपयोग करें।
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI बैकएंड टेक्स्ट-प्रथम होते हैं; टूल हमेशा अक्षम रहते हैं।
- `sessionArg` सेट होने पर सत्र समर्थित होते हैं।
- `imageArg` द्वारा फ़ाइल पथ स्वीकार किए जाने पर इमेज पास-थ्रू समर्थित होता है।
- `reseedFromRawTranscriptWhenUncompacted: true` पहले Compaction सारांश के अस्तित्व में आने से पहले किसी बैकएंड को सीमित अपरिष्कृत OpenClaw ट्रांसक्रिप्ट टेल से सुरक्षित रूप से अमान्य किए गए सत्रों को पुनर्प्राप्त करने देता है। प्रमाणीकरण प्रोफ़ाइल या क्रेडेंशियल-युग में परिवर्तन होने पर अब भी अपरिष्कृत सामग्री से पुनः सीडिंग कभी नहीं होती।

### `agents.defaults.promptOverlays`

OpenClaw द्वारा संयोजित प्रॉम्प्ट सतहों पर मॉडल परिवार के अनुसार लागू होने वाले प्रदाता-स्वतंत्र प्रॉम्प्ट ओवरले। GPT-5-परिवार मॉडल आईडी OpenClaw/प्रदाता रूटों पर साझा व्यवहार अनुबंध प्राप्त करते हैं; `personality` केवल अनुकूल संवाद-शैली परत को नियंत्रित करता है। मूल Codex ऐप-सर्वर रूट इस OpenClaw GPT-5 ओवरले के बजाय Codex-स्वामित्व वाले आधार/मॉडल निर्देश रखते हैं, और OpenClaw मूल थ्रेड के लिए Codex के अंतर्निहित व्यक्तित्व को अक्षम करता है।

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

- `"friendly"` (डिफ़ॉल्ट) और `"on"` अनुकूल संवाद-शैली परत सक्षम करते हैं।
- `"off"` केवल अनुकूल परत को अक्षम करता है; टैग किया गया GPT-5 व्यवहार अनुबंध सक्षम रहता है।
- यह साझा सेटिंग सेट न होने पर विरासती `plugins.entries.openai.config.personality` को अब भी पढ़ा जाता है।

### `agents.defaults.heartbeat`

आवधिक Heartbeat रन।

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m अक्षम करता है
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // डिफ़ॉल्ट: true; false सिस्टम प्रॉम्प्ट से Heartbeat अनुभाग हटा देता है
        lightContext: false, // डिफ़ॉल्ट: false; true वर्कस्पेस बूटस्ट्रैप फ़ाइलों में से केवल HEARTBEAT.md रखता है
        isolatedSession: false, // डिफ़ॉल्ट: false; true प्रत्येक Heartbeat को नए सत्र में चलाता है (कोई वार्तालाप इतिहास नहीं)
        skipWhenBusy: false, // डिफ़ॉल्ट: false; true इस एजेंट के उप-एजेंट/नेस्टेड लेन के लिए भी प्रतीक्षा करता है
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (डिफ़ॉल्ट) | block
        target: "none", // डिफ़ॉल्ट: none | विकल्प: last | whatsapp | telegram | discord | ...
        prompt: "यदि HEARTBEAT.md मौजूद हो तो उसे पढ़ें...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: अवधि स्ट्रिंग (ms/s/m/h)। डिफ़ॉल्ट: `30m` (API-कुंजी प्रमाणीकरण) या `1h` (OAuth प्रमाणीकरण)। अक्षम करने के लिए `0m` पर सेट करें।
- `includeSystemPromptSection`: false होने पर सिस्टम प्रॉम्प्ट से Heartbeat अनुभाग हटा देता है और बूटस्ट्रैप संदर्भ में `HEARTBEAT.md` का अंतःक्षेपण छोड़ देता है। डिफ़ॉल्ट: `true`।
- `suppressToolErrorWarnings`: true होने पर Heartbeat रन के दौरान टूल त्रुटि चेतावनी पेलोड दबा देता है।
- `timeoutSeconds`: Heartbeat एजेंट टर्न को निरस्त किए जाने से पहले अनुमत अधिकतम समय, सेकंड में। सेट न होने पर, यदि `agents.defaults.timeoutSeconds` सेट है तो उसका उपयोग होता है; अन्यथा 600 सेकंड की सीमा वाली Heartbeat आवृत्ति का उपयोग होता है।
- `directPolicy`: प्रत्यक्ष/DM डिलीवरी नीति। `allow` (डिफ़ॉल्ट) प्रत्यक्ष-लक्ष्य डिलीवरी की अनुमति देता है। `block` प्रत्यक्ष-लक्ष्य डिलीवरी को दबाता है और `reason=dm-blocked` उत्सर्जित करता है।
- `lightContext`: true होने पर Heartbeat रन हल्के बूटस्ट्रैप संदर्भ का उपयोग करते हैं और वर्कस्पेस बूटस्ट्रैप फ़ाइलों में से केवल `HEARTBEAT.md` रखते हैं।
- `isolatedSession`: true होने पर प्रत्येक Heartbeat बिना किसी पिछले वार्तालाप इतिहास के नए सत्र में चलता है। Cron `sessionTarget: "isolated"` के समान पृथक्करण प्रतिरूप। प्रति-Heartbeat टोकन लागत को ~100K से घटाकर ~2-5K टोकन करता है।
- `skipWhenBusy`: true होने पर Heartbeat रन उस एजेंट की अतिरिक्त व्यस्त लेन के लिए स्थगित होते हैं: उसका अपना सत्र-कुंजीयुक्त उप-एजेंट या नेस्टेड कमांड कार्य। इस फ़्लैग के बिना भी Cron लेन हमेशा Heartbeat स्थगित करती हैं।
- प्रति-एजेंट: `agents.list[].heartbeat` सेट करें। जब कोई एजेंट `heartbeat` परिभाषित करता है, तो **केवल वे एजेंट** Heartbeat चलाते हैं।
- Heartbeat पूर्ण एजेंट टर्न चलाते हैं—कम अंतराल अधिक टोकन खर्च करते हैं।

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // पंजीकृत Compaction प्रदाता Plugin की आईडी (वैकल्पिक)
        thinkingLevel: "low", // वैकल्पिक केवल-Compaction थिंकिंग ओवरराइड
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "परिनियोजन आईडी, टिकट आईडी और host:port युग्मों को सटीक रूप से सुरक्षित रखें।", // identifierPolicy=custom होने पर उपयोग किया जाता है
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // वैकल्पिक टूल-लूप दबाव जाँच
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md अनुभागों के पुनः अंतःक्षेपण के लिए ऑप्ट इन करें
        model: "openrouter/anthropic/claude-sonnet-4-6", // वैकल्पिक केवल-Compaction मॉडल ओवरराइड
        truncateAfterCompaction: true, // Compaction के बाद छोटे उत्तराधिकारी JSONL में घुमाएँ
        maxActiveTranscriptBytes: "20mb", // वैकल्पिक प्रीफ़्लाइट स्थानीय Compaction ट्रिगर
        notifyUser: true, // Compaction आरंभ/पूर्ण होने और मेमोरी-फ़्लश अवनति पर सूचनाएँ (डिफ़ॉल्ट: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // वैकल्पिक केवल-मेमोरी-फ़्लश मॉडल ओवरराइड
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "सत्र Compaction के निकट है। स्थायी स्मृतियाँ अभी संग्रहीत करें।",
          prompt: "किसी भी स्थायी नोट को memory/YYYY-MM-DD.md में लिखें; यदि संग्रहीत करने के लिए कुछ नहीं है, तो सटीक मौन टोकन NO_REPLY के साथ उत्तर दें।",
        },
      },
    },
  },
}
```

- `mode`: `default` या `safeguard` (लंबे इतिहासों के लिए खंडित सारांश)। [Compaction](/hi/concepts/compaction) देखें।
- `provider`: पंजीकृत Compaction प्रदाता Plugin की आईडी। इसे सेट करने पर, अंतर्निहित LLM सारांश के बजाय प्रदाता का `summarize()` कॉल किया जाता है। विफलता पर अंतर्निहित विकल्प पर वापस जाता है। प्रदाता सेट करने से `mode: "safeguard"` बाध्य हो जाता है। [Compaction](/hi/concepts/compaction) देखें।
- `thinkingLevel`: वैकल्पिक विचार स्तर, जिसका उपयोग केवल एम्बेडेड OpenClaw Compaction सारांशों (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`, या `ultra`) के लिए होता है। यह सत्र के वर्तमान विचार स्तर को ओवरराइड करता है और चयनित Compaction मॉडल/रनटाइम की सीमा में रखा जाता है। सत्र स्तर इनहेरिट करने के लिए इसे सेट न करें। नेटिव Codex app-server Compaction इस सेटिंग को अनदेखा करता है, क्योंकि नेटिव compact अनुरोध में प्रत्येक ऑपरेशन के लिए अलग विचार ओवरराइड नहीं होता; कॉन्फ़िगर किए जाने पर OpenClaw चेतावनी लॉग करता है।
- `timeoutSeconds`: OpenClaw द्वारा किसी एक Compaction ऑपरेशन को निरस्त करने से पहले उसके लिए अनुमत अधिकतम सेकंड। डिफ़ॉल्ट: `180`।
- `keepRecentTokens`: सबसे हाल की ट्रांसक्रिप्ट टेल को अक्षरशः बनाए रखने के लिए एजेंट कट-पॉइंट बजट। स्पष्ट रूप से सेट होने पर मैन्युअल `/compact` इसका पालन करता है; अन्यथा मैन्युअल Compaction एक हार्ड चेकपॉइंट होता है।
- `recentTurnsPreserve`: सुरक्षा-सारांश के बाहर अक्षरशः रखे गए सबसे हाल के उपयोगकर्ता/सहायक टर्न की संख्या। डिफ़ॉल्ट: `3`।
- `identifierPolicy`: `strict` (डिफ़ॉल्ट), `off`, या `custom`। `strict` Compaction सारांश के दौरान अंतर्निहित अपारदर्शी पहचानकर्ता प्रतिधारण मार्गदर्शन को प्रारंभ में जोड़ता है।
- `identifierInstructions`: `identifierPolicy=custom` होने पर उपयोग किया जाने वाला वैकल्पिक कस्टम पहचानकर्ता-संरक्षण टेक्स्ट।
- `qualityGuard`: सुरक्षा-सारांशों के लिए विकृत आउटपुट पर पुनः प्रयास जाँच। सुरक्षा मोड में डिफ़ॉल्ट रूप से सक्षम; ऑडिट छोड़ने के लिए `enabled: false` सेट करें।
- `midTurnPrecheck`: वैकल्पिक टूल-लूप दबाव जाँच। `enabled: true` होने पर, OpenClaw टूल परिणाम जोड़े जाने के बाद और अगले मॉडल कॉल से पहले संदर्भ दबाव की जाँच करता है। यदि संदर्भ अब समाहित नहीं हो सकता, तो यह प्रॉम्प्ट सबमिट करने से पहले वर्तमान प्रयास निरस्त करता है और टूल परिणामों को छोटा करने या Compaction करके पुनः प्रयास करने के लिए मौजूदा प्रीचेक रिकवरी पथ का पुनः उपयोग करता है। `default` और `safeguard`, दोनों Compaction मोड के साथ काम करता है। डिफ़ॉल्ट: अक्षम।
- `postIndexSync`: Compaction के बाद सत्र-मेमोरी पुनः इंडेक्स करने का मोड। डिफ़ॉल्ट: `"async"`। सर्वाधिक नवीनता के लिए `"await"`, कम Compaction विलंबता के लिए `"async"`, या केवल तब `"off"` उपयोग करें जब सत्र-मेमोरी सिंक अन्यत्र संभाला जाता हो।
- `postCompactionSections`: Compaction के बाद पुनः इंजेक्ट किए जाने वाले वैकल्पिक AGENTS.md H2/H3 अनुभाग नाम। सेट न होने या `[]` पर सेट होने पर पुनः इंजेक्शन अक्षम रहता है। `["Session Startup", "Red Lines"]` को स्पष्ट रूप से सेट करने पर वह युग्म सक्षम होता है और पुराना `Every Session`/`Safety` फ़ॉलबैक सुरक्षित रहता है। इसे केवल तभी सक्षम करें जब अतिरिक्त संदर्भ, Compaction सारांश में पहले से शामिल परियोजना मार्गदर्शन की नकल होने के जोखिम के योग्य हो।
- `model`: केवल Compaction सारांश के लिए वैकल्पिक `provider/model-id` या `agents.defaults.models` का सामान्य उपनाम। सामान्य उपनाम डिस्पैच से पहले रिज़ॉल्व होते हैं; टकराव होने पर कॉन्फ़िगर किए गए शाब्दिक मॉडल आईडी को प्राथमिकता मिलती है। इसका उपयोग तब करें जब मुख्य सत्र में एक मॉडल बनाए रखना हो, लेकिन Compaction सारांश दूसरे मॉडल पर चलने चाहिए; सेट न होने पर Compaction सत्र के प्राथमिक मॉडल का उपयोग करता है।
- `truncateAfterCompaction`: Compaction के बाद सक्रिय सत्र ट्रांसक्रिप्ट को घुमाता है, ताकि भविष्य के टर्न केवल सारांश और असारांशित टेल लोड करें, जबकि पिछली पूरी ट्रांसक्रिप्ट संग्रहीत रहे। लंबे समय तक चलने वाले सत्रों में सक्रिय ट्रांसक्रिप्ट की असीमित वृद्धि रोकता है। डिफ़ॉल्ट: `false`।
- `maxActiveTranscriptBytes`: वैकल्पिक बाइट सीमा (`number` या `"20mb"` जैसी स्ट्रिंग), जो ट्रांसक्रिप्ट इतिहास के सीमा से अधिक बढ़ने पर रन से पहले सामान्य स्थानीय Compaction ट्रिगर करती है। `truncateAfterCompaction` आवश्यक है, ताकि सफल Compaction किसी छोटे उत्तराधिकारी ट्रांसक्रिप्ट पर घुमा सके। सेट न होने या `0` होने पर अक्षम।
- `notifyUser`: `true` होने पर, उपयोगकर्ता को संक्षिप्त संदर्भ-रखरखाव सूचनाएँ भेजता है: Compaction शुरू और पूरा होने पर (उदाहरण के लिए, "संदर्भ को संक्षिप्त किया जा रहा है..." और "Compaction पूर्ण"), और जब Compaction से पहले मेमोरी फ़्लश समाप्त हो जाता है, जिससे उत्तर घटित अवस्था में जारी रहता है (उदाहरण के लिए, "मेमोरी रखरखाव अस्थायी रूप से विफल हुआ; आपका उत्तर जारी रखा जा रहा है।")। इन सूचनाओं को मौन रखने के लिए डिफ़ॉल्ट रूप से अक्षम।
- `memoryFlush`: टिकाऊ स्मृतियाँ संग्रहीत करने के लिए स्वतः Compaction से पहले मौन एजेंटिक टर्न। जब इस रखरखाव टर्न को स्थानीय मॉडल पर रखना हो, तब `model` को `ollama/qwen3:8b` जैसे सटीक प्रदाता/मॉडल पर सेट करें; ओवरराइड सक्रिय सत्र फ़ॉलबैक शृंखला इनहेरिट नहीं करता। टोकन काउंटर पुराने होने पर भी, ट्रांसक्रिप्ट आकार सीमा तक पहुँचने पर `forceFlushTranscriptBytes` फ़्लश को बाध्य करता है। कार्यक्षेत्र केवल-पढ़ने योग्य होने पर इसे छोड़ दिया जाता है।

### `agents.defaults.contextPruning`

LLM को भेजने से पहले इन-मेमोरी संदर्भ से **पुराने टूल परिणामों** को हटाता है। डिस्क पर सत्र इतिहास को संशोधित **नहीं** करता। डिफ़ॉल्ट रूप से अक्षम; सक्षम करने के लिए `mode: "cache-ttl"` सेट करें।

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // बंद (डिफ़ॉल्ट) | cache-ttl
      },
    },
  },
}
```

<Accordion title="cache-ttl मोड का व्यवहार">

- `mode: "cache-ttl"` हटाने के पास सक्षम करता है।
- हटाने की प्रक्रिया पहले अधिक बड़े टूल परिणामों को हल्के रूप से छोटा करती है, फिर आवश्यकता होने पर पुराने टूल परिणामों को पूरी तरह साफ़ करती है।

**हल्का संक्षिप्तीकरण** शुरुआत + अंत बनाए रखता है और बीच में `...` सम्मिलित करता है।

**पूर्ण सफ़ाई** पूरे टूल परिणाम को प्लेसहोल्डर से बदल देती है।

टिप्पणियाँ:

- इमेज ब्लॉक कभी छोटे/साफ़ नहीं किए जाते।
- अनुपात वर्ण-आधारित (अनुमानित) होते हैं, सटीक टोकन गणनाएँ नहीं।
- सबसे हाल के सहायक संदेश सुरक्षित रखे जाते हैं।

</Accordion>

व्यवहार के विवरण के लिए [सत्र प्रूनिंग](/hi/concepts/session-pruning) देखें।

### ब्लॉक स्ट्रीमिंग

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // चालू | बंद
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // बंद (डिफ़ॉल्ट) | natural | custom (minMs/maxMs उपयोग करें)
    },
  },
}
```

- गैर-Telegram चैनलों में ब्लॉक उत्तर सक्षम करने के लिए स्पष्ट `*.streaming.block.enabled: true` आवश्यक है। QQ Bot अपवाद है: इसमें `streaming.block` कुंजियाँ नहीं हैं और यह ब्लॉक उत्तर स्ट्रीम करता है, जब तक `channels.qqbot.streaming.mode`, `"off"` न हो।
- चैनल ओवरराइड: `channels.<channel>.streaming.block.coalesce` (और प्रति-अकाउंट प्रकार)। Discord, Google Chat, Mattermost, MS Teams, Signal, और Slack डिफ़ॉल्ट रूप से `minChars: 1500` / `idleMs: 1000` होते हैं।
- `blockStreamingChunk.breakPreference`: पसंदीदा खंड सीमा (`"paragraph" | "newline" | "sentence"`)।
- `humanDelay`: ब्लॉक उत्तरों के बीच यादृच्छिक विराम। डिफ़ॉल्ट: `off`। `natural` = 800-2500ms। `custom`, `minMs`/`maxMs` का उपयोग करता है (सेट न की गई किसी भी सीमा के लिए प्राकृतिक रेंज पर वापस जाता है)। प्रति-एजेंट ओवरराइड: `agents.list[].humanDelay`।

व्यवहार + खंडन के विवरण के लिए [स्ट्रीमिंग](/hi/concepts/streaming) देखें।

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

- डिफ़ॉल्ट: प्रत्यक्ष चैट/उल्लेखों के लिए `instant`, बिना उल्लेख वाली समूह चैट के लिए `message`।
- `typingIntervalSeconds` डिफ़ॉल्ट: `6`।
- प्रति-सत्र ओवरराइड: `session.typingMode`।

[टाइपिंग संकेतक](/hi/concepts/typing-indicators) देखें।

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

एम्बेडेड एजेंट के लिए वैकल्पिक सैंडबॉक्सिंग। पूरी मार्गदर्शिका के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (डिफ़ॉल्ट) | non-main | all
        backend: "docker", // docker (डिफ़ॉल्ट) | ssh | openshell
        scope: "agent", // session | agent (डिफ़ॉल्ट) | shared
        workspaceAccess: "none", // none (डिफ़ॉल्ट) | ro | rw
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
          gpus: "all",
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
          // SecretRefs / इनलाइन सामग्री भी समर्थित है:
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

ऊपर दिखाए गए डिफ़ॉल्ट (`off`/`docker`/`agent`/`none`/`bookworm-slim` इमेज/`none` नेटवर्क/आदि) केवल उदाहरणात्मक मान नहीं, बल्कि वास्तविक OpenClaw डिफ़ॉल्ट हैं।

<Accordion title="सैंडबॉक्स विवरण">

**बैकएंड:**

- `docker`: स्थानीय Docker रनटाइम (डिफ़ॉल्ट)
- `ssh`: सामान्य SSH-समर्थित रिमोट रनटाइम
- `openshell`: OpenShell रनटाइम

जब `backend: "openshell"` चुना जाता है, तो रनटाइम-विशिष्ट सेटिंग्स
`plugins.entries.openshell.config` में चली जाती हैं।

**SSH बैकएंड कॉन्फ़िगरेशन:**

- `target`: `user@host[:port]` प्रारूप में SSH लक्ष्य
- `command`: SSH क्लाइंट कमांड (डिफ़ॉल्ट: `ssh`)
- `workspaceRoot`: प्रति-स्कोप कार्यस्थानों के लिए उपयोग किया जाने वाला निरपेक्ष रिमोट रूट (डिफ़ॉल्ट: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH को दी जाने वाली मौजूदा स्थानीय फ़ाइलें
- `identityData` / `certificateData` / `knownHostsData`: इनलाइन सामग्री या SecretRefs, जिन्हें OpenClaw रनटाइम पर अस्थायी फ़ाइलों में साकार करता है
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH होस्ट-कुंजी नीति नियंत्रण (दोनों का डिफ़ॉल्ट `true`)

**SSH प्रमाणीकरण प्राथमिकता:**

- `identityData` को `identityFile` पर प्राथमिकता मिलती है
- `certificateData` को `certificateFile` पर प्राथमिकता मिलती है
- `knownHostsData` को `knownHostsFile` पर प्राथमिकता मिलती है
- SecretRef-समर्थित `*Data` मानों को सैंडबॉक्स सत्र शुरू होने से पहले सक्रिय सीक्रेट रनटाइम स्नैपशॉट से हल किया जाता है

**SSH बैकएंड व्यवहार:**

- बनाने या फिर से बनाने के बाद रिमोट कार्यस्थान को एक बार आरंभिक डेटा देता है
- फिर रिमोट SSH कार्यस्थान को प्रामाणिक बनाए रखता है
- `exec`, फ़ाइल टूल और मीडिया पथों को SSH के माध्यम से रूट करता है
- रिमोट परिवर्तनों को स्वचालित रूप से वापस होस्ट के साथ सिंक नहीं करता
- सैंडबॉक्स ब्राउज़र कंटेनरों का समर्थन नहीं करता

**कार्यस्थान पहुँच:**

- `none`: `~/.openclaw/sandboxes` के अंतर्गत प्रति-स्कोप सैंडबॉक्स कार्यस्थान (डिफ़ॉल्ट)
- `ro`: `/workspace` पर सैंडबॉक्स कार्यस्थान, `/agent` पर केवल-पठन के रूप में माउंट किया गया एजेंट कार्यस्थान
- `rw`: `/workspace` पर पठन/लेखन के रूप में माउंट किया गया एजेंट कार्यस्थान

**स्कोप:**

- `session`: प्रति-सत्र कंटेनर + कार्यस्थान
- `agent`: प्रत्येक एजेंट के लिए एक कंटेनर + कार्यस्थान (डिफ़ॉल्ट)
- `shared`: साझा कंटेनर और कार्यस्थान (सत्रों के बीच कोई पृथक्करण नहीं)

**OpenShell Plugin कॉन्फ़िगरेशन:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // मिरर (डिफ़ॉल्ट) | रिमोट
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // वैकल्पिक
          gatewayEndpoint: "https://lab.example", // वैकल्पिक
          policy: "strict", // वैकल्पिक OpenShell नीति आईडी
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

- `mirror`: निष्पादन से पहले स्थानीय से रिमोट में आरंभिक डेटा दें, निष्पादन के बाद वापस सिंक करें; स्थानीय कार्यस्थान प्रामाणिक रहता है
- `remote`: सैंडबॉक्स बनाए जाने पर रिमोट में एक बार आरंभिक डेटा दें, फिर रिमोट कार्यस्थान को प्रामाणिक बनाए रखें

`remote` मोड में, आरंभिक डेटा देने के चरण के बाद OpenClaw के बाहर किए गए होस्ट-स्थानीय संपादन स्वचालित रूप से सैंडबॉक्स में सिंक नहीं होते।
ट्रांसपोर्ट OpenShell सैंडबॉक्स में SSH है, लेकिन Plugin सैंडबॉक्स जीवनचक्र और वैकल्पिक मिरर सिंक का स्वामी है।

**`setupCommand`** कंटेनर बनने के बाद एक बार चलता है (`sh -lc` के माध्यम से)। नेटवर्क निर्गमन, लिखने योग्य रूट और रूट उपयोगकर्ता आवश्यक हैं।

**कंटेनरों का डिफ़ॉल्ट `network: "none"` होता है** — यदि एजेंट को आउटबाउंड पहुँच चाहिए, तो इसे `"bridge"` (या किसी कस्टम ब्रिज नेटवर्क) पर सेट करें।
`"host"` अवरुद्ध है। जब तक आप स्पष्ट रूप से
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (आपातकालीन अपवाद) सेट नहीं करते, `"container:<id>"` डिफ़ॉल्ट रूप से अवरुद्ध रहता है।
सक्रिय OpenClaw सैंडबॉक्स में Codex ऐप-सर्वर टर्न अपने नेटिव कोड-मोड नेटवर्क एक्सेस के लिए इसी निर्गमन सेटिंग का उपयोग करते हैं।

**इनबाउंड अटैचमेंट** सक्रिय कार्यस्थान में `media/inbound/*` में रखे जाते हैं।

**`docker.binds`** अतिरिक्त होस्ट डायरेक्टरियाँ माउंट करता है; वैश्विक और प्रति-एजेंट बाइंड मर्ज किए जाते हैं।

**सैंडबॉक्स किया गया ब्राउज़र** (`sandbox.browser.enabled`, डिफ़ॉल्ट `false`): एक कंटेनर में Chromium + CDP। noVNC URL सिस्टम प्रॉम्प्ट में जोड़ा जाता है। `openclaw.json` में `browser.enabled` की आवश्यकता नहीं होती।
noVNC पर्यवेक्षक पहुँच डिफ़ॉल्ट रूप से VNC प्रमाणीकरण का उपयोग करती है और OpenClaw साझा URL में पासवर्ड उजागर करने के बजाय एक अल्पकालिक टोकन URL जारी करता है।

- `allowHostControl: false` (डिफ़ॉल्ट) सैंडबॉक्स किए गए सत्रों को होस्ट ब्राउज़र को लक्षित करने से रोकता है।
- `network` का डिफ़ॉल्ट `openclaw-sandbox-browser` (समर्पित ब्रिज नेटवर्क) है। केवल तभी `bridge` पर सेट करें जब आप स्पष्ट रूप से वैश्विक ब्रिज कनेक्टिविटी चाहते हों। यहाँ भी `"host"` अवरुद्ध है।
- `cdpSourceRange` वैकल्पिक रूप से कंटेनर की सीमा पर CDP प्रवेश को किसी CIDR रेंज तक सीमित करता है (उदाहरण के लिए `172.21.0.1/32`)।
- `sandbox.browser.binds` अतिरिक्त होस्ट डायरेक्टरियों को केवल सैंडबॉक्स ब्राउज़र कंटेनर में माउंट करता है। सेट होने पर (`[]` सहित), यह ब्राउज़र कंटेनर के लिए `docker.binds` को प्रतिस्थापित करता है।
- सैंडबॉक्स ब्राउज़र कंटेनर का Chromium हमेशा `--no-sandbox --disable-setuid-sandbox` के साथ लॉन्च होता है (कंटेनरों में वे कर्नेल प्रिमिटिव नहीं होते जिनकी Chrome के अपने सैंडबॉक्स को आवश्यकता होती है); इसके लिए कोई कॉन्फ़िगरेशन टॉगल नहीं है।
- लॉन्च डिफ़ॉल्ट `scripts/sandbox-browser-entrypoint.sh` में परिभाषित हैं और कंटेनर होस्ट के लिए अनुकूलित हैं:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu`, और `--disable-software-rasterizer`
    डिफ़ॉल्ट रूप से सक्षम हैं और यदि WebGL/3D उपयोग के लिए आवश्यक हो, तो
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` के साथ अक्षम किए जा सकते हैं।
  - `--disable-extensions` (डिफ़ॉल्ट रूप से सक्षम); यदि आपका कार्यप्रवाह उन पर निर्भर है, तो `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    एक्सटेंशन को फिर से सक्षम करता है।
  - डिफ़ॉल्ट रूप से `--renderer-process-limit=2`; इसे
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` के साथ बदलें, Chromium की
    डिफ़ॉल्ट प्रक्रिया सीमा का उपयोग करने के लिए `0` सेट करें।
  - केवल तभी `--headless=new`, जब `headless` सक्षम हो।
  - डिफ़ॉल्ट कंटेनर इमेज की आधाररेखा हैं; कंटेनर डिफ़ॉल्ट बदलने के लिए कस्टम
    एंट्रीपॉइंट वाली कस्टम ब्राउज़र इमेज का उपयोग करें।

</Accordion>

ब्राउज़र सैंडबॉक्सिंग और `sandbox.docker.binds` केवल Docker में उपलब्ध हैं।

इमेज बनाएँ (स्रोत चेकआउट से):

```bash
scripts/sandbox-setup.sh           # मुख्य सैंडबॉक्स इमेज
scripts/sandbox-browser-setup.sh   # वैकल्पिक ब्राउज़र इमेज
```

स्रोत चेकआउट के बिना npm इंस्टॉल के लिए, इनलाइन `docker build` कमांड हेतु [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) देखें।

### `agents.list` (प्रति-एजेंट ओवरराइड)

किसी एजेंट को उसका अपना TTS प्रदाता, आवाज़, मॉडल,
शैली या स्वचालित-TTS मोड देने के लिए `agents.list[].tts` का उपयोग करें। एजेंट ब्लॉक वैश्विक
`messages.tts` पर डीप-मर्ज होता है, इसलिए साझा क्रेडेंशियल एक ही स्थान पर रह सकते हैं, जबकि अलग-अलग
एजेंट केवल आवश्यक आवाज़ या प्रदाता फ़ील्ड ओवरराइड कर सकते हैं। सक्रिय एजेंट का
ओवरराइड स्वचालित बोले गए उत्तरों, `/tts audio`, `/tts status`, और
`tts` एजेंट टूल पर लागू होता है। प्रदाता उदाहरणों और प्राथमिकता के लिए
[टेक्स्ट-टू-स्पीच](/hi/tools/tts#per-agent-voice-overrides) देखें।

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "मुख्य एजेंट",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // या { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // प्रति-एजेंट चिंतन स्तर ओवरराइड
        reasoningDefault: "on", // प्रति-एजेंट तर्क दृश्यता ओवरराइड
        fastModeDefault: false, // प्रति-एजेंट तेज़ मोड ओवरराइड
        params: { cacheRetention: "none" }, // कुंजी के अनुसार मेल खाने वाले defaults.models params को ओवरराइड करता है
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // सेट होने पर agents.defaults.skills को प्रतिस्थापित करता है
        identity: {
          name: "Samantha",
          theme: "सहायक स्लॉथ",
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
            mode: "persistent", // persistent | oneshot
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

- `id`: स्थिर एजेंट आईडी (आवश्यक)।
- `default`: जब एक से अधिक सेट हों, तो पहला प्रभावी होता है (चेतावनी लॉग की जाती है)। यदि कोई सेट न हो, तो सूची की पहली प्रविष्टि डिफ़ॉल्ट होती है।
- `model`: स्ट्रिंग रूप बिना किसी मॉडल फ़ॉलबैक के सख्त प्रति-एजेंट प्राथमिक मॉडल सेट करता है; ऑब्जेक्ट रूप `{ primary }` भी सख्त होता है, जब तक कि आप `fallbacks` न जोड़ें। उस एजेंट के लिए फ़ॉलबैक सक्षम करने हेतु `{ primary, fallbacks: [...] }` का उपयोग करें, या सख्त व्यवहार को स्पष्ट बनाने हेतु `{ primary, fallbacks: [] }` का उपयोग करें। केवल `primary` को ओवरराइड करने वाले Cron जॉब अब भी डिफ़ॉल्ट फ़ॉलबैक इनहेरिट करते हैं, जब तक कि आप `fallbacks: []` सेट न करें।
- `utilityModel`: जनरेट किए गए सत्र और थ्रेड शीर्षकों जैसे छोटे आंतरिक कार्यों के लिए वैकल्पिक प्रति-एजेंट ओवरराइड। यह पहले `agents.defaults.utilityModel` पर और फिर प्रभावी सत्र प्रदाता द्वारा घोषित छोटे-मॉडल के डिफ़ॉल्ट पर फ़ॉलबैक करता है। डैशबोर्ड शीर्षक प्रभावी नियमित सत्र मॉडल के साथ एक बार पुनः प्रयास करते हैं। खाली स्ट्रिंग डैशबोर्ड शीर्षक जनरेशन को अक्षम किए बिना इस एजेंट के लिए वैकल्पिक उपयोगिता मार्ग छोड़ देती है।
- `params`: `agents.defaults.models` में चयनित मॉडल प्रविष्टि के ऊपर मर्ज किए गए प्रति-एजेंट स्ट्रीम पैरामीटर। पूरे मॉडल कैटलॉग की प्रतिलिपि बनाए बिना `cacheRetention`, `temperature`, या `maxTokens` जैसे एजेंट-विशिष्ट ओवरराइड के लिए इसका उपयोग करें।
- `tts`: वैकल्पिक प्रति-एजेंट टेक्स्ट-टू-स्पीच ओवरराइड। यह ब्लॉक `messages.tts` के ऊपर डीप-मर्ज होता है, इसलिए साझा प्रदाता क्रेडेंशियल और फ़ॉलबैक नीति को `messages.tts` में रखें और यहाँ केवल व्यक्तित्व-विशिष्ट मान, जैसे प्रदाता, आवाज़, मॉडल, शैली या स्वचालित मोड सेट करें।
- `skills`: वैकल्पिक प्रति-एजेंट स्किल अनुमति-सूची। इसे छोड़ने पर, सेट होने की स्थिति में एजेंट `agents.defaults.skills` इनहेरिट करता है; स्पष्ट सूची मर्ज होने के बजाय डिफ़ॉल्ट को प्रतिस्थापित करती है, और `[]` का अर्थ है कोई स्किल नहीं।
- `thinkingDefault`: वैकल्पिक प्रति-एजेंट डिफ़ॉल्ट चिंतन स्तर (`off | minimal | low | medium | high | xhigh | adaptive | max`)। जब कोई प्रति-संदेश या सत्र ओवरराइड सेट न हो, तो यह इस एजेंट के लिए `agents.defaults.thinkingDefault` को ओवरराइड करता है। चयनित प्रदाता/मॉडल प्रोफ़ाइल नियंत्रित करती है कि कौन-से मान मान्य हैं; Google Gemini के लिए, `adaptive` प्रदाता-नियंत्रित गतिशील चिंतन बनाए रखता है (Gemini 3/3.1 पर `thinkingLevel` छोड़ा जाता है, Gemini 2.5 पर `thinkingBudget: -1`)।
- `reasoningDefault`: वैकल्पिक प्रति-एजेंट डिफ़ॉल्ट तर्क दृश्यता (`on | off | stream`)। जब कोई प्रति-संदेश या सत्र तर्क ओवरराइड सेट न हो, तो यह इस एजेंट के लिए `agents.defaults.reasoningDefault` को ओवरराइड करता है।
- `fastModeDefault`: तेज़ मोड के लिए वैकल्पिक प्रति-एजेंट डिफ़ॉल्ट (`"auto" | true | false`)। यह तब लागू होता है, जब कोई प्रति-संदेश या सत्र तेज़-मोड ओवरराइड सेट न हो।
- `models`: पूर्ण `provider/model` आईडी द्वारा कुंजीबद्ध वैकल्पिक प्रति-एजेंट मॉडल कैटलॉग/रनटाइम ओवरराइड। प्रति-एजेंट रनटाइम अपवादों के लिए `models["provider/model"].agentRuntime` का उपयोग करें।
- `runtime`: वैकल्पिक प्रति-एजेंट रनटाइम वर्णनकर्ता। जब एजेंट को डिफ़ॉल्ट रूप से ACP हार्नेस सत्रों का उपयोग करना चाहिए, तो `runtime.acp` डिफ़ॉल्ट (`agent`, `backend`, `mode`, `cwd`) के साथ `type: "acp"` का उपयोग करें।
- `identity.avatar`: कार्यक्षेत्र-सापेक्ष पथ, `http(s)` URL, या `data:` URI।
- स्थानीय कार्यक्षेत्र-सापेक्ष `identity.avatar` छवि फ़ाइलों की सीमा 2 MB है। `http(s)` URL और `data:` URI की जाँच स्थानीय फ़ाइल-आकार सीमा के विरुद्ध नहीं की जाती।
- `identity` डिफ़ॉल्ट प्राप्त करता है: `emoji` से `ackReaction`, `name`/`emoji` से `mentionPatterns`।
- `subagents.allowAgents`: स्पष्ट `sessions_spawn.agentId` लक्ष्यों के लिए कॉन्फ़िगर किए गए एजेंट आईडी की अनुमति-सूची (`["*"]` = कोई भी कॉन्फ़िगर किया गया लक्ष्य; डिफ़ॉल्ट: केवल वही एजेंट)। जब स्वयं को लक्षित करने वाली `agentId` कॉल की अनुमति होनी चाहिए, तो अनुरोधकर्ता आईडी शामिल करें। जिन अप्रचलित प्रविष्टियों का एजेंट कॉन्फ़िगरेशन हटा दिया गया है, उन्हें `sessions_spawn` अस्वीकार करता है और `agents_list` से छोड़ दिया जाता है; उन्हें साफ़ करने के लिए `openclaw doctor --fix` चलाएँ, या यदि वह लक्ष्य डिफ़ॉल्ट इनहेरिट करते हुए स्पॉन करने योग्य रहना चाहिए, तो न्यूनतम `agents.list[]` प्रविष्टि जोड़ें।
- सैंडबॉक्स इनहेरिटेंस सुरक्षा: यदि अनुरोधकर्ता सत्र सैंडबॉक्स में है, तो `sessions_spawn` उन लक्ष्यों को अस्वीकार करता है जो सैंडबॉक्स के बाहर चलेंगे।
- `subagents.requireAgentId`: true होने पर, `agentId` को छोड़ने वाली `sessions_spawn` कॉल अवरुद्ध करें (स्पष्ट प्रोफ़ाइल चयन अनिवार्य करता है; डिफ़ॉल्ट: false)।
- `subagents.maxConcurrent`: उप-एजेंट निष्पादन में समवर्ती चाइल्ड-एजेंट रन की अधिकतम संख्या। डिफ़ॉल्ट: `8`।
- `subagents.maxChildrenPerAgent`: एक एजेंट सत्र द्वारा स्पॉन किए जा सकने वाले सक्रिय चाइल्ड की अधिकतम संख्या। डिफ़ॉल्ट: `5`।
- `subagents.maxSpawnDepth`: उप-एजेंट स्पॉनिंग के लिए अधिकतम नेस्टिंग गहराई (`1`-`5`)। डिफ़ॉल्ट: `1` (कोई नेस्टिंग नहीं)।
- `subagents.archiveAfterMinutes`: पूर्ण उप-एजेंट स्थिति को संग्रहित करने से पहले की अवधि। डिफ़ॉल्ट: `60`।

---

## बहु-एजेंट रूटिंग

एक Gateway के भीतर कई पृथक एजेंट चलाएँ। [बहु-एजेंट](/hi/concepts/multi-agent) देखें।

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

### बाइंडिंग मिलान फ़ील्ड

- `type` (वैकल्पिक): सामान्य रूटिंग के लिए `route` (प्रकार न होने पर डिफ़ॉल्ट route), स्थायी ACP वार्तालाप बाइंडिंग के लिए `acp`।
- `match.channel` (आवश्यक)
- `match.accountId` (वैकल्पिक; `*` = कोई भी खाता; छोड़ा गया = डिफ़ॉल्ट खाता)
- `match.peer` (वैकल्पिक; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (वैकल्पिक; चैनल-विशिष्ट)
- `acp` (वैकल्पिक; केवल `type: "acp"` के लिए): `{ mode, label, cwd, backend }`

**नियतात्मक मिलान क्रम:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (सटीक, कोई पीयर/गिल्ड/टीम नहीं)
5. `match.accountId: "*"` (पूरे चैनल के लिए)
6. डिफ़ॉल्ट एजेंट

प्रत्येक स्तर के भीतर, पहली मेल खाने वाली `bindings` प्रविष्टि प्रभावी होती है।

`type: "acp"` प्रविष्टियों के लिए, OpenClaw सटीक वार्तालाप पहचान (`match.channel` + खाता + `match.peer.id`) द्वारा समाधान करता है और ऊपर दिए गए रूट बाइंडिंग स्तर क्रम का उपयोग नहीं करता।

### प्रति-एजेंट अभिगम प्रोफ़ाइल

<Accordion title="पूर्ण अभिगम (कोई सैंडबॉक्स नहीं)">

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

<Accordion title="केवल-पठन टूल + कार्यक्षेत्र">

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

<Accordion title="फ़ाइल सिस्टम अभिगम नहीं (केवल संदेश सेवा)">

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

प्राथमिकता विवरण के लिए [बहु-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) देखें।

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
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
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="सत्र फ़ील्ड का विवरण">

- **`scope`**: समूह-चैट संदर्भों के लिए आधार सत्र समूहीकरण रणनीति।
  - `per-sender` (डिफ़ॉल्ट): प्रत्येक प्रेषक को चैनल संदर्भ के भीतर एक पृथक सत्र मिलता है।
  - `global`: चैनल संदर्भ के सभी प्रतिभागी एक ही सत्र साझा करते हैं (केवल तभी उपयोग करें जब साझा संदर्भ अपेक्षित हो)।
- **`dmScope`**: DM को कैसे समूहीकृत किया जाता है।
  - `main`: सभी DM मुख्य सत्र साझा करते हैं।
  - `per-peer`: सभी चैनलों में प्रेषक आईडी के आधार पर पृथक करें।
  - `per-channel-peer`: प्रत्येक चैनल + प्रेषक के आधार पर पृथक करें (बहु-उपयोगकर्ता इनबॉक्स के लिए अनुशंसित)।
  - `per-account-channel-peer`: प्रत्येक खाता + चैनल + प्रेषक के आधार पर पृथक करें (बहु-खाता उपयोग के लिए अनुशंसित)।
- **`identityLinks`**: विभिन्न चैनलों में सत्र साझा करने के लिए कैनोनिकल आईडी को प्रदाता-उपसर्ग वाले पीयर से मैप करें। `/dock_discord` जैसे डॉक कमांड सक्रिय सत्र के उत्तर मार्ग को किसी अन्य लिंक किए गए चैनल पीयर पर स्विच करने के लिए इसी मैप का उपयोग करते हैं; [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।
- **`reset`**: प्राथमिक रीसेट नीति। `none` स्वचालित रीसेट अक्षम करता है और डिफ़ॉल्ट है; इसके बजाय Compaction सक्रिय संदर्भ को सीमित करता है। `daily`, `atHour` स्थानीय समय पर रीसेट करता है; `idle`, `idleMinutes` के बाद रीसेट करता है। जब दोनों कॉन्फ़िगर हों, तो जो पहले समाप्त होता है वही प्रभावी होता है। `/new` और `/reset` प्रत्येक मोड में उपलब्ध रहते हैं। दैनिक रीसेट की ताज़गी सत्र पंक्ति के `sessionStartedAt` का उपयोग करती है; निष्क्रियता रीसेट की ताज़गी `lastInteractionAt` का उपयोग करती है। Heartbeat, Cron वेकअप, निष्पादन सूचनाओं और Gateway बहीखाते जैसे पृष्ठभूमि/सिस्टम-इवेंट लेखन `updatedAt` को अपडेट कर सकते हैं, लेकिन वे दैनिक/निष्क्रियता सत्रों को ताज़ा नहीं रखते।
- **`resetByType`**: प्रत्येक प्रकार के लिए ओवरराइड (`direct`, `group`, `thread`)। पुराना `dm`, `direct` के उपनाम के रूप में स्वीकार किया जाता है।
- **`resetByChannel`**: प्रदाता/चैनल आईडी से कुंजीबद्ध प्रत्येक चैनल के रीसेट ओवरराइड। जब सत्र के चैनल की कोई मेल खाती प्रविष्टि होती है, तो उस सत्र के लिए वह `resetByType`/`reset` पर पूर्ण रूप से प्राथमिकता पाती है। केवल तभी उपयोग करें जब किसी एक चैनल को प्रकार-स्तरीय नीति से अलग रीसेट व्यवहार चाहिए।
- **`mainKey`**: पुराना फ़ील्ड। रनटाइम मुख्य प्रत्यक्ष-चैट बकेट के लिए हमेशा `"main"` का उपयोग करता है।
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, पुराने `dm` उपनाम सहित), `keyPrefix`, या `rawKeyPrefix` के आधार पर मिलान करें। पहला निषेध प्रभावी होता है।
- **`maintenance`**: सत्र-स्टोर सफ़ाई + प्रतिधारण नियंत्रण।
  - `mode`: `enforce` सफ़ाई लागू करता है और डिफ़ॉल्ट है; `warn` केवल चेतावनियाँ जारी करता है।
  - `pruneAfter`: पुरानी प्रविष्टियों के लिए आयु सीमा (डिफ़ॉल्ट `30d`)।
  - `maxEntries`: SQLite सत्र प्रविष्टियों की अधिकतम संख्या (डिफ़ॉल्ट `500`)। रनटाइम लेखन उत्पादन-आकार की सीमाओं के लिए एक छोटे उच्च-जल-चिह्न बफ़र के साथ बैच सफ़ाई करता है; `openclaw sessions cleanup --enforce` सीमा को तुरंत लागू करता है।
  - अल्पकालिक Gateway मॉडल-रन जाँच सत्र निश्चित `24h` प्रतिधारण का उपयोग करते हैं, लेकिन सफ़ाई दबाव-आधारित है: यह केवल तभी पुरानी सख़्त मॉडल-रन जाँच पंक्तियाँ हटाती है जब सत्र-प्रविष्टि रखरखाव/सीमा का दबाव उत्पन्न होता है। केवल `agent:*:explicit:model-run-<uuid>` से मेल खाने वाली स्पष्ट सख़्त जाँच कुंजियाँ पात्र हैं; सामान्य प्रत्यक्ष, समूह, थ्रेड, Cron, हुक, Heartbeat, ACP और उप-एजेंट सत्रों को यह 24h प्रतिधारण नहीं मिलता। मॉडल-रन सफ़ाई होने पर वह व्यापक `pruneAfter` पुरानी-प्रविष्टि सफ़ाई और `maxEntries` सीमा से पहले होती है।
  - पुराना `rotateBytes` वर्तमान स्कीमा द्वारा अस्वीकार किया जाता है; `openclaw doctor --fix` इसे पुराने कॉन्फ़िगरेशन से हटा देता है।
  - `resetArchiveRetention`: रीसेट/हटाए गए ट्रांसक्रिप्ट अभिलेखों के लिए आयु-आधारित प्रतिधारण। डिफ़ॉल्ट रूप से अभिलेख डिस्क-बजट निष्कासन तक बने रहते हैं; समयावधि-आधारित विलोपन चुनने के लिए कोई अवधि सेट करें, या इसे स्पष्ट रूप से अक्षम करने के लिए `false` सेट करें।
  - `maxDiskBytes`: वैकल्पिक सत्र-निर्देशिका डिस्क बजट। `warn` मोड में यह चेतावनियाँ लॉग करता है; `enforce` मोड में यह सबसे पुराने आर्टिफ़ैक्ट/सत्र पहले हटाता है।
  - `highWaterBytes`: बजट सफ़ाई के बाद का वैकल्पिक लक्ष्य। डिफ़ॉल्ट रूप से `maxDiskBytes` का `80%`।
- **`threadBindings`**: थ्रेड-बद्ध सत्र सुविधाओं के लिए वैश्विक डिफ़ॉल्ट।
  - `enabled`: मुख्य डिफ़ॉल्ट स्विच (प्रदाता इसे ओवरराइड कर सकते हैं; Discord `channels.discord.threadBindings.enabled` का उपयोग करता है)
  - `idleHours`: घंटों में डिफ़ॉल्ट निष्क्रियता-आधारित स्वचालित अनफ़ोकस (`0` अक्षम करता है; प्रदाता ओवरराइड कर सकते हैं)
  - `maxAgeHours`: घंटों में डिफ़ॉल्ट कठोर अधिकतम आयु (`0` अक्षम करता है; प्रदाता ओवरराइड कर सकते हैं)
  - `spawnSessions`: `sessions_spawn` और ACP थ्रेड स्पॉन से थ्रेड-बद्ध कार्य सत्र बनाने के लिए डिफ़ॉल्ट गेट। थ्रेड बाइंडिंग सक्षम होने पर डिफ़ॉल्ट `true`; प्रदाता/खाते इसे ओवरराइड कर सकते हैं।
  - `defaultSpawnContext`: थ्रेड-बद्ध स्पॉन के लिए डिफ़ॉल्ट मूल उप-एजेंट संदर्भ (`"fork"` या `"isolated"`)। डिफ़ॉल्ट `"fork"`।

</Accordion>

---

## संदेश

```json5
{
  messages: {
    responsePrefix: "🦞", // या "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (डिफ़ॉल्ट) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (डिफ़ॉल्ट)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 अक्षम करता है
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### उत्तर उपसर्ग

प्रत्येक चैनल/खाते के ओवरराइड: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`।

समाधान क्रम (सबसे विशिष्ट प्रभावी होता है): खाता → चैनल → वैश्विक। `""` अक्षम करता है और कैस्केड रोकता है। `"auto"`, `[{identity.name}]` प्राप्त करता है।

**टेम्पलेट चर:**

| चर                | विवरण                  | उदाहरण                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | मॉडल का संक्षिप्त नाम | `claude-opus-4-6`           |
| `{modelFull}`     | पूर्ण मॉडल पहचानकर्ता  | `anthropic/claude-opus-4-6` |
| `{provider}`      | प्रदाता का नाम         | `anthropic`                 |
| `{thinkingLevel}` | वर्तमान चिंतन स्तर     | `high`, `low`, `off`        |
| `{identity.name}` | एजेंट पहचान का नाम     | (`"auto"` के समान)          |

चर अक्षर-स्थिति के प्रति असंवेदनशील हैं। `{think}`, `{thinkingLevel}` का उपनाम है।

### अभिस्वीकृति प्रतिक्रिया

- डिफ़ॉल्ट रूप से सक्रिय एजेंट का `identity.emoji`, अन्यथा `"👀"`। अक्षम करने के लिए `""` सेट करें।
- प्रत्येक चैनल के ओवरराइड: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`।
- समाधान क्रम: खाता → चैनल → `messages.ackReaction` → पहचान फ़ॉलबैक।
- दायरा: `group-mentions` (डिफ़ॉल्ट), `group-all`, `direct`, `all`, या `off`/`none` (अभिस्वीकृति प्रतिक्रियाओं को पूरी तरह अक्षम करता है)।
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp और iMessage जैसे प्रतिक्रिया-समर्थित चैनलों पर उत्तर के बाद अभिस्वीकृति हटाता है।
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram और WhatsApp पर जीवनचक्र स्थिति प्रतिक्रियाएँ सक्षम करता है।
  Discord पर, इसे सेट न करने से अभिस्वीकृति प्रतिक्रियाएँ सक्रिय होने पर स्थिति प्रतिक्रियाएँ सक्षम रहती हैं।
  Slack, Signal, Telegram और WhatsApp पर जीवनचक्र स्थिति प्रतिक्रियाएँ सक्षम करने के लिए इसे स्पष्ट रूप से `true` पर सेट करें।
  Slack डिफ़ॉल्ट रूप से प्रगति के लिए अपनी मूल सहायक थ्रेड स्थिति और क्रम बदलते लोडिंग संदेशों का उपयोग करता है, जबकि कॉन्फ़िगर की गई अभिस्वीकृति प्रतिक्रिया स्थिर रहती है।
- `messages.statusReactions.emojis`: जीवनचक्र इमोजी कुंजियों को ओवरराइड करता है:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, और `stallHard`।
  Telegram केवल प्रतिक्रियाओं के एक निश्चित समूह की अनुमति देता है, इसलिए असमर्थित कॉन्फ़िगर किए गए इमोजी उस चैट के निकटतम समर्थित स्थिति संस्करण पर फ़ॉलबैक करते हैं।

### कतार

- `mode`: सत्र रन सक्रिय होने के दौरान आने वाले इनबाउंड संदेशों के लिए कतार रणनीति। डिफ़ॉल्ट: `"steer"`।
  - `steer`: नया प्रॉम्प्ट सक्रिय रन में प्रविष्ट करें।
  - `followup`: सक्रिय रन समाप्त होने के बाद नया प्रॉम्प्ट चलाएँ।
  - `collect`: संगत संदेशों को बैच करें और बाद में एक साथ चलाएँ।
  - `interrupt`: नवीनतम प्रॉम्प्ट शुरू करने से पहले सक्रिय रन निरस्त करें।
- `debounceMs`: कतारबद्ध/निर्देशित संदेश भेजने से पहले विलंब। डिफ़ॉल्ट: `500`।
- `cap`: ड्रॉप नीति लागू होने से पहले कतारबद्ध संदेशों की अधिकतम संख्या। डिफ़ॉल्ट: `20`।
- `drop`: सीमा पार होने पर रणनीति। `"summarize"` (डिफ़ॉल्ट) सबसे पुरानी प्रविष्टियाँ हटाता है, लेकिन संक्षिप्त सारांश बनाए रखता है; `"old"` सारांश के बिना सबसे पुरानी प्रविष्टियाँ हटाता है; `"new"` नवीनतम आइटम अस्वीकार करता है।
- `byChannel`: प्रदाता आईडी से कुंजीबद्ध प्रत्येक चैनल के `mode` ओवरराइड।
- `debounceMsByChannel`: प्रदाता आईडी से कुंजीबद्ध प्रत्येक चैनल के `debounceMs` ओवरराइड।

### इनबाउंड डीबाउंस

एक ही प्रेषक के तेज़ी से आए केवल-पाठ संदेशों को एजेंट के एक ही टर्न में बैच करता है। मीडिया/अटैचमेंट तुरंत फ़्लश होते हैं। नियंत्रण कमांड डीबाउंसिंग को बायपास करते हैं। डिफ़ॉल्ट `debounceMs`: `2000`।

### अन्य संदेश कुंजियाँ

- `channels.whatsapp.messagePrefix`: केवल WhatsApp के लिए उपसर्ग, जिसे एजेंट रनटाइम तक पहुँचने से पहले इनबाउंड उपयोगकर्ता संदेशों के आगे जोड़ा जाता है।
- `messages.visibleReplies`: प्रत्यक्ष, समूह और चैनल वार्तालापों में दृश्यमान स्रोत उत्तरों को नियंत्रित करता है (`"message_tool"` को दृश्यमान आउटपुट के लिए `message(action=send)` की आवश्यकता होती है; `"automatic"` पहले की तरह सामान्य उत्तर पोस्ट करता है)।
- `messages.usageTemplate` / `messages.responseUsage`: कस्टम `/usage` पादलेख टेम्पलेट और प्रति-उत्तर उपयोग का डिफ़ॉल्ट मोड (`off | tokens | full`, साथ ही `tokens` के लिए पुराना `on` उपनाम)।
- `messages.groupChat.mentionPatterns` / `historyLimit`: समूह-संदेश उल्लेख ट्रिगर और इतिहास विंडो का आकार।
- `messages.suppressToolErrors`: जब `true` हो, तो उपयोगकर्ता को दिखाई जाने वाली `⚠️` टूल-त्रुटि चेतावनियाँ दबाता है (एजेंट को संदर्भ में त्रुटियाँ फिर भी दिखाई देती हैं और वह पुनः प्रयास कर सकता है)। डिफ़ॉल्ट: `false`।

### TTS (टेक्स्ट-टू-स्पीच)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` डिफ़ॉल्ट स्वचालित TTS मोड नियंत्रित करता है: `off`, `always`, `inbound`, या `tagged`। `/tts on|off` स्थानीय प्राथमिकताओं को ओवरराइड कर सकता है, और `/tts status` प्रभावी स्थिति दिखाता है।
- `summaryModel` स्वचालित सारांश के लिए `agents.defaults.model.primary` को ओवरराइड करता है।
- `modelOverrides` डिफ़ॉल्ट रूप से सक्षम है (`enabled !== false`); `modelOverrides.allowProvider` को स्पष्ट रूप से सक्षम करना पड़ता है।
- API कुंजियाँ `ELEVENLABS_API_KEY`/`XI_API_KEY` और `OPENAI_API_KEY` पर फ़ॉलबैक करती हैं।
- बंडल किए गए वाक् प्रदाताओं का स्वामित्व Plugin के पास होता है। यदि `plugins.allow` सेट है, तो उपयोग किए जाने वाले प्रत्येक TTS प्रदाता Plugin को शामिल करें, उदाहरण के लिए Edge TTS हेतु `microsoft`। पुरानी `edge` प्रदाता आईडी को `microsoft` के उपनाम के रूप में स्वीकार किया जाता है।
- `providers.openai.baseUrl` OpenAI TTS एंडपॉइंट को ओवरराइड करता है। समाधान क्रम पहले कॉन्फ़िगरेशन, फिर `OPENAI_TTS_BASE_URL`, और उसके बाद `https://api.openai.com/v1` है।
- जब `providers.openai.baseUrl` किसी गैर-OpenAI एंडपॉइंट की ओर संकेत करता है, तो OpenClaw उसे OpenAI-संगत TTS सर्वर मानता है और मॉडल/वॉइस सत्यापन को शिथिल कर देता है।

---

## वार्तालाप

Talk मोड (macOS/iOS/Android और ब्राउज़र Control UI) के लिए डिफ़ॉल्ट।

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- जब कई Talk प्रदाता कॉन्फ़िगर किए गए हों, तब `talk.provider` को `talk.providers` की किसी कुंजी से मेल खाना आवश्यक है।
- पुरानी समतल Talk कुंजियाँ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) केवल संगतता के लिए हैं। सहेजे गए कॉन्फ़िगरेशन को `talk.providers.<provider>` में पुनर्लिखने के लिए `openclaw doctor --fix` चलाएँ।
- वॉइस आईडी `ELEVENLABS_VOICE_ID` या `SAG_VOICE_ID` पर फ़ॉलबैक करती हैं (macOS Talk क्लाइंट का व्यवहार)।
- `providers.*.apiKey` सादे टेक्स्ट की स्ट्रिंग या SecretRef ऑब्जेक्ट स्वीकार करता है।
- `ELEVENLABS_API_KEY` फ़ॉलबैक केवल तब लागू होता है जब कोई Talk API कुंजी कॉन्फ़िगर नहीं की गई हो।
- `providers.*.voiceAliases` Talk निर्देशों को उपयोगकर्ता-अनुकूल नाम इस्तेमाल करने देता है।
- `providers.mlx.modelId` macOS के स्थानीय MLX सहायक द्वारा उपयोग की जाने वाली Hugging Face रिपॉज़िटरी चुनता है। इसे छोड़ने पर macOS `mlx-community/Soprano-80M-bf16` का उपयोग करता है।
- उपलब्ध होने पर macOS MLX प्लेबैक बंडल किए गए `openclaw-mlx-tts` सहायक के माध्यम से चलता है, अन्यथा `PATH` में मौजूद निष्पादन योग्य फ़ाइल के माध्यम से; `OPENCLAW_MLX_TTS_BIN` विकास के लिए सहायक का पथ ओवरराइड करता है।
- `consultThinkingLevel` Control UI Talk के रियलटाइम `openclaw_agent_consult` कॉल के पीछे चलने वाले संपूर्ण OpenClaw एजेंट रन का चिंतन स्तर नियंत्रित करता है। सामान्य सत्र/मॉडल व्यवहार बनाए रखने के लिए इसे सेट न करें।
- `consultFastMode` सत्र की सामान्य फ़ास्ट-मोड सेटिंग बदले बिना Control UI Talk के रियलटाइम परामर्शों के लिए एक बार लागू होने वाला फ़ास्ट-मोड ओवरराइड सेट करता है।
- `speechLocale` Android, iOS और macOS Talk वाक् पहचान द्वारा उपयोग की जाने वाली BCP 47 लोकेल आईडी सेट करता है। Android रियलटाइम इनपुट ट्रांसक्रिप्शन को निर्देशित करने के लिए इसके भाषा घटक का भी उपयोग करता है। डिवाइस का डिफ़ॉल्ट उपयोग करने के लिए इसे सेट न करें।
- `silenceTimeoutMs` नियंत्रित करता है कि उपयोगकर्ता के शांत होने के बाद Talk मोड ट्रांसक्रिप्ट भेजने से पहले कितनी देर प्रतीक्षा करता है। इसे सेट न करने पर प्लेटफ़ॉर्म की डिफ़ॉल्ट विराम अवधि (`700 ms on macOS and Android, 900 ms on iOS`) बनी रहती है।
- `realtime.instructions` OpenClaw के अंतर्निहित रियलटाइम प्रॉम्प्ट में प्रदाता के लिए सिस्टम निर्देश जोड़ता है, ताकि डिफ़ॉल्ट `openclaw_agent_consult` मार्गदर्शन खोए बिना वॉइस शैली कॉन्फ़िगर की जा सके।
- `realtime.vadThreshold` प्रदाता की वॉइस-गतिविधि सीमा `0` (सर्वाधिक संवेदनशील) से `1` (सबसे कम संवेदनशील) तक सेट करता है। इसे सेट न करने पर प्रदाता का डिफ़ॉल्ट बना रहता है।
- `realtime.silenceDurationMs` प्रदाता द्वारा रियलटाइम उपयोगकर्ता टर्न को कमिट करने से पहले की धनात्मक पूर्णांक मौन अवधि सेट करता है। इसे सेट न करने पर प्रदाता का डिफ़ॉल्ट बना रहता है।
- `realtime.prefixPaddingMs` पहचानी गई वाणी आरंभ होने से पहले रखे जाने वाले ऑडियो की गैर-ऋणात्मक पूर्णांक मात्रा सेट करता है। इसे सेट न करने पर प्रदाता का डिफ़ॉल्ट बना रहता है।
- `realtime.reasoningEffort` रियलटाइम सत्रों के लिए प्रदाता-विशिष्ट तर्क स्तर सेट करता है। इसे सेट न करने पर प्रदाता का डिफ़ॉल्ट बना रहता है।
- `realtime.consultRouting`: जब रियलटाइम प्रदाता `openclaw_agent_consult` के बिना अंतिम उपयोगकर्ता ट्रांसक्रिप्ट बनाता है, तब `"provider-direct"` (डिफ़ॉल्ट) प्रदाता के सीधे उत्तरों को बनाए रखता है। इसके बजाय `"force-agent-consult"` अंतिम रूप दिए गए अनुरोध को OpenClaw के माध्यम से रूट करता है।

---

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — अन्य सभी कॉन्फ़िगरेशन कुंजियाँ
- [कॉन्फ़िगरेशन](/hi/gateway/configuration) — सामान्य कार्य और त्वरित सेटअप
- [कॉन्फ़िगरेशन के उदाहरण](/hi/gateway/configuration-examples)
