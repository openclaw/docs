---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - '`setup-entry.ts`와 `index.ts`의 차이를 이해해야 합니다'
    - Plugin 구성 스키마 또는 package.json의 openclaw 메타데이터를 정의하고 있습니다
sidebarTitle: Setup and Config
summary: 설정 마법사, setup-entry.ts, 구성 스키마, 그리고 package.json 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin 설정 및 구성

Plugin 패키징(`package.json` 메타데이터), 매니페스트
(`openclaw.plugin.json`), 설정 엔트리, 구성 스키마에 대한
참고 자료입니다.

<Tip>
  **단계별 안내를 찾고 있나요?** 사용 방법 가이드에서 컨텍스트와 함께 패키징을 다룹니다:
  [Channel Plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및
  [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 plugin 시스템에
plugin이 무엇을 제공하는지 알려주는 `openclaw` 필드가 필요합니다:

**채널 Plugin:**

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
      "blurb": "Short description of the channel."
    }
  }
}
```

**프로바이더 Plugin / ClawHub 게시 기준:**

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

plugin을 ClawHub에 외부 게시하는 경우, 해당 `compat` 및 `build`
필드는 필수입니다. 정식 게시 스니펫은
`docs/snippets/plugin-publish/`에 있습니다.

### `openclaw` 필드

| 필드         | 유형       | 설명                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | 엔트리 포인트 파일(패키지 루트 기준 상대 경로)                                                         |
| `setupEntry` | `string`   | 가벼운 설정 전용 엔트리(선택 사항)                                                                     |
| `channel`    | `object`   | 설정, 선택기, 빠른 시작, 상태 화면용 채널 카탈로그 메타데이터                                          |
| `providers`  | `string[]` | 이 plugin이 등록하는 프로바이더 id                                                                     |
| `install`    | `object`   | 설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery`    |
| `startup`    | `object`   | 시작 동작 플래그                                                                                        |

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전에 채널 검색 및 설정
화면에 사용되는 가벼운 패키지 메타데이터입니다.

| 필드                                   | 유형       | 의미                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 정식 채널 id입니다.                                                           |
| `label`                                | `string`   | 기본 채널 레이블입니다.                                                       |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 선택기/설정에 표시되는 레이블입니다.                   |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그 및 상태 화면을 위한 보조 상세 레이블입니다.           |
| `docsPath`                             | `string`   | 설정 및 선택 링크에 사용할 문서 경로입니다.                                   |
| `docsLabel`                            | `string`   | 문서 링크 레이블이 채널 id와 달라야 할 때 사용하는 재정의 레이블입니다.       |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명입니다.                                              |
| `order`                                | `number`   | 채널 카탈로그에서의 정렬 순서입니다.                                          |
| `aliases`                              | `string[]` | 채널 선택에 사용할 추가 조회 별칭입니다.                                      |
| `preferOver`                           | `string[]` | 이 채널이 우선해야 하는 낮은 우선순위의 plugin/채널 id입니다.                 |
| `systemImage`                          | `string`   | 채널 UI 카탈로그에 사용할 선택적 아이콘/system-image 이름입니다.              |
| `selectionDocsPrefix`                  | `string`   | 선택 화면에서 문서 링크 앞에 붙는 접두 텍스트입니다.                          |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 레이블이 있는 문서 링크 대신 문서 경로를 직접 표시합니다.       |
| `selectionExtras`                      | `string[]` | 선택 문구에 덧붙이는 추가 짧은 문자열입니다.                                  |
| `markdownCapable`                      | `boolean`  | 발신 포맷 결정 시 이 채널이 마크다운을 지원함을 표시합니다.                   |
| `exposure`                             | `object`   | 설정, 구성 목록, 문서 화면에 대한 채널 표시 제어입니다.                       |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널을 표준 빠른 시작 `allowFrom` 설정 흐름에 포함합니다.                  |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나만 있어도 명시적인 계정 바인딩을 요구합니다.                       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 공지 대상을 확인할 때 이 채널에 대해 세션 조회를 우선합니다.                  |

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
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: 구성됨/상태 스타일 목록 화면에 채널을 포함합니다
- `setup`: 대화형 설정/구성 선택기에 채널을 포함합니다
- `docs`: 문서/탐색 화면에서 채널을 공개 대상으로 표시합니다

`showConfigured` 및 `showInSetup`도 레거시 별칭으로 계속 지원됩니다. 가능하면
`exposure`를 사용하세요.

### `openclaw.install`

`openclaw.install`은 매니페스트 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드                         | 유형                 | 의미                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 설치/업데이트 흐름에 사용할 정식 npm spec입니다.                                 |
| `localPath`                  | `string`             | 로컬 개발 또는 번들 설치 경로입니다.                                             |
| `defaultChoice`              | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 선호되는 설치 소스입니다.                                   |
| `minHostVersion`             | `string`             | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전입니다.                                  |
| `allowInvalidConfigRecovery` | `boolean`            | 번들 Plugin 재설치 흐름이 특정 오래된 구성 오류를 복구할 수 있도록 합니다.       |

