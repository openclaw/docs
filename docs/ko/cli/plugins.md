---
read_when:
    - Gateway plugins 또는 호환 번들을 설치하거나 관리하려고 합니다
    - Plugin 로드 실패를 디버깅하려고 합니다
summary: '`openclaw plugins`용 CLI 참조(list, install, marketplace, uninstall, enable/disable, doctor)'
title: plugins
x-i18n:
    generated_at: "2026-04-23T14:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway plugins, hook pack, 그리고 호환 번들을 관리합니다.

관련 문서:

- Plugin 시스템: [Plugins](/ko/tools/plugin)
- 번들 호환성: [Plugin bundles](/ko/plugins/bundles)
- Plugin 매니페스트 + 스키마: [Plugin manifest](/ko/plugins/manifest)
- 보안 강화: [Security](/ko/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

번들된 plugins는 OpenClaw와 함께 제공됩니다. 일부는 기본적으로 활성화되어 있으며(예:
번들된 모델 provider, 번들된 음성 provider, 번들된 browser
plugin), 나머지는 `plugins enable`이 필요합니다.

네이티브 OpenClaw plugins는 인라인 JSON
Schema(`configSchema`, 비어 있어도 필요)가 포함된 `openclaw.plugin.json`을 제공해야 합니다.
호환 번들은 대신 자체 번들 매니페스트를 사용합니다.

`plugins list`는 `Format: openclaw` 또는 `Format: bundle`을 표시합니다. 자세한 list/info
출력은 번들 하위 유형(`codex`, `claude`, `cursor`)과 감지된 번들
capability도 함께 표시합니다.

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

이름만 있는 패키지는 먼저 ClawHub에서 확인한 뒤 npm을 확인합니다. 보안 참고:
plugin 설치는 코드를 실행하는 것과 같은 수준으로 취급하세요. 가능하면 버전을 고정하세요.

`plugins` 섹션이 단일 파일 `$include`를 기반으로 하는 경우, `plugins install/update/enable/disable/uninstall`은 해당 포함 파일에 직접 기록하고 `openclaw.json`은 건드리지 않습니다. 루트 include, include 배열, sibling override가 있는 include는 평탄화하지 않고 fail closed 됩니다. 지원되는 형태는 [Config includes](/ko/gateway/configuration)를 참조하세요.

구성이 유효하지 않으면 `plugins install`은 일반적으로 fail closed 되며 먼저
`openclaw doctor --fix`를 실행하라고 안내합니다. 문서화된 유일한 예외는
명시적으로
`openclaw.install.allowInvalidConfigRecovery`에 옵트인한 plugin을 위한 제한적인
번들 plugin 복구 경로입니다.

`--force`는 기존 설치 대상을 재사용하고 이미 설치된
plugin 또는 hook pack을 제자리에서 덮어씁니다. 새 로컬 경로, archive, ClawHub 패키지, npm artifact에서 동일한 id를 의도적으로 재설치할 때 사용하세요.
이미 추적 중인 npm plugin의 일반적인 업그레이드에는
`openclaw plugins update <id-or-npm-spec>`를 사용하는 것이 좋습니다.

이미 설치된 plugin id에 대해 `plugins install`을 실행하면 OpenClaw은
중단하고 일반 업그레이드에는 `plugins update <id-or-npm-spec>`를,
다른 소스에서 현재 설치를 실제로 덮어쓰려는 경우에는
`plugins install <package> --force`를 안내합니다.

`--pin`은 npm 설치에만 적용됩니다. `--marketplace`와는 함께 지원되지 않는데,
marketplace 설치는 npm spec 대신 marketplace 소스 메타데이터를 유지하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐에 대비한
비상용 옵션입니다. 내장 스캐너가 `critical` 결과를 보고해도 설치를 계속할 수 있게 하지만, plugin `before_install` hook 정책 차단은 **우회하지 않으며**
scan 실패도 우회하지 않습니다.

이 CLI 플래그는 plugin install/update 흐름에 적용됩니다. Gateway 기반 Skills
의존성 설치는 대응되는 `dangerouslyForceUnsafeInstall` 요청
override를 사용하며, `openclaw skills install`은 별도의 ClawHub skill
다운로드/설치 흐름으로 유지됩니다.

`plugins install`은 `package.json`에
`openclaw.hooks`를 노출하는 hook pack의 설치 표면이기도 합니다. 패키지 설치가 아니라
필터링된 hook 가시성과 hook별 활성화에는 `openclaw hooks`를 사용하세요.

npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 의존성 설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

이름만 있는 spec과 `@latest`는 안정 릴리스 트랙을 유지합니다. npm이 이 둘 중 하나를 프리릴리스로 해석하면, OpenClaw은 중단하고
`@beta`/`@rc` 같은 프리릴리스 태그나 `@1.2.3-beta.4` 같은 정확한 프리릴리스 버전으로 명시적으로 옵트인하라고 요청합니다.

이름만 있는 설치 spec이 번들 plugin id와 일치하면(예: `diffs`), OpenClaw은
번들 plugin을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면
명시적인 스코프 spec을 사용하세요(예: `@scope/diffs`).

지원되는 archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude marketplace 설치도 지원됩니다.

ClawHub 설치는 명시적인 `clawhub:<package>` locator를 사용합니다:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

이제 OpenClaw은 이름만 있는 npm-safe plugin spec에 대해서도 ClawHub를 우선 사용합니다. ClawHub에 해당 패키지나 버전이 없을 때만
npm으로 대체됩니다:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw은 ClawHub에서 패키지 archive를 다운로드하고, 광고된
plugin API / 최소 gateway 호환성을 확인한 뒤, 일반적인
archive 경로를 통해 설치합니다. 기록된 설치는 이후 업데이트를 위해 ClawHub 소스 메타데이터를 유지합니다.

marketplace 이름이 Claude의 로컬 레지스트리 캐시 `~/.claude/plugins/known_marketplaces.json`에 존재할 때는
`plugin@marketplace` 단축 구문을 사용하세요:

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

- `~/.claude/plugins/known_marketplaces.json`에 있는 Claude known-marketplace 이름
- 로컬 marketplace 루트 또는 `marketplace.json` 경로
- `owner/repo` 같은 GitHub repo 축약형
- `https://github.com/owner/repo` 같은 GitHub repo URL
- git URL

GitHub 또는 git에서 로드된 원격 marketplace의 경우, plugin 항목은 클론된 marketplace repo 내부에 머물러야 합니다. OpenClaw은 해당 repo의 상대 경로 소스를 허용하고, 원격 매니페스트의 HTTP(S), 절대 경로, git, GitHub 및 기타 비경로 plugin 소스는 거부합니다.

로컬 경로와 archive에 대해 OpenClaw은 다음을 자동 감지합니다:

- 네이티브 OpenClaw plugins (`openclaw.plugin.json`)
- Codex 호환 번들 (`.codex-plugin/plugin.json`)
- Claude 호환 번들 (`.claude-plugin/plugin.json` 또는 기본 Claude
  컴포넌트 레이아웃)
- Cursor 호환 번들 (`.cursor-plugin/plugin.json`)

호환 번들은 일반 plugin 루트에 설치되며
동일한 list/info/enable/disable 흐름에 참여합니다. 현재는 번들 Skills, Claude
command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` /
매니페스트 선언 `lspServers` 기본값, Cursor command-skills, 호환
Codex hook 디렉터리를 지원합니다. 그 외 감지된 번들 capability는
진단/info에는 표시되지만 아직 런타임 실행에는 연결되어 있지 않습니다.

### 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

로드된 plugins만 보려면 `--enabled`를 사용하세요. `--verbose`는
테이블 보기 대신 plugin별 상세 줄로 전환하여 source/origin/version/activation
메타데이터를 표시합니다. `--json`은 기계가 읽을 수 있는 inventory와 registry
진단 정보를 제공합니다.

로컬 디렉터리를 복사하지 않으려면 `--link`를 사용하세요(`plugins.load.paths`에 추가):

```bash
openclaw plugins install -l ./my-plugin
```

링크 설치는 관리형 설치 대상을 덮어쓰지 않고
소스 경로를 재사용하므로 `--link`와 함께 `--force`는 지원되지 않습니다.

npm 설치에서 `--pin`을 사용하면 기본 동작은 고정하지 않은 상태로 유지하면서
해결된 정확한 spec(`name@version`)을 `plugins.installs`에 저장합니다.

### 제거

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 적용 가능한 경우 `plugins.entries`, `plugins.installs`,
plugin 허용 목록, 링크된 `plugins.load.paths` 항목에서 plugin 기록을 제거합니다.
Active Memory plugin의 경우 memory 슬롯은 `memory-core`로 재설정됩니다.

기본적으로 uninstall은 활성
state-dir plugin 루트 아래의 plugin 설치 디렉터리도 제거합니다.
디스크의 파일을 유지하려면 `--keep-files`를 사용하세요.

`--keep-config`는 더 이상 권장되지 않는 `--keep-files` 별칭으로 지원됩니다.

### 업데이트

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

업데이트는 `plugins.installs`에 있는 추적 설치와 `hooks.internal.installs`에 있는 추적 hook-pack
설치에 적용됩니다.

plugin id를 전달하면 OpenClaw은 해당
plugin에 대해 기록된 설치 spec을 재사용합니다. 즉 이전에 저장된 `@beta` 같은 dist-tag와 정확히 고정된 버전이 이후 `update <id>` 실행에서도 계속 사용됩니다.

npm 설치의 경우 dist-tag
또는 정확한 버전이 포함된 명시적인 npm 패키지 spec을 전달할 수도 있습니다. OpenClaw은 그 패키지 이름을 추적된 plugin
기록으로 다시 해석하고, 설치된 plugin을 업데이트하며, 이후
id 기반 업데이트를 위해 새 npm spec을 기록합니다.

버전이나 태그가 없는 npm 패키지 이름을 전달해도 추적된 plugin 기록으로 다시 해석됩니다. plugin이 정확한 버전으로 고정되어 있었고
레지스트리의 기본 릴리스 라인으로 되돌리고 싶을 때 사용하세요.

라이브 npm 업데이트 전에 OpenClaw은 설치된 패키지 버전을
npm 레지스트리 메타데이터와 대조합니다. 설치된 버전과 기록된 artifact
식별자가 이미 해결된 대상과 일치하면, 업데이트는 다운로드,
재설치, `openclaw.json` 재작성 없이 건너뜁니다.

저장된 무결성 해시가 있는데 가져온 artifact 해시가 변경되면,
OpenClaw은 이를 npm artifact 드리프트로 취급합니다. 대화형
`openclaw plugins update` 명령은 예상 해시와 실제 해시를 출력하고
계속 진행하기 전에 확인을 요청합니다. 비대화형 업데이트 헬퍼는
호출자가 명시적인 계속 진행 정책을 제공하지 않으면 fail closed 됩니다.

`--dangerously-force-unsafe-install`은
plugin 업데이트 중 내장 위험 코드 스캔 오탐에 대한 비상용 override로 `plugins update`에서도 사용할 수 있습니다. 여전히 plugin `before_install` 정책 차단이나 scan-failure 차단은 우회하지 않으며, hook-pack
업데이트가 아니라 plugin 업데이트에만 적용됩니다.

### 검사

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

단일 plugin에 대한 심층 검사입니다. identity, load status, source,
등록된 capability, hooks, tools, commands, services, gateway methods,
HTTP routes, 정책 플래그, 진단 정보, 설치 메타데이터, 번들 capability,
그리고 감지된 MCP 또는 LSP 서버 지원을 표시합니다.

각 plugin은 실제로 런타임에 등록하는 항목에 따라 분류됩니다:

- **plain-capability** — 하나의 capability 유형만 가짐(예: provider 전용 plugin)
- **hybrid-capability** — 여러 capability 유형을 가짐(예: 텍스트 + 음성 + 이미지)
- **hook-only** — capability나 surface 없이 hook만 가짐
- **non-capability** — capability는 없고 tools/commands/services만 가짐

capability 모델에 대한 자세한 내용은 [Plugin shapes](/ko/plugins/architecture#plugin-shapes)를 참조하세요.

`--json` 플래그는 스크립트 작성과
감사에 적합한 기계가 읽을 수 있는 보고서를 출력합니다.

`inspect --all`은 shape, capability 종류,
호환성 알림, 번들 capability, hook 요약 열이 포함된 플릿 전체 테이블을 렌더링합니다.

`info`는 `inspect`의 별칭입니다.

### Doctor

```bash
openclaw plugins doctor
```

`doctor`는 plugin 로드 오류, 매니페스트/탐색 진단,
호환성 알림을 보고합니다. 모든 것이 정상이면 `No plugin issues
detected.`를 출력합니다.

`register`/`activate` export 누락 같은 module-shape 실패의 경우,
진단 출력에 간결한 export-shape 요약을 포함하려면
`OPENCLAW_PLUGIN_LOAD_DEBUG=1`과 함께 다시 실행하세요.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 목록은 로컬 marketplace 경로, `marketplace.json` 경로,
`owner/repo` 같은 GitHub 축약형, GitHub repo URL, 또는 git URL을 받을 수 있습니다. `--json`은
해결된 소스 레이블과 파싱된 marketplace 매니페스트 및
plugin 항목을 출력합니다.
