---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 포괄 작업 및 로컬 명령 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-30T06:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e137eff9234d8a6beb559c5367de0c75f42b892dd69148e86feb7d68c49bf437
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. `preflight` 작업은 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 범위 지정을 우회하고 릴리스 후보와 광범위한 검증을 위해 전체 그래프를 펼칩니다. Android lane은 `include_android`를 통해 계속 옵트인으로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin Prerelease`](#plugin-prerelease) workflow에 있으며, [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 dispatch에서만 실행됩니다.

## 파이프라인 개요

| 작업                             | 목적                                                                                         | 실행 시점                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | docs 전용 변경, 변경된 scope, 변경된 extensions를 감지하고 CI manifest를 빌드합니다          | draft가 아닌 푸시와 PR에서 항상      |
| `security-scm-fast`              | `zizmor`를 통한 private key 감지 및 workflow audit                                            | draft가 아닌 푸시와 PR에서 항상      |
| `security-dependency-audit`      | npm advisory에 대해 dependency 없이 production lockfile을 audit합니다                         | draft가 아닌 푸시와 PR에서 항상      |
| `security-fast`                  | 빠른 security 작업의 필수 aggregate                                                           | draft가 아닌 푸시와 PR에서 항상      |
| `check-dependencies`             | production Knip dependency 전용 pass와 unused-file allowlist guard                            | Node 관련 변경                       |
| `build-artifacts`                | `dist/`, Control UI, built-artifact check, 재사용 가능한 downstream artifact를 빌드합니다     | Node 관련 변경                       |
| `checks-fast-core`               | bundled/plugin-contract/protocol check 같은 빠른 Linux correctness lane                       | Node 관련 변경                       |
| `checks-fast-contracts-channels` | 안정적인 aggregate check 결과가 있는 sharded channel contract check                           | Node 관련 변경                       |
| `checks-node-core-test`          | channel, bundled, contract, extension lane을 제외한 Core Node test shard                      | Node 관련 변경                       |
| `check`                          | sharded main local gate에 해당: prod type, lint, guard, test type, strict smoke               | Node 관련 변경                       |
| `check-additional`               | architecture, boundary, extension-surface guard, package-boundary, gateway-watch shard        | Node 관련 변경                       |
| `build-smoke`                    | 빌드된 CLI smoke test와 startup-memory smoke                                                  | Node 관련 변경                       |
| `checks`                         | built-artifact channel test의 verifier                                                        | Node 관련 변경                       |
| `checks-node-compat-node22`      | Node 22 compatibility build 및 smoke lane                                                     | 릴리스용 수동 CI dispatch            |
| `check-docs`                     | docs formatting, lint, broken-link check                                                      | Docs 변경                            |
| `skills-python`                  | Python 기반 skills용 Ruff + pytest                                                            | Python skill 관련 변경               |
| `checks-windows`                 | Windows 전용 process/path test와 shared runtime import specifier regression                   | Windows 관련 변경                    |
| `macos-node`                     | shared built artifact를 사용하는 macOS TypeScript test lane                                   | macOS 관련 변경                      |
| `macos-swift`                    | macOS 앱용 Swift lint, build, test                                                            | macOS 관련 변경                      |
| `android`                        | 두 flavor의 Android unit test와 debug APK build 하나                                          | Android 관련 변경                    |
| `test-performance-agent`         | 신뢰할 수 있는 활동 이후 매일 실행되는 Codex slow-test optimization                           | Main CI 성공 또는 수동 dispatch      |

## 빠른 실패 순서

1. `preflight`가 어떤 lane이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 이 작업 내부의 step이며, 독립 작업이 아닙니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되어, shared build가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
4. 이후 더 무거운 platform 및 runtime lane이 펼쳐집니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` ref에 더 새로운 푸시가 올라오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패하지 않는 한 이를 CI noise로 취급하세요. Aggregate shard check는 `!cancelled() && always()`를 사용하므로 일반 shard 실패는 계속 보고하지만, 전체 workflow가 이미 대체된 뒤에는 queue에 들어가지 않습니다. 자동 CI concurrency key는 versioned(`CI-v7-*`)되어 있어 GitHub 측의 오래된 queue group zombie가 더 새로운 main 실행을 무기한 막을 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`을 사용하며 진행 중인 실행을 취소하지 않습니다.

## Scope 및 routing

Scope 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 unit test로 커버됩니다. 수동 dispatch는 changed-scope detection을 건너뛰고 preflight manifest가 모든 scoped area가 변경된 것처럼 동작하게 합니다.

- **CI workflow edits**는 Node CI graph와 workflow linting을 검증하지만, 그 자체만으로 Windows, Android, macOS native build를 강제하지 않습니다. 이러한 platform lane은 platform source 변경에만 scoped됩니다.
- **CI routing-only edits, 선택된 저비용 core-test fixture edits, 좁은 plugin contract helper/test-routing edits**는 빠른 Node 전용 manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 이 path는 변경이 fast task가 직접 실행하는 routing 또는 helper surface로 제한될 때 build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, additional guard matrices를 건너뜁니다.
- **Windows Node checks**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI workflow surface에 scoped됩니다. 관련 없는 source, plugin, install-smoke, test-only 변경은 Linux Node lane에 남습니다.

가장 느린 Node test family는 각 작업이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. channel contract는 세 개의 weighted shard로 실행되고, 작은 core unit lane은 paired되며, auto-reply는 네 개의 balanced worker로 실행됩니다(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분할). agentic gateway/plugin config는 built artifact를 기다리는 대신 기존 source-only agentic Node job에 분산됩니다. 광범위한 browser, QA, media, miscellaneous plugin test는 shared plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard name을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard shard는 하나의 작업 안에서 작은 independent guard를 동시에 실행합니다. Gateway watch, channel test, core support-boundary shard는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 이 unit-test lane은 여전히 SMS/call-log BuildConfig flag를 사용해 flavor를 컴파일하면서, Android 관련 모든 푸시에서 중복 debug APK packaging 작업을 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip version에 고정되고 `dlx` install에 대해 pnpm의 minimum release age가 비활성화된 production Knip dependency 전용 pass)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file finding을 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 unused file을 추가하거나 오래된 allowlist entry를 남길 때 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 dynamic plugin, generated, build, live-test, package bridge surface는 보존합니다.

## 수동 dispatch

수동 CI dispatch는 일반 CI와 같은 작업 그래프를 실행하지만 Android가 아닌 모든 scoped lane을 강제로 켭니다: Linux Node shard, bundled-plugin shard, channel contract, Node 22 compatibility, `check`, `check-additional`, build smoke, docs check, Python skills, Windows, macOS, Control UI i18n. Standalone 수동 CI dispatch는 `include_android=true`일 때만 Android를 실행합니다. 전체 release umbrella는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin prerelease static check, 릴리스 전용 `agentic-plugins` shard, 전체 extension batch sweep, plugin prerelease Docker lane은 CI에서 제외됩니다. Docker prerelease suite는 `Full Release Validation`이 release-validation gate를 활성화한 상태로 별도의 `Plugin Prerelease` workflow를 dispatch할 때만 실행됩니다.

수동 실행은 고유한 concurrency group을 사용하므로 release-candidate full suite가 같은 ref의 다른 push 또는 PR run에 의해 취소되지 않습니다. 선택 사항인 `target_ref` input을 사용하면 신뢰할 수 있는 caller가 선택된 dispatch ref의 workflow file을 사용하면서 branch, tag, full commit SHA를 대상으로 해당 graph를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 러너                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 검증기, 문서 검사, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 대기열에 들어갈 수 있음 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 낮은 가중치의 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, 및 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(CPU에 충분히 민감하여 8 vCPU가 절약한 것보다 더 많은 비용이 들었음); install-smoke Docker 빌드(32-vCPU 대기열 시간이 절약한 것보다 더 많은 비용이 들었음)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; 포크는 `macos-latest`로 폴백                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; 포크는 `macos-latest`로 폴백                                                                                                                                                                                                                                                                                                                                                                                                 |

## 로컬 동등 명령

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

`Full Release Validation`은 "릴리스 전에 모든 것을 실행"하기 위한 수동 상위 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받으며, 해당 대상으로 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위해 `Plugin Prerelease`를 디스패치하며, install smoke, package acceptance, Docker 릴리스 경로 스위트, live/E2E, OpenWebUI, QA Lab parity, Matrix 및 Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. 게시된 패키지 사양이 제공되면 게시 후 `NPM Telegram Beta E2E` 워크플로도 실행할 수 있습니다.

`release_profile`은 릴리스 검사에 전달되는 live/provider 범위를 제어합니다.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 중요 레인을 유지합니다.
- `stable`은 안정적인 provider/backend 세트를 추가합니다.
- `full`은 광범위한 advisory provider/media 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하고 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로를 다시 실행하여 녹색이 되면, 상위 검증기 작업만 다시 실행해 상위 결과와 타이밍 요약을 새로 고치세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 항목만에는 `ci`, 모든 릴리스 하위 항목에는 `release-checks`, 또는 상위 워크플로의 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스의 재실행 범위를 제한할 수 있습니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택한 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 live/E2E 릴리스 경로 Docker 워크플로와 package acceptance 샤드 모두에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고, 여러 하위 작업에서 동일한 후보를 다시 패키징하지 않을 수 있습니다.

## Live 및 E2E 샤드

릴리스 live/E2E 하위 항목은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름 있는 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider로 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 media audio/video 샤드 및 provider로 필터링된 music 샤드

이렇게 하면 동일한 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, 및 `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에 계속 유효합니다.

