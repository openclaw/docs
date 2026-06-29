---
read_when:
    - आप स्पष्ट अनुमोदनों वाले नियतात्मक बहु-चरणीय कार्यप्रवाह चाहते हैं
    - आपको पहले के चरणों को फिर से चलाए बिना workflow फिर से शुरू करना होगा
summary: OpenClaw के लिए फिर से शुरू किए जा सकने वाले अनुमोदन गेट्स के साथ टाइप्ड वर्कफ़्लो रनटाइम।
title: लॉब्स्टर
x-i18n:
    generated_at: "2026-06-29T00:21:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster एक workflow shell है जो OpenClaw को स्पष्ट approval checkpoints के साथ multi-step tool sequences को एक single, deterministic operation के रूप में चलाने देता है.

Lobster detached background work के ऊपर एक authoring layer है. अलग-अलग tasks के ऊपर flow orchestration के लिए, [कार्य प्रवाह](/hi/automation/taskflow) (`openclaw tasks flow`) देखें. task activity ledger के लिए, [`openclaw tasks`](/hi/automation/tasks) देखें.

## Hook

आपका assistant अपने-आप को manage करने वाले tools बना सकता है. workflow मांगें, और 30 मिनट बाद आपके पास एक CLI और pipelines होंगे जो एक call के रूप में चलते हैं. Lobster missing piece है: deterministic pipelines, explicit approvals, और resumable state.

## क्यों

आज, complex workflows के लिए कई back-and-forth tool calls की जरूरत होती है. हर call में tokens लगते हैं, और LLM को हर step orchestrate करना पड़ता है. Lobster उस orchestration को typed runtime में ले जाता है:

- **कई की जगह एक call**: OpenClaw एक Lobster tool call चलाता है और structured result पाता है.
- **Approvals built in**: Side effects (send email, post comment) workflow को तब तक रोकते हैं जब तक explicit approval न मिल जाए.
- **Resumable**: Halted workflows एक token लौटाते हैं; सब कुछ दोबारा चलाए बिना approve करके resume करें.

## plain programs की जगह DSL क्यों?

Lobster जानबूझकर छोटा है. लक्ष्य "एक नई भाषा" नहीं है, बल्कि first-class approvals और resume tokens के साथ एक predictable, AI-friendly pipeline spec है.

- **Approve/resume built in है**: एक normal program इंसान से prompt कर सकता है, लेकिन durable token के साथ _pause और resume_ नहीं कर सकता जब तक आप वह runtime खुद न बनाएं.
- **Determinism + auditability**: Pipelines data हैं, इसलिए उन्हें log, diff, replay, और review करना आसान है.
- **AI के लिए constrained surface**: tiny grammar + JSON piping "creative" code paths घटाता है और validation को practical बनाता है.
- **Safety policy baked in**: Timeouts, output caps, sandbox checks, और allowlists runtime द्वारा enforce किए जाते हैं, हर script द्वारा नहीं.
- **फिर भी programmable**: हर step कोई भी CLI या script call कर सकता है. अगर आप JS/TS चाहते हैं, तो code से `.lobster` files generate करें.

## यह कैसे काम करता है

OpenClaw embedded runner का उपयोग करके Lobster workflows को **in-process** चलाता है. कोई external CLI subprocess spawn नहीं होता; workflow engine gateway process के अंदर execute करता है और JSON envelope सीधे लौटाता है.
अगर pipeline approval के लिए pause होती है, तो tool एक `resumeToken` लौटाता है ताकि आप बाद में continue कर सकें.

## Pattern: छोटी CLI + JSON pipes + approvals

