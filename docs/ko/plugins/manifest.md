---
read_when:
    - OpenClaw 플러그인을 빌드하고 있습니다
    - 플러그인 구성 스키마를 제공하거나 플러그인 검증 오류를 디버그해야 합니다
summary: 플러그인 매니페스트 + JSON 스키마 요구 사항(엄격한 구성 검증)
title: 플러그인 매니페스트
x-i18n:
    generated_at: "2026-04-11T02:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# 플러그인 매니페스트 (`openclaw.plugin.json`)

이 페이지는 **네이티브 OpenClaw 플러그인 매니페스트**만을 위한 문서입니다.

호환 가능한 번들 레이아웃은 [플러그인 번들](/ko/plugins/bundles)을 참조하세요.

호환 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트 레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는 `openclaw.plugin.json` 스키마에 대해 검증하지는 않습니다.

호환 번들의 경우, OpenClaw는 현재 레이아웃이 OpenClaw 런타임 기대치와 일치할 때 번들 메타데이터, 선언된 Skills 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값, Claude 번들 LSP 기본값, 지원되는 훅 팩을 읽습니다.

모든 네이티브 OpenClaw 플러그인은 반드시 **플러그인 루트**에 `openclaw.plugin.json` 파일을 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 **플러그인 코드를 실행하지 않고도** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면 플러그인 오류로 처리되며 구성 검증이 차단됩니다.

