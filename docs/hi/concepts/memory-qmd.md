---
read_when:
    - आप QMD को अपने मेमोरी बैकएंड के रूप में सेट अप करना चाहते हैं
    - आप पुनः-रैंकिंग या अतिरिक्त अनुक्रमित पाथ जैसी उन्नत मेमोरी सुविधाएँ चाहते हैं
summary: BM25, वेक्टर, पुनः-रैंकिंग और क्वेरी विस्तार के साथ लोकल-फ़र्स्ट खोज साइडकार
title: QMD मेमोरी इंजन
x-i18n:
    generated_at: "2026-06-28T22:59:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) एक local-first खोज साइडकार है जो
OpenClaw के साथ चलता है। यह BM25, वेक्टर खोज, और पुनः-रैंकिंग को एकल
बाइनरी में जोड़ता है, और आपके workspace memory फ़ाइलों से आगे की सामग्री को
इंडेक्स कर सकता है।

## यह builtin की तुलना में क्या जोड़ता है

- बेहतर recall के लिए **पुनः-रैंकिंग और क्वेरी विस्तार**।
- **अतिरिक्त डायरेक्टरियां इंडेक्स करें** -- प्रोजेक्ट डॉक्स, टीम नोट्स, डिस्क पर कुछ भी।
- **session transcripts इंडेक्स करें** -- पहले की बातचीत याद करें।
- **पूरी तरह स्थानीय** -- आधिकारिक llama.cpp provider plugin के साथ चलता है और
  GGUF मॉडल अपने-आप डाउनलोड करता है।
- **स्वचालित fallback** -- यदि QMD उपलब्ध नहीं है, तो OpenClaw बिना रुकावट
  अंतर्निहित इंजन पर वापस चला जाता है।

## शुरू करना

### पूर्वापेक्षाएं

- QMD इंस्टॉल करें: `npm install -g @tobilu/qmd` या `bun install -g @tobilu/qmd`
- ऐसा SQLite build जो extensions की अनुमति देता हो (macOS पर `brew install sqlite`)।
- QMD gateway के `PATH` पर होना चाहिए।
- macOS और Linux सीधे काम करते हैं। Windows के लिए WSL2 के माध्यम से सबसे अच्छा समर्थन है।

### सक्षम करें

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw `~/.openclaw/agents/<agentId>/qmd/` के अंतर्गत एक self-contained QMD home बनाता है और साइडकार lifecycle
अपने-आप प्रबंधित करता है -- collections, updates, और embedding runs आपके लिए संभाले जाते हैं।
यह वर्तमान QMD collection और MCP query shapes को प्राथमिकता देता है, लेकिन जरूरत पड़ने पर
alternate collection pattern flags और पुराने MCP tool names पर फिर भी fallback करता है।
Boot-time reconciliation पुराने QMD collection के उसी नाम से मौजूद होने पर stale managed collections को उनके
canonical patterns पर वापस भी फिर से बनाता है।

## साइडकार कैसे काम करता है

- OpenClaw आपके workspace memory files और किसी भी configured `memory.qmd.paths` से collections बनाता है, फिर QMD manager खुलने पर और उसके बाद समय-समय पर (default हर 5 मिनट) `qmd update` चलाता है। ये refreshes QMD subprocesses के माध्यम से चलते हैं, in-process filesystem crawl से नहीं। Semantic modes `qmd embed` भी चलाते हैं।
- default workspace collection `MEMORY.md` और `memory/`
  tree को track करता है। Lowercase `memory.md` root memory file के रूप में indexed नहीं होता।
- QMD का अपना scanner hidden paths और सामान्य dependency/build
  directories जैसे `.git`, `.cache`, `node_modules`, `vendor`, `dist`, और
  `build` को अनदेखा करता है। Gateway startup default रूप से QMD initialize नहीं करता, इसलिए cold boot
  memory के पहली बार उपयोग से पहले memory runtime import करने या long-lived watcher बनाने से बचता है।
- यदि आप फिर भी gateway start पर QMD initialized चाहते हैं, तो
  `memory.qmd.update.startup` को `idle` या `immediate` पर set करें। `memory.qmd.update.onBoot: true` के साथ, startup initial refresh चलाता है। `onBoot: false` के साथ, startup उस immediate refresh को skip करता है लेकिन update या embed intervals configured होने पर long-lived manager फिर भी खोलता है, ताकि QMD अपने regular watcher और timers own कर सके।
