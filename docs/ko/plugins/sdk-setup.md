---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - setup-entry.ts와 index.ts의 차이를 이해해야 합니다.
    - Plugin 구성 스키마 또는 package.json의 openclaw 메타데이터를 정의하고 있습니다.
sidebarTitle: Setup and config
summary: 설정 마법사, setup-entry.ts, 구성 스키마 및 package.json 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-07-12T01:08:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin 패키징(`package.json` 메타데이터), 매니페스트(`openclaw.plugin.json`), 설정 엔트리 및 구성 스키마에 대한 참고 자료입니다.

<Tip>
**단계별 안내를 찾고 계신가요?** 사용 방법 가이드에서는 맥락에 맞춰 패키징을 설명합니다: [채널 Plugin](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및 [Provider Plugin](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 Plugin 시스템에 Plugin이 제공하는 기능을 알리는 `openclaw` 필드가 필요합니다.

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
  <Tab title="Provider Plugin / ClawHub 기준">
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
ClawHub에 외부 게시하려면 `compat` 및 `build`가 필요합니다. 표준 게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.
</Note>

### `openclaw` 필드

<ParamField path="extensions" type="string[]">
  엔트리 포인트 파일입니다(패키지 루트 기준 상대 경로). 워크스페이스 및 git 체크아웃 개발에 유효한 소스 엔트리입니다.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions`에 대응하는 빌드된 JavaScript 파일입니다. OpenClaw가 설치된 npm 패키지를 로드할 때 우선 사용됩니다. 소스/빌드 결과의 해석 순서는 [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints)를 참조하세요.
</ParamField>
<ParamField path="setupEntry" type="string">
  설정 전용 경량 엔트리입니다(선택 사항).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry`에 대응하는 빌드된 JavaScript 파일입니다. `setupEntry`도 설정되어 있어야 합니다.
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` 대체 Plugin 식별 정보입니다. id 또는 레이블을 파생할 채널/Provider 메타데이터가 Plugin에 없을 때 사용됩니다.
</ParamField>
<ParamField path="channel" type="object">
  설정, 선택기, 빠른 시작 및 상태 화면을 위한 채널 카탈로그 메타데이터입니다.
</ParamField>
<ParamField path="install" type="object">
  설치 힌트입니다: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  시작 동작 플래그입니다.
</ParamField>
<ParamField path="compat" type="object">
  이 Plugin이 지원하는 `pluginApi` 버전 범위입니다. 외부 ClawHub 게시에 필수입니다.
</ParamField>

<Note>
Provider ID(`providers: string[]`)는 패키지 메타데이터가 아니라 매니페스트 메타데이터입니다. 여기서 선언하지 말고 `openclaw.plugin.json`에서 선언하세요. [Plugin 매니페스트](/ko/plugins/manifest)를 참조하세요.
</Note>

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전에 채널 검색 및 설정 화면에서 사용하는 가벼운 패키지 메타데이터입니다.

| 필드                                   | 유형       | 의미                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 표준 채널 ID입니다.                                                           |
| `label`                                | `string`   | 기본 채널 레이블입니다.                                                       |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 사용하는 선택기/설정 레이블입니다.                     |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그 및 상태 화면을 위한 보조 상세 레이블입니다.           |
| `docsPath`                             | `string`   | 설정 및 선택 링크에 사용할 문서 경로입니다.                                  |
| `docsLabel`                            | `string`   | 문서 링크의 레이블이 채널 ID와 달라야 할 때 사용할 재정의 레이블입니다.       |
| `blurb`                                | `string`   | 온보딩/카탈로그용 짧은 설명입니다.                                            |
| `order`                                | `number`   | 채널 카탈로그의 정렬 순서입니다.                                              |
| `aliases`                              | `string[]` | 채널 선택에 사용할 추가 조회 별칭입니다.                                     |
| `preferOver`                           | `string[]` | 이 채널보다 우선순위가 낮아야 하는 Plugin/채널 ID입니다.                      |
| `systemImage`                          | `string`   | 채널 UI 카탈로그의 선택적 아이콘/시스템 이미지 이름입니다.                    |
| `selectionDocsPrefix`                  | `string`   | 선택 화면의 문서 링크 앞에 표시할 접두사 텍스트입니다.                        |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 안내 문구에서 레이블이 있는 문서 링크 대신 문서 경로를 직접 표시합니다. |
| `selectionExtras`                      | `string[]` | 선택 안내 문구에 추가되는 짧은 문자열입니다.                                 |
| `markdownCapable`                      | `boolean`  | 발신 형식 결정 시 해당 채널이 마크다운을 지원함을 나타냅니다.                 |
| `exposure`                             | `object`   | 설정, 구성된 목록 및 문서 화면에서 채널의 표시 여부를 제어합니다.             |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널에서 표준 빠른 시작 `allowFrom` 설정 흐름을 사용하도록 합니다.         |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나뿐인 경우에도 명시적인 계정 연결을 요구합니다.                     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 채널의 공지 대상을 확인할 때 세션 조회를 우선합니다.                       |

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

`exposure`에서 지원하는 항목은 다음과 같습니다.

- `configured`: 구성됨/상태 형식의 목록 화면에 채널을 포함합니다.
- `setup`: 대화형 설정/구성 선택기에 채널을 포함합니다.
- `docs`: 문서/탐색 화면에서 채널을 공개 대상으로 표시합니다.

<Note>
`showConfigured` 및 `showInSetup`은 기존 별칭으로 계속 지원됩니다. `exposure`를 우선 사용하세요.
</Note>

### `openclaw.install`

`openclaw.install`은 매니페스트 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드                         | 유형                                | 의미                                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 설치/업데이트 및 온보딩의 요청 시 설치 흐름에 사용할 표준 ClawHub 사양입니다.                 |
| `npmSpec`                    | `string`                            | 설치/업데이트 대체 흐름에 사용할 표준 npm 사양입니다.                                        |
| `localPath`                  | `string`                            | 로컬 개발 또는 번들 설치 경로입니다.                                                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 여러 소스를 사용할 수 있을 때 선호하는 설치 소스입니다.                                      |
| `minHostVersion`             | `string`                            | 지원되는 최소 OpenClaw 버전입니다. 형식은 `>=x.y.z` 또는 `>=x.y.z-prerelease`입니다.          |
| `expectedIntegrity`          | `string`                            | 고정 설치에서 기대되는 npm 배포 무결성 문자열로, 일반적으로 `sha512-...` 형식입니다.          |
| `allowInvalidConfigRecovery` | `boolean`                           | 번들 Plugin 재설치 흐름에서 특정한 오래된 구성 오류를 복구할 수 있도록 합니다.                |
| `requiredPlatformPackages`   | `string[]`                          | npm 설치 중 검증되는 필수 플랫폼별 npm 별칭입니다.                                            |

<AccordionGroup>
  <Accordion title="온보딩 동작">
    대화형 온보딩에서는 요청 시 설치 화면에 `openclaw.install`을 사용합니다. Plugin이 런타임 로드 전에 Provider 인증 선택 항목 또는 채널 설정/카탈로그 메타데이터를 노출하면 온보딩에서 ClawHub, npm 또는 로컬 설치 여부를 묻고 Plugin을 설치하거나 활성화한 다음 선택한 흐름을 계속할 수 있습니다. ClawHub 선택 항목은 `clawhubSpec`을 사용하며, 값이 있으면 우선됩니다. npm 선택 항목에는 레지스트리 `npmSpec`이 포함된 신뢰할 수 있는 카탈로그 메타데이터가 필요합니다(정확한 버전 및 `expectedIntegrity`는 선택적 고정값이며, 설정된 경우 설치/업데이트 시 적용됩니다). "표시할 내용"은 `openclaw.plugin.json`에, "설치 방법"은 `package.json`에 유지하세요.
  </Accordion>
  <Accordion title="minHostVersion 적용">
    `minHostVersion`이 설정되면 설치 및 비번들 매니페스트 레지스트리 로드 모두에서 이를 적용합니다. 이전 버전의 호스트는 외부 Plugin을 건너뛰며, 유효하지 않은 버전 문자열은 거부됩니다. 번들 소스 Plugin은 호스트 체크아웃과 동일한 버전인 것으로 간주합니다.
  </Accordion>
  <Accordion title="고정된 npm 설치">
    고정된 npm 설치의 경우 `npmSpec`에 정확한 버전을 유지하고 예상 아티팩트 무결성을 추가하세요.

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
    `allowInvalidConfigRecovery`는 손상된 구성을 일반적으로 우회하는 기능이 아닙니다. 이는 번들 Plugin 전용의 제한된 복구 기능으로, 재설치/설정 과정에서 누락된 번들 Plugin 경로나 같은 Plugin의 오래된 `channels.<id>` 항목처럼 알려진 업그레이드 잔여 문제를 복구할 수 있게 합니다. 관련 없는 이유로 구성이 손상된 경우 설치는 여전히 안전하게 실패하며 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.
  </Accordion>
</AccordionGroup>

### 전체 로드 지연

채널 Plugin은 다음 설정을 사용하여 지연 로드를 활성화할 수 있습니다.

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

활성화하면 OpenClaw는 이미 구성된 채널에서도 수신 대기 전 시작 단계에 `setupEntry`만 로드합니다. 전체 엔트리는 Gateway가 수신 대기를 시작한 후 로드됩니다.

<Warning>
`setupEntry`가 Gateway의 수신 대기 시작 전에 필요한 모든 항목(채널 등록, HTTP 경로, Gateway 메서드)을 등록하는 경우에만 지연 로드를 활성화하세요. 전체 엔트리가 필수 시작 기능을 담당한다면 기본 동작을 유지하세요.
</Warning>

설정/전체 엔트리가 Gateway RPC 메서드를 등록한다면 Plugin별 접두사 아래에 두세요. 예약된 핵심 관리 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 핵심에서 계속 소유하며 항상 `operator.admin`으로 정규화됩니다.

## Plugin 매니페스트

모든 네이티브 Plugin은 패키지 루트에 `openclaw.plugin.json`을 포함하여 배포해야 합니다. OpenClaw는 이를 사용해 Plugin 코드를 실행하지 않고 구성을 검증합니다.

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

채널 Plugin의 경우 `channels`를 추가하고, 제공자 Plugin의 경우 `providers`를 추가합니다.

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

구성이 없는 Plugin도 스키마를 포함하여 배포해야 합니다. 빈 스키마도 유효합니다.

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

Skills와 Plugin 패키지는 서로 다른 ClawHub 게시 명령을 사용합니다. Plugin 패키지에는 패키지 전용 명령을 사용하세요.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>`는 Plugin 패키지가 아닌 Skills 폴더를 게시하는 별도의 명령입니다. [ClawHub에 게시하기](/ko/clawhub/publishing)를 참조하세요.
</Note>

## 설정 진입점

`setup-entry.ts`는 OpenClaw에 설정 표면(온보딩, 구성 복구, 비활성화된 채널 검사)만 필요할 때 로드하는 `index.ts`의 경량 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이를 통해 설정 흐름 중 무거운 런타임 코드(암호화 라이브러리, CLI 등록, 백그라운드 서비스)를 로드하지 않을 수 있습니다.

설정에 안전한 내보내기를 사이드카 모듈에 유지하는 번들 워크스페이스 채널은 `defineSetupPluginEntry(...)` 대신 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은 선택적 `runtime` 내보내기도 지원하므로 설정 시점의 런타임 연결을 경량화하고 명시적으로 유지할 수 있습니다.

<AccordionGroup>
  <Accordion title="OpenClaw가 전체 진입점 대신 setupEntry를 사용하는 경우">
    - 채널이 비활성화되어 있지만 설정/온보딩 표면이 필요한 경우.
    - 채널이 활성화되어 있지만 구성되지 않은 경우.
    - 지연 로딩이 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="setupEntry가 등록해야 하는 항목">
    - 채널 Plugin 객체(`defineSetupPluginEntry`를 통해).
    - Gateway 수신 전에 필요한 모든 HTTP 경로.
    - 시작 중 필요한 모든 Gateway 메서드.

    이러한 시작용 Gateway 메서드에서도 `config.*` 또는 `update.*` 같은 예약된 핵심 관리 네임스페이스는 사용하지 않아야 합니다.

  </Accordion>
  <Accordion title="setupEntry에 포함하지 않아야 하는 항목">
    - CLI 등록.
    - 백그라운드 서비스.
    - 무거운 런타임 가져오기(암호화, SDK).
    - 시작 후에만 필요한 Gateway 메서드.

  </Accordion>
</AccordionGroup>

### 범위가 좁은 설정 도우미 가져오기

설정 전용 핫 경로에서 설정 표면의 일부만 필요하다면 더 광범위한 `plugin-sdk/setup` 통합 진입점보다 범위가 좁은 설정 도우미 연결부를 사용하세요.

| 가져오기 경로                      | 용도                                                                                      | 주요 내보내기                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry`/지연 채널 시작에서 계속 사용할 수 있는 설정 시점 런타임 도우미               | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 사용 중단된 호환성 별칭. `plugin-sdk/setup-runtime`을 사용하세요                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 설정/설치 CLI/아카이브/문서 도우미                                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은 구성 패치 도우미를 포함해 공유 설정 도구 모음 전체가 필요하다면 더 광범위한 `plugin-sdk/setup` 연결부를 사용하세요.

고정된 설정 마법사 문구에는 `createSetupTranslator(...)`를 사용하세요. 이 함수는 CLI 마법사의 로캘(`OPENCLAW_LOCALE`, 그다음 시스템 로캘 변수)을 따르며, 사용할 수 없으면 영어로 대체합니다. Plugin별 설정 문구는 Plugin 소유 코드에 유지하고, 공통 설정 레이블, 상태 문구 및 공식 번들 Plugin 설정 문구에만 공유 카탈로그 키를 사용하세요.

설정 패치 어댑터는 가져올 때도 핫 경로의 안전성을 유지합니다. 번들 단일 계정 승격 계약 표면 조회는 지연 실행되므로, `plugin-sdk/setup-runtime`을 가져와도 어댑터가 실제로 사용되기 전에는 번들 계약 표면 탐색을 즉시 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정용 최상위 구성에서 `channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격되는 계정 범위의 값을 `accounts.default`로 이동합니다.

번들 채널은 설정 계약 표면을 통해 이 승격 범위를 좁히거나 동작을 재정의할 수 있습니다.

- `singleAccountKeysToMove`: 승격된 계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 명명된 계정이 이미 존재할 때 승격된 계정으로 이동할 키만 지정합니다. 공유 정책/전달 키는 채널 루트에 유지됩니다.
- `resolveSingleAccountPromotionTarget(...)`: 승격된 값을 받을 기존 계정을 선택합니다.

<Note>
Matrix는 현재 번들 예시입니다. 명명된 Matrix 계정이 정확히 하나만 이미 존재하거나 `defaultAccount`가 `Ops`와 같은 기존 비정규 키를 가리키는 경우, 승격 시 새로운 `accounts.default` 항목을 만드는 대신 해당 계정을 유지합니다.
</Note>

## 구성 스키마

Plugin 구성은 매니페스트의 JSON Schema를 기준으로 검증됩니다. 사용자는 다음과 같이 Plugin을 구성합니다.

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

Plugin은 등록 중에 이 구성을 `api.pluginConfig`로 전달받습니다.

채널별 구성에는 대신 채널 구성 섹션을 사용하세요.

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

### 채널 구성 스키마 빌드

`buildChannelConfigSchema`를 사용하여 Zod 스키마를 Plugin 소유 구성 아티팩트에서 사용하는 `ChannelConfigSchema` 래퍼로 변환하세요.

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

계약을 이미 JSON Schema 또는 TypeBox로 작성했다면 직접 헬퍼를 사용하여 OpenClaw가 메타데이터 경로에서 Zod를 JSON Schema로 변환하는 과정을 생략할 수 있게 하세요.

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

서드 파티 Plugin에서도 콜드 경로 계약은 여전히 Plugin 매니페스트입니다. 생성된 JSON Schema를 `openclaw.plugin.json#channelConfigs`에 반영하여 구성 스키마, 설정 및 UI 표면이 런타임 코드를 로드하지 않고도 `channels.<id>`를 검사할 수 있게 하세요.

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

`ChannelSetupWizard`는 `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등도 지원합니다. 전체 번들 예시는 Discord Plugin의 `src/setup-core.ts`를 참조하세요.

<AccordionGroup>
  <Accordion title="공유 allowFrom 프롬프트">
    표준 `note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트에는 `openclaw/plugin-sdk/setup`의 공유 설정 헬퍼인 `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, `createNestedChannelParsedAllowFromPrompt(...)`를 사용하는 것이 좋습니다.
  </Accordion>
  <Accordion title="표준 채널 설정 상태">
    레이블, 점수 및 선택적 추가 줄만 달라지는 채널 설정 상태 블록에는 각 Plugin에서 동일한 `status` 객체를 직접 작성하는 대신 `openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 사용하는 것이 좋습니다.
  </Accordion>
  <Accordion title="선택적 채널 설정 표면">
    특정 컨텍스트에서만 표시해야 하는 선택적 설정 표면에는 `openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요.

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

    선택적 설치 표면의 한쪽만 필요한 경우, `plugin-sdk/channel-setup`은 더 저수준의 `createOptionalChannelSetupAdapter(...)` 및 `createOptionalChannelSetupWizard(...)` 빌더도 제공합니다.

    생성된 선택적 어댑터/마법사는 실제 구성 쓰기에서 안전하게 실패합니다. `validateInput`, `applyAccountConfig`, `finalize` 전반에서 하나의 설치 필요 메시지를 재사용하며, `docsPath`가 설정되어 있으면 문서 링크를 추가합니다.

  </Accordion>
  <Accordion title="바이너리 기반 설정 도우미">
    바이너리 기반 설정 UI에서는 동일한 바이너리/상태 연결 코드를 모든 채널에 복사하는 대신 공유 위임 도우미를 사용하는 것이 좋습니다.

    - 레이블, 힌트, 점수, 바이너리 감지만 달라지는 상태 블록에는 `createDetectedBinaryStatus(...)`
    - 경로 기반 텍스트 입력에는 `createCliPathTextInput(...)`
    - `setupEntry`가 필요할 때 더 복잡한 전체 마법사로 지연 위임해야 하는 경우 `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, `createDelegatedResolveConfigured(...)`
    - `setupEntry`가 `textInputs[*].shouldPrompt` 결정만 위임하면 되는 경우 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/clawhub)에 게시한 후 설치합니다.

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    단순 패키지 명세는 실행 전환 과정에서 npm으로부터 설치됩니다. 단, 이름이 번들 또는 공식 Plugin ID와 일치하면 OpenClaw는 대신 해당 로컬/공식 복사본을 사용합니다. 소스를 확정적으로 선택하려면 `clawhub:`, `npm:`, `git:`, `npm-pack:`을 사용하세요. 자세한 내용은 [Plugin 관리](/ko/plugins/manage-plugins)를 참조하세요.

  </Tab>
  <Tab title="ClawHub 전용">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 패키지 명세">
    패키지가 아직 ClawHub로 이전되지 않았거나 마이그레이션 중에 직접적인 npm 설치 경로가 필요한 경우 npm을 사용하세요.

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**저장소 내 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 배치하세요. 빌드 중에 자동으로 검색됩니다.

<Info>
npm에서 가져오는 설치의 경우 `openclaw plugins install`은 수명 주기 스크립트를 비활성화한 상태(`--ignore-scripts`)로 `~/.openclaw/npm/projects` 아래의 Plugin별 프로젝트에 패키지를 설치합니다. Plugin 종속성 트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

<Note>
Gateway 시작 과정에서는 Plugin 종속성을 설치하지 않습니다. npm/git/ClawHub 설치 흐름이 종속성 수렴을 담당하며, 로컬 Plugin은 종속성이 이미 설치되어 있어야 합니다.
</Note>

번들 패키지 메타데이터는 명시적으로 정의되며, Gateway 시작 시 빌드된 JavaScript에서 추론되지 않습니다. 런타임 종속성은 이를 소유하는 Plugin 패키지에 포함되어야 하며, 패키징된 OpenClaw의 시작 과정에서는 Plugin 종속성을 복구하거나 미러링하지 않습니다.

## 관련 항목

- [Plugin 구축](/ko/plugins/building-plugins) — 단계별 시작 가이드
- [Plugin 매니페스트](/ko/plugins/manifest) — 전체 매니페스트 스키마 참조
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry`
