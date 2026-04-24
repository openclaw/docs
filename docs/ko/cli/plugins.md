---
read_when:
    - Gateway 플러그인 또는 호환 번들을 설치하거나 관리하려는 경우
    - 플러그인 로드 실패를 디버그하려는 경우
summary: '`openclaw plugins`용 CLI 참조 (`list`, `install`, `marketplace`, `uninstall`, `enable/disable`, `doctor`)'
title: 플러그인
x-i18n:
    generated_at: "2026-04-24T15:21:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway 플러그인, hook pack, 호환 번들을 관리합니다.

관련 항목:

- Plugin 시스템: [플러그인](/ko/tools/plugin)
- 번들 호환성: [플러그인 번들](/ko/plugins/bundles)
- Plugin 매니페스트 + 스키마: [Plugin 매니페스트](/ko/plugins/manifest)
- 보안 강화: [보안](/ko/gateway/security)

## 명령어

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

번들 플러그인은 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있으며(예:
번들 모델 provider, 번들 음성 provider, 번들 브라우저
plugin), 나머지는 `plugins enable`이 필요합니다.

네이티브 OpenClaw 플러그인은 인라인 JSON
Schema(`configSchema`, 비어 있더라도 포함)를 갖춘 `openclaw.plugin.json`을 포함해야 합니다. 호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 목록/정보
출력에는 번들 하위 유형(`codex`, `claude`, `cursor`)과 감지된 번들
capability도 표시됩니다.

### 설치

```bash
openclaw plugins install <package>                      # 먼저 ClawHub, 그다음 npm
openclaw plugins install clawhub:<package>              # ClawHub만
openclaw plugins install <package> --force              # 기존 설치 덮어쓰기
openclaw plugins install <package> --pin                # 버전 고정
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 로컬 경로
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (명시적)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

범용 패키지 이름은 먼저 ClawHub에서 확인한 뒤 npm을 확인합니다. 보안 참고:
플러그인 설치는 코드를 실행하는 것처럼 취급하세요. 가능하면 버전을 고정하는 것을 권장합니다.

`plugins` 섹션이 단일 파일 `$include`로 구성된 경우, `plugins install/update/enable/disable/uninstall`은 해당 include된 파일에 직접 기록하고 `openclaw.json`은 변경하지 않습니다. 루트 include, include 배열, 형제 override가 있는 include는 평탄화하지 않고 닫힌 형태로 실패합니다. 지원되는 형태는 [Config includes](/ko/gateway/configuration)를 참조하세요.

config가 유효하지 않으면 `plugins install`은 일반적으로 닫힌 형태로 실패하며 먼저
`openclaw doctor --fix`를 실행하라고 안내합니다. 문서화된 유일한 예외는
명시적으로
`openclaw.install.allowInvalidConfigRecovery`를 opt-in한 플러그인에 대한 제한적인
번들 플러그인 복구 경로입니다.

`--force`는 기존 설치 대상을 재사용하고 이미 설치된
plugin 또는 hook pack을 제자리에서 덮어씁니다. 동일한 id를 새 로컬 경로, 아카이브, ClawHub 패키지, npm 아티팩트에서 의도적으로 다시 설치할 때 사용하세요.
이미 추적 중인 npm plugin의 일반적인 업그레이드에는
`openclaw plugins update <id-or-npm-spec>`를 사용하는 것이 좋습니다.

이미 설치된 plugin id에 대해 `plugins install`을 실행하면 OpenClaw는
중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를,
다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우에는
`plugins install <package> --force`를 사용하라고 안내합니다.

`--pin`은 npm 설치에만 적용됩니다. marketplace 설치는
npm spec 대신 marketplace 소스 메타데이터를 유지하므로 `--marketplace`와 함께 지원되지
않습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐에 대비한
비상 옵션입니다. 내장 스캐너가 `critical` 발견 사항을 보고하더라도 설치를 계속할 수 있게 하지만,
plugin의 `before_install` hook 정책 차단을 우회하지 않으며 scan
실패도 우회하지 않습니다.

이 CLI 플래그는 plugin 설치/업데이트 흐름에 적용됩니다. Gateway 기반 skill
의존성 설치는 이에 대응하는 `dangerouslyForceUnsafeInstall` 요청
override를 사용하며, `openclaw skills install`은 별도의 ClawHub skill
다운로드/설치 흐름으로 유지됩니다.

`plugins install`은 `package.json`에서 `openclaw.hooks`를 노출하는 hook pack의
설치 진입점이기도 합니다. 패키지 설치가 아니라 필터링된 hook
표시와 개별 hook 활성화에는 `openclaw hooks`를 사용하세요.

npm spec은 **registry 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 의존성
설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

범용 spec과 `@latest`는 안정 릴리스 트랙을 유지합니다. npm이 이 둘 중 하나를 prerelease로 해석하면 OpenClaw는 중단하고
`@beta`/`@rc` 같은 prerelease 태그나
`@1.2.3-beta.4` 같은 정확한 prerelease 버전으로 명시적으로 opt-in하라고 요청합니다.

범용 설치 spec이 번들 plugin id(예: `diffs`)와 일치하면 OpenClaw는
번들 plugin을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면
명시적인 scope spec(예: `@scope/diffs`)을 사용하세요.

지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace 설치도 지원됩니다.

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

이제 OpenClaw는 범용 npm-safe plugin spec에 대해서도 ClawHub를 우선 사용합니다. ClawHub에 해당 패키지나 버전이 없는 경우에만
npm으로 대체합니다:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw는 ClawHub에서 패키지 아카이브를 다운로드하고, 게시된
plugin API / 최소 gateway 호환성을 확인한 다음, 일반 아카이브 경로를 통해 설치합니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터를 유지합니다.

marketplace 이름이 Claude의 로컬 registry 캐시 `~/.claude/plugins/known_marketplaces.json`에 존재할 경우 `plugin@marketplace`
축약형을 사용하세요:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace 소스를 명시적으로 전달하려면 `--marketplace`를 사용하세요:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplace 소스는 다음 중 하나일 수 있습니다:

- `~/.claude/plugins/known_marketplaces.json`의 Claude known-marketplace 이름
- 로컬 marketplace 루트 또는 `marketplace.json` 경로
- `owner/repo` 같은 GitHub repo 축약형
- `https://github.com/owner/repo` 같은 GitHub repo URL
- git URL

