---
read_when:
    - 내장된 에이전트 런타임 또는 하네스 레지스트리를 변경하고 있습니다
    - 번들된 또는 신뢰할 수 있는 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 제공자와 어떻게 관련되는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 임베디드 에이전트 실행기를 대체하는 Plugin을 위한 실험적 SDK 표면
title: 에이전트 하네스 Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness**는 준비된 OpenClaw agent 턴 하나를 실행하는 저수준 실행기입니다. model provider도 아니고, channel도 아니며, tool registry도 아닙니다.
사용자 관점의 개념 모델은 [Agent runtimes](/ko/concepts/agent-runtimes)를 참고하세요.

이 표면은 번들된 Plugin 또는 신뢰할 수 있는 네이티브 Plugin에만 사용하세요. 매개변수 타입이 의도적으로 현재 내장 runner를 그대로 반영하므로 이 계약은 아직 실험적입니다.

## harness를 사용해야 하는 경우

model 계열이 자체 네이티브 session runtime을 가지고 있고 일반 OpenClaw provider transport가 맞는 추상화가 아닐 때 agent harness를 등록하세요.

예:

- thread와 compaction을 소유하는 네이티브 coding-agent server
- 네이티브 plan/reasoning/tool event를 스트리밍해야 하는 로컬 CLI 또는 daemon
- OpenClaw session transcript에 더해 자체 resume id가 필요한 model runtime

새 LLM API를 추가하려는 목적으로만 harness를 등록하지 마세요. 일반 HTTP 또는 WebSocket model API의 경우 [provider plugin](/ko/plugins/sdk-provider-plugins)을 만드세요.

## core가 계속 소유하는 것

harness가 선택되기 전에 OpenClaw는 이미 다음을 해결했습니다.

- provider와 model
- runtime auth state
- thinking level과 context budget
- OpenClaw transcript/session file
- workspace, sandbox, tool policy
- channel reply callback과 streaming callback
- model fallback과 live model switching policy

이 분리는 의도된 것입니다. harness는 준비된 attempt를 실행합니다. provider를 선택하거나, channel delivery를 대체하거나, model을 조용히 전환하지 않습니다.

준비된 attempt에는 `params.runtimePlan`도 포함됩니다. 이는 PI와 네이티브 harness 전체에서 공유된 상태로 유지되어야 하는 runtime 결정을 위한 OpenClaw 소유 policy bundle입니다.

- provider-aware tool schema policy를 위한 `runtimePlan.tools.normalize(...)` 및
  `runtimePlan.tools.logDiagnostics(...)`
- transcript sanitization 및 tool-call repair policy를 위한 `runtimePlan.transcript.resolvePolicy(...)`
- 공유 `NO_REPLY` 및 media delivery suppression을 위한 `runtimePlan.delivery.isSilentPayload(...)`
- model fallback classification을 위한 `runtimePlan.outcome.classifyRunResult(...)`
- 해결된 provider/model/harness metadata를 위한 `runtimePlan.observability`

harness는 PI 동작과 일치해야 하는 결정에 plan을 사용할 수 있지만, 여전히 이를 host 소유 attempt state로 취급해야 합니다. 이를 변경하거나 턴 내부에서 provider/model을 전환하는 데 사용하지 마세요.

## harness 등록

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 선택 정책

OpenClaw는 provider/model 해결 후 harness를 선택합니다.

1. model 범위 runtime policy가 우선합니다.
2. provider 범위 runtime policy가 그다음입니다.
3. `auto`는 등록된 harness에 해결된 provider/model을 지원하는지 묻습니다.
4. 일치하는 등록 harness가 없으면 PI fallback이 비활성화되어 있지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin harness 실패는 run failure로 표면화됩니다. `auto` 모드에서 PI fallback은 해결된 provider/model을 지원하는 등록 Plugin harness가 없을 때만 사용됩니다. Plugin harness가 run을 claim한 뒤에는, auth/runtime semantics를 변경하거나 side effect를 중복시킬 수 있으므로 OpenClaw는 같은 턴을 PI로 replay하지 않습니다.

