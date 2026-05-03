---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 승인 실행
    - 버전 명명 규칙과 주기를 찾는 중
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명, 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-05-03T21:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 라인이 있습니다.

- stable: 기본적으로 npm `beta`에 게시되거나 명시적으로 요청하면 npm `latest`에 게시되는 태그된 릴리스
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 명명

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- 베타 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일을 0으로 채우지 마세요
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `beta`는 현재 베타 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 검증된 베타 빌드를 나중에 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  베타 릴리스는 일반적으로 먼저 npm/패키지 경로를 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 안정 릴리스용으로 남겨둡니다

## 릴리스 주기

- 릴리스는 베타 우선으로 진행됩니다
- 안정 릴리스는 최신 베타가 검증된 후에만 이어집니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D` 브랜치에서 릴리스를 만들기 때문에,
  릴리스 검증과 수정이 `main`의 새로운 개발을 막지 않습니다
- 베타 태그가 푸시되었거나 게시되었고 수정이 필요한 경우, 유지관리자는 이전 베타 태그를 삭제하거나 다시 만드는 대신
  다음 `-beta.N` 태그를 만듭니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은
  유지관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 사항은 유지관리자 전용
릴리스 런북에 남겨둡니다.

1. 현재 `main`에서 시작합니다. 최신 변경 사항을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 정상인지 확인합니다.
2. 실제 커밋 기록을 기반으로 `/changelog`를 사용해 최상단 `CHANGELOG.md` 섹션을 다시 작성하고,
   항목을 사용자 지향으로 유지한 뒤 커밋하고, 푸시하고, 브랜치를 만들기 전에 한 번 더 리베이스/풀합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장될 때만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 만듭니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올리고,
   게시 가능한 Plugin 패키지가 릴리스 버전과 호환성 메타데이터를 공유하도록 `pnpm plugins:sync`를 실행한 다음, 로컬 결정적 프리플라이트를 실행합니다.
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, 그리고
   `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는,
   검증 전용 프리플라이트에 전체 40자 릴리스 브랜치 SHA를 사용할 수 있습니다.
   성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그, 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로 모든 프리릴리스 테스트를 시작합니다.
   이는 네 가지 큰 릴리스 테스트 박스인 Vitest, Docker, QA Lab, Package를 위한 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정이 입증되는 가장 작은 실패 파일, 라인, 워크플로 작업, 패키지 프로필, provider, 또는 model 허용 목록을 다시 실행합니다.
   변경된 표면 때문에 이전 증거가 무효화될 때만 전체 엄브렐라를 다시 실행합니다.
9. 베타의 경우 `vYYYY.M.D-beta.N`을 태그한 다음, 일치하는 `release/YYYY.M.D` 브랜치에서 `OpenClaw Release Publish`를 실행합니다.
   이 작업은 `pnpm plugins:sync:check`를 확인하고,
   먼저 게시 가능한 모든 Plugin 패키지를 npm에 게시하며, 두 번째로 같은 세트를 ClawPack npm-pack tarball로 ClawHub에 게시한 다음,
   일치하는 dist-tag로 준비된 OpenClaw npm 프리플라이트 아티팩트를 승격합니다. 게시 후에는 게시된 `openclaw@YYYY.M.D-beta.N` 또는
   `openclaw@beta` 패키지에 대해 게시 후 패키지
   수락 검사를 실행합니다. 푸시되었거나 게시된 프리릴리스에 수정이 필요하면,
   다음으로 일치하는 프리릴리스 번호를 만드세요. 이전 프리릴리스를 삭제하거나 다시 쓰지 마세요.
10. 안정 릴리스의 경우, 검증된 베타 또는 릴리스 후보가 필요한 검증 증거를 갖춘 후에만 계속합니다.
    안정 npm 게시도 `OpenClaw Release Publish`를 통해 진행되며,
    `preflight_run_id`로 성공한 프리플라이트 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비 상태에는
    패키징된 `.zip`, `.dmg`, `.dSYM.zip`과 `main`의 업데이트된 `appcast.xml`도 필요합니다.
