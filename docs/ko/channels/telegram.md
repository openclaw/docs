---
read_when:
    - Telegram 기능 또는 Webhook 작업하기
summary: Telegram 봇 지원 상태, 기능 및 구성
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

grammY를 통해 봇 DMs 및 그룹에 대해 프로덕션 준비가 완료되었습니다. 롱 폴링이 기본 모드이며, Webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예제입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 봇 토큰 만들기">
    Telegram을 열고 **@BotFather**와 채팅하세요(핸들이 정확히 `@BotFather`인지 확인하세요).

    `/newbot`을 실행하고, 안내에 따라 진행한 뒤 토큰을 저장하세요.

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

    Env 대체값: `TELEGRAM_BOT_TOKEN=...` (기본 계정 전용).
    Telegram은 `openclaw channels login telegram`을 사용하지 않습니다. config/env에 토큰을 구성한 다음 gateway를 시작하세요.

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
    그룹에 봇을 추가한 다음, 접근 모델에 맞게 `channels.telegram.groups` 및 `groupPolicy`를 설정하세요.
  </Step>
</Steps>

<Note>
토큰 확인 순서는 계정을 인식합니다. 실제로는 config 값이 env 대체값보다 우선하며, `TELEGRAM_BOT_TOKEN`은 기본 계정에만 적용됩니다.
</Note>

## Telegram 측 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드 및 그룹 가시성">
    Telegram 봇은 기본적으로 **개인정보 보호 모드**가 활성화되어 있으며, 이 모드는 봇이 수신하는 그룹 메시지를 제한합니다.

    봇이 모든 그룹 메시지를 확인해야 한다면 다음 중 하나를 수행하세요:

    - `/setprivacy`를 통해 개인정보 보호 모드를 비활성화하거나
    - 봇을 그룹 관리자로 지정합니다.

    개인정보 보호 모드를 전환할 때는 Telegram이 변경 사항을 적용할 수 있도록 각 그룹에서 봇을 제거했다가 다시 추가하세요.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어됩니다.

    관리자 봇은 모든 그룹 메시지를 수신하므로, 항상 켜져 있는 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="유용한 BotFather 토글">

    - 그룹 추가 허용/거부용 `/setjoingroups`
    - 그룹 가시성 동작용 `/setprivacy`

  </Accordion>
</AccordionGroup>

