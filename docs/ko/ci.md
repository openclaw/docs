---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패하는 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다.
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하는 경우
summary: CI 작업 그래프, 범위 게이트, 릴리스 포괄 작업, 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-06T09:02:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 푸시될 때마다, 그리고 모든 풀 리퀘스트에서 실행됩니다. `preflight` 작업은 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 범위 지정을 우회하고 릴리스 후보와 광범위한 검증을 위해 전체 그래프를 펼칩니다. Android lane은 `include_android`를 통해 옵트인 상태로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin Prerelease`](#plugin-prerelease) 워크플로에 있으며 [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 dispatch에서만 실행됩니다.

## 파이프라인 개요

| 작업                             | 목적                                                                                                      | 실행 시점                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 문서 전용 변경, 변경된 범위, 변경된 extensions를 감지하고 CI 매니페스트를 빌드                           | draft가 아닌 푸시와 PR에서 항상    |
| `security-scm-fast`              | `zizmor`를 통한 개인 키 감지 및 워크플로 감사                                                             | draft가 아닌 푸시와 PR에서 항상    |
| `security-dependency-audit`      | npm advisory에 대한 의존성 없는 프로덕션 lockfile 감사                                                    | draft가 아닌 푸시와 PR에서 항상    |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 집계                                                                           | draft가 아닌 푸시와 PR에서 항상    |
| `check-dependencies`             | 프로덕션 Knip 의존성 전용 pass와 미사용 파일 allowlist guard                                              | Node 관련 변경                     |
| `build-artifacts`                | `dist/`, Control UI, 빌드 산출물 검사, 재사용 가능한 downstream 산출물 빌드                               | Node 관련 변경                     |
| `checks-fast-core`               | 번들/Plugin 계약/프로토콜 검사 같은 빠른 Linux 정확성 lane                                                | Node 관련 변경                     |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과가 있는 sharded 채널 계약 검사                                                     | Node 관련 변경                     |
| `checks-node-core-test`          | 채널, 번들, 계약, extension lane을 제외한 Core Node 테스트 shard                                          | Node 관련 변경                     |
| `check`                          | sharded 기본 로컬 gate 동등 항목: 프로덕션 타입, lint, guard, 테스트 타입, strict smoke                   | Node 관련 변경                     |
| `check-additional`               | 아키텍처, sharded boundary/prompt drift, extension guard, 패키지 boundary, Gateway watch                  | Node 관련 변경                     |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 startup-memory smoke                                                           | Node 관련 변경                     |
| `checks`                         | 빌드 산출물 채널 테스트용 verifier                                                                        | Node 관련 변경                     |
| `checks-node-compat-node22`      | Node 22 호환성 빌드 및 smoke lane                                                                         | 릴리스용 수동 CI dispatch          |
| `check-docs`                     | 문서 formatting, lint, 깨진 링크 검사                                                                     | 문서 변경                          |
| `skills-python`                  | Python 기반 skills용 Ruff + pytest                                                                        | Python skill 관련 변경             |
| `checks-windows`                 | Windows 전용 process/path 테스트와 공유 runtime import specifier 회귀                                     | Windows 관련 변경                  |
| `macos-node`                     | 공유 빌드 산출물을 사용하는 macOS TypeScript 테스트 lane                                                  | macOS 관련 변경                    |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, 테스트                                                                       | macOS 관련 변경                    |
| `android`                        | 두 flavor의 Android 단위 테스트와 debug APK 빌드 하나                                                     | Android 관련 변경                  |
| `test-performance-agent`         | 신뢰된 활동 후 매일 Codex 느린 테스트 최적화                                                              | Main CI 성공 또는 수동 dispatch    |
| `openclaw-performance`           | mock-provider, deep-profile, GPT 5.4 live lane이 포함된 일일/온디맨드 Kova runtime 성능 보고서            | 예약 및 수동 dispatch              |

## Fail-fast 순서

1. `preflight`는 어떤 lane이 존재할지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 실행형 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 산출물 및 플랫폼 matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 downstream 소비자가 시작할 수 있습니다.
4. 그다음 더 무거운 플랫폼 및 runtime lane이 펼쳐집니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

같은 PR 또는 `main` ref에 더 새로운 push가 들어오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI 잡음으로 취급하세요. 집계 shard 검사는 `!cancelled() && always()`를 사용하므로 일반 shard 실패는 계속 보고하지만 전체 워크플로가 이미 대체된 뒤에는 queue에 들어가지 않습니다. 자동 CI concurrency 키는 버전이 지정되어 있으므로(`CI-v7-*`) 이전 queue group의 GitHub 측 zombie가 더 새로운 main 실행을 무기한 막을 수 없습니다. 수동 전체 suite 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

## 범위와 라우팅

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 커버됩니다. 수동 dispatch는 changed-scope 감지를 건너뛰고 preflight 매니페스트가 모든 scoped 영역이 변경된 것처럼 동작하게 합니다.

- **CI 워크플로 편집**은 Node CI 그래프와 워크플로 linting을 검증하지만, 그 자체로 Windows, Android, macOS native 빌드를 강제하지는 않습니다. 해당 플랫폼 lane은 플랫폼 소스 변경으로 범위가 유지됩니다.
- **CI 라우팅 전용 편집, 선택된 저비용 core-test fixture 편집, 좁은 Plugin 계약 helper/test-routing 편집**은 빠른 Node 전용 매니페스트 경로를 사용합니다: `preflight`, security, 단일 `checks-fast-core` 작업. 이 경로는 변경이 빠른 작업이 직접 실행하는 라우팅 또는 helper surface로 제한된 경우 빌드 산출물, Node 22 호환성, 채널 계약, 전체 core shard, 번들 Plugin shard, 추가 guard matrix를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, 패키지 매니저 config, 그리고 해당 lane을 실행하는 CI 워크플로 surface로 범위가 지정됩니다. 관련 없는 source, Plugin, install-smoke, 테스트 전용 변경은 Linux Node lane에 남습니다.

가장 느린 Node 테스트 계열은 각 작업이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분리되거나 균형 조정됩니다. 채널 계약은 세 개의 weighted shard로 실행되고, core unit fast/support lane은 별도로 실행되며, core runtime infra는 state와 process/config shard로 나뉘고, auto-reply는 균형 잡힌 worker로 실행됩니다(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분리). agentic gateway/server config는 빌드 산출물을 기다리는 대신 chat/auth/model/http-plugin/runtime/startup lane 전반에 분리됩니다. 광범위한 browser, QA, media, 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard 이름을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch coverage와 분리합니다. boundary guard 목록은 네 개의 matrix shard에 걸쳐 줄무늬로 나뉘며, 각 shard는 선택된 독립 guard를 동시에 실행하고 `pnpm prompt:snapshots:check`를 포함한 check별 timing을 출력하므로 Codex runtime happy-path prompt drift가 이를 유발한 PR에 고정됩니다. Gateway watch, 채널 테스트, core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 후 `build-artifacts` 내부에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 매니페스트가 없습니다. 이 단위 테스트 lane은 여전히 SMS/call-log BuildConfig flag로 flavor를 컴파일하면서, 모든 Android 관련 push에서 중복 debug APK packaging 작업을 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정된 프로덕션 Knip 의존성 전용 pass이며, `dlx` 설치를 위해 pnpm의 minimum release age가 비활성화됨)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 프로덕션 미사용 파일 발견 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. 미사용 파일 guard는 PR이 검토되지 않은 새 미사용 파일을 추가하거나 오래된 allowlist entry를 남길 때 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw 저장소 활동을 ClawSweeper로 보내는 target-side bridge입니다. 신뢰할 수 없는 풀 리퀘스트 코드를 checkout하거나 실행하지 않습니다. 이 워크플로는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음, compact `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

