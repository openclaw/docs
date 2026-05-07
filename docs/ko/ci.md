---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하는 경우
summary: CI 작업 그래프, 범위 게이트, 릴리스 엄브렐라 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-07T01:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. `preflight` job은 diff를 분류하고 관련 없는 영역만 변경되었을 때 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 범위 지정을 우회하고 release candidate와 광범위한 검증을 위해 전체 graph로 확장됩니다. Android lane은 `include_android`를 통해 opt-in 상태로 유지됩니다. 릴리스 전용 Plugin 범위는 별도의 [`Plugin Prerelease`](#plugin-prerelease) workflow에 있으며 [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 dispatch에서만 실행됩니다.

## Pipeline 개요

| Job                              | 목적                                                                                                   | 실행 시점                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs 전용 변경, 변경된 scope, 변경된 확장, CI manifest를 감지                   | draft가 아닌 push와 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 private key 감지와 workflow 감사                                                     | draft가 아닌 push와 PR에서 항상 |
| `security-dependency-audit`      | npm advisory를 기준으로 한 dependency-free production lockfile 감사                                          | draft가 아닌 push와 PR에서 항상 |
| `security-fast`                  | 빠른 security job의 필수 aggregate                                                             | draft가 아닌 push와 PR에서 항상 |
| `check-dependencies`             | production Knip dependency 전용 pass와 사용되지 않는 파일 allowlist guard                                 | Node 관련 변경              |
| `build-artifacts`                | `dist/`, Control UI, built-artifact check, 재사용 가능한 downstream artifact 빌드                       | Node 관련 변경              |
| `checks-fast-core`               | bundled/plugin-contract/protocol check 같은 빠른 Linux 정확성 lane                              | Node 관련 변경              |
| `checks-fast-contracts-channels` | 안정적인 aggregate check 결과가 있는 sharded channel contract check                                      | Node 관련 변경              |
| `checks-node-core-test`          | channel, bundled, contract, extension lane을 제외한 Core Node test shard                          | Node 관련 변경              |
| `check`                          | sharded main local gate 상당 항목: prod type, lint, guard, test type, strict smoke                | Node 관련 변경              |
| `check-additional`               | architecture, sharded boundary/prompt drift, extension guard, package boundary, gateway watch        | Node 관련 변경              |
| `build-smoke`                    | 빌드된 CLI smoke test와 startup-memory smoke                                                            | Node 관련 변경              |
| `checks`                         | built-artifact channel test 검증기                                                                 | Node 관련 변경              |
| `checks-node-compat-node22`      | Node 22 호환성 build와 smoke lane                                                                | release를 위한 수동 CI dispatch    |
| `check-docs`                     | docs formatting, lint, broken-link check                                                             | docs 변경                       |
| `skills-python`                  | Python 기반 skills용 Ruff + pytest                                                                    | Python skill 관련 변경      |
| `checks-windows`                 | Windows 전용 process/path test와 공유 runtime import specifier regression                      | Windows 관련 변경           |
| `macos-node`                     | 공유 built artifact를 사용하는 macOS TypeScript test lane                                               | macOS 관련 변경             |
| `macos-swift`                    | macOS app용 Swift lint, build, test                                                            | macOS 관련 변경             |
| `android`                        | 두 flavor의 Android unit test와 debug APK build 하나                                              | Android 관련 변경           |
| `test-performance-agent`         | 신뢰할 수 있는 활동 후 매일 실행되는 Codex slow-test 최적화                                                 | Main CI 성공 또는 수동 dispatch |
| `openclaw-performance`           | mock-provider, deep-profile, GPT 5.4 live lane을 포함한 일일/온디맨드 Kova runtime performance report | 예약 및 수동 dispatch      |

## Fail-fast 순서

1. `preflight`는 어떤 lane이 존재할지 전체적으로 결정합니다. `docs-scope`와 `changed-scope` logic은 이 job 안의 step이며, 독립 job이 아닙니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix job을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로 downstream consumer가 공유 build가 준비되는 즉시 시작할 수 있습니다.
4. 그 뒤 더 무거운 platform 및 runtime lane이 확장됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` ref에 더 새로운 push가 들어오면 GitHub가 대체된 job을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 run도 실패하지 않는 한 이를 CI noise로 취급하세요. Aggregate shard check는 `!cancelled() && always()`를 사용하므로 일반 shard failure는 계속 보고하지만, 전체 workflow가 이미 대체된 뒤에는 queue에 들어가지 않습니다. 자동 CI concurrency key는 versioned(`CI-v7-*`)되어 있어 이전 queue group의 GitHub 측 zombie가 더 새로운 main run을 무기한 막을 수 없습니다. 수동 full-suite run은 `CI-manual-v1-*`를 사용하며 진행 중인 run을 취소하지 않습니다.

`ci-timings-summary` job은 draft가 아닌 각 CI run마다 compact한 `ci-timings-summary` artifact를 업로드합니다. 이 artifact는 현재 run의 wall time, queue time, 가장 느린 job, 실패한 job을 기록하므로 CI health check가 전체 Actions payload를 반복해서 scrape할 필요가 없습니다.

## Scope와 routing

Scope logic은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit test로 다룹니다. 수동 dispatch는 changed-scope detection을 건너뛰고 preflight manifest가 모든 scoped area가 변경된 것처럼 동작하게 합니다.

- **CI workflow edit**은 Node CI graph와 workflow linting을 검증하지만, 그 자체만으로 Windows, Android, macOS native build를 강제하지 않습니다. 해당 platform lane은 platform source change로만 범위가 지정됩니다.
- **CI routing 전용 edit, 선택된 저비용 core-test fixture edit, 좁은 Plugin contract helper/test-routing edit**은 빠른 Node 전용 manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 이 path는 변경이 fast task가 직접 exercise하는 routing 또는 helper surface로 제한될 때 build artifact, Node 22 compatibility, channel contract, 전체 core shard, bundled-plugin shard, additional guard matrix를 건너뜁니다.
- **Windows Node check**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI workflow surface로 범위가 지정됩니다. 관련 없는 source, Plugin, install-smoke, test-only 변경은 Linux Node lane에 남습니다.

가장 느린 Node test family는 각 job이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. channel contract는 세 개의 weighted shard로 실행되고, core unit fast/support lane은 별도로 실행되며, core runtime infra는 state, process/config, cron, shared shard로 나뉩니다. auto-reply는 균형 잡힌 worker로 실행되고(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분할), agentic gateway/server config는 built artifact를 기다리는 대신 chat/auth/model/http-plugin/runtime/startup lane에 걸쳐 분할됩니다. 광범위한 browser, QA, media, 기타 Plugin test는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard name을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`은 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary work를 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard list는 네 개의 matrix shard에 stripe되며, 각 shard는 선택된 independent guard를 동시에 실행하고 per-check timing을 출력합니다. 비용이 큰 Codex happy-path prompt snapshot drift check는 수동 CI와 prompt에 영향을 주는 변경에서만 실행되므로, 일반적인 관련 없는 Node 변경은 cold prompt snapshot generation 뒤에서 기다리지 않으면서 prompt drift는 여전히 그것을 유발한 PR에 고정됩니다. 같은 flag는 built-artifact core support-boundary shard 안의 prompt snapshot Vitest generation도 건너뜁니다. Gateway watch, channel test, core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 그 unit-test lane은 여전히 SMS/call-log BuildConfig flag로 flavor를 compile하면서, Android 관련 push마다 중복 debug APK packaging job을 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip version에 고정되고 `dlx` install에 대해 pnpm의 minimum release age가 비활성화된 production Knip dependency 전용 pass)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file finding을 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 새로 검토되지 않은 unused file을 추가하거나 오래된 allowlist entry를 남겨둘 때 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw repository activity를 ClawSweeper로 보내는 target-side bridge입니다. 이 workflow는 신뢰할 수 없는 pull request code를 checkout하거나 실행하지 않습니다. Workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음 compact한 `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

이 workflow에는 네 개의 lane이 있습니다.

- 정확한 issue 및 pull request review request용 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper command용 `clawsweeper_comment`;
- `main` push의 commit-level review request용 `clawsweeper_commit_review`;
- ClawSweeper agent가 inspect할 수 있는 일반 GitHub activity용 `github_activity`.

`github_activity` lane은 정규화된 metadata만 전달합니다: event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때 짧은 excerpt. 전체 webhook body는 의도적으로 전달하지 않습니다. `openclaw/clawsweeper`의 receiving workflow는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 post합니다.

일반 activity는 observation이지 기본 delivery가 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받으며, event가 surprising, actionable, risky, operationally useful한 경우에만 `#clawsweeper`에 post해야 합니다. Routine open, edit, bot churn, duplicate webhook noise, normal review traffic은 `NO_REPLY`로 이어져야 합니다.

