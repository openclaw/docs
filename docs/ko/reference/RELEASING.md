---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있습니다
    - 버전 명명과 출시 주기를 찾고 있습니다
summary: 공개 릴리스 채널, 버전 명명, 그리고 출시 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-12T23:33:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# 릴리스 정책

OpenClaw에는 3개의 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시되는 태그 릴리스이며, 명시적으로 요청된 경우 npm `latest`에 게시
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 헤드

## 버전 명명

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월 또는 일은 0으로 채우지 마세요
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나, 검증된 beta 빌드를 나중에 승격할 수 있습니다
- 모든 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 배포합니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 이어집니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고사항은
  maintainer 전용입니다

## 릴리스 사전 점검

- 패키지 검증 단계에 필요한
  `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하세요
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행하세요
- 이제 릴리스 점검은 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고,
  결정적이며, 아티팩트 중심으로 유지하고, 더 느린 라이브 점검은 자체 레인에 두어 게시를 지연시키거나 막지 않게 합니다
- 릴리스 점검은 워크플로 로직과 비밀값이 정식 상태로 유지되도록
  `main` 워크플로 ref에서 디스패치해야 합니다
- 이 워크플로는 기존 릴리스 태그 또는 현재 전체
  40자 `main` 커밋 SHA 중 하나를 받습니다
- 커밋 SHA 모드에서는 현재 `origin/main` HEAD만 허용합니다. 이전 릴리스 커밋에는
  릴리스 태그를 사용하세요
- `OpenClaw NPM Release` 검증 전용 사전 점검도
  푸시된 태그 없이 현재 전체 40자 `main` 커밋 SHA를 허용합니다
- 해당 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다
- SHA 모드에서 워크플로는 패키지 메타데이터 점검에만 `v<package.json version>`을 합성합니다. 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 게시 및 승격 경로는 GitHub 호스팅 러너에서 유지하면서,
  변경을 수반하지 않는 검증 경로는 더 큰
  Blacksmith Linux 러너를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 비밀값을 모두 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도의 릴리스 점검 레인을 기다리지 않습니다
- 승인 전에
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 일치하는 beta/수정 태그)를 실행하세요
- npm 게시 후에는
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (또는 일치하는 beta/수정 버전)를 실행해 새 임시 prefix에서 게시된 레지스트리
  설치 경로를 검증하세요
- 이제 maintainer 릴리스 자동화는 preflight-then-promote를 사용합니다:
  - 실제 npm 게시는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - stable npm 릴리스는 기본적으로 `beta`를 사용합니다
  - stable npm 게시는 워크플로 입력으로 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - stable npm을 `beta`에서 `latest`로 승격하는 기능은 신뢰된 `OpenClaw NPM Release` 워크플로에서 여전히 명시적 수동 모드로 제공됩니다
  - 해당 승격 모드에도 npm `dist-tag` 관리가 신뢰 게시와 별개이므로 `npm-release` 환경에 유효한 `NPM_TOKEN`이 여전히 필요합니다
  - 공개 `macOS Release`는 검증 전용입니다
  - 실제 비공개 mac 게시는 성공한 비공개 mac
    `preflight_run_id`와 `validate_run_id`를 통과해야 합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하는 대신
    준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우 사후 게시 검증기는
  동일한 임시 prefix 업그레이드 경로를 `YYYY.M.D`에서 `YYYY.M.D-N`까지도 점검하므로
  릴리스 수정으로 인해 이전 글로벌 설치가
  기본 stable 페이로드에 조용히 남는 일이 없도록 합니다
- npm 릴리스 사전 점검은 tarball에
  `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` 페이로드가 모두 포함되지 않으면 실패 시 닫힌 방식으로 처리되므로,
  빈 브라우저 대시보드를 다시 배포하지 않게 합니다
- 릴리스 작업이 CI 계획, 확장 타이밍 매니페스트, 또는
  확장 테스트 매트릭스에 영향을 주었다면 승인 전에 `.github/workflows/ci.yml`의 플래너 소유
  `checks-node-extensions` 워크플로 매트릭스 출력을 재생성하고 검토하세요.
  그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않습니다
- Stable macOS 릴리스 준비 상태에는 업데이터 인터페이스도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 포함되어야 합니다
  - `main`의 `appcast.xml`은 게시 후 새 stable zip을 가리켜야 합니다
  - 패키징된 앱은 비디버그 번들 id, 비어 있지 않은 Sparkle 피드
    URL, 그리고 해당 릴리스 버전에 대한 정식 Sparkle 빌드 하한 이상인 `CFBundleVersion`을 유지해야 합니다

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음과 같은 운영자 제어 입력을 받습니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, 또는
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그. `preflight_only=true`일 때는
  검증 전용 사전 점검을 위해 현재 전체 40자 `main` 커밋 SHA도 사용할 수 있습니다
- `preflight_only`: 검증/빌드/패키지 전용이면 `true`, 실제 게시 경로면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 사전 점검 실행에서 준비된 tarball을 재사용하도록 합니다
- `npm_dist_tag`: 게시 경로용 npm 대상 태그이며 기본값은 `beta`
- `promote_beta_to_latest`: 게시를 건너뛰고 이미 게시된
  stable `beta` 빌드를 `latest`로 이동하려면 `true`

`OpenClaw Release Checks`는 다음과 같은 운영자 제어 입력을 받습니다:

- `ref`: 검증할 기존 릴리스 태그 또는 현재 전체 40자 `main` 커밋
  SHA

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 중 어느 쪽으로도 게시할 수 있습니다
- Beta 프리릴리스 태그는 `beta`에만 게시할 수 있습니다
- 전체 커밋 SHA 입력은 `preflight_only=true`일 때만 허용됩니다
- 릴리스 점검 커밋 SHA 모드도 현재 `origin/main` HEAD를 요구합니다
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  워크플로는 게시를 계속하기 전에 해당 메타데이터를 검증합니다
- 승격 모드는 stable 또는 수정 태그를 사용해야 하며, `preflight_only=false`,
  빈 `preflight_run_id`, `npm_dist_tag=beta`여야 합니다
- 승격 모드에도 `npm dist-tag add`에 여전히 일반 npm 인증이 필요하므로
  `npm-release` 환경에 유효한 `NPM_TOKEN`이 필요합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 아직 없을 때는
     사전 점검 워크플로의 검증 전용 드라이런을 위해 현재 전체 `main` 커밋 SHA를 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 직접 stable 게시를 의도한 경우에만 `latest`를 선택합니다
3. 라이브 프롬프트 캐시 커버리지가 필요하다면
   같은 태그 또는 현재 전체 `main` 커밋 SHA로 `OpenClaw Release Checks`를 별도로 실행합니다
   - 라이브 커버리지를 계속 사용할 수 있으면서도
     오래 걸리거나 불안정한 점검을 게시 워크플로에 다시 결합하지 않기 위해 의도적으로 분리되어 있습니다
4. 성공한 `preflight_run_id`를 저장합니다
5. `preflight_only=false`, 같은
   `tag`, 같은 `npm_dist_tag`, 저장한 `preflight_run_id`로 `OpenClaw NPM Release`를 다시 실행합니다
6. 릴리스가 `beta`에 게시되었다면 나중에
   같은 stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   빈 `preflight_run_id`, `npm_dist_tag=beta`로 `OpenClaw NPM Release`를 실행해
   해당 게시 빌드를 `latest`로 이동할 수 있습니다

승격 모드에도 여전히 `npm-release` 환경 승인과
해당 환경의 유효한 `NPM_TOKEN`이 필요합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두
문서화되고 운영자에게 명확하게 드러납니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

실제 실행 절차는 maintainer가
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의 비공개 릴리스 문서를 사용합니다.
