---
read_when:
    - 전체 릴리스 검증 실행 또는 재실행
    - 안정 및 전체 릴리스 검증 프로필 비교
    - 릴리스 검증 단계 실패 디버깅
summary: 전체 릴리스 검증 단계, 하위 워크플로, 릴리스 프로필, 재실행 핸들 및 증거
title: 전체 릴리스 검증
x-i18n:
    generated_at: "2026-05-02T21:12:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation`은 릴리스 상위 워크플로입니다. 릴리스 전 검증을 위한 단일 수동
진입점이지만, 대부분의 작업은 하위 워크플로에서 실행되므로 실패한 박스는 전체 릴리스를
다시 시작하지 않고 재실행할 수 있습니다.

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

하위 워크플로는 하네스에 신뢰할 수 있는 워크플로 ref를 사용하고, 테스트 대상 후보에는
입력 `ref`를 사용합니다. 이렇게 하면 오래된 릴리스 브랜치나 태그를 검증할 때도 새
검증 로직을 사용할 수 있습니다.

Package Acceptance는 일반적으로 `pnpm ci:full-release`로 디스패치한 전체 SHA 실행을
포함해 확인된 `ref`에서 후보 tarball을 빌드합니다. 게시 후에는
`package_acceptance_package_spec=openclaw@YYYY.M.D`(또는 `openclaw@beta`/`openclaw@latest`)를 전달해
대신 배포된 npm 패키지를 대상으로 동일한 패키지/업데이트 매트릭스를 실행합니다.

## 최상위 단계

| 단계                 | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대상 확인            | **작업:** `Resolve target ref`<br />**하위 워크플로:** 없음<br />**검증:** 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 확인하고 선택한 입력을 기록합니다.<br />**재실행:** 실패하면 상위 워크플로를 재실행합니다.                                                                                                                                                                                              |
| Vitest 및 일반 CI    | **작업:** `Run normal full CI`<br />**하위 워크플로:** `CI`<br />**검증:** Linux Node 레인, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Control UI i18n, 상위 워크플로를 통한 Android를 포함해 대상 ref에 대해 수동 전체 CI 그래프를 검증합니다.<br />**재실행:** `rerun_group=ci`. |
| Plugin 프리릴리스    | **작업:** `Run plugin prerelease validation`<br />**하위 워크플로:** `Plugin Prerelease`<br />**검증:** 릴리스 전용 Plugin 정적 검사, 에이전트형 Plugin 커버리지, 전체 확장 배치 샤드, Plugin 프리릴리스 Docker 레인을 검증합니다.<br />**재실행:** `rerun_group=plugin-prerelease`.                                                                                                                            |
| 릴리스 검사          | **작업:** `Run release/live/Docker/QA validation`<br />**하위 워크플로:** `OpenClaw Release Checks`<br />**검증:** 설치 스모크, 크로스 OS 패키지 검사, 라이브/E2E 제품군, Docker 릴리스 경로 청크, Package Acceptance, QA Lab 패리티, 라이브 Matrix, 라이브 Telegram을 검증합니다.<br />**재실행:** `rerun_group=release-checks` 또는 더 좁은 release-checks 핸들.       |
| 패키지 Telegram      | **작업:** `Run package Telegram E2E`<br />**하위 워크플로:** `NPM Telegram Beta E2E`<br />**검증:** `rerun_group=all` 및 `release_profile=full`에 대한 아티팩트 기반 Telegram 패키지 검증, 또는 `npm_telegram_package_spec`가 설정된 경우 게시된 패키지 Telegram 검증을 수행합니다.<br />**재실행:** `npm_telegram_package_spec`와 함께 `rerun_group=npm-telegram`.    |
| 상위 검증기          | **작업:** `Verify full validation`<br />**하위 워크플로:** 없음<br />**검증:** 기록된 하위 실행 결론을 다시 확인하고 하위 워크플로의 가장 느린 작업 표를 추가합니다.<br />**재실행:** 실패한 하위를 재실행해 통과시킨 후 이 작업만 재실행합니다.                                                                                                                                                |

`ref=main` 및 `rerun_group=all`의 경우, 더 새로운 상위 워크플로가 이전 워크플로를
대체합니다. 부모가 취소되면 해당 모니터는 이미 디스패치한 모든 하위 워크플로를
취소합니다. 릴리스 브랜치 및 태그 검증 실행은 기본적으로 서로 취소하지 않습니다.

## 릴리스 검사 단계

`OpenClaw Release Checks`는 가장 큰 하위 워크플로입니다. 대상을 한 번 확인하고,
패키지 또는 Docker 대상 단계에 필요할 때 공유 `release-package-under-test`
아티팩트를 준비합니다.

