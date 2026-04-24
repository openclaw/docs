---
read_when:
    - CI 작업이 실행되었는지 또는 실행되지 않았는지 그 이유를 이해해야 합니다
    - 실패한 GitHub Actions 체크를 디버깅하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 그리고 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 관련 없는 영역만 변경되었을 때 비용이 큰 작업을 건너뛰기 위해 스마트 스코프 방식을 사용합니다.

QA Lab에는 메인 스마트 스코프 워크플로와 별도로 전용 CI 레인이 있습니다.  
`Parity gate` 워크플로는 일치하는 PR 변경사항과 수동 디스패치에서 실행되며, 비공개 QA 런타임을 빌드하고 mock GPT-5.4 및 Opus 4.6 agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 실행되고 수동 디스패치로도 실행되며, mock parity gate, live Matrix lane, live Telegram lane을 병렬 작업으로 fan-out합니다. live 작업은 `qa-live-shared` environment를 사용하고, Telegram lane은 Convex lease를 사용합니다. `OpenClaw Release Checks`도 릴리스 승인 전에 동일한 QA Lab 레인을 실행합니다.

`Duplicate PRs After Merge` 워크플로는 머지 이후 중복 항목 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며, `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub를 변경하기 전에, landed PR이 머지되었는지와 각 중복 PR에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지를 검증합니다.

`Docs Agent` 워크플로는 최근 머지된 변경사항에 맞춰 기존 문서를 유지하기 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없으며, `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있고 수동 디스패치로 직접 실행할 수도 있습니다. workflow-run 호출은 `main`이 이미 더 आगे로 진행되었거나 지난 1시간 내에 다른 non-skipped Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전 non-skipped Docs Agent source SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번의 실행으로 마지막 문서 패스 이후 누적된 모든 `main` 변경사항을 다룰 수 있습니다.

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지보수 레인입니다. 순수 스케줄은 없으며, `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 같은 UTC 날짜에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화된 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 유지하는 작은 테스트 성능 수정만 하도록 하며, 그다음 전체 스위트 보고서를 다시 실행하고 통과 기준선 테스트 수를 줄이는 변경을 거부합니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 이후 agent가 실행한 전체 스위트 보고서가 통과해야만 무엇이든 커밋됩니다. 봇 push가 반영되기 전에 `main`이 आगे로 진행되면, 이 레인은 검증된 패치를 rebase하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex action이 docs agent와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub-hosted Ubuntu를 사용합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 작업 개요

| Job                              | 목적                                                                                         | 실행 시점                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | docs-only 변경, 변경된 범위, 변경된 extension을 감지하고 CI manifest를 빌드                  | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-scm-fast`              | `zizmor`를 통한 private key 탐지 및 워크플로 감사                                            | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-dependency-audit`      | npm advisory를 기준으로 한 dependency-free 프로덕션 lockfile 감사                            | 모든 non-draft push 및 PR에서 항상 실행 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 aggregate                                                          | 모든 non-draft push 및 PR에서 항상 실행 |
| `build-artifacts`                | `dist/`, Control UI, built-artifact 검사, 재사용 가능한 downstream artifact 빌드             | Node 관련 변경 시                   |
| `checks-fast-core`               | bundled/plugin-contract/protocol 검사 같은 빠른 Linux 정확성 레인                            | Node 관련 변경 시                   |
| `checks-fast-contracts-channels` | 안정적인 aggregate check 결과를 가진 shard된 channel contract 검사                           | Node 관련 변경 시                   |
| `checks-node-extensions`         | extension suite 전반에 걸친 전체 bundled-plugin 테스트 shard                                 | Node 관련 변경 시                   |
| `checks-node-core-test`          | channel, bundled, contract, extension 레인을 제외한 core Node 테스트 shard                   | Node 관련 변경 시                   |
| `extension-fast`                 | 변경된 bundled plugin에 대해서만 수행하는 집중 테스트                                        | extension 변경이 있는 pull request  |
| `check`                          | shard된 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, guard, 테스트 타입, strict smoke    | Node 관련 변경 시                   |
| `check-additional`               | 아키텍처, 경계, extension-surface guard, package-boundary, gateway-watch shard               | Node 관련 변경 시                   |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 startup-memory smoke                                               | Node 관련 변경 시                   |
| `checks`                         | built-artifact channel 테스트와 push 전용 Node 22 호환성을 위한 verifier                     | Node 관련 변경 시                   |
| `check-docs`                     | 문서 포맷팅, lint, 깨진 링크 검사                                                             | docs 변경 시                        |
| `skills-python`                  | Python 기반 Skills용 Ruff + pytest                                                           | Python-skill 관련 변경 시           |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                      | Windows 관련 변경 시                |
| `macos-node`                     | 공유 built artifact를 사용하는 macOS TypeScript 테스트 레인                                  | macOS 관련 변경 시                  |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, 테스트                                                           | macOS 관련 변경 시                  |
| `android`                        | 두 flavor 모두에 대한 Android 단위 테스트와 하나의 debug APK 빌드                            | Android 관련 변경 시                |
| `test-performance-agent`         | 신뢰된 활동 이후의 일일 Codex 느린 테스트 최적화                                             | Main CI 성공 또는 수동 디스패치     |

## Fail-Fast 순서

작업은 값비싼 작업이 실행되기 전에 저렴한 검사가 실패하도록 순서가 정해져 있습니다.

1. `preflight`가 어떤 레인이 존재하는지 자체를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
4. 그 이후 더 무거운 플랫폼 및 런타임 레인이 fan-out됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

스코프 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.  
CI 워크플로 편집은 Node CI 그래프와 워크플로 linting을 검증하지만, 그것만으로 Windows, Android 또는 macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 여전히 플랫폼 소스 변경에만 스코프가 제한됩니다.  
Windows Node 검사는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 그리고 해당 레인을 실행하는 CI 워크플로 표면에 스코프가 제한됩니다. 관련 없는 소스, plugin, install-smoke, test-only 변경은 일반 테스트 shard로 이미 커버되는 범위를 위해 16-vCPU Windows 워커를 점유하지 않도록 Linux Node 레인에 남습니다.  
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 스코프 스크립트를 재사용합니다. 이 워크플로는 smoke 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 나눕니다. pull request는 Docker/package 표면, bundled plugin package/manifest 변경, 그리고 Docker smoke 작업이 실행하는 core plugin/channel/gateway/Plugin SDK 표면에 대해 fast path를 실행합니다. 소스 전용 bundled plugin 변경, test-only 편집, docs-only 편집은 Docker 워커를 점유하지 않습니다. fast path는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 검사하고, container gateway-network e2e를 실행하고, bundled extension build arg를 검증하며, 120초 명령 timeout 아래 bounded bundled-plugin Docker profile을 실행합니다. full path는 매일 밤 스케줄 실행, 수동 디스패치, workflow-call 릴리스 검사, 그리고 실제로 installer/package/Docker 표면을 건드리는 pull request에 대해 QR package install 및 installer Docker/update 커버리지를 유지합니다. merge commit을 포함한 `main` push는 full path를 강제하지 않습니다. changed-scope 로직이 push에서 full coverage를 요청하더라도, 워크플로는 fast Docker smoke를 유지하고 full install smoke는 nightly 또는 릴리스 검증에 맡깁니다. 느린 Bun global install image-provider smoke는 `run_bun_global_install_smoke`로 별도로 게이트됩니다. 이는 nightly 스케줄과 release checks 워크플로에서 실행되며, 수동 `install-smoke` 디스패치는 이를 선택적으로 포함할 수 있지만, pull request와 `main` push에서는 실행되지 않습니다. QR 및 installer Docker 테스트는 자체 install 중심 Dockerfile을 유지합니다. 로컬 `test:docker:all`은 하나의 공유 live-test 이미지와 하나의 공유 `scripts/e2e/Dockerfile` built-app 이미지를 미리 빌드한 뒤, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E smoke 레인을 병렬 실행합니다. 기본 main-pool 동시성 8은 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로, provider 민감 tail-pool 동시성 8은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`으로 조정합니다. 레인 시작은 로컬 Docker daemon create storm를 피하기 위해 기본적으로 2초 간격으로 stagger되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 또는 다른 밀리초 값으로 재정의할 수 있습니다. 로컬 aggregate는 기본적으로 첫 실패 이후 새로운 pooled lane 스케줄링을 중단하며, 각 lane에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의 가능한 120분 timeout이 있습니다. 재사용 가능한 live/E2E 워크플로는 Docker matrix 전에 SHA 태그된 GHCR Docker E2E 이미지를 하나 빌드하고 push한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 matrix를 실행하는 공유 이미지 패턴을 그대로 따릅니다. 스케줄된 live/E2E 워크플로는 전체 release-path Docker suite를 매일 실행합니다. 전체 bundled update/channel matrix는 반복적인 실제 npm update 및 doctor repair 패스를 수행하므로 여전히 manual/full-suite로 남아 있습니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 이를 실행합니다. 이 로컬 게이트는 넓은 CI 플랫폼 스코프보다 아키텍처 경계에 대해 더 엄격합니다. core 프로덕션 변경은 core 프로덕션 typecheck와 core 테스트를 실행하고, core test-only 변경은 core 테스트용 typecheck/tests만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension test-only 변경은 extension 테스트용 typecheck/tests만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 이러한 core 계약에 의존하므로 extension 검증까지 확장됩니다. 릴리스 메타데이터 전용 version bump는 대상이 좁혀진 version/config/root-dependency 검사를 실행합니다. 알 수 없는 root/config 변경은 안전을 위해 모든 레인으로 확장됩니다.