전체 플러그인 시스템 가이드는 [플러그인](/ko/tools/plugin)을 참조하세요.
네이티브 capability 모델과 현재 외부 호환성 지침은 [Capability model](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 플러그인 코드를 로드하기 전에 읽는 메타데이터입니다.

용도:

- 플러그인 식별자
- 구성 검증
- 플러그인 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- 플러그인 런타임이 로드되기 전에 해석되어야 하는 별칭 및 자동 활성화 메타데이터
- 플러그인 런타임이 로드되기 전에 플러그인을 자동 활성화해야 하는 축약 모델 계열 소유 메타데이터
- 번들 호환 배선 및 계약 커버리지에 사용되는 정적 capability 소유 스냅샷
- 런타임을 로드하지 않고도 카탈로그 및 검증 표면에 병합되어야 하는 채널별 구성 메타데이터
- 구성 UI 힌트

다음 용도로는 사용하지 마세요:

- 런타임 동작 등록
- 코드 엔트리포인트 선언
- npm 설치 메타데이터

이들은 플러그인 코드와 `package.json`에 속합니다.

## 최소 예제

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

## 확장 예제

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter 제공자 플러그인",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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

| 필드                                | 필수 여부 | 유형                             | 의미                                                                                                                                                                                                         |
| ----------------------------------- | --------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | 예        | `string`                         | 정식 플러그인 ID입니다. 이 ID는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                      |
| `configSchema`                      | 예        | `object`                         | 이 플러그인 구성에 대한 인라인 JSON 스키마입니다.                                                                                                                                                            |
| `enabledByDefault`                  | 아니요    | `true`                           | 번들 플러그인을 기본적으로 활성화된 상태로 표시합니다. 기본적으로 비활성화된 상태로 두려면 이 필드를 생략하거나 `true`가 아닌 값을 설정하세요.                                                            |
| `legacyPluginIds`                   | 아니요    | `string[]`                       | 이 정식 플러그인 ID로 정규화되는 레거시 ID입니다.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | 아니요    | `string[]`                       | 인증, 구성 또는 모델 참조에서 언급될 때 이 플러그인을 자동 활성화해야 하는 제공자 ID입니다.                                                                                                                  |
| `kind`                              | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 플러그인 종류를 선언합니다.                                                                                                                                            |
| `channels`                          | 아니요    | `string[]`                       | 이 플러그인이 소유하는 채널 ID입니다. 검색 및 구성 검증에 사용됩니다.                                                                                                                                        |
| `providers`                         | 아니요    | `string[]`                       | 이 플러그인이 소유하는 제공자 ID입니다.                                                                                                                                                                      |
| `modelSupport`                      | 아니요    | `object`                         | 런타임 전에 플러그인을 자동 로드하는 데 사용되는 매니페스트 소유 축약 모델 계열 메타데이터입니다.                                                                                                           |
| `cliBackends`                       | 아니요    | `string[]`                       | 이 플러그인이 소유하는 CLI 추론 백엔드 ID입니다. 명시적 구성 참조로부터 시작 시 자동 활성화하는 데 사용됩니다.                                                                                              |
| `commandAliases`                    | 아니요    | `object[]`                       | 런타임이 로드되기 전에 플러그인 인식 구성 및 CLI 진단을 생성해야 하는, 이 플러그인이 소유하는 명령 이름입니다.                                                                                              |
| `providerAuthEnvVars`               | 아니요    | `Record<string, string[]>`       | OpenClaw가 플러그인 코드를 로드하지 않고도 검사할 수 있는 저비용 제공자 인증 환경 변수 메타데이터입니다.                                                                                                    |
| `providerAuthAliases`               | 아니요    | `Record<string, string>`         | 예를 들어 기본 제공자 API 키와 인증 프로필을 공유하는 코딩 제공자처럼, 인증 조회 시 다른 제공자 ID를 재사용해야 하는 제공자 ID입니다.                                                                      |
| `channelEnvVars`                    | 아니요    | `Record<string, string[]>`       | OpenClaw가 플러그인 코드를 로드하지 않고도 검사할 수 있는 저비용 채널 환경 변수 메타데이터입니다. 일반 시작/구성 도우미가 인식해야 하는 환경 변수 기반 채널 설정 또는 인증 표면에 사용하세요.              |
| `providerAuthChoices`               | 아니요    | `object[]`                       | 온보딩 선택기, 선호 제공자 해석, 간단한 CLI 플래그 배선을 위한 저비용 인증 선택 메타데이터입니다.                                                                                                           |
| `contracts`                         | 아니요    | `object`                         | 음성, 실시간 전사, 실시간 음성, media-understanding, 이미지 생성, 음악 생성, 비디오 생성, 웹 가져오기, 웹 검색, 도구 소유권에 대한 정적 번들 capability 스냅샷입니다.                                      |
| `channelConfigs`                    | 아니요    | `Record<string, object>`         | 런타임이 로드되기 전에 검색 및 검증 표면에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다.                                                                                                             |
| `skills`                            | 아니요    | `string[]`                       | 플러그인 루트를 기준으로 한 로드할 Skills 디렉터리입니다.                                                                                                                                                    |
| `name`                              | 아니요    | `string`                         | 사람이 읽을 수 있는 플러그인 이름입니다.                                                                                                                                                                     |
| `description`                       | 아니요    | `string`                         | 플러그인 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                    |
| `version`                           | 아니요    | `string`                         | 정보 제공용 플러그인 버전입니다.                                                                                                                                                                             |
| `uiHints`                           | 아니요    | `Record<string, object>`         | 구성 필드에 대한 UI 라벨, 플레이스홀더, 민감도 힌트입니다.                                                                                                                                                   |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 제공자 런타임이 로드되기 전에 이를 읽습니다.

| 필드                  | 필수 여부 | 유형                                            | 의미                                                                                                      |
| --------------------- | --------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | 예        | `string`                                        | 이 선택이 속한 제공자 ID입니다.                                                                           |
| `method`              | 예        | `string`                                        | 디스패치할 인증 메서드 ID입니다.                                                                          |
| `choiceId`            | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용되는 안정적인 인증 선택 ID입니다.                                              |
| `choiceLabel`         | 아니요    | `string`                                        | 사용자에게 표시되는 라벨입니다. 생략하면 OpenClaw는 `choiceId`로 대체합니다.                              |
| `choiceHint`          | 아니요    | `string`                                        | 선택기에 표시되는 짧은 도움말 텍스트입니다.                                                               |
| `assistantPriority`   | 아니요    | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                           |
| `assistantVisibility` | 아니요    | `"visible"` \| `"manual-only"`                  | assistant 선택기에서는 숨기지만 수동 CLI 선택은 계속 허용합니다.                                          |
| `deprecatedChoiceIds` | 아니요    | `string[]`                                      | 사용자를 이 대체 선택으로 리디렉션해야 하는 레거시 선택 ID입니다.                                         |
| `groupId`             | 아니요    | `string`                                        | 관련 선택을 묶기 위한 선택적 그룹 ID입니다.                                                               |
| `groupLabel`          | 아니요    | `string`                                        | 해당 그룹에 대한 사용자 표시 라벨입니다.                                                                  |
| `groupHint`           | 아니요    | `string`                                        | 그룹에 대한 짧은 도움말 텍스트입니다.                                                                     |
| `optionKey`           | 아니요    | `string`                                        | 단일 플래그 인증 흐름을 위한 내부 옵션 키입니다.                                                          |
| `cliFlag`             | 아니요    | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                        |
| `cliOption`           | 아니요    | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형식입니다.                                               |
| `cliDescription`      | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                         |
| `onboardingScopes`    | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택이 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.               |

## commandAliases 참조

사용자가 실수로 플러그인 런타임 명령 이름을 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려고 할 수 있을 때, 해당 명령을 플러그인이 소유한다면 `commandAliases`를 사용하세요. OpenClaw는 플러그인 런타임 코드를 가져오지 않고도 진단을 위해 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 유형              | 의미                                                                            |
| ------------ | --------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 플러그인에 속한 명령 이름입니다.                                             |
| `kind`       | 아니요    | `"runtime-slash"` | 이 별칭을 루트 CLI 명령이 아닌 채팅 슬래시 명령으로 표시합니다.                 |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우 CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.                  |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로 매핑되는 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 키",
      "help": "OpenRouter 요청에 사용됨",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다:

| 필드          | 유형       | 의미                                    |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 사용자에게 표시되는 필드 라벨입니다.     |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.               |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                   |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.        |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 정보로 표시합니다. |
| `placeholder` | `string`   | 입력 폼용 플레이스홀더 텍스트입니다.     |

## contracts 참조

`contracts`는 OpenClaw가 플러그인 런타임을 가져오지 않고도 읽을 수 있는 정적 capability 소유 메타데이터에만 사용하세요.

```json
{
  "contracts": {
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

| 필드                             | 유형       | 의미                                                     |
| -------------------------------- | ---------- | -------------------------------------------------------- |
| `speechProviders`                | `string[]` | 이 플러그인이 소유하는 음성 제공자 ID입니다.             |
| `realtimeTranscriptionProviders` | `string[]` | 이 플러그인이 소유하는 실시간 전사 제공자 ID입니다.      |
| `realtimeVoiceProviders`         | `string[]` | 이 플러그인이 소유하는 실시간 음성 제공자 ID입니다.      |
| `mediaUnderstandingProviders`    | `string[]` | 이 플러그인이 소유하는 media-understanding 제공자 ID입니다. |
| `imageGenerationProviders`       | `string[]` | 이 플러그인이 소유하는 이미지 생성 제공자 ID입니다.      |
| `videoGenerationProviders`       | `string[]` | 이 플러그인이 소유하는 비디오 생성 제공자 ID입니다.      |
| `webFetchProviders`              | `string[]` | 이 플러그인이 소유하는 웹 가져오기 제공자 ID입니다.      |
| `webSearchProviders`             | `string[]` | 이 플러그인이 소유하는 웹 검색 제공자 ID입니다.          |
| `tools`                          | `string[]` | 번들 계약 검사를 위해 이 플러그인이 소유하는 에이전트 도구 이름입니다. |

## channelConfigs 참조

채널 플러그인이 런타임이 로드되기 전에 저비용 구성 메타데이터가 필요할 때 `channelConfigs`를 사용하세요.

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
      "description": "Matrix 홈서버 연결",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드          | 유형                     | 의미                                                                                     |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`에 대한 JSON 스키마입니다. 선언된 각 채널 구성 항목에 필수입니다.         |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션에 대한 선택적 UI 라벨/플레이스홀더/민감도 힌트입니다.                |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 표면에 병합되는 채널 라벨입니다.   |
| `description` | `string`                 | 검사 및 카탈로그 표면을 위한 짧은 채널 설명입니다.                                       |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 플러그인 ID입니다.       |

## modelSupport 참조

플러그인 런타임이 로드되기 전에 OpenClaw가 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은 축약 모델 ID로부터 제공자 플러그인을 추론해야 할 때 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적인 `provider/model` 참조는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 플러그인과 번들 플러그인이 둘 다 일치하면 번들되지 않은 플러그인이 우선합니다
- 남은 모호성은 사용자나 구성에서 제공자를 지정할 때까지 무시됩니다

필드:

| 필드            | 유형       | 의미                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약 모델 ID에 대해 `startsWith`로 일치시키는 접두사입니다.          |
| `modelPatterns` | `string[]` | 프로필 접미사를 제거한 뒤 축약 모델 ID에 대해 일치시키는 정규식 소스입니다. |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해 `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요. 일반 매니페스트 로딩은 더 이상 이러한 최상위 필드를 capability 소유권으로 취급하지 않습니다.

## 매니페스트와 package.json 비교

두 파일은 서로 다른 역할을 합니다:

| 파일                   | 용도                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 검색, 구성 검증, 인증 선택 메타데이터, 플러그인 코드가 실행되기 전에 반드시 존재해야 하는 UI 힌트                           |
| `package.json`         | npm 메타데이터, 의존성 설치, 엔트리포인트, 설치 게이팅, 설정, 카탈로그 메타데이터에 사용되는 `openclaw` 블록              |

어떤 메타데이터를 어디에 넣어야 할지 확신이 없다면 다음 규칙을 사용하세요:

- OpenClaw가 플러그인 코드를 로드하기 전에 알아야 하면 `openclaw.plugin.json`에 넣습니다
- 패키징, 엔트리 파일, npm 설치 동작과 관련된 내용이면 `package.json`에 넣습니다

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 플러그인 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라 `package.json`의 `openclaw` 블록에 들어 있습니다.

중요한 예시:

| 필드                                                              | 의미                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 네이티브 플러그인 엔트리포인트를 선언합니다.                                                                                               |
| `openclaw.setupEntry`                                             | 온보딩 및 지연 채널 시작 중에 사용되는 경량 setup 전용 엔트리포인트입니다.                                                                |
| `openclaw.channel`                                                | 라벨, 문서 경로, 별칭, 선택 문구 같은 저비용 채널 카탈로그 메타데이터입니다.                                                             |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "환경 변수만으로 된 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state 검사기 메타데이터입니다. |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.           |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 게시 플러그인을 위한 설치/업데이트 힌트입니다.                                                                               |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                              |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 유효하지 않을 때 제한된 번들 플러그인 재설치 복구 경로를 허용합니다.                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 플러그인보다 먼저 setup 전용 채널 표면을 로드할 수 있게 합니다.                                                         |

`openclaw.install.minHostVersion`은 설치 중과 매니페스트 레지스트리 로딩 중에 강제됩니다. 유효하지 않은 값은 거부되고, 더 새롭지만 유효한 값은 오래된 호스트에서 해당 플러그인을 건너뜁니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다. 임의의 손상된 구성을 설치 가능하게 만들지는 않습니다. 현재는 번들 플러그인 경로 누락이나 동일한 번들 플러그인에 대한 오래된 `channels.<id>` 항목처럼 특정한 오래된 번들 플러그인 업그레이드 실패에서만 설치 흐름이 복구되도록 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하며 운영자를 `openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기 모듈을 위한 패키지 메타데이터입니다:

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

설정, doctor 또는 configured-state 흐름이 전체 채널 플러그인이 로드되기 전에 저비용 예/아니오 인증 프로브를 필요로 할 때 사용하세요. 대상 export는 저장된 상태만 읽는 작은 함수여야 하며, 전체 채널 런타임 배럴을 통해 연결하지 마세요.

`openclaw.channel.configuredState`도 저비용 환경 변수 전용 구성 검사에 대해 같은 형식을 따릅니다:

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

채널이 환경 변수나 기타 작은 비런타임 입력만으로 configured-state에 답할 수 있을 때 사용하세요. 검사가 전체 구성 해석이나 실제 채널 런타임을 필요로 한다면, 대신 그 로직을 플러그인 `config.hasConfiguredState` 훅에 두세요.

## JSON 스키마 요구 사항

- **모든 플러그인은 반드시 JSON 스키마를 포함해야 합니다**, 구성을 전혀 받지 않더라도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 채널 ID가 플러그인 매니페스트에 선언되지 않은 한 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 반드시 **검색 가능한** 플러그인 ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- 플러그인이 설치되어 있지만 매니페스트나 스키마가 손상되었거나 누락된 경우, 검증이 실패하고 Doctor가 플러그인 오류를 보고합니다.
- 플러그인 구성이 존재하지만 플러그인이 **비활성화**된 경우, 구성은 유지되며 Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- 매니페스트는 로컬 파일시스템 로드를 포함한 **네이티브 OpenClaw 플러그인에 필수**입니다.
- 런타임은 여전히 플러그인 모듈을 별도로 로드합니다. 매니페스트는 검색 + 검증만을 위한 것입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로, 최종 값이 여전히 객체이기만 하면 주석, 후행 쉼표, 따옴표 없는 키가 허용됩니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 여기에 사용자 정의 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 인증 프로브, env-marker 검증, 기타 환경 변수 이름을 검사하기 위해 플러그인 런타임을 부팅해서는 안 되는 유사 제공자 인증 표면을 위한 저비용 메타데이터 경로입니다.
- `providerAuthAliases`는 제공자 변형이 다른 제공자의 인증 환경 변수, 인증 프로필, 구성 기반 인증, API 키 온보딩 선택을 재사용할 수 있게 하며, 이 관계를 코어에 하드코딩할 필요가 없습니다.
- `channelEnvVars`는 셸 환경 변수 대체, 설정 프롬프트, 기타 환경 변수 이름을 검사하기 위해 플러그인 런타임을 부팅해서는 안 되는 유사 채널 표면을 위한 저비용 메타데이터 경로입니다.
- `providerAuthChoices`는 제공자 런타임이 로드되기 전에 인증 선택 선택기, `--auth-choice` 해석, 선호 제공자 매핑, 단순 온보딩 CLI 플래그 등록을 위한 저비용 메타데이터 경로입니다. 제공자 코드가 필요한 런타임 wizard 메타데이터는 [제공자 런타임 훅](/ko/plugins/architecture#provider-runtime-hooks)을 참조하세요.
- 배타적 플러그인 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다(기본값: 내장 `legacy`).
- 플러그인에 필요하지 않다면 `channels`, `providers`, `cliBackends`, `skills`는 생략할 수 있습니다.
- 플러그인이 네이티브 모듈에 의존한다면, 빌드 단계와 패키지 관리자 allowlist 요구 사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

- [플러그인 빌드](/ko/plugins/building-plugins) — 플러그인 시작하기
- [플러그인 아키텍처](/ko/plugins/architecture) — 내부 아키텍처
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
