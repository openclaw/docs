---
read_when:
    - before_tool_call, before_agent_reply, 메시지 훅 또는 수명 주기 훅이 필요한 Plugin을 빌드하는 경우
    - Plugin의 도구 호출을 차단하거나, 재작성하거나, 승인을 요구해야 합니다
    - 내부 후크와 Plugin 후크 중에서 선택하고 있습니다
summary: 'Plugin 훅: 에이전트, 도구, 메시지, 세션 및 Gateway 수명 주기 이벤트 가로채기'
title: Plugin 훅
x-i18n:
    generated_at: "2026-05-11T20:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook은 OpenClaw Plugin을 위한 인프로세스 확장 지점입니다. Plugin이
에이전트 실행, 도구 호출, 메시지 흐름, 세션 수명 주기, 서브에이전트 라우팅,
설치 또는 Gateway 시작을 검사하거나 변경해야 할 때 사용하세요.

`/new`, `/reset`, `/stop`, `agent:bootstrap`, `gateway:startup` 같은
명령 및 Gateway 이벤트에 대해 운영자가 설치하는 작은 `HOOK.md` 스크립트가
필요한 경우에는 대신 [internal hooks](/ko/automation/hooks)를 사용하세요.

## 빠른 시작

Plugin 엔트리에서 `api.on(...)`으로 타입이 지정된 Plugin hook을 등록합니다.

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
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook 핸들러는 내림차순 `priority`로 순차 실행됩니다. 동일한 우선순위의 hook은
등록 순서를 유지합니다.

`api.on(name, handler, opts?)`는 다음을 받습니다.

- `priority` - 핸들러 순서(높을수록 먼저 실행).
- `timeoutMs` - 선택적 hook별 예산. 설정하면 hook runner는 해당 예산이
  경과한 후 그 핸들러를 중단하고 다음 핸들러로 계속 진행합니다. 느린 설정 또는
  recall 작업이 호출자의 구성된 모델 타임아웃을 소비하게 두지 않습니다.
  생략하면 hook runner가 일반적으로 적용하는 기본 관찰/결정 타임아웃을 사용합니다.

운영자는 Plugin 코드를 패치하지 않고도 hook 예산을 설정할 수 있습니다.

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

`hooks.timeouts.<hookName>`은 `hooks.timeoutMs`를 재정의하고, 이는
Plugin 작성자가 지정한 `api.on(..., { timeoutMs })` 값을 재정의합니다. 구성된
각 값은 600000밀리초 이하의 양의 정수여야 합니다. 느린 것으로 알려진 hook에는
hook별 재정의를 선호해, 하나의 Plugin이 모든 곳에서 더 긴 예산을 받지 않도록 하세요.

각 hook은 해당 핸들러를 등록한 Plugin의 해석된 구성인
`event.context.pluginConfig`를 받습니다. 현재 Plugin 옵션이 필요한 hook 결정에
사용하세요. OpenClaw는 다른 Plugin이 보는 공유 이벤트 객체를 변경하지 않고
핸들러별로 이를 주입합니다.

## Hook 카탈로그

Hook은 확장하는 표면별로 그룹화됩니다. **굵게 표시된** 이름은 결정 결과
(차단, 취소, 재정의 또는 승인 요구)를 받을 수 있으며, 다른 모든 항목은
관찰 전용입니다.

**에이전트 턴**

- `before_model_resolve` - 세션 메시지가 로드되기 전에 provider 또는 모델 재정의
- `agent_turn_prepare` - 대기열에 있는 Plugin 턴 주입을 소비하고 prompt hook 전에 동일 턴 컨텍스트 추가
- `before_prompt_build` - 모델 호출 전에 동적 컨텍스트 또는 시스템 프롬프트 텍스트 추가
- `before_agent_start` - 호환성 전용 결합 단계. 위의 두 hook을 선호하세요
- **`before_agent_run`** - 모델 제출 전에 최종 프롬프트와 세션 메시지를 검사하고 선택적으로 실행 차단
- **`before_agent_reply`** - 합성 응답 또는 무응답으로 모델 턴 단락
- **`before_agent_finalize`** - 자연스러운 최종 답변을 검사하고 모델 패스를 한 번 더 요청
- `agent_end` - 최종 메시지, 성공 상태, 실행 시간 관찰
- `heartbeat_prompt_contribution` - 백그라운드 모니터 및 수명 주기 Plugin을 위한 heartbeat 전용 컨텍스트 추가

**대화 관찰**

