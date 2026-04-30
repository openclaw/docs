---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 인수 검사 실행
    - 버전 명명 방식과 릴리스 주기 찾기
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-30T06:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시되거나, 명시적으로 요청된 경우 npm `latest`에 게시되는 태그된 릴리스
- beta: npm `beta`에 게시되는 사전 릴리스 태그
- dev: `main`의 이동하는 최신 헤드

## 버전 이름 지정

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 사전 릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일에 앞에 0을 붙이지 마세요
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다;
  beta 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 안정 릴리스용으로 남겨둡니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- 안정 릴리스는 최신 beta가 검증된 후에만 이어집니다
- 유지관리자는 일반적으로 현재 `main`에서 만든 `release/YYYY.M.D` 브랜치에서
  릴리스를 생성하므로, 릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- beta 태그가 푸시되었거나 게시되었고 수정이 필요한 경우, 유지관리자는 이전 beta 태그를 삭제하거나 다시 만들지 않고
  다음 `-beta.N` 태그를 생성합니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은
  유지관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 정보는
유지관리자 전용 릴리스 런북에 남겨둡니다.

1. 현재 `main`에서 시작합니다: 최신 내용을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 녹색인지 확인합니다.
2. 실제 커밋 기록을 바탕으로 `/changelog`로 최상단 `CHANGELOG.md` 섹션을 다시 작성하고,
   항목을 사용자 관점으로 유지한 뒤 커밋하고 푸시한 다음, 브랜치를 만들기 전에 한 번 더 rebase/pull합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`에서 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장되는 경우에만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 만듭니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올린 다음,
   로컬 결정적 사전 점검을 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는,
   검증 전용 사전 점검에 전체 40자 릴리스 브랜치 SHA를 사용할 수 있습니다.
   성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로
   모든 사전 릴리스 테스트를 시작합니다. 이것이 네 가지 큰 릴리스 테스트 박스인
   Vitest, Docker, QA Lab, Package의 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정이 입증되는 가장 작은 실패한
   파일, 레인, 워크플로 작업, 패키지 프로필, provider 또는 모델 허용 목록을 다시 실행합니다.
   변경된 표면 때문에 이전 증거가 낡았을 때만 전체 우산 흐름을 다시 실행합니다.
9. beta의 경우 `vYYYY.M.D-beta.N` 태그를 만들고 npm dist-tag `beta`로 게시한 다음,
   게시된 `openclaw@YYYY.M.D-beta.N`
   또는 `openclaw@beta` 패키지에 대해 게시 후 패키지 수락 검증을 실행합니다. 푸시되었거나 게시된 beta에 수정이 필요하면
   다음 `-beta.N`을 생성합니다. 이전 beta를 삭제하거나 다시 쓰지 마세요.
10. 안정 릴리스의 경우 검증된 beta 또는 릴리스 후보에 필요한 검증 증거가 있을 때만 계속합니다.
    안정 npm 게시는 `preflight_run_id`를 통해 성공한
    사전 점검 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비 상태에는
    패키지된 `.zip`, `.dmg`, `.dSYM.zip` 및 `main`의 업데이트된
    `appcast.xml`도 필요합니다.
11. 게시 후에는 npm 게시 후 검증기를 실행하고, 게시 후 채널 증명이 필요할 때 선택적 독립 실행형
    published-npm Telegram E2E를 실행하며,
    필요 시 dist-tag 승격, 완전하게 일치하는 `CHANGELOG.md` 섹션에서 만든 GitHub 릴리스/사전 릴리스 노트, 릴리스 공지
    단계를 진행합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 적용되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 넓은 import cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 통과 상태가 되도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack 검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 하나의 진입점에서 모든 사전 릴리스 테스트 박스를 시작합니다. 이 워크플로는 브랜치, 태그 또는 전체 커밋 SHA를 받고, 수동 `CI`를 디스패치하며, install smoke, package acceptance, Docker 릴리스 경로 제품군, live/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram 레인에 대해 `OpenClaw Release Checks`를 디스패치합니다. 패키지가 게시되었고 게시 후 Telegram E2E도 실행해야 할 때만 `npm_telegram_package_spec`을 제공합니다. 비공개 증거 보고서가 Telegram E2E를 강제하지 않고 검증이 게시된 npm 패키지와 일치함을 증명해야 할 때 `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 릴리스 작업이 계속되는 동안 패키지 후보에 대한 보조 채널 증거가 필요할 때 수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@beta`, `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용하고, 현재 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치/태그/SHA를 pack하려면 `source=ref`를 사용하며, 필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용하거나, 다른 GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다. 워크플로는 후보를 `package-under-test`로 해석하고, 해당 tarball에 대해 Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 같은 tarball에 대해 Telegram QA를 실행할 수 있습니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  일반 프로필:
  - `smoke`: install/channel/agent, gateway network, config reload 레인
  - `package`: OpenWebUI 또는 live ClawHub 없이 아티팩트 네이티브 package/update/plugin 레인
  - `product`: package 프로필에 MCP channels, cron/subagent cleanup,
    OpenAI web search, OpenWebUI를 추가
  - `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택
- 릴리스 후보에 대해 전체 일반 CI 적용 범위만 필요할 때 수동 `CI` 워크플로를 직접 실행합니다. 수동 CI 디스패치는 changed scoping을 우회하고 Linux Node 샤드, bundled-plugin 샤드, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android, Control UI i18n 레인을 강제로 실행합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- 릴리스 telemetry를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은 로컬 OTLP/HTTP 수신기를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 collector 없이도 내보낸 trace span 이름, 제한된 attributes, content/identifier redaction을 검증합니다.
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행합니다
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity 게이트와 빠른 live Matrix 프로필 및 Telegram QA 레인도 실행합니다. live 레인은 `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI credential lease도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 원할 때는 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` 워크플로를 실행합니다.
- 교차 OS 설치 및 업그레이드 런타임 검증은 public `OpenClaw Release Checks` 및 `Full Release Validation`의 일부이며, 이들은 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 아티팩트 중심으로 유지하고, 더 느린 live 검사는 자체 레인에 두어 publish를 지연하거나 차단하지 않도록 합니다
- Secret-bearing 릴리스 검사는 `Full Release Validation`을 통해 또는 `main`/release workflow ref에서 디스패치하여 workflow logic과 secrets가 통제된 상태를 유지하도록 해야 합니다
- `OpenClaw Release Checks`는 해석된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능하기만 하면 브랜치, 태그 또는 전체 커밋 SHA를 허용합니다
- `OpenClaw NPM Release` validation-only preflight도 pushed tag를 요구하지 않고 현재 전체 40자 workflow-branch commit SHA를 허용합니다
- 해당 SHA 경로는 validation-only이며 실제 publish로 승격될 수 없습니다
- SHA 모드에서 워크플로는 package metadata check에 한해서만 `v<package.json version>`을 합성합니다. 실제 publish에는 여전히 실제 release tag가 필요합니다
- 두 워크플로 모두 실제 publish 및 promotion 경로는 GitHub-hosted runners에 유지하고, 변경이 없는 validation 경로는 더 큰 Blacksmith Linux runners를 사용할 수 있습니다
- 해당 워크플로는 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` workflow secrets를 모두 사용하여
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 실행합니다
- npm release preflight는 더 이상 별도의 release checks 레인을 기다리지 않습니다
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 일치하는 beta/correction tag)를 실행합니다
- npm publish 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 일치하는 beta/correction version)를 실행하여 fresh temp prefix에서 게시된 registry install path를 검증합니다
- beta publish 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  를 실행하여 shared leased Telegram credential pool을 사용해 게시된 npm 패키지에 대해 installed-package onboarding, Telegram setup, 실제 Telegram E2E를 검증합니다. 로컬 maintainer 일회성 실행은 Convex vars를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env credentials를 직접 전달할 수 있습니다.
- Maintainer는 수동 `NPM Telegram Beta E2E` 워크플로를 통해 GitHub Actions에서 같은 post-publish check를 실행할 수 있습니다. 이는 의도적으로 manual-only이며 모든 merge마다 실행되지 않습니다.
- Maintainer release automation은 이제 preflight-then-promote를 사용합니다:
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm publish는 성공한 preflight run과 같은 `main` 또는 `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - stable npm releases는 기본적으로 `beta`를 사용합니다
  - stable npm publish는 workflow input을 통해 명시적으로 `latest`를 대상으로 할 수 있습니다
  - token-based npm dist-tag mutation은 이제 보안을 위해 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하지만 public repo는 OIDC-only publish를 유지하기 때문입니다
  - public `macOS Release`는 validation-only입니다
  - 실제 private mac publish는 성공한 private mac `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 publish paths는 준비된 artifacts를 다시 빌드하지 않고 promote합니다
