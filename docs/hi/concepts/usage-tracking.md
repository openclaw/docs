---
read_when:
    - आप प्रदाता उपयोग/कोटा सतहों को जोड़ रहे हैं
    - आपको उपयोग ट्रैकिंग व्यवहार या प्रमाणीकरण आवश्यकताओं की व्याख्या करनी होगी
summary: उपयोग ट्रैकिंग सतहें और क्रेडेंशियल आवश्यकताएँ
title: उपयोग ट्रैकिंग
x-i18n:
    generated_at: "2026-06-28T23:04:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## यह क्या है

- प्रदाता उपयोग/कोटा सीधे उनके उपयोग एंडपॉइंट से खींचता है।
- कोई अनुमानित लागत नहीं; केवल प्रदाता-द्वारा रिपोर्ट की गई कोटा विंडो या खाता-स्थिति सारांश।
- मानव-पठनीय कोटा-विंडो स्थिति आउटपुट को `X% left` में सामान्यीकृत किया जाता है, तब भी जब upstream API उपभुक्त कोटा, शेष कोटा, या केवल कच्ची गिनतियां रिपोर्ट करता है। रीसेट-योग्य कोटा विंडो के बिना प्रदाता इसके बजाय प्रदाता सारांश पाठ दिखा सकते हैं, जैसे बैलेंस।
- सत्र-स्तरीय `/status` और `session_status`, जब लाइव सत्र स्नैपशॉट विरल हो, तो नवीनतम transcript उपयोग प्रविष्टि पर वापस जा सकते हैं। वह fallback अनुपस्थित token/cache काउंटर भरता है, सक्रिय runtime model label पुनर्प्राप्त कर सकता है, और जब सत्र metadata अनुपस्थित या छोटा हो तो बड़े prompt-केंद्रित कुल को प्राथमिकता देता है। मौजूदा गैर-शून्य लाइव मान फिर भी प्राथमिक रहेंगे।

## यह कहां दिखाई देता है

- चैट में `/status`: emoji-समृद्ध स्थिति कार्ड, जिसमें सत्र tokens + अनुमानित लागत होती है (केवल API key)। उपलब्ध होने पर **वर्तमान model provider** के लिए प्रदाता उपयोग, सामान्यीकृत `X% left` विंडो या प्रदाता सारांश पाठ के रूप में दिखता है।
- चैट में `/usage off|tokens|full`: प्रति-response उपयोग footer (OAuth केवल tokens दिखाता है)।
- चैट में `/usage cost`: OpenClaw सत्र logs से संकलित स्थानीय लागत सारांश।
- CLI: `openclaw status --usage` पूरा प्रति-प्रदाता breakdown प्रिंट करता है।
- CLI: `openclaw channels list` प्रदाता config के साथ वही उपयोग snapshot प्रिंट करता है (छोड़ने के लिए `--no-usage` उपयोग करें)।
- macOS menu bar: Context के अंतर्गत "Usage" section (केवल उपलब्ध होने पर)।

## डिफ़ॉल्ट उपयोग footer mode

`/usage off|tokens|full` किसी सत्र के लिए footer सेट करता है और उस सत्र के लिए याद रखा जाता है। `messages.responseUsage` उन सत्रों के लिए वह mode seed करता है जिन्होंने कोई mode नहीं चुना है, ताकि हर बार `/usage` टाइप किए बिना footer डिफ़ॉल्ट रूप से चालू हो सके।

हर channel के लिए एक mode सेट करें, या `default` fallback वाला per-channel map:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### तीन अलग-अलग सत्र अवस्थाएं

किसी सत्र के `responseUsage` field की तीन representable अवस्थाएं होती हैं, प्रत्येक की semantics अलग होती है:

| अवस्था | संग्रहीत मान | प्रभावी mode |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **Unset / inherit** | `undefined` (अनुपस्थित) | `messages.responseUsage` config default, फिर `off` पर falls through। |
| **Explicit off** | `"off"` (संग्रहीत) | हमेशा off — कोई non-off config default footer को फिर से enable नहीं कर सकता। |
| **Explicit on** | `"tokens"` या `"full"` (संग्रहीत) | वही mode, config default चाहे जो हो। |

