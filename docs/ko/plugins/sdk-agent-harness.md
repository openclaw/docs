---
read_when:
    - 임베디드 에이전트 런타임 또는 하니스 레지스트리를 변경하고 있습니다
    - 번들로 제공되거나 신뢰할 수 있는 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 제공자와 어떤 관계인지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 낮은 수준의 내장 에이전트 실행기를 대체하는 Plugin을 위한 실험적 SDK 표면
title: 에이전트 하니스 Plugin
x-i18n:
    generated_at: "2026-06-27T17:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**에이전트 하네스**는 준비된 OpenClaw 에이전트 턴 하나를 실행하는 저수준 실행기입니다.
모델 제공자도 아니고, 채널도 아니며, 도구 레지스트리도 아닙니다.
사용자 관점의 개념 모델은 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.

이 표면은 번들된 Plugin 또는 신뢰할 수 있는 네이티브 Plugin에만 사용하세요. 매개변수 타입이 의도적으로 현재 임베디드 러너를 그대로 반영하므로 이 계약은 아직 실험적입니다.

## 하네스를 사용해야 하는 경우

모델 계열이 자체 네이티브 세션 런타임을 가지고 있고 일반 OpenClaw 제공자 전송이 적절한 추상화가 아닐 때 에이전트 하네스를 등록하세요.

예:

- 스레드와 Compaction을 소유하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/도구 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 대화록에 더해 자체 재개 ID가 필요한 모델 런타임

새 LLM API를 추가하려는 목적만으로 하네스를 등록하지 **마세요**. 일반적인 HTTP 또는 WebSocket 모델 API의 경우 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을 만드세요.

## 코어가 여전히 소유하는 것

하네스가 선택되기 전에 OpenClaw는 이미 다음을 해결합니다.

- 제공자 및 모델
- 런타임 인증 상태
- 사고 수준 및 컨텍스트 예산
- OpenClaw 대화록/세션 파일
- 워크스페이스, 샌드박스, 도구 정책
- 채널 응답 콜백 및 스트리밍 콜백
- 모델 폴백 및 라이브 모델 전환 정책

이 분리는 의도된 것입니다. 하네스는 준비된 시도를 실행합니다. 제공자를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

준비된 시도에는 `params.runtimePlan`도 포함됩니다. 이는 OpenClaw와 네이티브 하네스 전반에서 공유되어야 하는 런타임 결정을 위한 OpenClaw 소유 정책 번들입니다.

- 제공자 인식 도구 스키마 정책을 위한 `runtimePlan.tools.normalize(...)` 및
  `runtimePlan.tools.logDiagnostics(...)`
- 대화록 정리 및 도구 호출 복구 정책을 위한 `runtimePlan.transcript.resolvePolicy(...)`
- 공유 `NO_REPLY` 및 미디어 전달 억제를 위한 `runtimePlan.delivery.isSilentPayload(...)`
- 모델 폴백 분류를 위한 `runtimePlan.outcome.classifyRunResult(...)`
- 해결된 제공자/모델/하네스 메타데이터를 위한 `runtimePlan.observability`

하네스는 OpenClaw 동작과 일치해야 하는 결정에 이 계획을 사용할 수 있지만, 여전히 호스트가 소유하는 시도 상태로 취급해야 합니다. 이를 변경하거나 턴 내부에서 제공자/모델을 전환하는 데 사용하지 마세요.

## 하네스 등록

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

OpenClaw는 제공자/모델 해결 후 하네스를 선택합니다.

1. 모델 범위 런타임 정책이 우선합니다.
2. 제공자 범위 런타임 정책이 그다음입니다.
3. `auto`는 등록된 하네스에 해결된 제공자/모델을 지원하는지 묻습니다.
4. 일치하는 등록 하네스가 없으면 OpenClaw는 임베디드 런타임을 사용합니다.