GitHub 제목, 댓글, 본문, 리뷰 텍스트, 브랜치 이름, 커밋 메시지는 이 경로 전체에서 신뢰할 수 없는 데이터로 취급하세요. 이들은 workflow 또는 에이전트 런타임에 대한 지시가 아니라 요약 및 triage를 위한 입력입니다.

## 수동 dispatch

수동 CI dispatch는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 lane을 강제로 켭니다. Linux Node shard, 번들 Plugin shard, 채널 계약, Node 22 호환성, `check`, `check-additional`, build smoke, 문서 검사, Python skills, Windows, macOS, Control UI i18n이 포함됩니다. 독립 실행형 수동 CI dispatch는 `include_android=true`일 때만 Android를 실행합니다. 전체 릴리스 umbrella는 `include_android=true`를 전달하여 Android를 활성화합니다. Plugin 사전 릴리스 정적 검사, 릴리스 전용 `agentic-plugins` shard, 전체 extension batch sweep, Plugin 사전 릴리스 Docker lane은 CI에서 제외됩니다. Docker 사전 릴리스 suite는 `Full Release Validation`이 릴리스 검증 gate를 활성화한 상태로 별도의 `Plugin Prerelease` workflow를 dispatch할 때만 실행됩니다.

수동 실행은 고유한 concurrency group을 사용하므로 릴리스 후보 전체 suite가 동일 ref의 다른 push 또는 PR 실행으로 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰할 수 있는 호출자가 선택한 dispatch ref의 workflow 파일을 사용하면서 해당 그래프를 브랜치, 태그 또는 전체 커밋 SHA에 대해 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, shard된 채널 계약 검사, lint를 제외한 `check` shard, `check-additional` 집계, Node 테스트 집계 검증기, 문서 검사, Python skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하여 Blacksmith matrix가 더 일찍 queue될 수 있게 합니다. |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 낮은 가중치의 extension shard, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 shard, 번들 Plugin 테스트 shard, `check-additional` shard, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(CPU에 민감하여 8 vCPU가 절약한 것보다 더 많은 비용이 들었습니다), install-smoke Docker 빌드(32-vCPU queue 시간이 절약한 것보다 더 많은 비용이 들었습니다)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`. fork는 `macos-latest`로 fallback됩니다.                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`. fork는 `macos-latest`로 fallback됩니다.                                                                                                                                                                                                                                                                                                                                                                                      |

