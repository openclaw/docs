---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin 구성 schema를 제공하거나 Plugin 검증 오류를 디버그해야 합니다
summary: Plugin Manifest + JSON schema 요구 사항(엄격한 구성 검증)
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-24T08:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

이 페이지는 **네이티브 OpenClaw Plugin Manifest** 전용입니다.

호환 가능한 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참조하세요.

호환 가능한 번들 형식은 다른 Manifest 파일을 사용합니다.

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 Manifest가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만,
여기서 설명하는 `openclaw.plugin.json` schema를 기준으로 검증되지는 않습니다.

호환 가능한 번들의 경우, OpenClaw는 현재 레이아웃이 OpenClaw 런타임 기대치와
일치할 때 번들 메타데이터와 선언된 skill 루트, Claude 명령 루트, Claude 번들
`settings.json` 기본값, Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 네이티브 OpenClaw Plugin은 반드시 **Plugin 루트**에
`openclaw.plugin.json` 파일을 포함해야 합니다. OpenClaw는 이 Manifest를 사용해
**Plugin 코드를 실행하지 않고도** 구성을 검증합니다. Manifest가 없거나 잘못되면
Plugin 오류로 처리되며 구성 검증이 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
네이티브 기능 모델과 현재 외부 호환성 지침은
[Capability model](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에**
읽는 메타데이터입니다. 아래의 모든 항목은 Plugin 런타임을 부팅하지 않고도
검사할 수 있을 만큼 가벼워야 합니다.

**사용 용도:**

- Plugin ID, 구성 검증, 구성 UI 힌트
- 인증, 온보딩, 설정 메타데이터(alias, 자동 활성화, provider env var, 인증 선택지)
- 제어 평면 표면에 대한 활성화 힌트
- 축약형 모델 패밀리 소유권
- 정적 기능 소유권 스냅샷(`contracts`)
- 공유 `openclaw qa` 호스트가 검사할 수 있는 QA runner 메타데이터
- 카탈로그 및 검증 표면에 병합되는 채널별 구성 메타데이터

**사용하지 말아야 할 용도:** 런타임 동작 등록, 코드 entrypoint 선언,
또는 npm 설치 메타데이터. 이것들은 Plugin 코드와 `package.json`에 속합니다.

## 최소 예시

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 확장 예시

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API 키",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API 키",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API 키",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 최상위 필드 참조

| 필드                                 | 필수 여부 | 유형                             | 의미                                                                                                                                                                                                                              |
| ------------------------------------ | --------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예        | `string`                         | 정식 Plugin ID입니다. `plugins.entries.<id>`에서 사용되는 ID입니다.                                                                                                                                                               |
| `configSchema`                       | 예        | `object`                         | 이 Plugin 구성에 대한 인라인 JSON Schema입니다.                                                                                                                                                                                   |
| `enabledByDefault`                   | 아니요    | `true`                           | 번들 Plugin을 기본적으로 활성화된 상태로 표시합니다. 기본 비활성 상태로 두려면 생략하거나 `true`가 아닌 값을 설정하세요.                                                                                                         |
| `legacyPluginIds`                    | 아니요    | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | 아니요    | `string[]`                       | 인증, 구성 또는 모델 참조에 해당 provider ID가 언급되면 이 Plugin을 자동 활성화해야 하는 provider ID입니다.                                                                                                                      |
| `kind`                               | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin 종류를 선언합니다.                                                                                                                                                                   |
| `channels`                           | 아니요    | `string[]`                       | 이 Plugin이 소유하는 채널 ID입니다. 검색 및 구성 검증에 사용됩니다.                                                                                                                                                               |
| `providers`                          | 아니요    | `string[]`                       | 이 Plugin이 소유하는 provider ID입니다.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | 아니요    | `string`                         | 전체 Plugin 런타임을 활성화하지 않고도 로드할 수 있는, Manifest 범위 provider 카탈로그 메타데이터용 경량 provider 검색 모듈 경로입니다. Plugin 루트를 기준으로 한 상대 경로입니다.                                               |
| `modelSupport`                       | 아니요    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는 Manifest 소유 축약형 모델 패밀리 메타데이터입니다.                                                                                                                                |
| `providerEndpoints`                  | 아니요    | `object[]`                       | core가 provider 런타임이 로드되기 전에 분류해야 하는 provider route용 Manifest 소유 endpoint host/baseUrl 메타데이터입니다.                                                                                                      |
| `cliBackends`                        | 아니요    | `string[]`                       | 이 Plugin이 소유하는 CLI 추론 백엔드 ID입니다. 명시적 구성 참조로부터 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                                     |
| `syntheticAuthRefs`                  | 아니요    | `string[]`                       | 런타임이 로드되기 전 콜드 모델 검색 중에 Plugin 소유 synthetic auth hook을 확인해야 하는 provider 또는 CLI 백엔드 참조입니다.                                                                                                    |
| `nonSecretAuthMarkers`               | 아니요    | `string[]`                       | 비밀 정보가 아닌 로컬, OAuth 또는 ambient 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API 키 값입니다.                                                                                                                |
| `commandAliases`                     | 아니요    | `object[]`                       | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는, 이 Plugin이 소유하는 명령 이름입니다.                                                                                                                       |
| `providerAuthEnvVars`                | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 provider 인증 env 메타데이터입니다.                                                                                                                                |
| `providerAuthAliases`                | 아니요    | `Record<string, string>`         | 인증 조회 시 다른 provider ID를 재사용해야 하는 provider ID입니다. 예를 들어 기본 provider API 키 및 인증 프로필을 공유하는 coding provider가 이에 해당합니다.                                                                  |
| `channelEnvVars`                     | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 채널 env 메타데이터입니다. env 기반 채널 설정 또는 일반 시작/구성 헬퍼가 확인해야 하는 인증 표면에 사용하세요.                                                     |
| `providerAuthChoices`                | 아니요    | `object[]`                       | 온보딩 선택기, 선호 provider 확인, 단순 CLI 플래그 연결을 위한 경량 인증 선택 메타데이터입니다.                                                                                                                                 |
| `activation`                         | 아니요    | `object`                         | provider, 명령, 채널, route, 기능 트리거 로딩을 위한 경량 활성화 플래너 메타데이터입니다. 메타데이터 전용이며, 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                                    |
| `setup`                              | 아니요    | `object`                         | 검색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 경량 설정/온보딩 설명자입니다.                                                                                                                               |
| `qaRunners`                          | 아니요    | `object[]`                       | Plugin 런타임이 로드되기 전에 공유 `openclaw qa` 호스트가 사용하는 경량 QA runner 설명자입니다.                                                                                                                                  |
| `contracts`                          | 아니요    | `object`                         | 외부 인증 hook, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 음악 생성, 비디오 생성, 웹 가져오기, 웹 검색, tool 소유권을 위한 정적 번들 기능 스냅샷입니다.                                                        |
| `mediaUnderstandingProviderMetadata` | 아니요    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider ID에 대한 경량 미디어 이해 기본값입니다.                                                                                                                               |
| `channelConfigs`                     | 아니요    | `Record<string, object>`         | 런타임이 로드되기 전에 검색 및 검증 표면에 병합되는 Manifest 소유 채널 구성 메타데이터입니다.                                                                                                                                    |
| `skills`                             | 아니요    | `string[]`                       | Plugin 루트를 기준으로 한 상대 경로의 Skills 디렉터리입니다.                                                                                                                                                                      |
| `name`                               | 아니요    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                             |
| `description`                        | 아니요    | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                                            |
| `version`                            | 아니요    | `string`                         | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                                                    |
| `uiHints`                            | 아니요    | `Record<string, object>`         | 구성 필드용 UI 레이블, placeholder, 민감도 힌트입니다.                                                                                                                                                                            |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택지를 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드                 | 필수 여부 | 유형                                            | 의미                                                                                                     |
| -------------------- | --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`           | 예        | `string`                                        | 이 선택지가 속한 provider ID입니다.                                                                      |
| `method`             | 예        | `string`                                        | 디스패치할 인증 방법 ID입니다.                                                                           |
| `choiceId`           | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 ID입니다.                                             |
| `choiceLabel`        | 아니요    | `string`                                        | 사용자에게 표시되는 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대체값으로 사용합니다.               |
| `choiceHint`         | 아니요    | `string`                                        | 선택기에 표시되는 짧은 도움말 텍스트입니다.                                                              |
| `assistantPriority`  | 아니요    | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                          |
| `assistantVisibility`| 아니요    | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 허용하면서 assistant 선택기에서는 이 선택지를 숨깁니다.                                 |
| `deprecatedChoiceIds`| 아니요    | `string[]`                                      | 사용자를 이 대체 선택지로 리디렉션해야 하는 레거시 선택 ID입니다.                                        |
| `groupId`            | 아니요    | `string`                                        | 관련 선택지를 그룹화하기 위한 선택적 그룹 ID입니다.                                                      |
| `groupLabel`         | 아니요    | `string`                                        | 해당 그룹의 사용자 표시용 레이블입니다.                                                                  |
| `groupHint`          | 아니요    | `string`                                        | 그룹에 대한 짧은 도움말 텍스트입니다.                                                                    |
| `optionKey`          | 아니요    | `string`                                        | 단일 플래그 기반 단순 인증 흐름을 위한 내부 option 키입니다.                                             |
| `cliFlag`            | 아니요    | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                       |
| `cliOption`          | 아니요    | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI option 형식입니다.                                            |
| `cliDescription`     | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                        |
| `onboardingScopes`   | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택지가 나타나야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.              |

## commandAliases 참조

사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려 할 수 있는
런타임 명령 이름을 Plugin이 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는
Plugin 런타임 코드를 import하지 않고 이 메타데이터를 진단에 사용합니다.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 필드         | 필수 여부 | 유형              | 의미                                                                       |
| ------------ | --------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속한 명령 이름입니다.                                          |
| `kind`       | 아니요    | `"runtime-slash"` | 루트 CLI 명령이 아니라 채팅 슬래시 명령으로 alias를 표시합니다.            |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.            |

## activation 참조

Plugin이 어떤 제어 평면 이벤트에 대해 활성화/로드 계획에 포함되어야 하는지
저렴하게 선언할 수 있을 때 `activation`을 사용하세요.

이 블록은 플래너 메타데이터이지 lifecycle API가 아닙니다. 런타임 동작을 등록하지 않고,
`register(...)`를 대체하지 않으며, Plugin 코드가 이미 실행되었음을 보장하지도 않습니다.
활성화 플래너는 기존 Manifest 소유권 메타데이터인 `providers`, `channels`,
`commandAliases`, `setup.providers`, `contracts.tools`, hook으로 대체하기 전에
후보 Plugin 범위를 좁히기 위해 이 필드를 사용합니다.

이미 소유권을 설명하는 가장 좁은 메타데이터를 우선하세요. 관계를 표현할 수 있다면
`providers`, `channels`, `commandAliases`, setup 설명자 또는 `contracts`를 사용하세요.
이러한 소유권 필드로 표현할 수 없는 추가 플래너 힌트에만 `activation`을 사용하세요.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry` 또는 다른 런타임/Plugin entrypoint를 대체하지도 않습니다.
현재 소비자는 이를 더 넓은 Plugin 로드 전에 범위를 좁히는 힌트로 사용하므로,
활성화 메타데이터가 누락되어도 일반적으로는 성능 비용만 발생합니다.
기존 Manifest 소유권 대체 경로가 여전히 존재하는 동안에는 정확성은 바뀌지 않아야 합니다.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 필드             | 필수 여부 | 유형                                                 | 의미                                                                                      |
| ---------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `onProviders`    | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 provider ID입니다.                           |
| `onCommands`     | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 명령 ID입니다.                               |
| `onChannels`     | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 채널 ID입니다.                               |
| `onRoutes`       | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 route 종류입니다.                            |
| `onCapabilities` | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에 사용되는 광범위한 기능 힌트입니다. 가능하면 더 좁은 필드를 우선하세요. |

현재 실제 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체됩니다
- 채널 트리거 setup/channel 계획은 명시적 채널 활성화 메타데이터가 없을 때
  레거시 `channels[]` 소유권으로 대체됩니다
- provider 트리거 setup/runtime 계획은 명시적 provider
  활성화 메타데이터가 없을 때 레거시 `providers[]`와 최상위 `cliBackends[]`
  소유권으로 대체됩니다

플래너 진단은 명시적 활성화 힌트와 Manifest 소유권 대체 경로를 구분할 수 있습니다.
예를 들어 `activation-command-hint`는 `activation.onCommands`가 일치했음을 의미하고,
`manifest-command-alias`는 플래너가 대신 `commandAliases` 소유권을 사용했음을 의미합니다.
이 이유 레이블은 호스트 진단 및 테스트용입니다. Plugin 작성자는 소유권을 가장 잘
설명하는 메타데이터를 계속 선언해야 합니다.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 runner를 제공할 때
`qaRunners`를 사용하세요. 이 메타데이터는 저렴하고 정적으로 유지하세요.
실제 CLI 등록은 여전히 `qaRunnerCliRegistrations`를 export하는 가벼운
`runtime-api.ts` 표면을 통해 Plugin 런타임이 소유합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "일회성 homeserver를 대상으로 Docker 기반 Matrix 라이브 QA 레인을 실행합니다"
    }
  ]
}
```

| 필드          | 필수 여부 | 유형     | 의미                                                                  |
| ------------- | --------- | -------- | --------------------------------------------------------------------- |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.        |
| `description` | 아니요    | `string` | 공유 호스트에 스텁 명령이 필요할 때 사용하는 대체 도움말 텍스트입니다. |

## setup 참조

setup 및 온보딩 표면이 런타임이 로드되기 전에 저렴한 Plugin 소유 메타데이터를
필요로 할 때 `setup`을 사용하세요.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

최상위 `cliBackends`는 여전히 유효하며 계속해서 CLI 추론 백엔드를 설명합니다.
`setup.cliBackends`는 메타데이터 전용이어야 하는 제어 평면/setup 흐름을 위한
setup 전용 설명자 표면입니다.

`setup.providers`와 `setup.cliBackends`가 존재하는 경우, 이들은
setup 검색을 위한 선호되는 설명자 우선 조회 표면입니다. 설명자가 후보 Plugin 범위만
좁히고 setup에 더 풍부한 setup 시점 런타임 hook이 여전히 필요하다면,
`requiresRuntime: true`로 설정하고 `setup-api`를 대체 실행 경로로 유지하세요.

setup 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로,
정규화된 `setup.providers[].id` 및 `setup.cliBackends[]` 값은 검색된 Plugin 전체에서
고유해야 합니다. 모호한 소유권은 검색 순서에서 승자를 선택하는 대신 닫힌 상태로 실패합니다.

### setup.providers 참조

| 필드          | 필수 여부 | 유형       | 의미                                                                           |
| ------------- | --------- | ---------- | ------------------------------------------------------------------------------ |
| `id`          | 예        | `string`   | setup 또는 온보딩 중 노출되는 provider ID입니다. 정규화된 ID는 전역적으로 고유해야 합니다. |
| `authMethods` | 아니요    | `string[]` | 전체 런타임을 로드하지 않고도 이 provider가 지원하는 setup/인증 방법 ID입니다.           |
| `envVars`     | 아니요    | `string[]` | 일반 setup/status 표면이 Plugin 런타임이 로드되기 전에 확인할 수 있는 env var입니다.     |

### setup 필드

| 필드               | 필수 여부 | 유형       | 의미                                                                                           |
| ------------------ | --------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | setup 및 온보딩 중 노출되는 provider setup 설명자입니다.                                       |
| `cliBackends`      | 아니요    | `string[]` | 설명자 우선 setup 조회에 사용되는 setup 시점 백엔드 ID입니다. 정규화된 ID는 전역적으로 고유해야 합니다. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 setup 표면이 소유하는 구성 마이그레이션 ID입니다.                                  |
| `requiresRuntime`  | 아니요    | `boolean`  | 설명자 조회 후에도 setup에 `setup-api` 실행이 여전히 필요한지 여부입니다.                      |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로의 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 키",
      "help": "OpenRouter 요청에 사용됩니다",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다.

| 필드          | 유형       | 의미                                |
| ------------- | ---------- | ----------------------------------- |
| `label`       | `string`   | 사용자 표시용 필드 레이블입니다.    |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.           |
| `tags`        | `string[]` | 선택적 UI 태그입니다.               |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.    |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 정보로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다. |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고 읽을 수 있는 정적 기능 소유권
메타데이터에만 `contracts`를 사용하세요.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

각 목록은 선택 사항입니다.

| 필드                             | 유형       | 의미                                                            |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 번들 Plugin이 factory를 등록할 수 있는 embedded 런타임 ID입니다. |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 외부 인증 프로필 hook을 소유하는 provider ID입니다. |
| `speechProviders`                | `string[]` | 이 Plugin이 소유하는 음성 provider ID입니다.                    |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유하는 실시간 전사 provider ID입니다.             |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유하는 실시간 음성 provider ID입니다.             |
| `memoryEmbeddingProviders`       | `string[]` | 이 Plugin이 소유하는 메모리 임베딩 provider ID입니다.           |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유하는 미디어 이해 provider ID입니다.             |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 이미지 생성 provider ID입니다.             |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 비디오 생성 provider ID입니다.             |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유하는 웹 가져오기 provider ID입니다.             |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유하는 웹 검색 provider ID입니다.                 |
| `tools`                          | `string[]` | 번들 계약 검사에서 이 Plugin이 소유하는 agent tool 이름입니다.  |

`resolveExternalAuthProfiles`를 구현하는 provider Plugin은
`contracts.externalAuthProviders`를 선언해야 합니다. 이 선언이 없는 Plugin도
더 이상 권장되지 않는 호환성 대체 경로를 통해 여전히 실행되지만, 이 대체 경로는
더 느리며 마이그레이션 기간이 끝나면 제거될 예정입니다.

번들 메모리 임베딩 provider는 노출하는 모든 adapter ID에 대해
`contracts.memoryEmbeddingProviders`를 선언해야 합니다. 여기에는 `local` 같은
내장 adapter도 포함됩니다. 독립형 CLI 경로는 전체 Gateway 런타임이
provider를 등록하기 전에 이 Manifest 계약을 사용해 소유 Plugin만 로드합니다.

## mediaUnderstandingProviderMetadata 참조

미디어 이해 provider에 기본 모델, 자동 인증 대체 우선순위 또는
런타임이 로드되기 전에 일반 core 헬퍼가 필요로 하는 네이티브 문서 지원이 있을 때
`mediaUnderstandingProviderMetadata`를 사용하세요. 키는
`contracts.mediaUnderstandingProviders`에도 선언되어 있어야 합니다.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

각 provider 항목에는 다음이 포함될 수 있습니다.

| 필드                   | 유형                                | 의미                                                                        |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 provider가 노출하는 미디어 기능입니다.                                   |
| `defaultModels`        | `Record<string, string>`            | 구성에 모델이 지정되지 않았을 때 사용하는 기능별 모델 기본값입니다.         |
| `autoPriority`         | `Record<string, number>`            | 자동 자격 증명 기반 provider 대체에서 값이 낮을수록 먼저 정렬됩니다.        |
| `nativeDocumentInputs` | `"pdf"[]`                           | provider가 지원하는 네이티브 문서 입력입니다.                               |

## channelConfigs 참조

채널 Plugin이 런타임이 로드되기 전에 경량 구성 메타데이터를 필요로 할 때
`channelConfigs`를 사용하세요.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 채널 항목에는 다음이 포함될 수 있습니다.

| 필드          | 유형                     | 의미                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`에 대한 JSON Schema입니다. 선언된 각 채널 구성 항목에 필수입니다.      |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션용 선택적 UI 레이블/placeholder/민감도 힌트입니다.                 |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 inspect 표면에 병합되는 채널 레이블입니다. |
| `description` | `string`                 | inspect 및 카탈로그 표면용 짧은 채널 설명입니다.                                      |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 더 낮은 우선순위 Plugin ID입니다.   |

