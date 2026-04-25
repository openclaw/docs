---
read_when:
    - plugin에 setup 마법사 추가하기
    - '`setup-entry.ts`와 `index.ts`의 차이를 이해해야 합니다'
    - plugin config 스키마 또는 package.json `openclaw` 메타데이터 정의하기
sidebarTitle: Setup and Config
summary: setup 마법사, setup-entry.ts, config 스키마 및 package.json 메타데이터
title: plugin setup 및 config
x-i18n:
    generated_at: "2026-04-25T06:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

plugin 패키징(`package.json` 메타데이터), manifest
(`openclaw.plugin.json`), setup 엔트리, config 스키마에 대한 참조 문서입니다.

<Tip>
  **단계별 안내를 찾고 있나요?** how-to 가이드는 문맥 속에서 패키징을 다룹니다:
  [Channel Plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및
  [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 plugin 시스템에
plugin이 무엇을 제공하는지 알려주는 `openclaw` 필드가 필요합니다:

**Channel plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "channel에 대한 짧은 설명."
    }
  }
}
```

**Provider plugin / ClawHub 게시 기준선:**

```json openclaw-clawhub-package.json
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

plugin을 ClawHub에 외부 게시하는 경우, `compat` 및 `build`
필드는 필수입니다. 정식 게시 스니펫은
`docs/snippets/plugin-publish/`에 있습니다.

### `openclaw` 필드

| 필드         | 타입       | 설명                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 엔트리 포인트 파일(패키지 루트 기준 상대 경로)                                                                     |
| `setupEntry` | `string`   | 경량 setup 전용 엔트리(선택 사항)                                                                                   |
| `channel`    | `object`   | setup, 선택기, quickstart, 상태 표면용 channel 카탈로그 메타데이터                                                  |
| `providers`  | `string[]` | 이 plugin이 등록하는 provider id                                                                                    |
| `install`    | `object`   | 설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | 시작 동작 플래그                                                                                                     |

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전
channel 검색 및 setup 표면을 위한 가벼운 패키지 메타데이터입니다.

| 필드                                   | 타입       | 의미                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 정식 channel id.                                                              |
| `label`                                | `string`   | 기본 channel 라벨.                                                            |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때의 선택기/setup 라벨.                                   |
| `detailLabel`                          | `string`   | 더 풍부한 channel 카탈로그 및 상태 표면용 보조 상세 라벨.                    |
| `docsPath`                             | `string`   | setup 및 선택 링크용 문서 경로.                                               |
| `docsLabel`                            | `string`   | channel id와 달라야 할 때 문서 링크에 사용되는 라벨 재정의.                  |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명.                                                    |
| `order`                                | `number`   | channel 카탈로그에서의 정렬 순서.                                             |
| `aliases`                              | `string[]` | channel 선택용 추가 조회 별칭.                                                |
| `preferOver`                           | `string[]` | 이 channel이 우선해야 하는 더 낮은 우선순위의 plugin/channel id.              |
| `systemImage`                          | `string`   | channel UI 카탈로그용 선택적 아이콘/system-image 이름.                        |
| `selectionDocsPrefix`                  | `string`   | 선택 표면에서 문서 링크 앞에 붙는 접두 텍스트.                                |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 라벨이 있는 문서 링크 대신 문서 경로를 직접 표시합니다.         |
| `selectionExtras`                      | `string[]` | 선택 문구에 추가되는 짧은 문자열.                                             |
| `markdownCapable`                      | `boolean`  | 아웃바운드 포맷 결정용으로 channel이 Markdown 가능함을 표시합니다.            |
| `exposure`                             | `object`   | setup, 구성 목록, 문서 표면용 channel 표시 제어.                              |
| `quickstartAllowFrom`                  | `boolean`  | 이 channel을 표준 quickstart `allowFrom` setup 흐름에 참여시킵니다.           |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나만 있어도 명시적 계정 바인딩을 요구합니다.                         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 channel의 announce 대상 확인 시 세션 조회를 우선합니다.                    |

예시:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook 기반 자체 호스팅 채팅 통합.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "가이드:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure`는 다음을 지원합니다:

- `configured`: 구성됨/상태 스타일 목록 표면에 channel 포함
- `setup`: 대화형 setup/configure 선택기에 channel 포함
- `docs`: 문서/탐색 표면에서 channel을 공개 대상으로 표시

`showConfigured`와 `showInSetup`은 레거시 별칭으로 계속 지원됩니다. `exposure` 사용을 권장합니다.

### `openclaw.install`

`openclaw.install`은 manifest 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드                         | 타입                 | 의미                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | install/update 흐름용 정식 npm spec.                                             |
| `localPath`                  | `string`             | 로컬 개발 또는 번들 설치 경로.                                                   |
| `defaultChoice`              | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 선호되는 설치 source.                                       |
| `minHostVersion`             | `string`             | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전.                                        |
| `expectedIntegrity`          | `string`             | 고정 설치용 예상 npm dist 무결성 문자열, 보통 `sha512-...`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | 번들 plugin 재설치 흐름이 특정 오래된 config 실패에서 복구할 수 있게 합니다.     |

대화형 온보딩도 주문형 설치 표면에 `openclaw.install`을 사용합니다.
plugin이 런타임 로드 전에 provider auth 선택이나 channel setup/카탈로그
메타데이터를 노출하면, 온보딩은 해당 선택을 표시하고, npm 대 local 설치를 물은 뒤,
plugin을 설치 또는 활성화하고, 선택된 흐름을 계속 진행할 수 있습니다.
npm 온보딩 선택에는 registry
`npmSpec`이 포함된 신뢰된 카탈로그 메타데이터가 필요합니다. 정확한 버전과 `expectedIntegrity`는
선택적 고정 값입니다. `expectedIntegrity`가 존재하면 install/update 흐름이 이를 강제합니다.
"무엇을 보여줄지" 메타데이터는 `openclaw.plugin.json`에,
"어떻게 설치할지" 메타데이터는 `package.json`에 두세요.

`minHostVersion`이 설정되면 install과 manifest-registry 로딩 모두
이를 강제합니다. 오래된 호스트는 plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.

고정 npm 설치의 경우, 정확한 버전을 `npmSpec`에 유지하고
예상 아티팩트 무결성을 추가하세요:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`는 깨진 config를 위한 일반 우회 수단이 아닙니다.
이 값은 누락된 번들 plugin 경로나 같은 plugin에 대한 오래된 `channels.<id>`
항목처럼 알려진 업그레이드 잔여물을 재설치/setup이 복구할 수 있도록 하는
제한된 번들 plugin 복구 전용입니다. 관련 없는 이유로 config가 깨진 경우,
설치는 여전히 실패를 유지하고 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.

### 전체 로드 지연

channel plugins는 다음과 같이 지연 로딩을 선택할 수 있습니다:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

활성화하면 OpenClaw는 사전 수신 시작 단계에서
이미 구성된 channel에 대해서도 `setupEntry`만 로드합니다.
전체 엔트리는 Gateway가 수신을 시작한 뒤 로드됩니다.

<Warning>
  `setupEntry`가 Gateway가 수신을 시작하기 전에 필요한 모든 항목
  (channel 등록, HTTP 라우트, Gateway 메서드)을 등록하는 경우에만 지연 로딩을 활성화하세요.
  전체 엔트리가 필요한 시작 capability를 소유한다면 기본 동작을 유지하세요.
</Warning>

setup/전체 엔트리가 Gateway RPC 메서드를 등록하는 경우,
plugin별 prefix를 유지하세요. 예약된 core admin 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 계속 core가 소유하며
항상 `operator.admin`으로 확인됩니다.

## Plugin manifest

모든 네이티브 plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다.
OpenClaw는 이를 사용해 plugin 코드를 실행하지 않고 config를 검증합니다.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClaw에 My Plugin capability를 추가합니다",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook 검증 시크릿"
      }
    }
  }
}
```

channel plugins의 경우 `kind`와 `channels`를 추가하세요:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

config가 전혀 없는 plugins도 스키마를 포함해야 합니다. 빈 스키마도 유효합니다:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin Manifest](/ko/plugins/manifest)를 참조하세요.

## ClawHub 게시

plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

