---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 승인 또는 Plugin 설치 동작 변경
    - 릴리스 후보 준비 또는 승인
    - 패키지 업데이트, Plugin 의존성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw가 업데이트 경로, 패키지 마이그레이션, Plugin 설치/업데이트 동작을 검증하는 방법
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-05-06T06:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

업데이트 및 Plugin 검증을 위한 전용 체크리스트입니다. 목표는 간단합니다. 설치 가능한 패키지가 실제 사용자 상태를 업데이트하고, `doctor`를 통해 오래된 레거시 상태를 복구하며, 지원되는 소스에서 Plugin을 계속 설치, 로드, 업데이트, 제거할 수 있음을 증명하는 것입니다.

더 넓은 테스트 실행기 맵은 [테스트](/ko/help/testing)를 참고하세요. 라이브 제공자 키와 네트워크를 사용하는 스위트는 [라이브 테스트](/ko/help/testing-live)를 참고하세요.

## 보호하는 것

업데이트 및 Plugin 테스트는 다음 계약을 보호합니다:

- 패키지 tarball이 완전하고, 유효한 `dist/postinstall-inventory.json`을 가지며, 압축 해제된 저장소 파일에 의존하지 않습니다.
- 사용자가 이전에 게시된 패키지에서 후보 패키지로 이동해도 config, agents, sessions, workspaces, Plugin allowlist 또는 channel config를 잃지 않습니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구 경로를 소유합니다. 시작 과정에서 오래된 Plugin 상태를 위한 숨겨진 호환성 마이그레이션이 늘어나서는 안 됩니다.
- Plugin 설치가 로컬 디렉터리, git 저장소, npm 패키지, ClawHub 레지스트리 경로에서 동작합니다.
- Plugin npm 의존성은 관리되는 npm 루트에 설치되고, 신뢰 전에 스캔되며, 제거 중 npm을 통해 삭제되어 hoist된 의존성이 남지 않습니다.
- 아무것도 변경되지 않았을 때 Plugin 업데이트가 안정적입니다. 설치 기록, 해결된 소스, 설치된 의존성 레이아웃, 활성화 상태가 그대로 유지됩니다.

## 개발 중 로컬 증명

좁게 시작하세요:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, 의존성 또는 패키지 인벤터리 변경의 경우, 편집한 연결부를 다루는 집중 테스트도 실행하세요:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

패키지 Docker lane이 tarball을 사용하기 전에 패키지 아티팩트를 증명하세요:

```bash
pnpm release:check
```

`release:check`는 config/docs/API drift 검사를 실행하고, 패키지 dist 인벤터리를 작성하고, `npm pack --dry-run`을 실행하고, 금지된 패키징 파일을 거부하고, tarball을 임시 prefix에 설치하고, postinstall을 실행하며, 번들 channel 진입점을 스모크 테스트합니다.

## Docker lane

Docker lane은 제품 수준의 증명입니다. Linux 컨테이너 안에서 실제 패키지를 설치하거나 업데이트하고, CLI 명령, Gateway 시작, HTTP probe, RPC 상태, 파일 시스템 상태를 통해 동작을 검증합니다.

반복 작업 중에는 집중 lane을 사용하세요:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

중요한 lane:

