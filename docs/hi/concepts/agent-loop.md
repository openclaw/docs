---
read_when:
    - आपको एजेंट लूप या जीवनचक्र घटनाओं की सटीक क्रमिक मार्गदर्शिका चाहिए
    - आप सत्र कतारबद्धता, ट्रांसक्रिप्ट लेखन, या सत्र लेखन लॉक व्यवहार बदल रहे हैं
summary: Agent लूप जीवनचक्र, स्ट्रीम, और प्रतीक्षा सेमांटिक्स
title: एजेंट लूप
x-i18n:
    generated_at: "2026-06-28T22:55:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

एजेंटिक लूप किसी एजेंट का पूरा "वास्तविक" रन होता है: इनटेक → संदर्भ असेंबली → मॉडल inference →
टूल निष्पादन → स्ट्रीमिंग replies → persistence. यह वह आधिकारिक पथ है जो किसी message को
actions और अंतिम reply में बदलता है, साथ ही session state को संगत रखता है।

OpenClaw में, loop प्रति session एक single, serialized run है, जो lifecycle और stream events emit करता है
जब model सोचता है, tools call करता है, और output stream करता है। यह doc समझाता है कि वह authentic loop
end-to-end कैसे wired है।

## एंट्री पॉइंट्स

- Gateway RPC: `agent` और `agent.wait`.
- CLI: `agent` command.

## यह कैसे काम करता है (high-level)

1. `agent` RPC params validate करता है, session resolve करता है (sessionKey/sessionId), session metadata persist करता है, और तुरंत `{ runId, acceptedAt }` लौटाता है।
2. `agentCommand` agent चलाता है:
   - model + thinking/verbose/trace defaults resolve करता है
   - skills snapshot load करता है
   - `runEmbeddedAgent` (OpenClaw agent runtime) call करता है
   - अगर embedded loop lifecycle end/error emit नहीं करता, तो **lifecycle end/error** emit करता है
3. `runEmbeddedAgent`:
   - per-session + global queues के जरिए runs serialize करता है
   - model + auth profile resolve करता है और OpenClaw session बनाता है
   - runtime events subscribe करता है और assistant/tool deltas stream करता है
   - timeout enforce करता है -> सीमा पार होने पर run abort करता है
   - Codex app-server turns के लिए, terminal event से पहले app-server progress produce करना बंद करने वाले accepted turn को abort करता है
   - payloads + usage metadata लौटाता है
4. `subscribeEmbeddedAgentSession` agent runtime events को OpenClaw `agent` stream से bridge करता है:
   - tool events => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - lifecycle events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` `waitForAgentRun` का उपयोग करता है:
   - `runId` के लिए **lifecycle end/error** का इंतजार करता है
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` लौटाता है

## Queueing + concurrency

- Runs प्रति session key (session lane) serialize होते हैं और optional रूप से global lane से गुजरते हैं।
- यह tool/session races को रोकता है और session history को consistent रखता है।
- Messaging channels queue modes (steer/followup/collect/interrupt) चुन सकते हैं जो इस lane system को feed करते हैं।
  देखें [Command Queue](/hi/concepts/queue).
- Transcript writes भी session file पर session write lock से protected होते हैं। Lock
  process-aware और file-based है, इसलिए यह उन writers को पकड़ता है जो in-process queue को bypass करते हैं या
  दूसरे process से आते हैं। Session transcript writers session busy report करने से पहले
  `session.writeLock.acquireTimeoutMs` तक wait करते हैं; default `60000` ms है।
- Session write locks default रूप से non-reentrant होते हैं। यदि कोई helper एक logical writer को preserve करते हुए
  जानबूझकर same lock की acquisition nest करता है, तो उसे स्पष्ट रूप से
  `allowReentrant: true` के साथ opt in करना होगा।

## Session + workspace preparation

- Workspace resolve और create किया जाता है; sandboxed runs sandbox workspace root पर redirect हो सकते हैं।
- Skills load किए जाते हैं (या snapshot से reused) और env तथा prompt में inject किए जाते हैं।
- Bootstrap/context files resolve किए जाते हैं और system prompt report में inject किए जाते हैं।
- Session write lock acquire किया जाता है; streaming से पहले `SessionManager` open और prepare किया जाता है। किसी भी
  बाद के transcript rewrite, compaction, या truncation path को transcript file open या mutate करने से पहले
  वही lock लेना होगा।

## Prompt assembly + system prompt

- System prompt OpenClaw के base prompt, skills prompt, bootstrap context, और per-run overrides से बनाया जाता है।
- Model-specific limits और compaction reserve tokens enforce किए जाते हैं।
- Model क्या देखता है, इसके लिए [System prompt](/hi/concepts/system-prompt) देखें।

## Hook points (जहां आप intercept कर सकते हैं)

OpenClaw में दो hook systems हैं:

- **Internal hooks** (Gateway hooks): commands और lifecycle events के लिए event-driven scripts.
- **Plugin hooks**: agent/tool lifecycle और gateway pipeline के अंदर extension points.

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: system prompt finalize होने से पहले bootstrap files बनाते समय चलता है।
  Bootstrap context files add/remove करने के लिए इसका उपयोग करें।
