---
read_when:
    - '`before_tool_call`, `before_agent_reply`, 메시지 훅 또는 라이프사이클 훅이 필요한 Plugin을 빌드하는 경우'
    - Plugin에서 도구 호출을 차단, 재작성 또는 승인 필요로 설정해야 하는 경우
    - 내부 훅과 Plugin 훅 중에서 선택하는 경우
summary: 'Plugin 훅: 에이전트, 도구, 메시지, 세션 및 Gateway 라이프사이클 이벤트 가로채기'
title: Plugin 훅
x-i18n:
    generated_at: "2026-04-26T11:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin 훅은 OpenClaw Plugins를 위한 인프로세스 확장 지점입니다. Plugin이 에이전트 실행, 도구 호출, 메시지 흐름, 세션 라이프사이클, 하위 에이전트 라우팅, 설치 또는 Gateway 시작을 검사하거나 변경해야 할 때 사용하세요.

`/new`, `/reset`, `/stop`, `agent:bootstrap`, `gateway:startup` 같은 명령 및 Gateway 이벤트에 대해 작은 운영자 설치형 `HOOK.md` 스크립트가 필요하다면 대신 [내부 훅](/ko/automation/hooks)을 사용하세요.

## 빠른 시작

Plugin 엔트리에서 `api.on(...)`으로 타입이 지정된 Plugin 훅을 등록하세요.

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

훅 핸들러는 `priority`가 높은 순서대로 순차 실행됩니다. 우선순위가 같은 훅은
등록 순서를 유지합니다.

## 훅 카탈로그

훅은 확장하는 표면에 따라 그룹화됩니다. **굵게 표시된** 이름은
결정 결과(차단, 취소, override 또는 승인 요구)를 받을 수 있고, 나머지는 모두 관찰 전용입니다.

**에이전트 턴**

- `before_model_resolve` — 세션 메시지가 로드되기 전에 provider 또는 모델을 override
- `before_prompt_build` — 모델 호출 전에 동적 컨텍스트 또는 시스템 프롬프트 텍스트 추가
- `before_agent_start` — 호환성 전용 결합 단계, 위 두 훅을 선호
- **`before_agent_reply`** — 합성 응답 또는 무응답으로 모델 턴을 단락 평가
- **`before_agent_finalize`** — 자연스러운 최종 답변을 검사하고 한 번 더 모델 패스를 요청
- `agent_end` — 최종 메시지, 성공 상태, 실행 시간 관찰

**대화 관찰**

- `model_call_started` / `model_call_ended` — 프롬프트나 응답 내용 없이 정제된 provider/모델 호출 메타데이터, 타이밍, 결과, 제한된 request-id 해시 관찰
- `llm_input` — provider 입력(시스템 프롬프트, 프롬프트, 기록) 관찰
- `llm_output` — provider 출력 관찰

**도구**

- **`before_tool_call`** — 도구 파라미터 재작성, 실행 차단, 또는 승인 요구
- `after_tool_call` — 도구 결과, 오류, 실행 시간 관찰
- **`tool_result_persist`** — 도구 결과에서 생성된 assistant 메시지 재작성
- **`before_message_write`** — 진행 중인 메시지 쓰기 검사 또는 차단(드묾)

**메시지 및 전달**

- **`inbound_claim`** — 에이전트 라우팅 전에 인바운드 메시지 claim(합성 응답)
- `message_received` — 인바운드 콘텐츠, 발신자, 스레드, 메타데이터 관찰
- **`message_sending`** — 아웃바운드 콘텐츠 재작성 또는 전달 취소
- `message_sent` — 아웃바운드 전달 성공 또는 실패 관찰
- **`before_dispatch`** — 채널 핸드오프 전에 아웃바운드 디스패치 검사 또는 재작성
- **`reply_dispatch`** — 최종 답장 디스패치 파이프라인에 참여

**세션 및 Compaction**

- `session_start` / `session_end` — 세션 라이프사이클 경계 추적
- `before_compaction` / `after_compaction` — Compaction 주기 관찰 또는 주석 추가
- `before_reset` — 세션 재설정 이벤트 관찰(`/reset`, 프로그래밍 방식 재설정)

**하위 에이전트**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 하위 에이전트 라우팅 및 완료 전달 조정

