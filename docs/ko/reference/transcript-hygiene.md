---
read_when:
    - transcript 형태와 관련된 provider 요청 거부를 디버깅하고 있습니다.
    - transcript 정리 또는 tool-call 복구 로직을 변경하고 있습니다.
    - provider 간 tool-call id 불일치를 조사하고 있습니다.
summary: '참조: provider별 transcript 정리 및 복구 규칙'
title: transcript 위생
x-i18n:
    generated_at: "2026-04-26T11:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

이 문서는 실행 전 transcript(모델 컨텍스트 구성)에 적용되는 **provider별 수정**을 설명합니다. 대부분은 엄격한 provider 요구 사항을 만족시키기 위해 사용하는 **메모리 내** 조정입니다. 별도의 session-file 복구 단계는 session이 로드되기 전에 저장된 JSONL을 다시 쓸 수도 있으며, 잘못된 JSONL 줄을 삭제하거나, 문법적으로는 유효하지만 재생 중 provider가 거부하는 것으로 알려진 저장된 turn을 복구할 수 있습니다. 복구가 발생하면 원본 파일은 session 파일 옆에 백업됩니다.

범위에는 다음이 포함됩니다.

- 사용자에게 보이는 transcript turn 밖에 유지되는 runtime 전용 프롬프트 컨텍스트
- tool call id 정리
- tool call 입력 검증
- tool result 짝 맞춤 복구
- turn 검증 / 순서 정렬
- thought signature 정리
- thinking signature 정리
- 이미지 payload 정리
- 사용자 입력 출처 태깅(inter-session 라우팅 프롬프트용)
- Bedrock Converse 재생용 빈 assistant error-turn 복구

transcript 저장소 세부 사항이 필요하면 다음을 참고하세요.

- [세션 관리 심화 설명](/ko/reference/session-management-compaction)

---

## 전역 규칙: runtime 컨텍스트는 사용자 transcript가 아님

runtime/system 컨텍스트는 turn용 모델 프롬프트에 추가될 수 있지만,
최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw는 Gateway 답장,
대기 중인 후속 작업, ACP, CLI, 임베디드 Pi 실행을 위해 transcript용 프롬프트 본문을
별도로 유지합니다. 저장되는 사용자 표시 turn은 runtime이 보강된 프롬프트 대신
그 transcript 본문을 사용합니다.

이미 runtime wrapper가 저장된 레거시 session의 경우,
Gateway 히스토리 표면은 WebChat, TUI, REST, SSE 클라이언트에 메시지를 반환하기 전에
표시용 projection을 적용합니다.

---

## 실행 위치

모든 transcript 위생 처리는 임베디드 러너에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

이 정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

