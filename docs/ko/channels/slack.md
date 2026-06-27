---
read_when:
    - Slack 설정 또는 Slack 소켓, HTTP, 릴레이 모드 디버깅
summary: Slack 설정 및 런타임 동작(Socket Mode, HTTP 요청 URL, 릴레이 모드)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Slack 앱 통합을 통해 DM과 채널에서 프로덕션 준비 완료 상태로 사용할 수 있습니다. 기본 모드는 Socket Mode이며, HTTP Request URLs도 지원됩니다. 릴레이 모드는 신뢰할 수 있는 라우터가 Slack 인그레스를 소유하는 관리형 배포를 위한 것입니다.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    Slack DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그입니다.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## Socket Mode 또는 HTTP Request URLs 선택

두 전송 방식 모두 프로덕션 준비 완료 상태이며 메시징, 슬래시 명령, App Home, 상호작용 기능에서 기능 동등성을 제공합니다. 기능이 아니라 배포 형태에 따라 선택하세요.

| 고려 사항                    | Socket Mode(기본값)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 공개 Gateway URL             | 필요 없음                                                                                                                                           | 필요함(DNS, TLS, 리버스 프록시 또는 터널)                                                                      |
| 아웃바운드 네트워크          | `wss-primary.slack.com`으로의 아웃바운드 WSS에 연결할 수 있어야 함                                                                                  | 아웃바운드 WS 없음, 인바운드 HTTPS만 사용                                                                      |
| 필요한 토큰                  | 봇 토큰 + `connections:write`가 있는 앱 수준 토큰                                                                                                    | 봇 토큰 + 서명 비밀                                                                                            |
| 개발 노트북 / 방화벽 뒤      | 그대로 작동함                                                                                                                                       | 공개 터널(ngrok, Cloudflare Tunnel, Tailscale Funnel) 또는 스테이징 Gateway 필요                               |
| 수평 확장                    | 호스트의 앱당 Socket Mode 세션 하나, 여러 Gateway에는 별도의 Slack 앱 필요                                                                          | 상태 없는 POST 핸들러, 여러 Gateway 복제본이 로드 밸런서 뒤에서 하나의 앱을 공유할 수 있음                    |
| 한 Gateway의 다중 계정       | 지원됨, 각 계정이 자체 WS를 엶                                                                                                                       | 지원됨, 등록이 충돌하지 않도록 각 계정에 고유한 `webhookPath`(기본값 `/slack/events`) 필요                    |
| 슬래시 명령 전송             | WS 연결을 통해 전달됨, `slash_commands[].url`은 무시됨                                                                                              | Slack이 `slash_commands[].url`로 POST함, 명령 디스패치에 해당 필드가 필요함                                    |
| 요청 서명                    | 사용하지 않음(인증은 앱 수준 토큰)                                                                                                                   | Slack이 모든 요청에 서명함, OpenClaw가 `signingSecret`으로 검증함                                              |
| 연결 끊김 복구               | Slack SDK 자동 재연결이 활성화되어 있으며, OpenClaw도 제한된 백오프로 실패한 Socket Mode 세션을 다시 시작합니다. Pong 타임아웃 전송 튜닝이 적용됩니다. | 끊길 지속 연결이 없음, 재시도는 Slack의 요청별로 수행됨                                                       |

<Note>
  단일 Gateway 호스트, 개발 노트북, 그리고 `*.slack.com`으로 아웃바운드 연결은 가능하지만 인바운드 HTTPS를 받을 수 없는 온프레미스 네트워크에는 **Socket Mode를 선택**하세요.

여러 Gateway 복제본을 로드 밸런서 뒤에서 실행하거나, 아웃바운드 WSS는 차단되어 있지만 인바운드 HTTPS는 허용되는 경우, 또는 이미 리버스 프록시에서 Slack Webhook을 종료하고 있다면 **HTTP Request URLs를 선택**하세요.
</Note>

### 릴레이 모드

릴레이 모드는 Slack 인그레스를 OpenClaw gateway와 분리합니다. 신뢰할 수 있는 라우터가
단일 Slack Socket Mode 연결을 소유하고, 대상 gateway를 선택한 뒤, 인증된 websocket을 통해
타입이 지정된 이벤트를 전달합니다. gateway는 아웃바운드 Slack Web API 호출에 계속 봇 토큰을 사용합니다.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

릴레이 URL은 localhost를 대상으로 하지 않는 한 `wss://`를 사용해야 합니다. bearer 토큰과
라우터 라우트 테이블을 Slack 권한 부여 경계의 일부로 취급하세요. 라우팅된 이벤트는
권한이 부여된 활성화로 일반 Slack 메시지 핸들러에 들어갑니다. websocket `hello` 프레임의 라우터 제공 `slack_identity`는 기본 아웃바운드 사용자 이름과 아이콘을 설정할 수 있습니다. 호출자가 명시적으로 제공한
identity가 있으면 여전히 그것이 우선합니다. 릴레이 연결은 Socket Mode와 같은
제한된 백오프 타이밍으로 다시 연결하며, 연결이 끊길 때마다 라우터가 제공한 identity를 지웁니다.

## 설치

