---
read_when:
    - definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요한 경우
    - 등록 모드(full vs setup vs CLI 메타데이터)를 이해하려는 경우
    - 진입점 옵션을 찾고 있는 경우
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry 및 defineSetupPluginEntry 참조
title: Plugin 진입점
x-i18n:
    generated_at: "2026-04-25T06:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

모든 Plugin은 기본 엔트리 객체를 export합니다. SDK는 이를 만들기 위한 세 가지 helper를 제공합니다.

설치된 Plugin의 경우 `package.json`은 가능하면 런타임 로딩이 빌드된
JavaScript를 가리키도록 해야 합니다:

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

`extensions`와 `setupEntry`는 workspace 및 git
checkout 개발을 위한 유효한 소스 엔트리로 계속 유지됩니다. `runtimeExtensions`와 `runtimeSetupEntry`는 OpenClaw가 설치된 패키지를 로드할 때 우선되며, npm 패키지가 런타임 TypeScript 컴파일을 피할 수 있게 해줍니다. 설치된 패키지가 TypeScript
소스 엔트리만 선언한 경우, OpenClaw는 일치하는 빌드된 `dist/*.js` peer가 있으면 그것을 사용하고, 없으면 TypeScript 소스로 fallback합니다.

모든 엔트리 경로는 Plugin 패키지 디렉터리 내부에 있어야 합니다. 런타임 엔트리와
추론된 빌드 JavaScript peer가 있다고 해서 패키지 밖으로 벗어나는
`extensions` 또는 `setupEntry` 소스 경로가 유효해지지는 않습니다.

<Tip>
  **실습 가이드를 찾고 있나요?** [Channel Plugins](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugins](/ko/plugins/sdk-provider-plugins)에서 단계별 가이드를 확인하세요.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

provider Plugin, 도구 Plugin, hook Plugin, 그리고 메시징 채널이 **아닌**
모든 것에 사용합니다.

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

| 필드           | 타입                                                             | 필수 여부 | 기본값              |
| -------------- | ---------------------------------------------------------------- | --------- | ------------------- |
| `id`           | `string`                                                         | 예        | —                   |
| `name`         | `string`                                                         | 예        | —                   |
| `description`  | `string`                                                         | 예        | —                   |
| `kind`         | `string`                                                         | 아니요    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요    | 빈 객체 schema      |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예        | —                   |

- `id`는 `openclaw.plugin.json` manifest와 일치해야 합니다.
- `kind`는 `"memory"` 또는 `"context-engine"` 같은 배타적 슬롯에 사용됩니다.
- `configSchema`는 지연 평가를 위한 함수일 수 있습니다.
- OpenClaw는 첫 접근 시 해당 schema를 해석하고 메모이즈하므로, 비용이 큰 schema
  builder도 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

채널 전용 연결을 포함해 `definePluginEntry`를 감쌉니다. 자동으로
`api.registerChannel({ plugin })`를 호출하고, 선택적인 루트 도움말 CLI 메타데이터 seam을 노출하며, 등록 모드에 따라 `registerFull`을 제어합니다.

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

| 필드                  | 타입                                                             | 필수 여부 | 기본값              |
| --------------------- | ---------------------------------------------------------------- | --------- | ------------------- |
| `id`                  | `string`                                                         | 예        | —                   |
| `name`                | `string`                                                         | 예        | —                   |
| `description`         | `string`                                                         | 예        | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 예        | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요    | 빈 객체 schema      |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요    | —                   |

- `setRuntime`는 등록 중에 호출되므로 런타임 참조를 저장할 수 있습니다
  (일반적으로 `createPluginRuntimeStore` 사용). CLI 메타데이터
  캡처 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, 그리고
  `api.registrationMode === "full"`일 때 실행됩니다.
  루트 도움말이 비활성화 상태를 유지하고, discovery 스냅샷에 정적 명령 메타데이터가 포함되며,
  일반 CLI 명령 등록이 전체 Plugin 로드와 호환되도록 하려면 채널 소유 CLI descriptor의 정식 위치로 이를 사용하세요.
- Discovery 등록은 비활성화 상태이지만 import-free는 아닙니다. OpenClaw는
  신뢰된 Plugin 엔트리와 채널 Plugin 모듈을 평가해 스냅샷을 구성할 수 있으므로,
  최상위 import는 부작용이 없게 유지하고 socket,
  client, worker, service는 `"full"` 전용 경로 뒤에 두세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. setup-only 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 lazy factory일 수 있고 OpenClaw는 첫 접근 시 해석된 schema를 메모이즈합니다.
- Plugin 소유 루트 CLI 명령의 경우, 명령이 루트 CLI 파스 트리에서 사라지지 않으면서 lazy-loaded 상태를 유지하길 원하면 `api.registerCli(..., { descriptors: [...] })`를 우선 사용하세요. 채널 Plugin의 경우 이러한 descriptor는 `registerCliMetadata(...)`에서 등록하고, `registerFull(...)`은 런타임 전용 작업에 집중시키는 것이 좋습니다.
- `registerFull(...)`이 gateway RPC 메서드도 등록하는 경우,
  이를 Plugin 전용 접두사 아래에 두세요. 예약된 코어 관리자 네임스페이스(`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`)는 항상
  `operator.admin`으로 강제됩니다.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일용입니다. 런타임 또는 CLI 연결 없이
