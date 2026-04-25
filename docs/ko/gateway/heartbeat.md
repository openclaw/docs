---
read_when:
    - Heartbeat 주기 또는 메시지 조정하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
summary: Heartbeat 폴링 메시지 및 알림 규칙
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T06:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat와 Cron 중 무엇을 써야 하나요?** 각각 언제 써야 하는지는 [Automation & Tasks](/ko/automation)를 참조하세요.

Heartbeat는 **주기적인 에이전트 턴**을 메인 세션에서 실행하여,
너무 많은 메시지를 보내지 않으면서도 주의가 필요한 항목을 모델이 드러낼 수 있게 합니다.

Heartbeat는 예약된 메인 세션 턴입니다 — [background task](/ko/automation/tasks) 레코드를 만들지 **않습니다**.
작업 레코드는 분리된 작업(ACP 실행, subagent, 격리된 cron 작업)을 위한 것입니다.

문제 해결: [Scheduled Tasks](/ko/automation/cron-jobs#troubleshooting)

## 빠른 시작(초보자용)

1. Heartbeat를 활성화된 상태로 둡니다(기본값은 `30m`, Anthropic OAuth/token 인증에서는 `1h`, Claude CLI 재사용 포함) 또는 원하는 주기를 설정합니다.
2. 에이전트 워크스페이스에 작은 `HEARTBEAT.md` 체크리스트 또는 `tasks:` 블록을 만듭니다(선택 사항이지만 권장).
3. Heartbeat 메시지를 어디로 보낼지 결정합니다(`target: "none"`이 기본값이며, 마지막 연락처로 보내려면 `target: "last"`로 설정).
4. 선택 사항: 투명성을 위해 heartbeat reasoning 전달을 활성화합니다.
5. 선택 사항: heartbeat 실행에 `HEARTBEAT.md`만 필요하다면 경량 bootstrap 컨텍스트를 사용합니다.
6. 선택 사항: 매 heartbeat마다 전체 대화 기록을 보내지 않도록 격리 세션을 활성화합니다.
7. 선택 사항: heartbeat를 활성 시간(로컬 시간)으로 제한합니다.

예시 구성:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적으로 전달(기본값은 "none")
        directPolicy: "allow", // 기본값: direct/DM 대상 허용; 억제하려면 "block"으로 설정
        lightContext: true, // 선택 사항: bootstrap 파일에서 HEARTBEAT.md만 주입
        isolatedSession: true, // 선택 사항: 매 실행마다 새 세션 사용(대화 기록 없음)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택 사항: 별도의 `Reasoning:` 메시지도 전송
      },
    },
  },
}
```

## 기본값

- 간격: `30m`(또는 감지된 인증 모드가 Anthropic OAuth/token 인증인 경우 `1h`, Claude CLI 재사용 포함). `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`를 설정하세요. 비활성화하려면 `0m`을 사용합니다.
- 프롬프트 본문(`agents.defaults.heartbeat.prompt`로 구성 가능):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat 프롬프트는 사용자 메시지로 **그대로** 전송됩니다. 시스템
  프롬프트에는 기본 에이전트에 heartbeat가 활성화되어 있고
  실행이 내부적으로 표시된 경우에만 “Heartbeat” 섹션이 포함됩니다.
- heartbeat를 `0m`으로 비활성화하면, 일반 실행에서도 bootstrap 컨텍스트에서
  `HEARTBEAT.md`가 생략되어 모델이 heartbeat 전용 지침을 보지 않게 됩니다.
- 활성 시간(`heartbeat.activeHours`)은 구성된 timezone에서 검사됩니다.
  시간 범위 밖에서는, 다음 유효 시간대의 tick까지 heartbeat가 건너뜁니다.

## heartbeat 프롬프트의 용도

기본 프롬프트는 의도적으로 폭넓게 설계되어 있습니다.

- **백그라운드 작업**: “Consider outstanding tasks”는 에이전트가
  후속 작업(받은편지함, 캘린더, 리마인더, 대기 중 작업)을 검토하고 긴급한 항목을 드러내도록 유도합니다.
- **사람 확인**: “Checkup sometimes on your human during day time”은
  가벼운 “필요한 것 있나요?” 메시지를 가끔 보내도록 유도하지만, 구성된 로컬 timezone을 사용해
  야간 스팸은 피합니다([/concepts/timezone](/ko/concepts/timezone) 참조).

Heartbeat는 완료된 [background tasks](/ko/automation/tasks)에 반응할 수 있지만, heartbeat 실행 자체는 작업 레코드를 만들지 않습니다.

heartbeat가 매우 구체적인 작업(예: “check Gmail PubSub
stats” 또는 “verify gateway health”)을 하게 하려면, `agents.defaults.heartbeat.prompt`(또는
`agents.list[].heartbeat.prompt`)를 커스텀 본문(그대로 전송됨)으로 설정하세요.

## 응답 계약

- 주의가 필요한 것이 없으면 **`HEARTBEAT_OK`**로 응답합니다.
- heartbeat 실행 중에는, OpenClaw는 응답의 **시작 또는 끝**에
  `HEARTBEAT_OK`가 나타나면 이를 ack로 처리합니다. 남은 내용이 **`ackMaxChars` 이하**(기본값: 300)이면
  해당 토큰을 제거하고 응답을 버립니다.
- `HEARTBEAT_OK`가 응답의 **중간**에 나타나면 특별 취급하지 않습니다.
- 알림의 경우 **`HEARTBEAT_OK`를 포함하지 말고** 알림 텍스트만 반환하세요.

heartbeat 외부에서는, 메시지 시작/끝의 불필요한 `HEARTBEAT_OK`는 제거되어
로그에 기록되며, 메시지가 `HEARTBEAT_OK`뿐이면 버려집니다.

## 구성

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본값: 30m (0m이면 비활성화)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 기본값: false (가능할 때 별도 `Reasoning:` 메시지 전달)
        lightContext: false, // 기본값: false; true이면 워크스페이스 bootstrap 파일에서 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true이면 매 heartbeat를 새 세션에서 실행(대화 기록 없음)
        target: "last", // 기본값: none | 옵션: last | none | <channel id> (core 또는 Plugin, 예: "bluebubbles")
        to: "+15551234567", // 선택적 채널별 override
        accountId: "ops-bot", // 선택적 다중 계정 채널 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 뒤에 허용되는 최대 문자 수
      },
    },
  },
}
```