whole-session 및 whole-agent runtime pin은 선택에서 무시됩니다. 여기에는 오래된 session `agentHarnessId` 값, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, `OPENCLAW_AGENT_RUNTIME`이 포함됩니다. `/status`는 provider/model route에서 선택된 effective runtime을 보여줍니다.
선택된 harness가 예상과 다르면 `agents/harness` debug logging을 활성화하고 Gateway의 구조화된 `agent harness selected` record를 확인하세요. 여기에는 선택된 harness id, selection reason, runtime/fallback policy, 그리고 `auto` 모드에서는 각 Plugin candidate의 support result가 포함됩니다.

번들된 Codex Plugin은 `codex`를 harness id로 등록합니다. Core는 이를 일반적인 Plugin harness id로 취급합니다. Codex-specific alias는 공유 runtime selector가 아니라 Plugin 또는 operator config에 속합니다.

## provider와 harness 페어링

대부분의 harness는 provider도 등록해야 합니다. provider는 model ref, auth status, model metadata, `/model` selection을 OpenClaw의 나머지 부분에서 볼 수 있게 합니다. 그런 다음 harness는 `supports(...)`에서 해당 provider를 claim합니다.

번들된 Codex Plugin은 이 패턴을 따릅니다.

- 선호되는 사용자 model ref: `openai/gpt-5.5`
- compatibility ref: legacy `codex/gpt-*` ref는 계속 허용되지만, 새 config에서는 이를 일반 provider/model ref로 사용하지 않아야 합니다.
- harness id: `codex`
- auth: synthetic provider availability. Codex harness가 네이티브 Codex login/session을 소유하기 때문입니다.
- app-server request: OpenClaw는 bare model id를 Codex로 보내고 harness가 네이티브 app-server protocol과 통신하게 합니다.

Codex Plugin은 additive입니다. 공식 OpenAI provider의 일반 `openai/gpt-*` agent ref는 기본적으로 Codex harness를 선택합니다. 이전 `codex/gpt-*` ref도 compatibility를 위해 Codex provider와 harness를 계속 선택합니다.

operator setup, model prefix 예시, Codex-only config는 [Codex Harness](/ko/plugins/codex-harness)를 참고하세요.

OpenClaw는 Codex app-server `0.125.0` 이상을 요구합니다. Codex Plugin은 app-server initialize handshake를 확인하고, OpenClaw가 테스트된 protocol surface에 대해서만 실행되도록 이전 또는 버전 없는 server를 차단합니다. `0.125.0` 하한에는 Codex `0.124.0`에 들어간 네이티브 MCP hook payload support가 포함되며, OpenClaw를 더 새로운 테스트 완료 stable line에 고정합니다.

### tool-result middleware

번들된 Plugin은 manifest가 `contracts.agentToolResultMiddleware`에서 대상 runtime id를 선언할 때 `api.registerAgentToolResultMiddleware(...)`를 통해 runtime-neutral tool-result middleware를 연결할 수 있습니다. 이 신뢰된 seam은 PI 또는 Codex가 tool output을 model에 다시 공급하기 전에 실행되어야 하는 async tool-result transform을 위한 것입니다.

legacy 번들 Plugin은 Codex app-server-only middleware에 `api.registerCodexAppServerExtensionFactory(...)`를 계속 사용할 수 있지만, 새 result transform은 runtime-neutral API를 사용해야 합니다.
Pi 전용 `api.registerEmbeddedExtensionFactory(...)` hook은 제거되었습니다. Pi tool-result transform은 runtime-neutral middleware를 사용해야 합니다.

### Terminal outcome classification

자체 protocol projection을 소유하는 네이티브 harness는 완료된 턴이 visible assistant text를 생성하지 않았을 때 `openclaw/plugin-sdk/agent-harness-runtime`의 `classifyAgentHarnessTerminalOutcome(...)`을 사용할 수 있습니다. 이 helper는 OpenClaw의 fallback policy가 다른 model로 retry할지 결정할 수 있도록 `empty`, `reasoning-only`, `planning-only`를 반환합니다. prompt error, in-flight turn, 그리고 `NO_REPLY` 같은 의도적인 silent reply는 의도적으로 classification하지 않습니다.

### Native Codex harness mode

