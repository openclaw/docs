---
read_when:
    - 내장 에이전트 런타임 또는 하네스 레지스트리를 변경하는 경우
    - 번들된 Plugin 또는 신뢰할 수 있는 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 제공자와 어떤 관계인지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 내장 에이전트 실행기를 대체하는 Plugin을 위한 실험적 SDK 표면
title: 에이전트 하네스 Plugin
x-i18n:
    generated_at: "2026-05-02T21:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**에이전트 하니스**는 준비된 하나의 OpenClaw 에이전트 턴을 실행하는 저수준 실행기입니다. 모델 제공자도, 채널도, 도구 레지스트리도 아닙니다.
사용자 관점의 개념 모델은 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참고하세요.

이 표면은 번들 또는 신뢰할 수 있는 네이티브 Plugin에만 사용하세요. 이 계약은
매개변수 타입이 의도적으로 현재의 내장 러너를 그대로 반영하므로 아직 실험적입니다.

## 하니스를 사용해야 하는 경우

모델 계열이 자체 네이티브 세션 런타임을 가지고 있고 일반 OpenClaw 제공자 전송 계층이 적절한 추상화가 아닐 때 에이전트 하니스를 등록하세요.

예:

- 스레드와 Compaction을 소유하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/도구 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 트랜스크립트 외에도 자체 재개 ID가 필요한 모델 런타임

새 LLM API를 추가하기 위해서만 하니스를 등록하지 **마세요**. 일반 HTTP 또는
WebSocket 모델 API에는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을 빌드하세요.

## 코어가 여전히 소유하는 것

하니스가 선택되기 전에 OpenClaw는 이미 다음을 확인했습니다.

- 제공자 및 모델
- 런타임 인증 상태
- 사고 수준 및 컨텍스트 예산
- OpenClaw 트랜스크립트/세션 파일
- 작업공간, 샌드박스, 도구 정책
- 채널 응답 콜백 및 스트리밍 콜백
- 모델 폴백 및 라이브 모델 전환 정책

이 분리는 의도된 것입니다. 하니스는 준비된 시도를 실행합니다. 제공자를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

준비된 시도에는 PI와 네이티브 하니스 전반에서 공유되어야 하는 런타임 결정을 위한 OpenClaw 소유 정책 번들인 `params.runtimePlan`도 포함됩니다.

- 제공자 인식 도구 스키마 정책을 위한 `runtimePlan.tools.normalize(...)` 및
  `runtimePlan.tools.logDiagnostics(...)`
- 트랜스크립트 정리 및 도구 호출 복구 정책을 위한 `runtimePlan.transcript.resolvePolicy(...)`
- 공유 `NO_REPLY` 및 미디어 전달 억제를 위한 `runtimePlan.delivery.isSilentPayload(...)`
- 모델 폴백 분류를 위한 `runtimePlan.outcome.classifyRunResult(...)`
- 확인된 제공자/모델/하니스 메타데이터를 위한 `runtimePlan.observability`

하니스는 PI 동작과 일치해야 하는 결정에 이 계획을 사용할 수 있지만, 여전히 이를 호스트 소유의 시도 상태로 취급해야 합니다. 이를 변경하거나 턴 안에서 제공자/모델을 전환하는 데 사용하지 마세요.

## 하니스 등록

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

OpenClaw는 제공자/모델 확인 후 하니스를 선택합니다.

1. 기존 세션에 기록된 하니스 ID가 우선하므로, 설정/환경 변경이 해당 트랜스크립트를 다른 런타임으로 즉시 전환하지 않습니다.
2. `OPENCLAW_AGENT_RUNTIME=<id>`는 아직 고정되지 않은 세션에 대해 해당 ID를 가진 등록된 하니스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하니스를 강제합니다.
4. `OPENCLAW_AGENT_RUNTIME=auto`는 확인된 제공자/모델을 지원하는지 등록된 하니스에 질의합니다.
5. 일치하는 등록된 하니스가 없으면 PI 폴백이 비활성화되어 있지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin 하니스 실패는 실행 실패로 노출됩니다. `auto` 모드에서는 확인된 제공자/모델을 지원하는 등록된 Plugin 하니스가 없을 때만 PI 폴백이 사용됩니다. Plugin 하니스가 실행을 담당하겠다고 선언한 뒤에는, OpenClaw가 같은 턴을 PI를 통해 다시 재생하지 않습니다. 그렇게 하면 인증/런타임 의미가 바뀌거나 부작용이 중복될 수 있기 때문입니다.

