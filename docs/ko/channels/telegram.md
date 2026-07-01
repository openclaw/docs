---
read_when:
    - Telegram 기능 또는 Webhook 작업하기
summary: Telegram 봇 지원 상태, 기능 및 구성
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:15:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

grammY를 통해 봇 DM 및 그룹에서 프로덕션 준비 상태로 사용할 수 있습니다. 롱 폴링이 기본 모드이며, Webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 봇 토큰 생성">
    Telegram을 열고 **@BotFather**와 대화합니다(핸들이 정확히 `@BotFather`인지 확인).

    `/newbot`을 실행하고 프롬프트를 따른 다음 토큰을 저장합니다.

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

    환경 변수 대체: `TELEGRAM_BOT_TOKEN=...`(기본 계정만 해당).
    Telegram은 `openclaw channels login telegram`을 사용하지 **않습니다**. 구성/환경 변수에서 토큰을 설정한 다음 Gateway를 시작하세요.

  </Step>

  <Step title="Gateway 시작 및 첫 DM 승인">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    페어링 코드는 1시간 후 만료됩니다.

  </Step>

  <Step title="그룹에 봇 추가">
    봇을 그룹에 추가한 다음, 그룹 접근에 필요한 두 ID를 모두 가져옵니다.

    - `allowFrom` / `groupAllowFrom`에서 사용되는 Telegram 사용자 ID
    - `channels.telegram.groups` 아래의 키로 사용되는 Telegram 그룹 채팅 ID

    처음 설정하는 경우, `openclaw logs --follow`, 전달된 ID 봇 또는 Bot API `getUpdates`에서 그룹 채팅 ID를 가져옵니다. 그룹이 허용된 후에는 `/whoami@<bot_username>`로 사용자 및 그룹 ID를 확인할 수 있습니다.

    `-100`으로 시작하는 음수 Telegram 슈퍼그룹 ID는 그룹 채팅 ID입니다. `groupAllowFrom` 아래가 아니라 `channels.telegram.groups` 아래에 넣으세요.

  </Step>
</Steps>

<Note>
토큰 확인 순서는 계정을 인식합니다. 실제로는 구성 값이 환경 변수 대체보다 우선하며, `TELEGRAM_BOT_TOKEN`은 기본 계정에만 적용됩니다.
시작에 성공하면 OpenClaw는 재시작 시 추가 Telegram `getMe` 호출을 피할 수 있도록 최대 24시간 동안 상태 디렉터리에 봇 ID를 캐시합니다. 토큰을 변경하거나 제거하면 해당 캐시가 지워집니다.
</Note>

## Telegram 측 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드 및 그룹 가시성">
    Telegram 봇은 기본적으로 **개인정보 보호 모드**를 사용하며, 이 모드는 봇이 수신하는 그룹 메시지를 제한합니다.

    봇이 모든 그룹 메시지를 확인해야 하는 경우 다음 중 하나를 수행하세요.

    - `/setprivacy`로 개인정보 보호 모드를 비활성화하거나
    - 봇을 그룹 관리자로 지정합니다.

    개인정보 보호 모드를 전환할 때는 Telegram이 변경 사항을 적용하도록 각 그룹에서 봇을 제거한 뒤 다시 추가하세요.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어됩니다.

    관리자 봇은 모든 그룹 메시지를 수신하므로, 항상 켜져 있는 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="유용한 BotFather 전환 설정">

    - 그룹 추가 허용/거부에는 `/setjoingroups`
    - 그룹 가시성 동작에는 `/setprivacy`

  </Accordion>
</AccordionGroup>

## 접근 제어 및 활성화

### 그룹 봇 ID