Plugin 하네스 실패는 실행 실패로 표시됩니다. `auto` 모드에서는 해결된 제공자/모델을 지원하는 등록 Plugin 하네스가 없을 때만 임베디드 폴백이 사용됩니다. Plugin 하네스가 실행을 맡은 뒤에는 OpenClaw가 같은 턴을 다른 런타임으로 다시 실행하지 않습니다. 그렇게 하면 인증/런타임 의미가 바뀌거나 부작용이 중복될 수 있기 때문입니다.

전체 세션 및 전체 에이전트 런타임 고정은 선택에서 무시됩니다. 여기에는 오래된 세션 `agentHarnessId` 값, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, `OPENCLAW_AGENT_RUNTIME`가 포함됩니다. `/status`는 제공자/모델 경로에서 선택된 유효 런타임을 표시합니다.
선택된 하네스가 예상과 다르면 `agents/harness` 디버그 로깅을 활성화하고 Gateway의 구조화된 `agent harness selected` 기록을 확인하세요. 여기에는 선택된 하네스 ID, 선택 이유, 런타임/폴백 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

번들된 Codex Plugin은 `codex`를 하네스 ID로 등록합니다. 코어는 이를 일반적인 Plugin 하네스 ID로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라 Plugin 또는 운영자 설정에 속합니다.

## 제공자와 하네스 페어링

대부분의 하네스는 제공자도 함께 등록해야 합니다. 제공자는 모델 참조, 인증 상태, 모델 메타데이터, `/model` 선택을 OpenClaw의 나머지 부분에 보이게 합니다. 그런 다음 하네스는 `supports(...)`에서 해당 제공자를 맡습니다.

번들된 Codex Plugin은 이 패턴을 따릅니다.

- 선호 사용자 모델 참조: `openai/gpt-5.5`
- 호환성 참조: 레거시 `codex/gpt-*` 참조는 계속 허용되지만, 새 설정에서는 이를 일반 제공자/모델 참조로 사용하지 않아야 합니다.
- 하네스 ID: `codex`
- 인증: 합성 제공자 가용성. Codex 하네스가 네이티브 Codex 로그인/세션을 소유하기 때문입니다.
- 앱 서버 요청: OpenClaw는 순수 모델 ID를 Codex에 보내고 하네스가 네이티브 앱 서버 프로토콜과 통신하도록 합니다.

Codex Plugin은 추가형입니다. 공식 OpenAI 제공자의 일반 `openai/gpt-*` 에이전트 참조는 기본적으로 Codex 하네스를 선택합니다. 이전 `codex/gpt-*` 참조도 호환성을 위해 여전히 Codex 제공자와 하네스를 선택합니다.

