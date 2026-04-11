---
read_when:
    - 공개 릴리스 채널 정의를 찾고 있습니다
    - 버전 이름 지정과 출시 주기를 찾고 있습니다
summary: 공개 릴리스 채널, 버전 이름 지정 및 출시 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-04-11T02:47:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# 릴리스 정책

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다:

- stable: 기본적으로 npm `beta`에 게시되는 태그 릴리스이며, 명시적으로 요청된 경우 npm `latest`에 게시됩니다
- beta: npm `beta`에 게시되는 프리릴리스 태그
- dev: `main`의 이동하는 최신 헤드

## 버전 이름 지정

- Stable 릴리스 버전: `YYYY.M.D`
  - Git 태그: `vYYYY.M.D`
- Stable 수정 릴리스 버전: `YYYY.M.D-N`
  - Git 태그: `vYYYY.M.D-N`
- Beta 프리릴리스 버전: `YYYY.M.D-beta.N`
  - Git 태그: `vYYYY.M.D-beta.N`
- 월이나 일은 0으로 채우지 마세요
- `latest`는 현재 승격된 stable npm 릴리스를 의미합니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- Stable 및 stable 수정 릴리스는 기본적으로 npm `beta`에 게시되며, 릴리스 운영자는 명시적으로 `latest`를 대상으로 지정하거나 나중에 검증된 beta 빌드를 승격할 수 있습니다
- 모든 OpenClaw 릴리스는 npm 패키지와 macOS 앱을 함께 제공합니다

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 이어집니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은 관리자 전용입니다

## 릴리스 사전 점검

- 패키지 검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하세요
- 모든 태그 릴리스 전에 `pnpm release:check`를 실행하세요
- 메인 브랜치 npm 사전 점검도 tarball 패키징 전에 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 실행하며, `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` 워크플로 시크릿을 모두 사용합니다
- 승인 전에 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`를 실행하세요(또는 일치하는 beta/수정 태그 사용)
- npm 게시 후에는 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`를 실행하세요(또는 일치하는 beta/수정 버전 사용). 새 임시 prefix에서 게시된 레지스트리 설치 경로를 검증합니다
- 관리자 릴리스 자동화는 이제 사전 점검 후 승격 방식을 사용합니다:
  - 실제 npm 게시에는 성공한 npm `preflight_run_id`가 필요합니다
  - stable npm 릴리스는 기본적으로 `beta`를 대상으로 합니다
  - stable npm 게시 시 워크플로 입력으로 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - stable npm을 `beta`에서 `latest`로 승격하는 기능은 신뢰된 `OpenClaw NPM Release` 워크플로에서 여전히 명시적 수동 모드로 제공됩니다
  - 해당 승격 모드는 npm `dist-tag` 관리가 신뢰 게시와 별개이므로 `npm-release` 환경에 유효한 `NPM_TOKEN`도 여전히 필요합니다
  - 공개 `macOS Release`는 검증 전용입니다
  - 실제 비공개 mac 게시에는 성공한 비공개 mac `preflight_run_id`와 `validate_run_id`가 필요합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하지 않고 준비된 아티팩트를 승격합니다
- `YYYY.M.D-N` 같은 stable 수정 릴리스의 경우, 게시 후 검증기는 `YYYY.M.D`에서 `YYYY.M.D-N`으로의 동일한 임시 prefix 업그레이드 경로도 확인하므로, 릴리스 수정이 기존 글로벌 설치를 기본 stable 페이로드에 조용히 남겨두지 못하게 합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` 페이로드가 모두 포함되지 않으면 실패로 닫히므로, 빈 브라우저 대시보드를 다시 배포하지 않게 합니다
- 릴리스 작업이 CI 계획, 확장 타이밍 매니페스트 또는 확장 테스트 매트릭스에 영향을 주었다면, 승인 전에 `.github/workflows/ci.yml`의 플래너 소유 `checks-node-extensions` 워크플로 매트릭스 출력을 다시 생성하고 검토하세요. 그래야 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않습니다
- Stable macOS 릴리스 준비 상태에는 업데이터 표면도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 포함되어야 합니다
  - `main`의 `appcast.xml`은 게시 후 새 stable zip을 가리켜야 합니다
  - 패키징된 앱은 디버그가 아닌 번들 ID, 비어 있지 않은 Sparkle 피드 URL, 해당 릴리스 버전에 대한 정식 Sparkle 빌드 하한 이상인 `CFBundleVersion`을 유지해야 합니다

## NPM 워크플로 입력

`OpenClaw NPM Release`는 운영자가 제어하는 다음 입력을 받습니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` 같은 필수 릴리스 태그
- `preflight_only`: 검증/빌드/패키징만 수행하려면 `true`, 실제 게시 경로를 사용하려면 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 사전 점검 실행에서 준비된 tarball을 재사용하게 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그이며 기본값은 `beta`
- `promote_beta_to_latest`: `true`이면 게시를 건너뛰고 이미 게시된 stable `beta` 빌드를 `latest`로 이동합니다

규칙:

- Stable 및 수정 태그는 `beta` 또는 `latest` 어느 쪽에도 게시할 수 있습니다
- Beta 프리릴리스 태그는 `beta`에만 게시할 수 있습니다
- 실제 게시 경로는 사전 점검 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 하며, 워크플로는 게시를 계속하기 전에 해당 메타데이터를 검증합니다
- 승격 모드는 stable 또는 수정 태그, `preflight_only=false`, 빈 `preflight_run_id`, `npm_dist_tag=beta`를 사용해야 합니다
- 승격 모드는 `npm dist-tag add`가 여전히 일반 npm 인증을 필요로 하므로 `npm-release` 환경의 유효한 `NPM_TOKEN`도 필요합니다

## Stable npm 릴리스 순서

Stable npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 직접 stable 게시를 원할 때만 `latest`를 선택합니다
3. 성공한 `preflight_run_id`를 저장합니다
4. `preflight_only=false`, 동일한 `tag`, 동일한 `npm_dist_tag`, 저장한 `preflight_run_id`로 `OpenClaw NPM Release`를 다시 실행합니다
5. 릴리스가 `beta`에 게시되었다면, 나중에 동일한 stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`, 빈 `preflight_run_id`, `npm_dist_tag=beta`로 `OpenClaw NPM Release`를 실행하여 해당 게시 빌드를 `latest`로 이동할 수 있습니다

승격 모드는 여전히 `npm-release` 환경 승인과 해당 환경의 유효한 `NPM_TOKEN`을 필요로 합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두 문서화되고 운영자에게 명확히 드러납니다.

## 공개 참조

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

관리자는 실제 실행 절차를 위해 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의 비공개 릴리스 문서를 사용합니다.
