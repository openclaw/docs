---
read_when:
    - Heartbeat 주기 또는 메시징 조정
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Heartbeat
summary: Heartbeat 폴링 메시지 및 알림 규칙
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T15:15:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat와 Cron 중 무엇을 사용해야 하나요?** 각각을 언제 사용해야 하는지에 대한 지침은 [자동화](/ko/automation)를 참조하십시오.
</Note>

Heartbeat는 기본 세션에서 **주기적인 에이전트 턴**을 실행하여, 모델이 사용자를 방해할 정도로 메시지를 보내지 않으면서도 주의가 필요한 사항을 알릴 수 있도록 합니다.

Heartbeat는 예약된 기본 세션 턴이며, [백그라운드 작업](/ko/automation/tasks) 레코드를 생성하지 **않습니다**. 작업 레코드는 분리된 작업(ACP 실행, 하위 에이전트, 격리된 Cron 작업)을 위한 것입니다.

문제 해결: [예약된 작업](/ko/automation/cron-jobs#troubleshooting)

## 빠른 시작(초보자)

<Steps>
  <Step title="실행 주기 선택">
    Heartbeat를 활성화된 상태로 두거나(기본값은 `30m`이며, Claude CLI 재사용을 포함하여 Anthropic OAuth/토큰 인증이 구성된 경우 `1h`) 원하는 실행 주기를 설정하십시오.
  </Step>
  <Step title="HEARTBEAT.md 추가(선택 사항)">
    에이전트 작업 공간에 간단한 `HEARTBEAT.md` 체크리스트 또는 `tasks:` 블록을 생성하십시오.
  </Step>
  <Step title="Heartbeat 메시지를 보낼 위치 결정">
    기본값은 `target: "none"`입니다. 마지막 연락 대상으로 라우팅하려면 `target: "last"`를 설정하십시오.
  </Step>
  <Step title="선택적 조정">
    - 투명성을 위해 Heartbeat 추론 전송을 활성화하십시오.
    - Heartbeat 실행에 `HEARTBEAT.md`만 필요한 경우 경량 부트스트랩 컨텍스트를 사용하십시오.
    - 각 Heartbeat마다 전체 대화 기록이 전송되지 않도록 격리된 세션을 활성화하십시오.
    - Heartbeat를 활성 시간(현지 시간)으로 제한하십시오.

  </Step>
</Steps>

구성 예시:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락 대상으로 명시적으로 전송(기본값은 "none")
        directPolicy: "allow", // 기본값: 직접/DM 대상 허용. 억제하려면 "block"으로 설정
        lightContext: true, // 선택 사항: 부트스트랩 파일 중 HEARTBEAT.md만 삽입
        isolatedSession: true, // 선택 사항: 실행할 때마다 새 세션 사용(대화 기록 없음)
        skipWhenBusy: true, // 선택 사항: 이 에이전트의 하위 에이전트 또는 중첩 레인이 사용 중일 때도 연기
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택 사항: 별도의 `Thinking` 메시지도 전송
      },
    },
  },
}
```

## 기본값

- 간격: `30m`. 확인된 인증 모드가 OAuth/토큰(Claude CLI 재사용 포함)인 경우 Anthropic 제공자 기본값을 적용하면 이 값이 `1h`로 늘어나지만, `heartbeat.every`가 설정되지 않은 동안에만 적용됩니다. `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`를 설정하고, 비활성화하려면 `0m`를 사용하십시오.
- 프롬프트 본문(`agents.defaults.heartbeat.prompt`을 통해 구성 가능): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 시간 제한: Heartbeat가 설정되지 않은 턴은 `agents.defaults.timeoutSeconds`이 설정되어 있으면 해당 값을 사용합니다. 그렇지 않으면 최대 600초로 제한된 Heartbeat 주기를 사용합니다. 더 긴 Heartbeat 작업에는 `agents.defaults.heartbeat.timeoutSeconds` 또는 에이전트별 `agents.list[].heartbeat.timeoutSeconds`을 설정하십시오.
- Heartbeat 프롬프트는 사용자 메시지로 **원문 그대로** 전송됩니다. 시스템 프롬프트에는 기본 에이전트에 Heartbeat가 활성화되어 있고 `includeSystemPromptSection`이 `false`이 아닌 경우에만 "Heartbeats" 섹션이 포함되며, 실행에는 내부적으로 플래그가 지정됩니다.
- `0m`으로 Heartbeat를 비활성화하면 모델이 Heartbeat 전용 지침을 보지 않도록 일반 실행에서도 부트스트랩 컨텍스트의 `HEARTBEAT.md`을 생략합니다.
- 활성 시간(`heartbeat.activeHours`)은 구성된 시간대에서 확인됩니다. 시간 범위를 벗어나면 해당 범위 안의 다음 틱까지 Heartbeat를 건너뜁니다.
- Cron 작업이 활성 상태이거나 대기열에 있으면 Heartbeat는 자동으로 연기됩니다. 에이전트 자체의 세션 키 기반 하위 에이전트 또는 중첩 명령 레인에서도 해당 에이전트를 연기하려면 `heartbeat.skipWhenBusy: true`을 설정하십시오. 이제 다른 에이전트에서 하위 에이전트 작업이 진행 중이라는 이유만으로 형제 에이전트가 일시 중지되지는 않습니다.

## Heartbeat 프롬프트의 용도

기본 프롬프트는 의도적으로 광범위합니다.

- **백그라운드 작업**: "미처리 작업을 검토하세요"라는 문구는 에이전트가 후속 조치(받은 편지함, 캘린더, 미리 알림, 대기 중인 작업)를 검토하고 긴급한 항목을 알리도록 유도합니다.
- **사용자 안부 확인**: "낮 시간에는 가끔 사용자에게 안부를 물으세요"라는 문구는 이따금 가볍게 "필요한 것이 있나요?"라는 메시지를 보내도록 유도하지만, 설정된 현지 시간대를 사용하여 야간에는 스팸성 메시지를 보내지 않도록 합니다([시간대](/ko/concepts/timezone) 참조).

Heartbeat는 완료된 [백그라운드 작업](/ko/automation/tasks)에 반응할 수 있지만, Heartbeat 실행 자체는 작업 레코드를 생성하지 않습니다.

Heartbeat가 매우 구체적인 작업(예: "Gmail PubSub 통계 확인" 또는 "Gateway 상태 확인")을 수행하도록 하려면 `agents.defaults.heartbeat.prompt`(또는 `agents.list[].heartbeat.prompt`)를 사용자 지정 본문으로 설정하십시오(본문은 그대로 전송됩니다).

## 응답 규약

- 주의가 필요한 사항이 없으면 **`HEARTBEAT_OK`**로 응답하십시오.
- Heartbeat 실행에서는 화면에 업데이트를 표시하지 않기 위해 `notify: false`로 `heartbeat_respond`를 호출하거나, 알림을 보내기 위해 `notify: true`와 `notificationText`를 함께 사용할 수도 있습니다. 구조화된 도구 응답이 있으면 텍스트 대체 응답보다 우선합니다.
- Heartbeat 실행 중 OpenClaw는 응답의 **시작 또는 끝**에 있는 `HEARTBEAT_OK`를 확인 응답으로 처리합니다. 이 토큰은 제거되며, 나머지 콘텐츠가 **≤ `ackMaxChars`**(기본값: 300)이면 응답이 폐기됩니다.
- `HEARTBEAT_OK`가 응답의 **중간**에 있으면 특별하게 처리되지 않습니다.
- 알림에는 `HEARTBEAT_OK`를 포함하지 **마십시오**. 알림 텍스트만 반환하십시오.

Heartbeat 외부에서는 메시지 시작/끝에 불필요하게 포함된 `HEARTBEAT_OK`가 제거되고 로그에 기록됩니다. `HEARTBEAT_OK`만 포함된 메시지는 폐기됩니다.

## 구성

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본값: 30m(0m이면 비활성화)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 기본값: false(사용 가능한 경우 별도의 사고 과정 메시지 전달)
        lightContext: false, // 기본값: false. true이면 작업 공간 부트스트랩 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false. true이면 각 Heartbeat를 새 세션에서 실행(대화 기록 없음)
        skipWhenBusy: false, // 기본값: false. true이면 이 에이전트의 하위 에이전트/중첩 레인도 완료될 때까지 대기
        target: "last", // 기본값: none | 옵션: last | none | <channel id>(코어 또는 Plugin, 예: "imessage")
        to: "+15551234567", // 선택적 채널별 재정의
        accountId: "ops-bot", // 선택적 다중 계정 채널 ID
        prompt: "HEARTBEAT.md가 존재하면 읽으십시오(작업 공간 컨텍스트). 내용을 엄격히 따르십시오. 이전 채팅의 오래된 작업을 추론하거나 반복하지 마십시오. 주의가 필요한 사항이 없으면 HEARTBEAT_OK로 응답하십시오.",
        includeSystemPromptSection: true, // 기본값: true. false이면 기본 에이전트에서 ## Heartbeats 시스템 프롬프트 섹션 생략
        ackMaxChars: 300, // HEARTBEAT_OK 뒤에 허용되는 최대 문자 수
      },
    },
  },
}
```

