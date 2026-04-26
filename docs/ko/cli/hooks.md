---
read_when:
    - 에이전트 hooks를 관리하려고 합니다.
    - hook 사용 가능 여부를 확인하거나 워크스페이스 hooks를 활성화하려고 합니다.
summary: '`openclaw hooks`에 대한 CLI 참조(agent hooks)'
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

에이전트 hooks를 관리합니다(`/new`, `/reset`, Gateway 시작 같은 명령에 대한 이벤트 기반 자동화).

하위 명령 없이 `openclaw hooks`를 실행하면 `openclaw hooks list`와 같습니다.

관련 항목:

- Hooks: [Hooks](/ko/automation/hooks)
- Plugin hooks: [Plugin hooks](/ko/plugins/hooks)

## 모든 Hook 나열

```bash
openclaw hooks list
```

워크스페이스, managed, extra, bundled 디렉터리에서 발견된 모든 hook을 나열합니다.
Gateway 시작 시에는 내부 hook이 하나 이상 구성되기 전까지 내부 hook 핸들러를 로드하지 않습니다.

**옵션:**

- `--eligible`: 사용 가능한 hook만 표시(요구 사항 충족)
- `--json`: JSON으로 출력
- `-v, --verbose`: 누락된 요구 사항을 포함한 자세한 정보 표시

**출력 예시:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway 시작 시 BOOT.md 실행
  📎 bootstrap-extra-files ✓ - 에이전트 bootstrap 중 추가 워크스페이스 bootstrap 파일 주입
  📝 command-logger ✓ - 모든 명령 이벤트를 중앙 감사 파일에 기록
  💾 session-memory ✓ - /new 또는 /reset 명령이 실행될 때 세션 컨텍스트를 메모리에 저장
```

**예시(상세):**

```bash
openclaw hooks list --verbose
```

사용할 수 없는 hook에 대한 누락된 요구 사항을 표시합니다.

**예시(JSON):**

```bash
openclaw hooks list --json
```

프로그래밍 방식으로 사용할 수 있도록 구조화된 JSON을 반환합니다.

## Hook 정보 가져오기

```bash
openclaw hooks info <name>
```

특정 hook에 대한 자세한 정보를 표시합니다.

**인수:**

- `<name>`: Hook 이름 또는 hook 키(예: `session-memory`)

**옵션:**

- `--json`: JSON으로 출력

**예시:**

```bash
openclaw hooks info session-memory
```

**출력:**

```
💾 session-memory ✓ Ready

/new 또는 /reset 명령이 실행될 때 세션 컨텍스트를 메모리에 저장

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Hook 사용 가능 상태 확인

```bash
openclaw hooks check
```

hook 사용 가능 상태 요약(준비됨과 준비되지 않음의 개수)을 표시합니다.

**옵션:**

- `--json`: JSON으로 출력

**출력 예시:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Hook 활성화

```bash
openclaw hooks enable <name>
```

구성(기본값: `~/.openclaw/openclaw.json`)에 추가하여 특정 hook을 활성화합니다.

**참고:** 워크스페이스 hook은 여기서 또는 구성에서 활성화하기 전까지 기본적으로 비활성화되어 있습니다. Plugin이 관리하는 hook은 `openclaw hooks list`에서 `plugin:<id>`로 표시되며 여기서 활성화/비활성화할 수 없습니다. 대신 Plugin을 활성화/비활성화하세요.

**인수:**

