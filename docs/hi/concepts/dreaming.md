---
read_when:
    - आप चाहते हैं कि मेमोरी प्रमोशन स्वचालित रूप से चले
    - आप समझना चाहते हैं कि प्रत्येक Dreaming चरण क्या करता है
    - आप MEMORY.md को दूषित किए बिना समेकन को ट्यून करना चाहते हैं
sidebarTitle: Dreaming
summary: हल्के, गहरे और REM चरणों के साथ पृष्ठभूमि मेमोरी समेकन और एक स्वप्न डायरी
title: Dreaming
x-i18n:
    generated_at: "2026-06-28T22:57:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming, `memory-core` में पृष्ठभूमि memory consolidation प्रणाली है। यह OpenClaw को मजबूत अल्पकालिक संकेतों को टिकाऊ memory में ले जाने में मदद करता है, जबकि प्रक्रिया को समझाने योग्य और समीक्षा योग्य बनाए रखता है।

<Note>
Dreaming **opt-in** है और डिफ़ॉल्ट रूप से अक्षम रहता है।
</Note>

## Dreaming क्या लिखता है

Dreaming दो प्रकार के आउटपुट रखता है:

- `memory/.dreams/` में **मशीन स्थिति** (recall store, phase signals, ingestion checkpoints, locks)।
- `DREAMS.md` (या मौजूदा `dreams.md`) में **मानव-पठनीय आउटपुट** और `memory/dreaming/<phase>/YYYY-MM-DD.md` के अंतर्गत वैकल्पिक phase report फ़ाइलें।

दीर्घकालिक promotion अब भी केवल `MEMORY.md` में लिखता है।

## Phase model

Dreaming तीन सहयोगी phases का उपयोग करता है:

| Phase | उद्देश्य                                  | टिकाऊ write       |
| ----- | ----------------------------------------- | ----------------- |
| Light | हाल की अल्पकालिक सामग्री को क्रमबद्ध और stage करना | नहीं              |
| Deep  | टिकाऊ candidates को score और promote करना | हाँ (`MEMORY.md`) |
| REM   | themes और दोहराए जाने वाले ideas पर विचार करना | नहीं              |

ये phases आंतरिक implementation details हैं, अलग user-configured "modes" नहीं।

<AccordionGroup>
  <Accordion title="Light phase">
    Light phase हाल के दैनिक memory signals और recall traces को ingest करता है, उन्हें dedupe करता है, और candidate lines को stage करता है।

    - उपलब्ध होने पर short-term recall state, हाल की दैनिक memory files, और redacted session transcripts से पढ़ता है।
    - जब storage में inline output शामिल हो, तो managed `## Light Sleep` block लिखता है।
    - बाद की deep ranking के लिए reinforcement signals रिकॉर्ड करता है।
    - कभी भी `MEMORY.md` में नहीं लिखता।

  </Accordion>
  <Accordion title="Deep phase">
    Deep phase तय करता है कि क्या long-term memory बनेगा।

    - weighted scoring और threshold gates का उपयोग करके candidates को rank करता है।
    - pass करने के लिए `minScore`, `minRecallCount`, और `minUniqueQueries` की आवश्यकता होती है।
    - लिखने से पहले live daily files से snippets को rehydrate करता है, इसलिए stale/deleted snippets छोड़ दिए जाते हैं।
    - promoted entries को `MEMORY.md` में append करता है।
    - `DREAMS.md` में `## Deep Sleep` summary लिखता है और वैकल्पिक रूप से `memory/dreaming/deep/YYYY-MM-DD.md` लिखता है।

  </Accordion>
  <Accordion title="REM phase">
    REM phase patterns और reflective signals निकालता है।

    - हाल के short-term traces से theme और reflection summaries बनाता है।
    - जब storage में inline output शामिल हो, तो managed `## REM Sleep` block लिखता है।
    - deep ranking द्वारा उपयोग किए जाने वाले REM reinforcement signals रिकॉर्ड करता है।
    - कभी भी `MEMORY.md` में नहीं लिखता।

  </Accordion>
</AccordionGroup>

