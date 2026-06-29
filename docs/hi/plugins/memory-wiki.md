---
read_when:
    - आप सादी MEMORY.md टिप्पणियों से आगे स्थायी ज्ञान चाहते हैं
    - आप बंडल किए गए memory-wiki plugin को कॉन्फ़िगर कर रहे हैं
    - आप wiki_search, wiki_get, या ब्रिज मोड को समझना चाहते हैं
summary: 'memory-wiki: स्रोत-साक्ष्य, दावों, डैशबोर्ड और ब्रिज मोड के साथ संकलित ज्ञान भंडार'
title: मेमोरी विकि
x-i18n:
    generated_at: "2026-06-28T23:38:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` एक bundled Plugin है, जो टिकाऊ मेमरी को संकलित ज्ञान वॉल्ट में बदलता है।

यह Active Memory Plugin को **प्रतिस्थापित नहीं** करता। Active Memory Plugin अब भी recall, promotion, indexing, और dreaming का स्वामी है। `memory-wiki` इसके साथ रहता है और टिकाऊ ज्ञान को deterministic पेजों, संरचित दावों, provenance, dashboards, और मशीन-पठनीय digests वाली नेविगेट की जा सकने वाली wiki में संकलित करता है।

इसे तब उपयोग करें जब आप चाहते हैं कि मेमरी Markdown फ़ाइलों के ढेर जैसी कम और एक मेंटेन की गई ज्ञान परत जैसी अधिक व्यवहार करे।

## यह क्या जोड़ता है

- deterministic पेज layout वाला समर्पित wiki वॉल्ट
- केवल गद्य नहीं, बल्कि संरचित claim और evidence metadata
- पेज-स्तरीय provenance, confidence, contradictions, और open questions
- agent/runtime उपभोक्ताओं के लिए compiled digests
- wiki-native search/get/apply/lint tools
- Open Knowledge Format imports को compiled wiki concepts में बदलना
- वैकल्पिक bridge mode, जो Active Memory Plugin से public artifacts import करता है
- वैकल्पिक Obsidian-friendly render mode और CLI integration

## यह मेमरी के साथ कैसे फिट बैठता है

विभाजन को इस तरह सोचें:

| परत                                                    | स्वामित्व                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho, etc.) | Recall, semantic search, promotion, dreaming, memory runtime                               |
| `memory-wiki`                                          | Compiled wiki pages, provenance-rich syntheses, dashboards, wiki-specific search/get/apply |

यदि Active Memory Plugin साझा recall artifacts expose करता है, तो OpenClaw `memory_search corpus=all` के साथ दोनों परतों को एक ही pass में search कर सकता है।

जब आपको wiki-specific ranking, provenance, या direct page access चाहिए, तो इसके बजाय wiki-native tools उपयोग करें।

## अनुशंसित hybrid pattern

local-first setups के लिए एक मजबूत default है:

- recall और broad semantic search के लिए Active Memory backend के रूप में QMD
- टिकाऊ synthesized knowledge pages के लिए `bridge` mode में `memory-wiki`

यह विभाजन अच्छा काम करता है क्योंकि हर परत focused रहती है:

- QMD raw notes, session exports, और अतिरिक्त collections को searchable रखता है
- `memory-wiki` stable entities, claims, dashboards, और source pages compile करता है

व्यावहारिक नियम:

- जब आप मेमरी में एक broad recall pass चाहते हों, तो `memory_search` उपयोग करें
- जब आप provenance-aware wiki results चाहते हों, तो `wiki_search` और `wiki_get` उपयोग करें
- जब आप shared search को दोनों परतों तक फैलाना चाहते हों, तो `memory_search corpus=all` उपयोग करें

यदि bridge mode zero exported artifacts report करता है, तो Active Memory Plugin अभी public bridge inputs expose नहीं कर रहा है। पहले `openclaw wiki doctor` चलाएँ, फिर पुष्टि करें कि Active Memory Plugin public artifacts support करता है।

जब bridge mode active हो और `bridge.readMemoryArtifacts` enabled हो, तो `openclaw wiki status`, `openclaw wiki doctor`, और `openclaw wiki bridge
import` running Gateway के माध्यम से पढ़ते हैं। इससे CLI bridge checks runtime memory Plugin context के साथ aligned रहते हैं। यदि bridge disabled है या artifact reads बंद हैं, तो वे commands अपना local/offline behavior बनाए रखते हैं।