워크플로에는 네 개의 lane이 있습니다.

- 정확한 issue 및 풀 리퀘스트 review 요청용 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper command용 `clawsweeper_comment`;
- `main` push의 commit 수준 review 요청용 `clawsweeper_commit_review`;
- ClawSweeper agent가 살펴볼 수 있는 일반 GitHub 활동용 `github_activity`.

`github_activity` lane은 정규화된 metadata만 전달합니다: event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때의 짧은 발췌. 의도적으로 전체 webhook body 전달은 피합니다. `openclaw/clawsweeper`의 수신 워크플로는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 post합니다.

일반 활동은 관찰이며 기본 전달이 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받으며, 이벤트가 놀랍거나, 조치 가능하거나, 위험하거나, 운영상 유용할 때만 `#clawsweeper`에 post해야 합니다. 일상적인 open, edit, bot churn, 중복 webhook 잡음, 일반 review traffic은 `NO_REPLY`가 되어야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message를 신뢰할 수 없는 데이터로 취급하세요. 이들은 요약과 triage를 위한 입력이지 워크플로 또는 agent runtime에 대한 지침이 아닙니다.

## 수동 dispatch

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 레인을 강제로 켭니다: Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Control UI i18n. 독립 실행형 수동 CI 디스패치는 `include_android=true`일 때 Android만 실행하며, 전체 릴리스 엄브렐라는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin 사전 릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 배치 스위프, Plugin 사전 릴리스 Docker 레인은 CI에서 제외됩니다. Docker 사전 릴리스 스위트는 `Full Release Validation`이 릴리스 검증 게이트를 활성화한 상태로 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 스위트가 동일한 ref의 다른 push 또는 PR 실행에 의해 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰할 수 있는 호출자가 선택한 디스패치 ref의 워크플로 파일을 사용하면서 브랜치, 태그 또는 전체 커밋 SHA를 대상으로 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 집계, Node 테스트 집계 검증기, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하여 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있습니다 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 낮은 가중치의 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `check-additional` 샤드, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`(CPU에 충분히 민감해서 8 vCPU는 절약한 것보다 비용이 더 큼), install-smoke Docker 빌드(32-vCPU 큐 시간은 절약한 것보다 비용이 더 큼)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; 포크는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; 포크는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                      |

## 로컬 등가 명령

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
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 현재 워크플로 구현으로 릴리스 태그나 다른 브랜치를 벤치마크하려면 `target_ref`를 설정합니다. 게시된 보고서 경로와 latest 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, 레인 인증 모드, 모델, 반복 횟수, 시나리오 필터를 기록합니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 다음 세 개의 레인을 실행합니다:

- `mock-provider`: 결정론적 가짜 OpenAI 호환 인증이 있는 로컬 빌드 런타임을 대상으로 하는 Kova 진단 시나리오.
- `mock-deep-profile`: 시작, Gateway, agent-turn 핫스팟에 대한 CPU/heap/trace 프로파일링.
- `live-gpt54`: 실제 OpenAI `openai/gpt-5.4` 에이전트 턴. `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider 레인은 Kova 통과 후 OpenClaw 네이티브 소스 프로브도 실행합니다: 기본, hook, 50-Plugin 시작 사례 전반의 Gateway 부팅 시간 및 메모리, 반복되는 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway를 대상으로 하는 CLI 시작 명령. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 레인은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 엄브렐라 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 대상을 사용하는 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위해 `Plugin Prerelease`를 디스패치하며, 설치 스모크, 패키지 수락, 크로스 OS 패키지 검사, QA Lab 패리티, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다. Stable/default 실행은 `run_release_soak=true` 뒤에 포괄적인 라이브/E2E 및 Docker 릴리스 경로 커버리지를 유지합니다. `release_profile=full`은 광범위한 advisory 검증이 계속 광범위하게 유지되도록 해당 soak 커버리지를 강제로 켭니다. `rerun_group=all` 및 `release_profile=full`을 사용하면 릴리스 검사에서 나온 `release-package-under-test` 아티팩트를 대상으로 `NPM Telegram Beta E2E`도 실행합니다. 게시 후에는 `npm_telegram_package_spec`을 전달하여 게시된 npm 패키지를 대상으로 동일한 Telegram 패키지 레인을 다시 실행합니다.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트 및
집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을
참조하세요.

