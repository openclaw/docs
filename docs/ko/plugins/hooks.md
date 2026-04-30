---
read_when:
    - before_tool_call, before_agent_reply, 메시지 훅 또는 수명 주기 훅이 필요한 Plugin을 개발하고 있습니다
    - Plugin의 도구 호출을 차단하거나, 다시 작성하거나, 승인을 요구해야 합니다
    - 내부 후크와 Plugin 후크 중 무엇을 사용할지 결정하고 있습니다
summary: 'Plugin 후크: 에이전트, 도구, 메시지, 세션 및 Gateway 수명 주기 이벤트 가로채기'
title: Plugin 훅
x-i18n:
    generated_at: "2026-04-30T06:42:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 훅은 OpenClaw Plugin을 위한 인프로세스 확장 지점입니다. Plugin이 에이전트 실행, 도구 호출, 메시지 흐름, 세션 수명 주기, 하위 에이전트 라우팅, 설치 또는 Gateway 시작을 검사하거나 변경해야 할 때 사용하세요.

`/new`, `/reset`, `/stop`, `agent:bootstrap` 또는 `gateway:startup` 같은 명령 및 Gateway 이벤트에 대해 운영자가 설치하는 작은 `HOOK.md` 스크립트를 원하면 대신 [내부 훅](/ko/automation/hooks)을 사용하세요.

## 빠른 시작

Plugin 진입점에서 `api.on(...)`으로 형식화된 Plugin 훅을 등록합니다.

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

훅 핸들러는 내림차순 `priority`로 순차 실행됩니다. 우선순위가 같은 훅은 등록 순서를 유지합니다.

`api.on(name, handler, opts?)`는 다음을 받습니다.

- `priority` — 핸들러 순서 지정(높을수록 먼저 실행).
- `timeoutMs` — 선택적 훅별 예산입니다. 설정하면 훅 실행기는 느린 설정 또는 회상 작업이 호출자의 구성된 모델 제한 시간을 소비하게 두는 대신, 예산이 경과한 뒤 해당 핸들러를 중단하고 다음 핸들러로 계속 진행합니다. 생략하면 훅 실행기가 일반적으로 적용하는 기본 관찰/결정 제한 시간을 사용합니다.

각 훅은 해당 핸들러를 등록한 Plugin의 해석된 구성인 `event.context.pluginConfig`를 받습니다. 현재 Plugin 옵션이 필요한 훅 결정에 사용하세요. OpenClaw는 다른 Plugin이 보는 공유 이벤트 객체를 변경하지 않고 핸들러별로 이를 주입합니다.

## 훅 카탈로그

훅은 확장하는 표면별로 그룹화됩니다. **굵게** 표시된 이름은 결정 결과(차단, 취소, 재정의 또는 승인 요구)를 받을 수 있으며, 나머지는 관찰 전용입니다.

**에이전트 턴**

- `before_model_resolve` — 세션 메시지가 로드되기 전에 제공자 또는 모델 재정의
- `agent_turn_prepare` — 대기 중인 Plugin 턴 주입을 소비하고 프롬프트 훅 전에 같은 턴 컨텍스트 추가
- `before_prompt_build` — 모델 호출 전에 동적 컨텍스트 또는 시스템 프롬프트 텍스트 추가
- `before_agent_start` — 호환성 전용 결합 단계이며, 위 두 훅을 선호하세요
- **`before_agent_reply`** — 합성 응답 또는 침묵으로 모델 턴을 단락 처리
- **`before_agent_finalize`** — 자연스러운 최종 답변을 검사하고 모델 패스 한 번 더 요청
- `agent_end` — 최종 메시지, 성공 상태, 실행 시간 관찰
- `heartbeat_prompt_contribution` — 백그라운드 모니터 및 수명 주기 Plugin을 위한 Heartbeat 전용 컨텍스트 추가

**대화 관찰**

- `model_call_started` / `model_call_ended` — 프롬프트 또는 응답 콘텐츠 없이 정제된 제공자/모델 호출 메타데이터, 타이밍, 결과, 제한된 요청 ID 해시 관찰
- `llm_input` — 제공자 입력(시스템 프롬프트, 프롬프트, 기록) 관찰
- `llm_output` — 제공자 출력 관찰

**도구**

- **`before_tool_call`** — 도구 매개변수 재작성, 실행 차단 또는 승인 요구
- `after_tool_call` — 도구 결과, 오류, 실행 시간 관찰
- **`tool_result_persist`** — 도구 결과에서 생성된 어시스턴트 메시지 재작성
- **`before_message_write`** — 진행 중인 메시지 쓰기 검사 또는 차단(드묾)

**메시지 및 전달**

