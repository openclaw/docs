---
read_when:
    - 사용 가능하며 실행할 준비가 된 Skills를 확인하려는 경우
    - ClawHub에서 Skills를 검색, 설치 또는 업데이트하려는 경우
    - Skills의 누락된 바이너리/환경 변수/구성을 디버그하려고 합니다
summary: '`openclaw skills`의 CLI 참조(search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

로컬 Skills를 검사하고 ClawHub에서 Skills를 설치/업데이트합니다.

관련 항목:

- Skills 시스템: [Skills](/ko/tools/skills)
- Skills 구성: [Skills 구성](/ko/tools/skills-config)
- ClawHub 설치: [ClawHub](/ko/clawhub/cli)

## 명령

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update`는 ClawHub를 직접 사용하며 활성
워크스페이스의 `skills/` 디렉터리에 설치합니다. `list`/`info`/`check`는 현재 워크스페이스와 구성에서
보이는 로컬 Skills를 계속 검사합니다. 워크스페이스 기반 명령은
대상 워크스페이스를 `--agent <id>`에서 확인한 다음, 구성된 에이전트 워크스페이스 내부에 있는 경우 현재 작업
디렉터리에서 확인하고, 그다음 기본
에이전트에서 확인합니다.

이 CLI `install` 명령은 ClawHub에서 스킬 폴더를 다운로드합니다. 온보딩 또는 Skills 설정에서 트리거되는 Gateway 기반
스킬 종속성 설치는 대신 별도의 `skills.install` 요청 경로를 사용합니다.

참고:

- `search [query...]`는 선택적 쿼리를 허용합니다. 기본
  ClawHub 검색 피드를 탐색하려면 생략합니다.
- `search --limit <n>`은 반환되는 결과 수를 제한합니다.
- `install --force`는 같은
  slug에 대한 기존 워크스페이스 스킬 폴더를 덮어씁니다.
- `--agent <id>`는 구성된 에이전트 워크스페이스 하나를 대상으로 하며 현재
  작업 디렉터리 추론을 재정의합니다.
- `update --all`은 활성 워크스페이스에서 추적되는 ClawHub 설치만 업데이트합니다.
- `check --agent <id>`는 선택한 에이전트의 워크스페이스를 확인하고
  준비된 Skills 중 실제로 해당 에이전트의 프롬프트 또는 명령 표면에 보이는 항목을 보고합니다.
- 하위 명령을 제공하지 않으면 `list`가 기본 동작입니다.
- `list`, `info`, `check`는 렌더링된 출력을 stdout에 씁니다. `--json`을 사용하면
  파이프와 스크립트용 기계 판독 가능 페이로드가 stdout에 유지됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Skills](/ko/tools/skills)