`OpenClaw Release Publish`는 변경을 수행하는 수동 릴리스 워크플로입니다. 릴리스 태그가 존재하고 OpenClaw npm preflight가 성공한 후 `release/YYYY.M.D` 또는 `main`에서 디스패치합니다. 이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해 `Plugin NPM Release`를 디스패치하며, 동일한 릴리스 SHA에 대해 `Plugin ClawHub Release`를 디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 브랜치에서 고정된 커밋 증명이 필요하면
`gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다. 헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 push하고, 해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 자식 워크플로의 `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 엄브렐라 검증기는 자식 워크플로가 다른 SHA에서 실행된 경우에도 실패합니다.

`release_profile`은 릴리스 검사에 전달되는 라이브/제공자 범위를 제어합니다. 수동 릴리스 워크플로는 기본값이 `stable`입니다. 광범위한 권고 제공자/미디어 매트릭스를 의도적으로 원할 때만 `full`을 사용하세요. `run_release_soak`은 안정/기본 릴리스 검사가 전체 라이브/E2E 및 Docker 릴리스 경로 soak를 실행할지 제어합니다. `full`은 soak를 강제로 켭니다.

- `minimum`은 가장 빠른 OpenAI/코어 릴리스 필수 레인을 유지합니다.
- `stable`은 안정 제공자/백엔드 세트를 추가합니다.
- `full`은 광범위한 권고 제공자/미디어 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하고 각 하위 실행의 가장 느린 작업 표를 덧붙입니다. 하위 워크플로를 다시 실행해 성공으로 바뀌면, 상위 검증 작업만 다시 실행해 상위 결과와 타이밍 요약을 새로 고치세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 항목만에는 `ci`, Plugin 시험판 하위 항목만에는 `plugin-prerelease`, 모든 릴리스 하위 항목에는 `release-checks`, 또는 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, 상위 워크플로의 `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다. 실패한 cross-OS 레인 하나의 경우 `rerun_group=cross-os`를 `cross_os_suite_filter`와 함께 사용하세요. 예: `windows/packaged-upgrade`. 긴 cross-OS 명령은 Heartbeat 줄을 출력하며, packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA 릴리스 검사 레인은 권고 성격이므로 QA 전용 실패는 경고만 하고 릴리스 검사 검증을 차단하지 않습니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 선택한 ref를 한 번만 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 cross-OS 검사와 패키지 승인, 그리고 soak 커버리지가 실행될 때 라이브/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고 여러 하위 작업에서 같은 후보를 다시 패킹하지 않아도 됩니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은 이전 상위 워크플로를 대체합니다. 상위 모니터는 상위 워크플로가 취소될 때 이미 디스패치한 모든 하위 워크플로를 취소하므로, 더 최신 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## 라이브 및 E2E 샤드

릴리스 라이브/E2E 하위 항목은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 단일 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름이 지정된 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 제공자 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 미디어 오디오/비디오 샤드 및 제공자 필터링된 음악 샤드

이렇게 하면 동일한 파일 커버리지를 유지하면서 느린 라이브 제공자 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 단발 재실행에도 계속 유효합니다.

네이티브 라이브 미디어 샤드는 `Live Media Runner Image` 워크플로에서 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 이 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치하며, 미디어 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 라이브 제품군은 일반 Blacksmith 러너에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 실행하기에 적절한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택된 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, 제공자 샤딩 Gateway, CLI 백엔드, ACP 바인드, Codex 하네스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 워크플로 작업 제한 시간보다 낮은 명시적 스크립트 수준 `timeout` 상한을 갖기 때문에, 멈춘 컨테이너나 정리 경로가 전체 릴리스 검사 예산을 소모하는 대신 빠르게 실패합니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며, 중복 이미지 빌드에 실제 시간이 낭비됩니다.

## 패키지 승인

“설치 가능한 OpenClaw 패키지가 제품으로 동작하는가?”가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, 패키지 승인은 설치 또는 업데이트 후 사용자가 실행하는 것과 같은 Docker E2E 하네스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰고, 둘 다 `package-under-test` 아티팩트로 업로드한 다음, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하고, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하며, 워크플로 체크아웃을 패킹하는 대신 해당 패키지에 대해 선택된 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 레인을 고유 아티팩트를 가진 병렬 대상 Docker 작업으로 분산합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, 패키지 승인이 패키지를 해석한 경우 같은 `package-under-test` 아티팩트를 설치합니다. 독립 실행 Telegram 디스패치는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 승인 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패 처리합니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 받습니다. 게시된 시험판/안정 승인에 사용하세요.
- `source=ref`는 신뢰된 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 검증하고, 분리된 worktree에 의존성을 설치한 뒤 `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`이 필요합니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부 공유 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰된 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이렇게 하면 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 오래된 신뢰된 소스 커밋을 검증할 수 있습니다.

### 제품군 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` 및 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필요

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로, 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 막히지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm spec 경로는 독립 실행 디스패치용으로 유지됩니다.