push에서는 `checks` matrix가 push 전용 `compat-node22` 레인을 추가합니다. pull request에서는 해당 레인이 건너뛰어지고, matrix는 일반 테스트/channel 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 과도하게 runner를 점유하지 않으면서도 작게 유지되도록 분할되거나 균형 조정됩니다. channel contract는 가중치 기반 3개 shard로 실행되고, bundled plugin 테스트는 6개의 extension worker에 걸쳐 균형 분산되며, 작은 core unit lane은 짝지어 실행되고, auto-reply는 6개의 아주 작은 worker 대신 균형 잡힌 3개의 worker로 실행되며, agentic gateway/plugin config는 built artifact를 기다리지 않고 기존 소스 전용 agentic Node 작업 전반에 분산됩니다. 광범위한 browser, QA, media, 기타 plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest config를 사용합니다. Extension shard 작업은 plugin config 그룹을 하나의 Vitest worker와 더 큰 Node heap으로 직렬 실행하므로, import가 많은 plugin 배치가 작은 CI runner를 과도하게 점유하지 않습니다. 광범위한 agents lane은 단일 느린 테스트 파일이 지배하는 형태가 아니라 import/스케줄링 지배형이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 infra core-runtime shard와 함께 실행되어 공유 runtime shard가 tail을 떠안지 않도록 합니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 runtime topology architecture를 gateway watch 커버리지와 분리합니다. boundary guard shard는 하나의 작업 안에서 작고 독립적인 guard를 동시에 실행합니다. Gateway watch, channel 테스트, core support-boundary shard는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되며, 가벼운 verifier 작업으로서 기존 체크 이름을 유지하면서 추가 Blacksmith worker 2개와 두 번째 artifact-consumer 대기열을 피합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 뒤 Play debug APK를 빌드합니다. third-party flavor는 별도의 source set이나 manifest가 없지만, 해당 단위 테스트 레인은 여전히 SMS/call-log BuildConfig 플래그로 그 flavor를 컴파일하면서, 모든 Android 관련 push마다 중복된 debug APK 패키징 작업은 피합니다.  
`extension-fast`는 push 실행에서 이미 전체 bundled plugin shard를 수행하므로 PR 전용입니다. 이렇게 하면 `checks-node-extensions`에 이미 포함된 커버리지를 위해 `main`에서 추가 Blacksmith worker를 점유하지 않으면서도 리뷰용 changed-plugin 피드백을 유지할 수 있습니다.

