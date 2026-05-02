---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 상위 묶음 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-02T20:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`으로의 모든 push와 모든 pull request에서 실행됩니다. `preflight` job은 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 smart scoping을 우회하고 release candidate와 광범위한 검증을 위해 전체 그래프를 확장 실행합니다. Android lane은 `include_android`를 통해 계속 opt-in으로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin Prerelease`](#plugin-prerelease) 워크플로에 있으며, [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 dispatch에서만 실행됩니다.

## Pipeline 개요

| Job                              | 목적                                                                                                   | 실행 시점                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs-only 변경, 변경된 scope, 변경된 extensions를 감지하고 CI manifest를 빌드                   | draft가 아닌 push와 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 private key 감지 및 workflow 감사                                                     | draft가 아닌 push와 PR에서 항상 |
| `security-dependency-audit`      | npm advisories를 기준으로 한 dependency-free production lockfile 감사                                          | draft가 아닌 push와 PR에서 항상 |
| `security-fast`                  | 빠른 security job을 위한 required aggregate                                                             | draft가 아닌 push와 PR에서 항상 |
| `check-dependencies`             | Production Knip dependency-only pass 및 unused-file allowlist guard                                 | Node 관련 변경              |
| `build-artifacts`                | `dist/`, Control UI, built-artifact checks 및 재사용 가능한 downstream artifacts 빌드                       | Node 관련 변경              |
| `checks-fast-core`               | bundled/plugin-contract/protocol checks 같은 빠른 Linux correctness lane                              | Node 관련 변경              |
| `checks-fast-contracts-channels` | 안정적인 aggregate check 결과를 포함한 sharded channel contract checks                                      | Node 관련 변경              |
| `checks-node-core-test`          | channel, bundled, contract, extension lane을 제외한 Core Node test shards                          | Node 관련 변경              |
| `check`                          | sharded main local gate equivalent: prod types, lint, guards, test types, strict smoke                | Node 관련 변경              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary, gateway-watch shards              | Node 관련 변경              |
| `build-smoke`                    | Built-CLI smoke tests 및 startup-memory smoke                                                            | Node 관련 변경              |
| `checks`                         | built-artifact channel tests용 verifier                                                                 | Node 관련 변경              |
| `checks-node-compat-node22`      | Node 22 compatibility build 및 smoke lane                                                                | 릴리스용 수동 CI dispatch    |
| `check-docs`                     | Docs formatting, lint, broken-link checks                                                             | Docs 변경됨                       |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                                    | Python-skill 관련 변경      |
| `checks-windows`                 | Windows 전용 process/path tests 및 shared runtime import specifier regressions                      | Windows 관련 변경           |
| `macos-node`                     | shared built artifacts를 사용하는 macOS TypeScript test lane                                               | macOS 관련 변경             |
| `macos-swift`                    | macOS app용 Swift lint, build, tests                                                            | macOS 관련 변경             |
| `android`                        | 두 flavor 모두에 대한 Android unit tests 및 debug APK build 하나                                              | Android 관련 변경           |
| `test-performance-agent`         | 신뢰된 활동 이후 매일 실행되는 Codex slow-test optimization                                                 | Main CI 성공 또는 수동 dispatch |
| `openclaw-performance`           | mock-provider, deep-profile, GPT 5.4 live lane을 포함한 매일/온디맨드 Kova runtime performance reports | scheduled 및 수동 dispatch      |

## Fail-fast 순서

1. `preflight`는 어떤 lane이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 이 job 내부의 step이며, 독립 job이 아닙니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix job을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로 shared build가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
4. 그다음 더 무거운 platform 및 runtime lane이 확장 실행됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` ref에 더 새로운 push가 들어오면 GitHub가 superseded job을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI noise로 취급하세요. Aggregate shard checks는 `!cancelled() && always()`를 사용하므로 일반적인 shard 실패는 계속 보고하지만 전체 workflow가 이미 superseded된 뒤에는 queue에 들어가지 않습니다. 자동 CI concurrency key는 버전이 지정되어(`CI-v7-*`) GitHub 측 zombie가 오래된 queue group에서 더 새로운 main 실행을 무기한 차단할 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`을 사용하며 진행 중인 실행을 취소하지 않습니다.

## Scope와 routing

Scope 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit tests로 커버됩니다. 수동 dispatch는 changed-scope detection을 건너뛰고 모든 scoped area가 변경된 것처럼 preflight manifest를 동작시킵니다.

- **CI workflow edits**는 Node CI 그래프와 workflow linting을 검증하지만, 그 자체만으로 Windows, Android 또는 macOS native builds를 강제하지는 않습니다. 이러한 platform lane은 platform source changes로 scope가 제한됩니다.
- **CI routing-only edits, selected cheap core-test fixture edits, narrow plugin contract helper/test-routing edits**는 빠른 Node-only manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 해당 path는 변경이 fast task가 직접 exercise하는 routing 또는 helper surface로 제한될 때 build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, additional guard matrices를 건너뜁니다.
- **Windows Node checks**는 Windows 전용 process/path wrappers, npm/pnpm/UI runner helpers, package manager config, 그리고 해당 lane을 실행하는 CI workflow surface로 scope가 제한됩니다. 관련 없는 source, Plugin, install-smoke, test-only 변경은 Linux Node lane에 남습니다.

가장 느린 Node test family는 각 job이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. channel contracts는 세 개의 weighted shard로 실행되고, 작은 core unit lane은 pair로 묶이며, auto-reply는 네 개의 balanced worker로 실행됩니다(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분할). agentic gateway/plugin config는 built artifacts를 기다리지 않고 기존 source-only agentic Node job 전반에 분산됩니다. 광범위한 browser, QA, media, miscellaneous Plugin tests는 shared Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard name을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard shard는 하나의 job 내부에서 작은 independent guard를 동시에 실행합니다. Gateway watch, channel tests, core support-boundary shard는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 해당 unit-test lane은 여전히 SMS/call-log BuildConfig flag를 사용해 flavor를 컴파일하지만, Android 관련 push마다 중복 debug APK packaging job은 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정된 production Knip dependency-only pass이며, `dlx` install을 위해 pnpm의 minimum release age가 비활성화됨)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file finding을 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 새로 검토되지 않은 unused file을 추가하거나 오래된 allowlist entry를 남긴 경우 실패하며, Knip이 정적으로 resolve할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw repository activity를 ClawSweeper로 전달하는 target-side bridge입니다. 이 workflow는 신뢰할 수 없는 pull request code를 checkout하거나 실행하지 않습니다. workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음 compact `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

workflow에는 네 개의 lane이 있습니다.

- 정확한 issue 및 pull request review request용 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper command용 `clawsweeper_comment`;
- `main` push의 commit-level review request용 `clawsweeper_commit_review`;
- ClawSweeper agent가 inspect할 수 있는 일반 GitHub activity용 `github_activity`.

`github_activity` lane은 normalized metadata만 전달합니다: event type, action, actor, repository, item number, URL, title, state, 그리고 comment 또는 review가 있을 때의 짧은 excerpt. 전체 webhook body는 의도적으로 전달하지 않습니다. `openclaw/clawsweeper`의 receiving workflow는 `.github/workflows/github-activity.yml`이며, normalized event를 ClawSweeper agent용 OpenClaw Gateway hook에 게시합니다.

General activity는 observation이지 기본 delivery가 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받으며, event가 surprising, actionable, risky 또는 operationally useful인 경우에만 `#clawsweeper`에 게시해야 합니다. Routine opens, edits, bot churn, duplicate webhook noise, normal review traffic은 `NO_REPLY`가 되어야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message를 신뢰할 수 없는 data로 취급하세요. 이들은 summarization과 triage를 위한 input이지, workflow 또는 agent runtime을 위한 instruction이 아닙니다.

