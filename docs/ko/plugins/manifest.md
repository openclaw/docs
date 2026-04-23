---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin config schema를 배포하거나 Plugin 검증 오류를 디버깅해야 합니다
summary: Plugin manifest + JSON schema 요구 사항(엄격한 config 검증)
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-23T14:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest (openclaw.plugin.json)

이 페이지는 **기본 OpenClaw Plugin manifest** 전용입니다.

호환되는 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참조하세요.

호환 번들 형식은 다른 manifest 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 manifest가 없는 기본 Claude component
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만,
여기서 설명하는 `openclaw.plugin.json` schema에 대해서는 검증하지 않습니다.

호환 번들의 경우 OpenClaw는 현재 레이아웃이
OpenClaw 런타임 기대 사항과 일치하면 번들 메타데이터, 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 기본 OpenClaw Plugin은 반드시
**Plugin 루트**에 `openclaw.plugin.json` 파일을 포함해야 합니다. OpenClaw는 이 manifest를 사용해
**Plugin 코드를 실행하지 않고도** 구성을 검증합니다. manifest가 없거나 유효하지 않으면
Plugin 오류로 처리되며 config 검증이 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
기본 capability 모델과 현재 외부 호환성 가이드는
[Capability model](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 Plugin 코드를 로드하기 전에 읽는
메타데이터입니다.

다음 용도로 사용하세요:

- Plugin ID
- config 검증
- Plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 auth 및 온보딩 메타데이터
- 제어 평면 표면이 런타임 로드 전에 검사할 수 있는 저비용 활성화 힌트
- 설정/온보딩 표면이 런타임 로드 전에 검사할 수 있는 저비용 설정 descriptor
- Plugin 런타임 로드 전에 해석되어야 하는 alias 및 자동 활성화 메타데이터
- 런타임 로드 전에 Plugin을 자동 활성화해야 하는 shorthand model-family 소유 메타데이터
- 번들 호환 wiring 및 계약 범위에 사용되는 정적 capability 소유 스냅샷
- 공유 `openclaw qa` 호스트가 Plugin 런타임 로드 전에 검사할 수 있는 저비용 QA runner 메타데이터
- 런타임 로드 없이 카탈로그 및 검증 표면에 병합되어야 하는 채널별 config 메타데이터
- config UI 힌트

다음 용도로는 사용하지 마세요:

- 런타임 동작 등록
- 코드 entrypoint 선언
- npm 설치 메타데이터

이들은 Plugin 코드와 `package.json`에 속합니다.

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

| 필드                                 | 필수 여부 | 타입                             | 의미                                                                                                                                                                                                                              |
| ------------------------------------ | --------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예        | `string`                         | 정식 Plugin ID입니다. 이 ID는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                                              |
| `configSchema`                       | 예        | `object`                         | 이 Plugin의 config를 위한 인라인 JSON Schema입니다.                                                                                                                                                                               |
| `enabledByDefault`                   | 아니요    | `true`                           | 번들 Plugin이 기본적으로 활성화됨을 표시합니다. 기본적으로 비활성 상태로 두려면 생략하거나 `true`가 아닌 값을 설정하세요.                                                                                                        |
| `legacyPluginIds`                    | 아니요    | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | 아니요    | `string[]`                       | auth, config, 또는 model ref에서 언급될 때 이 Plugin을 자동 활성화해야 하는 provider ID입니다.                                                                                                                                    |
| `kind`                               | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin 종류를 선언합니다.                                                                                                                                                                   |
| `channels`                           | 아니요    | `string[]`                       | 이 Plugin이 소유한 채널 ID입니다. 검색 및 config 검증에 사용됩니다.                                                                                                                                                               |
| `providers`                          | 아니요    | `string[]`                       | 이 Plugin이 소유한 provider ID입니다.                                                                                                                                                                                              |
| `modelSupport`                       | 아니요    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는 manifest 소유 shorthand model-family 메타데이터입니다.                                                                                                                             |
| `providerEndpoints`                  | 아니요    | `object[]`                       | provider 런타임이 로드되기 전에 core가 분류해야 하는 provider 경로용 manifest 소유 endpoint host/baseUrl 메타데이터입니다.                                                                                                       |
| `cliBackends`                        | 아니요    | `string[]`                       | 이 Plugin이 소유한 CLI 추론 backend ID입니다. 명시적 config ref에서 시작 시 자동 활성화에 사용됩니다.                                                                                                                            |
| `syntheticAuthRefs`                  | 아니요    | `string[]`                       | 런타임 로드 전에 콜드 model 검색 중 Plugin 소유 synthetic auth hook을 프로브해야 하는 provider 또는 CLI backend ref입니다.                                                                                                       |
| `nonSecretAuthMarkers`               | 아니요    | `string[]`                       | 비밀이 아닌 로컬, OAuth, 또는 ambient 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API key 값입니다.                                                                                                                   |
| `commandAliases`                     | 아니요    | `object[]`                       | 런타임 로드 전에 Plugin 인식 config 및 CLI 진단을 생성해야 하는 이 Plugin 소유 명령 이름입니다.                                                                                                                                  |
| `providerAuthEnvVars`                | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 provider auth env 메타데이터입니다.                                                                                                                               |
| `providerAuthAliases`                | 아니요    | `Record<string, string>`         | auth 조회를 위해 다른 provider ID를 재사용해야 하는 provider ID입니다. 예를 들어 기본 provider API key와 auth profile을 공유하는 coding provider가 이에 해당합니다.                                                             |
| `channelEnvVars`                     | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 채널 env 메타데이터입니다. env 기반 채널 설정 또는 일반적인 시작/config 도우미가 확인해야 하는 auth 표면에는 이것을 사용하세요.                                 |
| `providerAuthChoices`                | 아니요    | `object[]`                       | 온보딩 선택기, 선호 provider 해석, 단순 CLI 플래그 wiring을 위한 저비용 auth-choice 메타데이터입니다.                                                                                                                            |
| `activation`                         | 아니요    | `object`                         | provider, 명령, 채널, 경로, capability 트리거 로드를 위한 저비용 활성화 힌트입니다. 메타데이터 전용이며 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                                          |
| `setup`                              | 아니요    | `object`                         | 검색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 저비용 설정/온보딩 descriptor입니다.                                                                                                                          |
| `qaRunners`                          | 아니요    | `object[]`                       | Plugin 런타임 로드 전에 공유 `openclaw qa` 호스트가 사용하는 저비용 QA runner descriptor입니다.                                                                                                                                   |
| `contracts`                          | 아니요    | `object`                         | 외부 auth hook, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, tool 소유권을 위한 정적 번들 capability 스냅샷입니다.          |
| `mediaUnderstandingProviderMetadata` | 아니요    | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider ID에 대한 저비용 media-understanding 기본값입니다.                                                                                                                     |
| `channelConfigs`                     | 아니요    | `Record<string, object>`         | 런타임 로드 전에 검색 및 검증 표면에 병합되는 manifest 소유 채널 config 메타데이터입니다.                                                                                                                                         |
| `skills`                             | 아니요    | `string[]`                       | Plugin 루트를 기준으로 한 Skills 디렉터리입니다.                                                                                                                                                                                  |
| `name`                               | 아니요    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                             |
| `description`                        | 아니요    | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                                            |
| `version`                            | 아니요    | `string`                         | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                                                     |
| `uiHints`                            | 아니요    | `Record<string, object>`         | config 필드용 UI 레이블, placeholder, 민감도 힌트입니다.                                                                                                                                                                          |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 auth 선택지를 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드                  | 필수 여부 | 타입                                            | 의미                                                                                       |
| --------------------- | --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `provider`            | 예        | `string`                                        | 이 선택지가 속한 provider ID입니다.                                                        |
| `method`              | 예        | `string`                                        | 디스패치할 auth method ID입니다.                                                           |
| `choiceId`            | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 auth-choice ID입니다.                            |
| `choiceLabel`         | 아니요    | `string`                                        | 사용자에게 표시되는 레이블입니다. 생략하면 OpenClaw는 `choiceId`로 fallback합니다.         |
| `choiceHint`          | 아니요    | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                         |
| `assistantPriority`   | 아니요    | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                            |
| `assistantVisibility` | 아니요    | `"visible"` \| `"manual-only"`                  | assistant 선택기에서는 숨기되 수동 CLI 선택은 계속 허용합니다.                             |
| `deprecatedChoiceIds` | 아니요    | `string[]`                                      | 사용자를 이 대체 선택지로 리디렉션해야 하는 레거시 choice ID입니다.                        |
| `groupId`             | 아니요    | `string`                                        | 관련 선택지를 그룹화하기 위한 선택적 그룹 ID입니다.                                        |
| `groupLabel`          | 아니요    | `string`                                        | 해당 그룹의 사용자 표시용 레이블입니다.                                                    |
| `groupHint`           | 아니요    | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                           |
| `optionKey`           | 아니요    | `string`                                        | 단일 플래그 auth 흐름용 내부 옵션 키입니다.                                                |
| `cliFlag`             | 아니요    | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                         |
| `cliOption`           | 아니요    | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                |
| `cliDescription`      | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                          |
| `onboardingScopes`    | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택지가 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다. |

## commandAliases 참조

사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려는 런타임 명령 이름을
Plugin이 소유할 때 `commandAliases`를 사용하세요. OpenClaw는
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

| 필드         | 필수 여부 | 타입              | 의미                                                                       |
| ------------ | --------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속한 명령 이름입니다.                                          |
| `kind`       | 아니요    | `"runtime-slash"` | 이 alias가 루트 CLI 명령이 아니라 채팅 슬래시 명령임을 표시합니다.         |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우 CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.             |

## activation 참조

나중에 어떤 제어 평면 이벤트가 Plugin을 활성화해야 하는지
Plugin이 저비용으로 선언할 수 있을 때 `activation`을 사용하세요.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 runner를 제공할 때
`qaRunners`를 사용하세요. 이 메타데이터는 저비용이고 정적으로 유지하세요.
실제 CLI 등록은 여전히
`qaRunnerCliRegistrations`를 export하는 경량 `runtime-api.ts` 표면을 통해
Plugin 런타임이 소유합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "일회용 홈서버를 대상으로 Docker 기반 Matrix 라이브 QA 레인을 실행합니다"
    }
  ]
}
```

| 필드          | 필수 여부 | 타입     | 의미                                                                |
| ------------- | --------- | -------- | ------------------------------------------------------------------- |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.      |
| `description` | 아니요    | `string` | 공유 호스트가 stub 명령을 필요로 할 때 사용하는 fallback 도움말입니다. |

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry`, 또는 기타 런타임/Plugin entrypoint를
대체하지도 않습니다.
현재 소비자는 이를 더 넓은 Plugin 로드 전 좁히기 힌트로 사용하므로,
activation 메타데이터가 없으면 보통 성능 비용만 발생합니다. 레거시 manifest 소유 fallback이 여전히 존재하는 동안
정확성이 바뀌어서는 안 됩니다.

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

