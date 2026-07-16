---
read_when:
    - clawhub package validate를 실행했으며 Plugin 관련 지적 사항을 수정해야 합니다
    - ClawHub에서 Plugin 패키지 게시가 거부되었거나 경고가 표시됨
    - 릴리스 전에 Plugin 패키지 메타데이터를 업데이트하고 있습니다
summary: 게시하기 전에 ClawHub Plugin 패키지 유효성 검사에서 발견된 문제를 수정하십시오
title: Plugin 검증 수정 사항
x-i18n:
    generated_at: "2026-07-16T12:23:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 검증 수정

ClawHub는 게시 전에 Plugin 패키지를 검증하며 자동화된 패키지 검사에서 발견된 항목도 표시할 수 있습니다. 이 페이지에서는 작성자가 패키지 메타데이터, 매니페스트, SDK 가져오기 또는 게시된 아티팩트에서 수정할 수 있는 작성자 대상 발견 항목을 다룹니다.

내부 Plugin Inspector 검사 범위 발견 항목은 다루지 않습니다. 전체 보고서에 작성자를 위한 해결 지침 없이 스캐너 유지 관리 코드가 포함되어 있다면, 해당 코드는 Plugin 작성자가 아니라 OpenClaw 유지 관리자를 위한 것입니다.

수정 사항을 적용한 후 다음을 다시 실행하십시오.

```bash
clawhub package validate <path-to-plugin>
```

## 작성자 대상 발견 항목

