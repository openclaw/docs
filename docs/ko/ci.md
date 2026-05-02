---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패하는 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조정하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하는 경우
summary: CI 작업 그래프, 범위 게이트, 릴리스 엄브렐라 및 로컬 명령 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-02T22:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`으로의 모든 푸시와 모든 풀 리퀘스트에서 실행됩니다. `preflight` 작업은 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 스코핑을 우회하고 릴리스 후보와 광범위한 검증을 위해 전체 그래프를 확장합니다. Android lane은 `include_android`를 통해 계속 선택 사항으로 유지됩니다. 릴리스 전용 Plugin 적용 범위는 별도의 [`Plugin Prerelease`](#plugin-prerelease) workflow에 있으며 [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 dispatch에서만 실행됩니다.

## 파이프라인 개요

| 작업                              | 목적                                                                                                             | 실행 시점                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 문서 전용 변경, 변경된 scope, 변경된 확장, CI manifest를 감지합니다                             | 초안이 아닌 푸시와 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 개인 키 감지와 workflow 감사                                                               | 초안이 아닌 푸시와 PR에서 항상 |
| `security-dependency-audit`      | npm advisory에 대한 의존성 없는 프로덕션 lockfile 감사                                                    | 초안이 아닌 푸시와 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 집계                                                                       | 초안이 아닌 푸시와 PR에서 항상 |
| `check-dependencies`             | 프로덕션 Knip 의존성 전용 pass와 미사용 파일 allowlist guard                                           | Node 관련 변경              |
| `build-artifacts`                | `dist/`, Control UI, 빌드 산출물 검사, 재사용 가능한 downstream artifact를 빌드합니다                                 | Node 관련 변경              |
| `checks-fast-core`               | 번들/Plugin 계약/프로토콜 검사 같은 빠른 Linux 정확성 lane                                        | Node 관련 변경              |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과가 있는 sharded channel 계약 검사                                                | Node 관련 변경              |
| `checks-node-core-test`          | channel, 번들, 계약, 확장 lane을 제외한 Core Node test shard                                    | Node 관련 변경              |
| `check`                          | sharded main 로컬 gate와 동일한 항목: 프로덕션 타입, lint, guard, test type, 엄격한 smoke                          | Node 관련 변경              |
| `check-additional`               | 아키텍처, boundary, prompt snapshot drift, extension surface guard, package boundary, gateway watch shard | Node 관련 변경              |
| `build-smoke`                    | 빌드된 CLI smoke test와 startup memory smoke                                                                      | Node 관련 변경              |
| `checks`                         | 빌드 산출물 channel test용 verifier                                                                           | Node 관련 변경              |
| `checks-node-compat-node22`      | Node 22 호환성 빌드와 smoke lane                                                                          | 릴리스용 수동 CI dispatch    |
| `check-docs`                     | 문서 formatting, lint, broken link 검사                                                                       | 문서 변경                       |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                                              | Python Skills 관련 변경      |
| `checks-windows`                 | Windows 전용 process/path test와 공유 runtime import specifier 회귀 검사                                | Windows 관련 변경           |
| `macos-node`                     | 공유 빌드 산출물을 사용하는 macOS TypeScript test lane                                                         | macOS 관련 변경             |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, test                                                                      | macOS 관련 변경             |
| `android`                        | 두 flavor의 Android unit test와 하나의 debug APK 빌드                                                        | Android 관련 변경           |
| `test-performance-agent`         | 신뢰된 활동 이후 매일 실행되는 Codex slow test 최적화                                                           | Main CI 성공 또는 수동 dispatch |
| `openclaw-performance`           | mock provider, deep profile, GPT 5.4 live lane이 포함된 일일/온디맨드 Kova runtime 성능 보고서           | 예약 실행과 수동 dispatch      |

## Fail-fast 순서

1. `preflight`는 어떤 lane이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 실행형 작업이 아니라 이 작업 안의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact와 platform matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
4. 이후 더 무거운 platform 및 runtime lane이 확장됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` ref에 새 푸시가 올라오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패하는 경우가 아니라면 이를 CI noise로 취급하세요. 집계 shard 검사는 `!cancelled() && always()`를 사용하므로 일반 shard 실패는 계속 보고하지만 전체 workflow가 이미 대체된 뒤에는 대기열에 추가되지 않습니다. 자동 CI concurrency key는 버전이 지정되어 있으므로(`CI-v7-*`) 오래된 queue group의 GitHub 측 zombie가 더 새로운 main 실행을 무기한 막을 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`을 사용하며 진행 중인 실행을 취소하지 않습니다.

## Scope와 routing

Scope 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit test로 커버됩니다. 수동 dispatch는 changed-scope 감지를 건너뛰고 모든 scoped area가 변경된 것처럼 preflight manifest가 동작하게 합니다.

- **CI workflow 편집**은 Node CI graph와 workflow linting을 검증하지만, 그 자체로 Windows, Android, macOS native build를 강제하지는 않습니다. 해당 platform lane은 platform source 변경으로 계속 scope가 제한됩니다.
- **CI routing 전용 편집, 선택된 저비용 core-test fixture 편집, 좁은 Plugin 계약 helper/test-routing 편집**은 빠른 Node 전용 manifest 경로를 사용합니다: `preflight`, security, 단일 `checks-fast-core` 작업. 이 경로는 변경이 fast task가 직접 실행하는 routing 또는 helper surface로 제한될 때 build artifact, Node 22 compatibility, channel contract, full core shard, bundled Plugin shard, additional guard matrix를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI workflow surface로 scope가 제한됩니다. 관련 없는 source, Plugin, install-smoke, test-only 변경은 Linux Node lane에 유지됩니다.

가장 느린 Node test family는 각 작업이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형이 맞춰집니다. channel contract는 세 개의 weighted shard로 실행되고, 작은 core unit lane은 쌍으로 묶이며, auto-reply는 네 개의 균형 잡힌 worker로 실행되고(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분할), agentic gateway/Plugin config는 빌드 산출물을 기다리지 않고 기존 source-only agentic Node 작업에 분산됩니다. 광범위한 browser, QA, media, 기타 Plugin test는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard 이름을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard shard는 `pnpm prompt:snapshots:check`를 포함해 작은 독립 guard들을 하나의 작업 안에서 동시에 실행하므로 Codex happy-path prompt drift가 그것을 유발한 PR에 고정됩니다. Gateway watch, channel test, core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 뒤 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 그 unit-test lane은 SMS/call-log BuildConfig flag가 적용된 flavor를 계속 컴파일하되, Android 관련 모든 푸시에서 중복 debug APK packaging 작업은 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip version에 고정된 프로덕션 Knip 의존성 전용 pass이며, `dlx` 설치를 위해 pnpm의 최소 release age가 비활성화됨)와 `pnpm deadcode:unused-files`를 실행합니다. 이는 Knip의 프로덕션 unused-file finding을 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 unused file을 추가하거나 오래된 allowlist entry를 남겨두면 실패하며, Knip이 정적으로 resolve할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw repository 활동을 ClawSweeper로 보내는 target-side bridge입니다. 이 workflow는 신뢰할 수 없는 pull request code를 checkout하거나 실행하지 않습니다. workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음, compact `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

