---
read_when:
    - आप memory-wiki CLI का उपयोग करना चाहते हैं
    - आप `openclaw wiki` का दस्तावेज़ीकरण कर रहे हैं या उसे बदल रहे हैं।
summary: '`openclaw wiki` के लिए CLI संदर्भ (memory-wiki vault स्थिति, खोज, संकलन, lint, लागू करना, bridge, और Obsidian helpers)'
title: विकी
x-i18n:
    generated_at: "2026-06-28T22:54:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` वॉल्ट का निरीक्षण और रखरखाव करें।

बंडल किए गए `memory-wiki` Plugin द्वारा प्रदान किया गया।

संबंधित:

- [Memory Wiki Plugin](/hi/plugins/memory-wiki)
- [Memory का अवलोकन](/hi/concepts/memory)
- [CLI: memory](/hi/cli/memory)

## इसका उपयोग किस लिए है

`openclaw wiki` का उपयोग तब करें जब आपको इनके साथ एक संकलित ज्ञान वॉल्ट चाहिए:

- wiki-नेटिव खोज और पेज पढ़ना
- उद्गम-संपन्न संश्लेषण
- विरोधाभास और ताज़गी रिपोर्ट
- सक्रिय memory Plugin से bridge imports
- वैकल्पिक Obsidian CLI helpers

## सामान्य कमांड

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## कमांड

### `wiki status`

मौजूदा वॉल्ट मोड, स्वास्थ्य, और Obsidian CLI उपलब्धता का निरीक्षण करें।

जब आप निश्चित न हों कि वॉल्ट आरंभ किया गया है या नहीं, bridge मोड स्वस्थ है
या नहीं, या Obsidian एकीकरण उपलब्ध है या नहीं, तो पहले इसका उपयोग करें।

जब bridge मोड सक्रिय हो और memory artifacts पढ़ने के लिए कॉन्फ़िगर किया गया
हो, तो यह कमांड चल रहे Gateway से क्वेरी करता है ताकि इसे agent/runtime
memory जैसा ही सक्रिय memory Plugin संदर्भ दिखे।

### `wiki doctor`

wiki health checks चलाएँ और कॉन्फ़िगरेशन या वॉल्ट समस्याएँ दिखाएँ।

जब bridge मोड सक्रिय हो और memory artifacts पढ़ने के लिए कॉन्फ़िगर किया गया
हो, तो यह कमांड रिपोर्ट बनाने से पहले चल रहे Gateway से क्वेरी करता है।
अक्षम bridge imports और ऐसे bridge configs जो memory artifacts नहीं पढ़ते,
स्थानीय/offline बने रहते हैं।

सामान्य समस्याओं में शामिल हैं:

- सार्वजनिक memory artifacts के बिना bridge मोड सक्षम
- अमान्य या अनुपलब्ध वॉल्ट layout
- अपेक्षित Obsidian मोड में बाहरी Obsidian CLI अनुपलब्ध

### `wiki init`

wiki वॉल्ट layout और starter pages बनाएँ।

यह top-level indexes और cache directories सहित root structure आरंभ करता है।

### `wiki ingest <path-or-url>`

content को wiki source layer में import करें।

नोट्स:

- URL ingest `ingest.allowUrlIngest` द्वारा नियंत्रित है
- imported source pages frontmatter में provenance रखते हैं
- सक्षम होने पर ingest के बाद auto-compile चल सकता है

### `wiki okf import <path>`

एक unpacked Open Knowledge Format bundle को wiki concept pages में import करें।

importer OKF directory tree में हर non-reserved `.md` concept document पढ़ता
है, एक non-empty `type` field आवश्यक करता है, और अज्ञात OKF `type` values को
generic concepts मानता है। Reserved OKF `index.md` और `log.md` files concepts
के रूप में import नहीं की जातीं।

Imported pages को `concepts/` के तहत flatten किया जाता है ताकि मौजूदा wiki
compile, search, get, digest, और dashboard flows उन्हें तुरंत देख सकें। मूल
OKF concept ID, `type`, `resource`, `tags`, timestamp, source path, और पूरा
frontmatter page frontmatter में सुरक्षित रखे जाते हैं। Internal OKF markdown
links generated wiki pages पर rewrite किए जाते हैं; broken या external links
अपरिवर्तित छोड़े जाते हैं।

उदाहरण:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

indexes, related blocks, dashboards, और compiled digests को फिर से बनाएँ।

