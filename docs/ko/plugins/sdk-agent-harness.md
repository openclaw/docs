---
read_when:
    - 내장 에이전트 런타임 또는 하네스 레지스트리를 변경하고 있습니다
    - 번들되었거나 신뢰할 수 있는 Plugin에서 에이전트 하네스를 등록하고 있습니다
    - Codex Plugin이 모델 provider와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 내장 에이전트 실행기를 대체하는 Plugin용 실험적 SDK 표면
title: 에이전트 하네스 Plugin
x-i18n:
    generated_at: "2026-04-22T06:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 에이전트 하네스 Plugin

**에이전트 하네스**는 준비된 OpenClaw 에이전트 한 턴을 위한 저수준 실행기입니다. 이것은 모델 provider도, channel도, tool registry도 아닙니다.

이 표면은 번들되었거나 신뢰할 수 있는 네이티브 Plugin에만 사용하세요. 이 계약은 여전히 실험적이며, 그 이유는 파라미터 타입이 의도적으로 현재 내장 러너를 반영하기 때문입니다.

## 하네스를 사용해야 하는 경우

모델 패밀리에 자체 네이티브 세션 런타임이 있고 일반적인 OpenClaw provider 전송이 잘못된 추상화인 경우 에이전트 하네스를 등록하세요.

예시:

- 스레드와 Compaction을 자체적으로 관리하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/tool 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 transcript 외에 자체 resume id가 필요한 모델 런타임

새로운 LLM API를 추가하기 위해 하네스를 등록해서는 **안 됩니다**. 일반적인 HTTP 또는 WebSocket 모델 API의 경우 [provider Plugin](/ko/plugins/sdk-provider-plugins)을 만드세요.

## 여전히 코어가 담당하는 것

하네스가 선택되기 전에 OpenClaw는 이미 다음을 해결했습니다:

- provider와 모델
- 런타임 auth 상태
- thinking level과 context budget
- OpenClaw transcript/session 파일
- workspace, sandbox, 그리고 tool 정책
- channel reply callback과 streaming callback
- 모델 fallback 및 live 모델 전환 정책

이 분리는 의도된 것입니다. 하네스는 준비된 시도를 실행하며, provider를 선택하거나, channel 전달을 대체하거나, 모델을 조용히 전환하지 않습니다.

## 하네스 등록하기

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

OpenClaw는 provider/모델 해석 후 하네스를 선택합니다:

1. `OPENCLAW_AGENT_RUNTIME=<id>`는 해당 id를 가진 등록된 하네스를 강제합니다.
2. `OPENCLAW_AGENT_RUNTIME=pi`는 내장 PI 하네스를 강제합니다.
3. `OPENCLAW_AGENT_RUNTIME=auto`는 등록된 하네스들에 해석된 provider/모델을 지원하는지 질의합니다.
4. 일치하는 등록된 하네스가 없으면, PI fallback이 비활성화되지 않은 한 OpenClaw는 PI를 사용합니다.

Plugin 하네스 실패는 실행 실패로 표면화됩니다. `auto` 모드에서 PI fallback은 해석된 provider/모델을 지원하는 등록된 Plugin 하네스가 없을 때만 사용됩니다. Plugin 하네스가 한번 실행을 맡으면, OpenClaw는 같은 턴을 PI를 통해 다시 실행하지 않습니다. 그렇게 하면 auth/런타임 의미가 바뀌거나 부작용이 중복될 수 있기 때문입니다.

번들된 Codex Plugin은 `codex`를 하네스 id로 등록합니다. 코어는 이를 일반적인 Plugin 하네스 id로 취급합니다. Codex 전용 alias는 공유 런타임 선택자가 아니라 Plugin 또는 운영자 config에 속합니다.

## provider와 하네스 페어링

대부분의 하네스는 provider도 함께 등록해야 합니다. provider는 모델 ref, auth 상태, 모델 메타데이터, 그리고 `/model` 선택을 OpenClaw의 나머지 부분에 보이게 합니다. 그 다음 하네스는 `supports(...)`에서 해당 provider를 맡습니다.

번들된 Codex Plugin은 이 패턴을 따릅니다:

- provider id: `codex`
- 사용자 모델 ref: `codex/gpt-5.4`, `codex/gpt-5.2`, 또는 Codex 앱 서버가 반환한 다른 모델
- harness id: `codex`
- auth: 합성된 provider 가용성. Codex 하네스가 네이티브 Codex 로그인/세션을 관리하기 때문입니다
- app-server 요청: OpenClaw는 순수 모델 id를 Codex에 보내고, 하네스가 네이티브 app-server 프로토콜과 통신하도록 둡니다

Codex Plugin은 가산적입니다. 일반 `openai/gpt-*` ref는 여전히 OpenAI provider ref이며 정상적인 OpenClaw provider 경로를 계속 사용합니다. Codex가 관리하는 auth, Codex 모델 검색, 네이티브 스레드, 그리고 Codex app-server 실행을 원할 때 `codex/gpt-*`를 선택하세요. `/model`은 OpenAI provider 자격 증명을 요구하지 않고도 Codex 앱 서버가 반환한 Codex 모델 사이를 전환할 수 있습니다.

운영자 설정, 모델 prefix 예시, 그리고 Codex 전용 config는 [Codex Harness](/ko/plugins/codex-harness)를 참고하세요.

