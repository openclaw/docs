---
read_when:
    - CI 작업이 실행되었는지 또는 실행되지 않았는지 그 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-25T18:18:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뛰도록 스마트 범위 지정(smart scoping)을 사용합니다.

QA Lab에는 메인 스마트 범위 지정 워크플로 밖에 전용 CI 레인이 있습니다.
`Parity gate` 워크플로는 일치하는 PR 변경 사항과 수동 디스패치에서 실행되며,
비공개 QA 런타임을 빌드하고 mock GPT-5.5 및 Opus 4.6
agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 매일 밤 `main`에서와
수동 디스패치에서 실행되며, mock parity gate, live Matrix 레인, live
Telegram 레인을 병렬 작업으로 fan-out합니다. live 작업은 `qa-live-shared`
environment를 사용하며, Telegram 레인은 Convex lease를 사용합니다. `OpenClaw Release
Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

`Duplicate PRs After Merge` 워크플로는 머지 후 중복 정리를 위한
메인터이너용 수동 워크플로입니다. 기본값은 dry-run이며,
`apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에,
머지된 PR이 실제로 병합되었는지와 각 중복 PR에
공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지를 확인합니다.

`Docs Agent` 워크플로는 최근 반영된 변경 사항에 맞춰 기존 문서를 유지하기 위한
이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄 실행은 없습니다. `main`에서
성공한 non-bot push CI 실행이 이를 트리거할 수 있고, 수동 디스패치로 직접
실행할 수도 있습니다. workflow-run 호출은 `main`이 이미 더 आगे 진행되었거나,
지난 1시간 내에 다른 non-skipped Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면,
이전 non-skipped Docs Agent source SHA부터 현재 `main`까지의 커밋 범위를
검토하므로, 시간당 한 번의 실행으로 마지막 docs pass 이후 `main`에 누적된
모든 변경 사항을 포함할 수 있습니다.

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex
유지보수 레인입니다. 순수 스케줄 실행은 없습니다. `main`에서 성공한 non-bot
push CI 실행이 이를 트리거할 수 있지만, 같은 UTC 날짜에 다른 workflow-run
호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동
게이트를 우회합니다. 이 레인은 전체 스위트 grouped Vitest 성능 리포트를
빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 유지하는 작은 테스트 성능
수정만 하도록 한 뒤, 전체 스위트 리포트를 다시 실행하고 통과 기준선 테스트 수를
줄이는 변경은 거부합니다. 기준선에 실패하는 테스트가 있으면, Codex는 명백한
실패만 수정할 수 있으며 after-agent 전체 스위트 리포트가 통과해야만 무엇이든
커밋됩니다. bot push가 반영되기 전에 `main`이 더 진행되면, 이 레인은 검증된
패치를 rebase하고, `pnpm check:changed`를 다시 실행한 뒤, push를 재시도합니다.
충돌하는 오래된 패치는 건너뜁니다. Codex action이 docs agent와 동일한
drop-sudo 안전성 자세를 유지할 수 있도록 GitHub-hosted Ubuntu를 사용합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 작업 개요

