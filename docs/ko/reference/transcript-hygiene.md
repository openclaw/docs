---
read_when:
    - 트랜스크립트 형태와 관련된 제공자 요청 거부를 디버깅하고 있습니다
    - 트랜스크립트 정제 또는 도구 호출 복구 로직을 변경하고 있습니다
    - 여러 제공자 간 도구 호출 식별자 불일치를 조사하고 있습니다
summary: '참조: 제공자별 트랜스크립트 정제 및 복구 규칙'
title: 트랜스크립트 관리
x-i18n:
    generated_at: "2026-05-03T06:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw는 실행 전(모델 컨텍스트를 빌드할 때) 대화 기록에 **제공자별 수정**을 적용합니다. 이들 대부분은 엄격한 제공자 요구사항을 충족하기 위해 사용되는 **인메모리** 조정입니다. 별도의 세션 파일 복구 단계가 세션이 로드되기 전에 저장된 JSONL을 다시 쓸 수도 있지만, 이는 잘못된 형식의 줄이나 영속 레코드로 유효하지 않은 저장된 턴에만 해당합니다. 전달된 어시스턴트 응답은 디스크에 보존되며, 제공자별 어시스턴트 프리필 제거는 아웃바운드 페이로드를 구성할 때만 발생합니다. 복구가 발생하면 원본 파일은 세션 파일 옆에 백업됩니다.

범위에는 다음이 포함됩니다.

- 사용자에게 보이는 대화 기록 턴에 포함되지 않는 런타임 전용 프롬프트 컨텍스트
- 도구 호출 ID 정리
- 도구 호출 입력 유효성 검사
- 도구 결과 페어링 복구
- 턴 유효성 검사 / 순서 지정
- 사고 서명 정리
- Thinking 서명 정리
- 이미지 페이로드 정리
- 제공자 재생 전 빈 텍스트 블록 정리
- 사용자 입력 출처 태깅(세션 간 라우팅된 프롬프트용)
- Bedrock Converse 재생을 위한 빈 어시스턴트 오류 턴 복구

대화 기록 저장소 세부 정보가 필요하면 다음을 참조하세요.

- [세션 관리 심층 분석](/ko/reference/session-management-compaction)

---

## 전역 규칙: 런타임 컨텍스트는 사용자 대화 기록이 아닙니다

런타임/시스템 컨텍스트는 턴의 모델 프롬프트에 추가될 수 있지만,
최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw는 Gateway 응답, 대기 중인 후속 요청,
ACP, CLI, 임베디드 Pi 실행을 위해 대화 기록에 표시되는
별도의 프롬프트 본문을 유지합니다. 저장된 표시 사용자 턴은
런타임으로 보강된 프롬프트 대신 해당 대화 기록 본문을 사용합니다.

런타임 래퍼를 이미 영속화한 레거시 세션의 경우, Gateway 히스토리
표면은 WebChat, TUI, REST 또는 SSE 클라이언트에 메시지를 반환하기 전에 표시 투영을 적용합니다.

---

## 실행 위치

모든 대화 기록 위생 처리는 임베디드 러너에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