- `model_call_started` / `model_call_ended` - 프롬프트 또는 응답 내용 없이 정제된 provider/모델 호출 메타데이터, 타이밍, 결과, 제한된 요청 ID 해시 관찰
- `llm_input` - provider 입력(시스템 프롬프트, 프롬프트, 기록) 관찰
- `llm_output` - provider 출력 관찰

**도구**

- **`before_tool_call`** - 도구 매개변수 재작성, 실행 차단 또는 승인 요구
- `after_tool_call` - 도구 결과, 오류, 실행 시간 관찰
- **`tool_result_persist`** - 도구 결과에서 생성된 assistant 메시지 재작성
- **`before_message_write`** - 진행 중인 메시지 쓰기 검사 또는 차단(드묾)

**메시지 및 전달**

- **`inbound_claim`** - 에이전트 라우팅 전에 인바운드 메시지 클레임(합성 응답)
- `message_received` - 인바운드 콘텐츠, 발신자, 스레드, 메타데이터 관찰
- **`message_sending`** - 아웃바운드 콘텐츠 재작성 또는 전달 취소
- `message_sent` - 아웃바운드 전달 성공 또는 실패 관찰
- **`before_dispatch`** - 채널 인계 전에 아웃바운드 디스패치 검사 또는 재작성
- **`reply_dispatch`** - 최종 응답 디스패치 파이프라인에 참여

**세션 및 Compaction**

- `session_start` / `session_end` - 세션 수명 주기 경계 추적. 이벤트의 `reason`은 `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, `unknown` 중 하나입니다. `shutdown` 및 `restart` 값은 세션이 아직 활성 상태인 동안 프로세스가 중지되거나 다시 시작될 때 Gateway 종료 finalizer에서 발생하므로, 메모리 또는 transcript 저장소 같은 다운스트림 Plugin은 재시작을 거치며 열린 상태로 남을 ghost row를 마무리할 수 있습니다. finalizer는 제한되어 있어 느린 Plugin이 SIGTERM/SIGINT를 차단할 수 없습니다.
- `before_compaction` / `after_compaction` - Compaction 주기 관찰 또는 주석 추가
- `before_reset` - 세션 재설정 이벤트(`/reset`, 프로그래밍 방식 재설정) 관찰

**서브에이전트**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 서브에이전트 라우팅 및 완료 전달 조정

**수명 주기**

- `gateway_start` / `gateway_stop` - Gateway와 함께 Plugin 소유 서비스 시작 또는 중지
- `cron_changed` - Gateway 소유 Cron 수명 주기 변경(추가됨, 업데이트됨, 제거됨, 시작됨, 완료됨, 예약됨) 관찰
- **`before_install`** - skill 또는 Plugin 설치 스캔 검사 및 선택적 차단

## 도구 호출 정책

`before_tool_call`은 다음을 받습니다.

- `event.toolName`
- `event.params`
- 선택적 `event.derivedPaths`: `apply_patch` 같은 잘 알려진 도구 envelope에 대해
  호스트에서 최선 노력으로 파생한 대상 경로 힌트를 포함합니다. 있는 경우 이러한
  경로는 불완전할 수 있거나 도구가 실제로 건드릴 항목을 과대 근사할 수 있습니다
  (예: 잘못되었거나 부분적인 입력).
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`,
  `ctx.jobId`(Cron 기반 실행에서 설정), 진단용 `ctx.trace` 같은 컨텍스트 필드

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
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

규칙:

- `block: true`는 종료 결정이며 낮은 우선순위 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 처리됩니다.
- `params`는 실행할 도구 매개변수를 재작성합니다.
- `requireApproval`은 에이전트 실행을 일시 중지하고 Plugin 승인을 통해 사용자에게 묻습니다.
  `/approve` 명령은 exec 승인과 Plugin 승인을 모두 승인할 수 있습니다.
- 높은 우선순위 hook이 승인을 요청한 후에도 낮은 우선순위의 `block: true`가 여전히 차단할 수 있습니다.
- `onResolution`은 해석된 승인 결정인 `allow-once`, `allow-always`,
  `deny`, `timeout`, `cancelled`를 받습니다.

호스트 수준 정책이 필요한 번들 Plugin은 `api.registerTrustedToolPolicy(...)`로
신뢰할 수 있는 도구 정책을 등록할 수 있습니다. 이는 일반 `before_tool_call` hook 및
외부 Plugin 결정 전에 실행됩니다. 워크스페이스 정책, 예산 집행, 예약된 workflow
안전 같은 호스트 신뢰 게이트에만 사용하세요. 외부 Plugin은 일반
`before_tool_call` hook을 사용해야 합니다.

