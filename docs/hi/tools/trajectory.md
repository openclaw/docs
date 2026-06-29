---
read_when:
    - यह डीबग करना कि किसी एजेंट ने किसी खास तरीके से उत्तर क्यों दिया, विफल क्यों हुआ, या टूल क्यों कॉल किए
    - OpenClaw सत्र के लिए सहायता बंडल निर्यात करना
    - प्रॉम्प्ट संदर्भ, टूल कॉल, रनटाइम त्रुटियों या उपयोग मेटाडेटा की जाँच करना
    - ट्रैजेक्टरी कैप्चर को अक्षम करना या स्थानांतरित करना
summary: OpenClaw एजेंट सत्र की डीबगिंग के लिए गोपनीय अंश हटाए गए प्रक्षेपवक्र बंडल निर्यात करें
title: ट्रैजेक्टरी बंडल
x-i18n:
    generated_at: "2026-06-29T00:25:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

ट्रैजेक्टरी कैप्चर OpenClaw का प्रति-सत्र फ्लाइट रिकॉर्डर है। यह हर agent run के लिए
एक संरचित टाइमलाइन रिकॉर्ड करता है, फिर `/export-trajectory` वर्तमान सत्र को
एक संशोधित support bundle में पैकेज करता है।

इसे तब उपयोग करें जब आपको ऐसे प्रश्नों के उत्तर देने हों:

- मॉडल को कौन-सा prompt, system prompt, और tools भेजे गए थे?
- कौन-से transcript messages और tool calls इस उत्तर तक ले गए?
- क्या run time out हुआ, abort हुआ, compact हुआ, या provider error आई?
- कौन-सा model, plugins, Skills, और runtime settings सक्रिय थे?
- provider ने कौन-सा usage और prompt-cache metadata लौटाया?

