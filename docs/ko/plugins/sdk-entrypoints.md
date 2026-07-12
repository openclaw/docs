---
read_when:
    - defineToolPlugin, definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요합니다
    - 등록 모드(full, setup, CLI 메타데이터)를 이해하려고 합니다.
    - 진입점 옵션을 조회하고 있습니다
sidebarTitle: Entry Points
summary: defineToolPlugin, definePluginEntry, defineChannelPluginEntry 및 defineSetupPluginEntry 참조 자료
title: Plugin 진입점
x-i18n:
    generated_at: "2026-07-12T15:34:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

모든 Plugin은 기본 엔트리 객체를 내보냅니다. SDK는 각 엔트리 형태에 대한 헬퍼인 `defineToolPlugin`, `definePluginEntry`, `defineChannelPluginEntry`, `defineSetupPluginEntry`를 제공합니다.

<Tip>
  **단계별 안내를 찾고 계십니까?** 단계별 가이드는 [도구 Plugin](/ko/plugins/tool-plugins),
  [채널 Plugin](/ko/plugins/sdk-channel-plugins) 또는
  [공급자 Plugin](/ko/plugins/sdk-provider-plugins)을 참조하십시오.
</Tip>

## 패키지 엔트리

설치된 Plugin은 `package.json`의 `openclaw` 필드에서 소스 엔트리와 빌드된 엔트리를 모두 가리킵니다.

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

- `extensions`와 `setupEntry`는 워크스페이스 및 git 체크아웃 개발에 사용되는 소스 엔트리입니다.
- `runtimeExtensions`와 `runtimeSetupEntry`는 설치된 패키지에 우선 사용됩니다. 이를 통해 npm 패키지는 런타임 TypeScript 컴파일을 생략할 수 있습니다.
- `runtimeExtensions`가 있으면 배열 길이가 `extensions`와 일치해야 합니다(엔트리는 위치에 따라 쌍을 이룹니다). `runtimeSetupEntry`를 사용하려면 `setupEntry`가 필요합니다.
- `runtimeExtensions`/`runtimeSetupEntry` 아티팩트를 선언했지만 해당 파일이 없으면 설치/검색이 패키징 오류로 실패합니다. OpenClaw는 소스로 자동 대체하지 않습니다. 아래의 소스 대체는 런타임 엔트리가 전혀 선언되지 않은 경우에만 적용됩니다.
- 설치된 패키지가 TypeScript 소스 엔트리만 선언하면 OpenClaw는 이에 대응하는 빌드된 `dist/*.js`(또는 `.mjs`/`.cjs`) 피어를 찾아 사용하고, 없으면 TypeScript 소스로 대체합니다.
- 모든 엔트리 경로는 Plugin 패키지 디렉터리 내부에 있어야 합니다. 런타임 엔트리와 추론된 빌드 JS 피어가 있더라도 패키지 외부로 벗어나는 `extensions` 또는 `setupEntry` 소스 경로가 유효해지는 것은 아닙니다.

## `defineToolPlugin`

**가져오기:** `openclaw/plugin-sdk/tool-plugin`

에이전트 도구만 추가하는 Plugin에 사용합니다. 소스를 간결하게 유지하고, TypeBox 스키마에서 구성 및 도구 매개변수 타입을 추론하며, 일반 반환 값을 OpenClaw 도구 결과 형식으로 래핑하고, `openclaw plugins build`가 Plugin 매니페스트(`contracts.tools`, `configSchema`)에 기록하는 정적 메타데이터를 노출합니다.

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

- `configSchema`은 선택 사항입니다. 생략하면 엄격한 빈 객체 스키마를 사용합니다(생성된 매니페스트에는 여전히 `configSchema`이 포함됩니다).
- `execute`는 일반 문자열 또는 JSON 직렬화 가능한 값을 반환합니다. 헬퍼는 이를 텍스트 도구 결과로 래핑하고 `details`를 원본(문자열화하지 않은) 반환 값으로 설정합니다.
- 사용자 지정 도구 결과를 위해 `openclaw/plugin-sdk/tool-results`는 `textResult`와 `jsonResult`를 내보냅니다.
- 도구 이름은 정적이므로 `openclaw plugins build`는 이름을 수동으로 중복 선언하지 않고도 선언된 도구에서 `contracts.tools`를 도출합니다.
- 런타임 로딩은 엄격하게 유지됩니다. 설치된 Plugin에는 여전히 `openclaw.plugin.json`과 `package.json`의 `openclaw.extensions`가 필요합니다. OpenClaw는 누락된 매니페스트 데이터를 추론하기 위해 Plugin 코드를 실행하지 않습니다.

