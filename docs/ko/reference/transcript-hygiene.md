---
read_when:
    - transcript 형태와 관련된 프로바이더 요청 거부를 디버깅하고 있습니다
    - transcript 정리 또는 tool-call 복구 로직을 변경하고 있습니다
    - 프로바이더 간 tool-call ID 불일치를 조사하고 있습니다
summary: '참조: 프로바이더별 transcript 정리 및 복구 규칙'
title: Transcript 위생
x-i18n:
    generated_at: "2026-04-25T06:10:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

이 문서는 실행 전 transcript(모델 컨텍스트 구성 시)에 적용되는 **프로바이더별 수정**을 설명합니다. 이러한 수정은 엄격한 프로바이더 요구 사항을 만족시키기 위해 사용하는 **메모리 내** 조정입니다. 이 위생 단계는 디스크에 저장된 JSONL transcript를 다시 쓰지 않습니다. 다만 별도의 세션 파일 복구 단계에서 세션을 로드하기 전에 잘못된 JSONL 파일을 복구하기 위해 유효하지 않은 줄을 제거하며 파일을 다시 쓸 수 있습니다. 복구가 발생하면 원본 파일은 세션 파일 옆에 백업됩니다.

범위에는 다음이 포함됩니다:

- 사용자에게 보이는 transcript 턴 밖에 유지되는 런타임 전용 프롬프트 컨텍스트
- Tool call ID 정리
- Tool call 입력 검증
- Tool result 짝맞춤 복구
- 턴 검증 / 정렬
- thought signature 정리
- 이미지 페이로드 정리
- 사용자 입력 출처 태깅(세션 간 라우팅된 프롬프트용)

transcript 저장소 세부 사항이 필요하면 다음을 참고하세요:

- [Session management deep dive](/ko/reference/session-management-compaction)

---

## 전역 규칙: 런타임 컨텍스트는 사용자 transcript가 아님

런타임/시스템 컨텍스트는 한 턴의 모델 프롬프트에 추가될 수 있지만,
최종 사용자가 작성한 내용은 아닙니다. OpenClaw는 Gateway 응답,
대기열 후속 메시지, ACP, CLI, 내장 Pi 실행을 위해 transcript 표시용
프롬프트 본문을 별도로 유지합니다. 저장된 가시 사용자 턴은
런타임이 풍부하게 추가된 프롬프트 대신 이 transcript 본문을 사용합니다.

이미 런타임 래퍼를 저장한 레거시 세션의 경우,
Gateway 기록 표면은 WebChat,
TUI, REST, SSE 클라이언트에 메시지를 반환하기 전에 표시 투영을 적용합니다.

---

## 실행 위치

모든 transcript 위생 처리는 내장 runner에 중앙화되어 있습니다:

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

transcript 위생과 별개로, 세션 파일은 로드 전에(필요 시) 복구됩니다:

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(내장 runner)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 페이로드는 크기 제한으로 인한 프로바이더 측 거부를 방지하기 위해 항상 정리됩니다
(지나치게 큰 base64 이미지 축소/재압축).

이것은 비전 지원 모델의 이미지 기반 토큰 압력 제어에도 도움이 됩니다.
최대 이미지 크기를 낮추면 일반적으로 토큰 사용량이 줄고, 높이면 세부 정보가 더 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)로 구성 가능

---

## 전역 규칙: 잘못된 tool call

`input`과 `arguments`가 모두 없는 assistant tool-call 블록은
모델 컨텍스트가 구성되기 전에 제거됩니다. 이렇게 하면 부분적으로
저장된 tool call(예: rate limit 실패 후)로 인한 프로바이더 거부를 방지할 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 출처

에이전트가 `sessions_send`를 통해 다른 세션으로 프롬프트를 보낼 때(에이전트 간 reply/announce 단계 포함),
OpenClaw는 생성된 사용자 턴을 다음과 함께 저장합니다:

- `message.provenance.kind = "inter_session"`

이 메타데이터는 transcript append 시점에 기록되며 역할은 변경하지 않습니다
(`role: "user"`는 프로바이더 호환성을 위해 유지됨). transcript 리더는
이를 사용해 라우팅된 내부 프롬프트를 최종 사용자가 작성한 지침으로 취급하지 않도록 할 수 있습니다.

컨텍스트 재구성 중에는 OpenClaw가 메모리 내에서 해당 사용자 턴 앞에 짧은 `[Inter-session message]`
마커도 붙이므로, 모델이 이를 외부 최종 사용자 지침과 구분할 수 있습니다.

---

## 프로바이더 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 적용.
- OpenAI Responses/Codex transcript에서 고아 reasoning signature(뒤따르는 content 블록이 없는 독립 reasoning 항목)를 제거하고, 모델 경로 전환 후 replay 가능한 OpenAI reasoning을 제거.
- Tool call ID 정리 없음.
- Tool result 짝맞춤 복구는 실제로 일치하는 출력을 이동시키고, 누락된 tool call에 대해 Codex 스타일 `aborted` 출력을 합성할 수 있음.
- 턴 검증 또는 재정렬 없음.
- 누락된 OpenAI Responses 계열 tool 출력은 Codex replay 정규화와 맞추기 위해 `aborted`로 합성됨.
- thought signature 제거 없음.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call ID 정리: 엄격한 영숫자.
- Tool result 짝맞춤 복구 및 합성 tool result.
- 턴 검증(Gemini 스타일 턴 교대).
- Google 턴 정렬 수정(기록이 assistant로 시작하면 작은 사용자 bootstrap을 앞에 추가).
- Antigravity Claude: thinking signature 정규화, 서명 없는 thinking 블록 제거.

**Anthropic / Minimax (Anthropic 호환)**

- Tool result 짝맞춤 복구 및 합성 tool result.
- 턴 검증(엄격한 교대를 만족시키기 위해 연속된 사용자 턴 병합).

**Mistral (model-id 기반 감지 포함)**

- Tool call ID 정리: strict9(길이 9의 영숫자).

**OpenRouter Gemini**

- thought signature 정리: base64가 아닌 `thought_signature` 값 제거(base64는 유지).

**그 외 모든 것**

- 이미지 정리만 적용.

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 이전에는 OpenClaw가 여러 계층의 transcript 위생 처리를 적용했습니다:

- 모든 컨텍스트 구성 시 실행되는 **transcript-sanitize extension**이 있었고, 다음을 수행할 수 있었습니다:
  - Tool use/result 짝맞춤 복구
  - Tool call ID 정리( `_`/`-`를 보존하는 비엄격 모드 포함)
- runner도 프로바이더별 정리를 수행했으며, 이로 인해 작업이 중복되었습니다.
- 추가적인 변경이 프로바이더 정책 밖에서도 발생했으며, 다음이 포함되었습니다:
  - assistant 텍스트를 저장하기 전에 `<final>` 태그 제거
  - 비어 있는 assistant 오류 턴 제거
  - tool call 이후 assistant content 잘라내기

이 복잡성은 프로바이더 간 회귀를 일으켰고(특히 `openai-responses`
`call_id|fc_id` 짝맞춤), 2026.1.22 정리 작업에서 extension을 제거하고,
로직을 runner에 중앙화했으며, 이미지 정리를 제외하고 OpenAI를 **손대지 않는**
방식으로 만들었습니다.

## 관련 항목

- [Session management](/ko/concepts/session)
- [Session pruning](/ko/concepts/session-pruning)
