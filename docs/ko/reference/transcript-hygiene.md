---
read_when:
    - 전사 형태와 관련된 provider 요청 거부를 디버그하고 있습니다
    - 전사 정리 또는 tool-call 복구 로직을 변경하고 있습니다
    - provider 간 tool-call id 불일치를 조사하고 있습니다
summary: '참조: provider별 전사 정리 및 복구 규칙'
title: 전사 위생
x-i18n:
    generated_at: "2026-04-25T18:22:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

이 문서는 실행 전에 전사에 적용되는 **provider별 수정 사항**(모델 컨텍스트 구성)을 설명합니다. 이들 대부분은 엄격한 provider 요구 사항을 만족시키기 위한 **메모리 내** 조정입니다. 별도의 세션 파일 복구 단계에서는 세션을 로드하기 전에 저장된 JSONL을 다시 쓸 수도 있으며, 여기에는 잘못된 JSONL 줄을 삭제하거나 구문적으로는 유효하지만 재생 중 provider에서 거부되는 것으로 알려진 저장된 turn을 복구하는 작업이 포함됩니다. 복구가 발생하면 원본 파일은 세션 파일과 같은 위치에 백업됩니다.

범위에는 다음이 포함됩니다.

- 사용자에게 표시되는 전사 turn에 포함되지 않는 런타임 전용 프롬프트 컨텍스트
- Tool call id 정리
- Tool call 입력 검증
- Tool result 페어링 복구
- Turn 검증 / 순서 정렬
- 사고 서명 정리
- 이미지 payload 정리
- 사용자 입력 provenance 태깅(세션 간 라우팅된 프롬프트용)
- Bedrock Converse 재생용 빈 assistant error-turn 복구

전사 저장소 세부 정보가 필요하면 다음을 참고하세요.

- [Session management deep dive](/ko/reference/session-management-compaction)

---

## 전역 규칙: 런타임 컨텍스트는 사용자 전사가 아님

런타임/시스템 컨텍스트는 turn용 모델 프롬프트에 추가될 수 있지만, 최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw는 Gateway 응답, 대기 중인 후속 작업, ACP, CLI, 임베디드 Pi 실행을 위해 전사 표시용 프롬프트 본문을 별도로 유지합니다. 저장된 표시용 사용자 turn은 런타임이 풍부하게 추가된 프롬프트 대신 해당 전사 본문을 사용합니다.

이미 런타임 래퍼가 저장된 레거시 세션의 경우, Gateway 기록 표면은 WebChat, TUI, REST, 또는 SSE 클라이언트에 메시지를 반환하기 전에 표시 투영을 적용합니다.

---

## 실행 위치

모든 전사 위생 처리는 임베디드 러너에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

