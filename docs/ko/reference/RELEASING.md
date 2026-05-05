---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 승인 실행
    - 버전 명명 방식과 릴리스 주기 확인
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-05-05T01:48:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시하거나, 명시적으로 요청한 경우 npm `latest`에 게시하는 태그된 릴리스
- beta: npm `beta`에 게시하는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월 또는 일을 0으로 채우지 마세요
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있습니다
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다;
  beta 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청하지 않는 한 stable용으로 남겨둡니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 뒤에만 이어집니다
- Maintainer는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D` 브랜치에서 릴리스를 자르므로,
  릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- beta 태그가 이미 푸시되었거나 게시되었고 수정이 필요한 경우, Maintainer는 기존 beta 태그를 삭제하거나 다시 만들지 않고
  다음 `-beta.N` 태그를 자릅니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는
  Maintainer 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 정보는
Maintainer 전용 릴리스 런북에 남겨둡니다.

1. 현재 `main`에서 시작합니다: 최신 항목을 pull하고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 녹색인지 확인합니다.
2. 실제 커밋 기록을 사용해 최상단 `CHANGELOG.md` 섹션을
   `/changelog`로 다시 작성하고, 항목을 사용자 대상 내용으로 유지한 뒤, 커밋하고, 푸시하고,
   브랜치를 만들기 전에 한 번 더 rebase/pull합니다.
3. 다음 위치의 릴리스 호환성 기록을 검토합니다
   `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`. 업그레이드 경로가 계속 보장될 때만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 생성합니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올리고,
   게시 가능한 Plugin 패키지가 릴리스 버전과 호환성 메타데이터를 공유하도록 `pnpm plugins:sync`를 실행한 다음,
   로컬 결정적 사전 점검을 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, 그리고
   `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   전체 40자 릴리스 브랜치 SHA를 검증 전용 사전 점검에 사용할 수 있습니다.
   성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로
   모든 프리릴리스 테스트를 시작합니다. 이것은 네 개의 큰 릴리스 테스트 박스인
   Vitest, Docker, QA Lab, Package를 위한 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정을 증명하는 가장 작은 실패
   파일, 레인, workflow 작업, 패키지 프로필, provider 또는 모델 allowlist를 다시 실행합니다.
   변경된 표면 때문에 이전 증거가 낡아진 경우에만 전체 umbrella를 다시 실행합니다.
9. beta의 경우 `vYYYY.M.D-beta.N` 태그를 지정한 다음, 일치하는
   `release/YYYY.M.D` 브랜치에서 `OpenClaw Release Publish`를 실행합니다.
   이는 `pnpm plugins:sync:check`를 확인하고,
   게시 가능한 모든 Plugin 패키지를 먼저 npm에 게시하며, 같은 세트를 두 번째로
   ClawPack npm-pack tarball로 ClawHub에 게시한 다음, 일치하는 dist-tag로
   준비된 OpenClaw npm 사전 점검 artifact를 승격합니다. 게시 후에는 게시된
   `openclaw@YYYY.M.D-beta.N` 또는
   `openclaw@beta` 패키지에 대해 게시 후 패키지
   수락 검증을 실행합니다. 푸시되었거나 게시된 프리릴리스에 수정이 필요하면,
   다음으로 일치하는 프리릴리스 번호를 자릅니다. 기존 프리릴리스를 삭제하거나 다시 쓰지 마세요.
10. stable의 경우, 검증된 beta 또는 릴리스 후보에 필요한 검증 증거가 있는 뒤에만 계속합니다.
    Stable npm 게시도 `OpenClaw Release Publish`를 거치며,
    `preflight_run_id`를 통해 성공한 사전 점검 artifact를 재사용합니다. stable macOS 릴리스 준비 상태에는
    패키징된 `.zip`, `.dmg`, `.dSYM.zip` 및 `main`의 업데이트된 `appcast.xml`도 필요합니다.
11. 게시 후에는 npm 게시 후 검증기, 게시 후 채널 증명이 필요할 때 선택적 독립 실행형
    게시된 npm Telegram E2E, 필요 시 dist-tag 승격, 완전히 일치하는
    `CHANGELOG.md` 섹션의 GitHub 릴리스/프리릴리스 노트, 그리고 릴리스 공지
    단계를 실행합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 포함되도록 합니다.
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import
  cycle 및 architecture boundary 검사가 더 빠른 로컬 게이트 밖에서도 green 상태가 되도록 합니다.
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack
  validation 단계에 필요한 예상 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다.