채널을 구성하기 전에 Slack을 설치하세요.

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`은 Plugin을 등록하고 활성화합니다. 아래에서 Slack 앱과 채널 설정을 구성하기 전까지 Plugin은 여전히 아무 작업도 하지 않습니다. 일반적인 Plugin 동작과 설치 규칙은 [Plugins](/ko/tools/plugin)를 참조하세요.

## 빠른 설정

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new)를 엽니다 → **Create New App** → **From a manifest** → 워크스페이스를 선택합니다 → 아래 매니페스트 중 하나를 붙여 넣습니다 → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended**는 Slack Plugin의 전체 기능 집합과 일치합니다. App Home, 슬래시 명령, 파일, 반응, 핀, 그룹 DM, emoji/usergroup 읽기를 포함합니다. 워크스페이스 정책이 scope를 제한하는 경우 **Minimal**을 선택하세요. 이 구성은 DM, 채널/그룹 기록, 멘션, 슬래시 명령을 포함하지만 파일, 반응, 핀, 그룹 DM(`mpim:*`), `emoji:read`, `usergroups:read`는 제외합니다. scope별 근거와 추가 슬래시 명령 같은 추가 옵션은 [매니페스트 및 scope 체크리스트](#manifest-and-scope-checklist)를 참조하세요.
        </Note>

        Slack이 앱을 만든 후:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write`를 추가하고, 저장한 뒤, 앱 수준 토큰을 복사합니다.
        - **Install App -> Install to Workspace**: Bot User OAuth Token을 복사합니다.

      </Step>

      <Step title="Configure OpenClaw">

        권장 SecretRef 설정:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        env fallback(기본 계정만):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        [api.slack.com/apps](https://api.slack.com/apps/new)를 엽니다 → **Create New App** → **From a manifest** → 워크스페이스 선택 → 아래 매니페스트 중 하나 붙여넣기 → `https://gateway-host.example.com/slack/events`를 공개 Gateway URL로 바꾸기 → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **권장**은 Slack Plugin의 전체 기능 세트와 일치합니다. **최소**는 제한적인 워크스페이스를 위해 파일, 반응, 핀, 그룹 DM(`mpim:*`), `emoji:read`, `usergroups:read`를 제외합니다. 범위별 근거는 [매니페스트 및 범위 체크리스트](#manifest-and-scope-checklist)를 참조하세요.
        </Note>

        <Info>
          세 URL 필드(`slash_commands[].url`, `event_subscriptions.request_url`, `interactivity.request_url` / `message_menu_options_url`)는 모두 동일한 OpenClaw 엔드포인트를 가리킵니다. Slack의 매니페스트 스키마는 이들을 별도 이름으로 지정하도록 요구하지만, OpenClaw는 페이로드 유형별로 라우팅하므로 단일 `webhookPath`(기본값 `/slack/events`)이면 충분합니다. `slash_commands[].url`이 없는 슬래시 명령은 HTTP 모드에서 조용히 아무 작업도 하지 않습니다.
        </Info>

        Slack이 앱을 생성한 후:

        - **Basic Information → App Credentials**: 요청 검증에 사용할 **Signing Secret**을 복사합니다.
        - **Install App -> Install to Workspace**: Bot User OAuth Token을 복사합니다.

      </Step>

      <Step title="Configure OpenClaw">

        권장 SecretRef 설정:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        등록이 충돌하지 않도록 각 계정에 고유한 `webhookPath`(기본값 `/slack/events`)를 지정하세요.
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

## Socket Mode 전송 튜닝

OpenClaw는 기본적으로 Socket Mode에서 Slack SDK 클라이언트 pong 제한 시간을 15초로 설정합니다. 워크스페이스 또는 호스트별 튜닝이 필요할 때만 전송 설정을 재정의하세요.

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

Slack websocket pong/server-ping 제한 시간을 기록하거나 이벤트 루프 기아가 알려진 호스트에서 실행되는 Socket Mode 워크스페이스에만 이것을 사용하세요. `clientPingTimeout`은 SDK가 클라이언트 ping을 보낸 뒤 pong을 기다리는 시간입니다. `serverPingTimeout`은 Slack 서버 ping을 기다리는 시간입니다. 앱 메시지와 이벤트는 전송 활성 신호가 아니라 애플리케이션 상태로 유지됩니다.

참고:

- `socketMode`는 HTTP Request URL 모드에서 무시됩니다.
- 기본 `channels.slack.socketMode` 설정은 재정의하지 않는 한 모든 Slack 계정에 적용됩니다. 계정별 재정의는 `channels.slack.accounts.<accountId>.socketMode`를 사용합니다. 이것은 객체 재정의이므로 해당 계정에 원하는 모든 소켓 튜닝 필드를 포함하세요.
- OpenClaw 기본값이 있는 것은 `clientPingTimeout`(`15000`)뿐입니다. `serverPingTimeout`과 `pingPongLoggingEnabled`는 구성된 경우에만 Slack SDK로 전달됩니다.
- Socket Mode 재시작 백오프는 약 2초에서 시작해 약 30초에서 상한에 도달합니다. 복구 가능한 시작, 시작 대기, 연결 해제 실패는 채널이 중지될 때까지 재시도합니다. 잘못된 인증, 폐기된 토큰, 누락된 범위 같은 영구 계정 및 자격 증명 오류는 영원히 재시도하지 않고 빠르게 실패합니다.

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
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

**HTTP Request URLs 모드**의 경우 `settings`를 HTTP 변형으로 바꾸고 각 슬래시 명령에 `url`을 추가하세요. 공개 URL이 필요합니다.

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
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

기본 매니페스트는 Slack App Home **홈** 탭을 활성화하고 `app_home_opened`를 구독합니다. 워크스페이스 멤버가 홈 탭을 열면 OpenClaw는 `views.publish`로 안전한 기본 홈 뷰를 게시합니다. 대화 페이로드나 비공개 구성은 포함되지 않습니다. Slack DM용 **메시지** 탭은 계속 활성화됩니다. 매니페스트는 `features.assistant_view`, `assistant:write`, `assistant_thread_started`, `assistant_thread_context_changed`로 Slack assistant 스레드도 활성화합니다. assistant 스레드는 자체 OpenClaw 스레드 세션으로 라우팅되며 Slack이 제공한 스레드 컨텍스트를 에이전트가 사용할 수 있게 유지합니다.

<AccordionGroup>
  <Accordion title="선택 사항: 네이티브 슬래시 명령">

    단일 구성 명령 대신 여러 [네이티브 슬래시 명령](#commands-and-slash-behavior)을 세부적으로 사용할 수 있습니다.

    - `/status` 명령은 예약되어 있으므로 `/status` 대신 `/agentstatus`를 사용하세요.
    - 한 번에 25개를 초과하는 슬래시 명령을 사용할 수는 없습니다.

    기존 `features.slash_commands` 섹션을 [사용 가능한 명령](/ko/tools/slash-commands#command-list)의 하위 집합으로 바꾸세요.

    <Tabs>
      <Tab title="Socket Mode(기본값)">

```json
{
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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP 요청 URL">
        위 Socket Mode와 동일한 `slash_commands` 목록을 사용하고 모든 항목에 `"url": "https://gateway-host.example.com/slack/events"`를 추가하세요. 예:

```json
{
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
  ]
}
```

        목록의 모든 명령에 해당 `url` 값을 반복하세요.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="선택 사항: 작성자 표시 범위(쓰기 작업)">
    보내는 메시지가 기본 Slack 앱 ID 대신 활성 에이전트 ID(사용자 지정 사용자 이름 및 아이콘)를 사용하도록 하려면 `chat:write.customize` 봇 범위를 추가하세요.

    이모지 아이콘을 사용하는 경우 Slack은 `:emoji_name:` 구문을 요구합니다.

  </Accordion>
  <Accordion title="선택 사항: 사용자 토큰 범위(읽기 작업)">
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
- 릴레이 모드에는 `botToken`과 `relay.url`, `relay.authToken`, `relay.gatewayId`가 필요합니다. 앱 토큰이나 서명 시크릿은 사용하지 않습니다.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 허용합니다.
- 구성 토큰은 env fallback보다 우선합니다.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env fallback은 기본 계정에만 적용됩니다.
- `userToken`은 구성 전용(env fallback 없음)이며 기본값은 읽기 전용 동작(`userTokenReadOnly: true`)입니다.

상태 스냅샷 동작:

- Slack 계정 검사는 자격 증명별 `*Source` 및 `*Status`
  필드(`botToken`, `appToken`, `signingSecret`, `userToken`)를 추적합니다.
- 상태는 `available`, `configured_unavailable`, `missing` 중 하나입니다.
- `configured_unavailable`은 계정이 SecretRef
  또는 다른 비인라인 시크릿 소스를 통해 구성되었지만 현재 명령/런타임 경로가
  실제 값을 확인할 수 없었음을 의미합니다.
- HTTP 모드에서는 `signingSecretStatus`가 포함됩니다. Socket Mode에서는
  필수 쌍이 `botTokenStatus` + `appTokenStatus`입니다.

<Tip>
작업/디렉터리 읽기의 경우 구성되어 있으면 사용자 토큰을 선호할 수 있습니다. 쓰기의 경우 봇 토큰이 계속 선호됩니다. 사용자 토큰 쓰기는 `userTokenReadOnly: false`이고 봇 토큰을 사용할 수 없을 때만 허용됩니다.
</Tip>

## 작업 및 게이트

Slack 작업은 `channels.slack.actions.*`로 제어됩니다.

현재 Slack 도구에서 사용할 수 있는 작업 그룹:

| 그룹      | 기본값 |
| ---------- | ------- |
| messages   | 활성화됨 |
| reactions  | 활성화됨 |
| pins       | 활성화됨 |
| memberInfo | 활성화됨 |
| emojiList  | 활성화됨 |

현재 Slack 메시지 작업에는 `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list`가 포함됩니다. `download-file`은 인바운드 파일 자리 표시자에 표시된 Slack 파일 ID를 허용하며, 이미지의 경우 이미지 미리보기를, 다른 파일 형식의 경우 로컬 파일 메타데이터를 반환합니다.

## 액세스 제어 및 라우팅

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy`는 DM 접근을 제어합니다. `channels.slack.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`channels.slack.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 플래그:

    - `dm.enabled`(기본값 true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom`(레거시)
    - `dm.groupEnabled`(그룹 DM 기본값 false)
    - `dm.groupChannels`(선택 사항 MPIM 허용 목록)

    다중 계정 우선순위:

    - `channels.slack.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름이 지정된 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.slack.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.slack.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.slack.dm.policy` 및 `channels.slack.dm.allowFrom`은 호환성을 위해 여전히 읽습니다. `openclaw doctor --fix`는 접근을 변경하지 않고 처리할 수 있을 때 이를 `dmPolicy`와 `allowFrom`으로 마이그레이션합니다.

    DM에서의 페어링은 `openclaw pairing approve slack <code>`를 사용합니다.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy`는 채널 처리를 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    채널 허용 목록은 `channels.slack.channels` 아래에 있으며, config 키로 **안정적인 Slack 채널 ID**(예: `C12345678`)를 사용해야 합니다.

    런타임 참고: `channels.slack`이 완전히 누락된 경우(env 전용 설정), 런타임은 `groupPolicy="allowlist"`로 대체하고 경고를 로그에 남깁니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

    이름/ID 해석:

    - 토큰 접근이 허용하면 시작 시 채널 허용 목록 항목과 DM 허용 목록 항목이 해석됩니다.
    - 해석되지 않은 채널 이름 항목은 구성된 상태로 유지되지만 기본적으로 라우팅에서는 무시됩니다.
    - 인바운드 권한 부여와 채널 라우팅은 기본적으로 ID 우선입니다. 직접 사용자 이름/슬러그 매칭에는 `channels.slack.dangerouslyAllowNameMatching: true`가 필요합니다.

    <Warning>
    이름 기반 키(`#channel-name` 또는 `channel-name`)는 `groupPolicy: "allowlist"`에서 매칭되지 **않습니다**. 채널 조회는 기본적으로 ID 우선이므로, 이름 기반 키는 절대 성공적으로 라우팅되지 않으며 해당 채널의 모든 메시지는 조용히 차단됩니다. 이는 채널 키가 라우팅에 필요하지 않아 이름 기반 키가 작동하는 것처럼 보이는 `groupPolicy: "open"`과 다릅니다.

    항상 Slack 채널 ID를 키로 사용하세요. 찾는 방법: Slack에서 채널을 마우스 오른쪽 버튼으로 클릭 → **Copy link** — ID(`C...`)가 URL 끝에 표시됩니다.

    올바른 예:

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

    잘못된 예(`groupPolicy: "allowlist"`에서 조용히 차단됨):

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

  <Tab title="Mentions and channel users">
    채널 메시지는 기본적으로 멘션 게이트가 적용됩니다.

    멘션 소스:

    - 명시적 앱 멘션(`<@botId>`)
    - 봇 사용자가 해당 사용자 그룹의 멤버일 때 Slack 사용자 그룹 멘션(`<!subteam^S...>`); `usergroups:read` 필요
    - 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 암시적 봇 답글 스레드 동작(`thread.requireExplicitMention`이 `true`일 때 비활성화됨)

    채널별 제어(`channels.slack.channels.<id>`; 이름은 시작 시 해석 또는 `dangerouslyAllowNameMatching`을 통해서만 사용):

    - `requireMention`
    - `users`(허용 목록)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 키 형식: `channel:`, `id:`, `e164:`, `username:`, `name:`, 또는 `"*"` 와일드카드
      (레거시 접두사 없는 키는 여전히 `id:`에만 매핑됨)

    `allowBots`는 채널 및 비공개 채널에서 보수적으로 동작합니다. 봇이 작성한 룸 메시지는 보내는 봇이 해당 룸의 `users` 허용 목록에 명시적으로 나열되어 있거나, `channels.slack.allowFrom`의 명시적인 Slack 소유자 ID가 현재 룸 멤버인 경우에만 허용됩니다. 와일드카드와 표시 이름 소유자 항목은 소유자 존재 조건을 충족하지 않습니다. 소유자 존재 여부는 Slack `conversations.members`를 사용합니다. 앱에 룸 유형에 맞는 읽기 범위(`channels:read`는 공개 채널, `groups:read`는 비공개 채널)가 있는지 확인하세요. 멤버 조회에 실패하면 OpenClaw는 봇이 작성한 룸 메시지를 삭제합니다.

    허용된 봇 작성 Slack 메시지는 공유 [봇 루프 보호](/ko/channels/bot-loop-protection)를 사용합니다. 기본 예산은 `channels.defaults.botLoopProtection`에서 구성한 다음, 워크스페이스나 채널에 다른 제한이 필요할 때 `channels.slack.botLoopProtection` 또는 `channels.slack.channels.<id>.botLoopProtection`으로 재정의하세요.

  </Tab>
</Tabs>

## 스레드, 세션 및 답장 태그

- DM은 `direct`로, 채널은 `channel`로, MPIM은 `group`으로 라우팅됩니다.
- Slack 라우트 바인딩은 원시 피어 ID와 `channel:C12345678`, `user:U12345678`, `<@U12345678>` 같은 Slack 대상 형식을 허용합니다.
- 기본 `session.dmScope=main`에서는 Slack DM이 에이전트 메인 세션으로 합쳐집니다.
- 채널 세션: `agent:<agentId>:slack:channel:<channelId>`.
- 일반 최상위 채널 메시지는 `replyToMode`가 `off`가 아니어도 채널별 세션에 유지됩니다.
- Slack 스레드 답장은 아웃바운드 답장 스레딩이 `replyToMode="off"`로 비활성화되어 있어도 부모 Slack `thread_ts`를 세션 접미사(`:thread:<threadTs>`)로 사용합니다.
- OpenClaw는 보이는 Slack 스레드를 시작할 것으로 예상되는 적격 최상위 채널 루트를 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`에 시드하여, 루트와 이후 스레드 답장이 하나의 OpenClaw 세션을 공유하게 합니다. 이는 `app_mention` 이벤트, 명시적인 봇 또는 구성된 멘션 패턴 일치, 그리고 `replyToMode`가 `off`가 아닌 `requireMention: false` 채널에 적용됩니다.
- `channels.slack.thread.historyScope` 기본값은 `thread`이고, `thread.inheritParent` 기본값은 `false`입니다.
- `channels.slack.thread.initialHistoryLimit`는 새 스레드 세션이 시작될 때 가져올 기존 스레드 메시지 수를 제어합니다(기본값 `20`; 비활성화하려면 `0`으로 설정).
- `channels.slack.thread.requireExplicitMention`(기본값 `false`): `true`이면 암시적 스레드 멘션을 억제하여, 봇이 이미 스레드에 참여했더라도 스레드 안의 명시적인 `@bot` 멘션에만 응답합니다. 이것이 없으면 봇이 참여한 스레드의 답장은 `requireMention` 게이트를 우회합니다.

답장 스레딩 제어:

- `channels.slack.replyToMode`: `off|first|all|batched`(기본값 `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel`별 설정
- 다이렉트 채팅을 위한 레거시 폴백: `channels.slack.dm.replyToMode`

수동 답장 태그가 지원됩니다.

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` 도구에서 명시적인 Slack 스레드 답장을 보낼 때 Slack에 스레드 답장도 부모 채널에 브로드캐스트하도록 요청하려면 `action: "send"`와 `threadId` 또는 `replyTo`에 `replyBroadcast: true`를 설정하세요. 이는 Slack의 `chat.postMessage` `reply_broadcast` 플래그에 매핑되며, 미디어 업로드가 아닌 텍스트 또는 Block Kit 전송에만 지원됩니다.

`message` 도구 호출이 Slack 스레드 안에서 실행되고 같은 채널을 대상으로 할 때, OpenClaw는 일반적으로 `replyToMode`에 따라 현재 Slack 스레드를 상속합니다. 대신 새 부모 채널 메시지를 강제하려면 `action: "send"` 또는 `action: "upload-file"`에 `topLevel: true`를 설정하세요. `threadId: null`도 같은 최상위 옵트아웃으로 허용됩니다.

<Note>
`replyToMode="off"`는 명시적인 `[[reply_to_*]]` 태그를 포함하여 아웃바운드 Slack 답장 스레딩을 비활성화합니다. 인바운드 Slack 스레드 세션을 평탄화하지는 않습니다. Slack 스레드 안에 이미 게시된 메시지는 여전히 `:thread:<threadTs>` 세션으로 라우팅됩니다. 이는 `"off"` 모드에서도 명시적 태그가 계속 존중되는 Telegram과 다릅니다. Slack 스레드는 채널에서 메시지를 숨기는 반면 Telegram 답장은 인라인으로 계속 표시됩니다.
</Note>

## 확인 반응

`ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인 이모지를 보냅니다. `ackReactionScope`는 해당 이모지가 실제로 _언제_ 전송될지 결정합니다.

### 이모지(`ackReaction`)

해결 순서:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 에이전트 ID 이모지 폴백(`agents.list[].identity.emoji`, 없으면 `"eyes"` / 👀)

참고:

- Slack은 쇼트코드를 기대합니다(예: `"eyes"`).
- Slack 계정 또는 전역에서 반응을 비활성화하려면 `""`를 사용하세요.

### 범위(`messages.ackReactionScope`)

Slack 제공자는 `messages.ackReactionScope`에서 범위를 읽습니다(기본값 `"group-mentions"`). 현재 Slack 계정 또는 Slack 채널 수준 재정의는 없으며, 이 값은 Gateway 전역입니다.

값:

- `"all"`: DM과 그룹에서 반응합니다.
- `"direct"`: DM에서만 반응합니다.
- `"group-all"`: 모든 그룹 메시지에 반응합니다(DM 제외).
- `"group-mentions"`(기본값): 그룹에서 반응하지만, 봇이 멘션된 경우(또는 옵트인한 그룹 멘션 가능 대상)에만 반응합니다. **DM은 제외됩니다.**
- `"off"` / `"none"`: 절대 반응하지 않습니다.

<Note>
기본 범위(`"group-mentions"`)는 다이렉트 메시지에서 확인 반응을 발생시키지 않습니다. 인바운드 Slack DM에서 구성된 `ackReaction`(예: `"eyes"`)을 보려면 `messages.ackReactionScope`를 `"direct"` 또는 `"all"`로 설정하세요. `messages.ackReactionScope`는 Slack 제공자 시작 시 읽히므로, 변경 사항을 적용하려면 gateway 재시작이 필요합니다.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // DM과 그룹에서 반응
  },
}
```

## 텍스트 스트리밍

`channels.slack.streaming`은 실시간 미리보기 동작을 제어합니다.

- `off`: 실시간 미리보기 스트리밍을 비활성화합니다.
- `partial`(기본값): 미리보기 텍스트를 최신 부분 출력으로 교체합니다.
- `block`: 청크 단위 미리보기 업데이트를 추가합니다.
- `progress`: 생성 중에는 진행 상태 텍스트를 표시한 다음 최종 텍스트를 보냅니다.
- `streaming.preview.toolProgress`: 초안 미리보기가 활성화되어 있을 때 도구/진행 업데이트를 같은 편집된 미리보기 메시지로 라우팅합니다(기본값: `true`). 별도 도구/진행 메시지를 유지하려면 `false`로 설정하세요.
- `streaming.preview.commandText` / `streaming.progress.commandText`: 원시 명령/실행 텍스트를 숨기면서 간결한 도구 진행 줄을 유지하려면 `status`로 설정합니다(기본값: `raw`).

간결한 진행 줄은 유지하면서 원시 명령/실행 텍스트 숨기기:

```json
{
  "channels": {
    "slack": {
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

`channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode`가 `partial`일 때 Slack 네이티브 텍스트 스트리밍을 제어합니다(기본값: `true`).

Slack 네이티브 진행 작업 카드는 진행 모드에서 옵트인 방식입니다. 작업이 실행되는 동안 Slack 네이티브 계획/작업 카드를 보내고 완료 시 같은 작업 카드를 업데이트하려면 `channels.slack.streaming.mode="progress"`와 함께 `channels.slack.streaming.progress.nativeTaskCards`를 `true`로 설정하세요. 이 플래그가 없으면 진행 모드는 이식 가능한 초안 미리보기 동작을 유지합니다.

- 네이티브 텍스트 스트리밍과 Slack 어시스턴트 스레드 상태가 표시되려면 답장 스레드를 사용할 수 있어야 합니다. 스레드 선택은 여전히 `replyToMode`를 따릅니다.
- 채널, 그룹 채팅, 최상위 DM 루트는 네이티브 스트리밍을 사용할 수 없거나 답장 스레드가 없을 때도 일반 초안 미리보기를 사용할 수 있습니다.
- 최상위 Slack DM은 기본적으로 스레드 밖에 유지되므로 Slack의 스레드 스타일 네이티브 스트림/상태 미리보기를 표시하지 않습니다. 대신 OpenClaw는 DM에 초안 미리보기를 게시하고 편집합니다.
- 미디어 및 비텍스트 페이로드는 일반 전달로 폴백합니다.
- 미디어/오류 최종 결과는 대기 중인 미리보기 편집을 취소합니다. 적격 텍스트/블록 최종 결과는 미리보기를 제자리에서 편집할 수 있을 때만 플러시됩니다.
- 스트리밍이 답장 중간에 실패하면 OpenClaw는 남은 페이로드에 대해 일반 전달로 폴백합니다.

Slack 네이티브 텍스트 스트리밍 대신 초안 미리보기 사용:

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

Slack 네이티브 진행 작업 카드에 옵트인:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

레거시 키:

- `channels.slack.streamMode`(`replace | status_final | append`)는 `channels.slack.streaming.mode`의 레거시 런타임 별칭입니다.
- 불리언 `channels.slack.streaming`은 `channels.slack.streaming.mode`와 `channels.slack.streaming.nativeTransport`의 레거시 런타임 별칭입니다.
- 레거시 `channels.slack.nativeStreaming`은 `channels.slack.streaming.nativeTransport`의 런타임 별칭입니다.
- 지속된 Slack 스트리밍 구성을 표준 키로 다시 작성하려면 `openclaw doctor --fix`를 실행하세요.

## 입력 중 반응 폴백

`typingReaction`은 OpenClaw가 답장을 처리하는 동안 인바운드 Slack 메시지에 임시 반응을 추가한 다음, 실행이 끝나면 제거합니다. 이는 기본 "is typing..." 상태 표시기를 사용하는 스레드 답장 밖에서 가장 유용합니다.

해결 순서:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

참고:

- Slack은 쇼트코드를 기대합니다(예: `"hourglass_flowing_sand"`).
- 반응은 최선 노력 방식이며, 답장 또는 실패 경로가 완료된 후 자동으로 정리가 시도됩니다.

## 미디어, 청크 처리 및 전달

<AccordionGroup>
  <Accordion title="인바운드 첨부 파일">
    Slack 파일 첨부 파일은 Slack 호스팅 비공개 URL(토큰 인증 요청 흐름)에서 다운로드되며, 가져오기가 성공하고 크기 제한이 허용하면 미디어 저장소에 기록됩니다. 파일 플레이스홀더에는 에이전트가 `download-file`로 원본 파일을 가져올 수 있도록 Slack `fileId`가 포함됩니다.

    다운로드는 제한된 유휴 및 총 시간 제한을 사용합니다. Slack 파일 가져오기가 멈추거나 실패하면 OpenClaw는 메시지 처리를 계속하고 파일 플레이스홀더로 폴백합니다.

    런타임 인바운드 크기 상한은 `channels.slack.mediaMaxMb`로 재정의하지 않는 한 기본값이 `20MB`입니다.

  </Accordion>

  <Accordion title="아웃바운드 텍스트 및 파일">
    - 텍스트 청크는 `channels.slack.textChunkLimit`를 사용합니다(기본값 4000)
    - `channels.slack.chunkMode="newline"`은 단락 우선 분할을 활성화합니다
    - 파일 전송은 Slack 업로드 API를 사용하며 스레드 답장(`thread_ts`)을 포함할 수 있습니다
    - 아웃바운드 미디어 상한은 구성된 경우 `channels.slack.mediaMaxMb`를 따르고, 그렇지 않으면 채널 전송은 미디어 파이프라인의 MIME 종류 기본값을 사용합니다

  </Accordion>

  <Accordion title="전달 대상">
    권장되는 명시적 대상:

    - DM의 경우 `user:<id>`
    - 채널의 경우 `channel:<id>`

    텍스트/블록 전용 Slack DM은 사용자 ID에 직접 게시할 수 있습니다. 파일 업로드와 스레드 전송은 해당 경로에 구체적인 대화 ID가 필요하므로 먼저 Slack 대화 API를 통해 DM을 엽니다.

  </Accordion>
</AccordionGroup>

## 명령 및 슬래시 동작

슬래시 명령은 Slack에서 단일 구성 명령 또는 여러 네이티브 명령으로 표시됩니다. 명령 기본값을 변경하려면 `channels.slack.slashCommand`를 구성하세요.

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

네이티브 명령에는 Slack 앱의 [추가 매니페스트 설정](#additional-manifest-settings)이 필요하며, 대신 전역 구성에서 `channels.slack.commands.native: true` 또는 `commands.native: true`로 활성화됩니다.

- Slack에서는 네이티브 명령 자동 모드가 **꺼져** 있으므로 `commands.native: "auto"`는 Slack 네이티브 명령을 활성화하지 않습니다.

```txt
/help
```

네이티브 인수 메뉴는 선택된 옵션 값을 디스패치하기 전에 확인 모달을 표시하는 적응형 렌더링 전략을 사용합니다.

- 최대 5개 옵션: 버튼 블록
- 6-100개 옵션: 정적 선택 메뉴
- 100개 초과 옵션: 상호작용 옵션 핸들러를 사용할 수 있을 때 비동기 옵션 필터링이 있는 외부 선택
- Slack 제한 초과: 인코딩된 옵션 값은 버튼으로 폴백합니다

```txt
/think
```

슬래시 세션은 `agent:<agentId>:slack:slash:<userId>` 같은 격리된 키를 사용하며, 여전히 `CommandTargetSessionKey`를 사용해 명령 실행을 대상 대화 세션으로 라우팅합니다.

## 대화형 답글

Slack은 에이전트가 작성한 대화형 답글 컨트롤을 렌더링할 수 있지만, 이 기능은 기본적으로 비활성화되어 있습니다.
새 에이전트, CLI, Plugin 출력에는 공유
`presentation` 버튼이나 선택 블록을 선호하세요. 이들은 동일한 Slack 상호작용
경로를 사용하면서 다른 채널에서도 단계적으로 기능이 축소됩니다.

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

활성화하면 에이전트는 더 이상 권장되지 않는 Slack 전용 답글 지시문도 계속 내보낼 수 있습니다.

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

이 지시문은 Slack Block Kit으로 컴파일되고, 클릭 또는 선택을 기존 Slack 상호작용 이벤트 경로를 통해
다시 라우팅합니다. 오래된
프롬프트와 Slack 전용 우회 수단에는 유지하고, 새로운
이식 가능한 컨트롤에는 공유 presentation을 사용하세요.

지시문 컴파일러 API도 새 생산자 코드에서는 더 이상 권장되지 않습니다.

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

새 Slack 렌더링 컨트롤에는 `presentation` 페이로드와 `buildSlackPresentationBlocks(...)`를 사용하세요.

참고:

- 이는 Slack 전용 레거시 UI입니다. 다른 채널은 Slack Block
  Kit 지시문을 자체 버튼 시스템으로 변환하지 않습니다.
- 대화형 콜백 값은 에이전트가 작성한 원시 값이 아니라 OpenClaw가 생성한 불투명 토큰입니다.
- 생성된 대화형 블록이 Slack Block Kit 제한을 초과할 경우, OpenClaw는 유효하지 않은 블록 페이로드를 보내는 대신 원래 텍스트 답글로 폴백합니다.

### Plugin 소유 모달 제출

대화형 핸들러를 등록한 Slack Plugin은 OpenClaw가
에이전트에 표시되는 시스템 이벤트용으로 페이로드를 압축하기 전에 모달
`view_submission` 및 `view_closed` 수명 주기 이벤트도 받을 수 있습니다. Slack 모달을 열 때는 다음 라우팅
패턴 중 하나를 사용하세요.

- `callback_id`를 `openclaw:<namespace>:<payload>`로 설정합니다.
- 또는 기존 `callback_id`를 유지하고 모달 `private_metadata`에 `pluginInteractiveData:
"<namespace>:<payload>"`를 넣습니다.

핸들러는 `ctx.interaction.kind`를 `view_submission` 또는
`view_closed`로, 정규화된 `inputs`, 그리고 Slack의 전체 원시 `stateValues` 객체를 받습니다.
콜백 ID만으로 라우팅해도 Plugin 핸들러를 호출하기에 충분합니다. 모달이
에이전트에 표시되는 시스템 이벤트도 생성해야 하는 경우 기존 모달 `private_metadata` 사용자/세션 라우팅 필드를 포함하세요.
에이전트는 압축되고 수정된 `Slack interaction: ...` 시스템 이벤트를 받습니다. 핸들러가
`systemEvent.summary`, `systemEvent.reference` 또는 `systemEvent.data`를 반환하면, 에이전트가 전체 양식 페이로드를 보지 않고도
Plugin 소유 스토리지를 참조할 수 있도록 해당 필드가 이 압축 이벤트에 포함됩니다.

## Slack의 네이티브 승인

Slack은 Web UI나 터미널로 폴백하는 대신, 대화형 버튼과 상호작용을 사용하는 네이티브 승인 클라이언트로 동작할 수 있습니다.

- 실행 및 Plugin 승인은 Slack 네이티브 Block Kit 프롬프트로 렌더링될 수 있습니다.
- `channels.slack.execApprovals.*`는 네이티브 실행 승인 클라이언트 활성화와 DM/채널 라우팅 구성으로 유지됩니다.
- 실행 승인 DM은 `channels.slack.execApprovals.approvers` 또는 `commands.ownerAllowFrom`을 사용합니다.
- Plugin 승인은 시작 세션에 대해 Slack이 네이티브 승인 클라이언트로 활성화된 경우, 또는 `approvals.plugin`이 시작 Slack 세션이나 Slack 대상으로 라우팅되는 경우 Slack 네이티브 버튼을 사용합니다.
- Plugin 승인 DM은 `channels.slack.allowFrom`, 이름 있는 계정의 `allowFrom`, 또는 계정 기본 라우트의 Slack Plugin 승인자를 사용합니다.
- 승인자 권한 부여는 계속 적용됩니다. 실행 전용 승인자는 Plugin 승인자이기도 하지 않는 한 Plugin 요청을 승인할 수 없습니다.

이는 다른 채널과 동일한 공유 승인 버튼 표면을 사용합니다. Slack 앱 설정에서 `interactivity`가 활성화되어 있으면 승인 프롬프트가 대화 안에 직접 Block Kit 버튼으로 렌더링됩니다.
이 버튼들이 있을 때는 이것이 기본 승인 UX입니다. OpenClaw는
도구 결과가 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 말할 때만 수동 `/approve` 명령을 포함해야 합니다.

구성 경로:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (선택 사항, 가능하면 `commands.ownerAllowFrom`으로 폴백)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `agentFilter`, `sessionFilter`

Slack은 `enabled`가 설정되지 않았거나 `"auto"`이고 하나 이상의
실행 승인자가 해석되면 네이티브 실행 승인을 자동으로 활성화합니다. Slack은 Slack Plugin 승인자가 해석되고 요청이 네이티브 클라이언트 필터와 일치할 때 이 네이티브 클라이언트
경로를 통해 네이티브 Plugin 승인도 처리할 수 있습니다. Slack을 네이티브 승인 클라이언트로 명시적으로 비활성화하려면
`enabled: false`를 설정하세요. 승인자가 해석될 때 네이티브 승인을 강제로 켜려면 `enabled: true`를 설정하세요.
Slack 실행 승인을 비활성화해도 `approvals.plugin`을 통해 활성화된
네이티브 Slack Plugin 승인 전달은 비활성화되지 않습니다. Plugin 승인
전달은 대신 Slack Plugin 승인자를 사용합니다.

명시적 Slack 실행 승인 구성이 없는 기본 동작:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

명시적인 Slack 네이티브 구성은 승인자를 재정의하거나, 필터를 추가하거나,
원본 채팅 전달을 선택하려는 경우에만 필요합니다.

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

공유 `approvals.exec` 전달은 별개입니다. 실행 승인 프롬프트가 다른 채팅이나 명시적인 대역 외 대상으로도
라우팅되어야 할 때만 사용하세요. 공유 `approvals.plugin` 전달도
별개입니다. Slack 네이티브 전달은 Slack이 Plugin 승인 요청을 네이티브로 처리할 수 있을 때만 해당 폴백을 억제합니다.

동일 채팅 `/approve`도 이미 명령을 지원하는 Slack 채널과 DM에서 작동합니다. 전체 승인 전달 모델은 [실행 승인](/ko/tools/exec-approvals)을 참조하세요.

## 이벤트 및 운영 동작

- 메시지 편집/삭제는 시스템 이벤트로 매핑됩니다.
- 스레드 브로드캐스트("Also send to channel" 스레드 답글)는 일반 사용자 메시지로 처리됩니다.
- 반응 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- 멤버 참여/나가기, 채널 생성/이름 변경, 핀 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- `configWrites`가 활성화된 경우 `channel_id_changed`는 채널 구성 키를 마이그레이션할 수 있습니다.
- 채널 주제/목적 메타데이터는 신뢰할 수 없는 컨텍스트로 취급되며 라우팅 컨텍스트에 주입될 수 있습니다.
- 스레드 시작자 및 초기 스레드 기록 컨텍스트 시딩은 해당하는 경우 구성된 발신자 허용 목록으로 필터링됩니다.
- 블록 작업, 바로가기, 모달 상호작용은 풍부한 페이로드 필드가 있는 구조화된 `Slack interaction: ...` 시스템 이벤트를 내보냅니다.
  - 블록 작업: 선택된 값, 레이블, 선택기 값, `workflow_*` 메타데이터
  - 전역 바로가기: 콜백 및 행위자 메타데이터, 행위자의 직접 세션으로 라우팅
  - 메시지 바로가기: 콜백, 행위자, 채널, 스레드, 선택된 메시지 컨텍스트
  - 라우팅된 채널 메타데이터와 양식 입력이 포함된 모달 `view_submission` 및 `view_closed` 이벤트

Slack 앱 구성에서 전역 또는 메시지 바로가기를 정의하고 비어 있지 않은 콜백 ID를 사용하세요. OpenClaw는 일치하는 바로가기 페이로드를 확인하고, 다른 Slack 상호작용과 동일한 DM/채널 발신자 정책을 적용하며, 정리된 이벤트를 라우팅된 에이전트 세션에 큐에 넣습니다. 트리거 ID와 응답 URL은 에이전트 컨텍스트에서 수정됩니다.

## 구성 참조

기본 참조: [구성 참조 - Slack](/ko/gateway/config-channels#slack).

<Accordion title="신호가 높은 Slack 필드">

- 모드/인증: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 접근: `dm.enabled`, `dmPolicy`, `allowFrom` (레거시: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 호환성 토글: `dangerouslyAllowNameMatching` (비상용, 필요하지 않으면 끄세요)
- 채널 접근: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 스레딩/기록: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 펼침: `chat.postMessage` 링크/미디어 미리보기 제어용 `unfurlLinks` (기본값: `false`), `unfurlMedia`; 링크 미리보기를 다시 선택하려면 `unfurlLinks: true`를 설정하세요
- 운영/기능: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에 답글이 없음">
    순서대로 확인하세요.

    - `groupPolicy`
    - 채널 허용 목록(`channels.slack.channels`) — **키는 이름(`#channel-name`)이 아니라 채널 ID**(`C12345678`)여야 합니다. 이름 기반 키는 `groupPolicy: "allowlist"`에서 조용히 실패합니다. 기본적으로 채널 라우팅이 ID 우선이기 때문입니다. ID를 찾으려면 Slack에서 채널을 마우스 오른쪽 버튼으로 클릭 → **Copy link** — URL 끝의 `C...` 값이 채널 ID입니다.
    - `requireMention`
    - 채널별 `users` 허용 목록
    - `messages.groupChat.visibleReplies`: 일반 그룹/채널 요청은 기본값이 `"automatic"`입니다. `"message_tool"`을 선택했고 로그에 `message(action=send)` 호출 없이 어시스턴트 텍스트가 표시된다면 모델이 표시되는 메시지 도구 경로를 놓친 것입니다. 이 모드에서는 최종 텍스트가 비공개로 유지됩니다. 억제된 페이로드 메타데이터는 Gateway 상세 로그를 확인하거나, 모든 일반 어시스턴트 최종 답글을 레거시 경로로 게시하려면 이를 `"automatic"`으로 설정하세요.
    - `messages.groupChat.unmentionedInbound`: 값이 `"room_event"`이면 멘션되지 않은 허용 채널 대화는 주변 컨텍스트이며, 에이전트가 `message` 도구를 호출하지 않는 한 침묵 상태로 유지됩니다. [주변 방 이벤트](/ko/channels/ambient-room-events)를 참조하세요.

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (또는 레거시 `channels.slack.dm.policy`)
    - 페어링 승인 / 허용 목록 항목(`dmPolicy: "open"`도 여전히 `channels.slack.allowFrom: ["*"]`가 필요함)
    - 그룹 DM은 MPIM 처리를 사용합니다. `channels.slack.dm.groupEnabled`를 활성화하고, 구성된 경우 `channels.slack.dm.groupChannels`에 MPIM을 포함하세요
    - Slack Assistant DM 이벤트: `drop message_changed`를 언급하는 상세 로그는
      보통 Slack이 메시지 메타데이터에서 복구 가능한 사람 발신자 없이 편집된 Assistant 스레드 이벤트를 보냈다는 뜻입니다

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="소켓 모드가 연결되지 않음">
    Slack 앱 설정에서 봇 + 앱 토큰과 Socket Mode 활성화를 검증하세요.
    App-Level Token에는 `connections:write`가 필요하며, Bot User OAuth Token
    봇 토큰은 앱 토큰과 같은 Slack 앱/워크스페이스에 속해야 합니다.

    `openclaw channels status --probe --json`이 `botTokenStatus` 또는
    `appTokenStatus: "configured_unavailable"`를 표시하면 Slack 계정은
    구성되어 있지만 현재 런타임이 SecretRef 기반
    값을 해석하지 못한 것입니다.

    `slack socket mode failed to start; retry ...` 같은 로그는 복구 가능한
    시작 실패입니다. 누락된 범위, 취소된 토큰, 잘못된 인증은 대신 빠르게 실패합니다.
    `slack token mismatch ...` 로그는 bot token과 app token이 서로 다른 Slack 앱에
    속한 것으로 보인다는 뜻입니다. Slack 앱 자격 증명을 수정하세요.

  </Accordion>

  <Accordion title="HTTP 모드가 이벤트를 수신하지 않음">
    다음을 검증하세요.

    - 서명 비밀
    - Webhook 경로
    - Slack Request URLs(Events + Interactivity + Slash Commands)
    - HTTP 계정마다 고유한 `webhookPath`
    - 공개 URL이 TLS를 종료하고 요청을 Gateway 경로로 전달하는지
    - Slack 앱 `request_url` 경로가 `channels.slack.webhookPath`와 정확히 일치하는지(기본값 `/slack/events`)

    계정 스냅샷에 `signingSecretStatus: "configured_unavailable"`가 나타나면
    HTTP 계정은 구성되어 있지만 현재 런타임이 SecretRef 기반 서명 비밀을
    확인할 수 없었다는 뜻입니다.

    `slack: webhook path ... already registered` 로그가 반복되면 두 HTTP
    계정이 같은 `webhookPath`를 사용하고 있다는 뜻입니다. 각 계정에 서로 다른 경로를 지정하세요.

  </Accordion>

  <Accordion title="네이티브/슬래시 명령이 실행되지 않음">
    의도한 방식이 다음 중 무엇인지 확인하세요.

    - Slack에 등록된 일치하는 슬래시 명령과 함께 사용하는 네이티브 명령 모드(`channels.slack.commands.native: true`)
    - 또는 단일 슬래시 명령 모드(`channels.slack.slashCommand.enabled: true`)

    Slack은 슬래시 명령을 자동으로 생성하거나 제거하지 않습니다. `commands.native: "auto"`는 Slack 네이티브 명령을 활성화하지 않습니다. `true`를 사용하고 Slack 앱에서 일치하는 명령을 생성하세요. HTTP 모드에서는 모든 Slack 슬래시 명령에 Gateway URL이 포함되어야 합니다. Socket Mode에서는 명령 페이로드가 websocket을 통해 도착하며 Slack은 `slash_commands[].url`을 무시합니다.

    또한 `commands.useAccessGroups`, DM 권한 부여, 채널 허용 목록,
    채널별 `users` 허용 목록을 확인하세요. Slack은 차단된
    슬래시 명령 발신자에게 다음을 포함한 ephemeral 오류를 반환합니다.

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 첨부 파일 비전 참조

Slack 파일 다운로드가 성공하고 크기 제한이 허용하면 Slack은 다운로드된 미디어를 에이전트 턴에 첨부할 수 있습니다. 이미지 파일은 미디어 이해 경로를 통해 전달되거나 비전 지원 reply 모델로 직접 전달될 수 있습니다. 다른 파일은 이미지 입력으로 처리되지 않고 다운로드 가능한 파일 컨텍스트로 유지됩니다.

### 지원되는 미디어 유형

| 미디어 유형                    | 소스               | 현재 동작                                                                          | 참고                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 이미지 | Slack 파일 URL       | 다운로드되어 비전 지원 처리를 위해 턴에 첨부됨                                   | 파일당 한도: `channels.slack.mediaMaxMb`(기본값 20 MB)                   |
| PDF 파일                       | Slack 파일 URL       | 다운로드되어 `download-file` 또는 `pdf` 같은 도구의 파일 컨텍스트로 노출됨        | Slack 인바운드는 PDF를 이미지 비전 입력으로 자동 변환하지 않음           |
| 기타 파일                      | Slack 파일 URL       | 가능할 때 다운로드되어 파일 컨텍스트로 노출됨                                     | 바이너리 파일은 이미지 입력으로 처리되지 않음                            |
| 스레드 답글                    | 스레드 시작 파일     | 답글에 직접 미디어가 없으면 루트 메시지 파일을 컨텍스트로 하이드레이션할 수 있음  | 파일만 있는 시작 메시지는 첨부 파일 플레이스홀더를 사용함                |
| 다중 이미지 메시지             | 여러 Slack 파일      | 각 파일이 독립적으로 평가됨                                                       | Slack 처리는 메시지당 8개 파일로 제한됨                                  |

### 인바운드 파이프라인

파일 첨부가 있는 Slack 메시지가 도착하면:

1. OpenClaw가 bot token을 사용하여 Slack의 비공개 URL에서 파일을 다운로드합니다.
2. 성공하면 파일이 미디어 저장소에 기록됩니다.
3. 다운로드된 미디어 경로와 콘텐츠 유형이 인바운드 컨텍스트에 추가됩니다.
4. 이미지 지원 모델/도구 경로는 해당 컨텍스트의 이미지 첨부 파일을 사용할 수 있습니다.
5. 이미지가 아닌 파일은 이를 처리할 수 있는 도구를 위해 파일 메타데이터 또는 미디어 참조로 계속 사용할 수 있습니다.

### 스레드 루트 첨부 파일 상속

메시지가 스레드에 도착할 때(`thread_ts` 부모가 있음):

- 답글 자체에 직접 미디어가 없고 포함된 루트 메시지에 파일이 있으면 Slack은 루트 파일을 스레드 시작 컨텍스트로 하이드레이션할 수 있습니다.
- 직접 답글 첨부 파일은 루트 메시지 첨부 파일보다 우선합니다.
- 파일만 있고 텍스트가 없는 루트 메시지는 첨부 파일 플레이스홀더로 표시되어 fallback이 해당 파일을 계속 포함할 수 있습니다.

### 다중 첨부 파일 처리

단일 Slack 메시지에 여러 파일 첨부가 포함된 경우:

- 각 첨부 파일은 미디어 파이프라인을 통해 독립적으로 처리됩니다.
- 다운로드된 미디어 참조가 메시지 컨텍스트에 집계됩니다.
- 처리 순서는 이벤트 페이로드의 Slack 파일 순서를 따릅니다.
- 한 첨부 파일 다운로드 실패가 다른 첨부 파일을 차단하지 않습니다.

### 크기, 다운로드 및 모델 제한

- **크기 한도**: 기본값은 파일당 20 MB입니다. `channels.slack.mediaMaxMb`를 통해 구성할 수 있습니다.
- **다운로드 실패**: Slack이 제공할 수 없는 파일, 만료된 URL, 접근할 수 없는 파일, 크기 초과 파일, Slack 인증/로그인 HTML 응답은 지원되지 않는 형식으로 보고되지 않고 건너뜁니다.
- **비전 모델**: 이미지 분석은 비전을 지원하는 경우 활성 reply 모델을 사용하거나 `agents.defaults.imageModel`에 구성된 이미지 모델을 사용합니다.

### 알려진 제한

| 시나리오                              | 현재 동작                                                                     | 해결 방법                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 만료된 Slack 파일 URL                 | 파일을 건너뜀. 오류는 표시되지 않음                                           | Slack에 파일을 다시 업로드하세요                                             |
| 비전 모델이 구성되지 않음             | 이미지 첨부 파일은 미디어 참조로 저장되지만 이미지로 분석되지 않음           | `agents.defaults.imageModel`을 구성하거나 비전 지원 reply 모델을 사용하세요  |
| 매우 큰 이미지(기본값 기준 > 20 MB)   | 크기 한도에 따라 건너뜀                                                       | Slack이 허용하는 경우 `channels.slack.mediaMaxMb`를 늘리세요                 |
| 전달/공유된 첨부 파일                 | 텍스트와 Slack 호스팅 이미지/파일 미디어는 최선 노력으로 처리됨              | OpenClaw 스레드에서 직접 다시 공유하세요                                     |
| PDF 첨부 파일                         | 파일/미디어 컨텍스트로 저장되며 이미지 비전을 통해 자동 라우팅되지 않음      | 파일 메타데이터에는 `download-file`을 사용하거나 PDF 분석에는 `pdf` 도구를 사용하세요 |

### 관련 문서

- [미디어 이해 파이프라인](/ko/nodes/media-understanding)
- [PDF 도구](/ko/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 첨부 파일 비전 활성화
- 회귀 테스트: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- 라이브 검증: [#51354](https://github.com/openclaw/openclaw/issues/51354)

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
    위협 모델 및 강화입니다.
  </Card>
  <Card title="구성" icon="sliders" href="/ko/gateway/configuration">
    구성 레이아웃 및 우선순위입니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    명령 카탈로그 및 동작입니다.
  </Card>
</CardGroup>