11. 게시 후에는 npm 게시 후 검증기, 게시 후 채널 증거가 필요할 때 선택적으로 독립 실행형
    게시된-npm Telegram E2E, 필요 시 dist-tag 승격, 일치하는 전체 `CHANGELOG.md` 섹션의 GitHub 릴리스/프리릴리스 노트,
    그리고 릴리스 공지 단계를 실행합니다.

## 릴리스 프리플라이트

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 더 빠른 로컬 `pnpm check` 게이트 밖에서도 테스트 TypeScript가 계속 적용되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 통과하도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack 검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다
- 루트 버전 범프 후, 태그 지정 전에 `pnpm plugins:sync`를 실행합니다. 이 명령은 게시 가능한 Plugin 패키지 버전, OpenClaw 피어/API 호환성 메타데이터, 빌드 메타데이터, Plugin 변경 로그 스텁을 코어 릴리스 버전에 맞게 업데이트합니다. `pnpm plugins:sync:check`는 변경하지 않는 릴리스 가드입니다. 이 단계를 잊은 경우, 게시 워크플로는 레지스트리 변경 전에 실패합니다.
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 모든 사전 릴리스 테스트 박스를 하나의 진입점에서 시작합니다. 이 워크플로는 브랜치, 태그 또는 전체 커밋 SHA를 받고, 수동 `CI`를 디스패치하며, 설치 스모크, 패키지 승인, Docker 릴리스 경로 스위트, 라이브/E2E, OpenWebUI, QA Lab 패리티, Matrix, Telegram 레인을 위한 `OpenClaw Release Checks`를 디스패치합니다. `release_profile=full` 및 `rerun_group=all`을 사용하면, 릴리스 검사에서 생성된 `release-package-under-test` 아티팩트를 대상으로 패키지 Telegram E2E도 실행합니다. 게시 후 같은 Telegram E2E가 게시된 npm 패키지도 검증해야 하는 경우 `npm_telegram_package_spec`을 제공합니다. 게시 후 Package Acceptance가 SHA로 빌드된 아티팩트 대신 배포된 npm 패키지를 대상으로 패키지/업데이트 매트릭스를 실행해야 하는 경우 `package_acceptance_package_spec`을 제공합니다. Telegram E2E를 강제하지 않고 비공개 증거 보고서가 검증 대상이 게시된 npm 패키지와 일치함을 증명해야 하는 경우 `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 릴리스 작업이 계속되는 동안 패키지 후보에 대한 사이드 채널 증거가 필요할 때 수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@beta`, `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용하고, 현재 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치/태그/SHA를 pack하려면 `source=ref`를 사용하며, 필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용하거나, 다른 GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다. 이 워크플로는 후보를 `package-under-test`로 해석하고, 해당 tarball을 대상으로 Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 같은 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택된 Docker 레인에 `published-upgrade-survivor`가 포함된 경우, 패키지 아티팩트가 후보가 되고 `published_upgrade_survivor_baseline`이 게시된 기준 버전을 선택합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 프로필:
  - `smoke`: 설치/채널/에이전트, Gateway 네트워크 및 구성 다시 로드 레인
  - `package`: OpenWebUI 또는 라이브 ClawHub 없는 아티팩트 네이티브 패키지/업데이트/Plugin 레인
  - `product`: 패키지 프로필에 MCP 채널, cron/subagent 정리, OpenAI 웹 검색 및 OpenWebUI 추가
  - `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택
