---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있습니다.
    - 버전 명명과 배포 주기를 찾고 있습니다.
summary: 공개 릴리스 채널, 버전 명명, 및 배포 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-26T11:38:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다.

- stable: 기본적으로 npm `beta`에 게시되는 태그 릴리스이며, 명시적으로 요청한 경우 npm `latest`에 게시됩니다
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 최신 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일을 0으로 채우지 마세요
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시되며, 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나 나중에 검증된 beta 빌드를 승격할 수 있습니다
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다;
  beta 릴리스는 일반적으로 npm/package 경로를 먼저 검증하고 게시하며,
  mac 앱 빌드/서명/공증은 명시적으로 요청되지 않는 한 stable에 예약됩니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 이어집니다
- 유지 관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D`
  브랜치에서 릴리스를 생성하므로, 릴리스 검증과 수정이 `main`의 새
  개발을 막지 않습니다
- Beta 태그가 이미 푸시되었거나 게시된 상태에서 수정이 필요하면, 유지 관리자는
  이전 beta 태그를 삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 생성합니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는
  유지 관리자 전용입니다

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여, 더 빠른 로컬
  `pnpm check` 게이트 밖에서도 테스트 TypeScript가 계속 검증되도록 하세요
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여, 더 빠른 로컬 게이트
  밖에서도 더 넓은 import cycle 및 아키텍처 경계 검사가 녹색인지 확인하세요
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여, pack
  검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 하세요
- 릴리스 telemetry를 검증할 때는 `pnpm qa:otel:smoke`를 실행하세요. 이것은
  로컬 OTLP/HTTP 수신기를 통해 QA-lab을 실행하고 Opik, Langfuse 또는 다른
  외부 수집기 없이도 export된 trace span 이름, 제한된 속성, 콘텐츠/식별자
  redaction을 검증합니다.
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행하세요
- 릴리스 검사는 이제 별도의 수동 workflow에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity gate와
  live Matrix 및 Telegram QA 레인도 실행합니다. live 레인은
  `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 lease도 사용합니다.
- 교차 OS 설치 및 업그레이드 런타임 검증은
  비공개 호출자 workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서
  디스패치되며, 재사용 가능한 공개 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`를 호출합니다
- 이 분리는 의도적입니다. 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 더 느린 live 검사는 자체 레인에 두어
  게시를 지연시키거나 막지 않도록 합니다
- 릴리스 검사는 `main` workflow ref 또는
  `release/YYYY.M.D` workflow ref에서 디스패치되어야 workflow 로직과 secret이
  통제된 상태로 유지됩니다
- 해당 workflow는 기존 릴리스 태그 또는 현재 전체 40자 workflow-branch
  커밋 SHA 중 하나를 받습니다
- 커밋 SHA 모드에서는 현재 workflow-branch HEAD만 허용됩니다;
  이전 릴리스 커밋에는 릴리스 태그를 사용하세요
- `OpenClaw NPM Release`의 validation-only 사전 점검도 푸시된 태그 없이
  현재 전체 40자 workflow-branch 커밋 SHA를 받을 수 있습니다
- 이 SHA 경로는 validation-only이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 workflow는 패키지 메타데이터 검사에만
  `v<package.json version>`을 합성합니다; 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 workflow 모두 실제 게시 및 승격 경로는 GitHub-hosted
  runner에서 유지하고, 변경하지 않는 검증 경로만 더 큰
  Blacksmith Linux runner를 사용할 수 있습니다
- 해당 workflow는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` workflow secret 둘 다를 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 해당 beta/수정 태그)를 실행하세요
- npm 게시 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 해당 beta/수정 버전)를 실행하여 새로운 temp prefix에서 게시된 레지스트리
  설치 경로를 검증하세요
- Beta 게시 후에는
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  를 실행하여, 공유 lease Telegram 자격 증명 풀을 사용해 게시된 npm 패키지에 대해
  설치된 패키지 온보딩, Telegram 설정, 실제 Telegram E2E를 검증하세요.
  로컬 유지 관리자 단독 실행에서는 Convex 변수를 생략하고 세 개의
  `OPENCLAW_QA_TELEGRAM_*` env 자격 증명을 직접 전달할 수 있습니다.
- 유지 관리자는 GitHub Actions의 수동 `NPM Telegram Beta E2E` workflow를 통해
  같은 게시 후 검사를 실행할 수 있습니다. 이것은 의도적으로 수동 전용이며
  모든 merge마다 실행되지 않습니다.
