---
read_when:
    - 채팅에서 에이전트가 Skills를 생성하거나 업데이트하도록 하려는 경우
    - 생성된 스킬 초안을 검토하고 적용, 거부 또는 격리해야 합니다.
    - Skill Workshop 승인, 자율성, 스토리지 또는 제한을 구성하고 있습니다
sidebarTitle: Skill Workshop
summary: Skill Workshop 검토를 통해 워크스페이스 Skills 생성 및 업데이트
title: Skill 워크숍
x-i18n:
    generated_at: "2026-07-12T15:50:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop은 작업공간 Skills를 생성하고 업데이트하기 위한 OpenClaw의 관리형 경로입니다. 에이전트와 운영자는 이 경로를 통해 `SKILL.md`를 직접 작성하지 않습니다. 대신 콘텐츠, 대상 바인딩, 스캐너 상태, 해시 및 롤백 메타데이터를 포함하는 **제안**(대기 중인 초안)을 생성하며, 이 제안은 적용된 경우에만 실제 Skills가 됩니다.

Skill Workshop은 작업공간 Skills만 작성합니다. 번들, Plugin, ClawHub, 추가 루트, 관리형, 개인 에이전트 또는 시스템 Skills는 절대 건드리지 않습니다.

## 작동 방식

- **제안 우선:** 생성된 콘텐츠는 `SKILL.md`가 아니라 `PROPOSAL.md`로 저장됩니다.
- **적용만 실제로 작성:** 생성, 업데이트 및 수정은 활성 Skills를 절대 변경하지 않습니다.
- **작업공간 범위:** 생성 대상은 작업공간의 `skills/` 루트이며, 쓰기 가능한 작업공간 Skills만 업데이트할 수 있습니다.
- **덮어쓰기 방지:** 대상 Skills가 이미 존재하면 생성에 실패합니다.
- **해시 바인딩:** 업데이트 제안은 현재 대상 해시에 바인딩되며, 적용 전에 실제 Skills가 변경되면 `stale` 상태가 됩니다.
- **스캐너 게이트:** 적용 시 쓰기 전에 보안 스캐너를 다시 실행합니다.
- **복구 가능:** 적용 시 실제 파일을 건드리기 전에 롤백 메타데이터를 작성합니다.
- **일관된 인터페이스:** 채팅, CLI 및 Gateway는 모두 동일한 서비스를 호출합니다.

## 수명 주기

```text
생성/업데이트 -> 대기 중
수정          -> 대기 중
적용          -> 적용됨
거부          -> 거부됨
격리          -> 격리됨
대상 변경     -> 오래됨
```

`pending` 상태인 제안만 수정, 적용, 거부 또는 격리할 수 있습니다.

## 수명 주기 관리

Gateway는 공유 상태 데이터베이스에서 Skills의 집계 사용량을 추적합니다. 하루에 한 번 Skill Workshop에서 생성하고 적용한 Skills를 검토합니다. 30일 넘게 사용되지 않은 Skills는 `stale` 상태가 되고, 90일이 지나면 `archived` 상태가 되어 새 에이전트 Skills 스냅샷에서 제외됩니다. 보관된 Skills 파일은 디스크에서 변경되지 않은 상태로 유지됩니다. 수동으로 작성된 Skills는 절대 관리되지 않으며, Skill Workshop 제안으로 생성된 Skills만 수명 주기 관리 대상이 됩니다.

고정된 Skills에는 수명 주기 전환이 적용되지 않습니다. 오래된 Skills는 사용된 후 다음 정리 작업이 실행되면 `active` 상태로 돌아갑니다. 보관된 Skills는 명시적으로 복원해야만 돌아옵니다.

수명 주기 전환 및 복원은 새 세션에 적용되며, 실행 중인 세션은 현재 Skills 스냅샷을 유지합니다.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

모든 관리 명령은 `--json`을 허용합니다. 상태는 결정론적인 중복 후보도 제안으로만 보고하며, Skills를 병합하거나 모델을 호출하지 않습니다.

## 채팅

원하는 Skills를 에이전트에게 요청하면 에이전트가 `skill_workshop`을 호출하고 제안 ID를 반환합니다.

### 최근 작업에서 학습하기

`/learn`을 사용하여 현재 대화나 지정된 소스를 표준 지침을 따르는 하나의 Skills 제안으로 변환합니다.

