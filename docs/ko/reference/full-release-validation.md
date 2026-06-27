---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - stable 및 full 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증거
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-06-27T18:06:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스의 포괄 워크플로입니다. 릴리스 전 증명을 위한 단일 수동 진입점이지만, 대부분의 작업은 하위 워크플로에서 이루어지므로 실패한 환경만 전체 릴리스를 다시 시작하지 않고 재실행할 수 있습니다.

일반적으로 `main` 같은 신뢰된 워크플로 ref에서 실행하고, 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 `ref`로 전달합니다.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

하위 워크플로는 하네스에는 신뢰된 워크플로 ref를 사용하고, 테스트 대상 후보에는 입력 `ref`를 사용합니다. 이렇게 하면 오래된 릴리스 브랜치나 태그를 검증할 때도 새 검증 로직을 사용할 수 있습니다.

`release_profile=stable`과 `release_profile=full`은 항상 포괄적인 live/Docker soak를 실행합니다. 베타 프로필에 같은 soak 레인을 포함하려면 `run_release_soak=true`를 전달하세요. Stable 게시에서는 이 soak와 차단 제품 성능 증거가 없는 검증 매니페스트를 거부합니다.

Package Acceptance는 일반적으로 전체 SHA 실행이 `pnpm ci:full-release`로 디스패치된 경우를 포함해, 해석된 `ref`에서 후보 tarball을 빌드합니다. 베타 게시 후에는 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 전달해 릴리스 체크, Package Acceptance, 크로스 OS, 릴리스 경로 Docker, 패키지 Telegram 전반에서 게시된 npm 패키지를 재사용하세요. Package Acceptance가 의도적으로 다른 패키지를 증명해야 할 때만 `package_acceptance_package_spec`을 사용하세요. Codex Plugin live 패키지 레인은 같은 상태를 따릅니다. 게시된 `release_package_spec` 값은 `codex_plugin_spec=npm:@openclaw/codex@<version>`을 도출하고, SHA/아티팩트 실행은 선택한 ref에서 `extensions/codex`를 패키징하며, 운영자는 `npm:`, `npm-pack:`, 또는 `git:` Plugin 소스에 대해 `codex_plugin_spec`을 직접 설정할 수 있습니다. 이 레인은 해당 Plugin에 필요한 명시적 Codex CLI 설치 승인을 부여한 다음, Codex CLI 사전 점검과 같은 세션의 OpenAI 에이전트 턴을 실행합니다.

## 최상위 단계

| 단계                 | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 대상 해석            | **작업:** `Resolve target ref`<br />**하위 워크플로:** 없음<br />**증명:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 해석하고 선택된 입력을 기록합니다.<br />**재실행:** 이것이 실패하면 포괄 워크플로를 재실행합니다.                                                                                                                                                                                                                                             |
| Vitest 및 일반 CI    | **작업:** `Run normal full CI`<br />**하위 워크플로:** `CI`<br />**증명:** Linux Node 레인, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 체크, 문서 체크, Python Skills, Windows, macOS, Control UI i18n, 그리고 포괄 워크플로를 통한 Android를 포함해 대상 ref에 대해 수동 전체 CI 그래프를 검증합니다.<br />**재실행:** `rerun_group=ci`.                           |
| Plugin 사전 릴리스   | **작업:** `Run plugin prerelease validation`<br />**하위 워크플로:** `Plugin Prerelease`<br />**증명:** 릴리스 전용 Plugin 정적 체크, 에이전트 기반 Plugin 커버리지, 전체 확장 배치 샤드, Plugin 사전 릴리스 Docker 레인, 그리고 호환성 분류를 위한 비차단 `plugin-inspector-advisory` 아티팩트를 검증합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                        |
| 릴리스 체크          | **작업:** `Run release/live/Docker/QA validation`<br />**하위 워크플로:** `OpenClaw Release Checks`<br />**증명:** 설치 스모크, 크로스 OS 패키지 체크, Package Acceptance, QA Lab 동등성, live Matrix, live Telegram을 검증합니다. Stable 및 full 프로필은 포괄적인 live/E2E 제품군과 Docker 릴리스 경로 청크도 실행하며, 베타는 `run_release_soak=true`로 선택적으로 포함할 수 있습니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 release-checks 핸들. |
| 패키지 Telegram      | **작업:** `Run package Telegram E2E`<br />**하위 워크플로:** `NPM Telegram Beta E2E`<br />**증명:** `release_package_spec` 또는 `npm_telegram_package_spec`이 설정된 경우 게시된 패키지에 초점을 맞춘 Telegram E2E를 검증합니다. 전체 후보 검증은 대신 정식 Package Acceptance Telegram E2E를 사용합니다.<br />**재실행:** `release_package_spec` 또는 `npm_telegram_package_spec`과 함께 `rerun_group=npm-telegram`.                                               |
| 포괄 검증기          | **작업:** `Verify full validation`<br />**하위 워크플로:** 없음<br />**증명:** 기록된 하위 실행 결론을 다시 확인하고 하위 워크플로의 가장 느린 작업 표를 추가합니다.<br />**재실행:** 실패한 하위 워크플로를 녹색 상태로 재실행한 뒤 이 작업만 재실행합니다.                                                                                                                                                                                                  |