| 단계                | 세부 정보                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 릴리스 대상         | **작업:** `Resolve target ref`<br />**지원 워크플로:** 없음<br />**테스트:** 선택한 ref, 선택적 예상 SHA, 프로필, 재실행 그룹, 집중 라이브 제품군 필터를 테스트합니다.<br />**재실행:** `rerun_group=release-checks`.                                                                                                                                                                             |
| 패키지 아티팩트     | **작업:** `Prepare release package artifact`<br />**지원 워크플로:** 없음<br />**테스트:** 후보 tarball 하나를 패킹하거나 확인하고, 다운스트림 패키지 대상 검사를 위해 `release-package-under-test`를 업로드합니다.<br />**재실행:** 영향을 받은 패키지, 크로스 OS 또는 라이브/E2E 그룹.                                                                                                        |
| 설치 스모크         | **작업:** `Run install smoke`<br />**지원 워크플로:** `Install Smoke`<br />**테스트:** 루트 Dockerfile 스모크 이미지 재사용을 포함한 전체 설치 경로, QR 패키지 설치, 루트 및 Gateway Docker 스모크, 설치 프로그램 Docker 테스트, Bun 전역 설치 이미지 제공자 스모크, 빠른 번들 Plugin 설치/제거 E2E를 테스트합니다.<br />**재실행:** `rerun_group=install-smoke`.                              |
| 크로스 OS           | **작업:** `cross_os_release_checks`<br />**지원 워크플로:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**테스트:** 후보 tarball과 기준 패키지를 사용해 선택한 제공자 및 모드에 대해 Linux, Windows, macOS의 신규 설치 및 업그레이드 레인을 테스트합니다.<br />**재실행:** `rerun_group=cross-os`.                                                                                       |
| 저장소 및 라이브 E2E | **작업:** `Run repo/live E2E validation`<br />**지원 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** `release_profile`로 선택된 저장소 E2E, 라이브 캐시, OpenAI websocket 스트리밍, 네이티브 라이브 제공자 및 Plugin 샤드, Docker 기반 라이브 모델/백엔드/Gateway 하네스를 테스트합니다.<br />**재실행:** `rerun_group=live-e2e`, 선택적으로 `live_suite_filter`와 함께. |
| Docker 릴리스 경로  | **작업:** `Run Docker release-path validation`<br />**지원 워크플로:** `OpenClaw Live And E2E Checks (Reusable)`<br />**테스트:** 공유 패키지 아티팩트를 대상으로 릴리스 경로 Docker 청크를 테스트합니다.<br />**재실행:** `rerun_group=live-e2e`.                                                                                                                                                   |
| Package Acceptance  | **작업:** `Run package acceptance`<br />**지원 워크플로:** `Package Acceptance`<br />**테스트:** 오프라인 Plugin 패키지 픽스처, Plugin 업데이트, 모의 OpenAI Telegram 패키지 승인, `2026.4.23` 이후의 모든 안정 npm 릴리스에서 동일한 tarball을 대상으로 한 게시 업그레이드 생존 검사를 테스트합니다.<br />**재실행:** `rerun_group=package`.                                                    |
| QA 패리티           | **작업:** `Run QA Lab parity lane` 및 `Run QA Lab parity report`<br />**지원 워크플로:** 직접 작업<br />**테스트:** 후보 및 기준 에이전트형 패리티 팩을 테스트한 다음 패리티 보고서를 테스트합니다.<br />**재실행:** `rerun_group=qa-parity` 또는 `rerun_group=qa`.                                                                                                                              |
| QA 라이브 Matrix    | **작업:** `Run QA Lab live Matrix lane`<br />**지원 워크플로:** 직접 작업<br />**테스트:** `qa-live-shared` 환경의 빠른 라이브 Matrix QA 프로필을 테스트합니다.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                  |
| QA 라이브 Telegram  | **작업:** `Run QA Lab live Telegram lane`<br />**지원 워크플로:** 직접 작업<br />**테스트:** Convex CI 자격 증명 임대를 사용한 라이브 Telegram QA를 테스트합니다.<br />**재실행:** `rerun_group=qa-live` 또는 `rerun_group=qa`.                                                                                                                                                                  |
| 릴리스 검증기       | **작업:** `Verify release checks`<br />**지원 워크플로:** 없음<br />**테스트:** 선택한 재실행 그룹에 필요한 릴리스 검사 작업을 테스트합니다.<br />**재실행:** 집중 하위 작업이 통과한 후 재실행합니다.                                                                                                                                                                                            |

## Docker 릴리스 경로 청크

Docker 릴리스 경로 단계는 `live_suite_filter`가 비어 있을 때 다음 청크를 실행합니다.

| 청크                                                            | 커버리지                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `core`                                                          | Core Docker 릴리스 경로 스모크 레인.                                   |
| `package-update-openai`                                         | OpenAI 패키지 설치 및 업데이트 동작.                                   |
| `package-update-anthropic`                                      | Anthropic 패키지 설치 및 업데이트 동작.                                |
| `package-update-core`                                           | 제공자 중립 패키지 및 업데이트 동작.                                   |
| `plugins-runtime-plugins`                                       | Plugin 동작을 실행하는 Plugin 런타임 레인.                             |
| `plugins-runtime-services`                                      | 서비스 기반 Plugin 런타임 레인. 요청된 경우 OpenWebUI를 포함합니다.    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 병렬 릴리스 검증을 위해 분할된 Plugin 설치/런타임 배치.                |