전용 업데이트 및 Plugin 테스트 정책, 로컬 명령, Docker 레인, 패키지 승인 입력, 릴리스 기본값, 실패 분류는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `telegram_mode=mock-openai`로 패키지 승인을 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명을 동일하게 해석된 패키지 tarball에서 유지합니다. SHA로 빌드한 아티팩트 대신 출시된 npm 패키지에 대해 같은 매트릭스를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에서 `package_acceptance_package_spec`을 설정하세요. Cross-OS 릴리스 검사는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 커버합니다. 패키지/업데이트 제품 검증은 패키지 승인에서 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행당 하나의 게시된 패키지 기준선을 검증합니다. 패키지 승인에서는 해석된 `package-under-test` tarball이 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`이 있는 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'`와 `published_upgrade_survivor_scenarios=reported-issues`를 설정해 최신 안정 npm 릴리스 네 개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, 물결표 로그 경로, 오래된 레거시 Plugin 의존성 루트에 대한 이슈 형태 fixture 전반으로 확장합니다. 다중 기준선 published-upgrade survivor 선택은 기준선별로 별도의 대상 Docker 러너 작업으로 샤딩됩니다. 별도 `Update Migration` 워크플로는 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리의 전체성이 질문일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 spec을 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 내장된 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, RPC 상태를 프로브합니다. Windows 패키징 및 설치 프로그램 fresh 레인도 설치된 패키지가 원시 절대 Windows 경로에서 브라우저 제어 override를 가져올 수 있는지 검증합니다. OpenAI cross-OS 에이전트 턴 smoke는 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용하므로 설치 및 Gateway 증명은 GPT-4.x 기본값을 피하면서 GPT-5 테스트 모델에 유지됩니다.