이 workflow에는 네 개의 lane이 있습니다.

- 정확한 issue와 pull request review request용 `clawsweeper_item`;
- issue comment의 명시적인 ClawSweeper command용 `clawsweeper_comment`;
- `main` push의 commit-level review request용 `clawsweeper_commit_review`;
- ClawSweeper agent가 검사할 수 있는 일반 GitHub activity용 `github_activity`.

`github_activity` lane은 정규화된 metadata만 전달합니다: event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때 짧은 excerpt. 의도적으로 전체 webhook body는 전달하지 않습니다. `openclaw/clawsweeper`의 수신 workflow는 `.github/workflows/github-activity.yml`이며, 이 workflow는 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 게시합니다.

일반 activity는 observation이지 기본 delivery가 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받으며, event가 놀랍거나, 조치 가능하거나, 위험하거나, 운영상 유용할 때만 `#clawsweeper`에 게시해야 합니다. routine open, edit, bot churn, duplicate webhook noise, normal review traffic은 `NO_REPLY`로 이어져야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message는 신뢰할 수 없는 data로 취급하세요. 이들은 summarization과 triage를 위한 input이지 workflow나 agent runtime을 위한 instruction이 아닙니다.

## 수동 dispatch

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 레인을 강제로 켭니다: Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Control UI i18n. 독립 실행형 수동 CI 디스패치는 `include_android=true`일 때 Android만 실행하며, 전체 릴리스 우산 워크플로는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin 프리릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 배치 스윕, Plugin 프리릴리스 Docker 레인은 CI에서 제외됩니다. Docker 프리릴리스 제품군은 `Full Release Validation`이 릴리스 검증 게이트를 활성화한 상태로 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 제품군이 같은 ref의 다른 push 또는 PR 실행에 의해 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰된 호출자가 선택한 디스패치 ref의 워크플로 파일을 사용하면서 브랜치, 태그 또는 전체 커밋 SHA에 대해 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 실행기