- Searches configured `searchMode` का उपयोग करती हैं (default: `search`; `vsearch` और `query` भी समर्थित हैं)। `search` केवल BM25 है, इसलिए OpenClaw उस mode में semantic vector readiness probes और embedding maintenance skip करता है। यदि कोई mode fail होता है, तो OpenClaw `qmd query` के साथ retry करता है।
- जब `searchMode` `query` हो, तो reranker के बिना QMD के hybrid query path का उपयोग करने के लिए `memory.qmd.rerank` को `false` पर set करें। OpenClaw direct QMD CLI path को `--no-rerank` और QMD के MCP query tool को `rerank: false` pass करता है। इस option के लिए QMD 2.1 या नया आवश्यक है।
- multi-collection filters advertise करने वाले QMD releases के साथ, OpenClaw same-source collections को एक QMD search invocation में group करता है। पुराने QMD releases compatible per-collection fallback रखते हैं।
- यदि QMD पूरी तरह fail हो जाता है, तो OpenClaw अंतर्निहित SQLite engine पर fallback करता है।
  Repeated chat-turn attempts open failure के बाद थोड़ी देर back off करते हैं ताकि missing binary या broken sidecar dependency retry storm न बनाए;
  `openclaw memory status` और one-shot CLI probes फिर भी QMD को सीधे recheck करते हैं।

<Info>
पहली search धीमी हो सकती है -- QMD पहले `qmd query` run पर पुनः-रैंकिंग और query expansion के लिए GGUF models (~2 GB) auto-download करता है।
</Info>

## खोज performance और compatibility

OpenClaw QMD search path को current और पुराने दोनों QMD installs के साथ compatible रखता है।

Startup पर, OpenClaw installed QMD help text को प्रति manager एक बार check करता है। यदि binary multiple collection filters के support को advertise करती है, तो OpenClaw सभी same-source collections को एक command से search करता है:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

यह हर durable-memory collection के लिए एक QMD subprocess शुरू करने से बचाता है।
Session transcript collections अपने source group में रहती हैं, इसलिए mixed
`memory` + `sessions` searches फिर भी दोनों sources से result diversifier input देती हैं।

पुराने QMD builds केवल एक collection filter स्वीकार करते हैं। जब OpenClaw उन builds में से एक detect करता है, तो यह compatibility path रखता है और results merge तथा deduplicate करने से पहले हर collection को अलग-अलग search करता है।

Installed contract को manually inspect करने के लिए चलाएं:

```bash
qmd --help | grep -i collection
```

Current QMD help कहता है कि collection filters एक या अधिक collections को target कर सकते हैं।
पुराना help आमतौर पर single collection का वर्णन करता है।

## Model overrides

QMD model environment variables gateway process से unchanged pass through होते हैं, इसलिए आप नया OpenClaw config जोड़े बिना QMD को globally tune कर सकते हैं:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding model बदलने के बाद, embeddings फिर से चलाएं ताकि index नए vector space से मेल खाए।

## अतिरिक्त paths इंडेक्स करना

अतिरिक्त directories को searchable बनाने के लिए QMD को उन पर point करें:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Extra paths से snippets search results में `qmd/<collection>/<relative-path>` के रूप में दिखते हैं।
`memory_get` इस prefix को समझता है और सही collection root से पढ़ता है।

## Session transcripts इंडेक्स करना

पहले की बातचीत recall करने के लिए session indexing सक्षम करें। QMD को general
`memorySearch` session source और QMD transcript exporter दोनों चाहिए:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transcripts को sanitized User/Assistant turns के रूप में `~/.openclaw/agents/<id>/qmd/sessions/` के अंतर्गत dedicated QMD
collection में export किया जाता है। केवल
`memorySearch.experimental.sessionMemory` set करने से transcripts QMD में export नहीं होते।