### 레거시 호환성 기간

패키지 승인에는 이미 게시된 패키지에 대해 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 tarball에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 tarball에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 제거할 수 있으며, 지속된 `update.channel` 누락을 로그로 남길 수 있습니다.
- Plugin smoke는 레거시 설치 기록 위치를 읽거나 마켓플레이스 설치 기록 지속성 누락을 허용할 수 있습니다.
- `plugin-update`는 설치 기록과 무재설치 동작이 변경되지 않아야 한다는 요구사항은 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 하며, 동일한 조건은 경고하거나 건너뛰는 대신 실패합니다.

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

실패한 패키지 승인 실행을 디버그할 때는 `resolve_package` 요약에서 시작하여 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트를 검사하세요: `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 스코프 스크립트를 재사용합니다. 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 핵심 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 풀 리퀘스트에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, agents delete 공유 워크스페이스 CLI 스모크를 실행하고, 컨테이너 Gateway 네트워크 E2E를 실행하고, 번들 확장 빌드 인자를 검증하며, 240초 집계 명령 제한 시간 안에서 제한된 번들 Plugin Docker 프로필을 실행합니다(각 시나리오의 Docker 실행은 별도로 제한됨).
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 확인, 실제로 설치 프로그램/패키지/Docker 표면을 건드리는 풀 리퀘스트를 위해 QR 패키지 설치와 설치 프로그램 Docker/update 커버리지를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지를 하나 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 프로그램/update 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 대기하지 않도록 합니다.

`main` 푸시(병합 커밋 포함)는 전체 경로를 강제하지 않습니다. 변경 스코프 로직이 푸시에서 전체 커버리지를 요청하더라도 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 이미지 제공자 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이는 야간 일정과 릴리스 확인 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치에서 선택적으로 포함할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. QR 및 설치 프로그램 Docker 테스트는 자체 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 live-test 이미지 하나를 미리 빌드하고, OpenClaw를 npm 타볼로 한 번 패킹하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- 설치 프로그램/update/Plugin 의존성 레인을 위한 기본 Node/Git 러너
- 일반 기능 레인을 위해 동일한 타볼을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 러너는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 메인 풀 슬롯 수.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 제공자에 민감한 테일 풀 슬롯 수.                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 제공자가 스로틀링하지 않도록 하는 동시 live 레인 상한.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간 지연 시간. 지연이 없도록 하려면 `0` 설정.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분). 선택된 live/테일 레인은 더 엄격한 상한을 사용합니다.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록. 에이전트가 실패한 레인 하나를 재현할 수 있도록 정리 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 비어 있는 풀에서는 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 내보내고, 가장 오래 걸린 순서대로 정렬하기 위해 레인 타이밍을 저장하며, 기본적으로 첫 실패 후에는 새 풀 레인 예약을 중단합니다.

### 재사용 가능한 live/E2E 워크플로

재사용 가능한 live/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, live 이미지, 레인, 자격 증명 커버리지를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. 그런 다음 타볼 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시하며, 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 pull은 제한된 180초의 시도별 제한 시간으로 재시도되므로, 멈춘 레지스트리/캐시 스트림이 CI 중요 경로의 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 커버리지는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하여 각 청크가 필요한 이미지 종류만 pull하고 동일한 가중치 스케줄러를 통해 여러 레인을 실행하게 합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/runtime 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 제공자 설치 프로그램 레인을 위한 집계 수동 재실행 별칭으로 남아 있습니다.

OpenWebUI는 전체 릴리스 경로 커버리지가 요청할 때 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에 대해서만 독립 `openwebui` 청크를 유지합니다. 번들 채널 update 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 테이블, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행하므로, 실패한 레인 디버깅을 하나의 대상 Docker 작업으로 제한하고 해당 실행을 위해 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 live Docker 레인이면 대상 작업은 해당 재실행을 위해 live-test 이미지를 로컬로 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 live/E2E 워크플로는 전체 릴리스 경로 Docker 제품군을 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 커버리지이므로 `Full Release Validation` 또는 명시적 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 수동 CI 디스패치는 해당 제품군을 비활성 상태로 유지합니다. 이는 번들 Plugin 테스트를 여덟 개 확장 워커에 걸쳐 균형 있게 배분합니다. 해당 확장 샤드 작업은 그룹당 Vitest 워커 하나와 더 큰 Node 힙을 사용하여 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하므로, import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않습니다. 릴리스 전용 Docker 사전 릴리스 경로는 수십 개의 러너를 1~3분짜리 작업에 예약하지 않도록 대상 Docker 레인을 작은 그룹으로 배치합니다.

## QA Lab

QA Lab에는 메인 스마트 스코프 워크플로 외부에 전용 CI 레인이 있습니다. 에이전트 패리티는 독립 PR 워크플로가 아니라 광범위 QA 및 릴리스 하네스 아래에 중첩됩니다. 패리티가 광범위한 검증 실행과 함께 이동해야 할 때는 `rerun_group=qa-parity`로 `Full Release Validation`을 사용하세요.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 야간으로, 그리고 수동 디스패치에서 실행됩니다. 이는 mock 패리티 레인, live Matrix 레인, live Telegram 및 Discord 레인을 병렬 작업으로 팬아웃합니다. live 작업은 `qa-live-shared` 환경을 사용하며, Telegram/Discord는 Convex lease를 사용합니다.

릴리스 확인은 결정론적 mock 제공자와 mock 한정 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram live 전송 레인을 실행하므로, 채널 계약이 live 모델 지연 시간 및 일반 제공자 Plugin 시작과 분리됩니다. live 전송 Gateway는 메모리 검색을 비활성화합니다. QA 패리티가 메모리 동작을 별도로 다루기 때문입니다. 제공자 연결성은 별도의 live 모델, 네이티브 제공자, Docker 제공자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 남아 있습니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`는 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인도 실행합니다. 해당 QA 패리티 게이트는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 패리티 비교를 위해 두 아티팩트를 작은 보고서 작업으로 다운로드합니다.

