---
read_when:
    - 채팅에서 에이전트가 Skills를 생성하거나 업데이트하도록 하려는 경우
    - 생성된 스킬 초안을 검토하고 적용하거나, 거부하거나, 격리해야 합니다.
    - Skill Workshop의 승인, 자율성, 저장소 또는 제한을 구성합니다
    - 자기 학습 제안이 어디에서 검토되는지 알아보려고 합니다
sidebarTitle: Skill Workshop
summary: Skill Workshop 검토를 통해 워크스페이스 Skills 생성 및 업데이트
title: Skills 워크숍
x-i18n:
    generated_at: "2026-07-16T13:06:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop은 작업 공간 Skills를 생성하고 업데이트하기 위한 OpenClaw의 관리형 경로입니다.
에이전트와 운영자는 이 경로를 통해 `SKILL.md`을 직접 작성하지 않습니다.
대신 **제안**(콘텐츠, 대상 바인딩, 스캐너 상태, 해시 및 롤백 메타데이터를 포함하는 보류 중인 초안)을 생성하며, 이 제안은 적용된 경우에만 활성 Skills가 됩니다.

Skill Workshop은 작업 공간 Skills만 작성합니다. 번들, Plugin, ClawHub, 추가 루트, 관리형, 개인 에이전트 또는 시스템 Skills는 절대 수정하지 않습니다.

## 작동 방식

- **제안 우선:** 생성된 콘텐츠는 `SKILL.md`이 아니라 `PROPOSAL.md`으로 저장됩니다.
- **적용만 활성 상태에 기록:** 생성, 업데이트 및 수정 작업은 활성 Skills를 변경하지 않습니다.
- **작업 공간 범위:** 생성 대상은 작업 공간 `skills/` 루트이며, 업데이트는 쓰기 가능한 작업 공간 Skills에만 허용됩니다.
- **덮어쓰기 금지:** 대상 Skills가 이미 존재하면 생성에 실패합니다.
- **해시 바인딩:** 업데이트 제안은 현재 대상 해시에 바인딩되며, 적용 전에 활성 Skills가 변경되면 `stale` 상태가 됩니다.
- **스캐너 게이트:** 적용 시 쓰기 전에 보안 스캐너를 다시 실행합니다.
- **복구 가능:** 적용 시 활성 파일을 수정하기 전에 롤백 메타데이터를 기록합니다.
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

## 수명 주기 정리

Gateway는 공유 상태 데이터베이스에서 집계된 Skills 사용량을 추적합니다. 하루에 한 번 Skill Workshop에서 생성하고 적용한 Skills를 검토합니다. 30일 넘게 사용되지 않은 Skills는 `stale` 상태가 되고, 90일이 지나면 `archived` 상태가 되어 새 에이전트 Skills 스냅샷에서 제외됩니다. 보관된 Skills 파일은 디스크에서 변경되지 않습니다. 수동으로 작성한 Skills는 정리되지 않으며, Skill Workshop 제안으로 생성한 Skills만 수명 주기 정리 대상이 됩니다.

고정된 Skills는 수명 주기 전환을 건너뜁니다. 오래된 Skills는 사용된 후 다음 정리 작업이 실행되면 `active` 상태로 돌아갑니다. 보관된 Skills는 명시적인 복원을 통해서만 돌아옵니다.

수명 주기 전환과 복원은 새 세션에 적용되며, 실행 중인 세션은 현재 Skills 스냅샷을 유지합니다.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

모든 정리 명령은 `--json`을 허용합니다. 상태 명령은 결정론적으로 겹치는 후보도 제안으로만 보고하며, Skills를 병합하거나 모델을 호출하지 않습니다.

## 채팅

원하는 Skills를 에이전트에게 요청하면 에이전트가 `skill_workshop`을 호출하고 제안 ID를 반환합니다.

### 최근 작업에서 학습하기

`/learn`을 사용하여 현재 대화 또는 지정된 소스를 표준 지침을 따르는 하나의 Skills 제안으로 전환하십시오.

```text
/learn
/learn docs/runbook.md 및 https://example.com/guide; 복구에 집중
```