### 범위와 우선순위

- `agents.defaults.heartbeat`는 전역 heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`는 그 위에 병합됩니다. 어떤 에이전트든 `heartbeat` 블록이 있으면 **그 에이전트들만** heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 가시성 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 override합니다.
- `channels.<channel>.accounts.<id>.heartbeat`(다중 계정 채널)는 채널별 설정을 override합니다.

### 에이전트별 heartbeat

어떤 `agents.list[]` 항목이든 `heartbeat` 블록을 포함하면, **그 에이전트들만**
heartbeat를 실행합니다. 에이전트별 블록은 `agents.defaults.heartbeat`
위에 병합되므로(공유 기본값은 한 번 설정하고 에이전트별로 override 가능).

예시: 두 개의 에이전트 중 두 번째 에이전트만 heartbeat를 실행합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적으로 전달(기본값은 "none")
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

특정 timezone의 업무 시간으로 heartbeat를 제한합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적으로 전달(기본값은 "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 선택 사항; userTimezone이 설정되어 있으면 그것을, 아니면 호스트 timezone을 사용
        },
      },
    },
  },
}
```

이 시간 범위 밖(미 동부 기준 오전 9시 이전 또는 오후 10시 이후)에는 heartbeat가 건너뛰어집니다. 다음 유효 시간대의 예약 tick은 정상 실행됩니다.

### 24/7 설정

heartbeat를 하루 종일 실행하려면 다음 패턴 중 하나를 사용하세요.

- `activeHours`를 완전히 생략합니다(시간 제한 없음. 이것이 기본 동작).
- 하루 전체 시간대를 설정합니다: `activeHours: { start: "00:00", end: "24:00" }`.

같은 `start`와 `end` 시간(예: `08:00`에서 `08:00`)을 설정하지 마세요.
이는 폭이 0인 시간대로 처리되어 heartbeat가 항상 건너뛰어집니다.

### 다중 계정 예시

Telegram 같은 다중 계정 채널에서 특정 계정을 대상으로 하려면 `accountId`를 사용하세요.

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