- `YYYY.M.D-N` 같은 stable correction releases의 경우, post-publish verifier는 같은 temp-prefix upgrade path도 `YYYY.M.D`에서 `YYYY.M.D-N`으로 확인하여 release corrections가 이전 global installs를 base stable payload에 조용히 남겨두지 못하게 합니다
- npm release preflight는 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 fail closed 처리되어, 빈 browser dashboard를 다시 배포하지 않도록 합니다
- Post-publish verification은 게시된 registry install에 root `dist/*` 레이아웃 아래 비어 있지 않은 bundled plugin runtime deps가 포함되어 있는지도 확인합니다. 누락되었거나 비어 있는 bundled plugin dependency payloads와 함께 배포된 릴리스는 postpublish verifier에 실패하며 `latest`로 promote될 수 없습니다.
- `pnpm test:install:smoke`는 candidate update tarball에 대해 npm pack `unpackedSize` budget도 강제하므로 installer e2e가 release publish path 전에 의도치 않은 pack bloat를 잡습니다
- 릴리스 작업이 CI planning, extension timing manifests 또는 extension test matrices를 건드렸다면, 승인 전에 `.github/workflows/plugin-prerelease.yml`에서 planner-owned `plugin-prerelease-extension-shard` matrix outputs를 다시 생성하고 검토하여 release notes가 오래된 CI layout을 설명하지 않도록 합니다
- Stable macOS release readiness에는 updater surfaces도 포함됩니다:
  - GitHub release에는 packaged `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - `main`의 `appcast.xml`은 publish 후 새 stable zip을 가리켜야 합니다
  - packaged app은 non-debug bundle id, 비어 있지 않은 Sparkle feed URL, 그리고 해당 release version의 canonical Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 신뢰할 수 있는 `main` workflow ref에서 실행하고 release branch, tag 또는 전체 commit SHA를 `ref`로 전달합니다:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

워크플로는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, `npm_telegram_package_spec`이 설정된 경우 선택적으로 standalone post-publish Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 install smoke, cross-OS release checks, live/E2E Docker release-path coverage, Telegram package QA가 포함된 Package Acceptance, QA Lab parity, live Matrix, live Telegram으로 확장 실행됩니다. 전체 실행은 `Full Release Validation` summary에서 `normal_ci`와 `release_checks`가 successful로 표시되고, 선택적 `npm_telegram` child가 successful이거나 의도적으로 skipped일 때만 허용됩니다. 최종 verifier summary에는 각 child run의 slowest-job tables가 포함되어 release manager가 logs를 다운로드하지 않고도 현재 critical path를 볼 수 있습니다.
Child workflows는 target `ref`가 오래된 release branch 또는 tag를 가리키더라도 `Full Release Validation`을 실행하는 trusted ref, 일반적으로 `--ref main`에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref input은 없습니다. workflow run ref를 선택하여 trusted harness를 선택합니다.

live/provider 범위를 선택하려면 `release_profile`을 사용합니다:

- `minimum`: 가장 빠른 release-critical OpenAI/core live 및 Docker path
- `stable`: release approval을 위한 minimum plus stable provider/backend coverage
- `full`: stable plus broad advisory provider/media coverage

`OpenClaw Release Checks`는 trusted workflow ref를 사용하여 target ref를 한 번 `release-package-under-test`로 해석하고 해당 artifact를 release-path Docker checks와 Package Acceptance 모두에서 재사용합니다. 이를 통해 모든 package-facing boxes가 같은 bytes를 사용하고 반복된 package builds를 피합니다.
cross-OS OpenAI install smoke는 repo/org variable이 설정되어 있으면 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4-mini`를 사용합니다. 이 레인은 가장 느린 기본 model을 benchmark하는 것이 아니라 package install, onboarding, gateway startup 및 한 번의 live agent turn을 증명하기 때문입니다. 더 넓은 live provider matrix는 model-specific coverage를 위한 위치로 남아 있습니다.

