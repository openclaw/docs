---
read_when:
    - 에이전트 훅을 관리하려고 합니다
    - 훅 가용성을 확인하거나 워크스페이스 훅을 활성화하려고 합니다
summary: '`openclaw hooks`(에이전트 훅)의 CLI 참조 문서'
title: 훅
x-i18n:
    generated_at: "2026-07-12T15:03:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

에이전트 훅(`/new`, `/reset`, Gateway 시작과 같은 명령을 위한 이벤트 기반 자동화)을 관리합니다. 인수 없이 실행하는 `openclaw hooks`는 `openclaw hooks list`와 동일합니다.

관련 문서: [훅](/ko/automation/hooks) - [Plugin 훅](/ko/plugins/hooks)

## 훅 목록 조회

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

워크스페이스, 관리형, 추가 및 번들 디렉터리에서 발견된 훅을 나열합니다.

- `--eligible`: 요구 사항이 충족된 훅만 표시합니다.
- `--json`: 구조화된 출력입니다.
- `-v, --verbose`: 충족되지 않은 요구 사항을 보여 주는 Missing 열을 포함합니다.

```
훅(5개 중 4개 준비됨)

준비됨:
  🚀 boot-md ✓ - Gateway 시작 시 BOOT.md 실행
  📎 bootstrap-extra-files ✓ - 에이전트 부트스트랩 중 추가 워크스페이스 부트스트랩 파일 주입
  📝 command-logger ✓ - 모든 명령 이벤트를 중앙 집중식 감사 파일에 기록
  💾 session-memory ✓ - /new 또는 /reset 명령 실행 시 세션 컨텍스트를 메모리에 저장
```

## 훅 정보 조회

```bash
openclaw hooks info <name> [--json]
```

`<name>`은 훅 이름 또는 훅 키입니다(예: `session-memory`). 소스, 파일/핸들러 경로, 홈페이지, 이벤트 및 요구 사항별 상태(바이너리, 환경 변수, 구성, OS)를 표시합니다.

## 적격성 확인

```bash
openclaw hooks check [--json]
```

준비됨/준비되지 않음 개수 요약을 출력하며, 준비되지 않은 훅이 있으면 각 훅과 차단 사유를 나열합니다.

## 훅 활성화

```bash
openclaw hooks enable <name>
```

구성에서 `hooks.internal.entries.<name>.enabled = true`를 추가하거나 업데이트하고 `hooks.internal.enabled` 마스터 스위치도 켭니다(하나 이상의 훅이 구성되기 전까지 Gateway는 내부 훅 핸들러를 로드하지 않습니다). 훅이 존재하지 않거나 Plugin에서 관리하거나 적격하지 않은 경우(요구 사항 누락) 실패합니다.

Plugin에서 관리하는 훅은 `hooks list`에 `plugin:<id>`로 표시되며 여기서는 활성화하거나 비활성화할 수 없습니다. 대신 소유 Plugin을 활성화하거나 비활성화하십시오.

활성화한 후 훅을 다시 로드하도록 Gateway를 재시작하십시오(macOS 메뉴 막대 앱을 재시작하거나 개발 환경에서 Gateway 프로세스를 재시작합니다).

## 훅 비활성화

```bash
openclaw hooks disable <name>
```

`hooks.internal.entries.<name>.enabled = false`로 설정합니다. 이후 Gateway를 재시작하십시오.

## 훅 팩 설치 및 업데이트

```bash
openclaw plugins install <package>        # 기본값은 npm
openclaw plugins install npm:<package>    # npm만 사용
openclaw plugins install <package> --pin  # 확인된 버전 고정
openclaw plugins install <path>           # 로컬 디렉터리 또는 아카이브
openclaw plugins install -l <path>        # 복사하는 대신 로컬 디렉터리 연결

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

훅 팩은 통합 Plugin 설치 프로그램/업데이터를 통해 설치됩니다. `openclaw hooks install` / `openclaw hooks update`도 경고를 출력하고 `plugins` 명령으로 전달하는 더 이상 권장되지 않는 별칭으로 계속 작동합니다.

- Npm 사양은 레지스트리 전용입니다. 패키지 이름과 선택적 정확한 버전 또는 dist-tag만 사용할 수 있습니다. Git/URL/파일 사양과 semver 범위는 거부됩니다. 종속성 설치는 프로젝트 로컬에서 `--ignore-scripts`를 사용하여 실행됩니다.
- 버전 없는 사양과 `@latest`는 안정 트랙을 유지합니다. npm이 프리릴리스로 확인되면 OpenClaw는 중단하고 명시적으로 동의하도록 요청합니다(`@beta`, `@rc` 또는 정확한 프리릴리스 버전).
- 지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link`는 로컬 디렉터리를 복사하는 대신 연결합니다(`hooks.internal.load.extraDirs`에 추가). 연결된 훅 팩은 워크스페이스 훅이 아니라 운영자가 구성한 디렉터리의 관리형 훅입니다.
- `--pin`은 npm 설치를 정확히 확인된 `name@version`으로 `hooks.internal.installs`에 기록합니다.
- 설치 시 팩을 `~/.openclaw/hooks/<id>`에 복사하고, 해당 훅을 `hooks.internal.entries.*` 아래에서 활성화하며, 설치 정보를 `hooks.internal.installs`에 기록합니다.
- 저장된 무결성 해시가 가져온 아티팩트와 더 이상 일치하지 않으면 OpenClaw는 경고를 표시하고 계속하기 전에 확인을 요청합니다. 확인을 건너뛰려면 전역 `--yes`를 전달하십시오(예: CI에서).

## 번들 훅

| 훅                    | 이벤트                                            | 수행 작업                                                                                           |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | 구성된 각 에이전트 범위에서 Gateway 시작 시 `BOOT.md`를 실행합니다                                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | 에이전트 부트스트랩 중 추가 부트스트랩 파일(예: 모노레포 `AGENTS.md`/`TOOLS.md`)을 주입합니다        |
| command-logger        | `command`                                         | 명령 이벤트를 `~/.openclaw/logs/commands.log`에 기록합니다                                          |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 세션 Compaction이 시작되고 완료될 때 표시되는 채팅 알림을 전송합니다                                |
| session-memory        | `command:new`, `command:reset`                    | `/new` 또는 `/reset` 실행 시 세션 컨텍스트를 메모리에 저장합니다                                    |

`openclaw hooks enable <hook-name>`으로 번들 훅을 활성화할 수 있습니다. 전체 세부 정보, 구성 키 및 기본값: [번들 훅](/ko/automation/hooks#bundled-hooks).

### command-logger 로그 파일

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # 최근 명령
cat ~/.openclaw/logs/commands.log | jq .          # 보기 좋게 출력
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # 작업별 필터링
```

## 참고

- `hooks list --json`, `info --json` 및 `check --json`은 구조화된 JSON을 stdout에 직접 씁니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [자동화 훅](/ko/automation/hooks)
