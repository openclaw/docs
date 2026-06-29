---
read_when:
    - आप समझना चाहते हैं कि मेमोरी कैसे काम करती है
    - आप जानना चाहते हैं कि कौन-सी मेमोरी फ़ाइलें लिखनी हैं
summary: OpenClaw सत्रों के बीच चीज़ों को कैसे याद रखता है
title: मेमोरी का अवलोकन
x-i18n:
    generated_at: "2026-06-28T22:59:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw आपके एजेंट के workspace में **साधारण Markdown फ़ाइलें** लिखकर चीज़ें याद रखता है। मॉडल केवल वही "याद रखता" है जो डिस्क पर सहेजा जाता है — कोई छिपी हुई स्थिति नहीं होती।

## यह कैसे काम करता है

आपके एजेंट के पास memory से संबंधित तीन फ़ाइलें होती हैं:

- **`MEMORY.md`** — दीर्घकालिक memory। टिकाऊ तथ्य, प्राथमिकताएँ, और
  निर्णय। हर DM session की शुरुआत में लोड की जाती है।
- **`memory/YYYY-MM-DD.md`** (या **`memory/YYYY-MM-DD-<slug>.md`**) — दैनिक नोट्स।
  चल रहा context और अवलोकन। आज और कल के नोट्स अपने-आप लोड होते हैं,
  और `/new` या `/reset` पर bundled session-memory hook द्वारा लिखे गए slugged variants
  अब date-only फ़ाइल के साथ चुने जाते हैं।
- **`DREAMS.md`** (वैकल्पिक) — मानव समीक्षा के लिए Dream Diary और dreaming sweep
  सारांश, जिनमें grounded historical backfill entries शामिल हैं।

ये फ़ाइलें एजेंट workspace में रहती हैं (default `~/.openclaw/workspace`)।

## क्या कहाँ जाता है

`MEMORY.md` संक्षिप्त, curated layer है। इसे टिकाऊ तथ्यों,
प्राथमिकताओं, स्थायी निर्णयों, और छोटे सारांशों के लिए उपयोग करें जिन्हें
मुख्य private session की शुरुआत में उपलब्ध होना चाहिए। यह raw transcript,
daily log, या exhaustive archive के लिए नहीं है।

`memory/YYYY-MM-DD.md` फ़ाइलें working layer हैं। इन्हें विस्तृत दैनिक
नोट्स, अवलोकन, session summaries, और raw context के लिए उपयोग करें जो बाद में
भी उपयोगी हो सकता है। ये फ़ाइलें `memory_search` और `memory_get` के लिए indexed होती हैं,
लेकिन हर turn पर normal bootstrap prompt में inject नहीं की जातीं।

समय के साथ, एजेंट से अपेक्षा है कि वह daily notes से उपयोगी सामग्री को
`MEMORY.md` में distill करे और stale long-term entries हटाए। generated workspace
instructions और Heartbeat flow इसे समय-समय पर कर सकते हैं; आपको हर remembered detail के लिए
`MEMORY.md` को manually edit करने की आवश्यकता नहीं है।

यदि `MEMORY.md` bootstrap file budget से आगे बढ़ जाता है, तो OpenClaw फ़ाइल को
डिस्क पर intact रखता है लेकिन model context में injected copy को truncate कर देता है। इसे
एक संकेत मानें कि detailed material को वापस `memory/*.md` में ले जाएँ, केवल
durable summary को `MEMORY.md` में रखें, या यदि आप स्पष्ट रूप से अधिक prompt budget खर्च करना
चाहते हैं तो bootstrap limits बढ़ाएँ। raw बनाम injected sizes और truncation status देखने के लिए
`/context list`, `/context detail`, या `openclaw doctor` का उपयोग करें।

<Tip>
यदि आप चाहते हैं कि आपका एजेंट कुछ याद रखे, तो बस उससे कहें: "Remember that I
prefer TypeScript." वह इसे उपयुक्त फ़ाइल में लिख देगा।
</Tip>

## Action-sensitive memories

अधिकांश memories को सामान्य Markdown notes के रूप में लिखा जा सकता है। लेकिन कुछ memories यह प्रभावित करती हैं कि एजेंट को बाद में क्या करना चाहिए। उनके लिए, केवल तथ्य ही नहीं, बल्कि यह भी capture करें कि note पर act करना कब सुरक्षित है।

जब कोई note इनसे संबंधित हो, तो उस action boundary को capture करें:

- approval या permission requirements,
- temporary constraints,
- किसी अन्य session, thread, या व्यक्ति को handoffs,
- expiry conditions,
- safe-to-act timing,
- source या owner authority,
- किसी आकर्षक action से बचने के निर्देश।

