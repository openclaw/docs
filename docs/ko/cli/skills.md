---
read_when:
    - 사용 가능하고 실행 준비가 된 Skills를 확인하려는 경우
    - ClawHub를 검색하거나 ClawHub, Git 또는 로컬 디렉터리에서 Skills를 설치하려는 경우
    - ClawHub로 ClawHub 스킬을 검증하려고 합니다
    - Skills의 누락된 바이너리/env/config를 디버그하려는 경우
summary: '`openclaw skills`용 CLI 참조(search/install/update/verify/list/info/check/workshop)'
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:20:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

로컬 스킬을 검사하고, ClawHub를 검색하고, ClawHub/Git/로컬
디렉터리에서 스킬을 설치하고, ClawHub 스킬을 검증하며, ClawHub에서 추적하는 설치를 업데이트합니다.

관련:

- Skills 시스템: [Skills](/ko/tools/skills)
- 스킬 워크숍: [스킬 워크숍](/ko/tools/skill-workshop)
- Skills 구성: [Skills 구성](/ko/tools/skills-config)
- ClawHub 설치: [ClawHub](/ko/clawhub/cli)

## 명령

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
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
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, `verify`는 ClawHub를 직접 사용합니다. `install @owner/<slug>`는
ClawHub 스킬을 설치하고, `install git:owner/repo[@ref]`는 Git 스킬을 클론하며,
`install ./path`는 로컬 스킬 디렉터리를 복사합니다. 기본적으로 `install`, `update`,
`verify`는 활성 워크스페이스 `skills/` 디렉터리를 대상으로 합니다. `--global`을 사용하면
공유 관리형 스킬 디렉터리를 대상으로 합니다. `list`/`info`/`check`는 계속
현재 워크스페이스와 구성에서 보이는 로컬 스킬을 검사합니다.
워크스페이스 기반 명령은 `--agent <id>`에서 대상 워크스페이스를 확인한 다음,
현재 작업 디렉터리가 구성된 에이전트 워크스페이스 안에 있으면 그 디렉터리를 사용하고,
그다음 기본 에이전트를 사용합니다.

Git 및 로컬 디렉터리 설치는 소스 루트에 `SKILL.md`가 있어야 합니다. 설치 슬러그는
유효한 경우 `SKILL.md` 프런트매터의 `name`에서 가져오고, 그다음 소스 디렉터리 또는
리포지터리 이름에서 가져옵니다. 이를 재정의하려면 `--as <slug>`를 사용하세요. `--version`은
ClawHub 전용입니다. 스킬 설치는 npm 패키지 사양이나 zip/아카이브
경로를 지원하지 않으며, `openclaw skills update`는 ClawHub에서 추적하는 설치만 업데이트합니다.

온보딩 또는 Skills 설정에서 트리거되는 Gateway 기반 스킬 의존성 설치는
별도의 `skills.install` 요청 경로를 대신 사용합니다.

참고:

- `search [query...]`는 선택적 쿼리를 받습니다. 기본
  ClawHub 검색 피드를 탐색하려면 생략하세요.
- `search --limit <n>`은 반환되는 결과 수를 제한합니다.
- `install git:owner/repo[@ref]`는 Git 스킬을 설치합니다. 브랜치 ref에는
  `git:owner/repo@feature/foo`처럼 슬래시가 포함될 수 있습니다.
- `install ./path/to/skill`은 루트에
  `SKILL.md`가 포함된 로컬 디렉터리를 설치합니다.
- `install --as <slug>`는 Git 및 로컬 디렉터리
  설치에서 추론된 슬러그를 재정의합니다.
- `install --version <version>`은 ClawHub 스킬 ref에만 적용됩니다.
- `install --force`는 같은
  슬러그에 대한 기존 워크스페이스 스킬 폴더를 덮어씁니다.
