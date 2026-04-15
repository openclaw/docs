---
read_when:
    - definePluginEntry 또는 defineChannelPluginEntry의 정확한 타입 시그니처가 필요합니다.
    - 등록 모드(전체 vs 설정 vs CLI 메타데이터)를 이해하고 싶습니다.
    - 진입점 옵션을 찾고 있습니다.
sidebarTitle: Entry Points
summary: definePluginEntry, defineChannelPluginEntry 및 defineSetupPluginEntry에 대한 참조
title: Plugin 진입점
x-i18n:
    generated_at: "2026-04-15T19:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin 진입점

모든 Plugin은 기본 진입 객체를 내보냅니다. SDK는 이를 만들기 위한 세 가지 헬퍼를 제공합니다.

<Tip>
  **단계별 안내를 찾고 있나요?** 단계별 가이드는 [채널 Plugin](/ko/plugins/sdk-channel-plugins)
  또는 [프로바이더 Plugin](/ko/plugins/sdk-provider-plugins)을 참고하세요.
</Tip>

## `definePluginEntry`

**가져오기:** `openclaw/plugin-sdk/plugin-entry`

프로바이더 Plugin, 도구 Plugin, 훅 Plugin, 그리고 메시징 채널이 **아닌**
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

| 필드           | 타입                                                             | 필수 | 기본값              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 예   | —                   |
| `name`         | `string`                                                         | 예   | —                   |
| `description`  | `string`                                                         | 예   | —                   |
| `kind`         | `string`                                                         | 아니요 | —                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예   | —                   |

- `id`는 `openclaw.plugin.json` 매니페스트와 일치해야 합니다.
- `kind`는 배타적 슬롯에 사용됩니다: `"memory"` 또는 `"context-engine"`.
- `configSchema`는 지연 평가를 위한 함수가 될 수 있습니다.
- OpenClaw는 첫 접근 시 해당 스키마를 해석하고 메모이제이션하므로, 비용이 큰 스키마
  빌더도 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

채널 전용 연결을 추가한 `definePluginEntry` 래퍼입니다. 자동으로
`api.registerChannel({ plugin })`를 호출하고, 선택적인 루트 도움말 CLI 메타데이터
연결 지점을 노출하며, 등록 모드에 따라 `registerFull`을 제어합니다.

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
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요 | —                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |

- `setRuntime`는 등록 중 호출되므로 런타임 참조를 저장할 수 있습니다
  (일반적으로 `createPluginRuntimeStore`를 통해 저장). CLI 메타데이터 수집 중에는
  건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`와
  `api.registrationMode === "full"` 모두에서 실행됩니다.
  루트 도움말이 활성화 없이 유지되면서도 일반 CLI 명령 등록이 전체 Plugin 로드와
  호환되도록, 채널 소유 CLI 디스크립터의 표준 위치로 사용하세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. 설정 전용
  로드 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 지연 팩터리가 될 수 있으며,
  OpenClaw는 첫 접근 시 해석된 스키마를 메모이제이션합니다.
- Plugin 소유 루트 CLI 명령의 경우, 명령이 루트 CLI 파스 트리에서 사라지지 않으면서
  지연 로드 상태를 유지하길 원한다면
  `api.registerCli(..., { descriptors: [...] })`를 우선 사용하세요. 채널 Plugin의 경우
  이러한 디스크립터는 `registerCliMetadata(...)`에서 등록하고,
  `registerFull(...)`은 런타임 전용 작업에 집중하는 것이 좋습니다.
- `registerFull(...)`이 Gateway RPC 메서드도 등록한다면, Plugin 전용 접두사를
  유지하세요. 예약된 코어 관리자 네임스페이스(`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`)는 항상
  `operator.admin`으로 강제됩니다.

## `defineSetupPluginEntry`

**가져오기:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일용입니다. 런타임이나 CLI 연결 없이 `{ plugin }`만
반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw는 채널이 비활성화되었거나, 구성되지 않았거나, 지연 로딩이 활성화된 경우
전체 진입점 대신 이것을 로드합니다. 이것이 언제 중요한지는
[설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참고하세요.

실제로는 `defineSetupPluginEntry(...)`를 다음과 같은 범위가 좁은 설정 헬퍼
계열과 함께 사용하는 것이 좋습니다.

- `openclaw/plugin-sdk/setup-runtime`: import-safe 설정 패치 어댑터,
  조회 노트 출력, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정
  프록시 같은 런타임 안전 설정 헬퍼
- `openclaw/plugin-sdk/channel-setup`: 선택적 설치 설정 표면
- `openclaw/plugin-sdk/setup-tools`: 설정/설치 CLI/아카이브/문서 헬퍼

무거운 SDK, CLI 등록, 장기 실행 런타임 서비스는 전체 진입점에 두세요.

설정 표면과 런타임 표면을 분리하는 번들 워크스페이스 채널은 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약을 사용하면
설정 진입점이 설정 안전 plugin/secrets export를 유지하면서도 런타임 setter를
여전히 노출할 수 있습니다.

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

전체 채널 진입점이 로드되기 전에, 설정 흐름에 정말로 가벼운 런타임 setter가
필요한 경우에만 이 번들 계약을 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떤 방식으로 로드되었는지 알려줍니다.

| 모드              | 시점                              | 등록할 항목                                                                          |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `"full"`          | 일반 Gateway 시작                 | 모든 것                                                                              |
| `"setup-only"`    | 비활성화되었거나 구성되지 않은 채널 | 채널 등록만                                                                        |
| `"setup-runtime"` | 런타임을 사용할 수 있는 설정 흐름 | 채널 등록과 전체 진입점이 로드되기 전에 필요한 가벼운 런타임만 등록                  |
| `"cli-metadata"`  | 루트 도움말 / CLI 메타데이터 수집 | CLI 디스크립터만                                                                    |

`defineChannelPluginEntry`는 이 분기를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우에는 모드를 직접 확인하세요.

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

`"setup-runtime"`은 전체 번들 채널 런타임에 다시 진입하지 않고도 설정 전용 시작
표면이 존재해야 하는 시점으로 취급하세요. 적합한 예로는 채널 등록, 설정 안전 HTTP
라우트, 설정 안전 Gateway 메서드, 위임된 설정 헬퍼가 있습니다. 반면 무거운 백그라운드
서비스, CLI 등록기, 프로바이더/클라이언트 SDK 부트스트랩은 여전히 `"full"`에
속합니다.

특히 CLI 등록기의 경우:

- 등록기가 하나 이상의 루트 명령을 소유하고 있고, 첫 호출 시 OpenClaw가 실제 CLI
  모듈을 지연 로드하길 원한다면 `descriptors`를 사용하세요.
- 해당 디스크립터가 등록기가 노출하는 모든 최상위 명령 루트를 포함하도록 하세요.
- eager 호환 경로에는 `commands`만 사용하세요.

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 분류합니다.

| 형태                  | 설명                                              |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | 하나의 capability 유형만 가짐(예: provider 전용)  |
| **hybrid-capability** | 여러 capability 유형을 가짐(예: provider + speech) |
| **hook-only**         | capability 없이 hook만 가짐                       |
| **non-capability**    | 도구/명령/서비스는 있지만 capability는 없음       |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) — 등록 API 및 하위 경로 참조
- [런타임 헬퍼](/ko/plugins/sdk-runtime) — `api.runtime` 및 `createPluginRuntimeStore`
- [설정 및 구성](/ko/plugins/sdk-setup) — 매니페스트, 설정 진입점, 지연 로딩
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — `ChannelPlugin` 객체 만들기
- [프로바이더 Plugin](/ko/plugins/sdk-provider-plugins) — 프로바이더 등록 및 훅
