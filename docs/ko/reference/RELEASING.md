---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 수락 실행
    - 버전 명명 방식과 릴리스 주기 찾기
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-05-02T21:12:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 네 가지 공개 릴리스 레인이 있습니다.

- stable: 기본적으로 npm `beta`에 게시되거나 명시적으로 요청된 경우 npm `latest`에 게시되는 태그된 릴리스
- alpha: npm `alpha`에 게시되는 프리릴리스 태그
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 이름 지정

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Alpha 프리릴리스 버전: `YYYY.M.D-alpha.N`
  - Git 태그: `vYYYY.M.D-alpha.N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일은 0으로 채우지 마세요
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `alpha`는 현재 alpha 설치 대상을 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  beta 릴리스는 일반적으로 먼저 npm/패키지 경로를 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 안정 릴리스용으로 남겨 둡니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- 안정 릴리스는 최신 beta가 검증된 후에만 뒤따릅니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D` 브랜치에서
  릴리스를 만듭니다. 따라서 릴리스 검증과 수정이 `main`의 새
  개발을 막지 않습니다
- beta 태그가 푸시되었거나 게시된 뒤 수정이 필요한 경우, 유지관리자는
  이전 beta 태그를 삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 만듭니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 노트는
  유지관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 정보는 유지관리자 전용
릴리스 런북에 보관됩니다.

