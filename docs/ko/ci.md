---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하는 중입니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 엄브렐라, 상응하는 로컬 명령어
title: CI 파이프라인
x-i18n:
    generated_at: "2026-05-10T19:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 대한 모든 푸시와 모든 풀 리퀘스트에서 실행됩니다. `preflight` 작업은 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동 `workflow_dispatch` 실행은 의도적으로 스마트 스코프 지정을 우회하고 릴리스 후보와 광범위한 검증을 위해 전체 그래프로 확장됩니다. Android lane은 `include_android`를 통해 선택적으로만 실행됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin Prerelease`](#plugin-prerelease) 워크플로에 있으며, [`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 디스패치에서만 실행됩니다.

## 파이프라인 개요

| 작업                              | 목적                                                                                                   | 실행 시점                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 문서 전용 변경, 변경된 스코프, 변경된 extensions를 감지하고 CI 매니페스트를 빌드합니다                   | draft가 아닌 푸시와 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 개인 키 감지 및 워크플로 감사                                                     | draft가 아닌 푸시와 PR에서 항상 |
| `security-dependency-audit`      | npm 권고 사항을 기준으로 의존성 없이 프로덕션 lockfile을 감사합니다                                          | draft가 아닌 푸시와 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업의 필수 집계                                                             | draft가 아닌 푸시와 PR에서 항상 |
| `check-dependencies`             | 프로덕션 Knip 의존성 전용 패스와 미사용 파일 허용 목록 가드                                 | Node 관련 변경              |
| `build-artifacts`                | `dist/`, Control UI, 빌드된 아티팩트 검사, 재사용 가능한 downstream 아티팩트를 빌드합니다                       | Node 관련 변경              |
| `checks-fast-core`               | 번들/Plugin 계약/프로토콜 검사와 같은 빠른 Linux 정확성 lane                              | Node 관련 변경              |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과가 있는 샤딩된 채널 계약 검사                                      | Node 관련 변경              |
| `checks-node-core-test`          | 채널, 번들, 계약, extension lane을 제외한 Core Node 테스트 shard                          | Node 관련 변경              |
| `check`                          | 프로덕션 타입, lint, 가드, 테스트 타입, strict smoke를 포함한 샤딩된 기본 로컬 gate 동등 항목                | Node 관련 변경              |
| `check-additional`               | 아키텍처, 샤딩된 boundary/prompt drift, extension 가드, 패키지 boundary, Gateway watch        | Node 관련 변경              |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 startup-memory smoke                                                            | Node 관련 변경              |
| `checks`                         | 빌드된 아티팩트 채널 테스트용 검증기                                                                 | Node 관련 변경              |
| `checks-node-compat-node22`      | Node 22 호환성 빌드 및 smoke lane                                                                | 릴리스를 위한 수동 CI 디스패치    |
| `check-docs`                     | 문서 formatting, lint, broken-link 검사                                                             | 문서 변경                       |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                                    | Python Skill 관련 변경      |
| `checks-windows`                 | Windows 전용 프로세스/경로 테스트와 공유 runtime import specifier 회귀 검사                      | Windows 관련 변경           |
| `macos-node`                     | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 lane                                               | macOS 관련 변경             |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, 테스트                                                            | macOS 관련 변경             |
| `android`                        | 두 flavor의 Android 단위 테스트와 디버그 APK 빌드 하나                                              | Android 관련 변경           |
| `test-performance-agent`         | 신뢰된 활동 이후 매일 실행되는 Codex 느린 테스트 최적화                                                 | Main CI 성공 또는 수동 디스패치 |
| `openclaw-performance`           | mock-provider, deep-profile, GPT 5.4 live lane이 포함된 일일/온디맨드 Kova runtime 성능 보고서 | 예약 실행 및 수동 디스패치      |

## Fail-fast 순서

1. `preflight`는 어떤 lane이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
4. 이후 더 무거운 플랫폼 및 runtime lane이 확장됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

동일한 PR 또는 `main` ref에 새 푸시가 올라오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 동일 ref의 최신 실행도 실패하지 않는 한 이를 CI 노이즈로 취급하세요. 집계 shard 검사는 `!cancelled() && always()`를 사용하므로 일반 shard 실패는 계속 보고하지만, 전체 워크플로가 이미 대체된 뒤에는 queue에 넣지 않습니다. 자동 CI concurrency key는 버전이 지정되어 있으므로(`CI-v7-*`), 이전 queue group에 남은 GitHub 측 좀비가 새 main 실행을 무기한 막을 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

