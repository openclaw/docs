---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - 안정 릴리스와 전체 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증빙 자료
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-05-01T06:26:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스 상위 워크플로입니다. 사전 릴리스 검증을 위한 단일 수동
진입점이지만, 대부분의 작업은 자식 워크플로에서 실행되므로 실패한 박스만
전체 릴리스를 다시 시작하지 않고 재실행할 수 있습니다.

일반적으로 `main` 같은 신뢰할 수 있는 워크플로 ref에서 실행하고, 릴리스 브랜치,
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

## 최상위 단계

| 단계                 | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대상 해석     | **작업:** `Resolve target ref`<br />**자식 워크플로:** 없음<br />**검증:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 해석하고 선택한 입력을 기록합니다.<br />**재실행:** 이 단계가 실패하면 상위 워크플로를 재실행합니다.                                                                                                                                                                              |
| Vitest 및 일반 CI  | **작업:** `Run normal full CI`<br />**자식 워크플로:** `CI`<br />**검증:** Linux Node 레인, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Control UI i18n, 그리고 상위 워크플로를 통한 Android를 포함해 대상 ref에 대해 수동 전체 CI 그래프를 실행합니다.<br />**재실행:** `rerun_group=ci`. |
| Plugin 사전 릴리스     | **작업:** `Run plugin prerelease validation`<br />**자식 워크플로:** `Plugin Prerelease`<br />**검증:** 릴리스 전용 Plugin 정적 검사, 에이전트형 Plugin 커버리지, 전체 확장 배치 샤드, Plugin 사전 릴리스 Docker 레인을 검증합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                                       |
| 릴리스 검사        | **작업:** `Run release/live/Docker/QA validation`<br />**자식 워크플로:** `OpenClaw Release Checks`<br />**검증:** 설치 스모크, 크로스 OS 패키지 검사, 라이브/E2E 스위트, Docker 릴리스 경로 청크, Package Acceptance, QA Lab 패리티, 라이브 Matrix, 라이브 Telegram을 검증합니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 release-checks 핸들.                                |
| 게시 후 Telegram | **작업:** `Run post-publish Telegram E2E`<br />**자식 워크플로:** `NPM Telegram Beta E2E`<br />**검증:** `npm_telegram_package_spec`이 설정된 경우 선택적으로 게시된 패키지의 Telegram 검증을 수행합니다.<br />**재실행:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| 상위 검증기     | **작업:** `Verify full validation`<br />**자식 워크플로:** 없음<br />**검증:** 기록된 자식 실행 결론을 다시 확인하고 자식 워크플로의 가장 느린 작업 표를 추가합니다.<br />**재실행:** 실패한 자식이 통과하도록 재실행한 뒤 이 작업만 재실행합니다.                                                                                                                                   |

`ref=main` 및 `rerun_group=all`의 경우 더 새 상위 워크플로가 이전 워크플로를 대체합니다.
상위 워크플로가 취소되면 해당 모니터가 이미 디스패치한 모든 자식 워크플로를
취소합니다. 릴리스 브랜치 및 태그 검증 실행은 기본적으로 서로를 취소하지 않습니다.

## 릴리스 검사 단계

`OpenClaw Release Checks`는 가장 큰 자식 워크플로입니다. 대상을 한 번 해석하고,
패키지 또는 Docker 관련 단계에서 필요할 때 공유 `release-package-under-test`
아티팩트를 준비합니다.

