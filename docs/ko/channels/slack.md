---
read_when:
    - Slack 설정 또는 Slack 소켓/HTTP 모드 디버깅
summary: Slack 설정 및 런타임 동작(소켓 모드 + HTTP 요청 URL)
title: Slack
x-i18n:
    generated_at: "2026-04-30T06:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

프로덕션에서 Slack 앱 통합을 통해 DM 및 채널에 사용할 수 있습니다. 기본 모드는 Socket Mode이며, HTTP Request URLs도 지원됩니다.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    Slack DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작 및 명령 카탈로그입니다.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ko/channels/troubleshooting">
    크로스 채널 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Slack 앱 설정에서 **[Create New App](https://api.slack.com/apps/new)** 버튼을 누릅니다.

        - **from a manifest**를 선택하고 앱을 사용할 워크스페이스를 선택합니다
        - 아래의 [예시 매니페스트](#manifest-and-scope-checklist)를 붙여넣고 계속 진행하여 생성합니다
        - `connections:write`가 있는 **App-Level Token**(`xapp-...`)을 생성합니다
        - 앱을 설치하고 표시되는 **Bot Token**(`xoxb-...`)을 복사합니다

      </Step>

      <Step title="Configure OpenClaw">

        권장 SecretRef 설정:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Env 폴백(기본 계정만 해당):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Slack 앱 설정에서 **[Create New App](https://api.slack.com/apps/new)** 버튼을 누릅니다.

        - **from a manifest**를 선택하고 앱을 사용할 워크스페이스를 선택합니다
        - [예시 매니페스트](#manifest-and-scope-checklist)를 붙여넣고 생성하기 전에 URL을 업데이트합니다
        - 요청 검증을 위한 **Signing Secret**을 저장합니다
        - 앱을 설치하고 표시되는 **Bot Token**(`xoxb-...`)을 복사합니다

      </Step>

      <Step title="Configure OpenClaw">

        권장 SecretRef 설정:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        다중 계정 HTTP에는 고유한 Webhook 경로를 사용하세요

        등록이 충돌하지 않도록 각 계정에 서로 다른 `webhookPath`(기본값 `/slack/events`)를 지정하세요.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 전송 조정

OpenClaw는 Socket Mode에서 Slack SDK 클라이언트 pong 제한 시간을 기본적으로 15초로 설정합니다. 워크스페이스 또는 호스트별 조정이 필요한 경우에만 전송 설정을 재정의하세요.

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Slack WebSocket pong/서버 ping 제한 시간이 기록되거나 이벤트 루프 고갈이 알려진 호스트에서 실행되는 Socket Mode 워크스페이스에만 사용하세요. `clientPingTimeout`은 SDK가 클라이언트 ping을 보낸 뒤 pong을 기다리는 시간이며, `serverPingTimeout`은 Slack 서버 ping을 기다리는 시간입니다. 앱 메시지와 이벤트는 애플리케이션 상태로 유지되며, 전송 활성 상태 신호가 아닙니다.

## 매니페스트 및 범위 체크리스트

기본 Slack 앱 매니페스트는 Socket Mode와 HTTP Request URLs에서 동일합니다. `settings` 블록(및 슬래시 명령 `url`)만 다릅니다.

기본 매니페스트(Socket Mode 기본값):

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

**HTTP Request URLs 모드**에서는 `settings`를 HTTP 변형으로 바꾸고 각 슬래시 명령에 `url`을 추가합니다. 공개 URL이 필요합니다.

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
        /* same as Socket Mode */
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

### 추가 매니페스트 설정

위 기본값을 확장하는 다양한 기능을 노출합니다.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    단일 구성 명령 대신 여러 [네이티브 슬래시 명령](#commands-and-slash-behavior)을 세부적으로 사용할 수 있습니다.

    - `/status` 명령은 예약되어 있으므로 `/status` 대신 `/agentstatus`를 사용하세요.
    - 한 번에 25개를 초과하는 슬래시 명령을 사용할 수 없습니다.

    기존 `features.slash_commands` 섹션을 [사용 가능한 명령](/ko/tools/slash-commands#command-list)의 하위 집합으로 바꾸세요.

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      <Tab title="HTTP Request URLs">
        위 Socket Mode와 동일한 `slash_commands` 목록을 사용하고 모든 항목에 `"url": "https://gateway-host.example.com/slack/events"`를 추가하세요. 예:

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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    발신 메시지에 기본 Slack 앱 ID 대신 활성 에이전트 ID(사용자 지정 사용자 이름 및 아이콘)를 사용하려면 `chat:write.customize` 봇 범위를 추가하세요.

    이모지 아이콘을 사용하는 경우 Slack은 `:emoji_name:` 구문을 기대합니다.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    `channels.slack.userToken`을 구성하는 경우 일반적인 읽기 범위는 다음과 같습니다.

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`(Slack 검색 읽기에 의존하는 경우)

  </Accordion>
</AccordionGroup>

## 토큰 모델

- Socket Mode에는 `botToken` + `appToken`이 필요합니다.
- HTTP 모드에는 `botToken` + `signingSecret`이 필요합니다.
- `botToken`, `appToken`, `signingSecret`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 허용합니다.
- 구성 토큰은 env 폴백보다 우선합니다.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env 폴백은 기본 계정에만 적용됩니다.
- `userToken`(`xoxp-...`)은 구성 전용(env 폴백 없음)이며 읽기 전용 동작이 기본값입니다(`userTokenReadOnly: true`).

상태 스냅샷 동작:

- Slack 계정 검사는 자격 증명별 `*Source` 및 `*Status`
  필드(`botToken`, `appToken`, `signingSecret`, `userToken`)를 추적합니다.
- 상태는 `available`, `configured_unavailable`, 또는 `missing`입니다.
- `configured_unavailable`은 계정이 SecretRef
  또는 다른 비인라인 비밀 소스를 통해 구성되었지만, 현재 명령/런타임 경로가
  실제 값을 확인할 수 없었다는 뜻입니다.
- HTTP 모드에서는 `signingSecretStatus`가 포함됩니다. Socket Mode에서는
  필요한 쌍이 `botTokenStatus` + `appTokenStatus`입니다.

<Tip>
작업/디렉터리 읽기에는 구성된 경우 사용자 토큰이 우선될 수 있습니다. 쓰기에는 봇 토큰이 계속 우선되며, 사용자 토큰 쓰기는 `userTokenReadOnly: false`이고 봇 토큰을 사용할 수 없을 때만 허용됩니다.
</Tip>

## 작업 및 게이트

Slack 작업은 `channels.slack.actions.*`로 제어됩니다.

현재 Slack 도구에서 사용할 수 있는 작업 그룹:

| 그룹       | 기본값 |
| ---------- | ------ |
| messages   | 활성화 |
| reactions  | 활성화 |
| pins       | 활성화 |
| memberInfo | 활성화 |
| emojiList  | 활성화 |

현재 Slack 메시지 작업에는 `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list`가 포함됩니다. `download-file`은 수신 파일 자리표시자에 표시되는 Slack 파일 ID를 허용하며, 이미지의 경우 이미지 미리보기를, 다른 파일 유형의 경우 로컬 파일 메타데이터를 반환합니다.

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.slack.dmPolicy`는 DM 액세스를 제어합니다. `channels.slack.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`channels.slack.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 플래그:

    - `dm.enabled`(기본값 true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom`(레거시)
    - `dm.groupEnabled`(그룹 DM 기본값 false)
    - `dm.groupChannels`(선택적 MPIM 허용 목록)

    다중 계정 우선순위:

    - `channels.slack.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름이 지정된 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.slack.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.slack.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.slack.dm.policy` 및 `channels.slack.dm.allowFrom`은 호환성을 위해 계속 읽습니다. `openclaw doctor --fix`는 액세스를 변경하지 않고 가능할 때 이를 `dmPolicy` 및 `allowFrom`으로 마이그레이션합니다.

    DM에서 페어링은 `openclaw pairing approve slack <code>`를 사용합니다.

  </Tab>

  <Tab title="채널 정책">
    `channels.slack.groupPolicy`는 채널 처리를 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    채널 허용 목록은 `channels.slack.channels` 아래에 있으며 구성 키로 **안정적인 Slack 채널 ID**(예: `C12345678`)를 사용해야 합니다.

    런타임 참고: `channels.slack`이 완전히 없는 경우(env 전용 설정), 런타임은 `groupPolicy="allowlist"`로 폴백하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

    이름/ID 확인:

    - 채널 허용 목록 항목과 DM 허용 목록 항목은 토큰 액세스가 허용할 때 시작 시 확인됩니다
    - 확인되지 않은 채널 이름 항목은 구성된 상태로 유지되지만 기본적으로 라우팅에서는 무시됩니다
    - 수신 권한 부여 및 채널 라우팅은 기본적으로 ID 우선입니다. 직접 사용자 이름/슬러그 일치를 사용하려면 `channels.slack.dangerouslyAllowNameMatching: true`가 필요합니다

    <Warning>
    이름 기반 키(`#channel-name` 또는 `channel-name`)는 `groupPolicy: "allowlist"`에서 일치하지 않습니다. 채널 조회는 기본적으로 ID 우선이므로 이름 기반 키는 성공적으로 라우팅되지 않으며 해당 채널의 모든 메시지는 조용히 차단됩니다. 이는 채널 키가 라우팅에 필요하지 않아 이름 기반 키가 동작하는 것처럼 보이는 `groupPolicy: "open"`과 다릅니다.

    항상 Slack 채널 ID를 키로 사용하세요. 찾는 방법: Slack에서 채널을 오른쪽 클릭 → **링크 복사** — ID(`C...`)가 URL 끝에 표시됩니다.

    올바름:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    잘못됨(`groupPolicy: "allowlist"`에서 조용히 차단됨):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="멘션 및 채널 사용자">
    채널 메시지는 기본적으로 멘션 게이트가 적용됩니다.

    멘션 소스:

    - 명시적 앱 멘션(`<@botId>`)
    - 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 암시적 봇 답글 스레드 동작(`thread.requireExplicitMention`이 `true`일 때 비활성화됨)

    채널별 제어(`channels.slack.channels.<id>`; 이름은 시작 시 확인 또는 `dangerouslyAllowNameMatching`을 통해서만 가능):

    - `requireMention`
    - `users`(허용 목록)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 키 형식: `id:`, `e164:`, `username:`, `name:`, 또는 `"*"` 와일드카드
      (레거시 접두사 없는 키는 여전히 `id:`로만 매핑됨)

  </Tab>
</Tabs>

## 스레딩, 세션 및 답글 태그

- DM은 `direct`로, 채널은 `channel`로, MPIM은 `group`으로 라우팅됩니다.
- 기본 `session.dmScope=main`에서는 Slack DM이 에이전트 기본 세션으로 합쳐집니다.
- 채널 세션: `agent:<agentId>:slack:channel:<channelId>`.
- 스레드 답글은 해당하는 경우 스레드 세션 접미사(`:thread:<threadTs>`)를 만들 수 있습니다.
- `channels.slack.thread.historyScope` 기본값은 `thread`이고, `thread.inheritParent` 기본값은 `false`입니다.
- `channels.slack.thread.initialHistoryLimit`는 새 스레드 세션이 시작될 때 가져올 기존 스레드 메시지 수를 제어합니다(기본값 `20`; 비활성화하려면 `0` 설정).
- `channels.slack.thread.requireExplicitMention`(기본값 `false`): `true`이면 암시적 스레드 멘션을 억제하여 봇이 이미 스레드에 참여했더라도 스레드 안에서 명시적 `@bot` 멘션에만 응답합니다. 이 설정이 없으면 봇이 참여한 스레드의 답글은 `requireMention` 게이트를 우회합니다.

답글 스레딩 제어:

- `channels.slack.replyToMode`: `off|first|all|batched`(기본값 `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel`별 설정
- 직접 채팅용 레거시 폴백: `channels.slack.dm.replyToMode`

수동 답글 태그가 지원됩니다.

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"`는 명시적 `[[reply_to_*]]` 태그를 포함해 Slack의 **모든** 답글 스레딩을 비활성화합니다. 이는 `"off"` 모드에서도 명시적 태그가 계속 적용되는 Telegram과 다릅니다. Slack 스레드는 채널에서 메시지를 숨기지만 Telegram 답글은 인라인으로 계속 표시됩니다.
</Note>

## 확인 반응

`ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 보냅니다.

확인 순서:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 에이전트 식별 이모지 폴백(`agents.list[].identity.emoji`, 없으면 "👀")

참고:

- Slack은 쇼트코드(예: `"eyes"`)를 기대합니다.
- Slack 계정 또는 전역에서 반응을 비활성화하려면 `""`를 사용하세요.

## 텍스트 스트리밍

`channels.slack.streaming`은 실시간 미리보기 동작을 제어합니다.

- `off`: 실시간 미리보기 스트리밍을 비활성화합니다.
- `partial`(기본값): 미리보기 텍스트를 최신 부분 출력으로 대체합니다.
- `block`: 청크 미리보기 업데이트를 추가합니다.
- `progress`: 생성 중 진행 상태 텍스트를 표시한 다음 최종 텍스트를 보냅니다.
- `streaming.preview.toolProgress`: 초안 미리보기가 활성 상태일 때 도구/진행 업데이트를 같은 편집된 미리보기 메시지로 라우팅합니다(기본값: `true`). 별도 도구/진행 메시지를 유지하려면 `false`로 설정합니다.

`channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode`가 `partial`일 때 Slack 네이티브 텍스트 스트리밍을 제어합니다(기본값: `true`).

- 네이티브 텍스트 스트리밍과 Slack 어시스턴트 스레드 상태가 표시되려면 답글 스레드를 사용할 수 있어야 합니다. 스레드 선택은 여전히 `replyToMode`를 따릅니다.
- 네이티브 스트리밍을 사용할 수 없을 때도 채널 및 그룹 채팅 루트는 일반 초안 미리보기를 사용할 수 있습니다.
- 최상위 Slack DM은 기본적으로 스레드 밖에 있으므로 스레드 스타일 미리보기를 표시하지 않습니다. 그곳에서 보이는 진행 상태가 필요하면 스레드 답글 또는 `typingReaction`을 사용하세요.
- 미디어 및 텍스트가 아닌 페이로드는 일반 전달로 폴백합니다.
- 미디어/오류 최종 응답은 대기 중인 미리보기 편집을 취소합니다. 적격 텍스트/블록 최종 응답은 미리보기를 제자리에서 편집할 수 있을 때만 플러시됩니다.
- 스트리밍이 답글 중간에 실패하면 OpenClaw는 남은 페이로드에 대해 일반 전달로 폴백합니다.

Slack 네이티브 텍스트 스트리밍 대신 초안 미리보기를 사용합니다.

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

- `channels.slack.streamMode`(`replace | status_final | append`)는 `channels.slack.streaming.mode`로 자동 마이그레이션됩니다.
- 불리언 `channels.slack.streaming`은 `channels.slack.streaming.mode` 및 `channels.slack.streaming.nativeTransport`로 자동 마이그레이션됩니다.
- 레거시 `channels.slack.nativeStreaming`은 `channels.slack.streaming.nativeTransport`로 자동 마이그레이션됩니다.

## 입력 중 반응 폴백

`typingReaction`은 OpenClaw가 답글을 처리하는 동안 수신 Slack 메시지에 임시 반응을 추가한 다음, 실행이 끝나면 이를 제거합니다. 이는 기본 "입력 중..." 상태 표시기를 사용하는 스레드 답글 밖에서 가장 유용합니다.

확인 순서:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

참고:

- Slack은 쇼트코드(예: `"hourglass_flowing_sand"`)를 기대합니다.
- 반응은 최선의 노력 방식이며, 답글 또는 실패 경로가 완료된 뒤 정리가 자동으로 시도됩니다.

## 미디어, 청크 분할 및 전달

<AccordionGroup>
  <Accordion title="수신 첨부 파일">
    Slack 파일 첨부는 Slack 호스팅 비공개 URL(토큰 인증 요청 흐름)에서 다운로드되어, 가져오기가 성공하고 크기 제한이 허용하면 미디어 저장소에 기록됩니다. 파일 자리표시자에는 Slack `fileId`가 포함되어 에이전트가 `download-file`로 원본 파일을 가져올 수 있습니다.

    다운로드에는 제한된 유휴 및 총 시간 제한이 사용됩니다. Slack 파일 가져오기가 멈추거나 실패하면 OpenClaw는 메시지 처리를 계속하고 파일 자리표시자로 폴백합니다.

    런타임 수신 크기 상한은 `channels.slack.mediaMaxMb`로 재정의하지 않는 한 기본값이 `20MB`입니다.

  </Accordion>

  <Accordion title="발신 텍스트 및 파일">
    - 텍스트 청크는 `channels.slack.textChunkLimit`를 사용합니다(기본값 4000)
    - `channels.slack.chunkMode="newline"`은 문단 우선 분할을 활성화합니다
    - 파일 전송은 Slack 업로드 API를 사용하며 스레드 답글(`thread_ts`)을 포함할 수 있습니다
    - 발신 미디어 상한은 구성된 경우 `channels.slack.mediaMaxMb`를 따르며, 그렇지 않으면 채널 전송은 미디어 파이프라인의 MIME 종류 기본값을 사용합니다

  </Accordion>

  <Accordion title="전달 대상">
    선호되는 명시적 대상:

    - DM의 경우 `user:<id>`
    - 채널의 경우 `channel:<id>`

    사용자 대상으로 전송할 때 Slack DM은 Slack 대화 API를 통해 열립니다.

  </Accordion>
</AccordionGroup>

## 명령 및 슬래시 동작

슬래시 명령은 Slack에 단일 구성 명령 또는 여러 네이티브 명령으로 표시됩니다. 명령 기본값을 변경하려면 `channels.slack.slashCommand`를 구성하세요.

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

네이티브 명령에는 Slack 앱의 [추가 매니페스트 설정](#additional-manifest-settings)이 필요하며, 대신 전역 구성에서 `channels.slack.commands.native: true` 또는 `commands.native: true`로 활성화합니다.

- 네이티브 명령 자동 모드는 Slack에서 **꺼져** 있으므로 `commands.native: "auto"`는 Slack 네이티브 명령을 활성화하지 않습니다.

```txt
/help
```

네이티브 인수 메뉴는 선택한 옵션 값을 발송하기 전에 확인 모달을 표시하는 적응형 렌더링 전략을 사용합니다.

- 최대 5개 옵션: 버튼 블록
- 6-100개 옵션: 정적 선택 메뉴
- 100개 초과 옵션: 인터랙티비티 옵션 핸들러를 사용할 수 있을 때 비동기 옵션 필터링이 포함된 외부 선택
- Slack 제한 초과: 인코딩된 옵션 값은 버튼으로 대체됨

```txt
/think
```

슬래시 세션은 `agent:<agentId>:slack:slash:<userId>` 같은 격리된 키를 사용하며, 여전히 `CommandTargetSessionKey`를 사용해 명령 실행을 대상 대화 세션으로 라우팅합니다.

## 인터랙티브 답장

Slack은 에이전트가 작성한 인터랙티브 답장 컨트롤을 렌더링할 수 있지만, 이 기능은 기본적으로 비활성화되어 있습니다.

전역으로 활성화합니다.

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

또는 한 Slack 계정에만 활성화합니다.

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

활성화되면 에이전트가 Slack 전용 답장 지시문을 내보낼 수 있습니다.

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

이러한 지시문은 Slack Block Kit으로 컴파일되며, 클릭이나 선택을 기존 Slack 상호작용 이벤트 경로를 통해 다시 라우팅합니다.

참고:

- 이는 Slack 전용 UI입니다. 다른 채널은 Slack Block Kit 지시문을 자체 버튼 시스템으로 변환하지 않습니다.
- 인터랙티브 콜백 값은 에이전트가 직접 작성한 원시 값이 아니라 OpenClaw가 생성한 불투명 토큰입니다.
- 생성된 인터랙티브 블록이 Slack Block Kit 제한을 초과할 경우 OpenClaw는 잘못된 블록 페이로드를 보내는 대신 원래 텍스트 답장으로 대체합니다.

## Slack의 실행 승인

Slack은 Web UI나 터미널로 대체하는 대신, 인터랙티브 버튼과 상호작용이 있는 네이티브 승인 클라이언트 역할을 할 수 있습니다.

- 실행 승인은 네이티브 DM/채널 라우팅에 `channels.slack.execApprovals.*`를 사용합니다.
- 요청이 이미 Slack에 도착했고 승인 ID 종류가 `plugin:`인 경우, Plugin 승인도 동일한 Slack 네이티브 버튼 화면을 통해 처리될 수 있습니다.
- 승인자 권한 부여는 계속 적용됩니다. 승인자로 식별된 사용자만 Slack을 통해 요청을 승인하거나 거부할 수 있습니다.

이는 다른 채널과 동일한 공유 승인 버튼 화면을 사용합니다. Slack 앱 설정에서 `interactivity`가 활성화되면 승인 프롬프트가 대화에 직접 Block Kit 버튼으로 렌더링됩니다.
이 버튼이 있으면 기본 승인 UX가 됩니다. OpenClaw는 도구 결과가 채팅
승인을 사용할 수 없다고 말하거나 수동 승인이 유일한 경로일 때만
수동 `/approve` 명령을 포함해야 합니다.

구성 경로:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`(선택 사항, 가능하면 `commands.ownerAllowFrom`으로 대체)
- `channels.slack.execApprovals.target`(`dm` | `channel` | `both`, 기본값: `dm`)
- `agentFilter`, `sessionFilter`

Slack은 `enabled`가 설정되지 않았거나 `"auto"`이고 하나 이상의
승인자가 확인되면 네이티브 실행 승인을 자동으로 활성화합니다. Slack을 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.
승인자가 확인될 때 네이티브 승인을 강제로 켜려면 `enabled: true`를 설정하세요.

명시적 Slack 실행 승인 구성이 없을 때의 기본 동작:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

승인자를 재정의하거나, 필터를 추가하거나, 원본 채팅 전달을 선택하려는 경우에만
명시적인 Slack 네이티브 구성이 필요합니다.

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

공유 `approvals.exec` 전달은 별도입니다. 실행 승인 프롬프트도 다른 채팅이나 명시적인 대역 외 대상으로
라우팅해야 할 때만 사용하세요. 공유 `approvals.plugin` 전달도
별도입니다. 해당 요청이 이미 Slack에 도착한 경우 Slack 네이티브 버튼은 여전히 Plugin 승인을 처리할 수 있습니다.

동일 채팅 `/approve`도 이미 명령을 지원하는 Slack 채널과 DM에서 작동합니다. 전체 승인 전달 모델은 [실행 승인](/ko/tools/exec-approvals)을 참고하세요.

## 이벤트 및 운영 동작

- 메시지 수정/삭제는 시스템 이벤트로 매핑됩니다.
- 스레드 브로드캐스트("Also send to channel" 스레드 답장)는 일반 사용자 메시지로 처리됩니다.
- 반응 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- 멤버 참가/나가기, 채널 생성/이름 변경, 핀 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- `configWrites`가 활성화된 경우 `channel_id_changed`가 채널 구성 키를 마이그레이션할 수 있습니다.
- 채널 주제/목적 메타데이터는 신뢰할 수 없는 컨텍스트로 취급되며 라우팅 컨텍스트에 주입될 수 있습니다.
- 스레드 시작 메시지와 초기 스레드 기록 컨텍스트 시딩은 적용 가능한 경우 구성된 발신자 허용 목록으로 필터링됩니다.
- 블록 액션과 모달 상호작용은 풍부한 페이로드 필드가 있는 구조화된 `Slack interaction: ...` 시스템 이벤트를 내보냅니다.
  - 블록 액션: 선택된 값, 레이블, 선택기 값, `workflow_*` 메타데이터
  - 라우팅된 채널 메타데이터와 양식 입력이 포함된 모달 `view_submission` 및 `view_closed` 이벤트

## 구성 참조

기본 참조: [구성 참조 - Slack](/ko/gateway/config-channels#slack).

<Accordion title="고신호 Slack 필드">

- 모드/인증: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 접근: `dm.enabled`, `dmPolicy`, `allowFrom`(레거시: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 호환성 토글: `dangerouslyAllowNameMatching`(비상용, 필요한 경우가 아니면 꺼두세요)
- 채널 접근: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 스레딩/기록: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 운영/기능: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에서 답장이 없음">
    순서대로 확인하세요.

    - `groupPolicy`
    - 채널 허용 목록(`channels.slack.channels`) — **키는 이름(`#channel-name`)이 아니라 채널 ID**(`C12345678`)여야 합니다. 채널 라우팅은 기본적으로 ID 우선이므로 `groupPolicy: "allowlist"`에서 이름 기반 키는 조용히 실패합니다. ID를 찾는 방법: Slack에서 채널을 오른쪽 클릭 → **Copy link** — URL 끝의 `C...` 값이 채널 ID입니다.
    - `requireMention`
    - 채널별 `users` 허용 목록

    유용한 명령:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM 메시지가 무시됨">
    확인하세요.

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`(또는 레거시 `channels.slack.dm.policy`)
    - 페어링 승인 / 허용 목록 항목
    - Slack Assistant DM 이벤트: `drop message_changed`를 언급하는 상세 로그는
      일반적으로 Slack이 메시지 메타데이터에서 복구 가능한 사람 발신자 없이
      수정된 Assistant 스레드 이벤트를 보냈음을 의미합니다

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode가 연결되지 않음">
    Slack 앱 설정에서 봇 + 앱 토큰과 Socket Mode 활성화를 검증하세요.

    `openclaw channels status --probe --json`에 `botTokenStatus` 또는
    `appTokenStatus: "configured_unavailable"`가 표시되면 Slack 계정은
    구성되었지만 현재 런타임이 SecretRef 기반 값을 확인할 수 없었다는 뜻입니다.

  </Accordion>

  <Accordion title="HTTP mode가 이벤트를 수신하지 않음">
    검증하세요.

    - 서명 비밀
    - Webhook 경로
    - Slack 요청 URL(이벤트 + 인터랙티비티 + 슬래시 명령)
    - HTTP 계정별 고유한 `webhookPath`

    계정 스냅샷에 `signingSecretStatus: "configured_unavailable"`가 표시되면
    HTTP 계정은 구성되었지만 현재 런타임이 SecretRef 기반 서명 비밀을
    확인할 수 없었다는 뜻입니다.

  </Accordion>

  <Accordion title="네이티브/슬래시 명령이 실행되지 않음">
    의도한 것이 무엇인지 확인하세요.

    - Slack에 등록된 일치하는 슬래시 명령과 함께 사용하는 네이티브 명령 모드(`channels.slack.commands.native: true`)
    - 또는 단일 슬래시 명령 모드(`channels.slack.slashCommand.enabled: true`)

    `commands.useAccessGroups`와 채널/사용자 허용 목록도 확인하세요.

  </Accordion>
</AccordionGroup>

## 첨부 파일 비전 참조

Slack 파일 다운로드가 성공하고 크기 제한이 허용하는 경우 Slack은 다운로드한 미디어를 에이전트 턴에 첨부할 수 있습니다. 이미지 파일은 미디어 이해 경로를 통과하거나 비전 기능이 있는 답장 모델로 직접 전달될 수 있습니다. 다른 파일은 이미지 입력으로 처리되지 않고 다운로드 가능한 파일 컨텍스트로 유지됩니다.

### 지원되는 미디어 유형

| 미디어 유형                    | 소스                 | 현재 동작                                                                          | 참고                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 이미지 | Slack 파일 URL       | 다운로드되어 비전 기능이 있는 처리를 위해 턴에 첨부됨                            | 파일별 제한: `channels.slack.mediaMaxMb`(기본값 20 MB)                   |
| PDF 파일                       | Slack 파일 URL       | 다운로드되어 `download-file` 또는 `pdf` 같은 도구의 파일 컨텍스트로 노출됨        | Slack 인바운드는 PDF를 이미지 비전 입력으로 자동 변환하지 않음           |
| 기타 파일                      | Slack 파일 URL       | 가능한 경우 다운로드되어 파일 컨텍스트로 노출됨                                  | 바이너리 파일은 이미지 입력으로 처리되지 않음                            |
| 스레드 답장                    | 스레드 시작 파일     | 답장에 직접 미디어가 없을 때 루트 메시지 파일을 컨텍스트로 하이드레이션할 수 있음 | 파일만 있는 시작 메시지는 첨부 파일 플레이스홀더를 사용함                |
| 다중 이미지 메시지             | 여러 Slack 파일      | 각 파일은 독립적으로 평가됨                                                       | Slack 처리는 메시지당 8개 파일로 제한됨                                  |

### 인바운드 파이프라인

파일 첨부가 있는 Slack 메시지가 도착하면:

1. OpenClaw는 봇 토큰(`xoxb-...`)을 사용해 Slack의 비공개 URL에서 파일을 다운로드합니다.
2. 성공 시 파일은 미디어 저장소에 기록됩니다.
3. 다운로드한 미디어 경로와 콘텐츠 유형이 인바운드 컨텍스트에 추가됩니다.
4. 이미지 기능이 있는 모델/도구 경로는 해당 컨텍스트의 이미지 첨부 파일을 사용할 수 있습니다.
5. 이미지가 아닌 파일은 이를 처리할 수 있는 도구를 위해 파일 메타데이터 또는 미디어 참조로 계속 사용할 수 있습니다.

### 스레드 루트 첨부 파일 상속

메시지가 스레드에 도착하면(`thread_ts` 부모가 있음):

- 답장 자체에 직접 미디어가 없고 포함된 루트 메시지에 파일이 있는 경우, Slack은 루트 파일을 스레드 시작 컨텍스트로 하이드레이션할 수 있습니다.
- 직접 답장 첨부 파일은 루트 메시지 첨부 파일보다 우선합니다.
- 파일만 있고 텍스트가 없는 루트 메시지는 폴백이 여전히 해당 파일을 포함할 수 있도록 첨부 파일 플레이스홀더로 표현됩니다.

### 다중 첨부 파일 처리

단일 Slack 메시지에 여러 파일 첨부가 포함된 경우:

- 각 첨부 파일은 미디어 파이프라인을 통해 독립적으로 처리됩니다.
- 다운로드된 미디어 참조는 메시지 컨텍스트에 집계됩니다.
- 처리 순서는 이벤트 페이로드에서 Slack의 파일 순서를 따릅니다.
- 한 첨부 파일의 다운로드 실패는 다른 첨부 파일을 차단하지 않습니다.

### 크기, 다운로드 및 모델 제한

- **크기 상한**: 기본값은 파일당 20 MB입니다. `channels.slack.mediaMaxMb`로 구성할 수 있습니다.
- **다운로드 실패**: Slack에서 제공할 수 없는 파일, 만료된 URL, 접근할 수 없는 파일, 초과 크기 파일, Slack 인증/로그인 HTML 응답은 지원되지 않는 형식으로 보고되지 않고 건너뜁니다.
- **비전 모델**: 이미지 분석은 활성 응답 모델이 비전을 지원하는 경우 해당 모델을 사용하고, 그렇지 않으면 `agents.defaults.imageModel`에 구성된 이미지 모델을 사용합니다.

### 알려진 제한

| 시나리오                               | 현재 동작                                                             | 해결 방법                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 만료된 Slack 파일 URL                 | 파일을 건너뜁니다. 오류는 표시되지 않습니다                                                 | Slack에서 파일을 다시 업로드합니다                                                |
| 비전 모델이 구성되지 않음            | 이미지 첨부 파일은 미디어 참조로 저장되지만 이미지로 분석되지는 않습니다 | `agents.defaults.imageModel`을 구성하거나 비전 지원 응답 모델을 사용합니다 |
| 매우 큰 이미지(기본값 기준 > 20 MB) | 크기 상한에 따라 건너뜁니다                                                         | Slack에서 허용하는 경우 `channels.slack.mediaMaxMb`를 늘립니다                       |
| 전달/공유된 첨부 파일           | 텍스트 및 Slack 호스팅 이미지/파일 미디어는 최선의 방식으로 처리됩니다                       | OpenClaw 스레드에서 직접 다시 공유합니다                                   |
| PDF 첨부 파일                        | 파일/미디어 컨텍스트로 저장되며 이미지 비전을 통해 자동 라우팅되지 않습니다  | 파일 메타데이터에는 `download-file`을 사용하거나 PDF 분석에는 `pdf` 도구를 사용합니다   |

### 관련 문서

- [미디어 이해 파이프라인](/ko/nodes/media-understanding)
- [PDF 도구](/ko/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 첨부 파일 비전 활성화
- 회귀 테스트: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- 라이브 검증: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 관련 항목

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    Slack 사용자를 Gateway와 페어링합니다.
  </Card>
  <Card title="Groups" icon="users" href="/ko/channels/groups">
    채널 및 그룹 DM 동작입니다.
  </Card>
  <Card title="Channel routing" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="Security" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화입니다.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ko/gateway/configuration">
    구성 레이아웃 및 우선순위입니다.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ko/tools/slash-commands">
    명령 카탈로그 및 동작입니다.
  </Card>
</CardGroup>
