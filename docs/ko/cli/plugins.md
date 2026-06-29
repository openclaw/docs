---
read_when:
    - Gateway Plugin 또는 호환 번들을 설치하거나 관리하려는 경우
    - 간단한 도구 Plugin을 스캐폴드하거나 검증하려는 경우
    - Plugin 로드 실패를 디버그하려는 경우
sidebarTitle: Plugins
summary: '`openclaw plugins`에 대한 CLI 참조 (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Manage Gateway Plugin, 훅 팩 및 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin 시스템" href="/ko/tools/plugin">
    Plugin 설치, 활성화 및 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 관리" href="/ko/plugins/manage-plugins">
    설치, 목록 조회, 업데이트, 제거 및 게시를 위한 빠른 예시입니다.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

느린 설치, 검사, 제거 또는 레지스트리 새로 고침을 조사하려면 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`로 명령을 실행하세요. 추적은 단계별 시간을 stderr에 기록하고 JSON 출력을 파싱 가능하게 유지합니다. [디버깅](/ko/help/debugging#plugin-lifecycle-trace)을 참조하세요.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 Plugin 수명 주기 변경 작업이 비활성화됩니다. 이 설치에는 `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` 또는 `plugins disable` 대신 Nix 소스를 사용하세요. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.
</Note>

<Note>
번들 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있으며(예: 번들 모델 제공자, 번들 음성 제공자, 번들 브라우저 Plugin), 다른 Plugin은 `plugins enable`이 필요합니다.

네이티브 OpenClaw Plugin은 인라인 JSON Schema(`configSchema`, 비어 있더라도)를 포함한 `openclaw.plugin.json`을 제공해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 목록/정보 출력은 번들 하위 유형(`codex`, `claude` 또는 `cursor`)과 감지된 번들 기능도 표시합니다.
</Note>

### 작성

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init`은 기본적으로 최소 TypeScript 도구 Plugin을 생성합니다. 첫 번째 인수는 Plugin ID입니다. 표시 이름에는 `--name`을 전달하세요. OpenClaw는 기본 출력 디렉터리와 패키지 이름 지정에 ID를 사용합니다. 도구 스캐폴드는 `defineToolPlugin`을 사용합니다.
`plugins build`는 빌드된 엔트리를 가져오고, 정적 도구 메타데이터를 읽고, `openclaw.plugin.json`을 작성하며, `package.json`의 `openclaw.extensions`를 일치된 상태로 유지합니다.
`plugins validate`는 생성된 매니페스트, 패키지 메타데이터 및 현재 엔트리 내보내기가 여전히 일치하는지 확인합니다. 전체 도구 작성 워크플로는 [도구 Plugin](/ko/plugins/tool-plugins)을 참조하세요.

스캐폴드는 TypeScript 소스를 작성하지만 빌드된 `./dist/index.js` 엔트리에서 메타데이터를 생성하므로 게시된 CLI에서도 워크플로가 작동합니다. 엔트리가 기본 패키지 엔트리가 아닌 경우 `--entry <path>`를 사용하세요. 생성된 메타데이터가 파일을 다시 쓰지 않고 오래된 경우 CI에서 실패하도록 `plugins build --check`를 사용하세요.

### 제공자 스캐폴드

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

제공자 스캐폴드는 OpenAI 호환 API 키 연결, `clawhub package validate`를 위한 내장 `npm run validate` 스크립트, ClawHub 패키지 메타데이터, GitHub Actions OIDC를 통한 향후 신뢰할 수 있는 게시를 위해 수동으로 디스패치되는 GitHub 워크플로를 갖춘 일반 텍스트/모델 제공자 Plugin을 생성합니다. 제공자 스캐폴드는 skills를 생성하지 않으며 `openclaw plugins build` 또는 `openclaw plugins validate`를 사용하지 않습니다. 이러한 명령은 도구 스캐폴드의 생성된 메타데이터 경로용입니다.

게시하기 전에 자리 표시자 API 기본 URL, 모델 카탈로그, 문서 경로, 자격 증명 텍스트 및 README 문구를 실제 제공자 세부 정보로 교체하세요. 최초 ClawHub 게시와 신뢰할 수 있는 게시자 설정에는 생성된 README를 사용하세요.

### 설치

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

관리자가 설정 시점 설치를 테스트할 때는 보호된 환경 변수로 자동 Plugin 설치 소스를 재정의할 수 있습니다. [Plugin 설치 재정의](/ko/plugins/install-overrides)를 참조하세요.

