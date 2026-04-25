---
read_when:
    - 에이전트 루프 또는 수명 주기 이벤트에 대한 정확한 안내가 필요합니다
    - 세션 큐잉, transcript 쓰기 또는 세션 쓰기 잠금 동작을 변경하고 있습니다
summary: 에이전트 루프 수명 주기, 스트림 및 대기 의미론
title: 에이전트 루프
x-i18n:
    generated_at: "2026-04-25T05:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

에이전트 루프는 에이전트의 완전한 “실제” 실행입니다: 입력 수집 → 컨텍스트 조립 → 모델 추론 →
도구 실행 → 스트리밍 답장 → 영속화. 이는 메시지를 작업과 최종 답장으로
변환하면서 세션 상태의 일관성을 유지하는 권위 있는 경로입니다.

OpenClaw에서 루프는 세션당 하나의 직렬화된 실행이며, 모델이 생각하고, 도구를 호출하고, 출력을 스트리밍하는 동안
수명 주기 및 스트림 이벤트를 내보냅니다. 이 문서는 그 실제 루프가 종단 간으로 어떻게 연결되는지 설명합니다.

## 진입점

- Gateway RPC: `agent` 및 `agent.wait`.
- CLI: `agent` 명령어.

## 작동 방식(상위 수준)

1. `agent` RPC가 매개변수를 검증하고, 세션(sessionKey/sessionId)을 확인하고, 세션 메타데이터를 영속화한 뒤, 즉시 `{ runId, acceptedAt }`를 반환합니다.
2. `agentCommand`가 에이전트를 실행합니다:
   - 모델 + thinking/verbose/trace 기본값 확인
   - Skills 스냅샷 로드
   - `runEmbeddedPiAgent` 호출(pi-agent-core 런타임)
   - 임베디드 루프가 내보내지 않으면 **lifecycle end/error** 내보내기
3. `runEmbeddedPiAgent`:
   - 세션별 + 전역 큐를 통해 실행 직렬화
   - 모델 + auth profile 확인 및 pi 세션 빌드
   - pi 이벤트를 구독하고 assistant/tool delta 스트리밍
   - 제한 시간 강제 적용 -> 초과 시 실행 중단
   - payload + usage 메타데이터 반환
4. `subscribeEmbeddedPiSession`이 pi-agent-core 이벤트를 OpenClaw `agent` 스트림으로 브리지합니다:
   - 도구 이벤트 => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - lifecycle 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentRun`을 사용합니다:
   - `runId`에 대한 **lifecycle end/error** 대기
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` 반환

## 큐잉 + 동시성

- 실행은 세션 키(세션 lane)별로 직렬화되며, 선택적으로 전역 lane도 거칩니다.
- 이는 도구/세션 경합을 방지하고 세션 기록의 일관성을 유지합니다.
- 메시징 채널은 이 lane 시스템으로 전달되는 큐 모드(collect/steer/followup)를 선택할 수 있습니다.
  [Command Queue](/ko/concepts/queue)를 참조하세요.
- Transcript 쓰기 역시 세션 파일에 대한 세션 쓰기 잠금으로 보호됩니다. 이 잠금은
  프로세스를 인식하며 파일 기반이므로, 프로세스 내 큐를 우회하거나 다른 프로세스에서 오는
  작성자도 감지합니다.
- 세션 쓰기 잠금은 기본적으로 재진입 불가입니다. 도우미가 동일한 잠금을 의도적으로 중첩 획득하면서
  하나의 논리적 작성자를 유지하려면
  `allowReentrant: true`로 명시적으로 opt-in해야 합니다.

## 세션 + 워크스페이스 준비

- 워크스페이스를 확인하고 생성합니다. 샌드박스 실행은 샌드박스 워크스페이스 루트로 리디렉션될 수 있습니다.
- Skills를 로드하거나(또는 스냅샷에서 재사용) env와 프롬프트에 주입합니다.
- 부트스트랩/컨텍스트 파일을 확인하고 시스템 프롬프트 보고서에 주입합니다.
- 세션 쓰기 잠금을 획득하고, 스트리밍 전에 `SessionManager`를 열어 준비합니다. 이후의 모든
  transcript 재작성, Compaction, 또는 잘라내기 경로는 transcript 파일을 열거나
  변경하기 전에 동일한 잠금을 획득해야 합니다.

