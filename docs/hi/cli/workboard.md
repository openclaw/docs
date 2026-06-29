---
read_when:
    - आप टर्मिनल से Workboard कार्ड देखना या बनाना चाहते हैं
    - आप CLI से कार्यबोर्ड वर्कर रन प्रेषित करना चाहते हैं
    - आप Workboard CLI या स्लैश कमांड व्यवहार को डीबग कर रहे हैं
summary: '`openclaw workboard` कार्ड, डिस्पैच, और worker रन के लिए CLI संदर्भ'
title: वर्कबोर्ड CLI
x-i18n:
    generated_at: "2026-06-28T22:55:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` bundled
[Workboard Plugin](/hi/plugins/workboard) के लिए terminal surface है। यह किसी संचालक को cards सूचीबद्ध करने, एक
card बनाने, एक card निरीक्षण करने, और चल रहे Gateway से ready work को
सबएजेंट वर्कर runs में dispatch करवाने देता है।

command इस्तेमाल करने से पहले Plugin सक्षम करें:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## उपयोग

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

command वही Plugin-स्वामित्व वाला SQLite database पढ़ता और लिखता है जिसका उपयोग
dashboard और Workboard agent tools करते हैं। Card ids को पूरा id देकर या
जब command card id स्वीकार करता है तब अस्पष्टता-रहित prefix देकर पास किया जा सकता है।

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Text output संक्षिप्त होता है:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Columns हैं id prefix, status, priority, board id, वैकल्पिक agent id, और title।

Flags:

| Flag                 | उद्देश्य                                      |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | परिणामों को एक board namespace तक सीमित करें          |
| `--status <status>`  | परिणामों को एक Workboard status तक सीमित करें         |
| `--include-archived` | संक्षिप्त text output में archived cards शामिल करें |
| `--json`             | पूरी card list को machine JSON के रूप में print करें      |

संक्षिप्त text output default रूप से archived cards छिपाता है ताकि CLI
`/workboard list` command से मेल खाए। उन्हें दिखाने के लिए `--include-archived` पास करें। JSON output
मौजूदा automation के लिए archived cards सहित पूरी card list रखता है।

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Flags:

| Flag                    | उद्देश्य                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | शुरुआती card notes                      |
| `--status <status>`     | शुरुआती status, default `todo`          |
| `--priority <priority>` | Priority, default `normal`              |
| `--agent <id>`          | card को किसी agent या owner id को assign करें |
| `--board <id>`          | card को किसी board namespace पर store करें     |
| `--labels <items>`      | comma-separated labels                  |
| `--json`                | बनाए गए card को machine JSON के रूप में print करें  |

