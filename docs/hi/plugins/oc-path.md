---
read_when:
    - आप टर्मिनल से किसी workspace फ़ाइल के भीतर एक single leaf का निरीक्षण या संपादन करना चाहते हैं
    - आप कार्यक्षेत्र की स्थिति के आधार पर स्क्रिप्ट लिख रहे हैं और आपको एक स्थिर, प्रकार-निरपेक्ष संबोधन योजना चाहिए
    - आप यह तय कर रहे हैं कि self-hosted Gateway पर वैकल्पिक `oc-path` Plugin सक्षम करना है या नहीं
summary: 'बंडल किया गया `oc-path` Plugin: `oc://` workspace-file एड्रेसिंग योजना के लिए `openclaw path` CLI शिप करता है'
title: OC Path प्लगइन
x-i18n:
    generated_at: "2026-06-28T23:38:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

बंडल किया गया `oc-path` Plugin [`openclaw path`](/hi/cli/path) CLI को
`oc://` workspace-file एड्रेसिंग स्कीम के लिए जोड़ता है। यह OpenClaw रिपॉज़िटरी में
`extensions/oc-path/` के अंतर्गत आता है, लेकिन opt-in है — install/build इसे तब तक निष्क्रिय छोड़ता है जब तक आप
इसे सक्षम नहीं करते।

`oc://` पते workspace file के अंदर किसी एक leaf (या leaves के wildcard set) की ओर संकेत करते हैं।
Plugin आज चार तरह की फ़ाइलों को समझता है:

- **markdown** (`.md`, `.mdx`): frontmatter, sections, items, fields
- **jsonc** (`.jsonc`, `.json5`, `.json`): comments और formatting संरक्षित रहती है
- **jsonl** (`.jsonl`, `.ndjson`): line-oriented records
- **yaml** (`.yaml`, `.yml`, `.lobster`): YAML document API के ज़रिए map/sequence/scalar nodes

Self-hosters और editor extensions CLI का उपयोग SDK के विरुद्ध सीधे scripting किए बिना किसी एक leaf को पढ़ने या लिखने के लिए करते हैं; agents और hooks इसे deterministic substrate मानते हैं ताकि byte-fidelity round-trips और redaction
sentinel guard सभी kinds पर समान रूप से लागू हों।

## इसे क्यों सक्षम करें

`oc-path` को तब सक्षम करें जब आप scripts, hooks, या local agent tooling को हर file
shape के लिए parser बनाए बिना workspace state के किसी सटीक हिस्से की ओर संकेत करवाना चाहते हों।
एक `oc://` पता markdown frontmatter key, section
item, JSONC config leaf, JSONL event field, या YAML workflow step को नाम दे सकता है।

यह maintainer workflows के लिए महत्वपूर्ण है, जहाँ change छोटा,
auditable, और repeatable होना चाहिए: एक value inspect करें, matching records ढूँढें, write का dry-run करें,
फिर comments, line endings, और आसपास की formatting को वैसा ही रखते हुए केवल वही leaf apply करें।
इसे opt-in Plugin रखने से power users को
addressing substrate मिलता है, बिना उन installs के core में parser dependencies या CLI surface डाले
जिन्हें इसकी कभी ज़रूरत नहीं होती।

इसे सक्षम करने के सामान्य कारण:

- **Local automation**: shell scripts अलग-अलग markdown, JSONC,
  JSONL, और YAML parsing code रखने के बजाय `openclaw path … --json` से एक workspace value
  resolve या update कर सकते हैं।
- **Agent-visible edits**: agent लिखने से पहले किसी एक addressed
  leaf के लिए dry-run diff दिखा सकता है, जिसकी review free-form file rewrite से आसान होती है।
- **Editor integrations**: editor `oc://AGENTS.md/tools/gh` को
  heading text से अनुमान लगाए बिना exact markdown node और line number पर map कर सकता है।
- **Diagnostics**: `emit` फ़ाइल को parser और emitter के ज़रिए round-trip करता है, ताकि
  automated edits पर निर्भर होने से पहले आप जाँच सकें कि file kind byte-stable है या नहीं।

