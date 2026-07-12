---
read_when:
    - before_tool_call, before_agent_reply, 메시지 훅 또는 수명 주기 훅이 필요한 Plugin을 빌드하고 있습니다.
    - Plugin의 도구 호출을 차단하거나 다시 작성하거나 승인을 요구해야 합니다.
    - 내부 훅과 Plugin 훅 중에서 선택하고 있습니다
    - OpenClaw Cron 깨우기를 외부 호스트 스케줄러에 투영하고 있습니다
summary: 'Plugin 훅: 에이전트, 도구, 메시지, 세션 및 Gateway 수명 주기 이벤트 가로채기'
title: Plugin 훅
x-i18n:
    generated_at: "2026-07-12T15:33:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 훅은 OpenClaw Plugin을 위한 프로세스 내부 확장 지점입니다. 에이전트 실행, 도구 호출, 메시지 흐름, 세션 수명 주기, 하위 에이전트 라우팅, 설치 또는 Gateway 시작을 검사하거나 변경할 수 있습니다.

명령 및 `/new`, `/reset`, `/stop`, `agent:bootstrap`, `gateway:startup` 같은 Gateway 이벤트에 반응하는 운영자 설치형 소규모 `HOOK.md` 스크립트에는 대신 [내부 훅](/ko/automation/hooks)을 사용하십시오.

## 빠른 시작

Plugin 진입점에서 `api.on(...)`으로 타입 지정 훅을 등록합니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

결정이나 변경 사항을 반환할 수 있는 핸들러는 `priority` 내림차순으로 순차 실행되며, 우선순위가 같은 핸들러는 등록 순서를 유지합니다. 관찰 전용 핸들러는 병렬로 실행되며, 실행 후 결과를 기다리지 않는 관찰 디스패치는 이후 이벤트와 겹칠 수 있습니다. 관찰 부수 효과의 순서를 지정하는 데 우선순위를 사용하지 마십시오.

`api.on(name, handler, opts?)`은 다음을 허용합니다.

| 옵션        | 효과                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 실행 순서이며, 값이 높을수록 먼저 실행됩니다.                                                                                                                                                   |
| `timeoutMs` | 훅별 대기 시간 한도입니다. 이 시간이 만료되면 OpenClaw는 해당 핸들러의 대기를 중단하고 다음으로 진행합니다. 핸들러나 그 부수 효과는 취소하지 않습니다. 생략하면 러너의 기본 훅별 시간 제한을 사용합니다. |