- 루트 버전 bump 이후, 태그 지정 전에 `pnpm plugins:sync`를 실행합니다. 이는 게시 가능한 Plugin 패키지 버전, OpenClaw peer/API 호환성 메타데이터, 빌드 메타데이터, Plugin changelog stub을 core 릴리스 버전에 맞게 업데이트합니다. `pnpm plugins:sync:check`는 변경하지 않는 릴리스 guard입니다. 이 단계를 잊으면 registry mutation 전에 publish workflow가 실패합니다.
- 릴리스 승인 전에 수동 `Full Release Validation` workflow를 실행하여 하나의 entrypoint에서 모든 사전 릴리스 test box를 시작합니다. branch, tag, 또는 전체 commit SHA를 받을 수 있으며, 수동 `CI`를 dispatch하고 install smoke, package acceptance, cross-OS package check, QA Lab parity, Matrix, Telegram lane에 대해 `OpenClaw Release Checks`를 dispatch합니다. stable/default 실행은 exhaustive live/E2E 및 Docker release-path soak를 `run_release_soak=true` 뒤에 둡니다. `release_profile=full`은 soak를 강제로 켭니다. `release_profile=full` 및 `rerun_group=all`이면 release check의 `release-package-under-test` 아티팩트에 대해 package Telegram E2E도 실행합니다. 동일한 Telegram E2E가 게시된 npm 패키지도 증명해야 할 때는 publish 후 `npm_telegram_package_spec`을 제공합니다. Package Acceptance가 SHA로 빌드된 아티팩트 대신 배송된 npm 패키지에 대해 package/update matrix를 실행해야 할 때는 publish 후 `package_acceptance_package_spec`을 제공합니다. private evidence report가 Telegram E2E를 강제하지 않고 validation이 게시된 npm 패키지와 일치함을 증명해야 할 때는 `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 릴리스 작업이 계속되는 동안 패키지 candidate에 대한 side-channel 증명이 필요하면 수동 `Package Acceptance` workflow를 실행합니다. `openclaw@beta`, `openclaw@latest`, 또는 정확한 릴리스 버전에는 `source=npm`을 사용합니다. 현재 `workflow_ref` harness로 신뢰할 수 있는 `package_ref` branch/tag/SHA를 pack하려면 `source=ref`를 사용합니다. 필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용합니다. 다른 GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다. 이 workflow는 candidate를 `package-under-test`로 resolve하고, 해당 tarball에 대해 Docker E2E release scheduler를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 동일한 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택한 Docker lane에 `published-upgrade-survivor`가 포함되면 package 아티팩트가 candidate가 되고, `published_upgrade_survivor_baseline`이 게시된 baseline을 선택합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 profile:
  - `smoke`: install/channel/agent, gateway network, config reload lane
  - `package`: OpenWebUI 또는 live ClawHub 없이 artifact-native package/update/Plugin lane
  - `product`: package profile에 MCP channel, cron/subagent cleanup,
    OpenAI web search, OpenWebUI 추가
  - `full`: OpenWebUI를 포함한 Docker release-path chunk
  - `custom`: 집중 rerun을 위한 정확한 `docker_lanes` 선택
- release candidate에 대해 전체 normal CI coverage만 필요할 때는 수동 `CI` workflow를 직접 실행합니다. 수동 CI dispatch는 changed scoping을 우회하고 Linux Node shard, bundled-Plugin shard, channel contract, Node 22 compatibility, `check`, `check-additional`, build smoke, docs check, Python skills, Windows, macOS, Android, Control UI i18n lane을 강제합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- 릴리스 telemetry를 validation할 때 `pnpm qa:otel:smoke`를 실행합니다. 이는 로컬 OTLP/HTTP receiver를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 collector 없이 exported trace span name, bounded attribute, content/identifier redaction을 검증합니다.
- 모든 tagged release 전에 `pnpm release:check`를 실행합니다.
- tag가 존재한 후 mutating publish sequence를 위해 `OpenClaw Release Publish`를 실행합니다. `release/YYYY.M.D`에서 dispatch하거나 main에서 도달 가능한 tag를 publish할 때는 `main`에서 dispatch하고, release tag와 성공한 OpenClaw npm `preflight_run_id`를 전달하며, 집중 repair를 의도적으로 실행하는 경우가 아니라면 기본 Plugin publish scope인 `all-publishable`을 유지합니다. 이 workflow는 core package가 외부화된 Plugin보다 먼저 publish되지 않도록 Plugin npm publish, Plugin ClawHub publish, OpenClaw npm publish를 직렬화합니다.
- Release check는 이제 별도의 수동 workflow에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity lane과 빠른 live Matrix profile 및 Telegram QA lane도 실행합니다. live lane은 `qa-live-shared` environment를 사용합니다. Telegram은 Convex CI credential lease도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 원할 때는 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` workflow를 실행합니다.
- Cross-OS install 및 upgrade runtime validation은 public `OpenClaw Release Checks`와 `Full Release Validation`의 일부이며, 이들은 reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`를 직접 호출합니다.
- 이 분리는 의도적입니다. 실제 npm release path를 짧고 deterministic하며 artifact 중심으로 유지하고, 더 느린 live check는 자체 lane에 두어 publish를 지연하거나 차단하지 않게 합니다.
- secret을 포함하는 release check는 `Full Release
Validation`을 통해 dispatch하거나 `main`/release workflow ref에서 dispatch하여 workflow logic과 secret이 계속 통제되도록 해야 합니다.
- `OpenClaw Release Checks`는 resolved commit이 OpenClaw branch 또는 release tag에서 도달 가능하다면 branch, tag, 또는 전체 commit SHA를 받을 수 있습니다.
- `OpenClaw NPM Release` validation-only preflight도 pushed tag 없이 현재 전체 40자 workflow-branch commit SHA를 받을 수 있습니다.
- 해당 SHA path는 validation-only이며 실제 publish로 승격될 수 없습니다.
- SHA mode에서 workflow는 package metadata check 용도로만 `v<package.json version>`을 synthesize합니다. 실제 publish에는 여전히 실제 release tag가 필요합니다.
- 두 workflow 모두 실제 publish 및 promotion path는 GitHub-hosted runner에 유지하고, non-mutating validation path는 더 큰 Blacksmith Linux runner를 사용할 수 있습니다.
- 해당 workflow는 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` workflow secret 둘 다 사용하여 실행합니다.
- npm release preflight는 더 이상 별도의 release check lane을 기다리지 않습니다.
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  또는 일치하는 beta/correction tag를 실행합니다.
- npm publish 후에는 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  또는 일치하는 beta/correction version을 실행하여 fresh temp prefix에서 게시된 registry install path를 검증합니다.
- beta publish 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행하여 공유 leased Telegram credential pool을 사용해 게시된 npm 패키지에 대해 installed-package onboarding, Telegram setup, real Telegram E2E를 검증합니다. 로컬 maintainer 일회성 실행은 Convex var를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env credential을 직접 전달할 수 있습니다.
- maintainer machine에서 전체 post-publish beta smoke를 실행하려면 `pnpm release:beta-smoke -- --beta betaN`을 사용합니다. 이 helper는 Parallels npm update/fresh-target validation을 실행하고, `NPM Telegram Beta E2E`를 dispatch하며, 정확한 workflow run을 poll하고, artifact를 download한 다음 Telegram report를 출력합니다.
- maintainer는 GitHub Actions에서 수동 `NPM Telegram Beta E2E` workflow를 통해 동일한 post-publish check를 실행할 수 있습니다. 이는 의도적으로 manual-only이며 모든 merge에서 실행되지 않습니다.
- maintainer release automation은 이제 preflight-then-promote를 사용합니다:
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 합니다.
  - 실제 npm publish는 성공한 preflight run과 동일한 `main` 또는 `release/YYYY.M.D` branch에서 dispatch되어야 합니다.
  - stable npm release의 기본값은 `beta`입니다.
  - stable npm publish는 workflow input으로 명시적으로 `latest`를 target할 수 있습니다.
  - token 기반 npm dist-tag mutation은 이제 보안을 위해 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. public repo는 OIDC-only publish를 유지하지만 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다.
  - public `macOS Release`는 validation-only입니다. tag가 release branch에만 존재하지만 workflow가 `main`에서 dispatch되는 경우 `public_release_branch=release/YYYY.M.D`를 설정합니다.
  - 실제 private mac publish는 성공한 private mac `preflight_run_id`와 `validate_run_id`를 통과해야 합니다.
  - 실제 publish path는 prepared artifact를 다시 rebuild하지 않고 promote합니다.
