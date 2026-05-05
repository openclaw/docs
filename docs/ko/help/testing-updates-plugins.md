---
read_when:
    - OpenClaw 업데이트, doctor, 패키지 승인 또는 Plugin 설치 동작 변경
    - 릴리스 후보 준비 또는 승인
    - 패키지 업데이트, Plugin 종속성 정리 또는 Plugin 설치 회귀 디버깅
sidebarTitle: Update and plugin tests
summary: OpenClaw가 업데이트 경로, 패키지 마이그레이션 및 Plugin 설치/업데이트 동작을 검증하는 방법
title: '테스트: 업데이트 및 Plugin'
x-i18n:
    generated_at: "2026-05-05T01:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

업데이트 및 Plugin 검증을 위한 전용 체크리스트입니다. 목표는
간단합니다. 설치 가능한 패키지가 실제 사용자 상태를 업데이트할 수 있고, `doctor`를 통해 오래된
레거시 상태를 복구할 수 있으며, 지원되는 소스에서 Plugin을 계속 설치, 로드, 업데이트, 제거할 수 있음을
증명하는 것입니다.

더 넓은 테스트 러너 맵은 [테스트](/ko/help/testing)를 참고하세요. 라이브 provider
키와 네트워크를 사용하는 스위트는 [라이브 테스트](/ko/help/testing-live)를 참고하세요.

## 보호하는 것

업데이트 및 Plugin 테스트는 다음 계약을 보호합니다.

- 패키지 tarball이 완전하고, 유효한 `dist/postinstall-inventory.json`을 가지며,
  압축 해제된 repo 파일에 의존하지 않습니다.
- 사용자는 이전에 게시된 패키지에서 후보 패키지로 이동할 때 config, agents, sessions, workspaces, Plugin allowlists 또는
  channel config를 잃지 않습니다.
- `openclaw doctor --fix --non-interactive`가 레거시 정리 및 복구
  경로를 소유합니다. 시작 과정이 오래된
  Plugin 상태에 대한 숨겨진 호환성 마이그레이션을 늘려서는 안 됩니다.
- Plugin 설치는 로컬 디렉터리, git repos, npm packages, 그리고
  ClawHub registry 경로에서 작동합니다.
- Plugin npm dependencies는 관리되는 npm root에 설치되고, 신뢰 전에 스캔되며,
  제거 중 npm을 통해 제거되어 hoisted dependencies가 남아 있지 않습니다.
- 아무것도 변경되지 않았을 때 Plugin 업데이트는 안정적입니다. 설치 기록, 해석된
  source, 설치된 dependency layout, enabled state가 그대로 유지됩니다.

## 개발 중 로컬 증명

좁게 시작하세요.

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin 설치, 제거, dependency 또는 package-inventory 변경의 경우, 편집된 seam을 다루는
집중 테스트도 실행하세요.

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

어떤 패키지 Docker lane이 tarball을 사용하기 전에, 패키지 artifact를 증명하세요.

```bash
pnpm release:check
```

`release:check`는 config/docs/API drift 검사를 실행하고, package dist
inventory를 작성하며, `npm pack --dry-run`을 실행하고, 금지된 packed files를 거부하며, tarball을
임시 prefix에 설치하고, postinstall을 실행하며, bundled channel
entrypoints를 smoke 테스트합니다.

## Docker lanes

Docker lanes는 제품 수준 증명입니다. Linux containers 안에서 실제
패키지를 설치하거나 업데이트하고 CLI commands,
Gateway 시작, HTTP probes, RPC status, filesystem state를 통해 동작을 검증합니다.

반복 작업 중에는 집중 lane을 사용하세요.

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

중요한 lanes:

- `test:docker:plugins`는 Plugin 설치 smoke, local folder 설치,
  local folder update skip behavior, preinstalled
  dependencies가 있는 local folders, `file:` package installs, CLI 실행을 포함한 git
  installs, git moving-ref updates, hoisted transitive
  dependencies가 있는 npm registry installs, npm update no-ops, local ClawHub fixture installs 및 update
  no-ops, marketplace update behavior, Claude-bundle enable/inspect를 검증합니다.
  ClawHub block을 hermetic/offline으로 유지하려면
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하세요.
- `test:docker:plugin-lifecycle-matrix`는 bare
  container에 후보 패키지를 설치하고, npm Plugin을 install, inspect, disable, enable,
  explicit upgrade, explicit downgrade, 그리고 Plugin
  code 삭제 후 uninstall까지 실행합니다. 각 phase에 대해 RSS 및 CPU metrics를 기록합니다.
- `test:docker:plugin-update`는 변경되지 않은 설치된 Plugin이
  `openclaw plugins update` 중 재설치되거나 설치 metadata를 잃지 않는지 검증합니다.
- `test:docker:upgrade-survivor`는 후보 tarball을 더러운
  old-user fixture 위에 설치하고, package update와 non-interactive doctor를 실행한 다음,
  loopback Gateway를 시작하고 state preservation을 확인합니다.
- `test:docker:published-upgrade-survivor`는 먼저 published baseline을 설치하고,
  baked `openclaw config set` recipe로 설정한 뒤, 후보 tarball로 업데이트하고,
  doctor를 실행하며, legacy cleanup을 확인하고, Gateway를 시작한 다음
  `/healthz`, `/readyz`, RPC status를 probe합니다.
- `test:docker:update-migration`은 정리 작업이 많은 published-update lane입니다.
  설정된 Discord/Telegram 스타일 사용자 상태에서 시작하고, configured Plugin dependencies가 materialize될 기회를 갖도록 baseline
  doctor를 실행하며, configured packaged Plugin을 위한 legacy Plugin dependency debris를 seed하고,
  후보 tarball로 업데이트한 뒤, post-update doctor가 legacy
  dependency roots를 제거해야 한다고 요구합니다.