transcript 위생 처리와 별도로, session 파일은 로드 전에 필요 시 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts`와 `compact.ts`(임베디드 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 payload는 크기 제한으로 인한 provider 측 거부를 막기 위해 항상 정리됩니다
(너무 큰 base64 이미지를 축소/재압축).

이것은 vision 지원 모델의 이미지 기반 토큰 압력 제어에도 도움이 됩니다.
최대 이미지 치수가 작을수록 일반적으로 토큰 사용량이 줄고, 클수록 디테일이 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 한 변 크기는 `agents.defaults.imageMaxDimensionPx`로 설정 가능(기본값: `1200`).

---

## 전역 규칙: 잘못된 tool call

`input`과 `arguments`가 모두 없는 assistant tool-call 블록은
모델 컨텍스트가 구성되기 전에 삭제됩니다. 이렇게 하면 부분적으로 저장된
tool call(예: rate limit 실패 후)로 인한 provider 거부를 방지할 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용

---

## 전역 규칙: inter-session 입력 출처

에이전트가 `sessions_send`를 통해 다른 session에 프롬프트를 보낼 때(에이전트 간
reply/announce 단계 포함), OpenClaw는 생성된 user turn을 다음과 함께 저장합니다.

- `message.provenance.kind = "inter_session"`

이 메타데이터는 transcript 추가 시점에 기록되며 role은 바뀌지 않습니다
(provider 호환성을 위해 `role: "user"` 유지). transcript 리더는 이를 사용해
라우팅된 내부 프롬프트를 최종 사용자가 작성한 지침으로 처리하지 않도록 할 수 있습니다.

컨텍스트를 다시 구성할 때 OpenClaw는 모델이 외부 최종 사용자 지침과 구분할 수 있도록,
해당 user turn 앞에 메모리 내에서 짧은 `[Inter-session message]` 마커도 붙입니다.

---

## provider 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 적용.
- OpenAI Responses/Codex transcript에서는 고아 reasoning signature(뒤따르는 content 블록이 없는 독립 reasoning 항목)를 삭제하고, 모델 route 전환 후에는 재생 가능한 OpenAI reasoning을 삭제.
- tool call id 정리 없음.
- tool result 짝 맞춤 복구는 실제로 일치하는 출력을 이동할 수 있으며, 누락된 tool call에 대해서는 Codex 스타일 `aborted` 출력을 합성할 수 있음.
- turn 검증이나 재정렬 없음.
- 누락된 OpenAI Responses 계열 tool output은 Codex 재생 정규화에 맞추기 위해 `aborted`로 합성됨.
- thought signature 제거 없음.

**Google (Generative AI / Gemini CLI / Antigravity)**

- tool call id 정리: 엄격한 영숫자만 허용.
- tool result 짝 맞춤 복구 및 합성 tool result.
- turn 검증(Gemini 스타일 turn 교대).
- Google turn 순서 수정(히스토리가 assistant로 시작하면 작은 user bootstrap을 앞에 추가).
- Antigravity Claude: thinking signature 정규화, 서명되지 않은 thinking 블록 삭제.

**Anthropic / Minimax (Anthropic 호환)**

- tool result 짝 맞춤 복구 및 합성 tool result.
- turn 검증(엄격한 교대를 만족시키기 위해 연속된 user turn 병합).
- 누락되었거나, 비어 있거나, 공백뿐인 재생 signature를 가진 thinking 블록은
  provider 변환 전에 제거됩니다. 그 결과 assistant turn이 비게 되면, OpenClaw는
  비어 있지 않은 생략된 추론 텍스트로 turn 형태를 유지합니다.
- 제거해야 하는 이전 thinking 전용 assistant turn은
  provider adapter가 재생 turn을 삭제하지 않도록 비어 있지 않은 생략된 추론 텍스트로 대체됩니다.

**Amazon Bedrock (Converse API)**

- 빈 assistant stream-error turn은 재생 전에 비어 있지 않은 fallback 텍스트 블록으로 복구됩니다.
  Bedrock Converse는 `content: []`인 assistant 메시지를 거부하므로,
  `stopReason: "error"`와 빈 content를 가진 저장된 assistant turn도 로드 전에 디스크에서 복구됩니다.
- 누락되었거나, 비어 있거나, 공백뿐인 재생 signature를 가진 Claude thinking 블록은
  Converse 재생 전에 제거됩니다. 그 결과 assistant turn이 비게 되면, OpenClaw는
  비어 있지 않은 생략된 추론 텍스트로 turn 형태를 유지합니다.
- 제거해야 하는 이전 thinking 전용 assistant turn은 Converse 재생이 엄격한 turn 형태를 유지하도록
  비어 있지 않은 생략된 추론 텍스트로 대체됩니다.
- 재생은 OpenClaw 전달 미러 및 gateway 삽입 assistant turn을 필터링합니다.
- 이미지 정리는 전역 규칙을 통해 적용됩니다.

**Mistral (model-id 기반 감지 포함)**

- tool call id 정리: strict9(길이 9의 영숫자).

**OpenRouter Gemini**

- thought signature 정리: base64가 아닌 `thought_signature` 값 제거(base64는 유지).

**그 외 모든 경우**

- 이미지 정리만 적용.

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 이전에는 OpenClaw가 여러 계층의 transcript 위생 처리를 적용했습니다.

- **transcript-sanitize extension**이 모든 컨텍스트 구성 시 실행되었고 다음을 수행할 수 있었습니다.
  - tool use/result 짝 맞춤 복구
  - tool call id 정리(`_`/`-`를 유지하는 비엄격 모드 포함)
- 러너도 provider별 정리를 수행했으며, 이로 인해 작업이 중복되었습니다.
- provider 정책 밖에서도 추가 변경이 발생했습니다. 예:
  - 저장 전에 assistant 텍스트에서 `<final>` 태그 제거
  - 빈 assistant error turn 삭제
  - tool call 이후 assistant content 잘라내기

이 복잡성은 provider 간 회귀를 일으켰으며(`openai-responses`
`call_id|fc_id` 짝 맞춤 문제가 대표적), 2026.1.22 정리 작업에서 extension을 제거하고,
로직을 러너에 중앙화했으며, 이미지 정리 외에는 OpenAI를 **손대지 않도록** 했습니다.

## 관련 문서

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