- `<name>`: Hook 이름(예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ Enabled hook: 💾 session-memory
```

**동작:**

- hook이 존재하고 사용 가능한지 확인
- 구성의 `hooks.internal.entries.<name>.enabled = true` 업데이트
- 구성을 디스크에 저장

hook이 `<workspace>/hooks/`에서 온 경우, Gateway가 이를 로드하려면 이 opt-in 단계가 필요합니다.

**활성화 후:**

- hook이 다시 로드되도록 Gateway를 재시작하세요(macOS에서는 메뉴 막대 앱 재시작, 개발 환경에서는 Gateway 프로세스 재시작).

## Hook 비활성화

```bash
openclaw hooks disable <name>
```

구성을 업데이트하여 특정 hook을 비활성화합니다.

**인수:**

- `<name>`: Hook 이름(예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ Disabled hook: 📝 command-logger
```

**비활성화 후:**

- hook이 다시 로드되도록 Gateway를 재시작하세요

## 참고

- `openclaw hooks list --json`, `info --json`, `check --json`은 구조화된 JSON을 stdout에 직접 기록합니다.
- Plugin이 관리하는 hook은 여기서 활성화하거나 비활성화할 수 없습니다. 대신 해당 Plugin을 활성화하거나 비활성화하세요.

## Hook 팩 설치

```bash
openclaw plugins install <package>        # ClawHub 우선, 그다음 npm
openclaw plugins install <package> --pin  # 버전 고정
openclaw plugins install <path>           # 로컬 경로
```

통합 plugins 설치 프로그램을 통해 hook 팩을 설치합니다.

`openclaw hooks install`도 호환성 별칭으로 계속 동작하지만, 지원 중단 경고를 출력하고 `openclaw plugins install`로 전달합니다.

npm 사양은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file 사양과 semver 범위는 거부됩니다. 의존성 설치는 셸에 전역 npm 설치 설정이 있더라도 안전을 위해 `--ignore-scripts`와 함께 프로젝트 로컬에서 실행됩니다.

기본 사양과 `@latest`는 안정 트랙에 유지됩니다. npm이 이 둘 중 하나를 prerelease로 해석하면 OpenClaw는 중단하고 `@beta`/`@rc` 같은 prerelease 태그 또는 정확한 prerelease 버전으로 명시적으로 opt-in하라고 요청합니다.

**동작:**

- hook 팩을 `~/.openclaw/hooks/<id>`에 복사
- 설치된 hook을 `hooks.internal.entries.*`에서 활성화
- 설치 내용을 `hooks.internal.installs`에 기록

**옵션:**

- `-l, --link`: 로컬 디렉터리를 복사하지 않고 링크(`hooks.internal.load.extraDirs`에 추가)
- `--pin`: npm 설치를 `hooks.internal.installs`에 정확히 해석된 `name@version`으로 기록

**지원되는 아카이브:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**예시:**

```bash
# 로컬 디렉터리
openclaw plugins install ./my-hook-pack

# 로컬 아카이브
openclaw plugins install ./my-hook-pack.zip

# NPM 패키지
openclaw plugins install @openclaw/my-hook-pack

# 복사하지 않고 로컬 디렉터리 링크
openclaw plugins install -l ./my-hook-pack
```

링크된 hook 팩은 워크스페이스 hook이 아니라 운영자가 구성한 디렉터리의 managed hook으로 처리됩니다.

## Hook 팩 업데이트

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

통합 plugins 업데이트 프로그램을 통해 추적되는 npm 기반 hook 팩을 업데이트합니다.

`openclaw hooks update`도 호환성 별칭으로 계속 동작하지만, 지원 중단 경고를 출력하고 `openclaw plugins update`로 전달합니다.

**옵션:**

- `--all`: 추적되는 모든 hook 팩 업데이트
- `--dry-run`: 파일을 쓰지 않고 변경될 내용을 표시

저장된 무결성 해시가 존재하고 가져온 아티팩트 해시가 변경되면, OpenClaw는 경고를 출력하고 진행 전에 확인을 요청합니다. CI/비대화형 실행에서 프롬프트를 건너뛰려면 전역 `--yes`를 사용하세요.

## 번들 Hook

### session-memory

`/new` 또는 `/reset`을 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**활성화:**

```bash
openclaw hooks enable session-memory
```

**출력:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**참조:** [session-memory 문서](/ko/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 중에 추가 bootstrap 파일(예: 모노레포 로컬 `AGENTS.md` / `TOOLS.md`)을 주입합니다.

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
# 최근 명령
tail -n 20 ~/.openclaw/logs/commands.log

# 보기 좋게 출력
cat ~/.openclaw/logs/commands.log | jq .

# 작업별 필터링
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**참조:** [command-logger 문서](/ko/automation/hooks#command-logger)

### boot-md

Gateway가 시작될 때(채널 시작 후) `BOOT.md`를 실행합니다.

**이벤트**: `gateway:startup`

**활성화**:

```bash
openclaw hooks enable boot-md
```

**참조:** [boot-md 문서](/ko/automation/hooks#boot-md)

## 관련 항목

- [CLI 참조](/ko/cli)
- [자동화 hooks](/ko/automation/hooks)
