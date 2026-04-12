---
read_when:
    - OpenClaw Plugin을 만들고 있습니다
    - Plugin 구성 스키마를 제공하거나 Plugin 검증 오류를 디버그해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구 사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-12T23:28:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin 매니페스트 (`openclaw.plugin.json`)

이 페이지는 **네이티브 OpenClaw Plugin 매니페스트**만을 다룹니다.

호환 가능한 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참고하세요.

호환 가능한 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기에서 설명하는
`openclaw.plugin.json` 스키마에 대해 검증되지는 않습니다.

호환 가능한 번들의 경우, OpenClaw는 현재 레이아웃이
OpenClaw 런타임 기대치와 일치할 때 번들 메타데이터, 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 네이티브 OpenClaw Plugin은 반드시 **Plugin 루트**에 `openclaw.plugin.json`
파일을 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해
**Plugin 코드를 실행하지 않고도** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면
Plugin 오류로 처리되며 구성 검증이 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참고하세요.
네이티브 capability 모델과 현재 외부 호환성 지침은
[Capability model](/ko/plugins/architecture#public-capability-model)을 참고하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 Plugin 코드를 로드하기 전에 읽는
메타데이터입니다.

다음 용도로 사용하세요:

- Plugin 식별자
- 구성 검증
- Plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- 런타임이 로드되기 전에 제어 플레인 인터페이스가 검사할 수 있는
  저비용 활성화 힌트
- 런타임이 로드되기 전에 설정/온보딩 인터페이스가 검사할 수 있는
  저비용 설정 설명자
- Plugin 런타임이 로드되기 전에 확인되어야 하는 alias 및 자동 활성화 메타데이터
- 런타임이 로드되기 전에 Plugin을 자동 활성화해야 하는
  축약형 모델 패밀리 소유 메타데이터
- 번들 호환 wiring 및 계약 커버리지에 사용되는
  정적 capability 소유 스냅샷
- 런타임 로드 없이 카탈로그와 검증 인터페이스에 병합되어야 하는
  채널별 구성 메타데이터
- 구성 UI 힌트

다음 용도로는 사용하지 마세요:

- 런타임 동작 등록
- 코드 엔트리포인트 선언
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

| 필드                                | 필수 여부 | 유형                             | 의미                                                                                                                                                                                                         |
| ----------------------------------- | --------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | 예        | `string`                         | 정식 Plugin id입니다. 이 id는 `plugins.entries.<id>`에 사용됩니다.                                                                                                                                           |
| `configSchema`                      | 예        | `object`                         | 이 Plugin 구성에 대한 인라인 JSON 스키마입니다.                                                                                                                                                              |
| `enabledByDefault`                  | 아니요    | `true`                           | 번들된 Plugin을 기본적으로 활성화된 상태로 표시합니다. 기본적으로 비활성화된 상태로 두려면 이 필드를 생략하거나 `true`가 아닌 값을 설정하세요.                                                            |
| `legacyPluginIds`                   | 아니요    | `string[]`                       | 이 정식 Plugin id로 정규화되는 레거시 id입니다.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | 아니요    | `string[]`                       | 인증, 구성 또는 모델 ref에서 이 프로바이더 id가 언급될 때 이 Plugin을 자동 활성화해야 하는 프로바이더 id입니다.                                                                                             |
| `kind`                              | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin 종류를 선언합니다.                                                                                                                                              |
| `channels`                          | 아니요    | `string[]`                       | 이 Plugin이 소유하는 채널 id입니다. 검색 및 구성 검증에 사용됩니다.                                                                                                                                          |
| `providers`                         | 아니요    | `string[]`                       | 이 Plugin이 소유하는 프로바이더 id입니다.                                                                                                                                                                    |
| `modelSupport`                      | 아니요    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는, 매니페스트 소유의 축약형 모델 패밀리 메타데이터입니다.                                                                                                      |
| `cliBackends`                       | 아니요    | `string[]`                       | 이 Plugin이 소유하는 CLI 추론 백엔드 id입니다. 명시적 구성 ref에서 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                   |
| `commandAliases`                    | 아니요    | `object[]`                       | 런타임이 로드되기 전에 Plugin 인지 구성 및 CLI 진단을 생성해야 하는, 이 Plugin이 소유하는 명령 이름입니다.                                                                                                  |
| `providerAuthEnvVars`               | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 프로바이더 인증 env 메타데이터입니다.                                                                                                        |
| `providerAuthAliases`               | 아니요    | `Record<string, string>`         | 인증 조회 시 다른 프로바이더 id를 재사용해야 하는 프로바이더 id입니다. 예를 들어 기본 프로바이더 API 키 및 인증 프로필을 공유하는 코딩 프로바이더가 이에 해당합니다.                                      |
| `channelEnvVars`                    | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 채널 env 메타데이터입니다. 일반적인 시작/구성 헬퍼가 확인해야 하는 env 기반 채널 설정 또는 인증 인터페이스에 사용하세요.                  |
| `providerAuthChoices`               | 아니요    | `object[]`                       | 온보딩 선택기, 선호 프로바이더 확인, 단순 CLI 플래그 연결을 위한 저비용 인증 선택 메타데이터입니다.                                                                                                        |
| `activation`                        | 아니요    | `object`                         | 프로바이더, 명령, 채널, 라우트, capability 트리거 기반 로딩을 위한 저비용 활성화 힌트입니다. 메타데이터 전용이며 실제 동작은 여전히 Plugin 런타임이 담당합니다.                                          |
| `setup`                             | 아니요    | `object`                         | 검색 및 설정 인터페이스가 Plugin 런타임을 로드하지 않고도 검사할 수 있는 저비용 설정/온보딩 설명자입니다.                                                                                                  |
| `contracts`                         | 아니요    | `object`                         | 음성, 실시간 전사, 실시간 음성, media-understanding, image-generation, music-generation, video-generation, 웹 가져오기, 웹 검색, 도구 소유권에 대한 정적 번들 capability 스냅샷입니다.                    |
| `channelConfigs`                    | 아니요    | `Record<string, object>`         | 런타임이 로드되기 전에 검색 및 검증 인터페이스에 병합되는, 매니페스트 소유의 채널 구성 메타데이터입니다.                                                                                                   |
| `skills`                            | 아니요    | `string[]`                       | Plugin 루트를 기준으로 로드할 Skills 디렉터리입니다.                                                                                                                                                         |
| `name`                              | 아니요    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                       |
| `description`                       | 아니요    | `string`                         | Plugin 인터페이스에 표시되는 짧은 요약입니다.                                                                                                                                                                |
| `version`                           | 아니요    | `string`                         | 참고용 Plugin 버전입니다.                                                                                                                                                                                    |
| `uiHints`                           | 아니요    | `Record<string, object>`         | 구성 필드에 대한 UI 레이블, 플레이스홀더, 민감도 힌트입니다.                                                                                                                                                 |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택 항목을 설명합니다.
OpenClaw는 프로바이더 런타임이 로드되기 전에 이를 읽습니다.

| 필드                  | 필수 여부 | 유형                                            | 의미                                                                                                     |
| --------------------- | --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 예        | `string`                                        | 이 선택 항목이 속한 프로바이더 id입니다.                                                                 |
| `method`              | 예        | `string`                                        | 디스패치할 인증 메서드 id입니다.                                                                         |
| `choiceId`            | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 id입니다.                                             |
| `choiceLabel`         | 아니요    | `string`                                        | 사용자 대상 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대체값으로 사용합니다.                       |
| `choiceHint`          | 아니요    | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                                       |
| `assistantPriority`   | 아니요    | `number`                                        | 에이전트 주도 대화형 선택기에서 더 낮은 값이 먼저 정렬됩니다.                                            |
| `assistantVisibility` | 아니요    | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 계속 허용하면서 에이전트 선택기에서는 이 선택 항목을 숨깁니다.                          |
| `deprecatedChoiceIds` | 아니요    | `string[]`                                      | 사용자를 이 대체 선택 항목으로 리디렉션해야 하는 레거시 선택 id입니다.                                   |
| `groupId`             | 아니요    | `string`                                        | 관련 선택 항목을 묶기 위한 선택적 그룹 id입니다.                                                         |
| `groupLabel`          | 아니요    | `string`                                        | 해당 그룹의 사용자 대상 레이블입니다.                                                                    |
| `groupHint`           | 아니요    | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                                         |
| `optionKey`           | 아니요    | `string`                                        | 단일 플래그 기반 단순 인증 흐름을 위한 내부 옵션 키입니다.                                               |
| `cliFlag`             | 아니요    | `string`                                        | `--openrouter-api-key`와 같은 CLI 플래그 이름입니다.                                                     |
| `cliOption`           | 아니요    | `string`                                        | `--openrouter-api-key <key>`와 같은 전체 CLI 옵션 형식입니다.                                            |
| `cliDescription`      | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                        |
| `onboardingScopes`    | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택 항목이 표시되어야 하는 온보딩 인터페이스입니다. 생략하면 기본값은 `["text-inference"]`입니다. |

## commandAliases 참조

사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려고 할 수 있는
런타임 명령 이름을 Plugin이 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는
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

| 필드         | 필수 여부 | 유형              | 의미                                                                    |
| ------------ | --------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속한 명령 이름입니다.                                       |
| `kind`       | 아니요    | `"runtime-slash"` | 루트 CLI 명령이 아니라 채팅 슬래시 명령으로 alias를 표시합니다.         |
| `cliCommand` | 아니요    | `string`          | 존재할 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.           |

## activation 참조

Plugin이 나중에 활성화되어야 하는 제어 플레인 이벤트를 저비용으로 선언할 수 있을 때
`activation`을 사용하세요.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry`, 또는 다른 런타임/Plugin 엔트리포인트를 대체하지도 않습니다.
현재 소비자는 이를 더 광범위한 Plugin 로드 이전의 범위 축소 힌트로 사용하므로,
활성화 메타데이터가 없으면 보통 성능 비용만 발생합니다. 레거시 매니페스트 소유 대체 경로가 여전히 존재하는 동안에는
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

| 필드             | 필수 여부 | 유형                                                 | 의미                                                              |
| ---------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | 아니요    | `string[]`                                           | 요청될 때 이 Plugin을 활성화해야 하는 프로바이더 id입니다.        |
| `onCommands`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 명령 id입니다.                        |
| `onChannels`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 채널 id입니다.                        |
| `onRoutes`       | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 라우트 종류입니다.                    |
| `onCapabilities` | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 플레인 활성화 계획에 사용되는 광범위한 capability 힌트입니다. |

현재 라이브 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체됩니다
- 채널 트리거 설정/채널 계획은 명시적 채널 활성화 메타데이터가 없을 때
  레거시 `channels[]` 소유권으로 대체됩니다
- 프로바이더 트리거 설정/런타임 계획은 명시적 프로바이더
  활성화 메타데이터가 없을 때 레거시 `providers[]` 및 최상위 `cliBackends[]`
  소유권으로 대체됩니다

## setup 참조

설정 및 온보딩 인터페이스가 런타임 로드 전에 Plugin 소유 메타데이터를 저비용으로 필요로 할 때
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

최상위 `cliBackends`는 여전히 유효하며 계속해서 CLI 추론
백엔드를 설명합니다. `setup.cliBackends`는
메타데이터 전용으로 유지되어야 하는 제어 플레인/설정 흐름을 위한 설정 전용 설명자 인터페이스입니다.

존재하는 경우, `setup.providers`와 `setup.cliBackends`는
설정 검색을 위한 우선적인 설명자 우선 조회 인터페이스입니다. 설명자가 후보 Plugin만 좁히고
설정에 더 풍부한 설정 시점 런타임 hook이 여전히 필요하다면,
`requiresRuntime: true`를 설정하고 대체 실행 경로로 `setup-api`를 유지하세요.

설정 조회는 Plugin 소유의 `setup-api` 코드를 실행할 수 있으므로,
정규화된 `setup.providers[].id`와 `setup.cliBackends[]` 값은
검색된 Plugin 전체에서 고유해야 합니다. 소유권이 모호한 경우
검색 순서에 따라 하나를 선택하지 않고 실패 시 닫힌 동작을 합니다.

### setup.providers 참조

| 필드          | 필수 여부 | 유형       | 의미                                                                                 |
| ------------- | --------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | 예        | `string`   | 설정 또는 온보딩 중 노출되는 프로바이더 id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요    | `string[]` | 전체 런타임을 로드하지 않고도 이 프로바이더가 지원하는 설정/인증 메서드 id입니다.    |
| `envVars`     | 아니요    | `string[]` | 일반적인 설정/상태 인터페이스가 Plugin 런타임 로드 전에 확인할 수 있는 env var입니다. |

### setup 필드

| 필드               | 필수 여부 | 유형       | 의미                                                                                                    |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중 노출되는 프로바이더 설정 설명자입니다.                                                |
| `cliBackends`      | 아니요    | `string[]` | 설명자 우선 설정 조회에 사용되는 설정 시점 백엔드 id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 인터페이스가 소유하는 구성 마이그레이션 id입니다.                                      |
| `requiresRuntime`  | 아니요    | `boolean`  | 설명자 조회 후에도 설정에 `setup-api` 실행이 여전히 필요한지 여부입니다.                                |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로의 맵입니다.

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

| 필드          | 유형       | 의미                                |
| ------------- | ---------- | ----------------------------------- |
| `label`       | `string`   | 사용자 대상 필드 레이블입니다.       |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.            |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.     |
| `sensitive`   | `boolean`  | 필드를 비밀값 또는 민감 정보로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 플레이스홀더 텍스트입니다. |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고도 읽을 수 있는
정적 capability 소유 메타데이터에만 `contracts`를 사용하세요.

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

| 필드                             | 유형       | 의미                                                           |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | 이 Plugin이 소유하는 음성 프로바이더 id입니다.                 |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유하는 실시간 전사 프로바이더 id입니다.          |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유하는 실시간 음성 프로바이더 id입니다.          |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유하는 media-understanding 프로바이더 id입니다.  |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 이미지 생성 프로바이더 id입니다.          |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유하는 비디오 생성 프로바이더 id입니다.          |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유하는 웹 가져오기 프로바이더 id입니다.          |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유하는 웹 검색 프로바이더 id입니다.              |
| `tools`                          | `string[]` | 번들 계약 검사에서 이 Plugin이 소유하는 에이전트 도구 이름입니다. |

## channelConfigs 참조

채널 Plugin이 런타임 로드 전에 저비용 구성 메타데이터를 필요로 하는 경우
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

| 필드          | 유형                     | 의미                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`에 대한 JSON 스키마입니다. 선언된 각 채널 구성 항목마다 필수입니다.          |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션에 대한 선택적 UI 레이블/플레이스홀더/민감도 힌트입니다.                 |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 인터페이스에 병합되는 채널 레이블입니다. |
| `description` | `string`                 | 검사 및 카탈로그 인터페이스를 위한 짧은 채널 설명입니다.                                    |
| `preferOver`  | `string[]`               | 선택 인터페이스에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위의 Plugin id입니다.    |

## modelSupport 참조

OpenClaw가 Plugin 런타임이 로드되기 전에 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은
축약형 모델 id로부터 프로바이더 Plugin을 추론해야 하는 경우 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적 `provider/model` ref는 소유하는 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`는 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들된 Plugin 하나가 모두 일치하면, 번들되지 않은 Plugin이 우선합니다
- 남은 모호성은 사용자가 또는 구성이 프로바이더를 지정할 때까지 무시됩니다

필드:

| 필드            | 유형       | 의미                                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 id에 대해 `startsWith`로 일치시키는 접두사입니다.                         |
| `modelPatterns` | `string[]` | 프로필 접미사를 제거한 뒤 축약형 모델 id에 대해 일치시키는 정규식 소스입니다.         |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요. 일반적인
매니페스트 로드는 더 이상 이러한 최상위 필드를 capability
소유권으로 취급하지 않습니다.

## 매니페스트와 package.json 비교

이 두 파일은 서로 다른 역할을 합니다:

| 파일                   | 용도                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 반드시 존재해야 하는 검색, 구성 검증, 인증 선택 메타데이터, UI 힌트                                      |
| `package.json`         | npm 메타데이터, 의존성 설치, 그리고 엔트리포인트, 설치 게이팅, 설정, 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록            |

어떤 메타데이터를 어디에 넣어야 할지 확실하지 않다면 다음 규칙을 사용하세요:

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, 엔트리 파일, 또는 npm 설치 동작과 관련된 내용이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 런타임 이전 Plugin 메타데이터는 의도적으로
`openclaw.plugin.json`이 아니라 `package.json`의 `openclaw` 블록 아래에 있습니다.

중요한 예시:

| 필드                                                             | 의미                                                                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 네이티브 Plugin 엔트리포인트를 선언합니다.                                                                                                   |
| `openclaw.setupEntry`                                             | 온보딩 및 지연 채널 시작 중에 사용되는 경량 설정 전용 엔트리포인트입니다.                                                                    |
| `openclaw.channel`                                                | 레이블, 문서 경로, alias, 선택 설명과 같은 저비용 채널 카탈로그 메타데이터입니다.                                                           |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env 전용 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state 검사기 메타데이터입니다.        |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부에 게시된 Plugin을 위한 설치/업데이트 힌트입니다.                                                                               |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                 |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22`와 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 유효하지 않을 때 제한적인 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중에 전체 채널 Plugin보다 먼저 설정 전용 채널 인터페이스를 로드할 수 있게 합니다.                                                      |

`openclaw.install.minHostVersion`은 설치 및 매니페스트
레지스트리 로드 중에 강제 적용됩니다. 유효하지 않은 값은 거부되며, 더 새롭지만 유효한 값은
오래된 호스트에서 Plugin을 건너뜁니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위를 좁게 유지합니다. 이 설정은
임의의 손상된 구성을 설치 가능하게 만들지 않습니다. 현재는 설치 흐름이 특정한 오래된
번들 Plugin 업그레이드 실패, 예를 들어 누락된 번들 Plugin 경로나
같은 번들 Plugin에 대한 오래된 `channels.<id>` 항목에서만 복구할 수 있게 합니다.
관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를
`openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기
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

설정, doctor, 또는 configured-state 흐름이 전체 채널 Plugin이 로드되기 전에
저비용 yes/no 인증 프로브를 필요로 할 때 사용하세요. 대상 export는
영속 상태만 읽는 작은 함수여야 합니다. 전체
채널 런타임 barrel을 통해 라우팅하지 마세요.

`openclaw.channel.configuredState`는 저비용 env 전용
configured 검사에 대해 같은 형태를 따릅니다:

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
비런타임 입력만으로 configured-state에 답할 수 있을 때 사용하세요. 검사에 전체 구성 확인이나 실제
채널 런타임이 필요하다면, 대신 해당 로직을 Plugin `config.hasConfiguredState`
hook에 두세요.

## JSON 스키마 요구 사항

- **모든 Plugin은 반드시 JSON 스키마를 포함해야 합니다**, 구성을 전혀 받지 않더라도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 해당 채널 id가
  Plugin 매니페스트에 선언되어 있는 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** Plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- Plugin이 설치되어 있지만 매니페스트 또는 스키마가 손상되었거나 없으면,
  검증이 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**되어 있으면, 해당 구성은 유지되며
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [Configuration reference](/ko/gateway/configuration)를 참고하세요.

## 참고사항

- 매니페스트는 로컬 파일 시스템 로드를 포함한 **네이티브 OpenClaw Plugin에 필수**입니다.
- 런타임은 여전히 Plugin 모듈을 별도로 로드합니다. 매니페스트는
  검색 + 검증 전용입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로, 최종 값이 여전히 객체이기만 하면
  주석, 후행 쉼표, 따옴표 없는 키도 허용됩니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 여기에
  사용자 정의 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 인증 프로브, env 마커
  검증, 그리고 env 이름을 확인하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사한 프로바이더 인증 인터페이스를 위한
  저비용 메타데이터 경로입니다.
- `providerAuthAliases`는 코어에 해당 관계를 하드코딩하지 않고도
  프로바이더 변형이 다른 프로바이더의 인증 env var,
  인증 프로필, 구성 기반 인증, API 키 온보딩 선택 항목을 재사용할 수 있게 합니다.
- `channelEnvVars`는 셸 env 대체 경로, 설정
  프롬프트, 그리고 env 이름을 확인하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사한 채널 인터페이스를 위한
  저비용 메타데이터 경로입니다.
- `providerAuthChoices`는 인증 선택 항목 선택기,
  `--auth-choice` 확인, 선호 프로바이더 매핑, 그리고 프로바이더 런타임이 로드되기 전
  단순 온보딩 CLI 플래그 등록을 위한 저비용 메타데이터 경로입니다. 프로바이더 코드가 필요한
  런타임 wizard 메타데이터는
  [Provider runtime hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참고하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다
    (기본값: 내장 `legacy`).
- Plugin에 필요하지 않은 경우 `channels`, `providers`, `cliBackends`, `skills`는
  생략할 수 있습니다.
- Plugin이 네이티브 모듈에 의존하는 경우, 빌드 단계와
  패키지 관리자 allowlist 요구 사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련 문서

- [Building Plugins](/ko/plugins/building-plugins) — Plugin 시작하기
- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처
- [SDK Overview](/ko/plugins/sdk-overview) — Plugin SDK 참조
