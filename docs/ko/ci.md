---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 릴리스 포괄 작업 및 로컬 명령 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-07-04T17:52:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`으로의 모든 push와 모든 pull request에서 실행됩니다. 정식
`main` push는 먼저 90초 hosted-runner 승인 창을 통과합니다.
기존 `CI` concurrency 그룹은 더 최신 commit이 들어오면 대기 중인 해당 실행을
취소하므로, 연속 merge가 각각 전체 Blacksmith matrix를 등록하지 않습니다.
Pull request와 수동 dispatch는 대기를 건너뜁니다. 그런 다음 `preflight` job이
diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다.
수동 `workflow_dispatch` 실행은 의도적으로 smart scoping을 우회하고 release
candidate와 광범위한 검증을 위해 전체 graph로 fan out합니다. Android lane은
`include_android`를 통해 opt-in으로 유지됩니다. Release 전용 plugin coverage는
별도 [`Plugin Prerelease`](#plugin-prerelease) workflow에 있으며
[`Full Release Validation`](#full-release-validation) 또는 명시적 수동 dispatch에서만 실행됩니다.

## Pipeline 개요

| Job                                | 목적                                                                                                   | 실행 시점                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs 전용 변경, 변경된 scope, 변경된 extension을 감지하고 CI manifest를 빌드                   | draft가 아닌 push와 PR에서 항상                  |
| `runner-admission`                 | Blacksmith 작업이 등록되기 전에 정식 `main` push에 대해 hosted 90초 debounce 수행                | 모든 CI 실행; 정식 `main` push에서만 sleep |
| `security-fast`                    | private key 감지, `zizmor`를 통한 변경된 workflow 감사, production lockfile 감사                 | draft가 아닌 push와 PR에서 항상                  |
| `check-dependencies`               | production Knip dependency 전용 pass와 unused-file allowlist guard                                 | Node 관련 변경                               |
| `build-artifacts`                  | `dist/`, Control UI, 빌드된 CLI smoke check, 내장 빌드 artifact check, 재사용 가능한 artifact 빌드 | Node 관련 변경                               |
| `checks-fast-core`                 | bundled, protocol, QA Smoke CI, CI routing check 같은 빠른 Linux correctness lane                | Node 관련 변경                               |
| `checks-fast-contracts-plugins-*`  | 두 개로 shard된 plugin contract check                                                                        | Node 관련 변경                               |
| `checks-fast-contracts-channels-*` | 두 개로 shard된 channel contract check                                                                       | Node 관련 변경                               |
| `checks-node-core-*`               | channel, bundled, contract, extension lane을 제외한 core Node test shard                          | Node 관련 변경                               |
| `check-*`                          | shard된 main local gate 동등 항목: prod type, lint, guard, test type, strict smoke                | Node 관련 변경                               |
| `check-additional-*`               | Architecture, shard된 boundary/prompt drift, extension guard, package boundary, runtime topology     | Node 관련 변경                               |
| `checks-node-compat-node22`        | Node 22 compatibility build와 smoke lane                                                                | release용 수동 CI dispatch                     |
| `check-docs`                       | Docs formatting, lint, broken-link check                                                             | Docs 변경                                        |
| `skills-python`                    | Python 기반 Skills에 대한 Ruff + pytest                                                                    | Python-skill 관련 변경                       |
| `checks-windows`                   | Windows 전용 process/path test와 shared runtime import specifier regression                      | Windows 관련 변경                            |
| `macos-node`                       | shared built artifact를 사용하는 macOS TypeScript test lane                                               | macOS 관련 변경                              |
| `macos-swift`                      | macOS app용 Swift lint, build, test                                                            | macOS 관련 변경                              |
| `ios-build`                        | Xcode project 생성과 iOS app simulator build                                                 | iOS app, shared app kit 또는 Swabble 변경         |
| `android`                          | 두 flavor의 Android unit test와 debug APK build 하나                                              | Android 관련 변경                            |
| `test-performance-agent`           | 신뢰된 activity 이후 일일 Codex slow-test optimization                                                 | Main CI success 또는 manual dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, GPT 5.5 live lane이 포함된 일일/on-demand Kova runtime performance report | scheduled 및 manual dispatch                       |

## Fail-fast 순서

1. `runner-admission`은 정식 `main` push에 대해서만 대기합니다. 더 최신 push가 있으면 Blacksmith 등록 전에 실행이 취소됩니다.
2. `preflight`는 어떤 lane이 아예 존재할지 결정합니다. `docs-scope`와 `changed-scope` logic은 독립 job이 아니라 이 job 내부 step입니다.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix job을 기다리지 않고 빠르게 실패합니다.
4. `build-artifacts`는 fast Linux lane과 겹쳐 실행되므로, shared build가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
5. 이후 더 무거운 platform 및 runtime lane이 fan out됩니다: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, `android`.

같은 PR 또는 `main` ref에 더 최신 push가 들어오면 GitHub가 대체된 job을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI noise로 취급하세요. Matrix job은 `fail-fast: false`를 사용하며, `build-artifacts`는 작은 verifier job을 queue에 넣는 대신 embedded channel, core-support-boundary, gateway-watch 실패를 직접 보고합니다. 자동 CI concurrency key는 versioned(`CI-v7-*`)되어 있으므로, 오래된 queue group의 GitHub 측 zombie가 더 최신 main 실행을 무기한 차단할 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

GitHub Actions의 wall time, queue time, 가장 느린 job, failure, `pnpm-store-warmup` fanout barrier를 요약하려면 `pnpm ci:timings`, `pnpm ci:timings:recent` 또는 `node scripts/ci-run-timings.mjs <run-id>`를 사용하세요. CI는 동일한 run summary도 `ci-timings-summary` artifact로 업로드합니다. Build timing의 경우 `build-artifacts` job의 `Build dist` step을 확인하세요. `pnpm build:ci-artifacts`는 `[build-all] phase timings:`를 출력하고 `ui:build`를 포함합니다. 해당 job은 `startup-memory` artifact도 업로드합니다.

Pull request 실행의 경우, terminal timing-summary job은 `GH_TOKEN`을 `gh run view`에 전달하기 전에 trusted base revision의 helper를 실행합니다. 이렇게 하면 token이 포함된 query가 branch-controlled code 밖에 유지되면서도 pull request의 현재 CI 실행을 요약할 수 있습니다.

## PR context와 evidence

External contributor PR은 `.github/workflows/real-behavior-proof.yml`에서
PR context 및 evidence gate를 실행합니다. 이 workflow는 trusted base commit을
checkout하고 PR body만 평가합니다. contributor branch의 code는 실행하지 않습니다.

이 gate는 repository owner, member, collaborator 또는 bot이 아닌 PR author에게 적용됩니다.
PR body에 작성된 `What Problem This Solves` 및 `Evidence` section이 포함되어 있으면 통과합니다.
Evidence는 focused test, CI result, screenshot, recording, terminal output, live observation,
redacted log 또는 artifact link일 수 있습니다. Body는 intent와 유용한 validation을 제공합니다.
Reviewer는 correctness를 평가하기 위해 code, test, CI를 검사합니다.

Check가 실패하면 다른 code commit을 push하는 대신 PR body를 업데이트하세요.

## Scope와 routing

Scope logic은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit test로 covered됩니다. Manual dispatch는 changed-scope detection을 건너뛰고 preflight manifest가 모든 scoped area가 변경된 것처럼 동작하게 합니다.

- **CI workflow edit**은 Node CI graph와 workflow linting을 validate하지만, 그 자체만으로 Windows, iOS, Android 또는 macOS native build를 강제하지 않습니다. 해당 platform lane은 platform source change로 scoped된 상태를 유지합니다.
- **Workflow Sanity**는 모든 workflow YAML file에 대해 `actionlint`, `zizmor`, composite-action interpolation guard, conflict-marker guard를 실행합니다. PR scoped `security-fast` job도 변경된 workflow file에 대해 `zizmor`를 실행하므로 workflow security finding이 main CI graph에서 일찍 실패합니다.
- **`main` push의 Docs**는 CI에서 사용하는 것과 동일한 ClawHub docs mirror를 사용해 standalone `Docs` workflow에서 check되므로, code+docs가 섞인 push가 CI `check-docs` shard도 queue하지 않습니다. Pull request와 manual CI는 docs가 변경된 경우 여전히 CI에서 `check-docs`를 실행합니다.
- **TUI PTY**는 TUI 변경에 대해 `checks-node-core-runtime-tui-pty` Linux Node shard에서 실행됩니다. 이 shard는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`로 `test/vitest/vitest.tui-pty.config.ts`를 실행하므로 deterministic `TuiBackend` fixture lane과 외부 model endpoint만 mock하는 더 느린 `tui --local` smoke를 모두 covered합니다.
- **CI routing 전용 edit, 선택된 저비용 core-test fixture edit, 좁은 plugin contract helper/test-routing edit**은 fast Node 전용 manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 이 path는 변경이 fast task가 직접 exercise하는 routing 또는 helper surface로 제한될 때 build artifact, Node 22 compatibility, channel contract, full core shard, bundled-plugin shard, additional guard matrix를 건너뜁니다.
- **Windows Node check**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 그리고 해당 lane을 실행하는 CI workflow surface로 scoped됩니다. 관련 없는 source, plugin, install-smoke, test 전용 변경은 Linux Node lane에 유지됩니다.