## modelSupport 참조

Plugin 런타임이 로드되기 전에 OpenClaw가 `gpt-5.5` 또는 `claude-sonnet-4.6` 같은
축약형 모델 ID로부터 provider Plugin을 추론해야 할 때 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다.

- 명시적 `provider/model` 참조는 소유 `providers` Manifest 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 번들되지 않은
  Plugin이 우선합니다
- 남아 있는 모호성은 사용자가 provider를 지정하거나 구성에서 명시할 때까지 무시됩니다

필드:

| 필드            | 유형       | 의미                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 ID에 대해 `startsWith`로 일치하는 접두사입니다.                   |
| `modelPatterns` | `string[]` | 프로필 접미사를 제거한 뒤 축약형 모델 ID와 일치시키는 정규식 소스입니다.      |

레거시 최상위 기능 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요.
일반 Manifest 로드는 더 이상 이러한 최상위 필드를 기능 소유권으로 취급하지 않습니다.

## Manifest와 package.json 비교

두 파일은 서로 다른 역할을 합니다.

| 파일                   | 용도                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 검색, 구성 검증, 인증 선택 메타데이터, Plugin 코드 실행 전에 존재해야 하는 UI 힌트                                             |
| `package.json`         | npm 메타데이터, 의존성 설치, entrypoint, 설치 게이팅, setup 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록               |

