---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - 안정 릴리스 검증 프로필과 전체 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증거
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-05-10T19:50:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스 검증을 포괄하는 상위 항목입니다. 릴리스 전 증명을 위한 단일 수동
진입점이지만, 대부분의 작업은 자식 워크플로에서 수행되므로 실패한 박스를
전체 릴리스를 다시 시작하지 않고 재실행할 수 있습니다.

신뢰할 수 있는 워크플로 ref, 일반적으로 `main`에서 실행하고, 릴리스 브랜치,
태그 또는 전체 커밋 SHA를 `ref`로 전달합니다.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

자식 워크플로는 하네스에 신뢰할 수 있는 워크플로 ref를 사용하고, 테스트 대상
후보에는 입력 `ref`를 사용합니다. 이렇게 하면 이전 릴리스 브랜치나 태그를
검증할 때도 새 검증 로직을 사용할 수 있습니다.

기본적으로 `release_profile=stable`은 릴리스 차단 lane을 실행하고
포괄적인 live/Docker soak는 건너뜁니다. 안정 실행에 soak lane을 포함하려면
`run_release_soak=true`를 전달하세요. `release_profile=full`은 항상 soak lane을
활성화하므로 광범위한 권고 프로필에서 커버리지가 조용히 빠지지 않습니다.

Package Acceptance는 일반적으로 전체 SHA 실행이 `pnpm ci:full-release`로
디스패치된 경우를 포함해, 해석된 `ref`에서 후보 tarball을 빌드합니다.
게시 후에는 `package_acceptance_package_spec=openclaw@YYYY.M.D` 또는
`openclaw@beta`/`openclaw@latest`를 전달해 동일한 패키지/업데이트 매트릭스를
출시된 npm 패키지에 대해 실행합니다.

## 최상위 단계

| 단계                 | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대상 확인            | **작업:** `Resolve target ref`<br />**자식 워크플로:** 없음<br />**증명:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 해석하고 선택된 입력을 기록합니다.<br />**재실행:** 실패하면 상위 워크플로를 재실행합니다.                                                                                                                                                                                                                            |
| Vitest 및 일반 CI    | **작업:** `Run normal full CI`<br />**자식 워크플로:** `CI`<br />**증명:** Linux Node lane, 번들 Plugin shard, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Control UI i18n, 그리고 상위 워크플로를 통한 Android를 포함해 대상 ref에 대해 수동 전체 CI 그래프를 검증합니다.<br />**재실행:** `rerun_group=ci`. |
| Plugin 프리릴리스    | **작업:** `Run plugin prerelease validation`<br />**자식 워크플로:** `Plugin Prerelease`<br />**증명:** 릴리스 전용 Plugin 정적 검사, 에이전트형 Plugin 커버리지, 전체 확장 배치 shard, Plugin 프리릴리스 Docker lane을 검증합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                                                    |
| 릴리스 검사          | **작업:** `Run release/live/Docker/QA validation`<br />**자식 워크플로:** `OpenClaw Release Checks`<br />**증명:** 설치 스모크, 교차 OS 패키지 검사, Package Acceptance, QA Lab parity, live Matrix, live Telegram을 검증합니다. `run_release_soak=true` 또는 `release_profile=full`이면 포괄적인 live/E2E suite와 Docker 릴리스 경로 chunk도 실행합니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 release-checks 핸들. |
| 패키지 아티팩트      | **작업:** `Prepare release package artifact`<br />**자식 워크플로:** 없음<br />**증명:** `OpenClaw Release Checks`를 기다릴 필요가 없는 패키지 대상 검사를 위해 부모 `release-package-under-test` tarball을 충분히 이르게 생성합니다.<br />**재실행:** 상위 워크플로를 재실행하거나 `rerun_group=npm-telegram`에 `npm_telegram_package_spec`을 제공합니다.                         |
| 패키지 Telegram      | **작업:** `Run package Telegram E2E`<br />**자식 워크플로:** `NPM Telegram Beta E2E`<br />**증명:** `release_profile=full`과 함께 `rerun_group=all`에 대해 부모 아티팩트 기반 Telegram 패키지 증명을 수행하거나, `npm_telegram_package_spec`이 설정된 경우 게시된 패키지 Telegram 증명을 수행합니다.<br />**재실행:** `npm_telegram_package_spec`과 함께 `rerun_group=npm-telegram`. |
| 상위 검증기          | **작업:** `Verify full validation`<br />**자식 워크플로:** 없음<br />**증명:** 기록된 자식 실행 결론을 다시 검사하고 자식 워크플로의 가장 느린 작업 테이블을 추가합니다.<br />**재실행:** 실패한 자식을 green 상태로 재실행한 후 이 작업만 재실행합니다.                                                                                                                          |