| 필드             | 필수 여부 | 타입                                                 | 의미                                                           |
| ---------------- | --------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `onProviders`    | 아니요    | `string[]`                                           | 요청 시 이 Plugin을 활성화해야 하는 provider ID입니다.         |
| `onCommands`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 명령 ID입니다.                     |
| `onChannels`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 채널 ID입니다.                     |
| `onRoutes`       | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 경로 종류입니다.                   |
| `onCapabilities` | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에 사용되는 광범위한 capability 힌트입니다. |

현재 라이브 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 fallback합니다
- 채널 트리거 설정/채널 계획은 명시적인 채널 activation 메타데이터가 없으면
  레거시 `channels[]` 소유권으로 fallback합니다
- provider 트리거 설정/런타임 계획은 명시적인 provider
  activation 메타데이터가 없으면 레거시 `providers[]` 및 최상위 `cliBackends[]`
  소유권으로 fallback합니다

## setup 참조

설정 및 온보딩 표면이 런타임 로드 전에 Plugin 소유 메타데이터를 저비용으로 필요로 할 때
`setup`을 사용하세요.

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
backend를 설명합니다. `setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는
제어 평면/설정 흐름을 위한 설정 전용 descriptor 표면입니다.

존재하는 경우 `setup.providers`와 `setup.cliBackends`는 설정 검색을 위한
선호되는 descriptor 우선 조회 표면입니다. descriptor가 Plugin 후보만
좁히고 설정에 여전히 더 풍부한 설정 시점 런타임 hook이 필요하다면
`requiresRuntime: true`를 설정하고 fallback 실행 경로로
`setup-api`를 유지하세요.

설정 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로,
정규화된 `setup.providers[].id` 및 `setup.cliBackends[]` 값은 검색된 Plugin 전반에서
고유해야 합니다. 소유권이 모호하면 검색 순서에서 승자를 고르는 대신 fail closed합니다.

### setup.providers 참조

| 필드          | 필수 여부 | 타입       | 의미                                                                                  |
| ------------- | --------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | 예        | `string`   | 설정 또는 온보딩 중 노출되는 provider ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요    | `string[]` | 전체 런타임 로드 없이 이 provider가 지원하는 설정/auth method ID입니다.              |
| `envVars`     | 아니요    | `string[]` | 일반적인 설정/상태 표면이 Plugin 런타임 로드 전에 확인할 수 있는 env var입니다.       |

### setup 필드

| 필드               | 필수 여부 | 타입       | 의미                                                                                              |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중 노출되는 provider 설정 descriptor입니다.                                        |
| `cliBackends`      | 아니요    | `string[]` | descriptor 우선 설정 조회에 사용되는 설정 시점 backend ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 표면이 소유한 config 마이그레이션 ID입니다.                                     |
| `requiresRuntime`  | 아니요    | `boolean`  | descriptor 조회 후에도 설정에 `setup-api` 실행이 필요한지 여부입니다.                             |

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

각 필드 힌트는 다음을 포함할 수 있습니다:

| 필드          | 타입       | 의미                                    |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 사용자에게 표시되는 필드 레이블입니다.   |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.               |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                   |
| `advanced`    | `boolean`  | 해당 필드를 고급 항목으로 표시합니다.   |
| `sensitive`   | `boolean`  | 해당 필드를 secret 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다.     |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고도 읽을 수 있는
정적 capability 소유 메타데이터에만 `contracts`를 사용하세요.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| 필드                             | 타입       | 의미                                                              |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 번들 Plugin이 factory를 등록할 수 있는 내장 런타임 ID입니다.      |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 외부 auth profile hook를 소유하는 provider ID입니다.  |
| `speechProviders`                | `string[]` | 이 Plugin이 소유한 speech provider ID입니다.                      |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유한 realtime-transcription provider ID입니다.      |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유한 realtime-voice provider ID입니다.              |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유한 media-understanding provider ID입니다.         |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유한 image-generation provider ID입니다.            |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유한 video-generation provider ID입니다.            |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유한 web-fetch provider ID입니다.                   |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유한 web-search provider ID입니다.                  |
| `tools`                          | `string[]` | 번들 계약 검사용으로 이 Plugin이 소유한 agent tool 이름입니다.    |

`resolveExternalAuthProfiles`를 구현하는 provider Plugin은
`contracts.externalAuthProviders`를 선언해야 합니다. 선언이 없는 Plugin도 여전히
더 이상 권장되지 않는 호환성 fallback을 통해 실행되지만, 그 fallback은 더 느리며
마이그레이션 기간 이후 제거될 예정입니다.

## mediaUnderstandingProviderMetadata 참조

media-understanding provider에
기본 model, 자동 auth fallback 우선순위, 또는 일반 core helper가 런타임 로드 전에 필요로 하는 기본 문서 지원이 있을 때
`mediaUnderstandingProviderMetadata`를 사용하세요.
키는 `contracts.mediaUnderstandingProviders`에도 선언되어 있어야 합니다.

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

| 필드                   | 타입                                | 의미                                                                          |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 provider가 노출하는 미디어 capability입니다.                               |
| `defaultModels`        | `Record<string, string>`            | config에 model이 지정되지 않았을 때 사용하는 capability별 기본 model입니다.   |
| `autoPriority`         | `Record<string, number>`            | 자동 자격 증명 기반 provider fallback에서 숫자가 낮을수록 먼저 정렬됩니다.    |
| `nativeDocumentInputs` | `"pdf"[]`                           | provider가 지원하는 기본 문서 입력입니다.                                     |

## channelConfigs 참조

채널 Plugin이 런타임 로드 전에 저비용 config 메타데이터를 필요로 할 때
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

각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드          | 타입                     | 의미                                                                                   |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON Schema입니다. 선언된 각 채널 config 항목에 필수입니다.          |
| `uiHints`     | `Record<string, object>` | 해당 채널 config 섹션용 선택적 UI 레이블/placeholder/민감도 힌트입니다.               |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 표면에 병합되는 채널 레이블입니다. |
| `description` | `string`                 | 검사 및 카탈로그 표면용 짧은 채널 설명입니다.                                          |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 Plugin ID입니다.        |

## modelSupport 참조

OpenClaw가 Plugin 런타임 로드 전에
`gpt-5.4` 또는 `claude-sonnet-4.6` 같은 shorthand model ID에서 provider Plugin을 추론해야 할 때
`modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적 `provider/model` ref는 소유 `providers` manifest 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 번들되지 않은
  Plugin이 우선합니다
