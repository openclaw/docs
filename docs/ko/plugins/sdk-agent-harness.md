---
read_when:
    - 내장된 에이전트 런타임 또는 하네스 레지스트리를 변경하고 있습니다
    - 번들되었거나 신뢰할 수 있는 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 제공자와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 하위 수준 임베디드 agent 실행기를 대체하는 Plugin용 실험적 SDK 표면
title: Agent harness Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**에이전트 하네스**는 준비된 OpenClaw 에이전트 턴 하나를 실행하는 저수준 실행기입니다. 이는 모델 제공자가 아니고, 채널도 아니며, 도구 레지스트리도 아닙니다.
사용자 대상 멘탈 모델은 [Agent runtimes](/ko/concepts/agent-runtimes)를 참고하세요.

이 표면은 번들되었거나 신뢰할 수 있는 네이티브 Plugin에만 사용하세요. 이 계약은
매개변수 타입이 의도적으로 현재 내장 러너를 반영하기 때문에 여전히 실험적입니다.

## 하네스를 사용해야 하는 경우

모델 계열에 자체 네이티브 세션
런타임이 있고 일반적인 OpenClaw 제공자 전송이 잘못된 추상화일 때 에이전트 하네스를 등록하세요.

예시:

- 스레드와 Compaction을 직접 관리하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/도구 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw
  세션 transcript 외에 자체 resume id가 필요한 모델 런타임

새 LLM API를 추가하기 위해 하네스를 등록해서는 **안 됩니다**. 일반적인 HTTP 또는
WebSocket 모델 API의 경우 [provider plugin](/ko/plugins/sdk-provider-plugins)을 빌드하세요.

## 여전히 core가 소유하는 것

하네스가 선택되기 전에 OpenClaw는 이미 다음을 결정했습니다:

- provider 및 model
- 런타임 인증 상태
- 사고 수준 및 컨텍스트 예산
- OpenClaw transcript/session 파일
- workspace, sandbox, 및 도구 정책
- 채널 응답 콜백 및 스트리밍 콜백
- 모델 fallback 및 라이브 모델 전환 정책

이 분리는 의도된 것입니다. 하네스는 준비된 시도를 실행합니다. 제공자를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

준비된 시도에는 `params.runtimePlan`도 포함되며, 이는 PI와 네이티브
하네스 전반에서 공유되어야 하는 런타임 결정용 OpenClaw 소유 정책 번들입니다:

- `runtimePlan.tools.normalize(...)` 및
  제공자 인식 도구 스키마 정책을 위한 `runtimePlan.tools.logDiagnostics(...)`
- transcript 정제 및
  tool-call 복구 정책을 위한 `runtimePlan.transcript.resolvePolicy(...)`
- 공유 `NO_REPLY` 및 미디어
  전달 억제를 위한 `runtimePlan.delivery.isSilentPayload(...)`
- 모델 fallback 분류를 위한 `runtimePlan.outcome.classifyRunResult(...)`
- 결정된 provider/model/harness 메타데이터를 위한 `runtimePlan.observability`

하네스는 PI 동작과 일치해야 하는 결정에 이 계획을 사용할 수 있지만,
여전히 이를 호스트 소유 시도 상태로 취급해야 합니다. 이를 변경하거나, 한 턴 안에서
provider/model을 전환하는 데 사용하지 마세요.

## 하네스 등록하기

**가져오기:** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw는 provider/model 결정 후 하네스를 선택합니다:

1. 기존 세션에 기록된 harness id가 우선하므로, config/env 변경으로 해당 transcript가 다른 런타임으로 핫 스위치되지 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 아직 고정되지 않은
   세션에 대해 해당 id의 등록된 하네스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하네스를 강제합니다.
4. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 하네스에 결정된
   provider/model을 지원하는지 묻습니다.
5. 등록된 하네스가 일치하지 않으면, PI fallback이
   비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin 하네스 실패는 실행 실패로 표시됩니다. `auto` 모드에서는, 결정된
provider/model을 지원하는 등록된 plugin 하네스가 없을 때만 PI fallback이
사용됩니다. Plugin 하네스가 한번 실행을 맡으면, OpenClaw는 동일한 턴을 PI로 다시 실행하지 않습니다. 이는 인증/런타임 의미를 바꾸거나 부작용을 중복시킬 수 있기 때문입니다.

선택된 harness id는 내장 실행 후 session id와 함께 영속화됩니다.
하네스 고정 이전에 생성된 레거시 세션은 transcript 기록이 생기면 PI 고정으로 취급됩니다.
PI와 네이티브 plugin 하네스 사이를 전환할 때는 새 세션 또는 초기화된 세션을 사용하세요. `/status`는 `codex` 같은 기본이 아닌 harness id를 `Fast` 옆에 표시합니다.
기본 호환 경로인 PI는 숨겨진 상태로 유지됩니다.
선택된 하네스가 예상과 다르면 `agents/harness` 디버그 로깅을 활성화하고
Gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에는
선택된 harness id, 선택 사유, 런타임/fallback 정책, 그리고 `auto`
모드에서는 각 plugin 후보의 지원 결과가 포함됩니다.

