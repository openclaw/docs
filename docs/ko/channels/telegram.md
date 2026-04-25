---
read_when:
    - Telegram 기능 또는 Webhook 작업하기
summary: Telegram 봇 지원 상태, 기능, 그리고 구성
title: Telegram
x-i18n:
    generated_at: "2026-04-25T05:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41d835e7b50a3a38fed62f252b1810475204beca4a4dd0f2b42ddaa3507deeab
    source_path: channels/telegram.md
    workflow: 15
---

grammY를 통해 봇 DM과 그룹에 대해 프로덕션 준비가 완료되어 있습니다. Long polling이 기본 모드이며, webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 봇 토큰 만들기">
    Telegram을 열고 **@BotFather**와 채팅하세요(핸들이 정확히 `@BotFather`인지 확인하세요).

    `/newbot`을 실행하고, 안내에 따라 진행한 다음 토큰을 저장하세요.

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

    환경 변수 폴백: `TELEGRAM_BOT_TOKEN=...` (기본 계정만 해당).
    Telegram은 **`openclaw channels login telegram`을 사용하지 않습니다**. config/env에 토큰을 구성한 다음 gateway를 시작하세요.

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
    봇을 그룹에 추가한 다음, 액세스 모델에 맞게 `channels.telegram.groups`와 `groupPolicy`를 설정하세요.
  </Step>
</Steps>

<Note>
토큰 확인 순서는 계정을 인식합니다. 실제로는 config 값이 환경 변수 폴백보다 우선하며, `TELEGRAM_BOT_TOKEN`은 기본 계정에만 적용됩니다.
</Note>

## Telegram 측 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드와 그룹 가시성">
    Telegram 봇은 기본적으로 **개인정보 보호 모드**가 활성화되어 있으며, 이 모드는 봇이 수신할 수 있는 그룹 메시지를 제한합니다.

    봇이 모든 그룹 메시지를 확인해야 한다면 다음 중 하나를 수행하세요.

    - `/setprivacy`를 통해 개인정보 보호 모드를 비활성화하거나
    - 봇을 그룹 관리자로 지정하세요.

    개인정보 보호 모드를 전환한 경우, Telegram이 변경 사항을 적용하도록 각 그룹에서 봇을 제거한 뒤 다시 추가하세요.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어됩니다.

    관리자 봇은 모든 그룹 메시지를 수신하므로, 항상 활성화된 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="유용한 BotFather 토글">

    - 그룹 추가 허용/거부용 `/setjoingroups`
    - 그룹 가시성 동작용 `/setprivacy`

  </Accordion>
</AccordionGroup>

