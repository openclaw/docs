---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 할 때
    - 실패한 GitHub Actions 검사를 디버깅하고 있을 때
summary: CI 작업 그래프, 범위 게이트, 그리고 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-04-09T05:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# CI 파이프라인

CI는 `main`에 대한 모든 푸시와 모든 풀 리퀘스트에서 실행됩니다. 관련 없는 영역만 변경된 경우 비용이 큰 작업을 건너뛰기 위해 스마트한 범위 지정 방식을 사용합니다.

## 작업 개요

| 작업                     | 목적                                                                                  | 실행 시점                           |
| ------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | 문서 전용 변경, 변경된 범위, 변경된 확장 기능을 감지하고 CI 매니페스트를 빌드        | 초안이 아닌 모든 푸시 및 PR에서 항상 |
| `security-fast`          | 비공개 키 감지, `zizmor`를 통한 워크플로 감사, 프로덕션 의존성 감사                  | 초안이 아닌 모든 푸시 및 PR에서 항상 |
| `build-artifacts`        | `dist/`와 Control UI를 한 번 빌드하고, 후속 작업을 위해 재사용 가능한 아티팩트를 업로드 | Node 관련 변경 시                  |
| `checks-fast-core`       | 번들/plugin-contract/protocol 검사와 같은 빠른 Linux 정확성 레인                     | Node 관련 변경 시                  |
| `checks-fast-extensions` | `checks-fast-extensions-shard` 완료 후 확장 기능 샤드 레인을 집계                     | Node 관련 변경 시                  |
| `extension-fast`         | 변경된 번들 plugins만 대상으로 한 집중 테스트                                        | 확장 기능 변경이 감지된 경우       |
| `check`                  | CI의 기본 로컬 게이트: `pnpm check`와 `pnpm build:strict-smoke`                      | Node 관련 변경 시                  |
| `check-additional`       | 아키텍처, 경계, import-cycle 가드와 게이트웨이 watch 회귀 하네스                     | Node 관련 변경 시                  |
| `build-smoke`            | 빌드된 CLI 스모크 테스트와 시작 메모리 스모크                                        | Node 관련 변경 시                  |
| `checks`                 | 더 무거운 Linux Node 레인: 전체 테스트, 채널 테스트, 푸시 전용 Node 22 호환성        | Node 관련 변경 시                  |
| `check-docs`             | 문서 포맷팅, lint, 깨진 링크 검사                                                    | 문서가 변경된 경우                |
| `skills-python`          | Python 기반 Skills용 Ruff + pytest                                                   | Python Skills 관련 변경 시         |
| `checks-windows`         | Windows 전용 테스트 레인                                                             | Windows 관련 변경 시              |
| `macos-node`             | 공유 빌드 아티팩트를 사용하는 macOS TypeScript 테스트 레인                           | macOS 관련 변경 시                |
| `macos-swift`            | macOS 앱용 Swift lint, 빌드, 테스트                                                  | macOS 관련 변경 시                |
| `android`                | Android 빌드 및 테스트 매트릭스                                                      | Android 관련 변경 시              |

## 빠른 실패 순서

작업은 비용이 큰 작업이 실행되기 전에 저렴한 검사가 먼저 실패하도록 순서가 정해져 있습니다.

1. `preflight`가 어떤 레인이 실제로 존재하는지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 실행형 작업이 아니라 이 작업 내부의 단계입니다.
2. `security-fast`, `check`, `check-additional`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
3. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로, 공유 빌드가 준비되는 즉시 후속 소비자가 시작할 수 있습니다.
4. 이후 더 무거운 플랫폼 및 런타임 레인이 분기되어 실행됩니다: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, `android`.

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며, `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다.
별도의 `install-smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 더 좁은 changed-smoke 신호에서 `run_install_smoke`를 계산하므로, Docker/install 스모크는 install, 패키징, 컨테이너 관련 변경에 대해서만 실행됩니다.

푸시에서는 `checks` 매트릭스에 푸시 전용 `compat-node22` 레인이 추가됩니다. 풀 리퀘스트에서는 이 레인이 건너뛰어지고, 매트릭스는 일반적인 테스트/채널 레인에 집중된 상태를 유지합니다.

## 러너

| 러너                             | 작업                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux 검사, 문서 검사, Python Skills, `android`   |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## 로컬 대응 명령어

```bash
pnpm check          # 타입 + lint + format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest 테스트
pnpm test:channels
pnpm check:docs     # 문서 format + lint + 깨진 링크
pnpm build          # CI 아티팩트/build-smoke 레인이 중요할 때 dist 빌드
```