Canonical repo CI는 Blacksmith를 기본 runner 경로로 유지합니다. `preflight` 동안 `scripts/ci-runner-labels.mjs`는 최근 queued 및 in-progress Actions 실행에서 queued Blacksmith 작업을 확인합니다. 특정 Blacksmith label에 이미 queued 작업이 있으면, 해당 정확한 label을 사용할 downstream 작업은 그 실행에 한해 일치하는 GitHub 호스팅 runner(`ubuntu-24.04`, `windows-2025`, `macos-latest`)로 fallback됩니다. 동일 OS family의 다른 Blacksmith 크기는 기본 label을 유지합니다. API probe가 실패하면 fallback은 적용되지 않습니다.

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

`OpenClaw Performance`는 제품/런타임 성능 workflow입니다. 매일 `main`에서 실행되며 수동으로 dispatch할 수 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 dispatch는 일반적으로 workflow ref를 benchmark합니다. 릴리스 태그나 다른 브랜치를 현재 workflow 구현으로 benchmark하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 latest pointer는 테스트된 ref를 기준으로 key가 지정되며, 각 `index.md`는 테스트된 ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, 반복 횟수, scenario filter를 기록합니다.

이 workflow는 고정된 릴리스에서 OCM을 설치하고, 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 다음 세 개의 lane을 실행합니다.

- `mock-provider`: 결정론적 가짜 OpenAI 호환 auth를 사용하는 로컬 빌드 런타임에 대한 Kova diagnostic scenario.
- `mock-deep-profile`: startup, Gateway, agent-turn hotspot에 대한 CPU/heap/trace profiling.
- `live-gpt54`: 실제 OpenAI `openai/gpt-5.4` 에이전트 turn. `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider lane은 Kova pass 이후 OpenClaw native source probe도 실행합니다. 기본, hook, 50-Plugin startup case 전반의 Gateway boot timing 및 memory, 반복 mock-OpenAI `channel-chat-baseline` hello loop, 부팅된 Gateway에 대한 CLI startup command가 포함됩니다. source probe Markdown summary는 report bundle의 `source/index.md`에 있으며, raw JSON은 그 옆에 있습니다.

모든 lane은 GitHub artifact를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 workflow는 `report.json`, `report.md`, bundle, `index.md`, source-probe artifact도 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 tested-ref pointer는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 umbrella workflow입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 target으로 수동 `CI` workflow를 dispatch하고, 릴리스 전용 Plugin/package/static/Docker 증명을 위해 `Plugin Prerelease`를 dispatch하며, install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix, Telegram lane을 위해 `OpenClaw Release Checks`를 dispatch합니다. stable/default 실행은 `run_release_soak=true` 뒤에 exhaustive live/E2E 및 Docker release-path coverage를 유지합니다. `release_profile=full`은 광범위한 advisory validation이 계속 넓게 유지되도록 해당 soak coverage를 강제로 켭니다. `rerun_group=all` 및 `release_profile=full`과 함께 사용하면 release check의 `release-package-under-test` artifact를 대상으로 `NPM Telegram Beta E2E`도 실행합니다. 게시 후에는 `npm_telegram_package_spec`을 전달하여 게시된 npm package를 대상으로 동일한 Telegram package lane을 다시 실행하세요.

stage matrix, 정확한 workflow job 이름, profile 차이, artifact,
집중 rerun handle은 [전체 릴리스 검증](/ko/reference/full-release-validation)을
참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 workflow입니다. 릴리스 태그가 존재하고
OpenClaw npm preflight가 성공한 후 `release/YYYY.M.D` 또는 `main`에서 dispatch하세요.
이 workflow는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin package에 대해
`Plugin NPM Release`를 dispatch하며, 동일한 릴리스 SHA에 대해 `Plugin ClawHub Release`를 dispatch한 다음,
그 후에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 dispatch합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 브랜치에서 고정된 커밋 증명이 필요하면
`gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다. 헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고, 고정된 ref에서 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로의 `headSha`가 대상과 일치하는지 확인하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 엄브렐라 검증기는 하위 워크플로가 다른 SHA에서 실행된 경우에도 실패합니다.

