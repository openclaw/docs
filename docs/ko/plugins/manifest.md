---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin 구성 스키마를 배포하거나 Plugin 유효성 검사 오류를 디버깅해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구 사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-07-12T15:28:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

이 페이지에서는 **네이티브 OpenClaw Plugin 매니페스트**인 `openclaw.plugin.json`을 설명합니다. 호환 번들 레이아웃(Codex, Claude, Cursor)은 [Plugin 번들](/ko/plugins/bundles)을 참조하십시오.

호환 번들 형식은 다음과 같이 자체 매니페스트 파일을 사용합니다.

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 구성 요소 레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 레이아웃을 자동으로 감지하지만 아래의 `openclaw.plugin.json` 스키마를 기준으로 검증하지는 않습니다. 호환 번들의 레이아웃이 OpenClaw의 런타임 요구 사항과 일치하면 OpenClaw는 번들 메타데이터, 선언된 skill 루트, Claude 명령 루트, Claude `settings.json` 기본값, Claude LSP 기본값 및 지원되는 훅 팩을 읽습니다.

모든 네이티브 OpenClaw Plugin은 **Plugin 루트**에 `openclaw.plugin.json`을 **반드시** 포함해야 합니다. OpenClaw는 **Plugin 코드를 실행하지 않고** 구성을 검증하기 위해 이 파일을 읽습니다. 매니페스트가 없거나 유효하지 않으면 구성 검증이 차단되고 Plugin 오류로 처리됩니다.

