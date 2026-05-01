---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 승인 실행
    - 버전 명명 방식과 출시 주기를 찾고 있습니다
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 규칙 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-05-01T06:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시되거나 명시적으로 요청된 경우 npm `latest`에 게시되는 태그된 릴리스
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 이름 지정

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- 베타 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일에는 0을 채우지 않습니다
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `beta`는 현재 베타 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 검증된 베타 빌드를 나중에 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다;
  베타 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 안정 릴리스용으로 남겨둡니다

## 릴리스 주기

- 릴리스는 베타 우선으로 진행됩니다
- 안정 릴리스는 최신 베타가 검증된 후에만 이어집니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D` 브랜치에서 릴리스를 만듭니다. 따라서 릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- 베타 태그가 푸시되었거나 게시된 뒤 수정이 필요한 경우, 유지관리자는 기존 베타 태그를 삭제하거나 다시 생성하는 대신 다음 `-beta.N` 태그를 만듭니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은 유지관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개적인 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 사항은 유지관리자 전용
릴리스 런북에 보관됩니다.

1. 현재 `main`에서 시작합니다: 최신 변경 사항을 pull하고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 녹색인지 확인합니다.
2. 실제 커밋 기록을 바탕으로 `/changelog`를 사용해 최상단 `CHANGELOG.md` 섹션을 다시 작성하고,
   항목을 사용자 관점으로 유지한 뒤 커밋하고 푸시하며, 브랜치를 만들기 전에 한 번 더 rebase/pull합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장될 때만 만료된
   호환성을 제거하거나, 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.D`를 만듭니다. 일반 릴리스 작업을 `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올린 다음, 로컬 결정적 사전 점검을 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   검증 전용 사전 점검에 전체 40자 릴리스 브랜치 SHA를 사용할 수 있습니다. 성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로 모든 프리릴리스 테스트를 시작합니다. 이것이 네 개의 큰 릴리스 테스트 박스인 Vitest, Docker, QA Lab, Package를 위한 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정을 증명하는 가장 작은 실패 파일, 레인, 워크플로 작업, 패키지 프로필, 공급자 또는 모델 허용 목록을 다시 실행합니다. 변경된 표면으로 인해 이전 증거가 오래된 경우에만 전체 엄브렐라를 다시 실행합니다.
9. 베타의 경우 `vYYYY.M.D-beta.N` 태그를 만들고 npm dist-tag `beta`로 게시한 다음, 게시된 `openclaw@YYYY.M.D-beta.N`
   또는 `openclaw@beta` 패키지에 대해 게시 후 패키지 수락 검사를 실행합니다. 푸시되었거나 게시된 베타에 수정이 필요하면
   다음 `-beta.N`을 만드세요. 기존 베타를 삭제하거나 다시 쓰지 마세요.
10. 안정 릴리스의 경우, 검증된 베타 또는 릴리스 후보에 필요한 검증 증거가 확보된 후에만 계속합니다. 안정 npm 게시에는
    `preflight_run_id`를 통해 성공한 사전 점검 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비 상태에는 패키징된
    `.zip`, `.dmg`, `.dSYM.zip` 및 `main`의 업데이트된
    `appcast.xml`도 필요합니다.
11. 게시 후에는 npm 게시 후 검증기를 실행하고, 게시 후 채널 증거가 필요할 때 선택적으로 독립 실행형
    게시된 npm Telegram E2E를 실행하며,
    필요한 경우 dist-tag 승격, 완전하게 일치하는 `CHANGELOG.md` 섹션의 GitHub 릴리스/프리릴리스 노트, 릴리스 공지
    단계를 수행합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 적용되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 광범위한 import cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 통과하도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack 검증 단계에 필요한 예상 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 하나의 진입점에서 모든 사전 릴리스 테스트 박스를 시작합니다. 이 워크플로는 브랜치, 태그 또는 전체 커밋 SHA를 받고, 수동 `CI`를 디스패치하며, 설치 스모크, 패키지 승인, Docker 릴리스 경로 스위트, live/E2E, OpenWebUI, QA Lab parity, Matrix, Telegram 레인을 위한 `OpenClaw Release Checks`를 디스패치합니다. 패키지가 게시되었고 게시 후 Telegram E2E도 실행해야 할 때만 `npm_telegram_package_spec`을 제공합니다. 비공개 증거 보고서가 Telegram E2E를 강제하지 않고 검증이 게시된 npm 패키지와 일치함을 증명해야 할 때 `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 릴리스 작업이 계속되는 동안 패키지 후보에 대한 side-channel 증거가 필요할 때 수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@beta`, `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용하고, 현재 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치/태그/SHA를 pack하려면 `source=ref`를 사용하고, 필수 SHA-256이 있는 HTTPS tarball에는 `source=url`을 사용하거나, 다른 GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다. 이 워크플로는 후보를 `package-under-test`로 해석하고, 해당 tarball에 대해 Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 같은 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택한 Docker 레인에 `published-upgrade-survivor`가 포함되면 패키지 아티팩트가 후보가 되고 `published_upgrade_survivor_baseline`이 게시된 기준선을 선택합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 프로필:
  - `smoke`: install/channel/agent, Gateway network, config reload 레인
  - `package`: OpenWebUI 또는 live ClawHub 없는 아티팩트 네이티브 package/update/Plugin 레인
  - `product`: package 프로필에 MCP channels, cron/subagent cleanup,
    OpenAI web search 및 OpenWebUI 추가
  - `full`: OpenWebUI가 포함된 Docker release-path 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택