가장 느린 Node 테스트 계열은 각 작업이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할하거나 균형을 맞춥니다. Plugin contract와 channel contract는 각각 표준 GitHub runner fallback을 갖춘 Blacksmith 기반 가중치 shard 두 개로 실행되고, core unit fast/support lane은 별도로 실행되며, core runtime infra는 state, process/config, shared, 세 개의 cron domain shard로 나뉩니다. auto-reply는 균형 잡힌 worker로 실행되고(reply 하위 트리는 agent-runner, dispatch, commands/state-routing shard로 분할), agentic gateway/server config는 빌드된 artifact를 기다리는 대신 chat/auth/model/http-plugin/runtime/startup lane으로 나뉩니다. 그런 다음 일반 CI는 isolated infra include-pattern shard만 최대 64개 테스트 파일의 결정적 bundle로 패킹하여, non-isolated command/cron, stateful agents-core, gateway/server suite를 병합하지 않고 Node matrix를 줄입니다. 무거운 고정 suite는 8 vCPU에 유지되고, bundle된 lane과 낮은 가중치 lane은 4 vCPU를 사용합니다. canonical repository의 pull request는 추가 compact admission plan을 사용합니다. 동일한 per-config group이 현재 34-job Linux Node plan 안에서 isolated subprocess로 실행되므로, 단일 PR이 전체 70개 초과 job Node matrix를 등록하지 않습니다. `main` push, manual dispatch, release gate는 전체 matrix를 유지합니다. 광범위한 browser, QA, media, miscellaneous plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard 이름을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional-*`는 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard list는 prompt가 많은 shard 하나와 나머지 guard stripe를 위한 통합 shard 하나로 stripe 처리되며, 각각 선택된 독립 guard를 동시에 실행하고 per-check timing을 출력합니다. 비용이 큰 Codex happy-path prompt snapshot drift check는 manual CI와 prompt에 영향을 주는 변경에만 자체 additional job으로 실행되므로, 일반적인 무관한 Node 변경은 cold prompt snapshot generation 뒤에서 기다리지 않고 boundary shard는 균형을 유지하면서도 prompt drift는 여전히 이를 유발한 PR에 고정됩니다. 같은 flag는 built-artifact core support-boundary shard 안에서 prompt snapshot Vitest generation을 건너뜁니다. Gateway watch, channel test, core support-boundary shard는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

admit된 뒤에는 canonical Linux CI가 최대 24개의 동시 Node 테스트 job과
더 작은 fast/check lane에는 12개를 허용합니다. Windows와 Android는
runner pool이 더 좁기 때문에 2개로 유지됩니다.

compact PR plan은 현재 suite에 대해 18개의 Node job을 내보냅니다. whole-config
group은 120분 batch timeout을 가진 isolated subprocess에서 batch 처리되고,
include-pattern group은 동일한 bounded job budget을 공유합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 이 unit-test lane은 여전히 SMS/call-log BuildConfig flag로 flavor를 컴파일하면서도, Android 관련 push마다 중복 debug APK packaging job을 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip version에 고정되고, `dlx` 설치에 대해 pnpm의 minimum release age가 비활성화된 production Knip dependency-only pass)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file finding을 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 unused file을 추가하거나 오래된 allowlist entry를 남길 때 실패하며, Knip이 정적으로 resolve할 수 없는 의도적인 dynamic plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw repository activity를 ClawSweeper로 전달하는 target-side bridge입니다. 신뢰할 수 없는 pull request code를 checkout하거나 실행하지 않습니다. workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 생성한 다음 compact `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