## Vault modes

`memory-wiki` तीन vault modes support करता है:

### `isolated`

अपना vault, अपने sources, `memory-core` पर कोई dependency नहीं।

इसे तब उपयोग करें जब आप चाहते हैं कि wiki अपना curated knowledge store हो।

### `bridge`

Public Plugin SDK seams के माध्यम से Active Memory Plugin से public memory artifacts और memory events पढ़ता है।

इसे तब उपयोग करें जब आप चाहते हैं कि wiki memory Plugin के exported artifacts को compile और organize करे, private Plugin internals में पहुँचे बिना।

Bridge mode इन्हें index कर सकता है:

- exported memory artifacts
- dream reports
- daily notes
- memory root files
- memory event logs

### `unsafe-local`

local private paths के लिए explicit same-machine escape hatch।

यह mode जानबूझकर experimental और non-portable है। इसे केवल तब उपयोग करें जब आप trust boundary समझते हों और खास तौर पर local filesystem access की जरूरत हो जो bridge mode नहीं दे सकता।

## Vault layout

Plugin vault को इस तरह initialize करता है:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Managed content generated blocks के भीतर रहता है। Human note blocks सुरक्षित रखे जाते हैं।

मुख्य page groups हैं:

- imported raw material और bridge-backed pages के लिए `sources/`
- टिकाऊ चीज़ों, लोगों, systems, projects, और objects के लिए `entities/`
- ideas, abstractions, patterns, और policies के लिए `concepts/`
- compiled summaries और maintained rollups के लिए `syntheses/`
- generated dashboards के लिए `reports/`

## Open Knowledge Format imports

`memory-wiki` unpacked Open Knowledge Format bundles को इससे import कर सकता है:

```bash
openclaw wiki okf import ./bundles/ga4
```

यह सबसे साफ़ fit है जब data catalog, documentation crawler, या enrichment agent पहले से OKF produce करता है: OKF को portable exchange artifact के रूप में रखें, फिर `memory-wiki` को उसे OpenClaw-native concept pages और compiled digests में बदलने दें।

Importer OKF v0.1 shape follow करता है:

- non-reserved `.md` files concept documents होती हैं
- हर imported concept को non-empty `type` frontmatter field चाहिए
- unknown OKF `type` values स्वीकार की जाती हैं
- reserved `index.md` और `log.md` files concepts के रूप में import नहीं की जातीं
- broken या external markdown links सुरक्षित रखे जाते हैं

Imported concept pages को `concepts/` के अंतर्गत flatten किया जाता है, ताकि existing compile, search, get, dashboard, और prompt-digest paths उन्हें दूसरी wiki tree जोड़े बिना देख सकें। हर page original OKF concept ID, source path, `type`, `resource`, `tags`, timestamp, और full producer frontmatter रखता है। Internal OKF links generated wiki concept pages पर rewrite किए जाते हैं और `kind: okf-link` के साथ structured `relationships` entries के रूप में भी emit किए जाते हैं।

## Structured claims और evidence

Pages structured `claims` frontmatter रख सकते हैं, सिर्फ freeform text नहीं।

हर claim में ये शामिल हो सकते हैं:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidence entries में ये शामिल हो सकते हैं:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

यही wiki को passive note dump की बजाय belief layer जैसा अधिक बनाता है। Claims को track, score, contest, और sources तक resolve किया जा सकता है।

## Agent-facing entity metadata

Entity pages agent use के लिए routing metadata भी रख सकते हैं। यह generic frontmatter है, इसलिए यह people, teams, systems, projects, या किसी भी other entity type के लिए काम करता है।

Common fields में शामिल हैं:

- `entityType`: उदाहरण के लिए `person`, `team`, `system`, या `project`
- `canonicalId`: aliases और imports में उपयोग की जाने वाली stable identity key
- `aliases`: names, handles, या labels जिन्हें उसी page पर resolve होना चाहिए
- `privacyTier`: `public`, `local-private`, `sensitive`, या `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: compact routing hints
- `lastRefreshedAt`: page edit time से अलग source-refresh timestamp
- `personCard`: optional person-specific routing card जिसमें handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence, और privacy हों
- `relationships`: target, kind, weight,
  confidence, evidence kind, privacy tier, और note के साथ related pages तक typed edges

people wiki के लिए, agent को आमतौर पर `reports/person-agent-directory.md` से शुरू करना चाहिए, फिर contact details या inferred facts उपयोग करने से पहले `wiki_get` के साथ person page खोलना चाहिए।

उदाहरण:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Compile pipeline

Compile step wiki pages पढ़ता है, summaries normalize करता है, और stable machine-facing artifacts यहाँ emit करता है:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

ये digests इसलिए मौजूद हैं ताकि agents और runtime code को Markdown pages scrape न करने पड़ें।

Compiled output यह भी power करता है:

- search/get flows के लिए first-pass wiki indexing
- owning pages तक claim-id lookup
- compact prompt supplements
- report/dashboard generation

## Dashboards और health reports

जब `render.createDashboards` enabled हो, compile `reports/` के अंतर्गत dashboards maintain करता है।

Built-in reports में शामिल हैं:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

ये reports इन जैसी चीज़ें track करती हैं:

- contradiction note clusters
- competing claim clusters
- structured evidence missing वाले claims
- low-confidence pages और claims
- stale या unknown freshness
- unresolved questions वाले pages
- person/entity routing cards
- structured relationship edges
- evidence class coverage
- non-public privacy tiers जिन्हें use से पहले review चाहिए

## Search और retrieval

`memory-wiki` दो search backends support करता है:

- `shared`: उपलब्ध होने पर shared memory search flow उपयोग करें
- `local`: wiki को locally search करें

यह तीन corpora भी support करता है:

- `wiki`
- `memory`
- `all`

महत्वपूर्ण behavior:

- `wiki_search` और `wiki_get` संभव होने पर first pass के रूप में compiled digests उपयोग करते हैं
- claim ids owning page तक वापस resolve हो सकते हैं
- contested/stale/fresh claims ranking को प्रभावित करते हैं
- provenance labels results में बच सकते हैं
- search mode person lookup, question routing, source
  evidence, या raw claims के लिए ranking bias कर सकता है

व्यावहारिक नियम:

- एक broad recall pass के लिए `memory_search corpus=all` उपयोग करें
- जब आपको wiki-specific ranking,
  provenance, या page-level belief structure की परवाह हो, तो `wiki_search` + `wiki_get` उपयोग करें

Search modes:

- `auto`: balanced default
- `find-person`: person-like entities, aliases, handles, socials, और
  canonical IDs को boost करें
- `route-question`: agent cards, ask-for hints, best-used-for hints, और
  relationship context को boost करें
- `source-evidence`: source pages और structured evidence metadata को boost करें
- `raw-claim`: matching structured claims को boost करें और results में claim/evidence
  metadata लौटाएँ

जब कोई result structured claim से match करता है, तो `wiki_search` अपने details payload में `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, और `evidenceSourceIds` लौटा सकता है। Text output में उपलब्ध होने पर compact `Claim:` और `Evidence:` lines भी शामिल होती हैं।

## Agent tools

Plugin ये tools register करता है:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

वे क्या करते हैं:

- `wiki_status`: current vault mode, health, Obsidian CLI availability
- `wiki_search`: wiki pages और, configured होने पर, shared memory corpora search करता है;
  person lookup, question routing, source evidence, या raw
  claim drilldown के लिए `mode` स्वीकार करता है
- `wiki_get`: id/path से wiki page पढ़ता है या shared memory corpus पर fall back करता है
- `wiki_apply`: freeform page surgery के बिना narrow synthesis/metadata mutations
- `wiki_lint`: structural checks, provenance gaps, contradictions, open questions

Plugin एक गैर-विशिष्ट मेमरी कॉर्पस सप्लीमेंट भी रजिस्टर करता है, ताकि साझा
`memory_search` और `memory_get` wiki तक पहुंच सकें जब सक्रिय मेमरी
Plugin कॉर्पस चयन का समर्थन करता हो।

## प्रॉम्प्ट और संदर्भ व्यवहार

