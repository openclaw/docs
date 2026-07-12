---
read_when:
    - OpenClaw이 자연스러운 후속 대화를 기억하도록 하고 싶습니다
    - 추론된 체크인과 미리 알림의 차이점을 알아보려고 합니다
    - 후속 약속을 검토하거나 취소하려고 합니다
sidebarTitle: Commitments
summary: 정확한 알림이 아닌 체크인을 위해 추론된 후속 메모리
title: 추론된 약속 사항
x-i18n:
    generated_at: "2026-07-12T15:09:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments는 단기적인 후속 확인 메모리입니다. 이 기능을 활성화하면 OpenClaw는
대화에서 향후 확인할 기회가 생겼음을 감지하고 나중에 다시 언급하도록
기억할 수 있습니다.

예:

- 내일 면접이 있다고 말하면 OpenClaw가 면접 후에 상황을 확인할 수 있습니다.
- 지쳤다고 말하면 OpenClaw가 나중에 잠을 잤는지 물어볼 수 있습니다.
- 에이전트가 무언가 변경된 후 후속 확인을 하겠다고 말하면 OpenClaw가 해당
  미해결 사항을 추적할 수 있습니다.

Commitments는 `MEMORY.md`와 같은 영구적인 사실이 아니며, 정확한
알림도 아닙니다. 메모리와 자동화의 중간에 위치합니다. OpenClaw가
대화에 연결된 의무를 기억한 다음, 기한이 되면 Heartbeat가 이를 전달합니다.

## Commitments 활성화

Commitments는 기본적으로 비활성화되어 있습니다(`commitments.enabled: false`). 구성에서 활성화하십시오.

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

동일한 `openclaw.json` 구성:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay`는 하루 단위의 이동 기간 동안 에이전트 세션별로 전달할 수 있는
추론된 후속 확인의 수를 제한합니다. 기본값은 `3`입니다.

## 작동 방식

에이전트가 응답한 후 OpenClaw는 도구가 비활성화된 별도의 컨텍스트에서
숨겨진 백그라운드 추출 단계를 실행할 수 있습니다. 이 단계에서는 추론된 후속 확인 Commitments만 찾습니다.
표시되는 대화에 내용을 기록하지 않으며, 메인 에이전트에게
추출에 관해 추론하도록 요청하지도 않습니다.

신뢰도가 높은 후보를 찾으면 OpenClaw는 다음 정보와 함께 Commitment를 저장합니다.

- 에이전트 ID
- 세션 키
- 원래 채널 및 전달 대상
- 기한 범위
- 제안된 짧은 확인 메시지
- Heartbeat가 전송 여부를 결정하는 데 사용하는 비지시적 메타데이터

전달은 Heartbeat를 통해 이루어집니다. Commitment의 기한이 되면 Heartbeat는
동일한 에이전트와 채널 범위의 Heartbeat 턴에 해당 Commitment를 추가합니다.
프롬프트는 Commitment 메타데이터를 신뢰할 수 없다고 명시적으로 경고하고,
그 안의 지시를 따르거나 그로 인해 도구를 사용하지 않도록 모델에 지시합니다.
모델은 자연스러운 확인 메시지 하나를 보내거나 `HEARTBEAT_OK`로 응답하여 이를 해제할 수 있습니다.
Heartbeat가 `target: "none"`으로 구성된 경우 기한이 된 Commitments는
내부에만 유지되며 외부 확인 메시지를 보내지 않습니다. Commitment 전달 프롬프트는
원래 대화 텍스트를 재현하지 않고 제안된 확인 메시지와
메타데이터만 포함하며, 기한이 된 Commitment의 Heartbeat 턴은 OpenClaw 도구 없이 실행됩니다.

OpenClaw는 추론된 Commitment를 기록한 직후에는 절대 전달하지 않습니다.
기한은 Commitment가 생성된 후 최소 한 번의 Heartbeat 간격 이후로 제한되므로,
후속 확인이 추론된 바로 그 순간에 되풀이되어 전달될 수 없습니다.

## 범위

Commitments는 생성된 정확한 에이전트 및 채널 컨텍스트로 범위가 제한됩니다.
Discord에서 한 에이전트와 대화하는 동안 추론된 후속 확인은
다른 에이전트, 다른 채널 또는 관련 없는 세션에서 전달되지 않습니다.

이 범위 제한은 기능의 일부입니다. 자연스러운 확인 메시지는 전역 알림 시스템이 아니라
동일한 대화가 계속되는 것처럼 느껴져야 합니다.

## Commitments와 알림 비교

| 필요                                            | 사용                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "오후 3시에 알려 줘"                            | [예약된 작업](/ko/automation/cron-jobs)     |
| "20분 후에 알려 줘"                             | [예약된 작업](/ko/automation/cron-jobs)     |
| "평일마다 이 보고서를 실행해 줘"                | [예약된 작업](/ko/automation/cron-jobs)     |
| "내일 면접이 있어"                              | Commitments                              |
| "밤을 꼬박 새웠어"                              | Commitments                              |
| "이 미해결 스레드에 내가 답하지 않으면 후속 확인해 줘" | Commitments                         |

사용자의 명시적인 요청은 이미 스케줄러 경로에 속합니다. Commitments는
추론된 후속 확인에만 사용됩니다. 즉, 사용자가 알림을 요청하지는 않았지만
대화에서 향후 확인하는 것이 명확히 유용해진 경우입니다.

## Commitments 관리

CLI를 사용하여 저장된 Commitments를 확인하고 삭제하십시오.

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

전체 명령 참조는 [`openclaw commitments`](/ko/cli/commitments)를 참조하십시오.

## 개인정보 보호 및 비용

Commitment 추출에는 LLM 단계가 사용되므로, 이를 활성화하면 조건에 맞는 턴 이후에
백그라운드 모델 사용량이 추가됩니다. 이 단계는 사용자에게 표시되는
대화에서는 숨겨지지만, 후속 확인이 필요한지 판단하는 데 필요한 최근 대화를
읽을 수 있습니다.

저장된 Commitments는 OpenClaw의 로컬 상태입니다. 이는 장기 메모리가 아니라
운영 메모리입니다. 다음 명령으로 기능을 비활성화하십시오.

```bash
openclaw config set commitments.enabled false
```

## 문제 해결

예상한 후속 확인이 나타나지 않는 경우:

- `commitments.enabled`가 `true`인지 확인하십시오.
- `openclaw commitments --all`에서 대기 중, 해제됨, 다시 알림 또는 만료된
  레코드를 확인하십시오.
- 해당 에이전트에서 Heartbeat가 실행 중인지 확인하십시오.
- 해당 에이전트 세션에서 이미 `commitments.maxPerDay`에
  도달했는지 확인하십시오.
- 정확한 알림은 Commitment 추출에서 건너뛰며, 대신 [예약된 작업](/ko/automation/cron-jobs)에
  표시되어야 한다는 점을 기억하십시오.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [Active Memory](/ko/concepts/active-memory)
- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [`openclaw commitments`](/ko/cli/commitments)
- [구성 참조](/ko/gateway/configuration-reference#commitments)
