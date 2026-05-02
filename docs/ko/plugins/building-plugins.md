---
read_when:
    - 새 OpenClaw Plugin을 만들려고 합니다
    - Plugin 개발을 위한 빠른 시작 가이드가 필요합니다
    - OpenClaw에 새로운 채널, 제공자, 도구 또는 기타 기능을 추가하고 있습니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw Plugin 만들기
title: Plugin 빌드하기
x-i18n:
    generated_at: "2026-05-02T20:57:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin은 OpenClaw에 채널, 모델 제공자, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 동영상 생성, 웹 가져오기, 웹 검색, 에이전트 도구 또는 이들의 조합 같은 새로운 기능을 추가합니다.

Plugin을 OpenClaw 저장소에 추가할 필요는 없습니다. [ClawHub](/ko/tools/clawhub)에 게시하면 사용자는 `openclaw plugins install clawhub:<package-name>`로 설치합니다. 출시 전환 기간에는 bare 패키지 명세도 여전히 npm에서 설치됩니다.

## 사전 요구 사항

- Node >= 22 및 패키지 관리자(npm 또는 pnpm)
- TypeScript(ESM)에 대한 이해
- 저장소 내부 Plugin의 경우: 저장소를 클론하고 `pnpm install` 완료. 소스 체크아웃 Plugin 개발은 pnpm 전용입니다. OpenClaw가 `extensions/*` workspace 패키지에서 번들 Plugin을 로드하기 때문입니다.

## 어떤 종류의 Plugin인가요?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결합니다.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자(LLM, 프록시 또는 사용자 지정 엔드포인트)를 추가합니다.
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/ko/plugins/hooks">
    에이전트 도구, 이벤트 훅 또는 서비스를 등록합니다 — 아래를 계속 읽으세요.
  </Card>
</CardGroup>

온보딩/설정이 실행될 때 설치되어 있다고 보장할 수 없는 채널 Plugin의 경우 `openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface(...)`를 사용하세요. 이 함수는 설치 요구 사항을 알리고, Plugin이 설치될 때까지 실제 설정 쓰기를 닫힌 상태로 실패시키는 설정 어댑터 + 마법사 쌍을 생성합니다.

## 빠른 시작: 도구 Plugin

이 안내에서는 에이전트 도구를 등록하는 최소 Plugin을 만듭니다. 채널 및 제공자 Plugin에는 위에 링크된 전용 가이드가 있습니다.