| 실행기                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업과 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤드된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드와 집계, Node 테스트 집계 검증기, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용해 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있도록 합니다 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 가벼운 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(CPU에 민감해 8 vCPU가 절약한 것보다 더 많은 비용이 들 정도임); install-smoke Docker 빌드(32-vCPU 큐 시간이 절약한 것보다 더 많은 비용이 듦)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; fork는 `macos-latest`로 폴백합니다                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; fork는 `macos-latest`로 폴백합니다                                                                                                                                                                                                                                                                                                                                                                                                 |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 성능

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. `main`에서 매일 실행되며 수동으로 디스패치할 수 있습니다:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

워크플로는 고정된 릴리스에서 OCM을 설치하고 고정된 `kova_ref` 입력에서 Kova를 설치한 다음, 세 개의 레인을 실행합니다:

- `mock-provider`: 결정적 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에 대한 Kova 진단 시나리오.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴 핫스팟에 대한 CPU/힙/트레이스 프로파일링.
- `live-gpt54`: 실제 OpenAI `openai/gpt-5.4` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider 레인은 Kova 패스 후 OpenClaw 네이티브 소스 프로브도 실행합니다: 기본, hook, 50-Plugin 시작 사례 전반의 Gateway 부팅 시간과 메모리; 반복되는 mock-OpenAI `channel-chat-baseline` hello 루프; 부팅된 Gateway에 대한 CLI 시작 명령. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON이 그 옆에 있습니다.

모든 레인은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 브랜치 포인터는 `openclaw-performance/<ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 "릴리스 전에 모든 것을 실행"하기 위한 수동 우산 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받고, 해당 대상을 사용해 수동 `CI` 워크플로를 디스패치하며, 릴리스 전용 Plugin/패키지/정적/Docker 증거를 위해 `Plugin Prerelease`를 디스패치하고, install smoke, package acceptance, Docker release-path 제품군, live/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. `rerun_group=all` 및 `release_profile=full`을 사용하면 release checks의 `release-package-under-test` 아티팩트에 대해 `NPM Telegram Beta E2E`도 실행합니다. 게시 후에는 게시된 npm 패키지에 대해 동일한 Telegram 패키지 레인을 다시 실행하려면 `npm_telegram_package_spec`을 전달합니다.

스테이지 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

`OpenClaw Release Publish`는 변경을 수행하는 수동 릴리스 워크플로입니다. 릴리스 태그가 존재하고 OpenClaw npm preflight가 성공한 뒤 `release/YYYY.M.D` 또는 `main`에서 디스패치하세요. 이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해 `Plugin NPM Release`를 디스패치하며, 같은 릴리스 SHA에 대해 `Plugin ClawHub Release`를 디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 브랜치에서 고정된 커밋 증거가 필요하면 `gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치나 태그여야 합니다. 헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 push하고, 해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로 `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 우산 검증기도 하위 워크플로가 다른 SHA에서 실행된 경우 실패합니다.

`release_profile`은 release checks에 전달되는 live/provider 범위를 제어합니다. 수동 릴리스 워크플로의 기본값은 `stable`입니다. 넓은 자문용 provider/media 매트릭스를 의도적으로 원할 때만 `full`을 사용하세요.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 핵심 레인을 유지합니다.
- `stable`은 안정적인 provider/backend 세트를 추가합니다.
- `full`은 넓은 자문용 provider/media 매트릭스를 실행합니다.

우산 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 검사하고 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로를 다시 실행해 녹색으로 바뀌면, 우산 결과와 시간 요약을 새로 고치기 위해 부모 검증기 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 자식만에는 `ci`, Plugin 사전 릴리스 자식만에는 `plugin-prerelease`, 모든 릴리스 자식에는 `release-checks`, 또는 umbrella에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택된 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 그 아티팩트를 live/E2E 릴리스 경로 Docker 워크플로와 package acceptance shard에 모두 전달합니다. 이렇게 하면 릴리스 박스 전반에서 package 바이트가 일관되게 유지되고, 여러 자식 작업에서 같은 후보를 다시 패킹하지 않아도 됩니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은 이전 umbrella를 대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한 모든 자식 워크플로를 취소하므로, 더 새로운 main 검증이 오래된 두 시간짜리 release-check 실행 뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## Live 및 E2E shard

릴리스 live/E2E 자식은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름이 지정된 shard로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 공급자 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 미디어 오디오/비디오 shard와 공급자 필터링된 음악 shard

이렇게 하면 같은 파일 커버리지를 유지하면서 느린 live 공급자 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` shard 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 live 미디어 shard는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. 미디어 작업은 설정 전에 바이너리만 확인합니다. Docker 기반 live suite는 일반 Blacksmith runner에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적절한 위치가 아닙니다.

