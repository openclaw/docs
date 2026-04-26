---
read_when:
    - CI 작업이 실행된 이유 또는 실행되지 않은 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 그리고 이에 해당하는 로컬 명령어
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-26T11:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. 스마트 범위 지정을 사용하여 변경 사항이 관련 없는 영역에만 있을 때는 비용이 큰 작업을 건너뜁니다.

QA Lab에는 메인 스마트 범위 워크플로 밖에 전용 CI 레인이 있습니다. `Parity gate` 워크플로는 일치하는 PR 변경 사항과 수동 디스패치에서 실행되며, 비공개 QA 런타임을 빌드하고 mock GPT-5.5 및 Opus 4.6 agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤과 수동 디스패치에서 실행되며, mock parity gate, live Matrix 레인, live Telegram 레인을 병렬 작업으로 팬아웃합니다. live 작업은 `qa-live-shared` 환경을 사용하고, Telegram 레인은 Convex lease를 사용합니다. `OpenClaw Release Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

`Duplicate PRs After Merge` 워크플로는 머지 후 중복 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에, landed PR이 머지되었는지와 각 중복 PR에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지를 검증합니다.

`Docs Agent` 워크플로는 최근에 반영된 변경 사항과 기존 문서를 계속 정렬 상태로 유지하기 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있고, 수동 디스패치로 직접 실행할 수도 있습니다. workflow-run 호출은 `main`이 이미 더 앞으로 진행되었거나 지난 1시간 내에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전의 건너뛰지 않은 Docs Agent source SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번의 실행으로 마지막 문서 패스 이후 `main`에 누적된 모든 변경 사항을 다룰 수 있습니다.

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 같은 UTC 날짜에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 유지하는 작은 테스트 성능 수정만 하도록 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준선 테스트 수를 줄이는 변경은 거부합니다. 기준선에 실패하는 테스트가 있으면, Codex는 명백한 실패만 수정할 수 있으며 변경 사항이 커밋되기 전에 에이전트 이후 전체 스위트 보고서가 통과해야 합니다. bot 푸시가 반영되기 전에 `main`이 더 진행되면, 이 레인은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 뒤 푸시를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. GitHub-hosted Ubuntu를 사용하므로 Codex action이 docs agent와 같은 drop-sudo 안전 상태를 유지할 수 있습니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 작업 개요

| 작업                             | 목적                                                                                         | 실행 시점                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | docs-only 변경, 변경된 범위, 변경된 extension을 감지하고 CI manifest를 빌드                  | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-scm-fast`              | `zizmor`를 통한 private key 탐지 및 워크플로 감사                                            | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-dependency-audit`      | npm advisory에 대한 dependency-free 프로덕션 lockfile 감사                                   | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 집계                                                              | 모든 non-draft push 및 PR에서 항상 실행 |
| `build-artifacts`                | `dist/`, Control UI, built-artifact 검사, 재사용 가능한 downstream artifact 빌드             | Node 관련 변경 시                   |
| `checks-fast-core`               | bundled/plugin-contract/protocol 검사 같은 빠른 Linux 정확성 레인                            | Node 관련 변경 시                   |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과를 가진 샤딩된 채널 계약 검사                                         | Node 관련 변경 시                   |
| `checks-node-extensions`         | extension 전체 스위트 전반에 대한 전체 번들 Plugin 테스트 샤드                              | Node 관련 변경 시                   |
| `checks-node-core-test`          | 채널, 번들, 계약, extension 레인을 제외한 core Node 테스트 샤드                             | Node 관련 변경 시                   |
| `extension-fast`                 | 변경된 번들 Plugin만을 대상으로 한 집중 테스트                                               | extension 변경이 있는 pull request에서 |
| `check`                          | 샤딩된 메인 로컬 게이트 동등 항목: 프로덕션 타입, lint, 가드, 테스트 타입, 엄격한 smoke     | Node 관련 변경 시                   |
| `check-additional`               | 아키텍처, 경계, extension-surface 가드, package-boundary, gateway-watch 샤드                 | Node 관련 변경 시                   |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 시작 메모리 smoke                                                 | Node 관련 변경 시                   |
| `checks`                         | built-artifact 채널 테스트와 push 전용 Node 22 호환성을 위한 검증기                          | Node 관련 변경 시                   |
| `check-docs`                     | 문서 포맷팅, lint, 깨진 링크 검사                                                            | 문서 변경 시                        |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                           | Python Skills 관련 변경 시          |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                     | Windows 관련 변경 시                |
| `macos-node`                     | 공유 built artifact를 사용하는 macOS TypeScript 테스트 레인                                 | macOS 관련 변경 시                  |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, 테스트                                                          | macOS 관련 변경 시                  |
| `android`                        | 두 flavor 모두에 대한 Android 단위 테스트 + 하나의 debug APK 빌드                            | Android 관련 변경 시                |
| `test-performance-agent`         | 신뢰된 활동 이후의 일일 Codex 느린 테스트 최적화                                             | Main CI 성공 또는 수동 디스패치 시  |

## Fail-fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 정해져 있습니다:

1. `preflight`가 어떤 레인이 아예 존재하는지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 step입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 플랫폼 matrix 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 downstream 소비자가 공유 빌드가 준비되는 즉시 시작할 수 있습니다.
4. 그 이후 더 무거운 플랫폼 및 런타임 레인이 팬아웃합니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
CI 워크플로 수정은 Node CI 그래프와 워크플로 lint를 검증하지만, 그 자체만으로 Windows, Android 또는 macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 계속 플랫폼 소스 변경에만 범위가 지정됩니다.
CI 라우팅 전용 수정, 일부 저비용 core-test fixture 수정, 그리고 좁은 plugin contract helper/test-routing 수정은 빠른 Node 전용 manifest 경로를 사용합니다: preflight, security, 그리고 단일 `checks-fast-core` 작업입니다. 이 경로는 변경 파일이 빠른 작업이 직접 실행하는 라우팅 또는 helper 표면으로 제한될 때 build artifact, Node 22 호환성, 채널 계약, 전체 core 샤드, bundled-plugin 샤드, 추가 가드 매트릭스를 피합니다.
Windows Node 검사는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, 패키지 매니저 구성, 그리고 해당 레인을 실행하는 CI 워크플로 표면에만 범위가 지정됩니다. 관련 없는 소스, Plugin, install-smoke, 테스트 전용 변경은 Linux Node 레인에 남아 있으므로, 일반 테스트 샤드에서 이미 실행되는 커버리지를 위해 16-vCPU Windows 워커를 예약하지 않습니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 이 워크플로는 smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다. pull request는 Docker/패키지 표면, bundled Plugin package/manifest 변경, 그리고 Docker smoke 작업이 실행하는 core Plugin/channel/Gateway/Plugin SDK 표면에 대해 빠른 경로를 실행합니다. 소스 전용 bundled Plugin 변경, 테스트 전용 수정, 문서 전용 수정은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 검사하고, agents delete shared-workspace CLI smoke를 실행하고, container gateway-network e2e를 실행하고, bundled extension build arg를 검증하고, 각 시나리오의 Docker run에 별도 제한을 두면서 240초 집계 명령 타임아웃 하에서 범위가 제한된 bundled-plugin Docker profile을 실행합니다. 전체 경로는 QR package install과 installer Docker/update 커버리지를 nightly scheduled run, manual dispatch, workflow-call release checks, 그리고 실제로 installer/package/Docker 표면을 건드리는 pull request에 대해 유지합니다. merge commit을 포함한 `main` 푸시는 전체 경로를 강제하지 않습니다. changed-scope 로직이 push에서 전체 커버리지를 요청하더라도, 워크플로는 빠른 Docker smoke만 유지하고 전체 install smoke는 nightly 또는 release validation에 맡깁니다. 느린 Bun global install image-provider smoke는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 작업은 nightly schedule과 release checks 워크플로에서 실행되며, 수동 `install-smoke` 디스패치에서는 선택적으로 활성화할 수 있지만, pull request와 `main` 푸시에서는 실행되지 않습니다. QR 및 installer Docker 테스트는 자체 install 중심 Dockerfile을 유지합니다. 로컬 `test:docker:all`은 공유 live-test 이미지 하나와 공유 `scripts/e2e/Dockerfile` built-app 이미지 하나를 미리 빌드한 다음, 가중치 기반 스케줄러와 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E smoke 레인을 실행합니다. 기본 main-pool 슬롯 수 10은 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로, provider-sensitive tail-pool 슬롯 수 10은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`으로 조정할 수 있습니다. 무거운 레인 상한은 기본적으로 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`이므로 npm install 및 다중 서비스 레인이 Docker를 과도하게 점유하지 않으면서 더 가벼운 레인은 사용 가능한 슬롯을 채울 수 있습니다. 레인 시작은 로컬 Docker 데몬의 create 폭주를 피하기 위해 기본적으로 2초 간격으로 지연되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 또는 다른 밀리초 값으로 재정의할 수 있습니다. 로컬 집계는 Docker를 preflight하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 출력하고, longest-first 정렬을 위해 레인 시간을 저장하며, 스케줄러 검사용 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 지원합니다. 기본적으로 첫 번째 실패 후에는 새로운 pooled lane 스케줄링을 중단하며, 각 레인에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있는 120분 fallback 타임아웃이 있습니다. 일부 live/tail 레인은 더 엄격한 레인별 상한을 사용합니다. 재사용 가능한 live/E2E 워크플로는 Docker matrix 전에 SHA 태그된 GHCR Docker E2E 이미지 하나를 빌드하고 푸시한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 matrix를 실행하는 공유 이미지 패턴을 동일하게 따릅니다. scheduled live/E2E 워크플로는 전체 release-path Docker 스위트를 매일 실행합니다. bundled update matrix는 업데이트 대상별로 분할되어, 반복되는 npm update 및 doctor repair 패스가 다른 bundled 검사와 샤딩될 수 있습니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`에 의해 실행됩니다. 이 로컬 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다. core 프로덕션 변경은 core 프로덕션 typecheck와 core 테스트를 실행하고, core 테스트 전용 변경은 core 테스트 typecheck/tests만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension 테스트 전용 변경은 extension 테스트 typecheck/tests만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 해당 core 계약에 의존하므로 extension 검증으로 확장됩니다. 릴리스 메타데이터 전용 버전 범프는 대상 버전/config/root-dependency 검사만 실행합니다. 알 수 없는 root/config 변경은 안전하게 모든 레인으로 실패 처리됩니다.

