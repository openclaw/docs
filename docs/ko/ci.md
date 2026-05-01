---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 파악해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 엄브렐러 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-01T06:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 푸시될 때마다, 그리고 모든 풀 리퀘스트마다 실행됩니다. `preflight` 작업은 변경 차이를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 레인을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 범위 지정을 우회하고 릴리스 후보 및 광범위한 검증을 위해 전체 그래프를 펼칩니다. Android 레인은 `include_android`를 통해 옵트인으로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin 사전 릴리스`](#plugin-prerelease) 워크플로에 있으며, [`전체 릴리스 검증`](#full-release-validation) 또는 명시적인 수동 디스패치에서만 실행됩니다.

## 파이프라인 개요

| 작업                              | 목적                                                                                      | 실행 시점                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 문서 전용 변경, 변경된 범위, 변경된 확장, CI 매니페스트 빌드를 감지합니다      | 초안이 아닌 푸시와 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 개인 키 감지 및 워크플로 감사                                        | 초안이 아닌 푸시와 PR에서 항상 |
| `security-dependency-audit`      | npm 권고에 대해 의존성 없는 프로덕션 잠금 파일 감사를 수행합니다                             | 초안이 아닌 푸시와 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업의 필수 집계 항목입니다                                                | 초안이 아닌 푸시와 PR에서 항상 |
| `check-dependencies`             | 프로덕션 Knip 의존성 전용 패스와 미사용 파일 허용 목록 가드를 실행합니다                    | Node 관련 변경              |
| `build-artifacts`                | `dist/`, Control UI, 빌드된 아티팩트 검사, 재사용 가능한 다운스트림 아티팩트를 빌드합니다          | Node 관련 변경              |
| `checks-fast-core`               | 번들/Plugin 계약/프로토콜 검사 같은 빠른 Linux 정확성 레인입니다                 | Node 관련 변경              |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과가 있는 샤딩된 채널 계약 검사입니다                         | Node 관련 변경              |
| `checks-node-core-test`          | 채널, 번들, 계약, 확장 레인을 제외한 Core Node 테스트 샤드입니다             | Node 관련 변경              |
| `check`                          | 샤딩된 기본 로컬 게이트 동등 항목입니다: 프로덕션 타입, 린트, 가드, 테스트 타입, 엄격한 스모크   | Node 관련 변경              |
| `check-additional`               | 아키텍처, 경계, 확장 표면 가드, 패키지 경계, Gateway 감시 샤드입니다 | Node 관련 변경              |
| `build-smoke`                    | 빌드된 CLI 스모크 테스트와 시작 메모리 스모크입니다                                               | Node 관련 변경              |
| `checks`                         | 빌드된 아티팩트 채널 테스트의 검증기입니다                                                    | Node 관련 변경              |
| `checks-node-compat-node22`      | Node 22 호환성 빌드 및 스모크 레인입니다                                                   | 릴리스용 수동 CI 디스패치    |
| `check-docs`                     | 문서 포매팅, 린트, 깨진 링크 검사입니다                                                | 문서 변경                       |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest입니다                                                       | Python Skills 관련 변경      |
| `checks-windows`                 | Windows 전용 프로세스/경로 테스트와 공유 런타임 import 지정자 회귀 검사입니다         | Windows 관련 변경           |
| `macos-node`                     | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인입니다                                  | macOS 관련 변경             |
| `macos-swift`                    | macOS 앱의 Swift 린트, 빌드, 테스트입니다                                               | macOS 관련 변경             |
| `android`                        | 두 flavor의 Android 단위 테스트와 디버그 APK 빌드 하나입니다                                 | Android 관련 변경           |
| `test-performance-agent`         | 신뢰된 활동 이후 매일 실행되는 Codex 느린 테스트 최적화입니다                                    | 메인 CI 성공 또는 수동 디스패치 |

## 빠른 실패 순서

1. `preflight`는 어떤 레인이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 이 작업 안의 단계이며, 독립 작업이 아닙니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 다운스트림 소비자가 시작할 수 있습니다.
4. 그다음 더 무거운 플랫폼 및 런타임 레인이 펼쳐집니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` 참조에 새 푸시가 올라오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 참조의 최신 실행도 실패 중인 경우가 아니라면 이를 CI 잡음으로 간주하세요. 집계 샤드 검사는 `!cancelled() && always()`를 사용하므로 일반적인 샤드 실패는 계속 보고하지만, 전체 워크플로가 이미 대체된 뒤에는 대기열에 들어가지 않습니다. 자동 CI 동시성 키는 버전이 지정되어 있어(`CI-v7-*`) 이전 대기열 그룹의 GitHub 측 좀비가 더 새로운 메인 실행을 무기한 차단할 수 없습니다. 수동 전체 제품군 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