`create` सीधे Workboard SQLite state में लिखता है। card तुरंत
Control UI Workboard tab और Workboard tools में दिखाई देता है।

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Text output संक्षिप्त card line और notes print करता है। JSON output पूरा
card record लौटाता है, जिसमें execution metadata, attempts, comments, links, proof,
artifacts, worker logs, protocol state, diagnostics, और automation metadata शामिल हैं।

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` पहले चल रहे Gateway RPC method
`workboard.cards.dispatch` को call करता है। यह path dashboard dispatch action जैसा ही
सबएजेंट runtime इस्तेमाल करता है, इसलिए ready cards linked session keys वाले
task-tracked worker runs बन जाते हैं। assigned agent वाले cards agent-scoped subagent
session keys इस्तेमाल करते हैं; unassigned cards unscoped subagent key रखते हैं ताकि Gateway का
configured default agent सुरक्षित रहे।

dispatch loop:

1. dependency-ready children को `ready` में promote करता है।
2. expired claims या timed-out worker runs को block करता है।
3. ready cards पर dispatch metadata record करता है।
4. unclaimed ready cards का छोटा batch select करता है।
5. हर selected card को dispatcher या assigned agent के लिए claim करता है।
6. bounded card context और card claim token के साथ subagent worker run शुरू करता है।
7. worker run id, session key, Gateway task ledger के report करने पर task linkage,
   execution status, और worker log को card पर store करता है।

Selection जानबूझकर conservative है। एक dispatch default रूप से अधिकतम तीन
workers शुरू करता है, archived या already-claimed cards skip करता है, और एक single pass में प्रति
owner या agent केवल एक card शुरू करता है। active running
या review work के ownership में पहले से मौजूद cards को बाद के dispatch के लिए छोड़ दिया जाता है।

अगर card claim होने के बाद worker start fail होता है, तो Workboard उस card को block करता है,
claim clear करता है, और failure को card execution और worker-log
metadata में record करता है। इससे failed starts चुपचाप card को queue में लौटाने के बजाय visible रहते हैं।

अगर कोई explicit Gateway target नहीं दिया गया है और local Gateway unavailable है
या अभी Workboard dispatch method expose नहीं करता है, तो CLI local Workboard state के विरुद्ध
data-only dispatch पर fallback करता है। Data-only dispatch फिर भी dependencies promote कर सकता है,
stale claims clean कर सकता है, और timed-out runs block कर सकता है, लेकिन यह
workers शुरू नहीं करता। Auth, permission, validation failures, और explicit `--url` या `--token`
target के failures सीधे report किए जाते हैं।

Text output worker starts report करता है:

```text
dispatch complete: started=2 failures=0
```

Fallback output explicit होता है:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON output में dispatch result शामिल होता है। Gateway-backed dispatch में
`started` और `startFailures` शामिल हो सकते हैं; data-only fallback में
`gatewayUnavailable: true` शामिल होता है। Claim tokens card JSON output से redact किए जाते हैं।

dashboard में वही dispatch result short summary के रूप में दिखाया जाता है ताकि
संचालक card details खोले बिना देख सके कि कितने cards started, promoted, blocked, reclaimed, या
failed हुए।

## Slash Command समानता

Command-capable channels matching slash command इस्तेमाल कर सकते हैं:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Slash command dispatch भी Gateway subagent runtime इस्तेमाल करता है, इसलिए यह
dashboard और CLI Gateway path जैसा ही claim, worker-start, और failure behavior follow करता है।

`/workboard list` और `/workboard show` authorized command
senders के लिए read commands हैं। `/workboard create` और `/workboard dispatch` board state mutate करते हैं और
chat surfaces पर owner status या `operator.write`
या `operator.admin` वाला Gateway client require करते हैं।

## Permissions

CLI dispatch path Gateway RPC को `operator.read` और
`operator.write` scopes के साथ call करता है। read-only Gateway token read methods के जरिए Workboard data
inspect कर सकता है, लेकिन cards create या workers dispatch नहीं कर सकता।

Local `list`, `create`, और `show` commands current profile द्वारा इस्तेमाल की जाने वाली local OpenClaw state
directory पर operate करते हैं। जब आपको अलग state root चाहिए हो तब top-level
`openclaw` command पर `--dev` या `--profile <name>` इस्तेमाल करें।

## Troubleshooting

### कोई Cards दिखाई नहीं देते

Confirm करें कि Plugin उसी profile और state root के लिए enabled है:

```bash
openclaw plugins inspect workboard --runtime --json
```

अगर dashboard cards दिखाता है लेकिन CLI नहीं, तो check करें कि दोनों commands वही
`--dev` या `--profile` setting इस्तेमाल करते हैं।

### Dispatch Data-Only कहता है

Gateway start या restart करें:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

फिर `openclaw workboard dispatch` retry करें। Data-only fallback local
state cleanup के लिए उपयोगी है, लेकिन worker runs को live Gateway चाहिए।

### Dispatch कुछ शुरू नहीं करता

बिना active claim वाले कम से कम एक `ready` card के लिए check करें:

```bash
openclaw workboard list --status ready
```

Cards तब भी skip हो सकते हैं जब same owner के पास पहले से running या review
work हो। completed work को `done` में move करें, Workboard
tools के जरिए stale claims release करें, या active worker finish होने के बाद dispatch फिर चलाएं।

## संबंधित

- [Workboard Plugin](/hi/plugins/workboard)
- [CLI reference](/hi/cli)
- [Slash commands](/hi/tools/slash-commands)
- [Control UI](/hi/web/control-ui)