`ref=main` 및 `rerun_group=all`의 경우, 더 새로운 포괄 워크플로가 이전 워크플로를 대체합니다. 부모가 취소되면 해당 모니터는 이미 디스패치한 모든 하위 워크플로를 취소합니다. 릴리스 브랜치 및 태그 검증 실행은 기본적으로 서로 취소하지 않습니다.

## 릴리스 체크 단계

`OpenClaw Release Checks`는 가장 큰 하위 워크플로입니다. 대상을 한 번 해석하고, 패키지 또는 Docker 대상 단계에서 필요할 때 공유 `release-package-under-test` 아티팩트를 준비합니다.

| 단계                | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상         | **작업:** `Resolve target ref`<br />**백업 워크플로:** 없음<br />**테스트:** 선택한 ref, 선택적 예상 SHA, 프로필, 재실행 그룹, 집중 라이브 제품군 필터.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| 패키지 아티팩트     | **작업:** `Prepare release package artifact`<br />**백업 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패킹하거나 확인하고, 다운스트림 패키지 대상 검사에서 사용할 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받은 패키지, 크로스 OS, 또는 라이브/E2E 그룹.                                                                                                                                                                                                              |
| 설치 스모크         | **작업:** `Run install smoke`<br />**백업 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용을 포함한 전체 설치 경로, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 관리자 Docker 테스트, Bun 전역 설치 이미지 제공자 스모크, 빠른 번들 Plugin 설치/제거 E2E.<br />**재실행:** `rerun_group=install-smoke`.                                                                                                                                 |
| 크로스 OS           | **작업:** `cross_os_release_checks`<br />**백업 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용해 선택한 제공자와 모드에 대해 Linux, Windows, macOS에서 신규 및 업그레이드 레인 실행.<br />**재실행:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| 저장소 및 라이브 E2E | **작업:** `Run repo/live E2E validation`<br />**백업 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 저장소 E2E, 라이브 캐시, OpenAI websocket 스트리밍, 네이티브 라이브 제공자 및 Plugin 샤드, `release_profile`로 선택되는 Docker 기반 라이브 모델/백엔드/Gateway 하네스.<br />**실행:** `run_release_soak=true`, `release_profile=full`, 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter` 사용. |
| Docker 릴리스 경로  | **작업:** `Run Docker release-path validation`<br />**백업 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트를 대상으로 하는 릴리스 경로 Docker 청크.<br />**실행:** `run_release_soak=true`, `release_profile=full`, 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                      |
| 패키지 승인         | **작업:** `Run package acceptance`<br />**백업 워크플로:** `Package Acceptance`<br />**테스트:** 오프라인 Plugin 패키지 픽스처, Plugin 업데이트, 표준 mock-OpenAI Telegram 패키지 E2E, 동일한 tarball을 대상으로 하는 게시된 업그레이드 생존 검사. 차단 릴리스 검사는 기본 최신 게시 기준을 사용하며, 소크 검사는 `2026.4.23` 이후의 모든 안정 npm 릴리스와 보고된 이슈 픽스처까지 확장됩니다.<br />**재실행:** `rerun_group=package`.                   |
| QA 동등성           | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**백업 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트형 동등성 팩, 이후 동등성 보고서.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA 라이브 Matrix    | **작업:** `Run QA Lab live Matrix lane`<br />**백업 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경의 빠른 라이브 Matrix QA 프로필.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA 라이브 Telegram  | **작업:** `Run QA Lab live Telegram lane`<br />**백업 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| 릴리스 검증기       | **작업:** `Verify release checks`<br />**백업 워크플로:** 없음<br />**테스트:** 선택한 재실행 그룹에 필요한 릴리스 검사 작업.<br />**재실행:** 집중 하위 작업이 통과한 뒤 재실행.                                                                                                                                                                                                                                                                                                    |

## Docker 릴리스 경로 청크

`live_suite_filter`가 비어 있을 때 Docker 릴리스 경로 단계는 다음 청크를 실행합니다.

| 청크                                                            | 커버리지                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 코어 Docker 릴리스 경로 스모크 레인.                                                                                      |
| `package-update-openai`                                         | OpenAI 패키지 설치/업데이트 동작, Codex 온디맨드 설치, Codex Plugin 라이브 턴, Chat Completions 도구 호출. |
| `package-update-anthropic`                                      | Anthropic 패키지 설치 및 업데이트 동작.                                                                             |
| `package-update-core`                                           | 제공자 중립 패키지 및 업데이트 동작.                                                                              |
| `plugins-runtime-plugins`                                       | Plugin 동작을 실행하는 Plugin 런타임 레인.                                                                        |
| `plugins-runtime-services`                                      | 서비스 기반 및 라이브 Plugin 런타임 레인. 요청 시 OpenWebUI를 포함합니다.                                           |
| `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지 | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.                                                      |

