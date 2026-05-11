---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 수용 실행
    - 버전 명명 방식과 주기 찾기
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-05-11T20:35:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시하거나 명시적으로 요청한 경우 npm `latest`에 게시하는 태그된 릴리스
- beta: npm `beta`에 게시하는 프리릴리스 태그
- dev: `main`의 이동하는 최신 헤드

## 버전 이름 지정

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- 베타 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일을 0으로 채우지 마세요
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `beta`는 현재 베타 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 베타 빌드를 나중에 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다;
  베타 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며,
  Mac 앱 빌드/서명/공증은 명시적으로 요청하지 않는 한 안정 릴리스용으로 남겨둡니다

## 릴리스 주기

- 릴리스는 베타 우선으로 진행됩니다
- 안정 릴리스는 최신 베타가 검증된 후에만 이어집니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D` 브랜치에서
  릴리스를 자르므로 릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- 베타 태그가 푸시되었거나 게시된 뒤 수정이 필요하면, 유지관리자는 기존 베타 태그를 삭제하거나 다시 생성하는 대신
  다음 `-beta.N` 태그를 자릅니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은
  유지관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 정보는
유지관리자 전용 릴리스 런북에 남겨둡니다.

1. 현재 `main`에서 시작합니다: 최신 변경 사항을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 녹색인지 확인합니다.
2. 실제 커밋 기록을 기반으로 `/changelog`로 최상단 `CHANGELOG.md` 섹션을 다시 작성하고,
   항목을 사용자에게 보이는 형태로 유지한 뒤, 커밋하고 푸시한 다음 브랜치 생성 전에 한 번 더 rebase/pull합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장되는 경우에만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 생성합니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올린 다음
   `pnpm release:prep`을 실행합니다. 이 명령은 Plugin 버전, Plugin 인벤터리, 구성
   스키마, 번들 채널 구성 메타데이터, 구성 문서 기준선, Plugin SDK
   내보내기, Plugin SDK API 기준선을 올바른 순서로 새로 고칩니다. 태그를 지정하기 전에 생성된
   드리프트를 커밋합니다. 그런 다음 로컬 결정론적 사전 점검을 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, 그리고 `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   전체 40자 릴리스 브랜치 SHA를 검증 전용
   사전 점검에 사용할 수 있습니다. 성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로
   모든 프리릴리스 테스트를 시작합니다. 이것은 네 개의 큰 릴리스 테스트 박스인 Vitest, Docker, QA Lab, Package를 위한 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정 사항을 입증하는 가장 작은 실패
   파일, 레인, 워크플로 작업, 패키지 프로필, 제공자 또는 모델 허용 목록을 다시 실행합니다. 변경된 표면 때문에
   이전 증거가 오래된 경우에만 전체 엄브렐라를 다시 실행합니다.
9. 베타의 경우 `vYYYY.M.D-beta.N`을 태그한 다음, 일치하는
   `release/YYYY.M.D` 브랜치에서 `OpenClaw Release Publish`를 실행합니다. 이 워크플로는 `pnpm plugins:sync:check`를 검증하고,
   게시 가능한 모든 Plugin 패키지를 npm에, 같은 집합을
   ClawHub에 병렬로 디스패치한 다음, Plugin npm 게시가 성공하는 즉시 일치하는 dist-tag로 준비된 OpenClaw npm 사전 점검
   아티팩트를 승격합니다.
   OpenClaw npm 게시 하위 작업이 성공한 뒤에는 완전한 일치
   `CHANGELOG.md` 섹션에서 일치하는 GitHub 릴리스/프리릴리스 페이지를 생성하거나 업데이트합니다. npm `latest`에 게시된 안정 릴리스는
   GitHub 최신 릴리스가 됩니다. npm `beta`에 유지되는 안정 유지관리 릴리스는
   GitHub `latest=false`로 생성됩니다.
   OpenClaw npm이 게시되는 동안 ClawHub 게시가 계속 실행 중일 수 있지만,
   릴리스 게시 워크플로는 하위 실행 ID를 즉시 출력합니다. 기본적으로 이 워크플로는
   ClawHub를 디스패치한 뒤 기다리지 않으므로, OpenClaw npm 가용성은 더 느린 ClawHub 승인이나 레지스트리 작업으로
   차단되지 않습니다. ClawHub가 워크플로 완료를 차단해야 하는 경우
   `wait_for_clawhub=true`를 설정하세요. ClawHub 경로는 일시적인 CLI 종속성 설치 실패를 재시도하고,
   하나의 미리보기 셀이 불안정하더라도 미리보기를 통과한 Plugin을 게시하며, 부분 게시가
   계속 보이고 재시도 가능하도록 모든 예상 Plugin 버전에 대한
   레지스트리 검증으로 끝납니다. 게시 후에는
   게시된 `openclaw@YYYY.M.D-beta.N` 또는
   `openclaw@beta` 패키지에 대해 게시 후 패키지
   인수를 실행합니다. 푸시되었거나 게시된 프리릴리스에 수정이 필요하면
   다음 일치하는 프리릴리스 번호를 자릅니다. 기존
   프리릴리스를 삭제하거나 다시 작성하지 마세요.