`ci-timings-summary` 작업은 draft가 아닌 각 CI 실행에 대해 compact한 `ci-timings-summary` 아티팩트를 업로드합니다. 현재 실행의 wall time, queue time, 가장 느린 작업, 실패한 작업을 기록하므로 CI 상태 검사가 전체 Actions payload를 반복적으로 scrape할 필요가 없습니다.

## 스코프와 라우팅

스코프 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 커버됩니다. 수동 디스패치는 changed-scope 감지를 건너뛰고 preflight 매니페스트가 모든 scoped 영역이 변경된 것처럼 동작하게 합니다.

- **CI 워크플로 편집**은 Node CI 그래프와 워크플로 linting을 검증하지만, 그 자체만으로 Windows, Android, macOS native 빌드를 강제하지 않습니다. 해당 플랫폼 lane은 플랫폼 source 변경으로만 스코프가 지정됩니다.
- **CI 라우팅 전용 편집, 선택된 저비용 Core 테스트 fixture 편집, 좁은 Plugin 계약 helper/test-routing 편집**은 빠른 Node 전용 매니페스트 경로를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 이 경로는 변경이 빠른 task가 직접 실행하는 라우팅 또는 helper surface에 한정된 경우 빌드 아티팩트, Node 22 호환성, 채널 계약, 전체 Core shard, 번들 Plugin shard, 추가 guard matrix를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 프로세스/경로 wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI 워크플로 surface로 스코프가 지정됩니다. 관련 없는 source, Plugin, install-smoke, 테스트 전용 변경은 Linux Node lane에 남습니다.

가장 느린 Node 테스트 family는 각 작업이 runner를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형이 맞춰져 있습니다. 채널 계약은 표준 GitHub runner fallback이 있는 세 개의 가중치 적용 Blacksmith 기반 shard로 실행되고, Core unit fast/support lane은 별도로 실행되며, Core runtime infra는 state, process/config, Cron, shared shard로 분할됩니다. auto-reply는 균형 잡힌 worker로 실행되고(reply subtree는 agent-runner, dispatch, commands/state-routing shard로 분할됨), agentic Gateway/server config는 빌드 아티팩트를 기다리는 대신 chat/auth/model/http-plugin/runtime/startup lane으로 나뉩니다. 광범위한 browser, QA, media 및 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern shard는 CI shard 이름을 사용해 timing entry를 기록하므로 `.artifacts/vitest-shard-timings.json`이 전체 config와 filtered shard를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 Gateway watch 커버리지와 분리합니다. boundary guard 목록은 네 개의 matrix shard에 걸쳐 스트라이핑되며, 각 shard는 선택된 독립 guard를 동시에 실행하고 check별 timing을 출력합니다. 비용이 큰 Codex happy-path prompt snapshot drift 검사는 수동 CI와 prompt에 영향을 주는 변경에 대해서만 자체 additional job으로 실행되므로, 일반적인 관련 없는 Node 변경은 cold prompt snapshot 생성을 기다리지 않고, boundary shard는 균형을 유지하며, prompt drift는 여전히 그 원인을 만든 PR에 고정됩니다. 동일한 flag는 built-artifact Core support-boundary shard 내부의 prompt snapshot Vitest 생성도 건너뜁니다. Gateway watch, 채널 테스트, Core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행됩니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 해당 unit-test lane은 여전히 SMS/call-log BuildConfig flag가 포함된 flavor를 컴파일하지만, Android 관련 푸시마다 중복 debug APK packaging job은 피합니다.

`check-dependencies` shard는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정되고 `dlx` 설치를 위해 pnpm의 minimum release age가 비활성화된 프로덕션 Knip 의존성 전용 패스)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 프로덕션 미사용 파일 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 새로 검토되지 않은 미사용 파일을 추가하거나 오래된 allowlist entry를 남겨둔 경우 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge surface는 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw repository 활동을 ClawSweeper로 보내는 대상 측 bridge입니다. 신뢰할 수 없는 pull request code를 checkout하거나 실행하지 않습니다. 이 workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음 compact한 `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

이 workflow에는 네 개의 lane이 있습니다.

- 정확한 issue 및 pull request review 요청용 `clawsweeper_item`;
- issue comment의 명시적인 ClawSweeper command용 `clawsweeper_comment`;
- `main` push의 commit-level review 요청용 `clawsweeper_commit_review`;
- ClawSweeper agent가 inspect할 수 있는 일반 GitHub activity용 `github_activity`.

`github_activity` lane은 정규화된 metadata만 전달합니다: event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있는 경우 짧은 excerpt. 의도적으로 전체 Webhook body 전달을 피합니다. `openclaw/clawsweeper`의 receiving workflow는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 게시합니다.

일반 활동은 관찰이지, 기본 전달이 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받으며, event가 예상 밖이거나, 실행 가능하거나, 위험하거나, 운영상 유용한 경우에만 `#clawsweeper`에 게시해야 합니다. 일상적인 open, edit, bot churn, duplicate Webhook noise, 일반 review traffic은 `NO_REPLY`가 되어야 합니다.