- 릴리스 후보에 대한 전체 일반 CI 적용 범위만 필요할 때는 수동 `CI` 워크플로를 직접 실행합니다. 수동 CI 디스패치는 변경 범위 지정을 우회하고 Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Android, Control UI i18n 레인을 강제로 실행합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- 릴리스 텔레메트리를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은 로컬 OTLP/HTTP 수신기를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 수집기 없이 내보낸 trace span 이름, 제한된 속성, 콘텐츠/식별자 수정 처리를 검증합니다.
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행합니다
- 태그가 존재한 후 변경을 수행하는 게시 순서에는 `OpenClaw Release Publish`를 실행합니다. `release/YYYY.M.D`에서 디스패치하고(`main`에서 도달 가능한 태그를 게시할 때는 `main`), 릴리스 태그와 성공한 OpenClaw npm `preflight_run_id`를 전달하며, 의도적으로 집중 복구를 실행하는 경우가 아니라면 기본 Plugin 게시 범위 `all-publishable`을 유지합니다. 이 워크플로는 Plugin npm 게시, Plugin ClawHub 게시, OpenClaw npm 게시를 직렬화하여 외부화된 Plugin보다 코어 패키지가 먼저 게시되지 않도록 합니다.
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock 패리티 레인과 빠른 라이브 Matrix 프로필 및 Telegram QA 레인도 실행합니다. 라이브 레인은 `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 임대도 사용합니다. 전체 Matrix 전송, 미디어, E2EE 인벤토리를 병렬로 실행하려면 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` 워크플로를 실행합니다.
- Cross-OS 설치 및 업그레이드 런타임 검증은 공개 `OpenClaw Release Checks` 및 `Full Release Validation`의 일부이며, 이들은 재사용 가능 워크플로 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 아티팩트 중심으로 유지하고, 더 느린 라이브 검사는 자체 레인에 두어 게시를 지연하거나 차단하지 않도록 합니다
- 비밀을 포함하는 릴리스 검사는 `Full Release Validation`을 통해 또는 `main`/릴리스 워크플로 ref에서 디스패치하여 워크플로 로직과 비밀이 통제되도록 해야 합니다
- `OpenClaw Release Checks`는 해석된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능한 한 브랜치, 태그 또는 전체 커밋 SHA를 받습니다
- `OpenClaw NPM Release` 검증 전용 사전 점검은 푸시된 태그 없이도 현재 전체 40자 워크플로 브랜치 커밋 SHA를 받습니다
- 해당 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 검사에만 `v<package.json version>`을 합성합니다. 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 게시 및 승격 경로는 GitHub 호스팅 러너에서 유지하고, 변경하지 않는 검증 경로는 더 큰 Blacksmith Linux 러너를 사용할 수 있습니다
- 해당 워크플로는 `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` 워크플로 비밀을 모두 사용하여
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 일치하는 beta/correction 태그)를 실행합니다
- npm 게시 후, 새로운 임시 prefix에서 게시된 레지스트리 설치 경로를 검증하려면
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 일치하는 beta/correction 버전)를 실행합니다
- beta 게시 후, 공유 임대 Telegram 자격 증명 풀을 사용하여 게시된 npm 패키지에 대해 설치된 패키지 온보딩, Telegram 설정 및 실제 Telegram E2E를 검증하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행합니다. 로컬 메인테이너의 일회성 실행은 Convex 변수를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env 자격 증명을 직접 전달할 수 있습니다.
- 메인테이너는 수동 `NPM Telegram Beta E2E` 워크플로를 통해 GitHub Actions에서 같은 게시 후 검사를 실행할 수 있습니다. 이는 의도적으로 수동 전용이며 모든 merge마다 실행되지 않습니다.
- 메인테이너 릴리스 자동화는 이제 사전 점검 후 승격 방식을 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 필요합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 같은 `main` 또는 `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - 안정 npm 릴리스는 기본적으로 `beta`를 사용합니다
  - 안정 npm 게시는 워크플로 입력을 통해 명시적으로 `latest`를 대상으로 할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제 보안을 위해 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하지만 공개 저장소는 OIDC 전용 게시를 유지하기 때문입니다
  - 공개 `macOS Release`는 검증 전용입니다. 태그가 릴리스 브랜치에만 있고 워크플로가 `main`에서 디스패치되는 경우 `public_release_branch=release/YYYY.M.D`를 설정합니다
  - 실제 비공개 mac 게시에는 성공한 비공개 mac `preflight_run_id` 및 `validate_run_id`가 필요합니다
  - 실제 게시 경로는 다시 빌드하지 않고 준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 안정 correction 릴리스의 경우, 게시 후 검증기는 `YYYY.M.D`에서 `YYYY.M.D-N`으로의 같은 임시 prefix 업그레이드 경로도 확인하여 릴리스 correction이 이전 전역 설치를 기본 안정 페이로드에 조용히 남겨두지 못하게 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` 페이로드가 모두 포함되어 있지 않으면 닫힌 상태로 실패하므로, 빈 브라우저 대시보드를 다시 배포하지 않습니다
