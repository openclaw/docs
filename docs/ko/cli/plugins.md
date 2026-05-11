---
read_when:
    - Gateway Plugin 또는 호환 번들을 설치하거나 관리하려는 경우
    - Plugin 로드 실패를 디버그하려는 경우
sidebarTitle: Plugins
summary: '`openclaw plugins`용 CLI 참조(list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-11T20:27:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin, 훅 팩, 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin 시스템" href="/ko/tools/plugin">
    Plugin 설치, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 관리" href="/ko/plugins/manage-plugins">
    설치, 목록, 업데이트, 제거, 게시에 대한 빠른 예시입니다.
  </Card>
  <Card title="Plugin 번들" href="/ko/plugins/bundles">
    번들 호환성 모델입니다.
  </Card>
  <Card title="Plugin 매니페스트" href="/ko/plugins/manifest">
    매니페스트 필드와 구성 스키마입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security">
    Plugin 설치를 위한 보안 강화입니다.
  </Card>
</CardGroup>

## 명령어

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

느린 설치, 검사, 제거 또는 레지스트리 새로 고침 조사를 위해서는
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`로 명령을 실행하세요. 추적은 단계별 타이밍을
stderr에 기록하고 JSON 출력을 파싱 가능하게 유지합니다. [디버깅](/ko/help/debugging#plugin-lifecycle-trace)을 참조하세요.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 Plugin 수명 주기 변경 작업이 비활성화됩니다. 이 설치에는 `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, `plugins disable` 대신 Nix 소스를 사용하세요. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.
</Note>

<Note>
번들 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있으며(예: 번들 모델 제공자, 번들 음성 제공자, 번들 브라우저 Plugin), 나머지는 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugin은 인라인 JSON Schema(`configSchema`, 비어 있어도 필요)가 포함된 `openclaw.plugin.json`을 함께 제공해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 목록/정보 출력에는 번들 하위 유형(`codex`, `claude`, `cursor`)과 감지된 번들 기능도 표시됩니다.
</Note>

### 설치