### 도구 결과 지속성

도구 결과에는 UI 렌더링, 진단, 미디어 라우팅 또는 Plugin 소유 메타데이터를 위한
구조화된 `details`가 포함될 수 있습니다. `details`를 프롬프트 콘텐츠가 아닌
런타임 메타데이터로 취급하세요.

- OpenClaw는 provider replay 및 Compaction 입력 전에 `toolResult.details`를 제거해
  메타데이터가 모델 컨텍스트가 되지 않도록 합니다.
- 지속된 세션 항목은 제한된 `details`만 유지합니다. 너무 큰 details는 간결한 요약과
  `persistedDetailsTruncated: true`로 대체됩니다.
- `tool_result_persist` 및 `before_message_write`는 최종 지속성 한도 전에 실행됩니다.
  그래도 hook은 반환되는 `details`를 작게 유지하고, 프롬프트 관련 텍스트를
  `details`에만 넣지 않아야 합니다. 모델에 보이는 도구 출력은 `content`에 넣으세요.

## 프롬프트 및 모델 hook

새 Plugin에는 단계별 hook을 사용하세요.

- `before_model_resolve`: 현재 프롬프트와 attachment 메타데이터만 받습니다.
  `providerOverride` 또는 `modelOverride`를 반환합니다.
- `agent_turn_prepare`: 현재 프롬프트, 준비된 세션 메시지, 이 세션을 위해 배출된
  정확히 한 번만 적용되는 대기열 주입을 받습니다. `prependContext` 또는
  `appendContext`를 반환합니다.
- `before_prompt_build`: 현재 프롬프트와 세션 메시지를 받습니다.
  `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext`,
  `appendSystemContext`를 반환합니다.
- `heartbeat_prompt_contribution`: heartbeat 턴에만 실행되며 `prependContext` 또는
  `appendContext`를 반환합니다. 사용자 시작 턴을 변경하지 않고 현재 상태를 요약해야 하는
  백그라운드 모니터를 위한 것입니다.

`before_agent_start`는 호환성을 위해 남아 있습니다. Plugin이 레거시 결합 단계에
의존하지 않도록 위의 명시적 hook을 선호하세요.

`before_agent_run`은 프롬프트 구성 후, 그리고 프롬프트 로컬 이미지 로딩 및
`llm_input` 관찰을 포함한 모든 모델 입력 전에 실행됩니다. 현재 사용자 입력을
`prompt`로 받고, 로드된 세션 기록을 `messages`로, 활성 시스템 프롬프트를 받습니다.
모델이 프롬프트를 읽기 전에 실행을 중지하려면 `{ outcome: "block", reason, message? }`를
반환하세요. `reason`은 내부용이고 `message`는 사용자에게 표시되는 대체 메시지입니다.
지원되는 결과는 `pass`와 `block`뿐이며, 지원되지 않는 결정 형태는 닫힌 상태로 실패합니다.

실행이 차단되면 OpenClaw는 `message.content`에 대체 텍스트만 저장하고, 차단한 Plugin
ID 및 타임스탬프 같은 민감하지 않은 차단 메타데이터를 함께 저장합니다. 원래 사용자
텍스트는 transcript나 future context에 보존되지 않습니다. 내부 차단 이유는 민감한
것으로 취급되어 transcript, history, broadcast, log, diagnostics payload에서 제외됩니다.
관측성에는 blocker id, outcome, timestamp 또는 안전한 category 같은 정제된 필드를
사용해야 합니다.

`before_agent_start` 및 `agent_end`는 OpenClaw가 활성 실행을 식별할 수 있을 때
`event.runId`를 포함합니다. 같은 값은 `ctx.runId`에서도 사용할 수 있습니다.
Cron 기반 실행은 `ctx.jobId`(원본 Cron 작업 ID)도 노출하므로 Plugin hook은 metrics,
side effect 또는 state를 특정 예약 작업으로 범위 지정할 수 있습니다.

채널에서 시작된 실행의 경우 `ctx.messageProvider`는 `discord` 또는 `telegram` 같은
provider 표면이고, `ctx.channelId`는 OpenClaw가 세션 키 또는 전달 메타데이터에서
파생할 수 있을 때의 대화 대상 식별자입니다.

`agent_end`는 관찰 hook이며 턴 이후 fire-and-forget 방식으로 실행됩니다. hook runner는
멈춘 Plugin 또는 embedding endpoint가 hook promise를 영원히 pending 상태로 두지 못하도록
30초 타임아웃을 적용합니다. 타임아웃은 로그로 남고 OpenClaw는 계속 진행합니다. Plugin도
자체 abort signal을 사용하지 않는 한 Plugin 소유 네트워크 작업은 취소하지 않습니다.