## 수동 dispatches

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 lane을 강제로 켭니다: Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Control UI i18n. 독립 실행형 수동 CI 디스패치는 `include_android=true`일 때 Android만 실행합니다. 전체 릴리스 umbrella는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin 프리릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 배치 스윕, Plugin 프리릴리스 Docker lane은 CI에서 제외됩니다. Docker 프리릴리스 스위트는 `Full Release Validation`이 릴리스 검증 gate를 활성화한 상태로 별도의 `Plugin Prerelease` workflow를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 concurrency group을 사용하므로 릴리스 후보 전체 스위트가 같은 ref의 다른 push 또는 PR 실행 때문에 취소되지 않습니다. 선택 사항인 `target_ref` 입력을 사용하면 신뢰할 수 있는 호출자가 선택한 디스패치 ref의 workflow 파일을 사용하면서 branch, tag, 또는 전체 commit SHA를 대상으로 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 검증기, 문서 검사, Python skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith matrix가 더 일찍 queue될 수 있습니다 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 가벼운 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(8 vCPU가 절약한 것보다 더 많은 비용이 들 정도로 CPU에 민감함), install-smoke Docker 빌드(32-vCPU queue 시간이 절약한 것보다 더 많은 비용이 들었음)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`. fork는 `macos-latest`로 fallback합니다                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`. fork는 `macos-latest`로 fallback합니다                                                                                                                                                                                                                                                                                                                                                                                                 |