요청이 없으면 `/learn`은 에이전트에게 현재 대화에서 재사용 가능한 워크플로를 추출하도록 요청합니다. 요청이 있으면 에이전트는 초점, 범위 및 명명 요구 사항을 준수하면서 경로, URL, 붙여 넣은 메모 및 대화 참조를 소스로 취급합니다. 기존 도구로 소스를 수집한 다음 `action: "create"`을 사용하여 `skill_workshop`을 호출합니다.

결과 제안은 `pending` 상태로 유지되며, `/learn`은 절대 이를 적용하지 않습니다. 일반 승인 흐름 또는 `openclaw skills workshop`을 통해 검토하고 적용하십시오.

생성:

```text
월요일 받은편지함 루틴을 실행하는 morning-catchup이라는 Skills를 만들어 주세요.
```

기존 작업 공간 Skills 업데이트:

```text
예약 전에 좌석 배치도도 확인하도록 trip-planning을 업데이트해 주세요.
```

보류 중인 제안 반복 수정:

```text
morning-catchup 제안을 보여 주세요.
긴급 표시된 항목도 알리도록 수정해 주세요.
morning-catchup 제안을 적용해 주세요.
```

에이전트가 시작한 `apply`, `reject` 및 `quarantine`은 기본적으로 추가 승인 프롬프트 없이 실행됩니다. 해당 작업 전에 운영자 승인을 요구하려면 `skills.workshop.approvalPolicy`을 `"pending"`로 설정하십시오.

승인이 필요한 경우 프롬프트에 제안 ID와 대상 Skills가 표시되며, 제안 설명, 지원 파일 수 및 본문 크기도 표시됩니다. 승인 요청은 에이전트 도구 감시 제한 시간 전에 완료되도록 제한됩니다. 프롬프트가 만료되기 전에 결정이 내려지지 않으면 수명 주기 작업은 실행되지 않으며, 제안은 변경 없이 보류 상태로 유지됩니다. 나중에 Skill Workshop UI에서 결정하거나 `openclaw skills workshop apply|reject|quarantine <proposal-id>`을 실행하십시오. 에이전트는 만료된 수명 주기 작업을 반복해서 재시도해서는 안 됩니다.

## CLI

```bash
# 생성
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "일일 받은편지함 정리: 분류, 보관, 선별, 초안 작성, 계획" \
  --proposal ./PROPOSAL.md

# 기존 작업 공간 Skills 업데이트
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 목록 표시 및 검사
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 승인 전 수정
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 종료 처리
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "중복"
openclaw skills workshop quarantine <proposal-id> --reason "보안 검토 필요"
```

모든 하위 명령은 `--agent <id>`(대상 작업 공간, 기본값은 현재 작업 디렉터리에서 추론한 후 기본 에이전트)과 `--json`(구조화된 출력)을 받습니다. `propose-create`, `propose-update` 및 `revise`은 `--proposal`과 함께 제안 컨텍스트를 기록하기 위해 `--goal <text>` 및 `--evidence <text>`도 받습니다.

## 제안 콘텐츠

보류 중인 제안은 제안 전용 frontmatter와 함께 `PROPOSAL.md`으로 저장됩니다.

```markdown
---
name: "morning-catchup"
description: "일일 받은편지함 정리: 분류, 보관, 선별, 초안 작성, 계획"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

적용 시 Skill Workshop은 활성 `SKILL.md`을 작성하고 제안 전용 필드인 `status`, 제안 `version` 및 제안 `date`을 제거합니다.

## 지원 파일

제안된 Skills에 `PROPOSAL.md` 옆에 둘 파일이 필요한 경우 `--proposal-dir`을 사용하십시오.

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "금요일 마무리: 통계, 주요 내용, 다음 주의 가장 중요한 세 가지" \
  --proposal-dir ./weekly-update-proposal
```