- `every`: heartbeat 간격(duration 문자열; 기본 단위 = 분).
- `model`: heartbeat 실행용 선택적 모델 override(`provider/model`).
- `includeReasoning`: 활성화하면 가능할 때 별도의 `Reasoning:` 메시지도 전달합니다(`/reasoning on`과 동일한 형태).
- `lightContext`: true이면 heartbeat 실행은 경량 bootstrap 컨텍스트를 사용하고 워크스페이스 bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 heartbeat를 이전 대화 기록이 없는 새 세션에서 실행합니다. cron의 `sessionTarget: "isolated"`와 같은 격리 패턴을 사용합니다. heartbeat당 토큰 비용을 크게 줄입니다. 최대 절감을 위해 `lightContext: true`와 함께 사용하세요. 전달 라우팅은 여전히 메인 세션 컨텍스트를 사용합니다.
- `session`: heartbeat 실행에 사용할 선택적 세션 키.
  - `main`(기본값): 에이전트 메인 세션.
  - 명시적 세션 키(`openclaw sessions --json` 또는 [sessions CLI](/ko/cli/sessions)에서 복사).
  - 세션 키 형식: [Sessions](/ko/concepts/session) 및 [Groups](/ko/channels/groups) 참조.
- `target`:
  - `last`: 마지막으로 사용한 외부 채널로 전달.
  - 명시적 채널: 구성된 모든 채널 또는 Plugin id(예: `discord`, `matrix`, `telegram`, `whatsapp`).
  - `none`(기본값): heartbeat는 실행하지만 외부로는 **전달하지 않음**.
- `directPolicy`: direct/DM 전달 동작 제어:
  - `allow`(기본값): direct/DM heartbeat 전달 허용.
  - `block`: direct/DM 전달 억제(`reason=dm-blocked`).
- `to`: 선택적 수신자 override(채널별 id. 예: WhatsApp의 E.164 또는 Telegram chat id). Telegram topic/thread의 경우 `<chatId>:topic:<messageThreadId>`를 사용합니다.
- `accountId`: 다중 계정 채널용 선택적 계정 id. `target: "last"`일 때, 마지막으로 해석된 채널이 계정을 지원하면 해당 계정 id가 적용되고 그렇지 않으면 무시됩니다. 계정 id가 해석된 채널의 구성된 계정과 일치하지 않으면 전달이 건너뛰어집니다.
- `prompt`: 기본 프롬프트 본문을 override합니다(병합되지 않음).
- `ackMaxChars`: 전달 전에 `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수.
- `suppressToolErrorWarnings`: true이면 heartbeat 실행 중 tool error warning payload를 억제합니다.
- `activeHours`: heartbeat 실행을 시간 범위로 제한합니다. `start`(HH:MM, 포함; 하루 시작은 `00:00` 사용), `end`(HH:MM, 제외; 하루 끝은 `24:00` 허용), 선택적 `timezone`을 가진 객체입니다.
  - 생략 또는 `"user"`: `agents.defaults.userTimezone`이 설정되어 있으면 이를 사용하고, 없으면 호스트 시스템 timezone으로 fallback합니다.
  - `"local"`: 항상 호스트 시스템 timezone을 사용합니다.
  - IANA 식별자(예: `America/New_York`): 직접 사용하며, 유효하지 않으면 위의 `"user"` 동작으로 fallback합니다.
  - 유효 시간 범위를 위해 `start`와 `end`는 같아서는 안 됩니다. 같으면 폭이 0인 시간대(항상 범위 밖)로 처리됩니다.
  - 활성 시간 범위 밖에서는, 다음 범위 내 tick까지 heartbeat가 건너뛰어집니다.

## 전달 동작

- Heartbeat는 기본적으로 에이전트의 메인 세션(`agent:<id>:<mainKey>`)에서 실행되며,
  `session.scope = "global"`이면 `global`에서 실행됩니다. 특정 채널 세션(Discord/WhatsApp 등)으로
  override하려면 `session`을 설정하세요.
- `session`은 실행 컨텍스트에만 영향을 주며, 전달은 `target`과 `to`가 제어합니다.
- 특정 채널/수신자에게 전달하려면 `target` + `to`를 설정하세요.
  `target: "last"`이면 전달은 해당 세션의 마지막 외부 채널을 사용합니다.
- Heartbeat 전달은 기본적으로 direct/DM 대상을 허용합니다. direct 대상 전송을 억제하면서 heartbeat 턴은 계속 실행하려면 `directPolicy: "block"`을 설정하세요.
- 메인 큐가 바쁘면 heartbeat는 건너뛰고 나중에 다시 시도합니다.
- `target`이 외부 대상으로 해석되지 않으면, 실행은 계속되지만
  아웃바운드 메시지는 전송되지 않습니다.
- `showOk`, `showAlerts`, `useIndicator`가 모두 비활성화되면, 실행은 `reason=alerts-disabled`로 즉시 건너뜁니다.
- 알림 전달만 비활성화된 경우, OpenClaw는 여전히 heartbeat를 실행하고, due-task 타임스탬프를 업데이트하고, 세션 idle 타임스탬프를 복원하며, 외부 알림 payload는 억제할 수 있습니다.
- 해석된 heartbeat 대상이 입력 중 표시를 지원하면, OpenClaw는
  heartbeat 실행 중 입력 중 상태를 표시합니다. 이는 heartbeat가
  채팅 출력을 보낼 동일한 대상을 사용하며, `typingMode: "never"`이면 비활성화됩니다.
- Heartbeat 전용 응답은 세션을 활성 상태로 유지하지 않습니다. 마지막 `updatedAt`
  값이 복원되어 idle 만료가 정상적으로 동작합니다.
- Control UI와 WebChat 기록은 heartbeat 프롬프트와 OK만 있는
  확인 응답을 숨깁니다. 감사/재생을 위해 기본 세션 transcript에는 이러한
  턴이 여전히 포함될 수 있습니다.
- 분리된 [background tasks](/ko/automation/tasks)는 시스템 이벤트를 큐에 넣고 메인 세션이 무엇인가를 빨리 알아차려야 할 때 heartbeat를 깨울 수 있습니다. 이 wake는 heartbeat 실행을 background task로 만들지는 않습니다.

## 가시성 제어

기본적으로 `HEARTBEAT_OK` 확인 응답은 숨겨지고, 알림 내용은
전달됩니다. 이를 채널별 또는 계정별로 조정할 수 있습니다.

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK 숨김(기본값)
      showAlerts: true # 알림 메시지 표시(기본값)
      useIndicator: true # indicator 이벤트 발생(기본값)
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

### 각 플래그의 역할

- `showOk`: 모델이 OK 전용 응답을 반환할 때 `HEARTBEAT_OK` 확인 응답을 전송합니다.
- `showAlerts`: 모델이 non-OK 응답을 반환할 때 알림 내용을 전송합니다.
- `useIndicator`: UI 상태 표면용 indicator 이벤트를 발생시킵니다.

**세 값이 모두 false**이면, OpenClaw는 heartbeat 실행 전체를 건너뜁니다(모델 호출 없음).

### 채널별 vs 계정별 예시

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
          showAlerts: false # ops 계정에 대해서만 알림 억제
  telegram:
    heartbeat:
      showOk: true
```

