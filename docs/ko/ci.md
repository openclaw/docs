---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 파악해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 우산 작업 및 로컬 명령 동등 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-07-04T06:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 표준
`main` push는 먼저 90초 hosted-runner 승인 창을 통과합니다.
기존 `CI` concurrency group은 더 새
commit이 들어오면 대기 중인 해당 실행을 취소하므로, 연속 merge가 각각 전체 Blacksmith
matrix를 등록하지 않습니다. Pull request와 수동 dispatch는 대기를 건너뜁니다. 그런 다음 `preflight` job이
diff를 분류하고 관련 없는
영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트
범위 지정을 우회하고 release candidate와 광범위한
검증을 위해 전체 graph를 펼칩니다. Android lane은 `include_android`를 통해 opt-in으로 유지됩니다. Release 전용
Plugin 커버리지는 별도 [`Plugin Prerelease`](#plugin-prerelease)
workflow에 있으며 [`Full Release Validation`](#full-release-validation)
또는 명시적 수동 dispatch에서만 실행됩니다.

## Pipeline 개요

| Job                                | 목적                                                                                                   | 실행 시점                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 변경, 변경된 scope, 변경된 extension을 감지하고 CI manifest를 빌드                   | draft가 아닌 push와 PR에서 항상                  |
| `runner-admission`                 | Blacksmith 작업이 등록되기 전 표준 `main` push를 위한 hosted 90초 debounce                | 모든 CI 실행; 표준 `main` push에서만 sleep |
| `security-fast`                    | private key 감지, `zizmor`를 통한 변경 workflow audit, production lockfile audit                 | draft가 아닌 push와 PR에서 항상                  |
| `check-dependencies`               | production Knip dependency-only pass와 unused-file allowlist guard                                 | Node 관련 변경                               |
| `build-artifacts`                  | `dist/`, Control UI, 빌드된 CLI smoke check, embedded built-artifact check, 재사용 가능한 artifact 빌드 | Node 관련 변경                               |
| `checks-fast-core`                 | bundled, protocol, QA Smoke CI, CI-routing check 같은 빠른 Linux correctness lane                | Node 관련 변경                               |
| `checks-fast-contracts-plugins-*`  | sharding된 Plugin contract check 2개                                                                        | Node 관련 변경                               |
| `checks-fast-contracts-channels-*` | sharding된 channel contract check 2개                                                                       | Node 관련 변경                               |
| `checks-node-core-*`               | channel, bundled, contract, extension lane을 제외한 core Node test shard                          | Node 관련 변경                               |
| `check-*`                          | sharding된 main local gate equivalent: prod type, lint, guard, test type, strict smoke                | Node 관련 변경                               |
| `check-additional-*`               | architecture, sharding된 boundary/prompt drift, extension guard, package boundary, runtime topology     | Node 관련 변경                               |
| `checks-node-compat-node22`        | Node 22 compatibility build와 smoke lane                                                                | release를 위한 수동 CI dispatch                     |
| `check-docs`                       | Docs formatting, lint, broken-link check                                                             | Docs 변경                                        |
| `skills-python`                    | Python 기반 Skills를 위한 Ruff + pytest                                                                    | Python-skill 관련 변경                       |
| `checks-windows`                   | Windows 전용 process/path test와 shared runtime import specifier regression                      | Windows 관련 변경                            |
| `macos-node`                       | shared built artifact를 사용하는 macOS TypeScript test lane                                               | macOS 관련 변경                              |
| `macos-swift`                      | macOS app을 위한 Swift lint, build, test                                                            | macOS 관련 변경                              |
| `ios-build`                        | Xcode project 생성과 iOS app simulator build                                                 | iOS app, shared app kit, 또는 Swabble 변경         |
| `android`                          | 두 flavor에 대한 Android unit test와 debug APK build 1개                                              | Android 관련 변경                            |
| `test-performance-agent`           | 신뢰된 활동 이후 일일 Codex slow-test optimization                                                 | Main CI 성공 또는 수동 dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, GPT 5.5 live lane을 포함한 일일/온디맨드 Kova runtime performance report | schedule 및 수동 dispatch                       |

## Fail-fast 순서

1. `runner-admission`은 표준 `main` push에서만 기다립니다. 더 새 push가 있으면 Blacksmith 등록 전에 실행이 취소됩니다.
2. `preflight`는 어떤 lane이 존재할지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 이 job 내부 step이며, 독립 job이 아닙니다.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix job을 기다리지 않고 빠르게 실패합니다.
4. `build-artifacts`는 fast Linux lane과 겹쳐 실행되어 downstream consumer가 shared build가 준비되는 즉시 시작할 수 있게 합니다.
5. 이후 더 무거운 platform 및 runtime lane이 펼쳐집니다: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, `android`.

같은 PR 또는 `main` ref에 더 새 push가 들어오면 GitHub가 대체된 job을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI noise로 간주하세요. Matrix job은 `fail-fast: false`를 사용하며, `build-artifacts`는 작은 verifier job을 queue하는 대신 embedded channel, core-support-boundary, gateway-watch failure를 직접 보고합니다. 자동 CI concurrency key는 versioned(`CI-v7-*`)되어 있어 오래된 queue group의 GitHub-side zombie가 더 새 main 실행을 무기한 막을 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

GitHub Actions의 wall time, queue time, 가장 느린 job, failure, `pnpm-store-warmup` fanout barrier를 요약하려면 `pnpm ci:timings`, `pnpm ci:timings:recent` 또는 `node scripts/ci-run-timings.mjs <run-id>`를 사용하세요. CI는 같은 run summary도 `ci-timings-summary` artifact로 업로드합니다. Build timing은 `build-artifacts` job의 `Build dist` step을 확인하세요. `pnpm build:ci-artifacts`는 `[build-all] phase timings:`를 출력하고 `ui:build`를 포함합니다. 해당 job은 `startup-memory` artifact도 업로드합니다.

Pull request 실행의 경우 terminal timing-summary job은 `GH_TOKEN`을 `gh run view`에 전달하기 전에 신뢰된 base revision의 helper를 실행합니다. 이렇게 하면 token이 있는 query를 branch-controlled code 밖에 두면서도 pull request의 현재 CI 실행을 요약할 수 있습니다.

## PR context와 evidence

External contributor PR은
`.github/workflows/real-behavior-proof.yml`에서 PR context 및 evidence gate를 실행합니다. Workflow는 신뢰된
base commit을 checkout하고 PR body만 평가합니다. Contributor branch의 code는 실행하지 않습니다.

이 gate는 repository owner, member,
collaborator 또는 bot이 아닌 PR author에게 적용됩니다. PR body에 작성자가 쓴
`What Problem This Solves` 및 `Evidence` section이 있으면 통과합니다. Evidence는 focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log 또는 artifact link일 수 있습니다. Body는 intent와 유용한 validation을 제공합니다.
Reviewer는 correctness를 평가하기 위해 code, test, CI를 검사합니다.

Check가 실패하면 다른 code commit을 push하는 대신 PR body를 업데이트하세요.

## Scope와 routing

Scope logic은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit test로 커버됩니다. 수동 dispatch는 changed-scope detection을 건너뛰고 모든 scoped area가 변경된 것처럼 preflight manifest가 동작하게 합니다.

- **CI workflow edit**는 Node CI graph와 workflow linting을 검증하지만, 그 자체로 Windows, iOS, Android 또는 macOS native build를 강제하지 않습니다. 해당 platform lane은 platform source 변경으로 범위가 지정된 상태를 유지합니다.
- **Workflow Sanity**는 `actionlint`, 모든 workflow YAML file에 대한 `zizmor`, composite-action interpolation guard, conflict-marker guard를 실행합니다. PR-scoped `security-fast` job도 변경된 workflow file에 대해 `zizmor`를 실행하여 workflow security finding이 main CI graph에서 일찍 실패하도록 합니다.
- **`main` push의 Docs**는 CI에서 사용하는 것과 같은 ClawHub docs mirror를 사용하는 standalone `Docs` workflow로 검사되므로, code+docs가 섞인 push가 CI `check-docs` shard도 queue하지 않습니다. Pull request와 수동 CI는 docs가 변경된 경우 여전히 CI에서 `check-docs`를 실행합니다.
- **TUI PTY**는 TUI 변경에 대해 `checks-node-core-runtime-tui-pty` Linux Node shard에서 실행됩니다. 이 shard는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`로 `test/vitest/vitest.tui-pty.config.ts`를 실행하므로, deterministic `TuiBackend` fixture lane과 external model endpoint만 mock하는 더 느린 `tui --local` smoke를 모두 커버합니다.
- **CI routing-only edit, 선택된 저비용 core-test fixture edit, 좁은 Plugin contract helper/test-routing edit**는 빠른 Node-only manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 변경이 fast task가 직접 exercise하는 routing 또는 helper surface로 제한된 경우, 이 path는 build artifact, Node 22 compatibility, channel contract, full core shard, bundled-plugin shard, additional guard matrix를 건너뜁니다.
- **Windows Node check**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI workflow surface로 범위가 지정됩니다. 관련 없는 source, Plugin, install-smoke, test-only 변경은 Linux Node lane에 유지됩니다.

가장 느린 Node 테스트 계열은 각 작업이 러너를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정되어 있습니다. Plugin 계약과 채널 계약은 각각 표준 GitHub 러너 폴백이 있는 두 개의 가중치 기반 Blacksmith 지원 샤드로 실행되고, core unit fast/support 레인은 별도로 실행되며, core runtime infra는 state, process/config, shared, 세 개의 cron 도메인 샤드로 분할됩니다. auto-reply는 균형 조정된 워커로 실행되고(reply 하위 트리는 agent-runner, dispatch, commands/state-routing 샤드로 분할), agentic gateway/server 구성은 빌드된 산출물을 기다리는 대신 chat/auth/model/http-plugin/runtime/startup 레인으로 분할됩니다. 그런 다음 일반 CI는 격리된 infra include-pattern 샤드만 최대 64개 테스트 파일의 결정적 번들로 묶어, 격리되지 않은 command/cron, 상태를 가진 agents-core, gateway/server 스위트를 병합하지 않으면서 Node 매트릭스를 줄입니다. 무거운 고정 스위트는 8 vCPU에 남고, 번들된 레인과 더 낮은 가중치 레인은 4 vCPU를 사용합니다. 정식 저장소의 pull request는 추가적인 압축 승인 계획을 사용합니다. 동일한 구성별 그룹이 현재 34개 작업 Linux Node 계획 안에서 격리된 하위 프로세스로 실행되므로, 단일 PR이 전체 70개 이상 작업의 Node 매트릭스를 등록하지 않습니다. `main` push, 수동 dispatch, release gate는 전체 매트릭스를 유지합니다. 광범위한 브라우저, QA, 미디어, 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest 구성을 사용합니다. include-pattern 샤드는 CI 샤드 이름을 사용해 타이밍 항목을 기록하므로, `.artifacts/vitest-shard-timings.json`은 전체 구성과 필터링된 샤드를 구분할 수 있습니다. `check-additional-*`는 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard 목록은 prompt가 많은 샤드 하나와 나머지 guard stripe를 위한 결합 샤드 하나로 스트라이프되며, 각 샤드는 선택된 독립 guard를 동시에 실행하고 검사별 타이밍을 출력합니다. 비용이 큰 Codex happy-path prompt snapshot drift 검사는 수동 CI와 prompt에 영향을 주는 변경에 대해서만 자체 추가 작업으로 실행되므로, 관련 없는 일반 Node 변경은 차가운 prompt snapshot 생성 뒤에서 기다리지 않으며 boundary 샤드는 균형을 유지하고 prompt drift는 여전히 이를 유발한 PR에 고정됩니다. 동일한 플래그는 built-artifact core support-boundary 샤드 안에서 prompt snapshot Vitest 생성도 건너뜁니다. Gateway watch, 채널 테스트, core support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

승인된 뒤에는 정식 Linux CI가 최대 24개의 동시 Node 테스트 작업과
더 작은 fast/check 레인에 대해 12개를 허용합니다. Windows와 Android는
해당 러너 풀이 더 좁기 때문에 2개로 유지됩니다.

압축 PR 계획은 현재 스위트에 대해 18개의 Node 작업을 내보냅니다. 전체 구성
그룹은 120분 배치 제한 시간의 격리된 하위 프로세스에서 배치되고,
include-pattern 그룹은 동일한 제한된 작업 예산을 공유합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도 source set이나 manifest가 없습니다. 이 unit-test 레인은 여전히 SMS/call-log BuildConfig 플래그로 flavor를 컴파일하면서, Android 관련 push마다 중복 debug APK packaging 작업을 피합니다.

`check-dependencies` 샤드는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정되고 `dlx` 설치에 대해 pnpm의 최소 릴리스 경과 기간이 비활성화된 production Knip dependency-only pass)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 unused file을 추가하거나 오래된 allowlist 항목을 남길 때 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge 표면은 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw 저장소 활동을 ClawSweeper로 보내는 대상 측 브리지입니다. 신뢰할 수 없는 pull request 코드를 checkout하거나 실행하지 않습니다. 이 워크플로는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음, 압축된 `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

워크플로에는 네 개의 레인이 있습니다.

- 정확한 issue 및 pull request review 요청을 위한 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper 명령을 위한 `clawsweeper_comment`;
- `main` push의 commit-level review 요청을 위한 `clawsweeper_commit_review`;
- ClawSweeper agent가 검사할 수 있는 일반 GitHub 활동을 위한 `github_activity`.

`github_activity` 레인은 정규화된 metadata만 전달합니다. event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때의 짧은 excerpt입니다. 의도적으로 전체 webhook body는 전달하지 않습니다. `openclaw/clawsweeper`의 수신 워크플로는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 게시합니다.

일반 활동은 관찰이며, 기본 전달이 아닙니다. ClawSweeper agent는 prompt에서 Discord 대상을 받고, event가 예상 밖이거나, 조치 가능하거나, 위험하거나, 운영상 유용할 때만 `#clawsweeper`에 게시해야 합니다. 일상적인 open, edit, bot churn, 중복 webhook noise, 일반 review traffic은 `NO_REPLY`가 되어야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message를 신뢰할 수 없는 데이터로 취급하세요. 이들은 요약과 triage의 입력이지, workflow나 agent runtime에 대한 지침이 아닙니다.

## 수동 dispatch

수동 CI dispatch는 일반 CI와 동일한 작업 그래프를 실행하지만 모든 비 Android scoped 레인을 강제로 켭니다. Linux Node 샤드, bundled-plugin 샤드, Plugin 및 channel contract 샤드, Node 22 호환성, `check-*`, `check-additional-*`, built-artifact smoke check, docs check, Python Skills, Windows, macOS, iOS build, Control UI i18n입니다. 독립 실행형 수동 CI dispatch는 `include_android=true`일 때 Android만 실행합니다. 전체 release umbrella는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin prerelease static check, release 전용 `agentic-plugins` 샤드, 전체 extension batch sweep, Plugin prerelease Docker 레인은 CI에서 제외됩니다. Docker prerelease 스위트는 `Full Release Validation`이 release-validation gate를 활성화하여 별도의 `Plugin Prerelease` workflow를 dispatch할 때만 실행됩니다.

수동 실행은 고유한 concurrency group을 사용하므로 release-candidate full suite가 같은 ref의 다른 push나 PR 실행에 의해 취소되지 않습니다. 선택적 `target_ref` 입력은 신뢰된 호출자가 선택된 dispatch ref의 workflow file을 사용하면서 branch, tag, full commit SHA를 대상으로 해당 그래프를 실행할 수 있게 합니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 수동 CI dispatch 및 비정식 저장소 폴백, CodeQL JavaScript/actions 품질 스캔, workflow-sanity, labeler, auto-response, CI 외부 docs workflow, 그리고 Blacksmith 매트릭스가 더 일찍 queue될 수 있도록 하는 install-smoke preflight                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, 더 낮은 가중치의 extension 샤드, QA Smoke CI를 제외한 `checks-fast-core`, Plugin/channel contract 샤드, 대부분의 bundled/더 낮은 가중치 Linux Node 샤드, `check-guards`, `check-prod-types`, `check-test-types`, 선택된 `check-additional-*` 샤드, `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 유지된 무거운 Linux Node 스위트, boundary/extension이 무거운 `check-additional-*` 샤드, `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI 및 Testbox의 `build-artifacts`, `check-lint`(8 vCPU가 절약한 것보다 더 많은 비용이 들 만큼 CPU에 민감함); install-smoke Docker build(32-vCPU queue time이 절약한 것보다 더 많은 비용이 듦)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw`의 `macos-node`; fork는 `macos-15`로 폴백                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw`의 `macos-swift` 및 `ios-build`; fork는 `macos-26`으로 폴백                                                                                                                                                                                                                     |

## 러너 등록 예산

OpenClaw의 현재 GitHub runner-registration bucket은 `ghx api rate_limit`에서
5분당 10,000개의 self-hosted runner registration을 보고합니다. GitHub가 이 bucket을
변경할 수 있으므로 각 튜닝 pass 전에 `actions_runner_registration`을 다시 확인하세요.
이 제한은 `openclaw` 조직의 모든 Blacksmith runner registration이 공유하므로,
다른 Blacksmith installation을 추가해도 새 bucket이 추가되지는 않습니다.

burst control에서는 Blacksmith label을 희소 자원으로 취급하세요. route, notify, summarize, shard select, 짧은 CodeQL scan만 수행하는 작업은 측정된 Blacksmith별 필요가 없는 한 GitHub-hosted runner에 남아야 합니다. 새로운 Blacksmith matrix, 더 큰 `max-parallel`, 또는 높은 빈도의 workflow는 최악의 경우 registration count를 보여주고 org-level target을 live bucket의 약 60% 아래로 유지해야 합니다. 현재 10,000-registration bucket에서는 6,000-registration 운영 target을 의미하며, concurrent repository, retry, burst overlap을 위한 여유를 남깁니다.

정식 저장소 CI는 일반 push 및 pull-request 실행의 기본 runner path로 Blacksmith를 유지합니다. `workflow_dispatch`와 비정식 저장소 실행은 GitHub-hosted runner를 사용하지만, 일반 정식 실행은 현재 Blacksmith queue health를 probe하거나 Blacksmith를 사용할 수 없을 때 GitHub-hosted label로 자동 폴백하지 않습니다.

## 로컬 equivalent

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

## OpenClaw 성능

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. `main`에서 매일 실행되며 수동으로도 디스패치할 수 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 릴리스 태그나 현재 워크플로 구현이 있는 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 최신 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, 레인 인증 모드, 모델, 반복 횟수, 시나리오 필터를 기록합니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 다음, 세 가지 레인을 실행합니다.

- `mock-provider`: 결정적 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에 대한 Kova 진단 시나리오입니다.
- `mock-deep-profile`: 시작, gateway, agent-turn 핫스팟에 대한 CPU/힙/트레이스 프로파일링입니다.
- `live-openai-candidate`: 실제 OpenAI `openai/gpt-5.5` agent turn이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider 레인은 Kova 통과 후 OpenClaw 네이티브 소스 프로브도 실행합니다. 기본, hook, 50-plugin 시작 사례의 gateway 부팅 타이밍과 메모리, 번들 Plugin 가져오기 RSS, 반복 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 gateway에 대한 CLI 시작 명령, SQLite 상태 smoke 성능 프로브가 포함됩니다. 테스트된 ref에 대해 이전에 게시된 mock-provider 소스 보고서를 사용할 수 있으면, 소스 요약은 현재 RSS와 힙 값을 해당 기준선과 비교하고 큰 RSS 증가를 `watch`로 표시합니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 레인은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우, 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 기록됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 "릴리스 전에 모든 것을 실행"하기 위한 수동 상위 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 대상으로 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위해 `Plugin Prerelease`를 디스패치하며, 설치 smoke, 패키지 승인, 교차 OS 패키지 검사, QA 프로필 증거에서 maturity scorecard 렌더링, QA Lab parity, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. stable 및 full 프로필은 항상 포괄적인 live/E2E 및 Docker 릴리스 경로 soak 커버리지를 포함하며, beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다. 정식 패키지 Telegram E2E는 Package Acceptance 내부에서 실행되므로, 전체 후보는 중복 live poller를 시작하지 않습니다. 게시 후에는 `release_package_spec`을 전달하여 release checks, Package Acceptance, Docker, cross-OS, Telegram 전반에서 릴리스된 npm 패키지를 다시 빌드하지 않고 재사용하세요. 집중적인 게시 패키지 Telegram 재실행에만 `npm_telegram_package_spec`을 사용하세요. Codex Plugin live package 레인은 기본적으로 동일한 선택 상태를 사용합니다. 게시된 `release_package_spec=openclaw@<tag>`는 `codex_plugin_spec=npm:@openclaw/codex@<tag>`를 파생하며, SHA/아티팩트 실행은 선택된 ref에서 `extensions/codex`를 패킹합니다. `npm:`, `npm-pack:`, `git:` 사양 같은 사용자 지정 Plugin 소스에는 `codex_plugin_spec`을 명시적으로 설정하세요.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 워크플로입니다. 릴리스 태그가 존재하고 OpenClaw npm preflight가 성공한 후 `release/YYYY.M.PATCH` 또는 `main`에서 디스패치하세요. 이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해 `Plugin NPM Release`를 디스패치하며, 동일한 릴리스 SHA에 대해 `Plugin ClawHub Release`를 디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다. stable 게시에는 정확한 `windows_node_tag`도 필요합니다. 워크플로는 게시 하위 작업 전에 Windows 소스 릴리스를 검증하고 x64/ARM64 설치 프로그램을 후보 승인된 `windows_node_installer_digests` 입력과 비교한 다음, GitHub 릴리스 초안을 게시하기 전에 동일하게 고정된 설치 프로그램 다이제스트와 정확한 companion asset 및 checksum 계약을 승격하고 검증합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 브랜치에서 고정 커밋 증명이 필요하면 `gh workflow run ... --ref main -f ref=<sha>` 대신 helper를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다. helper는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고, 해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로 `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 상위 검증기도 하위 워크플로가 다른 SHA에서 실행되면 실패합니다.

`release_profile`은 release checks로 전달되는 live/provider 범위를 제어합니다. 수동 릴리스 워크플로의 기본값은 `stable`입니다. 광범위한 권고 provider/media 매트릭스를 의도적으로 원할 때만 `full`을 사용하세요. stable 및 full release checks는 항상 포괄적인 live/E2E와 Docker 릴리스 경로 soak를 실행하며, beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 필수 레인만 유지합니다.
- `stable`은 stable provider/backend 집합을 추가합니다.
- `full`은 광범위한 권고 provider/media 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 하위 실행 ID를 기록하고, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하며 각 하위 실행에 대한 가장 느린 작업 표를 추가합니다. 하위 워크플로를 재실행하여 성공하면, 상위 결과와 타이밍 요약을 새로 고치기 위해 parent verifier 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks` 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 full CI 하위 작업만에는 `ci`, Plugin prerelease 하위 작업만에는 `plugin-prerelease`, 모든 릴리스 하위 작업에는 `release-checks`를 사용하거나, 상위 워크플로에서는 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다. 실패한 cross-OS 레인 하나의 경우 `rerun_group=cross-os`를 `cross_os_suite_filter`와 결합하세요. 예: `windows/packaged-upgrade`. 긴 cross-OS 명령은 Heartbeat 줄을 출력하고 packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA release-check 레인은 권고 성격이지만, 표준 런타임 도구 커버리지 게이트는 예외이며, 필요한 OpenClaw dynamic tools가 표준 tier 요약에서 달라지거나 사라지면 차단합니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택된 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 cross-OS checks 및 Package Acceptance에 전달하고, soak 커버리지가 실행될 때 live/E2E 릴리스 경로 Docker 워크플로에도 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고, 여러 하위 작업에서 동일한 후보를 다시 패킹하는 일을 피할 수 있습니다. Codex npm-plugin live 레인의 경우 release checks는 `release_package_spec`에서 파생된 일치하는 게시 Plugin 사양을 전달하거나, 운영자가 제공한 `codex_plugin_spec`을 전달하거나, 입력을 비워 Docker 스크립트가 선택된 체크아웃의 Codex Plugin을 패킹하게 합니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은 더 오래된 상위 워크플로를 대체합니다. parent monitor는 parent가 취소될 때 이미 디스패치한 모든 하위 워크플로를 취소하므로, 더 새로운 main 검증이 오래된 2시간 release-check 실행 뒤에서 대기하지 않습니다. release branch/tag 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## Live 및 E2E shard

릴리스 live/E2E 하위 작업은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름이 지정된 shard로 실행합니다.

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
- 분할 media audio/video shard 및 provider-filtered music shard

이는 동일한 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있게 합니다. aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` shard 이름은 수동 일회성 재실행에 계속 유효합니다.

네이티브 live media shard는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. media 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live suite는 일반 Blacksmith runner에서 유지하세요. container job은 중첩 Docker 테스트를 시작하기에 적합한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택된 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 뒤, Docker 라이브 모델, 제공자별로 샤딩된 Gateway, CLI 백엔드, ACP 바인드, Codex 하네스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 워크플로 작업 타임아웃보다 낮은 명시적 스크립트 수준 `timeout` 상한을 가져, 컨테이너나 정리 경로가 멈추면 전체 릴리스 검사 예산을 소비하지 않고 빠르게 실패합니다. 이 샤드들이 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드에 벽시계 시간을 낭비하게 됩니다.

## 패키지 승인

질문이 "설치 가능한 이 OpenClaw 패키지가 제품으로서 동작하는가?"일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하지만, 패키지 승인은 사용자가 설치 또는 업데이트 후 실행하는 것과 동일한 Docker E2E 하네스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰며, 둘 다 `package-under-test` 아티팩트로 업로드하고, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하며, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하고, 워크플로 체크아웃을 패킹하는 대신 해당 패키지를 대상으로 선택된 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 워크플로는 패키지와 공유 이미지를 한 번 준비한 뒤, 고유한 아티팩트를 가진 병렬 대상 Docker 작업으로 해당 레인들을 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. 이는 `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 패키지를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 승인 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest` 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 프리릴리스/안정 버전 승인을 위해 사용하세요.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 이력 또는 릴리스 태그에서 도달 가능한지 검증하며, 분리된 워크트리에 의존성을 설치하고, `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 공개 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다. 이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트명 또는 해석된 IP, 동일한 공개 안전 정책 밖으로 나가는 리디렉션을 거부합니다.
- `source=trusted-url`은 `.github/package-trusted-sources.json`의 이름 있는 신뢰 소스 정책에서 HTTPS `.tgz`를 다운로드합니다. `package_sha256` 및 `trusted_source_id`는 필수입니다. 구성된 호스트, 포트, 경로 접두사, 리디렉션 호스트 또는 사설 네트워크 해석이 필요한 유지관리자 소유 엔터프라이즈 미러나 비공개 패키지 저장소에만 사용하세요. 정책이 bearer 인증을 선언하면 워크플로는 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 시크릿을 사용합니다. URL에 포함된 자격 증명은 여전히 거부됩니다.
- `source=artifact`는 `artifact_run_id` 및 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해서 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이를 통해 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 더 오래된 신뢰 소스 커밋을 검증할 수 있습니다.

### 제품군 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package`와 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI를 포함한 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않도록 오프라인 Plugin 커버리지를 사용합니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm spec 경로는 독립 실행형 디스패치를 위해 유지됩니다.

로컬 명령, Docker 레인, Package Acceptance 입력, 릴리스 기본값, 실패 분류를 포함한 전용 업데이트 및 Plugin 테스트 정책은 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, `telegram_mode=mock-openai`로 Package Acceptance를 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 라이브 ClawHub Skills 설치, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명을 동일하게 해석된 패키지 tarball에서 유지합니다. 베타를 게시한 후 Full Release Validation 또는 OpenClaw Release Checks에서 `release_package_spec`을 설정하면 다시 빌드하지 않고도 출하된 npm 패키지를 대상으로 동일한 매트릭스를 실행합니다. Package Acceptance가 나머지 릴리스 검증과 다른 패키지를 필요로 할 때만 `package_acceptance_package_spec`을 설정하세요. 크로스 OS 릴리스 검사는 여전히 OS별 온보딩, 설치 관리자, 플랫폼 동작을 다룹니다. 패키지/업데이트 제품 검증은 Package Acceptance부터 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행당 게시된 패키지 기준선 하나를 검증합니다. Package Acceptance에서는 해석된 `package-under-test` tarball이 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`인 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정하여 최신 안정 npm 릴리스 네 개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 부트스트랩/persona 파일, 구성된 OpenClaw Plugin 설치, 물결표 로그 경로, 오래된 레거시 Plugin 의존성 루트에 대한 이슈 형태의 픽스처까지 확장합니다. 다중 기준선 published-upgrade survivor 선택은 기준선별로 별도의 대상 Docker 러너 작업으로 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리를 완전히 포괄하는 것일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 spec을 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스를 위해 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 구워진 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, 그리고 RPC 상태를 탐색합니다. Windows 패키지 및 설치 관리자 신규 레인도 설치된 패키지가 원시 절대 Windows 경로에서 browser-control override를 가져올 수 있는지 확인합니다. OpenAI 크로스 OS 에이전트 턴 smoke는 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.5`를 사용하므로, GPT-4.x 기본값을 피하면서 설치 및 Gateway 증명을 GPT-5 테스트 모델에 유지합니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git 픽스처에서 누락된 pnpm `patchedDependencies`를 제거할 수 있고, 누락된 지속 `update.channel`을 로그로 남길 수 있습니다.
- Plugin smoke는 레거시 설치 기록 위치를 읽거나 누락된 marketplace 설치 기록 지속성을 허용할 수 있습니다.
- `plugin-update`는 설치 기록 및 재설치 없음 동작이 변경되지 않아야 한다는 요구를 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지도 이미 출하된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 하며, 동일한 조건은 경고하거나 건너뛰는 대신 실패합니다.

### 예시

```bash
# 제품 수준 커버리지로 현재 beta 패키지를 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 현재 하네스로 릴리스 브랜치를 패킹하고 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# tarball URL을 검증합니다. source=url에는 SHA-256이 필수입니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 이름 있는 신뢰 비공개 미러 정책에서 tarball을 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 다른 Actions 실행에서 업로드한 tarball을 재사용합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

실패한 패키지 승인 실행을 디버깅할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 그 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령을 검사하세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 smoke

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/package 표면, 번들 Plugin package/manifest 변경, 또는 Docker smoke 작업이 실행하는 core plugin/channel/gateway/Plugin SDK 표면을 건드리는 pull request에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker worker를 예약하지 않습니다. 빠른 경로는 root Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, agents delete shared-workspace CLI smoke를 실행하고, container gateway-network e2e를 실행하고, 번들 extension build arg를 검증하며, 240초 aggregate command timeout 아래에서 제한된 bundled-plugin Docker profile을 실행합니다(각 시나리오의 Docker run은 별도로 제한됨).
- **전체 경로**는 nightly scheduled run, manual dispatch, workflow-call release check, 그리고 installer/package/Docker 표면을 실제로 건드리는 pull request에 대해 QR package install 및 installer Docker/update coverage를 유지합니다. full mode에서는 install-smoke가 하나의 target-SHA GHCR root Dockerfile smoke image를 준비하거나 재사용한 다음, QR package install, root Dockerfile/gateway smoke, installer/update smoke, fast bundled-plugin Docker E2E를 별도 작업으로 실행하여 installer 작업이 root image smoke 뒤에서 기다리지 않게 합니다.

`main` push(merge commit 포함)는 전체 경로를 강제하지 않습니다. changed-scope 로직이 push에서 full coverage를 요청하더라도 workflow는 fast Docker smoke를 유지하고 full install smoke는 nightly 또는 release validation에 맡깁니다.

느린 Bun global install image-provider smoke는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이는 nightly schedule 및 release checks workflow에서 실행되며, manual `Install Smoke` dispatch에서 선택적으로 활성화할 수 있지만 pull request와 `main` push에서는 실행되지 않습니다. 일반 PR CI는 Node 관련 변경에 대해 fast Bun launcher regression lane을 계속 실행합니다. QR 및 installer Docker test는 각자의 install-focused Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 하나의 공유 live-test image를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패키징하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- installer/update/plugin-dependency lane용 bare Node/Git runner;
- 일반 기능 lane용으로 같은 tarball을 `/app`에 설치하는 functional image.

Docker lane 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, planner 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, runner는 선택된 plan만 실행합니다. scheduler는 lane별로 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 및 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`를 사용해 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 lane을 실행합니다.

### 조정값

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 lane의 main-pool slot 수.                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot 수.                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | provider throttling을 방지하기 위한 동시 live lane 상한.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 동시 npm install lane 상한.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 multi-service lane 상한.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storm을 피하기 위한 lane 시작 간격. 간격을 없애려면 `0`으로 설정합니다. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | lane별 fallback timeout(120분). 선택된 live/tail lane은 더 엄격한 상한을 사용합니다.          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`이면 lane을 실행하지 않고 scheduler plan을 출력합니다.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 lane 목록. agent가 실패한 lane 하나를 재현할 수 있도록 cleanup smoke를 건너뜁니다. |

유효 상한보다 무거운 lane도 빈 pool에서는 시작할 수 있으며, 이후 capacity를 해제할 때까지 단독으로 실행됩니다. 로컬 aggregate는 Docker를 preflight하고, 오래된 OpenClaw E2E container를 제거하고, active-lane status를 내보내고, longest-first ordering을 위해 lane timing을 저장하며, 기본적으로 첫 실패 이후에는 새 pooled lane scheduling을 중지합니다.

### 재사용 가능한 live/E2E workflow

재사용 가능한 live/E2E workflow는 `scripts/test-docker-all.mjs --plan-json`에 필요한 package, image kind, live image, lane, credential coverage를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 plan을 GitHub output 및 summary로 변환합니다. 이는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패키징하거나, current-run package artifact를 다운로드하거나, `package_artifact_run_id`에서 package artifact를 다운로드합니다. 또한 tarball inventory를 검증하고, package-installed lane이 필요할 때 Blacksmith의 Docker layer cache를 통해 package-digest-tagged bare/functional GHCR Docker E2E image를 빌드 및 push하며, 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` input이나 기존 package-digest image를 재빌드하지 않고 재사용합니다. Docker image pull은 시도별 180초 timeout을 두고 재시도되어, registry/cache stream이 멈춰도 CI critical path 대부분을 소비하지 않고 빠르게 재시도합니다.

### Release-path chunk

Release Docker coverage는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 chunked job을 실행하여, 각 chunk가 필요한 image kind만 pull하고 같은 weighted scheduler를 통해 여러 lane을 실행하게 합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 release Docker chunk는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `package-update-openai`에는 live Codex plugin package lane이 포함되며, 이 lane은 candidate OpenClaw package를 설치하고, 명시적 Codex CLI install approval과 함께 `codex_plugin_spec` 또는 같은 ref tarball에서 Codex plugin을 설치하고, Codex CLI preflight를 실행한 다음, OpenAI에 대해 같은 session의 OpenClaw agent turn 여러 개를 실행합니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 aggregate plugin/runtime alias로 남습니다. `install-e2e` lane alias는 두 provider installer lane 모두를 위한 aggregate manual rerun alias로 남습니다.

full release-path coverage가 요청하면 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 dispatch에만 standalone `openwebui` chunk를 유지합니다. Bundled-channel update lane은 일시적인 npm network failure에 대해 한 번 재시도합니다.

각 chunk는 lane log, timing, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, slow-lane table, lane별 rerun command가 포함된 `.artifacts/docker-tests/`를 업로드합니다. workflow `docker_lanes` input은 chunk job 대신 준비된 image에 대해 선택된 lane을 실행하므로, failed-lane debugging을 하나의 targeted Docker job으로 제한하고 해당 run을 위한 package artifact를 준비, 다운로드 또는 재사용합니다. 선택된 lane이 live Docker lane이면 targeted job은 해당 rerun을 위해 live-test image를 로컬에서 빌드합니다. 생성된 lane별 GitHub rerun command에는 값이 존재할 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 image input이 포함되므로, 실패한 lane이 실패한 run의 정확한 package와 image를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact를 다운로드하고 combined/per-lane targeted rerun command를 출력합니다
pnpm test:docker:timings <summary>   # slow-lane 및 phase critical-path summary
```

scheduled live/E2E workflow는 전체 release-path Docker suite를 매일 실행합니다.

## Plugin Prerelease

`Plugin Prerelease`는 더 비싼 product/package coverage이므로, `Full Release Validation` 또는 명시적 operator가 dispatch하는 별도 workflow입니다. 일반 pull request, `main` push, standalone manual CI dispatch에서는 해당 suite를 끕니다. 이는 번들 Plugin test를 8개의 extension worker에 균등 배분합니다. 이러한 extension shard job은 import가 많은 Plugin batch가 추가 CI job을 만들지 않도록, group당 하나의 Vitest worker와 더 큰 Node heap으로 최대 두 개의 Plugin config group을 동시에 실행합니다. release-only Docker prerelease path는 1~3분짜리 job에 수십 개의 runner를 예약하지 않도록 targeted Docker lane을 작은 group으로 batch 처리합니다. workflow는 `@openclaw/plugin-inspector`에서 informational `plugin-inspector-advisory` artifact도 업로드합니다. inspector finding은 triage input이며 blocking Plugin Prerelease gate를 변경하지 않습니다.

## QA Lab

QA Lab에는 main smart-scoped workflow 외부에 전용 CI lane이 있습니다. Agentic parity는 standalone PR workflow가 아니라 광범위한 QA 및 release harness 아래에 중첩됩니다. parity가 broad validation run과 함께 실행되어야 할 때는 `rerun_group=qa-parity`로 `Full Release Validation`을 사용합니다.

- `QA-Lab - All Lanes` workflow는 nightly로 `main`에서 그리고 manual dispatch에서 실행됩니다. 이 workflow는 mock parity lane, live Matrix lane, live Telegram 및 Discord lane을 parallel job으로 fan out합니다. Live job은 `qa-live-shared` environment를 사용하고, Telegram/Discord는 Convex lease를 사용합니다.

Release check는 deterministic mock provider 및 mock-qualified model(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix와 Telegram live transport lane을 실행하므로, channel contract가 live model latency 및 일반 provider-plugin startup에서 격리됩니다. live transport gateway는 QA parity가 memory behavior를 별도로 다루기 때문에 memory search를 비활성화합니다. provider connectivity는 별도의 live model, native provider, Docker provider suite에서 다룹니다.

Matrix는 scheduled 및 release gate에 `--profile fast`를 사용하며, checkout된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI default 및 manual workflow input은 `all`로 유지됩니다. manual `matrix_profile=all` dispatch는 항상 full Matrix coverage를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` job으로 shard합니다.

`OpenClaw Release Checks`도 release approval 전에 release-critical QA Lab lane을 실행합니다. QA parity gate는 candidate 및 baseline pack을 parallel lane job으로 실행한 다음, final parity comparison을 위해 작은 report job으로 두 artifact를 모두 다운로드합니다.

일반 PR의 경우 parity를 required status로 취급하지 말고 scoped CI/check evidence를 따릅니다.

## CodeQL

`CodeQL` workflow는 전체 repository sweep이 아니라 의도적으로 좁은 first-pass security scanner입니다. Daily, manual, non-draft pull request guard run은 Actions workflow code와 가장 위험도가 높은 JavaScript/TypeScript 표면을 high/critical `security-severity`로 필터링된 high-confidence security query로 scan합니다.

pull request guard는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, 또는 process-owning bundled plugin runtime path 아래 변경에 대해서만 시작하며, scheduled workflow와 동일한 high-confidence security matrix를 실행합니다. Android 및 macOS CodeQL은 PR default에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron, Gateway 기준선                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, secrets, 감사 접점                                                    |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, web-fetch, Plugin SDK SSRF 정책 표면                                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                            |
| `/codeql-security-high/process-exec-boundary`     | 로컬 셸, 프로세스 spawn 헬퍼, 서브프로세스를 소유하는 번들 Plugin 런타임, 워크플로 스크립트 접착 코드                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩, Plugin SDK 패키지 계약 신뢰 표면                           |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 정상성 검사가 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. 깨끗한 상태에서도 macOS 빌드가 런타임을 지배하므로 일일 기본값 밖에 둡니다.

### 중요 품질 범주

`CodeQL Critical Quality`는 대응되는 비보안 샤드입니다. 품질 스캔이 Blacksmith 러너 등록 예산을 쓰지 않도록 GitHub 호스팅 Linux 러너에서 좁고 가치가 높은 표면에 대해 오류 심각도의 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 이 풀 리퀘스트 가드는 예약 프로필보다 의도적으로 더 작습니다. 드래프트가 아닌 PR은 에이전트 command/model/tool 실행 및 reply dispatch 코드, config schema/migration/IO 코드, auth/secrets/sandbox/security 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/server-method, memory runtime/SDK 접착 코드, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract, 또는 Plugin SDK reply runtime 변경에 대해 대응되는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL config 및 quality 워크플로 변경은 열두 개 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 독립적으로 실행하기 위한 학습/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron, Gateway 보안 경계 코드                                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization, IO 계약                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, model/provider dispatch, auto-reply dispatch 및 queue, ACP control-plane 런타임 계약                                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버 및 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facade, memory Plugin SDK alias, memory runtime 활성화 접착 코드, memory doctor 명령                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue 내부, session delivery queue, outbound session binding/delivery 헬퍼, diagnostic event/log bundle 표면, session doctor CLI 계약                        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime 헬퍼, channel reply option, delivery queue, session/thread binding 헬퍼                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth 및 discovery, provider runtime registration, provider defaults/catalogs, web/search/fetch/embedding registry             |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, Gateway control flow, task control-plane 런타임 계약                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 web fetch/search, media IO, media understanding, image-generation, media-generation 런타임 계약                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface, Plugin SDK entrypoint 계약                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                                       |

품질은 보안과 분리되어 유지되므로, 보안 신호를 흐리지 않고 품질 발견 사항을 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정된 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 병합된 변경 사항과 기존 문서를 맞춰 유지하기 위한 이벤트 기반 Codex 유지관리 레인입니다. 순수한 스케줄은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있고, 수동 디스패치로 직접 실행할 수도 있습니다. Workflow-run 호출은 `main`이 이미 आगे 이동했거나 마지막 1시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번 실행으로 마지막 docs pass 이후 누적된 모든 main 변경 사항을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지관리 레인입니다. 순수한 스케줄은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 일자에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 보존하는 작은 테스트 성능 수정만 하도록 한 뒤, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경 사항을 거부합니다. 그룹화된 보고서는 Linux와 macOS에서 config별 wall time과 최대 RSS를 기록하므로, 전후 비교에서 지속 시간 delta 옆에 테스트 메모리 delta가 드러납니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서가 통과해야만 어떤 것도 커밋됩니다. 봇 push가 반영되기 전에 `main`이 전진하면 레인은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. GitHub 호스팅 Ubuntu를 사용하므로 Codex action은 docs agent와 동일한 drop-sudo 안전 태세를 유지할 수 있습니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 병합 후 중복 정리를 위한 수동 유지관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에 병합된 PR이 병합되었고 각 중복 항목에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 라우팅

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 검사 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다.

- core production 변경은 core prod 및 core test typecheck와 core lint/guard를 실행합니다.
- core test-only 변경은 core test typecheck와 core lint만 실행합니다.
- extension production 변경은 extension prod 및 extension test typecheck와 extension lint를 실행합니다.
- extension test-only 변경은 extension test typecheck와 extension lint를 실행합니다.
- 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 해당 core 계약에 의존하므로 extension typecheck로 확장됩니다(Vitest extension sweep은 명시적 테스트 작업으로 유지됩니다).
- release metadata-only 버전 bump는 대상이 지정된 version/config/root-dependency 검사를 실행합니다.
- 알 수 없는 root/config 변경은 안전하게 실패하도록 모든 check lane으로 이동합니다.

로컬 changed-test 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 `check:changed`보다 의도적으로 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 다음 sibling test 및 import-graph dependent를 사용합니다. 공유 group-room delivery config는 명시적 매핑 중 하나입니다. 그룹 visible-reply config, source reply delivery mode, 또는 message-tool system prompt 변경은 core reply test와 Discord 및 Slack delivery regression을 거치므로, 공유 default 변경이 첫 PR push 전에 실패합니다. 변경이 하네스 전체에 걸쳐 있어 저렴한 매핑 세트를 신뢰할 수 있는 proxy로 볼 수 없을 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Crabbox는 관리자 Linux 검증을 위한 리포지토리 소유 원격 박스 래퍼입니다. 로컬 편집 루프에 비해 검사가 너무 광범위하거나, CI 동등성이 중요하거나, 검증에 시크릿, Docker, 패키지 레인, 재사용 가능한 박스, 원격 로그가 필요할 때 리포지토리 루트에서 사용하세요. 일반적인 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제, 또는 명시적인 소유 용량 테스트를 위한 대체 경로입니다.

Crabbox 기반 Blacksmith 실행은 일회성 Testbox를 워밍업, 점유, 동기화, 실행, 보고, 정리합니다. 기본 제공 동기화 정상성 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라지거나 `git status --short`에 추적 중인 삭제가 200개 이상 표시되면 빠르게 실패합니다. 의도적인 대규모 삭제 PR의 경우 원격 명령에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

Crabbox는 또한 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출을 종료합니다. 해당 보호 장치를 비활성화하려면 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

첫 실행 전에 리포지토리 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

리포지토리 래퍼는 `blacksmith-testbox`를 표시하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 provider를 명시적으로 전달하세요. Codex 워크트리 또는 링크/스파스 체크아웃에서는 Crabbox가 시작되기 전에 pnpm이 의존성을 조정할 수 있으므로 로컬 `pnpm crabbox:run` 스크립트를 피하고, 대신 node 래퍼를 직접 호출하세요.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 기반 실행에는 Crabbox 0.22.0 이상이 필요합니다. 그래야 래퍼가 현재 Testbox 동기화, 큐, 정리 동작을 가져옵니다. 형제 체크아웃을 사용할 때는 타이밍 또는 검증 작업 전에 무시된 로컬 바이너리를 다시 빌드하세요.

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

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 위임된 Blacksmith Testbox 실행에서는 Crabbox 래퍼 종료 코드와 JSON 요약이 명령 결과입니다. 연결된 GitHub Actions 실행은 하이드레이션과 keepalive를 소유합니다. SSH 명령이 이미 반환된 뒤 Testbox가 외부에서 중지되면 `cancelled`로 끝날 수 있습니다. 래퍼 `exitCode`가 0이 아니거나 명령 출력에 실패한 테스트가 표시되지 않는 한 이를 정리/상태 아티팩트로 취급하세요. 일회성 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불분명하면 라이브 박스를 검사하고 자신이 만든 박스만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일한 하이드레이션된 박스에서 여러 명령이 의도적으로 필요한 경우에만 재사용을 사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 계층이 고장 났지만 Blacksmith 자체는 동작한다면 `list`, `status`, 정리 같은 진단에만 직접 Blacksmith를 사용하세요. 직접 Blacksmith 실행을 관리자 검증으로 취급하기 전에 Crabbox 경로를 고치세요.

`blacksmith testbox list --all`과 `blacksmith testbox status`는 동작하지만 새 워밍업이 몇 분 뒤에도 IP나 Actions 실행 URL 없이 `queued`에 머무르면 Blacksmith provider, 큐, 결제, 또는 조직 제한 압박으로 취급하세요. 자신이 만든 큐 id를 중지하고, 더 많은 Testbox를 시작하지 말고, 누군가 Blacksmith 대시보드, 결제, 조직 제한을 확인하는 동안 아래 소유 Crabbox 용량 경로로 검증을 이동하세요.

Blacksmith가 다운되었거나, 할당량 제한이 있거나, 필요한 환경이 없거나, 소유 용량이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압박 상황에서는 작업에 48xlarge급 CPU가 실제로 필요한 경우가 아니라면 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며, 리전별 EC2 Spot 또는 On-Demand Standard 할당량에 걸리기 가장 쉽습니다. 리포지토리 소유 `.crabbox.yaml`은 기본값이 `standard`, 여러 용량 리전, `capacity.hints: true`이므로 중개된 AWS 리스가 선택된 리전/시장, 할당량 압박, Spot 대체, 고압박 클래스 경고를 출력합니다. 더 무거운 광범위 검사에는 `fast`를 사용하고, standard/fast로 충분하지 않은 뒤에만 `large`를 사용하며, 전체 스위트나 모든 Plugin Docker 매트릭스, 명시적인 릴리스/차단 검증, 또는 고코어 성능 프로파일링 같은 예외적인 CPU 바운드 레인에만 `beast`를 사용하세요. `pnpm check:changed`, 집중 테스트, 문서 전용 작업, 일반 lint/typecheck, 작은 E2E 재현, 또는 Blacksmith 장애 트리아지에는 `beast`를 사용하지 마세요. 용량 진단에는 `--market on-demand`를 사용하여 Spot 시장 변동이 신호에 섞이지 않게 하세요.

`.crabbox.yaml`은 소유 클라우드 레인의 provider, 동기화, GitHub Actions 하이드레이션 기본값을 소유합니다. 하이드레이션된 Actions 체크아웃이 관리자 로컬 원격 및 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하도록 로컬 `.git`을 제외하며, 절대 전송되어서는 안 되는 로컬 런타임/빌드 아티팩트도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 체크아웃, Node/pnpm 설정, `origin/main` 가져오기, 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 비시크릿 환경 전달을 소유합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