## 액세스 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`는 다이렉트 메시지 액세스를 제어합니다.

    - `pairing` (기본값)
    - `allowlist` (`allowFrom`에 최소 하나의 발신자 ID 필요)
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `channels.telegram.allowFrom`은 숫자형 Telegram 사용자 ID를 받습니다. `telegram:` / `tg:` 접두사는 허용되며 정규화됩니다.
    비어 있는 `allowFrom`과 함께 `dmPolicy: "allowlist"`를 사용하면 모든 DM이 차단되며 config 검증에서 거부됩니다.
    설정은 숫자형 사용자 ID만 요청합니다.
    업그레이드 후 config에 `@username` allowlist 항목이 있다면, `openclaw doctor --fix`를 실행해 이를 해결하세요(최선의 방식으로 수행되며, Telegram 봇 토큰이 필요합니다).
    이전에 pairing-store allowlist 파일에 의존했다면, `openclaw doctor --fix`가 allowlist 흐름에서 항목을 `channels.telegram.allowFrom`으로 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없는 경우).

    단일 소유자 봇의 경우, 이전 페어링 승인에 의존하는 대신 접근 정책을 config에 지속적으로 유지하려면 명시적인 숫자 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 사용하는 것이 좋습니다.

    흔한 혼동: DM 페어링 승인은 "이 발신자가 어디서나 인증된다"는 뜻이 아닙니다.
    페어링은 DM 액세스만 부여합니다. 그룹 발신자 인증은 여전히 명시적인 config allowlist에서 옵니다.
    "한 번 인증되면 DM과 그룹 명령이 모두 동작하게" 하려면, 숫자형 Telegram 사용자 ID를 `channels.telegram.allowFrom`에 넣으세요.

    ### Telegram 사용자 ID 찾기

    더 안전한 방법(서드파티 봇 없음):

    1. 봇에 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    공식 Bot API 방법:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    서드파티 방법(프라이버시가 다소 약함): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책 및 allowlist">
    두 가지 제어가 함께 적용됩니다.

    1. **허용되는 그룹** (`channels.telegram.groups`)
       - `groups` config가 없는 경우:
         - `groupPolicy: "open"`이면: 어떤 그룹이든 그룹 ID 검사를 통과할 수 있음
         - `groupPolicy: "allowlist"`(기본값)이면: `groups` 항목(또는 `"*"`)을 추가할 때까지 그룹이 차단됨
       - `groups`가 구성된 경우: allowlist 역할 수행(명시적 ID 또는 `"*"`)

    2. **그룹에서 허용되는 발신자** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (기본값)
       - `disabled`

    `groupAllowFrom`은 그룹 발신자 필터링에 사용됩니다. 설정되지 않으면 Telegram은 `allowFrom`으로 폴백합니다.
    `groupAllowFrom` 항목은 숫자형 Telegram 사용자 ID여야 합니다(`telegram:` / `tg:` 접두사는 정규화됨).
    Telegram 그룹 또는 슈퍼그룹 채팅 ID를 `groupAllowFrom`에 넣지 마세요. 음수 채팅 ID는 `channels.telegram.groups` 아래에 넣어야 합니다.
    숫자가 아닌 항목은 발신자 인증에서 무시됩니다.
    보안 경계(`2026.2.25+`): 그룹 발신자 인증은 DM pairing-store 승인 항목을 상속하지 **않습니다**.
    페어링은 DM 전용으로 유지됩니다. 그룹의 경우 `groupAllowFrom` 또는 그룹별/토픽별 `allowFrom`을 설정하세요.
    `groupAllowFrom`이 설정되지 않으면 Telegram은 pairing store가 아니라 config의 `allowFrom`으로 폴백합니다.
    단일 소유자 봇을 위한 실용적인 패턴: 사용자 ID를 `channels.telegram.allowFrom`에 설정하고, `groupAllowFrom`은 비워 둔 채 대상 그룹을 `channels.telegram.groups` 아래에서 허용하세요.
    런타임 참고: `channels.telegram`이 완전히 없으면, `channels.defaults.groupPolicy`가 명시적으로 설정되지 않은 한 런타임은 기본적으로 fail-closed `groupPolicy="allowlist"`를 사용합니다.

    예시: 하나의 특정 그룹에서 모든 멤버 허용:

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

    예시: 하나의 특정 그룹 안에서 특정 사용자만 허용:

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
      흔한 실수: `groupAllowFrom`은 Telegram 그룹 allowlist가 아닙니다.

      - `-1001234567890` 같은 음수 Telegram 그룹 또는 슈퍼그룹 채팅 ID는 `channels.telegram.groups` 아래에 넣으세요.
      - 허용된 그룹 내부에서 어떤 사람이 봇을 트리거할 수 있는지 제한하려면 `8734062810` 같은 Telegram 사용자 ID를 `groupAllowFrom` 아래에 넣으세요.
      - 허용된 그룹의 모든 멤버가 봇과 대화할 수 있게 하려는 경우에만 `groupAllowFrom: ["*"]`를 사용하세요.
    </Warning>

  </Tab>

  <Tab title="멘션 동작">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션은 다음 중 하나로 제공될 수 있습니다.

    - 네이티브 `@botusername` 멘션 또는
    - 다음의 멘션 패턴:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    세션 수준 명령 토글:

    - `/activation always`
    - `/activation mention`

    이 설정은 세션 상태만 업데이트합니다. 지속성을 원하면 config를 사용하세요.

    지속 config 예시:

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

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`로 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 읽기
    - 또는 Bot API `getUpdates` 확인

  </Tab>
</Tabs>

## 런타임 동작

- Telegram은 gateway 프로세스가 소유합니다.
- 라우팅은 결정적입니다. Telegram 인바운드 응답은 다시 Telegram으로 응답합니다(모델이 채널을 선택하지 않음).
- 인바운드 메시지는 답장 메타데이터와 미디어 플레이스홀더를 포함한 공유 채널 엔벌로프로 정규화됩니다.
- 그룹 세션은 그룹 ID로 격리됩니다. 포럼 토픽은 토픽 격리를 위해 `:topic:<threadId>`를 덧붙입니다.
- DM 메시지는 `message_thread_id`를 담을 수 있습니다. OpenClaw는 이를 thread 인식 세션 키로 라우팅하고 답장을 위해 thread ID를 유지합니다.
- Long polling은 채팅별/thread별 순서를 보장하는 grammY runner를 사용합니다. 전체 runner sink 동시성은 `agents.defaults.maxConcurrent`를 사용합니다.
- Long-polling watchdog 재시작은 기본적으로 `getUpdates` 완료 liveness가 120초 동안 없으면 트리거됩니다. 장시간 실행 작업 중에도 배포 환경에서 polling-stall 오탐 재시작이 계속 보일 때만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 이 값의 단위는 밀리초이며 `30000`부터 `600000`까지 허용됩니다. 계정별 override도 지원됩니다.
- Telegram Bot API에는 읽음 확인 지원이 없습니다(`sendReadReceipts`는 적용되지 않음).

## 기능 참조

<AccordionGroup>
  <Accordion title="라이브 스트림 미리보기(메시지 편집)">
    OpenClaw는 부분 응답을 실시간으로 스트리밍할 수 있습니다.

    - 다이렉트 채팅: 미리보기 메시지 + `editMessageText`
    - 그룹/토픽: 미리보기 메시지 + `editMessageText`

    요구 사항:

    - `channels.telegram.streaming`은 `off | partial | block | progress`입니다(기본값: `partial`)
    - `progress`는 Telegram에서 `partial`로 매핑됩니다(채널 간 명명 호환성용)
    - `streaming.preview.toolProgress`는 도구/진행 업데이트가 같은 편집 미리보기 메시지를 재사용할지 제어합니다(기본값: 미리보기 스트리밍이 활성화된 경우 `true`)
    - 레거시 `channels.telegram.streamMode` 및 boolean `streaming` 값은 자동 매핑됩니다

    도구 진행 미리보기 업데이트는 도구 실행 중 표시되는 짧은 "작업 중..." 줄입니다. 예를 들어 명령 실행, 파일 읽기, 계획 업데이트, 패치 요약 등이 있습니다. Telegram은 `v2026.4.22` 이후 배포된 OpenClaw 동작과 맞추기 위해 이를 기본적으로 활성화합니다. 답변 텍스트용 편집 미리보기는 유지하면서 도구 진행 줄만 숨기려면 다음과 같이 설정하세요.

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

    Telegram 미리보기 편집을 완전히 비활성화하려면 `streaming.mode: "off"`만 사용하세요. 도구 진행 상태 줄만 비활성화하려면 `streaming.preview.toolProgress: false`를 사용하세요.

    텍스트 전용 응답의 경우:

    - DM: OpenClaw는 동일한 미리보기 메시지를 유지하고 최종 편집을 제자리에서 수행합니다(두 번째 메시지 없음)
    - 그룹/토픽: OpenClaw는 동일한 미리보기 메시지를 유지하고 최종 편집을 제자리에서 수행합니다(두 번째 메시지 없음)

    복합 응답(예: 미디어 페이로드)의 경우 OpenClaw는 일반 최종 전달로 폴백한 다음 미리보기 메시지를 정리합니다.

    미리보기 스트리밍은 block 스트리밍과 별개입니다. Telegram에 대해 block 스트리밍이 명시적으로 활성화되면, OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

    네이티브 초안 전송을 사용할 수 없거나 거부되면, OpenClaw는 자동으로 `sendMessage` + `editMessageText`로 폴백합니다.

    Telegram 전용 reasoning 스트림:

    - `/reasoning stream`은 생성 중 reasoning을 라이브 미리보기로 전송합니다
    - 최종 응답은 reasoning 텍스트 없이 전송됩니다

  </Accordion>

  <Accordion title="서식 및 HTML 폴백">
    아웃바운드 텍스트는 Telegram `parse_mode: "HTML"`을 사용합니다.

    - Markdown 스타일 텍스트는 Telegram에 안전한 HTML로 렌더링됩니다.
    - 원시 모델 HTML은 Telegram 파싱 실패를 줄이기 위해 escape 처리됩니다.
    - Telegram이 파싱된 HTML을 거부하면, OpenClaw는 일반 텍스트로 재시도합니다.

    링크 미리보기는 기본적으로 활성화되어 있으며 `channels.telegram.linkPreview: false`로 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="네이티브 명령 및 사용자 지정 명령">
    Telegram 명령 메뉴 등록은 시작 시 `setMyCommands`로 처리됩니다.

    기본 네이티브 명령:

    - `commands.native: "auto"`는 Telegram에 대해 네이티브 명령을 활성화합니다

    사용자 지정 명령 메뉴 항목 추가:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 백업" },
        { command: "generate", description: "이미지 만들기" },
      ],
    },
  },
}
```

    규칙:

    - 이름은 정규화됩니다(앞의 `/` 제거, 소문자화)
    - 유효 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - 사용자 지정 명령은 네이티브 명령을 override할 수 없습니다
    - 충돌/중복 항목은 건너뛰고 로그에 기록됩니다

    참고:

    - 사용자 지정 명령은 메뉴 항목일 뿐이며, 동작을 자동 구현하지는 않습니다
    - Telegram 메뉴에 표시되지 않더라도 plugin/skill 명령은 직접 입력하면 여전히 동작할 수 있습니다

    네이티브 명령이 비활성화되면 내장 명령은 제거됩니다. 사용자 지정/plugin 명령은 구성된 경우 여전히 등록될 수 있습니다.

    흔한 설정 실패:

    - `setMyCommands failed`와 함께 `BOT_COMMANDS_TOO_MUCH`가 발생하면, 잘라낸 뒤에도 Telegram 메뉴가 여전히 넘친다는 뜻입니다. plugin/skill/사용자 지정 명령을 줄이거나 `channels.telegram.commands.native`를 비활성화하세요.
    - `setMyCommands failed`와 함께 네트워크/fetch 오류가 발생하면 보통 `api.telegram.org`로의 아웃바운드 DNS/HTTPS가 차단된 것입니다.

    ### 디바이스 페어링 명령 (`device-pair` plugin)

    `device-pair` plugin이 설치되어 있으면:

    1. `/pair`가 설정 코드를 생성합니다
    2. iOS 앱에 코드를 붙여넣습니다
    3. `/pair pending`이 대기 중 요청 목록을 표시합니다(role/scopes 포함)
    4. 요청을 승인합니다:
       - 명시적 승인은 `/pair approve <requestId>`
       - 대기 중 요청이 하나뿐이면 `/pair approve`
       - 가장 최근 요청은 `/pair approve latest`

    설정 코드는 수명이 짧은 bootstrap 토큰을 담고 있습니다. 내장 bootstrap handoff는 기본 node 토큰을 `scopes: []`로 유지하며, handoff된 operator 토큰은 `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`로만 제한됩니다. Bootstrap scope 검사는 role 접두사를 기준으로 하므로, 해당 operator allowlist는 operator 요청만 충족합니다. operator가 아닌 role은 여전히 자기 role 접두사 아래의 scopes가 필요합니다.

    디바이스가 변경된 인증 세부정보(예: role/scopes/public key)로 재시도하면, 이전 대기 요청은 대체되고 새 요청은 다른 `requestId`를 사용합니다. 승인 전에 `/pair pending`을 다시 실행하세요.

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

    계정별 override:

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

    레거시 `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`로 매핑됩니다.

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

    콜백 클릭은 다음 텍스트로 에이전트에 전달됩니다:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="에이전트 및 자동화를 위한 Telegram 메시지 작업">
    Telegram 도구 작업에는 다음이 포함됩니다.

    - `sendMessage` (`to`, `content`, 선택적 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, 선택적 `iconColor`, `iconCustomEmojiId`)

    채널 메시지 작업은 사용하기 쉬운 별칭을 노출합니다(`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    게이팅 제어:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (기본값: 비활성화)

    참고: `edit`와 `topic-create`는 현재 기본적으로 활성화되어 있으며 별도의 `channels.telegram.actions.*` 토글이 없습니다.
    런타임 전송은 활성 config/secrets 스냅샷(시작/리로드 시점)을 사용하므로, 작업 경로는 전송마다 임시 SecretRef 재해석을 수행하지 않습니다.

    반응 제거 의미론: [/tools/reactions](/ko/tools/reactions)

  </Accordion>

  <Accordion title="답장 스레딩 태그">
    Telegram은 생성된 출력에서 명시적 답장 스레딩 태그를 지원합니다.

    - `[[reply_to_current]]`는 트리거한 메시지에 답장합니다
    - `[[reply_to:<id>]]`는 특정 Telegram 메시지 ID에 답장합니다

    `channels.telegram.replyToMode`가 처리 방식을 제어합니다.

    - `off` (기본값)
    - `first`
    - `all`

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 여전히 존중됩니다.

  </Accordion>

  <Accordion title="포럼 토픽 및 스레드 동작">
    포럼 슈퍼그룹:

    - 토픽 세션 키는 `:topic:<threadId>`를 덧붙입니다
    - 답장과 타이핑은 해당 토픽 스레드를 대상으로 합니다
    - 토픽 config 경로:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    일반 토픽(`threadId=1`) 특수 처리:

    - 메시지 전송은 `message_thread_id`를 생략합니다(Telegram은 `sendMessage(...thread_id=1)`을 거부함)
    - 타이핑 작업은 여전히 `message_thread_id`를 포함합니다

    토픽 상속: 토픽 항목은 override되지 않는 한 그룹 설정을 상속합니다(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId`는 토픽 전용이며 그룹 기본값에서 상속되지 않습니다.

    **토픽별 에이전트 라우팅**: 각 토픽은 토픽 config에서 `agentId`를 설정해 서로 다른 에이전트로 라우팅할 수 있습니다. 이렇게 하면 각 토픽은 자체적으로 격리된 워크스페이스, 메모리, 세션을 갖습니다. 예시:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 일반 토픽 → main 에이전트
                "3": { agentId: "zu" },        // 개발 토픽 → zu 에이전트
                "5": { agentId: "coder" }      // 코드 리뷰 → coder 에이전트
              }
            }
          }
        }
      }
    }
    ```

    그러면 각 토픽은 자체 세션 키를 가집니다: `agent:zu:telegram:group:-1001234567890:topic:3`

    **지속적인 ACP 토픽 바인딩**: 포럼 토픽은 최상위 타입 지정 ACP 바인딩(`bindings[]`에 `type: "acp"` 및 `match.channel: "telegram"`, `peer.kind: "group"`, 그리고 `-1001234567890:topic:42` 같은 토픽 한정 id 사용)을 통해 ACP harness 세션을 고정할 수 있습니다. 현재는 그룹/슈퍼그룹의 포럼 토픽에만 범위가 제한됩니다. 자세한 내용은 [ACP Agents](/ko/tools/acp-agents)를 참조하세요.

    **채팅에서 스레드 바인딩된 ACP spawn**: `/acp spawn <agent> --thread here|auto`는 현재 토픽을 새 ACP 세션에 바인딩하며, 이후 후속 작업은 그쪽으로 직접 라우팅됩니다. OpenClaw는 spawn 확인 메시지를 해당 토픽에 고정합니다. `channels.telegram.threadBindings.spawnAcpSessions=true`가 필요합니다.

    템플릿 컨텍스트는 `MessageThreadId`와 `IsForum`을 노출합니다. `message_thread_id`가 있는 DM 채팅은 DM 라우팅을 유지하지만 thread 인식 세션 키를 사용합니다.

  </Accordion>

  <Accordion title="오디오, 비디오, 그리고 스티커">
    ### 오디오 메시지

    Telegram은 음성 노트와 오디오 파일을 구분합니다.

    - 기본값: 오디오 파일 동작
    - 에이전트 응답에 `[[audio_as_voice]]` 태그를 넣으면 음성 노트 전송을 강제합니다

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

    비디오 노트는 캡션을 지원하지 않습니다. 제공된 메시지 텍스트는 별도로 전송됩니다.

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

    반복적인 비전 호출을 줄이기 위해 스티커는 가능할 때 한 번 설명되고 캐시됩니다.

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
  query: "손 흔드는 고양이",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="반응 알림">
    Telegram 반응은 `message_reaction` 업데이트로 도착합니다(메시지 페이로드와 별도).

    활성화되면 OpenClaw는 다음과 같은 시스템 이벤트를 큐에 넣습니다.

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    구성:

    - `channels.telegram.reactionNotifications`: `off | own | all` (기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (기본값: `minimal`)

    참고:

    - `own`은 봇이 보낸 메시지에 대한 사용자 반응만 의미합니다(전송 메시지 캐시 기반의 best-effort).
    - 반응 이벤트는 여전히 Telegram 액세스 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)를 따르며, 권한 없는 발신자는 드롭됩니다.
    - Telegram은 반응 업데이트에 thread ID를 제공하지 않습니다.
      - 포럼이 아닌 그룹은 그룹 채팅 세션으로 라우팅
      - 포럼 그룹은 정확한 원래 토픽이 아니라 그룹 일반 토픽 세션(`:topic:1`)으로 라우팅

    polling/webhook의 `allowed_updates`에는 `message_reaction`이 자동 포함됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    확인 순서:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 에이전트 identity 이모지 폴백 (`agents.list[].identity.emoji`, 없으면 `"👀"`)

    참고:

    - Telegram은 유니코드 이모지(예: `"👀"`)를 기대합니다.
    - 채널 또는 계정에 대해 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Telegram 이벤트 및 명령에서의 config 쓰기">
    채널 config 쓰기는 기본적으로 활성화됩니다(`configWrites !== false`).

    Telegram 트리거 쓰기에는 다음이 포함됩니다.

    - `channels.telegram.groups`를 업데이트하기 위한 그룹 마이그레이션 이벤트(`migrate_to_chat_id`)
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

  <Accordion title="Long polling vs webhook">
    기본값은 long polling입니다. webhook 모드를 사용하려면 `channels.telegram.webhookUrl`과 `channels.telegram.webhookSecret`을 설정하세요. 선택적으로 `webhookPath`, `webhookHost`, `webhookPort`도 설정할 수 있습니다(기본값 `/telegram-webhook`, `127.0.0.1`, `8787`).

    로컬 리스너는 `127.0.0.1:8787`에 바인딩됩니다. 공개 인그레스를 위해서는 로컬 포트 앞에 reverse proxy를 두거나, 의도적으로 `webhookHost: "0.0.0.0"`을 설정하세요.

  </Accordion>

  <Accordion title="제한, 재시도, 그리고 CLI 대상">
    - `channels.telegram.textChunkLimit` 기본값은 4000입니다.
    - `channels.telegram.chunkMode="newline"`는 길이 기준 분할 전에 문단 경계(빈 줄)를 우선합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)는 인바운드 및 아웃바운드 Telegram 미디어 크기 상한을 설정합니다.
    - `channels.telegram.timeoutSeconds`는 Telegram API 클라이언트 타임아웃을 override합니다(설정하지 않으면 grammY 기본값 적용).
    - `channels.telegram.pollingStallThresholdMs` 기본값은 `120000`이며, polling-stall 오탐 재시작이 있을 때만 `30000`~`600000` 사이에서 조정하세요.
    - 그룹 컨텍스트 이력은 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`를 사용합니다(기본값 50). `0`이면 비활성화됩니다.
    - 답장/인용/전달 보조 컨텍스트는 현재 수신된 그대로 전달됩니다.
    - Telegram allowlist는 주로 누가 에이전트를 트리거할 수 있는지를 제어하며, 완전한 보조 컨텍스트 redaction 경계는 아닙니다.
    - DM 이력 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 구성은 복구 가능한 아웃바운드 API 오류에 대해 Telegram 전송 헬퍼(CLI/tools/actions)에 적용됩니다.

    CLI 전송 대상은 숫자형 chat ID 또는 사용자 이름을 사용할 수 있습니다:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll은 `openclaw message poll`을 사용하며 포럼 토픽도 지원합니다:

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
    - 포럼 토픽용 `--thread-id` (`:topic:` 대상을 사용해도 됨)

    Telegram 전송은 다음도 지원합니다:

    - `channels.telegram.capabilities.inlineButtons`가 허용할 때 인라인 키보드용 `buttons` 블록과 함께 쓰는 `--presentation`
    - 봇이 해당 채팅에서 고정할 수 있을 때 고정 전달을 요청하는 `--pin` 또는 `--delivery '{"pin":true}'`
    - 아웃바운드 이미지와 GIF를 압축된 사진 또는 애니메이션 미디어 업로드 대신 문서로 보내는 `--force-document`

    작업 게이팅:

    - `channels.telegram.actions.sendMessage=false`는 poll을 포함한 아웃바운드 Telegram 메시지를 비활성화합니다
    - `channels.telegram.actions.poll=false`는 일반 전송은 유지하면서 Telegram poll 생성을 비활성화합니다

  </Accordion>

  <Accordion title="Telegram의 exec 승인">
    Telegram은 승인자 DM에서 exec 승인을 지원하며, 선택적으로 원래 채팅이나 토픽에도 프롬프트를 게시할 수 있습니다. 승인자는 숫자형 Telegram 사용자 ID여야 합니다.

    config 경로:

    - `channels.telegram.execApprovals.enabled` (해결 가능한 승인자가 최소 한 명 있으면 자동 활성화)
    - `channels.telegram.execApprovals.approvers` (`allowFrom` / `defaultTo`의 숫자형 소유자 ID로 폴백)
    - `channels.telegram.execApprovals.target`: `dm` (기본값) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    채널 전달은 채팅에 명령 텍스트를 표시하므로, 신뢰할 수 있는 그룹/토픽에서만 `channel` 또는 `both`를 활성화하세요. 프롬프트가 포럼 토픽에 도착하면, OpenClaw는 승인 프롬프트와 후속 작업 모두에 대해 해당 토픽을 유지합니다. exec 승인은 기본적으로 30분 후 만료됩니다.

    인라인 승인 버튼도 대상 표면(`dm`, `group`, 또는 `all`)을 허용하도록 `channels.telegram.capabilities.inlineButtons`가 필요합니다. `plugin:` 접두사가 붙은 승인 ID는 plugin 승인으로 해석되고, 그 외는 먼저 exec 승인으로 해석됩니다.

    [Exec approvals](/ko/tools/exec-approvals)을 참고하세요.

  </Accordion>
