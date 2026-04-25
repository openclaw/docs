---
read_when:
    - '`before_tool_call`, `before_agent_reply`, 메시지 hook 또는 lifecycle hook이 필요한 Plugin을 빌드 중입니다'
    - Plugin에서 도구 호출을 차단, 재작성 또는 승인 요구해야 하는 경우
    - 내부 hook과 Plugin hook 중 무엇을 사용할지 결정 중입니다
summary: 'Plugin hook: 에이전트, 도구, 메시지, 세션 및 Gateway lifecycle 이벤트 가로채기'
title: Plugin hook
x-i18n:
    generated_at: "2026-04-25T06:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hook은 OpenClaw Plugin을 위한 프로세스 내 확장 지점입니다. Plugin이 에이전트 실행, 도구 호출, 메시지 흐름,
세션 lifecycle, 서브에이전트 라우팅, 설치 또는 Gateway 시작을 검사하거나 변경해야 할 때 사용하세요.

`/new`, `/reset`, `/stop`, `agent:bootstrap`, `gateway:startup` 같은 명령 및 Gateway 이벤트에 대해 작은
운영자 설치형 `HOOK.md` 스크립트가 필요한 경우에는 대신 [internal hooks](/ko/automation/hooks)를 사용하세요.

## 빠른 시작

Plugin 엔트리에서 `api.on(...)`으로 타입이 지정된 Plugin hook을 등록합니다:

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

hook 핸들러는 `priority`가 높은 순서대로 순차 실행됩니다. 같은 priority의 hook은
등록 순서를 유지합니다.

## Hook 카탈로그

hook은 확장하는 인터페이스별로 그룹화됩니다. **굵게 표시된** 항목은
결정 결과(block, cancel, override 또는 approval requirement)를 받을 수 있고, 나머지는
관찰 전용입니다.

**에이전트 턴**

- `before_model_resolve` — 세션 메시지를 로드하기 전에 provider 또는 model 재정의
- `before_prompt_build` — 모델 호출 전에 동적 컨텍스트 또는 시스템 프롬프트 텍스트 추가
- `before_agent_start` — 호환성 전용 결합 단계; 위 두 hook을 우선 사용
- **`before_agent_reply`** — 합성 응답 또는 침묵으로 모델 턴 단락
- `agent_end` — 최종 메시지, 성공 상태, 실행 시간 관찰

**대화 관찰**

- `llm_input` — provider 입력(시스템 프롬프트, prompt, 기록) 관찰
- `llm_output` — provider 출력 관찰

**도구**

- **`before_tool_call`** — 도구 매개변수 재작성, 실행 차단 또는 승인 요구
- `after_tool_call` — 도구 결과, 오류, 실행 시간 관찰
- **`tool_result_persist`** — 도구 결과에서 생성된 assistant 메시지 재작성
- **`before_message_write`** — 진행 중인 메시지 쓰기 검사 또는 차단(드문 경우)

**메시지 및 전달**

- **`inbound_claim`** — 에이전트 라우팅 전에 인바운드 메시지 claim(합성 응답)
- `message_received` — 인바운드 콘텐츠, 발신자, 스레드, 메타데이터 관찰
- **`message_sending`** — 아웃바운드 콘텐츠 재작성 또는 전달 취소
- `message_sent` — 아웃바운드 전달 성공 또는 실패 관찰
- **`before_dispatch`** — 채널 handoff 전 아웃바운드 dispatch 검사 또는 재작성
- **`reply_dispatch`** — 최종 reply-dispatch 파이프라인에 참여

**세션 및 Compaction**

- `session_start` / `session_end` — 세션 lifecycle 경계 추적
- `before_compaction` / `after_compaction` — Compaction 주기 관찰 또는 주석 추가
- `before_reset` — 세션 재설정 이벤트(`/reset`, 프로그래밍 방식 재설정) 관찰

**서브에이전트**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 서브에이전트 라우팅 및 완료 전달 조정

**Lifecycle**

- `gateway_start` / `gateway_stop` — Gateway와 함께 Plugin 소유 서비스 시작 또는 중지
- **`before_install`** — Skill 또는 Plugin 설치 스캔 검사 및 선택적 차단

## 도구 호출 정책

`before_tool_call`은 다음을 받습니다:

- `event.toolName`
- `event.params`
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, 진단용 `ctx.trace` 같은 컨텍스트 필드

다음과 같은 값을 반환할 수 있습니다:

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

- `block: true`는 최종 결정이며 더 낮은 priority 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 처리됩니다.
- `params`는 실행용 도구 매개변수를 재작성합니다.
- `requireApproval`은 에이전트 실행을 일시 중지하고 Plugin
  승인을 통해 사용자에게 묻습니다. `/approve` 명령은 exec 승인과 Plugin 승인을 모두 승인할 수 있습니다.
- 더 낮은 priority의 `block: true`는 더 높은 priority hook이
  승인을 요청한 뒤에도 여전히 차단할 수 있습니다.