전체 Plugin 시스템 가이드는 [Plugin](/ko/tools/plugin)을, 네이티브 기능 모델과 현재 외부 호환성 지침은 [기능 모델](/ko/plugins/architecture#public-capability-model)을 참조하십시오.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에** 읽는 메타데이터입니다. 이 파일의 모든 내용은 Plugin 런타임을 시작하지 않고도 검사할 수 있을 만큼 가벼워야 합니다.

**다음 용도로 사용하십시오.**

- Plugin 식별, 구성 검증 및 구성 UI 안내
- 인증, 온보딩 및 설정 메타데이터(별칭, 자동 활성화, 공급자 환경 변수, 인증 선택 항목)
- 제어 영역 화면의 활성화 안내
- 모델 계열 소유권 약식 표기
- 정적 기능 소유권 스냅샷(`contracts`)
- 공유 `openclaw qa` 호스트가 검사할 수 있는 QA 실행기 메타데이터
- 카탈로그 및 검증 화면에 병합되는 채널별 구성 메타데이터

**다음 용도로 사용하지 마십시오.** 런타임 동작 등록, 코드 진입점 선언 또는 npm 설치 메타데이터. 이러한 항목은 Plugin 코드와 `package.json`에 속합니다.

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

## 상세 예시

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| 필드                                 | 필수 여부 | 유형                         | 의미                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 예        | `string`                     | 정규 Plugin ID입니다. `plugins.entries.<id>`에서 사용하는 ID입니다.                                                                                                                                                                                                        |
| `configSchema`                       | 예        | `object`                     | 이 Plugin의 구성을 위한 인라인 JSON Schema입니다.                                                                                                                                                                                                                          |
| `requiresPlugins`                    | 아니요    | `string[]`                   | 이 Plugin이 작동하려면 함께 설치해야 하는 Plugin ID입니다. 검색 과정에서는 Plugin을 로드 가능한 상태로 유지하지만, 필수 Plugin이 하나라도 없으면 경고합니다.                                                                                                              |
| `enabledByDefault`                   | 아니요    | `true`                       | 번들 Plugin을 기본적으로 활성화하도록 표시합니다. 기본적으로 비활성화된 상태로 두려면 생략하거나 `true`가 아닌 값으로 설정합니다.                                                                                                                                         |
| `enabledByDefaultOnPlatforms`        | 아니요    | `string[]`                   | 번들 Plugin을 나열된 Node.js 플랫폼에서만 기본적으로 활성화하도록 표시합니다(예: `["darwin"]`). 명시적 구성이 항상 우선합니다.                                                                                                                                             |
| `legacyPluginIds`                    | 아니요    | `string[]`                   | 이 정규 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | 아니요    | `string[]`                   | 인증, 구성 또는 모델 참조에서 언급될 때 이 Plugin을 자동으로 활성화해야 하는 공급자 ID입니다.                                                                                                                                                                             |
| `kind`                               | 아니요    | `PluginKind \| PluginKind[]` | `plugins.slots.*`에서 사용하는 하나 이상의 상호 배타적 Plugin 종류(`"memory"`, `"context-engine"`)를 선언합니다. 두 슬롯을 모두 소유하는 Plugin은 하나의 배열에 두 종류를 모두 선언합니다.                                                                                  |
| `channels`                           | 아니요    | `string[]`                   | 이 Plugin이 소유하는 채널 ID입니다. 검색 및 구성 검증에 사용합니다.                                                                                                                                                                                                        |
| `providers`                          | 아니요    | `string[]`                   | 이 Plugin이 소유하는 공급자 ID입니다.                                                                                                                                                                                                                                      |
| `providerCatalogEntry`               | 아니요    | `string`                     | 전체 Plugin 런타임을 활성화하지 않고 로드할 수 있는 매니페스트 범위 공급자 카탈로그 메타데이터를 위한 경량 공급자 카탈로그 모듈 경로입니다. Plugin 루트를 기준으로 한 상대 경로입니다.                                                                                      |
| `modelSupport`                       | 아니요    | `object`                     | 런타임 전에 Plugin을 자동으로 로드하는 데 사용하는 매니페스트 소유의 축약형 모델 패밀리 메타데이터입니다.                                                                                                                                                                  |
| `modelCatalog`                       | 아니요    | `object`                     | 이 Plugin이 소유하는 공급자의 선언적 모델 카탈로그 메타데이터입니다. Plugin 런타임을 로드하지 않고 향후 읽기 전용 목록 표시, 온보딩, 모델 선택기, 별칭 및 숨김을 지원하기 위한 제어 영역 계약입니다.                                                                       |
| `modelPricing`                       | 아니요    | `object`                     | 공급자 소유의 외부 가격 조회 정책입니다. 이를 사용하면 로컬/자체 호스팅 공급자를 원격 가격 카탈로그에서 제외하거나, 코어에 공급자 ID를 하드코딩하지 않고 공급자 참조를 OpenRouter/LiteLLM 카탈로그 ID에 매핑할 수 있습니다.                                                   |
| `modelIdNormalization`               | 아니요    | `object`                     | 공급자 런타임이 로드되기 전에 실행해야 하는 공급자 소유의 모델 ID 별칭/접두사 정리입니다.                                                                                                                                                                                   |
| `providerEndpoints`                  | 아니요    | `object[]`                   | 공급자 런타임이 로드되기 전에 코어가 분류해야 하는 공급자 경로의 매니페스트 소유 엔드포인트 호스트/baseUrl 메타데이터입니다.                                                                                                                                                 |
| `providerRequest`                    | 아니요    | `object`                     | 공급자 런타임이 로드되기 전에 일반 요청 정책에서 사용하는 경량 공급자 패밀리 및 요청 호환성 메타데이터입니다.                                                                                                                                                              |
| `secretProviderIntegrations`         | 아니요    | `Record<string, object>`     | 코어에 공급자별 통합을 하드코딩하지 않고 설정 또는 설치 화면에서 제공할 수 있는 선언적 SecretRef 실행 공급자 프리셋입니다.                                                                                                                                                  |
| `cliBackends`                        | 아니요    | `string[]`                   | 이 Plugin이 소유하는 CLI 추론 백엔드 ID입니다. 명시적 구성 참조에 따른 시작 시 자동 활성화에 사용합니다.                                                                                                                                                                    |
| `syntheticAuthRefs`                  | 아니요    | `string[]`                   | 런타임이 로드되기 전 콜드 모델 검색 중에 Plugin 소유의 합성 인증 훅을 탐색해야 하는 공급자 또는 CLI 백엔드 참조입니다.                                                                                                                                                       |
| `nonSecretAuthMarkers`               | 아니요    | `string[]`                   | 비밀이 아닌 로컬, OAuth 또는 주변 자격 증명 상태를 나타내는 번들 Plugin 소유의 플레이스홀더 API 키 값입니다.                                                                                                                                                               |
| `commandAliases`                     | 아니요    | `object[]`                   | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는, 이 Plugin 소유의 명령 이름입니다.                                                                                                                                                                     |
| `providerAuthEnvVars`                | 아니요    | `Record<string, string[]>`   | 공급자 인증/상태 조회를 위한 더 이상 권장되지 않는 호환성 환경 메타데이터입니다. 새 Plugin에는 `setup.providers[].envVars`를 사용하는 것이 좋습니다. OpenClaw는 사용 중단 기간 동안 계속 이를 읽습니다.                                                                     |
| `providerUsageAuthEnvVars`           | 아니요    | `Record<string, string[]>`   | 사용량/청구 전용 공급자 자격 증명입니다. OpenClaw는 사용량 검색 및 비밀 정보 제거에 이 이름을 사용하지만, 추론 인증에는 절대 사용하지 않습니다.                                                                                                                             |
| `providerAuthAliases`                | 아니요    | `Record<string, string>`     | 인증 조회에 다른 공급자 ID를 재사용해야 하는 공급자 ID입니다. 예를 들어 기본 공급자의 API 키와 인증 프로필을 공유하는 코딩 공급자가 이에 해당합니다.                                                                                                                      |
| `channelEnvVars`                     | 아니요    | `Record<string, string[]>`   | OpenClaw가 Plugin 코드를 로드하지 않고 검사할 수 있는 경량 채널 환경 메타데이터입니다. 일반 시작/구성 도우미에서 확인해야 하는 환경 기반 채널 설정 또는 인증 화면에 사용합니다.                                                                                              |
| `providerAuthChoices`                | 아니요    | `object[]`                   | 온보딩 선택기, 선호 공급자 결정 및 단순 CLI 플래그 연결을 위한 경량 인증 선택지 메타데이터입니다.                                                                                                                                                                          |
| `activation`                         | 아니요    | `object`                     | 시작, 공급자, 명령, 채널, 경로 및 기능에 의해 트리거되는 로드를 위한 경량 활성화 플래너 메타데이터입니다. 메타데이터만 제공하며 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                                                                |
| `setup`                              | 아니요    | `object`                     | 검색 및 설정 화면에서 Plugin 런타임을 로드하지 않고 검사할 수 있는 경량 설정/온보딩 설명자입니다.                                                                                                                                                                         |
| `qaRunners`                          | 아니요    | `object[]`                   | Plugin 런타임이 로드되기 전에 공유 `openclaw qa` 호스트에서 사용하는 경량 QA 실행기 설명자입니다.                                                                                                                                                                         |
| `contracts`                          | 아니요    | `object`                     | 외부 인증 훅, 임베딩, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지/동영상/음악 생성, 웹 가져오기, 웹 검색, 작업자 공급자, 문서/웹 콘텐츠 추출 및 도구 소유권에 대한 정적 기능 소유권 스냅샷입니다.                                                                      |
| `configContracts`                    | 아니요    | `object`                     | 일반 코어 도우미가 사용하는 매니페스트 소유의 구성 동작입니다. 위험 플래그 감지, SecretRef 마이그레이션 대상 및 레거시 구성 경로 범위 축소를 포함합니다. [configContracts 참고 자료](#configcontracts-reference)를 참조하십시오.                                              |
| `mediaUnderstandingProviderMetadata` | 아니요       | `Record<string, object>`     | `contracts.mediaUnderstandingProviders`에 선언된 제공자 ID를 위한 저비용 미디어 이해 기본값입니다.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | 아니요       | `Record<string, object>`     | `contracts.imageGenerationProviders`에 선언된 제공자 ID를 위한 저비용 이미지 생성 인증 메타데이터이며, 제공자 소유의 인증 별칭과 기본 URL 가드를 포함합니다.                                                                                                         |
| `videoGenerationProviderMetadata`    | 아니요       | `Record<string, object>`     | `contracts.videoGenerationProviders`에 선언된 제공자 ID를 위한 저비용 동영상 생성 인증 메타데이터이며, 제공자 소유의 인증 별칭과 기본 URL 가드를 포함합니다.                                                                                                         |
| `musicGenerationProviderMetadata`    | 아니요       | `Record<string, object>`     | `contracts.musicGenerationProviders`에 선언된 제공자 ID를 위한 저비용 음악 생성 인증 메타데이터이며, 제공자 소유의 인증 별칭과 기본 URL 가드를 포함합니다.                                                                                                         |
| `toolMetadata`                       | 아니요       | `Record<string, object>`     | `contracts.tools`에 선언된 Plugin 소유 도구를 위한 저비용 가용성 메타데이터입니다. 구성, 환경 변수 또는 인증 증거가 없는 한 도구가 런타임을 로드하지 않아야 할 때 사용하십시오.                                                                                                  |
| `channelConfigs`                     | 아니요       | `Record<string, object>`     | 런타임이 로드되기 전에 검색 및 검증 영역에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다.                                                                                                                                                                 |
| `skills`                             | 아니요       | `string[]`                   | Plugin 루트를 기준으로 로드할 Skills 디렉터리입니다.                                                                                                                                                                                                                    |
| `name`                               | 아니요       | `string`                     | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                                                                                                |
| `description`                        | 아니요       | `string`                     | Plugin 화면에 표시되는 간단한 요약입니다.                                                                                                                                                                                                                                    |
| `catalog`                            | 아니요       | `object`                     | Plugin 카탈로그 화면을 위한 선택적 표시 힌트입니다. 이 메타데이터는 Plugin을 설치하거나 활성화하거나 Plugin에 신뢰를 부여하지 않습니다.                                                                                                                                               |
| `icon`                               | 아니요       | `string`                     | 마켓플레이스/카탈로그 카드용 HTTPS 이미지 URL입니다. ClawHub는 유효한 모든 `https://` URL을 허용하며, 이 값이 생략되었거나 유효하지 않으면 기본 Plugin 아이콘을 사용합니다.                                                                                                         |
| `version`                            | 아니요       | `string`                     | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                                                                                              |
| `uiHints`                            | 아니요       | `Record<string, object>`     | 구성 필드의 UI 레이블, 자리표시자 및 민감도 힌트입니다.                                                                                                                                                                                                          |

## catalog 참조

`catalog`는 Plugin 브라우저에 선택적인 표시 힌트를 제공합니다. 호스트는 이러한 힌트를 무시할 수 있습니다. 이러한 힌트는 Plugin을 설치하거나 활성화하지 않으며, 런타임 동작이나 신뢰 수준을 변경하지도 않습니다.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| 필드       | 유형      | 의미                                                                       |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | 카탈로그 화면에서 이 Plugin을 추천 항목으로 표시할지 여부입니다.           |
| `order`    | `number`  | 선별된 Plugin 간 오름차순 표시 힌트이며, 값이 낮을수록 먼저 표시됩니다.    |

## 생성 공급자 메타데이터 참조

생성 공급자 메타데이터 필드는 일치하는 `contracts.*GenerationProviders` 목록에 선언된 공급자의 정적 인증 신호를 설명합니다. OpenClaw는 공급자 런타임이 로드되기 전에 이러한 필드를 읽으므로, 핵심 도구가 모든 공급자 Plugin을 가져오지 않고도 생성 공급자의 사용 가능 여부를 결정할 수 있습니다.

이러한 필드는 비용이 적게 드는 선언적 정보에만 사용하십시오. 전송, 요청 변환, 토큰 갱신, 자격 증명 검증 및 실제 생성 동작은 Plugin 런타임에 유지합니다.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

각 메타데이터 항목은 다음을 지원합니다.

| 필드                   | 필수 여부 | 유형       | 의미                                                                                                                                                        |
| ---------------------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 아니요    | `string[]` | 생성 공급자의 정적 인증 별칭으로 간주해야 하는 추가 공급자 ID입니다.                                                                                        |
| `authProviders`        | 아니요    | `string[]` | 구성된 인증 프로필이 이 생성 공급자의 인증으로 간주되어야 하는 공급자 ID입니다.                                                                              |
| `configSignals`        | 아니요    | `object[]` | 인증 프로필이나 환경 변수 없이 구성할 수 있는 로컬 또는 자체 호스팅 공급자를 위한 비용이 적게 드는 구성 전용 사용 가능성 신호입니다.                          |
| `authSignals`          | 아니요    | `object[]` | 명시적 인증 신호입니다. 이 필드가 있으면 공급자 ID, `aliases`, `authProviders`에서 생성되는 기본 신호 집합을 대체합니다.                                      |
| `referenceAudioInputs` | 아니요    | `boolean`  | 동영상 생성 전용입니다. 공급자가 참조 오디오 자산을 허용하면 `true`로 설정합니다. 그렇지 않으면 `video_generate`가 오디오 참조 매개변수를 숨깁니다.          |

각 `configSignals` 항목은 다음을 지원합니다.

| 필드             | 필수 여부 | 유형       | 의미                                                                                                                                                                                                 |
| ---------------- | --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 예        | `string`   | 검사할 Plugin 소유 구성 객체의 점 경로입니다(예: `plugins.entries.example.config`).                                                                                                                   |
| `overlayPath`    | 아니요    | `string`   | 신호를 평가하기 전에 해당 객체가 루트 객체를 덮어써야 하는, 루트 구성 내부의 점 경로입니다. `image`, `video`, `music`과 같은 기능별 구성에 사용하십시오.                                               |
| `overlayMapPath` | 아니요    | `string`   | 각 객체 값이 루트 객체를 덮어써야 하는, 루트 구성 내부의 점 경로입니다. 구성된 계정 중 하나라도 조건을 충족해야 하는 `accounts`와 같은 명명된 계정 맵에 사용하십시오.                                   |
| `required`       | 아니요    | `string[]` | 구성된 값이 반드시 있어야 하는 유효 구성 내부의 점 경로입니다. 문자열은 비어 있지 않아야 하며, 객체와 배열도 비어 있지 않아야 합니다.                                                                 |
| `requiredAny`    | 아니요    | `string[]` | 하나 이상에 구성된 값이 있어야 하는 유효 구성 내부의 점 경로입니다.                                                                                                                                  |
| `mode`           | 아니요    | `object`   | 유효 구성 내부의 선택적 문자열 모드 가드입니다. 구성 전용 사용 가능성이 하나의 모드에만 적용되는 경우 사용하십시오.                                                                                    |

각 `mode` 가드는 다음을 지원합니다.

| 필드         | 필수 여부 | 유형       | 의미                                                                                 |
| ------------ | --------- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | 아니요    | `string`   | 유효 구성 내부의 점 경로입니다. 기본값은 `mode`입니다.                               |
| `default`    | 아니요    | `string`   | 구성에서 경로를 생략한 경우 사용할 모드 값입니다.                                    |
| `allowed`    | 아니요    | `string[]` | 이 필드가 있으면 유효 모드가 이러한 값 중 하나일 때만 신호가 통과합니다.             |
| `disallowed` | 아니요    | `string[]` | 이 필드가 있으면 유효 모드가 이러한 값 중 하나일 때 신호가 실패합니다.               |

각 `authSignals` 항목은 다음을 지원합니다.

| 필드              | 필수 여부 | 유형     | 의미                                                                                                                                                                       |
| ----------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 예        | `string` | 구성된 인증 프로필에서 확인할 공급자 ID입니다.                                                                                                                             |
| `providerBaseUrl` | 아니요    | `object` | 참조되는 구성된 공급자가 허용된 기본 URL을 사용하는 경우에만 신호가 유효하도록 하는 선택적 가드입니다. 인증 별칭이 특정 API에만 유효한 경우 사용하십시오.                    |

각 `providerBaseUrl` 가드는 다음을 지원합니다.

| 필드              | 필수 여부 | 유형       | 의미                                                                                                                                                    |
| ----------------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 예        | `string`   | `baseUrl`을 확인할 공급자 구성 ID입니다.                                                                                                                |
| `defaultBaseUrl`  | 아니요    | `string`   | 공급자 구성에서 `baseUrl`을 생략한 경우 가정할 기본 URL입니다.                                                                                          |
| `allowedBaseUrls` | 예        | `string[]` | 이 인증 신호에 허용되는 기본 URL입니다. 구성된 기본 URL 또는 기본값이 정규화된 이러한 값 중 하나와 일치하지 않으면 신호를 무시합니다.                    |

## 도구 메타데이터 참조

`toolMetadata`는 도구 이름을 키로 사용하며 생성 공급자 메타데이터와 동일한 `configSignals` 및 `authSignals` 형식을 사용합니다. `contracts.tools`는 소유권을 선언합니다. `toolMetadata`는 OpenClaw가 도구 팩터리에서 `null`을 반환하는지 확인하려는 목적으로만 Plugin 런타임을 가져오지 않도록, 비용이 적게 드는 사용 가능성 증거를 선언합니다.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

`toolMetadata` 항목은 위의 공통 `configSignals`/`authSignals` 필드에 더해 `optional`(Plugin 활성화에 필수적이지 않은 도구로 표시)과 `replaySafe`(완료되지 않은 모델 턴 이후 도구 실행을 안전하게 반복할 수 있다고 표시)도 허용합니다.

도구에 `toolMetadata`가 없으면 OpenClaw는 기존 동작을 유지하며, 도구 계약이 정책과 일치할 때 소유 Plugin을 로드합니다. 팩터리가 인증/구성에 의존하는 핫 패스 도구의 경우, Plugin 작성자는 핵심이 런타임을 가져와 확인하도록 하는 대신 `toolMetadata`를 선언해야 합니다.

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택지를 설명합니다. OpenClaw는 공급자 런타임이 로드되기 전에 이를 읽습니다. 공급자 설정 목록은 공급자 런타임을 로드하지 않고 이러한 매니페스트 선택지, 설명자에서 파생된 설정 선택지 및 설치 카탈로그 메타데이터를 사용합니다.

| 필드                  | 필수 여부 | 유형                                                                  | 의미                                                                                                                |
| --------------------- | --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider`            | 예        | `string`                                                              | 이 선택 항목이 속하는 Provider ID입니다.                                                                            |
| `method`              | 예        | `string`                                                              | 디스패치할 인증 방식 ID입니다.                                                                                      |
| `choiceId`            | 예        | `string`                                                              | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 항목 ID입니다.                                                   |
| `choiceLabel`         | 아니요    | `string`                                                              | 사용자에게 표시되는 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대신 사용합니다.                                 |
| `choiceHint`          | 아니요    | `string`                                                              | 선택기에 표시되는 짧은 도움말입니다.                                                                                |
| `assistantPriority`   | 아니요    | `number`                                                              | 값이 낮을수록 어시스턴트 기반 대화형 선택기에서 먼저 정렬됩니다.                                                    |
| `assistantVisibility` | 아니요    | `"visible"` \| `"manual-only"`                                        | 수동 CLI 선택은 계속 허용하면서 어시스턴트 선택기에서는 이 선택 항목을 숨깁니다.                                    |
| `deprecatedChoiceIds` | 아니요    | `string[]`                                                            | 사용자를 이 대체 선택 항목으로 리디렉션해야 하는 레거시 선택 항목 ID입니다.                                         |
| `groupId`             | 아니요    | `string`                                                              | 관련 선택 항목을 그룹화하는 데 사용하는 선택적 그룹 ID입니다.                                                      |
| `groupLabel`          | 아니요    | `string`                                                              | 해당 그룹에 대해 사용자에게 표시되는 레이블입니다.                                                                  |
| `groupHint`           | 아니요    | `string`                                                              | 그룹에 표시되는 짧은 도움말입니다.                                                                                  |
| `onboardingFeatured`  | 아니요    | `boolean`                                                             | 대화형 온보딩 선택기의 추천 계층에서 이 그룹을 "More..." 항목보다 먼저 표시합니다.                                  |
| `optionKey`           | 아니요    | `string`                                                              | 단순한 단일 플래그 인증 흐름에 사용하는 내부 옵션 키입니다.                                                        |
| `cliFlag`             | 아니요    | `string`                                                              | `--openrouter-api-key`와 같은 CLI 플래그 이름입니다.                                                                |
| `cliOption`           | 아니요    | `string`                                                              | `--openrouter-api-key <key>`와 같은 전체 CLI 옵션 형식입니다.                                                       |
| `cliDescription`      | 아니요    | `string`                                                              | CLI 도움말에서 사용하는 설명입니다.                                                                                 |
| `onboardingScopes`    | 아니요    | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 이 선택 항목을 표시할 온보딩 화면입니다. 생략하면 기본값은 `["text-inference"]`입니다.                               |

## commandAliases 참조

Plugin이 소유한 런타임 명령 이름을 사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려 할 수 있는 경우 `commandAliases`를 사용합니다. OpenClaw는 Plugin 런타임 코드를 가져오지 않고 진단에 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 유형              | 의미                                                                        |
| ------------ | --------- | ----------------- | --------------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속하는 명령 이름입니다.                                         |
| `kind`       | 아니요    | `"runtime-slash"` | 별칭이 루트 CLI 명령이 아닌 채팅 슬래시 명령임을 나타냅니다.                |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우 CLI 작업에 사용하도록 제안할 관련 루트 CLI 명령입니다.        |

## activation 참조

Plugin이 어떤 제어 영역 이벤트에서 자신을 활성화/로드 계획에 포함해야 하는지 저비용으로 선언할 수 있는 경우 `activation`을 사용합니다.

이 블록은 플래너 메타데이터이며 수명 주기 API가 아닙니다. 런타임 동작을 등록하지 않고 `register(...)`를 대체하지 않으며, Plugin 코드가 이미 실행되었음을 보장하지도 않습니다. 활성화 플래너는 이 필드를 사용하여 후보 Plugin의 범위를 좁힌 후, `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hooks와 같은 기존 매니페스트 소유권 메타데이터로 대체합니다.

이미 소유권을 설명하는 가장 좁은 범위의 메타데이터를 우선 사용합니다. 해당 필드로 관계를 표현할 수 있으면 `providers`, `channels`, `commandAliases`, 설정 설명자 또는 `contracts`를 사용합니다. 이러한 소유권 필드로 표현할 수 없는 추가 플래너 힌트에는 `activation`을 사용합니다. `claude-cli`, `my-cli`, `google-gemini-cli`와 같은 CLI 런타임 별칭에는 최상위 `cliBackends`를 사용합니다. `activation.onAgentHarnesses`는 기존 소유권 필드가 없는 임베디드 에이전트 하네스 ID에만 사용합니다.

모든 Plugin은 `activation.onStartup`을 의도적으로 설정해야 합니다. Gateway 시작 중 Plugin을 실행해야 하는 경우에만 `true`로 설정합니다. 시작 시 Plugin이 비활성 상태이고 더 좁은 범위의 트리거에서만 로드되어야 하면 `false`로 설정합니다. 이제 `onStartup`을 생략해도 Plugin이 암시적으로 시작 시 로드되지 않습니다. 시작, 채널, 구성, 에이전트 하네스, 메모리 또는 더 좁은 범위의 기타 활성화 트리거에는 명시적인 활성화 메타데이터를 사용합니다.

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

| 필드               | 필수 여부 | 유형                                                 | 의미                                                                                                                                                                                        |
| ------------------ | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 아니요    | `boolean`                                            | 명시적인 Gateway 시작 활성화입니다. 모든 Plugin이 이 값을 설정해야 합니다. `true`이면 시작 중 Plugin을 가져오며, `false`이면 일치하는 다른 트리거가 로드를 요구하지 않는 한 시작 시 지연 로드 상태를 유지합니다. |
| `onProviders`      | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 Provider ID입니다.                                                                                                                             |
| `onAgentHarnesses` | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 임베디드 에이전트 하네스 런타임 ID입니다. CLI 백엔드 별칭에는 최상위 `cliBackends`를 사용합니다.                                                |
| `onCommands`       | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 명령 ID입니다.                                                                                                                                 |
| `onChannels`       | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 채널 ID입니다.                                                                                                                                 |
| `onRoutes`         | 아니요    | `string[]`                                           | 활성화/로드 계획에 이 Plugin을 포함해야 하는 라우트 종류입니다.                                                                                                                             |
| `onConfigPaths`    | 아니요    | `string[]`                                           | 경로가 존재하고 명시적으로 비활성화되지 않았을 때 시작/로드 계획에 이 Plugin을 포함해야 하는 루트 기준 구성 경로입니다.                                                                      |
| `onCapabilities`   | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 영역 활성화 계획에서 사용하는 광범위한 기능 힌트입니다. 가능한 경우 더 좁은 범위의 필드를 우선 사용합니다.                                                                              |

현재 실제 사용처:

- Gateway 시작 계획은 명시적인 시작 가져오기에 `activation.onStartup`을 사용합니다.
- 명령으로 트리거되는 CLI 계획은 레거시 `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체합니다.
- 에이전트 런타임 시작 계획은 임베디드 하네스에 `activation.onAgentHarnesses`를 사용하고, CLI 런타임 별칭에 최상위 `cliBackends[]`를 사용합니다.
- 채널로 트리거되는 설정/채널 계획은 명시적인 채널 활성화 메타데이터가 없으면 레거시 `channels[]` 소유권으로 대체합니다.
- 시작 Plugin 계획은 번들 브라우저 Plugin의 `browser` 블록과 같은 채널 외 루트 구성 화면에 `activation.onConfigPaths`를 사용합니다.
- Provider로 트리거되는 설정/런타임 계획은 명시적인 Provider 활성화 메타데이터가 없으면 레거시 `providers[]` 및 최상위 `cliBackends[]` 소유권으로 대체합니다.

플래너 진단은 명시적인 활성화 힌트와 매니페스트 소유권 대체를 구분할 수 있습니다. 예를 들어 `activation-command-hint`는 `activation.onCommands`가 일치했음을 의미하고, `manifest-command-alias`는 플래너가 대신 `commandAliases` 소유권을 사용했음을 의미합니다. 이러한 이유 레이블은 호스트 진단 및 테스트용입니다. Plugin 작성자는 소유권을 가장 잘 설명하는 메타데이터를 계속 선언해야 합니다.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 러너를 제공하는 경우
`qaRunners`를 사용합니다. 이 메타데이터는 가볍고 정적으로 유지합니다. Plugin
런타임은 일치하는 `qaRunnerCliRegistrations`를 내보내는 경량
`runtime-api.ts` 화면을 통해 실제 CLI 등록을 계속 소유합니다. 선택적
`adapterFactory`는 등록된 명령의 러너를 변경하지 않고 공유 QA 시나리오에
전송 기능을 노출합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "일회용 홈 서버를 대상으로 Docker 기반 Matrix 라이브 QA 레인을 실행합니다"
    }
  ]
}
```

| 필드          | 필수 여부 | 유형     | 의미                                                                         |
| ------------- | --------- | -------- | ---------------------------------------------------------------------------- |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 연결되는 하위 명령입니다. 예: `matrix`.                 |
| `description` | 아니요    | `string` | 공유 호스트에 스텁 명령이 필요할 때 사용하는 대체 도움말 텍스트입니다.       |

`adapterFactory` ID는 `commandName`과 일치해야 합니다. 매니페스트에 없는 명령의 등록을 내보내지 마십시오.

## setup 참조

런타임이 로드되기 전에 설정 및 온보딩 화면에 비용이 적게 드는 Plugin 소유 메타데이터가 필요할 때 `setup`을 사용하십시오.

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

최상위 `cliBackends`는 계속 유효하며 CLI 추론 백엔드를 계속 설명합니다. `setup.cliBackends`는 메타데이터만 사용해야 하는 제어 플레인/설정 흐름을 위한 설정 전용 설명자 화면입니다.

`setup.providers`와 `setup.cliBackends`가 있으면 설정 검색에서 설명자 우선 조회 화면으로 사용하는 것이 좋습니다. 설명자가 후보 Plugin만 좁히고 설정에 더 풍부한 설정 시점 런타임 훅이 여전히 필요하다면 `requiresRuntime: true`를 설정하고 대체 실행 경로로 `setup-api`를 유지하십시오.

OpenClaw는 일반 공급자 인증 및 환경 변수 조회에도 `setup.providers[].envVars`를 포함합니다. `providerAuthEnvVars`는 지원 중단 기간에 호환성 어댑터를 통해 계속 지원되지만, 이를 계속 사용하는 번들되지 않은 Plugin에는 매니페스트 진단이 표시됩니다. 새 Plugin은 설정/상태 환경 메타데이터를 `setup.providers[].envVars`에 배치해야 합니다.

결제 또는 조직 수준 자격 증명이 추론 자격 증명이 되지 않으면서 `resolveUsageAuth`를 활성화해야 할 때 `providerUsageAuthEnvVars`를 사용하십시오. 이러한 이름은 작업 영역 dotenv 차단, ACP 자식 프로세스 제거, 샌드박스 비밀 필터링 및 광범위한 비밀 삭제에 포함됩니다. 공급자 런타임은 계속 `resolveUsageAuth` 내부에서 값을 읽고 분류합니다.

설정 항목을 사용할 수 없거나 `setup.requiresRuntime: false`가 설정 런타임이 불필요하다고 선언하는 경우 OpenClaw는 `setup.providers[].authMethods`에서 간단한 설정 선택지를 파생할 수도 있습니다. 사용자 지정 레이블, CLI 플래그, 온보딩 범위 및 어시스턴트 메타데이터에는 명시적 `providerAuthChoices` 항목을 사용하는 것이 좋습니다.

해당 설명자만으로 설정 화면에 충분한 경우에만 `requiresRuntime: false`를 설정하십시오. OpenClaw는 명시적 `false`를 설명자 전용 계약으로 처리하며 설정 조회를 위해 `setup-api` 또는 `openclaw.setupEntry`를 실행하지 않습니다. 설명자 전용 Plugin이 이러한 설정 런타임 항목 중 하나를 계속 제공하면 OpenClaw는 추가 진단을 보고하고 해당 항목을 계속 무시합니다. `requiresRuntime`을 생략하면 레거시 대체 동작이 유지되므로 플래그 없이 설명자를 추가한 기존 Plugin이 중단되지 않습니다.

설정 조회에서 Plugin 소유의 `setup-api` 코드를 실행할 수 있으므로 정규화된 `setup.providers[].id` 및 `setup.cliBackends[]` 값은 검색된 모든 Plugin에서 고유해야 합니다. 소유권이 모호하면 검색 순서에 따라 하나를 선택하는 대신 실패 시 닫힘 방식으로 처리합니다.

설정 런타임이 실행될 때 `setup-api`가 매니페스트 설명자에 선언되지 않은 공급자 또는 CLI 백엔드를 등록하거나 설명자와 일치하는 런타임 등록이 없으면 설정 레지스트리 진단에서 설명자 불일치를 보고합니다. 이러한 진단은 추가 진단이며 레거시 Plugin을 거부하지 않습니다.

### setup.providers 참조

| 필드           | 필수 여부 | 유형       | 의미                                                                                         |
| -------------- | --------- | ---------- | -------------------------------------------------------------------------------------------- |
| `id`           | 예        | `string`   | 설정 또는 온보딩 중에 노출되는 공급자 ID입니다. 정규화된 ID를 전역적으로 고유하게 유지하십시오. |
| `authMethods`  | 아니요    | `string[]` | 전체 런타임을 로드하지 않고 이 공급자가 지원하는 설정/인증 방식 ID입니다.                     |
| `envVars`      | 아니요    | `string[]` | Plugin 런타임이 로드되기 전에 일반 설정/상태 화면에서 확인할 수 있는 환경 변수입니다.         |
| `authEvidence` | 아니요    | `object[]` | 비밀이 아닌 마커를 통해 인증할 수 있는 공급자를 위한 비용이 적은 로컬 인증 증거 검사입니다.   |

`authEvidence`는 런타임 코드를 로드하지 않고 확인할 수 있는 공급자 소유의 로컬 자격 증명 마커에 사용합니다. 이러한 검사는 비용이 적고 로컬에서만 수행되어야 합니다. 네트워크 호출, 키체인 또는 비밀 관리자 읽기, 셸 명령 및 공급자 API 탐색은 허용되지 않습니다.

지원되는 증거 항목:

| 필드               | 필수 여부 | 유형       | 의미                                                                                                                |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | 예        | `string`   | 현재는 `local-file-with-env`입니다.                                                                                 |
| `fileEnvVar`       | 아니요    | `string`   | 명시적 자격 증명 파일 경로를 포함하는 환경 변수입니다.                                                             |
| `fallbackPaths`    | 아니요    | `string[]` | `fileEnvVar`가 없거나 비어 있을 때 확인하는 로컬 자격 증명 파일 경로입니다. `${HOME}` 및 `${APPDATA}`를 지원합니다. |
| `requiresAnyEnv`   | 아니요    | `string[]` | 증거가 유효하려면 나열된 환경 변수 중 하나 이상이 비어 있지 않아야 합니다.                                        |
| `requiresAllEnv`   | 아니요    | `string[]` | 증거가 유효하려면 나열된 모든 환경 변수가 비어 있지 않아야 합니다.                                                |
| `credentialMarker` | 예        | `string`   | 증거가 있을 때 반환되는 비밀이 아닌 마커입니다.                                                                    |
| `source`           | 아니요    | `string`   | 인증/상태 출력에 표시되는 사용자용 출처 레이블입니다.                                                              |

### setup 필드

| 필드               | 필수 여부 | 유형       | 의미                                                                                                 |
| ------------------ | --------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중에 노출되는 공급자 설정 설명자입니다.                                               |
| `cliBackends`      | 아니요    | `string[]` | 설명자 우선 설정 조회에 사용되는 설정 시점 백엔드 ID입니다. 정규화된 ID를 전역적으로 고유하게 유지하십시오. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 화면이 소유하는 구성 마이그레이션 ID입니다.                                         |
| `requiresRuntime`  | 아니요    | `boolean`  | 설명자 조회 후에도 설정에 `setup-api` 실행이 필요한지 여부입니다.                                    |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로의 맵입니다. 중첩된 구성 필드에는 점을 키에 사용할 수 있지만 경로 세그먼트로 `__proto__`, `constructor` 또는 `prototype`을 사용할 수 없습니다. 설정에서 이러한 이름을 거부합니다.

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

| 필드          | 유형       | 의미                               |
| ------------- | ---------- | ---------------------------------- |
| `label`       | `string`   | 사용자에게 표시되는 필드 레이블입니다. |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.          |
| `tags`        | `string[]` | 선택적 UI 태그입니다.               |
| `advanced`    | `boolean`  | 필드를 고급으로 표시합니다.          |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string`   | 양식 입력의 자리표시자 텍스트입니다. |

## contracts 참조

OpenClaw가 Plugin 런타임을 가져오지 않고 읽을 수 있는 정적 기능 소유권 메타데이터에만 `contracts`를 사용하십시오.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

각 목록은 선택 사항입니다.

| 필드                            | 유형       | 의미                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 확장 팩터리 ID이며, 현재는 `codex-app-server`입니다.                                                                |
| `agentToolResultMiddleware`      | `string[]` | 이 Plugin이 도구 결과 미들웨어를 등록할 수 있는 런타임 ID입니다.                                                                     |
| `trustedToolPolicies`            | `string[]` | 설치된 Plugin이 등록할 수 있는 Plugin 로컬 신뢰 사전 도구 정책 ID입니다. 번들 Plugin은 이 필드 없이 정책을 등록할 수 있습니다. |
| `externalAuthProviders`          | `string[]` | 이 Plugin이 외부 인증 프로필 훅을 소유하는 공급자 ID입니다.                                                                      |
| `embeddingProviders`             | `string[]` | 메모리를 포함한 재사용 가능한 벡터 임베딩 용도로 이 Plugin이 소유하는 범용 임베딩 공급자 ID입니다.                                 |
| `speechProviders`                | `string[]` | 이 Plugin이 소유하는 음성 공급자 ID입니다.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유하는 실시간 전사 공급자 ID입니다.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유하는 실시간 음성 공급자 ID입니다.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | 이 Plugin이 소유하는, 사용 중단된 메모리 전용 임베딩 공급자 ID입니다.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유하는 미디어 이해 공급자 ID입니다.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 이 Plugin이 소유하는 전사문 소스 공급자 ID입니다.                                                                                     |
| `documentExtractors`             | `string[]` | 이 Plugin이 소유하는 문서(예: PDF) 추출기 공급자 ID입니다.                                                                  |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 이미지 생성 공급자 ID입니다.                                                                                      |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 동영상 생성 공급자 ID입니다.                                                                                      |
| `musicGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 음악 생성 공급자 ID입니다.                                                                                      |
| `webContentExtractors`           | `string[]` | 이 Plugin이 소유하는 웹 페이지 콘텐츠 추출 공급자 ID입니다.                                                                           |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유하는 웹 가져오기 공급자 ID입니다.                                                                                             |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유하는 웹 검색 공급자 ID입니다.                                                                                            |
| `workerProviders`                | `string[]` | 프로비저닝 및 프로필 기반 임대 수명 주기를 위해 이 Plugin이 소유하는 클라우드 워커 공급자 ID입니다.                                      |
| `usageProviders`                 | `string[]` | 이 Plugin이 사용량 인증 및 사용량 스냅샷 훅을 소유하는 공급자 ID입니다.                                                             |
| `migrationProviders`             | `string[]` | 이 Plugin이 `openclaw migrate`용으로 소유하는 가져오기 공급자 ID입니다.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | 프로세스 내에서 Gateway 메서드를 디스패치하는 인증된 Plugin HTTP 라우트를 위한 예약 권한입니다.                                  |
| `tools`                          | `string[]` | 이 Plugin이 소유하는 에이전트 도구 이름입니다.                                                                                                   |

`contracts.embeddedExtensionFactories`는 번들 Codex app-server 전용 확장 팩터리를 위해 유지됩니다. 번들 도구 결과 변환은 대신 `contracts.agentToolResultMiddleware`를 선언하고 `api.registerAgentToolResultMiddleware(...)`로 등록해야 합니다. 설치된 Plugin은 명시적으로 활성화되고 `contracts.agentToolResultMiddleware`에 선언한 런타임에 대해서만 동일한 미들웨어 연결 지점을 사용할 수 있습니다.

호스트 신뢰 사전 도구 정책 계층이 필요한 설치된 Plugin은 등록되는 각 로컬 ID를 `contracts.trustedToolPolicies`에 선언하고 명시적으로 활성화해야 합니다. 번들 Plugin은 기존 신뢰 정책 경로를 유지하지만, 선언되지 않은 정책 ID를 사용하는 설치된 Plugin은 등록 전에 거부됩니다. 정책 ID의 범위는 등록하는 Plugin으로 제한되므로 두 Plugin이 모두 `workflow-budget`을 선언하고 등록할 수 있지만, 단일 Plugin은 같은 로컬 ID를 두 번 등록할 수 없습니다.

런타임 `api.registerTool(...)` 등록은 `contracts.tools`와 일치해야 합니다. 도구 검색은 이 목록을 사용하여 요청된 도구를 소유할 수 있는 Plugin 런타임만 로드합니다.

`resolveExternalAuthProfiles`를 구현하는 공급자 Plugin은 `contracts.externalAuthProviders`를 선언해야 하며, 선언되지 않은 외부 인증 훅은 무시됩니다.

`resolveUsageAuth`와 `fetchUsageSnapshot`을 모두 구현하는 공급자 Plugin은 자동 검색되는 각 공급자 ID를 `contracts.usageProviders`에 선언해야 합니다. 사용량 검색은 런타임 코드를 로드하기 전에 이 계약을 읽은 다음, 선언된 소유자만 로드한 후 두 훅을 모두 확인합니다.

범용 임베딩 공급자는 `api.registerEmbeddingProvider(...)`로 등록되는 각 어댑터에 대해 `contracts.embeddingProviders`를 선언해야 합니다. 메모리 검색에서 사용하는 공급자를 포함하여 재사용 가능한 벡터 생성에는 범용 계약을 사용하십시오. `contracts.memoryEmbeddingProviders`는 사용 중단된 메모리 전용 호환성 계약이며, 기존 공급자가 범용 임베딩 공급자 연결 지점으로 마이그레이션하는 동안에만 유지됩니다.

워커 공급자는 각 `api.registerWorkerProvider(...)` ID를 `contracts.workerProviders`에 선언해야 합니다. 코어는 `provision`을 호출하기 전에 지속성 있는 의도를 저장하고, 공급자는 외부 할당 전에 설정을 검증하며, 동일한 작업 ID로 반복 호출할 경우 동일한 임대를 채택해야 합니다. 또한 코어는 검증된 해당 설정 스냅샷을 저장하고, 이름이 지정된 프로필이 변경되거나 제거된 후에도 이를 `leaseId`와 함께 `inspect({ leaseId, profile })` 및 `destroy({ leaseId, profile })`에 전달합니다. 삭제는 멱등성을 가지며, 검사는 종료된 `active` / `destroyed` / `unknown` 상태 유니온을 반환하고, SSH 개인 키 자료는 `SecretRef`를 통해서만 참조됩니다. 프로비저닝된 SSH 엔드포인트는 신뢰할 수 있는 프로비저닝 출력의 공개 `hostKey`도 정확히 `algorithm base64` 형식으로 포함해야 하며, 호스트 이름이나 주석은 포함하지 않아야 합니다. 이를 통해 코어는 연결 전에 호스트를 고정할 수 있습니다. 동적 ID 참조를 발급하는 공급자는 권위 있는 `resolveSshIdentity({ leaseId, profile, keyRef })`를 구현할 수 있으며, 이를 구현하지 않은 공급자는 코어의 범용 보안 비밀 확인자를 사용합니다. 권위 있는 `unknown`은 활성 로컬 레코드를 고립 상태로 만들며, 저장된 삭제 요청 후에는 해제가 완료되었음을 확인합니다.

`contracts.gatewayMethodDispatch`는 현재 `"authenticated-request"`를 허용합니다. 이는 의도적으로 프로세스 내에서 Gateway 제어 영역 메서드를 디스패치하는 네이티브 Plugin HTTP 라우트를 위한 API 위생 게이트이지, 악성 네이티브 Plugin에 대한 샌드박스가 아닙니다. 이미 Gateway HTTP 인증을 요구하고 철저히 검토된 번들/운영자 표면에만 사용하십시오. 권한이 부여된 라우트가 Gateway 루트 작업 허용이 닫힌 동안에도 접근 가능하려면 `auth: "gateway"`도 선언하고 라우트별 `gatewayRuntimeScopeSurface: "trusted-operator"`를 지정해야 합니다. 같은 Plugin의 일반 형제 라우트는 계속 허용 경계 뒤에 유지됩니다. 이렇게 하면 전체 Plugin에 허용 우회를 부여하지 않고도 일시 중단 상태와 재개 기능에 접근할 수 있습니다. 디스패치 외부의 파싱 및 응답 구성은 제한된 범위로 유지하십시오. 실질적이거나 변경을 수행하는 작업은 반드시 Gateway 메서드 디스패치를 거쳐야 하며, 이 디스패치가 허용 및 범위 적용을 담당합니다.

## configContracts 참조

Plugin 런타임을 가져오지 않고도 범용 코어 도우미에 필요한 매니페스트 소유 구성 동작(위험 플래그 감지, SecretRef 마이그레이션 대상 및 레거시 구성 경로 축소)에는 `configContracts`를 사용하십시오.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| 필드                         | 필수 여부 | 유형       | 의미                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 아니요       | `string[]` | 이 Plugin의 설정 시점 호환성 마이그레이션이 적용될 수 있음을 나타내는 루트 기준 구성 경로입니다. 구성에서 Plugin을 참조하지 않는 경우 범용 런타임 구성 읽기가 모든 Plugin 설정 표면을 건너뛸 수 있게 합니다.                 |
| `compatibilityRuntimePaths`   | 아니요       | `string[]` | Plugin 코드가 완전히 활성화되기 전에 이 Plugin이 런타임 중 처리할 수 있는 루트 기준 호환성 경로입니다. 모든 호환 Plugin 런타임을 가져오지 않고 번들 후보 집합을 축소해야 하는 레거시 표면에 사용하십시오. |
| `dangerousFlags`              | 아니요       | `object[]` | 활성화되었을 때 `openclaw doctor`가 안전하지 않거나 위험한 것으로 표시해야 하는 구성 리터럴입니다. 아래를 참조하십시오.                                                                                                                                   |
| `secretInputs`                | 아니요       | `object`   | SecretRef 마이그레이션/감사 대상 레지스트리가 보안 비밀 형태의 문자열로 취급해야 하는 `plugins.entries.<id>.config` 아래의 구성 경로입니다. 아래를 참조하십시오.                                                                                  |

각 `dangerousFlags` 항목은 다음을 지원합니다.

| 필드    | 필수 여부 | 유형                                  | 의미                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | 예      | `string`                              | `plugins.entries.<id>.config` 기준의 점으로 구분된 구성 경로입니다. 맵/배열 세그먼트에 `*` 와일드카드를 지원합니다. |
| `equals` | 예      | `string \| number \| boolean \| null` | 이 구성 값을 위험한 것으로 표시하는 정확한 리터럴입니다.                                                            |

`secretInputs`는 다음을 지원합니다.

| 필드                    | 필수 여부 | 유형       | 의미                                                                                                                                                                                                            |
| ----------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 아니요    | `boolean`  | 이 SecretRef 표면의 활성 여부를 결정할 때 번들 Plugin의 기본 활성화 설정을 재정의합니다. Plugin이 번들로 제공되지만 구성에서 명시적으로 활성화할 때까지 이 표면을 비활성 상태로 유지해야 하는 경우 사용합니다. |
| `paths`                 | 예        | `object[]` | 시크릿 형태의 구성 경로입니다. 각 항목에는 `path`(점으로 구분되며 `plugins.entries.<id>.config`에 상대적이고 `*` 와일드카드를 지원함)와 선택적 `expected`(현재는 `"string"`만 지원함)가 포함됩니다. |

## mediaUnderstandingProviderMetadata 참조

미디어 이해 제공자에 기본 모델, 자동 인증 폴백 우선순위 또는 런타임이 로드되기 전에 일반 코어 헬퍼에서 필요한 네이티브 문서 지원이 있는 경우 `mediaUnderstandingProviderMetadata`를 사용합니다. 키는 `contracts.mediaUnderstandingProviders`에도 선언해야 합니다.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

각 제공자 항목에는 다음이 포함될 수 있습니다.

| 필드                   | 유형                                                             | 의미                                                                                                         |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 이 제공자가 노출하는 미디어 기능입니다.                                                                     |
| `defaultModels`        | `Record<string, string>`                                         | 구성에서 모델을 지정하지 않았을 때 사용하는 기능별 기본 모델입니다.                                        |
| `autoPriority`         | `Record<string, number>`                                         | 자격 증명 기반의 자동 제공자 폴백에서 숫자가 낮을수록 먼저 정렬됩니다.                                      |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 제공자가 지원하는 네이티브 문서 입력입니다.                                                                 |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 문서 유형별 모델 재정의입니다. 해당 문서 유형에서 이미지 기반 추출을 비활성화하려면 `image: false`로 설정합니다. |

## channelConfigs 참조

채널 Plugin이 런타임 로드 전에 가벼운 구성 메타데이터를 필요로 하는 경우 `channelConfigs`를 사용합니다. 설정 항목을 사용할 수 없거나 `setup.requiresRuntime: false`가 설정 런타임이 불필요함을 선언하는 경우, 읽기 전용 채널 설정/상태 검색에서 구성된 외부 채널에 이 메타데이터를 직접 사용할 수 있습니다.

`channelConfigs`는 Plugin 매니페스트 메타데이터이며 새로운 최상위 사용자 구성 섹션이 아닙니다. 사용자는 계속해서 `channels.<channel-id>` 아래에서 채널 인스턴스를 구성합니다. OpenClaw는 Plugin 런타임 코드가 실행되기 전에 매니페스트 메타데이터를 읽어 구성된 채널을 어느 Plugin이 소유하는지 결정합니다.

채널 Plugin에서 `configSchema`와 `channelConfigs`는 서로 다른 경로를 설명합니다.

- `configSchema`는 `plugins.entries.<plugin-id>.config`의 유효성을 검사합니다.
- `channelConfigs.<channel-id>.schema`는 `channels.<channel-id>`의 유효성을 검사합니다.

`channels[]`를 선언하는 비번들 Plugin은 일치하는 `channelConfigs` 항목도 선언해야 합니다. 이러한 항목이 없어도 OpenClaw는 Plugin을 로드할 수 있지만, 콜드 경로 구성 스키마, 설정 및 Control UI 표면은 Plugin 런타임이 실행되기 전까지 채널 소유 옵션의 형태를 알 수 없습니다.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled`와 `nativeSkillsAutoEnabled`는 채널 런타임이 로드되기 전에 실행되는 명령 구성 검사를 위한 정적 `auto` 기본값을 선언할 수 있습니다. 번들 채널은 다른 패키지 소유 채널 카탈로그 메타데이터와 함께 `package.json#openclaw.channel.commands`를 통해 동일한 기본값을 게시할 수도 있습니다.

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
          "label": "홈서버 URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix 홈서버 연결",
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

| 필드          | 유형                     | 의미                                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>`의 JSON Schema입니다. 선언된 각 채널 구성 항목에 필요합니다.                            |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션의 선택적 UI 레이블, 자리표시자 및 민감 정보 힌트입니다.                            |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기와 검사 표면에 병합되는 채널 레이블입니다.                |
| `description` | `string`                 | 검사 및 카탈로그 표면에 표시되는 간단한 채널 설명입니다.                                              |
| `commands`    | `object`                 | 런타임 전 구성 검사를 위한 정적 네이티브 명령 및 네이티브 Skills 자동 기본값입니다.                   |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 우선순위가 낮은 Plugin ID입니다.                     |

### 다른 채널 Plugin 대체

다른 Plugin도 제공할 수 있는 채널 ID에서 해당 Plugin이 우선 소유자가 되어야 하는 경우 `preferOver`를 사용합니다. 일반적인 사례로는 이름이 변경된 Plugin ID, 번들 Plugin을 대체하는 독립형 Plugin 또는 구성 호환성을 위해 동일한 채널 ID를 유지하는 관리 중인 포크가 있습니다.

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

`channels.chat`이 구성되면 OpenClaw는 채널 ID와 우선 Plugin ID를 모두 고려합니다. 우선순위가 낮은 Plugin이 번들로 제공되거나 기본적으로 활성화되었다는 이유만으로 선택된 경우, OpenClaw는 유효 런타임 구성에서 해당 Plugin을 비활성화하여 하나의 Plugin이 채널과 도구를 소유하도록 합니다. 명시적인 사용자 선택이 항상 우선합니다. 사용자가 두 Plugin을 모두 명시적으로 활성화하면(`plugins.allow` 또는 실질적인 `plugins.entries` 구성을 통해) OpenClaw는 요청된 Plugin 집합을 자동으로 변경하지 않고 해당 선택을 유지하며 중복 채널/도구 진단을 보고합니다.

`preferOver`의 범위는 실제로 동일한 채널을 제공할 수 있는 Plugin ID로 제한하십시오. 이는 일반적인 우선순위 필드가 아니며 사용자 구성 키의 이름을 변경하지 않습니다.

## modelSupport 참조

Plugin 런타임이 로드되기 전에 OpenClaw가 `gpt-5.6-sol` 또는 `claude-sonnet-4.6`과 같은 축약 모델 ID에서 제공자 Plugin을 추론해야 하는 경우 `modelSupport`를 사용합니다.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다.

- 명시적인 `provider/model` 참조는 이를 소유하는 `providers` 매니페스트 메타데이터를 사용합니다.
- `modelPatterns`가 `modelPrefixes`보다 우선합니다.
- 비번들 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 비번들 Plugin이 우선합니다.
- 나머지 모호성은 사용자 또는 구성에서 제공자를 지정할 때까지 무시됩니다.

필드:

| 필드            | 유형       | 의미                                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | 축약 모델 ID에 대해 `startsWith`로 일치시키는 접두사입니다.                                |
| `modelPatterns` | `string[]` | 프로필 접미사를 제거한 후 축약 모델 ID에 대해 일치시키는 정규식 소스입니다.                |

`modelPatterns` 항목은 중첩 반복이 포함된 패턴(예: `(a+)+$`)을 거부하는 `compileSafeRegex`를 통해 컴파일됩니다. 안전성 검사에 실패한 패턴은 구문상 잘못된 정규식과 마찬가지로 아무 알림 없이 건너뜁니다. 패턴을 단순하게 유지하고 중첩 수량자를 피하십시오.

## modelCatalog 참조

Plugin 런타임을 로드하기 전에 OpenClaw가 제공자 모델 메타데이터를 알아야 하는 경우 `modelCatalog`를 사용합니다. 이는 고정 카탈로그 행, 제공자 별칭, 억제 규칙 및 검색 모드의 매니페스트 소유 소스입니다. 런타임 새로 고침은 계속 제공자 런타임 코드가 담당하지만, 매니페스트는 런타임이 필요한 시점을 코어에 알려줍니다.

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
        "reason": "Azure OpenAI Responses에서 사용할 수 없음"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

최상위 필드:

| 필드             | 유형                                                     | 의미                                                                                                              |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 이 Plugin이 소유한 제공자 ID의 카탈로그 행입니다. 키는 최상위 `providers`에도 있어야 합니다.                      |
| `aliases`        | `Record<string, object>`                                 | 카탈로그 또는 억제 계획에서 소유 제공자로 해석되어야 하는 제공자 별칭입니다.                                      |
| `suppressions`   | `object[]`                                               | 이 Plugin이 제공자별 사유로 억제하는 다른 소스의 모델 행입니다.                                                   |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 제공자 카탈로그를 매니페스트 메타데이터에서 읽을 수 있는지, 캐시로 새로 고칠 수 있는지, 런타임이 필요한지 나타냅니다. |
| `runtimeAugment` | `boolean`                                                | 매니페스트/구성 계획 이후 제공자 런타임에서 카탈로그 행을 추가해야 하는 경우에만 `true`로 설정합니다.             |

`aliases`는 모델 카탈로그 계획을 위한 제공자 소유권 조회에 사용됩니다. 별칭 대상은 동일한 Plugin이 소유한 최상위 제공자여야 합니다. 제공자로 필터링된 목록에서 별칭을 사용하면 OpenClaw는 제공자 런타임을 로드하지 않고도 소유 매니페스트를 읽고 별칭의 API/기본 URL 재정의를 적용할 수 있습니다. 별칭은 필터링되지 않은 카탈로그 목록을 확장하지 않습니다. 포괄적인 목록에는 소유자의 정규 제공자 행만 출력됩니다.

`suppressions`는 이전 제공자 런타임의 `suppressBuiltInModel` 훅을 대체합니다. 억제 항목은 제공자를 Plugin이 소유하거나, 소유 제공자를 대상으로 하는 `modelCatalog.aliases` 키로 선언된 경우에만 적용됩니다. 모델 해석 중에는 런타임 억제 훅이 더 이상 호출되지 않습니다.

제공자 필드:

| 필드                  | 유형                     | 의미                                                                                                                                                                                                                           |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseUrl`             | `string`                 | 이 제공자 카탈로그에 있는 모델의 선택적 기본 URL입니다.                                                                                                                                                                        |
| `api`                 | `ModelApi`               | 이 제공자 카탈로그에 있는 모델의 선택적 기본 API 어댑터입니다.                                                                                                                                                                 |
| `headers`             | `Record<string, string>` | 이 제공자 카탈로그에 적용되는 선택적 정적 헤더입니다.                                                                                                                                                                          |
| `defaultUtilityModel` | `string`                 | 짧은 내부 유틸리티 작업(제목, 진행 상황 설명)에 제공자가 권장하는 선택적 소형 모델 ID입니다. `agents.defaults.utilityModel`이 설정되지 않았으며 이 제공자가 에이전트의 기본 모델을 제공할 때 사용됩니다. |
| `models`              | `object[]`               | 필수 모델 행입니다. `id`가 없는 행은 무시됩니다.                                                                                                                                                                               |

모델 필드:

| 필드               | 유형                                                           | 의미                                                                      |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` 접두사가 없는 제공자 로컬 모델 ID입니다.                      |
| `name`             | `string`                                                       | 선택적 표시 이름입니다.                                                   |
| `api`              | `ModelApi`                                                     | 선택적 모델별 API 재정의입니다.                                           |
| `baseUrl`          | `string`                                                       | 선택적 모델별 기본 URL 재정의입니다.                                      |
| `headers`          | `Record<string, string>`                                       | 선택적 모델별 정적 헤더입니다.                                            |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 모델이 허용하는 모달리티입니다. 다른 값은 별도 알림 없이 삭제됩니다.      |
| `reasoning`        | `boolean`                                                      | 모델이 추론 동작을 제공하는지 여부입니다.                                 |
| `contextWindow`    | `number`                                                       | 제공자의 기본 컨텍스트 창입니다.                                          |
| `contextTokens`    | `number`                                                       | `contextWindow`와 다를 때 적용되는 선택적 유효 런타임 컨텍스트 한도입니다. |
| `maxTokens`        | `number`                                                       | 알려진 경우 최대 출력 토큰 수입니다.                                      |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 선택적 사고 수준별 모델 ID 또는 매개변수 재정의입니다.                    |
| `cost`             | `object`                                                       | 선택적 `tieredPricing`을 포함한 토큰 100만 개당 선택적 USD 가격입니다.     |
| `compat`           | `object`                                                       | OpenClaw 모델 구성 호환성과 일치하는 선택적 호환성 플래그입니다.           |
| `mediaInput`       | `object`                                                       | 모달리티별 선택적 입력 구성으로, 현재는 이미지만 지원합니다.              |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 목록 표시 상태입니다. 행이 전혀 표시되어서는 안 되는 경우에만 억제합니다. |
| `statusReason`     | `string`                                                       | 사용 가능하지 않은 상태와 함께 표시되는 선택적 사유입니다.                |
| `replaces`         | `string[]`                                                     | 이 모델이 대체하는 이전 제공자 로컬 모델 ID입니다.                        |
| `replacedBy`       | `string`                                                       | 사용 중단된 행을 대체하는 제공자 로컬 모델 ID입니다.                      |
| `tags`             | `string[]`                                                     | 선택기와 필터에서 사용하는 안정적인 태그입니다.                           |

억제 필드:

| 필드                       | 유형       | 의미                                                                                                  |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 억제할 업스트림 행의 제공자 ID입니다. 이 Plugin이 소유하거나 소유 별칭으로 선언되어야 합니다.        |
| `model`                    | `string`   | 억제할 제공자 로컬 모델 ID입니다.                                                                    |
| `reason`                   | `string`   | 억제된 행을 직접 요청할 때 표시되는 선택적 메시지입니다.                                             |
| `when.baseUrlHosts`        | `string[]` | 억제를 적용하기 전에 필요한 유효 제공자 기본 URL 호스트의 선택적 목록입니다.                         |
| `when.providerConfigApiIn` | `string[]` | 억제를 적용하기 전에 필요한 정확한 제공자 구성 `api` 값의 선택적 목록입니다.                         |

`modelCatalog`에 런타임 전용 데이터를 넣지 마십시오. 제공자로 필터링된 목록 및 선택기 화면에서 레지스트리/런타임 검색을 건너뛸 수 있을 만큼 매니페스트 행이 완전한 경우에만 `static`을 사용하십시오. 매니페스트 행이 목록에 표시할 유용한 초기 데이터 또는 보충 데이터이지만 나중에 새로 고침/캐시가 더 많은 행을 추가할 수 있는 경우 `refreshable`을 사용하십시오. 새로 고칠 수 있는 행 자체만으로는 신뢰할 수 있는 기준이 되지 않습니다. 목록을 확인하기 위해 OpenClaw가 제공자 런타임을 로드해야 하는 경우 `runtime`을 사용하십시오.

## modelIdNormalization 참조

제공자 런타임을 로드하기 전에 수행해야 하는 간단한 제공자 소유 모델 ID 정리에 `modelIdNormalization`을 사용하십시오. 이렇게 하면 짧은 모델 이름, 제공자 로컬 레거시 ID, 프록시 접두사 규칙과 같은 별칭을 핵심 모델 선택 테이블이 아닌 소유 Plugin 매니페스트에 유지할 수 있습니다.

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

| 필드                                 | 유형                    | 의미                                                                                         |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 대소문자를 구분하지 않는 정확한 모델 ID 별칭입니다. 값은 작성된 그대로 반환됩니다.          |
| `stripPrefixes`                      | `string[]`              | 별칭 조회 전에 제거할 접두사로, 레거시 제공자/모델 중복을 처리할 때 유용합니다.              |
| `prefixWhenBare`                     | `string`                | 정규화된 모델 ID에 `/`가 아직 포함되지 않았을 때 추가할 접두사입니다.                        |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 별칭 조회 후 적용되는 조건부 단독 ID 접두사 규칙으로, `modelPrefix`와 `prefix`를 키로 사용합니다. |

## providerEndpoints 참조

제공자 런타임을 로드하기 전에 일반 요청 정책이 알아야 하는 엔드포인트 분류에는 `providerEndpoints`를 사용하십시오. 각 `endpointClass`의 의미는 계속 핵심에서 소유하며, 호스트 및 기본 URL 메타데이터는 Plugin 매니페스트에서 소유합니다.

공식적으로 외부화된 제공자 Plugin은 핵심 배포판에서 제외되므로
설치되기 전에는 해당 매니페스트를 확인할 수 없습니다. Plugin 없이도
엔드포인트 분류가 계속 작동하도록 해당 `providerEndpoints`를
`scripts/lib/official-external-provider-catalog.json`에도 미러링해야 하며,
계약 테스트에서 이 미러링을 강제합니다.

엔드포인트 필드:

| 필드                           | 유형       | 의미                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`, `moonshot-native`, `google-vertex` 등 알려진 코어 엔드포인트 클래스입니다.       |
| `hosts`                        | `string[]` | 엔드포인트 클래스에 매핑되는 정확한 호스트 이름입니다.                                        |
| `hostSuffixes`                 | `string[]` | 엔드포인트 클래스에 매핑되는 호스트 접미사입니다. 도메인 접미사만 일치시키려면 `.`을 앞에 붙입니다. |
| `baseUrls`                     | `string[]` | 엔드포인트 클래스에 매핑되는 정확하게 정규화된 HTTP(S) 기본 URL입니다.                         |
| `googleVertexRegion`           | `string`   | 정확한 전역 호스트에 대한 정적 Google Vertex 리전입니다.                                      |
| `googleVertexRegionHostSuffix` | `string`   | 일치하는 호스트에서 제거하여 Google Vertex 리전 접두사를 드러내는 접미사입니다.                |

## providerRequest 참조

프로바이더 런타임을 로드하지 않고도 일반 요청 정책에 필요한 저비용 요청 호환성 메타데이터에는 `providerRequest`를 사용합니다. 동작별 페이로드 재작성은 프로바이더 런타임 훅이나 공유 프로바이더 계열 헬퍼에 유지합니다.

```json
{
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

프로바이더 필드:

| 필드                  | 유형         | 의미                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 일반 요청 호환성 결정 및 진단에서 사용하는 프로바이더 계열 레이블입니다.              |
| `compatibilityFamily` | `"moonshot"` | 공유 요청 헬퍼를 위한 선택적 프로바이더 계열 호환성 버킷입니다.                       |
| `openAICompletions`   | `object`     | OpenAI 호환 completions 요청 플래그이며, 현재는 `supportsStreamingUsage`가 있습니다.   |

## secretProviderIntegrations 참조

Plugin이 재사용 가능한 SecretRef exec 프로바이더 프리셋을 게시할 수 있는 경우 `secretProviderIntegrations`를 사용합니다. OpenClaw는 Plugin 런타임이 로드되기 전에 이 메타데이터를 읽고, Plugin 소유권을 `secrets.providers.<alias>.pluginIntegration`에 저장하며, 실제 시크릿 확인은 SecretRef 런타임에 맡깁니다. 프리셋은 번들 Plugin과 git 및 ClawHub 설치처럼 관리되는 Plugin 설치 루트에서 검색된 설치 Plugin에만 노출됩니다.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "팀 시크릿",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

맵 키는 통합 ID입니다. `providerAlias`를 생략하면 OpenClaw는 통합 ID를 SecretRef 프로바이더 별칭으로 사용합니다. 프로바이더 별칭은 일반적인 SecretRef 프로바이더 별칭 패턴과 일치해야 합니다. 예를 들면 `team-secrets` 또는 `onepassword-work`입니다.

운영자가 프리셋을 선택하면 OpenClaw는 다음과 같은 프로바이더 참조를 작성합니다.

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

시작/다시 로드 시 OpenClaw는 현재 Plugin 매니페스트 메타데이터를 로드하고, 소유 Plugin이 설치되어 활성 상태인지 확인한 다음, 매니페스트에서 exec 명령을 구체화하여 해당 프로바이더를 확인합니다. Plugin을 비활성화하거나 제거하면 활성 SecretRef에 대한 프로바이더가 취소됩니다. 독립형 exec 구성을 원하는 운영자는 수동 `command`/`args` 프로바이더를 직접 작성할 수 있습니다.

현재는 `source: "exec"` 프리셋만 지원합니다. `command`는 `${node}`여야 하며, `args[0]`은 `./`로 시작하는 Plugin 루트 기준 리졸버 스크립트여야 합니다. OpenClaw는 시작/다시 로드 시 이를 현재 Node 실행 파일과 Plugin 내부 스크립트의 절대 경로로 구체화합니다. `--require`, `--import`, `--loader`, `--env-file`, `--eval`, `--print` 같은 Node 옵션은 매니페스트 프리셋 계약에 포함되지 않습니다. Node 이외의 명령이 필요한 운영자는 독립형 수동 exec 프로바이더를 직접 구성할 수 있습니다.

OpenClaw는 Plugin 루트와 `${node}` 프리셋의 경우 현재 Node 실행 파일 디렉터리에서 매니페스트 프리셋의 `trustedDirs`를 파생합니다. 매니페스트에 작성된 `trustedDirs`는 무시됩니다. `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, `allowInsecurePath` 같은 다른 exec 프로바이더 옵션은 일반 SecretRef exec 프로바이더 구성으로 그대로 전달됩니다.

## modelPricing 참조

프로바이더가 런타임 로드 전에 제어 영역의 가격 책정 동작을 제어해야 하는 경우 `modelPricing`을 사용합니다. Gateway 가격 책정 캐시는 프로바이더 런타임 코드를 가져오지 않고 이 메타데이터를 읽습니다.

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

프로바이더 필드:

| 필드         | 유형              | 의미                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter 또는 LiteLLM 가격을 절대 가져오지 않아야 하는 로컬/자체 호스팅 프로바이더에는 `false`로 설정합니다. |
| `openRouter` | `false \| object` | OpenRouter 가격 조회 매핑입니다. `false`는 이 프로바이더의 OpenRouter 조회를 비활성화합니다.          |
| `liteLLM`    | `false \| object` | LiteLLM 가격 조회 매핑입니다. `false`는 이 프로바이더의 LiteLLM 조회를 비활성화합니다.                |

소스 필드:

| 필드                       | 유형               | 의미                                                                                                                    |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw 프로바이더 ID와 다른 경우 사용하는 외부 카탈로그 프로바이더 ID입니다. 예를 들어 `zai` 프로바이더의 `z-ai`입니다. |
| `passthroughProviderModel` | `boolean`          | 슬래시가 포함된 모델 ID를 중첩된 프로바이더/모델 참조로 처리합니다. OpenRouter 같은 프록시 프로바이더에 유용합니다.       |
| `modelIdTransforms`        | `"version-dots"[]` | 추가 외부 카탈로그 모델 ID 변형입니다. `version-dots`는 `claude-opus-4.6` 같은 점으로 구분된 버전 ID를 시도합니다.      |

### OpenClaw 프로바이더 인덱스

OpenClaw 프로바이더 인덱스는 아직 Plugin이 설치되지 않았을 수 있는 프로바이더를 위한 OpenClaw 소유의 미리 보기 메타데이터입니다. 이는 Plugin 매니페스트의 일부가 아닙니다. 설치된 Plugin에 대한 권한은 계속 Plugin 매니페스트에 있습니다. 프로바이더 인덱스는 프로바이더 Plugin이 설치되지 않은 경우 향후 설치 가능한 프로바이더 및 설치 전 모델 선택기 화면에서 사용하는 내부 폴백 계약입니다.

카탈로그 권한 순서:

1. 사용자 구성.
2. 설치된 Plugin 매니페스트 `modelCatalog`.
3. 명시적 새로 고침으로 생성된 모델 카탈로그 캐시.
4. OpenClaw 프로바이더 인덱스 미리 보기 행.

프로바이더 인덱스에는 시크릿, 활성화 상태, 런타임 훅 또는 실제 계정별 모델 데이터가 포함되어서는 안 됩니다. 미리 보기 카탈로그는 Plugin 매니페스트와 동일한 `modelCatalog` 프로바이더 행 형태를 사용하지만, `api`, `baseUrl`, 가격 책정 또는 호환성 플래그 같은 런타임 어댑터 필드를 설치된 Plugin 매니페스트와 의도적으로 일치시키는 경우가 아니라면 안정적인 표시 메타데이터로 제한해야 합니다. 실제 `/models` 검색을 사용하는 프로바이더는 일반 목록 표시나 온보딩에서 프로바이더 API를 호출하는 대신 명시적 모델 카탈로그 캐시 경로를 통해 새로 고친 행을 작성해야 합니다.

프로바이더 인덱스 항목에는 Plugin이 코어 외부로 이동했거나 아직 설치되지 않은 프로바이더를 위한 설치 가능 Plugin 메타데이터도 포함될 수 있습니다. 이 메타데이터는 채널 카탈로그 패턴을 따릅니다. 패키지 이름, npm 설치 사양, 예상 무결성 및 저비용 인증 선택지 레이블이면 설치 가능한 설정 옵션을 표시하기에 충분합니다. Plugin이 설치되면 해당 매니페스트가 우선하며, 해당 프로바이더의 프로바이더 인덱스 항목은 무시됩니다.

`openclaw doctor --fix`는 제한적으로 정해진 기존 최상위 매니페스트 기능 키 집합을 `contracts.*`로 마이그레이션합니다. 해당 키는 `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `tools`입니다. 이 키들 또는 다른 기능 목록은 더 이상 최상위 매니페스트 필드로 읽히지 않으며, 일반 매니페스트 로딩은 `contracts` 아래에 있는 경우에만 인식합니다.

## 매니페스트와 package.json 비교

두 파일은 서로 다른 역할을 합니다.

| 파일                   | 용도                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드 실행 전에 반드시 존재해야 하는 검색, 구성 유효성 검사, 인증 선택지 메타데이터 및 UI 힌트                      |
| `package.json`         | npm 메타데이터, 종속성 설치 및 진입점, 설치 제한, 설정 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록                |

메타데이터를 어디에 배치해야 할지 확실하지 않다면 다음 규칙을 사용합니다.

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣습니다.
- 패키징, 진입 파일 또는 npm 설치 동작에 관한 것이라면 `package.json`에 넣습니다.

### 검색에 영향을 주는 package.json 필드

일부 런타임 이전 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json` 대신 `package.json`의 `openclaw` 블록에 있습니다. `openclaw.bundle`과 `openclaw.bundle.json`은 OpenClaw Plugin 계약이 아닙니다. 네이티브 Plugin은 `openclaw.plugin.json`과 아래에서 지원되는 `package.json#openclaw` 필드를 함께 사용해야 합니다.

중요한 예:

| 필드                                                                                       | 의미                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | 네이티브 Plugin 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                                     |
| `openclaw.runtimeExtensions`                                                               | 설치된 패키지의 빌드된 JavaScript 런타임 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                             |
| `openclaw.setupEntry`                                                                      | 온보딩, 지연된 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중에 사용되는 경량 설정 전용 진입점입니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                  |
| `openclaw.runtimeSetupEntry`                                                               | 설치된 패키지의 빌드된 JavaScript 설정 진입점을 선언합니다. `setupEntry`가 필요하며, 실제로 존재하고 Plugin 패키지 디렉터리 내부에 있어야 합니다.                                      |
| `openclaw.channel`                                                                         | 레이블, 문서 경로, 별칭, 선택 문구와 같은 간단한 채널 카탈로그 메타데이터입니다.                                                                                                       |
| `openclaw.channel.commands`                                                                | 채널 런타임이 로드되기 전에 구성, 감사, 명령 목록 화면에서 사용하는 정적 네이티브 명령 및 네이티브 스킬 자동 기본값 메타데이터입니다.                                                   |
| `openclaw.channel.configuredState`                                                         | 전체 채널 런타임을 로드하지 않고도 "환경 변수만 사용하는 설정이 이미 존재하는가?"에 답할 수 있는 경량 구성 상태 검사기 메타데이터입니다.                                               |
| `openclaw.channel.persistedAuthState`                                                      | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 영구 인증 상태 검사기 메타데이터입니다.                                                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 번들 및 외부 게시 Plugin의 설치/업데이트 힌트입니다.                                                                                                                                 |
| `openclaw.install.defaultChoice`                                                           | 여러 설치 소스를 사용할 수 있을 때 선호하는 설치 경로입니다.                                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` 또는 `>=2026.5.1-beta.1`과 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                             |
| `openclaw.compat.pluginApi`                                                                | `>=2026.5.27`과 같은 semver 하한을 사용하는, 이 패키지에 필요한 최소 OpenClaw Plugin API 범위입니다.                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...`와 같은 예상 npm 배포 무결성 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이 값과 대조하여 검증합니다.                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 구성이 유효하지 않을 때 제한적인 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                           |
| `openclaw.install.requiredPlatformPackages`                                                | 잠금 파일의 플랫폼 제약 조건이 현재 호스트와 일치할 때 반드시 구체화되어야 하는 npm 패키지 별칭입니다.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 수신 대기 전에 설정 런타임 채널 화면을 로드한 다음, 구성된 전체 채널 Plugin의 로드를 수신 대기 이후 활성화 시점까지 지연할 수 있게 합니다.                                            |

매니페스트 메타데이터는 런타임이 로드되기 전에 온보딩에 표시할 공급자/채널/설정 선택지를 결정합니다. `package.json#openclaw.install`은 사용자가 이러한 선택지 중 하나를 고를 때 해당 Plugin을 가져오거나 활성화하는 방법을 온보딩에 알려 줍니다. 설치 힌트를 `openclaw.plugin.json`으로 이동하지 마십시오.

`openclaw.install.minHostVersion`은 번들되지 않은 Plugin 소스의 설치 및 매니페스트 레지스트리 로드 중에 적용됩니다. 유효하지 않은 값은 거부되며, 유효하지만 더 최신인 값이 지정된 외부 Plugin은 이전 호스트에서 건너뜁니다. 번들 소스 Plugin은 호스트 체크아웃과 동일한 버전으로 관리된다고 가정합니다.

`openclaw.install.requiredPlatformPackages`는 선택적 플랫폼별 별칭을 통해 필수 네이티브 바이너리를 제공하는 npm 패키지용입니다. 지원되는 각 플랫폼 별칭의 기본 npm 패키지 이름을 나열하십시오. npm 설치 중 OpenClaw는 잠금 파일 제약 조건이 현재 호스트와 일치하는 선언된 별칭만 검증합니다. npm이 성공을 보고했지만 해당 별칭을 누락한 경우, OpenClaw는 새 캐시로 한 번 재시도하고 별칭이 여전히 없으면 설치를 롤백합니다.

`openclaw.compat.pluginApi`는 번들되지 않은 Plugin 소스의 패키지 설치 중에 적용됩니다. 패키지가 빌드된 기준인 OpenClaw Plugin SDK/런타임 API 하한에 사용하십시오. Plugin 패키지에 더 새로운 API가 필요하지만 다른 흐름을 위해 더 낮은 설치 힌트를 유지해야 하는 경우 `minHostVersion`보다 엄격하게 지정할 수 있습니다. 공식 OpenClaw 릴리스 동기화는 기본적으로 기존 공식 Plugin API 하한을 OpenClaw 릴리스 버전으로 올리지만, 패키지가 의도적으로 이전 호스트를 지원하는 경우 Plugin 전용 릴리스는 더 낮은 하한을 유지할 수 있습니다. 패키지 버전만 호환성 계약으로 사용하지 마십시오. `peerDependencies.openclaw`는 npm 패키지 메타데이터로 유지되며, OpenClaw는 설치 호환성을 결정할 때 `openclaw.compat.pluginApi` 계약을 사용합니다.

공식 주문형 설치 메타데이터는 Plugin이 ClawHub에 게시된 경우 `clawhubSpec`을 사용해야 합니다. 온보딩은 이를 선호하는 원격 소스로 취급하고 설치 후 ClawHub 아티팩트 정보를 기록합니다. 아직 ClawHub으로 이전되지 않은 패키지에는 `npmSpec`이 호환성 폴백으로 유지됩니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 포함됩니다. 예: `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. 공식 외부 카탈로그 항목은 가져온 npm 아티팩트가 고정된 릴리스와 더 이상 일치하지 않을 경우 업데이트 흐름이 실패하도록 정확한 사양과 `expectedIntegrity`를 함께 지정해야 합니다. 대화형 온보딩은 호환성을 위해 기본 패키지 이름과 dist-tag를 포함한 신뢰할 수 있는 레지스트리 npm 사양을 계속 제공합니다. 카탈로그 진단은 정확한 소스, 유동 소스, 무결성 고정 소스, 무결성 누락 소스, 패키지 이름 불일치 소스, 유효하지 않은 기본 선택 소스를 구분할 수 있습니다. 또한 `expectedIntegrity`가 있지만 이를 고정할 수 있는 유효한 npm 소스가 없는 경우 경고합니다. `expectedIntegrity`가 있으면 설치/업데이트 흐름에서 이를 적용하며, 생략하면 무결성 고정 없이 레지스트리 확인 결과를 기록합니다.

상태, 채널 목록 또는 SecretRef 검색에서 전체 런타임을 로드하지 않고 구성된 계정을 식별해야 하는 경우 채널 Plugin은 `openclaw.setupEntry`를 제공해야 합니다. 설정 진입점은 채널 메타데이터와 설정에 안전한 구성, 상태, 비밀 정보 어댑터를 노출해야 합니다. 네트워크 클라이언트, Gateway 리스너, 전송 런타임은 기본 확장 진입점에 유지하십시오.

런타임 진입점 필드는 소스 진입점 필드의 패키지 경계 검사를 재정의하지 않습니다. 예를 들어 `openclaw.runtimeExtensions`를 사용해도 경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 제한되어 있습니다. 임의로 손상된 구성을 설치 가능하게 만들지 않습니다. 현재는 번들 Plugin 경로 누락이나 동일한 번들 Plugin의 오래된 `channels.<id>` 항목처럼 특정한 오래된 번들 Plugin 업그레이드 실패에서 설치 흐름이 복구되는 것만 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하며 운영자가 `openclaw doctor --fix`를 실행하도록 안내합니다.

`openclaw.channel.persistedAuthState`는 소형 검사기 모듈을 위한 패키지 메타데이터입니다.

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

전체 채널 Plugin이 로드되기 전에 설정, Doctor, 상태 또는 읽기 전용 존재 여부 흐름에서 간단한 예/아니요 인증 확인이 필요한 경우 사용하십시오. 영구 인증 상태는 구성된 채널 상태가 아닙니다. 이 메타데이터를 사용하여 Plugin을 자동 활성화하거나, 런타임 종속성을 복구하거나, 채널 런타임의 로드 여부를 결정하지 마십시오. 대상 내보내기는 영구 상태만 읽는 작은 함수여야 합니다. 전체 채널 런타임 배럴을 통해 라우팅하지 마십시오.

`openclaw.channel.configuredState`는 환경 변수만 사용하는 간단한 구성 상태 검사를 위해 동일한 형태를 따릅니다.

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

채널이 환경 변수나 기타 작은 비런타임 입력으로 구성 상태에 답할 수 있을 때 사용하십시오. 검사에 전체 구성 확인 또는 실제 채널 런타임이 필요한 경우에는 해당 로직을 Plugin의 `config.hasConfiguredState` 훅에 유지하십시오.

## 검색 우선순위(중복 Plugin ID)

OpenClaw는 다음 순서로 확인하는 세 루트에서 Plugin을 검색합니다. OpenClaw와 함께 제공되는 번들 Plugin, 전역 설치 루트(`~/.openclaw/extensions`), 현재 작업 공간 루트(`<workspace>/.openclaw/extensions`) 및 명시적인 `plugins.load.paths` 항목입니다.

두 검색 결과가 동일한 `id`를 공유하는 경우 **우선순위가 가장 높은** 매니페스트만 유지하며, 우선순위가 낮은 중복 항목은 함께 로드하지 않고 삭제합니다. 우선순위는 높은 순서부터 다음과 같습니다.

1. **구성에서 선택됨** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **추적된 설치 기록과 일치하는 전역 설치** — `openclaw plugin install`/`openclaw plugin update`를 통해 설치되어 OpenClaw의 설치 추적 기능이 동일한 ID로 인식하는 Plugin입니다. 해당 ID가 번들 Plugin에도 속하는 경우에도 적용됩니다.
3. **번들** — OpenClaw와 함께 제공되는 Plugin
4. **작업 공간** — 현재 작업 공간을 기준으로 검색된 Plugin
5. 그 밖에 검색된 모든 후보

영향은 다음과 같습니다.

- 작업 공간 또는 전역 루트에 추적되지 않은 상태로 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 않습니다.
- 번들 Plugin을 재정의하려면 해당 ID로 `openclaw plugin install`을 실행하여 추적된 전역 설치가 번들 복사본보다 우선하도록 하거나, `plugins.entries.<id>`를 통해 특정 경로를 고정하여 구성에서 선택된 우선순위로 적용되게 하십시오.
- 중복 항목 삭제는 Doctor 및 시작 진단에서 폐기된 복사본을 가리킬 수 있도록 로그에 기록됩니다.
- 구성에서 선택된 중복 재정의는 진단에서 명시적 재정의로 표현되지만, 오래된 포크와 의도하지 않은 가림이 계속 표시되도록 경고도 발생합니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 포함하여 배포해야 합니다.** 구성을 허용하지 않는 경우에도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성을 읽고 쓸 때 검증됩니다.
- 번들 Plugin을 새 구성 키로 확장하거나 포크하는 경우 해당 Plugin의 `openclaw.plugin.json` `configSchema`도 동시에 업데이트하십시오. 번들 Plugin 스키마는 엄격하므로 `configSchema.properties`에 `myNewKey`를 추가하지 않은 채 사용자 구성에 `plugins.entries.<id>.config.myNewKey`를 추가하면 Plugin 런타임이 로드되기 전에 거부됩니다.

스키마 확장 예시:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## 검증 동작

- 알 수 없는 `channels.*` 키는 채널 ID가 Plugin 매니페스트에 선언되어 있지 않으면 **오류**입니다. 동일한 ID가 `plugins.allow`, `plugins.entries` 또는 `plugins.installs`에도 나타나는 경우(참조되지만 현재 검색할 수 없는 Plugin)에는 OpenClaw가 이를 **경고**로 낮춥니다.
- 알 수 없는 Plugin ID를 참조하는 `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`는 오류가 아니라 **경고**("오래된 구성 항목이 무시됨")이므로 업그레이드하거나 Plugin이 제거 또는 이름 변경되어도 Gateway 시작이 차단되지 않습니다.
- 알 수 없는 Plugin ID를 참조하는 `plugins.slots.memory`는 **오류**입니다. 단, 알려진 공식 외부 Plugin인 `memory-lancedb`는 예외로 경고만 표시됩니다.
- Plugin이 설치되어 있지만 매니페스트나 스키마가 손상되었거나 누락된 경우 검증에 실패하며 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**된 경우 구성은 유지되며 Doctor와 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하십시오.

## 참고 사항

- 로컬 파일 시스템에서 로드하는 경우를 포함하여 **네이티브 OpenClaw Plugin에는 매니페스트가 필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, 매니페스트는 검색과 검증에만 사용됩니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로 최종 값이 객체이기만 하면 주석, 후행 쉼표, 따옴표 없는 키가 허용됩니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 사용자 정의 최상위 키는 사용하지 마십시오.
- Plugin에 필요하지 않은 경우 `channels`, `providers`, `cliBackends`, `skills`를 모두 생략할 수 있습니다.
- `providerCatalogEntry`는 가볍게 유지해야 하며 광범위한 런타임 코드를 가져오지 않아야 합니다. 요청 시점 실행이 아니라 정적 제공자 카탈로그 메타데이터나 범위가 좁은 검색 설명자에 사용하십시오.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다. `kind: "memory"`는 `plugins.slots.memory`(기본값 `memory-core`)를 통해, `kind: "context-engine"`은 `plugins.slots.contextEngine`(기본값 `legacy`)을 통해 선택됩니다.
- 배타적 Plugin 종류는 이 매니페스트에 선언하십시오. 런타임 진입점의 `OpenClawPluginDefinition.kind`는 더 이상 권장되지 않으며 이전 Plugin을 위한 호환성 폴백으로만 유지됩니다.
- 환경 변수 메타데이터(`setup.providers[].envVars`, 더 이상 권장되지 않는 `providerAuthEnvVars`, `channelEnvVars`)는 선언 용도로만 사용됩니다. 상태, 감사, Cron 전달 검증 및 기타 읽기 전용 영역에서도 환경 변수를 구성된 것으로 간주하기 전에 Plugin 신뢰도와 실질적인 활성화 정책을 적용합니다.
- 제공자 코드가 필요한 런타임 마법사 메타데이터는 [제공자 런타임 훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하십시오.
- Plugin이 네이티브 모듈에 의존하는 경우 빌드 단계와 패키지 관리자 허용 목록 요구 사항(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`)을 문서화하십시오.

## 관련 문서

<CardGroup cols={3}>
  <Card title="Plugin 빌드" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin 아키텍처" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처 및 기능 모델.
  </Card>
  <Card title="SDK 개요" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 가져오기.
  </Card>
</CardGroup>