- 남은 모호성은 사용자가 또는 config가 provider를 지정할 때까지 무시됩니다

필드:

| 필드            | 타입       | 의미                                                                                |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand model ID에 대해 `startsWith`로 일치시키는 접두사입니다.                  |
| `modelPatterns` | `string[]` | profile 접미사 제거 후 shorthand model ID에 대해 일치시키는 regex 소스입니다.      |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요.
일반 manifest 로드는 더 이상 이러한 최상위 필드를 capability
소유권으로 취급하지 않습니다.

## Manifest와 package.json 비교

두 파일은 서로 다른 역할을 합니다:

| 파일                   | 용도                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 검색, config 검증, auth-choice 메타데이터, Plugin 코드 실행 전에 반드시 존재해야 하는 UI 힌트                                  |
| `package.json`         | npm 메타데이터, 종속성 설치, 그리고 entrypoint, 설치 게이팅, 설정, 카탈로그 메타데이터에 사용되는 `openclaw` 블록            |

어떤 메타데이터를 어디에 넣어야 할지 확실하지 않다면 다음 규칙을 사용하세요:

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, entry 파일, 또는 npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json` 대신
`package.json`의 `openclaw` 블록에 있습니다.

중요한 예시:

| 필드                                                              | 의미                                                                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 기본 Plugin entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                         |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지용 빌드된 JavaScript 런타임 entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                            |
| `openclaw.setupEntry`                                             | 온보딩, 지연된 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중 사용되는 경량 설정 전용 entrypoint입니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                  |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지용 빌드된 JavaScript 설정 entrypoint를 선언합니다. 반드시 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                             |
| `openclaw.channel`                                                | 레이블, 문서 경로, alias, 선택 문구 같은 저비용 채널 카탈로그 메타데이터입니다.                                                                                                  |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env 전용 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state checker 메타데이터입니다.                                            |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 것이 있는가?"에 답할 수 있는 경량 persisted-auth checker 메타데이터입니다.                                                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 Plugin 및 외부 공개 Plugin용 설치/업데이트 힌트입니다.                                                                                                                      |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                      |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                   |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist integrity 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이 값과 대조해 검증합니다.                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | config가 유효하지 않을 때 제한적인 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 Plugin보다 먼저 설정 전용 채널 표면이 로드되도록 허용합니다.                                                                                                    |

manifest 메타데이터는 런타임 로드 전에 온보딩에서 어떤 provider/채널/설정 선택지가
표시될지를 결정합니다. `package.json#openclaw.install`은 사용자가 이러한 선택지 중 하나를 고를 때
온보딩에 해당 Plugin을 어떻게 가져오거나 활성화할지 알려줍니다.
설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 및 manifest
레지스트리 로딩 중에 강제됩니다. 유효하지 않은 값은 거부되며, 더 최신이지만 유효한 값은 오래된 호스트에서 Plugin을 건너뜁니다.