- `YYYY.M.D-N` 같은 stable correction release의 경우 post-publish verifier는 `YYYY.M.D`에서 `YYYY.M.D-N`으로의 동일한 temp-prefix upgrade path도 검사하여 release correction이 기존 global install을 base stable payload에 조용히 남겨두지 않도록 합니다.
- npm release preflight는 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 fail closed되므로 빈 browser dashboard를 다시 ship하지 않습니다.
- Post-publish verification은 published Plugin entrypoint와 package metadata가 installed registry layout에 존재하는지도 검사합니다. Plugin runtime payload가 누락된 상태로 ship되는 release는 postpublish verifier에 실패하며 `latest`로 promote될 수 없습니다.
- `pnpm test:install:smoke`도 candidate update tarball에 대해 npm pack `unpackedSize` budget을 enforce하므로 installer e2e가 release publish path 전에 accidental pack bloat를 포착합니다.
- release work가 CI planning, extension timing manifest, 또는 extension test matrix를 건드렸다면 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner-owned `plugin-prerelease-extension-shard` matrix output을 regenerate하고 review하여 release note가 stale CI layout을 설명하지 않게 합니다.
- stable macOS release readiness에는 updater surface도 포함됩니다:
  - GitHub release는 packaged `.zip`, `.dmg`, `.dSYM.zip`을 최종적으로 포함해야 합니다.
  - `main`의 `appcast.xml`은 publish 후 새 stable zip을 가리켜야 합니다.
  - packaged app은 non-debug bundle id, 비어 있지 않은 Sparkle feed URL, 해당 release version의 canonical Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다.

