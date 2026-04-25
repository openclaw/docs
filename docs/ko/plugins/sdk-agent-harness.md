---
read_when:
    - 임베디드 에이전트 런타임 또는 harness 레지스트리를 변경하는 중입니다
    - 번들 또는 신뢰된 Plugin에서 에이전트 harness를 등록하는 중입니다
    - Codex Plugin이 model provider와 어떤 관계인지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 임베디드 에이전트 실행기를 대체하는 Plugin용 실험적 SDK 표면
title: 에이전트 harness Plugin
x-i18n:
    generated_at: "2026-04-25T06:06:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**에이전트 harness**는 준비된 하나의 OpenClaw 에이전트
턴을 위한 저수준 실행기입니다. model provider도 아니고, 채널도 아니며, 도구 레지스트리도 아닙니다.
사용자 대상 개념 모델은 [Agent runtimes](/ko/concepts/agent-runtimes)를 참고하세요.

이 표면은 번들되었거나 신뢰된 네이티브 Plugin에만 사용하세요. 계약은
현재 임베디드 runner를 의도적으로 반영하는 parameter 타입을 그대로 사용하기 때문에
여전히 실험적입니다.

## 언제 harness를 사용해야 하나요?

모델 계열이 자체 네이티브 세션
런타임을 가지고 있고, 일반 OpenClaw provider 전송이 잘못된 추상화일 때 agent harness를 등록하세요.

예시:

- thread와 Compaction을 소유하는 네이티브 코딩 에이전트 서버
- 네이티브 plan/reasoning/tool 이벤트를 스트리밍해야 하는 로컬 CLI 또는 daemon
- OpenClaw
  세션 transcript 외에 자체 resume id가 필요한 모델 런타임

단지 새 LLM API를 추가하려고 harness를 등록하지는 마세요. 일반 HTTP 또는
WebSocket 모델 API의 경우 [provider plugin](/ko/plugins/sdk-provider-plugins)을 만드세요.

## 코어가 여전히 소유하는 것

harness가 선택되기 전에 OpenClaw는 이미 다음을 해결했습니다:

- provider와 모델
- 런타임 auth 상태
- thinking 수준과 컨텍스트 예산
- OpenClaw transcript/session 파일
- workspace, sandbox, 도구 정책
- 채널 응답 콜백과 스트리밍 콜백
- 모델 폴백과 라이브 모델 전환 정책

이 분리는 의도된 것입니다. harness는 준비된 시도를 실행할 뿐이며,
provider를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

## harness 등록

**import:** `openclaw/plugin-sdk/agent-harness`

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
    // 네이티브 thread를 시작하거나 재개합니다.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, 그리고 다른 준비된 시도 필드를 사용하세요.
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

OpenClaw는 provider/model 확인 후 harness를 선택합니다:

1. 기존 세션의 기록된 harness id가 우선하므로, config/env 변경이
   해당 transcript를 다른 런타임으로 즉시 전환하지 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는
   아직 고정되지 않은 세션에 대해 해당 id의 등록된 harness를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI harness를 강제합니다.
4. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 harness에게
   확인된 provider/model을 지원하는지 묻습니다.
5. 등록된 harness가 일치하지 않으면, PI 폴백이
   비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin harness 실패는 실행 실패로 표면화됩니다. `auto` 모드에서는
등록된 Plugin harness가 확인된
provider/model을 지원하지 않을 때만 PI 폴백이 사용됩니다. 일단 Plugin harness가 실행을 claim하면, OpenClaw는 auth/runtime 의미를 바꾸거나 부작용을 중복시킬 수 있기 때문에
같은 턴을 PI로 다시 재생하지 않습니다.

선택된 harness id는 임베디드 실행 후 세션 id와 함께 저장됩니다.
harness 고정 이전에 생성된 레거시 세션은 transcript 이력이 생기면 PI로 고정된 것으로 취급됩니다. PI와 네이티브 Plugin harness 사이를 바꿀 때는 새 세션 또는 리셋된 세션을 사용하세요. `/status`는 `Fast` 옆에 `codex` 같은 비기본 harness id를 표시합니다.
PI는 기본 호환성 경로이므로 숨겨집니다.
선택된 harness가 예상과 다르면 `agents/harness` 디버그 로깅을 활성화하고
gateway의 구조화된 `agent harness selected` 기록을 확인하세요. 여기에는
선택된 harness id, 선택 이유, runtime/fallback 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