- `test:docker:plugins`는 Plugin 설치 스모크, 로컬 폴더 설치, 로컬 폴더 업데이트 skip 동작, 사전 설치된 의존성이 있는 로컬 폴더, `file:` 패키지 설치, CLI 실행이 있는 git 설치, git moving-ref 업데이트, hoist된 transitive 의존성이 있는 npm 레지스트리 설치, npm 업데이트 no-op, 로컬 ClawHub fixture 설치 및 업데이트 no-op, marketplace 업데이트 동작, Claude 번들 enable/inspect를 검증합니다. ClawHub 블록을 hermetic/offline으로 유지하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하세요.
- `test:docker:plugin-lifecycle-matrix`는 bare 컨테이너에 후보 패키지를 설치하고, npm Plugin을 install, inspect, disable, enable, explicit upgrade, explicit downgrade, Plugin 코드 삭제 후 uninstall까지 실행합니다. 각 단계의 RSS 및 CPU metrics를 기록합니다.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이 `openclaw plugins update` 중 재설치되거나 설치 메타데이터를 잃지 않는지 검증합니다.
- `test:docker:upgrade-survivor`는 더러운 old-user fixture 위에 후보 tarball을 설치하고, 패키지 업데이트와 non-interactive doctor를 실행한 다음 local loopback Gateway를 시작하고 상태 보존을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 게시된 baseline을 설치하고, baked `openclaw config set` 레시피를 통해 구성한 뒤, 후보 tarball로 업데이트하고, doctor를 실행하고, 레거시 정리를 확인하고, Gateway를 시작한 다음 `/healthz`, `/readyz`, RPC 상태를 probe합니다.
- `test:docker:update-restart-auth`는 후보 패키지를 설치하고, 관리되는 token-auth Gateway를 시작하고, `openclaw update --yes --json`에 대해 호출자 gateway auth env를 unset한 다음, 정상 probe 전에 후보 update 명령이 Gateway를 재시작하도록 요구합니다.
- `test:docker:update-migration`은 cleanup-heavy published-update lane입니다. 구성된 Discord/Telegram 스타일 사용자 상태에서 시작하고, 구성된 Plugin 의존성이 materialize될 기회를 갖도록 baseline doctor를 실행하고, 구성된 packaged Plugin에 대해 레거시 Plugin 의존성 잔해를 seed하고, 후보 tarball로 업데이트한 다음, post-update doctor가 레거시 의존성 루트를 제거하도록 요구합니다.

유용한 published-upgrade survivor 변형:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