일반 PR의 경우, parity를 필수 상태로 취급하지 말고 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일, 수동, 비초안 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, 높음/위험 `security-severity`로 필터링된 신뢰도 높은 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, 또는 `src` 아래의 변경에 대해서만 시작되며, 예약된 워크플로와 동일한 신뢰도 높은 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에 포함되지 않습니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 시크릿, 샌드박스, cron, Gateway 기준선                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 시크릿, 감사 접점                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기, Plugin SDK SSRF 정책 표면                                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩, Plugin SDK 패키지 계약 신뢰 표면                         |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 sanity가 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링한 뒤 `/codeql-critical-security/macos` 아래에 업로드합니다. 깨끗한 상태에서도 macOS 빌드가 런타임을 지배하므로 일일 기본값 밖에 유지됩니다.

### 핵심 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux 러너에서 좁은 고가치 표면에 대해 오류 심각도만의 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 이 풀 리퀘스트 가드는 예약 프로필보다 의도적으로 더 작습니다. 비초안 PR은 에이전트 명령/모델/도구 실행 및 응답 디스패치 코드, 설정 스키마/마이그레이션/IO 코드, 인증/시크릿/샌드박스/보안 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 글루, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약, 또는 Plugin SDK 응답 런타임 변경에 대해 대응하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 설정 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 품질 샤드 하나를 격리해 실행하기 위한 교육/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 시크릿, 샌드박스, cron, Gateway 보안 경계 코드                                                                                                             |
| `/codeql-critical-quality/config-boundary`              | 설정 스키마, 마이그레이션, 정규화, IO 계약                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 응답 디스패치와 큐, ACP 제어 평면 런타임 계약                                                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 facade, 메모리 Plugin SDK alias, 메모리 런타임 활성화 글루, 메모리 doctor 명령                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면, 세션 doctor CLI 계약                                                   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청킹/런타임 헬퍼, 채널 응답 옵션, 전달 큐, 세션/스레드 바인딩 헬퍼                                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 검색, 제공자 런타임 등록, 제공자 기본값/카탈로그, 웹/검색/가져오기/임베딩 레지스트리                                       |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 영속성, Gateway 제어 흐름, 작업 제어 평면 런타임 계약                                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성, 미디어 생성 런타임 계약                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면, Plugin SDK 진입점 계약                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                                      |

