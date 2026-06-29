---
read_when:
    - आप ट्रांसक्रिप्ट संरचना से जुड़ी प्रदाता अनुरोध अस्वीकृतियों को डीबग कर रहे हैं
    - आप ट्रांसक्रिप्ट सैनिटाइजेशन या टूल-कॉल मरम्मत लॉजिक बदल रहे हैं
    - आप प्रदाताओं में टूल-कॉल आईडी की असंगतियों की जाँच कर रहे हैं
summary: 'संदर्भ: प्रदाता-विशिष्ट ट्रांसक्रिप्ट स्वच्छीकरण और मरम्मत नियम'
title: प्रतिलेख स्वच्छता
x-i18n:
    generated_at: "2026-06-29T00:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw रन से पहले (मॉडल संदर्भ बनाते समय) ट्रांसक्रिप्ट पर **प्रदाता-विशिष्ट सुधार** लागू करता है। इनमें से अधिकतर **इन-मेमोरी** समायोजन होते हैं, जिनका उपयोग सख्त प्रदाता आवश्यकताओं को पूरा करने के लिए किया जाता है। एक अलग session-file मरम्मत पास भी सेशन लोड होने से पहले संग्रहित JSONL को फिर से लिख सकता है, लेकिन केवल malformed लाइनों या persisted turns के लिए जो अमान्य टिकाऊ रिकॉर्ड हैं। डिलीवर किए गए assistant जवाब डिस्क पर सुरक्षित रखे जाते हैं; प्रदाता-विशिष्ट assistant-prefill stripping केवल outbound payloads बनाते समय होती है। जब कोई मरम्मत होती है, तो atomic replace से पहले मूल फ़ाइल को transient `*.bak-<pid>-<ts>` sibling में लिखा जाता है और replace सफल होने पर हटा दिया जाता है; backup केवल तब रखा जाता है जब cleanup स्वयं विफल हो (ऐसी स्थिति में path वापस रिपोर्ट किया जाता है)।

Scope में शामिल है:

- Runtime-only prompt context का user-visible transcript turns से बाहर रहना
- Tool call id sanitization
- Tool call input validation
- Tool result pairing repair
- Turn validation / ordering
- Thought signature cleanup
- Thinking signature cleanup
- Image payload sanitization
- provider replay से पहले blank text-block cleanup
- provider replay से पहले incomplete reasoning-only length-turn cleanup
- User-input provenance tagging (inter-session routed prompts के लिए)
- Bedrock Converse replay के लिए empty assistant error-turn repair

अगर आपको transcript storage विवरण चाहिए, तो देखें:

- [Session management deep dive](/hi/reference/session-management-compaction)

---

## वैश्विक नियम: runtime context user transcript नहीं है

Runtime/system context को किसी turn के लिए model prompt में जोड़ा जा सकता है, लेकिन यह
end-user-authored content नहीं है। OpenClaw Gateway replies, queued followups, ACP, CLI, और embedded OpenClaw
runs के लिए एक अलग transcript-facing
prompt body रखता है। संग्रहित visible user turns runtime-enriched prompt के बजाय उसी transcript body का उपयोग करते हैं।

Legacy sessions के लिए जिनमें runtime wrappers पहले से persisted हैं, Gateway history
surfaces WebChat,
TUI, REST, या SSE clients को messages लौटाने से पहले display projection लागू करते हैं।

---

## यह कहां चलता है

सारी transcript hygiene embedded runner में centralized है:

- Policy selection: `src/agents/transcript-policy.ts`
- Sanitization/repair application: `src/agents/embedded-agent-runner/replay-history.ts` में `sanitizeSessionHistory`

Policy `provider`, `modelApi`, और `modelId` का उपयोग करके तय करती है कि क्या लागू करना है।

Transcript hygiene से अलग, session files को load से पहले (यदि आवश्यक हो) repair किया जाता है:

- `src/agents/session-file-repair.ts` में `repairSessionFileIfNeeded`
- `run/attempt.ts` और `compact.ts` (embedded runner) से call किया गया

---

## वैश्विक नियम: image sanitization

Image payloads को हमेशा sanitize किया जाता है ताकि size
limits (oversized base64 images को downscale/recompress करना) के कारण provider-side rejection रोका जा सके।

यह vision-capable models के लिए image-driven token pressure को नियंत्रित करने में भी मदद करता है।
Lower max dimensions आम तौर पर token usage घटाते हैं; higher dimensions detail सुरक्षित रखते हैं।

Implementation:

- `src/agents/embedded-agent-helpers/images.ts` में `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` में `sanitizeContentBlocksImages`
- Max image side `agents.defaults.imageMaxDimensionPx` के जरिए configurable है (default: `1200`)।
- इस pass के replay content पर चलते समय blank text blocks हटाए जाते हैं। Assistant
  turns जो empty हो जाते हैं, replay copy से drop कर दिए जाते हैं; user और tool-result
  turns जो empty हो जाते हैं, उन्हें non-empty omitted-content placeholder मिलता है।

---

## वैश्विक नियम: malformed tool calls

Assistant tool-call blocks जिनमें `input` और `arguments` दोनों missing हैं, model context बनने से पहले drop कर दिए जाते हैं। यह partially
persisted tool calls (उदाहरण के लिए, rate limit failure के बाद) से provider rejections रोकता है।

Implementation:

- `src/agents/session-transcript-repair.ts` में `sanitizeToolCallInputs`
- `src/agents/embedded-agent-runner/replay-history.ts` में `sanitizeSessionHistory` में लागू

---

## वैश्विक नियम: incomplete reasoning-only turns

Assistant turns जो केवल thinking या
redacted-thinking content के साथ provider output limit तक पहुंचते हैं, in-memory replay copy से हटा दिए जाते हैं। ऐसे turns में incomplete provider state होती है और partial thinking signature हो सकता है।

Empty length turns unchanged रहते हैं, जैसे visible text, tool
calls, या unknown content blocks वाले length turns। Stored transcripts दोबारा नहीं लिखे जाते।

Implementation:

- `src/agents/embedded-agent-runner/replay-history.ts` में `normalizeAssistantReplayContent`

---

## वैश्विक नियम: inter-session input provenance

जब कोई agent `sessions_send` के जरिए किसी दूसरे session में prompt भेजता है (agent-to-agent reply/announce steps सहित), OpenClaw created user turn को इसके साथ persist करता है:

- `message.provenance.kind = "inter_session"`

OpenClaw routed prompt text से पहले same-turn `[Inter-session message ... isUser=false]`
marker भी prepends करता है ताकि active model call foreign session output को external end-user instructions से अलग पहचान सके। उपलब्ध होने पर इस marker में
source session, channel, और tool शामिल होते हैं। Transcript अभी भी provider compatibility के लिए
`role: "user"` का उपयोग करता है, लेकिन visible text और provenance
metadata दोनों turn को inter-session data के रूप में mark करते हैं।

Context rebuild के दौरान, OpenClaw वही marker उन पुराने persisted
inter-session user turns पर लागू करता है जिनमें केवल provenance metadata है।

---

## प्रदाता मैट्रिक्स (वर्तमान व्यवहार)

**OpenAI / OpenAI Codex**

- केवल image sanitization।
- OpenAI Responses/Codex transcripts के लिए orphaned reasoning signatures (standalone reasoning items जिनके बाद content block नहीं है) drop करें, और model route switch के बाद replayable OpenAI reasoning drop करें।
- Replayable OpenAI Responses reasoning item payloads को सुरक्षित रखें, encrypted empty-summary items सहित, ताकि manual/WebSocket replay required `rs_*` state को assistant output items के साथ paired रखे।
- Native ChatGPT Codex Responses, prior item IDs के बिना prior Responses reasoning/message/function payloads replay करके Codex wire parity का पालन करता है, जबकि session `prompt_cache_key` सुरक्षित रखता है।
- OpenAI Responses-family replay canonical `call_*|fc_*` same-model reasoning pairs को सुरक्षित रखता है, लेकिन pi-ai payload conversion से पहले malformed या overlong `call_id` / function-call item ids को deterministically normalize करता है।
- Tool result pairing repair real matched outputs को move कर सकता है और missing tool calls के लिए Codex-style `aborted` outputs synthesize कर सकता है।
- कोई turn validation या reordering नहीं।
- Missing OpenAI Responses-family tool outputs को Codex replay normalization से match करने के लिए `aborted` के रूप में synthesize किया जाता है।
- कोई thought signature stripping नहीं।

**OpenAI-compatible Chat Completions**

- Historical assistant thinking/reasoning blocks replay से पहले stripped होते हैं ताकि
  local और proxy-style OpenAI-compatible servers को prior-turn
  reasoning fields जैसे `reasoning` या `reasoning_content` न मिलें।
- Current same-turn tool-call continuations assistant reasoning block को tool call से
  attached रखते हैं जब तक tool result replay न हो जाए।
- `reasoning: true` वाली custom/self-hosted model entries replayed
  reasoning metadata सुरक्षित रखती हैं।
- Provider-owned exceptions opt out कर सकते हैं जब उनके wire protocol को
  replayed reasoning metadata की आवश्यकता हो।

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call id sanitization: strict alphanumeric।
- Tool result pairing repair और synthetic tool results।
- Turn validation (Gemini-style turn alternation)।
- Google turn ordering fixup (यदि history assistant से शुरू होती है तो एक छोटा user bootstrap prepend करें)।
- Antigravity Claude: thinking signatures normalize करें; unsigned thinking blocks drop करें।