| 작업                             | 목적                                                                                         | 실행 시점                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | docs-only 변경, 변경된 범위, 변경된 extensions를 감지하고 CI manifest를 빌드                | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-scm-fast`              | `zizmor`를 통한 비공개 키 감지 및 워크플로 감사                                              | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-dependency-audit`      | npm advisory에 대한 dependency-free 프로덕션 lockfile 감사                                   | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 aggregate                                                         | 모든 non-draft push 및 PR에서 항상 실행 |
| `build-artifacts`                | `dist/`, Control UI, built-artifact 검사, 재사용 가능한 downstream artifact 빌드             | Node 관련 변경 시                   |
| `checks-fast-core`               | bundled/plugin-contract/protocol 검사와 같은 빠른 Linux 정확성 레인                          | Node 관련 변경 시                   |
| `checks-fast-contracts-channels` | 안정적인 aggregate check 결과를 갖는 sharded channel contract 검사                           | Node 관련 변경 시                   |
| `checks-node-extensions`         | extension suite 전반에 걸친 전체 bundled-plugin 테스트 shard                                | Node 관련 변경 시                   |
| `checks-node-core-test`          | channel, bundled, contract, extension 레인을 제외한 core Node 테스트 shard                  | Node 관련 변경 시                   |
| `extension-fast`                 | 변경된 bundled plugin만 대상으로 하는 집중 테스트                                            | extension 변경이 있는 pull request |
| `check`                          | sharded 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, guard, test types, strict smoke    | Node 관련 변경 시                   |
| `check-additional`               | architecture, boundary, extension-surface guard, package-boundary, gateway-watch shard       | Node 관련 변경 시                   |
| `build-smoke`                    | built-CLI smoke 테스트 및 startup-memory smoke                                               | Node 관련 변경 시                   |
| `checks`                         | built-artifact channel 테스트와 push 전용 Node 22 호환성을 위한 검증기                       | Node 관련 변경 시                   |
| `check-docs`                     | docs formatting, lint, broken-link 검사                                                      | docs 변경 시                        |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                           | Python-skill 관련 변경 시           |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                      | Windows 관련 변경 시                |
| `macos-node`                     | 공유 built artifact를 사용하는 macOS TypeScript 테스트 레인                                  | macOS 관련 변경 시                  |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드 및 테스트                                                        | macOS 관련 변경 시                  |
| `android`                        | 두 flavor 모두에 대한 Android 단위 테스트와 하나의 debug APK 빌드                            | Android 관련 변경 시                |
| `test-performance-agent`         | 신뢰된 활동 이후의 일일 Codex 느린 테스트 최적화                                             | Main CI 성공 또는 수동 디스패치     |

## 빠른 실패 순서

작업은 저렴한 검사가 비용이 큰 작업보다 먼저 실패하도록 정렬되어 있습니다.

