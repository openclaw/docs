---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있는 경우
    - 버전 명명 및 주기를 찾고 있는 경우
summary: 공개 릴리스 채널, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-25T06:09:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 배포되는 태그 릴리스이며, 명시적으로 요청하면 npm `latest`에 배포됨
- beta: npm `beta`에 배포되는 prerelease 태그
- dev: `main`의 이동하는 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta prerelease 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월 또는 일은 0으로 패딩하지 않음
- `latest`는 현재 승격된 stable npm 릴리스를 의미
- `beta`는 현재 beta 설치 대상을 의미
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 배포되며, 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있음
- 모든 stable OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 배포함.
  beta 릴리스는 일반적으로 먼저 npm/package 경로를 검증하고 배포하며,
  mac 앱 빌드/서명/notarize는 명시적으로 요청되지 않는 한 stable에 예약됨

## 릴리스 주기

- 릴리스는 beta-first로 진행됨
- Stable은 최신 beta가 검증된 후에만 뒤따름
- 유지 관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D`
  브랜치에서 릴리스를 생성하므로, 릴리스 검증과 수정이 `main`의 새
  개발을 막지 않음
- beta 태그가 이미 푸시되었거나 배포된 후 수정이 필요하면, 유지 관리자는
  기존 beta 태그를 삭제하거나 재생성하는 대신 다음 `-beta.N` 태그를 생성함
- 자세한 릴리스 절차, 승인, credential, 복구 참고 사항은
  유지 관리자 전용임

## 릴리스 사전 점검

- 더 빠른 로컬 `pnpm check` 게이트 밖에서도 테스트 TypeScript가
  계속 커버되도록 하려면 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하세요
- 더 빠른 로컬 게이트 밖에서도 더 넓은 import
  cycle 및 아키텍처 경계 검사가 녹색인지 확인하려면 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하세요
- pack
  검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하세요
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행하세요
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity gate와 라이브
  Matrix 및 Telegram QA 레인도 실행합니다. 라이브 레인은
  `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI credential lease도 사용합니다.
- Cross-OS 설치 및 업그레이드 런타임 검증은
  private caller 워크플로
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서 디스패치되며, 이 워크플로는 재사용 가능한 공개 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  를 호출합니다
- 이 분리는 의도적인 것입니다: 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 느린 라이브 검사는 자체
  레인에 유지하여 배포를 지연시키거나 막지 않도록 합니다
- 릴리스 검사는 워크플로 로직과 비밀이
  제어되도록 `main` 워크플로 ref 또는
  `release/YYYY.M.D` 워크플로 ref에서 디스패치되어야 합니다
- 해당 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 커밋-SHA 모드에서는 현재 워크플로 브랜치 HEAD만 허용하며,
  더 오래된 릴리스 커밋에는 릴리스 태그를 사용해야 합니다
- `OpenClaw NPM Release` validation-only 사전 점검도
  푸시된 태그 없이 현재 전체 40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 해당 SHA 경로는 validation-only이며 실제 배포로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 검사에 대해서만
  `v<package.json version>`을 합성합니다. 실제 배포에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 배포 및 승격 경로는 GitHub-hosted
  runner에서 유지하고, 변경 없는 검증 경로는 더 큰
  Blacksmith Linux runner를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 비밀 모두를 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 해당 beta/수정 태그)를 실행하세요
- npm 배포 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 해당 beta/수정 버전)를 실행해 새 임시 prefix에서 배포된 레지스트리
  설치 경로를 검증하세요
- beta 배포 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  를 실행해 공유 lease형 Telegram credential
  풀을 사용하여 게시된 npm 패키지에 대한 설치 패키지 onboarding, Telegram 설정, 실제 Telegram E2E를 검증하세요. 로컬 유지 관리자 일회성 실행에서는 Convex 변수를 생략하고 세 개의
  `OPENCLAW_QA_TELEGRAM_*` env credential을 직접 전달할 수 있습니다.
- 유지 관리자는 동일한 배포 후 검사를 GitHub Actions의
  수동 `NPM Telegram Beta E2E` 워크플로에서도 실행할 수 있습니다. 이 워크플로는 의도적으로 수동 전용이며 모든 merge마다 실행되지는 않습니다.
- 유지 관리자 릴리스 자동화는 이제 preflight-then-promote를 사용합니다:
  - 실제 npm 배포는 성공한 npm `preflight_run_id`를 통과해야 함
  - 실제 npm 배포는 성공한 사전 점검 실행과 동일한 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 함
  - stable npm 릴리스는 기본적으로 `beta`
  - stable npm 배포는 워크플로 입력으로 `latest`를 명시적으로 대상으로 지정할 수 있음
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 위치함. 이는 `npm dist-tag add`가 여전히 `NPM_TOKEN`을 필요로 하기 때문이며,
    공개 repo는 OIDC 전용 배포를 유지합니다
  - 공개 `macOS Release`는 validation-only
  - 실제 private mac 배포는 성공한 private mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 함
  - 실제 배포 경로는 아티팩트를 다시 빌드하지 않고 준비된 아티팩트를 승격함
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우, 배포 후 검증기는
  동일한 임시 prefix 업그레이드 경로를 `YYYY.M.D`에서 `YYYY.M.D-N`까지도 확인하므로
  릴리스 수정이 이전 글로벌 설치를 기본 stable payload에
  조용히 남겨 두지 않도록 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과
  비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되지 않으면
  닫힌 상태로 실패합니다. 이렇게 해서 빈 브라우저 대시보드를 다시 배포하지 않도록 합니다