Docker 레인 하나만 실패한 경우 재사용 가능한 라이브/E2E 워크플로에서 대상 지정 `docker_lanes=<lane[,lane]>`를 사용하세요. 사용 가능한 경우 릴리스 아티팩트에는 패키지 아티팩트 및 이미지 재사용 입력이 포함된 레인별 재실행 명령이 포함됩니다.

## 릴리스 프로필

`release_profile`은 주로 릴리스 검사 내부의 라이브/제공자 범위를 제어합니다.
일반 전체 CI, Plugin Prerelease, 설치 스모크, 패키지 승인 또는 QA Lab을 제거하지 않습니다. 안정 및 전체 프로필은 항상 포괄적인 저장소/라이브 E2E와 Docker 릴리스 경로 소크 커버리지를 실행합니다. 베타 프로필은 `run_release_soak=true`로 옵트인할 수 있습니다. Package Acceptance는 모든 전체 후보에 대해 표준 패키지 Telegram E2E를 제공하므로, 상위 워크플로는 해당 라이브 폴러를 중복 실행하지 않습니다.

| 프로필    | 의도한 용도                      | 포함된 라이브/제공자 커버리지                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 가장 빠른 릴리스 핵심 스모크.   | OpenAI/코어 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 Gateway 코어, 네이티브 OpenAI Gateway 프로필, 네이티브 OpenAI Plugin, Docker 라이브 Gateway OpenAI.                     |
| `stable`  | 기본 릴리스 승인 프로필. | `minimum`에 Anthropic 스모크, Google, MiniMax, 백엔드, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI 백엔드, Docker ACP 바인드, Docker Codex 하네스, OpenCode Go 스모크 샤드를 추가합니다. |
| `full`    | 광범위한 자문 스윕.             | `stable`에 자문 제공자, Plugin 라이브 샤드, 미디어 라이브 샤드를 추가합니다.                                                                                                        |

## 전체 전용 추가 항목

다음 제품군은 `stable`에서 건너뛰고 `full`에 포함됩니다.

| 영역                             | 전체 전용 커버리지                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 라이브 모델               | OpenCode Go, OpenRouter, xAI, Z.ai, Fireworks.                                                                          |
| Docker 라이브 Gateway            | DeepSeek/Fireworks, OpenCode Go/OpenRouter, xAI/Z.ai 샤드로 분할된 자문 제공자.                              |
| 네이티브 Gateway 제공자 프로필   | 전체 Anthropic Opus 및 Sonnet/Haiku 샤드, Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI, Z.ai. |
| 네이티브 Plugin 라이브 샤드      | Plugins A-K, L-N, O-Z 기타, Moonshot, xAI.                                                                             |
| 네이티브 미디어 라이브 샤드      | 오디오, Google music, MiniMax music, 비디오 그룹 A-D.                                                                   |

