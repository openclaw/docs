---
read_when:
    - CI 작업이 실행되었거나 실행되지 않은 이유를 이해해야 합니다
    - 실패한 GitHub Actions 검사를 디버깅하고 있습니다
    - 릴리스 검증 실행 또는 재실행을 조율하고 있습니다
    - ClawSweeper 디스패치 또는 GitHub 활동 전달을 변경하고 있습니다
summary: CI 작업 그래프, 범위 게이트, 릴리스 엄브렐라 및 동등한 로컬 명령
title: CI 파이프라인
x-i18n:
    generated_at: "2026-06-27T17:13:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI는 `main`으로 푸시할 때마다, 그리고 모든 풀 리퀘스트에서 실행됩니다. 표준
`main` 푸시는 먼저 90초 hosted-runner admission window를 통과합니다.
기존 `CI` concurrency group은 더 새로운 커밋이 들어오면 대기 중인 실행을 취소하므로,
순차적인 병합이 각각 전체 Blacksmith 매트릭스를 등록하지 않습니다.
풀 리퀘스트와 수동 dispatch는 대기를 건너뜁니다. 그런 다음 `preflight` 작업이
diff를 분류하고 관련 없는 영역만 변경된 경우 비용이 큰 lane을 끕니다. 수동
`workflow_dispatch` 실행은 의도적으로 스마트 스코핑을 우회하고 릴리스 후보와
광범위한 검증을 위해 전체 그래프를 fan out합니다. Android lane은 `include_android`를 통해
옵트인 상태로 유지됩니다. 릴리스 전용 Plugin 커버리지는 별도의 [`Plugin 사전 릴리스`](#plugin-prerelease)
workflow에 있으며, [`전체 릴리스 검증`](#full-release-validation)이나 명시적인 수동 dispatch에서만
실행됩니다.

## 파이프라인 개요

| 작업                                | 목적                                                                                                   | 실행 시점                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs 전용 변경, 변경된 범위, 변경된 확장, CI manifest 감지                   | draft가 아닌 푸시와 PR에서 항상                  |
| `runner-admission`                 | Blacksmith 작업이 등록되기 전 표준 `main` 푸시에 대한 hosted 90초 debounce                | 모든 CI 실행; 표준 `main` 푸시에서만 sleep |
| `security-fast`                    | 비공개 키 감지, `zizmor`를 통한 변경된 workflow 감사, 프로덕션 lockfile 감사                 | draft가 아닌 푸시와 PR에서 항상                  |
| `check-dependencies`               | 프로덕션 Knip dependency-only pass 및 unused-file allowlist guard                                 | Node 관련 변경                               |
| `build-artifacts`                  | `dist/`, Control UI, 빌드된 CLI smoke check, 내장 빌드 artifact check, 재사용 가능한 artifact 빌드 | Node 관련 변경                               |
| `checks-fast-core`                 | bundled, protocol, QA Smoke CI, CI-routing check 같은 빠른 Linux 정확성 lane                | Node 관련 변경                               |
| `checks-fast-contracts-plugins-*`  | 두 개로 shard된 Plugin contract check                                                                        | Node 관련 변경                               |
| `checks-fast-contracts-channels-*` | 두 개로 shard된 channel contract check                                                                       | Node 관련 변경                               |
| `checks-node-core-*`               | channel, bundled, contract, extension lane을 제외한 Core Node test shard                          | Node 관련 변경                               |
| `check-*`                          | shard된 주요 로컬 gate 동등 항목: prod types, lint, guards, test types, strict smoke                | Node 관련 변경                               |
| `check-additional-*`               | architecture, shard된 boundary/prompt drift, extension guards, package boundary, runtime topology     | Node 관련 변경                               |
| `checks-node-compat-node22`        | Node 22 호환성 build 및 smoke lane                                                                | 릴리스용 수동 CI dispatch                     |
| `check-docs`                       | docs formatting, lint, broken-link check                                                             | docs 변경                                        |
| `skills-python`                    | Python 기반 Skills용 Ruff + pytest                                                                    | Python-skill 관련 변경                       |
| `checks-windows`                   | Windows 전용 process/path test 및 shared runtime import specifier 회귀                      | Windows 관련 변경                            |
| `macos-node`                       | 공유 빌드 artifact를 사용하는 macOS TypeScript test lane                                               | macOS 관련 변경                              |
| `macos-swift`                      | macOS 앱용 Swift lint, build, test                                                            | macOS 관련 변경                              |
| `ios-build`                        | Xcode project 생성 및 iOS app simulator build                                                 | iOS app, shared app kit, 또는 Swabble 변경         |
| `android`                          | 두 flavor의 Android unit test 및 debug APK build 하나                                              | Android 관련 변경                            |
| `test-performance-agent`           | trusted activity 이후 매일 Codex slow-test 최적화                                                 | main CI 성공 또는 수동 dispatch                  |
| `openclaw-performance`             | mock-provider, deep-profile, GPT 5.5 live lane이 포함된 일일/온디맨드 Kova runtime performance report | 예약 및 수동 dispatch                       |

## Fail-fast 순서

1. `runner-admission`은 표준 `main` 푸시에 대해서만 대기합니다. 더 새로운 푸시는 Blacksmith 등록 전에 실행을 취소합니다.
2. `preflight`는 어떤 lane이 존재할지 결정합니다. `docs-scope`와 `changed-scope` 로직은 독립 작업이 아니라 이 작업 내부의 step입니다.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, `skills-python`은 더 무거운 artifact 및 platform matrix 작업을 기다리지 않고 빠르게 실패합니다.
4. `build-artifacts`는 빠른 Linux lane과 겹쳐 실행되므로, 공유 build가 준비되는 즉시 downstream consumer가 시작할 수 있습니다.
5. 이후 더 무거운 platform 및 runtime lane이 fan out됩니다: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, `android`.

같은 PR이나 `main` ref에 더 새로운 푸시가 들어오면 GitHub가 대체된 작업을 `cancelled`로 표시할 수 있습니다. 같은 ref의 최신 실행도 실패 중인 경우가 아니라면 이를 CI noise로 취급하세요. Matrix 작업은 `fail-fast: false`를 사용하며, `build-artifacts`는 작은 verifier 작업을 queue에 넣는 대신 내장 channel, core-support-boundary, gateway-watch 실패를 직접 보고합니다. 자동 CI concurrency key는 버전이 지정되어 있으므로(`CI-v7-*`), 오래된 queue group의 GitHub-side zombie가 최신 main 실행을 무기한 차단할 수 없습니다. 수동 full-suite 실행은 `CI-manual-v1-*`를 사용하며 진행 중인 실행을 취소하지 않습니다.

GitHub Actions의 wall time, queue time, 가장 느린 작업, 실패, `pnpm-store-warmup` fanout barrier를 요약하려면 `pnpm ci:timings`, `pnpm ci:timings:recent`, 또는 `node scripts/ci-run-timings.mjs <run-id>`를 사용하세요. CI는 동일한 실행 요약도 `ci-timings-summary` artifact로 업로드합니다. Build timing은 `build-artifacts` 작업의 `Build dist` step을 확인하세요. `pnpm build:ci-artifacts`는 `[build-all] phase timings:`를 출력하고 `ui:build`를 포함합니다. 해당 작업은 `startup-memory` artifact도 업로드합니다.

풀 리퀘스트 실행의 경우 terminal timing-summary 작업은 `GH_TOKEN`을 `gh run view`에 전달하기 전에 trusted base revision의 helper를 실행합니다. 이렇게 하면 token이 포함된 query가 branch-controlled code 밖에 유지되면서도 풀 리퀘스트의 현재 CI 실행을 요약할 수 있습니다.

## PR context 및 evidence

외부 contributor PR은
`.github/workflows/real-behavior-proof.yml`에서 PR context 및 evidence gate를 실행합니다. 이 workflow는 신뢰된
base commit을 check out하고 PR body만 평가합니다. contributor branch의 코드는 실행하지 않습니다.

이 gate는 repository owner, member,
collaborator, bot이 아닌 PR author에게 적용됩니다. PR body에 author가 작성한
`What Problem This Solves` 및 `Evidence` section이 있으면 통과합니다. Evidence는 focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log, artifact link일 수 있습니다. Body는 의도와 유용한 검증 정보를 제공합니다.
reviewer는 정확성을 평가하기 위해 code, tests, CI를 검사합니다.

check가 실패하면 다른 code commit을 push하지 말고 PR body를 업데이트하세요.

## Scope 및 routing

Scope logic은 `scripts/ci-changed-scope.mjs`에 있으며 `src/scripts/ci-changed-scope.test.ts`의 unit test로 커버됩니다. Manual dispatch는 changed-scope detection을 건너뛰고 preflight manifest가 모든 scoped area가 변경된 것처럼 동작하게 합니다.

- **CI workflow 편집**은 Node CI graph와 workflow linting을 검증하지만, 그 자체만으로 Windows, iOS, Android, macOS native build를 강제하지는 않습니다. 해당 platform lane은 platform source change에만 scoped된 상태로 유지됩니다.
- **Workflow Sanity**는 모든 workflow YAML file에 대해 `actionlint`, `zizmor`, composite-action interpolation guard, conflict-marker guard를 실행합니다. PR-scoped `security-fast` 작업도 변경된 workflow file에 대해 `zizmor`를 실행하므로 workflow security finding이 main CI graph에서 일찍 실패합니다.
- **`main` 푸시의 docs**는 CI에서 사용하는 것과 동일한 ClawHub docs mirror를 사용해 standalone `Docs` workflow에서 확인되므로, code+docs가 섞인 push가 CI `check-docs` shard도 queue에 넣지는 않습니다. Pull request와 manual CI는 docs가 변경된 경우에도 CI에서 `check-docs`를 실행합니다.
- **TUI PTY**는 TUI 변경에 대해 `checks-node-core-runtime-tui-pty` Linux Node shard에서 실행됩니다. 이 shard는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`로 `test/vitest/vitest.tui-pty.config.ts`를 실행하므로, deterministic `TuiBackend` fixture lane과 외부 model endpoint만 mock하는 더 느린 `tui --local` smoke를 모두 커버합니다.
- **CI routing-only edit, 선택된 저비용 core-test fixture edit, 좁은 Plugin contract helper/test-routing edit**은 빠른 Node-only manifest path를 사용합니다: `preflight`, security, 단일 `checks-fast-core` task. 해당 path는 변경이 빠른 task가 직접 exercise하는 routing 또는 helper surface로 제한된 경우 build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards, additional guard matrices를 건너뜁니다.
- **Windows Node checks**는 Windows 전용 process/path wrapper, npm/pnpm/UI runner helper, package manager config, 해당 lane을 실행하는 CI workflow surface에 scoped됩니다. 관련 없는 source, Plugin, install-smoke, test-only change는 Linux Node lane에 남습니다.

가장 느린 Node 테스트 계열은 각 작업이 러너를 과도하게 예약하지 않으면서 작게 유지되도록 분할되거나 균형 조정됩니다. Plugin 계약과 채널 계약은 각각 표준 GitHub 러너 폴백을 갖춘 두 개의 가중치 기반 Blacksmith 지원 샤드로 실행되고, 코어 유닛 fast/support 레인은 별도로 실행되며, 코어 런타임 인프라는 state, process/config, shared, 세 개의 cron 도메인 샤드로 나뉩니다. auto-reply는 균형 잡힌 워커로 실행되고(reply 하위 트리는 agent-runner, dispatch, commands/state-routing 샤드로 분할), agentic gateway/server 구성은 빌드된 아티팩트를 기다리는 대신 chat/auth/model/http-plugin/runtime/startup 레인으로 나뉩니다. 그런 다음 일반 CI는 격리된 인프라 include-pattern 샤드만 최대 64개 테스트 파일의 결정적 번들로 패킹하여, 격리되지 않은 command/cron, 상태 저장 agents-core, gateway/server 스위트를 병합하지 않고 Node 매트릭스를 줄입니다. 무거운 고정 스위트는 8 vCPU에 유지되고, 번들된 레인과 낮은 가중치 레인은 4 vCPU를 사용합니다. canonical 저장소의 풀 리퀘스트는 추가 compact 승인 계획을 사용합니다. 동일한 config별 그룹이 현재 34개 작업 Linux Node 계획 안에서 격리된 하위 프로세스로 실행되므로, 단일 PR이 70개가 넘는 전체 Node 매트릭스를 등록하지 않습니다. `main` 푸시, 수동 디스패치, 릴리스 게이트는 전체 매트릭스를 유지합니다. 광범위한 브라우저, QA, 미디어, 기타 Plugin 테스트는 공유 Plugin catch-all 대신 전용 Vitest 구성을 사용합니다. Include-pattern 샤드는 CI 샤드 이름을 사용해 타이밍 항목을 기록하므로 `.artifacts/vitest-shard-timings.json`은 전체 config와 필터링된 샤드를 구분할 수 있습니다. `check-additional-*`는 package-boundary 컴파일/canary 작업을 함께 유지하고, 런타임 토폴로지 아키텍처를 Gateway watch 커버리지와 분리합니다. boundary guard 목록은 prompt가 많은 샤드 하나와 나머지 guard 스트라이프용 결합 샤드 하나로 스트라이핑되며, 각 샤드는 선택된 독립 guard를 동시에 실행하고 체크별 타이밍을 출력합니다. 비용이 큰 Codex happy-path prompt 스냅샷 drift 체크는 수동 CI와 prompt에 영향을 주는 변경에 대해서만 자체 additional 작업으로 실행됩니다. 따라서 일반적인 관련 없는 Node 변경은 차가운 prompt 스냅샷 생성 뒤에서 기다리지 않고, boundary 샤드는 균형을 유지하며, prompt drift는 여전히 그것을 유발한 PR에 고정됩니다. 동일한 플래그는 built-artifact 코어 support-boundary 샤드 안의 prompt 스냅샷 Vitest 생성도 건너뜁니다. Gateway watch, 채널 테스트, 코어 support-boundary 샤드는 `dist/`와 `dist-runtime/`가 이미 빌드된 뒤 `build-artifacts` 안에서 동시에 실행됩니다.

승인된 뒤 canonical Linux CI는 최대 24개의 동시 Node 테스트 작업과
더 작은 fast/check 레인용 12개를 허용합니다. Windows와 Android는
해당 러너 풀이 더 좁기 때문에 2개로 유지됩니다.

compact PR 계획은 현재 스위트에 대해 18개의 Node 작업을 내보냅니다. whole-config
그룹은 120분 배치 타임아웃이 있는 격리된 하위 프로세스로 배치되고,
include-pattern 그룹은 동일한 제한된 작업 예산을 공유합니다.

Android CI는 `testPlayDebugUnitTest`와 `testThirdPartyDebugUnitTest`를 모두 실행한 다음 Play debug APK를 빌드합니다. third-party flavor에는 별도 소스 세트나 manifest가 없습니다. 해당 unit-test 레인은 여전히 SMS/call-log BuildConfig 플래그로 flavor를 컴파일하면서, Android 관련 푸시마다 중복 debug APK 패키징 작업을 피합니다.

`check-dependencies` 샤드는 `pnpm deadcode:dependencies`(최신 Knip 버전에 고정되고 `dlx` 설치에 대해 pnpm의 최소 릴리스 연령이 비활성화된 프로덕션 Knip 의존성 전용 패스)와 `pnpm deadcode:unused-files`를 실행합니다. 후자는 Knip의 프로덕션 미사용 파일 발견 결과를 `scripts/deadcode-unused-files.allowlist.mjs`와 비교합니다. unused-file guard는 PR이 검토되지 않은 새 미사용 파일을 추가하거나 오래된 allowlist 항목을 남길 때 실패하며, Knip이 정적으로 해석할 수 없는 의도적인 동적 Plugin, 생성물, 빌드, live-test, package bridge 표면은 보존합니다.

## ClawSweeper 활동 전달

`.github/workflows/clawsweeper-dispatch.yml`은 OpenClaw 저장소 활동을 ClawSweeper로 보내는 대상 측 브리지입니다. 신뢰할 수 없는 풀 리퀘스트 코드를 체크아웃하거나 실행하지 않습니다. 워크플로는 `CLAWSWEEPER_APP_PRIVATE_KEY`에서 GitHub App 토큰을 만든 다음, compact `repository_dispatch` 페이로드를 `openclaw/clawsweeper`로 디스패치합니다.

워크플로에는 네 개의 레인이 있습니다.

- 정확한 이슈 및 풀 리퀘스트 리뷰 요청용 `clawsweeper_item`;
- 이슈 댓글의 명시적 ClawSweeper 명령용 `clawsweeper_comment`;
- `main` 푸시의 커밋 수준 리뷰 요청용 `clawsweeper_commit_review`;
- ClawSweeper 에이전트가 검사할 수 있는 일반 GitHub 활동용 `github_activity`.

`github_activity` 레인은 정규화된 메타데이터만 전달합니다. 이벤트 유형, 작업, 행위자, 저장소, 항목 번호, URL, 제목, 상태, 그리고 댓글이나 리뷰가 있을 때의 짧은 발췌문입니다. 전체 webhook 본문은 의도적으로 전달하지 않습니다. `openclaw/clawsweeper`의 수신 워크플로는 `.github/workflows/github-activity.yml`이며, 정규화된 이벤트를 ClawSweeper 에이전트용 OpenClaw Gateway 훅에 게시합니다.

일반 활동은 관찰이지 기본 전달이 아닙니다. ClawSweeper 에이전트는 프롬프트에서 Discord 대상을 받고, 이벤트가 놀랍거나, 조치 가능하거나, 위험하거나, 운영상 유용할 때만 `#clawsweeper`에 게시해야 합니다. 일상적인 열기, 편집, 봇 변동, 중복 webhook 노이즈, 일반 리뷰 트래픽은 `NO_REPLY`가 되어야 합니다.

이 경로 전반에서 GitHub 제목, 댓글, 본문, 리뷰 텍스트, 브랜치 이름, 커밋 메시지를 신뢰할 수 없는 데이터로 취급하세요. 이들은 요약과 triage를 위한 입력이지, 워크플로나 에이전트 런타임에 대한 지시가 아닙니다.

## 수동 디스패치

수동 CI 디스패치는 일반 CI와 동일한 작업 그래프를 실행하지만 모든 비 Android 범위 레인을 강제로 켭니다. Linux Node 샤드, bundled-plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, built-artifact smoke 체크, 문서 체크, Python Skills, Windows, macOS, iOS 빌드, Control UI i18n입니다. 독립 실행형 수동 CI 디스패치는 `include_android=true`일 때만 Android를 실행합니다. 전체 릴리스 umbrella는 `include_android=true`를 전달해 Android를 활성화합니다. Plugin 프리릴리스 정적 체크, 릴리스 전용 `agentic-plugins` 샤드, 전체 extension 배치 스윕, Plugin 프리릴리스 Docker 레인은 CI에서 제외됩니다. Docker 프리릴리스 스위트는 `Full Release Validation`이 릴리스 검증 게이트를 활성화한 상태로 별도의 `Plugin Prerelease` 워크플로를 디스패치할 때만 실행됩니다.

수동 실행은 고유한 동시성 그룹을 사용하므로 릴리스 후보 전체 스위트가 동일한 ref의 다른 푸시나 PR 실행에 의해 취소되지 않습니다. 선택적 `target_ref` 입력을 사용하면 신뢰할 수 있는 호출자가 선택된 디스패치 ref의 워크플로 파일을 사용하면서 브랜치, 태그, 전체 커밋 SHA를 대상으로 해당 그래프를 실행할 수 있습니다.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 러너

| 러너                            | 작업                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 수동 CI 디스패치와 비 canonical 저장소 폴백, CodeQL JavaScript/actions 품질 스캔, workflow-sanity, labeler, auto-response, CI 외부 문서 워크플로, Blacksmith 매트릭스가 더 일찍 큐에 들어갈 수 있도록 하는 install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, 낮은 가중치 extension 샤드, `checks-fast-core`, Plugin/채널 계약 샤드, 대부분의 bundled/낮은 가중치 Linux Node 샤드, `check-guards`, `check-prod-types`, `check-test-types`, 선택된 `check-additional-*` 샤드, `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 유지되는 무거운 Linux Node 스위트, boundary/extension-heavy `check-additional-*` 샤드, `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint`(8 vCPU가 절약한 것보다 비용이 더 들 만큼 CPU에 민감함), install-smoke Docker 빌드(32-vCPU 큐 시간이 절약한 것보다 비용이 더 들었음)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw`의 `macos-node`; 포크는 `macos-15`로 폴백                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw`의 `macos-swift`와 `ios-build`; 포크는 `macos-26`으로 폴백                                                                                                                                                                                                  |

## 러너 등록 예산

OpenClaw의 현재 GitHub 러너 등록 버킷은 5분마다 3,000개의 self-hosted
러너 등록을 허용합니다. 이 제한은 `openclaw` 조직의 모든 Blacksmith 러너
등록이 공유하므로, 다른 Blacksmith 설치를 추가해도 새 버킷이 추가되지 않습니다.

Blacksmith label을 burst 제어를 위한 희소 리소스로 취급하세요. 라우팅,
알림, 요약, 샤드 선택만 하거나 짧은 CodeQL 스캔을 실행하는 작업은
측정된 Blacksmith 특화 필요가 없는 한 GitHub-hosted 러너에 유지해야
합니다. 새로운 Blacksmith 매트릭스, 더 큰 `max-parallel`, 또는 고빈도
워크플로는 최악의 경우 등록 수를 보여야 하며, 동시 저장소와 재시도된
작업을 위한 여유를 남기도록 조직 수준 목표를 5분마다 2,000개 등록
아래로 유지해야 합니다.

canonical-repo CI는 일반 push 및 pull-request 실행의 기본 러너 경로로 Blacksmith를 유지합니다. `workflow_dispatch`와 비 canonical 저장소 실행은 GitHub-hosted 러너를 사용하지만, 일반 canonical 실행은 현재 Blacksmith 큐 상태를 탐색하거나 Blacksmith를 사용할 수 없을 때 GitHub-hosted label로 자동 폴백하지 않습니다.

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

`OpenClaw Performance`는 제품/런타임 성능 워크플로입니다. 매일 `main`에서 실행되며 수동으로 디스패치할 수도 있습니다.

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

수동 디스패치는 일반적으로 워크플로 ref를 벤치마크합니다. 릴리스 태그나 현재 워크플로 구현이 있는 다른 브랜치를 벤치마크하려면 `target_ref`를 설정하세요. 게시된 보고서 경로와 최신 포인터는 테스트된 ref를 기준으로 키가 지정되며, 각 `index.md`에는 테스트된 ref/SHA, 워크플로 ref/SHA, Kova ref, 프로필, lane 인증 모드, 모델, 반복 횟수, 시나리오 필터가 기록됩니다.

이 워크플로는 고정된 릴리스에서 OCM을 설치하고, `openclaw/Kova`에서 고정된 `kova_ref` 입력값으로 Kova를 설치한 뒤 세 가지 lane을 실행합니다.

- `mock-provider`: 결정론적 가짜 OpenAI 호환 인증을 사용하는 로컬 빌드 런타임에 대한 Kova 진단 시나리오입니다.
- `mock-deep-profile`: 시작, Gateway, 에이전트 턴의 핫스팟에 대한 CPU/힙/트레이스 프로파일링입니다.
- `live-openai-candidate`: 실제 OpenAI `openai/gpt-5.5` 에이전트 턴이며, `OPENAI_API_KEY`를 사용할 수 없으면 건너뜁니다.

mock-provider lane은 Kova 통과 후 OpenClaw 네이티브 소스 프로브도 실행합니다. 기본, hook, 50-Plugin 시작 사례 전반의 Gateway 부팅 시간과 메모리, 번들 Plugin 가져오기 RSS, 반복 mock-OpenAI `channel-chat-baseline` hello 루프, 부팅된 Gateway에 대한 CLI 시작 명령, SQLite 상태 스모크 성능 프로브를 실행합니다. 테스트된 ref에 대해 이전에 게시된 mock-provider 소스 보고서를 사용할 수 있으면, 소스 요약은 현재 RSS 및 힙 값을 해당 기준선과 비교하고 큰 RSS 증가를 `watch`로 표시합니다. 소스 프로브 Markdown 요약은 보고서 번들의 `source/index.md`에 있으며, 원시 JSON은 그 옆에 있습니다.

모든 lane은 GitHub 아티팩트를 업로드합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 워크플로는 `report.json`, `report.md`, 번들, `index.md`, 소스 프로브 아티팩트를 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 아래의 `openclaw/clawgrit-reports`에도 커밋합니다. 현재 테스트된 ref 포인터는 `openclaw-performance/<tested-ref>/latest-<lane>.json`으로 작성됩니다.

## 전체 릴리스 검증

`Full Release Validation`은 "릴리스 전에 모든 것을 실행"하기 위한 수동 상위 워크플로입니다. 브랜치, 태그 또는 전체 커밋 SHA를 입력받아 해당 대상으로 수동 `CI` 워크플로를 디스패치하고, 릴리스 전용 Plugin/패키지/정적/Docker 증명을 위한 `Plugin Prerelease`를 디스패치하며, 설치 스모크, 패키지 수용, 크로스 OS 패키지 검사, QA 프로필 증거에서 성숙도 스코어카드 렌더링, QA Lab parity, Matrix, Telegram lane을 위한 `OpenClaw Release Checks`를 디스패치합니다. stable 및 full 프로필은 항상 포괄적인 live/E2E와 Docker 릴리스 경로 soak 커버리지를 포함하며, beta 프로필은 `run_release_soak=true`로 선택적으로 활성화할 수 있습니다. 표준 패키지 Telegram E2E는 Package Acceptance 내부에서 실행되므로 전체 후보는 중복 live poller를 시작하지 않습니다. 게시 후에는 `release_package_spec`을 전달하여 릴리스 검사, Package Acceptance, Docker, 크로스 OS, Telegram 전반에서 배송된 npm 패키지를 재빌드 없이 재사용하세요. 집중된 게시 패키지 Telegram 재실행에만 `npm_telegram_package_spec`을 사용하세요. Codex Plugin live 패키지 lane은 기본적으로 동일하게 선택된 상태를 사용합니다. 게시된 `release_package_spec=openclaw@<tag>`는 `codex_plugin_spec=npm:@openclaw/codex@<tag>`를 파생하며, SHA/아티팩트 실행은 선택된 ref에서 `extensions/codex`를 패키징합니다. `npm:`, `npm-pack:`, `git:` 사양과 같은 사용자 지정 Plugin 소스에는 `codex_plugin_spec`을 명시적으로 설정하세요.

단계 매트릭스, 정확한 워크플로 작업 이름, 프로필 차이, 아티팩트,
집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을
참조하세요.

`OpenClaw Release Publish`는 수동 변경 릴리스 워크플로입니다. 릴리스 태그가 존재하고
OpenClaw npm 사전 검사가 성공한 뒤 `release/YYYY.M.PATCH` 또는 `main`에서 디스패치하세요.
이 워크플로는 `pnpm plugins:sync:check`를 검증하고, 게시 가능한 모든 Plugin 패키지에 대해
`Plugin NPM Release`를 디스패치하며, 동일한 릴리스 SHA에 대해 `Plugin ClawHub Release`를
디스패치한 다음, 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.
stable 게시에는 정확한 `windows_node_tag`도 필요합니다. 워크플로는 게시 자식 작업 전에
Windows 소스 릴리스를 검증하고 해당 x64/ARM64 설치 프로그램을 후보 승인된
`windows_node_installer_digests` 입력값과 비교한 뒤, GitHub 릴리스 초안을 게시하기 전에
동일하게 고정된 설치 프로그램 digest와 정확한 companion 자산 및 체크섬 계약을 승격하고 검증합니다.

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
헬퍼는 대상 SHA에 임시 `release-ci/<sha>-...` 브랜치를 푸시하고,
해당 고정 ref에서 `Full Release Validation`을 디스패치하며, 모든 자식
워크플로의 `headSha`가 대상과 일치하는지 검증하고, 실행이 완료되면 임시 브랜치를
삭제합니다. 상위 검증기는 자식 워크플로가 다른 SHA에서 실행된 경우에도 실패합니다.

`release_profile`은 릴리스 검사로 전달되는 live/provider 범위를 제어합니다.
수동 릴리스 워크플로의 기본값은 `stable`입니다. 광범위한 advisory provider/media
매트릭스를 의도적으로 원하는 경우에만 `full`을 사용하세요. stable 및 full 릴리스 검사는
항상 포괄적인 live/E2E와 Docker 릴리스 경로 soak를 실행하며, beta 프로필은
`run_release_soak=true`로 선택적으로 활성화할 수 있습니다.

- `minimum`은 가장 빠른 OpenAI/코어 릴리스 핵심 lane만 유지합니다.
- `stable`은 stable provider/backend 세트를 추가합니다.
- `full`은 광범위한 advisory provider/media 매트릭스를 실행합니다.

상위 워크플로는 디스패치된 자식 실행 ID를 기록하며, 최종 `Verify full validation` 작업은 현재 자식 실행 결론을 다시 확인하고 각 자식 실행의 가장 느린 작업 표를 덧붙입니다. 자식 워크플로가 재실행되어 성공 상태가 되면 상위 결과와 시간 요약을 새로 고치기 위해 부모 검증기 작업만 재실행하세요.

복구를 위해 `Full Release Validation`과 `OpenClaw Release Checks`는 모두 `rerun_group`을 받습니다. 릴리스 후보에는 `all`, 일반 전체 CI 자식만에는 `ci`, Plugin 사전 릴리스 자식만에는 `plugin-prerelease`, 모든 릴리스 자식에는 `release-checks`, 또는 더 좁은 그룹인 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, 상위 워크플로의 `npm-telegram`을 사용하세요. 이렇게 하면 집중 수정 후 실패한 릴리스 박스 재실행 범위가 제한됩니다. 실패한 크로스 OS lane 하나에는 `rerun_group=cross-os`를 `cross_os_suite_filter`와 함께 사용하세요. 예: `windows/packaged-upgrade`; 긴 크로스 OS 명령은 Heartbeat 라인을 출력하고 packaged-upgrade 요약에는 단계별 시간이 포함됩니다. QA 릴리스 검사 lane은 표준 런타임 도구 커버리지 게이트를 제외하고는 advisory입니다. 이 게이트는 필요한 OpenClaw 동적 도구가 표준 tier 요약에서 drift하거나 사라질 때 차단합니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용해 선택된 ref를 한 번 `release-package-under-test` tarball로 해석한 다음, 해당 아티팩트를 크로스 OS 검사와 Package Acceptance, 그리고 soak 커버리지가 실행될 때 live/E2E 릴리스 경로 Docker 워크플로에 전달합니다. 이렇게 하면 릴리스 박스 전반에서 패키지 바이트가 일관되게 유지되고 여러 자식 작업에서 동일 후보를 다시 패키징하지 않아도 됩니다. Codex npm-Plugin live lane의 경우, 릴리스 검사는 `release_package_spec`에서 파생된 일치하는 게시 Plugin 사양을 전달하거나, 운영자가 제공한 `codex_plugin_spec`을 전달하거나, 입력을 비워 두어 Docker 스크립트가 선택된 checkout의 Codex Plugin을 패키징하도록 합니다.

`ref=main` 및 `rerun_group=all`에 대한 중복 `Full Release Validation` 실행은
더 오래된 상위 워크플로를 대체합니다. 부모 모니터는 부모가 취소될 때 이미 디스패치한
모든 자식 워크플로를 취소하므로, 더 최신 main 검증이 오래된 2시간짜리 릴리스 검사 실행
뒤에 대기하지 않습니다. 릴리스 브랜치/태그 검증과 집중 재실행 그룹은
`cancel-in-progress: false`를 유지합니다.

## Live 및 E2E shard

릴리스 live/E2E 자식은 광범위한 네이티브 `pnpm test:live` 커버리지를 유지하지만, 하나의 직렬 작업 대신 `scripts/test-live-shard.mjs`를 통해 명명된 shard로 실행합니다.

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
- 분할된 미디어 오디오/비디오 shard와 provider 필터링된 음악 shard

이 방식은 동일한 파일 커버리지를 유지하면서 느린 live provider 실패를 더 쉽게 재실행하고 진단할 수 있게 합니다. 집계 `native-live-extensions-o-z`, `native-live-extensions-media`, `native-live-extensions-media-music` shard 이름은 수동 일회성 재실행에도 계속 유효합니다.

네이티브 live media shard는 `Live Media Runner Image` 워크플로가 빌드한 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`에서 실행됩니다. 해당 이미지는 `ffmpeg`와 `ffprobe`를 미리 설치합니다. media 작업은 설정 전에 바이너리만 검증합니다. Docker 기반 live suite는 일반 Blacksmith runner에서 유지하세요. 컨테이너 작업은 중첩 Docker 테스트를 시작하기에 적절한 위치가 아닙니다.

Docker 기반 라이브 모델/백엔드 샤드는 선택한 커밋마다 별도의 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용합니다. 라이브 릴리스 워크플로는 해당 이미지를 한 번 빌드하고 푸시한 다음, Docker 라이브 모델, 제공자별로 샤딩된 Gateway, CLI 백엔드, ACP 바인드, Codex 하니스 샤드가 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 실행됩니다. Gateway Docker 샤드는 워크플로 작업 타임아웃보다 낮은 명시적 스크립트 수준 `timeout` 상한을 가져, 멈춘 컨테이너나 정리 경로가 전체 릴리스 검사 예산을 소비하는 대신 빠르게 실패하도록 합니다. 해당 샤드가 전체 소스 Docker 대상을 독립적으로 다시 빌드한다면 릴리스 실행이 잘못 구성된 것이며 중복 이미지 빌드에 실제 시간을 낭비하게 됩니다.

## 패키지 승인

질문이 "설치 가능한 이 OpenClaw 패키지가 제품으로 작동하는가?"일 때 `Package Acceptance`를 사용합니다. 이는 일반 CI와 다릅니다. 일반 CI는 소스 트리를 검증하지만, 패키지 승인은 설치 또는 업데이트 후 사용자가 실행하는 동일한 Docker E2E 하니스를 통해 단일 타볼을 검증합니다.

### 작업

1. `resolve_package`는 `workflow_ref`를 체크아웃하고, 하나의 패키지 후보를 해석하고, `.artifacts/docker-e2e-package/openclaw-current.tgz`를 쓰고, `.artifacts/docker-e2e-package/package-candidate.json`을 쓰고, 둘 모두를 `package-under-test` 아티팩트로 업로드하며, GitHub 단계 요약에 소스, 워크플로 ref, 패키지 ref, 버전, SHA-256, 프로필을 출력합니다.
2. `docker_acceptance`는 `ref=workflow_ref` 및 `package_artifact_name=package-under-test`로 `openclaw-live-and-e2e-checks-reusable.yml`을 호출합니다. 재사용 가능 워크플로는 해당 아티팩트를 다운로드하고, 타볼 인벤토리를 검증하고, 필요할 때 패키지 다이제스트 Docker 이미지를 준비하며, 워크플로 체크아웃을 패킹하는 대신 해당 패키지를 대상으로 선택된 Docker 레인을 실행합니다. 프로필이 여러 대상 `docker_lanes`를 선택하면, 재사용 가능 워크플로는 패키지와 공유 이미지를 한 번 준비한 다음 해당 레인을 고유한 아티팩트를 가진 병렬 대상 Docker 작업으로 팬아웃합니다.
3. `package_telegram`은 선택적으로 `NPM Telegram Beta E2E`를 호출합니다. `telegram_mode`가 `none`이 아닐 때 실행되며, Package Acceptance가 패키지를 해석한 경우 동일한 `package-under-test` 아티팩트를 설치합니다. 독립 실행형 Telegram 디스패치는 여전히 게시된 npm 명세를 설치할 수 있습니다.
4. `summary`는 패키지 해석, Docker 승인, 또는 선택적 Telegram 레인이 실패하면 워크플로를 실패시킵니다.

### 후보 소스

- `source=npm`은 `openclaw@beta`, `openclaw@latest`, 또는 `openclaw@2026.4.27-beta.2` 같은 정확한 OpenClaw 릴리스 버전만 허용합니다. 게시된 프리릴리스/안정 버전 승인에 사용합니다.
- `source=ref`는 신뢰할 수 있는 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패킹합니다. 해석기는 OpenClaw 브랜치/태그를 가져오고, 선택한 커밋이 저장소 브랜치 히스토리 또는 릴리스 태그에서 도달 가능한지 확인하고, 분리된 워크트리에 종속성을 설치한 다음 `scripts/package-openclaw-for-docker.mjs`로 패킹합니다.
- `source=url`은 공개 HTTPS `.tgz`를 다운로드합니다. `package_sha256`이 필요합니다. 이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트 이름 또는 해석된 IP, 그리고 동일한 공개 안전 정책 밖으로 나가는 리디렉션을 거부합니다.
- `source=trusted-url`은 `.github/package-trusted-sources.json`의 이름 지정된 신뢰 소스 정책에서 HTTPS `.tgz`를 다운로드합니다. `package_sha256` 및 `trusted_source_id`가 필요합니다. 구성된 호스트, 포트, 경로 접두사, 리디렉션 호스트, 또는 비공개 네트워크 해석이 필요한 관리자 소유 엔터프라이즈 미러나 비공개 패키지 저장소에만 사용합니다. 정책이 bearer 인증을 선언하면 워크플로는 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 비밀을 사용합니다. URL에 포함된 자격 증명은 여전히 거부됩니다.
- `source=artifact`는 `artifact_run_id`와 `artifact_name`에서 하나의 `.tgz`를 다운로드합니다. `package_sha256`은 선택 사항이지만 외부에서 공유된 아티팩트에는 제공해야 합니다.

`workflow_ref`와 `package_ref`를 분리해 유지합니다. `workflow_ref`는 테스트를 실행하는 신뢰할 수 있는 워크플로/하니스 코드입니다. `package_ref`는 `source=ref`일 때 패킹되는 소스 커밋입니다. 이를 통해 현재 테스트 하니스가 오래된 워크플로 로직을 실행하지 않고도 이전의 신뢰할 수 있는 소스 커밋을 검증할 수 있습니다.

### 제품군 프로필

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package`에 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui` 추가
- `full` — OpenWebUI가 포함된 전체 Docker 릴리스 경로 청크
- `custom` — 정확한 `docker_lanes`; `suite_profile=custom`일 때 필요

`package` 프로필은 오프라인 Plugin 커버리지를 사용하므로 게시된 패키지 검증이 라이브 ClawHub 가용성에 의해 차단되지 않습니다. 선택적 Telegram 레인은 `NPM Telegram Beta E2E`에서 `package-under-test` 아티팩트를 재사용하며, 게시된 npm 명세 경로는 독립 실행형 디스패치용으로 유지됩니다.

로컬 명령, Docker 레인, Package Acceptance 입력, 릴리스 기본값, 실패 분류를 포함한 전용 업데이트 및 Plugin 테스트 정책은 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

릴리스 검사는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, `telegram_mode=mock-openai`로 Package Acceptance를 호출합니다. 이렇게 하면 패키지 마이그레이션, 업데이트, 라이브 ClawHub Skill 설치, 오래된 Plugin 종속성 정리, 구성된 Plugin 설치 복구, 오프라인 Plugin, Plugin 업데이트, Telegram 증명이 동일하게 해석된 패키지 타볼에서 유지됩니다. 베타를 게시한 후 빌드 없이 배송된 npm 패키지에 대해 동일한 매트릭스를 실행하려면 Full Release Validation 또는 OpenClaw Release Checks에 `release_package_spec`을 설정합니다. Package Acceptance가 나머지 릴리스 검증과 다른 패키지를 필요로 할 때만 `package_acceptance_package_spec`을 설정합니다. 교차 OS 릴리스 검사는 여전히 OS별 온보딩, 설치 관리자, 플랫폼 동작을 다룹니다. 패키지/업데이트 제품 검증은 Package Acceptance에서 시작해야 합니다. `published-upgrade-survivor` Docker 레인은 차단 릴리스 경로에서 실행마다 하나의 게시된 패키지 기준선을 검증합니다. Package Acceptance에서 해석된 `package-under-test` 타볼은 항상 후보이며, `published_upgrade_survivor_baseline`은 대체 게시 기준선을 선택하고 기본값은 `openclaw@latest`입니다. 실패한 레인 재실행 명령은 해당 기준선을 보존합니다. `run_release_soak=true` 또는 `release_profile=full`인 Full Release Validation은 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 및 `published_upgrade_survivor_scenarios=reported-issues`를 설정해 최신 안정 npm 릴리스 4개와 고정된 Plugin 호환성 경계 릴리스, 그리고 Feishu 구성, 보존된 bootstrap/persona 파일, 구성된 OpenClaw Plugin 설치, 틸드 로그 경로, 오래된 레거시 Plugin 종속성 루트에 대한 이슈 형태의 픽스처로 확장합니다. 여러 기준선의 published-upgrade survivor 선택은 기준선별로 별도의 대상 Docker 러너 작업으로 샤딩됩니다. 별도의 `Update Migration` 워크플로는 질문이 일반 Full Release CI 범위가 아니라 게시된 업데이트 정리의 전수 검증일 때 `all-since-2026.4.23` 및 `plugin-deps-cleanup`과 함께 `update-migration` Docker 레인을 사용합니다. 로컬 집계 실행은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 패키지 명세를 전달하거나, `openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 단일 레인을 유지하거나, 시나리오 매트릭스에 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`를 설정할 수 있습니다. 게시된 레인은 내장된 `openclaw config set` 명령 레시피로 기준선을 구성하고, 레시피 단계를 `summary.json`에 기록하며, Gateway 시작 후 `/healthz`, `/readyz`, RPC 상태를 프로브합니다. Windows 패키지 및 설치 관리자 신규 레인은 설치된 패키지가 원시 절대 Windows 경로에서 브라우저 제어 재정의를 가져올 수 있는지도 확인합니다. OpenAI 교차 OS 에이전트 턴 스모크는 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 기본값으로 사용하고, 그렇지 않으면 `openai/gpt-5.5`를 사용하므로 GPT-4.x 기본값을 피하면서 설치 및 Gateway 증명이 GPT-5 테스트 모델에 유지됩니다.

### 레거시 호환성 기간

Package Acceptance에는 이미 게시된 패키지에 대해 제한된 레거시 호환성 기간이 있습니다. `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 호환성 경로를 사용할 수 있습니다.

- `dist/postinstall-inventory.json`의 알려진 비공개 QA 항목은 타볼에서 생략된 파일을 가리킬 수 있습니다.
- 패키지가 해당 플래그를 노출하지 않을 때 `doctor-switch`는 `gateway install --wrapper` 지속성 하위 사례를 건너뛸 수 있습니다.
- `update-channel-switch`는 타볼에서 파생된 가짜 git 픽스처에서 누락된 pnpm `patchedDependencies`를 가지치기할 수 있고, 지속된 `update.channel` 누락을 로그로 남길 수 있습니다.
- Plugin 스모크는 레거시 설치 기록 위치를 읽거나 누락된 마켓플레이스 설치 기록 지속성을 허용할 수 있습니다.
- `plugin-update`는 설치 기록과 재설치 없음 동작이 변경되지 않아야 한다는 요구를 유지하면서 구성 메타데이터 마이그레이션을 허용할 수 있습니다.

게시된 `2026.4.26` 패키지는 이미 배송된 로컬 빌드 메타데이터 스탬프 파일에 대해서도 경고할 수 있습니다. 이후 패키지는 최신 계약을 충족해야 하며, 동일한 조건은 경고나 건너뛰기 대신 실패합니다.

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

실패한 패키지 승인 실행을 디버깅할 때는 `resolve_package` 요약에서 시작해 패키지 소스, 버전, SHA-256을 확인합니다. 그런 다음 `docker_acceptance` 하위 실행과 해당 Docker 아티팩트를 검사합니다. `.artifacts/docker-tests/**/summary.json`, `failures.json`, 레인 로그, 단계 타이밍, 재실행 명령을 확인하세요. 전체 릴리스 검증을 다시 실행하는 대신 실패한 패키지 프로필 또는 정확한 Docker 레인을 다시 실행하는 편이 좋습니다.

## 설치 스모크

별도의 `Install Smoke` 워크플로는 자체 `preflight` 작업을 통해 동일한 범위 스크립트를 재사용합니다. 스모크 커버리지를 `run_fast_install_smoke`와 `run_full_install_smoke`로 분할합니다.

- **빠른 경로**는 Docker/패키지 영역, 번들 Plugin 패키지/매니페스트 변경, 또는 Docker 스모크 작업이 실행하는 핵심 Plugin/채널/Gateway/Plugin SDK 영역을 건드리는 풀 리퀘스트에서 실행됩니다. 소스만 변경한 번들 Plugin 변경, 테스트 전용 수정, 문서 전용 수정은 Docker 워커를 예약하지 않습니다. 빠른 경로는 루트 Dockerfile 이미지를 한 번 빌드하고, CLI를 확인하고, agents delete 공유 작업 공간 CLI 스모크를 실행하고, 컨테이너 gateway-network E2E를 실행하고, 번들 확장 빌드 인수를 검증하며, 240초의 집계 명령 제한 시간 안에서 제한된 번들 Plugin Docker 프로필을 실행합니다(각 시나리오의 Docker 실행은 별도로 제한됨).
- **전체 경로**는 야간 예약 실행, 수동 디스패치, 워크플로 호출 릴리스 검사, 그리고 실제로 설치 관리자/패키지/Docker 영역을 건드리는 풀 리퀘스트를 위해 QR 패키지 설치와 설치 관리자 Docker/업데이트 커버리지를 유지합니다. 전체 모드에서 install-smoke는 대상 SHA의 GHCR 루트 Dockerfile 스모크 이미지를 하나 준비하거나 재사용한 다음, QR 패키지 설치, 루트 Dockerfile/Gateway 스모크, 설치 관리자/업데이트 스모크, 빠른 번들 Plugin Docker E2E를 별도 작업으로 실행하여 설치 관리자 작업이 루트 이미지 스모크 뒤에서 대기하지 않도록 합니다.

`main` 푸시(머지 커밋 포함)는 전체 경로를 강제하지 않습니다. 변경 범위 로직이 푸시에서 전체 커버리지를 요청하더라도 워크플로는 빠른 Docker 스모크를 유지하고, 전체 설치 스모크는 야간 또는 릴리스 검증에 맡깁니다.

느린 Bun 전역 설치 image-provider 스모크는 `run_bun_global_install_smoke`로 별도 게이트됩니다. 이 스모크는 야간 일정과 릴리스 검사 워크플로에서 실행되며, 수동 `Install Smoke` 디스패치는 이를 선택할 수 있지만 풀 리퀘스트와 `main` 푸시에서는 실행되지 않습니다. 일반 PR CI는 Node 관련 변경에 대해 빠른 Bun 런처 회귀 레인을 계속 실행합니다. QR 및 설치 관리자 Docker 테스트는 설치에 초점을 둔 자체 Dockerfile을 유지합니다.

## 로컬 Docker E2E

`pnpm test:docker:all`은 공유 라이브 테스트 이미지 하나를 미리 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 공유 `scripts/e2e/Dockerfile` 이미지 두 개를 빌드합니다.

- 설치 관리자/업데이트/Plugin 의존성 레인을 위한 기본 Node/Git 러너
- 일반 기능 레인을 위해 같은 tarball을 `/app`에 설치하는 기능 이미지

Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, 러너는 선택된 계획만 실행합니다. 스케줄러는 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 및 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`로 레인별 이미지를 선택한 다음, `OPENCLAW_SKIP_DOCKER_BUILD=1`로 레인을 실행합니다.

### 조정 가능 항목

| 변수                                   | 기본값  | 목적                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 일반 레인을 위한 메인 풀 슬롯 수.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 공급자에 민감한 테일 풀 슬롯 수.                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 공급자가 제한을 걸지 않도록 하는 동시 라이브 레인 상한.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 동시 npm 설치 레인 상한.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 동시 다중 서비스 레인 상한.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker 데몬 생성 폭주를 피하기 위한 레인 시작 간 지연. 지연이 필요 없으면 `0`으로 설정.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 레인별 대체 제한 시간(120분). 선택된 라이브/테일 레인은 더 엄격한 상한을 사용합니다.          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1`이면 레인을 실행하지 않고 스케줄러 계획을 출력합니다.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 쉼표로 구분한 정확한 레인 목록. 에이전트가 실패한 레인 하나를 재현할 수 있도록 정리 스모크를 건너뜁니다. |

유효 상한보다 무거운 레인도 비어 있는 풀에서는 시작할 수 있으며, 이후 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 집계는 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 활성 레인 상태를 내보내고, 가장 오래 걸린 항목을 먼저 배치하기 위해 레인 타이밍을 저장하며, 기본적으로 첫 번째 실패 이후에는 새 풀 레인 예약을 중단합니다.

### 재사용 가능한 라이브/E2E 워크플로

재사용 가능한 라이브/E2E 워크플로는 `scripts/test-docker-all.mjs --plan-json`에 어떤 패키지, 이미지 종류, 라이브 이미지, 레인, 자격 증명 커버리지가 필요한지 묻습니다. 그런 다음 `scripts/docker-e2e.mjs`가 해당 계획을 GitHub 출력과 요약으로 변환합니다. 이 워크플로는 `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 패킹하거나, 현재 실행의 패키지 아티팩트를 다운로드하거나, `package_artifact_run_id`의 패키지 아티팩트를 다운로드합니다. 그리고 tarball 인벤토리를 검증하고, 계획에 패키지 설치 레인이 필요할 때 Blacksmith의 Docker 레이어 캐시를 통해 패키지 다이제스트 태그가 붙은 bare/functional GHCR Docker E2E 이미지를 빌드하고 푸시하며, 다시 빌드하는 대신 제공된 `docker_e2e_bare_image`/`docker_e2e_functional_image` 입력 또는 기존 패키지 다이제스트 이미지를 재사용합니다. Docker 이미지 pull은 시도별 180초의 제한된 제한 시간으로 재시도되므로, 멈춘 레지스트리/캐시 스트림이 CI 핵심 경로의 대부분을 소비하지 않고 빠르게 재시도됩니다.

### 릴리스 경로 청크

릴리스 Docker 커버리지는 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 더 작은 청크 작업을 실행하여, 각 청크가 필요한 이미지 종류만 pull하고 같은 가중 스케줄러를 통해 여러 레인을 실행하도록 합니다.

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

현재 릴리스 Docker 청크는 `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, 그리고 `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지입니다. `package-update-openai`에는 라이브 Codex Plugin 패키지 레인이 포함됩니다. 이 레인은 후보 OpenClaw 패키지를 설치하고, 명시적인 Codex CLI 설치 승인과 함께 `codex_plugin_spec` 또는 같은 ref의 tarball에서 Codex Plugin을 설치하고, Codex CLI 사전 점검을 실행한 다음, OpenAI를 상대로 같은 세션의 OpenClaw 에이전트 턴을 여러 번 실행합니다. `plugins-runtime-core`, `plugins-runtime`, `plugins-integrations`는 집계 Plugin/런타임 별칭으로 남아 있습니다. `install-e2e` 레인 별칭은 두 공급자 설치 관리자 레인 모두에 대한 집계 수동 재실행 별칭으로 남아 있습니다.

전체 릴리스 경로 커버리지가 요청하는 경우 OpenWebUI는 `plugins-runtime-services`에 포함되며, OpenWebUI 전용 디스패치에만 독립형 `openwebui` 청크를 유지합니다. 번들 채널 업데이트 레인은 일시적인 npm 네트워크 실패에 대해 한 번 재시도합니다.

각 청크는 레인 로그, 타이밍, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 느린 레인 표, 레인별 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 워크플로 `docker_lanes` 입력은 청크 작업 대신 준비된 이미지에 대해 선택된 레인을 실행합니다. 이렇게 하면 실패 레인 디버깅이 대상 Docker 작업 하나로 제한되고, 해당 실행을 위한 패키지 아티팩트를 준비, 다운로드 또는 재사용합니다. 선택된 레인이 라이브 Docker 레인이면 대상 작업은 해당 재실행을 위해 라이브 테스트 이미지를 로컬에서 빌드합니다. 생성된 레인별 GitHub 재실행 명령에는 해당 값이 있을 때 `package_artifact_run_id`, `package_artifact_name`, 준비된 이미지 입력이 포함되므로, 실패한 레인은 실패한 실행의 정확한 패키지와 이미지를 재사용할 수 있습니다.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

예약된 라이브/E2E 워크플로는 매일 전체 릴리스 경로 Docker 제품군을 실행합니다.

## Plugin 시험 릴리스

`Plugin Prerelease`는 더 비용이 큰 제품/패키지 커버리지이므로, `Full Release Validation` 또는 명시적인 운영자가 디스패치하는 별도 워크플로입니다. 일반 풀 리퀘스트, `main` 푸시, 독립형 수동 CI 디스패치에서는 이 제품군을 끕니다. 이 워크플로는 번들 Plugin 테스트를 8개의 확장 워커에 분산합니다. 이러한 확장 샤드 작업은 한 번에 최대 두 개의 Plugin 구성 그룹을 실행하며, 각 그룹마다 Vitest 워커 하나와 더 큰 Node 힙을 사용해 import가 많은 Plugin 배치가 추가 CI 작업을 만들지 않도록 합니다. 릴리스 전용 Docker 시험 릴리스 경로는 대상 Docker 레인을 작은 그룹으로 배치하여 1~3분 작업에 수십 개의 러너를 예약하지 않도록 합니다. 또한 워크플로는 `@openclaw/plugin-inspector`의 정보성 `plugin-inspector-advisory` 아티팩트를 업로드합니다. inspector 결과는 triage 입력이며, 차단 Plugin Prerelease 게이트를 변경하지 않습니다.

## QA Lab

QA Lab에는 메인 스마트 범위 워크플로 외부에 전용 CI 레인이 있습니다. 에이전트형 동등성은 독립형 PR 워크플로가 아니라 광범위한 QA 및 릴리스 하네스 아래에 중첩됩니다. 동등성이 광범위한 검증 실행과 함께 가야 할 때는 `rerun_group=qa-parity`와 함께 `Full Release Validation`을 사용합니다.

- `QA-Lab - All Lanes` 워크플로는 매일 밤 `main`에서 그리고 수동 디스패치에서 실행됩니다. 이 워크플로는 mock parity 레인, 라이브 Matrix 레인, 라이브 Telegram 및 Discord 레인을 병렬 작업으로 팬아웃합니다. 라이브 작업은 `qa-live-shared` 환경을 사용하고, Telegram/Discord는 Convex lease를 사용합니다.

릴리스 검사는 결정적 mock 공급자와 mock 한정 모델(`mock-openai/gpt-5.5` 및 `mock-openai/gpt-5.5-alt`)로 Matrix 및 Telegram 라이브 전송 레인을 실행하여 채널 계약을 라이브 모델 지연 시간과 일반 공급자 Plugin 시작으로부터 격리합니다. 라이브 전송 Gateway는 메모리 검색을 비활성화합니다. QA 동등성이 메모리 동작을 별도로 다루기 때문입니다. 공급자 연결성은 별도의 라이브 모델, 네이티브 공급자, Docker 공급자 제품군에서 다룹니다.

Matrix는 예약 및 릴리스 게이트에 `--profile fast`를 사용하며, 체크아웃된 CLI가 지원할 때만 `--fail-fast`를 추가합니다. CLI 기본값과 수동 워크플로 입력은 `all`로 유지됩니다. 수동 `matrix_profile=all` 디스패치는 항상 전체 Matrix 커버리지를 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩합니다.

`OpenClaw Release Checks`는 릴리스 승인 전에 릴리스 핵심 QA Lab 레인도 실행합니다. 해당 QA 동등성 게이트는 후보 및 기준 팩을 병렬 레인 작업으로 실행한 다음, 최종 동등성 비교를 위해 작은 보고서 작업으로 두 아티팩트를 모두 다운로드합니다.

일반 PR의 경우, 동등성을 필수 상태로 취급하지 말고 범위 지정된 CI/검사 증거를 따릅니다.

## CodeQL

`CodeQL` 워크플로는 전체 저장소 스윕이 아니라 의도적으로 좁은 1차 보안 스캐너입니다. 일일, 수동, 비초안 풀 리퀘스트 가드 실행은 Actions 워크플로 코드와 가장 위험도가 높은 JavaScript/TypeScript 영역을 스캔하며, high/critical `security-severity`로 필터링된 고신뢰 보안 쿼리를 사용합니다.

풀 리퀘스트 가드는 가볍게 유지됩니다. `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `src` 아래 변경에 대해서만 시작하고, 예약된 워크플로와 같은 고신뢰 보안 매트릭스를 실행합니다. Android 및 macOS CodeQL은 PR 기본값에 포함되지 않습니다.

### 보안 범주

| 범주                                              | 표면                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 인증, 시크릿, 샌드박스, cron 및 Gateway 기준선                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 코어 채널 구현 계약과 채널 Plugin 런타임, Gateway, Plugin SDK, 시크릿, 감사 접점                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 코어 SSRF, IP 파싱, 네트워크 가드, 웹 가져오기 및 Plugin SDK SSRF 정책 표면                                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 서버, 프로세스 실행 헬퍼, 아웃바운드 전달 및 에이전트 도구 실행 게이트                                                          |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 설치, 로더, 매니페스트, 레지스트리, 패키지 관리자 설치, 소스 로딩 및 Plugin SDK 패키지 계약 신뢰 표면                        |

### 플랫폼별 보안 샤드

- `CodeQL Android Critical Security` — 예약된 Android 보안 샤드입니다. 워크플로 온전성 검사에서 허용하는 가장 작은 Blacksmith Linux 러너에서 CodeQL용 Android 앱을 수동으로 빌드합니다. `/codeql-critical-security/android` 아래에 업로드합니다.
- `CodeQL macOS Critical Security` — 주간/수동 macOS 보안 샤드입니다. Blacksmith macOS에서 CodeQL용 macOS 앱을 수동으로 빌드하고, 업로드된 SARIF에서 의존성 빌드 결과를 필터링하며, `/codeql-critical-security/macos` 아래에 업로드합니다. 깨끗한 상태에서도 macOS 빌드가 런타임을 지배하므로 일일 기본값 밖에 유지됩니다.

### 중요 품질 범주

`CodeQL Critical Quality`는 대응되는 비보안 샤드입니다. 품질 스캔이 Blacksmith 러너 등록 예산을 쓰지 않도록 GitHub 호스팅 Linux 러너에서 좁고 가치가 높은 표면에 대해 오류 심각도의 비보안 JavaScript/TypeScript 품질 쿼리만 실행합니다. 풀 리퀘스트 가드는 의도적으로 예약 프로필보다 작습니다. 드래프트가 아닌 PR은 에이전트 명령/모델/도구 실행과 응답 디스패치 코드, 설정 스키마/마이그레이션/IO 코드, 인증/시크릿/샌드박스/보안 코드, 코어 채널 및 번들 채널 Plugin 런타임, Gateway 프로토콜/서버 메서드, 메모리 런타임/SDK 접착 코드, MCP/프로세스/아웃바운드 전달, 제공자 런타임/모델 카탈로그, 세션 진단/전달 큐, Plugin 로더, Plugin SDK/패키지 계약 또는 Plugin SDK 응답 런타임 변경에 대해 대응되는 `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime` 샤드만 실행합니다. CodeQL 설정과 품질 워크플로 변경은 PR 품질 샤드 12개를 모두 실행합니다.

수동 디스패치는 다음을 허용합니다.

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

좁은 프로필은 품질 샤드 하나를 격리해서 실행하기 위한 학습/반복 훅입니다.

| 범주                                                    | 표면                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 인증, 시크릿, 샌드박스, cron 및 Gateway 보안 경계 코드                                                                                                         |
| `/codeql-critical-quality/config-boundary`              | 설정 스키마, 마이그레이션, 정규화 및 IO 계약                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 프로토콜 스키마와 서버 메서드 계약                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | 코어 채널 및 번들 채널 Plugin 구현 계약                                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | 명령 실행, 모델/제공자 디스패치, 자동 응답 디스패치와 큐 및 ACP 제어 평면 런타임 계약                                                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 서버와 도구 브리지, 프로세스 감독 헬퍼 및 아웃바운드 전달 계약                                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | 메모리 호스트 SDK, 메모리 런타임 파사드, 메모리 Plugin SDK 별칭, 메모리 런타임 활성화 접착 코드 및 메모리 doctor 명령                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | 응답 큐 내부 구조, 세션 전달 큐, 아웃바운드 세션 바인딩/전달 헬퍼, 진단 이벤트/로그 번들 표면 및 세션 doctor CLI 계약                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 인바운드 응답 디스패치, 응답 페이로드/청킹/런타임 헬퍼, 채널 응답 옵션, 전달 큐 및 세션/스레드 바인딩 헬퍼                                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | 모델 카탈로그 정규화, 제공자 인증과 발견, 제공자 런타임 등록, 제공자 기본값/카탈로그 및 웹/검색/가져오기/임베딩 레지스트리                                   |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 부트스트랩, 로컬 지속성, Gateway 제어 흐름 및 작업 제어 평면 런타임 계약                                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 코어 웹 가져오기/검색, 미디어 IO, 미디어 이해, 이미지 생성 및 미디어 생성 런타임 계약                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 로더, 레지스트리, 공개 표면 및 Plugin SDK 진입점 계약                                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 게시된 패키지 측 Plugin SDK 소스와 Plugin 패키지 계약 헬퍼                                                                                                     |

품질은 보안과 분리되어 있으므로 보안 신호를 흐리지 않고 품질 발견 사항을 예약, 측정, 비활성화 또는 확장할 수 있습니다. Swift, Python 및 번들 Plugin CodeQL 확장은 좁은 프로필이 안정적인 런타임과 신호를 갖춘 뒤에만 범위가 지정되거나 샤딩된 후속 작업으로 다시 추가해야 합니다.

## 유지 관리 워크플로

### Docs Agent

`Docs Agent` 워크플로는 최근 랜딩된 변경 사항과 기존 문서를 맞춰 유지하기 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 봇이 아닌 push CI 실행이 이를 트리거할 수 있고, 수동 디스패치로 직접 실행할 수 있습니다. 워크플로 실행 호출은 `main`이 이미 이동했거나 지난 한 시간 안에 건너뛰지 않은 다른 Docs Agent 실행이 생성된 경우 건너뜁니다. 실행되면 이전에 건너뛰지 않은 Docs Agent 소스 SHA부터 현재 `main`까지의 커밋 범위를 검토하므로, 시간당 한 번의 실행으로 마지막 문서 패스 이후 누적된 모든 main 변경 사항을 다룰 수 있습니다.

### Test Performance Agent

`Test Performance Agent` 워크플로는 느린 테스트를 위한 이벤트 기반 Codex 유지 관리 레인입니다. 순수 일정은 없습니다. `main`에서 성공한 봇이 아닌 push CI 실행이 이를 트리거할 수 있지만, 해당 UTC 날짜에 다른 워크플로 실행 호출이 이미 실행되었거나 실행 중이면 건너뜁니다. 수동 디스패치는 해당 일일 활동 게이트를 우회합니다. 이 레인은 전체 스위트 그룹화 Vitest 성능 보고서를 빌드하고, Codex가 광범위한 리팩터링 대신 커버리지를 보존하는 작은 테스트 성능 수정만 수행하게 한 다음, 전체 스위트 보고서를 다시 실행하고 통과 기준 테스트 수를 줄이는 변경을 거부합니다. 그룹화 보고서는 Linux와 macOS에서 설정별 벽시계 시간과 최대 RSS를 기록하므로, 전후 비교에서 기간 변화 옆에 테스트 메모리 변화도 드러납니다. 기준선에 실패하는 테스트가 있으면 Codex는 명백한 실패만 수정할 수 있으며, 에이전트 이후 전체 스위트 보고서가 통과해야만 커밋할 수 있습니다. 봇 push가 랜딩되기 전에 `main`이 앞서 나가면, 이 레인은 검증된 패치를 리베이스하고 `pnpm check:changed`를 다시 실행한 뒤 push를 재시도합니다. 충돌하는 오래된 패치는 건너뜁니다. Codex 액션이 문서 에이전트와 동일한 drop-sudo 안전 태세를 유지할 수 있도록 GitHub 호스팅 Ubuntu를 사용합니다.

### 병합 후 중복 PR

`Duplicate PRs After Merge` 워크플로는 랜딩 후 중복 정리를 위한 수동 유지관리자 워크플로입니다. 기본값은 dry-run이며 `apply=true`일 때 명시적으로 나열된 PR만 닫습니다. GitHub를 변경하기 전에 랜딩된 PR이 병합되었고 각 중복 항목에 공유된 참조 이슈 또는 겹치는 변경 hunk가 있는지 확인합니다.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 로컬 검사 게이트와 변경 라우팅

로컬 변경 레인 로직은 `scripts/changed-lanes.mjs`에 있으며 `scripts/check-changed.mjs`가 실행합니다. 해당 로컬 검사 게이트는 넓은 CI 플랫폼 범위보다 아키텍처 경계에 대해 더 엄격합니다.

- 코어 프로덕션 변경은 코어 프로덕션 및 코어 테스트 타입체크와 코어 린트/가드를 실행합니다.
- 코어 테스트 전용 변경은 코어 테스트 타입체크와 코어 린트만 실행합니다.
- 확장 프로덕션 변경은 확장 프로덕션 및 확장 테스트 타입체크와 확장 린트를 실행합니다.
- 확장 테스트 전용 변경은 확장 테스트 타입체크와 확장 린트만 실행합니다.
- 공개 Plugin SDK 또는 Plugin 계약 변경은 확장이 해당 코어 계약에 의존하므로 확장 타입체크로 확장됩니다. Vitest 확장 스윕은 명시적인 테스트 작업으로 유지됩니다.
- 릴리스 메타데이터 전용 버전 bump는 대상이 지정된 버전/설정/루트 의존성 검사를 실행합니다.
- 알 수 없는 루트/설정 변경은 안전하게 모든 검사 레인으로 실패 처리됩니다.

로컬 변경 테스트 라우팅은 `scripts/test-projects.test-support.mjs`에 있으며 의도적으로 `check:changed`보다 저렴합니다. 직접 테스트 편집은 해당 테스트 자체를 실행하고, 소스 편집은 명시적 매핑을 우선한 뒤 형제 테스트와 import 그래프 의존 항목을 사용합니다. 공유 그룹룸 전달 설정은 명시적 매핑 중 하나입니다. 그룹에 표시되는 응답 설정, 소스 응답 전달 모드 또는 message-tool 시스템 프롬프트 변경은 코어 응답 테스트와 Discord 및 Slack 전달 회귀 테스트를 거치므로, 공유 기본값 변경은 첫 PR push 전에 실패합니다. 변경이 하니스 전체에 걸쳐 있어 저렴한 매핑 세트를 신뢰할 수 있는 프록시로 보기 어려울 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.

## Testbox 검증

Crabbox는 유지관리자 Linux 증명을 위한 저장소 소유 원격 박스 래퍼입니다. 검사가 로컬 편집 루프에 비해 너무 광범위하거나, CI 동등성이 중요하거나, 증명에 시크릿, Docker, 패키지 레인, 재사용 가능한 박스 또는 원격 로그가 필요할 때 저장소 루트에서 사용하세요. 일반 OpenClaw 백엔드는 `blacksmith-testbox`입니다. 소유 AWS/Hetzner 용량은 Blacksmith 장애, 할당량 문제 또는 명시적인 소유 용량 테스트를 위한 대체 경로입니다.

Crabbox 기반 Blacksmith 실행은 원샷 Testbox를 워밍업, 클레임, 동기화, 실행, 보고, 정리합니다. 내장 동기화 상태 점검은 `pnpm-lock.yaml` 같은 필수 루트 파일이 사라지거나 `git status --short`가 추적된 삭제를 200개 이상 표시하면 빠르게 실패합니다. 의도적인 대규모 삭제 PR의 경우 원격 명령에 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`을 설정하세요.

Crabbox는 동기화 후 출력 없이 5분 넘게 동기화 단계에 머무르는 로컬 Blacksmith CLI 호출도 종료합니다. 해당 보호 장치를 비활성화하려면 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`을 설정하거나, 비정상적으로 큰 로컬 diff에는 더 큰 밀리초 값을 사용하세요.

첫 실행 전, 저장소 루트에서 래퍼를 확인하세요.

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

저장소 래퍼는 `blacksmith-testbox`를 표시하지 않는 오래된 Crabbox 바이너리를 거부합니다. `.crabbox.yaml`에 소유 클라우드 기본값이 있더라도 provider를 명시적으로 전달하세요. Codex worktree 또는 연결된/희소 checkout에서는 pnpm이 Crabbox 시작 전에 의존성을 조정할 수 있으므로 로컬 `pnpm crabbox:run` 스크립트를 피하고, 대신 node 래퍼를 직접 호출하세요.

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 기반 실행에는 Crabbox 0.22.0 이상이 필요합니다. 그래야 래퍼가 현재 Testbox 동기화, 큐, 정리 동작을 얻습니다. 형제 checkout을 사용할 때는 타이밍 또는 증명 작업 전에 무시된 로컬 바이너리를 다시 빌드하세요.

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

최종 JSON 요약을 읽으세요. 유용한 필드는 `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, `totalMs`입니다. 원샷 Blacksmith 기반 Crabbox 실행은 Testbox를 자동으로 중지해야 합니다. 실행이 중단되었거나 정리가 불명확하면 라이브 box를 검사하고 자신이 만든 box만 중지하세요.

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

동일하게 준비된 box에서 의도적으로 여러 명령이 필요할 때만 재사용을 사용하세요.

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 계층이 고장 났지만 Blacksmith 자체는 작동한다면, 직접 Blacksmith를 사용하는 것은 `list`, `status`, 정리 같은 진단에만 한정하세요. 직접 Blacksmith 실행을 maintainer 증명으로 취급하기 전에 Crabbox 경로를 수정하세요.

`blacksmith testbox list --all` 및 `blacksmith testbox status`는 작동하지만 새 워밍업이 몇 분 후에도 IP 또는 Actions 실행 URL 없이 `queued` 상태에 머문다면 Blacksmith provider, 큐, 결제, 조직 제한 압박으로 간주하세요. 생성한 queued id를 중지하고, 더 많은 Testbox를 시작하지 말고, 누군가 Blacksmith 대시보드, 결제, 조직 제한을 확인하는 동안 아래의 소유 Crabbox 용량 경로로 증명을 이동하세요.

Blacksmith가 다운되었거나, 할당량 제한에 걸렸거나, 필요한 환경이 없거나, 소유 용량이 명시적인 목표일 때만 소유 Crabbox 용량으로 에스컬레이션하세요.

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 압박 상황에서는 작업에 48xlarge급 CPU가 정말 필요한 경우가 아니라면 `class=beast`를 피하세요. `beast` 요청은 192 vCPU에서 시작하며 리전별 EC2 Spot 또는 On-Demand Standard 할당량을 가장 쉽게 넘기는 방법입니다. 저장소 소유 `.crabbox.yaml`은 기본값으로 `standard`, 여러 용량 리전, `capacity.hints: true`를 사용하므로, 브로커된 AWS lease는 선택된 리전/마켓, 할당량 압박, Spot fallback, 고압박 class 경고를 출력합니다. 더 무거운 광범위 검사에는 `fast`를 사용하고, standard/fast로 충분하지 않을 때만 `large`를 사용하며, 전체 스위트나 모든 Plugin Docker 매트릭스, 명시적인 릴리스/차단 검증, 고코어 성능 프로파일링 같은 예외적인 CPU 바운드 lane에만 `beast`를 사용하세요. `pnpm check:changed`, 집중 테스트, 문서 전용 작업, 일반 lint/typecheck, 작은 E2E 재현, Blacksmith 장애 triage에는 `beast`를 사용하지 마세요. 용량 진단에는 Spot 마켓 변동성이 신호에 섞이지 않도록 `--market on-demand`를 사용하세요.

`.crabbox.yaml`은 소유 클라우드 lane의 provider, 동기화, GitHub Actions hydration 기본값을 소유합니다. hydrated Actions checkout이 maintainer 로컬 remote 및 object store를 동기화하는 대신 자체 원격 Git 메타데이터를 유지하도록 로컬 `.git`을 제외하며, 절대 전송되어서는 안 되는 로컬 런타임/빌드 artifact도 제외합니다. `.github/workflows/crabbox-hydrate.yml`은 소유 클라우드 `crabbox run --id <cbx_id>` 명령을 위한 checkout, Node/pnpm 설정, `origin/main` fetch, 비밀이 아닌 환경 handoff를 소유합니다.

## 관련

- [설치 개요](/ko/install)
- [개발 채널](/ko/install/development-channels)