workflow에는 네 개의 lane이 있습니다.

- 정확한 issue 및 pull request review request를 위한 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper command를 위한 `clawsweeper_comment`;
- `main` push의 commit-level review request를 위한 `clawsweeper_commit_review`;
- ClawSweeper agent가 inspect할 수 있는 일반 GitHub activity를 위한 `github_activity`.

`github_activity` lane은 정규화된 metadata만 전달합니다. event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때의 짧은 excerpt입니다. 의도적으로 전체 webhook body는 전달하지 않습니다. `openclaw/clawsweeper`의 수신 workflow는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 게시합니다.

일반 activity는 관찰이며, 기본 delivery가 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받고, event가 놀랍거나, actionable하거나, risky하거나, operationally useful할 때만 `#clawsweeper`에 게시해야 합니다. 일상적인 open, edit, bot churn, 중복 webhook noise, 일반 review traffic은 `NO_REPLY`가 되어야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message는 신뢰할 수 없는 data로 취급하십시오. 이는 요약과 triage를 위한 input이지, workflow나 agent runtime을 위한 instruction이 아닙니다.

## Manual dispatches

Manual CI dispatch는 일반 CI와 동일한 job graph를 실행하지만, Android가 아닌 모든 scoped lane을 강제로 켭니다. Linux Node shard, bundled-plugin shard, plugin 및 channel contract shard, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke check, docs check, Python skills, Windows, macOS, iOS build, Control UI i18n입니다. standalone manual CI dispatch는 `include_android=true`일 때만 Android를 실행합니다. full release umbrella는 `include_android=true`를 전달해 Android를 활성화합니다. plugin prerelease static check, release-only `agentic-plugins` shard, full extension batch sweep, plugin prerelease Docker lane은 CI에서 제외됩니다. Docker prerelease suite는 `Full Release Validation`이 release-validation gate를 활성화한 별도 `Plugin Prerelease` workflow를 dispatch할 때만 실행됩니다.

Manual run은 고유한 concurrency group을 사용하므로 release-candidate full suite가 같은 ref의 다른 push 또는 PR run 때문에 취소되지 않습니다. 선택적 `target_ref` input을 통해 신뢰할 수 있는 caller는 선택된 dispatch ref의 workflow file을 사용하면서 branch, tag, 전체 commit SHA에 대해 해당 graph를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