정확한 npm 버전 pinning은 이미 `npmSpec`에 존재합니다. 예:
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. 가져온
npm 아티팩트가 더 이상 고정된 릴리스와 일치하지 않을 때 업데이트 흐름이 fail closed되길 원한다면
`expectedIntegrity`와 함께 사용하세요. 대화형 온보딩은
패키지 이름만 있는 형식과 dist-tag를 포함해 신뢰된 레지스트리 npm spec을 제공합니다.
`expectedIntegrity`가 있으면 설치/업데이트 흐름이 이를 강제하고, 없으면
무결성 pin 없이 레지스트리 해석 결과가 기록됩니다.

채널 Plugin은 상태, 채널 목록,
또는 SecretRef 스캔이 전체 런타임을 로드하지 않고도 구성된 계정을 식별해야 하는 경우 `openclaw.setupEntry`를 제공해야 합니다.
setup entry는 채널 메타데이터와 setup-safe config,
상태, secret adapter를 노출해야 합니다. 네트워크 클라이언트, Gateway listener,
전송 런타임은 메인 extension entrypoint에 두세요.

런타임 entrypoint 필드는 소스
entrypoint 필드의 패키지 경계 검사를 재정의하지 않습니다.
예를 들어 `openclaw.runtimeExtensions`는
경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다.
임의의 깨진 config를 설치 가능하게 만들지는 않습니다. 현재는 누락된 번들 Plugin 경로나,
동일한 번들 Plugin에 대한 오래된 `channels.<id>` 항목처럼 특정 오래된 번들 Plugin 업그레이드 실패에서만
설치 흐름 복구를 허용합니다. 관련 없는 config 오류는 여전히 설치를 차단하고 운영자를
`openclaw doctor --fix`로 보냅니다.