이 경로 전체에서 GitHub 제목, 댓글, 본문, 리뷰 텍스트, 브랜치 이름, 커밋 메시지를 신뢰할 수 없는 데이터로 취급하세요. 이들은 요약과 분류를 위한 입력이지, 워크플로 또는 에이전트 런타임에 대한 지침이 아닙니다.

## 수동 디스패치

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 레인을 강제로 켭니다. Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Control UI i18n이 포함됩니다. 독립 실행형 수동 CI 디스패치는 `include_android=true`일 때만 Android를 실행하며, 전체 릴리스 엄브렐라는 `include_android=true`를 전달하여 Android를 활성화합니다. Plugin 사전 릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 배치 스윕, Plugin 사전 릴리스 Docker 레인은 CI에서 제외됩니다. Docker 사전 릴리스 스위트는 `Full Release Validation`이 릴리스 검증 게이트를 활성화한 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 스위트가 같은 ref의 다른 푸시나 PR 실행에 의해 취소되지 않습니다. 선택 사항인 `target_ref` 입력을 사용하면 신뢰된 호출자가 선택한 디스패치 ref의 워크플로 파일을 사용하면서 브랜치, 태그 또는 전체 커밋 SHA를 대상으로 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 프로토콜/계약/번들 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 집계, Node 테스트 집계 검증기, 문서 검사, Python skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있습니다 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, 더 가벼운 확장 샤드, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node 테스트 샤드, 번들 Plugin 테스트 샤드, `check-additional` 샤드, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint`(CPU 민감도가 충분히 높아 8 vCPU가 절약한 것보다 더 많은 비용이 들었습니다), install-smoke Docker 빌드(32-vCPU 큐 시간이 절약한 것보다 더 많은 비용이 들었습니다)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; 포크는 `macos-latest`로 폴백합니다                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; 포크는 `macos-latest`로 폴백합니다                                                                                                                                                                                                                                                                                                                                                                                      |

정식 저장소 CI는 Blacksmith를 기본 러너 경로로 유지합니다. `preflight` 중에 `scripts/ci-runner-labels.mjs`는 최근 큐에 있거나 진행 중인 Actions 실행에서 큐에 들어간 Blacksmith 작업을 확인합니다. 특정 Blacksmith 라벨에 이미 큐에 들어간 작업이 있으면, 해당 정확한 라벨을 사용할 다운스트림 작업은 그 실행에서만 대응하는 GitHub 호스팅 러너(`ubuntu-24.04`, `windows-2025`, 또는 `macos-latest`)로 폴백합니다. 같은 OS 계열의 다른 Blacksmith 크기는 기본 라벨을 계속 사용합니다. API 프로브가 실패하면 폴백이 적용되지 않습니다.

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. `main`에서 매일 실행되며 수동으로 디스패치할 수 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 현재 워크플로 구현으로 릴리스 태그나 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 latest 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, 레인 인증 모드, 모델, 반복 횟수, 시나리오 필터를 기록합니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고, 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 다음 세 개의 레인을 실행합니다.

- `mock-provider`: 결정론적 가짜 OpenAI 호환 인증이 있는 로컬 빌드 런타임에 대한 Kova 진단 시나리오.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴 핫스팟에 대한 CPU/힙/트레이스 프로파일링.
- `live-gpt54`: 실제 OpenAI `openai/gpt-5.4` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider 레인은 Kova 통과 후 OpenClaw 네이티브 소스 프로브도 실행합니다. 기본, 훅, 50-Plugin 시작 사례 전반의 Gateway 부팅 타이밍과 메모리, 반복 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway에 대한 CLI 시작 명령이 포함됩니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 레인은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 “릴리스 전에 모든 것을 실행”하기 위한 수동 엄브렐라 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 대상을 지정한 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위한 `Plugin Prerelease`를 디스패치하며, install smoke, package acceptance, 크로스 OS 패키지 검사, QA Lab 동등성, Matrix, Telegram 레인을 위한 `OpenClaw Release Checks`를 디스패치합니다. 안정/기본 실행은 `run_release_soak=true` 뒤에 철저한 live/E2E 및 Docker 릴리스 경로 커버리지를 유지합니다. `release_profile=full`은 해당 soak 커버리지를 강제로 켜서 광범위한 권고 검증이 계속 광범위하게 유지되도록 합니다. `rerun_group=all` 및 `release_profile=full`과 함께 사용하면 릴리스 검사에서 나온 `release-package-under-test` 아티팩트를 대상으로 `NPM Telegram Beta E2E`도 실행합니다. 게시 후에는 `npm_telegram_package_spec`을 전달해 게시된 npm 패키지를 대상으로 같은 Telegram 패키지 레인을 다시 실행하세요.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트,
집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을
참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 워크플로입니다. 릴리스 태그가 존재하고
OpenClaw npm preflight가 성공한 후 `release/YYYY.M.D` 또는 `main`에서 디스패치하세요.
이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해
`Plugin NPM Release`를 디스패치하며, 같은 릴리스 SHA에 대해 `Plugin ClawHub Release`를 디스패치한 뒤,
그 후에야 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

빠르게 변경되는 브랜치에서 고정된 커밋 증명을 위해서는
`gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다.
헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고,
해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 하위
워크플로의 `headSha`가 대상과 일치하는지 확인하고, 실행이 완료되면
임시 브랜치를 삭제합니다. 엄브렐라 검증기도 하위 워크플로가 다른 SHA에서
실행된 경우 실패합니다.

