---
read_when:
    - आप समझना चाहते हैं कि Task Flow पृष्ठभूमि कार्यों से कैसे संबंधित है
    - आपको रिलीज़ नोट्स या दस्तावेज़ों में Task Flow या OpenClaw कार्य प्रवाह मिलता है
    - आप स्थायी फ़्लो स्थिति का निरीक्षण या प्रबंधन करना चाहते हैं
summary: पृष्ठभूमि कार्यों के ऊपर कार्य प्रवाह ऑर्केस्ट्रेशन परत
title: कार्य प्रवाह
x-i18n:
    generated_at: "2026-07-02T08:17:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow वह flow orchestration substrate है जो [पृष्ठभूमि कार्यों](/hi/automation/tasks) के ऊपर बैठता है। यह अपनी अलग state, revision tracking, और sync semantics वाले टिकाऊ multi-step flows को प्रबंधित करता है, जबकि अलग-अलग tasks detached work की unit बने रहते हैं।

## Task Flow का उपयोग कब करें

Task Flow का उपयोग तब करें जब काम कई क्रमिक या branching steps में फैला हो और आपको gateway restarts के पार टिकाऊ progress tracking चाहिए। एकल background operations के लिए, एक साधारण [task](/hi/automation/tasks) पर्याप्त है।

| परिदृश्य                              | उपयोग                 |
| ------------------------------------- | -------------------- |
| एकल background job                    | साधारण task          |
| Multi-step pipeline (A फिर B फिर C)   | Task Flow (managed)  |
| बाहरी रूप से बनाए गए tasks देखें      | Task Flow (mirrored) |
| One-shot reminder                     | Cron job             |

## भरोसेमंद scheduled workflow pattern

Market intelligence briefings जैसे recurring workflows के लिए, schedule, orchestration, और reliability checks को अलग-अलग layers मानें:

1. Timing के लिए [Scheduled Tasks](/hi/automation/cron-jobs) का उपयोग करें।
2. जब workflow को पिछले context पर बनना चाहिए, तो persistent cron session का उपयोग करें।
3. Deterministic steps, approval gates, और resume tokens के लिए [Lobster](/hi/tools/lobster) का उपयोग करें।
4. Child tasks, waits, retries, और gateway restarts के पार multi-step run को track करने के लिए Task Flow का उपयोग करें।

Example cron shape:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

जब recurring workflow को deliberate history, previous run summaries, या standing context चाहिए, तो `isolated` के बजाय `session:<id>` का उपयोग करें। जब हर run fresh शुरू होना चाहिए और सभी required state workflow में explicit हो, तो `isolated` का उपयोग करें।

Workflow के अंदर, LLM summary step से पहले reliability checks रखें:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Recommended preflight checks:

- Browser availability और profile choice, उदाहरण के लिए managed state के लिए `openclaw` या जब signed-in Chrome session required हो तो `user`। [Browser](/hi/tools/browser) देखें।
- हर source के लिए API credentials और quota।
- Required endpoints के लिए network reachability।
- Agent के लिए enabled required tools, जैसे `lobster`, `browser`, और `llm-task`।
- Cron के लिए failure destination configured हो ताकि preflight failures visible रहें। [Scheduled Tasks](/hi/automation/cron-jobs#delivery-and-output) देखें।

हर collected item के लिए recommended data provenance fields:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Workflow को summarization से पहले stale items reject या mark करने दें। LLM step को केवल structured JSON मिलना चाहिए और उससे अपने output में `sourceUrl`, `retrievedAt`, और `asOf` preserve करने के लिए कहा जाना चाहिए। जब workflow के अंदर schema-validated model step चाहिए, तो [LLM Task](/hi/tools/llm-task) का उपयोग करें।

Reusable team या community workflows के लिए, CLI, `.lobster` files, और कोई भी setup notes को skill या plugin के रूप में package करें और उसे [ClawHub](/clawhub) के माध्यम से publish करें। Workflow-specific guardrails उसी package में रखें, जब तक कि plugin API में कोई required generic capability missing न हो।

## Sync modes

### Managed mode

Task Flow lifecycle को end-to-end own करता है। यह flow steps के रूप में tasks बनाता है, उन्हें completion तक drive करता है, और flow state को automatically आगे बढ़ाता है।

Example: एक weekly report flow जो (1) data gather करता है, (2) report generate करता है, और (3) उसे deliver करता है। Task Flow हर step को background task के रूप में बनाता है, completion की प्रतीक्षा करता है, फिर अगले step पर जाता है।

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mirrored mode

Task Flow बाहरी रूप से बनाए गए tasks को observe करता है और task creation की ownership लिए बिना flow state को sync में रखता है। यह तब उपयोगी है जब tasks cron jobs, CLI commands, या अन्य sources से originate होते हैं और आप उनकी progress को flow के रूप में unified view में देखना चाहते हैं।

Example: तीन independent cron jobs जो मिलकर एक "morning ops" routine बनाते हैं। एक mirrored flow उनकी collective progress को track करता है, बिना यह control किए कि वे कब या कैसे run करते हैं।

## Durable state और revision tracking

हर flow अपनी state persist करता है और revisions track करता है ताकि progress gateway restarts के बाद भी बनी रहे। जब कई sources same flow को concurrently advance करने का प्रयास करते हैं, तो revision tracking conflict detection सक्षम करती है।
Flow registry bounded write-ahead-log maintenance के साथ SQLite का उपयोग करती है, जिसमें
periodic और shutdown checkpoints शामिल हैं, ताकि long-running gateways
unbounded `registry.sqlite-wal` sidecar files retain न करें।

## Cancel behavior

`openclaw tasks flow cancel` flow पर sticky cancel intent set करता है। Flow के भीतर active tasks cancel किए जाते हैं, और कोई new steps start नहीं किए जाते। Cancel intent restarts के पार persist रहता है, इसलिए cancelled flow cancelled ही रहता है, भले ही सभी child tasks terminate होने से पहले gateway restart हो जाए।

## CLI commands

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Command                           | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Status और sync mode के साथ tracked flows दिखाता है |
| `openclaw tasks flow show <id>`   | Flow id या lookup key से एक flow inspect करें |
| `openclaw tasks flow cancel <id>` | Running flow और उसके active tasks cancel करें |

## Flows tasks से कैसे संबंधित हैं

Flows tasks को coordinate करते हैं, उन्हें replace नहीं करते। एक single flow अपनी lifetime में multiple background tasks drive कर सकता है। Individual task records inspect करने के लिए `openclaw tasks` और orchestrating flow inspect करने के लिए `openclaw tasks flow` का उपयोग करें।

## Related

- [Background Tasks](/hi/automation/tasks) — detached work ledger जिसे flows coordinate करते हैं
- [CLI: tasks](/hi/cli/tasks) — `openclaw tasks flow` के लिए CLI command reference
- [Automation Overview](/hi/automation) — सभी automation mechanisms एक नजर में
- [Cron Jobs](/hi/automation/cron-jobs) — scheduled jobs जो flows में feed कर सकते हैं