`openclaw.channel.persistedAuthState`는 작은 checker
모듈을 위한 패키지 메타데이터입니다:

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

설정, doctor, 또는 configured-state 흐름이 전체 채널 Plugin 로드 전에
저비용 예/아니오 auth 프로브를 필요로 할 때 사용하세요.
대상 export는 저장된 상태만 읽는 작은 함수여야 합니다. 이를 전체
채널 런타임 barrel을 통해 연결하지 마세요.

`openclaw.channel.configuredState`는 저비용 env 전용
구성 상태 검사에 대해 동일한 형태를 따릅니다:

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

채널이 env 또는 기타 작은
비런타임 입력만으로 구성 상태에 답할 수 있을 때 사용하세요. 검사가 전체 config 해석이나 실제
채널 런타임을 필요로 한다면 그 로직은 대신 Plugin `config.hasConfiguredState`
hook에 두세요.

## 검색 우선순위(중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, workspace, 명시적으로 config에서 선택된 경로)에서 Plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면 **가장 높은 우선순위**의 manifest만 유지되고, 더 낮은 우선순위의 중복 항목은 함께 로드되지 않고 제거됩니다.

우선순위, 높은 순서부터 낮은 순서까지:

1. **Config-selected** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **Bundled** — OpenClaw와 함께 제공되는 Plugin
3. **Global install** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **Workspace** — 현재 workspace 기준으로 검색된 Plugin