## 범위 및 라우팅

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 커버됩니다. 수동 디스패치는 변경 범위 감지를 건너뛰고, 모든 범위 영역이 변경된 것처럼 preflight 매니페스트가 동작하게 합니다.

- **CI 워크플로 편집**은 Node CI 그래프와 워크플로 린팅을 검증하지만, 그 자체로 Windows, Android 또는 macOS 네이티브 빌드를 강제하지 않습니다. 이러한 플랫폼 레인은 플랫폼 소스 변경으로 범위가 유지됩니다.
- **CI 라우팅 전용 편집, 선택된 저비용 Core 테스트 fixture 편집, 좁은 Plugin 계약 헬퍼/테스트 라우팅 편집**은 빠른 Node 전용 매니페스트 경로를 사용합니다: `preflight`, 보안, 단일 `checks-fast-core` 작업입니다. 이 경로는 변경이 빠른 작업이 직접 실행하는 라우팅 또는 헬퍼 표면으로 제한될 때 빌드 아티팩트, Node 22 호환성, 채널 계약, 전체 Core 샤드, 번들 Plugin 샤드, 추가 가드 매트릭스를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 프로세스/경로 래퍼, npm/pnpm/UI 러너 헬퍼, 패키지 관리자 설정, 그리고 해당 레인을 실행하는 CI 워크플로 표면으로 범위가 지정됩니다. 관련 없는 소스, Plugin, 설치 스모크, 테스트 전용 변경은 Linux Node 레인에 남습니다.

가장 느린 Node 테스트 계열은 각 작업이 러너를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. 채널 계약은 세 개의 가중 샤드로 실행되고, 작은 Core 단위 레인은 쌍으로 묶이며, 자동 응답은 네 개의 균형 잡힌 워커로 실행됩니다. 이때 응답 하위 트리는 agent-runner, dispatch, commands/state-routing 샤드로 나뉩니다. agentic Gateway/Plugin 설정은 빌드 아티팩트를 기다리는 대신 기존 소스 전용 agentic Node 작업에 분산됩니다. 광범위한 브라우저, QA, 미디어, 기타 Plugin 테스트는 공유 Plugin 포괄 설정 대신 전용 Vitest 설정을 사용합니다. 포함 패턴 샤드는 CI 샤드 이름을 사용해 타이밍 항목을 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 설정과 필터링된 샤드를 구분할 수 있습니다. `check-additional`은 패키지 경계 컴파일/카나리 작업을 함께 유지하고, 런타임 토폴로지 아키텍처를 Gateway 감시 커버리지와 분리합니다. 경계 가드 샤드는 하나의 작업 안에서 작은 독립 가드를 동시에 실행합니다. Gateway 감시, 채널 테스트, Core 지원 경계 샤드는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play 디버그 APK를 빌드합니다. 서드파티 flavor에는 별도의 소스 세트나 매니페스트가 없습니다. 해당 단위 테스트 레인은 여전히 SMS/통화 기록 BuildConfig 플래그로 flavor를 컴파일하면서, Android 관련 푸시마다 중복 디버그 APK 패키징 작업은 피합니다.