### प्राथमिकता

प्रभावी mode = सत्र override → channel config entry → `default` → `off`.

स्पष्ट `/usage off` सत्र में literal value `"off"` के रूप में **persist** होता है, "unset" जैसा नहीं। इसका मतलब है कि non-off `messages.responseUsage` default, user द्वारा स्पष्ट रूप से disable करने के बाद footer को फिर से चालू नहीं कर सकता।

### रीसेट करना बनाम बंद करना

- `/usage off` — footer को बंद करने के लिए बाध्य करता है और उस विकल्प को persist करता है। configured non-off default इसे override नहीं कर सकता।
- `/usage reset` (aliases: `inherit`, `clear`, `default`) — सत्र override को clear करता है। फिर सत्र प्रभावी config default (`messages.responseUsage`) को **inherit** करता है। यदि कोई default configured नहीं है, तो footer off रहता है (पहले जैसा अपरिवर्तित)। इसे स्पष्ट रूप से footer चालू किए बिना "default पर वापस जाने" के लिए उपयोग करें।
- पूरा सत्र reset (`/reset` या `/new`) या session rollover स्पष्ट usage-mode preference को **preserve** करता है, ताकि user की display choice session rollovers के बाद भी बनी रहे। केवल `/usage reset` (और इसके aliases) ही वास्तव में override को clear करते हैं।

### Toggle व्यवहार

बिना arguments के `/usage` cycle करता है: off → tokens → full → off। cycle का starting point **effective** current mode होता है (session override unset होने पर config default पर falls through), इसलिए cycle हमेशा उससे consistent रहता है जो user footer में देखता है।

### Config

बिना config के पिछला व्यवहार बना रहता है (footer `/usage` तक off)। session override clear करने और configured default को फिर से inherit करने के लिए `/usage reset` उपयोग करें।

## Custom `/usage full` footer

`/usage full` उपलब्ध fields होने पर model, reasoning, fast/slow, context window, turn tokens, cache, और cost वाला built-in compact footer दिखाता है। कोई template file आवश्यक नहीं है।

`messages.usageTemplate` केवल advanced custom layouts के लिए है। value एक JSON file path (`~` समर्थित) या inline object है, और valid होने पर यह built-in footer को replace करता है:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Missing या empty templates चुपचाप built-in footer पर fall back करते हैं। Unreadable या invalid configured templates भी built-in footer पर fall back करते हैं और operator warning emit करते हैं।

Custom templates को built-in shape से शुरू करें, फिर जिन parts को बदलना चाहते हैं उन्हें edit करें:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Shape

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

प्रत्येक surface **pieces** की ordered list है; engine प्रत्येक को render करता है, empty items drop करता है, और बचे हुए items को `sep` से join करता है। बिना entry वाला surface `output.default` उपयोग करता है।

### Contract Paths

एक piece प्रति-turn contract से dot-path द्वारा values पढ़ता है। अनुपस्थित values empty होती हैं (इसलिए `when` guard या `|fallback` piece को clean रखता है)।

