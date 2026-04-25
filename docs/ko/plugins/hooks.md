---
read_when:
    - '`before_tool_call`, `before_agent_reply`, 메시지 훅 또는 수명 주기 훅이 필요한 Plugin을 빌드하고 있음'
    - Plugin에서 도구 호출을 차단, 재작성 또는 승인 요구해야 함
    - 내부 훅과 Plugin 훅 중에서 결정 중임
summary: 'Plugin 훅: agent, 도구, 메시지, session 및 Gateway 수명 주기 이벤트를 가로챕니다'
title: Plugin 훅
x-i18n:
    generated_at: "2026-04-25T18:20:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin 훅은 OpenClaw plugin을 위한 인프로세스 확장 지점입니다. plugin이
agent 실행, 도구 호출, 메시지 흐름,
session 수명 주기, subagent 라우팅, 설치 또는 Gateway 시작을 검사하거나 변경해야 할 때 사용하세요.

`/new`, `/reset`, `/stop`, `agent:bootstrap`, 또는
`gateway:startup` 같은 명령 및 Gateway 이벤트용으로 작은
운영자 설치형 `HOOK.md` 스크립트를 원한다면 대신 [internal hooks](/ko/automation/hooks)를 사용하세요.

## 빠른 시작

plugin 엔트리에서 `api.on(...)`으로 타입 지정된 plugin 훅을 등록하세요:

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
            title: "웹 검색 실행",
            description: `검색 쿼리를 허용할까요: ${String(event.params.query ?? "")}`,
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

훅 핸들러는 `priority` 내림차순으로 순차 실행됩니다. 같은 우선순위의 훅은
등록 순서를 유지합니다.

## 훅 카탈로그

훅은 확장하는 표면별로 그룹화되어 있습니다. **굵게 표시된** 이름은
결정 결과(차단, 취소, override 또는 승인 요구)를 받을 수 있으며, 나머지는 모두
관찰 전용입니다.

**Agent 턴**

- `before_model_resolve` — session 메시지를 로드하기 전에 provider 또는 model을 override
- `before_prompt_build` — model 호출 전에 동적 컨텍스트 또는 system-prompt 텍스트 추가
- `before_agent_start` — 호환성 전용 결합 단계이며, 위의 두 훅을 우선 사용
- **`before_agent_reply`** — 합성 응답 또는 무응답으로 model 턴을 단락 처리
- `agent_end` — 최종 메시지, 성공 상태 및 실행 시간 관찰

**대화 관찰**

- `model_call_started` / `model_call_ended` — 프롬프트나 응답 내용 없이 정제된 provider/model 호출 메타데이터, 타이밍, 결과 및 제한된 request-id 해시 관찰
- `llm_input` — provider 입력(system prompt, prompt, history) 관찰
- `llm_output` — provider 출력 관찰

**도구**

- **`before_tool_call`** — 도구 파라미터 재작성, 실행 차단 또는 승인 요구
- `after_tool_call` — 도구 결과, 오류 및 실행 시간 관찰
- **`tool_result_persist`** — 도구 결과에서 생성된 assistant 메시지 재작성
- **`before_message_write`** — 진행 중인 메시지 쓰기를 검사하거나 차단(드묾)

**메시지 및 전송**

- **`inbound_claim`** — agent 라우팅 전에 인바운드 메시지 선점(합성 응답)
- `message_received` — 인바운드 내용, 발신자, 스레드 및 메타데이터 관찰
- **`message_sending`** — 아웃바운드 내용 재작성 또는 전송 취소
- `message_sent` — 아웃바운드 전송 성공 또는 실패 관찰
- **`before_dispatch`** — 채널 handoff 전 아웃바운드 dispatch 검사 또는 재작성
- **`reply_dispatch`** — 최종 응답 dispatch 파이프라인에 참여

**Sessions 및 Compaction**

- `session_start` / `session_end` — session 수명 주기 경계 추적
- `before_compaction` / `after_compaction` — Compaction 주기 관찰 또는 주석 추가
- `before_reset` — session 재설정 이벤트(`/reset`, 프로그래밍 방식 재설정) 관찰

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — subagent 라우팅 및 완료 전송 조정

**수명 주기**

- `gateway_start` / `gateway_stop` — Gateway와 함께 plugin 소유 서비스를 시작 또는 중지
- **`before_install`** — Skill 또는 plugin 설치 스캔을 검사하고 선택적으로 차단

## 도구 호출 정책

`before_tool_call`은 다음을 받습니다:

- `event.toolName`
- `event.params`
- 선택적 `event.runId`
- 선택적 `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` 및
  진단용 `ctx.trace` 같은 컨텍스트 필드

다음을 반환할 수 있습니다:

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

- `block: true`는 최종 결정이며 더 낮은 우선순위 핸들러를 건너뜁니다.
- `block: false`는 결정 없음으로 처리됩니다.
- `params`는 실행을 위한 도구 파라미터를 재작성합니다.
- `requireApproval`은 agent 실행을 일시 중지하고 plugin
  승인을 통해 사용자에게 묻습니다. `/approve` 명령은 exec 승인과 plugin 승인을 모두 승인할 수 있습니다.
- 더 낮은 우선순위의 `block: true`는 더 높은 우선순위 훅이
  승인을 요청한 후에도 여전히 차단할 수 있습니다.
- `onResolution`은 해결된 승인 결정인 `allow-once`,
  `allow-always`, `deny`, `timeout` 또는 `cancelled`를 받습니다.

## 프롬프트 및 model 훅