एक उपयोगी action-sensitive memory स्पष्ट करती है:

- भविष्य के behavior को क्या बदलता है,
- यह कब या किस condition में लागू होती है,
- यह कब expire होती है, या action को क्या unlock करता है,
- एजेंट को क्या करने से बचना चाहिए,
- source या owner कौन है, यदि वह trust या authority को प्रभावित करता है।

Memory approval context को preserve कर सकती है, लेकिन यह policy enforce नहीं करती। कठोर operational controls के लिए OpenClaw approval settings, sandboxing, और scheduled tasks का उपयोग करें।

उदाहरण:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

दूसरा उदाहरण:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

inferred, short-lived follow-ups के लिए [commitments](/hi/concepts/commitments) का उपयोग करें। exact reminders, timed checks, और recurring work के लिए [scheduled tasks](/hi/automation/cron-jobs) का उपयोग करें। Memory किसी भी path के आसपास durable context को फिर भी summarize कर सकती है।

यह हर memory के लिए required schema नहीं है। Simple facts concise रह सकते हैं। action-sensitive boundaries का उपयोग तब करें जब timing, authority, expiry, या safe-to-act context खोने से एजेंट बाद में गलत काम कर सकता हो।

## Inferred commitments

कुछ भविष्य के follow-ups durable facts नहीं होते। यदि आप कल होने वाले interview का उल्लेख करते हैं,
तो उपयोगी memory "interview के बाद check in करें" हो सकती है, न कि "इसे
`MEMORY.md` में हमेशा के लिए store करें।"

[Commitments](/hi/concepts/commitments) इस case के लिए opt-in, short-lived follow-up memories
हैं। OpenClaw उन्हें hidden background pass में infer करता है, उन्हें
उसी agent और channel तक scope करता है, और due check-ins Heartbeat के माध्यम से deliver करता है।
Explicit reminders अब भी [scheduled tasks](/hi/automation/cron-jobs) का उपयोग करते हैं।

## Memory tools

एजेंट के पास memory के साथ काम करने के लिए दो tools हैं:

- **`memory_search`** — semantic search का उपयोग करके relevant notes ढूँढता है, तब भी जब
  wording original से अलग हो।
- **`memory_get`** — किसी specific memory file या line range को पढ़ता है।

दोनों tools active memory Plugin द्वारा दिए जाते हैं (default: `memory-core`)।

## Memory Wiki companion Plugin

यदि आप चाहते हैं कि durable memory केवल raw notes के बजाय
maintained knowledge base की तरह behave करे, तो bundled `memory-wiki` Plugin का उपयोग करें।

`memory-wiki` durable knowledge को wiki vault में compile करता है, जिसमें शामिल हैं:

- deterministic page structure
- structured claims और evidence
- contradiction और freshness tracking
- generated dashboards
- agent/runtime consumers के लिए compiled digests
- `wiki_search`, `wiki_get`, `wiki_apply`, और `wiki_lint` जैसे wiki-native tools

यह active memory Plugin को replace नहीं करता। active memory Plugin अब भी
recall, promotion, और Dreaming का owner है। `memory-wiki` उसके साथ एक provenance-rich
knowledge layer जोड़ता है।

[Memory Wiki](/hi/plugins/memory-wiki) देखें।

## Memory search

जब embedding provider configured होता है, तो `memory_search` **hybrid
search** का उपयोग करता है — vector similarity (semantic meaning) को keyword matching
(IDs और code symbols जैसे exact terms) के साथ जोड़कर। supported provider में से किसी के लिए
API key होने पर यह out of the box काम करता है।

<Info>
OpenClaw default रूप से OpenAI embeddings का उपयोग करता है। Gemini, Voyage,
Mistral, local, Ollama, Bedrock, GitHub Copilot, या OpenAI-compatible
embeddings उपयोग करने के लिए `agents.defaults.memorySearch.provider` को explicitly set करें।
</Info>

search कैसे काम करता है, tuning options, और provider setup के details के लिए
[Memory Search](/hi/concepts/memory-search) देखें।

## Memory backends

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/hi/concepts/memory-builtin">
SQLite-based। keyword search, vector similarity, और
hybrid search के साथ out of the box काम करता है। कोई extra dependencies नहीं।
</Card>
<Card title="QMD" icon="search" href="/hi/concepts/memory-qmd">
reranking, query expansion, और workspace के बाहर directories को index करने की क्षमता वाला
local-first sidecar।
</Card>
<Card title="Honcho" icon="brain" href="/hi/concepts/memory-honcho">
user modeling, semantic search, और
multi-agent awareness वाली AI-native cross-session memory। Plugin install।
</Card>
<Card title="LanceDB" icon="layers" href="/hi/plugins/memory-lancedb">
OpenAI-compatible embeddings, auto-recall,
auto-capture, और local Ollama embedding support के साथ bundled LanceDB-backed memory।
</Card>
</CardGroup>

