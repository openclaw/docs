---
read_when:
    - 특정 CI 작업이 왜 실행되었는지 또는 왜 실행되지 않았는지 이해해야 합니다.
    - 실패한 GitHub Actions 체크를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 그리고 이에 대응하는 로컬 명령어들
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-23T13:59:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뛰도록 스마트 스코핑을 사용합니다.

QA Lab에는 메인 스마트 스코프 워크플로 밖에 전용 CI 레인이 있습니다.
`Parity gate` 워크플로는 일치하는 PR 변경과 수동 디스패치에서 실행되며,
비공개 QA 런타임을 빌드하고 mock GPT-5.4 및 Opus 4.6
agentic pack을 비교합니다. `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 실행되고
수동 디스패치로도 실행되며, mock parity gate, live Matrix 레인, live
Telegram 레인을 병렬 작업으로 팬아웃합니다. live 작업은 `qa-live-shared`
environment를 사용하고, Telegram 레인은 Convex lease를 사용합니다. `OpenClaw Release
Checks`도 릴리스 승인 전에 동일한 QA Lab 레인들을 실행합니다.

## 작업 개요

| 작업                             | 목적                                                                                         | 실행 시점                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | docs-only 변경, 변경된 범위, 변경된 extension을 감지하고 CI manifest를 빌드                 | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-scm-fast`              | `zizmor`를 통한 private key 감지 및 워크플로 감사                                            | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-dependency-audit`      | npm advisory에 대한 dependency-free 프로덕션 lockfile 감사                                  | 초안이 아닌 모든 push 및 PR에서 항상 |
| `security-fast`                  | 빠른 보안 작업을 위한 필수 aggregate                                                         | 초안이 아닌 모든 push 및 PR에서 항상 |
| `build-artifacts`                | `dist/`, Control UI, 빌드 산출물 검사, 재사용 가능한 다운스트림 산출물 빌드                 | Node 관련 변경 시                    |
| `checks-fast-core`               | bundled/plugin-contract/protocol 검사 같은 빠른 Linux 정확성 레인                           | Node 관련 변경 시                    |
| `checks-fast-contracts-channels` | 안정적인 aggregate 체크 결과를 위한 샤딩된 채널 contract 검사                               | Node 관련 변경 시                    |
| `checks-node-extensions`         | extension 스위트 전반에 걸친 전체 bundled-plugin 테스트 샤드                                | Node 관련 변경 시                    |
| `checks-node-core-test`          | 채널, bundled, contract, extension 레인을 제외한 코어 Node 테스트 샤드                      | Node 관련 변경 시                    |
| `extension-fast`                 | 변경된 bundled plugin만을 대상으로 한 집중 테스트                                           | extension 변경이 있는 pull request   |
| `check`                          | 샤딩된 메인 로컬 게이트 대응: 프로덕션 타입, lint, 가드, 테스트 타입, 엄격한 smoke          | Node 관련 변경 시                    |
| `check-additional`               | 아키텍처, 경계, extension-surface 가드, package-boundary, gateway-watch 샤드                | Node 관련 변경 시                    |
| `build-smoke`                    | 빌드된 CLI smoke 테스트 및 시작 메모리 smoke                                                | Node 관련 변경 시                    |
| `checks`                         | 빌드 산출물 채널 테스트 및 push 전용 Node 22 호환성 검증기                                  | Node 관련 변경 시                    |
| `check-docs`                     | 문서 포맷팅, lint, 깨진 링크 검사                                                            | docs 변경 시                         |
| `skills-python`                  | Python 기반 Skills에 대한 Ruff + pytest                                                     | Python skill 관련 변경 시            |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                     | Windows 관련 변경 시                 |
| `macos-node`                     | 공유 빌드 산출물을 사용하는 macOS TypeScript 테스트 레인                                    | macOS 관련 변경 시                   |
| `macos-swift`                    | macOS 앱에 대한 Swift lint, 빌드, 테스트                                                     | macOS 관련 변경 시                   |
| `android`                        | 두 flavor 모두에 대한 Android 단위 테스트 및 디버그 APK 하나 빌드                           | Android 관련 변경 시                 |

## Fail-Fast 순서

작업은 저렴한 검사가 비용이 큰 작업보다 먼저 실패하도록 정렬되어 있습니다.

1. `preflight`가 어떤 레인이 아예 존재할지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 step입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 산출물 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 다운스트림 소비자가 시작할 수 있습니다.
4. 그다음 더 무거운 플랫폼 및 런타임 레인이 팬아웃합니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR 전용 `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
CI 워크플로 편집은 Node CI 그래프와 워크플로 linting은 검증하지만, 그 자체로 Windows, Android, macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 계속 플랫폼 소스 변경에만 스코프됩니다.
Windows Node 체크는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager 구성, 그리고 해당 레인을 실행하는 CI 워크플로 surface에 스코프됩니다. 관련 없는 소스, plugin, install-smoke, test-only 변경은 일반 테스트 샤드에서 이미 커버되는 검증을 위해 16-vCPU Windows worker를 점유하지 않도록 Linux Node 레인에 남겨 둡니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로, Docker/install smoke는 install, packaging, container 관련 변경, bundled extension 프로덕션 변경, 그리고 Docker smoke 작업이 실행하는 코어 plugin/channel/gateway/Plugin SDK surface에 대해 실행됩니다. test-only 및 docs-only 수정은 Docker worker를 점유하지 않습니다. 해당 QR package smoke는 BuildKit pnpm store 캐시는 유지하면서 Docker `pnpm install` 레이어를 강제로 다시 실행하므로, 매 실행마다 dependency를 다시 다운로드하지 않으면서도 설치를 계속 검증합니다. 해당 gateway-network e2e는 작업 초반에 빌드한 런타임 이미지를 재사용하므로, Docker 빌드를 하나 더 추가하지 않고도 실제 컨테이너 간 WebSocket 커버리지를 더합니다. 로컬 `test:docker:all`은 공유 live-test 이미지 하나와 공유 `scripts/e2e/Dockerfile` built-app 이미지 하나를 미리 빌드한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 live/E2E smoke 레인을 병렬 실행합니다. 기본 동시성 4는 `OPENCLAW_DOCKER_ALL_PARALLELISM`으로 조정하세요. 로컬 aggregate는 기본적으로 첫 실패 이후 새 pooled 레인 스케줄링을 중단하며, 각 레인에는 120분 타임아웃이 있고 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 시작 또는 provider에 민감한 레인은 병렬 풀 이후에 독점적으로 실행됩니다. 재사용 가능한 live/E2E 워크플로도 공유 이미지 패턴을 따르며, Docker 매트릭스 전에 SHA 태그가 붙은 GHCR Docker E2E 이미지를 하나 빌드 및 푸시한 다음 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 매트릭스를 실행합니다. 예약된 live/E2E 워크플로는 전체 릴리스 경로 Docker 스위트를 매일 실행합니다. QR 및 installer Docker 테스트는 설치 중심의 자체 Dockerfile을 유지합니다. 별도의 `docker-e2e-fast` 작업은 120초 명령 타임아웃 하에서 범위가 제한된 bundled-plugin Docker 프로파일을 실행합니다: setup-entry dependency 복구와 synthetic bundled-loader 실패 격리입니다. 전체 bundled update/channel 매트릭스는 반복적인 실제 npm update 및 doctor repair 패스를 수행하므로 수동/전체 스위트로 유지됩니다.

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`로 실행됩니다. 이 로컬 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 더 엄격합니다. 코어 프로덕션 변경은 코어 프로덕션 typecheck와 코어 테스트를 실행하고, 코어 test-only 변경은 코어 테스트 typecheck/테스트만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension test-only 변경은 extension 테스트 typecheck/테스트만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 해당 코어 contract에 의존하므로 extension 검증으로 확장됩니다. 릴리스 메타데이터만 포함된 버전 증가 변경은 대상이 좁은 version/config/root-dependency 검사를 실행합니다. 알 수 없는 root/config 변경은 안전을 위해 모든 레인으로 실패 처리됩니다.

push에서는 `checks` 매트릭스에 push 전용 `compat-node22` 레인이 추가됩니다. pull request에서는 이 레인이 건너뛰어지고, 매트릭스는 일반 테스트/채널 레인에 집중합니다.

가장 느린 Node 테스트 계열은 각 작업이 작게 유지되도록 분할 또는 균형 조정됩니다. 채널 contract는 registry와 코어 커버리지를 총 여섯 개의 가중 샤드로 분할하고, bundled plugin 테스트는 여섯 개의 extension worker에 균형 있게 배분되며, auto-reply는 여섯 개의 작은 worker 대신 균형 잡힌 세 개의 worker로 실행되고, agentic gateway/plugin config는 빌드 산출물을 기다리는 대신 기존 소스 전용 agentic Node 작업에 분산됩니다. 광범위한 browser, QA, media, 기타 plugin 테스트는 공유 plugin catch-all 대신 전용 Vitest config를 사용합니다. 광범위한 agents 레인은 단일 느린 테스트 파일이 소유하는 형태가 아니라 import/스케줄링 지배형이므로 공유 Vitest 파일 병렬 스케줄러를 사용합니다. `runtime-config`는 공유 런타임 샤드가 꼬리를 소유하지 않도록 infra core-runtime 샤드와 함께 실행됩니다. `check-additional`은 package-boundary compile/canary 작업을 함께 유지하고 런타임 topology 아키텍처를 gateway watch 커버리지와 분리합니다. boundary guard 샤드는 그 안의 작은 독립 가드를 하나의 작업 내부에서 동시에 실행합니다. Gateway watch, 채널 테스트, 코어 support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 내부에서 동시에 실행되며, 두 개의 추가 Blacksmith worker와 두 번째 산출물 소비자 큐를 피하면서도 기존 체크 이름을 가벼운 verifier 작업으로 유지합니다.
Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play 디버그 APK를 빌드합니다. third-party flavor에는 별도의 소스 세트나 manifest가 없지만, 해당 단위 테스트 레인은 여전히 SMS/call-log BuildConfig 플래그로 그 flavor를 컴파일하면서도 모든 Android 관련 push마다 중복 디버그 APK 패키징 작업은 피합니다.
`extension-fast`는 push 실행이 이미 전체 bundled plugin 샤드를 수행하므로 PR 전용입니다. 이렇게 하면 리뷰 중 변경 plugin에 대한 피드백은 유지하면서도 `checks-node-extensions`에 이미 존재하는 커버리지를 위해 `main`에서 추가 Blacksmith worker를 예약하지 않게 됩니다.

GitHub는 같은 PR 또는 `main` ref에 새 push가 들어오면 더 이상 최신이 아닌 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중이 아닌 한, 이를 CI 노이즈로 취급하세요. aggregate 샤드 체크는 `!cancelled() && always()`를 사용하므로 정상적인 샤드 실패는 계속 보고하지만, 전체 워크플로 자체가 이미 더 최신 실행으로 대체된 경우에는 큐에 들어가지 않습니다.
CI concurrency key는 버전이 지정되어 있습니다(`CI-v7-*`). 따라서 오래된 큐 그룹의 GitHub 측 zombie가 최신 main 실행을 무기한 차단할 수 없습니다.

## 러너

| 러너                             | 작업                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, 빠른 보안 작업과 aggregate(`security-scm-fast`, `security-dependency-audit`, `security-fast`), 빠른 protocol/contract/bundled 검사, 샤딩된 채널 contract 검사, lint를 제외한 `check` 샤드, `check-additional` 샤드와 aggregate, Node 테스트 aggregate verifier, 문서 검사, Python Skills, workflow-sanity, labeler, auto-response. install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있습니다 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node 테스트 샤드, bundled plugin 테스트 샤드, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` — 이 작업은 여전히 CPU 민감도가 높아 8 vCPU가 절약하는 것보다 더 많은 비용이 들었습니다. install-smoke Docker 빌드 — 여기서는 32-vCPU의 큐 대기 비용이 절약 효과보다 더 컸습니다                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`에서의 `macos-node`; fork에서는 `macos-latest`로 폴백                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`에서의 `macos-swift`; fork에서는 `macos-latest`로 폴백                                                                                                                                                                                                                                                                                                                                                                                               |

## 로컬 대응 명령어

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 changed-lane 분류기를 확인
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경 typecheck/lint/테스트
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 가드
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 문서 포맷 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
node scripts/ci-run-timings.mjs <run-id>  # 총 소요 시간, 큐 대기 시간, 가장 느린 작업 요약
```