```text
/learn
/learn docs/runbook.md 및 https://example.com/guide; 복구에 집중
```

요청 없이 `/learn`을 사용하면 에이전트가 현재 대화에서 재사용 가능한 워크플로를 추출합니다. 요청이 있으면 에이전트는 경로, URL, 붙여 넣은 메모 및 대화 참조를 소스로 취급하면서 초점, 범위 및 이름 지정 요구 사항을 준수합니다. 기존 도구를 사용하여 소스를 수집한 다음 `action: "create"`로 `skill_workshop`을 호출합니다.

결과 제안은 `pending` 상태로 유지되며, `/learn`은 이를 절대 적용하지 않습니다. 일반 승인 흐름이나 `openclaw skills workshop`을 통해 검토하고 적용하십시오.

생성:

```text
월요일 받은편지함 루틴을 실행하는 morning-catchup이라는 Skills를 만들어 줘.
```

기존 작업공간 Skills 업데이트:

```text
예약 전에 좌석 배치도도 확인하도록 trip-planning을 업데이트해 줘.
```

대기 중인 제안 반복 수정:

```text
morning-catchup 제안을 보여 줘.
긴급으로 표시된 항목도 플래그하도록 수정해 줘.
morning-catchup 제안을 적용해 줘.
```

에이전트가 시작한 `apply`, `reject` 및 `quarantine`은 기본적으로 승인 프롬프트를 표시합니다. 신뢰할 수 있는 환경에서 이를 건너뛰려면 `skills.workshop.approvalPolicy`를 `"auto"`로 설정하십시오.

프롬프트는 제안 ID와 대상 Skills를 식별하고 제안 설명, 지원 파일 수 및 본문 크기를 표시합니다. 승인 요청은 에이전트 도구 감시 제한 시간 전에 완료되도록 제한됩니다. 프롬프트가 만료되기 전에 결정이 내려지지 않으면 수명 주기 작업이 실행되지 않으며, 제안은 변경 없이 대기 상태로 유지됩니다. 나중에 Skill Workshop UI에서 결정하거나 `openclaw skills workshop apply|reject|quarantine <proposal-id>`를 실행하십시오. 에이전트는 만료된 수명 주기 작업을 반복해서 재시도해서는 안 됩니다.

## CLI

```bash
# 생성
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "매일 받은편지함 따라잡기: 분류, 보관, 표시, 초안 작성, 계획" \
  --proposal ./PROPOSAL.md

# 기존 작업공간 Skills 업데이트
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 목록 표시 및 검사
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 승인 전 수정
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 마무리
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "중복"
openclaw skills workshop quarantine <proposal-id> --reason "보안 검토 필요"
```

모든 하위 명령은 `--agent <id>`(대상 작업공간이며, 기본값은 현재 작업 디렉터리에서 추론한 에이전트이고 그다음은 기본 에이전트입니다) 및 `--json`(구조화된 출력)을 받습니다. `propose-create`, `propose-update` 및 `revise`는 `--proposal`과 함께 제안 컨텍스트를 기록하기 위한 `--goal <text>` 및 `--evidence <text>`도 받습니다.

## 제안 콘텐츠

대기 중에는 제안 전용 frontmatter가 포함된 `PROPOSAL.md`로 제안이 저장됩니다.

```markdown
---
name: "morning-catchup"
description: "매일 받은편지함 따라잡기: 분류, 보관, 표시, 초안 작성, 계획"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

적용 시 Skill Workshop은 활성 `SKILL.md`를 작성하고 제안 전용 필드인 `status`, 제안 `version` 및 제안 `date`를 제거합니다.

## 지원 파일

제안된 Skills에 `PROPOSAL.md`와 함께 파일이 필요한 경우 `--proposal-dir`을 사용하십시오.

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "금요일 마무리: 통계, 주요 내용, 다음 주의 상위 3개 항목" \
  --proposal-dir ./weekly-update-proposal
```

