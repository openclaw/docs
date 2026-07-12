---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - 안정판 및 전체 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증거
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-07-12T01:10:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스 검증을 총괄하는 단일 수동 진입점으로, 릴리스 전 증명을 수행합니다. 대부분의 작업은 하위 워크플로에서 진행되므로 한 환경에서 실패하더라도 전체 릴리스를 처음부터 다시 시작하지 않고 재실행할 수 있습니다.

신뢰할 수 있는 워크플로 ref(일반적으로 `main`)에서 실행하고 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 `ref`로 전달합니다.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider`에는 교차 OS 온보딩 및 엔드투엔드 에이전트 턴을 위해 `anthropic` 또는 `minimax`도 사용할 수 있습니다. 재사용 가능한 하위 작업은 `job.workflow_repository`와 `job.workflow_sha`에서 호출된 워크플로 하네스를 확인하며, 입력 `ref`는 테스트할 후보를 선택합니다. 따라서 이전 릴리스 브랜치나 태그를 검증할 때도 현재의 신뢰할 수 있는 검증 로직을 사용할 수 있습니다.

디스패치된 모든 하위 워크플로는 상위 `Full Release Validation` 실행과 동일한 워크플로 SHA를 보고해야 합니다. 상위 워크플로와 하위 워크플로의 디스패치 사이에 `main`이 이동하면 하위 워크플로 자체가 성공하더라도 총괄 워크플로는 안전하게 실패합니다. 변경 불가능한 정확한 커밋을 증명하려면 `pnpm ci:full-release --sha <target-sha>`를 사용합니다. 이 도우미는 현재 신뢰할 수 있는 `origin/main`에 고정된 임시 `release-ci/*` ref를 만들고, 대상 SHA를 후보 `ref`로만 전달하며, 사용 가능한 경우 엄격한 정확한 대상 증거를 재사용하고 검증 후 ref를 삭제합니다. 새 실행을 강제하려면 `-f reuse_evidence=false`를 전달하고, 현재 `origin/main`에서 여전히 도달할 수 있는 이전 워크플로 커밋을 선택하려면 `--workflow-sha <trusted-main-sha>`를 전달합니다. 워크플로 자체는 저장소 ref를 생성하거나 업데이트하지 않습니다.

`release_profile=stable`과 `release_profile=full`은 항상 전체 라이브/Docker 장시간 검증을 실행합니다. `beta` 프로필에서 동일한 장시간 검증 레인을 포함하려면 `run_release_soak=true`를 전달합니다. 안정 버전 게시는 이 장시간 검증과 차단형 제품 성능 증거가 없는 검증 매니페스트를 거부합니다.

Package Acceptance는 일반적으로 확인된 `ref`에서 후보 tarball을 빌드하며, 여기에는 `pnpm ci:full-release`로 디스패치된 전체 SHA 실행도 포함됩니다. 베타 게시 후에는 릴리스 검사, Package Acceptance, 교차 OS, 릴리스 경로 Docker 및 패키지 Telegram에서 게시된 npm 패키지를 재사용하도록 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 전달합니다. Package Acceptance가 의도적으로 다른 패키지를 증명해야 할 때만 `package_acceptance_package_spec`을 사용합니다. Codex Plugin 라이브 패키지 레인도 동일한 상태를 따릅니다. 게시된 `release_package_spec` 값은 `codex_plugin_spec=npm:@openclaw/codex@<version>`을 파생하고, SHA/아티팩트 실행은 선택한 ref에서 `extensions/codex`를 패키징하며, 운영자는 `npm:`, `npm-pack:` 또는 `git:` Plugin 소스에 대해 `codex_plugin_spec`을 직접 설정할 수 있습니다. 이 레인은 해당 Plugin에 필요한 명시적 Codex CLI 설치 승인을 부여한 다음 Codex CLI 사전 점검과 동일 세션의 OpenAI 에이전트 턴을 실행합니다.

## 최상위 단계

`rerun_group=all`의 경우 `Check for reusable validation evidence` 작업이 먼저 실행됩니다. 이 작업은 정확히 동일한 대상 SHA, 릴리스 프로필, 유효한 장시간 검증 설정 및 검증 입력에 대해 가장 최근에 성공한 이전 전체 검증을 찾습니다. 그러한 증거가 있으면 모든 레인을 건너뛰고 총괄 검증기가 변경 불가능한 상위 아티팩트, 하위 실행 및 디스패치 로그를 다시 확인합니다. 이는 동일한 후보의 재실행 복구만을 위한 것이며 SHA 간 재사용을 허용하지 않습니다. 후보가 변경되었다면 해당 변경의 영향을 받는 모든 패키지, 아티팩트, 설치, Docker 또는 공급자 게이트를 재실행합니다. 새로운 전체 실행을 강제하려면 `reuse_evidence=false`를 전달합니다. 증거 재사용은 `main` 또는 워크플로 커밋이 신뢰할 수 있는 `main` 계보에 남아 있는 정식 SHA 고정 `release-ci/*` ref에서만 실행됩니다. 다른 워크플로 ref에서는 선택한 레인을 새로 실행합니다.

또한 `rerun_group=all`의 경우 `Verify Docker runtime image assets` 작업은 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex`를 사용하여 `runtime-assets` Docker 대상을 빌드합니다. 이 작업은 다른 단계와 병렬로 실행되며 총괄 검증기가 강제합니다. 이제 레인은 디스패치 전에 이 작업을 기다리지 않습니다. 더 좁은 `rerun_group`은 이 사전 점검을 건너뜁니다.

| 단계                    | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대상 확인               | **작업:** `Resolve target ref`<br />**하위 워크플로:** 없음<br />**증명:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 확인하고 선택한 입력을 기록합니다.<br />**재실행:** 실패하면 총괄 워크플로를 재실행합니다.                                                                                                                                                                                                                                                                                                            |
| Docker 자산 사전 점검   | **작업:** `Verify Docker runtime image assets`<br />**하위 워크플로:** 없음<br />**증명:** 다른 단계가 디스패치되기 전에 `runtime-assets` Docker 빌드 대상이 여전히 성공하는지 확인합니다. `rerun_group=all`인 경우에만 실행됩니다.<br />**재실행:** `rerun_group=all`로 총괄 워크플로를 재실행합니다.                                                                                                                                                                                                                                         |
| Vitest 및 일반 CI       | **작업:** `Run normal full CI`<br />**하위 워크플로:** `CI`<br />**증명:** 대상 ref에 대해 수동 전체 CI 그래프를 실행합니다. 여기에는 Linux Node 레인, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS, Control UI 국제화 및 총괄 워크플로를 통한 Android가 포함됩니다.<br />**재실행:** `rerun_group=ci`.                                                                                          |
| Plugin 시험판           | **작업:** `Run plugin prerelease validation`<br />**하위 워크플로:** `Plugin Prerelease`<br />**증명:** 릴리스 전용 Plugin 정적 검사, 에이전트 기반 Plugin 커버리지, 전체 Plugin 배치 샤드, Plugin 시험판 Docker 레인 및 호환성 분류를 위한 비차단형 `plugin-inspector-advisory` 아티팩트를 실행합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| 릴리스 검사             | **작업:** `Run release/live/Docker/QA validation`<br />**하위 워크플로:** `OpenClaw Release Checks`<br />**증명:** 설치 스모크 검사, 교차 OS 패키지 검사, Package Acceptance, QA Lab 동등성, 라이브 Matrix 및 라이브 Telegram을 검증합니다. 안정 및 전체 프로필은 전체 라이브/E2E 제품군과 Docker 릴리스 경로 청크도 실행하며, 베타는 `run_release_soak=true`로 이를 포함할 수 있습니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 릴리스 검사 핸들.                                                                |
| 패키지 Telegram         | **작업:** `Run package Telegram E2E`<br />**하위 워크플로:** `NPM Telegram Beta E2E`<br />**증명:** `release_package_spec` 또는 `npm_telegram_package_spec`이 설정된 경우 게시된 패키지에 초점을 맞춘 Telegram E2E를 실행합니다. 전체 후보 검증은 대신 정식 Package Acceptance Telegram E2E를 사용합니다.<br />**재실행:** `release_package_spec` 또는 `npm_telegram_package_spec`과 함께 `rerun_group=npm-telegram`.                                                                                                              |
| 제품 성능               | **작업:** `Run product performance evidence`<br />**하위 워크플로:** `OpenClaw Performance`<br />**증명:** 대상 SHA에 대해 릴리스 프로필 성능 실행(`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`)을 수행합니다. Kova 출력은 워크플로 아티팩트에 유지되며 하위 워크플로는 보고서 게시자가 건너뛰어졌음을 증명해야 합니다. `rerun_group=all` 또는 `rerun_group=performance`인 경우에만 필수이며 차단형입니다. 더 좁은 재실행 그룹에는 필요하지 않습니다.<br />**재실행:** `rerun_group=performance`. |
| 총괄 검증기             | **작업:** `Verify full validation`<br />**하위 워크플로:** 없음<br />**증명:** 기록된 하위 실행 결과를 다시 확인하고 하위 워크플로에서 가장 오래 걸린 작업 표를 추가합니다.<br />**재실행:** 실패한 하위 워크플로를 성공 상태로 재실행한 후 이 작업만 재실행합니다.                                                                                                                                                                                                                                                                 |

총괄 워크플로는 항상 아티팩트 전용 모드로 제품 성능 작업을 디스패치합니다. `OpenClaw Performance`는 예약 실행 또는 `publish_reports=true`를 명시적으로 설정한 수동 디스패치에서만 보고서 게시를 허용합니다. 아티팩트 전용 가드는 성공적으로 완료되어 게시자 작업이 건너뛰어진 상태였음을 증명해야 합니다. 새 증거와 재사용된 증거는 모두 `controls.performanceReportPublication=artifact-only`를 기록합니다. 검증기와 재사용 선택기는 이에 일치하는 정규화된 성능 하위 워크플로 증명이 없는 증거를 거부합니다.

검증기는 정식 매니페스트를 `full-release-validation-<run-id>-<run-attempt>`로 업로드합니다. 증거 도구는 정확한 아티팩트 ID를 다운로드하기 전에 해당 ID, 다이제스트, 생성자 실행 및 시도를 검증합니다. 다운로드되는 ZIP의 크기를 제한하고, REST `sha256:` 다이제스트와 바이트를 대조해 검증하며, 아카이브를 추출하지 않고 허용된 유일한 크기 제한 매니페스트 항목을 스트리밍합니다. 이전 게시 소비자를 위해 안정적인 이름의 별칭이 임시로 유지됩니다. 검증기는 항상 시도 번호가 포함된 아티팩트를 우선합니다. 전환 과정에서는 시도 1의 매니페스트 v2 생성자에 대해서만 안정적인 이름을 허용합니다. 이후 시도 및 매니페스트 v3에서는 해당 레거시 이름을 거부합니다.

`ref=main`과 `rerun_group=all`의 조합, `release/*` ref 및 Tideclaw 알파 ref에서는 동일한 ref와 재실행 그룹을 사용하는 최신 총괄 실행이 이전 실행을 대체합니다. 상위 실행이 취소되면 해당 모니터가 이미 디스패치한 모든 하위 워크플로를 취소합니다. 태그 및 고정 SHA 검증 실행은 서로를 취소하지 않습니다.

## 릴리스 검사 단계

`OpenClaw Release Checks`는 가장 큰 하위 워크플로입니다. 대상을 한 번 확인하고 패키지 또는 Docker 관련 단계에 필요할 경우 공유 `release-package-under-test` 아티팩트를 준비합니다.

| 단계                     | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상              | **작업:** `Resolve target ref`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 ref, 선택적 예상 SHA, 프로필, 재실행 그룹 및 집중 라이브 제품군 필터.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                                                   |
| 패키지 아티팩트          | **작업:** `Prepare release package artifact`<br />**기반 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패키징하거나 확인하고, 이후 패키지 관련 검사에 사용할 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받은 패키지, 크로스 OS 또는 라이브/E2E 그룹.                                                                                                                                                                                                                                                                                                      |
| 설치 스모크              | **작업:** `Run install smoke`<br />**기반 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 프로그램 Docker 테스트, Bun 전역 설치 이미지 제공자 스모크를 포함한 전체 설치 경로.<br />**재실행:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                                          |
| 크로스 OS                | **작업:** `cross_os_release_checks`<br />**기반 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용하여 선택한 제공자 및 모드에 대해 Linux, Windows, macOS에서 신규 설치 및 업그레이드 레인을 실행합니다.<br />**재실행:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                                   |
| 저장소 및 라이브 E2E     | **작업:** `Run repo/live E2E validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 저장소 E2E, 라이브 캐시, OpenAI 웹소켓 스트리밍, 네이티브 라이브 제공자 및 Plugin 샤드, 그리고 `release_profile`로 선택되는 Docker 기반 라이브 모델/백엔드/Gateway 하네스.<br />**실행 조건:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter` 사용.                                                                     |
| Docker 릴리스 경로       | **작업:** `Run Docker release-path validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트를 대상으로 하는 릴리스 경로 Docker 청크.<br />**실행 조건:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                                   |
| 패키지 승인              | **작업:** `Run package acceptance`<br />**기반 워크플로:** `Package Acceptance`<br />**테스트:** 오프라인 Plugin 패키지 픽스처, Plugin 업데이트, 표준 모의 OpenAI Telegram 패키지 E2E, 동일한 tarball을 대상으로 하는 게시 버전 업그레이드 생존 검사. 릴리스를 차단하는 검사는 기본적으로 최근 게시된 기준 버전을 사용하며, 소크 검사(`run_release_soak=true`)는 보고된 문제의 업그레이드 픽스처를 대상으로 최근 안정 npm 릴리스 4개와 고정된 과거 버전 3개(`2026.4.23`, `2026.5.2`, `2026.4.15`)까지 확장합니다.<br />**재실행:** `rerun_group=package`. |
| 성숙도 스코어카드        | **작업:** `Render maturity scorecard release docs`<br />**기반 워크플로:** `maturity-scorecard.yml`<br />**테스트:** 대상 ref를 기준으로 참고용 성숙도 스코어카드 문서를 렌더링합니다. `run_maturity_scorecard=true`가 전달된 경우에만 실행됩니다.<br />**재실행:** `run_maturity_scorecard=true`와 함께 `rerun_group=qa`.                                                                                                                                                                                                                                                              |
| QA 동등성                | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트형 동등성 팩을 실행한 다음 동등성 보고서를 생성합니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                |
| QA 런타임 동등성         | **작업:** `Run QA Lab runtime parity lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 표준 티어와 `run_release_soak=true`일 때의 소크 티어를 포함하는 `openclaw`/`codex` 런타임 쌍 에이전트형 동등성 레인(`pnpm openclaw qa suite --runtime-pair openclaw,codex`). 참고: 개별 실패는 릴리스 검사 검증기를 차단하지 않습니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                       |
| QA 런타임 도구 커버리지 | **작업:** `Enforce QA Lab runtime tool coverage`<br />**기반 워크플로:** 직접 작업<br />**테스트:** QA 런타임 동등성 레인의 출력을 사용하여 표준 런타임 동등성 티어에서 `openclaw`과 `codex` 간의 동적 도구 드리프트를 검사합니다(`pnpm openclaw qa coverage --tools`). 차단: 이 작업은 참고용으로 재정의할 수 없습니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                              |
| QA 라이브 Matrix         | **작업:** `Run QA Lab live Matrix lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경의 빠른 라이브 Matrix QA 프로필.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                            |
| QA 라이브 Telegram       | **작업:** `Run QA Lab live Telegram lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                          |
| 릴리스 검증기            | **작업:** `Verify release checks`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 재실행 그룹에 필요한 릴리스 검사 작업.<br />**재실행:** 집중 하위 작업이 통과한 후 재실행합니다.                                                                                                                                                                                                                                                                                                                                                                                                |

## Docker 릴리스 경로 청크

Docker 릴리스 경로 단계는 `live_suite_filter`가 비어 있을 때 다음 청크를
실행합니다.

| 청크                                                            | 커버리지                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `core`                                                          | 핵심 Docker 릴리스 경로 스모크 레인.                                                                                           |
| `package-update-openai`                                         | OpenAI 패키지 설치/업데이트 동작, Codex 주문형 설치, Codex Plugin 라이브 턴 및 Chat Completions 도구 호출.                     |
| `package-update-anthropic`                                      | Anthropic 패키지 설치 및 업데이트 동작.                                                                                        |
| `package-update-core`                                           | 제공자 중립적 패키지 및 업데이트 동작.                                                                                         |
| `plugins-runtime-plugins`                                       | Plugin 동작을 실행하는 Plugin 런타임 레인.                                                                                     |
| `plugins-runtime-services`                                      | 서비스 기반 및 라이브 Plugin 런타임 레인.                                                                                      |
| `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지 | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.                                                                        |
| `openwebui`                                                     | 요청 시 전용 대용량 디스크 러너에서 격리하여 실행하는 OpenWebUI 호환성 스모크.                                                 |

Docker 레인 하나만 실패한 경우 재사용 가능한 라이브/E2E 워크플로에서
대상 지정 `docker_lanes=<lane[,lane]>`을 사용합니다. 릴리스 아티팩트에는 가능한 경우
패키지 아티팩트 및 이미지 재사용 입력을 포함한 레인별 재실행 명령이 포함됩니다.

## 릴리스 프로필

`release_profile`은 주로 릴리스 검사 내의 라이브/프로바이더 범위를 제어합니다.
일반 전체 CI, Plugin 시험판, 설치 스모크, 패키지
승인 또는 QA Lab을 제거하지는 않습니다. stable 및 full 프로필은 항상 저장소/라이브
E2E와 Docker 릴리스 경로 장시간 실행 검증을 빠짐없이 수행합니다. beta 프로필은
`run_release_soak=true`로 이를 활성화할 수 있습니다. 패키지 승인은 모든 전체 후보에 대해 표준 패키지
Telegram E2E를 제공하므로, 상위 워크플로는 해당
라이브 폴러를 중복 실행하지 않습니다.

| 프로필   | 용도                              | 포함되는 라이브/프로바이더 범위                                                                                                                                                                             |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 가장 빠른 릴리스 필수 스모크.     | OpenAI/코어 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 Gateway 코어, 네이티브 OpenAI Gateway 프로필, 네이티브 OpenAI Plugin, Docker 라이브 Gateway OpenAI.                                            |
| `stable` | 기본 릴리스 승인 프로필.          | `beta`에 Anthropic 스모크, Google, MiniMax, 백엔드, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI 백엔드, Docker ACP 바인딩, Docker Codex 하네스, Docker 하위 에이전트 알림 및 OpenCode Go 스모크 샤드를 추가합니다. |
| `full`   | 광범위한 참고용 점검.             | `stable`에 참고용 프로바이더, Plugin 라이브 샤드 및 미디어 라이브 샤드를 추가합니다.                                                                                                                         |

## full 전용 추가 항목

다음 스위트는 `stable`에서는 건너뛰고 `full`에만 포함됩니다.

| 영역                              | full 전용 범위                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker 라이브 모델                | OpenCode Go, OpenRouter, xAI, Z.ai 및 Fireworks.                                                                               |
| Docker 라이브 Gateway             | 참고용 프로바이더를 DeepSeek/Fireworks, OpenCode Go/OpenRouter 및 xAI/Z.ai 샤드로 분할합니다.                                 |
| 네이티브 Gateway 프로바이더 프로필 | 전체 Anthropic Opus 및 Sonnet/Haiku 샤드, Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI 및 Z.ai.           |
| 네이티브 Plugin 라이브 샤드       | Plugin A-K, L-N, 기타 O-Z, Moonshot 및 xAI.                                                                                    |
| 네이티브 미디어 라이브 샤드       | 오디오, Google 음악, MiniMax 음악 및 비디오 그룹 A-D.                                                                         |

`stable`에는 `native-live-src-gateway-profiles-anthropic-smoke`와
`native-live-src-gateway-profiles-opencode-go-smoke`가 포함되며, `full`에서는 대신 더 광범위한
Anthropic 및 OpenCode Go 모델 샤드를 사용합니다. 집중 재실행에는 여전히 집계
`native-live-src-gateway-profiles-anthropic` 또는
`native-live-src-gateway-profiles-opencode-go` 핸들을 사용할 수 있습니다.

## 집중 재실행

관련 없는 릴리스 실행 환경의 반복 실행을 피하려면 `rerun_group`을 사용합니다.

| 핸들                | 범위                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `all`               | 전체 릴리스 검증의 모든 단계.                                                                      |
| `ci`                | 수동 전체 CI 하위 워크플로만.                                                                      |
| `plugin-prerelease` | Plugin 시험판 하위 워크플로만.                                                                     |
| `release-checks`    | 모든 OpenClaw 릴리스 검사 단계.                                                                    |
| `install-smoke`     | 설치 스모크부터 릴리스 검사까지.                                                                   |
| `cross-os`          | 운영체제 간 릴리스 검사.                                                                           |
| `live-e2e`          | 저장소/라이브 E2E 및 Docker 릴리스 경로 검증.                                                     |
| `package`           | 패키지 승인.                                                                                        |
| `qa`                | QA 동등성 및 QA 라이브 실행 경로.                                                                  |
| `qa-parity`         | QA 동등성 실행 경로 및 보고서만.                                                                   |
| `qa-live`           | QA 라이브 Matrix/Telegram 및 활성화된 경우 게이트가 적용되는 Discord, WhatsApp, Slack 실행 경로. |
| `npm-telegram`      | 게시된 패키지의 Telegram E2E. `release_package_spec` 또는 `npm_telegram_package_spec`이 필요합니다. |
| `performance`       | 제품 성능 증거만.                                                                                  |

라이브 스위트 하나가 실패한 경우 `rerun_group=live-e2e`와 함께 `live_suite_filter`를 사용합니다.
유효한 필터 ID는 재사용 가능한 라이브/E2E 워크플로에 정의되어 있으며, 다음을 포함합니다.
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` 및
`live-codex-harness-docker`.

`live-gateway-advisory-docker` 핸들은 세 프로바이더 샤드를 위한 집계 재실행 핸들이므로,
여전히 모든 참고용 Docker Gateway 작업으로 분산 실행됩니다.

운영체제 간 실행 경로 하나가 실패한 경우 `rerun_group=cross-os`와 함께 `cross_os_suite_filter`를
사용합니다. 필터는 운영체제 ID, 스위트 ID 또는 운영체제/스위트 쌍을 허용합니다. 예:
`windows/packaged-upgrade`, `windows` 또는 `packaged-fresh`. 운영체제 간
요약에는 패키지 업그레이드 실행 경로의 단계별 시간이 포함되며, 장시간 실행되는
명령은 Heartbeat 줄을 출력하므로 작업
시간 초과 전에 멈춘 업데이트를 확인할 수 있습니다.

QA 릴리스 검사 실패는 일반 릴리스 검증을 차단합니다. QA 런타임 도구
범위 검사(표준 티어의 `openclaw`과 `codex` 간 동적 도구 불일치)도
기반 QA 런타임 동등성 실행 경로가 참고용이더라도 릴리스 검사 검증기를
차단합니다. Tideclaw 알파 실행에서는 패키지 안전성과 관련 없는 릴리스 검사 실행 경로를 여전히
참고용으로 처리할 수 있습니다.
`release_profile=beta`에서는 `Run repo/live E2E validation` 라이브 프로바이더 스위트가
참고용입니다. 서드 파티 모델 배포는 릴리스 도중에도 변경될 수 있으므로,
beta에서는 실패를 경고로 표시하고 stable 및 full 프로필에서는 계속
차단 상태로 유지합니다.
`live_suite_filter`가 Discord, WhatsApp 또는 Slack 같은 게이트 적용 QA 라이브 실행 경로를 명시적으로 요청하는 경우,
일치하는 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 저장소
변수를 활성화해야 합니다. 그렇지 않으면 해당 실행 경로를 조용히 건너뛰는 대신 입력 캡처가 실패합니다.
새로운 QA 증거가 필요하면 `rerun_group=qa`, `qa-parity` 또는 `qa-live`를
재실행합니다.

## 보관할 증거

릴리스 수준 인덱스로 `Full Release Validation` 요약을 보관합니다. 여기에는
하위 실행 ID 링크와 가장 느린 작업 표가 포함됩니다. 실패 시에는 먼저 하위
워크플로를 살펴본 후 위에서 일치하는 가장 작은 핸들을 재실행합니다.

유용한 아티팩트:

- `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- 패키지 승인의 `package-under-test` 및 Docker 승인 아티팩트
- 각 운영체제 및 스위트의 운영체제 간 릴리스 검사 아티팩트
- QA 동등성, 런타임 동등성, Matrix 및 Telegram 아티팩트

## 워크플로 파일

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