`check-dependencies` 샤드는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정된 프로덕션 Knip 의존성 전용 패스이며, `dlx` 설치에 대해 pnpm의 최소 릴리스 나이 제한이 비활성화됨)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 프로덕션 미사용 파일 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. 미사용 파일 가드는 PR이 새로 검토되지 않은 미사용 파일을 추가하거나 오래된 허용 목록 항목을 남겨두면 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 동적 Plugin, 생성물, 빌드, 라이브 테스트, 패키지 브리지 표면은 보존합니다.

## 수동 디스패치

수동 CI 디스패치는 일반 CI와 같은 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 레인을 강제로 켭니다: Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Control UI i18n입니다. 독립 수동 CI 디스패치는 `include_android=true`일 때만 Android를 실행합니다. 전체 릴리스 우산 워크플로는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin 사전 릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 배치 스윕, Plugin 사전 릴리스 Docker 레인은 CI에서 제외됩니다. Docker 사전 릴리스 제품군은 `Full Release Validation`이 릴리스 검증 게이트를 활성화해 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 제품군이 같은 참조의 다른 푸시나 PR 실행 때문에 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰된 호출자가 선택한 디스패치 참조의 워크플로 파일을 사용하면서, 브랜치, 태그 또는 전체 커밋 SHA에 대해 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 검증기, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있음 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 낮은 가중치의 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(CPU에 충분히 민감하여 8 vCPU가 절약한 것보다 더 많은 비용이 들었음); install-smoke Docker 빌드(32-vCPU 큐 시간이 절약한 것보다 더 많은 비용이 들었음)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; 포크는 `macos-latest`로 대체됨                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; 포크는 `macos-latest`로 대체됨                                                                                                                                                                                                                                                                                                                                                                                                 |

## 로컬 대응 항목

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 상위 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 입력받아 해당 대상을 사용해 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 검증을 위해 `Plugin Prerelease`를 디스패치하며, install smoke, package acceptance, Docker 릴리스 경로 스위트, live/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. 게시된 패키지 사양이 제공되면 게시 후 `NPM Telegram Beta E2E` 워크플로도 실행할 수 있습니다.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트,
집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

`release_profile`은 릴리스 검사로 전달되는 live/provider 범위를 제어합니다.
수동 릴리스 워크플로의 기본값은 `stable`입니다. 광범위한 권고 provider/media 매트릭스를
의도적으로 원할 때만 `full`을 사용하세요.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 필수 레인을 유지합니다.
- `stable`은 안정적인 provider/backend 집합을 추가합니다.
- `full`은 광범위한 권고 provider/media 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하고 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로를 다시 실행해 녹색으로 바뀌면 상위 검증기 작업만 다시 실행해 상위 결과와 타이밍 요약을 갱신하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 항목만에는 `ci`, Plugin prerelease 하위 항목만에는 `plugin-prerelease`, 모든 릴리스 하위 항목에는 `release-checks`를 사용하거나, 상위 워크플로에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위가 제한됩니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택한 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 live/E2E 릴리스 경로 Docker 워크플로와 package acceptance 샤드 모두에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고 여러 하위 작업에서 동일한 후보를 다시 패키징하지 않아도 됩니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은
이전 상위 워크플로를 대체합니다. 상위 모니터는 상위가 취소될 때 이미 디스패치한
모든 하위 워크플로를 취소하므로, 더 새로운 main 검증이 오래된 2시간짜리 release-check 실행 뒤에
머무르지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## Live 및 E2E 샤드

릴리스 live/E2E 하위 항목은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름 있는 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분리된 media audio/video 샤드 및 provider 필터링된 music 샤드

이렇게 하면 동일한 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 live media 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. media 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live 스위트는 일반 Blacksmith 러너에 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적합하지 않습니다.

Docker 기반 live model/backend 샤드는 선택한 커밋별로 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. live 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker live model, provider 샤딩된 Gateway, CLI backend, ACP bind, Codex harness 샤드가 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행됩니다. Gateway Docker 샤드는 워크플로 작업 제한 시간보다 낮은 명시적인 스크립트 수준 `timeout` 한도를 가지므로, 멈춘 컨테이너나 정리 경로가 전체 release-check 예산을 소모하지 않고 빠르게 실패합니다. 해당 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드로 벽시계 시간을 낭비하게 됩니다.