`ref=main` 및 `rerun_group=all`의 경우 더 새 상위 워크플로가 이전 워크플로를
대체합니다. 부모가 취소되면 해당 모니터는 이미 디스패치한 모든 자식 워크플로를
취소합니다. 릴리스 브랜치 및 태그 검증 실행은 기본적으로 서로를 취소하지 않습니다.

## 릴리스 검사 단계

`OpenClaw Release Checks`는 가장 큰 자식 워크플로입니다. 대상을 한 번 해석하고
패키지 또는 Docker 대상 단계에서 필요할 때 공유 `release-package-under-test`
아티팩트를 준비합니다.

| 단계                | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상         | **작업:** `Resolve target ref`<br />**기반 워크플로:** 없음<br />**테스트:** 선택된 ref, 선택적 예상 SHA, 프로필, 재실행 그룹, 집중 라이브 제품군 필터.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                                  |
| 패키지 아티팩트     | **작업:** `Prepare release package artifact`<br />**기반 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패킹하거나 확인하고, 다운스트림 패키지 대상 검사를 위해 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받은 패키지, 크로스 OS 또는 라이브/E2E 그룹.                                                                                                                                                                                                                                                                                |
| 설치 스모크         | **작업:** `Run install smoke`<br />**기반 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용을 포함한 전체 설치 경로, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 관리자 Docker 테스트, Bun 전역 설치 이미지 제공자 스모크, 빠른 번들 Plugin 설치/제거 E2E.<br />**재실행:** `rerun_group=install-smoke`.                                                                                                                                                    |
| 크로스 OS           | **작업:** `cross_os_release_checks`<br />**기반 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용하여 선택된 제공자와 모드에 대해 Linux, Windows, macOS에서 신규 및 업그레이드 레인.<br />**재실행:** `rerun_group=cross-os`.                                                                                                                                                                                                                  |
| 저장소 및 라이브 E2E | **작업:** `Run repo/live E2E validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** `release_profile`에서 선택한 저장소 E2E, 라이브 캐시, OpenAI websocket 스트리밍, 네이티브 라이브 제공자 및 Plugin 샤드, Docker 기반 라이브 모델/백엔드/Gateway 하네스.<br />**실행:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter` 포함. |
| Docker 릴리스 경로  | **작업:** `Run Docker release-path validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트를 대상으로 한 릴리스 경로 Docker 청크.<br />**실행:** `run_release_soak=true`, `release_profile=full` 또는 집중 `rerun_group=live-e2e`.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                                      |
| 패키지 승인         | **작업:** `Run package acceptance`<br />**기반 워크플로:** `Package Acceptance`<br />**테스트:** 오프라인 Plugin 패키지 fixture, Plugin 업데이트, mock-OpenAI Telegram 패키지 승인, 동일한 tarball을 대상으로 한 게시된 업그레이드 생존 검사. 차단 릴리스 검사는 기본 최신 게시 기준선을 사용하며, 소크 검사는 `2026.4.23` 이후의 모든 안정 npm 릴리스와 보고된 이슈 fixture로 확장됩니다.<br />**재실행:** `rerun_group=package`.                                      |
| QA 동등성           | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트형 동등성 팩, 이후 동등성 보고서.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                    |
| QA 라이브 Matrix    | **작업:** `Run QA Lab live Matrix lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경의 빠른 라이브 Matrix QA 프로필.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                            |
| QA 라이브 Telegram  | **작업:** `Run QA Lab live Telegram lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 lease를 사용하는 라이브 Telegram QA.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                                                                                                                         |
| 릴리스 검증기       | **작업:** `Verify release checks`<br />**기반 워크플로:** 없음<br />**테스트:** 선택된 재실행 그룹에 필요한 릴리스 검사 작업.<br />**재실행:** 집중 하위 작업이 통과한 후 재실행합니다.                                                                                                                                                                                                                                                                                                                                                                                 |

## Docker 릴리스 경로 청크

Docker 릴리스 경로 단계는 `live_suite_filter`가 비어 있을 때 다음 청크를
실행합니다.

| 청크                                                            | 범위                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | 핵심 Docker 릴리스 경로 스모크 레인.                                             |
| `package-update-openai`                                         | Codex 주문형 설치를 포함한 OpenAI 패키지 설치/업데이트 동작.                    |
| `package-update-anthropic`                                      | Anthropic 패키지 설치 및 업데이트 동작.                                          |
| `package-update-core`                                           | 제공자 중립 패키지 및 업데이트 동작.                                             |
| `plugins-runtime-plugins`                                       | Plugin 동작을 실행하는 Plugin 런타임 레인.                                       |
| `plugins-runtime-services`                                      | 서비스 기반 및 라이브 Plugin 런타임 레인. 요청 시 OpenWebUI를 포함합니다.        |
| `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지 | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.                         |

