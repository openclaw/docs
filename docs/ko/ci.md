---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하는 중입니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하는 경우
summary: CI 작업 그래프, 범위 게이트, 릴리스 우산 작업, 로컬 명령 대응 항목
title: CI 파이프라인
x-i18n:
    generated_at: "2026-07-02T14:00:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`에 푸시할 때마다, 그리고 모든 풀 리퀘스트에서 실행됩니다. 정식
`main` 푸시는 먼저 90초짜리 호스티드 러너 승인 창을 거칩니다.
기존 `CI` 동시성 그룹은 더 새 커밋이 들어오면 대기 중인 실행을 취소하므로,
연속 병합이 각각 전체 Blacksmith 매트릭스를 등록하지 않습니다.
풀 리퀘스트와 수동 디스패치는 대기를 건너뜁니다. 그런 다음 `preflight` 작업이
diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 레인을 끕니다. 수동
`workflow_dispatch` 실행은 릴리스 후보와 광범위한 검증을 위해 의도적으로 스마트
스코핑을 우회하고 전체 그래프로 팬아웃합니다. Android 레인은 `include_android`를
통해 옵트인으로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도
[`Plugin 사전 릴리스`](#plugin-prerelease) 워크플로에 있으며
[`전체 릴리스 검증`](#full-release-validation) 또는 명시적 수동 디스패치에서만
실행됩니다.

## 파이프라인 개요

| 작업                               | 목적                                                                                                      | 실행 시점                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 문서 전용 변경, 변경된 범위, 변경된 확장, CI 매니페스트 빌드를 감지                                      | 드래프트가 아닌 푸시와 PR에서 항상                  |
| `runner-admission`                 | Blacksmith 작업이 등록되기 전 정식 `main` 푸시에 대한 호스티드 90초 디바운스                            | 모든 CI 실행; 정식 `main` 푸시에서만 대기           |
| `security-fast`                    | 비공개 키 감지, `zizmor`를 통한 변경된 워크플로 감사, 프로덕션 lockfile 감사                            | 드래프트가 아닌 푸시와 PR에서 항상                  |
| `check-dependencies`               | 프로덕션 Knip 의존성 전용 패스와 미사용 파일 허용 목록 가드                                             | Node 관련 변경                                      |
| `build-artifacts`                  | `dist/`, Control UI, 빌드된 CLI 스모크 검사, 내장 빌드 산출물 검사, 재사용 가능한 산출물 빌드            | Node 관련 변경                                      |
| `checks-fast-core`                 | 번들, 프로토콜, QA Smoke CI, CI 라우팅 검사 같은 빠른 Linux 정확성 레인                                  | Node 관련 변경                                      |
| `checks-fast-contracts-plugins-*`  | 두 개로 샤딩된 Plugin 계약 검사                                                                          | Node 관련 변경                                      |
| `checks-fast-contracts-channels-*` | 두 개로 샤딩된 채널 계약 검사                                                                            | Node 관련 변경                                      |
| `checks-node-core-*`               | 채널, 번들, 계약, 확장 레인을 제외한 코어 Node 테스트 샤드                                               | Node 관련 변경                                      |
| `check-*`                          | 샤딩된 주요 로컬 게이트와 동등한 검사: 프로덕션 타입, 린트, 가드, 테스트 타입, strict 스모크            | Node 관련 변경                                      |
| `check-additional-*`               | 아키텍처, 샤딩된 경계/프롬프트 드리프트, 확장 가드, 패키지 경계, 런타임 토폴로지                        | Node 관련 변경                                      |
| `checks-node-compat-node22`        | Node 22 호환성 빌드와 스모크 레인                                                                        | 릴리스용 수동 CI 디스패치                           |
| `check-docs`                       | 문서 포매팅, 린트, 깨진 링크 검사                                                                        | 문서 변경                                           |
| `skills-python`                    | Python 기반 Skills에 대한 Ruff + pytest                                                                  | Python Skill 관련 변경                              |
| `checks-windows`                   | Windows 전용 프로세스/경로 테스트와 공유 런타임 import 지정자 회귀                                      | Windows 관련 변경                                   |
| `macos-node`                       | 공유 빌드 산출물을 사용하는 macOS TypeScript 테스트 레인                                                 | macOS 관련 변경                                     |
| `macos-swift`                      | macOS 앱용 Swift 린트, 빌드, 테스트                                                                      | macOS 관련 변경                                     |
| `ios-build`                        | Xcode 프로젝트 생성과 iOS 앱 시뮬레이터 빌드                                                            | iOS 앱, 공유 앱 키트, 또는 Swabble 변경             |
| `android`                          | 두 flavor 모두에 대한 Android 단위 테스트와 디버그 APK 빌드 하나                                        | Android 관련 변경                                   |
| `test-performance-agent`           | 신뢰된 활동 후 일일 Codex 느린 테스트 최적화                                                            | Main CI 성공 또는 수동 디스패치                     |
| `openclaw-performance`             | mock-provider, deep-profile, GPT 5.5 라이브 레인을 포함한 일일/온디맨드 Kova 런타임 성능 보고서         | 예약 실행과 수동 디스패치                           |

## Fail-fast 순서

1. `runner-admission`은 정식 `main` 푸시에 대해서만 대기합니다. 더 새 푸시가 있으면 Blacksmith 등록 전에 실행이 취소됩니다.
2. `preflight`는 어떤 레인이 아예 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 단계입니다.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, `skills-python`은 더 무거운 산출물 및 플랫폼 매트릭스 작업을 기다리지 않고 빠르게 실패합니다.
4. `build-artifacts`는 빠른 Linux 레인과 겹쳐 실행되므로 공유 빌드가 준비되는 즉시 다운스트림 소비자가 시작할 수 있습니다.
5. 그다음 더 무거운 플랫폼 및 런타임 레인이 팬아웃됩니다: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, `android`.

같은 PR 또는 `main` ref에 더 새 푸시가 들어오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI 잡음으로 취급하세요. 매트릭스 작업은 `fail-fast: false`를 사용하며, `build-artifacts`는 작은 검증 작업을 큐에 넣는 대신 내장 채널, core-support-boundary, gateway-watch 실패를 직접 보고합니다. 자동 CI 동시성 키는 버전이 지정되어(`CI-v7-*`) GitHub 쪽 좀비가 오래된 큐 그룹에서 새 main 실행을 무기한 차단하지 못합니다. 수동 전체 제품군 실행은 `CI-manual-v1-*`을 사용하며 진행 중인 실행을 취소하지 않습니다.

GitHub Actions에서 벽시계 시간, 큐 시간, 가장 느린 작업, 실패, `pnpm-store-warmup` 팬아웃 장벽을 요약하려면 `pnpm ci:timings`, `pnpm ci:timings:recent`, 또는 `node scripts/ci-run-timings.mjs <run-id>`를 사용하세요. CI는 같은 실행 요약도 `ci-timings-summary` 산출물로 업로드합니다. 빌드 타이밍은 `build-artifacts` 작업의 `Build dist` 단계를 확인하세요. `pnpm build:ci-artifacts`는 `[build-all] phase timings:`를 출력하고 `ui:build`를 포함합니다. 이 작업은 `startup-memory` 산출물도 업로드합니다.

풀 리퀘스트 실행의 경우, 터미널 timing-summary 작업은 `GH_TOKEN`을 `gh run view`에 전달하기 전에 신뢰된 base 리비전의 헬퍼를 실행합니다. 이렇게 하면 토큰이 포함된 쿼리가 브랜치가 제어하는 코드 밖에 유지되면서도 풀 리퀘스트의 현재 CI 실행을 요약할 수 있습니다.

## PR 컨텍스트와 증거

외부 기여자 PR은 `.github/workflows/real-behavior-proof.yml`에서 PR 컨텍스트와 증거 게이트를 실행합니다. 이 워크플로는 신뢰된 base 커밋을 체크아웃하고 PR 본문만 평가합니다. 기여자 브랜치의 코드는 실행하지 않습니다.

게이트는 저장소 소유자, 멤버, 협업자 또는 봇이 아닌 PR 작성자에게 적용됩니다. PR 본문에 작성된 `What Problem This Solves`와 `Evidence` 섹션이 있으면 통과합니다. 증거는 집중된 테스트, CI 결과, 스크린샷, 녹화, 터미널 출력, 라이브 관찰, 수정된 로그, 또는 산출물 링크일 수 있습니다. 본문은 의도와 유용한 검증을 제공합니다. 리뷰어는 코드, 테스트, CI를 검사해 정확성을 평가합니다.

검사가 실패하면 또 다른 코드 커밋을 푸시하는 대신 PR 본문을 업데이트하세요.

## 범위와 라우팅

범위 로직은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 단위 테스트로 커버됩니다. 수동 디스패치는 changed-scope 감지를 건너뛰고 preflight 매니페스트가 모든 범위 영역이 변경된 것처럼 동작하게 합니다.

- **CI 워크플로 편집**은 Node CI 그래프와 워크플로 린팅을 검증하지만, 그 자체로 Windows, iOS, Android, 또는 macOS 네이티브 빌드를 강제하지는 않습니다. 이러한 플랫폼 레인은 플랫폼 소스 변경에 계속 범위가 지정됩니다.
- **워크플로 무결성**은 모든 워크플로 YAML 파일에 대해 `actionlint`, `zizmor`, composite-action 보간 가드, 충돌 마커 가드를 실행합니다. PR 범위의 `security-fast` 작업도 변경된 워크플로 파일에 대해 `zizmor`를 실행하므로 워크플로 보안 발견 사항이 주요 CI 그래프에서 일찍 실패합니다.
- **`main` 푸시의 문서**는 CI가 사용하는 것과 같은 ClawHub 문서 미러를 사용하는 독립 `Docs` 워크플로에서 검사되므로, 코드+문서가 섞인 푸시는 CI `check-docs` 샤드를 추가로 큐에 넣지 않습니다. 풀 리퀘스트와 수동 CI는 문서가 변경된 경우 여전히 CI에서 `check-docs`를 실행합니다.
- **TUI PTY**는 TUI 변경에 대해 `checks-node-core-runtime-tui-pty` Linux Node 샤드에서 실행됩니다. 이 샤드는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`로 `test/vitest/vitest.tui-pty.config.ts`를 실행하므로, 결정적인 `TuiBackend` fixture 레인과 외부 모델 엔드포인트만 모킹하는 더 느린 `tui --local` 스모크를 모두 커버합니다.
- **CI 라우팅 전용 편집, 선택된 저비용 코어 테스트 fixture 편집, 좁은 Plugin 계약 헬퍼/테스트 라우팅 편집**은 빠른 Node 전용 매니페스트 경로를 사용합니다: `preflight`, 보안, 단일 `checks-fast-core` 작업. 이 경로는 변경이 빠른 작업이 직접 실행하는 라우팅 또는 헬퍼 표면으로 제한될 때 빌드 산출물, Node 22 호환성, 채널 계약, 전체 코어 샤드, 번들 Plugin 샤드, 추가 가드 매트릭스를 건너뜁니다.
- **Windows Node 검사**는 Windows 전용 프로세스/경로 래퍼, npm/pnpm/UI 러너 헬퍼, 패키지 매니저 구성, 그리고 해당 레인을 실행하는 CI 워크플로 표면으로 범위가 지정됩니다. 관련 없는 소스, Plugin, install-smoke, 테스트 전용 변경은 Linux Node 레인에 남습니다.

가장 느린 Node 테스트 계열은 각 작업이 러너를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. Plugin 계약과 채널 계약은 각각 표준 GitHub 러너 폴백을 갖춘 두 개의 가중치 적용 Blacksmith 지원 샤드로 실행되고, 코어 유닛 fast/support 레인은 별도로 실행되며, 코어 런타임 인프라는 state, process/config, shared 및 세 개의 cron 도메인 샤드로 분할됩니다. auto-reply는 균형 잡힌 워커로 실행되고(reply 하위 트리는 agent-runner, dispatch, commands/state-routing 샤드로 분할), agentic gateway/server 구성은 빌드된 아티팩트를 기다리는 대신 chat/auth/model/http-plugin/runtime/startup 레인으로 나뉩니다. 그런 다음 일반 CI는 격리된 인프라 include-pattern 샤드만 최대 64개 테스트 파일의 결정적 번들로 패킹하여, 비격리 command/cron, 상태를 가진 agents-core, 또는 gateway/server 스위트를 병합하지 않고 Node 매트릭스를 줄입니다. 무거운 고정 스위트는 8 vCPU에 남고, 번들된 레인과 낮은 가중치 레인은 4 vCPU를 사용합니다. 정식 저장소의 pull request는 추가적인 compact admission plan을 사용합니다. 동일한 config별 그룹이 현재 34개 작업 Linux Node 계획 안에서 격리된 하위 프로세스로 실행되므로, 단일 PR이 전체 70개 초과 작업 Node 매트릭스를 등록하지 않습니다. `main` push, 수동 dispatch, release gate는 전체 매트릭스를 유지합니다. 광범위한 브라우저, QA, 미디어 및 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest config를 사용합니다. Include-pattern 샤드는 CI 샤드 이름을 사용해 타이밍 항목을 기록하므로, `.artifacts/vitest-shard-timings.json`은 전체 config와 필터링된 샤드를 구분할 수 있습니다. `check-additional-*`는 package-boundary compile/canary 작업을 함께 유지하고 런타임 토폴로지 아키텍처를 gateway watch 커버리지와 분리합니다. boundary guard 목록은 프롬프트가 많은 샤드 하나와 나머지 guard stripe를 위한 결합 샤드 하나로 스트라이핑되며, 각 샤드는 선택된 독립 guard를 동시에 실행하고 check별 타이밍을 출력합니다. 비용이 큰 Codex happy-path prompt snapshot drift check는 수동 CI 및 프롬프트에 영향을 주는 변경에 대해서만 자체 additional job으로 실행되므로, 일반적인 관련 없는 Node 변경은 cold prompt snapshot 생성 뒤에서 기다리지 않으며 boundary 샤드는 균형을 유지하는 동시에 prompt drift는 여전히 이를 유발한 PR에 고정됩니다. 동일한 플래그는 built-artifact core support-boundary 샤드 안에서 prompt snapshot Vitest 생성도 건너뜁니다. Gateway watch, 채널 테스트, core support-boundary 샤드는 `dist/`와 `dist-runtime/`이 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

admit된 뒤에는 정식 Linux CI가 최대 24개의 동시 Node 테스트 작업과
더 작은 fast/check 레인용 12개를 허용합니다. Windows와 Android는
해당 러너 풀이 더 좁기 때문에 2개로 유지됩니다.

compact PR 계획은 현재 스위트에 대해 18개의 Node 작업을 방출합니다. whole-config
그룹은 120분 배치 타임아웃이 있는 격리된 하위 프로세스로 배치되고,
include-pattern 그룹은 동일한 제한된 작업 예산을 공유합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도의 source set이나 manifest가 없습니다. 해당 unit-test 레인은 여전히 SMS/call-log BuildConfig 플래그로 flavor를 컴파일하면서, Android 관련 push마다 중복 debug APK packaging 작업은 피합니다.

`check-dependencies` 샤드는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정된 production Knip dependency-only pass이며, `dlx` 설치를 위해 pnpm의 minimum release age가 비활성화됨)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 production unused-file 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 unused file을 추가하거나 stale allowlist 항목을 남길 때 실패하면서, Knip이 정적으로 해석할 수 없는 의도적인 dynamic Plugin, generated, build, live-test, package bridge 표면은 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw 저장소 활동을 ClawSweeper로 보내는 대상 측 bridge입니다. 신뢰할 수 없는 pull request 코드를 checkout하거나 실행하지 않습니다. 이 workflow는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App token을 만든 다음, compact `repository_dispatch` payload를 `openclaw/clawsweeper`로 dispatch합니다.

workflow에는 네 개의 레인이 있습니다.

- 정확한 issue 및 pull request review request를 위한 `clawsweeper_item`;
- issue comment의 명시적 ClawSweeper command를 위한 `clawsweeper_comment`;
- `main` push의 commit-level review request를 위한 `clawsweeper_commit_review`;
- ClawSweeper agent가 검사할 수 있는 일반 GitHub activity를 위한 `github_activity`.

`github_activity` 레인은 정규화된 metadata만 전달합니다. event type, action, actor, repository, item number, URL, title, state, 그리고 comment나 review가 있을 때의 짧은 excerpt입니다. 전체 webhook body는 의도적으로 전달하지 않습니다. `openclaw/clawsweeper`의 수신 workflow는 `.github/workflows/github-activity.yml`이며, 정규화된 event를 ClawSweeper agent용 OpenClaw Gateway hook에 post합니다.

일반 activity는 관찰이며 기본 전달이 아닙니다. ClawSweeper agent는 prompt에서 Discord target을 받고, event가 놀랍거나, 조치 가능하거나, 위험하거나, 운영상 유용할 때만 `#clawsweeper`에 post해야 합니다. 일상적인 open, edit, bot churn, 중복 webhook noise, 일반 review traffic은 `NO_REPLY`로 처리해야 합니다.

이 경로 전체에서 GitHub title, comment, body, review text, branch name, commit message를 신뢰할 수 없는 데이터로 취급하세요. 이는 요약과 triage를 위한 입력이지, workflow 또는 agent runtime에 대한 지시가 아닙니다.

## 수동 dispatch

수동 CI dispatch는 일반 CI와 동일한 작업 그래프를 실행하지만 모든 비 Android scoped lane을 강제로 켭니다. Linux Node 샤드, bundled-plugin 샤드, Plugin 및 channel contract 샤드, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke check, docs check, Python Skills, Windows, macOS, iOS build, Control UI i18n이 포함됩니다. 독립 실행형 수동 CI dispatch는 `include_android=true`일 때만 Android를 실행합니다. 전체 release umbrella는 `include_android=true`를 전달하여 Android를 활성화합니다. Plugin prerelease static check, release-only `agentic-plugins` 샤드, 전체 extension batch sweep, Plugin prerelease Docker 레인은 CI에서 제외됩니다. Docker prerelease suite는 `Full Release Validation`이 release-validation gate를 활성화하여 별도의 `Plugin Prerelease` workflow를 dispatch할 때만 실행됩니다.

수동 run은 고유한 concurrency group을 사용하므로 release-candidate full suite가 동일 ref의 다른 push 또는 PR run에 의해 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰할 수 있는 caller가 선택한 dispatch ref의 workflow file을 사용하면서 branch, tag, 또는 full commit SHA를 대상으로 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 수동 CI dispatch 및 비정식 저장소 fallback, CodeQL JavaScript/actions quality scan, workflow-sanity, labeler, auto-response, CI 외부의 docs workflow, Blacksmith 매트릭스가 더 일찍 queue될 수 있도록 하는 install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, 더 낮은 가중치의 extension 샤드, `checks-fast-core`, Plugin/channel contract 샤드, 대부분의 bundled/lower-weight Linux Node 샤드, `check-guards`, `check-prod-types`, `check-test-types`, 선택된 `check-additional-*` 샤드, `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 유지되는 무거운 Linux Node suite, boundary/extension-heavy `check-additional-*` 샤드, `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint`(CPU에 민감하여 8 vCPU가 절약한 것보다 비용이 더 컸음), install-smoke Docker build(32-vCPU queue time이 절약한 것보다 비용이 더 컸음)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw`의 `macos-node`; fork는 `macos-15`로 fallback                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw`의 `macos-swift` 및 `ios-build`; fork는 `macos-26`으로 fallback                                                                                                                                                                                                  |

## 러너 등록 예산

OpenClaw의 현재 GitHub runner-registration bucket은 `ghx api rate_limit`에서 5분당 self-hosted
runner registration 10,000개를 보고합니다. GitHub가 이 bucket을 변경할 수 있으므로 각 tuning pass 전에
`actions_runner_registration`을 다시 확인하세요. 이 제한은 `openclaw`
organization의 모든 Blacksmith runner registration이 공유하므로, 다른 Blacksmith installation을 추가해도
새 bucket이 추가되지는 않습니다.

Blacksmith label을 burst control을 위한 희소 리소스로 취급하세요. route, notify, summarize, shard select만 하거나 짧은 CodeQL scan을 실행하는 작업은 측정된 Blacksmith 전용 필요가 없는 한 GitHub-hosted runner에 남겨야 합니다. 새 Blacksmith matrix, 더 큰 `max-parallel`, 또는 high-frequency
workflow는 worst-case registration count를 보여야 하며 org-level
target을 live bucket의 약 60% 미만으로 유지해야 합니다. 현재 10,000-registration
bucket에서는 6,000-registration operating target을 의미하며, concurrent repository, retry, burst overlap을 위한 여유를 남깁니다.

정식 저장소 CI는 일반 push 및 pull-request run에서 Blacksmith를 기본 runner path로 유지합니다. `workflow_dispatch`와 비정식 저장소 run은 GitHub-hosted runner를 사용하지만, 일반 정식 run은 현재 Blacksmith queue health를 probe하거나 Blacksmith를 사용할 수 없을 때 GitHub-hosted label로 자동 fallback하지 않습니다.

## 로컬 equivalent

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
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

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 릴리스 태그나 현재 워크플로 구현이 있는 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 최신 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`에는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, lane 인증 모드, 모델, 반복 횟수, 시나리오 필터가 기록됩니다.

워크플로는 고정된 릴리스에서 OCM을 설치하고 고정된 `kova_ref` 입력의 `openclaw/Kova`에서 Kova를 설치한 뒤, 세 개의 lane을 실행합니다.

- `mock-provider`: 결정적 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에 대한 Kova 진단 시나리오입니다.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴 핫스팟에 대한 CPU/힙/트레이스 프로파일링입니다.
- `live-openai-candidate`: 실제 OpenAI `openai/gpt-5.5` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider lane은 Kova 통과 후 OpenClaw 네이티브 소스 프로브도 실행합니다. 기본, hook, 50-Plugin 시작 사례의 Gateway 부팅 타이밍과 메모리, 번들 Plugin 가져오기 RSS, 반복 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway에 대한 CLI 시작 명령, SQLite 상태 smoke 성능 프로브가 포함됩니다. 테스트된 ref에 대해 이전에 게시된 mock-provider 소스 보고서를 사용할 수 있으면, 소스 요약은 현재 RSS 및 힙 값을 해당 기준선과 비교하고 큰 RSS 증가를 `watch`로 표시합니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 lane은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성되어 있으면 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트도 `openclaw/clawgrit-reports`의 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래에 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 "릴리스 전에 모든 것을 실행"하기 위한 수동 포괄 워크플로입니다. 브랜치, 태그, 전체 커밋 SHA를 받아 해당 대상으로 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위해 `Plugin Prerelease`를 디스패치하며, 설치 smoke, 패키지 승인, 교차 OS 패키지 검사, QA 프로필 증거에서의 성숙도 스코어카드 렌더링, QA Lab 패리티, Matrix, Telegram lane을 위해 `OpenClaw Release Checks`를 디스패치합니다. stable 및 full 프로필은 항상 포괄적인 live/E2E 및 Docker 릴리스 경로 soak 커버리지를 포함합니다. beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다. 정식 패키지 Telegram E2E는 Package Acceptance 내부에서 실행되므로 전체 후보는 중복 live poller를 시작하지 않습니다. 게시 후에는 `release_package_spec`을 전달하여 릴리스 검사, Package Acceptance, Docker, 교차 OS, Telegram 전반에서 빌드 없이 출시된 npm 패키지를 재사용하세요. 집중 게시 패키지 Telegram 재실행에만 `npm_telegram_package_spec`을 사용하세요. Codex Plugin live 패키지 lane은 기본적으로 같은 선택 상태를 사용합니다. 게시된 `release_package_spec=openclaw@<tag>`는 `codex_plugin_spec=npm:@openclaw/codex@<tag>`를 파생하고, SHA/아티팩트 실행은 선택된 ref에서 `extensions/codex`를 패킹합니다. `npm:`, `npm-pack:`, `git:` 사양 같은 사용자 지정 Plugin 소스에는 `codex_plugin_spec`을 명시적으로 설정하세요.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트,
집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을
참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 워크플로입니다. 릴리스 태그가 존재하고
OpenClaw npm preflight가 성공한 뒤 `release/YYYY.M.PATCH` 또는 `main`에서 디스패치하세요.
이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해
`Plugin NPM Release`를 디스패치하며, 같은 릴리스 SHA에 대해 `Plugin ClawHub Release`를
디스패치한 다음에만 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.
stable 게시에는 정확한 `windows_node_tag`도 필요합니다. 워크플로는 게시 하위 작업 전에
Windows 소스 릴리스를 검증하고 x64/ARM64 설치 관리자를 후보 승인된
`windows_node_installer_digests` 입력과 비교한 뒤, GitHub 릴리스 초안을 게시하기 전에
동일하게 고정된 설치 관리자 다이제스트와 정확한 동반 자산 및 체크섬 계약을 승격하고 검증합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

빠르게 움직이는 브랜치에서 고정 커밋 증명이 필요하면
`gh workflow run ... --ref main -f ref=<sha>` 대신 헬퍼를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 워크플로 디스패치 ref는 원시 커밋 SHA가 아니라 브랜치 또는 태그여야 합니다.
헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고, 해당 고정 ref에서
`Full Release Validation`을 디스패치하며, 모든 하위 워크플로 `headSha`가 대상과 일치하는지
검증하고, 실행이 완료되면 임시 브랜치를 삭제합니다. 포괄 검증기도 어떤 하위 워크플로든
다른 SHA에서 실행된 경우 실패합니다.

`release_profile`은 릴리스 검사로 전달되는 live/provider 범위를 제어합니다. 수동 릴리스
워크플로의 기본값은 `stable`입니다. 넓은 권고 provider/media 매트릭스를 의도적으로 원할 때만
`full`을 사용하세요. stable 및 full 릴리스 검사는 항상 포괄적인 live/E2E 및 Docker 릴리스 경로
soak를 실행합니다. beta 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다.

- `minimum`은 가장 빠른 OpenAI/core 릴리스 핵심 lane을 유지합니다.
- `stable`은 stable provider/backend 집합을 추가합니다.
- `full`은 넓은 권고 provider/media 매트릭스를 실행합니다.

포괄 워크플로는 디스패치된 하위 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 하위 실행 결론을 다시 확인하고 각 하위 실행의 가장 느린 작업 표를 추가합니다. 하위 워크플로를 재실행해 성공으로 바뀌면, 포괄 결과와 타이밍 요약을 새로 고치기 위해 부모 검증기 작업만 다시 실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 하위 작업만에는 `ci`, Plugin prerelease 하위 작업만에는 `plugin-prerelease`, 모든 릴리스 하위 작업에는 `release-checks`, 또는 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, 포괄 워크플로의 `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위를 제한할 수 있습니다. 실패한 교차 OS lane 하나에 대해서는 `rerun_group=cross-os`를 `cross_os_suite_filter`와 결합하세요. 예: `windows/packaged-upgrade`. 긴 교차 OS 명령은 Heartbeat 줄을 출력하고 packaged-upgrade 요약에는 단계별 타이밍이 포함됩니다. QA 릴리스 검사 lane은 표준 런타임 도구 커버리지 게이트를 제외하고는 권고용입니다. 이 게이트는 필수 OpenClaw 동적 도구가 표준 tier 요약에서 드리프트하거나 사라지면 차단합니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용해 선택된 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 교차 OS 검사와 Package Acceptance, 그리고 soak 커버리지가 실행될 때 live/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되고, 여러 하위 작업에서 같은 후보를 다시 패킹하지 않아도 됩니다. Codex npm-Plugin live lane의 경우, 릴리스 검사는 `release_package_spec`에서 파생된 일치하는 게시 Plugin 사양을 전달하거나, 운영자가 제공한 `codex_plugin_spec`을 전달하거나, 입력을 비워 두어 Docker 스크립트가 선택된 체크아웃의 Codex Plugin을 패킹하게 합니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은 이전 포괄 워크플로를
대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한 모든 하위 워크플로를 취소하므로,
새 main 검증이 오래된 2시간짜리 릴리스 검사 실행 뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과
집중 재실행 그룹은 `cancel-in-progress: false`를 유지합니다.

## Live 및 E2E 샤드

릴리스 live/E2E 하위 작업은 넓은 네이티브 `pnpm test:live` 커버리지를 유지하지만, 단일 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 이름이 지정된 샤드로 실행합니다.

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 필터링된 `native-live-src-gateway-profiles` 작업
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 분할된 미디어 오디오/비디오 샤드와 provider 필터링된 음악 샤드

이렇게 하면 같은 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있습니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` 샤드 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 live 미디어 샤드는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. 미디어 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live suite는 일반 Blacksmith runner에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 실행하기에 적합한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택된 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 뒤, Docker 라이브 모델, 제공자별로 샤딩된 Gateway, CLI 백엔드, ACP 바인드, Codex 하네스 샤드를 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행합니다. Gateway Docker 샤드에는 워크플로 작업 제한 시간보다 낮은 명시적인 스크립트 수준 `timeout` 상한이 있어, 컨테이너나 정리 경로가 멈췄을 때 전체 릴리스 점검 예산을 소비하는 대신 빠르게 실패합니다. 이러한 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며, 중복 이미지 빌드로 실제 소요 시간을 낭비하게 됩니다.

## 패키지 인수 테스트

"설치 가능한 OpenClaw 패키지가 제품으로서 작동하는가?"라는 질문에는 `Package Acceptance`를 사용합니다. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하는 반면, 패키지 인수 테스트는 설치 또는 업데이트 후 사용자가 실행하는 것과 동일한 Docker E2E 하네스를 통해 단일 타르볼을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 확인하며, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰며, 둘 다 `package-under-test` 아티팩트로 업로드하고, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 워크플로는 해당 아티팩트를 다운로드하고, 타르볼 인벤토리를 검증하며, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하고, 워크플로 체크아웃을 패킹하는 대신 해당 패키지를 대상으로 선택된 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 레인을 고유 아티팩트를 가진 병렬 대상 Docker 작업으로 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, 패키지 인수 테스트가 패키지를 확인한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm 사양을 설치할 수 있습니다.
4. `summary`는 패키지 확인, Docker 인수 테스트, 또는 선택적 Telegram 레인이 실패한 경우 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2`와 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 프리릴리스/안정 릴리스 인수 테스트에 사용합니다.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패킹합니다. 확인자는 OpenClaw 브랜치/태그를 가져오고, 선택된 커밋이 저장소 브랜치 기록 또는 릴리스 태그에서 도달 가능한지 검증하며, 분리된 워크트리에 의존성을 설치하고, `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 공개 HTTPS `.tgz`를 다운로드합니다. `package_sha256`은 필수입니다. 이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트명 또는 확인된 IP, 그리고 동일한 공개 안전 정책을 벗어나는 리디렉션을 거부합니다.
- `source=trusted-url`은 `.github/package-trusted-sources.json`의 명명된 신뢰 소스 정책에서 HTTPS `.tgz`를 다운로드합니다. `package_sha256` 및 `trusted_source_id`는 필수입니다. 구성된 호스트, 포트, 경로 접두사, 리디렉션 호스트, 또는 비공개 네트워크 확인이 필요한 유지관리자 소유 엔터프라이즈 미러나 비공개 패키지 저장소에만 사용합니다. 정책이 bearer 인증을 선언하면 워크플로는 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 시크릿을 사용합니다. URL에 포함된 자격 증명은 여전히 거부됩니다.
- `source=artifact`는 `artifact_run_id` 및 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에 공유된 아티팩트에는 제공하는 것이 좋습니다.

`workflow_ref`와 `package_ref`를 분리해 두세요. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하네스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이를 통해 현재 테스트 하네스가 이전 워크플로 로직을 실행하지 않고도 더 오래된 신뢰 소스 커밋을 검증할 수 있습니다.

### 스위트 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package`에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui` 추가
- `full` — OpenWebUI를 포함한 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필수

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로, 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm 사양 경로는 독립 실행형 디스패치를 위해 유지됩니다.

전용 업데이트 및 Plugin 테스트 정책, 로컬 명령,
Docker 레인, 패키지 인수 테스트 입력, 릴리스 기본값, 실패 분류는
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 점검은 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, 그리고 `telegram_mode=mock-openai`로 패키지 인수 테스트를 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 라이브 ClawHub Skills 설치, 오래된 Plugin 의존성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명이 동일하게 확인된 패키지 타르볼에서 유지됩니다. 베타를 게시한 뒤 다시 빌드하지 않고 출하된 npm 패키지에 대해 동일한 매트릭스를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에 `release_package_spec`을 설정하세요. 패키지 인수 테스트가 나머지 릴리스 검증과 다른 패키지를 필요로 할 때만 `package_acceptance_package_spec`을 설정하세요. 교차 OS 릴리스 점검은 여전히 OS별 온보딩, 설치 프로그램, 플랫폼 동작을 다룹니다. 패키지/업데이트 제품 검증은 패키지 인수 테스트에서 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행당 하나의 게시된 패키지 기준선을 검증합니다. 패키지 인수 테스트에서는 확인된 `package-under-test` 타르볼이 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`이 설정된 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정하여 최신 네 개의 안정 npm 릴리스와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, 물결표 로그 경로, 오래된 레거시 Plugin 의존성 루트에 대한 이슈 형태의 픽스처까지 확장합니다. 다중 기준선 게시 업그레이드 생존자 선택은 기준선별로 별도의 대상 Docker 러너 작업으로 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리를 포괄적으로 검증하는 것일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 사양을 전달하거나, `openclaw@2026.4.15`와 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 내장된 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, 그리고 RPC 상태를 프로브합니다. Windows 패키지 및 설치 프로그램 신규 레인도 설치된 패키지가 원시 절대 Windows 경로에서 browser-control override를 가져올 수 있는지 검증합니다. OpenAI 교차 OS 에이전트 턴 스모크는 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.5`를 사용하므로 설치 및 Gateway 증명이 GPT-4.x 기본값을 피하면서 GPT-5 테스트 모델에 머무릅니다.

### 레거시 호환성 기간

패키지 인수 테스트에는 이미 게시된 패키지를 위한 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 타르볼에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않는 경우 `doctor-switch`는 `gateway install --wrapper` 영속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 타르볼에서 파생된 가짜 git 픽스처에서 누락된 pnpm `patchedDependencies`를 정리할 수 있으며, 유지되지 않은 `update.channel` 누락을 로그로 남길 수 있습니다.
- Plugin 스모크는 레거시 설치 레코드 위치를 읽거나 marketplace 설치 레코드 영속성 누락을 허용할 수 있습니다.
- `plugin-update`는 설치 레코드와 재설치 없음 동작이 변경되지 않은 상태를 계속 요구하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지도 이미 출하된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 합니다. 동일한 조건은 경고나 건너뛰기 대신 실패합니다.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

실패한 패키지 인수 테스트 실행을 디버그할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인하세요. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트인 `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계별 시간, 재실행 명령을 검사하세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 것을 선호하세요.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 분할합니다.

- **빠른 경로**는 Docker/package 표면, 번들 Plugin package/manifest 변경, 또는 Docker smoke 작업이 실행하는 core plugin/channel/gateway/Plugin SDK 표면을 건드리는 pull request에서 실행됩니다. 소스 전용 번들 Plugin 변경, 테스트 전용 편집, 문서 전용 편집은 Docker worker를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하며, agents delete shared-workspace CLI smoke를 실행하고, container gateway-network e2e를 실행하며, 번들 extension build arg를 검증하고, 240초의 집계 command timeout 아래에서 제한된 bundled-plugin Docker profile을 실행합니다(각 scenario의 Docker run은 별도로 제한됨).
- **전체 경로**는 야간 예약 실행, 수동 dispatch, workflow-call release check, 그리고 installer/package/Docker 표면을 실제로 건드리는 pull request에 대해 QR package install 및 installer Docker/update coverage를 유지합니다. 전체 모드에서 install-smoke는 하나의 target-SHA GHCR 루트 Dockerfile smoke 이미지를 준비하거나 재사용한 다음, QR package install, 루트 Dockerfile/gateway smoke, installer/update smoke, 그리고 빠른 bundled-plugin Docker E2E를 별도 작업으로 실행하여 installer 작업이 루트 이미지 smoke 뒤에서 기다리지 않도록 합니다.

`main` push(merge commit 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 push에서 전체 coverage를 요청하더라도 workflow는 빠른 Docker smoke를 유지하고 전체 install smoke는 야간 또는 release validation에 맡깁니다.

느린 Bun global install image-provider smoke는 `run_bun_global_install_smoke`로 별도 gating됩니다. 이는 야간 schedule 및 release checks workflow에서 실행되며, 수동 `Install Smoke` dispatch에서 선택할 수 있지만 pull request와 `main` push에서는 실행되지 않습니다. 일반 PR CI는 Node 관련 변경에 대해 빠른 Bun launcher regression lane을 계속 실행합니다. QR 및 installer Docker test는 자체 install 중심 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 하나의 공유 live-test 이미지를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패키징하며, 두 개의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드합니다.

- installer/update/plugin-dependency lane용 기본 Node/Git runner;
- 일반 functionality lane용으로 동일한 tarball을 `/app`에 설치하는 기능 이미지.

Docker lane 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, planner 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, runner는 선택된 plan만 실행합니다. scheduler는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE`와 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 lane별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 lane을 실행합니다.

### 조정값

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 lane의 main-pool slot 수.                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider 민감 tail-pool slot 수.                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | provider가 throttle하지 않도록 하는 동시 live lane 상한.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 동시 npm install lane 상한.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 multi-service lane 상한.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storm을 피하기 위한 lane 시작 간 stagger. stagger를 없애려면 `0` 설정.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | lane별 fallback timeout(120분). 선택된 live/tail lane은 더 엄격한 상한 사용.                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`은 lane을 실행하지 않고 scheduler plan을 출력.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분된 정확한 lane 목록. agent가 실패한 lane 하나를 재현할 수 있도록 cleanup smoke 생략. |

effective cap보다 무거운 lane도 빈 pool에서 시작할 수 있으며, 그 후 capacity를 해제할 때까지 단독으로 실행됩니다. 로컬 aggregate는 Docker를 preflight하고, 오래된 OpenClaw E2E container를 제거하며, active-lane 상태를 출력하고, longest-first ordering을 위해 lane timing을 보존하며, 기본적으로 첫 번째 실패 후에는 새 pooled lane scheduling을 중단합니다.

### 재사용 가능한 live/E2E workflow

재사용 가능한 live/E2E workflow는 `scripts/test-docker-all.mjs --plan-json`에 필요한 package, image kind, live image, lane, credential coverage를 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 plan을 GitHub output과 summary로 변환합니다. 이 workflow는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패키징하거나, current-run package artifact를 다운로드하거나, `package_artifact_run_id`에서 package artifact를 다운로드합니다. tarball inventory를 검증합니다. plan에 package-installed lane이 필요할 때 Blacksmith의 Docker layer cache를 통해 package-digest-tagged bare/functional GHCR Docker E2E 이미지를 빌드하고 push합니다. 그리고 재빌드 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 package-digest 이미지를 재사용합니다. Docker image pull은 attempt별 180초 제한 timeout으로 재시도되어, registry/cache stream이 멈춰도 CI critical path 대부분을 소비하지 않고 빠르게 재시도합니다.

### Release-path chunk

Release Docker coverage는 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용해 더 작은 chunked job으로 실행되므로 각 chunk는 필요한 image kind만 pull하고 동일한 weighted scheduler를 통해 여러 lane을 실행합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 release Docker chunk는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `package-update-openai`에는 live Codex Plugin package lane이 포함되며, 이 lane은 candidate OpenClaw package를 설치하고, 명시적 Codex CLI install approval과 함께 `codex_plugin_spec` 또는 same-ref tarball에서 Codex Plugin을 설치하며, Codex CLI preflight를 실행한 다음 OpenAI에 대해 동일 session의 OpenClaw agent turn 여러 개를 실행합니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 aggregate plugin/runtime alias로 유지됩니다. `install-e2e` lane alias는 두 provider installer lane 모두에 대한 aggregate manual rerun alias로 유지됩니다.

전체 release-path coverage가 요청할 때 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 dispatch에만 독립 `openwebui` chunk를 유지합니다. Bundled-channel update lane은 일시적 npm network 실패에 대해 한 번 재시도합니다.

각 chunk는 lane log, timing, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, slow-lane table, lane별 rerun command가 포함된 `.artifacts/docker-tests/`를 업로드합니다. workflow `docker_lanes` 입력은 chunk job 대신 준비된 image에 대해 선택된 lane을 실행합니다. 이를 통해 failed-lane debugging을 하나의 targeted Docker job으로 제한하고, 해당 실행을 위한 package artifact를 준비, 다운로드 또는 재사용합니다. 선택된 lane이 live Docker lane인 경우 targeted job은 해당 rerun을 위해 live-test image를 로컬에서 빌드합니다. 생성된 lane별 GitHub rerun command에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 image input이 포함되므로, 실패한 lane이 실패한 실행의 정확한 package와 image를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 live/E2E workflow는 전체 release-path Docker suite를 매일 실행합니다.

## Plugin Prerelease

`Plugin Prerelease`는 더 비용이 큰 product/package coverage이므로 `Full Release Validation` 또는 명시적 operator가 dispatch하는 별도 workflow입니다. 일반 pull request, `main` push, 독립 수동 CI dispatch는 이 suite를 꺼 둡니다. 이 workflow는 번들 Plugin test를 여덟 extension worker에 걸쳐 균형 있게 분산합니다. 해당 extension shard job은 한 번에 최대 두 개의 Plugin config group을 실행하며, group당 하나의 Vitest worker와 더 큰 Node heap을 사용하여 import가 많은 Plugin batch가 추가 CI job을 만들지 않도록 합니다. release 전용 Docker prerelease path는 수십 개 runner가 1-3분짜리 job에 예약되는 것을 피하기 위해 targeted Docker lane을 작은 group으로 batch 처리합니다. workflow는 `@openclaw/plugin-inspector`에서 informational `plugin-inspector-advisory` artifact도 업로드합니다. inspector finding은 triage 입력이며 blocking Plugin Prerelease gate를 변경하지 않습니다.

## QA Lab

QA Lab에는 main smart-scoped workflow 밖에 전용 CI lane이 있습니다. Agentic parity는 독립 PR workflow가 아니라 broad QA 및 release harness 아래에 중첩됩니다. parity가 broad validation run과 함께 실행되어야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용합니다.

- `QA-Lab - All Lanes` workflow는 `main`에서 야간 및 수동 dispatch로 실행되며, mock parity lane, live Matrix lane, live Telegram 및 Discord lane을 병렬 job으로 fan out합니다. Live job은 `qa-live-shared` environment를 사용하고, Telegram/Discord는 Convex lease를 사용합니다.

Release check는 deterministic mock provider와 mock-qualified model(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram live transport lane을 실행하여 channel contract가 live model latency와 일반 provider-plugin startup에서 분리되도록 합니다. live transport gateway는 memory search를 비활성화합니다. QA parity가 memory behavior를 별도로 다루기 때문입니다. provider connectivity는 별도의 live model, native provider, Docker provider suite에서 다룹니다.

Matrix는 scheduled 및 release gate에 `--profile fast`를 사용하고, checkout된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 workflow input은 `all`로 유지됩니다. 수동 `matrix_profile=all` dispatch는 항상 전체 Matrix coverage를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` job으로 shard합니다.

`OpenClaw Release Checks`도 release approval 전에 release-critical QA Lab lane을 실행합니다. 해당 QA parity gate는 candidate와 baseline pack을 병렬 lane job으로 실행한 다음, 최종 parity comparison을 위해 두 artifact를 모두 작은 report job으로 다운로드합니다.

일반 PR의 경우 parity를 필수 상태로 취급하는 대신 scoped CI/check evidence를 따릅니다.

## CodeQL

`CodeQL` workflow는 전체 repository sweep이 아니라 의도적으로 좁은 first-pass security scanner입니다. Daily, manual, non-draft pull request guard run은 Actions workflow code와 가장 위험도가 높은 JavaScript/TypeScript 표면을 scan하며, high/critical `security-severity`로 filter된 high-confidence security query를 사용합니다.

pull request guard는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, 또는 process-owning bundled Plugin runtime path 아래 변경에 대해서만 시작하며, scheduled workflow와 동일한 high-confidence security matrix를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에서 제외됩니다.

### 보안 category

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, secrets, sandbox, Cron 및 Gateway 기준선                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 코어 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, secrets, 감사 접점                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 코어 SSRF, IP 파싱, 네트워크 가드, web-fetch 및 Plugin SDK SSRF 정책 표면                                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달 및 agent 도구 실행 게이트                                                            |
| `/codeql-security-high/process-exec-boundary`     | 로컬 셸, 프로세스 spawn 헬퍼, 하위 프로세스를 소유하는 번들 Plugin 런타임 및 워크플로 스크립트 연결 코드                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, manifest, registry, package-manager 설치, source-loading 및 Plugin SDK 패키지 계약 신뢰 표면                    |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 sanity에서 허용하는 가장 작은 Blacksmith Linux runner에서 CodeQL을 위해 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL을 위해 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링한 뒤 `/codeql-critical-security/macos` 아래에 업로드합니다. macOS 빌드는 깨끗한 상태에서도 런타임을 지배하므로 일일 기본값 밖에 둡니다.

### Critical Quality 범주

`CodeQL Critical Quality`는 대응되는 비보안 샤드입니다. 품질 스캔이 Blacksmith runner-registration 예산을 쓰지 않도록 GitHub 호스팅 Linux runner에서 좁고 가치가 높은 표면에 대해 오류 심각도의 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 해당 pull request 가드는 예약된 프로필보다 의도적으로 더 작습니다. draft가 아닌 PR은 agent 명령/모델/도구 실행 및 응답 디스패치 코드, config schema/migration/IO 코드, auth/secrets/sandbox/security 코드, 코어 채널 및 번들 채널 Plugin 런타임, Gateway protocol/server-method, memory runtime/SDK 연결 코드, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract 또는 Plugin SDK reply runtime 변경에 대해 대응되는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL config 및 품질 워크플로 변경은 12개의 PR 품질 샤드를 모두 실행합니다.

수동 dispatch는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 하나의 품질 샤드를 격리해 실행하기 위한 학습/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron 및 Gateway 보안 경계 코드                                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization 및 IO 계약                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schema 및 server method 계약                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | 코어 채널 및 번들 채널 Plugin 구현 계약                                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, model/provider dispatch, auto-reply dispatch 및 queues, ACP control-plane runtime 계약                                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 bridge, process supervision 헬퍼 및 outbound delivery 계약                                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facade, memory Plugin SDK alias, memory runtime activation glue 및 memory doctor 명령                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery 헬퍼, diagnostic event/log bundle 표면 및 session doctor CLI 계약          |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime 헬퍼, channel reply options, delivery queues 및 session/thread binding 헬퍼                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs 및 web/search/fetch/embedding registries   |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, Gateway control flows 및 task control-plane runtime 계약                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 코어 web fetch/search, media IO, media understanding, image-generation 및 media-generation runtime 계약                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface 및 Plugin SDK entrypoint 계약                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스 및 plugin package contract 헬퍼                                                                                              |

품질은 보안과 별도로 유지되어야 합니다. 그래야 보안 신호를 흐리지 않고 품질 발견 사항을 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python 및 번들 Plugin CodeQL 확장은 좁은 프로필이 안정적인 런타임과 신호를 갖춘 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 landing된 변경 사항과 기존 문서를 맞추기 위한 이벤트 기반 Codex 유지관리 lane입니다. 순수한 schedule은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있으며, 수동 dispatch로 직접 실행할 수도 있습니다. workflow-run 호출은 `main`이 이미 앞으로 이동했거나 최근 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행될 때는 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 commit range를 검토하므로, 한 시간마다 한 번 실행해도 마지막 docs pass 이후 누적된 모든 main 변경을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지관리 lane입니다. 순수한 schedule은 없습니다. `main`에서 성공한 non-bot push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 workflow-run 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 dispatch는 그 일일 활동 게이트를 우회합니다. 이 lane은 전체 suite grouped Vitest 성능 보고서를 빌드하고, Codex가 broad refactor 대신 coverage를 보존하는 작은 테스트 성능 수정만 하도록 한 다음, 전체 suite 보고서를 다시 실행하고 passing baseline test count를 줄이는 변경을 거부합니다. grouped report는 Linux와 macOS에서 config별 wall time과 max RSS를 기록하므로, before/after 비교에서 duration delta 옆에 test memory delta가 드러납니다. baseline에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있고, after-agent 전체 suite report는 무엇이든 commit되기 전에 통과해야 합니다. bot push가 landing되기 전에 `main`이 진행되면 lane은 검증된 patch를 rebase하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 stale patch는 건너뜁니다. Codex action이 docs agent와 같은 drop-sudo 안전 자세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### Merge 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 land 후 중복 정리를 위한 수동 maintainer 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에 landed PR이 merge되었는지, 그리고 각 duplicate가 공유된 referenced issue 또는 겹치는 changed hunk를 가지고 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 check gate 및 changed routing

로컬 changed-lane 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 이 로컬 check gate는 넓은 CI 플랫폼 범위보다 architecture boundary에 대해 더 엄격합니다.

- 코어 production 변경은 core prod 및 core test typecheck와 core lint/guards를 실행합니다.
- 코어 test-only 변경은 core test typecheck와 core lint만 실행합니다.
- extension production 변경은 extension prod 및 extension test typecheck와 extension lint를 실행합니다.
- extension test-only 변경은 extension test typecheck와 extension lint를 실행합니다.
- public Plugin SDK 또는 plugin-contract 변경은 extension이 해당 core 계약에 의존하므로 extension typecheck까지 확장됩니다(Vitest extension sweep은 명시적인 테스트 작업으로 유지됩니다).
- release metadata-only version bump는 targeted version/config/root-dependency check를 실행합니다.
- 알 수 없는 root/config 변경은 모든 check lane으로 안전하게 실패합니다.

로컬 changed-test routing은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접적인 test edit은 자기 자신을 실행하고, source edit은 명시적 mapping을 우선한 뒤 sibling tests와 import-graph dependent를 사용합니다. 공유 group-room delivery config는 명시적 mapping 중 하나입니다. group visible-reply config, source reply delivery mode 또는 message-tool system prompt 변경은 core reply test와 Discord 및 Slack delivery regression을 거치므로, 공유 default 변경은 첫 PR push 전에 실패합니다. 변경이 harness-wide여서 저렴한 mapped set을 신뢰할 수 있는 proxy로 보기 어려울 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Crabbox는 유지관리자용 Linux 증명을 위한 리포지토리 소유 원격 박스 래퍼입니다. 검사가 로컬 편집 루프에서 실행하기에 너무 광범위하거나, CI 동등성이 중요하거나, 증명에 비밀 값, Docker, 패키지 레인, 재사용 가능한 박스 또는 원격 로그가 필요할 때 리포지토리 루트에서 사용하세요. 일반 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제 또는 명시적인 소유 용량 테스트를 위한 대체 경로입니다.

Crabbox 기반 Blacksmith 실행은 일회성 Testbox를 예열, 클레임, 동기화, 실행, 보고, 정리합니다. 내장 동기화 무결성 검사는 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라지거나 `git status --short`가 추적 중인 삭제를 200개 이상 표시하면 빠르게 실패합니다. 의도적인 대규모 삭제 PR의 경우 원격 명령에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

Crabbox는 또한 동기화 후 출력 없이 동기화 단계에 5분 넘게 머무는 로컬 Blacksmith CLI 호출을 종료합니다. 이 보호 장치를 비활성화하려면 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

첫 실행 전 리포지토리 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

리포지토리 래퍼는 `blacksmith-testbox`를 표시하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 제공자를 명시적으로 전달하세요. Codex 작업 트리 또는 링크/스파스 체크아웃에서는 pnpm이 Crabbox 시작 전에 의존성을 조정할 수 있으므로 로컬 `pnpm crabbox:run` 스크립트를 피하고 대신 node 래퍼를 직접 호출하세요.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 기반 실행에는 Crabbox 0.22.0 이상이 필요합니다. 그래야 래퍼가 현재 Testbox 동기화, 큐, 정리 동작을 얻습니다. 형제 체크아웃을 사용할 때는 타이밍 또는 증명 작업 전에 무시된 로컬 바이너리를 다시 빌드하세요.

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 위임된 Blacksmith Testbox 실행의 경우 Crabbox 래퍼 종료 코드와 JSON 요약이 명령 결과입니다. 연결된 GitHub Actions 실행은 하이드레이션과 keepalive를 소유합니다. SSH 명령이 이미 반환된 뒤 Testbox가 외부에서 중지되면 `cancelled`로 끝날 수 있습니다. 래퍼 `exitCode`가 0이 아니거나 명령 출력에 실패한 테스트가 표시되지 않는 한 이를 정리/상태 아티팩트로 취급하세요. 일회성 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불분명하면 라이브 박스를 검사하고 자신이 만든 박스만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일한 하이드레이션된 박스에서 여러 명령이 의도적으로 필요할 때만 재사용을 사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox가 깨진 계층이지만 Blacksmith 자체는 작동한다면 `list`, `status`, 정리 같은 진단에만 직접 Blacksmith를 사용하세요. 직접 Blacksmith 실행을 유지관리자 증명으로 취급하기 전에 Crabbox 경로를 수정하세요.

`blacksmith testbox list --all` 및 `blacksmith testbox status`는 작동하지만 새 예열이 몇 분 뒤에도 IP 또는 Actions 실행 URL 없이 `queued`에 머물면 Blacksmith 제공자, 큐, 과금 또는 조직 제한 압력으로 취급하세요. 자신이 만든 대기 중인 id를 중지하고, 더 많은 Testbox를 시작하지 말고, 누군가 Blacksmith 대시보드, 과금, 조직 제한을 확인하는 동안 아래의 소유 Crabbox 용량 경로로 증명을 옮기세요.

Blacksmith가 다운되었거나, 할당량 제한이 있거나, 필요한 환경이 없거나, 소유 용량이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압력이 있는 상황에서는 작업에 실제로 48xlarge급 CPU가 필요한 경우가 아니라면 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며 지역 EC2 Spot 또는 On-Demand Standard 할당량에 걸리는 가장 쉬운 방법입니다. 리포지토리 소유 `.crabbox.yaml`은 `standard`, 여러 용량 지역, `capacity.hints: true`를 기본값으로 사용하므로 중개된 AWS 임대는 선택된 지역/마켓, 할당량 압력, Spot 대체, 고압력 클래스 경고를 출력합니다. 더 무거운 광범위 검사에는 `fast`를 사용하고, standard/fast로 충분하지 않을 때만 `large`를 사용하며, `beast`는 전체 스위트 또는 모든 Plugin Docker 매트릭스, 명시적인 릴리스/차단 검증, 고코어 성능 프로파일링처럼 CPU에 묶인 예외적 레인에만 사용하세요. `pnpm check:changed`, 집중 테스트, 문서 전용 작업, 일반 lint/typecheck, 작은 E2E 재현 또는 Blacksmith 장애 분류에는 `beast`를 사용하지 마세요. 용량 진단에는 Spot 마켓 변동이 신호에 섞이지 않도록 `--market on-demand`를 사용하세요.

`.crabbox.yaml`은 소유 클라우드 레인의 제공자, 동기화, GitHub Actions 하이드레이션 기본값을 소유합니다. 하이드레이션된 Actions 체크아웃이 유지관리자 로컬 원격 및 객체 저장소를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하도록 로컬 `.git`을 제외하며, 절대 전송되어서는 안 되는 로컬 런타임/빌드 아티팩트도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 체크아웃, Node/pnpm 설정, `origin/main` 가져오기, 비밀 값이 아닌 환경 전달을 소유합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