운영자는 Plugin 코드를 패치하지 않고도 훅 시간 한도를 설정할 수 있습니다:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>`은 `hooks.timeoutMs`를 재정의하며, 이는 Plugin에서 작성한 `api.on(..., { timeoutMs })` 값을 재정의합니다. 각 값은 600000 ms 이하의 양의 정수여야 합니다. 속도가 느린 것으로 알려진 훅에는 훅별 재정의를 사용하는 것이 좋습니다.
한 Plugin이 모든 곳에서 더 긴 시간 예산을 받지 않도록 하는 훅입니다.

시간 초과된 핸들러 프로미스는 훅 콜백이 취소 신호를 받지 않으므로 계속 실행됩니다. 해당 Plugin 작업이 여전히 진행 중인 동안에도 훅 디스패치는 Gateway 수용 권한을 해제할 수 있습니다. 장시간 실행 작업을 소유한 Plugin은 자체적인 취소 및 종료 수명 주기를 제공해야 합니다.

아웃바운드 수정 훅 `message_sending` 및 `reply_payload_sending`은 핸들러당 기본 제한 시간으로 15초를 사용합니다. 하나가 시간 초과되면 OpenClaw는 Plugin 오류를 기록하고 직렬화된 전달 레인이 정리될 수 있도록 최신 페이로드로 계속 진행합니다. 전달 전에 의도적으로 더 느린 작업을 수행하는 Plugin에는 훅별 제한 시간을 더 크게 설정하십시오.

`createReplyDispatcher`를 사용하는 채널 Plugin도 `beforeDeliverOptions: { timeoutMs }`를 통해 단계별 양수 제한 시간을 더 크게 선언하거나, `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`로 작업을 추가할 때 선언할 수 있습니다. 소유자가 제한 시간을 선언하지 않으면 해당 콜백에는 동일한 기본값인 15초가 적용되므로 중단된 콜백이 직렬화된 전달 레인을 계속 점유할 수 없습니다.

각 훅은 해당 핸들러를 등록한 Plugin에 대해 확인된 구성인 `event.context.pluginConfig`를 받습니다. OpenClaw는 다른 Plugin이 보는 공유 이벤트 객체를 변경하지 않고 핸들러별로 이를 주입합니다.

## 훅 카탈로그

훅은 확장하는 표면에 따라 그룹화됩니다. **굵게 표시된** 이름은 결정
결과(차단, 취소, 재정의 또는 승인 요구)를 허용하며, 나머지는
관찰 전용입니다.

**에이전트 턴**

| 훅                              | 목적                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 세션 메시지를 로드하기 전에 공급자 또는 모델 재정의                                          |
| `agent_turn_prepare`            | 대기열에 있는 Plugin 턴 삽입을 사용하고 프롬프트 훅 전에 동일 턴 컨텍스트 추가                |
| `before_prompt_build`           | 모델 호출 전에 동적 컨텍스트 또는 시스템 프롬프트 텍스트 추가                                |
| `before_agent_start`            | 호환성 전용 통합 단계이며, 위의 두 훅 사용을 권장                                             |
| **`before_agent_run`**          | 모델에 제출하기 전에 최종 프롬프트와 세션 메시지를 검사하며, 실행을 차단할 수 있음             |
| **`before_agent_reply`**        | 합성 응답 또는 무응답으로 모델 턴을 단락 처리                                                 |
| **`before_agent_finalize`**     | 자연스러운 최종 답변을 검사하고 모델 실행을 한 번 더 요청                                     |
| `agent_end`                     | 최종 메시지, 성공 상태 및 실행 시간 관찰                                                      |
| `heartbeat_prompt_contribution` | 백그라운드 모니터 및 수명 주기 Plugin을 위한 Heartbeat 전용 컨텍스트 추가                      |

**대화 관찰**

| 훅                                        | 목적                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | 정제된 공급자/모델 호출 메타데이터: 타이밍, 결과, 제한된 요청 ID 해시. 프롬프트 또는 응답 콘텐츠는 포함하지 않음. |
| `llm_input`                               | 공급자 입력: 시스템 프롬프트, 프롬프트, 기록                                                                        |
| `llm_output`                              | 공급자 출력, 사용량 및 사용 가능한 경우 확인된 `contextTokenBudget`                                                |

**도구**

| 훅                         | 목적                                                          |
| -------------------------- | ------------------------------------------------------------- |
| **`before_tool_call`**     | 도구 매개변수를 다시 작성하거나 실행을 차단하거나 승인 요구   |
| `after_tool_call`          | 도구 결과, 오류 및 소요 시간 관찰                             |
| `resolve_exec_env`         | Plugin 소유 환경 변수를 `exec`에 제공                         |
| **`tool_result_persist`**  | 도구 결과에서 생성된 어시스턴트 메시지 다시 작성              |
| **`before_message_write`** | 진행 중인 메시지 쓰기를 검사하거나 차단(드문 경우)            |

**메시지 및 전달**

| 훅                              | 목적                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | 에이전트 라우팅 전에 인바운드 메시지를 선점(합성 응답)            |
| **`channel_pairing_requested`** | 새로 생성된 DM 페어링 요청 관찰                                   |
| `message_received`              | 인바운드 콘텐츠, 발신자, 스레드 및 메타데이터 관찰                |
| **`message_sending`**           | 아웃바운드 콘텐츠를 다시 작성하거나 전달 취소                     |
| **`reply_payload_sending`**     | 전달 전에 정규화된 응답 페이로드를 변경하거나 취소                |
| `message_sent`                  | 아웃바운드 전달 성공 또는 실패 관찰                               |
| **`before_dispatch`**           | 채널 인계 전에 아웃바운드 디스패치를 검사하거나 다시 작성         |
| **`reply_dispatch`**            | 최종 응답 디스패치 파이프라인에 참여                              |

**세션 및 Compaction**

| 훅                                       | 목적                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 세션 수명 주기 경계를 추적합니다. `reason`은 `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` 또는 `unknown` 중 하나입니다. 활성 세션이 있는 상태에서 프로세스가 중지되거나 재시작되면 Gateway 종료 종료자에서 `shutdown`/`restart`가 실행되므로 Plugin(메모리, 트랜스크립트 저장소)이 재시작 간에 고스트 행을 열린 상태로 남겨 두는 대신 마무리할 수 있습니다. 종료자는 제한된 시간 내에 동작하므로 느린 Plugin이 SIGTERM/SIGINT를 차단할 수 없습니다. |
| `before_compaction` / `after_compaction` | Compaction 주기 관찰 또는 주석 추가                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `before_reset`                           | 세션 재설정 이벤트(`/reset`, 프로그래밍 방식 재설정) 관찰                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**하위 에이전트**

- `subagent_spawned` / `subagent_ended` - 하위 에이전트 시작 및 완료를 관찰합니다.
- `subagent_delivery_target` - 코어 세션 바인딩으로 경로를 투영할 수 없을 때 완료 전달에 사용하는 호환성 훅입니다.
- `subagent_spawning` - 더 이상 사용되지 않는 호환성 훅입니다. 이제 코어는 `subagent_spawned`가 실행되기 전에 채널 세션 바인딩 어댑터를 통해 `thread: true` 하위 에이전트 바인딩을 준비합니다.
- OpenClaw가 시작 전에 하위 세션의 네이티브 모델을 확인한 경우 `subagent_spawned`에 `resolvedModel`과 `resolvedProvider`가 포함됩니다.
- `subagent_ended`는 `targetSessionKey`(식별자 - `subagent_spawned.childSessionKey`와 일치), `targetKind`(`"subagent"` 또는 `"acp"`), `reason`, 선택적 `outcome`(`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` 또는 `"deleted"`), 선택적 `error`, `runId`, `endedAt`, `accountId` 및 `sendFarewell`을 전달합니다. `agentId` 또는 `childSessionKey`는 포함하지 **않습니다**. 일치하는 `subagent_spawned` 이벤트와 연결하려면 `targetSessionKey`를 사용하십시오.

**수명 주기**

| 훅                               | 목적                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Gateway와 함께 Plugin 소유 서비스를 시작하거나 중지합니다                                                  |
| `deactivate`                     | `gateway_stop`의 사용 중단된 호환성 별칭입니다. 새 Plugin에서는 `gateway_stop`을 사용하십시오               |
| `cron_reconciled`                | 시작 또는 다시 로드한 후 전체 Gateway cron 상태를 기준으로 조정합니다                                      |
| `cron_changed`                   | Gateway 소유 cron 수명 주기 변경 사항(추가, 업데이트, 제거, 시작, 완료, 예약)을 관찰합니다                   |
| **`before_install`**             | 로드된 Plugin 런타임에서 준비된 skill 또는 Plugin 설치 자료를 검사합니다                                   |

### 채널 페어링 요청

페어링되지 않은 DM 발신자가 대기 중인 페어링 요청을 생성한 후 Plugin이 운영자에게 알리거나
감사 레코드를 작성해야 할 때 `channel_pairing_requested`를 사용하십시오. 요청이 생성될 때 훅이
디스패치되며, 느리거나 실패하는 훅 핸들러 때문에 페어링 응답의 채널 전송이 지연되지 않습니다.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `새 ${event.channel} 페어링 요청, 발신자 ${event.senderId}: ${event.code}`,
  });
});
```

