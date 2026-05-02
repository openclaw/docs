---
read_when:
    - Heartbeat 주기 또는 메시징 조정
    - 예약된 작업에 Heartbeat와 Cron 중 선택하기
sidebarTitle: Heartbeat
summary: Heartbeat 폴링 메시지 및 알림 규칙
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat와 cron의 차이?** 각각을 언제 사용해야 하는지는 [자동화 및 작업](/ko/automation)을 참고하세요.
</Note>

Heartbeat는 기본 세션에서 **주기적인 에이전트 턴**을 실행하여, 모델이 주의가 필요한 내용을 사용자에게 과도하게 알리지 않으면서 표시할 수 있게 합니다.

Heartbeat는 예약된 기본 세션 턴입니다. [백그라운드 작업](/ko/automation/tasks) 레코드를 생성하지 **않습니다**. 작업 레코드는 분리된 작업(ACP 실행, 하위 에이전트, 격리된 cron 작업)을 위한 것입니다.

문제 해결: [예약된 작업](/ko/automation/cron-jobs#troubleshooting)

## 빠른 시작(초보자)

<Steps>
  <Step title="주기 선택">
    Heartbeat를 활성화된 상태로 두거나(기본값은 `30m`, Anthropic OAuth/토큰 인증에서는 Claude CLI 재사용을 포함해 `1h`) 원하는 주기를 설정하세요.
  </Step>
  <Step title="HEARTBEAT.md 추가(선택 사항)">
    에이전트 작업 공간에 작은 `HEARTBEAT.md` 체크리스트나 `tasks:` 블록을 만드세요.
  </Step>
  <Step title="Heartbeat 메시지를 보낼 위치 결정">
    `target: "none"`이 기본값입니다. 마지막 연락처로 라우팅하려면 `target: "last"`로 설정하세요.
  </Step>
  <Step title="선택적 조정">
    - 투명성을 위해 Heartbeat 추론 전달을 활성화합니다.
    - Heartbeat 실행에 `HEARTBEAT.md`만 필요하다면 경량 부트스트랩 컨텍스트를 사용합니다.
    - 각 Heartbeat마다 전체 대화 기록을 보내지 않도록 격리된 세션을 활성화합니다.
    - Heartbeat를 활성 시간(현지 시간)으로 제한합니다.

  </Step>
</Steps>

예시 설정:

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

- 간격: `30m`(Anthropic OAuth/토큰 인증이 감지된 인증 모드인 경우, Claude CLI 재사용을 포함해 `1h`). `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`를 설정하세요. 비활성화하려면 `0m`을 사용하세요.
- 프롬프트 본문(`agents.defaults.heartbeat.prompt`로 설정 가능): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 프롬프트는 사용자 메시지로 **그대로** 전송됩니다. 시스템 프롬프트에는 기본 에이전트에 Heartbeat가 활성화된 경우에만 "Heartbeat" 섹션이 포함되며, 실행은 내부적으로 표시됩니다.
- Heartbeat가 `0m`으로 비활성화되면, 일반 실행에서도 부트스트랩 컨텍스트에서 `HEARTBEAT.md`를 생략하므로 모델이 Heartbeat 전용 지침을 보지 않습니다.
- 활성 시간(`heartbeat.activeHours`)은 설정된 시간대에서 확인됩니다. 시간 범위를 벗어나면 Heartbeat는 범위 안의 다음 틱까지 건너뜁니다.
- Heartbeat는 cron 작업이 활성 상태이거나 대기 중일 때 자동으로 지연됩니다. 추가로 바쁜 레인(하위 에이전트 또는 중첩 명령 작업)에서도 지연하려면 `heartbeat.skipWhenBusy: true`를 설정하세요. 이는 로컬 Ollama 및 기타 제한된 단일 런타임 호스트에 유용합니다.

## Heartbeat 프롬프트의 용도

기본 프롬프트는 의도적으로 폭넓게 작성되어 있습니다.

- **백그라운드 작업**: "Consider outstanding tasks"는 에이전트가 후속 조치(받은편지함, 캘린더, 알림, 대기 중인 작업)를 검토하고 긴급한 내용을 표시하도록 유도합니다.
- **사람 확인**: "Checkup sometimes on your human during day time"는 가끔 가벼운 "필요한 것이 있나요?" 메시지를 보내도록 유도하지만, 설정된 현지 시간대를 사용해 야간 스팸을 피합니다([시간대](/ko/concepts/timezone) 참고).

Heartbeat는 완료된 [백그라운드 작업](/ko/automation/tasks)에 반응할 수 있지만, Heartbeat 실행 자체는 작업 레코드를 생성하지 않습니다.

Heartbeat가 매우 구체적인 작업을 수행하게 하려면(예: "Gmail PubSub 통계 확인" 또는 "Gateway 상태 확인") `agents.defaults.heartbeat.prompt`(또는 `agents.list[].heartbeat.prompt`)를 사용자 지정 본문으로 설정하세요. 이 본문은 그대로 전송됩니다.

## 응답 계약

- 주의가 필요한 내용이 없으면 **`HEARTBEAT_OK`**로 응답하세요.
- 도구 사용이 가능한 Heartbeat 실행은 보이는 업데이트가 없도록 `notify: false`와 함께 `heartbeat_respond`를 호출하거나, 알림을 위해 `notify: true`와 `notificationText`를 함께 사용할 수 있습니다. 구조화된 도구 응답이 있으면 텍스트 폴백보다 우선합니다.
- Heartbeat 실행 중 OpenClaw는 답장의 **시작 또는 끝**에 `HEARTBEAT_OK`가 나타나면 이를 확인 응답으로 처리합니다. 해당 토큰은 제거되며, 남은 콘텐츠가 **≤ `ackMaxChars`**(기본값: 300)이면 답장은 삭제됩니다.
- `HEARTBEAT_OK`가 답장의 **중간**에 나타나면 특별하게 처리되지 않습니다.
- 알림의 경우 `HEARTBEAT_OK`를 포함하지 **마세요**. 알림 텍스트만 반환하세요.

Heartbeat 외부에서는 메시지 시작/끝에 있는 불필요한 `HEARTBEAT_OK`가 제거되고 기록됩니다. `HEARTBEAT_OK`만 있는 메시지는 삭제됩니다.

## 설정

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

### 범위 및 우선순위

- `agents.defaults.heartbeat`는 전역 Heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`는 그 위에 병합됩니다. 어떤 에이전트든 `heartbeat` 블록이 있으면 **해당 에이전트들만** Heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 표시 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 재정의합니다.
- `channels.<channel>.accounts.<id>.heartbeat`(다중 계정 채널)는 채널별 설정을 재정의합니다.

### 에이전트별 Heartbeat

`agents.list[]` 항목 중 하나라도 `heartbeat` 블록을 포함하면 **해당 에이전트들만** Heartbeat를 실행합니다. 에이전트별 블록은 `agents.defaults.heartbeat` 위에 병합됩니다. 따라서 공유 기본값을 한 번 설정하고 에이전트별로 재정의할 수 있습니다.

예시: 에이전트 두 개 중 두 번째 에이전트만 Heartbeat를 실행합니다.

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

이 시간 범위 밖(미국 동부 시간 오전 9시 전 또는 오후 10시 후)에서는 Heartbeat가 건너뛰어집니다. 시간 범위 안의 다음 예약 틱은 정상적으로 실행됩니다.

### 24/7 설정

Heartbeat를 하루 종일 실행하려면 다음 패턴 중 하나를 사용하세요.

- `activeHours`를 완전히 생략합니다(시간 창 제한 없음, 이것이 기본 동작입니다).
- 하루 전체 창을 설정합니다: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
동일한 `start` 및 `end` 시간을 설정하지 마세요(예: `08:00`부터 `08:00`까지). 이는 너비가 0인 창으로 처리되므로 Heartbeat가 항상 건너뛰어집니다.
</Warning>

### 다중 계정 예시

Telegram 같은 다중 계정 채널에서 특정 계정을 대상으로 지정하려면 `accountId`를 사용하세요.

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
  true이면 Heartbeat 실행이 경량 부트스트랩 컨텍스트를 사용하고 작업 공간 부트스트랩 파일 중 `HEARTBEAT.md`만 유지합니다.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true이면 각 Heartbeat가 이전 대화 기록이 없는 새 세션에서 실행됩니다. cron `sessionTarget: "isolated"`와 동일한 격리 패턴을 사용합니다. Heartbeat당 토큰 비용을 크게 줄입니다. 최대 절감을 위해 `lightContext: true`와 함께 사용하세요. 전달 라우팅은 여전히 기본 세션 컨텍스트를 사용합니다.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true이면 Heartbeat 실행이 추가로 바쁜 레인, 즉 하위 에이전트 또는 중첩 명령 작업에서 지연됩니다. 이 플래그가 없어도 cron 레인은 항상 Heartbeat를 지연하므로, 로컬 모델 호스트는 cron과 Heartbeat 프롬프트를 동시에 실행하지 않습니다.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 실행을 위한 선택적 세션 키입니다.

- `main`(기본값): 에이전트 기본 세션.
- 명시적 세션 키(`openclaw sessions --json` 또는 [세션 CLI](/ko/cli/sessions)에서 복사).
- 세션 키 형식: [세션](/ko/concepts/session) 및 [그룹](/ko/channels/groups)을 참고하세요.

</ParamField>
<ParamField path="target" type="string">
- `last`: 마지막으로 사용한 외부 채널로 전달합니다.
- 명시적 채널: 설정된 채널 또는 plugin id. 예: `discord`, `matrix`, `telegram`, `whatsapp`.
- `none`(기본값): Heartbeat를 실행하지만 외부로 **전달하지 않습니다**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  직접/DM 전달 동작을 제어합니다. `allow`: 직접/DM Heartbeat 전달을 허용합니다. `block`: 직접/DM 전달을 억제합니다(`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  선택적 수신자 재정의(채널별 id, 예: WhatsApp의 E.164 또는 Telegram 채팅 id). Telegram 주제/스레드의 경우 `<chatId>:topic:<messageThreadId>`를 사용하세요.

</ParamField>
<ParamField path="accountId" type="string">
  다중 계정 채널을 위한 선택적 계정 id입니다. `target: "last"`인 경우, 계정을 지원하면 해당 계정 id가 확인된 마지막 채널에 적용되며, 그렇지 않으면 무시됩니다. 계정 id가 확인된 채널에 설정된 계정과 일치하지 않으면 전달이 건너뛰어집니다.

</ParamField>
<ParamField path="prompt" type="string">
  기본 프롬프트 본문을 재정의합니다(병합되지 않음).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  전달 전에 `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수입니다.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 억제합니다.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 실행을 시간 창으로 제한합니다. `start`(HH:MM, 포함, 하루 시작에는 `00:00` 사용), `end`(HH:MM 제외, 하루 끝에는 `24:00` 허용), 선택적 `timezone`을 포함하는 객체입니다.

- 생략하거나 `"user"`: 설정된 경우 `agents.defaults.userTimezone`을 사용하고, 그렇지 않으면 호스트 시스템 시간대로 대체합니다.
- `"local"`: 항상 호스트 시스템 시간대를 사용합니다.
- 모든 IANA 식별자(예: `America/New_York`): 직접 사용합니다. 유효하지 않으면 위의 `"user"` 동작으로 대체합니다.
- 활성 창에서는 `start`와 `end`가 같으면 안 됩니다. 같은 값은 폭이 0인 창(항상 창 밖)으로 처리됩니다.
- 활성 창 밖에서는 창 안의 다음 틱까지 Heartbeat를 건너뜁니다.

</ParamField>

## 전달 동작

<AccordionGroup>
  <Accordion title="세션 및 대상 라우팅">
    - Heartbeat는 기본적으로 에이전트의 기본 세션(`agent:<id>:<mainKey>`)에서 실행되며, `session.scope = "global"`이면 `global`에서 실행됩니다. 특정 채널 세션(Discord/WhatsApp 등)으로 재정의하려면 `session`을 설정하세요.
    - `session`은 실행 컨텍스트에만 영향을 줍니다. 전달은 `target`과 `to`로 제어됩니다.
    - 특정 채널/수신자에게 전달하려면 `target` + `to`를 설정하세요. `target: "last"`를 사용하면 해당 세션의 마지막 외부 채널로 전달됩니다.
    - Heartbeat 전달은 기본적으로 직접/DM 대상을 허용합니다. Heartbeat 턴은 계속 실행하면서 직접 대상 전송만 억제하려면 `directPolicy: "block"`을 설정하세요.
    - 기본 큐, 대상 세션 레인, cron 레인 또는 활성 cron 작업이 바쁘면 Heartbeat를 건너뛰고 나중에 다시 시도합니다.
    - `skipWhenBusy: true`이면 서브에이전트와 중첩 레인도 Heartbeat 실행을 지연합니다.
    - `target`이 외부 대상으로 해석되지 않으면 실행은 계속되지만 아웃바운드 메시지는 전송되지 않습니다.

  </Accordion>
  <Accordion title="표시 여부 및 건너뛰기 동작">
    - `showOk`, `showAlerts`, `useIndicator`가 모두 비활성화되어 있으면 실행은 처음부터 `reason=alerts-disabled`로 건너뜁니다.
    - 알림 전달만 비활성화된 경우에도 OpenClaw는 Heartbeat를 실행하고, 기한이 된 작업의 타임스탬프를 업데이트하고, 세션 유휴 타임스탬프를 복원하며, 외부 알림 페이로드를 억제할 수 있습니다.
    - 해석된 Heartbeat 대상이 입력 중 표시를 지원하면 OpenClaw는 Heartbeat 실행이 활성 상태인 동안 입력 중 상태를 표시합니다. 이는 Heartbeat가 채팅 출력을 보낼 동일한 대상을 사용하며, `typingMode: "never"`로 비활성화됩니다.

  </Accordion>
  <Accordion title="세션 수명 주기 및 감사">
    - Heartbeat 전용 응답은 세션을 유지하지 **않습니다**. Heartbeat 메타데이터가 세션 행을 업데이트할 수는 있지만, 유휴 만료는 마지막 실제 사용자/채널 메시지의 `lastInteractionAt`을 사용하고, 일일 만료는 `sessionStartedAt`을 사용합니다.
    - Control UI와 WebChat 기록은 Heartbeat 프롬프트와 OK 전용 확인 응답을 숨깁니다. 기본 세션 트랜스크립트에는 감사/재생을 위해 해당 턴이 여전히 포함될 수 있습니다.
    - 분리된 [Background Tasks](/ko/automation/tasks)는 기본 세션이 무언가를 빠르게 알아야 할 때 시스템 이벤트를 큐에 넣고 Heartbeat를 깨울 수 있습니다. 그 깨우기는 Heartbeat 실행을 Background Tasks로 만들지 않습니다.

  </Accordion>
</AccordionGroup>

## 표시 여부 제어

기본적으로 알림 콘텐츠는 전달되는 동안 `HEARTBEAT_OK` 확인 응답은 억제됩니다. 채널별 또는 계정별로 이를 조정할 수 있습니다.

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

### 각 플래그의 동작

- `showOk`: 모델이 OK 전용 응답을 반환할 때 `HEARTBEAT_OK` 확인 응답을 전송합니다.
- `showAlerts`: 모델이 OK가 아닌 응답을 반환할 때 알림 콘텐츠를 전송합니다.
- `useIndicator`: UI 상태 표면에 indicator 이벤트를 내보냅니다.

**세 가지 모두** false이면 OpenClaw는 Heartbeat 실행을 완전히 건너뜁니다(모델 호출 없음).

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

| 목표                                     | 설정                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 기본 동작(무음 OK, 알림 켜짐) | _(설정 필요 없음)_                                                                     |
| 완전 무음(메시지 없음, indicator 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| indicator만 사용(메시지 없음)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 한 채널에서만 OK 표시                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md(선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트는 에이전트에게 이를 읽으라고 지시합니다. 이를 "Heartbeat 체크리스트"라고 생각하세요. 작고, 안정적이며, 30분마다 포함해도 안전해야 합니다.

일반 실행에서는 기본 에이전트에 대해 Heartbeat 지침이 활성화된 경우에만 `HEARTBEAT.md`가 주입됩니다. Heartbeat 주기를 `0m`으로 비활성화하거나 `includeSystemPromptSection: false`를 설정하면 일반 부트스트랩 컨텍스트에서 제외됩니다.

`HEARTBEAT.md`가 존재하지만 사실상 비어 있으면(빈 줄과 `# Heading` 같은 마크다운 헤더만 있는 경우) OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다. 해당 건너뛰기는 `reason=empty-heartbeat-file`로 보고됩니다. 파일이 없으면 Heartbeat는 계속 실행되고 모델이 수행할 작업을 결정합니다.

프롬프트 비대화를 피하려면 아주 작게 유지하세요(짧은 체크리스트나 알림).

`HEARTBEAT.md` 예시:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 블록

`HEARTBEAT.md`는 Heartbeat 자체 안에서 간격 기반 점검을 위한 작은 구조화된 `tasks:` 블록도 지원합니다.

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
  <Accordion title="동작">
    - OpenClaw는 `tasks:` 블록을 파싱하고 각 작업을 자체 `interval`과 대조해 확인합니다.
    - 해당 틱에서 **기한이 된** 작업만 Heartbeat 프롬프트에 포함됩니다.
    - 기한이 된 작업이 없으면 낭비되는 모델 호출을 피하기 위해 Heartbeat를 완전히 건너뜁니다(`reason=no-tasks-due`).
    - `HEARTBEAT.md`의 작업이 아닌 콘텐츠는 보존되며, 기한이 된 작업 목록 뒤에 추가 컨텍스트로 첨부됩니다.
    - 작업의 마지막 실행 타임스탬프는 세션 상태(`heartbeatTaskState`)에 저장되므로 일반 재시작 후에도 간격이 유지됩니다.
    - 작업 타임스탬프는 Heartbeat 실행이 정상 응답 경로를 완료한 뒤에만 갱신됩니다. 건너뛴 `empty-heartbeat-file` / `no-tasks-due` 실행은 작업을 완료로 표시하지 않습니다.

  </Accordion>
</AccordionGroup>

작업 모드는 하나의 Heartbeat 파일에 여러 주기적 점검을 담되 매 틱마다 전부 비용을 지불하고 싶지 않을 때 유용합니다.

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있나요?

네. 요청하면 가능합니다.

`HEARTBEAT.md`는 에이전트 워크스페이스의 일반 파일일 뿐이므로, 일반 채팅에서 에이전트에게 다음과 같이 말할 수 있습니다.

- "`HEARTBEAT.md`를 업데이트해 일일 캘린더 점검을 추가해."
- "`HEARTBEAT.md`를 더 짧게 다시 작성하고 받은 편지함 후속 조치에 집중하게 해."

이를 선제적으로 수행하게 하려면 Heartbeat 프롬프트에 다음과 같은 명시적 줄을 포함할 수도 있습니다. "체크리스트가 오래되면 더 나은 내용으로 HEARTBEAT.md를 업데이트하세요."

<Warning>
`HEARTBEAT.md`에 비밀(API 키, 전화번호, 개인 토큰)을 넣지 마세요. 프롬프트 컨텍스트의 일부가 됩니다.
</Warning>

## 수동 깨우기(온디맨드)

다음으로 시스템 이벤트를 큐에 넣고 즉시 Heartbeat를 트리거할 수 있습니다.

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

여러 에이전트에 `heartbeat`가 구성되어 있으면 수동 깨우기는 해당 각 에이전트의 Heartbeat를 즉시 실행합니다.

다음 예약 틱을 기다리려면 `--mode next-heartbeat`를 사용하세요.

## 추론 전달(선택 사항)

기본적으로 Heartbeat는 최종 "답변" 페이로드만 전달합니다.

투명성을 원하면 다음을 활성화하세요.

- `agents.defaults.heartbeat.includeReasoning: true`

활성화되면 Heartbeat는 `Reasoning:` 접두사가 붙은 별도 메시지도 전달합니다(`/reasoning on`과 같은 형태). 에이전트가 여러 세션/코덱스를 관리하고 있으며 왜 당신에게 알림을 보내기로 했는지 보고 싶을 때 유용할 수 있지만, 원하는 것보다 더 많은 내부 세부 정보를 노출할 수도 있습니다. 그룹 채팅에서는 꺼 두는 것을 권장합니다.

## 비용 인식

Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 소모합니다. 비용을 줄이려면:

- 전체 대화 기록 전송을 피하려면 `isolatedSession: true`를 사용하세요(실행당 약 100K 토큰에서 약 2~5K 토큰으로 감소).
- 부트스트랩 파일을 `HEARTBEAT.md`만으로 제한하려면 `lightContext: true`를 사용하세요.
- 더 저렴한 `model`을 설정하세요(예: `ollama/llama3.2:1b`).
- `HEARTBEAT.md`를 작게 유지하세요.
- 내부 상태 업데이트만 원한다면 `target: "none"`을 사용하세요.

## Heartbeat 이후 컨텍스트 오버플로

이전 Heartbeat가 기존 세션을 더 작은 로컬 모델, 예를 들어 32k 창을 가진 Ollama 모델에 남겨 두었고 다음 기본 세션 턴에서 컨텍스트 오버플로가 보고되면, 세션 런타임 모델을 구성된 기본 모델로 다시 재설정하세요. OpenClaw의 재설정 메시지는 마지막 런타임 모델이 구성된 `heartbeat.model`과 일치할 때 이를 명시합니다.

현재 Heartbeat는 실행 완료 후 공유 세션의 기존 런타임 모델을 보존합니다. Heartbeat를 새 세션에서 실행하려면 여전히 `isolatedSession: true`를 사용할 수 있고, 가장 작은 프롬프트를 위해 `lightContext: true`와 결합하거나, 공유 세션에 충분히 큰 컨텍스트 창을 가진 Heartbeat 모델을 선택할 수 있습니다.

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Background Tasks](/ko/automation/tasks) — 분리된 작업이 추적되는 방식
- [시간대](/ko/concepts/timezone) — 시간대가 Heartbeat 예약에 미치는 영향
- [문제 해결](/ko/automation/cron-jobs#troubleshooting) — 자동화 문제 디버깅
