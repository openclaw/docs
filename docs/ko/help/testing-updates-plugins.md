---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 인수 또는 Plugin 설치 동작 변경
    - 릴리스 후보 준비 또는 승인하기
    - 패키지 업데이트, Plugin 의존성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw가 업데이트 경로, 패키지 마이그레이션, Plugin 설치/업데이트 동작을 검증하는 방법
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-05-02T20:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

이는 업데이트 및 Plugin 검증을 위한 전용 체크리스트입니다. 목표는
간단합니다. 설치 가능한 패키지가 실제 사용자 상태를 업데이트하고, `doctor`를 통해 오래된
레거시 상태를 복구하며, 지원되는 소스에서 Plugin을 계속 설치, 로드, 업데이트, 제거할 수
있음을 입증하는 것입니다.

더 넓은 테스트 실행기 맵은 [테스트](/ko/help/testing)를 참조하세요. 라이브 제공자
키와 네트워크를 사용하는 스위트는 [라이브 테스트](/ko/help/testing-live)를 참조하세요.

## 보호하는 항목

업데이트 및 Plugin 테스트는 다음 계약을 보호합니다.

- 패키지 tarball이 완전하고, 유효한 `dist/postinstall-inventory.json`을 가지며,
  압축 해제된 저장소 파일에 의존하지 않습니다.
- 사용자가 구성, 에이전트, 세션, 워크스페이스, Plugin 허용 목록, 채널 구성을
  잃지 않고 이전에 게시된 패키지에서 후보 패키지로 이동할 수 있습니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구 경로를
  소유합니다. 시작 과정에서 오래된 Plugin 상태를 위한 숨은 호환성 마이그레이션이
  늘어나서는 안 됩니다.
- Plugin 설치는 로컬 디렉터리, git 저장소, npm 패키지, ClawHub 레지스트리 경로에서
  작동합니다.
- Plugin npm 의존성은 관리되는 npm 루트에 설치되고, 신뢰 전에 스캔되며, 제거 시 npm을
  통해 제거되어 호이스팅된 의존성이 남지 않습니다.
- 변경 사항이 없을 때 Plugin 업데이트는 안정적입니다. 설치 기록, 해석된 소스,
  설치된 의존성 레이아웃, 활성화 상태가 그대로 유지됩니다.

## 개발 중 로컬 증명

좁은 범위에서 시작하세요.

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, 의존성 또는 패키지 인벤터리 변경의 경우, 편집한 경계를 다루는
집중 테스트도 실행하세요.

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

패키지 Docker 레인이 tarball을 사용하기 전에 패키지 아티팩트를 증명하세요.

```bash
pnpm release:check
```

`release:check`는 구성/문서/API 드리프트 검사를 실행하고, 패키지 dist
인벤터리를 작성하며, `npm pack --dry-run`을 실행하고, 금지된 패키징 파일을 거부하고,
tarball을 임시 prefix에 설치하며, postinstall을 실행하고, 번들 채널 엔트리포인트를
스모크 테스트합니다.

## Docker 레인

Docker 레인은 제품 수준의 증명입니다. Linux 컨테이너 내부에서 실제 패키지를 설치하거나
업데이트하고, CLI 명령, Gateway 시작, HTTP 프로브, RPC 상태, 파일시스템 상태를 통해
동작을 검증합니다.

반복 작업 중에는 집중 레인을 사용하세요.

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

중요한 레인:

- `test:docker:plugins`는 Plugin 설치 스모크, 로컬 폴더 설치,
  로컬 폴더 업데이트 건너뛰기 동작, 사전 설치된 의존성이 있는 로컬 폴더,
  `file:` 패키지 설치, CLI 실행을 포함한 git 설치, git 이동 ref 업데이트,
  호이스팅된 전이 의존성을 포함한 npm 레지스트리 설치, npm 업데이트 무작동,
  로컬 ClawHub fixture 설치 및 업데이트 무작동, 마켓플레이스 업데이트 동작,
  Claude 번들 활성화/검사를 검증합니다. ClawHub 블록을 밀폐/오프라인으로 유지하려면
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하세요.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이
  `openclaw plugins update` 중 재설치되거나 설치 메타데이터를 잃지 않는지 검증합니다.
