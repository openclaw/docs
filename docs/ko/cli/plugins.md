---
read_when:
    - Gateway Plugins 또는 호환 번들을 설치하거나 관리하려는 경우
    - Plugin 로드 실패를 디버그하려는 경우
sidebarTitle: Plugins
summary: '`openclaw plugins`에 대한 CLI 참조(목록, 설치, 마켓플레이스, 제거, 활성화/비활성화, doctor)'
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gateway Plugins, hook pack, 그리고 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ko/tools/plugin">
    Plugins 설치, 활성화, 문제 해결을 위한 최종 사용자 가이드.
  </Card>
  <Card title="Plugin bundles" href="/ko/plugins/bundles">
    번들 호환성 모델.
  </Card>
  <Card title="Plugin manifest" href="/ko/plugins/manifest">
    Manifest 필드와 config 스키마.
  </Card>
  <Card title="Security" href="/ko/gateway/security">
    Plugin 설치를 위한 보안 강화.
  </Card>
</CardGroup>

## 명령

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
번들 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화됩니다(예: 번들 모델 provider, 번들 음성 provider, 번들 browser Plugin). 다른 것들은 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugins는 인라인 JSON Schema(`configSchema`, 비어 있어도 포함)를 포함한 `openclaw.plugin.json`을 제공해야 합니다. 호환 번들은 대신 자체 번들 manifest를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 list/info 출력은 번들 하위 유형(`codex`, `claude`, 또는 `cursor`)과 감지된 번들 기능도 표시합니다.
</Note>

### 설치