10. 안정 릴리스의 경우, 검증된 베타 또는 릴리스 후보가 필요한 검증 증거를 갖춘 뒤에만
    계속 진행합니다. 안정 npm 게시 역시
    `OpenClaw Release Publish`를 통해 진행되며,
    `preflight_run_id`로 성공한 사전 점검 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비 상태에는
    패키징된 `.zip`, `.dmg`, `.dSYM.zip`, 그리고 `main`의 업데이트된 `appcast.xml`도 필요합니다.
    비공개 macOS 게시 워크플로는 릴리스 자산 검증 후 서명된 appcast를 공개
    `main`에 자동으로 게시합니다. 브랜치 보호가 직접 푸시를 차단하면
    appcast PR을 열거나 업데이트합니다.
11. 게시 후에는 npm 게시 후 검증기, 게시 후 채널 증거가 필요할 때 선택적 독립형
    게시된 npm Telegram E2E,
    필요한 경우 dist-tag 승격을 실행하고, 생성된 GitHub 릴리스 페이지를 검증한 뒤,
    릴리스 공지 단계를 실행합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 검증되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import
  cycle 및 architecture boundary 검사가 더 빠른 로컬 게이트 밖에서도 통과하도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 예상되는
  `dist/*` 릴리스 아티팩트와 Control UI 번들이 pack
  검증 단계에 존재하도록 합니다
- 루트 버전 bump 후, 태그 지정 전에 `pnpm release:prep`을 실행합니다. 이 명령은
  버전/config/API 변경 후 흔히 drift되는 모든 deterministic release generator를 실행합니다:
  plugin 버전, plugin inventory, base config schema, bundled channel config metadata,
  config docs baseline, plugin SDK exports, plugin SDK API baseline. `pnpm release:check`는
  이러한 guard를 check 모드로 다시 실행하고, package release check를 실행하기 전에 발견한
  모든 generated drift failure를 한 번의 pass에서 보고합니다.