1. 현재 `main`에서 시작합니다. 최신 변경 사항을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 정상인지 확인합니다.
2. 실제 커밋 기록을 기반으로 `/changelog`로 최상단 `CHANGELOG.md` 섹션을 다시 작성하고,
   항목을 사용자 지향적으로 유지한 뒤 커밋하고 푸시한 다음, 브랜치하기 전에
   한 번 더 rebase/pull합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장되는 경우에만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 생성합니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올리고,
   게시 가능한 Plugin 패키지가 릴리스 버전과 호환성 메타데이터를 공유하도록 `pnpm plugins:sync`를 실행한 다음, 로컬 결정적 사전 검사를 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, 그리고
   `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   검증 전용 사전 검사에 전체 40자 릴리스 브랜치 SHA를 사용할 수 있습니다.
   성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로
   모든 프리릴리스 테스트를 시작합니다. 이는 네 가지 큰 릴리스 테스트 박스인
   Vitest, Docker, QA Lab, Package의 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정을 증명하는 가장 작은 실패
   파일, 레인, 워크플로 작업, 패키지 프로필, provider 또는 모델 허용 목록을 다시 실행합니다.
   변경된 표면 때문에 이전 증거가 오래된 경우에만 전체 umbrella를 다시 실행합니다.
9. alpha 또는 beta의 경우 `vYYYY.M.D-alpha.N` 또는 `vYYYY.M.D-beta.N`으로 태그한 다음, 일치하는
   `release/YYYY.M.D` 브랜치에서 `OpenClaw Release Publish`를 실행합니다. 이는 `pnpm plugins:sync:check`를 검증하고,
   게시 가능한 모든 Plugin 패키지를 먼저 npm에 게시하며, 같은
   세트를 두 번째로 ClawHub에 게시한 뒤, 일치하는 dist-tag로 준비된 OpenClaw npm 사전 검사
   아티팩트를 승격합니다. 게시 후에는 게시된 `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` 또는 `openclaw@beta` 패키지에 대해 게시 후 패키지
   수락 검사를 실행합니다. 푸시되었거나 게시된 프리릴리스에 수정이 필요한 경우,
   다음으로 일치하는 프리릴리스 번호를 만드세요.
   이전 프리릴리스를 삭제하거나 다시 작성하지 마세요.
10. 안정 릴리스의 경우, 검증된 beta 또는 릴리스 후보에 필요한
    검증 증거가 있을 때만 계속합니다. 안정 npm 게시도
    `OpenClaw Release Publish`를 통해 진행되며, `preflight_run_id`로
    성공한 사전 검사 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비 상태에는
    패키징된 `.zip`, `.dmg`, `.dSYM.zip` 및 `main`의 업데이트된 `appcast.xml`도 필요합니다.
11. 게시 후 npm 게시 후 검증기를 실행하고, 게시 후 채널 증거가 필요할 때 선택 사항인 독립 실행형
    published-npm Telegram E2E를 실행하며,
    필요할 때 dist-tag 승격, 완전하게 일치하는 `CHANGELOG.md` 섹션의 GitHub 릴리스/프리릴리스 노트,
    그리고 릴리스 공지
    단계를 수행합니다.

## 릴리스 사전 검사

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 적용되도록 합니다.
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import 사이클 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 통과하도록 합니다.
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack 검증 단계에 필요한 `dist/*` 릴리스 산출물과 Control UI 번들이 존재하도록 합니다.
- 루트 버전 범프 후, 태그 지정 전에 `pnpm plugins:sync`를 실행합니다. 이 명령은 게시 가능한 Plugin 패키지 버전, OpenClaw 피어/API 호환성 메타데이터, 빌드 메타데이터, Plugin 변경 로그 스텁을 핵심 릴리스 버전에 맞게 업데이트합니다. `pnpm plugins:sync:check`는 변경하지 않는 릴리스 가드입니다. 이 단계를 잊으면 게시 워크플로가 레지스트리 변경 전에 실패합니다.
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 하나의 진입점에서 모든 사전 릴리스 테스트 박스를 시작합니다. 브랜치, 태그 또는 전체 커밋 SHA를 입력으로 받으며, 수동 `CI`를 디스패치하고 설치 스모크, 패키지 수락, Docker 릴리스 경로 스위트, 라이브/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram 레인을 위한 `OpenClaw Release Checks`를 디스패치합니다. `release_profile=full` 및 `rerun_group=all`을 사용하면 릴리스 검사에서 생성된 `release-package-under-test` 산출물에 대해 패키지 Telegram E2E도 실행합니다. 게시 후 동일한 Telegram E2E로 게시된 npm 패키지도 검증해야 하면 `npm_telegram_package_spec`을 제공합니다. 게시 후 Package Acceptance가 SHA로 빌드한 산출물 대신 배포된 npm 패키지에 대해 패키지/업데이트 매트릭스를 실행해야 하면 `package_acceptance_package_spec`을 제공합니다. Telegram E2E를 강제하지 않고 비공개 증거 보고서가 검증 대상이 게시된 npm 패키지와 일치함을 증명해야 하면 `evidence_package_spec`을 제공합니다. 예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 릴리스 작업이 계속되는 동안 패키지 후보에 대한 사이드 채널 증거가 필요하면 수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용하고, 현재 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치/태그/SHA를 pack하려면 `source=ref`를 사용하며, 필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용하고, 다른 GitHub Actions 실행이 업로드한 tarball에는 `source=artifact`를 사용합니다. 이 워크플로는 후보를 `package-under-test`로 해석하고, 해당 tarball에 대해 Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 같은 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택한 Docker 레인에 `published-upgrade-survivor`가 포함되면 패키지 산출물이 후보가 되고 `published_upgrade_survivor_baseline`은 게시된 기준선을 선택합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 프로필:
  - `smoke`: 설치/채널/에이전트, Gateway 네트워크, 구성 리로드 레인
  - `package`: OpenWebUI 또는 라이브 ClawHub 없는 산출물 네이티브 패키지/업데이트/Plugin 레인
  - `product`: 패키지 프로필에 MCP 채널, cron/하위 에이전트 정리, OpenAI 웹 검색, OpenWebUI를 더한 프로필
  - `full`: OpenWebUI를 포함한 Docker 릴리스 경로 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택
- 릴리스 후보에 대해 전체 일반 CI 적용 범위만 필요하면 수동 `CI` 워크플로를 직접 실행합니다. 수동 CI 디스패치는 변경 범위 지정을 우회하고 Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Android, Control UI i18n 레인을 강제로 실행합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- 릴리스 텔레메트리를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은 로컬 OTLP/HTTP 수신기를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 collector 없이 내보낸 trace span 이름, 제한된 속성, 콘텐츠/식별자 redaction을 검증합니다.
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행합니다.
- 태그가 존재한 후 변경을 수행하는 게시 순서에는 `OpenClaw Release Publish`를 실행합니다. `release/YYYY.M.D`에서 디스패치하거나, main에서 접근 가능한 태그를 게시할 때는 `main`에서 디스패치하고, 릴리스 태그와 성공한 OpenClaw npm `preflight_run_id`를 전달하며, 의도적으로 집중 복구를 실행하는 경우가 아니면 기본 Plugin 게시 범위 `all-publishable`을 유지합니다. 이 워크플로는 Plugin npm 게시, Plugin ClawHub 게시, OpenClaw npm 게시를 직렬화하여 핵심 패키지가 외부화된 Plugin보다 먼저 게시되지 않도록 합니다.
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity 레인과 빠른 라이브 Matrix 프로필 및 Telegram QA 레인도 실행합니다. 라이브 레인은 `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 lease도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 확인하려면 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` 워크플로를 실행합니다.
- 교차 OS 설치 및 업그레이드 런타임 검증은 공개 `OpenClaw Release Checks`와 `Full Release Validation`의 일부이며, 재사용 가능한 워크플로 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다.
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 산출물 중심으로 유지하고, 더 느린 라이브 검사는 자체 레인에 두어 게시를 지연하거나 차단하지 않게 합니다.
- 비밀을 포함하는 릴리스 검사는 `Full Release Validation`을 통해 디스패치하거나 `main`/릴리스 워크플로 ref에서 디스패치하여 워크플로 로직과 비밀이 통제되도록 해야 합니다.
- `OpenClaw Release Checks`는 해석된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 접근 가능하기만 하면 브랜치, 태그 또는 전체 커밋 SHA를 받습니다.
- `OpenClaw NPM Release` 검증 전용 사전 점검도 푸시된 태그를 요구하지 않고 현재 전체 40자 워크플로 브랜치 커밋 SHA를 받습니다.
- 이 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다.
- SHA 모드에서 워크플로는 패키지 메타데이터 검사에만 `v<package.json version>`을 합성합니다. 실제 게시는 여전히 실제 릴리스 태그가 필요합니다.
- 두 워크플로 모두 실제 게시 및 승격 경로는 GitHub 호스팅 runner에 유지하고, 변경하지 않는 검증 경로는 더 큰 Blacksmith Linux runner를 사용할 수 있습니다.
- 해당 워크플로는 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 비밀을 모두 사용하여 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 실행합니다.
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다.
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`(또는 일치하는 beta/correction 태그)를 실행합니다.
- npm 게시 후, 새 임시 prefix에서 게시된 레지스트리 설치 경로를 검증하려면 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`(또는 일치하는 beta/correction 버전)를 실행합니다.
- beta 게시 후, 공유 leased Telegram 자격 증명 풀을 사용하여 게시된 npm 패키지에 대한 설치 패키지 온보딩, Telegram 설정, 실제 Telegram E2E를 검증하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행합니다. 로컬 maintainer 단발 실행은 Convex 변수를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env 자격 증명을 직접 전달할 수 있습니다.
- Maintainer는 수동 `NPM Telegram Beta E2E` 워크플로를 통해 GitHub Actions에서 동일한 게시 후 검사를 실행할 수 있습니다. 이는 의도적으로 수동 전용이며 모든 merge마다 실행되지 않습니다.
- Maintainer 릴리스 자동화는 이제 사전 점검 후 승격 방식을 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 필요합니다.
  - 실제 npm 게시는 성공한 사전 점검 실행과 동일한 `main` 또는 `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다.
  - stable npm 릴리스의 기본값은 `beta`입니다.
  - stable npm 게시는 워크플로 입력을 통해 명시적으로 `latest`를 대상으로 할 수 있습니다.
  - 토큰 기반 npm dist-tag 변경은 이제 보안을 위해 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. 공개 repo는 OIDC 전용 게시를 유지하지만 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다.
  - 공개 `macOS Release`는 검증 전용입니다. 태그가 릴리스 브랜치에만 있지만 워크플로가 `main`에서 디스패치되는 경우 `public_release_branch=release/YYYY.M.D`를 설정합니다.
  - 실제 비공개 mac 게시는 성공한 비공개 mac `preflight_run_id` 및 `validate_run_id`가 필요합니다.
  - 실제 게시 경로는 산출물을 다시 빌드하는 대신 준비된 산출물을 승격합니다.
- `YYYY.M.D-N` 같은 stable correction 릴리스의 경우, 게시 후 검증기는 동일한 임시 prefix 업그레이드 경로도 `YYYY.M.D`에서 `YYYY.M.D-N`까지 검사하여 릴리스 correction이 오래된 글로벌 설치를 기본 stable payload에 조용히 남기지 못하게 합니다.
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 닫힌 상태로 실패하므로 빈 브라우저 대시보드를 다시 배포하지 않습니다.
- 게시 후 검증은 설치된 레지스트리 layout에 게시된 Plugin entrypoint와 패키지 메타데이터가 있는지도 검사합니다. Plugin 런타임 payload가 누락된 릴리스는 postpublish 검증기에 실패하며 `latest`로 승격할 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball에 대한 npm pack `unpackedSize` 예산도 적용하므로, installer e2e가 릴리스 게시 경로 전에 우발적인 pack bloat를 잡아냅니다.
- 릴리스 작업이 CI 계획, extension timing manifest 또는 extension 테스트 매트릭스를 건드렸다면 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner 소유 `plugin-prerelease-extension-shard` 매트릭스 출력을 다시 생성하고 검토하여 릴리스 노트가 오래된 CI layout을 설명하지 않게 합니다.
- stable macOS 릴리스 준비 상태에는 updater surface도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다.
  - 게시 후 `main`의 `appcast.xml`은 새 stable zip을 가리켜야 합니다.
  - 패키징된 앱은 non-debug bundle id, 비어 있지 않은 Sparkle feed URL, 그리고 해당 릴리스 버전의 정식 Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다.

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 빠르게 변하는 브랜치에서 고정된 커밋 증거가 필요하면 helper를 사용하여 모든 하위 워크플로가 대상 SHA에 고정된 임시 브랜치에서 실행되게 합니다:

```bash
pnpm ci:full-release --sha <full-sha>
```

이 helper는 `release-ci/<sha>-...`를 푸시하고, 해당 브랜치에서 `ref=<sha>`로 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로 `headSha`가 대상과 일치하는지 검증한 다음 임시 브랜치를 삭제합니다. 이렇게 하면 실수로 더 최신 `main` 하위 실행을 증명하는 일을 피할 수 있습니다.

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

워크플로는 대상 ref를 해석하고, 수동 `CI`를 `target_ref=<release-ref>`로 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, `release_profile=full`이면서 `rerun_group=all`인 경우 또는 `npm_telegram_package_spec`이 설정된 경우 독립 실행형 패키지 Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 install smoke, cross-OS 릴리스 검사, live/E2E Docker 릴리스 경로 커버리지, Telegram 패키지 QA가 포함된 Package Acceptance, QA Lab parity, live Matrix, live Telegram으로 팬아웃됩니다. 전체 실행은 `Full Release Validation` 요약에서 `normal_ci`와 `release_checks`가 성공으로 표시될 때만 허용됩니다. full/all 모드에서는 `npm_telegram` 하위 항목도 성공해야 합니다. full/all 외부에서는 게시된 `npm_telegram_package_spec`가 제공된 경우가 아니면 건너뜁니다. 최종 검증자 요약에는 각 하위 실행의 가장 느린 작업 표가 포함되므로, 릴리스 관리자는 로그를 다운로드하지 않고도 현재 critical path를 볼 수 있습니다.
전체 단계 매트릭스, 정확한 워크플로 작업 이름, stable 프로필과 full 프로필의 차이, 아티팩트, 집중 rerun 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참고하세요.
하위 워크플로는 대상 `ref`가 더 오래된 릴리스 브랜치나 태그를 가리키는 경우에도, `Full Release Validation`을 실행하는 신뢰된 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. 워크플로 실행 ref를 선택하여 신뢰된 하네스를 선택하세요.
이동하는 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 ref가 될 수 없으므로, 고정된 임시 브랜치를 만들려면 `pnpm ci:full-release --sha <sha>`를 사용하세요.

live/provider 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/core live 및 Docker 경로
- `stable`: 릴리스 승인을 위한 minimum에 stable provider/backend 커버리지 추가
- `full`: stable에 광범위한 advisory provider/media 커버리지 추가

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용하여 대상 ref를 한 번 `release-package-under-test`로 해석하고, 해당 아티팩트를 릴리스 경로 Docker 검사와 Package Acceptance 양쪽에서 재사용합니다. 이렇게 하면 모든 package-facing box가 같은 바이트를 사용하게 되고 반복적인 패키지 빌드를 피할 수 있습니다.
cross-OS OpenAI install smoke는 repo/org 변수가 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 lane은 가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작, live agent 한 턴을 증명하기 때문입니다. 더 넓은 live provider matrix가 모델별 커버리지를 담당하는 위치로 남습니다.

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

집중 수정 후 첫 rerun으로 full umbrella를 사용하지 마세요. 한 box가 실패하면 다음 증명에는 실패한 하위 워크플로, 작업, Docker lane, 패키지 프로필, 모델 provider 또는 QA lane을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전 all-box 증거를 더 이상 유효하지 않게 만든 경우에만 full umbrella를 다시 실행하세요. umbrella의 최종 검증자는 기록된 하위 워크플로 실행 ID를 다시 확인하므로, 하위 워크플로가 성공적으로 rerun된 후에는 실패한 `Verify full validation` 상위 작업만 rerun하세요.

제한된 복구를 위해 umbrella에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 하위 항목만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 하위 항목만 실행하고, `release-checks`는 모든 릴리스 box를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다.
집중 `npm-telegram` rerun에는 `npm_telegram_package_spec`가 필요합니다. `release_profile=full`인 full/all 실행은 release-checks 패키지 아티팩트를 사용합니다.

### Vitest

Vitest box는 수동 `CI` 하위 워크플로입니다. 수동 CI는 의도적으로 changed scoping을 우회하고 릴리스 후보에 대해 일반 테스트 그래프를 강제합니다. 여기에는 Linux Node shard, 번들 Plugin shard, 채널 계약, Node 22 호환성, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android, Control UI i18n이 포함됩니다.

"소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답하려면 이 box를 사용하세요.
이는 release-path 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 녹색인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패했거나 느린 shard 이름
- 실행에 성능 분석이 필요한 경우 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정적인 일반 CI가 필요하지만 Docker, QA Lab, live, cross-OS 또는 package box가 필요하지 않을 때만 수동 CI를 직접 실행하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box는 `openclaw-live-and-e2e-checks-reusable.yml`을 통한 `OpenClaw Release Checks`와 릴리스 모드 `install-smoke` 워크플로에 있습니다. 이는 소스 수준 테스트만이 아니라 패키지화된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun global install smoke가 활성화된 전체 install smoke
- 대상 SHA별 root Dockerfile smoke 이미지 준비/재사용, QR, root/gateway, installer/Bun smoke 작업이 별도 install-smoke shard로 실행됨
- repository E2E lane
- release-path Docker chunk: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청된 경우 `plugins-runtime-services` chunk 내부의 OpenWebUI 커버리지
- `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지 분할된 번들 Plugin 설치/제거 lane
- release checks에 live suite가 포함된 경우 live/E2E provider suite 및 Docker live 모델 커버리지

rerun하기 전에 Docker 아티팩트를 사용하세요. release-path scheduler는 lane 로그, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, rerun 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 chunk를 rerun하는 대신 reusable live/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`를 사용하세요. 생성된 rerun 명령에는 사용 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로, 실패한 lane은 같은 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab box도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 별개인 agentic behavior 및 채널 수준 릴리스 gate입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- agentic parity pack을 사용하여 OpenAI 후보 lane을 Opus 4.6 baseline과 비교하는 mock parity lane
- `qa-live-shared` 환경을 사용하는 빠른 live Matrix QA 프로필
- Convex CI credential lease를 사용하는 live Telegram QA lane
- 릴리스 telemetry에 명시적인 로컬 증명이 필요한 경우 `pnpm qa:otel:smoke`

"릴리스가 QA 시나리오와 live 채널 flow에서 올바르게 동작하는가?"에 답하려면 이 box를 사용하세요. 릴리스를 승인할 때 parity, Matrix, Telegram lane의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 lane이 아니라 수동 sharded QA-Lab 실행으로 계속 사용할 수 있습니다.

### Package

Package box는 설치 가능한 제품 gate입니다. 이는 `Package Acceptance`와 resolver `scripts/resolve-openclaw-package-candidate.mjs`로 뒷받침됩니다. resolver는 후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 inventory를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스로 신뢰된 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 pack
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행이 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, `telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. Package Acceptance는 마이그레이션, 업데이트, stale Plugin dependency cleanup, offline Plugin fixture, Plugin update, Telegram package QA를 같은 해석된 tarball에 대해 유지합니다. upgrade matrix는 `2026.4.23`부터 `latest`까지 npm에 게시된 모든 stable baseline을 포함합니다. 이미 배포된 후보에는 `source=npm`으로 Package Acceptance를 사용하고, publish 전 SHA 기반 로컬 npm tarball에는 `source=ref`/`source=artifact`를 사용하세요. 이는 이전에 Parallels가 필요했던 대부분의 package/update 커버리지를 대체하는 GitHub-native 방식입니다. Cross-OS release checks는 OS별 온보딩, installer, platform behavior에 여전히 중요하지만, package/update 제품 검증은 Package Acceptance를 우선해야 합니다.

업데이트와 Plugin 검증을 위한 표준 체크리스트는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)입니다. Plugin 설치/업데이트, doctor cleanup 또는 published-package migration 변경을 증명하는 local, Docker, Package Acceptance 또는 release-check lane을 결정할 때 사용하세요.
모든 stable `2026.4.23+` 패키지에서 수행하는 포괄적인 published update migration은 Full Release CI의 일부가 아니라 별도의 수동 `Update Migration` 워크플로입니다.

Legacy package-acceptance leniency는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의 패키지는 이미 npm에 게시된 metadata gap에 대해 compatibility path를 사용할 수 있습니다. 여기에는 tarball에 없는 private QA inventory entry, 누락된 `gateway install --wrapper`, tarball에서 파생된 git fixture의 누락된 patch file, 누락된 persisted `update.channel`, legacy Plugin install-record 위치, 누락된 marketplace install-record persistence, `plugins update` 중 config metadata migration이 포함됩니다. 게시된 `2026.4.26` 패키지는 이미 배포된 local build metadata stamp file에 대해 경고할 수 있습니다. 이후 패키지는 현대적인 패키지 계약을 충족해야 합니다. 동일한 gap은 release validation을 실패시킵니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때는 더 넓은 Package Acceptance 프로필을 사용하세요.

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

일반적인 패키지 프로필:

- `smoke`: 빠른 패키지 설치/채널/agent, Gateway 네트워크, config reload lane
- `package`: live ClawHub 없이 install/update/Plugin package contract; 이것이 release-check 기본값
- `product`: `package`에 MCP channel, cron/subagent cleanup, OpenAI web search, OpenWebUI 추가
- `full`: OpenWebUI가 포함된 Docker release-path chunk
- `custom`: 집중 rerun을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 검증의 경우 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는 확인된
`package-under-test` tarball을 Telegram 레인에 전달합니다. 독립 실행형
Telegram 워크플로는 게시 후 확인을 위해 게시된 npm spec도 계속 허용합니다.

## 릴리스 게시 자동화

`OpenClaw Release Publish`는 일반적인 변경성 게시 진입점입니다. 릴리스에 필요한
순서대로 신뢰할 수 있는 게시자 워크플로를 오케스트레이션합니다.

1. 릴리스 태그를 체크아웃하고 해당 commit SHA를 확인합니다.
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

알파 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

기본 beta dist-tag로 안정 버전 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest`로 직접 안정 버전을 승격하는 작업은 명시적입니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

하위 수준 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는
집중적인 복구 또는 재게시 작업에만 사용하세요. 선택한 Plugin 복구의 경우
`plugin_publish_scope=selected` 및 `plugins=@openclaw/name`을
`OpenClaw Release Publish`에 전달하거나, OpenClaw 패키지를 게시하면 안 되는 경우
하위 워크플로를 직접 디스패치하세요.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1` 또는
  `v2026.4.2-alpha.1`이나 `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다. `preflight_only=true`인 경우, 검증 전용 사전 점검을 위해 현재
  전체 40자 워크플로 브랜치 commit SHA도 사용할 수 있습니다.
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로에는
  `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 사전 점검 실행에서 준비된 tarball을 재사용하도록 합니다.
- `npm_dist_tag`: 게시 경로의 npm 대상 태그이며, 기본값은 `beta`입니다.

`OpenClaw Release Publish`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: 필수 릴리스 태그이며, 이미 존재해야 합니다.
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` 사전 점검 실행 id입니다.
  `publish_openclaw_npm=true`일 때 필수입니다.
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그입니다.
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. 집중적인 복구 작업에만
  `selected`를 사용하세요.
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분된
  `@openclaw/*` 패키지 이름입니다.
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 Plugin 전용 복구 오케스트레이터로 사용할 때만 `false`로 설정하세요.

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 허용합니다.

- `ref`: 검증할 브랜치, 태그 또는 전체 commit SHA입니다. Secret이 포함된 검사는
  확인된 commit이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 하나로 게시할 수 있습니다.
- 알파 시험판 태그는 `alpha`에만 게시할 수 있습니다.
- 베타 시험판 태그는 `beta`에만 게시할 수 있습니다.
- `OpenClaw NPM Release`의 경우 전체 commit SHA 입력은 `preflight_only=true`일 때만 허용됩니다.
- `OpenClaw Release Checks` 및 `Full Release Validation`은 항상 검증 전용입니다.
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며,
  워크플로는 게시를 계속하기 전에 해당 메타데이터를 확인합니다.

## 안정 npm 릴리스 순서

안정 npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다.
   - 태그가 존재하기 전에는 사전 점검 워크플로의 검증 전용 dry run을 위해 현재 전체 워크플로 브랜치 commit
     SHA를 사용할 수 있습니다.
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 직접 안정 버전 게시를 의도한 경우에만 `latest`를 선택합니다.
3. 하나의 수동 워크플로에서 일반 CI와 live prompt cache, Docker, QA Lab,
   Matrix, Telegram 커버리지를 원할 때는 릴리스 브랜치, 릴리스 태그 또는 전체
   commit SHA에서 `Full Release Validation`을 실행합니다.
4. 결정적 일반 테스트 그래프만 의도적으로 필요한 경우에는 대신 릴리스 ref에서
   수동 `CI` 워크플로를 실행합니다.
5. 성공한 `preflight_run_id`를 저장합니다.
6. 동일한 `tag`, 동일한 `npm_dist_tag`, 저장된 `preflight_run_id`로
   `OpenClaw Release Publish`를 실행합니다. 이 워크플로는 OpenClaw npm 패키지를 승격하기 전에 외부화된 plugins를 npm과
   ClawHub에 게시합니다.
7. 릴리스가 `beta`에 배포된 경우 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 안정 버전을 `beta`에서 `latest`로 승격합니다.
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 안정 빌드를 따라야 하는 경우, 동일한 비공개
   워크플로를 사용해 두 dist-tag가 모두 안정 버전을 가리키도록 하거나, 예약된
   자가 복구 동기화가 나중에 `beta`를 이동하도록 둡니다.

dist-tag 변경은 보안상 비공개 repo에 있습니다. 여전히 `NPM_TOKEN`이 필요하기 때문이며,
공개 repo는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두 문서화되고 운영자가 볼 수 있습니다.

maintainer가 로컬 npm 인증으로 대체해야 하는 경우, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행하세요. 기본 agent shell에서 `op`를
직접 호출하지 마세요. tmux 안에 두면 프롬프트, 알림, OTP 처리를 관찰할 수 있고 반복적인 호스트 알림을 방지할 수 있습니다.

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

maintainer는 실제 실행 절차에 비공개 릴리스 문서인
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)를 사용합니다.

## 관련 항목

- [릴리스 채널](/ko/install/development-channels)
