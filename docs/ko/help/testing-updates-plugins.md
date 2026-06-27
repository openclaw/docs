---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 승인 또는 Plugin 설치 동작 변경
    - 릴리스 후보 준비 또는 승인
    - 패키지 업데이트, Plugin 의존성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw가 업데이트 경로, 패키지 마이그레이션 및 Plugin 설치/업데이트 동작을 검증하는 방법
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-06-27T17:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

이는 업데이트 및 Plugin 검증을 위한 전용 체크리스트입니다. 목표는
단순합니다. 설치 가능한 패키지가 실제 사용자 상태를 업데이트하고, `doctor`를 통해
오래된 레거시 상태를 복구하며, 지원되는 소스에서 Plugin을 계속 설치, 로드, 업데이트,
제거할 수 있음을 입증하는 것입니다.

더 넓은 테스트 러너 맵은 [테스트](/ko/help/testing)를 참고하세요. 라이브 제공자
키와 네트워크에 접촉하는 스위트는 [라이브 테스트](/ko/help/testing-live)를 참고하세요.

## 보호하는 것

업데이트 및 Plugin 테스트는 다음 계약을 보호합니다.

- 패키지 tarball이 완전하고, 유효한 `dist/postinstall-inventory.json`을 가지며,
  압축 해제된 저장소 파일에 의존하지 않습니다.
- 사용자가 설정, 에이전트, 세션, 작업 공간, Plugin 허용 목록 또는
  채널 설정을 잃지 않고 이전에 게시된 패키지에서 후보 패키지로 이동할 수 있습니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구
  경로를 소유합니다. 시작 시 오래된 Plugin 상태를 위한 숨겨진 호환성 마이그레이션이
  늘어나서는 안 됩니다.
- Plugin 설치가 로컬 디렉터리, git 저장소, npm 패키지 및
  ClawHub 레지스트리 경로에서 작동합니다.
- Plugin npm 의존성은 Plugin당 하나의 관리형 npm 프로젝트에 설치되고,
  신뢰 전에 스캔되며, 제거 중 npm을 통해 삭제되어 호이스팅된
  의존성이 남지 않습니다.
- 변경된 것이 없을 때 Plugin 업데이트가 안정적입니다. 설치 레코드, 해석된
  소스, 설치된 의존성 레이아웃 및 활성화 상태가 그대로 유지됩니다.

## 개발 중 로컬 입증

좁게 시작하세요.

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, 의존성 또는 패키지 인벤터리 변경의 경우, 편집된 경계를
다루는 집중 테스트도 실행하세요.

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

패키지 Docker 레인이 tarball을 소비하기 전에 패키지 아티팩트를 입증하세요.

```bash
pnpm release:check
```

`release:check`는 설정/docs/API 드리프트 검사를 실행하고, 패키지 dist
인벤터리를 작성하며, `npm pack --dry-run`을 실행하고, 금지된 패키지 포함 파일을
거부하며, tarball을 임시 prefix에 설치하고, postinstall을 실행하며, 번들 채널
엔트리포인트를 스모크합니다.

## Docker 레인

Docker 레인은 제품 수준의 입증입니다. Linux 컨테이너 안에서 실제
패키지를 설치하거나 업데이트하고 CLI 명령, Gateway 시작, HTTP 프로브, RPC 상태 및
파일 시스템 상태를 통해 동작을 검증합니다.

반복 작업 중에는 집중 레인을 사용하세요.

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

중요 레인:

- `test:docker:plugins`는 Plugin 설치 스모크, 로컬 폴더 설치,
  로컬 폴더 업데이트 건너뛰기 동작, 사전 설치된 의존성이 있는 로컬 폴더,
  `file:` 패키지 설치, CLI 실행을 포함한 git 설치, git 이동 참조 업데이트,
  호이스팅된 전이 의존성이 있는 npm 레지스트리 설치, npm 업데이트 무작동,
  잘못된 npm 패키지 메타데이터 거부, 로컬 ClawHub fixture 설치 및 업데이트 무작동,
  marketplace 업데이트 동작, Claude 번들 활성화/검사를 검증합니다. ClawHub 블록을
  hermetic/offline으로 유지하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하세요.
- `test:docker:plugin-lifecycle-matrix`는 기본 컨테이너에 후보 패키지를
  설치하고, npm Plugin을 설치, 검사, 비활성화, 활성화, 명시적 업그레이드,
  명시적 다운그레이드 및 Plugin 코드 삭제 후 제거까지 실행합니다. 각 단계의
  RSS 및 CPU 지표를 기록합니다.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이
  `openclaw plugins update` 중 재설치되거나 설치 메타데이터를 잃지 않음을
  검증합니다.