<Steps>
  <Step title="Create the package and manifest">
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

    모든 Plugin에는 설정이 없더라도 manifest가 필요합니다. 런타임에 등록되는 도구는 `contracts.tools`에 나열해야 OpenClaw가 모든 Plugin 런타임을 로드하지 않고도 소유 Plugin을 찾을 수 있습니다. Plugin은 `activation.onStartup`도 의도적으로 선언해야 합니다. 이 예시는 값을 `true`로 설정합니다. 전체 스키마는 [Manifest](/ko/plugins/manifest)를 참고하세요. 정식 ClawHub 게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="Write the entry point">

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

    `definePluginEntry`는 채널이 아닌 Plugin용입니다. 채널에는 `defineChannelPluginEntry`를 사용하세요 — [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참고하세요. 전체 진입점 옵션은 [Entry Points](/ko/plugins/sdk-entrypoints)를 참고하세요.

  </Step>

  <Step title="Test and publish">

    **외부 Plugin:** ClawHub로 검증하고 게시한 뒤 설치합니다.

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` 같은 bare 패키지 명세는 출시 전환 기간에 npm에서 설치됩니다. ClawHub 해석을 원할 때는 `clawhub:`를 사용하세요.

    **저장소 내부 Plugin:** 번들 Plugin workspace 트리 아래에 배치하면 자동으로 발견됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 기능

단일 Plugin은 `api` 객체를 통해 원하는 수의 기능을 등록할 수 있습니다.

| 기능                   | 등록 메서드                                     | 상세 가이드                                                                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 텍스트 추론(LLM)       | `api.registerProvider(...)`                      | [Provider Plugins](/ko/plugins/sdk-provider-plugins)                               |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | [CLI Backends](/ko/gateway/cli-backends)                                           |
| 채널 / 메시징          | `api.registerChannel(...)`                       | [Channel Plugins](/ko/plugins/sdk-channel-plugins)                                 |
| 음성(TTS/STT)          | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 동영상 생성            | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 도구 결과 middleware   | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/ko/plugins/sdk-overview#registration-api)                          |
| 에이전트 도구          | `api.registerTool(...)`                          | 아래                                                                            |
| 사용자 지정 명령       | `api.registerCommand(...)`                       | [Entry Points](/ko/plugins/sdk-entrypoints)                                        |
| Plugin 훅              | `api.on(...)`                                    | [Plugin hooks](/ko/plugins/hooks)                                                  |
| 내부 이벤트 훅         | `api.registerHook(...)`                          | [Entry Points](/ko/plugins/sdk-entrypoints)                                        |
| HTTP 경로              | `api.registerHttpRoute(...)`                     | [Internals](/ko/plugins/architecture-internals#gateway-http-routes)                |
| CLI 하위 명령          | `api.registerCli(...)`                           | [Entry Points](/ko/plugins/sdk-entrypoints)                                        |

전체 등록 API는 [SDK Overview](/ko/plugins/sdk-overview#registration-api)를 참고하세요.

번들 Plugin은 모델이 출력을 보기 전에 비동기 도구 결과 재작성이 필요할 때 `api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다. 대상 런타임을 `contracts.agentToolResultMiddleware`에 선언하세요. 예: `["pi", "codex"]`. 이는 신뢰되는 번들 Plugin 연결점입니다. OpenClaw가 이 기능에 대한 명시적 신뢰 정책을 확장하기 전까지 외부 Plugin은 일반 OpenClaw Plugin 훅을 선호해야 합니다.

Plugin이 사용자 지정 Gateway RPC 메서드를 등록한다면 Plugin별 접두사에 유지하세요. 핵심 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 유지되며, Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 해석됩니다.

기억해야 할 훅 가드 의미 체계:

- `before_tool_call`: `{ block: true }`는 종단 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 에이전트 실행을 일시 중지하고 exec 승인 오버레이, Telegram 버튼, Discord 상호작용 또는 모든 채널의 `/approve` 명령을 통해 사용자에게 승인을 요청합니다.
- `before_install`: `{ block: true }`는 종단 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종단 상태이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 결정 없음으로 처리됩니다.
- `message_received`: 인바운드 스레드/주제 라우팅이 필요할 때는 타입이 지정된 `threadId` 필드를 선호하세요. 채널별 추가 정보에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 metadata 키보다 타입이 지정된 `replyToId` / `threadId` 라우팅 필드를 선호하세요.

`/approve` 명령은 제한된 fallback으로 exec 승인과 Plugin 승인을 모두 처리합니다. exec 승인 ID를 찾을 수 없으면 OpenClaw는 같은 ID로 Plugin 승인을 다시 시도합니다. Plugin 승인 전달은 설정의 `approvals.plugin`을 통해 독립적으로 구성할 수 있습니다.

사용자 지정 승인 배관에서 동일한 제한된 fallback 사례를 감지해야 한다면 승인 만료 문자열을 수동으로 매칭하는 대신 `openclaw/plugin-sdk/error-runtime`의 `isApprovalNotFoundError`를 선호하세요.

예시와 훅 참조는 [Plugin hooks](/ko/plugins/hooks)를 참고하세요.

## 에이전트 도구 등록

도구는 LLM이 호출할 수 있는 타입 지정 함수입니다. 필수(항상 사용 가능) 또는 선택 사항(사용자 opt-in)일 수 있습니다.

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

`api.registerTool(...)`로 등록된 모든 도구는 Plugin manifest에도 선언해야 합니다.

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw는 등록된 도구에서 검증된 descriptor를 캡처하고 캐시하므로 Plugin은 manifest에 `description` 또는 스키마 데이터를 중복하지 않습니다. manifest contract는 소유권과 발견만 선언합니다. 실행은 여전히 실제 등록된 도구 구현을 호출합니다.

사용자는 설정에서 선택적 도구를 활성화합니다.

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 도구 이름은 코어 도구와 충돌하면 안 됩니다(충돌하는 항목은 건너뜀)
- 누락된 `parameters`를 포함해 등록 객체 형식이 잘못된 도구는 에이전트 실행을 중단하는 대신 건너뛰고 Plugin 진단에 보고됩니다
- 부작용이나 추가 바이너리 요구 사항이 있는 도구에는 `optional: true`를 사용하세요
- 사용자는 Plugin ID를 `tools.allow`에 추가하여 Plugin의 모든 도구를 활성화할 수 있습니다

## CLI 명령 등록

Plugin은 `api.registerCli`로 루트 `openclaw` 명령 그룹을 추가할 수 있습니다. OpenClaw가 모든 Plugin 런타임을 즉시 로드하지 않고도 명령을 표시하고 라우팅할 수 있도록 모든 최상위 명령 루트에 `descriptors`를 제공하세요.

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

Plugin 내부에서는 내부 가져오기에 로컬 배럴 파일(`api.ts`, `runtime-api.ts`)을 사용하세요. 자체 Plugin을 SDK 경로를 통해 가져오면 안 됩니다.

Provider Plugin의 경우 seam이 정말 범용이 아니라면 제공자별 헬퍼를 해당 패키지 루트 배럴에 유지하세요. 현재 번들 예시는 다음과 같습니다.

- Anthropic: Claude 스트림 래퍼와 `service_tier` / 베타 헬퍼
- OpenAI: 제공자 빌더, 기본 모델 헬퍼, 실시간 제공자
- OpenRouter: 제공자 빌더와 온보딩/구성 헬퍼

헬퍼가 하나의 번들 제공자 패키지 안에서만 유용하다면 `openclaw/plugin-sdk/*`로 승격하지 말고 해당 패키지 루트 seam에 유지하세요.

일부 생성된 `openclaw/plugin-sdk/<bundled-id>` 헬퍼 seam은 추적된 소유자 사용이 있는 경우 번들 Plugin 유지보수를 위해 여전히 존재합니다. 이를 새 타사 Plugin의 기본 패턴이 아니라 예약된 표면으로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** 매니페스트가 있고 유효함</Check>
<Check>진입점이 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 가져오기가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 가져오기는 SDK 자체 가져오기가 아니라 로컬 모듈을 사용함</Check>
<Check>테스트 통과(`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` 통과(리포지토리 내 Plugin)</Check>

## 베타 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 확인하고 `Watch` > `Releases`를 통해 구독하세요. 베타 태그는 `v2026.3.N-beta.1`과 같은 형태입니다. 릴리스 공지를 받기 위해 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림을 켤 수도 있습니다.
2. 베타 태그가 나타나는 즉시 해당 태그에 대해 Plugin을 테스트하세요. 안정 릴리스 전 창구는 일반적으로 몇 시간에 불과합니다.
3. 테스트 후 `plugin-forum` Discord 채널의 Plugin 스레드에 `all good` 또는 깨진 내용을 게시하세요. 아직 스레드가 없다면 하나를 만드세요.
4. 문제가 발생하면 `Beta blocker: <plugin-name> - <summary>` 제목의 이슈를 열거나 업데이트하고 `beta-blocker` 라벨을 적용하세요. 스레드에 이슈 링크를 넣으세요.
5. `main`에 `fix(<plugin-id>): beta blocker - <summary>` 제목의 PR을 열고 PR과 Discord 스레드 양쪽에 이슈를 링크하세요. 기여자는 PR에 라벨을 붙일 수 없으므로 제목이 유지관리자와 자동화를 위한 PR 측 신호입니다. PR이 있는 차단 문제는 병합되며, PR이 없는 차단 문제는 그대로 배포될 수도 있습니다. 유지관리자는 베타 테스트 중에 이 스레드를 확인합니다.
6. 침묵은 정상 신호입니다. 창구를 놓치면 수정 사항은 다음 주기에 반영될 가능성이 높습니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="Channel Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자 Plugin 빌드
  </Card>
  <Card title="SDK 개요" icon="book-open" href="/ko/plugins/sdk-overview">
    가져오기 맵 및 등록 API 참조
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, 검색, 하위 에이전트
  </Card>
  <Card title="테스트" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin 매니페스트" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin 아키텍처](/ko/plugins/architecture) — 내부 아키텍처 심층 분석
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
- [매니페스트](/ko/plugins/manifest) — Plugin 매니페스트 형식
- [Channel Plugin](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) — 제공자 Plugin 빌드