디렉터리에는 `PROPOSAL.md`가 포함되어야 합니다. 지원 파일은 `assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래에 있어야 합니다. Skill Workshop은 이를 스캔하고 해시하여 제안과 함께 저장한 다음, 적용 시에만 실제 `SKILL.md` 옆에 작성합니다.

거부되는 지원 파일 경로는 절대 경로, 숨김 경로 세그먼트, 경로 순회, 중복되는 경로, 실행 파일, UTF-8이 아닌 텍스트, null 바이트 및 표준 지원 폴더 외부의 경로입니다.

## 에이전트 도구

모델은 하나의 필수 `action`과 함께 `skill_workshop`을 사용합니다.
`create | update | revise | list | inspect | apply | reject | quarantine`.
다른 매개변수는 작업에 따라 적용됩니다.

| 매개변수                   | 사용 작업                                              | 참고                                                                 |
| -------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                          | `create`에 필수이며, 그 외에는 이름으로 대기 중인 제안을 확인합니다 |
| `description`              | `create`, `update`, `revise`                           | 최대 160바이트                                                       |
| `skill_name`               | `update`                                               | 기존 Skills 이름 또는 키                                             |
| `proposal_content`         | `create`, `update`, `revise`                           | `PROPOSAL.md`로 저장되며 `skills.workshop.maxSkillBytes`로 제한됩니다 |
| `support_files`            | `create`, `update`, `revise`                           | `{ path, content }` 배열                                              |
| `goal`, `evidence`         | `create`, `update`, `revise`                           | 자유 텍스트 컨텍스트                                                  |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`   | 대상 제안                                                              |
| `reason`                   | `apply`, `reject`, `quarantine`                        | 선택 사항                                                              |
| `query`, `status`, `limit` | `list`                                                 | 필터링/페이지 매김. `limit`의 최대값은 50, 기본값은 20입니다          |

에이전트는 생성된 Skills 작업에 `skill_workshop`을 사용해야 합니다. `write`, `edit`, `exec`, 셸 명령 또는 직접적인 파일 시스템 작업을 통해 제안 파일을 생성하거나 변경해서는 안 됩니다.

<Note>
`skill_workshop`은 기본 제공 에이전트 도구이며 `tools.profile: "coding"`에 포함됩니다. 더 엄격한 정책으로 이 도구가 숨겨져 있으면 활성 `tools.allow` 목록에 `skill_workshop`을 추가하거나, 명시적인 `tools.allow` 없이 프로필을 사용하는 범위에서는 `tools.alsoAllow: ["skill_workshop"]`을 사용하십시오. 샌드박스 실행은 호스트 측 Skill Workshop 도구를 구성하지 않으므로, 일반 호스트 측 에이전트 세션이나 CLI에서 제안 검토 작업을 실행하십시오.
</Note>

## 제안된 Skills

OpenClaw는 실패한 턴을 포함하여 대화형 턴이 종료될 때 “다음번에는”, “기억해 둬”와 같은 지속적인 지침과 대응형 수정을 감지합니다. 다음 턴에서 에이전트는 가장 최근에 감지한 워크플로를 `skill_workshop`을 통해 저장할지 제안하며, 제안을 생성할지는 사용자가 결정합니다. 이 기본 제공 제안 기능 자체는 Skills를 생성하거나 변경하지 않습니다. 대신 대기 중인 제안을 직접 생성하려면 `skills.workshop.autonomous.enabled`를 활성화하십시오.

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

| 설정                       | 기본값      | 효과                                                                                                                                                                        |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 다음 턴에 가장 최근에 감지한 워크플로를 제안하는 대신 대기 중인 제안을 직접 생성합니다.                                                                                     |
| `allowSymlinkTargetWrites` | `false`     | 실제 대상이 `skills.load.allowSymlinkTargets`에 나열된 작업공간 Skills 심볼릭 링크를 통해 적용 작업이 쓰기를 수행할 수 있게 합니다.                                         |
| `approvalPolicy`           | `"pending"` | `"pending"`은 에이전트가 시작한 `apply`, `reject` 또는 `quarantine` 전에 승인 프롬프트가 필요합니다. `"auto"`는 프롬프트를 건너뜁니다(에이전트는 여전히 해당 작업을 호출해야 합니다). |
| `maxPending`               | `50`        | 작업공간당 대기 및 격리된 제안을 제한합니다(1-200).                                                                                                                         |
| `maxSkillBytes`            | `40000`     | 제안 본문 크기를 바이트 단위로 제한합니다(1024-200000).                                                                                                                     |

