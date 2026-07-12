---
read_when:
    - 채팅에서 에이전트가 Skills를 생성하거나 업데이트하도록 하려는 경우
    - 생성된 스킬 초안을 검토하고, 적용하거나, 거부하거나, 격리해야 합니다.
    - Skill Workshop의 승인, 자율성, 저장소 또는 제한을 구성하고 있습니다
sidebarTitle: Skill Workshop
summary: Skill Workshop 검토를 통해 작업 공간 Skills 생성 및 업데이트
title: Skill 워크숍
x-i18n:
    generated_at: "2026-07-12T01:17:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop은 워크스페이스 Skills을 생성하고 업데이트하기 위한 OpenClaw의 통제된 경로입니다.
에이전트와 운영자는 이 경로를 통해 `SKILL.md`를 직접 작성하지 않습니다. 대신
**제안**(콘텐츠, 대상 바인딩, 스캐너 상태, 해시, 롤백 메타데이터가 포함된 보류 중인
초안)을 생성하며, 이 제안은 적용된 경우에만 실제 Skill이 됩니다.

Skill Workshop은 워크스페이스 Skills만 작성합니다. 번들, Plugin, ClawHub,
추가 루트, 관리형, 개인 에이전트 또는 시스템 Skills은 절대 건드리지 않습니다.

## 작동 방식

- **제안 우선:** 생성된 콘텐츠는 `SKILL.md`가 아닌 `PROPOSAL.md`로
  저장됩니다.
- **적용만 실제 파일을 작성:** 생성, 업데이트 및 수정은 활성 Skills을
  변경하지 않습니다.
- **워크스페이스 범위:** 생성 대상은 워크스페이스의 `skills/` 루트이며, 업데이트는
  쓰기 가능한 워크스페이스 Skills에만 허용됩니다.
- **덮어쓰기 금지:** 대상 Skill이 이미 존재하면 생성에 실패합니다.
- **해시 바인딩:** 업데이트 제안은 현재 대상 해시에 바인딩되며, 적용 전에 실제
  Skill이 변경되면 `stale` 상태가 됩니다.
- **스캐너 통과 필요:** 적용 시 작성하기 전에 보안 스캐너를 다시 실행합니다.
- **복구 가능:** 적용 시 실제 파일을 건드리기 전에 롤백 메타데이터를 작성합니다.
- **일관된 인터페이스:** 채팅, CLI 및 Gateway는 모두 동일한 서비스를 호출합니다.

## 수명 주기

```text
생성/업데이트 -> 보류 중
수정          -> 보류 중
적용          -> 적용됨
거부          -> 거부됨
격리          -> 격리됨
대상 변경     -> 오래됨
```

`pending` 제안만 수정, 적용, 거부 또는 격리할 수 있습니다.

## 수명 주기 선별 관리

Gateway는 공유 상태 데이터베이스에서 집계된 Skill 사용량을 추적합니다. 하루에 한 번
Skill Workshop에서 생성하고 적용한 Skills을 검토합니다. 30일 넘게 사용하지 않은
Skills은 `stale` 상태가 되고, 90일 후에는 `archived` 상태가 되어 새 에이전트의
Skill 스냅샷에서 제외됩니다. 보관된 Skill 파일은 디스크에서 변경되지 않은 채
유지됩니다. 수동으로 작성한 Skills은 절대 선별 관리되지 않으며, Skill Workshop
제안에서 생성한 Skills만 수명 주기 선별 관리 대상이 됩니다.

고정된 Skills은 수명 주기 전환을 건너뜁니다. 오래된 Skill은 사용된 후 다음 정리 작업이
실행되면 `active` 상태로 돌아갑니다. 보관된 Skills은 명시적인 복원을 통해서만
돌아옵니다.

수명 주기 전환과 복원은 새 세션에 적용되며, 실행 중인 세션은 현재 Skill 스냅샷을
유지합니다.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

모든 선별 관리 명령은 `--json`을 지원합니다. 상태 명령은 결정론적으로 겹칠 가능성이
있는 후보도 제안으로만 보고하며, Skills을 병합하거나 모델을 호출하지 않습니다.

## 채팅

원하는 Skill을 에이전트에게 요청하면 에이전트가 `skill_workshop`을 호출하고
제안 ID를 반환합니다.

### 최근 작업에서 학습하기

