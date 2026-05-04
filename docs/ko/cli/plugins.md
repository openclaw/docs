---
read_when:
    - Gateway Plugin 또는 호환 번들을 설치하거나 관리하려는 경우
    - Plugin 로드 실패를 디버그하려는 경우
sidebarTitle: Plugins
summary: '`openclaw plugins`에 대한 CLI 참조(list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugins
x-i18n:
    generated_at: "2026-05-04T06:23:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin, 훅 팩, 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin 시스템" href="/ko/tools/plugin">
    Plugin 설치, 활성화 및 문제 해결을 위한 최종 사용자 가이드.
  </Card>
  <Card title="Plugin 관리" href="/ko/plugins/manage-plugins">
    설치, 목록 보기, 업데이트, 제거, 게시를 위한 빠른 예시.
  </Card>
  <Card title="Plugin 번들" href="/ko/plugins/bundles">
    번들 호환성 모델.
  </Card>
  <Card title="Plugin 매니페스트" href="/ko/plugins/manifest">
    매니페스트 필드와 구성 스키마.
  </Card>
  <Card title="보안" href="/ko/gateway/security">
    Plugin 설치를 위한 보안 강화.
  </Card>
</CardGroup>

## 명령

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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

설치, 검사, 제거 또는 레지스트리 새로 고침이 느린 문제를 조사하려면
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`로 명령을 실행하세요. 이 추적은 단계별 타이밍을
stderr에 기록하고 JSON 출력을 파싱 가능한 상태로 유지합니다. [디버깅](/ko/help/debugging#plugin-lifecycle-trace)을 참고하세요.

<Note>
번들된 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있습니다(예: 번들된 모델 제공자, 번들된 음성 제공자, 번들된 브라우저 Plugin). 나머지는 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugin은 인라인 JSON 스키마(`configSchema`, 비어 있더라도 포함)와 함께 `openclaw.plugin.json`을 제공해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 상세 list/info 출력에는 번들 하위 유형(`codex`, `claude`, 또는 `cursor`)과 감지된 번들 기능도 표시됩니다.
</Note>

### 설치

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
출시 전환 기간에는 접두사가 없는 패키지 이름이 기본적으로 npm에서 설치됩니다. ClawHub에는 `clawhub:<package>`를 사용하세요. Plugin 설치는 코드를 실행하는 것처럼 취급하세요. 고정된 버전을 선호하세요.
</Warning>

`plugins search`는 ClawHub에서 설치 가능한 Plugin 패키지를 조회하고
바로 설치할 수 있는 패키지 이름을 출력합니다. 코드 Plugin 및 번들 Plugin 패키지를 검색하며,
Skills는 검색하지 않습니다. ClawHub Skills에는 `openclaw skills search`를 사용하세요.

<Note>
ClawHub는 대부분의 Plugin에 대한 기본 배포 및 검색 표면입니다. npm은
지원되는 대체 수단이자 직접 설치 경로로 남아 있습니다. OpenClaw 소유
`@openclaw/*` Plugin 패키지는 npm에 다시 게시됩니다. 현재 목록은
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 또는
[Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참고하세요. 안정판 설치는 `latest`를 사용합니다.
베타 채널 설치 및 업데이트는 해당 태그가 있을 때 npm `beta` dist-tag를
우선 사용한 다음 `latest`로 폴백합니다.
</Note>

<AccordionGroup>
  <Accordion title="구성 include 및 잘못된 구성 복구">
    `plugins` 섹션이 단일 파일 `$include`로 뒷받침되는 경우, `plugins install/update/enable/disable/uninstall`은 포함된 해당 파일에 직접 기록하고 `openclaw.json`은 건드리지 않습니다. 루트 include, include 배열, 형제 override가 있는 include는 평탄화하지 않고 안전하게 실패하여 중단됩니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참고하세요.

    설치 중 구성이 잘못된 경우, `plugins install`은 일반적으로 안전하게 실패하여 중단하고 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. Gateway 시작 및 핫 리로드 중에는 잘못된 Plugin 구성도 다른 잘못된 구성과 마찬가지로 안전하게 실패하여 중단됩니다. `openclaw doctor --fix`는 잘못된 Plugin 항목을 격리할 수 있습니다. 문서화된 유일한 설치 시점 예외는 명시적으로 `openclaw.install.allowInvalidConfigRecovery`를 선택한 Plugin을 위한 좁은 범위의 번들된 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force 및 재설치와 업데이트">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 훅 팩을 그 자리에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub 패키지 또는 npm 아티팩트에서 동일한 ID를 의도적으로 재설치할 때 사용하세요. 이미 추적 중인 npm Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 선호하세요.

    이미 설치된 Plugin ID에 대해 `plugins install`을 실행하면 OpenClaw는 중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를 안내하거나, 현재 설치를 다른 소스에서 정말로 덮어쓰려는 경우에는 `plugins install <package> --force`를 안내합니다.

  </Accordion>
  <Accordion title="--pin 범위">
    `--pin`은 npm 설치에만 적용됩니다. `git:` 설치에서는 지원되지 않습니다. 소스를 고정하려면 `git:github.com/acme/plugin@v1.2.3`처럼 명시적인 git ref를 사용하세요. `--marketplace`와 함께 사용할 수 없습니다. 마켓플레이스 설치는 npm 명세 대신 마켓플레이스 소스 메타데이터를 유지하기 때문입니다.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한 비상용 옵션입니다. 내장 스캐너가 `critical` 탐지 결과를 보고해도 설치를 계속할 수 있게 하지만, Plugin `before_install` 훅 정책 차단을 우회하지 **않으며** 스캔 실패도 우회하지 **않습니다**.

    이 CLI 플래그는 Plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 Skills 의존성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청 override를 사용하며, `openclaw skills install`은 별도의 ClawHub Skills 다운로드/설치 흐름으로 남아 있습니다.

    ClawHub에 게시한 Plugin이 레지스트리 스캔으로 차단되면 [ClawHub](/ko/tools/clawhub)의 게시자 단계를 사용하세요.

  </Accordion>
  <Accordion title="훅 팩 및 npm 명세">
    `plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 훅 팩의 설치 진입점이기도 합니다. 패키지 설치가 아니라 필터링된 훅 표시 및 훅별 활성화에는 `openclaw hooks`를 사용하세요.

    npm 명세는 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file 명세와 semver 범위는 거부됩니다. 의존성 설치는 안전을 위해 셸에 전역 npm 설치 설정이 있더라도 `--ignore-scripts`로 프로젝트 로컬에서 실행됩니다.

    npm 해석을 명시적으로 만들고 싶을 때는 `npm:<package>`를 사용하세요. 접두사가 없는 패키지 명세도 출시 전환 기간에는 npm에서 직접 설치됩니다.

    접두사가 없는 명세와 `@latest`는 안정판 트랙에 머무릅니다. `2026.5.3-1` 같은 OpenClaw 날짜 스탬프 수정 버전은 이 검사에서 안정판 릴리스입니다. npm이 둘 중 하나를 사전 릴리스로 해석하면 OpenClaw는 중단하고 `@beta`/`@rc` 같은 사전 릴리스 태그 또는 `@1.2.3-beta.4` 같은 정확한 사전 릴리스 버전으로 명시적으로 선택하라고 요청합니다.

    접두사가 없는 설치 명세가 공식 Plugin ID와 일치하면(예: `diffs`) OpenClaw는 카탈로그 항목을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 명시적인 스코프 명세(예: `@scope/diffs`)를 사용하세요.

  </Accordion>
  <Accordion title="Git 저장소">
    git 저장소에서 직접 설치하려면 `git:<repo>`를 사용하세요. 지원되는 형식에는 `git:github.com/owner/repo`, `git:owner/repo`, 전체 `https://`, `ssh://`, `git://`, `file://`, `git@host:owner/repo.git` 클론 URL이 포함됩니다. 설치 전에 브랜치, 태그 또는 커밋을 체크아웃하려면 `@<ref>` 또는 `#<ref>`를 추가하세요.

    Git 설치는 임시 디렉터리로 클론하고, 요청된 ref가 있으면 체크아웃한 다음, 일반 Plugin 디렉터리 설치기를 사용합니다. 즉 매니페스트 검증, 위험 코드 스캔, 패키지 관리자 설치 작업 및 설치 기록이 npm 설치처럼 동작합니다. 기록된 git 설치에는 소스 URL/ref와 해석된 커밋이 포함되므로 `openclaw plugins update`가 나중에 소스를 다시 해석할 수 있습니다.

    git에서 설치한 후에는 `openclaw plugins inspect <id> --runtime --json`을 사용하여 Gateway 메서드 및 CLI 명령 같은 런타임 등록을 확인하세요. Plugin이 `api.registerCli`로 CLI 루트를 등록했다면 해당 명령을 OpenClaw 루트 CLI를 통해 직접 실행하세요. 예: `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="아카이브">
    지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin 아카이브에는 압축 해제된 Plugin 루트에 유효한 `openclaw.plugin.json`이 있어야 합니다. `package.json`만 포함한 아카이브는 OpenClaw가 설치 기록을 쓰기 전에 거부됩니다.

    Claude 마켓플레이스 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

접두사가 없는 npm-safe Plugin 명세는 출시 전환 기간 동안 기본적으로 npm에서 설치됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 전용 해석을 명시하려면 `npm:`을 사용하세요.

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw는 설치 전에 게시된 Plugin API / 최소 Gateway 호환성을 확인합니다. 선택한 ClawHub 버전이 ClawPack 아티팩트를 게시하면 OpenClaw는 버전이 지정된 npm-pack `.tgz`를 다운로드하고, ClawHub digest 헤더와 아티팩트 digest를 검증한 다음, 일반 아카이브 경로를 통해 설치합니다. ClawPack 메타데이터가 없는 이전 ClawHub 버전은 여전히 레거시 패키지 아카이브 검증 경로를 통해 설치됩니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터, 아티팩트 종류, npm integrity, npm shasum, tarball 이름 및 ClawPack digest 사실을 보관합니다.
버전이 지정되지 않은 ClawHub 설치는 버전이 없는 기록된 명세를 유지하므로 `openclaw plugins update`가 더 새로운 ClawHub 릴리스를 따라갈 수 있습니다. `clawhub:pkg@1.2.3` 및 `clawhub:pkg@beta` 같은 명시적 버전 또는 태그 선택자는 해당 선택자에 고정된 상태로 유지됩니다.

#### 마켓플레이스 축약형

Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 마켓플레이스 이름이 있을 때 `plugin@marketplace` 축약형을 사용하세요.

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
    GitHub 또는 git에서 로드된 원격 마켓플레이스의 경우, Plugin 항목은 복제된 마켓플레이스 저장소 안에 있어야 합니다. OpenClaw는 해당 저장소의 상대 경로 소스를 허용하고, 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 경로가 아닌 Plugin 소스를 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 아카이브의 경우, OpenClaw는 다음을 자동 감지합니다.

- 네이티브 OpenClaw Plugin(`openclaw.plugin.json`)
- Codex 호환 번들(`.codex-plugin/plugin.json`)
- Claude 호환 번들(`.claude-plugin/plugin.json` 또는 기본 Claude 컴포넌트 레이아웃)
- Cursor 호환 번들(`.cursor-plugin/plugin.json`)

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 동일한 목록/정보/활성화/비활성화 흐름에 참여합니다. 현재는 번들 Skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` / 매니페스트에 선언된 `lspServers` 기본값, Cursor command-skills, 호환 Codex 훅 디렉터리가 지원됩니다. 감지된 다른 번들 기능은 진단/정보에 표시되지만 아직 런타임 실행에는 연결되지 않았습니다.
</Note>

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  활성화된 Plugin만 표시합니다.
</ParamField>
<ParamField path="--verbose" type="boolean">
  테이블 보기에서 Plugin별 소스/출처/버전/활성화 메타데이터가 있는 세부 줄로 전환합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능 인벤터리와 레지스트리 진단 및 패키지 의존성 설치 상태입니다.
</ParamField>

<Note>
`plugins list`는 먼저 영구 저장된 로컬 Plugin 레지스트리를 읽고, 레지스트리가 없거나 유효하지 않으면 매니페스트 전용 파생 폴백을 사용합니다. Plugin이 설치되고 활성화되었으며 콜드 스타트업 계획에 표시되는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스의 라이브 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, 훅 정책 또는 `plugins.load.paths`를 변경한 뒤에는 새 `register(api)` 코드 또는 훅이 실행되기를 기대하기 전에 채널을 제공하는 Gateway를 다시 시작하세요. 원격/컨테이너 배포에서는 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 하위 프로세스를 다시 시작하는지 확인하세요.

`plugins list --json`에는 `package.json`의 `dependencies` 및 `optionalDependencies`에서 가져온 각 Plugin의 `dependencyStatus`가 포함됩니다. OpenClaw는 해당 패키지 이름이 Plugin의 일반 Node `node_modules` 조회 경로에 있는지 확인합니다. Plugin 런타임 코드를 가져오거나, 패키지 관리자를 실행하거나, 누락된 의존성을 복구하지 않습니다.
</Note>

`plugins search`는 원격 ClawHub 카탈로그 조회입니다. 로컬 상태를 검사하거나, 구성을 변경하거나, 패키지를 설치하거나, Plugin 런타임 코드를 로드하지 않습니다. 검색 결과에는 ClawHub 패키지 이름, 패밀리, 채널, 버전, 요약 및 `openclaw plugins install clawhub:<package>` 같은 설치 힌트가 포함됩니다.

패키징된 Docker 이미지 안에서 번들 Plugin 작업을 할 때는 `/app/extensions/synology-chat` 같은 일치하는 패키징된 소스 경로 위에 Plugin 소스 디렉터리를 바인드 마운트하세요. OpenClaw는 `/app/dist/extensions/synology-chat`보다 먼저 해당 마운트된 소스 오버레이를 발견합니다. 단순히 복사된 소스 디렉터리는 비활성 상태로 남으므로 일반 패키징 설치는 계속 컴파일된 dist를 사용합니다.

런타임 훅 디버깅의 경우:

- `openclaw plugins inspect <id> --runtime --json`은 모듈 로드 검사 패스에서 등록된 훅과 진단을 표시합니다. 런타임 검사는 의존성을 설치하지 않습니다. 레거시 의존성 상태를 정리하거나 누락된 구성된 다운로드 가능 Plugin을 설치하려면 `openclaw doctor --fix`를 사용하세요.
- `openclaw gateway status --deep --require-rpc`는 연결 가능한 Gateway, 서비스/프로세스 힌트, 구성 경로 및 RPC 상태를 확인합니다.
- 번들되지 않은 대화 훅(`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`)에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 디렉터리 복사를 피하려면 `--link`를 사용하세요(`plugins.load.paths`에 추가됨).

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
링크 설치는 관리되는 설치 대상 위에 복사하는 대신 소스 경로를 재사용하므로 `--force`는 `--link`와 함께 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서, 확인된 정확한 사양(`name@version`)을 관리되는 Plugin 인덱스에 저장합니다.
</Note>

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자 구성이 아니라 기계가 관리하는 상태입니다. 설치 및 업데이트는 활성 OpenClaw 상태 디렉터리 아래의 `plugins/installs.json`에 이를 기록합니다. 최상위 `installRecords` 맵은 손상되었거나 누락된 Plugin 매니페스트의 기록을 포함해 설치 메타데이터의 지속적인 원본입니다. `plugins` 배열은 매니페스트에서 파생된 콜드 레지스트리 캐시입니다. 이 파일에는 편집 금지 경고가 포함되어 있으며 `openclaw plugins update`, 제거, 진단 및 콜드 Plugin 레지스트리에서 사용됩니다.

OpenClaw가 구성에서 제공된 레거시 `plugins.installs` 레코드를 발견하면, 이를 Plugin 인덱스로 이동하고 구성 키를 제거합니다. 어느 한쪽 쓰기가 실패하면 설치 메타데이터가 손실되지 않도록 구성 레코드를 유지합니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 해당하는 경우 `plugins.entries`, 영구 저장된 Plugin 인덱스, Plugin 허용/거부 목록 항목 및 연결된 `plugins.load.paths` 항목에서 Plugin 레코드를 제거합니다. `--keep-files`가 설정되지 않은 한, 제거는 OpenClaw의 Plugin 확장 루트 안에 있는 추적된 관리 설치 디렉터리도 제거합니다. Active Memory Plugin의 경우 메모리 슬롯이 `memory-core`로 재설정됩니다.

<Note>
`--keep-config`는 `--keep-files`의 더 이상 권장되지 않는 별칭으로 지원됩니다.
</Note>

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 관리되는 Plugin 인덱스의 추적된 Plugin 설치와 `hooks.internal.installs`의 추적된 훅 팩 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin ID와 npm 사양 해석">
    Plugin ID를 전달하면 OpenClaw는 해당 Plugin에 기록된 설치 사양을 재사용합니다. 즉, `@beta` 같은 이전에 저장된 dist-tag와 정확히 고정된 버전이 이후 `update <id>` 실행에서도 계속 사용됩니다.

    npm 설치의 경우 dist-tag 또는 정확한 버전이 포함된 명시적인 npm 패키지 사양을 전달할 수도 있습니다. OpenClaw는 해당 패키지 이름을 추적된 Plugin 레코드로 다시 해석하고, 설치된 해당 Plugin을 업데이트하며, 향후 ID 기반 업데이트를 위해 새 npm 사양을 기록합니다.

    버전 또는 태그 없이 npm 패키지 이름을 전달해도 추적된 Plugin 레코드로 다시 해석됩니다. Plugin이 정확한 버전으로 고정되어 있었고 이를 레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

  </Accordion>
  <Accordion title="베타 채널 업데이트">
    `openclaw plugins update`는 새 사양을 전달하지 않는 한 추적된 Plugin 사양을 재사용합니다. `openclaw update`는 추가로 활성 OpenClaw 업데이트 채널을 알고 있습니다. 베타 채널에서는 기본 라인의 npm 및 ClawHub Plugin 레코드가 먼저 `@beta`를 시도한 다음, Plugin 베타 릴리스가 없으면 기록된 default/latest 사양으로 폴백합니다. 정확한 버전과 명시적 태그는 해당 선택자에 계속 고정됩니다.

  </Accordion>
  <Accordion title="버전 확인 및 무결성 드리프트">
    라이브 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트 ID가 이미 확인된 대상과 일치하면 다운로드, 재설치 또는 `openclaw.json` 재작성 없이 업데이트를 건너뜁니다.

    저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면 OpenClaw는 이를 npm 아티팩트 드리프트로 처리합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 진행하기 전에 확인을 요청합니다. 비대화형 업데이트 헬퍼는 호출자가 명시적인 계속 정책을 제공하지 않는 한 닫힌 상태로 실패합니다.

  </Accordion>
  <Accordion title="업데이트에서 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 Plugin 업데이트 중 내장 위험 코드 스캔의 오탐에 대한 비상 우회로 `plugins update`에서도 사용할 수 있습니다. 그래도 Plugin `before_install` 정책 차단 또는 스캔 실패 차단은 우회하지 않으며, 훅 팩 업데이트가 아니라 Plugin 업데이트에만 적용됩니다.
  </Accordion>
</AccordionGroup>

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

검사는 기본적으로 Plugin 런타임을 가져오지 않고 ID, 로드 상태, 소스, 매니페스트 기능, 정책 플래그, 진단, 설치 메타데이터, 번들 기능 및 감지된 MCP 또는 LSP 서버 지원을 표시합니다. Plugin 모듈을 로드하고 등록된 훅, 도구, 명령, 서비스, Gateway 메서드 및 HTTP 라우트를 포함하려면 `--runtime`을 추가하세요. 런타임 검사는 누락된 Plugin 의존성을 직접 보고합니다. 설치와 복구는 `openclaw plugins install`, `openclaw plugins update`, `openclaw doctor --fix`에 남아 있습니다.

Plugin 소유 CLI 명령은 루트 `openclaw` 명령 그룹으로 설치됩니다. `inspect --runtime`이 `cliCommands` 아래에 명령을 표시한 뒤에는 `openclaw <command> ...`로 실행하세요. 예를 들어 `demo-git`를 등록하는 Plugin은 `openclaw demo-git ping`으로 확인할 수 있습니다.

각 Plugin은 런타임에 실제로 등록하는 항목에 따라 분류됩니다.

- **plain-capability** — 하나의 기능 유형(예: provider 전용 Plugin)
- **hybrid-capability** — 여러 기능 유형(예: 텍스트 + 음성 + 이미지)
- **hook-only** — 훅만 있고 기능 또는 표면 없음
- **non-capability** — 도구/명령/서비스가 있지만 기능 없음

기능 모델에 대한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

<Note>
`--json` 플래그는 스크립팅 및 감사에 적합한 기계 판독 가능 보고서를 출력합니다. `inspect --all`은 형태, 기능 종류, 호환성 알림, 번들 기능 및 훅 요약 열이 있는 전체 플릿 테이블을 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/발견 진단 및 호환성 알림을 보고합니다. 모든 것이 깨끗하면 `No plugin issues detected.`를 출력합니다.

구성된 Plugin이 디스크에 있지만 로더의 경로 안전 검사에 의해 차단된 경우, 구성 검증은 Plugin 항목을 유지하고 이를 `present but blocked`로 보고합니다. `plugins.entries.<id>` 또는 `plugins.allow` 구성을 제거하지 말고, 경로 소유권 또는 전역 쓰기 가능 권한 같은 앞선 차단된 Plugin 진단을 수정하세요.

`register`/`activate` 내보내기 누락 같은 모듈 형태 실패의 경우, 진단 출력에 간결한 내보내기 형태 요약을 포함하려면 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`로 다시 실행하세요.

### 레지스트리

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin 레지스트리는 설치된 Plugin ID, 활성화 상태, 소스 메타데이터 및 기여 소유권에 대한 OpenClaw의 영구 저장된 콜드 읽기 모델입니다. 일반 시작, provider 소유자 조회, 채널 설정 분류 및 Plugin 인벤터리는 Plugin 런타임 모듈을 가져오지 않고 이를 읽을 수 있습니다.

`plugins registry`를 사용하여 영구 저장된 레지스트리가 있는지, 최신 상태인지, 오래되었는지 검사하세요. `--refresh`를 사용하여 영구 저장된 Plugin 인덱스, 구성 정책, 매니페스트/패키지 메타데이터에서 다시 빌드하세요. 이는 복구 경로이며, 런타임 활성화 경로가 아닙니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 레지스트리 읽기 실패에 대한 더 이상 권장되지 않는 비상 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 사용하는 것이 좋습니다. 환경 변수 대체 방식은 마이그레이션이 배포되는 동안 긴급 시작 복구용으로만 사용하세요.
</Warning>

### 마켓플레이스

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

마켓플레이스 목록은 로컬 마켓플레이스 경로, `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약 표기, GitHub 리포지토리 URL 또는 git URL을 허용합니다. `--json`은 확인된 소스 레이블과 파싱된 마켓플레이스 매니페스트 및 Plugin 항목을 출력합니다.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins)
- [CLI 참조](/ko/cli)
- [커뮤니티 Plugin](/ko/plugins/community)
