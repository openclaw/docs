---
read_when:
    - 트랜스크립트 형식과 관련된 제공자 요청 거부 문제를 디버깅하고 있습니다
    - 트랜스크립트 정제 또는 도구 호출 복구 로직을 변경하고 있습니다
    - 공급자 간 도구 호출 ID 불일치를 조사하고 있습니다
summary: '참조: 제공업체별 대화 기록 정리 및 복구 규칙'
title: 트랜스크립트 정리 원칙
x-i18n:
    generated_at: "2026-07-12T01:11:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw은 실행 전(모델 컨텍스트를 구성할 때) 트랜스크립트에 **제공자별 수정**을 적용합니다. 대부분은 엄격한 제공자 요구 사항을 충족하기 위한 **메모리 내** 조정입니다. 별도의 세션 파일 복구 단계에서 세션을 불러오기 전에 저장된 JSONL을 다시 작성할 수도 있지만, 이는 잘못된 형식의 줄이나 유효한 영구 레코드가 아닌 저장된 턴에만 적용됩니다. 전달된 어시스턴트 응답은 디스크에 보존되며, 제공자별 어시스턴트 프리필 제거는 아웃바운드 페이로드를 구성할 때만 수행됩니다.

복구가 수행되면 원본 파일은 원자적 교체 전에 임시 `*.bak-<pid>-<ts>` 형제 파일로 기록되고, 교체에 성공하면 제거됩니다. 백업은 정리 자체가 실패한 경우에만 유지되며, 이때 해당 경로가 반환됩니다.

적용 범위:

- 런타임 전용 프롬프트 컨텍스트가 사용자에게 표시되는 트랜스크립트 턴에 포함되지 않도록 처리
- 도구 호출 ID 정리
- 도구 호출 입력 검증
- 도구 결과 페어링 복구
- 턴 검증/순서 지정
- 사고 서명 정리
- 추론 서명 정리
- 이미지 페이로드 정리
- 제공자 재생 전 빈 텍스트 블록 정리
- 제공자 재생 전 불완전한 추론 전용 길이 제한 턴 정리
- 사용자 입력 출처 태그 지정(세션 간 라우팅된 프롬프트용)
- Bedrock Converse 재생을 위한 빈 어시스턴트 오류 턴 복구

트랜스크립트 저장소의 세부 정보가 필요하면 [세션 관리 심층 분석](/ko/reference/session-management-compaction)을 참조하세요.

---

## 전역 규칙: 런타임 컨텍스트는 사용자 트랜스크립트가 아님

런타임/시스템 컨텍스트는 특정 턴의 모델 프롬프트에 추가할 수 있지만, 최종 사용자가 작성한 콘텐츠는 아닙니다. OpenClaw은 Gateway 응답, 대기열에 추가된 후속 작업, ACP, CLI 및 내장 OpenClaw 실행을 위해 트랜스크립트에 표시되는 프롬프트 본문을 별도로 유지합니다. 저장되는 사용자 표시 턴에는 런타임으로 보강된 프롬프트 대신 이 트랜스크립트 본문이 사용됩니다.

이미 런타임 래퍼가 저장된 레거시 세션의 경우, Gateway 기록 표면은 WebChat, TUI, REST 또는 SSE 클라이언트에 메시지를 반환하기 전에 표시용 프로젝션을 적용합니다.

---

## 실행 위치

모든 트랜스크립트 위생 처리는 내장 실행기에 중앙화되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
  (`provider`, `modelApi`, `modelId`를 키로 사용하는 `resolveTranscriptPolicy`)
- 정리/복구 적용: `src/agents/embedded-agent-runner/replay-history.ts`의
  `sanitizeSessionHistory`

트랜스크립트 위생 처리와 별도로 세션 파일은 불러오기 전에 필요에 따라 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `src/agents/embedded-agent-runner/run/attempt.ts` 및
  `src/agents/embedded-agent-runner/compact.ts`에서 호출

---

## 전역 규칙: 이미지 정리

크기 제한으로 인한 제공자 측 거부를 방지하기 위해 이미지 페이로드는 항상 정리됩니다(크기가 과도한 base64 이미지를 축소/재압축). 이는 비전 지원 모델에서 이미지로 인한 토큰 부담을 제어하는 데도 도움이 됩니다. 최대 크기를 낮추면 토큰 사용량이 감소하고, 높이면 세부 정보가 보존됩니다.

구현:

- `src/agents/embedded-agent-helpers/images.ts`의
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`로 구성 가능
  (기본값: `1200`)
- 이 단계에서 재생 콘텐츠를 순회하는 동안 빈 텍스트 블록이 제거됩니다.
  그 결과 비어 있게 된 어시스턴트 턴은 재생 사본에서 삭제되고, 비어 있게 된 사용자 및 도구 결과 턴에는 비어 있지 않은 콘텐츠 생략 자리표시자가 추가됩니다.

---

## 전역 규칙: 잘못된 형식의 도구 호출

`input`과 `arguments`가 모두 누락된 어시스턴트 도구 호출 블록은 모델 컨텍스트를 구성하기 전에 삭제됩니다. 이를 통해 부분적으로 저장된 도구 호출로 인한 제공자 거부를 방지합니다(예: 속도 제한 실패 이후).

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)에서 적용

---

## 전역 규칙: 불완전한 추론 전용 턴

추론 또는 수정된 추론 콘텐츠만 포함한 상태에서 제공자 출력 제한에 도달한 어시스턴트 턴은 메모리 내 재생 사본에서 생략됩니다. 이러한 턴에는 불완전한 제공자 상태가 포함되며 부분적인 추론 서명을 포함할 수 있습니다.

빈 길이 제한 턴은 그대로 유지되며, 표시되는 텍스트, 도구 호출 또는 알 수 없는 콘텐츠 블록이 있는 길이 제한 턴도 마찬가지입니다. 저장된 트랜스크립트는 다시 작성되지 않습니다.

구현: `src/agents/embedded-agent-runner/replay-history.ts`의
`normalizeAssistantReplayContent`

---

## 전역 규칙: 세션 간 입력 출처

에이전트가 `sessions_send`를 통해 다른 세션에 프롬프트를 전송하면(에이전트 간 응답/알림 단계 포함), OpenClaw은 생성된 사용자 턴을 `message.provenance.kind = "inter_session"`으로 저장합니다.

또한 OpenClaw은 활성 모델 호출에서 외부 세션 출력과 외부 최종 사용자의 지시를 구분할 수 있도록 라우팅된 프롬프트 텍스트 앞의 동일 턴에 `[Inter-session message] ... isUser=false` 마커를 추가합니다. 가능한 경우 이 마커에는 소스 세션, 채널 및 도구가 포함됩니다. 제공자 호환성을 위해 트랜스크립트는 계속 `role: "user"`를 사용하지만, 표시 텍스트와 출처 메타데이터 모두 해당 턴을 세션 간 데이터로 표시합니다.

컨텍스트를 다시 구성할 때 OpenClaw은 출처 메타데이터만 있는 이전에 저장된 세션 간 사용자 턴에도 동일한 마커를 적용합니다.

---

## 제공자 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지만 정리합니다.
- OpenAI Responses/Codex 트랜스크립트에서 고립된 추론 서명(뒤따르는 콘텐츠 블록이 없는 독립형 추론 항목)을 삭제하고, 모델 경로 전환 후 재생 가능한 OpenAI 추론을 삭제합니다.
- 수동/WebSocket 재생에서 필요한 `rs_*` 상태가 어시스턴트 출력 항목과 페어링된 상태로 유지되도록 암호화된 빈 요약 항목을 포함한 재생 가능한 OpenAI Responses 추론 항목 페이로드를 보존합니다.
- 네이티브 ChatGPT Codex Responses는 세션 `prompt_cache_key`를 보존하면서 이전 항목 ID 없이 이전 Responses 추론/메시지/함수 페이로드를 재생하여 Codex 와이어 프로토콜과 동일하게 동작합니다.
- OpenAI Responses 계열 재생은 표준 `call_*|fc_*` 동일 모델 추론 쌍을 보존하지만, pi-ai 페이로드 변환 전에 잘못된 형식이거나 지나치게 긴 `call_id`/함수 호출 항목 ID를 결정론적으로 정규화합니다.
- 도구 결과 페어링 복구 과정에서 실제로 일치하는 출력을 이동하고, 누락된 도구 호출에 대해 Codex 형식의 `aborted` 출력을 합성할 수 있습니다.
- 턴을 검증하거나 순서를 재지정하지 않으며, 사고 서명을 제거하지 않습니다.

**OpenAI 호환 Chat Completions**

- 로컬 및 프록시 방식의 OpenAI 호환 서버가 `reasoning`이나 `reasoning_content` 같은 이전 턴의 추론 필드를 수신하지 않도록 과거 어시스턴트 추론 블록을 재생 전에 제거합니다.
- 현재 동일 턴의 도구 호출 연속 처리에서는 도구 결과가 재생될 때까지 어시스턴트 추론 블록을 도구 호출에 연결된 상태로 유지합니다.
- `reasoning: true`인 사용자 지정/자체 호스팅 모델 항목은 재생된 추론 메타데이터를 보존합니다.
- 제공자 소유 예외는 해당 와이어 프로토콜에서 재생된 추론 메타데이터가 필요한 경우 이 동작을 사용하지 않도록 설정할 수 있습니다.

**Google(Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정리: 엄격한 영숫자 형식.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(Gemini 방식의 턴 교대).
- Google 턴 순서 수정(기록이 어시스턴트로 시작하면 짧은 사용자 부트스트랩을 앞에 추가).
- Antigravity Claude: 추론 서명을 정규화하고, 서명되지 않은 추론 블록을 삭제합니다.

**Anthropic / Minimax(Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(엄격한 교대 요구 사항을 충족하도록 연속 사용자 턴을 병합).
- Cloudflare AI Gateway 경로를 포함해 추론이 활성화된 경우, 후행 어시스턴트 프리필 턴을 아웃바운드 Anthropic Messages 페이로드에서 제거합니다.
- 세션이 Compaction된 경우, 제공자 재생 전에 Compaction 이전 어시스턴트 추론 서명을 제거합니다. 추론 서명은 생성 시점에 대화 접두사와 암호학적으로 결합됩니다. Compaction 후에는 접두사가 변경되므로(요약된 콘텐츠가 원본을 대체함) 원래 서명을 재생하면 Anthropic이 "Invalid signature in thinking block" 오류로 요청을 거부합니다. 추론 텍스트는 서명되지 않은 블록으로 보존된 후 아래 규칙에 따라 처리됩니다.
- 재생 서명이 누락되었거나 비어 있거나 공백뿐인 추론 블록은 제공자 변환 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비게 되면 OpenClaw은 비어 있지 않은 추론 생략 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 이전 추론 전용 어시스턴트 턴은 제공자 어댑터가 재생 턴을 삭제하지 않도록 비어 있지 않은 추론 생략 텍스트로 대체됩니다.

**Amazon Bedrock(Converse API)**

- 빈 어시스턴트 스트림 오류 턴은 재생 전에 비어 있지 않은 대체 텍스트 블록으로 복구됩니다. Bedrock Converse는 `content: []`인 어시스턴트 메시지를 거부하므로, `stopReason: "error"`이고 콘텐츠가 비어 있는 저장된 어시스턴트 턴도 불러오기 전에 디스크에서 복구됩니다.
- 빈 텍스트 블록만 있는 어시스턴트 스트림 오류 턴은 유효하지 않은 빈 블록을 재생하는 대신 메모리 내 재생 사본에서 삭제됩니다.
- Anthropic과 같은 이유로 세션이 Compaction된 경우, Converse 재생 전에 Compaction 이전 어시스턴트 추론 서명이 제거됩니다.
- 재생 서명이 누락되었거나 비어 있거나 공백뿐인 Claude 추론 블록은 Converse 재생 전에 제거됩니다. 이로 인해 어시스턴트 턴이 비게 되면 OpenClaw은 비어 있지 않은 추론 생략 텍스트로 턴 형태를 유지합니다.
- 제거해야 하는 이전 추론 전용 어시스턴트 턴은 Converse 재생이 엄격한 턴 형태를 유지하도록 비어 있지 않은 추론 생략 텍스트로 대체됩니다.
- 재생 시 OpenClaw 전달 미러 및 Gateway가 삽입한 어시스턴트 턴을 필터링합니다.
- 전역 규칙에 따라 이미지 정리가 적용됩니다.

**Mistral(모델 ID 기반 감지 포함)**

- 도구 호출 ID 정리: strict9(영숫자, 길이 9).

**OpenRouter Gemini**

- 사고 서명 정리: base64가 아닌 `thought_signature` 값을 제거합니다(base64는 유지).

**OpenRouter Anthropic**

- 추론이 활성화된 경우, 검증된 OpenRouter OpenAI 호환 Anthropic 모델 페이로드에서 후행 어시스턴트 프리필 턴을 제거하여 직접 Anthropic 및 Cloudflare Anthropic 재생 동작과 일치시킵니다.

**그 외 모든 제공자**

- 이미지만 정리합니다.

---

## 이전 동작(2026.1.22 이전)

2026.1.22 릴리스 이전에 OpenClaw은 여러 계층의 트랜스크립트 위생 처리를 적용했습니다.

- **트랜스크립트 정리 확장 기능**이 모든 컨텍스트 구성 시 실행되었으며 다음 작업을 수행할 수 있었습니다.
  - 도구 사용/결과 페어링 복구.
  - 도구 호출 ID 정리(`_`/`-`를 보존하는 비엄격 모드 포함).
- 실행기도 제공자별 정리를 수행하여 작업이 중복되었습니다.
- 제공자 정책 외부에서도 어시스턴트 텍스트를 저장하기 전에 `<final>` 태그를 제거하고, 빈 어시스턴트 오류 턴을 삭제하며, 도구 호출 뒤의 어시스턴트 콘텐츠를 잘라내는 등 추가 변경이 발생했습니다.

이러한 복잡성으로 인해 제공자 간 회귀가 발생했습니다(특히 `openai-responses`의 `call_id|fc_id` 페어링). 2026.1.22 정리에서는 확장 기능을 제거하고 로직을 실행기에 중앙화했으며, 이미지 정리를 제외하고 OpenAI를 **수정하지 않도록** 변경했습니다.

## 관련 문서

- [세션 관리](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