- **`inbound_claim`** — 에이전트 라우팅 전에 인바운드 메시지 클레임(합성 응답)
- `message_received` — 인바운드 콘텐츠, 발신자, 스레드, 메타데이터 관찰
- **`message_sending`** — 아웃바운드 콘텐츠 재작성 또는 전달 취소
- `message_sent` — 아웃바운드 전달 성공 또는 실패 관찰
- **`before_dispatch`** — 채널 인계 전에 아웃바운드 디스패치 검사 또는 재작성
- **`reply_dispatch`** — 최종 응답 디스패치 파이프라인에 참여

**세션 및 Compaction**

- `session_start` / `session_end` — 세션 수명 주기 경계 추적
- `before_compaction` / `after_compaction` — Compaction 주기 관찰 또는 주석 추가
- `before_reset` — 세션 재설정 이벤트 관찰(`/reset`, 프로그래밍 방식 재설정)

**하위 에이전트**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 하위 에이전트 라우팅 및 완료 전달 조정

**수명 주기**

- `gateway_start` / `gateway_stop` — Gateway와 함께 Plugin 소유 서비스 시작 또는 중지
- `cron_changed` — Gateway 소유 Cron 수명 주기 변경 관찰(추가됨, 업데이트됨, 제거됨, 시작됨, 완료됨, 예약됨)
- **`before_install`** — skill 또는 Plugin 설치 스캔을 검사하고 선택적으로 차단

## 도구 호출 정책

`before_tool_call`은 다음을 받습니다.

