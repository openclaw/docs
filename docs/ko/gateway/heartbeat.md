---
read_when:
    - Heartbeat 주기 또는 메시지 조정하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Heartbeat
summary: Heartbeat 폴링 메시지 및 알림 규칙
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat와 Cron 중 무엇을 써야 하나요?** 각각 언제 써야 하는지는 [자동화 및 작업](/ko/automation)을 참조하세요.
</Note>

Heartbeat는 **주기적인 에이전트 턴**을 main 세션에서 실행하므로, 모델이 주의가 필요한 내용을 과도한 알림 없이 표시할 수 있습니다.

Heartbeat는 예약된 main-session 턴이며, [백그라운드 작업](/ko/automation/tasks) 레코드를 만들지 **않습니다**. 작업 레코드는 분리된 작업(ACP 실행, 하위 에이전트, 격리된 Cron 작업)용입니다.

문제 해결: [예약된 작업](/ko/automation/cron-jobs#troubleshooting)

## 빠른 시작(초보자)

<Steps>
  <Step title="주기 선택">
    Heartbeat를 활성화된 상태로 두세요(기본값은 `30m`, Anthropic OAuth/token 인증(Claude CLI 재사용 포함)의 경우 `1h`) 또는 원하는 주기를 설정하세요.
  </Step>
  <Step title="HEARTBEAT.md 추가(선택 사항)">
    에이전트 워크스페이스에 작은 `HEARTBEAT.md` 체크리스트 또는 `tasks:` 블록을 만드세요.
  </Step>
  <Step title="Heartbeat 메시지를 어디로 보낼지 결정">
    기본값은 `target: "none"`입니다. 마지막 연락처로 라우팅하려면 `target: "last"`로 설정하세요.
  </Step>
  <Step title="선택적 튜닝">
    - 투명성을 위해 Heartbeat 추론 전달을 활성화하세요.
    - Heartbeat 실행에 `HEARTBEAT.md`만 필요하다면 경량 bootstrap 컨텍스트를 사용하세요.
    - Heartbeat마다 전체 대화 기록을 보내지 않도록 격리된 세션을 활성화하세요.
    - Heartbeat를 활동 시간(로컬 시간)으로 제한하세요.
  </Step>
</Steps>

예시 config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
        directPolicy: "allow", // 기본값: direct/DM 대상 허용; 억제하려면 "block"으로 설정
        lightContext: true, // 선택 사항: bootstrap 파일에서 HEARTBEAT.md만 주입
        isolatedSession: true, // 선택 사항: 실행마다 새 세션(대화 기록 없음)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택 사항: 별도의 `Reasoning:` 메시지도 전송
      },
    },
  },
}
```

## 기본값

- 간격: `30m`(Anthropic OAuth/token 인증이 감지된 인증 모드이고 Claude CLI 재사용을 포함하는 경우 `1h`). `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`를 설정하세요. 비활성화하려면 `0m`을 사용합니다.
- 프롬프트 본문(`agents.defaults.heartbeat.prompt`로 구성 가능): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 프롬프트는 사용자 메시지로 **있는 그대로** 전송됩니다. 시스템 프롬프트에는 기본 에이전트에 Heartbeat가 활성화되어 있고 실행이 내부적으로 플래그된 경우에만 "Heartbeat" 섹션이 포함됩니다.
- `0m`으로 Heartbeat를 비활성화하면 일반 실행에서도 bootstrap 컨텍스트에서 `HEARTBEAT.md`를 생략하므로, 모델이 Heartbeat 전용 지침을 보지 않게 됩니다.
- 활동 시간(`heartbeat.activeHours`)은 구성된 시간대에서 확인됩니다. 시간 창 밖에서는 Heartbeat가 건너뛰어지고, 다음 시간 창 내 tick에서 다시 실행됩니다.

## Heartbeat 프롬프트의 목적

기본 프롬프트는 의도적으로 넓게 설정되어 있습니다:

- **백그라운드 작업**: "Consider outstanding tasks"는 에이전트가 후속 작업(받은편지함, 일정, reminder, 대기 중인 작업)을 검토하고 긴급한 항목을 표시하도록 유도합니다.
- **사람 확인**: "Checkup sometimes on your human during day time"은 가끔 가벼운 "필요한 것 있나요?" 메시지를 보내도록 유도하지만, 구성된 로컬 시간대를 사용해 야간 스팸은 피합니다([Timezone](/ko/concepts/timezone) 참조).

Heartbeat는 완료된 [백그라운드 작업](/ko/automation/tasks)에 반응할 수 있지만, Heartbeat 실행 자체는 작업 레코드를 만들지 않습니다.

Heartbeat가 매우 구체적인 작업(예: "Gmail PubSub 통계 확인" 또는 "Gateway health 확인")을 하게 하려면 `agents.defaults.heartbeat.prompt`(또는 `agents.list[].heartbeat.prompt`)를 사용자 지정 본문으로 설정하세요(있는 그대로 전송됨).

## 응답 계약

- 주의할 내용이 없으면 **`HEARTBEAT_OK`**로 응답합니다.
- Heartbeat 실행 중 OpenClaw는 응답의 **시작 또는 끝**에 `HEARTBEAT_OK`가 나타나면 이를 ack로 처리합니다. 이 토큰은 제거되며, 남은 내용이 **≤ `ackMaxChars`**(기본값: 300)인 경우 응답은 폐기됩니다.
- `HEARTBEAT_OK`가 응답의 **중간**에 나타나면 특별 취급하지 않습니다.
- 알림의 경우 **`HEARTBEAT_OK`를 포함하지 말고**, 알림 텍스트만 반환하세요.

Heartbeat 외부에서는 메시지의 시작/끝에 잘못 들어간 `HEARTBEAT_OK`는 제거되고 로그에 기록됩니다. 메시지가 `HEARTBEAT_OK`만 포함하면 폐기됩니다.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본값: 30m (0m이면 비활성화)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 기본값: false (사용 가능할 때 별도의 Reasoning: 메시지 전달)
        lightContext: false, // 기본값: false; true이면 워크스페이스 bootstrap 파일에서 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true이면 각 Heartbeat를 새 세션에서 실행(대화 기록 없음)
        target: "last", // 기본값: none | 옵션: last | none | <channel id> (core 또는 Plugin, 예: "bluebubbles")
        to: "+15551234567", // 선택적 채널별 재정의
        accountId: "ops-bot", // 선택적 다중 계정 채널 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 뒤에 허용되는 최대 문자 수
      },
    },
  },
}
```