Docker 기반 live 모델/백엔드 shard는 선택된 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. live 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker live 모델, 공급자별로 shard된 Gateway, CLI 백엔드, ACP bind, Codex harness shard가 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행됩니다. Gateway Docker shard는 워크플로 작업 제한 시간보다 낮은 명시적 스크립트 수준 `timeout` 상한을 가지고 있어, 멈춘 컨테이너나 정리 경로가 전체 release-check 예산을 소모하는 대신 빠르게 실패합니다. 이러한 shard가 전체 소스 Docker target을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며, 중복 이미지 빌드로 실제 시간을 낭비하게 됩니다.

## Package Acceptance

질문이 "설치 가능한 이 OpenClaw package가 제품으로 작동하는가?"라면 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, package acceptance는 사용자가 설치 또는 업데이트 후 실행하는 것과 같은 Docker E2E harness를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, package 후보 하나를 해석하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰고, 둘 다 `package-under-test` 아티팩트로 업로드한 다음, GitHub 단계 요약에 소스, 워크플로 ref, package ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능한 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하며, 필요할 때 package-digest Docker 이미지를 준비하고, 워크플로 체크아웃을 패킹하는 대신 해당 package에 대해 선택된 Docker lane을 실행합니다. 프로필이 여러 개의 targeted `docker_lanes`를 선택하면, 재사용 가능한 워크플로는 package와 공유 이미지를 한 번 준비한 다음 해당 lane을 고유 아티팩트가 있는 병렬 targeted Docker 작업으로 분산합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 package를 해석한 경우 같은 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram dispatch는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 package 해석, Docker acceptance, 또는 선택적 Telegram lane이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 받습니다. 게시된 사전 릴리스/안정 버전 acceptance에 사용하세요.
- `source=ref`는 신뢰된 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹합니다. resolver는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하며, 분리된 worktree에 deps를 설치하고, `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰된 워크플로/harness 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이를 통해 현재 테스트 harness가 오래된 워크플로 로직을 실행하지 않고도 더 오래된 신뢰된 소스 커밋을 검증할 수 있습니다.

### Suite 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package`와 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 chunk
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로 게시된 package 검증이 live ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram lane은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm spec 경로는 독립 실행형 dispatch를 위해 유지됩니다.

