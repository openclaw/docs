---
read_when:
    - 새 OpenClaw Plugin을 만들고 싶습니다
    - Plugin 개발용 빠른 시작이 필요합니다
    - 새 채널, provider, 도구 또는 기타 capability를 OpenClaw에 추가하는 중입니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw Plugin 만들기
title: Plugin 만들기
x-i18n:
    generated_at: "2026-04-25T06:05:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin은 OpenClaw에 새 capability를 추가합니다: 채널, model provider,
speech, 실시간 transcription, 실시간 음성, 미디어 이해, 이미지
생성, 비디오 생성, 웹 fetch, 웹 검색, 에이전트 도구 또는 이들의 조합입니다.

Plugin을 OpenClaw 리포지토리에 추가할 필요는 없습니다.
[ClawHub](/ko/tools/clawhub) 또는 npm에 게시하면, 사용자는
`openclaw plugins install <package-name>`로 설치합니다. OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 폴백합니다.

## 사전 요구 사항

- Node >= 22 및 패키지 관리자(npm 또는 pnpm)
- TypeScript(ESM)에 대한 익숙함
- 리포지토리 내 Plugin의 경우: 리포지토리를 클론했고 `pnpm install` 완료

## 어떤 종류의 Plugin인가요?

<CardGroup cols={3}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결합니다
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    model provider(LLM, proxy, 또는 사용자 지정 엔드포인트)를 추가합니다
  </Card>
  <Card title="도구 / hook Plugin" icon="wrench" href="/ko/plugins/hooks">
    에이전트 도구, 이벤트 hook 또는 서비스를 등록합니다 — 아래에서 계속
  </Card>
</CardGroup>

온보딩/설정 실행 시 설치가 보장되지 않는 채널 Plugin의 경우,
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface(...)`를 사용하세요. 이 함수는 설치 요구 사항을 알리고, Plugin이 설치되기 전까지 실제 config 쓰기에서는 fail-closed로 실패하는 setup adapter + wizard 쌍을 생성합니다.

## 빠른 시작: 도구 Plugin

이 단계별 안내는 에이전트 도구를 등록하는 최소 Plugin을 만듭니다. 채널 및 provider Plugin은 위에 링크된 전용 가이드를 참고하세요.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    모든 Plugin에는 config가 없어도 매니페스트가 필요합니다. 전체 schema는
    [Manifest](/ko/plugins/manifest)를 참고하세요. 정식 ClawHub
    게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="엔트리 포인트 작성">

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

    `definePluginEntry`는 비채널 Plugin용입니다. 채널의 경우
    `defineChannelPluginEntry`를 사용하세요 — [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참고하세요.
    전체 엔트리 포인트 옵션은 [Entry Points](/ko/plugins/sdk-entrypoints)를 참고하세요.

  </Step>

  <Step title="테스트 및 게시">

    **외부 Plugin:** ClawHub로 검증하고 게시한 뒤 설치합니다:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw는 `@myorg/openclaw-my-plugin` 같은 일반 패키지 지정에 대해서도
    npm보다 먼저 ClawHub를 확인합니다.

    **리포지토리 내 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 두면 자동으로 검색됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin capability

하나의 Plugin은 `api` 객체를 통해 원하는 수의 capability를 등록할 수 있습니다:

| Capability             | 등록 메서드                                     | 자세한 가이드                                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| 텍스트 추론 (LLM)      | `api.registerProvider(...)`                     | [Provider Plugins](/ko/plugins/sdk-provider-plugins)                              |
| CLI 추론 backend       | `api.registerCliBackend(...)`                   | [CLI Backends](/ko/gateway/cli-backends)                                          |
| 채널 / 메시징          | `api.registerChannel(...)`                      | [Channel Plugins](/ko/plugins/sdk-channel-plugins)                                |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 transcription   | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 fetch               | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 검색                | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 도구 결과 middleware   | `api.registerAgentToolResultMiddleware(...)`    | [SDK Overview](/ko/plugins/sdk-overview#registration-api)                         |
| 에이전트 도구          | `api.registerTool(...)`                         | 아래 참조                                                                      |
| 사용자 지정 명령       | `api.registerCommand(...)`                      | [Entry Points](/ko/plugins/sdk-entrypoints)                                       |
| Plugin hook            | `api.on(...)`                                   | [Plugin hooks](/ko/plugins/hooks)                                                 |
| 내부 이벤트 hook       | `api.registerHook(...)`                         | [Entry Points](/ko/plugins/sdk-entrypoints)                                       |
| HTTP 라우트            | `api.registerHttpRoute(...)`                    | [Internals](/ko/plugins/architecture-internals#gateway-http-routes)               |
| CLI 하위 명령          | `api.registerCli(...)`                          | [Entry Points](/ko/plugins/sdk-entrypoints)                                       |

전체 등록 API는 [SDK Overview](/ko/plugins/sdk-overview#registration-api)를 참고하세요.

번들 Plugin은 모델이 출력 결과를 보기 전에 비동기 도구 결과 재작성이 필요할 때 `api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다. 예를 들어 `["pi", "codex"]`처럼 대상 런타임을 `contracts.agentToolResultMiddleware`에 선언하세요. 이는 신뢰된 번들 Plugin seam입니다. 외부 Plugin은 OpenClaw가 이 capability에 대한 명시적 신뢰 정책을 갖추기 전까지는 일반 OpenClaw Plugin hook을 우선 사용해야 합니다.