- 유지 관리자 릴리스 자동화는 이제 preflight-then-promote를 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 필요합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 동일한 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - stable npm 릴리스의 기본 대상은 `beta`입니다
  - stable npm 게시는 workflow 입력으로 명시적으로 `latest`를 지정할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 위치합니다. `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하지만,
    공개 repo는 OIDC 전용 게시를 유지하기 때문입니다
  - 공개 `macOS Release`는 validation-only입니다
  - 실제 비공개 mac 게시는 성공한 비공개 mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하지 않고 준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우, 게시 후 검증기는
  `YYYY.M.D`에서 `YYYY.M.D-N`으로의 동일한 temp-prefix 업그레이드 경로도 검사하므로,
  릴리스 수정이 이전 글로벌 설치를 기본 stable payload에 조용히 남겨두지 못합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과
  비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되지 않으면
  실패 종료되므로, 빈 브라우저 대시보드를 다시 배포하지 않게 됩니다
- 게시 후 검증은 게시된 레지스트리 설치가 루트 `dist/*`
  레이아웃 아래에 비어 있지 않은 번들 Plugin 런타임 의존성을 포함하는지도 검사합니다.
  누락되었거나 비어 있는 번들 Plugin 의존성 payload가 포함된 릴리스는 게시 후
  검증에 실패하며 `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball의 npm pack `unpackedSize`
  예산도 강제하므로, 설치 프로그램 e2e가 릴리스 게시 경로 전에 실수로 커진 pack 크기를 잡아냅니다
- 릴리스 작업이 CI 계획, extension 타이밍 manifest, 또는 extension 테스트 matrix를
  건드렸다면, 승인 전에 `.github/workflows/ci.yml`의 planner 소유
  `checks-node-extensions` workflow matrix 출력을 다시 생성하고 검토하세요.
  그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않게 됩니다
- Stable macOS 릴리스 준비 상태에는 updater 표면도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - 게시 후 `main`의 `appcast.xml`은 새 stable zip을 가리켜야 합니다
  - 패키징된 앱은 non-debug bundle id, 비어 있지 않은 Sparkle feed
    URL, 그리고 해당 릴리스 버전의 표준 Sparkle 빌드 하한 이상인
    `CFBundleVersion`을 유지해야 합니다

## NPM workflow 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` 같은 필수 릴리스 태그;
  `preflight_only=true`일 때는 validation-only 사전 점검을 위해 현재 전체
  40자 workflow-branch 커밋 SHA도 사용할 수 있습니다
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 게시 경로면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, workflow가 성공한 사전 점검 실행의
  준비된 tarball을 재사용할 수 있게 합니다
- `npm_dist_tag`: 게시 경로용 npm 대상 태그; 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다.

- `ref`: `main`에서 디스패치할 때 검증할 기존 릴리스 태그 또는 현재 전체
  40자 `main` 커밋 SHA; 릴리스 브랜치에서는 기존 릴리스 태그 또는 현재 전체
  40자 릴리스 브랜치 커밋 SHA를 사용합니다

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 중 어느 곳으로든 게시할 수 있습니다
- Beta 프리릴리스 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`에서는 `preflight_only=true`일 때만
  전체 커밋 SHA 입력이 허용됩니다
- `OpenClaw Release Checks`는 항상 validation-only이며 현재
  workflow-branch 커밋 SHA도 받을 수 있습니다
- 릴리스 검사 커밋 SHA 모드도 현재 workflow-branch HEAD를 요구합니다
- 실제 게시 경로는 사전 점검에 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며,
  workflow는 게시를 계속하기 전에 해당 메타데이터를 검증합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 생성할 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 아직 없으면, 사전 점검 workflow의 validation-only dry run을 위해
     현재 전체 workflow-branch 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고,
   의도적으로 직접 stable 게시를 원할 때만 `latest`를 선택합니다
3. live 프롬프트 캐시,
   QA Lab parity, Matrix, Telegram 커버리지가 필요하면 같은 태그 또는 현재 전체
   workflow-branch 커밋 SHA로 `OpenClaw Release Checks`를 별도로 실행합니다
   - live 커버리지를 계속 사용할 수 있도록 하면서, 오래 걸리거나 불안정한 검사를
     게시 workflow에 다시 결합하지 않기 위해 의도적으로 분리되어 있습니다
4. 성공한 `preflight_run_id`를 저장합니다
5. `preflight_only=false`, 동일한 `tag`, 동일한 `npm_dist_tag`,
   저장한 `preflight_run_id`로 `OpenClaw NPM Release`를 다시 실행합니다
6. 릴리스가 `beta`에 도달했다면, 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow를 사용하여 해당 stable 버전을 `beta`에서 `latest`로 승격합니다
7. 릴리스가 의도적으로 직접 `latest`에 게시되었고 `beta`도 즉시 같은 stable 빌드를
   따라가야 한다면, 같은 비공개 workflow를 사용해 두 dist-tag가 모두 stable 버전을
   가리키게 하거나, 예약된 self-healing 동기화가 나중에 `beta`를 이동하게 두세요

dist-tag 변경은 보안상 비공개 repo에 있습니다. 공개 repo는 OIDC 전용 게시를 유지하는 반면,
여기에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두 문서화되고 운영자에게
명확하게 보이게 됩니다.

유지 관리자가 로컬 npm 인증으로 되돌아가야 한다면, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행하세요. 기본 에이전트 셸에서 `op`를
직접 호출하지 마세요. tmux 안에 두면 프롬프트, 경고, OTP 처리를 관찰할 수 있고,
반복적인 호스트 경고를 방지할 수 있습니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지 관리자는 실제 실행 절차를 위해
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)에 있는
비공개 릴리스 문서를 사용합니다.

## 관련 문서

- [릴리스 채널](/ko/install/development-channels)