디렉터리에는 `PROPOSAL.md`이 포함되어야 합니다. 지원 파일은 `assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래에 있어야 합니다. Skill Workshop은 파일을 스캔하고 해시한 뒤 제안과 함께 저장하며, 적용 시에만 활성 `SKILL.md` 옆에 기록합니다.

거부되는 지원 파일 경로는 절대 경로, 숨김 경로 세그먼트, 경로 순회, 겹치는 경로, 실행 파일, UTF-8이 아닌 텍스트, null 바이트 및 표준 지원 폴더 외부의 경로입니다.

## 에이전트 도구

모델은 하나의 필수 `action`, 즉 `create | update | revise | list | inspect | apply | reject | quarantine`과 함께 `skill_workshop`을 사용합니다.
다른 매개변수는 작업에 따라 적용됩니다.

| 매개변수                   | 사용 작업                                            | 참고                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`         | `create`, `inspect`, `revise` | `create`에 필수이며, 그 외에는 이름으로 보류 중인 제안을 확인합니다 |
| `description`         | `create`, `update`, `revise` | 최대 160바이트                                                       |
| `skill_name`         | `update`                                   | 기존 Skills 이름 또는 키                                             |
| `proposal_content`         | `create`, `update`, `revise` | `PROPOSAL.md`으로 저장되며 `skills.workshop.maxSkillBytes`에 의해 제한됩니다 |
| `support_files`         | `create`, `update`, `revise` | `{ path, content }` 배열                                              |
| `goal`, `evidence` | `create`, `update`, `revise` | 자유 형식 컨텍스트                                                   |
| `proposal_id`         | `inspect`, `revise`, `apply`, `reject`, `quarantine` | 대상 제안                                                            |
| `reason`         | `apply`, `reject`, `quarantine` | 선택 사항                                                            |
| `query`, `status`, `limit` | `list` | 필터링/페이지 나누기, `limit` 최대 50, 기본값 20          |

에이전트는 생성된 Skills 작업에 `skill_workshop`을 사용해야 합니다. `write`, `edit`, `exec`, 셸 명령 또는 직접적인 파일 시스템 작업을 통해 제안 파일을 생성하거나 변경해서는 안 됩니다.

<Note>
`skill_workshop`은 기본 제공 에이전트 도구이며 `tools.profile: "coding"`에 포함됩니다. 더 엄격한 정책으로 이 도구가 숨겨진 경우 활성 `tools.allow` 목록에 `skill_workshop`을 추가하거나, 명시적인 `tools.allow`이 없는 프로필을 범위에서 사용하는 경우 `tools.alsoAllow: ["skill_workshop"]`을 사용하십시오. 샌드박스 실행은 호스트 측 Skill Workshop 도구를 구성하지 않으므로 일반 호스트 측 에이전트 세션 또는 CLI에서 제안 검토 작업을 실행하십시오.
</Note>

## 제안된 Skills

OpenClaw는 대화형 턴이 종료될 때 실패한 턴을 포함하여 “다음번에는”, “기억해 두세요” 및 반응형 수정과 같은 지속성 있는 지침을 감지합니다. 다음 턴에서 에이전트는 `skill_workshop`을 통해 가장 최근에 감지된 워크플로를 저장하도록 제안하며, 제안 생성 여부는 사용자가 결정합니다. 이 기본 제공 제안 기능은 자체적으로 Skills를 생성하거나 변경하지 않습니다. 대신 보류 중인 제안을 직접 생성하려면 `skills.workshop.autonomous.enabled`을 활성화하십시오. Control UI의 Workshop 탭에서는 페이지 헤더의 **자가 학습** 토글과 빈 제안 보드의 활성화 버튼을 통해 동일한 설정을 제공합니다.

### 과거 세션 스캔

Control UI에서는 자율 자가 학습을 활성화하지 않고도 이전 작업을 검토할 수 있습니다.
**Plugins → Workshop**을 열고 **Skills 아이디어 찾기**를 선택하십시오. 스캔은 가장 최근의 적격 세션부터 시작하여 실질적인 작업의 제한된 범위를 검토합니다. Cron, Heartbeat, 훅, 하위 에이전트, ACP, Plugin 소유 및 내부 검토 세션과 모델 턴이 6회 미만인 대화는 건너뜁니다.

검토자는 선택한 에이전트에 구성된 모델을 사용하며, 비밀 정보가 삭제되고 크기가 제한된 트랜스크립트 묶음을 받습니다. 경험 검토와 동일한 보수적 기준, 즉 구체적인 복구 패턴 또는 향후 모델이나 도구 호출을 최소 2회 줄일 수 있는 안정적인 절차를 적용합니다. 일상적인 작업과 일회성 사실은 제안을 생성하지 않아야 합니다.