Plugin이 사용자 지정 gateway RPC 메서드를 등록한다면,
Plugin 전용 접두사에 두세요. 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며,
Plugin이 더 좁은 scope를 요청하더라도 항상 `operator.admin`으로 해결됩니다.

염두에 둘 hook 가드 의미론:

- `before_tool_call`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `before_tool_call`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 에이전트 실행을 일시 중지하고 exec 승인 오버레이, Telegram 버튼, Discord 상호작용, 또는 아무 채널에서나 `/approve` 명령을 통해 사용자 승인 프롬프트를 표시합니다.
- `before_install`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `before_install`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `message_sending`: `{ cancel: false }`는 결정 없음으로 처리됩니다.
- `message_received`: 인바운드 thread/topic 라우팅이 필요하면 채널별 추가 정보용 `metadata`보다 타입 지정 `threadId` 필드를 우선 사용하세요.
- `message_sending`: 채널별 metadata 키보다 타입 지정 `replyToId` / `threadId` 라우팅 필드를 우선 사용하세요.

`/approve` 명령은 exec와 Plugin 승인 모두를 bounded fallback과 함께 처리합니다. exec 승인 id를 찾지 못하면 OpenClaw는 같은 id를 Plugin 승인 경로로 다시 시도합니다. Plugin 승인 전달은 config의 `approvals.plugin`을 통해 독립적으로 구성할 수 있습니다.

사용자 지정 승인 플러밍이 그 동일한 bounded fallback 사례를 감지해야 한다면,
승인 만료 문자열을 수동으로 매칭하지 말고 `openclaw/plugin-sdk/error-runtime`의 `isApprovalNotFoundError`를 사용하세요.

예시 및 hook 참조는 [Plugin hooks](/ko/plugins/hooks)를 참고하세요.

## 에이전트 도구 등록

도구는 LLM이 호출할 수 있는 타입 지정 함수입니다. 항상 사용 가능한 필수 도구이거나, 사용자 opt-in이 필요한 선택적 도구일 수 있습니다:

```typescript
register(api) {
  // 필수 도구 — 항상 사용 가능
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 선택적 도구 — 사용자가 allowlist에 추가해야 함
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

사용자는 config에서 선택적 도구를 활성화합니다:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 도구 이름은 코어 도구와 충돌하면 안 됩니다(충돌 시 건너뜀)
- 부작용이 있거나 추가 바이너리 요구 사항이 있는 도구에는 `optional: true`를 사용하세요
- 사용자는 `tools.allow`에 Plugin id를 추가해 해당 Plugin의 모든 도구를 활성화할 수 있습니다

## import 규칙

항상 집중된 `openclaw/plugin-sdk/<subpath>` 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 잘못된 예: 단일 루트(monolithic root) (deprecated, 제거 예정)
import { ... } from "openclaw/plugin-sdk";
```