- 릴리스 후보에 대해 전체 일반 CI 커버리지만 필요할 때 수동 `CI` 워크플로를 직접 실행합니다. 수동 CI 디스패치는 변경 범위 지정을 우회하고 Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22 호환성, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android, Control UI i18n 레인을 강제 실행합니다.
  예: `gh workflow run ci.yml --ref release/YYYY.M.D`
- 릴리스 telemetry를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은 로컬 OTLP/HTTP receiver를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 collector 없이 내보낸 trace span 이름, 제한된 attributes, content/identifier redaction을 검증합니다.
- 태그된 모든 릴리스 전에 `pnpm release:check`를 실행합니다
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity 게이트와 빠른 live Matrix 프로필 및 Telegram QA 레인도 실행합니다. live 레인은 `qa-live-shared` environment를 사용하며, Telegram은 Convex CI credential leases도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 원할 때는 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` 워크플로를 실행합니다.
- Cross-OS 설치 및 업그레이드 런타임 검증은 public `OpenClaw Release Checks` 및 `Full Release Validation`의 일부이며, 이들은 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 아티팩트 중심으로 유지하고, 더 느린 live 검사는 자체 레인에 두어 게시를 지연하거나 차단하지 않도록 합니다
- 비밀이 포함된 릴리스 검사는 `Full Release Validation`을 통해 또는 `main`/release workflow ref에서 디스패치하여 워크플로 로직과 비밀이 통제되도록 해야 합니다
- `OpenClaw Release Checks`는 해석된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능하기만 하면 브랜치, 태그 또는 전체 커밋 SHA를 받습니다
- `OpenClaw NPM Release` validation-only 사전 점검도 푸시된 태그 없이 현재 전체 40자 workflow-branch 커밋 SHA를 받습니다
- 해당 SHA 경로는 validation-only이며 실제 publish로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 검사용으로만 `v<package.json version>`을 합성합니다. 실제 publish에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 publish 및 promotion 경로는 GitHub-hosted runner에 유지하고, 변경하지 않는 검증 경로는 더 큰 Blacksmith Linux runner를 사용할 수 있습니다
- 해당 워크플로는 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` 워크플로 비밀 둘 다를 사용해 실행합니다
- npm release preflight는 더 이상 별도의 release checks 레인을 기다리지 않습니다
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`를 실행합니다
  (또는 일치하는 beta/correction 태그)
- npm publish 후에는 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`를 실행하여
  (또는 일치하는 beta/correction 버전) fresh temp prefix에서 게시된 registry install 경로를 검증합니다
