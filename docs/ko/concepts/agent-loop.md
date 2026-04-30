---
read_when:
    - 에이전트 루프 또는 수명 주기 이벤트에 대한 정확한 단계별 설명이 필요합니다
    - 세션 큐잉, 트랜스크립트 쓰기 또는 세션 쓰기 잠금 동작을 변경하는 경우
summary: 에이전트 루프 수명 주기, 스트림 및 대기 의미 체계
title: 에이전트 루프
x-i18n:
    generated_at: "2026-04-30T06:25:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

에이전트 루프는 에이전트의 전체 “실제” 실행입니다: 입력 수신 → 컨텍스트 조립 → 모델 추론 →
도구 실행 → 스트리밍 응답 → 영속화. 이는 메시지를 작업과 최종 응답으로 변환하면서
세션 상태의 일관성을 유지하는 권위 있는 경로입니다.

OpenClaw에서 루프는 모델이 사고하고, 도구를 호출하며, 출력을 스트리밍하는 동안 생명주기 및 스트림 이벤트를 내보내는
세션별 단일 직렬화 실행입니다. 이 문서는 그 실제 루프가 엔드투엔드로 어떻게 연결되는지 설명합니다.

## 진입점

- Gateway RPC: `agent` 및 `agent.wait`.
- CLI: `agent` 명령.

## 작동 방식(상위 수준)

1. `agent` RPC는 매개변수를 검증하고, 세션(sessionKey/sessionId)을 확인하고, 세션 메타데이터를 영속화한 뒤, 즉시 `{ runId, acceptedAt }`를 반환합니다.
2. `agentCommand`가 에이전트를 실행합니다:
   - 모델 + 사고/상세/추적 기본값 확인
   - Skills 스냅샷 로드
   - `runEmbeddedPiAgent` 호출(pi-agent-core 런타임)
   - 내장 루프가 생명주기 end/error를 내보내지 않으면 **생명주기 end/error** 내보냄
3. `runEmbeddedPiAgent`:
   - 세션별 + 전역 큐를 통해 실행을 직렬화
   - 모델 + 인증 프로필을 확인하고 Pi 세션 구성
   - Pi 이벤트를 구독하고 assistant/tool 델타 스트리밍
   - 타임아웃 강제 -> 초과 시 실행 중단
   - 페이로드 + 사용량 메타데이터 반환
4. `subscribeEmbeddedPiSession`은 pi-agent-core 이벤트를 OpenClaw `agent` 스트림으로 연결합니다:
   - 도구 이벤트 => `stream: "tool"`
   - assistant 델타 => `stream: "assistant"`
   - 생명주기 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentRun`을 사용합니다:
   - `runId`에 대한 **생명주기 end/error** 대기
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` 반환

## 큐잉 + 동시성

- 실행은 세션 키별(세션 레인)로 직렬화되며, 선택적으로 전역 레인을 통과합니다.
- 이는 도구/세션 경합을 방지하고 세션 기록의 일관성을 유지합니다.
- 메시징 채널은 이 레인 시스템에 공급되는 큐 모드(collect/steer/followup)를 선택할 수 있습니다.
  [명령 큐](/ko/concepts/queue)를 참조하세요.
- 트랜스크립트 쓰기도 세션 파일의 세션 쓰기 잠금으로 보호됩니다. 이 잠금은
  프로세스를 인식하고 파일 기반이므로, 프로세스 내 큐를 우회하거나 다른 프로세스에서 온
  작성자도 감지합니다.
- 세션 쓰기 잠금은 기본적으로 재진입할 수 없습니다. 헬퍼가 하나의 논리적 작성자를 유지하면서
  동일한 잠금 획득을 의도적으로 중첩하는 경우, `allowReentrant: true`로
  명시적으로 옵트인해야 합니다.

## 세션 + 워크스페이스 준비

- 워크스페이스를 확인하고 생성합니다. 샌드박스 실행은 샌드박스 워크스페이스 루트로 리디렉션될 수 있습니다.
- Skills를 로드하거나 스냅샷에서 재사용하고, env 및 프롬프트에 주입합니다.
- 부트스트랩/컨텍스트 파일을 확인하고 시스템 프롬프트 보고서에 주입합니다.
- 세션 쓰기 잠금을 획득합니다. 스트리밍 전에 `SessionManager`를 열고 준비합니다. 이후의
  트랜스크립트 재작성, Compaction 또는 잘라내기 경로는 트랜스크립트 파일을 열거나
  변경하기 전에 동일한 잠금을 획득해야 합니다.