전체 하위 경로 참조는 [SDK Overview](/ko/plugins/sdk-overview)를 참고하세요.

Plugin 내부에서는 내부 import를 위해 로컬 배럴 파일(`api.ts`, `runtime-api.ts`)을 사용하세요. 자신의 Plugin을 SDK 경로를 통해 import하면 안 됩니다.

provider Plugin의 경우, seam이 진정으로 일반적인 경우가 아니라면 provider 전용 helper는 해당 패키지 루트 배럴에 두세요. 현재 번들 예시:

- Anthropic: Claude 스트림 래퍼와 `service_tier` / beta helper
- OpenAI: provider builder, 기본 모델 helper, 실시간 provider
- OpenRouter: provider builder와 온보딩/config helper

helper가 하나의 번들 provider 패키지 내부에서만 유용하다면,
`openclaw/plugin-sdk/*`로 승격하지 말고 해당 패키지 루트 seam에 두세요.

일부 생성된 `openclaw/plugin-sdk/<bundled-id>` helper seam은
번들 Plugin 유지 관리와 호환성을 위해 여전히 존재합니다. 예를 들어
`plugin-sdk/feishu-setup` 또는 `plugin-sdk/zalo-setup`이 있습니다.
이들은 새로운 서드파티 Plugin의 기본 패턴이 아니라 예약된 표면으로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** 매니페스트가 존재하고 유효함</Check>
<Check>엔트리 포인트가 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 import가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 import는 SDK self-import가 아니라 로컬 모듈을 사용함</Check>
<Check>테스트 통과 (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` 통과 (리포지토리 내 Plugin)</Check>

## beta 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 확인하고 `Watch` > `Releases`로 구독하세요. beta 태그는 `v2026.3.N-beta.1` 형태입니다. 릴리스 공지를 위해 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림도 켤 수 있습니다.
2. beta 태그가 나타나는 즉시 Plugin을 테스트하세요. stable 전까지의 창은 보통 몇 시간밖에 되지 않습니다.
3. 테스트 후 `plugin-forum` Discord 채널의 Plugin 스레드에 `all good` 또는 무엇이 깨졌는지를 게시하세요. 아직 스레드가 없다면 새로 만드세요.
4. 무언가가 깨졌다면 `Beta blocker: <plugin-name> - <summary>` 제목의 이슈를 열거나 업데이트하고 `beta-blocker` 레이블을 적용하세요. 이슈 링크를 스레드에 넣으세요.
5. `main`을 대상으로 `fix(<plugin-id>): beta blocker - <summary>` 제목의 PR을 열고, PR과 Discord 스레드 둘 다에 이슈를 링크하세요. 기여자는 PR에 레이블을 붙일 수 없으므로, 제목이 maintainer와 자동화에 대한 PR 측 신호가 됩니다. PR이 있는 blocker는 병합되고, 그렇지 않은 blocker는 그대로 릴리스될 수 있습니다. maintainer는 beta 테스트 중 이 스레드를 확인합니다.
6. 아무 말이 없으면 정상입니다. 이 창을 놓치면 수정 사항은 다음 주기에 들어갈 가능성이 큽니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 만들기
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    model provider Plugin 만들기
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ko/plugins/sdk-overview">
    import 맵 및 등록 API 참조
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ko/plugins/sdk-runtime">
    `api.runtime`를 통한 TTS, 검색, 하위 에이전트
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 schema 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처 심화 설명
- [SDK Overview](/ko/plugins/sdk-overview) — Plugin SDK 참조
- [Manifest](/ko/plugins/manifest) — plugin 매니페스트 형식
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider Plugin 만들기