<Warning>
출시 전환 기간에는 공식 Plugin ID와 일치하지 않는 한, 순수 패키지 이름은 기본적으로 npm에서 설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*` 패키지 스펙은 현재 OpenClaw 빌드와 함께 제공된 번들 복사본을 사용합니다. 의도적으로 외부 npm 패키지를 원할 때는 `npm:<package>`를 사용하세요. ClawHub에는 `clawhub:<package>`를 사용하세요. Plugin 설치를 코드 실행처럼 취급하세요. 고정된 버전을 선호하세요.
</Warning>

`plugins search`는 설치 가능한 Plugin 패키지를 ClawHub에서 쿼리하고 설치 준비가 된 패키지 이름을 출력합니다. skills가 아니라 코드 Plugin 및 번들 Plugin 패키지를 검색합니다. ClawHub skills에는 `openclaw skills search`를 사용하세요.

<Note>
ClawHub는 대부분의 Plugin에 대한 기본 배포 및 발견 표면입니다. Npm은 지원되는 대체 및 직접 설치 경로로 유지됩니다. OpenClaw 소유 `@openclaw/*` Plugin 패키지는 npm에 다시 게시됩니다. 현재 목록은 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 또는 [Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참조하세요. 안정 설치는 `latest`를 사용합니다. 베타 채널 설치 및 업데이트는 해당 태그를 사용할 수 있으면 npm `beta` dist-tag를 선호하고, 그런 다음 `latest`로 대체합니다.
</Note>

<AccordionGroup>
  <Accordion title="구성 include 및 잘못된 구성 복구">
    `plugins` 섹션이 단일 파일 `$include`로 뒷받침되는 경우 `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 기록하고 `openclaw.json`은 건드리지 않습니다. 루트 include, include 배열, 형제 재정의가 있는 include는 평탄화하는 대신 닫힌 상태로 실패합니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참조하세요.

    설치 중 구성이 잘못된 경우 `plugins install`은 일반적으로 닫힌 상태로 실패하고 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. Gateway 시작 및 핫 리로드 중에는 잘못된 Plugin 구성이 다른 잘못된 구성처럼 닫힌 상태로 실패합니다. `openclaw doctor --fix`는 잘못된 Plugin 항목을 격리할 수 있습니다. 문서화된 유일한 설치 시점 예외는 `openclaw.install.allowInvalidConfigRecovery`를 명시적으로 선택한 Plugin을 위한 좁은 번들 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force와 재설치 및 업데이트">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 훅 팩을 그 자리에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub 패키지 또는 npm 아티팩트에서 같은 ID를 의도적으로 다시 설치할 때 사용하세요. 이미 추적 중인 npm Plugin의 일반 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 선호하세요.

    이미 설치된 Plugin ID에 대해 `plugins install`을 실행하면 OpenClaw는 중지하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를 안내하며, 현재 설치를 다른 소스에서 실제로 덮어쓰려는 경우에는 `plugins install <package> --force`를 안내합니다.

  </Accordion>
  <Accordion title="--pin 범위">
    `--pin`은 npm 설치에만 적용됩니다. `git:` 설치에서는 지원되지 않습니다. 고정된 소스를 원할 때는 `git:github.com/acme/plugin@v1.2.3` 같은 명시적 git ref를 사용하세요. `--marketplace`에서는 지원되지 않습니다. marketplace 설치는 npm 스펙 대신 marketplace 소스 메타데이터를 유지하기 때문입니다.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 더 이상 사용되지 않으며 이제 아무 작업도 하지 않습니다. OpenClaw는 더 이상 Plugin 설치에 대해 내장 설치 시점 위험 코드 차단을 실행하지 않습니다.

    호스트별 설치 정책이 필요한 경우 공유 운영자 소유 `security.installPolicy` 표면을 사용하세요. Plugin `before_install` 훅은 Plugin 런타임 수명 주기 훅이며 CLI 설치의 기본 정책 경계가 아닙니다.

    ClawHub에 게시한 Plugin이 레지스트리 검사로 숨겨지거나 차단된 경우 [ClawHub 게시](/ko/clawhub/publishing)의 게시자 단계를 사용하세요. `--dangerously-force-unsafe-install`은 ClawHub에 Plugin을 다시 검사하거나 차단된 릴리스를 공개하도록 요청하지 않습니다.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    커뮤니티 ClawHub 설치는 패키지를 다운로드하기 전에 선택한 릴리스의 신뢰 기록을 확인합니다. ClawHub가 릴리스 다운로드를 비활성화하거나, 악성 검사 결과를 보고하거나, 릴리스를 격리 같은 차단 조정 상태에 둔 경우 OpenClaw는 해당 릴리스를 거부합니다. 차단하지 않는 위험 검사 상태, 위험한 조정 상태 또는 레지스트리 사유의 경우 OpenClaw는 신뢰 세부 정보를 표시하고 계속하기 전에 확인을 요청합니다.

    `--acknowledge-clawhub-risk`는 ClawHub 경고를 검토하고 대화형 프롬프트 없이 계속하기로 결정한 후에만 사용하세요. 대기 중이거나 오래된 깨끗한 신뢰 기록은 경고하지만 승인을 요구하지 않습니다. 공식 ClawHub 패키지와 번들 OpenClaw Plugin 소스는 이 릴리스 신뢰 프롬프트를 우회합니다.

  </Accordion>
  <Accordion title="훅 팩 및 npm 스펙">
    `plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 훅 팩의 설치 표면이기도 합니다. 패키지 설치가 아니라 필터링된 훅 가시성과 훅별 활성화에는 `openclaw hooks`를 사용하세요.

    Npm 사양은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file 사양과 semver 범위는 거부됩니다. 의존성 설치는 안전을 위해 Plugin별로 관리되는 하나의 npm 프로젝트에서 `--ignore-scripts`와 함께 실행되며, 셸에 전역 npm 설치 설정이 있어도 동일합니다. 관리되는 Plugin npm 프로젝트는 OpenClaw의 패키지 수준 npm `overrides`를 상속하므로, 호스트 보안 고정값은 호이스팅된 Plugin 의존성에도 적용됩니다.

    npm 해석을 명시적으로 만들고 싶으면 `npm:<package>`를 사용하세요. 베어 패키지 사양도 공식 Plugin id와 일치하지 않는 한 출시 전환 기간에는 npm에서 직접 설치됩니다.

    번들 Plugin과 일치하는 원시 `@openclaw/*` 패키지 사양은 npm 폴백 전에 이미지가 소유한 번들 사본으로 해석됩니다. 예를 들어 `openclaw plugins install @openclaw/discord@2026.5.20 --pin`은 관리되는 npm 오버라이드를 생성하는 대신 현재 OpenClaw 빌드의 번들 Discord Plugin을 사용합니다. 외부 npm 패키지를 강제로 사용하려면 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`을 사용하세요.

    베어 사양과 `@latest`는 안정 트랙에 유지됩니다. `2026.5.3-1` 같은 OpenClaw 날짜 스탬프 수정 버전은 이 검사에서 안정 릴리스입니다. npm이 둘 중 하나를 프리릴리스로 해석하면 OpenClaw는 중지하고 `@beta`/`@rc` 같은 프리릴리스 태그나 `@1.2.3-beta.4` 같은 정확한 프리릴리스 버전으로 명시적으로 옵트인하라고 요청합니다.

    정확한 버전이 없는 npm 설치(`npm:<package>` 또는 `npm:<package>@latest`)의 경우, OpenClaw는 설치 전에 해석된 패키지 메타데이터를 확인합니다. 최신 안정 패키지가 더 새로운 OpenClaw Plugin API 또는 최소 호스트 버전을 요구하면, OpenClaw는 이전 안정 버전을 검사하고 가장 최신의 호환 릴리스를 대신 설치합니다. 정확한 버전과 `@beta` 같은 명시적 dist-tag는 엄격하게 유지됩니다. 선택한 패키지가 호환되지 않으면 명령이 실패하고 OpenClaw를 업그레이드하거나 호환 버전을 선택하라고 요청합니다.

    베어 설치 사양이 공식 Plugin id(예: `diffs`)와 일치하면 OpenClaw는 카탈로그 항목을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 명시적 스코프 사양(예: `@scope/diffs`)을 사용하세요.

  </Accordion>
  <Accordion title="Git 저장소">
    git 저장소에서 직접 설치하려면 `git:<repo>`를 사용하세요. 지원되는 형식에는 `git:github.com/owner/repo`, `git:owner/repo`, 전체 `https://`, `ssh://`, `git://`, `file://`, `git@host:owner/repo.git` 클론 URL이 포함됩니다. 설치 전에 브랜치, 태그, 커밋을 체크아웃하려면 `@<ref>` 또는 `#<ref>`를 추가하세요.

    Git 설치는 임시 디렉터리에 클론하고, 요청된 ref가 있으면 체크아웃한 다음, 일반 Plugin 디렉터리 설치 프로그램을 사용합니다. 즉 manifest 검증, 운영자 설치 정책, 패키지 관리자 설치 작업, 설치 기록은 npm 설치처럼 동작합니다. 기록된 git 설치에는 소스 URL/ref와 해석된 커밋이 포함되므로 `openclaw plugins update`가 나중에 소스를 다시 해석할 수 있습니다.

    git에서 설치한 후에는 `openclaw plugins inspect <id> --runtime --json`을 사용해 gateway 메서드와 CLI 명령 같은 런타임 등록을 확인하세요. Plugin이 `api.registerCli`로 CLI 루트를 등록했다면, 예를 들어 `openclaw demo-plugin ping`처럼 OpenClaw 루트 CLI를 통해 해당 명령을 직접 실행하세요.

  </Accordion>
  <Accordion title="아카이브">
    지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin 아카이브는 추출된 Plugin 루트에 유효한 `openclaw.plugin.json`을 포함해야 합니다. `package.json`만 포함한 아카이브는 OpenClaw가 설치 기록을 쓰기 전에 거부됩니다.

    파일이 npm-pack tarball이고 레지스트리 설치에서 사용하는 것과 동일한 Plugin별 관리 npm 프로젝트 경로를 테스트하려면 `npm-pack:<path.tgz>`를 사용하세요. 여기에는 `package-lock.json` 검증, 호이스팅된 의존성 스캔, npm 설치 기록이 포함됩니다. 일반 아카이브 경로는 여전히 Plugin extensions 루트 아래에 로컬 아카이브로 설치됩니다.

    Claude 마켓플레이스 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적 `clawhub:<package>` locator를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

베어 npm 안전 Plugin 사양은 공식 Plugin id와 일치하지 않는 한 출시 전환 기간에는 기본적으로 npm에서 설치됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 전용 해석을 명시하려면 `npm:`을 사용하세요.

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw는 설치 전에 광고된 Plugin API / 최소 gateway 호환성을 확인합니다. 선택한 ClawHub 버전이 ClawPack 아티팩트를 게시하면 OpenClaw는 버전 지정된 npm-pack `.tgz`를 다운로드하고 ClawHub digest 헤더와 아티팩트 digest를 검증한 다음 일반 아카이브 경로를 통해 설치합니다. ClawPack 메타데이터가 없는 이전 ClawHub 버전은 여전히 레거시 패키지 아카이브 검증 경로를 통해 설치됩니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터, 아티팩트 종류, npm integrity, npm shasum, tarball 이름, ClawPack digest 사실을 보존합니다.
버전이 지정되지 않은 ClawHub 설치는 버전 없는 기록 사양을 유지하므로 `openclaw plugins update`가 더 새로운 ClawHub 릴리스를 따라갈 수 있습니다. `clawhub:pkg@1.2.3` 및 `clawhub:pkg@beta` 같은 명시적 버전 또는 태그 선택자는 해당 선택자에 고정된 상태로 유지됩니다.

#### 마켓플레이스 축약형

마켓플레이스 이름이 `~/.claude/plugins/known_marketplaces.json`의 Claude 로컬 레지스트리 캐시에 있으면 `plugin@marketplace` 축약형을 사용하세요.

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
    GitHub 또는 git에서 로드된 원격 마켓플레이스의 경우, Plugin 항목은 클론된 마켓플레이스 저장소 내부에 있어야 합니다. OpenClaw는 해당 저장소의 상대 경로 소스를 허용하고, 원격 manifest의 HTTP(S), 절대 경로, git, GitHub 및 기타 비경로 Plugin 소스는 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 아카이브의 경우 OpenClaw는 다음을 자동 감지합니다.

- 네이티브 OpenClaw Plugin(`openclaw.plugin.json`)
- Codex 호환 번들(`.codex-plugin/plugin.json`)
- Claude 호환 번들(`.claude-plugin/plugin.json` 또는 기본 Claude 컴포넌트 레이아웃)
- Cursor 호환 번들(`.cursor-plugin/plugin.json`)

관리되는 로컬 설치는 Plugin 디렉터리 또는 아카이브여야 합니다. 독립형 `.js`,
`.mjs`, `.cjs`, `.ts` Plugin 파일은 `plugins install`로 관리되는 Plugin
루트에 복사되지 않습니다. 대신 `plugins.load.paths`에 명시적으로 나열하세요.

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 동일한 list/info/enable/disable 흐름에 참여합니다. 현재는 번들 Skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` / manifest 선언 `lspServers` 기본값, Cursor command-skills, 호환 Codex hook 디렉터리가 지원됩니다. 감지된 다른 번들 기능은 diagnostics/info에 표시되지만 아직 런타임 실행에 연결되어 있지는 않습니다.
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
  표 보기에서 Plugin별 세부 줄로 전환하여 소스/출처/버전/활성화 메타데이터를 표시합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  기계가 읽을 수 있는 인벤토리와 레지스트리 진단 및 패키지 의존성 설치 상태입니다.
</ParamField>

<Note>
`plugins list`는 먼저 영속화된 로컬 Plugin 레지스트리를 읽고, 레지스트리가 없거나 유효하지 않으면 manifest 전용 파생 폴백을 사용합니다. Plugin이 설치되어 있고 활성화되어 있으며 콜드 스타트업 계획에 표시되는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스의 라이브 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, hook 정책 또는 `plugins.load.paths`를 변경한 후에는 새 `register(api)` 코드나 hook이 실행될 것으로 기대하기 전에 채널을 제공하는 Gateway를 다시 시작하세요. 원격/컨테이너 배포의 경우 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 자식을 다시 시작하고 있는지 확인하세요.

`plugins list --json`에는 `package.json`의 `dependencies` 및
`optionalDependencies`에서 가져온 각 Plugin의 `dependencyStatus`가 포함됩니다.
OpenClaw는 해당 패키지 이름이 Plugin의 일반 Node `node_modules` 조회 경로에
있는지 확인합니다. Plugin 런타임 코드를 가져오거나, 패키지 관리자를 실행하거나,
누락된 의존성을 복구하지 않습니다.
</Note>

시작 로그에 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`가 표시되면,
`openclaw plugins list --enabled --verbose`를 실행하거나
나열된 Plugin id로 `openclaw plugins inspect <id>`를 실행해 Plugin
id를 확인하고 신뢰하는 id를 `openclaw.json`의 `plugins.allow`에 복사하세요. 경고가
감지된 모든 Plugin을 나열할 수 있으면, 해당 id가 이미 포함된 붙여넣기 가능한
`plugins.allow` 스니펫을 출력합니다. Plugin이 설치/로드 경로 출처 없이 로드되면
해당 Plugin id를 검사한 다음, 신뢰하는 id를 `plugins.allow`에 고정하거나 신뢰할 수 있는 소스에서
Plugin을 다시 설치하여 OpenClaw가 설치 출처를 기록하도록 하세요.

`plugins search`는 원격 ClawHub 카탈로그 조회입니다. 로컬 상태를 검사하거나,
config를 변경하거나, 패키지를 설치하거나, Plugin 런타임 코드를 로드하지 않습니다. 검색
결과에는 ClawHub 패키지 이름, family, channel, version, summary 및
`openclaw plugins install clawhub:<package>` 같은 설치 힌트가 포함됩니다.

패키징된 Docker 이미지 내부에서 번들 Plugin 작업을 할 때는
`/app/extensions/synology-chat` 같은 일치하는 패키징 소스 경로 위에 Plugin
소스 디렉터리를 bind-mount하세요. OpenClaw는 `/app/dist/extensions/synology-chat`보다
먼저 해당 마운트된 소스 오버레이를 감지합니다. 단순히 복사된 소스
디렉터리는 비활성 상태로 남으므로 일반 패키징 설치는 계속 컴파일된 dist를 사용합니다.

런타임 hook 디버깅의 경우:

- `openclaw plugins inspect <id> --runtime --json`은 모듈 로드 검사 패스에서 등록된 hook과 진단을 표시합니다. 런타임 검사는 의존성을 설치하지 않습니다. 레거시 의존성 상태를 정리하거나 config에서 참조하는 누락된 다운로드 가능 Plugin을 복구하려면 `openclaw doctor --fix`를 사용하세요.
- `openclaw gateway status --deep --require-rpc`는 도달 가능한 Gateway URL/profile, service/process 힌트, config 경로, RPC 상태를 확인합니다.
- 비번들 대화 hook(`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`)에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 Plugin 디렉터리 복사를 피하려면 `--link`를 사용하세요(`plugins.load.paths`에 추가됨).

```bash
openclaw plugins install -l ./my-plugin
```

독립형 Plugin 파일은 `plugins install`로 설치하거나 `~/.openclaw/extensions`
또는 `<workspace>/.openclaw/extensions`에 직접 배치하는 대신 `plugins.load.paths`에
나열해야 합니다. 이러한 자동 감지 루트는 Plugin 패키지 또는 번들 디렉터리를 로드하며,
최상위 스크립트 파일은 로컬 헬퍼로 처리되어 건너뜁니다.

<Note>
워크스페이스 확장 루트에서 발견된 워크스페이스 출처 Plugin은 명시적으로 활성화되기 전까지
가져오거나 실행되지 않습니다. 로컬 개발에서는
`openclaw plugins enable <plugin-id>`를 실행하거나
`plugins.entries.<plugin-id>.enabled: true`를 설정하세요. 구성에서
`plugins.allow`를 사용하는 경우 같은 Plugin ID도 여기에 포함하세요. 이 실패 시 닫힘 규칙은
채널 설정이 설정 전용 로딩을 위해 워크스페이스 출처 Plugin을 명시적으로 대상으로 지정하는 경우에도
적용되므로, 해당 워크스페이스 Plugin이 비활성화되어 있거나 허용 목록에서 제외되어 있는 동안에는
로컬 채널 Plugin 설정 코드가 실행되지 않습니다. 링크된 설치와 명시적 `plugins.load.paths`
항목은 확인된 Plugin 출처에 대한 일반 정책을 따릅니다. 자세한 내용은
[Plugin 정책 구성](/ko/tools/plugin#configure-plugin-policy)
및 [구성 참조](/ko/gateway/configuration-reference#plugins)를 참조하세요.

`--force`는 `--link`와 함께 지원되지 않습니다. 링크된 설치는 관리되는 설치 대상에 복사하는 대신 소스 경로를 재사용하기 때문입니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서, 확인된 정확한 사양(`name@version`)을 관리되는 Plugin 인덱스에 저장합니다.
</Note>

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자가 설정하는 구성이 아니라 머신이 관리하는 상태입니다. 설치와 업데이트는 활성 OpenClaw 상태 디렉터리 아래의 공유 SQLite 상태 데이터베이스에 이를 기록합니다. `installed_plugin_index` 행은 손상되었거나 누락된 Plugin 매니페스트의 레코드를 포함한 지속성 있는 `installRecords` 메타데이터와, `openclaw plugins update`, 제거, 진단, 콜드 Plugin 레지스트리에서 사용하는 매니페스트 파생 콜드 레지스트리 캐시를 저장합니다.

OpenClaw가 구성에서 배포된 레거시 `plugins.installs` 레코드를 발견하면, 런타임 읽기는 `openclaw.json`을 다시 쓰지 않고 이를 호환성 입력으로 처리합니다. 명시적 Plugin 쓰기와 `openclaw doctor --fix`는 구성 쓰기가 허용될 때 이러한 레코드를 Plugin 인덱스로 옮기고 구성 키를 제거합니다. 둘 중 하나의 쓰기가 실패하면 설치 메타데이터가 손실되지 않도록 구성 레코드를 유지합니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 해당되는 경우 `plugins.entries`, 지속 저장된 Plugin 인덱스, Plugin 허용/거부 목록 항목, 링크된 `plugins.load.paths` 항목에서 Plugin 레코드를 제거합니다. `--keep-files`가 설정되지 않은 한, 제거는 추적 중인 관리 설치 디렉터리가 OpenClaw의 Plugin 확장 루트 안에 있을 때 해당 디렉터리도 제거합니다. Active Memory Plugin의 경우 메모리 슬롯이 `memory-core`로 재설정됩니다.

<Note>
`--keep-config`는 `--keep-files`의 폐기 예정 별칭으로 지원됩니다.
</Note>

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 관리되는 Plugin 인덱스에서 추적 중인 Plugin 설치와 `hooks.internal.installs`에서 추적 중인 훅 팩 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin ID와 npm 사양 확인">
    Plugin ID를 전달하면 OpenClaw는 해당 Plugin에 기록된 설치 사양을 재사용합니다. 즉, `@beta` 같은 이전에 저장된 dist-tag와 정확히 고정된 버전은 이후 `update <id>` 실행에서도 계속 사용됩니다.

    `update <id> --dry-run` 중에는 정확히 고정된 npm 설치가 고정된 상태로 유지됩니다. OpenClaw가 패키지의 레지스트리 기본 라인도 확인할 수 있고 그 기본 라인이 설치된 고정 버전보다 최신이면, 드라이런은 고정을 보고하고 레지스트리 기본 라인을 따르기 위한 명시적 `@latest` 패키지 업데이트 명령을 출력합니다.

    이 대상 지정 업데이트 규칙은 일괄 `openclaw plugins update --all` 유지관리 경로와 다릅니다. 일괄 업데이트도 일반적인 추적 설치 사양을 존중하지만, 신뢰할 수 있는 공식 OpenClaw Plugin 레코드는 오래된 정확한 공식 패키지에 머무는 대신 현재 공식 카탈로그 대상과 동기화할 수 있습니다. 정확한 공식 사양이나 태그가 지정된 공식 사양을 의도적으로 그대로 유지하려면 대상 지정 `update <id>`를 사용하세요.

    npm 설치의 경우 dist-tag 또는 정확한 버전이 포함된 명시적 npm 패키지 사양을 전달할 수도 있습니다. OpenClaw는 해당 패키지 이름을 추적 중인 Plugin 레코드로 다시 확인하고, 설치된 해당 Plugin을 업데이트하며, 이후 ID 기반 업데이트를 위해 새 npm 사양을 기록합니다.

    버전이나 태그 없이 npm 패키지 이름을 전달해도 추적 중인 Plugin 레코드로 다시 확인됩니다. Plugin이 정확한 버전에 고정되어 있었고 이를 레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

  </Accordion>
  <Accordion title="베타 채널 업데이트">
    대상 지정 `openclaw plugins update <id-or-npm-spec>`는 새 사양을 전달하지 않는 한 추적 중인 Plugin 사양을 재사용합니다. 일괄 `openclaw plugins update --all`은 신뢰할 수 있는 공식 Plugin 레코드를 공식 카탈로그 대상과 동기화할 때 구성된 `update.channel`을 사용하므로, 베타 채널 설치는 조용히 stable/latest로 정규화되는 대신 베타 릴리스 라인에 머물 수 있습니다.

    `openclaw update`도 활성 OpenClaw 업데이트 채널을 알고 있습니다. 베타 채널에서는 기본 라인 npm 및 ClawHub Plugin 레코드가 먼저 `@beta`를 시도합니다. Plugin 베타 릴리스가 없으면 기록된 default/latest 사양으로 폴백합니다. npm Plugin은 베타 패키지가 존재하지만 설치 검증에 실패하는 경우에도 폴백합니다. 이 폴백은 경고로 보고되며 코어 업데이트를 실패시키지 않습니다. 정확한 버전과 명시적 태그는 대상 지정 업데이트에서 해당 선택자에 고정된 상태로 유지됩니다.

  </Accordion>
  <Accordion title="버전 검사 및 무결성 드리프트">
    실제 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 대조합니다. 설치된 버전과 기록된 아티팩트 식별자가 이미 확인된 대상과 일치하면 다운로드, 재설치 또는 `openclaw.json` 재작성 없이 업데이트를 건너뜁니다.

    저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면 OpenClaw는 이를 npm 아티팩트 드리프트로 처리합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 진행하기 전에 확인을 요청합니다. 비대화형 업데이트 헬퍼는 호출자가 명시적 계속 정책을 제공하지 않는 한 실패 시 닫힙니다.

  </Accordion>
  <Accordion title="업데이트의 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 호환성을 위해 `plugins update`에서도 허용되지만, 폐기 예정이며 더 이상 Plugin 업데이트 동작을 변경하지 않습니다. 운영자 `security.installPolicy`는 여전히 업데이트를 차단할 수 있습니다. Plugin `before_install` 훅은 Plugin 훅이 로드된 프로세스에서만 적용됩니다.
  </Accordion>
  <Accordion title="업데이트의 --acknowledge-clawhub-risk">
    커뮤니티 ClawHub 기반 Plugin 업데이트는 대체 패키지를 다운로드하기 전에 설치와 동일한 정확한 릴리스 신뢰 검사를 실행합니다. 선택한 ClawHub 릴리스에 위험한 신뢰 경고가 있어도 계속 진행해야 하는 검토된 자동화에는 `--acknowledge-clawhub-risk`를 사용하세요. 공식 ClawHub 패키지와 번들된 OpenClaw Plugin 소스는 이 릴리스 신뢰 프롬프트를 우회합니다.
  </Accordion>
</AccordionGroup>

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect는 기본적으로 Plugin 런타임을 가져오지 않고 식별자, 로드 상태, 소스, 매니페스트 기능, 정책 플래그, 진단, 설치 메타데이터, 번들 기능, 감지된 MCP 또는 LSP 서버 지원을 표시합니다. JSON 출력에는 `contracts.agentToolResultMiddleware` 및 `contracts.trustedToolPolicies` 같은 Plugin 매니페스트 계약이 포함되므로, 운영자는 Plugin을 활성화하거나 다시 시작하기 전에 신뢰 표면 선언을 감사할 수 있습니다. `--runtime`을 추가하면 Plugin 모듈을 로드하고 등록된 훅, 도구, 명령, 서비스, Gateway 메서드, HTTP 라우트를 포함합니다. 런타임 검사는 누락된 Plugin 의존성을 직접 보고합니다. 설치와 복구는 `openclaw plugins install`, `openclaw plugins update`, `openclaw doctor --fix`에 남아 있습니다.

Plugin 소유 CLI 명령은 보통 루트 `openclaw` 명령 그룹으로 설치되지만, Plugin은 `openclaw nodes` 같은 코어 부모 아래에 중첩 명령을 등록할 수도 있습니다. `inspect --runtime`이 `cliCommands` 아래에 명령을 표시한 후에는 나열된 경로에서 실행하세요. 예를 들어 `demo-git`를 등록하는 Plugin은 `openclaw demo-git ping`으로 검증할 수 있습니다.

각 Plugin은 런타임에 실제로 등록하는 항목에 따라 분류됩니다.

- **plain-capability** — 하나의 기능 유형(예: provider 전용 Plugin)
- **hybrid-capability** — 여러 기능 유형(예: 텍스트 + 음성 + 이미지)
- **hook-only** — 훅만 있고 기능이나 표면 없음
- **non-capability** — 도구/명령/서비스는 있지만 기능 없음

기능 모델에 대한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

<Note>
`--json` 플래그는 스크립팅과 감사에 적합한 머신이 읽을 수 있는 보고서를 출력합니다. `inspect --all`은 형태, 기능 종류, 호환성 알림, 번들 기능, 훅 요약 열이 포함된 전체 플릿 테이블을 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/검색 진단, 호환성 알림, 누락된 Plugin 슬롯 같은 오래된 Plugin 구성 참조를 보고합니다. 설치 트리와 Plugin 구성이 깨끗하면 `No plugin issues detected.`를 출력합니다. 오래된 구성이 남아 있지만 설치 트리가 그 외에는 정상인 경우, 요약은 전체 Plugin 상태가 정상이라고 암시하는 대신 그 사실을 표시합니다.

구성된 Plugin이 디스크에 존재하지만 로더의 경로 안전 검사에 의해 차단된 경우, 구성 검증은 Plugin 항목을 유지하고 이를 `present but blocked`로 보고합니다. `plugins.entries.<id>` 또는 `plugins.allow` 구성을 제거하는 대신, 경로 소유권이나 전역 쓰기 가능 권한 같은 앞선 차단 Plugin 진단을 수정하세요.

`register`/`activate` 내보내기 누락 같은 모듈 형태 실패의 경우, 진단 출력에 간결한 내보내기 형태 요약을 포함하려면 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`로 다시 실행하세요.

### 레지스트리

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin 레지스트리는 설치된 Plugin 식별자, 활성화 상태, 소스 메타데이터, 기여 소유권에 대한 OpenClaw의 지속 저장된 콜드 읽기 모델입니다. 일반 시작, provider 소유자 조회, 채널 설정 분류, Plugin 인벤토리는 Plugin 런타임 모듈을 가져오지 않고 이를 읽을 수 있습니다.

`plugins registry`를 사용하여 지속 저장된 레지스트리가 존재하는지, 최신인지, 오래되었는지 검사하세요. `--refresh`를 사용하면 지속 저장된 Plugin 인덱스, 구성 정책, 매니페스트/패키지 메타데이터에서 이를 다시 빌드합니다. 이는 런타임 활성화 경로가 아니라 복구 경로입니다.

`openclaw doctor --fix`는 레지스트리와 인접한 관리 npm 드리프트도 복구합니다. 관리되는 Plugin npm 프로젝트 또는 레거시 플랫 관리 npm 루트 아래의 고아 또는 복구된 `@openclaw/*` 패키지가 번들 Plugin을 가리는 경우, doctor는 해당 오래된 패키지를 제거하고 레지스트리를 다시 빌드하여 시작 시 번들 매니페스트를 기준으로 검증되도록 합니다. 또한 doctor는 호스트 `openclaw` 패키지를 `peerDependencies.openclaw`를 선언하는 관리 npm Plugin에 다시 링크하므로, 업데이트나 npm 복구 후 `openclaw/plugin-sdk/*` 같은 패키지 로컬 런타임 가져오기가 확인됩니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 레지스트리 읽기 실패를 위한 폐기 예정 비상 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 우선 사용하세요. env 폴백은 마이그레이션이 배포되는 동안 긴급 시작 복구용으로만 제공됩니다.
</Warning>

### 마켓플레이스

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries`는 구성된 OpenClaw 마켓플레이스 피드의 항목을 나열합니다. 기본적으로 호스팅된 피드를 시도하고, 최신 승인 스냅샷 또는 번들 데이터로 대체합니다. 특정 구성 프로필을 읽으려면 `--feed-profile <name>`을 사용하고, 명시적인 호스팅 피드 URL을 읽으려면 `--feed-url <url>`을 사용하며, 피드를 가져오지 않고 최신 승인 스냅샷을 읽으려면 `--offline`을 사용하세요.

`plugins marketplace refresh`는 구성된 호스팅 피드 스냅샷을 새로 고치고 OpenClaw가 호스팅 데이터, 호스팅 스냅샷 또는 번들 대체 데이터를 승인했는지 보고합니다. 호출자가 최신 호스팅 페이로드가 고정된 체크섬과 일치하지 않으면 명령이 실패해야 하는 경우 `--expected-sha256`을 사용하세요.

마켓플레이스 `list`는 로컬 마켓플레이스 경로, `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 리포지토리 URL 또는 git URL을 허용합니다. `--json`은 확인된 소스 레이블과 파싱된 마켓플레이스 매니페스트 및 Plugin 항목을 출력합니다.

마켓플레이스 새로 고침은 호스팅된 OpenClaw 마켓플레이스 피드를 로드하고 검증된 응답을 로컬 호스팅 피드 스냅샷으로 유지합니다. 옵션이 없으면 구성된 기본 피드 프로필을 사용합니다. 특정 구성 프로필을 새로 고치려면 `--feed-profile <name>`을 사용하고, 명시적인 호스팅 피드 URL을 새로 고치려면 `--feed-url <url>`을 사용하며, 일치하는 페이로드 체크섬(`sha256:<hex>` 또는 64자 원시 16진수 다이제스트)을 요구하려면 `--expected-sha256 <sha256>`를 사용하고, 기계 판독 가능 출력에는 `--json`을 사용하세요. 명시적인 호스팅 피드 URL에는 자격 증명, 쿼리 문자열 또는 프래그먼트가 포함되어서는 안 됩니다. 고정되지 않은 새로 고침은 명령을 실패시키지 않고 호스팅 스냅샷 또는 번들 대체 결과를 보고할 수 있습니다. 고정된 새로 고침은 최신 호스팅 페이로드를 승인하지 않는 한 실패하며, 성공적인 호스팅 새로 고침은 OpenClaw가 검증된 스냅샷을 유지할 수 없으면 실패합니다.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [CLI 참조](/ko/cli)
- [ClawHub](/ko/clawhub)