- `onResolution`은 최종 승인 결정인 `allow-once`,
  `allow-always`, `deny`, `timeout`, 또는 `cancelled`를 받습니다.

## 프롬프트 및 모델 hook

새 Plugin에서는 단계별 hook을 사용하세요:

- `before_model_resolve`: 현재 prompt와 첨부 파일
  메타데이터만 받습니다. `providerOverride` 또는 `modelOverride`를 반환합니다.
- `before_prompt_build`: 현재 prompt와 세션 메시지를 받습니다.
  `prependContext`, `systemPrompt`, `prependSystemContext`, 또는
  `appendSystemContext`를 반환합니다.

`before_agent_start`는 호환성을 위해 남아 있습니다. Plugin이 레거시 결합 단계에 의존하지 않도록 위의 명시적 hook을 우선 사용하세요.

`before_agent_start`와 `agent_end`에는 OpenClaw가 활성 실행을 식별할 수 있을 때 `event.runId`가 포함됩니다. 같은 값은 `ctx.runId`에서도 사용할 수 있습니다.

번들되지 않은 Plugin이 `llm_input`, `llm_output`, 또는 `agent_end`가 필요하면 다음을 설정해야 합니다:

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

프롬프트를 변경하는 hook은
`plugins.entries.<id>.hooks.allowPromptInjection=false`로 Plugin별 비활성화가 가능합니다.

## 메시지 hook

채널 수준 라우팅 및 전달 정책에는 메시지 hook을 사용하세요:

- `message_received`: 인바운드 콘텐츠, 발신자, `threadId`, `messageId`,
  `senderId`, 선택적 run/session correlation, 메타데이터를 관찰합니다.
- `message_sending`: `content`를 재작성하거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 응답의 경우, 채널 payload에 보이는 텍스트/캡션이 없더라도
`content`에는 숨겨진 발화 transcript가 포함될 수 있습니다. 이
`content`를 재작성하면 hook에 보이는 transcript만 업데이트되며, 미디어 캡션으로 렌더링되지는 않습니다.

메시지 hook 컨텍스트는 가능할 때 안정적인 correlation 필드를 노출합니다:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`. 레거시 메타데이터를 읽기 전에
이 우선 클래스 필드를 먼저 사용하세요.

채널별 메타데이터를 사용하기 전에 타입이 지정된 `threadId`와 `replyToId`를 우선 사용하세요.

결정 규칙:

- `cancel: true`가 있는 `message_sending`은 최종 결정입니다.
- `cancel: false`가 있는 `message_sending`은 결정 없음으로 처리됩니다.
- 재작성된 `content`는 나중 hook이 전달을 취소하지 않는 한 더 낮은 priority hook으로 계속 전달됩니다.

## 설치 hook

`before_install`은 Skill 및 Plugin 설치에 대한 내장 스캔 후 실행됩니다.
추가 결과 또는 설치를 중지하는 `{ block: true, blockReason }`를 반환하세요.

`block: true`는 최종 결정입니다. `block: false`는 결정 없음으로 처리됩니다.

## Gateway lifecycle

Gateway 소유 state가 필요한 Plugin 서비스에는 `gateway_start`를 사용하세요. 컨텍스트는
cron 검사 및 업데이트를 위한 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 노출합니다. 오래 실행되는 리소스를 정리하려면 `gateway_stop`을 사용하세요.

Plugin 소유 런타임 서비스에 내부 `gateway:startup` hook을 의존하지 마세요.

## 예정된 지원 중단

일부 hook 인접 인터페이스는 지원 중단되었지만 여전히 지원됩니다. 다음 주요 릴리스 전에 마이그레이션하세요:

- **평문 채널 envelope**는 `inbound_claim` 및 `message_received`
  핸들러에서 지원 중단되었습니다. 평면 envelope 텍스트를 파싱하는 대신
  `BodyForAgent`와 구조화된 사용자 컨텍스트 블록을 읽으세요. 자세한 내용은
  [Plaintext channel envelopes → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations)를 참조하세요.
- **`before_agent_start`**는 호환성을 위해 남아 있습니다. 새 Plugin은
  결합 단계 대신 `before_model_resolve`와 `before_prompt_build`를 사용해야 합니다.
- **`before_tool_call`의 `onResolution`**는 이제 자유 형식 `string` 대신
  타입이 지정된 `PluginApprovalResolution` 유니온(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`)을 사용합니다.

메모리 capability 등록, provider thinking
profile, 외부 auth provider, provider discovery type, task runtime
accessor, `command-auth` → `command-status` rename 등 전체 목록은
[Plugin SDK migration → Active deprecations](/ko/plugins/sdk-migration#active-deprecations)를 참조하세요.

## 관련 항목

- [Plugin SDK migration](/ko/plugins/sdk-migration) — 활성 지원 중단 및 제거 일정
- [Plugin 빌드하기](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [Internal hooks](/ko/automation/hooks)
- [Plugin architecture internals](/ko/plugins/architecture-internals)