번들 Codex Plugin은 `codex`를 harness id로 등록합니다. 코어는 이를 일반적인 Plugin harness id로 취급합니다. Codex 전용 별칭은 공유 런타임 선택자가 아니라 Plugin 또는 operator config에 속합니다.

## provider와 harness의 페어링

대부분의 harness는 provider도 함께 등록해야 합니다. provider는
모델 ref, auth 상태, 모델 메타데이터, `/model` 선택을 OpenClaw의 나머지 부분에 노출합니다. 그 다음 harness는 `supports(...)`에서 그 provider를 claim합니다.

번들 Codex Plugin은 이 패턴을 따릅니다:

- 선호되는 사용자 모델 ref: `openai/gpt-5.5` +
  `embeddedHarness.runtime: "codex"`
- 호환성 ref: 레거시 `codex/gpt-*` ref는 여전히 허용되지만, 새
  config에서는 이를 일반 provider/model ref로 사용하지 않아야 합니다
- harness id: `codex`
- auth: 합성 provider 가용성. Codex harness가
  네이티브 Codex 로그인/세션을 소유하기 때문입니다
- app-server 요청: OpenClaw는 순수 모델 id를 Codex에 보내고,
  harness가 네이티브 app-server 프로토콜과 통신하도록 둡니다

Codex Plugin은 추가적입니다. 일반 `openai/gpt-*` ref는
`embeddedHarness.runtime: "codex"`로 Codex harness를 강제하지 않는 한 계속 일반 OpenClaw provider 경로를 사용합니다. 오래된 `codex/gpt-*` ref는 호환성을 위해 여전히 Codex provider와 harness를 선택합니다.

운영자 설정, 모델 접두사 예시, Codex 전용 config는
[Codex Harness](/ko/plugins/codex-harness)를 참고하세요.

OpenClaw는 Codex app-server `0.118.0` 이상을 요구합니다. Codex Plugin은
app-server initialize 핸드셰이크를 확인하고, 오래되었거나 버전 정보가 없는 서버를 차단하여
OpenClaw가 테스트된 프로토콜 표면에 대해서만 실행되도록 합니다.

### 도구 결과 middleware

번들 Plugin은 매니페스트에 대상 런타임 id를
`contracts.agentToolResultMiddleware`에 선언한 경우,
`api.registerAgentToolResultMiddleware(...)`를 통해 런타임 중립 도구 결과 middleware를 연결할 수 있습니다. 이 신뢰된
seam은 PI 또는 Codex가 도구 출력을 모델에 다시 공급하기 전에 실행되어야 하는 비동기 도구 결과 변환을 위한 것입니다.

레거시 번들 Plugin은 여전히 Codex app-server 전용
middleware를 위해 `api.registerCodexAppServerExtensionFactory(...)`를 사용할 수 있지만, 새로운 결과 변환은 런타임 중립 API를 사용해야 합니다.
Pi 전용 `api.registerEmbeddedExtensionFactory(...)` hook은 제거되었습니다.
Pi 도구 결과 변환은 런타임 중립 middleware를 사용해야 합니다.

### 네이티브 Codex harness 모드

번들 `codex` harness는 임베디드 OpenClaw
에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들 `codex` Plugin을 활성화하고,
config가 제한적 allowlist를 사용한다면 `plugins.allow`에 `codex`를 포함하세요. 네이티브 app-server
config는 `embeddedHarness.runtime: "codex"`와 함께 `openai/gpt-*`를 사용해야 합니다.
PI를 통한 Codex OAuth에는 대신 `openai-codex/*`를 사용하세요. 레거시 `codex/*`
모델 ref는 네이티브 harness용 호환성 별칭으로 유지됩니다.

이 모드가 실행되면 Codex는 네이티브 thread id, resume 동작,
Compaction, app-server 실행을 소유합니다. OpenClaw는 여전히 채팅 채널,
보이는 transcript 미러, 도구 정책, 승인, 미디어 전달, 세션
선택을 소유합니다. Codex app-server 경로만 실행을 claim할 수 있음을 증명해야 할 때는 `fallback` override 없이 `embeddedHarness.runtime: "codex"`를 사용하세요.
명시적 Plugin 런타임은 이미 기본적으로 fail-closed입니다. harness 선택이 없을 때 의도적으로 PI가 처리하도록 하고 싶을 때만 `fallback: "pi"`를 설정하세요. Codex
app-server 실패는 이미 PI를 통해 재시도하지 않고 직접 실패합니다.

