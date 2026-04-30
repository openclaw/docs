---
read_when:
    - 어떤 Skills를 사용할 수 있고 실행할 준비가 되었는지 확인하려는 경우
    - ClawHub에서 Skills를 검색, 설치 또는 업데이트하려는 경우
    - Skills의 누락된 바이너리/env/config를 디버그하려는 경우
summary: '`openclaw skills`의 CLI 참조(search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-04-30T06:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

로컬 Skills를 검사하고 ClawHub에서 Skills를 설치/업데이트합니다.

관련 항목:

- Skills 시스템: [Skills](/ko/tools/skills)
- Skills 구성: [Skills 구성](/ko/tools/skills-config)
- ClawHub 설치: [ClawHub](/ko/tools/clawhub)

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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update`는 ClawHub를 직접 사용하며 활성
작업공간의 `skills/` 디렉터리에 설치합니다. `list`/`info`/`check`는 여전히 현재
작업공간과 구성에 보이는 로컬 Skills를 검사합니다. 작업공간 기반 명령은
`--agent <id>`에서 대상 작업공간을 확인한 다음, 구성된 에이전트 작업공간 내부에 있는 경우 현재 작업
디렉터리를 확인하고, 그 다음 기본
에이전트를 확인합니다.

이 CLI `install` 명령은 ClawHub에서 Skills 폴더를 다운로드합니다. 온보딩 또는 Skills 설정에서
트리거되는 Gateway 기반 Skills 의존성 설치는 대신
별도의 `skills.install` 요청 경로를 사용합니다.

참고:

- `search [query...]`는 선택적 쿼리를 허용합니다. 기본
  ClawHub 검색 피드를 탐색하려면 생략하세요.
- `search --limit <n>`은 반환되는 결과 수를 제한합니다.
- `install --force`는 동일한
  slug의 기존 작업공간 Skills 폴더를 덮어씁니다.
- `--agent <id>`는 구성된 에이전트 작업공간 하나를 대상으로 지정하며 현재
  작업 디렉터리 추론을 재정의합니다.
- `update --all`은 활성 작업공간에서 추적되는 ClawHub 설치만 업데이트합니다.
- 하위 명령이 제공되지 않으면 `list`가 기본 동작입니다.
- `list`, `info`, `check`는 렌더링된 출력을 stdout에 씁니다. `--json`을 사용하면,
  파이프와 스크립트를 위해 기계가 읽을 수 있는 페이로드가 stdout에 유지됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Skills](/ko/tools/skills)
