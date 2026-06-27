---
read_when:
    - 제공자 요청 거부가 트랜스크립트 형태와 관련되어 있는지 디버깅하고 있습니다
    - 트랜스크립트 삭제 처리 또는 도구 호출 복구 로직을 변경하고 있습니다
    - Provider 간 도구 호출 ID 불일치를 조사하고 있습니다
summary: '참조: 제공자별 트랜스크립트 삭제 처리 및 복구 규칙'
title: 트랜스크립트 정리
x-i18n:
    generated_at: "2026-06-27T18:09:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw는 실행 전(모델 컨텍스트를 빌드할 때) transcript에 **provider별 수정**을 적용합니다. 대부분은 엄격한 provider 요구사항을 충족하기 위한 **인메모리** 조정입니다. 별도의 session 파일 복구 패스가 session이 로드되기 전에 저장된 JSONL을 다시 쓸 수도 있지만, 이는 잘못된 형식의 줄이나 지속 가능한 레코드로 유효하지 않은 저장된 turn에만 적용됩니다. 전달된 assistant 응답은 디스크에 보존됩니다. provider별 assistant-prefill 제거는 outbound payload를 구성할 때만 발생합니다. 복구가 발생하면 원본 파일은 atomic replace 전에 임시 `*.bak-<pid>-<ts>` sibling으로 기록되고, replace가 성공하면 제거됩니다. backup은 cleanup 자체가 실패한 경우에만 유지됩니다(이 경우 path가 다시 보고됨).

범위는 다음을 포함합니다.

- Runtime 전용 prompt context가 사용자에게 보이는 transcript turn에 들어가지 않도록 유지
- Tool call id 정리
- Tool call input 검증
- Tool result pairing 복구
- Turn 검증 / ordering
- Thought signature cleanup
- Thinking signature cleanup
- Image payload 정리
- Provider replay 전 빈 text-block cleanup
- Provider replay 전 불완전한 reasoning-only length-turn cleanup
- User-input 출처 태깅(inter-session routed prompt용)
- Bedrock Converse replay를 위한 빈 assistant error-turn 복구

transcript storage 세부 정보가 필요하면 다음을 참조하세요.

- [Session management 심층 분석](/ko/reference/session-management-compaction)

---

## 전역 규칙: runtime context는 user transcript가 아닙니다

Runtime/system context는 turn의 model prompt에 추가될 수 있지만,
end-user가 작성한 content는 아닙니다. OpenClaw는 Gateway replies, queued followups, ACP, CLI, embedded OpenClaw
runs를 위한 transcript-facing prompt body를 별도로 유지합니다. 저장된 visible user turns는
runtime이 보강된 prompt 대신 해당 transcript body를 사용합니다.

이미 runtime wrapper를 저장한 legacy session의 경우, Gateway history
surface는 WebChat, TUI, REST 또는 SSE client에 message를 반환하기 전에 display projection을 적용합니다.

---

## 실행 위치

모든 transcript hygiene은 embedded runner에 중앙화되어 있습니다.

- Policy selection: `src/agents/transcript-policy.ts`
- Sanitization/repair application: `src/agents/embedded-agent-runner/replay-history.ts`의 `sanitizeSessionHistory`

policy는 적용할 항목을 결정하기 위해 `provider`, `modelApi`, `modelId`를 사용합니다.

transcript hygiene과 별도로, session file은 load 전에 필요한 경우 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(embedded runner)에서 호출됨

---

## 전역 규칙: image sanitization

Image payload는 size limit 때문에 provider 측에서 거부되는 일을 방지하기 위해 항상 정리됩니다
(oversized base64 image를 downscale/recompress).

이는 vision-capable model의 image-driven token 압력을 제어하는 데도 도움이 됩니다.
낮은 max dimension은 일반적으로 token 사용량을 줄이고, 높은 dimension은 detail을 보존합니다.

Implementation:

- `src/agents/embedded-agent-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- Max image side는 `agents.defaults.imageMaxDimensionPx`로 설정할 수 있습니다(default: `1200`).
- 이 pass가 replay content를 순회하는 동안 blank text block은 제거됩니다. 비게 되는 assistant
  turn은 replay copy에서 drop됩니다. 비게 되는 user 및 tool-result
  turn은 비어 있지 않은 omitted-content placeholder를 받습니다.

---

## 전역 규칙: malformed tool call

`input`과 `arguments`가 모두 없는 assistant tool-call block은
model context가 빌드되기 전에 drop됩니다. 이는 부분적으로
persist된 tool call로 인한 provider rejection을 방지합니다(예: rate limit failure 이후).

Implementation:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/embedded-agent-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: incomplete reasoning-only turn

provider output limit에 도달했고 thinking 또는
redacted-thinking content만 있는 assistant turn은 in-memory replay copy에서 생략됩니다. 이러한 turn은
불완전한 provider state를 포함하며 partial thinking signature를 담을 수 있습니다.

빈 length turn은 변경되지 않으며, visible text, tool
call 또는 unknown content block이 있는 length turn도 그대로 유지됩니다. 저장된 transcript는 다시 쓰지 않습니다.

Implementation:

- `src/agents/embedded-agent-runner/replay-history.ts`의 `normalizeAssistantReplayContent`

---

## 전역 규칙: inter-session input provenance

agent가 `sessions_send`를 통해 다른 session으로 prompt를 보낼 때(agent-to-agent reply/announce step 포함),
OpenClaw는 생성된 user turn을 다음과 함께 저장합니다.

- `message.provenance.kind = "inter_session"`

OpenClaw는 또한 routed prompt text 앞의 same-turn에 `[Inter-session message ... isUser=false]`
marker를 prepends하여 active model call이 foreign session output을
external end-user instruction과 구분할 수 있게 합니다. 이 marker에는 가능한 경우
source session, channel, tool이 포함됩니다. transcript는 provider compatibility를 위해 여전히
`role: "user"`를 사용하지만, visible text와 provenance
metadata가 모두 해당 turn을 inter-session data로 표시합니다.

context rebuild 중에는 OpenClaw가 provenance metadata만 있는 older persisted
inter-session user turn에도 동일한 marker를 적용합니다.

---

## Provider 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- Image sanitization만 적용됩니다.
- OpenAI Responses/Codex transcript에서는 orphaned reasoning signature(뒤따르는 content block이 없는 standalone reasoning item)를 drop하고, model route switch 후 replay 가능한 OpenAI reasoning을 drop합니다.
- encrypted empty-summary item을 포함해 replay 가능한 OpenAI Responses reasoning item payload를 보존하여, manual/WebSocket replay가 assistant output item과 paired된 필수 `rs_*` state를 유지하도록 합니다.
- Native ChatGPT Codex Responses는 prior item ID 없이 이전 Responses reasoning/message/function payload를 replay하면서 session `prompt_cache_key`를 보존해 Codex wire parity를 따릅니다.
- OpenAI Responses-family replay는 canonical `call_*|fc_*` same-model reasoning pair를 보존하지만, pi-ai payload conversion 전에 malformed 또는 overlong `call_id` / function-call item id를 결정적으로 normalize합니다.
- Tool result pairing repair는 실제 matched output을 이동하고 missing tool call에 대해 Codex-style `aborted` output을 합성할 수 있습니다.
- Turn validation 또는 reordering은 없습니다.
- Missing OpenAI Responses-family tool output은 Codex replay normalization과 맞추기 위해 `aborted`로 합성됩니다.
- Thought signature stripping은 없습니다.

**OpenAI-compatible Chat Completions**

- Historical assistant thinking/reasoning block은 replay 전에 stripped되어
  local 및 proxy-style OpenAI-compatible server가 `reasoning` 또는 `reasoning_content` 같은 prior-turn
  reasoning field를 받지 않도록 합니다.
- Current same-turn tool-call continuation은 tool result가 replay될 때까지 assistant reasoning block을
  tool call에 attached된 상태로 유지합니다.
- `reasoning: true`가 있는 custom/self-hosted model entry는 replay된
  reasoning metadata를 보존합니다.
- Provider-owned exception은 wire protocol에 replayed reasoning metadata가 필요할 때 opt out할 수 있습니다.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call id sanitization: strict alphanumeric.
- Tool result pairing repair 및 synthetic tool result.
- Turn validation(Gemini-style turn alternation).
- Google turn ordering fixup(history가 assistant로 시작하면 tiny user bootstrap을 prepend).
- Antigravity Claude: thinking signature를 normalize하고 unsigned thinking block을 drop합니다.

**Anthropic / Minimax (Anthropic-compatible)**

- Tool result pairing repair 및 synthetic tool result.
- Turn validation(strict alternation을 충족하기 위해 consecutive user turn merge).
- thinking이 enabled일 때 Cloudflare AI Gateway route를 포함해 outgoing Anthropic Messages
  payload에서 trailing assistant prefill turn이 stripped됩니다.
- session이 compacted된 경우 provider
  replay 전에 pre-compaction assistant thinking signature가 stripped됩니다. Thinking signature는 generation time에 conversation prefix에
  cryptographically bound됩니다. compaction 후에는 prefix가 변경되므로(summarized content가 compaction
  summary로 대체됨), original signature를 replay하면 Anthropic이
  "Invalid signature in thinking block"으로 request를 reject합니다. thinking text는
  unsigned block으로 보존된 다음 아래 규칙에 의해 처리됩니다.
- Missing, empty 또는 blank replay signature가 있는 thinking block은
  provider conversion 전에 stripped됩니다. 그 결과 assistant turn이 비면 OpenClaw는
  비어 있지 않은 omitted-reasoning text로 turn shape를 유지합니다.
- stripped되어야 하는 older thinking-only assistant turn은
  provider adapter가 replay turn을 drop하지 않도록 비어 있지 않은 omitted-reasoning text로 대체됩니다.

**Amazon Bedrock (Converse API)**

- 빈 assistant stream-error turn은 replay 전에 비어 있지 않은 fallback text block으로
  복구됩니다. Bedrock Converse는 `content: []`가 있는 assistant message를 reject하므로,
  `stopReason: "error"`와 empty content가 있는 persisted assistant turn도
  load 전에 disk에서 복구됩니다.
- blank text block만 포함하는 assistant stream-error turn은 invalid blank block을 replay하는 대신
  in-memory replay copy에서 dropped됩니다.
- session이 compacted된 경우 위 Anthropic과 같은 이유로 Converse
  replay 전에 pre-compaction assistant thinking signature가 stripped됩니다.
- Missing, empty 또는 blank replay signature가 있는 Claude thinking block은
  Converse replay 전에 stripped됩니다. 그 결과 assistant turn이 비면 OpenClaw는
  비어 있지 않은 omitted-reasoning text로 turn shape를 유지합니다.
- stripped되어야 하는 older thinking-only assistant turn은
  Converse replay가 strict turn shape를 유지하도록 비어 있지 않은 omitted-reasoning text로 대체됩니다.
- Replay는 OpenClaw delivery-mirror 및 gateway-injected assistant turn을 filter합니다.
- Image sanitization은 전역 규칙을 통해 적용됩니다.

**Mistral(model-id 기반 detection 포함)**

- Tool call id sanitization: strict9(alphanumeric length 9).

**OpenRouter Gemini**

- Thought signature cleanup: non-base64 `thought_signature` value를 strip합니다(base64는 유지).

**OpenRouter Anthropic**

- reasoning이 enabled일 때 verified OpenRouter
  OpenAI-compatible Anthropic model payload에서 trailing assistant prefill turn이 stripped되어,
  direct Anthropic 및 Cloudflare Anthropic replay behavior와 일치합니다.

**그 외 모든 항목**

- Image sanitization만 적용됩니다.

---

## Historical behavior(2026.1.22 이전)

2026.1.22 release 전에는 OpenClaw가 transcript hygiene의 여러 layer를 적용했습니다.

- **transcript-sanitize extension**이 모든 context build에서 실행되었고 다음을 수행할 수 있었습니다.
  - Tool use/result pairing 복구.
  - Tool call id 정리(`_`/`-`를 보존하는 non-strict mode 포함).
- runner도 provider-specific sanitization을 수행하여 작업이 중복되었습니다.
- provider policy 밖에서도 추가 mutation이 발생했습니다. 여기에는 다음이 포함됩니다.
  - persistence 전에 assistant text에서 `<final>` tag stripping.
  - 빈 assistant error turn drop.
  - tool call 뒤 assistant content trimming.

이 복잡성은 cross-provider regression을 일으켰습니다(특히 `openai-responses`
`call_id|fc_id` pairing). 2026.1.22 cleanup은 extension을 제거하고,
logic을 runner에 중앙화했으며, OpenAI를 image sanitization 외에는 **no-touch**로 만들었습니다.

## Related

- [Session management](/ko/concepts/session)
- [Session pruning](/ko/concepts/session-pruning)