## PI 폴백 비활성화

기본적으로 OpenClaw는 `agents.defaults.embeddedHarness`를
`{ runtime: "auto", fallback: "pi" }`로 설정해 임베디드 에이전트를 실행합니다. `auto` 모드에서는 등록된 Plugin
harness가 provider/model 쌍을 claim할 수 있습니다. 아무것도 일치하지 않으면 OpenClaw는 PI로 폴백합니다.

`auto` 모드에서는, 누락된 Plugin harness
선택이 PI를 사용하는 대신 실패해야 한다면 `fallback: "none"`을 설정하세요. `runtime: "codex"` 같은 명시적 Plugin 런타임은 같은 config 또는 환경 override 범위에 `fallback: "pi"`가 설정되지 않은 한 이미 기본적으로 fail-closed입니다. 선택된 Plugin harness
실패는 항상 강하게 실패합니다. 이는 명시적 `runtime: "pi"` 또는
`OPENCLAW_AGENT_RUNTIME=pi`를 막지 않습니다.

Codex 전용 임베디드 실행의 경우:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

등록된 어떤 Plugin harness든 일치하는 모델을 claim하게 하되, OpenClaw가 절대 조용히 PI로 폴백하지 않게 하려면 `runtime: "auto"`를 유지하고 폴백을 비활성화하세요:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

에이전트별 override도 같은 형태를 사용합니다:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`는 여전히 구성된 런타임을 override합니다.
환경에서 PI 폴백을 비활성화하려면
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화되면, 요청된 harness가 등록되지 않았거나,
확인된 provider/model을 지원하지 않거나,
턴 부작용을 생성하기 전에 실패하면 세션은 조기에 실패합니다. 이는 Codex 전용 배포와
실제로 Codex app-server 경로가 사용 중임을 증명해야 하는 라이브 테스트를 위한 의도된 동작입니다.

이 설정은 임베디드 에이전트 harness에만 영향을 줍니다. 이미지, 비디오, 음악, TTS, PDF 또는 기타 provider 전용 모델 라우팅을 비활성화하지는 않습니다.

## 네이티브 세션과 transcript 미러

harness는 네이티브 세션 id, thread id 또는 daemon 측 resume token을 유지할 수 있습니다.
그 바인딩을 OpenClaw 세션과 명시적으로 연결해 유지하고,
사용자에게 보이는 assistant/tool 출력을 계속 OpenClaw transcript에 미러링하세요.

OpenClaw transcript는 다음을 위한 호환성 계층으로 남습니다:

- 채널에 보이는 세션 이력
- transcript 검색 및 인덱싱
- 이후 턴에서 내장 PI harness로 다시 전환
- 일반적인 `/new`, `/reset`, 세션 삭제 동작

harness가 사이드카 바인딩을 저장한다면, OpenClaw 세션이 리셋될 때 이를
지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

코어는 OpenClaw 도구 목록을 구성하고 이를 준비된 시도에 전달합니다.
harness가 동적 도구 호출을 실행할 때는, 채널 미디어를 직접 전송하는 대신
harness 결과 형태를 통해 도구 결과를 다시 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력이
PI 기반 실행과 같은 전달 경로를 유지합니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 별칭은
  호환성을 위해 여전히 `Pi` 이름을 가지고 있습니다.
- 서드파티 harness 설치는 실험적입니다. 네이티브 세션 런타임이
  필요해질 때까지는 provider Plugin을 우선하세요.
- harness 전환은 턴 간에는 지원됩니다. 네이티브 도구, 승인, assistant 텍스트 또는 메시지 전송이 시작된 뒤 턴 중간에는 harness를 바꾸지 마세요.

## 관련 항목

- [SDK Overview](/ko/plugins/sdk-overview)
- [Runtime Helpers](/ko/plugins/sdk-runtime)
- [Provider Plugins](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [Model Providers](/ko/concepts/model-providers)