- `test:docker:upgrade-survivor`는 지저분한 이전 사용자 fixture 위에 후보
  tarball을 설치하고, 패키지 업데이트와 비대화형 doctor를 실행한 다음,
  loopback Gateway를 시작하고 상태 보존을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 게시된 기준선을 설치하고,
  구워진 `openclaw config set` 레시피를 통해 설정한 뒤, 후보 tarball로
  업데이트하고, doctor를 실행하고, 레거시 정리를 확인하고, Gateway를 시작하며,
  `/healthz`, `/readyz` 및 RPC 상태를 프로브합니다.
- `test:docker:update-restart-auth`는 후보 패키지를 설치하고, 관리형
  토큰 인증 Gateway를 시작하고, `openclaw update --yes --json`에 대해 호출자
  gateway 인증 env를 해제하며, 후보 업데이트 명령이 일반 프로브 전에 Gateway를
  재시작하도록 요구합니다.
- `test:docker:update-migration`은 정리가 많은 게시 업데이트 레인입니다. 설정된
  Discord/Telegram 스타일 사용자 상태에서 시작하고, 설정된 Plugin 의존성이
  구체화될 기회를 갖도록 기준선 doctor를 실행하며, 설정된 패키지 Plugin에 대해
  레거시 Plugin 의존성 잔해를 시드하고, 후보 tarball로 업데이트한 뒤,
  업데이트 후 doctor가 레거시 의존성 루트를 제거하도록 요구합니다.

유용한 게시 업그레이드 survivor 변형:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

사용 가능한 시나리오는 `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path`, `versioned-runtime-deps`입니다. 집계 실행에서는
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`가 설정된 Plugin 설치 마이그레이션을 포함해
보고된 이슈 형태의 모든 시나리오로 확장됩니다.

전체 업데이트 마이그레이션은 의도적으로 전체 릴리스 CI와 분리되어 있습니다. 릴리스 질문이
"2026.4.23 이후의 모든 게시된 안정 릴리스가 이 후보로 업데이트되고
Plugin 의존성 잔해를 정리할 수 있는가?"일 때 수동 `Update Migration` 워크플로를
사용하세요.

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 패키지 수락

패키지 수락은 GitHub 네이티브 패키지 게이트입니다. 하나의 후보
패키지를 `package-under-test` tarball로 해석하고, 버전 및 SHA-256을 기록한 다음,
그 정확한 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 워크플로 하네스
ref는 패키지 소스 ref와 분리되어 있으므로 현재 테스트 로직이
이전의 신뢰된 릴리스를 검증할 수 있습니다.

후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확히
  게시된 버전을 검증합니다.
- `source=ref`: 선택한 현재 하네스로 신뢰된 브랜치, 태그 또는 커밋을
  패킹합니다.
- `source=url`: 필수 `package_sha256`이 있는 공개 HTTPS tarball을 검증합니다.
  이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부
  호스트 이름 또는 DNS/IP 결과, 특수 용도 IP 공간 및 안전하지 않은 리디렉션을 거부합니다.
- `source=trusted-url`: 필수 `package_sha256` 및 `trusted_source_id`가 있는
  HTTPS tarball을 `.github/package-trusted-sources.json`의 maintainer 소유 정책에
  따라 검증합니다. 입력 수준 allow-private 스위치로 `source=url`을 약화하는 대신
  enterprise/private 미러에는 이를 사용하세요. Bearer 인증은 정책으로 설정된 경우
  고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret을 사용합니다.
- `source=artifact`: 다른 Actions 실행에서 업로드한 tarball을 재사용합니다.

전체 릴리스 검증은 해석된 릴리스 SHA에서 빌드된 `source=artifact`를 기본으로 사용합니다.
게시 후 입증에는 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`를 전달하여
동일한 업그레이드 매트릭스가 대신 출시된 npm 패키지를 대상으로 하게 하세요.

릴리스 검사는 패키지/업데이트/재시작/Plugin 세트로 패키지 수락을 호출합니다.

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

릴리스 soak가 활성화되면 다음도 전달합니다.

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이렇게 하면 기본 릴리스 패키지 게이트가 모든 게시된 릴리스를 걷게 하지 않으면서도
패키지 마이그레이션, 업데이트 채널 전환, 손상된 관리형 Plugin 허용, 오래된 Plugin
의존성 정리, offline Plugin 커버리지, Plugin 업데이트 동작 및 Telegram 패키지 QA를
동일한 해석된 아티팩트 위에 유지합니다.

`last-stable-4`는 npm에 게시된 최신 안정 OpenClaw 릴리스 네 개로 해석됩니다.
릴리스 패키지 수락은 `2026.4.23`을 첫 번째 Plugin 업데이트 호환성 경계로,
`2026.5.2`를 Plugin 아키텍처 변동 경계로, `2026.4.15`를 더 오래된
2026.4.1x 게시 업데이트 기준선으로 고정합니다. resolver는 이미 최신 네 개에
포함된 pin을 중복 제거합니다. 게시 업데이트 마이그레이션 커버리지를 빠짐없이 얻으려면
전체 릴리스 CI 대신 별도의 Update Migration 워크플로에서 `all-since-2026.4.23`을 사용하세요.
레거시 이전 날짜 앵커도 원하는 수동의 더 넓은 샘플링에는 `release-history`를 계속 사용할 수 있습니다.

