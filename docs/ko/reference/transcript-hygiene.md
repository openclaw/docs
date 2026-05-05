---
read_when:
    - 트랜스크립트 구조와 관련된 제공자 요청 거부를 디버깅하고 있습니다
    - 트랜스크립트 정리 또는 도구 호출 복구 로직을 변경하고 있습니다
    - 여러 제공자에서 발생하는 도구 호출 ID 불일치를 조사하고 있습니다
summary: '참조: 제공자별 대화 기록 정리 및 복구 규칙'
title: 대화 기록 관리
x-i18n:
    generated_at: "2026-05-05T01:49:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw는 실행 전(모델 컨텍스트 구성 시) 기록에 **제공자별 수정**을 적용합니다. 대부분은 엄격한 제공자 요구 사항을 충족하기 위해 사용하는 **인메모리** 조정입니다. 별도의 세션 파일 복구 단계가 세션을 로드하기 전에 저장된 JSONL을 다시 쓸 수도 있지만, 형식이 잘못된 줄이나 유효하지 않은 내구성 레코드인 영속된 턴에만 해당합니다. 전달된 어시스턴트 응답은 디스크에 보존됩니다. 제공자별 어시스턴트 프리필 제거는 아웃바운드 페이로드를 구성하는 동안에만 발생합니다. 복구가 발생하면 원본 파일은 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다.

- 런타임 전용 프롬프트 컨텍스트가 사용자에게 보이는 기록 턴에 포함되지 않도록 유지
- 도구 호출 ID 정리
- 도구 호출 입력 검증
- 도구 결과 페어링 복구
- 턴 검증 / 정렬
- Thought 서명 정리
- Thinking 서명 정리
- 이미지 페이로드 정리
- 제공자 재실행 전 빈 텍스트 블록 정리
- 사용자 입력 출처 태그 지정(세션 간 라우팅된 프롬프트용)
- Bedrock Converse 재실행을 위한 빈 어시스턴트 오류 턴 복구

기록 저장소 세부 정보가 필요하면 다음을 참조하세요.

- [세션 관리 심층 분석](/ko/reference/session-management-compaction)

---

## 전역 규칙: 런타임 컨텍스트는 사용자 기록이 아님

런타임/시스템 컨텍스트는 턴의 모델 프롬프트에 추가될 수 있지만,
최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw는 Gateway 응답, 대기열에
추가된 후속 메시지, ACP, CLI, 임베디드 Pi 실행을 위해 기록 표시용
프롬프트 본문을 별도로 유지합니다. 저장된 표시 가능한 사용자 턴은
런타임으로 보강된 프롬프트 대신 해당 기록 본문을 사용합니다.

런타임 래퍼가 이미 영속된 레거시 세션의 경우, Gateway 히스토리
표면은 WebChat, TUI, REST 또는 SSE 클라이언트에 메시지를 반환하기 전에
표시 투영을 적용합니다.

---

## 실행 위치

모든 기록 위생 처리는 임베디드 러너에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 적용할 내용을 결정합니다.