네이티브 live media 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치하며, media 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live 스위트는 일반 Blacksmith 러너에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적합한 위치가 아닙니다.

Docker 기반 live model/backend 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. live 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker live model, gateway, CLI backend, ACP bind 및 Codex harness 샤드가 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행됩니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면, 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드에 wall clock을 낭비하게 됩니다.

## Package Acceptance

"설치 가능한 이 OpenClaw 패키지가 제품으로서 작동하는가?"가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, package acceptance는 사용자가 설치 또는 업데이트 후 실행하는 동일한 Docker E2E 하네스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 작성하고, `.artifacts/docker-e2e-package/package-candidate.json`을 작성하고, 둘 다 `package-under-test` 아티팩트로 업로드하며, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256 및 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball inventory를 검증하고, 필요할 때 package-digest Docker 이미지를 준비하며, 워크플로 체크아웃을 패키징하는 대신 해당 패키지에 대해 선택한 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음, 해당 레인들을 고유 아티팩트가 있는 병렬 대상 Docker 작업으로 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아니면 실행되며, Package Acceptance가 하나를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립형 Telegram 디스패치는 여전히 게시된 npm 사양을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker acceptance 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest` 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 베타/안정 승인에 사용하세요.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹합니다. 리졸버는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하며, 분리된 워크트리에 의존성을 설치한 다음 `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에 공유되는 아티팩트에는 제공해야 합니다.

