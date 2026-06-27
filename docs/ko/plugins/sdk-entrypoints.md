---
read_when:
    - defineToolPlugin, definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요합니다
    - 등록 모드(전체, 설정, CLI 메타데이터)를 이해하려고 합니다
    - 진입점 옵션을 조회하고 있습니다
sidebarTitle: Entry Points
summary: defineToolPlugin, definePluginEntry, defineChannelPluginEntry 및 defineSetupPluginEntry 참조
title: Plugin 진입점
x-i18n:
    generated_at: "2026-06-27T17:56:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

모든 Plugin은 기본 엔트리 객체를 내보냅니다. SDK는 이를 생성하기 위한 헬퍼를 제공합니다.

설치된 Plugin의 경우, 사용 가능한 빌드된 JavaScript가 있으면 `package.json`이 런타임 로딩을 해당 파일로 가리켜야 합니다.

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions`와 `setupEntry`는 워크스페이스 및 git 체크아웃 개발을 위한 소스 엔트리로 계속 유효합니다. OpenClaw가 설치된 패키지를 로드할 때는 `runtimeExtensions`와 `runtimeSetupEntry`가 선호되며, npm 패키지가 런타임 TypeScript 컴파일을 피할 수 있게 합니다. 명시적 런타임 엔트리는 필수입니다. `runtimeSetupEntry`에는 `setupEntry`가 필요하며, `runtimeExtensions` 또는 `runtimeSetupEntry` 아티팩트가 없으면 소스로 조용히 폴백하는 대신 설치/디스커버리가 실패합니다. 설치된 패키지가 TypeScript 소스 엔트리만 선언하는 경우, OpenClaw는 일치하는 빌드된 `dist/*.js` 피어가 있으면 이를 사용한 다음 TypeScript 소스로 폴백합니다.

모든 엔트리 경로는 Plugin 패키지 디렉터리 안에 있어야 합니다. 런타임 엔트리와 추론된 빌드된 JavaScript 피어가 있다고 해서 패키지 밖으로 벗어나는 `extensions` 또는 `setupEntry` 소스 경로가 유효해지는 것은 아닙니다.

<Tip>
  **워크스루를 찾고 있나요?** 단계별 가이드는 [도구 Plugin](/ko/plugins/tool-plugins),
  [채널 Plugin](/ko/plugins/sdk-channel-plugins) 또는
  [Provider Plugin](/ko/plugins/sdk-provider-plugins)을 참조하세요.
</Tip>

## `defineToolPlugin`

**가져오기:** `openclaw/plugin-sdk/tool-plugin`

에이전트 도구만 추가하는 간단한 Plugin용입니다. `defineToolPlugin`은 작성 소스를 작게 유지하고, TypeBox 스키마에서 구성 및 도구 매개변수 타입을 추론하며, 일반 반환 값을 OpenClaw 도구 결과 형식으로 래핑하고, `openclaw plugins build`가 Plugin 매니페스트에 쓰는 정적 메타데이터를 노출합니다.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema`는 선택 사항입니다. 생략하면 OpenClaw는 엄격한 빈 객체 스키마를 사용하며, 생성된 매니페스트에는 여전히 `configSchema`가 포함됩니다.
- `execute`는 일반 문자열 또는 JSON 직렬화 가능한 값을 반환합니다. 헬퍼는 이를 `details`가 포함된 텍스트 도구 결과로 래핑합니다.
- 도구 이름은 정적입니다. `openclaw plugins build`는 선언된 도구에서 `contracts.tools`를 파생하므로 작성자가 이름을 수동으로 중복 작성하지 않아도 됩니다.
- 런타임 로딩은 엄격하게 유지됩니다. 설치된 Plugin에는 여전히 `openclaw.plugin.json`과 `package.json`의 `openclaw.extensions`가 필요합니다. OpenClaw는 누락된 매니페스트 데이터를 추론하기 위해 Plugin 코드를 실행하지 않습니다.

## `definePluginEntry`

**가져오기:** `openclaw/plugin-sdk/plugin-entry`

Provider Plugin, 고급 도구 Plugin, 훅 Plugin, 그리고 메시징 채널이 **아닌** 모든 항목용입니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 필드           | 타입                                                             | 필수 | 기본값              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 예   | -                   |
| `name`         | `string`                                                         | 예   | -                   |
| `description`  | `string`                                                         | 예   | -                   |
| `kind`         | `string`                                                         | 아니요 | -                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예   | -                   |

- `id`는 `openclaw.plugin.json` 매니페스트와 일치해야 합니다.
- `kind`는 `"memory"` 또는 `"context-engine"` 같은 독점 슬롯용입니다.
- `configSchema`는 지연 평가를 위한 함수일 수 있습니다.
- OpenClaw는 첫 접근 시 해당 스키마를 해석하고 메모이즈하므로 비용이 큰 스키마 빌더는 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry`를 채널별 배선으로 래핑합니다. 자동으로 `api.registerChannel({ plugin })`을 호출하고, 선택적 루트 도움말 CLI 메타데이터 경계를 노출하며, 등록 모드에 따라 `registerFull`을 제한합니다.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 필드                  | 타입                                                             | 필수 | 기본값              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 예   | -                   |
| `name`                | `string`                                                         | 예   | -                   |
| `description`         | `string`                                                         | 예   | -                   |
| `plugin`              | `ChannelPlugin`                                                  | 예   | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요 | -                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요 | -                 |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요 | -                 |

- `setRuntime`은 런타임 참조를 저장할 수 있도록 등록 중에 호출됩니다(일반적으로 `createPluginRuntimeStore`를 통해). CLI 메타데이터 캡처 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`, `api.registrationMode === "discovery"`, 그리고 `api.registrationMode === "full"` 동안 실행됩니다. 채널 소유 CLI 설명자의 표준 위치로 사용하면 루트 도움말이 활성화 없이 유지되고, 디스커버리 스냅샷에 정적 명령 메타데이터가 포함되며, 일반 CLI 명령 등록이 전체 Plugin 로드와 호환됩니다.
- 디스커버리 등록은 활성화하지 않지만, 가져오기가 없는 것은 아닙니다. OpenClaw는 스냅샷을 만들기 위해 신뢰된 Plugin 엔트리와 채널 Plugin 모듈을 평가할 수 있으므로, 최상위 가져오기는 부작용이 없게 유지하고 소켓, 클라이언트, 워커, 서비스는 `"full"` 전용 경로 뒤에 두세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. 설정 전용 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 지연 팩터리일 수 있으며, OpenClaw는 첫 접근 시 해석된 스키마를 메모이즈합니다.
- Plugin 소유 루트 CLI 명령의 경우, 루트 CLI 파스 트리에서 사라지지 않으면서 명령을 지연 로드 상태로 유지하려면 `api.registerCli(..., { descriptors: [...] })`를 선호하세요. 쌍을 이루는 노드 기능 명령의 경우 명령이 `openclaw nodes` 아래에 배치되도록 `api.registerNodeCliFeature(...)`를 선호하세요. 그 외 중첩된 Plugin 명령의 경우 `parentPath`를 추가하고 등록자에 전달된 `program` 객체에 명령을 등록하세요. OpenClaw는 Plugin을 호출하기 전에 이를 부모 명령으로 해석합니다. 채널 Plugin의 경우 해당 설명자는 `registerCliMetadata(...)`에서 등록하고 `registerFull(...)`은 런타임 전용 작업에 집중하는 방식을 선호하세요.
- `registerFull(...)`이 Gateway RPC 메서드도 등록하는 경우, Plugin별 접두사 아래에 유지하세요. 예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 항상 `operator.admin`으로 강제 변환됩니다.

## `defineSetupPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일용입니다. 런타임 또는 CLI 배선 없이 `{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw는 채널이 비활성화되었거나 구성되지 않았거나 지연 로딩이 활성화된 경우 전체 엔트리 대신 이를 로드합니다. 이것이 중요한 경우는 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

실제로는 `defineSetupPluginEntry(...)`를 좁은 설정 헬퍼 계열과 함께 사용하세요.

- `createSetupTranslator`, 가져오기 안전 설정 패치 어댑터, 조회 노트 출력, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 같은 런타임 안전 설정 헬퍼에는 `openclaw/plugin-sdk/setup-runtime`
- 선택적 설치 설정 표면에는 `openclaw/plugin-sdk/channel-setup`
- 설정/설치 CLI/아카이브/문서 헬퍼에는 `openclaw/plugin-sdk/setup-tools`

무거운 SDK, CLI 등록, 장기 실행 런타임 서비스는 전체 엔트리에 유지하세요.

설정 표면과 런타임 표면을 분리하는 번들 워크스페이스 채널은 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약은 설정 엔트리가 설정 안전 Plugin/시크릿 내보내기를 유지하면서도 런타임 setter를 계속 노출할 수 있게 합니다.

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

설정 흐름에 전체 채널 엔트리가 로드되기 전에 가벼운 런타임 setter 또는 설정 안전 Gateway 표면이 실제로 필요할 때만 해당 번들 계약을 사용하세요. `registerSetupRuntime`은 `"setup-runtime"` 로드에서만 실행됩니다. 지연된 전체 활성화 전에 반드시 존재해야 하는 구성 전용 라우트 또는 메서드로 제한하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떻게 로드되었는지 알려줍니다.

| 모드              | 사용 시점                              | 등록할 항목                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 일반 Gateway 시작            | 모든 항목                                                                                                              |
| `"discovery"`     | 읽기 전용 기능 발견    | 채널 등록과 정적 CLI 설명자; 엔트리 코드는 로드될 수 있지만 소켓, 워커, 클라이언트, 서비스는 건너뜁니다 |
| `"setup-only"`    | 비활성화되었거나 구성되지 않은 채널     | 채널 등록만                                                                                               |
| `"setup-runtime"` | 런타임을 사용할 수 있는 설정 흐름 | 전체 엔트리가 로드되기 전에 필요한 가벼운 런타임만 채널 등록과 함께 등록                               |
| `"cli-metadata"`  | 루트 도움말 / CLI 메타데이터 캡처  | CLI 설명자만                                                                                                    |

`defineChannelPluginEntry`는 이 분리를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우에는 모드를 직접 확인하세요.

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

발견 모드는 활성화되지 않는 레지스트리 스냅샷을 빌드합니다. OpenClaw가 채널
기능과 정적 CLI 설명자를 등록할 수 있도록 Plugin 엔트리와 채널 Plugin 객체를
평가할 수는 있습니다. 발견 중 모듈 평가는 신뢰할 수 있지만 가볍게 유지하세요.
최상위 수준에서 네트워크 클라이언트, 하위 프로세스, 리스너, 데이터베이스
연결, 백그라운드 워커, 자격 증명 읽기 또는 기타 실제 런타임 부작용이 없어야
합니다.

`"setup-runtime"`은 전체 번들 채널 런타임에 다시 진입하지 않고 설정 전용 시작
표면이 존재해야 하는 구간으로 다루세요. 채널 등록, 설정에 안전한 HTTP 라우트,
설정에 안전한 Gateway 메서드, 위임된 설정 헬퍼가 적합합니다. 무거운
백그라운드 서비스, CLI 등록기, 제공자/클라이언트 SDK 부트스트랩은 여전히
`"full"`에 속합니다.

CLI 등록기의 경우에는 특히 다음을 따르세요.

- 등록기가 하나 이상의 루트 명령을 소유하고, OpenClaw가 첫 호출 시 실제 CLI
  모듈을 지연 로드하게 하려면 `descriptors`를 사용하세요
- 해당 설명자가 등록기가 노출하는 모든 최상위 명령 루트를 포괄하는지
  확인하세요
- 설명자 명령 이름은 문자, 숫자, 하이픈, 밑줄만 사용하고 문자 또는 숫자로
  시작해야 합니다. OpenClaw는 이 형태를 벗어난 설명자 이름을 거부하며,
  도움말을 렌더링하기 전에 설명에서 터미널 제어 시퀀스를 제거합니다
- 즉시 로드 호환성 경로에만 `commands` 단독 사용을 적용하세요

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 분류합니다.

| 형태                 | 설명                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 하나의 기능 유형(예: 제공자 전용)           |
| **hybrid-capability** | 여러 기능 유형(예: 제공자 + 음성) |
| **hook-only**         | 훅만 있고 기능은 없음                        |
| **non-capability**    | 도구/명령/서비스는 있지만 기능은 없음        |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview) - 등록 API 및 하위 경로 참조
- [런타임 헬퍼](/ko/plugins/sdk-runtime) - `api.runtime` 및 `createPluginRuntimeStore`
- [설정 및 구성](/ko/plugins/sdk-setup) - 매니페스트, 설정 엔트리, 지연 로딩
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - `ChannelPlugin` 객체 빌드
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins) - 제공자 등록 및 훅