릴리스 단계에 따라 다음 변형을 사용합니다:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

집중 수정 후 첫 재실행으로 전체 상위 워크플로를 사용하지 마세요. 박스 하나가
실패하면 다음 증명에는 실패한 하위 워크플로, 작업, Docker 레인, 패키지 프로필, 모델
제공자 또는 QA 레인을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나
이전의 전체 박스 증거를 오래된 것으로 만든 경우에만 전체 상위 워크플로를 다시 실행하세요.
상위 워크플로의 최종 검증기는 기록된 하위 워크플로 실행 ID를 다시 확인하므로, 하위
워크플로를 성공적으로 재실행한 뒤에는 실패한 상위 `Verify full validation` 작업만
다시 실행하세요.

제한된 복구에는 상위 워크플로에 `rerun_group`을 전달하세요. `all`은 실제
릴리스 후보 실행이고, `ci`는 일반 CI 하위만 실행하며, `plugin-prerelease`는 릴리스 전용
Plugin 하위만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스
그룹은 독립 실행형 패키지 Telegram 레인이 제공될 때 `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다.

### Vitest

Vitest 박스는 수동 `CI` 하위 워크플로입니다. 수동 CI는 의도적으로 변경 범위 지정을
우회하고 릴리스 후보에 대한 일반 테스트 그래프를 강제합니다: Linux Node 샤드, 번들 Plugin
샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사,
Python Skills, Windows, macOS, Android, Control UI i18n.

"소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답할 때 이 박스를 사용하세요.
이는 릴리스 경로 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여 주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 성공한 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패하거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정론적인 일반 CI가 필요하지만 Docker, QA Lab, 라이브, 크로스 OS 또는 패키지
박스는 필요하지 않을 때만 수동 CI를 직접 실행하세요:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통해
`OpenClaw Release Checks`에 있으며, 릴리스 모드 `install-smoke` 워크플로도 포함합니다.
소스 수준 테스트만이 아니라 패키징된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 범위에는 다음이 포함됩니다:

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용, QR, 루트/Gateway, 설치 관리자/Bun 스모크 작업이 별도 install-smoke 샤드로 실행됨
- 저장소 E2E 레인
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b`, 그리고
  `bundled-channels-contracts`