`workflow_ref`와 `package_ref`를 분리해 두세요. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이를 통해 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 이전의 신뢰할 수 있는 소스 커밋을 검증할 수 있습니다.

### 스위트 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package`와 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI를 포함한 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로 게시된 패키지 검증이 실시간 ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm 사양 경로는 독립 실행형 디스패치용으로 유지됩니다.

릴리스 검사는 `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, `telegram_mode=mock-openai`로 Package Acceptance를 호출합니다. 릴리스 경로 Docker 청크는 겹치는 패키지/업데이트/Plugin 레인을 커버합니다. Package Acceptance는 동일하게 해석된 패키지 tarball에 대해 아티팩트 네이티브 번들 채널 호환성, 오프라인 Plugin, Telegram 증명을 유지합니다. Cross-OS 릴리스 검사는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 커버합니다. 패키지/업데이트 제품 검증은 Package Acceptance부터 시작해야 합니다. Windows 패키지 및 설치 프로그램 fresh 레인은 설치된 패키지가 원시 절대 Windows 경로에서 브라우저 제어 오버라이드를 가져올 수 있는지도 확인합니다. OpenAI Cross-OS agent-turn 스모크는 설정된 경우 기본값으로 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4-mini`를 사용하므로 설치 및 Gateway 증명이 빠르고 결정적으로 유지됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지에 대한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 제거할 수 있으며, 누락된 지속 `update.channel`을 기록할 수 있습니다.
- Plugin 스모크는 레거시 설치 기록 위치를 읽거나 누락된 marketplace 설치 기록 지속성을 허용할 수 있습니다.
- `plugin-update`는 설치 기록과 재설치 없음 동작이 변경되지 않아야 한다는 요구사항은 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 합니다. 동일한 조건은 경고하거나 건너뛰는 대신 실패합니다.

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