- 게시 후 검증은 게시된 Plugin entrypoint와 패키지 메타데이터가 설치된 레지스트리 레이아웃에 존재하는지도 확인합니다. 누락된 Plugin 런타임 페이로드를 배포하는 릴리스는 postpublish 검증기에 실패하며 `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball에 npm pack `unpackedSize` 예산도 적용하므로, 설치 프로그램 e2e가 릴리스 게시 경로 전에 의도치 않은 pack 비대를 포착합니다
- 릴리스 작업이 CI 계획, 확장 타이밍 매니페스트 또는 확장 테스트 매트릭스를 건드린 경우, 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner 소유 `plugin-prerelease-extension-shard` 매트릭스 출력을 다시 생성하고 검토하여 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않도록 합니다
- 안정 macOS 릴리스 준비에는 updater 표면도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - 게시 후 `main`의 `appcast.xml`은 새 안정 zip을 가리켜야 합니다
  - 패키징된 앱은 non-debug bundle id, 비어 있지 않은 Sparkle feed URL, 그리고 해당 릴리스 버전의 표준 Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 빠르게 움직이는 브랜치에서 고정된 커밋 증거가 필요하면, 모든 하위 워크플로가 대상 SHA에 고정된 임시 브랜치에서 실행되도록 helper를 사용합니다:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper는 `release-ci/<sha>-...`를 푸시하고, 해당 브랜치에서 `ref=<sha>`로 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로의 `headSha`가 대상과 일치하는지 검증한 다음 임시 브랜치를 삭제합니다. 이렇게 하면 실수로 더 새로운 `main` 하위 실행을 증명하는 일을 피할 수 있습니다.

릴리스 브랜치 또는 태그 검증의 경우, 신뢰할 수 있는 `main` 워크플로 ref에서 실행하고 릴리스 브랜치 또는 태그를 `ref`로 전달합니다:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

워크플로는 대상 ref를 확인하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, 패키지 대상 검사에 사용할 부모 `release-package-under-test` 아티팩트를 준비하며, `release_profile=full`이고 `rerun_group=all`이거나 `npm_telegram_package_spec`이 설정된 경우 독립 실행형 패키지 Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 설치 스모크, 교차 OS 릴리스 검사, 라이브/E2E Docker 릴리스 경로 커버리지, Telegram 패키지 QA가 포함된 패키지 승인, QA Lab 패리티, 라이브 Matrix, 라이브 Telegram으로 확장 실행됩니다. 전체 실행은 `Full Release Validation` 요약에서 `normal_ci`와 `release_checks`가 성공으로 표시될 때만 허용됩니다. full/all 모드에서는 `npm_telegram` 자식도 성공해야 합니다. full/all이 아닌 경우 게시된 `npm_telegram_package_spec`이 제공되지 않는 한 건너뜁니다. 최종 검증기 요약에는 각 자식 실행의 가장 느린 작업 테이블이 포함되어 릴리스 관리자가 로그를 다운로드하지 않고도 현재 핵심 경로를 확인할 수 있습니다.
전체 단계 매트릭스, 정확한 워크플로 작업 이름, stable 프로필과 full 프로필의 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참고하세요.
자식 워크플로는 `Full Release Validation`을 실행하는 신뢰할 수 있는 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 대상 `ref`가 더 오래된 릴리스 브랜치나 태그를 가리키는 경우에도 마찬가지입니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. 워크플로 실행 ref를 선택하여 신뢰할 수 있는 하네스를 선택하세요.
이동하는 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 ref가 될 수 없으므로 `pnpm ci:full-release --sha <sha>`를 사용해 고정된 임시 브랜치를 생성하세요.

라이브/제공자 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/코어 라이브 및 Docker 경로
- `stable`: 릴리스 승인을 위한 minimum에 stable 제공자/백엔드 커버리지 추가
- `full`: stable에 광범위한 권고 제공자/미디어 커버리지 추가

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용해 대상 ref를 한 번 `release-package-under-test`로 확인하고, 해당 아티팩트를 릴리스 경로 Docker 검사와 패키지 승인 모두에서 재사용합니다. 이렇게 하면 모든 패키지 대상 박스가 동일한 바이트를 사용하고 반복적인 패키지 빌드를 피할 수 있습니다.
교차 OS OpenAI 설치 스모크는 repo/org 변수가 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 레인은 가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작, 라이브 에이전트 턴 하나를 증명하기 때문입니다. 더 넓은 라이브 제공자 매트릭스는 모델별 커버리지를 위한 위치로 유지됩니다.

릴리스 단계에 따라 다음 변형을 사용하세요.

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

집중 수정 후 첫 재실행으로 전체 엄브렐라를 사용하지 마세요. 하나의 박스가 실패하면 다음 증명에는 실패한 자식 워크플로, 작업, Docker 레인, 패키지 프로필, 모델 제공자, 또는 QA 레인을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전의 전체 박스 증거를 오래된 것으로 만든 경우에만 전체 엄브렐라를 다시 실행하세요. 엄브렐라의 최종 검증기는 기록된 자식 워크플로 실행 ID를 다시 확인하므로, 자식 워크플로가 성공적으로 재실행된 후에는 실패한 부모 `Verify full validation` 작업만 재실행하세요.

제한된 복구에는 엄브렐라에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 자식만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 자식만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다. 집중 `npm-telegram` 재실행에는 `npm_telegram_package_spec`이 필요합니다. `release_profile=full`인 full/all 실행은 release-checks 패키지 아티팩트를 사용합니다.

### Vitest

Vitest 박스는 수동 `CI` 자식 워크플로입니다. 수동 CI는 의도적으로 변경 범위 지정을 우회하고 릴리스 후보에 대해 일반 테스트 그래프를 강제합니다. Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python Skills, Windows, macOS, Android, Control UI i18n이 포함됩니다.

"소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답하려면 이 박스를 사용하세요. 이는 릴리스 경로 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 성공한 `CI` 실행
- 회귀를 조사할 때 CI 작업에서 실패했거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정론적인 일반 CI가 필요하지만 Docker, QA Lab, 라이브, 교차 OS, 또는 패키지 박스가 필요하지 않은 경우에만 수동 CI를 직접 실행하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`과 릴리스 모드 `install-smoke` 워크플로를 통해 `OpenClaw Release Checks` 안에 있습니다. 이는 소스 수준 테스트만이 아니라 패키징된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용, QR, root/gateway, installer/Bun 스모크 작업은 별도 install-smoke 샤드로 실행
- 저장소 E2E 레인
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청 시 `plugins-runtime-services` 청크 내부의 OpenWebUI 커버리지
- `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지 분할된 번들 Plugin 설치/제거 레인
- 릴리스 검사가 라이브 스위트를 포함할 때 라이브/E2E 제공자 스위트 및 Docker 라이브 모델 커버리지

재실행하기 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 레인 로그, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 청크를 재실행하는 대신 재사용 가능한 라이브/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`을 사용하세요. 생성된 재실행 명령에는 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로 실패한 레인이 동일한 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 별개인 에이전트 동작 및 채널 수준 릴리스 게이트입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- 에이전트 패리티 팩을 사용해 OpenAI 후보 레인을 Opus 4.6 기준선과 비교하는 mock 패리티 레인
- `qa-live-shared` 환경을 사용하는 빠른 라이브 Matrix QA 프로필
- Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA 레인
- 릴리스 텔레메트리에 명시적 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`

"릴리스가 QA 시나리오와 라이브 채널 흐름에서 올바르게 동작하는가?"에 답하려면 이 박스를 사용하세요. 릴리스를 승인할 때 패리티, Matrix, Telegram 레인의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 레인이 아니라 수동 샤딩 QA-Lab 실행으로 계속 사용할 수 있습니다.

### 패키지

패키지 박스는 설치 가능한 제품 게이트입니다. 이는 `Package Acceptance`와 resolver `scripts/resolve-openclaw-package-candidate.mjs`를 기반으로 합니다. resolver는 후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치, 태그, 또는 전체 커밋 SHA를 패킹
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, `telegram_mode=mock-openai`로 패키지 승인을 실행합니다. 패키지 승인은 마이그레이션, 업데이트, 오래된 Plugin 종속성 정리, 오프라인 Plugin 픽스처, Plugin 업데이트, Telegram 패키지 QA를 동일하게 확인된 tarball에 대해 유지합니다. 업그레이드 매트릭스는 `2026.4.23`부터 `latest`까지 npm에 게시된 모든 stable 기준선을 포괄합니다. 이미 출시된 후보에는 `source=npm`으로 패키지 승인을 사용하고, 게시 전 SHA 기반 로컬 npm tarball에는 `source=ref`/`source=artifact`를 사용하세요. 이는 이전에 Parallels가 필요했던 대부분의 패키지/업데이트 커버리지를 대체하는 GitHub 네이티브 방식입니다. 교차 OS 릴리스 검사는 OS별 온보딩, 설치 관리자, 플랫폼 동작에 여전히 중요하지만, 패키지/업데이트 제품 검증은 패키지 승인을 우선해야 합니다.

업데이트 및 Plugin 검증을 위한 표준 체크리스트는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)입니다. Plugin 설치/업데이트, doctor 정리, 또는 게시된 패키지 마이그레이션 변경을 증명하는 로컬, Docker, 패키지 승인, 또는 release-check 레인을 결정할 때 사용하세요. 모든 stable `2026.4.23+` 패키지에서 게시된 업데이트 마이그레이션을 포괄적으로 수행하는 것은 Full Release CI의 일부가 아니라 별도의 수동 `Update Migration` 워크플로입니다.

레거시 package-acceptance 완화는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의 패키지는 이미 npm에 게시된 메타데이터 공백에 대해 호환성 경로를 사용할 수 있습니다. tarball에 누락된 private QA 인벤토리 항목, 누락된 `gateway install --wrapper`, tarball 파생 git 픽스처에 누락된 패치 파일, 누락된 영속 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된 marketplace 설치 기록 영속성, `plugins update` 중 config 메타데이터 마이그레이션이 포함됩니다. 게시된 `2026.4.26` 패키지는 이미 출시된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 패키지 계약을 충족해야 하며, 동일한 공백은 릴리스 검증에서 실패합니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것이라면 더 넓은 패키지 승인 프로필을 사용하세요.

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

일반 패키지 프로필:

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크, 구성
  다시 로드 레인
- `package`: 라이브 ClawHub 없이 설치/업데이트/Plugin 패키지 계약을 확인합니다. 이것이 릴리스 검사
  기본값입니다.
- `product`: `package`에 MCP 채널, cron/subagent 정리, OpenAI 웹
  검색, OpenWebUI를 더한 항목
- `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명을 위해 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는 확인된
`package-under-test` tarball을 Telegram 레인으로 전달합니다. 독립 실행형
Telegram 워크플로는 게시 후 검사를 위해 게시된 npm 명세도 계속 허용합니다.

