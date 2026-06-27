---
read_when:
    - '`clawhub package validate`를 실행했고 Plugin 발견 사항을 수정해야 합니다'
    - ClawHub가 Plugin 패키지 게시를 거부했거나 경고했습니다.
    - 출시 전에 Plugin 패키지 메타데이터를 업데이트하고 있습니다
summary: 게시 전에 ClawHub Plugin 패키지 유효성 검사 지적 사항 수정
title: Plugin 검증 수정
x-i18n:
    generated_at: "2026-06-27T17:15:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 유효성 검사 수정

ClawHub는 게시 전에 Plugin 패키지를 검증하며, 자동 패키지 스캔에서 나온 발견 사항도 표시할 수 있습니다. 이 페이지는 작성자 대상 발견 사항, 즉 Plugin 작성자가 패키지 메타데이터, 매니페스트, SDK 가져오기 또는 게시된 아티팩트에서 수정할 수 있는 발견 사항을 다룹니다.

내부 Plugin Inspector 범위 발견 사항은 다루지 않습니다. 전체 보고서에 작성자 수정 지침 없이 스캐너 유지 관리 코드가 포함되어 있다면, 이는 Plugin 작성자가 아니라 OpenClaw 유지 관리자를 위한 것입니다.

수정을 적용한 뒤에는 다시 실행하세요.

```bash
clawhub package validate <path-to-plugin>
```

## 작성자 대상 발견 사항