- 릴리스 승인 전에 수동 `Full Release Validation` workflow를 실행하여 모든 pre-release test box를
  하나의 entrypoint에서 시작합니다. 이 workflow는 branch, tag, 또는 full commit SHA를 받고,
  수동 `CI`를 dispatch하며, install smoke, package acceptance, cross-OS
  package checks, QA Lab parity, Matrix, Telegram lane을 위한
  `OpenClaw Release Checks`를 dispatch합니다. Stable/default run은 exhaustive live/E2E 및
  Docker release-path soak를 `run_release_soak=true` 뒤에 둡니다. `release_profile=full`은 soak를 강제로 켭니다.
  `release_profile=full` 및 `rerun_group=all`과 함께 사용하면 release checks의
  `release-package-under-test` artifact를 대상으로 package Telegram E2E도 실행합니다.
  beta를 publish한 뒤 `release_package_spec`을 제공하면 release tarball을 다시 빌드하지 않고,
  shipped npm package를 release checks, Package Acceptance, package Telegram E2E 전반에서 재사용합니다.
  Telegram이 나머지 release validation과 다른 published package를 사용해야 할 때만
  `npm_telegram_package_spec`을 제공합니다. Package Acceptance가 release package spec과 다른
  published package를 사용해야 할 때는 `package_acceptance_package_spec`을 제공합니다.
  private evidence report가 Telegram E2E를 강제하지 않고 validation이 published npm package와 일치함을 증명해야 할 때는
  `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- release 작업이 계속되는 동안 package candidate에 대한 side-channel proof가 필요하면
  수동 `Package Acceptance` workflow를 실행합니다. `openclaw@beta`, `openclaw@latest`, 또는 정확한 release version에는 `source=npm`을 사용하고,
  현재 `workflow_ref` harness로 신뢰할 수 있는 `package_ref` branch/tag/SHA를 pack하려면 `source=ref`를 사용하며,
  필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용하고, 다른 GitHub
  Actions run이 업로드한 tarball에는 `source=artifact`를 사용합니다. 이 workflow는 candidate를
  `package-under-test`로 resolve하고, 해당 tarball을 대상으로 Docker E2E release scheduler를 재사용하며,
  `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 동일한 tarball에 대해 Telegram QA를 실행할 수 있습니다.
  선택한 Docker lane에 `published-upgrade-survivor`가 포함되면 package
  artifact가 candidate이고 `published_upgrade_survivor_baseline`이 published baseline을 선택합니다.
  `update-restart-auth`는 candidate package를 설치된 CLI와 package-under-test 양쪽으로 사용하여
  candidate update command의 managed restart path를 실행합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 profile:
  - `smoke`: install/channel/agent, gateway network, config reload lane
  - `package`: OpenWebUI 또는 live ClawHub 없는 artifact-native package/update/restart/plugin lane
  - `product`: package profile에 MCP channel, cron/subagent cleanup,
    OpenAI web search, OpenWebUI를 더한 profile
  - `full`: OpenWebUI가 포함된 Docker release-path chunk
  - `custom`: 집중 rerun을 위한 정확한 `docker_lanes` 선택
- release candidate에 대한 전체 일반 CI coverage만 필요할 때는 수동 `CI` workflow를 직접 실행합니다.
  수동 CI dispatch는 changed scoping을 우회하고 Linux Node shard, bundled-plugin shard, channel
  contract, Node 22 compatibility, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android, Control UI i18n
  lane을 강제로 실행합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- release telemetry를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은
  로컬 OTLP/HTTP receiver를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 collector 없이
  exported trace span name, bounded attribute, content/identifier redaction을 검증합니다.
- 모든 tagged release 전에 `pnpm release:check`를 실행합니다
- tag가 존재한 뒤 mutating publish sequence에는 `OpenClaw Release Publish`를 실행합니다.
  `release/YYYY.M.D`에서 dispatch하거나 main에서 도달 가능한 tag를 publish할 때는 `main`에서 dispatch하고,
  release tag와 성공한 OpenClaw npm `preflight_run_id`를 전달하며,
  의도적으로 focused repair를 실행하는 경우가 아니라면 기본 plugin publish scope인
  `all-publishable`을 유지합니다. 이 workflow는 plugin npm publish, plugin ClawHub publish, OpenClaw
  npm publish를 직렬화하여 externalized plugin보다 core package가 먼저 publish되지 않도록 합니다.
- Release check는 이제 별도의 수동 workflow에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 release approval 전에 QA Lab mock parity lane과 빠른
  live Matrix profile 및 Telegram QA lane도 실행합니다. live
  lane은 `qa-live-shared` environment를 사용하며, Telegram은 Convex CI
  credential lease도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 원할 때는
  수동 `QA-Lab - All Lanes` workflow를 `matrix_profile=all` 및 `matrix_shards=true`로 실행합니다.
- Cross-OS install 및 upgrade runtime validation은 public
  `OpenClaw Release Checks`와 `Full Release Validation`의 일부이며, 두 workflow는 reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm release path는 짧고,
  deterministic하며 artifact-focused로 유지하고, 더 느린 live check는 자체 lane에 두어
  publish가 지연되거나 차단되지 않게 합니다
- Secret이 포함된 release check는 `Full Release
Validation`을 통해 dispatch하거나 `main`/release workflow ref에서 dispatch하여 workflow logic과
  secret이 통제되도록 해야 합니다
- `OpenClaw Release Checks`는 resolved commit이 OpenClaw branch 또는 release tag에서 도달 가능하기만 하면
  branch, tag, 또는 full commit SHA를 받습니다