`release_profile`은 릴리스 검사에 전달되는 라이브/제공자 범위를 제어합니다.
수동 릴리스 워크플로는 기본값이 `stable`입니다. 넓은 자문 제공자/미디어
매트릭스를 의도적으로 원할 때만 `full`을 사용하세요. `run_release_soak`은
stable/기본 릴리스 검사가 포괄적인 라이브/E2E 및 Docker 릴리스 경로 soak를
실행할지 제어합니다. `full`은 soak를 강제로 켭니다.

- `minimum`은 가장 빠른 OpenAI/코어 릴리스 필수 레인을 유지합니다.
- `stable`은 안정 제공자/백엔드 세트를 추가합니다.
- `full`은 넓은 자문 제공자/미디어 매트릭스를 실행합니다.

엄브렐라는 디스패치된 하위 실행 ID를 기록하고, 최종 `Verify full validation` 작업은 현재 하위 실행 결과를 다시 확인하며 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로가 재실행되어 성공 상태가 되면, 엄브렐라 결과와 타이밍 요약을 갱신하기 위해 부모 검증기 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks` 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 작업에만 `ci`, Plugin 시험판 하위 작업에만 `plugin-prerelease`, 모든 릴리스 하위 작업에는 `release-checks`, 또는 더 좁은 그룹인 엄브렐라의 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`을 사용하세요. 이렇게 하면 집중적인 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다. 실패한 cross-OS 레인이 하나라면 `rerun_group=cross-os`를 `cross_os_suite_filter`와 함께 사용하세요. 예: `windows/packaged-upgrade`; 긴 cross-OS 명령은 Heartbeat 줄을 내보내고 packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA 릴리스 검사 레인은 자문용이므로 QA 전용 실패는 경고하지만 릴리스 검사 검증기를 차단하지 않습니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용하여 선택한 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 cross-OS 검사와 패키지 승인, 그리고 soak 커버리지가 실행될 때 라이브/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 박스 전체에서 패키지 바이트가 일관되게 유지되고, 동일한 후보를 여러 하위 작업에서 다시 패키징하는 일을 피할 수 있습니다.

`ref=main` 및 `rerun_group=all`인 중복 `Full Release Validation` 실행은 이전 엄브렐라를 대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한 모든 하위 워크플로를 취소하므로, 최신 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## 라이브 및 E2E 샤드

릴리스 라이브/E2E 하위 작업은 넓은 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 명명된 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 제공자 필터가 적용된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 미디어 오디오/비디오 샤드와 제공자 필터가 적용된 음악 샤드

이렇게 하면 동일한 파일 커버리지를 유지하면서 느린 라이브 제공자 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에서도 계속 유효합니다.

네이티브 라이브 미디어 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 이 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. 미디어 작업은 설정 전에 바이너리만 확인합니다. Docker 기반 라이브 스위트는 일반 Blacksmith 러너에 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적절한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, 제공자별 Gateway 샤드, CLI 백엔드, ACP 바인드, Codex 하네스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 워크플로 작업 제한 시간보다 낮은 명시적 스크립트 수준 `timeout` 한도를 가지므로, 멈춘 컨테이너나 정리 경로가 전체 릴리스 검사 예산을 소비하지 않고 빠르게 실패합니다. 해당 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며, 중복 이미지 빌드에 실제 시간을 낭비하게 됩니다.

## 패키지 승인