Docker 레인 하나만 실패한 경우 재사용 가능한 라이브/E2E 워크플로에서 대상 지정
`docker_lanes=<lane[,lane]>`를 사용합니다. 릴리스 아티팩트에는 사용 가능한 경우 패키지
아티팩트 및 이미지 재사용 입력이 포함된 레인별 재실행 명령이 들어 있습니다.

## 릴리스 프로필

`release_profile`은 주로 릴리스 검사 안의 라이브/제공자 범위를 제어합니다.
일반 전체 CI, Plugin 사전 릴리스, 설치 스모크, 패키지
승인, QA Lab 또는 Docker 릴리스 경로 청크를 제거하지는 않습니다. `full`은 또한
`rerun_group=all`일 때 우산 실행이 릴리스 패키지 아티팩트를 대상으로 패키지 Telegram E2E를 실행하게 하므로,
전체 사전 게시 후보가 해당 Telegram 패키지 레인을 조용히 건너뛰지 않습니다.

| 프로필    | 의도한 용도                      | 포함되는 라이브/제공자 범위                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 가장 빠른 릴리스 핵심 스모크.   | OpenAI/코어 라이브 경로, OpenAI용 Docker 라이브 모델, 네이티브 Gateway 코어, 네이티브 OpenAI Gateway 프로필, 네이티브 OpenAI Plugin, Docker 라이브 Gateway OpenAI.               |
| `stable`  | 기본 릴리스 승인 프로필. | `minimum`에 Anthropic, Google, MiniMax, 백엔드, 네이티브 라이브 테스트 하네스, Docker 라이브 CLI 백엔드, Docker ACP 바인드, Docker Codex 하네스, OpenCode Go 스모크 샤드가 추가됩니다. |
| `full`    | 광범위한 자문 스윕.             | `stable`에 자문 제공자, Plugin 라이브 샤드, 미디어 라이브 샤드가 추가됩니다.                                                                                                  |

## Full 전용 추가 항목

다음 스위트는 `stable`에서는 건너뛰고 `full`에 포함됩니다.

| 영역                             | Full 전용 범위                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 라이브 모델               | OpenCode Go, OpenRouter, xAI, Z.ai, Fireworks.                              |
| Docker 라이브 Gateway              | DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, Z.ai에 대한 자문 샤드. |
| 네이티브 Gateway 제공자 프로필 | Fireworks, DeepSeek, 전체 OpenCode Go 모델 샤드, OpenRouter, xAI, Z.ai.  |
| 네이티브 Plugin 라이브 샤드        | Plugins A-K, L-N, O-Z 기타, Moonshot, xAI.                                 |
| 네이티브 미디어 라이브 샤드         | 오디오, Google 음악, MiniMax 음악, 비디오 그룹 A-D.                       |

`stable`에는 `native-live-src-gateway-profiles-opencode-go-smoke`가 포함됩니다. `full`은
대신 더 넓은 OpenCode Go 모델 샤드를 사용합니다.

## 집중 재실행

관련 없는 릴리스 박스를 반복하지 않으려면 `rerun_group`을 사용하세요.

| 핸들              | 범위                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 모든 전체 릴리스 검증 단계.                                   |
| `ci`                | 수동 전체 CI 자식만.                                            |
| `plugin-prerelease` | Plugin 사전 릴리스 자식만.                                         |
| `release-checks`    | 모든 OpenClaw 릴리스 검사 단계.                                   |
| `install-smoke`     | 릴리스 검사를 통한 설치 스모크.                                 |
| `cross-os`          | 크로스 OS 릴리스 검사.                                              |
| `live-e2e`          | 저장소/라이브 E2E 및 Docker 릴리스 경로 검증.                     |
| `package`           | 패키지 승인.                                                   |
| `qa`                | QA 패리티와 QA 라이브 레인.                                         |
| `qa-parity`         | QA 패리티 레인과 보고서만.                                      |
| `qa-live`           | QA 라이브 Matrix와 Telegram만.                                     |
| `npm-telegram`      | 게시된 패키지 Telegram E2E. `npm_telegram_package_spec`가 필요합니다. |

하나의 라이브 스위트가 실패했을 때는 `rerun_group=live-e2e`와 함께 `live_suite_filter`를 사용하세요.
유효한 필터 ID는 재사용 가능한 라이브/E2E 워크플로에 정의되어 있으며,
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, 그리고
`live-codex-harness-docker`를 포함합니다.

## 보관할 증거

릴리스 수준 인덱스로 `Full Release Validation` 요약을 보관하세요. 이 요약은
자식 실행 ID로 연결되며 가장 느린 작업 표를 포함합니다. 실패 시에는 먼저 자식
워크플로를 검사한 다음, 위에서 가장 작은 일치 핸들을 재실행하세요.

유용한 아티팩트:

- `OpenClaw Release Checks`의 `release-package-under-test`
- `.artifacts/docker-tests/` 아래의 Docker 릴리스 경로 아티팩트
- 패키지 승인 `package-under-test` 및 Docker 승인 아티팩트
- 각 OS 및 스위트의 크로스 OS 릴리스 검사 아티팩트
- QA 패리티, Matrix, Telegram 아티팩트

## 워크플로 파일

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