यदि आप किसी live Gateway issue के लिए व्यापक support report दाखिल कर रहे हैं, तो
[`/diagnostics`](/hi/gateway/diagnostics#chat-command) से शुरू करें। Diagnostics
sanitized Gateway bundle इकट्ठा करता है और, OpenAI Codex harness sessions के लिए,
approval के बाद Codex feedback को OpenAI servers पर भी भेज सकता है। `/export-trajectory`
का उपयोग तब करें जब आपको विशेष रूप से विस्तृत प्रति-सत्र prompt, tool, और transcript
timeline चाहिए।

## त्वरित शुरुआत

इसे सक्रिय सत्र में भेजें:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw bundle को workspace के अंतर्गत लिखता है:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

आप एक relative output directory name चुन सकते हैं:

```text
/export-trajectory bug-1234
```

custom path `.openclaw/trajectory-exports/` के अंदर resolve किया जाता है। Absolute
paths और `~` paths अस्वीकार किए जाते हैं।

Trajectory bundles में prompts, model messages, tool schemas, tool results,
runtime events, और local paths हो सकते हैं। इसलिए chat slash command हर बार
exec approval से होकर चलता है। जब आप bundle बनाना चाहते हों, तो export को एक बार
approve करें; allow-all का उपयोग न करें। group chats में, OpenClaw approval prompt
और export result को shared room में trajectory details वापस पोस्ट करने के बजाय
owner को privately भेजता है।

local inspection या support workflows के लिए, आप approved command path को सीधे भी चला सकते हैं:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## पहुंच

Trajectory export एक owner command है। sender को channel के लिए सामान्य command
authorization checks और owner checks पास करने होंगे।

## क्या रिकॉर्ड होता है

OpenClaw agent runs के लिए Trajectory capture default रूप से चालू है।

Runtime events में शामिल हैं:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, जिसमें source model, next model, failure reason/detail, chain position, और fallback ने chain को advance किया, सफल हुआ, या exhausted किया, यह शामिल है
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript events भी active session branch से पुनर्निर्मित किए जाते हैं:

- user messages
- assistant messages
- tool calls
- tool results
- compactions
- model changes
- labels और custom session entries

Events को इस schema marker के साथ JSON Lines के रूप में लिखा जाता है:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundle files

Exported bundle में ये हो सकते हैं:

| File                  | Contents                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundle schema, source files, event counts, और generated file list                             |
| `events.jsonl`        | Ordered runtime और transcript timeline                                                        |
| `session-branch.json` | Redacted active transcript branch और session header                                           |
| `metadata.json`       | OpenClaw version, OS/runtime, model, config snapshot, plugins, Skills, और prompt metadata     |
| `artifacts.json`      | Final status, errors, usage, prompt cache, compaction count, assistant text, और tool metadata |
| `prompts.json`        | Submitted prompts और selected prompt-building details                                         |
| `system-prompt.txt`   | Latest compiled system prompt, जब capture किया गया हो                                                   |
| `tools.json`          | model को भेजी गई Tool definitions, जब capture की गई हों                                              |

`manifest.json` उस bundle में मौजूद files की सूची देता है। जब session ने संबंधित
runtime data capture नहीं किया हो, तो कुछ files छोड़ी जाती हैं।

## Capture location

Default रूप से, runtime trajectory events session file के पास लिखे जाते हैं:

```text
<session>.trajectory.jsonl
```

OpenClaw session के पास एक best-effort pointer file भी लिखता है:

```text
<session>.trajectory-path.json
```

runtime trajectory sidecars को dedicated directory में store करने के लिए
`OPENCLAW_TRAJECTORY_DIR` set करें:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

जब यह variable set होता है, OpenClaw उस directory में प्रति session id एक JSONL file लिखता है।

Session maintenance trajectory sidecars को तब हटाता है जब उनकी owning session entry
sessions disk budget द्वारा pruned, capped, या evicted हो जाती है। sessions directory
के बाहर runtime files केवल तब हटाई जाती हैं जब pointer target अब भी यह साबित करता है
कि वह उसी session से संबंधित है।

## Capture बंद करें

OpenClaw शुरू करने से पहले `OPENCLAW_TRAJECTORY=0` set करें:

```bash
export OPENCLAW_TRAJECTORY=0
```

यह runtime trajectory capture को बंद करता है। `/export-trajectory` अब भी transcript
branch export कर सकता है, लेकिन compiled context, provider artifacts, और prompt
metadata जैसी runtime-only files अनुपस्थित हो सकती हैं।

## Flush timeout tune करें

OpenClaw agent cleanup के दौरान runtime trajectory sidecars flush करता है। Default
cleanup timeout 10,000 ms है। धीमे disks या large stores पर, OpenClaw शुरू करने से पहले
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` set करें:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

यह नियंत्रित करता है कि OpenClaw कब `openclaw-trajectory-flush` timeout log करे और जारी रखे।
यह trajectory size caps को नहीं बदलता। सभी agent cleanup steps को tune करने के लिए
जो explicit timeout pass नहीं करते, `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` set करें।

## Privacy and limits

Trajectory bundles support और debugging के लिए design किए गए हैं, public posting के लिए नहीं।
OpenClaw export files लिखने से पहले sensitive values redact करता है:

- credentials और ज्ञात secret-like payload fields
- image data
- local state paths
- workspace paths, जिन्हें `$WORKSPACE_DIR` से replace किया जाता है
- home directory paths, जहां detect हों

exporter input size को भी सीमित करता है:

- runtime sidecar files: live capture 10 MiB पर रुक जाता है और space remaining होने पर truncation event record करता है; export मौजूदा runtime sidecars को 50 MiB तक accept करता है
- session files: 50 MiB
- runtime events: 200,000
- total exported events: 250,000
- individual runtime event lines 256 KiB से ऊपर truncate किए जाते हैं

Bundles को अपनी team के बाहर share करने से पहले review करें। Redaction best-effort है
और हर application-specific secret को नहीं जान सकता।

## Troubleshooting

यदि export में कोई runtime events नहीं हैं:

- confirm करें कि OpenClaw `OPENCLAW_TRAJECTORY=0` के बिना शुरू किया गया था
- check करें कि `OPENCLAW_TRAJECTORY_DIR` writable directory की ओर point करता है या नहीं
- session में एक और message run करें, फिर फिर से export करें
- `runtimeEventCount` के लिए `manifest.json` inspect करें

यदि command output path reject करता है:

- `bug-1234` जैसा relative name use करें
- `/tmp/...` या `~/...` pass न करें
- export को `.openclaw/trajectory-exports/` के अंदर रखें

यदि export size error के साथ fail होता है, तो session या sidecar ने export safety limits
exceed कर दी हैं। नया session शुरू करें या smaller reproduction export करें।

## Related

- [Diffs](/hi/tools/diffs)
- [Session management](/hi/concepts/session)
- [Exec tool](/hi/tools/exec)