छोटे commands बनाएं जो JSON बोलते हैं, फिर उन्हें एक single Lobster call में chain करें. (नीचे example command names हैं - अपने commands से बदलें.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

अगर pipeline approval request करती है, तो token के साथ resume करें:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI workflow trigger करता है; Lobster steps execute करता है. Approval gates side effects को explicit और auditable रखते हैं.

Example: input items को tool calls में map करें:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON-only LLM steps (llm-task)

उन workflows के लिए जिन्हें **structured LLM step** चाहिए, optional
`llm-task` plugin tool enable करें और उसे Lobster से call करें. इससे workflow
deterministic रहता है, फिर भी आप model के साथ classify/summarize/draft कर सकते हैं.

Tool enable करें:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### महत्वपूर्ण limitation: embedded Lobster बनाम `openclaw.invoke`

Bundled Lobster plugin gateway के अंदर workflows को **in-process** चलाता है. उस embedded mode में, `openclaw.invoke` nested OpenClaw CLI tool calls के लिए gateway URL/auth context automatically inherit **नहीं** करता.

इसका मतलब है कि यह pattern **embedded runner में अभी reliable नहीं है**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

नीचे दिया example केवल तब इस्तेमाल करें जब **standalone Lobster CLI** ऐसे environment में चल रही हो जहां `openclaw.invoke` पहले से correct gateway/auth context के साथ configured हो.

इसे standalone Lobster CLI pipeline में इस्तेमाल करें:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

अगर आप आज embedded Lobster plugin इस्तेमाल कर रहे हैं, तो इन में से किसी को prefer करें:

- Lobster के बाहर direct `llm-task` tool call, या
- supported embedded bridge जोड़े जाने तक Lobster pipeline के अंदर non-`openclaw.invoke` steps.

Details और configuration options के लिए [LLM Task](/hi/tools/llm-task) देखें.

## Workflow files (.lobster)

Lobster `name`, `args`, `steps`, `env`, `condition`, और `approval` fields वाली YAML/JSON workflow files चला सकता है. OpenClaw tool calls में, `pipeline` को file path पर set करें.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Notes:

- `stdin: $step.stdout` और `stdin: $step.json` किसी prior step का output pass करते हैं.
- `condition` (या `when`) `$step.approved` पर steps gate कर सकता है.

## Lobster install करें

Bundled Lobster workflows in-process चलते हैं; separate `lobster` binary की जरूरत नहीं है. Embedded runner Lobster plugin के साथ ship होता है.

अगर आपको development या external pipelines के लिए standalone Lobster CLI चाहिए, तो इसे [Lobster repo](https://github.com/openclaw/lobster) से install करें और सुनिश्चित करें कि `lobster` `PATH` पर है.

## Tool enable करें

Lobster एक **optional** Plugin tool है (default रूप से enabled नहीं).

Recommended (additive, safe):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

या per-agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

जब तक आप restrictive allowlist mode में चलाने का इरादा न रखते हों, `tools.allow: ["lobster"]` इस्तेमाल करने से बचें.

<Note>
Allowlists optional plugins के लिए opt-in हैं. `alsoAllow` normal core tool set को preserve करते हुए केवल named optional plugin tools enable करता है. Core tools restrict करने के लिए, जिन core tools या groups को आप चाहते हैं उनके साथ `tools.allow` इस्तेमाल करें.
</Note>

## Example: Email triage

Lobster के बिना:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster के साथ:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON envelope लौटाता है (truncated):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

User approves → resume:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

एक workflow. Deterministic. Safe.

## Tool parameters

### `run`

Tool mode में pipeline चलाएं.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Args के साथ workflow file चलाएं:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Approval के बाद halted workflow continue करें.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optional inputs

- `cwd`: Pipeline के लिए relative working directory (gateway working directory के अंदर ही रहनी चाहिए).
- `timeoutMs`: अगर workflow इस duration से ज्यादा हो जाए तो abort करें (default: 20000).
- `maxStdoutBytes`: अगर output इस size से ज्यादा हो जाए तो abort करें (default: 512000).
- `argsJson`: `lobster run --args-json` को pass की जाने वाली JSON string (केवल workflow files).

## Output envelope

Lobster तीन statuses में से एक के साथ JSON envelope लौटाता है:

- `ok` → successfully finished
- `needs_approval` → paused; resume करने के लिए `requiresApproval.resumeToken` required है
- `cancelled` → explicitly denied या cancelled

Tool envelope को `content` (pretty JSON) और `details` (raw object), दोनों में surface करता है.

## Approvals

अगर `requiresApproval` मौजूद है, तो prompt inspect करें और decide करें:

- `approve: true` → resume करें और side effects continue करें
- `approve: false` → workflow cancel और finalize करें

Custom jq/heredoc glue के बिना approval requests में JSON preview attach करने के लिए `approve --preview-from-stdin --limit N` इस्तेमाल करें. Resume tokens अब compact हैं: Lobster workflow resume state को अपनी state dir के अंतर्गत store करता है और एक छोटा token key वापस देता है.

## OpenProse

OpenProse Lobster के साथ अच्छी तरह pair होता है: multi-agent prep orchestrate करने के लिए `/prose` इस्तेमाल करें, फिर deterministic approvals के लिए Lobster pipeline चलाएं. अगर किसी Prose program को Lobster चाहिए, तो `tools.subagents.tools` के जरिए sub-agents के लिए `lobster` tool allow करें. [OpenProse](/hi/prose) देखें.

## Safety

- **केवल local in-process** - workflows gateway process के अंदर execute होते हैं; plugin खुद कोई network calls नहीं करता.
- **कोई secrets नहीं** - Lobster OAuth manage नहीं करता; वह OpenClaw tools call करता है जो ऐसा करते हैं.
- **Sandbox-aware** - tool context sandboxed होने पर disabled.
- **Hardened** - embedded runner द्वारा timeouts और output caps enforced.

## Troubleshooting

- **`lobster timed out`** → `timeoutMs` बढ़ाएं, या long pipeline split करें.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` बढ़ाएं या output size घटाएं.
- **`lobster returned invalid JSON`** → सुनिश्चित करें कि pipeline tool mode में चलती है और केवल JSON print करती है.
- **`lobster failed`** → embedded runner error details के लिए gateway logs देखें.

## और जानें

- [Plugins](/hi/tools/plugin)
- [Plugin tool authoring](/hi/plugins/building-plugins#registering-agent-tools)

## Case study: community workflows

एक public example: "second brain" CLI + Lobster pipelines जो तीन Markdown vaults (personal, partner, shared) manage करते हैं. CLI stats, inbox listings, और stale scans के लिए JSON emit करता है; Lobster उन commands को `weekly-review`, `inbox-triage`, `memory-consolidation`, और `shared-task-sync` जैसे workflows में chain करता है, हर एक में approval gates हैं. उपलब्ध होने पर AI judgment (categorization) handle करता है और उपलब्ध न होने पर deterministic rules पर fall back करता है.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Related

- [Automation](/hi/automation) - Lobster workflows scheduling
- [Automation Overview](/hi/automation) - सभी automation mechanisms
- [Tools Overview](/hi/tools) - सभी उपलब्ध agent tools