기록 위생 처리와 별개로, 세션 파일은 로드 전에 필요한 경우 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(임베디드 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 페이로드는 크기 제한으로 인한 제공자 측 거부를 방지하기 위해 항상
정리됩니다(너무 큰 base64 이미지를 축소/재압축).

이는 비전 지원 모델의 이미지 기반 토큰 압박을 제어하는 데에도 도움이 됩니다.
최대 치수가 낮을수록 일반적으로 토큰 사용량이 줄어들고, 치수가 높을수록 세부 정보가 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`로 구성할 수 있습니다(기본값: `1200`).
- 이 단계가 재실행 콘텐츠를 순회하는 동안 빈 텍스트 블록이 제거됩니다. 비게 되는 어시스턴트
  턴은 재실행 사본에서 삭제됩니다. 비게 되는 사용자 및 도구 결과
  턴에는 비어 있지 않은 생략된 콘텐츠 자리표시자가 추가됩니다.

---

## 전역 규칙: 형식이 잘못된 도구 호출

`input`과 `arguments`가 모두 없는 어시스턴트 도구 호출 블록은
모델 컨텍스트를 구성하기 전에 삭제됩니다. 이는 부분적으로 영속된
도구 호출로 인한 제공자 거부를 방지합니다(예: 속도 제한 실패 후).

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 출처

에이전트가 `sessions_send`를 통해 다른 세션에 프롬프트를 보낼 때(에이전트 간
응답/공지 단계 포함), OpenClaw는 생성된 사용자 턴을 다음과 함께 영속합니다.

- `message.provenance.kind = "inter_session"`

OpenClaw는 라우팅된 프롬프트 텍스트 앞에 같은 턴의 `[Inter-session message ... isUser=false]`
마커도 추가하여 활성 모델 호출이 외부 세션 출력과 외부 최종 사용자 지시를
구분할 수 있게 합니다. 이 마커에는 가능한 경우 소스 세션, 채널, 도구가 포함됩니다.
기록은 제공자 호환성을 위해 여전히 `role: "user"`를 사용하지만, 표시되는 텍스트와
출처 메타데이터 모두 해당 턴을 세션 간 데이터로 표시합니다.

컨텍스트를 다시 구성하는 동안 OpenClaw는 출처 메타데이터만 있는 오래된 영속
세션 간 사용자 턴에도 동일한 마커를 적용합니다.

---

## 제공자 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 수행합니다.
- OpenAI Responses/Codex 기록에서 고아 reasoning 서명(뒤따르는 콘텐츠 블록이 없는 독립 실행형 reasoning 항목)을 삭제하고, 모델 라우트 전환 후 재실행 가능한 OpenAI reasoning을 삭제합니다.
- 암호화된 빈 요약 항목을 포함해 재실행 가능한 OpenAI Responses reasoning 항목 페이로드를 보존하여, 수동/WebSocket 재실행에서 필요한 `rs_*` 상태가 어시스턴트 출력 항목과 페어링된 상태로 유지되게 합니다.
- 네이티브 ChatGPT Codex Responses는 세션 `prompt_cache_key`를 보존하면서 이전 항목 ID 없이 이전 Responses reasoning/message/function 페이로드를 재실행하여 Codex 와이어 패리티를 따릅니다.
- 도구 호출 ID 정리는 없습니다.
- 도구 결과 페어링 복구는 실제로 매칭된 출력을 이동하고, 누락된 도구 호출에 대해 Codex 스타일 `aborted` 출력을 합성할 수 있습니다.
- 턴 검증 또는 재정렬은 없습니다.
- 누락된 OpenAI Responses 계열 도구 출력은 Codex 재실행 정규화와 맞추기 위해 `aborted`로 합성됩니다.
- Thought 서명 제거는 없습니다.

**OpenAI 호환 Gemma 4**

- 로컬 OpenAI 호환 Gemma 4 서버가 이전 턴 reasoning 콘텐츠를 받지 않도록, 과거 어시스턴트 thinking/reasoning 블록은 재실행 전에 제거됩니다.
- 현재 같은 턴의 도구 호출 계속 진행은 도구 결과가 재실행될 때까지 어시스턴트 reasoning 블록을
  도구 호출에 붙여 둡니다.

**Google (Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정리: 엄격한 영숫자.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(Gemini 스타일 턴 교대).
- Google 턴 정렬 수정(히스토리가 어시스턴트로 시작하면 작은 사용자 부트스트랩을 앞에 추가).
- Antigravity Claude: thinking 서명을 정규화하고, 서명 없는 thinking 블록을 삭제합니다.

**Anthropic / Minimax(Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(엄격한 교대를 충족하기 위해 연속 사용자 턴 병합).
- Cloudflare AI Gateway 라우트를 포함해 thinking이 활성화된 경우, 나가는 Anthropic Messages
  페이로드에서 후행 어시스턴트 프리필 턴이 제거됩니다.
- 누락되었거나 비어 있거나 공백뿐인 재실행 서명이 있는 Thinking 블록은
  제공자 변환 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비면 OpenClaw는
  비어 있지 않은 생략된 reasoning 텍스트로 턴 형태를 유지합니다.
- 제거되어야 하는 오래된 thinking 전용 어시스턴트 턴은
  비어 있지 않은 생략된 reasoning 텍스트로 대체되어 제공자 어댑터가 재실행
  턴을 삭제하지 않도록 합니다.

**Amazon Bedrock(Converse API)**

- 빈 어시스턴트 스트림 오류 턴은 재실행 전에 비어 있지 않은 대체 텍스트 블록으로 복구됩니다.
  Bedrock Converse는 `content: []`가 있는 어시스턴트 메시지를 거부하므로,
  `stopReason: "error"`와 빈 콘텐츠가 있는 영속된 어시스턴트 턴도
  로드 전에 디스크에서 복구됩니다.
- 빈 텍스트 블록만 포함한 어시스턴트 스트림 오류 턴은
  유효하지 않은 빈 블록을 재실행하는 대신 인메모리 재실행 사본에서 삭제됩니다.
- 누락되었거나 비어 있거나 공백뿐인 재실행 서명이 있는 Claude thinking 블록은
  Converse 재실행 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비면 OpenClaw는
  비어 있지 않은 생략된 reasoning 텍스트로 턴 형태를 유지합니다.
- 제거되어야 하는 오래된 thinking 전용 어시스턴트 턴은
  비어 있지 않은 생략된 reasoning 텍스트로 대체되어 Converse 재실행이 엄격한 턴 형태를 유지합니다.
- 재실행은 OpenClaw 전달 미러 및 Gateway 주입 어시스턴트 턴을 필터링합니다.
- 이미지 정리는 전역 규칙을 통해 적용됩니다.

**Mistral(모델 ID 기반 감지 포함)**

- 도구 호출 ID 정리: strict9(영숫자 길이 9).

**OpenRouter Gemini**

- Thought 서명 정리: base64가 아닌 `thought_signature` 값을 제거합니다(base64는 유지).

**OpenRouter Anthropic**

- reasoning이 활성화된 경우, 검증된 OpenRouter
  OpenAI 호환 Anthropic 모델 페이로드에서 후행 어시스턴트 프리필 턴이 제거되며,
  직접 Anthropic 및 Cloudflare Anthropic 재실행 동작과 일치합니다.

**그 외 모든 항목**

- 이미지 정리만 수행합니다.

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 전에는 OpenClaw가 여러 계층의 기록 위생 처리를 적용했습니다.

- **transcript-sanitize Plugin**이 모든 컨텍스트 구성에서 실행되었고 다음을 수행할 수 있었습니다.
  - 도구 사용/결과 페어링 복구.
  - 도구 호출 ID 정리(`_`/`-`를 보존하는 비엄격 모드 포함).
- 러너도 제공자별 정리를 수행하여 작업이 중복되었습니다.
- 다음을 포함해 제공자 정책 외부에서도 추가 변경이 발생했습니다.
  - 영속하기 전에 어시스턴트 텍스트에서 `<final>` 태그 제거.
  - 빈 어시스턴트 오류 턴 삭제.
  - 도구 호출 뒤의 어시스턴트 콘텐츠 잘라내기.

이 복잡성은 제공자 간 회귀를 일으켰습니다(특히 `openai-responses`
`call_id|fc_id` 페어링). 2026.1.22 정리는 해당 Plugin을 제거하고, 로직을 러너에
중앙화했으며, 이미지 정리를 제외하고 OpenAI를 **수정하지 않음**으로 만들었습니다.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