어떤 메타데이터가 어디에 속하는지 확신이 서지 않으면 다음 규칙을 사용하세요.

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 하면 `openclaw.plugin.json`에 넣으세요
- 패키징, entry 파일 또는 npm 설치 동작에 관한 것이면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라
`package.json`의 `openclaw` 블록 아래에 있습니다.

중요한 예시는 다음과 같습니다.

| 필드                                                              | 의미                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 네이티브 Plugin entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                         |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지용 빌드된 JavaScript 런타임 entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                |
| `openclaw.setupEntry`                                             | 온보딩, 지연된 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중에 사용되는 가벼운 setup 전용 entrypoint입니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                   |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지용 빌드된 JavaScript setup entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                 |
| `openclaw.channel`                                                | 레이블, 문서 경로, alias, 선택 설명 같은 경량 채널 카탈로그 메타데이터입니다.                                                                                                         |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env 전용 setup이 이미 존재하는가?"에 답할 수 있는 경량 configured-state 검사기 메타데이터입니다.                                                 |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.                                                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 Plugin 및 외부 배포 Plugin을 위한 설치/업데이트 힌트입니다.                                                                                                                      |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                           |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                       |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist 무결성 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이것과 대조해 검증합니다.                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 잘못되었을 때 제한된 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중에 전체 채널 Plugin보다 먼저 setup 전용 채널 표면을 로드할 수 있게 합니다.                                                                                                      |

