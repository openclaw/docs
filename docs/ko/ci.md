---
read_when:
    - CI 작업이 실행되었는지 또는 실행되지 않았는지 그 이유를 이해해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다.
summary: CI 작업 그래프, 범위 게이트, 그리고 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-11T02:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 푸시와 모든 pull request에서 실행됩니다. 스마트 스코프 판정을 사용해 변경과 무관한 영역만 수정된 경우 비용이 큰 작업을 건너뜁니다.

## 작업 개요

| 작업                     | 목적                                                                                  | 실행 시점                          |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`              | docs 전용 변경, 변경된 스코프, 변경된 확장 프로그램을 감지하고 CI 매니페스트를 빌드합니다 | 초안이 아닌 모든 푸시 및 PR에서 항상 |
| `security-fast`          | 개인 키 탐지, `zizmor`를 통한 워크플로 감사, 프로덕션 의존성 감사                     | 초안이 아닌 모든 푸시 및 PR에서 항상 |
| `build-artifacts`        | `dist/`와 Control UI를 한 번 빌드하고, 후속 작업에서 재사용할 아티팩트를 업로드합니다 | Node 관련 변경                      |
| `checks-fast-core`       | 번들/플러그인 계약/프로토콜 검사와 같은 빠른 Linux 정확성 레인                        | Node 관련 변경                      |
| `checks-node-extensions` | 확장 프로그램 스위트 전반에 걸친 전체 번들 플러그인 테스트 샤드                       | Node 관련 변경                      |
| `checks-node-core-test`  | 채널, 번들, 계약, 확장 프로그램 레인을 제외한 코어 Node 테스트 샤드                   | Node 관련 변경                      |
| `extension-fast`         | 변경된 번들 플러그인만 대상으로 하는 집중 테스트                                      | 확장 프로그램 변경이 감지된 경우     |
| `check`                  | CI의 주요 로컬 게이트: `pnpm check`와 `pnpm build:strict-smoke`                       | Node 관련 변경                      |
| `check-additional`       | 아키텍처, 경계, import-cycle 가드와 gateway watch 회귀 하네스                         | Node 관련 변경                      |
| `build-smoke`            | 빌드된 CLI 스모크 테스트 및 시작 메모리 스모크                                        | Node 관련 변경                      |
| `checks`                 | 나머지 Linux Node 레인: 채널 테스트 및 푸시 전용 Node 22 호환성                       | Node 관련 변경                      |
| `check-docs`             | docs 포맷팅, lint, 끊어진 링크 검사                                                   | docs 변경                           |
| `skills-python`          | Python 기반 Skills용 Ruff + pytest                                                   | Python Skills 관련 변경             |
| `checks-windows`         | Windows 전용 테스트 레인                                                              | Windows 관련 변경                   |
| `macos-node`             | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인                            | macOS 관련 변경                     |
| `macos-swift`            | macOS 앱용 Swift lint, 빌드, 테스트                                                   | macOS 관련 변경                     |
| `android`                | Android 빌드 및 테스트 매트릭스                                                       | Android 관련 변경                   |

## Fail-Fast 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 정해져 있습니다.

1. `preflight`가 어떤 레인이 실제로 존재할지를 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 후속 소비 작업이 시작될 수 있습니다.
4. 그다음 더 무거운 플랫폼 및 런타임 레인이 분기되어 실행됩니다: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

스코프 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 같은 스코프 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호로부터 `run_install_smoke`를 계산하므로, Docker/install smoke는 설치, 패키징, 컨테이너 관련 변경에 대해서만 실행됩니다.

푸시에서는 `checks` 매트릭스에 푸시 전용 `compat-node22` 레인이 추가됩니다. pull request에서는 이 레인이 건너뛰어지고, 매트릭스는 일반 테스트/채널 레인에 집중된 상태를 유지합니다.

## 러너

| 러너                             | 작업                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux 검사, docs 검사, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                           |

## 로컬 대응 항목

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # CI artifact/build-smoke 레인이 중요할 때 dist 빌드
```
