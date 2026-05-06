---
read_when:
    - 새 OpenClaw Plugin을 만들려는 경우
    - Plugin 개발을 위한 빠른 시작 가이드가 필요합니다
    - OpenClaw에 새 채널, 제공자, 도구 또는 기타 기능을 추가하고 있습니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw Plugin 만들기
title: Plugin 만들기
x-i18n:
    generated_at: "2026-05-06T06:34:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin은 채널, 모델 제공자, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지
생성, 비디오 생성, 웹 가져오기, 웹 검색, 에이전트 도구 또는 그 조합 같은 새 기능으로 OpenClaw를 확장합니다.

Plugin을 OpenClaw 저장소에 추가할 필요는 없습니다. [ClawHub](/ko/tools/clawhub)에 게시하면 사용자는
`openclaw plugins install clawhub:<package-name>`로 설치합니다. 베어 패키지 사양은 출시 전환 기간 동안 계속 npm에서 설치됩니다.

## 사전 요구 사항

- Node >= 22 및 패키지 관리자(npm 또는 pnpm)
- TypeScript(ESM)에 대한 이해
- 저장소 내 Plugin의 경우: 저장소를 클론하고 `pnpm install`을 완료해야 합니다. 소스
  체크아웃 Plugin 개발은 pnpm 전용입니다. OpenClaw가 `extensions/*` 워크스페이스 패키지에서 번들 Plugin을 로드하기 때문입니다.

## 어떤 종류의 Plugin인가요?

<CardGroup cols={3}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결합니다.
  </Card>
  <Card title="제공자 Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자(LLM, 프록시 또는 사용자 지정 엔드포인트)를 추가합니다.
  </Card>
  <Card title="도구 / 훅 Plugin" icon="wrench" href="/ko/plugins/hooks">
    에이전트 도구, 이벤트 훅 또는 서비스를 등록합니다 - 아래에서 계속합니다.
  </Card>
</CardGroup>