같은 PR 또는 `main` ref에 새로운 push가 도착하면 GitHub는 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref에 대한 최신 실행도 실패 중인 경우가 아니라면 이를 CI 잡음으로 취급하세요. Aggregate shard check는 `!cancelled() && always()`를 사용하므로, 전체 워크플로가 이미 대체된 뒤에는 대기열에 들어가지 않으면서도 정상적인 shard 실패는 계속 보고합니다.  
CI concurrency key는 버전이 지정된 형태(`CI-v7-*`)이므로, 이전 큐 그룹에 남아 있는 GitHub 측 zombie가 새로운 main 실행을 무기한 막을 수 없습니다.

## 러너

| Runner                           | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업 및 aggregate(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, shard된 channel contract 검사, lint를 제외한 `check` shard, `check-additional` shard 및 aggregate, Node 테스트 aggregate verifier, docs 검사, Python Skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub-hosted Ubuntu를 사용하므로 Blacksmith matrix가 더 일찍 대기열에 들어갈 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 shard, bundled plugin 테스트 shard, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`. 이 작업은 여전히 CPU 민감도가 높아서 8 vCPU는 절약보다 비용이 더 컸습니다. install-smoke Docker 빌드도 마찬가지로 32-vCPU는 절약보다 대기열 비용이 더 컸습니다                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; 포크는 `macos-latest`로 fallback                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; 포크는 `macos-latest`로 fallback                                                                                                                                                                                                                                                                                                                                                                                                  |

## 로컬 대응 항목

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기 검사
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 changed typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + shard된 lint + 병렬 빠른 guard
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 형식 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
node scripts/ci-run-timings.mjs <run-id>      # 총 소요 시간, 대기열 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 관련 항목

- [설치 개요](/ko/install)
- [릴리스 채널](/ko/install/development-channels)