1. `preflight`가 어떤 레인이 아예 존재하는지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 플랫폼 matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로, downstream consumer는 공유 빌드가 준비되는 즉시 시작할 수 있습니다.
4. 그 후 더 무거운 플랫폼 및 런타임 레인이 fan-out됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
CI 워크플로 수정은 Node CI 그래프와 워크플로 linting을 검증하지만, 그 자체만으로 Windows, Android, 또는 macOS 네이티브 빌드를 강제로 실행하지는 않습니다. 이러한 플랫폼 레인은 계속해서 플랫폼 소스 변경에만 범위가 지정됩니다.
CI 라우팅 전용 수정, 일부 저비용 core-test fixture 수정, 그리고 좁은 plugin contract helper/test-routing 수정은 빠른 Node 전용 manifest 경로를 사용합니다: preflight, security, 그리고 단일 `checks-fast-core` 작업입니다. 이 경로는 변경된 파일이 빠른 작업이 직접 실행하는 라우팅 또는 helper 표면에 제한될 때 build artifact, Node 22 호환성, channel contract, 전체 core shard, bundled-plugin shard, 추가 guard matrix를 피합니다.
Windows Node 검사는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 그리고 해당 레인을 실행하는 CI 워크플로 표면에 범위가 지정됩니다. 관련 없는 source, plugin, install-smoke, test 전용 변경은 Linux Node 레인에 남겨 두어, 일반 테스트 shard로 이미 검증되는 커버리지를 위해 16-vCPU Windows worker를 예약하지 않도록 합니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 이 워크플로는 smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다. pull request는 Docker/package 표면, bundled plugin package/manifest 변경, 그리고 Docker smoke 작업이 실행하는 core plugin/channel/gateway/Plugin SDK 표면에 대해 빠른 경로를 실행합니다. source 전용 bundled plugin 변경, test 전용 수정, docs 전용 수정은 Docker worker를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 검사하고, agents delete shared-workspace CLI smoke를 실행하고, container gateway-network e2e를 실행하고, bundled extension build arg를 검증하고, 각 시나리오의 Docker 실행 시간을 개별적으로 제한하면서 240초 집계 명령 타임아웃 아래에서 제한된 bundled-plugin Docker profile을 실행합니다. 전체 경로는 야간 스케줄 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 실제로 installer/package/Docker 표면을 건드리는 pull request에 대해 QR package install 및 installer Docker/update 커버리지를 유지합니다. merge commit을 포함한 `main` 푸시는 전체 경로를 강제하지 않습니다. changed-scope 로직이 푸시에서 전체 커버리지를 요청하더라도, 워크플로는 빠른 Docker smoke를 유지하고 전체 install smoke는 야간 또는 릴리스 검증에 맡깁니다. 느린 Bun global install image-provider smoke는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 smoke는 야간 스케줄과 릴리스 검사 워크플로에서 실행되며, 수동 `install-smoke` 디스패치에서는 선택적으로 포함할 수 있지만, pull request와 `main` 푸시에서는 실행되지 않습니다. QR 및 installer Docker 테스트는 각각 자체 install 중심 Dockerfile을 유지합니다. 로컬 `test:docker:all`은 공유 live-test 이미지 하나와 공유 `scripts/e2e/Dockerfile` built-app 이미지 하나를 미리 빌드한 다음, weighted scheduler 및 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E smoke 레인을 실행합니다. 기본 main-pool 슬롯 수 10은 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로, provider-sensitive tail-pool 슬롯 수 10은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`으로 조정할 수 있습니다. 무거운 레인 상한은 기본적으로 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`이며, 이를 통해 npm install 및 multi-service 레인이 Docker를 과도하게 점유하지 않으면서 더 가벼운 레인이 여전히 사용 가능한 슬롯을 채울 수 있습니다. 레인 시작은 로컬 Docker daemon의 create 폭주를 피하기 위해 기본적으로 2초 간격으로 stagger되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 또는 다른 밀리초 값으로 재정의할 수 있습니다. 로컬 집계 preflight는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 출력하고, longest-first 정렬을 위해 레인 시간을 유지하며, scheduler 점검용 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 지원합니다. 기본적으로 첫 실패 이후에는 새로운 pooled 레인을 스케줄링하지 않으며, 각 레인에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의 가능한 120분 fallback 타임아웃이 있습니다. 일부 live/tail 레인은 더 엄격한 레인별 상한을 사용합니다. 재사용 가능한 live/E2E 워크플로는 Docker matrix 전에 SHA 태그가 붙은 단일 GHCR Docker E2E 이미지를 빌드하고 푸시한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 matrix를 실행하는 방식으로 공유 이미지 패턴을 반영합니다. 스케줄된 live/E2E 워크플로는 전체 릴리스 경로 Docker 스위트를 매일 실행합니다. bundled update matrix는 update target별로 분할되어 반복되는 npm update 및 doctor repair 패스를 다른 bundled 검사와 함께 shard할 수 있습니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 이를 실행합니다. 이 로컬 게이트는 광범위한 CI 플랫폼 범위보다 architecture boundary에 대해 더 엄격합니다. core 프로덕션 변경은 core prod typecheck와 core 테스트를 실행하고, core test 전용 변경은 core test typecheck/tests만 실행하며, extension 프로덕션 변경은 extension prod typecheck와 extension 테스트를 실행하고, extension test 전용 변경은 extension test typecheck/tests만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 이러한 core contract에 의존하므로 extension 검증으로 확장됩니다. 릴리스 metadata 전용 버전 범프는 대상이 좁은 version/config/root-dependency 검사를 실행합니다. 알 수 없는 root/config 변경은 안전하게 모든 레인으로 실패 처리됩니다.

푸시에서는 `checks` matrix가 푸시 전용 `compat-node22` 레인을 추가합니다. pull request에서는 이 레인이 건너뛰어지고, matrix는 일반 테스트/channel 레인에 집중합니다.