`stable`은 `native-live-src-gateway-profiles-anthropic-smoke` 및
`native-live-src-gateway-profiles-opencode-go-smoke`를 포함하며, `full`은 대신 더 넓은
Anthropic 및 OpenCode Go 모델 샤드를 사용합니다. 집중 재실행은 여전히
집계 `native-live-src-gateway-profiles-anthropic` 또는
`native-live-src-gateway-profiles-opencode-go` 핸들을 사용할 수 있습니다.

## 집중 재실행

`rerun_group`을 사용하여 관련 없는 릴리스 박스를 반복하지 않도록 합니다.

| 핸들              | 범위                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 모든 전체 릴리스 검증 단계.                                                             |
| `ci`                | 수동 전체 CI 자식만.                                                                      |
| `plugin-prerelease` | Plugin 사전 릴리스 자식만.                                                                   |
| `release-checks`    | 모든 OpenClaw 릴리스 검사 단계.                                                             |
| `install-smoke`     | 설치 스모크부터 릴리스 검사까지.                                                           |
| `cross-os`          | 교차 OS 릴리스 검사.                                                                        |
| `live-e2e`          | 저장소/라이브 E2E 및 Docker 릴리스 경로 검증.                                               |
| `package`           | 패키지 승인.                                                                             |
| `qa`                | QA 동등성 및 QA 라이브 레인.                                                                   |
| `qa-parity`         | QA 동등성 레인과 보고서만.                                                                |
| `qa-live`           | 활성화된 경우 QA 라이브 Matrix/Telegram 및 게이트된 Discord, WhatsApp, Slack 레인.             |
| `npm-telegram`      | 게시된 패키지 Telegram E2E. `release_package_spec` 또는 `npm_telegram_package_spec`가 필요합니다. |

하나의 라이브 스위트가 실패한 경우 `rerun_group=live-e2e`와 함께 `live_suite_filter`를 사용합니다.
유효한 필터 ID는 재사용 가능한 라이브/E2E 워크플로에 정의되어 있으며, 여기에는
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, 그리고
`live-codex-harness-docker`가 포함됩니다.

`live-gateway-advisory-docker` 핸들은 해당 세 개 제공자 샤드의 집계 재실행 핸들이므로,
여전히 모든 advisory Docker Gateway 작업으로 팬아웃됩니다.

하나의 교차 OS 레인이 실패한 경우 `rerun_group=cross-os`와 함께 `cross_os_suite_filter`를
사용합니다. 이 필터는 OS ID, 스위트 ID 또는 OS/스위트 쌍을 받습니다. 예를 들어
`windows/packaged-upgrade`, `windows`, 또는 `packaged-fresh`입니다. 교차 OS
요약에는 패키지 업그레이드 레인에 대한 단계별 시간이 포함되며, 오래 실행되는
명령은 Heartbeat 줄을 출력하므로 작업 시간 초과 전에 멈춘 Windows 업데이트를
확인할 수 있습니다.

QA 릴리스 검사 실패는 일반 릴리스 검증을 차단합니다. 표준 티어에서 필요한 OpenClaw
동적 도구 드리프트도 릴리스 검사 검증기를 차단합니다. Tideclaw 알파 실행은
패키지 안전성이 아닌 릴리스 검사 레인을 여전히 advisory로 취급할 수 있습니다.
`live_suite_filter`가 Discord, WhatsApp 또는 Slack 같은 게이트된 QA 라이브 레인을
명시적으로 요청하는 경우, 일치하는 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 저장소
변수를 활성화해야 합니다. 그렇지 않으면 레인을 조용히 건너뛰는 대신 입력 캡처가
실패합니다. 새로운 QA 증거가 필요하면 `rerun_group=qa`, `qa-parity`, 또는 `qa-live`를
다시 실행합니다.

## 보관할 증거

릴리스 수준 색인으로 `Full Release Validation` 요약을 보관합니다. 이 요약은
자식 실행 ID를 링크하고 가장 느린 작업 표를 포함합니다. 실패한 경우 먼저 자식
워크플로를 검사한 다음, 위에서 가장 작은 일치 핸들을 다시 실행합니다.

유용한 아티팩트:

- `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- 패키지 승인 `package-under-test` 및 Docker 승인 아티팩트
- 각 OS와 스위트에 대한 교차 OS 릴리스 검사 아티팩트
- QA 동등성, Matrix, Telegram 아티팩트

## 워크플로 파일

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