### 일반적인 패턴

| 목표                                     | 구성                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| 기본 동작(조용한 OK, 알림 켜짐)          | _(구성 필요 없음)_                                                                         |
| 완전 무음(메시지 없음, indicator 없음)   | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }`  |
| indicator만 표시(메시지 없음)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`   |
| 한 채널에서만 OK 표시                    | `channels.telegram.heartbeat: { showOk: true }`                                            |

## HEARTBEAT.md (선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면, 기본 프롬프트는
에이전트에게 이를 읽으라고 지시합니다. 이를 “heartbeat 체크리스트”로 생각하세요: 작고, 안정적이며,
매 30분마다 포함해도 안전해야 합니다.

일반 실행에서는, 기본 에이전트에 heartbeat 지침이
활성화된 경우에만 `HEARTBEAT.md`가 주입됩니다. heartbeat 주기를 `0m`으로 비활성화하거나
`includeSystemPromptSection: false`를 설정하면 일반 bootstrap
컨텍스트에서 제외됩니다.

`HEARTBEAT.md`가 존재하지만 사실상 비어 있는 경우(빈 줄과
`# Heading` 같은 마크다운 헤더만 있는 경우), OpenClaw는 API 호출을 아끼기 위해 heartbeat 실행을 건너뜁니다.
이 건너뜀은 `reason=empty-heartbeat-file`로 보고됩니다.
파일이 없으면 heartbeat는 계속 실행되고 모델이 무엇을 할지 결정합니다.

프롬프트가 불필요하게 커지지 않도록 짧은 체크리스트 또는 리마인더처럼 작게 유지하세요.

