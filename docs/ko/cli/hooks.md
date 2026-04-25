---
read_when:
    - 에이전트 훅을 관리하려고 합니다
    - 훅 사용 가능 여부를 확인하거나 작업공간 훅을 활성화하려고 합니다
summary: '`openclaw hooks`용 CLI 참조(에이전트 훅)'
title: 훅
x-i18n:
    generated_at: "2026-04-25T05:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

에이전트 훅을 관리합니다(`/new`, `/reset`, Gateway 시작과 같은 명령을 위한 이벤트 기반 자동화).

하위 명령 없이 `openclaw hooks`를 실행하면 `openclaw hooks list`와 동일합니다.

관련 문서:

- 훅: [훅](/ko/automation/hooks)
- Plugin 훅: [Plugin 훅](/ko/plugins/hooks)

## 모든 훅 나열

```bash
openclaw hooks list
```

작업공간, managed, extra, bundled 디렉터리에서 발견된 모든 훅을 나열합니다.
내부 훅이 하나 이상 구성되기 전까지는 Gateway 시작 시 내부 훅 핸들러가 로드되지 않습니다.

**옵션:**

- `--eligible`: 자격 요건을 충족한 훅만 표시
- `--json`: JSON으로 출력
- `-v, --verbose`: 누락된 요구 사항을 포함한 자세한 정보 표시

**출력 예시:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway 시작 시 BOOT.md 실행
  📎 bootstrap-extra-files ✓ - 에이전트 bootstrap 중 추가 작업공간 bootstrap 파일 삽입
  📝 command-logger ✓ - 모든 명령 이벤트를 중앙 감사 파일에 기록
  💾 session-memory ✓ - /new 또는 /reset 명령이 실행될 때 세션 컨텍스트를 메모리에 저장
```

**예시(상세):**

```bash
openclaw hooks list --verbose
```

자격이 없는 훅의 누락된 요구 사항을 표시합니다.

**예시(JSON):**

```bash
openclaw hooks list --json
```

프로그래밍 방식으로 사용할 수 있도록 구조화된 JSON을 반환합니다.

## 훅 정보 가져오기

```bash
openclaw hooks info <name>
```

특정 훅의 자세한 정보를 표시합니다.

**인수:**

- `<name>`: 훅 이름 또는 훅 키(예: `session-memory`)

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

세부 정보:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

요구 사항:
  Config: ✓ workspace.dir
```

## 훅 자격 확인

```bash
openclaw hooks check
```

훅 자격 상태 요약(준비됨/준비되지 않음 개수)을 표시합니다.

**옵션:**

- `--json`: JSON으로 출력

**출력 예시:**

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

구성(기본값: `~/.openclaw/openclaw.json`)에 추가하여 특정 훅을 활성화합니다.

**참고:** 작업공간 훅은 여기서 또는 구성에서 활성화하기 전까지 기본적으로 비활성화됩니다. Plugin이 관리하는 훅은 `openclaw hooks list`에 `plugin:<id>`로 표시되며 여기서 활성화/비활성화할 수 없습니다. 대신 Plugin을 활성화/비활성화하세요.

**인수:**

- `<name>`: 훅 이름(예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ 훅 활성화됨: 💾 session-memory
```

**동작 방식:**

- 훅이 존재하고 자격을 충족하는지 확인
- 구성에서 `hooks.internal.entries.<name>.enabled = true` 업데이트
- 구성을 디스크에 저장

훅이 `<workspace>/hooks/`에서 왔다면,
Gateway가 이를 로드하기 전에 이 opt-in 단계가 필요합니다.

**활성화 후:**

- 훅이 다시 로드되도록 Gateway를 재시작하세요(macOS에서는 메뉴 막대 앱 재시작, 개발 환경에서는 Gateway 프로세스 재시작).

## 훅 비활성화

```bash
openclaw hooks disable <name>
```

구성을 업데이트하여 특정 훅을 비활성화합니다.

**인수:**

- `<name>`: 훅 이름(예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ 훅 비활성화됨: 📝 command-logger
```

**비활성화 후:**

- 훅이 다시 로드되도록 Gateway를 재시작하세요

## 참고

- `openclaw hooks list --json`, `info --json`, `check --json`은 구조화된 JSON을 stdout에 직접 기록합니다.
- Plugin이 관리하는 훅은 여기서 활성화 또는 비활성화할 수 없습니다. 대신 소유 Plugin을 활성화하거나 비활성화하세요.

## 훅 팩 설치

```bash
openclaw plugins install <package>        # ClawHub 우선, затем npm
openclaw plugins install <package> --pin  # 버전 고정
openclaw plugins install <path>           # 로컬 경로
```

통합 Plugin 설치기를 통해 훅 팩을 설치합니다.

`openclaw hooks install`도 호환성 별칭으로 계속 동작하지만,
사용 중단 경고를 출력한 뒤 `openclaw plugins install`로 전달됩니다.

npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 의존성
설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

bare spec과 `@latest`는 안정 버전 트랙에 머뭅니다. npm이 둘 중 하나를
프리릴리스로 해석하면, OpenClaw는 중지하고
`@beta`/`@rc` 같은 프리릴리스 태그나 정확한 프리릴리스 버전으로 명시적으로 opt in하라고 안내합니다.

**동작 방식:**

- 훅 팩을 `~/.openclaw/hooks/<id>`로 복사
- 설치된 훅을 `hooks.internal.entries.*`에서 활성화
- 설치 기록을 `hooks.internal.installs`에 저장

**옵션:**

- `-l, --link`: 복사 대신 로컬 디렉터리를 링크(`hooks.internal.load.extraDirs`에 추가)
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

링크된 훅 팩은 작업공간 훅이 아니라 운영자가 구성한
디렉터리의 managed 훅으로 취급됩니다.

## 훅 팩 업데이트

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

통합 Plugin 업데이터를 통해 추적 중인 npm 기반 훅 팩을 업데이트합니다.

`openclaw hooks update`도 호환성 별칭으로 계속 동작하지만, 사용 중단 경고를 출력하고 `openclaw plugins update`로 전달됩니다.

**옵션:**

- `--all`: 추적 중인 모든 훅 팩 업데이트
- `--dry-run`: 쓰기 없이 변경될 내용을 표시

저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경된 경우,
OpenClaw는 경고를 출력하고 진행 전에 확인을 요청합니다. CI/비대화형 실행에서 프롬프트를 건너뛰려면 전역 `--yes`를 사용하세요.

## 번들 훅

### session-memory

`/new` 또는 `/reset`을 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**활성화:**

```bash
openclaw hooks enable session-memory
```

**출력:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**참고:** [session-memory 문서](/ko/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 중 추가 bootstrap 파일(예: 모노레포 로컬 `AGENTS.md` / `TOOLS.md`)을 삽입합니다.

**활성화:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**참고:** [bootstrap-extra-files 문서](/ko/automation/hooks#bootstrap-extra-files)

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

**참고:** [command-logger 문서](/ko/automation/hooks#command-logger)

### boot-md

Gateway가 시작될 때(채널 시작 후) `BOOT.md`를 실행합니다.

**이벤트**: `gateway:startup`

**활성화**:

```bash
openclaw hooks enable boot-md
```

**참고:** [boot-md 문서](/ko/automation/hooks#boot-md)

## 관련 문서

- [CLI 참조](/ko/cli)
- [자동화 훅](/ko/automation/hooks)
