---
read_when:
    - Telegram 기능 또는 Webhook 작업하기
summary: Telegram 봇 지원 상태, 기능 및 구성
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

프로덕션 환경에서 grammY를 통해 봇 DM과 그룹에 사용할 준비가 되어 있습니다. 롱 폴링이 기본 모드이며 Webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    교차 채널 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="BotFather에서 봇 토큰 생성">
    Telegram을 열고 **@BotFather**와 채팅합니다(핸들이 정확히 `@BotFather`인지 확인).

    `/newbot`을 실행하고 안내를 따른 뒤 토큰을 저장합니다.

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

    Env 대체값: `TELEGRAM_BOT_TOKEN=...`(기본 계정만 해당).
    Telegram은 `openclaw channels login telegram`을 사용하지 **않습니다**. config/env에 토큰을 구성한 다음 Gateway를 시작하세요.

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
    그룹에 봇을 추가한 다음, 접근 모델에 맞게 `channels.telegram.groups`와 `groupPolicy`를 설정합니다.
  </Step>
</Steps>

<Note>
토큰 확인 순서는 계정을 인식합니다. 실제로는 config 값이 env 대체값보다 우선하며, `TELEGRAM_BOT_TOKEN`은 기본 계정에만 적용됩니다.
</Note>

## Telegram 쪽 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드 및 그룹 표시 범위">
    Telegram 봇은 기본적으로 **개인정보 보호 모드**를 사용하며, 이로 인해 봇이 수신하는 그룹 메시지가 제한됩니다.

    봇이 모든 그룹 메시지를 확인해야 하는 경우 다음 중 하나를 수행하세요.

    - `/setprivacy`로 개인정보 보호 모드를 비활성화하거나
    - 봇을 그룹 관리자로 지정합니다.

    개인정보 보호 모드를 전환할 때는 Telegram이 변경 사항을 적용하도록 각 그룹에서 봇을 제거한 뒤 다시 추가하세요.

  </Accordion>

  <Accordion title="그룹 권한">
    관리자 상태는 Telegram 그룹 설정에서 제어합니다.

    관리자 봇은 모든 그룹 메시지를 수신하므로, 항상 켜져 있는 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="유용한 BotFather 토글">

    - 그룹 추가를 허용/거부하려면 `/setjoingroups`
    - 그룹 표시 범위 동작에는 `/setprivacy`

  </Accordion>
</AccordionGroup>

