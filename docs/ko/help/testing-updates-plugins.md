---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 승인 또는 Plugin 설치 동작 변경
    - 릴리스 후보 준비 또는 승인하기
    - 패키지 업데이트, Plugin 의존성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw가 업데이트 경로, 패키지 마이그레이션 및 Plugin 설치/업데이트 동작을 검증하는 방식
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-05-05T06:08:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

업데이트 및 Plugin 검증을 위한 전용 체크리스트입니다. 목표는 간단합니다:
설치 가능한 패키지가 실제 사용자 상태를 업데이트하고, `doctor`를 통해 오래된
레거시 상태를 복구하며, 지원되는 소스에서 Plugin을 계속 설치, 로드, 업데이트,
제거할 수 있음을 증명하는 것입니다.

더 넓은 테스트 러너 맵은 [테스트](/ko/help/testing)를 참고하세요. 라이브 provider
키와 네트워크를 사용하는 스위트는 [라이브 테스트](/ko/help/testing-live)를 참고하세요.

## 보호하는 것

업데이트 및 Plugin 테스트는 다음 계약을 보호합니다:

- 패키지 tarball은 완전해야 하고, 유효한 `dist/postinstall-inventory.json`을
  포함해야 하며, 압축 해제된 repo 파일에 의존하지 않아야 합니다.
- 사용자는 config, agents, sessions, workspaces, Plugin allowlist 또는
  channel config를 잃지 않고 이전에 게시된 패키지에서 후보 패키지로 이동할 수
  있어야 합니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구 경로를
  소유합니다. 시작 과정에서 오래된 Plugin 상태를 위한 숨겨진 호환성 migration이
  늘어나면 안 됩니다.
- Plugin 설치는 로컬 디렉터리, git repo, npm 패키지, ClawHub registry 경로에서
  작동해야 합니다.
- Plugin npm 의존성은 관리되는 npm root에 설치되고, trust 전에 스캔되며, 제거
  중에는 npm을 통해 제거되어 hoisted 의존성이 남지 않아야 합니다.
- 아무것도 변경되지 않았을 때 Plugin 업데이트는 안정적이어야 합니다. 설치 기록,
  resolved source, 설치된 의존성 layout, enabled 상태가 그대로 유지되어야
  합니다.

## 개발 중 로컬 증명

좁게 시작하세요:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, 의존성 또는 package-inventory 변경의 경우, 편집한 경계를
커버하는 집중 테스트도 실행하세요:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

패키지 Docker lane이 tarball을 사용하기 전에 패키지 artifact를 증명하세요:

```bash
pnpm release:check
```

`release:check`는 config/docs/API drift check를 실행하고, package dist
inventory를 쓰고, `npm pack --dry-run`을 실행하며, 금지된 packed file을 거부하고,
tarball을 임시 prefix에 설치한 뒤 postinstall을 실행하고 bundled channel
entrypoint를 smoke 테스트합니다.

## Docker lane

Docker lane은 product 수준의 증명입니다. Linux container 안에서 실제 패키지를
설치하거나 업데이트하고, CLI command, Gateway 시작, HTTP probe, RPC 상태,
파일시스템 상태를 통해 동작을 검증합니다.

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

- `test:docker:plugins`는 Plugin 설치 smoke, 로컬 폴더 설치, 로컬 폴더 업데이트
  skip 동작, preinstalled 의존성이 있는 로컬 폴더, `file:` 패키지 설치, CLI 실행이
  있는 git 설치, git moving-ref 업데이트, hoisted transitive 의존성이 있는 npm
  registry 설치, npm 업데이트 no-op, 로컬 ClawHub fixture 설치 및 업데이트 no-op,
  marketplace 업데이트 동작, Claude-bundle enable/inspect를 검증합니다. ClawHub
  블록을 hermetic/offline으로 유지하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을
  설정하세요.
- `test:docker:plugin-lifecycle-matrix`는 bare container에 후보 패키지를 설치하고,
  npm Plugin을 install, inspect, disable, enable, explicit upgrade, explicit
  downgrade, Plugin 코드 삭제 후 uninstall까지 실행합니다. 각 phase의 RSS와 CPU
  metric을 기록합니다.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이 `openclaw plugins update`
  중 재설치되거나 설치 metadata를 잃지 않는지 검증합니다.