## 접근 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`는 다이렉트 메시지 접근을 제어합니다:

    - `pairing` (기본값)
    - `allowlist` (`allowFrom`에 최소 하나의 발신자 ID 필요)
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `channels.telegram.allowFrom`은 숫자형 Telegram 사용자 ID를 허용합니다. `telegram:` / `tg:` 접두사는 허용되며 정규화됩니다.
    `allowFrom`이 비어 있는 `dmPolicy: "allowlist"`는 모든 DMs를 차단하며 config 검증에서 거부됩니다.
    설정은 숫자형 사용자 ID만 요청합니다.
    업그레이드 후 config에 `@username` 허용 목록 항목이 포함되어 있다면, `openclaw doctor --fix`를 실행해 이를 해석하세요(최선의 노력 기준이며, Telegram 봇 토큰이 필요합니다).
    이전에 페어링 저장소 허용 목록 파일에 의존했다면, `openclaw doctor --fix`는 허용 목록 흐름에서 항목을 `channels.telegram.allowFrom`으로 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없는 경우).

    단일 소유자 봇의 경우, 이전 페어링 승인에 의존하는 대신 접근 정책을 config에 내구성 있게 유지하려면 명시적인 숫자형 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 사용하는 것이 좋습니다.

    흔한 혼동: DM 페어링 승인은 "이 발신자가 어디서나 권한이 있다"는 뜻이 아닙니다.
    페어링은 DM 접근만 부여합니다. 그룹 발신자 권한 부여는 여전히 명시적인 config 허용 목록에서 가져옵니다.
    "한 번 권한을 부여하면 DMs와 그룹 명령이 모두 동작하게" 하려면, 숫자형 Telegram 사용자 ID를 `channels.telegram.allowFrom`에 넣으세요.

    ### Telegram 사용자 ID 찾기

    더 안전한 방법(서드파티 봇 없음):

    1. 봇에 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    공식 Bot API 방법:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    서드파티 방법(개인정보 보호 측면에서 덜 안전함): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책 및 허용 목록">
    두 가지 제어가 함께 적용됩니다:

    1. **어떤 그룹이 허용되는지** (`channels.telegram.groups`)
       - `groups` config 없음:
         - `groupPolicy: "open"`인 경우: 모든 그룹이 그룹 ID 검사에 통과할 수 있음
         - `groupPolicy: "allowlist"`(기본값)인 경우: `groups` 항목(또는 `"*"`)을 추가할 때까지 그룹이 차단됨
       - `groups`가 구성된 경우: 허용 목록으로 동작함(명시적 ID 또는 `"*"`)

    2. **그룹 내에서 어떤 발신자가 허용되는지** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (기본값)
       - `disabled`

    `groupAllowFrom`은 그룹 발신자 필터링에 사용됩니다. 설정되지 않으면 Telegram은 `allowFrom`으로 대체합니다.
    `groupAllowFrom` 항목은 숫자형 Telegram 사용자 ID여야 합니다(`telegram:` / `tg:` 접두사는 정규화됨).
    Telegram 그룹 또는 슈퍼그룹 채팅 ID를 `groupAllowFrom`에 넣지 마세요. 음수 채팅 ID는 `channels.telegram.groups` 아래에 있어야 합니다.
    숫자가 아닌 항목은 발신자 권한 부여에서 무시됩니다.
    보안 경계 (`2026.2.25+`): 그룹 발신자 인증은 DM 페어링 저장소 승인을 상속하지 **않습니다**.
    페어링은 DM 전용으로 유지됩니다. 그룹의 경우 `groupAllowFrom` 또는 그룹별/토픽별 `allowFrom`을 설정하세요.
    `groupAllowFrom`이 설정되지 않으면 Telegram은 페어링 저장소가 아니라 config `allowFrom`으로 대체합니다.
    단일 소유자 봇을 위한 실용적인 패턴: 사용자 ID를 `channels.telegram.allowFrom`에 설정하고, `groupAllowFrom`은 설정하지 않은 채, 대상 그룹을 `channels.telegram.groups` 아래에서 허용하세요.
    런타임 참고: `channels.telegram`이 완전히 누락된 경우, `channels.defaults.groupPolicy`가 명시적으로 설정되지 않는 한 런타임 기본값은 실패 시 차단하는 `groupPolicy="allowlist"`입니다.

    예시: 특정 그룹 하나에서 모든 멤버 허용:

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

    예시: 특정 그룹 하나 안에서 특정 사용자만 허용:

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
      - 허용된 그룹 안에서 어떤 사람이 봇을 트리거할 수 있는지 제한하려면 `8734062810` 같은 Telegram 사용자 ID를 `groupAllowFrom` 아래에 넣으세요.
      - 허용된 그룹의 모든 멤버가 봇과 대화할 수 있게 하려는 경우에만 `groupAllowFrom: ["*"]`를 사용하세요.

    </Warning>

  </Tab>

  <Tab title="멘션 동작">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션은 다음에서 올 수 있습니다:

    - 네이티브 `@botusername` 멘션, 또는
    - 다음의 멘션 패턴:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    세션 수준 명령 토글:

    - `/activation always`
    - `/activation mention`

    이는 세션 상태만 업데이트합니다. 지속성을 원하면 config를 사용하세요.

    지속적인 config 예시:

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

    그룹 채팅 ID 가져오기:

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`으로 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 읽기
    - 또는 Bot API `getUpdates` 확인

  </Tab>
</Tabs>

## 런타임 동작

- Telegram은 gateway 프로세스가 소유합니다.
- 라우팅은 결정적입니다: Telegram 인바운드 응답은 다시 Telegram으로 응답합니다(모델이 채널을 선택하지 않음).
- 인바운드 메시지는 답장 메타데이터와 미디어 플레이스홀더를 포함한 공유 채널 엔벌로프로 정규화됩니다.
- 그룹 세션은 그룹 ID별로 격리됩니다. 포럼 토픽은 격리를 유지하기 위해 `:topic:<threadId>`를 추가합니다.
- DM 메시지는 `message_thread_id`를 포함할 수 있으며, OpenClaw는 이를 스레드 인식 세션 키로 라우팅하고 답장을 위해 스레드 ID를 유지합니다.
- 롱 폴링은 채팅별/스레드별 순차 처리가 있는 grammY runner를 사용합니다. 전체 runner sink 동시성은 `agents.defaults.maxConcurrent`를 사용합니다.
- 롱 폴링은 각 gateway 프로세스 내부에서 보호되므로 한 번에 하나의 활성 poller만 하나의 봇 토큰을 사용할 수 있습니다. 여전히 `getUpdates` 409 충돌이 보인다면, 다른 OpenClaw gateway, 스크립트 또는 외부 poller가 동일한 토큰을 사용 중일 가능성이 높습니다.
- 롱 폴링 watchdog 재시작은 기본적으로 완료된 `getUpdates` 라이브니스가 120초 동안 없으면 트리거됩니다. 장시간 실행 작업 중에도 배포 환경에서 잘못된 polling-stall 재시작이 계속 발생하는 경우에만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 값은 밀리초 단위이며 `30000`에서 `600000`까지 허용되고, 계정별 재정의도 지원됩니다.
- Telegram Bot API는 읽음 확인을 지원하지 않습니다(`sendReadReceipts`는 적용되지 않음).

## 기능 참조

<AccordionGroup>
  <Accordion title="실시간 스트림 미리보기 (메시지 편집)">
    OpenClaw는 부분 응답을 실시간으로 스트리밍할 수 있습니다:

    - 다이렉트 채팅: 미리보기 메시지 + `editMessageText`
    - 그룹/토픽: 미리보기 메시지 + `editMessageText`

    요구 사항:

    - `channels.telegram.streaming`은 `off | partial | block | progress`입니다(기본값: `partial`)
    - `progress`는 Telegram에서 `partial`에 매핑됩니다(채널 간 명명 호환성용)
    - `streaming.preview.toolProgress`는 도구/진행률 업데이트가 동일한 편집된 미리보기 메시지를 재사용할지 제어합니다(기본값: 미리보기 스트리밍이 활성화된 경우 `true`)
    - 레거시 `channels.telegram.streamMode` 및 불리언 `streaming` 값은 감지되며, `openclaw doctor --fix`를 실행하면 이를 `channels.telegram.streaming.mode`로 마이그레이션합니다

    도구 진행률 미리보기 업데이트는 도구 실행 중 표시되는 짧은 "Working..." 줄로, 예를 들면 명령 실행, 파일 읽기, 계획 업데이트 또는 패치 요약 중에 나타납니다. Telegram은 `v2026.4.22` 이후 릴리스된 OpenClaw 동작과 일치하도록 이를 기본적으로 활성화합니다. 답변 텍스트에는 편집된 미리보기를 유지하되 도구 진행률 줄은 숨기려면 다음과 같이 설정하세요:

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

    Telegram 미리보기 편집을 완전히 비활성화하려는 경우에만 `streaming.mode: "off"`를 사용하세요. 도구 진행률 상태 줄만 비활성화하려는 경우에는 `streaming.preview.toolProgress: false`를 사용하세요.

    텍스트 전용 응답의 경우:

    - DM: OpenClaw는 동일한 미리보기 메시지를 유지하고 제자리에서 최종 편집을 수행합니다(두 번째 메시지 없음)
    - 그룹/토픽: OpenClaw는 동일한 미리보기 메시지를 유지하고 제자리에서 최종 편집을 수행합니다(두 번째 메시지 없음)

    복잡한 응답(예: 미디어 페이로드)의 경우 OpenClaw는 일반적인 최종 전달로 대체한 뒤 미리보기 메시지를 정리합니다.

    미리보기 스트리밍은 블록 스트리밍과 별개입니다. Telegram에 대해 블록 스트리밍이 명시적으로 활성화되면, OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

    네이티브 초안 전송을 사용할 수 없거나 거부되면, OpenClaw는 자동으로 `sendMessage` + `editMessageText`로 대체합니다.

    Telegram 전용 추론 스트림:

    - `/reasoning stream`은 생성 중 추론을 실시간 미리보기에 전송합니다
    - 최종 답변은 추론 텍스트 없이 전송됩니다

  </Accordion>

  <Accordion title="서식 지정 및 HTML 대체">
    아웃바운드 텍스트는 Telegram `parse_mode: "HTML"`을 사용합니다.

    - Markdown 스타일 텍스트는 Telegram 안전 HTML로 렌더링됩니다.
    - 원시 모델 HTML은 Telegram 파싱 실패를 줄이기 위해 이스케이프됩니다.
    - Telegram이 파싱된 HTML을 거부하면, OpenClaw는 일반 텍스트로 다시 시도합니다.

    링크 미리보기는 기본적으로 활성화되어 있으며 `channels.telegram.linkPreview: false`로 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="네이티브 명령 및 사용자 지정 명령">
    Telegram 명령 메뉴 등록은 시작 시 `setMyCommands`로 처리됩니다.

    네이티브 명령 기본값:

    - `commands.native: "auto"`는 Telegram에 대해 네이티브 명령을 활성화합니다

    사용자 지정 명령 메뉴 항목 추가:

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

    규칙:

    - 이름은 정규화됩니다(선행 `/` 제거, 소문자화)
    - 유효한 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - 사용자 지정 명령은 네이티브 명령을 재정의할 수 없습니다
    - 충돌/중복은 건너뛰고 로그에 기록됩니다

    참고 사항:

    - 사용자 지정 명령은 메뉴 항목일 뿐이며, 동작을 자동 구현하지는 않습니다
    - Telegram 메뉴에 표시되지 않더라도 Plugin/Skills 명령은 입력하면 계속 동작할 수 있습니다

    네이티브 명령이 비활성화되면 기본 제공 명령은 제거됩니다. 사용자 지정/Plugin 명령은 구성되어 있으면 계속 등록될 수 있습니다.

    일반적인 설정 실패:

    - `setMyCommands failed`와 함께 `BOT_COMMANDS_TOO_MUCH`가 발생하면, 잘라낸 후에도 Telegram 메뉴가 여전히 초과된 것입니다. Plugin/Skills/사용자 지정 명령 수를 줄이거나 `channels.telegram.commands.native`를 비활성화하세요.
    - `setMyCommands failed`와 함께 네트워크/fetch 오류가 발생하면, 일반적으로 `api.telegram.org`로의 아웃바운드 DNS/HTTPS가 차단된 것입니다.

    ### 디바이스 페어링 명령 (`device-pair` Plugin)

    `device-pair` Plugin이 설치되어 있을 때:

    1. `/pair`가 설정 코드를 생성합니다
    2. iOS 앱에 코드를 붙여넣습니다
    3. `/pair pending`이 보류 중인 요청 목록을 표시합니다(역할/범위 포함)
    4. 요청을 승인합니다:
       - 명시적 승인을 위한 `/pair approve <requestId>`
       - 보류 중인 요청이 하나뿐일 때 `/pair approve`
       - 가장 최근 요청에 대한 `/pair approve latest`

    설정 코드는 짧은 수명의 bootstrap 토큰을 담고 있습니다. 기본 제공 bootstrap handoff는 기본 Node 토큰을 `scopes: []`로 유지하며, 전달된 모든 operator 토큰은 `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`로 제한됩니다. Bootstrap 범위 검사는 역할 접두사를 사용하므로, 해당 operator 허용 목록은 operator 요청만 충족하며, operator가 아닌 역할은 여전히 자체 역할 접두사 아래의 범위가 필요합니다.

    디바이스가 변경된 인증 세부 정보(예: 역할/범위/공개 키)로 재시도하면, 이전 보류 요청은 대체되고 새 요청은 다른 `requestId`를 사용합니다. 승인 전에 `/pair pending`을 다시 실행하세요.

    자세한 내용: [페어링](/ko/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="인라인 버튼">
    인라인 키보드 범위 구성:

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
    - `allowlist` (기본값)

    기존 `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`로 매핑됩니다.

    메시지 작업 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "옵션을 선택하세요:",
  buttons: [
    [
      { text: "예", callback_data: "yes" },
      { text: "아니요", callback_data: "no" },
    ],
    [{ text: "취소", callback_data: "cancel" }],
  ],
}
```

    콜백 클릭은 텍스트로 에이전트에 전달됩니다:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="에이전트 및 자동화를 위한 Telegram 메시지 작업">
    Telegram 도구 작업에는 다음이 포함됩니다:

    - `sendMessage` (`to`, `content`, 선택적 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, 선택적 `iconColor`, `iconCustomEmojiId`)

    채널 메시지 작업은 사용하기 쉬운 별칭을 제공합니다 (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    게이팅 제어:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (기본값: 비활성화)

    참고: `edit` 및 `topic-create`는 현재 기본적으로 활성화되어 있으며 별도의 `channels.telegram.actions.*` 토글이 없습니다.
    런타임 전송은 활성 config/secrets 스냅샷(시작/리로드 시점)을 사용하므로, 작업 경로는 전송마다 임시 `SecretRef` 재확인을 수행하지 않습니다.

    반응 제거 의미 체계: [/tools/reactions](/ko/tools/reactions)

  </Accordion>

  <Accordion title="답장 스레딩 태그">
    Telegram은 생성된 출력에서 명시적 답장 스레딩 태그를 지원합니다:

    - `[[reply_to_current]]`는 트리거한 메시지에 답장합니다
    - `[[reply_to:<id>]]`는 특정 Telegram 메시지 ID에 답장합니다

    `channels.telegram.replyToMode`는 처리 방식을 제어합니다:

    - `off` (기본값)
    - `first`
    - `all`

    답장 스레딩이 활성화되어 있고 원래 Telegram 텍스트나 캡션을 사용할 수 있는 경우, OpenClaw는 네이티브 Telegram 인용 발췌를 자동으로 포함합니다. Telegram은 네이티브 인용 텍스트를 1024 UTF-16 코드 단위로 제한하므로, 더 긴 메시지는 앞부분부터 인용되며 Telegram이 인용을 거부하면 일반 답장으로 대체됩니다.

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적인 `[[reply_to_*]]` 태그는 여전히 적용됩니다.

  </Accordion>

  <Accordion title="포럼 토픽 및 스레드 동작">
    포럼 슈퍼그룹:

    - 토픽 세션 키는 `:topic:<threadId>`를 추가합니다
    - 답장과 입력 중 표시가 해당 토픽 스레드를 대상으로 합니다
    - 토픽 config 경로:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    일반 토픽(`threadId=1`) 특수 처리:

    - 메시지 전송은 `message_thread_id`를 생략합니다(Telegram은 `sendMessage(...thread_id=1)`을 거부함)
    - 입력 중 표시 작업은 여전히 `message_thread_id`를 포함합니다

    토픽 상속: 토픽 항목은 재정의되지 않는 한 그룹 설정을 상속합니다(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId`는 토픽 전용이며 그룹 기본값에서 상속되지 않습니다.

    **토픽별 에이전트 라우팅**: 각 토픽은 토픽 config에서 `agentId`를 설정하여 서로 다른 에이전트로 라우팅할 수 있습니다. 이렇게 하면 각 토픽은 자체적으로 격리된 작업공간, 메모리, 세션을 갖게 됩니다. 예시:

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

    그러면 각 토픽은 자체 세션 키를 갖습니다: `agent:zu:telegram:group:-1001234567890:topic:3`

    **영구 ACP 토픽 바인딩**: 포럼 토픽은 최상위 타입 지정 ACP 바인딩(`bindings[]`에서 `type: "acp"`를 사용하고 `match.channel: "telegram"`, `peer.kind: "group"`, 그리고 `-1001234567890:topic:42` 같은 토픽 한정 id를 사용)을 통해 ACP 하니스 세션을 고정할 수 있습니다. 현재는 그룹/슈퍼그룹의 포럼 토픽 범위로 제한됩니다. [ACP Agents](/ko/tools/acp-agents)를 참조하세요.

    **채팅에서의 스레드 바인딩 ACP 생성**: `/acp spawn <agent> --thread here|auto`는 현재 토픽을 새 ACP 세션에 바인딩하며, 후속 메시지는 그곳으로 직접 라우팅됩니다. OpenClaw는 생성 확인 메시지를 토픽 내에 고정합니다. `channels.telegram.threadBindings.spawnAcpSessions=true`가 필요합니다.

    템플릿 컨텍스트는 `MessageThreadId` 및 `IsForum`을 노출합니다. `message_thread_id`가 있는 DM 채팅은 DM 라우팅을 유지하지만 스레드 인식 세션 키를 사용합니다.

  </Accordion>

  <Accordion title="오디오, 비디오 및 스티커">
    ### 오디오 메시지

    Telegram은 음성 노트와 오디오 파일을 구분합니다.

    - 기본값: 오디오 파일 동작
    - 에이전트 응답에 `[[audio_as_voice]]` 태그를 넣으면 음성 노트 전송을 강제
    - 인바운드 음성 노트 전사는 에이전트 컨텍스트에서 기계 생성,
      신뢰할 수 없는 텍스트로 프레이밍됩니다. 멘션 감지는 여전히 원본
      전사를 사용하므로 멘션 게이팅된 음성 메시지도 계속 동작합니다.

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

    메시지 작업 예시:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    비디오 노트는 캡션을 지원하지 않으므로, 제공된 메시지 텍스트는 별도로 전송됩니다.

    ### 스티커

    인바운드 스티커 처리:

    - 정적 WEBP: 다운로드 및 처리됨(플레이스홀더 `<media:sticker>`)
    - 애니메이션 TGS: 건너뜀
    - 비디오 WEBM: 건너뜀

    스티커 컨텍스트 필드:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    스티커 캐시 파일:

    - `~/.openclaw/telegram/sticker-cache.json`

    스티커는 반복적인 비전 호출을 줄이기 위해 가능한 경우 한 번 설명되고 캐시됩니다.

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

    스티커 전송 작업:

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
    Telegram 반응은 `message_reaction` 업데이트로 도착합니다(메시지 페이로드와 별도).

    활성화되면 OpenClaw는 다음과 같은 시스템 이벤트를 대기열에 넣습니다:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (기본값: `minimal`)

    참고 사항:

    - `own`은 봇이 보낸 메시지에 대한 사용자 반응만 의미합니다(전송된 메시지 캐시를 통한 최선의 노력 방식).
    - 반응 이벤트는 여전히 Telegram 접근 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)를 따르며, 권한이 없는 발신자는 버려집니다.
    - Telegram은 반응 업데이트에 스레드 ID를 제공하지 않습니다.
      - 비포럼 그룹은 그룹 채팅 세션으로 라우팅됨
      - 포럼 그룹은 정확한 원본 토픽이 아니라 그룹 일반 토픽 세션(`:topic:1`)으로 라우팅됨

    폴링/Webhook용 `allowed_updates`에는 자동으로 `message_reaction`이 포함됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인 이모지를 전송합니다.

    해결 순서:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 에이전트 아이덴티티 이모지 대체값 (`agents.list[].identity.emoji`, 없으면 "👀")

    참고 사항:

    - Telegram은 유니코드 이모지(예: "👀")를 기대합니다.
    - 채널 또는 계정에 대한 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Telegram 이벤트 및 명령에서의 config 쓰기">
    채널 config 쓰기는 기본적으로 활성화되어 있습니다 (`configWrites !== false`).

    Telegram 트리거 쓰기에는 다음이 포함됩니다:

    - `channels.telegram.groups`를 업데이트하기 위한 그룹 마이그레이션 이벤트 (`migrate_to_chat_id`)
    - `/config set` 및 `/config unset` (명령 활성화 필요)

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

  <Accordion title="롱 폴링 vs Webhook">
    기본값은 롱 폴링입니다. Webhook 모드에서는 `channels.telegram.webhookUrl` 및 `channels.telegram.webhookSecret`를 설정하고, 선택적으로 `webhookPath`, `webhookHost`, `webhookPort`를 설정합니다(기본값 `/telegram-webhook`, `127.0.0.1`, `8787`).

    로컬 리스너는 `127.0.0.1:8787`에 바인딩됩니다. 공개 인그레스를 위해서는 로컬 포트 앞에 리버스 프록시를 두거나, 의도적으로 `webhookHost: "0.0.0.0"`을 설정하세요.

    Webhook 모드는 Telegram에 `200`을 반환하기 전에 요청 가드, Telegram 시크릿 토큰, JSON 본문을 검증합니다.
    이후 OpenClaw는 동일한 채팅별/토픽별 봇 레인을 통해 업데이트를 비동기적으로 처리하므로, 느린 에이전트 턴이 Telegram의 전달 ACK를 붙잡아 두지 않습니다.

  </Accordion>

  <Accordion title="제한, 재시도 및 CLI 대상">
    - `channels.telegram.textChunkLimit`의 기본값은 4000입니다.
    - `channels.telegram.chunkMode="newline"`은 길이 기준 분할 전에 문단 경계(빈 줄)를 우선합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)는 인바운드 및 아웃바운드 Telegram 미디어 크기의 상한을 둡니다.
    - `channels.telegram.timeoutSeconds`는 Telegram API 클라이언트 타임아웃을 재정의합니다(설정되지 않으면 grammY 기본값 적용).
    - `channels.telegram.pollingStallThresholdMs`의 기본값은 `120000`이며, 잘못된 polling-stall 재시작이 발생할 때만 `30000`에서 `600000` 사이로 조정하세요.
    - 그룹 컨텍스트 기록은 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`를 사용합니다(기본값 50). `0`은 비활성화입니다.
    - 답장/인용/전달 보조 컨텍스트는 현재 수신된 그대로 전달됩니다.
    - Telegram 허용 목록은 주로 누가 에이전트를 트리거할 수 있는지를 제한하며, 완전한 보조 컨텍스트 마스킹 경계는 아닙니다.
    - DM 기록 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config는 복구 가능한 아웃바운드 API 오류에 대해 Telegram 전송 헬퍼(CLI/도구/작업)에 적용됩니다.

    CLI 전송 대상은 숫자형 채팅 ID 또는 사용자 이름일 수 있습니다:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 폴링은 `openclaw message poll`을 사용하며 포럼 토픽을 지원합니다:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 폴링 플래그:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - 포럼 토픽용 `--thread-id`(또는 `:topic:` 대상 사용)

    Telegram 전송은 다음도 지원합니다:

    - `channels.telegram.capabilities.inlineButtons`가 허용하는 경우, 인라인 키보드용 `buttons` 블록이 포함된 `--presentation`
    - 해당 채팅에서 봇이 고정할 수 있을 때 고정 전달을 요청하는 `--pin` 또는 `--delivery '{"pin":true}'`
    - 아웃바운드 이미지와 GIF를 압축된 사진이나 애니메이션 미디어 업로드 대신 문서로 전송하는 `--force-document`

    작업 게이팅:

    - `channels.telegram.actions.sendMessage=false`는 폴링을 포함한 아웃바운드 Telegram 메시지를 비활성화합니다
    - `channels.telegram.actions.poll=false`는 일반 전송은 유지하면서 Telegram 폴 생성만 비활성화합니다

  </Accordion>

  <Accordion title="Telegram의 exec 승인">
    Telegram은 승인자 DM에서 exec 승인을 지원하며, 선택적으로 원래 채팅이나 토픽에 프롬프트를 게시할 수 있습니다. 승인자는 숫자형 Telegram 사용자 ID여야 합니다.

    Config 경로:

    - `channels.telegram.execApprovals.enabled` (해석 가능한 승인자가 하나 이상 있으면 자동 활성화)
    - `channels.telegram.execApprovals.approvers` (`allowFrom` / `defaultTo`의 숫자형 소유자 ID로 대체)
    - `channels.telegram.execApprovals.target`: `dm` (기본값) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    채널 전달은 채팅에 명령 텍스트를 표시하므로, 신뢰할 수 있는 그룹/토픽에서만 `channel` 또는 `both`를 활성화하세요. 프롬프트가 포럼 토픽에 도착하면, OpenClaw는 승인 프롬프트와 후속 메시지 모두에 대해 해당 토픽을 유지합니다. exec 승인은 기본적으로 30분 후 만료됩니다.

    인라인 승인 버튼도 대상 표면(`dm`, `group`, 또는 `all`)을 허용하도록 `channels.telegram.capabilities.inlineButtons`가 설정되어 있어야 합니다. `plugin:` 접두사가 있는 승인 ID는 Plugin 승인을 통해 해석되며, 그 외는 먼저 exec 승인을 통해 해석됩니다.

    [Exec approvals](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 오류 응답 제어

에이전트가 전달 또는 provider 오류를 만나면, Telegram은 오류 텍스트로 응답하거나 이를 억제할 수 있습니다. 이 동작은 두 개의 config 키로 제어됩니다:

| 키 | 값 | 기본값 | 설명 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `reply`, `silent` | `reply` | `reply`는 채팅에 친화적인 오류 메시지를 보냅니다. `silent`는 오류 응답을 완전히 억제합니다. |
| `channels.telegram.errorCooldownMs` | number (ms) | `60000` | 동일한 채팅에 오류 응답을 보내는 최소 시간 간격입니다. 장애 중 오류 스팸을 방지합니다. |

계정별, 그룹별, 토픽별 재정의를 지원합니다(다른 Telegram config 키와 동일한 상속 방식).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 이 그룹에서는 오류 억제
        },
      },
    },
  },
}
```

## 문제 해결

<AccordionGroup>
  <Accordion title="봇이 멘션 없는 그룹 메시지에 응답하지 않음">

    - `requireMention=false`인 경우, Telegram 개인정보 보호 모드가 전체 가시성을 허용해야 합니다.
      - BotFather: `/setprivacy` -> 비활성화
      - 그런 다음 그룹에서 봇을 제거했다가 다시 추가
    - `openclaw channels status`는 config가 멘션 없는 그룹 메시지를 기대할 때 경고를 표시합니다.
    - `openclaw channels status --probe`는 명시적인 숫자형 그룹 ID를 확인할 수 있으며, 와일드카드 `"*"`는 멤버십 프로브를 할 수 없습니다.
    - 빠른 세션 테스트: `/activation always`.

  </Accordion>

  <Accordion title="봇이 그룹 메시지를 전혀 보지 못함">

    - `channels.telegram.groups`가 존재하는 경우, 그룹이 목록에 있어야 합니다(또는 `"*"` 포함)
    - 그룹 내 봇 멤버십 확인
    - 건너뛴 이유를 보려면 `openclaw logs --follow` 로그 검토

  </Accordion>

  <Accordion title="명령이 부분적으로만 동작하거나 전혀 동작하지 않음">

    - 발신자 ID에 권한을 부여하세요(페어링 및/또는 숫자형 `allowFrom`)
    - 그룹 정책이 `open`이어도 명령 권한 부여는 계속 적용됩니다
    - `setMyCommands failed`와 함께 `BOT_COMMANDS_TOO_MUCH`가 발생하면 네이티브 메뉴 항목이 너무 많다는 뜻입니다. Plugin/Skills/사용자 지정 명령을 줄이거나 네이티브 메뉴를 비활성화하세요
    - `setMyCommands failed`와 함께 네트워크/fetch 오류가 발생하면 일반적으로 `api.telegram.org`에 대한 DNS/HTTPS 연결성 문제를 나타냅니다

  </Accordion>

  <Accordion title="폴링 또는 네트워크 불안정성">

    - Node 22+ + 사용자 지정 fetch/proxy 조합은 AbortSignal 타입 불일치가 있을 때 즉시 중단 동작을 유발할 수 있습니다.
    - 일부 호스트는 `api.telegram.org`를 먼저 IPv6로 해석하며, IPv6 아웃바운드가 깨져 있으면 간헐적인 Telegram API 실패가 발생할 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 포함되면, OpenClaw는 이제 이를 복구 가능한 네트워크 오류로 재시도합니다.
    - 로그에 `Polling stall detected`가 포함되면, 기본적으로 완료된 롱 폴 라이브니스가 120초 동안 없을 때 OpenClaw가 폴링을 재시작하고 Telegram 전송 계층을 다시 빌드합니다.
    - 장시간 실행되는 `getUpdates` 호출이 정상인데도 호스트에서 잘못된 polling-stall 재시작이 계속 보고되는 경우에만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 지속적인 stall은 보통 호스트와 `api.telegram.org` 사이의 프록시, DNS, IPv6 또는 TLS 아웃바운드 문제를 가리킵니다.
    - 직접 아웃바운드/TLS가 불안정한 VPS 호스트에서는 `channels.telegram.proxy`를 통해 Telegram API 호출을 라우팅하세요:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+는 기본적으로 `autoSelectFamily=true`(WSL2 제외)와 `dnsResultOrder=ipv4first`를 사용합니다.
    - 호스트가 WSL2이거나 명시적으로 IPv4 전용 동작이 더 잘 맞는 경우, 패밀리 선택을 강제하세요:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 벤치마크 범위 응답(`198.18.0.0/15`)은 기본적으로 Telegram 미디어 다운로드에 이미 허용되어 있습니다. 신뢰할 수 있는 가짜 IP 또는 투명 프록시가 미디어 다운로드 중 `api.telegram.org`를 다른 비공개/내부/특수 용도 주소로 재작성하는 경우, Telegram 전용 우회를 선택적으로 활성화할 수 있습니다:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 동일한 opt-in은 계정별로도
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`에서 사용할 수 있습니다.
    - 프록시가 Telegram 미디어 호스트를 `198.18.x.x`로 해석하는 경우에는 먼저 위험 플래그를 끈 상태로 두세요. Telegram 미디어는 기본적으로 이미 RFC 2544 벤치마크 범위를 허용합니다.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`는 Telegram
      미디어 SSRF 보호를 약화시킵니다. Clash, Mihomo, 또는 Surge 가짜 IP 라우팅처럼
      RFC 2544 벤치마크 범위 밖의 비공개 또는 특수 용도 응답을 합성하는
      신뢰할 수 있는 운영자 제어 프록시 환경에서만 사용하세요.
      일반적인 퍼블릭 인터넷 Telegram 접근에서는 비활성화 상태로 두세요.
    </Warning>

    - 환경 변수 재정의(임시):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 응답 검증:

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

- 시작/인증: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile`은 일반 파일을 가리켜야 하며 심볼릭 링크는 거부됨)
- 접근 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]` (`type: "acp"`)
- exec 승인: `execApprovals`, `accounts.*.execApprovals`
- 명령/메뉴: `commands.native`, `commands.nativeSkills`, `customCommands`
- 스레딩/답장: `replyToMode`
- 스트리밍: `streaming` (미리보기), `streaming.preview.toolProgress`, `blockStreaming`
- 서식/전달: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- 미디어/네트워크: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- 작업/기능: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 반응: `reactionNotifications`, `reactionLevel`
- 오류: `errorPolicy`, `errorCooldownMs`
- 쓰기/기록: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
다중 계정 우선순위: 두 개 이상의 계정 ID가 구성된 경우, 기본 라우팅을 명시적으로 만들기 위해 `channels.telegram.defaultAccount`를 설정하거나(또는 `channels.telegram.accounts.default`를 포함하세요). 그렇지 않으면 OpenClaw는 정규화된 첫 번째 계정 ID로 대체되며 `openclaw doctor`가 경고합니다. 명명된 계정은 `channels.telegram.allowFrom` / `groupAllowFrom`을 상속하지만 `accounts.default.*` 값은 상속하지 않습니다.
</Note>

## 관련 문서

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram 사용자를 gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 및 토픽 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    그룹과 토픽을 에이전트에 매핑합니다.
  </Card>
  <Card title="문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단입니다.
  </Card>
</CardGroup>