## 로컬 대응 명령

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

`OpenClaw Performance`는 제품/runtime 성능 workflow입니다. `main`에서 매일 실행되며 수동으로 디스패치할 수 있습니다:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

이 workflow는 고정된 릴리스에서 OCM을, 고정된 `kova_ref` 입력에서 Kova를 설치한 다음 세 가지 lane을 실행합니다:

- `mock-provider`: 결정적인 가짜 OpenAI 호환 auth를 사용하는 로컬 빌드 runtime에 대한 Kova diagnostic scenario.
- `mock-deep-profile`: startup, Gateway, agent-turn hotspot에 대한 CPU/heap/trace profiling.
- `live-gpt54`: 실제 OpenAI `openai/gpt-5.4` agent turn. `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider lane은 Kova pass 이후 OpenClaw 네이티브 source probe도 실행합니다: 기본, hook, 50-Plugin startup case의 Gateway boot timing 및 memory, 반복 mock-OpenAI `channel-chat-baseline` hello loop, boot된 Gateway에 대한 CLI startup command. source probe Markdown 요약은 report bundle의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 lane은 GitHub artifact를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 workflow는 `report.json`, `report.md`, bundle, `index.md`, source-probe artifact도 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 commit합니다. 현재 branch pointer는 `openclaw-performance/<ref>/latest-<lane>.json`으로 기록됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 umbrella workflow입니다. branch, tag, 또는 전체 commit SHA를 받아 그 대상을 지정한 수동 `CI` workflow를 디스패치하고, 릴리스 전용 Plugin/package/static/Docker proof를 위해 `Plugin Prerelease`를 디스패치하며, install smoke, package acceptance, Docker release-path suite, live/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram lane을 위해 `OpenClaw Release Checks`를 디스패치합니다. `rerun_group=all` 및 `release_profile=full`이면 release checks의 `release-package-under-test` artifact를 대상으로 `NPM Telegram Beta E2E`도 실행합니다. 게시 후에는 `npm_telegram_package_spec`을 전달해 동일한 Telegram package lane을 게시된 npm package 대상으로 다시 실행합니다.

단계 matrix, 정확한 workflow job 이름, profile 차이, artifact, 집중 rerun handle은
[전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

`OpenClaw Release Publish`는 변경을 수행하는 수동 릴리스 workflow입니다. 릴리스 tag가 존재하고 OpenClaw npm preflight가 성공한 뒤 `release/YYYY.M.D` 또는 `main`에서 디스패치하세요. 이 workflow는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin package에 대해 `Plugin NPM Release`를 디스패치하며, 같은 release SHA에 대해 `Plugin ClawHub Release`를 디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 branch에서 고정 commit proof가 필요한 경우
`gh workflow run ... --ref main -f ref=<sha>` 대신 helper를 사용하세요:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref는 branch 또는 tag여야 하며, 원시 commit SHA일 수 없습니다. helper는 대상 SHA에 임시 `release-ci/<sha>-...` branch를 push하고, 해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 child workflow `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 branch를 삭제합니다. umbrella verifier는 어떤 child workflow라도 다른 SHA에서 실행되면 실패합니다.