### 범위와 우선순위

- `agents.defaults.heartbeat`는 전역 Heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`는 그 위에 병합됩니다. 어떤 에이전트라도 `heartbeat` 블록을 가지면 **해당 에이전트들만** Heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 표시 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 재정의합니다.
- `channels.<channel>.accounts.<id>.heartbeat`(다중 계정 채널)는 채널별 설정을 재정의합니다.

### 에이전트별 Heartbeat

어떤 `agents.list[]` 항목이든 `heartbeat` 블록을 포함하면 **해당 에이전트들만** Heartbeat를 실행합니다. 에이전트별 블록은 `agents.defaults.heartbeat` 위에 병합되므로, 공통 기본값을 한 번만 설정하고 에이전트별로 재정의할 수 있습니다.

예: 두 개의 에이전트 중 두 번째 에이전트만 Heartbeat를 실행.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
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

### 활동 시간 예시

특정 시간대의 업무 시간으로 Heartbeat 제한:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 선택 사항; 설정되어 있으면 userTimezone을 사용하고, 없으면 호스트 시간대를 사용
        },
      },
    },
  },
}
```

이 시간 창(동부 표준시 기준 오전 9시 이전 또는 오후 10시 이후) 밖에서는 Heartbeat가 건너뛰어집니다. 다음으로 예약된 시간 창 내 tick은 정상적으로 실행됩니다.