- 커뮤니티 ClawHub 스킬 설치 및 업데이트는 다운로드하기 전에 신뢰를 확인합니다.
  버전이 지정된 커뮤니티 아카이브 릴리스는 정확한 릴리스 신뢰 메타데이터를 사용합니다.
  리졸버 기반 GitHub 스킬은 ClawHub의 설치 리졸버에 의존하여
  고정된 커밋을 반환하기 전에 스캔 및 강제 설치 정책을 적용합니다. 악성 또는
  차단된 커뮤니티 릴리스는 거부됩니다. 위험한 커뮤니티 릴리스는
  검토가 필요하며, 비대화형 명령이 그 검토 후 계속되어야 하는 경우
  `--acknowledge-clawhub-risk`가 필요합니다. 공식 ClawHub 스킬 게시자와 번들된
  OpenClaw 스킬 소스는 이 릴리스 신뢰 프롬프트를 건너뜁니다.
- `--global`은 공유 관리형 스킬 디렉터리를 대상으로 하며
  `--agent <id>`와 함께 사용할 수 없습니다.
- `--agent <id>`는 하나의 구성된 에이전트 워크스페이스를 대상으로 하며 현재
  작업 디렉터리 추론을 재정의합니다.
- `update @owner/<slug>`는 추적되는 단일 스킬을 업데이트합니다. 워크스페이스 대신
  공유 관리형 스킬 디렉터리를 대상으로 하려면 `--global`을 추가하세요.
- `update --all`은 선택한 워크스페이스에서 추적되는 ClawHub 설치를 업데이트하거나,
  `--global`과 함께 사용하면 공유 관리형 스킬 디렉터리에서 업데이트합니다.
- `verify @owner/<slug>`는 기본적으로 ClawHub의 `clawhub.skill.verify.v1` JSON
  엔벌로프를 출력합니다. JSON이 이미 기본값이므로 `--json` 플래그는 없습니다.
  스킬이 이미 설치되어 있거나 모호하지 않은 경우 호환성을 위해 bare 슬러그도 계속 허용되지만,
  소유자가 포함된 ref는 게시자 모호성을 피합니다.
- ClawHub가 서버에서 확인한 소스 출처를 반환하면, 검증 JSON에는
  커밋에 고정된 `openclaw.verifiedSourceUrl`도 포함됩니다. 사용할 수 없거나
  자체 선언된 소스 URL은 원시 출처 엔벌로프에만 남고 승격되지 않습니다.
- `verify`는 설치된 ClawHub 스킬에 대해 `.clawhub/origin.json`을 사용하므로
  설치된 버전을 해당 스킬이 온 레지스트리에 대해 검증합니다. `--version`과
  `--tag`는 버전 선택기를 재정의하지만, origin 메타데이터가 있으면 해당 설치 레지스트리를
  유지합니다.
- `verify --card`는 JSON 대신 생성된 스킬 카드 Markdown을 출력합니다. 이
  명령은 ClawHub가 `ok: false` 또는 `decision: "fail"`을 반환하면 0이 아닌 값으로 종료합니다.
  서명되지 않은 서명은 ClawHub 정책이 변경되지 않는 한 정보용입니다.
- 설치된 ClawHub 번들에는 생성된 `skill-card.md`가 포함될 수 있습니다. OpenClaw는
  검증을 ClawHub 서버 결정으로 취급하며, 생성된 카드가 번들
  지문을 변경한다는 이유만으로 설치된 스킬을 거부하지 않습니다.
- `check --agent <id>`는 선택한 에이전트의 워크스페이스를 확인하고
  준비된 스킬 중 실제로 해당 에이전트의 프롬프트 또는 명령 표면에 보이는 스킬을 보고합니다.
- 하위 명령이 제공되지 않으면 `list`가 기본 동작입니다.
- `list`, `info`, `check`는 렌더링된 출력을 stdout에 씁니다. `--json`을 사용하면
  파이프와 스크립트용 기계 판독 가능 페이로드가 stdout에 유지된다는 뜻입니다.

## 스킬 워크숍

`openclaw skills workshop`은 선택한
워크스페이스의 보류 중인 스킬 제안을 관리합니다. 제안은 적용되기 전까지 활성 스킬이 아닙니다. 제안 저장소,
지원 파일 보호 장치, Gateway 메서드, 승인 정책은
[스킬 워크숍](/ko/tools/skill-workshop)을 참조하세요.

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## 관련

- [CLI 참조](/ko/cli)
- [Skills](/ko/tools/skills)
