---
read_when:
    - 트랜스크립트 구조와 관련된 프로바이더 요청 거부를 디버깅하는 중입니다
    - 대화 기록 정제 또는 도구 호출 복구 로직을 변경하고 있습니다
    - 공급자 간 도구 호출 ID 불일치를 조사하고 있습니다
summary: '참조: 제공자별 트랜스크립트 정리 및 복구 규칙'
title: 대화 기록 관리
x-i18n:
    generated_at: "2026-05-02T21:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw는 실행 전(모델 컨텍스트 생성 시) 트랜스크립트에 **프로바이더별 수정**을 적용합니다. 대부분은 엄격한 프로바이더 요구사항을 충족하기 위한 **인메모리** 조정입니다. 별도의 세션 파일 복구 패스가 세션 로드 전에 저장된 JSONL을 다시 쓸 수도 있습니다. 이때 잘못된 JSONL 줄을 삭제하거나, 구문상 유효하지만 재생 중 프로바이더가 거부하는 것으로 알려진 영속화된 턴을 복구합니다. 복구가 발생하면 원본 파일은 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다.

- 런타임 전용 프롬프트 컨텍스트를 사용자에게 보이는 트랜스크립트 턴에 포함하지 않기
- 도구 호출 ID 정리
- 도구 호출 입력 검증
- 도구 결과 페어링 복구
- 턴 검증 / 정렬
- 사고 시그니처 정리
- thinking 시그니처 정리
- 이미지 페이로드 정리
- 프로바이더 재생 전 빈 텍스트 블록 정리
- 사용자 입력 출처 태깅(세션 간 라우팅된 프롬프트용)
- Bedrock Converse 재생을 위한 빈 어시스턴트 오류 턴 복구

트랜스크립트 저장 세부 정보가 필요하면 다음을 참고하세요.

- [세션 관리 심층 분석](/ko/reference/session-management-compaction)

---

## 전역 규칙: 런타임 컨텍스트는 사용자 트랜스크립트가 아님

런타임/시스템 컨텍스트는 한 턴의 모델 프롬프트에 추가될 수 있지만, 최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw는 Gateway 응답, 대기 중인 후속 메시지, ACP, CLI, 내장 Pi 실행을 위해 트랜스크립트에 표시되는 별도의 프롬프트 본문을 유지합니다. 저장된 표시용 사용자 턴은 런타임으로 보강된 프롬프트 대신 해당 트랜스크립트 본문을 사용합니다.

이미 런타임 래퍼가 영속화된 레거시 세션의 경우, Gateway 기록 표면은 WebChat, TUI, REST 또는 SSE 클라이언트에 메시지를 반환하기 전에 표시용 프로젝션을 적용합니다.

---

## 실행 위치

모든 트랜스크립트 위생 처리는 내장 러너에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 무엇을 적용할지 결정합니다.

트랜스크립트 위생 처리와 별개로, 세션 파일은 로드 전에 필요할 경우 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts`와 `compact.ts`(내장 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 페이로드는 크기 제한으로 인한 프로바이더 측 거부를 방지하기 위해 항상 정리됩니다(크기가 너무 큰 base64 이미지를 축소/재압축).

이는 비전 지원 모델에서 이미지로 인한 토큰 압력 제어에도 도움이 됩니다. 최대 치수가 낮을수록 일반적으로 토큰 사용량이 줄고, 높을수록 세부 정보가 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`로 설정할 수 있습니다(기본값: `1200`).
- 이 패스가 재생 콘텐츠를 순회하는 동안 빈 텍스트 블록은 제거됩니다. 비게 된 어시스턴트 턴은 재생 사본에서 삭제되고, 비게 된 사용자 및 도구 결과 턴에는 비어 있지 않은 생략 콘텐츠 플레이스홀더가 추가됩니다.

---

## 전역 규칙: 잘못된 도구 호출

`input`과 `arguments`가 모두 없는 어시스턴트 도구 호출 블록은 모델 컨텍스트가 생성되기 전에 삭제됩니다. 이는 부분적으로 영속화된 도구 호출(예: 속도 제한 실패 이후)로 인한 프로바이더 거부를 방지합니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용됨

---

## 전역 규칙: 세션 간 입력 출처

에이전트가 `sessions_send`를 통해 다른 세션으로 프롬프트를 보낼 때(에이전트 간 reply/announce 단계 포함), OpenClaw는 생성된 사용자 턴을 다음과 함께 영속화합니다.

- `message.provenance.kind = "inter_session"`

OpenClaw는 또한 라우팅된 프롬프트 텍스트 앞에 같은 턴의 `[Inter-session message ... isUser=false]` 마커를 추가하여 활성 모델 호출이 외부 세션 출력과 외부 최종 사용자 지시를 구분할 수 있게 합니다. 이 마커에는 사용 가능한 경우 원본 세션, 채널, 도구가 포함됩니다. 트랜스크립트는 프로바이더 호환성을 위해 여전히 `role: "user"`를 사용하지만, 표시 텍스트와 출처 메타데이터가 모두 해당 턴을 세션 간 데이터로 표시합니다.

컨텍스트 재구성 중 OpenClaw는 출처 메타데이터만 있는 오래된 영속화 세션 간 사용자 턴에도 동일한 마커를 적용합니다.

---