- **Command hooks**: `/new`, `/reset`, `/stop`, और अन्य command events (Hooks doc देखें)।

Setup और examples के लिए [Hooks](/hi/automation/hooks) देखें।

### Plugin hooks (agent + gateway lifecycle)

ये agent loop या gateway pipeline के अंदर चलते हैं:

- **`before_model_resolve`**: model resolution से पहले provider/model को deterministically override करने के लिए pre-session (कोई `messages` नहीं) चलता है।
- **`before_prompt_build`**: prompt submission से पहले `prependContext`, `systemPrompt`, `prependSystemContext`, या `appendSystemContext` inject करने के लिए session load के बाद (`messages` के साथ) चलता है। Per-turn dynamic text के लिए `prependContext` और stable guidance के लिए system-context fields का उपयोग करें, जिन्हें system prompt space में रहना चाहिए।
- **`before_agent_start`**: legacy compatibility hook जो किसी भी phase में चल सकता है; ऊपर दिए explicit hooks को prefer करें।
- **`before_agent_reply`**: inline actions के बाद और LLM call से पहले चलता है, जिससे कोई Plugin turn claim कर सकता है और synthetic reply लौटा सकता है या turn को पूरी तरह silence कर सकता है।
- **`agent_end`**: completion के बाद final message list और run metadata inspect करें।
- **`before_compaction` / `after_compaction`**: compaction cycles observe या annotate करें।
- **`before_tool_call` / `after_tool_call`**: tool params/results intercept करें।
- **`before_install`**: operator install policy चलने के बाद staged skill या Plugin install material inspect करें, जब Plugin hooks current OpenClaw process में loaded हों।
- **`tool_result_persist`**: tool results को OpenClaw-owned session transcript में लिखे जाने से पहले synchronously transform करें।
- **`message_received` / `message_sending` / `message_sent`**: inbound + outbound message hooks.
- **`session_start` / `session_end`**: session lifecycle boundaries.
- **`gateway_start` / `gateway_stop`**: gateway lifecycle events.

Outbound/tool guards के लिए hook decision rules:

- `before_tool_call`: `{ block: true }` terminal है और lower-priority handlers को रोकता है।
- `before_tool_call`: `{ block: false }` no-op है और prior block clear नहीं करता।
- `before_install`: `{ block: true }` terminal है और lower-priority handlers को रोकता है।
- `before_install`: `{ block: false }` no-op है और prior block clear नहीं करता।
- Operator-owned install allow/block decisions के लिए `before_install` नहीं, `security.installPolicy` उपयोग करें, जिन्हें CLI install और update paths cover करने चाहिए।
- `message_sending`: `{ cancel: true }` terminal है और lower-priority handlers को रोकता है।
- `message_sending`: `{ cancel: false }` no-op है और prior cancel clear नहीं करता।

Hook API और registration details के लिए [Plugin hooks](/hi/plugins/hooks) देखें।

Harnesses इन hooks को अलग तरह से adapt कर सकते हैं। Codex app-server harness documented mirrored
surfaces के लिए compatibility contract के रूप में OpenClaw Plugin hooks रखता है, जबकि Codex native hooks
एक अलग lower-level Codex mechanism बने रहते हैं।

## Streaming + partial replies

- Assistant deltas agent runtime से stream किए जाते हैं और `assistant` events के रूप में emit होते हैं।
- Block streaming partial replies को `text_end` या `message_end` पर emit कर सकती है।
- Reasoning streaming अलग stream के रूप में या block replies के रूप में emit की जा सकती है।
- Chunking और block reply behavior के लिए [Streaming](/hi/concepts/streaming) देखें।

## Tool execution + messaging tools

- Tool start/update/end events `tool` stream पर emit होते हैं।
- Tool results logging/emitting से पहले size और image payloads के लिए sanitized होते हैं।
- Messaging tool sends duplicate assistant confirmations suppress करने के लिए tracked होते हैं।

## Reply shaping + suppression

- Final payloads इनसे assemble होते हैं:
  - assistant text (और optional reasoning)
  - inline tool summaries (जब verbose + allowed हो)
  - model error होने पर assistant error text
- Exact silent token `NO_REPLY` / `no_reply` outgoing
  payloads से filtered होता है।
- Messaging tool duplicates final payload list से remove किए जाते हैं।
- यदि कोई renderable payloads नहीं बचते और tool errored होता है, तो fallback tool error reply emit होता है
  (जब तक messaging tool पहले ही user-visible reply send न कर चुका हो)।

## Compaction + retries

- Auto-compaction `compaction` stream events emit करता है और retry trigger कर सकता है।
- Retry पर, duplicate output से बचने के लिए in-memory buffers और tool summaries reset किए जाते हैं।
- Compaction pipeline के लिए [Compaction](/hi/concepts/compaction) देखें।

## Event streams (आज)