push에서는 `checks` matrix에 push 전용 `compat-node22` 레인이 추가됩니다. pull request에서는 이 레인이 건너뛰어지고 matrix는 일반 테스트/채널 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 너무 커지지 않도록 분할 또는 균형 조정됩니다. 채널 계약은 가중치가 적용된 세 개의 샤드로 실행되고, bundled Plugin 테스트는 여섯 개의 extension 워커에 균등 분배되며, 작은 core unit 레인은 짝지어지고, auto-reply는 답장 하위 트리가 agent-runner, dispatch, commands/state-routing 샤드로 분할된 네 개의 균형 워커로 실행되며, agentic Gateway/Plugin 구성은 built artifact를 기다리지 않고 기존 소스 전용 agentic Node 작업 전반에 분산됩니다. 광범위한 browser, QA, media, 기타 Plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest 구성을 사용합니다. extension shard 작업은 import가 무거운 Plugin 배치가 추가 CI 작업을 만들지 않도록 한 번에 최대 두 개의 Plugin config group을 실행하며, 각 group에는 하나의 Vitest worker와 더 큰 Node heap을 사용합니다. 광범위한 agents 레인은 단일 느린 테스트 파일이 아니라 import/스케줄링 지배형이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 공유 runtime 샤드가 tail을 차지하지 않도록 infra core-runtime 샤드와 함께 실행됩니다. include-pattern 샤드는 CI shard name을 사용해 timing 항목을 기록하므로 `.artifacts/vitest-shard-timings.json`에서 전체 config와 필터링된 샤드를 구분할 수 있습니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch 커버리지와 분리합니다. boundary guard shard는 하나의 작업 내부에서 작은 독립 가드를 동시에 실행합니다. Gateway watch, 채널 테스트, core support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되어, 두 개의 추가 Blacksmith worker와 두 번째 artifact-consumer queue를 피하면서 기존 검사 이름을 가벼운 verifier 작업으로 유지합니다.
Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set 또는 manifest가 없지만, 그 단위 테스트 레인은 여전히 SMS/call-log BuildConfig 플래그로 해당 flavor를 컴파일하면서, 모든 Android 관련 push마다 중복 debug APK 패키징 작업은 피합니다.
`extension-fast`는 push 실행에서 이미 전체 bundled Plugin 샤드를 실행하므로 PR 전용입니다. 이렇게 하면 `checks-node-extensions`에 이미 포함된 커버리지를 위해 `main`에서 추가 Blacksmith worker를 예약하지 않으면서, 리뷰를 위한 changed-plugin 피드백을 유지할 수 있습니다.

