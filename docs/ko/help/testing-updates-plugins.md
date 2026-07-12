---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 승인 또는 Plugin 설치 동작 변경하기
    - 릴리스 후보 준비 또는 승인
    - 패키지 업데이트, Plugin 종속성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw이 업데이트 경로, 패키지 마이그레이션 및 Plugin 설치/업데이트 동작을 검증하는 방법
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-07-12T00:52:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

업데이트 및 Plugin 검증 체크리스트: 설치 가능한 패키지가 실제 사용자 상태를
업데이트하고, `doctor`를 통해 오래된 레거시 상태를 복구하며, 지원되는 모든 소스에서
Plugin을 계속 설치, 로드, 업데이트 및 제거할 수 있음을 입증합니다.

더 광범위한 테스트 실행기 구성은 [테스트](/ko/help/testing)를 참조하세요. 실제 제공자
키와 네트워크에 접근하는 스위트는 [실제 환경 테스트](/ko/help/testing-live)를 참조하세요.

## 보호 대상

- 패키지 tarball은 완전하고 유효한 `dist/postinstall-inventory.json`을 포함하며,
  압축 해제된 저장소 파일에 의존하지 않습니다.
- 사용자는 구성, 에이전트, 세션, 작업 공간, Plugin 허용 목록 또는 채널 구성을
  잃지 않고 이전에 게시된 패키지에서 후보 패키지로 이동할 수 있습니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구 경로를 담당합니다.
  시작 과정에서 오래된 Plugin 상태를 위한 숨겨진 호환성 마이그레이션이 늘어나서는
  안 됩니다.
- Plugin 설치는 로컬 디렉터리, git 저장소, npm 패키지 및 ClawHub 레지스트리
  경로에서 작동합니다.
- Plugin npm 의존성은 Plugin별로 관리되는 하나의 npm 프로젝트에 설치되고,
  신뢰하기 전에 검사되며, Plugin 제거 중 `npm uninstall`을 통해 제거되어
  호이스팅된 의존성이 남지 않습니다.
- 아무것도 변경되지 않았을 때 Plugin 업데이트는 아무 작업도 하지 않습니다.
  설치 기록, 확인된 소스, 설치된 의존성 레이아웃 및 활성화 상태가 그대로
  유지됩니다.

## 개발 중 로컬 검증

좁은 범위에서 시작하세요.

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, 의존성 또는 패키지 인벤토리를 변경한 경우 편집한 접점을
검증하는 집중 테스트도 실행하세요.

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

패키지 Docker 레인이 tarball을 사용하기 전에 패키지 아티팩트를 검증하세요.

```bash
pnpm release:check
```

`release:check`는 구성/문서/API 드리프트 검사(구성 스키마, 구성 문서 기준선,
Plugin SDK API 기준선 및 내보내기, Plugin 버전/인벤토리)를 실행하고, 패키지 배포
인벤토리를 작성하며, `npm pack --dry-run`을 실행하고, 금지된 패키징 파일을
거부하며, tarball을 임시 접두사에 설치하고, 설치 후 작업을 실행하며, 번들 채널
진입점을 스모크 테스트합니다.

## Docker 레인

Docker 레인은 제품 수준의 검증입니다. Linux 컨테이너 내부에서 실제 패키지를
설치하거나 업데이트하고 CLI 명령, Gateway 시작, HTTP 프로브, RPC 상태 및 파일
시스템 상태를 통해 동작을 확인합니다.

반복 개발 중에는 집중 레인을 사용하세요.

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