| Path | अर्थ |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface` | channel id (`discord`/`telegram`/आदि) |
| `model.provider` / `model.display_name` | provider id / model id |
| `model.reasoning` | effort (`off` से `xhigh` तक) |
| `model.is_fallback` / `model.is_override` | bool: fallback used / model pinned |
| `state.fast_mode` | bool: fast vs slow |
| `context.max_tokens` / `context.pct_used` | window budget / 0-100 used |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens` | turn aggregate |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct` | token display guards और cache percent |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | केवल final model call |
| `cost.turn_usd` | estimated turn cost |
| `identity.name` / `identity.emoji` | agent name / chosen emoji |

(Provider rate-limit windows इस contract में **नहीं** हैं।)

### Verbs

किसी value को verbs से left to right pipe करें; non-verb segment fallback है।

| Verb | प्रभाव | Example |
| --------------- | ------------------------------------- | --------------------------------- |
| `num` | compact count | `272000 -> 272k` |
| `fixed:N` | N decimals (default 2) | `0.0377` |
| `dur` | seconds to duration | `14820 -> 4h07m` |
| `pct` | `%` append करें | `96 -> 96%` |
| `inv` | `100 - x` | used से remaining के लिए |
| `alias:TABLE` | `aliases` में lookup, unlisted होने पर echo | `medium -> 🌗` |
| `meter:W:SCALE` | 0-100 value पर W-cell glyph bar | `[⣿⣿⠐⠐⠐]` (`meter:1` = one glyph) |

### Piece forms

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation।
- `{ "when": "<path>", "text": "..." }`: केवल path truthy होने पर render करें।
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: value से glyph।
- `{ "each": "limits.windows", "item": "{label}" }`: array iterate करें।

### Example

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

उदाहरण के लिए, यह `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` रेंडर करता है।

## प्रदाता + क्रेडेंशियल

- **Anthropic (Claude)**: auth प्रोफ़ाइल में OAuth टोकन।
- **GitHub Copilot**: auth प्रोफ़ाइल में OAuth टोकन।
- **Gemini CLI**: auth प्रोफ़ाइल में OAuth टोकन।
  - JSON उपयोग वापस `stats` पर जाता है; `stats.cached` को
    `cacheRead` में सामान्यीकृत किया जाता है।
- **OpenAI Codex**: auth प्रोफ़ाइल में OAuth टोकन (`accountId` मौजूद होने पर इस्तेमाल किया जाता है)।
- **MiniMax**: API कुंजी या MiniMax OAuth auth प्रोफ़ाइल। OpenClaw
  `minimax`, `minimax-cn`, और `minimax-portal` को समान MiniMax कोटा
  सतह मानता है, मौजूद होने पर संग्रहीत MiniMax OAuth को प्राथमिकता देता है,
  और अन्यथा `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, या `MINIMAX_API_KEY` पर
  वापस जाता है।
  उपयोग पोलिंग, कॉन्फ़िगर होने पर Coding Plan होस्ट को `models.providers.minimax-portal.baseUrl`
  या `models.providers.minimax.baseUrl` से निकालती है, और अन्यथा
  MiniMax CN होस्ट का उपयोग करती है।
  MiniMax के कच्चे `usage_percent` / `usagePercent` फ़ील्ड का अर्थ **शेष**
  कोटा होता है, इसलिए OpenClaw उन्हें दिखाने से पहले उलट देता है; मौजूद होने पर
  गिनती-आधारित फ़ील्ड प्राथमिकता लेते हैं।
  - Coding-plan विंडो लेबल, मौजूद होने पर, प्रदाता के घंटे/मिनट फ़ील्ड से आते हैं,
    फिर `start_time` / `end_time` अवधि पर वापस जाते हैं।
  - यदि coding-plan endpoint `model_remains` लौटाता है, तो OpenClaw
    chat-model प्रविष्टि को प्राथमिकता देता है, स्पष्ट
    `window_hours` / `window_minutes` फ़ील्ड अनुपस्थित होने पर timestamp से
    विंडो लेबल निकालता है, और plan लेबल में model
    नाम शामिल करता है।
- **Xiaomi MiMo**: env/config/auth store (`XIAOMI_API_KEY`) के ज़रिए API कुंजी।
- **z.ai**: env/config/auth store के ज़रिए API कुंजी।
- **DeepSeek**: env/config/auth store (`DEEPSEEK_API_KEY`) के ज़रिए API कुंजी।
  OpenClaw DeepSeek के balance endpoint को कॉल करता है और percent-left कोटा विंडो के बजाय
  प्रदाता द्वारा रिपोर्ट किया गया balance टेक्स्ट के रूप में दिखाता है।

जब कोई उपयोगी प्रदाता उपयोग auth हल नहीं किया जा सकता, तो उपयोग छिपा रहता है। प्रदाता
Plugin-विशिष्ट उपयोग auth लॉजिक दे सकते हैं; अन्यथा OpenClaw auth प्रोफ़ाइल, environment variables,
या config से मेल खाते OAuth/API-key क्रेडेंशियल पर वापस जाता है।

## संबंधित

- [टोकन उपयोग और लागतें](/hi/reference/token-use)
- [API उपयोग और लागतें](/hi/reference/api-usage-costs)
- [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching)
