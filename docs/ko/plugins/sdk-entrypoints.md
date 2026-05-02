---
read_when:
    - definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요합니다
    - 등록 모드(전체 vs 설정 vs CLI 메타데이터)를 이해하려는 경우
    - 진입점 옵션을 조회하고 있습니다
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry 및 defineSetupPluginEntry에 대한 참조
title: Plugin 진입점
x-i18n:
    generated_at: "2026-05-02T21:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

모든 Plugin은 기본 entry 객체를 내보냅니다. SDK는 이를 생성하기 위한 세 가지 헬퍼를 제공합니다.

설치된 Plugin의 경우, `package.json`은 가능하면 런타임 로딩이 빌드된 JavaScript를 가리키도록 해야 합니다.

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

`extensions`와 `setupEntry`는 워크스페이스 및 git 체크아웃 개발을 위한 소스 entry로 계속 유효합니다. OpenClaw가 설치된 패키지를 로드할 때는 `runtimeExtensions`와 `runtimeSetupEntry`가 선호되며, 이를 통해 npm 패키지는 런타임 TypeScript 컴파일을 피할 수 있습니다. 명시적인 런타임 entry가 필요합니다. `runtimeSetupEntry`에는 `setupEntry`가 필요하며, `runtimeExtensions` 또는 `runtimeSetupEntry` 아티팩트가 누락되면 소스로 조용히 대체되는 대신 설치/디스커버리가 실패합니다. 설치된 패키지가 TypeScript 소스 entry만 선언하는 경우, OpenClaw는 일치하는 빌드된 `dist/*.js` 피어가 있으면 이를 사용한 뒤 TypeScript 소스로 대체합니다.

모든 entry 경로는 Plugin 패키지 디렉터리 내부에 있어야 합니다. 런타임 entry와 추론된 빌드 JavaScript 피어는 패키지 밖으로 벗어나는 `extensions` 또는 `setupEntry` 소스 경로를 유효하게 만들지 않습니다.

<Tip>
  **둘러보기를 찾고 있나요?** 단계별 가이드는 [Channel Plugin](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugin](/ko/plugins/sdk-provider-plugins)을 참조하세요.
</Tip>

## `definePluginEntry`

**가져오기:** `openclaw/plugin-sdk/plugin-entry`

Provider Plugin, tool Plugin, hook Plugin 및 메시징 채널이 **아닌**
모든 항목에 사용합니다.

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
| `id`           | `string`                                                         | 예   | —                   |
| `name`         | `string`                                                         | 예   | —                   |
| `description`  | `string`                                                         | 예   | —                   |
| `kind`         | `string`                                                         | 아니요 | —                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예   | —                   |

- `id`는 `openclaw.plugin.json` 매니페스트와 일치해야 합니다.
- `kind`는 전용 슬롯 `"memory"` 또는 `"context-engine"`에 사용됩니다.
- `configSchema`는 지연 평가를 위해 함수일 수 있습니다.
- OpenClaw는 첫 접근 시 해당 스키마를 확인하고 메모이즈하므로, 비용이 큰 스키마
  빌더는 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

채널 전용 연결로 `definePluginEntry`를 감쌉니다. 자동으로
`api.registerChannel({ plugin })`을 호출하고, 선택적 루트 도움말 CLI 메타데이터
이음을 노출하며, 등록 모드에 따라 `registerFull`을 게이트합니다.

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
| `id`                  | `string`                                                         | 예   | —                   |
| `name`                | `string`                                                         | 예   | —                   |
| `description`         | `string`                                                         | 예   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 예   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요 | —                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |

- `setRuntime`은 런타임 참조를 저장할 수 있도록 등록 중에 호출됩니다
  (일반적으로 `createPluginRuntimeStore`를 통해). CLI 메타데이터 캡처 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` 및
  `api.registrationMode === "full"` 중에 실행됩니다.
  채널 소유 CLI 디스크립터의 표준 위치로 사용하면 루트 도움말이 비활성화 상태를 유지하고,
  디스커버리 스냅샷에 정적 명령 메타데이터가 포함되며,
  일반 CLI 명령 등록은 전체 Plugin 로드와 계속 호환됩니다.
- 디스커버리 등록은 비활성화 방식이지만 가져오기가 없는 것은 아닙니다. OpenClaw는
  스냅샷을 빌드하기 위해 신뢰된 Plugin entry와 채널 Plugin 모듈을 평가할 수 있으므로,
  최상위 가져오기는 부작용이 없게 유지하고 소켓,
  클라이언트, 워커 및 서비스는 `"full"` 전용 경로 뒤에 두세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. setup 전용 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 지연 팩터리일 수 있으며 OpenClaw는
  첫 접근 시 확인된 스키마를 메모이즈합니다.
- Plugin 소유 루트 CLI 명령의 경우, 루트 CLI 파스 트리에서 사라지지 않으면서 명령을 지연 로드 상태로 유지하려면 `api.registerCli(..., { descriptors: [...] })`를 선호하세요.
  채널 Plugin의 경우 해당 디스크립터를 `registerCliMetadata(...)`에서 등록하고 `registerFull(...)`은 런타임 전용 작업에 집중하게 하는 것을 선호하세요.
- `registerFull(...)`이 Gateway RPC 메서드도 등록하는 경우, Plugin별 접두사에 유지하세요.
  예약된 코어 관리자 네임스페이스(`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`)는 항상
  `operator.admin`으로 강제 변환됩니다.

## `defineSetupPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일에 사용합니다. 런타임 또는 CLI 연결 없이
`{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

채널이 비활성화되어 있거나, 구성되지 않았거나, 지연 로딩이 활성화된 경우
OpenClaw는 전체 entry 대신 이를 로드합니다. 이것이 언제 중요한지는
[설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

실제로는 `defineSetupPluginEntry(...)`를 좁은 setup 헬퍼 계열과 함께 사용하세요.

- import-safe setup 패치 어댑터, lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries` 및 위임된 setup 프록시 같은 런타임 안전 setup 헬퍼에는
  `openclaw/plugin-sdk/setup-runtime`