- `test:docker:plugins`는 Plugin 설치 스모크 테스트, 로컬 폴더 설치, 로컬 폴더
  업데이트 건너뛰기 동작, 사전 설치된 의존성이 있는 로컬 폴더, `file:` 패키지
  설치, CLI 실행을 포함한 git 설치, 이동하는 git 참조 업데이트, 호이스팅된 전이
  의존성이 있는 npm 레지스트리 설치, npm 업데이트 무작업, 잘못된 npm 패키지
  메타데이터 거부, 로컬 ClawHub 픽스처 설치 및 업데이트 무작업, 마켓플레이스
  업데이트 동작, Claude 번들 활성화/검사를 다룹니다. ClawHub 블록을 완전히
  격리된 오프라인 상태로 유지하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을
  설정하세요.
- `test:docker:plugin-lifecycle-matrix`는 빈 컨테이너에 후보 패키지를 설치하고,
  npm Plugin을 설치, 검사, 비활성화, 활성화, 명시적 업그레이드, 명시적
  다운그레이드 및 Plugin 코드를 삭제한 후 제거하는 전체 과정으로 실행합니다.
  단계별 RSS 및 CPU 지표를 기록합니다.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이
  `openclaw plugins update` 중 다시 설치되거나 설치 메타데이터를 잃지 않는지
  검증합니다.
- `test:docker:upgrade-survivor`는 정리되지 않은 이전 사용자 픽스처 위에 후보
  tarball을 설치하고, 패키지 업데이트와 비대화형 doctor를 실행한 다음, local loopback
  Gateway를 시작하고 상태 보존을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 게시된 기준 버전을 설치하고,
  미리 포함된 `openclaw config set` 레시피를 통해 구성한 뒤, 후보 tarball로
  업데이트하고, doctor를 실행하고, 레거시 정리를 확인하고, Gateway를 시작한
  다음 `/healthz`, `/readyz` 및 RPC 상태를 검사합니다.
- `test:docker:update-restart-auth`는 후보 패키지를 설치하고, 관리되는 토큰 인증
  Gateway를 시작하고, `openclaw update --yes --json`을 위해 호출자 Gateway
  인증 환경 변수를 해제하며, 일반 프로브 전에 후보 업데이트 명령이 Gateway를
  다시 시작하도록 요구합니다.
- `test:docker:update-migration`은 정리에 중점을 둔 게시 패키지 업데이트
  레인입니다. 구성된 Discord/Telegram 스타일 사용자 상태에서 시작하고,
  구성된 Plugin 의존성이 생성될 기회를 갖도록 기준 버전의 doctor를 실행하며,
  구성된 패키지 Plugin에 대한 레거시 Plugin 의존성 잔여물을 생성하고, 후보
  tarball로 업데이트한 뒤, 업데이트 후 doctor가 레거시 의존성 루트를 제거하도록
  요구합니다.

유용한 게시 업그레이드 생존 테스트 변형:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

사용 가능한 시나리오: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`,
`versioned-runtime-deps`. 집계 실행에서 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(별칭 `far-reaching`)는 구성된 Plugin 설치 마이그레이션을 포함한 모든
시나리오로 확장됩니다.

전체 업데이트 마이그레이션은 의도적으로 전체 릴리스 CI와 분리되어 있습니다.
릴리스 관련 질문이 "2026.4.23 이후 게시된 모든 안정 릴리스가 이 후보로
업데이트되고 Plugin 의존성 잔여물을 정리할 수 있는가?"인 경우 수동
`Update Migration` 워크플로를 사용하세요.

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 패키지 승인

패키지 승인은 GitHub 네이티브 패키지 게이트입니다. 하나의 후보 패키지를
`package-under-test` tarball로 확인하고, 버전과 SHA-256을 기록한 다음, 정확히
그 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 워크플로
하네스 참조는 패키지 소스 참조와 분리되어 있으므로 현재 테스트 로직으로 이전의
신뢰할 수 있는 릴리스를 검증할 수 있습니다.

후보 소스:

- `source=npm`: `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` 또는 정확한 게시 버전을 검증합니다.
- `source=ref`: 선택한 현재 하네스를 사용하여 신뢰할 수 있는 브랜치, 태그 또는
  커밋을 패키징합니다.
- `source=url`: 필수 `package_sha256`이 있는 공개 HTTPS tarball을 검증합니다.
  이 경로는 URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부 호스트 이름
  또는 DNS/IP 결과, 특수 용도 IP 공간 및 안전하지 않은 리디렉션을 거부합니다.
- `source=trusted-url`: 필수 `package_sha256`과 `trusted_source_id`가 있는
  HTTPS tarball을 유지관리자 소유의 `.github/package-trusted-sources.json`
  정책에 따라 검증합니다. 입력 수준의 비공개 허용 스위치로 `source=url`을
  약화하는 대신 기업/비공개 미러에 이 방식을 사용하세요. 정책에서 구성된 경우
  Bearer 인증은 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 비밀을 사용합니다.
- `source=artifact`: 다른 Actions 실행에서 업로드한 tarball을 재사용합니다.

전체 릴리스 검증은 기본적으로 확인된 릴리스 SHA에서 빌드된 `source=artifact`를
사용합니다. 게시 후 검증에는 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`를
전달하여 동일한 업그레이드 매트릭스가 실제 배포된 npm 패키지를 대상으로 하도록
합니다.