| 코드                                    | 여기서 시작                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [패키지 메타데이터 추가](/ko/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [패키지 openclaw 블록 추가](/ko/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw 패키지 진입점 선언](/ko/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [선언된 진입점 게시](/ko/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [설치 메타데이터 완성](/ko/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 호환성 선언](/ko/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [최소 호스트 버전 일치](/ko/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [패키지와 매니페스트 버전 일치](/ko/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
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
| `sdk-session-store-write`               | [전체 세션 저장소 쓰기 교체](/ko/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [세션 파일 경로 도우미 교체](/ko/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [레거시 트랜스크립트 파일 대상 교체](/ko/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [저수준 트랜스크립트 도우미 교체](/ko/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start 교체](/ko/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [제공자 환경 변수를 설정 메타데이터로 이동](/ko/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [현재 메타데이터에 채널 환경 변수 반영](/ko/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [사용할 수 없는 보안 매니페스트 스키마 참조 제거](/ko/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [지원되지 않는 보안 매니페스트 파일 제거](/ko/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 패키지 메타데이터

### package-json-missing

패키지 루트에 `package.json`이(가) 없으므로 ClawHub가 npm 패키지, 버전, 진입점 또는 OpenClaw 메타데이터를 식별할 수 없습니다.

- `name`, `version`, `type`이(가) 포함된 `package.json`을(를) 추가하십시오.
- 패키지가 OpenClaw Plugin을 제공하는 경우 `openclaw` 블록을 추가하십시오.
- 최소 패키지 예제는 [Plugin 빌드](/ko/plugins/building-plugins)를, 패키지와 매니페스트의 구분은 [Plugin 매니페스트](/ko/plugins/manifest#manifest-versus-packagejson)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-openclaw-metadata-missing

패키지에 `package.json`이(가) 있지만 OpenClaw 패키지 메타데이터를 선언하지 않습니다.

- `package.json#openclaw`을(를) 추가하십시오.
- `openclaw.extensions` 또는 `openclaw.runtimeExtensions`과(와) 같은 진입점 메타데이터를 포함하십시오.
- 패키지를 ClawHub를 통해 게시하거나 설치할 경우 호환성 및 설치 메타데이터를 추가하십시오.
- [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-openclaw-entry-missing

패키지 메타데이터가 존재하지만 OpenClaw 런타임 진입점을 선언하지 않습니다.

- 네이티브 Plugin 진입점에 `openclaw.extensions`을(를) 추가하십시오.
- 게시된 패키지가 빌드된 JavaScript를 로드해야 하는 경우 `openclaw.runtimeExtensions`을(를) 추가하십시오.
- 모든 진입점 경로를 패키지 디렉터리 내부에 유지하십시오.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)과 [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-entrypoint-missing

패키지가 OpenClaw 진입점을 선언하지만 참조된 파일이 검증 중인 패키지에 없습니다.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, `openclaw.runtimeSetupEntry`의 각 경로를 확인하십시오.
- 진입점이 `dist`에 생성되는 경우 패키지를 빌드하십시오.
- 진입점이 이동한 경우 메타데이터를 업데이트하십시오.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-install-metadata-incomplete

ClawHub가 패키지의 설치 또는 업데이트 방법을 확인할 수 없습니다.

- `openclaw.install`에 `clawhubSpec`, `npmSpec`, `localPath`과(와) 같은 지원되는 설치 소스를 입력하십시오.
- 둘 이상의 설치 소스를 사용할 수 있는 경우 `openclaw.install.defaultChoice`을(를) 설정하십시오.
- 최소 OpenClaw 호스트 버전에는 `openclaw.install.minHostVersion`을(를) 사용하십시오.
- [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-plugin-api-compat-missing

패키지가 지원하는 OpenClaw Plugin API 범위를 선언하지 않습니다.

- `package.json`에 `openclaw.compat.pluginApi`을(를) 추가하십시오.
- 빌드하고 테스트할 때 기준으로 사용한 OpenClaw Plugin API 버전 또는 semver 최솟값을 사용하십시오.
- 이를 패키지 버전과 구분하십시오. 패키지 버전은 Plugin 릴리스를 설명하고, `openclaw.compat.pluginApi`은(는) 호스트 API 계약을 설명합니다.
- [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-min-host-version-drift

패키지의 최소 호스트 버전이 패키지 빌드의 기준이 된 OpenClaw 버전 메타데이터와 일치하지 않습니다.

- `openclaw.install.minHostVersion`을(를) 확인하십시오.
- 릴리스 중 사용된 OpenClaw 버전과 같은 패키지 내 OpenClaw 빌드 메타데이터를 확인하십시오.
- 패키지가 실제로 지원하는 호스트 버전 범위에 최소 호스트 버전을 맞추십시오.
- [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-manifest-version-drift

패키지 버전과 Plugin 매니페스트 버전이 서로 일치하지 않습니다.

- 패키지 릴리스 버전으로 `package.json#version`을(를) 우선 사용하십시오.
- `openclaw.plugin.json`에도 `version`이(가) 있는 경우 일치하도록 업데이트하거나, 패키지 메타데이터가 기준이라면 오래된 매니페스트 버전 메타데이터를 제거하십시오.
- 게시된 메타데이터를 변경한 후 새 패키지 버전을 게시하십시오.
- [Plugin 매니페스트](/ko/plugins/manifest)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-openclaw-unsupported-metadata

`package.json#openclaw` 블록에 OpenClaw 패키지 메타데이터로 지원되지 않는 필드가 포함되어 있습니다.

- `openclaw.bundle`과(와) 같은 지원되지 않는 필드를 제거하십시오.
- 네이티브 Plugin 메타데이터는 `openclaw.plugin.json`에 유지하십시오.
- 패키지 진입점, 호환성, 설치, 설정 및 카탈로그 메타데이터는 지원되는 `package.json#openclaw` 필드에 유지하십시오.
- [검색에 영향을 미치는 package.json 필드](/ko/plugins/manifest#packagejson-fields-that-affect-discovery)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

## 게시된 아티팩트

### package-npm-pack-unavailable

패키지를 ClawHub가 검사하거나 게시할 아티팩트로 패킹할 수 없습니다.

- 패키지 루트에서 `npm pack --dry-run`을(를) 실행하십시오.
- 패킹 실패를 유발하는 잘못된 패키지 메타데이터, 손상된 수명 주기 스크립트 또는 files 항목을 수정하십시오.
- 이 패키지를 공개적으로 게시하려는 경우 `private: true`을(를) 제거하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-npm-pack-entrypoint-missing

패키지를 패킹할 수 있지만 패킹된 아티팩트에 `package.json#openclaw`에서 선언된 진입점 파일이 포함되어 있지 않습니다.

- `npm pack --dry-run`을(를) 실행하고 포함될 파일을 검사하십시오.
- 패킹하기 전에 생성되는 진입점을 빌드하십시오.
- 선언된 진입점이 포함되도록 `files`, `.npmignore` 또는 빌드 출력을 업데이트하십시오.
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을(를) 다시 실행하십시오.

### package-npm-pack-metadata-missing

패킹된 아티팩트에 소스 패키지에 있는 OpenClaw 메타데이터가 없습니다.

- `npm pack --dry-run`을 실행하고 포함된 메타데이터 파일을 검사하십시오.
- 패키징된 아티팩트에 `openclaw` 블록이 포함되도록 `package.json`을 구성하십시오.
- 패키지가 네이티브 OpenClaw Plugin인 경우 `openclaw.plugin.json`이 포함되도록 하십시오.
- 패키지 메타데이터가 제외되지 않도록 `files` 또는 `.npmignore`을 업데이트하십시오.
- [Plugin 빌드](/ko/plugins/building-plugins)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

## 매니페스트 메타데이터

### manifest-name-missing

네이티브 Plugin 매니페스트에 표시 이름이 포함되어 있지 않습니다.

- `openclaw.plugin.json`에 비어 있지 않은 `name` 필드를 추가하십시오.
- `name`은 사람이 읽기 쉽게 유지하고, `id`은 안정적인 머신 ID로 유지하십시오.
- [Plugin 매니페스트](/ko/plugins/manifest)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### manifest-unknown-fields

Plugin 매니페스트에 OpenClaw가 지원하지 않는 최상위 필드가 있습니다.

- 각 최상위 필드를
  [매니페스트 필드 참조](/ko/plugins/manifest#top-level-field-reference)와 비교하십시오.
- `openclaw.plugin.json`에서 사용자 정의 필드를 제거하십시오.
- 패키지 또는 설치 메타데이터를 매니페스트 대신 지원되는 `package.json#openclaw` 필드로
  이동하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### manifest-unknown-contracts

매니페스트가 `contracts` 내부에 지원되지 않는 키를 선언합니다.

- `contracts` 아래의 각 키를
  [계약 참조](/ko/plugins/manifest#contracts-reference)와 비교하십시오.
- 지원되지 않는 계약 키를 제거하십시오.
- 런타임 동작은 Plugin 등록 코드로 이동하고, `contracts`은
  정적 기능 소유권 메타데이터로만 제한하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

## SDK 및 호환성 마이그레이션

### legacy-root-sdk-import

Plugin이 사용 중단된 루트 SDK 배럴에서 가져옵니다:
`openclaw/plugin-sdk`.

- 루트 배럴 가져오기를 범위가 명확한 공개 하위 경로 가져오기로 교체하십시오.
- `definePluginEntry`에는 `openclaw/plugin-sdk/plugin-entry`을 사용하십시오.
- 채널 진입점 헬퍼에는 `openclaw/plugin-sdk/channel-core`을 사용하십시오.
- 범위가 좁은 가져오기 경로를 찾으려면 [가져오기 규칙](/ko/plugins/building-plugins#import-conventions)과
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### reserved-sdk-import

Plugin이 번들 Plugin 또는 내부 호환성을 위해 예약된 SDK 경로에서 가져옵니다.

- 예약된 OpenClaw 내부 SDK 가져오기를 문서화된 공개
  `openclaw/plugin-sdk/*` 하위 경로로 교체하십시오.
- 해당 동작을 위한 공개 SDK가 없다면 헬퍼를 패키지 내부에 유지하거나
  공개 OpenClaw API를 요청하십시오.
- 지원되는 가져오기 경로를 선택하려면 [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)와
  [SDK 마이그레이션](/ko/plugins/sdk-migration)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### sdk-load-session-store

Plugin이 여전히 사용 중단된 전체 세션 저장소 헬퍼
`loadSessionStore`을 사용합니다.

- 세션 상태를 읽을 때는 `getSessionEntry(...)` 또는 `listSessionEntries(...)`을
  사용하십시오.
- 세션 상태를 쓸 때는 `patchSessionEntry(...)` 또는 `upsertSessionEntry(...)`을
  사용하십시오.
- 전체 세션 저장소 객체를 로드하고 변경한 뒤 저장하지 마십시오.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을
  계속 지원하는 동안에만 `loadSessionStore(...)`을 유지하십시오.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### sdk-session-store-write

Plugin이 여전히 `saveSessionStore` 또는 `updateSessionStore`과 같은
사용 중단된 전체 세션 저장소 쓰기 헬퍼를 사용합니다.

- 기존 세션 항목의 필드를 업데이트할 때는 `patchSessionEntry(...)`을
  사용하십시오.
- 세션 항목을 교체하거나 생성할 때는 `upsertSessionEntry(...)`을 사용하십시오.
- 전체 세션 저장소 객체를 로드하고 변경한 뒤 저장하지 마십시오.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을
  계속 지원하는 동안에만 전체 저장소 쓰기 헬퍼를 유지하십시오.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### sdk-session-file-helper

Plugin이 여전히 `resolveSessionFilePath` 또는 `resolveAndPersistSessionFile`과 같은
사용 중단된 세션 파일 경로 헬퍼를 사용합니다.

- 에이전트 및 세션 ID별로 세션 메타데이터를 읽으려면 `getSessionEntry(...)`을
  사용하십시오.
- 세션 메타데이터를 영구 저장하려면 `patchSessionEntry(...)` 또는 `upsertSessionEntry(...)`을
  사용하십시오.
- 코드가 트랜스크립트 작업을 준비하는 경우 트랜스크립트 ID 또는 대상 헬퍼를
  사용하십시오.
- 레거시 트랜스크립트 파일 경로를 영구 저장하거나 이에 의존하지 마십시오.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### sdk-session-transcript-file-target

Plugin이 여전히 사용 중단된 트랜스크립트 파일 대상 헬퍼
`resolveSessionTranscriptLegacyFileTarget`을 사용합니다.

- 코드에 공개 세션 ID만 필요한 경우 `resolveSessionTranscriptIdentity(...)`을
  사용하십시오.
- 코드에 구조화된 트랜스크립트 작업 대상이 필요한 경우 `resolveSessionTranscriptTarget(...)`을
  사용하십시오.
- 레거시 트랜스크립트 파일 대상을 직접 읽거나 구성하지 마십시오.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을 계속
  지원하는 동안에만 레거시 헬퍼를 유지하십시오.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### sdk-session-transcript-low-level

Plugin이 여전히 `appendSessionTranscriptMessage` 또는 `emitSessionTranscriptUpdate`과 같은
사용 중단된 저수준 트랜스크립트 헬퍼를 사용합니다.

- 트랜스크립트 추가에는 `appendSessionTranscriptMessageByIdentity(...)`을 사용하십시오.
- 트랜스크립트 업데이트 알림에는 `publishSessionTranscriptUpdateByIdentity(...)`을
  사용하십시오.
- OpenClaw가 올바른 트랜잭션 경계 및 ID 처리를 적용할 수 있도록
  구조화된 트랜스크립트 런타임 표면을 사용하는 것이 좋습니다.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을
  계속 지원하는 동안에만 저수준 트랜스크립트 헬퍼를 유지하십시오.
- [런타임 API](/ko/plugins/sdk-runtime#agent-session-state)와
  [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### legacy-before-agent-start

Plugin이 여전히 레거시 `before_agent_start` 훅을 사용합니다.

- 모델 또는 공급자 재정의 작업을 `before_model_resolve`으로 이동하십시오.
- 프롬프트 또는 컨텍스트 변경 작업을 `before_prompt_build`로 이동하십시오.
- 선언한 호환성 범위가 이를 요구하는 이전 OpenClaw 버전을 계속
  지원하는 동안에만 `before_agent_start`을 유지하십시오.
- [훅](/ko/plugins/hooks)과
  [Plugin 호환성](/ko/plugins/compatibility)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### provider-auth-env-vars

매니페스트가 여전히 레거시 `providerAuthEnvVars` 공급자 인증 메타데이터를 사용합니다.

- 공급자 환경 변수 메타데이터를 `setup.providers[].envVars`에 반영하십시오.
- 지원하는 OpenClaw 범위에서 계속 필요한 동안에만 `providerAuthEnvVars`을
  호환성 메타데이터로 유지하십시오.
- [설정 참조](/ko/plugins/manifest#setup-reference)와
  [SDK 마이그레이션](/ko/plugins/sdk-migration)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### channel-env-vars

매니페스트가 ClawHub에서 요구하는 최신 설정 또는 구성 메타데이터 없이
레거시 또는 이전 채널 환경 변수 메타데이터를 사용합니다.

- OpenClaw가 채널 런타임을 로드하지 않고도 설정 상태를 검사할 수 있도록
  채널 환경 변수 메타데이터를 선언적으로 유지하십시오.
- 환경 변수 기반 채널 설정을 Plugin 구조에서 사용하는 현재 설정, 채널 구성 또는
  패키지 채널 메타데이터에 반영하십시오.
- 지원되는 이전 OpenClaw 버전에서 계속 필요한 동안에만 `channelEnvVars`을
  호환성 메타데이터로 유지하십시오.
- [Plugin 매니페스트](/ko/plugins/manifest)와
  [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

## 보안 매니페스트

### security-manifest-schema-unavailable

패키지가 ClawHub에서 사용 가능한 것으로 인식하지 않는 스키마 참조를 포함한
`openclaw.security.json`을 제공합니다.

- 스키마 URL이 참고용일 뿐이라면 제거하십시오.
- OpenClaw가 문서화된 버전별 스키마를 게시한 후에만 해당 스키마를 사용하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

### unrecognized-security-manifest

패키지가 지원되지 않는 보안 매니페스트 파일을 제공합니다.

- OpenClaw가 버전별 보안 매니페스트 스키마와 ClawHub 동작을 문서화할 때까지
  `openclaw.security.json`을 제거하십시오.
- 매니페스트 계약이 마련될 때까지 보안에 민감한 동작을 공개 패키지 문서 또는
  README에 문서화하십시오.
- `clawhub package validate <path-to-plugin>`을 다시 실행하십시오.

## 관련 문서

- [ClawHub CLI](/ko/clawhub/cli)
- [ClawHub 게시](/ko/clawhub/publishing)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [Plugin 호환성](/ko/plugins/compatibility)
