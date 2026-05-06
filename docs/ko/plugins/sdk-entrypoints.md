---
read_when:
    - definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요합니다
    - 등록 모드(full vs setup vs CLI metadata)를 이해하려는 경우
    - 진입점 옵션을 조회하고 있습니다
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry, defineSetupPluginEntry 참조
title: Plugin 진입점
x-i18n:
    generated_at: "2026-05-06T06:35:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

모든 Plugin은 기본 엔트리 객체를 내보냅니다. SDK는 이를 만들기 위한 세 가지 헬퍼를 제공합니다.

설치된 Plugin의 경우, 가능하면 `package.json`이 런타임 로딩을 빌드된 JavaScript로 가리켜야 합니다.

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

`extensions`와 `setupEntry`는 워크스페이스 및 git 체크아웃 개발을 위한 유효한 소스 엔트리로 유지됩니다. OpenClaw가 설치된 패키지를 로드할 때는 `runtimeExtensions`와 `runtimeSetupEntry`가 선호되며, npm 패키지가 런타임 TypeScript 컴파일을 피할 수 있게 해 줍니다. 명시적 런타임 엔트리는 필수입니다. `runtimeSetupEntry`에는 `setupEntry`가 필요하며, `runtimeExtensions` 또는 `runtimeSetupEntry` 아티팩트가 없으면 소스로 조용히 폴백하는 대신 설치/디스커버리가 실패합니다. 설치된 패키지가 TypeScript 소스 엔트리만 선언한 경우 OpenClaw는 일치하는 빌드된 `dist/*.js` 피어가 있으면 이를 사용한 다음, TypeScript 소스로 폴백합니다.

모든 엔트리 경로는 Plugin 패키지 디렉터리 안에 있어야 합니다. 런타임 엔트리와 추론된 빌드 JavaScript 피어가 디렉터리 밖으로 벗어나는 `extensions` 또는 `setupEntry` 소스 경로를 유효하게 만들지는 않습니다.

<Tip>
  **단계별 안내가 필요하신가요?** 단계별 가이드는 [채널 Plugin](/ko/plugins/sdk-channel-plugins) 또는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을 참고하세요.
</Tip>

## `definePluginEntry`

**가져오기:** `openclaw/plugin-sdk/plugin-entry`

메시징 채널이 **아닌** 제공자 Plugin, 도구 Plugin, 훅 Plugin 및 그 밖의 모든 것에 사용합니다.

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

| 필드           | 타입                                                             | 필수 | 기본값             |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`           | `string`                                                         | 예   | -                  |
| `name`         | `string`                                                         | 예   | -                  |
| `description`  | `string`                                                         | 예   | -                  |
| `kind`         | `string`                                                         | 아니요 | -                |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예   | -                  |

- `id`는 `openclaw.plugin.json` 매니페스트와 일치해야 합니다.
- `kind`는 배타적 슬롯에 사용됩니다: `"memory"` 또는 `"context-engine"`.
- `configSchema`는 지연 평가를 위한 함수일 수 있습니다.
- OpenClaw는 해당 스키마를 처음 접근할 때 해석하고 메모이즈하므로, 비용이 큰 스키마 빌더는 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

채널별 배선으로 `definePluginEntry`를 감쌉니다. `api.registerChannel({ plugin })`을 자동으로 호출하고, 선택적 루트 도움말 CLI 메타데이터 연결 지점을 노출하며, 등록 모드에 따라 `registerFull`을 게이트합니다.

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

| 필드                  | 타입                                                             | 필수 | 기본값             |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `id`                  | `string`                                                         | 예   | -                  |
| `name`                | `string`                                                         | 예   | -                  |
| `description`         | `string`                                                         | 예   | -                  |
| `plugin`              | `ChannelPlugin`                                                  | 예   | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요 | -                |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요 | -                |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요 | -                |

- `setRuntime`은 등록 중에 호출되므로 런타임 참조를 저장할 수 있습니다(일반적으로 `createPluginRuntimeStore`를 통해). CLI 메타데이터 캡처 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`, `api.registrationMode === "discovery"`, 그리고 `api.registrationMode === "full"` 동안 실행됩니다.
  이를 채널 소유 CLI 디스크립터의 표준 위치로 사용하면 루트 도움말이 활성화 없이 유지되고, 디스커버리 스냅샷에 정적 명령 메타데이터가 포함되며, 일반 CLI 명령 등록이 전체 Plugin 로드와 계속 호환됩니다.
- 디스커버리 등록은 활성화하지 않지만, import가 전혀 없는 것은 아닙니다. OpenClaw는 스냅샷을 빌드하기 위해 신뢰할 수 있는 Plugin 엔트리와 채널 Plugin 모듈을 평가할 수 있으므로, 최상위 import에는 부작용이 없게 유지하고 소켓, 클라이언트, 워커, 서비스는 `"full"` 전용 경로 뒤에 두세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. 설정 전용 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 지연 팩터리일 수 있으며, OpenClaw는 해석된 스키마를 처음 접근할 때 메모이즈합니다.
- Plugin 소유 루트 CLI 명령의 경우, 명령이 루트 CLI 파스 트리에서 사라지지 않으면서 지연 로드되기를 원하면 `api.registerCli(..., { descriptors: [...] })`를 선호하세요. 채널 Plugin의 경우 해당 디스크립터를 `registerCliMetadata(...)`에서 등록하고 `registerFull(...)`은 런타임 전용 작업에 집중하는 방식을 선호하세요.
- `registerFull(...)`이 Gateway RPC 메서드도 등록한다면 Plugin별 접두사에 유지하세요. 예약된 코어 관리 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 항상 `operator.admin`으로 강제됩니다.