릴리스 검사는 다음 패키지/업데이트/재시작/Plugin 집합으로 패키지 승인을
호출합니다.

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

릴리스 안정화 실행이 활성화되면(`release_profile=stable` 및 `full`에서는 강제로
활성화됨) 다음 항목도 전달합니다.

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이를 통해 기본 릴리스 패키지 게이트가 게시된 모든 릴리스를 순회하지 않아도 패키지
마이그레이션, 업데이트 채널 전환, 손상된 관리형 Plugin 허용, 오래된 Plugin
의존성 정리, 오프라인 Plugin 검사 범위, Plugin 업데이트 동작 및 Telegram
패키지 QA를 동일하게 확인된 아티팩트에서 수행할 수 있습니다.

`last-stable-4`는 npm에 게시된 최신 OpenClaw 안정 릴리스 4개로 확인됩니다.
릴리스 패키지 승인은 `2026.4.23`을 최초 Plugin 업데이트 호환성 경계로,
`2026.5.2`를 Plugin 아키텍처 변동 경계로, `2026.4.15`를 이전
2026.4.1x 게시 업데이트 기준선으로 고정합니다. 확인자는 최신 4개에 이미 포함된
고정 버전을 중복 제거합니다. 게시된 업데이트 마이그레이션을 빠짐없이 검증하려면
전체 릴리스 CI 대신 별도의 업데이트 마이그레이션 워크플로에서
`all-since-2026.4.23`을 사용하세요. 레거시 날짜 이전 기준점도 포함하여 더 넓은
범위를 수동으로 샘플링하려는 경우 `release-history`를 계속 사용할 수 있습니다.

여러 게시 업그레이드 생존 테스트 기준선을 선택하면 재사용 가능한 Docker 워크플로가
각 기준선을 개별 대상 실행기 작업으로 샤딩합니다. 각 기준선 샤드는 선택한 시나리오
집합을 계속 실행하지만 로그와 아티팩트는 기준선별로 유지되며, 총 소요 시간은 하나의
큰 직렬 작업이 아니라 가장 느린 샤드의 실행 시간으로 제한됩니다.

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

게시된 확장 안정판 카나리에는 `package_spec=openclaw@extended-stable`을
설정하세요. 패키지 승인은 Docker 레인이 실행되기 전에 해당 선택자를 정확한
tarball로 확인합니다.

릴리스 검증 범위에 MCP 채널, Cron/하위 에이전트 정리, OpenAI 웹 검색 또는
OpenWebUI가 포함되는 경우 `suite_profile=product`를 사용하세요. 전체 Docker
릴리스 경로 검사가 필요한 경우에만 `suite_profile=full`을 사용하세요.

## 릴리스 기본값

릴리스 후보의 기본 검증 스택은 다음과 같습니다.