## 프로바이더 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 수행합니다.
- OpenAI Responses/Codex 트랜스크립트에서 고아 추론 시그니처(뒤따르는 콘텐츠 블록이 없는 독립 추론 항목)를 삭제하고, 모델 라우트 전환 후 재생 가능한 OpenAI 추론을 삭제합니다.
- 암호화된 빈 요약 항목을 포함해 재생 가능한 OpenAI Responses 추론 항목 페이로드를 보존하여, 수동/WebSocket 재생에서 필요한 `rs_*` 상태가 어시스턴트 출력 항목과 페어링된 상태로 유지되도록 합니다.
- 도구 호출 ID 정리를 하지 않습니다.
- 도구 결과 페어링 복구는 실제로 매칭된 출력을 이동하고 누락된 도구 호출에 대해 Codex 스타일의 `aborted` 출력을 합성할 수 있습니다.
- 턴 검증 또는 재정렬을 하지 않습니다.
- 누락된 OpenAI Responses 계열 도구 출력은 Codex 재생 정규화에 맞추기 위해 `aborted`로 합성됩니다.
- 사고 시그니처 제거를 하지 않습니다.

**OpenAI 호환 Gemma 4**

- 이전 어시스턴트 thinking/reasoning 블록은 재생 전에 제거되어 로컬 OpenAI 호환 Gemma 4 서버가 이전 턴의 추론 콘텐츠를 받지 않도록 합니다.
- 현재 같은 턴의 도구 호출 이어받기는 도구 결과가 재생될 때까지 어시스턴트 추론 블록을 도구 호출에 연결된 상태로 유지합니다.

**Google(Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정리: 엄격한 영숫자.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(Gemini 스타일 턴 교대).
- Google 턴 정렬 보정(기록이 어시스턴트로 시작하면 작은 사용자 부트스트랩을 앞에 추가).
- Antigravity Claude: thinking 시그니처를 정규화하고, 서명되지 않은 thinking 블록을 삭제합니다.

**Anthropic / Minimax(Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(엄격한 교대를 충족하도록 연속 사용자 턴 병합).
- thinking이 활성화된 경우 Cloudflare AI Gateway 라우트를 포함해, 나가는 Anthropic Messages 페이로드에서 마지막 어시스턴트 prefill 턴을 제거합니다.
- 누락되었거나 비어 있거나 공백뿐인 재생 시그니처가 있는 thinking 블록은 프로바이더 변환 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비면 OpenClaw는 비어 있지 않은 생략 추론 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 오래된 thinking 전용 어시스턴트 턴은 비어 있지 않은 생략 추론 텍스트로 대체되어 프로바이더 어댑터가 재생 턴을 삭제하지 않도록 합니다.

**Amazon Bedrock(Converse API)**

- 빈 어시스턴트 스트림 오류 턴은 재생 전에 비어 있지 않은 폴백 텍스트 블록으로 복구됩니다. Bedrock Converse는 `content: []`가 있는 어시스턴트 메시지를 거부하므로, `stopReason: "error"`와 빈 콘텐츠가 있는 영속화된 어시스턴트 턴도 로드 전에 디스크에서 복구됩니다.
- 빈 텍스트 블록만 포함하는 어시스턴트 스트림 오류 턴은 유효하지 않은 빈 블록으로 재생하는 대신 인메모리 재생 사본에서 삭제됩니다.
- 누락되었거나 비어 있거나 공백뿐인 재생 시그니처가 있는 Claude thinking 블록은 Converse 재생 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비면 OpenClaw는 비어 있지 않은 생략 추론 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 오래된 thinking 전용 어시스턴트 턴은 비어 있지 않은 생략 추론 텍스트로 대체되어 Converse 재생이 엄격한 턴 형태를 유지하도록 합니다.
- 재생은 OpenClaw 전달 미러 및 Gateway 주입 어시스턴트 턴을 필터링합니다.
- 이미지 정리는 전역 규칙을 통해 적용됩니다.

**Mistral(모델 ID 기반 감지 포함)**

- 도구 호출 ID 정리: strict9(영숫자 길이 9).

**OpenRouter Gemini**

- 사고 시그니처 정리: base64가 아닌 `thought_signature` 값을 제거합니다(base64는 유지).

**OpenRouter Anthropic**

- reasoning이 활성화된 경우 검증된 OpenRouter OpenAI 호환 Anthropic 모델 페이로드에서 마지막 어시스턴트 prefill 턴을 제거하며, 이는 직접 Anthropic 및 Cloudflare Anthropic 재생 동작과 일치합니다.

**그 외 모든 경우**

- 이미지 정리만 수행합니다.

---

## 과거 동작(2026.1.22 이전)

2026.1.22 릴리스 전에는 OpenClaw가 여러 계층의 트랜스크립트 위생 처리를 적용했습니다.

- **transcript-sanitize 확장**이 모든 컨텍스트 생성에서 실행되었고 다음을 수행할 수 있었습니다.
  - 도구 사용/결과 페어링 복구.
  - 도구 호출 ID 정리(`_`/`-`를 보존하는 비엄격 모드 포함).
- 러너도 프로바이더별 정리를 수행해 작업이 중복되었습니다.
- 프로바이더 정책 밖에서도 추가 변이가 발생했으며, 여기에는 다음이 포함되었습니다.
  - 영속화 전에 어시스턴트 텍스트에서 `<final>` 태그 제거.
  - 빈 어시스턴트 오류 턴 삭제.
  - 도구 호출 이후 어시스턴트 콘텐츠 잘라내기.

이 복잡성은 교차 프로바이더 회귀(특히 `openai-responses` `call_id|fc_id` 페어링)를 초래했습니다. 2026.1.22 정리는 확장을 제거하고, 로직을 러너에 중앙화했으며, OpenAI는 이미지 정리를 제외하고 **수정하지 않도록** 만들었습니다.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