- `OpenClaw NPM Release` validation-only preflight도 push된 tag를 요구하지 않고
  현재 full 40-character workflow-branch commit SHA를 받습니다
- 이 SHA path는 validation-only이며 실제 publish로 promote할 수 없습니다
- SHA mode에서 workflow는 package metadata check에만 `v<package.json version>`을 synthesize합니다.
  실제 publish에는 여전히 실제 release tag가 필요합니다
- 두 workflow 모두 실제 publish 및 promotion path는 GitHub-hosted
  runner에 유지하고, non-mutating validation path는 더 큰
  Blacksmith Linux runner를 사용할 수 있습니다
- 해당 workflow는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 실행하며
  `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` workflow secret을 모두 사용합니다
- npm release preflight는 더 이상 별도의 release checks lane을 기다리지 않습니다
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 일치하는 beta/correction tag)를 실행합니다
- npm publish 후,
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 일치하는 beta/correction version)를 실행하여 fresh temp prefix에서 published registry
  install path를 검증합니다
- beta publish 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행하여
  shared leased Telegram credential pool을 사용해 published npm package를 대상으로 installed-package onboarding, Telegram setup, 실제 Telegram E2E를 검증합니다.
  로컬 maintainer one-off는 Convex var를 생략하고 세 개의
  `OPENCLAW_QA_TELEGRAM_*` env credential을 직접 전달할 수 있습니다.
- maintainer machine에서 전체 post-publish beta smoke를 실행하려면 `pnpm release:beta-smoke -- --beta betaN`을 사용합니다. 이 helper는 Parallels npm update/fresh-target validation을 실행하고, `NPM Telegram Beta E2E`를 dispatch하며, 정확한 workflow run을 poll하고, artifact를 download한 뒤 Telegram report를 출력합니다.
- Maintainer는 GitHub Actions에서 수동 `NPM Telegram Beta E2E` workflow를 통해 동일한 post-publish check를 실행할 수 있습니다.
  이 workflow는 의도적으로 manual-only이며 모든 merge에서 실행되지 않습니다.
- Maintainer release automation은 이제 preflight-then-promote를 사용합니다:
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm publish는 성공한 preflight run과 같은 `main` 또는
    `release/YYYY.M.D` branch에서 dispatch되어야 합니다
  - stable npm release는 기본적으로 `beta`를 사용합니다
  - stable npm publish는 workflow input을 통해 명시적으로 `latest`를 대상으로 할 수 있습니다
  - token-based npm dist-tag mutation은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다.
    이는 public repo가 OIDC-only publish를 유지하는 동안에도 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다
  - public `macOS Release`는 validation-only입니다. tag가 release branch에만 있고 workflow가 `main`에서 dispatch되는 경우
    `public_release_branch=release/YYYY.M.D`를 설정합니다
  - 실제 private mac publish는 성공한 private mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 publish path는 artifact를 다시 빌드하지 않고 prepared artifact를 promote합니다
- `YYYY.M.D-N` 같은 stable correction release의 경우 post-publish verifier는
  동일한 temp-prefix upgrade path도 `YYYY.M.D`에서 `YYYY.M.D-N`까지 확인하여
  release correction이 기존 global install을 base stable payload에 조용히 남겨두지 못하게 합니다
- npm release preflight는 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 fail closed하여
  빈 browser dashboard를 다시 ship하지 않도록 합니다
- Post-publish verification은 published plugin entrypoint와 package metadata가
  설치된 registry layout에 존재하는지도 확인합니다. plugin runtime payload가 누락된 release는 postpublish verifier에 실패하며
  `latest`로 promote할 수 없습니다.
- `pnpm test:install:smoke`도 candidate update tarball에 대해 npm pack `unpackedSize` budget을 enforce하므로,
  installer e2e가 release publish path 전에 의도치 않은 pack bloat를 잡아냅니다
- release 작업이 CI planning, extension timing manifest, 또는
  extension test matrix를 건드렸다면, 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner-owned
  `plugin-prerelease-extension-shard` matrix output을 regenerate하고 review하여 release note가
  stale CI layout을 설명하지 않도록 합니다
