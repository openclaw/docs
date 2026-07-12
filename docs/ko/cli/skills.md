---
read_when:
    - 사용 가능하며 실행할 준비가 된 Skills를 확인하려고 합니다
    - ClawHub를 검색하거나 ClawHub, Git 또는 로컬 디렉터리에서 Skills를 설치하려고 합니다
    - ClawHub로 ClawHub Skills을 검증하려고 합니다
    - Skills의 바이너리/env/config 누락을 디버그하려고 합니다
summary: '`openclaw skills`의 CLI 참조(검색/설치/업데이트/검증/목록/정보/확인/워크숍)'
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:07:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

로컬 Skills를 검사하고, ClawHub를 검색하고, ClawHub/Git/로컬 디렉터리에서 Skills를 설치하고, ClawHub Skills를 검증하고, ClawHub에서 추적하는 설치 항목을 업데이트합니다.

관련 문서:

- Skills 시스템: [Skills](/ko/tools/skills)
- Skill 워크숍: [Skill 워크숍](/ko/tools/skill-workshop)
- Skills 구성: [Skills 구성](/ko/tools/skills-config)
- ClawHub 설치: [ClawHub](/ko/clawhub/cli)

## 명령어

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
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

`search`, `update`, `verify`는 ClawHub를 직접 사용합니다. `install @owner/<slug>`는 ClawHub Skill을 설치하고, `install git:owner/repo[@ref]`는 Git Skill을 복제하며, `install ./path`는 로컬 Skill 디렉터리를 복사합니다. 기본적으로 `install`, `update`, `verify`는 활성 워크스페이스의 `skills/` 디렉터리를 대상으로 하며, `--global`을 사용하면 공유 관리형 Skills 디렉터리를 대상으로 합니다. `list`/`info`/`check`는 계속해서 현재 워크스페이스와 구성에 표시되는 로컬 Skills를 검사합니다. 워크스페이스 기반 명령은 먼저 `--agent <id>`에서 대상 워크스페이스를 확인하고, 그다음 현재 작업 디렉터리가 구성된 에이전트 워크스페이스 내부에 있으면 해당 디렉터리를 사용하며, 마지막으로 기본 에이전트를 사용합니다.

Git 및 로컬 디렉터리 설치의 경우 소스 루트에 `SKILL.md`가 있어야 합니다. 설치 슬러그는 유효한 경우 `SKILL.md` frontmatter의 `name`에서 가져오고, 그렇지 않으면 소스 디렉터리 또는 저장소 이름에서 가져옵니다. 이를 재정의하려면 `--as <slug>`를 사용하십시오. `--version`은 ClawHub에만 적용됩니다. Skill 설치는 npm 패키지 사양이나 zip/아카이브 경로를 지원하지 않으며, `openclaw skills update`는 ClawHub에서 추적하는 설치 항목만 업데이트합니다.

온보딩 또는 Skills 설정에서 트리거되는 Gateway 기반 Skill 종속성 설치는 별도의 `skills.install` 요청 경로를 사용합니다.

참고:

| 플래그/동작                     | 설명                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | 선택적 쿼리입니다. 생략하면 기본 ClawHub 검색 피드를 탐색합니다.                                                                                                                                                                                                                       |
| `search --limit <n>`             | 반환되는 결과 수를 제한합니다.                                                                                                                                                                                                                                                         |
| `install git:owner/repo[@ref]`   | Git Skill을 설치합니다. 브랜치 참조에는 `git:owner/repo@feature/foo`와 같이 슬래시가 포함될 수 있습니다.                                                                                                                                                                                |
| `install ./path/to/skill`        | 루트에 `SKILL.md`가 포함된 로컬 디렉터리를 설치합니다.                                                                                                                                                                                                                                 |
| `install --as <slug>`            | Git 및 로컬 디렉터리 설치에서 추론된 슬러그를 재정의합니다.                                                                                                                                                                                                                            |
| `install --version <version>`    | ClawHub Skill 참조에만 적용됩니다.                                                                                                                                                                                                                                                     |
| `install --force`                | 동일한 슬러그의 기존 워크스페이스 Skill 폴더를 덮어씁니다.                                                                                                                                                                                                                             |
| `install/update --force-install` | ClawHub의 검사가 완료되기 전에 대기 중인 GitHub 기반 ClawHub Skill을 설치합니다.                                                                                                                                                                                                        |
| `--global`                       | 공유 관리형 Skills 디렉터리를 대상으로 합니다. `--agent <id>`와 함께 사용할 수 없습니다.                                                                                                                                                                                              |
| `--agent <id>`                   | 구성된 에이전트 워크스페이스 하나를 대상으로 하며, 현재 작업 디렉터리를 통한 추론보다 우선합니다.                                                                                                                                                                                       |
| `update @owner/<slug>`           | 추적 중인 Skill 하나를 업데이트합니다. 워크스페이스 대신 공유 관리형 Skills 디렉터리를 대상으로 하려면 `--global`을 추가하십시오.                                                                                                                                                       |
| `update --all`                   | 선택한 워크스페이스에서 추적 중인 ClawHub 설치 항목을 업데이트하며, `--global`을 사용하면 공유 관리형 Skills 디렉터리의 항목을 업데이트합니다.                                                                                                                                           |
| `verify @owner/<slug>`           | 기본적으로 ClawHub의 `clawhub.skill.verify.v1` JSON 봉투를 출력합니다. JSON이 이미 기본값이므로 `--json` 플래그는 없습니다. Skill이 이미 설치되어 있거나 모호하지 않은 경우 호환성을 위해 소유자 없는 슬러그도 허용되며, 소유자가 명시된 참조를 사용하면 게시자 모호성을 방지할 수 있습니다. |
| `verify` 출처                    | ClawHub가 서버에서 확인한 소스 출처를 반환하면 검증 JSON에 커밋이 고정된 `openclaw.verifiedSourceUrl`도 포함됩니다. 사용할 수 없거나 자체 선언된 소스 URL은 원시 출처 봉투에만 유지되며 승격되지 않습니다.                                                                                  |
| `verify` 버전 선택기             | `verify`는 설치된 ClawHub Skills에 `.clawhub/origin.json`을 사용하므로, 설치된 버전을 해당 Skill의 출처 레지스트리와 대조하여 검증합니다. `--version`과 `--tag`는 버전 선택기를 재정의하지만, 출처 메타데이터가 있으면 설치된 레지스트리를 계속 사용합니다.                                   |
| `verify --card`                  | JSON 대신 생성된 Skill 카드 Markdown을 출력합니다. ClawHub가 `ok: false` 또는 `decision: "fail"`을 반환하면 0이 아닌 코드로 종료됩니다. ClawHub 정책이 변경되지 않는 한 서명되지 않은 서명은 정보 제공용입니다.                                                                          |
| Skill 카드 지문                  | 설치된 ClawHub 번들에는 생성된 `skill-card.md`가 포함될 수 있습니다. OpenClaw는 검증을 ClawHub 서버의 결정으로 취급하며, 생성된 카드로 인해 번들 지문이 변경되었다는 이유만으로 설치된 Skill을 거부하지 않습니다.                                                                         |
| `check --agent <id>`             | 선택한 에이전트의 워크스페이스를 검사하고, 준비된 Skills 중 실제로 해당 에이전트의 프롬프트 또는 명령 표면에 표시되는 항목을 보고합니다.                                                                                                                                                  |
| `list`                           | 하위 명령이 제공되지 않았을 때의 기본 동작입니다.                                                                                                                                                                                                                                      |
| `list`/`info`/`check` 출력       | 렌더링된 출력은 stdout으로 전송됩니다. `--json`을 사용하면 파이프와 스크립트용 기계 판독 가능 페이로드가 stdout에 유지됩니다.                                                                                                                                                            |

커뮤니티 ClawHub Skill 설치 및 업데이트는 다운로드 전에 신뢰도를 확인합니다. 버전이 지정된 커뮤니티 아카이브 릴리스는 정확한 릴리스의 신뢰 메타데이터를 사용합니다. 리졸버 기반 GitHub Skills는 ClawHub의 설치 리졸버를 사용하여 검사가 완료되고 고정된 커밋이 반환되기 전에 검사 및 강제 설치 정책을 적용합니다. 검사가 완료되기 전에 대기 중인 GitHub 기반 Skill을 설치하려면 `--force-install`을 사용하십시오. 악성 또는 차단된 커뮤니티 릴리스는 거부됩니다. 위험한 커뮤니티 릴리스의 경우 검토가 필요하며, 비대화형 명령이 해당 검토 후 계속 진행해야 하면 `--acknowledge-clawhub-risk`가 필요합니다. 공식 ClawHub Skill 게시자 및 OpenClaw에 번들된 Skill 소스는 이 릴리스 신뢰 프롬프트를 건너뜁니다.

## Skill 워크숍

`openclaw skills workshop`은 선택한 워크스페이스에서 대기 중인 Skill 제안을 관리합니다. 제안은 적용되기 전까지 활성 Skills가 아닙니다. 제안 저장소, 지원 파일 보호 조치, Gateway 메서드 및 승인 정책은 [Skill 워크숍](/ko/tools/skill-workshop)을 참조하십시오.

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "반복 가능한 QA 체크리스트" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "반복 가능한 QA 체크리스트" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "중복"
openclaw skills workshop quarantine <proposal-id> --reason "보안 검토 필요"
```

`propose-create`, `propose-update`, `revise`는 제안의 동기와 근거 메모를
`--proposal`/`--proposal-dir` 콘텐츠와 함께 기록할 수 있도록 `--goal <text>`와
`--evidence <text>`도 허용합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [Skills](/ko/tools/skills)