Telegram 그룹과 포럼 주제에서 구성된 봇 핸들(예: `@my_bot`)을 명시적으로 멘션하면, 에이전트 페르소나 이름이 Telegram 사용자 이름과 다르더라도 선택된 OpenClaw 에이전트에게 말을 거는 것으로 처리됩니다. 관련 없는 그룹 트래픽에는 그룹 침묵 정책이 계속 적용되지만, 봇 핸들 자체는 "다른 사람"으로 간주되지 않습니다.

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`는 직접 메시지 접근을 제어합니다.

    - `pairing`(기본값)
    - `allowlist`(`allowFrom`에 최소 하나의 발신자 ID 필요)
    - `open`(`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `allowFrom: ["*"]`와 함께 `dmPolicy: "open"`을 사용하면 봇 사용자 이름을 찾거나 추측한 모든 Telegram 계정이 봇에 명령할 수 있습니다. 도구가 엄격히 제한된 의도적인 공개 봇에만 사용하세요. 단일 소유자 봇은 숫자 사용자 ID와 함께 `allowlist`를 사용해야 합니다.

    `channels.telegram.allowFrom`은 숫자 Telegram 사용자 ID를 허용합니다. `telegram:` / `tg:` 접두사는 허용되며 정규화됩니다.
    다중 계정 구성에서 제한적인 최상위 `channels.telegram.allowFrom`은 안전 경계로 처리됩니다. 계정 수준의 `allowFrom: ["*"]` 항목은 병합 후 유효 계정 허용 목록에 명시적인 와일드카드가 여전히 포함되어 있지 않는 한 해당 계정을 공개로 만들지 않습니다.
    빈 `allowFrom`과 함께 `dmPolicy: "allowlist"`를 사용하면 모든 DM이 차단되며 구성 검증에서 거부됩니다.
    설정에서는 숫자 사용자 ID만 요청합니다.
    업그레이드 후 구성에 `@username` 허용 목록 항목이 포함되어 있다면 `openclaw doctor --fix`를 실행해 이를 해석하세요(최선 노력 방식이며 Telegram 봇 토큰이 필요함).
    이전에 페어링 저장소 허용 목록 파일에 의존했다면, `openclaw doctor --fix`는 허용 목록 흐름에서 항목을 `channels.telegram.allowFrom`으로 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없는 경우).

    단일 소유자 봇의 경우, 이전 페어링 승인에 의존하지 않고 접근 정책을 구성에 견고하게 유지하려면 명시적인 숫자 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 선호하세요.

    흔한 혼동: DM 페어링 승인이 "이 발신자가 모든 곳에서 권한을 가진다"는 뜻은 아닙니다.
    페어링은 DM 접근을 부여합니다. 아직 명령 소유자가 없는 경우, 처음 승인된 페어링은 소유자 전용 명령과 실행 승인이 명시적인 운영자 계정을 갖도록 `commands.ownerAllowFrom`도 설정합니다.
    그룹 발신자 권한 부여는 여전히 명시적인 구성 허용 목록에서 옵니다.
    "한 번 권한을 받으면 DM과 그룹 명령이 모두 작동"하기를 원한다면 숫자 Telegram 사용자 ID를 `channels.telegram.allowFrom`에 넣으세요. 소유자 전용 명령의 경우 `commands.ownerAllowFrom`에 `telegram:<your user id>`가 포함되어 있는지 확인하세요.

    ### Telegram 사용자 ID 찾기

    더 안전한 방법(타사 봇 없음):

    1. 봇에 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    공식 Bot API 방법:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    타사 방법(개인정보 보호 수준 낮음): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책 및 허용 목록">
    두 제어가 함께 적용됩니다.

    1. **허용되는 그룹**(`channels.telegram.groups`)
       - `groups` 구성이 없음:
         - `groupPolicy: "open"`인 경우: 모든 그룹이 그룹 ID 검사를 통과할 수 있음
         - `groupPolicy: "allowlist"`(기본값)인 경우: `groups` 항목(또는 `"*"`)을 추가할 때까지 그룹이 차단됨
       - `groups`가 구성됨: 허용 목록으로 동작(명시적 ID 또는 `"*"`)

    2. **그룹에서 허용되는 발신자**(`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist`(기본값)
       - `disabled`

    `groupAllowFrom`은 그룹 발신자 필터링에 사용됩니다. 설정하지 않으면 Telegram은 `allowFrom`으로 대체합니다.
    `groupAllowFrom` 항목은 숫자 Telegram 사용자 ID여야 합니다(`telegram:` / `tg:` 접두사는 정규화됨).
    Telegram 그룹 또는 슈퍼그룹 채팅 ID를 `groupAllowFrom`에 넣지 마세요. 음수 채팅 ID는 `channels.telegram.groups` 아래에 있어야 합니다.
    숫자가 아닌 항목은 발신자 권한 부여에서 무시됩니다.
    보안 경계(`2026.2.25+`): 그룹 발신자 인증은 DM 페어링 저장소 승인을 상속하지 **않습니다**.
    페어링은 DM 전용으로 유지됩니다. 그룹의 경우 `groupAllowFrom` 또는 그룹별/주제별 `allowFrom`을 설정하세요.
    `groupAllowFrom`이 설정되지 않으면 Telegram은 페어링 저장소가 아니라 구성 `allowFrom`으로 대체합니다.
    단일 소유자 봇의 실용적인 패턴: 사용자 ID를 `channels.telegram.allowFrom`에 설정하고, `groupAllowFrom`은 설정하지 않은 채 대상 그룹을 `channels.telegram.groups` 아래에서 허용합니다.
    런타임 참고: `channels.telegram`이 완전히 없으면, `channels.defaults.groupPolicy`가 명시적으로 설정되지 않는 한 런타임 기본값은 실패 시 닫힘 `groupPolicy="allowlist"`입니다.

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

    그룹에서 `@<bot_username> ping`으로 테스트하세요. `requireMention: true`인 동안 일반 그룹 메시지는 봇을 트리거하지 않습니다.

    예시: 특정 그룹 하나에서 모든 구성원 허용:

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

    예시: 특정 그룹 하나에서 특정 사용자만 허용:

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
      흔한 실수: `groupAllowFrom`은 Telegram 그룹 허용 목록이 아닙니다.

      - `-1001234567890` 같은 음수 Telegram 그룹 또는 슈퍼그룹 채팅 ID는 `channels.telegram.groups` 아래에 넣으세요.
      - 허용된 그룹 안에서 어떤 사람들이 봇을 트리거할 수 있는지 제한하려면 `8734062810` 같은 Telegram 사용자 ID를 `groupAllowFrom` 아래에 넣으세요.
      - 허용된 그룹의 모든 구성원이 봇과 대화할 수 있게 하려는 경우에만 `groupAllowFrom: ["*"]`을 사용하세요.

    </Warning>

  </Tab>

  <Tab title="멘션 동작">
    그룹 답장은 기본적으로 멘션이 필요합니다.

    멘션은 다음에서 올 수 있습니다.

    - 기본 `@botusername` 멘션
    - 또는 다음의 멘션 패턴:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    세션 수준 명령 전환:

    - `/activation always`
    - `/activation mention`

    이는 세션 상태만 업데이트합니다. 영속성에는 구성을 사용하세요.

    영속 구성 예시:

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

    그룹 기록 컨텍스트의 기본값은 `mention-only`입니다. 이전 그룹 메시지는
    봇에게 전달되었거나, 봇에 대한 답장이거나,
    봇 자신의 메시지인 경우에만 포함됩니다. 신뢰할 수 있는 그룹에 대해 최근 방 기록을
    포함하려면 `includeGroupHistoryContext: "recent"`를 설정하세요. 다음 턴에 이전 Telegram 그룹 기록을
    보내지 않으려면 `includeGroupHistoryContext: "none"`을 설정하세요.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    그룹 채팅 ID 가져오기:

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`으로 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 읽기
    - 또는 Bot API `getUpdates` 검사
    - 그룹이 허용된 후, 기본 명령이 활성화되어 있으면 `/whoami@<bot_username>` 실행

  </Tab>
</Tabs>

## 런타임 동작

- Telegram은 gateway 프로세스가 소유합니다.
- 라우팅은 결정적입니다. Telegram 인바운드는 Telegram으로 다시 응답합니다(모델이 채널을 선택하지 않음).
- 인바운드 메시지는 답장 메타데이터, 미디어 자리 표시자, gateway가 관찰한 Telegram 답장에 대한 지속 답장 체인 컨텍스트와 함께 공유 채널 envelope로 정규화됩니다.
- 그룹 세션은 그룹 ID별로 격리됩니다. 포럼 주제는 주제를 격리된 상태로 유지하기 위해 `:topic:<threadId>`를 추가합니다.
- DM 메시지는 `message_thread_id`를 포함할 수 있으며, OpenClaw는 답장을 위해 이를 보존합니다. DM 주제 세션은 Telegram `getMe`가 봇에 대해 `has_topics_enabled: true`를 보고할 때만 분리되며, 그렇지 않으면 DM은 평면 세션에 유지됩니다.
- Long polling은 채팅별/스레드별 순서를 적용하는 grammY runner를 사용합니다. 전체 runner sink 동시성은 `agents.defaults.maxConcurrent`를 사용합니다.
- 다중 계정 시작 시 동시 Telegram `getMe` 프로브를 제한하여 대규모 봇 플릿이 모든 계정 프로브를 한꺼번에 확산하지 않도록 합니다.
- Long polling은 각 gateway 프로세스 내부에서 보호되어 한 번에 하나의 활성 poller만 봇 토큰을 사용할 수 있습니다. 그래도 `getUpdates` 409 충돌이 보이면 다른 OpenClaw gateway, 스크립트 또는 외부 poller가 같은 토큰을 사용하고 있을 가능성이 큽니다.
- Long-polling watchdog 재시작은 기본적으로 완료된 `getUpdates` liveness가 120초 동안 없으면 트리거됩니다. 배포 환경에서 장시간 실행 작업 중 잘못된 polling-stall 재시작이 계속 발생하는 경우에만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 값은 밀리초 단위이며 `30000`부터 `600000`까지 허용됩니다. 계정별 재정의도 지원됩니다.
- Telegram Bot API는 읽음 확인을 지원하지 않습니다(`sendReadReceipts`는 적용되지 않음).

<Note>
  `channels.telegram.dm.threadReplies`와 `channels.telegram.direct.<chatId>.threadReplies`는 제거되었습니다. 구성에 해당 키가 아직 있으면 업그레이드 후 `openclaw doctor --fix`를 실행하세요. DM 주제 라우팅은 이제 Telegram `getMe.has_topics_enabled`의 봇 capability를 따르며, 이는 BotFather 스레드 모드로 제어됩니다. topics-enabled 봇은 Telegram이 `message_thread_id`를 보낼 때 스레드 범위 DM 세션을 사용하고, 그 외 DM은 평면 세션에 유지됩니다.
</Note>

## 기능 참조

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw는 부분 답변을 실시간으로 스트리밍할 수 있습니다.

    - 직접 채팅: 미리 보기 메시지 + `editMessageText`
    - 그룹/주제: 미리 보기 메시지 + `editMessageText`

    요구 사항:

    - `channels.telegram.streaming`은 `off | partial | block | progress`입니다(기본값: `partial`).
    - 짧은 초기 답변 미리 보기는 debounce된 뒤, 실행이 아직 활성 상태이면 제한된 지연 후 materialize됩니다.
    - `progress`는 도구 진행 상황을 위해 편집 가능한 상태 초안 하나를 유지하고, 도구 진행 상황보다 먼저 답변 활동이 도착하면 안정적인 상태 라벨을 표시하며, 완료 시 이를 지우고 최종 답변을 일반 메시지로 보냅니다.
    - `streaming.preview.toolProgress`는 도구/진행 상황 업데이트가 같은 편집된 미리 보기 메시지를 재사용할지 제어합니다(기본값: 미리 보기 스트리밍이 활성화되어 있으면 `true`).
    - `streaming.preview.commandText`는 해당 도구 진행 상황 줄 안의 명령/실행 세부 정보를 제어합니다. `raw`(기본값, 릴리스된 동작 유지) 또는 `status`(도구 라벨만).
    - `streaming.progress.commentary`(기본값: `false`)는 임시 진행 초안에 어시스턴트 해설/전문 텍스트를 포함하도록 옵트인합니다.
    - 레거시 `channels.telegram.streamMode`, boolean `streaming` 값, 사용 중단된 네이티브 초안 미리 보기 키는 감지됩니다. 현재 스트리밍 구성으로 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.

    도구 진행 상황 미리 보기 업데이트는 도구가 실행되는 동안 표시되는 짧은 상태 줄입니다. 예를 들어 명령 실행, 파일 읽기, 계획 업데이트, 패치 요약 또는 Codex app-server 모드의 Codex 전문/해설 텍스트가 있습니다. Telegram은 `v2026.4.22` 이후 릴리스된 OpenClaw 동작과 일치하도록 기본적으로 이를 활성화합니다.

    답변 텍스트에 대한 편집된 미리 보기는 유지하되 도구 진행 상황 줄을 숨기려면 다음을 설정하세요.

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    도구 진행 상황은 계속 보이게 하되 명령/실행 텍스트를 숨기려면 다음을 설정하세요.

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    최종 답변을 같은 메시지로 편집하지 않고도 도구 진행 상황을 보이게 하려면 `progress` 모드를 사용하세요. 명령 텍스트 정책은 `streaming.progress` 아래에 두세요.

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

    최종 답변만 전달하려는 경우에만 `streaming.mode: "off"`를 사용하세요. Telegram 미리 보기 편집은 비활성화되고, 일반 도구/진행 상황 chatter는 독립 상태 메시지로 전송되는 대신 억제됩니다. 승인 프롬프트, 미디어 payload, 오류는 여전히 일반 최종 전달을 통해 라우팅됩니다. 도구 진행 상황 상태 줄을 숨기면서 답변 미리 보기 편집만 유지하려면 `streaming.preview.toolProgress: false`를 사용하세요.

    <Note>
      Telegram 선택 인용 답장은 예외입니다. `replyToMode`가 `"first"`, `"all"` 또는 `"batched"`이고 인바운드 메시지에 선택된 인용 텍스트가 포함된 경우, OpenClaw는 답변 미리 보기를 편집하는 대신 Telegram의 네이티브 인용 답장 경로를 통해 최종 답변을 보냅니다. 따라서 `streaming.preview.toolProgress`는 해당 턴에 짧은 상태 줄을 표시할 수 없습니다. 선택된 인용 텍스트가 없는 현재 메시지 답장은 계속 미리 보기 스트리밍을 유지합니다. 도구 진행 상황 가시성이 네이티브 인용 답장보다 더 중요하면 `replyToMode: "off"`를 설정하거나, 절충을 인정하려면 `streaming.preview.toolProgress: false`를 설정하세요.
    </Note>

    텍스트 전용 답장의 경우:

    - 짧은 DM/그룹/주제 미리 보기: OpenClaw는 같은 미리 보기 메시지를 유지하고 최종 편집을 제자리에서 수행합니다.
    - 여러 Telegram 메시지로 분할되는 긴 텍스트 최종 답변은 가능하면 기존 미리 보기를 첫 번째 최종 청크로 재사용한 뒤, 나머지 청크만 보냅니다.
    - progress-mode 최종 답변은 상태 초안을 지우고 초안을 답변으로 편집하는 대신 일반 최종 전달을 사용합니다.
    - 완료된 텍스트가 확인되기 전에 최종 편집이 실패하면 OpenClaw는 일반 최종 전달을 사용하고 오래된 미리 보기를 정리합니다.

    복잡한 답장(예: 미디어 payload)의 경우 OpenClaw는 일반 최종 전달로 fallback한 뒤 미리 보기 메시지를 정리합니다.

    미리 보기 스트리밍은 block 스트리밍과 별개입니다. Telegram에 block 스트리밍이 명시적으로 활성화된 경우, OpenClaw는 이중 스트리밍을 피하기 위해 미리 보기 스트림을 건너뜁니다.

    Reasoning 스트림 동작:

    - `/reasoning stream`은 지원되는 채널의 reasoning-preview 경로를 사용합니다. Telegram에서는 생성 중 reasoning을 라이브 미리 보기로 스트리밍합니다.
    - reasoning 미리 보기는 최종 전달 후 삭제됩니다. reasoning이 계속 보이게 하려면 `/reasoning on`을 사용하세요.
    - 최종 답변은 reasoning 텍스트 없이 전송됩니다.

  </Accordion>

  <Accordion title="Rich message formatting">
    아웃바운드 텍스트는 기본적으로 표준 Telegram HTML 메시지를 사용하므로 현재 Telegram 클라이언트 전반에서 답장이 읽기 쉬운 상태로 유지됩니다. 이 호환 모드는 일반 굵게, 기울임꼴, 링크, 코드, 스포일러, 인용을 지원하지만 네이티브 표, 세부 정보, 리치 미디어, 수식 같은 Bot API 10.1 rich-only 블록은 지원하지 않습니다.

    Bot API 10.1 rich message를 옵트인하려면 `channels.telegram.richMessages: true`를 설정하세요.

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    활성화된 경우:

    - 에이전트는 이 봇/계정에서 Telegram rich message를 사용할 수 있다고 전달받습니다.
    - Markdown 텍스트는 OpenClaw의 Markdown IR을 통해 렌더링되어 Telegram rich HTML로 전송됩니다.
    - 명시적 rich HTML payload는 제목, 표, 세부 정보, 리치 미디어, 수식 같은 지원되는 Bot API 10.1 태그를 보존합니다.
    - rich message가 캡션을 대체하지 않으므로 미디어 캡션은 계속 Telegram HTML 캡션을 사용합니다.

    이렇게 하면 모델 텍스트가 Telegram Rich Markdown sigil에서 분리되어 `$400-600K` 같은 통화가 수학식으로 파싱되지 않습니다. 긴 rich text는 Telegram의 rich text 및 rich block 제한에 맞춰 자동으로 분할됩니다. Telegram의 열 제한을 초과하는 표는 코드 블록으로 전송됩니다.

    기본값: 클라이언트 호환성을 위해 꺼짐. Rich message에는 호환되는 Telegram 클라이언트가 필요합니다. 일부 현재 Desktop, Web, Android 및 서드파티 클라이언트는 수락된 rich message를 지원되지 않는 것으로 표시합니다. 봇과 함께 사용하는 모든 클라이언트가 이를 렌더링할 수 있는 경우가 아니라면 이 옵션을 비활성화해 두세요. `/status`는 현재 Telegram 세션에서 rich message가 켜져 있는지 꺼져 있는지 표시합니다.

    링크 미리 보기는 기본적으로 활성화됩니다. `channels.telegram.linkPreview: false`는 rich text에 대한 자동 entity 감지를 건너뜁니다.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram 명령 메뉴 등록은 시작 시 `setMyCommands`로 처리됩니다.

    네이티브 명령 기본값:

    - `commands.native: "auto"`는 Telegram에 네이티브 명령을 활성화합니다.

    사용자 지정 명령 메뉴 항목 추가:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    규칙:

    - 이름은 정규화됩니다(앞의 `/` 제거, 소문자 변환).
    - 유효한 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - 사용자 지정 명령은 네이티브 명령을 재정의할 수 없습니다.
    - 충돌/중복은 건너뛰고 로그에 기록됩니다.

    참고:

    - 사용자 지정 명령은 메뉴 항목일 뿐이며, 동작을 자동으로 구현하지 않습니다.
    - Plugin/skill 명령은 Telegram 메뉴에 표시되지 않더라도 입력하면 계속 작동할 수 있습니다.

    네이티브 명령이 비활성화되면 기본 제공 명령은 제거됩니다. 구성된 경우 사용자 지정/Plugin 명령은 여전히 등록될 수 있습니다.

    일반적인 설정 실패:

    - `BOT_COMMANDS_TOO_MUCH`와 함께 `setMyCommands failed`가 표시되면 잘라낸 뒤에도 Telegram 메뉴가 여전히 넘쳤다는 뜻입니다. Plugin/skill/사용자 지정 명령을 줄이거나 `channels.telegram.commands.native`를 비활성화하세요.
    - 직접 Bot API curl 명령은 작동하는데 `deleteWebhook`, `deleteMyCommands` 또는 `setMyCommands`가 `404: Not Found`로 실패하면 `channels.telegram.apiRoot`가 전체 `/bot<TOKEN>` endpoint로 설정되었을 수 있습니다. `apiRoot`는 Bot API 루트만이어야 하며, `openclaw doctor --fix`는 실수로 붙은 trailing `/bot<TOKEN>`을 제거합니다.
    - `getMe returned 401`은 Telegram이 구성된 봇 토큰을 거부했다는 뜻입니다. 현재 BotFather 토큰으로 `botToken`, `tokenFile` 또는 `TELEGRAM_BOT_TOKEN`을 업데이트하세요. OpenClaw는 polling 전에 중지하므로 이는 webhook 정리 실패로 보고되지 않습니다.
    - 네트워크/fetch 오류와 함께 `setMyCommands failed`가 표시되면 일반적으로 `api.telegram.org`로의 아웃바운드 DNS/HTTPS가 차단되었다는 뜻입니다.

    ### 디바이스 페어링 명령(`device-pair` Plugin)

    `device-pair` Plugin이 설치된 경우:

    1. `/pair`가 설정 코드를 생성합니다.
    2. iOS 앱에 코드를 붙여 넣습니다.
    3. `/pair pending`이 대기 중인 요청을 나열합니다(역할/범위 포함).
    4. 요청을 승인합니다.
       - 명시적 승인은 `/pair approve <requestId>`
       - 대기 중인 요청이 하나뿐이면 `/pair approve`
       - 가장 최근 요청은 `/pair approve latest`

    설정 코드는 수명이 짧은 bootstrap 토큰을 포함합니다. 기본 제공 설정 코드 bootstrap은 node 전용입니다. 첫 연결은 대기 중인 node 요청을 만들고, 승인 후 Gateway는 `scopes: []`가 포함된 지속 node 토큰을 반환합니다. 넘겨받은 operator 토큰은 반환하지 않습니다. operator 접근에는 별도로 승인된 operator 페어링 또는 토큰 흐름이 필요합니다.

    디바이스가 변경된 인증 세부 정보(예: 역할/범위/공개 키)로 다시 시도하면 이전 대기 요청은 대체되고 새 요청은 다른 `requestId`를 사용합니다. 승인하기 전에 `/pair pending`을 다시 실행하세요.

    자세한 내용: [페어링](/ko/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="인라인 버튼">
    인라인 키보드 범위를 구성합니다.

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

    범위:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`(기본값)

    레거시 `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`로 매핑됩니다.

    메시지 작업 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Mini App 버튼 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram `web_app` 버튼은 사용자와 봇 간의 비공개 채팅에서만 작동합니다.

    등록된 플러그인 대화형 핸들러가 처리하지 않는 콜백 클릭은 텍스트로 에이전트에 전달됩니다.
    `callback_data: <value>`

  </Accordion>

  <Accordion title="에이전트 및 자동화를 위한 Telegram 메시지 작업">
    Telegram 도구 작업에는 다음이 포함됩니다.

    - `sendMessage`(`to`, `content`, 선택적 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react`(`chatId`, `messageId`, `emoji`)
    - `deleteMessage`(`chatId`, `messageId`)
    - `editMessage`(`chatId`, `messageId`, `content` 또는 `caption`, 선택적 `presentation` 인라인 버튼; 버튼만 수정하는 경우 답장 마크업을 업데이트함)
    - `createForumTopic`(`chatId`, `name`, 선택적 `iconColor`, `iconCustomEmojiId`)

    채널 메시지 작업은 사용하기 쉬운 별칭(`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)을 노출합니다.

    게이팅 제어:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`(기본값: 비활성화)

    참고: `edit` 및 `topic-create`는 현재 기본적으로 활성화되어 있으며 별도의 `channels.telegram.actions.*` 토글이 없습니다.
    런타임 전송은 활성 config/secrets 스냅샷(시작/다시 로드)을 사용하므로, 작업 경로는 전송마다 임시 SecretRef 재확인을 수행하지 않습니다.

    반응 제거 의미 체계: [/tools/reactions](/ko/tools/reactions)

  </Accordion>

  <Accordion title="답장 스레딩 태그">
    Telegram은 생성된 출력에서 명시적 답장 스레딩 태그를 지원합니다.

    - `[[reply_to_current]]`는 트리거한 메시지에 답장합니다.
    - `[[reply_to:<id>]]`는 특정 Telegram 메시지 ID에 답장합니다.

    `channels.telegram.replyToMode`는 처리를 제어합니다.

    - `off`(기본값)
    - `first`
    - `all`

    답장 스레딩이 활성화되어 있고 원본 Telegram 텍스트 또는 캡션을 사용할 수 있으면 OpenClaw가 네이티브 Telegram 인용 발췌를 자동으로 포함합니다. Telegram은 네이티브 인용 텍스트를 1024 UTF-16 코드 단위로 제한하므로, 더 긴 메시지는 시작 부분부터 인용되며 Telegram이 인용을 거부하면 일반 답장으로 대체됩니다.

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 계속 적용됩니다.

  </Accordion>

  <Accordion title="포럼 주제 및 스레드 동작">
    포럼 슈퍼그룹:

    - 주제 세션 키는 `:topic:<threadId>`를 추가합니다.
    - 답장과 입력 상태는 주제 스레드를 대상으로 합니다.
    - 주제 config 경로:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    일반 주제(`threadId=1`) 특수 사례:

    - 메시지 전송은 `message_thread_id`를 생략합니다(Telegram이 `sendMessage(...thread_id=1)`을 거부함).
    - 입력 작업은 여전히 `message_thread_id`를 포함합니다.

    주제 상속: 주제 항목은 재정의되지 않는 한 그룹 설정(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)을 상속합니다.
    `agentId`는 주제 전용이며 그룹 기본값에서 상속되지 않습니다.
    `topics."*"`는 해당 그룹의 모든 주제에 대한 기본값을 설정합니다. 정확한 주제 ID는 여전히 `"*"`보다 우선합니다.

    **주제별 에이전트 라우팅**: 각 주제는 주제 config에서 `agentId`를 설정해 다른 에이전트로 라우팅할 수 있습니다. 이를 통해 각 주제는 자체 격리된 워크스페이스, 메모리, 세션을 갖습니다. 예시:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    그러면 각 주제는 자체 세션 키를 갖습니다. `agent:zu:telegram:group:-1001234567890:topic:3`

    **영구 ACP 주제 바인딩**: 포럼 주제는 최상위 typed ACP 바인딩(`type: "acp"` 및 `match.channel: "telegram"`, `peer.kind: "group"`, 그리고 `-1001234567890:topic:42` 같은 주제 한정 ID가 포함된 `bindings[]`)을 통해 ACP harness 세션을 고정할 수 있습니다. 현재 그룹/슈퍼그룹의 포럼 주제로 범위가 제한됩니다. [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

    **채팅에서 스레드에 바인딩된 ACP spawn**: `/acp spawn <agent> --thread here|auto`는 현재 주제를 새 ACP 세션에 바인딩하며, 후속 메시지는 그곳으로 직접 라우팅됩니다. OpenClaw는 spawn 확인을 주제 안에 고정합니다. `channels.telegram.threadBindings.spawnSessions`가 활성화된 상태로 유지되어야 합니다(기본값: `true`).

    템플릿 컨텍스트는 `MessageThreadId` 및 `IsForum`을 노출합니다. `message_thread_id`가 있는 DM 채팅은 답장 메타데이터를 유지합니다. 해당 채팅은 Telegram `getMe`가 봇에 대해 `has_topics_enabled: true`를 보고하는 경우에만 스레드 인식 세션 키를 사용합니다.
    이전 `dm.threadReplies` 및 `direct.*.threadReplies` 재정의는 의도적으로 폐기되었습니다. BotFather 스레드 모드를 단일 진실 공급원으로 사용하고 `openclaw doctor --fix`를 실행하여 오래된 config 키를 제거하세요.

  </Accordion>

  <Accordion title="오디오, 동영상, 스티커">
    ### 오디오 메시지

    Telegram은 음성 메모와 오디오 파일을 구분합니다.

    - 기본값: 오디오 파일 동작
    - 에이전트 답장에서 `[[audio_as_voice]]` 태그를 사용해 음성 메모 전송을 강제함
    - 수신 음성 메모 전사는 에이전트 컨텍스트에서 기계 생성의
      신뢰할 수 없는 텍스트로 프레이밍됩니다. 멘션 감지는 여전히 원시
      전사를 사용하므로 멘션 게이트가 적용된 음성 메시지가 계속 작동합니다.

    메시지 작업 예시:

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

    Telegram은 비디오 파일과 비디오 노트를 구분합니다.

    메시지 작업 예:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    비디오 노트는 캡션을 지원하지 않으며, 제공된 메시지 텍스트는 별도로 전송됩니다.

    ### 스티커

    수신 스티커 처리:

    - 정적 WEBP: 다운로드 및 처리됨(플레이스홀더 `<media:sticker>`)
    - 애니메이션 TGS: 건너뜀
    - 비디오 WEBM: 건너뜀

    스티커 컨텍스트 필드:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    반복적인 비전 호출을 줄이기 위해 스티커 설명은 OpenClaw SQLite Plugin 상태에 캐시됩니다.

    스티커 작업 활성화:

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

    스티커 작업 전송:

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
    Telegram 반응은 메시지 페이로드와 별개인 `message_reaction` 업데이트로 도착합니다.

    활성화되면 OpenClaw는 다음과 같은 시스템 이벤트를 큐에 넣습니다.

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    구성:

    - `channels.telegram.reactionNotifications`: `off | own | all`(기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`(기본값: `minimal`)

    참고:

    - `own`은 봇이 보낸 메시지에 대한 사용자 반응만 의미합니다(전송 메시지 캐시를 통한 최선의 처리).
    - 반응 이벤트는 여전히 Telegram 접근 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)를 따르며, 권한이 없는 발신자는 제외됩니다.
    - Telegram은 반응 업데이트에서 스레드 ID를 제공하지 않습니다.
      - 포럼이 아닌 그룹은 그룹 채팅 세션으로 라우팅됩니다
      - 포럼 그룹은 정확한 원래 토픽이 아니라 그룹 일반 토픽 세션(`:topic:1`)으로 라우팅됩니다

    폴링/Webhook의 `allowed_updates`에는 `message_reaction`이 자동으로 포함됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 전송합니다. `ackReactionScope`는 해당 이모지가 실제로 전송되는 *시점*을 결정합니다.

    **이모지(`ackReaction`) 결정 순서:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 폴백(`agents.list[].identity.emoji`, 아니면 "👀")

    참고:

    - Telegram은 유니코드 이모지(예: "👀")를 기대합니다.
    - 채널 또는 계정의 반응을 비활성화하려면 `""`를 사용하세요.

    **범위(`messages.ackReactionScope`):**

    Telegram 제공자는 `messages.ackReactionScope`에서 범위를 읽습니다(기본값 `"group-mentions"`). 현재 Telegram 계정 또는 Telegram 채널 수준 재정의는 없습니다.

    값: `"all"`(DM + 그룹), `"direct"`(DM만), `"group-all"`(모든 그룹 메시지, DM 제외), `"group-mentions"`(봇이 멘션된 그룹, **DM 제외** — 기본값), `"off"` / `"none"`(비활성화).

    <Note>
    기본 범위(`"group-mentions"`)는 직접 메시지에서 확인 반응을 실행하지 않습니다. 수신 Telegram DM에서 확인 반응을 받으려면 `messages.ackReactionScope`를 `"direct"` 또는 `"all"`로 설정하세요. 이 값은 Telegram 제공자 시작 시 읽히므로 변경 사항을 적용하려면 Gateway 재시작이 필요합니다.
    </Note>

  </Accordion>

  <Accordion title="Telegram 이벤트 및 명령의 구성 쓰기">
    채널 구성 쓰기는 기본적으로 활성화됩니다(`configWrites !== false`).

    Telegram에서 트리거되는 쓰기는 다음을 포함합니다.

    - `channels.telegram.groups`를 업데이트하기 위한 그룹 마이그레이션 이벤트(`migrate_to_chat_id`)
    - `/config set` 및 `/config unset`(명령 활성화 필요)

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

  <Accordion title="롱 폴링과 Webhook">
    기본값은 롱 폴링입니다. Webhook 모드의 경우 `channels.telegram.webhookUrl` 및 `channels.telegram.webhookSecret`을 설정하고, 선택적으로 `webhookPath`, `webhookHost`, `webhookPort`를 설정합니다(기본값 `/telegram-webhook`, `127.0.0.1`, `8787`).

    롱 폴링 모드에서 OpenClaw는 업데이트가 성공적으로 디스패치된 후에만 재시작 워터마크를 유지합니다. 핸들러가 실패하면 해당 업데이트는 같은 프로세스에서 다시 시도할 수 있는 상태로 남으며, 재시작 중복 제거를 위해 완료된 것으로 기록되지 않습니다.

    로컬 리스너는 `127.0.0.1:8787`에 바인딩됩니다. 공개 인그레스의 경우 로컬 포트 앞에 리버스 프록시를 두거나 의도적으로 `webhookHost: "0.0.0.0"`를 설정하세요.

    Webhook 모드는 Telegram에 `200`을 반환하기 전에 요청 가드, Telegram 시크릿 토큰, JSON 본문을 검증합니다.
    그런 다음 OpenClaw는 롱 폴링에서 사용하는 것과 동일한 채팅별/토픽별 봇 레인을 통해 업데이트를 비동기적으로 처리하므로, 느린 에이전트 턴이 Telegram의 전달 ACK를 붙잡아 두지 않습니다.

  </Accordion>

  <Accordion title="제한, 재시도 및 CLI 대상">
    - `channels.telegram.textChunkLimit` 기본값은 4000입니다.
    - `channels.telegram.chunkMode="newline"`은 길이 기준 분할 전에 문단 경계(빈 줄)를 우선합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)는 인바운드 및 아웃바운드 Telegram 미디어 크기를 제한합니다.
    - `channels.telegram.mediaGroupFlushMs`(기본값 500)는 Telegram 앨범/미디어 그룹을 OpenClaw가 하나의 인바운드 메시지로 디스패치하기 전에 얼마나 오래 버퍼링할지 제어합니다. 앨범 일부가 늦게 도착하면 값을 늘리고, 앨범 답장 지연을 줄이려면 값을 줄이세요.
    - `channels.telegram.timeoutSeconds`는 Telegram API 클라이언트 타임아웃을 재정의합니다(설정하지 않으면 grammY 기본값이 적용됨). 봇 클라이언트는 구성된 값이 60초 아웃바운드 텍스트/입력 중 요청 가드보다 낮으면 그 가드 아래로 클램프하여, OpenClaw의 전송 가드와 fallback이 실행되기 전에 grammY가 보이는 답장 전달을 중단하지 않도록 합니다. Long polling은 여전히 45초 `getUpdates` 요청 가드를 사용하므로 유휴 poll이 무기한 방치되지 않습니다.
    - `channels.telegram.pollingStallThresholdMs`의 기본값은 `120000`입니다. 오탐 polling-stall 재시작에 대해서만 `30000`에서 `600000` 사이로 조정하세요.
    - 그룹 컨텍스트 기록은 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`(기본값 50)을 사용합니다. `0`은 비활성화합니다.
    - reply/quote/forward 보충 컨텍스트는 Gateway가 상위 메시지를 관측한 경우 선택된 하나의 대화 컨텍스트 창으로 정규화됩니다. 관측된 메시지 캐시는 OpenClaw SQLite Plugin 상태에 저장되며, `openclaw doctor --fix`는 레거시 sidecar를 가져옵니다. Telegram은 업데이트에 얕은 `reply_to_message` 하나만 포함하므로, 캐시보다 오래된 체인은 Telegram의 현재 업데이트 payload로 제한됩니다.
    - Telegram allowlist는 주로 누가 agent를 트리거할 수 있는지를 제어하며, 전체 보충 컨텍스트 삭제 경계가 아닙니다.
    - DM 기록 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 구성은 복구 가능한 아웃바운드 API 오류에 대해 Telegram 전송 helper(CLI/tools/actions)에 적용됩니다. 인바운드 최종 답장 전달도 Telegram pre-connect 실패에 대해 제한된 safe-send 재시도를 사용하지만, 보이는 메시지를 중복시킬 수 있는 모호한 post-send 네트워크 envelope는 재시도하지 않습니다.

    CLI 및 message-tool 전송 대상은 숫자 채팅 ID, 사용자 이름 또는 포럼 topic 대상일 수 있습니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram poll은 `openclaw message poll`을 사용하며 포럼 topic을 지원합니다.

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 poll 플래그:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - 포럼 topic용 `--thread-id`(또는 `:topic:` 대상 사용)

    Telegram 전송은 다음도 지원합니다.

    - `channels.telegram.capabilities.inlineButtons`가 허용하는 경우 inline keyboard용 `buttons` 블록이 있는 `--presentation`
    - 봇이 해당 채팅에서 pin할 수 있을 때 pinned delivery를 요청하는 `--pin` 또는 `--delivery '{"pin":true}'`
    - 아웃바운드 이미지, GIF 및 동영상을 압축된 photo, animated-media 또는 video 업로드 대신 document로 보내는 `--force-document`

    작업 게이트:

    - `channels.telegram.actions.sendMessage=false`는 poll을 포함한 아웃바운드 Telegram 메시지를 비활성화합니다.
    - `channels.telegram.actions.poll=false`는 일반 전송은 활성화한 상태로 Telegram poll 생성을 비활성화합니다.

  </Accordion>

  <Accordion title="Telegram의 exec 승인">
    Telegram은 승인자 DM에서 exec 승인을 지원하며, 선택적으로 원본 채팅 또는 topic에 prompt를 게시할 수 있습니다. 승인자는 숫자 Telegram 사용자 ID여야 합니다.

    구성 경로:

    - `channels.telegram.execApprovals.enabled`(해석 가능한 승인자가 하나 이상 있으면 자동 활성화)
    - `channels.telegram.execApprovals.approvers`(`commands.ownerAllowFrom`의 숫자 owner ID로 fallback)
    - `channels.telegram.execApprovals.target`: `dm`(기본값) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` 및 `defaultTo`는 누가 봇과 대화할 수 있는지와 봇이 일반 답장을 어디로 보내는지를 제어합니다. 이 설정들이 누군가를 exec 승인자로 만들지는 않습니다. 아직 command owner가 없을 때 첫 번째 승인된 DM pairing이 `commands.ownerAllowFrom`을 bootstrapping하므로, 단일 owner 설정은 `execApprovals.approvers` 아래에 ID를 중복하지 않아도 계속 작동합니다.

    Channel 전달은 채팅에 command 텍스트를 표시합니다. 신뢰할 수 있는 그룹/topic에서만 `channel` 또는 `both`를 활성화하세요. prompt가 포럼 topic에 도착하면 OpenClaw는 승인 prompt와 후속 메시지에 해당 topic을 보존합니다. Exec 승인은 기본적으로 30분 후 만료됩니다.

    Inline 승인 버튼은 대상 surface(`dm`, `group` 또는 `all`)를 허용하도록 `channels.telegram.capabilities.inlineButtons`도 필요로 합니다. `plugin:` 접두사가 붙은 승인 ID는 Plugin 승인을 통해 해석되고, 그 외 항목은 exec 승인을 먼저 통해 해석됩니다.

    [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 오류 답장 제어

agent가 전달 또는 provider 오류를 만나면, 오류 정책은 오류 메시지를 Telegram 채팅으로 보낼지 여부를 제어합니다.

| 키                                  | 값                         | 기본값          | 설명                                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 모든 오류 메시지를 채팅으로 보냅니다. `once` — 각 고유 오류 메시지를 cooldown window당 한 번만 보냅니다(반복되는 동일 오류 억제). `silent` — 오류 메시지를 채팅으로 보내지 않습니다. |
| `channels.telegram.errorCooldownMs` | 숫자(ms)                   | `14400000`(4h)  | `once` 정책의 cooldown window입니다. 오류가 전송된 후 동일한 오류 메시지는 이 간격이 지날 때까지 억제됩니다. 장애 중 오류 spam을 방지합니다.                                      |

계정별, 그룹별, topic별 재정의가 지원됩니다(다른 Telegram 구성 키와 동일한 상속).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## 문제 해결

<AccordionGroup>
  <Accordion title="봇이 멘션 없는 그룹 메시지에 응답하지 않음">

    - `requireMention=false`인 경우 Telegram privacy mode가 전체 가시성을 허용해야 합니다.
      - BotFather: `/setprivacy` -> 비활성화
      - 그런 다음 그룹에서 봇을 제거하고 다시 추가
    - `openclaw channels status`는 구성이 멘션 없는 그룹 메시지를 기대할 때 경고합니다.
    - `openclaw channels status --probe`는 명시적인 숫자 그룹 ID를 확인할 수 있습니다. wildcard `"*"`는 멤버십 probe를 할 수 없습니다.
    - 빠른 session 테스트: `/activation always`.

  </Accordion>

  <Accordion title="봇이 그룹 메시지를 전혀 보지 못함">

    - `channels.telegram.groups`가 있으면 그룹이 목록에 있어야 합니다(또는 `"*"` 포함).
    - 그룹 내 봇 멤버십 확인
    - 로그 검토: skip 이유를 보려면 `openclaw logs --follow`

  </Accordion>

  <Accordion title="Command가 부분적으로만 작동하거나 전혀 작동하지 않음">

    - sender identity를 승인하세요(pairing 및/또는 숫자 `allowFrom`).
    - 그룹 정책이 `open`이어도 command 권한 부여는 계속 적용됩니다.
    - `BOT_COMMANDS_TOO_MUCH`와 함께 `setMyCommands failed`가 표시되면 native menu 항목이 너무 많다는 뜻입니다. Plugin/skill/custom command를 줄이거나 native menu를 비활성화하세요.
    - 시작 시 `deleteMyCommands` / `setMyCommands` 호출과 `sendChatAction` typing 호출은 제한되며, 요청 타임아웃 시 Telegram의 전송 fallback을 통해 한 번 재시도합니다. 지속적인 network/fetch 오류는 보통 `api.telegram.org`에 대한 DNS/HTTPS 도달성 문제를 나타냅니다.

  </Accordion>

  <Accordion title="시작 시 승인되지 않은 토큰이 보고됨">

    - `getMe returned 401`은 구성된 봇 토큰에 대한 Telegram 인증 실패입니다.
    - BotFather에서 봇 토큰을 다시 복사하거나 재생성한 다음, 기본 계정에 대해 `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` 또는 `TELEGRAM_BOT_TOKEN`을 업데이트하세요.
    - 시작 중 `deleteWebhook 401 Unauthorized`도 auth 실패입니다. 이를 "Webhook이 없음"으로 처리하면 동일한 잘못된 토큰 실패가 이후 API 호출로 지연될 뿐입니다.

  </Accordion>

  <Accordion title="Polling 또는 네트워크 불안정성">

    - Node 22+ 및 custom fetch/proxy는 AbortSignal 타입이 일치하지 않으면 즉시 abort 동작을 유발할 수 있습니다.
    - 일부 host는 `api.telegram.org`를 IPv6로 먼저 해석합니다. 손상된 IPv6 egress는 간헐적인 Telegram API 실패를 일으킬 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 포함되면, OpenClaw는 이제 이를 복구 가능한 네트워크 오류로 재시도합니다.
    - polling 시작 중 OpenClaw는 grammY를 위해 성공한 startup `getMe` probe를 재사용하므로 runner는 첫 번째 `getUpdates` 전에 두 번째 `getMe`가 필요하지 않습니다.
    - polling 시작 중 일시적인 네트워크 오류로 `deleteWebhook`이 실패하면, OpenClaw는 다른 pre-poll control-plane 호출을 하지 않고 long polling으로 계속 진행합니다. 여전히 활성 상태인 Webhook은 `getUpdates` conflict로 드러납니다. 그러면 OpenClaw가 Telegram transport를 다시 빌드하고 Webhook 정리를 재시도합니다.
    - Telegram socket이 짧은 고정 주기로 recycle되면 낮은 `channels.telegram.timeoutSeconds`가 있는지 확인하세요. 봇 클라이언트는 구성된 값을 아웃바운드 및 `getUpdates` 요청 가드 아래로 클램프하지만, 이전 릴리스에서는 이 값이 해당 가드보다 낮게 설정되었을 때 모든 poll 또는 답장을 abort할 수 있었습니다.
    - 로그에 `Polling stall detected`가 포함되면, OpenClaw는 기본적으로 완료된 long-poll liveness 없이 120초가 지난 후 polling을 재시작하고 Telegram transport를 다시 빌드합니다.
    - `openclaw channels status --probe` 및 `openclaw doctor`는 실행 중인 polling 계정이 startup grace 후 `getUpdates`를 완료하지 않았거나, 실행 중인 Webhook 계정이 startup grace 후 `setWebhook`을 완료하지 않았거나, 마지막 성공 polling transport 활동이 오래된 경우 경고합니다.
    - 장시간 실행되는 `getUpdates` 호출이 정상인데 host가 여전히 오탐 polling-stall 재시작을 보고할 때만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 지속적인 stall은 보통 host와 `api.telegram.org` 사이의 proxy, DNS, IPv6 또는 TLS egress 문제를 가리킵니다.
    - Telegram은 Bot API transport에 대해 `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` 및 해당 소문자 변형을 포함한 process proxy env도 따릅니다. `NO_PROXY` / `no_proxy`는 여전히 `api.telegram.org`를 우회할 수 있습니다.
    - service environment에 대해 OpenClaw 관리 proxy가 `OPENCLAW_PROXY_URL`로 구성되어 있고 표준 proxy env가 없는 경우, Telegram도 해당 URL을 Bot API transport에 사용합니다.
    - 직접 egress/TLS가 불안정한 VPS host에서는 Telegram API 호출을 `channels.telegram.proxy`를 통해 route하세요.

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+는 기본적으로 `autoSelectFamily=true`를 사용합니다(WSL2 제외). Telegram DNS 결과 순서는 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, 그다음 `channels.telegram.network.dnsResultOrder`, 그다음 `NODE_OPTIONS=--dns-result-order=ipv4first` 같은 프로세스 기본값을 따릅니다. 적용되는 항목이 없으면 Node 22+는 `ipv4first`로 폴백합니다.
    - 호스트가 WSL2이거나 IPv4 전용 동작이 명시적으로 더 잘 맞는 경우, 패밀리 선택을 강제하세요.

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 벤치마크 범위 응답(`198.18.0.0/15`)은 기본적으로 Telegram 미디어 다운로드에 이미 허용됩니다. 신뢰할 수 있는 fake-IP 또는 투명 프록시가 미디어 다운로드 중 `api.telegram.org`를 다른
      private/internal/special-use 주소로 다시 쓰는 경우, Telegram 전용 우회를
      옵트인할 수 있습니다.

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 동일한 옵트인은 계정별로
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`에서 사용할 수 있습니다.
    - 프록시가 Telegram 미디어 호스트를 `198.18.x.x`로 해석하는 경우, 먼저
      위험 플래그를 꺼 둡니다. Telegram 미디어는 기본적으로 RFC 2544
      벤치마크 범위를 이미 허용합니다.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`는 Telegram
      미디어 SSRF 보호를 약화합니다. RFC 2544 벤치마크 범위 밖의 private 또는 special-use 응답을 합성하는 Clash, Mihomo, Surge fake-IP 라우팅 같은 신뢰할 수 있는 운영자 제어 프록시
      환경에서만 사용하세요. 일반 공개 인터넷 Telegram 액세스에는 꺼 두세요.
    </Warning>

    - 환경 재정의(임시):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 응답을 검증합니다.

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

추가 도움말: [채널 문제 해결](/ko/channels/troubleshooting).

## 구성 참조

기본 참조: [구성 참조 - Telegram](/ko/gateway/config-channels#telegram).

<Accordion title="중요도가 높은 Telegram 필드">

- 시작/인증: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile`은 일반 파일을 가리켜야 하며, 심볼릭 링크는 거부됩니다)
- 액세스 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]` (`type: "acp"`)
- 토픽 기본값: `groups.<chatId>.topics."*"`는 일치하지 않는 포럼 토픽에 적용되며, 정확한 토픽 ID가 이를 재정의합니다
- 실행 승인: `execApprovals`, `accounts.*.execApprovals`
- 명령/메뉴: `commands.native`, `commands.nativeSkills`, `customCommands`
- 스레딩/답장: `replyToMode`
- 스트리밍: `streaming`(미리 보기), `streaming.preview.toolProgress`, `blockStreaming`
- 서식/전달: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- 미디어/네트워크: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- 사용자 지정 API 루트: `apiRoot`(Bot API 루트만 해당, `/bot<TOKEN>`을 포함하지 마세요)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- 작업/기능: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 반응: `reactionNotifications`, `reactionLevel`
- 오류: `errorPolicy`, `errorCooldownMs`
- 쓰기/기록: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
다중 계정 우선순위: 두 개 이상의 계정 ID가 구성된 경우 기본 라우팅을 명시하려면 `channels.telegram.defaultAccount`를 설정하거나 `channels.telegram.accounts.default`를 포함하세요. 그렇지 않으면 OpenClaw는 첫 번째 정규화된 계정 ID로 폴백하고 `openclaw doctor`가 경고합니다. 이름이 지정된 계정은 `channels.telegram.allowFrom` / `groupAllowFrom`을 상속하지만, `accounts.default.*` 값은 상속하지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram 사용자를 Gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 및 토픽 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델과 강화입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    그룹과 토픽을 에이전트에 매핑합니다.
  </Card>
  <Card title="문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단입니다.
  </Card>
</CardGroup>