이 훅은 관찰 전용입니다. 페어링 응답을 승인, 거부, 억제하거나 다시 작성하지 않습니다.
페이로드에는 채널, 선택적 `accountId`, 채널 범위의 `senderId`, 페어링 `code`, 채널 메타데이터가
포함됩니다. 페어링 코드는 유효한 일회용 승인 자격 증명으로 취급하고 신뢰할 수 있는 운영자
수신처로만 전달하십시오. `metadata`는 신뢰할 수 없는 발신자 제공 ID 텍스트로 취급하십시오.
이 훅에는 수신 메시지 본문이나 미디어가 포함되지 않습니다.

## 디버그 런타임 훅

에이전트 턴의 제공자 또는 모델을 전환하려면 모델 확인 전에 실행되는
`before_model_resolve`를 사용하십시오. `llm_output`은 모델 시도가 어시스턴트 출력을
생성한 후에만 실행됩니다.

실제 세션 모델을 입증하려면 런타임 등록을 검사한 다음 `openclaw sessions` 또는 Gateway
세션/상태 표면을 사용하십시오. 제공자 페이로드를 디버그하려면 `--raw-stream` 및
`--raw-stream-path <path>`를 사용해 Gateway를 시작하여 원시 모델 스트림 이벤트를 jsonl
파일에 기록하십시오.

## 도구 호출 정책

`before_tool_call`은 다음을 수신합니다.

- `event.toolName`
- `event.params`
- 선택적 `event.toolKind` 및 `event.toolInputKind`: 의도적으로 이름을 공유하는 도구를 위한
  호스트 권한 판별자입니다. 예를 들어 외부 코드 모드 `exec` 호출은
  `toolKind: "code_mode_exec"`를 사용하며 입력 언어를 알 수 있는 경우
  `toolInputKind: "javascript" | "typescript"`를 포함합니다
- 선택적 `event.derivedPaths`: `apply_patch`와 같이 잘 알려진 도구 엔벌로프에 대해 호스트가
  최선의 노력으로 파생한 대상 경로 힌트입니다. 이 경로는 도구가 실제로 수정할 대상을
  불완전하게 나타내거나 과도하게 근사할 수 있습니다(예: 잘못되었거나 부분적인 입력)
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.toolKind`,
  `ctx.toolInputKind`, 진단용 `ctx.trace` 등의 컨텍스트 필드

다음을 반환할 수 있습니다.

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    /** @deprecated 해결되지 않은 승인은 항상 거부됩니다. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

형식화된 수명 주기 훅의 보호 동작:

- `block: true`는 최종 결정이며 우선순위가 더 낮은 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 처리됩니다.
- `params`는 실행할 도구 매개변수를 다시 작성합니다.
- `requireApproval`은 에이전트 실행을 일시 중지하고 Plugin 승인을 통해 사용자에게 요청합니다.
  `/approve`는 exec 승인과 Plugin 승인을 모두 승인할 수 있습니다. Codex 앱 서버의 보고 모드
  네이티브 `PreToolUse` 릴레이에서는 일치하는 앱 서버 승인 요청에 처리를 위임합니다.
  [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#hook-boundaries)을 참조하십시오.
- 우선순위가 더 높은 훅이 승인을 요청한 후에도 우선순위가 더 낮은 `block: true`가 차단할 수
  있습니다.
- `onResolution`은 확인된 결정인 `allow-once`, `allow-always`, `deny`, `timeout` 또는
  `cancelled`를 수신합니다.

승인 라우팅, 결정 동작, 선택적 도구 또는 exec 승인 대신 `requireApproval`을 사용해야 하는
경우는 [Plugin 권한 요청](/ko/plugins/plugin-permission-requests)을 참조하십시오.

호스트 수준 정책이 필요한 Plugin은 `api.registerTrustedToolPolicy(...)`를 사용하여 신뢰할 수
있는 도구 정책을 등록할 수 있습니다. 이러한 정책은 일반 `before_tool_call` 훅 및 일반 훅
결정보다 먼저 실행됩니다. 번들된 신뢰 정책이 먼저 실행되고, 설치된 Plugin의 신뢰 정책이
Plugin 로드 순서에 따라 실행되며, 그 다음 일반 `before_tool_call` 훅이 실행됩니다. 번들된
Plugin은 기존 신뢰 정책 경로를 유지합니다. 설치된 Plugin은 명시적으로 활성화해야 하며 모든
정책 ID를 `contracts.trustedToolPolicies`에 선언해야 합니다. 선언되지 않은 ID는 등록 전에
거부됩니다. 정책 ID는 등록한 Plugin 범위에 속하므로 서로 다른 Plugin에서 동일한 로컬 ID를
재사용할 수 있습니다. 이 계층은 작업 공간 정책, 예산 적용 또는 예약된 워크플로 안전성과
같이 호스트가 신뢰하는 게이트에만 사용하십시오.

### Exec 환경 훅

`resolve_exec_env`를 사용하면 명령 실행 전에 Plugin이 `exec` 도구 호출에 환경 변수를
제공할 수 있습니다. 다음을 수신합니다.

- `event.sessionKey`
- `event.toolName`, 현재는 항상 `"exec"`
- `event.host`, `"gateway"`, `"sandbox"`, `"node"` 중 하나
- `ctx.agentId`, `ctx.sessionKey`, `ctx.messageProvider`, `ctx.channelId` 등의 컨텍스트 필드

exec 환경에 병합할 `Record<string, string>`을 반환하십시오. 핸들러는 우선순위에 따라
실행되며, 동일한 키에 대해서는 나중 결과가 이전 결과를 재정의합니다.

훅 출력은 병합되기 전에 호스트 exec 환경 키 정책을 통해 필터링됩니다. `PATH`는 항상
제거됩니다(명령 확인 및 안전한 바이너리 검사가 이에 의존함). 유효하지 않은 키와 `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, 프록시 변수(`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`,
`NO_PROXY`), TLS 재정의 변수(`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_FILE` 및 유사
변수)처럼 위험한 호스트 재정의 키는 제거됩니다. 필터링된 Plugin 환경은 Gateway
승인/감사 메타데이터에 포함되며 Node 호스트 실행 요청으로 전달됩니다.