품질은 보안과 분리되어 유지되므로, 품질 발견 사항을 보안 신호를 흐리지 않고 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정화된 후에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 반영된 변경과 기존 문서를 맞추기 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수한 일정은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있고, 수동 디스패치로 직접 실행할 수도 있습니다. 워크플로 실행 호출은 `main`이 이미 이동했거나 지난 한 시간 내에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전의 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 한 시간 단위 실행 하나가 마지막 문서 패스 이후 누적된 모든 main 변경을 처리할 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수한 일정은 없습니다. `main`에서 성공한 비봇 push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 보존하는 작은 테스트 성능 수정만 하도록 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패하는 테스트가 있는 경우 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서가 커밋 전에 통과해야 합니다. 봇 push가 반영되기 전에 `main`이 진행되면 이 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. 이 워크플로는 Codex 액션이 문서 에이전트와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 반영 후 중복 정리를 위한 수동 유지 관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에, 반영된 PR이 병합되었고 각 중복 항목에 공유 참조 이슈 또는 겹치는 변경 hunk가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 검사 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 prod 및 핵심 테스트 타입 검사를 핵심 lint/가드와 함께 실행합니다.
- 핵심 테스트 전용 변경은 핵심 테스트 타입 검사와 핵심 lint만 실행합니다.
- 확장 프로덕션 변경은 확장 prod 및 확장 테스트 타입 검사를 확장 lint와 함께 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입 검사와 확장 lint만 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 이러한 핵심 계약에 의존하므로 확장 타입 검사로 확장됩니다. Vitest 확장 스윕은 명시적인 테스트 작업으로 남습니다.
- 릴리스 메타데이터 전용 버전 범프는 대상이 지정된 버전/설정/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 모든 검사 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 자기 자신을 실행하고, 소스 편집은 명시적 매핑을 우선한 다음 형제 테스트와 import 그래프 의존 항목을 사용합니다. 공유 그룹 룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹 가시 응답 설정, 소스 응답 전달 모드, 또는 메시지 도구 시스템 프롬프트 변경은 핵심 응답 테스트와 Discord 및 Slack 전달 회귀를 통과하므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하네스 전체에 걸쳐 있어 저렴한 매핑 집합을 신뢰할 수 있는 프록시로 보기 어려운 경우에만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