- Stable macOS release readiness에는 updater surface도 포함됩니다:
  - GitHub release에는 packaged `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - `main`의 `appcast.xml`은 publish 후 새 stable zip을 가리켜야 합니다. private macOS publish workflow가 이를 자동으로 commit하거나,
    direct push가 blocked되면 appcast PR을 엽니다
  - packaged app은 non-debug bundle id, 비어 있지 않은 Sparkle feed
    URL, 해당 release version의 canonical Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다

## Release test box

`Full Release Validation`은 operator가 모든 pre-release test를 하나의 entrypoint에서 시작하는 방법입니다.
빠르게 움직이는 branch에서 pinned commit proof가 필요하면, 모든 child workflow가 target
SHA에 고정된 temporary branch에서 실행되도록 helper를 사용합니다:

```bash
pnpm ci:full-release --sha <full-sha>
```

헬퍼는 `release-ci/<sha>-...`를 푸시하고, 해당 브랜치에서 `ref=<sha>`로 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로의 `headSha`가 대상과 일치하는지 확인한 다음 임시 브랜치를 삭제합니다. 이렇게 하면 실수로 더 최신의 `main` 하위 실행을 증명하는 일을 피할 수 있습니다.

릴리스 브랜치 또는 태그 검증의 경우, 신뢰할 수 있는 `main` 워크플로 ref에서 실행하고 릴리스 브랜치 또는 태그를 `ref`로 전달하세요.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

워크플로는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, 패키지 대상 검사를 위한 상위 `release-package-under-test` 아티팩트를 준비하며, `release_profile=full`이고 `rerun_group=all`인 경우 또는 `release_package_spec`나 `npm_telegram_package_spec`가 설정된 경우 독립형 패키지 Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 설치 스모크, 크로스 OS 릴리스 검사, soak가 활성화된 경우 live/E2E Docker 릴리스 경로 커버리지, Telegram 패키지 QA를 포함한 Package Acceptance, QA Lab 패리티, live Matrix, live Telegram으로 분기합니다. 전체 실행은 `Full Release Validation` 요약에서 `normal_ci`와 `release_checks`가 성공으로 표시될 때만 허용됩니다. full/all 모드에서는 `npm_telegram` 하위 항목도 성공해야 합니다. full/all 외부에서는 게시된 `release_package_spec` 또는 `npm_telegram_package_spec`가 제공되지 않는 한 건너뜁니다. 최종 검증자 요약에는 각 하위 실행의 가장 느린 작업 표가 포함되므로, 릴리스 관리자는 로그를 다운로드하지 않고도 현재 임계 경로를 확인할 수 있습니다.
전체 단계 매트릭스, 정확한 워크플로 작업 이름, stable 프로필과 full 프로필의 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.
하위 워크플로는 대상 `ref`가 더 오래된 릴리스 브랜치나 태그를 가리키더라도 `Full Release Validation`을 실행하는 신뢰할 수 있는 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. 워크플로 실행 ref를 선택하여 신뢰할 수 있는 하네스를 선택하세요.
움직이는 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 ref가 될 수 없으므로, 고정된 임시 브랜치를 만들려면 `pnpm ci:full-release --sha <sha>`를 사용하세요.

live/provider 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/core live 및 Docker 경로
- `stable`: 릴리스 승인을 위한 minimum에 안정적인 provider/backend 커버리지 추가
- `full`: stable에 광범위한 advisory provider/media 커버리지 추가

릴리스 차단 lane이 녹색이고 승격 전에 포괄적인 live/E2E, Docker 릴리스 경로, 제한된 게시 업그레이드 생존자 스윕을 원할 때는 `stable`과 함께 `run_release_soak=true`를 사용하세요. 해당 스윕은 최신 stable 패키지 4개와 고정된 `2026.4.23` 및 `2026.5.2` 기준선, 그리고 더 오래된 `2026.4.15` 커버리지를 포함하며, 중복 기준선은 제거되고 각 기준선은 자체 Docker runner 작업으로 샤딩됩니다. `full`은 `run_release_soak=true`를 내포합니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용하여 대상 ref를 `release-package-under-test`로 한 번 해석하고, soak가 실행될 때 크로스 OS, Package Acceptance, 릴리스 경로 Docker 검사에서 해당 아티팩트를 재사용합니다. 이렇게 하면 모든 패키지 대상 박스가 동일한 바이트를 사용하고 반복적인 패키지 빌드를 피할 수 있습니다.
베타가 이미 npm에 올라간 뒤에는 `release_package_spec=openclaw@YYYY.M.D-beta.N`을 설정하여 릴리스 검사가 배포된 패키지를 한 번 다운로드하고, `dist/build-info.json`에서 빌드 소스 SHA를 추출한 다음, 크로스 OS, Package Acceptance, 릴리스 경로 Docker, 패키지 Telegram lane에 해당 아티팩트를 재사용하게 하세요.
크로스 OS OpenAI 설치 스모크는 repo/org 변수가 설정되어 있으면 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 lane은 가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작, live agent 한 턴을 증명하기 때문입니다. 더 넓은 live provider 매트릭스가 모델별 커버리지를 담당합니다.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

집중 수정 후 첫 번째 재실행으로 전체 umbrella를 사용하지 마세요. 하나의 박스가 실패하면 다음 증명에는 실패한 하위 워크플로, 작업, Docker lane, 패키지 프로필, 모델 provider 또는 QA lane을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전의 전체 박스 증거를 오래된 것으로 만든 경우에만 전체 umbrella를 다시 실행하세요. umbrella의 최종 검증자는 기록된 하위 워크플로 실행 ID를 다시 확인하므로, 하위 워크플로가 성공적으로 재실행된 뒤에는 실패한 상위 `Verify full validation` 작업만 다시 실행하세요.

제한된 복구에는 umbrella에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 하위 항목만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 하위 항목만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다.
집중 `npm-telegram` 재실행에는 `release_package_spec` 또는 `npm_telegram_package_spec`가 필요합니다. `release_profile=full`인 full/all 실행은 release-checks 패키지 아티팩트를 사용합니다. 집중 크로스 OS 재실행에는 `cross_os_suite_filter=windows/packaged-upgrade` 또는 다른 OS/suite 필터를 추가할 수 있습니다. QA release-check 실패는 advisory입니다. QA만 실패한 경우 릴리스 검증을 차단하지 않습니다.

### Vitest

Vitest 박스는 수동 `CI` 하위 워크플로입니다. 수동 CI는 의도적으로 변경 범위 지정을 우회하고 릴리스 후보에 대해 일반 테스트 그래프를 강제합니다. Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Android, Control UI i18n이 포함됩니다.

"소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답할 때 이 박스를 사용하세요. 이는 릴리스 경로 제품 검증과는 다릅니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 녹색인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패하거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정적인 일반 CI가 필요하지만 Docker, QA Lab, live, 크로스 OS 또는 패키지 박스가 필요하지 않을 때만 수동 CI를 직접 실행하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통한 `OpenClaw Release Checks`와 릴리스 모드 `install-smoke` 워크플로에 있습니다. 이는 소스 수준 테스트만이 아니라 패키징된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용, QR, root/gateway, installer/Bun 스모크 작업이 별도의 install-smoke 샤드로 실행됨
- 저장소 E2E lane
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청 시 `plugins-runtime-services` 청크 내부의 OpenWebUI 커버리지
- 분할 번들 Plugin 설치/제거 lane `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지
- 릴리스 검사가 live suite를 포함할 때 live/E2E provider suite 및 Docker live 모델 커버리지

