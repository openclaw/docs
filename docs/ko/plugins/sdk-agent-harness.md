---
read_when:
    - 내장 에이전트 런타임 또는 하네스 레지스트리를 변경하고 있습니다
    - 번들되었거나 신뢰할 수 있는 플러그인에서 에이전트 하네스를 등록하고 있습니다
    - Codex 플러그인이 모델 제공자와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 낮은 수준의 내장 에이전트 실행기를 대체하는 플러그인을 위한 실험적 SDK 표면
title: 에이전트 하네스 플러그인
x-i18n:
    generated_at: "2026-04-12T00:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62b88fd24ce8b600179db27e16e8d764a2cd7a14e5c5df76374c33121aa5e365
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 에이전트 하네스 플러그인

**에이전트 하네스**는 준비된 OpenClaw 에이전트 턴 하나를 위한 낮은 수준의 실행기입니다. 이는 모델 제공자도, 채널도, 도구 레지스트리도 아닙니다.

이 표면은 번들되었거나 신뢰할 수 있는 네이티브 플러그인에만 사용하세요. 이 계약은 매개변수 타입이 의도적으로 현재 내장 러너를 그대로 반영하므로 아직 실험적입니다.

## 하네스를 사용하는 경우

모델 계열이 자체 네이티브 세션 런타임을 가지고 있고 일반적인 OpenClaw 제공자 전송이 잘못된 추상화일 때 에이전트 하네스를 등록하세요.

예시:

- 스레드와 compaction을 직접 관리하는 네이티브 코딩 에이전트 서버
- 네이티브 plan/reasoning/tool 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 transcript에 더해 자체 resume id가 필요한 모델 런타임

새 LLM API를 추가하기 위해 하네스를 등록해서는 **안 됩니다**. 일반적인 HTTP 또는 WebSocket 모델 API의 경우 [provider plugin](/ko/plugins/sdk-provider-plugins)을 빌드하세요.

## 코어가 계속 소유하는 것

하네스가 선택되기 전에 OpenClaw는 이미 다음을 해석합니다:

- 제공자와 모델
- 런타임 인증 상태
- thinking level과 context budget
- OpenClaw transcript/session 파일
- workspace, sandbox, 도구 정책
- 채널 응답 콜백과 스트리밍 콜백
- 모델 폴백과 라이브 모델 전환 정책

이 분리는 의도된 것입니다. 하네스는 준비된 시도를 실행할 뿐이며, 제공자를 선택하거나, 채널 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

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

OpenClaw는 제공자/모델 해석 후 하네스를 선택합니다:

1. `OPENCLAW_AGENT_RUNTIME=<id>`는 해당 id를 가진 등록된 하네스를 강제합니다.
2. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하네스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 하네스에 해석된 제공자/모델을 지원하는지 묻습니다.
4. 등록된 하네스가 일치하지 않으면, PI 폴백이 비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

강제된 플러그인 하네스 실패는 실행 실패로 표시됩니다. `auto` 모드에서는 선택된 플러그인 하네스가 턴이 부작용을 만들기 전에 실패하면 OpenClaw가 PI로 폴백할 수 있습니다. 대신 그 폴백을 하드 실패로 만들려면 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 또는 `embeddedHarness.fallback: "none"`을 설정하세요.

번들된 Codex 플러그인은 `codex`를 하네스 id로 등록합니다. 코어는 이를 일반적인 플러그인 하네스 id로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라 플러그인 또는 운영자 설정에 속해야 합니다.

## 제공자와 하네스 페어링

대부분의 하네스는 제공자도 함께 등록해야 합니다. 제공자는 모델 ref, 인증 상태, 모델 메타데이터, `/model` 선택을 OpenClaw의 나머지 부분에서 볼 수 있게 합니다. 그런 다음 하네스는 `supports(...)`에서 해당 제공자를 claim합니다.

번들된 Codex 플러그인은 이 패턴을 따릅니다:

- provider id: `codex`
- 사용자 모델 ref: `codex/gpt-5.4`, `codex/gpt-5.2`, 또는 Codex app server가 반환하는 다른 모델
- harness id: `codex`
- auth: 합성 제공자 가용성. Codex 하네스가 네이티브 Codex 로그인/세션을 소유하기 때문입니다
- app-server request: OpenClaw는 bare model id를 Codex에 보내고 하네스가 네이티브 app-server 프로토콜과 통신하도록 둡니다

Codex 플러그인은 추가적입니다. 일반 `openai/gpt-*` ref는 계속 OpenAI provider ref로 남으며 일반 OpenClaw provider 경로를 계속 사용합니다. Codex 관리 인증, Codex 모델 검색, 네이티브 스레드, Codex app-server 실행을 원할 때는 `codex/gpt-*`를 선택하세요. `/model`은 OpenAI provider 자격 증명이 없어도 Codex app server가 반환한 Codex 모델들 사이를 전환할 수 있습니다.