## `defineSetupPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일에 사용합니다. 런타임 또는 CLI 배선 없이 `{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

채널이 비활성화되었거나 구성되지 않았거나 지연 로딩이 활성화된 경우, OpenClaw는 전체 엔트리 대신 이것을 로드합니다. 이것이 중요한 경우는 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참고하세요.

실제로는 `defineSetupPluginEntry(...)`를 좁은 범위의 설정 헬퍼 패밀리와 함께 사용하세요.

- import 안전 설정 패치 어댑터, 조회 노트 출력, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 같은 런타임 안전 설정 헬퍼에는 `openclaw/plugin-sdk/setup-runtime`
- 선택적 설치 설정 표면에는 `openclaw/plugin-sdk/channel-setup`
- 설정/설치 CLI/아카이브/문서 헬퍼에는 `openclaw/plugin-sdk/setup-tools`

무거운 SDK, CLI 등록, 오래 유지되는 런타임 서비스는 전체 엔트리에 두세요.

설정과 런타임 표면을 분리하는 번들 워크스페이스 채널은 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약은 설정 엔트리가 설정 안전 Plugin/secrets 내보내기를 유지하면서도 런타임 setter를 노출할 수 있게 합니다.

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

전체 채널 엔트리가 로드되기 전에 설정 흐름에서 가벼운 런타임 setter가 정말로 필요한 경우에만 해당 번들 계약을 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떻게 로드되었는지 알려 줍니다.

| 모드              | 시점                              | 등록할 항목                                                                                                        |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `"full"`          | 일반 Gateway 시작                 | 모든 것                                                                                                            |
| `"discovery"`     | 읽기 전용 기능 디스커버리         | 채널 등록과 정적 CLI 디스크립터. 엔트리 코드는 로드될 수 있지만 소켓, 워커, 클라이언트, 서비스는 건너뜁니다 |
| `"setup-only"`    | 비활성화/미구성 채널              | 채널 등록만                                                                                                        |
| `"setup-runtime"` | 런타임을 사용할 수 있는 설정 흐름 | 채널 등록과 전체 엔트리가 로드되기 전에 필요한 가벼운 런타임만                                                   |
| `"cli-metadata"`  | 루트 도움말 / CLI 메타데이터 캡처 | CLI 디스크립터만                                                                                                   |

`defineChannelPluginEntry`는 이 분리를 자동으로 처리합니다. 채널에 `definePluginEntry`를 직접 사용하는 경우 모드를 직접 확인하세요.

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

디스커버리 모드는 활성화하지 않는 레지스트리 스냅샷을 빌드합니다. OpenClaw가 채널 기능과 정적 CLI 디스크립터를 등록할 수 있도록 Plugin 엔트리와 채널 Plugin 객체를 여전히 평가할 수 있습니다. 디스커버리에서의 모듈 평가는 신뢰할 수 있지만 가볍게 취급하세요. 최상위 수준에는 네트워크 클라이언트, 하위 프로세스, 리스너, 데이터베이스 연결, 백그라운드 워커, 자격 증명 읽기 또는 기타 실제 런타임 부작용이 없어야 합니다.

`"setup-runtime"`은 전체 번들 채널 런타임에 다시 진입하지 않고 설정 전용 시작 표면이 존재해야 하는 구간으로 취급하세요. 적합한 대상은 채널 등록, 설정 안전 HTTP 라우트, 설정 안전 Gateway 메서드, 위임된 설정 헬퍼입니다. 무거운 백그라운드 서비스, CLI 등록기, 제공자/클라이언트 SDK 부트스트랩은 여전히 `"full"`에 속합니다.

CLI 등록기에 대해서는 특히 다음을 따르세요.

- 등록기가 하나 이상의 루트 명령을 소유하고 실제 CLI 모듈을 처음 호출 시 OpenClaw가 지연 로드하게 하려면 `descriptors`를 사용하세요
- 해당 디스크립터가 등록기가 노출하는 모든 최상위 명령 루트를 포함하는지 확인하세요
- 디스크립터 명령 이름은 문자, 숫자, 하이픈, 밑줄로만 구성하고 문자 또는 숫자로 시작하게 유지하세요. OpenClaw는 이 형태를 벗어난 디스크립터 이름을 거부하며, 도움말을 렌더링하기 전에 설명에서 터미널 제어 시퀀스를 제거합니다
- 즉시 로드 호환성 경로에만 `commands` 단독 사용을 사용하세요

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 분류합니다.

| 형태                  | 설명                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 하나의 기능 유형(예: provider-only)                |
| **hybrid-capability** | 여러 기능 유형(예: provider + speech)              |
| **hook-only**         | 훅만 있고 기능은 없음                              |
| **non-capability**    | 도구/명령/서비스는 있지만 기능은 없음              |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) - 등록 API 및 하위 경로 참조
- [런타임 헬퍼](/ko/plugins/sdk-runtime) - `api.runtime` 및 `createPluginRuntimeStore`
- [설정 및 구성](/ko/plugins/sdk-setup) - 매니페스트, 설정 엔트리, 지연 로딩
- [Channel Plugin](/ko/plugins/sdk-channel-plugins) - `ChannelPlugin` 객체 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - 제공자 등록 및 훅