| 단계               | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상      | **작업:** `Resolve target ref`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 ref, 선택 사항인 예상 SHA, 프로필, 재실행 그룹, 집중 라이브 스위트 필터.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                           |
| 패키지 아티팩트    | **작업:** `Prepare release package artifact`<br />**기반 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패킹하거나 해석하고, 다운스트림 패키지 관련 검사를 위해 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받는 패키지, 크로스 OS 또는 라이브/E2E 그룹.                                                                                                           |
| 설치 스모크       | **작업:** `Run install smoke`<br />**기반 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 프로그램 Docker 테스트, Bun 전역 설치 image-provider 스모크, 빠른 번들 Plugin Docker E2E를 포함한 전체 설치 경로.<br />**재실행:** `rerun_group=install-smoke`.                                         |
| 크로스 OS            | **작업:** `cross_os_release_checks`<br />**기반 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용해 선택한 공급자와 모드에 대해 Linux, Windows, macOS에서 신규 및 업그레이드 레인을 테스트합니다.<br />**재실행:** `rerun_group=cross-os`.                                                                               |
| 리포지토리 및 라이브 E2E   | **작업:** `Run repo/live E2E validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** `release_profile`로 선택되는 리포지토리 E2E, 라이브 캐시, OpenAI websocket 스트리밍, 네이티브 라이브 공급자 및 Plugin 샤드, Docker 기반 라이브 모델/백엔드/Gateway 하네스.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter` 포함. |
| Docker 릴리스 경로 | **작업:** `Run Docker release-path validation`<br />**기반 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트에 대해 릴리스 경로 Docker 청크를 테스트합니다.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **작업:** `Run package acceptance`<br />**기반 워크플로:** `Package Acceptance`<br />**테스트:** 동일한 tarball에 대해 아티팩트 네이티브 번들 채널 의존성 호환성, 오프라인 Plugin 패키지 픽스처, mock-OpenAI Telegram 패키지 수락을 테스트합니다.<br />**재실행:** `rerun_group=package`.                                                                                       |
| QA 패리티           | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**기반 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트형 패리티 팩을 실행한 다음 패리티 보고서를 생성합니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                                       |
| QA 라이브 Matrix      | **작업:** `Run QA Lab live Matrix lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경에서 빠른 라이브 Matrix QA 프로필을 테스트합니다.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                        |
| QA 라이브 Telegram    | **작업:** `Run QA Lab live Telegram lane`<br />**기반 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 임대를 사용한 라이브 Telegram QA를 테스트합니다.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                                    |
| 릴리스 검증기    | **작업:** `Verify release checks`<br />**기반 워크플로:** 없음<br />**테스트:** 선택한 재실행 그룹에 필요한 릴리스 검사 작업을 확인합니다.<br />**재실행:** 집중 자식 작업이 통과한 뒤 재실행합니다.                                                                                                                                                                                                 |

## Docker 릴리스 경로 청크

Docker 릴리스 경로 단계는 `live_suite_filter`가 비어 있을 때 다음 청크를 실행합니다.

| 청크                                                                                       | 커버리지                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core Docker 릴리스 경로 스모크 레인.                                   |
| `package-update-openai`                                                                     | OpenAI 패키지 설치 및 업데이트 동작.                             |
| `package-update-anthropic`                                                                  | Anthropic 패키지 설치 및 업데이트 동작.                          |
| `package-update-core`                                                                       | 공급자 중립 패키지 및 업데이트 동작.                           |
| `plugins-runtime-plugins`                                                                   | Plugin 동작을 실행하는 Plugin 런타임 레인.                     |
| `plugins-runtime-services`                                                                  | 서비스 기반 Plugin 런타임 레인. 요청 시 OpenWebUI를 포함합니다. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.   |
| `bundled-channels-core`                                                                     | 번들 채널 Docker 동작.                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | 번들 채널 업데이트 동작.                                        |
| `bundled-channels-contracts`                                                                | Docker 릴리스 경로의 번들 채널 계약 검사.             |

대상 지정 `docker_lanes=<lane[,lane]>`를 재사용 가능한 라이브/E2E 워크플로에서 사용하세요. 이는
Docker 레인 하나만 실패했을 때 사용합니다. 릴리스 아티팩트에는 사용 가능한 경우 패키지 아티팩트 및 이미지 재사용 입력이 포함된 레인별 재실행
명령이 포함됩니다.

## 릴리스 프로필

`release_profile`은 릴리스 검사 안에서만 라이브/provider 범위를 제어합니다. 일반적인 전체 CI, Plugin Prerelease, 설치 스모크, 패키지
승인, QA Lab 또는 Docker 릴리스 경로 청크를 제거하지 않습니다.

| 프로필    | 의도된 용도                   | 포함된 라이브/provider 범위                                                                                                                                                   |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 가장 빠른 릴리스 핵심 스모크. | OpenAI/core 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 gateway core, 네이티브 OpenAI gateway 프로필, 네이티브 OpenAI plugin, Docker 라이브 gateway OpenAI.           |
| `stable`  | 기본 릴리스 승인 프로필.      | `minimum`에 Anthropic, Google, MiniMax, backend, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI backend, Docker ACP bind, Docker Codex 하네스, OpenCode Go 스모크 샤드 추가. |
| `full`    | 광범위한 자문 스윕.           | `stable`에 자문 provider, plugin 라이브 샤드, 미디어 라이브 샤드 추가.                                                                                                       |

## Full 전용 추가 항목

다음 스위트는 `stable`에서 건너뛰고 `full`에 포함됩니다.

| 영역                             | Full 전용 범위                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 라이브 모델               | OpenCode Go, OpenRouter, xAI, Z.ai, Fireworks.                                  |
| Docker 라이브 Gateway            | DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, Z.ai용 자문 샤드.            |
| 네이티브 Gateway provider 프로필 | Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI, Z.ai.         |
| 네이티브 Plugin 라이브 샤드      | Plugins A-K, L-N, O-Z 기타, Moonshot, xAI.                                      |
| 네이티브 미디어 라이브 샤드      | 오디오, Google 음악, MiniMax 음악, 비디오 그룹 A-D.                             |

`stable`에는 `native-live-src-gateway-profiles-opencode-go-smoke`가 포함되고, `full`은
대신 더 넓은 OpenCode Go 모델 샤드를 사용합니다.

## 집중 재실행

관련 없는 릴리스 박스를 반복하지 않으려면 `rerun_group`을 사용하세요.

| 핸들              | 범위                                              |
| ----------------- | ------------------------------------------------- |
| `all`             | 모든 Full Release Validation 단계.                |
| `ci`              | 수동 전체 CI 하위 항목만.                         |
| `plugin-prerelease` | Plugin Prerelease 하위 항목만.                  |
| `release-checks`  | 모든 OpenClaw Release Checks 단계.                |
| `install-smoke`   | 릴리스 검사를 통한 설치 스모크.                   |
| `cross-os`        | Cross-OS 릴리스 검사.                             |
| `live-e2e`        | Repo/live E2E 및 Docker 릴리스 경로 검증.         |
| `package`         | Package Acceptance.                               |
| `qa`              | QA 패리티와 QA 라이브 레인.                       |
| `qa-parity`       | QA 패리티 레인 및 보고서만.                       |
| `qa-live`         | QA 라이브 Matrix와 Telegram만.                    |
| `npm-telegram`    | 선택적 게시 후 Telegram E2E만.                    |

라이브 스위트 하나가 실패했을 때는 `rerun_group=live-e2e`와 함께 `live_suite_filter`를 사용하세요.
유효한 필터 ID는 재사용 가능한 라이브/E2E 워크플로에 정의되어 있으며,
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`,
`live-codex-harness-docker`를 포함합니다.

## 보관할 증거

릴리스 수준 색인으로 `Full Release Validation` 요약을 보관하세요. 이 요약은
하위 실행 ID로 연결되며 가장 느린 작업 테이블을 포함합니다. 실패 시에는 먼저 하위
워크플로를 검사한 다음, 위에서 일치하는 가장 작은 핸들을 재실행하세요.

유용한 아티팩트:

- `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- Package Acceptance `package-under-test` 및 Docker 승인 아티팩트
- 각 OS 및 스위트에 대한 Cross-OS 릴리스 검사 아티팩트
- QA 패리티, Matrix, Telegram 아티팩트

## 워크플로 파일

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