재실행하기 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 lane 로그, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 청크를 다시 실행하는 대신 재사용 가능한 live/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`를 사용하세요. 생성된 재실행 명령에는 사용 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로, 실패한 lane이 동일한 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 별개인 agentic 동작 및 채널 수준 릴리스 게이트입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- agentic parity pack을 사용하여 OpenAI 후보 lane을 Opus 4.6 기준선과 비교하는 mock parity lane
- `qa-live-shared` 환경을 사용하는 빠른 live Matrix QA 프로필
- Convex CI 자격 증명 lease를 사용하는 live Telegram QA lane
- 릴리스 telemetry에 명시적인 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`

"릴리스가 QA 시나리오와 live 채널 흐름에서 올바르게 동작하는가?"에 답할 때 이 박스를 사용하세요. 릴리스를 승인할 때 parity, Matrix, Telegram lane의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 lane이 아니라 수동 샤딩 QA-Lab 실행으로 계속 사용할 수 있습니다.

### Package

Package 박스는 설치 가능한 제품 게이트입니다. 이는 `Package Acceptance`와 resolver `scripts/resolve-openclaw-package-candidate.mjs`가 뒷받침합니다. resolver는 후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 별도로 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=artifact`, 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. Package Acceptance는 동일하게 해석된 tarball에 대해 migration, update, configured-auth update restart, live ClawHub skill install, stale Plugin dependency cleanup, offline Plugin fixtures, Plugin update, Telegram 패키지 QA를 유지합니다. 차단 릴리스 검사는 기본 최신 게시 패키지 기준선을 사용합니다. `run_release_soak=true` 또는 `release_profile=full`은 `2026.4.23`부터 `latest`까지 npm에 게시된 모든 stable 기준선과 보고된 issue fixture로 확장됩니다. 이미 배포된 후보에는 `source=npm`으로 Package Acceptance를 사용하고, 게시 전 SHA 기반 로컬 npm tarball에는 `source=ref`/`source=artifact`를 사용하세요. 이는 이전에 Parallels가 필요했던 대부분의 package/update 커버리지를 대체하는 GitHub 네이티브 방식입니다. 크로스 OS 릴리스 검사는 OS별 온보딩, installer, 플랫폼 동작에 여전히 중요하지만, package/update 제품 검증에는 Package Acceptance를 우선해야 합니다.

업데이트 및 Plugin 검증을 위한 표준 체크리스트는
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)입니다. Plugin
설치/업데이트, doctor 정리, 또는 게시된 패키지 마이그레이션 변경을 증명하는 데
어떤 로컬, Docker, 패키지 승인, 또는 릴리스 확인 레인을 사용할지 결정할 때
사용하세요. 모든 안정 `2026.4.23+` 패키지에서 게시된 업데이트 마이그레이션을
전부 검증하는 작업은 별도의 수동 `Update Migration` 워크플로이며, 전체 릴리스
CI의 일부가 아닙니다.

레거시 패키지 승인 완화는 의도적으로 기간이 제한되어 있습니다. `2026.4.25`까지의
패키지는 npm에 이미 게시된 메타데이터 누락에 대해 호환성 경로를 사용할 수
있습니다. tarball에 없는 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`,
tarball에서 파생된 git fixture에 없는 패치 파일, 누락된 영구 `update.channel`,
레거시 Plugin 설치 기록 위치, 누락된 마켓플레이스 설치 기록 영속성, 그리고
`plugins update` 중 구성 메타데이터 마이그레이션이 이에 해당합니다. 게시된
`2026.4.26` 패키지는 이미 배송된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할
수 있습니다. 이후 패키지는 최신 패키지 계약을 충족해야 하며, 같은 누락 사항은
릴리스 검증에서 실패합니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것이라면 더 넓은 패키지 승인
프로필을 사용하세요.

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

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크, 구성 재로드 레인
- `package`: 설치/업데이트/재시작/Plugin 패키지 계약 및 라이브 ClawHub skill 설치
  증명; 릴리스 확인 기본값입니다