- 요청 시 `plugins-runtime-services` 청크 안의 OpenWebUI 범위
- 하나의 큰 번들 채널 작업 대신 channel-smoke, update-target, setup/runtime 계약 청크로 분할된 번들 채널 종속성 레인
- `bundled-plugin-install-uninstall-0`부터
  `bundled-plugin-install-uninstall-23`까지 분할된 번들 Plugin 설치/제거 레인
- 릴리스 검사가 라이브 스위트를 포함할 때 라이브/E2E 제공자 스위트와 Docker 라이브 모델 범위

재실행하기 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 레인 로그,
`summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 재실행 명령이 포함된
`.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 청크를 재실행하는 대신
재사용 가능한 라이브/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`을 사용하세요.
생성된 재실행 명령은 사용 가능할 때 이전 `package_artifact_run_id`와 준비된 Docker 이미지
입력을 포함하므로, 실패한 레인은 같은 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지
메커니즘과 별개의 에이전트 동작 및 채널 수준 릴리스 게이트입니다.

릴리스 QA Lab 범위에는 다음이 포함됩니다:

- 에이전트 패리티 팩을 사용해 OpenAI 후보 레인을 Opus 4.6 기준선과 비교하는 mock 패리티 게이트
- `qa-live-shared` 환경을 사용하는 빠른 라이브 Matrix QA 프로필
- Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA 레인
- 릴리스 telemetry에 명시적 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`

"릴리스가 QA 시나리오와 라이브 채널 흐름에서 올바르게 동작하는가?"에 답할 때 이 박스를
사용하세요. 릴리스를 승인할 때 패리티, Matrix, Telegram 레인의 아티팩트 URL을 보관하세요.
전체 Matrix 범위는 기본 릴리스 핵심 레인이 아니라 수동 샤딩된 QA-Lab 실행으로 계속 사용할
수 있습니다.

### Package

Package 박스는 설치 가능한 제품 게이트입니다. 이는 `Package Acceptance`와 리졸버
`scripts/resolve-openclaw-package-candidate.mjs`로 뒷받침됩니다. 리졸버는 후보를 Docker
E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며,
패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA 패킹
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행이 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=ref`, `package_ref=<release-ref>`,
`suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline`,
`telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. 릴리스 경로 Docker 청크는
겹치는 설치, 업데이트, Plugin 업데이트 레인을 처리합니다. Package Acceptance는 같은 해석된
tarball을 대상으로 아티팩트 네이티브 번들 채널 호환성, 오프라인 Plugin fixture, Telegram
패키지 QA를 유지합니다. 이는 이전에 대부분 Parallels가 필요했던 패키지/업데이트 범위의
GitHub 네이티브 대체입니다. 크로스 OS 릴리스 검사는 OS별 온보딩, 설치 관리자, 플랫폼
동작에 여전히 중요하지만, 패키지/업데이트 제품 검증은 Package Acceptance를 우선해야 합니다.