번들된 `codex` harness는 내장 OpenClaw agent 턴을 위한 네이티브 Codex mode입니다. 먼저 번들된 `codex` Plugin을 활성화하고, config가 제한적인 allowlist를 사용하는 경우 `plugins.allow`에 `codex`를 포함하세요. 네이티브 app-server config는 `openai/gpt-*`를 사용해야 합니다. OpenAI agent 턴은 기본적으로 Codex harness를 선택합니다. legacy `openai-codex/*` route는 `openclaw doctor --fix`로 repair해야 하며, legacy `codex/*` model ref는 네이티브 harness의 compatibility alias로 남아 있습니다.

이 mode가 실행되면 Codex가 네이티브 thread id, resume behavior, compaction, app-server execution을 소유합니다. OpenClaw는 여전히 chat channel, visible transcript mirror, tool policy, approval, media delivery, session selection을 소유합니다. Codex app-server path만 run을 claim할 수 있음을 증명해야 할 때는 provider/model `agentRuntime.id: "codex"`를 사용하세요. 명시적 Plugin runtime은 fail closed합니다. Codex app-server selection failure와 runtime failure는 PI로 retry되지 않습니다.

## Runtime strictness

기본적으로 OpenClaw는 `auto` provider/model runtime policy를 사용합니다. 등록된 Plugin harness는 provider/model pair를 claim할 수 있고, 일치하는 것이 없으면 PI가 턴을 처리합니다. 공식 OpenAI provider의 OpenAI agent ref는 기본적으로 Codex를 사용합니다. 누락된 harness selection이 PI로 라우팅되는 대신 실패해야 하는 경우 `agentRuntime.id: "codex"` 같은 명시적 provider/model Plugin runtime을 사용하세요. 선택된 Plugin harness failure는 항상 hard fail입니다. 이는 명시적 provider/model `agentRuntime.id: "pi"`를 막지 않습니다.

Codex-only embedded run의 경우:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

하나의 canonical model에 CLI backend를 원한다면 해당 model entry에 runtime을 두세요.

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

per-agent override는 같은 model-scoped shape를 사용합니다.

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

다음과 같은 legacy whole-agent runtime 예시는 무시됩니다.

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

명시적 Plugin runtime을 사용하면 요청된 harness가 등록되지 않았거나, 해결된 provider/model을 지원하지 않거나, 턴 side effect를 생성하기 전에 실패하는 경우 session이 일찍 실패합니다. 이는 Codex-only deployment와 Codex app-server path가 실제로 사용 중임을 증명해야 하는 live test에서 의도된 동작입니다.

이 설정은 embedded agent harness만 제어합니다. image, video, music, TTS, PDF 또는 기타 provider-specific model routing을 비활성화하지 않습니다.

## 네이티브 session과 transcript mirror

harness는 네이티브 session id, thread id 또는 daemon-side resume token을 유지할 수 있습니다. 해당 binding을 OpenClaw session과 명시적으로 연결한 상태로 유지하고, user-visible assistant/tool output을 OpenClaw transcript에 계속 mirror하세요.

OpenClaw transcript는 다음을 위한 compatibility layer로 남아 있습니다.

- channel-visible session history
- transcript search 및 indexing
- 이후 턴에서 built-in PI harness로 다시 전환
- generic `/new`, `/reset`, session deletion behavior

harness가 sidecar binding을 저장한다면 owning OpenClaw session이 reset될 때 OpenClaw가 이를 clear할 수 있도록 `reset(...)`을 구현하세요.

## tool 및 media result

Core는 OpenClaw tool list를 구성하고 이를 준비된 attempt에 전달합니다. harness가 dynamic tool call을 실행할 때 channel media를 직접 보내는 대신 harness result shape를 통해 tool result를 반환하세요.

이렇게 하면 text, image, video, music, TTS, approval, messaging-tool output이 PI-backed run과 같은 delivery path에 유지됩니다.

## 현재 제한 사항

- public import path는 generic이지만 일부 attempt/result type alias는 compatibility를 위해 여전히 `Pi` 이름을 갖고 있습니다.
- third-party harness installation은 실험적입니다. 네이티브 session runtime이 필요해질 때까지는 provider Plugin을 선호하세요.
- harness switching은 턴 간에 지원됩니다. 네이티브 tool, approval, assistant text 또는 message send가 시작된 후 턴 중간에 harness를 전환하지 마세요.

## 관련

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins)
- [Codex 하네스](/ko/plugins/codex-harness)
- [모델 제공자](/ko/concepts/model-providers)