“설치 가능한 OpenClaw 패키지가 제품으로서 작동하는가?”가 질문일 때 `Package Acceptance`를 사용하세요. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, 패키지 승인은 설치 또는 업데이트 후 사용자가 실행하는 것과 동일한 Docker E2E 하네스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 작성하고, `.artifacts/docker-e2e-package/package-candidate.json`을 작성하고, 둘 다 `package-under-test` 아티팩트로 업로드하며, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능한 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하고, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하며, 워크플로 체크아웃을 패키징하는 대신 해당 패키지를 대상으로 선택한 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능한 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 레인을 고유한 아티팩트가 있는 병렬 대상 Docker 작업으로 분산합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, 패키지 승인이 하나를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm spec을 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 승인, 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 받습니다. 게시된 시험판/안정판 승인에 사용하세요.
- `source=ref`는 신뢰된 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패키징합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 검증하고, 분리된 worktree에 deps를 설치한 다음 `scripts/package-openclaw-for-docker.mjs`로 패키징합니다.
- `source=url`은 HTTPS `.tgz`를 다운로드합니다. `package_sha256`이 필요합니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 `.tgz` 하나를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에 공유된 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 유지하세요. `workflow_ref`는 테스트를 실행하는 신뢰된 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패키징되는 소스 커밋입니다. 이를 통해 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 더 오래된 신뢰된 소스 커밋을 검증할 수 있습니다.

### 스위트 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package`에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`를 더함
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필요

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm spec 경로는 독립 실행형 디스패치용으로 유지됩니다.

로컬 명령, Docker 레인, 패키지 승인 입력, 릴리스 기본값, 실패 분류를 포함한 전용 업데이트 및 Plugin 테스트 정책은 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, `telegram_mode=mock-openai`로 패키지 승인을 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 라이브 ClawHub Skills 설치, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명이 동일하게 해석된 패키지 tarball에서 유지됩니다. SHA로 빌드된 아티팩트 대신 배송된 npm 패키지에 대해 동일한 매트릭스를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에서 `package_acceptance_package_spec`을 설정하세요. Cross-OS 릴리스 검사는 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 커버합니다. 패키지/업데이트 제품 검증은 패키지 승인부터 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행마다 게시된 패키지 기준선을 하나 검증합니다. 패키지 승인에서 해석된 `package-under-test` tarball은 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`인 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정하여 최신 안정 npm 릴리스 4개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, 틸드 로그 경로, 오래된 레거시 Plugin 의존성 루트를 위한 이슈 형태의 픽스처 전반으로 확장합니다. 다중 기준선 published-upgrade survivor 선택은 기준선별로 별도 대상 Docker 러너 작업에 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리를 포괄적으로 확인하는 것일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 spec을 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스용 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 구워진 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, RPC 상태를 탐지합니다. Windows 패키징 및 설치 프로그램 fresh 레인도 설치된 패키지가 원시 절대 Windows 경로에서 browser-control 오버라이드를 가져올 수 있는지 확인합니다. OpenAI cross-OS agent-turn smoke는 설정된 경우 기본값으로 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용하므로, 설치 및 Gateway 증명이 GPT-4.x 기본값을 피하면서 GPT-5 테스트 모델에 유지됩니다.

### 레거시 호환성 기간

패키지 수락에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 타르볼에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 타르볼에서 파생된 가짜 git fixture에서 누락된 `pnpm.patchedDependencies`를 제거할 수 있으며, 지속된 `update.channel` 누락을 로그로 남길 수 있습니다.
- Plugin 스모크는 레거시 설치 기록 위치를 읽거나 marketplace 설치 기록 지속성 누락을 허용할 수 있습니다.
- `plugin-update`는 설치 기록과 재설치 없음 동작이 변경되지 않아야 한다는 요구를 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지도 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 현대적 계약을 충족해야 하며, 같은 조건은 경고나 건너뛰기 대신 실패합니다.

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

실패한 패키지 수락 실행을 디버깅할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 자식 실행과 해당 Docker 아티팩트를 검사하세요. `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령이 포함됩니다. 전체 릴리스 검증을 다시 실행하기보다 실패한 패키지 프로필이나 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. 이 워크플로는 스모크 범위를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다.

- **빠른 경로**는 Docker/패키지 표면, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 핵심 Plugin/채널/Gateway/Plugin SDK 표면을 건드리는 풀 리퀘스트에서 실행됩니다. 소스만 변경된 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, agents delete 공유 작업 영역 CLI 스모크를 실행하고, 컨테이너 Gateway 네트워크 e2e를 실행하고, 번들 확장 빌드 인수를 검증하며, 240초 집계 명령 제한 시간 아래에서 제한된 번들 Plugin Docker 프로필을 실행합니다. 각 시나리오의 Docker 실행은 별도로 제한됩니다.
- **전체 경로**는 야간 예약 실행, 수동 디스패치, workflow-call 릴리스 확인, 그리고 설치 프로그램/패키지/Docker 표면을 실제로 건드리는 풀 리퀘스트를 위해 QR 패키지 설치와 설치 프로그램 Docker/업데이트 범위를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA GHCR 루트 Dockerfile 스모크 이미지 하나를 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 프로그램/업데이트 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하므로 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 대기하지 않습니다.