GitHub 또는 git에서 로드한 원격 marketplace의 경우, plugin 항목은 복제된 marketplace repo 내부에
머물러야 합니다. OpenClaw는 해당 repo의 상대 경로 소스를 허용하고,
원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 비경로
plugin 소스는 거부합니다.

로컬 경로와 아카이브의 경우 OpenClaw는 다음을 자동 감지합니다:

- 네이티브 OpenClaw 플러그인 (`openclaw.plugin.json`)
- Codex 호환 번들 (`.codex-plugin/plugin.json`)
- Claude 호환 번들 (`.claude-plugin/plugin.json` 또는 기본 Claude
  컴포넌트 레이아웃)
- Cursor 호환 번들 (`.cursor-plugin/plugin.json`)

호환 번들은 일반 plugin 루트에 설치되며
동일한 list/info/enable/disable 흐름에 참여합니다. 현재는 번들 Skills, Claude
command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` /
매니페스트에 선언된 `lspServers` 기본값, Cursor command-skills, 호환
Codex hook 디렉터리가 지원됩니다. 그 외 감지된 번들 capability는
진단/info에 표시되지만 아직 런타임 실행에 연결되어 있지는 않습니다.

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

로드된 plugin만 표시하려면 `--enabled`를 사용하세요. `--verbose`를 사용하면
표 형식 보기에서 plugin별 상세 행으로 전환되어 source/origin/version/activation
메타데이터를 확인할 수 있습니다. `--json`은 machine-readable 인벤토리와 registry
진단 정보를 제공합니다.

`plugins list`는 현재 CLI 환경과 config에서 검색을 실행합니다. 이는
plugin이 활성화/로드 가능한지 확인하는 데 유용하지만, 이미 실행 중인 Gateway 프로세스에 대한 라이브 런타임 probe는 아닙니다. plugin 코드,
활성화 상태, hook 정책, `plugins.load.paths`를 변경한 후에는 새 `register(api)` 코드나 hook이 실행되기를 기대하기 전에
해당 채널을 제공하는 Gateway를 다시 시작하세요.
원격/컨테이너 배포의 경우 래퍼 프로세스만이 아니라 실제
`openclaw gateway run` 자식을 다시 시작하고 있는지 확인하세요.

런타임 hook 디버깅:

- `openclaw plugins inspect <id> --json`은 모듈 로드 검사 패스에서 얻은 등록된 hook과 진단 정보를 표시합니다.
- `openclaw gateway status --deep --require-rpc`는 연결 가능한 Gateway,
  서비스/프로세스 힌트, config 경로, RPC 상태를 확인합니다.
- 번들되지 않은 대화 hook(`llm_input`, `llm_output`, `agent_end`)에는
  `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.

로컬 디렉터리를 복사하지 않고(`plugins.load.paths`에 추가) 사용하려면 `--link`를 사용하세요:

```bash
openclaw plugins install -l ./my-plugin
```