사용 가능한 시나리오는 `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`, `versioned-runtime-deps`입니다. 집계 실행에서 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`는 configured-plugin install migration을 포함해 보고된 issue 형태의 모든 시나리오로 확장됩니다.

전체 update migration은 의도적으로 Full Release CI와 분리되어 있습니다. 릴리스 질문이 "2026.4.23 이후의 모든 게시된 stable 릴리스가 이 후보로 업데이트되고 Plugin 의존성 잔해를 정리할 수 있는가?"일 때는 수동 `Update Migration` workflow를 사용하세요:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 패키지 승인

패키지 승인은 GitHub-native 패키지 게이트입니다. 하나의 후보 패키지를 `package-under-test` tarball로 해결하고, 버전과 SHA-256을 기록한 다음, 해당 정확한 tarball을 대상으로 재사용 가능한 Docker E2E lane을 실행합니다. workflow harness ref는 패키지 소스 ref와 분리되어 있으므로 현재 테스트 로직으로 이전의 신뢰된 릴리스를 검증할 수 있습니다.

후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 게시 버전을 검증합니다.
- `source=ref`: 선택된 현재 harness로 신뢰된 branch, tag 또는 commit을 pack합니다.
- `source=url`: 필수 `package_sha256`과 함께 HTTPS tarball을 검증합니다.
- `source=artifact`: 다른 Actions 실행에서 업로드된 tarball을 재사용합니다.

Full Release Validation은 기본적으로 해결된 릴리스 SHA에서 빌드된 `source=artifact`를 사용합니다. 게시 후 증명의 경우 `package_acceptance_package_spec=openclaw@YYYY.M.D`를 전달하여 동일한 upgrade matrix가 shipped npm 패키지를 대상으로 하도록 합니다.

릴리스 검사는 package/update/restart/plugin 세트로 패키지 승인을 호출합니다:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

릴리스 soak가 활성화되면 다음도 전달합니다:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이를 통해 package migration, update channel switching, 손상된 managed-Plugin tolerance, 오래된 Plugin 의존성 정리, offline Plugin coverage, Plugin update 동작, Telegram package QA가 동일한 resolved artifact에서 유지되며, 기본 릴리스 패키지 게이트가 게시된 모든 릴리스를 순회하지 않게 됩니다.

`last-stable-4`는 npm에 게시된 최신 stable OpenClaw 릴리스 네 개로 해결됩니다. 릴리스 패키지 승인은 `2026.4.23`을 첫 Plugin-update compatibility boundary로, `2026.5.2`를 Plugin-architecture churn boundary로, `2026.4.15`를 더 오래된 2026.4.1x published-update baseline으로 고정합니다. resolver는 최신 네 개에 이미 포함된 pin을 중복 제거합니다. exhaustive published update migration coverage의 경우 Full Release CI 대신 별도의 Update Migration workflow에서 `all-since-2026.4.23`을 사용하세요. legacy pre-date anchor도 원하는 경우 수동으로 더 넓게 sampling할 수 있도록 `release-history`는 계속 사용할 수 있습니다.

여러 published-upgrade survivor baseline이 선택되면, 재사용 가능한 Docker workflow는 각 baseline을 자체 targeted runner job으로 shard합니다. 각 baseline shard는 선택된 scenario set을 계속 실행하지만, 로그와 아티팩트는 baseline별로 유지되고 wall time은 하나의 큰 serial job이 아니라 가장 느린 shard에 의해 제한됩니다.

릴리스 전 후보를 검증할 때 패키지 profile을 수동으로 실행하세요:

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

릴리스 질문에 MCP channel, cron/subagent cleanup, OpenAI web search 또는 OpenWebUI가 포함되면 `suite_profile=product`를 사용하세요. 전체 Docker release-path coverage가 필요할 때만 `suite_profile=full`을 사용하세요.

## 릴리스 기본값

릴리스 후보의 기본 증명 스택은 다음과 같습니다:

1. 소스 수준 회귀에 대한 `pnpm check:changed` 및 `pnpm test:changed`.
2. 패키지 아티팩트 무결성에 대한 `pnpm release:check`.
3. install/update/restart/plugin 계약에 대한 패키지 승인 `package` profile 또는 release-check custom package lane.
4. OS별 installer, onboarding, platform 동작에 대한 Cross-OS release check.
5. 변경된 표면이 provider 또는 hosted-service 동작을 건드릴 때만 live suite.

maintainer 머신에서는 명시적으로 로컬 증명을 수행하는 경우가 아니라면 broad gate와 Docker/package product proof를 Testbox에서 실행해야 합니다.

## 레거시 호환성

호환성 leniency는 좁고 시간 제한이 있습니다:

- `2026.4.25-beta.*`를 포함해 `2026.4.25`까지의 패키지는 Package Acceptance에서 이미 shipped된 패키지 메타데이터 gap을 허용할 수 있습니다.
- 게시된 `2026.4.26` 패키지는 이미 shipped된 로컬 build metadata stamp 파일에 대해 경고할 수 있습니다.
- 이후 패키지는 현대적 계약을 충족해야 합니다. 같은 gap은 경고 또는 skip 대신 실패합니다.

이 오래된 형태에 대해 새 startup migration을 추가하지 마세요. doctor repair를 추가하거나 확장한 다음, update 명령이 restart를 소유하는 경우 `upgrade-survivor`, `published-upgrade-survivor` 또는 `update-restart-auth`로 증명하세요.

## coverage 추가

update 또는 Plugin 동작을 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은 계층에 coverage를 추가하세요:

- 순수 path 또는 metadata logic: 소스 옆 unit test.
- Package inventory 또는 packed-file behavior: `package-dist-inventory` 또는 tarball checker test.
- CLI install/update behavior: Docker lane assertion 또는 fixture.
- Published-release migration behavior: `published-upgrade-survivor` scenario.
- Update-owned restart behavior: `update-restart-auth`.
- Registry/package source behavior: `test:docker:plugins` fixture 또는 ClawHub fixture server.
- Dependency layout 또는 cleanup behavior: runtime execution과 filesystem boundary를 모두 assert하세요. npm 의존성은 managed npm root 아래로 hoist될 수 있으므로, 테스트는 package-local `node_modules` tree를 가정하는 대신 root가 scanned/cleaned되는지 증명해야 합니다.

새 Docker fixture는 기본적으로 hermetic하게 유지하세요. 테스트의 핵심이 live registry behavior인 경우가 아니라면 local fixture registry와 fake package를 사용하세요.

## 실패 triage

아티팩트 identity부터 시작하세요:

- 패키지 승인 `resolve_package` 요약: 소스, 버전, SHA-256 및
  아티팩트 이름.
- Docker 아티팩트: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, 레인 로그 및 재실행 명령.
- 업그레이드 생존자 요약: `.artifacts/upgrade-survivor/summary.json`,
  기준 버전, 후보 버전, 시나리오, 단계별 타이밍 및
  레시피 단계를 포함합니다.

전체 릴리스 우산을 다시 실행하기보다 동일한 패키지 아티팩트로
실패한 정확한 레인을 다시 실행하는 것을 선호합니다.