ठोस उदाहरण:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin जानबूझकर higher-level semantics का owner नहीं है। Memory
plugins अब भी memory writes के owner हैं, config commands अब भी full config
management के owner हैं, और LKG logic अब भी restore/promotion का owner है। `oc-path` वह संकीर्ण
addressing और byte-preserving file operation layer है जिसके आसपास वे higher-level tools
बन सकते हैं।

## यह कहाँ चलता है

Plugin उस host पर **`openclaw` CLI के अंदर in-process** चलता है जहाँ आप
command invoke करते हैं। इसे running Gateway की ज़रूरत नहीं होती और यह कोई
network sockets नहीं खोलता — हर verb उस file पर pure transform है जिसकी ओर आप इसे point करते हैं।

Plugin metadata `extensions/oc-path/openclaw.plugin.json` में रहता है:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` Plugin को Gateway hot path से बाहर रखता है। `onCommands:
["path"]` CLI को बताता है कि पहली बार `openclaw path …` चलाने पर Plugin को lazily load करे,
इसलिए जो installs इस verb का कभी उपयोग नहीं करते, उन्हें कोई cost नहीं देनी पड़ती।

## सक्षम करें

```bash
openclaw plugins enable oc-path
```

Gateway को restart करें (यदि आप एक चलाते हैं) ताकि manifest snapshot नई
state उठा ले। Bare `openclaw path` invocations उसी host पर तुरंत काम करते हैं —
CLI मांग पर Plugin load करता है।

Disable करने के लिए:

```bash
openclaw plugins disable oc-path
```

## Dependencies

सभी parser dependencies Plugin-local हैं — `oc-path` सक्षम करने से core runtime में
नए packages नहीं आते:

| Dependency     | उद्देश्य                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit` के लिए subcommand wiring।    |
| `jsonc-parser` | comments और trailing commas रखते हुए JSONC parse + leaf edits।       |
| `markdown-it`  | section / item / field model के लिए Markdown tokenization।            |
| `yaml`         | comments और flow style रखते हुए YAML `Document` parse / emit / edit। |

JSONL hand-rolled रहता है — line-oriented parsing किसी भी
dependency से सरल है, और per-line JSONC parse पहले ही `jsonc-parser` से गुजरता है।

## यह क्या देता है

| Surface                        | इससे मिलता है                                             |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` parser / formatter     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Per-kind parse / emit / edit   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Universal resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaction-sentinel guard       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI आज एकमात्र public surface है। substrate verbs Plugin के लिए private हैं;
consumers CLI का उपयोग करते हैं (या SDK के विरुद्ध अपना Plugin बनाते हैं)।

## दूसरे plugins से संबंध

- **`memory-*`**: memory writes `oc-path` से नहीं, memory plugins से गुजरते हैं।
  `oc-path` generic file substrate है; memory plugins इसके ऊपर अपनी
  semantics layer करते हैं।
- **LKG**: `path` Last-Known-Good config restore के बारे में नहीं जानता। यदि कोई
  file LKG-tracked है, तो अगला `observe` call तय करता है कि promote करना है या
  recover; LKG promote/recover lifecycle के ज़रिए atomic multi-set के लिए
  `set --batch` LKG-recovery substrate के साथ planned है।

## Safety

`set` substrate के emit path के ज़रिए raw bytes लिखता है, जो
redaction-sentinel guard को automatically apply करता है। ऐसा leaf जिसमें
`__OPENCLAW_REDACTED__` (verbatim या substring के रूप में) हो, write time पर
`OC_EMIT_SENTINEL` के साथ refuse कर दिया जाता है। CLI अपने द्वारा print किए गए किसी भी
human या JSON output से literal sentinel को scrub भी करता है, उसे `[REDACTED]` से replace करता है ताकि terminal
captures और pipelines marker leak न करें।

## संबंधित

- [`openclaw path` CLI reference](/hi/cli/path)
- [Plugins manage करें](/hi/plugins/manage-plugins)
- [Plugins बनाना](/hi/plugins/building-plugins)