## Release test box

`Full Release Validation`은 operator가 하나의 entrypoint에서 모든 사전 릴리스 test를 시작하는 방법입니다. 빠르게 움직이는 branch에서 pinned commit proof가 필요하면 helper를 사용하여 모든 child workflow가 target SHA에 고정된 temporary branch에서 실행되도록 합니다.

```bash
pnpm ci:full-release --sha <full-sha>
```

helper는 `release-ci/<sha>-...`를 push하고, 해당 branch에서 `ref=<sha>`로 `Full Release Validation`을 dispatch하며, 모든 child workflow `headSha`가 target과 일치하는지 검증한 다음 temporary branch를 삭제합니다. 이렇게 하면 실수로 더 새로운 `main` child run을 증명하는 일을 피할 수 있습니다.

release branch 또는 tag validation의 경우 신뢰할 수 있는 `main` workflow ref에서 실행하고 release branch 또는 tag를 `ref`로 전달합니다.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

워크플로는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, 패키지 대상 검사를 위한 상위 `release-package-under-test` 아티팩트를 준비한 뒤, `release_profile=full`이면서 `rerun_group=all`이거나 `npm_telegram_package_spec`이 설정된 경우 독립 실행형 패키지 Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 설치 스모크, 교차 OS 릴리스 검사, soak가 활성화된 경우 live/E2E Docker 릴리스 경로 커버리지, Telegram 패키지 QA가 포함된 Package Acceptance, QA Lab 패리티, live Matrix, live Telegram으로 확장됩니다. 전체 실행은 `Full Release Validation` 요약에서 `normal_ci`와 `release_checks`가 성공으로 표시될 때만 허용됩니다. full/all 모드에서는 `npm_telegram` 하위 항목도 성공해야 합니다. full/all 외부에서는 게시된 `npm_telegram_package_spec`이 제공된 경우가 아니면 건너뜁니다. 최종 검증자 요약에는 각 하위 실행의 가장 느린 작업 표가 포함되므로, 릴리스 관리자는 로그를 다운로드하지 않고도 현재 중요 경로를 확인할 수 있습니다.
전체 단계 매트릭스, 정확한 워크플로 작업 이름, stable 프로필과 full 프로필의 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.
하위 워크플로는 대상 `ref`가 오래된 릴리스 브랜치나 태그를 가리키는 경우에도, 일반적으로 `--ref main`인 `Full Release Validation`을 실행하는 신뢰된 ref에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. 워크플로 실행 ref를 선택하여 신뢰된 하네스를 선택하세요. 이동하는 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 ref가 될 수 없으므로, 고정된 임시 브랜치를 만들려면 `pnpm ci:full-release --sha <sha>`를 사용하세요.

live/provider 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/core live 및 Docker 경로
- `stable`: 릴리스 승인을 위한 minimum과 stable provider/backend 커버리지
- `full`: stable과 광범위한 advisory provider/media 커버리지

