---
read_when:
    - 새 OpenClaw Plugin을 만들고 싶습니다
    - Plugin 개발을 위한 빠른 시작 가이드가 필요합니다
    - OpenClaw에 새 채널, 제공자, 도구 또는 기타 기능을 추가하고 있습니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 번째 OpenClaw Plugin 만들기
title: Plugin 만들기
x-i18n:
    generated_at: "2026-04-30T06:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin은 OpenClaw를 채널, 모델 제공자,
음성, 실시간 전사, 실시간 보이스, 미디어 이해, 이미지
생성, 비디오 생성, 웹 가져오기, 웹 검색, 에이전트 도구 또는 이러한 기능의
조합으로 확장합니다.

Plugin을 OpenClaw 저장소에 추가할 필요는 없습니다. [ClawHub](/ko/tools/clawhub)에
게시하면 사용자는 `openclaw plugins install <package-name>`으로 설치합니다.
OpenClaw는 먼저 ClawHub를 시도하고, 아직 npm 배포를 사용하는 패키지의 경우
자동으로 npm으로 폴백합니다.

## 사전 요구 사항

- Node >= 22 및 패키지 매니저(npm 또는 pnpm)
- TypeScript(ESM)에 대한 이해
- 저장소 내 Plugin의 경우: 저장소를 클론하고 `pnpm install` 완료

## 어떤 종류의 Plugin인가요?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자(LLM, 프록시 또는 사용자 지정 엔드포인트) 추가
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/ko/plugins/hooks">
    에이전트 도구, 이벤트 훅 또는 서비스 등록 — 아래 계속
  </Card>
</CardGroup>

온보딩/설정이 실행될 때 설치가 보장되지 않는 채널 Plugin의 경우
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface(...)`를
사용하세요. 이는 설치 요구 사항을 알리고 Plugin이 설치될 때까지 실제 설정 쓰기에서
닫힌 상태로 실패하는 설정 어댑터 + 마법사 쌍을 생성합니다.

## 빠른 시작: 도구 Plugin

이 안내에서는 에이전트 도구를 등록하는 최소 Plugin을 만듭니다. 채널 및 제공자
Plugin에는 위에 연결된 전용 가이드가 있습니다.

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

    모든 Plugin에는 설정이 없더라도 매니페스트가 필요하며, 모든 Plugin은
    `activation.onStartup`을 의도적으로 선언해야 합니다. 런타임에 등록되는 도구는
    시작 시 가져오기가 필요하므로 이 예시는 이를 `true`로 설정합니다. 전체 스키마는
    [매니페스트](/ko/plugins/manifest)를 참조하세요. 표준 ClawHub 게시 스니펫은
    `docs/snippets/plugin-publish/`에 있습니다.

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

    `definePluginEntry`는 채널이 아닌 Plugin용입니다. 채널에는
    `defineChannelPluginEntry`를 사용하세요 — [채널 Plugin](/ko/plugins/sdk-channel-plugins)을
    참조하세요. 전체 진입점 옵션은 [진입점](/ko/plugins/sdk-entrypoints)을 참조하세요.

  </Step>

  <Step title="Test and publish">

    **외부 Plugin:** ClawHub로 검증하고 게시한 다음 설치하세요.

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw는 `@myorg/openclaw-my-plugin` 같은 기본 패키지 명세에 대해서도
    npm보다 먼저 ClawHub를 확인합니다. npm은 아직 ClawHub로 마이그레이션하지 않은
    패키지를 위한 폴백으로 유지됩니다.

    **저장소 내 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 배치하세요 — 자동으로 발견됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 기능

단일 Plugin은 `api` 객체를 통해 원하는 수의 기능을 등록할 수 있습니다.

| 기능                   | 등록 메서드                                      | 자세한 가이드                                                                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 텍스트 추론(LLM)       | `api.registerProvider(...)`                      | [제공자 Plugin](/ko/plugins/sdk-provider-plugins)                                  |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | [CLI 백엔드](/ko/gateway/cli-backends)                                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | [채널 Plugin](/ko/plugins/sdk-channel-plugins)                                     |
| 음성(TTS/STT)          | `api.registerSpeechProvider(...)`                | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 실시간 보이스          | `api.registerRealtimeVoiceProvider(...)`         | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | [제공자 Plugin](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 도구 결과 미들웨어     | `api.registerAgentToolResultMiddleware(...)`     | [SDK 개요](/ko/plugins/sdk-overview#registration-api)                              |
| 에이전트 도구          | `api.registerTool(...)`                          | 아래                                                                            |
| 사용자 지정 명령       | `api.registerCommand(...)`                       | [진입점](/ko/plugins/sdk-entrypoints)                                              |
| Plugin 훅              | `api.on(...)`                                    | [Plugin 훅](/ko/plugins/hooks)                                                     |
| 내부 이벤트 훅         | `api.registerHook(...)`                          | [진입점](/ko/plugins/sdk-entrypoints)                                              |
| HTTP 라우트            | `api.registerHttpRoute(...)`                     | [내부 구조](/ko/plugins/architecture-internals#gateway-http-routes)                |
| CLI 하위 명령          | `api.registerCli(...)`                           | [진입점](/ko/plugins/sdk-entrypoints)                                              |

전체 등록 API는 [SDK 개요](/ko/plugins/sdk-overview#registration-api)를 참조하세요.

번들 Plugin은 모델이 출력을 보기 전에 비동기 도구 결과 재작성이 필요할 때
`api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다.
예를 들어 `["pi", "codex"]`와 같이 대상 런타임을
`contracts.agentToolResultMiddleware`에 선언하세요. 이는 신뢰된 번들 Plugin
seam입니다. 외부 Plugin은 OpenClaw가 이 기능에 대한 명시적 신뢰 정책을
확장하지 않는 한 일반 OpenClaw Plugin 훅을 선호해야 합니다.