### 범위 및 우선순위

- `agents.defaults.heartbeat`는 전역 Heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`는 전역 설정 위에 병합됩니다. 에이전트 중 하나라도 `heartbeat` 블록을 포함하면 **해당 에이전트들만** Heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 표시 여부 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 재정의합니다.
- `channels.<channel>.accounts.<id>.heartbeat`(다중 계정 채널)는 채널별 설정을 재정의합니다.

### 에이전트별 Heartbeat

`agents.list[]` 항목 중 하나라도 `heartbeat` 블록을 포함하면 **해당 에이전트들만** Heartbeat를 실행합니다. 에이전트별 블록은 `agents.defaults.heartbeat` 위에 병합되므로 공유 기본값을 한 번 설정한 다음 에이전트별로 재정의할 수 있습니다.

예: 에이전트가 두 개이며, 두 번째 에이전트만 Heartbeat를 실행합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적으로 전달합니다(기본값은 "none").
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
          prompt: "HEARTBEAT.md가 있으면 읽으십시오(워크스페이스 컨텍스트). 내용을 엄격히 따르십시오. 이전 채팅의 오래된 작업을 추론하거나 반복하지 마십시오. 확인이 필요한 사항이 없으면 HEARTBEAT_OK로 응답하십시오.",
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
        target: "last", // 마지막 연락처로 명시적으로 전달합니다(기본값은 "none").
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 선택 사항입니다. 설정된 경우 userTimezone을 사용하고, 그렇지 않으면 호스트 시간대를 사용합니다.
        },
      },
    },
  },
}
```

