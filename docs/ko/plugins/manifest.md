---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin config 스키마를 배포하거나 Plugin 검증 오류를 디버깅해야 합니다
summary: Plugin manifest + JSON 스키마 요구 사항(엄격한 config 검증)
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-25T06:06:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

이 페이지는 **기본 OpenClaw Plugin manifest** 전용입니다.

호환 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참조하세요.

호환 번들 형식은 다른 manifest 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 manifest가 없는 기본 Claude component
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는
`openclaw.plugin.json` 스키마에 대해 검증하지는 않습니다.

호환 번들의 경우, 현재 OpenClaw는 번들 메타데이터와 선언된
skill 루트, Claude 명령어 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 그리고 레이아웃이 OpenClaw 런타임 기대와 일치할 때
지원되는 hook pack을 읽습니다.

모든 기본 OpenClaw Plugin은 **반드시** `openclaw.plugin.json` 파일을
**Plugin 루트**에 포함해야 합니다. OpenClaw는 이 manifest를 사용해
**Plugin 코드를 실행하지 않고도** 구성을 검증합니다. 누락되거나 잘못된 manifest는
Plugin 오류로 취급되며 config 검증을 차단합니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
기본 capability 모델 및 현재 외부 호환성 지침은
[Capability model](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에**
읽는 메타데이터입니다. 아래의 모든 내용은 Plugin 런타임을 부팅하지 않고도
검사할 수 있을 만큼 가벼워야 합니다.

**사용 용도:**

- Plugin ID, config 검증, config UI 힌트
- 인증, 온보딩, 설정 메타데이터(별칭, 자동 활성화, provider env vars, auth 선택지)
- 제어 평면 표면을 위한 활성화 힌트
- shorthand 모델 계열 소유권
- 정적 capability 소유권 스냅샷(`contracts`)
- 공유 `openclaw qa` 호스트가 검사할 수 있는 QA runner 메타데이터
- 카탈로그 및 검증 표면에 병합되는 채널별 config 메타데이터

**사용하지 말아야 할 용도:** 런타임 동작 등록, 코드 진입점 선언,
또는 npm 설치 메타데이터. 그런 내용은 Plugin 코드와 `package.json`에 속합니다.

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

## 풍부한 예시

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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

| 필드                                | 필수 여부 | 타입                             | 의미                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예      | `string`                         | 정식 Plugin ID입니다. 이 ID는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                                               |
| `configSchema`                       | 예      | `object`                         | 이 Plugin config용 인라인 JSON 스키마입니다.                                                                                                                                                                                      |
| `enabledByDefault`                   | 아니요       | `true`                           | 번들 Plugin이 기본적으로 활성화됨을 나타냅니다. 기본적으로 비활성화 상태로 두려면 생략하거나 `true`가 아닌 값을 설정하세요.                                                                                                      |
| `legacyPluginIds`                    | 아니요       | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | 아니요       | `string[]`                       | 인증, config 또는 모델 참조에서 언급될 때 이 Plugin을 자동 활성화해야 하는 provider ID입니다.                                                                                                                                   |
| `kind`                               | 아니요       | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용하는 배타적 Plugin kind를 선언합니다.                                                                                                                                                                      |
| `channels`                           | 아니요       | `string[]`                       | 이 Plugin이 소유하는 채널 ID입니다. 탐색 및 config 검증에 사용됩니다.                                                                                                                                                       |
| `providers`                          | 아니요       | `string[]`                       | 이 Plugin이 소유하는 provider ID입니다.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | 아니요       | `string`                         | Plugin 루트 기준 상대 경량 provider-discovery 모듈 경로입니다. 전체 Plugin 런타임을 활성화하지 않고도 manifest 범위 provider 카탈로그 메타데이터를 로드할 수 있습니다.                                             |
| `modelSupport`                       | 아니요       | `object`                         | 런타임 이전에 Plugin을 자동 로드하는 데 사용되는 manifest 소유 shorthand 모델 계열 메타데이터입니다.                                                                                                                                       |
| `modelCatalog`                       | 아니요       | `object`                         | 이 Plugin이 소유한 provider에 대한 선언적 모델 카탈로그 메타데이터입니다. 이는 read-only 목록, 온보딩, 모델 선택기, 별칭, 억제를 Plugin 런타임 로딩 없이 지원하기 위한 제어 평면 계약입니다.       |
| `providerEndpoints`                  | 아니요       | `object[]`                       | core가 provider 런타임 로딩 전에 분류해야 하는 provider 라우트용 manifest 소유 endpoint host/baseUrl 메타데이터입니다.                                                                                                          |
| `cliBackends`                        | 아니요       | `string[]`                       | 이 Plugin이 소유하는 CLI 추론 backend ID입니다. 명시적 config 참조로부터 시작 시 자동 활성화에 사용됩니다.                                                                                                                       |
| `syntheticAuthRefs`                  | 아니요       | `string[]`                       | 런타임 로딩 전 cold 모델 탐색 중 Plugin 소유 synthetic auth Hook을 probe해야 하는 provider 또는 CLI backend 참조입니다.                                                                                            |
| `nonSecretAuthMarkers`               | 아니요       | `string[]`                       | 비시크릿 로컬, OAuth 또는 주변 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API 키 값입니다.                                                                                                              |
| `commandAliases`                     | 아니요       | `object[]`                       | 런타임 로딩 전에 Plugin 인식 config 및 CLI 진단을 생성해야 하는 이 Plugin 소유 명령어 이름입니다.                                                                                                              |
| `providerAuthEnvVars`                | 아니요       | `Record<string, string[]>`       | provider auth/status 조회를 위한 deprecated 호환 env 메타데이터입니다. 새 Plugin에는 `setup.providers[].envVars`를 권장합니다. OpenClaw는 폐지 기간 동안 여전히 이를 읽습니다.                                               |
| `providerAuthAliases`                | 아니요       | `Record<string, string>`         | 인증 조회를 위해 다른 provider ID를 재사용해야 하는 provider ID입니다. 예를 들어 기본 provider API 키 및 auth profile을 공유하는 코딩 provider가 이에 해당합니다.                                                                        |
| `channelEnvVars`                     | 아니요       | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 채널 env 메타데이터입니다. 일반 시작/config helper가 알아야 하는 env 기반 채널 설정 또는 auth 표면에 사용하세요.                                          |
| `providerAuthChoices`                | 아니요       | `object[]`                       | 온보딩 선택기, 선호 provider 확인, 간단한 CLI 플래그 연결을 위한 경량 auth-choice 메타데이터입니다.                                                                                                                     |
| `activation`                         | 아니요       | `object`                         | provider, 명령어, 채널, 라우트, capability 트리거 로딩을 위한 경량 활성화 플래너 메타데이터입니다. 메타데이터 전용이며, 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                              |
| `setup`                              | 아니요       | `object`                         | 탐색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 경량 설정/온보딩 설명자입니다.                                                                                                                  |
| `qaRunners`                          | 아니요       | `object[]`                       | 공유 `openclaw qa` 호스트가 Plugin 런타임 로딩 전에 사용하는 경량 QA runner 설명자입니다.                                                                                                                                    |
| `contracts`                          | 아니요       | `object`                         | 외부 auth Hook, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, 도구 소유권을 위한 정적 번들 capability 스냅샷입니다. |
| `mediaUnderstandingProviderMetadata` | 아니요       | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider ID용 경량 media-understanding 기본값입니다.                                                                                                                          |
| `channelConfigs`                     | 아니요       | `Record<string, object>`         | 런타임 로딩 전에 탐색 및 검증 표면에 병합되는 manifest 소유 채널 config 메타데이터입니다.                                                                                                                        |
| `skills`                             | 아니요       | `string[]`                       | Plugin 루트 기준 상대 경로인 로드할 skill 디렉터리입니다.                                                                                                                                                                           |
| `name`                               | 아니요       | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                                       |
| `description`                        | 아니요       | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                                           |
| `version`                            | 아니요       | `string`                         | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                                                     |
| `uiHints`                            | 아니요       | `Record<string, object>`         | config 필드용 UI 레이블, placeholder, 민감도 힌트입니다.                                                                                                                                                                 |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 auth 선택지를 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.
Provider 설정 흐름은 이러한 manifest 선택지를 우선 사용하고, 이후 호환성을 위해 런타임
마법사 메타데이터와 install-catalog 선택지로 대체됩니다.

| 필드                 | 필수 여부 | 타입                                            | 의미                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 예      | `string`                                        | 이 선택지가 속한 provider ID입니다.                                                                      |
| `method`              | 예      | `string`                                        | 전달할 인증 메서드 ID입니다.                                                                           |
| `choiceId`            | 예      | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 auth-choice ID입니다.                                                  |
| `choiceLabel`         | 아니요       | `string`                                        | 사용자에게 표시되는 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대체값으로 사용합니다.                                        |
| `choiceHint`          | 아니요       | `string`                                        | 선택기에 표시되는 짧은 도우미 텍스트입니다.                                                                        |
| `assistantPriority`   | 아니요       | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                       |
| `assistantVisibility` | 아니요       | `"visible"` \| `"manual-only"`                  | assistant 선택기에서는 숨기지만 수동 CLI 선택은 계속 허용합니다.                        |
| `deprecatedChoiceIds` | 아니요       | `string[]`                                      | 사용자를 이 대체 선택지로 리디렉션해야 하는 레거시 choice ID입니다.                                 |
| `groupId`             | 아니요       | `string`                                        | 관련 선택지를 묶기 위한 선택적 그룹 ID입니다.                                                          |
| `groupLabel`          | 아니요       | `string`                                        | 해당 그룹의 사용자 표시 레이블입니다.                                                                        |
| `groupHint`           | 아니요       | `string`                                        | 그룹에 대한 짧은 도우미 텍스트입니다.                                                                         |
| `optionKey`           | 아니요       | `string`                                        | 단일 플래그 인증 흐름용 내부 옵션 키입니다.                                                      |
| `cliFlag`             | 아니요       | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                           |
| `cliOption`           | 아니요       | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                             |
| `cliDescription`      | 아니요       | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                            |
| `onboardingScopes`    | 아니요       | `Array<"text-inference" \| "image-generation">` | 이 선택지가 나타나야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다. |

## commandAliases 참조

사용자가 `plugins.allow`에 실수로 넣거나 루트 CLI 명령어로 실행하려고 할 수 있는
런타임 명령어 이름을 Plugin이 소유할 때는 `commandAliases`를 사용하세요. OpenClaw는
Plugin 런타임 코드를 import하지 않고도 진단을 위해 이 메타데이터를 사용합니다.

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

| 필드        | 필수 여부 | 타입              | 의미                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 예      | `string`          | 이 Plugin에 속한 명령어 이름입니다.                               |
| `kind`       | 아니요       | `"runtime-slash"` | 루트 CLI 명령어가 아니라 채팅 슬래시 명령어로 이 별칭을 표시합니다. |
| `cliCommand` | 아니요       | `string`          | 존재할 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령어입니다.  |

## activation 참조

Plugin이 어떤 제어 평면 이벤트가
활성화/로드 계획에 포함되어야 하는지를 저렴하게 선언할 수 있을 때는 `activation`을 사용하세요.

이 블록은 플래너 메타데이터이지 수명 주기 API가 아닙니다. 런타임 동작을 등록하지 않으며,
`register(...)`를 대체하지도 않고, Plugin 코드가
이미 실행되었음을 보장하지도 않습니다. 활성화 플래너는 기존 manifest 소유권
메타데이터인 `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, hooks로 대체되기 전에 후보 Plugin을 좁히기 위해 이 필드를 사용합니다.

이미 소유권을 설명하는 가장 좁은 메타데이터를 우선 사용하세요.
그 관계를 표현할 수 있다면 `providers`, `channels`, `commandAliases`, setup 설명자, 또는 `contracts`를 사용하세요. `activation`은 그런 소유권 필드로 표현할 수 없는 추가 플래너
힌트에만 사용하세요.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry`, 기타 런타임/Plugin 진입점을 대체하지도 않습니다.
현재 소비자는 이를 더 넓은 Plugin 로딩 이전의 좁히기 힌트로 사용하므로,
활성화 메타데이터가 없더라도 보통은 성능 비용만 발생할 뿐이며,
레거시 manifest 소유권 대체 경로가 아직 존재하는 동안에는 정합성을
변경해서는 안 됩니다.

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

| 필드            | 필수 여부 | 타입                                                 | 의미                                                                                           |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | 아니요       | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 provider ID입니다.                                  |
| `onCommands`     | 아니요       | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 명령어 ID입니다.                                   |
| `onChannels`     | 아니요       | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 채널 ID입니다.                                   |
| `onRoutes`       | 아니요       | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 라우트 종류입니다.                                   |
| `onCapabilities` | 아니요       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에서 사용하는 광범위한 capability 힌트입니다. 가능하면 더 좁은 필드를 우선 사용하세요. |

현재 실제 소비자:

- 명령어 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체됩니다
- 채널 트리거 setup/channel 계획은 명시적인 채널 activation 메타데이터가 없을 때
  레거시 `channels[]` 소유권으로 대체됩니다
- provider 트리거 setup/runtime 계획은 명시적인 provider
  activation 메타데이터가 없을 때 레거시 `providers[]` 및 최상위 `cliBackends[]` 소유권으로 대체됩니다

플래너 진단은 명시적 activation 힌트와 manifest
소유권 대체 경로를 구분할 수 있습니다. 예를 들어 `activation-command-hint`는
`activation.onCommands`가 일치했음을 의미하고, `manifest-command-alias`는
플래너가 대신 `commandAliases` 소유권을 사용했음을 의미합니다. 이러한 reason 레이블은
호스트 진단 및 테스트용입니다. Plugin 작성자는 계속해서 소유권을 가장 잘 설명하는
메타데이터를 선언해야 합니다.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 runner를 제공할 때는
`qaRunners`를 사용하세요. 이 메타데이터는 저렴하고 정적으로 유지하고,
실제 CLI 등록은 여전히
`qaRunnerCliRegistrations`를 export하는 경량 `runtime-api.ts` 표면이 소유하게 하세요.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 필드         | 필수 여부 | 타입     | 의미                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 예      | `string` | `openclaw qa` 아래에 마운트되는 하위 명령어입니다. 예: `matrix`.    |
| `description` | 아니요       | `string` | 공유 호스트가 스텁 명령어를 필요로 할 때 사용하는 대체 도움말 텍스트입니다. |

## setup 참조

setup 및 온보딩 표면이 런타임 로드 전에
Plugin 소유 메타데이터를 저렴하게 필요로 할 때는 `setup`을 사용하세요.

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

최상위 `cliBackends`는 여전히 유효하며 계속 CLI 추론
backend를 설명합니다. `setup.cliBackends`는
메타데이터 전용으로 유지되어야 하는 제어 평면/setup 흐름용 설정 전용 설명자 표면입니다.

`setup.providers`와 `setup.cliBackends`가 존재하면 설정 탐색 시
우선적인 descriptor-first 조회 표면이 됩니다. 설명자가 후보 Plugin만 좁힐 뿐
setup이 여전히 더 풍부한 setup 시점 런타임 Hook을 필요로 한다면
`requiresRuntime: true`를 설정하고 `setup-api`를
대체 실행 경로로 유지하세요.

OpenClaw는 일반 provider auth 및
env-var 조회에도 `setup.providers[].envVars`를 포함합니다. `providerAuthEnvVars`는
폐지 기간 동안 호환성 어댑터를 통해 여전히 지원되지만, 이를 계속 사용하는 비번들 Plugin은
manifest 진단을 받습니다. 새 Plugin은 setup/status env 메타데이터를
`setup.providers[].envVars`에 두어야 합니다.

또한 OpenClaw는 setup entry가 없거나,
`setup.requiresRuntime: false`가
setup 런타임이 불필요하다고 선언할 때 `setup.providers[].authMethods`에서 단순 setup 선택지를 도출할 수 있습니다.
사용자 지정 레이블, CLI 플래그, 온보딩 범위, assistant 메타데이터에는
명시적 `providerAuthChoices` 항목이 여전히 우선됩니다.

이 설명자만으로 setup 표면에 충분할 때만 `requiresRuntime: false`를 설정하세요.
OpenClaw는 명시적 `false`를 descriptor-only 계약으로 취급하며
setup 조회를 위해 `setup-api` 또는 `openclaw.setupEntry`를 실행하지 않습니다. descriptor-only Plugin이 여전히 이러한 setup 런타임 항목 중 하나를 제공하면,
OpenClaw는 추가 진단을 보고하고 계속 이를 무시합니다. `requiresRuntime`이
생략되면 레거시 대체 동작이 유지되므로 플래그 없이 설명자를 추가한 기존 Plugin도 깨지지 않습니다.

setup 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로,
정규화된 `setup.providers[].id` 및 `setup.cliBackends[]` 값은
발견된 Plugin 전체에서 고유해야 합니다. 모호한 소유권은 발견 순서에서
승자를 고르는 대신 안전하게 실패합니다.

setup 런타임이 실제로 실행될 때, setup registry 진단은
`setup-api`가 manifest 설명자에 선언되지 않은 provider 또는 CLI backend를 등록하거나,
설명자에 대응하는 런타임 등록이 없을 경우 descriptor 드리프트를 보고합니다.
이러한 진단은 추가적이며 레거시 Plugin을 거부하지는 않습니다.

### setup.providers 참조

| 필드         | 필수 여부 | 타입       | 의미                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | 예      | `string`   | setup 또는 온보딩 중 노출되는 provider ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요       | `string[]` | 전체 런타임을 로드하지 않고도 이 provider가 지원하는 setup/auth 메서드 ID입니다.           |
| `envVars`     | 아니요       | `string[]` | Plugin 런타임이 로드되기 전에 일반 setup/status 표면이 확인할 수 있는 env vars입니다.   |

### setup 필드

| 필드              | 필수 여부 | 타입       | 의미                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요       | `object[]` | setup 및 온보딩 중 노출되는 provider setup 설명자입니다.                                     |
| `cliBackends`      | 아니요       | `string[]` | descriptor-first setup 조회에 사용하는 setup 시점 backend ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요       | `string[]` | 이 Plugin의 setup 표면이 소유하는 config 마이그레이션 ID입니다.                                          |
| `requiresRuntime`  | 아니요       | `boolean`  | descriptor 조회 후에도 setup에 `setup-api` 실행이 계속 필요한지 여부입니다.                            |

## uiHints 참조

`uiHints`는 config 필드 이름에서 작은 렌더링 힌트로의 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다:

| 필드         | 타입       | 의미                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 사용자에게 표시되는 필드 레이블입니다.                |
| `help`        | `string`   | 짧은 도우미 텍스트입니다.                      |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                       |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.            |
| `sensitive`   | `boolean`  | 필드를 시크릿 또는 민감 정보로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다.       |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고도
읽을 수 있는 정적 capability 소유권 메타데이터에만 `contracts`를 사용하세요.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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

각 목록은 선택 사항입니다:

| 필드                            | 타입       | 의미                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory ID이며, 현재는 `codex-app-server`입니다. |
| `agentToolResultMiddleware`      | `string[]` | 번들 Plugin이 tool-result middleware를 등록할 수 있는 런타임 ID입니다. |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 소유하는 외부 auth profile Hook의 provider ID입니다.       |
| `speechProviders`                | `string[]` | 이 Plugin이 소유하는 speech provider ID입니다.                                 |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유하는 realtime-transcription provider ID입니다.                 |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유하는 realtime-voice provider ID입니다.                         |
| `memoryEmbeddingProviders`       | `string[]` | 이 Plugin이 소유하는 memory embedding provider ID입니다.                       |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유하는 media-understanding provider ID입니다.                    |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 image-generation provider ID입니다.                       |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 video-generation provider ID입니다.                       |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유하는 web-fetch provider ID입니다.                              |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유하는 web-search provider ID입니다.                             |
| `tools`                          | `string[]` | 번들 계약 검사에서 이 Plugin이 소유하는 에이전트 도구 이름입니다.        |

`contracts.embeddedExtensionFactories`는 번들된 Codex
app-server 전용 extension factory용으로 유지됩니다. 번들 tool-result 변환은
대신 `contracts.agentToolResultMiddleware`를 선언하고
`api.registerAgentToolResultMiddleware(...)`로 등록해야 합니다. 외부 Plugin은
모델이 보기 전에 고신뢰 도구 출력을 다시 쓸 수 있으므로 tool-result middleware를
등록할 수 없습니다.

`resolveExternalAuthProfiles`를 구현하는 provider Plugin은
`contracts.externalAuthProviders`를 선언해야 합니다. 선언이 없는 Plugin도
deprecated 호환성 대체 경로를 통해 여전히 실행되지만, 그 대체 경로는 더 느리며
마이그레이션 기간이 끝나면 제거될 예정입니다.

번들 memory embedding provider는 노출하는 모든 adapter ID에 대해
`contracts.memoryEmbeddingProviders`를 선언해야 합니다. 여기에는
`local` 같은 내장 adapter도 포함됩니다. 독립형 CLI 경로는 전체 Gateway 런타임이
provider를 등록하기 전에 이 manifest 계약을 사용해
소유 Plugin만 로드합니다.

## mediaUnderstandingProviderMetadata 참조

media-understanding provider가
기본 모델, 자동 인증 대체 우선순위, 또는 런타임 로딩 전에 일반 core helper가 알아야 하는 기본 문서 지원을 가질 때는
`mediaUnderstandingProviderMetadata`를 사용하세요. 키는 반드시
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

각 provider 항목에는 다음이 포함될 수 있습니다:

| 필드                  | 타입                                | 의미                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 provider가 노출하는 미디어 capability입니다.                                 |
| `defaultModels`        | `Record<string, string>`            | config가 모델을 지정하지 않을 때 사용하는 capability별 기본 모델입니다.      |
| `autoPriority`         | `Record<string, number>`            | 자동 자격 증명 기반 provider 대체 시 값이 낮을수록 먼저 정렬됩니다. |
| `nativeDocumentInputs` | `"pdf"[]`                           | 이 provider가 지원하는 기본 문서 입력입니다.                            |

## channelConfigs 참조

채널 Plugin이 런타임 로딩 전에
저렴한 config 메타데이터를 필요로 할 때는 `channelConfigs`를 사용하세요. 읽기 전용 채널 setup/status 탐색은
setup entry가 없거나,
`setup.requiresRuntime: false`가 setup 런타임이 불필요하다고 선언할 때,
구성된 외부 채널에 대해 이 메타데이터를 직접 사용할 수 있습니다.

채널 Plugin의 경우, `configSchema`와 `channelConfigs`는 서로 다른
경로를 설명합니다:

- `configSchema`는 `plugins.entries.<plugin-id>.config`를 검증합니다
- `channelConfigs.<channel-id>.schema`는 `channels.<channel-id>`를 검증합니다

`channels[]`를 선언하는 비번들 Plugin은
일치하는 `channelConfigs` 항목도 선언해야 합니다. 그렇지 않으면 OpenClaw는
여전히 Plugin을 로드할 수는 있지만, cold-path config 스키마, setup, Control UI 표면은
Plugin 런타임이 실행되기 전까지 채널 소유 옵션 형태를 알 수 없습니다.

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

각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드         | 타입                     | 의미                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON 스키마입니다. 선언된 각 채널 config 항목에 필수입니다.         |
| `uiHints`     | `Record<string, object>` | 해당 채널 config 섹션용 선택적 UI 레이블/placeholder/민감도 힌트입니다.          |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 표면에 병합되는 채널 레이블입니다. |
| `description` | `string`                 | 검사 및 카탈로그 표면에 사용되는 짧은 채널 설명입니다.                               |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 Plugin ID입니다.    |

## modelSupport 참조

런타임 로딩 전에 OpenClaw가
`gpt-5.5` 또는 `claude-sonnet-4.6` 같은 shorthand 모델 ID에서
provider Plugin을 추론해야 할 때는 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적 `provider/model` 참조는 소유 `providers` manifest 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 비번들 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 비번들
  Plugin이 우선합니다
- 남은 모호성은 사용자가 또는 config가 provider를 지정할 때까지 무시됩니다

필드:

| 필드           | 타입       | 의미                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand 모델 ID에 대해 `startsWith`로 일치시키는 접두사입니다.                 |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 shorthand 모델 ID에 대해 일치시키는 정규식 소스입니다. |

## modelCatalog 참조

OpenClaw가 Plugin 런타임을
로딩하기 전에 provider 모델 메타데이터를 알아야 할 때는 `modelCatalog`를 사용하세요. 이는 고정 카탈로그
행, provider 별칭, 억제 규칙, 탐색 모드의 manifest 소유 소스입니다. 런타임 새로 고침은
여전히 provider 런타임 코드에 속하지만, manifest는 core에 런타임이
필요한 시점을 알려줍니다.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

최상위 필드:

| 필드          | 타입                                                     | 의미                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 이 Plugin이 소유하는 provider ID의 카탈로그 행입니다. 키는 최상위 `providers`에도 나타나야 합니다.       |
| `aliases`      | `Record<string, object>`                                 | 카탈로그 또는 억제 계획을 위해 소유된 provider로 해석되어야 하는 provider 별칭입니다.              |
| `suppressions` | `object[]`                                               | provider별 사유로 이 Plugin이 억제하는 다른 소스의 모델 행입니다.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | provider 카탈로그를 manifest 메타데이터에서 읽을 수 있는지, 캐시로 새로 고칠 수 있는지, 또는 런타임이 필요한지를 나타냅니다. |

Provider 필드:

| 필드     | 타입                     | 의미                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | 이 provider 카탈로그의 모델에 대한 선택적 기본 base URL입니다.    |
| `api`     | `ModelApi`               | 이 provider 카탈로그의 모델에 대한 선택적 기본 API 어댑터입니다. |
| `headers` | `Record<string, string>` | 이 provider 카탈로그에 적용되는 선택적 정적 헤더입니다.      |
| `models`  | `object[]`               | 필수 모델 행입니다. `id`가 없는 행은 무시됩니다.            |

모델 필드:

| 필드           | 타입                                                           | 의미                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` 접두사 없는 provider 로컬 모델 ID입니다.                    |
| `name`          | `string`                                                       | 선택적 표시 이름입니다.                                                      |
| `api`           | `ModelApi`                                                     | 선택적 모델별 API 재정의입니다.                                            |
| `baseUrl`       | `string`                                                       | 선택적 모델별 base URL 재정의입니다.                                       |
| `headers`       | `Record<string, string>`                                       | 선택적 모델별 정적 헤더입니다.                                          |
| `input`         | `Array<"text" \| "image" \| "document">`                       | 모델이 허용하는 modality입니다.                                               |
| `reasoning`     | `boolean`                                                      | 모델이 reasoning 동작을 노출하는지 여부입니다.                               |
| `contextWindow` | `number`                                                       | 기본 provider 컨텍스트 창입니다.                                             |
| `contextTokens` | `number`                                                       | `contextWindow`와 다를 때 사용하는 선택적 유효 런타임 컨텍스트 상한입니다. |
| `maxTokens`     | `number`                                                       | 알려진 경우 최대 출력 토큰 수입니다.                                           |
| `cost`          | `object`                                                       | 선택적 백만 토큰당 USD 가격이며, 선택적 `tieredPricing`을 포함할 수 있습니다. |
| `compat`        | `object`                                                       | OpenClaw 모델 config 호환성과 일치하는 선택적 호환성 플래그입니다.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 목록 상태입니다. 행이 완전히 나타나면 안 될 때만 억제하세요.          |
| `statusReason`  | `string`                                                       | 사용 불가 상태와 함께 표시되는 선택적 사유입니다.                            |
| `replaces`      | `string[]`                                                     | 이 모델이 대체하는 이전 provider 로컬 모델 ID입니다.                       |
| `replacedBy`    | `string`                                                       | deprecated 행의 대체 provider 로컬 모델 ID입니다.                    |
| `tags`          | `string[]`                                                     | 선택기와 필터에 사용되는 안정적인 태그입니다.                                    |

`modelCatalog`에 런타임 전용 데이터를 넣지 마세요. provider가 완전한 모델
집합을 알기 위해 계정 상태, API 요청 또는 로컬 프로세스 탐색이 필요하다면,
해당 provider를 `discovery`에서 `refreshable` 또는 `runtime`으로 선언하세요.

레거시 최상위 capability 키는 deprecated입니다. `openclaw doctor --fix`를 사용하여
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요. 일반
manifest 로딩은 더 이상 이러한 최상위 필드를 capability
소유권으로 취급하지 않습니다.

## Manifest와 package.json의 차이

두 파일은 서로 다른 역할을 수행합니다:

| 파일                   | 용도                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 존재해야 하는 탐색, config 검증, auth-choice 메타데이터, UI 힌트                         |
| `package.json`         | npm 메타데이터, 의존성 설치, 진입점, 설치 게이팅, setup 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록 |

어떤 메타데이터를 어디에 둘지 확신이 없다면 이 규칙을 사용하세요:

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, 진입 파일, npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 탐색에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json` 대신
`package.json`의 `openclaw` 블록 아래에 위치합니다.

중요한 예시:

| 필드                                                             | 의미                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 기본 Plugin 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지용 빌드된 JavaScript 런타임 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                 |
| `openclaw.setupEntry`                                             | 온보딩, 지연 채널 시작, 읽기 전용 채널 상태/SecretRef 탐색 중 사용하는 경량 setup 전용 진입점입니다. Plugin 패키지 디렉터리 내부에 있어야 합니다. |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지용 빌드된 JavaScript setup 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                |
| `openclaw.channel`                                                | 레이블, 문서 경로, 별칭, 선택 문구 같은 경량 채널 카탈로그 메타데이터입니다.                                                                                                 |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env 전용 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state checker 메타데이터입니다.                                         |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 persisted-auth checker 메타데이터입니다.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 게시 Plugin용 설치/업데이트 힌트입니다.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist 무결성 문자열이며, 설치 및 업데이트 흐름은 가져온 아티팩트를 이에 대해 검증합니다.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | config가 잘못된 경우 제한적인 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 Plugin보다 먼저 setup 전용 채널 표면이 로드되도록 합니다.                                                                                                 |

Manifest 메타데이터는 런타임 로딩 전에 어떤 provider/channel/setup 선택지가
온보딩에 나타나는지를 결정합니다. `package.json#openclaw.install`은
사용자가 تلك 선택지 중 하나를 고를 때 온보딩이 해당 Plugin을 어떻게 가져오거나 활성화할지 알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 및 manifest
registry 로딩 중에 강제 적용됩니다. 잘못된 값은 거부되며, 더 새롭지만 유효한 값은
오래된 호스트에서 해당 Plugin을 건너뜁니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 존재합니다. 예:
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. 공식 외부 카탈로그
항목은 업데이트 흐름이 가져온 npm 아티팩트가 더 이상 고정된 릴리스와 일치하지 않을 때 안전하게 실패하도록
정확한 spec을 `expectedIntegrity`와 함께 사용해야 합니다.
대화형 온보딩은 호환성을 위해
패키지 이름만 있는 형식과 dist-tag를 포함한 신뢰된 registry npm spec도 계속 제공합니다.
카탈로그 진단은 정확한 소스, 부동 버전 소스, integrity 고정 소스, integrity 누락 소스, 패키지 이름 불일치 소스,
잘못된 default-choice 소스를 구분할 수 있습니다. 또한
`expectedIntegrity`가 존재하지만 이를 고정할 유효한 npm 소스가 없을 때 경고합니다.
`expectedIntegrity`가 존재하면
설치/업데이트 흐름이 이를 강제 적용합니다. 생략되면 registry 해석은
integrity 고정 없이 기록됩니다.

채널 Plugin은 상태, 채널 목록,
또는 SecretRef 스캔이 전체 런타임을 로드하지 않고 구성된 계정을 식별해야 할 때
`openclaw.setupEntry`를 제공해야 합니다. setup entry는 채널 메타데이터와 setup에 안전한 config,
status, secrets 어댑터를 노출해야 하며, 네트워크 클라이언트, Gateway 리스너, 전송 런타임은
메인 extension 진입점에 유지하세요.

런타임 진입점 필드는 소스 진입점 필드에 대한 패키지 경계 검사를
재정의하지 않습니다. 예를 들어 `openclaw.runtimeExtensions`는
경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다. 임의의 깨진 config를 설치 가능하게 만들지는 않습니다. 현재는
누락된 번들 Plugin 경로나
동일한 번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정한 오래된 번들 Plugin 업그레이드 실패에서만
설치 흐름이 복구되도록 허용합니다. 관련 없는 config 오류는 여전히 설치를 차단하고
운영자를 `openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 checker
모듈용 패키지 메타데이터입니다:

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

setup, doctor, 또는 configured-state 흐름이 전체 채널 Plugin 로드 전에
저렴한 yes/no 인증 probe가 필요할 때 사용하세요. 대상 export는
영속 상태만 읽는 작은 함수여야 하며, 전체 채널 런타임 barrel을 통해
연결하지 마세요.

`openclaw.channel.configuredState`는 저렴한 env 전용
configured 검사에 대해 동일한 형태를 따릅니다:

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

채널이 env 또는 다른 작은
비런타임 입력만으로 configured-state에 답할 수 있을 때 사용하세요. 검사가 전체 config 확인 또는 실제
채널 런타임을 필요로 한다면, 그 로직은 대신 Plugin `config.hasConfiguredState`
Hook에 두세요.

## 탐색 우선순위(중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적으로 config에서 선택한 경로)에서 Plugin을 탐색합니다. 두 탐색 결과가 같은 `id`를 공유하면 **가장 높은 우선순위**의 manifest만 유지되고, 더 낮은 우선순위의 중복 항목은 함께 로드되지 않고 버려집니다.

우선순위(높음 → 낮음):

1. **Config-selected** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **Bundled** — OpenClaw와 함께 제공되는 Plugin
3. **Global install** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **Workspace** — 현재 워크스페이스를 기준으로 탐색된 Plugin

의미:

- 워크스페이스에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 못합니다.
- 번들 Plugin을 로컬 버전으로 실제 재정의하려면 워크스페이스 탐색에 의존하지 말고 `plugins.entries.<id>`를 통해 고정하여 우선순위로 이기게 해야 합니다.
- 중복으로 버려진 항목은 로그에 기록되므로 Doctor와 시작 진단이 폐기된 복사본을 가리킬 수 있습니다.

## JSON 스키마 요구 사항

- **모든 Plugin은 JSON 스키마를 반드시 포함해야 하며**, config를 받지 않는 경우에도 예외가 없습니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 config 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 플러그인 manifest에 채널 ID가 선언되어 있지 않으면, 알 수 없는 `channels.*` 키는 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 반드시 **탐색 가능한** Plugin ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- Plugin이 설치되어 있지만 manifest나 스키마가 깨졌거나 누락된 경우,
  검증은 실패하고 Doctor가 해당 Plugin 오류를 보고합니다.
- Plugin config가 존재하지만 Plugin이 **비활성화**된 경우, config는 유지되고
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [Configuration reference](/ko/gateway/configuration)를 참조하세요.

## 참고

- manifest는 로컬 파일시스템 로드를 포함해 **기본 OpenClaw Plugin에 필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, manifest는 탐색 + 검증 전용입니다.
- 기본 manifest는 JSON5로 파싱되므로 최종 값이 여전히 객체인 한 주석, trailing comma, 따옴표 없는 키를 사용할 수 있습니다.
- manifest 로더는 문서화된 manifest 필드만 읽습니다. 사용자 지정 최상위 키는 피하세요.
- Plugin에 필요하지 않다면 `channels`, `providers`, `cliBackends`, `skills`는 모두 생략할 수 있습니다.
- `providerDiscoveryEntry`는 가볍게 유지되어야 하며 광범위한 런타임 코드를 import해서는 안 됩니다. 요청 시 실행이 아니라 정적 provider 카탈로그 메타데이터 또는 좁은 탐색 설명자에 사용하세요.
- 배타적 Plugin kind는 `plugins.slots.*`를 통해 선택됩니다: `kind: "memory"`는 `plugins.slots.memory`, `kind: "context-engine"`는 `plugins.slots.contextEngine` (기본값 `legacy`)를 통해 선택합니다.
- env-var 메타데이터(`setup.providers[].envVars`, deprecated `providerAuthEnvVars`, `channelEnvVars`)는 선언적 정보일 뿐입니다. 상태, 감사, Cron 전송 검증, 기타 읽기 전용 표면은 여전히 env var를 구성된 것으로 취급하기 전에 Plugin 신뢰 및 유효 활성화 정책을 적용합니다.
- provider 코드가 필요한 런타임 마법사 메타데이터는 [Provider runtime hooks](/ko/plugins/architecture-internals#provider-runtime-hooks)를 참조하세요.
- Plugin이 기본 모듈에 의존한다면, 빌드 단계와 패키지 관리자 허용 목록 요구 사항을 문서화하세요(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## 관련 항목

<CardGroup cols={3}>
  <Card title="Plugin 빌드하기" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin 아키텍처" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처 및 capability 모델.
  </Card>
  <Card title="SDK 개요" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 import.
  </Card>
</CardGroup>