## `definePluginEntry`

**가져오기:** `openclaw/plugin-sdk/plugin-entry`

공급자 Plugin, 고급 도구 Plugin, 훅 Plugin 및 메시징 채널이 **아닌** 모든 항목에 사용합니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| 필드                      | 타입                                                             | 필수 여부 | 기본값           |
| ------------------------- | ---------------------------------------------------------------- | --------- | ---------------- |
| `id`                      | `string`                                                         | 예        | -                |
| `name`                    | `string`                                                         | 예        | -                |
| `description`             | `string`                                                         | 예        | -                |
| `kind`                    | `string` (사용 중단됨, 아래 참조)                                | 아니요    | -                |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요    | 빈 객체 스키마   |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | 아니요    | -                |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | 아니요    | -                |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | 아니요    | -                |
| `register`                | `(api: OpenClawPluginApi) => void`                               | 예        | -                |

- `id`는 `openclaw.plugin.json` 매니페스트와 일치해야 합니다.
- 외부 세션 카탈로그는 `openclaw/plugin-sdk/session-catalog`와 `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`를 사용합니다. 코어가 `sessions.catalog.*` Gateway 메서드를 소유하며, 공급자는 RPC를 등록하지 않고 호스트, 세션 및 정규화된 트랜스크립트 프로젝션을 반환합니다.
- `kind`는 사용 중단되었습니다. 대신 `openclaw.plugin.json` 매니페스트의 `kind` 필드에 배타적 슬롯(`"memory"` 또는 `"context-engine"`)을 선언하십시오. 런타임 엔트리의 `kind`는 이전 Plugin과의 호환성을 위한 대체 수단으로만 남아 있습니다.
- 지연 평가를 위해 `configSchema`을 함수로 지정할 수 있습니다. OpenClaw는 처음 접근할 때 스키마를 해석하고 메모이제이션하므로 비용이 큰 스키마 빌더도 한 번만 실행됩니다.
- `nodeHostCommands` 설명자는 `isAvailable({ config, env })`를 정의할 수 있습니다. `false`를 반환하면 헤드리스 Node의 Gateway 선언에서 해당 명령과 기능이 제외됩니다. OpenClaw는 Node 로컬 시작 구성에 대해 이를 평가하며, 명령 핸들러도 호출될 때 가용성을 계속 검증해야 합니다.

## `defineChannelPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

채널별 연결로 `definePluginEntry`를 래핑합니다. `api.registerChannel({ plugin })`을 자동으로 호출하고, 선택적인 루트 도움말 CLI 메타데이터 연결 지점을 노출하며, 등록 모드에 따라 `registerFull`을 제한합니다.

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

| 필드                  | 타입                                                             | 필수 여부 | 기본값           |
| --------------------- | ---------------------------------------------------------------- | --------- | ---------------- |
| `id`                  | `string`                                                         | 예        | -                |
| `name`                | `string`                                                         | 예        | -                |
| `description`         | `string`                                                         | 예        | -                |
| `plugin`              | `ChannelPlugin`                                                  | 예        | -                |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요    | 빈 객체 스키마   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요    | -                |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요    | -                |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요    | -                |