이 시간 범위 밖(미국 동부 시간 기준 오전 9시 이전 또는 오후 10시 이후)에는 Heartbeat를 건너뜁니다. 이 범위 안에서 다음으로 예약된 틱은 정상적으로 실행됩니다.

### 연중무휴 설정

Heartbeat가 하루 종일 실행되도록 하려면 다음 패턴 중 하나를 사용하십시오.

- `activeHours`를 완전히 생략합니다(시간대 제한 없음, 기본 동작).
- 하루 전체 시간대를 설정합니다: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
동일한 `start` 및 `end` 시간을 설정하지 마십시오(예: `08:00`에서 `08:00`). 이는 폭이 0인 시간대로 처리되므로 Heartbeat를 항상 건너뜁니다.
</Warning>

### 다중 계정 예시

Telegram과 같은 다중 계정 채널에서 특정 계정을 대상으로 지정하려면 `accountId`를 사용하십시오.

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 선택 사항: 특정 토픽/스레드로 라우팅
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
  활성화하면 별도의 `Thinking` 메시지가 제공될 때 함께 전달합니다(`/reasoning on`과 동일한 형식).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true이면 Heartbeat 실행에서 경량 부트스트랩 컨텍스트를 사용하고 워크스페이스 부트스트랩 파일 중 `HEARTBEAT.md`만 유지합니다.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true이면 각 Heartbeat가 이전 대화 기록이 없는 새 세션에서 실행됩니다. Cron의 `sessionTarget: "isolated"`와 동일한 격리 패턴을 사용합니다. Heartbeat당 토큰 비용을 크게 줄입니다. 최대한 절약하려면 `lightContext: true`와 함께 사용하십시오. 전달 라우팅에는 계속 기본 세션 컨텍스트를 사용합니다.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true이면 해당 에이전트의 추가 사용 중 레인, 즉 자체 세션 키 기반 하위 에이전트 또는 중첩 명령 작업이 있을 때 Heartbeat 실행을 연기합니다. 이 플래그가 없어도 Cron 레인은 항상 Heartbeat를 연기하므로 로컬 모델 호스트에서 Cron과 Heartbeat 프롬프트를 동시에 실행하지 않습니다.
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 실행을 위한 선택적 세션 키입니다.