`/learn`을 사용하여 현재 대화나 지정한 소스를 표준 지침을 따르는 하나의
Skill 제안으로 변환할 수 있습니다.

```text
/learn
/learn docs/runbook.md 및 https://example.com/guide; 복구에 집중
```

요청 없이 `/learn`을 사용하면 에이전트가 현재 대화에서 재사용 가능한 워크플로를
추출하도록 요청합니다. 요청이 있으면 에이전트는 초점, 범위 및 이름 지정 요구 사항을
준수하면서 경로, URL, 붙여 넣은 메모 및 대화 참조를 소스로 취급합니다. 기존 도구로
소스를 수집한 다음 `action: "create"`로 `skill_workshop`을 호출합니다.

생성된 제안은 `pending` 상태로 유지되며, `/learn`은 절대 이를 적용하지 않습니다.
일반 승인 흐름이나 `openclaw skills workshop`을 통해 검토하고 적용하십시오.

생성:

```text
월요일 받은편지함 루틴을 실행하는 morning-catchup이라는 Skill을 만들어 줘.
```

기존 워크스페이스 Skill 업데이트:

```text
예약 전에 좌석 배치도도 확인하도록 trip-planning을 업데이트해 줘.
```

보류 중인 제안 반복 개선:

```text
morning-catchup 제안을 보여 줘.
긴급으로 표시된 항목도 알려 주도록 수정해 줘.
morning-catchup 제안을 적용해 줘.
```

에이전트가 시작한 `apply`, `reject` 및 `quarantine`은 기본적으로 승인 프롬프트를
표시합니다. 신뢰할 수 있는 환경에서 이를 건너뛰려면
`skills.workshop.approvalPolicy`를 `"auto"`로 설정하십시오.

프롬프트에는 제안 ID와 대상 Skill이 표시되며, 제안 설명, 지원 파일 수 및 본문 크기도
표시됩니다. 승인 요청은 에이전트 도구 감시 제한 시간 전에 완료되도록 시간제한이
설정됩니다. 프롬프트가 만료되기 전에 결정이 내려지지 않으면 수명 주기 작업은 실행되지
않으며, 제안은 변경되지 않은 `pending` 상태로 유지됩니다. 나중에 Skill Workshop
UI에서 결정하거나
`openclaw skills workshop apply|reject|quarantine <proposal-id>`를 실행하십시오.
에이전트는 만료된 수명 주기 작업을 반복해서 재시도해서는 안 됩니다.

## CLI

```bash
# 생성
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "매일 받은편지함 확인: 분류, 보관, 중요 항목 표시, 초안 작성, 계획" \
  --proposal ./PROPOSAL.md

# 기존 워크스페이스 Skill 업데이트
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 목록 조회 및 검사
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 승인 전에 수정
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 마무리
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "중복"
openclaw skills workshop quarantine <proposal-id> --reason "보안 검토 필요"
```

모든 하위 명령은 `--agent <id>`(대상 워크스페이스, 기본값은 현재 작업 디렉터리에서
추론한 에이전트이며, 그다음은 기본 에이전트)와 `--json`(구조화된 출력)을 지원합니다.
`propose-create`, `propose-update` 및 `revise`는 `--proposal`과 함께 제안 컨텍스트를
기록하기 위한 `--goal <text>`와 `--evidence <text>`도 지원합니다.

## 제안 콘텐츠

보류 중인 제안은 제안 전용 frontmatter가 포함된 `PROPOSAL.md`로 저장됩니다.

```markdown
---
name: "morning-catchup"
description: "매일 받은편지함 확인: 분류, 보관, 중요 항목 표시, 초안 작성, 계획"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

적용 시 Skill Workshop은 활성 `SKILL.md`를 작성하고 제안 전용 필드인 `status`,
제안 `version`, 제안 `date`를 제거합니다.

## 지원 파일

제안된 Skill에 `PROPOSAL.md`와 함께 둘 파일이 필요한 경우 `--proposal-dir`을
사용하십시오.

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "금요일 마무리: 통계, 주요 내용, 다음 주의 가장 중요한 세 가지" \
  --proposal-dir ./weekly-update-proposal
```

디렉터리에는 `PROPOSAL.md`가 포함되어야 합니다. 지원 파일은 `assets/`,
`examples/`, `references/`, `scripts/` 또는 `templates/` 아래에 있어야 합니다.
Skill Workshop은 이러한 파일을 스캔하고 해시하여 제안과 함께 저장한 다음, 적용할
때만 실제 `SKILL.md` 옆에 작성합니다.

