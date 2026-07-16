---
read_when:
    - Telegram 기능 또는 Webhook 작업하기
summary: Telegram 봇 지원 상태, 기능 및 구성
title: Telegram
x-i18n:
    generated_at: "2026-07-16T12:20:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

grammY를 통해 봇 DM 및 그룹에서 프로덕션용으로 사용할 수 있습니다. 기본 전송 방식은 롱 폴링이며, Webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴 및 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 봇 토큰 생성">
    두 절차 모두 OpenClaw에 붙여 넣을 토큰을 발급합니다. 다음 중 하나를 선택하십시오.

    - **채팅 절차**: Telegram을 열고 **@BotFather**와 채팅한 다음(핸들이 정확히 `@BotFather`인지 확인), `/newbot`을 실행하고 안내를 따라 토큰을 저장하십시오.
    - **웹 절차**: [BotFather 웹 앱](https://t.me/BotFather?startapp)을 여십시오. 이 앱은 [web.telegram.org](https://web.telegram.org)을 포함한 모든 Telegram 클라이언트에서 실행됩니다. UI에서 봇을 생성하고 토큰을 복사하십시오.

  </Step>

  <Step title="토큰 및 DM 정책 구성">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    환경 변수 대체 값: `TELEGRAM_BOT_TOKEN`(기본 계정에만 해당하며, 명명된 계정은 `botToken` 또는 `tokenFile`을 사용해야 합니다).
    Telegram은 `openclaw channels login telegram`을 사용하지 **않습니다**. 구성 또는 환경 변수에 토큰을 설정한 후 Gateway를 시작하십시오.

  </Step>

  <Step title="Gateway 시작 및 첫 번째 DM 승인">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    페어링 코드는 1시간 후 만료됩니다.

  </Step>

  <Step title="그룹에 봇 추가">
    그룹에 봇을 추가한 후, 그룹 접근에 필요한 다음 두 ID를 확인하십시오.

    - `allowFrom` / `groupAllowFrom`에 사용할 Telegram 사용자 ID
    - `channels.telegram.groups` 아래의 키로 사용할 Telegram 그룹 채팅 ID

    `openclaw logs --follow`, 전달된 메시지의 ID를 확인하는 봇 또는 Bot API의 `getUpdates`에서 그룹 채팅 ID를 확인하십시오. 그룹을 허용한 후에는 `/whoami@<bot_username>`으로 사용자 및 그룹 ID를 확인할 수 있습니다.

    `-100`로 시작하는 음수 슈퍼그룹 ID는 그룹 채팅 ID입니다. 이러한 ID는 `groupAllowFrom`가 아니라 `channels.telegram.groups` 아래에 입력합니다.

  </Step>
</Steps>

<Note>
토큰 확인은 계정을 인식합니다. 우선순위는 `tokenFile`, `botToken`, 환경 변수 순이며, 구성은 항상 `TELEGRAM_BOT_TOKEN`(기본 계정에서만 확인됨)보다 우선합니다. 성공적으로 시작한 후 OpenClaw는 봇 ID를 최대 24시간 캐시하므로 다시 시작할 때 추가 `getMe` 호출을 건너뜁니다. 토큰을 변경하거나 제거하면 해당 캐시가 삭제됩니다.
</Note>

## Telegram 측 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드 및 그룹 표시 범위">
    Telegram 봇은 기본적으로 **Privacy Mode**를 사용하며, 이 모드는 봇이 수신하는 그룹 메시지를 제한합니다.

    모든 그룹 메시지를 보려면 다음 중 하나를 수행하십시오.

    - `/setprivacy`에서 개인정보 보호 모드를 비활성화하거나
    - 봇을 그룹 관리자로 지정합니다.

    개인정보 보호 모드를 전환한 후에는 Telegram에서 변경 사항을 적용하도록 각 그룹에서 봇을 제거한 다음 다시 추가하십시오.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어합니다. 관리자 봇은 모든 그룹 메시지를 수신하므로 상시 작동하는 그룹 동작에 유용합니다.
  </Accordion>

  <Accordion title="유용한 BotFather 토글">

    - `/setjoingroups` — 그룹 추가 허용/거부
    - `/setprivacy` — 그룹 표시 범위 동작

    채팅 명령보다 UI를 선호하는 경우 [BotFather 웹 앱](https://t.me/BotFather?startapp)에서도 동일한 설정을 사용할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 대시보드 Mini App

봇과의 DM에서 `/dashboard`을 실행하여 Telegram 내에서 OpenClaw 대시보드를 여십시오.

요구 사항:

- 게시된 HTTPS Mini App URL에는 `gateway.tailscale.mode: "serve"` 또는 `"funnel"`이 필요합니다.
- 숫자로 된 Telegram 사용자 ID가 선택한 계정의 유효한 `allowFrom` 또는 `commands.ownerAllowFrom`에 포함되어 있어야 합니다.
- DM을 사용하십시오. 그룹에서 `/dashboard`은 `open this in a DM with the bot`으로 응답하며 버튼을 전송하지 않습니다.
- Docker 설치: Serve/Funnel 모드를 사용하려면 Gateway가 `tailscaled` 옆의 루프백에 바인딩되어야 하지만, 포트를 게시한 브리지 네트워킹으로는 이 조건을 충족할 수 없습니다. `network_mode: host`를 사용하여 Gateway 컨테이너를 실행하고 호스트의 `tailscaled` 소켓(`/var/run/tailscale`)과 `tailscale` CLI를 컨테이너에 마운트하십시오.

Mini App은 Tailscale 전용 v1 경로이며 Telegram Web iframe을 지원하지 않습니다.

## 접근 제어 및 활성화

### 그룹 봇 ID

그룹 및 포럼 주제에서 설정된 봇 핸들(예: `@my_bot`)을 명시적으로 멘션하면 에이전트 페르소나 이름이 Telegram 사용자 이름과 다르더라도 선택된 OpenClaw 에이전트에게 전달됩니다. 관련 없는 트래픽에는 그룹 무응답 정책이 계속 적용되지만, 봇 핸들 자체는 절대 "다른 사람"으로 취급되지 않습니다.

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`은(는) 다이렉트 메시지 접근을 제어합니다.

    - `pairing` (기본값)
    - `allowlist` (`allowFrom`에 발신자 ID가 하나 이상 있어야 함)
    - `open` (`allowFrom`에 `"*"`이 포함되어야 함)
    - `disabled`

    `allowFrom: ["*"]`와 함께 `dmPolicy: "open"`을(를) 사용하면 봇 사용자 이름을 찾거나 추측한 모든 Telegram 계정이 봇에 명령을 내릴 수 있습니다. 도구가 엄격히 제한된 의도적으로 공개된 봇에만 사용하십시오. 소유자가 한 명인 봇은 숫자 사용자 ID와 함께 `allowlist`을(를) 사용해야 합니다.

    `channels.telegram.allowFrom`은(는) 숫자 Telegram 사용자 ID를 허용합니다. `telegram:` / `tg:` 접두사가 허용되며 정규화됩니다.
    다중 계정 구성에서 제한적인 최상위 `channels.telegram.allowFrom`은(는) 안전 경계입니다. 병합된 유효 허용 목록에 명시적 와일드카드가 계속 포함되어 있지 않으면 계정 수준의 `allowFrom: ["*"]`만으로 해당 계정이 공개되지 않습니다.
    `allowFrom`이 비어 있는 `dmPolicy: "allowlist"`은(는) 모든 DM을 차단하며 구성 검증에서 거부됩니다.
    설정에서는 숫자 사용자 ID만 요청합니다. 이전 설정에서 생성된 `@username` 허용 목록 항목이 구성에 있다면 `openclaw doctor --fix`을(를) 실행하여 숫자 ID로 변환하십시오(최선형 처리이며 Telegram 봇 토큰이 필요함).
    이전에 페어링 저장소 허용 목록 파일에 의존했다면 `openclaw doctor --fix`이(가) 허용 목록 흐름을 위해 항목을 `channels.telegram.allowFrom`에 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없는 경우).

    소유자가 한 명인 봇에서는 이전 페어링 승인에 의존하는 대신 명시적인 숫자 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`을(를) 사용하는 것이 좋습니다.

    흔히 혼동하는 점: DM 페어링 승인은 "이 발신자가 모든 곳에서 승인되었다"는 의미가 아닙니다. 페어링은 DM 접근 권한만 부여합니다. 아직 명령 소유자가 없는 경우 처음 승인된 페어링은 `commands.ownerAllowFrom`도 설정하여 소유자 전용 명령과 실행 승인에 명시적인 운영자 계정을 지정합니다. 그룹 발신자 승인은 여전히 명시적인 구성 허용 목록에서 결정됩니다.
    하나의 ID로 DM과 그룹 명령 모두에 대한 승인을 받으려면 숫자 Telegram 사용자 ID를 `channels.telegram.allowFrom`에 넣고, 소유자 전용 명령의 경우 `commands.ownerAllowFrom`에 `telegram:<your user id>`이 포함되어 있는지 확인하십시오.

    ### Telegram 사용자 ID 찾기

    더 안전한 방법(서드파티 봇 없음): 봇에 DM을 보내고 `openclaw logs --follow`을(를) 실행한 다음 `from.id`을(를) 확인하십시오.

    공식 Bot API 방법:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    서드파티 방법(개인정보 보호 수준이 낮음): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책 및 허용 목록">
    다음 두 제어가 함께 적용됩니다.

    1. **허용되는 그룹** (`channels.telegram.groups`)
       - `groups` 구성이 없고 `groupPolicy: "open"`인 경우: 모든 그룹이 그룹 ID 검사를 통과함
       - `groups` 구성이 없고 `groupPolicy: "allowlist"`인 경우(기본값): `groups` 항목(또는 `"*"`)을 추가할 때까지 모든 그룹이 차단됨
       - `groups`이 구성된 경우: 허용 목록으로 작동함(명시적 ID 또는 `"*"`)

    2. **그룹에서 허용되는 발신자** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (기본값) / `disabled`

    `groupAllowFrom`은(는) 그룹 발신자를 필터링합니다. 설정되지 않은 경우 Telegram은 `allowFrom`로 대체합니다(페어링 저장소가 아님 — 그룹 발신자 인증은 DM 페어링 저장소 승인을 절대 상속하지 않으며, 이는 `2026.2.25` 이후의 보안 경계임).
    `groupAllowFrom` 항목은 숫자 Telegram 사용자 ID여야 합니다(`telegram:` / `tg:` 접두사는 정규화됨). 숫자가 아닌 항목은 무시됩니다. 그룹 또는 슈퍼그룹 채팅 ID를 여기에 넣지 마십시오. 음수 채팅 ID는 `channels.telegram.groups` 아래에 있어야 합니다.
    소유자가 한 명인 봇의 실용적인 패턴: 사용자 ID를 `channels.telegram.allowFrom`에 설정하고 `groupAllowFrom`은(는) 설정하지 않은 채 대상 그룹을 `channels.telegram.groups` 아래에서 허용하십시오.
    `channels.telegram`이 구성에 전혀 없으면 `channels.defaults.groupPolicy`이 명시적으로 설정되지 않는 한 런타임은 차단 우선 방식의 `groupPolicy="allowlist"`을(를) 기본값으로 사용합니다.

    소유자 전용 그룹 설정:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    그룹에서 `@<bot_username> ping`을(를) 사용하여 테스트하십시오. `requireMention: true`인 동안 일반 그룹 메시지는 봇을 트리거하지 않습니다.

    특정 그룹 하나의 모든 구성원 허용:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    특정 그룹 하나에서 지정된 사용자만 허용:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      흔한 실수: `groupAllowFrom`은(는) 그룹 허용 목록이 아닙니다.

      - 음수 Telegram 그룹/슈퍼그룹 채팅 ID(`-1001234567890`)는 `channels.telegram.groups` 아래에 둡니다.
      - Telegram 사용자 ID(`8734062810`)는 허용된 그룹 내에서 봇을 트리거할 수 있는 사람을 제한하도록 `groupAllowFrom` 아래에 둡니다.
      - 허용된 그룹의 모든 구성원이 봇과 대화할 수 있게 하려는 경우에만 `groupAllowFrom: ["*"]`을(를) 사용하십시오.

    </Warning>

  </Tab>

  <Tab title="멘션 동작">
    그룹 답변에는 기본적으로 멘션이 필요합니다. 멘션은 다음에서 올 수 있습니다.

    - 네이티브 `@botusername` 멘션 또는
    - `agents.list[].groupChat.mentionPatterns` 또는 `messages.groupChat.mentionPatterns`의 멘션 패턴

    세션 수준 토글(상태에만 적용되며 영구 저장되지 않음): `/activation always`, `/activation mention`. 영구 적용하려면 구성을 사용하십시오.

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    그룹 기록 컨텍스트는 항상 활성화되며 `historyLimit`에 의해 제한됩니다. 그룹 기록 창을 비활성화하려면 `channels.telegram.historyLimit: 0`을(를) 설정하십시오. `openclaw doctor --fix`은(는) 폐기된 `includeGroupHistoryContext` 키를 제거합니다.

    그룹 채팅 ID 확인: 그룹 메시지를 `@userinfobot` / `@getidsbot`에 전달하고 `openclaw logs --follow`에서 `chat.id`을(를) 확인하거나, Bot API의 `getUpdates`을(를) 검사하거나, 그룹이 허용된 후 `/whoami@<bot_username>`을(를) 실행하십시오.

  </Tab>
</Tabs>

## 런타임 동작

- Telegram은 Gateway 프로세스 내에서 실행됩니다.
- 라우팅은 결정적입니다. Telegram에서 수신한 메시지에 대한 답장은 Telegram으로 전송됩니다(모델이 채널을 선택하지 않습니다).
- 수신 메시지는 답장 메타데이터, 미디어 자리표시자, 그리고 Gateway가 관찰한 답장에 대해 영구 저장된 답장 체인 컨텍스트가 포함된 공유 채널 봉투로 정규화됩니다.
- 그룹 세션은 그룹 ID별로 격리됩니다. 포럼 주제에는 `:topic:<threadId>`이(가) 추가됩니다.
- DM 메시지에는 `message_thread_id`이(가) 포함될 수 있으며, OpenClaw는 답장을 위해 이를 보존합니다. DM 주제 세션은 Telegram `getMe`이(가) 봇에 대해 `has_topics_enabled: true`을(를) 보고하는 경우에만 분리되며, 그렇지 않으면 DM은 단일 계층 세션으로 유지됩니다.
- 롱 폴링은 채팅별/스레드별 순서 지정과 함께 grammY 러너를 사용합니다. 러너 싱크 동시성은 `agents.defaults.maxConcurrent`을(를) 사용합니다.
- 다중 계정 시작 시 동시 `getMe` 프로브 수를 제한하므로, 대규모 봇 집합에서 모든 계정 프로브가 한꺼번에 확산되지 않습니다.
- 각 Gateway 프로세스는 한 번에 하나의 활성 폴러만 봇 토큰을 사용할 수 있도록 롱 폴링을 보호합니다. 지속적인 `getUpdates` 409 충돌은 동일한 토큰을 사용하는 다른 OpenClaw Gateway, 스크립트 또는 외부 폴러가 있음을 나타냅니다.
- 폴링 감시자는 기본적으로 완료된 `getUpdates` 활성 확인 없이 120초가 지나면 다시 시작합니다. 장시간 실행 작업 중 배포 환경에서 잘못된 폴링 중단 재시작이 발생하는 경우에만 `channels.telegram.pollingStallThresholdMs`(30000-600000, 계정별 재정의 지원)을 늘리십시오.
- Telegram Bot API는 읽음 확인을 지원하지 않습니다(`sendReadReceipts`은(는) 적용되지 않습니다).

<Note>
  `channels.telegram.dm.threadReplies` 및 `channels.telegram.direct.<chatId>.threadReplies`은(는) 제거되었습니다. 구성에 해당 키가 아직 있으면 업그레이드 후 `openclaw doctor --fix`을(를) 실행하십시오. 이제 DM 주제 라우팅은 Telegram `getMe.has_topics_enabled`(BotFather의 스레드 모드로 제어됨)을 따릅니다. 주제가 활성화된 봇은 Telegram이 `message_thread_id`을(를) 전송할 때 스레드 범위 DM 세션을 사용하며, 그 외의 DM은 단일 계층 세션으로 유지됩니다.
</Note>

## 기능 참조

<AccordionGroup>
  <Accordion title="실시간 스트림 미리보기(메시지 편집)">
    OpenClaw는 다이렉트 채팅, 그룹 및 주제에서 부분 답장을 실시간으로 스트리밍합니다. 미리보기 메시지를 보낸 다음 `editMessageText`을(를) 반복적으로 수행하고, 같은 위치에서 완료합니다.

    - `channels.telegram.streaming`은(는) `off | partial | block | progress`입니다(기본값: `partial`)
    - 짧은 초기 답변 미리보기는 디바운스된 후, 실행이 아직 활성 상태이면 제한된 지연 시간 뒤에 구체화됩니다
    - `progress`은(는) 도구 진행 상황을 위한 편집 가능한 상태 초안 하나를 유지하고, 도구 진행 전에 답변 활동이 도착하면 안정적인 상태 레이블을 표시하며, 완료 시 이를 지우고 최종 답변을 일반 메시지로 전송합니다
    - `streaming.preview.toolProgress`은(는) 도구/진행 상황 업데이트가 편집된 동일한 미리보기 메시지를 재사용할지 제어합니다(기본값: 미리보기 스트리밍이 활성 상태일 때 `true`)
    - `streaming.preview.commandText`은(는) 해당 줄 내부의 명령/실행 세부 정보를 제어합니다. `raw`(기본값) 또는 `status`(도구 레이블만)을 사용할 수 있습니다
    - `streaming.progress.commentary`(기본값: `false`)은(는) 임시 진행 상황 초안에 어시스턴트 해설/서문 텍스트를 포함하도록 선택합니다
    - 레거시 `channels.telegram.streamMode`, 불리언 `streaming` 값 및 폐기된 네이티브 초안 미리보기 키가 감지됩니다. 마이그레이션하려면 `openclaw doctor --fix`을(를) 실행하십시오

    도구 진행 상황 줄은 도구가 실행되는 동안 표시되는 짧은 상태 업데이트입니다(명령 실행, 파일 읽기, 계획 업데이트, 패치 요약, 앱 서버 모드의 Codex 서문/해설). Telegram에서는 기본적으로 이 기능이 켜져 있습니다(`v2026.4.22`+부터 릴리스된 동작과 일치).

    답변 미리보기 편집은 유지하되 도구 진행 상황 줄은 숨기려면 다음과 같이 설정하십시오.

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    도구 진행 상황은 표시하되 명령/실행 텍스트는 숨기려면 다음과 같이 설정하십시오.

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` 모드는 최종 답변을 해당 메시지에 편집해 넣지 않고 도구 진행 상황을 표시합니다. 명령 텍스트 정책은 `streaming.progress` 아래에 배치하십시오.

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"`은(는) 미리보기 편집을 비활성화하고 일반적인 도구/진행 상황 메시지를 독립적인 상태 메시지로 전송하는 대신 표시하지 않습니다. 승인 프롬프트, 미디어 및 오류는 계속 일반적인 최종 전송 경로를 따릅니다. `streaming.preview.toolProgress: false`은(는) 답변 미리보기 편집만 유지합니다.

    <Note>
      선택한 인용문에 대한 답장은 예외입니다. `replyToMode`이(가) `first`, `all` 또는 `batched`이고 수신 메시지에 선택된 인용문 텍스트가 있으면, OpenClaw는 답변 미리보기를 편집하는 대신 Telegram의 네이티브 인용 답장 경로를 통해 최종 답변을 전송하므로 해당 차례에는 `streaming.preview.toolProgress`에 상태 줄을 표시할 수 없습니다. 선택된 인용문 텍스트가 없는 현재 메시지 답장은 계속 스트리밍됩니다. 네이티브 인용 답장보다 도구 진행 상황 표시가 더 중요하면 `replyToMode: "off"`을(를) 설정하고, 이러한 절충을 허용하려면 `streaming.preview.toolProgress: false`을(를) 설정하십시오.
    </Note>

    텍스트 전용 답장의 경우 짧은 미리보기는 같은 위치에서 최종 편집을 받습니다. 여러 메시지로 분할되는 긴 최종 답변은 미리보기를 첫 번째 청크로 재사용한 후 나머지만 전송합니다. 진행 상황 모드의 최종 답변은 상태 초안을 지우고 일반적인 최종 전송을 사용합니다. 완료가 확인되기 전에 최종 편집이 실패하면 OpenClaw는 일반적인 최종 전송으로 대체하고 오래된 미리보기를 정리합니다. 복잡한 답장(미디어 페이로드)의 경우 OpenClaw는 항상 일반적인 최종 전송으로 대체하고 미리보기를 정리합니다.

    미리보기 스트리밍과 블록 스트리밍은 상호 배타적입니다. 블록 스트리밍이 명시적으로 활성화되면 OpenClaw는 이중 스트리밍을 방지하기 위해 미리보기 스트림을 건너뜁니다.

    추론: `/reasoning stream`은(는) 생성 중 추론을 실시간 미리보기에 스트리밍한 다음 최종 전송 후 추론 미리보기를 삭제합니다(계속 표시하려면 `/reasoning on`을(를) 사용하십시오). 최종 답변은 추론 텍스트 없이 전송됩니다.

  </Accordion>

  <Accordion title="서식 있는 메시지">
    발신 텍스트는 기본적으로 현재 클라이언트 전반에서 읽을 수 있는 표준 Telegram HTML 메시지를 사용합니다. 굵게, 기울임꼴, 링크, 코드, 스포일러, 인용문을 지원하며, Bot API 10.2의 서식 전용 블록(네이티브 표, 세부 정보, 리치 미디어, 수식)은 사용하지 않습니다.

    Bot API 10.2 서식 있는 메시지를 사용하려면 다음과 같이 설정하십시오.

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    활성화하면 에이전트에 이 봇/계정에서 서식 있는 메시지를 사용할 수 있다는 정보가 제공됩니다(지원되는 Markdown + HTML 아일랜드 작성 계약 포함). Markdown 텍스트는 OpenClaw의 Markdown IR을 거쳐 형식화된 Bot API 10.2 서식 블록(제목, 표, 세부 정보, 체크리스트, 리치 미디어, 수식, 지도, 콜라주)으로 렌더링됩니다. 미디어 캡션은 계속 Telegram HTML 캡션을 사용합니다(서식 있는 메시지는 캡션을 대체하지 않으며, 캡션은 1024자로 제한됩니다).

    이렇게 하면 모델 텍스트가 Telegram의 리치 Markdown 기호와 분리되므로 `$400-600K` 같은 통화가 수식으로 파싱되지 않습니다. 긴 서식 있는 텍스트는 Telegram 제한에 맞춰 자동으로 분할됩니다. 열이 20개를 초과하는 표는 코드 블록으로 대체됩니다.

    기본값은 클라이언트 호환성을 위해 꺼짐입니다. 현재 일부 Desktop, Web, Android 및 서드 파티 클라이언트에서는 수락된 서식 있는 메시지가 지원되지 않는 것으로 렌더링됩니다. 봇과 함께 사용하는 모든 클라이언트가 이를 렌더링할 수 있는 경우에만 활성화하십시오. `/status`은(는) 현재 세션에서 서식 있는 메시지가 켜져 있는지 꺼져 있는지 보여 줍니다.

    링크 미리보기는 기본적으로 켜져 있습니다. `channels.telegram.linkPreview: false`은(는) 서식 있는 텍스트의 자동 엔터티 감지를 비활성화합니다.

  </Accordion>

  <Accordion title="네이티브 명령 및 사용자 지정 명령">
    Telegram의 명령 메뉴는 시작 시 `setMyCommands`을(를) 사용하여 등록됩니다. `commands.native: "auto"`은(는) Telegram의 네이티브 명령을 활성화합니다.

    사용자 지정 명령 메뉴 항목을 추가하려면 다음과 같이 설정하십시오.

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 백업" },
        { command: "generate", description: "이미지 생성" },
      ],
    },
  },
}
```

    규칙: 이름은 정규화됩니다(선행 `/` 제거, 소문자 변환). 유효한 패턴은 `a-z`, `0-9`, `_`이며 길이는 1-32입니다. 사용자 지정 명령은 네이티브 명령을 재정의할 수 없습니다. 충돌/중복 항목은 건너뛰고 로그에 기록됩니다.

    사용자 지정 명령은 메뉴 항목일 뿐이며 동작을 자동으로 구현하지 않습니다. Plugin/skill 명령은 Telegram 메뉴에 표시되지 않아도 직접 입력하면 계속 작동할 수 있습니다. 네이티브 명령을 비활성화하면 기본 제공 명령이 제거되며, 구성된 경우 사용자 지정/Plugin 명령은 계속 등록될 수 있습니다.

    일반적인 설정 실패:

    - 자르기 재시도 후 `BOT_COMMANDS_TOO_MUCH`과(와) 함께 `setMyCommands failed`이(가) 표시되면 메뉴가 여전히 한도를 초과한 것입니다. Plugin/skill/사용자 지정 명령 수를 줄이거나 `channels.telegram.commands.native`을(를) 비활성화하십시오.
    - 직접 실행한 Bot API curl 명령은 작동하지만 `deleteWebhook`, `deleteMyCommands` 또는 `setMyCommands`이(가) `404: Not Found` 오류로 실패하는 경우, 일반적으로 `channels.telegram.apiRoot`이(가) 전체 `/bot<TOKEN>` 엔드포인트로 설정된 것입니다. `apiRoot`은(는) Bot API 루트만 가리켜야 합니다. `openclaw doctor --fix`은(는) 실수로 추가된 후행 `/bot<TOKEN>`을(를) 제거합니다.
    - `getMe returned 401`은(는) Telegram이 구성된 봇 토큰을 거부했음을 의미합니다. `botToken`, `tokenFile` 또는 `TELEGRAM_BOT_TOKEN`(기본 계정)을 현재 BotFather 토큰으로 업데이트하십시오. OpenClaw는 폴링 전에 중지되므로 이 문제는 Webhook 정리 실패로 보고되지 않습니다.
    - 네트워크/가져오기 오류와 함께 `setMyCommands failed`이(가) 표시되면 일반적으로 `api.telegram.org`으로 향하는 발신 DNS/HTTPS가 차단된 것입니다.

    ### 기기 페어링 명령(`device-pair` Plugin)

    설치된 경우:

    1. `/pair`은(는) 설정 코드를 생성합니다
    2. iOS 앱에 코드를 붙여넣습니다
    3. `/pair pending`은(는) 대기 중인 요청을 나열합니다(역할/범위 포함)
    4. 승인: `/pair approve <requestId>`, `/pair approve`(대기 중인 요청이 하나뿐인 경우) 또는 `/pair approve latest`

    기기가 변경된 인증 세부 정보(역할, 범위, 공개 키)로 다시 시도하면 이전 대기 요청은 새 `requestId`에 의해 대체됩니다. 승인하기 전에 `/pair pending`을(를) 다시 실행하십시오.

    자세한 내용은 [페어링](/ko/channels/pairing#pair-via-telegram)을 참조하십시오.

  </Accordion>

  <Accordion title="인라인 버튼">
    인라인 키보드 범위를 구성하십시오.

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    계정별 재정의:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    범위: `off`, `dm`, `group`, `all`, `allowlist`(기본값). 레거시 `capabilities: ["inlineButtons"]`은(는) `"all"`에 매핑됩니다.

    메시지 작업 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "옵션을 선택하십시오:",
  buttons: [
    [
      { text: "예", callback_data: "yes" },
      { text: "아니요", callback_data: "no" },
    ],
    [{ text: "취소", callback_data: "cancel" }],
  ],
}
```

    미니 앱 버튼 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "앱 열기:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "실행", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` 버튼은 사용자와 봇 간의 비공개 채팅에서만 작동합니다.

    등록된 Plugin 대화형 핸들러가 처리하지 않은 콜백 클릭은 에이전트에 텍스트로 전달됩니다: `callback_data: <value>`.

  </Accordion>

  <Accordion title="에이전트 및 자동화를 위한 Telegram 메시지 작업">
    작업:

    - `sendMessage` (`to`, `content`, 선택 사항 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` 또는 `caption`, 선택 사항인 `presentation` 인라인 버튼; 버튼만 편집하면 답장 마크업이 업데이트됨)
    - `createForumTopic` (`chatId`, `name`, 선택 사항 `iconColor`, `iconCustomEmojiId`)

    편의용 별칭: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    게이팅: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (기본값: 비활성화). `edit`, `createForumTopic`, `editForumTopic`은 별도의 토글 없이 기본적으로 활성화됩니다.
    런타임 전송은 시작/다시 로드 시점의 활성 구성/보안 비밀 스냅샷을 사용하므로, 작업 경로는 전송할 때마다 `SecretRef` 값을 다시 확인하지 않습니다.

    반응 제거 의미 체계: [/tools/reactions](/ko/tools/reactions).

  </Accordion>

  <Accordion title="답장 스레딩 태그">
    생성된 출력의 명시적 답장 스레딩 태그:

    - `[[reply_to_current]]` — 트리거한 메시지에 답장함
    - `[[reply_to:<id>]]` — 특정 메시지 ID에 답장함

    `channels.telegram.replyToMode`: `off` (기본값), `first`, `all`.

    답장 스레딩이 활성화되어 있고 원본 텍스트/캡션을 사용할 수 있으면 OpenClaw가 기본 인용문 발췌를 자동으로 추가합니다. Telegram은 기본 인용문 텍스트를 1024 UTF-16 코드 단위로 제한합니다. 더 긴 메시지는 시작 부분부터 인용하며, Telegram이 인용을 거부하면 일반 답장으로 대체됩니다.

    `off`은 암시적 답장 스레딩만 비활성화하며, 명시적 `[[reply_to_*]]` 태그는 계속 적용됩니다.

  </Accordion>

  <Accordion title="포럼 주제 및 스레드 동작">
    포럼 슈퍼그룹: 주제 세션 키에 `:topic:<threadId>`이 추가됩니다. 답장과 입력 중 표시는 주제 스레드를 대상으로 하며, 주제 구성 경로는 `channels.telegram.groups.<chatId>.topics.<threadId>`입니다.

    일반 주제(`threadId=1`)는 특별한 경우입니다. 메시지 전송 시 `message_thread_id`을 생략하지만(Telegram은 `sendMessage(...thread_id=1)`을 "thread not found" 오류로 거부함), 입력 중 표시가 나타나려면 경험상 필요하므로 입력 작업에는 계속 `message_thread_id`을 포함합니다.

    주제 항목은 재정의되지 않는 한 그룹 설정을 상속합니다(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId`은 주제 전용이며 그룹 기본값에서 상속되지 않습니다. `topics."*"`은 해당 그룹의 모든 주제에 대한 기본값을 설정하며, 정확한 주제 ID는 여전히 `"*"`보다 우선합니다.

    **주제별 에이전트 라우팅**: 각 주제는 주제 구성의 `agentId`을 통해 서로 다른 에이전트로 라우팅할 수 있으며, 각 에이전트에는 자체 작업 공간, 메모리, 세션이 제공됩니다.

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 일반 주제 -> 기본 에이전트
                "3": { agentId: "zu" },        // 개발 주제 -> zu 에이전트
                "5": { agentId: "coder" }      // 코드 검토 -> coder 에이전트
              }
            }
          }
        }
      }
    }
    ```

    그러면 각 주제에는 자체 세션 키가 지정됩니다(예: `agent:zu:telegram:group:-1001234567890:topic:3`).

    **영구 ACP 주제 바인딩**: 포럼 주제는 최상위 수준의 형식화된 바인딩(`bindings[]`, `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` 및 `-1001234567890:topic:42`과 같은 주제 한정 ID 사용)을 통해 ACP 하네스 세션을 고정할 수 있습니다. 현재 그룹/슈퍼그룹의 포럼 주제로 범위가 제한됩니다. [ACP 에이전트](/ko/tools/acp-agents)를 참조하십시오.

    **채팅에서 스레드에 바인딩된 ACP 생성**: `/acp spawn <agent> --thread here|auto`은 현재 주제를 새 ACP 세션에 바인딩합니다. 후속 메시지는 해당 세션으로 직접 라우팅되며 OpenClaw는 생성 확인 메시지를 주제 내에 고정합니다. `channels.telegram.threadBindings.spawnSessions`이 필요합니다(기본값: `true`).

    템플릿 컨텍스트는 `MessageThreadId` 및 `IsForum`을 노출합니다. `message_thread_id`이 있는 DM 채팅은 답장 메타데이터를 유지하지만, Telegram `getMe`이 `has_topics_enabled: true`을 보고하는 경우에만 스레드 인식 세션 키를 사용합니다.
    폐기된 `dm.threadReplies` 및 `direct.*.threadReplies` 재정의는 제거되었습니다. BotFather 스레드 모드가 유일한 진실 공급원입니다. 오래된 구성 키를 제거하려면 `openclaw doctor --fix`을 실행하십시오.

  </Accordion>

  <Accordion title="오디오, 비디오 및 스티커">
    ### 오디오 메시지

    Telegram은 음성 메모와 오디오 파일을 구분합니다. 기본값은 오디오 파일 동작입니다. 에이전트 답장에 `[[audio_as_voice]]` 태그를 지정하면 음성 메모로 강제 전송됩니다. 수신 음성 메모의 변환문은 에이전트 컨텍스트에서 기계가 생성한 신뢰할 수 없는 텍스트로 처리되지만, 멘션 감지는 계속 원시 변환문을 사용하므로 멘션으로 제한된 음성 메시지가 계속 작동합니다.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 비디오 메시지

    Telegram은 비디오 파일과 비디오 메모를 구분합니다. 비디오 메모는 캡션을 지원하지 않으며, 제공된 메시지 텍스트는 별도로 전송됩니다.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 위치 및 장소

    하나의 독립형 `location` 객체와 함께 기존 `send` 작업을 사용하십시오. 좌표는 기본 위치 핀을 전송하며, `name` 및 `address`을 모두 추가하면 기본 장소 카드가 전송됩니다. 위치 전송은 메시지 텍스트 또는 미디어와 결합할 수 없습니다.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### 스티커

    수신: 정적 WEBP는 다운로드하여 처리하고(자리표시자 `<media:sticker>`), 애니메이션 TGS 및 비디오 WEBM은 건너뜁니다.

    스티커 컨텍스트 필드: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. 반복되는 비전 호출을 줄이기 위해 설명은 OpenClaw SQLite Plugin 상태에 캐시됩니다.

    스티커 작업을 활성화합니다.

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    전송:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    캐시된 스티커 검색:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="반응 알림">
    Telegram 반응은 메시지 페이로드와 별도로 `message_reaction` 업데이트로 수신됩니다. 활성화하면 OpenClaw가 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 같은 시스템 이벤트를 대기열에 추가합니다.

    - `channels.telegram.reactionNotifications`: `off | own | all` (기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (기본값: `minimal`)

    `own`은 봇이 보낸 메시지에 대한 사용자 반응만을 의미합니다(전송 메시지 캐시를 통해 최선형으로 처리). 반응 이벤트에도 Telegram 접근 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)가 계속 적용되며, 권한이 없는 발신자는 삭제됩니다.

    Telegram은 반응 업데이트에 스레드 ID를 제공하지 않습니다. 포럼이 아닌 그룹은 그룹 채팅 세션으로 라우팅되고, 포럼 그룹은 정확한 원래 주제가 아니라 일반 주제 세션(`:topic:1`)으로 라우팅됩니다.

    폴링/Webhook용 `allowed_updates`에는 `message_reaction`이 자동으로 포함됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 전송합니다. `messages.ackReactionScope`은 전송 *시점*을 결정합니다.

    **이모지 결정 순서:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 대체값(`agents.list[].identity.emoji`, 없으면 "👀")

    Telegram에는 유니코드 이모지(예: "👀")가 필요합니다. 채널 또는 계정에서 반응을 비활성화하려면 `""`을 사용하십시오.

    **범위(`messages.ackReactionScope`, 기본값 `"group-mentions"`; 현재 Telegram 계정 또는 Telegram 채널 재정의 없음):**

    `all`(DM + 주변 방 이벤트를 포함한 그룹), `direct`(DM만), `group-all`(주변 방 이벤트를 제외한 모든 그룹 메시지, DM 제외), `group-mentions`(봇이 멘션된 그룹, **DM 제외** — 기본값), `off` / `none`(비활성화).

    <Note>
    기본 범위(`group-mentions`)에서는 DM 또는 주변 방 이벤트에 확인 반응을 보내지 않습니다. DM에는 `direct` 또는 `all`을 사용하십시오. 주변 방 이벤트를 확인하는 값은 `all`뿐입니다. 이 값은 Telegram 공급자 시작 시 읽히므로 변경 사항을 적용하려면 Gateway를 다시 시작해야 합니다.
    </Note>

  </Accordion>

  <Accordion title="Telegram 이벤트 및 명령을 통한 구성 쓰기">
    채널 구성 쓰기는 기본적으로 활성화됩니다(`configWrites !== false`). Telegram에 의해 트리거되는 쓰기에는 그룹 마이그레이션 이벤트(`migrate_to_chat_id`, `channels.telegram.groups` 업데이트)와 `/config set` / `/config unset`(명령 활성화 필요)이 포함됩니다.

    비활성화:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="롱 폴링과 Webhook 비교">
    기본값은 롱 폴링입니다. Webhook 모드에서는 `channels.telegram.webhookUrl` 및 `channels.telegram.webhookSecret`을 설정하십시오. 선택 사항으로 `webhookPath`(기본값 `/telegram-webhook`), `webhookHost`(기본값 `127.0.0.1`), `webhookPort`(기본값 `8787`), `webhookCertPath`(직접 IP 또는 도메인 없는 설정용 자체 서명 인증서 PEM)을 설정할 수 있습니다.

    롱 폴링 모드에서 OpenClaw는 업데이트 디스패치에 성공한 후에만 재시작 워터마크를 유지합니다. 핸들러가 실패하면 해당 업데이트를 완료된 것으로 표시하지 않고 동일한 프로세스에서 다시 시도할 수 있는 상태로 둡니다.

    로컬 리스너는 기본적으로 `127.0.0.1:8787`에 바인딩됩니다. 공개 인그레스의 경우 로컬 포트 앞에 리버스 프록시를 배치하거나 `webhookHost: "0.0.0.0"`을 의도적으로 설정하십시오.

    Webhook 모드는 요청 가드, Telegram 보안 비밀 토큰, JSON 본문을 검증한 다음 업데이트를 내구성 있는 인그레스 대기열에 커밋하고 빈 `200`을 반환합니다. 내구성 있는 채택이 성공하면 `x-openclaw-delivery-accepted: durable`이 포함되며, 상태 확인, 라우팅, 인증, 검증 및 저장소 오류 응답에는 이 헤더가 생략됩니다. 리버스 프록시와 호스트 컨트롤러는 응답 시간으로 수락 여부를 추론하지 않고 OpenClaw의 채택과 일반적인 빈 `200`을 구분하기 위해 이 헤더를 요구할 수 있습니다.

    이후 OpenClaw는 롱 폴링에서 사용하는 것과 동일한 채팅별/주제별 봇 레인을 통해 업데이트를 비동기식으로 처리하므로, 느린 에이전트 실행이 Telegram의 전달 ACK를 지연시키지 않습니다.

  </Accordion>

  <Accordion title="제한, 재시도 및 CLI 대상">
    - `channels.telegram.textChunkLimit` 기본값은 4000이며, `streaming.chunkMode="newline"`은 길이를 기준으로 분할하기 전에 단락 경계(빈 줄)를 우선합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)은 수신 및 발신 미디어 크기를 제한합니다.
    - `channels.telegram.mediaGroupFlushMs`(기본값 500, 범위 10-60000)은 OpenClaw가 앨범/미디어 그룹을 하나의 수신 메시지로 전달하기 전에 버퍼링하는 시간을 제어합니다. 앨범의 일부가 늦게 도착하면 값을 늘리고, 앨범 응답 지연 시간을 줄이려면 값을 줄이십시오.
    - `channels.telegram.timeoutSeconds`은 API 클라이언트 제한 시간을 재정의합니다(설정하지 않으면 grammY 기본값이 적용됨). Bot 클라이언트는 설정값이 60초 발신 텍스트/입력 중 요청 보호 시간보다 짧으면 해당 보호 시간까지 높여, OpenClaw의 전송 보호 및 폴백이 실행되기 전에 grammY가 사용자에게 표시되는 응답 전달을 중단하지 않도록 합니다. 롱 폴링에는 계속 45초 `getUpdates` 요청 보호 시간이 적용되므로 유휴 폴링이 무기한 방치되지 않습니다.
    - `channels.telegram.pollingStallThresholdMs`의 기본값은 120000이며, 폴링 정지 재시작이 오탐되는 경우에만 30000에서 600000 사이로 조정하십시오.
    - 그룹 컨텍스트 기록은 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`(기본값 50)을 사용하며, `0`은 이를 비활성화합니다.
    - Gateway가 상위 메시지를 관찰한 경우 답장/인용/전달의 보충 컨텍스트는 선택된 하나의 대화 컨텍스트 창으로 정규화됩니다. 관찰된 메시지 캐시는 OpenClaw SQLite Plugin 상태에 저장되며, `openclaw doctor --fix`은 레거시 사이드카를 가져옵니다. Telegram은 업데이트마다 얕은 `reply_to_message` 하나만 포함하므로, 캐시보다 오래된 체인은 해당 페이로드로 제한됩니다.
    - Telegram 허용 목록은 주로 에이전트를 실행할 수 있는 사용자를 제한하며, 보충 컨텍스트를 완전히 가리는 경계는 아닙니다.
    - DM 기록: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry`은 복구 가능한 발신 API 오류에 대해 Telegram 전송 도우미(CLI/도구/작업)에 적용됩니다. 수신 메시지의 최종 응답 전달은 연결 전 실패에 대해 제한된 안전 전송 재시도를 사용하지만, 사용자에게 표시되는 메시지가 중복될 수 있는 모호한 전송 후 네트워크 엔벌로프는 재시도하지 않습니다.

    CLI 및 메시지 도구 전송 대상에는 숫자 채팅 ID, 사용자 이름 또는 포럼 주제 대상을 사용할 수 있습니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    설문은 `openclaw message poll`을 사용하며 포럼 주제를 지원합니다.

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 설문 플래그: `--poll-duration-seconds`(5-600), `--poll-anonymous`, `--poll-public`, `--thread-id`(또는 `:topic:` 대상). `--poll-option`은 2-12회 반복됩니다(Telegram의 선택지 제한).

    Telegram 전송은 인라인 키보드용 `buttons` 블록과 함께 `--presentation`도 지원하며(`channels.telegram.capabilities.inlineButtons`에서 허용하는 경우), Bot이 해당 채팅에서 고정할 수 있을 때 고정 전달을 요청하는 `--pin` 또는 `--delivery '{"pin":true}'`, 발신 이미지, GIF 및 동영상을 압축/애니메이션/동영상 업로드 대신 문서로 전송하는 `--force-document`도 지원합니다.

    작업 제한: `channels.telegram.actions.sendMessage=false`은 설문을 포함한 모든 발신 메시지를 비활성화하고, `channels.telegram.actions.poll=false`은 일반 전송을 활성화한 채 설문 생성만 비활성화합니다.

  </Accordion>

  <Accordion title="Telegram의 실행 승인">
    Telegram은 승인자 DM에서 실행 승인을 지원하며, 필요에 따라 요청이 시작된 채팅이나 주제에도 프롬프트를 게시할 수 있습니다. 승인자는 숫자 Telegram 사용자 ID여야 합니다.

    - `channels.telegram.execApprovals.enabled`(승인자를 하나 이상 확인할 수 있으면 `"auto"`에서 활성화)
    - `channels.telegram.execApprovals.approvers`(`commands.ownerAllowFrom`의 숫자 소유자 ID를 폴백으로 사용)
    - `channels.telegram.execApprovals.target`: `dm`(기본값) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` 및 `defaultTo`은 Bot과 대화할 수 있는 사용자와 정상 응답을 보내는 위치를 제어하며, 누군가를 실행 승인자로 지정하지는 않습니다. 아직 명령 소유자가 없으면 최초로 승인된 DM 페어링이 `commands.ownerAllowFrom`을 부트스트랩하므로, 단일 소유자 설정에서는 `execApprovals.approvers` 아래에 ID를 중복 입력하지 않아도 됩니다.

    채널 전달 시 채팅에 명령 텍스트가 표시됩니다. 신뢰할 수 있는 그룹/주제에서만 `channel` 또는 `both`을 활성화하십시오. 프롬프트가 포럼 주제에 게시되면 OpenClaw는 승인 프롬프트와 후속 작업에 해당 주제를 유지합니다. 실행 승인은 기본적으로 30분 후 만료됩니다.

    인라인 승인 버튼을 사용하려면 `channels.telegram.capabilities.inlineButtons`에서 대상 표면(`dm`, `group` 또는 `all`)을 허용해야 합니다. `plugin:` 접두사가 붙은 승인 ID는 Plugin 승인을 통해 확인되고, 그 외의 ID는 먼저 실행 승인을 통해 확인됩니다.

    [실행 승인](/ko/tools/exec-approvals)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 오류 응답 제어