## Package Acceptance

“이 설치 가능한 OpenClaw 패키지가 제품으로 동작하는가?”가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, package acceptance는 설치 또는 업데이트 후 사용자가 실행하는 동일한 Docker E2E harness를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰며, 둘 다 `package-under-test` 아티팩트로 업로드하고, GitHub 단계 요약에 소스, 워크플로 참조, 패키지 참조, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`와 함께 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하며, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하고, 워크플로 체크아웃을 패킹하는 대신 해당 패키지에 대해 선택된 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음, 고유한 아티팩트를 가진 병렬 대상 Docker 작업으로 해당 레인을 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 패키지를 해석한 경우 같은 `package-under-test` 아티팩트를 설치합니다. 독립형 Telegram 디스패치는 여전히 게시된 npm 명세를 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 승인, 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패 처리합니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 beta/stable 승인을 위해 이것을 사용하세요.
- `source=ref`는 신뢰된 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패킹합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하며, 분리된 worktree에 deps를 설치하고, `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다.
- `source=artifact`는 `artifact_run_id` 및 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에 공유되는 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰된 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이렇게 하면 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 이전의 신뢰된 소스 커밋을 검증할 수 있습니다.

### 스위트 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package`에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`를 더한 것
- `full` — OpenWebUI를 포함한 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로, 게시된 패키지 검증이 실시간 ClawHub 가용성에 의해 게이트되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm 명세 경로는 독립형 디스패치용으로 유지됩니다.