```bash
openclaw plugins install <package>                      # 먼저 ClawHub, 그다음 npm
openclaw plugins install clawhub:<package>              # ClawHub만
openclaw plugins install <package> --force              # 기존 설치 덮어쓰기
openclaw plugins install <package> --pin                # 버전 고정
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 로컬 경로
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace(명시적)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
이름만 있는 패키지는 먼저 ClawHub에서 확인한 다음 npm에서 확인합니다. Plugin 설치는 코드를 실행하는 것처럼 취급하세요. 가능하면 고정된 버전을 사용하세요.
</Warning>

<AccordionGroup>
  <Accordion title="Config include 및 invalid-config 복구">
    `plugins` 섹션이 단일 파일 `$include`로 백킹되는 경우, `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 직접 기록하고 `openclaw.json`은 건드리지 않습니다. 루트 include, include 배열, 형제 override가 있는 include는 평탄화하지 않고 fail closed합니다. 지원되는 형태는 [Config includes](/ko/gateway/configuration)를 참조하세요.

    config가 유효하지 않으면 `plugins install`은 일반적으로 fail closed하며 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. 문서화된 유일한 예외는 `openclaw.install.allowInvalidConfigRecovery`에 명시적으로 opt-in한 Plugins를 위한 좁은 범위의 번들 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force 및 재설치 vs update">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 hook pack을 제자리에서 덮어씁니다. 새로운 로컬 경로, archive, ClawHub 패키지, 또는 npm artifact에서 동일한 id를 의도적으로 다시 설치할 때 사용하세요. 이미 추적 중인 npm Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하는 것이 좋습니다.

    이미 설치된 Plugin id에 대해 `plugins install`을 실행하면, OpenClaw는 중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를, 다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우에는 `plugins install <package> --force`를 사용하라고 안내합니다.

  </Accordion>
  <Accordion title="--pin 범위">
    `--pin`은 npm 설치에만 적용됩니다. marketplace 설치는 npm spec 대신 marketplace 소스 메타데이터를 유지하므로 `--marketplace`와 함께는 지원되지 않습니다.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 내장된 위험 코드 스캐너의 오탐에 대비한 비상 옵션입니다. 내장 스캐너가 `critical` 결과를 보고하더라도 설치를 계속 진행할 수 있게 하지만, Plugin `before_install` hook 정책 차단을 우회하지는 않으며 스캔 실패도 우회하지 않습니다.

    이 CLI 플래그는 Plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 Skills 종속성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청 override를 사용하며, `openclaw skills install`은 별도의 ClawHub Skills 다운로드/설치 흐름으로 유지됩니다.

  </Accordion>
  <Accordion title="Hook pack 및 npm spec">
    `plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 hook pack의 설치 표면이기도 합니다. 패키지 설치가 아니라 필터링된 hook 가시성과 hook별 활성화에는 `openclaw hooks`를 사용하세요.

    npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 종속성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 프로젝트 로컬에서 `--ignore-scripts`로 실행됩니다.

    이름만 있는 spec과 `@latest`는 안정 트랙에 머뭅니다. npm이 둘 중 하나를 prerelease로 해석하면, OpenClaw는 중단하고 `@beta`/`@rc` 같은 prerelease 태그 또는 `@1.2.3-beta.4` 같은 정확한 prerelease 버전으로 명시적으로 opt-in하라고 요청합니다.

    이름만 있는 설치 spec이 번들 Plugin id와 일치하는 경우(예: `diffs`), OpenClaw는 번들 Plugin을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 명시적인 scope spec(예: `@scope/diffs`)을 사용하세요.

  </Accordion>
  <Accordion title="Archive">
    지원되는 archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin archive는 추출된 Plugin 루트에 유효한 `openclaw.plugin.json`을 포함해야 합니다. `package.json`만 포함한 archive는 OpenClaw가 설치 기록을 쓰기 전에 거부됩니다.

    Claude marketplace 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

이제 OpenClaw는 이름만 있는 npm-safe Plugin spec에 대해서도 ClawHub를 우선 사용합니다. ClawHub에 해당 패키지나 버전이 없을 때만 npm으로 대체됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw는 ClawHub에서 패키지 archive를 다운로드하고, 공지된 Plugin API / 최소 Gateway 호환성을 확인한 뒤, 일반 archive 경로를 통해 설치합니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터를 유지합니다.

#### Marketplace 축약형

marketplace 이름이 Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 존재하면 `plugin@marketplace` 축약형을 사용하세요.

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace 소스를 명시적으로 전달하려면 `--marketplace`를 사용하세요.

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 소스">
    - `~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름
    - 로컬 marketplace 루트 또는 `marketplace.json` 경로
    - `owner/repo` 같은 GitHub 리포지토리 축약형
    - `https://github.com/owner/repo` 같은 GitHub 리포지토리 URL
    - git URL

  </Tab>
  <Tab title="원격 marketplace 규칙">
    GitHub 또는 git에서 로드된 원격 marketplace의 경우, Plugin 항목은 복제된 marketplace 리포지토리 내부에 머물러야 합니다. OpenClaw는 해당 리포지토리의 상대 경로 소스를 허용하고, 원격 manifest의 HTTP(S), 절대 경로, git, GitHub, 기타 비경로 Plugin 소스는 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 archive의 경우, OpenClaw는 다음을 자동 감지합니다.