로컬 명령, Docker lane, Package Acceptance 입력, 릴리스 기본값, 실패 triage를 포함한 전용 업데이트 및 Plugin 테스트 정책은 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 check는 준비된 릴리스 package 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, `telegram_mode=mock-openai`와 함께 `source=artifact`로 Package Acceptance를 호출합니다. 이렇게 하면 package migration, update, 오래된 Plugin dependency cleanup, 구성된 Plugin 설치 복구, 오프라인 Plugin, plugin-update, Telegram 검증이 모두 같은 해석된 package tarball에서 수행됩니다. SHA로 빌드된 아티팩트 대신 배포된 npm package에 대해 같은 matrix를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에서 `package_acceptance_package_spec`을 설정하세요. Cross-OS 릴리스 check는 여전히 OS별 onboarding, installer, platform 동작을 커버합니다. package/update 제품 검증은 Package Acceptance에서 시작해야 합니다. `published-upgrade-survivor` Docker lane은 실행마다 하나의 게시된 package baseline을 검증합니다. Package Acceptance에서 해석된 `package-under-test` tarball은 항상 후보이며, `published_upgrade_survivor_baseline`은 fallback으로 사용할 게시된 baseline을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 lane 재실행 명령은 해당 baseline을 보존합니다. `published_upgrade_survivor_baselines=all-since-2026.4.23`을 설정하면 Full Release CI를 `2026.4.23`부터 `latest`까지 모든 안정 npm 릴리스로 확장합니다. `release-history`는 이전 pre-date anchor를 사용한 수동의 더 넓은 샘플링에도 계속 사용할 수 있습니다. `published_upgrade_survivor_scenarios=reported-issues`를 설정하면 같은 baseline을 Feishu config, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, tilde log 경로, 오래된 legacy Plugin dependency root에 대한 issue 형태 fixture 전반으로 확장합니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리에 대한 포괄적인 검증일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker lane을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 package spec을 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 lane을 유지하거나, scenario matrix를 위해 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 lane은 내장된 `openclaw config set` 명령 recipe로 baseline을 구성하고, recipe 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, 그리고 RPC status를 probe합니다. Windows packaged 및 installer fresh lane은 설치된 package가 원시 절대 Windows 경로에서 browser-control override를 import할 수 있는지도 확인합니다. OpenAI cross-OS agent-turn smoke는 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용하므로, install 및 Gateway 검증이 GPT-4.x 기본값을 피하면서 GPT-5 테스트 모델에 머물게 됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 package를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 package는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 private QA entry가 tarball에서 생략된 파일을 가리킬 수 있습니다.
- package가 해당 flag를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 subcase를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 fake git fixture에서 누락된 `pnpm.patchedDependencies`를 정리할 수 있으며, 지속된 `update.channel` 누락을 기록할 수 있습니다.
- Plugin smoke는 레거시 install-record 위치를 읽거나 marketplace install-record 지속성 누락을 허용할 수 있습니다.
- `plugin-update`는 install record와 no-reinstall 동작이 그대로 유지되어야 한다는 요구는 유지하면서도 config metadata migration을 허용할 수 있습니다.

게시된 `2026.4.26` package는 이미 배포된 로컬 빌드 metadata stamp 파일에 대해서도 경고할 수 있습니다. 이후 package는 최신 contract를 충족해야 합니다. 같은 조건은 경고 또는 skip 대신 실패합니다.

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

실패한 패키지 승인 실행을 디버깅할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령을 검사하세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필이나 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 코어 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 풀 리퀘스트에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, 에이전트 삭제 공유 작업공간 CLI 스모크를 실행하고, 컨테이너 Gateway 네트워크 E2E를 실행하고, 번들 확장 빌드 인수를 검증하고, 240초 집계 명령 제한 시간 안에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 실제로 설치 프로그램/패키지/Docker 표면을 건드리는 풀 리퀘스트에 QR 패키지 설치와 설치 프로그램 Docker/업데이트 커버리지를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지를 하나 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 프로그램/업데이트 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 대기하지 않게 합니다.