`release_profile`은 release checks에 전달되는 live/provider 범위를 제어합니다. 수동 release workflow의 기본값은 `stable`입니다. 광범위한 advisory provider/media matrix를 의도적으로 원할 때만 `full`을 사용하세요.

- `minimum`은 가장 빠른 OpenAI/core release-critical lane만 유지합니다.
- `stable`은 안정 provider/backend set을 추가합니다.
- `full`은 광범위한 advisory provider/media matrix를 실행합니다.

umbrella는 디스패치된 child run id를 기록하며, 마지막 `Verify full validation` 작업은 현재 child run conclusion을 다시 확인하고 각 child run의 가장 느린 작업 표를 추가합니다. child workflow를 rerun해서 green이 되면, parent verifier job만 rerun해 umbrella result와 timing summary를 갱신하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 허용합니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 항목만에는 `ci`, Plugin 사전 릴리스 하위 항목만에는 `plugin-prerelease`, 모든 릴리스 하위 항목에는 `release-checks`를 사용하거나, umbrella에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram` 중 하나를 사용하세요. 이렇게 하면 집중적인 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용해 선택한 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 라이브/E2E 릴리스 경로 Docker 워크플로와 패키지 수용 샤드 양쪽에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고, 같은 후보를 여러 하위 작업에서 다시 패키징하지 않아도 됩니다.

`ref=main` 및 `rerun_group=all`인 중복 `Full Release Validation` 실행은
이전 umbrella를 대체합니다. 상위 모니터는 상위 항목이 취소될 때 이미
디스패치한 모든 하위 워크플로를 취소하므로, 더 새로운 main 검증이 오래된
2시간 릴리스 검사 실행 뒤에서 대기하지 않습니다. 릴리스 브랜치/태그 검증과
집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## 라이브 및 E2E 샤드

릴리스 라이브/E2E 하위 항목은 광범위한 네이티브 `pnpm test:live` 범위를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름 있는 샤드로 실행합니다.

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
- 분할된 미디어 오디오/비디오 샤드 및 provider 필터링된 음악 샤드

이렇게 하면 동일한 파일 범위를 유지하면서 느린 라이브 provider 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에 계속 유효합니다.

네이티브 라이브 미디어 샤드는 `Live Media Runner Image` 워크플로에서 빌드되는 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. 미디어 작업은 설정 전에 바이너리만 확인합니다. Docker 기반 라이브 제품군은 일반 Blacksmith 러너에 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 실행하기에 적합한 위치가 아닙니다.

Docker 기반 라이브 모델/backend 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, provider 샤딩된 Gateway, CLI backend, ACP bind, Codex harness 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 멈춘 컨테이너나 정리 경로가 전체 릴리스 검사 예산을 소비하는 대신 빠르게 실패하도록 워크플로 작업 제한 시간보다 낮은 명시적 스크립트 수준 `timeout` 상한을 가집니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면, 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드로 실제 시간을 낭비하게 됩니다.

## 패키지 수용

“이 설치 가능한 OpenClaw 패키지가 제품으로서 작동하는가?”가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하지만, 패키지 수용은 사용자가 설치 또는 업데이트 후 실행하는 동일한 Docker E2E harness를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰며, 둘 다 `package-under-test` 아티팩트로 업로드하고, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤터리를 검증하며, 필요할 때 패키지 digest Docker 이미지를 준비하고, 워크플로 체크아웃을 패키징하는 대신 선택한 Docker lane을 해당 패키지에 대해 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음, 해당 lane들을 고유한 아티팩트를 가진 병렬 대상 Docker 작업으로 fan-out합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 하나를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 수용 또는 선택적 Telegram lane이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` 또는 `openclaw@2026.4.27-beta.2`와 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 사전 릴리스/안정 수용에 이것을 사용하세요.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패키징합니다. resolver는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하며, 분리된 worktree에 deps를 설치한 다음 `scripts/package-openclaw-for-docker.mjs`로 패키징합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`이 필요합니다.
- `source=artifact`는 `artifact_run_id` 및 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 두세요. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/harness 코드입니다. `package_ref`는 `source=ref`일 때 패키징되는 소스 커밋입니다. 이를 통해 현재 테스트 harness가 오래된 워크플로 로직을 실행하지 않고도 더 오래된 신뢰할 수 있는 소스 커밋을 검증할 수 있습니다.

### 제품군 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` 및 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필요