| 코드                                    | 여기서 시작                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [패키지 메타데이터 추가](/ko/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [패키지 openclaw 블록 추가](/ko/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw 패키지 진입점 선언](/ko/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [선언된 진입점 게시](/ko/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [설치 메타데이터 완성](/ko/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 호환성 선언](/ko/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [최소 호스트 버전 정렬](/ko/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [패키지와 매니페스트 버전 정렬](/ko/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [지원되지 않는 OpenClaw 패키지 메타데이터 제거](/ko/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm 아티팩트를 패킹 가능하게 만들기](/ko/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack 출력에 진입점 포함](/ko/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack 출력에 메타데이터 포함](/ko/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [매니페스트 표시 이름 추가](/ko/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [지원되지 않는 매니페스트 필드 제거](/ko/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [지원되지 않는 계약 키 제거](/ko/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [루트 SDK 가져오기 교체](/ko/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [예약된 SDK 가져오기 제거](/ko/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [전체 세션 저장소 접근 교체](/ko/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [before_agent_start 교체](/ko/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [제공자 환경 변수를 설정 메타데이터로 이동](/ko/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [채널 환경 변수를 현재 메타데이터에 반영](/ko/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [사용할 수 없는 보안 매니페스트 스키마 참조 제거](/ko/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [지원되지 않는 보안 매니페스트 파일 제거](/ko/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 패키지 메타데이터

### package-json-missing

패키지 루트에 `package.json`이 포함되어 있지 않으므로 ClawHub가 npm 패키지, 버전, 진입점 또는 OpenClaw 메타데이터를 식별할 수 없습니다.

- `name`, `version`, `type`이 포함된 `package.json`을 추가합니다.
- 패키지가 OpenClaw Plugin을 제공하는 경우 `openclaw` 블록을 추가합니다.
- 최소 패키지 예시는 [Plugin 빌드](/ko/plugins/building-plugins)를, 패키지와 매니페스트의 분리는 [Plugin 매니페스트](/ko/plugins/manifest#manifest-versus-packagejson)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-openclaw-metadata-missing

패키지에 `package.json`은 있지만 OpenClaw 패키지 메타데이터를 선언하지 않습니다.

- `package.json#openclaw`를 추가합니다.
- `openclaw.extensions` 또는 `openclaw.runtimeExtensions` 같은 진입점 메타데이터를 포함합니다.
- 패키지를 ClawHub를 통해 게시하거나 설치할 예정이면 호환성 및 설치 메타데이터를 추가합니다.
- [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-openclaw-entry-missing

패키지 메타데이터는 있지만 OpenClaw 런타임 진입점을 선언하지 않습니다.

- 네이티브 Plugin 진입점에는 `openclaw.extensions`를 추가합니다.
- 게시된 패키지가 빌드된 JavaScript를 로드해야 하는 경우 `openclaw.runtimeExtensions`를 추가합니다.
- 모든 진입점 경로는 패키지 디렉터리 안에 둡니다.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints) 및 [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-entrypoint-missing

패키지가 OpenClaw 진입점을 선언하지만, 검증 중인 패키지에 참조된 파일이 없습니다.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, `openclaw.runtimeSetupEntry`의 각 경로를 확인합니다.
- 진입점이 `dist`로 생성되는 경우 패키지를 빌드합니다.
- 진입점이 이동했다면 메타데이터를 업데이트합니다.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)을 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-install-metadata-incomplete

ClawHub가 패키지를 어떻게 설치하거나 업데이트해야 하는지 알 수 없습니다.

- `openclaw.install`을 `clawhubSpec`, `npmSpec`, `localPath` 같은 지원되는 설치 소스로 채웁니다.
- 둘 이상의 설치 소스를 사용할 수 있는 경우 `openclaw.install.defaultChoice`를 설정합니다.
- 최소 OpenClaw 호스트 버전에는 `openclaw.install.minHostVersion`을 사용합니다.
- [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-plugin-api-compat-missing

패키지가 지원하는 OpenClaw Plugin API 범위를 선언하지 않습니다.

- `package.json`에 `openclaw.compat.pluginApi`를 추가합니다.
- 빌드하고 테스트한 OpenClaw Plugin API 버전 또는 semver 하한을 사용합니다.
- 이를 패키지 버전과 분리해 둡니다. 패키지 버전은 Plugin 릴리스를 설명하고, `openclaw.compat.pluginApi`는 호스트 API 계약을 설명합니다.
- [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-min-host-version-drift

패키지 최소 호스트 버전이 패키지가 빌드된 기준인 OpenClaw 버전 메타데이터와 일치하지 않습니다.

- `openclaw.install.minHostVersion`을 확인합니다.
- 릴리스 중 사용된 OpenClaw 버전 같은 패키지의 OpenClaw 빌드 메타데이터를 확인합니다.
- 최소 호스트 버전을 패키지가 실제로 지원하는 호스트 버전 범위에 맞춥니다.
- [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-manifest-version-drift

패키지 버전과 Plugin 매니페스트 버전이 일치하지 않습니다.

- 패키지 릴리스 버전은 `package.json#version`을 우선합니다.
- `openclaw.plugin.json`에도 `version`이 있는 경우, 패키지 메타데이터가 권위 있는 정보라면 일치하도록 업데이트하거나 오래된 매니페스트 버전 메타데이터를 제거합니다.
- 게시된 메타데이터를 변경한 뒤에는 새 패키지 버전을 게시합니다.
- [Plugin 매니페스트](/ko/plugins/manifest)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-openclaw-unsupported-metadata

`package.json#openclaw` 블록에 지원되지 않는 OpenClaw 패키지 메타데이터 필드가 포함되어 있습니다.

- `openclaw.bundle` 같은 지원되지 않는 필드를 제거합니다.
- 네이티브 Plugin 메타데이터는 `openclaw.plugin.json`에 둡니다.
- 패키지 진입점, 호환성, 설치, 설정, 카탈로그 메타데이터는 지원되는 `package.json#openclaw` 필드에 둡니다.
- [검색에 영향을 주는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

## 게시된 아티팩트

### package-npm-pack-unavailable

패키지를 ClawHub가 검사하거나 게시할 아티팩트로 패킹할 수 없습니다.

- 패키지 루트에서 `npm pack --dry-run`을 실행합니다.
- 패킹 실패를 일으키는 잘못된 패키지 메타데이터, 깨진 수명 주기 스크립트 또는 files 항목을 수정합니다.
- 이 패키지를 공개 게시하려는 경우 `private: true`를 제거합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-npm-pack-entrypoint-missing

패키지는 패킹할 수 있지만, 패킹된 아티팩트에 `package.json#openclaw`에 선언된 진입점 파일이 포함되지 않습니다.

- `npm pack --dry-run`을 실행하고 포함될 파일을 검사합니다.
- 패킹하기 전에 생성된 진입점을 빌드합니다.
- 선언된 진입점이 포함되도록 `files`, `.npmignore` 또는 빌드 출력을 업데이트합니다.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)을 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### package-npm-pack-metadata-missing

패킹된 아티팩트에 소스 패키지에 존재하는 OpenClaw 메타데이터가 없습니다.

- `npm pack --dry-run`을 실행하고 포함된 메타데이터 파일을 검사합니다.
- 패킹된 아티팩트의 `package.json`에 `openclaw` 블록이 포함되어 있는지 확인합니다.
- 패키지가 네이티브 OpenClaw Plugin인 경우 `openclaw.plugin.json`이 포함되어 있는지 확인합니다.
- 패키지 메타데이터가 제외되지 않도록 `files` 또는 `.npmignore`를 업데이트합니다.
- [Plugin 빌드](/ko/plugins/building-plugins)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

## 매니페스트 메타데이터

### manifest-name-missing

네이티브 Plugin 매니페스트에 표시 이름이 포함되어 있지 않습니다.

- `openclaw.plugin.json`에 비어 있지 않은 `name` 필드를 추가합니다.
- `name`은 사람이 읽기 쉽게 유지하고, `id`는 안정적인 머신 ID로 유지합니다.
- [Plugin 매니페스트](/ko/plugins/manifest)를 참고합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### manifest-unknown-fields

Plugin 매니페스트에 OpenClaw가 지원하지 않는 최상위 필드가 있습니다.

- 각 최상위 필드를
  [매니페스트 필드 참조](/ko/plugins/manifest#top-level-field-reference)와 비교합니다.
- `openclaw.plugin.json`에서 사용자 지정 필드를 제거합니다.
- 매니페스트 대신 패키지 또는 설치 메타데이터를 지원되는 `package.json#openclaw` 필드로
  이동합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### manifest-unknown-contracts

매니페스트가 `contracts` 안에 지원되지 않는 키를 선언합니다.

- `contracts` 아래의 각 키를
  [계약 참조](/ko/plugins/manifest#contracts-reference)와 비교합니다.
- 지원되지 않는 계약 키를 제거합니다.
- 런타임 동작을 Plugin 등록 코드로 이동하고, `contracts`는 정적 기능 소유권
  메타데이터로 제한합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

## SDK 및 호환성 마이그레이션

### legacy-root-sdk-import

Plugin이 사용 중단된 루트 SDK 배럴에서 가져옵니다:
`openclaw/plugin-sdk`.

- 루트 배럴 가져오기를 집중된 공개 하위 경로 가져오기로 교체합니다.
- `definePluginEntry`에는 `openclaw/plugin-sdk/plugin-entry`를 사용합니다.
- 채널 엔트리 헬퍼에는 `openclaw/plugin-sdk/channel-core`를 사용합니다.
- [가져오기 규칙](/ko/plugins/building-plugins#import-conventions)과
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 사용해 좁은 가져오기를 찾습니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### reserved-sdk-import

Plugin이 번들 Plugin 또는 내부 호환성을 위해 예약된 SDK 경로를 가져옵니다.

- 예약된 OpenClaw 내부 SDK 가져오기를 문서화된 공개
  `openclaw/plugin-sdk/*` 하위 경로로 교체합니다.
- 해당 동작에 공개 SDK가 없으면 헬퍼를 패키지 안에 유지하거나 공개 OpenClaw API를
  요청합니다.
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)와
  [SDK 마이그레이션](/ko/plugins/sdk-migration)을 사용해 지원되는 가져오기를 선택합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### sdk-load-session-store

Plugin이 여전히 사용 중단된 전체 세션 저장소 헬퍼
`loadSessionStore`를 사용합니다.

- 세션 상태를 읽을 때는 `getSessionEntry(...)` 또는 `listSessionEntries(...)`를
  사용합니다.
- 세션 상태를 쓸 때는 `patchSessionEntry(...)` 또는 `upsertSessionEntry(...)`를
  사용합니다.
- 전체 세션 저장소 객체를 로드하고, 변경하고, 저장하는 방식을 피합니다.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을 여전히 지원하는 동안에만
  `loadSessionStore(...)`를 유지합니다.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참고하세요.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### legacy-before-agent-start

Plugin이 여전히 레거시 `before_agent_start` 훅을 사용합니다.

- 모델 또는 제공자 재정의 작업을 `before_model_resolve`로 이동합니다.
- 프롬프트 또는 컨텍스트 변경 작업을 `before_prompt_build`로 이동합니다.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을 여전히 지원하는 동안에만
  `before_agent_start`를 유지합니다.
- [훅](/ko/plugins/hooks)과
  [Plugin 호환성](/ko/plugins/compatibility)을 참고하세요.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### provider-auth-env-vars

매니페스트가 여전히 레거시 `providerAuthEnvVars` 제공자 인증 메타데이터를 사용합니다.

- 제공자 환경 변수 메타데이터를 `setup.providers[].envVars`에 미러링합니다.
- 지원하는 OpenClaw 범위가 여전히 필요로 하는 동안에만 `providerAuthEnvVars`를
  호환성 메타데이터로 유지합니다.
- [설정 참조](/ko/plugins/manifest#setup-reference)와
  [SDK 마이그레이션](/ko/plugins/sdk-migration)을 참고하세요.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### channel-env-vars

매니페스트가 ClawHub에서 예상하는 현재 설정 또는 구성 메타데이터 없이 레거시 또는
이전 채널 환경 변수 메타데이터를 사용합니다.

- OpenClaw가 채널 런타임을 로드하지 않고도 설정 상태를 검사할 수 있도록 채널
  환경 변수 메타데이터를 선언적으로 유지합니다.
- 환경 변수 기반 채널 설정을 Plugin 형태에서 사용하는 현재 설정, 채널 구성 또는
  패키지 채널 메타데이터로 미러링합니다.
- 지원되는 이전 OpenClaw 버전이 여전히 필요로 하는 동안에만 `channelEnvVars`를
  호환성 메타데이터로 유지합니다.
- [Plugin 매니페스트](/ko/plugins/manifest)와
  [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참고하세요.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

## 보안 매니페스트

### security-manifest-schema-unavailable

패키지가 ClawHub에서 사용 가능하다고 인식하지 않는 스키마 참조와 함께
`openclaw.security.json`을 제공합니다.

- 스키마 URL이 참고용일 뿐이면 제거합니다.
- OpenClaw가 문서화된 버전 지정 스키마를 게시한 후에만 사용합니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

### unrecognized-security-manifest

패키지가 지원되지 않는 보안 매니페스트 파일을 제공합니다.

- OpenClaw가 버전 지정 보안 매니페스트 스키마와 ClawHub 동작을 문서화할 때까지
  `openclaw.security.json`을 제거합니다.
- 매니페스트 계약이 존재할 때까지 보안에 민감한 동작은 공개 패키지 문서 또는
  README에 문서화해 둡니다.
- `clawhub package validate <path-to-plugin>`을 다시 실행합니다.

## 관련 항목

- [ClawHub CLI](/ko/clawhub/cli)
- [ClawHub 게시](/ko/clawhub/publishing)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin 엔트리 포인트](/ko/plugins/sdk-entrypoints)
- [Plugin 호환성](/ko/plugins/compatibility)