## 프롬프트 조립 + 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw의 기본 프롬프트, Skills 프롬프트, 부트스트랩 컨텍스트, 실행별 오버라이드로 구성됩니다.
- 모델별 제한과 Compaction 예약 토큰이 적용됩니다.
- 모델이 보는 내용은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참조하세요.

## 훅 지점(가로챌 수 있는 위치)

OpenClaw에는 두 가지 훅 시스템이 있습니다:

- **내부 훅**(Gateway 훅): 명령 및 생명주기 이벤트를 위한 이벤트 기반 스크립트입니다.
- **Plugin 훅**: 에이전트/도구 생명주기 및 Gateway 파이프라인 내부의 확장 지점입니다.

### 내부 훅(Gateway 훅)

- **`agent:bootstrap`**: 시스템 프롬프트가 확정되기 전에 부트스트랩 파일을 구성하는 동안 실행됩니다.
  부트스트랩 컨텍스트 파일을 추가/제거할 때 사용하세요.
- **명령 훅**: `/new`, `/reset`, `/stop` 및 기타 명령 이벤트(Hooks 문서 참조).

설정 및 예시는 [Hooks](/ko/automation/hooks)를 참조하세요.

### Plugin 훅(에이전트 + Gateway 생명주기)

이들은 에이전트 루프 또는 Gateway 파이프라인 내부에서 실행됩니다:

- **`before_model_resolve`**: 모델 확인 전에 제공자/모델을 결정적으로 오버라이드하기 위해 세션 전 단계(`messages` 없음)에서 실행됩니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함) 실행되어 프롬프트 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext` 또는 `appendSystemContext`를 주입합니다. 턴별 동적 텍스트에는 `prependContext`를 사용하고, 시스템 프롬프트 공간에 있어야 하는 안정적인 지침에는 시스템 컨텍스트 필드를 사용하세요.
- **`before_agent_start`**: 어느 단계에서든 실행될 수 있는 레거시 호환성 훅입니다. 위의 명시적 훅을 선호하세요.
- **`before_agent_reply`**: 인라인 작업 후, LLM 호출 전에 실행되어 Plugin이 해당 턴을 처리하고 합성 응답을 반환하거나 턴을 완전히 침묵시킬 수 있게 합니다.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 메타데이터를 검사합니다.
- **`before_compaction` / `after_compaction`**: Compaction 주기를 관찰하거나 주석을 추가합니다.
- **`before_tool_call` / `after_tool_call`**: 도구 매개변수/결과를 가로챕니다.
- **`before_install`**: 기본 제공 스캔 결과를 검사하고 선택적으로 skill 또는 Plugin 설치를 차단합니다.
- **`tool_result_persist`**: 도구 결과가 OpenClaw 소유 세션 트랜스크립트에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 인바운드 + 아웃바운드 메시지 훅입니다.
- **`session_start` / `session_end`**: 세션 생명주기 경계입니다.
- **`gateway_start` / `gateway_stop`**: Gateway 생명주기 이벤트입니다.

아웃바운드/도구 가드에 대한 훅 결정 규칙:

- `before_tool_call`: `{ block: true }`는 종료 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 아무 작업도 하지 않으며 이전 취소를 해제하지 않습니다.

훅 API 및 등록 세부 정보는 [Plugin 훅](/ko/plugins/hooks)를 참조하세요.

하네스는 이러한 훅을 다르게 조정할 수 있습니다. Codex app-server 하네스는 문서화된 미러링 표면에 대한 호환성 계약으로
OpenClaw Plugin 훅을 유지하는 반면, Codex 네이티브 훅은 별도의 저수준 Codex 메커니즘으로 남아 있습니다.

## 스트리밍 + 부분 응답

- assistant 델타는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 내보내집니다.
- 블록 스트리밍은 `text_end` 또는 `message_end`에서 부분 응답을 내보낼 수 있습니다.
- 추론 스트리밍은 별도의 스트림 또는 블록 응답으로 내보낼 수 있습니다.
- 청크 처리 및 블록 응답 동작은 [스트리밍](/ko/concepts/streaming)을 참조하세요.

## 도구 실행 + 메시징 도구

- 도구 시작/업데이트/종료 이벤트는 `tool` 스트림에 내보내집니다.
- 도구 결과는 기록/내보내기 전에 크기 및 이미지 페이로드 기준으로 정리됩니다.
- 메시징 도구 전송은 중복 assistant 확인을 억제하기 위해 추적됩니다.

## 응답 구성 + 억제

- 최종 페이로드는 다음으로 조립됩니다:
  - assistant 텍스트(및 선택적 추론)
  - 인라인 도구 요약(상세 모드 + 허용된 경우)
  - 모델 오류 시 assistant 오류 텍스트
- 정확한 무응답 토큰 `NO_REPLY` / `no_reply`는 발신
  페이로드에서 필터링됩니다.
- 메시징 도구 중복 항목은 최종 페이로드 목록에서 제거됩니다.
- 렌더링 가능한 페이로드가 남아 있지 않고 도구에 오류가 발생한 경우, 대체 도구 오류 응답이 내보내집니다
  (메시징 도구가 이미 사용자에게 보이는 응답을 보낸 경우는 제외).

## Compaction + 재시도

- 자동 Compaction은 `compaction` 스트림 이벤트를 내보내며 재시도를 트리거할 수 있습니다.
- 재시도 시 중복 출력을 피하기 위해 인메모리 버퍼와 도구 요약이 재설정됩니다.
- Compaction 파이프라인은 [Compaction](/ko/concepts/compaction)을 참조하세요.

## 이벤트 스트림(현재)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 내보냄(및 `agentCommand`에서 대체로 내보냄)
- `assistant`: pi-agent-core의 스트리밍 델타
- `tool`: pi-agent-core의 스트리밍 도구 이벤트

## 채팅 채널 처리

- assistant 델타는 채팅 `delta` 메시지로 버퍼링됩니다.
- 채팅 `final`은 **생명주기 end/error**에서 내보내집니다.

## 타임아웃

- `agent.wait` 기본값: 30초(대기만). `timeoutMs` 매개변수로 오버라이드합니다.
- 에이전트 런타임: `agents.defaults.timeoutSeconds` 기본값 172800초(48시간); `runEmbeddedPiAgent` 중단 타이머에서 강제됩니다.
- Cron 런타임: 격리된 에이전트 턴 `timeoutSeconds`는 cron이 소유합니다. 스케줄러는 실행이 시작될 때 해당 타이머를 시작하고, 구성된 마감 시점에 기본 실행을 중단한 뒤, 타임아웃을 기록하기 전에 제한된 정리를 실행하여 오래된 자식 세션이 레인을 막아두지 못하게 합니다.
- 멈춘 세션 복구: 진단이 활성화된 경우 `diagnostics.stuckSessionWarnMs`가 장시간 `processing` 세션을 감지합니다. 활성 내장 실행, 활성 응답 작업, 활성 세션 레인 작업은 기본적으로 경고 전용으로 유지됩니다. 진단 결과 세션에 활성 작업이 없으면, 워치독이 영향을 받은 세션 레인을 해제하여 큐에 쌓인 시작 작업이 처리되도록 합니다.
- 모델 유휴 타임아웃: 유휴 창 내에 응답 청크가 도착하지 않으면 OpenClaw는 모델 요청을 중단합니다. `models.providers.<id>.timeoutSeconds`는 느린 로컬/셀프 호스팅 제공자에 대해 이 유휴 워치독을 연장합니다. 그렇지 않으면 OpenClaw는 구성된 경우 `agents.defaults.timeoutSeconds`를 사용하며, 기본적으로 120초로 제한됩니다. 명시적 모델 또는 에이전트 타임아웃이 없는 Cron 트리거 실행은 유휴 워치독을 비활성화하고 cron 외부 타임아웃에 의존합니다.
- 제공자 HTTP 요청 타임아웃: `models.providers.<id>.timeoutSeconds`는 연결, 헤더, 본문, SDK 요청 타임아웃, 전체 보호 fetch 중단 처리, 모델 스트림 유휴 워치독을 포함하여 해당 제공자의 모델 HTTP fetch에 적용됩니다. 전체 에이전트 런타임 타임아웃을 늘리기 전에 Ollama와 같은 느린 로컬/셀프 호스팅 제공자에 이 값을 사용하세요.

## 조기 종료될 수 있는 위치

- 에이전트 타임아웃(중단)
- AbortSignal(취소)
- Gateway 연결 해제 또는 RPC 타임아웃
- `agent.wait` 타임아웃(대기 전용, 에이전트를 중지하지 않음)

## 관련 항목

- [도구](/ko/tools) — 사용 가능한 에이전트 도구
- [Hooks](/ko/automation/hooks) — 에이전트 생명주기 이벤트로 트리거되는 이벤트 기반 스크립트
- [Compaction](/ko/concepts/compaction) — 긴 대화를 요약하는 방식
- [Exec 승인](/ko/tools/exec-approvals) — 셸 명령에 대한 승인 게이트
- [사고](/ko/tools/thinking) — 사고/추론 수준 구성