운영자 설정, 모델 접두사 예시, Codex 전용 구성은 [Codex Harness](/ko/plugins/codex-harness)를 참조하세요.

OpenClaw는 Codex app-server `0.118.0` 이상을 요구합니다. Codex 플러그인은 app-server initialize 핸드셰이크를 검사하고 더 오래되었거나 버전이 없는 서버를 차단하여 OpenClaw가 테스트된 프로토콜 표면에 대해서만 실행되도록 합니다.

### 네이티브 Codex 하네스 모드

번들된 `codex` 하네스는 내장 OpenClaw 에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들된 `codex` 플러그인을 활성화하고, 구성이 제한적인 allowlist를 사용한다면 `plugins.allow`에 `codex`를 포함하세요. 이것은 `openai-codex/*`와 다릅니다:

- `openai-codex/*`는 일반 OpenClaw provider 경로를 통해 ChatGPT/Codex OAuth를 사용합니다.
- `codex/*`는 번들된 Codex provider를 사용하고 턴을 Codex app-server를 통해 라우팅합니다.

이 모드가 실행되면 Codex는 네이티브 thread id, resume 동작, compaction, app-server 실행을 소유합니다. OpenClaw는 여전히 채팅 채널, 표시되는 transcript mirror, 도구 정책, 승인, 미디어 전달, 세션 선택을 소유합니다. Codex app-server 경로가 사용되고 있고 PI 폴백이 고장 난 네이티브 하네스를 숨기지 않음을 증명해야 한다면 `embeddedHarness.runtime: "codex"`와 `embeddedHarness.fallback: "none"`을 사용하세요.

## PI 폴백 비활성화

기본적으로 OpenClaw는 `agents.defaults.embeddedHarness`를 `{ runtime: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서 등록된 플러그인 하네스는 제공자/모델 쌍을 claim할 수 있습니다. 일치하는 것이 없거나 자동 선택된 플러그인 하네스가 출력을 만들기 전에 실패하면 OpenClaw는 PI로 폴백합니다.

플러그인 하네스가 유일하게 실행되는 런타임임을 증명해야 할 때는 `fallback: "none"`을 설정하세요. 이렇게 하면 자동 PI 폴백이 비활성화됩니다. 명시적인 `runtime: "pi"` 또는 `OPENCLAW_AGENT_RUNTIME=pi`는 차단하지 않습니다.

Codex 전용 내장 실행의 경우:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

등록된 어떤 플러그인 하네스라도 일치하는 모델을 claim하게 하되 OpenClaw가 절대로 조용히 PI로 폴백하지 않게 하려면 `runtime: "auto"`를 유지하고 폴백을 비활성화하세요:

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

에이전트별 재정의도 같은 형태를 사용합니다:

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`는 여전히 구성된 runtime보다 우선합니다. 환경에서 PI 폴백을 비활성화하려면 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화되면 요청된 하네스가 등록되지 않았거나, 해석된 제공자/모델을 지원하지 않거나, 턴 부작용을 만들기 전에 실패할 때 세션은 초기에 실패합니다. 이는 Codex 전용 배포와 Codex app-server 경로가 실제로 사용 중임을 증명해야 하는 라이브 테스트를 위한 의도된 동작입니다.

이 설정은 내장 에이전트 하네스만 제어합니다. 이미지, 비디오, 음악, TTS, PDF 또는 다른 제공자별 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션과 transcript mirror

하네스는 네이티브 session id, thread id 또는 데몬 측 resume token을 유지할 수 있습니다. 그 바인딩을 OpenClaw 세션과 명시적으로 연결해 두고, 사용자에게 보이는 assistant/tool 출력을 OpenClaw transcript에 계속 미러링하세요.

OpenClaw transcript는 다음을 위한 호환성 계층으로 남아 있습니다:

- 채널에 표시되는 세션 기록
- transcript 검색 및 인덱싱
- 이후 턴에서 내장 PI 하네스로 다시 전환
- 일반 `/new`, `/reset`, 세션 삭제 동작

하네스가 사이드카 바인딩을 저장한다면 소유한 OpenClaw 세션이 재설정될 때 OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하세요.

## 도구 및 미디어 결과

코어는 OpenClaw 도구 목록을 구성하고 이를 준비된 시도에 전달합니다. 하네스가 동적 도구 호출을 실행할 때는 채널 미디어를 직접 보내는 대신 하네스 결과 형태를 통해 도구 결과를 반환하세요.

이렇게 하면 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력이 PI 기반 실행과 동일한 전달 경로를 유지합니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 attempt/result 타입 별칭은 호환성을 위해 여전히 `Pi` 이름을 사용합니다.
- 서드파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해질 때까지는 provider plugin을 우선 사용하세요.
- 턴 간 하네스 전환은 지원됩니다. 네이티브 도구, 승인, assistant 텍스트 또는 메시지 전송이 시작된 뒤에는 턴 중간에 하네스를 전환하지 마세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [제공자 플러그인](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [모델 제공자](/ko/concepts/model-providers)