- `test:docker:upgrade-survivor`는 dirty old-user fixture 위에 후보 tarball을
  설치하고, package update와 non-interactive doctor를 실행한 뒤, loopback Gateway를
  시작하고 상태 보존을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 published baseline을 설치하고,
  baked `openclaw config set` recipe로 설정한 다음, 후보 tarball로 업데이트하고,
  doctor를 실행하고, legacy cleanup을 확인하고, Gateway를 시작한 뒤 `/healthz`,
  `/readyz`, RPC 상태를 probe합니다.
- `test:docker:update-restart-auth`는 후보 패키지를 설치하고, managed token-auth
  Gateway를 시작하고, `openclaw update --yes --json`에 대해 caller gateway auth
  env를 unset하며, 후보 update command가 일반 probe 전에 Gateway를 재시작하도록
  요구합니다.
- `test:docker:update-migration`은 cleanup이 많은 published-update lane입니다.
  설정된 Discord/Telegram 스타일 사용자 상태에서 시작하고, 설정된 Plugin 의존성이
  materialize될 기회를 갖도록 baseline doctor를 실행하며, 설정된 packaged Plugin에
  대한 legacy Plugin dependency debris를 seed하고, 후보 tarball로 업데이트한 뒤
  post-update doctor가 legacy dependency root를 제거하도록 요구합니다.

유용한 published-upgrade survivor variant:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