실패한 패키지 승인 실행을 디버그할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령을 검사하세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들된 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 핵심 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 pull request에 대해 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하며, agents delete shared-workspace CLI 스모크를 실행하고, 컨테이너 gateway-network e2e를 실행하며, 번들된 확장 빌드 인자를 확인하고, 240초 집계 명령 타임아웃 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 실제로 설치 프로그램/패키지/Docker 표면을 건드리는 pull request를 위해 QR 패키지 설치와 설치 프로그램 Docker/업데이트 커버리지를 유지합니다. 전체 모드에서 install-smoke는 하나의 대상 SHA GHCR 루트 Dockerfile 스모크 이미지를 준비하거나 재사용한 다음 QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 프로그램/업데이트 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하므로 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 기다리지 않습니다.

`main` 푸시(merge commit 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 커버리지를 요청하더라도 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 image-provider 스모크는 `run_bun_global_install_smoke`로 별도로 게이트됩니다. 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 pull request와 `main` 푸시는 실행하지 않습니다. QR 및 설치 프로그램 Docker 테스트는 자체 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 하나의 공유 라이브 테스트 이미지를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 의존성 레인용 기본 Node/Git runner
- 동일한 tarball을 `/app`에 설치하는 일반 기능 레인용 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, runner는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 변수

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인용 메인 풀 슬롯 수.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 공급자에 민감한 tail 풀 슬롯 수.                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 공급자가 throttle하지 않도록 하는 동시 라이브 레인 한도.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 한도.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 한도.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격. 간격을 두지 않으려면 `0`으로 설정하세요. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 fallback 타임아웃(120분). 선택된 live/tail 레인은 더 엄격한 제한을 사용합니다.         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록. cleanup 스모크를 건너뛰어 에이전트가 실패한 레인 하나를 재현할 수 있게 합니다. |

유효 한도보다 무거운 레인도 빈 풀에서는 시작할 수 있으며, 그런 다음 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 활성 레인 상태를 내보내고, 가장 긴 레인을 먼저 정렬하기 위해 레인 타이밍을 지속하며, 기본적으로 첫 실패 후에는 새 pooled 레인 스케줄링을 중지합니다.

### 재사용 가능한 live/E2E 워크플로

재사용 가능한 live/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 어떤 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 커버리지가 필요한지 질의합니다. 그런 다음 `scripts/docker-e2e.mjs`는 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. tarball inventory를 검증합니다. 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker layer cache를 통해 패키지 다이제스트 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시합니다. 그리고 재빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 pull은 시도당 180초의 제한된 타임아웃으로 재시도되므로 멈춘 registry/cache 스트림이 CI critical path 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 커버리지는 더 작은 청크 작업을 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행하므로 각 청크는 필요한 이미지 종류만 pull하고 동일한 가중치 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`부터 `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, `bundled-channels-contracts`입니다. 집계 `bundled-channels` 청크는 수동 일회성 재실행에 계속 사용할 수 있으며, `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/런타임 별칭으로 유지됩니다. `install-e2e` 레인 별칭은 두 제공자 설치 프로그램 레인 모두에 대한 집계 수동 재실행 별칭으로 유지됩니다. `bundled-channels` 청크는 직렬 올인원 `bundled-channel-deps` 레인이 아니라 분할된 `bundled-channel-*` 및 `bundled-channel-update-*` 레인을 실행합니다.

전체 릴리스 경로 커버리지가 요청될 때 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에만 독립형 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계별 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행하므로, 실패한 레인 디버깅은 하나의 대상 Docker 작업으로 제한되며 해당 실행을 위한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인이면, 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로, 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 매일 전체 릴리스 경로 Docker 제품군을 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 커버리지이므로, `Full Release Validation` 또는 명시적인 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 실행형 수동 CI 디스패치는 해당 제품군을 끈 상태로 유지합니다. 이 워크플로는 번들 Plugin 테스트를 8개의 확장 워커에 분산합니다. 해당 확장 샤드 작업은 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하며, 그룹당 하나의 Vitest 워커와 더 큰 Node 힙을 사용하여 가져오기가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록 합니다.

## QA Lab

QA Lab에는 기본 스마트 범위 워크플로 밖에 전용 CI 레인이 있습니다.

- `Parity gate` 워크플로는 일치하는 PR 변경과 수동 디스패치에서 실행됩니다. 비공개 QA 런타임을 빌드하고 mock GPT-5.5 및 Opus 4.6 에이전트 팩을 비교합니다.
- `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 그리고 수동 디스패치에서 실행됩니다. mock parity gate, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 확장합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex 리스를 사용합니다.

릴리스 검사는 결정적 mock 제공자와 mock 한정 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하므로, 채널 계약이 라이브 모델 지연 시간 및 일반 제공자 Plugin 시작과 분리됩니다. 라이브 전송 Gateway는 메모리 검색을 비활성화합니다. QA parity가 메모리 동작을 별도로 커버하기 때문입니다. 제공자 연결성은 별도의 라이브 모델, 네이티브 제공자, Docker 제공자 제품군에서 커버됩니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`는 릴리스 승인 전에 릴리스 핵심 QA Lab 레인도 실행합니다. 해당 QA parity gate는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 parity 비교를 위해 작은 보고서 작업으로 두 아티팩트를 모두 다운로드합니다.

변경이 실제로 QA 런타임, 모델 팩 parity 또는 parity 워크플로가 소유한 표면을 건드리지 않는 한, PR 랜딩 경로를 `Parity gate` 뒤에 두지 마세요. 일반 채널, 구성, 문서 또는 단위 테스트 수정의 경우 이를 선택적 신호로 취급하고 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁게 잡은 1차 보안 스캐너입니다. 매일, 수동, 초안이 아닌 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, high/critical `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `src` 아래 변경에 대해서만 시작되며, 예약된 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 시크릿, 샌드박스, Cron, Gateway 기준선                                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 시크릿, 감사 접점                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, web-fetch, Plugin SDK SSRF 정책 표면                                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 런타임 의존성 스테이징, 소스 로딩, Plugin SDK 패키지 계약 신뢰 표면                         |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 정상성에서 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. 깨끗한 상태에서도 macOS 빌드가 런타임을 지배하므로 일일 기본값 밖에 유지됩니다.

### Critical Quality 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux 러너에서 좁고 가치가 높은 표면에 대해 오류 심각도, 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 의도적으로 예약 프로필보다 작습니다. 초안이 아닌 PR은 인증/시크릿/샌드박스/보안 코드, 채널 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 연결부, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약 또는 Plugin SDK 응답 런타임 변경에 대해 일치하는 `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 구성 및 품질 워크플로 변경은 10개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 독립적으로 실행하기 위한 교육/반복 후크입니다.

| 범주                                                    | 표면                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 비밀 정보, 샌드박스, Cron, Gateway 보안 경계 코드                                                                                                             |
| `/codeql-critical-quality/config-boundary`              | 설정 스키마, 마이그레이션, 정규화, IO 계약                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 구현 계약                                                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 응답 디스패치 및 큐, ACP 제어 평면 런타임 계약                                                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 연결부, 메모리 doctor 명령                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부 구조, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면, 세션 doctor CLI 계약                                                 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청크 처리/런타임 헬퍼, 채널 응답 옵션, 전달 큐, 세션/스레드 바인딩 헬퍼                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 검색, 제공자 런타임 등록, 제공자 기본값/카탈로그, 웹/검색/가져오기/임베딩 레지스트리                                          |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 지속성, Gateway 제어 흐름, 작업 제어 평면 런타임 계약                                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성, 미디어 생성 런타임 계약                                                                                 |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면, Plugin SDK 진입점 계약                                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 plugin 패키지 계약 헬퍼                                                                                                         |

품질은 보안과 분리되어 유지되므로, 보안 신호를 흐리지 않고 품질 발견 사항을 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정된 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### 문서 에이전트

`Docs Agent` 워크플로는 최근 랜딩된 변경 사항과 기존 문서를 맞춰 유지하기 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`의 성공한 비봇 푸시 CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수 있습니다. 워크플로 실행 호출은 `main`이 이미 आगे 진행되었거나 지난 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간마다 한 번의 실행으로 마지막 문서 패스 이후 누적된 모든 main 변경 사항을 처리할 수 있습니다.

### 테스트 성능 에이전트

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`의 성공한 비봇 푸시 CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 그 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 작은 범위의 커버리지 보존 테스트 성능 수정만 수행하게 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경 사항을 거부합니다. 기준선에 실패한 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서는 커밋되기 전에 반드시 통과해야 합니다. 봇 푸시가 랜딩되기 전에 `main`이 आगे 진행되면, 이 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 푸시를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. 이 레인은 GitHub 호스팅 Ubuntu를 사용하므로 Codex 액션은 문서 에이전트와 동일한 drop-sudo 안전 태세를 유지할 수 있습니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 랜딩 후 중복 정리를 위한 수동 유지 관리자 워크플로입니다. 기본값은 드라이런이며, `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에, 랜딩된 PR이 병합되었고 각 중복 항목에 공유된 참조 이슈 또는 겹치는 변경 헝크가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트와 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 해당 로컬 검사 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 프로덕션 및 핵심 테스트 타입 검사와 핵심 린트/가드를 실행합니다.
- 핵심 테스트 전용 변경은 핵심 테스트 타입 검사와 핵심 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입 검사와 확장 린트를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입 검사와 확장 린트만 실행합니다.
- 공개 Plugin SDK 또는 plugin 계약 변경은 확장이 해당 핵심 계약에 의존하므로 확장 타입 검사까지 확장됩니다(Vitest 확장 스윕은 명시적 테스트 작업으로 유지됩니다).
- 릴리스 메타데이터 전용 버전 범프는 대상 지정 버전/설정/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 모든 검사 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 자체적으로 실행되고, 소스 편집은 명시적 매핑을 우선한 다음 형제 테스트와 가져오기 그래프 의존 항목을 따릅니다. 공유 그룹룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹 가시 응답 설정, 소스 응답 전달 모드 또는 메시지 도구 시스템 프롬프트 변경은 핵심 응답 테스트와 Discord 및 Slack 전달 회귀 테스트를 통해 라우팅되어, 공유 기본값 변경이 첫 PR 푸시 전에 실패하도록 합니다. 변경이 하니스 전반에 걸쳐 넓어 저렴한 매핑 집합을 신뢰할 만한 대리 지표로 볼 수 없을 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Testbox는 저장소 루트에서 실행하고, 광범위한 증명에는 새로 워밍된 박스를 선호하세요. 재사용되었거나 만료되었거나 예기치 않게 큰 동기화를 보고한 박스에서 느린 게이트를 사용하기 전에, 먼저 박스 내부에서 `pnpm testbox:sanity`를 실행하세요.

정상성 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라졌거나 `git status --short`가 추적된 삭제를 200개 이상 표시할 때 빠르게 실패합니다. 이는 보통 원격 동기화 상태가 PR의 신뢰할 수 있는 사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하지 말고 해당 박스를 중지한 뒤 새 박스를 워밍하세요. 의도적인 대규모 삭제 PR의 경우, 해당 정상성 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 동기화 이후 출력 없이 5분 넘게 동기화 단계에 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 해당 가드를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