Docker 레인 하나만 실패한 경우 재사용 가능한 라이브/E2E 워크플로에서 대상 지정
`docker_lanes=<lane[,lane]>`을 사용하세요. 릴리스 아티팩트에는 사용 가능한 경우
패키지 아티팩트 및 이미지 재사용 입력이 포함된 레인별 재실행 명령이 포함됩니다.

## 릴리스 프로필

`release_profile`은 주로 릴리스 검사 내부의 라이브/제공자 범위를 제어합니다.
일반 전체 CI, Plugin Prerelease, 설치 스모크, 패키지 승인 또는 QA Lab은 제거하지
않습니다. `stable`의 경우, 포괄적인 저장소/라이브 E2E 및 Docker 릴리스 경로
청크는 소크 범위이며 `run_release_soak=true`일 때 실행됩니다. `full`은 소크
범위를 강제로 켜고, `rerun_group=all`일 때 umbrella 실행이 상위 릴리스 패키지
아티팩트를 대상으로 패키지 Telegram E2E도 실행하도록 하므로, 전체 게시 전
후보가 해당 Telegram 패키지 레인을 조용히 건너뛰지 않습니다.

| 프로필    | 의도된 사용                     | 포함된 라이브/제공자 범위                                                                                                                                                          |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 가장 빠른 릴리스 핵심 스모크.   | OpenAI/핵심 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 Gateway 핵심, 네이티브 OpenAI Gateway 프로필, 네이티브 OpenAI Plugin, Docker 라이브 Gateway OpenAI.                 |
| `stable`  | 기본 릴리스 승인 프로필.        | `minimum`에 Anthropic 스모크, Google, MiniMax, 백엔드, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI 백엔드, Docker ACP 바인드, Docker Codex 하네스, OpenCode Go 스모크 샤드 추가. |
| `full`    | 광범위한 advisory 스윕.         | `stable`에 advisory 제공자, Plugin 라이브 샤드, 미디어 라이브 샤드 추가.                                                                                                           |

## full 전용 추가 항목

이 제품군은 `stable`에서 건너뛰고 `full`에 포함됩니다.

| 영역                             | full 전용 범위                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Docker 라이브 모델               | OpenCode Go, OpenRouter, xAI, Z.ai, Fireworks.                                                                             |
| Docker 라이브 Gateway            | DeepSeek/Fireworks, OpenCode Go/OpenRouter, xAI/Z.ai 샤드로 분할된 advisory 제공자.                                        |
| 네이티브 Gateway 제공자 프로필   | 전체 Anthropic Opus 및 Sonnet/Haiku 샤드, Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI, Z.ai.          |
| 네이티브 Plugin 라이브 샤드      | Plugins A-K, L-N, O-Z 기타, Moonshot, xAI.                                                                                 |
| 네이티브 미디어 라이브 샤드      | Audio, Google music, MiniMax music, video groups A-D.                                                                      |