여러 게시 업그레이드 survivor 기준선이 선택되면 재사용 가능한
Docker 워크플로가 각 기준선을 자체 대상 runner job으로 shard합니다. 각
기준선 shard는 선택된 시나리오 세트를 계속 실행하지만, 로그와 아티팩트는 기준선별로 유지되고
전체 시간은 하나의 큰 직렬 job이 아니라 가장 느린 shard에 의해 제한됩니다.

릴리스 전에 후보를 검증할 때 패키지 프로필을 수동으로 실행하세요.

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

릴리스 질문에 MCP 채널, Cron/하위 에이전트 정리, OpenAI 웹 검색 또는 OpenWebUI가
포함될 때는 `suite_profile=product`를 사용하세요. 전체 Docker 릴리스 경로 커버리지가
필요할 때만 `suite_profile=full`을 사용하세요.

## 릴리스 기본값

릴리스 후보의 기본 입증 스택은 다음과 같습니다.

1. 소스 수준 회귀에 대한 `pnpm check:changed` 및 `pnpm test:changed`.
2. 패키지 아티팩트 무결성에 대한 `pnpm release:check`.
3. 설치/업데이트/재시작/Plugin 계약에 대한 패키지 수락 `package` 프로필 또는 릴리스 검사
   사용자 지정 패키지 레인.
4. OS별 설치 프로그램, 온보딩 및 플랫폼 동작에 대한 크로스 OS 릴리스 검사.
5. 변경된 표면이 제공자 또는 호스팅 서비스 동작에 닿을 때만 라이브 스위트.

maintainer 머신에서는 명시적으로 로컬 입증을 수행하는 경우가 아니라면 광범위한 게이트와
Docker/패키지 제품 입증을 Testbox에서 실행해야 합니다.

## 레거시 호환성

호환성 관용은 좁고 시간 제한이 있습니다.

- `2026.4.25-beta.*`를 포함한 `2026.4.25`까지의 패키지는
  패키지 수락에서 이미 출시된 패키지 메타데이터 공백을 허용할 수 있습니다.
- 게시된 `2026.4.26` 패키지는 이미 출시된 로컬 빌드 메타데이터 스탬프
  파일에 대해 경고할 수 있습니다.
- 이후 패키지는 현대적인 계약을 충족해야 합니다. 동일한 공백은 경고하거나 건너뛰는 대신
  실패합니다.

이러한 오래된 형태에 대해 새 시작 마이그레이션을 추가하지 마세요. doctor 복구를 추가하거나
확장한 다음, 업데이트 명령이 재시작을 소유할 때 `upgrade-survivor`,
`published-upgrade-survivor` 또는 `update-restart-auth`로 이를 입증하세요.

## 커버리지 추가

업데이트 또는 Plugin 동작을 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은 계층에
커버리지를 추가하세요.

- 순수 경로 또는 메타데이터 로직: 소스 옆에 단위 테스트를 둡니다.
- 패키지 인벤터리 또는 패킹된 파일 동작: `package-dist-inventory` 또는 tarball
  checker 테스트.
- CLI 설치/업데이트 동작: Docker lane assertion 또는 fixture.
- 게시된 릴리스 마이그레이션 동작: `published-upgrade-survivor` 시나리오.
- 업데이트가 소유하는 재시작 동작: `update-restart-auth`.
- 레지스트리/패키지 소스 동작: `test:docker:plugins` fixture 또는 ClawHub
  fixture 서버.
- 의존성 레이아웃 또는 정리 동작: 런타임 실행과 파일 시스템 경계를 모두 검증합니다. npm 의존성은 Plugin의
  관리형 npm 프로젝트 내부로 호이스팅될 수 있으므로, 테스트는 Plugin 패키지 로컬 `node_modules` 트리만 가정하지 말고
  해당 프로젝트가 스캔/정리된다는 것을 증명해야 합니다.

새 Docker fixture는 기본적으로 hermetic하게 유지하세요. 테스트의 목적이 라이브 레지스트리 동작이 아니라면 로컬 fixture 레지스트리와
가짜 패키지를 사용하세요.

## 실패 트리아지

아티팩트 식별 정보부터 시작하세요.

- Package Acceptance `resolve_package` 요약: 소스, 버전, SHA-256, 그리고
  아티팩트 이름.
- Docker 아티팩트: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane 로그, 그리고 재실행 명령.
- Upgrade survivor 요약: `.artifacts/upgrade-survivor/summary.json`,
  기준 버전, 후보 버전, 시나리오, 단계별 타이밍, 그리고
  recipe 단계를 포함합니다.

전체 릴리스 umbrella를 다시 실행하기보다, 동일한 패키지 아티팩트로 실패한 정확한 lane을 다시 실행하는 것을 선호하세요.