원시 프롬프트, 기록, 응답, 헤더, 요청 본문 또는 provider 요청 ID를 받아서는 안 되는 provider 호출 텔레메트리에는 `model_call_started`와 `model_call_ended`를 사용하세요. 이러한 훅에는 `runId`, `callId`, `provider`, `model`, 선택적 `api`/`transport`, 종료 시점의 `durationMs`/`outcome`, 그리고 OpenClaw가 제한된 provider 요청 ID 해시를 도출할 수 있을 때의 `upstreamRequestIdHash` 같은 안정적인 메타데이터가 포함됩니다.

`before_agent_finalize`는 하네스가 자연스러운 최종 어시스턴트 답변을 수락하려는 경우에만 실행됩니다. 이는 `/stop` 취소 경로가 아니며 사용자가 턴을 중단할 때 실행되지 않습니다. 마무리 전에 하네스에 모델 패스를 한 번 더 요청하려면 `{ action: "revise", reason }`를 반환하고, 마무리를 강제하려면 `{ action:
"finalize", reason? }`를 반환하거나, 계속하려면 결과를 생략하세요. Codex 네이티브 `Stop` 훅은 OpenClaw `before_agent_finalize` 결정으로 전달됩니다.

`action: "revise"`를 반환할 때 plugins는 추가 모델 패스가 제한되고 재생에 안전하도록 `retry` 메타데이터를 포함할 수 있습니다.

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`은 하네스에 전송되는 수정 사유에 추가됩니다. `idempotencyKey`를 사용하면 호스트가 동등한 마무리 결정 전반에서 같은 Plugin 요청의 재시도 횟수를 셀 수 있고, `maxAttempts`는 호스트가 자연스러운 최종 답변으로 계속 진행하기 전에 허용할 추가 패스 수를 제한합니다.

원시 대화 훅(`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` 또는 `before_agent_run`)이 필요한 비번들 plugins는 다음을 설정해야 합니다.

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

프롬프트를 변경하는 훅과 지속되는 다음 턴 주입은 Plugin별로 `plugins.entries.<id>.hooks.allowPromptInjection=false`를 사용해 비활성화할 수 있습니다.

### 세션 확장과 다음 턴 주입

워크플로 plugins는 `api.registerSessionExtension(...)`으로 작은 JSON 호환 세션 상태를 유지하고 Gateway `sessions.pluginPatch` 메서드를 통해 업데이트할 수 있습니다. 세션 행은 등록된 확장 상태를 `pluginExtensions`를 통해 투영하여 Control UI와 다른 클라이언트가 Plugin 내부를 알지 않고도 Plugin 소유 상태를 렌더링할 수 있게 합니다.

Plugin이 다음 모델 턴에 정확히 한 번 도달해야 하는 지속 컨텍스트가 필요할 때는 `api.enqueueNextTurnInjection(...)`을 사용하세요. OpenClaw는 프롬프트 훅 전에 대기 중인 주입을 배출하고, 만료된 주입을 삭제하며, Plugin별 `idempotencyKey`로 중복 제거합니다. 이는 승인 재개, 정책 요약, 백그라운드 모니터 델타, 다음 턴의 모델에 표시되어야 하지만 영구 시스템 프롬프트 텍스트가 되어서는 안 되는 명령 계속 실행에 적합한 접점입니다.

정리 의미 체계는 계약의 일부입니다. 세션 확장 정리와 런타임 수명 주기 정리 콜백은 `reset`, `delete`, `disable` 또는 `restart`를 받습니다. 호스트는 reset/delete/disable에 대해 소유 Plugin의 영구 세션 확장 상태와 보류 중인 다음 턴 주입을 제거합니다. restart는 지속 세션 상태를 유지하며, 정리 콜백을 통해 plugins가 이전 런타임 세대의 스케줄러 작업, 실행 컨텍스트 및 기타 대역 외 리소스를 해제할 수 있게 합니다.

## 메시지 훅

채널 수준 라우팅 및 전달 정책에는 메시지 훅을 사용하세요.

- `message_received`: 인바운드 콘텐츠, 발신자, `threadId`, `messageId`,
  `senderId`, 선택적 실행/세션 상관관계 및 메타데이터를 관찰합니다.
- `message_sending`: `content`를 다시 쓰거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 답변의 경우 채널 페이로드에 표시되는 텍스트/캡션이 없더라도 `content`에 숨겨진 음성 전사문이 포함될 수 있습니다. 해당 `content`를 다시 쓰면 훅에 표시되는 전사문만 업데이트됩니다. 이는 미디어 캡션으로 렌더링되지 않습니다.

메시지 훅 컨텍스트는 사용 가능한 경우 안정적인 상관관계 필드를 노출합니다. `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`. 레거시 메타데이터를 읽기 전에 이러한 일급 필드를 우선 사용하세요.

채널별 메타데이터를 사용하기 전에 형식화된 `threadId`와 `replyToId` 필드를 우선 사용하세요.

결정 규칙:

- `cancel: true`가 있는 `message_sending`은 최종입니다.
- `cancel: false`가 있는 `message_sending`은 결정 없음으로 처리됩니다.
- 다시 작성된 `content`는 이후 훅이 전달을 취소하지 않는 한 더 낮은 우선순위의 훅으로 계속 전달됩니다.
- `message_sending`은 취소와 함께 `cancelReason`과 제한된 `metadata`를 반환할 수 있습니다. 새 메시지 수명 주기 API는 이를 `cancelled_by_message_sending_hook` 사유가 있는 억제된 전달 결과로 노출합니다. 레거시 직접 전달은 호환성을 위해 빈 결과 배열을 계속 반환합니다.
- `message_sent`는 관찰 전용입니다. 핸들러 실패는 기록되며 전달 결과를 변경하지 않습니다.

## 설치 훅

`before_install`은 skill 및 Plugin 설치를 위한 기본 제공 스캔 이후 실행됩니다. 설치를 중지하려면 추가 발견 사항 또는 `{ block: true, blockReason }`을 반환하세요.

`block: true`는 최종입니다. `block: false`는 결정 없음으로 처리됩니다.

## Gateway 수명 주기

Gateway 소유 상태가 필요한 Plugin 서비스에는 `gateway_start`를 사용하세요. 컨텍스트는 cron 검사 및 업데이트를 위해 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 노출합니다. 오래 실행되는 리소스를 정리하려면 `gateway_stop`을 사용하세요.

Plugin 소유 런타임 서비스에 내부 `gateway:startup` 훅에 의존하지 마세요.

`cron_changed`는 `added`, `updated`, `removed`, `started`, `finished`, `scheduled` 사유를 포함하는 형식화된 이벤트 페이로드와 함께 Gateway 소유 cron 수명 주기 이벤트에 대해 발생합니다. 이벤트는 `PluginHookGatewayCronJob` 스냅샷(`state.nextRunAtMs`, `state.lastRunStatus`, 존재하는 경우 `state.lastError` 포함)과 `not-requested` | `delivered` | `not-delivered` | `unknown`의 `PluginHookGatewayCronDeliveryStatus`를 전달합니다. 제거된 이벤트도 삭제된 작업 스냅샷을 계속 전달하므로 외부 스케줄러가 상태를 조정할 수 있습니다. 외부 깨우기 스케줄러를 동기화할 때는 런타임 컨텍스트의 `ctx.getCron?.()`과 `ctx.config`를 사용하고, 기한 확인과 실행의 진실 공급원은 OpenClaw로 유지하세요.

## 예정된 지원 중단

몇 가지 훅 인접 표면은 지원 중단되었지만 여전히 지원됩니다. 다음 주요 릴리스 전에 마이그레이션하세요.

- `inbound_claim` 및 `message_received` 핸들러의 **평문 채널 봉투**. 평면 봉투 텍스트를 파싱하는 대신 `BodyForAgent`와 구조화된 사용자 컨텍스트 블록을 읽으세요. [평문 채널 봉투 → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations)를 참조하세요.
- **`before_agent_start`**는 호환성을 위해 유지됩니다. 새 plugins는 결합된 단계 대신 `before_model_resolve`와 `before_prompt_build`를 사용해야 합니다.
- **`before_tool_call`의 `onResolution`**은 이제 자유 형식 `string` 대신 형식화된 `PluginApprovalResolution` 유니언(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`)을 사용합니다.

전체 목록(메모리 기능 등록, provider thinking 프로필, 외부 인증 제공자, provider 발견 타입, 작업 런타임 접근자, `command-auth` → `command-status` 이름 변경)은 [Plugin SDK 마이그레이션 → 활성 지원 중단](/ko/plugins/sdk-migration#active-deprecations)을 참조하세요.

## 관련 항목

- [Plugin SDK 마이그레이션](/ko/plugins/sdk-migration) - 활성 지원 중단 및 제거 일정
- [plugins 빌드](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [내부 훅](/ko/automation/hooks)
- [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)