`stable`은 `native-live-src-gateway-profiles-anthropic-smoke`와
`native-live-src-gateway-profiles-opencode-go-smoke`를 포함하며, `full`은 대신 더
넓은 Anthropic 및 OpenCode Go 모델 샤드를 사용합니다. 집중 재실행은 여전히
집계 `native-live-src-gateway-profiles-anthropic` 또는
`native-live-src-gateway-profiles-opencode-go` 핸들을 사용할 수 있습니다.

## 집중 재실행

관련 없는 릴리스 박스를 반복하지 않으려면 `rerun_group`을 사용하세요:

| 핸들              | 범위                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 모든 전체 릴리스 검증 단계.                                   |
| `ci`                | 수동 전체 CI 하위 항목만.                                            |
| `plugin-prerelease` | Plugin 사전 릴리스 하위 항목만.                                         |
| `release-checks`    | 모든 OpenClaw 릴리스 검사 단계.                                   |
| `install-smoke`     | 릴리스 검사를 통한 설치 Smoke.                                 |
| `cross-os`          | 교차 OS 릴리스 검사.                                              |
| `live-e2e`          | 저장소/라이브 E2E 및 Docker 릴리스 경로 검증.                     |
| `package`           | 패키지 승인.                                                   |
| `qa`                | QA 동등성 및 QA 라이브 레인.                                         |
| `qa-parity`         | QA 동등성 레인 및 보고서만.                                      |
| `qa-live`           | QA 라이브 Matrix 및 Telegram만.                                     |
| `npm-telegram`      | 게시된 패키지 Telegram E2E; `npm_telegram_package_spec`가 필요합니다. |

하나의 라이브 스위트가 실패했을 때는 `rerun_group=live-e2e`와 함께 `live_suite_filter`를 사용합니다.
유효한 필터 id는 재사용 가능한 라이브/E2E 워크플로에 정의되어 있으며, 다음을 포함합니다.
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, 및
`live-codex-harness-docker`.

`live-gateway-advisory-docker` 핸들은 세 공급자 샤드에 대한 집계 재실행 핸들이므로,
여전히 모든 자문 Docker Gateway 작업으로 확장됩니다.

하나의 교차 OS 레인이 실패했을 때는 `rerun_group=cross-os`와 함께 `cross_os_suite_filter`를 사용합니다.
필터는 OS id, 스위트 id 또는 OS/스위트 쌍을 허용합니다. 예:
`windows/packaged-upgrade`, `windows`, 또는 `packaged-fresh`. 교차 OS
요약에는 패키지 업그레이드 레인에 대한 단계별 타이밍이 포함되며, 장시간 실행되는
명령은 Heartbeat 줄을 출력하므로 작업 시간 초과 전에 멈춘 Windows 업데이트를 확인할 수 있습니다.

QA 릴리스 검사 레인은 권고용입니다. QA 전용 실패는 경고로 보고되며
릴리스 검사 검증기를 차단하지 않습니다. 새로운 QA 증거가 필요할 때는 `rerun_group=qa`,
`qa-parity` 또는 `qa-live`를 재실행하세요.

## 보관할 증거

`Full Release Validation` 요약을 릴리스 수준 인덱스로 유지하세요. 이 요약은
하위 실행 id로 연결되며 가장 느린 작업 표를 포함합니다. 실패의 경우 먼저 하위
워크플로를 검사한 다음, 위에서 가장 작은 일치 핸들을 재실행하세요.

유용한 아티팩트:

- Full Release Validation 상위 항목 및 `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- Package Acceptance `package-under-test` 및 Docker 승인 아티팩트
- 각 OS 및 스위트의 교차 OS 릴리스 검사 아티팩트
- QA 동등성, Matrix 및 Telegram 아티팩트

## 워크플로 파일

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
