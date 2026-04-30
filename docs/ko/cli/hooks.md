---
read_when:
    - 에이전트 훅을 관리하려는 경우
    - 후크 사용 가능 여부를 확인하거나 워크스페이스 후크를 활성화하려는 경우
summary: '`openclaw hooks`(에이전트 훅)에 대한 CLI 참조'
title: 후크
x-i18n:
    generated_at: "2026-04-30T06:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

`/new`, `/reset`, Gateway 시작 같은 명령을 위한 이벤트 기반 자동화인 에이전트 훅을 관리합니다.

하위 명령 없이 `openclaw hooks`를 실행하는 것은 `openclaw hooks list`와 같습니다.

관련 항목:

- 훅: [훅](/ko/automation/hooks)
- Plugin 훅: [Plugin 훅](/ko/plugins/hooks)

## 모든 훅 나열

```bash
openclaw hooks list
```

워크스페이스, 관리형, 추가, 번들 디렉터리에서 발견된 모든 훅을 나열합니다.
Gateway 시작은 내부 훅이 하나 이상 구성될 때까지 내부 훅 핸들러를 로드하지 않습니다.

**옵션:**

- `--eligible`: 요건을 충족한 적격 훅만 표시합니다
- `--json`: JSON으로 출력합니다
- `-v, --verbose`: 누락된 요건을 포함한 자세한 정보를 표시합니다

**예시 출력:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**예시(자세히):**

```bash
openclaw hooks list --verbose
```

부적격 훅의 누락된 요건을 표시합니다.

**예시(JSON):**

```bash
openclaw hooks list --json
```

프로그래밍 방식으로 사용할 수 있는 구조화된 JSON을 반환합니다.

## 훅 정보 가져오기

```bash
openclaw hooks info <name>
```

특정 훅에 대한 자세한 정보를 표시합니다.

**인수:**

- `<name>`: 훅 이름 또는 훅 키(예: `session-memory`)

**옵션:**

- `--json`: JSON으로 출력합니다

**예시:**

```bash
openclaw hooks info session-memory
```

**출력:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 훅 적격성 확인

```bash
openclaw hooks check
```

훅 적격성 상태의 요약을 표시합니다(준비됨과 준비되지 않음의 개수).

**옵션:**

- `--json`: JSON으로 출력합니다

**예시 출력:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 훅 활성화

```bash
openclaw hooks enable <name>
```

config(기본값은 `~/.openclaw/openclaw.json`)에 추가하여 특정 훅을 활성화합니다.

**참고:** 워크스페이스 훅은 여기 또는 config에서 활성화하기 전까지 기본적으로 비활성화됩니다. Plugin이 관리하는 훅은 `openclaw hooks list`에 `plugin:<id>`로 표시되며 여기서는 활성화/비활성화할 수 없습니다. 대신 Plugin을 활성화/비활성화하세요.

**인수:**

- `<name>`: 훅 이름(예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ Enabled hook: 💾 session-memory
```

**수행 작업:**

- 훅이 존재하고 적격인지 확인합니다
- config에서 `hooks.internal.entries.<name>.enabled = true`를 업데이트합니다
- config를 디스크에 저장합니다

훅이 `<workspace>/hooks/`에서 온 경우 Gateway가 이를 로드하기 전에
이 옵트인 단계가 필요합니다.

**활성화 후:**

- 훅이 다시 로드되도록 Gateway를 다시 시작합니다(macOS에서는 메뉴 막대 앱 재시작, 또는 dev 환경에서는 Gateway 프로세스 재시작).

## 훅 비활성화

```bash
openclaw hooks disable <name>
```

config를 업데이트하여 특정 훅을 비활성화합니다.

**인수:**

- `<name>`: 훅 이름(예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ Disabled hook: 📝 command-logger
```

**비활성화 후:**

- 훅이 다시 로드되도록 Gateway를 다시 시작합니다

## 참고

- `openclaw hooks list --json`, `info --json`, `check --json`는 구조화된 JSON을 stdout에 직접 씁니다.
- Plugin이 관리하는 훅은 여기서 활성화하거나 비활성화할 수 없습니다. 대신 소유 Plugin을 활성화하거나 비활성화하세요.

## 훅 팩 설치

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

통합 Plugin 설치 관리자를 통해 훅 팩을 설치합니다.

`openclaw hooks install`은 호환성 별칭으로 계속 작동하지만, 지원 중단 경고를 출력하고 `openclaw plugins install`로 전달합니다.

Npm 사양은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file 사양과 semver 범위는 거부됩니다. 의존성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 `--ignore-scripts`를 사용하여 프로젝트 로컬로 실행됩니다.

단순 사양과 `@latest`는 안정 트랙에 유지됩니다. npm이 이 둘 중 하나를 프리릴리스로 해석하면 OpenClaw는 중지하고 `@beta`/`@rc` 같은 프리릴리스 태그 또는 정확한 프리릴리스 버전으로 명시적으로 옵트인하도록 요청합니다.

**수행 작업:**

- 훅 팩을 `~/.openclaw/hooks/<id>`로 복사합니다
- 설치된 훅을 `hooks.internal.entries.*`에서 활성화합니다
- 설치 내역을 `hooks.internal.installs` 아래에 기록합니다

**옵션:**

- `-l, --link`: 로컬 디렉터리를 복사하지 않고 링크합니다(`hooks.internal.load.extraDirs`에 추가)
- `--pin`: npm 설치를 `hooks.internal.installs`에 정확히 해석된 `name@version`으로 기록합니다

**지원되는 아카이브:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**예시:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

링크된 훅 팩은 워크스페이스 훅이 아니라 운영자가 구성한 디렉터리의 관리형 훅으로 취급됩니다.

## 훅 팩 업데이트

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

통합 Plugin 업데이트 도구를 통해 추적 중인 npm 기반 훅 팩을 업데이트합니다.

`openclaw hooks update`는 호환성 별칭으로 계속 작동하지만, 지원 중단 경고를 출력하고 `openclaw plugins update`로 전달합니다.

**옵션:**

- `--all`: 추적 중인 모든 훅 팩을 업데이트합니다
- `--dry-run`: 실제로 쓰지 않고 변경될 내용을 표시합니다

저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경된 경우, OpenClaw는 경고를 출력하고 계속하기 전에 확인을 요청합니다. CI/비대화형 실행에서 프롬프트를 건너뛰려면 전역 `--yes`를 사용하세요.

## 번들 훅

### session-memory

`/new` 또는 `/reset`을 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**활성화:**

```bash
openclaw hooks enable session-memory
```

**출력:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**참조:** [session-memory 문서](/ko/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 중에 추가 부트스트랩 파일(예: 모노레포 로컬 `AGENTS.md` / `TOOLS.md`)을 주입합니다.

**활성화:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**참조:** [bootstrap-extra-files 문서](/ko/automation/hooks#bootstrap-extra-files)

### command-logger

모든 명령 이벤트를 중앙 감사 파일에 기록합니다.

**활성화:**

```bash
openclaw hooks enable command-logger
```

**출력:** `~/.openclaw/logs/commands.log`

**로그 보기:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**참조:** [command-logger 문서](/ko/automation/hooks#command-logger)

### boot-md

Gateway가 시작될 때(채널이 시작된 후) `BOOT.md`를 실행합니다.

**이벤트**: `gateway:startup`

**활성화**:

```bash
openclaw hooks enable boot-md
```

**참조:** [boot-md 문서](/ko/automation/hooks#boot-md)

## 관련 항목

- [CLI 참조](/ko/cli)
- [자동화 훅](/ko/automation/hooks)
