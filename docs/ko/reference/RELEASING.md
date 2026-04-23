---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있습니다
    - 버전 명명과 주기를 찾고 있습니다
summary: 공개 릴리스 채널, 버전 명명, 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-23T14:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# 릴리스 정책

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다.

- stable: 기본적으로 npm `beta`에 게시되거나, 명시적으로 요청된 경우 npm `latest`에 게시되는 태그된 릴리스
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 최신 헤드

## 버전 명명

- 안정 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- 안정 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월 또는 일은 0으로 채우지 마세요
- `latest`는 현재 승격된 안정 npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- 안정 및 안정 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 이후 검증된 beta 빌드를 승격할 수 있습니다
- 모든 안정 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다.
  beta 릴리스는 일반적으로 먼저 npm/패키지 경로를 검증하고 게시하며,
  mac 앱 빌드/서명/notarize는 명시적으로 요청되지 않는 한 안정 릴리스에 예약됩니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- stable은 최신 beta가 검증된 이후에만 이어집니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.D`
  브랜치에서 릴리스를 컷하므로, 릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- beta 태그가 이미 푸시되었거나 게시된 뒤 수정이 필요하면, 유지관리자는
  이전 beta 태그를 삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 컷합니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는 유지관리자 전용입니다

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행해 테스트 TypeScript가
  더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 커버되도록 하세요
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행해 더 넓은 import
  cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 녹색인지 확인하세요
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행해 예상되는
  `dist/*` 릴리스 아티팩트와 pack
  검증 단계에 필요한 Control UI 번들이 존재하도록 하세요
- 태그된 모든 릴리스 전에 `pnpm release:check`를 실행하세요
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity gate와 live
  Matrix 및 Telegram QA 레인도 실행합니다. live 레인은
  `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 lease도 사용합니다.
- 교차 OS 설치 및 업그레이드 런타임 검증은
  비공개 호출자 워크플로
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`에서 디스패치되며,
  이는 재사용 가능한 공개 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`를 호출합니다
- 이 분리는 의도적입니다. 실제 npm 릴리스 경로는 짧고,
  결정적이며 아티팩트 중심으로 유지하고, 더 느린 live 검사는 자체
  레인에 두어 게시를 지연시키거나 막지 않도록 합니다
- 릴리스 검사는 `main` 워크플로 ref 또는
  `release/YYYY.M.D` 워크플로 ref에서 디스패치되어야 하며, 이렇게 해야 워크플로 로직과 시크릿이 통제된 상태를 유지합니다
- 해당 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 워크플로 브랜치 커밋 SHA를 받을 수 있습니다
- 커밋-SHA 모드에서는 현재 워크플로 브랜치 HEAD만 허용합니다.
  이전 릴리스 커밋에는 릴리스 태그를 사용하세요
- `OpenClaw NPM Release` 검증 전용 사전 점검도 푸시된 태그 없이
  현재 전체 40자 워크플로 브랜치 커밋 SHA를 허용합니다
- 해당 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 검사에만
  `v<package.json version>`을 합성합니다. 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 게시와 승격 경로는 GitHub 호스팅 러너에 두고,
  변경을 일으키지 않는 검증 경로만 더 큰
  Blacksmith Linux 러너를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 시크릿을 모두 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 해당 beta/수정 태그)를 실행하세요
- npm 게시 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 해당 beta/수정 버전)를 실행해 새 임시 prefix에서 게시된 레지스트리
  설치 경로를 검증하세요
- 유지관리자 릴리스 자동화는 이제 사전 점검 후 승격 방식을 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 필요합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 같은 `main` 또는
    `release/YYYY.M.D` 브랜치에서 디스패치되어야 합니다
  - 안정 npm 릴리스는 기본값이 `beta`입니다
  - 안정 npm 게시는 워크플로 입력을 통해 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    에 있습니다. 보안상 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하고,
    공개 저장소는 OIDC 전용 게시를 유지하기 때문입니다
  - 공개 `macOS Release`는 검증 전용입니다
  - 실제 비공개 mac 게시는 성공한 비공개 mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하는 대신 준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 안정 수정 릴리스의 경우, 게시 후 검증기는
  `YYYY.M.D`에서 `YYYY.M.D-N`으로의 동일한 temp-prefix 업그레이드 경로도 확인하므로
  릴리스 수정이 오래된 전역 설치를 기본 안정 payload에 조용히 남겨 두지 못하게 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과
  비어 있지 않은 `dist/control-ui/assets/` payload가 모두 포함되지 않으면 닫힌 상태로 실패하므로
  빈 브라우저 대시보드를 다시 배포하지 않게 합니다
- 게시 후 검증은 게시된 레지스트리 설치에 루트 `dist/*`
  레이아웃 아래 비어 있지 않은 번들 plugin 런타임 의존성이 포함되어 있는지도 확인합니다.
  누락되었거나 비어 있는 번들 plugin
  의존성 payload와 함께 게시된 릴리스는 postpublish 검증기에서 실패하며
  `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball의 npm pack `unpackedSize` 예산도 강제하므로,
  설치 프로그램 e2e가 릴리스 게시 경로 전에 우발적인 pack 비대를 포착합니다
- 릴리스 작업이 CI 계획, extension 타이밍 매니페스트, 또는
  extension 테스트 매트릭스를 건드렸다면, 승인 전에 `.github/workflows/ci.yml`의
  planner 소유 `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하세요.
  그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않게 됩니다
- 안정 macOS 릴리스 준비 상태에는 updater 표면도 포함됩니다:
  - GitHub 릴리스에 패키지된 `.zip`, `.dmg`, `.dSYM.zip`이 최종 포함되어야 합니다
  - `main`의 `appcast.xml`은 게시 후 새 안정 zip을 가리켜야 합니다
  - 패키지된 앱은 비디버그 번들 ID, 비어 있지 않은 Sparkle 피드
    URL, 그리고 해당 릴리스 버전의 정식 Sparkle 빌드 바닥값 이상인 `CFBundleVersion`을 유지해야 합니다

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 받습니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1`, 또는
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그. `preflight_only=true`일 때는
  검증 전용 사전 점검을 위해 현재 전체 40자 워크플로 브랜치 커밋 SHA도 사용할 수 있습니다
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 게시 경로면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수. 워크플로가
  성공한 사전 점검 실행의 준비된 tarball을 재사용하도록 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그. 기본값은 `beta`

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 받습니다.

- `ref`: `main`에서 디스패치할 때 검증할 기존 릴리스 태그 또는 현재 전체 40자 `main` 커밋
  SHA. 릴리스 브랜치에서는 기존 릴리스 태그 또는 현재 전체 40자 릴리스 브랜치 커밋
  SHA를 사용하세요

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 어느 쪽에도 게시할 수 있습니다
- beta 프리릴리스 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`의 경우 전체 커밋 SHA 입력은
  `preflight_only=true`일 때만 허용됩니다
- `OpenClaw Release Checks`는 항상 검증 전용이며 현재 워크플로 브랜치 커밋 SHA도 받습니다
- 릴리스 검사 커밋-SHA 모드도 현재 워크플로 브랜치 HEAD를 요구합니다
- 실제 게시 경로는 사전 점검 때 사용한 것과 같은 `npm_dist_tag`를 사용해야 하며,
  워크플로는 게시 전에 해당 메타데이터가 계속 일치하는지 확인합니다

## 안정 npm 릴리스 순서

안정 npm 릴리스를 컷할 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 아직 없다면, 사전 점검 워크플로의 검증 전용 dry run을 위해 현재 전체 워크플로 브랜치 커밋
     SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 직접 안정 게시를 의도할 때만 `latest`를 선택합니다
3. live 프롬프트 캐시,
   QA Lab parity, Matrix, Telegram 커버리지가 필요하면 동일한 태그 또는 현재 전체 워크플로 브랜치 커밋 SHA로
   `OpenClaw Release Checks`를 별도로 실행합니다
   - 이 분리는 의도적입니다. live 커버리지를 계속 사용할 수 있게 하면서도,
     오래 걸리거나 불안정한 검사를 게시 워크플로에 다시 결합하지 않기 위함입니다
4. 성공한 `preflight_run_id`를 저장합니다
5. 다시 `OpenClaw NPM Release`를 실행하되, `preflight_only=false`, 같은
   `tag`, 같은 `npm_dist_tag`, 저장한 `preflight_run_id`를 사용합니다
6. 릴리스가 `beta`에 게시되었다면 비공개
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 안정 버전을 `beta`에서 `latest`로 승격합니다
7. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도
   즉시 같은 안정 빌드를 따라야 한다면, 같은 비공개 워크플로를 사용해
   두 dist-tag를 모두 안정 버전으로 가리키게 하거나, 스케줄된
   self-healing sync가 나중에 `beta`를 옮기게 둘 수 있습니다

dist-tag 변경은 보안상 비공개 저장소에 있습니다.
여전히 `NPM_TOKEN`이 필요하지만, 공개 저장소는 OIDC 전용 게시를 유지하기 때문입니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두
문서화되고 운영자에게 가시적으로 유지됩니다.

## 공개 참고 자료

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

유지관리자는 실제 런북에 대해
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의
비공개 릴리스 문서를 사용합니다.