**라이프사이클**

- `gateway_start` / `gateway_stop` — Gateway와 함께 Plugin 소유 서비스 시작 또는 중지
- **`before_install`** — Skill 또는 Plugin 설치 스캔 검사 및 선택적 차단

## 도구 호출 정책

`before_tool_call`은 다음을 받습니다.

- `event.toolName`
- `event.params`
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId`(Cron 기반 실행에서 설정), 진단용 `ctx.trace` 같은 컨텍스트 필드

반환할 수 있는 값:

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

- `block: true`는 종료 결정이며 더 낮은 우선순위 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 취급됩니다.
- `params`는 실행용 도구 파라미터를 재작성합니다.
- `requireApproval`은 에이전트 실행을 일시 중지하고 Plugin
  승인을 통해 사용자에게 요청합니다. `/approve` 명령은 exec와 Plugin 승인을 모두 승인할 수 있습니다.
- 더 낮은 우선순위의 `block: true`는 더 높은 우선순위 훅이
  승인을 요청한 뒤에도 여전히 차단할 수 있습니다.
- `onResolution`은 최종 승인 결정인 `allow-once`,
  `allow-always`, `deny`, `timeout`, `cancelled`를 받습니다.

### 도구 결과 지속화

도구 결과는 UI 렌더링, 진단,
미디어 라우팅 또는 Plugin 소유 메타데이터를 위한 구조화된 `details`를 포함할 수 있습니다. `details`는 프롬프트 콘텐츠가 아니라 런타임 메타데이터로 취급하세요.

- OpenClaw는 provider 재생 및 Compaction
  입력 전에 `toolResult.details`를 제거하므로 메타데이터가 모델 컨텍스트가 되지 않습니다.
- 지속화된 세션 항목은 제한된 `details`만 유지합니다. 너무 큰 details는
  간단한 요약으로 대체되고 `persistedDetailsTruncated: true`가 설정됩니다.
- `tool_result_persist`와 `before_message_write`는 최종
  지속화 상한 전에 실행됩니다. 훅은 반환하는 `details`를 여전히 작게 유지하고,
  프롬프트 관련 텍스트를 `details`에만 두지 않도록 해야 합니다. 모델이 볼 수 있는 도구 출력은
  `content`에 넣으세요.

## 프롬프트 및 모델 훅

새 Plugins에는 단계별 훅을 사용하세요.

- `before_model_resolve`: 현재 프롬프트와 첨부파일
  메타데이터만 받습니다. `providerOverride` 또는 `modelOverride`를 반환하세요.
- `before_prompt_build`: 현재 프롬프트와 세션 메시지를
  받습니다. `prependContext`, `systemPrompt`, `prependSystemContext`, 또는
  `appendSystemContext`를 반환하세요.

`before_agent_start`는 호환성을 위해 남아 있습니다. Plugin이 레거시 결합 단계에 의존하지 않도록 위의 명시적 훅을 선호하세요.

`before_agent_start`와 `agent_end`는 OpenClaw가 활성 실행을 식별할 수 있을 때 `event.runId`를 포함합니다. 같은 값은 `ctx.runId`에서도 사용할 수 있습니다.
Cron 기반 실행은 Plugin 훅이 특정 예약
작업에 메트릭, 부작용 또는 state를 범위 지정할 수 있도록 `ctx.jobId`(원본 Cron 작업 id)도 제공합니다.

원시 프롬프트, 기록, 응답, 헤더, 요청
본문 또는 provider request ID를 받지 않아야 하는 provider 호출 텔레메트리에는 `model_call_started`와 `model_call_ended`를 사용하세요. 이 훅은
`runId`, `callId`, `provider`, `model`, 선택적 `api`/`transport`, 최종
`durationMs`/`outcome`, 그리고 OpenClaw가 계산할 수 있을 때
제한된 provider request-id 해시인 `upstreamRequestIdHash` 같은 안정적인 메타데이터를 포함합니다.

`before_agent_finalize`는 하니스가 자연스러운
최종 assistant 답변을 수락하려고 할 때만 실행됩니다. 이는 `/stop` 취소 경로가 아니며 사용자가 턴을 중단했을 때는 실행되지 않습니다. `{ action: "revise", reason }`를 반환하면
최종화 전에 하니스에 한 번 더 모델 패스를 요청하고, `{ action:
"finalize", reason? }`를 반환하면 최종화를 강제하며, 결과를 생략하면 계속 진행합니다.
Codex 네이티브 `Stop` 훅도 OpenClaw
`before_agent_finalize` 결정으로 릴레이됩니다.

번들되지 않은 Plugins가 `llm_input`, `llm_output`,
`before_agent_finalize`, 또는 `agent_end`를 사용하려면 다음을 설정해야 합니다.

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

프롬프트를 변경하는 훅은
`plugins.entries.<id>.hooks.allowPromptInjection=false`로 Plugin별 비활성화할 수 있습니다.

## 메시지 훅

채널 수준 라우팅 및 전달 정책에는 메시지 훅을 사용하세요.

- `message_received`: 인바운드 콘텐츠, 발신자, `threadId`, `messageId`,
  `senderId`, 선택적 run/session 상관관계, 메타데이터를 관찰합니다.
- `message_sending`: `content`를 재작성하거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 답장의 경우, 채널 페이로드에 보이는 텍스트/캡션이 없더라도 `content`는 숨겨진 음성 전사를 포함할 수 있습니다. 이 `content`를 재작성하면 훅에서 보이는 전사만 업데이트되며, 미디어 캡션으로 렌더링되지는 않습니다.

메시지 훅 컨텍스트는 가능할 때 안정적인 상관관계 필드를 노출합니다.
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`. 레거시 메타데이터를 읽기 전에 이 1급 필드를 먼저 사용하세요.

