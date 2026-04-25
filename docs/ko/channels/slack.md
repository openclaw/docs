---
read_when:
    - Slack 설정 또는 Slack 소켓/HTTP 모드 디버깅
summary: Slack 설정 및 런타임 동작(Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-25T05:56:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

DM 및 채널용 Slack 앱 통합에 대해 프로덕션 준비가 완료되어 있습니다. 기본 모드는 Socket Mode이며, HTTP Request URL도 지원됩니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Slack DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    기본 명령 동작 및 명령 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="Socket Mode (기본)">
    <Steps>
      <Step title="새 Slack 앱 만들기">
        Slack 앱 설정에서 **[Create New App](https://api.slack.com/apps/new)** 버튼을 누르세요.

        - **from a manifest**를 선택하고 앱에 사용할 워크스페이스를 선택합니다
        - 아래의 [예시 manifest](#manifest-and-scope-checklist)를 붙여넣고 계속 진행하여 생성합니다
        - `connections:write` 권한이 있는 **App-Level Token**(`xapp-...`)을 생성합니다
        - 앱을 설치하고 표시되는 **Bot Token**(`xoxb-...`)을 복사합니다
      </Step>

      <Step title="OpenClaw 구성">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Env 대체 값(기본 계정만 해당):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL">
    <Steps>
      <Step title="새 Slack 앱 만들기">
        Slack 앱 설정에서 **[Create New App](https://api.slack.com/apps/new)** 버튼을 누르세요.

        - **from a manifest**를 선택하고 앱에 사용할 워크스페이스를 선택합니다
        - [예시 manifest](#manifest-and-scope-checklist)를 붙여넣고 생성 전에 URL을 업데이트합니다
        - 요청 검증에 사용할 **Signing Secret**을 저장합니다
        - 앱을 설치하고 표시되는 **Bot Token**(`xoxb-...`)을 복사합니다

      </Step>

      <Step title="OpenClaw 구성">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        다중 계정 HTTP에는 고유한 Webhook 경로를 사용하세요

        등록이 충돌하지 않도록 각 계정에 서로 다른 `webhookPath`(기본값 `/slack/events`)를 지정하세요.
        </Note>

      </Step>

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest 및 scope 체크리스트

기본 Slack 앱 manifest는 Socket Mode와 HTTP Request URL에서 동일합니다. `settings` 블록(및 슬래시 명령어 `url`)만 다릅니다.

기본 manifest(Socket Mode 기본값):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

**HTTP Request URL 모드**의 경우 `settings`를 HTTP 변형으로 교체하고 각 슬래시 명령어에 `url`을 추가하세요. 공개 URL이 필요합니다.

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* Socket Mode와 동일 */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### 추가 manifest 설정

위 기본값을 확장하는 다양한 기능을 표시합니다.

<AccordionGroup>
  <Accordion title="선택적 기본 슬래시 명령어">

    단일 구성 명령어 대신 여러 [기본 슬래시 명령어](#commands-and-slash-behavior)를 미묘한 차이와 함께 사용할 수 있습니다.

    - `/status` 명령어는 예약되어 있으므로 `/status` 대신 `/agentstatus`를 사용하세요.
    - 한 번에 사용할 수 있는 슬래시 명령어는 25개를 초과할 수 없습니다.

    기존 `features.slash_commands` 섹션을 [사용 가능한 명령어](/ko/tools/slash-commands#command-list)의 일부로 교체하세요.

    <Tabs>
      <Tab title="Socket Mode (기본)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URL">
        위 Socket Mode와 동일한 `slash_commands` 목록을 사용하고, 모든 항목에 `"url": "https://gateway-host.example.com/slack/events"`를 추가하세요. 예:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...모든 명령어에 동일한 `url` 값을 반복
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="선택적 작성자 scope(쓰기 작업)">
    아웃바운드 메시지가 기본 Slack 앱 ID 대신 활성 에이전트 ID(사용자 지정 사용자 이름 및 아이콘)를 사용하도록 하려면 `chat:write.customize` bot scope를 추가하세요.

    이모지 아이콘을 사용하는 경우 Slack은 `:emoji_name:` 구문을 기대합니다.

  </Accordion>
  <Accordion title="선택적 사용자 토큰 scope(읽기 작업)">
    `channels.slack.userToken`을 구성하는 경우 일반적인 읽기 scope는 다음과 같습니다.

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack 검색 읽기에 의존하는 경우)

  </Accordion>
</AccordionGroup>

## 토큰 모델

- Socket Mode에는 `botToken` + `appToken`이 필요합니다.
- HTTP 모드에는 `botToken` + `signingSecret`이 필요합니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 받을 수 있습니다.
- 구성 토큰이 env 대체 값보다 우선합니다.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env 대체 값은 기본 계정에만 적용됩니다.
- `userToken`(`xoxp-...`)은 구성 전용이며(env 대체 값 없음), 기본적으로 읽기 전용 동작(`userTokenReadOnly: true`)을 사용합니다.

상태 스냅샷 동작:

- Slack 계정 점검은 자격 증명별 `*Source` 및 `*Status`
  필드(`botToken`, `appToken`, `signingSecret`, `userToken`)를 추적합니다.
- 상태는 `available`, `configured_unavailable`, 또는 `missing`입니다.
- `configured_unavailable`은 계정이 SecretRef
  또는 다른 비인라인 시크릿 소스를 통해 구성되었지만, 현재 명령/런타임 경로에서
  실제 값을 확인할 수 없었음을 의미합니다.
- HTTP 모드에서는 `signingSecretStatus`가 포함되며, Socket Mode에서는
  필수 쌍이 `botTokenStatus` + `appTokenStatus`입니다.

<Tip>
작업/디렉터리 읽기의 경우 구성되어 있다면 사용자 토큰이 우선될 수 있습니다. 쓰기의 경우 bot 토큰이 계속 우선이며, 사용자 토큰 쓰기는 `userTokenReadOnly: false`이고 bot 토큰을 사용할 수 없을 때만 허용됩니다.
</Tip>

## 작업 및 게이트

Slack 작업은 `channels.slack.actions.*`로 제어됩니다.

현재 Slack 도구에서 사용할 수 있는 작업 그룹:

| 그룹      | 기본값 |
| ---------- | ------- |
| messages   | 활성화 |
| reactions  | 활성화 |
| pins       | 활성화 |
| memberInfo | 활성화 |
| emojiList  | 활성화 |

현재 Slack 메시지 작업에는 `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list`가 포함됩니다. `download-file`은 인바운드 파일 플레이스홀더에 표시되는 Slack 파일 ID를 받을 수 있으며, 이미지의 경우 이미지 미리보기를, 그 외 파일 형식의 경우 로컬 파일 메타데이터를 반환합니다.

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.slack.dmPolicy`는 DM 액세스를 제어합니다(레거시: `channels.slack.dm.policy`).

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.slack.allowFrom`에 `"*"`가 포함되어 있어야 함, 레거시: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM 플래그:

    - `dm.enabled` (기본값 true)
    - `channels.slack.allowFrom` (권장)
    - `dm.allowFrom` (레거시)
    - `dm.groupEnabled` (그룹 DM 기본값 false)
    - `dm.groupChannels` (선택적 MPIM 허용 목록)

    다중 계정 우선순위:

    - `channels.slack.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름이 있는 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.slack.allowFrom`을 상속합니다.
    - 이름이 있는 계정은 `channels.slack.accounts.default.allowFrom`을 상속하지 않습니다.

    DM에서의 페어링은 `openclaw pairing approve slack <code>`를 사용합니다.

  </Tab>

  <Tab title="채널 정책">
    `channels.slack.groupPolicy`는 채널 처리를 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    채널 허용 목록은 `channels.slack.channels` 아래에 있으며 안정적인 채널 ID를 사용해야 합니다.

    런타임 참고: `channels.slack`이 완전히 누락된 경우(env 전용 설정), 런타임은 `groupPolicy="allowlist"`로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).

    이름/ID 확인:

    - 채널 허용 목록 항목과 DM 허용 목록 항목은 토큰 액세스가 허용될 때 시작 시 확인됩니다
    - 확인되지 않은 채널 이름 항목은 구성된 상태로 유지되지만 기본적으로 라우팅에서는 무시됩니다
    - 인바운드 인증과 채널 라우팅은 기본적으로 ID 우선이며, 직접 사용자 이름/슬러그 일치를 사용하려면 `channels.slack.dangerouslyAllowNameMatching: true`가 필요합니다

  </Tab>

  <Tab title="멘션 및 채널 사용자">
    채널 메시지는 기본적으로 멘션 게이트가 적용됩니다.

    멘션 소스:

    - 명시적 앱 멘션 (`<@botId>`)
    - 멘션 정규식 패턴 (`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 봇에게 답장하는 스레드의 암시적 동작 (`thread.requireExplicitMention`이 `true`이면 비활성화)

    채널별 제어(`channels.slack.channels.<id>`; 이름은 시작 시 확인 또는 `dangerouslyAllowNameMatching`을 통해서만 사용 가능):

    - `requireMention`
    - `users` (허용 목록)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 키 형식: `id:`, `e164:`, `username:`, `name:`, 또는 `"*"` 와일드카드
      (레거시 접두사 없는 키는 여전히 `id:`로만 매핑됨)

  </Tab>
</Tabs>

## 스레딩, 세션 및 답장 태그

- DM은 `direct`로, 채널은 `channel`로, MPIM은 `group`으로 라우팅됩니다.
- 기본 `session.dmScope=main`에서는 Slack DM이 에이전트 메인 세션으로 통합됩니다.
- 채널 세션: `agent:<agentId>:slack:channel:<channelId>`.
- 스레드 답장은 적용 가능한 경우 스레드 세션 접미사(`:thread:<threadTs>`)를 생성할 수 있습니다.
- `channels.slack.thread.historyScope` 기본값은 `thread`이며, `thread.inheritParent` 기본값은 `false`입니다.
- `channels.slack.thread.initialHistoryLimit`는 새 스레드 세션이 시작될 때 가져올 기존 스레드 메시지 수를 제어합니다(기본값 `20`, 비활성화하려면 `0`으로 설정).
- `channels.slack.thread.requireExplicitMention` (기본값 `false`): `true`이면 암시적 스레드 멘션을 억제하여, 봇이 이미 해당 스레드에 참여했더라도 스레드 내 명시적 `@bot` 멘션에만 응답합니다. 이 설정이 없으면 봇이 참여한 스레드의 답장은 `requireMention` 게이팅을 우회합니다.

답장 스레딩 제어:

- `channels.slack.replyToMode`: `off|first|all|batched` (기본값 `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel`별 설정
- direct 채팅용 레거시 대체값: `channels.slack.dm.replyToMode`

수동 답장 태그가 지원됩니다.

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

참고: `replyToMode="off"`는 명시적 `[[reply_to_*]]` 태그를 포함해 Slack의 **모든** 답장 스레딩을 비활성화합니다. 이는 Telegram과 다릅니다. Telegram에서는 `"off"` 모드에서도 명시적 태그가 여전히 적용되지만, Slack 스레드는 메시지를 채널에서 숨기는 반면 Telegram 답장은 인라인으로 계속 표시됩니다.

## Ack 반응

`ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인용 이모지를 보냅니다.

확인 순서:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 에이전트 ID 이모지 대체값 (`agents.list[].identity.emoji`, 없으면 "👀")

참고:

- Slack은 shortcode를 기대합니다(예: `"eyes"`).
- Slack 계정별 또는 전체적으로 반응을 비활성화하려면 `""`를 사용하세요.

## 텍스트 스트리밍

`channels.slack.streaming`은 실시간 미리보기 동작을 제어합니다.

- `off`: 실시간 미리보기 스트리밍을 비활성화합니다.
- `partial` (기본값): 미리보기 텍스트를 최신 부분 출력으로 대체합니다.
- `block`: 청크 단위 미리보기 업데이트를 추가합니다.
- `progress`: 생성 중 진행 상태 텍스트를 표시한 뒤 최종 텍스트를 보냅니다.
- `streaming.preview.toolProgress`: 초안 미리보기가 활성화된 경우 도구/진행 상태 업데이트를 동일한 편집 미리보기 메시지로 라우팅합니다(기본값: `true`). 별도의 도구/진행 상태 메시지를 유지하려면 `false`로 설정하세요.

`channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode`가 `partial`일 때 Slack 기본 텍스트 스트리밍을 제어합니다(기본값: `true`).

- 기본 텍스트 스트리밍과 Slack assistant 스레드 상태가 표시되려면 답장 스레드를 사용할 수 있어야 합니다. 스레드 선택은 계속 `replyToMode`를 따릅니다.
- 기본 텍스트 스트리밍을 사용할 수 없는 경우에도 채널 및 그룹 채팅 루트에서는 일반 초안 미리보기를 사용할 수 있습니다.
- 최상위 Slack DM은 기본적으로 스레드 밖에 유지되므로 스레드 스타일 미리보기가 표시되지 않습니다. 해당 위치에서 진행 상태를 표시하려면 스레드 답장 또는 `typingReaction`을 사용하세요.
- 미디어 및 비텍스트 페이로드는 일반 전송으로 대체됩니다.
- 미디어/오류 최종 응답은 대기 중인 미리보기 편집을 취소합니다. 적격 텍스트/블록 최종 응답은 미리보기를 제자리에서 편집할 수 있을 때만 플러시됩니다.
- 답장 도중 스트리밍에 실패하면 OpenClaw는 나머지 페이로드에 대해 일반 전송으로 대체합니다.

Slack 기본 텍스트 스트리밍 대신 초안 미리보기를 사용하세요.

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

레거시 키:

- `channels.slack.streamMode` (`replace | status_final | append`)는 `channels.slack.streaming.mode`로 자동 마이그레이션됩니다.
- 불리언 `channels.slack.streaming`은 `channels.slack.streaming.mode`와 `channels.slack.streaming.nativeTransport`로 자동 마이그레이션됩니다.
- 레거시 `channels.slack.nativeStreaming`은 `channels.slack.streaming.nativeTransport`로 자동 마이그레이션됩니다.

## 입력 중 반응 대체

`typingReaction`은 OpenClaw가 답장을 처리하는 동안 인바운드 Slack 메시지에 임시 반응을 추가하고, 실행이 끝나면 이를 제거합니다. 이는 기본 `"is typing..."` 상태 표시기를 사용하는 스레드 답장 밖에서 특히 유용합니다.

확인 순서:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

참고:

- Slack은 shortcode를 기대합니다(예: `"hourglass_flowing_sand"`).
- 이 반응은 best-effort 방식이며, 답장 또는 실패 경로가 완료되면 자동으로 정리하려고 시도합니다.

## 미디어, 청크 분할 및 전송

<AccordionGroup>
  <Accordion title="인바운드 첨부 파일">
    Slack 파일 첨부 파일은 Slack이 호스팅하는 비공개 URL(토큰 인증 요청 흐름)에서 다운로드되며, 가져오기에 성공하고 크기 제한을 충족하면 미디어 저장소에 기록됩니다. 파일 플레이스홀더에는 Slack `fileId`가 포함되므로 에이전트가 `download-file`로 원본 파일을 가져올 수 있습니다.

    런타임 인바운드 크기 상한은 `channels.slack.mediaMaxMb`로 재정의하지 않는 한 기본값 `20MB`입니다.

  </Accordion>

  <Accordion title="아웃바운드 텍스트 및 파일">
    - 텍스트 청크는 `channels.slack.textChunkLimit`를 사용합니다(기본값 4000)
    - `channels.slack.chunkMode="newline"`는 문단 우선 분할을 활성화합니다
    - 파일 전송은 Slack 업로드 API를 사용하며 스레드 답장(`thread_ts`)을 포함할 수 있습니다
    - 아웃바운드 미디어 상한은 구성된 경우 `channels.slack.mediaMaxMb`를 따르며, 그렇지 않으면 채널 전송은 미디어 파이프라인의 MIME 종류 기본값을 사용합니다
  </Accordion>

  <Accordion title="전송 대상">
    권장되는 명시적 대상:

    - DM의 경우 `user:<id>`
    - 채널의 경우 `channel:<id>`

    Slack DM은 사용자 대상으로 전송할 때 Slack 대화 API를 통해 열립니다.

  </Accordion>
</AccordionGroup>

## 명령어 및 슬래시 동작

Slack의 슬래시 명령어는 단일 구성 명령어 또는 여러 기본 명령어로 표시될 수 있습니다. 명령어 기본값을 변경하려면 `channels.slack.slashCommand`를 구성하세요.

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

기본 명령어를 사용하려면 Slack 앱에 [추가 manifest 설정](#additional-manifest-settings)이 필요하며, 대신 `channels.slack.commands.native: true` 또는 전역 구성의 `commands.native: true`로 활성화합니다.

- Slack에서는 기본 명령어 자동 모드가 **비활성화**이므로 `commands.native: "auto"`는 Slack 기본 명령어를 활성화하지 않습니다.

```txt
/help
```

기본 인수 메뉴는 선택된 옵션 값을 전달하기 전에 확인 모달을 표시하는 적응형 렌더링 전략을 사용합니다.

- 최대 5개 옵션: 버튼 블록
- 6~100개 옵션: 정적 선택 메뉴
- 100개 초과 옵션: 상호작용 옵션 핸들러를 사용할 수 있을 때 비동기 옵션 필터링을 사용하는 외부 선택
- Slack 제한 초과: 인코딩된 옵션 값은 버튼으로 대체

```txt
/think
```

슬래시 세션은 `agent:<agentId>:slack:slash:<userId>` 같은 격리된 키를 사용하며, 여전히 `CommandTargetSessionKey`를 사용해 명령 실행을 대상 대화 세션으로 라우팅합니다.

## 상호작용 답장

Slack은 에이전트가 작성한 상호작용 답장 컨트롤을 렌더링할 수 있지만, 이 기능은 기본적으로 비활성화되어 있습니다.

전역으로 활성화:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

또는 하나의 Slack 계정에만 활성화:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

활성화되면 에이전트는 Slack 전용 답장 지시문을 출력할 수 있습니다.

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

이 지시문은 Slack Block Kit으로 컴파일되며 클릭 또는 선택이 기존 Slack 상호작용 이벤트 경로를 통해 다시 라우팅됩니다.

참고:

- 이것은 Slack 전용 UI입니다. 다른 채널은 Slack Block Kit 지시문을 자체 버튼 시스템으로 변환하지 않습니다.
- 상호작용 콜백 값은 OpenClaw가 생성한 불투명 토큰이며, 에이전트가 직접 작성한 원시 값이 아닙니다.
- 생성된 상호작용 블록이 Slack Block Kit 제한을 초과하면 OpenClaw는 잘못된 blocks 페이로드를 보내는 대신 원래 텍스트 답장으로 대체합니다.

## Slack에서의 exec 승인

Slack은 Web UI나 터미널로 대체하는 대신, 상호작용 버튼과 상호작용을 사용하는 기본 승인 클라이언트로 동작할 수 있습니다.

- Exec 승인은 기본 DM/채널 라우팅을 위해 `channels.slack.execApprovals.*`를 사용합니다.
- Plugin 승인은 요청이 이미 Slack에 도달했고 승인 ID 종류가 `plugin:`일 때 동일한 Slack 기본 버튼 표면을 통해 계속 처리될 수 있습니다.
- 승인자 권한 부여는 계속 적용됩니다. 승인자로 식별된 사용자만 Slack을 통해 요청을 승인하거나 거부할 수 있습니다.

이는 다른 채널과 동일한 공유 승인 버튼 표면을 사용합니다. Slack 앱 설정에서 `interactivity`가 활성화되면 승인 프롬프트가 대화 내에서 직접 Block Kit 버튼으로 렌더링됩니다.
이 버튼이 있을 때는 이것이 기본 승인 UX이며, OpenClaw는 도구 결과에서 채팅 승인을 사용할 수 없다고 표시되거나 수동 승인이 유일한 경로일 때만 수동 `/approve` 명령을 포함해야 합니다.

구성 경로:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (선택 사항; 가능하면 `commands.ownerAllowFrom`으로 대체)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `agentFilter`, `sessionFilter`

Slack은 `enabled`가 설정되지 않았거나 `"auto"`이고 최소 한 명의
승인자가 확인되면 기본 exec 승인을 자동 활성화합니다. Slack을 기본 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.
승인자가 확인될 때 기본 승인을 강제로 켜려면 `enabled: true`를 설정하세요.

명시적인 Slack exec 승인 구성 없이 사용하는 기본 동작:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

승인자를 재정의하거나, 필터를 추가하거나,
원래 채팅으로의 전송을 선택하려는 경우에만 명시적인 Slack 기본 구성이 필요합니다.

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

공유 `approvals.exec` 전달은 별개입니다. exec 승인 프롬프트를 다른 채팅이나 명시적인 대역 외 대상에도
전달해야 할 때만 사용하세요. 공유 `approvals.plugin` 전달도
별개입니다. Slack 기본 버튼은 해당 요청이 이미 Slack에 도달한 경우에도
Plugin 승인을 계속 처리할 수 있습니다.

동일 채팅의 `/approve`는 이미 명령어를 지원하는 Slack 채널과 DM에서도 동작합니다. 전체 승인 전달 모델은 [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

## 이벤트 및 운영 동작

- 메시지 수정/삭제는 시스템 이벤트로 매핑됩니다.
- 스레드 브로드캐스트("채널에도 보내기" 스레드 답장)는 일반 사용자 메시지로 처리됩니다.
- 반응 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- 멤버 참여/이탈, 채널 생성/이름 변경, 핀 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- `configWrites`가 활성화된 경우 `channel_id_changed`는 채널 구성 키를 마이그레이션할 수 있습니다.
- 채널 주제/목적 메타데이터는 신뢰되지 않은 컨텍스트로 처리되며 라우팅 컨텍스트에 주입될 수 있습니다.
- 스레드 시작자와 초기 스레드 기록 컨텍스트 시딩은 적용 가능한 경우 구성된 발신자 허용 목록으로 필터링됩니다.
- 블록 작업과 모달 상호작용은 풍부한 페이로드 필드와 함께 구조화된 `Slack interaction: ...` 시스템 이벤트를 생성합니다.
  - 블록 작업: 선택된 값, 레이블, picker 값, `workflow_*` 메타데이터
  - 모달 `view_submission` 및 `view_closed` 이벤트: 라우팅된 채널 메타데이터와 폼 입력 포함

## 구성 참조

기본 참조: [Configuration reference - Slack](/ko/gateway/config-channels#slack).

<Accordion title="중요한 Slack 필드">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 액세스: `dm.enabled`, `dmPolicy`, `allowFrom` (레거시: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 호환성 토글: `dangerouslyAllowNameMatching` (비상용; 필요하지 않으면 비활성화 유지)
- 채널 액세스: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 스레딩/기록: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전송: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 운영/기능: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에서 답장이 없음">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - 채널 허용 목록 (`channels.slack.channels`)
    - `requireMention`
    - 채널별 `users` 허용 목록

    유용한 명령어:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM 메시지가 무시됨">
    다음을 확인하세요.

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (또는 레거시 `channels.slack.dm.policy`)
    - 페어링 승인 / 허용 목록 항목
    - Slack Assistant DM 이벤트: `drop message_changed`를 언급하는 상세 로그는
      일반적으로 Slack이 메시지 메타데이터에서
      복구 가능한 사람 발신자가 없는 편집된 Assistant 스레드 이벤트를 보냈음을 의미합니다

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode가 연결되지 않음">
    bot + app 토큰과 Slack 앱 설정에서 Socket Mode 활성화를 확인하세요.

    `openclaw channels status --probe --json`에서 `botTokenStatus` 또는
    `appTokenStatus: "configured_unavailable"`가 표시되면 Slack 계정은
    구성되어 있지만 현재 런타임이 SecretRef 기반
    값을 확인할 수 없었다는 뜻입니다.

  </Accordion>

  <Accordion title="HTTP mode가 이벤트를 받지 못함">
    다음을 확인하세요.

    - signing secret
    - webhook path
    - Slack Request URL(Events + Interactivity + Slash Commands)
    - HTTP 계정별 고유한 `webhookPath`

    계정 스냅샷에 `signingSecretStatus: "configured_unavailable"`가
    표시되면 HTTP 계정은 구성되어 있지만 현재 런타임이
    SecretRef 기반 signing secret을 확인할 수 없었다는 뜻입니다.

  </Accordion>

  <Accordion title="기본/슬래시 명령어가 실행되지 않음">
    의도한 방식이 다음 중 무엇인지 확인하세요.

    - Slack에 일치하는 슬래시 명령어가 등록된 기본 명령어 모드 (`channels.slack.commands.native: true`)
    - 또는 단일 슬래시 명령어 모드 (`channels.slack.slashCommand.enabled: true`)

    또한 `commands.useAccessGroups` 및 채널/사용자 허용 목록도 확인하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Slack 사용자를 Gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    채널 및 그룹 DM 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화 방법입니다.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    구성 레이아웃 및 우선순위입니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    명령어 카탈로그 및 동작입니다.
  </Card>
</CardGroup>
