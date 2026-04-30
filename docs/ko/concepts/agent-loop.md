---
read_when:
    - 에이전트 루프 또는 수명 주기 이벤트에 대한 정확한 단계별 설명이 필요합니다
    - 세션 대기열 처리, 트랜스크립트 쓰기 작업 또는 세션 쓰기 잠금 동작을 변경하는 경우
summary: 에이전트 루프 수명 주기, 스트림, 대기 의미 체계
title: 에이전트 루프
x-i18n:
    generated_at: "2026-04-30T18:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

에이전트형 루프는 에이전트의 전체 “실제” 실행입니다: 수신 → 컨텍스트 조립 → 모델 추론 →
도구 실행 → 스트리밍 응답 → 영속화. 이는 메시지를 작업과 최종 응답으로
변환하면서 세션 상태를 일관되게 유지하는 권위 있는 경로입니다.

OpenClaw에서 루프는 세션당 하나씩 직렬화되는 단일 실행이며, 모델이 생각하고 도구를 호출하며
출력을 스트리밍하는 동안 수명 주기 및 스트림 이벤트를 내보냅니다. 이 문서는 그 실제 루프가
엔드투엔드로 어떻게 연결되는지 설명합니다.

## 진입점

- Gateway RPC: `agent` 및 `agent.wait`.
- CLI: `agent` 명령.

## 작동 방식(상위 수준)

1. `agent` RPC는 매개변수를 검증하고, 세션(sessionKey/sessionId)을 해석하고, 세션 메타데이터를 영속화한 뒤, 즉시 `{ runId, acceptedAt }`를 반환합니다.
2. `agentCommand`는 에이전트를 실행합니다:
   - 모델 + thinking/verbose/trace 기본값 해석
   - Skills 스냅샷 로드
   - `runEmbeddedPiAgent` 호출(pi-agent-core 런타임)
   - 내장 루프가 하나를 내보내지 않으면 **수명 주기 end/error** 내보내기
3. `runEmbeddedPiAgent`:
   - 세션별 + 전역 큐를 통해 실행을 직렬화합니다
   - 모델 + 인증 프로필을 해석하고 Pi 세션을 빌드합니다
   - Pi 이벤트를 구독하고 어시스턴트/도구 델타를 스트리밍합니다
   - 시간 초과를 강제 적용합니다 -> 초과되면 실행을 중단합니다
   - Codex app-server 턴의 경우, 터미널 이벤트 전에 app-server 진행 상태 생성을 멈춘 수락된 턴을 중단합니다
   - 페이로드 + 사용량 메타데이터를 반환합니다
4. `subscribeEmbeddedPiSession`은 pi-agent-core 이벤트를 OpenClaw `agent` 스트림으로 브리지합니다:
   - 도구 이벤트 => `stream: "tool"`
   - 어시스턴트 델타 => `stream: "assistant"`
   - 수명 주기 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentRun`을 사용합니다:
   - `runId`의 **수명 주기 end/error**를 기다립니다
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }`를 반환합니다

## 큐잉 + 동시성

- 실행은 세션 키(세션 레인)별로, 그리고 선택적으로 전역 레인을 통해 직렬화됩니다.
- 이는 도구/세션 경합을 방지하고 세션 기록을 일관되게 유지합니다.
- 메시징 채널은 이 레인 시스템에 공급되는 큐 모드(collect/steer/followup)를 선택할 수 있습니다.
  [명령 큐](/ko/concepts/queue)를 참고하세요.
- transcript 쓰기도 세션 파일의 세션 쓰기 잠금으로 보호됩니다. 이 잠금은
  프로세스를 인식하며 파일 기반이므로, 인프로세스 큐를 우회하거나
  다른 프로세스에서 온 작성자를 포착합니다.
- 세션 쓰기 잠금은 기본적으로 재진입 불가입니다. 헬퍼가 하나의 논리적 작성자를 유지하면서
  동일한 잠금 획득을 의도적으로 중첩하는 경우, 명시적으로
  `allowReentrant: true`를 선택해야 합니다.

## 세션 + 작업공간 준비

- 작업공간이 해석되고 생성됩니다. 샌드박스 실행은 샌드박스 작업공간 루트로 리디렉션될 수 있습니다.
- Skills가 로드되거나 스냅샷에서 재사용되어 env와 프롬프트에 주입됩니다.
- 부트스트랩/컨텍스트 파일이 해석되어 시스템 프롬프트 보고서에 주입됩니다.
- 세션 쓰기 잠금을 획득합니다. `SessionManager`는 스트리밍 전에 열리고 준비됩니다. 이후의 모든
  transcript 재작성, Compaction 또는 잘라내기 경로는 transcript 파일을 열거나
  변경하기 전에 동일한 잠금을 획득해야 합니다.