`minHostVersion`이 설정되어 있으면 설치와 매니페스트 레지스트리 로딩 모두에서
이를 강제합니다. 더 오래된 호스트는 plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.

`allowInvalidConfigRecovery`는 깨진 구성 전반을 우회하는 일반적인 방법이 아닙니다. 이는
좁은 범위의 번들 Plugin 복구 전용으로, 재설치/설정이 동일 plugin에 대한 번들 plugin 경로 누락이나 오래된 `channels.<id>`
항목 같은 알려진 업그레이드 잔재를 복구할 수 있도록 하기 위한 것입니다. 관련 없는 이유로 구성이 깨진 경우에는 설치가
여전히 안전하게 실패하며, 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.

### 전체 로드 지연

채널 Plugin은 다음과 같이 지연 로딩을 선택할 수 있습니다:

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

이를 활성화하면 OpenClaw는 이미 구성된 채널에 대해서도
사전 listen 시작 단계에서는 `setupEntry`만 로드합니다.
전체 엔트리는 gateway가 listen을 시작한 뒤 로드됩니다.

<Warning>
  `setupEntry`가 gateway가 listen을 시작하기 전에 필요한 모든 것(채널 등록, HTTP 경로,
  gateway 메서드)을 등록하는 경우에만 지연 로딩을 활성화하세요. 전체 엔트리가 필수
  시작 기능을 소유하고 있다면 기본 동작을 유지하세요.
</Warning>

설정/전체 엔트리에서 gateway RPC 메서드를 등록하는 경우,
plugin별 접두사를 유지하세요. 예약된 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 계속 코어 전용이며
항상 `operator.admin`으로 해석됩니다.

## Plugin 매니페스트

모든 네이티브 plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다.
OpenClaw는 이를 사용해 plugin 코드를 실행하지 않고도 구성을 검증합니다.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

채널 Plugin의 경우 `kind`와 `channels`를 추가하세요:

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

구성이 없는 plugin도 스키마를 포함해야 합니다. 빈 스키마도 유효합니다:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin 매니페스트](/ko/plugins/manifest)를 확인하세요.

## ClawHub 게시

plugin 패키지의 경우 패키지 전용 ClawHub 명령을 사용하세요:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

레거시 skill 전용 게시 별칭은 skills용입니다. Plugin 패키지는
항상 `clawhub package publish`를 사용해야 합니다.

## 설정 엔트리

`setup-entry.ts` 파일은 `index.ts`의 가벼운 대안으로,
OpenClaw가 설정 화면(온보딩, 구성 복구,
비활성화된 채널 검사)만 필요할 때 로드합니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 설정 흐름 중에 무거운 런타임 코드(암호화 라이브러리, CLI 등록,
백그라운드 서비스)를 로드하지 않아도 됩니다.

설정에 안전한 export를 사이드카 모듈에 유지하는 번들 워크스페이스 채널은
`defineSetupPluginEntry(...)` 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은
선택적 `runtime` export도 지원하므로 설정 시점의 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

**OpenClaw가 전체 엔트리 대신 `setupEntry`를 사용하는 경우:**

- 채널이 비활성화되어 있지만 설정/온보딩 화면이 필요한 경우
- 채널이 활성화되어 있지만 구성되지 않은 경우
- 지연 로딩이 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`가 반드시 등록해야 하는 항목:**

- 채널 plugin 객체(`defineSetupPluginEntry`를 통해)
- gateway listen 전에 필요한 모든 HTTP 경로
- 시작 중에 필요한 모든 gateway 메서드

이러한 시작용 gateway 메서드도 여전히 `config.*` 또는 `update.*` 같은
예약된 코어 관리자 네임스페이스는 피해야 합니다.

**`setupEntry`에 포함하면 안 되는 것:**

- CLI 등록
- 백그라운드 서비스
- 무거운 런타임 import(crypto, SDK 등)
- 시작 이후에만 필요한 gateway 메서드

### 범위를 좁힌 설정 헬퍼 import

설정 전용 핫 패스에서는 설정 화면의 일부만 필요할 경우 더 넓은
`plugin-sdk/setup` 우산형 경로 대신 범위를 좁힌 설정 헬퍼 경로를 우선 사용하세요:

| import 경로                        | 사용 목적                                                                                  | 주요 export                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연된 채널 시작에서 계속 사용할 수 있는 설정 시점 런타임 헬퍼              | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 계정 설정 어댑터                                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | 설정/설치 CLI/아카이브/문서 헬퍼                                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

구성 패치 헬퍼(`moveSingleAccountChannelSectionToDefaultAccount(...)` 등)를 포함한
전체 공유 설정 도구 모음을 원한다면 더 넓은 `plugin-sdk/setup` 경로를 사용하세요.

설정 패치 어댑터는 import 시에도 핫 패스에서 안전하게 유지됩니다. 번들된
단일 계정 승격 계약 화면 조회는 지연 로딩되므로,
`plugin-sdk/setup-runtime`을 import해도 어댑터를 실제로 사용하기 전에
번들 계약 화면 검색을 미리 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 구성에서
`channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격된
계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 설정 계약 화면을 통해 이 승격 동작을 좁히거나 재정의할 수 있습니다:

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름 있는 계정이 이미 존재할 때는 이 키들만
  승격된 계정으로 이동하며, 공유 정책/전달 키는 채널 루트에 남습니다