### 도구 결과 영속성

도구 결과에는 UI 렌더링, 진단, 미디어 라우팅 또는 Plugin 소유 메타데이터를 위한 구조화된
`details`가 포함될 수 있습니다. `details`는 프롬프트 콘텐츠가 아닌 런타임 메타데이터로
취급하십시오.

- OpenClaw는 메타데이터가 모델 컨텍스트가 되지 않도록 제공자 재생 및 Compaction 입력 전에
  `toolResult.details`를 제거합니다.
- 영속화된 세션 항목은 크기가 제한된 `details`만 유지합니다. 너무 큰 details는 간결한
  요약과 `persistedDetailsTruncated: true`로 대체됩니다.
- `tool_result_persist` 및 `before_message_write`는 최종 영속성 제한 전에 실행됩니다. 반환되는
  `details`를 작게 유지하고 프롬프트 관련 텍스트를 `details`에만 넣지 마십시오. 모델에
  표시되는 도구 출력은 `content`에 넣으십시오.

## 프롬프트 및 모델 훅

새 Plugin에는 단계별 훅을 사용하십시오.

- `before_model_resolve`: 현재 프롬프트와 첨부 파일 메타데이터만 수신합니다.
  `providerOverride` 또는 `modelOverride`를 반환하십시오.
- `agent_turn_prepare`: 현재 프롬프트, 준비된 세션 메시지, 이 세션에 대해 비워진 정확히 한 번
  처리되는 대기열 삽입 항목을 수신합니다. `prependContext` 또는 `appendContext`를
  반환하십시오.
- `before_prompt_build`: 현재 프롬프트와 세션 메시지를 수신합니다. `prependContext`,
  `appendContext`, `systemPrompt`, `prependSystemContext` 또는 `appendSystemContext`를
  반환하십시오.
- `heartbeat_prompt_contribution`: Heartbeat 턴에서만 실행되며 `prependContext` 또는
  `appendContext`를 반환합니다. 사용자 시작 턴을 변경하지 않고 현재 상태를 요약해야 하는
  백그라운드 모니터를 위한 것입니다.

`before_agent_start`는 호환성을 위해 유지됩니다. Plugin이 레거시 결합 단계에 의존하지 않도록
위의 명시적 훅을 우선 사용하십시오.

`before_agent_run`은 프롬프트 구성 후, 프롬프트 로컬 이미지 로드 및 `llm_input` 관찰을
포함한 모든 모델 입력 전에 실행됩니다. 현재 사용자 입력을 `prompt`로 수신하며, 로드된 세션
기록은 `messages`로, 활성 시스템 프롬프트도 함께 수신합니다. 모델이 프롬프트를 읽기 전에
실행을 중지하려면 `{ outcome: "block", reason, message? }`를 반환하십시오. `reason`은
내부용이고 `message`는 사용자에게 표시되는 대체 메시지입니다. `pass` 및 `block` 결과만
지원되며, 지원되지 않는 결정 형태는 안전하게 차단됩니다.

실행이 차단되면 OpenClaw는 대체 텍스트만 `message.content`에 저장하고 차단한 Plugin ID 및
타임스탬프와 같은 민감하지 않은 차단 메타데이터를 함께 저장합니다. 원래 사용자 텍스트는
트랜스크립트나 향후 컨텍스트에 보존되지 않습니다. 내부 차단 이유는 민감한 정보로 취급되며
트랜스크립트, 기록, 브로드캐스트, 로그 및 진단 페이로드에서 제외됩니다. 관찰 가능성에는
차단자 ID, 결과, 타임스탬프 또는 안전한 범주와 같이 정제된 필드를 사용해야 합니다.