릴리스 차단 lane이 green이고 승격 전에 포괄적인 live/E2E, Docker 릴리스 경로, all-since-2026.4.23 upgrade-survivor 스윕을 원할 때는 `stable`과 함께 `run_release_soak=true`를 사용하세요. `full`은 `run_release_soak=true`를 의미합니다.

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 대상 ref를 한 번 `release-package-under-test`로 해석하고, soak가 실행될 때 교차 OS, Package Acceptance, 릴리스 경로 Docker 검사에서 해당 아티팩트를 재사용합니다. 이렇게 하면 모든 패키지 대상 박스가 동일한 바이트를 사용하고 반복 패키지 빌드를 피할 수 있습니다. 교차 OS OpenAI 설치 스모크는 repo/org 변수가 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 lane은 가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, gateway 시작, live agent 턴 하나를 검증하기 때문입니다. 더 광범위한 live provider 매트릭스는 모델별 커버리지를 담당합니다.

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

집중 수정 후 첫 번째 재실행으로 전체 umbrella를 사용하지 마세요. 박스 하나가 실패하면 다음 증명에는 실패한 하위 워크플로, 작업, Docker lane, 패키지 프로필, 모델 provider 또는 QA lane을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전 all-box 증거를 오래된 것으로 만들었을 때만 전체 umbrella를 다시 실행하세요. umbrella의 최종 검증자는 기록된 하위 워크플로 실행 ID를 다시 검사하므로, 하위 워크플로가 성공적으로 재실행된 뒤에는 실패한 상위 `Verify full validation` 작업만 다시 실행하세요.

제한된 복구의 경우 umbrella에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 하위 항목만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 하위 항목만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다. 집중 `npm-telegram` 재실행에는 `npm_telegram_package_spec`이 필요합니다. `release_profile=full`인 full/all 실행은 release-checks 패키지 아티팩트를 사용합니다. 집중 교차 OS 재실행에는 `cross_os_suite_filter=windows/packaged-upgrade` 또는 다른 OS/suite 필터를 추가할 수 있습니다. QA release-check 실패는 advisory입니다. QA 전용 실패는 릴리스 검증을 차단하지 않습니다.

### Vitest

Vitest 박스는 수동 `CI` 하위 워크플로입니다. 수동 CI는 의도적으로 변경 범위 지정을 우회하고 릴리스 후보에 대한 일반 테스트 그래프를 강제합니다. Linux Node 샤드, bundled-plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python skills, Windows, macOS, Android, Control UI i18n입니다.

“소스 트리가 전체 일반 테스트 스위트를 통과했는가?”에 답하려면 이 박스를 사용하세요. 이는 릴리스 경로 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 표시하는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 green 상태인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패하거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정적인 일반 CI가 필요하지만 Docker, QA Lab, live, 교차 OS 또는 패키지 박스가 필요하지 않을 때만 수동 CI를 직접 실행하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml` 및 release-mode `install-smoke` 워크플로를 통해 `OpenClaw Release Checks` 안에 있습니다. 이는 소스 수준 테스트만이 아니라 패키지화된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun 글로벌 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 root Dockerfile 스모크 이미지 준비/재사용. QR, root/gateway, installer/Bun 스모크 작업이 별도 install-smoke 샤드로 실행됨
- 저장소 E2E lane
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청 시 `plugins-runtime-services` 청크 내부의 OpenWebUI 커버리지
- 분할된 bundled plugin 설치/제거 lane `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지
- 릴리스 검사가 live suite를 포함할 때 live/E2E provider suite 및 Docker live 모델 커버리지

재실행하기 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 lane 로그, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구의 경우 모든 릴리스 청크를 다시 실행하는 대신 재사용 가능한 live/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`을 사용하세요. 생성된 재실행 명령에는 사용 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로, 실패한 lane은 동일한 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 분리된 agentic 동작 및 채널 수준 릴리스 gate입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- agentic parity pack을 사용해 OpenAI 후보 lane과 Opus 4.6 baseline을 비교하는 mock parity lane
- `qa-live-shared` 환경을 사용하는 빠른 live Matrix QA 프로필
- Convex CI 자격 증명 lease를 사용하는 live Telegram QA lane
- 릴리스 telemetry에 명시적인 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`