`package` 프로필은 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않도록 오프라인 Plugin 범위를 사용합니다. 선택적 Telegram lane은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm spec 경로는 독립 실행형 디스패치용으로 유지됩니다.

로컬 명령, Docker lane, Package Acceptance 입력, 릴리스 기본값, 실패 분류를 포함한 전용 업데이트 및 Plugin 테스트 정책은 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, `telegram_mode=mock-openai`와 함께 `source=artifact`로 Package Acceptance를 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명이 동일하게 해석된 패키지 tarball에서 유지됩니다. SHA로 빌드된 아티팩트 대신 출시된 npm 패키지에 대해 동일한 매트릭스를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에서 `package_acceptance_package_spec`을 설정하세요. Cross-OS 릴리스 검사는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 다룹니다. 패키지/업데이트 제품 검증은 Package Acceptance로 시작해야 합니다. `published-upgrade-survivor` Docker lane은 실행당 하나의 게시된 패키지 기준선을 검증합니다. Package Acceptance에서 해석된 `package-under-test` tarball은 항상 후보이며, `published_upgrade_survivor_baseline`은 fallback 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 lane 재실행 명령은 해당 기준선을 보존합니다. Full Release CI를 `2026.4.23`부터 `latest`까지의 모든 안정 npm 릴리스로 확장하려면 `published_upgrade_survivor_baselines=all-since-2026.4.23`을 설정하세요. `release-history`는 더 오래된 날짜 이전 앵커를 사용한 수동의 더 넓은 샘플링에 계속 사용할 수 있습니다. Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, tilde 로그 경로, 오래된 레거시 Plugin 의존성 루트에 대한 이슈 형태 fixture 전반에 동일한 기준선을 확장하려면 `published_upgrade_survivor_scenarios=reported-issues`를 설정하세요. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리의 완전성일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker lane을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 spec을 전달하거나, `openclaw@2026.4.15`와 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 lane을 유지하거나, 시나리오 매트릭스에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 lane은 구워진 `openclaw config set` 명령 recipe로 기준선을 구성하고, recipe 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz` 및 RPC 상태를 probe합니다. Windows 패키징 및 설치 프로그램 fresh lane은 설치된 패키지가 원시 절대 Windows 경로에서 browser-control override를 가져올 수 있는지도 확인합니다. OpenAI cross-OS agent-turn smoke는 설정된 경우 기본적으로 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용하므로, GPT-4.x 기본값을 피하면서 설치 및 Gateway 증명이 GPT-5 테스트 모델에 유지됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 private QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 정리할 수 있으며, 누락된 지속 `update.channel`을 기록할 수 있습니다.
- Plugin smoke는 레거시 설치 기록 위치를 읽거나 누락된 marketplace 설치 기록 지속성을 허용할 수 있습니다.
- `plugin-update`는 설치 기록과 재설치 없음 동작이 변경되지 않아야 한다는 요구사항은 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지도 이미 출시된 로컬 빌드 메타데이터 stamp 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 합니다. 동일한 조건은 경고 또는 건너뛰기 대신 실패합니다.

### 예제

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

실패한 패키지 수락 실행을 디버깅할 때는 `resolve_package` 요약에서 시작하여 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계별 타이밍, 재실행 명령을 살펴보세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 것을 권장합니다.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 스코프 스크립트를 재사용합니다. 스모크 범위를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 핵심 Plugin/채널/gateway/Plugin SDK 표면을 건드리는 풀 리퀘스트에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하며, 에이전트 삭제 공유 워크스페이스 CLI 스모크를 실행하고, 컨테이너 gateway-network e2e를 실행하며, 번들 확장 빌드 인자를 검증하고, 240초 집계 명령 제한 시간 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다(각 시나리오의 Docker 실행은 별도로 제한됨).
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 실제로 설치 프로그램/패키지/Docker 표면을 건드리는 풀 리퀘스트에 대해 QR 패키지 설치와 설치 프로그램 Docker/update 범위를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지 하나를 준비하거나 재사용한 뒤, QR 패키지 설치, 루트 Dockerfile/gateway 스모크, 설치 프로그램/update 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 기다리지 않게 합니다.

`main` 푸시(머지 커밋 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 범위를 요청하더라도, 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 image-provider 스모크는 `run_bun_global_install_smoke`로 별도로 게이트됩니다. 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. QR 및 설치 프로그램 Docker 테스트는 각각 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 라이브 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm 타볼로 한 번 패킹하며, 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 프로그램/update/Plugin-dependency 레인용 기본 Node/Git 실행기;
- 일반 기능 레인을 위해 동일한 타볼을 `/app`에 설치하는 기능 이미지.

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 실행기는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 메인 풀 슬롯 수.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 공급자에 민감한 테일 풀 슬롯 수.                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 공급자가 스로틀링하지 않도록 하는 동시 라이브 레인 상한.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 멀티 서비스 레인 상한.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격. 간격을 없애려면 `0`으로 설정합니다.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분). 선택된 라이브/테일 레인은 더 엄격한 상한을 사용합니다.          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`이면 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록. 에이전트가 실패한 레인 하나를 재현할 수 있도록 정리 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 빈 풀에서는 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 활성 레인 상태를 내보내고, 가장 오래 걸린 항목을 먼저 배치하기 위해 레인 타이밍을 보존하며, 기본적으로 첫 번째 실패 이후 새 풀 레인 스케줄링을 중지합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 범위를 질의합니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. 또한 타볼 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시하며, 재빌드 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 풀은 시도당 180초의 제한된 제한 시간으로 재시도되어, 멈춘 registry/cache 스트림이 CI 핵심 경로 대부분을 소모하는 대신 빠르게 재시도되도록 합니다.