`before_agent_start`와 `agent_end`에는 OpenClaw가 활성 실행을 식별할 수 있는 경우
`event.runId`가 포함되며, 동일한 값은 `ctx.runId`에도 있습니다. Cron으로 구동되는 실행은
에이전트 턴 컨텍스트에 `ctx.jobId`(원본 cron 작업 ID)도 노출하므로 훅이 메트릭, 부수 효과
또는 상태의 범위를 특정 예약 작업으로 한정할 수 있습니다. `ctx.jobId`는 `before_tool_call`
도구 컨텍스트의 일부가 아닙니다.

채널에서 시작된 실행의 경우 `ctx.channel`과 `ctx.messageProvider`는 `discord` 또는
`telegram`과 같은 제공자 표면을 식별하며, `ctx.channelId`는 OpenClaw가 세션 키 또는 전송
메타데이터에서 파생할 수 있는 경우 대화 대상 식별자입니다.

발신자 ID를 사용할 수 있는 경우 에이전트 훅 컨텍스트에는 다음도 포함됩니다.

- `ctx.senderId` - 채널 범위 발신자 ID(예: Feishu `open_id`, Discord 사용자 ID). 실행이
  알려진 발신자 메타데이터가 있는 사용자 메시지에서 시작될 때 채워집니다.
- `ctx.chatId` - 전송 계층 네이티브 대화 식별자(예: Feishu `chat_id`, Telegram
  `chat_id`). 원본 채널이 네이티브 대화 ID를 제공할 때 채워집니다.
- `ctx.channelContext.sender.id` - 채널 소유 객체 아래에 있는 `ctx.senderId`와 동일한 발신자
  ID이며, Plugin은 이 객체를 채널별 필드로 확장할 수 있습니다.
- `ctx.channelContext.chat.id` - 채널 소유 객체 아래에 있는 `ctx.chatId`와 동일한 대화
  ID이며, Plugin은 이 객체를 채널별 필드로 확장할 수 있습니다.

코어는 중첩된 `id` 필드만 정의합니다. 인바운드 헬퍼를 통해 더 풍부한 발신자 또는 채팅
메타데이터를 전달하는 채널 Plugin은 `openclaw/plugin-sdk/channel-inbound`의
`PluginHookChannelSenderContext` 또는 `PluginHookChannelChatContext`를 확장할 수 있습니다.

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

채널 Plugin은 인바운드 SDK 헬퍼를 통해 해당 필드를 전달합니다.

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

이러한 필드는 선택 사항이며 시스템에서 시작된 실행(Heartbeat, cron, exec 이벤트)에는
없습니다.

`ctx.senderExternalId`는 이전 Plugin을 위한 사용 중단된 소스 호환성 필드로 유지됩니다. 코어는
이 필드를 채우지 않습니다. 새로운 채널별 발신자 ID는 모듈 확장을 통해
`ctx.channelContext.sender` 아래에 있어야 합니다.

`agent_end`는 관찰 훅입니다. Gateway 및 영속적 하네스 경로는 턴이 끝난 후 이를 실행하고 완료를 기다리지 않지만, 수명이 짧은 일회성 CLI 경로는 신뢰할 수 있는 플러그인이 최종 관찰 가능성 데이터를 플러시하거나 상태를 캡처할 수 있도록 프로세스를 정리하기 전에 훅 프로미스가 완료될 때까지 기다립니다. 훅 실행기는 작동이 멈춘 플러그인이나 임베딩 엔드포인트 때문에 훅 프로미스가 영원히 대기 상태로 남지 않도록 30초 제한 시간을 적용합니다. 제한 시간이 초과되면 로그를 기록하고 OpenClaw는 계속 진행합니다. 플러그인이 자체 중단 신호도 사용하지 않는 한 플러그인 소유의 네트워크 작업은 취소하지 않습니다.

원시 프롬프트, 기록, 응답, 헤더, 요청 본문 또는 제공자 요청 ID를 수신해서는 안 되는 제공자 호출 텔레메트리에는 `model_call_started`와 `model_call_ended`를 사용하십시오. 이러한 훅에는 `runId`, `callId`, `provider`, `model`, 선택적 `api`/`transport`, 최종 `durationMs`/`outcome`과 같은 안정적인 메타데이터가 포함되며, OpenClaw가 제한된 길이의 제공자 요청 ID 해시를 도출할 수 있는 경우 `upstreamRequestIdHash`도 포함됩니다. 런타임에서 컨텍스트 창 메타데이터를 확인한 경우 훅 이벤트와 컨텍스트에는 모델/구성/에이전트 상한을 적용한 후의 유효 토큰 예산인 `contextTokenBudget`도 포함되며, 더 낮은 상한이 적용된 경우 `contextWindowSource`와 `contextWindowReferenceTokens`도 포함됩니다.

`before_agent_finalize`는 하네스가 자연스럽게 생성된 최종 어시스턴트 답변을 수락하려는 경우에만 실행됩니다. 이는 `/stop` 취소 경로가 아니며 사용자가 턴을 중단할 때는 실행되지 않습니다. 최종 확정 전에 하네스에 모델 패스를 한 번 더 요청하려면 `{ action: "revise", reason }`을 반환하고, 최종 확정을 강제하려면 `{ action:
"finalize", reason? }`을 반환하며, 계속 진행하려면 결과를 생략하십시오. 핸들러의 기본 시간 예산은 15초입니다. 제한 시간이 초과되면 OpenClaw는 실패를 기록하고 원래 최종 답변으로 계속 진행합니다.
Codex 네이티브 `Stop` 훅은 OpenClaw의 `before_agent_finalize` 결정으로 이 훅에 전달됩니다.