“릴리스가 QA 시나리오와 live 채널 흐름에서 올바르게 동작하는가?”에 답하려면 이 박스를 사용하세요. 릴리스를 승인할 때 parity, Matrix, Telegram lane의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 lane이 아니라 수동 샤드 QA-Lab 실행으로 계속 사용할 수 있습니다.

### 패키지

패키지 박스는 설치 가능한 제품 gate입니다. 이는 `Package Acceptance`와 resolver `scripts/resolve-openclaw-package-candidate.mjs`가 뒷받침합니다. resolver는 후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스로 신뢰된 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 준비된 릴리스 패키지 아티팩트, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `telegram_mode=mock-openai`와 함께 `source=artifact`로 Package Acceptance를 실행합니다. Package Acceptance는 동일하게 해석된 tarball에 대해 migration, update, 오래된 plugin 의존성 정리, offline plugin fixture, plugin update, Telegram 패키지 QA를 유지합니다. 릴리스 차단 검사는 기본 latest 게시 패키지 baseline을 사용합니다. `run_release_soak=true` 또는 `release_profile=full`은 `2026.4.23`부터 `latest`까지의 모든 stable npm 게시 baseline과 보고된 이슈 fixture로 확장됩니다. 이미 출시된 후보에는 `source=npm`과 함께 Package Acceptance를 사용하고, 게시 전 SHA 기반 로컬 npm tarball에는 `source=ref`/`source=artifact`를 사용하세요. 이는 이전에 Parallels가 필요했던 대부분의 패키지/update 커버리지를 대체하는 GitHub-native 방식입니다. 교차 OS 릴리스 검사는 OS별 온보딩, installer, 플랫폼 동작에 여전히 중요하지만, 패키지/update 제품 검증에는 Package Acceptance를 우선 사용해야 합니다.

update 및 plugin 검증의 표준 체크리스트는 [update 및 plugin 테스트](/ko/help/testing-updates-plugins)입니다. plugin 설치/update, doctor cleanup 또는 게시 패키지 migration 변경을 증명하는 local, Docker, Package Acceptance 또는 release-check lane을 결정할 때 사용하세요. 모든 stable `2026.4.23+` 패키지에서의 포괄적인 게시 update migration은 별도의 수동 `Update Migration` 워크플로이며, Full Release CI의 일부가 아닙니다.

레거시 package-acceptance 완화는 의도적으로 기간이 제한되어 있습니다. `2026.4.25`까지의 패키지는 이미 npm에 게시된 metadata gap에 대해 호환성 경로를 사용할 수 있습니다. tarball에 없는 private QA 인벤토리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git fixture의 누락된 patch 파일, 누락된 지속 `update.channel`, 레거시 plugin install-record 위치, 누락된 marketplace install-record 지속성, `plugins update` 중 config metadata migration입니다. 게시된 `2026.4.26` 패키지는 이미 출시된 local build metadata stamp 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 패키지 계약을 충족해야 하며, 동일한 gap은 릴리스 검증에서 실패합니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때 더 넓은 Package Acceptance 프로필을 사용하세요:

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

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크, config
  reload 레인
- `package`: 라이브 ClawHub 없이 install/update/plugin 패키지 계약을 확인합니다. 이는 릴리스 검사
  기본값입니다
- `product`: `package`에 MCP 채널, cron/subagent 정리, OpenAI web
  search, OpenWebUI를 더한 프로필입니다
- `full`: OpenWebUI를 포함한 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명을 위해 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 이 workflow는 해석된
`package-under-test` tarball을 Telegram 레인으로 전달합니다. 독립 실행형
Telegram workflow는 게시 후 검사를 위해 여전히 게시된 npm spec을 받습니다.

## 릴리스 게시 자동화

`OpenClaw Release Publish`는 일반적인 변경을 수행하는 게시 진입점입니다. 릴리스에 필요한 순서대로
신뢰할 수 있는 publisher workflow를 조율합니다.

1. 릴리스 태그를 체크아웃하고 해당 commit SHA를 해석합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다.
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로
   `Plugin NPM Release`를 dispatch합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 dispatch합니다.
6. 릴리스 태그, npm dist-tag, 저장된 `preflight_run_id`로
   `OpenClaw NPM Release`를 dispatch합니다.

Beta 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