- `event.toolName`
- `event.params`
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId`(Cron 기반 실행에서 설정됨) 및 진단용 `ctx.trace` 같은 컨텍스트 필드

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

- `block: true`는 최종 결정이며 더 낮은 우선순위의 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 처리됩니다.
- `params`는 실행할 도구 매개변수를 재작성합니다.
- `requireApproval`은 에이전트 실행을 일시 중지하고 Plugin 승인을 통해 사용자에게 묻습니다. `/approve` 명령은 exec 승인과 Plugin 승인을 모두 승인할 수 있습니다.
- 더 높은 우선순위의 훅이 승인을 요청한 뒤에도 더 낮은 우선순위의 `block: true`가 여전히 차단할 수 있습니다.
- `onResolution`은 해석된 승인 결정인 `allow-once`, `allow-always`, `deny`, `timeout` 또는 `cancelled`를 받습니다.

호스트 수준 정책이 필요한 번들 Plugin은 `api.registerTrustedToolPolicy(...)`로 신뢰된 도구 정책을 등록할 수 있습니다. 이러한 정책은 일반 `before_tool_call` 훅과 외부 Plugin 결정 전에 실행됩니다. 워크스페이스 정책, 예산 적용 또는 예약된 워크플로 안전 같은 호스트 신뢰 게이트에만 사용하세요. 외부 Plugin은 일반 `before_tool_call` 훅을 사용해야 합니다.

### 도구 결과 지속성

도구 결과에는 UI 렌더링, 진단, 미디어 라우팅 또는 Plugin 소유 메타데이터를 위한 구조화된 `details`가 포함될 수 있습니다. `details`를 프롬프트 콘텐츠가 아닌 런타임 메타데이터로 취급하세요.

- OpenClaw는 제공자 재생 및 Compaction 입력 전에 `toolResult.details`를 제거하여 메타데이터가 모델 컨텍스트가 되지 않도록 합니다.
- 지속된 세션 항목은 제한된 `details`만 유지합니다. 너무 큰 details는 간결한 요약과 `persistedDetailsTruncated: true`로 대체됩니다.
- `tool_result_persist`와 `before_message_write`는 최종 지속성 한도 전에 실행됩니다. 그래도 훅은 반환된 `details`를 작게 유지해야 하며, 프롬프트 관련 텍스트를 `details`에만 두지 않아야 합니다. 모델에 보이는 도구 출력은 `content`에 넣으세요.

## 프롬프트 및 모델 훅

새 Plugin에는 단계별 훅을 사용하세요.

- `before_model_resolve`: 현재 프롬프트와 첨부 파일 메타데이터만 받습니다. `providerOverride` 또는 `modelOverride`를 반환합니다.
- `agent_turn_prepare`: 현재 프롬프트, 준비된 세션 메시지, 이 세션에 대해 비워진 정확히 한 번만 실행되는 대기 주입을 받습니다. `prependContext` 또는 `appendContext`를 반환합니다.
- `before_prompt_build`: 현재 프롬프트와 세션 메시지를 받습니다. `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` 또는 `appendSystemContext`를 반환합니다.
- `heartbeat_prompt_contribution`: Heartbeat 턴에서만 실행되며 `prependContext` 또는 `appendContext`를 반환합니다. 사용자 시작 턴을 변경하지 않고 현재 상태를 요약해야 하는 백그라운드 모니터를 위한 것입니다.

`before_agent_start`는 호환성을 위해 남아 있습니다. Plugin이 레거시 결합 단계에 의존하지 않도록 위의 명시적 훅을 선호하세요.

`before_agent_start`와 `agent_end`는 OpenClaw가 활성 실행을 식별할 수 있을 때 `event.runId`를 포함합니다. 같은 값은 `ctx.runId`에서도 사용할 수 있습니다. Cron 기반 실행은 `ctx.jobId`(원본 Cron 작업 ID)도 노출하므로 Plugin 훅은 메트릭, 부수 효과 또는 상태를 특정 예약 작업으로 범위 지정할 수 있습니다.

`agent_end`는 관찰 훅이며 턴 이후 fire-and-forget 방식으로 실행됩니다. 훅 실행기는 30초 제한 시간을 적용하여 멈춘 Plugin 또는 임베딩 엔드포인트가 훅 프라미스를 영원히 대기 상태로 남기지 못하게 합니다. 제한 시간은 로그에 기록되고 OpenClaw는 계속 진행합니다. 다만 Plugin이 자체 중단 신호도 사용하지 않는 한, Plugin 소유 네트워크 작업은 취소하지 않습니다.

원시 프롬프트, 기록, 응답, 헤더, 요청 본문 또는 제공자 요청 ID를 받아서는 안 되는 제공자 호출 텔레메트리에는 `model_call_started`와 `model_call_ended`를 사용하세요. 이 훅에는 `runId`, `callId`, `provider`, `model`, 선택적 `api`/`transport`, 최종 `durationMs`/`outcome`, 그리고 OpenClaw가 제한된 제공자 요청 ID 해시를 파생할 수 있을 때의 `upstreamRequestIdHash` 같은 안정적인 메타데이터가 포함됩니다.

`before_agent_finalize`는 하네스가 자연스러운 최종 어시스턴트 답변을 수락하려고 할 때만 실행됩니다. 이는 `/stop` 취소 경로가 아니며 사용자가 턴을 중단할 때 실행되지 않습니다. 최종화 전에 하네스에 모델 패스 한 번 더 요청하려면 `{ action: "revise", reason }`을 반환하고, 최종화를 강제하려면 `{ action: "finalize", reason? }`을 반환하거나, 계속하려면 결과를 생략하세요. Codex 기본 `Stop` 훅은 OpenClaw `before_agent_finalize` 결정으로 중계됩니다.

`llm_input`, `llm_output`, `before_agent_finalize` 또는 `agent_end`가 필요한 비번들 Plugin은 다음을 설정해야 합니다.

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

프롬프트를 변경하는 훅과 지속적인 다음 턴 주입은 `plugins.entries.<id>.hooks.allowPromptInjection=false`로 Plugin별로 비활성화할 수 있습니다.

### 세션 확장 및 다음 턴 주입

워크플로 Plugin은 `api.registerSessionExtension(...)`으로 작은 JSON 호환 세션 상태를 지속하고 Gateway `sessions.pluginPatch` 메서드로 업데이트할 수 있습니다. 세션 행은 등록된 확장 상태를 `pluginExtensions`를 통해 투영하여 Control UI와 다른 클라이언트가 Plugin 내부를 알지 않고도 Plugin 소유 상태를 렌더링할 수 있게 합니다.

Plugin이 다음 모델 턴에 정확히 한 번 도달해야 하는 지속 컨텍스트가 필요할 때는 `api.enqueueNextTurnInjection(...)`을 사용하세요. OpenClaw는 프롬프트 훅 전에 대기 중인 주입을 비우고, 만료된 주입을 버리며, Plugin별로 `idempotencyKey`를 기준으로 중복 제거합니다. 이는 승인 재개, 정책 요약, 백그라운드 모니터 델타, 그리고 다음 턴에서 모델에 보여야 하지만 영구 시스템 프롬프트 텍스트가 되어서는 안 되는 명령 계속에 적합한 확장 지점입니다.

정리 의미론은 계약의 일부입니다. 세션 확장 정리와 런타임 수명 주기 정리 콜백은 `reset`, `delete`, `disable` 또는 `restart`를 받습니다. 호스트는 reset/delete/disable에 대해 소유 Plugin의 지속 세션 확장 상태와 대기 중인 다음 턴 주입을 제거합니다. restart는 지속 세션 상태를 유지하며, 정리 콜백을 통해 Plugin이 이전 런타임 세대의 스케줄러 작업, 실행 컨텍스트, 기타 대역 외 리소스를 해제할 수 있게 합니다.

## 메시지 훅

채널 수준 라우팅 및 전달 정책에는 메시지 훅을 사용하세요.

- `message_received`: 인바운드 콘텐츠, 발신자, `threadId`, `messageId`, `senderId`, 선택적 실행/세션 상관관계, 메타데이터를 관찰합니다.
- `message_sending`: `content`를 재작성하거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 응답의 경우 채널 페이로드에 보이는 텍스트/캡션이 없더라도 `content`에 숨겨진 음성 트랜스크립트가 포함될 수 있습니다. 해당 `content`를 다시 작성하면 훅에서 보이는 트랜스크립트만 업데이트되며, 미디어 캡션으로 렌더링되지는 않습니다.

메시지 훅 컨텍스트는 사용 가능한 경우 안정적인 상관관계 필드를 노출합니다:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`. 레거시 메타데이터를 읽기 전에 이러한 일급 필드를 우선 사용하세요.