</AccordionGroup>

## 오류 응답 제어

에이전트가 전달 또는 provider 오류를 만났을 때, Telegram은 오류 텍스트로 응답할 수도 있고 이를 억제할 수도 있습니다. 이 동작은 두 개의 config 키로 제어됩니다:

| 키                                  | 값                | 기본값  | 설명                                                                                          |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`는 채팅에 친화적인 오류 메시지를 보냅니다. `silent`는 오류 응답을 완전히 억제합니다. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 같은 채팅에 대한 오류 응답 사이의 최소 시간입니다. 장애 중 오류 스팸을 방지합니다.         |

계정별, 그룹별, 토픽별 override가 지원됩니다(다른 Telegram config 키와 동일한 상속 방식).

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

    - `requireMention=false`이면, Telegram 개인정보 보호 모드가 전체 가시성을 허용해야 합니다.
      - BotFather: `/setprivacy` -> 비활성화
      - 그런 다음 그룹에서 봇을 제거 후 다시 추가
    - `openclaw channels status`는 config가 멘션 없는 그룹 메시지를 기대할 때 경고합니다.
    - `openclaw channels status --probe`는 명시적 숫자형 그룹 ID를 확인할 수 있습니다. 와일드카드 `"*"`는 멤버십 probe를 할 수 없습니다.
    - 빠른 세션 테스트: `/activation always`.

  </Accordion>

  <Accordion title="봇이 그룹 메시지를 전혀 보지 못함">

    - `channels.telegram.groups`가 존재하면 그룹이 목록에 있어야 합니다(또는 `"*"` 포함)
    - 봇이 그룹의 멤버인지 확인하세요
    - 로그 확인: 건너뛴 이유를 보려면 `openclaw logs --follow`

  </Accordion>

  <Accordion title="명령이 부분적으로만 동작하거나 전혀 동작하지 않음">

    - 발신자 ID를 인증하세요(페어링 및/또는 숫자형 `allowFrom`)
    - 그룹 정책이 `open`이더라도 명령 인증은 여전히 적용됩니다
    - `setMyCommands failed`와 함께 `BOT_COMMANDS_TOO_MUCH`가 발생하면 네이티브 메뉴 항목이 너무 많다는 뜻입니다. plugin/skill/사용자 지정 명령을 줄이거나 네이티브 메뉴를 비활성화하세요
    - `setMyCommands failed`와 함께 네트워크/fetch 오류가 발생하면 보통 `api.telegram.org`에 대한 DNS/HTTPS 연결성 문제를 뜻합니다

  </Accordion>

  <Accordion title="Polling 또는 네트워크 불안정">

    - Node 22+ + 사용자 지정 fetch/proxy 조합은 AbortSignal 타입이 맞지 않으면 즉시 abort 동작을 유발할 수 있습니다.
    - 일부 호스트는 `api.telegram.org`를 먼저 IPv6로 해석합니다. 깨진 IPv6 egress는 간헐적인 Telegram API 실패를 일으킬 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 포함되면, OpenClaw는 이제 이를 복구 가능한 네트워크 오류로 재시도합니다.
    - 로그에 `Polling stall detected`가 포함되면, 기본적으로 120초 동안 완료된 long-poll liveness가 없을 때 OpenClaw는 polling을 재시작하고 Telegram 전송 계층을 다시 구축합니다.
    - 장시간 실행 중인 `getUpdates` 호출은 정상인데도 호스트에서 polling-stall 오탐 재시작이 계속 보고될 때만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 지속적인 stall은 보통 호스트와 `api.telegram.org` 사이의 proxy, DNS, IPv6, 또는 TLS egress 문제를 가리킵니다.
    - 직접 egress/TLS가 불안정한 VPS 호스트에서는 `channels.telegram.proxy`를 통해 Telegram API 호출을 라우팅하세요:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+는 기본적으로 `autoSelectFamily=true`(WSL2 제외) 및 `dnsResultOrder=ipv4first`를 사용합니다.
    - 호스트가 WSL2이거나 IPv4 전용 동작이 더 잘 맞는 경우, family 선택을 강제하세요:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 벤치마크 범위 응답(`198.18.0.0/15`)은 기본적으로 Telegram 미디어 다운로드에 대해 이미 허용됩니다. 신뢰할 수 있는 fake-IP 또는 투명 proxy가 미디어 다운로드 중 `api.telegram.org`를 다른 private/internal/special-use 주소로 재작성한다면, Telegram 전용 우회를 opt in할 수 있습니다:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 동일한 opt-in은 계정별로도 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`에서 사용할 수 있습니다.
    - proxy가 Telegram 미디어 호스트를 `198.18.x.x`로 해석한다면, 먼저 dangerous 플래그를 끈 상태로 두세요. Telegram 미디어는 이미 기본적으로 RFC 2544 벤치마크 범위를 허용합니다.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`는 Telegram
      미디어 SSRF 보호를 약화시킵니다. Clash, Mihomo, 또는 Surge fake-IP
      라우팅처럼 운영자가 제어하는 신뢰 가능한 proxy 환경에서, RFC 2544 벤치마크
      범위를 벗어난 private 또는 special-use 응답을 합성할 때만 사용하세요.
      일반적인 공개 인터넷 Telegram 액세스에서는 비활성화 상태로 두세요.
    </Warning>

    - 환경 변수 override(임시):
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

- 시작/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile`은 일반 파일을 가리켜야 하며 심볼릭 링크는 거부됨)
- 액세스 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]` (`type: "acp"`)
- exec 승인: `execApprovals`, `accounts.*.execApprovals`
- 명령/메뉴: `commands.native`, `commands.nativeSkills`, `customCommands`
- 스레딩/답장: `replyToMode`
- 스트리밍: `streaming` (미리보기), `streaming.preview.toolProgress`, `blockStreaming`
- 서식/전달: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- 미디어/네트워크: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- 작업/기능: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 반응: `reactionNotifications`, `reactionLevel`
- 오류: `errorPolicy`, `errorCooldownMs`
- 쓰기/이력: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
다중 계정 우선순위: 둘 이상의 account ID가 구성된 경우, 기본 라우팅을 명시하려면 `channels.telegram.defaultAccount`를 설정하거나(`channels.telegram.accounts.default`를 포함해도 됨) 하세요. 그렇지 않으면 OpenClaw는 정규화된 첫 번째 account ID로 폴백하고 `openclaw doctor`가 경고합니다. 이름 있는 계정은 `channels.telegram.allowFrom` / `groupAllowFrom`은 상속하지만, `accounts.default.*` 값은 상속하지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram 사용자를 gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 및 토픽 allowlist 동작.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 하드닝.
  </Card>
  <Card title="멀티 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    그룹과 토픽을 에이전트에 매핑합니다.
  </Card>
  <Card title="문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단.
  </Card>
</CardGroup>
