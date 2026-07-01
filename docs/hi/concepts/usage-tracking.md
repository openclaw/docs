---
read_when:
    - आप प्रदाता उपयोग/कोटा सतहों को जोड़ रहे हैं
    - आपको उपयोग ट्रैकिंग व्यवहार या प्रमाणीकरण आवश्यकताओं की व्याख्या करनी है
summary: उपयोग ट्रैकिंग सर्फेस और क्रेडेंशियल आवश्यकताएँ
title: उपयोग ट्रैकिंग
x-i18n:
    generated_at: "2026-07-01T18:13:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## यह क्या है

- प्रदाता उपयोग/कोटा सीधे उनके उपयोग endpoints से खींचता है।
- कोई अनुमानित लागत नहीं; केवल प्रदाता-रिपोर्टेड कोटा विंडो या खाता-स्थिति
  सारांश।
- मानव-पठनीय कोटा-विंडो स्थिति आउटपुट को `X% left` में सामान्यीकृत किया जाता है, भले ही
  upstream API consumed quota, remaining quota, या केवल raw
  counts रिपोर्ट करे। जिन प्रदाताओं के पास resettable quota windows नहीं हैं, वे इसके बजाय प्रदाता सारांश
  पाठ दिखा सकते हैं, जैसे balance।
- सत्र-स्तर `/status` और `session_status` नवीनतम
  transcript usage entry पर fallback कर सकते हैं जब live session snapshot sparse हो। यह
  fallback missing token/cache counters भरता है, active runtime
  model label पुनर्प्राप्त कर सकता है, और session
  metadata missing या छोटा होने पर बड़े prompt-oriented total को प्राथमिकता देता है। मौजूदा nonzero live values फिर भी जीतती हैं।

## यह कहां दिखता है

- chats में `/status`: session tokens + estimated cost (केवल API key) के साथ emoji-rich status card। Provider usage **current model provider** के लिए, उपलब्ध होने पर, normalized `X% left` window या provider summary text के रूप में दिखता है।
- chats में `/usage off|tokens|full`: प्रति-response usage footer।
- chats में `/usage cost`: OpenClaw session logs से aggregated local cost summary।
- CLI: `openclaw status --usage` पूरा per-provider breakdown प्रिंट करता है।
- CLI: `openclaw channels list` provider config के साथ वही usage snapshot प्रिंट करता है (skip करने के लिए `--no-usage` इस्तेमाल करें)।
- macOS menu bar: Context के अंतर्गत "Usage" section (केवल उपलब्ध होने पर)।

## डिफॉल्ट usage footer mode

`/usage off|tokens|full` किसी session के लिए footer सेट करता है और उस
session के लिए याद रखा जाता है। `messages.responseUsage` उन sessions के लिए mode seed करता है जिन्होंने
कोई mode नहीं चुना है, ताकि हर बार `/usage` टाइप किए बिना footer default रूप से on हो सके।

हर channel के लिए एक mode सेट करें, या `default` fallback के साथ per-channel map:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### तीन अलग-अलग session states

किसी session के `responseUsage` field में तीन representable states हैं, हर एक की
semantics अलग है:

| State                  | Stored value                    | Effective mode                                                                  |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| **Unset / inherit**    | `undefined` (absent)            | `messages.responseUsage` config default, फिर `off` तक falls through।            |
| **Explicit off**       | `"off"` (stored)                | हमेशा off — non-off config default footer को दोबारा enable नहीं कर सकता।        |
| **Explicit on**        | `"tokens"` या `"full"` (stored) | वही mode, config default की परवाह किए बिना।                                     |

### प्राथमिकता

Effective mode = session override → channel config entry → `default` → `off`.

Explicit `/usage off` session में literal value `"off"` के रूप में **persisted** होता है,
"unset" जैसा नहीं। इसका मतलब है कि non-off `messages.responseUsage`
default, user द्वारा explicit disable करने के बाद footer को वापस on नहीं कर सकता।

### Reset करना बनाम off करना

- `/usage off` — footer को off करने के लिए मजबूर करता है और उस choice को persist करता है। Configured
  non-off default इसे override नहीं कर सकता।
- `/usage reset` (aliases: `inherit`, `clear`, `default`) — session
  override clear करता है। फिर session effective config default
  (`messages.responseUsage`) को **inherits** करता है। अगर कोई default configured नहीं है, तो footer off रहता है
  (पहले जैसा ही)। इसे explicitly footer on किए बिना "default पर वापस जाने" के लिए इस्तेमाल करें।
- Full session reset (`/reset` या `/new`) या session rollover explicit usage-mode preference को **preserves**
  करता है ताकि user की display choice session rollovers के बाद भी बनी रहे।
  केवल `/usage reset` (और उसके aliases) वास्तव में
  override clear करते हैं।

### Toggle behavior

बिना arguments के `/usage` cycle करता है: off → tokens → full → off। Cycle का starting point
**effective** current mode होता है (unset होने पर session override config default तक falling through
करता है), इसलिए cycle हमेशा उस चीज़ से consistent रहता है जो
user footer में देखता है।

### Config

Config न होने पर previous behavior बना रहता है (footer `/usage` तक off)। किसी session override को clear करने और configured default को फिर से inherit करने के लिए
`/usage reset` इस्तेमाल करें।

## Custom `/usage full` footer

`/usage full` model, reasoning, fast/slow,
context window, और cost के साथ built-in compact footer दिखाता है जब ये fields उपलब्ध हों। Token और cache fields
custom templates के लिए उपलब्ध रहते हैं। कोई template file जरूरी नहीं है।