### 24/7 설정

Heartbeat를 하루 종일 실행하려면 다음 패턴 중 하나를 사용하세요:

- `activeHours`를 완전히 생략합니다(시간 창 제한 없음, 이것이 기본 동작).
- 하루 전체 창을 설정합니다: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
동일한 `start`와 `end` 시간을 설정하지 마세요(예: `08:00`부터 `08:00`). 이는 폭이 0인 창으로 처리되므로 Heartbeat는 항상 건너뛰어집니다.
</Warning>

### 다중 계정 예시

Telegram 같은 다중 계정 채널에서 특정 계정을 대상으로 지정하려면 `accountId`를 사용하세요:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 선택 사항: 특정 topic/thread로 라우팅
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

### 필드 참고

<ParamField path="every" type="string">
  Heartbeat 간격(기간 문자열, 기본 단위 = 분).
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 실행용 선택적 model 재정의(`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  활성화하면 사용 가능할 때 별도의 `Reasoning:` 메시지도 전달합니다(`/reasoning on`과 동일한 형식).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true이면 Heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 워크스페이스 bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true이면 각 Heartbeat는 이전 대화 기록이 없는 새 세션에서 실행됩니다. Cron `sessionTarget: "isolated"`와 동일한 격리 패턴을 사용합니다. Heartbeat당 토큰 비용을 크게 줄입니다. 최대 절약을 위해 `lightContext: true`와 함께 사용하세요. 전달 라우팅은 여전히 main 세션 컨텍스트를 사용합니다.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 실행용 선택적 세션 키.

  - `main`(기본값): 에이전트 main 세션.
  - 명시적 세션 키(`openclaw sessions --json` 또는 [sessions CLI](/ko/cli/sessions)에서 복사).
  - 세션 키 형식: [Sessions](/ko/concepts/session) 및 [Groups](/ko/channels/groups) 참조.
</ParamField>
<ParamField path="target" type="string">
  - `last`: 마지막으로 사용한 외부 채널로 전달.
  - 명시적 채널: 구성된 모든 채널 또는 Plugin id(예: `discord`, `matrix`, `telegram`, `whatsapp`).
  - `none`(기본값): Heartbeat는 실행하지만 외부로는 **전달하지 않음**.
</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM 전달 동작을 제어합니다. `allow`: direct/DM Heartbeat 전달 허용. `block`: direct/DM 전달 억제(`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  선택적 수신자 재정의(채널별 id, 예: WhatsApp용 E.164 또는 Telegram chat id). Telegram topic/thread의 경우 `<chatId>:topic:<messageThreadId>`를 사용하세요.
</ParamField>
<ParamField path="accountId" type="string">
  다중 계정 채널용 선택적 계정 id입니다. `target: "last"`일 때 계정 id는 계정을 지원하는 경우 확인된 마지막 채널에 적용되고, 그렇지 않으면 무시됩니다. 계정 id가 확인된 채널의 구성된 계정과 일치하지 않으면 전달은 건너뛰어집니다.
</ParamField>
<ParamField path="prompt" type="string">
  기본 프롬프트 본문을 재정의합니다(병합되지 않음).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  전달 전에 `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true이면 Heartbeat 실행 중 도구 오류 경고 payload를 억제합니다.
</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 실행을 특정 시간 창으로 제한합니다. `start`(HH:MM, 포함; 하루 시작은 `00:00` 사용), `end`(HH:MM, 미포함; 하루 끝에는 `24:00` 허용), 선택적 `timezone`을 가진 객체입니다.

  - 생략되거나 `"user"`이면 설정된 `agents.defaults.userTimezone`을 사용하고, 설정되지 않은 경우 호스트 시스템 시간대로 폴백합니다.
  - `"local"`이면 항상 호스트 시스템 시간대를 사용합니다.
  - 모든 IANA 식별자(예: `America/New_York`)는 직접 사용되며, 유효하지 않으면 위의 `"user"` 동작으로 폴백합니다.
  - 활성 시간 창이 되려면 `start`와 `end`가 같으면 안 됩니다. 값이 같으면 폭이 0인 창으로 처리됩니다(항상 시간 창 밖).
  - 활성 시간 창 밖에서는 Heartbeat가 건너뛰어지며, 다음 시간 창 내 tick까지 대기합니다.
</ParamField>

## 전달 동작

<AccordionGroup>
  <Accordion title="세션 및 대상 라우팅">
    - Heartbeat는 기본적으로 에이전트의 main 세션(`agent:<id>:<mainKey>`)에서 실행되며, `session.scope = "global"`일 때는 `global`에서 실행됩니다. 특정 채널 세션(Discord/WhatsApp 등)으로 재정의하려면 `session`을 설정하세요.
    - `session`은 실행 컨텍스트에만 영향을 주며, 전달은 `target`과 `to`로 제어됩니다.
    - 특정 채널/수신자에게 전달하려면 `target` + `to`를 설정하세요. `target: "last"`일 때 전달은 해당 세션의 마지막 외부 채널을 사용합니다.
    - Heartbeat 전달은 기본적으로 direct/DM 대상을 허용합니다. direct 대상 전송은 억제하면서 Heartbeat 턴은 계속 실행하려면 `directPolicy: "block"`을 설정하세요.
    - main 큐가 바쁘면 Heartbeat는 건너뛰어지고 나중에 다시 시도됩니다.
    - `target`이 외부 대상 없이 확인되더라도 실행 자체는 발생하지만 아웃바운드 메시지는 전송되지 않습니다.
  </Accordion>
  <Accordion title="표시 여부 및 건너뛰기 동작">
    - `showOk`, `showAlerts`, `useIndicator`가 모두 비활성화되어 있으면 실행은 시작 전에 `reason=alerts-disabled`로 건너뛰어집니다.
    - 알림 전달만 비활성화된 경우 OpenClaw는 여전히 Heartbeat를 실행하고, due-task 타임스탬프를 업데이트하고, 세션 idle 타임스탬프를 복원하고, 외부 알림 payload는 억제할 수 있습니다.
    - 확인된 Heartbeat 대상이 타이핑 표시를 지원하면 OpenClaw는 Heartbeat 실행이 활성 상태인 동안 타이핑 표시를 보여줍니다. 이는 Heartbeat가 채팅 출력을 보낼 동일한 대상을 사용하며, `typingMode: "never"`로 비활성화할 수 있습니다.
  </Accordion>
  <Accordion title="세션 lifecycle 및 감사">
    - Heartbeat 전용 응답은 **세션을 활성 상태로 유지하지 않습니다**. Heartbeat 메타데이터가 세션 행을 업데이트할 수는 있지만, idle 만료는 마지막 실제 사용자/채널 메시지의 `lastInteractionAt`를 사용하고, 일일 만료는 `sessionStartedAt`를 사용합니다.
    - Control UI와 WebChat 기록은 Heartbeat 프롬프트와 OK 전용 확인 응답을 숨깁니다. 하지만 감사/재생용으로 기본 세션 transcript에는 해당 턴이 여전히 포함될 수 있습니다.
    - 분리된 [백그라운드 작업](/ko/automation/tasks)은 main 세션이 무언가를 빠르게 알아야 할 때 시스템 이벤트를 큐에 넣고 Heartbeat를 깨울 수 있습니다. 이 wake가 Heartbeat 실행을 백그라운드 작업으로 만들지는 않습니다.
  </Accordion>
</AccordionGroup>

## 표시 여부 제어

기본적으로 `HEARTBEAT_OK` 확인 응답은 숨겨지고, 알림 콘텐츠는 전달됩니다. 이를 채널별 또는 계정별로 조정할 수 있습니다:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK 숨기기(기본값)
      showAlerts: true # 알림 메시지 표시(기본값)
      useIndicator: true # indicator 이벤트 발생(기본값)
  telegram:
    heartbeat:
      showOk: true # Telegram에서는 OK 확인 응답 표시
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 이 계정의 알림 전달 억제
```

우선순위: 계정별 → 채널별 → 채널 기본값 → 내장 기본값.

### 각 플래그의 동작

- `showOk`: 모델이 OK 전용 응답을 반환할 때 `HEARTBEAT_OK` 확인 응답을 보냅니다.
- `showAlerts`: 모델이 OK가 아닌 응답을 반환할 때 알림 콘텐츠를 보냅니다.
- `useIndicator`: UI 상태 표면용 indicator 이벤트를 발생시킵니다.

**세 값이 모두** false이면 OpenClaw는 Heartbeat 실행 전체를 건너뜁니다(모델 호출 없음).

### 채널별 대 계정별 예시

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 모든 Slack 계정
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ops 계정에만 알림 억제
  telegram:
    heartbeat:
      showOk: true
```

### 일반적인 패턴

| 목표 | Config |
| --- | --- |
| 기본 동작(조용한 OK, 알림 켜짐) | _(config 불필요)_ |
| 완전히 조용함(메시지 없음, indicator 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| indicator 전용(메시지 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 한 채널에서만 OK 표시 | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md(선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트가 에이전트에게 이를 읽으라고 지시합니다. 이를 "Heartbeat 체크리스트"라고 생각하세요. 작고 안정적이며 30분마다 포함해도 안전해야 합니다.

일반 실행에서 `HEARTBEAT.md`는 기본 에이전트에 대해 Heartbeat 지침이 활성화된 경우에만 주입됩니다. `0m`으로 Heartbeat 주기를 비활성화하거나 `includeSystemPromptSection: false`를 설정하면 일반 bootstrap 컨텍스트에서 생략됩니다.

`HEARTBEAT.md`가 존재하지만 실질적으로 비어 있는 경우(빈 줄과 `# Heading` 같은 마크다운 헤더만 포함) OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다. 이 건너뛰기는 `reason=empty-heartbeat-file`로 보고됩니다. 파일이 없으면 Heartbeat는 계속 실행되며 모델이 무엇을 할지 결정합니다.

프롬프트 비대화를 피하기 위해 작게 유지하세요(짧은 체크리스트 또는 reminder).

예시 `HEARTBEAT.md`:

```md
# Heartbeat checklist

- 빠른 확인: 받은편지함에 긴급한 것이 있나요?
- 낮 시간이라면, 다른 보류 작업이 없을 때 가벼운 확인 메시지를 보냅니다.
- 작업이 막혀 있으면 _무엇이 부족한지_ 적어두고 다음에 Peter에게 물어봅니다.
```

### `tasks:` 블록

`HEARTBEAT.md`는 Heartbeat 자체 내에서 간격 기반 점검을 위한 작은 구조화된 `tasks:` 블록도 지원합니다.

예시:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "긴급한 읽지 않은 이메일을 확인하고 시간 민감한 항목을 표시하세요."
- name: calendar-scan
  interval: 2h
  prompt: "준비 또는 후속 조치가 필요한 예정된 회의를 확인하세요."

# 추가 지침

- 알림은 짧게 유지하세요.
- 모든 due task 이후에도 주의할 것이 없으면 HEARTBEAT_OK로 응답하세요.
```

<AccordionGroup>
  <Accordion title="동작">
    - OpenClaw는 `tasks:` 블록을 파싱하고 각 task를 자체 `interval`에 따라 확인합니다.
    - 해당 tick에 **기한이 된** task만 Heartbeat 프롬프트에 포함됩니다.
    - 기한이 된 task가 없으면 낭비되는 모델 호출을 피하기 위해 Heartbeat 전체를 건너뜁니다(`reason=no-tasks-due`).
    - `HEARTBEAT.md`의 task가 아닌 콘텐츠는 유지되며 due-task 목록 뒤에 추가 컨텍스트로 덧붙여집니다.
    - task의 마지막 실행 타임스탬프는 세션 상태(`heartbeatTaskState`)에 저장되므로 일반 재시작 후에도 간격이 유지됩니다.
    - task 타임스탬프는 Heartbeat 실행이 정상적인 응답 경로를 완료한 후에만 앞으로 이동합니다. 건너뛴 `empty-heartbeat-file` / `no-tasks-due` 실행은 task를 완료로 표시하지 않습니다.
  </Accordion>
</AccordionGroup>

task 모드는 하나의 Heartbeat 파일에 여러 주기적 점검을 넣고 싶지만, 매 tick마다 모든 항목에 비용을 지불하고 싶지 않을 때 유용합니다.

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있나요?

예 — 그렇게 요청하면 가능합니다.

`HEARTBEAT.md`는 에이전트 워크스페이스에 있는 일반 파일이므로, 일반 채팅에서 다음과 같이 말할 수 있습니다:

- "`HEARTBEAT.md`를 업데이트해서 매일 일정 확인을 추가해 줘."
- "`HEARTBEAT.md`를 더 짧고 받은편지함 후속 조치에 집중되도록 다시 써 줘."

이를 더 능동적으로 하게 하려면 Heartbeat 프롬프트에 다음과 같은 명시적 문구를 넣을 수도 있습니다: "체크리스트가 오래되면 더 나은 것으로 HEARTBEAT.md를 업데이트하세요."

<Warning>
`HEARTBEAT.md`에는 시크릿(API 키, 전화번호, 비공개 토큰)을 넣지 마세요. 프롬프트 컨텍스트의 일부가 됩니다.
</Warning>

## 수동 wake(온디맨드)

다음으로 시스템 이벤트를 큐에 넣고 즉시 Heartbeat를 트리거할 수 있습니다:

```bash
openclaw system event --text "긴급한 후속 조치 확인" --mode now
```

여러 에이전트에 `heartbeat`가 구성되어 있으면 수동 wake는 해당 에이전트 Heartbeat를 각각 즉시 실행합니다.

다음 예약 tick까지 기다리려면 `--mode next-heartbeat`를 사용하세요.

## 추론 전달(선택 사항)

기본적으로 Heartbeat는 최종 "답변" payload만 전달합니다.

투명성이 필요하다면 다음을 활성화하세요:

- `agents.defaults.heartbeat.includeReasoning: true`

활성화하면 Heartbeat는 별도로 `Reasoning:` 접두사가 붙은 메시지도 전달합니다(`/reasoning on`과 같은 형식). 에이전트가 여러 세션/codex를 관리 중이고 왜 사용자에게 ping하기로 결정했는지 보고 싶을 때 유용할 수 있지만, 원치 않는 내부 세부 사항이 더 많이 드러날 수도 있습니다. 그룹 채팅에서는 꺼 두는 편이 좋습니다.

## 비용 인식

Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 사용합니다. 비용을 줄이려면:

- `isolatedSession: true`를 사용해 전체 대화 기록 전송을 피하세요(실행당 약 100K 토큰에서 약 2~5K로 감소).
- `lightContext: true`를 사용해 bootstrap 파일을 `HEARTBEAT.md`만으로 제한하세요.
- 더 저렴한 `model`을 설정하세요(예: `ollama/llama3.2:1b`).
- `HEARTBEAT.md`를 작게 유지하세요.
- 내부 상태 업데이트만 원한다면 `target: "none"`을 사용하세요.

## 관련

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — 분리된 작업이 추적되는 방식
- [Timezone](/ko/concepts/timezone) — 시간대가 Heartbeat 스케줄링에 미치는 영향
- [문제 해결](/ko/automation/cron-jobs#troubleshooting) — 자동화 문제 디버깅