Session hits अभी भी
[`tools.sessions.visibility`](/hi/gateway/config-tools#toolssessions) द्वारा filtered होते हैं। default
`tree` visibility unrelated same-agent sessions expose नहीं करती। यदि
gateway-dispatched session को अलग DM session से recallable होना चाहिए, तो
`tools.sessions.visibility: "agent"` जानबूझकर set करें।

## Search scope

Default रूप से, QMD search results direct और channel sessions में surfaced होते हैं
(groups में नहीं)। इसे बदलने के लिए `memory.qmd.scope` configure करें:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

जब scope किसी search को deny करता है, तो OpenClaw derived channel और chat type के साथ warning log करता है ताकि empty results debug करना आसान हो।

## Citations

जब `memory.citations` `auto` या `on` हो, तो search snippets में
`Source: <path#line>` footer शामिल होता है। footer omit करने के लिए `memory.citations = "off"` set करें, जबकि path agent को internally pass होता रहेगा।

## कब उपयोग करें

QMD चुनें जब आपको चाहिए:

- higher-quality results के लिए पुनः-रैंकिंग।
- workspace के बाहर project docs या notes search करना।
- past session conversations recall करना।
- बिना API keys के पूरी तरह स्थानीय search।

सरल setups के लिए, [builtin engine](/hi/concepts/memory-builtin) बिना extra dependencies के अच्छी तरह काम करता है।

## Troubleshooting

**QMD नहीं मिला?** सुनिश्चित करें कि binary gateway के `PATH` पर है। यदि OpenClaw
service के रूप में चलता है, तो symlink बनाएं:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

यदि `qmd --version` आपके shell में काम करता है लेकिन OpenClaw फिर भी
`spawn qmd ENOENT` report करता है, तो gateway process का `PATH` संभवतः आपके
interactive shell से अलग है। Binary को explicitly pin करें:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

जहां QMD installed है उस environment में `command -v qmd` उपयोग करें, फिर
`openclaw memory status --deep` से recheck करें।

**पहली search बहुत धीमी है?** QMD पहली बार उपयोग पर GGUF models download करता है। OpenClaw जिन XDG dirs का उपयोग करता है, उन्हीं के साथ `qmd query "test"` से pre-warm करें।

**Search के दौरान कई QMD subprocesses?** संभव हो तो QMD update करें। OpenClaw
same-source multi-collection searches के लिए एक process तभी उपयोग करता है जब installed
QMD multiple `-c` filters के support को advertise करता है; अन्यथा correctness के लिए पुराने
per-collection fallback को रखता है।

**BM25-only QMD फिर भी llama.cpp build करने की कोशिश कर रहा है?** Set करें
`memory.qmd.searchMode = "search"`। OpenClaw उस mode को lexical-only मानता है,
QMD vector status probes या embedding maintenance नहीं चलाता, और
semantic readiness checks को `vsearch` या `query` setups पर छोड़ता है।

**Search time out हो रही है?** `memory.qmd.limits.timeoutMs` बढ़ाएं (default: 4000ms)।
Slower hardware के लिए `120000` set करें।

**Group chats में empty results?** `memory.qmd.scope` check करें -- default केवल
direct और channel sessions allow करता है।

**Root memory search अचानक बहुत broad हो गई?** Gateway restart करें या
अगले startup reconciliation की प्रतीक्षा करें। OpenClaw same-name conflict detect करने पर stale managed collections को canonical `MEMORY.md` और `memory/` patterns पर वापस recreate करता है।

**Workspace-visible temp repos से `ENAMETOOLONG` या broken indexing हो रही है?**
QMD traversal अभी OpenClaw के builtin symlink rules के बजाय underlying QMD scanner behavior का पालन करता है। Temporary monorepo checkouts को `.tmp/` जैसी hidden directories के अंतर्गत या indexed QMD roots के बाहर रखें, जब तक QMD cycle-safe traversal या explicit exclusion controls expose नहीं करता।

## Configuration

पूरे config surface (`memory.qmd.*`), search modes, update intervals,
scope rules, और अन्य सभी knobs के लिए
[Memory configuration reference](/hi/reference/memory-config) देखें।

## Related

- [Memory overview](/hi/concepts/memory)
- [Builtin memory engine](/hi/concepts/memory-builtin)
- [Honcho memory](/hi/concepts/memory-honcho)