거부되는 지원 파일 경로: 절대 경로, 숨겨진 경로 세그먼트, 경로 순회, 겹치는 경로,
실행 파일, UTF-8이 아닌 텍스트, 널 바이트 및 표준 지원 폴더 외부의 경로.

## 에이전트 도구

모델은 하나의 필수 `action`과 함께 `skill_workshop`을 사용합니다.
`create | update | revise | list | inspect | apply | reject | quarantine`.
작업에 따라 다른 매개변수가 적용됩니다.

| 매개변수                   | 사용하는 작업                                         | 참고                                                                  |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create`에는 필수이며, 그 외에는 이름으로 보류 중인 제안을 확인함     |
| `description`              | `create`, `update`, `revise`                         | 최대 160바이트                                                        |
| `skill_name`               | `update`                                             | 기존 Skill 이름 또는 키                                               |
| `proposal_content`         | `create`, `update`, `revise`                         | `PROPOSAL.md`로 저장되며 `skills.workshop.maxSkillBytes`로 제한됨     |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` 배열                                              |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 자유 형식 컨텍스트                                                     |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | 대상 제안                                                              |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 선택 사항                                                              |
| `query`, `status`, `limit` | `list`                                               | 필터링/페이지 나누기, `limit` 최댓값 50, 기본값 20                     |

에이전트는 생성된 Skill 작업에 `skill_workshop`을 사용해야 합니다. `write`, `edit`,
`exec`, 셸 명령 또는 직접적인 파일 시스템 작업을 통해 제안 파일을 생성하거나
변경해서는 안 됩니다.

<Note>
`skill_workshop`은 내장 에이전트 도구이며 `tools.profile: "coding"`에 포함됩니다.
더 엄격한 정책으로 인해 숨겨진 경우 활성 `tools.allow` 목록에 `skill_workshop`을
추가하거나, 명시적인 `tools.allow`가 없는 프로필을 사용하는 범위에서는
`tools.alsoAllow: ["skill_workshop"]`을 사용하십시오. 샌드박스 실행에서는 호스트
측 Skill Workshop 도구를 생성하지 않으므로, 일반 호스트 측 에이전트 세션이나 CLI에서
제안 검토 작업을 실행하십시오.
</Note>

## 제안된 Skills

OpenClaw는 대화형 턴이 종료될 때 실패한 턴을 포함하여 “다음에는”, “기억해 둬”와 같은
지속적인 지침과 반응형 수정을 감지합니다. 다음 턴에서 에이전트는 가장 최근에 감지한
워크플로를 `skill_workshop`을 통해 저장할 것을 제안하며, 제안을 생성할지는 사용자가
결정합니다. 이 내장 제안 기능 자체는 Skill을 생성하거나 변경하지 않습니다. 대신 보류
중인 제안을 직접 생성하려면 `skills.workshop.autonomous.enabled`를 활성화하십시오.

## 승인 및 자율성

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 설정                       | 기본값      | 효과                                                                                                                                                                          |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 다음 턴에 가장 최근에 감지한 워크플로를 제안하는 대신 보류 중인 제안을 직접 생성합니다.                                                                                       |
| `allowSymlinkTargetWrites` | `false`     | 실제 대상이 `skills.load.allowSymlinkTargets`에 등록된 워크스페이스 Skill 심볼릭 링크를 따라 적용 작업이 파일을 작성할 수 있게 합니다.                                         |
| `approvalPolicy`           | `"pending"` | `"pending"`은 에이전트가 시작한 `apply`, `reject` 또는 `quarantine` 전에 승인 프롬프트를 요구합니다. `"auto"`는 프롬프트를 건너뜁니다(에이전트는 여전히 작업을 호출해야 함). |
| `maxPending`               | `50`        | 워크스페이스당 보류 및 격리된 제안 수를 제한합니다(1~200).                                                                                                                     |
| `maxSkillBytes`            | `40000`     | 제안 본문 크기를 바이트 단위로 제한합니다(1024~200000).                                                                                                                       |

자율 캡처는 예상적 규칙(예: “이제부터”)과 반응형 수정(예: “내가 요청한 건 그게 아니야”)을
인식합니다. 새 지침을 주제별로 그룹화하여 턴당 최대 세 개의 제안으로 만들고, 어휘가
일치하면 기존의 쓰기 가능한 워크스페이스 Skills로 라우팅하며, 같은 Skill을 대상으로
또 다른 수정이 발생하면 자체 보류 중인 제안을 수정합니다.