사용 가능한 scenario는 `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path`, `versioned-runtime-deps`입니다. aggregate
실행에서 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`는 configured-plugin
install migration을 포함하여 보고된 issue 형태의 모든 scenario로 확장됩니다.

전체 update migration은 의도적으로 Full Release CI와 분리되어 있습니다. release
질문이 "2026.4.23 이후의 모든 published stable release가 이 후보로 업데이트되고
Plugin dependency debris를 정리할 수 있는가?"일 때는 수동 `Update Migration`
workflow를 사용하세요:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance는 GitHub-native package gate입니다. 하나의 후보 패키지를
`package-under-test` tarball로 resolve하고, version과 SHA-256을 기록한 뒤, 그 정확한
tarball에 대해 reusable Docker E2E lane을 실행합니다. workflow harness ref는 package
source ref와 분리되어 있으므로, 현재 test logic으로 오래된 trusted release를 검증할
수 있습니다.

후보 source:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 published version을
  검증합니다.
- `source=ref`: 선택된 현재 harness로 trusted branch, tag 또는 commit을 pack합니다.
- `source=url`: 필수 `package_sha256`이 있는 HTTPS tarball을 검증합니다.
- `source=artifact`: 다른 Actions run에서 업로드한 tarball을 재사용합니다.

Full Release Validation은 resolved release SHA에서 빌드된 `source=artifact`를 기본으로
사용합니다. post-publish 증명의 경우, 동일한 upgrade matrix가 shipped npm package를
대상으로 하도록 `package_acceptance_package_spec=openclaw@YYYY.M.D`를 전달하세요.

Release check는 package/update/restart/plugin set으로 Package Acceptance를 호출합니다:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

release soak가 활성화되면 다음도 전달합니다:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이렇게 하면 기본 release package gate가 모든 published release를 순회하지 않으면서도
package migration, update channel switching, 오래된 Plugin dependency cleanup, offline
Plugin coverage, Plugin update 동작, Telegram package QA를 동일한 resolved artifact에서
유지할 수 있습니다.

`last-stable-4`는 npm에 published된 최신 stable OpenClaw release 네 개로 resolve됩니다.
Release package acceptance는 `2026.4.23`을 첫 Plugin-update compatibility boundary로,
`2026.5.2`를 Plugin-architecture churn boundary로, `2026.4.15`를 더 오래된 2026.4.1x
published-update baseline으로 pin합니다. resolver는 최신 네 개에 이미 포함된 pin을
dedupe합니다. exhaustive published update migration coverage를 위해서는 Full Release
CI 대신 별도의 Update Migration workflow에서 `all-since-2026.4.23`을 사용하세요.
legacy pre-date anchor도 포함한 더 넓은 수동 sampling을 원할 때는 `release-history`가
계속 사용 가능합니다.

여러 published-upgrade survivor baseline을 선택하면 reusable Docker workflow가 각
baseline을 자체 targeted runner job으로 shard합니다. 각 baseline shard는 선택된
scenario set을 계속 실행하지만, log와 artifact는 baseline별로 유지되고 wall time은
하나의 큰 serial job 대신 가장 느린 shard에 의해 제한됩니다.

release 전에 후보를 검증할 때 package profile을 수동으로 실행하세요:

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

release 질문에 MCP channel, cron/subagent cleanup, OpenAI web search 또는 OpenWebUI가
포함되면 `suite_profile=product`를 사용하세요. 전체 Docker release-path coverage가
필요할 때만 `suite_profile=full`을 사용하세요.

## Release 기본값

release candidate의 기본 proof stack은 다음과 같습니다:

1. source 수준 regression을 위한 `pnpm check:changed` 및 `pnpm test:changed`.
2. package artifact 무결성을 위한 `pnpm release:check`.
3. install/update/restart/plugin contract를 위한 Package Acceptance `package` profile
   또는 release-check custom package lane.
4. OS별 installer, onboarding, platform 동작을 위한 Cross-OS release check.
5. 변경된 surface가 provider 또는 hosted-service 동작에 닿는 경우에만 live suite.

maintainer machine에서는 명시적으로 로컬 증명을 수행하는 경우가 아니라면 broad gate와
Docker/package product proof를 Testbox에서 실행해야 합니다.

## 레거시 호환성

Compatibility leniency는 좁고 time boxed입니다:

- `2026.4.25`까지의 패키지, `2026.4.25-beta.*` 포함, Package Acceptance에서 이미
  shipped된 package metadata gap을 허용할 수 있습니다.
- published `2026.4.26` 패키지는 이미 shipped된 local build metadata stamp file에 대해
  warn할 수 있습니다.
- 이후 패키지는 modern contract를 충족해야 합니다. 동일한 gap은 warning이나 skip 대신
  실패합니다.

이러한 오래된 형태에 대해 새 startup migration을 추가하지 마세요. doctor repair를
추가하거나 확장한 다음, update command가 restart를 소유할 때 `upgrade-survivor`,
`published-upgrade-survivor` 또는 `update-restart-auth`로 증명하세요.

## Coverage 추가

update 또는 Plugin 동작을 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은 layer에
coverage를 추가하세요:

- 순수 path 또는 metadata logic: source 옆 unit test.
- Package inventory 또는 packed-file 동작: `package-dist-inventory` 또는 tarball
  checker test.
- CLI install/update 동작: Docker lane assertion 또는 fixture.
- Published-release migration 동작: `published-upgrade-survivor` scenario.
- Update-owned restart 동작: `update-restart-auth`.
- Registry/package source 동작: `test:docker:plugins` fixture 또는 ClawHub fixture
  server.
- Dependency layout 또는 cleanup 동작: runtime execution과 filesystem boundary를 모두
  assert합니다. npm 의존성은 managed npm root 아래에 hoist될 수 있으므로, test는
  package-local `node_modules` tree를 가정하는 대신 root가 scan/clean되는지 증명해야
  합니다.

새 Docker fixture는 기본적으로 hermetic하게 유지하세요. test의 핵심이 live registry
동작이 아니라면 local fixture registry와 fake package를 사용하세요.

## 실패 triage

artifact identity부터 시작하세요:

- 패키지 승인 `resolve_package` 요약: 소스, 버전, SHA-256 및
  아티팩트 이름.
- Docker 아티팩트: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, 레인 로그 및 재실행 명령.
- 업그레이드 생존자 요약: `.artifacts/upgrade-survivor/summary.json`,
  기준 버전, 후보 버전, 시나리오, 단계별 타이밍 및
  레시피 단계를 포함합니다.

전체 릴리스 엄브렐러를 다시 실행하기보다 동일한 패키지 아티팩트로
실패한 정확한 레인을 다시 실행하는 것을 선호합니다.