## 프롬프트 조립 + 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw의 기본 프롬프트, Skills 프롬프트, 부트스트랩 컨텍스트, 실행별 재정의로 구성됩니다.
- 모델별 제한과 Compaction 예약 토큰이 강제 적용됩니다.
- 모델이 실제로 보는 내용은 [System prompt](/ko/concepts/system-prompt)를 참조하세요.

## Hook 지점(가로챌 수 있는 위치)

OpenClaw에는 두 가지 Hook 시스템이 있습니다.

- **내부 Hook**(Gateway Hook): 명령어 및 수명 주기 이벤트를 위한 이벤트 기반 스크립트.
- **Plugin Hook**: 에이전트/도구 수명 주기 및 gateway 파이프라인 내부의 확장 지점.

### 내부 Hook(Gateway Hook)

- **`agent:bootstrap`**: 시스템 프롬프트가 최종 확정되기 전에 부트스트랩 파일을 빌드하는 동안 실행됩니다.
  이를 사용해 부트스트랩 컨텍스트 파일을 추가/제거하세요.
- **명령어 Hook**: `/new`, `/reset`, `/stop` 및 기타 명령어 이벤트(Hooks 문서 참조).

설정 및 예시는 [Hooks](/ko/automation/hooks)를 참조하세요.

### Plugin Hook(에이전트 + gateway 수명 주기)

이들은 에이전트 루프 또는 gateway 파이프라인 내부에서 실행됩니다.