## 프롬프트 조립 + 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw의 기본 프롬프트, Skills 프롬프트, 부트스트랩 컨텍스트, 실행별 오버라이드로 빌드됩니다.
- 모델별 제한 및 Compaction 예약 토큰이 강제 적용됩니다.
- 모델이 보는 내용은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참고하세요.

## 훅 지점(가로챌 수 있는 위치)

OpenClaw에는 두 가지 훅 시스템이 있습니다:

- **내부 훅**(Gateway 훅): 명령 및 수명 주기 이벤트를 위한 이벤트 기반 스크립트입니다.
- **Plugin 훅**: 에이전트/도구 수명 주기 및 gateway 파이프라인 내부의 확장 지점입니다.

### 내부 훅(Gateway 훅)

- **`agent:bootstrap`**: 시스템 프롬프트가 최종 확정되기 전에 부트스트랩 파일을 빌드하는 동안 실행됩니다.
  이를 사용해 부트스트랩 컨텍스트 파일을 추가/제거하세요.
- **명령 훅**: `/new`, `/reset`, `/stop` 및 기타 명령 이벤트(Hooks 문서 참고).

설정 및 예시는 [Hooks](/ko/automation/hooks)를 참고하세요.

### Plugin 훅(에이전트 + gateway 수명 주기)

이는 에이전트 루프 또는 gateway 파이프라인 내부에서 실행됩니다:

- **`before_model_resolve`**: 모델 해석 전에 공급자/모델을 결정적으로 오버라이드하기 위해 세션 전(`messages` 없음)에 실행됩니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함) 프롬프트 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext` 또는 `appendSystemContext`를 주입하기 위해 실행됩니다. 턴별 동적 텍스트에는 `prependContext`를 사용하고, 시스템 프롬프트 공간에 있어야 하는 안정적인 지침에는 시스템 컨텍스트 필드를 사용하세요.
- **`before_agent_start`**: 어느 단계에서든 실행될 수 있는 레거시 호환성 훅입니다. 위의 명시적 훅을 선호하세요.
- **`before_agent_reply`**: 인라인 작업 후 LLM 호출 전에 실행되어, Plugin이 해당 턴을 가져가 합성 응답을 반환하거나 턴을 완전히 무음 처리할 수 있게 합니다.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 메타데이터를 검사합니다.
- **`before_compaction` / `after_compaction`**: Compaction 주기를 관찰하거나 주석을 추가합니다.
- **`before_tool_call` / `after_tool_call`**: 도구 매개변수/결과를 가로챕니다.
- **`before_install`**: 내장 스캔 결과를 검사하고 선택적으로 skill 또는 Plugin 설치를 차단합니다.
- **`tool_result_persist`**: 도구 결과가 OpenClaw 소유 세션 transcript에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 수신 + 발신 메시지 훅입니다.
- **`session_start` / `session_end`**: 세션 수명 주기 경계입니다.
- **`gateway_start` / `gateway_stop`**: gateway 수명 주기 이벤트입니다.

발신/도구 가드에 대한 훅 결정 규칙:

- `before_tool_call`: `{ block: true }`는 터미널이며 낮은 우선순위 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 no-op이며 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 터미널이며 낮은 우선순위 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 no-op이며 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 터미널이며 낮은 우선순위 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 no-op이며 이전 취소를 해제하지 않습니다.

훅 API 및 등록 세부 정보는 [Plugin 훅](/ko/plugins/hooks)을 참고하세요.

하네스는 이러한 훅을 다르게 조정할 수 있습니다. Codex app-server 하네스는 문서화된 미러링
표면에 대한 호환성 계약으로 OpenClaw Plugin 훅을 유지하며, Codex 네이티브 훅은 별도의
하위 수준 Codex 메커니즘으로 남습니다.

## 스트리밍 + 부분 응답

- 어시스턴트 델타는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 내보내집니다.
- 블록 스트리밍은 `text_end` 또는 `message_end`에서 부분 응답을 내보낼 수 있습니다.
- 추론 스트리밍은 별도 스트림 또는 블록 응답으로 내보낼 수 있습니다.
- 청킹 및 블록 응답 동작은 [스트리밍](/ko/concepts/streaming)을 참고하세요.

## 도구 실행 + 메시징 도구

- 도구 시작/업데이트/종료 이벤트가 `tool` 스트림에 내보내집니다.
- 도구 결과는 로깅/내보내기 전에 크기와 이미지 페이로드에 대해 정리됩니다.
- 메시징 도구 전송은 중복 어시스턴트 확인을 억제하기 위해 추적됩니다.

## 응답 형성 + 억제

- 최종 페이로드는 다음에서 조립됩니다:
  - 어시스턴트 텍스트(및 선택적 추론)
  - 인라인 도구 요약(verbose + 허용된 경우)
  - 모델 오류 시 어시스턴트 오류 텍스트
- 정확한 무음 토큰 `NO_REPLY` / `no_reply`는 발신
  페이로드에서 필터링됩니다.
- 메시징 도구 중복은 최종 페이로드 목록에서 제거됩니다.
- 렌더링 가능한 페이로드가 남아 있지 않고 도구에 오류가 발생한 경우, 대체 도구 오류 응답이 내보내집니다
  (메시징 도구가 이미 사용자에게 보이는 응답을 보낸 경우 제외).

## Compaction + 재시도

- 자동 Compaction은 `compaction` 스트림 이벤트를 내보내며 재시도를 트리거할 수 있습니다.
- 재시도 시 중복 출력을 방지하기 위해 인메모리 버퍼와 도구 요약이 재설정됩니다.
- Compaction 파이프라인은 [Compaction](/ko/concepts/compaction)을 참고하세요.

## 이벤트 스트림(현재)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 내보냄(그리고 `agentCommand`에서 대체 수단으로 내보냄)
- `assistant`: pi-agent-core의 스트리밍 델타
- `tool`: pi-agent-core의 스트리밍 도구 이벤트

## 채팅 채널 처리

- 어시스턴트 델타는 채팅 `delta` 메시지로 버퍼링됩니다.
- 채팅 `final`은 **수명 주기 end/error**에서 내보내집니다.

## 시간 초과

- `agent.wait` 기본값: 30초(대기만). `timeoutMs` 매개변수가 오버라이드합니다.
- 에이전트 런타임: `agents.defaults.timeoutSeconds` 기본값 172800초(48시간); `runEmbeddedPiAgent` 중단 타이머에서 강제 적용됩니다.
- Cron 런타임: 격리된 에이전트 턴 `timeoutSeconds`는 cron이 소유합니다. 스케줄러는 실행이 시작될 때 해당 타이머를 시작하고, 구성된 마감 시점에 기반 실행을 중단한 뒤, 제한된 정리를 실행한 후 시간 초과를 기록하여 오래된 자식 세션이 레인을 막아 두지 못하게 합니다.
- 멈춘 세션 복구: 진단이 활성화되면 `diagnostics.stuckSessionWarnMs`가 오래 지속되는 `processing` 세션을 감지합니다. 활성 내장 실행, 활성 응답 작업, 활성 세션 레인 작업은 기본적으로 경고 전용으로 유지됩니다. 진단에서 해당 세션에 활성 작업이 없는 것으로 나타나면, watchdog이 영향을 받은 세션 레인을 해제하여 대기 중인 시작 작업이 비워질 수 있게 합니다.
- 모델 유휴 시간 초과: OpenClaw는 유휴 창 전에 응답 청크가 도착하지 않으면 모델 요청을 중단합니다. `models.providers.<id>.timeoutSeconds`는 느린 local loopback/자체 호스팅 공급자를 위해 이 유휴 watchdog을 연장합니다. 그렇지 않으면 OpenClaw는 구성된 경우 `agents.defaults.timeoutSeconds`를 사용하며, 기본적으로 120초로 제한됩니다. 명시적 모델 또는 에이전트 시간 초과가 없는 Cron 트리거 실행은 유휴 watchdog을 비활성화하고 Cron 외부 시간 초과에 의존합니다.
- 공급자 HTTP 요청 시간 초과: `models.providers.<id>.timeoutSeconds`는 연결, 헤더, 본문, SDK 요청 시간 초과, 전체 guarded-fetch 중단 처리, 모델 스트림 유휴 watchdog을 포함해 해당 공급자의 모델 HTTP fetch에 적용됩니다. 전체 에이전트 런타임 시간 초과를 올리기 전에 Ollama 같은 느린 local loopback/자체 호스팅 공급자에 이를 사용하세요.

## 조기 종료될 수 있는 위치

- 에이전트 시간 초과(중단)
- AbortSignal(취소)
- Gateway 연결 해제 또는 RPC 시간 초과
- `agent.wait` 시간 초과(대기 전용, 에이전트를 중지하지 않음)

## 관련 항목

- [도구](/ko/tools) — 사용 가능한 에이전트 도구
- [Hooks](/ko/automation/hooks) — 에이전트 수명 주기 이벤트에 의해 트리거되는 이벤트 기반 스크립트
- [Compaction](/ko/concepts/compaction) — 긴 대화가 요약되는 방식
- [Exec 승인](/ko/tools/exec-approvals) — 셸 명령에 대한 승인 게이트
- [Thinking](/ko/tools/thinking) — thinking/reasoning 수준 구성