채널별 메타데이터를 사용하기 전에 타입이 지정된 `threadId` 및 `replyToId` 필드를 우선 사용하세요.

결정 규칙:

- `cancel: true`가 있는 `message_sending`은 최종입니다.
- `cancel: false`가 있는 `message_sending`은 결정 없음으로 처리됩니다.
- 다시 작성된 `content`는 이후 훅이 전달을 취소하지 않는 한 더 낮은 우선순위의 훅으로 계속 전달됩니다.

## 훅 설치

`before_install`은 Skills 및 Plugin 설치를 위한 기본 제공 스캔 후 실행됩니다.
설치를 중단하려면 추가 발견 사항 또는 `{ block: true, blockReason }`을 반환하세요.

`block: true`는 최종입니다. `block: false`는 결정 없음으로 처리됩니다.

## Gateway 수명 주기

Gateway가 소유한 상태가 필요한 Plugin 서비스에는 `gateway_start`를 사용하세요. 컨텍스트는 cron 검사 및 업데이트를 위해 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 노출합니다. 장기 실행 리소스를 정리하려면 `gateway_stop`을 사용하세요.

Plugin이 소유한 런타임 서비스에 내부 `gateway:startup` 훅을 의존하지 마세요.

`cron_changed`는 Gateway가 소유한 cron 수명 주기 이벤트에서 실행되며, `added`, `updated`, `removed`, `started`, `finished`, `scheduled` 이유를 포함하는 타입 지정 이벤트 페이로드를 제공합니다. 이벤트는 `PluginHookGatewayCronJob` 스냅샷(있는 경우 `state.nextRunAtMs`, `state.lastRunStatus`, `state.lastError` 포함)과 `not-requested` | `delivered` | `not-delivered` | `unknown` 중 하나인 `PluginHookGatewayCronDeliveryStatus`를 전달합니다. 제거된 이벤트도 삭제된 작업 스냅샷을 계속 전달하므로 외부 스케줄러가 상태를 조정할 수 있습니다. 외부 깨우기 스케줄러를 동기화할 때는 런타임 컨텍스트의 `ctx.getCron?.()` 및 `ctx.config`를 사용하고, OpenClaw를 기한 확인 및 실행의 단일 진실 공급원으로 유지하세요.

## 예정된 지원 중단

일부 훅 인접 표면은 지원 중단되었지만 아직 지원됩니다. 다음 메이저 릴리스 전에 마이그레이션하세요:

- `inbound_claim` 및 `message_received` 핸들러의 **평문 채널 엔벨로프**. 평면 엔벨로프 텍스트를 파싱하는 대신 `BodyForAgent` 및 구조화된 사용자 컨텍스트 블록을 읽으세요. [평문 채널 엔벨로프 → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations)를 참조하세요.
- **`before_agent_start`**는 호환성을 위해 유지됩니다. 새 Plugin은 결합된 단계 대신 `before_model_resolve` 및 `before_prompt_build`를 사용해야 합니다.
- **`before_tool_call`의 `onResolution`**은 이제 자유 형식 `string` 대신 타입이 지정된 `PluginApprovalResolution` 유니언(`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`)을 사용합니다.

전체 목록(메모리 기능 등록, 공급자 사고 프로필, 외부 인증 공급자, 공급자 검색 타입, 작업 런타임 접근자, `command-auth` → `command-status` 이름 변경)은 [Plugin SDK 마이그레이션 → 활성 지원 중단](/ko/plugins/sdk-migration#active-deprecations)을 참조하세요.

## 관련 항목

- [Plugin SDK 마이그레이션](/ko/plugins/sdk-migration) — 활성 지원 중단 및 제거 일정
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [내부 훅](/ko/automation/hooks)
- [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)