- `main`(기본값): 에이전트 기본 세션.
- 명시적 세션 키(`openclaw sessions --json` 또는 [세션 CLI](/ko/cli/sessions)에서 복사).
- 세션 키 형식: [세션](/ko/concepts/session) 및 [그룹](/ko/channels/groups)을 참조하십시오.

</ParamField>
<ParamField path="target" type="string">
- `last`: 마지막으로 사용한 외부 채널로 전달합니다.
- 명시적 채널: 구성된 채널 또는 Plugin ID(예: `discord`, `matrix`, `telegram`, `whatsapp`).
- `none`(기본값): Heartbeat를 실행하지만 외부로 **전달하지 않습니다**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  직접/DM 전달 동작을 제어합니다. `allow`: 직접/DM Heartbeat 전달을 허용합니다. `block`: 직접/DM 전달을 억제합니다(`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  선택적 수신자 재정의입니다(채널별 ID, 예: WhatsApp의 E.164 또는 Telegram 채팅 ID). Telegram 토픽/스레드에는 `<chatId>:topic:<messageThreadId>`를 사용하십시오.

</ParamField>
<ParamField path="accountId" type="string">
  다중 계정 채널을 위한 선택적 계정 ID입니다. `target: "last"`인 경우 계정 ID는 확인된 마지막 채널이 계정을 지원할 때 해당 채널에 적용되며, 그렇지 않으면 무시됩니다. 계정 ID가 확인된 채널에 구성된 계정과 일치하지 않으면 전달을 건너뜁니다.

</ParamField>
<ParamField path="prompt" type="string">
  기본 프롬프트 본문을 재정의합니다(병합하지 않음).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  기본 에이전트의 `## Heartbeats` 시스템 프롬프트 섹션을 삽입할지 여부입니다. Heartbeat 런타임 동작(주기, 전달, HEARTBEAT.md)은 유지하면서 에이전트 시스템 프롬프트에서 Heartbeat 지침을 생략하려면 `false`로 설정하십시오.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  전달 전에 `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수입니다.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 표시하지 않습니다.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat 에이전트 턴이 중단되기 전까지 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`가 설정된 경우 해당 값을 사용하고, 그렇지 않으면 최대 600초로 제한된 Heartbeat 주기를 사용합니다.

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 실행을 특정 시간대로 제한합니다. `start`(HH:MM, 포함; 하루 시작에는 `00:00` 사용), `end`(HH:MM, 제외; 하루 종료에는 `24:00` 허용), 선택적 `timezone`으로 구성된 객체입니다.

- 생략하거나 `"user"`로 설정: `agents.defaults.userTimezone`이 설정되어 있으면 해당 값을 사용하고, 그렇지 않으면 호스트 시스템 시간대로 대체합니다.
- `"local"`: 항상 호스트 시스템 시간대를 사용합니다.
- 임의의 IANA 식별자(예: `America/New_York`): 직접 사용하며, 유효하지 않으면 위의 `"user"` 동작으로 대체합니다.
- 활성 시간대에서 `start`와 `end`는 같을 수 없습니다. 값이 같으면 폭이 0인 것으로 처리됩니다(항상 시간대 밖).
- 활성 시간대 밖에서는 시간대 안의 다음 틱까지 Heartbeat를 건너뜁니다.

</ParamField>

## 전달 동작

<AccordionGroup>
  <Accordion title="세션 및 대상 라우팅">
    - Heartbeat는 기본적으로 에이전트의 기본 세션(`agent:<id>:<mainKey>`)에서 실행되며, `session.scope = "global"`이면 `global`에서 실행됩니다. 특정 채널 세션(Discord/WhatsApp 등)으로 재정의하려면 `session`을 설정하십시오.
    - `session`은 실행 컨텍스트에만 영향을 줍니다. 전달은 `target`과 `to`로 제어합니다.
    - 특정 채널/수신자에게 전달하려면 `target` + `to`를 설정하십시오. `target: "last"`를 사용하면 해당 세션의 마지막 외부 채널로 전달합니다.
    - Heartbeat 전달은 기본적으로 직접/DM 대상을 허용합니다. Heartbeat 턴은 계속 실행하되 직접 대상 전송을 차단하려면 `directPolicy: "block"`을 설정하십시오.
    - 기본 큐, 대상 세션 레인, Cron 레인 또는 활성 Cron 작업이 사용 중이면 Heartbeat를 건너뛰고 나중에 다시 시도합니다.
    - `skipWhenBusy: true`이면 이 에이전트의 세션 키 기반 하위 에이전트 및 중첩 레인도 Heartbeat 실행을 연기합니다. 다른 에이전트의 사용 중인 레인은 이 에이전트의 실행을 연기하지 않습니다.
    - `target`이 외부 목적지로 확인되지 않더라도 실행은 계속되지만 아웃바운드 메시지는 전송되지 않습니다.

  </Accordion>
  <Accordion title="표시 및 건너뛰기 동작">
    - `showOk`, `showAlerts`, `useIndicator`가 모두 비활성화되어 있으면 실행을 시작하기 전에 `reason=alerts-disabled`로 건너뜁니다.
    - 알림 전달만 비활성화되어 있으면 OpenClaw는 계속 Heartbeat를 실행하고, 기한이 된 작업의 타임스탬프를 업데이트하고, 세션 유휴 타임스탬프를 복원하며, 외부 알림 페이로드를 표시하지 않을 수 있습니다.
    - 확인된 Heartbeat 대상이 입력 중 표시를 지원하면 OpenClaw는 Heartbeat 실행이 활성화된 동안 입력 중 상태를 표시합니다. 이때 Heartbeat가 채팅 출력을 전송할 동일한 대상을 사용하며, `typingMode: "never"`로 비활성화할 수 있습니다.

  </Accordion>
  <Accordion title="세션 수명 주기 및 감사">
    - Heartbeat 전용 응답은 세션을 활성 상태로 **유지하지 않습니다**. Heartbeat 메타데이터가 세션 행을 업데이트할 수는 있지만, 유휴 만료에는 마지막 실제 사용자/채널 메시지의 `lastInteractionAt`을 사용하고 일일 만료에는 `sessionStartedAt`을 사용합니다.
    - Control UI 및 WebChat 기록에서는 Heartbeat 프롬프트와 OK 전용 확인 응답을 숨깁니다. 감사/재생을 위해 기본 세션 트랜스크립트에는 해당 턴이 계속 포함될 수 있습니다.
    - 분리된 [백그라운드 작업](/ko/automation/tasks)은 기본 세션이 무언가를 빠르게 확인해야 할 때 시스템 이벤트를 대기열에 넣고 Heartbeat를 깨울 수 있습니다. 이 깨우기로 인해 Heartbeat 실행이 백그라운드 작업이 되지는 않습니다.

  </Accordion>
</AccordionGroup>

## 표시 제어

기본적으로 알림 콘텐츠는 전달하지만 `HEARTBEAT_OK` 확인 응답은 표시하지 않습니다. 채널별 또는 계정별로 이를 조정할 수 있습니다.

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK 숨기기(기본값)
      showAlerts: true # 알림 메시지 표시(기본값)
      useIndicator: true # 표시기 이벤트 발생(기본값)
  telegram:
    heartbeat:
      showOk: true # Telegram에서 OK 확인 응답 표시
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 이 계정의 알림 전달 억제
```

우선순위: 계정별 → 채널별 → 채널 기본값 → 내장 기본값.

### 각 플래그의 기능

- `showOk`: 모델이 OK 전용 응답을 반환하면 `HEARTBEAT_OK` 확인 응답을 전송합니다.
- `showAlerts`: 모델이 OK가 아닌 응답을 반환하면 알림 콘텐츠를 전송합니다.
- `useIndicator`: UI 상태 화면에 표시기 이벤트를 발생시킵니다.

**세 값 모두** false이면 OpenClaw는 Heartbeat 실행을 완전히 건너뜁니다(모델 호출 없음).

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
      showOk: true # 모든 Slack 계정
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ops 계정의 알림만 억제
  telegram:
    heartbeat:
      showOk: true
```

### 일반적인 패턴

| 목표                                      | 구성                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| 기본 동작(OK는 표시하지 않고 알림은 켜기) | _(구성 필요 없음)_                                                                       |
| 완전히 표시하지 않음(메시지 및 표시기 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 표시기만 사용(메시지 없음)                | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 한 채널에서만 OK 표시                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md(선택 사항)

작업 공간에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트가 에이전트에게 해당 파일을 읽도록 지시합니다. 이를 30분마다 검토해도 안전한 작고 안정적인 "Heartbeat 체크리스트"로 생각하십시오.

일반 실행에서는 기본 에이전트에 Heartbeat 지침이 활성화된 경우에만 `HEARTBEAT.md`가 삽입됩니다. `0m`으로 Heartbeat 주기를 비활성화하거나 `includeSystemPromptSection: false`를 설정하면 일반 부트스트랩 컨텍스트에서 해당 파일을 생략합니다.

네이티브 Codex 하네스에서는 `HEARTBEAT.md` 콘텐츠가 다른 부트스트랩 파일처럼 턴에 삽입되지 않습니다. 파일이 존재하고 공백이 아닌 콘텐츠가 있으면 Heartbeat 협업 모드 메모가 Codex에 해당 파일을 안내하고, 계속하기 전에 파일을 읽도록 지시합니다.

`HEARTBEAT.md`가 존재하지만 사실상 비어 있으면(빈 줄, Markdown/HTML 주석, `# Heading`과 같은 Markdown 제목, 펜스 마커 또는 빈 체크리스트 스텁만 포함) OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다. 이 건너뛰기는 `reason=empty-heartbeat-file`로 보고됩니다. 파일이 없으면 Heartbeat는 계속 실행되며 모델이 수행할 작업을 결정합니다.

프롬프트가 불필요하게 커지지 않도록 아주 작게 유지하십시오(짧은 체크리스트 또는 알림).

`HEARTBEAT.md` 예시:

```md
# Heartbeat 체크리스트

- 빠른 확인: 받은 편지함에 긴급한 내용이 있습니까?
- 낮 시간이라면 대기 중인 다른 작업이 없을 때 간단히 상태를 확인합니다.
- 작업이 차단된 경우 _부족한 것이 무엇인지_ 기록하고 다음에 Peter에게 문의합니다.
```

### `tasks:` 블록

`HEARTBEAT.md`는 Heartbeat 자체에서 주기 기반 확인을 수행하기 위한 작은 구조화된 `tasks:` 블록도 지원합니다.

예시:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "긴급한 읽지 않은 이메일이 있는지 확인하고 시간에 민감한 항목을 표시합니다."
- name: calendar-scan
  interval: 2h
  prompt: "준비 또는 후속 조치가 필요한 예정된 회의가 있는지 확인합니다."

# 추가 지침

- 알림은 짧게 유지합니다.
- 기한이 된 모든 작업을 확인한 후 주의가 필요한 항목이 없으면 HEARTBEAT_OK로 응답합니다.
```

<AccordionGroup>
  <Accordion title="동작">
    - OpenClaw는 `tasks:` 블록을 파싱하고 각 작업을 자체 `interval`과 비교하여 확인합니다.
    - 해당 틱에 기한이 **도래한** 작업만 Heartbeat 프롬프트에 포함됩니다.
    - 기한이 도래한 작업이 없으면 불필요한 모델 호출을 피하기 위해 Heartbeat를 완전히 건너뜁니다(`reason=no-tasks-due`).
    - `HEARTBEAT.md`의 작업 외 콘텐츠는 보존되며 기한이 도래한 작업 목록 뒤에 추가 컨텍스트로 첨부됩니다.
    - 작업의 마지막 실행 타임스탬프는 세션 상태(`heartbeatTaskState`)에 저장되므로 일반적인 재시작 후에도 주기가 유지됩니다.
    - 작업 타임스탬프는 Heartbeat 실행이 정상 응답 경로를 완료한 후에만 갱신됩니다. 건너뛴 `empty-heartbeat-file` / `no-tasks-due` 실행은 작업을 완료로 표시하지 않습니다.

  </Accordion>
</AccordionGroup>

작업 모드는 매 틱마다 모든 작업의 비용을 지불하지 않으면서 하나의 Heartbeat 파일에 여러 주기적 확인을 포함하려는 경우 유용합니다.

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있습니까?

예. 요청하면 업데이트할 수 있습니다.

`HEARTBEAT.md`는 에이전트 작업 공간의 일반 파일이므로 일반 채팅에서 에이전트에게 다음과 같이 지시할 수 있습니다.

- "매일 캘린더를 확인하는 항목을 추가하도록 `HEARTBEAT.md`를 업데이트하십시오."
- "`HEARTBEAT.md`를 더 짧게 작성하고 받은 편지함 후속 조치에 집중하도록 수정하십시오."

이를 선제적으로 수행하려면 Heartbeat 프롬프트에 다음과 같은 명시적 문장을 포함할 수도 있습니다. "체크리스트가 오래되면 더 나은 내용으로 HEARTBEAT.md를 업데이트하십시오."

<Warning>
`HEARTBEAT.md`에 비밀 정보(API 키, 전화번호, 비공개 토큰)를 넣지 마십시오. 해당 파일은 프롬프트 컨텍스트의 일부가 됩니다.
</Warning>

## 수동 깨우기(요청 시)

`openclaw system event`를 사용하여 시스템 이벤트를 대기열에 넣고 선택적으로 Heartbeat를 즉시 트리거하십시오.

```bash
openclaw system event --text "긴급한 후속 조치 확인" --mode now
```

| 플래그                       | 설명                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--text <text>`              | 시스템 이벤트 텍스트(필수).                                                                       |
| `--mode <mode>`              | `now`는 Heartbeat를 즉시 실행하며, `next-heartbeat`(기본값)는 다음 예약된 틱까지 기다립니다.       |
| `--session-key <sessionKey>` | 이벤트의 특정 세션을 대상으로 지정합니다. 기본값은 에이전트의 기본 세션입니다.                    |
| `--json`                     | JSON을 출력합니다.                                                                                 |

`--session-key`를 지정하지 않았고 여러 에이전트에 `heartbeat`가 구성되어 있으면 `--mode now`는 해당 에이전트의 각 Heartbeat를 즉시 실행합니다.

동일한 CLI 그룹의 관련 Heartbeat 제어:

```bash
openclaw system heartbeat last     # 마지막 Heartbeat 이벤트 표시
openclaw system heartbeat enable   # Heartbeat 활성화
openclaw system heartbeat disable  # Heartbeat 비활성화
```

## 추론 전달(선택 사항)

기본적으로 Heartbeat는 최종 "답변" 페이로드만 전달합니다.

처리 과정을 투명하게 확인하려면 다음을 활성화하십시오.

- `agents.defaults.heartbeat.includeReasoning: true`

활성화하면 Heartbeat는 `Thinking` 접두사가 붙은 별도의 메시지도 전달합니다(`/reasoning on`과 동일한 형식). 에이전트가 여러 세션/codex를 관리할 때 왜 사용자에게 신호를 보내기로 결정했는지 확인하는 데 유용할 수 있지만, 원치 않는 내부 세부 정보까지 노출될 수도 있습니다. 그룹 채팅에서는 비활성화 상태를 유지하는 것이 좋습니다.

## 비용 고려 사항

Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 소비합니다. 비용을 줄이려면 다음을 수행하십시오.

- 전체 대화 기록을 전송하지 않으려면 `isolatedSession: true`를 사용하십시오(실행당 약 100K 토큰에서 약 2~5K 토큰으로 감소).
- 부트스트랩 파일을 `HEARTBEAT.md`로만 제한하려면 `lightContext: true`를 사용하십시오.
- 더 저렴한 `model`을 설정하십시오(예: `ollama/llama3.2:1b`).
- `HEARTBEAT.md`를 작게 유지하십시오.
- 내부 상태 업데이트만 필요한 경우 `target: "none"`을 사용하십시오.

## Heartbeat 이후 컨텍스트 초과

Heartbeat는 실행이 완료된 후에도 공유 세션의 기존 런타임 모델을 유지합니다. 따라서 세션을 더 작은 로컬 모델(예: 컨텍스트 창이 32k인 Ollama 모델)로 전환한 Heartbeat는 다음 기본 세션 턴에서도 해당 모델이 유지되게 할 수 있습니다. 이후 다음 턴에서 컨텍스트 초과가 보고되고 세션의 마지막 런타임 모델이 구성된 `heartbeat.model`과 일치하면, OpenClaw의 복구 메시지는 Heartbeat 모델 유입을 가능한 원인으로 지적하고 해결 방법을 제안합니다.

이를 방지하려면 `isolatedSession: true`를 사용하여 새 세션에서 Heartbeat를 실행하거나(가장 작은 프롬프트를 위해 선택적으로 `lightContext: true`와 함께 사용), 공유 세션에 충분히 큰 컨텍스트 창을 제공하는 Heartbeat 모델을 선택하십시오.

## 관련 항목

- [자동화](/ko/automation) - 모든 자동화 메커니즘을 한눈에 살펴봅니다
- [백그라운드 작업](/ko/automation/tasks) - 분리된 작업을 추적하는 방법입니다
- [시간대](/ko/concepts/timezone) - 시간대가 Heartbeat 예약에 미치는 영향입니다
- [문제 해결](/ko/automation/cron-jobs#troubleshooting) - 자동화 문제를 디버깅합니다