Manifest 메타데이터는 런타임이 로드되기 전에 온보딩에 어떤 provider/채널/setup
선택지가 나타나는지 결정합니다. `package.json#openclaw.install`은 사용자가
그 선택지 중 하나를 고르면 온보딩이 해당 Plugin을 어떻게 가져오거나 활성화할지
알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 중과 Manifest 레지스트리 로딩 중에
강제 적용됩니다. 잘못된 값은 거부되며, 더 새롭지만 유효한 값은 오래된 호스트에서
해당 Plugin을 건너뜁니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 존재합니다. 예:
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. 공식 외부 카탈로그 항목은
가져온 npm 아티팩트가 더 이상 고정된 릴리스와 일치하지 않으면 업데이트 흐름이
닫힌 상태로 실패하도록 정확한 스펙과 `expectedIntegrity`를 함께 사용해야 합니다.
대화형 온보딩은 호환성을 위해 bare 패키지 이름과 dist-tag를 포함한 신뢰된
레지스트리 npm 스펙도 계속 제공합니다. 카탈로그 진단은 정확 고정, 부동,
무결성 고정, 무결성 누락 소스를 구분할 수 있습니다. `expectedIntegrity`가 있으면
설치/업데이트 흐름이 이를 강제하고, 없으면 레지스트리 확인 결과가 무결성 고정 없이 기록됩니다.