## 접근 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.telegram.dmPolicy`는 다이렉트 메시지 접근을 제어합니다.

    - `pairing`(기본값)
    - `allowlist`(`allowFrom`에 하나 이상의 발신자 ID 필요)
    - `open`(`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `dmPolicy: "open"`과 `allowFrom: ["*"]`를 함께 사용하면 봇 사용자 이름을 찾거나 추측한 모든 Telegram 계정이 봇에 명령을 내릴 수 있습니다. 엄격하게 제한된 도구를 갖춘 의도적으로 공개된 봇에만 사용하세요. 단일 소유자 봇은 숫자 사용자 ID와 함께 `allowlist`를 사용해야 합니다.

    `channels.telegram.allowFrom`은 숫자 Telegram 사용자 ID를 허용합니다. `telegram:` / `tg:` 접두사는 허용되며 정규화됩니다.
    다중 계정 config에서 제한적인 최상위 `channels.telegram.allowFrom`은 안전 경계로 처리됩니다. 계정 수준 `allowFrom: ["*"]` 항목은 병합 후 유효 계정 allowlist에 명시적 와일드카드가 여전히 포함된 경우가 아니면 해당 계정을 공개로 만들지 않습니다.
    빈 `allowFrom`과 함께 `dmPolicy: "allowlist"`를 사용하면 모든 DM이 차단되며 config 검증에서 거부됩니다.
    설정에서는 숫자 사용자 ID만 요청합니다.
    업그레이드했으며 config에 `@username` allowlist 항목이 포함되어 있다면 `openclaw doctor --fix`를 실행해 이를 확인하세요(최선의 노력 방식이며 Telegram 봇 토큰 필요).
    이전에 페어링 저장소 allowlist 파일에 의존했다면, `openclaw doctor --fix`가 allowlist 흐름에서 항목을 `channels.telegram.allowFrom`으로 복구할 수 있습니다(예: `dmPolicy: "allowlist"`에 아직 명시적 ID가 없는 경우).

    단일 소유자 봇의 경우 이전 페어링 승인에 의존하지 않고 접근 정책을 config에 지속적으로 유지하려면 명시적 숫자 `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 선호하세요.

    흔한 혼동: DM 페어링 승인이 "이 발신자는 모든 곳에서 승인됨"을 의미하지는 않습니다.
    페어링은 DM 접근을 부여합니다. 아직 명령 소유자가 없는 경우, 처음 승인된 페어링은 소유자 전용 명령과 exec 승인에 명시적 운영자 계정이 있도록 `commands.ownerAllowFrom`도 설정합니다.
    그룹 발신자 승인은 여전히 명시적 config allowlist에서 가져옵니다.
    "한 번 승인되면 DM과 그룹 명령이 모두 작동"하기를 원한다면 숫자 Telegram 사용자 ID를 `channels.telegram.allowFrom`에 넣으세요. 소유자 전용 명령의 경우 `commands.ownerAllowFrom`에 `telegram:<your user id>`가 포함되어 있는지 확인하세요.

    ### Telegram 사용자 ID 찾기

    더 안전한 방법(서드파티 봇 없음):

    1. 봇에 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    공식 Bot API 방식:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    서드파티 방식(개인정보 보호 수준 낮음): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="그룹 정책 및 allowlist">
    두 가지 제어가 함께 적용됩니다.

    1. **허용되는 그룹**(`channels.telegram.groups`)
       - `groups` config 없음:
         - `groupPolicy: "open"`: 모든 그룹이 그룹 ID 검사를 통과할 수 있음
         - `groupPolicy: "allowlist"`(기본값): `groups` 항목(또는 `"*"`)을 추가할 때까지 그룹 차단
       - `groups` 구성됨: allowlist로 동작(명시적 ID 또는 `"*"`)

    2. **그룹에서 허용되는 발신자**(`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist`(기본값)
       - `disabled`

    `groupAllowFrom`은 그룹 발신자 필터링에 사용됩니다. 설정되지 않으면 Telegram은 `allowFrom`으로 대체합니다.
    `groupAllowFrom` 항목은 숫자 Telegram 사용자 ID여야 합니다(`telegram:` / `tg:` 접두사는 정규화됨).
    Telegram 그룹 또는 슈퍼그룹 채팅 ID를 `groupAllowFrom`에 넣지 마세요. 음수 채팅 ID는 `channels.telegram.groups` 아래에 둡니다.
    숫자가 아닌 항목은 발신자 승인에서 무시됩니다.
    보안 경계(`2026.2.25+`): 그룹 발신자 인증은 DM 페어링 저장소 승인을 상속하지 **않습니다**.
    페어링은 DM 전용으로 유지됩니다. 그룹의 경우 `groupAllowFrom` 또는 그룹별/토픽별 `allowFrom`을 설정하세요.
    `groupAllowFrom`이 설정되지 않은 경우 Telegram은 페어링 저장소가 아니라 config `allowFrom`으로 대체합니다.
    단일 소유자 봇의 실용적인 패턴: 사용자 ID를 `channels.telegram.allowFrom`에 설정하고, `groupAllowFrom`은 설정하지 않은 채 대상 그룹을 `channels.telegram.groups` 아래에 허용합니다.
    런타임 참고: `channels.telegram`이 완전히 누락된 경우, `channels.defaults.groupPolicy`가 명시적으로 설정되지 않는 한 런타임은 실패 시 닫히는 `groupPolicy="allowlist"`를 기본값으로 사용합니다.

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
      흔한 실수: `groupAllowFrom`은 Telegram 그룹 allowlist가 아닙니다.

      - `-1001234567890` 같은 음수 Telegram 그룹 또는 슈퍼그룹 채팅 ID는 `channels.telegram.groups` 아래에 넣으세요.
      - 허용된 그룹 안에서 어떤 사람이 봇을 트리거할 수 있는지 제한하려면 `8734062810` 같은 Telegram 사용자 ID를 `groupAllowFrom` 아래에 넣으세요.
      - 허용된 그룹의 모든 멤버가 봇과 대화할 수 있기를 원할 때만 `groupAllowFrom: ["*"]`를 사용하세요.

    </Warning>

  </Tab>

  <Tab title="멘션 동작">
    그룹 답장은 기본적으로 멘션이 필요합니다.

    멘션은 다음에서 올 수 있습니다.

    - 네이티브 `@botusername` 멘션 또는
    - 다음의 멘션 패턴:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    세션 수준 명령 토글:

    - `/activation always`
    - `/activation mention`

    이는 세션 상태만 업데이트합니다. 지속성을 위해서는 config를 사용하세요.

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

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`으로 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 읽기
    - 또는 Bot API `getUpdates` 검사

  </Tab>
</Tabs>

## 런타임 동작

- Telegram은 Gateway 프로세스가 소유합니다.
- 라우팅은 결정적입니다. Telegram 인바운드는 Telegram으로 답장합니다(모델은 채널을 선택하지 않음).
- 인바운드 메시지는 답장 메타데이터와 미디어 자리 표시자를 포함한 공유 채널 엔벌로프로 정규화됩니다.
- 그룹 세션은 그룹 ID로 격리됩니다. 포럼 토픽은 토픽을 격리하기 위해 `:topic:<threadId>`를 추가합니다.
- DM 메시지는 `message_thread_id`를 포함할 수 있습니다. OpenClaw는 스레드 인식 세션 키로 이를 라우팅하고 답장을 위해 스레드 ID를 보존합니다.
- 롱 폴링은 채팅별/스레드별 순서 지정과 함께 grammY runner를 사용합니다. 전체 runner 싱크 동시성은 `agents.defaults.maxConcurrent`를 사용합니다.
- 롱 폴링은 각 Gateway 프로세스 내부에서 보호되므로 한 번에 하나의 활성 poller만 봇 토큰을 사용할 수 있습니다. 여전히 `getUpdates` 409 충돌이 보인다면 다른 OpenClaw Gateway, 스크립트 또는 외부 poller가 같은 토큰을 사용 중일 가능성이 높습니다.
- 롱 폴링 watchdog 재시작은 기본적으로 완료된 `getUpdates` 활성 상태가 120초 동안 없으면 트리거됩니다. 배포 환경에서 장시간 실행 작업 중에도 잘못된 폴링 중단 재시작이 계속 발생하는 경우에만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 값은 밀리초 단위이며 `30000`부터 `600000`까지 허용됩니다. 계정별 재정의가 지원됩니다.
- Telegram Bot API에는 읽음 확인 지원이 없습니다(`sendReadReceipts`는 적용되지 않음).

## 기능 참조

<AccordionGroup>
  <Accordion title="라이브 스트림 미리보기(메시지 편집)">
    OpenClaw는 부분 답장을 실시간으로 스트리밍할 수 있습니다.

    - 직접 채팅: 미리보기 메시지 + `editMessageText`
    - 그룹/토픽: 미리보기 메시지 + `editMessageText`

    요구 사항:

    - `channels.telegram.streaming`은 `off | partial | block | progress`입니다(기본값: `partial`).
    - Telegram에서 `progress`는 `partial`로 매핑됩니다(교차 채널 명명과의 호환성).
    - `streaming.preview.toolProgress`는 도구/진행 상황 업데이트가 동일한 편집된 미리보기 메시지를 재사용할지 제어합니다(기본값: 미리보기 스트리밍이 활성화된 경우 `true`).
    - 레거시 `channels.telegram.streamMode`와 불리언 `streaming` 값은 감지됩니다. 이를 `channels.telegram.streaming.mode`로 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.

    도구 진행 상황 미리보기 업데이트는 도구가 실행되는 동안 표시되는 짧은 "Working..." 줄입니다. 예를 들어 명령 실행, 파일 읽기, 계획 업데이트 또는 패치 요약이 있습니다. Telegram은 `v2026.4.22` 및 이후 버전의 출시된 OpenClaw 동작과 일치하도록 이를 기본적으로 활성화합니다. 답변 텍스트용 편집 미리보기는 유지하되 도구 진행 상황 줄은 숨기려면 다음과 같이 설정하세요.

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

    최종 전달만 원할 때만 `streaming.mode: "off"`를 사용하세요. Telegram 미리보기 편집이 비활성화되고, 일반 도구/진행 상황 잡담은 독립 실행형 "Working..." 메시지로 전송되는 대신 억제됩니다. 승인 프롬프트, 미디어 페이로드 및 오류는 여전히 일반 최종 전달을 통해 라우팅됩니다. 도구 진행 상황 상태 줄을 숨기면서 답변 미리보기 편집만 유지하려면 `streaming.preview.toolProgress: false`를 사용하세요.

    텍스트 전용 답장의 경우:

    - 짧은 DM/그룹/토픽 미리보기: OpenClaw는 같은 미리보기 메시지를 유지하고 마지막에 제자리에서 편집합니다
    - 약 1분보다 오래된 미리보기: OpenClaw는 완료된 답변을 새 최종 메시지로 보낸 다음 미리보기를 정리하므로, Telegram의 표시 타임스탬프는 미리보기 생성 시간이 아니라 완료 시간을 반영합니다

    복잡한 답변(예: 미디어 페이로드)의 경우 OpenClaw는 일반 최종 전달로 대체한 다음 미리보기 메시지를 정리합니다.

    미리보기 스트리밍은 블록 스트리밍과 별개입니다. Telegram에 블록 스트리밍이 명시적으로 활성화된 경우 OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

    Telegram 전용 추론 스트림:

    - `/reasoning stream`은 생성 중 추론을 실시간 미리보기로 보냅니다
    - 최종 답변은 추론 텍스트 없이 전송됩니다

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    아웃바운드 텍스트는 Telegram `parse_mode: "HTML"`을 사용합니다.

    - Markdown과 유사한 텍스트는 Telegram에 안전한 HTML로 렌더링됩니다.
    - 원시 모델 HTML은 Telegram 파싱 실패를 줄이기 위해 이스케이프됩니다.
    - Telegram이 파싱된 HTML을 거부하면 OpenClaw는 일반 텍스트로 다시 시도합니다.

    링크 미리보기는 기본적으로 활성화되며 `channels.telegram.linkPreview: false`로 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram 명령 메뉴 등록은 시작 시 `setMyCommands`로 처리됩니다.

    네이티브 명령 기본값:

    - `commands.native: "auto"`는 Telegram의 네이티브 명령을 활성화합니다

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

    - 이름은 정규화됩니다(앞의 `/` 제거, 소문자화)
    - 유효한 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - 사용자 지정 명령은 네이티브 명령을 재정의할 수 없습니다
    - 충돌/중복은 건너뛰고 기록됩니다

    참고:

    - 사용자 지정 명령은 메뉴 항목일 뿐이며, 동작을 자동으로 구현하지 않습니다
    - Plugin/Skill 명령은 Telegram 메뉴에 표시되지 않아도 입력하면 계속 동작할 수 있습니다

    네이티브 명령이 비활성화된 경우 기본 제공 명령이 제거됩니다. 구성된 경우 사용자 지정/Plugin 명령은 계속 등록될 수 있습니다.

    일반적인 설정 실패:

    - `BOT_COMMANDS_TOO_MUCH`와 함께 `setMyCommands failed`가 표시되면 잘라낸 뒤에도 Telegram 메뉴가 여전히 넘쳤다는 뜻입니다. Plugin/Skill/사용자 지정 명령을 줄이거나 `channels.telegram.commands.native`를 비활성화하세요.
    - 직접 Bot API curl 명령은 동작하지만 `deleteWebhook`, `deleteMyCommands` 또는 `setMyCommands`가 `404: Not Found`로 실패하면 `channels.telegram.apiRoot`가 전체 `/bot<TOKEN>` 엔드포인트로 설정되었을 수 있습니다. `apiRoot`는 Bot API 루트만이어야 하며, `openclaw doctor --fix`는 실수로 붙은 뒤쪽 `/bot<TOKEN>`을 제거합니다.
    - `getMe returned 401`은 Telegram이 구성된 봇 토큰을 거부했다는 뜻입니다. `botToken`, `tokenFile` 또는 `TELEGRAM_BOT_TOKEN`을 현재 BotFather 토큰으로 업데이트하세요. OpenClaw는 폴링 전에 중지되므로 이것은 Webhook 정리 실패로 보고되지 않습니다.
    - 네트워크/페치 오류와 함께 `setMyCommands failed`가 표시되면 일반적으로 `api.telegram.org`로 나가는 DNS/HTTPS가 차단되었다는 뜻입니다.

    ### 기기 페어링 명령(`device-pair` Plugin)

    `device-pair` Plugin이 설치된 경우:

    1. `/pair`가 설정 코드를 생성합니다
    2. iOS 앱에 코드를 붙여넣습니다
    3. `/pair pending`이 보류 중인 요청을 나열합니다(역할/범위 포함)
    4. 요청을 승인합니다:
       - 명시적 승인은 `/pair approve <requestId>`
       - 보류 중인 요청이 하나뿐이면 `/pair approve`
       - 가장 최근 요청은 `/pair approve latest`

    설정 코드는 수명이 짧은 부트스트랩 토큰을 포함합니다. 기본 제공 부트스트랩 인계는 기본 노드 토큰을 `scopes: []`로 유지합니다. 인계된 운영자 토큰은 `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`로 제한됩니다. 부트스트랩 범위 검사는 역할 접두사가 붙으므로 해당 운영자 허용 목록은 운영자 요청만 충족합니다. 운영자가 아닌 역할은 여전히 자체 역할 접두사 아래의 범위가 필요합니다.

    기기가 인증 세부 정보(예: 역할/범위/공개 키)를 변경해 다시 시도하면 이전 보류 요청이 대체되고 새 요청은 다른 `requestId`를 사용합니다. 승인하기 전에 `/pair pending`을 다시 실행하세요.

    자세한 내용: [페어링](/ko/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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
    - `allowlist`(기본값)

    기존 `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`에 매핑됩니다.

    메시지 작업 예:

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

    콜백 클릭은 텍스트로 에이전트에 전달됩니다:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram 도구 작업에는 다음이 포함됩니다:

    - `sendMessage`(`to`, `content`, 선택 사항 `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react`(`chatId`, `messageId`, `emoji`)
    - `deleteMessage`(`chatId`, `messageId`)
    - `editMessage`(`chatId`, `messageId`, `content`)
    - `createForumTopic`(`chatId`, `name`, 선택 사항 `iconColor`, `iconCustomEmojiId`)

    채널 메시지 작업은 사용하기 쉬운 별칭(`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)을 노출합니다.

    게이팅 제어:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`(기본값: 비활성화)

    참고: `edit`와 `topic-create`는 현재 기본적으로 활성화되어 있으며 별도의 `channels.telegram.actions.*` 토글이 없습니다.
    런타임 전송은 활성 구성/시크릿 스냅샷(시작/다시 로드)을 사용하므로 작업 경로는 전송마다 임시 SecretRef 재해석을 수행하지 않습니다.

    반응 제거 의미론: [/tools/reactions](/ko/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram은 생성된 출력에서 명시적 답글 스레딩 태그를 지원합니다:

    - `[[reply_to_current]]`는 트리거한 메시지에 답글을 답니다
    - `[[reply_to:<id>]]`는 특정 Telegram 메시지 ID에 답글을 답니다

    `channels.telegram.replyToMode`는 처리를 제어합니다:

    - `off`(기본값)
    - `first`
    - `all`

    답글 스레딩이 활성화되어 있고 원본 Telegram 텍스트 또는 캡션을 사용할 수 있으면 OpenClaw는 네이티브 Telegram 인용 발췌를 자동으로 포함합니다. Telegram은 네이티브 인용 텍스트를 1024 UTF-16 코드 단위로 제한하므로 더 긴 메시지는 시작 부분부터 인용되고, Telegram이 인용을 거부하면 일반 답글로 대체됩니다.

    참고: `off`는 암시적 답글 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 여전히 적용됩니다.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    포럼 슈퍼그룹:

    - 토픽 세션 키는 `:topic:<threadId>`를 덧붙입니다
    - 답글과 입력 상태는 토픽 스레드를 대상으로 합니다
    - 토픽 구성 경로:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    일반 토픽(`threadId=1`) 특수 사례:

    - 메시지 전송은 `message_thread_id`를 생략합니다(Telegram은 `sendMessage(...thread_id=1)`을 거부합니다)
    - 입력 작업은 여전히 `message_thread_id`를 포함합니다

    토픽 상속: 토픽 항목은 재정의되지 않는 한 그룹 설정을 상속합니다(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId`는 토픽 전용이며 그룹 기본값에서 상속되지 않습니다.

    **토픽별 에이전트 라우팅**: 각 토픽은 토픽 구성에서 `agentId`를 설정하여 다른 에이전트로 라우팅할 수 있습니다. 이렇게 하면 각 토픽에 자체 격리된 워크스페이스, 메모리, 세션이 제공됩니다. 예:

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

    **영구 ACP 토픽 바인딩**: 포럼 토픽은 최상위 typed ACP 바인딩(`type: "acp"` 및 `match.channel: "telegram"`, `peer.kind: "group"`, `-1001234567890:topic:42` 같은 토픽 한정 ID가 있는 `bindings[]`)을 통해 ACP 하니스 세션을 고정할 수 있습니다. 현재 그룹/슈퍼그룹의 포럼 토픽으로 범위가 제한됩니다. [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

    **채팅에서 스레드 바인딩 ACP 생성**: `/acp spawn <agent> --thread here|auto`는 현재 토픽을 새 ACP 세션에 바인딩합니다. 후속 메시지는 그곳으로 직접 라우팅됩니다. OpenClaw는 생성 확인을 토픽 안에 고정합니다. `channels.telegram.threadBindings.spawnAcpSessions=true`가 필요합니다.

    템플릿 컨텍스트는 `MessageThreadId`와 `IsForum`을 노출합니다. `message_thread_id`가 있는 DM 채팅은 DM 라우팅을 유지하지만 스레드 인식 세션 키를 사용합니다.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### 오디오 메시지

    Telegram은 음성 메모와 오디오 파일을 구분합니다.

    - 기본값: 오디오 파일 동작
    - 에이전트 답변의 `[[audio_as_voice]]` 태그로 음성 메모 전송을 강제합니다
    - 인바운드 음성 메모 전사는 에이전트 컨텍스트에서 기계 생성,
      신뢰할 수 없는 텍스트로 구성됩니다. 멘션 감지는 여전히 원시
      전사를 사용하므로 멘션 게이트가 적용된 음성 메시지도 계속 동작합니다.

    메시지 작업 예:

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

    Telegram은 비디오 파일과 비디오 메모를 구분합니다.

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

    비디오 메모는 캡션을 지원하지 않습니다. 제공된 메시지 텍스트는 별도로 전송됩니다.

    ### 스티커

    인바운드 스티커 처리:

    - 정적 WEBP: 다운로드되어 처리됨(플레이스홀더 `<media:sticker>`)
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

    스티커는 반복되는 비전 호출을 줄이기 위해 한 번 설명되고(가능한 경우) 캐시됩니다.

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

  <Accordion title="Reaction notifications">
    Telegram 반응은 `message_reaction` 업데이트로 도착합니다(메시지 페이로드와 별개).

    활성화되면 OpenClaw는 다음과 같은 시스템 이벤트를 큐에 넣습니다:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    구성:

    - `channels.telegram.reactionNotifications`: `off | own | all`(기본값: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`(기본값: `minimal`)

    참고:

    - `own`은 봇이 보낸 메시지에 대한 사용자 반응만 의미합니다(보낸 메시지 캐시를 통한 최선의 지원).
    - 반응 이벤트도 Telegram 접근 제어(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)를 그대로 따릅니다. 권한이 없는 발신자는 무시됩니다.
    - Telegram은 반응 업데이트에서 스레드 ID를 제공하지 않습니다.
      - 포럼이 아닌 그룹은 그룹 채팅 세션으로 라우팅됩니다.
      - 포럼 그룹은 정확한 원래 토픽이 아니라 그룹 일반 토픽 세션(`:topic:1`)으로 라우팅됩니다.

    폴링/Webhook의 `allowed_updates`에는 `message_reaction`이 자동으로 포함됩니다.

  </Accordion>

  <Accordion title="수신 확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    확인 순서:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 폴백(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Telegram은 유니코드 이모지(예: "👀")를 기대합니다.
    - 채널 또는 계정에서 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Telegram 이벤트 및 명령에서 설정 쓰기">
    채널 설정 쓰기는 기본적으로 활성화됩니다(`configWrites !== false`).

    Telegram으로 트리거되는 쓰기에는 다음이 포함됩니다.

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

  <Accordion title="Long polling과 Webhook">
    기본값은 Long polling입니다. Webhook 모드의 경우 `channels.telegram.webhookUrl` 및 `channels.telegram.webhookSecret`을 설정하세요. 선택적으로 `webhookPath`, `webhookHost`, `webhookPort`를 설정할 수 있습니다(기본값은 `/telegram-webhook`, `127.0.0.1`, `8787`).

    로컬 리스너는 `127.0.0.1:8787`에 바인딩됩니다. 공개 인그레스의 경우 로컬 포트 앞에 리버스 프록시를 두거나 의도적으로 `webhookHost: "0.0.0.0"`을 설정하세요.

    Webhook 모드는 Telegram에 `200`을 반환하기 전에 요청 가드, Telegram 비밀 토큰, JSON 본문을 검증합니다.
    그런 다음 OpenClaw는 Long polling에서 사용하는 동일한 채팅별/토픽별 봇 레인을 통해 업데이트를 비동기적으로 처리하므로, 느린 에이전트 턴이 Telegram의 전달 ACK를 붙잡지 않습니다.

  </Accordion>

  <Accordion title="제한, 재시도, CLI 대상">
    - `channels.telegram.textChunkLimit` 기본값은 4000입니다.
    - `channels.telegram.chunkMode="newline"`은 길이 분할 전에 문단 경계(빈 줄)를 우선합니다.
    - `channels.telegram.mediaMaxMb`(기본값 100)는 인바운드 및 아웃바운드 Telegram 미디어 크기를 제한합니다.
    - `channels.telegram.timeoutSeconds`는 Telegram API 클라이언트 타임아웃을 재정의합니다(설정하지 않으면 grammY 기본값이 적용됨). Long-polling 봇 클라이언트는 설정된 값을 45초 `getUpdates` 요청 가드보다 낮게 제한하여, 30초 폴링 창이 완료되기 전에 유휴 폴링이 중단되지 않도록 합니다.
    - `channels.telegram.pollingStallThresholdMs`의 기본값은 `120000`입니다. 거짓 양성 폴링 정체 재시작이 발생할 때만 `30000`에서 `600000` 사이로 조정하세요.
    - 그룹 컨텍스트 기록은 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`을 사용합니다(기본값 50). `0`은 비활성화합니다.
    - 답장/인용/전달 보조 컨텍스트는 현재 수신된 그대로 전달됩니다.
    - Telegram 허용 목록은 주로 누가 에이전트를 트리거할 수 있는지를 제어하며, 완전한 보조 컨텍스트 수정 경계가 아닙니다.
    - DM 기록 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 설정은 복구 가능한 아웃바운드 API 오류에 대해 Telegram 전송 헬퍼(CLI/도구/작업)에 적용됩니다. 인바운드 최종 답장 전달도 Telegram 사전 연결 실패에 대해 제한된 안전 전송 재시도를 사용하지만, 표시되는 메시지가 중복될 수 있는 모호한 전송 후 네트워크 엔벨로프는 재시도하지 않습니다.

    CLI 전송 대상은 숫자 채팅 ID 또는 사용자 이름일 수 있습니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 폴링은 `openclaw message poll`을 사용하며 포럼 토픽을 지원합니다.

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 폴링 플래그:

    - `--poll-duration-seconds`(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - 포럼 토픽용 `--thread-id`(또는 `:topic:` 대상 사용)

    Telegram 전송은 다음도 지원합니다.

    - `channels.telegram.capabilities.inlineButtons`가 허용하는 경우 인라인 키보드용 `buttons` 블록과 함께 `--presentation`
    - 봇이 해당 채팅에서 고정할 수 있을 때 고정 전달을 요청하는 `--pin` 또는 `--delivery '{"pin":true}'`
    - 아웃바운드 이미지와 GIF를 압축된 사진 또는 애니메이션 미디어 업로드 대신 문서로 보내는 `--force-document`

    작업 게이팅:

    - `channels.telegram.actions.sendMessage=false`는 폴링을 포함한 아웃바운드 Telegram 메시지를 비활성화합니다.
    - `channels.telegram.actions.poll=false`는 일반 전송은 활성화한 채 Telegram 폴링 생성을 비활성화합니다.

  </Accordion>

  <Accordion title="Telegram의 실행 승인">
    Telegram은 승인자 DM에서 실행 승인을 지원하며, 선택적으로 원래 채팅 또는 토픽에 프롬프트를 게시할 수 있습니다. 승인자는 숫자 Telegram 사용자 ID여야 합니다.

    설정 경로:

    - `channels.telegram.execApprovals.enabled`(확인 가능한 승인자가 하나 이상 있으면 자동 활성화)
    - `channels.telegram.execApprovals.approvers`(`commands.ownerAllowFrom`의 숫자 소유자 ID로 폴백)
    - `channels.telegram.execApprovals.target`: `dm`(기본값) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, `defaultTo`는 누가 봇과 대화할 수 있는지와 일반 답장을 어디로 보내는지를 제어합니다. 이것들이 누군가를 실행 승인자로 만들지는 않습니다. 아직 명령 소유자가 없을 때 첫 승인된 DM 페어링이 `commands.ownerAllowFrom`을 부트스트랩하므로, 단일 소유자 설정은 `execApprovals.approvers` 아래에 ID를 중복하지 않아도 계속 작동합니다.

    채널 전달은 채팅에 명령 텍스트를 표시합니다. 신뢰할 수 있는 그룹/토픽에서만 `channel` 또는 `both`를 활성화하세요. 프롬프트가 포럼 토픽에 도착하면 OpenClaw는 승인 프롬프트와 후속 메시지에 해당 토픽을 유지합니다. 실행 승인은 기본적으로 30분 후 만료됩니다.

    인라인 승인 버튼도 대상 표면(`dm`, `group` 또는 `all`)을 허용하도록 `channels.telegram.capabilities.inlineButtons`가 필요합니다. `plugin:` 접두사가 붙은 승인 ID는 Plugin 승인을 통해 확인되고, 그 외의 ID는 먼저 실행 승인을 통해 확인됩니다.

    [실행 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 오류 답장 제어

에이전트에 전달 또는 공급자 오류가 발생하면 Telegram은 오류 텍스트로 답장하거나 이를 억제할 수 있습니다. 이 동작은 두 설정 키로 제어합니다.

| 키                                  | 값                | 기본값  | 설명                                                                                              |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`는 채팅에 친절한 오류 메시지를 보냅니다. `silent`는 오류 답장을 완전히 억제합니다.        |
| `channels.telegram.errorCooldownMs` | 숫자(ms)          | `60000` | 같은 채팅에 대한 오류 답장 사이의 최소 시간입니다. 장애 중 오류 스팸을 방지합니다.              |

계정별, 그룹별, 토픽별 재정의가 지원됩니다(다른 Telegram 설정 키와 동일한 상속).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
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
  <Accordion title="봇이 멘션이 없는 그룹 메시지에 응답하지 않음">

    - `requireMention=false`인 경우 Telegram 프라이버시 모드가 전체 표시를 허용해야 합니다.
      - BotFather: `/setprivacy` -> Disable
      - 그런 다음 그룹에서 봇을 제거했다가 다시 추가하세요.
    - 설정이 멘션되지 않은 그룹 메시지를 기대할 때 `openclaw channels status`가 경고합니다.
    - `openclaw channels status --probe`는 명시적인 숫자 그룹 ID를 확인할 수 있습니다. 와일드카드 `"*"`는 멤버십 프로브를 수행할 수 없습니다.
    - 빠른 세션 테스트: `/activation always`.

  </Accordion>

  <Accordion title="봇이 그룹 메시지를 전혀 보지 못함">

    - `channels.telegram.groups`가 있으면 그룹이 나열되어 있어야 합니다(또는 `"*"` 포함).
    - 그룹의 봇 멤버십을 확인하세요.
    - 건너뛰기 이유는 로그에서 확인하세요: `openclaw logs --follow`

  </Accordion>

  <Accordion title="명령이 부분적으로만 작동하거나 전혀 작동하지 않음">

    - 발신자 ID를 승인하세요(페어링 및/또는 숫자 `allowFrom`).
    - 그룹 정책이 `open`이어도 명령 권한 부여는 계속 적용됩니다.
    - `BOT_COMMANDS_TOO_MUCH`와 함께 `setMyCommands failed`가 발생하면 네이티브 메뉴 항목이 너무 많다는 뜻입니다. Plugin/Skills/사용자 지정 명령을 줄이거나 네이티브 메뉴를 비활성화하세요.
    - `deleteMyCommands` / `setMyCommands` 시작 호출은 제한되며 요청 타임아웃 시 Telegram의 전송 폴백을 통해 한 번 재시도합니다. 지속적인 네트워크/가져오기 오류는 일반적으로 `api.telegram.org`에 대한 DNS/HTTPS 도달성 문제를 나타냅니다.

  </Accordion>

  <Accordion title="시작 시 권한 없는 토큰이 보고됨">

    - `getMe returned 401`은 설정된 봇 토큰에 대한 Telegram 인증 실패입니다.
    - BotFather에서 봇 토큰을 다시 복사하거나 재생성한 다음, 기본 계정에 대해 `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` 또는 `TELEGRAM_BOT_TOKEN`을 업데이트하세요.
    - 시작 중 `deleteWebhook 401 Unauthorized`도 인증 실패입니다. 이를 "Webhook이 없음"으로 처리하면 같은 잘못된 토큰 실패가 이후 API 호출로 지연될 뿐입니다.
    - 폴링 시작 중 일시적인 네트워크 오류로 `deleteWebhook`이 실패하면 OpenClaw는 `getWebhookInfo`를 확인합니다. Telegram이 빈 Webhook URL을 보고하면 정리가 이미 충족되었으므로 폴링이 계속됩니다.

  </Accordion>

  <Accordion title="폴링 또는 네트워크 불안정">

    - Node 22+와 사용자 지정 fetch/proxy는 AbortSignal 타입이 일치하지 않으면 즉시 중단 동작을 유발할 수 있습니다.
    - 일부 호스트는 `api.telegram.org`를 IPv6로 먼저 해석합니다. IPv6 송신이 손상되어 있으면 간헐적인 Telegram API 실패가 발생할 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 포함되어 있으면, OpenClaw는 이제 이를 복구 가능한 네트워크 오류로 재시도합니다.
    - Telegram 소켓이 짧고 고정된 주기로 재활용된다면 낮은 `channels.telegram.timeoutSeconds` 값을 확인하세요. long-polling 봇 클라이언트는 `getUpdates` 요청 가드보다 낮게 구성된 값을 제한하지만, 이전 릴리스에서는 이 값이 long-poll timeout보다 낮게 설정된 경우 모든 poll이 중단될 수 있었습니다.
    - 로그에 `Polling stall detected`가 포함되어 있으면, OpenClaw는 기본적으로 완료된 long-poll liveness가 120초 동안 없을 때 polling을 다시 시작하고 Telegram transport를 다시 빌드합니다.
    - `openclaw channels status --probe`와 `openclaw doctor`는 실행 중인 polling 계정이 시작 유예 시간 후 `getUpdates`를 완료하지 않았거나, 실행 중인 webhook 계정이 시작 유예 시간 후 `setWebhook`을 완료하지 않았거나, 마지막으로 성공한 polling transport 활동이 오래된 경우 경고합니다.
    - 오래 실행되는 `getUpdates` 호출이 정상인데도 호스트가 잘못된 polling-stall 재시작을 계속 보고하는 경우에만 `channels.telegram.pollingStallThresholdMs`를 늘리세요. 지속적인 stall은 보통 호스트와 `api.telegram.org` 사이의 proxy, DNS, IPv6 또는 TLS 송신 문제를 가리킵니다.
    - Telegram은 Bot API transport에 대해 `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` 및 그 소문자 변형을 포함한 프로세스 proxy env도 따릅니다. `NO_PROXY` / `no_proxy`는 여전히 `api.telegram.org`를 우회할 수 있습니다.
    - 서비스 환경에서 OpenClaw 관리 proxy가 `OPENCLAW_PROXY_URL`로 구성되어 있고 표준 proxy env가 없으면, Telegram도 Bot API transport에 해당 URL을 사용합니다.
    - 직접 송신/TLS가 불안정한 VPS 호스트에서는 `channels.telegram.proxy`를 통해 Telegram API 호출을 라우팅하세요.

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+는 기본적으로 `autoSelectFamily=true`(WSL2 제외)와 `dnsResultOrder=ipv4first`를 사용합니다.
    - 호스트가 WSL2이거나 IPv4 전용 동작이 명시적으로 더 잘 작동한다면 family 선택을 강제하세요.

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 벤치마크 범위 응답(`198.18.0.0/15`)은 기본적으로 Telegram 미디어 다운로드에 이미 허용됩니다. 신뢰할 수 있는 fake-IP 또는 투명 proxy가 미디어 다운로드 중 `api.telegram.org`를 다른 private/internal/special-use 주소로 다시 쓰는 경우, Telegram 전용 우회에 옵트인할 수 있습니다.

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 동일한 옵트인은 계정별로
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`에서도 사용할 수 있습니다.
    - proxy가 Telegram 미디어 호스트를 `198.18.x.x`로 해석한다면 먼저 dangerous 플래그를 꺼 둔 상태로 두세요. Telegram 미디어는 기본적으로 RFC 2544 벤치마크 범위를 이미 허용합니다.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`는 Telegram
      미디어 SSRF 보호를 약화합니다. RFC 2544 벤치마크 범위 밖의 private 또는 special-use 응답을 합성하는 Clash, Mihomo, Surge fake-IP 라우팅 같은 신뢰할 수 있는 운영자 제어 proxy 환경에서만 사용하세요. 일반적인 public internet Telegram 접근에는 꺼 둔 상태로 두세요.
    </Warning>

    - 환경 override(임시):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 응답을 검증하세요.

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

- 시작/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile`은 일반 파일을 가리켜야 하며 symlink는 거부됩니다)
- 접근 제어: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, 최상위 `bindings[]` (`type: "acp"`)
- exec 승인: `execApprovals`, `accounts.*.execApprovals`
- 명령/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- 사용자 지정 API root: `apiRoot` (Bot API root만 해당, `/bot<TOKEN>`을 포함하지 마세요)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- 오류: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
다중 계정 우선순위: 둘 이상의 계정 ID가 구성된 경우 기본 라우팅을 명시하려면 `channels.telegram.defaultAccount`를 설정하거나 `channels.telegram.accounts.default`를 포함하세요. 그렇지 않으면 OpenClaw는 첫 번째로 정규화된 계정 ID로 fallback하고 `openclaw doctor`가 경고합니다. 이름이 있는 계정은 `channels.telegram.allowFrom` / `groupAllowFrom`을 상속하지만 `accounts.default.*` 값은 상속하지 않습니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Telegram 사용자를 Gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 및 주제 allowlist 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    수신 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델과 강화입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    그룹과 주제를 에이전트에 매핑합니다.
  </Card>
  <Card title="문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    교차 채널 진단입니다.
  </Card>
</CardGroup>
