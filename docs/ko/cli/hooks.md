---
read_when:
    - 에이전트 hook을 관리하려고 합니다
    - hook 가용성을 확인하거나 워크스페이스 hook을 활성화하려고 합니다
summary: '`openclaw hooks`에 대한 CLI 참조(agent hooks)'
title: hooks
x-i18n:
    generated_at: "2026-04-23T14:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

에이전트 hook(`/new`, `/reset`, Gateway 시작 같은 명령용 이벤트 기반 자동화)을 관리합니다.

하위 명령 없이 `openclaw hooks`를 실행하면 `openclaw hooks list`와 동일합니다.

관련 문서:

- Hooks: [Hooks](/ko/automation/hooks)
- Plugin hooks: [Plugin hooks](/ko/plugins/architecture#provider-runtime-hooks)

## 모든 hook 나열

```bash
openclaw hooks list
```

워크스페이스, 관리형, extra, 번들 디렉터리에서 검색된 모든 hook을 나열합니다.
내부 hook 핸들러는 내부 hook이 하나 이상 구성되기 전까지 Gateway 시작 시 로드되지 않습니다.

**옵션:**

- `--eligible`: 적격 hook만 표시(요구 사항 충족)
- `--json`: JSON으로 출력
- `-v, --verbose`: 누락된 요구 사항을 포함한 자세한 정보 표시

**출력 예시:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway 시작 시 BOOT.md 실행
  📎 bootstrap-extra-files ✓ - 에이전트 bootstrap 중 추가 워크스페이스 bootstrap 파일 주입
  📝 command-logger ✓ - 모든 명령 이벤트를 중앙 감사 파일에 기록
  💾 session-memory ✓ - /new 또는 /reset 명령이 실행되면 세션 컨텍스트를 메모리에 저장
```

**예시(verbose):**

```bash
openclaw hooks list --verbose
```

적격하지 않은 hook의 누락된 요구 사항을 표시합니다.

**예시(JSON):**

```bash
openclaw hooks list --json
```

프로그래밍 방식으로 사용할 수 있도록 구조화된 JSON을 반환합니다.

## hook 정보 가져오기

```bash
openclaw hooks info <name>
```

특정 hook의 자세한 정보를 표시합니다.

**인수:**

- `<name>`: hook 이름 또는 hook 키(예: `session-memory`)

**옵션:**

- `--json`: JSON으로 출력

**예시:**

```bash
openclaw hooks info session-memory
```

**출력:**

```
💾 session-memory ✓ Ready

/new 또는 /reset 명령이 실행되면 세션 컨텍스트를 메모리에 저장

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## hook 적격성 확인

```bash
openclaw hooks check
```

hook 적격성 상태 요약(준비 완료 수와 준비되지 않은 수)을 표시합니다.

**옵션:**

- `--json`: JSON으로 출력

**출력 예시:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## hook 활성화

```bash
openclaw hooks enable <name>
```

특정 hook을 구성(기본값: `~/.openclaw/openclaw.json`)에 추가해 활성화합니다.

**참고:** 워크스페이스 hook은 여기서 또는 구성에서 활성화하기 전까지 기본적으로 비활성화됩니다. plugin이 관리하는 hook은 `openclaw hooks list`에서 `plugin:<id>`로 표시되며 여기서 활성화/비활성화할 수 없습니다. 대신 plugin 자체를 활성화/비활성화하세요.

**인수:**

- `<name>`: hook 이름(예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ 활성화된 hook: 💾 session-memory
```

**수행 작업:**

- hook이 존재하고 적격한지 확인
- 구성의 `hooks.internal.entries.<name>.enabled = true`를 업데이트
- 구성을 디스크에 저장

hook이 `<workspace>/hooks/`에서 왔다면, Gateway가 이를 로드하기 전에
이 옵트인 단계가 필요합니다.

**활성화 후:**

- hook이 다시 로드되도록 Gateway를 재시작하세요(macOS에서는 메뉴 바 앱 재시작, 개발 중에는 Gateway 프로세스 재시작).

## hook 비활성화

```bash
openclaw hooks disable <name>
```

구성을 업데이트해 특정 hook을 비활성화합니다.

**인수:**

- `<name>`: hook 이름(예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ 비활성화된 hook: 📝 command-logger
```

**비활성화 후:**

- hook이 다시 로드되도록 Gateway를 재시작하세요

## 참고

- `openclaw hooks list --json`, `info --json`, `check --json`은 구조화된 JSON을 stdout에 직접 씁니다.
- plugin이 관리하는 hook은 여기서 활성화하거나 비활성화할 수 없습니다. 대신 소유 plugin을 활성화하거나 비활성화하세요.

## hook pack 설치

```bash
openclaw plugins install <package>        # 먼저 ClawHub, 그다음 npm
openclaw plugins install <package> --pin  # 버전 고정
openclaw plugins install <path>           # 로컬 경로
```

통합 plugins 설치 프로그램을 통해 hook pack을 설치합니다.

`openclaw hooks install`도 호환성 별칭으로 여전히 동작하지만, 지원 중단 경고를 출력하고 `openclaw plugins install`로 전달합니다.

npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다. 의존성
설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

기본 spec과 `@latest`는 안정 트랙을 유지합니다. npm이 이 둘 중 하나를 프리릴리스로 확인하면, OpenClaw는 중단하고 `@beta`/`@rc` 같은 프리릴리스 태그 또는 정확한 프리릴리스 버전으로 명시적으로 옵트인하라고 요청합니다.

**수행 작업:**

- hook pack을 `~/.openclaw/hooks/<id>`에 복사
- 설치된 hook을 `hooks.internal.entries.*`에서 활성화
- 설치 내역을 `hooks.internal.installs`에 기록

**옵션:**

- `-l, --link`: 복사하는 대신 로컬 디렉터리를 링크(`hooks.internal.load.extraDirs`에 추가)
- `--pin`: npm 설치를 `hooks.internal.installs`에 정확한 확인 버전 `name@version`으로 기록

**지원 아카이브:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**예시:**

```bash
# 로컬 디렉터리
openclaw plugins install ./my-hook-pack

# 로컬 아카이브
openclaw plugins install ./my-hook-pack.zip

# NPM 패키지
openclaw plugins install @openclaw/my-hook-pack

# 복사 없이 로컬 디렉터리 링크
openclaw plugins install -l ./my-hook-pack
```

링크된 hook pack은 워크스페이스 hook이 아니라 운영자가 구성한
디렉터리의 관리형 hook으로 처리됩니다.

## hook pack 업데이트

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

통합 plugins 업데이터를 통해 추적 중인 npm 기반 hook pack을 업데이트합니다.

`openclaw hooks update`도 호환성 별칭으로 여전히 동작하지만, 지원 중단 경고를 출력하고 `openclaw plugins update`로 전달합니다.

**옵션:**

- `--all`: 추적 중인 모든 hook pack 업데이트
- `--dry-run`: 쓰지 않고 변경될 내용을 표시

저장된 무결성 해시가 있고 가져온 아티팩트 해시가 변경되면,
OpenClaw는 경고를 출력하고 진행 전에 확인을 요청합니다. CI/비대화형 실행에서 프롬프트를 우회하려면 전역 `--yes`를 사용하세요.

## 번들 hook

### session-memory

`/new` 또는 `/reset`을 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**활성화:**

```bash
openclaw hooks enable session-memory
```

**출력:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**참고:** [session-memory 문서](/ko/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 중에 추가 bootstrap 파일(예: 모노레포 로컬 `AGENTS.md` / `TOOLS.md`)을 주입합니다.

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