예시 `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 블록

`HEARTBEAT.md`는 heartbeat 내부의 간격 기반
검사를 위한 작은 구조화된 `tasks:` 블록도 지원합니다.

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

동작:

- OpenClaw는 `tasks:` 블록을 파싱하고 각 작업을 자체 `interval`에 따라 검사합니다.
- 해당 tick에서 **기한이 된** 작업만 heartbeat 프롬프트에 포함됩니다.
- 기한이 된 작업이 없으면, 낭비되는 모델 호출을 피하기 위해 heartbeat 전체를 건너뜁니다(`reason=no-tasks-due`).
- `HEARTBEAT.md`의 작업 외 콘텐츠는 유지되며, 기한이 된 작업 목록 뒤에 추가 컨텍스트로 덧붙여집니다.
- 작업 마지막 실행 타임스탬프는 세션 상태(`heartbeatTaskState`)에 저장되므로, 일반적인 재시작 이후에도 간격이 유지됩니다.
- 작업 타임스탬프는 heartbeat 실행이 정상 응답 경로를 완료한 후에만 갱신됩니다. `empty-heartbeat-file` / `no-tasks-due`로 건너뛴 실행은 작업을 완료로 표시하지 않습니다.

작업 모드는 heartbeat 파일 하나에 여러 주기적 검사를 넣고, 매 tick마다 모두에 대한 비용을 지불하지 않으려는 경우 유용합니다.

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있나요?

예 — 그렇게 하라고 지시하면 됩니다.

`HEARTBEAT.md`는 에이전트 워크스페이스의 일반 파일이므로, 일반 채팅에서
에이전트에게 다음과 같이 말할 수 있습니다.

- “매일 캘린더 확인을 추가하도록 `HEARTBEAT.md`를 업데이트해.”
- “더 짧고 받은편지함 후속 작업에 집중되도록 `HEARTBEAT.md`를 다시 작성해.”

이 작업이 더 능동적으로 일어나길 원한다면 heartbeat 프롬프트에
“체크리스트가 오래되면 더 나은 것으로 HEARTBEAT.md를
업데이트하라” 같은 명시적 문장을 포함할 수도 있습니다.

안전 참고: `HEARTBEAT.md`에는 비밀 정보(API key, 전화번호, private token)를
넣지 마세요 — 이는 프롬프트 컨텍스트의 일부가 됩니다.

## 수동 깨우기(온디맨드)

시스템 이벤트를 큐에 넣고 즉시 heartbeat를 트리거하려면 다음을 사용하세요.

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

여러 에이전트에 `heartbeat`가 구성되어 있으면, 수동 wake는 해당
에이전트 heartbeat를 모두 즉시 실행합니다.

다음 예약 tick까지 기다리려면 `--mode next-heartbeat`를 사용하세요.

## Reasoning 전달(선택 사항)

기본적으로 heartbeat는 최종 “answer” payload만 전달합니다.

투명성을 원하면 다음을 활성화하세요.

- `agents.defaults.heartbeat.includeReasoning: true`

활성화되면 heartbeat는 접두사
`Reasoning:`가 붙은 별도 메시지도 전달합니다(`/reasoning on`과 동일한 형태). 이는 에이전트가
여러 세션/codex를 관리 중일 때 왜 당신에게 ping하기로 결정했는지 보고 싶을 때 유용할 수 있지만,
원하지 않는 내부 세부 정보가 더 많이 드러날 수도 있습니다. 그룹 채팅에서는
꺼 두는 편이 좋습니다.

## 비용 고려

Heartbeat는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 사용합니다. 비용을 줄이려면:

- 전체 대화 기록 전송을 피하려면 `isolatedSession: true`를 사용하세요(실행당 약 100K 토큰에서 약 2~5K로 감소).
- bootstrap 파일을 `HEARTBEAT.md`로만 제한하려면 `lightContext: true`를 사용하세요.
- 더 저렴한 `model`을 설정하세요(예: `ollama/llama3.2:1b`).
- `HEARTBEAT.md`를 작게 유지하세요.
- 내부 상태 업데이트만 원하면 `target: "none"`을 사용하세요.

## 관련 항목

- [Automation & Tasks](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Background Tasks](/ko/automation/tasks) — 분리된 작업이 어떻게 추적되는지
- [Timezone](/ko/concepts/timezone) — timezone이 heartbeat 예약에 미치는 영향
- [Troubleshooting](/ko/automation/cron-jobs#troubleshooting) — 자동화 문제 디버깅
