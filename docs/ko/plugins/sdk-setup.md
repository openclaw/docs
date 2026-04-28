---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - setup-entry.ts와 index.ts의 차이를 이해해야 합니다
    - Plugin config 스키마 또는 package.json의 openclaw 메타데이터를 정의하고 있습니다
sidebarTitle: Setup and config
summary: 설정 마법사, setup-entry.ts, config 스키마, 그리고 package.json 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-26T11:36:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin 패키징(`package.json` 메타데이터), 매니페스트(`openclaw.plugin.json`), 설정 엔트리, 그리고 config 스키마에 대한 참조입니다.

<Tip>
**단계별 안내를 찾고 계신가요?** 방법 가이드는 패키징을 맥락 속에서 다룹니다: [Channel plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및 [Provider plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

플러그인 시스템에 플러그인이 무엇을 제공하는지 알려주려면 `package.json`에 `openclaw` 필드가 필요합니다:

<Tabs>
  <Tab title="Channel plugin">
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
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
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
  </Tab>
</Tabs>

<Note>
플러그인을 ClawHub에 외부 공개하는 경우 `compat` 및 `build` 필드는 필수입니다. 표준 게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.
</Note>

### `openclaw` 필드

<ParamField path="extensions" type="string[]">
  엔트리 포인트 파일입니다(패키지 루트 기준 상대 경로).
</ParamField>
<ParamField path="setupEntry" type="string">
  가벼운 설정 전용 엔트리입니다(선택 사항).
</ParamField>
<ParamField path="channel" type="object">
  설정, 선택기, quickstart, 상태 표면을 위한 채널 카탈로그 메타데이터입니다.
</ParamField>
<ParamField path="providers" type="string[]">
  이 Plugin이 등록하는 provider id입니다.
</ParamField>
<ParamField path="install" type="object">
  설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  시작 동작 플래그입니다.
</ParamField>

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전에 채널 검색 및 설정 표면을 위한 가벼운 패키지 메타데이터입니다.

| Field                                  | Type       | 의미 |
| -------------------------------------- | ---------- | ---- |
| `id`                                   | `string`   | 표준 채널 id입니다. |
| `label`                                | `string`   | 기본 채널 라벨입니다. |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 사용하는 선택기/설정 라벨입니다. |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그 및 상태 표면을 위한 보조 상세 라벨입니다. |
| `docsPath`                             | `string`   | 설정 및 선택 링크를 위한 문서 경로입니다. |
| `docsLabel`                            | `string`   | 채널 id와 달라야 할 때 문서 링크에 사용하는 재정의 라벨입니다. |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명입니다. |
| `order`                                | `number`   | 채널 카탈로그에서의 정렬 순서입니다. |
| `aliases`                              | `string[]` | 채널 선택을 위한 추가 조회 별칭입니다. |
| `preferOver`                           | `string[]` | 이 채널이 우선해야 하는 더 낮은 우선순위의 Plugin/채널 id입니다. |
| `systemImage`                          | `string`   | 채널 UI 카탈로그용 선택적 icon/system-image 이름입니다. |
| `selectionDocsPrefix`                  | `string`   | 선택 표면에서 문서 링크 앞에 붙는 접두 텍스트입니다. |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 라벨이 있는 문서 링크 대신 문서 경로를 직접 표시합니다. |
| `selectionExtras`                      | `string[]` | 선택 문구에 추가로 덧붙는 짧은 문자열입니다. |
| `markdownCapable`                      | `boolean`  | 발신 포맷 결정 시 이 채널이 markdown 가능 채널임을 표시합니다. |
| `exposure`                             | `object`   | 설정, 구성된 목록, 문서 표면에서의 채널 가시성 제어입니다. |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널을 표준 quickstart `allowFrom` 설정 흐름에 포함합니다. |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나만 있어도 명시적 계정 바인딩을 요구합니다. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 채널의 announce 대상 확인 시 session 조회를 우선합니다. |

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

- `configured`: 채널을 configured/status 스타일 목록 표면에 포함
- `setup`: 채널을 대화형 설정/구성 선택기에 포함
- `docs`: 채널을 문서/탐색 표면에서 공개 대상으로 표시

<Note>
`showConfigured` 및 `showInSetup`은 레거시 별칭으로 계속 지원됩니다. `exposure` 사용을 권장합니다.
</Note>

### `openclaw.install`

`openclaw.install`은 매니페스트 메타데이터가 아니라 패키지 메타데이터입니다.

| Field                        | Type                 | 의미 |
| ---------------------------- | -------------------- | ---- |
| `npmSpec`                    | `string`             | 설치/업데이트 흐름을 위한 표준 npm spec입니다. |
| `localPath`                  | `string`             | 로컬 개발 또는 번들 설치 경로입니다. |
| `defaultChoice`              | `"npm"` \| `"local"` | 둘 다 가능할 때 선호되는 설치 소스입니다. |
| `minHostVersion`             | `string`             | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전입니다. |
| `expectedIntegrity`          | `string`             | 고정 설치용 예상 npm dist 무결성 문자열이며, 보통 `sha512-...`입니다. |
| `allowInvalidConfigRecovery` | `boolean`            | 번들 Plugin 재설치 흐름이 특정 오래된 config 실패에서 복구할 수 있게 합니다. |

<AccordionGroup>
  <Accordion title="온보딩 동작">
    대화형 온보딩도 install-on-demand 표면에 `openclaw.install`을 사용합니다. Plugin이 런타임 로드 전에 provider 인증 선택지 또는 채널 설정/카탈로그 메타데이터를 노출한다면, 온보딩은 해당 선택지를 보여주고, npm 또는 로컬 설치를 물어본 뒤, Plugin을 설치 또는 활성화하고, 선택된 흐름을 계속 진행할 수 있습니다. Npm 온보딩 선택지에는 레지스트리 `npmSpec`이 있는 신뢰된 카탈로그 메타데이터가 필요하며, 정확한 버전과 `expectedIntegrity`는 선택적 고정값입니다. `expectedIntegrity`가 있으면 설치/업데이트 흐름이 이를 강제합니다. “무엇을 보여줄지” 메타데이터는 `openclaw.plugin.json`에, “어떻게 설치할지” 메타데이터는 `package.json`에 두세요.
  </Accordion>
  <Accordion title="minHostVersion 적용">
    `minHostVersion`이 설정되면 설치와 manifest-registry 로딩 모두에서 이를 강제합니다. 더 오래된 호스트는 Plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.
  </Accordion>
  <Accordion title="고정된 npm 설치">
    고정된 npm 설치의 경우 `npmSpec`에 정확한 버전을 유지하고 예상 아티팩트 무결성을 추가하세요:

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

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery 범위">
    `allowInvalidConfigRecovery`는 깨진 config에 대한 일반적인 우회 수단이 아닙니다. 이는 누락된 번들 Plugin 경로 또는 동일 Plugin의 오래된 `channels.<id>` 항목처럼 알려진 업그레이드 잔여물을 재설치/설정이 복구할 수 있도록 하는 제한적인 번들 Plugin 복구 전용입니다. 관련 없는 이유로 config가 깨진 경우 설치는 여전히 폐쇄 실패하며 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.
  </Accordion>
</AccordionGroup>

### 전체 로드 지연

Channel plugin은 다음과 같이 지연 로딩을 선택할 수 있습니다:

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

활성화되면 OpenClaw는 이미 구성된 채널에 대해서도 pre-listen 시작 단계 동안 `setupEntry`만 로드합니다. 전체 엔트리는 Gateway가 수신 대기 상태가 된 후 로드됩니다.

<Warning>
지연 로딩은 `setupEntry`가 Gateway가 수신을 시작하기 전에 필요한 모든 것(채널 등록, HTTP 라우트, Gateway 메서드)을 등록할 때만 활성화하세요. 전체 엔트리가 필수 시작 기능을 소유한다면 기본 동작을 유지하세요.
</Warning>

설정/전체 엔트리가 Gateway RPC 메서드를 등록한다면 Plugin별 접두사에 유지하세요. 예약된 core 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 계속 core 소유이며 항상 `operator.admin`으로 확인됩니다.

## Plugin 매니페스트

모든 네이티브 Plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다. OpenClaw는 이를 사용해 Plugin 코드를 실행하지 않고도 config를 검증합니다.

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

Channel plugin의 경우 `kind`와 `channels`를 추가하세요:

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

config가 전혀 없는 Plugin도 스키마를 포함해야 합니다. 빈 스키마도 유효합니다:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin manifest](/ko/plugins/manifest)를 참고하세요.

## ClawHub 게시

Plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
레거시 스킬 전용 publish 별칭은 Skills용입니다. Plugin 패키지는 항상 `clawhub package publish`를 사용해야 합니다.
</Note>

## 설정 엔트리

`setup-entry.ts` 파일은 OpenClaw가 설정 표면(온보딩, config 복구, 비활성화된 채널 검사)만 필요로 할 때 로드하는, `index.ts`의 가벼운 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 설정 흐름 중에 무거운 런타임 코드(crypto 라이브러리, CLI 등록, 백그라운드 서비스)를 로드하지 않아도 됩니다.

사이드카 모듈에 setup-safe export를 유지하는 번들 workspace 채널은 `defineSetupPluginEntry(...)` 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은 선택적인 `runtime` export도 지원하므로 설정 시점 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

<AccordionGroup>
  <Accordion title="OpenClaw가 전체 엔트리 대신 setupEntry를 사용하는 경우">
    - 채널이 비활성화되어 있지만 설정/온보딩 표면이 필요한 경우
    - 채널이 활성화되어 있지만 아직 구성되지 않은 경우
    - 지연 로딩이 활성화된 경우 (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="setupEntry가 반드시 등록해야 하는 것">
    - 채널 Plugin 객체 (`defineSetupPluginEntry`를 통해)
    - Gateway가 listen하기 전에 필요한 모든 HTTP 라우트
    - 시작 중에 필요한 모든 Gateway 메서드

    이러한 시작용 Gateway 메서드는 여전히 `config.*` 또는 `update.*` 같은 예약된 core 관리자 네임스페이스를 피해야 합니다.

  </Accordion>
  <Accordion title="setupEntry에 포함하면 안 되는 것">
    - CLI 등록
    - 백그라운드 서비스
    - 무거운 런타임 import (crypto, SDK)
    - 시작 이후에만 필요한 Gateway 메서드

  </Accordion>
</AccordionGroup>

### 좁은 범위의 설정 헬퍼 import

설정 전용 hot path에서는 설정 표면의 일부만 필요할 때 더 넓은 `plugin-sdk/setup` 우산 대신 좁은 범위의 설정 헬퍼 seam을 우선 사용하세요:

| Import path                        | 사용 목적 | 주요 export |
| ---------------------------------- | --------- | ----------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연 채널 시작에서 계속 사용 가능한 설정 시점 런타임 헬퍼 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 계정 설정 어댑터 | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools`           | 설정/설치 CLI/아카이브/문서 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은 config-patch 헬퍼를 포함한 전체 공유 설정 도구 상자가 필요하다면 더 넓은 `plugin-sdk/setup` seam을 사용하세요.

설정 패치 어댑터는 import 시 hot-path 안전성을 유지합니다. 번들 단일 계정 승격 contract-surface 조회는 지연 로딩되므로, `plugin-sdk/setup-runtime`을 import해도 어댑터가 실제로 사용되기 전에는 번들 contract-surface 탐색을 미리 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 config에서 `channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격된 계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 설정 계약 표면을 통해 이 승격을 좁히거나 재정의할 수 있습니다:

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름 있는 계정이 이미 존재하는 경우, 이 키들만 승격된 계정으로 이동하며, 공유 정책/전달 키는 채널 루트에 유지
- `resolveSingleAccountPromotionTarget(...)`: 승격된 값을 받을 기존 계정을 선택

<Note>
Matrix가 현재 번들 예시입니다. 이름 있는 Matrix 계정이 정확히 하나만 이미 존재하거나 `defaultAccount`가 `Ops` 같은 기존의 비표준 키를 가리키는 경우, 승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 유지합니다.
</Note>

## Config 스키마

Plugin config는 매니페스트의 JSON Schema에 대해 검증됩니다. 사용자는 다음과 같이 Plugin을 구성합니다:

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

Plugin은 등록 중에 이 config를 `api.pluginConfig`로 받습니다.

채널별 config에는 대신 채널 config 섹션을 사용하세요:

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

### 채널 config 스키마 만들기

Zod 스키마를 Plugin 소유 config 아티팩트에서 사용하는 `ChannelConfigSchema` 래퍼로 변환하려면 `buildChannelConfigSchema`를 사용하세요:

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

서드파티 Plugin의 경우 cold-path 계약은 여전히 Plugin 매니페스트입니다. 생성된 JSON Schema를 `openclaw.plugin.json#channelConfigs`에 반영하여 config 스키마, 설정, UI 표면이 런타임 코드를 로드하지 않고도 `channels.<id>`를 검사할 수 있게 하세요.

## 설정 마법사

Channel plugin은 `openclaw onboard`용 대화형 설정 마법사를 제공할 수 있습니다. 마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다:

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

`ChannelSetupWizard` 타입은 `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등을 지원합니다. 전체 예시는 번들 Plugin 패키지(예: Discord plugin `src/channel.setup.ts`)를 참고하세요.

<AccordionGroup>
  <Accordion title="공유 allowFrom 프롬프트">
    표준 `note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM allowlist 프롬프트에는 `openclaw/plugin-sdk/setup`의 공유 설정 헬퍼를 우선 사용하세요: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="표준 채널 설정 상태">
    라벨, 점수, 선택적 추가 줄만 다른 채널 설정 상태 블록에는 각 Plugin에서 동일한 `status` 객체를 직접 만드는 대신 `openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 우선 사용하세요.
  </Accordion>
  <Accordion title="선택적 채널 설정 표면">
    특정 맥락에서만 나타나야 하는 선택적 설정 표면에는 `openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요:

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

    `plugin-sdk/channel-setup`은 선택적 설치 표면의 절반만 필요할 때를 위해 더 저수준의 `createOptionalChannelSetupAdapter(...)` 및 `createOptionalChannelSetupWizard(...)` 빌더도 제공합니다.

    생성된 선택적 어댑터/마법사는 실제 config 쓰기에서 폐쇄 실패합니다. `validateInput`, `applyAccountConfig`, `finalize` 전반에 걸쳐 하나의 설치 필요 메시지를 재사용하고, `docsPath`가 설정된 경우 문서 링크를 추가합니다.

  </Accordion>
  <Accordion title="바이너리 기반 설정 헬퍼">
    바이너리 기반 설정 UI에는 각 채널에 동일한 바이너리/상태 연결 코드를 복사하는 대신 공유 위임 헬퍼를 우선 사용하세요:

    - 라벨, 힌트, 점수, 바이너리 감지만 다른 상태 블록을 위한 `createDetectedBinaryStatus(...)`
    - 경로 기반 텍스트 입력을 위한 `createCliPathTextInput(...)`
    - `setupEntry`가 더 무거운 전체 마법사로 지연 위임해야 할 때 사용하는 `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, `createDelegatedResolveConfigured(...)`
    - `setupEntry`가 `textInputs[*].shouldPrompt` 결정만 위임하면 될 때 사용하는 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치하세요:

<Tabs>
  <Tab title="자동 (ClawHub 후 npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 fallback합니다.

  </Tab>
  <Tab title="ClawHub 전용">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    일치하는 `npm:` 재정의는 없습니다. ClawHub fallback 이후 npm 경로를 원할 때는 일반 npm package spec을 사용하세요:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**리포지토리 내 Plugin:** 번들 Plugin workspace 트리 아래에 두면 빌드 중 자동으로 검색됩니다.

**사용자 설치 명령:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 소스 설치의 경우 `openclaw plugins install`은 상속된 전역 npm 설치 설정을 무시하고 프로젝트 로컬 `npm install --ignore-scripts`(lifecycle script 없음)를 실행합니다. Plugin 의존성 트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

<Note>
번들된 OpenClaw 소유 Plugin만 시작 시 복구 예외에 해당합니다. 패키지된 설치가 plugin config, 레거시 채널 config 또는 번들된 기본 활성화 매니페스트를 통해 활성화된 Plugin을 발견하면, 시작 과정에서 import 전에 해당 Plugin의 누락된 런타임 의존성을 설치합니다. 서드파티 Plugin은 시작 시 설치에 의존하면 안 되며, 계속 명시적인 Plugin 설치 프로그램을 사용해야 합니다.
</Note>

## 관련 항목

- [Building plugins](/ko/plugins/building-plugins) — 시작을 위한 단계별 가이드
- [Plugin manifest](/ko/plugins/manifest) — 전체 매니페스트 스키마 참조
- [SDK entry points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry`