`{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw는 채널이 비활성화되었거나, 구성되지 않았거나, deferred loading이 활성화된 경우 전체 엔트리 대신 이것을 로드합니다. 이것이 중요한 시점은
[Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참조하세요.

실제로는 `defineSetupPluginEntry(...)`를 좁은 setup helper
계열과 함께 사용하는 것이 좋습니다:

- `openclaw/plugin-sdk/setup-runtime`은 import-safe setup patch adapter,
  lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy 같은 런타임 안전 setup helper용
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 setup 인터페이스용
- `openclaw/plugin-sdk/setup-tools`는 setup/install CLI/archive/docs helper용

무거운 SDK, CLI 등록, 오래 실행되는 런타임 서비스는 전체
엔트리에 유지하세요.

setup과 runtime 인터페이스를 분리하는 번들 workspace 채널은
대신 `openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약을 사용하면
setup 엔트리가 setup-safe plugin/secrets export를 유지하면서도 런타임 setter를 노출할 수 있습니다:

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
});
```

이 번들 계약은 전체 채널 엔트리가 로드되기 전에 setup 흐름에 정말로 가벼운 런타임
setter가 필요할 때만 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떻게 로드되었는지를 알려줍니다:

| 모드              | 시점                               | 등록할 항목                                                                                                            |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 일반 Gateway 시작                  | 모든 것                                                                                                               |
| `"discovery"`     | 읽기 전용 capability discovery     | 채널 등록 + 정적 CLI descriptor. 엔트리 코드는 로드될 수 있지만 socket, worker, client, service는 건너뜀            |
| `"setup-only"`    | 비활성화/미구성 채널               | 채널 등록만                                                                                                           |
| `"setup-runtime"` | 런타임을 사용할 수 있는 setup 흐름 | 채널 등록 + 전체 엔트리가 로드되기 전에 필요한 가벼운 런타임만                                                        |
| `"cli-metadata"`  | 루트 도움말 / CLI 메타데이터 캡처  | CLI descriptor만                                                                                                      |

`defineChannelPluginEntry`는 이 분기를 자동으로 처리합니다. 채널에서
`definePluginEntry`를 직접 사용하는 경우 직접 모드를 확인하세요:

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

  // 무거운 런타임 전용 등록
  api.registerService(/* ... */);
}
```

Discovery 모드는 비활성화 상태의 레지스트리 스냅샷을 구성합니다. OpenClaw가 채널
capability와 정적 CLI descriptor를 등록할 수 있도록 Plugin 엔트리와 채널 Plugin 객체를 여전히 평가할 수 있습니다. discovery에서의 모듈 평가는
신뢰되지만 가벼워야 합니다: 최상위 레벨에서 네트워크 client,
하위 프로세스, listener, 데이터베이스 연결, 백그라운드 worker, credential 읽기, 기타 라이브 런타임 부작용은 없어야 합니다.

`"setup-runtime"`은 setup 전용 시작 인터페이스가 전체 번들 채널 런타임을 다시 진입하지 않고도
존재해야 하는 시점으로 취급하세요. 적합한 예는
채널 등록, setup-safe HTTP route, setup-safe gateway method, delegated setup helper입니다. 무거운 백그라운드 서비스, CLI registrar, provider/client SDK 부트스트랩은 여전히 `"full"`에 속합니다.

특히 CLI registrar의 경우:

- registrar가 하나 이상의 루트 명령을 소유하고 있고
  첫 호출 시 OpenClaw가 실제 CLI 모듈을 lazy-load하길 원하면 `descriptors`를 사용하세요
- 해당 descriptor가 registrar가 노출하는 모든 최상위 명령 루트를
  포괄하는지 확인하세요
- descriptor 명령 이름은 문자, 숫자, 하이픈, 밑줄만 사용하고,
  문자 또는 숫자로 시작해야 합니다. OpenClaw는 이 형태를 벗어난 descriptor 이름을 거부하고
  도움말 렌더링 전에 설명에서 터미널 제어 시퀀스를 제거합니다
- `commands`만 사용하는 방식은 eager 호환 경로에만 사용하세요

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 분류합니다:

| 형태                  | 설명                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 하나의 capability 유형만 가짐(예: provider 전용)   |
| **hybrid-capability** | 여러 capability 유형을 가짐(예: provider + speech) |
| **hook-only**         | capability 없이 hook만 가짐                        |
| **non-capability**    | capability 없이 도구/명령어/서비스만 가짐          |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 항목

- [SDK Overview](/ko/plugins/sdk-overview) — 등록 API 및 subpath 참조
- [Runtime Helpers](/ko/plugins/sdk-runtime) — `api.runtime` 및 `createPluginRuntimeStore`
- [Setup and Config](/ko/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — `ChannelPlugin` 객체 빌드
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider 등록 및 hook