레거시 skill 전용 게시 별칭은 Skills용입니다. plugin 패키지는
항상 `clawhub package publish`를 사용해야 합니다.

## setup 엔트리

`setup-entry.ts` 파일은
OpenClaw가 setup 표면만 필요할 때(온보딩, config 복구,
비활성화된 channel 검사) 로드하는 `index.ts`의 경량 대체 엔트리입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 setup 흐름 중에 무거운 런타임 코드(crypto 라이브러리, CLI 등록,
백그라운드 서비스)를 로드하지 않아도 됩니다.

sidecar 모듈에 setup-safe export를 유지하는 번들 작업 공간 channel은
`defineSetupPluginEntry(...)` 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.
이 번들 계약은 선택적 `runtime` export도 지원하므로 setup 시점 런타임 연결을
가볍고 명시적으로 유지할 수 있습니다.

**OpenClaw가 전체 엔트리 대신 `setupEntry`를 사용하는 경우:**

- channel이 비활성화되어 있지만 setup/온보딩 표면이 필요한 경우
- channel이 활성화되어 있지만 구성되지 않은 경우
- 지연 로딩이 활성화된 경우 (`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`가 반드시 등록해야 하는 항목:**

- channel plugin 객체 (`defineSetupPluginEntry`를 통해)
- Gateway 수신 전에 필요한 모든 HTTP 라우트
- 시작 중에 필요한 모든 Gateway 메서드

이러한 시작 Gateway 메서드도 여전히 `config.*` 또는 `update.*` 같은
예약된 core admin 네임스페이스는 피해야 합니다.

**`setupEntry`에 포함하면 안 되는 항목:**

- CLI 등록
- 백그라운드 서비스
- 무거운 런타임 import(crypto, SDK)
- 시작 이후에만 필요한 Gateway 메서드

### 좁은 setup 도우미 import

뜨거운 setup 전용 경로에서는 setup 표면의 일부만 필요한 경우
더 넓은 `plugin-sdk/setup` umbrella 대신 좁은 setup 도우미 경계를 우선 사용하세요:

| Import 경로                        | 용도                                                                                     | 주요 export                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연 channel 시작에서도 사용 가능한 setup 시점 런타임 도우미              | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 계정 setup 어댑터                                                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs 도우미                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은
config 패치 도우미를 포함해 전체 공유 setup
도구 상자가 필요할 때는 더 넓은 `plugin-sdk/setup` 경계를 사용하세요.

setup 패치 어댑터는 import 시에도 hot-path 안전성을 유지합니다. 해당 번들의
단일 계정 승격 contract-surface 조회는 지연되므로
`plugin-sdk/setup-runtime`을 import해도 어댑터가 실제로 사용되기 전에
번들 contract-surface 검색을 즉시 로드하지 않습니다.

### channel 소유 단일 계정 승격

channel이 단일 계정 최상위 config에서
`channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격된
계정 범위 값을 `accounts.default`로 옮기는 것입니다.

번들 channels는 setup
계약 표면을 통해 이 승격을 좁히거나 재정의할 수 있습니다:

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름 있는 계정이 이미 존재하는 경우 이
  키만 승격된 계정으로 이동하며, 공유 policy/delivery 키는 channel 루트에 유지
- `resolveSingleAccountPromotionTarget(...)`: 어떤 기존 계정이
  승격된 값을 받을지 선택

Matrix가 현재 번들 예시입니다. 이름 있는 Matrix 계정이 정확히 하나만
이미 존재하거나, `defaultAccount`가 `Ops` 같은 기존 비정규 키를 가리키는 경우,
승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다.

## config 스키마

plugin config는 manifest의 JSON Schema에 대해 검증됩니다. 사용자는 다음과 같이
plugin을 구성합니다:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

plugin은 등록 중에 이 config를 `api.pluginConfig`로 받습니다.

channel별 config에는 대신 channel config 섹션을 사용하세요:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### channel config 스키마 구축

Zod 스키마를 plugin 소유 config 아티팩트에서 사용하는
`ChannelConfigSchema` 래퍼로 변환하려면 `buildChannelConfigSchema`를 사용하세요:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

서드파티 plugins의 경우 cold-path 계약은 여전히 plugin manifest입니다:
생성된 JSON Schema를 `openclaw.plugin.json#channelConfigs`에 미러링하여
config 스키마, setup, UI 표면이 런타임 코드를 로드하지 않고도
`channels.<id>`를 검사할 수 있게 하세요.

## setup 마법사

channel plugins는 `openclaw onboard`용 대화형 setup 마법사를 제공할 수 있습니다.
마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "연결됨",
    unconfiguredLabel: "구성되지 않음",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "봇 토큰",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "환경에서 MY_CHANNEL_BOT_TOKEN을 사용하시겠습니까?",
      keepPrompt: "현재 토큰을 유지하시겠습니까?",
      inputPrompt: "봇 토큰을 입력하세요:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 타입은 `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등을 지원합니다.
전체 예시는 번들 plugin 패키지(예: Discord plugin의 `src/channel.setup.ts`)를 참조하세요.

표준
`note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트에는
`openclaw/plugin-sdk/setup`의 공유 setup
도우미인 `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`,
`createNestedChannelParsedAllowFromPrompt(...)`를 우선 사용하세요.

라벨, 점수, 선택적 추가 줄만 다른 channel setup 상태 블록에는
각 plugin에서 동일한 `status` 객체를 직접 작성하는 대신
`openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 우선 사용하세요.

특정 문맥에서만 나타나야 하는 선택적 setup 표면에는
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// { setupAdapter, setupWizard } 반환
```

`plugin-sdk/channel-setup`은 해당 선택적 설치 표면의
절반만 필요할 때 사용할 수 있는 더 낮은 수준의
`createOptionalChannelSetupAdapter(...)`와
`createOptionalChannelSetupWizard(...)` 빌더도 제공합니다.

생성된 선택적 어댑터/마법사는 실제 config 쓰기 시 실패를 유지합니다.
이들은 `validateInput`,
`applyAccountConfig`, `finalize` 전반에서 하나의 설치 필요 메시지를 재사용하고,
`docsPath`가 설정되어 있으면 문서 링크를 추가합니다.

바이너리 기반 setup UI에는 각 channel에 동일한 바이너리/상태 연결을 복사하는 대신
공유 위임 도우미를 우선 사용하세요:

- 라벨, 힌트, 점수, 바이너리 감지만 다른 상태 블록용 `createDetectedBinaryStatus(...)`
- 경로 기반 텍스트 입력용 `createCliPathTextInput(...)`
- `setupEntry`가 더 무거운 전체 마법사로 지연 전달해야 할 때의
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`,
  `createDelegatedResolveConfigured(...)`
- `setupEntry`가 `textInputs[*].shouldPrompt` 결정만 위임하면 될 때의
  `createDelegatedTextInputShouldPrompt(...)`

## 게시 및 설치

**외부 plugins:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치하세요:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 폴백합니다.
ClawHub만 명시적으로 강제할 수도 있습니다:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub 전용
```

이에 대응하는 `npm:` 재정의는 없습니다. ClawHub 폴백 이후 npm 경로를 원하면
일반 npm 패키지 spec을 사용하세요:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**리포 내부 plugins:** 번들 plugin 작업 공간 트리 아래에 두면 빌드 중 자동으로
검색됩니다.

**사용자가 설치할 수 있는 방법:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm source 설치의 경우 `openclaw plugins install`은
  `npm install --ignore-scripts`를 실행합니다(수명 주기 스크립트 없음). plugin 의존성
  트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

번들된 OpenClaw 소유 plugins만 시작 복구 예외입니다. 패키지된 설치가
plugin config, 레거시 channel config 또는 번들 기본 활성 manifest에 의해
하나가 활성화된 것을 확인하면, 시작 시 import 전에 해당 plugin의 누락된
런타임 의존성을 설치합니다. 서드파티 plugins는 시작 설치에 의존하지 말고,
계속 명시적 plugin 설치 프로그램을 사용하세요.

## 관련

- [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry`
- [Plugin manifest](/ko/plugins/manifest) — 전체 manifest 스키마 참조
- [plugin 빌드하기](/ko/plugins/building-plugins) — 단계별 시작 가이드