콜백은 등록 모드별로 실행됩니다(전체 표는 [등록 모드](#registration-mode) 참조).

- `setRuntime`은 `"cli-metadata"`와 `"tool-discovery"`를 제외한 모든 모드에서 실행됩니다. 일반적으로 `createPluginRuntimeStore`를 통해 여기에 런타임 참조를 저장합니다.
- `registerCliMetadata`는 `"cli-metadata"`, `"discovery"`, `"full"`에서 실행됩니다. 채널이 소유한 CLI 설명자의 표준 위치로 사용하면 루트 도움말이 활성화 없이 유지되고, 검색 스냅샷에 정적 명령 메타데이터가 포함되며, 일반 CLI 등록이 전체 Plugin 로드와 호환됩니다.
- `registerFull`은 `"full"`과 `"tool-discovery"`에서만 실행됩니다. `"tool-discovery"`에서는 채널 등록을 **대신하여** 실행됩니다. OpenClaw는 `registerChannel`/`setRuntime`을 완전히 건너뛰고 `registerFull`만 호출하므로, 독립 실행형 도구 검색 또는 실행에 채널이 필요로 하는 모든 공급자/도구 등록은 일반 채널 설정 뒤가 아니라 여기에 있어야 합니다.
- 검색 등록은 활성화하지 않지만, 가져오기를 하지 않는 것은 아닙니다. OpenClaw는 스냅샷을 만들기 위해 신뢰할 수 있는 Plugin 엔트리와 채널 Plugin 모듈을 평가할 수 있습니다. 최상위 가져오기에 부수 효과가 없도록 유지하고 소켓, 클라이언트, 워커 및 서비스는 `"full"` 전용 경로 뒤에 배치하십시오.
- `definePluginEntry`와 마찬가지로 `configSchema`은 지연 팩토리일 수 있습니다. OpenClaw는 처음 접근할 때 해석된 스키마를 메모이제이션합니다.

CLI 등록:

- 루트 CLI 파싱 트리에서 사라지지 않으면서 지연 로드하려는 Plugin 소유 루트 CLI 명령에는 `api.registerCli(..., { descriptors: [...] })`를 사용하십시오. 설명자 이름은 문자 또는 숫자로 시작하고 문자, 숫자, 하이픈, 밑줄로만 구성되어야 합니다. OpenClaw는 다른 형태를 거부하고 도움말을 렌더링하기 전에 설명에서 터미널 제어 시퀀스를 제거합니다. 등록자가 노출하는 모든 최상위 명령 루트를 포함하십시오. `commands`만 사용하면 즉시 로드되는 호환성 경로에 남습니다.
- 페어링된 Node 기능 명령에는 `api.registerNodeCliFeature(...)`를 사용하여 `openclaw nodes` 아래에 배치하십시오(`registerCli(registrar, { parentPath: ["nodes"], ... })`와 동일).
- 그 밖의 중첩된 Plugin 명령에는 `parentPath`를 추가하고 등록자에 전달된 `program` 객체에 명령을 등록하십시오. OpenClaw는 Plugin을 호출하기 전에 이를 상위 명령으로 해석합니다.
- 채널 Plugin의 경우 `registerCliMetadata`에서 CLI 설명자를 등록하고 `registerFull`은 런타임 전용 작업에 집중하도록 유지하십시오.
- `registerFull`이 Gateway RPC 메서드도 등록하는 경우 Plugin별 접두사 아래에 두십시오. 예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 항상 `operator.admin`으로 강제 변환됩니다.

## `defineSetupPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

경량 `setup-entry.ts` 파일에 사용합니다. 런타임이나 CLI 연결 없이 `{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

채널이 비활성화되었거나 구성되지 않았거나 지연 로딩이 활성화된 경우 OpenClaw는 전체 엔트리 대신 이를 로드합니다. 이것이 중요한 경우는 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하십시오.

`defineSetupPluginEntry(...)`를 범위가 좁은 설정 헬퍼 계열과 함께 사용하십시오:

| 가져오기                            | 용도                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | 런타임에 안전한 설정 헬퍼: `createSetupTranslator`, 가져오기에 안전한 설정 패치 어댑터, 조회 참고 출력, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
| `openclaw/plugin-sdk/channel-setup` | 선택적 설치 설정 표면                                                                                                                                                              |
| `openclaw/plugin-sdk/setup-tools`   | 설정/설치 CLI, 아카이브 및 문서 헬퍼                                                                                                                                               |

무거운 SDK, CLI 등록 및 장기 실행 런타임 서비스는
전체 엔트리에 유지하십시오.

설정과 런타임 표면을 분리하는 번들 워크스페이스 채널은 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이를 사용하면 설정
엔트리가 설정에 안전한 플러그인/비밀 값 내보내기를 유지하면서도 런타임
세터를 노출할 수 있습니다.

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
        /* 설정에 안전한 라우트 */
      },
    });
  },
});
```

설정 흐름에서 전체 채널 엔트리가 로드되기 전에 경량 런타임 세터나
설정에 안전한 Gateway 표면이 실제로 필요한 경우에만 사용하십시오.
`registerSetupRuntime`은 `"setup-runtime"` 로드에서만 실행됩니다. 지연된
전체 활성화 전에 반드시 존재해야 하는 구성 전용 라우트 또는 메서드로
제한하십시오.

## 등록 모드

`api.registrationMode`는 플러그인이 어떤 방식으로 로드되었는지 알려줍니다.

| 모드               | 시점                                               | 등록할 항목                                                                                                               |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 정상적인 Gateway 시작                             | 모든 항목                                                                                                                 |
| `"discovery"`      | 읽기 전용 기능 탐색                               | 채널 등록 및 정적 CLI 설명자. 엔트리 코드는 로드될 수 있지만 소켓, 워커, 클라이언트 및 서비스는 건너뜁니다                  |
| `"tool-discovery"` | 특정 플러그인의 도구를 나열하거나 실행하는 범위 지정 로드 | 기능/도구 등록만 수행하며 채널은 활성화하지 않습니다                                                                       |
| `"setup-only"`     | 비활성화되었거나 구성되지 않은 채널               | 채널 등록만 수행                                                                                                          |
| `"setup-runtime"`  | 런타임을 사용할 수 있는 설정 흐름                 | 채널 등록 및 전체 엔트리가 로드되기 전에 필요한 경량 런타임만 등록                                                         |
| `"cli-metadata"`   | 루트 도움말/CLI 메타데이터 캡처                   | CLI 설명자만 등록                                                                                                         |

`defineChannelPluginEntry`는 이 분리를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우 모드를 직접 확인하고
`"tool-discovery"`에서는 채널 등록을 건너뛴다는 점을 기억하십시오.

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

  if (api.registrationMode === "tool-discovery") {
    // 기능 전용 표면(프로바이더/도구)을 등록하며 채널은 등록하지 않습니다.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 무거운 런타임 전용 등록
  api.registerService(/* ... */);
}
```

탐색 모드는 활성화하지 않는 레지스트리 스냅샷을 빌드합니다. OpenClaw가
채널 기능과 정적 CLI 설명자를 등록할 수 있도록 플러그인 엔트리와 채널
플러그인 객체를 계속 평가할 수 있습니다. 탐색 중 모듈 평가는 신뢰할 수
있지만 가볍게 유지하십시오. 최상위 수준에서 네트워크 클라이언트,
하위 프로세스, 리스너, 데이터베이스 연결, 백그라운드 워커, 자격 증명
읽기 또는 기타 라이브 런타임 부작용이 없어야 합니다.

`"setup-runtime"`은 전체 번들 채널 런타임에 다시 진입하지 않고 설정 전용
시작 표면이 존재해야 하는 구간으로 간주하십시오. 적합한 예로는 채널 등록,
설정에 안전한 HTTP 라우트, 설정에 안전한 Gateway 메서드 및 위임된 설정
헬퍼가 있습니다. 무거운 백그라운드 서비스, CLI 등록기 및 프로바이더/클라이언트
SDK 부트스트랩은 여전히 `"full"`에 두어야 합니다.

## 플러그인 형태

OpenClaw는 로드된 플러그인을 등록 동작에 따라 분류합니다.

| 형태                  | 설명                                      |
| --------------------- | ----------------------------------------- |
| **plain-capability**  | 단일 기능 유형(예: 프로바이더 전용)       |
| **hybrid-capability** | 여러 기능 유형(예: 프로바이더 + 음성)     |
| **hook-only**         | 훅만 있고 기능은 없음                     |
| **non-capability**    | 도구/명령/서비스는 있지만 기능은 없음     |

플러그인의 형태를 확인하려면 `openclaw plugins inspect <id>`를 사용하십시오.

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview) - 등록 API 및 하위 경로 참조
- [런타임 헬퍼](/ko/plugins/sdk-runtime) - `api.runtime` 및 `createPluginRuntimeStore`
- [설정 및 구성](/ko/plugins/sdk-setup) - 매니페스트, 설정 엔트리, 지연 로드
- [채널 플러그인](/ko/plugins/sdk-channel-plugins) - `ChannelPlugin` 객체 빌드
- [프로바이더 플러그인](/ko/plugins/sdk-provider-plugins) - 프로바이더 등록 및 훅