- `test:docker:upgrade-survivor`는 더러운 이전 사용자 fixture 위에 후보 tarball을
  설치하고, 패키지 업데이트와 비대화형 doctor를 실행한 다음, local loopback Gateway를
  시작하고 상태 보존을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 게시된 기준 버전을 설치하고,
  내장된 `openclaw config set` 레시피를 통해 구성한 뒤, 후보 tarball로 업데이트하고,
  doctor를 실행하고, 레거시 정리를 확인하고, Gateway를 시작하며,
  `/healthz`, `/readyz`, RPC 상태를 프로브합니다.
- `test:docker:update-migration`은 정리 작업이 많은 게시 업데이트 레인입니다.
  구성된 Discord/Telegram 스타일 사용자 상태에서 시작하고, 구성된 Plugin 의존성이
  생성될 기회를 갖도록 기준 버전 doctor를 실행하며, 구성된 패키징 Plugin에 대한
  레거시 Plugin 의존성 잔해를 시드하고, 후보 tarball로 업데이트한 뒤, 업데이트 후
  doctor가 레거시 의존성 루트를 제거하도록 요구합니다.

유용한 게시 업그레이드 생존자 변형:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

사용 가능한 시나리오는 `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path`,
`versioned-runtime-deps`입니다. 집계 실행에서
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`는 구성된 Plugin 설치
마이그레이션을 포함해 보고된 이슈 형태의 모든 시나리오로 확장됩니다.

전체 업데이트 마이그레이션은 의도적으로 Full Release CI와 분리되어 있습니다. 릴리스
질문이 "2026.4.23 이후 게시된 모든 안정 릴리스가 이 후보로 업데이트되고 Plugin 의존성
잔해를 정리할 수 있는가?"일 때는 수동 `Update Migration` 워크플로를 사용하세요.

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance는 GitHub 네이티브 패키지 게이트입니다. 하나의 후보 패키지를
`package-under-test` tarball로 해석하고, 버전과 SHA-256을 기록한 다음, 해당 정확한
tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 워크플로 하네스 ref는
패키지 소스 ref와 분리되어 있으므로 현재 테스트 로직이 오래된 신뢰 릴리스를 검증할 수
있습니다.

후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 게시 버전을 검증합니다.
- `source=ref`: 선택한 현재 하네스로 신뢰할 수 있는 브랜치, 태그 또는 커밋을 패키징합니다.
- `source=url`: 필수 `package_sha256`이 있는 HTTPS tarball을 검증합니다.
- `source=artifact`: 다른 Actions 실행에서 업로드한 tarball을 재사용합니다.

Full Release Validation은 기본적으로 `source=artifact`를 사용하며, 해석된 릴리스 SHA에서
빌드됩니다. 게시 후 증명의 경우 `package_acceptance_package_spec=openclaw@YYYY.M.D`를
전달해 동일한 업그레이드 매트릭스가 배포된 npm 패키지를 대상으로 하게 하세요.

릴리스 검사는 패키지/업데이트/Plugin 세트로 Package Acceptance를 호출합니다.

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

또한 다음도 전달합니다.

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이렇게 하면 패키지 마이그레이션, 업데이트 채널 전환, 오래된 Plugin 의존성 정리,
오프라인 Plugin 커버리지, Plugin 업데이트 동작, Telegram 패키지 QA가 동일하게 해석된
아티팩트에서 유지됩니다.

`all-since-2026.4.23`은 Full Release CI 업그레이드 샘플입니다. `2026.4.23`부터
`latest`까지 npm에 게시된 모든 안정 릴리스입니다. 게시 업데이트 마이그레이션을
철저히 다루려면 Full Release CI 대신 별도의 Update Migration 워크플로에서
`all-since-2026.4.23`을 사용하세요. 레거시 이전 날짜 기준점도 함께 원하는 수동 확장
샘플링에는 `release-history`를 계속 사용할 수 있습니다.

릴리스 전 후보를 검증할 때는 패키지 프로필을 수동으로 실행하세요.

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

릴리스 질문에 MCP 채널, cron/하위 에이전트 정리, OpenAI 웹 검색 또는 OpenWebUI가
포함될 때는 `suite_profile=product`를 사용하세요. 전체 Docker 릴리스 경로 커버리지가
필요할 때만 `suite_profile=full`을 사용하세요.

## 릴리스 기본값

릴리스 후보의 기본 증명 스택은 다음과 같습니다.

1. 소스 수준 회귀를 위한 `pnpm check:changed`와 `pnpm test:changed`.
2. 패키지 아티팩트 무결성을 위한 `pnpm release:check`.
3. 설치/업데이트/Plugin 계약을 위한 Package Acceptance `package` 프로필 또는
   release-check 사용자 지정 패키지 레인.
4. OS별 설치 프로그램, 온보딩, 플랫폼 동작을 위한 Cross-OS 릴리스 검사.
5. 변경된 표면이 제공자 또는 호스팅 서비스 동작을 건드릴 때만 라이브 스위트.

메인테이너 머신에서는 명시적으로 로컬 증명을 수행하는 경우가 아니라면 넓은 게이트와
Docker/패키지 제품 증명을 Testbox에서 실행해야 합니다.

## 레거시 호환성

호환성 관용은 좁고 시간 제한이 있습니다.

- `2026.4.25-beta.*`를 포함한 `2026.4.25`까지의 패키지는 Package Acceptance에서
  이미 배포된 패키지 메타데이터 공백을 허용할 수 있습니다.
- 게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에 대해
  경고할 수 있습니다.
- 이후 패키지는 현대 계약을 충족해야 합니다. 동일한 공백은 경고나 건너뛰기 대신
  실패합니다.

이러한 오래된 형태에 대해 새 시작 마이그레이션을 추가하지 마세요. doctor 복구를
추가하거나 확장한 다음, `upgrade-survivor` 또는 `published-upgrade-survivor`로
증명하세요.

## 커버리지 추가

업데이트 또는 Plugin 동작을 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은 계층에
커버리지를 추가하세요.

- 순수 경로 또는 메타데이터 로직: 소스 옆 단위 테스트.
- 패키지 인벤터리 또는 패키징 파일 동작: `package-dist-inventory` 또는 tarball
  검사기 테스트.
- CLI 설치/업데이트 동작: Docker 레인 assertion 또는 fixture.
- 게시 릴리스 마이그레이션 동작: `published-upgrade-survivor` 시나리오.
- 레지스트리/패키지 소스 동작: `test:docker:plugins` fixture 또는 ClawHub
  fixture 서버.
- 의존성 레이아웃 또는 정리 동작: 런타임 실행과 파일시스템 경계를 모두 assert합니다.
  npm 의존성은 관리되는 npm 루트 아래에 호이스팅될 수 있으므로, 테스트는
  패키지 로컬 `node_modules` 트리를 가정하는 대신 루트가 스캔/정리됨을 증명해야 합니다.

새 Docker fixture는 기본적으로 밀폐 상태를 유지하세요. 테스트의 목적이 라이브 레지스트리
동작이 아니라면 로컬 fixture 레지스트리와 가짜 패키지를 사용하세요.

## 실패 분류

아티팩트 정체성부터 시작하세요.

- Package Acceptance `resolve_package` 요약: 소스, 버전, SHA-256, 아티팩트 이름.
- Docker 아티팩트: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, 레인 로그, 재실행 명령.
- 업그레이드 생존자 요약: `.artifacts/upgrade-survivor/summary.json`,
  기준 버전, 후보 버전, 시나리오, 단계별 타이밍, 레시피 단계를 포함합니다.

전체 릴리스 상위 작업을 다시 실행하기보다 동일한 패키지 아티팩트로 실패한 정확한 레인을
다시 실행하는 편을 선호하세요.