`action: "revise"`를 반환할 때 플러그인은 추가 모델 패스가 제한적이고 재실행에 안전하도록 `retry` 메타데이터를 포함할 수 있습니다:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`은 하네스에 전송되는 수정 사유에 추가됩니다.
`idempotencyKey`를 사용하면 호스트가 동일한 Plugin 요청에 대해 동등한 최종 확정 결정 전반에서 재시도 횟수를 계산할 수 있으며, `maxAttempts`는 자연스러운 최종 답변으로 계속 진행하기 전에 호스트가 허용할 추가 패스 수를 제한합니다.

원시 대화 훅(`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` 또는 `before_agent_run`)이 필요한 번들되지 않은 Plugin은 다음을 설정해야 합니다.

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

프롬프트를 변경하는 훅과 다음 턴에 대한 영구적인 주입은 Plugin별로
`plugins.entries.<id>.hooks.allowPromptInjection=false`를 사용하여 비활성화할 수 있습니다.

### 세션 확장 및 다음 턴 주입

워크플로 Plugin은 `api.session.state.registerSessionExtension(...)`을 사용하여 작은 JSON 호환 세션 상태를 유지하고 Gateway `sessions.pluginPatch` 메서드를 통해 업데이트할 수 있습니다. 세션 행은 등록된 확장 상태를 `pluginExtensions`를 통해 투영하므로 Control UI와 기타 클라이언트가 Plugin 내부 구현을 알지 않고도 Plugin 소유 상태를 렌더링할 수 있습니다. `api.registerSessionExtension(...)`도 계속 작동하지만 `api.session.state` 네임스페이스 사용이 권장되며 더 이상 사용되지 않을 예정입니다.

Plugin에서 지속 가능한 컨텍스트를 정확히 한 번 다음 모델 턴에 전달해야 할 때 `api.session.workflow.enqueueNextTurnInjection(...)`을 사용하십시오(최상위 `api.enqueueNextTurnInjection(...)`은 동작이 동일한 더 이상 사용되지 않을 별칭입니다). OpenClaw는 프롬프트 훅보다 먼저 대기 중인 주입을 소진하고, 만료된 주입을 삭제하며, Plugin별 `idempotencyKey`를 기준으로 중복을 제거합니다. 이는 다음 턴에 모델이 볼 수 있어야 하지만 영구적인 시스템 프롬프트 텍스트가 되어서는 안 되는 승인 재개, 정책 요약, 백그라운드 모니터 변경분 및 명령 연속 작업에 적합한 연계 지점입니다.

정리 의미 체계는 계약의 일부입니다. 세션 확장 정리 및 런타임 수명 주기 정리 콜백은 `reset`, `delete`, `disable` 또는 `restart`를 받습니다. 재설정/삭제/비활성화 시 호스트는 소유 Plugin의 영구 세션 확장 상태와 대기 중인 다음 턴 주입을 제거합니다. 재시작 시에는 지속 가능한 세션 상태를 유지하는 한편, 정리 콜백을 통해 Plugin이 이전 런타임 세대의 스케줄러 작업, 실행 컨텍스트 및 기타 대역 외 리소스를 해제할 수 있습니다.

## 메시지 훅

채널 수준 라우팅 및 전달 정책에는 메시지 훅을 사용하십시오.

- `message_received`: 인바운드 콘텐츠, 발신자, `threadId`, `messageId`, `senderId`, 선택적 실행/세션 상관관계 및 메타데이터를 관찰합니다.
- `message_sending`: `content`를 다시 작성하거나 `{ cancel: true }`를 반환합니다.
- `reply_payload_sending`: 정규화된 `ReplyPayload` 객체(`presentation`, `delivery`, 미디어 참조 및 텍스트 포함)를 다시 작성하거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 응답의 경우 채널 페이로드에 표시되는 텍스트/캡션이 없더라도 `content`에 숨겨진 음성 대본이 포함될 수 있습니다. 해당 `content`를 다시 작성하면 훅에 표시되는 대본만 업데이트되며, 미디어 캡션으로 렌더링되지는 않습니다.

`reply_payload_sending` 이벤트에는 최선형 실시간 턴별 모델/사용량/컨텍스트 스냅샷인 `usageState`가 포함될 수 있습니다. 지속적 전달, 복구된 재생 및 정확한 실행 상관관계가 없는 응답에서는 이 값이 생략됩니다.

메시지 훅 컨텍스트는 사용 가능한 경우 안정적인 상관관계 필드를 노출합니다.
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`가 이에 해당합니다. 인바운드
및 `before_dispatch` 컨텍스트는 채널에 가시성 필터링된 인용 메시지 데이터가
있는 경우 응답 메타데이터도 노출합니다. 해당 필드는 `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, `replyToIsQuote`입니다. 레거시 메타데이터를 읽기 전에
이러한 일급 필드를 우선 사용하십시오.

채널별 메타데이터를 사용하기 전에 형식화된 `threadId` 및 `replyToId` 필드를
우선 사용하십시오.

결정 규칙:

- `cancel: true`가 지정된 `message_sending`은 최종 결정입니다.
- `cancel: false`가 지정된 `message_sending`은 결정하지 않은 것으로 처리됩니다.
- 다시 작성된 `content`는 이후 훅에서 전송을 취소하지 않는 한 우선순위가 더 낮은 훅으로
  계속 전달됩니다.
- `reply_payload_sending`은 페이로드 정규화 후 채널
  전송 전에 실행되며, 여기에는 원래 채널로 다시 라우팅되는 응답도 포함됩니다.
  핸들러는 순차적으로 실행되며 각 핸들러는 우선순위가 더 높은 핸들러가 생성한
  최신 페이로드를 받습니다.
- `reply_payload_sending` 페이로드는 `trustedLocalMedia` 같은 런타임 신뢰 마커를
  노출하지 않습니다. Plugin은 페이로드 형태를 편집할 수 있지만 로컬
  미디어 신뢰를 부여할 수는 없습니다.
- `message_sending`은 취소와 함께 `cancelReason` 및 크기가 제한된 `metadata`를
  반환할 수 있습니다. 새로운 메시지 수명 주기 API는 이를
  `cancelled_by_message_sending_hook` 사유의 억제된 전송 결과로 노출합니다. 레거시
  직접 전송은 호환성을 위해 계속 빈 결과 배열을 반환합니다.
- `message_sent`는 관찰 전용입니다. 핸들러 실패는 로그에 기록되며
  전송 결과를 변경하지 않습니다.

## 설치 훅

운영자가 소유하는 허용/차단 결정에는 `security.installPolicy`를 사용하십시오. 이
정책은 OpenClaw 구성에서 실행되고 CLI 설치 및 업데이트 경로를 다루며,
활성화되었지만 사용할 수 없는 경우 실패 시 차단됩니다.

`before_install`은 Plugin 런타임 수명 주기 훅입니다. Plugin 훅이
이미 로드된 OpenClaw 프로세스에서만 `security.installPolicy` 이후에 실행되며,
Gateway 기반 설치 흐름이 이에 해당합니다. Plugin 소유의 관찰, 경고,
호환성 검사에 유용하지만, 설치에 대한 주요 엔터프라이즈 또는 호스트 보안
경계는 아닙니다. `builtinScan` 필드는 호환성을 위해 이벤트 페이로드에
남아 있지만, OpenClaw는 더 이상 설치 시점의 기본 제공 위험 코드 차단을
실행하지 않으므로 빈 `ok` 결과입니다. 추가 발견 사항 또는
`{ block: true, blockReason }`을 반환하여 해당 프로세스에서 설치를 중지하십시오.

`block: true`는 최종 결정입니다. `block: false`는 결정하지 않은 것으로 처리됩니다. 핸들러
실패 시 설치는 실패 시 차단 방식으로 중단됩니다.

## Gateway 수명 주기

일반 Plugin 서비스를 시작하려면 `gateway_start`를 사용하고, 장기 실행 리소스를
정리하려면 `gateway_stop`을 사용하십시오. `gateway_start`가 실행될 때 Cron 스케줄러가
아직 로드 중일 수 있으므로 외부 Cron 프로젝션의 기준선 신호로 사용하지
마십시오.

Plugin 소유 런타임 서비스에서 내부 `gateway:startup` 훅에 의존하지
마십시오.

`cron_reconciled`는 Gateway Cron 스케줄러와 종료 시 감시자가 영속 상태를
조정한 후 발생합니다. 초기 시작 시와 구성 다시 로드 중 스케줄러가 교체될 때
모두 발생합니다. 이벤트는 `reason`(`startup` 또는 `reload`)과 유효한 `enabled`
상태를 보고합니다. 비활성화된 Cron도 `enabled: false`와 함께 이벤트를 내보내므로
외부 프로젝션이 오래된 깨우기 작업을 제거할 수 있습니다. 조정을 완료한 정확한
스케줄러 인스턴스에는 `ctx.getCron?.()`을 사용하십시오. 이후 다시 로드해도 해당
콜백의 대상은 변경되지 않습니다. `ctx.abortSignal`도 같은 스케줄러 스냅샷에
속합니다. Gateway는 새 스케줄러가 준비되거나 종료가 시작되는 즉시 이를
중단합니다. 모든 영속적 부수 효과에 이 신호를 전달하고, 중단된 후에는 스냅샷을
수락하지 마십시오.
이는 스케줄러 수명 주기 신호이지 Plugin 활성화 신호가 아닙니다.
Plugin만 핫 리로드해도 이 신호는 다시 발생하지 않습니다. 새로 활성화된 소비자는
다음 스케줄러 교체 또는 Gateway 시작 시 첫 기준선을 받습니다.

다른 관찰 훅과 마찬가지로 `gateway_start` 및 `cron_reconciled` 콜백은
겹쳐 실행될 수 있습니다. 두 핸들러가 Plugin 초기화를 공유하는 경우 콜백 순서에
의존하지 말고 Plugin 로컬 준비 완료 Promise를 사용하여 조정하십시오.

`cron_changed`는 `added`, `updated`, `removed`, `started`, `finished`,
`scheduled` 사유를 포함하는 형식화된 이벤트 페이로드와 함께 Gateway 소유의 Cron
수명 주기 이벤트에 대해 발생합니다. 이벤트에는 `PluginHookGatewayCronJob`
스냅샷(존재하는 경우 `state.nextRunAtMs`, `state.lastRunStatus`,
`state.lastError` 포함)과 `not-requested` | `delivered` | `not-delivered` | `unknown`
중 하나인 `PluginHookGatewayCronDeliveryStatus`가 포함됩니다. 제거 이벤트는
커밋 후에 발생합니다. 즉, 영속 삭제에 성공한 후에만 발생하며 외부 스케줄러가
상태를 조정할 수 있도록 삭제된 작업 스냅샷도 계속 포함합니다.

`scheduled` 이벤트는 커밋 후에 발생합니다. 즉, 성공적인 영속 쓰기로 기존 작업의
유효한 `nextRunAtMs`가 변경된 후에만 발생하며, 해당 작업의 명시적인 `added`,
`updated`, `removed` 수명 주기 이벤트는 제외됩니다. 최상위
`event.nextRunAtMs`는 커밋된 다음 깨우기 시점입니다. 이 값이 없으면 작업에
다음 깨우기 시점이 없습니다. 이러한 이벤트를 순서가 보장된 델타 로그가 아닌
조정 힌트로 취급하십시오. 병합 가능한 힌트로 사용하여 `cron_reconciled`가 마지막으로
캡처한 스케줄러를 다시 읽도록 하십시오. `cron_changed` 컨텍스트에서 스케줄러를
채택하지 마십시오. 기한 확인 및 실행의 신뢰 가능한 원본은 OpenClaw로 유지하십시오.

### 안전한 외부 Cron 프로젝션

Cron 이벤트 델타를 전달하는 대신 완전한 깨우기 스냅샷을 프로젝션하십시오.
외부 어댑터의 `replaceAll` 작업은 원자적이고 멱등적이어야 하며, 호스트가
스냅샷을 영속적으로 수락한 후에만 완료되어야 합니다. 또한 제공된 중단 신호를
준수해야 합니다. 영속적 수락 전에 신호가 중단되면 어댑터는 해당 스냅샷을
수락해서는 안 됩니다.

이 패턴에서는 최신 상태 작업자 하나만 실행 상태로 유지됩니다. `cron_reconciled`만
스케줄러 인스턴스를 채택하며, `cron_changed`는 해당 작업자에게 권위 있는 인스턴스를
다시 읽도록 요청할 뿐이므로 늦게 도착한 힌트가 이전 스케줄러를 복원할 수 없습니다.
더 새로운 리비전은 활성 호스트 시도가 오래된 스냅샷을 수락하기 전에 이를 중단합니다.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

`cron_reconciled`가 `enabled: false`를 보고하면 동일한 경로에서
`replaceAll([])`을 호출하여 오래된 외부 깨우기 항목을 제거합니다. 이 예시의 재시도/백오프는
프로세스 로컬 방식이며 런타임 어댑터 오류를 일시적인 것으로 처리합니다. 재시도할 수 없는
구성은 등록 전에 검증하십시오. OpenClaw는 Plugin 훅 효과를 위한
아웃박스를 제공하지 않습니다. 영구적으로 수락되기 전에 프로세스가 종료되면
다음 Gateway 시작 시 새로운 권위 있는 `cron_reconciled` 스냅샷이 발생합니다.
`gateway_stop`은 진행 중인 호스트 작업을 중단하고 워커가 완료될 때까지 기다린 다음
어댑터를 닫습니다.

## 예정된 지원 중단

일부 훅 인접 표면은 지원 중단되었지만 여전히 지원됩니다. 다음 메이저 릴리스 전에
마이그레이션하십시오.

- `inbound_claim` 및 `message_received` 핸들러의 **일반 텍스트 채널 봉투**.
  평면 봉투 텍스트를 파싱하는 대신 `BodyForAgent`와 구조화된 사용자 컨텍스트 블록을
  읽으십시오. [일반 텍스트 채널 봉투 → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations)를
  참조하십시오.
- **`before_agent_start`**는 호환성을 위해 유지됩니다. 새 Plugin은 결합된 단계를
  사용하는 대신 `before_model_resolve`와 `before_prompt_build`를 사용해야 합니다.
- **`subagent_spawning`**은 이전 Plugin과의 호환성을 위해 유지되지만,
  새 Plugin은 여기서 스레드 라우팅을 반환해서는 안 됩니다. 코어는
  `subagent_spawned`가 실행되기 전에 채널 세션 바인딩 어댑터를 통해
  `thread: true` 하위 에이전트 바인딩을 준비합니다.
- **`deactivate`**는 2026-08-16 이후까지 지원 중단된 정리 호환성 별칭으로 유지됩니다.
  새 Plugin은 `gateway_stop`을 사용해야 합니다.
- **`before_tool_call`의 `onResolution`**은 이제 자유 형식 `string` 대신 형식화된
  `PluginApprovalResolution` 유니온(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`)을 사용합니다.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`**은 최상위
  호환성 별칭으로 유지됩니다. 새 Plugin은
  `api.session.state.registerSessionExtension(...)`과
  `api.session.workflow.enqueueNextTurnInjection(...)`을 사용해야 합니다.

전체 목록(메모리 기능 등록, 제공자 추론 프로필, 외부 인증 제공자, 제공자 검색 형식,
작업 런타임 접근자 및 `command-auth` → `command-status` 이름 변경)은
[Plugin SDK 마이그레이션 → 현재 지원 중단 항목](/ko/plugins/sdk-migration#active-deprecations)을 참조하십시오.

## 관련 문서

- [Plugin SDK 마이그레이션](/ko/plugins/sdk-migration) - 현재 지원 중단 항목 및 제거 일정
- [Plugin 구축](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [내부 훅](/ko/automation/hooks)
- [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)