monthly npm-only extended-stable path는 예외입니다. `OpenClaw NPM
Release` preflight와 `Full Release Validation`을 정확한
`extended-stable/YYYY.M.33` branch에서 모두 dispatch하고, 해당 run ID를 보존한 뒤 두 ID를 모두
direct npm publish run에 전달하십시오. command, 정확한 identity requirement, registry readback, selector
repair procedure는 [Monthly npm-only extended-stable
publication](/ko/reference/RELEASING#monthly-npm-only-extended-stable-publication)을 참조하십시오.
이 경로는 plugin, macOS, Windows, GitHub
Release, private dist-tag 또는 기타 platform publication을 dispatch하지 않습니다.

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch 및 non-canonical repository fallback, CodeQL JavaScript/actions quality scan, workflow-sanity, labeler, auto-response, CI 외부 docs workflow, 그리고 Blacksmith matrix가 더 일찍 queue될 수 있도록 하는 install-smoke preflight                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lower-weight extension shard, QA Smoke CI를 제외한 `checks-fast-core`, plugin/channel contract shard, 대부분의 bundled/lower-weight Linux Node shard, `check-guards`, `check-prod-types`, `check-test-types`, 선택된 `check-additional-*` shard, `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 유지되는 heavy Linux Node suite, boundary/extension-heavy `check-additional-*` shard, `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI 및 Testbox의 `build-artifacts`, `check-lint`(CPU에 민감해 8 vCPU가 절약한 것보다 더 많은 비용이 들었음), install-smoke Docker build(32-vCPU queue time이 절약한 것보다 더 많은 비용이 들었음)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw`의 `macos-node`; fork는 `macos-15`로 fallback                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw`의 `macos-swift` 및 `ios-build`; fork는 `macos-26`으로 fallback                                                                                                                                                                                                                     |

## Runner registration budget

OpenClaw의 현재 GitHub runner-registration bucket은 `ghx api rate_limit`에서 5분당 10,000개의 self-hosted
runner registration을 보고합니다. GitHub가 이 bucket을 변경할 수 있으므로 각 tuning pass 전에
`actions_runner_registration`을 다시 확인하십시오. 이 limit은
`openclaw` organization의 모든 Blacksmith runner registration이 공유하므로, 다른 Blacksmith installation을 추가해도
새 bucket이 추가되지 않습니다.

burst control에서는 Blacksmith label을 scarce resource로 취급하십시오. route, notify, summarize, select shard만 수행하거나 짧은 CodeQL scan을 실행하는 job은 측정된 Blacksmith-specific
need가 없는 한 GitHub-hosted runner에 유지해야 합니다. 새 Blacksmith matrix, 더 큰 `max-parallel`, 또는 high-frequency
workflow는 worst-case registration count를 보여야 하며 org-level
target을 live bucket의 약 60% 아래로 유지해야 합니다. 현재 10,000-registration
bucket에서는 6,000-registration operating target을 의미하며, concurrent repository, retry, burst overlap을 위한 여유를 남깁니다.

canonical-repo CI는 normal push 및 pull-request run의 기본 runner path로 Blacksmith를 유지합니다. `workflow_dispatch`와 non-canonical repository run은 GitHub-hosted runner를 사용하지만, normal canonical run은 현재 Blacksmith queue health를 probe하거나 Blacksmith를 사용할 수 없을 때 GitHub-hosted label로 자동 fallback하지 않습니다.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. 이 워크플로는 `main`에서 매일 실행되며 수동으로 디스패치할 수 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 릴리스 태그나 현재 워크플로 구현이 있는 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 최신 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, 레인 인증 모드, 모델, 반복 횟수, 시나리오 필터를 기록합니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 다음, 세 가지 레인을 실행합니다.

- `mock-provider`: 결정론적 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에 대한 Kova 진단 시나리오입니다.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴 핫스팟에 대한 CPU/힙/트레이스 프로파일링입니다.
- `live-openai-candidate`: 실제 OpenAI `openai/gpt-5.5` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider 레인은 Kova 통과 후에도 OpenClaw 네이티브 소스 프로브를 실행합니다. 기본, 훅, 50-Plugin 시작 사례 전반의 Gateway 부팅 타이밍과 메모리, 번들 Plugin 가져오기 RSS, 반복 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway에 대한 CLI 시작 명령, SQLite 상태 스모크 성능 프로브를 실행합니다. 테스트된 ref에 대한 이전 게시 mock-provider 소스 보고서를 사용할 수 있으면, 소스 요약은 현재 RSS와 힙 값을 해당 기준선과 비교하고 큰 RSS 증가를 `watch`로 표시합니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 레인은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 기록됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 상위 워크플로입니다. 이 워크플로는 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 대상으로 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위해 `Plugin Prerelease`를 디스패치하며, 설치 스모크, 패키지 승인, 크로스 OS 패키지 검사, QA 프로필 증거 기반 성숙도 스코어카드 렌더링, QA Lab 동등성, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. stable 및 full 프로필은 항상 광범위한 live/E2E와 Docker 릴리스 경로 soak 커버리지를 포함하며, beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다. 정식 패키지 Telegram E2E는 Package Acceptance 내부에서 실행되므로, 전체 후보는 중복 live poller를 시작하지 않습니다. 게시 후에는 `release_package_spec`을 전달하여 릴리스 검사, Package Acceptance, Docker, 크로스 OS, Telegram 전반에서 다시 빌드하지 않고 배포된 npm 패키지를 재사용하세요. 집중 게시 패키지 Telegram 재실행에만 `npm_telegram_package_spec`을 사용하세요. Codex Plugin live 패키지 레인은 기본적으로 같은 선택 상태를 사용합니다. 게시된 `release_package_spec=openclaw@<tag>`는 `codex_plugin_spec=npm:@openclaw/codex@<tag>`를 파생하고, SHA/아티팩트 실행은 선택된 ref에서 `extensions/codex`를 패킹합니다. `npm:`, `npm-pack:`, `git:` 사양 같은 사용자 지정 Plugin 소스에는 `codex_plugin_spec`을 명시적으로 설정하세요.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 워크플로입니다. 릴리스 태그가 존재하고 OpenClaw npm 사전 검사가 성공한 뒤 `release/YYYY.M.PATCH` 또는 `main`에서 디스패치하세요. 이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해 `Plugin NPM Release`를 디스패치하며, 같은 릴리스 SHA에 대해 `Plugin ClawHub Release`를 디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다. stable 게시에는 정확한 `windows_node_tag`도 필요합니다. 워크플로는 Windows 소스 릴리스를 검증하고, 어떤 게시 자식 작업보다 먼저 x64/ARM64 설치 프로그램을 후보 승인된 `windows_node_installer_digests` 입력과 비교한 다음, GitHub 릴리스 초안을 게시하기 전에 동일하게 고정된 설치 프로그램 다이제스트와 정확한 동반 아티팩트 및 체크섬 계약을 승격하고 검증합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

빠르게 변하는 브랜치에서 고정 커밋 증명이 필요하면 `gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다. 헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고, 해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 자식 워크플로 `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 상위 검증기도 어떤 자식 워크플로가 다른 SHA에서 실행되면 실패합니다.

`release_profile`은 릴리스 검사로 전달되는 live/provider 범위를 제어합니다. 수동 릴리스 워크플로는 기본값이 `stable`입니다. 넓은 advisory provider/media 매트릭스를 의도적으로 원할 때만 `full`을 사용하세요. stable 및 full 릴리스 검사는 항상 광범위한 live/E2E와 Docker 릴리스 경로 soak를 실행합니다. beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다.

- `minimum`은 가장 빠른 OpenAI/코어 릴리스 핵심 레인을 유지합니다.
- `stable`은 stable provider/backend 세트를 추가합니다.
- `full`은 넓은 advisory provider/media 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 자식 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 자식 실행 결론을 다시 확인하고 각 자식 실행에 대한 가장 느린 작업 표를 추가합니다. 자식 워크플로를 재실행해 성공으로 바뀌면, 상위 결과와 타이밍 요약을 새로 고치기 위해 부모 검증기 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 자식만에는 `ci`, Plugin prerelease 자식만에는 `plugin-prerelease`, 모든 릴리스 자식에는 `release-checks`를 사용하거나, 상위 워크플로에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다. 실패한 크로스 OS 레인 하나에 대해서는 `rerun_group=cross-os`와 `cross_os_suite_filter`를 결합하세요. 예: `windows/packaged-upgrade`. 긴 크로스 OS 명령은 Heartbeat 줄을 출력하고, packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA 릴리스 검사 레인은 표준 런타임 도구 커버리지 게이트를 제외하고는 advisory입니다. 이 게이트는 필수 OpenClaw 동적 도구가 표준 티어 요약에서 달라지거나 사라질 때 차단합니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용하여 선택된 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 크로스 OS 검사와 Package Acceptance, 그리고 soak 커버리지가 실행될 때 live/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되며, 여러 자식 작업에서 같은 후보를 다시 패킹하지 않아도 됩니다. Codex npm-plugin live 레인의 경우 릴리스 검사는 `release_package_spec`에서 파생된 일치하는 게시 Plugin 사양을 전달하거나, 운영자가 제공한 `codex_plugin_spec`을 전달하거나, Docker 스크립트가 선택된 체크아웃의 Codex Plugin을 패킹하도록 입력을 비워 둡니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은 더 오래된 상위 워크플로를 대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한 모든 자식 워크플로를 취소하므로, 새 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## Live 및 E2E 샤드

릴리스 live/E2E 자식은 넓은 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름 있는 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 미디어 오디오/비디오 샤드 및 provider-filtered 음악 샤드

이렇게 하면 같은 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에 계속 유효합니다.

네이티브 live 미디어 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 이 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. 미디어 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live suite는 일반 Blacksmith runner에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적합한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, 제공자별로 샤딩된 Gateway, CLI 백엔드, ACP 바인드, Codex 하니스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 워크플로 작업 제한 시간보다 낮은 명시적 스크립트 수준 `timeout` 한도를 적용하므로, 컨테이너나 정리 경로가 멈추면 전체 릴리스 체크 예산을 소모하는 대신 빠르게 실패합니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면, 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드에 실제 시간을 낭비하게 됩니다.

## 패키지 수용성

질문이 "이 설치 가능한 OpenClaw 패키지가 제품으로서 작동하는가?"라면 `패키지 수용성`을 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하지만, 패키지 수용성은 설치 또는 업데이트 후 사용자가 실행하는 동일한 Docker E2E 하니스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 작성하고, `.artifacts/docker-e2e-package/package-candidate.json`을 작성하고, 둘 다 `package-under-test` 아티팩트로 업로드하며, GitHub 단계 요약에 소스, 워크플로 참조, 패키지 참조, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤터리를 검증하고, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하며, 워크플로 체크아웃을 패키징하는 대신 해당 패키지를 대상으로 선택한 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음, 고유한 아티팩트를 사용하는 병렬 대상 Docker 작업으로 해당 레인들을 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, 패키지 수용성이 하나를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm 사양을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 수용성, 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2`와 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 프리릴리스/안정 릴리스 수용성에 이것을 사용하세요.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패키징합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하고, 분리된 worktree에 deps를 설치한 뒤 `scripts/package-openclaw-for-docker.mjs`로 패키징합니다.
- `source=url`은 공개 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다. 이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트 이름 또는 해석된 IP, 그리고 동일한 공개 안전 정책 밖으로 벗어나는 리디렉션을 거부합니다.
- `source=trusted-url`은 `.github/package-trusted-sources.json`의 명명된 신뢰 소스 정책에서 HTTPS `.tgz`를 다운로드합니다. `package_sha256` 및 `trusted_source_id`가 필수입니다. 구성된 호스트, 포트, 경로 접두사, 리디렉션 호스트, 또는 비공개 네트워크 해석이 필요한 maintainer 소유 엔터프라이즈 미러 또는 비공개 패키지 저장소에만 이것을 사용하세요. 정책이 bearer auth를 선언하면 워크플로는 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret을 사용합니다. URL에 포함된 자격 증명은 여전히 거부됩니다.
- `source=artifact`는 `artifact_run_id` 및 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 아티팩트에는 제공해야 합니다.

`workflow_ref`와 `package_ref`를 분리해서 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하니스 코드입니다. `package_ref`는 `source=ref`일 때 패키징되는 소스 커밋입니다. 이를 통해 현재 테스트 하니스가 오래된 워크플로 로직을 실행하지 않고도 더 오래된 신뢰 소스 커밋을 검증할 수 있습니다.

### 제품군 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package`와 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm 사양 경로는 독립 실행형 디스패치를 위해 유지됩니다.

전용 업데이트 및 Plugin 테스트 정책은 로컬 명령,
Docker 레인, 패키지 수용성 입력, 릴리스 기본값, 실패 triage를 포함해
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 체크는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, `telegram_mode=mock-openai`로 패키지 수용성을 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 라이브 ClawHub Skills 설치, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명이 동일하게 해석된 패키지 tarball에서 유지됩니다. 베타를 게시한 후 Full Release Validation 또는 OpenClaw Release Checks에서 `release_package_spec`을 설정하면 다시 빌드하지 않고 동일한 매트릭스를 배포된 npm 패키지에 대해 실행합니다. 패키지 수용성이 나머지 릴리스 검증과 다른 패키지를 필요로 할 때만 `package_acceptance_package_spec`을 설정하세요. 교차 OS 릴리스 체크는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 다룹니다. 패키지/업데이트 제품 검증은 패키지 수용성으로 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행당 게시된 패키지 기준선 하나를 검증합니다. 패키지 수용성에서는 해석된 `package-under-test` tarball이 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`인 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정하여 최신 안정 npm 릴리스 4개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, tilde 로그 경로, 오래된 legacy Plugin 의존성 루트에 대한 이슈 형태의 fixture 전반으로 확장합니다. 다중 기준선 published-upgrade survivor 선택은 기준선별로 별도의 대상 Docker runner 작업으로 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리를 빠짐없이 수행하는 것일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 사양을 전달하거나, `openclaw@2026.4.15`와 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스용 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 미리 포함된 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz` 및 RPC 상태를 probe합니다. Windows 패키징 및 설치 프로그램 fresh 레인도 설치된 패키지가 raw 절대 Windows 경로에서 브라우저 제어 override를 import할 수 있는지 확인합니다. OpenAI 교차 OS agent-turn smoke는 `OPENCLAW_CROSS_OS_OPENAI_MODEL`이 설정된 경우 이를 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.5`를 사용하므로, GPT-4.x 기본값을 피하면서 설치 및 gateway 증명을 GPT-5 테스트 모델에 유지합니다.

### 레거시 호환성 기간

패키지 수용성에는 이미 게시된 패키지에 대해 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 케이스를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git fixture에서 누락된 pnpm `patchedDependencies`를 정리할 수 있으며, 누락된 지속 `update.channel`을 로그로 남길 수 있습니다.
- Plugin smoke는 레거시 설치 기록 위치를 읽거나 marketplace 설치 기록 지속성이 누락된 것을 허용할 수 있습니다.
- `plugin-update`는 설치 기록 및 재설치 없음 동작이 변경되지 않은 상태를 계속 요구하면서 config 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 합니다. 동일한 조건은 경고 또는 건너뛰기 대신 실패합니다.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

실패한 패키지 수용성 실행을 디버깅할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 그 Docker 아티팩트를 검사하세요. `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계별 타이밍, 재실행 명령이 포함됩니다. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 편을 선호하세요.

## 설치 smoke

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 코어 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 풀 리퀘스트에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, 에이전트 삭제 공유 작업공간 CLI 스모크를 실행하고, 컨테이너 Gateway 네트워크 E2E를 실행하고, 번들 확장 빌드 인자를 검증하며, 240초 집계 명령 제한 시간 안에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 디스패치, 워크플로 호출 릴리스 검사, 그리고 실제로 설치 프로그램/패키지/Docker 표면을 건드리는 풀 리퀘스트에 대해 QR 패키지 설치와 설치 프로그램 Docker/업데이트 커버리지를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지 하나를 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 프로그램/업데이트 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 기다리지 않도록 합니다.

`main` 푸시(병합 커밋 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 커버리지를 요청하더라도, 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 이미지 제공자 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 스모크는 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. 일반 PR CI는 Node 관련 변경에 대해 빠른 Bun 런처 회귀 레인을 계속 실행합니다. QR 및 설치 프로그램 Docker 테스트는 각자의 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 라이브 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 의존성 레인을 위한 기본 Node/Git 실행기
- 일반 기능 레인을 위해 같은 tarball을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 실행기는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능한 값

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 메인 풀 슬롯 수입니다.                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 제공자에 민감한 테일 풀 슬롯 수입니다.                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 제공자가 스로틀링하지 않도록 하는 동시 라이브 레인 상한입니다.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 동시 npm 설치 레인 상한입니다.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한입니다.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격입니다. 간격이 필요 없으면 `0`으로 설정합니다. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분)입니다. 선택된 라이브/테일 레인은 더 엄격한 상한을 사용합니다.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록입니다. 정리 스모크를 건너뛰어 에이전트가 실패한 레인 하나를 재현할 수 있게 합니다. |

유효 상한보다 무거운 레인도 빈 풀에서는 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 내보내고, 가장 오래 걸리는 레인을 먼저 배치하기 위해 레인 시간을 유지하며, 기본적으로 첫 실패 이후에는 새 풀 레인 예약을 중지합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 커버리지를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 그 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`의 패키지 아티팩트를 다운로드합니다. tarball 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 붙은 기본/기능 GHCR Docker E2E 이미지를 빌드하고 푸시하며, 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 풀은 시도별 180초 제한 시간으로 재시도되어, 멈춘 레지스트리/캐시 스트림이 CI 주요 경로 대부분을 소비하지 않고 빠르게 재시도되도록 합니다.

### 릴리스 경로 청크

릴리스 Docker 커버리지는 더 작은 청크 작업을 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행하여 각 청크가 필요한 이미지 종류만 풀하고 같은 가중치 기반 스케줄러로 여러 레인을 실행하게 합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `package-update-openai`에는 라이브 Codex Plugin 패키지 레인이 포함됩니다. 이 레인은 후보 OpenClaw 패키지를 설치하고, 명시적인 Codex CLI 설치 승인과 함께 `codex_plugin_spec` 또는 같은 참조의 tarball에서 Codex Plugin을 설치하고, Codex CLI 사전 점검을 실행한 다음, OpenAI를 대상으로 같은 세션의 OpenClaw 에이전트 턴 여러 개를 실행합니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/런타임 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 제공자 설치 프로그램 레인 모두에 대한 집계 수동 재실행 별칭으로 남아 있습니다.

전체 릴리스 경로 커버리지가 요청하면 OpenWebUI는 `plugins-runtime-services`에 접히며, OpenWebUI 전용 디스패치에 대해서만 독립 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 시간, `summary.json`, `failures.json`, 단계 시간, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지를 대상으로 선택된 레인을 실행합니다. 이렇게 하면 실패한 레인 디버깅이 하나의 대상 Docker 작업으로 제한되고, 그 실행을 위한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택한 레인이 라이브 Docker 레인인 경우, 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되어, 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 매일 전체 릴리스 경로 Docker 제품군을 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 커버리지이므로, `Full Release Validation` 또는 명시적인 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 수동 CI 디스패치에서는 이 제품군을 끕니다. 이 워크플로는 여덟 개의 확장 워커에 걸쳐 번들 Plugin 테스트의 균형을 맞춥니다. 해당 확장 샤드 작업은 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하며, 그룹당 Vitest 워커 하나와 더 큰 Node 힙을 사용해 import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록 합니다. 릴리스 전용 Docker 사전 릴리스 경로는 한 개에서 세 개 분량의 작업을 위해 수십 개의 실행기를 예약하지 않도록, 대상 Docker 레인을 작은 그룹으로 배치합니다. 워크플로는 `@openclaw/plugin-inspector`의 정보성 `plugin-inspector-advisory` 아티팩트도 업로드합니다. 검사기 발견 사항은 분류 입력이며 차단 Plugin Prerelease 게이트를 변경하지 않습니다.

## QA Lab

QA Lab에는 기본 스마트 범위 워크플로 밖에 전용 CI 레인이 있습니다. 에이전트 패리티는 독립 PR 워크플로가 아니라 광범위한 QA 및 릴리스 하네스 아래에 중첩됩니다. 패리티가 광범위한 검증 실행과 함께 가야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용합니다.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 야간 실행되고 수동 디스패치에서도 실행됩니다. 이 워크플로는 모의 패리티 레인, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 팬아웃합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex 임대를 사용합니다.

릴리스 검사는 결정적 모의 제공자와 모의 한정 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하여, 채널 계약이 라이브 모델 지연 시간과 일반 제공자 Plugin 시작에서 격리되도록 합니다. 라이브 전송 Gateway는 메모리 검색을 비활성화합니다. QA 패리티가 메모리 동작을 별도로 다루기 때문입니다. 제공자 연결성은 별도의 라이브 모델, 네이티브 제공자, Docker 제공자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`도 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인을 실행합니다. QA 패리티 게이트는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 패리티 비교를 위해 작은 보고서 작업에서 두 아티팩트를 모두 다운로드합니다.

일반 PR의 경우 패리티를 필수 상태로 취급하지 말고 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일 실행, 수동 실행, 초안이 아닌 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, high/critical `security-severity`로 필터링된 신뢰도 높은 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, 또는 프로세스를 소유하는 번들 Plugin 런타임 경로 아래의 변경에 대해서만 시작되며, 예약 워크플로와 같은 신뢰도 높은 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 비밀, 샌드박스, cron, Gateway 기준선                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 비밀, 감사 접점                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기, Plugin SDK SSRF 정책 표면                                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                           |
| `/codeql-security-high/process-exec-boundary`     | 로컬 셸, 프로세스 생성 헬퍼, 하위 프로세스를 소유하는 번들 Plugin 런타임, 워크플로 스크립트 연결 코드                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩, Plugin SDK 패키지 계약 신뢰 표면                         |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 정상성 검사가 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. 깨끗한 상태에서도 macOS 빌드가 런타임을 지배하므로 일일 기본값 밖에 유지됩니다.

### 중요 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 품질 스캔이 Blacksmith 러너 등록 예산을 쓰지 않도록 GitHub 호스팅 Linux 러너에서 좁고 가치가 높은 표면에 대해서만 오류 심각도, 비보안 JavaScript/TypeScript 품질 쿼리를 실행합니다. 해당 풀 리퀘스트 가드는 의도적으로 예약 프로필보다 작습니다. 초안이 아닌 PR은 에이전트 명령/모델/도구 실행 및 응답 디스패치 코드, 구성 스키마/마이그레이션/IO 코드, 인증/비밀/샌드박스/보안 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 연결 코드, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약 또는 Plugin SDK 응답 런타임 변경에 대해 일치하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 구성 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 품질 샤드 하나를 격리해서 실행하기 위한 교육/반복용 훅입니다.

| 범주                                                    | 표면                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 비밀, 샌드박스, cron, Gateway 보안 경계 코드                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 구성 스키마, 마이그레이션, 정규화, IO 계약                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마와 서버 메서드 계약                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 응답 디스패치 및 큐, ACP 제어 평면 런타임 계약                                                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 연결 코드, 메모리 doctor 명령                                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부 구조, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면, 세션 doctor CLI 계약                                             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청킹/런타임 헬퍼, 채널 응답 옵션, 전달 큐, 세션/스레드 바인딩 헬퍼                                            |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 발견, 제공자 런타임 등록, 제공자 기본값/카탈로그, 웹/검색/가져오기/임베딩 레지스트리                                      |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 영속성, Gateway 제어 흐름, 작업 제어 평면 런타임 계약                                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성, 미디어 생성 런타임 계약                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면, Plugin SDK 진입점 계약                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스와 Plugin 패키지 계약 헬퍼                                                                                                       |

품질은 보안과 분리되어 있으므로, 품질 발견 사항은 보안 신호를 흐리지 않고 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정된 뒤에만 범위 지정 또는 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### 문서 에이전트

`Docs Agent` 워크플로는 최근 병합된 변경 사항과 기존 문서를 맞춰 유지하기 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수한 일정은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수도 있습니다. 워크플로 실행 호출은 `main`이 이미 진행되었거나 지난 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간 단위 실행 하나가 마지막 문서 점검 이후 누적된 모든 main 변경 사항을 처리할 수 있습니다.

### 테스트 성능 에이전트

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수한 일정은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터 대신 작은 커버리지 보존 테스트 성능 수정만 만들게 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 그룹화 보고서는 Linux와 macOS의 구성별 경과 시간과 최대 RSS를 기록하므로, 전/후 비교에서 지속 시간 델타와 함께 테스트 메모리 델타가 드러납니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서는 무엇이든 커밋되기 전에 통과해야 합니다. 봇 push가 반영되기 전에 `main`이 진행되면, 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex 액션이 문서 에이전트와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 병합 후 중복 정리를 위한 수동 유지 관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에, 병합된 PR이 병합되었는지와 각 중복이 공유 참조 이슈 또는 겹치는 변경 헝크를 가지고 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트와 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 검사 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 프로덕션 및 핵심 테스트 타입 검사와 핵심 린트/가드를 실행합니다.
- 핵심 테스트 전용 변경은 핵심 테스트 타입 검사와 핵심 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입 검사와 확장 린트를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입 검사와 확장 린트만 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 해당 핵심 계약에 의존하므로 확장 타입 검사까지 확장됩니다. Vitest 확장 스윕은 명시적 테스트 작업으로 유지됩니다.
- 릴리스 메타데이터 전용 버전 범프는 대상 지정 버전/구성/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/구성 변경은 안전하게 모든 검사 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 다음 형제 테스트와 import 그래프 의존 항목을 실행합니다. 공유 그룹 룸 전달 구성은 명시적 매핑 중 하나입니다. 그룹에 표시되는 응답 구성, 소스 응답 전달 모드, 메시지 도구 시스템 프롬프트 변경은 핵심 응답 테스트와 Discord 및 Slack 전달 회귀를 거치므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하네스 전체에 걸쳐 있어 저렴한 매핑 집합을 신뢰할 수 있는 대리 지표로 볼 수 없을 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Crabbox는 메인테이너 Linux 증명을 위한 리포지토리 소유 원격 박스 래퍼입니다. 검사가 로컬 편집 루프에 비해 너무 넓거나, CI 동등성이 중요하거나, 증명에 시크릿, Docker, 패키지 레인, 재사용 가능한 박스 또는 원격 로그가 필요할 때 리포지토리 루트에서 사용하세요. 일반 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제 또는 명시적인 소유 용량 테스트를 위한 대체 경로입니다.

Crabbox 기반 Blacksmith 실행은 일회성 Testbox를 예열, 클레임, 동기화, 실행, 보고, 정리합니다. 내장 동기화 정상성 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라지거나 `git status --short`가 추적 중인 삭제를 200개 이상 표시하면 빠르게 실패합니다. 의도적인 대량 삭제 PR의 경우 원격 명령에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

Crabbox는 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 해당 가드를 비활성화하려면 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`을 설정하고, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

첫 실행 전에 리포지토리 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

리포지토리 래퍼는 `blacksmith-testbox`를 광고하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 provider를 명시적으로 전달하세요. Codex 워크트리 또는 연결된/스파스 체크아웃에서는 pnpm이 Crabbox 시작 전에 의존성을 조정할 수 있으므로 로컬 `pnpm crabbox:run` 스크립트를 피하고, 대신 node 래퍼를 직접 호출하세요.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 기반 실행에는 Crabbox 0.22.0 이상이 필요하며, 그래야 래퍼가 현재 Testbox 동기화, 큐, 정리 동작을 얻습니다. 형제 체크아웃을 사용할 때는 타이밍 또는 증명 작업 전에 무시된 로컬 바이너리를 다시 빌드하세요.

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

변경 게이트:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

집중 테스트 재실행:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

전체 스위트:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 위임된 Blacksmith Testbox 실행의 경우 Crabbox 래퍼 종료 코드와 JSON 요약이 명령 결과입니다. 연결된 GitHub Actions 실행은 hydration과 keepalive를 소유합니다. SSH 명령이 이미 반환된 뒤 Testbox가 외부에서 중지되면 `cancelled`로 끝날 수 있습니다. 래퍼 `exitCode`가 0이 아니거나 명령 출력에 실패한 테스트가 표시되지 않는 한 이를 정리/상태 아티팩트로 취급하세요. 일회성 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불명확하면 라이브 박스를 검사하고 직접 만든 박스만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일한 hydration된 박스에서 여러 명령이 의도적으로 필요할 때만 재사용을 사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox가 깨진 계층이지만 Blacksmith 자체는 작동한다면 `list`, `status`, 정리 같은 진단에만 직접 Blacksmith를 사용하세요. 직접 Blacksmith 실행을 메인테이너 증명으로 취급하기 전에 Crabbox 경로를 수정하세요.

`blacksmith testbox list --all`과 `blacksmith testbox status`는 작동하지만 새 예열이 몇 분 뒤에도 IP 또는 Actions 실행 URL 없이 `queued`에 머무르면 Blacksmith provider, 큐, 청구 또는 조직 제한 압력으로 취급하세요. 직접 만든 queued id를 중지하고, 더 많은 Testbox를 시작하지 말고, 누군가 Blacksmith 대시보드, 청구, 조직 제한을 확인하는 동안 아래의 소유 Crabbox 용량 경로로 증명을 옮기세요.

Blacksmith가 다운되었거나, 할당량 제한이 있거나, 필요한 환경이 없거나, 소유 용량이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압력이 있는 상황에서는 작업에 정말 48xlarge급 CPU가 필요하지 않은 한 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며, 리전 EC2 Spot 또는 On-Demand Standard 할당량을 가장 쉽게 건드립니다. 리포지토리 소유 `.crabbox.yaml`은 기본값을 `standard`, 여러 용량 리전, `capacity.hints: true`로 설정하므로 중개된 AWS lease는 선택된 리전/마켓, 할당량 압력, Spot 대체, 고압력 클래스 경고를 출력합니다. 더 무거운 광범위 검사에는 `fast`를 사용하고, standard/fast가 충분하지 않을 때만 `large`를 사용하며, `beast`는 전체 스위트 또는 전체 Plugin Docker 매트릭스, 명시적인 릴리스/차단자 검증, 고코어 성능 프로파일링 같은 예외적인 CPU 바운드 레인에만 사용하세요. `pnpm check:changed`, 집중 테스트, docs 전용 작업, 일반 lint/typecheck, 작은 E2E 재현 또는 Blacksmith 장애 triage에는 `beast`를 사용하지 마세요. 용량 진단에는 `--market on-demand`를 사용해 Spot 마켓 변동이 신호에 섞이지 않게 하세요.

`.crabbox.yaml`은 소유 클라우드 레인의 provider, 동기화, GitHub Actions hydration 기본값을 소유합니다. hydration된 Actions 체크아웃이 메인테이너 로컬 원격과 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하도록 로컬 `.git`을 제외하고, 절대 전송되면 안 되는 로컬 런타임/빌드 아티팩트도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 체크아웃, Node/pnpm 설정, `origin/main` fetch, 비시크릿 환경 handoff를 소유합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