- `resolveSingleAccountPromotionTarget(...)`: 승격된 값을 받을 기존 계정을 선택합니다

현재 번들 예시는 Matrix입니다. 이름 있는 Matrix 계정이 정확히 하나만 이미
존재하거나 `defaultAccount`가 `Ops` 같은 기존의 비표준 키를 가리키는 경우,
승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 유지합니다.

## 구성 스키마

Plugin 구성은 매니페스트의 JSON Schema에 대해 검증됩니다. 사용자는 다음과 같이
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

plugin은 등록 중에 이 구성을 `api.pluginConfig`로 전달받습니다.

채널 전용 구성의 경우 대신 채널 구성 섹션을 사용하세요:

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

### 채널 구성 스키마 만들기

`openclaw/plugin-sdk/core`의 `buildChannelConfigSchema`를 사용해
Zod 스키마를 OpenClaw가 검증하는 `ChannelConfigSchema` 래퍼로 변환하세요:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## 설정 마법사

채널 Plugin은 `openclaw onboard`를 위한 대화형 설정 마법사를 제공할 수 있습니다.
마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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
전체 예시는 번들 Plugin 패키지(예: Discord plugin의 `src/channel.setup.ts`)를
참고하세요.

표준
`note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트의 경우,
`openclaw/plugin-sdk/setup`의 공유 설정 헬퍼
`createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`,
`createNestedChannelParsedAllowFromPrompt(...)`를 우선 사용하세요.

레이블, 점수, 선택적인 추가 줄만 달라지는 채널 설정 상태 블록의 경우,
각 plugin에서 같은 `status` 객체를 직접 만드는 대신
`openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 우선 사용하세요.

특정 컨텍스트에서만 나타나야 하는 선택적 설정 화면의 경우,
`openclaw/plugin-sdk/channel-setup`의
`createOptionalChannelSetupSurface`를 사용하세요:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup`은 하위 수준의
`createOptionalChannelSetupAdapter(...)`와
`createOptionalChannelSetupWizard(...)` 빌더도 제공하므로, 해당 선택적 설치 화면의
절반만 필요할 때 사용할 수 있습니다.

생성된 선택적 어댑터/마법사는 실제 구성 쓰기에서는 안전하게 실패합니다. 이들은
`validateInput`,
`applyAccountConfig`, `finalize` 전반에서 하나의 설치 필요 메시지를 재사용하며,
`docsPath`가 설정되어 있으면 문서 링크를 덧붙입니다.

바이너리 기반 설정 UI의 경우, 같은 바이너리/상태 연결 로직을 모든 채널에 복사하는 대신
공유 위임 헬퍼를 우선 사용하세요:

- 레이블, 힌트, 점수, 바이너리 감지에 따라 달라지는 상태 블록에는 `createDetectedBinaryStatus(...)`
- 경로 기반 텍스트 입력에는 `createCliPathTextInput(...)`
- `setupEntry`가 더 무거운 전체 마법사로 지연 위임해야 할 때
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`,
  `createDelegatedResolveConfigured(...)`
- `setupEntry`가 `textInputs[*].shouldPrompt` 판단만 위임하면 될 때
  `createDelegatedTextInputShouldPrompt(...)`

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치합니다:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 대체합니다. 다음과 같이
ClawHub를 명시적으로 강제할 수도 있습니다:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

이에 대응하는 `npm:` 재정의는 없습니다. ClawHub 대체 후 npm 경로를
원할 때는 일반 npm 패키지 spec을 사용하세요:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**레포 내부 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 두면 빌드 중에 자동으로
검색됩니다.

**사용자는 다음처럼 설치할 수 있습니다:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm 소스 설치의 경우 `openclaw plugins install`은
  `npm install --ignore-scripts`(라이프사이클 스크립트 없음)를 실행합니다. Plugin 의존성
  트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

## 관련 자료

- [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints) -- `definePluginEntry` 및 `defineChannelPluginEntry`
- [Plugin 매니페스트](/ko/plugins/manifest) -- 전체 매니페스트 스키마 참조
- [Plugin 만들기](/ko/plugins/building-plugins) -- 단계별 시작 가이드