यह इनके तहत stable machine-facing artifacts लिखता है:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

यदि `render.createDashboards` सक्षम है, तो compile report pages को भी refresh
करता है।

### `wiki lint`

वॉल्ट को lint करें और रिपोर्ट करें:

- structural issues
- provenance gaps
- contradictions
- open questions
- low-confidence pages/claims
- stale pages/claims

महत्वपूर्ण wiki updates के बाद इसे चलाएँ।

### `wiki search <query>`

wiki content खोजें।

व्यवहार config पर निर्भर करता है:

- `search.backend`: `shared` या `local`
- `search.corpus`: `wiki`, `memory`, या `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, या
  `raw-claim`

जब आपको wiki-specific ranking या provenance details चाहिए हों, तो `wiki search`
का उपयोग करें। एक broad shared recall pass के लिए, जब active memory Plugin
shared search expose करता हो, तो `openclaw memory search` को प्राथमिकता दें।

Search modes agent को सही surface चुनने में मदद करते हैं:

- `find-person`: aliases, handles, socials, canonical IDs, और person pages
- `route-question`: ask-for/best-used-for hints और relationship context
- `source-evidence`: source pages और structured evidence fields
- `raw-claim`: claim/evidence metadata के साथ structured claim text

उदाहरण:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

जब कोई result structured claim से match करता है, तो text output में `Claim:`
और `Evidence:` lines शामिल होती हैं। JSON output अतिरिक्त रूप से agent-side
drilldown के लिए `matchedClaimId`, `matchedClaimStatus`,
`matchedClaimConfidence`, `evidenceKinds`, और `evidenceSourceIds` expose करता
है।

### `wiki get <lookup>`

id या relative path से wiki page पढ़ें।

उदाहरण:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

freeform page surgery के बिना narrow mutations apply करें।

समर्थित flows में शामिल हैं:

- synthesis page बनाना/update करना
- page metadata update करना
- source ids attach करना
- questions जोड़ना
- contradictions जोड़ना
- confidence/status update करना
- structured claims लिखना

यह कमांड इसलिए मौजूद है ताकि managed blocks को manually edit किए बिना wiki
सुरक्षित रूप से विकसित हो सके।

### `wiki bridge import`

active memory Plugin से public memory artifacts को bridge-backed source pages
में import करें।

जब आप latest exported memory artifacts को wiki vault में खींचना चाहते हों, तो
`bridge` mode में इसका उपयोग करें।

active bridge artifact reads के लिए, CLI Gateway RPC के माध्यम से import route
करता है ताकि import runtime memory Plugin context का उपयोग करे। यदि bridge
imports अक्षम हैं या artifact reads बंद हैं, तो कमांड local/offline zero-import
behavior बनाए रखता है।

### `wiki unsafe-local import`

`unsafe-local` mode में explicitly configured local paths से import करें।

यह जानबूझकर experimental और same-machine only है।

### `wiki obsidian ...`

Obsidian-friendly mode में चल रहे vaults के लिए Obsidian helper commands।

Subcommands:

- `status`
- `search`
- `open`
- `command`
- `daily`

जब `obsidian.useOfficialCli` सक्षम हो, तो इनके लिए `PATH` पर official
`obsidian` CLI आवश्यक है।

## व्यावहारिक उपयोग मार्गदर्शन

- जब provenance और page identity मायने रखते हों, तो `wiki search` + `wiki get`
  का उपयोग करें।
- managed generated sections को hand-edit करने के बजाय `wiki apply` का उपयोग
  करें।
- contradictory या low-confidence content पर भरोसा करने से पहले `wiki lint` का
  उपयोग करें।
- bulk imports या source changes के बाद, जब आपको fresh dashboards और compiled
  digests तुरंत चाहिए हों, तो `wiki compile` का उपयोग करें।
- जब कोई data catalog, documentation export, या agent enrichment pipeline
  पहले से OKF markdown bundles emit करती हो, तो `wiki okf import` का उपयोग
  करें।
- जब bridge mode नए exported memory artifacts पर निर्भर हो, तो `wiki bridge
  import` का उपयोग करें।

## कॉन्फ़िगरेशन tie-ins

`openclaw wiki` का व्यवहार इनसे आकार लेता है:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

पूरे config model के लिए [Memory Wiki Plugin](/hi/plugins/memory-wiki) देखें।

## संबंधित

- [CLI reference](/hi/cli)
- [Memory wiki](/hi/plugins/memory-wiki)