- `lifecycle`: `subscribeEmbeddedAgentSession` द्वारा emit होता है (और fallback के रूप में `agentCommand` द्वारा)
- `assistant`: agent runtime से streamed deltas
- `tool`: agent runtime से streamed tool events

## Chat channel handling

- Assistant deltas chat `delta` messages में buffered होते हैं।
- **lifecycle end/error** पर chat `final` emit होता है।

## Timeouts

- `agent.wait` default: 30s (सिर्फ wait). `timeoutMs` param override करता है।
- Agent runtime: `agents.defaults.timeoutSeconds` default 172800s (48 hours); `runEmbeddedAgent` abort timer में enforced.
- Cron runtime: isolated agent-turn `timeoutSeconds` cron के स्वामित्व में है। Scheduler execution शुरू होने पर वह timer start करता है, configured deadline पर underlying run abort करता है, फिर timeout record करने से पहले bounded cleanup चलाता है ताकि stale child session lane को stuck न रख सके।
- Session liveness diagnostics: diagnostics enabled होने पर, `diagnostics.stuckSessionWarnMs` लंबे `processing` sessions को classify करता है जिनमें कोई observed reply, tool, status, block, या ACP progress नहीं है। Active embedded runs, model calls, और tool calls `session.long_running` के रूप में report होते हैं; owned silent model calls भी `diagnostics.stuckSessionAbortMs` तक `session.long_running` रहते हैं ताकि slow या non-streaming providers को बहुत जल्दी stalled report न किया जाए। Recent progress के बिना active work `session.stalled` के रूप में report होता है; owned model calls abort threshold पर या उसके बाद `session.stalled` में switch करते हैं, और ownerless stale model/tool activity को long-running के रूप में hidden नहीं किया जाता। `session.stuck` recoverable stale session bookkeeping के लिए reserved है, जिसमें stale ownerless model/tool activity वाले idle queued sessions शामिल हैं। Stale session bookkeeping recovery gates pass होने के तुरंत बाद affected session lane release करता है; stalled embedded runs केवल `diagnostics.stuckSessionAbortMs` (default: कम से कम 5 minutes और warning threshold का 3x) के बाद abort-drained होते हैं ताकि queued work merely slow runs को काटे बिना resume कर सके। Recovery structured requested/completed outcomes emit करता है, और diagnostic state को idle केवल तब mark किया जाता है जब वही processing generation अभी भी current हो। Repeated `session.stuck` diagnostics back off करते हैं जबकि session unchanged रहता है।
- Model idle timeout: OpenClaw model request को abort करता है जब idle window से पहले कोई response chunks नहीं आते। `models.providers.<id>.timeoutSeconds` slow local/self-hosted providers के लिए इस idle watchdog को extend करता है, लेकिन यह अभी भी किसी lower `agents.defaults.timeoutSeconds` या run-specific timeout से bounded होता है क्योंकि वे पूरे agent run को control करते हैं। अन्यथा OpenClaw configured होने पर `agents.defaults.timeoutSeconds` उपयोग करता है, default रूप से 120s पर capped. Explicit model या agent timeout के बिना Cron-triggered cloud model runs वही default idle watchdog उपयोग करते हैं; explicit cron run timeout के साथ, cloud model stream stalls 60s पर capped होते हैं ताकि configured model fallbacks outer cron deadline से पहले चल सकें। Cron-triggered local या self-hosted model runs implicit watchdog disable करते हैं जब तक explicit timeout configured न हो, और explicit cron run timeouts local/self-hosted providers के लिए idle window बने रहते हैं, इसलिए slow local providers को `models.providers.<id>.timeoutSeconds` set करना चाहिए।
- Provider HTTP request timeout: `models.providers.<id>.timeoutSeconds` उस provider के model HTTP fetches पर apply होता है, जिसमें connect, headers, body, SDK request timeout, total guarded-fetch abort handling, और model stream idle watchdog शामिल हैं। Whole agent runtime timeout बढ़ाने से पहले slow local/self-hosted providers जैसे Ollama के लिए इसका उपयोग करें, और जब model request को longer run करने की जरूरत हो तो agent/runtime timeout कम से कम उतना high रखें।

## जहां चीजें जल्दी समाप्त हो सकती हैं

- एजेंट टाइमआउट (abort)
- AbortSignal (cancel)
- Gateway डिस्कनेक्ट या RPC टाइमआउट
- `agent.wait` टाइमआउट (केवल प्रतीक्षा, एजेंट को रोकता नहीं)

## संबंधित

- [टूल्स](/hi/tools) — उपलब्ध एजेंट टूल्स
- [Hooks](/hi/automation/hooks) — एजेंट lifecycle इवेंट्स से ट्रिगर होने वाली event-driven स्क्रिप्ट्स
- [Compaction](/hi/concepts/compaction) — लंबी बातचीत का सारांश कैसे बनाया जाता है
- [Exec अनुमोदन](/hi/tools/exec-approvals) — shell commands के लिए अनुमोदन गेट्स
- [सोच](/hi/tools/thinking) — सोच/रीजनिंग स्तर का कॉन्फ़िगरेशन