`release_profile`은 릴리스 검사에 전달되는 live/provider 범위를 제어합니다. 수동 릴리스 워크플로의 기본값은 `stable`입니다. 광범위한 권고 provider/media 매트릭스를 의도적으로 원할 때만 `full`을 사용하세요. `run_release_soak`는 stable/default 릴리스 검사가 포괄적인 live/E2E 및 Docker 릴리스 경로 soak를 실행할지 제어합니다. `full`은 soak를 강제로 켭니다.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 필수 lane을 유지합니다.
- `stable`은 stable provider/backend 세트를 추가합니다.
- `full`은 광범위한 권고 provider/media 매트릭스를 실행합니다.

엄브렐라는 디스패치된 하위 실행 ID를 기록하고, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하며 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로를 다시 실행해 성공 상태가 되면, 엄브렐라 결과와 타이밍 요약을 새로 고치기 위해 부모 검증기 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 허용합니다. 릴리스 후보에는 `all`, 일반 full CI 하위 항목만에는 `ci`, Plugin 프리릴리스 하위 항목만에는 `plugin-prerelease`, 모든 릴리스 하위 항목에는 `release-checks`, 또는 엄브렐라에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 box 재실행 범위를 제한할 수 있습니다. 실패한 cross-OS lane 하나에는 `rerun_group=cross-os`를 `cross_os_suite_filter`와 함께 사용하세요. 예: `windows/packaged-upgrade`; 긴 cross-OS 명령은 Heartbeat 줄을 출력하고 packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA 릴리스 검사 lane은 권고용이므로 QA 전용 실패는 경고하지만 릴리스 검사 검증기를 차단하지 않습니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택한 ref를 한 번만 `release-package-under-test` tarball로 해석한 다음, 해당 artifact를 cross-OS 검사와 Package Acceptance, 그리고 soak 범위가 실행될 때 live/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 box 전체에서 패키지 바이트가 일관되며 여러 하위 작업에서 같은 후보를 다시 패키징하지 않습니다.

`ref=main` 및 `rerun_group=all`의 중복 `Full Release Validation` 실행은 이전 엄브렐라를 대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한 모든 하위 워크플로를 취소하므로, 새로운 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에서 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## 라이브 및 E2E 샤드

릴리스 live/E2E 하위 항목은 광범위한 네이티브 `pnpm test:live` 범위를 유지하지만, 단일 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 명명된 샤드로 실행합니다.

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

이렇게 하면 동일한 파일 범위를 유지하면서 느린 live provider 실패를 더 쉽게 다시 실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 live media 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 이 이미지는 `ffmpeg`와 `ffprobe`를 사전 설치합니다. media 작업은 설정 전에 바이너리만 확인합니다. Docker 기반 live suite는 일반 Blacksmith runner에 유지하세요. container 작업은 중첩 Docker 테스트를 실행하기에 적절한 위치가 아닙니다.

Docker 기반 live model/backend 샤드는 선택한 커밋별 별도 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. live 릴리스 워크플로는 이 이미지를 한 번 빌드하고 푸시한 뒤, Docker live model, provider별로 샤딩된 Gateway, CLI backend, ACP bind, Codex harness 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 워크플로 작업 timeout보다 낮은 명시적인 스크립트 수준 `timeout` 상한을 가지므로, 멈춘 container나 cleanup 경로가 전체 릴리스 검사 예산을 소비하지 않고 빠르게 실패합니다. 해당 샤드가 전체 source Docker target을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드로 시간을 낭비하게 됩니다.

## 패키지 승인

“설치 가능한 OpenClaw 패키지가 제품으로서 작동하는가?”가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 source tree를 검증하지만, package acceptance는 설치 또는 업데이트 후 사용자가 실행하는 동일한 Docker E2E harness를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 checkout하고, 패키지 후보 하나를 해석하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰고, 둘 다 `package-under-test` artifact로 업로드한 뒤, GitHub 단계 요약에 source, workflow ref, package ref, version, SHA-256, profile을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 워크플로는 해당 artifact를 다운로드하고, tarball inventory를 검증하며, 필요할 때 package-digest Docker 이미지를 준비하고, workflow checkout을 패키징하는 대신 해당 패키지를 대상으로 선택된 Docker lane을 실행합니다. profile이 여러 대상 `docker_lanes`를 선택하면, 재사용 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 lane들을 고유한 artifact가 있는 병렬 대상 Docker 작업으로 분산 실행합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 패키지를 해석한 경우 동일한 `package-under-test` artifact를 설치합니다. standalone Telegram 디스패치는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker acceptance, 또는 선택적 Telegram lane이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 prerelease/stable acceptance에 사용하세요.
- `source=ref`는 신뢰된 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패키징합니다. resolver는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 확인하며, detached worktree에 deps를 설치하고, `scripts/package-openclaw-for-docker.mjs`로 패키징합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 `.tgz` 하나를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 artifact에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해서 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰된 workflow/harness 코드입니다. `package_ref`는 `source=ref`일 때 패키징되는 source commit입니다. 이를 통해 현재 test harness가 오래된 workflow logic을 실행하지 않고도 이전의 신뢰된 source commit을 검증할 수 있습니다.

