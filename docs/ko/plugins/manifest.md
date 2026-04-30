---
read_when:
    - OpenClaw Plugin을 개발하고 있습니다
    - Plugin 구성 스키마를 제공하거나 Plugin 유효성 검사 오류를 디버그해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-30T06:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

이 페이지는 **네이티브 OpenClaw Plugin 매니페스트** 전용입니다.

호환 가능한 번들 레이아웃은 [Plugin 번들](/ko/plugins/bundles)을 참조하세요.

호환 가능한 번들 형식은 서로 다른 매니페스트 파일을 사용합니다.

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는 `openclaw.plugin.json` 스키마에
대해 검증하지는 않습니다.

호환 가능한 번들의 경우, 현재 OpenClaw는 레이아웃이 OpenClaw 런타임 기대 사항과 일치할 때 번들 메타데이터와 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 지원되는 훅 팩을 읽습니다.

모든 네이티브 OpenClaw Plugin은 **Plugin 루트**에 `openclaw.plugin.json` 파일을 반드시 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 **Plugin 코드를 실행하지 않고** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면
Plugin 오류로 처리되며 구성 검증이 차단됩니다.

전체 Plugin 시스템 가이드를 참조하세요: [Plugins](/ko/tools/plugin).
네이티브 기능 모델과 현재 외부 호환성 지침은 다음을 참조하세요:
[기능 모델](/ko/plugins/architecture#public-capability-model).

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에** 읽는 메타데이터입니다. 아래의 모든 항목은
Plugin 런타임을 시작하지 않고도 검사할 수 있을 만큼 가벼워야 합니다.

**다음에 사용하세요:**

- Plugin ID, 구성 검증, 구성 UI 힌트
- 인증, 온보딩, 설정 메타데이터(별칭, 자동 활성화, 공급자 환경 변수, 인증 선택지)
- 컨트롤 플레인 화면을 위한 활성화 힌트
- 모델 패밀리 소유권 약칭
- 정적 기능 소유권 스냅샷(`contracts`)
- 공유 `openclaw qa` 호스트가 검사할 수 있는 QA 러너 메타데이터
- 카탈로그와 검증 화면에 병합되는 채널별 구성 메타데이터

**다음에는 사용하지 마세요:** 런타임 동작 등록, 코드 엔트리포인트 선언,
또는 npm 설치 메타데이터. 이러한 항목은 Plugin 코드와 `package.json`에 속합니다.

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

| 필드                                 | 필수     | 타입                             | 의미                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예       | `string`                         | 정식 Plugin ID입니다. `plugins.entries.<id>`에서 사용되는 ID입니다.                                                                                                                                                                    |
| `configSchema`                       | 예       | `object`                         | 이 Plugin 구성에 대한 인라인 JSON Schema입니다.                                                                                                                                                                                        |
| `enabledByDefault`                   | 아니요   | `true`                           | 번들 Plugin을 기본적으로 활성화된 상태로 표시합니다. 생략하거나 `true`가 아닌 값을 설정하면 Plugin은 기본적으로 비활성화된 상태로 둡니다.                                                                                              |
| `legacyPluginIds`                    | 아니요   | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | 아니요   | `string[]`                       | 인증, 구성 또는 모델 참조가 해당 provider를 언급할 때 이 Plugin을 자동 활성화해야 하는 provider ID입니다.                                                                                                                              |
| `kind`                               | 아니요   | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용하는 독점 Plugin 종류를 선언합니다.                                                                                                                                                                          |
| `channels`                           | 아니요   | `string[]`                       | 이 Plugin이 소유하는 채널 ID입니다. 탐색 및 구성 검증에 사용됩니다.                                                                                                                                                                    |
| `providers`                          | 아니요   | `string[]`                       | 이 Plugin이 소유하는 provider ID입니다.                                                                                                                                                                                               |
| `providerDiscoveryEntry`             | 아니요   | `string`                         | 전체 Plugin 런타임을 활성화하지 않고 로드할 수 있는 매니페스트 범위 provider 카탈로그 메타데이터를 위한, Plugin 루트를 기준으로 한 경량 provider 탐색 모듈 경로입니다.                                                                |
| `modelSupport`                       | 아니요   | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는, 매니페스트가 소유한 모델 계열 약식 메타데이터입니다.                                                                                                                                   |
| `modelCatalog`                       | 아니요   | `object`                         | 이 Plugin이 소유한 provider의 선언적 모델 카탈로그 메타데이터입니다. Plugin 런타임을 로드하지 않고 향후 읽기 전용 목록, 온보딩, 모델 선택기, 별칭, 억제를 지원하기 위한 컨트롤 플레인 계약입니다.                                  |
| `modelPricing`                       | 아니요   | `object`                         | provider가 소유하는 외부 가격 조회 정책입니다. 이를 사용해 로컬/자체 호스팅 provider를 원격 가격 카탈로그에서 제외하거나, core에 provider ID를 하드코딩하지 않고 provider 참조를 OpenRouter/LiteLLM 카탈로그 ID에 매핑합니다.      |
| `modelIdNormalization`               | 아니요   | `object`                         | provider 런타임이 로드되기 전에 실행되어야 하는, provider가 소유한 모델 ID 별칭/접두사 정리입니다.                                                                                                                                     |
| `providerEndpoints`                  | 아니요   | `object[]`                       | provider 런타임이 로드되기 전에 core가 분류해야 하는 provider 경로의, 매니페스트가 소유한 엔드포인트 host/baseUrl 메타데이터입니다.                                                                                                    |
| `providerRequest`                    | 아니요   | `object`                         | provider 런타임이 로드되기 전에 일반 요청 정책에서 사용하는 저비용 provider 계열 및 요청 호환성 메타데이터입니다.                                                                                                                     |
| `cliBackends`                        | 아니요   | `string[]`                       | 이 Plugin이 소유한 CLI 추론 백엔드 ID입니다. 명시적 구성 참조에서 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                                              |
| `syntheticAuthRefs`                  | 아니요   | `string[]`                       | 런타임이 로드되기 전 콜드 모델 탐색 중에 Plugin 소유 합성 인증 훅을 조사해야 하는 provider 또는 CLI 백엔드 참조입니다.                                                                                                                |
| `nonSecretAuthMarkers`               | 아니요   | `string[]`                       | 비밀이 아닌 로컬, OAuth 또는 주변 자격 증명 상태를 나타내는 번들 Plugin 소유 플레이스홀더 API 키 값입니다.                                                                                                                            |
| `commandAliases`                     | 아니요   | `object[]`                       | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는, 이 Plugin이 소유한 명령 이름입니다.                                                                                                                              |
| `providerAuthEnvVars`                | 아니요   | `Record<string, string[]>`       | provider 인증/상태 조회를 위한 더 이상 사용되지 않는 호환성 환경 메타데이터입니다. 새 Plugin에는 `setup.providers[].envVars`를 선호하세요. OpenClaw는 지원 중단 기간 동안 이를 계속 읽습니다.                                         |
| `providerAuthAliases`                | 아니요   | `Record<string, string>`         | 인증 조회에 다른 provider ID를 재사용해야 하는 provider ID입니다. 예를 들어 기본 provider API 키와 인증 프로필을 공유하는 코딩 provider가 있습니다.                                                                                   |
| `channelEnvVars`                     | 아니요   | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고 검사할 수 있는 저비용 채널 환경 메타데이터입니다. 일반 시작/구성 헬퍼가 확인해야 하는 환경 기반 채널 설정 또는 인증 표면에 이를 사용하세요.                                                    |
| `providerAuthChoices`                | 아니요   | `object[]`                       | 온보딩 선택기, 선호 provider 해석, 간단한 CLI 플래그 연결에 사용되는 저비용 인증 선택 메타데이터입니다.                                                                                                                               |
| `activation`                         | 아니요   | `object`                         | 시작, provider, 명령, 채널, 경로, capability 트리거 로딩을 위한 저비용 활성화 플래너 메타데이터입니다. 메타데이터 전용이며, 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                            |
| `setup`                              | 아니요   | `object`                         | 탐색 및 설정 표면이 Plugin 런타임을 로드하지 않고 검사할 수 있는 저비용 설정/온보딩 설명자입니다.                                                                                                                                     |
| `qaRunners`                          | 아니요   | `object[]`                       | Plugin 런타임이 로드되기 전에 공유 `openclaw qa` 호스트가 사용하는 저비용 QA 러너 설명자입니다.                                                                                                                                        |
| `contracts`                          | 아니요   | `object`                         | 외부 인증 훅, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 음악 생성, 비디오 생성, 웹 가져오기, 웹 검색, 도구 소유권에 대한 정적 번들 capability 스냅샷입니다.                                                          |
| `mediaUnderstandingProviderMetadata` | 아니요   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider ID의 저비용 미디어 이해 기본값입니다.                                                                                                                                       |
| `channelConfigs`                     | 아니요   | `Record<string, object>`         | 런타임이 로드되기 전에 탐색 및 검증 표면에 병합되는, 매니페스트가 소유한 채널 구성 메타데이터입니다.                                                                                                                                  |
| `skills`                             | 아니요   | `string[]`                       | Plugin 루트를 기준으로 로드할 Skill 디렉터리입니다.                                                                                                                                                                                   |
| `name`                               | 아니요   | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                               |
| `description`                        | 아니요   | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                                             |
| `version`                            | 아니요   | `string`                         | 정보용 Plugin 버전입니다.                                                                                                                                                                                                           |
| `uiHints`                            | 아니요   | `Record<string, object>`         | 구성 필드에 대한 UI 레이블, 플레이스홀더, 민감도 힌트입니다.                                                                                                                                                                         |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.
provider 설정 목록은 provider 런타임을 로드하지 않고 이러한 매니페스트 선택, 설명자에서 파생된 설정
선택, 설치 카탈로그 메타데이터를 사용합니다.

| 필드                  | 필수 여부 | 유형                                            | 의미                                                                                                     |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 예       | `string`                                        | 이 선택지가 속한 Provider id.                                                                            |
| `method`              | 예       | `string`                                        | 디스패치할 인증 메서드 id.                                                                               |
| `choiceId`            | 예       | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 id.                                                   |
| `choiceLabel`         | 아니요   | `string`                                        | 사용자에게 표시되는 레이블. 생략하면 OpenClaw는 `choiceId`를 사용합니다.                                 |
| `choiceHint`          | 아니요   | `string`                                        | 선택기에 표시되는 짧은 도움말 텍스트.                                                                    |
| `assistantPriority`   | 아니요   | `number`                                        | 값이 낮을수록 어시스턴트 주도 대화형 선택기에서 더 먼저 정렬됩니다.                                      |
| `assistantVisibility` | 아니요   | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 허용하면서 어시스턴트 선택기에서는 이 선택지를 숨깁니다.                                 |
| `deprecatedChoiceIds` | 아니요   | `string[]`                                      | 사용자를 이 대체 선택지로 리디렉션해야 하는 레거시 선택 id.                                              |
| `groupId`             | 아니요   | `string`                                        | 관련 선택지를 그룹화하기 위한 선택적 그룹 id.                                                            |
| `groupLabel`          | 아니요   | `string`                                        | 해당 그룹에 대해 사용자에게 표시되는 레이블.                                                             |
| `groupHint`           | 아니요   | `string`                                        | 그룹에 대한 짧은 도움말 텍스트.                                                                          |
| `optionKey`           | 아니요   | `string`                                        | 단순한 단일 플래그 인증 흐름을 위한 내부 옵션 키.                                                        |
| `cliFlag`             | 아니요   | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름.                                                             |
| `cliOption`           | 아니요   | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태.                                                    |
| `cliDescription`      | 아니요   | `string`                                        | CLI 도움말에 사용되는 설명.                                                                              |
| `onboardingScopes`    | 아니요   | `Array<"text-inference" \| "image-generation">` | 이 선택지가 표시되어야 하는 온보딩 표면. 생략하면 기본값은 `["text-inference"]`입니다.                   |

## commandAliases 참조

사용자가 `plugins.allow`에 잘못 넣거나 루트 CLI 명령으로 실행하려 할 수 있는
런타임 명령 이름을 Plugin이 소유할 때 `commandAliases`를 사용합니다. OpenClaw는
Plugin 런타임 코드를 가져오지 않고도 진단에 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 유형              | 의미                                                                  |
| ------------ | -------- | ----------------- | --------------------------------------------------------------------- |
| `name`       | 예       | `string`          | 이 Plugin에 속한 명령 이름.                                           |
| `kind`       | 아니요   | `"runtime-slash"` | 별칭을 루트 CLI 명령이 아니라 채팅 슬래시 명령으로 표시합니다.        |
| `cliCommand` | 아니요   | `string`          | CLI 작업에 제안할 관련 루트 CLI 명령이 있는 경우 해당 명령입니다.     |

## activation 참조

Plugin이 어떤 제어 평면 이벤트에서 활성화/로드 계획에 포함되어야 하는지
저렴하게 선언할 수 있을 때 `activation`을 사용합니다.

이 블록은 수명 주기 API가 아니라 플래너 메타데이터입니다. 런타임 동작을
등록하지 않고, `register(...)`를 대체하지 않으며, Plugin 코드가 이미
실행되었음을 보장하지 않습니다. 활성화 플래너는 기존 매니페스트 소유권
메타데이터인 `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, 훅으로 폴백하기 전에 이 필드를 사용해 후보 Plugin을 좁힙니다.

소유권을 이미 설명하는 가장 좁은 메타데이터를 선호하세요. 해당 필드가 관계를
표현한다면 `providers`, `channels`, `commandAliases`, 설정 설명자 또는
`contracts`를 사용하세요. 이러한 소유권 필드로 표현할 수 없는 추가 플래너
힌트에는 `activation`을 사용하세요.
`claude-cli`, `codex-cli`, `google-gemini-cli` 같은 CLI 런타임 별칭에는
최상위 `cliBackends`를 사용하세요. `activation.onAgentHarnesses`는
소유권 필드가 아직 없는 임베디드 에이전트 하네스 id에만 사용합니다.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry` 또는 기타 런타임/Plugin 진입점을 대체하지
않습니다. 현재 소비자는 더 넓은 Plugin 로딩 전에 이를 좁히기 힌트로 사용하므로,
활성화 메타데이터가 없으면 일반적으로 성능 비용만 발생합니다. 레거시 매니페스트
소유권 폴백이 아직 존재하는 동안에는 정확성이 바뀌지 않아야 합니다.

OpenClaw가 암시적 시작 가져오기에서 벗어나면서 모든 Plugin은
`activation.onStartup`을 의도적으로 설정해야 합니다. Plugin이 Gateway 시작
중에 반드시 실행되어야 하는 경우에만 `true`로 설정하세요. Plugin이 시작 시
비활성 상태이고 더 좁은 트리거에서만 로드되어야 한다면 `false`로 설정하세요.
`onStartup`을 생략하면 정적 기능 메타데이터가 없는 Plugin에 대해 지원 중단된
레거시 암시적 시작 사이드카 폴백이 유지됩니다. 향후 버전에서는 해당 Plugin이
`activation.onStartup: true`를 선언하지 않는 한 시작 시 로드를 중단할 수
있습니다. Plugin 상태 및 호환성 보고서는 Plugin이 여전히 해당 폴백에 의존할 때
`legacy-implicit-startup-sidecar`로 경고합니다.

마이그레이션 테스트의 경우, 지원 중단된 해당 폴백만 비활성화하려면
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`을 설정하세요. 이 옵트인
모드는 명시적인 `activation.onStartup: true` Plugin 또는 채널, 구성,
에이전트 하네스, 메모리, 기타 더 좁은 활성화 트리거로 로드되는 Plugin을
차단하지 않습니다.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 필드               | 필수 여부 | 유형                                                 | 의미                                                                                                                                                                                                                   |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 아니요   | `boolean`                                            | 명시적 Gateway 시작 활성화입니다. 모든 Plugin이 이를 설정해야 합니다. `true`는 시작 중에 Plugin을 가져오고, `false`는 다른 일치 트리거가 로드를 요구하지 않는 한 지원 중단된 암시적 사이드카 시작 폴백을 거부합니다. |
| `onProviders`      | 아니요   | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 Provider id.                                                                                                                                                              |
| `onAgentHarnesses` | 아니요   | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 임베디드 에이전트 하네스 런타임 id. CLI 백엔드 별칭에는 최상위 `cliBackends`를 사용하세요.                                                                                |
| `onCommands`       | 아니요   | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 명령 id.                                                                                                                                                                  |
| `onChannels`       | 아니요   | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 채널 id.                                                                                                                                                                  |
| `onRoutes`         | 아니요   | `string[]`                                           | 이 Plugin을 활성화/로드 계획에 포함해야 하는 라우트 종류.                                                                                                                                                              |
| `onConfigPaths`    | 아니요   | `string[]`                                           | 경로가 존재하고 명시적으로 비활성화되지 않은 경우 이 Plugin을 시작/로드 계획에 포함해야 하는 루트 기준 구성 경로.                                                                                                     |
| `onCapabilities`   | 아니요   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에서 사용하는 넓은 기능 힌트. 가능하면 더 좁은 필드를 선호하세요.                                                                                                                                 |

현재 라이브 소비자:

- Gateway 시작 계획은 명시적 시작 가져오기와 지원 중단된 암시적 사이드카 시작
  폴백 거부에 `activation.onStartup`을 사용합니다.
- 명령으로 트리거된 CLI 계획은 레거시 `commandAliases[].cliCommand` 또는
  `commandAliases[].name`으로 폴백합니다.
- 에이전트 런타임 시작 계획은 임베디드 하네스에는 `activation.onAgentHarnesses`를,
  CLI 런타임 별칭에는 최상위 `cliBackends[]`를 사용합니다.
- 채널로 트리거된 설정/채널 계획은 명시적 채널 활성화 메타데이터가 없을 때
  레거시 `channels[]` 소유권으로 폴백합니다.
- 시작 Plugin 계획은 번들 브라우저 Plugin의 `browser` 블록 같은 비채널 루트
  구성 표면에 `activation.onConfigPaths`를 사용합니다.
- Provider로 트리거된 설정/런타임 계획은 명시적 Provider 활성화 메타데이터가
  없을 때 레거시 `providers[]` 및 최상위 `cliBackends[]` 소유권으로 폴백합니다.

플래너 진단은 명시적 활성화 힌트와 매니페스트 소유권 폴백을 구분할 수 있습니다.
예를 들어 `activation-command-hint`는 `activation.onCommands`가 일치했음을
의미하고, `manifest-command-alias`는 플래너가 대신 `commandAliases` 소유권을
사용했음을 의미합니다. 이러한 이유 레이블은 호스트 진단과 테스트를 위한 것이며,
Plugin 작성자는 소유권을 가장 잘 설명하는 메타데이터를 계속 선언해야 합니다.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 러너를 제공할 때
`qaRunners`를 사용합니다. 이 메타데이터는 저렴하고 정적으로 유지하세요. 실제
CLI 등록은 여전히 `qaRunnerCliRegistrations`를 내보내는 가벼운
`runtime-api.ts` 표면을 통해 Plugin 런타임이 소유합니다.

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

| 필드          | 필수 여부 | 타입     | 의미                                                               |
| ------------- | --------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.     |
| `description` | 아니요    | `string` | 공유 호스트에 스텁 명령이 필요할 때 사용하는 대체 도움말 텍스트입니다. |

## setup 참조

런타임이 로드되기 전에 설정 및 온보딩 화면에 저렴한 Plugin 소유 메타데이터가
필요한 경우 `setup`을 사용하세요.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

최상위 `cliBackends`는 계속 유효하며 CLI 추론 백엔드를 계속 설명합니다.
`setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는 컨트롤 플레인/설정
흐름을 위한 설정 전용 설명자 화면입니다.

존재하는 경우 `setup.providers`와 `setup.cliBackends`는 설정 탐색을 위한 기본
설명자 우선 조회 화면입니다. 설명자가 후보 Plugin만 좁히고 설정에 더 풍부한
설정 시점 런타임 훅이 여전히 필요하다면, `requiresRuntime: true`를 설정하고
대체 실행 경로로 `setup-api`를 유지하세요.

OpenClaw는 일반 공급자 인증 및 환경 변수 조회에도 `setup.providers[].envVars`를
포함합니다. `providerAuthEnvVars`는 지원 중단 기간 동안 호환성 어댑터를 통해 계속
지원되지만, 이를 계속 사용하는 번들 외 Plugin은 매니페스트 진단을 받습니다. 새
Plugin은 설정/상태 환경 메타데이터를 `setup.providers[].envVars`에 넣어야 합니다.

OpenClaw는 설정 항목이 없거나 `setup.requiresRuntime: false`가 설정 런타임이
불필요하다고 선언하는 경우, `setup.providers[].authMethods`에서 간단한 설정 선택지도
파생할 수 있습니다. 사용자 지정 레이블, CLI 플래그, 온보딩 범위, 어시스턴트
메타데이터에는 명시적 `providerAuthChoices` 항목이 계속 우선됩니다.

해당 설명자만으로 설정 화면에 충분한 경우에만 `requiresRuntime: false`를 설정하세요.
OpenClaw는 명시적 `false`를 설명자 전용 계약으로 취급하며 설정 조회를 위해
`setup-api` 또는 `openclaw.setupEntry`를 실행하지 않습니다. 설명자 전용 Plugin이
이러한 설정 런타임 항목 중 하나를 여전히 제공하는 경우, OpenClaw는 추가 진단을
보고하고 계속 무시합니다. `requiresRuntime`을 생략하면 기존 대체 동작이 유지되므로
플래그 없이 설명자를 추가한 기존 Plugin이 깨지지 않습니다.

설정 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로, 정규화된
`setup.providers[].id` 및 `setup.cliBackends[]` 값은 탐색된 Plugin 전반에서 고유하게
유지되어야 합니다. 소유권이 모호하면 탐색 순서에서 승자를 고르는 대신 닫힌 상태로
실패합니다.

설정 런타임이 실행되는 경우, `setup-api`가 매니페스트 설명자가 선언하지 않은 공급자나
CLI 백엔드를 등록하거나, 설명자에 일치하는 런타임 등록이 없는 경우 설정 레지스트리
진단이 설명자 불일치를 보고합니다. 이러한 진단은 추가적인 것이며 레거시 Plugin을
거부하지 않습니다.

### setup.providers 참조

| 필드           | 필수 여부 | 타입       | 의미                                                                                         |
| -------------- | --------- | ---------- | -------------------------------------------------------------------------------------------- |
| `id`           | 예        | `string`   | 설정 또는 온보딩 중 노출되는 공급자 ID입니다. 정규화된 ID를 전역적으로 고유하게 유지하세요. |
| `authMethods`  | 아니요    | `string[]` | 전체 런타임을 로드하지 않고 이 공급자가 지원하는 설정/인증 방식 ID입니다.                   |
| `envVars`      | 아니요    | `string[]` | Plugin 런타임이 로드되기 전에 일반 설정/상태 화면이 확인할 수 있는 환경 변수입니다.         |
| `authEvidence` | 아니요    | `object[]` | 비밀이 아닌 표시자를 통해 인증할 수 있는 공급자를 위한 저렴한 로컬 인증 증거 검사입니다.    |

`authEvidence`는 런타임 코드를 로드하지 않고 검증할 수 있는 공급자 소유 로컬 자격 증명
표시자를 위한 것입니다. 이러한 검사는 저렴하고 로컬이어야 합니다. 네트워크 호출,
키체인 또는 비밀 관리자 읽기, 셸 명령, 공급자 API 프로브는 허용되지 않습니다.

지원되는 증거 항목:

| 필드               | 필수 여부 | 타입       | 의미                                                                                                  |
| ------------------ | --------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `type`             | 예        | `string`   | 현재 `local-file-with-env`입니다.                                                                     |
| `fileEnvVar`       | 아니요    | `string`   | 명시적 자격 증명 파일 경로를 포함하는 환경 변수입니다.                                                |
| `fallbackPaths`    | 아니요    | `string[]` | `fileEnvVar`가 없거나 비어 있을 때 확인하는 로컬 자격 증명 파일 경로입니다. `${HOME}` 및 `${APPDATA}`를 지원합니다. |
| `requiresAnyEnv`   | 아니요    | `string[]` | 증거가 유효하려면 나열된 환경 변수 중 하나 이상이 비어 있지 않아야 합니다.                           |
| `requiresAllEnv`   | 아니요    | `string[]` | 증거가 유효하려면 나열된 모든 환경 변수가 비어 있지 않아야 합니다.                                   |
| `credentialMarker` | 예        | `string`   | 증거가 존재할 때 반환되는 비밀이 아닌 표시자입니다.                                                   |
| `source`           | 아니요    | `string`   | 인증/상태 출력용 사용자 표시 소스 레이블입니다.                                                       |

### setup 필드

| 필드               | 필수 여부 | 타입       | 의미                                                                                              |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중 노출되는 공급자 설정 설명자입니다.                                             |
| `cliBackends`      | 아니요    | `string[]` | 설명자 우선 설정 조회에 사용되는 설정 시점 백엔드 ID입니다. 정규화된 ID를 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 화면이 소유하는 구성 마이그레이션 ID입니다.                                     |
| `requiresRuntime`  | 아니요    | `boolean`  | 설명자 조회 후 설정에 여전히 `setup-api` 실행이 필요한지 여부입니다.                             |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로 매핑하는 맵입니다.

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

각 필드 힌트에는 다음이 포함될 수 있습니다.

| 필드          | 타입       | 의미                              |
| ------------- | ---------- | --------------------------------- |
| `label`       | `string`   | 사용자 표시 필드 레이블입니다.    |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.         |
| `tags`        | `string[]` | 선택적 UI 태그입니다.             |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.  |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string`   | 양식 입력용 자리표시자 텍스트입니다. |

## contracts 참조

OpenClaw가 Plugin 런타임을 가져오지 않고 읽을 수 있는 정적 기능 소유권 메타데이터에만
`contracts`를 사용하세요.

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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

각 목록은 선택 사항입니다.

| 필드                             | 타입       | 의미                                                                 |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex 앱 서버 extension 팩터리 ID입니다. 현재 `codex-app-server`입니다. |
| `agentToolResultMiddleware`      | `string[]` | 번들 Plugin이 도구 결과 미들웨어를 등록할 수 있는 런타임 ID입니다.   |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 외부 인증 프로필 훅을 소유하는 공급자 ID입니다.          |
| `speechProviders`                | `string[]` | 이 Plugin이 소유하는 음성 공급자 ID입니다.                           |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유하는 실시간 전사 공급자 ID입니다.                    |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유하는 실시간 음성 공급자 ID입니다.                    |
| `memoryEmbeddingProviders`       | `string[]` | 이 Plugin이 소유하는 메모리 임베딩 공급자 ID입니다.                  |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유하는 미디어 이해 공급자 ID입니다.                    |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 이미지 생성 공급자 ID입니다.                    |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 비디오 생성 공급자 ID입니다.                    |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유하는 웹 가져오기 공급자 ID입니다.                    |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유하는 웹 검색 공급자 ID입니다.                        |
| `migrationProviders`             | `string[]` | 이 Plugin이 `openclaw migrate`용으로 소유하는 가져오기 공급자 ID입니다. |
| `tools`                          | `string[]` | 번들 계약 검사용으로 이 Plugin이 소유하는 에이전트 도구 이름입니다.  |

`contracts.embeddedExtensionFactories`는 번들 Codex 앱 서버 전용 extension 팩터리를
위해 유지됩니다. 번들 도구 결과 변환은 대신 `contracts.agentToolResultMiddleware`를
선언하고 `api.registerAgentToolResultMiddleware(...)`로 등록해야 합니다. 외부 Plugin은
도구 결과 미들웨어를 등록할 수 없습니다. 이 seam은 모델이 보기 전에 높은 신뢰도의
도구 출력을 다시 작성할 수 있기 때문입니다.

`resolveExternalAuthProfiles`를 구현하는 공급자 Plugin은
`contracts.externalAuthProviders`를 선언해야 합니다. 선언이 없는 Plugin도 지원 중단된
호환성 대체 경로를 통해 계속 실행되지만, 해당 대체 경로는 더 느리고 마이그레이션
기간 이후 제거될 예정입니다.

번들 메모리 임베딩 공급자는 `local` 같은 기본 제공 어댑터를 포함해 노출하는 모든
어댑터 ID에 대해 `contracts.memoryEmbeddingProviders`를 선언해야 합니다. 독립 실행형
CLI 경로는 전체 Gateway 런타임이 공급자를 등록하기 전에 소유 Plugin만 로드하기 위해
이 매니페스트 계약을 사용합니다.

## mediaUnderstandingProviderMetadata 참조

미디어 이해 제공자에 기본 모델, 자동 인증 폴백 우선순위 또는 런타임 로드 전에 일반 코어 헬퍼가 필요로 하는 네이티브 문서 지원이 있을 때 `mediaUnderstandingProviderMetadata`를 사용합니다. 키는 `contracts.mediaUnderstandingProviders`에도 선언되어야 합니다.

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

각 제공자 항목에는 다음이 포함될 수 있습니다.

| 필드                   | 유형                                | 의미                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 제공자가 노출하는 미디어 기능입니다.                                      |
| `defaultModels`        | `Record<string, string>`            | 구성에서 모델을 지정하지 않았을 때 사용하는 기능별 모델 기본값입니다.        |
| `autoPriority`         | `Record<string, number>`            | 숫자가 낮을수록 자동 자격 증명 기반 제공자 폴백에서 더 먼저 정렬됩니다.      |
| `nativeDocumentInputs` | `"pdf"[]`                           | 제공자가 지원하는 네이티브 문서 입력입니다.                                  |

## `channelConfigs` 참조

채널 Plugin이 런타임 로드 전에 저비용 구성 메타데이터를 필요로 할 때 `channelConfigs`를 사용합니다. 읽기 전용 채널 설정/상태 검색은 설정 항목이 없거나 `setup.requiresRuntime: false`가 설정 런타임이 필요 없다고 선언한 경우, 구성된 외부 채널에 대해 이 메타데이터를 직접 사용할 수 있습니다.

`channelConfigs`는 Plugin 매니페스트 메타데이터이며, 새로운 최상위 사용자 구성 섹션이 아닙니다. 사용자는 여전히 `channels.<channel-id>` 아래에서 채널 인스턴스를 구성합니다. OpenClaw는 Plugin 런타임 코드가 실행되기 전에 매니페스트 메타데이터를 읽어 해당 구성된 채널을 어떤 Plugin이 소유하는지 결정합니다.

채널 Plugin의 경우 `configSchema`와 `channelConfigs`는 서로 다른 경로를 설명합니다.

- `configSchema`는 `plugins.entries.<plugin-id>.config`를 검증합니다
- `channelConfigs.<channel-id>.schema`는 `channels.<channel-id>`를 검증합니다

`channels[]`를 선언하는 번들되지 않은 Plugin은 일치하는 `channelConfigs` 항목도 선언해야 합니다. 그렇지 않아도 OpenClaw는 여전히 Plugin을 로드할 수 있지만, 콜드 경로 구성 스키마, 설정, Control UI 표면은 Plugin 런타임이 실행될 때까지 채널 소유 옵션의 형태를 알 수 없습니다.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled`와 `nativeSkillsAutoEnabled`는 채널 런타임이 로드되기 전에 실행되는 명령 구성 검사에 대한 정적 `auto` 기본값을 선언할 수 있습니다. 번들 채널은 다른 패키지 소유 채널 카탈로그 메타데이터와 함께 `package.json#openclaw.channel.commands`를 통해 동일한 기본값을 게시할 수도 있습니다.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 채널 항목에는 다음이 포함될 수 있습니다.

| 필드          | 유형                     | 의미                                                                                          |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`에 대한 JSON Schema입니다. 선언된 각 채널 구성 항목에 필요합니다.              |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션에 대한 선택적 UI 레이블/플레이스홀더/민감 정보 힌트입니다.                |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기와 검사 표면에 병합되는 채널 레이블입니다.        |
| `description` | `string`                 | 검사 및 카탈로그 표면을 위한 짧은 채널 설명입니다.                                            |
| `commands`    | `object`                 | 런타임 전 구성 검사를 위한 정적 네이티브 명령 및 네이티브 skill 자동 기본값입니다.             |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 Plugin ID입니다.               |

### 다른 채널 Plugin 대체하기

다른 Plugin도 제공할 수 있는 채널 ID에 대해 내 Plugin이 선호되는 소유자일 때 `preferOver`를 사용합니다. 일반적인 경우는 이름이 변경된 Plugin ID, 번들 Plugin을 대체하는 독립형 Plugin, 또는 구성 호환성을 위해 같은 채널 ID를 유지하는 유지 관리되는 포크입니다.

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

`channels.chat`가 구성되면 OpenClaw는 채널 ID와 선호 Plugin ID를 모두 고려합니다. 낮은 우선순위 Plugin이 번들되어 있거나 기본적으로 활성화되어 있다는 이유만으로 선택된 경우, OpenClaw는 유효한 런타임 구성에서 해당 Plugin을 비활성화하여 하나의 Plugin이 채널과 그 도구를 소유하게 합니다. 명시적인 사용자 선택은 여전히 우선합니다. 사용자가 두 Plugin을 모두 명시적으로 활성화하면 OpenClaw는 요청된 Plugin 집합을 조용히 변경하는 대신 그 선택을 유지하고 중복 채널/도구 진단을 보고합니다.

`preferOver`는 실제로 같은 채널을 제공할 수 있는 Plugin ID로 범위를 제한하세요. 이는 일반 우선순위 필드가 아니며 사용자 구성 키의 이름을 바꾸지도 않습니다.

## `modelSupport` 참조

Plugin 런타임 로드 전에 OpenClaw가 `gpt-5.5` 또는 `claude-sonnet-4.6` 같은 축약 모델 ID에서 제공자 Plugin을 추론해야 할 때 `modelSupport`를 사용합니다.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다.

- 명시적 `provider/model` 참조는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 번들되지 않은 Plugin이 우선합니다
- 남은 모호성은 사용자 또는 구성이 제공자를 지정할 때까지 무시됩니다

필드:

| 필드            | 유형       | 의미                                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | 축약 모델 ID에 대해 `startsWith`로 일치시키는 접두사입니다.                          |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 축약 모델 ID에 대해 일치시키는 정규식 소스입니다.              |

## `modelCatalog` 참조

OpenClaw가 Plugin 런타임을 로드하기 전에 제공자 모델 메타데이터를 알아야 할 때 `modelCatalog`를 사용합니다. 이는 고정 카탈로그 행, 제공자 별칭, 억제 규칙, 검색 모드에 대한 매니페스트 소유 소스입니다. 런타임 새로 고침은 여전히 제공자 런타임 코드에 속하지만, 매니페스트는 언제 런타임이 필요한지 코어에 알려줍니다.

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

| 필드           | 유형                                                     | 의미                                                                                                           |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 이 Plugin이 소유한 제공자 ID에 대한 카탈로그 행입니다. 키는 최상위 `providers`에도 나타나야 합니다.           |
| `aliases`      | `Record<string, object>`                                 | 카탈로그 또는 억제 계획을 위해 소유 제공자로 해석되어야 하는 제공자 별칭입니다.                               |
| `suppressions` | `object[]`                                               | 이 Plugin이 제공자별 이유로 억제하는 다른 소스의 모델 행입니다.                                                |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 제공자 카탈로그를 매니페스트 메타데이터에서 읽을 수 있는지, 캐시로 새로 고칠 수 있는지, 런타임이 필요한지입니다. |

`aliases`는 모델 카탈로그 계획을 위한 제공자 소유권 조회에 참여합니다. 별칭 대상은 같은 Plugin이 소유한 최상위 제공자여야 합니다. 제공자로 필터링된 목록에서 별칭을 사용하면 OpenClaw는 제공자 런타임을 로드하지 않고 소유 매니페스트를 읽고 별칭 API/기본 URL 재정의를 적용할 수 있습니다.
별칭은 필터링되지 않은 카탈로그 목록을 확장하지 않습니다. 넓은 목록은 소유 표준 제공자 행만 내보냅니다.

`suppressions`는 이전 제공자 런타임 `suppressBuiltInModel` 훅을 대체합니다. 억제 항목은 제공자가 Plugin의 소유이거나 소유 제공자를 대상으로 하는 `modelCatalog.aliases` 키로 선언된 경우에만 적용됩니다. 런타임 억제 훅은 더 이상 모델 해석 중 호출되지 않습니다.

제공자 필드:

| 필드      | 유형                     | 의미                                                              |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | 이 제공자 카탈로그의 모델에 대한 선택적 기본 URL입니다.           |
| `api`     | `ModelApi`               | 이 제공자 카탈로그의 모델에 대한 선택적 기본 API 어댑터입니다.    |
| `headers` | `Record<string, string>` | 이 제공자 카탈로그에 적용되는 선택적 정적 헤더입니다.             |
| `models`  | `object[]`               | 필수 모델 행입니다. `id`가 없는 행은 무시됩니다.                  |

모델 필드:

| 필드            | 유형                                                           | 의미                                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` 접두사가 없는 제공자 로컬 모델 ID입니다.                        |
| `name`          | `string`                                                       | 선택적 표시 이름입니다.                                                     |
| `api`           | `ModelApi`                                                     | 선택적 모델별 API 재정의입니다.                                             |
| `baseUrl`       | `string`                                                       | 선택적 모델별 기본 URL 재정의입니다.                                        |
| `headers`       | `Record<string, string>`                                       | 선택적 모델별 정적 헤더입니다.                                              |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 모델이 허용하는 모달리티입니다.                                             |
| `reasoning`     | `boolean`                                                      | 모델이 추론 동작을 노출하는지 여부입니다.                                   |
| `contextWindow` | `number`                                                       | 네이티브 제공자 컨텍스트 창입니다.                                          |
| `contextTokens` | `number`                                                       | `contextWindow`와 다를 때 선택적 유효 런타임 컨텍스트 상한입니다.           |
| `maxTokens`     | `number`                                                       | 알려진 경우 최대 출력 토큰 수입니다.                                        |
| `cost`          | `object`                                                       | 선택적 `tieredPricing`을 포함한 선택적 백만 토큰당 USD 가격입니다.          |
| `compat`        | `object`                                                       | OpenClaw 모델 구성 호환성과 일치하는 선택적 호환성 플래그입니다.            |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 목록 상태입니다. 행이 전혀 표시되지 않아야 할 때만 숨깁니다.               |
| `statusReason`  | `string`                                                       | 사용 불가 상태와 함께 표시되는 선택적 이유입니다.                           |
| `replaces`      | `string[]`                                                     | 이 모델이 대체하는 이전 제공자 로컬 모델 ID입니다.                          |
| `replacedBy`    | `string`                                                       | 사용 중단된 행의 대체 제공자 로컬 모델 ID입니다.                            |
| `tags`          | `string[]`                                                     | 선택기와 필터에서 사용하는 안정적인 태그입니다.                             |

숨김 필드:

| 필드                       | 유형       | 의미                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 숨길 업스트림 행의 제공자 ID입니다. 이 Plugin이 소유하거나 소유 별칭으로 선언되어야 합니다.               |
| `model`                    | `string`   | 숨길 제공자 로컬 모델 ID입니다.                                                                           |
| `reason`                   | `string`   | 숨겨진 행이 직접 요청될 때 표시되는 선택적 메시지입니다.                                                  |
| `when.baseUrlHosts`        | `string[]` | 숨김이 적용되기 전에 필요한 유효 제공자 기본 URL 호스트의 선택적 목록입니다.                              |
| `when.providerConfigApiIn` | `string[]` | 숨김이 적용되기 전에 필요한 정확한 제공자 구성 `api` 값의 선택적 목록입니다.                              |

런타임 전용 데이터를 `modelCatalog`에 넣지 마세요. 매니페스트 행이
제공자별 필터링 목록과 선택기 화면에서 레지스트리/런타임 탐색을 건너뛰기에
충분히 완전할 때만 `static`을 사용하세요. 매니페스트 행이 목록화 가능한
시드 또는 보충 항목으로 유용하지만 새로 고침/캐시가 나중에 더 많은 행을
추가할 수 있을 때는 `refreshable`을 사용하세요. refreshable 행은 그
자체로 권위 있는 항목이 아닙니다. OpenClaw가 목록을 알기 위해 제공자
런타임을 로드해야 할 때는 `runtime`을 사용하세요.

## modelIdNormalization 참조

제공자 런타임이 로드되기 전에 반드시 발생해야 하는 저비용 제공자 소유
모델 ID 정리에 `modelIdNormalization`을 사용하세요. 이렇게 하면 짧은
모델 이름, 제공자 로컬 레거시 ID, 프록시 접두사 규칙 같은 별칭을 코어
모델 선택 테이블이 아니라 소유 Plugin 매니페스트에 둘 수 있습니다.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

제공자 필드:

| 필드                                 | 유형                    | 의미                                                                                                 |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 대소문자를 구분하지 않는 정확한 모델 ID 별칭입니다. 값은 작성된 그대로 반환됩니다.                   |
| `stripPrefixes`                      | `string[]`              | 별칭 조회 전에 제거할 접두사입니다. 레거시 제공자/모델 중복에 유용합니다.                            |
| `prefixWhenBare`                     | `string`                | 정규화된 모델 ID에 아직 `/`가 포함되지 않았을 때 추가할 접두사입니다.                                |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 별칭 조회 후 조건부 bare ID 접두사 규칙이며, `modelPrefix`와 `prefix`를 기준으로 합니다.              |

## providerEndpoints 참조

제공자 런타임이 로드되기 전에 일반 요청 정책이 알아야 하는 엔드포인트
분류에는 `providerEndpoints`를 사용하세요. 코어는 여전히 각
`endpointClass`의 의미를 소유하고, Plugin 매니페스트는 호스트와 기본 URL
메타데이터를 소유합니다.

엔드포인트 필드:

| 필드                           | 유형       | 의미                                                                                                      |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native`, `google-vertex` 같은 알려진 코어 엔드포인트 클래스입니다.                 |
| `hosts`                        | `string[]` | 엔드포인트 클래스에 매핑되는 정확한 호스트 이름입니다.                                                    |
| `hostSuffixes`                 | `string[]` | 엔드포인트 클래스에 매핑되는 호스트 접미사입니다. 도메인 접미사 전용 매칭에는 `.`을 접두사로 붙이세요.     |
| `baseUrls`                     | `string[]` | 엔드포인트 클래스에 매핑되는 정확히 정규화된 HTTP(S) 기본 URL입니다.                                      |
| `googleVertexRegion`           | `string`   | 정확한 전역 호스트에 대한 정적 Google Vertex 리전입니다.                                                  |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex 리전 접두사를 노출하기 위해 매칭 호스트에서 제거할 접미사입니다.                            |

## providerRequest 참조

제공자 런타임을 로드하지 않고 일반 요청 정책에 필요한 저비용 요청 호환성
메타데이터에는 `providerRequest`를 사용하세요. 동작별 페이로드 재작성은
제공자 런타임 훅 또는 공유 제공자 제품군 헬퍼에 유지하세요.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

제공자 필드:

| 필드                  | 유형         | 의미                                                                                       |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `family`              | `string`     | 일반 요청 호환성 결정과 진단에 사용되는 제공자 제품군 라벨입니다.                          |
| `compatibilityFamily` | `"moonshot"` | 공유 요청 헬퍼를 위한 선택적 제공자 제품군 호환성 버킷입니다.                              |
| `openAICompletions`   | `object`     | OpenAI 호환 completions 요청 플래그이며, 현재는 `supportsStreamingUsage`입니다.             |

## modelPricing 참조

제공자가 런타임 로드 전에 컨트롤 플레인 가격 동작을 제어해야 할 때
`modelPricing`을 사용하세요. Gateway 가격 캐시는 제공자 런타임 코드를
가져오지 않고 이 메타데이터를 읽습니다.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

제공자 필드:

| 필드         | 유형              | 의미                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter 또는 LiteLLM 가격을 절대 가져오면 안 되는 로컬/자체 호스팅 제공자에는 `false`로 설정합니다. |
| `openRouter` | `false \| object` | OpenRouter 가격 조회 매핑입니다. `false`는 이 제공자에 대한 OpenRouter 조회를 비활성화합니다.          |
| `liteLLM`    | `false \| object` | LiteLLM 가격 조회 매핑입니다. `false`는 이 제공자에 대한 LiteLLM 조회를 비활성화합니다.                |

소스 필드:

| 필드                       | 유형               | 의미                                                                                                             |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw 제공자 ID와 다를 때의 외부 카탈로그 제공자 ID입니다. 예를 들어 `zai` 제공자의 `z-ai`입니다.              |
| `passthroughProviderModel` | `boolean`          | 슬래시가 포함된 모델 ID를 중첩된 제공자/모델 참조로 취급합니다. OpenRouter 같은 프록시 제공자에 유용합니다.       |
| `modelIdTransforms`        | `"version-dots"[]` | 추가 외부 카탈로그 모델 ID 변형입니다. `version-dots`는 `claude-opus-4.6` 같은 점 표기 버전 ID를 시도합니다.      |

### OpenClaw 제공자 인덱스

OpenClaw 제공자 인덱스는 아직 Plugin이 설치되지 않았을 수 있는 제공자를
위한 OpenClaw 소유 미리 보기 메타데이터입니다. 이는 Plugin 매니페스트의
일부가 아닙니다. Plugin 매니페스트는 설치된 Plugin의 권위 있는 기준으로
남습니다. 제공자 인덱스는 제공자 Plugin이 설치되어 있지 않을 때 향후
설치 가능한 제공자와 사전 설치 모델 선택기 화면이 사용할 내부 대체
계약입니다.

카탈로그 권위 순서:

1. 사용자 구성.
2. 설치된 Plugin 매니페스트 `modelCatalog`.
3. 명시적 새로 고침의 모델 카탈로그 캐시.
4. OpenClaw 제공자 인덱스 미리 보기 행.

프로바이더 인덱스에는 비밀, 활성화 상태, 런타임 훅 또는
라이브 계정별 모델 데이터가 포함되면 안 됩니다. 미리보기 카탈로그는 Plugin 매니페스트와 동일한
`modelCatalog` 프로바이더 행 형태를 사용하지만, `api`,
`baseUrl`, 가격 또는 호환성 플래그 같은 런타임 어댑터 필드를
설치된 Plugin 매니페스트와 의도적으로 맞춰 유지하는 경우가 아니라면 안정적인 표시 메타데이터로 제한해야 합니다. 라이브 `/models` 검색이 있는 프로바이더는
일반 목록 표시나 온보딩이 프로바이더 API를 호출하게 하는 대신
명시적 모델 카탈로그 캐시 경로를 통해 새로 고친 행을 써야 합니다.

프로바이더 인덱스 항목에는 Plugin이 코어 밖으로 이동했거나
아직 설치되지 않은 프로바이더를 위한 설치 가능한 Plugin 메타데이터도 포함될 수 있습니다. 이
메타데이터는 채널 카탈로그 패턴을 반영합니다. 패키지 이름, npm 설치 사양,
예상 무결성, 저비용 인증 선택 라벨만 있으면
설치 가능한 설정 옵션을 표시하기에 충분합니다. Plugin이 설치되면, 해당 매니페스트가 우선하며
그 프로바이더의 프로바이더 인덱스 항목은 무시됩니다.

레거시 최상위 기능 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용하여
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로
이동하세요. 일반 매니페스트 로딩은 더 이상 이러한 최상위 필드를 기능
소유권으로 취급하지 않습니다.

## 매니페스트와 package.json 비교

두 파일은 서로 다른 역할을 합니다.

| 파일                   | 사용 목적                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 존재해야 하는 검색, 구성 검증, 인증 선택 메타데이터, UI 힌트                         |
| `package.json`         | npm 메타데이터, 의존성 설치, 엔트리포인트, 설치 게이팅, 설정 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록 |

메타데이터가 어디에 속하는지 확실하지 않다면, 이 규칙을 사용하세요.

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 하는 정보라면 `openclaw.plugin.json`에 넣으세요
- 패키징, 엔트리 파일 또는 npm 설치 동작에 관한 정보라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 런타임 이전 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라
`package.json`의 `openclaw` 블록 아래에 있습니다.

중요한 예:

| 필드                                                             | 의미                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 네이티브 Plugin 엔트리포인트를 선언합니다. Plugin 패키지 디렉터리 안에 있어야 합니다.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지의 빌드된 JavaScript 런타임 엔트리포인트를 선언합니다. Plugin 패키지 디렉터리 안에 있어야 합니다.                                                                 |
| `openclaw.setupEntry`                                             | 온보딩, 지연된 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중에 사용되는 가벼운 설정 전용 엔트리포인트입니다. Plugin 패키지 디렉터리 안에 있어야 합니다. |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지의 빌드된 JavaScript 설정 엔트리포인트를 선언합니다. Plugin 패키지 디렉터리 안에 있어야 합니다.                                                                |
| `openclaw.channel`                                                | 라벨, 문서 경로, 별칭, 선택 문구 같은 저비용 채널 카탈로그 메타데이터입니다.                                                                                                 |
| `openclaw.channel.commands`                                       | 채널 런타임이 로드되기 전에 구성, 감사, 명령 목록 화면에서 사용되는 정적 네이티브 명령 및 네이티브 skill 자동 기본값 메타데이터입니다.                                          |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고 "환경 변수만으로 된 설정이 이미 존재하는가?"에 답할 수 있는 가벼운 구성 상태 검사기 메타데이터입니다.                                         |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고 "이미 로그인된 것이 있는가?"에 답할 수 있는 가벼운 영속 인증 검사기 메타데이터입니다.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 게시 Plugin을 위한 설치/업데이트 힌트입니다.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호하는 설치 경로입니다.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist 무결성 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이에 대해 검증합니다.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 유효하지 않을 때 좁은 범위의 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 Plugin보다 설정 전용 채널 화면이 먼저 로드되도록 합니다.                                                                                                 |

매니페스트 메타데이터는 런타임이 로드되기 전에 온보딩에 표시되는
프로바이더/채널/설정 선택지를 결정합니다. `package.json#openclaw.install`은
사용자가 이러한 선택지 중 하나를 고를 때 온보딩이 해당 Plugin을 가져오거나 활성화하는 방법을 알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 및 매니페스트
레지스트리 로딩 중에 적용됩니다. 유효하지 않은 값은 거부됩니다. 더 새롭지만 유효한 값은
이전 호스트에서 Plugin을 건너뛰게 합니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 있습니다. 예:
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. 공식 외부 카탈로그
항목은 정확한 사양을 `expectedIntegrity`와 함께 사용해야 하며, 그래야 가져온 npm 아티팩트가 고정된 릴리스와 더 이상 일치하지 않을 경우 업데이트 흐름이 닫힌 상태로 실패합니다.
대화형 온보딩은 호환성을 위해 여전히 베어
패키지 이름 및 dist-tag를 포함한 신뢰된 레지스트리 npm 사양을 제공합니다. 카탈로그 진단은
정확한 소스, 유동 소스, 무결성 고정 소스, 누락된 무결성, 패키지 이름
불일치, 유효하지 않은 기본 선택 소스를 구분할 수 있습니다. 또한
`expectedIntegrity`가 있지만 이를 고정할 수 있는 유효한 npm 소스가 없을 때 경고합니다.
`expectedIntegrity`가 있으면,
설치/업데이트 흐름이 이를 강제합니다. 생략되면 레지스트리 해석 결과가
무결성 고정 없이 기록됩니다.

채널 Plugin은 상태, 채널 목록 또는 SecretRef 스캔이 전체
런타임을 로드하지 않고 구성된 계정을 식별해야 할 때 `openclaw.setupEntry`를 제공해야 합니다. 설정 엔트리는 채널 메타데이터와 설정에 안전한 구성,
상태, 비밀 어댑터를 노출해야 합니다. 네트워크 클라이언트, Gateway 리스너,
전송 런타임은 기본 extension 엔트리포인트에 두세요.

런타임 엔트리포인트 필드는 소스
엔트리포인트 필드에 대한 패키지 경계 검사를 재정의하지 않습니다. 예를 들어 `openclaw.runtimeExtensions`는
경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다. 이는
임의의 깨진 구성을 설치 가능하게 만들지 않습니다. 현재는 누락된 번들 Plugin 경로나 동일한
번들 Plugin에 대한 오래된 `channels.<id>` 항목처럼 특정 오래된 번들 Plugin 업그레이드 실패에서만 설치
흐름이 복구되도록 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를
`openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기
모듈을 위한 패키지 메타데이터입니다.

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

설정, doctor, 상태 또는 읽기 전용 존재 흐름이 전체 채널 Plugin을 로드하기 전에 저비용
예/아니요 인증 프로브가 필요할 때 사용하세요. 영속 인증 상태는
구성된 채널 상태가 아닙니다. 이 메타데이터를 사용하여 Plugin을 자동 활성화하거나,
런타임 의존성을 복구하거나, 채널 런타임을 로드해야 하는지 결정하지 마세요.
대상 export는 영속 상태만 읽는 작은 함수여야 합니다. 이를
전체 채널 런타임 배럴을 통해 라우팅하지 마세요.

`openclaw.channel.configuredState`는 저비용 환경 변수 전용
구성 검사를 위해 같은 형태를 따릅니다.

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

채널이 환경 변수나 다른 작은
비런타임 입력으로 구성 상태에 답할 수 있을 때 사용하세요. 검사에 전체 구성 해석이나 실제
채널 런타임이 필요하다면 그 로직을 Plugin `config.hasConfiguredState`
훅에 두세요.

## 검색 우선순위(중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적으로 구성에서 선택한 경로)에서 Plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면 **가장 높은 우선순위**의 매니페스트만 유지됩니다. 낮은 우선순위의 중복 항목은 함께 로드되는 대신 삭제됩니다.

우선순위는 높은 순서부터 낮은 순서까지 다음과 같습니다.

1. **구성에서 선택됨** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **번들** — OpenClaw와 함께 제공되는 Plugin
3. **전역 설치** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **워크스페이스** — 현재 워크스페이스를 기준으로 검색된 Plugin

영향:

- 워크스페이스에 있는 번들 Plugin의 포크되었거나 오래된 복사본은 번들 빌드를 가리지 않습니다.
- 로컬 Plugin으로 번들 Plugin을 실제로 재정의하려면, 워크스페이스 검색에 의존하지 말고 `plugins.entries.<id>`를 통해 고정하여 우선순위에서 이기게 하세요.
- 중복 삭제는 Doctor와 시작 진단이 버려진 복사본을 가리킬 수 있도록 로그에 기록됩니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 함께 제공해야 합니다**, 구성을 받지 않더라도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 채널 id가 Plugin 매니페스트에 선언된 경우를 제외하고 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 **발견 가능한** Plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- Plugin이 설치되어 있지만 매니페스트나 스키마가 손상되었거나 누락된 경우,
  검증이 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 있지만 Plugin이 **비활성화**된 경우, 구성은 유지되며
  Doctor와 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- 매니페스트는 로컬 파일 시스템 로드를 포함한 **네이티브 OpenClaw Plugin에 필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, 매니페스트는 발견 및 검증 전용입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로, 최종 값이 여전히 객체인 한 주석, 후행 쉼표, 따옴표 없는 키가 허용됩니다.
- 문서화된 매니페스트 필드만 매니페스트 로더가 읽습니다. 사용자 지정 최상위 키는 피하세요.
- Plugin에 필요하지 않은 경우 `channels`, `providers`, `cliBackends`, `skills`를 모두 생략할 수 있습니다.
- `providerDiscoveryEntry`는 가볍게 유지해야 하며 광범위한 런타임 코드를 가져오면 안 됩니다. 요청 시점 실행이 아니라 정적 공급자 카탈로그 메타데이터나 좁은 범위의 발견 설명자에 사용하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다. `plugins.slots.memory`를 통한 `kind: "memory"`, `plugins.slots.contextEngine`을 통한 `kind: "context-engine"`(기본값 `legacy`)입니다.
- 이 매니페스트에 배타적 Plugin 종류를 선언하세요. 런타임 엔트리 `OpenClawPluginDefinition.kind`는 더 이상 권장되지 않으며 이전 Plugin과의 호환성 대체 수단으로만 남아 있습니다.
- 환경 변수 메타데이터(`setup.providers[].envVars`, 더 이상 권장되지 않는 `providerAuthEnvVars`, `channelEnvVars`)는 선언용일 뿐입니다. 상태, 감사, cron 전달 검증 및 기타 읽기 전용 표면은 여전히 환경 변수를 구성된 것으로 취급하기 전에 Plugin 신뢰 및 실제 활성화 정책을 적용합니다.
- 공급자 코드가 필요한 런타임 마법사 메타데이터는 [공급자 런타임 훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
- Plugin이 네이티브 모듈에 의존하는 경우 빌드 단계와 패키지 관리자 허용 목록 요구 사항(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin architecture" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처 및 기능 모델.
  </Card>
  <Card title="SDK overview" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 가져오기.
  </Card>
</CardGroup>