가장 느린 Node 테스트 계열은 각 작업이 runner를 과도하게 예약하지 않으면서도 작게 유지되도록 분할되거나 균형이 조정됩니다. channel contract는 가중치가 적용된 세 개의 shard로 실행되고, bundled plugin 테스트는 여섯 개 extension worker에 걸쳐 균형을 맞추며, 작은 core unit 레인은 짝지어지고, auto-reply는 여섯 개의 매우 작은 worker 대신 균형 잡힌 세 개 worker로 실행되며, agentic gateway/plugin config는 built artifact를 기다리지 않고 기존 source 전용 agentic Node 작업 전반에 분산됩니다. 광범위한 browser, QA, media, 기타 plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest config를 사용합니다. extension shard 작업은 한 번에 최대 두 개의 plugin config group을 실행하며, group당 하나의 Vitest worker와 더 큰 Node heap을 사용하여 import가 많은 plugin batch가 추가 CI 작업을 만들지 않도록 합니다. 광범위한 agents 레인은 단일 느린 테스트 파일이 소유하는 형태가 아니라 import/scheduling 지배적이므로 공유 Vitest file-parallel scheduler를 사용합니다. `runtime-config`는 공유 runtime shard가 tail을 떠맡지 않도록 infra core-runtime shard와 함께 실행됩니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch 커버리지와 분리합니다. boundary guard shard는 작은 독립 guard를 하나의 작업 안에서 동시에 실행합니다. Gateway watch, channel 테스트, 그리고 core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 후 `build-artifacts` 내부에서 동시에 실행되며, 두 개의 추가 Blacksmith worker와 두 번째 artifact-consumer queue를 피하면서 기존 검사 이름을 가벼운 verifier 작업으로 유지합니다.
Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없지만, 해당 unit-test 레인은 SMS/call-log BuildConfig 플래그로 그 flavor를 계속 컴파일하면서도 모든 Android 관련 푸시마다 중복된 debug APK 패키징 작업은 피합니다.
`extension-fast`는 푸시 실행에서 이미 전체 bundled plugin shard를 실행하므로 PR 전용입니다. 이렇게 하면 `main`에서 이미 `checks-node-extensions`에 존재하는 커버리지를 위해 추가 Blacksmith worker를 예약하지 않으면서 리뷰용 changed-plugin 피드백을 유지할 수 있습니다.

GitHub는 같은 PR 또는 `main` ref에 더 새로운 푸시가 도착하면 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패하는 경우가 아니라면 이를 CI 잡음으로 취급하세요. 집계 shard 검사는 `!cancelled() && always()`를 사용하므로 전체 워크플로가 이미 대체된 후에는 대기열에 들어가지 않으면서도 일반적인 shard 실패는 계속 보고합니다.
CI 동시성 키는 버전 관리됩니다(`CI-v7-*`). 따라서 이전 queue group의 GitHub 측 zombie가 더 새로운 main 실행을 무기한 차단할 수 없습니다.

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, sharded channel contract 검사, lint를 제외한 `check` shard, `check-additional` shard 및 aggregate, Node 테스트 aggregate verifier, docs 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub-hosted Ubuntu를 사용하므로 Blacksmith matrix가 더 일찍 대기열에 들어갈 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 shard, bundled plugin 테스트 shard, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, 이는 여전히 CPU 민감도가 높아 8 vCPU가 절약한 것보다 비용이 더 컸습니다. install-smoke Docker 빌드도 마찬가지로 32-vCPU의 대기열 시간 비용이 절약 효과보다 더 컸습니다                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                             |

## 로컬 대응 항목

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: boundary 레인별 변경된 typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + sharded lint + 병렬 빠른 guard
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken link
pnpm build          # CI artifact/build-smoke 레인이 중요한 경우 dist 빌드
node scripts/ci-run-timings.mjs <run-id>      # 총 소요 시간, 대기열 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 관련 항목

- [설치 개요](/ko/install)
- [릴리스 채널](/ko/install/development-channels)