채널 Plugin은 상태, 채널 목록, SecretRef 스캔이 전체 런타임을 로드하지 않고도
구성된 계정을 식별해야 하는 경우 `openclaw.setupEntry`를 제공해야 합니다.
setup entry는 채널 메타데이터와 setup-safe 구성, 상태, secrets adapter를
노출해야 하며, 네트워크 클라이언트, Gateway 리스너, 전송 런타임은 기본 extension
entrypoint에 유지하세요.

런타임 entrypoint 필드는 소스 entrypoint 필드의 패키지 경계 검사를 무효화하지 않습니다.
예를 들어 `openclaw.runtimeExtensions`는 범위를 벗어나는 `openclaw.extensions` 경로를
로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다.
임의의 손상된 구성을 설치 가능하게 만들지 않습니다. 현재는 누락된 번들 Plugin 경로나
같은 번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정 오래된 번들 Plugin
업그레이드 실패에서 설치 흐름이 복구하도록만 허용합니다. 관련 없는 구성 오류는
여전히 설치를 차단하고 사용자를 `openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기 모듈을 위한 패키지 메타데이터입니다.

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

setup, doctor 또는 configured-state 흐름에서 전체 채널 Plugin이 로드되기 전에
저렴한 예/아니오 인증 확인이 필요할 때 이를 사용하세요. 대상 export는
지속된 상태만 읽는 작은 함수여야 하며, 전체 채널 런타임 barrel을 경유하지 마세요.

`openclaw.channel.configuredState`도 저렴한 env 전용 configured 검사에 대해
같은 형태를 따릅니다.

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

채널이 env 또는 다른 작은 비런타임 입력만으로 configured-state에 답할 수 있을 때
이를 사용하세요. 검사가 전체 구성 확인이나 실제 채널 런타임을 필요로 한다면,
그 로직은 대신 Plugin `config.hasConfiguredState` hook에 두세요.

## 검색 우선순위(중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적 구성 선택 경로)에서 Plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면 **가장 높은 우선순위**의 Manifest만 유지되고, 더 낮은 우선순위의 중복 항목은 나란히 로드되는 대신 제거됩니다.

우선순위는 높은 순서부터 다음과 같습니다.

1. **구성 선택** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **번들** — OpenClaw와 함께 제공되는 Plugin
3. **전역 설치** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **워크스페이스** — 현재 워크스페이스 기준으로 검색된 Plugin

의미하는 바:

- 워크스페이스에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 못합니다.
- 로컬 Plugin으로 번들 Plugin을 실제로 재정의하려면 워크스페이스 검색에 의존하지 말고 `plugins.entries.<id>`로 고정하여 우선순위에서 이기게 하세요.
- 제거된 중복 항목은 로그에 기록되므로 Doctor와 시작 진단이 폐기된 복사본을 가리킬 수 있습니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 포함해야 합니다**, 구성을 전혀 받지 않더라도 마찬가지입니다.
- 빈 schema도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- schema는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 해당 채널 ID가
  Plugin Manifest에 선언되지 않은 한 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** Plugin ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- Plugin이 설치되어 있지만 Manifest 또는 schema가 손상되었거나 누락된 경우,
  검증이 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**되어 있으면 구성은 유지되고
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` schema는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- Manifest는 로컬 파일시스템 로드를 포함한 **네이티브 OpenClaw Plugin에 필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, Manifest는 검색 + 검증 전용입니다.
- 네이티브 Manifest는 JSON5로 파싱되므로, 최종 값이 여전히 객체이기만 하면 주석, 후행 쉼표, 따옴표 없는 키를 허용합니다.
- Manifest 로더는 문서화된 Manifest 필드만 읽습니다. 사용자 지정 최상위 키는 피하세요.
- `channels`, `providers`, `cliBackends`, `skills`는 Plugin에 필요 없으면 모두 생략할 수 있습니다.
- `providerDiscoveryEntry`는 반드시 가볍게 유지되어야 하며 광범위한 런타임 코드를 import하면 안 됩니다. 요청 시점 실행이 아니라 정적 provider 카탈로그 메타데이터나 좁은 검색 설명자에 사용하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다. `kind: "memory"`는 `plugins.slots.memory`를 통해, `kind: "context-engine"`는 `plugins.slots.contextEngine`을 통해 선택됩니다(기본값 `legacy`).
- env var 메타데이터(`providerAuthEnvVars`, `channelEnvVars`)는 선언적 정보일 뿐입니다. 상태, 감사, Cron 전달 검증 및 기타 읽기 전용 표면은 여전히 env var를 구성된 것으로 취급하기 전에 Plugin 신뢰와 유효 활성화 정책을 적용합니다.
- provider 코드가 필요한 런타임 wizard 메타데이터는 [provider 런타임 hook](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
- Plugin이 네이티브 모듈에 의존한다면 빌드 단계와 모든 패키지 관리자 허용 목록 요구 사항(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

<CardGroup cols={3}>
  <Card title="Plugin 빌드" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin 아키텍처" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처 및 기능 모델.
  </Card>
  <Card title="SDK 개요" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 import.
  </Card>
</CardGroup>
