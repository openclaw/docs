---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - setup-entry.ts와 index.ts의 차이를 이해해야 합니다
    - Plugin 구성 스키마 또는 package.json openclaw 메타데이터를 정의하고 있습니다
sidebarTitle: Setup and config
summary: 설정 마법사, setup-entry.ts, 구성 스키마 및 package.json 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-30T06:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

패키지화(`package.json` 메타데이터), 매니페스트(`openclaw.plugin.json`), 설정 항목, 구성 스키마에 대한 참조입니다.

<Tip>
**따라 해 볼 안내가 필요하신가요?** 방법 가이드는 맥락 속에서 패키지화를 다룹니다: [채널 plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및 [제공자 plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 plugin 시스템에 plugin이 무엇을 제공하는지 알려 주는 `openclaw` 필드가 필요합니다.

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
ClawHub에 plugin을 외부에 게시하는 경우, 해당 `compat` 및 `build` 필드는 필수입니다. 표준 게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.
</Note>

### `openclaw` 필드

<ParamField path="extensions" type="string[]">
  진입점 파일입니다(패키지 루트 기준 상대 경로).
</ParamField>
<ParamField path="setupEntry" type="string">
  설정 전용 경량 진입점입니다(선택 사항).
</ParamField>
<ParamField path="channel" type="object">
  설정, 선택기, 빠른 시작, 상태 화면을 위한 채널 카탈로그 메타데이터입니다.
</ParamField>
<ParamField path="providers" type="string[]">
  이 plugin이 등록하는 제공자 ID입니다.
</ParamField>
<ParamField path="install" type="object">
  설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  시작 동작 플래그입니다.
</ParamField>

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전 채널 검색 및 설정 화면을 위한 가벼운 패키지 메타데이터입니다.

| 필드                                   | 유형       | 의미                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 표준 채널 ID입니다.                                                           |
| `label`                                | `string`   | 기본 채널 레이블입니다.                                                       |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 사용하는 선택기/설정 레이블입니다.                     |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그와 상태 화면을 위한 보조 상세 레이블입니다.           |
| `docsPath`                             | `string`   | 설정 및 선택 링크에 사용할 문서 경로입니다.                                   |
| `docsLabel`                            | `string`   | 채널 ID와 달라야 할 때 문서 링크에 사용하는 레이블 재정의입니다.              |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명입니다.                                              |
| `order`                                | `number`   | 채널 카탈로그의 정렬 순서입니다.                                              |
| `aliases`                              | `string[]` | 채널 선택을 위한 추가 조회 별칭입니다.                                        |
| `preferOver`                           | `string[]` | 이 채널이 우선해야 하는 낮은 우선순위의 plugin/채널 ID입니다.                 |
| `systemImage`                          | `string`   | 채널 UI 카탈로그를 위한 선택적 아이콘/시스템 이미지 이름입니다.               |
| `selectionDocsPrefix`                  | `string`   | 선택 화면에서 문서 링크 앞에 표시할 접두사 텍스트입니다.                     |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 레이블이 있는 문서 링크 대신 문서 경로를 직접 표시합니다.       |
| `selectionExtras`                      | `string[]` | 선택 문구에 추가되는 짧은 문자열입니다.                                       |
| `markdownCapable`                      | `boolean`  | 아웃바운드 서식 결정에서 해당 채널을 markdown 지원 채널로 표시합니다.         |
| `exposure`                             | `object`   | 설정, 구성된 목록, 문서 화면에서의 채널 표시 여부 제어입니다.                 |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널을 표준 빠른 시작 `allowFrom` 설정 흐름에 포함합니다.                  |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나만 있어도 명시적 계정 바인딩을 요구합니다.                         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 채널의 공지 대상을 확인할 때 세션 조회를 우선합니다.                       |

예:

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

`exposure`는 다음을 지원합니다.

- `configured`: 구성/상태 스타일 목록 화면에 채널 포함
- `setup`: 대화형 설정/구성 선택기에 채널 포함
- `docs`: 문서/탐색 화면에서 채널을 공개 대상으로 표시

<Note>
`showConfigured`와 `showInSetup`은 레거시 별칭으로 계속 지원됩니다. `exposure` 사용을 권장합니다.
</Note>

### `openclaw.install`

`openclaw.install`은 매니페스트 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드                         | 유형                 | 의미                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 설치/업데이트 흐름을 위한 표준 npm 명세입니다.                                   |
| `localPath`                  | `string`             | 로컬 개발 또는 번들 설치 경로입니다.                                             |
| `defaultChoice`              | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 선호하는 설치 소스입니다.                                   |
| `minHostVersion`             | `string`             | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전입니다.                                  |
| `expectedIntegrity`          | `string`             | 고정 설치를 위한 예상 npm 배포 무결성 문자열이며, 보통 `sha512-...`입니다.        |
| `allowInvalidConfigRecovery` | `boolean`            | 번들 plugin 재설치 흐름이 특정 오래된 구성 실패에서 복구할 수 있게 합니다.       |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    대화형 온보딩도 주문형 설치 화면에 `openclaw.install`을 사용합니다. plugin이 런타임 로드 전에 제공자 인증 선택지나 채널 설정/카탈로그 메타데이터를 노출하면, 온보딩은 해당 선택지를 표시하고 npm 설치와 로컬 설치 중 하나를 묻고 plugin을 설치하거나 활성화한 뒤 선택된 흐름을 계속할 수 있습니다. npm 온보딩 선택지는 레지스트리 `npmSpec`이 있는 신뢰된 카탈로그 메타데이터가 필요하며, 정확한 버전과 `expectedIntegrity`는 선택적 고정값입니다. `expectedIntegrity`가 있으면 설치/업데이트 흐름이 이를 강제합니다. “무엇을 보여 줄지” 메타데이터는 `openclaw.plugin.json`에, “어떻게 설치할지” 메타데이터는 `package.json`에 유지하세요.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion`이 설정되어 있으면 설치와 매니페스트 레지스트리 로딩이 모두 이를 강제합니다. 이전 호스트는 plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.
  </Accordion>
  <Accordion title="Pinned npm installs">
    고정 npm 설치의 경우 `npmSpec`에 정확한 버전을 유지하고 예상 아티팩트 무결성을 추가하세요.

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery`는 손상된 구성을 위한 일반 우회 수단이 아닙니다. 이는 좁은 범위의 번들 plugin 복구 전용이므로, 재설치/설정이 누락된 번들 plugin 경로나 같은 plugin의 오래된 `channels.<id>` 항목 같은 알려진 업그레이드 잔여물을 복구할 수 있습니다. 관련 없는 이유로 구성이 손상된 경우 설치는 여전히 닫힌 상태로 실패하며 운영자에게 `openclaw doctor --fix` 실행을 안내합니다.
  </Accordion>
</AccordionGroup>

### 지연된 전체 로드

채널 plugins는 다음으로 지연 로딩을 선택할 수 있습니다.

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

활성화되면 OpenClaw는 이미 구성된 채널이라도 수신 전 시작 단계에서 `setupEntry`만 로드합니다. 전체 진입점은 Gateway가 수신을 시작한 뒤 로드됩니다.

<Warning>
Gateway가 수신을 시작하기 전에 필요한 모든 항목(채널 등록, HTTP 라우트, gateway 메서드)을 `setupEntry`가 등록하는 경우에만 지연 로딩을 활성화하세요. 필수 시작 기능을 전체 진입점이 소유하는 경우 기본 동작을 유지하세요.
</Warning>

설정/전체 진입점이 gateway RPC 메서드를 등록하는 경우, plugin별 접두사에 유지하세요. 예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 코어 소유로 유지되며 항상 `operator.admin`으로 확인됩니다.

## Plugin 매니페스트

모든 네이티브 plugin은 패키지 루트에 `openclaw.plugin.json`을 제공해야 합니다. OpenClaw는 이를 사용해 plugin 코드를 실행하지 않고 구성을 검증합니다.

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

채널 plugins의 경우 `kind`와 `channels`를 추가하세요.

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

구성이 없는 plugins도 스키마를 제공해야 합니다. 빈 스키마도 유효합니다.

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin 매니페스트](/ko/plugins/manifest)를 참조하세요.

## ClawHub 게시

Plugin 패키지에는 패키지별 ClawHub 명령을 사용하세요.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
레거시 Skills 전용 게시 별칭은 Skills용입니다. Plugin 패키지는 항상 `clawhub package publish`를 사용해야 합니다.
</Note>

## 설정 진입점

`setup-entry.ts` 파일은 OpenClaw가 설정 화면(온보딩, 구성 복구, 비활성화된 채널 검사)만 필요로 할 때 로드하는 `index.ts`의 경량 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 설정 흐름 중에 무거운 런타임 코드(암호화 라이브러리, CLI 등록, 백그라운드 서비스)를 로드하지 않을 수 있습니다.

사이드카 모듈에 설정 안전 내보내기를 유지하는 번들된 워크스페이스 채널은 `defineSetupPluginEntry(...)` 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 해당 번들 계약은 선택적 `runtime` 내보내기도 지원하므로, 설정 시점의 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

<AccordionGroup>
  <Accordion title="OpenClaw가 전체 entry 대신 setupEntry를 사용하는 경우">
    - 채널이 비활성화되어 있지만 설정/온보딩 화면이 필요한 경우.
    - 채널이 활성화되어 있지만 구성되지 않은 경우.
    - 지연 로딩이 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry가 등록해야 하는 항목">
    - 채널 Plugin 객체(`defineSetupPluginEntry`를 통해).
    - Gateway listen 전에 필요한 모든 HTTP 라우트.
    - 시작 중에 필요한 모든 Gateway 메서드.

    이러한 시작 Gateway 메서드는 그래도 `config.*` 또는 `update.*` 같은 예약된 코어 관리자 네임스페이스를 피해야 합니다.

  </Accordion>
  <Accordion title="setupEntry에 포함하지 말아야 하는 항목">
    - CLI 등록.
    - 백그라운드 서비스.
    - 무거운 런타임 import(암호화, SDK).
    - 시작 이후에만 필요한 Gateway 메서드.

  </Accordion>
</AccordionGroup>

### 좁은 설정 헬퍼 import

설정 전용 핫 경로에서는 설정 표면의 일부만 필요한 경우 더 넓은 `plugin-sdk/setup` 통합 진입점보다 좁은 설정 헬퍼 seam을 선호하세요.

| Import 경로                       | 용도                                                                                      | 주요 내보내기                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연 채널 시작에서 계속 사용할 수 있는 설정 시점 런타임 헬퍼               | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 계정 설정 어댑터                                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 설정/설치 CLI/아카이브/문서 헬퍼                                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은 config-patch 헬퍼를 포함한 전체 공유 설정 도구 상자가 필요할 때는 더 넓은 `plugin-sdk/setup` seam을 사용하세요.

설정 패치 어댑터는 import 시에도 핫 경로에 안전하게 유지됩니다. 번들된 단일 계정 승격 계약 표면 조회는 lazy이므로, `plugin-sdk/setup-runtime`을 import해도 어댑터가 실제로 사용되기 전까지 번들된 계약 표면 발견을 즉시 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 config에서 `channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격된 계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들된 채널은 설정 계약 표면을 통해 해당 승격을 좁히거나 재정의할 수 있습니다.

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름 있는 계정이 이미 존재할 때, 승격된 계정으로 이 키들만 이동합니다. 공유 정책/전달 키는 채널 루트에 남습니다
- `resolveSingleAccountPromotionTarget(...)`: 어떤 기존 계정이 승격된 값을 받을지 선택합니다

<Note>
Matrix가 현재 번들된 예시입니다. 이름 있는 Matrix 계정이 정확히 하나 이미 존재하거나, `defaultAccount`가 `Ops` 같은 기존 비표준 키를 가리키는 경우, 승격은 새 `accounts.default` 항목을 만들지 않고 해당 계정을 보존합니다.
</Note>

## Config schema

Plugin config는 manifest의 JSON Schema에 대해 검증됩니다. 사용자는 다음 방식으로 Plugin을 구성합니다.

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

채널별 config에는 대신 채널 config 섹션을 사용하세요.

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

### 채널 config schema 빌드

`buildChannelConfigSchema`를 사용해 Zod schema를 Plugin 소유 config artifact에서 사용하는 `ChannelConfigSchema` 래퍼로 변환하세요.

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

서드파티 Plugin의 경우 콜드 경로 계약은 여전히 Plugin manifest입니다. 생성된 JSON Schema를 `openclaw.plugin.json#channelConfigs`에 미러링하여 config schema, 설정, UI 표면이 런타임 코드를 로드하지 않고도 `channels.<id>`를 검사할 수 있게 하세요.

## 설정 마법사

채널 Plugin은 `openclaw onboard`를 위한 대화형 설정 마법사를 제공할 수 있습니다. 마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다.

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

`ChannelSetupWizard` 타입은 `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등을 지원합니다. 전체 예시는 번들된 Plugin 패키지(예: Discord Plugin `src/channel.setup.ts`)를 참고하세요.

<AccordionGroup>
  <Accordion title="공유 allowFrom 프롬프트">
    표준 `note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM allowlist 프롬프트의 경우, `openclaw/plugin-sdk/setup`의 공유 설정 헬퍼인 `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, `createNestedChannelParsedAllowFromPrompt(...)`를 선호하세요.
  </Accordion>
  <Accordion title="표준 채널 설정 상태">
    레이블, 점수, 선택적 추가 줄만 달라지는 채널 설정 상태 블록의 경우, 각 Plugin에서 같은 `status` 객체를 직접 작성하는 대신 `openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 선호하세요.
  </Accordion>
  <Accordion title="선택적 채널 설정 표면">
    특정 컨텍스트에서만 표시되어야 하는 선택적 설정 표면의 경우, `openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요.

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

    `plugin-sdk/channel-setup`은 선택적 설치 표면의 절반만 필요할 때 사용할 수 있는 더 낮은 수준의 `createOptionalChannelSetupAdapter(...)` 및 `createOptionalChannelSetupWizard(...)` 빌더도 노출합니다.

    생성된 선택적 어댑터/마법사는 실제 config 쓰기에서 실패 폐쇄 방식으로 동작합니다. `validateInput`, `applyAccountConfig`, `finalize` 전반에서 하나의 설치 필요 메시지를 재사용하며, `docsPath`가 설정된 경우 문서 링크를 추가합니다.

  </Accordion>
  <Accordion title="바이너리 기반 설정 헬퍼">
    바이너리 기반 설정 UI의 경우, 동일한 바이너리/상태 연결 코드를 모든 채널에 복사하는 대신 공유 위임 헬퍼를 선호하세요.

    - `createDetectedBinaryStatus(...)`: 레이블, 힌트, 점수, 바이너리 감지만 달라지는 상태 블록용
    - `createCliPathTextInput(...)`: 경로 기반 텍스트 입력용
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, `createDelegatedResolveConfigured(...)`: `setupEntry`가 더 무거운 전체 마법사로 lazy하게 전달해야 할 때
    - `createDelegatedTextInputShouldPrompt(...)`: `setupEntry`가 `textInputs[*].shouldPrompt` 결정만 위임하면 될 때

  </Accordion>
</AccordionGroup>

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/tools/clawhub)에 게시한 다음 설치합니다.

<Tabs>
  <Tab title="자동(ClawHub 후 npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 폴백합니다.

  </Tab>
  <Tab title="ClawHub만">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 패키지 spec">
    패키지가 아직 ClawHub로 이동하지 않았거나, 마이그레이션 중에 직접 npm 설치 경로가 필요할 때 npm을 사용하세요.

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**저장소 내 Plugin:** 번들된 Plugin 워크스페이스 트리 아래에 배치하면 빌드 중 자동으로 발견됩니다.

**사용자는 다음을 설치할 수 있습니다.**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 소스 설치의 경우 `openclaw plugins install`은 상속된 전역 npm 설치 설정을 무시하고 프로젝트 로컬 `npm install --ignore-scripts`(수명 주기 스크립트 없음)를 실행합니다. Plugin 의존성 트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

<Note>
번들된 OpenClaw 소유 Plugin만 시작 시 복구 예외입니다. 패키지 설치에서 Plugin 구성, 레거시 채널 구성 또는 번들된 기본 활성화 매니페스트로 활성화된 Plugin을 발견하면, 시작 시 가져오기 전에 해당 Plugin의 누락된 런타임 의존성을 설치합니다. 운영자는 `openclaw plugins deps`로 이 단계를 검사하거나 복구할 수 있습니다. 서드 파티 Plugin은 시작 시 설치에 의존해서는 안 되며, 명시적 Plugin 설치 프로그램을 계속 사용해야 합니다.
</Note>

번들된 패키지 수준 런타임 의존성은 명시적 메타데이터이며, Gateway 시작 시 빌드된 JavaScript에서 추론되지 않습니다. 공유 OpenClaw 루트 의존성을 외부 번들 Plugin 런타임 미러 안에서 사용할 수 있어야 한다면, 루트 패키지 매니페스트의 `openclaw.bundle.mirroredRootRuntimeDependencies`에 선언하세요.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins) — 단계별 시작 가이드
- [Plugin 매니페스트](/ko/plugins/manifest) — 전체 매니페스트 스키마 참조
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry`