릴리스 검사는 `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, `telegram_mode=mock-openai`로 Package Acceptance를 호출합니다. 릴리스 경로 Docker 청크는 겹치는 패키지/업데이트/Plugin 레인을 커버합니다. Package Acceptance는 같은 해석된 패키지 tarball에 대해 아티팩트 네이티브 번들 채널 호환성, 오프라인 Plugin, Telegram 증명을 유지합니다. Cross-OS 릴리스 검사는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 커버합니다. 패키지/업데이트 제품 검증은 Package Acceptance로 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 실행당 하나의 게시된 패키지 기준선을 검증합니다. Package Acceptance에서 해석된 `package-under-test` tarball은 항상 후보이며, `published_upgrade_survivor_baseline`은 게시된 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. 로컬 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`을 `openclaw@2026.4.15` 같은 정확한 패키지로 설정할 수 있습니다. 게시된 레인은 구워진 `openclaw config set` 명령 레시피로 기준선을 구성한 다음, 레시피 단계를 `summary.json`에 기록합니다. 더 넓은 이전 버전 커버리지는 Package Acceptance를 정확한 `published_upgrade_survivor_baseline` 값별로 샤딩해야 합니다. Windows 패키지 및 설치 프로그램 신규 레인도 설치된 패키지가 원시 절대 Windows 경로에서 브라우저 제어 오버라이드를 가져올 수 있는지 확인합니다. OpenAI Cross-OS 에이전트 턴 smoke는 설정된 경우 기본값으로 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4-mini`를 사용하므로 설치 및 Gateway 증명이 빠르고 결정적으로 유지됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지에 대한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 정리할 수 있으며, 누락된 지속 `update.channel`을 로그로 남길 수 있습니다.
- Plugin smoke는 레거시 설치 기록 위치를 읽거나 누락된 마켓플레이스 설치 기록 지속성을 허용할 수 있습니다.
- `plugin-update`는 설치 기록 및 재설치 없음 동작이 변경되지 않은 상태로 유지되어야 한다는 요구 사항은 유지하면서, 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배송된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 합니다. 같은 조건은 경고 또는 건너뛰기 대신 실패합니다.

### 예시

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

실패한 패키지 승인 실행을 디버그할 때는 `resolve_package` 요약에서 시작하여 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 그 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령을 검사하세요. 전체 릴리스 검증을 재실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 재실행하는 것을 선호하세요.

## 설치 smoke

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker smoke 작업이 실행하는 핵심 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 pull request에 대해 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 수정, 문서 전용 수정은 Docker worker를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하며, 에이전트 삭제 공유 워크스페이스 CLI smoke를 실행하고, 컨테이너 Gateway 네트워크 e2e를 실행하며, 번들 확장 빌드 인자를 검증하고, 240초 집계 명령 제한 시간 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 설치 프로그램/패키지/Docker 표면을 실제로 건드리는 pull request를 위해 QR 패키지 설치 및 설치 프로그램 Docker/업데이트 커버리지를 유지합니다. 전체 모드에서 install-smoke는 하나의 대상 SHA GHCR 루트 Dockerfile smoke 이미지를 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway smoke, 설치 프로그램/업데이트 smoke, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 프로그램 작업이 루트 이미지 smoke 뒤에서 대기하지 않게 합니다.

`main` push(merge commit 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 push에서 전체 커버리지를 요청하더라도, 워크플로는 빠른 Docker smoke를 유지하고 전체 설치 smoke는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 이미지 제공자 smoke는 `run_bun_global_install_smoke`로 별도로 게이트됩니다. 이는 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 pull request와 `main` push는 그렇지 않습니다. QR 및 설치 프로그램 Docker 테스트는 각자의 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 하나의 공유 live-test 이미지를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 의존성 레인을 위한 기본 Node/Git 실행기
- 일반 기능 레인을 위해 같은 tarball을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 실행기는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 및 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인을 위한 메인 풀 슬롯 수입니다.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 제공자 민감 tail 풀 슬롯 수입니다.                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 제공자가 스로틀링하지 않도록 하는 동시 live 레인 상한입니다.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한입니다.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한입니다.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격입니다. 간격을 두지 않으려면 `0`으로 설정하세요. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분)입니다. 선택된 live/tail 레인은 더 엄격한 상한을 사용합니다.      |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록입니다. 에이전트가 실패한 레인 하나를 재현할 수 있도록 cleanup smoke를 건너뜁니다. |

유효 상한보다 무거운 레인은 비어 있는 풀에서 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 활성 레인 상태를 출력하고, 가장 긴 레인 우선 정렬을 위해 레인 타이밍을 유지하며, 기본적으로 첫 실패 이후에는 새 풀링 레인 예약을 중단합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 범위를 질의합니다. 그런 다음 `scripts/docker-e2e.mjs`는 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패키징하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. 그런 다음 tarball 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 지정된 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시하며, 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력이나 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 pull은 시도당 180초의 제한된 타임아웃으로 재시도되므로 멈춘 레지스트리/캐시 스트림이 CI 핵심 경로의 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 범위는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하므로 각 청크는 필요한 이미지 종류만 pull하고 동일한 가중치 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`부터 `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, `bundled-channels-contracts`입니다. 집계 `bundled-channels` 청크는 수동 단발 재실행용으로 계속 사용할 수 있으며, `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`도 집계 Plugin/런타임 별칭으로 유지됩니다. `install-e2e` 레인 별칭은 두 provider 설치 관리자 레인 모두에 대한 집계 수동 재실행 별칭으로 유지됩니다. `bundled-channels` 청크는 직렬 올인원 `bundled-channel-deps` 레인 대신 분할된 `bundled-channel-*` 및 `bundled-channel-update-*` 레인을 실행합니다.

OpenWebUI는 전체 릴리스 경로 범위가 요청할 때 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에 대해서만 독립형 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로의 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행하므로, 실패 레인 디버깅은 하나의 대상 Docker 작업으로 제한되고 해당 실행에 필요한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인인 경우, 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 존재할 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 전체 릴리스 경로 Docker 제품군을 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 범위이므로 `Full Release Validation` 또는 명시적 운영자가 디스패치하는 별도 워크플로입니다. 일반 pull request, `main` push, 독립 실행형 수동 CI 디스패치에서는 해당 제품군을 끕니다. 이 워크플로는 번들 Plugin 테스트를 8개의 extension worker에 분산합니다. 해당 extension 샤드 작업은 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하며, import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록 그룹당 하나의 Vitest worker와 더 큰 Node heap을 사용합니다. 릴리스 전용 Docker 사전 릴리스 경로는 수십 개의 runner를 1~3분짜리 작업에 예약하지 않도록 대상 Docker 레인을 작은 그룹으로 배치합니다.

## QA Lab

QA Lab에는 기본 스마트 스코프 워크플로 외부에 전용 CI 레인이 있습니다.

- `Parity gate` 워크플로는 일치하는 PR 변경과 수동 디스패치에서 실행됩니다. private QA 런타임을 빌드하고 mock GPT-5.5 및 Opus 4.6 에이전트 팩을 비교합니다.
- `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 그리고 수동 디스패치에서 실행됩니다. mock parity gate, live Matrix 레인, live Telegram 및 Discord 레인을 병렬 작업으로 팬아웃합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex lease를 사용합니다.