### 릴리스 경로 청크

릴리스 Docker 범위는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하므로 각 청크는 필요한 이미지 종류만 풀하고 동일한 가중치 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/runtime 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 공급자 설치 프로그램 레인 모두에 대한 집계 수동 재실행 별칭으로 남아 있습니다.

전체 release-path 범위가 요청하면 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에 대해서만 독립 실행형 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계별 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행하므로, 실패 레인 디버깅을 하나의 대상 Docker 작업으로 제한하고 해당 실행을 위한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인이면 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 존재할 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로 실패한 레인은 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 전체 release-path Docker 제품군을 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 범위이므로 `Full Release Validation` 또는 명시적 운영자에 의해 디스패치되는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 실행형 수동 CI 디스패치는 이 제품군을 꺼 둡니다. 번들 Plugin 테스트를 여덟 개의 확장 워커에 균등 배분합니다. 해당 확장 샤드 작업은 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하며, 그룹당 하나의 Vitest 워커와 더 큰 Node 힙을 사용하여 import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록 합니다. 릴리스 전용 Docker 사전 릴리스 경로는 대상 Docker 레인을 작은 그룹으로 묶어 1~3분짜리 작업을 위해 수십 개의 러너를 예약하지 않도록 합니다.

## QA Lab

QA Lab에는 메인 스마트 스코프 워크플로 외부에 전용 CI 레인이 있습니다. 에이전트 parity는 독립형 PR 워크플로가 아니라 광범위한 QA 및 릴리스 하네스 아래에 중첩됩니다. parity가 광범위한 검증 실행과 함께 가야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용하세요.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 실행되고 수동 디스패치에서도 실행됩니다. 이 워크플로는 mock parity 레인, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 펼칩니다. 라이브 작업은 `qa-live-shared` 환경을 사용하고, Telegram/Discord는 Convex lease를 사용합니다.