제안 설명은 `maxSkillBytes`와 관계없이 항상 160바이트로 제한됩니다.

## Gateway 메서드

| 메서드                             | 범위             |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision`은 Gateway 전용이며(CLI 또는 에이전트 도구에 해당 기능 없음), UI에서 새 내용을 그대로 제출하는 대신 에이전트에게 수정을 요청할 수 있도록 `PROPOSAL.md`를 직접 교체하지 않고 자유 형식의 수정 지침을 소유 에이전트의 채팅 세션으로 전달합니다.

## 저장소

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

기본 상태 디렉터리: `~/.openclaw`.

- `proposal.json`: 정식 제안 레코드.
- `proposals.json`: 제안 폴더에서 재구성할 수 있는 빠른 목록 인덱스.
- `PROPOSAL.md`: 대기 중인 Skills 제안.
- `rollback.json`: 적용 작업이 실제 파일을 변경하기 전에 기록되는 복구 메타데이터.

## 제한

| 제한                         | 값                                                                     |
| ---------------------------- | ---------------------------------------------------------------------- |
| 설명                         | 160바이트                                                              |
| 제안 본문                    | `skills.workshop.maxSkillBytes`(기본값 40,000, 최대 한도 1MiB)         |
| 지원 파일                    | 제안당 64개                                                            |
| 지원 파일 크기               | 각각 256KiB, 총 2MiB                                                   |
| 대기 중 + 격리된 제안        | 작업 공간당 `skills.workshop.maxPending`개(기본값 50)                  |

## 문제 해결

| 문제                                           | 해결 방법                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description`을 160바이트 이하로 줄이세요.                                                                                                                                                                 |
| `Skill proposal content is too large`          | 제안 본문을 줄이거나 `skills.workshop.maxSkillBytes`를 늘리세요.                                                                                                                                           |
| `Target skill changed after proposal creation` | 현재 대상을 기준으로 제안을 수정하거나 새 제안을 만드세요.                                                                                                                                                 |
| `Proposal scan failed`                         | 스캐너 결과를 검토한 후 제안을 수정하거나 격리하세요.                                                                                                                                                      |
| `untrusted symlink target`                     | 의도적으로 공유하는 Skills 루트에만 `skills.load.allowSymlinkTargets`를 구성하고 `skills.workshop.allowSymlinkTargetWrites`를 활성화하세요.                                                                 |
| `Support file paths must be under one of...`   | 지원 파일을 `assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래로 이동하세요.                                                                                                          |
| 목록에 제안이 표시되지 않음                    | 선택한 `--agent` 작업 공간과 `OPENCLAW_STATE_DIR`을 확인하세요.                                                                                                                                             |
| 에이전트가 `skill_workshop`을 호출할 수 없음   | 활성 도구 정책과 실행 모드를 확인하세요. `coding`에는 이 도구가 포함되지만 제한적인 `tools.allow` 정책에는 명시적으로 나열해야 하며, 샌드박스 실행은 일반 호스트 측 에이전트 세션 또는 CLI를 사용해야 합니다. |

### 도구 정책 진단

자율 캡처가 활성화되면 `openclaw doctor`는 기본 에이전트에 대해
`core/doctor/skill-workshop-tool-policy` 검사를 실행합니다. 정책이
`skill_workshop`을 숨기는 경우 경고에는 이를 제외하는 첫 번째 구성 계층과
필요한 정확한 `allow` 또는 `alsoAllow` 변경 사항이 표시됩니다. 이전 런북에서는
여전히 `openclaw plugins inspect skill-workshop`을 사용할 수 있습니다. 이제 이
명령은 Skill Workshop이 기본 제공됨을 설명하고, 해당하는 경우 동일한 정책
안내를 출력합니다.

## 관련 문서

- 로드 순서, 우선순위 및 표시 범위는 [Skills](/ko/tools/skills) 참조
- 직접 작성하는 `SKILL.md`의 기본 사항은 [Skills 만들기](/ko/tools/creating-skills)
  참조
- 전체 `skills.workshop` 스키마는 [Skills 구성](/ko/tools/skills-config) 참조
- `openclaw skills` 명령은 [Skills CLI](/ko/cli/skills) 참조
