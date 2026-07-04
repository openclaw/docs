---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - setup-entry.ts와 index.ts를 이해해야 합니다
    - Plugin 구성 스키마 또는 package.json openclaw 메타데이터를 정의하고 있습니다
sidebarTitle: Setup and config
summary: 설정 마법사, setup-entry.ts, 설정 스키마 및 package.json 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-07-04T15:12:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

패키징(`package.json` 메타데이터), 매니페스트(`openclaw.plugin.json`), 설정 항목, 구성 스키마를 위한 Plugin 참조입니다.

<Tip>
**연습 가이드를 찾고 있나요?** 방법 가이드는 맥락 안에서 패키징을 다룹니다: [채널 Plugin](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및 [Provider Plugin](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 Plugin 시스템에 Plugin이 무엇을 제공하는지 알려주는 `openclaw` 필드가 필요합니다.

<Tabs>
  <Tab title="채널 Plugin">
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
  <Tab title="Provider Plugin / ClawHub 기준선">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
Plugin을 ClawHub에 외부로 게시하는 경우, 해당 `compat` 및 `build` 필드는 필수입니다. 표준 게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.
</Note>

### `openclaw` 필드

<ParamField path="extensions" type="string[]">
  진입점 파일입니다(패키지 루트 기준 상대 경로).
</ParamField>
<ParamField path="setupEntry" type="string">
  가벼운 설정 전용 항목입니다(선택 사항).
</ParamField>
<ParamField path="channel" type="object">
  설정, 선택기, 빠른 시작, 상태 화면을 위한 채널 카탈로그 메타데이터입니다.
</ParamField>
<ParamField path="providers" type="string[]">
  이 Plugin이 등록한 Provider ID입니다.
</ParamField>
<ParamField path="install" type="object">
  설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  시작 동작 플래그입니다.
</ParamField>

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전에 채널 검색 및 설정 화면에 사용하는 가벼운 패키지 메타데이터입니다.

| 필드                                   | 타입       | 의미                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 표준 채널 ID입니다.                                                           |
| `label`                                | `string`   | 기본 채널 레이블입니다.                                                       |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 사용하는 선택기/설정 레이블입니다.                     |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그 및 상태 화면을 위한 보조 상세 레이블입니다.           |
| `docsPath`                             | `string`   | 설정 및 선택 링크를 위한 문서 경로입니다.                                     |
| `docsLabel`                            | `string`   | 문서 링크에 사용되는 레이블을 채널 ID와 다르게 해야 할 때 재정의합니다.       |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명입니다.                                              |
| `order`                                | `number`   | 채널 카탈로그의 정렬 순서입니다.                                              |
| `aliases`                              | `string[]` | 채널 선택을 위한 추가 조회 별칭입니다.                                        |
| `preferOver`                           | `string[]` | 이 채널보다 우선순위가 낮아야 하는 Plugin/채널 ID입니다.                      |
| `systemImage`                          | `string`   | 채널 UI 카탈로그를 위한 선택적 아이콘/시스템 이미지 이름입니다.               |
| `selectionDocsPrefix`                  | `string`   | 선택 화면에서 문서 링크 앞에 표시할 접두사 텍스트입니다.                      |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 레이블이 있는 문서 링크 대신 문서 경로를 직접 표시합니다.       |
| `selectionExtras`                      | `string[]` | 선택 문구에 추가되는 짧은 문자열입니다.                                       |
| `markdownCapable`                      | `boolean`  | 아웃바운드 서식 결정에서 채널을 Markdown 지원 채널로 표시합니다.              |
| `exposure`                             | `object`   | 설정, 구성된 목록, 문서 화면을 위한 채널 표시 여부 제어입니다.                |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널을 표준 빠른 시작 `allowFrom` 설정 흐름에 포함합니다.                  |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나만 있어도 명시적 계정 바인딩을 요구합니다.                         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 채널의 공지 대상을 확인할 때 세션 조회를 선호합니다.                       |

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

- `configured`: 구성됨/상태 형식의 목록 화면에 채널 포함
- `setup`: 대화형 설정/구성 선택기에 채널 포함
- `docs`: 문서/탐색 화면에서 채널을 공개 대상으로 표시

<Note>
`showConfigured` 및 `showInSetup`은 레거시 별칭으로 계속 지원됩니다. `exposure`를 선호하세요.
</Note>

### `openclaw.install`

`openclaw.install`은 매니페스트 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드                         | 타입                                | 의미                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 설치/업데이트 및 온보딩 주문형 설치 흐름을 위한 표준 ClawHub 명세입니다.          |
| `npmSpec`                    | `string`                            | 설치/업데이트 폴백 흐름을 위한 표준 npm 명세입니다.                               |
| `localPath`                  | `string`                            | 로컬 개발 또는 번들 설치 경로입니다.                                              |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 여러 소스를 사용할 수 있을 때 선호하는 설치 소스입니다.                           |
| `minHostVersion`             | `string`                            | `>=x.y.z` 또는 `>=x.y.z-prerelease` 형식의 최소 지원 OpenClaw 버전입니다.          |
| `expectedIntegrity`          | `string`                            | 고정 설치를 위한 예상 npm dist 무결성 문자열이며, 일반적으로 `sha512-...`입니다.  |
| `allowInvalidConfigRecovery` | `boolean`                           | 번들 Plugin 재설치 흐름이 특정 오래된 구성 실패에서 복구할 수 있게 합니다.        |
| `requiredPlatformPackages`   | `string[]`                          | npm 설치 중 검증되는 필수 플랫폼별 npm 별칭입니다.                                |

<AccordionGroup>
  <Accordion title="온보딩 동작">
    대화형 온보딩도 주문형 설치 화면에 `openclaw.install`을 사용합니다. Plugin이 런타임 로드 전에 Provider 인증 선택지 또는 채널 설정/카탈로그 메타데이터를 노출하면, 온보딩은 해당 선택지를 표시하고 ClawHub, npm 또는 로컬 설치를 묻고 Plugin을 설치하거나 활성화한 다음 선택한 흐름을 계속할 수 있습니다. ClawHub 온보딩 선택지는 `clawhubSpec`을 사용하며 존재할 때 선호됩니다. npm 선택지는 레지스트리 `npmSpec`이 있는 신뢰할 수 있는 카탈로그 메타데이터가 필요합니다. 정확한 버전과 `expectedIntegrity`는 선택적 npm 고정값입니다. `expectedIntegrity`가 있으면 설치/업데이트 흐름은 npm에 대해 이를 강제합니다. "무엇을 표시할지" 메타데이터는 `openclaw.plugin.json`에, "어떻게 설치할지" 메타데이터는 `package.json`에 유지하세요.
  </Accordion>
  <Accordion title="minHostVersion 강제">
    `minHostVersion`이 설정되면 설치와 비번들 매니페스트 레지스트리 로딩 모두 이를 강제합니다. 이전 호스트는 외부 Plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다. 번들 소스 Plugin은 호스트 체크아웃과 같은 버전으로 간주됩니다.
  </Accordion>
  <Accordion title="고정 npm 설치">
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
  <Accordion title="allowInvalidConfigRecovery 범위">
    `allowInvalidConfigRecovery`는 손상된 구성을 위한 일반 우회 수단이 아닙니다. 이는 좁은 범위의 번들 Plugin 복구 전용이므로, 누락된 번들 Plugin 경로나 동일한 Plugin의 오래된 `channels.<id>` 항목처럼 알려진 업그레이드 잔여물을 재설치/설정이 복구할 수 있습니다. 관련 없는 이유로 구성이 손상된 경우 설치는 여전히 닫힌 방식으로 실패하며 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.
  </Accordion>
</AccordionGroup>

### 지연된 전체 로드

채널 Plugin은 다음으로 지연 로딩을 선택할 수 있습니다.

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

활성화하면 OpenClaw는 이미 구성된 채널에 대해서도 수신 전 시작 단계에서 `setupEntry`만 로드합니다. 전체 항목은 Gateway가 수신을 시작한 뒤 로드됩니다.

<Warning>
`setupEntry`가 Gateway가 수신을 시작하기 전에 필요한 모든 것(채널 등록, HTTP 라우트, Gateway 메서드)을 등록할 때만 지연 로딩을 활성화하세요. 전체 항목이 필요한 시작 기능을 소유한다면 기본 동작을 유지하세요.
</Warning>

설정/전체 항목이 Gateway RPC 메서드를 등록하는 경우, Plugin별 접두사에 유지하세요. 예약된 core 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 core 소유로 유지되며 항상 `operator.admin`으로 확인됩니다.

## Plugin 매니페스트

모든 네이티브 Plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다. OpenClaw는 이를 사용해 Plugin 코드를 실행하지 않고 구성을 검증합니다.

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

채널 Plugin의 경우 `kind`와 `channels`를 추가하세요.

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

설정이 없는 Plugin도 스키마를 제공해야 합니다. 빈 스키마도 유효합니다.

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

Plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
레거시 Skills 전용 게시 별칭은 Skills용입니다. Plugin 패키지는 항상 `clawhub package publish`를 사용해야 합니다.
</Note>

## 설정 엔트리

`setup-entry.ts` 파일은 OpenClaw가 설정 표면만 필요할 때(온보딩, 설정 복구, 비활성화된 채널 검사) 로드하는 `index.ts`의 경량 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 설정 흐름 중에 무거운 런타임 코드(암호화 라이브러리, CLI 등록, 백그라운드 서비스)를 로드하지 않습니다.

사이드카 모듈에 설정에 안전한 내보내기를 유지하는 번들 워크스페이스 채널은 `defineSetupPluginEntry(...)` 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은 선택적 `runtime` 내보내기도 지원하므로 설정 시간 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

<AccordionGroup>
  <Accordion title="OpenClaw가 전체 엔트리 대신 setupEntry를 사용하는 경우">
    - 채널이 비활성화되어 있지만 설정/온보딩 표면이 필요한 경우.
    - 채널이 활성화되어 있지만 설정되지 않은 경우.
    - 지연 로딩이 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry가 등록해야 하는 항목">
    - 채널 Plugin 객체(`defineSetupPluginEntry`를 통해).
    - Gateway 수신 전에 필요한 모든 HTTP 라우트.
    - 시작 중에 필요한 모든 Gateway 메서드.

    이러한 시작 Gateway 메서드는 여전히 `config.*` 또는 `update.*`와 같은 예약된 코어 관리자 네임스페이스를 피해야 합니다.

  </Accordion>
  <Accordion title="setupEntry에 포함하지 말아야 할 항목">
    - CLI 등록.
    - 백그라운드 서비스.
    - 무거운 런타임 임포트(암호화, SDK).
    - 시작 후에만 필요한 Gateway 메서드.

  </Accordion>
</AccordionGroup>

### 좁은 설정 헬퍼 임포트

설정 전용 핫 경로에서는 설정 표면의 일부만 필요하다면 더 넓은 `plugin-sdk/setup` 엄브렐러보다 좁은 설정 헬퍼 이음새를 선호하세요.

| 임포트 경로                        | 사용 대상                                                                                | 주요 내보내기                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연 채널 시작에서 계속 사용 가능한 설정 시간 런타임 헬퍼 | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/setup-runtime`을 사용하세요                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 설정/설치 CLI/아카이브/문서 헬퍼                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은 설정 패치 헬퍼를 포함한 전체 공유 설정 도구 상자를 원할 때는 더 넓은 `plugin-sdk/setup` 이음새를 사용하세요.

고정 설정 마법사 문구에는 `createSetupTranslator(...)`를 사용하세요. 이는
CLI 마법사 로캘(`OPENCLAW_LOCALE`, 그다음 시스템 로캘 변수)을 따르며
영어로 폴백합니다. Plugin별 설정 텍스트는 Plugin이 소유한 코드에 두고,
공통 설정 레이블, 상태 텍스트, 공식 번들 Plugin 설정 문구에만
공유 카탈로그 키를 사용하세요.

설정 패치 어댑터는 임포트 시 핫 경로에 안전합니다. 번들 단일 계정 승격 계약 표면 조회가 지연되므로 어댑터가 실제로 사용되기 전에는 `plugin-sdk/setup-runtime`을 임포트해도 번들 계약 표면 검색을 즉시 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 설정에서 `channels.<id>.accounts.*`로 업그레이드할 때, 기본 공유 동작은 승격된 계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 설정 계약 표면을 통해 해당 승격을 좁히거나 재정의할 수 있습니다.

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름이 지정된 계정이 이미 있는 경우, 이 키만 승격된 계정으로 이동합니다. 공유 정책/전달 키는 채널 루트에 남습니다.
- `resolveSingleAccountPromotionTarget(...)`: 승격된 값을 받을 기존 계정을 선택합니다.

<Note>
Matrix가 현재 번들 예시입니다. 이름이 지정된 Matrix 계정이 정확히 하나 이미 있거나, `defaultAccount`가 `Ops` 같은 기존 비정규 키를 가리키는 경우, 승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다.
</Note>

## 설정 스키마

Plugin 설정은 매니페스트의 JSON Schema에 대해 검증됩니다. 사용자는 다음을 통해 Plugin을 설정합니다.

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

Plugin은 등록 중에 이 설정을 `api.pluginConfig`로 받습니다.

채널별 설정에는 대신 채널 설정 섹션을 사용하세요.

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

### 채널 설정 스키마 빌드

`buildChannelConfigSchema`를 사용하여 Zod 스키마를 Plugin 소유 설정 아티팩트에서 사용하는 `ChannelConfigSchema` 래퍼로 변환하세요.

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

계약을 이미 JSON Schema나 TypeBox로 작성하는 경우, OpenClaw가 메타데이터 경로에서 Zod-JSON-Schema 변환을 건너뛸 수 있도록 직접 헬퍼를 사용하세요.

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

타사 Plugin의 경우, 콜드 경로 계약은 여전히 Plugin 매니페스트입니다. 생성된 JSON Schema를 `openclaw.plugin.json#channelConfigs`에 미러링하여 설정 스키마, 설정, UI 표면이 런타임 코드를 로드하지 않고도 `channels.<id>`를 검사할 수 있게 하세요.

## 설정 마법사

채널 Plugin은 `openclaw onboard`에 대화형 설정 마법사를 제공할 수 있습니다. 마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다.

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

`ChannelSetupWizard` 타입은 `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등을 지원합니다. 전체 예시는 번들 Plugin 패키지(예: Discord Plugin `src/channel.setup.ts`)를 참조하세요.

<AccordionGroup>
  <Accordion title="공유 allowFrom 프롬프트">
    표준 `note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트에는 `openclaw/plugin-sdk/setup`의 공유 설정 헬퍼인 `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, `createNestedChannelParsedAllowFromPrompt(...)`를 선호하세요.
  </Accordion>
  <Accordion title="표준 채널 설정 상태">
    레이블, 점수, 선택적 추가 줄만 달라지는 채널 설정 상태 블록에는 각 Plugin에서 동일한 `status` 객체를 직접 작성하는 대신 `openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 선호하세요.
  </Accordion>
  <Accordion title="선택적 채널 설정 표면">
    특정 컨텍스트에서만 표시되어야 하는 선택적 설정 표면에는 `openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요.

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

    생성된 선택적 어댑터/마법사는 실제 설정 쓰기에서 실패 닫힘 방식으로 동작합니다. `validateInput`, `applyAccountConfig`, `finalize` 전반에 걸쳐 하나의 설치 필요 메시지를 재사용하고, `docsPath`가 설정된 경우 문서 링크를 추가합니다.

  </Accordion>
  <Accordion title="바이너리 기반 설정 헬퍼">
    바이너리 기반 설정 UI에는 동일한 바이너리/상태 연결 코드를 모든 채널에 복사하는 대신 공유 위임 헬퍼를 선호하세요.

    - `createDetectedBinaryStatus(...)`: 레이블, 힌트, 점수, 바이너리 감지만 달라지는 상태 블록에 사용
    - `createCliPathTextInput(...)`: 경로 기반 텍스트 입력에 사용
    - `setupEntry`가 더 무거운 전체 마법사로 지연 전달해야 할 때 `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, `createDelegatedResolveConfigured(...)` 사용
    - `setupEntry`가 `textInputs[*].shouldPrompt` 결정만 위임하면 될 때 `createDelegatedTextInputShouldPrompt(...)` 사용

  </Accordion>
</AccordionGroup>

## 게시 및 설치

**외부 Plugin:** [ClawHub](/clawhub)에 게시한 다음 설치합니다.

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    단순 패키지 명세는 출시 전환 기간 동안 npm에서 설치됩니다.

  </Tab>
  <Tab title="ClawHub 전용">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 패키지 명세">
    패키지가 아직 ClawHub로 이동하지 않았거나 마이그레이션 중 직접 npm 설치 경로가 필요할 때 npm을 사용합니다.

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**리포지토리 내 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 배치하면 빌드 중 자동으로 검색됩니다.

**사용자는 다음과 같이 설치할 수 있습니다.**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 기반 설치의 경우 `openclaw plugins install`은 라이프사이클 스크립트를 비활성화한 상태로 `~/.openclaw/npm/projects` 아래의 Plugin별 프로젝트에 패키지를 설치합니다. Plugin 의존성 트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

<Note>
Gateway 시작 시 Plugin 의존성은 설치되지 않습니다. npm/git/ClawHub 설치 흐름이 의존성 수렴을 담당하며, 로컬 Plugin은 의존성이 이미 설치되어 있어야 합니다.
</Note>

번들 패키지 메타데이터는 명시적이며, Gateway 시작 시 빌드된 JavaScript에서 추론되지 않습니다. 런타임 의존성은 해당 의존성을 소유한 Plugin 패키지에 속합니다. 패키징된 OpenClaw 시작 과정은 Plugin 의존성을 복구하거나 미러링하지 않습니다.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins) — 단계별 시작 가이드
- [Plugin 매니페스트](/ko/plugins/manifest) — 전체 매니페스트 스키마 참조
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry`