- `product`: `package`에 MCP 채널, cron/하위 에이전트 정리, OpenAI 웹 검색,
  OpenWebUI를 더한 것
- `full`: OpenWebUI를 포함한 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명에는 패키지 승인에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는 해석된
`package-under-test` tarball을 Telegram 레인으로 전달합니다. 독립형 Telegram
워크플로는 게시 후 확인을 위해 게시된 npm spec도 계속 허용합니다.

## 릴리스 게시 자동화

`OpenClaw Release Publish`는 일반적인 변경 발생 게시 진입점입니다. 릴리스에
필요한 순서대로 신뢰할 수 있는 게시자 워크플로를 오케스트레이션합니다.

1. 릴리스 태그를 체크아웃하고 해당 커밋 SHA를 해석합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다.
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로 `Plugin NPM Release`를 디스패치합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 디스패치합니다.
6. 릴리스 태그, npm dist-tag, 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.

베타 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

기본 beta dist-tag로 안정 버전 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest`로 직접 안정 승격하는 것은 명시적으로 수행합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

하위 수준 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는 집중 복구
또는 재게시 작업에만 사용하세요. 선택한 Plugin 복구의 경우
`OpenClaw Release Publish`에 `plugin_publish_scope=selected` 및
`plugins=@openclaw/name`을 전달하거나, OpenClaw 패키지를 게시하면 안 되는 경우
자식 워크플로를 직접 디스패치하세요.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1`, 또는 `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다.
  `preflight_only=true`일 때는 검증 전용 사전 점검을 위한 현재 전체 40자
  워크플로 브랜치 커밋 SHA도 사용할 수 있습니다
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로에는 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 사전 점검 실행에서
  준비된 tarball을 재사용하도록 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그이며, 기본값은 `beta`입니다

`OpenClaw Release Publish`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: 필수 릴리스 태그이며, 이미 존재해야 합니다
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` 사전 점검 실행 ID입니다.
  `publish_openclaw_npm=true`일 때 필수입니다
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. 집중 복구 작업에만 `selected`를 사용하세요
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분된 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 Plugin 전용 복구 오케스트레이터로
  사용할 때만 `false`로 설정하세요

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 허용합니다.