에이전트에서 전달 또는 제공자 오류가 발생하면 오류 정책이 오류 메시지를 Telegram 채팅에 전달할지 여부를 제어합니다.

| 키                                 | 값                     | 기본값         | 설명                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always`은 모든 오류 메시지를 채팅으로 전송합니다. `once`은 각 고유 오류 메시지를 쿨다운 기간마다 한 번 전송합니다(반복되는 동일 오류는 억제함). `silent`은 오류 메시지를 채팅으로 전송하지 않습니다. |
| `channels.telegram.errorCooldownMs` | 숫자(ms)                | `14400000`(4h) | `once` 정책의 쿨다운 기간입니다. 오류가 전송되면 이 기간이 경과할 때까지 동일한 메시지가 억제됩니다. 장애 발생 시 오류 메시지가 쏟아지는 것을 방지합니다.                                           |

계정별, 그룹별 및 주제별 재정의가 지원됩니다(다른 Telegram 구성 키와 동일한 상속 방식).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 이 그룹에서 오류 억제
        },
      },
    },
  },
}
```

## 문제 해결

<AccordionGroup>
  <Accordion title="Bot이 멘션 없는 그룹 메시지에 응답하지 않음">

    - `requireMention=false`인 경우 Telegram 개인정보 보호 모드에서 모든 메시지를 볼 수 있어야 합니다. BotFather `/setprivacy` -> Disable로 이동한 다음, 그룹에서 Bot을 제거하고 다시 추가하십시오.
    - `openclaw channels status`은 구성에서 멘션 없는 그룹 메시지를 예상할 때 경고합니다.
    - `openclaw channels status --probe`은 명시적인 숫자 그룹 ID를 확인하며, 와일드카드 `"*"`은 멤버십을 검사할 수 없습니다.
    - 빠른 세션 테스트: `/activation always`.

  </Accordion>

  <Accordion title="Bot이 그룹 메시지를 전혀 수신하지 못함">

    - `channels.telegram.groups`이 있으면 그룹이 목록에 포함되어야 합니다(또는 `"*"`을 포함해야 함).
    - 그룹에서 Bot의 멤버십을 확인하십시오.
    - 건너뛴 이유는 `openclaw logs --follow`에서 검토하십시오.

  </Accordion>

  <Accordion title="명령이 일부만 작동하거나 전혀 작동하지 않음">

    - 발신자 ID를 승인하십시오(페어링 및/또는 숫자 `allowFrom`). 그룹 정책이 `open`인 경우에도 명령 승인은 계속 적용됩니다.
    - `BOT_COMMANDS_TOO_MUCH`이 포함된 `setMyCommands failed`은 네이티브 메뉴에 항목이 너무 많다는 의미입니다. Plugin/Skill/사용자 지정 명령을 줄이거나 네이티브 메뉴를 비활성화하십시오.
    - `deleteMyCommands`/`setMyCommands` 시작 호출 및 `sendChatAction` 입력 중 호출에는 시간 제한이 적용되며, 요청 시간이 초과되면 Telegram의 전송 폴백을 통해 한 번 재시도합니다. 네트워크/fetch 오류가 지속되면 일반적으로 `api.telegram.org`에 대한 DNS/HTTPS 연결이 불가능한 것입니다.

  </Accordion>

  <Accordion title="시작 시 승인되지 않은 토큰이 보고됨">

    - `getMe returned 401`은 구성된 Bot 토큰의 Telegram 인증 실패입니다. BotFather에서 토큰을 다시 복사하거나 재생성한 다음 `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` 또는 `TELEGRAM_BOT_TOKEN`(기본 계정)를 업데이트하십시오.
    - 시작 중 `deleteWebhook 401 Unauthorized`도 인증 실패입니다. 이를 "Webhook이 없음"으로 처리하면 동일한 잘못된 토큰 오류가 이후 API 호출까지 지연될 뿐입니다.

  </Accordion>

  <Accordion title="폴링 또는 네트워크 불안정">

    - 사용자 지정 fetch/프록시를 사용하는 Node 22+에서는 `AbortSignal` 형식이 일치하지 않을 경우 즉시 중단되는 동작이 발생할 수 있습니다.
    - 일부 호스트는 `api.telegram.org`을 IPv6로 먼저 확인하며, IPv6 송신이 제대로 작동하지 않으면 간헐적인 API 오류가 발생합니다.
    - `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`이 포함된 로그는 복구 가능한 네트워크 오류로 간주되어 재시도됩니다.
    - 폴링 시작 중 OpenClaw는 성공한 시작 `getMe` 검사를 grammY에 재사용하므로, 러너가 첫 번째 `getUpdates` 전에 두 번째 `getMe`을 수행할 필요가 없습니다.
    - 폴링 시작 중 일시적인 네트워크 오류로 `deleteWebhook`이 실패하면 OpenClaw는 폴링 전 제어 영역 호출을 다시 수행하지 않고 롱 폴링을 계속합니다. Webhook이 여전히 활성 상태이면 `getUpdates` 충돌로 나타나며, OpenClaw는 전송 계층을 재구성하고 Webhook 정리를 재시도합니다.
    - Telegram 소켓이 짧고 고정된 주기로 재활용되는 경우 낮은 `channels.telegram.timeoutSeconds` 값이 있는지 확인하십시오. Bot 클라이언트는 설정값이 발신 및 `getUpdates` 요청 보호 시간보다 짧으면 해당 보호 시간까지 높이지만, 이전 릴리스에서는 이 값이 해당 보호 시간보다 짧을 경우 모든 폴링 또는 응답이 중단될 수 있었습니다.
    - 로그의 `Polling stall detected`은 기본적으로 완료된 롱 폴 활성 상태가 120초 동안 없으면 OpenClaw가 폴링을 다시 시작하고 전송 계층을 재구성한다는 의미입니다.
    - `openclaw channels status --probe` 및 `openclaw doctor`은 실행 중인 폴링 계정이 시작 유예 기간 이후에도 `getUpdates`을 완료하지 않았거나, 실행 중인 Webhook 계정이 시작 유예 기간 이후에도 `setWebhook`을 완료하지 않았거나, 마지막으로 성공한 폴링 전송 활동이 오래된 경우 경고합니다.
    - 장시간 실행되는 `getUpdates` 호출이 정상인데도 호스트에서 폴링 정지 재시작을 잘못 보고하는 경우에만 `channels.telegram.pollingStallThresholdMs`을 높이십시오. 정지가 지속되면 일반적으로 `api.telegram.org`에 대한 프록시, DNS, IPv6 또는 TLS 송신 문제를 의미합니다.
    - Telegram은 Bot API 전송에 프로세스 프록시 환경 변수를 사용합니다: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` 및 소문자 변형. `NO_PROXY`/`no_proxy`는 여전히 `api.telegram.org`을 우회할 수 있습니다.
    - 서비스 환경에 `OPENCLAW_PROXY_URL`이 설정되어 있고 표준 프록시 환경 변수가 없으면 Telegram은 Bot API 전송에도 해당 URL을 사용합니다.
    - 직접 송신/TLS가 불안정한 VPS 호스트에서는 프록시를 통해 Telegram API 호출을 라우팅하십시오.

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+에서는 기본적으로 `autoSelectFamily=true`을 사용합니다(WSL2 제외). Telegram DNS 결과 순서는 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, 그다음 `channels.telegram.network.dnsResultOrder`, 그다음 프로세스 기본값(예: `NODE_OPTIONS=--dns-result-order=ipv4first`)을 따르며, 어느 것도 적용되지 않으면 Node 22+에서 `ipv4first`로 대체됩니다.
    - WSL2에서 또는 IPv4 전용 동작이 더 적합한 경우 주소 패밀리 선택을 강제하십시오.

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 벤치마크 범위 응답(`198.18.0.0/15`)은 기본적으로 Telegram 미디어 다운로드에 이미 허용됩니다. 신뢰할 수 있는 가짜 IP 또는 투명 프록시가 미디어 다운로드 중 `api.telegram.org`을 다른 비공개/내부/특수 용도 주소로 다시 쓰는 경우 Telegram 전용 우회를 명시적으로 활성화하십시오.

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 계정별로도 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`에서 동일하게 명시적 활성화를 사용할 수 있습니다.
    - 프록시가 Telegram 미디어 호스트를 `198.18.x.x`로 확인하는 경우 먼저 위험 플래그를 끈 상태로 두십시오. 해당 범위는 기본적으로 이미 허용됩니다.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`은 Telegram 미디어 SSRF 보호를 약화합니다. RFC 2544 벤치마크 범위 밖의 비공개 또는 특수 용도 응답을 생성하는 신뢰할 수 있는 운영자 제어 프록시 환경(Clash, Mihomo, Surge 가짜 IP 라우팅)에서만 사용하십시오. 일반적인 공용 인터넷 Telegram 액세스에는 이 설정을 끈 상태로 두십시오.
    </Warning>

    - 임시 환경 재정의: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - DNS 응답을 검증하십시오.

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

추가 도움말: [채널 문제 해결](/ko/channels/troubleshooting).

## 구성 참조

기본 참조: [구성 참조 - Telegram](/ko/gateway/config-channels#telegram).

<Accordion title="핵심 Telegram 필드">

- 시작/인증: `enabled`, `botToken`, `tokenFile`(일반 파일이어야 하며 심볼릭 링크는 거부됨), `accounts.*`
- 액세스 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]`(`type: "acp"`)
- 주제 기본값: `groups.<chatId>.topics."*"`은 일치하지 않는 포럼 주제에 적용되며, 정확한 주제 ID가 이를 재정의합니다.
- 실행 승인: `execApprovals`, `accounts.*.execApprovals`
- 명령/메뉴: `commands.native`, `commands.nativeSkills`, `customCommands`
- 스레드/답글: `replyToMode`, `threadBindings`
- 스트리밍: `streaming`(모드 `off | partial | block | progress`), `streaming.preview.toolProgress`
- 서식/전달: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables`(`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- 미디어/네트워크: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- 사용자 지정 API 루트: `apiRoot`(Bot API 루트만 해당하며 `/bot<TOKEN>`은 포함하지 마십시오), `trustedLocalFileRoots`(자체 호스팅 Bot API의 절대 `file_path` 루트)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- 작업/기능: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 반응: `reactionNotifications`, `reactionLevel`
- 오류: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- 쓰기/기록: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
다중 계정 우선순위: 계정 ID가 2개 이상 구성된 경우 기본 라우팅을 명시하려면 `channels.telegram.defaultAccount`을 설정하거나 `channels.telegram.accounts.default`을 포함하십시오. 그렇지 않으면 OpenClaw는 정규화된 첫 번째 계정 ID로 대체하며 `openclaw doctor`에서 경고합니다. 이름이 지정된 계정은 `channels.telegram.allowFrom` / `groupAllowFrom`을 상속하지만 `accounts.default.*` 값은 상속하지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram 사용자를 Gateway와 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 및 주제 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    수신 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 보안 강화입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    그룹과 주제를 에이전트에 매핑합니다.
  </Card>
  <Card title="문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단입니다.
  </Card>
</CardGroup>