1. 소스 수준 회귀 검사를 위한 `pnpm check:changed` 및 `pnpm test:changed`.
2. 패키지 아티팩트 무결성을 위한 `pnpm release:check`.
3. 설치/업데이트/재시작/Plugin 계약을 위한 패키지 승인 `package` 프로필 또는
   릴리스 검사 사용자 지정 패키지 레인.
4. 운영체제별 설치 프로그램, 온보딩 및 플랫폼 동작을 위한 운영체제 간 릴리스 검사.
5. 변경된 표면이 제공자 또는 호스팅 서비스 동작에 영향을 줄 때만 실제 환경 스위트.

유지관리자 시스템에서는 명시적으로 로컬 검증을 수행하는 경우가 아니라면 광범위한
게이트와 Docker/패키지 제품 검증을 Testbox에서 실행해야 합니다.

## 레거시 호환성

호환성 완화 범위는 좁고 기간이 제한됩니다.

- `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는 패키지 승인에서
  이미 배포된 패키지 메타데이터 누락을 허용할 수 있습니다.
- 게시된 `2026.4.26` 패키지는 이미 배포된 로컬 빌드 메타데이터 스탬프 파일에
  대해 경고할 수 있습니다.
- 이후 패키지는 최신 계약을 충족해야 합니다. 동일한 누락은 경고하거나 건너뛰는
  대신 실패합니다.

이러한 이전 형태를 위한 새 시작 마이그레이션을 추가하지 마세요. doctor 복구를
추가하거나 확장한 다음, 업데이트 명령이 재시작을 담당하는 경우
`upgrade-survivor`, `published-upgrade-survivor` 또는 `update-restart-auth`로
검증하세요.

## 검사 범위 추가

업데이트 또는 Plugin 동작을 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은
계층에 검사 범위를 추가하세요.

- 순수 경로 또는 메타데이터 로직: 소스 옆에 단위 테스트를 배치합니다.
- 패키지 인벤토리 또는 패킹된 파일 동작: `package-dist-inventory` 또는 tarball
  검사기 테스트를 사용합니다.
- CLI 설치/업데이트 동작: Docker 레인 어설션 또는 픽스처를 사용합니다.
- 게시된 릴리스 마이그레이션 동작: `published-upgrade-survivor` 시나리오를 사용합니다.
- 업데이트가 소유하는 재시작 동작: `update-restart-auth`를 사용합니다.
- 레지스트리/패키지 소스 동작: `test:docker:plugins` 픽스처 또는 ClawHub
  픽스처 서버를 사용합니다.
- 의존성 레이아웃 또는 정리 동작: 런타임 실행과 파일 시스템 경계를 모두
  검증합니다. npm 의존성은 Plugin의 관리형 npm 프로젝트 내부에서 호이스팅될 수
  있으므로, 테스트에서는 Plugin 패키지 로컬 `node_modules` 트리만 가정하지 말고
  해당 프로젝트가 스캔되고 정리되는지 입증해야 합니다.

새 Docker 픽스처는 기본적으로 자체 완결적으로 유지합니다. 테스트 목적이 실제
레지스트리 동작을 검증하는 것이 아니라면 로컬 픽스처 레지스트리와 가짜 패키지를
사용합니다.

## 실패 분류

아티팩트 식별 정보부터 확인합니다.

- 패키지 승인 `resolve_package` 요약: 소스, 버전, SHA-256 및
  아티팩트 이름.
- Docker 아티팩트: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, 레인 로그 및 재실행 명령.
- 업그레이드 생존자 요약: `.artifacts/upgrade-survivor/summary.json`.
  기준 버전, 후보 버전, 시나리오, 단계별 소요 시간 및 구성 레시피 범위를
  포함합니다.

전체 릴리스 통합 작업을 다시 실행하기보다 동일한 패키지 아티팩트로 실패한 정확한
레인을 다시 실행하는 방식을 우선합니다.