OpenClaw는 Codex app-server `0.118.0` 이상을 요구합니다. Codex Plugin은 app-server 초기화 handshake를 확인하고, 버전이 더 낮거나 버전 정보가 없는 서버를 차단하여 OpenClaw가 테스트된 프로토콜 표면에서만 실행되도록 합니다.

### 네이티브 Codex 하네스 모드

번들된 `codex` 하네스는 내장 OpenClaw 에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들된 `codex` Plugin을 활성화하고, config에서 제한적인 allowlist를 사용한다면 `plugins.allow`에 `codex`를 포함하세요. 이것은 `openai-codex/*`와 다릅니다:

- `openai-codex/*`는 일반적인 OpenClaw provider 경로를 통해 ChatGPT/Codex OAuth를 사용합니다.
- `codex/*`는 번들된 Codex provider를 사용하고 턴을 Codex app-server를 통해 라우팅합니다.

이 모드가 실행되면 Codex는 네이티브 thread id, resume 동작, Compaction, 그리고 app-server 실행을 관리합니다. OpenClaw는 여전히 chat channel, 표시되는 transcript 미러, tool 정책, 승인, media 전달, 그리고 session 선택을 관리합니다. 오직 Codex app-server 경로만 실행을 맡을 수 있음을 증명해야 한다면 `embeddedHarness.runtime: "codex"`와 `embeddedHarness.fallback: "none"`을 사용하세요. 이 config는 선택 가드일 뿐입니다. Codex app-server 실패는 이미 PI를 통해 재시도하지 않고 직접 실패하기 때문입니다.

## PI fallback 비활성화

기본적으로 OpenClaw는 `agents.defaults.embeddedHarness`를 `{ runtime: "auto", fallback: "pi" }`로 설정하여 내장 에이전트를 실행합니다. `auto` 모드에서는 등록된 Plugin 하네스가 provider/모델 쌍을 맡을 수 있습니다. 일치하는 것이 없으면 OpenClaw는 PI로 fallback합니다.

Plugin 하네스 선택이 누락됐을 때 PI를 사용하는 대신 실패하도록 해야 한다면 `fallback: "none"`을 설정하세요. 선택된 Plugin 하네스의 실패는 이미 즉시 실패합니다. 이것은 명시적인 `runtime: "pi"` 또는 `OPENCLAW_AGENT_RUNTIME=pi`를 막지 않습니다.

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

등록된 어떤 Plugin 하네스든 일치하는 모델을 맡게 하고 싶지만 OpenClaw가 절대로 조용히 PI로 fallback하지 않게 하려면 `runtime: "auto"`를 유지하고 fallback을 비활성화하세요:

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

`OPENCLAW_AGENT_RUNTIME`는 여전히 config된 runtime을 override합니다. 환경에서 PI fallback을 비활성화하려면 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 사용하세요.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback이 비활성화되면 요청된 하네스가 등록되지 않았거나, 해석된 provider/모델을 지원하지 않거나, 턴 부작용을 생성하기 전에 실패하는 경우 session은 조기에 실패합니다. 이것은 Codex 전용 배포와 실제로 Codex app-server 경로가 사용 중임을 증명해야 하는 live 테스트를 위한 의도된 동작입니다.

이 설정은 내장 에이전트 하네스만 제어합니다. image, video, music, TTS, PDF, 또는 기타 provider별 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션과 transcript 미러

하네스는 네이티브 session id, thread id, 또는 데몬 측 resume token을 유지할 수 있습니다. 그 바인딩을 OpenClaw session과 명시적으로 연결된 상태로 유지하고, 사용자에게 보이는 assistant/tool 출력을 계속 OpenClaw transcript에 미러링하세요.

OpenClaw transcript는 다음을 위한 호환성 계층으로 남아 있습니다:

- channel에 보이는 session 기록
- transcript 검색 및 인덱싱
- 이후 턴에서 내장 PI 하네스로 다시 전환
- 일반적인 `/new`, `/reset`, 그리고 session 삭제 동작

하네스가 사이드카 바인딩을 저장한다면, 소유한 OpenClaw session이 reset될 때 OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하세요.

## tool 및 media 결과

코어는 OpenClaw tool 목록을 구성하고 이를 준비된 시도에 전달합니다. 하네스가 동적 tool 호출을 실행할 때는 channel media를 직접 보내지 말고, 하네스 결과 shape를 통해 tool 결과를 반환하세요.

이렇게 하면 text, image, video, music, TTS, 승인, 그리고 메시징 tool 출력이 PI 기반 실행과 동일한 전달 경로를 유지할 수 있습니다.

## 현재 제한 사항

- 공개 import 경로는 일반적이지만, 일부 시도/결과 타입 alias는 호환성을 위해 여전히 `Pi` 이름을 갖고 있습니다.
- 서드파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이 필요해질 때까지는 provider Plugin을 선호하세요.
- 턴 간 하네스 전환은 지원됩니다. 네이티브 tool, 승인, assistant 텍스트, 또는 메시지 전송이 시작된 후에는 턴 도중 하네스를 전환하지 마세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [provider Plugin](/ko/plugins/sdk-provider-plugins)
- [Codex Harness](/ko/plugins/codex-harness)
- [모델 provider](/ko/concepts/model-providers)