- beta publish 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행하여 공유 leased Telegram credential pool을 사용해 게시된 npm 패키지에 대한 installed-package onboarding, Telegram setup, 실제 Telegram E2E를 검증합니다. 로컬 maintainer 일회성 실행은 Convex vars를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env credentials를 직접 전달할 수 있습니다.
- Maintainer는 수동 `NPM Telegram Beta E2E` 워크플로를 통해 GitHub Actions에서 동일한 post-publish check를 실행할 수 있습니다. 이는 의도적으로 manual-only이며 모든 merge마다 실행되지 않습니다.
- Maintainer release automation은 이제 preflight-then-promote를 사용합니다:
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm publish는 성공한 preflight run과 같은 `main` 또는 `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - stable npm release는 기본적으로 `beta`를 사용합니다
  - stable npm publish는 workflow input을 통해 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - token 기반 npm dist-tag mutation은 보안을 위해 이제 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. public repo는 OIDC-only publish를 유지하는 반면 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다
  - public `macOS Release`는 validation-only입니다. 태그가 release branch에만 있고 워크플로가 `main`에서 디스패치될 때는 `public_release_branch=release/YYYY.M.D`를 설정합니다
  - 실제 private mac publish는 성공한 private mac `preflight_run_id` 및 `validate_run_id`를 통과해야 합니다
  - 실제 publish 경로는 아티팩트를 다시 빌드하는 대신 준비된 아티팩트를 promote합니다
- `YYYY.M.D-N` 같은 stable correction release의 경우, post-publish verifier는 `YYYY.M.D`에서 `YYYY.M.D-N`으로의 동일한 temp-prefix upgrade 경로도 검사하여 릴리스 correction이 이전 global install을 base stable payload에 조용히 남겨두지 못하도록 합니다
- npm release preflight는 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 실패하도록 닫혀 있으므로 빈 browser dashboard를 다시 배포하지 않습니다
- Post-publish verification은 게시된 registry install에 root `dist/*` layout 아래 비어 있지 않은 bundled Plugin runtime deps가 포함되어 있는지도 확인합니다. bundled Plugin dependency payload가 누락되었거나 비어 있는 릴리스는 postpublish verifier에 실패하며 `latest`로 승격할 수 없습니다.
- `pnpm test:install:smoke`는 candidate update tarball에 npm pack `unpackedSize` budget도 적용하므로 installer e2e가 release publish path 전에 우발적인 pack bloat를 포착합니다
- 릴리스 작업이 CI planning, extension timing manifests 또는 extension test matrices를 건드렸다면, 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner-owned `plugin-prerelease-extension-shard` matrix outputs를 다시 생성하고 검토하여 릴리스 노트가 오래된 CI layout을 설명하지 않도록 합니다
- Stable macOS release readiness에는 updater surfaces도 포함됩니다:
  - GitHub release에는 packaged `.zip`, `.dmg`, `.dSYM.zip`이 포함되어야 합니다
  - publish 후 `main`의 `appcast.xml`은 새로운 stable zip을 가리켜야 합니다
  - packaged app은 non-debug bundle id, 비어 있지 않은 Sparkle feed URL, 해당 릴리스 버전의 canonical Sparkle build floor 이상인 `CFBundleVersion`을 유지해야 합니다

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 신뢰할 수 있는 `main` workflow ref에서 실행하고 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 `ref`로 전달합니다:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

이 워크플로는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치하며, `OpenClaw Release Checks`를 디스패치하고, `npm_telegram_package_spec`이 설정된 경우 선택적으로 standalone post-publish Telegram E2E를 디스패치합니다. 그런 다음 `OpenClaw Release Checks`는 install smoke, cross-OS release checks, live/E2E Docker release-path coverage, Telegram package QA가 포함된 Package Acceptance, QA Lab parity, live Matrix, live Telegram으로 fan out합니다. 전체 실행은 `Full Release Validation` summary에서 `normal_ci` 및 `release_checks`가 성공으로 표시되고, 선택적 `npm_telegram` child가 성공했거나 의도적으로 건너뛰어진 경우에만 허용됩니다. 최종 verifier summary에는 각 child run의 slowest-job tables가 포함되어 있어 release manager가 로그를 다운로드하지 않고도 현재 critical path를 볼 수 있습니다.
전체 stage matrix, 정확한 workflow job names, stable versus full profile 차이, artifacts, focused rerun handles는 [Full release validation](/ko/reference/full-release-validation)을 참조하세요.
Child workflows는 대상 `ref`가 오래된 릴리스 브랜치나 태그를 가리키더라도 `Full Release Validation`을 실행하는 신뢰할 수 있는 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref input은 없습니다. workflow run ref를 선택하여 신뢰할 수 있는 하네스를 선택합니다.

live/provider 범위를 선택하려면 `release_profile`을 사용합니다:

- `minimum`: 가장 빠른 release-critical OpenAI/core live 및 Docker path
- `stable`: 릴리스 승인을 위한 minimum에 stable provider/backend coverage 추가
- `full`: stable에 광범위한 advisory provider/media coverage 추가

`OpenClaw Release Checks`는 신뢰된 워크플로 ref를 사용해 대상
ref를 `release-package-under-test`로 한 번 해석하고, 해당 아티팩트를
release-path Docker 검사와 Package Acceptance 양쪽에서 재사용합니다. 이렇게 하면
모든 패키지 대상 박스가 같은 바이트를 사용하며 반복적인 패키지 빌드를 피할 수 있습니다.
cross-OS OpenAI 설치 스모크는 repo/org 변수가 설정되어 있으면
`OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4-mini`를 사용합니다. 이 레인은
가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작, 라이브 에이전트 한 턴을
검증하기 때문입니다. 더 넓은 라이브 프로바이더
매트릭스가 모델별 커버리지를 위한 위치로 남아 있습니다.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

집중 수정 후 첫 재실행으로 전체 엄브렐라를 사용하지 마세요. 한 박스가
실패하면 다음 증명에는 실패한 자식 워크플로, 작업, Docker 레인, 패키지 프로필, 모델
프로바이더 또는 QA 레인을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나
이전의 전체 박스 증거를 오래된 것으로 만들었을 때만 전체 엄브렐라를 다시 실행하세요.
엄브렐라의 최종 검증기는 기록된 자식 워크플로 실행
ID를 다시 검사하므로, 자식 워크플로가 성공적으로 재실행된 뒤에는 실패한
`Verify full validation` 상위 작업만 재실행하세요.

제한된 복구에는 엄브렐라에 `rerun_group`을 전달하세요. `all`은 실제
릴리스 후보 실행이고, `ci`는 일반 CI 자식만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 자식만 실행하고, `release-checks`는 모든 릴리스
박스를 실행합니다. 더 좁은 릴리스 그룹은 독립 실행형 패키지 Telegram 레인이 제공될 때
`install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다.

### Vitest

Vitest 박스는 수동 `CI` 자식 워크플로입니다. 수동 CI는 의도적으로
변경 범위 지정을 우회하고 릴리스 후보에 대해 일반 테스트 그래프를 강제합니다:
Linux Node 샤드, 번들 Plugin 샤드, 채널 계약, Node 22
호환성, `check`, `check-additional`, 빌드 스모크, 문서 검사, Python
Skills, Windows, macOS, Android, Control UI i18n.

"소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답할 때 이 박스를 사용하세요.
이는 release-path 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여 주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 녹색인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패했거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 Docker, QA Lab, 라이브, cross-OS 또는 패키지 박스는 필요 없고
결정적인 일반 CI만 필요할 때만 수동 CI를 직접 실행하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통해
`OpenClaw Release Checks` 안에 있으며, 릴리스 모드
`install-smoke` 워크플로도 포함합니다. 이는 소스 수준 테스트만이 아니라 패키징된
Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용, QR,
  루트/Gateway, 설치 프로그램/Bun 스모크 작업이 별도 install-smoke
  샤드로 실행됨
- 저장소 E2E 레인
- release-path Docker 청크: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b`, 및
  `bundled-channels-contracts`
- 요청 시 `plugins-runtime-services` 청크 안의 OpenWebUI 커버리지
- 하나의 큰 번들 채널 작업 대신 channel-smoke, update-target,
  setup/runtime 계약 청크로 분할된 번들 채널 의존성 레인
- `bundled-plugin-install-uninstall-0`부터
  `bundled-plugin-install-uninstall-23`까지의 분할 번들 Plugin 설치/제거 레인
- 릴리스 검사가 라이브 스위트를 포함할 때 라이브/E2E 프로바이더 스위트와 Docker 라이브 모델 커버리지

재실행 전에 Docker 아티팩트를 사용하세요. release-path 스케줄러는
레인 로그, `summary.json`, `failures.json`,
단계 타이밍, 스케줄러 계획 JSON, 재실행 명령을 포함한
`.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는
모든 릴리스 청크를 재실행하는 대신 재사용 가능한 라이브/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`를 사용하세요.
생성된 재실행 명령에는 사용 가능한 경우 이전
`package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로,
실패한 레인이 같은 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 에이전트형
동작 및 채널 수준 릴리스 게이트이며, Vitest와 Docker
패키지 메커니즘과는 별개입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- 에이전트형 패리티 팩을 사용해 OpenAI 후보 레인을 Opus 4.6
  기준선과 비교하는 모의 패리티 게이트
- `qa-live-shared` 환경을 사용하는 빠른 라이브 Matrix QA 프로필
- Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA 레인
- 릴리스 텔레메트리에 명시적인 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`

"릴리스가 QA 시나리오와 라이브 채널 흐름에서 올바르게 동작하는가?"에 답할 때 이 박스를 사용하세요.
릴리스를 승인할 때 패리티, Matrix, Telegram
레인의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 레인이 아니라
수동 샤딩 QA-Lab 실행으로 계속 사용할 수 있습니다.

### 패키지

Package 박스는 설치 가능한 제품 게이트입니다. 이는
`Package Acceptance`와 해석기
`scripts/resolve-openclaw-package-candidate.mjs`에 의해 뒷받침됩니다. 해석기는
후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며,
패키지 버전과 SHA-256을 기록하고, 워크플로 하니스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스
  버전
- `source=ref`: 선택한 `workflow_ref` 하니스로 신뢰된 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹
- `source=url`: 필수 `package_sha256`이 있는 HTTPS `.tgz` 다운로드
- `source=artifact`: 다른 GitHub Actions 실행이 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline`, 및
`telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. release-path Docker 청크는
겹치는 설치, 업데이트, Plugin 업데이트 레인을 커버하며, Package Acceptance는
같은 해석된 tarball에 대해 아티팩트 네이티브 번들 채널 호환성, 오프라인 Plugin 픽스처, Telegram
패키지 QA를 유지합니다. 이는 이전에 Parallels가 필요했던 대부분의
패키지/업데이트 커버리지를 대체하는 GitHub 네이티브
대체 수단입니다. Cross-OS 릴리스 검사는 여전히 OS별 온보딩,
설치 프로그램 및 플랫폼 동작에 중요하지만, 패키지/업데이트 제품 검증은
Package Acceptance를 선호해야 합니다.

레거시 package-acceptance 완화는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의
패키지는 이미 npm에 게시된 메타데이터 누락에 대해 호환성 경로를 사용할 수 있습니다:
tarball에 없는 비공개 QA 인벤토리 항목, 누락된
`gateway install --wrapper`, tarball에서 파생된 git
픽스처의 누락된 패치 파일, 누락된 영속 `update.channel`, 레거시 Plugin 설치 기록
위치, 누락된 marketplace 설치 기록 영속성, `plugins update` 중 config 메타데이터
마이그레이션. 게시된 `2026.4.26` 패키지는
이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는
현대적인 패키지 계약을 충족해야 하며, 같은 누락은 릴리스
검증을 실패시킵니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때 더 넓은 Package Acceptance 프로필을 사용하세요.

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

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크 및 config
  재로드 레인
- `package`: 라이브 ClawHub 없는 설치/업데이트/Plugin 패키지 계약; 이것이 release-check
  기본값
- `product`: `package`에 MCP 채널, cron/subagent 정리, OpenAI 웹
  검색 및 OpenWebUI를 더함
- `full`: OpenWebUI가 있는 Docker release-path 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명에는 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는
해석된 `package-under-test` tarball을 Telegram 레인에 전달합니다. 독립 실행형
Telegram 워크플로는 게시 후 검사에 대해 여전히 게시된 npm spec을 허용합니다.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다.

- `tag`: 필수 릴리스 태그, 예: `v2026.4.2`, `v2026.4.2-1` 또는
  `v2026.4.2-beta.1`; `preflight_only=true`일 때는 검증 전용 preflight를 위한 현재
  전체 40자 워크플로 브랜치 커밋 SHA도 될 수 있음
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제
  게시 경로에는 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가
  성공한 preflight 실행의 준비된 tarball을 재사용하도록 함
- `npm_dist_tag`: 게시 경로의 npm 대상 태그; 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다.

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA. 시크릿을 사용하는 검사는
  해석된 커밋이 OpenClaw 브랜치 또는
  릴리스 태그에서 도달 가능해야 합니다.

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 하나로 게시할 수 있음
- 베타 프리릴리스 태그는 `beta`로만 게시할 수 있음
- `OpenClaw NPM Release`의 경우 전체 커밋 SHA 입력은
  `preflight_only=true`일 때만 허용됨
- `OpenClaw Release Checks`와 `Full Release Validation`은 항상
  검증 전용임
- 실제 게시 경로는 preflight 중 사용한 것과 같은 `npm_dist_tag`를 사용해야 하며,
  워크플로는 게시 전에 해당 메타데이터가 계속 일치하는지 검증함

## 안정 npm 릴리스 절차

안정 npm 릴리스를 자를 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 preflight 워크플로의 검증 전용 드라이런을 위해 현재 전체 workflow 브랜치 커밋
     SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 안정 버전을 게시하려는 경우에만
   `latest`를 선택합니다
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab,
   Matrix, Telegram 커버리지를 원할 때 릴리스 브랜치, 릴리스 태그 또는 전체
   커밋 SHA에서 `Full Release Validation`을 실행합니다
4. 의도적으로 결정론적인 일반 테스트 그래프만 필요한 경우, 대신 릴리스 ref에서
   수동 `CI` 워크플로를 실행합니다
5. 성공한 `preflight_run_id`를 저장합니다
6. 동일한 `tag`, 동일한 `npm_dist_tag`, 저장한 `preflight_run_id`를 사용하고
   `preflight_only=false`로 `OpenClaw NPM Release`를 다시 실행합니다
7. 릴리스가 `beta`에 반영된 경우, 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용하여 해당 안정 버전을 `beta`에서 `latest`로 승격합니다
8. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 안정 빌드를 따라야 하는 경우,
   동일한 비공개 워크플로를 사용하여 두 dist-tag가 안정 버전을 가리키게 하거나, 예약된
   자가 복구 동기화가 나중에 `beta`를 이동하도록 둡니다

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하므로 보안을 위해 비공개 저장소에 있으며,
공개 저장소는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두 문서화되고 운영자에게 보이게 됩니다.

관리자가 로컬 npm 인증으로 대체해야 하는 경우, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행합니다. 메인 에이전트 셸에서 `op`를
직접 호출하지 마세요. tmux 안에 두면 프롬프트,
알림, OTP 처리를 관찰할 수 있고 반복적인 호스트 알림을 방지할 수 있습니다.

## 공개 참조 자료

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

관리자는 실제 런북에 비공개 릴리스 문서인
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)를
사용합니다.

## 관련 항목

- [릴리스 채널](/ko/install/development-channels)
