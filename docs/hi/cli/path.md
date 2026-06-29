---
read_when:
    - आप टर्मिनल से किसी workspace फ़ाइल के भीतर एक leaf पढ़ना या लिखना चाहते हैं
    - आप workspace स्थिति के विरुद्ध scripting कर रहे हैं और एक स्थिर, kind-agnostic addressing scheme चाहते हैं
    - आप एक `oc://` पथ डीबग कर रहे हैं (सिंटैक्स सत्यापित करें, देखें कि यह किस पर रिज़ॉल्व होता है)
summary: '`openclaw path` के लिए CLI संदर्भ (`oc://` addressing योजना के माध्यम से workspace फ़ाइलों का निरीक्षण और संपादन करें)'
title: पथ
x-i18n:
    generated_at: "2026-06-28T22:51:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Plugin द्वारा प्रदान किया गया shell access `oc://` addressing substrate तक: addressable workspace
files (markdown, jsonc, jsonl, yaml/yml/lobster) का निरीक्षण और संपादन करने के लिए एक
kind-dispatched path scheme. Self-hosters, plugin
authors, और editor extensions इसका उपयोग बिना हर file के लिए parser हाथ से बनाए
किसी संकीर्ण location को पढ़ने, खोजने, या update करने के लिए करते हैं।

CLI substrate की public verbs को mirror करता है:

- `resolve` ठोस और single-match है।
- `find` wildcards, unions, predicates, और positional expansion के लिए multi-match verb है।
- `set` केवल concrete paths या insertion markers स्वीकार करता है; wildcard patterns लिखने से पहले
  reject कर दिए जाते हैं।

`path` bundled optional `oc-path` plugin द्वारा प्रदान किया जाता है। पहली बार उपयोग से पहले
इसे enable करें:

```bash
openclaw plugins enable oc-path
```

## इसका उपयोग क्यों करें

OpenClaw state human-edited markdown, commented JSONC config,
append-only JSONL logs, और YAML workflow/spec files में फैली होती है। Shell scripts, hooks,
और agents को अक्सर उन files से एक छोटा value चाहिए होता है: कोई frontmatter key, कोई
plugin setting, कोई log record field, कोई YAML step, या named
section के अंतर्गत कोई bullet item।

`openclaw path` ऐसे callers को हर file kind के लिए one-off grep,
regex, या parser के बजाय एक stable address देता है। वही `oc://` path terminal से validate,
resolve, search, dry-run, और write किया जा सकता है, जिससे संकीर्ण
automation review करना आसान और replay करना सुरक्षित होता है। यह खास तौर पर तब उपयोगी है जब
आप file की बाकी comments, line endings, और आसपास की formatting को preserve करते हुए
एक leaf update करना चाहते हैं।

इसे तब उपयोग करें जब जिस चीज़ की आपको जरूरत है उसका logical address है, लेकिन physical file
shape बदलती रहती है:

- कोई hook commented JSONC से एक setting पढ़ना चाहता है और value वापस लिखते समय comments
  खोना नहीं चाहता।
- कोई maintenance script JSONL log में हर matching event field खोजना चाहती है
  बिना पूरे log को custom parser में load किए।
- कोई editor extension slug से markdown section या bullet item पर jump करना चाहता है,
  फिर resolve हुई exact line render करना चाहता है।
- कोई agent apply करने से पहले छोटा workspace edit dry-run करना चाहता है, जिसमें
  changed bytes review में visible हों।

साधारण whole-file edits, rich
config migrations, या memory-specific writes के लिए शायद आपको `openclaw path` की जरूरत नहीं है। उन्हें owner
command या plugin का उपयोग करना चाहिए। `path` छोटे, addressable file operations के लिए है जहाँ
repeatable terminal command किसी और bespoke parser से अधिक स्पष्ट हो।

## इसका उपयोग कैसे होता है

human-edited config file से एक value पढ़ें:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

disk को छुए बिना write preview करें:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

append-only JSONL log में matching records खोजें:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

markdown में किसी instruction को line
number के बजाय section और item से address करें:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