GitHub는 동일한 PR 또는 `main` ref에 새 푸시가 도착하면 대체된 작업을 `cancelled`로 표시할 수 있습니다. 동일한 ref의 최신 실행도 실패하는 경우가 아니라면 이를 CI 잡음으로 취급하세요. 집계 shard 검사는 `!cancelled() && always()`를 사용하므로, 전체 워크플로가 이미 대체되었을 때는 큐에 들어가지 않으면서도 일반 shard 실패는 계속 보고합니다.
CI 동시성 키는 버전이 지정되어(`CI-v7-*`) 있으므로, 이전 큐 그룹의 GitHub 측 좀비 작업이 새로운 main 실행을 무기한 차단할 수 없습니다.

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 집계(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, 샤딩된 채널 계약 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드 및 집계, Node 테스트 집계 verifier, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight도 GitHub-hosted Ubuntu를 사용하므로 Blacksmith matrix가 더 일찍 큐에 들어갈 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, bundled Plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`. 이 작업은 여전히 CPU 민감도가 높아서 8 vCPU는 절약 효과보다 비용이 더 컸습니다. install-smoke Docker 빌드도 여기에 해당하며, 32-vCPU는 절약 효과보다 큐 대기 비용이 더 컸습니다                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`의 `macos-node`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`의 `macos-swift`; fork는 `macos-latest`로 대체됩니다                                                                                                                                                                                                                                                                                                                                                                                                 |

## 로컬 동등 명령

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 changed typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 가드
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 문서 포맷 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
pnpm ci:timings                               # 최신 origin/main push CI 실행 요약
pnpm ci:timings:recent                        # 최근 성공한 main CI 실행 비교
node scripts/ci-run-timings.mjs <run-id>      # 총 소요 시간, 큐 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --latest-main # 이슈/댓글 잡음을 무시하고 origin/main push CI 선택
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 관련 항목

- [설치 개요](/ko/install)
- [릴리스 채널](/ko/install/development-channels)