새 plugin에는 단계별 훅을 사용하세요:

- `before_model_resolve`: 현재 프롬프트와 첨부파일
  메타데이터만 받습니다. `providerOverride` 또는 `modelOverride`를 반환하세요.
- `before_prompt_build`: 현재 프롬프트와 session 메시지를 받습니다.
  `prependContext`, `systemPrompt`, `prependSystemContext` 또는
  `appendSystemContext`를 반환하세요.

`before_agent_start`는 호환성을 위해 유지됩니다. 명시적인 위 훅을 우선 사용해
plugin이 레거시 결합 단계에 의존하지 않도록 하세요.

`before_agent_start`와 `agent_end`는 OpenClaw가 활성 실행을 식별할 수 있을 때
`event.runId`를 포함합니다. 같은 값은 `ctx.runId`에서도 사용할 수 있습니다.

원시 프롬프트, history, 응답, 헤더, 요청
본문 또는 provider 요청 ID를 받지 않아야 하는 provider 호출 텔레메트리에는 `model_call_started`와 `model_call_ended`를 사용하세요. 이러한 훅에는
`runId`, `callId`, `provider`, `model`, 선택적 `api`/`transport`,
최종 `durationMs`/`outcome`, 그리고 OpenClaw가 제한된 provider request-id 해시를
도출할 수 있을 때의 `upstreamRequestIdHash` 같은 안정적인 메타데이터가 포함됩니다.

번들되지 않은 plugin이 `llm_input`, `llm_output` 또는 `agent_end`를 필요로 하면 다음을 설정해야 합니다:

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

프롬프트를 변경하는 훅은 plugin별로
`plugins.entries.<id>.hooks.allowPromptInjection=false`로 비활성화할 수 있습니다.

## 메시지 훅

채널 수준 라우팅 및 전송 정책에는 메시지 훅을 사용하세요:

- `message_received`: 인바운드 내용, 발신자, `threadId`, `messageId`,
  `senderId`, 선택적 실행/session 상관관계 및 메타데이터를 관찰합니다.
- `message_sending`: `content`를 재작성하거나 `{ cancel: true }`를 반환합니다.
- `message_sent`: 최종 성공 또는 실패를 관찰합니다.

오디오 전용 TTS 응답의 경우, 채널 payload에 보이는 텍스트/캡션이 없더라도
`content`에 숨겨진 음성 변환 전사문이 포함될 수 있습니다. 이 `content`를 재작성하면
훅에서 보이는 전사문만 업데이트되며, 미디어 캡션으로 렌더링되지는 않습니다.

메시지 훅 컨텍스트는 가능할 때 안정적인 상관관계 필드를 노출합니다:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`. 레거시 메타데이터를 읽기 전에
이 일급 필드들을 우선 사용하세요.

채널별 메타데이터를 사용하기 전에 타입 지정된 `threadId` 및 `replyToId`를 우선 사용하세요.

결정 규칙:

- `message_sending`에서 `cancel: true`는 최종 결정입니다.
- `message_sending`에서 `cancel: false`는 결정 없음으로 처리됩니다.
- 재작성된 `content`는 이후 훅이 전송을 취소하지 않는 한
  더 낮은 우선순위 훅으로 계속 전달됩니다.

## 설치 훅

`before_install`은 Skill 및 plugin 설치에 대한 내장 스캔 후에 실행됩니다.
설치를 중지하려면 추가 finding 또는 `{ block: true, blockReason }`를 반환하세요.

`block: true`는 최종 결정입니다. `block: false`는 결정 없음으로 처리됩니다.

## Gateway 수명 주기

Gateway 소유 상태가 필요한 plugin 서비스에는 `gateway_start`를 사용하세요. 이
컨텍스트는 Cron 검사 및 업데이트를 위한 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 노출합니다.
장기 실행 리소스를 정리하려면 `gateway_stop`을 사용하세요.

plugin 소유 런타임 서비스에 내부 `gateway:startup` 훅에 의존하지 마세요.

## 예정된 사용 중단

훅 인접 표면 몇 가지는 사용 중단되었지만 여전히 지원됩니다. 다음 주요 릴리스 전에
마이그레이션하세요:

- `inbound_claim` 및 `message_received`
  핸들러의 **일반 텍스트 채널 envelope**. 평면 envelope 텍스트를 파싱하는 대신
  `BodyForAgent` 및 구조화된 user-context 블록을 읽으세요. 자세한 내용은
  [일반 텍스트 채널 envelope → BodyForAgent](/ko/plugins/sdk-migration#active-deprecations)를 참조하세요.
- **`before_agent_start`**는 호환성을 위해 유지됩니다. 새 plugin은
  결합 단계 대신 `before_model_resolve`와 `before_prompt_build`를 사용해야 합니다.
- **`before_tool_call`의 `onResolution`**는 이제 자유 형식 `string` 대신
  타입 지정된 `PluginApprovalResolution` 유니온(`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`)을 사용합니다.

전체 목록 — memory capability 등록, provider thinking
profile, 외부 auth provider, provider discovery types, task runtime
accessor 및 `command-auth` → `command-status` 이름 변경 — 은
[Plugin SDK migration → 활성 사용 중단 항목](/ko/plugins/sdk-migration#active-deprecations)을 참조하세요.

## 관련

- [Plugin SDK migration](/ko/plugins/sdk-migration) — 활성 사용 중단 항목 및 제거 일정
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 엔트리 포인트](/ko/plugins/sdk-entrypoints)
- [Internal hooks](/ko/automation/hooks)
- [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)
