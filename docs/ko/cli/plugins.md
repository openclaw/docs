---
read_when:
    - Gateway Plugin 또는 호환 번들을 설치하거나 관리하려고 합니다.
    - 간단한 도구 Plugin을 스캐폴딩하거나 검증하려고 합니다
    - Plugin 로드 실패를 디버그하려고 합니다
sidebarTitle: Plugins
summary: '`openclaw plugins`의 CLI 참조(init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-07-12T15:06:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin, 훅 팩 및 호환 번들을 관리합니다.

<CardGroup cols={2}>
  <Card title="Plugin 시스템" href="/ko/tools/plugin">
    Plugin 설치, 활성화 및 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 관리" href="/ko/plugins/manage-plugins">
    설치, 목록 조회, 업데이트, 제거 및 게시에 대한 빠른 예시입니다.
  </Card>
  <Card title="Plugin 번들" href="/ko/plugins/bundles">
    번들 호환성 모델입니다.
  </Card>
  <Card title="Plugin 매니페스트" href="/ko/plugins/manifest">
    매니페스트 필드 및 구성 스키마입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security">
    Plugin 설치를 위한 보안 강화 방법입니다.
  </Card>
</CardGroup>

## 명령어

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # inspect의 별칭
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

느린 설치, 검사, 제거 또는 레지스트리 새로 고침을 조사하려면
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 설정하여 명령을 실행하십시오. 추적은 단계별 소요 시간을
stderr에 기록하며 JSON 출력을 파싱 가능한 상태로 유지합니다. [디버깅](/ko/help/debugging#plugin-lifecycle-trace)을 참조하십시오.

<Note>
Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 `openclaw.json`을 변경할 수 없습니다. `install`, `update`, `uninstall`, `enable`, `disable`은 모두 실행을 거부합니다. 대신 이 설치의 Nix 소스(nix-openclaw의 경우 `programs.openclaw.config` 또는 `instances.<name>.config`)를 편집한 후 다시 빌드하십시오. 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 참조하십시오.
</Note>

<Note>
번들 Plugin은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되며(예: 번들 모델 제공자, 번들 음성 제공자 및 번들 브라우저 Plugin), 나머지는 `plugins enable`을 실행해야 합니다.

네이티브 OpenClaw Plugin은 인라인 JSON Schema(비어 있더라도 `configSchema`)가 포함된 `openclaw.plugin.json`을 제공합니다. 호환 번들은 자체 번들 매니페스트를 사용합니다.

`plugins list`에는 `Format: openclaw` 또는 `Format: bundle`이 표시됩니다. 상세 목록/info 출력에는 감지된 번들 기능과 함께 번들 하위 유형(`codex`, `claude` 또는 `cursor`)도 표시됩니다.
</Note>

## 제작

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init`은 기본적으로 최소한의 TypeScript 도구 Plugin을 생성합니다. 첫 번째
인수는 Plugin ID이며, `--name`은 표시 이름을 설정합니다. OpenClaw는 이
ID를 기본 출력 디렉터리와 패키지 이름 지정에 사용합니다. 도구 스캐폴드는
`defineToolPlugin`을 사용하며, 빌드 후 `openclaw plugins build`/`validate`를
호출하는 `package.json` 스크립트 `plugin:build`와 `plugin:validate`를 생성합니다.

`plugins build`는 빌드된 엔트리를 가져오고 정적 도구 메타데이터를 읽은 다음
`openclaw.plugin.json`을 작성하고 `package.json`의 `openclaw.extensions`를 일치시킵니다.
`plugins validate`는 생성된 매니페스트, 패키지 메타데이터 및
현재 엔트리 내보내기가 여전히 일치하는지 확인합니다. 전체 제작 워크플로는
[도구 Plugin](/ko/plugins/tool-plugins)을 참조하십시오.

스캐폴드는 TypeScript 소스를 작성하지만 빌드된 `./dist/index.js`
엔트리에서 메타데이터를 생성하므로, 이 워크플로는 게시된 CLI에서도 작동합니다.
엔트리가 기본 패키지 엔트리가 아닌 경우 `--entry <path>`를 사용하십시오.
파일을 다시 작성하지 않고 생성된 메타데이터가 오래된 경우 CI가 실패하도록 하려면
`plugins build --check`를 사용하십시오.

### 제공자 스캐폴드

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

제공자 스캐폴드는 API 키 인증 연결, `clawhub package validate`를 실행하는
`npm run validate` 스크립트, ClawHub 패키지 메타데이터 및 향후 GitHub
OIDC를 통한 신뢰할 수 있는 게시를 위해 수동으로 실행하는 GitHub Actions 워크플로가 포함된
일반적인 OpenAI 호환 모델 제공자 Plugin을 생성합니다. 제공자 스캐폴드는 Skills를
생성하지 않으며 `openclaw plugins build`/`validate`를 사용하지 않습니다. 해당 명령은
도구 스캐폴드의 생성된 메타데이터 경로를 위한 것입니다.

게시하기 전에 자리표시자 API 기본 URL, 모델 카탈로그, 문서
경로, 자격 증명 문구 및 README 내용을 실제 제공자 세부 정보로 교체하십시오.
최초 ClawHub 게시 및 신뢰할 수 있는 게시자 설정에는 생성된 README를 사용하십시오.

## 설치

```bash
openclaw plugins search "calendar"                      # ClawHub Plugin 검색
openclaw plugins install <package>                       # 소스 자동 감지
openclaw plugins install clawhub:<package>                # ClawHub 전용
openclaw plugins install npm:<package>                    # npm 전용
openclaw plugins install npm-pack:<path.tgz>               # 로컬 npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git 저장소
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # 로컬 경로 또는 아카이브
openclaw plugins install -l <path>                         # 복사 대신 링크
openclaw plugins install <plugin>@<marketplace>             # 마켓플레이스 축약형
openclaw plugins install <plugin> --marketplace <name>      # 마켓플레이스(명시적)
openclaw plugins install <package> --force                  # 기존 설치 덮어쓰기
openclaw plugins install <package> --pin                    # 확인된 npm 버전 고정
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

설정 시점 설치를 테스트하는 유지관리자는 보호된 환경 변수를 사용하여 자동 Plugin 설치
소스를 재정의할 수 있습니다. [Plugin 설치 재정의](/ko/plugins/install-overrides)를
참조하십시오.

<Warning>
출시 전환 기간에는 번들 또는 공식 Plugin ID와 일치하지 않는 한, 접두사가 없는 패키지 이름은 기본적으로 npm에서 설치됩니다. 번들 또는 공식 Plugin ID와 일치하면 OpenClaw는 npm 레지스트리에 접근하는 대신 해당 로컬/공식 복사본을 사용합니다. 외부 npm 패키지를 의도적으로 사용하려면 `npm:<package>`를 사용하십시오. ClawHub에는 `clawhub:<package>`를 사용하십시오. Plugin 설치는 코드 실행과 동일하게 취급하고 고정된 버전을 사용하는 것이 좋습니다.
</Warning>

`plugins search`는 설치 가능한 `code-plugin` 및
`bundle-plugin` 패키지를 ClawHub에서 검색합니다(Skills는 검색하지 않으므로 해당 항목에는 `openclaw skills search`를 사용하십시오).
기본 `--limit`은 20이며 최대 100입니다. 원격 카탈로그만 읽으며,
로컬 상태 검사, 구성 변경, 패키지 설치 또는 Plugin 런타임
로드는 수행하지 않습니다. 결과에는 ClawHub 패키지 이름, 계열, 채널, 버전,
요약 및 `openclaw plugins install clawhub:<package>`과 같은 설치 안내가 포함됩니다.

<Note>
ClawHub는 대부분의 Plugin을 위한 기본 배포 및 검색 경로입니다. Npm은
지원되는 대체 및 직접 설치 경로로 유지됩니다. OpenClaw 소유의
`@openclaw/*` Plugin 패키지는 다시 npm에 게시됩니다. 현재 목록은
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 또는
[Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참조하십시오. 안정 버전 설치에는 `latest`를 사용합니다.
베타 채널 설치 및 업데이트는 사용 가능한 경우 npm `beta` dist-tag를 우선하며,
없으면 `latest`로 대체합니다. 확장 안정 채널에서는 접두사가 없거나 기본값 또는
`latest`를 의도한 공식 npm Plugin이 설치된 코어의 정확한
버전으로 확인됩니다. 정확한 고정 버전과 명시적인 `latest` 이외의 태그, 서드 파티 패키지 및
npm 이외의 소스는 다시 작성되지 않습니다.
</Note>

<AccordionGroup>
  <Accordion title="구성 include 및 잘못된 구성 복구">
    `plugins` 섹션이 단일 파일 `$include`를 기반으로 하는 경우 `plugins install/update/enable/disable/uninstall`은 포함된 해당 파일에 직접 기록하고 `openclaw.json`은 변경하지 않습니다. 루트 include, include 배열 및 형제 재정의가 있는 include는 평탄화하는 대신 실패 시 닫힙니다. 지원되는 형태는 [구성 include](/ko/gateway/configuration)를 참조하십시오.

    설치 중 구성이 잘못된 경우 `plugins install`은 일반적으로 실패 시 닫히며 먼저 `openclaw doctor --fix`를 실행하라고 안내합니다. Gateway 시작 및 핫 리로드 중에는 잘못된 Plugin 구성이 다른 잘못된 구성과 마찬가지로 실패 시 닫히며, `openclaw doctor --fix`는 잘못된 Plugin 항목을 격리할 수 있습니다. 문서화된 유일한 설치 시점 예외는 `openclaw.install.allowInvalidConfigRecovery`를 명시적으로 선택한 Plugin을 위한 제한적인 번들 Plugin 복구 경로입니다.

  </Accordion>
  <Accordion title="--force 및 재설치와 업데이트의 차이">
    `--force`는 기존 설치 대상을 재사용하고 이미 설치된 Plugin 또는 훅 팩을 해당 위치에서 덮어씁니다. 새 로컬 경로, 아카이브, ClawHub 패키지 또는 npm 아티팩트에서 동일한 ID를 의도적으로 다시 설치할 때 사용하십시오. 이미 추적 중인 npm Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하는 것이 좋습니다.

    이미 설치된 Plugin ID에 대해 `plugins install`을 실행하면 OpenClaw는 중지하고, 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를 사용하거나 다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우 `plugins install <package> --force`를 사용하라고 안내합니다. `--force`는 `--link`와 함께 사용할 수 없습니다.

  </Accordion>
  <Accordion title="--pin 적용 범위">
    `--pin`은 npm 설치에만 적용되며 확인된 정확한 `<name>@<version>`을 기록합니다. `git:` 설치에서는 지원되지 않으며(대신 사양에서 ref를 고정하십시오. 예: `git:github.com/acme/plugin@v1.2.3`), `--marketplace`에서도 지원되지 않습니다(마켓플레이스 설치는 npm 사양 대신 마켓플레이스 소스 메타데이터를 유지합니다).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`은 더 이상 사용되지 않으며 이제 아무 작업도 수행하지 않습니다. OpenClaw는 더 이상 Plugin 설치 시 내장된 위험 코드 차단을 실행하지 않습니다.

    호스트별 설치 정책이 필요한 경우 운영자가 소유하는 `security.installPolicy` 표면을 사용하십시오. Plugin `before_install` 훅은 Plugin 런타임 수명 주기 훅이며 CLI 설치의 기본 정책 경계가 아닙니다.

    ClawHub에 게시한 Plugin이 레지스트리 검사로 숨겨지거나 차단된 경우 [ClawHub 게시](/ko/clawhub/publishing)의 게시자 단계를 따르십시오. `--dangerously-force-unsafe-install`은 ClawHub에 Plugin을 다시 검사하거나 차단된 릴리스를 공개하도록 요청하지 않습니다.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    커뮤니티 ClawHub 설치는 다운로드 전에 선택한 릴리스의 신뢰 기록을 확인합니다. ClawHub가 해당 릴리스의 다운로드를 비활성화하거나, 악성 검사 결과를 보고하거나, 릴리스를 차단 조정 상태(격리됨, 취소됨)로 지정하면 OpenClaw는 이 플래그와 관계없이 해당 릴리스를 완전히 거부합니다. 차단하지 않는 위험한 검사 상태 또는 조정 상태의 경우 OpenClaw는 신뢰 세부 정보를 표시하고 계속하기 전에 확인을 요청합니다.

    ClawHub 경고를 검토하고 대화형 프롬프트 없이 계속하기로 결정한 경우에만 `--acknowledge-clawhub-risk`를 사용하십시오. 대기 중이거나 오래된(아직 정상으로 확인되지 않은) 검사 결과는 경고를 표시하지만 확인을 요구하지 않습니다. 공식 ClawHub 패키지와 번들 OpenClaw Plugin 소스는 이 릴리스 신뢰 검사를 완전히 건너뜁니다.

  </Accordion>
  <Accordion title="훅 팩 및 npm 사양">
    `plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 훅 팩의 설치 경로이기도 합니다. 패키지 설치가 아니라 필터링된 훅 표시 및 훅별 활성화에는 `openclaw hooks`를 사용하십시오.

    Npm 사양은 **레지스트리 전용**입니다(패키지 이름과 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/파일 사양과 semver 범위는 거부됩니다. 종속성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 `--ignore-scripts`를 사용하여 Plugin별로 하나의 관리형 npm 프로젝트에서 실행됩니다. 관리형 Plugin npm 프로젝트는 OpenClaw의 패키지 수준 npm `overrides`를 상속하므로 호스트 보안 고정 버전이 호이스팅된 Plugin 종속성에도 적용됩니다.

    npm 해석을 명시하려면 `npm:<package>`를 사용하십시오. 단순 패키지 사양도 공식 Plugin id와 일치하지 않는 한 출시 전환 기간에 npm에서 직접 설치됩니다.

    번들 Plugin과 일치하는 원시 `@openclaw/*` 사양은 npm 대체 경로보다 먼저 이미지가 소유한 번들 사본으로 해석됩니다. 예를 들어 `openclaw plugins install @openclaw/discord@2026.5.20 --pin`은 관리형 npm 재정의를 생성하는 대신 현재 OpenClaw 빌드의 번들 Discord Plugin을 사용합니다. 외부 npm 패키지를 강제로 사용하려면 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`을 사용하십시오.

    단순 사양과 `@latest`는 안정 트랙을 유지합니다. `2026.5.3-1`과 같은 OpenClaw 날짜 스탬프 수정 버전도 이 검사에서는 안정 버전으로 간주됩니다. npm이 두 형식 중 하나를 프리릴리스로 해석하면 OpenClaw는 중지하고 프리릴리스 태그(`@beta`/`@rc`) 또는 정확한 프리릴리스 버전(`@1.2.3-beta.4`)으로 명시적으로 동의하도록 요청합니다.

    정확한 버전이 없는 npm 설치(`npm:<package>` 또는 `npm:<package>@latest`)의 경우 OpenClaw는 설치 전에 해석된 패키지 메타데이터를 검사합니다. 최신 안정 패키지에 더 새로운 OpenClaw Plugin API 또는 더 높은 최소 호스트 버전이 필요하면 OpenClaw는 이전 안정 버전을 검사하여 호환되는 최신 릴리스를 대신 설치합니다. 정확한 버전과 명시적 dist-tag는 엄격하게 유지됩니다. 호환되지 않는 항목을 선택하면 실패하며 OpenClaw를 업그레이드하거나 호환되는 버전을 선택하도록 요청합니다.

    단순 설치 사양이 공식 Plugin id(예: `diffs`)와 일치하면 OpenClaw는 카탈로그 항목을 직접 설치합니다. 이름이 같은 npm 패키지를 설치하려면 명시적인 범위 지정 사양(예: `@scope/diffs`)을 사용하십시오.

  </Accordion>
  <Accordion title="Git 저장소">
    git 저장소에서 직접 설치하려면 `git:<repo>`를 사용하십시오. 지원되는 형식: `git:github.com/owner/repo`, `git:owner/repo`, 전체 `https://`, `ssh://`, `git://`, `file://`, `git@host:owner/repo.git` 복제 URL. 설치 전에 브랜치, 태그 또는 커밋을 체크아웃하려면 `@<ref>` 또는 `#<ref>`를 추가하십시오.

    Git 설치는 임시 디렉터리에 복제하고, 요청된 ref가 있으면 체크아웃한 다음, 일반 Plugin 디렉터리 설치 프로그램을 사용합니다. 따라서 매니페스트 검증, 운영자 설치 정책, 패키지 관리자 설치 작업 및 설치 레코드는 npm 설치와 동일하게 동작합니다. 기록된 git 설치에는 소스 URL/ref와 해석된 커밋이 포함되므로 나중에 `openclaw plugins update`가 소스를 다시 해석할 수 있습니다.

    git에서 설치한 후 `openclaw plugins inspect <id> --runtime --json`을 사용하여 Gateway 메서드 및 CLI 명령과 같은 런타임 등록을 확인하십시오. Plugin이 `api.registerCli`로 CLI 루트를 등록한 경우 해당 명령을 OpenClaw 루트 CLI를 통해 직접 실행하십시오. 예: `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="아카이브">
    지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`. 네이티브 OpenClaw Plugin 아카이브는 압축 해제된 Plugin 루트에 유효한 `openclaw.plugin.json`을 포함해야 합니다. `package.json`만 포함하는 아카이브는 OpenClaw가 설치 레코드를 쓰기 전에 거부됩니다.

    파일이 npm-pack tarball이고 레지스트리 설치에 사용되는 것과 동일한
    Plugin별 관리형 npm 프로젝트 경로를 사용하려면 `npm-pack:<path.tgz>`를 사용하십시오.
    여기에는 `package-lock.json` 검증, 호이스팅된 종속성 검사,
    npm 설치 레코드가 포함됩니다. 일반 아카이브 경로는 계속해서 Plugin
    확장 루트 아래에 로컬 아카이브로 설치됩니다.

    Claude 마켓플레이스 설치도 지원됩니다.

  </Accordion>
</AccordionGroup>

ClawHub 설치는 명시적인 `clawhub:<package>` 로케이터를 사용합니다.

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm에 안전한 단순 Plugin 사양은 공식 Plugin id와 일치하지 않는 한 출시 전환 기간에 기본적으로 npm에서 설치됩니다.

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 전용 해석을 명시하려면 `npm:`을 사용하십시오.

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw는 설치 전에 게시된 Plugin API/최소 Gateway 호환성을 검사합니다. 선택한 ClawHub 버전이 ClawPack 아티팩트를 게시하는 경우 OpenClaw는 버전이 지정된 npm-pack `.tgz`를 다운로드하고 ClawHub 다이제스트 헤더와 아티팩트 다이제스트를 검증한 다음 일반 아카이브 경로를 통해 설치합니다. ClawPack 메타데이터가 없는 이전 ClawHub 버전은 계속 레거시 패키지 아카이브 검증 경로를 통해 설치됩니다. 기록된 설치에는 이후 업데이트를 위해 ClawHub 소스 메타데이터, 아티팩트 종류, npm 무결성, npm shasum, tarball 이름 및 ClawPack 다이제스트 정보가 유지됩니다.
버전이 지정되지 않은 ClawHub 설치는 `openclaw plugins update`가 더 새로운 ClawHub 릴리스를 따를 수 있도록 버전 없는 기록 사양을 유지합니다. `clawhub:pkg@1.2.3` 및 `clawhub:pkg@beta`와 같은 명시적인 버전 또는 태그 선택자는 해당 선택자에 고정된 상태로 유지됩니다.

### 마켓플레이스 단축 표기

Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 마켓플레이스 이름이 존재하는 경우 `plugin@marketplace` 단축 표기를 사용하십시오.

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

마켓플레이스 소스를 명시적으로 전달하려면 `--marketplace`를 사용하십시오.

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="마켓플레이스 소스">
    - `~/.claude/plugins/known_marketplaces.json`에 있는 Claude 알려진 마켓플레이스 이름
    - 로컬 마켓플레이스 루트 또는 `marketplace.json` 경로
    - `owner/repo`와 같은 GitHub 저장소 단축 표기
    - `https://github.com/owner/repo`와 같은 GitHub 저장소 URL
    - git URL

  </Tab>
  <Tab title="원격 마켓플레이스 규칙">
    GitHub 또는 git에서 로드한 원격 마켓플레이스의 경우 Plugin 항목은 복제된 마켓플레이스 저장소 내부에 있어야 합니다. OpenClaw는 해당 저장소의 상대 경로 소스를 허용하며 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 경로가 아닌 Plugin 소스를 거부합니다.
  </Tab>
</Tabs>

로컬 경로와 아카이브의 경우 OpenClaw는 다음을 자동 감지합니다.

- 네이티브 OpenClaw Plugin(`openclaw.plugin.json`)
- Codex 호환 번들(`.codex-plugin/plugin.json`)
- Claude 호환 번들(`.claude-plugin/plugin.json`, 또는 해당 매니페스트 파일이 없을 때 기본 Claude 컴포넌트 레이아웃)
- Cursor 호환 번들(`.cursor-plugin/plugin.json`)

관리형 로컬 설치는 Plugin 디렉터리 또는 아카이브여야 합니다. 독립 실행형 `.js`,
`.mjs`, `.cjs`, `.ts` Plugin 파일은 `plugins install`에 의해 관리형 Plugin
루트로 복사되지 않으며, `~/.openclaw/extensions` 또는
`<workspace>/.openclaw/extensions`에 직접 배치해도 로드되지 않습니다. 이러한
자동 검색 루트는 Plugin 패키지 또는 번들 디렉터리를 로드하고 최상위 스크립트
파일은 로컬 도우미로 간주하여 건너뜁니다. 대신 독립 실행형 파일을
`plugins.load.paths`에 명시적으로 나열하십시오.

<Note>
호환 번들은 일반 Plugin 루트에 설치되며 동일한 목록/정보/활성화/비활성화 흐름에 참여합니다. 현재는 번들 Skills, Claude 명령 Skills, Claude `settings.json` 기본값, Claude `.lsp.json`/매니페스트에 선언된 `lspServers` 기본값, Cursor 명령 Skills 및 호환 Codex 훅 디렉터리를 지원합니다. 감지된 다른 번들 기능은 진단/정보에 표시되지만 아직 런타임 실행에 연결되지 않았습니다.
</Note>

복사하지 않고 로컬 Plugin 디렉터리를 가리키려면 `-l`/`--link`를 사용하십시오(
`plugins.load.paths`에 추가됨).

```bash
openclaw plugins install -l ./my-plugin
```

`--link`는 `--force`(연결된 Plugin은 소스 경로를 직접 가리키므로 제자리에서
덮어쓸 대상이 없음), `--marketplace` 또는 `git:` 설치와 함께 사용할 수
없으며, 이미 존재하는 로컬 경로가 필요합니다.

<Note>
워크스페이스 확장 루트에서 검색된 워크스페이스 원본 Plugin은 명시적으로
활성화될 때까지 가져오거나 실행하지 않습니다. 로컬 개발의 경우
`openclaw plugins enable <plugin-id>`를 실행하거나
`plugins.entries.<plugin-id>.enabled: true`를 설정하십시오. 구성에서
`plugins.allow`를 사용하는 경우 동일한 Plugin id도 포함하십시오. 이 실패 시
차단 규칙은 채널 설정이 설정 전용 로드를 위해 워크스페이스 원본 Plugin을
명시적으로 대상으로 지정하는 경우에도 적용됩니다. 따라서 해당 워크스페이스
Plugin이 비활성화되어 있거나 허용 목록에서 제외되어 있는 동안에는 로컬 채널
Plugin 설정 코드가 실행되지 않습니다. 연결된 설치와 명시적인
`plugins.load.paths` 항목은 해석된 Plugin 원본에 대한 일반 정책을 따릅니다.
[Plugin 정책 구성](/ko/tools/plugin#configure-plugin-policy) 및
[구성 참조](/ko/gateway/configuration-reference#plugins)를 참조하십시오.

npm 설치에 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서 해석된 정확한 사양(`name@version`)을 관리형 Plugin 인덱스에 저장할 수 있습니다.
</Note>

## 목록

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
  테이블 보기에서 형식/소스/원본/버전/활성화 메타데이터가 포함된 Plugin별 상세 줄로 전환합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  레지스트리 진단 및 패키지 종속성 설치 상태가 포함된 기계 판독 가능 인벤토리입니다.
</ParamField>

<Note>
`plugins list`는 먼저 영구 저장된 로컬 Plugin 레지스트리를 읽으며, 레지스트리가 없거나 유효하지 않은 경우 매니페스트에서만 파생된 대체 경로를 사용합니다. Plugin이 설치되고 활성화되었으며 콜드 스타트 계획에 표시되는지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스의 실시간 런타임 프로브는 아닙니다. Plugin 코드, 활성화 상태, 훅 정책 또는 `plugins.load.paths`를 변경한 후에는 새 `register(api)` 코드나 훅이 실행되기를 기대하기 전에 채널을 제공하는 Gateway를 다시 시작하십시오. 원격/컨테이너 배포에서는 래퍼 프로세스만이 아니라 실제 `openclaw gateway run` 자식 프로세스를 다시 시작하고 있는지 확인하십시오.

`plugins list --json`에는 `package.json`의 `dependencies` 및
`optionalDependencies`에서 가져온 각 Plugin의 `dependencyStatus`가 포함됩니다.
OpenClaw는 해당 패키지 이름이 Plugin의 일반 Node `node_modules` 조회 경로에
있는지 검사합니다. Plugin 런타임 코드를 가져오거나, 패키지 관리자를 실행하거나,
누락된 종속성을 복구하지는 않습니다.
</Note>

시작 로그에 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`가
표시되면 `openclaw plugins list --enabled --verbose` 또는 나열된 Plugin id를
사용한 `openclaw plugins inspect <id>`를 실행하여 Plugin id를 확인하고 신뢰할 수
있는 id를 `openclaw.json`의 `plugins.allow`에 복사하십시오. 경고에 검색된 모든
Plugin을 나열할 수 있으면 해당 id가 이미 포함된, 바로 붙여 넣을 수 있는
`plugins.allow` 스니펫을 출력합니다. Plugin이 설치/로드 경로 출처 없이 로드되면
해당 Plugin id를 검사한 다음, 신뢰할 수 있는 id를 `plugins.allow`에 고정하거나
신뢰할 수 있는 소스에서 Plugin을 다시 설치하여 OpenClaw가 설치 출처를 기록하도록
하십시오.

패키징된 Docker 이미지 내부에서 번들 Plugin 작업을 수행하는 경우
`/app/extensions/synology-chat`과 같이 일치하는 패키징 소스 경로 위에 Plugin
소스 디렉터리를 바인드 마운트하십시오. OpenClaw는 `/app/dist/extensions/synology-chat`
보다 먼저 마운트된 소스 오버레이를 검색합니다. 단순히 복사한 소스 디렉터리는
비활성 상태로 유지되므로 일반 패키징 설치에서는 계속 컴파일된 dist를 사용합니다.

런타임 훅을 디버깅하려면:

- `openclaw plugins inspect <id> --runtime --json`은 모듈을 로드하는 검사 과정에서 등록된 훅과 진단 정보를 표시합니다. 런타임 검사는 종속성을 설치하지 않습니다. 레거시 종속성 상태를 정리하거나 구성에서 참조하지만 다운로드 가능한 Plugin이 누락된 경우 복구하려면 `openclaw doctor --fix`를 사용하십시오.
- `openclaw gateway status --deep --require-rpc`는 접근 가능한 Gateway URL/프로필, 서비스/프로세스 힌트, 구성 경로 및 RPC 상태를 확인합니다.
- 번들에 포함되지 않은 대화 훅(`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`)에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

### Plugin 인덱스

Plugin 설치 메타데이터는 사용자 구성이 아니라 시스템이 관리하는 상태입니다. 설치 및 업데이트 시 활성 OpenClaw 상태 디렉터리 아래의 공유 SQLite 상태 데이터베이스에 기록됩니다. `installed_plugin_index` 행에는 손상되었거나 누락된 Plugin 매니페스트의 레코드를 포함한 영구 `installRecords` 메타데이터와 함께, `openclaw plugins update`, 제거, 진단 및 콜드 Plugin 레지스트리에서 사용하는 매니페스트 기반 콜드 레지스트리 캐시가 저장됩니다.

OpenClaw가 구성에서 출시된 레거시 `plugins.installs` 레코드를 발견하면 런타임 읽기에서는 `openclaw.json`을 다시 작성하지 않고 이를 호환성 입력으로 처리합니다. 명시적인 Plugin 쓰기와 `openclaw doctor --fix`는 해당 레코드를 Plugin 인덱스로 이동하고 구성 쓰기가 허용된 경우 구성 키를 제거합니다. 둘 중 하나라도 쓰기에 실패하면 설치 메타데이터가 손실되지 않도록 구성 레코드를 유지합니다.

## 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall`은 `plugins.entries`, 영구 Plugin 인덱스, Plugin 허용/거부 목록 항목 및 해당하는 경우 연결된 `plugins.load.paths` 항목에서 Plugin 레코드를 제거합니다. `--keep-files`를 설정하지 않으면 추적 중인 관리형 설치 디렉터리도 제거하지만, 해당 디렉터리가 OpenClaw의 Plugin 확장 루트 내부로 해석되는 경우에만 제거합니다. Plugin이 현재 `memory` 또는 `contextEngine` 슬롯을 소유하고 있으면 해당 슬롯은 기본값(메모리는 `memory-core`, 컨텍스트 엔진은 `legacy`)으로 재설정됩니다.

`uninstall`은 변경하기 전에 제거할 항목의 미리보기를 출력한 다음 `Uninstall plugin "<id>"?`라는 확인 메시지를 표시합니다. 확인 메시지를 건너뛰려면 `--force`를 전달하십시오(스크립트 및 비대화형 실행에 유용합니다). 이 옵션이 없으면 제거에 대화형 TTY가 필요합니다. `--dry-run`은 동일한 미리보기를 출력하고 확인 메시지를 표시하거나 변경하지 않은 채 종료합니다.

<Note>
`--keep-config`는 `--keep-files`의 지원 중단된 별칭으로 지원됩니다.
</Note>

## 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 관리형 Plugin 인덱스에서 추적되는 Plugin 설치와 `hooks.internal.installs`에서 추적되는 훅 팩 설치에 적용됩니다.

<AccordionGroup>
  <Accordion title="Plugin ID와 npm 사양 확인">
    Plugin ID를 전달하면 OpenClaw는 해당 Plugin에 기록된 설치 사양을 재사용합니다. 즉, 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된 버전은 이후 `update <id>` 실행에서도 계속 사용됩니다.

    `update <id> --dry-run` 중에는 정확히 고정된 npm 설치가 고정 상태로 유지됩니다. OpenClaw가 패키지의 레지스트리 기본 릴리스 라인도 확인할 수 있고 해당 기본 라인이 설치된 고정 버전보다 최신이면, 시험 실행에서 고정 상태를 보고하고 레지스트리 기본 라인을 따르기 위한 명시적인 `@latest` 패키지 업데이트 명령을 출력합니다.

    이 대상 지정 업데이트 규칙은 일괄 `openclaw plugins update --all` 유지 관리 경로와 다릅니다. 일괄 업데이트도 일반적인 추적 설치 사양을 준수하지만, 신뢰할 수 있는 공식 OpenClaw Plugin 레코드는 오래된 정확한 공식 패키지 버전에 머무르는 대신 현재 공식 카탈로그 대상으로 동기화될 수 있습니다. 정확한 버전이나 태그가 지정된 공식 사양을 의도적으로 변경하지 않으려면 대상 지정 `update <id>`를 사용하십시오.

    npm 설치의 경우 dist-tag 또는 정확한 버전이 포함된 명시적인 npm 패키지 사양을 전달할 수도 있습니다. OpenClaw는 해당 패키지 이름을 추적 중인 Plugin 레코드로 다시 확인하고, 설치된 Plugin을 업데이트한 다음, 이후 ID 기반 업데이트에 사용할 새 npm 사양을 기록합니다.

    버전이나 태그 없이 npm 패키지 이름을 전달해도 추적 중인 Plugin 레코드로 다시 확인됩니다. Plugin이 정확한 버전으로 고정되어 있고 이를 레지스트리의 기본 릴리스 라인으로 되돌리려면 이 방법을 사용하십시오.

  </Accordion>
  <Accordion title="베타 채널 업데이트">
    대상 지정 `openclaw plugins update <id-or-npm-spec>`는 새 사양을 전달하지 않는 한 추적 중인 Plugin 사양을 재사용합니다. 일괄 `openclaw plugins update --all`은 신뢰할 수 있는 공식 Plugin 레코드를 공식 카탈로그 대상으로 동기화할 때 구성된 `update.channel`을 사용하므로, 베타 채널 설치가 자동으로 안정/latest로 정규화되지 않고 베타 릴리스 라인을 유지할 수 있습니다.

    `openclaw update`도 활성 OpenClaw 업데이트 채널을 인식합니다. 베타 채널에서는 기본 릴리스 라인의 npm 및 ClawHub Plugin 레코드가 먼저 `@beta`를 시도합니다. Plugin 베타 릴리스가 없으면 기록된 default/latest 사양으로 대체하며, npm Plugin은 베타 패키지가 존재하지만 설치 검증에 실패하는 경우에도 대체합니다. 이 대체는 경고로 보고되며 코어 업데이트를 실패시키지 않습니다. 정확한 버전과 명시적 태그는 대상 지정 업데이트에서 해당 선택자로 계속 고정됩니다.

  </Accordion>
  <Accordion title="버전 검사 및 무결성 드리프트">
    실제 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm 레지스트리 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트 ID가 이미 확인된 대상과 일치하면 다운로드, 재설치 또는 `openclaw.json` 다시 쓰기 없이 업데이트를 건너뜁니다.

    저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면 OpenClaw는 이를 npm 아티팩트 드리프트로 처리합니다. 대화형 `openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고 계속하기 전에 확인을 요청합니다. 비대화형 업데이트 도우미는 호출자가 명시적인 계속 진행 정책을 제공하지 않는 한 안전하게 실패합니다.

  </Accordion>
  <Accordion title="업데이트 시 --dangerously-force-unsafe-install">
    호환성을 위해 `plugins update`에서도 `--dangerously-force-unsafe-install`을 허용하지만, 이 옵션은 지원 중단되었으며 더 이상 Plugin 업데이트 동작을 변경하지 않습니다. 운영자 `security.installPolicy`는 여전히 업데이트를 차단할 수 있습니다. Plugin `before_install` 훅은 Plugin 훅이 로드된 프로세스에서만 적용됩니다.
  </Accordion>
  <Accordion title="업데이트 시 --acknowledge-clawhub-risk">
    커뮤니티 ClawHub 기반 Plugin 업데이트는 대체 패키지를 다운로드하기 전에 설치와 동일한 정확한 릴리스 신뢰 검사를 실행합니다. 선택된 ClawHub 릴리스에 위험한 신뢰 경고가 있어도 계속 진행해야 하는 검토된 자동화에는 `--acknowledge-clawhub-risk`를 사용하십시오. 공식 ClawHub 패키지와 번들 OpenClaw Plugin 소스는 이 릴리스 신뢰 확인을 건너뜁니다.
  </Accordion>
</AccordionGroup>

## 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

검사는 기본적으로 Plugin 런타임을 가져오지 않고 ID, 로드 상태, 소스, 매니페스트 기능, 정책 플래그, 진단, 설치 메타데이터, 번들 기능 및 감지된 MCP 또는 LSP 서버 지원을 표시합니다. JSON 출력에는 `contracts.agentToolResultMiddleware` 및 `contracts.trustedToolPolicies`와 같은 Plugin 매니페스트 계약이 포함되므로, 운영자는 Plugin을 활성화하거나 다시 시작하기 전에 신뢰할 수 있는 표면 선언을 감사할 수 있습니다. Plugin 모듈을 로드하고 등록된 훅, 도구, 명령, 서비스, Gateway 메서드 및 HTTP 경로를 포함하려면 `--runtime`을 추가하십시오. 런타임 검사는 누락된 Plugin 종속성을 직접 보고하며, 설치와 복구는 `openclaw plugins install`, `openclaw plugins update` 및 `openclaw doctor --fix`에서 수행됩니다.

Plugin 소유 CLI 명령은 일반적으로 루트 `openclaw` 명령 그룹으로 설치되지만, Plugin은 `openclaw nodes` 같은 코어 상위 명령 아래에 중첩 명령을 등록할 수도 있습니다. `inspect --runtime`이 `cliCommands` 아래에 명령을 표시하면 나열된 경로에서 실행하십시오. 예를 들어 `demo-git`을 등록하는 Plugin은 `openclaw demo-git ping`으로 확인할 수 있습니다.

각 Plugin은 런타임에서 실제로 등록하는 항목에 따라 분류됩니다.

| 형태                | 의미                                                               |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 정확히 하나의 기능 유형(예: 공급자 전용 Plugin)                    |
| `hybrid-capability` | 둘 이상의 기능 유형(예: 텍스트 + 음성 + 이미지)                    |
| `hook-only`         | 훅만 있으며 기능, 도구, 명령, 서비스 또는 경로는 없음               |
| `non-capability`    | 도구/명령/서비스는 있지만 기능은 없음                               |

기능 모델에 관한 자세한 내용은 [Plugin 형태](/ko/plugins/architecture#plugin-shapes)를 참조하십시오.

<Note>
`--json` 플래그는 스크립팅과 감사에 적합한 기계 판독 가능 보고서를 출력합니다. `inspect --all`은 형태, 기능 종류, 호환성 알림, 번들 기능 및 훅 요약 열이 포함된 전체 Plugin 표를 렌더링합니다. `info`는 `inspect`의 별칭입니다.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor`는 Plugin 로드 오류, 매니페스트/검색 진단, 호환성 알림 및 누락된 Plugin 슬롯과 같은 오래된 Plugin 구성 참조를 보고합니다. 설치 트리와 Plugin 구성이 정상인 경우 `No plugin issues detected.`를 출력합니다. 오래된 구성이 남아 있지만 설치 트리가 그 외에는 정상인 경우, 요약에서는 Plugin이 완전히 정상이라고 암시하는 대신 해당 상태를 명시합니다.

구성된 Plugin이 디스크에 있지만 로더의 경로 안전성 검사에 의해 차단된 경우, 구성 검증은 Plugin 항목을 유지하고 이를 `present but blocked`로 보고합니다. `plugins.entries.<id>` 또는 `plugins.allow` 구성을 제거하는 대신 경로 소유권이나 모든 사용자의 쓰기 권한과 같은 앞선 차단 Plugin 진단 문제를 해결하십시오.

`register`/`activate` 내보내기 누락과 같은 모듈 형태 오류의 경우 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`을 사용하여 다시 실행하면 진단 출력에 간결한 내보내기 형태 요약이 포함됩니다.

## 레지스트리

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

로컬 Plugin 레지스트리는 설치된 Plugin의 ID, 활성화 상태, 소스 메타데이터 및 기여 항목 소유권을 위한 OpenClaw의 영구 콜드 읽기 모델입니다. 일반 시작, 공급자 소유자 조회, 채널 설정 분류 및 Plugin 인벤토리는 Plugin 런타임 모듈을 가져오지 않고 이를 읽을 수 있습니다.

`plugins registry`를 사용하여 영구 레지스트리가 존재하는지, 최신인지 또는 오래되었는지 검사하십시오. `--refresh`를 사용하면 영구 Plugin 인덱스, 구성 정책 및 매니페스트/패키지 메타데이터에서 레지스트리를 다시 빌드합니다. 이는 복구 경로이며 런타임 활성화 경로가 아닙니다.

`openclaw doctor --fix`는 레지스트리와 인접한 관리형 npm 드리프트도 복구합니다. 관리형 Plugin npm 프로젝트 또는 레거시 평면 관리형 npm 루트 아래에서 고립되었거나 복구된 `@openclaw/*` 패키지가 번들 Plugin을 가리는 경우, doctor는 해당 오래된 패키지를 제거하고 레지스트리를 다시 빌드하여 시작 시 번들 매니페스트를 기준으로 검증하도록 합니다. 또한 doctor는 `peerDependencies.openclaw`를 선언하는 관리형 npm Plugin에 호스트 `openclaw` 패키지를 다시 연결하여 업데이트 또는 npm 복구 후 `openclaw/plugin-sdk/*` 같은 패키지 로컬 런타임 가져오기가 확인되도록 합니다.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`은 레지스트리 읽기 실패에 대응하기 위한 지원 중단된 비상용 호환성 스위치입니다. `plugins registry --refresh` 또는 `openclaw doctor --fix`를 우선 사용하십시오. 환경 변수 대체 경로는 마이그레이션이 배포되는 동안 긴급 시작 복구에만 사용해야 합니다.
</Warning>

## 마켓플레이스

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

`plugins marketplace entries`는 구성된 OpenClaw 마켓플레이스 피드의 항목을 나열합니다. 기본적으로 호스팅된 피드를 사용하려고 시도하며, 실패하면 최근에 승인된 스냅샷 또는 번들 데이터로 대체합니다. 특정 구성 프로필을 읽으려면 `--feed-profile <name>`을 사용하고, 명시적인 호스팅 피드 URL을 읽으려면 `--feed-url <url>`을 사용하며, 피드를 가져오지 않고 최근에 승인된 스냅샷을 읽으려면 `--offline`을 사용하십시오.

`plugins marketplace refresh`는 구성된 호스팅 피드 스냅샷을 새로 고치고 OpenClaw가 호스팅 데이터, 호스팅 스냅샷 또는 번들 대체 데이터 중 무엇을 승인했는지 보고합니다. 호출자가 새 호스팅 페이로드가 고정된 체크섬과 일치하지 않으면 명령이 실패하도록 해야 할 때 `--expected-sha256`을 사용하십시오.

마켓플레이스 `list`는 로컬 마켓플레이스 경로, `marketplace.json` 경로, `owner/repo`와 같은 GitHub 축약형, GitHub 저장소 URL 또는 git URL을 허용합니다. `--json`은 확인된 소스 레이블과 함께 파싱된 마켓플레이스 매니페스트 및 Plugin 항목을 출력합니다.

마켓플레이스 새로 고침은 호스팅된 OpenClaw 마켓플레이스 피드를 로드하고
검증된 응답을 로컬 호스팅 피드 스냅샷으로 저장합니다. 옵션을 지정하지 않으면
구성된 기본 피드 프로필을 사용합니다. 특정 구성 프로필을 새로 고치려면
`--feed-profile <name>`을 사용하고, 명시적인 호스팅 피드 URL을 새로 고치려면
`--feed-url <url>`을 사용하며, 페이로드 체크섬이 일치하도록 요구하려면
`--expected-sha256 <sha256>`을 사용하고(`sha256:<hex>` 또는 64자로 된 순수 16진수
다이제스트), 머신 판독 가능 출력을 사용하려면 `--json`을 사용하십시오.
명시적인 호스팅 피드 URL에는 자격 증명, 쿼리 문자열 또는 프래그먼트가 포함되어서는
안 됩니다. 고정되지 않은 새로 고침은 명령 실패 없이 호스팅 스냅샷 또는 번들 대체
결과를 보고할 수 있습니다. 고정된 새로 고침은 새 호스팅 페이로드를 승인한 경우에만
성공하며, 호스팅 새로 고침이 성공했더라도 OpenClaw가 검증된 스냅샷을 저장할 수
없으면 실패합니다.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [CLI 참조](/ko/cli)
- [ClawHub](/ko/clawhub)