한 번의 스캔으로 최대 3개의 보류 중인 제안을 생성하거나 수정할 수 있습니다. 활성 Skills를 적용, 거부, 격리 또는 편집할 수는 없습니다. Workshop에는 누적 검토 범위가 표시됩니다. 예: **검토한 세션 20개 · 6월 18일~오늘 · 발견한 아이디어 2개**. 저장된 가장 오래된 세션 커서부터 계속하려면 **이전 작업 스캔**을 선택하십시오. 사용 가능한 기록을 모두 검토하면 작업이 **새 작업 스캔**으로 변경됩니다.

과거 검토는
`skills.workshop.autonomous.enabled`이 `false`인 경우에도 수동으로 수행합니다. 클릭할 때마다 모델 실행이 시작되므로
제공업체의 가격 및 데이터 처리 약관이 적용됩니다. 커서와 적용 범위 개수는
공유 OpenClaw 상태 데이터베이스에 저장되며, 대화 기록 내용은 스캔 상태에
복사되지 않습니다.

자율 캡처를 활성화하면 OpenClaw는 성공적이고 상당한 작업이 완료된 후,
그리고 전체 에이전트 시스템이 유휴 상태가 된 후에도 보수적인 검토를 수행할 수 있습니다. 이 격리된 검토는
대기 중인 제안을 최대 하나만 생성하거나 수정할 수 있습니다. `approvalPolicy`이 `"auto"`인
경우에도 활성 스킬을 업데이트하거나 제안을 적용, 거부 또는 격리할 수 없습니다.

활성화, 적격성, 개인정보 보호 및 비용 세부 정보,
제안 임계값과 문제 해결 방법은 [자기 학습](/tools/self-learning)을 참조하십시오.