## Session transcript ingestion

Dreaming redacted session transcripts को dreaming corpus में ingest कर सकता है। जब transcripts उपलब्ध होते हैं, तो उन्हें दैनिक memory signals और recall traces के साथ light phase में भेजा जाता है। Personal और sensitive content ingestion से पहले redact किया जाता है।

## स्वप्न डायरी

Dreaming `DREAMS.md` में एक narrative **स्वप्न डायरी** भी रखता है। प्रत्येक phase में पर्याप्त सामग्री होने के बाद, `memory-core` best-effort background subagent turn चलाता है और एक छोटी diary entry append करता है। जब तक `dreaming.model` configured न हो, यह default runtime model का उपयोग करता है। यदि configured model उपलब्ध नहीं है, तो स्वप्न डायरी session default model के साथ एक बार retry करती है।

<Note>
यह diary Dreams UI में human reading के लिए है, promotion source नहीं। Dreaming-generated diary/report artifacts short-term promotion से exclude किए जाते हैं। केवल grounded memory snippets `MEMORY.md` में promote होने के eligible हैं।
</Note>

Review और recovery work के लिए एक grounded historical backfill lane भी है:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` historical `YYYY-MM-DD.md` notes से grounded diary output preview करता है।
    - `memory rem-backfill --path ...` reversible grounded diary entries को `DREAMS.md` में लिखता है।
    - `memory rem-backfill --path ... --stage-short-term` grounded durable candidates को उसी short-term evidence store में stage करता है जिसका normal deep phase पहले से उपयोग करता है।
    - `memory rem-backfill --rollback` और `--rollback-short-term` ordinary diary entries या live short-term recall को छुए बिना उन staged backfill artifacts को हटाते हैं।

  </Accordion>
</AccordionGroup>

Control UI वही diary backfill/reset flow expose करता है, ताकि आप grounded candidates promotion के योग्य हैं या नहीं यह तय करने से पहले Dreams scene में results inspect कर सकें। Scene एक अलग grounded lane भी दिखाता है, ताकि आप देख सकें कि कौन-सी staged short-term entries historical replay से आईं, कौन-से promoted items grounded-led थे, और ordinary live short-term state को छुए बिना केवल grounded-only staged entries clear कर सकें।

## Deep ranking signals

Deep ranking छह weighted base signals और phase reinforcement का उपयोग करता है:

| Signal              | Weight | विवरण                                            |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | entry ने कितने short-term signals जमा किए |
| Relevance           | 0.30   | entry के लिए average retrieval quality |
| Query diversity     | 0.15   | अलग-अलग query/day contexts जिन्होंने इसे surfaced किया |
| Recency             | 0.15   | time-decayed freshness score |
| Consolidation       | 0.10   | multi-day recurrence strength |
| Conceptual richness | 0.06   | snippet/path से concept-tag density |

Light और REM phase hits `memory/.dreams/phase-signals.json` से छोटा recency-decayed boost जोड़ते हैं।

Shadow-trial results को किसी भी durable write से पहले review signal के रूप में उस base score के ऊपर layer किया जा सकता है। Helpful trial candidate को छोटा bounded boost देता है, neutral trial उसे deferred रखता है, और harmful trial उस scoring pass के लिए उसे rejected चिह्नित करता है। यह signal अभी भी report-only है: यह candidate ordering या review metadata बदल सकता है, लेकिन यह `MEMORY.md` में नहीं लिखता या candidate को अपने आप promote नहीं करता।

## QA shadow trial report coverage

QA Lab में यह explore करने के लिए report-only scenario शामिल है कि future dreaming shadow trial promotion से पहले candidate memory की review कैसे कर सकता है। Scenario एक agent से baseline answer की तुलना उस answer से करने को कहता है जो candidate memory का उपयोग कर सकता है, फिर verdict, reason, और risk flags के साथ local report लिखता है।

यह coverage जानबूझकर QA तक scoped है। यह verify करता है कि report artifact `MEMORY.md` से अलग रहता है और agent यह दावा नहीं करता कि candidate promote हुआ था। यह production shadow-trial behavior नहीं जोड़ता या deep-phase promotion engine नहीं बदलता।

`memory-core` shadow-trial runner उन code paths के लिए वही report-only contract रखता है जिन्हें stable artifact चाहिए। यह candidate, trial prompt, baseline outcome, candidate outcome, verdict, reason, risk flags, और evidence references स्वीकार करता है, फिर `promotion action: report-only` के साथ report लिखता है। Helpful verdicts `promote` recommendation से map होते हैं, neutral verdicts `defer` से map होते हैं, और harmful verdicts `reject` से map होते हैं; इनमें से कोई भी recommendation `MEMORY.md` में नहीं लिखती या deep-phase promotion लागू नहीं करती।

## Scheduling

Enabled होने पर, `memory-core` full dreaming sweep के लिए एक Cron job auto-manage करता है। प्रत्येक sweep phases को क्रम में चलाता है: light → REM → deep।

Sweep में primary runtime workspace और कोई भी configured agent workspaces शामिल होते हैं, path के आधार पर dedupe किए हुए, ताकि subagent workspace fan-out main agent के `DREAMS.md` और memory state को exclude न करे।

Default cadence behavior:

| Setting              | Default       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | default model |

## Quick start

<Tabs>
  <Tab title="Enable dreaming">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Custom sweep cadence">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Slash command

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI workflow

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manual `memory promote` default रूप से deep-phase thresholds का उपयोग करता है, जब तक कि CLI flags से override न किया जाए।

  </Tab>
  <Tab title="Explain promotion">
    समझाएँ कि कोई specific candidate promote क्यों होगा या क्यों नहीं होगा:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    कुछ भी लिखे बिना REM reflections, candidate truths, और deep promotion output preview करें:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Key defaults

सभी settings `plugins.entries.memory-core.config.dreaming` के अंतर्गत रहते हैं।

<ParamField path="enabled" type="boolean" default="false">
  dreaming sweep को enable या disable करें।
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  full dreaming sweep के लिए Cron cadence।
</ParamField>
<ParamField path="model" type="string">
  वैकल्पिक स्वप्न डायरी subagent model override। subagent `allowedModels` allowlist set करते समय canonical `provider/model` value का उपयोग करें।
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` में promote किए गए प्रत्येक short-term recall snippet से रखा गया maximum estimated token count। Ranking provenance visible रहता है।
</ParamField>