기본 beta dist-tag로 Stable 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest`로 직접 Stable 승격하는 것은 명시적입니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

하위 수준의 `Plugin NPM Release` 및 `Plugin ClawHub Release` workflow는
집중 복구 또는 재게시 작업에만 사용하세요. 선택한 plugin 복구의 경우
`plugin_publish_scope=selected` 및 `plugins=@openclaw/name`을
`OpenClaw Release Publish`에 전달하거나, OpenClaw 패키지를 게시하면 안 되는 경우
자식 workflow를 직접 dispatch하세요.

## NPM workflow 입력

`OpenClaw NPM Release`는 운영자가 제어하는 다음 입력을 받습니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1`, 또는 `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다. `preflight_only=true`인 경우 검증 전용 preflight를 위해 현재
  전체 40자 workflow 브랜치 commit SHA도 사용할 수 있습니다
- `preflight_only`: 검증/build/package 전용이면 `true`, 실제 게시 경로이면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수입니다. workflow가 성공한 preflight 실행에서 준비된 tarball을 재사용하도록 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그입니다. 기본값은 `beta`입니다

`OpenClaw Release Publish`는 운영자가 제어하는 다음 입력을 받습니다.

- `tag`: 필수 릴리스 태그입니다. 이미 존재해야 합니다
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` preflight 실행 id입니다.
  `publish_openclaw_npm=true`일 때 필요합니다
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. 집중 복구 작업에만
  `selected`를 사용하세요
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분한 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. workflow를 plugin 전용 복구 orchestrator로 사용할 때만 `false`로 설정하세요

`OpenClaw Release Checks`는 운영자가 제어하는 다음 입력을 받습니다.

- `ref`: 검증할 브랜치, 태그, 또는 전체 commit SHA입니다. secret이 필요한 검사는
  해석된 commit이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.
- `run_release_soak`: stable/default 릴리스 검사에서 전체 live/E2E, Docker 릴리스 경로, all-since upgrade-survivor soak를 선택합니다. `release_profile=full`이면 강제로 켜집니다.

규칙:

- Stable 및 correction 태그는 `beta` 또는 `latest` 중 하나로 게시할 수 있습니다
- Beta prerelease 태그는 `beta`로만 게시할 수 있습니다
- `OpenClaw NPM Release`에서 전체 commit SHA 입력은 `preflight_only=true`일 때만 허용됩니다
- `OpenClaw Release Checks` 및 `Full Release Validation`은 항상 검증 전용입니다
- 실제 게시 경로는 preflight 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  workflow는 게시를 계속하기 전에 해당 metadata를 검증합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 preflight workflow의 검증 전용 dry run을 위해 현재 전체 workflow 브랜치 commit
     SHA를 사용할 수 있습니다
2. 일반적인 beta-first 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 stable 게시를 원할 때만 `latest`를 선택합니다
3. 하나의 수동 workflow에서 일반 CI와 live prompt cache, Docker, QA Lab,
   Matrix, Telegram coverage를 원할 때는 릴리스 브랜치, 릴리스 태그, 또는 전체
   commit SHA에서 `Full Release Validation`을 실행합니다
4. 의도적으로 결정적 일반 테스트 그래프만 필요하다면 릴리스 ref에서
   수동 `CI` workflow를 실행합니다
5. 성공한 `preflight_run_id`를 저장합니다
6. 동일한 `tag`, 동일한 `npm_dist_tag`, 저장된 `preflight_run_id`로 `OpenClaw Release Publish`를 실행합니다. 이 workflow는 OpenClaw npm 패키지를 승격하기 전에 외부화된 plugin을 npm과 ClawHub에 게시합니다
7. 릴리스가 `beta`에 landed된 경우 private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow를 사용해 해당 stable 버전을 `beta`에서 `latest`로 승격합니다
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 stable build를 따라야 한다면, 같은 private
   workflow를 사용해 두 dist-tag가 stable 버전을 가리키게 하거나, 예약된
   self-healing sync가 나중에 `beta`를 이동하게 둡니다

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하기 때문에 보안을 위해 private repo에 있으며,
public repo는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta-first 승격 경로가 모두 문서화되고 운영자에게 표시됩니다.

maintainer가 local npm 인증으로 fallback해야 하는 경우, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행하세요. main agent shell에서 `op`를
직접 호출하지 마세요. tmux 안에 유지하면 prompt,
alert, OTP 처리를 관찰할 수 있고 반복되는 host alert를 방지할 수 있습니다.

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

Maintainer는 실제 runbook을 위해 private 릴리스 문서인
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)를 사용합니다.

## 관련

- [릴리스 채널](/ko/install/development-channels)