- 배포 후 검증도 게시된 레지스트리 설치에 루트 `dist/*`
  레이아웃 아래의 비어 있지 않은 번들 Plugin 런타임 의존성이 포함되어 있는지 확인합니다. 누락되었거나 비어 있는 번들 Plugin
  의존성 payload를 포함한 릴리스는 배포 후 검증기에 실패하며
  `latest`로 승격할 수 없습니다.
- `pnpm test:install:smoke`도 후보 업데이트 tarball의 npm pack `unpackedSize` 예산을 강제하므로,
  설치 프로그램 e2e가 릴리스 배포 경로 전에 우발적인 pack 팽창을 잡아낼 수 있습니다
- 릴리스 작업이 CI 계획, extension 타이밍 manifest 또는
  extension 테스트 매트릭스를 건드렸다면, 승인 전에
  `.github/workflows/ci.yml`의 planner 소유
  `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하여,
  릴리스 노트가 오래된 CI 레이아웃을 설명하지 않도록 하세요
- Stable macOS 릴리스 준비 상태에는 updater 인터페이스도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`
    이 포함되어야 함
  - `main`의 `appcast.xml`은 배포 후 새 stable zip을 가리켜야 함
  - 패키징된 앱은 non-debug bundle ID, 비어 있지 않은 Sparkle feed
    URL, 그리고 해당 릴리스 버전의 정식 Sparkle 빌드 하한 이상인
    `CFBundleVersion`을 유지해야 함

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, 또는
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그. `preflight_only=true`일 때는 validation-only 사전 점검을 위해 현재
  전체 40자 워크플로 브랜치 커밋 SHA도 사용할 수 있음
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 배포 경로면 `false`
- `preflight_run_id`: 실제 배포 경로에서 필수이며, 워크플로가 성공한 사전 점검 실행의 준비된 tarball을 재사용하도록 함
- `npm_dist_tag`: 배포 경로의 npm 대상 태그. 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다:

- `ref`: 기존 릴리스 태그 또는, `main`에서 디스패치할 때 검증할 현재 전체 40자 `main` 커밋
  SHA. 릴리스 브랜치에서는 기존 릴리스 태그 또는 현재 전체 40자 릴리스 브랜치 커밋
  SHA를 사용

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 중 어느 쪽으로도 배포할 수 있음
- Beta prerelease 태그는 `beta`에만 배포 가능
- `OpenClaw NPM Release`에서는 전체 커밋 SHA 입력이
  `preflight_only=true`일 때만 허용됨
- `OpenClaw Release Checks`는 항상 validation-only이며
  현재 워크플로 브랜치 커밋 SHA도 받습니다
- 릴리스 검사 커밋-SHA 모드도 현재 워크플로 브랜치 HEAD를 요구합니다
- 실제 배포 경로는 사전 점검 때 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며,
  워크플로가 배포 전 그 메타데이터를 계속 검증합니다

## Stable npm 릴리스 순서

stable npm 릴리스를 생성할 때:

1. `preflight_only=true`로 `OpenClaw NPM Release` 실행
   - 태그가 아직 없을 때는 사전 점검 워크플로의 validation-only dry run을 위해 현재 전체 워크플로 브랜치 커밋
     SHA를 사용할 수 있음
2. 일반적인 beta-first 흐름에는 `npm_dist_tag=beta`를 선택하고, 직접 stable 배포를 의도한 경우에만 `latest`를 선택
3. 라이브 prompt cache,
   QA Lab parity, Matrix, Telegram 커버리지가 필요하면 별도로 같은 태그 또는 전체 현재 워크플로 브랜치 커밋 SHA로 `OpenClaw Release Checks` 실행
   - 라이브 커버리지가 계속 가능하면서도
     오래 걸리거나 불안정한 검사가 배포 워크플로에 다시 결합되지 않도록 하기 위한 의도적인 분리입니다
4. 성공한 `preflight_run_id` 저장
5. `preflight_only=false`, 동일한
   `tag`, 동일한 `npm_dist_tag`, 저장한 `preflight_run_id`로 `OpenClaw NPM Release` 다시 실행
6. 릴리스가 `beta`에 배포되었다면 private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 stable 버전을 `beta`에서 `latest`로 승격
7. 릴리스가 의도적으로 `latest`에 직접 배포되었고 `beta`도
   즉시 같은 stable 빌드를 따라야 한다면, 같은 private
   워크플로를 사용해 두 dist-tag 모두를 stable 버전으로 가리키게 하거나,
   예약된 self-healing sync가 나중에 `beta`를 이동하게 둘 수 있음

dist-tag 변경은 여전히
`NPM_TOKEN`이 필요하므로 보안을 위해 private repo에 있으며, 공개 repo는 OIDC 전용 배포를 유지합니다.

이렇게 하면 직접 배포 경로와 beta-first 승격 경로가 모두
문서화되고 운영자에게 가시적으로 유지됩니다.

유지 관리자가 로컬 npm 인증으로 fallback해야 한다면, 모든 1Password
CLI(`op`) 명령은 전용 tmux 세션 내부에서만 실행하세요. 메인 에이전트 셸에서 `op`를 직접 호출하지 마세요. tmux 내부에 유지하면 프롬프트,
알림, OTP 처리가 관찰 가능해지고 반복적인 호스트 알림을 방지할 수 있습니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지 관리자는 실제 운영 가이드로
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의
private 릴리스 문서를 사용합니다.

## 관련 항목

- [릴리스 채널](/ko/install/development-channels)