Plugin이 사용자 지정 Gateway RPC 메서드를 등록하는 경우 Plugin별 접두사에
유지하세요. 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`)는 예약된 상태로 유지되며, Plugin이 더 좁은 범위를
요청하더라도 항상 `operator.admin`으로 해석됩니다.

기억해야 할 훅 가드 의미 체계:

- `before_tool_call`: `{ block: true }`는 종단이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 에이전트 실행을 일시 중지하고 exec 승인 오버레이, Telegram 버튼, Discord 상호작용 또는 모든 채널의 `/approve` 명령을 통해 사용자에게 승인을 요청합니다.
- `before_install`: `{ block: true }`는 종단이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종단이며 더 낮은 우선순위의 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 결정 없음으로 처리됩니다.
- `message_received`: 인바운드 스레드/토픽 라우팅이 필요할 때는 타입이 지정된 `threadId` 필드를 선호하세요. 채널별 추가 정보에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 메타데이터 키보다 타입이 지정된 `replyToId` / `threadId` 라우팅 필드를 선호하세요.

`/approve` 명령은 제한된 폴백으로 exec 및 Plugin 승인을 모두 처리합니다. exec 승인 ID를 찾을 수 없으면 OpenClaw는 동일한 ID를 Plugin 승인에서 다시 시도합니다. Plugin 승인 전달은 설정의 `approvals.plugin`을 통해 독립적으로 구성할 수 있습니다.

사용자 지정 승인 배관이 동일한 제한된 폴백 사례를 감지해야 하는 경우,
승인 만료 문자열을 수동으로 매칭하는 대신 `openclaw/plugin-sdk/error-runtime`의
`isApprovalNotFoundError`를 선호하세요.

예시와 훅 참조는 [Plugin 훅](/ko/plugins/hooks)을 참조하세요.

## 에이전트 도구 등록

도구는 LLM이 호출할 수 있는 타입이 지정된 함수입니다. 필수(항상
사용 가능) 또는 선택 사항(사용자 옵트인)일 수 있습니다.

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

사용자는 설정에서 선택 도구를 활성화합니다.

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 도구 이름은 코어 도구와 충돌해서는 안 됩니다(충돌은 건너뜁니다)
- `parameters` 누락을 포함해 잘못된 등록 객체가 있는 도구는 에이전트 실행을 중단하는 대신 건너뛰고 Plugin 진단에 보고됩니다
- 부작용이 있거나 추가 바이너리 요구 사항이 있는 도구에는 `optional: true`를 사용하세요
- 사용자는 Plugin ID를 `tools.allow`에 추가하여 해당 Plugin의 모든 도구를 활성화할 수 있습니다

## 가져오기 규칙

항상 집중된 `openclaw/plugin-sdk/<subpath>` 경로에서 가져오세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

전체 하위 경로 참조는 [SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

Plugin 안에서는 내부 가져오기에 로컬 배럴 파일(`api.ts`, `runtime-api.ts`)을 사용하고, 자신의 Plugin을 SDK 경로를 통해 가져오지 마세요.

제공자 Plugin의 경우 seam이 정말 범용적이지 않다면 제공자별 헬퍼는 해당 패키지 루트 배럴에 유지하세요. 현재 번들 예시는 다음과 같습니다.

- Anthropic: Claude 스트림 래퍼와 `service_tier` / 베타 헬퍼
- OpenAI: 제공자 빌더, 기본 모델 헬퍼, 실시간 제공자
- OpenRouter: 제공자 빌더 및 온보딩/구성 헬퍼

헬퍼가 하나의 번들 제공자 패키지 안에서만 유용하다면 `openclaw/plugin-sdk/*`로 승격하지 말고 해당 패키지 루트 seam에 유지하세요.

일부 생성된 `openclaw/plugin-sdk/<bundled-id>` 헬퍼 seam은 추적된 소유자 사용 사례가 있을 때 번들 Plugin 유지보수를 위해 여전히 존재합니다. 이것들은 새 서드파티 Plugin의 기본 패턴이 아니라 예약된 표면으로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** 매니페스트가 있으며 유효함</Check>
<Check>진입점이 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 가져오기가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 가져오기가 SDK 자기 가져오기가 아니라 로컬 모듈을 사용함</Check>
<Check>테스트가 통과함(`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check`가 통과함(리포지토리 내 Plugin)</Check>

## 베타 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 주시하고 `Watch` > `Releases`로 구독하세요. 베타 태그는 `v2026.3.N-beta.1`처럼 보입니다. 릴리스 공지를 받으려면 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림을 켤 수도 있습니다.
2. 베타 태그가 나타나는 즉시 해당 태그를 대상으로 Plugin을 테스트하세요. 안정 버전까지의 기간은 보통 몇 시간에 불과합니다.
3. 테스트 후 `plugin-forum` Discord 채널의 Plugin 스레드에 `all good` 또는 무엇이 깨졌는지 게시하세요. 아직 스레드가 없다면 새로 만드세요.
4. 무언가 깨졌다면 제목이 `Beta blocker: <plugin-name> - <summary>`인 이슈를 열거나 업데이트하고 `beta-blocker` 레이블을 적용하세요. 스레드에 이슈 링크를 넣으세요.
5. `fix(<plugin-id>): beta blocker - <summary>` 제목으로 `main`에 대한 PR을 열고, PR과 Discord 스레드 양쪽에 이슈를 링크하세요. 기여자는 PR에 레이블을 붙일 수 없으므로, 제목이 유지보수자와 자동화에 대한 PR 측 신호입니다. PR이 있는 차단 이슈는 병합되며, PR이 없는 차단 이슈는 그대로 배포될 수 있습니다. 유지보수자는 베타 테스트 중 이 스레드들을 주시합니다.
6. 침묵은 정상 신호입니다. 이 기간을 놓치면 수정 사항은 다음 주기에 들어갈 가능성이 높습니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드
  </Card>
  <Card title="제공자 Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자 Plugin 빌드
  </Card>
  <Card title="SDK 개요" icon="book-open" href="/ko/plugins/sdk-overview">
    가져오기 맵 및 등록 API 참조
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, 검색, 하위 에이전트
  </Card>
  <Card title="테스트" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티와 패턴
  </Card>
  <Card title="Plugin 매니페스트" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin 아키텍처](/ko/plugins/architecture) — 내부 아키텍처 심층 분석
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
- [매니페스트](/ko/plugins/manifest) — Plugin 매니페스트 형식
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 빌드
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins) — 제공자 Plugin 빌드