### Suite profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package`에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`를 더함
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 chunk
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` profile은 offline plugin 범위를 사용하므로 게시 패키지 검증이 live ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram lane은 `NPM Telegram Beta E2E`에서 `package-under-test` artifact를 재사용하며, 게시된 npm spec 경로는 standalone 디스패치용으로 유지됩니다.

local 명령, Docker lane, Package Acceptance 입력, 릴리스 기본값, 실패 triage를 포함한 전용 업데이트 및 plugin 테스트 정책은 [업데이트 및 plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 준비된 릴리스 패키지 artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `telegram_mode=mock-openai`와 함께 Package Acceptance를 `source=artifact`로 호출합니다. 이렇게 하면 패키지 migration, update, 오래된 plugin dependency cleanup, 구성된 plugin 설치 repair, offline plugin, plugin-update, Telegram 증명이 동일하게 해석된 패키지 tarball에서 유지됩니다. Full Release Validation 또는 OpenClaw Release Checks에서 `package_acceptance_package_spec`을 설정하면 SHA로 빌드한 artifact 대신 출시된 npm 패키지를 대상으로 동일한 매트릭스를 실행합니다. Cross-OS 릴리스 검사는 여전히 OS별 onboarding, installer, platform behavior를 다룹니다. package/update 제품 검증은 Package Acceptance에서 시작해야 합니다. `published-upgrade-survivor` Docker lane은 blocking release path에서 실행당 하나의 게시된 package baseline을 검증합니다. Package Acceptance에서 해석된 `package-under-test` tarball은 항상 후보이며, `published_upgrade_survivor_baseline`은 fallback으로 사용할 게시된 baseline을 선택하고 기본값은 `openclaw@latest`입니다. 실패 lane 재실행 명령은 해당 baseline을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`인 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정해 최신 4개 stable npm 릴리스와 고정된 plugin compatibility boundary 릴리스, 그리고 Feishu config, 보존된 bootstrap/persona 파일, 구성된 OpenClaw plugin 설치, tilde log 경로, 오래된 legacy plugin dependency root에 대한 issue 형태 fixture 전반으로 확장합니다. Multi-baseline published-upgrade survivor 선택은 baseline별로 별도 대상 Docker runner 작업으로 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 포괄적인 게시 update cleanup일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker lane을 사용합니다. local aggregate 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 package spec을 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 lane을 유지하거나, scenario matrix에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시 lane은 내장된 `openclaw config set` 명령 recipe로 baseline을 구성하고, recipe 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, RPC status를 probe합니다. Windows packaged 및 installer fresh lane도 설치된 package가 원시 절대 Windows 경로에서 browser-control override를 import할 수 있는지 확인합니다. OpenAI cross-OS agent-turn smoke는 설정된 경우 기본값으로 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용하므로 install 및 gateway 증명이 GPT-4.x 기본값을 피하면서 GPT-5 테스트 모델에 유지됩니다.

### Legacy 호환성 기간

Package Acceptance에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 타르볼에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 타르볼에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 제거할 수 있으며, 누락된 지속 `update.channel`을 로그로 남길 수 있습니다.
- Plugin 스모크는 레거시 설치 기록 위치를 읽거나 marketplace 설치 기록 지속성이 없는 것을 허용할 수 있습니다.
- `plugin-update`는 설치 기록 및 재설치 없음 동작이 변경되지 않아야 한다는 요구 사항을 유지하면서 config 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 하며, 같은 조건은 경고하거나 건너뛰는 대신 실패합니다.

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

실패한 Package Acceptance 실행을 디버깅할 때는 `resolve_package` 요약에서 시작하여 패키지 소스, 버전, SHA-256을 확인합니다. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계별 타이밍, 재실행 명령을 검사합니다. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필이나 정확한 Docker 레인을 다시 실행하는 것이 좋습니다.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. 이 워크플로는 스모크 범위를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/manifest 변경, 또는 Docker 스모크 작업이 실행하는 코어 Plugin/channel/Gateway/Plugin SDK 표면을 건드리는 pull request에 대해 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, agents delete 공유 작업공간 CLI 스모크를 실행하고, 컨테이너 Gateway 네트워크 E2E를 실행하고, 번들 extension 빌드 인자를 검증하고, 240초 집계 명령 제한 시간 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 dispatch, workflow-call 릴리스 검사, 그리고 실제로 installer/패키지/Docker 표면을 건드리는 pull request를 위해 QR 패키지 설치와 installer Docker/update 범위를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지 하나를 준비하거나 재사용한 다음, installer 작업이 루트 이미지 스모크 뒤에서 대기하지 않도록 QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, installer/update 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행합니다.