링크 설치는 관리되는 설치 대상을 덮어쓰는 대신 소스 경로를 재사용하므로 `--link`와 함께 `--force`는 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서
확정된 정확한 spec(`name@version`)을 `plugins.installs`에 저장할 수 있습니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 `plugins.entries`, `plugins.installs`,
plugin allowlist, 그리고 해당되는 경우 연결된 `plugins.load.paths` 항목에서 plugin 기록을 제거합니다.
Active Memory 플러그인의 경우 메모리 슬롯은 `memory-core`로 재설정됩니다.

기본적으로 uninstall은 활성
state-dir plugin 루트 아래의 plugin 설치 디렉터리도 제거합니다.
디스크에 파일을 유지하려면
`--keep-files`를 사용하세요.

`--keep-config`는 더 이상 권장되지 않는 `--keep-files`의 별칭으로 지원됩니다.

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 `plugins.installs`의 추적된 설치와 `hooks.internal.installs`의 추적된 hook-pack
설치에 적용됩니다.

plugin id를 전달하면 OpenClaw는 해당
plugin에 대해 기록된 설치 spec을 재사용합니다. 즉 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된
버전은 이후 `update <id>` 실행에서도 계속 사용됩니다.

npm 설치의 경우 dist-tag
또는 정확한 버전을 포함한 명시적 npm 패키지 spec도 전달할 수 있습니다. OpenClaw는 해당 패키지 이름을 다시 추적된 plugin
기록에 매핑하고, 설치된 plugin을 업데이트한 뒤, 향후
id 기반 업데이트를 위해 새 npm spec을 기록합니다.

버전이나 태그 없이 npm 패키지 이름을 전달해도 추적된
plugin 기록으로 다시 해석됩니다. plugin이 정확한 버전에 고정되어 있었고
이를 registry의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

실제 npm 업데이트 전에 OpenClaw는 설치된 패키지 버전을 npm registry 메타데이터와 비교합니다. 설치된 버전과 기록된 아티팩트
식별자가 이미 해석된 대상과 일치하면, 다운로드, 재설치, `openclaw.json` 재작성 없이
업데이트를 건너뜁니다.

저장된 무결성 해시가 존재하는데 가져온 아티팩트 해시가 변경되면,
OpenClaw는 이를 npm 아티팩트 드리프트로 처리합니다. 대화형
`openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고
계속 진행하기 전에 확인을 요청합니다. 비대화형 업데이트 도우미는
호출자가 명시적인 계속 진행 정책을 제공하지 않는 한 닫힌 형태로 실패합니다.

`--dangerously-force-unsafe-install`은 plugin 업데이트 중 내장 위험 코드 스캔의 오탐에 대한
비상 override로 `plugins update`에서도 사용할 수 있습니다.
여전히 plugin `before_install` 정책 차단이나
스캔 실패 차단은 우회하지 않으며,
hook-pack 업데이트가 아니라 plugin 업데이트에만 적용됩니다.

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

단일 plugin에 대한 심층 introspection입니다. ID, 로드 상태, 소스,
등록된 capability, hook, tool, command, service, gateway 메서드,
HTTP 라우트, 정책 플래그, 진단, 설치 메타데이터, 번들 capability,
그리고 감지된 MCP 또는 LSP 서버 지원을 표시합니다.

각 plugin은 런타임에 실제로 등록하는 항목을 기준으로 분류됩니다:

- **plain-capability** — capability 유형 하나만 등록함(예: provider 전용 plugin)
- **hybrid-capability** — 여러 capability 유형을 등록함(예: 텍스트 + 음성 + 이미지)
- **hook-only** — capability나 surface 없이 hook만 있음
- **non-capability** — capability 없이 tool/command/service만 있음

capability 모델에 대한 자세한 내용은 [Plugin shapes](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

`--json` 플래그는 스크립팅과 감사에 적합한 machine-readable 보고서를 출력합니다.

`inspect --all`은 shape, capability 종류,
호환성 알림, 번들 capability, hook 요약 열이 포함된 전체 플릿 테이블을 렌더링합니다.

`info`는 `inspect`의 별칭입니다.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 plugin 로드 오류, manifest/discovery 진단,
호환성 알림을 보고합니다. 모든 것이 정상이면 `No plugin issues
detected.`를 출력합니다.

`register`/`activate` export 누락 같은 모듈 형태 실패의 경우,
진단 출력에 압축된 export 형태 요약을 포함하려면
`OPENCLAW_PLUGIN_LOAD_DEBUG=1`과 함께 다시 실행하세요.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 목록은 로컬 marketplace 경로, `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub repo URL, 또는 git URL을 받을 수 있습니다. `--json`은
확인된 소스 레이블과 파싱된 marketplace manifest 및
plugin 항목을 출력합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [플러그인 빌드](/ko/plugins/building-plugins)
- [커뮤니티 플러그인](/ko/plugins/community)