- `ref`: 검증할 브랜치, 태그, 또는 전체 커밋 SHA입니다. 비밀 값을 사용하는 검사는
  해석된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.
- `run_release_soak`: 안정/기본 릴리스 검사에서 전체 라이브/E2E, Docker 릴리스 경로,
  all-since upgrade-survivor 장기 검증을 선택합니다. `release_profile=full`에 의해
  강제로 켜집니다.

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 하나로 게시할 수 있습니다
- 베타 사전 릴리스 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`에서는 `preflight_only=true`일 때만 전체 커밋 SHA 입력이 허용됩니다
- `OpenClaw Release Checks` 및 `Full Release Validation`은 항상 검증 전용입니다
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  워크플로는 게시를 계속하기 전에 해당 메타데이터를 확인합니다

## 안정 npm 릴리스 순서

안정 npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 사전 점검 워크플로의 검증 전용 dry run을 위해 현재 전체
     워크플로 브랜치 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta-first 흐름에는 `npm_dist_tag=beta`를 선택하고, 안정 버전을 직접 게시하려는
   의도가 있을 때만 `latest`를 선택합니다
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab, Matrix,
   Telegram 커버리지를 원할 때는 릴리스 브랜치, 릴리스 태그, 또는 전체 커밋 SHA에서
   `Full Release Validation`을 실행합니다
4. 결정적인 일반 테스트 그래프만 의도적으로 필요한 경우에는 릴리스 ref에서 수동 `CI`
   워크플로를 실행합니다
5. 성공한 `preflight_run_id`를 저장합니다
6. 동일한 `tag`, 동일한 `npm_dist_tag`, 저장된 `preflight_run_id`로
   `OpenClaw Release Publish`를 실행합니다. 이 워크플로는 OpenClaw npm 패키지를
   승격하기 전에 외부화된 Plugin을 npm 및 ClawHub에 게시합니다
7. 릴리스가 `beta`에 반영된 경우, 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용하여 해당 안정 버전을 `beta`에서 `latest`로 승격합니다
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 안정 빌드를
   따라야 한다면, 같은 비공개 워크플로를 사용하여 두 dist-tag가 모두 안정 버전을 가리키게
   하거나, 예약된 자체 복구 동기화가 나중에 `beta`를 이동하도록 둡니다

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하기 때문에 보안을 위해 비공개 저장소에
있으며, 공개 저장소는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta-first 승격 경로가 모두 문서화되고 운영자에게
보이게 됩니다.

관리자가 로컬 npm 인증으로 폴백해야 하는 경우, 모든 1Password CLI(`op`) 명령은
전용 tmux 세션 안에서만 실행하세요. 기본 에이전트 셸에서 `op`를 직접 호출하지
마세요. tmux 안에 두면 프롬프트, 알림, OTP 처리를 관찰할 수 있고 반복적인 호스트
알림을 방지할 수 있습니다.

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

관리자는 실제 실행 절차서로 비공개 릴리스 문서
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)를
사용합니다.

## 관련

- [릴리스 채널](/ko/install/development-channels)