채널별 메타데이터를 사용하기 전에 타입이 지정된 `threadId`와 `replyToId`를 선호하세요.

결정 규칙:

- `message_sending`에서 `cancel: true`는 종료 결정입니다.
- `message_sending`에서 `cancel: false`는 결정 없음으로 취급됩니다.
- 재작성된 `content`는 이후 훅이 전달을 취소하지 않는 한 더 낮은 우선순위 훅으로 계속 전달됩니다.

## 설치 훅

`before_install`은 Skill 및 Plugin 설치를 위한 기본 제공 스캔 뒤에 실행됩니다.
추가 결과 또는 설치를 중단할 `{ block: true, blockReason }`를 반환하세요.

`block: true`는 종료 결정입니다. `block: false`는 결정 없음으로 취급됩니다.

## Gateway 라이프사이클

Gateway 소유 state가 필요한 Plugin 서비스에는 `gateway_start`를 사용하세요.
컨텍스트는 Cron 검사 및 업데이트를 위한 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 노출합니다. 장시간 실행 리소스 정리에는 `gateway_stop`을 사용하세요.

Plugin 소유 런타임 서비스에 내부 `gateway:startup` 훅을 의존하지 마세요.

## 예정된 지원 중단

훅 인접 표면 중 몇 가지는 지원 중단되었지만 여전히 지원됩니다.
다음 major 릴리스 전에 마이그레이션하세요.

- `inbound_claim` 및 `message_received`
  핸들러의 **평문 채널 envelope**. 평면 envelope 텍스트를 파싱하는 대신
  `BodyForAgent`와 구조화된 사용자 컨텍스트 블록을 읽으세요. 참조:
  [Plaintext channel envelopes → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`**는 호환성을 위해 남아 있습니다. 새 Plugins는
  결합 단계를 사용하는 대신 `before_model_resolve`와 `before_prompt_build`를 사용해야 합니다.
- `before_tool_call`의 **`onResolution`**은 이제 자유 형식 `string` 대신
  타입이 지정된 `PluginApprovalResolution` 유니온(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`)을 사용합니다.

메모리 capability 등록, provider thinking
profile, 외부 auth providers, provider discovery types, task runtime
accessors, `command-auth` → `command-status` 이름 변경을 포함한 전체 목록은
[Plugin SDK migration → Active deprecations](/ko/plugins/sdk-migration#active-deprecations)을 참조하세요.

## 관련 문서

- [Plugin SDK migration](/ko/plugins/sdk-migration) — 현재 지원 중단 항목 및 제거 일정
- [Plugins 빌드하기](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 엔트리 포인트](/ko/plugins/sdk-entrypoints)
- [내부 훅](/ko/automation/hooks)
- [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)
