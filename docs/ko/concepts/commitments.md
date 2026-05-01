---
read_when:
    - OpenClaw가 자연스러운 후속 대화를 기억하게 하고 싶은 경우
    - 추론된 체크인이 리마인더와 어떻게 다른지 이해하려는 경우
    - 후속 약속 사항을 검토하거나 해제하려는 경우
sidebarTitle: Commitments
summary: 정확한 알림이 아닌 확인을 위한 추론된 후속 메모리
title: 추론된 약속 사항
x-i18n:
    generated_at: "2026-05-01T06:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

약속은 단기 후속 메모리입니다. 활성화하면 OpenClaw는 대화가 향후 확인할 기회를 만들었음을 알아차리고 나중에 다시 꺼내도록 기억할 수 있습니다.

예시:

- 내일 면접이 있다고 말합니다. OpenClaw가 이후에 확인할 수 있습니다.
- 지쳤다고 말합니다. OpenClaw가 나중에 잠을 잤는지 물어볼 수 있습니다.
- 에이전트가 무언가 변경된 뒤 후속 확인을 하겠다고 말합니다. OpenClaw가 그 열린 루프를 추적할 수 있습니다.

약속은 `MEMORY.md` 같은 지속적인 사실이 아니며, 정확한 리마인더도 아닙니다. 약속은 메모리와 자동화 사이에 있습니다. OpenClaw는 대화에 묶인 의무를 기억한 다음, 기한이 되면 Heartbeat가 이를 전달합니다.

## 약속 활성화

약속은 기본적으로 꺼져 있습니다. config에서 활성화하세요.

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

동등한 `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay`는 롤링 일 단위로 에이전트 세션마다 전달될 수 있는 추론된 후속 확인 수를 제한합니다. 기본값은 `3`입니다.

## 작동 방식

에이전트 응답 이후 OpenClaw는 별도 컨텍스트에서 숨겨진 백그라운드 추출 단계를 실행할 수 있습니다. 이 단계는 추론된 후속 약속만 찾습니다. 보이는 대화에는 쓰지 않으며, 메인 에이전트에게 추출에 대해 추론하도록 요청하지도 않습니다.

신뢰도가 높은 후보를 찾으면 OpenClaw는 다음과 함께 약속을 저장합니다.

- 에이전트 id
- 세션 키
- 원래 채널과 전달 대상
- 기한 창
- 짧은 추천 확인 메시지
- Heartbeat가 전송 여부를 결정하는 데 사용하는 비지시적 메타데이터

전달은 Heartbeat를 통해 이루어집니다. 약속의 기한이 되면 Heartbeat는 같은 에이전트와 채널 범위의 Heartbeat 턴에 약속을 추가합니다. 모델은 자연스러운 확인 메시지 하나를 보내거나 `HEARTBEAT_OK`라고 응답해 이를 해제할 수 있습니다. Heartbeat가 `target: "none"`으로 구성된 경우, 기한이 된 약속은 내부에 남고 외부 확인 메시지를 보내지 않습니다. 약속 전달 프롬프트는 원래 대화 텍스트를 다시 재생하지 않으며, 기한이 된 약속 Heartbeat 턴은 OpenClaw 도구 없이 실행됩니다.

OpenClaw는 추론된 약속을 기록한 직후에는 절대 전달하지 않습니다. 기한은 약속이 생성된 뒤 최소 하나의 Heartbeat 간격 이후로 제한되므로, 후속 확인이 추론된 바로 그 순간 되돌아오듯 반복될 수 없습니다.

## 범위

약속은 생성된 정확한 에이전트와 채널 컨텍스트로 범위가 제한됩니다. Discord에서 한 에이전트와 대화하는 동안 추론된 후속 확인은 다른 에이전트, 다른 채널, 또는 관련 없는 세션에서 전달되지 않습니다.

이 범위는 기능의 일부입니다. 자연스러운 확인은 전역 리마인더 시스템처럼 느껴지는 것이 아니라 같은 대화가 이어지는 것처럼 느껴져야 합니다.

## 약속과 리마인더 비교

| 필요                                            | 사용                                      |
| ----------------------------------------------- | ---------------------------------------- |
| "오후 3시에 알려줘"                             | [예약된 작업](/ko/automation/cron-jobs) |
| "20분 뒤에 핑해줘"                         | [예약된 작업](/ko/automation/cron-jobs) |
| "매주 평일마다 이 보고서를 실행해줘"                 | [예약된 작업](/ko/automation/cron-jobs) |
| "내일 면접이 있어"                  | 약속                              |
| "밤새 깨어 있었어"                            | 약속                              |
| "내가 이 열린 스레드에 답하지 않으면 후속 확인해줘" | 약속                              |

사용자의 명시적인 요청은 이미 스케줄러 경로에 속합니다. 약속은 추론된 후속 확인에만 사용됩니다. 즉, 사용자가 리마인더를 요청하지 않았지만 대화가 유용한 향후 확인 기회를 명확히 만든 순간에 사용됩니다.

## 약속 관리

CLI를 사용해 저장된 약속을 검사하고 지우세요.

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

명령어 참조는 [`openclaw commitments`](/ko/cli/commitments)를 참고하세요.

## 개인정보 보호 및 비용

약속 추출은 LLM 단계를 사용하므로, 이를 활성화하면 적격 턴 이후 백그라운드 모델 사용량이 추가됩니다. 이 단계는 사용자에게 보이는 대화에서는 숨겨지지만, 후속 확인이 존재하는지 판단하는 데 필요한 최근 대화는 읽을 수 있습니다.

저장된 약속은 로컬 OpenClaw 상태입니다. 장기 메모리가 아니라 운영 메모리입니다. 다음으로 이 기능을 비활성화하세요.

```bash
openclaw config set commitments.enabled false
```

## 문제 해결

예상한 후속 확인이 나타나지 않는 경우:

- `commitments.enabled`가 `true`인지 확인하세요.
- 보류 중, 해제됨, 스누즈됨, 만료됨 레코드는 `openclaw commitments --all`로 확인하세요.
- 에이전트에 대해 Heartbeat가 실행 중인지 확인하세요.
- 해당 에이전트 세션에서 이미 `commitments.maxPerDay`에 도달했는지 확인하세요.
- 정확한 리마인더는 약속 추출에서 건너뛰며, 대신 [예약된 작업](/ko/automation/cron-jobs)에 나타나야 한다는 점을 기억하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [Active Memory](/ko/concepts/active-memory)
- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [`openclaw commitments`](/ko/cli/commitments)
- [구성 참조](/ko/gateway/configuration-reference#commitments)