## 릴리스 게시 자동화

`OpenClaw Release Publish`는 일반적인 변경 적용 게시 진입점입니다. 이 워크플로는
릴리스에 필요한 순서대로 trusted-publisher 워크플로를 오케스트레이션합니다.

1. 릴리스 태그를 체크아웃하고 해당 커밋 SHA를 확인합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다.
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로
   `Plugin NPM Release`를 디스패치합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 디스패치합니다.
6. 릴리스 태그, npm dist-tag, 저장된 `preflight_run_id`로
   `OpenClaw NPM Release`를 디스패치합니다.

베타 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

기본 beta dist-tag로 안정 릴리스 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest`로 직접 안정 승격하는 것은 명시적입니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

하위 수준 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는
집중 복구 또는 재게시 작업에만 사용하세요. 선택한 Plugin 복구의 경우
`plugin_publish_scope=selected` 및 `plugins=@openclaw/name`을
`OpenClaw Release Publish`에 전달하거나, OpenClaw 패키지를 게시하면 안 되는 경우
자식 워크플로를 직접 디스패치하세요.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 운영자가 제어하는 다음 입력을 허용합니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1` 또는
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다. `preflight_only=true`일 때는 검증 전용 preflight를 위해 현재의
  전체 40자 워크플로 브랜치 커밋 SHA도 사용할 수 있습니다.
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로에는 `false`
- `preflight_run_id`: 실제 게시 경로에서 필요하며, 워크플로가 성공한 preflight 실행에서 준비된 tarball을 재사용하도록 합니다.
- `npm_dist_tag`: 게시 경로의 npm 대상 태그입니다. 기본값은 `beta`입니다.