운영자 설정, 모델 접두사 예시, Codex 전용 설정은 [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요.

OpenClaw에는 Codex 앱 서버 `0.125.0` 이상이 필요합니다. Codex Plugin은 앱 서버 초기화 핸드셰이크를 확인하고 오래되었거나 버전이 없는 서버를 차단하여, OpenClaw가 테스트된 프로토콜 표면에서만 실행되도록 합니다. `0.125.0` 하한에는 Codex `0.124.0`에 포함된 네이티브 MCP 훅 페이로드 지원이 포함되며, OpenClaw를 더 최신의 테스트된 안정 라인에 고정합니다.

### 도구 결과 미들웨어

번들된 Plugin과 일치하는 매니페스트 계약으로 명시적으로 활성화된 설치 Plugin은, 매니페스트가 `contracts.agentToolResultMiddleware`에 대상 런타임 ID를 선언할 때 `api.registerAgentToolResultMiddleware(...)`를 통해 런타임 중립 도구 결과 미들웨어를 연결할 수 있습니다. 이 신뢰된 표면은 OpenClaw 또는 Codex가 도구 출력을 모델에 다시 제공하기 전에 실행되어야 하는 비동기 도구 결과 변환을 위한 것입니다.

레거시 번들 Plugin은 Codex 앱 서버 전용 미들웨어에 계속 `api.registerCodexAppServerExtensionFactory(...)`를 사용할 수 있지만, 새 결과 변환은 런타임 중립 API를 사용해야 합니다.
임베디드 러너 전용 `api.registerEmbeddedExtensionFactory(...)` 훅은 제거되었습니다. 임베디드 도구 결과 변환은 런타임 중립 미들웨어를 사용해야 합니다.

### 터미널 결과 분류

자체 프로토콜 투영을 소유하는 네이티브 하네스는 완료된 턴이 보이는 어시스턴트 텍스트를 생성하지 않았을 때 `openclaw/plugin-sdk/agent-harness-runtime`의 `classifyAgentHarnessTerminalOutcome(...)`을 사용할 수 있습니다. 이 헬퍼는 OpenClaw의 폴백 정책이 다른 모델에서 재시도할지 결정할 수 있도록 `empty`, `reasoning-only`, `planning-only`를 반환합니다. `planning-only`에는 하네스의 명시적 `planText` 필드가 필요합니다. OpenClaw는 어시스턴트 문장에서 이를 추론하지 않습니다. 이 헬퍼는 프롬프트 오류, 진행 중인 턴, `NO_REPLY` 같은 의도적 무응답은 의도적으로 분류하지 않습니다.

### 에이전트 종료 부작용

네이티브 하네스는 시도를 완료한 뒤 `openclaw/plugin-sdk/agent-harness-runtime`의 `runAgentEndSideEffects(...)`를 호출해야 합니다. 이 함수는 대화형 응답을 지연하지 않고 이식 가능한 `agent_end` 훅과 OpenClaw의 리서치 캡처를 디스패치합니다. 해당 부작용이 끝날 때까지 시도가 해결되면 안 되는 로컬 비대화형 실행에는 `awaitAgentEndSideEffects(...)`를 사용하세요. 두 헬퍼 모두 `runAgentHarnessAgentEndHook(...)`와 같은 `{ event, ctx }` 페이로드를 받습니다. 이들의 실패는 완료된 시도 결과를 바꾸지 않습니다.

### 사용자 입력 및 도구 표면

런타임 수준 사용자 입력 요청을 노출하는 네이티브 하네스는 `openclaw/plugin-sdk/agent-harness-runtime`의 사용자 입력 헬퍼를 사용해 프롬프트를 형식화하고, OpenClaw의 차단 응답 경로를 통해 전달하며, 선택/자유 형식 답변을 런타임의 네이티브 응답 형태로 정규화해야 합니다. 이 헬퍼는 채널/TUI 표시를 일관되게 유지하면서 각 하네스가 자체 프로토콜 파싱과 대기 중 요청 수명주기를 유지하게 합니다.

PI와 유사한 압축 도구 라우팅이 필요한 네이티브 하네스는 `openclaw/plugin-sdk/agent-harness-tool-runtime`의 `createAgentHarnessToolSurfaceRuntime(...)`를 사용해야 합니다. 이 런타임은 도구 검색/코드 모드 제어 선택, 로컬 모델 경량 기본값, 런타임 호환 스키마 필터링, 숨겨진 카탈로그 실행, 디렉터리 하이드레이션, 카탈로그 정리를 소유합니다. 하네스는 여전히 SDK별 도구 변환과 네이티브 실행 콜백을 소유합니다.

### 네이티브 Codex 하네스 모드

번들된 `codex` 하네스는 임베디드 OpenClaw 에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들된 `codex` Plugin을 활성화하고, 설정에서 제한적 허용 목록을 사용하는 경우 `plugins.allow`에 `codex`를 포함하세요. 네이티브 앱 서버 설정은 `openai/gpt-*`를 사용해야 합니다. OpenAI 에이전트 턴은 기본적으로 Codex 하네스를 선택합니다. 레거시 Codex 모델 참조 경로는 `openclaw doctor --fix`로 복구해야 하며, 레거시 `codex/*` 모델 참조는 네이티브 하네스의 호환성 별칭으로 남아 있습니다.

이 모드가 실행되면 Codex가 네이티브 스레드 ID, 재개 동작, Compaction, 앱 서버 실행을 소유합니다. OpenClaw는 여전히 채팅 채널, 보이는 대화록 미러, 도구 정책, 승인, 미디어 전달, 세션 선택을 소유합니다. 실행을 Codex 앱 서버 경로만 맡을 수 있음을 증명해야 할 때는 제공자/모델 `agentRuntime.id: "codex"`를 사용하세요. 명시적 Plugin 런타임은 닫힌 방식으로 실패합니다. Codex 앱 서버 선택 실패와 런타임 실패는 다른 런타임을 통해 재시도되지 않습니다.

## 런타임 엄격성

기본적으로 OpenClaw는 `auto` 제공자/모델 런타임 정책을 사용합니다. 등록된 Plugin 하네스가 제공자/모델 쌍을 맡을 수 있으며, 일치하는 것이 없으면 임베디드 런타임이 턴을 처리합니다. 공식 OpenAI 제공자의 OpenAI 에이전트 참조는 기본적으로 Codex를 사용합니다.
누락된 하네스 선택이 임베디드 런타임으로 라우팅되는 대신 실패해야 할 때는 `agentRuntime.id: "codex"` 같은 명시적 제공자/모델 Plugin 런타임을 사용하세요. 선택된 Plugin 하네스 실패는 항상 강하게 실패합니다. 이는 명시적 제공자/모델 `agentRuntime.id: "openclaw"`를 차단하지 않습니다.

Codex 전용 임베디드 실행:

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

하나의 표준 모델에 CLI 백엔드를 사용하려면 해당 모델 항목에 런타임을 넣으세요.

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

에이전트별 재정의는 같은 모델 범위 형태를 사용합니다.

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

다음과 같은 레거시 전체 에이전트 런타임 예시는 무시됩니다.

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

명시적 Plugin 런타임을 사용하면, 요청된 하네스가 등록되어 있지 않거나, 해석된 제공자/모델을 지원하지 않거나, 턴 부수 효과를 생성하기 전에 실패할 때 세션이 일찍 실패합니다. 이는 Codex 전용 배포와 Codex 앱 서버 경로가 실제로 사용 중임을 증명해야 하는 라이브 테스트를 위한 의도된 동작입니다.

이 설정은 내장 에이전트 하네스만 제어합니다. 이미지, 비디오, 음악, TTS, PDF 또는 기타 제공자별 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션과 트랜스크립트 미러

하네스는 네이티브 세션 ID, 스레드 ID 또는 데몬 측 재개 토큰을 유지할 수 있습니다. 해당 바인딩을 OpenClaw 세션과 명시적으로 연결해 두고, 사용자에게 보이는 어시스턴트/도구 출력을 OpenClaw 트랜스크립트로 계속 미러링하세요.

OpenClaw 트랜스크립트는 다음을 위한 호환성 계층으로 남아 있습니다.

- 채널에 보이는 세션 기록
- 트랜스크립트 검색 및 인덱싱
- 이후 턴에서 내장 OpenClaw 하네스로 다시 전환
- 일반적인 `/new`, `/reset` 및 세션 삭제 동작

하네스가 사이드카 바인딩을 저장하는 경우, 소유 OpenClaw 세션이 재설정될 때 OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

코어는 OpenClaw 도구 목록을 구성하고 준비된 시도에 전달합니다. 하네스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내는 대신 하네스 결과 형태를 통해 도구 결과를 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인 및 메시징 도구 출력이 OpenClaw 기반 실행과 동일한 전달 경로를 사용하게 됩니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 별칭은 호환성을 위해 여전히 레거시 이름을 포함합니다.
- 서드파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해지기 전까지는 제공자 Plugin을 선호하세요.
- 하네스 전환은 턴 간에 지원됩니다. 네이티브 도구, 승인, 어시스턴트 텍스트 또는 메시지 전송이 시작된 뒤 턴 중간에 하네스를 전환하지 마세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins)
- [Codex 하네스](/ko/plugins/codex-harness)
- [모델 제공자](/ko/concepts/model-providers)