## Knowledge wiki layer

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/hi/plugins/memory-wiki">
claims, dashboards, bridge mode, और Obsidian-friendly workflows के साथ durable memory को provenance-rich wiki vault में compile करता है।
</Card>
</CardGroup>

## Automatic memory flush

[Compaction](/hi/concepts/compaction) आपकी conversation को summarize करने से पहले, OpenClaw
एक silent turn चलाता है जो एजेंट को important context को memory
files में save करने की याद दिलाता है। यह default रूप से on है — आपको कुछ भी configure करने की आवश्यकता नहीं है।

उस housekeeping turn को local model पर रखने के लिए, exact memory-flush model
override set करें:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

override केवल memory-flush turn पर लागू होता है और
active session fallback chain को inherit नहीं करता।

<Tip>
memory flush Compaction के दौरान context loss रोकता है। यदि आपके एजेंट के पास
conversation में important facts हैं जो अभी तक किसी file में नहीं लिखे गए हैं, तो
summary होने से पहले वे automatically saved हो जाएँगे।
</Tip>

## Dreaming

Dreaming memory के लिए optional background consolidation pass है। यह
short-term signals collect करता है, candidates को score करता है, और केवल qualified items को
long-term memory (`MEMORY.md`) में promote करता है।

इसे long-term memory को high signal रखने के लिए design किया गया है:

- **Opt-in**: default रूप से disabled।
- **Scheduled**: enabled होने पर, `memory-core` full dreaming sweep के लिए एक recurring Cron job
  auto-manage करता है।
- **Thresholded**: promotions को score, recall frequency, और query
  diversity gates pass करने होते हैं।
- **Reviewable**: phase summaries और diary entries मानव समीक्षा के लिए `DREAMS.md`
  में लिखी जाती हैं।

phase behavior, scoring signals, और Dream Diary details के लिए
[Dreaming](/hi/concepts/dreaming) देखें।

## Grounded backfill and live promotion

dreaming system में अब दो closely related review lanes हैं:

- **Live dreaming** `memory/.dreams/` के अंतर्गत short-term dreaming store से काम करता है
  और यही normal deep phase उपयोग करता है जब तय करता है कि क्या
  `MEMORY.md` में graduate हो सकता है।
- **Grounded backfill** historical `memory/YYYY-MM-DD.md` notes को
  standalone day files के रूप में पढ़ता है और structured review output को `DREAMS.md` में लिखता है।

Grounded backfill तब उपयोगी है जब आप older notes को replay करना और inspect करना चाहते हैं कि
system किसे durable मानता है, बिना `MEMORY.md` को manually edit किए।

जब आप उपयोग करते हैं:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

तो grounded durable candidates सीधे promote नहीं किए जाते। उन्हें उसी
short-term dreaming store में stage किया जाता है जिसका normal deep phase पहले से उपयोग करता है। इसका
अर्थ है:

- `DREAMS.md` human review surface बना रहता है।
- short-term store machine-facing ranking surface बना रहता है।
- `MEMORY.md` अब भी केवल deep promotion द्वारा लिखा जाता है।

यदि आप तय करते हैं कि replay उपयोगी नहीं था, तो आप ordinary diary entries या normal recall state को छुए बिना
staged artifacts हटा सकते हैं:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## आगे पढ़ें

- [Builtin memory engine](/hi/concepts/memory-builtin): default SQLite backend।
- [QMD memory engine](/hi/concepts/memory-qmd): advanced local-first sidecar।
- [Honcho memory](/hi/concepts/memory-honcho): AI-native cross-session memory।
- [Memory LanceDB](/hi/plugins/memory-lancedb): OpenAI-compatible embeddings वाला LanceDB-backed Plugin।
- [Memory Wiki](/hi/plugins/memory-wiki): compiled knowledge vault और wiki-native tools।
- [Memory search](/hi/concepts/memory-search): search pipeline, providers, और tuning।
- [Dreaming](/hi/concepts/dreaming): short-term recall से long-term memory में background promotion।
- [Memory configuration reference](/hi/reference/memory-config): सभी config knobs।
- [Compaction](/hi/concepts/compaction): Compaction memory के साथ कैसे interact करता है।

## संबंधित

- [Active memory](/hi/concepts/active-memory)
- [Memory search](/hi/concepts/memory-search)
- [Builtin memory engine](/hi/concepts/memory-builtin)
- [Honcho memory](/hi/concepts/memory-honcho)
- [Memory LanceDB](/hi/plugins/memory-lancedb)
- [Commitments](/hi/concepts/commitments)