- **`before_model_resolve`**: 세션 이전(`messages` 없음)에 실행되어 모델 확인 전에 provider/model을 결정적으로 재정의합니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함)에 실행되어 프롬프트 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext`, `appendSystemContext`를 주입합니다. 턴별 동적 텍스트에는 `prependContext`를 사용하고, 시스템 프롬프트 영역에 위치해야 하는 안정적인 지침에는 system-context 필드를 사용하세요.
- **`before_agent_start`**: 레거시 호환 Hook으로 두 단계 중 어느 쪽에서든 실행될 수 있습니다. 가능하면 위의 명시적 Hook을 우선 사용하세요.
- **`before_agent_reply`**: 인라인 작업 후, LLM 호출 전에 실행되어 Plugin이 해당 턴을 가져와 합성 답장을 반환하거나 턴 전체를 무음 처리할 수 있게 합니다.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 메타데이터를 검사합니다.
- **`before_compaction` / `after_compaction`**: Compaction 주기를 관찰하거나 주석을 추가합니다.
- **`before_tool_call` / `after_tool_call`**: 도구 매개변수/결과를 가로챕니다.
- **`before_install`**: 내장 스캔 결과를 검사하고 선택적으로 skill 또는 Plugin 설치를 차단합니다.
- **`tool_result_persist`**: 도구 결과가 OpenClaw 소유 세션 transcript에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 인바운드 + 아웃바운드 메시지 Hook.
- **`session_start` / `session_end`**: 세션 수명 주기 경계.
- **`gateway_start` / `gateway_stop`**: Gateway 수명 주기 이벤트.

아웃바운드/도구 가드용 Hook 결정 규칙:

- `before_tool_call`: `{ block: true }`는 최종적이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `before_tool_call`: `{ block: false }`는 no-op이며 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 최종적이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `before_install`: `{ block: false }`는 no-op이며 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 최종적이며 더 낮은 우선순위 핸들러를 중단시킵니다.
- `message_sending`: `{ cancel: false }`는 no-op이며 이전 취소를 해제하지 않습니다.

Hook API 및 등록 세부 정보는 [Plugin hooks](/ko/plugins/hooks)를 참조하세요.

Harness는 이 Hook을 다르게 적용할 수 있습니다. Codex app-server harness는
문서화된 미러링 표면에 대한 호환성 계약으로 OpenClaw Plugin Hook을 유지하며,
Codex 기본 Hook은 별도의 저수준 Codex 메커니즘으로 남아 있습니다.

## 스트리밍 + 부분 답장

- Assistant delta는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 내보내집니다.
- 블록 스트리밍은 `text_end` 또는 `message_end`에서 부분 답장을 내보낼 수 있습니다.
- reasoning 스트리밍은 별도 스트림 또는 블록 답장으로 내보낼 수 있습니다.
- 청크 분할 및 블록 답장 동작은 [Streaming](/ko/concepts/streaming)을 참조하세요.

## 도구 실행 + 메시징 도구

- 도구 시작/업데이트/종료 이벤트는 `tool` 스트림에서 내보내집니다.
- 도구 결과는 기록/내보내기 전에 크기와 이미지 payload 기준으로 정리됩니다.
- 메시징 도구 전송은 중복 assistant 확인 메시지를 억제하기 위해 추적됩니다.

## 답장 형태 조정 + 억제

- 최종 payload는 다음으로 조립됩니다:
  - assistant 텍스트(및 선택적 reasoning)
  - 인라인 도구 요약(verbose + 허용된 경우)
  - 모델 오류 시 assistant 오류 텍스트
- 정확한 무음 토큰 `NO_REPLY` / `no_reply`는 아웃고잉
  payload에서 필터링됩니다.
- 메시징 도구 중복은 최종 payload 목록에서 제거됩니다.
- 렌더링 가능한 payload가 하나도 남지 않고 도구 오류가 발생한 경우, fallback 도구 오류 답장이 내보내집니다
  (메시징 도구가 이미 사용자에게 보이는 답장을 보내지 않은 경우).

## Compaction + 재시도

- 자동 Compaction은 `compaction` 스트림 이벤트를 내보내고 재시도를 유발할 수 있습니다.
- 재시도 시에는 중복 출력을 방지하기 위해 메모리 내 버퍼와 도구 요약이 초기화됩니다.
- Compaction 파이프라인은 [Compaction](/ko/concepts/compaction)을 참조하세요.

## 이벤트 스트림(현재)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 내보내짐(`agentCommand`에서 fallback으로도 내보냄)
- `assistant`: pi-agent-core의 스트리밍 delta
- `tool`: pi-agent-core의 스트리밍 도구 이벤트

## 채팅 채널 처리

- Assistant delta는 채팅 `delta` 메시지로 버퍼링됩니다.
- 채팅 `final`은 **lifecycle end/error** 시 내보내집니다.

## 제한 시간

- `agent.wait` 기본값: 30초(대기만). `timeoutMs` 매개변수로 재정의합니다.
- 에이전트 런타임: `agents.defaults.timeoutSeconds` 기본값 172800초(48시간); `runEmbeddedPiAgent`의 중단 타이머에서 강제 적용됩니다.
- LLM 유휴 제한 시간: `agents.defaults.llm.idleTimeoutSeconds`는 유휴 창 안에 응답 청크가 도착하지 않으면 모델 요청을 중단합니다. 느린 로컬 모델이나 reasoning/도구 호출 provider에는 명시적으로 설정하세요. 비활성화하려면 0으로 설정하세요. 설정되지 않은 경우 OpenClaw는 `agents.defaults.timeoutSeconds`가 구성되어 있으면 그것을 사용하고, 아니면 120초를 사용합니다. 명시적인 LLM 또는 에이전트 제한 시간이 없는 Cron 트리거 실행은 유휴 watchdog을 비활성화하고 Cron 외부 제한 시간에 의존합니다.

## 조기 종료될 수 있는 위치

- 에이전트 제한 시간(중단)
- AbortSignal(취소)
- Gateway 연결 해제 또는 RPC 제한 시간
- `agent.wait` 제한 시간(대기만 해당, 에이전트는 중단하지 않음)

## 관련 항목

- [Tools](/ko/tools) — 사용 가능한 에이전트 도구
- [Hooks](/ko/automation/hooks) — 에이전트 수명 주기 이벤트에 의해 트리거되는 이벤트 기반 스크립트
- [Compaction](/ko/concepts/compaction) — 긴 대화를 요약하는 방법
- [Exec Approvals](/ko/tools/exec-approvals) — 셸 명령어용 승인 게이트
- [Thinking](/ko/tools/thinking) — thinking/reasoning 수준 구성