릴리스 검사는 결정적 mock provider와 mock-qualified 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하므로, 채널 계약이 라이브 모델 지연과 일반 공급자 Plugin 시작에서 격리됩니다. 라이브 전송 Gateway는 QA parity가 메모리 동작을 별도로 다루기 때문에 메모리 검색을 비활성화합니다. 공급자 연결성은 별도의 라이브 모델, 네이티브 공급자, Docker 공급자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 범위를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`도 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인을 실행합니다. 이 QA parity 게이트는 후보 팩과 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 parity 비교를 위해 두 아티팩트를 모두 작은 보고서 작업으로 다운로드합니다.

일반 PR에서는 parity를 필수 상태로 취급하는 대신 스코프가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일, 수동 및 드래프트가 아닌 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 함께 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, high/critical `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` 또는 `src` 아래의 변경에만 시작되며, 예약된 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 비밀, 샌드박스, Cron 및 Gateway 기준선                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 비밀, 감사 접점                                             |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기 및 Plugin SDK SSRF 정책 표면                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달 및 에이전트 도구 실행 게이트                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩 및 Plugin SDK 패키지 계약 신뢰 표면               |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 sanity가 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 종속성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드는 깨끗한 상태에서도 런타임을 지배하므로 일일 기본값 밖에 유지됩니다.

### Critical Quality 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux 러너에서 좁고 가치가 높은 표면에 대해 오류 심각도, 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 예약된 프로필보다 의도적으로 더 작습니다. 드래프트가 아닌 PR은 에이전트 명령/모델/도구 실행 및 답장 디스패치 코드, 설정 스키마/마이그레이션/IO 코드, 인증/비밀/샌드박스/보안 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 글루, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약 또는 Plugin SDK 답장 런타임 변경에 대해 일치하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 설정 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 격리해서 실행하기 위한 학습/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 비밀, 샌드박스, Cron 및 Gateway 보안 경계 코드                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | 설정 스키마, 마이그레이션, 정규화 및 IO 계약                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 답장 디스패치와 큐 및 ACP 제어 평면 런타임 계약                                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버 및 도구 브리지, 프로세스 감독 헬퍼 및 아웃바운드 전달 계약                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 글루 및 메모리 doctor 명령                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | 답장 큐 내부, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면 및 세션 doctor CLI 계약                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 답장 디스패치, 답장 페이로드/청킹/런타임 헬퍼, 채널 답장 옵션, 전달 큐 및 세션/스레드 바인딩 헬퍼                                   |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 발견, 제공자 런타임 등록, 제공자 기본값/카탈로그 및 웹/검색/가져오기/임베딩 레지스트리                             |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 부트스트랩, 로컬 영속성, Gateway 제어 흐름 및 작업 제어 평면 런타임 계약                                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성 및 미디어 생성 런타임 계약                                                                     |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면 및 Plugin SDK 진입점 계약                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                               |

품질은 보안과 별도로 유지되므로 품질 발견 사항을 보안 신호를 흐리지 않고 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python 및 번들 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정된 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 랜딩된 변경과 기존 문서를 맞춰 유지하기 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수 있습니다. 워크플로 실행 호출은 `main`이 이미 앞으로 이동했거나 지난 1시간 내에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전의 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간 단위 실행이 마지막 문서 패스 이후 누적된 모든 main 변경을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 같은 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 해당 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터 대신 커버리지를 유지하는 작은 테스트 성능 수정만 수행하게 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서는 커밋 전에 반드시 통과해야 합니다. 봇 push가 랜딩되기 전에 `main`이 전진하면, 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex 액션이 문서 에이전트와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 랜딩 후 중복 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에 랜딩된 PR이 병합되었고 각 중복 항목에 공유된 참조 이슈 또는 겹치는 변경 헝크가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 해당 로컬 검사 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 프로덕션 및 핵심 테스트 typecheck와 핵심 lint/guard를 실행합니다.
- 핵심 테스트 전용 변경은 핵심 테스트 typecheck와 핵심 lint만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 typecheck와 확장 lint를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 typecheck와 확장 lint를 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 해당 핵심 계약에 의존하므로 확장 typecheck로 확장됩니다. Vitest 확장 스윕은 명시적 테스트 작업으로 유지됩니다.
- 릴리스 메타데이터 전용 버전 범프는 대상 지정 버전/설정/root 종속성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 모든 검사 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트를 실행하고, 소스 편집은 명시적 매핑을 우선한 뒤 형제 테스트와 import 그래프 종속 항목을 실행합니다. 공유 그룹 룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹 visible-reply 설정, 소스 답장 전달 모드 또는 message-tool 시스템 프롬프트 변경은 핵심 답장 테스트와 Discord 및 Slack 전달 회귀를 통과하도록 라우팅되므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하네스 전반에 걸쳐 있어 저렴한 매핑 세트를 신뢰할 수 있는 대리 지표로 볼 수 없을 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

저장소 루트에서 Testbox를 실행하고, 광범위한 검증에는 새로 예열한 박스를 선호하세요. 재사용되었거나, 만료되었거나, 예상보다 큰 동기화를 방금 보고한 박스에 느린 게이트를 쓰기 전에 먼저 박스 안에서 `pnpm testbox:sanity`를 실행하세요.

필수 루트 파일인 `pnpm-lock.yaml` 등이 사라졌거나 `git status --short`가 추적 중인 삭제를 200개 이상 표시하면 sanity 검사는 빠르게 실패합니다. 이는 보통 원격 동기화 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하지 말고 해당 박스를 중지한 뒤 새 박스를 예열하세요. 의도적으로 대량 삭제를 수행하는 PR의 경우, 해당 sanity 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 해당 가드를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하고, 유난히 큰 로컬 차이에는 더 큰 밀리초 값을 사용하세요.

Crabbox는 Blacksmith를 사용할 수 없거나 자체 클라우드 용량을 사용하는 편이 더 나을 때 Linux 검증에 쓰는 저장소 소유의 두 번째 원격 박스 경로입니다. 박스를 예열하고, 프로젝트 워크플로를 통해 하이드레이션한 다음, Crabbox CLI로 명령을 실행하세요.

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml`은 제공자, 동기화, GitHub Actions 하이드레이션 기본값을 담당합니다. 로컬 `.git`은 제외하므로, 하이드레이션된 Actions 체크아웃은 maintainer 로컬 원격과 객체 저장소를 동기화하지 않고 자체 원격 Git 메타데이터를 유지합니다. 또한 절대 전송되어서는 안 되는 로컬 런타임/빌드 산출물도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 체크아웃, Node/pnpm 설정, `origin/main` 가져오기, 그리고 이후 `crabbox run --id <cbx_id>` 명령이 소스로 사용하는 비밀이 아닌 환경 인계를 담당합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