선택된 하니스 ID는 내장 실행 후 세션 ID와 함께 유지됩니다.
하니스 고정이 생기기 전에 생성된 레거시 세션은 트랜스크립트 기록이 있으면 PI에 고정된 것으로 취급됩니다. PI와 네이티브 Plugin 하니스 사이를 변경할 때는 새 세션이나 재설정된 세션을 사용하세요. `/status`는 `codex` 같은 기본값이 아닌 하니스 ID를 `Fast` 옆에 표시합니다. PI는 기본 호환 경로이므로 숨겨진 상태로 유지됩니다.
선택된 하니스가 예상과 다르면 `agents/harness` 디버그 로깅을 활성화하고 Gateway의 구조화된 `agent harness selected` 레코드를 검사하세요. 여기에는 선택된 하니스 ID, 선택 이유, 런타임/폴백 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

번들 Codex Plugin은 `codex`를 하니스 ID로 등록합니다. 코어는 이를 일반적인 Plugin 하니스 ID로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라 Plugin 또는 운영자 설정에 속합니다.

## 제공자와 하니스 페어링

대부분의 하니스는 제공자도 함께 등록해야 합니다. 제공자는 모델 참조, 인증 상태, 모델 메타데이터, `/model` 선택을 OpenClaw의 나머지 부분에 보이게 합니다. 그러면 하니스는 `supports(...)`에서 해당 제공자를 담당합니다.

번들 Codex Plugin은 이 패턴을 따릅니다.

- 선호되는 사용자 모델 참조: `openai/gpt-5.5` 및
  `agentRuntime.id: "codex"`
- 호환성 참조: 레거시 `codex/gpt-*` 참조는 계속 허용되지만, 새 설정에서는 이를 일반 제공자/모델 참조로 사용하면 안 됩니다
- 하니스 ID: `codex`
- 인증: Codex 하니스가 네이티브 Codex 로그인/세션을 소유하므로 합성 제공자 가용성 사용
- 앱 서버 요청: OpenClaw는 순수 모델 ID를 Codex로 보내고 하니스가 네이티브 앱 서버 프로토콜과 통신하도록 합니다

Codex Plugin은 추가 기능입니다. 일반 `openai/gpt-*` 참조는
`agentRuntime.id: "codex"`로 Codex 하니스를 강제하지 않는 한 계속 일반 OpenClaw 제공자 경로를 사용합니다. 이전 `codex/gpt-*` 참조는 호환성을 위해 여전히 Codex 제공자와 하니스를 선택합니다.

운영자 설정, 모델 접두사 예시, Codex 전용 설정은
[Codex 하니스](/ko/plugins/codex-harness)를 참고하세요.

OpenClaw에는 Codex 앱 서버 `0.125.0` 이상이 필요합니다. Codex Plugin은 앱 서버 초기화 핸드셰이크를 확인하고 더 오래되었거나 버전이 없는 서버를 차단하여, OpenClaw가 테스트된 프로토콜 표면에 대해서만 실행되도록 합니다.
`0.125.0` 하한은 Codex `0.124.0`에 도입된 네이티브 MCP 훅 페이로드 지원을 포함하면서, OpenClaw를 더 최신의 테스트된 안정 라인에 고정합니다.

### 도구 결과 미들웨어

번들 Plugin은 해당 매니페스트가 `contracts.agentToolResultMiddleware`에 대상 런타임 ID를 선언할 때 `api.registerAgentToolResultMiddleware(...)`를 통해 런타임 중립 도구 결과 미들웨어를 연결할 수 있습니다. 이 신뢰된 이음새는 PI 또는 Codex가 도구 출력을 모델에 다시 공급하기 전에 실행되어야 하는 비동기 도구 결과 변환을 위한 것입니다.

레거시 번들 Plugin은 Codex 앱 서버 전용 미들웨어에
`api.registerCodexAppServerExtensionFactory(...)`를 계속 사용할 수 있지만, 새 결과 변환은 런타임 중립 API를 사용해야 합니다.
Pi 전용 `api.registerEmbeddedExtensionFactory(...)` 훅은 제거되었습니다.
Pi 도구 결과 변환은 런타임 중립 미들웨어를 사용해야 합니다.

### 터미널 결과 분류

자체 프로토콜 투영을 소유하는 네이티브 하니스는 완료된 턴에서 보이는 어시스턴트 텍스트가 생성되지 않았을 때 `openclaw/plugin-sdk/agent-harness-runtime`의
`classifyAgentHarnessTerminalOutcome(...)`을 사용할 수 있습니다. 이 헬퍼는 OpenClaw의 폴백 정책이 다른 모델로 재시도할지 결정할 수 있도록 `empty`, `reasoning-only`, 또는
`planning-only`를 반환합니다. 프롬프트 오류, 진행 중인 턴, `NO_REPLY` 같은 의도적인 무응답은 의도적으로 분류하지 않습니다.

### 네이티브 Codex 하니스 모드

번들 `codex` 하니스는 내장 OpenClaw 에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들 `codex` Plugin을 활성화하고, 설정이 제한적인 허용 목록을 사용하는 경우 `plugins.allow`에 `codex`를 포함하세요. 네이티브 앱 서버 설정은 `agentRuntime.id: "codex"`와 함께 `openai/gpt-*`를 사용해야 합니다.
PI를 통한 Codex OAuth에는 `openai-codex/*`를 사용하세요. 레거시 `codex/*`
모델 참조는 네이티브 하니스를 위한 호환성 별칭으로 유지됩니다.