<Warning>
`dreaming.model` के लिए `plugins.entries.memory-core.subagent.allowModelOverride: true` आवश्यक है। इसे restrict करने के लिए, `plugins.entries.memory-core.subagent.allowedModels` भी set करें। Trust या allowlist failures silently fallback करने के बजाय visible रहते हैं; retry केवल model-unavailable errors को cover करता है।
</Warning>

<Note>
अधिकांश phase policy, thresholds, और storage behavior internal implementation details हैं। पूरी key list के लिए [Memory configuration reference](/hi/reference/memory-config#dreaming) देखें।
</Note>

## Dreams UI

Enabled होने पर, Gateway **Dreams** tab दिखाता है:

- वर्तमान dreaming enabled state
- phase-level status और managed-sweep presence
- short-term, grounded, signal, और promoted-today counts
- अगला scheduled run timing
- staged historical replay entries के लिए अलग grounded Scene lane
- `doctor.memory.dreamDiary` द्वारा backed expandable स्वप्न डायरी reader

## Dreaming कभी नहीं चलता: status blocked दिखाता है

यदि `openclaw memory status` `Dreaming status: blocked` report करता है, तो managed cron मौजूद है लेकिन default agent Heartbeat fire नहीं हो रहा। जाँचें कि default agent के लिए Heartbeat enabled है और उसका target `none` नहीं है, फिर अगले Heartbeat interval के बाद `openclaw memory status --deep` फिर से चलाएँ।

## Related

- [Memory](/hi/concepts/memory)
- [Memory CLI](/hi/cli/memory)
- [Memory configuration reference](/hi/reference/memory-config)
- [Memory search](/hi/concepts/memory-search)