번들된 Codex plugin은 `codex`를 its harness id로 등록합니다. Core는 이를 일반적인 plugin harness id로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라 plugin
또는 운영자 config에 있어야 합니다.

## provider와 harness의 페어링

대부분의 하네스는 provider도 함께 등록해야 합니다. provider는 모델 ref,
인증 상태, 모델 메타데이터, 그리고 `/model` 선택을 OpenClaw의 나머지 부분에 노출합니다. 그런 다음 하네스가 `supports(...)`에서 해당 provider를 주장합니다.

번들된 Codex plugin은 이 패턴을 따릅니다:

- 선호되는 사용자 모델 ref: `openai/gpt-5.5` +
  `agentRuntime.id: "codex"`
- 호환성 ref: 레거시 `codex/gpt-*` ref는 계속 허용되지만, 새
  config는 이를 일반적인 provider/model ref로 사용하면 안 됩니다
- harness id: `codex`
- 인증: 합성 provider 가용성. Codex 하네스가
  네이티브 Codex 로그인/세션을 소유하기 때문입니다
- app-server 요청: OpenClaw는 모델 id만 Codex로 보내고,
  하네스가 네이티브 app-server 프로토콜과 통신하도록 합니다

Codex plugin은 가산적입니다. 일반 `openai/gpt-*` ref는
`agentRuntime.id: "codex"`로 Codex 하네스를 강제하지 않는 한 계속 일반 OpenClaw 제공자 경로를 사용합니다. 이전 `codex/gpt-*` ref는 호환성을 위해 여전히
Codex provider와 하네스를 선택합니다.

운영자 설정, 모델 prefix 예시, Codex 전용 config는
[Codex Harness](/ko/plugins/codex-harness)를 참고하세요.

OpenClaw는 Codex app-server `0.125.0` 이상을 요구합니다. Codex plugin은
app-server initialize 핸드셰이크를 확인하고 더 오래되었거나 버전이 없는 서버를 차단하여, OpenClaw가 테스트된 프로토콜 표면에서만 실행되도록 합니다.
`0.125.0` 최소 버전에는 Codex `0.124.0`에 도입된 네이티브 MCP hook payload 지원이 포함되며, 동시에 OpenClaw를 더 최신의 테스트된 안정 버전에 고정합니다.

### 도구 결과 미들웨어

번들된 plugin은 manifest에서 `contracts.agentToolResultMiddleware` 안에 대상 런타임 id를 선언할 때,
`api.registerAgentToolResultMiddleware(...)`를 통해 런타임 중립적인 도구 결과 미들웨어를 연결할 수 있습니다. 이 신뢰된 seam은 PI 또는 Codex가
도구 출력을 모델에 다시 공급하기 전에 실행되어야 하는 비동기 도구 결과 변환용입니다.

레거시 번들 plugin은 여전히
Codex app-server 전용 미들웨어에 `api.registerCodexAppServerExtensionFactory(...)`를 사용할 수 있지만, 새 결과 변환은 런타임 중립 API를 사용해야 합니다.
Pi 전용 `api.registerEmbeddedExtensionFactory(...)` hook은 제거되었습니다;
Pi 도구 결과 변환은 런타임 중립 미들웨어를 사용해야 합니다.

### 터미널 결과 분류

자체 프로토콜 프로젝션을 소유하는 네이티브 하네스는
완료된 턴에서 보이는 어시스턴트 텍스트가 생성되지 않았을 때
`openclaw/plugin-sdk/agent-harness-runtime`의
`classifyAgentHarnessTerminalOutcome(...)`를 사용할 수 있습니다. 이 helper는 `empty`, `reasoning-only`, 또는
`planning-only`를 반환하므로 OpenClaw의 fallback 정책이 다른 모델에서 재시도할지 결정할 수 있습니다. 이는 프롬프트 오류, 진행 중인 턴, `NO_REPLY` 같은 의도적인 무응답은 의도적으로 분류하지 않습니다.

### 네이티브 Codex 하네스 모드

번들된 `codex` 하네스는 내장 OpenClaw
에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들된 `codex` plugin을 활성화하고,
config가 제한적 allowlist를 사용한다면 `plugins.allow`에 `codex`를 포함하세요. 네이티브 app-server
config는 `agentRuntime.id: "codex"`와 함께 `openai/gpt-*`를 사용해야 합니다.
대신 PI를 통한 Codex OAuth에는 `openai-codex/*`를 사용하세요. 레거시 `codex/*`
모델 ref는 네이티브 하네스용 호환성 별칭으로 유지됩니다.