릴리스 검사는 결정적 mock provider와 mock으로 한정된 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하므로, 채널 계약이 라이브 모델 지연과 일반 provider Plugin 시작으로부터 격리됩니다. 라이브 전송 Gateway는 QA parity가 메모리 동작을 별도로 다루므로 메모리 검색을 비활성화합니다. provider 연결성은 별도의 라이브 모델, 네이티브 provider, Docker provider 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 범위를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`도 릴리스 승인 전에 릴리스 핵심 QA Lab 레인을 실행합니다. QA parity gate는 candidate와 baseline 팩을 병렬 레인 작업으로 실행한 다음, 최종 parity 비교를 위해 두 아티팩트를 작은 보고서 작업으로 다운로드합니다.

변경이 실제로 QA 런타임, 모델 팩 parity, 또는 parity 워크플로가 소유한 표면을 건드리지 않는 한 PR landing 경로를 `Parity gate` 뒤에 두지 마세요. 일반 채널, 구성, 문서 또는 단위 테스트 수정의 경우 이를 선택적 신호로 취급하고 스코프가 지정된 CI/check 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일, 수동, non-draft pull request guard 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, high/critical `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

pull request guard는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `src` 아래 변경에 대해서만 시작되며, 예약된 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, secret, sandbox, cron, Gateway baseline                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, secret, 감사 접점                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 guard, web-fetch, Plugin SDK SSRF 정책 표면                                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 helper, outbound delivery, agent tool 실행 gate                                                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, loader, manifest, registry, runtime-dependency staging, source-loading, Plugin SDK 패키지 계약 신뢰 표면                  |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. workflow sanity가 허용하는 가장 작은 Blacksmith Linux runner에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 dependency build 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드가 깨끗한 경우에도 런타임을 지배하므로 일일 기본값 밖에 둡니다.

### Critical Quality 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux runner에서 좁고 가치가 높은 표면을 대상으로 error-severity, 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. pull request guard는 의도적으로 예약 프로필보다 작습니다. non-draft PR은 agent command/model/tool 실행 및 reply dispatch 코드, config schema/migration/IO 코드, auth/secrets/sandbox/security 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway protocol/server-method, 메모리 runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queue, Plugin loader, Plugin SDK/package-contract, 또는 Plugin SDK reply runtime 변경에 대해 일치하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL config 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 격리해 실행하기 위한 교육/반복 hook입니다.

