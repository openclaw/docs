---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 파악해야 합니다.
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 포괄 작업 및 로컬 명령어 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-07-12T15:00:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 푸시할 때(Markdown 및 `docs/**` 경로는
트리거에서 무시됨), 초안이 아닌 풀 리퀘스트를 생성할 때(CHANGELOG만 변경된 diff는 무시됨),
그리고 수동으로 디스패치할 때 실행됩니다. 표준 `main` 푸시는 먼저 90초 동안
호스팅 러너 승인 창을 거칩니다. 더 최신 커밋이 도착하면 `CI` 동시성 그룹이
대기 중인 실행을 취소하므로, 순차적으로 병합할 때마다 전체 Blacksmith 매트릭스가
등록되지는 않습니다. 풀 리퀘스트와 수동 디스패치는 대기를 건너뜁니다. 그런 다음
`preflight` 작업이 diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 많이 드는
레인을 비활성화합니다. 수동 `workflow_dispatch` 실행은 릴리스 후보와 광범위한 검증을 위해
의도적으로 스마트 범위 지정을 우회하고 전체 그래프를 병렬로 실행합니다. Android 레인은
`include_android`(또는 `release_gate` 입력)을 통해 선택적으로 실행됩니다.
릴리스 전용 Plugin 커버리지는 별도의
[`Plugin Prerelease`](#plugin-prerelease) 워크플로에 있으며,
[`Full Release Validation`](#full-release-validation) 또는 명시적인 수동 디스패치에서만
실행됩니다.

## 파이프라인 개요

| 작업                               | 목적                                                                                                                                                                                                                  | 실행 시점                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 문서 전용 변경 사항, 변경된 범위, 변경된 확장 기능을 감지하고 CI 매니페스트를 빌드합니다.                                                                                                                             | 초안이 아닌 푸시 및 PR에서 항상 실행                |
| `runner-admission`                 | Blacksmith 작업이 등록되기 전에 정식 `main` 푸시에 대해 호스팅 환경에서 90초 디바운스를 적용합니다.                                                                                                                   | 모든 CI 실행에서 수행하며, 정식 `main` 푸시에서만 대기 |
| `security-fast`                    | 비공개 키 감지, `zizmor`를 통한 변경된 워크플로 감사 및 프로덕션 잠금 파일 감사를 수행합니다.                                                                                                                         | 초안이 아닌 푸시 및 PR에서 항상 실행                |
| `pnpm-store-warmup`                | Linux Node 샤드를 차단하지 않고 잠금 파일에 고정된 pnpm 저장소 캐시를 준비합니다.                                                                                                                                      | Node 또는 문서 검사 레인 선택 시                    |
| `build-artifacts`                  | `dist/`, Control UI, 빌드된 CLI 스모크 검사, 시작 메모리 및 내장된 빌드 아티팩트 검사를 빌드합니다.                                                                                                                    | Node 관련 변경 시                                   |
| `control-ui-i18n`                  | 생성된 Control UI 로케일 번들, 메타데이터 및 번역 메모리를 검증합니다. 자동 실행에서는 권고 사항이며 수동 릴리스 CI에서는 차단합니다.                                                                                  | Control UI i18n 관련 변경 및 수동 CI 시             |
| `checks-fast-core`                 | 빠른 Linux 정확성 레인: 번들 + 프로토콜, Bun 런처 및 CI 라우팅 빠른 작업입니다.                                                                                                                                        | Node 관련 변경 시                                   |
| `qa-smoke-ci-profile`              | 범위가 제한된 자동 QA 스모크 대표 세트를 자체 완결형의 균형 잡힌 두 부분으로 나눕니다. 전체 분류 체계 범위는 명시적 QA 프로필을 통해 계속 사용할 수 있습니다.                                                          | Node 관련 변경 시                                   |
| `checks-fast-contracts-plugins-*`  | 가중치가 적용된 두 개의 Plugin 계약 샤드입니다.                                                                                                                                                                       | Node 관련 변경 시                                   |
| `checks-fast-contracts-channels-*` | 가중치가 적용된 두 개의 채널 계약 샤드입니다.                                                                                                                                                                         | Node 관련 변경 시                                   |
| `checks-node-*`                    | 채널, 번들, 계약 및 확장 기능 레인을 제외한 핵심 Node 테스트 샤드입니다.                                                                                                                                               | Node 관련 변경 시                                   |
| `check-*`                          | 샤딩된 기본 로컬 게이트와 동등한 검사: 가드, shrinkwrap, 번들 채널 구성 메타데이터, 프로덕션 타입, 린트, 종속성, 테스트 타입                                                                                           | Node 관련 변경 시                                   |
| `check-additional-*`               | 경계 검사 스트라이프(프롬프트 스냅샷 드리프트 포함), 세션 접근자/트랜스크립트 리더/SQLite 트랜잭션 경계, 확장 기능 린트 그룹, 패키지 경계 컴파일/카나리 및 런타임 토폴로지 아키텍처를 검사합니다.                           | Node 관련 변경 시                                   |
| `checks-node-compat-node22`        | Node 22 호환성 빌드 및 스모크 레인입니다.                                                                                                                                                                             | 릴리스용 수동 CI 디스패치 시                        |
| `check-docs`                       | 문서 포맷팅, 린트 및 깨진 링크 검사를 수행합니다.                                                                                                                                                                     | 문서 변경 시(PR 및 수동 디스패치)                  |
| `native-i18n`                      | 네이티브 앱, Android 및 Apple i18n 인벤토리를 검사합니다.                                                                                                                                                             | 네이티브 i18n 관련 변경 시                          |
| `skills-python`                    | Python 기반 Skills에 대해 Ruff + pytest를 실행합니다.                                                                                                                                                                 | Python Skills 관련 변경 시                          |
| `checks-windows`                   | Windows 전용 프로세스/경로 테스트와 공유 런타임 가져오기 지정자 회귀 테스트를 수행합니다.                                                                                                                             | Windows 관련 변경 시                                |
| `macos-node`                       | macOS에 초점을 맞춘 TypeScript 테스트: launchd, Homebrew, 런타임 경로, 패키징 스크립트, 프로세스 그룹 래퍼                                                                                                            | macOS 관련 변경 시                                  |
| `macos-swift`                      | macOS 앱의 Swift 린트, 빌드 및 테스트를 수행합니다.                                                                                                                                                                   | macOS 관련 변경 시                                  |
| `ios-build`                        | Xcode 프로젝트 생성과 iOS 앱 시뮬레이터 빌드를 수행합니다.                                                                                                                                                            | iOS 앱, 공유 앱 키트 또는 Swabble 변경 시           |
| `android`                          | 두 플레이버의 Android 단위 테스트와 디버그 APK 빌드 하나를 수행합니다.                                                                                                                                                | Android 관련 변경 시                                |
| `test-performance-agent`           | 별도 워크플로: 신뢰할 수 있는 활동 후 매일 Codex 느린 테스트 최적화를 수행합니다.                                                                                                                                      | 기본 CI 성공 또는 수동 디스패치 시                  |
| `openclaw-performance`             | 별도 워크플로: 모의 공급자, 심층 프로필 및 GPT 5.6 라이브 레인을 사용하여 매일 또는 요청 시 Kova 런타임 성능 보고서를 생성합니다.                                                                                      | 예약 및 수동 디스패치 시                            |

## 빠른 실패 순서

1. `runner-admission`은 정식 `main` 푸시만 기다립니다. 새 푸시가 있으면 Blacksmith 등록 전에 실행을 취소합니다.
2. `preflight`는 어떤 레인이 존재할지를 결정합니다. `docs-scope` 및 `changed-scope` 로직은 독립 실행형 작업이 아니라 이 작업 내부의 단계입니다.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, `skills-python`은 더 무거운 아티팩트 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
4. `build-artifacts`와 권고용 `control-ui-i18n` 검사는 빠른 Linux 레인과 병렬로 실행됩니다. 생성된 로케일의 불일치는 계속 표시되며, 별도의 새로 고침 워크플로가 백그라운드에서 이를 복구합니다.
5. 이후 더 무거운 플랫폼 및 런타임 레인이 분기됩니다. 여기에는 `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, `android`가 포함됩니다.

동일한 PR 또는 `main` 참조에 새 푸시가 반영되면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 동일한 참조의 최신 실행도 실패하지 않는 한 이를 CI 잡음으로 간주하십시오. 매트릭스 작업은 `fail-fast: false`를 사용하며, `build-artifacts`는 작은 검증 작업을 대기열에 추가하는 대신 포함된 채널, 코어 지원 경계 및 Gateway 감시 실패를 직접 보고합니다. 자동 CI 동시 실행 키에는 버전이 지정되어 있으므로(`CI-v7-*`), 이전 대기열 그룹에 남은 GitHub 측 좀비가 최신 main 실행을 무기한 차단할 수 없습니다. 수동 전체 제품군 실행은 `CI-manual-v1-*`을 사용하며 진행 중인 실행을 취소하지 않습니다. Plugin 목록 시작 메모리 가드는 자체 호스팅 Blacksmith Linux에서 상한을 350 MiB로 유지하고, 동일하게 빌드된 CLI에서도 RSS 기준치가 더 높은 GitHub 호스팅 Linux에서는 425 MiB를 허용합니다.

`pnpm ci:timings`, `pnpm ci:timings:recent` 또는 `node scripts/ci-run-timings.mjs <run-id>`를 사용하여 GitHub Actions의 총 경과 시간, 대기열 시간, 가장 느린 작업, 실패 및 `pnpm-store-warmup` 분기 장벽을 요약하십시오. 워크플로 내부의 `ci-timings-summary` 작업은 `ci.yml`에 존재하지만 현재 비활성화되어 있으므로(`if: false`), 대신 타이밍 도우미를 로컬에서 실행하십시오. 빌드 타이밍은 `build-artifacts` 작업의 `Build dist` 단계를 확인하십시오. `pnpm build:ci-artifacts`는 `[build-all] phase timings:`를 출력하고 `ui:build`를 포함합니다. 또한 이 작업은 `startup-memory` 아티팩트를 업로드합니다.

## PR 컨텍스트 및 증거

외부 기여자의 PR은
`.github/workflows/real-behavior-proof.yml`에서 PR 컨텍스트 및 증거 게이트를 실행합니다. 이 워크플로는
신뢰할 수 있는 워크플로 리비전(`github.workflow_sha`)을 체크아웃하고 PR 본문만
평가하며, 기여자 브랜치의 코드는 실행하지 않습니다.

이 게이트는 저장소 소유자, 구성원, 공동 작업자 또는 봇이 아닌 PR 작성자에게 적용됩니다. PR 본문에 작성자가 작성한
`What Problem This Solves` 및 `Evidence` 섹션이 포함되어 있으면 통과합니다. 증거는 범위를 한정한
테스트, CI 결과, 스크린샷, 녹화, 터미널 출력, 실시간 관찰,
민감 정보를 삭제한 로그 또는 아티팩트 링크일 수 있습니다. 본문은 의도와 유용한 검증 정보를 제공하며,
검토자는 코드, 테스트 및 CI를 검사하여 정확성을 평가합니다.

검사가 실패하면 코드 커밋을 추가로 푸시하지 말고 PR 본문을 업데이트하십시오.

## 범위 및 라우팅

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 검증됩니다. 수동 디스패치는 변경 범위 감지를 건너뛰고 사전 검사 매니페스트가 범위 내 모든 영역이 변경된 것처럼 동작하게 합니다.

- **CI 워크플로 편집**은 Node CI 그래프, 워크플로 린팅 및 Windows 레인(`ci.yml`에서 실행)을 검증하지만, 그 자체로 iOS, Android 또는 macOS 네이티브 빌드를 강제하지는 않습니다. 해당 플랫폼 레인은 플랫폼 소스 변경에만 범위가 한정됩니다.
- **워크플로 건전성 검사**는 모든 워크플로 YAML 파일에 대해 `actionlint`, `zizmor`, 복합 액션 보간 가드 및 충돌 마커 가드를 실행합니다. PR 범위의 `security-fast` 작업도 변경된 워크플로 파일에 대해 `zizmor`를 실행하므로 워크플로 보안 문제는 기본 CI 그래프에서 조기에 실패합니다.
- **`main` 푸시의 문서**는 CI와 동일한 ClawHub 문서 미러를 사용하는 독립형 `Docs` 워크플로에서 검사되므로 코드와 문서가 혼합된 푸시가 CI의 `check-docs` 샤드까지 추가로 대기열에 넣지 않습니다. 풀 리퀘스트 및 수동 CI에서는 문서가 변경된 경우 여전히 CI에서 `check-docs`를 실행합니다.
- **TUI PTY**는 TUI 변경 시 `checks-node-core-runtime-tui-pty` Linux Node 샤드에서 실행됩니다. 이 샤드는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`로 `test/vitest/vitest.tui-pty.config.ts`를 실행하므로 결정적 `TuiBackend` 픽스처 레인과 외부 모델 엔드포인트만 모킹하는 더 느린 `tui --local` 스모크 테스트를 모두 다룹니다.
- **CI 라우팅 전용 편집, 빠른 작업이 직접 실행하는 소규모 핵심 테스트 픽스처 집합 및 범위가 좁은 Plugin 계약 헬퍼 편집**은 빠른 Node 전용 매니페스트 경로를 사용합니다. 즉, `preflight`, `security-fast` 및 변경 사항이 영향을 주는 빠른 레인만 실행합니다. 해당 레인은 단일 `checks-fast-core` CI 라우팅 작업, 두 Plugin 계약 샤드 또는 둘 다일 수 있습니다. 이 경로는 빌드 아티팩트, Node 22 호환성, 채널 계약, 전체 핵심 샤드, 번들 Plugin 샤드 및 추가 가드 매트릭스를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 프로세스/경로 래퍼, npm/pnpm/UI 러너 헬퍼, 패키지 관리자 구성 및 해당 레인을 실행하는 CI 워크플로 영역으로 범위가 한정됩니다. 관련 없는 소스, Plugin, 설치 스모크 및 테스트 전용 변경 사항은 Linux Node 레인에 유지됩니다.

가장 느린 Node 테스트 계열은 각 작업이 작게 유지되면서 러너를 과도하게 예약하지 않도록 분할하거나 균형을 맞춥니다.

- Plugin 계약과 채널 계약은 각각 표준 GitHub 러너 폴백을 갖춘 가중치 기반 Blacksmith 샤드 두 개로 실행됩니다.
- 핵심 단위 빠른/지원 레인은 별도로 실행됩니다. 핵심 런타임 인프라는 프로세스, 공유, 훅, 보안 비밀 및 세 개의 Cron 도메인 샤드로 분할됩니다.
- 자동 응답은 균형 잡힌 워커로 실행되며, 응답 하위 트리는 에이전트 러너, 명령, 디스패치, 세션 및 상태 라우팅 샤드로 분할됩니다.
- 에이전트형 Gateway/서버(제어 평면) 구성은 빌드된 아티팩트를 기다리지 않고 채팅, 인증, 모델, HTTP/Plugin, 런타임 및 시작 레인으로 분할됩니다.
- 일반 CI는 격리된 인프라 포함 패턴 샤드만 최대 64개 테스트 파일의 결정적 번들로 묶어, 격리되지 않은 명령/Cron, 상태 유지형 agents-core 또는 Gateway/서버 스위트를 병합하지 않으면서 Node 매트릭스를 줄입니다. 무거운 고정 스위트는 8 vCPU에서 유지되며 번들 및 가중치가 낮은 레인은 4 vCPU를 사용합니다.
- 표준 저장소의 풀 리퀘스트는 압축된 승인 계획을 사용합니다. 동일한 구성별 그룹이 격리된 하위 프로세스에서 실행되며, 현재 전체 매트릭스의 74개 작업 대신 19개의 Node 테스트 작업을 사용합니다. 단일 전체 구성 배치는 120분 제한 시간을 유지하면서 기존 동일 러너 압축 작업에 분산되고, 직렬 도구 구성은 PR 전용 그룹 세 개에 걸쳐 스트라이핑됩니다. `main` 푸시, 수동 디스패치 및 릴리스 게이트는 전체 매트릭스를 유지합니다.
- 광범위한 브라우저, QA, 미디어 및 기타 Plugin 테스트는 공유 Plugin 포괄 구성 대신 전용 Vitest 구성을 사용합니다. 포함 패턴 샤드는 CI 샤드 이름으로 타이밍 항목을 기록하므로 `.artifacts/vitest-shard-timings.json`에서 전체 구성과 필터링된 샤드를 구분할 수 있습니다.
- `check-additional-*`는 보충 경계 가드 목록(`scripts/run-additional-boundary-checks.mjs`)을 프롬프트 비중이 높은 샤드 하나(`check-additional-boundaries-a`, Codex 프롬프트 스냅샷 드리프트 검사 포함)와 나머지 스트라이프를 위한 통합 샤드 하나(`check-additional-boundaries-bcd`)로 스트라이핑합니다. 각 샤드는 독립적인 가드를 동시에 실행하고 검사별 소요 시간을 출력합니다. 패키지 경계 컴파일/카나리 작업은 함께 유지되며, 런타임 토폴로지 아키텍처는 `build-artifacts`에 포함된 Gateway 감시 커버리지와 별도로 실행됩니다.
- Gateway 감시, 채널 테스트 및 핵심 지원 경계 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 후 `build-artifacts` 내부에서 동시에 실행됩니다.

승인된 후 표준 Linux CI는 최대 28개의 Node 테스트 작업과
더 작은 빠른/검사 레인 12개를 동시에 허용합니다. Windows와 Android는
해당 러너 풀이 더 제한적이므로 두 개로 유지됩니다. 압축된 전체 구성 배치는
120분의 배치 제한 시간으로 실행되며, 포함 패턴 그룹은 동일한 제한된
작업 예산을 공유합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play 디버그 APK를 빌드합니다. 서드 파티 플레이버에는 별도의 소스 세트나 매니페스트가 없습니다. 해당 단위 테스트 레인은 SMS/통화 기록 BuildConfig 플래그로 플레이버를 계속 컴파일하면서도 Android 관련 푸시마다 중복 디버그 APK 패키징 작업이 실행되는 것을 방지합니다.

`check-dependencies` 샤드는 `pnpm deadcode:dependencies`(정확한 Knip 버전에 고정되고 `dlx` 설치에 대해 pnpm의 최소 릴리스 경과 기간이 비활성화된 프로덕션 Knip 종속성 전용 패스) 및 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 프로덕션 미사용 파일 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. 또한 참고용 `pnpm deadcode:report:ci:ts-unused` 보고서를 `deadcode-reports` 아티팩트로 업로드합니다. 미사용 파일 가드는 PR이 검토되지 않은 새 미사용 파일을 추가하거나 오래된 허용 목록 항목을 남겨 두면 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 동적 Plugin, 생성 파일, 빌드, 실시간 테스트 및 패키지 브리지 영역은 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw 저장소 활동을 ClawSweeper로 전달하는 대상 측 브리지입니다. 신뢰할 수 없는 풀 리퀘스트 코드를 체크아웃하거나 실행하지 않습니다. 이 워크플로는 `CLAWSWEEPER_APP_PRIVATE_KEY`로 GitHub App 토큰을 생성한 다음, 간결한 `repository_dispatch` 페이로드를 `openclaw/clawsweeper`로 디스패치합니다.

이 워크플로에는 네 개의 레인이 있습니다.

- 정확한 이슈 및 풀 리퀘스트 검토 요청을 위한 `clawsweeper_item`
- 이슈 댓글의 명시적 ClawSweeper 명령을 위한 `clawsweeper_comment`
- `main` 푸시의 커밋 수준 검토 요청을 위한 `clawsweeper_commit_review`
- ClawSweeper 에이전트가 검사할 수 있는 일반 GitHub 활동을 위한 `github_activity`

`github_activity` 레인은 정규화된 메타데이터만 전달합니다. 이벤트 유형, 작업, 행위자, 저장소, 항목 번호, URL, 제목, 상태 및 존재하는 경우 댓글이나 검토의 짧은 발췌문입니다. 전체 Webhook 본문은 의도적으로 전달하지 않습니다. `openclaw/clawsweeper`의 수신 워크플로는 `.github/workflows/github-activity.yml`이며, 정규화된 이벤트를 ClawSweeper 에이전트용 OpenClaw Gateway 훅에 게시합니다.

일반 활동은 관찰 대상이지 기본적으로 전달되는 대상이 아닙니다. ClawSweeper 에이전트는 프롬프트에서 Discord 대상을 수신하며, 이벤트가 예상 밖이거나, 조치 가능하거나, 위험하거나, 운영상 유용한 경우에만 `#clawsweeper`에 게시해야 합니다. 일상적인 열기, 편집, 봇 활동, 중복 Webhook 노이즈 및 정상적인 검토 트래픽에는 `NO_REPLY`로 응답해야 합니다.

이 경로 전체에서 GitHub 제목, 댓글, 본문, 검토 텍스트, 브랜치 이름 및 커밋 메시지를 신뢰할 수 없는 데이터로 취급하십시오. 이는 요약 및 분류를 위한 입력이지 워크플로나 에이전트 런타임을 위한 지침이 아닙니다.

## 수동 디스패치

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 Android가 아닌 모든 범위 지정 레인을 강제로 활성화합니다. Linux Node 샤드, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS, iOS 빌드 및 Control UI i18n이 포함됩니다. 독립형 새로 고침 워크플로가 생성된 드리프트를 백그라운드에서 수정하므로 자동 PR 및 `main` 실행에서 Control UI 로케일 일치 여부는 참고 사항입니다. 수동 CI에서는 차단 조건이므로 전체 릴리스 검증에서도 차단 조건입니다. 독립형 수동 CI 디스패치는 `include_android=true`인 경우에만 Android를 실행합니다(`release_gate` 입력도 Android를 강제로 활성화합니다). 전체 릴리스 통합 워크플로는 `include_android=true`를 전달하여 Android를 활성화합니다. Plugin 사전 릴리스 정적 검사, 릴리스 전용 `agentic-plugins` 샤드, 전체 확장 일괄 스윕 및 Plugin 사전 릴리스 Docker 레인은 CI에서 제외됩니다. Docker 사전 릴리스 스위트는 `Full Release Validation`이 릴리스 검증 게이트를 활성화하여 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 스위트가 동일한 ref의 다른 푸시 또는 PR 실행으로 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰할 수 있는 호출자가 선택된 디스패치 ref의 워크플로 파일을 사용하면서 브랜치, 태그 또는 전체 커밋 SHA를 대상으로 해당 그래프를 실행할 수 있습니다. `release_gate` 입력은 용량 부족으로 정체된 PR CI를 위한 정확한 SHA 기반 유지관리자 폴백입니다. `target_ref`가 디스패치된 브랜치 헤드와 일치하는 전체 커밋 SHA여야 합니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

월별 npm 전용 확장 안정 버전 경로는 예외입니다. 정확한
`extended-stable/YYYY.M.33` 브랜치에서 `OpenClaw NPM
Release` 사전 검사와 `Full Release Validation`을 모두 디스패치하고,
각 실행 ID를 보존한 다음 두 ID를 직접 npm 게시 실행에 전달하십시오.
명령, 정확한 ID 요구 사항, 레지스트리 재확인 및 선택기
복구 절차는 [월별 npm 전용 확장 안정 버전
게시](/ko/reference/RELEASING#monthly-npm-only-extended-stable-publication)를 참조하십시오.
이 경로는 Plugin, macOS, Windows, GitHub
Release, 비공개 dist-tag 또는 기타 플랫폼 게시를 디스패치하지 않습니다.

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 수동 CI 디스패치 및 비정규 저장소 폴백, QA Smoke 집계, CodeQL 보안 및 품질 스캔, 워크플로 온전성 검사, 레이블러, 자동 응답, 독립 실행형 문서 워크플로, 전체 Install Smoke 워크플로                                                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | QA Smoke CI를 제외한 `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core`, Plugin/채널 계약 샤드, 대부분의 번들/저부하 Linux Node 샤드, `check-lint`를 제외한 `check-*` 레인, 일부 `check-additional-*` 샤드, `check-docs`, `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 유지되는 고부하 Linux Node 제품군, 경계/확장 기능 비중이 높은 `check-additional-*` 샤드, `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | 자동 QA Smoke CI 샤드, CI 및 Testbox의 `build-artifacts`, `check-lint`(CPU 민감도가 높아 8 vCPU로 절감한 비용보다 추가 비용이 더 큼)                                                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw`의 `macos-node`; 포크에서는 `macos-15`로 폴백                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw`의 `macos-swift` 및 `ios-build`; 포크에서는 `macos-26`으로 폴백                                                                                                                                                                                                                |

## 러너 등록 예산

OpenClaw의 현재 GitHub 러너 등록 버킷은 `ghx api rate_limit`에서 5분당 자체 호스팅
러너 등록 10,000건으로 보고됩니다. GitHub가 이 버킷을 변경할 수 있으므로 조정 작업을
수행할 때마다 먼저 `actions_runner_registration`을 다시 확인하십시오. 이 제한은
`openclaw` 조직의 모든 Blacksmith 러너 등록이 공유하므로, Blacksmith 설치를 하나 더
추가해도 새 버킷이 생기지 않습니다.

버스트 제어에서는 Blacksmith 레이블을 희소 자원으로 취급하십시오. 라우팅, 알림,
요약, 샤드 선택만 수행하거나 짧은 CodeQL 스캔을 실행하는 작업은 측정된
Blacksmith 전용 요구 사항이 없는 한 GitHub 호스팅 러너에 유지해야 합니다.
새로운 Blacksmith 매트릭스, 더 큰 `max-parallel`, 고빈도 워크플로는 모두 최악의
경우 등록 횟수를 제시하고 조직 수준 목표를 실제 버킷의 약 60% 미만으로 유지해야
합니다. 현재 등록 10,000건 버킷에서는 등록 6,000건이 운영 목표이며, 동시 실행
저장소, 재시도, 버스트 중첩을 위한 여유를 남깁니다.

정규 저장소 CI는 일반 푸시 및 풀 리퀘스트 실행에서 Blacksmith를 기본 러너 경로로 유지합니다. `workflow_dispatch` 및 비정규 저장소 실행은 GitHub 호스팅 러너를 사용하지만, 현재 일반 정규 실행은 Blacksmith 대기열 상태를 확인하거나 Blacksmith를 사용할 수 없을 때 GitHub 호스팅 레이블로 자동 폴백하지 않습니다.

## 로컬 동등 명령

```bash
pnpm changed:lanes                            # origin/main...HEAD에 대한 로컬 변경 레인 분류기를 확인합니다
pnpm check:changed                            # 스마트 로컬 검사 게이트: 경계 레인별 변경된 형식/타입 검사/린트/가드
pnpm check                                    # 빠른 로컬 게이트: 프로덕션 tsgo + 샤딩된 린트 + 병렬 고속 가드
pnpm check:test-types
pnpm check:timed                              # 단계별 타이밍이 포함된 동일한 게이트
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 테스트
pnpm test:changed                             # 저비용 스마트 변경 Vitest 대상
pnpm test:ui                                  # Control UI 단위/브라우저 제품군
pnpm ui:i18n:check                            # 생성된 Control UI 로캘 일치 여부(릴리스 게이트)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 문서 형식 + 린트 + 깨진 링크
pnpm build                                    # CI 아티팩트/스모크 검사가 중요할 때 dist 빌드
pnpm ios:build                                # iOS 앱 프로젝트 생성 및 빌드
pnpm ci:timings                               # 최신 origin/main 푸시 CI 실행 요약
pnpm ci:timings:recent                        # 최근 성공한 main CI 실행 비교
node scripts/ci-run-timings.mjs <run-id>      # 경과 시간, 대기열 시간, 가장 느린 작업 요약
node scripts/ci-run-timings.mjs --latest-main # 이슈/댓글 노이즈를 무시하고 origin/main 푸시 CI 선택
node scripts/ci-run-timings.mjs --recent 10   # 최근 성공한 main CI 실행 비교
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 성능

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. `main`에서 매일 실행되며 수동으로 디스패치할 수 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 참조를 벤치마크합니다. 현재 워크플로 구현으로 릴리스 태그나 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하십시오. 게시된 보고서 경로와 최신 포인터는 테스트된 참조를 기준으로 키가 지정되며, 각 `index.md`에는 테스트된 참조/SHA, 워크플로 참조/SHA, Kova 참조, 프로필, 레인 인증 모드, 모델, 반복 횟수, 시나리오 필터가 기록됩니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고, 고정된 `kova_ref` 입력에 따라 `openclaw/Kova`에서 Kova를 설치한 후 다음 세 레인을 실행합니다.

- `mock-provider`: 결정론적인 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에서 Kova 진단 시나리오를 실행합니다.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴 핫스폿에 대한 CPU/힙/트레이스 프로파일링입니다. 일정에 따라 실행되거나 `deep_profile=true`로 디스패치할 때 실행됩니다.
- `live-openai-candidate`: 실제 OpenAI `openai/gpt-5.6-luna` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다. 일정에 따라 실행되거나 `live_openai_candidate=true`로 디스패치할 때 실행됩니다.

mock-provider 레인은 Kova 패스 후 OpenClaw 네이티브 소스 프로브도 실행합니다. 여기에는 기본, 채널 건너뛰기, 내부 훅, 50개 Plugin 시작 사례에 걸친 Gateway 부팅 시간 및 메모리, 번들 Plugin 가져오기 RSS, 반복되는 모의 OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway에 대한 CLI 시작 명령, SQLite 상태 스모크 성능 프로브가 포함됩니다. 테스트된 참조에 대해 이전에 게시된 mock-provider 소스 보고서를 사용할 수 있으면 소스 요약에서 현재 RSS 및 힙 값을 해당 기준선과 비교하고 큰 RSS 증가를 `watch`로 표시합니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON도 같은 위치에 있습니다.

각 레인은 CPU, 힙, 트레이스, 압축된 진단 번들을 포함한 전체 GitHub 아티팩트를 업로드합니다. 별도의 게시자 작업이 해당 아티팩트를 다운로드하고 검증한 다음, `openclaw/clawgrit-reports` 콘텐츠로만 범위가 제한된 단기 ClawSweeper GitHub App 토큰을 발급하여 Git 푸시 단계에만 전달합니다. 이 작업은 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래에 `report.json`, `report.md`, `index.md`, 소스 프로브 아티팩트, 번들 메타데이터/체크섬을 커밋하며, 전체 진단 아카이브는 연결된 Actions 아티팩트에 유지됩니다. 게시자는 푸시를 시도하기 전에 50 MB를 초과하는 모든 보고서 파일을 거부합니다. 현재 테스트된 참조 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`입니다. 예약 실행 및 `profile=release` 디스패치는 앱 토큰 생성이나 보고서 게시가 실패하면 실패합니다. 수동 비릴리스 디스패치에서는 게시를 권고 사항으로 유지하고 인증이나 게시가 실패해도 GitHub 아티팩트를 보존합니다. 이전 소스 기준선은 공개 보고서 저장소에서 익명으로 가져오므로, 기준선을 성공적으로 가져왔다고 해서 게시자 인증이 입증되는 것은 아닙니다.

## 전체 릴리스 검증

`Full Release Validation`은 "릴리스 전에 모든 항목 실행"을 위한 수동 통합 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 받아 해당 대상으로 수동 `CI` 워크플로(Android 포함)를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 검증을 위해 `Plugin Prerelease`를 디스패치하며, 대상 SHA에 대해 `OpenClaw Performance`를 디스패치하고, 설치 스모크, 패키지 승인, 크로스 OS 패키지 검사, QA Lab 일치 여부, Matrix, Telegram 레인을 위해 `OpenClaw Release Checks`를 디스패치합니다(권고용 성숙도 스코어카드 렌더링은 `run_maturity_scorecard`를 통한 옵트인 방식입니다). 안정 및 전체 프로필에는 항상 철저한 라이브/E2E 및 Docker 릴리스 경로 소크 범위가 포함되며, 베타 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다. 정규 패키지 Telegram E2E는 Package Acceptance 내부에서 실행되므로 전체 후보는 중복 라이브 폴러를 시작하지 않습니다. 게시 후에는 `release_package_spec`을 전달하여 다시 빌드하지 않고도 릴리스 검사, Package Acceptance, Docker, 크로스 OS, Telegram에서 배포된 npm 패키지를 재사용하십시오. 게시된 패키지 Telegram만 집중적으로 재실행할 때는 `npm_telegram_package_spec`만 사용하십시오. Codex Plugin 라이브 패키지 레인도 기본적으로 동일하게 선택된 상태를 사용합니다. 게시된 `release_package_spec=openclaw@<tag>`는 `codex_plugin_spec=npm:@openclaw/codex@<tag>`를 파생하며, SHA/아티팩트 실행은 선택된 참조에서 `extensions/codex`를 패킹합니다. `npm:`, `npm-pack:`, `git:` 사양과 같은 사용자 지정 Plugin 소스에는 `codex_plugin_spec`을 명시적으로 설정하십시오.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트, 집중 재실행 핸들은
[전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하십시오.

`OpenClaw Release Publish`는 수동으로 변경을 수행하는 릴리스 워크플로입니다. 릴리스 태그가
존재하고 OpenClaw npm 사전 점검이 성공한 후 신뢰할 수 있는 `main`에서
정기 베타 및 안정 버전 게시를 디스패치합니다(사전 점검은 검사 항목 중 하나로
`pnpm plugins:sync:check`를 실행합니다). 태그는 여전히
`release/YYYY.M.PATCH`의 커밋을 포함한 정확한 릴리스 커밋을 선택하며, Tideclaw 알파
게시는 계속 해당 알파 브랜치를 사용합니다. 저장된
`preflight_run_id`와 성공한
`full_release_validation_run_id` 및 정확한
`full_release_validation_run_attempt`가 필요하며, 게시 가능한 모든 Plugin 패키지에 대해
`Plugin NPM Release`를 디스패치하고, 동일한 릴리스 SHA에 대해
`Plugin ClawHub Release`를 디스패치한 다음에만 `OpenClaw NPM Release`를 디스패치합니다. 안정 버전 게시에는
정확한 `windows_node_tag`도 필요합니다. 워크플로는 게시 하위 작업을 실행하기 전에 Windows 소스
릴리스를 검증하고 해당 x64/ARM64 설치 프로그램을 후보 승인된
`windows_node_installer_digests` 입력과 비교한 다음, GitHub 릴리스 초안을 게시하기 전에
고정된 동일 설치 프로그램 다이제스트와 정확한 동반 자산 및 체크섬 계약을
승격하고 검증합니다.
Plugin 전용의 집중 복구에는 비어 있지 않은 패키지 목록과 함께 `plugin_publish_scope=selected`를
사용합니다. Plugin 전용 `all-publishable` 실행에는 코어 게시와 동일한 불변 npm
사전 점검 및 Full Release Validation 증거가 필요합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

빠르게 변경되는 브랜치에서 고정된 커밋 증거가 필요한 경우
`gh workflow run ... --ref main -f ref=<sha>` 대신 도우미를 사용합니다.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다.
도우미는 신뢰할 수 있는 `main` 워크플로 SHA에 임시 `release-ci/<sha>-...` 브랜치를
푸시하고, 요청된 대상 SHA를 워크플로 `ref` 입력으로 전달하며,
사용 가능한 경우 엄격한 정확 대상 증거를 재사용하고, 모든 하위
워크플로의 `headSha`가 신뢰할 수 있는 워크플로 SHA와 일치하는지 검증한 뒤 실행이 완료되면 임시
브랜치를 삭제합니다. 새 검증을 강제하려면 `-f reuse_evidence=false`를 전달합니다.
통합 검증기는 하위 워크플로가 다른 워크플로 SHA에서 실행된 경우에도 실패합니다.

`release_profile`은 릴리스 검사에 전달되는 라이브/제공자 범위를 제어합니다.
수동 릴리스 워크플로의 기본값은 `stable`입니다. 광범위한 권고용 제공자/미디어 매트릭스를
의도적으로 실행하려는 경우에만 `full`을 사용합니다. 안정 버전 및 전체 릴리스 검사는 항상
포괄적인 라이브/E2E 및 Docker 릴리스 경로 장시간 검사를 실행합니다.
베타 프로필에서는 `run_release_soak=true`로 이를 활성화할 수 있습니다.

- `minimum`은 가장 빠른 OpenAI/코어 릴리스 필수 레인을 유지합니다.
- `stable`은 안정 제공자/백엔드 집합을 추가합니다.
- `full`은 광범위한 권고용 제공자/미디어 매트릭스를 실행합니다.

통합 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은
현재 하위 실행 결과를 다시 확인하고 각 하위 실행에서 가장 느린 작업의 표를 추가합니다. 하위 워크플로를
재실행하여 성공으로 전환된 경우 상위 검증기 작업만 재실행하여 통합 결과와 시간 요약을
갱신합니다.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을
허용합니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 작업에만 적용하려면 `ci`,
Plugin 시험판 하위 작업에만 적용하려면 `plugin-prerelease`, OpenClaw Performance 하위 작업에만
적용하려면 `performance`, 모든 릴리스 하위 작업에는 `release-checks`를 사용하거나,
통합 워크플로에서 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` 또는 `npm-telegram`을 사용합니다. 이를 통해 집중 수정 후
실패한 릴리스 환경의 재실행 범위를 제한할 수 있습니다. 실패한 단일 크로스 OS 레인에는
`rerun_group=cross-os`와 `cross_os_suite_filter`를 결합합니다. 예:
`windows/packaged-upgrade`. 장시간 실행되는 크로스 OS 명령은 Heartbeat 줄을 출력하며,
패키지 업그레이드 요약에는 단계별 시간이 포함됩니다. QA 릴리스 검사 레인은 표준 런타임 도구
커버리지 게이트를 제외하면 권고용입니다. 필수 OpenClaw 동적 도구가 표준 티어 요약에서
달라지거나 사라지면 해당 게이트가 차단합니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용하여 선택한 ref를 한 번만
`release-package-under-test` tarball로 확인한 다음, 해당 아티팩트를 크로스 OS 검사와
Package Acceptance 및 장시간 검사 커버리지가 실행될 때 라이브/E2E 릴리스 경로 Docker 워크플로에
전달합니다. 이렇게 하면 여러 릴리스 환경에서 동일한 후보를 반복해서 패키징하지 않고
릴리스 환경 전반에 걸쳐 패키지 바이트를 일관되게 유지할 수 있습니다. Codex npm Plugin 라이브
레인의 경우 릴리스 검사는 `release_package_spec`에서 파생된 일치하는 게시 Plugin 사양을
전달하거나, 운영자가 제공한 `codex_plugin_spec`을 전달하거나, 입력을 비워 두어 Docker 스크립트가
선택한 체크아웃의 Codex Plugin을 패키징하도록 합니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은
이전 통합 워크플로를 대체합니다. 상위 모니터는 상위 작업이 취소되면 이미 디스패치한 모든 하위 워크플로를
취소하므로, 더 새로운 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에서 대기하지 않습니다.
릴리스 브랜치/태그 검증과 집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## 라이브 및 E2E 샤드

릴리스 라이브/E2E 하위 작업은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름이 지정된 샤드로 실행합니다.

- `native-live-src-agents` 및 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- 제공자별로 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분리된 미디어 오디오/비디오 샤드 및 제공자별로 필터링된 음악 샤드

이렇게 하면 동일한 파일 커버리지를 유지하면서 느린 라이브 제공자 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계된 `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` 및 `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 라이브 미디어 샤드는 `Live Media Runner Image` 워크플로에서 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 이 이미지에는 `ffmpeg`와 `ffprobe`가 사전 설치되어 있으며, 미디어 작업은 설정 전에 바이너리만 확인합니다. Docker 기반 라이브 스위트는 일반 Blacksmith 러너에서 유지하십시오. 컨테이너 작업은 중첩된 Docker 테스트를 실행하기에 적합하지 않습니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, 제공자별 Gateway, CLI 백엔드, ACP 바인드 및 Codex 하네스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드는 멈춘 컨테이너나 정리 경로가 전체 릴리스 검사 예산을 소비하는 대신 빠르게 실패하도록 워크플로 작업 시간 제한보다 짧은 명시적인 스크립트 수준 `timeout` 제한을 사용합니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드에 실제 시간을 낭비하게 됩니다.

## Package Acceptance

“설치 가능한 이 OpenClaw 패키지가 제품으로서 작동하는가?”를 확인하려면 `Package Acceptance`를 사용합니다. 일반 CI와는 다릅니다. 일반 CI는 소스 트리를 검증하지만, 패키지 인수 검사는 사용자가 설치 또는 업데이트 후 실행하는 것과 동일한 Docker E2E 하네스를 통해 단일 tarball을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 확인하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`와 `.artifacts/docker-e2e-package/package-candidate.json`을 작성하고, 둘 다 `package-under-test` 아티팩트로 업로드하며, 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256 및 프로필을 GitHub 단계 요약에 출력합니다.
2. `package_integrity`는 `package-under-test` 아티팩트를 다운로드하고 `scripts/check-openclaw-package-tarball.mjs`를 사용하여 공개 패키지 tarball 계약을 적용합니다.
3. `docker_acceptance`는 확인된 패키지 소스 SHA(`workflow_ref`로 대체 가능)와 `package_artifact_name=package-under-test`를 사용하여 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, tarball 인벤토리를 검증하고, 필요한 경우 패키지 다이제스트 Docker 이미지를 준비하며, 워크플로 체크아웃을 패키징하는 대신 해당 패키지를 대상으로 선택한 Docker 레인을 실행합니다. 프로필에서 여러 대상 `docker_lanes`를 선택하면 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 레인을 고유한 아티팩트를 사용하는 병렬 대상 Docker 작업으로 분산합니다.
4. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance에서 패키지를 확인한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립형 Telegram 디스패치는 게시된 npm 사양을 계속 설치할 수 있습니다.
5. 패키지 확인, 무결성, Docker 인수 검사 또는 선택적 Telegram 레인이 실패하면 `summary`가 워크플로를 실패 처리합니다. `advisory` 입력은 권고용 호출자에 대해 인수 검사 실패를 경고로 낮춥니다.

### 후보 소스

- `source=npm`은 `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` 또는 `openclaw@2026.4.27-beta.2`와 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 확장 안정 버전, 시험판 또는 안정 버전의 인수 검사에 사용합니다.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패키징합니다. 확인기는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 검증하며, 분리된 작업 트리에 종속성을 설치한 다음 `scripts/package-openclaw-for-docker.mjs`로 패키징합니다.
- `source=url`은 공개 HTTPS `.tgz`를 다운로드하며 `package_sha256`이 필수입니다. 이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트 이름 또는 확인된 IP, 동일한 공개 안전 정책 범위를 벗어나는 리디렉션을 거부합니다.
- `source=trusted-url`은 `.github/package-trusted-sources.json`에 이름으로 지정된 신뢰 소스 정책에서 HTTPS `.tgz`를 다운로드하며, `package_sha256`과 `trusted_source_id`가 필수입니다. 구성된 호스트, 포트, 경로 접두사, 리디렉션 호스트 또는 비공개 네트워크 확인이 필요한 유지관리자 소유 엔터프라이즈 미러나 비공개 패키지 저장소에만 사용합니다. 정책에서 bearer 인증을 선언하면 워크플로는 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 시크릿을 사용합니다. URL에 포함된 자격 증명은 여전히 거부됩니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에 공유되는 아티팩트에는 제공해야 합니다.

`workflow_ref`와 `package_ref`를 분리해서 유지합니다. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패키징되는 소스 커밋입니다. 이를 통해 현재 테스트 하네스가 오래된 워크플로 로직을 실행하지 않고도 이전의 신뢰할 수 있는 소스 커밋을 검증할 수 있습니다.

### 스위트 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `plugins-offline` 대신 라이브 `plugins` 커버리지를 사용하는 `package` 집합에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`를 추가한 프로필
- `full` — OpenWebUI를 포함한 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 검사 범위를 사용하므로 게시된 패키지 검증이 실시간 ClawHub 가용성에 종속되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 독립 실행 디스패치용으로 게시된 npm 사양 경로를 유지합니다.

로컬 명령, Docker 레인, Package Acceptance 입력, 릴리스 기본값 및 실패 분류를 포함한 전용 업데이트 및 Plugin 테스트 정책은
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하십시오.

릴리스 검사는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 및 `telegram_mode=mock-openai`를 사용하여 Package Acceptance를 호출합니다. 이를 통해 패키지 마이그레이션, 업데이트, 실시간 ClawHub 스킬 설치, 오래된 Plugin 종속성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트 및 Telegram 검증이 모두 동일하게 확인된 패키지 tarball을 대상으로 수행됩니다. 베타를 게시한 후 Full Release Validation 또는 OpenClaw Release Checks에서 `release_package_spec`을 설정하면 다시 빌드하지 않고 게시된 npm 패키지를 대상으로 동일한 매트릭스를 실행할 수 있습니다. Package Acceptance에서 나머지 릴리스 검증과 다른 패키지를 사용해야 하는 경우에만 `package_acceptance_package_spec`을 설정하십시오. 크로스 OS 릴리스 검사는 계속해서 OS별 온보딩, 설치 프로그램 및 플랫폼 동작을 검사합니다. 패키지/업데이트 제품 검증은 Package Acceptance부터 시작해야 합니다.

`published-upgrade-survivor` Docker 레인은 차단형 릴리스 경로에서 실행당 하나의 게시된 패키지 기준선을 검증합니다. Package Acceptance에서는 확인된 `package-under-test` tarball이 항상 후보이며, `published_upgrade_survivor_baseline`이 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인의 재실행 명령은 해당 기준선을 유지합니다. `run_release_soak=true` 또는 `release_profile=full`을 사용하는 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'`와 `published_upgrade_survivor_scenarios=reported-issues`를 설정하여 최신 안정 npm 릴리스 4개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 부트스트랩/페르소나 파일, 구성된 OpenClaw Plugin 설치, 물결표 로그 경로 및 오래된 레거시 Plugin 종속성 루트를 위한 이슈 형태의 픽스처까지 범위를 확장합니다. 여러 기준선을 사용하는 게시된 업그레이드 생존 검사는 기준선별로 샤딩되어 별도의 대상 지정 Docker 러너 작업에서 실행됩니다. 별도의 `Update Migration` 워크플로는 일반적인 Full Release CI 범위가 아니라 게시된 업데이트 정리를 빠짐없이 검사해야 할 때 `all-since-2026.4.23` 기준선 및 `plugin-deps-cleanup` 시나리오와 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행에서는 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 사양을 전달하거나, `openclaw@2026.4.15`와 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 내장된 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz` 및 RPC 상태를 검사합니다. Windows 패키지 및 설치 프로그램 신규 설치 레인에서도 설치된 패키지가 원시 절대 Windows 경로에서 브라우저 제어 재정의를 가져올 수 있는지 검증합니다. OpenAI 크로스 OS 에이전트 턴 스모크는 `OPENCLAW_CROSS_OS_OPENAI_MODEL`이 설정된 경우 이를 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.6-luna`를 사용하므로 설치 및 Gateway 검증에 더 저렴한 GPT-5.6 테스트 계층이 사용됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 다음 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목이 tarball에서 제외된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`가 `gateway install --wrapper` 영속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`가 tarball에서 파생된 가짜 git 픽스처에서 누락된 pnpm `patchedDependencies`를 제거하고 영속화된 `update.channel`의 누락을 기록할 수 있습니다.
- Plugin 스모크가 레거시 설치 레코드 위치를 읽거나 마켓플레이스 설치 레코드 영속성의 누락을 허용할 수 있습니다.
- `plugin-update`는 설치 레코드 및 재설치 방지 동작이 변경되지 않아야 한다는 요구 사항을 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있으며, `2026.5.20`까지의 패키지는 `npm-shrinkwrap.json`이 누락된 경우 실패하는 대신 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 하며, 동일한 조건에서 경고하거나 건너뛰는 대신 실패합니다.

### 예시

```bash
# 제품 수준 검사 범위로 현재 베타 패키지를 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 패키지 검사 범위로 게시된 확장 안정 패키지를 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 현재 하네스로 릴리스 브랜치를 패킹하고 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# tarball URL을 검증합니다. source=url에는 SHA-256이 필수입니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 이름이 지정된 신뢰할 수 있는 비공개 미러 정책의 tarball을 검증합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 다른 Actions 실행에서 업로드한 tarball을 재사용합니다.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

실패한 패키지 승인 실행을 디버깅할 때는 `resolve_package` 요약에서 시작하여 패키지 소스, 버전 및 SHA-256을 확인하십시오. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계별 시간 및 재실행 명령을 검사하십시오. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필이나 정확한 Docker 레인을 다시 실행하는 것이 좋습니다.

## 설치 스모크

`Install Smoke` 워크플로는 더 이상 풀 리퀘스트 또는 `main` 푸시에서 실행되지 않습니다. 야간/수동 래퍼와 릴리스 검증은 모두 읽기 전용 `install-smoke-reusable.yml` 코어를 호출하며, 모든 실행은 GitHub 호스팅 러너에서 전체 설치 스모크 경로를 거칩니다.

- 루트 Dockerfile 스모크 이미지는 대상 SHA마다 한 번 빌드되고 변경 불가능한 아티팩트의 워크플로 리비전 및 생성자 시도에 바인딩된 후 CLI 스모크, 에이전트의 공유 작업 공간 삭제 CLI 스모크, 컨테이너 Gateway 네트워크 E2E 및 번들된 `matrix` Plugin 빌드 인수 스모크에서 로드됩니다. Plugin 스모크는 런타임 종속성 설치 미러링과 Plugin이 진입점 이탈 진단 없이 로드되는지를 검증합니다.
- QR 패키지 설치와 설치 프로그램/업데이트 Docker 스모크는 별도 작업으로 실행됩니다. 여기에는 Rocky Linux 설치 프로그램 레인과 구성 가능한 `update_baseline_version` npm 기준선을 대상으로 하는 업데이트 레인이 포함되므로 설치 프로그램 작업이 루트 이미지 스모크 뒤에서 대기하지 않습니다.

느린 Bun 전역 설치 이미지 공급자 스모크는 `run_bun_global_install_smoke`로 별도 제어됩니다. 이 스모크는 야간 일정에서 실행되고 릴리스 검사의 워크플로 호출에서는 기본적으로 활성화되며, 수동 `Install Smoke` 디스패치에서도 선택적으로 활성화할 수 있습니다. 일반 PR CI는 Node 관련 변경에 대해 계속 빠른 Bun 런처 회귀 레인을 실행합니다. QR 및 설치 프로그램 Docker 테스트는 자체 설치 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 실시간 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹한 후 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 프로그램/업데이트/Plugin 종속성 레인을 위한 기본 Node/Git 러너
- 일반 기능 레인을 위해 동일한 tarball을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 러너는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 및 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`를 사용하여 레인별 이미지를 선택한 다음 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 용도                                                                                                  |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인의 주 풀 슬롯 수입니다.                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 공급자에 민감한 후행 풀 슬롯 수입니다.                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 공급자가 속도를 제한하지 않도록 하는 동시 실시간 레인 상한입니다.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 동시 npm 설치 레인 상한입니다.                                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한입니다.                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 방지하기 위한 레인 시작 간격입니다. 간격을 없애려면 `0`으로 설정하십시오.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분)입니다. 선택된 실시간/후행 레인에는 더 엄격한 상한이 적용됩니다.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 미설정  | `1`이면 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | 미설정  | 쉼표로 구분된 정확한 레인 목록입니다. 에이전트가 실패한 레인 하나를 재현할 수 있도록 정리 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 빈 풀에서는 시작할 수 있으며, 이후 용량을 반환할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 출력하고, 최장 시간 우선 순서를 위해 레인 소요 시간을 영속화하며, 기본적으로 첫 번째 실패 후에는 새로운 풀 레인의 예약을 중지합니다.

### 재사용 가능한 실시간/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 필요한 패키지, 이미지 종류, 라이브 이미지, 레인 및 자격 증명 적용 범위를 질의합니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 스크립트는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패키징하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`에서 패키지 아티팩트를 다운로드한 후 tarball 인벤토리를 검증합니다. 기본 `no-push-artifact` 경로는 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 지정된 bare/functional 이미지를 빌드하고, 정확한 이미지 바이트를 변경 불가능한 워크플로 아티팩트로 패키징하며, 각 소비자가 해당 아티팩트를 검증하고 로드하도록 합니다. 반면 `existing-only`는 명시적인 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 참조를 요구하며 빌드하거나 푸시하지 않습니다. 이러한 레지스트리 풀에는 시도당 180초로 제한된 타임아웃이 적용되므로 스트림이 멈추더라도 CI 핵심 경로의 대부분을 소모하는 대신 빠르게 재시도합니다. 예약된 검증이 성공하면 `openclaw-scheduled-live-checks.yml`은 변경 불가능한 테스트 완료 이미지 매니페스트를 별도의 패키지 쓰기 게시자에게 전달합니다. 읽기 전용 릴리스 및 프리릴리스 호출자는 해당 작성자를 절대 거치지 않습니다.

### 릴리스 경로 청크

릴리스 Docker 적용 범위는 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용하는 더 작은 청크 작업으로 실행되므로 각 청크는 필요한 아티팩트 기반 이미지 종류만 검증하고 로드하거나 명시적인 `existing-only` 재사용에 따라 풀하고, 동일한 가중치 기반 스케줄러를 통해 여러 레인을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지, 그리고 `openwebui`입니다. `package-update-openai`에는 라이브 Codex Plugin 패키지 레인이 포함됩니다. 이 레인은 후보 OpenClaw 패키지를 설치하고, 명시적인 Codex CLI 설치 승인과 함께 `codex_plugin_spec` 또는 동일 참조의 tarball에서 Codex Plugin을 설치하며, Codex CLI 사전 점검을 실행한 다음 OpenAI를 대상으로 동일한 세션에서 여러 OpenClaw 에이전트 턴을 실행합니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/런타임 별칭으로 유지됩니다. `install-e2e` 레인 별칭은 두 공급자 설치 프로그램 레인을 위한 집계 수동 재실행 별칭으로 유지됩니다.

OpenWebUI는 안정 릴리스 또는 전체 릴리스 경로 적용 범위에서 요청할 때마다 전용 대용량 디스크 Blacksmith 러너에서 독립 실행형 `openwebui` 청크로 실행되며, 재사용 가능한 워크플로가 지원되는 작업을 GitHub 호스팅 러너로 라우팅하는 경우에도 마찬가지입니다. 외부 이미지 풀을 분리하면 대용량 이미지가 `plugins-runtime-services`의 공유 패키지 및 Plugin 이미지와 경쟁하지 않습니다. 기존 집계 Plugin/런타임 청크에는 호환되는 수동 재실행을 위해 OpenWebUI가 계속 포함됩니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 장애가 발생하면 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 표 및 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로의 `docker_lanes` 입력은 청크 작업 대신 해당 실행을 위해 준비된 이미지에서 선택한 레인을 실행하므로 실패한 레인의 디버깅이 하나의 대상 지정 Docker 작업으로 제한됩니다. 선택한 레인이 라이브 Docker 레인이면 대상 지정 작업이 해당 재실행을 위한 라이브 테스트 이미지를 로컬에서 빌드합니다. 내부 재사용 가능 워크플로의 패키지 튜플은 `workflow_dispatch` 스키마에 포함되지 않으므로 재실행 도우미는 실패 아티팩트의 정확한 선택 대상 SHA를 검증하고 수동 디스패치는 해당 참조를 다시 패키징합니다. 생성된 명령에는 준비된 이미지 입력과 해당 입력이 GHCR 기반일 때만 `shared_image_policy=existing-only`가 포함됩니다. 러너 로컬 아티팩트 태그는 생략되어 새 러너가 이를 다시 빌드합니다. 명시적인 대상 재정의가 있으면 아티팩트가 재정의와 일치함을 증명하지 않는 한 복구된 GHCR 이미지 참조를 제거합니다. 전체 릴리스 임시 브랜치는 삭제되므로 아티팩트에서 생성된 워크플로 정의 참조도 생략됩니다. 운영자가 명시적으로 재정의하지 않는 한 디스패치는 저장소의 기본 브랜치를 사용합니다.

```bash
pnpm test:docker:rerun <run-id>      # Docker 아티팩트를 다운로드하고 결합된/레인별 대상 지정 재실행 명령을 출력합니다
pnpm test:docker:timings <summary>   # 느린 레인 및 단계 핵심 경로 요약
```

예약된 라이브/E2E 워크플로는 전체 릴리스 경로 Docker 제품군을 매일 실행하고, 성공하면 정확히 테스트된 이미지 아티팩트에 대해 명시적인 게시자를 호출합니다.

## Plugin 프리릴리스

`Plugin Prerelease`는 더 많은 비용이 드는 제품/패키지 적용 범위이므로 `Full Release Validation` 또는 명시적인 운영자가 디스패치하는 별도의 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시 및 독립 실행형 수동 CI 디스패치에서는 해당 제품군을 실행하지 않습니다. 이 워크플로는 번들 Plugin 테스트를 8개의 확장 작업자에 분산합니다. 이러한 확장 샤드 작업은 한 번에 최대 2개의 Plugin 구성 그룹을 실행하며, 그룹당 하나의 Vitest 작업자와 더 큰 Node 힙을 사용하여 임포트가 많은 Plugin 배치 때문에 추가 CI 작업이 생성되지 않도록 합니다. 릴리스 전용 Docker 프리릴리스 경로는 `full_release_validation` 입력으로 활성화되며, 1~3분짜리 작업을 위해 수십 개의 러너를 예약하지 않도록 대상 지정 Docker 레인을 4개씩 묶어 처리합니다. 또한 이 워크플로는 `@openclaw/plugin-inspector`의 정보 제공용 `plugin-inspector-advisory` 아티팩트를 업로드합니다. 인스펙터 발견 사항은 트리아지 입력이며 차단형 Plugin 프리릴리스 게이트를 변경하지 않습니다.

## QA Lab

QA Lab에는 기본 스마트 범위 지정 워크플로 외부에 전용 CI 레인이 있습니다. 에이전트 패리티는 독립 실행형 PR 워크플로가 아니라 광범위한 QA 및 릴리스 하네스 아래에 중첩됩니다. 패리티를 광범위한 검증 실행과 함께 수행해야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용하십시오.

- `QA-Lab - All Lanes` 워크플로는 `main`에서 매일 밤 및 수동 디스패치 시 실행됩니다. 모의 패리티 레인, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 분산합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하며 Telegram/Discord는 Convex 임대를 사용합니다.

릴리스 검사는 결정론적 모의 공급자와 모의 한정 모델(`mock-openai/gpt-5.6-luna` 및 `mock-openai/gpt-5.6-luna-alt`)을 사용하여 Matrix 및 Telegram 라이브 전송 레인을 실행하므로 채널 계약이 라이브 모델 지연 시간 및 일반 공급자 Plugin 시작과 분리됩니다. QA 패리티에서 메모리 동작을 별도로 다루므로 라이브 전송 Gateway는 메모리 검색을 비활성화합니다. 공급자 연결은 별도의 라이브 모델, 네이티브 공급자 및 Docker 공급자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI에서 지원하는 경우에만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 적용 범위를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`도 릴리스 승인 전에 릴리스에 중요한 QA Lab 레인을 실행합니다. QA 패리티 게이트는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 패리티 비교를 위해 두 아티팩트를 모두 작은 보고서 작업으로 다운로드합니다.

일반 PR에서는 패리티를 필수 상태로 취급하지 말고 범위가 지정된 CI/검사 증거를 따르십시오.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 범위를 좁힌 1차 보안 스캐너입니다. 일일, 수동, `main` 푸시 및 초안이 아닌 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 표면을 검사하며, 높음/치명적 `security-severity`로 필터링된 신뢰도 높은 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` 또는 프로세스를 소유하는 번들 Plugin 런타임 경로 아래에 변경이 있을 때만 시작하며, 예약된 워크플로와 동일한 신뢰도 높은 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에 포함되지 않습니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 비밀 정보, 샌드박스, Cron 및 Gateway 기준선                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 핵심 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 비밀 정보, 감사 접점                                              |
| `/codeql-security-high/network-ssrf-boundary`     | 핵심 SSRF, IP 구문 분석, 네트워크 가드, 웹 가져오기 및 Plugin SDK SSRF 정책 표면                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 도우미, 아웃바운드 전달 및 에이전트 도구 실행 게이트                                                     |
| `/codeql-security-high/process-exec-boundary`     | 로컬 셸, 프로세스 생성 도우미, 하위 프로세스를 소유하는 번들 Plugin 런타임 및 워크플로 스크립트 연결 코드                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩 및 Plugin SDK 패키지 계약 신뢰 경계 표면                |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 온전성 검사에서 허용되는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 종속성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. 결과가 깨끗한 경우에도 macOS 빌드가 실행 시간을 지배하므로 일일 기본값 외부에 유지됩니다.

### 치명적 품질 범주

`CodeQL Critical Quality`는 이에 대응하는 비보안 샤드입니다. 품질 검사에서 Blacksmith 러너 등록 예산을 소모하지 않도록 GitHub 호스팅 Linux 러너에서 범위가 좁고 가치가 높은 표면을 대상으로 오류 심각도이며 비보안인 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 의도적으로 예약 프로필보다 작습니다. 초안이 아닌 PR은 PR 라우팅이 가능한 13개 샤드 중 자신이 변경한 표면에 해당하는 샤드만 실행합니다. 해당 샤드는 `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary`, `session-diagnostics-boundary`입니다. `ui-control-plane`과 `web-media-runtime-boundary`는 PR 실행에서 제외됩니다. CodeQL 구성 및 품질 워크플로 변경은 전체 PR 샤드 세트를 실행합니다. 네트워크 런타임 샤드는 자체 CodeQL 구성 파일과 네트워크 소유 소스 경로에 따라 결정됩니다.

수동 디스패치에서는 다음을 허용합니다.

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 격리하여 실행하기 위한 교육/반복용 진입점입니다.

| 범주                                                    | 영역                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 시크릿, 샌드박스, Cron 및 Gateway 보안 경계 코드                                                                                                              |
| `/codeql-critical-quality/config-boundary`              | 구성 스키마, 마이그레이션, 정규화 및 IO 계약                                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마 및 서버 메서드 계약                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 코어 채널 및 번들 채널 Plugin 구현 계약                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/공급자 디스패치, 자동 응답 디스패치와 큐 및 ACP 제어 영역 런타임 계약                                                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼 및 아웃바운드 전달 계약                                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 퍼사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 연결 코드 및 메모리 doctor 명령                                                |
| `/codeql-critical-quality/network-runtime-boundary`     | 네트워크 정책 패키지, 원시 소켓 및 프록시 캡처 런타임, SSH 터널, Gateway 잠금, JSONL 소켓 및 푸시 전송 영역                                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부 구현, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 영역 및 세션 doctor CLI 계약                                              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청크 분할/런타임 헬퍼, 채널 응답 옵션, 전달 큐 및 세션/스레드 바인딩 헬퍼                                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 공급자 인증과 탐색, 공급자 런타임 등록, 공급자 기본값/카탈로그 및 웹/검색/가져오기/임베딩 레지스트리                                         |
| `/codeql-critical-quality/ui-control-plane`             | 제어 UI 부트스트랩, 로컬 영속성, Gateway 제어 흐름 및 작업 제어 영역 런타임 계약                                                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 코어 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성 및 미디어 생성 런타임 계약                                                                                |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 영역 및 Plugin SDK 진입점 계약                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 플러그인 패키지 계약 헬퍼                                                                                                      |

품질 결과를 예약, 측정, 비활성화 또는 확장할 때 보안 신호가 흐려지지 않도록 품질을 보안과 분리하여 유지합니다. Swift, Python 및 번들 Plugin의 CodeQL 확장은 좁은 프로필의 런타임과 신호가 안정화된 후에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 기존 문서를 최근 병합된 변경 사항과 일치하도록 유지하는 이벤트 기반 Codex 유지관리 레인입니다. 순수한 일정 실행은 없습니다. `main`에서 봇이 아닌 푸시의 CI 실행이 성공하면 트리거될 수 있으며, 수동 디스패치로 직접 실행할 수도 있습니다. 워크플로 실행 호출은 `main`이 이미 더 진행되었거나 지난 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행 시 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번의 실행으로 마지막 문서 검토 이후 누적된 모든 main 변경 사항을 처리할 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지관리 레인입니다. 순수한 일정 실행은 없습니다. `main`에서 봇이 아닌 푸시의 CI 실행이 성공하면 트리거될 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 이 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트의 그룹화된 Vitest 성능 보고서를 작성하고, Codex가 광범위한 리팩터링 대신 커버리지를 유지하는 소규모 테스트 성능 수정만 수행하도록 한 다음, 전체 스위트 보고서를 다시 실행하여 통과 기준선의 테스트 수를 줄이는 변경을 거부합니다. 그룹화된 보고서는 Linux와 macOS에서 구성별 경과 시간과 최대 RSS를 기록하므로, 전후 비교에서 테스트 메모리 변화량을 지속 시간 변화량과 함께 확인할 수 있습니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 작업 후 전체 스위트 보고서는 커밋 전에 반드시 통과해야 합니다. 봇 푸시가 반영되기 전에 `main`이 진행되면 이 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 후 푸시를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex 액션이 문서 에이전트와 동일한 sudo 제거 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 병합 후 중복 항목을 정리하기 위한 수동 유지관리자 워크플로입니다. 기본값은 드라이런이며 `apply=true`일 때만 명시적으로 나열된 PR을 닫습니다. GitHub을 변경하기 전에 병합된 PR이 실제로 병합되었으며, 각 중복 PR에 공통으로 참조된 이슈가 있거나 변경된 헝크가 겹치는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트 및 변경 사항 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`에서 실행됩니다. 이 로컬 검사 게이트는 광범위한 CI 플랫폼 범위보다 아키텍처 경계를 더 엄격하게 적용합니다.

- 코어 프로덕션 변경은 코어 프로덕션 및 코어 테스트 타입 검사와 코어 린트/가드를 실행합니다.
- 코어 테스트 전용 변경은 코어 테스트 타입 검사와 코어 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입 검사와 확장 린트를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입 검사와 확장 린트를 실행합니다.
- 공개 Plugin SDK 또는 플러그인 계약 변경은 확장이 해당 코어 계약에 의존하므로 확장 타입 검사까지 확대됩니다(Vitest 확장 스윕은 명시적인 테스트 작업으로 유지됩니다).
- 릴리스 메타데이터 전용 버전 상향은 대상이 지정된 버전/구성/루트 종속성 검사를 실행합니다.
- 알 수 없는 루트/구성 변경은 안전을 위해 모든 검사 레인을 실행합니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접적인 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 다음 형제 테스트와 임포트 그래프 종속 항목을 실행합니다. 공유 그룹 대화방 전달 구성은 명시적 매핑 중 하나입니다. 그룹 공개 응답 구성, 소스 응답 전달 모드 또는 메시지 도구 시스템 프롬프트가 변경되면 코어 응답 테스트와 Discord 및 Slack 전달 회귀 테스트로 라우팅되어 공유 기본값 변경이 첫 PR 푸시 전에 실패하도록 합니다. 변경 사항이 하네스 전체에 영향을 미쳐 저렴한 매핑 집합을 신뢰할 만한 대리 지표로 사용할 수 없는 경우에만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하십시오.

## Testbox 검증

Crabbox는 유지관리자의 Linux 검증을 위한 저장소 소유 원격 박스 래퍼입니다. 에이전트
세션은 빌드, 타입 검사, 린트 팬아웃, Docker, 패키지 레인, E2E, 라이브
검증 및 CI 동등성 검증을 포함한 테스트와 계산 집약적 작업에 기본적으로 사용합니다.
신뢰할 수 있는 유지관리자 코드는 기본적으로
`blacksmith-testbox`를 사용하며, 이제 `.crabbox.yaml`도 이를 기본값으로 사용합니다. 구성된
워크플로는 공급자 및 에이전트 자격 증명을 하이드레이션하므로 신뢰할 수 없는 기여자 또는
포크 코드는 시크릿 없는 포크 CI나 정제된 직접 AWS Crabbox를 대신 사용해야 합니다.
정제된 AWS 실행은 `CRABBOX_ENV_ALLOW=CI`를 설정하고
`--no-hydrate`를 전달하며 새로운 임시 원격 `HOME`을 사용합니다. 이렇게 하면 저장소의
`OPENCLAW_*` 허용 목록과 기존 인증 프로필이 신뢰할 수 없는 코드에 노출되지 않습니다.
이 실행은 해당 신뢰할 수 없는 소스 전용으로 새로 준비된 리스를 사용하며, 신뢰할 수 있거나
이전에 하이드레이션된 리스를 절대 사용하지 않습니다. 깨끗하고 신뢰할 수 있는 `main` 체크아웃에서
설치된 신뢰할 수 있는 Crabbox 바이너리를 실행하고 `--fresh-pr`을 사용하여 원격 PR만
가져오십시오. 신뢰할 수 없는 체크아웃의 래퍼나 구성을 로컬에서 절대 실행하지 마십시오.
`CRABBOX_AWS_INSTANCE_PROFILE`을 설정 해제하고 확인된
`aws.instanceProfile`이 비어 있지 않으면 안전을 위해 실패하십시오. 설치/테스트 전에 신뢰할 수 있는
절대 경로 도구를 사용하여 IMDSv2 토큰을 요구하고 IAM 자격 증명
엔드포인트가 404를 반환하는지 입증하며 원격 `git rev-parse HEAD`를 검토된
전체 PR 헤드 SHA와 비교하십시오. 리스를 해당 SHA에 바인딩하고 헤드가 변경되면 중지한 후 다시 준비하십시오.
깨끗한 `main`의 신뢰할 수 있는 `scripts/crabbox-untrusted-bootstrap.sh`를
`--fresh-pr`과 함께 업로드하십시오. 이 스크립트는 고정된 Node/pnpm을 설치하고 SHA 및
패키지 관리자 고정값을 확인하며 `HOME`을 격리하고 종속성을 설치한 다음 요청된
테스트를 실행합니다.
모든 `CRABBOX_TAILSCALE*` 재정의를 설정 해제하고 `--network public
--tailscale=false`를 강제하며 출구 노드/LAN 플래그를 지우고 스크립트를 업로드하기 전에
`crabbox inspect`가 Tailscale 상태 없이 공개 네트워킹을 보고하도록 요구하십시오.
소유한 AWS/Hetzner 용량은 Blacksmith 장애,
할당량 문제 또는 소유 용량을 명시적으로 테스트하는 경우에도 대체 수단으로 유지됩니다.

테스트나 무거운 검증이 필요할 가능성이 높은 신뢰할 수 있는 코드 작업을 시작할 때 에이전트는
백그라운드 명령 세션에서 즉시 사전 준비를 시작하고, 하이드레이션이 진행되는 동안
검사와 편집을 계속하며, 반환된 `tbx_...` ID를 재사용하고,
실행할 때마다 현재 체크아웃을 동기화한 후 인계 전에 중지해야 합니다.

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox 기반 Blacksmith 실행은 일회성 Testbox를 준비하고, 할당하고, 동기화하고, 실행하고, 보고한 뒤
정리합니다. 내장된 동기화 상태 검사는 동기화된 박스의
`git status --short`에 추적 중인 삭제 항목이 200개 이상 표시되면 즉시 실패하며,
이를 통해 `pnpm-lock.yaml`과 같은 루트 파일이 사라지는 문제를 감지합니다. 의도적으로
대량 삭제를 수행하는 PR의 경우 원격 명령에 `CRABBOX_ALLOW_MASS_DELETIONS=1`을 설정하십시오.

또한 Crabbox는 동기화 후 출력 없이
동기화 단계에 5분 넘게 머무르는 로컬 Blacksmith CLI 호출을 종료합니다.
해당 가드를 비활성화하려면 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`을 설정하고, 비정상적으로 큰
로컬 차이에는 더 큰 밀리초 값을 사용하십시오.

처음 실행하기 전에 저장소 루트에서 래퍼를 확인하십시오.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

저장소 래퍼는 선택한 공급자를 알리지 않는 오래된 Crabbox 바이너리를 거부하며, Blacksmith 기반 실행은 래퍼가 현재 Testbox 동기화, 큐 및 정리 동작을 사용하도록 Crabbox 0.22.0 이상을 요구합니다. Codex 작업 트리 또는 연결된/희소 체크아웃에서는 Crabbox가 시작되기 전에 pnpm이 종속성을 조정할 수 있으므로 로컬 `pnpm crabbox:run` 스크립트를 사용하지 말고 대신 Node 래퍼를 직접 호출하십시오.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

형제 체크아웃을 사용할 때는 시간 측정 또는 검증 작업 전에 무시된 로컬 바이너리를 다시 빌드하십시오.

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml`의 `blacksmith:` 블록에는 이미 조직, 워크플로, 작업 및 참조 기본값이 고정되어 있으므로 아래의 명시적 플래그는 선택 사항입니다. 변경 사항 게이트:

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
  "corepack pnpm check:changed"
```

특정 테스트 재실행:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

전체 테스트 모음:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

최종 JSON 요약을 확인하십시오. 유용한 필드는 `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 위임된
Blacksmith Testbox 실행에서는 Crabbox 래퍼의 종료 코드와 JSON 요약이
명령 결과입니다. 연결된 GitHub Actions 실행이 환경 구성과 연결 유지를 담당하며,
SSH 명령이 이미 반환된 후 Testbox가 외부에서 중지되면 `cancelled` 상태로
종료될 수 있습니다. 래퍼의 `exitCode`가 0이 아니거나 명령 출력에 테스트 실패가
나타나지 않는 한 이를 정리/상태 아티팩트로 간주하십시오.
Blacksmith 기반 일회성 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다.
실행이 중단되었거나 정리 상태가 불분명하면 실행 중인 박스를 확인하고 직접 생성한
박스만 중지하십시오.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

환경 구성이 완료된 동일한 박스에서 여러 명령을 의도적으로 실행해야 할 때만 재사용하십시오.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

오래된 소스가 아니라 임대를 재사용하십시오. 각 실행에서 현재 체크아웃을 업로드하도록
`--no-sync`를 생략하십시오. 변경되지 않았으며 이미 동기화된 트리를 의도적으로
재실행할 때만 이 플래그를 사용하십시오. 신뢰할 수 없는 기여자/포크 코드는
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` 및 각 명령마다
새로운 임시 원격 `HOME`을 사용해야 하며, 테스트 전에 해당 정제된 명령 내에서
의존성을 설치해야 합니다. 동일한 신뢰할 수 없는 소스 전용으로 새로 준비한 임대만
재사용하고, 신뢰할 수 있거나 이전에 환경 구성을 완료한 임대는 절대 재사용하지 마십시오.
신뢰할 수 없는 체크아웃의 래퍼나 구성을 로컬에서 절대 실행하지 마십시오. 신뢰할 수 있는
깨끗한 `main`에서 설치된 신뢰할 수 있는 Crabbox 바이너리를 실행하고 모든 실행에
`--fresh-pr`을 전달하십시오. `CRABBOX_AWS_INSTANCE_PROFILE`을 설정하지 않은
상태로 유지하고, 확인된 인스턴스 프로필이 비어 있지 않으면 거부하며, 신뢰할 수 있는
원격 IMDS의 역할 부재 증명을 요구하고, 설치/테스트 전에 검토한 헤드 SHA를 확인하십시오.
임대를 해당 SHA에 연결하고, 헤드가 변경될 때마다 중지한 후 다시 준비하십시오. 원격 PR이
없으면 비밀 정보 없는 포크 CI를 사용하십시오. 신뢰할 수 없는 소스에는
`hydrate-github` 또는 자격 증명으로 환경 구성을 완료하는 Blacksmith 워크플로를
절대 선택하지 마십시오.

Crabbox 계층이 고장 났지만 Blacksmith 자체는 작동하는 경우 `list`, `status`,
정리 등의 진단에만 직접 Blacksmith를 사용하십시오. 직접 Blacksmith 실행을
관리자 증명으로 간주하기 전에 Crabbox 경로를 수정하십시오.

`blacksmith testbox list --all`과 `blacksmith testbox status`는 작동하지만
새로운 준비 작업이 몇 분 후에도 IP나 Actions 실행 URL 없이 `queued` 상태에 머무르면,
이를 Blacksmith 제공자, 대기열, 결제 또는 조직 제한으로 인한 압박으로 간주하십시오.
직접 생성한 대기 중인 ID를 중지하고 더 많은 Testbox를 시작하지 마십시오. 누군가
Blacksmith 대시보드, 결제 및 조직 제한을 확인하는 동안 증명 작업을 아래의 소유 Crabbox
용량 경로로 옮기십시오.

Blacksmith가 중단되었거나, 할당량이 제한되었거나, 필요한 환경이 없거나, 소유 용량 사용이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하십시오.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS 용량에 압박이 있는 상황에서는 작업에 실제로 48xlarge급 CPU가 필요하지 않은 한
`class=beast`를 피하십시오. `beast` 요청은 192 vCPU에서 시작하며 리전별 EC2 Spot
또는 On-Demand Standard 할당량에 도달하는 가장 쉬운 방법입니다. 저장소 소유의
`.crabbox.yaml`은 기본적으로 `class: standard`, 온디맨드 시장 및
`capacity.hints: true`를 사용하므로 중개된 AWS 임대에서 선택된 리전/시장,
할당량 압박, Spot 대체 및 고부하 클래스 경고를 출력합니다. 더 무거운 광범위 검사는
`fast`를 사용하고, standard/fast로 충분하지 않을 때만 `large`를 사용하며,
전체 테스트 모음이나 모든 Plugin Docker 매트릭스, 명시적인 릴리스/차단 요소 검증 또는
다중 코어 성능 프로파일링처럼 예외적으로 CPU 의존적인 실행 구간에만 `beast`를
사용하십시오. `pnpm check:changed`, 특정 테스트, 문서 전용 작업, 일반적인
린트/타입 검사, 소규모 E2E 재현 또는 Blacksmith 중단 진단에는 `beast`를 사용하지
마십시오. 용량 진단에는 `--market on-demand`를 사용하여 Spot 시장 변동이 신호에
섞이지 않도록 하십시오.

`.crabbox.yaml`은 제공자, 동기화 및 GitHub Actions 환경 구성 기본값을 관리합니다.
Crabbox 동기화는 `.git`을 전송하지 않으므로, 환경 구성이 완료된 Actions 체크아웃은
관리자 로컬 원격 저장소와 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를
유지합니다. 또한 저장소 구성은 절대 전송해서는 안 되는 로컬 런타임/빌드 아티팩트
(예: `.artifacts` 및 테스트 보고서)를 추가로 제외합니다.
`.github/workflows/crabbox-hydrate.yml`은 체크아웃, Node/pnpm 설정,
`origin/main` 가져오기 및 소유 클라우드의 `crabbox run --id <cbx_id>` 명령을 위한
비밀 정보가 아닌 환경 전달을 관리합니다.

## 관련 문서

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