자율 캡처는 전망적 규칙(예: “앞으로는”)과 대응형 수정(예: “내가 요청한 내용이 아니야”)을 인식합니다. 새 지침을 주제별로 그룹화하여 턴당 최대 3개의 제안으로 만들고, 어휘가 일치하면 쓰기 가능한 기존 작업공간 Skills로 라우팅하며, 동일한 Skills를 대상으로 추가 수정이 이루어지면 자체 대기 중인 제안을 수정합니다.

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

`requestRevision`은 Gateway에서만 사용할 수 있으며(CLI 또는 에이전트 도구에 해당 기능 없음), 새 내용을 그대로 제출하는 대신 에이전트에게 수정을 요청하는 UI를 위해 `PROPOSAL.md`를 직접 교체하지 않고 자유 형식의 수정 지침을 소유 에이전트의 채팅 세션으로 전달합니다.

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

- `proposal.json`: 표준 제안 레코드입니다.
- `proposals.json`: 제안 폴더에서 다시 빌드할 수 있는 빠른 목록 인덱스입니다.
- `PROPOSAL.md`: 대기 중인 skill 제안입니다.
- `rollback.json`: 적용 작업으로 실제 파일을 변경하기 전에 기록되는 복구 메타데이터입니다.

## 제한

| 제한                            | 값                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 설명                            | 160바이트                                                            |
| 제안 본문                       | `skills.workshop.maxSkillBytes`(기본값 40,000, 최대 한도 1 MiB)      |
| 지원 파일                       | 제안당 64개                                                          |
| 지원 파일 크기                  | 각각 256 KiB, 총 2 MiB                                               |
| 대기 중 + 격리된 제안           | 워크스페이스당 `skills.workshop.maxPending`(기본값 50)               |

## 문제 해결

| 문제                                           | 해결 방법                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Skill proposal description is too large`      | `description`을 160바이트 이하로 줄이십시오.                                                                                                                                                                 |
| `Skill proposal content is too large`          | 제안 본문을 줄이거나 `skills.workshop.maxSkillBytes`를 늘리십시오.                                                                                                                                            |
| `Target skill changed after proposal creation` | 현재 대상을 기준으로 제안을 수정하거나 새 제안을 만드십시오.                                                                                                                                                 |
| `Proposal scan failed`                         | 스캐너 결과를 검사한 후 제안을 수정하거나 격리하십시오.                                                                                                                                                      |
| `untrusted symlink target`                     | 의도적으로 공유하는 skill 루트에만 `skills.load.allowSymlinkTargets`를 구성하고 `skills.workshop.allowSymlinkTargetWrites`를 활성화하십시오.                                                                  |
| `Support file paths must be under one of...`   | 지원 파일을 `assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래로 이동하십시오.                                                                                                          |
| 목록에 제안이 표시되지 않음                    | 선택한 `--agent` 워크스페이스와 `OPENCLAW_STATE_DIR`을 확인하십시오.                                                                                                                                          |
| 에이전트가 `skill_workshop`을 호출할 수 없음   | 활성 도구 정책과 실행 모드를 확인하십시오. `coding`에는 이 도구가 포함되며, 제한적인 `tools.allow` 정책에는 이를 명시적으로 나열해야 합니다. 또한 샌드박스 실행에서는 일반 호스트 측 에이전트 세션 또는 CLI를 사용해야 합니다. |

### 도구 정책 진단

자율 캡처가 활성화되면 `openclaw doctor`는 기본 에이전트에 대해 `core/doctor/skill-workshop-tool-policy` 검사를 실행합니다. 정책에서 `skill_workshop`을 숨기는 경우, 경고에는 이를 처음 제외하는 구성 계층과 적용해야 할 정확한 `allow` 또는 `alsoAllow` 변경 사항이 표시됩니다. 이전 런북에서는 여전히 `openclaw plugins inspect skill-workshop`을 사용할 수 있습니다. 이제 이 명령은 Skill Workshop이 기본 제공됨을 설명하고, 해당하는 경우 동일한 정책 힌트를 출력합니다.

## 관련 문서

- 로드 순서, 우선순위 및 가시성은 [Skills](/ko/tools/skills)를 참조하십시오.
- 직접 작성하는 `SKILL.md`의 기본 사항은 [skill 만들기](/ko/tools/creating-skills)를 참조하십시오.
- 전체 `skills.workshop` 스키마는 [Skills 구성](/ko/tools/skills-config)을 참조하십시오.
- `openclaw skills` 명령은 [Skills CLI](/ko/cli/skills)를 참조하십시오.