**Anthropic / Minimax (Anthropic-compatible)**

- Tool result pairing repair और synthetic tool results।
- Turn validation (strict alternation पूरा करने के लिए consecutive user turns merge करें)।
- Thinking enabled होने पर outgoing Anthropic Messages
  payloads से trailing assistant prefill turns stripped होते हैं, Cloudflare AI Gateway routes सहित।
- Session compacted होने पर provider
  replay से पहले pre-compaction assistant thinking signatures stripped होते हैं। Thinking signatures generation time पर conversation prefix से
  cryptographically bound होते हैं; compaction के बाद
  prefix बदल जाता है (summarized content को compaction
  summary से बदल दिया जाता है), इसलिए original signatures replay करने से Anthropic
  request को "Invalid signature in thinking block" के साथ reject करता है। Thinking text
  unsigned block के रूप में सुरक्षित रहता है और फिर नीचे दिए गए rule से handled होता है।
- Missing, empty, या blank replay signatures वाले thinking blocks
  provider conversion से पहले stripped होते हैं। अगर इससे assistant turn empty हो जाता है, तो OpenClaw
  turn shape को non-empty omitted-reasoning text के साथ रखता है।
- पुराने thinking-only assistant turns जिन्हें stripped करना जरूरी है, उन्हें
  non-empty omitted-reasoning text से replace किया जाता है ताकि provider adapters replay
  turn को drop न करें।

**Amazon Bedrock (Converse API)**

- Empty assistant stream-error turns को replay से पहले non-empty fallback text block में repair किया जाता है।
  Bedrock Converse `content: []` वाले assistant messages reject करता है, इसलिए
  `stopReason: "error"` और empty content वाले persisted assistant turns को load से पहले disk पर भी
  repair किया जाता है।
- Assistant stream-error turns जिनमें केवल blank text blocks होते हैं, invalid blank block replay करने के बजाय
  in-memory replay copy से drop कर दिए जाते हैं।
- Session compacted होने पर Converse
  replay से पहले pre-compaction assistant thinking signatures stripped होते हैं, ऊपर Anthropic जैसे ही कारण से।
- Missing, empty, या blank replay signatures वाले Claude thinking blocks
  Converse replay से पहले stripped होते हैं। अगर इससे assistant turn empty हो जाता है, तो OpenClaw
  turn shape को non-empty omitted-reasoning text के साथ रखता है।
- पुराने thinking-only assistant turns जिन्हें stripped करना जरूरी है, उन्हें
  non-empty omitted-reasoning text से replace किया जाता है ताकि Converse replay strict turn shape रखे।
- Replay OpenClaw delivery-mirror और gateway-injected assistant turns को filter करता है।
- Image sanitization वैश्विक नियम के जरिए लागू होता है।

**Mistral (model-id based detection सहित)**

- Tool call id sanitization: strict9 (alphanumeric length 9)।

**OpenRouter Gemini**

- Thought signature cleanup: non-base64 `thought_signature` values strip करें (base64 रखें)।

**OpenRouter Anthropic**

- Reasoning enabled होने पर verified OpenRouter
  OpenAI-compatible Anthropic model payloads से trailing assistant prefill turns stripped होते हैं, direct Anthropic और Cloudflare Anthropic replay behavior से match करते हुए।

**बाकी सब**

- केवल image sanitization।

---

## ऐतिहासिक व्यवहार (pre-2026.1.22)

2026.1.22 release से पहले, OpenClaw ने transcript hygiene की कई layers लागू कीं:

- हर context build पर एक **transcript-sanitize extension** चलता था और यह कर सकता था:
  - Tool use/result pairing repair करना।
  - Tool call ids sanitize करना (`_`/`-` सुरक्षित रखने वाले non-strict mode सहित)।
- Runner ने भी provider-specific sanitization किया, जिससे काम duplicate हुआ।
- Provider policy के बाहर अतिरिक्त mutations हुए, जिनमें शामिल हैं:
  - Persistence से पहले assistant text से `<final>` tags strip करना।
  - Empty assistant error turns drop करना।
  - Tool calls के बाद assistant content trim करना।

इस complexity ने cross-provider regressions पैदा किए (खासकर `openai-responses`
`call_id|fc_id` pairing)। 2026.1.22 cleanup ने extension हटाया, logic को runner में centralized किया, और OpenAI को image sanitization से आगे **no-touch** बनाया।

## संबंधित

- [Session management](/hi/concepts/session)
- [Session pruning](/hi/concepts/session-pruning)
