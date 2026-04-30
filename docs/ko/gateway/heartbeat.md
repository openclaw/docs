---
read_when:
    - Heartbeat 주기 또는 메시징 조정
    - 예약된 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Heartbeat
summary: Heartbeat 폴링 메시지 및 알림 규칙
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T06:31:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat와 cron?** 각각 언제 사용해야 하는지에 대한 지침은 [Automation & Tasks](/ko/automation)를 참조하세요.
</Note>

Heartbeat는 기본 세션에서 **주기적인 agent 턴**을 실행하여, 모델이 사용자에게 스팸을 보내지 않으면서도 주의가 필요한 항목을 드러낼 수 있게 합니다.

Heartbeat는 예약된 기본 세션 턴입니다. [background task](/ko/automation/tasks) 레코드를 만들지는 **않습니다**. 작업 레코드는 분리된 작업(ACP 실행, subagent, 격리된 cron 작업)을 위한 것입니다.

문제 해결: [Scheduled Tasks](/ko/automation/cron-jobs#troubleshooting)

## 빠른 시작(초보자)

<Steps>
  <Step title="Pick a cadence">
    Heartbeat를 활성화된 상태로 두거나(기본값은 `30m`, 또는 Claude CLI 재사용을 포함한 Anthropic OAuth/token 인증의 경우 `1h`) 직접 주기를 설정하세요.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    agent 작업 영역에 작은 `HEARTBEAT.md` 체크리스트 또는 `tasks:` 블록을 만드세요.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"`이 기본값입니다. 마지막 연락처로 라우팅하려면 `target: "last"`를 설정하세요.
  </Step>
  <Step title="Optional tuning">
    - 투명성을 위해 Heartbeat 추론 전달을 활성화하세요.
    - Heartbeat 실행에 `HEARTBEAT.md`만 필요한 경우 경량 bootstrap 컨텍스트를 사용하세요.
    - 각 Heartbeat마다 전체 대화 기록을 보내지 않도록 격리된 세션을 활성화하세요.
    - Heartbeat를 활성 시간(현지 시간)으로 제한하세요.

  </Step>
</Steps>

예시 구성:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## 기본값

- 간격: `30m`(또는 Claude CLI 재사용을 포함해 Anthropic OAuth/token 인증이 감지된 인증 모드인 경우 `1h`). `agents.defaults.heartbeat.every` 또는 agent별 `agents.list[].heartbeat.every`를 설정하세요. 비활성화하려면 `0m`을 사용하세요.
- 프롬프트 본문(`agents.defaults.heartbeat.prompt`로 구성 가능): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 프롬프트는 사용자 메시지로 **그대로** 전송됩니다. 시스템 프롬프트에는 기본 agent에 Heartbeat가 활성화되어 있을 때만 "Heartbeat" 섹션이 포함되며, 실행은 내부적으로 플래그 처리됩니다.
- `0m`으로 Heartbeat가 비활성화되면, 일반 실행에서도 bootstrap 컨텍스트에서 `HEARTBEAT.md`를 생략하여 모델이 Heartbeat 전용 지침을 보지 않게 합니다.
- 활성 시간(`heartbeat.activeHours`)은 구성된 시간대에서 확인됩니다. 창 밖에서는 창 안의 다음 tick까지 Heartbeat를 건너뜁니다.
- Heartbeat는 cron 작업이 활성 상태이거나 대기열에 있으면 자동으로 연기됩니다. 추가 busy lane(subagent 또는 중첩 명령 작업)에서도 연기하려면 `heartbeat.skipWhenBusy: true`를 설정하세요. 이는 로컬 Ollama 및 기타 제약이 있는 단일 런타임 호스트에 유용합니다.

## Heartbeat 프롬프트의 용도

기본 프롬프트는 의도적으로 넓게 설계되었습니다.

- **백그라운드 작업**: "Consider outstanding tasks"는 agent가 후속 조치(받은 편지함, 캘린더, 알림, 대기 중인 작업)를 검토하고 긴급한 항목을 드러내도록 유도합니다.
- **사람 확인**: "Checkup sometimes on your human during day time"은 가끔 가벼운 "필요한 것이 있나요?" 메시지를 유도하지만, 구성된 로컬 시간대를 사용하여 야간 스팸은 피합니다([Timezone](/ko/concepts/timezone) 참조).

Heartbeat는 완료된 [background tasks](/ko/automation/tasks)에 반응할 수 있지만, Heartbeat 실행 자체는 작업 레코드를 만들지 않습니다.

Heartbeat가 매우 구체적인 작업(예: "Gmail PubSub 통계 확인" 또는 "Gateway 상태 확인")을 하게 하려면 `agents.defaults.heartbeat.prompt`(또는 `agents.list[].heartbeat.prompt`)를 사용자 지정 본문(그대로 전송됨)으로 설정하세요.

## 응답 계약

- 주의가 필요한 항목이 없으면 **`HEARTBEAT_OK`**로 응답하세요.
- Heartbeat 실행 중에는 응답의 **시작 또는 끝**에 `HEARTBEAT_OK`가 나타나면 OpenClaw는 이를 ack로 처리합니다. 토큰은 제거되며, 남은 내용이 **≤ `ackMaxChars`**(기본값: 300)이면 응답은 드롭됩니다.
- `HEARTBEAT_OK`가 응답의 **중간**에 나타나면 특별하게 처리되지 않습니다.
- 알림의 경우 `HEARTBEAT_OK`를 포함하지 **마세요**. 알림 텍스트만 반환하세요.

Heartbeat 외부에서는 메시지 시작/끝의 불필요한 `HEARTBEAT_OK`가 제거되고 기록됩니다. 메시지가 `HEARTBEAT_OK`만 포함하면 드롭됩니다.

## 구성

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### 범위와 우선순위

- `agents.defaults.heartbeat`는 전역 Heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`가 그 위에 병합됩니다. 어떤 agent라도 `heartbeat` 블록이 있으면 **해당 agent들만** Heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 가시성 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 재정의합니다.
- `channels.<channel>.accounts.<id>.heartbeat`(다중 계정 채널)는 채널별 설정을 재정의합니다.

### Agent별 Heartbeat

어떤 `agents.list[]` 항목이라도 `heartbeat` 블록을 포함하면 **해당 agent들만** Heartbeat를 실행합니다. agent별 블록은 `agents.defaults.heartbeat` 위에 병합됩니다(따라서 공유 기본값을 한 번 설정하고 agent별로 재정의할 수 있습니다).

예시: agent 두 개 중 두 번째 agent만 Heartbeat를 실행합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 활성 시간 예시

특정 시간대의 업무 시간으로 Heartbeat를 제한합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

이 창 밖(동부 시간 오전 9시 전 또는 오후 10시 후)에서는 Heartbeat를 건너뜁니다. 창 안의 다음 예약 tick은 정상적으로 실행됩니다.

### 24/7 설정

Heartbeat를 하루 종일 실행하려면 다음 패턴 중 하나를 사용하세요.

- `activeHours`를 완전히 생략합니다(시간 창 제한 없음. 이것이 기본 동작입니다).
- 하루 전체 창을 설정합니다: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
동일한 `start` 및 `end` 시간을 설정하지 마세요(예: `08:00`에서 `08:00`). 이는 너비가 0인 창으로 처리되므로 Heartbeat가 항상 건너뛰어집니다.
</Warning>

### 다중 계정 예시

Telegram과 같은 다중 계정 채널에서 특정 계정을 대상으로 지정하려면 `accountId`를 사용하세요.

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### 필드 참고 사항

<ParamField path="every" type="string">
  Heartbeat 간격(기간 문자열, 기본 단위 = 분).
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 실행을 위한 선택적 모델 재정의(`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  활성화하면 사용 가능한 경우 별도의 `Reasoning:` 메시지도 전달합니다(`/reasoning on`과 동일한 형태).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true이면 Heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 작업 영역 bootstrap 파일에서 `HEARTBEAT.md`만 유지합니다.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true이면 각 Heartbeat가 이전 대화 기록이 없는 새 세션에서 실행됩니다. cron `sessionTarget: "isolated"`와 동일한 격리 패턴을 사용합니다. Heartbeat별 토큰 비용을 크게 줄입니다. 최대 절감을 위해 `lightContext: true`와 함께 사용하세요. 전달 라우팅은 여전히 기본 세션 컨텍스트를 사용합니다.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true이면 Heartbeat 실행은 추가 busy lane인 subagent 또는 중첩 명령 작업에서 연기됩니다. cron lane은 이 플래그가 없어도 항상 Heartbeat를 연기하므로, 로컬 모델 호스트는 cron과 Heartbeat 프롬프트를 동시에 실행하지 않습니다.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 실행을 위한 선택적 세션 키입니다.

- `main`(기본값): agent 기본 세션.
- 명시적 세션 키(`openclaw sessions --json` 또는 [sessions CLI](/ko/cli/sessions)에서 복사).
- 세션 키 형식: [Sessions](/ko/concepts/session) 및 [Groups](/ko/channels/groups)를 참조하세요.

</ParamField>
<ParamField path="target" type="string">
- `last`: 마지막으로 사용한 외부 채널로 전달합니다.
- 명시적 채널: 구성된 채널 또는 Plugin id(예: `discord`, `matrix`, `telegram`, `whatsapp`).
- `none`(기본값): Heartbeat는 실행하지만 외부로는 **전달하지 않습니다**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM 전달 동작을 제어합니다. `allow`: direct/DM Heartbeat 전달을 허용합니다. `block`: direct/DM 전달을 억제합니다(`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  선택적 수신자 재정의(채널별 id, 예: WhatsApp의 E.164 또는 Telegram chat id). Telegram topic/thread의 경우 `<chatId>:topic:<messageThreadId>`를 사용하세요.

</ParamField>
<ParamField path="accountId" type="string">
  다중 계정 채널을 위한 선택적 account id입니다. `target: "last"`일 때 account id는 계정을 지원하는 경우 확인된 마지막 채널에 적용되며, 그렇지 않으면 무시됩니다. account id가 확인된 채널에 구성된 계정과 일치하지 않으면 전달은 건너뜁니다.

</ParamField>
<ParamField path="prompt" type="string">
  기본 프롬프트 본문을 재정의합니다(병합되지 않음).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  전달 전에 `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수입니다.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 숨깁니다.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 실행을 시간 창으로 제한합니다. `start`(HH:MM, 포함, 하루 시작에는 `00:00` 사용), `end`(HH:MM 제외, 하루 끝에는 `24:00` 허용), 선택적 `timezone`을 포함하는 객체입니다.

- 생략되었거나 `"user"`: 설정된 경우 `agents.defaults.userTimezone`을 사용하고, 그렇지 않으면 호스트 시스템 시간대로 대체합니다.
- `"local"`: 항상 호스트 시스템 시간대를 사용합니다.
- 모든 IANA 식별자(예: `America/New_York`): 직접 사용됩니다. 유효하지 않으면 위의 `"user"` 동작으로 대체됩니다.
- 활성 창에서는 `start`와 `end`가 같으면 안 됩니다. 같은 값은 폭이 0인 것으로 처리됩니다(항상 창 밖).
- 활성 창 밖에서는 창 안의 다음 틱까지 Heartbeat를 건너뜁니다.

</ParamField>

## 전달 동작

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeat는 기본적으로 에이전트의 기본 세션(`agent:<id>:<mainKey>`)에서 실행되며, `session.scope = "global"`이면 `global`에서 실행됩니다. 특정 채널 세션(Discord/WhatsApp 등)으로 재정의하려면 `session`을 설정하세요.
    - `session`은 실행 컨텍스트에만 영향을 줍니다. 전달은 `target`과 `to`가 제어합니다.
    - 특정 채널/수신자에게 전달하려면 `target` + `to`를 설정하세요. `target: "last"`에서는 해당 세션의 마지막 외부 채널을 사용해 전달합니다.
    - Heartbeat 전달은 기본적으로 직접/DM 대상을 허용합니다. Heartbeat 턴은 계속 실행하면서 직접 대상 전송만 숨기려면 `directPolicy: "block"`을 설정하세요.
    - 기본 큐, 대상 세션 레인, Cron 레인 또는 활성 Cron 작업이 바쁘면 Heartbeat를 건너뛰고 나중에 다시 시도합니다.
    - `skipWhenBusy: true`이면 서브에이전트와 중첩 레인도 Heartbeat 실행을 연기합니다.
    - `target`이 외부 대상으로 해석되지 않으면 실행은 계속되지만 아웃바운드 메시지는 전송되지 않습니다.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - `showOk`, `showAlerts`, `useIndicator`가 모두 비활성화되어 있으면 실행이 처음부터 `reason=alerts-disabled`로 건너뛰어집니다.
    - 알림 전달만 비활성화된 경우에도 OpenClaw는 Heartbeat를 실행하고, 기한이 된 작업 타임스탬프를 업데이트하고, 세션 유휴 타임스탬프를 복원하며, 외부 알림 페이로드를 숨길 수 있습니다.
    - 해석된 Heartbeat 대상이 입력 표시를 지원하면 OpenClaw는 Heartbeat 실행이 활성 상태인 동안 입력 중 표시를 보여줍니다. 이는 Heartbeat가 채팅 출력을 보낼 동일한 대상을 사용하며, `typingMode: "never"`로 비활성화됩니다.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Heartbeat 전용 답장은 세션을 계속 유지하지 **않습니다**. Heartbeat 메타데이터가 세션 행을 업데이트할 수는 있지만, 유휴 만료는 마지막 실제 사용자/채널 메시지의 `lastInteractionAt`을 사용하고, 일일 만료는 `sessionStartedAt`을 사용합니다.
    - Control UI와 WebChat 기록은 Heartbeat 프롬프트와 OK 전용 확인을 숨깁니다. 기본 세션 트랜스크립트에는 감사/재생을 위해 해당 턴이 계속 포함될 수 있습니다.
    - 분리된 [백그라운드 작업](/ko/automation/tasks)은 시스템 이벤트를 큐에 넣고 기본 세션이 무언가를 빠르게 알아차려야 할 때 Heartbeat를 깨울 수 있습니다. 이 깨우기는 Heartbeat 실행을 백그라운드 작업으로 만들지 않습니다.

  </Accordion>
</AccordionGroup>

## 표시 제어

기본적으로 알림 콘텐츠는 전달되는 동안 `HEARTBEAT_OK` 확인은 숨겨집니다. 채널별 또는 계정별로 이를 조정할 수 있습니다.

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

우선순위: 계정별 → 채널별 → 채널 기본값 → 내장 기본값.

### 각 플래그의 역할

- `showOk`: 모델이 OK 전용 답장을 반환할 때 `HEARTBEAT_OK` 확인을 보냅니다.
- `showAlerts`: 모델이 OK가 아닌 답장을 반환할 때 알림 콘텐츠를 보냅니다.
- `useIndicator`: UI 상태 표면을 위한 표시기 이벤트를 내보냅니다.

세 가지가 **모두** false이면 OpenClaw는 Heartbeat 실행 전체를 건너뜁니다(모델 호출 없음).

### 채널별 및 계정별 예시

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### 일반적인 패턴

| 목표                                     | 구성                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 기본 동작(OK는 조용히, 알림은 켬) | _(구성이 필요 없음)_                                                                     |
| 완전 무음(메시지 없음, 표시기 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 표시기만(메시지 없음)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 한 채널에서만 OK 표시                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md(선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트는 에이전트에게 해당 파일을 읽으라고 지시합니다. 이를 "Heartbeat 체크리스트"라고 생각하세요. 작고, 안정적이며, 30분마다 포함해도 안전한 내용입니다.

일반 실행에서는 기본 에이전트에 Heartbeat 가이드가 활성화된 경우에만 `HEARTBEAT.md`가 주입됩니다. `0m`으로 Heartbeat 주기를 비활성화하거나 `includeSystemPromptSection: false`를 설정하면 일반 부트스트랩 컨텍스트에서 제외됩니다.

`HEARTBEAT.md`가 존재하지만 사실상 비어 있으면(빈 줄과 `# Heading` 같은 마크다운 헤더만 있음) OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다. 이 건너뛰기는 `reason=empty-heartbeat-file`로 보고됩니다. 파일이 없으면 Heartbeat는 계속 실행되고 모델이 수행할 작업을 결정합니다.

프롬프트 팽창을 피하려면 매우 작게 유지하세요(짧은 체크리스트 또는 알림).

`HEARTBEAT.md` 예시:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 블록

`HEARTBEAT.md`는 Heartbeat 자체 안에서 간격 기반 확인을 위한 작은 구조화된 `tasks:` 블록도 지원합니다.

예시:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Behavior">
    - OpenClaw는 `tasks:` 블록을 구문 분석하고 각 작업을 자체 `interval`과 비교해 확인합니다.
    - 해당 틱에서 기한이 **된** 작업만 Heartbeat 프롬프트에 포함됩니다.
    - 기한이 된 작업이 없으면 낭비되는 모델 호출을 피하기 위해 Heartbeat를 전체적으로 건너뜁니다(`reason=no-tasks-due`).
    - `HEARTBEAT.md`의 비작업 콘텐츠는 보존되며 기한이 된 작업 목록 뒤에 추가 컨텍스트로 덧붙여집니다.
    - 작업의 마지막 실행 타임스탬프는 세션 상태(`heartbeatTaskState`)에 저장되므로, 간격은 일반 재시작 후에도 유지됩니다.
    - 작업 타임스탬프는 Heartbeat 실행이 정상 답장 경로를 완료한 뒤에만 진행됩니다. 건너뛴 `empty-heartbeat-file` / `no-tasks-due` 실행은 작업을 완료로 표시하지 않습니다.

  </Accordion>
</AccordionGroup>

작업 모드는 한 Heartbeat 파일에 여러 주기적 확인을 담되 매 틱마다 모든 확인 비용을 지불하고 싶지 않을 때 유용합니다.

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있나요?

예. 그렇게 요청하면 됩니다.

`HEARTBEAT.md`는 에이전트 워크스페이스의 일반 파일일 뿐이므로, 일반 채팅에서 에이전트에게 다음과 같이 말할 수 있습니다.

- "`HEARTBEAT.md`를 업데이트해서 일일 캘린더 확인을 추가해."
- "`HEARTBEAT.md`를 더 짧고 받은 편지함 후속 조치에 집중하도록 다시 작성해."

이 작업이 능동적으로 이루어지길 원한다면 Heartbeat 프롬프트에 다음과 같은 명시적 줄을 포함할 수도 있습니다. "체크리스트가 오래되면 더 나은 것으로 HEARTBEAT.md를 업데이트하세요."

<Warning>
비밀(API 키, 전화번호, 개인 토큰)을 `HEARTBEAT.md`에 넣지 마세요. 프롬프트 컨텍스트의 일부가 됩니다.
</Warning>

## 수동 깨우기(온디맨드)

다음 명령으로 시스템 이벤트를 큐에 넣고 즉시 Heartbeat를 트리거할 수 있습니다.

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

여러 에이전트에 `heartbeat`가 구성되어 있으면 수동 깨우기는 해당 에이전트 Heartbeat를 각각 즉시 실행합니다.

다음 예약된 틱까지 기다리려면 `--mode next-heartbeat`를 사용하세요.

## 추론 전달(선택 사항)

기본적으로 Heartbeat는 최종 "답변" 페이로드만 전달합니다.

투명성을 원하면 다음을 활성화하세요.

- `agents.defaults.heartbeat.includeReasoning: true`

활성화되면 Heartbeat는 `Reasoning:` 접두사가 붙은 별도 메시지도 전달합니다(`/reasoning on`과 같은 형태). 에이전트가 여러 세션/코덱스를 관리하고 있고 왜 사용자에게 핑을 보내기로 했는지 보고 싶을 때 유용할 수 있지만, 원하는 것보다 더 많은 내부 세부 정보를 유출할 수도 있습니다. 그룹 채팅에서는 꺼둔 상태를 권장합니다.

## 비용 인식

Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 소비합니다. 비용을 줄이려면:

- 전체 대화 기록 전송을 피하려면 `isolatedSession: true`를 사용하세요(실행당 약 100K 토큰에서 약 2-5K로 감소).
- 부트스트랩 파일을 `HEARTBEAT.md`로만 제한하려면 `lightContext: true`를 사용하세요.
- 더 저렴한 `model`을 설정하세요(예: `ollama/llama3.2:1b`).
- `HEARTBEAT.md`를 작게 유지하세요.
- 내부 상태 업데이트만 원하면 `target: "none"`을 사용하세요.

## Heartbeat 이후 컨텍스트 오버플로

Heartbeat가 더 작은 로컬 모델(예: 32k 창의 Ollama 모델)을 사용하고 다음 기본 세션 턴에서 컨텍스트 오버플로가 보고되면, 이전 Heartbeat가 세션을 Heartbeat 모델에 남겨두었는지 확인하세요. OpenClaw의 재설정 메시지는 마지막 런타임 모델이 구성된 `heartbeat.model`과 일치할 때 이를 명시합니다.

새 세션에서 Heartbeat를 실행하려면 `isolatedSession: true`를 사용하고, 가장 작은 프롬프트를 위해 `lightContext: true`와 결합하거나, 공유 세션에 충분히 큰 컨텍스트 창이 있는 Heartbeat 모델을 선택하세요.

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — 분리된 작업이 추적되는 방식
- [시간대](/ko/concepts/timezone) — 시간대가 Heartbeat 일정에 미치는 영향
- [문제 해결](/ko/automation/cron-jobs#troubleshooting) — 자동화 문제 디버깅