- 네이티브 OpenClaw Plugins (`openclaw.plugin.json`)
- Codex 호환 번들 (`.codex-plugin/plugin.json`)
- Claude 호환 번들 (`.claude-plugin/plugin.json` 또는 기본 Claude 컴포넌트 레이아웃)
- Cursor 호환 번들 (`.cursor-plugin/plugin.json`)

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 동일한 list/info/enable/disable 흐름에 참여합니다. 현재는 번들 Skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` / manifest 선언 `lspServers` 기본값, Cursor command-skills, 그리고 호환되는 Codex hook 디렉터리가 지원됩니다. 그 외 감지된 번들 기능은 diagnostics/info에는 표시되지만 아직 런타임 실행에 연결되지는 않습니다.
</Note>

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  활성화된 Plugins만 표시합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  표 보기에서 Plugin별 상세 줄 보기로 전환하며, source/origin/version/activation 메타데이터를 표시합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능한 인벤토리와 레지스트리 diagnostics입니다.
</ParamField>

<Note>
`plugins list`는 먼저 영속 저장된 로컬 Plugin 레지스트리를 읽고, 레지스트리가 없거나 유효하지 않을 경우 manifest 전용 파생 대체 경로를 사용합니다. Plugin이 설치, 활성화되어 있고 콜드 시작 계획에 표시되는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스에 대한 라이브 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, hook 정책, 또는 `plugins.load.paths`를 변경한 뒤에는 새로운 `register(api)` 코드나 hook이 실행되기를 기대하기 전에 채널을 제공하는 Gateway를 재시작하세요. 원격/컨테이너 배포에서는 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 자식을 재시작하고 있는지 확인하세요.
</Note>

패키지된 Docker 이미지 내부에서 번들 Plugin 작업을 할 때는, `/app/extensions/synology-chat` 같은 일치하는 패키지 소스 경로 위에 Plugin 소스 디렉터리를 bind-mount하세요. OpenClaw는 `/app/dist/extensions/synology-chat`보다 먼저 그 mounted source overlay를 탐지합니다. 단순히 복사된 소스 디렉터리는 비활성 상태로 남으므로 일반적인 패키지 설치는 계속 컴파일된 dist를 사용합니다.

런타임 hook 디버깅용:

- `openclaw plugins inspect <id> --json`은 모듈 로드 inspection 패스의 등록된 hook과 diagnostics를 보여줍니다.
- `openclaw gateway status --deep --require-rpc`는 도달 가능한 Gateway, 서비스/프로세스 힌트, config 경로, RPC 상태를 확인합니다.
- 번들되지 않은 대화 hook(`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`)은 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 디렉터리를 복사하지 않으려면 `--link`를 사용하세요(`plugins.load.paths`에 추가).

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--link`는 관리되는 설치 대상 위에 복사하는 대신 소스 경로를 재사용하므로 `--force`와 함께는 지원되지 않습니다.

기본 동작은 고정하지 않은 상태로 유지하면서, 해석된 정확한 spec(`name@version`)을 관리 Plugin 인덱스에 저장하려면 npm 설치에서 `--pin`을 사용하세요.
</Note>

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자 config가 아니라 시스템이 관리하는 상태입니다. 설치와 업데이트는 활성 OpenClaw 상태 디렉터리 아래의 `plugins/installs.json`에 이를 기록합니다. 최상위 `installRecords` 맵은 손상되었거나 누락된 Plugin manifest의 기록을 포함한 설치 메타데이터의 영속적인 source of truth입니다. `plugins` 배열은 manifest 기반 콜드 레지스트리 캐시입니다. 이 파일에는 편집 금지 경고가 포함되며 `openclaw plugins update`, 제거, diagnostics, 콜드 Plugin 레지스트리에서 사용됩니다.

OpenClaw가 config에서 기존의 레거시 `plugins.installs` 기록을 발견하면, 이를 Plugin 인덱스로 이동하고 config 키를 제거합니다. 어느 한쪽 쓰기라도 실패하면 설치 메타데이터가 유실되지 않도록 config 기록은 유지됩니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 `plugins.entries`, 영속 Plugin 인덱스, Plugin 허용/거부 목록 항목, 그리고 해당하는 경우 연결된 `plugins.load.paths` 항목에서 Plugin 기록을 제거합니다. `--keep-files`가 설정되지 않으면, 제거는 추적된 관리 설치 디렉터리가 OpenClaw의 Plugin extensions 루트 내부에 있을 때 해당 디렉터리도 함께 제거합니다. Active Memory Plugins의 경우 memory 슬롯은 `memory-core`로 재설정됩니다.