레거시 package-acceptance 완화는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의 패키지는
이미 npm에 게시된 메타데이터 누락에 대해 호환성 경로를 사용할 수 있습니다: tarball에 없는
비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git fixture의
누락된 패치 파일, 누락된 지속 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된
marketplace 설치 기록 지속성, `plugins update` 중 config 메타데이터 마이그레이션. 게시된
`2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다.
이후 패키지는 최신 패키지 계약을 만족해야 하며, 같은 누락은 릴리스 검증 실패가 됩니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때 더 넓은 Package Acceptance 프로필을
사용하세요:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

일반 패키지 프로필:

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크, config 다시 로드 레인
- `package`: 라이브 ClawHub 없는 설치/업데이트/Plugin 패키지 계약. 이것이 release-check 기본값입니다
- `product`: `package`에 MCP 채널, cron/subagent 정리, OpenAI 웹 검색, OpenWebUI를 더한 것
- `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명에는 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는 해석된 `package-under-test` tarball을
Telegram 레인으로 전달합니다. 독립 실행형 Telegram 워크플로는 게시 후 검사를 위해 게시된 npm
spec을 계속 허용합니다.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` 같은 필수 릴리스 태그. `preflight_only=true`일 때는 검증 전용 preflight를 위한 현재 전체 40자 워크플로 브랜치 커밋 SHA도 될 수 있음
- `preflight_only`: 검증/빌드/패키지만이면 `true`, 실제 게시 경로이면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 preflight 실행의 준비된 tarball을 재사용하도록 함
- `npm_dist_tag`: 게시 경로의 npm 대상 태그. 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다:

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA. secret이 필요한 검사는 해석된 커밋이 OpenClaw 브랜치나 릴리스 태그에서 도달 가능해야 합니다.

규칙:

- stable 및 correction 태그는 `beta` 또는 `latest` 중 하나에 게시할 수 있습니다
- beta 시험판 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`에서는 `preflight_only=true`일 때만 전체 커밋 SHA 입력이 허용됩니다
- `OpenClaw Release Checks`와 `Full Release Validation`은 항상 검증 전용입니다
- 실제 게시 경로는 preflight 중 사용한 것과 같은 `npm_dist_tag`를 사용해야 합니다. 워크플로는 게시 전에 해당 메타데이터가 계속 일치하는지 검증합니다

## stable npm 릴리스 순서

stable npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 preflight 워크플로의 검증 전용 dry run에 현재 전체 워크플로 브랜치 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 stable 게시를 원할 때만 `latest`를 선택합니다
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab, Matrix, Telegram 범위를 원할 때 릴리스 브랜치, 릴리스 태그 또는 전체 커밋 SHA에서 `Full Release Validation`을 실행합니다
4. 결정론적인 일반 테스트 그래프만 필요하다면 대신 릴리스 ref에서 수동 `CI` 워크플로를 실행합니다
5. 성공한 `preflight_run_id`를 저장합니다
6. 같은 `tag`, 같은 `npm_dist_tag`, 저장한 `preflight_run_id`로 `preflight_only=false`를 사용해 `OpenClaw NPM Release`를 다시 실행합니다
7. 릴리스가 `beta`에 올라갔다면 비공개 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 워크플로를 사용해 해당 stable 버전을 `beta`에서 `latest`로 승격합니다
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 같은 stable 빌드를 따라야 한다면, 같은 비공개 워크플로를 사용해 두 dist-tag가 stable 버전을 가리키게 하거나, 예약된 self-healing 동기화가 나중에 `beta`를 이동하도록 둡니다

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하기 때문에 보안을 위해 비공개 저장소에 있으며,
공개 저장소는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두 문서화되고 운영자에게 보이게 됩니다.

유지관리자가 로컬 npm 인증으로 대체해야 하는 경우, 모든 1Password
CLI (`op`) 명령은 전용 tmux 세션 안에서만 실행하세요. 주 에이전트 셸에서 `op`를
직접 호출하지 마세요. tmux 안에 두면 프롬프트,
알림, OTP 처리를 관찰할 수 있으며 반복적인 호스트 알림을 방지할 수 있습니다.

## 공개 참고 자료

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지관리자는 실제 실행 지침으로
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)에 있는
비공개 릴리스 문서를 사용합니다.

## 관련 항목

- [릴리스 채널](/ko/install/development-channels)