온보딩/설정이 실행될 때 설치되어 있다는 보장이 없는 채널 Plugin의 경우
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface(...)`를 사용하세요. 이 함수는 설치 요구 사항을 알리고 Plugin이 설치될 때까지 실제 구성 쓰기에서 닫힌 상태로 실패하는 설정 어댑터 + 마법사 쌍을 생성합니다.

## 빠른 시작: 도구 Plugin

이 연습에서는 에이전트 도구를 등록하는 최소 Plugin을 만듭니다. 채널
및 제공자 Plugin은 위에 링크된 전용 가이드가 있습니다.

<Steps>
  <Step title="패키지와 매니페스트 만들기">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    구성 없이도 모든 Plugin에는 매니페스트가 필요합니다. 런타임에 등록되는 도구는
    `contracts.tools`에 나열되어야 OpenClaw가 모든 Plugin 런타임을 로드하지 않고도 소유
    Plugin을 찾을 수 있습니다. Plugin은 `activation.onStartup`도 의도적으로 선언해야 합니다. 이 예제에서는 `true`로 설정합니다. 전체 스키마는
    [매니페스트](/ko/plugins/manifest)를 참조하세요. 표준 ClawHub
    게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="엔트리 포인트 작성하기">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry`는 채널이 아닌 Plugin용입니다. 채널의 경우
    `defineChannelPluginEntry`를 사용하세요 - [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.
    전체 엔트리 포인트 옵션은 [엔트리 포인트](/ko/plugins/sdk-entrypoints)를 참조하세요.

  </Step>

  <Step title="테스트 및 게시">

    **외부 Plugin:** ClawHub로 검증하고 게시한 다음 설치합니다.

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` 같은 베어 패키지 사양은 출시 전환 기간 동안 npm에서 설치됩니다. ClawHub 해석을 원할 때는 `clawhub:`를 사용하세요.

    **저장소 내 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 배치하면 자동으로 검색됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 기능

단일 Plugin은 `api` 객체를 통해 원하는 수의 기능을 등록할 수 있습니다.

| 기능                   | 등록 메서드                                     | 자세한 가이드                                                                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 텍스트 추론(LLM)       | `api.registerProvider(...)`                      | [제공자 Plugin](/ko/plugins/sdk-provider-plugins)                                   |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | [CLI 백엔드](/ko/gateway/cli-backends)                                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | [채널 Plugin](/ko/plugins/sdk-channel-plugins)                                      |
| 음성(TTS/STT)          | `api.registerSpeechProvider(...)`                | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)     |
| 도구 결과 미들웨어     | `api.registerAgentToolResultMiddleware(...)`     | [SDK 개요](/ko/plugins/sdk-overview#registration-api)                               |
| 에이전트 도구          | `api.registerTool(...)`                          | 아래                                                                            |
| 사용자 지정 명령       | `api.registerCommand(...)`                       | [엔트리 포인트](/ko/plugins/sdk-entrypoints)                                        |
| Plugin 훅              | `api.on(...)`                                    | [Plugin 훅](/ko/plugins/hooks)                                                      |
| 내부 이벤트 훅         | `api.registerHook(...)`                          | [엔트리 포인트](/ko/plugins/sdk-entrypoints)                                        |
| HTTP 라우트            | `api.registerHttpRoute(...)`                     | [내부 구조](/ko/plugins/architecture-internals#gateway-http-routes)                |
| CLI 하위 명령          | `api.registerCli(...)`                           | [엔트리 포인트](/ko/plugins/sdk-entrypoints)                                        |

전체 등록 API는 [SDK 개요](/ko/plugins/sdk-overview#registration-api)를 참조하세요.

번들 Plugin은 모델이 출력을 보기 전에 비동기 도구 결과 재작성이 필요할 때
`api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다. 대상 런타임을
`contracts.agentToolResultMiddleware`에 선언하세요. 예:
`["pi", "codex"]`. 이는 신뢰되는 번들 Plugin 연결부입니다. 외부
Plugin은 OpenClaw가 이 기능에 대한 명시적인 신뢰 정책을 확장하기 전까지 일반 OpenClaw Plugin 훅을 선호해야 합니다.

Plugin이 사용자 지정 Gateway RPC 메서드를 등록하는 경우 Plugin별 접두사에 유지하세요. 핵심 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 유지되며 Plugin이 더 좁은 범위를 요청하더라도 항상
`operator.admin`으로 해석됩니다.

염두에 둘 훅 가드 의미 체계:

- `before_tool_call`: `{ block: true }`는 종료 조건이며 우선순위가 낮은 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 에이전트 실행을 일시 중지하고 exec 승인 오버레이, Telegram 버튼, Discord 상호작용 또는 모든 채널의 `/approve` 명령을 통해 사용자에게 승인을 요청합니다.
- `before_install`: `{ block: true }`는 종료 조건이며 우선순위가 낮은 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종료 조건이며 우선순위가 낮은 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 결정 없음으로 처리됩니다.
- `message_received`: 인바운드 스레드/주제 라우팅이 필요할 때는 타입이 지정된 `threadId` 필드를 선호하세요. 채널별 추가 정보에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 메타데이터 키보다 타입이 지정된 `replyToId` / `threadId` 라우팅 필드를 선호하세요.

`/approve` 명령은 제한된 폴백으로 exec 승인과 Plugin 승인을 모두 처리합니다. exec 승인 ID를 찾을 수 없으면 OpenClaw는 같은 ID로 Plugin 승인을 다시 시도합니다. Plugin 승인 전달은 구성의 `approvals.plugin`을 통해 독립적으로 설정할 수 있습니다.

사용자 지정 승인 배관에서 동일한 제한된 폴백 사례를 감지해야 하는 경우 승인 만료 문자열을 수동으로 매칭하는 대신
`openclaw/plugin-sdk/error-runtime`의 `isApprovalNotFoundError`를 선호하세요.

예제와 훅 참조는 [Plugin 훅](/ko/plugins/hooks)을 참조하세요.

## 에이전트 도구 등록

도구는 LLM이 호출할 수 있는 타입 지정 함수입니다. 필수(항상 사용 가능) 또는 선택 사항(사용자 옵트인)일 수 있습니다.

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

`api.registerTool(...)`로 등록된 모든 도구는 Plugin 매니페스트에도 선언되어야 합니다.

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw는 등록된 도구에서 검증된 설명자를 캡처하고 캐시하므로,
Plugin은 매니페스트에서 `description` 또는 스키마 데이터를 중복하지 않습니다.
매니페스트 계약은 소유권과 탐색만 선언하며, 실행은 여전히
실시간으로 등록된 도구 구현을 호출합니다.
`api.registerTool(..., { optional: true })`로 등록된 도구에는
`toolMetadata.<tool>.optional: true`를 설정하여, 해당 도구가 명시적으로 허용 목록에 추가될 때까지
OpenClaw가 해당 Plugin 런타임을 로드하지 않도록 할 수 있습니다.

사용자는 구성에서 선택적 도구를 활성화합니다.

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 도구 이름은 코어 도구와 충돌하면 안 됩니다(충돌은 건너뜁니다)
- 누락된 `parameters`를 포함해 잘못된 등록 객체가 있는 도구는 agent 실행을 중단하는 대신 건너뛰고 Plugin 진단에 보고됩니다
- 부작용이 있거나 추가 바이너리 요구 사항이 있는 도구에는 `optional: true`를 사용하세요
- 사용자는 Plugin id를 `tools.allow`에 추가하여 Plugin의 모든 도구를 활성화할 수 있습니다

## CLI 명령 등록

Plugin은 `api.registerCli`로 루트 `openclaw` 명령 그룹을 추가할 수 있습니다. OpenClaw가 모든 Plugin 런타임을 즉시 로드하지 않고도 명령을 표시하고 라우팅할 수 있도록, 모든 최상위 명령 루트에 `descriptors`를 제공하세요.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

설치 후 런타임 등록을 확인하고 명령을 실행하세요.

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## 가져오기 규칙

항상 집중된 `openclaw/plugin-sdk/<subpath>` 경로에서 가져오세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

전체 하위 경로 참조는 [SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

Plugin 내부에서는 내부 가져오기에 로컬 배럴 파일(`api.ts`, `runtime-api.ts`)을 사용하세요. SDK 경로를 통해 자신의 Plugin을 가져오면 안 됩니다.

provider Plugin의 경우, 그 seam이 진정으로 범용적이지 않다면 provider별 헬퍼를 해당 package-root 배럴에 유지하세요. 현재 번들 예시는 다음과 같습니다.

- Anthropic: Claude 스트림 래퍼 및 `service_tier` / 베타 헬퍼
- OpenAI: provider 빌더, 기본 모델 헬퍼, realtime provider
- OpenRouter: provider 빌더와 온보딩/구성 헬퍼

헬퍼가 하나의 번들 provider 패키지 안에서만 유용하다면, `openclaw/plugin-sdk/*`로 승격하지 말고 해당 package-root seam에 유지하세요.

일부 생성된 `openclaw/plugin-sdk/<bundled-id>` 헬퍼 seam은 추적된 소유자 사용 사례가 있을 때 번들 Plugin 유지 관리를 위해 아직 존재합니다. 이를 새 서드파티 Plugin의 기본 패턴이 아니라 예약된 표면으로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있습니다</Check>
<Check>**openclaw.plugin.json** 매니페스트가 존재하고 유효합니다</Check>
<Check>진입점이 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용합니다</Check>
<Check>모든 가져오기가 집중된 `plugin-sdk/<subpath>` 경로를 사용합니다</Check>
<Check>내부 가져오기가 SDK 자기 가져오기가 아니라 로컬 모듈을 사용합니다</Check>
<Check>테스트가 통과합니다(`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check`가 통과합니다(레포 내부 Plugin)</Check>

## 베타 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 확인하고 `Watch` > `Releases`로 구독하세요. 베타 태그는 `v2026.3.N-beta.1` 형식입니다. 릴리스 공지를 위해 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림을 켤 수도 있습니다.
2. 베타 태그가 나타나면 즉시 Plugin을 해당 태그에 대해 테스트하세요. stable 전까지의 기간은 보통 몇 시간뿐입니다.
3. 테스트 후 `plugin-forum` Discord 채널의 Plugin 스레드에 `all good` 또는 깨진 내용을 게시하세요. 아직 스레드가 없다면 새로 만드세요.
4. 문제가 발생하면 `Beta blocker: <plugin-name> - <summary>` 제목의 이슈를 열거나 업데이트하고 `beta-blocker` 라벨을 적용하세요. 이슈 링크를 스레드에 넣으세요.
5. `fix(<plugin-id>): beta blocker - <summary>` 제목으로 `main` 대상 PR을 열고, PR과 Discord 스레드 모두에 이슈를 링크하세요. 기여자는 PR에 라벨을 지정할 수 없으므로, 제목이 maintainer와 자동화를 위한 PR 측 신호입니다. PR이 있는 blocker는 병합되지만, PR이 없는 blocker는 그대로 릴리스될 수 있습니다. maintainer는 베타 테스트 중 이 스레드를 확인합니다.
6. 침묵은 정상으로 간주됩니다. 기간을 놓치면 수정 사항은 다음 주기에 포함될 가능성이 큽니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin 빌드
  </Card>
  <Card title="SDK 개요" icon="book-open" href="/ko/plugins/sdk-overview">
    가져오기 맵 및 등록 API 참조
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, 검색, subagent
  </Card>
  <Card title="테스트" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티와 패턴
  </Card>
  <Card title="Plugin 매니페스트" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin 아키텍처](/ko/plugins/architecture) - 내부 아키텍처 심층 설명
- [SDK 개요](/ko/plugins/sdk-overview) - Plugin SDK 참조
- [매니페스트](/ko/plugins/manifest) - Plugin 매니페스트 형식
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - 채널 Plugin 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - provider Plugin 빌드
