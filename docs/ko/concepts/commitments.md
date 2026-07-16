---
read_when:
    - OpenClaw이 자연스러운 후속 대화를 기억하도록 하려 합니다
    - 추론된 체크인이 미리 알림과 어떻게 다른지 이해하려고 합니다
    - 후속 조치 약속을 검토하거나 해제하려고 합니다
sidebarTitle: Commitments
summary: 정확한 미리 알림이 아닌 체크인을 위해 추론된 후속 기억 사항
title: 추론된 약속 사항
x-i18n:
    generated_at: "2026-07-16T12:32:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitment는 수명이 짧은 후속 확인용 기억입니다. 이 기능을 활성화하면 OpenClaw는
대화에서 향후 확인할 기회가 생겼음을 감지하고 이를 기억했다가
나중에 다시 언급할 수 있습니다.

예:

- 내일 면접이 있다고 언급합니다. OpenClaw가 면접 후에 상황을 물을 수 있습니다.
- 매우 지쳤다고 말합니다. OpenClaw가 나중에 잠을 잤는지 물을 수 있습니다.
- 에이전트가 무언가 변경된 후에 후속 확인을 하겠다고 말합니다. OpenClaw가
  이 미해결 사항을 추적할 수 있습니다.

Commitment는 `MEMORY.md` 같은 영구적인 사실이 아니며, 정확한
알림도 아닙니다. 기억과 자동화 사이에 위치합니다. OpenClaw가
대화에 종속된 의무를 기억한 후, 기한이 되면 Heartbeat가 이를 전달합니다.

## Commitment 활성화

Commitment는 기본적으로 비활성화되어 있습니다(`commitments.enabled: false`). 구성에서 활성화하십시오.

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

동일한 `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay`은 하루 단위의 이동 기간 동안 에이전트 세션별로 전달할 수 있는
추론된 후속 확인의 수를 제한합니다. 기본값은 `3`입니다.

## 작동 방식

에이전트가 응답한 후 OpenClaw는 도구가 비활성화된 별도의 컨텍스트에서
숨겨진 백그라운드 추출 단계를 실행할 수 있습니다. 이 단계는 추론된 후속 확인 Commitment만 찾습니다.
표시되는 대화에 내용을 작성하지 않으며, 기본 에이전트에
추출에 관해 추론하도록 요청하지도 않습니다.

신뢰도가 높은 후보를 찾으면 OpenClaw는 다음 정보와 함께 Commitment를 저장합니다.

- 에이전트 ID
- 세션 키
- 원래 채널 및 전달 대상
- 기한 범위
- 짧은 권장 확인 메시지
- Heartbeat가 전송 여부를 결정하는 데 사용하는 비지시적 메타데이터

전달은 Heartbeat를 통해 이루어집니다. Commitment의 기한이 되면 Heartbeat는
동일한 에이전트 및 채널 범위의 Heartbeat 턴에 해당 Commitment를 추가합니다.
프롬프트는 Commitment 메타데이터를 신뢰할 수 없다고 명시적으로 경고하며,
모델이 그 안의 지시를 따르거나 그로 인해 도구를 사용하지 않도록 지시합니다.
모델은 자연스러운 확인 메시지 하나를 보내거나 `HEARTBEAT_OK`로 응답하여 이를 해제할 수 있습니다.
Heartbeat가 `target: "none"`으로 구성되어 있으면 기한이 된 Commitment는
내부에 유지되며 외부 확인 메시지를 보내지 않습니다. Commitment 전달 프롬프트는
원래 대화 텍스트를 재현하지 않고 권장 확인 메시지와
메타데이터만 포함하며, 기한이 된 Commitment의 Heartbeat 턴은 OpenClaw 도구 없이 실행됩니다.

OpenClaw는 추론된 Commitment를 기록한 직후에는 절대 전달하지 않습니다.
기한은 Commitment가 생성된 후 최소 한 번의 Heartbeat 간격이 지난 시점으로
제한되므로, 후속 확인이 추론된 바로 그 순간에 되풀이되어 나타나지 않습니다.

## 범위

Commitment는 생성된 정확한 에이전트 및 채널 컨텍스트로 범위가 제한됩니다.
Discord에서 한 에이전트와 대화하는 동안 추론된 후속 확인은
다른 에이전트, 다른 채널 또는 관련 없는 세션을 통해 전달되지 않습니다.

이 범위 지정은 기능의 일부입니다. 자연스러운 확인 메시지는 전역 알림 시스템이 아니라
동일한 대화가 이어지는 것처럼 느껴져야 합니다.

## Commitment와 알림 비교

| 요구 사항                                        | 사용 기능                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "오후 3시에 알려 줘"                              | [예약된 작업](/ko/automation/cron-jobs) |
| "20분 후에 알려 줘"                               | [예약된 작업](/ko/automation/cron-jobs) |
| "평일마다 이 보고서를 실행해 줘"                    | [예약된 작업](/ko/automation/cron-jobs) |
| "내일 면접이 있어"                                 | Commitment                              |
| "밤을 꼬박 새웠어"                                 | Commitment                              |
| "이 미해결 스레드에 답하지 않으면 후속 확인해 줘"      | Commitment                              |

사용자의 명시적인 요청은 이미 스케줄러 경로에서 처리됩니다. Commitment는
추론된 후속 확인에만 사용됩니다. 즉, 사용자가 알림을 요청하지 않았지만
대화에서 향후 확인하는 것이 유용하다는 점이 분명해진 경우에 사용됩니다.

## Commitment 관리

CLI를 사용하여 저장된 Commitment를 확인하고 삭제하십시오.

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

전체 명령어 참조는 [`openclaw commitments`](/ko/cli/commitments)을 참조하십시오.

## 개인정보 보호 및 비용

Commitment 추출에는 LLM 단계가 사용되므로, 이 기능을 활성화하면 대상이 되는 턴 이후에
백그라운드 모델 사용량이 추가됩니다. 이 단계는 사용자에게 표시되는
대화에서는 숨겨지지만, 후속 확인이 있는지 판단하는 데 필요한 최근 대화 내용을
읽을 수 있습니다.

저장된 Commitment는 장기 기억이 아니라 공유 SQLite 상태 데이터베이스에 저장되는
OpenClaw의 로컬 운영 기억입니다. 다음 명령으로 기능을 비활성화하십시오.

```bash
openclaw config set commitments.enabled false
```

## 문제 해결

예상한 후속 확인이 나타나지 않는 경우:

- `commitments.enabled`이 `true`인지 확인하십시오.
- 대기 중, 해제됨, 다시 알림 또는 만료된 레코드가 있는지 `openclaw commitments --all`을
  확인하십시오.
- 해당 에이전트에서 Heartbeat가 실행 중인지 확인하십시오.
- 해당 에이전트 세션에서 `commitments.maxPerDay`에 이미 도달했는지
  확인하십시오.
- 명시적인 알림은 Commitment 추출에서 건너뛰며 대신
  [예약된 작업](/ko/automation/cron-jobs)에 나타나야 한다는 점에 유의하십시오.

## 관련 항목

- [기억 개요](/ko/concepts/memory)
- [Active Memory](/ko/concepts/active-memory)
- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [`openclaw commitments`](/ko/cli/commitments)
- [구성 참조](/ko/gateway/configuration-reference#commitments)