광범위한 증거에는 저장소 루트에서 Testbox를 실행하고 새로 워밍된 박스를 선호하세요. 재사용되었거나 만료되었거나 방금 예상보다 큰 동기화를 보고한 박스에서 느린 게이트를 쓰기 전에, 먼저 박스 내부에서 `pnpm testbox:sanity`를 실행하세요.

정상성 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라졌거나 `git status --short`가 추적 중인 삭제를 200개 이상 표시하면 빠르게 실패합니다. 이는 보통 원격 동기화 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하는 대신 해당 박스를 중지하고 새 박스를 워밍하세요. 의도적인 대량 삭제 PR의 경우 해당 정상성 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 이 보호 장치를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하고, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

Crabbox는 유지관리자 Linux 증명을 위한 저장소 소유 원격 박스 래퍼입니다. 검사가 로컬 편집 루프에 비해 너무 광범위하거나, CI 동등성이 중요하거나, 증명에 시크릿, Docker, 패키지 레인, 재사용 가능한 박스, 원격 로그가 필요할 때 사용하세요. 일반 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제, 또는 명시적인 소유 용량 테스트를 위한 폴백입니다.

첫 실행 전에 저장소 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

저장소 래퍼는 `blacksmith-testbox`를 광고하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 공급자를 명시적으로 전달하세요.

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

전체 제품군:

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

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 일회성 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불분명하면 활성 박스를 검사하고 자신이 만든 박스만 중지하세요.

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

동일하게 준비된 박스에서 여러 명령이 의도적으로 필요할 때만 재사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 계층이 깨졌지만 Blacksmith 자체는 동작한다면, 좁은 폴백으로 직접 Blacksmith를 사용하세요.

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Blacksmith가 다운되었거나, 할당량 제한에 걸렸거나, 필요한 환경이 없거나, 소유 용량 자체가 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml`은 소유 클라우드 레인의 공급자, 동기화, GitHub Actions 하이드레이션 기본값을 소유합니다. 하이드레이션된 Actions 체크아웃이 유지관리자 로컬 원격과 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하도록 로컬 `.git`을 제외하며, 절대 전송하면 안 되는 로컬 런타임/빌드 산출물도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 체크아웃, Node/pnpm 설정, `origin/main` 가져오기, 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 비시크릿 환경 전달을 소유합니다.

## 관련 항목

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