## 승인 및 자율성

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 설정                    | 기본값  | 효과                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | 명시적 수정 사항과, 유휴 지연 후 재사용 가능한 복구 또는 유의미한 왕복 비용 절감이 있는 상당한 완료 작업에서 대기 중인 제안을 생성합니다.   |
| `allowSymlinkTargetWrites` | `false`  | 실제 대상이 `skills.load.allowSymlinkTargets`에 나열된 작업 공간 스킬 심볼릭 링크를 통해 적용 작업이 쓰기를 수행할 수 있게 합니다.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"`는 에이전트가 시작한 `apply`, `reject` 또는 `quarantine`에 대한 추가 프롬프트를 건너뜁니다(에이전트는 여전히 해당 작업을 호출해야 합니다). `"pending"`에는 승인이 필요합니다. |
| `maxPending`               | `50`     | 작업 공간별 대기 중 및 격리된 제안 수를 제한합니다(1~200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | 제안 본문 크기를 바이트 단위로 제한합니다(1024~200000).                                                                                                                     |

자율 캡처는 사전 지시 규칙(예: “앞으로는”)과 반응형
수정 사항(예: “그건 제가 요청한 것이 아닙니다”)을 인식합니다. 새 지침을 주제별로 그룹화하여
턴당 최대 3개의 제안으로 만들고, 어휘 일치 항목을 기존의 쓰기 가능한 작업 공간 스킬로 라우팅하며,
동일한 스킬을 대상으로 하는 또 다른 수정 사항이 있으면 자체 대기 중 제안을 수정합니다.

명시적 수정 없이 성공적으로 상당한 작업을 완료한 경우, 선택한
모델의 격리된 실행이 완료된 경로가 보수적인 제안 기준을 충족하는지 판단합니다.
포그라운드 모델은 응답하기 전에 학습하라는 프롬프트를 받지 않습니다. 백그라운드 검토자는
포그라운드 실행을 제안의 출처로 보존하고, 일반 에이전트 도구에 접근할 수 없으며, 수명 주기
결정을 내릴 수 없습니다. 검토는 포그라운드 런타임이 정확히 확인된 모델과
`skill_workshop`이 실제로 사용 가능했음을 모두 보고한 경우에만 시작됩니다. 따라서 제한적이거나 알 수 없는
도구 정책은 안전하게 실패하며 제안을 생성하지 않습니다.

전체 자율 검토 동작 및 안전
모델은 [자기 학습](/tools/self-learning)을 참조하십시오.

제안 설명은
`maxSkillBytes`과 관계없이 항상 160바이트로 제한됩니다.

## Gateway 메서드

| 메서드                             | 범위            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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

`requestRevision`은 Gateway 전용이며(CLI 또는 에이전트 도구에 해당 기능 없음),
에이전트가 문자 그대로의 새 콘텐츠를 제출하는 대신 수정하도록 요청하는 UI를 위해
`PROPOSAL.md`을 직접 교체하지 않고 자유 형식의 수정 지침을 소유 에이전트의 채팅 세션으로
전달합니다.

`historyStatus`과 `historyScan`은 Control UI 지원 메서드입니다. `historyScan`은
`direction: "older" | "newer"`을 허용하며, 결과를 항상 대기 중인
제안으로 남겨 둡니다.

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
- `PROPOSAL.md`: 대기 중인 스킬 제안.
- `rollback.json`: 적용 작업이 활성 파일을 변경하기 전에 기록되는 복구 메타데이터.

## 제한

| 제한                           | 값                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 설명                     | 160바이트                                                            |
| 제안 본문                   | `skills.workshop.maxSkillBytes` (기본값 40,000, 절대 상한 1 MiB) |
| 지원 파일                   | 제안당 64개                                                      |
| 지원 파일 크기               | 각각 256 KiB, 총 2 MiB                                            |
| 대기 중 + 격리된 제안 | 작업 공간당 `skills.workshop.maxPending`개(기본값 50)              |

## 문제 해결

| 문제                                        | 해결 방법                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description`을 160바이트 이하로 줄이십시오.                                                                                                                                                                 |
| `Skill proposal content is too large`          | 제안 본문을 줄이거나 `skills.workshop.maxSkillBytes`을 늘리십시오.                                                                                                                                         |
| `Target skill changed after proposal creation` | 현재 대상을 기준으로 제안을 수정하거나 새 제안을 생성하십시오.                                                                                                                                   |
| `Proposal scan failed`                         | 스캐너 발견 사항을 검사한 다음 제안을 수정하거나 격리하십시오.                                                                                                                                           |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets`을 구성하고, 의도적으로 공유하는 스킬 루트에 대해서만 `skills.workshop.allowSymlinkTargetWrites`을 활성화하십시오.                                                                  |
| `Support file paths must be under one of...`   | 지원 파일을 `assets/`, `examples/`, `references/`, `scripts/` 또는 `templates/` 아래로 이동하십시오.                                                                                                                |
| 제안이 목록에 표시되지 않음                 | 선택한 `--agent` 작업 공간과 `OPENCLAW_STATE_DIR`을 확인하십시오.                                                                                                                                            |
| 에이전트가 `skill_workshop`을 호출할 수 없음             | 활성 도구 정책과 실행 모드를 확인하십시오. `coding`에는 해당 도구가 포함됩니다. 제한적인 `tools.allow` 정책에서는 이를 명시적으로 나열해야 하며, 샌드박스 실행에서는 일반 호스트 측 에이전트 세션이나 CLI를 사용해야 합니다. |

### 도구 정책 진단

자율 캡처가 활성화되면 `openclaw doctor`이 기본 에이전트에 대해
`core/doctor/skill-workshop-tool-policy` 검사를 실행합니다. 정책이
`skill_workshop`을 숨기는 경우, 경고에는 이를 처음으로 제외하는 구성 계층과
필요한 정확한 `allow` 또는 `alsoAllow` 변경 사항이 표시됩니다. 이전 런북에서는 여전히
`openclaw plugins inspect skill-workshop`을 사용할 수 있습니다. 이제 이 명령은 Skill
Workshop이 기본 제공됨을 설명하고 해당하는 경우 동일한 정책 힌트를 출력합니다.

## 관련 항목

- 로드 순서, 우선순위 및 표시 여부에 관한 [Skills](/ko/tools/skills)
- 보수적인 실행 후 스킬 제안에 관한 [자기 학습](/tools/self-learning)
- 수동 작성 `SKILL.md`
  기본 사항에 관한 [스킬 만들기](/ko/tools/creating-skills)
- 전체 `skills.workshop` 스키마에 관한 [스킬 구성](/ko/tools/skills-config)
- `openclaw skills` 명령에 관한 [Skills CLI](/ko/cli/skills)