जब `context.includeCompiledDigestPrompt` सक्षम होता है, मेमरी प्रॉम्प्ट सेक्शन
`agent-digest.json` से एक संक्षिप्त कम्पाइल्ड स्नैपशॉट जोड़ते हैं।

वह स्नैपशॉट जानबूझकर छोटा और उच्च-संकेत वाला है:

- केवल शीर्ष पेज
- केवल शीर्ष दावे
- विरोधाभास संख्या
- प्रश्न संख्या
- विश्वास/ताजगी क्वालिफायर

यह ऑप्ट-इन है क्योंकि यह प्रॉम्प्ट आकार बदलता है और मुख्य रूप से उन संदर्भ
इंजनों या पुराने प्रॉम्प्ट असेंबली के लिए उपयोगी है जो स्पष्ट रूप से मेमरी सप्लीमेंट का उपयोग करते हैं।

## कॉन्फ़िगरेशन

कॉन्फ़िग को `plugins.entries.memory-wiki.config` के अंतर्गत रखें:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

मुख्य टॉगल:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` या `obsidian`
- `bridge.readMemoryArtifacts`: सक्रिय मेमरी Plugin के सार्वजनिक आर्टिफैक्ट इम्पोर्ट करें
- `bridge.followMemoryEvents`: ब्रिज मोड में इवेंट लॉग शामिल करें
- `search.backend`: `shared` या `local`
- `search.corpus`: `wiki`, `memory`, या `all`
- `context.includeCompiledDigestPrompt`: मेमरी प्रॉम्प्ट सेक्शन में संक्षिप्त डाइजेस्ट स्नैपशॉट जोड़ें
- `render.createBacklinks`: नियतात्मक संबंधित ब्लॉक जनरेट करें
- `render.createDashboards`: डैशबोर्ड पेज जनरेट करें

### उदाहरण: QMD + ब्रिज मोड

इसका उपयोग तब करें जब आप रिकॉल के लिए QMD और एक मेंटेन किए गए
ज्ञान स्तर के लिए `memory-wiki` चाहते हों:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

यह बनाए रखता है:

- सक्रिय मेमरी रिकॉल का नियंत्रण QMD के पास
- कम्पाइल्ड पेजों और डैशबोर्ड पर केंद्रित `memory-wiki`
- प्रॉम्प्ट आकार तब तक अपरिवर्तित जब तक आप जानबूझकर कम्पाइल्ड डाइजेस्ट प्रॉम्प्ट सक्षम नहीं करते

## CLI

`memory-wiki` एक शीर्ष-स्तरीय CLI सतह भी उपलब्ध कराता है:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

पूर्ण कमांड संदर्भ के लिए [CLI: wiki](/hi/cli/wiki) देखें।

## Obsidian समर्थन

जब `vault.renderMode` `obsidian` होता है, तो Plugin Obsidian-अनुकूल
Markdown लिखता है और वैकल्पिक रूप से आधिकारिक `obsidian` CLI का उपयोग कर सकता है।

समर्थित वर्कफ़्लो में शामिल हैं:

- स्टेटस प्रॉबिंग
- वॉल्ट खोज
- पेज खोलना
- Obsidian कमांड चलाना
- दैनिक नोट पर जाना

यह वैकल्पिक है। wiki Obsidian के बिना भी नेटिव मोड में काम करती है।

## अनुशंसित वर्कफ़्लो

1. रिकॉल/प्रमोशन/dreaming के लिए अपना सक्रिय मेमरी Plugin रखें।
2. `memory-wiki` सक्षम करें।
3. जब तक आप स्पष्ट रूप से ब्रिज मोड नहीं चाहते, `isolated` मोड से शुरू करें।
4. जब स्रोत-प्रमाण मायने रखता हो, `wiki_search` / `wiki_get` का उपयोग करें।
5. संकीर्ण संश्लेषण या मेटाडेटा अपडेट के लिए `wiki_apply` का उपयोग करें।
6. सार्थक बदलावों के बाद `wiki_lint` चलाएं।
7. यदि आप पुरानेपन/विरोधाभास दृश्यता चाहते हैं, तो डैशबोर्ड चालू करें।

## संबंधित दस्तावेज़

- [मेमरी अवलोकन](/hi/concepts/memory)
- [CLI: memory](/hi/cli/memory)
- [CLI: wiki](/hi/cli/wiki)
- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