`main` 푸시(merge commit 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 커버리지를 요청하더라도 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 이미지 제공자 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 스모크는 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. QR 및 설치 프로그램 Docker 테스트는 자체 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 라이브 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 의존성 레인용 기본 Node/Git 실행기
- 일반 기능 레인을 위해 같은 tarball을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 실행기는 선택된 계획만 실행합니다. 스케줄러는 레인별로 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`를 사용해 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인을 위한 메인 풀 슬롯 수입니다.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 제공자에 민감한 테일 풀 슬롯 수입니다.                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 제공자가 제한을 걸지 않도록 하는 동시 라이브 레인 상한입니다.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한입니다.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한입니다.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격입니다. 간격이 없게 하려면 `0`으로 설정하세요. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 폴백 제한 시간(120분)입니다. 선택된 live/tail 레인은 더 엄격한 상한을 사용합니다.       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록입니다. 에이전트가 실패한 레인 하나를 재현할 수 있도록 cleanup 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 빈 풀에서는 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 내보내고, longest-first 정렬을 위해 레인 타이밍을 유지하며, 기본적으로 첫 번째 실패 이후에는 새 풀링 레인 예약을 중지합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 커버리지를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. tarball 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 digest 태그가 지정된 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시하며, 재빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력이나 기존 패키지 digest 이미지를 재사용합니다. Docker 이미지 pull은 시도별 180초 제한 시간으로 재시도되므로 멈춘 registry/cache 스트림이 CI 주요 경로의 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 커버리지는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하므로, 각 청크는 필요한 이미지 종류만 pull하고 같은 가중치 기반 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/runtime 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 제공자 설치 프로그램 레인을 위한 집계 수동 재실행 별칭으로 남아 있습니다.

OpenWebUI는 전체 릴리스 경로 커버리지가 요청할 때 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에 대해서만 독립 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지를 대상으로 선택된 레인을 실행합니다. 이렇게 하면 실패한 레인 디버깅이 하나의 대상 Docker 작업으로 제한되고, 해당 실행을 위한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인이면, 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 전체 릴리스 경로 Docker 제품군을 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비싼 제품/패키지 커버리지이므로 `Full Release Validation` 또는 명시적인 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 수동 CI 디스패치에서는 해당 제품군을 꺼 둡니다. 이 워크플로는 번들 Plugin 테스트를 여덟 개 확장 워커에 분산합니다. 이러한 확장 샤드 작업은 그룹당 하나의 Vitest 워커와 더 큰 Node 힙을 사용해 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하므로, import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않습니다. 릴리스 전용 Docker 사전 릴리스 경로는 하나에서 세 분짜리 작업을 위해 수십 개의 실행기를 예약하지 않도록 대상 Docker 레인을 작은 그룹으로 배치합니다.

## QA Lab

QA Lab에는 기본 smart-scoped 워크플로 밖의 전용 CI 레인이 있습니다. 에이전트 parity는 독립 PR 워크플로가 아니라 넓은 QA 및 릴리스 하네스 아래에 중첩됩니다. parity가 넓은 검증 실행과 함께 가야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용하세요.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 야간으로, 그리고 수동 디스패치에서 실행됩니다. mock parity 레인, live Matrix 레인, live Telegram 및 Discord 레인을 병렬 작업으로 분산 실행합니다. live 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex 임대를 사용합니다.

릴리스 검사는 결정론적 mock 제공자와 mock-qualified 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram live transport 레인을 실행하므로, 채널 계약이 live 모델 지연 시간과 일반 제공자 Plugin 시작에서 분리됩니다. live transport Gateway는 메모리 검색을 비활성화합니다. QA parity가 메모리 동작을 별도로 다루기 때문입니다. 제공자 연결성은 별도의 live 모델, 네이티브 제공자, Docker 제공자 제품군이 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하고, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 남아 있습니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`도 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인을 실행합니다. 이 QA parity 게이트는 candidate와 baseline 팩을 병렬 레인 작업으로 실행한 다음, 최종 parity 비교를 위해 두 아티팩트를 작은 보고서 작업으로 다운로드합니다.

일반 PR의 경우 parity를 필수 상태로 취급하는 대신 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일, 수동, 비초안 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 영역을 스캔하며, 높음/심각 `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, 또는 `src` 아래 변경에 대해서만 시작되며, 예약된 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 영역                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 시크릿, 샌드박스, Cron, Gateway 기준선                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 시크릿, 감사 접점                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기, Plugin SDK SSRF 정책 영역                                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩, Plugin SDK 패키지 계약 신뢰 영역                         |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 sanity에서 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링한 뒤 `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드는 깨끗한 상태에서도 실행 시간을 지배하므로 일일 기본값 밖에 유지됩니다.

### 중요 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux 러너에서 좁고 가치가 높은 영역을 대상으로 오류 심각도, 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 예약된 프로필보다 의도적으로 더 작습니다. 비초안 PR은 에이전트 명령/모델/도구 실행 및 답장 디스패치 코드, 설정 스키마/마이그레이션/IO 코드, 인증/시크릿/샌드박스/보안 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 글루, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약, 또는 Plugin SDK 답장 런타임 변경에 대해 대응하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 설정 및 품질 워크플로 변경은 PR 품질 샤드 12개를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 품질 샤드 하나를 격리해서 실행하기 위한 학습/반복 훅입니다.

| 범주                                                    | 영역                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 시크릿, 샌드박스, Cron, Gateway 보안 경계 코드                                                                                                             |
| `/codeql-critical-quality/config-boundary`              | 설정 스키마, 마이그레이션, 정규화, IO 계약                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마와 서버 메서드 계약                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 답장 디스패치와 큐, ACP 제어 평면 런타임 계약                                                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 글루, 메모리 doctor 명령                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | 답장 큐 내부, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 영역, 세션 doctor CLI 계약                                                   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 답장 디스패치, 답장 페이로드/청킹/런타임 헬퍼, 채널 답장 옵션, 전달 큐, 세션/스레드 바인딩 헬퍼                                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 발견, 제공자 런타임 등록, 제공자 기본값/카탈로그, 웹/검색/가져오기/임베딩 레지스트리                                      |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 영속성, Gateway 제어 흐름, 작업 제어 평면 런타임 계약                                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성, 미디어 생성 런타임 계약                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 영역, Plugin SDK 진입점 계약                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스와 플러그인 패키지 계약 헬퍼                                                                                                     |

품질은 보안과 분리되어 유지되므로 품질 발견 사항을 보안 신호를 흐리지 않고 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로필의 실행 시간과 신호가 안정된 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 병합된 변경과 기존 문서를 맞추기 위한 이벤트 기반 Codex 유지관리 레인입니다. 순수 일정은 없습니다. `main`의 성공한 비봇 push CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수도 있습니다. 워크플로 실행 호출은 `main`이 이미 आगे 진행되었거나 지난 1시간 내에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전의 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간에 한 번 실행으로 마지막 문서 패스 이후 누적된 모든 main 변경을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지관리 레인입니다. 순수 일정은 없습니다. `main`의 성공한 비봇 push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 보존하는 작은 테스트 성능 수정만 수행하게 한 뒤, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패한 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서는 커밋 전에 통과해야 합니다. 봇 push가 병합되기 전에 `main`이 진행되면, 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex 액션이 docs agent와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 병합 후 중복 정리를 위한 수동 유지관리자 워크플로입니다. 기본값은 드라이런이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에, 병합된 PR이 실제로 병합되었고 각 중복 항목에 공유 참조 이슈 또는 겹치는 변경 헝크가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트와 변경 라우팅

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 검사 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 prod 및 핵심 test 타입검사와 핵심 린트/가드를 실행합니다.
- 핵심 test 전용 변경은 핵심 test 타입검사와 핵심 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 prod 및 확장 test 타입검사와 확장 린트를 실행합니다.
- 확장 test 전용 변경은 확장 test 타입검사와 확장 린트만 실행합니다.
- 공개 Plugin SDK 또는 플러그인 계약 변경은 확장이 해당 핵심 계약에 의존하므로 확장 타입검사로 확장됩니다. Vitest 확장 스윕은 명시적 테스트 작업으로 유지됩니다.
- 릴리스 메타데이터 전용 버전 범프는 대상이 지정된 버전/설정/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 모든 검사 레인으로 실패합니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트를 실행하고, 소스 편집은 명시적 매핑을 우선하며, 그다음 형제 테스트와 import-graph 의존 항목을 사용합니다. 공유 그룹룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹 가시 답장 설정, 소스 답장 전달 모드, 또는 message-tool 시스템 프롬프트 변경은 핵심 답장 테스트와 Discord 및 Slack 전달 회귀를 거치므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하네스 전반에 걸쳐 있어 저렴한 매핑 집합을 신뢰할 수 있는 프록시로 볼 수 없는 경우에만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

저장소 루트에서 Testbox를 실행하고, 광범위한 검증에는 새로 워밍된 박스를 선호하세요. 재사용되었거나 만료되었거나 방금 예상보다 큰 동기화를 보고한 박스에서 느린 게이트에 시간을 쓰기 전에, 먼저 박스 안에서 `pnpm testbox:sanity`를 실행하세요.

필수 루트 파일인 `pnpm-lock.yaml` 등이 사라졌거나 `git status --short`가 추적 중인 삭제를 200개 이상 표시하면, 이 정상성 검사는 빠르게 실패합니다. 이는 보통 원격 동기화 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하는 대신 해당 박스를 중지하고 새 박스를 워밍하세요. 의도적인 대량 삭제 PR의 경우, 해당 정상성 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 이 보호 장치를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

Blacksmith를 사용할 수 없거나 소유한 클라우드 용량을 선호할 때, Crabbox는 Linux 검증을 위한 저장소 소유의 두 번째 원격 박스 경로입니다. 박스를 워밍하고 프로젝트 워크플로를 통해 하이드레이트한 다음, Crabbox CLI로 명령을 실행하세요.

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml`은 공급자, 동기화, GitHub Actions 하이드레이션 기본값을 담당합니다. 이 파일은 로컬 `.git`을 제외하므로 하이드레이션된 Actions 체크아웃은 maintainer 로컬 원격 저장소와 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하며, 절대 전송되어서는 안 되는 로컬 런타임/빌드 아티팩트도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 체크아웃, Node/pnpm 설정, `origin/main` 가져오기, 그리고 이후 `crabbox run --id <cbx_id>` 명령이 소스로 사용하는 비밀이 아닌 환경 전달을 담당합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