`main` push는 merge commit을 포함해 전체 경로를 강제하지 않습니다. 변경 범위 로직이 push에서 전체 범위를 요청하더라도, 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 image-provider 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 스모크는 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` dispatch로 선택할 수 있지만 pull request와 `main` push에서는 실행되지 않습니다. QR 및 installer Docker 테스트는 각각 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 live-test 이미지 하나를 미리 빌드하고, OpenClaw를 npm 타르볼로 한 번 패키징하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- installer/update/Plugin 의존성 레인을 위한 기본 Node/Git runner
- 일반 기능 레인을 위해 같은 타르볼을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, planner 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, runner는 선택된 plan만 실행합니다. scheduler는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정값

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 main-pool 슬롯 수입니다.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider에 민감한 tail-pool 슬롯 수입니다.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | provider가 throttle하지 않도록 하는 동시 live 레인 상한입니다.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한입니다.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 multi-service 레인 상한입니다.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create 폭주를 피하기 위한 레인 시작 간격입니다. 간격이 필요 없으면 `0`으로 설정합니다. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 fallback 제한 시간입니다(120분). 선택된 live/tail 레인은 더 엄격한 상한을 사용합니다.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 scheduler plan을 출력합니다.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록입니다. cleanup smoke를 건너뛰어 agent가 실패한 레인 하나를 재현할 수 있게 합니다. |

유효 상한보다 무거운 레인은 빈 pool에서 시작할 수 있으며, 그런 다음 capacity를 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 출력하고, longest-first 정렬을 위해 레인 타이밍을 저장하며, 기본적으로 첫 번째 실패 이후에는 새 pooled 레인 scheduling을 중지합니다.

### 재사용 가능한 live/E2E 워크플로

재사용 가능한 live/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, live 이미지, 레인, 자격 증명 범위를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 plan을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패키징하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. 타르볼 inventory를 검증하고, plan이 패키지 설치 레인을 필요로 할 때 Blacksmith의 Docker layer cache를 통해 package-digest 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 push하며, 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 package-digest 이미지를 재사용합니다. Docker 이미지 pull은 제한된 시도별 180초 timeout으로 재시도되어, 멈춘 registry/cache stream이 CI 핵심 경로 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 범위는 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용하여 더 작은 청크 작업으로 실행됩니다. 따라서 각 청크는 필요한 이미지 종류만 pull하고, 동일한 가중 scheduler를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/runtime alias로 남아 있습니다. `install-e2e` 레인 alias는 두 provider installer 레인을 위한 집계 수동 재실행 alias로 유지됩니다.

전체 release-path 범위가 요청할 때 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 dispatch에 대해서만 독립 `openwebui` 청크를 유지합니다. 번들 channel update 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계별 타이밍, scheduler plan JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행합니다. 이를 통해 실패 레인 디버깅을 하나의 대상 Docker 작업으로 제한하고, 해당 실행을 위해 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 live Docker 레인인 경우, 대상 작업은 해당 재실행을 위해 live-test 이미지를 로컬로 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로, 실패한 레인은 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 live/E2E 워크플로는 전체 release-path Docker suite를 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 product/package 범위이므로, `Full Release Validation` 또는 명시적 operator가 dispatch하는 별도 워크플로입니다. 일반 pull request, `main` push, 독립 수동 CI dispatch에서는 해당 suite를 꺼 둡니다. 이 워크플로는 번들 Plugin 테스트를 8개의 extension worker에 균등하게 분산합니다. 해당 extension shard 작업은 한 번에 최대 두 개의 Plugin config 그룹을 실행하며, 그룹당 하나의 Vitest worker와 더 큰 Node heap을 사용해 import가 많은 Plugin batch가 추가 CI 작업을 만들지 않도록 합니다. 릴리스 전용 Docker 사전 릴리스 경로는 하나에서 세 분짜리 작업을 위해 수십 개의 runner를 예약하지 않도록 대상 Docker 레인을 작은 그룹으로 batch 처리합니다.

## QA Lab

QA Lab에는 기본 smart-scoped 워크플로 외부에 전용 CI 레인이 있습니다. Agentic parity는 독립 PR 워크플로가 아니라 광범위한 QA 및 릴리스 harness 아래에 중첩됩니다. parity가 광범위한 검증 실행과 함께 진행되어야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용합니다.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 야간으로 실행되고 수동 dispatch에서도 실행됩니다. 이 워크플로는 mock parity 레인, live Matrix 레인, live Telegram 및 Discord 레인을 병렬 작업으로 fan out합니다. Live 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex lease를 사용합니다.

릴리스 검사는 결정적 mock 프로바이더와 mock 한정 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 lane을 실행하므로, 채널 계약이 라이브 모델 지연 시간 및 일반 프로바이더 Plugin 시작과 격리됩니다. 라이브 전송 Gateway는 QA 패리티가 메모리 동작을 별도로 다루기 때문에 메모리 검색을 비활성화합니다. 프로바이더 연결성은 별도의 라이브 모델, 네이티브 프로바이더, Docker 프로바이더 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` dispatch는 항상 전체 Matrix 범위를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`는 릴리스 승인 전에 릴리스에 중요한 QA Lab lane도 실행합니다. 해당 QA 패리티 게이트는 후보 및 기준 팩을 병렬 lane 작업으로 실행한 다음, 최종 패리티 비교를 위해 두 아티팩트를 작은 보고서 작업으로 다운로드합니다.

일반 PR의 경우, 패리티를 필수 상태로 취급하지 말고 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일별, 수동 및 non-draft pull request 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, high/critical `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