유용한 published-upgrade survivor 변형:

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
`stale-source-plugin-shadow`, `tilde-log-path`, `versioned-runtime-deps`입니다. aggregate runs에서는
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`가 configured-plugin install migration을 포함한 모든 reported
issue-shaped scenarios로 확장됩니다.

전체 update migration은 의도적으로 Full Release CI와 분리되어 있습니다. release 질문이 "2026.4.23 이후의 모든
published stable release가 이 후보로 업데이트되고
Plugin dependency debris를 정리할 수 있는가?"일 때 수동 `Update Migration` workflow를 사용하세요.

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance는 GitHub-native package gate입니다. 하나의 후보
패키지를 `package-under-test` tarball로 해석하고, version과 SHA-256을 기록한 다음,
그 정확한 tarball에 대해 reusable Docker E2E lanes를 실행합니다. workflow harness
ref는 package source ref와 분리되어 있어, 현재 테스트 로직이
이전 trusted releases를 검증할 수 있습니다.

후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한
  published version을 검증합니다.
- `source=ref`: 선택된 current
  harness로 trusted branch, tag 또는 commit을 pack합니다.
- `source=url`: 필수 `package_sha256`이 있는 HTTPS tarball을 검증합니다.
- `source=artifact`: 다른 Actions run이 업로드한 tarball을 재사용합니다.

Full Release Validation은 기본적으로 `source=artifact`를 사용하며,
resolved release SHA에서 빌드됩니다. post-publish proof의 경우, 동일한 upgrade matrix가
shipped npm package를 대신 대상으로 삼도록
`package_acceptance_package_spec=openclaw@YYYY.M.D`를 전달하세요.

Release checks는 package/update/plugin 세트로 Package Acceptance를 호출합니다.

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

또한 다음을 전달합니다.

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

이는 package migration, update channel switching, stale Plugin dependency
cleanup, offline Plugin coverage, Plugin update behavior, Telegram package
QA를 동일한 resolved artifact에서 유지합니다.

`all-since-2026.4.23`은 Full Release CI upgrade sample입니다. `2026.4.23`부터 `latest`까지 npm에 게시된 모든 stable release를 포함합니다. exhaustive published
update migration coverage가 필요하면 Full Release CI 대신 별도의 Update
Migration workflow에서 `all-since-2026.4.23`을 사용하세요. legacy pre-date
anchor도 함께 원할 때 수동 wider sampling을 위해 `release-history`는 계속
사용할 수 있습니다.

release 전에 후보를 검증할 때 package profile을 수동으로 실행하세요.

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

release 질문에 MCP channels, cron/subagent cleanup, OpenAI web search 또는 OpenWebUI가 포함될 때는 `suite_profile=product`를 사용하세요. full Docker release-path coverage가 필요할 때만 `suite_profile=full`을 사용하세요.

## Release 기본값

release candidates의 기본 proof stack은 다음과 같습니다.

1. source-level regressions를 위한 `pnpm check:changed` 및 `pnpm test:changed`.
2. package artifact integrity를 위한 `pnpm release:check`.
3. install/update/plugin contracts를 위한 Package Acceptance `package` profile 또는 release-check custom package
   lanes.
4. OS-specific installer, onboarding, platform
   behavior를 위한 Cross-OS release checks.
5. 변경된 surface가 provider 또는 hosted-service
   behavior에 닿을 때만 live suites.

maintainer machines에서는 명시적으로 local proof를 수행하는 경우가 아니라면 broad gates와 Docker/package product proof를
Testbox에서 실행해야 합니다.

## Legacy compatibility

Compatibility leniency는 좁고 time boxed입니다.

- `2026.4.25-beta.*`를 포함하여 `2026.4.25`까지의 패키지는
  Package Acceptance에서 이미 shipped된 package metadata gaps를 허용할 수 있습니다.
- 게시된 `2026.4.26` 패키지는 이미 shipped된 local build metadata stamp
  files에 대해 warn할 수 있습니다.
- 이후 패키지는 modern contracts를 만족해야 합니다. 같은 gaps는
  warning 또는 skipping 대신 실패합니다.

이 오래된 형태를 위해 새 startup migrations를 추가하지 마세요. doctor
repair를 추가하거나 확장한 뒤, `upgrade-survivor` 또는 `published-upgrade-survivor`로 증명하세요.

## Coverage 추가

update 또는 Plugin behavior를 변경할 때는 올바른 이유로 실패할 수 있는 가장 낮은 layer에
coverage를 추가하세요.

- Pure path 또는 metadata logic: source 옆 unit test.
- Package inventory 또는 packed-file behavior: `package-dist-inventory` 또는 tarball
  checker test.
- CLI install/update behavior: Docker lane assertion 또는 fixture.
- Published-release migration behavior: `published-upgrade-survivor` scenario.
- Registry/package source behavior: `test:docker:plugins` fixture 또는 ClawHub
  fixture server.
- Dependency layout 또는 cleanup behavior: runtime execution과
  filesystem boundary를 모두 assert합니다. npm dependencies는 managed npm
  root 아래로 hoist될 수 있으므로, tests는 package-local `node_modules` tree를 가정하는 대신 root가 scanned/cleaned됨을 증명해야 합니다.

새 Docker fixtures는 기본적으로 hermetic하게 유지하세요. 테스트의 목적이 live registry behavior가 아닌 한
local fixture registries와 fake packages를 사용하세요.

## Failure triage

artifact identity부터 시작하세요.

- Package Acceptance `resolve_package` summary: source, version, SHA-256, 그리고
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs, rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  baseline version, candidate version, scenario, phase timings, 그리고
  recipe steps 포함.

전체 release umbrella를 다시 실행하는 것보다 동일한 package artifact로 실패한 정확한 lane을
다시 실행하는 것을 선호하세요.