| 범주                                                    | 표면                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 비밀 정보, 샌드박스, cron 및 Gateway 보안 경계 코드                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | 구성 스키마, 마이그레이션, 정규화 및 IO 계약                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | 코어 채널 및 번들 채널 Plugin 구현 계약                                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/공급자 디스패치, 자동 답장 디스패치와 큐, ACP 제어 플레인 런타임 계약                                                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 연결부 및 메모리 doctor 명령                                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | 답장 큐 내부 구조, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면 및 세션 doctor CLI 계약                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 답장 디스패치, 답장 페이로드/청킹/런타임 헬퍼, 채널 답장 옵션, 전달 큐 및 세션/스레드 바인딩 헬퍼                                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 공급자 인증과 탐색, 공급자 런타임 등록, 공급자 기본값/카탈로그 및 웹/검색/가져오기/임베딩 레지스트리                                   |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 지속성, Gateway 제어 흐름 및 작업 제어 플레인 런타임 계약                                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 코어 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성 및 미디어 생성 런타임 계약                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면 및 Plugin SDK 진입점 계약                                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                                    |

품질은 보안과 분리되어 유지되므로 품질 발견 사항을 보안 신호를 흐리지 않고 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python 및 번들 Plugin CodeQL 확장은 좁은 프로필이 안정적인 런타임과 신호를 확보한 뒤에만 범위 지정 또는 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 병합된 변경 사항에 맞춰 기존 문서를 유지하는 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수도 있습니다. 워크플로 실행 호출은 `main`이 이미 आगे로 이동했거나 마지막 1시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 번의 시간별 실행으로 마지막 문서 점검 이후 누적된 모든 main 변경 사항을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 제품군 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터 대신 작은 커버리지 보존 테스트 성능 수정만 하도록 한 다음, 전체 제품군 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경 사항을 거부합니다. 기준선에 실패 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 제품군 보고서는 커밋 전에 반드시 통과해야 합니다. 봇 push가 병합되기 전에 `main`이 앞서 나가면, 이 레인은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Docs Agent와 동일한 drop-sudo 안전 태세를 Codex action이 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 병합 후 중복 정리를 위한 수동 유지 관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에, 병합된 PR이 실제로 병합되었고 각 중복 항목에 공유 참조 이슈나 겹치는 변경 hunk가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 확인 게이트 및 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 확인 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다.

- 코어 프로덕션 변경은 코어 prod와 코어 test typecheck 및 코어 lint/guard를 실행합니다.
- 코어 test-only 변경은 코어 test typecheck와 코어 lint만 실행합니다.
- 확장 프로덕션 변경은 확장 prod와 확장 test typecheck 및 확장 lint를 실행합니다.
- 확장 test-only 변경은 확장 test typecheck와 확장 lint를 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 해당 코어 계약에 의존하므로 확장 typecheck까지 확장됩니다(Vitest 확장 스윕은 명시적인 테스트 작업으로 유지됩니다).
- 릴리스 metadata-only 버전 bump는 대상 지정 버전/구성/루트 의존성 확인을 실행합니다.
- 알 수 없는 루트/구성 변경은 안전하게 모든 확인 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 뒤 형제 테스트와 import 그래프 의존 항목을 사용합니다. 공유 그룹 룸 전달 구성은 명시적 매핑 중 하나입니다. 그룹 visible-reply 구성, 소스 답장 전달 모드 또는 message-tool 시스템 프롬프트 변경은 코어 답장 테스트와 Discord 및 Slack 전달 회귀 테스트를 거치므로 공유 기본값 변경이 첫 PR push 전에 실패합니다. 변경이 하네스 전반에 걸쳐 있어 저렴한 매핑 세트를 신뢰할 수 있는 대리 지표로 볼 수 없을 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Repo root에서 Testbox를 실행하고, 넓은 증거에는 새로 예열한 box를 선호하세요. 재사용되었거나 만료되었거나 예상보다 큰 sync를 방금 보고한 box에 느린 게이트를 쓰기 전에, 먼저 box 내부에서 `pnpm testbox:sanity`를 실행하세요.

Sanity check는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라졌거나 `git status --short`가 추적 파일 삭제를 200개 이상 표시할 때 빠르게 실패합니다. 이는 보통 원격 sync 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하지 말고 해당 box를 중지한 뒤 새 box를 예열하세요. 의도적인 대규모 삭제 PR의 경우 해당 sanity 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 sync 이후 출력 없이 5분 넘게 sync 단계에 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 이 guard를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