```bash
openclaw plugins search "calendar"                   # ClawHub Plugin 검색
openclaw plugins install <package>                      # 기본값은 npm
openclaw plugins install clawhub:<package>              # ClawHub만
openclaw plugins install npm:<package>                  # npm만
openclaw plugins install npm-pack:<path.tgz>            # npm install 의미 체계를 통한 로컬 npm pack
openclaw plugins install git:github.com/<owner>/<repo>  # git 저장소
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # 기존 설치 덮어쓰기
openclaw plugins install <package> --pin                # 버전 고정
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 로컬 경로
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (명시적)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

설정 시점 설치를 테스트하는 유지관리자는 보호된 환경 변수로 자동 Plugin 설치
소스를 재정의할 수 있습니다.
[Plugin 설치 재정의](/ko/plugins/install-overrides)를 참조하세요.

<Warning>
출시 전환 기간에는 패키지 이름만 지정하면 기본적으로 npm에서 설치됩니다. ClawHub에는 `clawhub:<package>`를 사용하세요. Plugin 설치는 코드 실행처럼 취급하세요. 고정된 버전을 선호하세요.
</Warning>

`plugins search`는 ClawHub에서 설치 가능한 Plugin 패키지를 조회하고
설치 준비가 된 패키지 이름을 출력합니다. 코드 Plugin 및 번들 Plugin 패키지를 검색하며,
Skills는 검색하지 않습니다. ClawHub Skills에는 `openclaw skills search`를 사용하세요.

<Note>
ClawHub는 대부분 Plugin의 기본 배포 및 검색 표면입니다. Npm은 지원되는
대체 경로이자 직접 설치 경로로 남아 있습니다. OpenClaw 소유의
`@openclaw/*` Plugin 패키지는 npm에 다시 게시됩니다. 현재 목록은
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 또는
[Plugin 인벤토리](/ko/plugins/plugin-inventory)에서 확인하세요. 안정 설치는 `latest`를 사용합니다.
베타 채널 설치와 업데이트는 해당 태그가 있으면 npm `beta` dist-tag를 우선 사용하고,
그다음 `latest`로 대체합니다.
</Note>

<AccordionGroup>
  <Accordion title="구성 include 및 잘못된 구성 복구">
    `plugins` 섹션이 단일 파일 `$include`로 뒷받침되는 경우, `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 직접 쓰고 `openclaw.json`은 변경하지 않습니다. 루트 include, include 배열, 형제 재정의가 있는 include는 평탄화하는 대신 실패 시 닫힌 상태로 처리됩니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참조하세요.

    설치 중 구성이 잘못된 경우, `plugins install`은 일반적으로 실패 시 닫힌 상태로 처리하고 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. Gateway 시작 및 핫 리로드 중에는 잘못된 Plugin 구성이 다른 잘못된 구성과 마찬가지로 실패 시 닫힌 상태로 처리됩니다. `openclaw doctor --fix`는 잘못된 Plugin 항목을 격리할 수 있습니다. 문서화된 유일한 설치 시점 예외는 `openclaw.install.allowInvalidConfigRecovery`를 명시적으로 선택한 Plugin을 위한 좁은 범위의 번들 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force 및 재설치와 업데이트">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 훅 팩을 제자리에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub 패키지 또는 npm 아티팩트에서 동일한 id를 의도적으로 재설치할 때 사용하세요. 이미 추적 중인 npm Plugin의 일반 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 선호하세요.

    이미 설치된 Plugin id에 대해 `plugins install`을 실행하면 OpenClaw는 중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를, 다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우에는 `plugins install <package> --force`를 안내합니다.

  </Accordion>
  <Accordion title="--pin 범위">
    `--pin`은 npm 설치에만 적용됩니다. `git:` 설치에서는 지원되지 않습니다. 고정된 소스를 원할 때는 `git:github.com/acme/plugin@v1.2.3`처럼 명시적 git ref를 사용하세요. `--marketplace`와도 함께 지원되지 않습니다. marketplace 설치는 npm spec 대신 marketplace 소스 메타데이터를 유지하기 때문입니다.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한 비상 옵션입니다. 내장 스캐너가 `critical` 결과를 보고해도 설치를 계속할 수 있게 하지만, Plugin `before_install` 훅 정책 차단을 우회하지 **않으며** 스캔 실패도 우회하지 **않습니다**.

    이 CLI 플래그는 Plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 Skill 의존성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며, `openclaw skills install`은 별도의 ClawHub Skill 다운로드/설치 흐름으로 유지됩니다.

    ClawHub에 게시한 Plugin이 레지스트리 스캔으로 차단된 경우, [ClawHub](/ko/clawhub/security)의 게시자 단계를 사용하세요.

  </Accordion>
  <Accordion title="훅 팩 및 npm specs">
    `plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 훅 팩의 설치 표면이기도 합니다. 패키지 설치가 아니라 필터링된 훅 표시와 훅별 활성화에는 `openclaw hooks`를 사용하세요.

    Npm specs는 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file specs와 semver 범위는 거부됩니다. 의존성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 `--ignore-scripts`와 함께 프로젝트 로컬에서 실행됩니다. 관리형 Plugin npm 루트는 OpenClaw의 패키지 수준 npm `overrides`를 상속하므로, 호스트 보안 pin은 호이스트된 Plugin 의존성에도 적용됩니다.

    npm 해석을 명시적으로 만들고 싶다면 `npm:<package>`를 사용하세요. 출시 전환 기간에는 bare 패키지 specs도 npm에서 직접 설치됩니다.

    Bare specs와 `@latest`는 안정 트랙에 남습니다. `2026.5.3-1` 같은 OpenClaw 날짜 스탬프 보정 버전은 이 검사에서 안정 릴리스입니다. npm이 이 중 하나를 prerelease로 해석하면 OpenClaw는 중단하고 `@beta`/`@rc` 같은 prerelease 태그 또는 `@1.2.3-beta.4` 같은 정확한 prerelease 버전으로 명시적으로 선택하라고 요청합니다.

    bare 설치 spec이 공식 Plugin id(예: `diffs`)와 일치하면 OpenClaw는 카탈로그 항목을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 명시적인 scoped spec(예: `@scope/diffs`)을 사용하세요.

  </Accordion>
  <Accordion title="Git 저장소">
    git 저장소에서 직접 설치하려면 `git:<repo>`를 사용하세요. 지원되는 형식에는 `git:github.com/owner/repo`, `git:owner/repo`, 전체 `https://`, `ssh://`, `git://`, `file://`, `git@host:owner/repo.git` 클론 URL이 포함됩니다. 설치 전에 브랜치, 태그 또는 커밋을 체크아웃하려면 `@<ref>` 또는 `#<ref>`를 추가하세요.

    Git 설치는 임시 디렉터리로 클론하고, 요청된 ref가 있으면 체크아웃한 다음 일반 Plugin 디렉터리 설치 프로그램을 사용합니다. 즉, 매니페스트 검증, 위험 코드 스캔, 패키지 관리자 설치 작업, 설치 기록이 npm 설치처럼 동작합니다. 기록된 git 설치에는 소스 URL/ref와 해석된 커밋이 포함되므로 `openclaw plugins update`가 나중에 소스를 다시 해석할 수 있습니다.

    git에서 설치한 후에는 `openclaw plugins inspect <id> --runtime --json`을 사용하여 Gateway 메서드 및 CLI 명령 같은 런타임 등록을 확인하세요. Plugin이 `api.registerCli`로 CLI 루트를 등록했다면, 예를 들어 `openclaw demo-plugin ping`처럼 OpenClaw 루트 CLI를 통해 해당 명령을 직접 실행하세요.

  </Accordion>
  <Accordion title="아카이브">
    지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin 아카이브는 압축 해제된 Plugin 루트에 유효한 `openclaw.plugin.json`을 포함해야 합니다. `package.json`만 포함된 아카이브는 OpenClaw가 설치 기록을 쓰기 전에 거부됩니다.

    파일이 npm-pack tarball이고 레지스트리 설치에서 사용하는 것과 동일한 관리형 npm 루트 설치 경로를
    테스트하려면 `npm-pack:<path.tgz>`를 사용하세요.
    여기에는 `package-lock.json` 검증, 호이스트된 의존성 스캔,
    npm 설치 기록이 포함됩니다. 일반 아카이브 경로는 여전히 Plugin extensions 루트 아래에
    로컬 아카이브로 설치됩니다.

    Claude marketplace 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

출시 전환 기간에는 bare npm-safe Plugin specs가 기본적으로 npm에서 설치됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 전용 해석을 명시하려면 `npm:`을 사용하세요.

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw는 설치 전에 공지된 Plugin API / 최소 Gateway 호환성을 확인합니다. 선택한 ClawHub 버전이 ClawPack 아티팩트를 게시하면, OpenClaw는 버전 지정된 npm-pack `.tgz`를 다운로드하고 ClawHub 다이제스트 헤더와 아티팩트 다이제스트를 검증한 다음, 일반 아카이브 경로를 통해 설치합니다. ClawPack 메타데이터가 없는 이전 ClawHub 버전은 여전히 레거시 패키지 아카이브 검증 경로를 통해 설치됩니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터, 아티팩트 종류, npm 무결성, npm shasum, tarball 이름, ClawPack 다이제스트 정보를 유지합니다.
버전 미지정 ClawHub 설치는 버전 미지정 기록 사양을 유지하므로 `openclaw plugins update`가 최신 ClawHub 릴리스를 따라갈 수 있습니다. `clawhub:pkg@1.2.3` 및 `clawhub:pkg@beta` 같은 명시적 버전 또는 태그 선택자는 해당 선택자에 계속 고정됩니다.

#### Marketplace 축약형

Marketplace 이름이 Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 있을 때 `plugin@marketplace` 축약형을 사용하세요.

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace 소스를 명시적으로 전달하려면 `--marketplace`를 사용하세요.

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 소스">
    - `~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 marketplace 이름
    - 로컬 marketplace 루트 또는 `marketplace.json` 경로
    - `owner/repo` 같은 GitHub 리포지토리 축약형
    - `https://github.com/owner/repo` 같은 GitHub 리포지토리 URL
    - git URL

  </Tab>
  <Tab title="원격 marketplace 규칙">
    GitHub 또는 git에서 로드된 원격 marketplace의 경우, Plugin 항목은 클론된 marketplace 리포지토리 내부에 있어야 합니다. OpenClaw는 해당 리포지토리의 상대 경로 소스를 허용하고, 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 경로가 아닌 Plugin 소스를 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 아카이브의 경우 OpenClaw가 다음을 자동 감지합니다.

- 네이티브 OpenClaw Plugin(`openclaw.plugin.json`)
- Codex 호환 번들(`.codex-plugin/plugin.json`)
- Claude 호환 번들(`.claude-plugin/plugin.json` 또는 기본 Claude 컴포넌트 레이아웃)
- Cursor 호환 번들(`.cursor-plugin/plugin.json`)

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 동일한 목록/정보/활성화/비활성화 흐름에 참여합니다. 현재는 번들 skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` / 매니페스트 선언 `lspServers` 기본값, Cursor command-skills, 호환 Codex hook 디렉터리가 지원됩니다. 그 밖에 감지된 번들 기능은 진단/정보에 표시되지만 아직 런타임 실행에는 연결되지 않았습니다.
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
  테이블 보기에서 소스/출처/버전/활성화 메타데이터가 포함된 Plugin별 상세 줄로 전환합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계 판독 가능 인벤터리와 레지스트리 진단 및 패키지 의존성 설치 상태입니다.
</ParamField>

<Note>
`plugins list`는 먼저 지속 저장된 로컬 Plugin 레지스트리를 읽고, 레지스트리가 없거나 유효하지 않으면 매니페스트만으로 파생한 폴백을 사용합니다. Plugin이 설치되어 있고, 활성화되어 있으며, 콜드 스타트업 계획에 보이는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스의 라이브 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, hook 정책 또는 `plugins.load.paths`를 변경한 뒤에는 새 `register(api)` 코드나 hook이 실행될 것으로 기대하기 전에 해당 채널을 제공하는 Gateway를 다시 시작하세요. 원격/컨테이너 배포의 경우, 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 하위 프로세스를 다시 시작하고 있는지 확인하세요.

`plugins list --json`에는 각 Plugin의 `package.json` `dependencies` 및 `optionalDependencies`에서 가져온 `dependencyStatus`가 포함됩니다. OpenClaw는 해당 패키지 이름이 Plugin의 일반 Node `node_modules` 조회 경로에 있는지 확인합니다. Plugin 런타임 코드를 가져오거나, 패키지 매니저를 실행하거나, 누락된 의존성을 복구하지는 않습니다.
</Note>

`plugins search`는 원격 ClawHub 카탈로그 조회입니다. 로컬 상태를 검사하거나, 구성을 변경하거나, 패키지를 설치하거나, Plugin 런타임 코드를 로드하지 않습니다. 검색 결과에는 ClawHub 패키지 이름, 제품군, 채널, 버전, 요약, 그리고 `openclaw plugins install clawhub:<package>` 같은 설치 힌트가 포함됩니다.

패키징된 Docker 이미지 내부에서 번들 Plugin 작업을 할 때는 Plugin 소스 디렉터리를 `/app/extensions/synology-chat` 같은 일치하는 패키징된 소스 경로 위에 bind-mount하세요. OpenClaw는 `/app/dist/extensions/synology-chat`보다 먼저 해당 마운트된 소스 오버레이를 발견합니다. 단순히 복사한 소스 디렉터리는 비활성이므로 일반 패키징 설치는 계속 컴파일된 dist를 사용합니다.

런타임 hook 디버깅의 경우:

- `openclaw plugins inspect <id> --runtime --json`은 모듈 로드 검사 패스에서 등록된 hook과 진단을 표시합니다. 런타임 검사는 의존성을 설치하지 않습니다. 레거시 의존성 상태를 정리하거나 구성에서 참조하는 누락된 다운로드 가능 Plugin을 복구하려면 `openclaw doctor --fix`를 사용하세요.
- `openclaw gateway status --deep --require-rpc`는 도달 가능한 Gateway, 서비스/프로세스 힌트, 구성 경로, RPC 상태를 확인합니다.
- 번들되지 않은 대화 hook(`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`)에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 디렉터리 복사를 피하려면 `--link`를 사용하세요(`plugins.load.paths`에 추가됨).

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
링크 설치는 관리형 설치 대상 위에 복사하는 대신 소스 경로를 재사용하므로 `--force`는 `--link`와 함께 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서, 확인된 정확한 사양(`name@version`)을 관리형 Plugin 인덱스에 저장합니다.
</Note>

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자가 설정하는 구성이 아니라 기계가 관리하는 상태입니다. 설치와 업데이트는 활성 OpenClaw 상태 디렉터리 아래의 `plugins/installs.json`에 이를 기록합니다. 최상위 `installRecords` 맵은 손상되었거나 누락된 Plugin 매니페스트의 기록을 포함해 설치 메타데이터의 지속 가능한 원본입니다. `plugins` 배열은 매니페스트에서 파생한 콜드 레지스트리 캐시입니다. 이 파일에는 편집 금지 경고가 포함되며 `openclaw plugins update`, 제거, 진단, 콜드 Plugin 레지스트리에서 사용됩니다.

OpenClaw가 구성에서 제공된 레거시 `plugins.installs` 기록을 발견하면, 런타임 읽기는 `openclaw.json`을 다시 쓰지 않고 이를 호환성 입력으로 취급합니다. 명시적 Plugin 쓰기와 `openclaw doctor --fix`는 구성 쓰기가 허용될 때 이러한 기록을 Plugin 인덱스로 이동하고 구성 키를 제거합니다. 둘 중 하나의 쓰기가 실패하면 설치 메타데이터가 손실되지 않도록 구성 기록을 유지합니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 `plugins.entries`, 지속 저장된 Plugin 인덱스, Plugin 허용/거부 목록 항목, 그리고 해당되는 경우 링크된 `plugins.load.paths` 항목에서 Plugin 기록을 제거합니다. `--keep-files`가 설정되지 않은 한, 제거는 추적된 관리형 설치 디렉터리가 OpenClaw의 Plugin extensions 루트 내부에 있을 때 해당 디렉터리도 제거합니다. Active Memory Plugin의 경우, 메모리 슬롯이 `memory-core`로 재설정됩니다.

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

업데이트는 관리형 Plugin 인덱스의 추적된 Plugin 설치와 `hooks.internal.installs`의 추적된 hook-pack 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin ID와 npm 사양 확인">
    Plugin ID를 전달하면 OpenClaw는 해당 Plugin에 대해 기록된 설치 사양을 재사용합니다. 즉 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된 버전은 이후 `update <id>` 실행에서도 계속 사용됩니다.

    npm 설치의 경우, dist-tag 또는 정확한 버전이 포함된 명시적 npm 패키지 사양도 전달할 수 있습니다. OpenClaw는 해당 패키지 이름을 추적된 Plugin 기록으로 다시 확인하고, 설치된 해당 Plugin을 업데이트하며, 이후 ID 기반 업데이트를 위해 새 npm 사양을 기록합니다.

    버전이나 태그 없이 npm 패키지 이름을 전달해도 추적된 Plugin 기록으로 다시 확인됩니다. Plugin이 정확한 버전에 고정되어 있었고 이를 레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

  </Accordion>
  <Accordion title="베타 채널 업데이트">
    `openclaw plugins update`는 새 사양을 전달하지 않는 한 추적된 Plugin 사양을 재사용합니다. `openclaw update`는 추가로 활성 OpenClaw 업데이트 채널을 알고 있습니다. 베타 채널에서는 기본 라인 npm 및 ClawHub Plugin 기록이 먼저 `@beta`를 시도한 뒤, Plugin 베타 릴리스가 없으면 기록된 기본/latest 사양으로 폴백합니다. 해당 폴백은 경고로 보고되며 코어 업데이트를 실패시키지 않습니다. 정확한 버전과 명시적 태그는 해당 선택자에 계속 고정됩니다.

  </Accordion>
  <Accordion title="버전 검사와 무결성 변동">
    라이브 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트 ID가 이미 확인된 대상과 일치하면, 업데이트는 다운로드, 재설치 또는 `openclaw.json` 재작성 없이 건너뜁니다.

    저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면, OpenClaw는 이를 npm 아티팩트 변동으로 취급합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 계속하기 전에 확인을 요청합니다. 비대화형 업데이트 헬퍼는 호출자가 명시적 계속 정책을 제공하지 않는 한 닫힌 상태로 실패합니다.

  </Accordion>
  <Accordion title="업데이트에서 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 Plugin 업데이트 중 내장 위험 코드 스캔의 오탐에 대한 비상 우회로 `plugins update`에서도 사용할 수 있습니다. 그래도 Plugin `before_install` 정책 차단이나 스캔 실패 차단은 우회하지 않으며, hook-pack 업데이트가 아니라 Plugin 업데이트에만 적용됩니다.
  </Accordion>
</AccordionGroup>

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect는 기본적으로 Plugin 런타임을 가져오지 않고 ID, 로드 상태, 소스, 매니페스트 기능, 정책 플래그, 진단, 설치 메타데이터, 번들 기능, 그리고 감지된 MCP 또는 LSP 서버 지원을 표시합니다. `--runtime`을 추가하면 Plugin 모듈을 로드하고 등록된 hook, 도구, 명령, 서비스, Gateway 메서드, HTTP 라우트를 포함합니다. 런타임 검사는 누락된 Plugin 의존성을 직접 보고합니다. 설치와 복구는 `openclaw plugins install`, `openclaw plugins update`, `openclaw doctor --fix`에 남아 있습니다.

Plugin 소유 CLI 명령은 보통 루트 `openclaw` 명령 그룹으로 설치되지만, Plugin은 `openclaw nodes` 같은 코어 부모 아래에 중첩 명령을 등록할 수도 있습니다. `inspect --runtime`이 `cliCommands` 아래에 명령을 표시한 뒤에는 나열된 경로에서 실행하세요. 예를 들어 `demo-git`을 등록하는 Plugin은 `openclaw demo-git ping`으로 확인할 수 있습니다.

각 Plugin은 런타임에서 실제로 등록하는 항목에 따라 분류됩니다.

- **plain-capability** — 하나의 capability 유형(예: provider 전용 Plugin)
- **hybrid-capability** — 여러 capability 유형(예: 텍스트 + 음성 + 이미지)
- **hook-only** — 훅만 포함하고 capability나 surface는 없음
- **non-capability** — 도구/명령/서비스는 있지만 capability는 없음

capability 모델에 대한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

<Note>
`--json` 플래그는 스크립팅과 감사에 적합한 기계 판독 가능 보고서를 출력합니다. `inspect --all`은 shape, capability 종류, 호환성 알림, 번들 capability, 훅 요약 열이 포함된 전체 플릿 테이블을 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/검색 진단, 호환성 알림을 보고합니다. 모든 것이 정상일 때는 `No plugin issues detected.`를 출력합니다.

구성된 Plugin이 디스크에 있지만 로더의 경로 안전성 검사에 의해 차단된 경우, 구성 검증은 Plugin 항목을 유지하고 `present but blocked`로 보고합니다. `plugins.entries.<id>` 또는 `plugins.allow` 구성을 제거하는 대신, 경로 소유권이나 world-writable 권한 같은 앞선 차단된 Plugin 진단을 수정하세요.

`register`/`activate` 내보내기 누락 같은 모듈 형태 실패의 경우, `OPENCLAW_PLUGIN_LOAD_DEBUG=1`로 다시 실행하여 진단 출력에 간결한 내보내기 형태 요약을 포함하세요.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin Registry는 설치된 Plugin ID, 활성화 상태, 소스 메타데이터, 기여 소유권에 대한 OpenClaw의 영속 콜드 읽기 모델입니다. 일반 시작, provider 소유자 조회, 채널 설정 분류, Plugin 인벤토리는 Plugin 런타임 모듈을 가져오지 않고 이를 읽을 수 있습니다.

`plugins registry`를 사용해 영속 Registry가 존재하는지, 최신인지, 오래되었는지 확인하세요. `--refresh`를 사용해 영속 Plugin 인덱스, 구성 정책, 매니페스트/패키지 메타데이터에서 다시 빌드하세요. 이는 복구 경로이지 런타임 활성화 경로가 아닙니다.

`openclaw doctor --fix`는 Registry 인접 관리형 npm 드리프트도 복구합니다. 관리형 Plugin npm 루트 아래의 고아 또는 복구된 `@openclaw/*` 패키지가 번들 Plugin을 가리는 경우, doctor는 해당 오래된 패키지를 제거하고 Registry를 다시 빌드하여 시작 시 번들 매니페스트를 기준으로 검증되도록 합니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 Registry 읽기 실패를 위한 더 이상 권장되지 않는 비상 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 선호하세요. env 폴백은 마이그레이션이 배포되는 동안 긴급 시작 복구에만 사용해야 합니다.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 목록은 로컬 Marketplace 경로, `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub repo URL 또는 git URL을 허용합니다. `--json`은 확인된 소스 레이블과 파싱된 Marketplace 매니페스트 및 Plugin 항목을 출력합니다.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [CLI 참조](/ko/cli)
- [ClawHub](/ko/clawhub)