전사 위생 처리와는 별도로, 세션 파일은 로드 전에(필요한 경우) 복구됩니다.

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- `run/attempt.ts`와 `compact.ts`(임베디드 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 payload는 크기 제한으로 인한 provider 측 거부를 방지하기 위해 항상 정리됩니다(지나치게 큰 base64 이미지를 축소/재압축).

이는 비전 지원 모델의 이미지 기반 토큰 부담을 제어하는 데도 도움이 됩니다.
최대 크기가 작을수록 일반적으로 토큰 사용량은 줄고, 크기가 클수록 세부 정보가 더 잘 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 한 변 길이는 `agents.defaults.imageMaxDimensionPx`로 구성할 수 있습니다(기본값: `1200`).

---

## 전역 규칙: 잘못된 tool call

`input`과 `arguments`가 모두 없는 assistant tool-call 블록은 모델 컨텍스트를 구성하기 전에 삭제됩니다. 이렇게 하면 부분적으로 저장된 tool call(예: rate limit 실패 후)로 인한 provider 거부를 방지할 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 provenance

agent가 `sessions_send`를 통해 다른 세션으로 프롬프트를 보낼 때(agent-to-agent reply/announce 단계 포함), OpenClaw는 생성된 사용자 turn을 다음과 함께 저장합니다.

- `message.provenance.kind = "inter_session"`

이 메타데이터는 전사 추가 시점에 기록되며 역할은 변경하지 않습니다(provider 호환성을 위해 `role: "user"`는 유지됨). 전사 리더는 이를 사용해 라우팅된 내부 프롬프트를 최종 사용자가 작성한 지시로 처리하지 않도록 할 수 있습니다.

컨텍스트를 다시 구성하는 동안 OpenClaw는 모델이 이를 외부 최종 사용자 지시와 구분할 수 있도록 해당 사용자 turn 앞에 짧은 `[Inter-session message]` 마커를 메모리 내에서 추가합니다.

---

## Provider 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 적용.
- OpenAI Responses/Codex 전사에서는 고아 reasoning 서명(뒤따르는 콘텐츠 블록이 없는 독립 reasoning 항목)을 삭제하고, 모델 경로 전환 후 재생 가능한 OpenAI reasoning도 삭제합니다.
- Tool call id 정리는 없음.
- Tool result 페어링 복구는 실제로 일치하는 출력을 이동시키고, 누락된 tool call에 대해 Codex 스타일 `aborted` 출력을 합성할 수 있습니다.
- Turn 검증 또는 재정렬 없음.
- 누락된 OpenAI Responses 계열 tool 출력은 Codex 재생 정규화에 맞게 `aborted`로 합성됩니다.
- 사고 서명 제거 없음.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call id 정리: 엄격한 영숫자만 허용.
- Tool result 페어링 복구 및 합성 tool result.
- Turn 검증(Gemini 스타일 turn 교대).
- Google turn 순서 수정(기록이 assistant로 시작하면 작은 사용자 bootstrap을 앞에 추가).
- Antigravity Claude: thinking 서명을 정규화하고, 서명되지 않은 thinking 블록을 삭제.

**Anthropic / Minimax (Anthropic 호환)**

- Tool result 페어링 복구 및 합성 tool result.
- Turn 검증(엄격한 교대를 만족하도록 연속된 사용자 turn 병합).

**Amazon Bedrock (Converse API)**

- 빈 assistant stream-error turn은 재생 전에 비어 있지 않은 fallback 텍스트 블록으로 복구됩니다. Bedrock Converse는 `content: []`인 assistant 메시지를 거부하므로, `stopReason: "error"`와 빈 콘텐츠를 가진 저장된 assistant turn도 로드 전에 디스크에서 복구됩니다.
- 재생은 OpenClaw 전달 미러 및 gateway가 주입한 assistant turn을 필터링합니다.
- 이미지 정리는 전역 규칙을 통해 적용됩니다.

**Mistral (model-id 기반 감지 포함)**

- Tool call id 정리: strict9(길이 9의 영숫자).

**OpenRouter Gemini**

- 사고 서명 정리: base64가 아닌 `thought_signature` 값은 제거함(base64는 유지).

**기타 모든 경우**

- 이미지 정리만 적용.

---

## 과거 동작 (2026.1.22 이전)

2026.1.22 릴리스 이전에는 OpenClaw가 여러 계층의 전사 위생 처리를 적용했습니다.

- **transcript-sanitize 확장**이 모든 컨텍스트 구성 시 실행되었으며 다음을 수행할 수 있었습니다.
  - Tool 사용/결과 페어링 복구.
  - Tool call id 정리(`_`/`-`를 유지하는 비엄격 모드 포함).
- 러너도 provider별 정리를 수행하여 작업이 중복되었습니다.
- 또한 provider 정책 외부에서도 추가 변경이 발생했습니다.
  - 저장 전에 assistant 텍스트에서 `<final>` 태그 제거.
  - 빈 assistant error turn 삭제.
  - Tool call 뒤의 assistant 콘텐츠 잘라내기.

이 복잡성은 provider 간 회귀를 유발했습니다(특히 `openai-responses` `call_id|fc_id` 페어링). 2026.1.22 정리 작업에서는 확장을 제거하고, 로직을 러너에 중앙화했으며, 이미지 정리 외에는 OpenAI를 **건드리지 않도록** 했습니다.

## 관련 항목

- [Session management](/ko/concepts/session)
- [Session pruning](/ko/concepts/session-pruning)