`main` 푸시(병합 커밋 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 범위를 요청하더라도, 워크플로는 빠른 Docker 스모크를 유지하고 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 image-provider 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 스모크는 야간 일정과 릴리스 확인 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치에서 선택할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. QR 및 설치 프로그램 Docker 테스트는 설치 중심 Dockerfile을 별도로 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 라이브 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm 타르볼로 한 번 패킹하며, 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 의존성 레인을 위한 기본 Node/Git 러너
- 일반 기능 레인을 위해 같은 타르볼을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 러너는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 메인 풀 슬롯 수.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 제공자 민감 테일 풀 슬롯 수.                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 제공자가 스로틀링하지 않도록 하는 동시 라이브 레인 상한.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 동시 npm 설치 레인 상한.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간격. 간격을 없애려면 `0`으로 설정합니다.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 폴백 제한 시간(120분). 선택된 라이브/테일 레인은 더 엄격한 상한을 사용합니다.          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`이면 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 레인 목록. 에이전트가 실패한 레인 하나를 재현할 수 있도록 정리 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 빈 풀에서 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 내보내고, 가장 오래 걸린 순서 정렬을 위해 레인 타이밍을 지속하며, 기본적으로 첫 번째 실패 후 새 풀링 레인 스케줄링을 중지합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 어떤 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 범위가 필요한지 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드합니다. 타르볼 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시합니다. 또한 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 pull은 시도당 180초의 제한된 제한 시간으로 재시도되므로, 멈춘 레지스트리/캐시 스트림이 CI 핵심 경로 대부분을 소비하는 대신 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 범위는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하므로 각 청크는 필요한 이미지 종류만 pull하고 같은 가중치 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/runtime 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 제공자 설치 프로그램 레인 모두에 대한 집계 수동 재실행 별칭으로 남아 있습니다.

전체 릴리스 경로 범위가 요청할 때 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에서만 독립 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행하므로, 실패 레인 디버깅을 하나의 대상 Docker 작업으로 제한하고 해당 실행의 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인인 경우 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로 실패한 레인이 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 전체 릴리스 경로 Docker 제품군을 매일 실행합니다.

## Plugin 사전 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 범위이므로, `Full Release Validation` 또는 명시적 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립 실행형 수동 CI 디스패치에서는 이 제품군을 끕니다. 이 워크플로는 번들 Plugin 테스트를 여덟 개 확장 워커에 분산합니다. 해당 확장 샤드 작업은 가져오기가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록, 그룹당 하나의 Vitest 워커와 더 큰 Node 힙으로 한 번에 최대 두 개의 Plugin 구성 그룹을 실행합니다. 릴리스 전용 Docker 사전 릴리스 경로는 1~3분짜리 작업을 위해 수십 개 러너를 예약하지 않도록 대상 Docker 레인을 작은 그룹으로 배치합니다.

## QA Lab

QA Lab에는 주요 스마트 범위 워크플로 외부에 전용 CI 레인이 있습니다. 에이전트 동등성은 독립형 PR 워크플로가 아니라 광범위한 QA 및 릴리스 하네스 아래에 중첩됩니다. 동등성이 광범위한 검증 실행과 함께 진행되어야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용하세요.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 야간에, 그리고 수동 디스패치에서 실행됩니다. 이 워크플로는 모의 동등성 레인, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 분산합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하고, Telegram/Discord는 Convex 임대를 사용합니다.

릴리스 검사는 결정론적 목 제공자와 목으로 한정된 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하여, 채널 계약을 라이브 모델 지연 시간과 일반적인 제공자-Plugin 시작에서 격리합니다. 라이브 전송 Gateway는 메모리 동작이 QA 패리티에서 별도로 다뤄지므로 메모리 검색을 비활성화합니다. 제공자 연결성은 별도의 라이브 모델, 네이티브 제공자, Docker 제공자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`는 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인도 실행합니다. QA 패리티 게이트는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 뒤, 최종 패리티 비교를 위한 작은 보고서 작업으로 두 아티팩트를 모두 다운로드합니다.

일반 PR의 경우 패리티를 필수 상태로 취급하지 말고 범위가 지정된 CI/검사 증거를 따르세요.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁게 설정된 1차 보안 스캐너입니다. 일별, 수동, 비초안 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 스캔하며, 높음/치명적 `security-severity`로 필터링된 높은 신뢰도의 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `src` 아래의 변경에 대해서만 시작되며, 예약 워크플로와 동일한 높은 신뢰도의 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 비밀, 샌드박스, Cron, Gateway 기준선                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약, 채널 Plugin 런타임, Gateway, Plugin SDK, 비밀, 감사 접점                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기, Plugin SDK SSRF 정책 표면                                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달, 에이전트 도구 실행 게이트                                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩, Plugin SDK 패키지 계약 신뢰 표면                         |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 정상성 검사가 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드는 깨끗한 상태에서도 런타임을 지배하므로 일별 기본값 밖에 둡니다.

### 치명적 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 더 작은 Blacksmith Linux 러너에서 좁고 가치가 높은 표면에 대해 오류 심각도의 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 예약 프로파일보다 의도적으로 더 작습니다. 비초안 PR은 에이전트 명령/모델/도구 실행 및 응답 디스패치 코드, 구성 스키마/마이그레이션/IO 코드, 인증/비밀/샌드박스/보안 코드, 핵심 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 글루, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약, 또는 Plugin SDK 응답 런타임 변경에 대해 일치하는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 구성 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로파일은 하나의 품질 샤드를 격리해 실행하기 위한 학습/반복 후크입니다.

| 범주                                                    | 표면                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 비밀, 샌드박스, Cron, Gateway 보안 경계 코드                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 구성 스키마, 마이그레이션, 정규화, IO 계약                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | 핵심 채널 및 번들 채널 Plugin 구현 계약                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 응답 디스패치 및 큐, ACP 제어 평면 런타임 계약                                                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버 및 도구 브리지, 프로세스 감독 헬퍼, 아웃바운드 전달 계약                                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 퍼사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 글루, 메모리 doctor 명령                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부 구조, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면, 세션 doctor CLI 계약                                              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청킹/런타임 헬퍼, 채널 응답 옵션, 전달 큐, 세션/스레드 바인딩 헬퍼                                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증 및 탐색, 제공자 런타임 등록, 제공자 기본값/카탈로그, 웹/검색/가져오기/임베딩 레지스트리                                      |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 지속성, Gateway 제어 흐름, 작업 제어 평면 런타임 계약                                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 핵심 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성, 미디어 생성 런타임 계약                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면, Plugin SDK 진입점 계약                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 Plugin 패키지 계약 헬퍼                                                                                                      |

품질은 보안과 별도로 유지되므로, 보안 신호를 흐리지 않고 품질 결과를 예약, 측정, 비활성화, 확장할 수 있습니다. Swift, Python, 번들 Plugin CodeQL 확장은 좁은 프로파일의 런타임과 신호가 안정화된 뒤에만 범위 지정 또는 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지보수 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 랜딩된 변경과 기존 문서를 정렬하기 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수한 일정은 없습니다. `main`에서 봇이 아닌 성공적인 푸시 CI 실행이 이를 트리거할 수 있으며, 수동 디스패치로 직접 실행할 수 있습니다. 워크플로 실행 호출은 `main`이 이미 앞으로 이동했거나 지난 1시간 동안 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번의 실행으로 마지막 문서 패스 이후 누적된 모든 main 변경을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수한 일정은 없습니다. `main`에서 봇이 아닌 성공적인 푸시 CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 제품군 그룹화 Vitest 성능 보고서를 만들고, Codex가 광범위한 리팩터링 대신 커버리지를 보존하는 작은 테스트 성능 수정만 하도록 한 뒤, 전체 제품군 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패한 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 제품군 보고서가 통과해야만 커밋할 수 있습니다. 봇 푸시가 랜딩되기 전에 `main`이 전진하면, 이 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 푸시를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. 이 레인은 GitHub 호스팅 Ubuntu를 사용하므로 Codex 액션은 docs agent와 동일한 sudo 제거 안전 태세를 유지할 수 있습니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 랜딩 후 중복 정리를 위한 수동 유지관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에, 랜딩된 PR이 병합되었고 각 중복 PR에 공유된 참조 이슈 또는 겹치는 변경 헝크가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 검사 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다.

- 핵심 프로덕션 변경은 핵심 프로덕션 및 핵심 테스트 타입체크와 핵심 린트/가드를 실행합니다.
- 핵심 테스트 전용 변경은 핵심 테스트 타입체크와 핵심 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입체크와 확장 린트를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입체크와 확장 린트를 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 해당 핵심 계약에 의존하므로 확장 타입체크까지 확장합니다(Vitest 확장 스윕은 명시적인 테스트 작업으로 유지).
- 릴리스 메타데이터 전용 버전 범프는 대상 버전/설정/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 실패하도록 모든 검사 레인으로 보냅니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며, 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 뒤 형제 테스트와 import 그래프 의존 대상을 사용합니다. 공유 그룹 룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹 표시 답장 설정, 소스 답장 전달 모드, 또는 메시지 도구 시스템 프롬프트 변경은 핵심 답장 테스트와 Discord 및 Slack 전달 회귀 테스트를 통과하므로, 공유 기본값 변경은 첫 PR 푸시 전에 실패합니다. 변경이 하네스 전반에 걸쳐 있어 저렴한 매핑 세트를 신뢰할 수 있는 대리 지표로 보기 어려울 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

repo 루트에서 Testbox를 실행하고, 광범위한 증명에는 새로 예열된 박스를 선호하세요. 재사용되었거나 만료되었거나 방금 예상보다 큰 동기화를 보고한 박스에 느린 게이트를 쓰기 전에, 먼저 박스 안에서 `pnpm testbox:sanity`를 실행하세요.

sanity 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라졌거나 `git status --short`가 추적된 삭제를 200개 이상 표시하면 빠르게 실패합니다. 이는 일반적으로 원격 동기화 상태가 PR의 신뢰할 수 있는 복사본이 아니라는 뜻입니다. 제품 테스트 실패를 디버깅하지 말고 해당 박스를 중지한 뒤 새 박스를 예열하세요. 의도적인 대규모 삭제 PR의 경우 해당 sanity 실행에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

`pnpm testbox:run`은 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 해당 가드를 비활성화하려면 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`을 설정하고, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

Crabbox는 maintainer Linux 증명을 위한 repo 소유 원격 박스 래퍼입니다. 검사가 로컬 편집 루프에 비해 너무 광범위하거나, CI 동등성이 중요하거나, 증명에 secrets, Docker, 패키지 레인, 재사용 가능한 박스, 원격 로그가 필요할 때 사용하세요. 일반 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제, 또는 명시적인 소유 용량 테스트를 위한 fallback입니다.

첫 실행 전에 repo 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo 래퍼는 `blacksmith-testbox`를 표시하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 provider를 명시적으로 전달하세요.

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 일회성 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불분명하면 라이브 박스를 검사하고 자신이 만든 박스만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일한 hydration된 박스에서 의도적으로 여러 명령이 필요할 때만 재사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 계층이 고장 났지만 Blacksmith 자체는 작동한다면, 제한적인 fallback으로 직접 Blacksmith를 사용하세요.

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all`과 `blacksmith testbox status`는 작동하지만 새 warmup이 몇 분 후에도 IP나 Actions 실행 URL 없이 `queued` 상태에 머무른다면, 이를 Blacksmith provider, 큐, 과금, 또는 조직 제한 압박으로 간주하세요. 자신이 만든 대기열 id를 중지하고, 더 많은 Testbox를 시작하지 말고, 누군가 Blacksmith 대시보드, 과금, 조직 제한을 확인하는 동안 아래의 소유 Crabbox 용량 경로로 증명을 옮기세요.

Blacksmith가 다운되었거나, 할당량 제한이 있거나, 필요한 환경이 없거나, 소유 용량이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압박 상황에서는 작업에 정말 48xlarge급 CPU가 필요한 경우가 아니라면 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며, 리전별 EC2 Spot 또는 On-Demand Standard 할당량을 건드리는 가장 쉬운 방법입니다. repo 소유 `.crabbox.yaml`의 기본값은 `standard`, 여러 용량 리전, `capacity.hints: true`이므로 중개된 AWS lease는 선택된 리전/마켓, 할당량 압박, Spot fallback, 고압박 class 경고를 출력합니다. 더 무거운 광범위 검사에는 `fast`를 사용하고, standard/fast로 충분하지 않을 때만 `large`를 사용하며, 전체 스위트나 전체 Plugin Docker 매트릭스, 명시적 릴리스/차단 검증, 고코어 성능 프로파일링 같은 예외적인 CPU 바운드 레인에만 `beast`를 사용하세요. `pnpm check:changed`, 집중 테스트, docs 전용 작업, 일반 린트/타입체크, 소규모 E2E 재현, 또는 Blacksmith 장애 triage에는 `beast`를 사용하지 마세요. 용량 진단에는 Spot 마켓 변동이 신호에 섞이지 않도록 `--market on-demand`를 사용하세요.

`.crabbox.yaml`은 소유 클라우드 레인의 provider, 동기화, GitHub Actions hydration 기본값을 소유합니다. 로컬 `.git`을 제외하므로 hydration된 Actions checkout은 maintainer 로컬 remotes 및 object stores를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하며, 절대 전송되어서는 안 되는 로컬 런타임/빌드 artifacts도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 checkout, Node/pnpm 설정, `origin/main` fetch, 그리고 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 non-secret 환경 handoff를 소유합니다.

## 관련 항목

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
