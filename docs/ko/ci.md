---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 그리고 로컬 명령 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-22T06:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. 스마트 범위 지정 기능을 사용해 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뜁니다.

## 작업 개요

| 작업                             | 목적                                                                                       | 실행 시점                            |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `preflight`                      | docs 전용 변경, 변경된 범위, 변경된 extensions를 감지하고 CI 매니페스트를 빌드합니다      | 초안이 아닌 모든 푸시와 PR에서 항상 실행 |
| `security-scm-fast`              | `zizmor`를 통한 private key 탐지 및 워크플로 감사                                          | 초안이 아닌 모든 푸시와 PR에서 항상 실행 |
| `security-dependency-audit`      | npm advisory를 기준으로 한 의존성 없는 프로덕션 lockfile 감사                              | 초안이 아닌 모든 푸시와 PR에서 항상 실행 |
| `security-fast`                  | 빠른 보안 작업들을 위한 필수 집계 작업                                                     | 초안이 아닌 모든 푸시와 PR에서 항상 실행 |
| `build-artifacts`                | `dist/`와 Control UI를 한 번 빌드하고, 이후 작업에서 재사용할 수 있도록 아티팩트를 업로드합니다 | Node 관련 변경                       |
| `checks-fast-core`               | 번들/plugin-contract/protocol 검사와 같은 빠른 Linux 정확성 레인                           | Node 관련 변경                       |
| `checks-fast-contracts-channels` | 안정적인 집계 검사 결과를 갖는 샤딩된 channel contract 검사                                | Node 관련 변경                       |
| `checks-node-extensions`         | extension 제품군 전반에 걸친 전체 번들-plugin 테스트 샤드                                  | Node 관련 변경                       |
| `checks-node-core-test`          | channel, 번들, contract, extension 레인을 제외한 Core Node 테스트 샤드                     | Node 관련 변경                       |
| `extension-fast`                 | 변경된 번들 plugins만 대상으로 하는 집중 테스트                                            | extension 변경이 감지된 경우         |
| `check`                          | 샤딩된 메인 로컬 게이트 대응 항목: 프로덕션 타입, lint, guard, 테스트 타입, 엄격한 smoke   | Node 관련 변경                       |
| `check-additional`               | 아키텍처, 경계, extension-surface guard, package-boundary, gateway-watch 샤드              | Node 관련 변경                       |
| `build-smoke`                    | 빌드된 CLI smoke 테스트와 startup-memory smoke                                             | Node 관련 변경                       |
| `checks`                         | 나머지 Linux Node 레인: channel 테스트와 푸시 전용 Node 22 호환성                          | Node 관련 변경                       |
| `check-docs`                     | docs 포맷팅, lint, 깨진 링크 검사                                                          | Docs 변경                            |
| `skills-python`                  | Python 기반 Skills에 대한 Ruff + pytest                                                    | Python-skill 관련 변경               |
| `checks-windows`                 | Windows 전용 테스트 레인                                                                   | Windows 관련 변경                    |
| `macos-node`                     | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인                                 | macOS 관련 변경                      |
| `macos-swift`                    | macOS 앱용 Swift lint, 빌드, 테스트                                                        | macOS 관련 변경                      |
| `android`                        | Android 빌드 및 테스트 매트릭스                                                            | Android 관련 변경                    |

## Fail-Fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 정해져 있습니다.

1. `preflight`가 어떤 레인이 실제로 존재하는지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 artifact 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 병렬로 실행되므로, 공유 빌드가 준비되는 즉시 downstream 소비자가 시작할 수 있습니다.
4. 그 이후 더 무거운 플랫폼 및 런타임 레인이 분기됩니다: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 범위 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로, Docker/install smoke는 install, packaging, container 관련 변경에 대해서만 실행됩니다.

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 이를 실행합니다. 이 로컬 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다. core 프로덕션 변경은 core 프로덕션 typecheck와 core 테스트를 실행하고, core 테스트 전용 변경은 core 테스트 typecheck/tests만 실행하며, extension 프로덕션 변경은 extension 프로덕션 typecheck와 extension 테스트를 실행하고, extension 테스트 전용 변경은 extension 테스트 typecheck/tests만 실행합니다. 공개 Plugin SDK 또는 plugin-contract 변경은 extension이 그 core contract에 의존하므로 extension 검증까지 확장됩니다. 릴리스 메타데이터 전용 버전 범프는 대상이 제한된 version/config/root-dependency 검사를 실행합니다. 알 수 없는 root/config 변경은 안전하게 모든 레인으로 실패 처리됩니다.

푸시에서는 `checks` 매트릭스가 푸시 전용 `compat-node22` 레인을 추가합니다. pull request에서는 이 레인이 건너뛰어지고 매트릭스는 일반 테스트/channel 레인에 집중된 상태를 유지합니다.

가장 느린 Node 테스트 계열은 각 작업이 작게 유지되도록 include-file 샤드로 분할됩니다. channel contract는 registry와 core 커버리지를 각각 8개의 가중 샤드로 분할하고, auto-reply reply command 테스트는 4개의 include-pattern 샤드로 분할하며, 그 외 큰 auto-reply reply prefix 그룹은 각각 2개의 샤드로 분할합니다. `check-additional`도 package-boundary compile/canary 작업을 runtime topology gateway/architecture 작업과 분리합니다.

같은 PR 또는 `main` ref에 새 푸시가 도착하면 GitHub는 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중이 아닌 한, 이것은 CI 잡음으로 취급하세요. 집계 샤드 검사는 이 취소 사례를 명시적으로 알려 주므로 테스트 실패와 더 쉽게 구분할 수 있습니다.

## 러너

| 러너                            | 작업                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; install-smoke preflight도 GitHub 호스팅 Ubuntu를 사용하므로 Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있습니다         |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux 검사, docs 검사, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` on `openclaw/openclaw`; 포크는 `macos-latest`로 대체됩니다                                                   |

## 로컬 대응 항목

```bash
pnpm changed:lanes   # origin/main...HEAD에 대한 로컬 변경 레인 분류기 검사
pnpm check:changed   # 스마트 로컬 게이트: 경계 레인별 변경 typecheck/lint/tests
pnpm check          # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 lint + 병렬 빠른 guard
pnpm check:test-types
pnpm check:timed    # 단계별 시간 측정이 포함된 동일 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 포맷 + lint + 깨진 링크
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
```