pull request 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `src` 아래 변경에 대해서만 시작되며 예약 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron 및 gateway 기준선                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, gateway, Plugin SDK, secrets, audit 접점                                                  |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, web-fetch 및 Plugin SDK SSRF 정책 표면                                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달 및 agent 도구 실행 게이트                                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, package-manager 설치, source-loading 및 Plugin SDK 패키지 계약 신뢰 표면                |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 sanity에서 허용하는 가장 작은 Blacksmith Linux runner에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드는 깨끗한 상태에서도 런타임을 지배하므로 일별 기본값 밖에 둡니다.

### 중요 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux runner에서 좁고 가치가 높은 표면에 대해 error-severity, 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 해당 pull request 가드는 예약 프로필보다 의도적으로 더 작습니다. non-draft PR은 agent command/model/tool 실행 및 reply dispatch 코드, config schema/migration/IO 코드, auth/secrets/sandbox/security 코드, 핵심 채널 및 번들된 채널 Plugin 런타임, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract 또는 Plugin SDK reply runtime 변경에 대해 대응하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL config 및 품질 워크플로 변경은 열두 개의 PR 품질 샤드를 모두 실행합니다.

수동 dispatch는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 격리하여 실행하기 위한 교육/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron 및 gateway 보안 경계 코드                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization 및 IO 계약                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schema 및 server method 계약                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들된 채널 Plugin 구현 계약                                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, model/provider dispatch, auto-reply dispatch 및 queue, ACP control-plane 런타임 계약                                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버 및 tool bridge, process supervision helper, outbound delivery 계약                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facade, memory Plugin SDK alias, memory runtime activation glue 및 memory doctor 명령                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue 내부, session delivery queue, outbound session binding/delivery helper, diagnostic event/log bundle 표면 및 session doctor CLI 계약                  |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helper, channel reply option, delivery queue 및 session/thread binding helper                  |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth 및 discovery, provider runtime registration, provider defaults/catalogs 및 web/search/fetch/embedding registry        |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flow 및 task control-plane 런타임 계약                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 web fetch/search, media IO, media understanding, image-generation 및 media-generation 런타임 계약                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface 및 Plugin SDK entrypoint 계약                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                                    |