대화 기록 위생 처리와 별도로, 세션 파일은 로드 전에 필요한 경우 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(임베디드 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 페이로드는 크기 제한 때문에 제공자 측에서 거부되지 않도록 항상 정리됩니다
(너무 큰 base64 이미지 다운스케일/재압축).

이는 비전 지원 모델의 이미지 기반 토큰 압박을 제어하는 데도 도움이 됩니다.
최대 치수가 낮을수록 일반적으로 토큰 사용량이 줄어들고, 치수가 높을수록 세부 정보가 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`로 구성할 수 있습니다(기본값: `1200`).
- 이 단계가 재생 콘텐츠를 순회하는 동안 빈 텍스트 블록은 제거됩니다. 비게 된 어시스턴트
  턴은 재생 사본에서 삭제되며, 비게 된 사용자 및 도구 결과
  턴에는 비어 있지 않은 생략 콘텐츠 플레이스홀더가 추가됩니다.

---

## 전역 규칙: 잘못된 형식의 도구 호출

`input`과 `arguments`가 모두 없는 어시스턴트 도구 호출 블록은
모델 컨텍스트가 빌드되기 전에 삭제됩니다. 이는 부분적으로
영속화된 도구 호출(예: rate limit 실패 후)로 인한 제공자 거부를 방지합니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 출처

에이전트가 `sessions_send`를 통해 다른 세션으로 프롬프트를 보낼 때(에이전트 간
응답/공지 단계 포함), OpenClaw는 생성된 사용자 턴을 다음과 함께 영속화합니다.

- `message.provenance.kind = "inter_session"`

OpenClaw는 또한 라우팅된 프롬프트 텍스트 앞에 같은 턴의 `[Inter-session message ... isUser=false]`
마커를 추가하여 활성 모델 호출이 외부 세션 출력과 외부 최종 사용자 지시를 구분할 수 있게 합니다.
이 마커에는 사용 가능한 경우 원본 세션, 채널, 도구가 포함됩니다. 대화 기록은 제공자 호환성을 위해 여전히
`role: "user"`를 사용하지만, 표시 텍스트와 출처 메타데이터가 모두 해당 턴을 세션 간 데이터로 표시합니다.

컨텍스트를 다시 빌드하는 동안 OpenClaw는 출처 메타데이터만 있는 이전 영속
세션 간 사용자 턴에도 동일한 마커를 적용합니다.

---

## 제공자 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 수행합니다.
- OpenAI Responses/Codex 대화 기록에서 고아 reasoning 서명(뒤따르는 콘텐츠 블록이 없는 독립 reasoning 항목)을 삭제하고, 모델 경로 전환 후 재생 가능한 OpenAI reasoning을 삭제합니다.
- 암호화된 빈 요약 항목을 포함해 재생 가능한 OpenAI Responses reasoning 항목 페이로드를 보존하여, 수동/WebSocket 재생에서 필요한 `rs_*` 상태가 어시스턴트 출력 항목과 페어링된 상태로 유지되게 합니다.
- 도구 호출 ID 정리는 수행하지 않습니다.
- 도구 결과 페어링 복구는 실제 매칭된 출력을 이동하고 누락된 도구 호출에 대해 Codex 스타일의 `aborted` 출력을 합성할 수 있습니다.
- 턴 유효성 검사나 재정렬은 수행하지 않습니다.
- 누락된 OpenAI Responses 계열 도구 출력은 Codex 재생 정규화와 일치하도록 `aborted`로 합성됩니다.
- 사고 서명 제거는 수행하지 않습니다.

**OpenAI 호환 Gemma 4**

- 로컬 OpenAI 호환 Gemma 4 서버가 이전 턴의 reasoning 콘텐츠를 받지 않도록, 이전 어시스턴트 thinking/reasoning 블록은 재생 전에 제거됩니다.
- 현재 같은 턴의 도구 호출 연속은 도구 결과가 재생될 때까지 어시스턴트 reasoning 블록을
  도구 호출에 연결된 상태로 유지합니다.

**Google(Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정리: 엄격한 영숫자.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 유효성 검사(Gemini 스타일 턴 교대).
- Google 턴 순서 수정(히스토리가 어시스턴트로 시작하면 작은 사용자 부트스트랩을 앞에 추가).
- Antigravity Claude: thinking 서명을 정규화하고, 서명되지 않은 thinking 블록을 삭제합니다.

**Anthropic / Minimax(Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 유효성 검사(엄격한 교대를 충족하도록 연속 사용자 턴 병합).
- thinking이 활성화된 경우 Cloudflare AI Gateway 경로를 포함해, 나가는 Anthropic Messages
  페이로드에서 끝에 있는 어시스턴트 프리필 턴이 제거됩니다.
- 누락되었거나 비어 있거나 공백뿐인 재생 서명이 있는 Thinking 블록은
  제공자 변환 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비게 되면, OpenClaw는
  비어 있지 않은 생략된 reasoning 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 이전 thinking 전용 어시스턴트 턴은
  제공자 어댑터가 재생 턴을 삭제하지 않도록 비어 있지 않은 생략된 reasoning 텍스트로 대체됩니다.

**Amazon Bedrock(Converse API)**

- 빈 어시스턴트 스트림 오류 턴은 재생 전에 비어 있지 않은 대체 텍스트 블록으로 복구됩니다.
  Bedrock Converse는 `content: []`가 있는 어시스턴트 메시지를 거부하므로,
  `stopReason: "error"`와 빈 콘텐츠가 있는 영속 어시스턴트 턴도 로드 전에 디스크에서 복구됩니다.
- 공백뿐인 텍스트 블록만 포함하는 어시스턴트 스트림 오류 턴은
  유효하지 않은 빈 블록을 재생하는 대신 인메모리 재생 사본에서 삭제됩니다.
- 누락되었거나 비어 있거나 공백뿐인 재생 서명이 있는 Claude thinking 블록은
  Converse 재생 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비게 되면, OpenClaw는
  비어 있지 않은 생략된 reasoning 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 이전 thinking 전용 어시스턴트 턴은
  Converse 재생이 엄격한 턴 형태를 유지하도록 비어 있지 않은 생략된 reasoning 텍스트로 대체됩니다.
- 재생은 OpenClaw 전달 미러 및 Gateway 주입 어시스턴트 턴을 필터링합니다.
- 이미지 정리는 전역 규칙을 통해 적용됩니다.

**Mistral(모델 ID 기반 감지 포함)**

- 도구 호출 ID 정리: strict9(영숫자 길이 9).

**OpenRouter Gemini**

- 사고 서명 정리: base64가 아닌 `thought_signature` 값을 제거합니다(base64는 유지).

**OpenRouter Anthropic**

- reasoning이 활성화된 경우, 검증된 OpenRouter
  OpenAI 호환 Anthropic 모델 페이로드에서 끝에 있는 어시스턴트 프리필 턴이 제거되며, 이는
  직접 Anthropic 및 Cloudflare Anthropic 재생 동작과 일치합니다.

**그 밖의 모든 경우**

- 이미지 정리만 수행합니다.

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 전에는 OpenClaw가 여러 계층의 대화 기록 위생 처리를 적용했습니다.

- **대화 기록 정리 Plugin**이 모든 컨텍스트 빌드에서 실행되었으며 다음을 수행할 수 있었습니다.
  - 도구 사용/결과 페어링을 복구합니다.
  - 도구 호출 ID를 정리합니다(`_`/`-`를 보존하는 비엄격 모드 포함).
- 러너도 제공자별 정리를 수행하여 작업이 중복되었습니다.
- 다음을 포함한 추가 변이가 제공자 정책 외부에서 발생했습니다.
  - 영속화 전에 어시스턴트 텍스트에서 `<final>` 태그 제거.
  - 빈 어시스턴트 오류 턴 삭제.
  - 도구 호출 뒤의 어시스턴트 콘텐츠 잘라내기.

이 복잡성은 교차 제공자 회귀(특히 `openai-responses`
`call_id|fc_id` 페어링)를 일으켰습니다. 2026.1.22 정리는 확장을 제거하고,
로직을 러너에 중앙화했으며, 이미지 정리를 제외하고 OpenAI를 **수정하지 않음**으로 만들었습니다.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
