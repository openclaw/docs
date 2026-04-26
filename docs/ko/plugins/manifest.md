---
read_when:
    - OpenClaw Plugin을 만들고 있는 경우
    - Plugin config schema를 배포하거나 Plugin 검증 오류를 디버그해야 하는 경우
summary: Plugin manifest + JSON schema 요구 사항(엄격한 config 검증)
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-26T11:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

이 페이지는 **기본 OpenClaw Plugin manifest** 전용입니다.

호환 가능한 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참고하세요.

호환 번들 형식은 다른 manifest 파일을 사용합니다.

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 manifest가 없는 기본 Claude component 레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기에서 설명하는 `openclaw.plugin.json` schema로 검증되지는 않습니다.

호환 번들에 대해 OpenClaw는 현재, 레이아웃이 OpenClaw 런타임 기대 사항과 일치할 때 번들 메타데이터와 선언된 skill root, Claude 명령 root, Claude 번들 `settings.json` 기본값, Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 기본 OpenClaw Plugin은 반드시 **Plugin 루트**에 `openclaw.plugin.json` 파일을 포함해야 합니다. OpenClaw는 이 manifest를 사용해 **Plugin 코드를 실행하지 않고도** 구성을 검증합니다. manifest가 없거나 잘못된 경우 Plugin 오류로 처리되며 config 검증을 차단합니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참고하세요.
기본 capability 모델과 현재 외부 호환성 가이드는
[Capability model](/ko/plugins/architecture#public-capability-model)을 참고하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에** 읽는 메타데이터입니다. 아래의 모든 내용은 Plugin 런타임을 부팅하지 않고도 검사할 수 있을 만큼 가벼워야 합니다.

**사용 목적:**

- Plugin 식별, config 검증, config UI 힌트
- auth, 온보딩, setup 메타데이터(alias, auto-enable, provider env var, auth choice)
- control-plane 표면의 activation hint
- shorthand 모델 계열 소유권
- 정적 capability 소유권 스냅샷(`contracts`)
- 공용 `openclaw qa` 호스트가 검사할 수 있는 QA 러너 메타데이터
- 카탈로그 및 검증 표면에 병합되는 channel 전용 config 메타데이터

**사용하지 말아야 할 것:** 런타임 동작 등록, 코드 entrypoint 선언, npm 설치 메타데이터. 이러한 항목은 Plugin 코드와 `package.json`에 속합니다.

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
  "description": "OpenRouter provider Plugin",
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

| 필드                                 | 필수 여부 | 타입                             | 의미                                                                                                                                                                                                                             |
| ------------------------------------ | --------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예        | `string`                         | 정식 Plugin ID입니다. 이 ID는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                                             |
| `configSchema`                       | 예        | `object`                         | 이 Plugin config용 인라인 JSON Schema입니다.                                                                                                                                                                                      |
| `enabledByDefault`                   | 아니오    | `true`                           | 번들 Plugin을 기본적으로 활성화된 것으로 표시합니다. 기본적으로 비활성 상태로 두려면 생략하거나 `true`가 아닌 값을 설정하세요.                                                                                                  |
| `legacyPluginIds`                    | 아니오    | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | 아니오    | `string[]`                       | auth, config, 또는 모델 ref가 언급할 때 이 Plugin을 자동 활성화해야 하는 provider ID입니다.                                                                                                                                     |
| `kind`                               | 아니오    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin kind를 선언합니다.                                                                                                                                                                  |
| `channels`                           | 아니오    | `string[]`                       | 이 Plugin이 소유하는 channel ID입니다. 검색과 config 검증에 사용됩니다.                                                                                                                                                          |
| `providers`                          | 아니오    | `string[]`                       | 이 Plugin이 소유하는 provider ID입니다.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | 아니오    | `string`                         | Plugin 루트 기준 상대 경로의 경량 provider-discovery 모듈 경로입니다. 전체 Plugin 런타임을 활성화하지 않고도 로드할 수 있는 manifest 범위 provider 카탈로그 메타데이터용입니다.                                              |
| `modelSupport`                       | 아니오    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는, manifest 소유의 shorthand 모델 계열 메타데이터입니다.                                                                                                                           |
| `modelCatalog`                       | 아니오    | `object`                         | 이 Plugin이 소유한 provider를 위한 선언적 모델 카탈로그 메타데이터입니다. 이는 Plugin 런타임을 로드하지 않고도 미래의 읽기 전용 목록 조회, 온보딩, 모델 선택기, 별칭, 숨김 처리를 위한 control-plane 계약입니다.            |
| `providerEndpoints`                  | 아니오    | `object[]`                       | provider 런타임이 로드되기 전에 core가 분류해야 하는 provider route용, manifest 소유 endpoint host/baseUrl 메타데이터입니다.                                                                                                    |
| `cliBackends`                        | 아니오    | `string[]`                       | 이 Plugin이 소유한 CLI 추론 backend ID입니다. 명시적 config ref로부터의 시작 시 자동 활성화에 사용됩니다.                                                                                                                       |
| `syntheticAuthRefs`                  | 아니오    | `string[]`                       | 런타임이 로드되기 전에 cold 모델 검색 중에 Plugin 소유 synthetic auth hook을 probe해야 하는 provider 또는 CLI backend ref입니다.                                                                                                 |
| `nonSecretAuthMarkers`               | 아니오    | `string[]`                       | 비밀 정보가 아닌 로컬, OAuth 또는 ambient 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API 키 값입니다.                                                                                                               |
| `commandAliases`                     | 아니오    | `object[]`                       | 런타임이 로드되기 전에 Plugin 인식형 config 및 CLI diagnostics를 생성해야 하는, 이 Plugin이 소유한 명령 이름입니다.                                                                                                             |
| `providerAuthEnvVars`                | 아니오    | `Record<string, string[]>`       | provider auth/status 조회용 레거시 호환 env 메타데이터입니다. 새 Plugin에서는 `setup.providers[].envVars`를 우선 사용하세요. OpenClaw는 사용 중단 기간 동안 여전히 이를 읽습니다.                                               |
| `providerAuthAliases`                | 아니오    | `Record<string, string>`         | auth 조회를 위해 다른 provider ID를 재사용해야 하는 provider ID입니다. 예: 기본 provider API 키 및 auth profile을 공유하는 코딩 provider.                                                                                      |
| `channelEnvVars`                     | 아니오    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 channel env 메타데이터입니다. 일반적인 시작/config helper가 볼 수 있어야 하는 env 기반 channel setup 또는 auth 표면에 사용하세요.                                 |
| `providerAuthChoices`                | 아니오    | `object[]`                       | 온보딩 선택기, 선호 provider 해석, 단순 CLI 플래그 연결용 경량 auth-choice 메타데이터입니다.                                                                                                                                    |
| `activation`                         | 아니오    | `object`                         | provider, 명령, channel, route, capability 트리거 로드를 위한 경량 activation planner 메타데이터입니다. 메타데이터 전용이며 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                     |
| `setup`                              | 아니오    | `object`                         | 검색 및 setup 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 경량 setup/온보딩 descriptor입니다.                                                                                                                        |
| `qaRunners`                          | 아니오    | `object[]`                       | Plugin 런타임이 로드되기 전에 공용 `openclaw qa` 호스트가 사용하는 경량 QA runner descriptor입니다.                                                                                                                             |
| `contracts`                          | 아니오    | `object`                         | 외부 auth hook, speech, 실시간 전사, 실시간 음성, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, tool 소유권에 대한 정적 번들 capability 스냅샷입니다.                     |
| `mediaUnderstandingProviderMetadata` | 아니오    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider ID용 경량 media-understanding 기본값입니다.                                                                                                                           |
| `channelConfigs`                     | 아니오    | `Record<string, object>`         | 런타임 로드 전에 검색 및 검증 표면에 병합되는, manifest 소유 channel config 메타데이터입니다.                                                                                                                                   |
| `skills`                             | 아니오    | `string[]`                       | Plugin 루트 기준 상대 경로의 로드할 Skills 디렉터리입니다.                                                                                                                                                                       |
| `name`                               | 아니오    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                            |
| `description`                        | 아니오    | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                                           |
| `version`                            | 아니오    | `string`                         | 정보용 Plugin 버전입니다.                                                                                                                                                                                                         |
| `uiHints`                            | 아니오    | `Record<string, object>`         | config 필드용 UI 레이블, placeholder, 민감도 힌트입니다.                                                                                                                                                                          |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 auth choice를 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.
provider setup 목록은 provider 런타임을 로드하지 않고도 이러한 manifest choice,
descriptor에서 파생된 setup choice, install-catalog 메타데이터를 사용합니다.

| 필드                 | 필수 여부 | 타입                                            | 의미                                                                                                 |
| -------------------- | --------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`           | 예        | `string`                                        | 이 choice가 속한 provider ID입니다.                                                                  |
| `method`             | 예        | `string`                                        | 디스패치할 auth method ID입니다.                                                                     |
| `choiceId`           | 예        | `string`                                        | 온보딩과 CLI 흐름에서 사용하는 안정적인 auth-choice ID입니다.                                       |
| `choiceLabel`        | 아니오    | `string`                                        | 사용자에게 보이는 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대신 사용합니다.                   |
| `choiceHint`         | 아니오    | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                                   |
| `assistantPriority`  | 아니오    | `number`                                        | 값이 낮을수록 assistant 기반 대화형 선택기에서 더 먼저 정렬됩니다.                                   |
| `assistantVisibility`| 아니오    | `"visible"` \| `"manual-only"`                  | assistant 선택기에서는 숨기되 수동 CLI 선택은 계속 허용합니다.                                      |
| `deprecatedChoiceIds`| 아니오    | `string[]`                                      | 사용자를 이 대체 choice로 리디렉션해야 하는 레거시 choice ID입니다.                                 |
| `groupId`            | 아니오    | `string`                                        | 관련 choice를 묶기 위한 선택적 그룹 ID입니다.                                                       |
| `groupLabel`         | 아니오    | `string`                                        | 해당 그룹의 사용자 표시 레이블입니다.                                                                |
| `groupHint`          | 아니오    | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                                     |
| `optionKey`          | 아니오    | `string`                                        | 단일 플래그 기반의 단순 auth 흐름을 위한 내부 option 키입니다.                                      |
| `cliFlag`            | 아니오    | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                  |
| `cliOption`          | 아니오    | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                         |
| `cliDescription`     | 아니오    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                    |
| `onboardingScopes`   | 아니오    | `Array<"text-inference" \| "image-generation">` | 이 choice가 나타나야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.        |

## commandAliases 참조

사용자가 `plugins.allow`에 잘못 넣거나 루트 CLI 명령으로 실행하려고 할 수 있는 런타임 명령 이름을 Plugin이 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는 Plugin 런타임 코드를 import하지 않고도 diagnostics를 위해 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 타입              | 의미                                                                  |
| ------------ | --------- | ----------------- | --------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속한 명령 이름입니다.                                     |
| `kind`       | 아니오    | `"runtime-slash"` | 이 별칭이 루트 CLI 명령이 아니라 채팅 슬래시 명령임을 표시합니다.     |
| `cliCommand` | 아니오    | `string`          | 존재하는 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.       |

## activation 참조

Plugin이 어떤 control-plane 이벤트에서 activation/load 계획에 포함되어야 하는지를 저렴하게 선언할 수 있을 때 `activation`을 사용하세요.

이 블록은 planner 메타데이터이지 lifecycle API가 아닙니다. 런타임 동작을 등록하지 않으며, `register(...)`를 대체하지 않고, Plugin 코드가 이미 실행되었음을 보장하지도 않습니다. activation planner는 이 필드를 사용해 `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hook 같은 기존 manifest 소유권 메타데이터로 폴백하기 전에 후보 Plugin 범위를 좁힙니다.

이미 소유권을 표현하는 가장 좁은 메타데이터를 우선 사용하세요. 해당 관계를 `providers`, `channels`, `commandAliases`, setup descriptor, `contracts`로 표현할 수 있다면 그 필드를 사용하세요. `activation`은 그러한 소유권 필드로 표현할 수 없는 추가 planner 힌트용으로 사용하세요.
`claude-cli`, `codex-cli`, `google-gemini-cli` 같은 CLI 런타임 별칭에는 최상위 `cliBackends`를 사용하세요. `activation.onAgentHarnesses`는 이미 소유권 필드가 없는 내장 에이전트 harness ID에만 사용됩니다.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며, `register(...)`, `setupEntry`, 기타 런타임/Plugin entrypoint를 대체하지도 않습니다. 현재 소비자는 이를 더 넓은 Plugin 로딩 전에 후보 범위를 좁히는 힌트로 사용하므로, activation 메타데이터가 없으면 보통 성능 비용만 발생하고, 레거시 manifest 소유권 폴백이 존재하는 한 정확성은 바뀌지 않아야 합니다.

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

| 필드               | 필수 여부 | 타입                                                 | 의미                                                                                                                                   |
| ------------------ | --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | 아니오    | `string[]`                                           | activation/load 계획에 이 Plugin을 포함해야 하는 provider ID입니다.                                                                   |
| `onAgentHarnesses` | 아니오    | `string[]`                                           | activation/load 계획에 이 Plugin을 포함해야 하는 내장 에이전트 harness 런타임 ID입니다. CLI backend 별칭에는 최상위 `cliBackends`를 사용하세요. |
| `onCommands`       | 아니오    | `string[]`                                           | activation/load 계획에 이 Plugin을 포함해야 하는 command ID입니다.                                                                    |
| `onChannels`       | 아니오    | `string[]`                                           | activation/load 계획에 이 Plugin을 포함해야 하는 channel ID입니다.                                                                    |
| `onRoutes`         | 아니오    | `string[]`                                           | activation/load 계획에 이 Plugin을 포함해야 하는 route kind입니다.                                                                    |
| `onCapabilities`   | 아니오    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane activation planning에 사용되는 넓은 capability 힌트입니다. 가능하면 더 좁은 필드를 우선 사용하세요.                   |

현재 실제 소비자:

- 명령 트리거 CLI planning은 레거시 `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 폴백합니다
- 에이전트 런타임 시작 planning은 내장 harness에는 `activation.onAgentHarnesses`, CLI 런타임 별칭에는 최상위 `cliBackends[]`를 사용합니다
- channel 트리거 setup/channel planning은 명시적 channel activation 메타데이터가 없을 때 레거시 `channels[]` 소유권으로 폴백합니다
- provider 트리거 setup/runtime planning은 명시적 provider activation 메타데이터가 없을 때 레거시 `providers[]` 및 최상위 `cliBackends[]` 소유권으로 폴백합니다

Planner diagnostics는 명시적 activation 힌트와 manifest 소유권 폴백을 구분할 수 있습니다. 예를 들어 `activation-command-hint`는 `activation.onCommands`가 일치했음을 의미하고, `manifest-command-alias`는 planner가 대신 `commandAliases` 소유권을 사용했음을 의미합니다. 이러한 reason 라벨은 호스트 diagnostics와 테스트용입니다. Plugin 작성자는 계속해서 소유권을 가장 잘 설명하는 메타데이터를 선언해야 합니다.

## qaRunners 참조

Plugin이 공용 `openclaw qa` 루트 아래에 하나 이상의 transport runner를 기여할 때 `qaRunners`를 사용하세요. 이 메타데이터는 가볍고 정적으로 유지하세요. 실제 CLI 등록은 여전히 `qaRunnerCliRegistrations`를 export하는 경량 `runtime-api.ts` 표면을 통해 Plugin 런타임이 소유합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "임시 homeserver에 대해 Docker 기반 Matrix live QA 레인을 실행"
    }
  ]
}
```

| 필드          | 필수 여부 | 타입     | 의미                                                                  |
| ------------- | --------- | -------- | --------------------------------------------------------------------- |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 mount되는 하위 명령입니다. 예: `matrix`          |
| `description` | 아니오    | `string` | 공용 호스트가 stub 명령이 필요할 때 사용하는 폴백 도움말 텍스트입니다. |

## setup 참조

setup 및 온보딩 표면이 런타임 로드 전에 Plugin 소유의 경량 메타데이터를 필요로 할 때 `setup`을 사용하세요.

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

최상위 `cliBackends`는 여전히 유효하며 CLI 추론 backend를 계속 설명합니다. `setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는 control-plane/setup 흐름을 위한 setup 전용 descriptor 표면입니다.

`setup.providers`와 `setup.cliBackends`가 존재하면 setup 검색을 위한 선호되는 descriptor-first 조회 표면이 됩니다. descriptor가 후보 Plugin만 좁히고 setup이 여전히 더 풍부한 setup 시점 런타임 hook을 필요로 한다면, `requiresRuntime: true`를 설정하고 `setup-api`를 폴백 실행 경로로 유지하세요.

OpenClaw는 `setup.providers[].envVars`를 일반 provider auth 및 env-var 조회에도 포함합니다. `providerAuthEnvVars`는 사용 중단 기간 동안 호환성 어댑터를 통해 계속 지원되지만, 이를 계속 사용하는 비번들 Plugin은 manifest diagnostic을 받습니다. 새 Plugin은 setup/status env 메타데이터를 `setup.providers[].envVars`에 두어야 합니다.

OpenClaw는 setup entry가 없거나 `setup.requiresRuntime: false`가 setup 런타임이 필요 없음을 선언할 때 `setup.providers[].authMethods`로부터 단순한 setup choice를 파생할 수도 있습니다. 사용자 정의 레이블, CLI 플래그, 온보딩 범위, assistant 메타데이터가 필요하면 여전히 명시적인 `providerAuthChoices` 항목이 우선됩니다.

setup 표면에 해당 descriptor만으로 충분할 때에만 `requiresRuntime: false`를 설정하세요. OpenClaw는 명시적인 `false`를 descriptor 전용 계약으로 취급하며, setup 조회를 위해 `setup-api` 또는 `openclaw.setupEntry`를 실행하지 않습니다. descriptor 전용 Plugin이 여전히 이들 setup 런타임 entry 중 하나를 포함하면 OpenClaw는 추가 진단을 보고하고 계속 이를 무시합니다. `requiresRuntime`를 생략하면 레거시 폴백 동작이 유지되므로, 플래그 없이 descriptor를 추가한 기존 Plugin이 깨지지 않습니다.

setup 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로, 정규화된 `setup.providers[].id`와 `setup.cliBackends[]` 값은 검색된 Plugin 전반에서 고유해야 합니다. 소유권이 모호하면 검색 순서에 따라 임의로 선택하지 않고 fail-closed로 처리됩니다.

setup 런타임이 실제로 실행될 때, setup registry diagnostics는 `setup-api`가 manifest descriptor에 선언되지 않은 provider 또는 CLI backend를 등록하거나, descriptor에 대응하는 런타임 등록이 없을 경우 descriptor 드리프트를 보고합니다. 이러한 diagnostics는 추가 정보일 뿐이며 레거시 Plugin을 거부하지는 않습니다.

### setup.providers 참조

| 필드          | 필수 여부 | 타입       | 의미                                                                                     |
| ------------- | --------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | 예        | `string`   | setup 또는 온보딩 중 노출되는 provider ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니오    | `string[]` | 전체 런타임을 로드하지 않고 이 provider가 지원하는 setup/auth method ID입니다.          |
| `envVars`     | 아니오    | `string[]` | 일반적인 setup/status 표면이 Plugin 런타임 로드 전에 확인할 수 있는 env var입니다.      |

### setup 필드

| 필드               | 필수 여부 | 타입       | 의미                                                                                               |
| ------------------ | --------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | 아니오    | `object[]` | setup 및 온보딩 중 노출되는 provider setup descriptor입니다.                                       |
| `cliBackends`      | 아니오    | `string[]` | descriptor-first setup 조회에 사용되는 setup 시점 backend ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니오    | `string[]` | 이 Plugin의 setup 표면이 소유하는 config migration ID입니다.                                      |
| `requiresRuntime`  | 아니오    | `boolean`  | descriptor 조회 후에도 setup에 `setup-api` 실행이 필요한지 여부입니다.                            |

## uiHints 참조

`uiHints`는 config 필드 이름에서 작은 렌더링 힌트로 매핑되는 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "OpenRouter 요청에 사용됨",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다.

| 필드          | 타입       | 의미                                  |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | 사용자 표시 필드 레이블               |
| `help`        | `string`   | 짧은 도움말 텍스트                    |
| `tags`        | `string[]` | 선택적 UI 태그                        |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시             |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 정보로 표시     |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트          |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고도 읽을 수 있는 정적 capability 소유권 메타데이터에만 `contracts`를 사용하세요.

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

각 목록은 선택 사항입니다.

| 필드                             | 타입       | 의미                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 확장 factory ID이며, 현재는 `codex-app-server`입니다. |
| `agentToolResultMiddleware`      | `string[]` | 번들 Plugin이 tool-result middleware를 등록할 수 있는 런타임 ID입니다. |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 소유한 외부 auth profile hook의 provider ID입니다.        |
| `speechProviders`                | `string[]` | 이 Plugin이 소유한 speech provider ID입니다.                          |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유한 실시간 전사 provider ID입니다.                     |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유한 실시간 음성 provider ID입니다.                     |
| `memoryEmbeddingProviders`       | `string[]` | 이 Plugin이 소유한 메모리 임베딩 provider ID입니다.                   |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유한 media-understanding provider ID입니다.             |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유한 image-generation provider ID입니다.                |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유한 video-generation provider ID입니다.                |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유한 web-fetch provider ID입니다.                       |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유한 web-search provider ID입니다.                      |
| `tools`                          | `string[]` | 번들 계약 검사용으로 이 Plugin이 소유한 에이전트 도구 이름입니다.     |

`contracts.embeddedExtensionFactories`는 번들된 Codex app-server 전용 확장 factory를 위해 유지됩니다. 번들된 tool-result 변환은 `contracts.agentToolResultMiddleware`를 선언하고 대신 `api.registerAgentToolResultMiddleware(...)`로 등록해야 합니다. 외부 Plugin은 모델이 보기 전에 높은 신뢰도의 도구 출력을 다시 쓸 수 있기 때문에 tool-result middleware를 등록할 수 없습니다.

`resolveExternalAuthProfiles`를 구현하는 provider Plugin은 `contracts.externalAuthProviders`를 선언해야 합니다. 이 선언이 없는 Plugin도 deprecated 호환성 폴백을 통해 여전히 동작하지만, 이 폴백은 더 느리고 마이그레이션 기간 후 제거될 예정입니다.

번들된 memory embedding provider는 노출하는 모든 adapter ID에 대해 `contracts.memoryEmbeddingProviders`를 선언해야 합니다. 여기에는 `local` 같은 내장 adapter도 포함됩니다. 독립 실행형 CLI 경로는 이 manifest 계약을 사용해 전체 Gateway 런타임이 provider를 등록하기 전에 소유 Plugin만 로드합니다.

## mediaUnderstandingProviderMetadata 참조

media-understanding provider에 기본 모델, 자동 인증 폴백 우선순위 또는 기본 문서 지원이 있어서 일반적인 core helper가 런타임 로드 전에 이를 알아야 할 때 `mediaUnderstandingProviderMetadata`를 사용하세요. 키는 `contracts.mediaUnderstandingProviders`에도 선언되어 있어야 합니다.

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

| 필드                   | 타입                                | 의미                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 provider가 노출하는 미디어 capability입니다.                              |
| `defaultModels`        | `Record<string, string>`            | config에 모델이 지정되지 않았을 때 사용하는 capability별 기본 모델입니다.     |
| `autoPriority`         | `Record<string, number>`            | 자동 자격 증명 기반 provider 폴백에서 값이 낮을수록 먼저 정렬됩니다.          |
| `nativeDocumentInputs` | `"pdf"[]`                           | 이 provider가 지원하는 기본 문서 입력입니다.                                 |

## channelConfigs 참조

channel Plugin이 런타임 로드 전에 경량 config 메타데이터를 필요로 할 때 `channelConfigs`를 사용하세요. 읽기 전용 channel setup/status 검색은 setup entry가 없거나 `setup.requiresRuntime: false`가 setup 런타임 불필요를 선언할 때, 구성된 외부 channel에 대해 이 메타데이터를 직접 사용할 수 있습니다.

`channelConfigs`는 Plugin manifest 메타데이터이지 새로운 최상위 사용자 config 섹션이 아닙니다. 사용자는 여전히 `channels.<channel-id>` 아래에서 channel 인스턴스를 구성합니다. OpenClaw는 Plugin 런타임 코드가 실행되기 전에 어떤 Plugin이 해당 구성된 channel을 소유하는지 결정하기 위해 manifest 메타데이터를 읽습니다.

channel Plugin의 경우 `configSchema`와 `channelConfigs`는 서로 다른 경로를 설명합니다.

- `configSchema`는 `plugins.entries.<plugin-id>.config`를 검증합니다
- `channelConfigs.<channel-id>.schema`는 `channels.<channel-id>`를 검증합니다

`channels[]`를 선언하는 비번들 Plugin은 일치하는 `channelConfigs` 항목도 선언해야 합니다. 이것이 없으면 OpenClaw는 여전히 Plugin을 로드할 수 있지만, cold-path config schema, setup, Control UI 표면은 Plugin 런타임이 실행되기 전까지 channel 소유 옵션 형태를 알 수 없습니다.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 및 `nativeSkillsAutoEnabled`는 channel 런타임이 로드되기 전에 실행되는 명령 config 검사에서 정적 `auto` 기본값을 선언할 수 있습니다. 번들 channel은 다른 package 소유 channel 카탈로그 메타데이터와 함께 `package.json#openclaw.channel.commands`를 통해 동일한 기본값을 게시할 수도 있습니다.

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
      "description": "Matrix homeserver 연결",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 channel 항목에는 다음이 포함될 수 있습니다.

| 필드          | 타입                     | 의미                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON Schema입니다. 선언된 각 channel config 항목에 대해 필수입니다.     |
| `uiHints`     | `Record<string, object>` | 해당 channel config 섹션용 선택적 UI 레이블/placeholder/민감도 힌트입니다.                |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 inspect 표면에 병합되는 channel 레이블입니다. |
| `description` | `string`                 | inspect 및 카탈로그 표면용 짧은 channel 설명입니다.                                       |
| `commands`    | `object`                 | 런타임 전 config 검사용 정적 기본 명령어 및 기본 Skills 자동 기본값입니다.               |
| `preferOver`  | `string[]`               | 선택 표면에서 이 channel이 더 우선해야 하는 레거시 또는 낮은 우선순위 Plugin ID입니다.    |

### 다른 channel Plugin 대체하기

다른 Plugin도 제공할 수 있는 channel ID에 대해, 여러분의 Plugin이 선호되는 소유자인 경우 `preferOver`를 사용하세요. 일반적인 경우는 Plugin ID가 변경된 경우, 번들 Plugin을 대체하는 독립 Plugin, 또는 config 호환성을 위해 동일한 channel ID를 유지하는 유지보수 fork입니다.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

`channels.chat`이 구성되면 OpenClaw는 channel ID와 선호되는 Plugin ID를 모두 고려합니다. 더 낮은 우선순위의 Plugin이 번들이거나 기본 활성화되어 있다는 이유만으로 선택된 경우, OpenClaw는 하나의 Plugin만 해당 channel과 그 도구를 소유하도록 유효 런타임 config에서 그 Plugin을 비활성화합니다. 하지만 사용자의 명시적 선택이 더 우선합니다. 사용자가 두 Plugin을 모두 명시적으로 활성화했다면, OpenClaw는 그 선택을 유지하고 요청된 Plugin 집합을 조용히 변경하는 대신 중복 channel/tool diagnostics를 보고합니다.

`preferOver`는 실제로 같은 channel을 제공할 수 있는 Plugin ID에만 한정해서 사용하세요. 이것은 일반적인 우선순위 필드가 아니며 사용자 config 키의 이름을 바꾸지도 않습니다.

## modelSupport 참조

Plugin 런타임이 로드되기 전에 `gpt-5.5` 또는 `claude-sonnet-4.6` 같은 shorthand 모델 ID로부터 OpenClaw가 여러분의 provider Plugin을 추론해야 한다면 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다.

- 명시적인 `provider/model` ref는 소유 `providers` manifest 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 하나의 비번들 Plugin과 하나의 번들 Plugin이 모두 일치하면 비번들 Plugin이 우선합니다
- 남은 모호성은 사용자가 또는 config가 provider를 지정할 때까지 무시됩니다

필드:

| 필드            | 타입       | 의미                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand 모델 ID에 대해 `startsWith`로 매칭되는 접두사입니다.                 |
| `modelPatterns` | `string[]` | profile suffix 제거 후 shorthand 모델 ID에 대해 매칭되는 정규식 소스입니다.    |

## modelCatalog 참조

Plugin 런타임을 로드하기 전에 OpenClaw가 provider 모델 메타데이터를 알아야 한다면 `modelCatalog`를 사용하세요. 이것은 고정 카탈로그 행, provider 별칭, suppression 규칙, discovery 모드에 대한 manifest 소유 소스입니다. 런타임 새로 고침은 여전히 provider 런타임 코드에 속하지만, manifest는 core에 런타임이 필요한 시점을 알려줍니다.

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
        "reason": "Azure OpenAI Responses에서는 사용 불가"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

최상위 필드:

| 필드           | 타입                                                     | 의미                                                                                                    |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 이 Plugin이 소유한 provider ID용 카탈로그 행입니다. 키는 최상위 `providers`에도 나타나야 합니다.       |
| `aliases`      | `Record<string, object>`                                 | 카탈로그 또는 suppression 계획을 위해 소유 provider로 해석되어야 하는 provider 별칭입니다.             |
| `suppressions` | `object[]`                                               | provider별 이유로 이 Plugin이 다른 소스의 모델 행을 숨기는 규칙입니다.                                 |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | provider 카탈로그를 manifest 메타데이터에서 읽을 수 있는지, 캐시로 새로 고칠 수 있는지, 런타임이 필요한지를 나타냅니다. |

Provider 필드:

| 필드      | 타입                     | 의미                                                               |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | 이 provider 카탈로그의 모델에 대한 선택적 기본 base URL입니다.     |
| `api`     | `ModelApi`               | 이 provider 카탈로그의 모델에 대한 선택적 기본 API 어댑터입니다.   |
| `headers` | `Record<string, string>` | 이 provider 카탈로그에 적용되는 선택적 정적 헤더입니다.            |
| `models`  | `object[]`               | 필수 모델 행입니다. `id`가 없는 행은 무시됩니다.                   |

Model 필드:

| 필드            | 타입                                                           | 의미                                                                          |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` 접두사 없는 provider 로컬 모델 ID입니다.                         |
| `name`          | `string`                                                       | 선택적 표시 이름입니다.                                                       |
| `api`           | `ModelApi`                                                     | 선택적 모델별 API 재정의입니다.                                               |
| `baseUrl`       | `string`                                                       | 선택적 모델별 base URL 재정의입니다.                                          |
| `headers`       | `Record<string, string>`                                       | 선택적 모델별 정적 헤더입니다.                                                |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 모델이 허용하는 modality입니다.                                               |
| `reasoning`     | `boolean`                                                      | 모델이 reasoning 동작을 노출하는지 여부입니다.                                |
| `contextWindow` | `number`                                                       | 기본 provider 컨텍스트 윈도입니다.                                            |
| `contextTokens` | `number`                                                       | `contextWindow`와 다를 때의 선택적 유효 런타임 컨텍스트 상한입니다.           |
| `maxTokens`     | `number`                                                       | 알려진 경우 최대 출력 토큰 수입니다.                                          |
| `cost`          | `object`                                                       | 선택적 백만 토큰당 USD 가격이며, 선택적 `tieredPricing`을 포함할 수 있습니다. |
| `compat`        | `object`                                                       | OpenClaw 모델 config 호환성과 일치하는 선택적 호환성 플래그입니다.           |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 목록 상태입니다. 행이 전혀 나타나지 않아야 할 때만 suppression을 사용하세요.  |
| `statusReason`  | `string`                                                       | 사용 불가 상태와 함께 표시되는 선택적 이유입니다.                             |
| `replaces`      | `string[]`                                                     | 이 모델이 대체하는 이전 provider 로컬 모델 ID입니다.                          |
| `replacedBy`    | `string`                                                       | deprecated 행을 대체하는 provider 로컬 모델 ID입니다.                         |
| `tags`          | `string[]`                                                     | picker와 필터에서 사용하는 안정적인 태그입니다.                               |

`modelCatalog`에는 런타임 전용 데이터를 넣지 마세요. 완전한 모델 집합을 알기 위해 provider가 계정 상태, API 요청 또는 로컬 프로세스 discovery를 필요로 한다면, `discovery`에서 해당 provider를 `refreshable` 또는 `runtime`으로 선언하세요.

### OpenClaw Provider Index

OpenClaw Provider Index는 Plugin이 아직 설치되지 않았을 수 있는 provider를 위한 OpenClaw 소유의 preview 메타데이터입니다. 이는 Plugin manifest의 일부가 아닙니다. Plugin manifest는 설치된 Plugin에 대한 권한 소스로 남습니다. Provider Index는 provider Plugin이 설치되지 않았을 때 미래의 설치 가능 provider 및 사전 설치 모델 picker 표면이 소비하게 될 내부 폴백 계약입니다.

카탈로그 권한 순서:

1. 사용자 config
2. 설치된 Plugin manifest의 `modelCatalog`
3. 명시적 새로 고침에서 얻은 모델 카탈로그 캐시
4. OpenClaw Provider Index preview 행

Provider Index에는 비밀 정보, 활성화 상태, 런타임 hook, 실시간 계정별 모델 데이터가 포함되어서는 안 됩니다. 그 preview 카탈로그는 Plugin manifest와 동일한 `modelCatalog` provider 행 형태를 사용하지만, `api`, `baseUrl`, 가격, 호환성 플래그 같은 런타임 어댑터 필드가 설치된 Plugin manifest와 의도적으로 정렬되어 유지되지 않는 한 안정적인 표시 메타데이터로 제한되어야 합니다. 실시간 `/models` discovery가 있는 provider는 일반적인 목록 조회나 온보딩에서 provider API를 호출하는 대신, 명시적 모델 카탈로그 캐시 경로를 통해 새로 고친 행을 기록해야 합니다.

Provider Index 항목에는 Plugin이 core 밖으로 이동했거나 아직 설치되지 않은 provider를 위한 설치 가능 Plugin 메타데이터도 포함될 수 있습니다. 이 메타데이터는 channel 카탈로그 패턴을 따릅니다. 패키지 이름, npm 설치 스펙, 예상 무결성, 경량 auth-choice 레이블이면 설치 가능한 setup 옵션을 표시하기에 충분합니다. Plugin이 설치되면 해당 provider에 대해서는 Plugin manifest가 우선하고 Provider Index 항목은 무시됩니다.

레거시 최상위 capability 키는 deprecated 상태입니다. `openclaw doctor --fix`를 사용해 `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요. 일반 manifest 로딩은 더 이상 이러한 최상위 필드를 capability 소유권으로 취급하지 않습니다.

## Manifest와 package.json

두 파일은 서로 다른 역할을 합니다.

| 파일                   | 사용 목적                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | 검색, config 검증, auth-choice 메타데이터, Plugin 코드 실행 전에 반드시 존재해야 하는 UI 힌트                          |
| `package.json`         | npm 메타데이터, 의존성 설치, entrypoint, install gating, setup 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록     |

어떤 메타데이터를 어디에 둬야 할지 확실하지 않다면 다음 규칙을 사용하세요.

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, entry 파일, npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 런타임 전 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라 `package.json`의 `openclaw` 블록 아래에 위치합니다.

중요한 예시:

| 필드                                                             | 의미                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 기본 Plugin entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                                    |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지에 대한 빌드된 JavaScript 런타임 entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                  |
| `openclaw.setupEntry`                                             | 온보딩, 지연된 channel 시작, 읽기 전용 channel 상태/SecretRef 검색 중에 사용되는 경량 setup 전용 entrypoint입니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                    |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지에 대한 빌드된 JavaScript setup entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                   |
| `openclaw.channel`                                                | 레이블, 문서 경로, 별칭, 선택 문구 같은 경량 channel 카탈로그 메타데이터입니다.                                                                                                      |
| `openclaw.channel.commands`                                       | channel 런타임이 로드되기 전에 config, audit, command-list 표면에서 사용하는 정적 기본 명령어 및 기본 Skills 자동 기본 메타데이터입니다.                                            |
| `openclaw.channel.configuredState`                                | 전체 channel 런타임을 로드하지 않고도 "env만으로 된 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state 검사기 메타데이터입니다.                                           |
| `openclaw.channel.persistedAuthState`                             | 전체 channel 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.                                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 Plugin 및 외부 게시 Plugin에 대한 설치/업데이트 힌트입니다.                                                                                                                     |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                          |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                      |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist integrity 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이에 대해 검증합니다.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | config가 잘못된 경우 좁은 범위의 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 channel Plugin보다 먼저 setup 전용 channel 표면이 로드되도록 합니다.                                                                                                    |

manifest 메타데이터는 런타임 로드 전에 온보딩에 어떤 provider/channel/setup choice가 나타나는지를 결정합니다. `package.json#openclaw.install`은 사용자가 그 choice 중 하나를 선택했을 때 온보딩에 어떻게 해당 Plugin을 가져오거나 활성화할지를 알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치와 manifest registry 로딩 중 강제됩니다. 잘못된 값은 거부되고, 더 새로운 값이지만 유효한 경우 오래된 호스트에서는 해당 Plugin을 건너뜁니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 들어 있습니다. 예:
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`.
공식 외부 카탈로그 항목은 정확한 스펙과 `expectedIntegrity`를 함께 사용해야 업데이트 흐름이 가져온 npm 아티팩트가 고정된 릴리스와 더 이상 일치하지 않을 때 fail-closed가 되도록 할 수 있습니다. 대화형 온보딩은 호환성을 위해 bare package name과 dist-tag를 포함한 신뢰된 registry npm spec도 계속 제공합니다. 카탈로그 diagnostics는 정확 고정, 부동 버전, integrity 고정, integrity 누락, package-name 불일치, 잘못된 default-choice 소스를 구분할 수 있습니다. 또한 `expectedIntegrity`가 존재하지만 이를 고정할 수 있는 유효한 npm 소스가 없을 때 경고합니다. `expectedIntegrity`가 존재하면 설치/업데이트 흐름이 이를 강제하고, 생략되면 registry 해석 결과는 integrity 고정 없이 기록됩니다.

channel Plugin은 상태, channel 목록, SecretRef 스캔이 전체 런타임을 로드하지 않고도 구성된 account를 식별해야 할 때 `openclaw.setupEntry`를 제공해야 합니다. setup entry는 channel 메타데이터와 setup-safe config, status, secrets adapter를 노출해야 하며, 네트워크 클라이언트, gateway listener, transport 런타임은 메인 extension entrypoint에 두세요.

런타임 entrypoint 필드는 source entrypoint 필드에 대한 패키지 경계 검사를 무시하지 않습니다. 예를 들어 `openclaw.runtimeExtensions`가 패키지 밖으로 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수는 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다. 임의의 깨진 config를 설치 가능하게 만들지 않습니다. 현재는 같은 번들 Plugin에 대한 누락된 번들 Plugin 경로나 같은 번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정한 오래된 번들 Plugin 업그레이드 실패에서만 설치 흐름이 복구할 수 있게 합니다. 관련 없는 config 오류는 여전히 설치를 차단하고 운영자에게 `openclaw doctor --fix`를 안내합니다.

`openclaw.channel.persistedAuthState`는 아주 작은 검사기 모듈을 위한 패키지 메타데이터입니다.

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

setup, doctor, configured-state 흐름이 전체 channel Plugin이 로드되기 전에 저렴한 yes/no auth probe를 필요로 할 때 이를 사용하세요. 대상 export는 저장된 상태만 읽는 작은 함수여야 하며, 전체 channel 런타임 barrel을 통해 라우팅하지 마세요.

`openclaw.channel.configuredState`는 저렴한 env 전용 configured 검사에 대해 같은 형태를 따릅니다.

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

channel이 env 또는 다른 작은 비런타임 입력만으로 configured-state를 판단할 수 있을 때 이를 사용하세요. 검사가 전체 config 해석 또는 실제 channel 런타임을 필요로 한다면, 그 로직은 Plugin `config.hasConfiguredState` hook에 두세요.

## 검색 우선순위 (중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적으로 config에서 선택된 경로)에서 Plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면, **가장 높은 우선순위**의 manifest만 유지되고 더 낮은 우선순위의 중복 항목은 함께 로드되지 않고 버려집니다.

우선순위(높은 순서부터):

1. **Config-selected** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **Bundled** — OpenClaw와 함께 제공되는 Plugin
3. **Global install** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **Workspace** — 현재 워크스페이스 기준으로 검색된 Plugin

의미:

- 워크스페이스에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 못합니다.
- 로컬 Plugin으로 번들 Plugin을 실제로 재정의하려면 워크스페이스 검색에 의존하지 말고 `plugins.entries.<id>`로 고정해 우선순위에서 이기도록 하세요.
- 중복으로 버려진 항목은 로그에 기록되므로 Doctor와 시작 diagnostics가 폐기된 복사본을 가리킬 수 있습니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 포함해야 하며**, config를 받지 않는 경우에도 예외가 아닙니다.
- 빈 schema도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- Schema는 런타임이 아니라 config 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 해당 channel ID가 Plugin manifest에 선언되어 있지 않으면 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 반드시 **검색 가능한** Plugin ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- Plugin이 설치되어 있지만 manifest 또는 schema가 깨졌거나 누락된 경우, 검증은 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin config가 존재하지만 Plugin이 **비활성화**된 경우, config는 유지되고 Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` schema는 [Configuration reference](/ko/gateway/configuration)를 참고하세요.

## 참고

- manifest는 로컬 파일 시스템 로드를 포함한 **기본 OpenClaw Plugin**에 대해 **필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, manifest는 검색 + 검증 전용입니다.
- 기본 manifest는 JSON5로 파싱되므로, 최종 값이 여전히 객체인 한 주석, trailing comma, 따옴표 없는 키를 사용할 수 있습니다.
- 문서화된 manifest 필드만 manifest loader가 읽습니다. 사용자 정의 최상위 키는 피하세요.
- `channels`, `providers`, `cliBackends`, `skills`는 Plugin에 필요하지 않다면 모두 생략할 수 있습니다.
- `providerDiscoveryEntry`는 경량으로 유지해야 하며 광범위한 런타임 코드를 import하지 않아야 합니다. 요청 시점 실행이 아니라 정적 provider 카탈로그 메타데이터나 좁은 범위의 discovery descriptor에 사용하세요.
- 배타적 Plugin kind는 `plugins.slots.*`를 통해 선택됩니다. `kind: "memory"`는 `plugins.slots.memory`로, `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다(기본값 `legacy`).
- env-var 메타데이터(`setup.providers[].envVars`, deprecated 상태의 `providerAuthEnvVars`, `channelEnvVars`)는 선언적 정보일 뿐입니다. status, audit, Cron 전달 검증 및 기타 읽기 전용 표면은 여전히 env var를 구성된 것으로 간주하기 전에 Plugin 신뢰 및 유효 활성화 정책을 적용합니다.
- provider 코드가 필요한 런타임 마법사 메타데이터는 [Provider runtime hooks](/ko/plugins/architecture-internals#provider-runtime-hooks)를 참고하세요.
- Plugin이 네이티브 모듈에 의존한다면 빌드 단계와 package-manager allowlist 요구 사항(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

<CardGroup cols={3}>
  <Card title="Plugin 빌드" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin 아키텍처" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처와 capability 모델.
  </Card>
  <Card title="SDK 개요" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 import.
  </Card>
</CardGroup>
