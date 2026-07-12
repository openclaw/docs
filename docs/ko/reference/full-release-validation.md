---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - 안정 릴리스와 전체 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증거
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-07-12T15:43:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스 검증을 총괄하는 단일 수동 진입점으로, 릴리스 전 증명을 수행합니다. 대부분의 작업은 하위 워크플로에서 진행되므로 실패한 박스만 전체 릴리스를 다시 시작하지 않고 재실행할 수 있습니다.

신뢰할 수 있는 워크플로 ref(일반적으로 `main`)에서 실행하고 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 `ref`로 전달하십시오.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider`에는 크로스 OS 온보딩과 엔드투엔드 에이전트 턴을 위해 `anthropic` 또는 `minimax`도 사용할 수 있습니다. 재사용 가능한 하위 작업은 `job.workflow_repository`와 `job.workflow_sha`에서 호출된 워크플로 하네스를 확인하고, 입력 `ref`는 테스트할 후보를 선택합니다. 이를 통해 이전 릴리스 브랜치나 태그를 검증할 때도 현재의 신뢰할 수 있는 검증 로직을 사용할 수 있습니다.

디스패치된 모든 하위 워크플로는 상위 `Full Release Validation` 실행과 동일한 워크플로 SHA를 보고해야 합니다. 상위 워크플로와 하위 워크플로의 디스패치 사이에 `main`이 이동하면 하위 워크플로 자체가 성공하더라도 총괄 워크플로는 실패로 종료됩니다. 변경 불가능한 정확한 커밋을 증명하려면 `pnpm ci:full-release --sha <target-sha>`를 사용하십시오. 이 도우미는 현재 신뢰할 수 있는 `origin/main`에 고정된 임시 `release-ci/*` ref를 생성하고, 대상 SHA는 후보 `ref`로만 전달하며, 사용할 수 있는 경우 엄격한 정확한 대상 증거를 재사용하고, 검증 후 ref를 삭제합니다. 새 실행을 강제하려면 `-f reuse_evidence=false`를 전달하고, 현재 `origin/main`에서 여전히 접근할 수 있는 이전 워크플로 커밋을 선택하려면 `--workflow-sha <trusted-main-sha>`를 전달하십시오. 워크플로 자체는 저장소 ref를 생성하거나 업데이트하지 않습니다.

`release_profile=stable`과 `release_profile=full`은 항상 전체 라이브/Docker 장시간 테스트를 실행합니다. `beta` 프로필에 동일한 장시간 테스트 레인을 포함하려면 `run_release_soak=true`를 전달하십시오. 안정 버전 게시는 이 장시간 테스트와 필수 제품 성능 증거가 없는 검증 매니페스트를 거부합니다.

Package Acceptance는 일반적으로 전체 SHA 실행을 포함해 확인된 `ref`에서 후보 tarball을 빌드하며, 이러한 실행은 `pnpm ci:full-release`로 디스패치됩니다. 베타 게시 후 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 전달하면 릴리스 검사, Package Acceptance, 크로스 OS, 릴리스 경로 Docker 및 패키지 Telegram에서 게시된 npm 패키지를 재사용할 수 있습니다. Package Acceptance가 의도적으로 다른 패키지를 증명해야 할 때만 `package_acceptance_package_spec`을 사용하십시오. Codex Plugin 라이브 패키지 레인도 동일한 상태를 따릅니다. 게시된 `release_package_spec` 값에서는 `codex_plugin_spec=npm:@openclaw/codex@<version>`을 파생하고, SHA/아티팩트 실행에서는 선택한 ref의 `extensions/codex`를 패키징하며, 운영자는 `npm:`, `npm-pack:` 또는 `git:` Plugin 소스에 대해 `codex_plugin_spec`을 직접 설정할 수 있습니다. 이 레인은 해당 Plugin에 필요한 명시적인 Codex CLI 설치 승인을 부여한 다음, Codex CLI 사전 점검과 동일 세션의 OpenAI 에이전트 턴을 실행합니다.

## 최상위 단계

`rerun_group=all`인 경우 `Check for reusable validation evidence` 작업이 먼저 실행됩니다. 정확히 동일한 대상 SHA, 릴리스 프로필, 실질적인 장시간 테스트 설정 및 검증 입력에 대해 가장 최근에 성공한 이전 전체 검증을 찾습니다. 이러한 증거가 존재하면 모든 레인을 건너뛰고 총괄 검증기가 변경 불가능한 상위 아티팩트, 하위 실행 및 디스패치 로그를 다시 검사합니다. 이는 동일 후보의 재실행 복구에만 적용되며 SHA가 다른 증거의 재사용을 허용하지 않습니다. 후보가 변경된 경우 해당 변경의 영향을 받는 모든 패키지, 아티팩트, 설치, Docker 또는 제공자 게이트를 다시 실행하십시오. 새로운 전체 실행을 강제하려면 `reuse_evidence=false`를 전달하십시오. 증거 재사용은 `main` 또는 워크플로 커밋이 신뢰할 수 있는 `main` 계보에 남아 있는 표준 SHA 고정 `release-ci/*` ref에서만 실행됩니다. 다른 워크플로 ref는 선택한 레인을 새로 실행합니다.

또한 `rerun_group=all`인 경우 `Verify Docker runtime image assets` 작업이 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex`를 사용하여 `runtime-assets` Docker 대상을 빌드합니다. 이 작업은 다른 단계와 병렬로 실행되고 총괄 검증기가 적용하며, 레인은 디스패치 전에 더 이상 이 작업을 기다리지 않습니다. 더 좁은 `rerun_group`은 이 사전 점검을 건너뜁니다.

| 단계                    | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대상 확인               | **작업:** `Resolve target ref`<br />**하위 워크플로:** 없음<br />**증명:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 확인하고 선택한 입력을 기록합니다.<br />**재실행:** 이 작업이 실패하면 총괄 워크플로를 재실행하십시오.                                                                                                                                                                                                                                                                                                    |
| Docker 자산 사전 점검   | **작업:** `Verify Docker runtime image assets`<br />**하위 워크플로:** 없음<br />**증명:** 다른 단계를 디스패치하기 전에 `runtime-assets` Docker 빌드 대상이 여전히 성공하는지 확인합니다. `rerun_group=all`일 때만 실행됩니다.<br />**재실행:** `rerun_group=all`로 총괄 워크플로를 재실행하십시오.                                                                                                                                                                                                                              |
| Vitest 및 일반 CI       | **작업:** `Run normal full CI`<br />**하위 워크플로:** `CI`<br />**증명:** 총괄 워크플로를 통해 Linux Node 레인, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS, Control UI i18n 및 Android를 포함하여 대상 ref에 대한 수동 전체 CI 그래프를 실행합니다.<br />**재실행:** `rerun_group=ci`.                                                                                                     |
| Plugin 프리릴리스       | **작업:** `Run plugin prerelease validation`<br />**하위 워크플로:** `Plugin Prerelease`<br />**증명:** 릴리스 전용 Plugin 정적 검사, 에이전트 기반 Plugin 커버리지, 전체 Plugin 배치 샤드, Plugin 프리릴리스 Docker 레인 및 호환성 분류를 위한 비필수 `plugin-inspector-advisory` 아티팩트를 실행합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                                                                                                       |
| 릴리스 검사             | **작업:** `Run release/live/Docker/QA validation`<br />**하위 워크플로:** `OpenClaw Release Checks`<br />**증명:** 설치 스모크 테스트, 크로스 OS 패키지 검사, Package Acceptance, QA Lab 동등성, 라이브 Matrix 및 라이브 Telegram을 실행합니다. 안정 및 전체 프로필은 포괄적인 라이브/E2E 제품군과 Docker 릴리스 경로 청크도 실행하며, 베타는 `run_release_soak=true`를 사용하여 포함할 수 있습니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 릴리스 검사 핸들.                                                   |
| 패키지 Telegram         | **작업:** `Run package Telegram E2E`<br />**하위 워크플로:** `NPM Telegram Beta E2E`<br />**증명:** `release_package_spec` 또는 `npm_telegram_package_spec`이 설정된 경우 게시된 패키지에 초점을 맞춘 Telegram E2E를 실행합니다. 전체 후보 검증은 대신 표준 Package Acceptance Telegram E2E를 사용합니다.<br />**재실행:** `release_package_spec` 또는 `npm_telegram_package_spec`과 함께 `rerun_group=npm-telegram`.                                                                                                       |
| 제품 성능               | **작업:** `Run product performance evidence`<br />**하위 워크플로:** `OpenClaw Performance`<br />**증명:** 대상 SHA에 대해 릴리스 프로필 성능 실행(`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`)을 수행합니다. Kova 출력은 워크플로 아티팩트에 유지되며, 하위 워크플로는 보고서 게시자가 건너뛰어졌음을 증명해야 합니다. `rerun_group=all` 또는 `rerun_group=performance`에만 필수이며 더 좁은 재실행 그룹에는 필요하지 않습니다.<br />**재실행:** `rerun_group=performance`. |
| 총괄 검증기             | **작업:** `Verify full validation`<br />**하위 워크플로:** 없음<br />**증명:** 기록된 하위 실행 결과를 다시 검사하고 하위 워크플로에서 가장 오래 걸린 작업의 표를 추가합니다.<br />**재실행:** 실패한 하위 워크플로를 성공 상태로 재실행한 후 이 작업만 다시 실행하십시오.                                                                                                                                                                                                                                                            |

총괄 워크플로는 항상 제품 성능을 아티팩트 전용 모드로 디스패치합니다. `OpenClaw Performance`는 예약된 실행 또는 `publish_reports=true`를 명시적으로 설정한 수동 디스패치에서만 보고서 게시를 허용합니다. 아티팩트 전용 가드는 성공적으로 완료되어 게시자 작업이 건너뛰어진 상태로 유지되었음을 증명해야 합니다. 새 증거와 재사용된 증거 모두 `controls.performanceReportPublication=artifact-only`를 기록합니다. 검증기와 재사용 선택기는 이에 부합하는 정규화된 성능 하위 워크플로 증명이 없는 증거를 거부합니다.

검증기는 표준 매니페스트를 `full-release-validation-<run-id>-<run-attempt>`으로 업로드합니다. 증거 도구는 해당 아티팩트 ID, 다이제스트, 생성자 실행 및 시도를 검증한 후 정확히 해당 아티팩트 ID를 다운로드합니다. 다운로드하는 ZIP 크기를 제한하고, REST `sha256:` 다이제스트와 바이트를 대조하여 검증하며, 아카이브를 추출하지 않고 허용된 유일한 크기 제한 매니페스트 항목을 스트리밍합니다. 이전 게시 소비자를 위해 안정적인 이름의 별칭이 일시적으로 유지됩니다. 검증기는 항상 시도 번호가 포함된 아티팩트를 우선합니다. 전환 조치로, 시도 1의 매니페스트 v2 생성자에 대해서만 안정적인 이름을 허용합니다. 이후 시도와 매니페스트 v3에서는 해당 레거시 이름을 거부합니다.

`rerun_group=all`인 `ref=main`, `release/*` ref 및 Tideclaw 알파 ref에서는 동일한 ref와 재실행 그룹을 가진 최신 총괄 실행이 이전 실행을 대체합니다. 상위 워크플로가 취소되면 해당 모니터가 이미 디스패치한 모든 하위 워크플로를 취소합니다. 태그 및 고정 SHA 검증 실행은 서로를 취소하지 않습니다.

## 릴리스 검사 단계

`OpenClaw Release Checks`는 가장 큰 하위 워크플로입니다. 대상을 한 번 확인하고 패키지 또는 Docker 관련 단계에서 필요할 때 공유 `release-package-under-test` 아티팩트를 준비합니다.

| 단계                     | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상              | **작업:** `Resolve target ref`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 ref, 선택적 예상 SHA, 프로필, 재실행 그룹 및 집중 라이브 스위트 필터.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                                                   |
| 패키지 아티팩트          | **작업:** `Prepare release package artifact`<br />**기반 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패킹하거나 확인하고, 후속 패키지 관련 검사에 사용할 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받은 패키지, 크로스 OS 또는 라이브/E2E 그룹.                                                                                                                                                                                                                                                                                                         |
| 설치 스모크              | **작업:** `Run install smoke`<br />**기반 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 프로그램 Docker 테스트, Bun 전역 설치 이미지 제공자 스모크를 포함한 전체 설치 경로.<br />**재실행:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                             |
| 크로스 OS                | **작업:** `cross_os_release_checks`<br />**기반 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용하여 선택한 제공자 및 모드에 대해 Linux, Windows, macOS에서 신규 설치 및 업그레이드 레인을 실행합니다.<br />**재실행:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                                 |
| 저장소 및 라이브 E2E     | **작업:** `Run repo/live E2E validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 저장소 E2E, 라이브 캐시, OpenAI 웹소켓 스트리밍, 네이티브 라이브 제공자 및 Plugin 샤드, 그리고 `release_profile`로 선택된 Docker 기반 라이브 모델/백엔드/Gateway 하네스.<br />**실행 조건:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter`를 함께 사용합니다.                                                                            |
| Docker 릴리스 경로       | **작업:** `Run Docker release-path validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트를 대상으로 하는 릴리스 경로 Docker 청크.<br />**실행 조건:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                             |
| 패키지 승인              | **작업:** `Run package acceptance`<br />**기반 워크플로:** `Package Acceptance`<br />**테스트:** 오프라인 Plugin 패키지 픽스처, Plugin 업데이트, 표준 모의 OpenAI Telegram 패키지 E2E 및 동일한 tarball을 대상으로 한 게시 버전 업그레이드 생존 검사를 수행합니다. 차단 릴리스 검사에서는 기본적으로 최근 게시된 기준 버전을 사용하며, 소크 검사(`run_release_soak=true`)에서는 보고된 문제의 업그레이드 픽스처를 대상으로 최근 4개의 안정 npm 릴리스와 고정된 과거 버전 3개(`2026.4.23`, `2026.5.2`, `2026.4.15`)까지 확장합니다.<br />**재실행:** `rerun_group=package`. |
| 성숙도 스코어카드        | **작업:** `Render maturity scorecard release docs`<br />**기반 워크플로:** `maturity-scorecard.yml`<br />**테스트:** 대상 ref를 기준으로 참고용 성숙도 스코어카드 문서를 렌더링합니다. `run_maturity_scorecard=true`가 전달된 경우에만 실행됩니다.<br />**재실행:** `run_maturity_scorecard=true`와 함께 `rerun_group=qa`.                                                                                                                                                                                                                                                         |
| QA 동등성                | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트 동등성 팩을 실행한 다음 동등성 보고서를 생성합니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                              |
| QA 런타임 동등성         | **작업:** `Run QA Lab runtime parity lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 표준 티어와 `run_release_soak=true`일 때의 소크 티어를 포함하는 `openclaw`/`codex` 런타임 쌍 에이전트 동등성 레인(`pnpm openclaw qa suite --runtime-pair openclaw,codex`). 참고: 개별 실패는 릴리스 검사 검증기를 차단하지 않습니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                   |
| QA 런타임 도구 커버리지 | **작업:** `Enforce QA Lab runtime tool coverage`<br />**기반 워크플로:** 직접 작업<br />**테스트:** QA 런타임 동등성 레인의 출력을 사용하여 표준 런타임 동등성 티어(`pnpm openclaw qa coverage --tools`)에서 `openclaw`과 `codex` 간의 동적 도구 드리프트를 검사합니다. 차단: 이 작업은 참고용으로 재정의할 수 없습니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                                    |
| QA 라이브 Matrix         | **작업:** `Run QA Lab live Matrix lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경의 빠른 라이브 Matrix QA 프로필.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                               |
| QA 라이브 Telegram       | **작업:** `Run QA Lab live Telegram lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                          |
| 릴리스 검증기            | **작업:** `Verify release checks`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 재실행 그룹에 필요한 릴리스 검사 작업.<br />**재실행:** 집중 하위 작업이 통과한 후 재실행합니다.                                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 릴리스 경로 청크

Docker 릴리스 경로 단계는 `live_suite_filter`가 비어 있을 때 다음 청크를
실행합니다.

| 청크                                                            | 커버리지                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `core`                                                          | 코어 Docker 릴리스 경로 스모크 레인.                                                                                           |
| `package-update-openai`                                         | OpenAI 패키지 설치/업데이트 동작, Codex 온디맨드 설치, Codex Plugin 라이브 턴 및 Chat Completions 도구 호출.                    |
| `package-update-anthropic`                                      | Anthropic 패키지 설치 및 업데이트 동작.                                                                                        |
| `package-update-core`                                           | 제공자 중립적인 패키지 및 업데이트 동작.                                                                                       |
| `plugins-runtime-plugins`                                       | Plugin 동작을 실행하는 Plugin 런타임 레인.                                                                                     |
| `plugins-runtime-services`                                      | 서비스 기반 및 라이브 Plugin 런타임 레인.                                                                                      |
| `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지 | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.                                                                        |
| `openwebui`                                                     | 요청 시 전용 대용량 디스크 러너에서 격리되어 실행되는 OpenWebUI 호환성 스모크.                                                 |

Docker 레인 하나만 실패한 경우 재사용 가능한 라이브/E2E 워크플로에서
대상 `docker_lanes=<lane[,lane]>`를 사용합니다. 릴리스 아티팩트에는 가능한 경우
패키지 아티팩트 및 이미지 재사용 입력이 포함된 레인별 재실행 명령이 포함됩니다.

## 릴리스 프로필

`release_profile`은 주로 릴리스 검사 내의 라이브/제공자 범위를 제어합니다.
일반적인 전체 CI, Plugin 사전 릴리스, 설치 스모크, 패키지
승인 또는 QA Lab은 제외하지 않습니다. 안정 및 전체 프로필은 항상 철저한 저장소/라이브
E2E 및 Docker 릴리스 경로 장시간 실행 범위를 수행합니다. 베타 프로필은
`run_release_soak=true`로 이를 선택할 수 있습니다. 패키지 승인은 모든 전체 후보에
표준 패키지 Telegram E2E를 제공하므로, 포괄 워크플로는 해당
라이브 폴러를 중복 실행하지 않습니다.

| 프로필   | 용도                              | 포함되는 라이브/제공자 범위                                                                                                                                                                                |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 가장 빠른 릴리스 필수 스모크입니다. | OpenAI/코어 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 Gateway 코어, 네이티브 OpenAI Gateway 프로필, 네이티브 OpenAI Plugin 및 Docker 라이브 Gateway OpenAI입니다.                                   |
| `stable` | 기본 릴리스 승인 프로필입니다.      | `beta`에 Anthropic 스모크, Google, MiniMax, 백엔드, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI 백엔드, Docker ACP 바인드, Docker Codex 하네스, Docker 하위 에이전트 알림 및 OpenCode Go 스모크 샤드를 추가합니다. |
| `full`   | 광범위한 권고 검사를 수행합니다.     | `stable`에 권고 제공자, Plugin 라이브 샤드 및 미디어 라이브 샤드를 추가합니다.                                                                                                                             |

## 전체 프로필에만 추가되는 항목

다음 제품군은 `stable`에서 건너뛰고 `full`에 포함됩니다.

| 영역                             | 전체 프로필 전용 범위                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker 라이브 모델               | OpenCode Go, OpenRouter, xAI, Z.ai 및 Fireworks입니다.                                                                         |
| Docker 라이브 Gateway            | 권고 제공자를 DeepSeek/Fireworks, OpenCode Go/OpenRouter 및 xAI/Z.ai 샤드로 분할합니다.                                        |
| 네이티브 Gateway 제공자 프로필   | 전체 Anthropic Opus 및 Sonnet/Haiku 샤드, Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI 및 Z.ai입니다.       |
| 네이티브 Plugin 라이브 샤드      | Plugin A-K, L-N, O-Z 기타, Moonshot 및 xAI입니다.                                                                              |
| 네이티브 미디어 라이브 샤드      | 오디오, Google 음악, MiniMax 음악 및 비디오 그룹 A-D입니다.                                                                    |

`stable`에는 `native-live-src-gateway-profiles-anthropic-smoke`와
`native-live-src-gateway-profiles-opencode-go-smoke`가 포함되며, `full`은 대신 더 광범위한
Anthropic 및 OpenCode Go 모델 샤드를 사용합니다. 집중 재실행에서는 계속해서
통합 `native-live-src-gateway-profiles-anthropic` 또는
`native-live-src-gateway-profiles-opencode-go` 핸들을 사용할 수 있습니다.

## 집중 재실행

관련 없는 릴리스 실행 환경을 반복하지 않으려면 `rerun_group`을 사용하십시오.

| 핸들                | 범위                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 모든 전체 릴리스 검증 단계입니다.                                                              |
| `ci`                | 수동 전체 CI 하위 워크플로만 해당합니다.                                                       |
| `plugin-prerelease` | Plugin 사전 릴리스 하위 워크플로만 해당합니다.                                                 |
| `release-checks`    | 모든 OpenClaw 릴리스 검사 단계입니다.                                                          |
| `install-smoke`     | 릴리스 검사까지의 설치 스모크입니다.                                                           |
| `cross-os`          | 운영체제 간 릴리스 검사입니다.                                                                 |
| `live-e2e`          | 저장소/라이브 E2E 및 Docker 릴리스 경로 검증입니다.                                            |
| `package`           | 패키지 승인입니다.                                                                             |
| `qa`                | QA 동등성 및 QA 라이브 레인입니다.                                                             |
| `qa-parity`         | QA 동등성 레인 및 보고서만 해당합니다.                                                         |
| `qa-live`           | QA 라이브 Matrix/Telegram 및 활성화된 경우 제한된 Discord, WhatsApp, Slack 레인입니다.         |
| `npm-telegram`      | 게시된 패키지의 Telegram E2E이며, `release_package_spec` 또는 `npm_telegram_package_spec`이 필요합니다. |
| `performance`       | 제품 성능 증거만 해당합니다.                                                                   |

라이브 제품군 하나가 실패한 경우 `rerun_group=live-e2e`와 함께
`live_suite_filter`를 사용하십시오. 유효한 필터 ID는 재사용 가능한 라이브/E2E 워크플로에
정의되어 있으며, 여기에는 `docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` 및
`live-codex-harness-docker`가 포함됩니다.

`live-gateway-advisory-docker` 핸들은 세 제공자 샤드의 통합 재실행 핸들이므로,
여전히 모든 권고 Docker Gateway 작업으로 확장됩니다.

운영체제 간 레인 하나가 실패한 경우 `rerun_group=cross-os`와 함께
`cross_os_suite_filter`를 사용하십시오. 필터는 운영체제 ID, 제품군 ID 또는 운영체제/제품군 쌍을
허용합니다. 예를 들면 `windows/packaged-upgrade`, `windows` 또는 `packaged-fresh`입니다. 운영체제 간
요약에는 패키지 업그레이드 레인의 단계별 타이밍이 포함되며, 장시간 실행되는
명령은 Heartbeat 줄을 출력하므로 작업
시간 초과 전에 중단된 업데이트를 확인할 수 있습니다.

QA 릴리스 검사 실패는 일반 릴리스 검증을 차단합니다. QA 런타임 도구
범위 검사(표준 계층에서 `openclaw`와 `codex` 사이의 동적 도구 차이)도
기반 QA 런타임 동등성 레인이 권고 사항이더라도 릴리스 검사 검증기를 차단합니다.
Tideclaw 알파 실행은 패키지 안전성과 관련 없는 릴리스 검사 레인을 계속
권고 사항으로 처리할 수 있습니다. `release_profile=beta`에서는
`Run repo/live E2E validation` 라이브 제공자 제품군이 권고 사항입니다. 타사 모델 배포는
릴리스 도중에도 변경되므로 베타는 해당 실패를 경고로 표시하는 반면, 안정 및 전체 프로필은
계속 차단 조건으로 유지합니다.
`live_suite_filter`가 Discord, WhatsApp 또는 Slack과 같이 제한된 QA 라이브 레인을 명시적으로
요청하는 경우, 일치하는 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 저장소
변수를 활성화해야 합니다. 그렇지 않으면 해당 레인을 조용히 건너뛰는 대신 입력 캡처가 실패합니다.
새로운 QA 증거가 필요하면 `rerun_group=qa`, `qa-parity` 또는 `qa-live`를
재실행하십시오.

## 보관할 증거

`Full Release Validation` 요약을 릴리스 수준 색인으로 보관하십시오. 이 요약은
하위 실행 ID를 연결하고 가장 느린 작업 표를 포함합니다. 실패한 경우 먼저 하위
워크플로를 검사한 다음, 위에서 일치하는 가장 작은 핸들을 재실행하십시오.

유용한 아티팩트:

- `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- 패키지 승인의 `package-under-test` 및 Docker 승인 아티팩트
- 각 운영체제 및 제품군의 운영체제 간 릴리스 검사 아티팩트
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