이 모드가 실행되면 Codex는 네이티브 thread id, resume 동작,
Compaction, 및 app-server 실행을 소유합니다. OpenClaw는 여전히 채팅 채널,
보이는 transcript 미러, 도구 정책, 승인, 미디어 전달, 및 세션
선택을 소유합니다. Codex app-server 경로만 실행을 맡을 수 있음을 입증해야 할 때는 `fallback` 재정의 없이 `agentRuntime.id: "codex"`를 사용하세요.
명시적 plugin 런타임은 기본적으로 이미 폐쇄 실패합니다. 하네스 선택 누락을 PI가 처리하도록 의도할 때만 `fallback: "pi"`를 설정하세요. Codex
app-server 실패는 이미 PI를 통해 재시도하지 않고 직접 실패합니다.

## PI fallback 비활성화

기본적으로 OpenClaw는 `agents.defaults.agentRuntime`를 `{ id: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서는 등록된 plugin
하네스가 provider/model 쌍을 맡을 수 있습니다. 일치하는 것이 없으면 OpenClaw는 PI로 fallback합니다.

`auto` 모드에서는 누락된 plugin 하네스
선택이 PI를 사용하는 대신 실패하도록 해야 할 때 `fallback: "none"`을 설정하세요. `runtime: "codex"` 같은 명시적 plugin 런타임은 같은 config 또는 환경 재정의 범위에 `fallback: "pi"`가 설정되지 않은 한 기본적으로 이미 폐쇄 실패합니다. 선택된 plugin harness
실패는 항상 강하게 실패합니다. 이는 명시적인 `runtime: "pi"` 또는
`OPENCLAW_AGENT_RUNTIME=pi`를 차단하지 않습니다.

Codex 전용 내장 실행의 경우:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

등록된 모든 plugin 하네스가 일치하는 모델을 맡을 수 있도록 하되 OpenClaw가 PI로 조용히 fallback하지 않게 하려면, `runtime: "auto"`를 유지하고
fallback을 비활성화하세요:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

에이전트별 재정의도 같은 형태를 사용합니다:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`는 여전히 구성된 런타임을 재정의합니다.
환경에서 PI fallback을 비활성화하려면
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback이 비활성화되면 요청된 하네스가
등록되지 않았거나, 결정된 provider/model을 지원하지 않거나, 턴 부작용을 생성하기 전에 실패할 경우 세션은 일찍 실패합니다. 이는 Codex 전용 배포와
Codex app-server 경로가 실제로 사용 중임을 입증해야 하는 라이브 테스트를 위해 의도된 동작입니다.

이 설정은 내장 에이전트 하네스만 제어합니다. 이는
이미지, 비디오, 음악, TTS, PDF 또는 기타 provider별 모델 라우팅을 비활성화하지 않습니다.

## 네이티브 세션 및 transcript 미러

하네스는 네이티브 session id, thread id 또는 데몬 측 resume token을 유지할 수 있습니다.
이 바인딩은 OpenClaw 세션과 명시적으로 연결된 상태로 유지하고,
사용자에게 보이는 어시스턴트/도구 출력을 OpenClaw transcript에 계속 미러링하세요.

OpenClaw transcript는 다음을 위한 호환성 계층으로 유지됩니다:

- 채널에 보이는 세션 기록
- transcript 검색 및 인덱싱
- 이후 턴에서 내장 PI 하네스로 다시 전환
- 일반적인 `/new`, `/reset`, 및 세션 삭제 동작

하네스가 사이드카 바인딩을 저장한다면 OpenClaw 세션이 재설정될 때
이를 지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

Core는 OpenClaw 도구 목록을 구성하여 준비된 시도에 전달합니다.
하네스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내지 말고,
하네스 결과 형태를 통해 도구 결과를 다시 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인, 그리고 메시징 도구 출력이
PI 기반 실행과 동일한 전달 경로를 유지하게 됩니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 별칭은 여전히
  호환성을 위해 `Pi` 이름을 사용합니다.
- 서드파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해질 때까지는
  provider plugin을 우선 사용하세요.
- 턴 간 하네스 전환은 지원됩니다. 네이티브 도구, 승인, 어시스턴트 텍스트 또는 메시지
  전송이 시작된 뒤에는 턴 중간에 하네스를 전환하지 마세요.

## 관련 항목

- [SDK Overview](/ko/plugins/sdk-overview)
- [Runtime Helpers](/ko/plugins/sdk-runtime)
- [Provider Plugins](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [Model Providers](/ko/concepts/model-providers)