품질은 보안과 별도로 유지되므로, 보안 신호를 흐리지 않고 품질 발견 사항을 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python 및 번들된 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정된 후에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 병합된 변경 사항과 기존 문서를 맞추기 위한 이벤트 기반 Codex 유지 관리 lane입니다. 순수한 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있으며, 수동 dispatch로 직접 실행할 수 있습니다. Workflow-run 호출은 `main`이 이미 이동했거나 지난 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간 단위 실행 하나가 마지막 문서 패스 이후 누적된 모든 main 변경 사항을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 lane입니다. 순수한 일정은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 일자에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 dispatch는 이 일일 활동 게이트를 우회합니다. 이 lane은 전체 제품군 grouped Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터 대신 커버리지를 보존하는 작은 테스트 성능 수정만 하도록 한 다음, 전체 제품군 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패한 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, agent 이후 전체 제품군 보고서는 커밋되기 전에 통과해야 합니다. bot push가 병합되기 전에 `main`이 전진하면, lane은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 다음 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. GitHub-hosted Ubuntu를 사용하므로 Codex action이 docs agent와 동일한 drop-sudo 안전 태세를 유지할 수 있습니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 post-land 중복 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며, `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에, 병합된 PR이 병합되었고 각 중복 항목에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 라우팅

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 해당 로컬 검사 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다:

- 코어 프로덕션 변경은 코어 프로덕션 및 코어 테스트 타입체크와 코어 lint/guard를 실행합니다.
- 코어 테스트 전용 변경은 코어 테스트 타입체크와 코어 lint만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입체크와 확장 lint를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입체크와 확장 lint를 실행합니다.
- 공개 Plugin SDK 또는 plugin-contract 변경은 확장이 해당 코어 계약에 의존하므로 확장 타입체크까지 확장됩니다(Vitest 확장 스윕은 명시적 테스트 작업으로 유지).
- 릴리스 메타데이터 전용 버전 bump는 대상 버전/config/root-dependency 검사를 실행합니다.
- 알 수 없는 루트/config 변경은 안전을 위해 모든 검사 lane으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 다음 sibling 테스트와 import-graph 의존 항목을 사용합니다. 공유 그룹룸 전달 config는 명시적 매핑 중 하나입니다. 그룹 visible-reply config, 소스 reply delivery mode, 또는 message-tool system prompt 변경은 코어 reply 테스트와 Discord 및 Slack 전달 회귀 테스트를 거치므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하네스 전체에 걸쳐 있어 저렴한 매핑 집합이 신뢰할 수 있는 대리 검증이 아닐 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Testbox는 repo 루트에서 실행하고, 광범위한 증명을 위해 새로 예열한 box를 선호하세요. 재사용되었거나 만료되었거나 예상보다 큰 sync를 방금 보고한 box에서 느린 게이트를 쓰기 전에, 먼저 box 내부에서 `pnpm testbox:sanity`를 실행하세요.

sanity check는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라졌거나 `git status --short`가 추적된 삭제를 200개 이상 표시할 때 빠르게 실패합니다. 이는 일반적으로 원격 sync 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하는 대신 해당 box를 중지하고 새 box를 예열하세요. 의도적인 대규모 삭제 PR의 경우 해당 sanity run에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 sync 이후 출력 없이 5분 넘게 sync 단계에 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 이 guard를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

Crabbox는 maintainer Linux 증명을 위한 repo 소유 원격 box wrapper입니다. 검사가 로컬 편집 loop에 비해 너무 광범위하거나, CI parity가 중요하거나, 증명에 secret, Docker, package lane, 재사용 가능한 box, 원격 로그가 필요할 때 사용하세요. 일반 OpenClaw backend는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, quota 문제, 또는 명시적인 소유 용량 테스트를 위한 fallback입니다.

첫 실행 전에 repo 루트에서 wrapper를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper는 `blacksmith-testbox`를 광고하지 않는 오래된 Crabbox binary를 거부합니다. `.crabbox.yaml`에 소유 cloud 기본값이 있더라도 provider를 명시적으로 전달하세요.

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

전체 suite:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

최종 JSON summary를 읽으세요. 유용한 field는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 일회성 Blacksmith-backed Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 cleanup이 불분명하면 live box를 inspect하고 직접 만든 box만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일한 hydration된 box에서 여러 command가 의도적으로 필요할 때만 재사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox layer가 깨졌지만 Blacksmith 자체는 작동한다면, 좁은 fallback으로 direct Blacksmith를 사용하세요.

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` 및 `blacksmith testbox status`는 작동하지만 새 warmup이 몇 분 후에도 IP 또는 Actions run URL 없이 `queued`에 머문다면, Blacksmith provider, queue, billing, 또는 org-limit 압박으로 취급하세요. 직접 만든 queued id를 중지하고, 더 이상 Testbox를 시작하지 말고, 누군가 Blacksmith dashboard, billing, org limit을 확인하는 동안 아래의 소유 Crabbox 용량 경로로 증명을 옮기세요.

Blacksmith가 down 상태이거나, quota 제한이 있거나, 필요한 환경이 없거나, 소유 용량 자체가 명시적 목표일 때만 소유 Crabbox 용량으로 escalate하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압박 상황에서는 작업에 실제로 48xlarge급 CPU가 필요한 경우가 아니라면 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며, regional EC2 Spot 또는 On-Demand Standard quota를 가장 쉽게 초과시키는 방법입니다. repo 소유 `.crabbox.yaml`은 기본값으로 `standard`, 여러 용량 region, `capacity.hints: true`를 사용하므로 brokered AWS lease가 선택된 region/market, quota pressure, Spot fallback, high-pressure class warning을 출력합니다. 더 무거운 광범위 검사는 `fast`를 사용하고, standard/fast로 충분하지 않을 때만 `large`를 사용하며, `beast`는 full-suite 또는 all-plugin Docker matrix, 명시적 release/blocker 검증, 또는 high-core performance profiling처럼 예외적으로 CPU-bound인 lane에만 사용하세요. `pnpm check:changed`, 집중 테스트, docs-only 작업, 일반 lint/typecheck, 작은 E2E repro, 또는 Blacksmith outage triage에는 `beast`를 사용하지 마세요. 용량 진단에는 Spot market churn이 signal에 섞이지 않도록 `--market on-demand`를 사용하세요.

`.crabbox.yaml`은 소유 cloud lane의 provider, sync, GitHub Actions hydration 기본값을 소유합니다. local `.git`은 제외하므로 hydration된 Actions checkout은 maintainer-local remote와 object store를 sync하는 대신 자체 원격 Git metadata를 유지하며, 절대 전송되어서는 안 되는 local runtime/build artifact도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 checkout, Node/pnpm setup, `origin/main` fetch, 그리고 소유 cloud `crabbox run --id <cbx_id>` command를 위한 non-secret environment handoff를 소유합니다.

## 관련 항목

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