`OpenClaw Release Publish`는 운영자가 제어하는 다음 입력을 허용합니다.

- `tag`: 필수 릴리스 태그입니다. 이미 존재해야 합니다.
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` preflight 실행 ID입니다.
  `publish_openclaw_npm=true`일 때 필요합니다.
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. 집중 복구 작업에만
  `selected`를 사용하세요.
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분한 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 Plugin 전용 복구 오케스트레이터로 사용할 때만
  `false`로 설정하세요.

`OpenClaw Release Checks`는 운영자가 제어하는 다음 입력을 허용합니다.

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA입니다. 시크릿을 사용하는 검사는
  확인된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 하나로 게시할 수 있습니다.
- 베타 사전 릴리스 태그는 `beta`로만 게시할 수 있습니다.
- `OpenClaw NPM Release`에서 전체 커밋 SHA 입력은 `preflight_only=true`일 때만 허용됩니다.
- `OpenClaw Release Checks`와 `Full Release Validation`은 항상 검증 전용입니다.
- 실제 게시 경로는 preflight 중에 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  워크플로는 게시를 계속하기 전에 해당 메타데이터를 확인합니다.

## 안정 npm 릴리스 순서

안정 npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다.
   - 태그가 존재하기 전에는 preflight 워크플로의 검증 전용 드라이 런을 위해 현재 전체 워크플로 브랜치 커밋
     SHA를 사용할 수 있습니다.
2. 일반적인 beta-first 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 안정 게시를 원하는 경우에만
   `latest`를 선택합니다.
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab,
   Matrix, Telegram 범위를 함께 원할 때 릴리스 브랜치, 릴리스 태그 또는 전체
   커밋 SHA에서 `Full Release Validation`을 실행합니다.
4. 결정론적인 일반 테스트 그래프만 의도적으로 필요한 경우, 대신 릴리스 ref에서
   수동 `CI` 워크플로를 실행합니다.
5. 성공한 `preflight_run_id`를 저장합니다.
6. 동일한 `tag`, 동일한 `npm_dist_tag`, 저장된 `preflight_run_id`로
   `OpenClaw Release Publish`를 실행합니다. 이 워크플로는 OpenClaw npm 패키지를 승격하기 전에 외부화된 Plugin을 npm과 ClawHub에 게시합니다.
7. 릴리스가 `beta`에 올라갔다면 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 안정 버전을 `beta`에서 `latest`로 승격합니다.
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 안정 빌드를 따라야 한다면,
   동일한 비공개 워크플로를 사용해 두 dist-tag가 모두 안정 버전을 가리키도록 하거나, 예약된
   자체 복구 동기화가 나중에 `beta`를 이동하도록 둡니다.

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하기 때문에 보안을 위해 비공개 저장소에 있으며,
공개 저장소는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta-first 승격 경로가 모두 문서화되고 운영자가 볼 수 있습니다.

관리자가 로컬 npm 인증으로 대체해야 하는 경우, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행하세요. 메인 에이전트 셸에서 `op`를
직접 호출하지 마세요. tmux 안에 두면 프롬프트,
알림, OTP 처리를 관찰할 수 있고 반복되는 호스트 알림을 방지할 수 있습니다.

## 공개 참조

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

관리자는 실제 실행 지침에
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의 비공개 릴리스 문서를 사용합니다.

## 관련

- [릴리스 채널](/ko/install/development-channels)