`messages.usageTemplate` केवल advanced custom layouts के लिए है। Value एक
JSON file path (`~` supported) या inline object है, और valid होने पर यह built-in
footer को replace करता है:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Missing या empty templates चुपचाप built-in footer पर fall back करते हैं। Unreadable
या invalid configured templates भी built-in footer पर fall back करते हैं और
operator warning emit करते हैं।

Custom templates को built-in shape से शुरू करें, फिर वे parts edit करें जिन्हें आप
बदलना चाहते हैं:

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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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

हर surface **pieces** की ordered list है; engine हर item render करता है, empties drop करता है,
और survivors को `sep` से join करता है। Entry न होने वाली surface
`output.default` इस्तेमाल करती है।

### Contract Paths

एक piece per-turn contract से dot-path द्वारा values पढ़ता है। Absent values
empty होते हैं (इसलिए `when` guard या `|fallback` piece को clean रखता है)।

| Path                                                                                | Meaning                                  |
| ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `surface`                                                                           | channel id (`discord`/`telegram`/etc.)   |
| `model.provider` / `model.display_name`                                             | provider id / model id                   |
| `model.reasoning`                                                                   | effort (`off` से `xhigh` तक)             |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback used / model pinned       |
| `state.fast_mode`                                                                   | bool: fast vs slow                       |
| `context.max_tokens` / `context.pct_used`                                           | window budget / 0-100 used               |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | turn aggregate                           |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | token display guards और cache percent    |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | केवल final model call                    |
| `cost.turn_usd`                                                                     | estimated turn cost                      |
| `identity.name` / `identity.emoji`                                                  | agent name / चुना हुआ emoji              |

(Provider rate-limit windows इस contract में **नहीं** हैं।)

### Verbs

Value को verbs से left to right pipe करें; non-verb segment fallback है।

| Verb            | Effect                                      | Example                           |
| --------------- | ------------------------------------------- | --------------------------------- |
| `num`           | compact count                               | `272000 -> 272k`                  |
| `fixed:N`       | N decimals (default 2)                      | `0.0377`                          |
| `dur`           | seconds to duration                         | `14820 -> 4h07m`                  |
| `pct`           | `%` append करें                             | `96 -> 96%`                       |
| `inv`           | `100 - x`                                   | used को remaining में बदलने के लिए |
| `alias:TABLE`   | `aliases` में lookup, unlisted हो तो echo   | `medium -> 🌗`                    |
| `meter:W:SCALE` | 0-100 value पर W-cell glyph bar             | `[⣿⣿⠐⠐⠐]` (`meter:1` = one glyph) |

### Piece forms

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation।
- `{ "when": "<path>", "text": "..." }`: path truthy होने पर ही render करें।
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: value to glyph।
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

render करता है, जैसे `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`।

## Providers + credentials

- **Anthropic (Claude)**: auth प्रोफाइलों में OAuth टोकन।
- **GitHub Copilot**: auth प्रोफाइलों में OAuth टोकन।
- **Gemini CLI**: auth प्रोफाइलों में OAuth टोकन।
  - JSON उपयोग `stats` पर वापस चला जाता है; `stats.cached` को
    `cacheRead` में सामान्यीकृत किया जाता है।
- **OpenAI Codex**: auth प्रोफाइलों में OAuth टोकन (मौजूद होने पर accountId उपयोग किया जाता है)।
- **MiniMax**: API कुंजी या MiniMax OAuth auth प्रोफाइल। OpenClaw
  `minimax`, `minimax-cn`, और `minimax-portal` को समान MiniMax quota
  सतह मानता है, मौजूद होने पर संग्रहीत MiniMax OAuth को प्राथमिकता देता है,
  और अन्यथा `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, या `MINIMAX_API_KEY`
  पर वापस चला जाता है।
  उपयोग polling, configured होने पर `models.providers.minimax-portal.baseUrl`
  या `models.providers.minimax.baseUrl` से Coding Plan host निकालता है, और अन्यथा
  MiniMax CN host का उपयोग करता है।
  MiniMax के raw `usage_percent` / `usagePercent` फ़ील्ड का अर्थ **शेष**
  quota है, इसलिए OpenClaw उन्हें display से पहले उलट देता है; count-based फ़ील्ड
  मौजूद होने पर प्राथमिकता पाते हैं।
  - Coding-plan window labels मौजूद होने पर provider के hours/minutes फ़ील्ड से आते हैं,
    फिर `start_time` / `end_time` span पर वापस चले जाते हैं।
  - अगर coding-plan endpoint `model_remains` लौटाता है, तो OpenClaw
    chat-model entry को प्राथमिकता देता है, explicit `window_hours` / `window_minutes`
    फ़ील्ड अनुपस्थित होने पर timestamps से window label निकालता है, और plan label में model
    name शामिल करता है।
- **Xiaomi MiMo**: env/config/auth store (`XIAOMI_API_KEY`) के ज़रिए API कुंजी।
- **z.ai**: env/config/auth store के ज़रिए API कुंजी।
- **DeepSeek**: env/config/auth store (`DEEPSEEK_API_KEY`) के ज़रिए API कुंजी।
  OpenClaw DeepSeek के balance endpoint को call करता है और percent-left quota window के बजाय
  provider-reported balance को text के रूप में दिखाता है।

जब कोई usable provider usage auth हल नहीं किया जा सकता, तो उपयोग छिपा दिया जाता है। Providers
plugin-specific usage auth logic दे सकते हैं; अन्यथा OpenClaw auth profiles, environment variables,
या config से matching OAuth/API-key credentials पर वापस चला जाता है।

## संबंधित

- [Token उपयोग और लागतें](/hi/reference/token-use)
- [API उपयोग और लागतें](/hi/reference/api-usage-costs)
- [Prompt caching](/hi/reference/prompt-caching)