- 선택적 설치 setup 표면에는 `openclaw/plugin-sdk/channel-setup`
- setup/install CLI/archive/docs 헬퍼에는 `openclaw/plugin-sdk/setup-tools`

무거운 SDK, CLI 등록 및 오래 지속되는 런타임 서비스는 전체
entry에 유지하세요.

setup 및 런타임 표면을 분리하는 번들 워크스페이스 채널은 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약을 사용하면
setup entry가 setup-safe Plugin/secrets export를 유지하면서도
런타임 setter를 노출할 수 있습니다.

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

전체 채널 entry가 로드되기 전에 setup 흐름에 가벼운 런타임
setter가 실제로 필요할 때만 해당 번들 계약을 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떻게 로드되었는지 알려 줍니다.

| 모드              | 시점                              | 등록할 항목                                                                                                             |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 일반 Gateway 시작                 | 모든 것                                                                                                                 |
| `"discovery"`     | 읽기 전용 기능 디스커버리         | 채널 등록과 정적 CLI 디스크립터. entry 코드는 로드될 수 있지만 소켓, 워커, 클라이언트 및 서비스는 건너뜁니다 |
| `"setup-only"`    | 비활성화/미구성 채널              | 채널 등록만                                                                                                             |
| `"setup-runtime"` | 런타임을 사용할 수 있는 setup 흐름 | 채널 등록과 전체 entry가 로드되기 전에 필요한 가벼운 런타임만                                                          |
| `"cli-metadata"`  | 루트 도움말 / CLI 메타데이터 캡처 | CLI 디스크립터만                                                                                                        |

`defineChannelPluginEntry`는 이 분리를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우, 직접 모드를 확인하세요.

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

디스커버리 모드는 비활성 레지스트리 스냅샷을 빌드합니다. OpenClaw가 채널
기능과 정적 CLI 디스크립터를 등록할 수 있도록 Plugin entry와 채널 Plugin 객체를
여전히 평가할 수 있습니다. 디스커버리의 모듈 평가는 신뢰되지만 가볍게 처리하세요.
최상위 수준에는 네트워크 클라이언트, 하위 프로세스, 리스너, 데이터베이스
연결, 백그라운드 워커, 자격 증명 읽기 또는 기타 라이브 런타임 부작용이 없어야 합니다.

`"setup-runtime"`은 setup 전용 시작 표면이 전체 번들 채널 런타임에 다시 진입하지 않고
존재해야 하는 구간으로 취급하세요. 채널 등록, setup-safe HTTP 라우트, setup-safe Gateway 메서드 및
위임된 setup 헬퍼가 적합합니다. 무거운 백그라운드 서비스, CLI registrar 및
provider/client SDK 부트스트랩은 여전히 `"full"`에 속합니다.

특히 CLI registrar의 경우:

- registrar가 하나 이상의 루트 명령을 소유하고 OpenClaw가 첫 호출 시 실제 CLI 모듈을 지연 로드하게 하려면 `descriptors`를 사용하세요.
- 해당 디스크립터가 registrar가 노출하는 모든 최상위 명령 루트를 포함하는지 확인하세요.
- 디스크립터 명령 이름은 문자, 숫자, 하이픈, 밑줄로만 구성하고,
  문자 또는 숫자로 시작하게 유지하세요. OpenClaw는 해당 형태를 벗어난 디스크립터 이름을 거부하며,
  도움말을 렌더링하기 전에 설명에서 터미널 제어 시퀀스를 제거합니다.
- 즉시 로드 호환 경로에만 `commands` 단독 사용을 사용하세요.

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 분류합니다.

| 형태                  | 설명                                                |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 하나의 capability 유형(예: provider 전용)           |
| **hybrid-capability** | 여러 capability 유형(예: provider + speech)         |
| **hook-only**         | hook만 있고 capability는 없음                       |
| **non-capability**    | 도구/명령/서비스는 있지만 capability는 없음         |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) — 등록 API 및 하위 경로 참조
- [런타임 헬퍼](/ko/plugins/sdk-runtime) — `api.runtime` 및 `createPluginRuntimeStore`
- [설정 및 구성](/ko/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — `ChannelPlugin` 객체 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) — provider 등록 및 hook
