---
read_when:
    - Gateway Plugin 또는 호환 번들을 설치하거나 관리하려는 경우
    - Plugin 로드 실패를 디버그하려는 경우
sidebarTitle: Plugins
summary: '`openclaw plugins`에 대한 CLI 참조 (list, install, marketplace, uninstall, enable/disable, deps, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-04-30T06:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin, 후크 팩, 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin 시스템" href="/ko/tools/plugin">
    Plugin 설치, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 번들" href="/ko/plugins/bundles">
    번들 호환성 모델입니다.
  </Card>
  <Card title="Plugin 매니페스트" href="/ko/plugins/manifest">
    매니페스트 필드 및 구성 스키마입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security">
    Plugin 설치를 위한 보안 강화입니다.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

느린 설치, 검사, 제거 또는 레지스트리 새로 고침 조사를 위해서는 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`로 명령을 실행하세요. 추적은 단계별 타이밍을 stderr에 기록하며 JSON 출력을 파싱 가능한 상태로 유지합니다. [디버깅](/ko/help/debugging#plugin-lifecycle-trace)을 참조하세요.

<Note>
번들된 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있으며(예: 번들된 모델 공급자, 번들된 음성 공급자, 번들된 브라우저 Plugin), 나머지는 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugin은 인라인 JSON Schema(`configSchema`, 비어 있더라도 포함)가 있는 `openclaw.plugin.json`을 제공해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 목록/정보 출력에는 감지된 번들 기능과 함께 번들 하위 유형(`codex`, `claude`, 또는 `cursor`)도 표시됩니다.
</Note>

### 설치

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
단순 패키지 이름은 먼저 ClawHub에서 확인한 다음 npm에서 확인합니다. Plugin 설치는 코드를 실행하는 것처럼 취급하세요. 고정된 버전을 선호하세요.
</Warning>

<Note>
ClawHub는 대부분 Plugin의 기본 배포 및 검색 표면입니다. Npm은 지원되는 대체 경로이자 직접 설치 경로로 남아 있습니다. ClawHub로 마이그레이션하는 동안 OpenClaw는 일부 OpenClaw 소유 `@openclaw/*` Plugin 패키지를 여전히 npm에 제공합니다. 이러한 패키지 버전은 Plugin 릴리스 트레인 사이에서 번들된 소스보다 뒤처질 수 있습니다. npm이 OpenClaw 소유 Plugin 패키지를 지원 중단으로 보고하는 경우, 해당 게시 버전은 오래된 외부 아티팩트입니다. 더 새로운 npm 패키지가 게시될 때까지 현재 OpenClaw에 번들된 Plugin 또는 로컬 체크아웃을 사용하세요.
</Note>

<AccordionGroup>
  <Accordion title="구성 include 및 잘못된 구성 복구">
    `plugins` 섹션이 단일 파일 `$include`를 기반으로 하는 경우, `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 쓰고 `openclaw.json`은 그대로 둡니다. 루트 include, include 배열, 형제 재정의가 있는 include는 펼치지 않고 닫힌 상태로 실패합니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참조하세요.

    설치 중 구성이 잘못된 경우, `plugins install`은 일반적으로 닫힌 상태로 실패하며 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. Gateway 시작 중에는 한 Plugin의 잘못된 구성이 해당 Plugin에만 격리되어 다른 채널과 Plugin이 계속 실행될 수 있습니다. `openclaw doctor --fix`는 잘못된 Plugin 항목을 격리할 수 있습니다. 문서화된 유일한 설치 시점 예외는 `openclaw.install.allowInvalidConfigRecovery`를 명시적으로 선택한 Plugin을 위한 좁은 범위의 번들 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force 및 재설치와 업데이트">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 후크 팩을 제자리에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub 패키지 또는 npm 아티팩트에서 같은 ID를 의도적으로 다시 설치할 때 사용하세요. 이미 추적 중인 npm Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 선호하세요.

    이미 설치된 Plugin ID에 대해 `plugins install`을 실행하면 OpenClaw는 중지되고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를, 다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우에는 `plugins install <package> --force`를 안내합니다.

  </Accordion>
  <Accordion title="--pin 범위">
    `--pin`은 npm 설치에만 적용됩니다. `--marketplace`와 함께 사용할 수 없습니다. 마켓플레이스 설치는 npm 사양 대신 마켓플레이스 소스 메타데이터를 유지하기 때문입니다.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한 비상 옵션입니다. 내장 스캐너가 `critical` 결과를 보고해도 설치를 계속할 수 있게 하지만, Plugin `before_install` 후크 정책 차단을 우회하지 **않으며** 스캔 실패도 우회하지 **않습니다**.

    이 CLI 플래그는 Plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 Skill 의존성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며, `openclaw skills install`은 별도의 ClawHub Skill 다운로드/설치 흐름으로 남아 있습니다.

    ClawHub에 게시한 Plugin이 레지스트리 스캔에 의해 차단되는 경우, [ClawHub](/ko/tools/clawhub)의 게시자 단계를 사용하세요.

  </Accordion>
  <Accordion title="후크 팩 및 npm 사양">
    `plugins install`은 `package.json`에 `openclaw.hooks`를 노출하는 후크 팩의 설치 표면이기도 합니다. 패키지 설치가 아니라 필터링된 후크 가시성과 후크별 활성화에는 `openclaw hooks`를 사용하세요.

    Npm 사양은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file 사양과 semver 범위는 거부됩니다. 의존성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 `--ignore-scripts`로 프로젝트 로컬에서 실행됩니다.

    ClawHub 조회를 건너뛰고 npm에서 직접 설치하려면 `npm:<package>`를 사용하세요. 단순 패키지 사양은 여전히 ClawHub를 우선하며, ClawHub에 해당 패키지나 버전이 없을 때만 npm으로 폴백합니다.

    단순 사양과 `@latest`는 안정 트랙에 머뭅니다. npm이 둘 중 하나를 프리릴리스로 해석하면 OpenClaw는 중지되고 `@beta`/`@rc` 같은 프리릴리스 태그 또는 `@1.2.3-beta.4` 같은 정확한 프리릴리스 버전으로 명시적으로 선택하라고 요청합니다.

    단순 설치 사양이 번들된 Plugin ID(예: `diffs`)와 일치하면 OpenClaw는 번들된 Plugin을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 명시적 스코프 사양(예: `@scope/diffs`)을 사용하세요.

  </Accordion>
  <Accordion title="아카이브">
    지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin 아카이브는 압축 해제된 Plugin 루트에 유효한 `openclaw.plugin.json`을 포함해야 합니다. `package.json`만 포함하는 아카이브는 OpenClaw가 설치 기록을 쓰기 전에 거부됩니다.

    Claude 마켓플레이스 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적인 `clawhub:<package>` 로케이터를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw는 이제 단순 npm 안전 Plugin 사양에도 ClawHub를 선호합니다. ClawHub에 해당 패키지나 버전이 없는 경우에만 npm으로 폴백합니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

ClawHub에 연결할 수 없거나 패키지가 npm에만 존재한다는 것을 알고 있는 경우처럼 npm 전용 해석을 강제하려면 `npm:`을 사용하세요.

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw는 ClawHub에서 패키지 아카이브를 다운로드하고, 게시된 Plugin API / 최소 Gateway 호환성을 확인한 다음, 일반 아카이브 경로를 통해 설치합니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터를 유지합니다.
버전이 지정되지 않은 ClawHub 설치는 `openclaw plugins update`가 더 새로운 ClawHub 릴리스를 따라갈 수 있도록 버전 없는 기록 사양을 유지합니다. `clawhub:pkg@1.2.3` 및 `clawhub:pkg@beta` 같은 명시적 버전 또는 태그 선택자는 해당 선택자에 고정된 상태로 남습니다.

#### 마켓플레이스 축약형

마켓플레이스 이름이 Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 존재하는 경우 `plugin@marketplace` 축약형을 사용하세요.

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

마켓플레이스 소스를 명시적으로 전달하려면 `--marketplace`를 사용하세요.

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="마켓플레이스 소스">
    - `~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 마켓플레이스 이름
    - 로컬 마켓플레이스 루트 또는 `marketplace.json` 경로
    - `owner/repo` 같은 GitHub 저장소 축약형
    - `https://github.com/owner/repo` 같은 GitHub 저장소 URL
    - git URL

  </Tab>
  <Tab title="원격 마켓플레이스 규칙">
    GitHub 또는 git에서 로드된 원격 마켓플레이스의 경우, Plugin 항목은 복제된 마켓플레이스 저장소 내부에 있어야 합니다. OpenClaw는 해당 저장소의 상대 경로 소스를 허용하며, 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 경로가 아닌 Plugin 소스를 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 아카이브의 경우 OpenClaw는 자동으로 감지합니다.

- 네이티브 OpenClaw Plugin(`openclaw.plugin.json`)
- Codex 호환 번들(`.codex-plugin/plugin.json`)
- Claude 호환 번들(`.claude-plugin/plugin.json` 또는 기본 Claude 구성 요소 레이아웃)
- Cursor 호환 번들(`.cursor-plugin/plugin.json`)

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 같은 목록/정보/활성화/비활성화 흐름에 참여합니다. 현재 번들 skills, Claude 명령 skills, Claude `settings.json` 기본값, Claude `.lsp.json` / 매니페스트 선언 `lspServers` 기본값, Cursor 명령 skills, 호환 Codex 후크 디렉터리가 지원됩니다. 감지된 다른 번들 기능은 진단/정보에 표시되지만 아직 런타임 실행에는 연결되어 있지 않습니다.
</Note>

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  활성화된 Plugin만 표시합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  테이블 보기에서 소스/출처/버전/활성화 메타데이터가 있는 Plugin별 상세 줄로 전환합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  레지스트리 진단을 포함한 기계 판독 가능 인벤토리입니다.
</ParamField>

<Note>
`plugins list`는 먼저 지속 저장된 로컬 Plugin 레지스트리를 읽고, 레지스트리가 없거나 유효하지 않으면 매니페스트 전용 파생 대체값을 사용합니다. Plugin이 설치되어 있고, 활성화되어 있으며, 콜드 스타트업 계획에 표시되는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스의 실시간 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, 훅 정책 또는 `plugins.load.paths`를 변경한 뒤에는 새 `register(api)` 코드나 훅이 실행되기를 기대하기 전에 해당 채널을 제공하는 Gateway를 재시작하세요. 원격/컨테이너 배포에서는 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 자식 프로세스를 재시작하는지 확인하세요.
</Note>

패키징된 Docker 이미지 안에서 번들 Plugin 작업을 하는 경우, Plugin
소스 디렉터리를 `/app/extensions/synology-chat` 같은 일치하는 패키징된 소스
경로 위에 바인드 마운트하세요. OpenClaw는 `/app/dist/extensions/synology-chat`보다 먼저
마운트된 소스 오버레이를 발견합니다. 단순히 복사된 소스
디렉터리는 비활성 상태로 남으므로 일반 패키징 설치는 계속 컴파일된 dist를 사용합니다.

런타임 훅 디버깅:

- `openclaw plugins inspect <id> --json`은 모듈 로드 검사 패스에서 등록된 훅과 진단 정보를 보여줍니다.
- `openclaw gateway status --deep --require-rpc`는 도달 가능한 Gateway, 서비스/프로세스 힌트, 구성 경로, RPC 상태를 확인합니다.
- 번들되지 않은 대화 훅(`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`)에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 디렉터리를 복사하지 않으려면 `--link`를 사용하세요(`plugins.load.paths`에 추가됨).

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
링크된 설치는 관리형 설치 대상 위에 복사하는 대신 소스 경로를 재사용하므로 `--force`는 `--link`와 함께 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 채 유지하면서, 해석된 정확한 스펙(`name@version`)을 관리형 Plugin 인덱스에 저장합니다.
</Note>

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자 구성이 아니라 머신이 관리하는 상태입니다. 설치와 업데이트는 활성 OpenClaw 상태 디렉터리 아래의 `plugins/installs.json`에 이를 씁니다. 최상위 `installRecords` 맵은 손상되었거나 누락된 Plugin 매니페스트의 레코드를 포함해 설치 메타데이터의 지속 소스입니다. `plugins` 배열은 매니페스트에서 파생된 콜드 레지스트리 캐시입니다. 이 파일에는 편집 금지 경고가 포함되어 있으며 `openclaw plugins update`, 제거, 진단, 콜드 Plugin 레지스트리에서 사용됩니다.

OpenClaw가 구성에서 제공된 레거시 `plugins.installs` 레코드를 발견하면 이를 Plugin 인덱스로 옮기고 구성 키를 제거합니다. 쓰기 중 하나라도 실패하면 설치 메타데이터가 손실되지 않도록 구성 레코드를 유지합니다.

### 런타임 의존성

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps`는 Plugin 구성, 활성화/구성된 채널, 구성된 모델 제공자 또는 번들 매니페스트 기본값에 따라 선택된 OpenClaw 소유 번들 Plugin의 패키징된 런타임 의존성 단계를 검사합니다. 이는 서드파티 npm 또는 ClawHub Plugin의 설치/업데이트 경로가 아닙니다.

패키징된 설치가 Gateway 시작 중 또는 `plugins doctor`에서 번들 런타임 의존성이 누락되었다고 보고할 때 `--repair`를 사용하세요. 복구는 활성화된 번들 Plugin의 누락된 의존성만 라이프사이클 스크립트를 비활성화한 상태로 설치합니다. 이전 패키징 레이아웃이 남긴 오래된 알 수 없는 외부 런타임 의존성 루트를 제거하려면 `--prune`을 사용하세요.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 해당되는 경우 `plugins.entries`, 지속 저장된 Plugin 인덱스, Plugin 허용/거부 목록 항목, 연결된 `plugins.load.paths` 항목에서 Plugin 레코드를 제거합니다. `--keep-files`가 설정되지 않은 한, 제거는 추적되는 관리형 설치 디렉터리가 OpenClaw의 Plugin 확장 루트 안에 있을 때 해당 디렉터리도 제거합니다. Active Memory Plugin의 경우 메모리 슬롯이 `memory-core`로 재설정됩니다.

<Note>
`--keep-config`는 `--keep-files`의 더 이상 권장되지 않는 별칭으로 지원됩니다.
</Note>

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 관리형 Plugin 인덱스에서 추적되는 Plugin 설치와 `hooks.internal.installs`에서 추적되는 훅 팩 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin ID와 npm 스펙 해석">
    Plugin ID를 전달하면 OpenClaw는 해당 Plugin에 기록된 설치 스펙을 재사용합니다. 즉, `@beta` 같은 이전에 저장된 dist-tag와 정확히 고정된 버전은 이후 `update <id>` 실행에서도 계속 사용됩니다.

    npm 설치의 경우 dist-tag 또는 정확한 버전이 있는 명시적 npm 패키지 스펙을 전달할 수도 있습니다. OpenClaw는 해당 패키지 이름을 추적되는 Plugin 레코드로 다시 해석하고, 설치된 해당 Plugin을 업데이트하며, 향후 ID 기반 업데이트를 위해 새 npm 스펙을 기록합니다.

    버전이나 태그 없이 npm 패키지 이름을 전달해도 추적되는 Plugin 레코드로 다시 해석됩니다. Plugin이 정확한 버전에 고정되어 있었고 이를 레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

  </Accordion>
  <Accordion title="버전 검사와 무결성 드리프트">
    실시간 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트 ID가 이미 해석된 대상과 일치하면 다운로드, 재설치 또는 `openclaw.json` 재작성 없이 업데이트를 건너뜁니다.

    저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면 OpenClaw는 이를 npm 아티팩트 드리프트로 취급합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 계속하기 전에 확인을 요청합니다. 비대화형 업데이트 헬퍼는 호출자가 명시적인 계속 정책을 제공하지 않으면 닫힌 상태로 실패합니다.

  </Accordion>
  <Accordion title="업데이트에서 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`는 Plugin 업데이트 중 내장 위험 코드 스캔의 오탐을 위한 비상 우회 수단으로 `plugins update`에서도 사용할 수 있습니다. 그래도 Plugin `before_install` 정책 차단이나 스캔 실패 차단은 우회하지 않으며, 훅 팩 업데이트가 아닌 Plugin 업데이트에만 적용됩니다.
  </Accordion>
</AccordionGroup>

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

단일 Plugin에 대한 심층 검사입니다. ID, 로드 상태, 소스, 등록된 기능, 훅, 도구, 명령, 서비스, Gateway 메서드, HTTP 라우트, 정책 플래그, 진단, 설치 메타데이터, 번들 기능, 감지된 MCP 또는 LSP 서버 지원을 보여줍니다.

각 Plugin은 런타임에 실제로 등록하는 내용에 따라 분류됩니다.

- **plain-capability** — 하나의 기능 유형(예: 제공자 전용 Plugin)
- **hybrid-capability** — 여러 기능 유형(예: 텍스트 + 음성 + 이미지)
- **hook-only** — 훅만 있으며 기능이나 표면 없음
- **non-capability** — 도구/명령/서비스가 있지만 기능 없음

기능 모델에 대한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

<Note>
`--json` 플래그는 스크립팅과 감사에 적합한 머신 판독 가능 보고서를 출력합니다. `inspect --all`은 형태, 기능 종류, 호환성 알림, 번들 기능, 훅 요약 열이 포함된 전체 플릿 테이블을 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/발견 진단, 호환성 알림을 보고합니다. 모든 것이 깨끗하면 `No plugin issues detected.`를 출력합니다.

누락된 `register`/`activate` 내보내기 같은 모듈 형태 실패의 경우, 진단 출력에 간결한 내보내기 형태 요약을 포함하려면 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`로 다시 실행하세요.

### 레지스트리

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin 레지스트리는 설치된 Plugin ID, 활성화 상태, 소스 메타데이터, 기여 소유권에 대한 OpenClaw의 지속 저장된 콜드 읽기 모델입니다. 일반 시작, 제공자 소유자 조회, 채널 설정 분류, Plugin 인벤터리는 Plugin 런타임 모듈을 가져오지 않고도 이를 읽을 수 있습니다.

`plugins registry`를 사용해 지속 저장된 레지스트리가 존재하는지, 최신인지, 오래되었는지 검사하세요. 지속 저장된 Plugin 인덱스, 구성 정책, 매니페스트/패키지 메타데이터에서 이를 다시 빌드하려면 `--refresh`를 사용하세요. 이는 복구 경로이지 런타임 활성화 경로가 아닙니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 레지스트리 읽기 실패를 위한 더 이상 권장되지 않는 비상 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 선호하세요. env 대체 경로는 마이그레이션이 배포되는 동안의 긴급 시작 복구에만 사용됩니다.
</Warning>

### 마켓플레이스

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

마켓플레이스 목록은 로컬 마켓플레이스 경로, `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 저장소 URL 또는 git URL을 받습니다. `--json`은 해석된 소스 레이블과 파싱된 마켓플레이스 매니페스트 및 Plugin 항목을 출력합니다.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [CLI 참조](/ko/cli)
- [커뮤니티 Plugin](/ko/plugins/community)