의미:

- workspace에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가릴 수 없습니다.
- 번들 Plugin을 실제로 로컬 Plugin으로 재정의하려면 workspace 검색에 의존하지 말고 `plugins.entries.<id>`를 통해 고정하여 우선순위로 이기게 하세요.
- 중복 제거는 로그에 기록되므로 Doctor 및 시작 진단이 제거된 복사본을 가리킬 수 있습니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 반드시 포함해야 합니다**, config를 전혀 받지 않더라도 마찬가지입니다.
- 빈 schema도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- schema는 런타임이 아니라 config 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 해당 채널 ID가
  Plugin manifest에 선언된 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** Plugin ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- Plugin이 설치되어 있지만 manifest나 schema가 깨졌거나 없으면,
  검증은 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin config가 존재하지만 Plugin이 **비활성화**된 경우, config는 유지되며
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` schema는 [Configuration reference](/ko/gateway/configuration)를 참조하세요.

## 참고

- manifest는 로컬 파일시스템 로드를 포함해 **기본 OpenClaw Plugin에 필수**입니다.
- 런타임은 여전히 Plugin 모듈을 별도로 로드합니다. manifest는
  검색 + 검증 전용입니다.
- 기본 manifest는 JSON5로 파싱되므로, 최종 값이 여전히 객체라면
  주석, 후행 쉼표, 따옴표 없는 키가 허용됩니다.
- manifest 로더는 문서화된 manifest 필드만 읽습니다. 여기에
  사용자 지정 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 auth 프로브, env-marker
  검증, 그리고 env 이름을 검사하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사한 provider auth 표면을 위한 저비용 메타데이터 경로입니다.
- `providerAuthAliases`는 provider 변형이 다른 provider의 auth
  env var, auth profile, config 기반 auth, API-key 온보딩 선택지를
  core에 그 관계를 하드코딩하지 않고 재사용할 수 있게 합니다.
- `providerEndpoints`는 provider Plugin이 단순 endpoint host/baseUrl
  일치 메타데이터를 소유할 수 있게 합니다. core가 이미 지원하는 endpoint class에만 이를 사용하세요.
  런타임 동작은 여전히 Plugin이 소유합니다.
- `syntheticAuthRefs`는 런타임
  레지스트리가 존재하기 전에 콜드 model 검색에서 보여야 하는 provider 소유 synthetic
  auth hook을 위한 저비용 메타데이터 경로입니다. 런타임 provider 또는 CLI backend가 실제로
  `resolveSyntheticAuth`를 구현하는 ref만 나열하세요.
- `nonSecretAuthMarkers`는 로컬, OAuth, 또는 ambient credential marker와 같은
  번들 Plugin 소유 placeholder API key를 위한 저비용 메타데이터 경로입니다.
  Core는 이를 소유 provider를 하드코딩하지 않고 auth 표시와 secret 감사에서
  비밀이 아닌 값으로 취급합니다.
- `channelEnvVars`는 셸 env fallback, setup
  프롬프트, 그리고 env 이름을 검사하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사한 채널 표면을 위한 저비용 메타데이터 경로입니다.
  env 이름은 메타데이터이지, 그 자체로 활성화는 아닙니다. 상태, 감사, Cron 전송 검증, 기타 읽기 전용
  표면은 env var를 구성된 채널로 취급하기 전에 여전히 Plugin 신뢰 및 유효 활성화 정책을 적용합니다.
- `providerAuthChoices`는 auth-choice 선택기,
  `--auth-choice` 해석, 선호 provider 매핑, provider 런타임 로드 전의 단순 온보딩
  CLI 플래그 등록을 위한 저비용 메타데이터 경로입니다. provider 코드가 필요한 런타임 wizard
  메타데이터는
  [Provider runtime hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`
    (기본값: 내장 `legacy`)로 선택됩니다.
- Plugin에 필요하지 않다면 `channels`, `providers`, `cliBackends`, `skills`는
  생략할 수 있습니다.
- Plugin이 기본 모듈에 의존한다면 빌드 단계와
  패키지 관리자 allowlist 요구 사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련

- [Building Plugins](/ko/plugins/building-plugins) — Plugin 시작하기
- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처
- [SDK Overview](/ko/plugins/sdk-overview) — Plugin SDK 참조