<Note>
`--keep-config`는 더 이상 권장되지 않는 `--keep-files`의 별칭으로 지원됩니다.
</Note>

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 관리 Plugin 인덱스에서 추적되는 Plugin 설치와 `hooks.internal.installs`에서 추적되는 hook-pack 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin id와 npm spec 확인">
    Plugin id를 전달하면 OpenClaw는 해당 Plugin에 대해 기록된 설치 spec을 재사용합니다. 즉 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된 버전이 이후 `update <id>` 실행에서도 계속 사용됩니다.

    npm 설치의 경우, dist-tag 또는 정확한 버전이 포함된 명시적 npm 패키지 spec도 전달할 수 있습니다. OpenClaw는 그 패키지 이름을 추적된 Plugin 기록으로 다시 확인하고, 설치된 해당 Plugin을 업데이트하며, 이후 id 기반 업데이트를 위해 새 npm spec을 기록합니다.

    버전이나 태그 없이 npm 패키지 이름만 전달해도 추적된 Plugin 기록으로 다시 확인됩니다. Plugin이 정확한 버전에 고정되어 있었고 이를 레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

  </Accordion>
  <Accordion title="버전 검사 및 무결성 드리프트">
    실제 npm 업데이트 전에, OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 artifact 식별자가 이미 확인된 대상과 일치하면, 다운로드, 재설치, `openclaw.json` 재기록 없이 업데이트를 건너뜁니다.

    저장된 무결성 해시가 존재하고 가져온 artifact 해시가 변경되면, OpenClaw는 이를 npm artifact 드리프트로 취급합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 계속 진행하기 전에 확인을 요청합니다. 비대화형 업데이트 도우미는 호출자가 명시적인 계속 진행 정책을 제공하지 않으면 fail closed합니다.

  </Accordion>
  <Accordion title="update에서의 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 Plugin 업데이트 중 내장 위험 코드 스캔의 오탐에 대한 비상 override로 `plugins update`에서도 사용할 수 있습니다. 여전히 Plugin `before_install` 정책 차단이나 스캔 실패 차단은 우회하지 않으며, hook-pack 업데이트가 아니라 Plugin 업데이트에만 적용됩니다.
  </Accordion>
</AccordionGroup>

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

단일 Plugin에 대한 심층 검사입니다. 식별 정보, 로드 상태, 소스, 등록된 기능, hook, 도구, 명령, 서비스, Gateway 메서드, HTTP 경로, 정책 플래그, diagnostics, 설치 메타데이터, 번들 기능, 그리고 감지된 MCP 또는 LSP 서버 지원을 보여줍니다.

각 Plugin은 런타임에서 실제로 등록하는 내용에 따라 분류됩니다.

- **plain-capability** — 하나의 capability 유형만 등록(예: provider 전용 Plugin)
- **hybrid-capability** — 여러 capability 유형 등록(예: 텍스트 + 음성 + 이미지)
- **hook-only** — 기능이나 표면 없이 hook만 존재
- **non-capability** — capability 없이 tools/commands/services만 존재

capability 모델에 대한 자세한 내용은 [Plugin shapes](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

<Note>
`--json` 플래그는 스크립팅과 audit에 적합한 기계 판독 가능한 보고서를 출력합니다. `inspect --all`은 shape, capability 종류, 호환성 공지, 번들 기능, hook 요약 열이 포함된 전체 테이블을 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, manifest/discovery diagnostics, 호환성 공지를 보고합니다. 문제가 없으면 `No plugin issues detected.`를 출력합니다.

`register`/`activate` export 누락 같은 모듈 형태 실패의 경우, diagnostic 출력에 간결한 export 형태 요약을 포함하려면 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`로 다시 실행하세요.

### 레지스트리

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin 레지스트리는 설치된 Plugin 식별 정보, 활성화 상태, 소스 메타데이터, 기여 소유권에 대한 OpenClaw의 영속적인 콜드 읽기 모델입니다. 일반 시작, provider 소유자 조회, 채널 설정 분류, Plugin 인벤토리는 Plugin 런타임 모듈을 가져오지 않고도 이를 읽을 수 있습니다.

영속 레지스트리가 존재하는지, 최신인지, 또는 오래되었는지 확인하려면 `plugins registry`를 사용하세요. 영속 Plugin 인덱스, config 정책, manifest/package 메타데이터로부터 다시 빌드하려면 `--refresh`를 사용하세요. 이것은 복구 경로이지 런타임 활성화 경로는 아닙니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 레지스트리 읽기 실패를 위한 더 이상 권장되지 않는 비상 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 사용하는 것이 좋습니다. 이 env 대체 경로는 마이그레이션이 진행되는 동안 긴급 시작 복구용으로만 사용됩니다.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 목록은 로컬 marketplace 경로, `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 리포지토리 URL, 또는 git URL을 받을 수 있습니다. `--json`은 확인된 소스 라벨과 파싱된 marketplace manifest 및 Plugin 항목을 출력합니다.

## 관련 항목

- [Building plugins](/ko/plugins/building-plugins)
- [CLI reference](/ko/cli)
- [Community plugins](/ko/plugins/community)