script के पढ़ने या लिखने से पहले CI या preflight script में path validate करें:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

ये commands shell scripts में copy किए जाने के लिए हैं। जब caller को structured output चाहिए तो `--json` उपयोग करें
और जब कोई व्यक्ति result inspect कर रहा हो तो `--human` उपयोग करें।

## यह कैसे काम करता है

`openclaw path` चार चीज़ें करता है:

1. `oc://` address को slots में parse करता है: file, section, item, field, और
   optional session।
2. target extension (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster`, और related aliases) से file-kind adapter चुनता है।
3. slots को उस file kind के AST के against resolve करता है: markdown headings/items,
   JSONC object keys/array indexes, JSONL line records, या YAML map/sequence
   nodes।
4. `set` के लिए, उसी adapter के through edited bytes emit करता है ताकि untouched
   parts अपनी comments, line endings, और nearby formatting बनाए रखें
   जहाँ kind इसका support करता है।

`resolve` और `set` को एक concrete target चाहिए। `find` exploratory
verb है: यह wildcards, unions, predicates, और ordinals को concrete
matches में expand करता है जिन्हें आप write के लिए एक चुनने से पहले inspect कर सकते हैं।

## Subcommands

| Subcommand              | उद्देश्य                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | path पर concrete match print करें (या "नहीं मिला")।                       |
| `find <pattern>`        | wildcard / union / predicate path के लिए matches enumerate करें।                   |
| `set <oc-path> <value>` | concrete path पर leaf या insertion target लिखें। `--dry-run` support करता है।   |
| `validate <oc-path>`    | केवल parse; structural breakdown print करें (file / section / item / field)।      |
| `emit <file>`           | file को `parseXxx` + `emitXxx` के through round-trip करें (byte-fidelity diagnostic)। |

## Global flags

| Flag            | उद्देश्य                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | file slot को इस directory के against resolve करें (default: `process.cwd()`)। |
| `--file <path>` | file slot के resolved path को override करें (absolute access)।                |
| `--json`        | JSON output force करें (default जब stdout TTY नहीं है)।                    |
| `--human`       | human output force करें (default जब stdout TTY है)।                       |
| `--dry-run`     | (केवल `set` पर) बिना लिखे वे bytes print करें जो लिखे जाते।   |
| `--diff`        | (`set --dry-run` के साथ) full bytes के बजाय unified diff print करें।   |

## `oc://` syntax

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slot rules: `field` के लिए `item` जरूरी है, और `item` के लिए `section` जरूरी है। सभी
चार slots में:

- **Quoted segments** — `"a/b.c"` `/` और `.` separators से बचा रहता है।
  Content byte-literal है; quotes के अंदर `"` और `\` allowed नहीं हैं।
  file slot भी quote-aware है: `oc://"skills/email-drafter"/Tools/$last`
  `skills/email-drafter` को single file path मानता है।
- **Predicates** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`। Numeric ops में दोनों sides finite numbers में coerce होनी चाहिए।
- **Unions** — `{a,b,c}` किसी भी alternative से match करता है।
- **Wildcards** — `*` (single sub-segment) और `**` (zero-or-more,
  recursive)। `find` इन्हें accept करता है; `resolve` और `set` इन्हें
  ambiguous मानकर reject करते हैं।
- **Positional** — `$first` / `$last` first / last index या
  declared key में resolve होते हैं।
- **Ordinal** — document order के अनुसार Nth match के लिए `#N`।
- **Insertion markers** — keyed / indexed
  insertion के लिए `+`, `+key`, `+nnn` (`set` के साथ उपयोग करें)।
- **Session scope** — `?session=cron-daily` आदि। Slot
  nesting से orthogonal। Session values raw हैं, percent-decoded नहीं; उनमें
  control characters या reserved query delimiters (`?`, `&`, `%`) नहीं हो सकते।

quoted, predicate, या union
segments के बाहर reserved characters (`?`, `&`, `%`) reject किए जाते हैं। Control characters (U+0000-U+001F, U+007F) कहीं भी reject किए जाते हैं,
जिसमें `session` query value भी शामिल है।

canonical paths के लिए `formatOcPath(parseOcPath(path)) === path` guaranteed है।
Non-canonical query parameters को ignore किया जाता है, सिवाय पहले non-empty
`session=` value के।

## file kind के अनुसार addressing

| Kind              | Addressing model                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | slug द्वारा H2 sections, slug या `#N` द्वारा bullet items, `[frontmatter]` के through frontmatter।                 |
| JSONC/JSON        | Object keys और array indexes; quoted न होने पर dots nested sub-segments split करते हैं।                        |
| JSONL             | Top-level line addresses (`L1`, `L2`, `$first`, `$last`), फिर line के अंदर JSONC-style descent। |
| YAML/YML/.lobster | Map keys और sequence indexes; comments और flow style YAML document API द्वारा handle किए जाते हैं।        |

`resolve` structured match return करता है: `root`, `node`, `leaf`, या
`insertion-point`, 1-based line number के साथ। Leaf values text के रूप में surface होते हैं
साथ में `leafType`, ताकि plugin authors per-kind AST shape पर depend किए बिना
previews render कर सकें।

## Mutation contract

`set` एक concrete target लिखता है:

- Markdown frontmatter values और `- key: value` item fields string leaves हैं।
  Markdown insertions sections, frontmatter keys, या section items append करते हैं और
  changed file के लिए canonical markdown shape render करते हैं।
- JSONC leaf writes string value को existing leaf type में coerce करते हैं
  (`string`, finite `number`, `true`/`false`, या `null`)। जब JSONC/JSON/JSONL leaf replacement को `<value>` को JSON के रूप में parse करना चाहिए और
  shape बदल सकती है, जैसे string SecretRef shorthand को
  object से replace करना, तब `--value-json` उपयोग करें। JSONC object और array insertions `<value>` को JSON के रूप में parse करते हैं और
  ordinary leaf writes के लिए `jsonc-parser` edit path उपयोग करते हैं, comments और
  nearby formatting preserve करते हुए।
- JSONL leaf writes line के अंदर JSONC की तरह coerce करते हैं। Whole-line replacement और
  append `<value>` को JSON के रूप में parse करते हैं। Rendered JSONL file की dominant
  LF/CRLF line-ending convention preserve करता है।
- YAML leaf writes existing scalar type (`string`, finite
  `number`, `true`/`false`, या `null`) में coerce करते हैं। YAML insertions map/sequence updates के लिए bundled
  `yaml` package की document API उपयोग करते हैं। Parser errors वाले malformed YAML
  documents mutation से पहले `parse-error` के साथ refuse किए जाते हैं।

जब exact bytes मायने रखते हों, user-visible writes से पहले `--dry-run` उपयोग करें। Substrate parse/emit round-trips के लिए byte-identical output preserve करता है, लेकिन
mutation kind के आधार पर edited region या file को canonicalize कर सकता है।
जब आपको full rendered file के बजाय focused before/after patch के रूप में preview चाहिए तो
`--diff` जोड़ें।

## Examples

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

और grammar examples:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## फ़ाइल प्रकार के अनुसार रेसिपी

वही पाँच क्रियाएँ सभी प्रकारों में काम करती हैं; एड्रेसिंग योजना फ़ाइल एक्सटेंशन के आधार पर डिस्पैच करती है। नीचे दिए गए उदाहरण PR विवरण से fixtures का उपयोग करते हैं।

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` प्रेडिकेट YAML frontmatter ब्लॉक को संबोधित करता है; `tools` slug के माध्यम से `## Tools` शीर्षक से मेल खाता है, और आइटम leaves अपना slug रूप बनाए रखते हैं, भले ही स्रोत underscores का उपयोग करता हो (`send_email` → `send-email`)।

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC संपादन `jsonc-parser` से होकर जाते हैं, इसलिए `set` के बाद टिप्पणियाँ और whitespace बचा रहता है। commit करने से पहले bytes की जाँच करने के लिए पहले `--dry-run` के साथ चलाएँ।

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

हर पंक्ति एक रिकॉर्ड है। जब आपको पंक्ति संख्या नहीं पता हो, तो predicate (`[event=action]`) से संबोधित करें, या जब पता हो तो canonical `LN` segment से करें।

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML हाथ से बनाए गए parser के बजाय `yaml` package के `Document` API का उपयोग करता है, इसलिए सामान्य parse/emit round-trip टिप्पणियों और authoring shape को सुरक्षित रखते हैं, जबकि resolved paths JSONC जैसा ही map-key / sequence-index मॉडल उपयोग करते हैं। वही adapter `.yaml`, `.yml`, और `.lobster` फ़ाइलों को संभालता है।

## Subcommand संदर्भ

### `resolve <oc-path>`

एक leaf या node पढ़ें। Wildcards अस्वीकार किए जाते हैं — उनके लिए `find` का उपयोग करें। match मिलने पर `0`, साफ miss पर `1`, parse error या refused pattern पर `2` के साथ exit करता है।

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

wildcard / predicate / union pattern के लिए हर match को enumerate करें। कम से कम एक match पर `0`, शून्य पर `1` के साथ exit करता है। File-slot wildcards `OC_PATH_FILE_WILDCARD_UNSUPPORTED` के साथ अस्वीकार किए जाते हैं — कोई concrete file पास करें (multi-file globbing follow-up feature है)।

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

एक leaf लिखें। फ़ाइल को छुए बिना लिखे जाने वाले bytes का preview करने के लिए `--dry-run` के साथ pair करें। unified diff preview के लिए `--diff` जोड़ें। सफल write पर `0`, substrate द्वारा refusal पर `1` (उदाहरण के लिए, sentinel guard hit), parse errors पर `2` के साथ exit करता है।

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` insertion marker नामित child बनाता है, यदि वह पहले से मौजूद नहीं है; `+nnn` और bare `+` क्रमशः indexed और append insertion के लिए काम करते हैं।

### `validate <oc-path>`

केवल parse जाँच। कोई filesystem access नहीं। यह तब उपयोगी है जब आप variables substitute करने से पहले पुष्टि करना चाहते हैं कि template path well-formed है, या जब आप debugging के लिए structural breakdown चाहते हैं:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

valid होने पर `0`, invalid होने पर `1` (structured `code` और `message` के साथ), argument errors पर `2` के साथ exit करता है।

### `emit <file>`

किसी फ़ाइल को per-kind parser और emitter से round-trip करें। sound file पर output input के byte-identical होना चाहिए — divergence parser bug या sentinel hit को इंगित करता है। real-world inputs पर substrate behavior debug करने के लिए उपयोगी।

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Exit codes

| Code | अर्थ                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | सफलता। (`resolve` / `find`: कम से कम एक match. `set`: write सफल रहा.) |
| `1`  | कोई match नहीं, या substrate ने `set` अस्वीकार किया (कोई system-level error नहीं)।      |
| `2`  | Argument या parse error।                                                   |

## Output mode

`openclaw path` TTY-aware है: terminal पर human-readable output, stdout pipe या redirect होने पर JSON। `--json` और `--human` auto-detection को override करते हैं।

## नोट्स

- `set` substrate के emit path से bytes लिखता है, जो redaction-sentinel guard अपने-आप लागू करता है। `__OPENCLAW_REDACTED__` (verbatim या substring के रूप में) रखने वाला leaf write time पर अस्वीकार किया जाता है।
- JSONC parsing और leaf edits plugin-local `jsonc-parser` dependency का उपयोग करते हैं, इसलिए सामान्य leaf writes पर टिप्पणियाँ और formatting hand-rolled parser/re-render path से गुज़रने के बजाय सुरक्षित रहती हैं।
- `path` LKG के बारे में नहीं जानता। यदि फ़ाइल LKG-tracked है, तो अगला observe call तय करता है कि promote / recover करना है या नहीं। LKG promote/recover lifecycle के माध्यम से atomic multi-set के लिए `set --batch` LKG-recovery substrate के साथ planned है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