이 모드가 실행되면 Codex가 네이티브 스레드 ID, 재개 동작,
Compaction, 앱 서버 실행을 소유합니다. OpenClaw는 여전히 채팅 채널,
보이는 트랜스크립트 미러, 도구 정책, 승인, 미디어 전달, 세션 선택을 소유합니다. Codex 앱 서버 경로만 실행을 담당할 수 있음을 증명해야 할 때는 `fallback` 재정의 없이 `agentRuntime.id: "codex"`를 사용하세요.
명시적 Plugin 런타임은 이미 기본적으로 닫힌 상태로 실패합니다. 누락된 하니스 선택을 PI가 처리하도록 의도적으로 원할 때만 `fallback: "pi"`를 설정하세요. Codex 앱 서버 실패는 이미 PI를 통해 재시도하지 않고 직접 실패합니다.

## PI 폴백 비활성화

기본적으로 OpenClaw는 `agents.defaults.agentRuntime`을
`{ id: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서는 등록된 Plugin 하니스가 제공자/모델 쌍을 담당할 수 있습니다. 일치하는 항목이 없으면 OpenClaw는 PI로 폴백합니다.

`auto` 모드에서, 누락된 Plugin 하니스 선택이 PI를 사용하는 대신 실패해야 할 때는 `fallback: "none"`을 설정하세요. `agentRuntime.id: "codex"` 같은 명시적 Plugin 런타임은 동일한 설정 또는 환경 재정의 범위에 `fallback: "pi"`가 설정되지 않은 한 이미 기본적으로 닫힌 상태로 실패합니다.
선택된 Plugin 하니스 실패는 항상 강하게 실패합니다. 이는 명시적인
`agentRuntime.id: "pi"` 또는 `OPENCLAW_AGENT_RUNTIME=pi`를 차단하지 않습니다.

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

등록된 어떤 Plugin 하니스든 일치하는 모델을 담당하도록 하되, OpenClaw가 PI로 조용히 폴백하는 것은 원하지 않는다면 `runtime: "auto"`를 유지하고 폴백을 비활성화하세요.

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

에이전트별 재정의는 같은 형태를 사용합니다.

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

`OPENCLAW_AGENT_RUNTIME`은 여전히 설정된 런타임을 재정의합니다. 환경에서 PI 폴백을 비활성화하려면 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화된 상태에서는 요청한 하니스가 등록되어 있지 않거나, 확인된 제공자/모델을 지원하지 않거나, 턴 부작용을 생성하기 전에 실패하면 세션이 조기에 실패합니다. 이는 Codex 전용 배포와 Codex 앱 서버 경로가 실제로 사용 중임을 증명해야 하는 라이브 테스트를 위한 의도된 동작입니다.

이 설정은 내장 에이전트 하니스만 제어합니다. 이미지, 비디오, 음악, TTS, PDF 또는 기타 제공자별 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션 및 트랜스크립트 미러

하니스는 네이티브 세션 ID, 스레드 ID 또는 데몬 측 재개 토큰을 유지할 수 있습니다.
그 바인딩을 OpenClaw 세션과 명시적으로 연결해 두고, 사용자에게 보이는 어시스턴트/도구 출력을 OpenClaw 트랜스크립트에 계속 미러링하세요.

OpenClaw 트랜스크립트는 다음을 위한 호환성 계층으로 유지됩니다.

- 채널에 보이는 세션 기록
- 트랜스크립트 검색 및 인덱싱
- 이후 턴에서 내장 PI 하니스로 다시 전환
- 일반 `/new`, `/reset`, 세션 삭제 동작

하니스가 사이드카 바인딩을 저장한다면, 소유 OpenClaw 세션이 재설정될 때 OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

Core는 OpenClaw 도구 목록을 구성하고 준비된 시도에 전달합니다.
하네스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내지 말고
하네스 결과 형식을 통해 도구 결과를 다시 반환하세요.

이렇게 하면 텍스트, 이미지, 동영상, 음악, TTS, 승인, 메시징 도구 출력이
Pi 기반 실행과 동일한 전달 경로를 유지합니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 attempt/result 타입 별칭은 호환성을 위해 여전히 `Pi` 이름을 사용합니다.
- 서드 파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해질 때까지는 제공자 Plugin을 선호하세요.
- 하네스 전환은 턴 간에 지원됩니다. 네이티브 도구, 승인, 어시스턴트 텍스트 또는 메시지 전송이 시작된 뒤에는 턴 중간에 하네스를 전환하지 마세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins)
- [Codex 하네스](/ko/plugins/codex-harness)
- [모델 제공자](/ko/concepts/model-providers)
