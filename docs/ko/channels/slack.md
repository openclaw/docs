---
read_when:
    - Slack 설정 또는 Slack 소켓, HTTP, 릴레이 모드 디버깅
summary: Slack 설정 및 런타임 동작(Socket Mode, HTTP Request URL 및 릴레이 모드)
title: Slack
x-i18n:
    generated_at: "2026-07-16T12:19:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack 지원은 Slack 앱 통합을 통해 DM과 채널을 지원합니다. 기본 전송 방식은 Socket Mode이며, HTTP Request URL도 지원합니다. 릴레이 모드는 신뢰할 수 있는 라우터가 Slack 인그레스를 소유하는 관리형 배포를 위한 것입니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Slack DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령어 동작과 명령어 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## 전송 방식 선택

Socket Mode와 HTTP Request URL은 메시징, 슬래시 명령어, App Home, 상호작용 기능에서 동일한 기능을 제공합니다. 기능이 아니라 배포 형태에 따라 선택하십시오.

| 고려 사항                      | Socket Mode(기본값)                                                                                                                                | HTTP Request URL                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 공개 Gateway URL           | 필요하지 않음                                                                                                                                         | 필요함(DNS, TLS, 리버스 프록시 또는 터널)                                                                   |
| 아웃바운드 네트워크             | `wss-primary.slack.com`에 대한 아웃바운드 WSS에 연결할 수 있어야 함                                                                                            | 아웃바운드 WS 없음, 인바운드 HTTPS만 사용                                                                             |
| 필요한 토큰                | 봇 토큰 + `connections:write`이 있는 App-Level Token                                                                                                 | 봇 토큰 + Signing Secret                                                                                     |
| 개발 노트북/방화벽 뒤 | 별도 설정 없이 작동함                                                                                                                                          | 공개 터널(ngrok, Cloudflare Tunnel, Tailscale Funnel) 또는 스테이징 Gateway가 필요함                          |
| 수평 확장           | 호스트당 앱별 Socket Mode 세션 1개, 여러 Gateway에는 별도의 Slack 앱이 필요함                                                                 | 상태 비저장 POST 핸들러, 여러 Gateway 복제본이 로드 밸런서 뒤에서 하나의 앱을 공유할 수 있음                     |
| 하나의 Gateway에서 다중 계정 | 지원됨, 각 계정이 자체 WS를 엶                                                                                                             | 지원됨, 등록이 충돌하지 않도록 각 계정에 고유한 `webhookPath`(기본값 `/slack/events`)이 필요함 |
| 슬래시 명령어 전송      | WS 연결을 통해 전달됨, `slash_commands[].url`은 무시됨                                                                                  | Slack이 `slash_commands[].url`으로 POST함, 명령어를 디스패치하려면 이 필드가 필요함                           |
| 요청 서명              | 사용하지 않음(인증에는 App-Level Token 사용)                                                                                                               | Slack이 모든 요청에 서명하며 OpenClaw가 `signingSecret`으로 검증함                                              |
| 연결 끊김 복구  | Slack SDK 자동 재연결이 활성화되며, OpenClaw도 실패한 Socket Mode 세션을 제한된 백오프로 다시 시작합니다. Pong 타임아웃 전송 조정이 적용됩니다. | 끊길 수 있는 영구 연결이 없으며, 재시도는 Slack에서 요청별로 수행함                                           |

<Note>
  단일 Gateway 호스트, 개발 노트북, 그리고 `*.slack.com` 아웃바운드에는 연결할 수 있지만 인바운드 HTTPS를 수락할 수 없는 온프레미스 네트워크에서는 **Socket Mode를 선택하십시오**.

로드 밸런서 뒤에서 여러 Gateway 복제본을 실행하거나, 아웃바운드 WSS가 차단되었지만 인바운드 HTTPS는 허용되거나, 이미 리버스 프록시에서 Slack Webhook을 종료하는 경우에는 **HTTP Request URL을 선택하십시오**.
</Note>

<Warning>
  Slack은 하나의 앱에 대해 여러 Socket Mode 연결을 유지할 수 있으며 각 페이로드를 어느 연결에든 전달할 수 있습니다. 따라서 Slack 앱을 공유하는 별도의 OpenClaw Gateway에는 동등한 라우팅 및 권한 부여 구성이 필요합니다. 그렇지 않으면 Gateway별로 별도의 Slack 앱, 단일 릴레이 인그레스 또는 로드 밸런서 뒤의 HTTP Request URL을 사용하십시오. [Socket Mode 사용](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)을 참조하십시오.
</Warning>

### 릴레이 모드

릴레이 모드는 Slack 인그레스와 OpenClaw Gateway를 분리합니다. 신뢰할 수 있는 라우터가 단일 Slack Socket Mode 연결을 소유하고 대상 Gateway를 선택한 후, 인증된 웹소켓을 통해 형식이 지정된 이벤트를 전달합니다. Gateway는 아웃바운드 Slack Web API 호출에 계속 자체 봇 토큰을 사용합니다.

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

릴레이 URL은 localhost를 대상으로 하지 않는 한 `wss://`을 사용해야 합니다. 베어러 토큰과 라우터 경로 테이블을 Slack 권한 부여 경계의 일부로 취급하십시오. 라우팅된 이벤트는 권한이 부여된 활성화로서 일반 Slack 메시지 핸들러에 들어갑니다. 라우터가 웹소켓 `hello` 프레임에 제공한 `slack_identity`은 기본 아웃바운드 사용자 이름과 아이콘을 설정할 수 있으며, 호출자가 명시적으로 제공한 ID가 여전히 우선합니다. 릴레이 연결은 Socket Mode와 동일한 제한된 백오프 타이밍으로 다시 연결되며 연결이 끊길 때마다 라우터가 제공한 ID를 지웁니다.

### Enterprise Grid 조직 전체 설치

하나의 Slack 계정으로 Enterprise Grid 조직 전체 설치가 적용되는 모든 워크스페이스의 메시지를 받을 수 있습니다. 직접 Socket Mode 또는 HTTP Request URL을 선택하십시오. 엔터프라이즈 계정에서는 릴레이 모드가 지원되지 않습니다. 아래의 두 최소 권한 매니페스트는 V1 `message` 및 `app_mention` 이벤트 경로, 즉각적인 응답, 리스너 소유 상태 반응만 활성화합니다.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Enterprise Grid 조직 관리자 또는 조직 소유자가 앱을 승인하고 조직 수준에서 설치한 후 설치가 적용될 워크스페이스를 선택하도록 하십시오. OpenClaw를 시작하기 전에 대상인 모든 워크스페이스에서 앱을 사용할 수 있는지 확인하십시오. Socket Mode용 `connections:write`이 있는 앱 수준 토큰을 생성한 다음 조직 설치에서 봇 토큰을 복사하십시오. 조직에 설치된 봇 토큰을 사용하는 계정을 구성하십시오.

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URL

Gateway에 공개 HTTPS 엔드포인트가 있고 Socket Mode 연결을 열지 않는 경우 HTTP 모드를 사용하십시오. 예시 URL을 Gateway의 공개 `webhookPath` URL(기본값 `/slack/events`)로 바꾸십시오.

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Enterprise Grid 조직 관리자 또는 조직 소유자가 앱을 승인하고 조직 수준에서 설치한 후 설치가 적용될 워크스페이스를 선택하도록 하십시오. Slack이 Request URL을 확인한 후 조직 설치의 봇 토큰과 앱의 **Basic Information -> App Credentials -> Signing Secret**을 복사하십시오. 동일한 Request URL 경로를 사용하여 엔터프라이즈 계정을 구성하십시오.

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

시작 시 OpenClaw는 Slack `auth.test`을 사용하여 `enterpriseOrgInstall`을 검증합니다. 플래그가 없는 조직 설치 토큰이나 플래그가 있는 워크스페이스 토큰은 시작에 실패합니다. 설치를 허용한 워크스페이스에 관한 정보는 계속 Slack이 신뢰 가능한 원본이며, 이후 OpenClaw는 전달된 각 이벤트에 구성된 채널, 사용자, DM 및 멘션 정책을 적용합니다. 조직 설치에서는 루프 방지를 위한 안정적이고 워크스페이스로 한정된 봇 ID를 제공하지 않으므로, Enterprise V1은 `allowBots`과 관계없이 봇이 작성한 모든 `message` 및 `app_mention` 이벤트를 디스패치 전에 거부합니다.

Enterprise 지원은 의도적으로 직접 Socket Mode 또는 HTTP `message` 및 `app_mention` 이벤트와 이에 대한 즉각적인 응답으로 제한됩니다. 엔터프라이즈 계정에서는 릴레이 모드, 슬래시 명령어, 상호작용, App Home, 반응 이벤트 리스너, 고정 항목, Slack 작업 도구, Slack 네이티브 승인, 바인딩, 대기열 또는 예약 전달, 사전 전송을 사용할 수 없습니다. 아웃바운드 확인, 입력 중 및 상태 반응은 리스너 소유 Slack 클라이언트를 통해 지원되며 `reactions:write`이 필요합니다. 인바운드 반응 알림과 반응 작업 도구는 계속 사용할 수 없습니다.

즉시 응답은 청크, 미디어, 메타데이터, ID 폴백, 언펄 및 수신 확인에 표준 Slack 전달 동작을 재사용하지만, 검증된 리스너 소유 클라이언트가 활성 이벤트 턴에 남아 있는 동안에만 적용됩니다. 메모리 내 전송 큐와 스레드 참여 레코드는 해당 이벤트의 워크스페이스별로 분할되며, 클라이언트 자체는 직렬화되거나 영속화되지 않습니다.

채널 정책 키와 `dm.groupChannels` 항목에는 원시 안정 Slack 채널 ID 또는
`channel:<id>` 형식을 사용해야 합니다. OpenClaw는 런타임 일치를 위해 두 형식 모두 원시 채널 ID로 정규화합니다.
`slack:`, `group:`, `mpim:` 접두사를 사용하면 시작에 실패합니다.
사용자 정책 항목에는 안정적인 Slack 사용자 ID를 사용해야 하며, 이름, 슬러그, 표시 이름 및 이메일 주소를 사용하면 시작에 실패합니다. ID에는 Slack의 표준 대문자 접두사와 본문을 사용해야 합니다(예: `C0123456789` 또는 `U0123456789`). 소문자 및 짧은 유사 ID를 사용하면 시작에 실패합니다. 엔터프라이즈 계정에서는
`dangerouslyAllowNameMatching`을 활성화할 수 없습니다. 엔터프라이즈 계정은 전역
`mentionPatterns.mode`을 설정할 수 있지만, 정규화되지 않은 Slack 채널 ID는 워크스페이스로 한정되지 않고 여러 워크스페이스에서 재사용될 수 있으므로 `mentionPatterns.allowIn` 및
`mentionPatterns.denyIn`를 설정하면 시작에 실패합니다. 워크스페이스 설치는 기존의 범위 지정된 멘션 패턴 동작을 유지합니다. 승인된 각 워크스페이스에는 Slack ID가 중복되더라도 별도의 라우팅, 세션, 트랜스크립트, 중복 제거, 기록 및 캐시 ID가 부여됩니다. `message` 스트림에서는 일반 사용자 메시지와 사용자가 작성한
`file_share` 이벤트가 지원되며, 그 밖의 메시지 하위 유형은 권한 부여 또는 시스템 이벤트 처리 전에 거부됩니다.

엔터프라이즈 DM은 비활성화해야 하거나(`dm.enabled=false` 또는
`dmPolicy="disabled"`), `dmPolicy="open"`와 리터럴 `"*"`이 포함된 유효 계정
`allowFrom`을 사용하여 명시적으로 개방해야 합니다. 비어 있는 허용 목록 또는 `"*"` 없이 사용자별 ID만 지정하면 시작에 실패합니다. 해당 권한 부여 저장소에서 Slack 사용자 ID는 워크스페이스로 한정되지 않으므로 페어링 및 사용자별 DM 허용 목록은 거부됩니다. 채널 및 발신자 정책은 채널 메시지에 계속 적용됩니다.

## 설치

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`은 Plugin을 등록하고 활성화합니다. 아래의 Slack 앱 및 채널 설정을 구성하기 전에는 아무 작업도 수행하지 않습니다. 일반적인 Plugin 설치 규칙은 [Plugin](/ko/tools/plugin)을 참조하십시오.

## 빠른 설정

이 섹션의 매니페스트는 워크스페이스 범위의 설치를 생성합니다. Enterprise Grid 조직 설치의 경우 대신 전용 [조직 전체 매니페스트 및 워크플로](#enterprise-grid-org-wide-installs)를 사용하십시오.

<Tabs>
  <Tab title="소켓 모드(기본값)">
    <Steps>
      <Step title="새 Slack 앱 만들기">
        [api.slack.com/apps](https://api.slack.com/apps/new)를 열고 → **Create New App** → **From a manifest** → 워크스페이스를 선택한 다음 → 아래 매니페스트 중 하나를 붙여넣고 → **Next** → **Create**를 선택하십시오.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw는 Slack 어시스턴트 스레드를 OpenClaw 에이전트에 연결합니다.",
      "suggested_prompts": [
        { "title": "무엇을 할 수 있나요?", "message": "어떤 도움을 줄 수 있나요?" },
        {
          "title": "이 채널 요약",
          "message": "이 채널의 최근 활동을 요약해 주세요."
        },
        { "title": "답변 초안 작성", "message": "답변 초안을 작성하도록 도와주세요." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw는 Slack 어시스턴트 스레드를 OpenClaw 에이전트에 연결합니다.",
      "suggested_prompts": [
        { "title": "무엇을 할 수 있나요?", "message": "어떤 도움을 줄 수 있나요?" },
        {
          "title": "이 채널 요약",
          "message": "이 채널의 최근 활동을 요약해 주세요."
        },
        { "title": "답변 초안 작성", "message": "답변 초안을 작성하도록 도와주세요." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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
          **Recommended**는 Slack Plugin의 전체 기능 세트인 App Home, 슬래시 명령, 파일, 반응, 핀, 그룹 DM 및 이모지/사용자 그룹 읽기와 일치합니다. 워크스페이스 정책에서 범위를 제한하는 경우 **Minimal**을 선택하십시오. 이 옵션은 DM, 채널/그룹 기록, 멘션 및 슬래시 명령을 지원하지만 파일, 반응, 핀, 그룹 DM(`mpim:*`), `emoji:read` 및 `usergroups:read`은 제외합니다. 범위별 근거와 추가 슬래시 명령 같은 부가 옵션은 [매니페스트 및 범위 체크리스트](#manifest-and-scope-checklist)를 참조하십시오.
        </Note>

        Slack에서 앱을 만든 후:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write`을 추가하고 저장한 다음 App-Level Token을 복사하십시오.
        - **Install App -> Install to Workspace**: Bot User OAuth Token을 복사하십시오.

      </Step>

      <Step title="OpenClaw 구성">

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

        환경 변수 폴백(기본 계정만 해당):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP 요청 URL">
    <Steps>
      <Step title="새 Slack 앱 만들기">
        [api.slack.com/apps](https://api.slack.com/apps/new)를 열고 → **Create New App** → **From a manifest** → 워크스페이스를 선택한 다음 → 아래 매니페스트 중 하나를 붙여넣고 → `https://gateway-host.example.com/slack/events`을 공개 Gateway URL로 바꾼 후 → **Next** → **Create**를 선택하십시오.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw는 Slack 어시스턴트 스레드를 OpenClaw 에이전트에 연결합니다.",
      "suggested_prompts": [
        { "title": "무엇을 할 수 있나요?", "message": "어떤 도움을 줄 수 있나요?" },
        {
          "title": "이 채널 요약",
          "message": "이 채널의 최근 활동을 요약해 주세요."
        },
        { "title": "답변 초안 작성", "message": "답변 초안을 작성하도록 도와주세요." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw은 Slack 어시스턴트 스레드를 OpenClaw 에이전트에 연결합니다.",
      "suggested_prompts": [
        { "title": "무엇을 할 수 있나요?", "message": "어떤 도움을 줄 수 있나요?" },
        {
          "title": "이 채널 요약",
          "message": "이 채널의 최근 활동을 요약해 주세요."
        },
        { "title": "답장 초안 작성", "message": "답장 초안을 작성하도록 도와주세요." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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
          **권장** 구성은 Slack Plugin의 전체 기능 세트와 일치합니다. **최소** 구성은 제한적인 워크스페이스를 위해 파일, 반응, 고정 항목, 그룹 DM(`mpim:*`), `emoji:read`, `usergroups:read`을 제외합니다. 각 범위의 근거는 [매니페스트 및 범위 체크리스트](#manifest-and-scope-checklist)를 참조하십시오.
        </Note>

        <Info>
          세 URL 필드(`slash_commands[].url`, `event_subscriptions.request_url`, `interactivity.request_url` / `message_menu_options_url`)는 모두 동일한 OpenClaw 엔드포인트를 가리킵니다. Slack의 매니페스트 스키마에서는 각 필드에 별도의 이름을 요구하지만, OpenClaw은 페이로드 유형에 따라 라우팅하므로 단일 `webhookPath`(기본값 `/slack/events`)이면 충분합니다. `slash_commands[].url`이 없는 슬래시 명령은 HTTP 모드에서 아무 동작도 하지 않고 조용히 종료됩니다.
        </Info>

        Slack에서 앱을 생성한 후 다음을 수행하십시오.

        - **Basic Information → App Credentials**: 요청 검증에 사용할 **Signing Secret**을 복사합니다.
        - **Install App -> Install to Workspace**: Bot User OAuth Token을 복사합니다.

      </Step>

      <Step title="OpenClaw 구성">

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
        다중 계정 HTTP에는 고유한 Webhook 경로를 사용하십시오

        등록이 충돌하지 않도록 각 계정에 서로 다른 `webhookPath`(기본값 `/slack/events`)을 지정하십시오.
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

## Socket Mode 전송 조정

OpenClaw은 기본적으로 Socket Mode에서 Slack SDK 클라이언트의 pong 시간 제한을 15초로 설정합니다. 워크스페이스 또는 호스트별 조정이 필요한 경우에만 전송 설정을 재정의하십시오.

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

Slack 웹소켓 pong/서버 ping 시간 제한이 기록되거나 이벤트 루프 고갈 문제가 알려진 호스트에서 실행되는 Socket Mode 워크스페이스에만 이 설정을 사용하십시오. `clientPingTimeout`은 SDK가 클라이언트 ping을 보낸 후 pong을 기다리는 시간이며, `serverPingTimeout`은 Slack 서버 ping을 기다리는 시간입니다. 앱 메시지와 이벤트는 전송 활성 신호가 아니라 애플리케이션 상태로 유지됩니다.

참고:

- `socketMode`은 HTTP Request URL 모드에서 무시됩니다.
- 기본 `channels.slack.socketMode` 설정은 재정의하지 않는 한 모든 Slack 계정에 적용됩니다. 계정별 재정의에는 `channels.slack.accounts.<accountId>.socketMode`을 사용합니다. 이는 객체 재정의이므로 해당 계정에 적용할 모든 소켓 조정 필드를 포함하십시오.
- OpenClaw 기본값(`15000`)이 있는 것은 `clientPingTimeout`뿐입니다. `serverPingTimeout`과 `pingPongLoggingEnabled`은 구성된 경우에만 Slack SDK에 전달됩니다.
- Socket Mode 재시작 백오프는 약 2초에서 시작하여 약 30초가 최대입니다. 복구 가능한 시작, 시작 대기 및 연결 해제 실패는 채널이 중지될 때까지 재시도합니다. 잘못된 인증, 취소된 토큰 또는 누락된 범위와 같은 영구적인 계정 및 자격 증명 오류는 무한히 재시도하는 대신 즉시 실패합니다.

## 매니페스트 및 범위 체크리스트

기본 Slack 앱 매니페스트는 Socket Mode와 HTTP Request URL에서 동일합니다. `settings` 블록과 슬래시 명령의 `url`만 다릅니다.

기본 매니페스트(Socket Mode 기본값):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw용 Slack 커넥터"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw은 Slack 어시스턴트 스레드를 OpenClaw 에이전트에 연결합니다.",
      "suggested_prompts": [
        { "title": "무엇을 할 수 있나요?", "message": "어떤 도움을 줄 수 있나요?" },
        {
          "title": "이 채널 요약",
          "message": "이 채널의 최근 활동을 요약해 주세요."
        },
        { "title": "답장 초안 작성", "message": "답장 초안을 작성하도록 도와주세요." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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

**HTTP Request URL 모드**에서는 `settings`을 HTTP 변형으로 교체하고 각 슬래시 명령에 `url`을 추가하십시오. 공개 URL이 필요합니다.

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw에 메시지 보내기",
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

위 기본값을 확장하는 다양한 기능을 제공합니다.

기본 매니페스트는 Slack App Home의 **Home** 탭을 활성화하고 `app_home_opened`을 구독합니다. 워크스페이스 구성원이 Home 탭을 열면 OpenClaw은 `views.publish`이 포함된 안전한 기본 Home 보기를 게시하며, 대화 페이로드나 비공개 구성은 포함하지 않습니다. 단일 슬래시 명령 모드가 활성화되면 명령 힌트는 `channels.slack.slashCommand.name`을 사용합니다. 네이티브 명령을 사용하거나 슬래시 명령을 사용하지 않는 설치에서는 해당 힌트를 생략합니다. Slack DM에서는 **Messages** 탭이 계속 활성화됩니다. 또한 매니페스트는 `features.assistant_view`, `assistant:write`, `assistant_thread_started`, `assistant_thread_context_changed`을 사용하여 Slack 어시스턴트 스레드를 활성화합니다. 어시스턴트 스레드는 자체 OpenClaw 스레드 세션으로 라우팅되며 Slack에서 제공한 스레드 컨텍스트를 에이전트가 사용할 수 있도록 유지합니다.

<AccordionGroup>
  <Accordion title="선택적 네이티브 슬래시 명령">

    몇 가지 유의 사항과 함께 단일 구성 명령 대신 여러 [네이티브 슬래시 명령](#commands-and-slash-behavior)을 사용할 수 있습니다.

    - `/status` 명령은 예약되어 있으므로 `/status` 대신 `/agentstatus`을 사용하십시오.
    - Slack 앱에는 한 번에 25개를 초과하는 슬래시 명령을 등록할 수 없습니다(Slack 플랫폼 제한).

    기존 `features.slash_commands` 섹션을 [사용 가능한 명령](/ko/tools/slash-commands#command-list)의 하위 집합으로 교체하십시오.

    <Tabs>
      <Tab title="Socket Mode(기본값)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "새 세션 시작",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "현재 세션 재설정"
    },
    {
      "command": "/compact",
      "description": "세션 컨텍스트 압축",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "현재 실행 중지"
    },
    {
      "command": "/session",
      "description": "스레드 바인딩 만료 관리",
      "usage_hint": "idle <duration|off> 또는 max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "사고 수준 설정",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "상세 출력 전환",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "빠른 모드 표시 또는 설정",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "추론 표시 여부 전환",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "권한 상승 모드 전환",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "exec 기본값 표시 또는 설정",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "대기 중인 승인 요청 승인 또는 거부",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "모델 표시 또는 설정",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "제공자/모델 목록 표시",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "간단한 도움말 요약 표시"
    },
    {
      "command": "/commands",
      "description": "생성된 명령 카탈로그 표시"
    },
    {
      "command": "/tools",
      "description": "현재 에이전트가 지금 사용할 수 있는 항목 표시",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "사용 가능한 경우 제공자 사용량/할당량을 포함한 런타임 상태 표시"
    },
    {
      "command": "/tasks",
      "description": "현재 세션의 활성/최근 백그라운드 작업 목록 표시"
    },
    {
      "command": "/context",
      "description": "컨텍스트 구성 방식 설명",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "발신자 ID 표시"
    },
    {
      "command": "/skill",
      "description": "이름으로 스킬 실행",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "세션 컨텍스트를 변경하지 않고 부가 질문하기",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "세션 컨텍스트를 변경하지 않고 부가 질문하기",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "사용량 바닥글 제어 또는 비용 요약 표시",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP 요청 URL">
        위의 Socket Mode와 동일한 `slash_commands` 목록을 사용하고 모든 항목에 `"url": "https://gateway-host.example.com/slack/events"`을 추가하십시오. 예:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "새 세션 시작",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "간단한 도움말 요약 표시",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        목록의 모든 명령에 해당 `url` 값을 반복해서 지정하십시오.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="선택적 작성자 범위(쓰기 작업)">
    발신 메시지가 기본 Slack 앱 ID 대신 활성 에이전트 ID(사용자 지정 사용자 이름 및 아이콘)를 사용하도록 하려면 `chat:write.customize` 봇 범위를 추가하십시오.

    이모지 아이콘을 사용하는 경우 Slack은 `:emoji_name:` 구문을 요구합니다.

  </Accordion>
  <Accordion title="선택적 사용자 토큰 범위(읽기 작업)">
    `channels.slack.userToken`을 구성하는 경우 일반적인 읽기 범위는 다음과 같습니다.

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

- `botToken` + `appToken`은 Socket Mode에 필요합니다.
- HTTP 모드에는 `botToken` + `signingSecret`이 필요합니다.
- 릴레이 모드에는 `botToken`과 함께 `relay.url`, `relay.authToken`, `relay.gatewayId`이 필요하며, 앱 토큰이나 서명 비밀을 사용하지 않습니다.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, `userToken`은 일반 텍스트
  문자열 또는 SecretRef 객체를 허용합니다.
- 구성 토큰이 환경 변수 대체 값보다 우선합니다.
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_USER_TOKEN` 환경 변수 대체 값은 각각 기본 계정에만 적용됩니다.
- `userToken`의 기본값은 읽기 전용 동작(`userTokenReadOnly: true`)입니다.

상태 스냅샷 동작:

- Slack 계정 검사는 자격 증명별 `*Source` 및 `*Status`
  필드(`botToken`, `appToken`, `signingSecret`, `userToken`)를 추적합니다.
- 상태는 `available`, `configured_unavailable` 또는 `missing`입니다.
- `configured_unavailable`은 계정이 SecretRef
  또는 다른 비인라인 비밀 소스를 통해 구성되었지만 현재 명령/런타임 경로에서
  실제 값을 확인할 수 없음을 의미합니다.
- HTTP 모드에는 `signingSecretStatus`이 포함됩니다. Socket Mode에서
  필수 조합은 `botTokenStatus` + `appTokenStatus`입니다.

<Tip>
작업/디렉터리 읽기의 경우 사용자 토큰이 구성되어 있으면 이를 우선할 수 있습니다. 쓰기의 경우 봇 토큰이 계속 우선되며, 사용자 토큰 쓰기는 `userTokenReadOnly: false`이고 봇 토큰을 사용할 수 없을 때만 허용됩니다.
</Tip>

## 작업 및 게이트

Slack 작업은 `channels.slack.actions.*`에 의해 제어됩니다.

현재 Slack 도구에서 사용할 수 있는 작업 그룹:

| 그룹       | 기본값 |
| ---------- | ------- |
| messages   | 활성화 |
| reactions  | 활성화 |
| pins       | 활성화 |
| memberInfo | 활성화 |
| emojiList  | 활성화 |

현재 Slack 메시지 작업에는 `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list`이 포함됩니다. `download-file`은 인바운드 파일 자리표시자에 표시된 Slack 파일 ID를 허용하며, 이미지의 경우 이미지 미리 보기를 반환하고 다른 파일 형식의 경우 로컬 파일 메타데이터를 반환합니다.

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.slack.dmPolicy`은 DM 액세스를 제어합니다. `channels.slack.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.slack.allowFrom`에 `"*"`이 포함되어야 함)
    - `disabled`

    DM 플래그:

    - `dm.enabled` (기본값 true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (레거시)
    - `dm.groupEnabled` (그룹 DM 기본값 false)
    - `dm.groupChannels` (선택적 MPIM 허용 목록)

    다중 계정 우선순위:

    - `channels.slack.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 명명된 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.slack.allowFrom`을 상속합니다.
    - 명명된 계정은 `channels.slack.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.slack.dm.policy` 및 `channels.slack.dm.allowFrom`은 호환성을 위해 계속 읽습니다. `openclaw doctor --fix`은 액세스를 변경하지 않고 수행할 수 있는 경우 이를 `dmPolicy` 및 `allowFrom`으로 마이그레이션합니다.

    DM 페어링은 `openclaw pairing approve slack <code>`을 사용합니다.

  </Tab>

  <Tab title="채널 정책">
    `channels.slack.groupPolicy`은 채널 처리를 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    채널 허용 목록은 `channels.slack.channels` 아래에 있으며 구성 키로 **안정적인 Slack 채널 ID를 사용해야 합니다**(예: `C12345678`).

    런타임 참고: `channels.slack`이 완전히 누락된 경우(환경 변수 전용 설정) 런타임은 `groupPolicy="allowlist"`으로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`이 설정된 경우에도 해당).

    이름/ID 확인:

    - 채널 허용 목록 항목 및 DM 허용 목록 항목은 토큰 액세스가 허용되는 경우 시작 시 확인됩니다.
    - 확인되지 않은 채널 이름 항목은 구성된 상태로 유지되지만 기본적으로 라우팅에서 무시됩니다.
    - 인바운드 권한 부여 및 채널 라우팅은 기본적으로 ID를 우선합니다. 사용자 이름/슬러그 직접 일치를 사용하려면 `channels.slack.dangerouslyAllowNameMatching: true`이 필요합니다.

    <Warning>
    이름 기반 키(`#channel-name` 또는 `channel-name`)는 `groupPolicy: "allowlist"`에서 일치하지 **않습니다**. 채널 조회는 기본적으로 ID를 우선하므로 이름 기반 키는 라우팅에 성공하지 않으며 해당 채널의 모든 메시지가 아무 알림 없이 차단됩니다. 이는 라우팅에 채널 키가 필요하지 않아 이름 기반 키가 작동하는 것처럼 보이는 `groupPolicy: "open"`과 다릅니다.

    항상 Slack 채널 ID를 키로 사용하십시오. 이를 찾으려면 Slack에서 채널을 마우스 오른쪽 버튼으로 클릭 → **Copy link** — ID(`C...`)는 URL 끝에 표시됩니다.

    올바른 예:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    잘못된 예(`groupPolicy: "allowlist"`에서 아무 알림 없이 차단됨):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="멘션 및 채널 사용자">
    채널 메시지는 기본적으로 멘션이 있어야 처리됩니다.

    멘션 소스:

    - 명시적 앱 멘션(`<@botId>`)
    - 봇 사용자가 해당 사용자 그룹의 구성원일 때 Slack 사용자 그룹 멘션(`<!subteam^S...>`); `usergroups:read` 필요
    - 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체 값 `messages.groupChat.mentionPatterns`)
    - 암시적 봇 답글 스레드 동작(`thread.requireExplicitMention`이 `true`인 경우 비활성화)

    채널별 제어(`channels.slack.channels.<id>`; 이름은 시작 시 확인 또는 `dangerouslyAllowNameMatching`을 통해서만 사용):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; 이 채널의 계정/채팅 유형 답글 모드를 재정의)
    - `users` (허용 목록)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 키 형식: `channel:`, `id:`, `e164:`, `username:`, `name:` 또는 `"*"` 와일드카드
      (접두사가 없는 레거시 키는 계속 `id:`에만 매핑됨)

    `ignoreOtherMentions`(기본값 `false`)은 다른 사용자 또는 사용자 그룹을 멘션하지만 이 봇은 멘션하지 않는 채널 메시지를 삭제합니다. DM 및 그룹 DM(MPIM)은 영향을 받지 않습니다. 필터에는 `auth.test`에서 확인된 봇 사용자 ID가 필요합니다. 해당 ID를 사용할 수 없는 경우(예: 사용자 토큰 전용 ID) 게이트가 열린 상태로 실패하며 메시지는 변경 없이 통과합니다.

    `allowBots`은 채널 및 비공개 채널에 보수적으로 적용됩니다. 봇이 작성한 대화방 메시지는 송신 봇이 해당 대화방의 `users` 허용 목록에 명시적으로 등록되어 있거나, `channels.slack.allowFrom`의 명시적 Slack 소유자 ID 중 하나 이상이 현재 대화방 멤버인 경우에만 허용됩니다. 와일드카드 및 표시 이름으로 지정한 소유자 항목은 소유자 존재 조건을 충족하지 않습니다. 소유자 존재 여부는 Slack `conversations.members`을 사용합니다. 앱에 대화방 유형에 맞는 읽기 범위(공개 채널은 `channels:read`, 비공개 채널은 `groups:read`)가 있는지 확인하십시오. 멤버 조회가 실패하면 OpenClaw는 봇이 작성한 대화방 메시지를 삭제합니다.

    허용된 봇 작성 Slack 메시지는 공유 [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용합니다. 기본 예산에는 `channels.defaults.botLoopProtection`을 구성한 다음, 워크스페이스 또는 채널에 다른 제한이 필요한 경우 `channels.slack.botLoopProtection` 또는 `channels.slack.channels.<id>.botLoopProtection`로 재정의하십시오.

  </Tab>
</Tabs>

## 스레드, 세션 및 답장 태그

- DM은 `direct`로, 채널은 `channel`로, MPIM은 `group`로 라우팅됩니다.
- Slack 라우트 바인딩은 원시 피어 ID와 `channel:C12345678`, `user:U12345678`, `<@U12345678>` 같은 Slack 대상 형식을 허용합니다.
- 기본값 `session.dmScope=main`을 사용하면 Slack DM이 에이전트 기본 세션으로 통합됩니다.
- 채널 세션: `agent:<agentId>:slack:channel:<channelId>`.
- `replyToMode`이 `off`이 아니더라도 일반적인 최상위 채널 메시지는 채널별 세션에 유지됩니다.
- 아웃바운드 답장 스레딩이 `replyToMode="off"`로 비활성화되어 있더라도 Slack 스레드 답장은 세션 접미사(`:thread:<threadTs>`)에 상위 Slack `thread_ts`을 사용합니다.
- 적합한 최상위 채널 루트가 표시되는 Slack 스레드를 시작할 것으로 예상되면 OpenClaw는 해당 루트를 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`에 시드하여 루트와 이후 스레드 답장이 하나의 OpenClaw 세션을 공유하도록 합니다. 이는 `app_mention` 이벤트, 명시적인 봇 또는 구성된 멘션 패턴 일치, 그리고 `replyToMode`이 `off`이 아닌 `requireMention: false` 채널에 적용됩니다.
- `channels.slack.thread.historyScope`의 기본값은 `thread`이며, `thread.inheritParent`의 기본값은 `false`입니다.
- `channels.slack.thread.initialHistoryLimit`은 새 스레드 세션이 시작될 때 가져올 기존 스레드 메시지 수를 제어합니다(기본값 `20`, 비활성화하려면 `0` 설정).
- `channels.slack.thread.requireExplicitMention`(기본값 `false`): `true`인 경우 암시적 스레드 멘션을 억제하여 봇이 해당 스레드에 이미 참여했더라도 스레드 내부의 명시적 `@bot` 멘션에만 응답하도록 합니다. 이 설정이 없으면 봇이 참여한 스레드의 답장은 `requireMention` 게이트를 우회합니다.

답장 스레딩 제어:

- `channels.slack.channels.<id>.replyToMode`: Slack 채널/비공개 채널 메시지에 대한 채널별 재정의
- `channels.slack.replyToMode`: `off|first|all|batched`(기본값 `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel`별 설정
- 직접 채팅의 레거시 대체 설정: `channels.slack.dm.replyToMode`

수동 답장 태그가 지원됩니다.

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` 도구에서 명시적으로 Slack 스레드에 답장하려면 `replyBroadcast: true`을 `action: "send"` 및 `threadId` 또는 `replyTo`과 함께 설정하여 Slack이 스레드 답장을 상위 채널에도 브로드캐스트하도록 요청하십시오. 이는 Slack의 `chat.postMessage` `reply_broadcast` 플래그에 매핑되며 미디어 업로드가 아닌 텍스트 또는 Block Kit 전송에서만 지원됩니다.

`message` 도구 호출이 Slack 스레드 내부에서 실행되고 동일한 채널을 대상으로 지정하면 OpenClaw는 일반적으로 유효한 계정, 채팅 유형 또는 채널별 `replyToMode`에 따라 현재 Slack 스레드를 상속합니다. 자동 답장과 동일 채널의 `send` 또는 `upload-file` 호출에도 동일한 채널별 재정의가 적용됩니다. 대신 새 상위 채널 메시지를 강제하려면 `action: "send"` 또는 `action: "upload-file"`에 `topLevel: true`을 설정하십시오. `threadId: null`도 동일한 최상위 옵트아웃으로 허용됩니다.

<Note>
`replyToMode="off"`은 명시적 `[[reply_to_*]]` 태그를 포함하여 아웃바운드 Slack 답장 스레딩을 비활성화합니다. 인바운드 Slack 스레드 세션을 평면화하지는 않습니다. Slack 스레드 내부에 이미 게시된 메시지는 계속 `:thread:<threadTs>` 세션으로 라우팅됩니다. 이는 `"off"` 모드에서도 명시적 태그가 계속 적용되는 Telegram과 다릅니다. Slack 스레드는 채널에서 메시지를 숨기지만 Telegram 답장은 인라인으로 계속 표시됩니다.
</Note>

## 확인 반응

`ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인 이모지를 전송합니다. `ackReactionScope`은 해당 이모지가 실제로 전송되는 _시점_을 결정합니다.

기본적으로 Slack의 네이티브 어시스턴트 스레드 상태가 순환하는 로딩 메시지로 진행 상황을 표시하는 동안 확인 반응은 정적으로 유지됩니다. 대신 대기/사고/도구/완료/오류 반응 수명 주기를 사용하려면 `messages.statusReactions.enabled: true`을 설정하십시오.

### 이모지(`ackReaction`)

확인 순서:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 에이전트 ID 이모지 대체 설정(`agents.list[].identity.emoji`, 없으면 `"eyes"` / 👀)

참고:

- Slack은 쇼트코드를 사용해야 합니다(예: `"eyes"`).
- Slack 계정 또는 전역에서 반응을 비활성화하려면 `""`을 사용하십시오.

### 범위(`messages.ackReactionScope`)

Slack 제공자는 `messages.ackReactionScope`(기본값 `"group-mentions"`)에서 범위를 읽습니다. 현재 Slack 계정 또는 Slack 채널 수준의 재정의는 없으며 이 값은 Gateway 전체에 적용됩니다.

값:

- `"all"`: 주변 대화방 이벤트를 포함하여 DM과 그룹에서 반응합니다.
- `"direct"`: DM에서만 반응합니다.
- `"group-all"`: 주변 대화방 이벤트를 제외한 모든 그룹 메시지에 반응합니다(DM 제외).
- `"group-mentions"`(기본값): 그룹에서 반응하되 봇이 멘션된 경우(또는 옵트인한 그룹 멘션 가능 항목에 포함된 경우)에만 반응합니다. **DM은 제외됩니다.**
- `"off"` / `"none"`: 반응하지 않습니다.

<Note>
기본 범위(`"group-mentions"`)에서는 직접 메시지나 주변 대화방 이벤트에 확인 반응이 실행되지 않습니다. 인바운드 Slack DM 및 조용한 대화방 이벤트에서 구성된 `ackReaction`(예: `"eyes"`)을 표시하려면 `messages.ackReactionScope`을 `"all"`로 설정하십시오. `messages.ackReactionScope`은 Slack 제공자 시작 시 읽히므로 변경 사항을 적용하려면 Gateway를 다시 시작해야 합니다.
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

`channels.slack.streaming`은 실시간 미리 보기 동작을 제어합니다.

- `off`: 실시간 미리 보기 스트리밍을 비활성화합니다.
- `partial`(기본값): 미리 보기 텍스트를 최신 부분 출력으로 교체합니다.
- `block`: 청크 단위 미리 보기 업데이트를 추가합니다.
- `progress`: 생성 중에 진행 상태 텍스트를 표시한 후 최종 텍스트를 전송합니다.
- `streaming.preview.toolProgress`: 초안 미리 보기가 활성화된 경우 도구/진행 상황 업데이트를 동일하게 편집되는 미리 보기 메시지로 라우팅합니다(기본값: `true`). 도구/진행 상황 메시지를 별도로 유지하려면 `false`를 설정하십시오.
- `streaming.preview.commandText` / `streaming.progress.commandText`: 원시 명령/실행 텍스트를 숨기면서 간결한 도구 진행 상황 줄은 유지하려면 `status`로 설정하십시오(기본값: `raw`).

간결한 진행 상황 줄을 유지하면서 원시 명령/실행 텍스트를 숨기려면 다음과 같이 설정하십시오.

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

`channels.slack.streaming.nativeTransport`은 `channels.slack.streaming.mode`이 `partial`인 경우 Slack 네이티브 텍스트 스트리밍을 제어합니다(기본값: `true`).

Slack 네이티브 진행 상황 작업 카드는 진행 모드에서 선택적으로 사용합니다. 작업이 실행되는 동안 Slack 네이티브 계획/작업 카드를 전송하고 완료 시 동일한 작업 카드를 업데이트하려면 `channels.slack.streaming.progress.nativeTaskCards`을 `true`로 설정하고 `channels.slack.streaming.mode="progress"`를 함께 사용하십시오. 이 플래그가 없으면 진행 모드는 이식 가능한 초안 미리 보기 동작을 유지합니다.

- 네이티브 텍스트 스트리밍과 Slack 어시스턴트 스레드 상태를 표시하려면 답장 스레드를 사용할 수 있어야 합니다. 스레드 선택에는 계속 `replyToMode`이 적용됩니다.
- 네이티브 스트리밍을 사용할 수 없거나 답장 스레드가 없는 경우에도 채널, 그룹 채팅 및 최상위 DM 루트는 일반 초안 미리 보기를 사용할 수 있습니다.
- 최상위 Slack DM은 기본적으로 스레드를 사용하지 않으므로 Slack의 스레드 형태 네이티브 스트림/상태 미리 보기를 표시하지 않습니다. 대신 OpenClaw가 DM에 초안 미리 보기를 게시하고 편집합니다.
- 미디어 및 텍스트가 아닌 페이로드는 일반 전송으로 대체됩니다.
- 미디어/오류 최종 결과는 보류 중인 미리 보기 편집을 취소합니다. 적합한 텍스트/블록 최종 결과는 미리 보기를 그 자리에서 편집할 수 있는 경우에만 플러시됩니다.
- 답장 도중 스트리밍이 실패하면 OpenClaw는 남은 페이로드를 일반 전송으로 대체합니다.

Slack 네이티브 텍스트 스트리밍 대신 초안 미리 보기를 사용하려면 다음과 같이 설정하십시오.

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

Slack 네이티브 진행 상황 작업 카드를 사용하려면 다음과 같이 설정하십시오.

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

- `channels.slack.streamMode`(`replace | status_final | append`)은 `channels.slack.streaming.mode`의 레거시 별칭입니다.
- 불리언 `channels.slack.streaming`은 `channels.slack.streaming.mode` 및 `channels.slack.streaming.nativeTransport`의 레거시 별칭입니다.
- 최상위 `channels.slack.chunkMode` 및 `channels.slack.nativeStreaming`는 `channels.slack.streaming.chunkMode` 및 `channels.slack.streaming.nativeTransport`의 레거시 별칭입니다.
- 레거시 별칭은 런타임에서 읽히지 않습니다. 영구 저장된 Slack 스트리밍 구성을 표준 키로 다시 작성하려면 `openclaw doctor --fix`을 실행하십시오.

## 입력 중 반응 대체 설정

`typingReaction`은 OpenClaw가 답장을 처리하는 동안 인바운드 Slack 메시지에 임시 반응을 추가하고 실행이 끝나면 이를 제거합니다. 기본 "입력 중..." 상태 표시기를 사용하는 스레드 답장 외부에서 가장 유용합니다.

확인 순서:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

참고:

- Slack은 쇼트코드를 사용해야 합니다(예: `"hourglass_flowing_sand"`).
- 반응은 최선형으로 처리되며 답장 또는 실패 경로가 완료된 후 자동으로 정리를 시도합니다.

## 음성 입력

현재 Slack에서 OpenClaw에 음성으로 말하려면 OpenClaw 앱에 Slack 오디오 클립을 전송하십시오. Slackbot의 받아쓰기 마이크는 별도의 Slack 소유 기능이며 앱 API가 아닙니다.

- **[Slackbot 음성 받아쓰기](https://slack.com/help/articles/202026038-How-to-use-Slackbot)**는 사용자의 비공개 Slackbot 대화 내에서 작동합니다. Slack은 녹음을 Slackbot 프롬프트로 변환하지만 Events API를 통해 서드 파티 Slack 앱에 오디오 파일, 받아쓰기 이벤트, 프롬프트 또는 입력 소스 마커를 내보내지 않습니다. OpenClaw Slack plugin은 이를 활성화하거나 수신할 수 없습니다.
- **[Slack 오디오 클립](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)**은 OpenClaw DM, 채널 또는 스레드에 게시할 수 있는 Slack 저장 파일입니다. OpenClaw는 봇 토큰을 사용하여 접근 가능한 클립을 다운로드하고, Slack의 클립 MIME 메타데이터를 정규화한 다음, 공유 [오디오 전사 파이프라인](/ko/nodes/audio)을 통해 전송합니다. 권장 앱 매니페스트에는 필수 `files:read` 범위가 포함됩니다.

오디오 클립과 Slackbot 받아쓰기는 개인정보 보호 의미가 다릅니다. 클립은 Slack 파일 보존 정책을 따르며 OpenClaw가 전사를 위해 다운로드하는 반면, Slack에 따르면 받아쓰기 오디오는 저장되지 않습니다.

`requireMention: true`이 있는 채널에서는 캡션이 없는 오디오 클립에서 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 없으면 `messages.groupChat.mentionPatterns` 사용)을 말하여 게이트 조건을 충족할 수 있습니다. OpenClaw는 클립을 다운로드하거나 전사하기 전에 발신자를 승인한 다음, 전사문이 일치하는 경우에만 이를 허용합니다. 실패했거나 일치하지 않는 추측성 전사문은 다운로드한 클립과 함께 폐기되며 채널 기록에 보존되지 않습니다. 음성으로는 기본 Slack `@bot` ID를 추론할 수 없으므로, 음성 이름 패턴을 구성하거나 입력한 멘션을 포함하십시오. 전사문 에코가 활성화된 경우 에코는 허용된 후에만 전송됩니다.

## 미디어, 청킹 및 전달

<AccordionGroup>
  <Accordion title="수신 첨부 파일">
    Slack 파일 첨부는 Slack에서 호스팅하는 비공개 URL에서 다운로드되며(토큰 인증 요청 흐름), 가져오기에 성공하고 크기 제한이 허용하는 경우 미디어 저장소에 기록됩니다. 파일 자리표시자에는 에이전트가 `download-file`을 사용하여 원본 파일을 가져올 수 있도록 Slack `fileId`이 포함됩니다.

    다운로드에는 제한된 유휴 시간 제한과 전체 시간 제한이 적용됩니다. Slack 파일 검색이 중단되거나 실패하면 OpenClaw는 메시지 처리를 계속하고 파일 자리표시자로 대체합니다.

    런타임 수신 크기 상한은 `channels.slack.mediaMaxMb`으로 재정의하지 않는 한 기본값이 `20MB`입니다.

  </Accordion>

  <Accordion title="발신 텍스트 및 파일">
    - 텍스트 청크는 `channels.slack.textChunkLimit`을 사용합니다(기본값 `8000`, Slack 자체 메시지 길이 제한을 상한으로 적용)
    - `channels.slack.streaming.chunkMode="newline"`은 문단 우선 분할을 활성화합니다
    - 파일 전송은 Slack 업로드 API를 사용하며 스레드 답글(`thread_ts`)을 포함할 수 있습니다
    - 긴 파일 캡션은 Slack에서 안전한 첫 번째 텍스트 청크를 업로드 댓글로 사용하고 나머지 청크를 후속 메시지로 전송합니다
    - 발신 미디어 상한은 구성된 경우 `channels.slack.mediaMaxMb`을 따르며, 그렇지 않으면 채널 전송은 미디어 파이프라인의 MIME 종류별 기본값을 사용합니다

  </Accordion>

  <Accordion title="전달 대상">
    권장되는 명시적 대상:

    - DM에는 `user:<id>`
    - 채널에는 `channel:<id>`

    텍스트/블록 전용 Slack DM은 사용자 ID에 직접 게시할 수 있습니다. 파일 업로드 및 스레드 전송 경로에는 구체적인 대화 ID가 필요하므로 먼저 Slack 대화 API를 통해 DM을 엽니다.

  </Accordion>
</AccordionGroup>

## 명령 및 슬래시 동작

슬래시 명령은 Slack에서 구성된 단일 명령 또는 여러 기본 명령으로 표시됩니다. 명령 기본값을 변경하려면 `channels.slack.slashCommand`을 구성하십시오.

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

기본 명령을 사용하려면 Slack 앱에 [추가 매니페스트 설정](#additional-manifest-settings)이 필요하며, 대신 전역 구성에서 `channels.slack.commands.native: true` 또는 `commands.native: true`을 사용하여 활성화합니다.

- Slack에서는 기본 명령 자동 모드가 **꺼져** 있으므로 `commands.native: "auto"`은 Slack 기본 명령을 활성화하지 않습니다.

```txt
/help
```

기본 인수 메뉴는 다음 우선순위에 따라 렌더링됩니다.

- 충분히 짧은 옵션 3~5개: 오버플로("...") 메뉴
- 옵션이 100개를 초과하고 비동기 옵션 필터링을 사용할 수 있음: 외부 선택
- 옵션 1~2개 또는 인코딩된 값이 선택 항목에 사용하기에 너무 긴 옵션: 버튼 블록
- 그 외(옵션 6~100개 또는 비동기 필터링 없이 100개 초과): 메뉴당 옵션 100개로 청킹된 정적 선택 메뉴

```txt
/think
```

슬래시 세션은 `agent:<agentId>:slack:slash:<userId>`과 같은 격리된 키를 사용하며, 여전히 `CommandTargetSessionKey`을 사용하여 명령 실행을 대상 대화 세션으로 라우팅합니다.

## 기본 차트

Slack의 공개 [`data_visualization` Block Kit 블록](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)은
메시지에서 선, 막대, 영역 및 원형 차트를 렌더링합니다. OpenClaw는 이식 가능한
`presentation` `chart` 블록을 해당 기본 형식으로 매핑합니다. 일반적인
`chat:write` 메시지 접근 권한 외에는 추가 OAuth 범위, 파일 업로드,
이미지 렌더러 또는 Slack 구성이 필요하지 않습니다.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "분기별 매출",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "매출", "values": [120, 145] }],
      "xLabel": "분기"
    }
  ]
}
```

기본 렌더링 전에 Slack의 제한이 적용됩니다.

- 제목 및 선택적 축 레이블: 50자
- 원형: 양수 세그먼트 1~12개
- 선/막대/영역: 고유한 이름의 계열 1~12개 및 공유 범주 1~20개
- 세그먼트, 범주 및 계열 레이블: 20자
- 모든 계열에는 각 범주마다 하나의 유한 값이 포함되어야 하며, 원형 이외의 값은
  음수일 수 있습니다

또한 모든 기본 차트에는 화면 읽기 프로그램, 알림, 세션 미러링 및 블록을
렌더링할 수 없는 클라이언트를 위한 최상위 텍스트 표현이 포함됩니다. 다른
OpenClaw 채널로 전송되는 표준 프레젠테이션은 기본 차트 지원을 알리지 않는 한
동일한 결정적 차트 데이터를 텍스트로 수신합니다. 단계적 출시 중 Slack이
`invalid_blocks`과 함께 차트를 거부하면 OpenClaw는 거부된 기본 데이터 블록을
제거하고, 형제 컨트롤은 유지하며, 전체 차트 표현을 표시되는 텍스트로 전송합니다.

Slack은 현재 메시지당 최대 2개의 `data_visualization` 블록을 허용합니다.
프레젠테이션에 유효한 차트가 2개를 초과하면 OpenClaw는 순서를 유지하고
후속 메시지에서 메시지당 차트가 2개를 넘지 않도록 기본 렌더링을 계속합니다.

Slack의 [개발자 출시 문서](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)에서는
이 블록을 앱 대상 Block Kit 기능으로 설명하며 유료 요금제 제한은 게시하지
않습니다. Business+/Enterprise 자격 요건 문구는 Slackbot의 자동 AI 차트 생성에
적용되며, 이는 앱이 이미 구조화된 Block Kit 차트를 전송하는 것과 별개입니다.
차트는 메시지 전용 블록이며 App Home, 모달 또는 Canvas 콘텐츠가 아닙니다.

## 기본 표

Slack의 현재 [`data_table` Block Kit 블록](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)은
메시지에서 구조화된 행과 열을 렌더링합니다. OpenClaw는 명시적인 이식 가능
`presentation` `table` 블록을 `data_table`에 매핑하며, Slack의
레거시 [`table` 블록](https://docs.slack.dev/reference/block-kit/blocks/table-block/)은 사용하지 않습니다.
일반적인 `chat:write` 메시지 접근 권한 외에는 추가 OAuth 범위나 Slack 구성이
필요하지 않습니다.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "진행 중인 파이프라인",
      "headers": ["계정", "단계", "ARR"],
      "rows": [
        ["Acme", "성사", 125000],
        ["Globex", "검토", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw는 헤더 및 문자열 셀을 Slack `raw_text` 셀에 매핑합니다. 숫자 셀은
`raw_number`에 매핑되며, 기본 정렬 및 필터링을 위해 유한 숫자 값이 보존됩니다.
`rowHeaderColumnIndex`이 있는 경우 해당 0부터 시작하는 열을 Slack 행 헤더로
표시합니다.

Slack에 게시된 `data_table` 제한은 기본 렌더링 전에 적용됩니다.

- 열 1~20개
- 데이터 행 1~100개 및 헤더 행
- 모든 행의 셀 수가 동일해야 함
- 한 메시지의 모든 표 셀에 걸쳐 총 문자 수 최대 10,000자

메시지가 총 문자 제한 내에 있는 동안 여러 유효한 표 블록을 기본 형식으로
렌더링할 수 있습니다. 기본 범위 내에서 렌더링할 수 없는 표는 행이나 셀을
손실하지 않고 완전한 결정적 텍스트가 됩니다. 해당 텍스트가 Slack 메시지 하나를
초과하면 전송 및 슬래시 응답은 순서가 지정된 텍스트 청크를 사용합니다. 표 편집은
기존 메시지에서 행을 조용히 잘라내는 대신 명시적인 크기 오류와 함께 실패합니다.

이식 가능한 프레젠테이션에서 생성된 모든 기본 표에는 화면 읽기 프로그램, 알림,
세션 미러링 및 블록을 렌더링할 수 없는 클라이언트를 위한 최상위 텍스트 표현도
포함됩니다. 원시 차트 및 표 값은 대체 표현에서 리터럴로 유지되므로
`<@U123>`과 같은 셀 데이터가 Slack 멘션으로 바뀌지 않습니다.
Slack이 `invalid_blocks`과 함께 기본 차트 또는 표 블록을 거부하면 OpenClaw는
하나의 제한된 복구 단계에서 모든 기본 데이터 블록을 제거하고, 버튼 및 선택
항목과 같은 유효한 형제 블록을 유지하며, Slack 서식을 비활성화한 상태로 완전하게
표시되는 차트 및 표 텍스트를 전송합니다. 슬래시 명령 전달은 명령 전체에서 Slack의
5회 호출 `response_url` 예산을 추적합니다. 각 응답 배치 전에 남은 호출 수에
맞는 완전한 계획을 선택하거나 해당 배치를 게시하기 전에 실패합니다.

명시적인 `presentation` 표 블록만 기본 표로 승격됩니다.
Markdown 파이프 표는 작성된 텍스트로 유지되며, OpenClaw는 표 구조나 셀 유형을
추측하지 않습니다. 기존의 신뢰할 수 있는 Slack 기본 형식 생성자는
`channelData.slack.blocks`을 통해 원시 블록을 계속 전달할 수 있습니다. OpenClaw는 유효한
원시 `data_table` 셀에서 대체 텍스트를 파생하지만, 잘못된 사용자 지정 블록은
캡션 또는 일반 Block Kit 대체 표현으로 저하될 수 있습니다. 이식 가능한 에이전트,
CLI 및 plugin 출력은 `presentation`을 사용해야 합니다.

## 대화형 답글

Slack은 에이전트가 작성한 대화형 답글 컨트롤을 렌더링할 수 있지만, 이 기능은 기본적으로 비활성화되어 있습니다.
새 에이전트, CLI 및 plugin 출력에는 공유
`presentation` 버튼 또는 선택 블록을 사용하는 것이 좋습니다. 이러한 블록은
동일한 Slack 상호작용 경로를 사용하면서 다른 채널에서도 대체 형식으로 표시됩니다.

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

또는 하나의 Slack 계정에만 활성화합니다.

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

활성화하면 에이전트는 여전히 사용 중단된 Slack 전용 답글 지시문을 내보낼 수 있습니다.

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

이러한 지시문은 Slack Block Kit로 컴파일되며 클릭 또는 선택을 기존 Slack
상호작용 이벤트 경로로 다시 라우팅합니다. 이전 프롬프트 및 Slack 전용 우회
수단을 위해 유지하되, 새로운 이식 가능한 컨트롤에는 공유 프레젠테이션을 사용하십시오.

지시문 컴파일러 API도 새로운 생성자 코드에는 사용이 중단되었습니다.

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Slack에서 렌더링되는 새 컨트롤에는 `presentation` 페이로드와
`buildSlackPresentationBlocks(...)`을 사용하십시오.

참고:

- 이는 Slack 전용 레거시 UI입니다. 다른 채널은 Slack Block
  Kit 지시문을 자체 버튼 시스템으로 변환하지 않습니다.
- 대화형 콜백 값은 에이전트가 작성한 원시 값이 아니라 OpenClaw가 생성한 불투명 토큰입니다.
- 생성된 대화형 블록이 Slack Block Kit 제한을 초과할 경우, OpenClaw는 유효하지 않은 블록 페이로드를 보내는 대신 원래 텍스트 응답으로 대체합니다.

### Plugin 소유 모달 제출

대화형 핸들러를 등록하는 Slack Plugin은 OpenClaw가
에이전트에 표시되는 시스템 이벤트용으로 페이로드를 압축하기 전에 모달
`view_submission` 및 `view_closed` 수명 주기 이벤트도 수신할 수 있습니다. Slack 모달을 열 때는 다음 라우팅
패턴 중 하나를 사용하십시오.

- `callback_id`을 `openclaw:<namespace>:<payload>`로 설정하십시오.
- 또는 기존 `callback_id`을 유지하고 모달 `private_metadata`에 `pluginInteractiveData:
"<namespace>:<payload>"`을 넣으십시오.

핸들러는 `ctx.interaction.kind`을 `view_submission` 또는
`view_closed`으로 받고, 정규화된 `inputs`과 Slack의 전체 원시 `stateValues` 객체를
받습니다. 콜백 ID 전용 라우팅만으로도 Plugin 핸들러를 호출할 수 있습니다. 모달이
에이전트에 표시되는 시스템 이벤트도 생성해야 한다면 기존 모달의 `private_metadata`
사용자/세션 라우팅 필드를 포함하십시오. 에이전트는 압축되고 민감 정보가 제거된
`Slack interaction: ...` 시스템 이벤트를 수신합니다. 핸들러가
`systemEvent.summary`, `systemEvent.reference` 또는 `systemEvent.data`을 반환하면,
해당 필드가 압축 이벤트에 포함되므로 에이전트는 전체 양식 페이로드를 보지 않고도
Plugin 소유 저장소를 참조할 수 있습니다.

## Slack의 네이티브 승인

Slack은 Web UI 또는 터미널로 대체하지 않고 대화형 버튼과 상호작용을 사용하는 네이티브 승인 클라이언트 역할을 할 수 있습니다.

- 실행 및 Plugin 승인은 Slack 네이티브 Block Kit 프롬프트로 렌더링될 수 있습니다.
- `channels.slack.execApprovals.*`은 네이티브 실행 승인 클라이언트 활성화 및 DM/채널 라우팅 구성으로 유지됩니다.
- 실행 승인 DM은 `channels.slack.execApprovals.approvers` 또는 `commands.ownerAllowFrom`을 사용합니다.
- Slack이 시작 세션의 네이티브 승인 클라이언트로 활성화되어 있거나 `approvals.plugin`이 시작 Slack 세션 또는 Slack 대상으로 라우팅되는 경우, Plugin 승인은 Slack 네이티브 버튼을 사용합니다.
- Plugin 승인 DM은 `channels.slack.allowFrom`의 Slack Plugin 승인자, 명명된 계정의 `allowFrom` 또는 계정 기본 경로를 사용합니다.
- 승인자 권한 부여는 계속 적용됩니다. 실행 전용 승인자는 Plugin 승인자이기도 하지 않은 한 Plugin 요청을 승인할 수 없습니다.

이는 다른 채널과 동일한 공유 승인 버튼 표면을 사용합니다. Slack 앱 설정에서 `interactivity`이 활성화되면 승인 프롬프트가 대화에 직접 Block Kit 버튼으로 렌더링됩니다.
이러한 버튼이 있으면 해당 버튼이 기본 승인 UX입니다. OpenClaw는 도구 결과에서 채팅
승인을 사용할 수 없다고 표시하거나 수동 승인이 유일한 경로인 경우에만 수동 `/approve`
명령을 포함해야 합니다.

구성 경로:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (선택 사항. 가능한 경우 `commands.ownerAllowFrom`으로 대체됨)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `agentFilter`, `sessionFilter`

`enabled`이 설정되지 않았거나 `"auto"`이고 하나 이상의
실행 승인자가 확인되면 Slack은 네이티브 실행 승인을 자동으로 활성화합니다. Slack Plugin 승인자가 확인되고 요청이 네이티브 클라이언트 필터와 일치하면 Slack은 이 네이티브 클라이언트
경로를 통해 네이티브 Plugin 승인도 처리할 수 있습니다. Slack을 네이티브 승인 클라이언트로 명시적으로 비활성화하려면
`enabled: false`을 설정하십시오. 승인자가 확인될 때 네이티브 승인을 강제로 활성화하려면 `enabled: true`을
설정하십시오. Slack 실행 승인을 비활성화해도 `approvals.plugin`을 통해 활성화된
네이티브 Slack Plugin 승인 전송은 비활성화되지 않습니다. Plugin 승인
전송은 대신 Slack Plugin 승인자를 사용합니다.

명시적인 Slack 실행 승인 구성이 없을 때의 기본 동작:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

승인자를 재정의하거나 필터를 추가하거나 시작 채팅 전송을 사용하려는 경우에만 명시적인 Slack 네이티브 구성이 필요합니다.

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

공유 `approvals.exec` 전달은 별도입니다. 실행 승인 프롬프트를 다른 채팅이나 명시적인 대역 외 대상으로도
라우팅해야 하는 경우에만 사용하십시오. 공유 `approvals.plugin` 전달도
별도입니다. Slack이 Plugin 승인 요청을 네이티브로 처리할 수 있는 경우에만 Slack 네이티브 전송이 해당 대체 경로를
억제합니다.

동일 채팅 `/approve`은 이미 명령을 지원하는 Slack 채널 및 DM에서도 작동합니다. 전체 승인 전달 모델은 [실행 승인](/ko/tools/exec-approvals)을 참조하십시오.

## 이벤트 및 운영 동작

- 메시지 편집/삭제는 시스템 이벤트로 매핑됩니다.
- 스레드 브로드캐스트("Also send to channel" 스레드 답글)는 일반 사용자 메시지로 처리됩니다.
- 반응 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- 멤버 참여/퇴장, 채널 생성/이름 변경 및 고정 추가/제거 이벤트는 시스템 이벤트로 매핑됩니다.
- 선택적 현재 상태 폴링은 관찰된 인간 참여자의 `away`에서 `active`으로의 전환을 해당 참여자의 가장 최근 활성 상태인 적격 Slack 세션에 매핑할 수 있습니다. 기본값은 꺼짐입니다.
- `configWrites`이 활성화되면 `channel_id_changed`이 채널 구성 키를 마이그레이션할 수 있습니다.
- 채널 주제/용도 메타데이터는 신뢰할 수 없는 컨텍스트로 취급되며 라우팅 컨텍스트에 삽입될 수 있습니다.
- 스레드 시작 메시지 및 초기 스레드 기록 컨텍스트 시드는 해당하는 경우 구성된 발신자 허용 목록에 따라 필터링됩니다.
- 블록 작업, 바로 가기 및 모달 상호작용은 풍부한 페이로드 필드가 포함된 구조화된 `Slack interaction: ...` 시스템 이벤트를 내보냅니다.
  - 블록 작업: 선택된 값, 레이블, 선택기 값 및 `workflow_*` 메타데이터
  - 전역 바로 가기: 콜백 및 행위자 메타데이터, 행위자의 직접 세션으로 라우팅됨
  - 메시지 바로 가기: 콜백, 행위자, 채널, 스레드 및 선택된 메시지 컨텍스트
  - 라우팅된 채널 메타데이터 및 양식 입력이 포함된 모달 `view_submission` 및 `view_closed` 이벤트

Slack 앱 구성에서 전역 또는 메시지 바로 가기를 정의하고 비어 있지 않은 콜백 ID를 사용하십시오. OpenClaw는 일치하는 바로 가기 페이로드를 확인하고 다른 Slack 상호작용과 동일한 DM/채널 발신자 정책을 적용한 후, 정제된 이벤트를 라우팅된 에이전트 세션의 대기열에 추가합니다. 트리거 ID와 응답 URL은 에이전트 컨텍스트에서 제거됩니다.

### 현재 상태 이벤트

Slack은 Events API 또는 Socket Mode를 통해 현재 상태 변경을 보내지 않습니다. 대신 OpenClaw는 메시지가 일반적인 Slack 액세스 및 라우팅 검사를 통과한 인간 참여자를 대상으로 [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/)을 폴링할 수 있습니다.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (기본값): 현재 상태 타이머 또는 Slack API 호출이 없습니다.
- `auto`: 최근 24시간 동안 활성 상태였으며 관찰된 인간 참여자가 최대 8명인 DM, MPIM 및 Slack 스레드를 모니터링합니다. 최상위 채널 세션은 제외됩니다.
- `on`: 참여자 제한 없이 동일한 대화를 모니터링하며 최상위 채널 세션을 포함합니다. 채널별 재정의를 사용하여 특정 채널을 강제로 포함하거나 제외하십시오.

OpenClaw는 Slack 계정당 분당 최대 45명의 고유 사용자를 폴링하고, 에이전트를 깨우지 않고 첫 번째 결과를 시드하며, 관찰된 `away`에서 `active`으로의 전환에서만 에이전트를 깨웁니다. 해당 사용자가 여러 스레드에 참여하더라도 Slack 계정 및 사용자별로 지속되는 8시간 쿨다운이 적용됩니다. 이벤트는 해당 사용자의 가장 최근 활성 상태인 적격 대화로만 라우팅되며, 에이전트가 짧은 인사말 하나를 보낼지 결정하기 전에 메모리/위키 및 알려진 시간대 컨텍스트를 참조하도록 안내합니다. 에이전트는 응답하지 않을 수 있습니다.

봇 토큰에는 권장 매니페스트에 이미 포함된 `users:read`이 필요합니다. 현재 상태 이벤트는 Enterprise Grid 조직 전체 설치에서 사용할 수 없습니다.

## 구성 참조

기본 참조: [구성 참조 - Slack](/ko/gateway/config-channels#slack).

<Accordion title="주요 Slack 필드">

- 모드/인증: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 액세스: `dm.enabled`, `dmPolicy`, `allowFrom` (레거시: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 호환성 토글: `dangerouslyAllowNameMatching` (비상용. 필요한 경우가 아니면 꺼 두십시오)
- 채널 액세스: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 스레드/기록: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 현재 상태 깨우기: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; 기본값 `off`)
- 전송: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 미리보기 펼치기: `unfurlLinks` (기본값: `false`), `chat.postMessage` 링크/미디어 미리보기 제어용 `unfurlMedia`. 링크 미리보기를 다시 사용하려면 `unfurlLinks: true`을 설정하십시오.
- 운영/기능: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에서 응답 없음">
    다음 순서로 확인하십시오.

    - `groupPolicy`
    - 채널 허용 목록(`channels.slack.channels`) — **키는 이름(`#channel-name`)이 아니라 채널 ID(`C12345678`)여야 합니다**. 채널 라우팅은 기본적으로 ID 우선이므로 이름 기반 키는 `groupPolicy: "allowlist"`에서 아무 알림 없이 실패합니다. ID를 찾으려면 Slack에서 채널을 마우스 오른쪽 버튼으로 클릭하고 → **Copy link**를 선택하십시오. URL 끝의 `C...` 값이 채널 ID입니다.
    - `requireMention`
    - 채널별 `users` 허용 목록
    - `messages.groupChat.visibleReplies`: 일반 그룹/채널 요청의 기본값은 `"automatic"`입니다. `"message_tool"`을 사용하도록 설정했으며 로그에 `message(action=send)` 호출 없이 어시스턴트 텍스트가 표시되는 경우 모델이 표시되는 메시지 도구 경로를 놓친 것입니다. 이 모드에서는 최종 텍스트가 비공개로 유지됩니다. 억제된 페이로드 메타데이터를 확인하려면 Gateway 상세 로그를 검사하거나, 모든 일반 어시스턴트 최종 응답을 레거시 경로를 통해 게시하려면 이를 `"automatic"`으로 설정하십시오.
    - `messages.groupChat.unmentionedInbound`: 값이 `"room_event"`이면 멘션되지 않은 허용된 채널 대화는 주변 컨텍스트이며 에이전트가 `message` 도구를 호출하지 않는 한 응답하지 않습니다. [주변 방 이벤트](/ko/channels/ambient-room-events)를 참조하십시오.

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
    다음을 확인하십시오:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (또는 레거시 `channels.slack.dm.policy`)
    - 페어링 승인 / 허용 목록 항목 (`dmPolicy: "open"`에는 여전히 `channels.slack.allowFrom: ["*"]`이 필요합니다)
    - 그룹 DM은 MPIM 처리를 사용합니다. `channels.slack.dm.groupEnabled`을 활성화하고, 구성된 경우 MPIM을 `channels.slack.dm.groupChannels`에 포함하십시오
    - Slack Assistant DM 이벤트: `drop message_changed`을 언급하는 상세 로그는
      일반적으로 Slack이 메시지 메타데이터에서 복구 가능한 사람 발신자가 없는
      편집된 Assistant 스레드 이벤트를 보냈음을 의미합니다

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 모드가 연결되지 않음">
    Slack 앱 설정에서 봇 및 앱 토큰과 Socket Mode 활성화 여부를 확인하십시오.
    App-Level Token에는 `connections:write`이 필요하며, Bot User OAuth Token
    봇 토큰은 앱 토큰과 동일한 Slack 앱/워크스페이스에 속해야 합니다.

    `openclaw channels status --probe --json`에 `botTokenStatus` 또는
    `appTokenStatus: "configured_unavailable"`이 표시되면 Slack 계정은
    구성되었지만 현재 런타임에서 SecretRef 기반 값을 확인할 수 없는 상태입니다.

    `slack socket mode failed to start; retry ...`과 같은 로그는 복구 가능한
    시작 실패입니다. 반면 범위 누락, 취소된 토큰, 잘못된 인증은 즉시 실패합니다.
    `slack token mismatch ...` 로그는 봇 토큰과 앱 토큰이 서로 다른 Slack 앱에
    속한 것으로 보인다는 의미입니다. Slack 앱 자격 증명을 수정하십시오.

  </Accordion>

  <Accordion title="HTTP 모드가 이벤트를 수신하지 않음">
    다음을 확인하십시오.

    - 서명 비밀
    - Webhook 경로
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - HTTP 계정별 고유한 `webhookPath`
    - 공개 URL에서 TLS를 종료하고 요청을 Gateway 경로로 전달하는지 여부
    - Slack 앱의 `request_url` 경로가 `channels.slack.webhookPath`과 정확히 일치하는지 여부(기본값 `/slack/events`)

    계정 스냅샷에 `signingSecretStatus: "configured_unavailable"`이 표시되면
    HTTP 계정은 구성되었지만 현재 런타임에서 SecretRef 기반
    서명 비밀을 확인할 수 없는 상태입니다.

    `slack: webhook path ... already registered` 로그가 반복되면 두 HTTP
    계정에서 동일한 `webhookPath`을 사용하고 있다는 의미입니다. 각 계정에 고유한 경로를 지정하십시오.

  </Accordion>

  <Accordion title="네이티브/슬래시 명령이 실행되지 않음">
    의도한 모드가 다음 중 무엇인지 확인하십시오.

    - Slack에 등록된 일치하는 슬래시 명령을 사용하는 네이티브 명령 모드(`channels.slack.commands.native: true`)
    - 또는 단일 슬래시 명령 모드(`channels.slack.slashCommand.enabled: true`)

    Slack은 슬래시 명령을 자동으로 생성하거나 제거하지 않습니다. `commands.native: "auto"`은 Slack 네이티브 명령을 활성화하지 않습니다. `true`을 사용하고 Slack 앱에서 일치하는 명령을 생성하십시오. HTTP 모드에서는 모든 Slack 슬래시 명령에 Gateway URL이 포함되어야 합니다. Socket Mode에서는 명령 페이로드가 웹소켓을 통해 도착하며 Slack은 `slash_commands[].url`을 무시합니다.

    또한 `commands.useAccessGroups`, DM 권한 부여, 채널 허용 목록,
    채널별 `users` 허용 목록을 확인하십시오. Slack은 차단된
    슬래시 명령 발신자에게 다음을 포함한 임시 오류를 반환합니다.

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 첨부 미디어 참조

Slack 파일 다운로드에 성공하고 크기 제한을 충족하면 Slack에서 다운로드한 미디어를 에이전트 턴에 첨부할 수 있습니다. 오디오 클립은 텍스트로 변환할 수 있고, 이미지 파일은 미디어 이해 경로를 거치거나 비전 기능을 지원하는 응답 모델로 직접 전달할 수 있으며, 그 외 파일은 다운로드 가능한 파일 컨텍스트로 유지됩니다.

### 지원되는 미디어 유형

| 미디어 유형                    | 소스                 | 현재 동작                                                                         | 참고                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 오디오 클립              | Slack 파일 URL       | 다운로드되어 공유 오디오 텍스트 변환을 통해 라우팅됩니다                         | `files:read` 및 작동하는 `tools.media.audio` 모델 또는 CLI가 필요합니다 |
| JPEG / PNG / GIF / WebP 이미지 | Slack 파일 URL       | 다운로드되어 비전 기능 처리용으로 턴에 첨부됩니다                                | 파일별 한도: `channels.slack.mediaMaxMb` (기본값 20 MB)                            |
| PDF 파일                       | Slack 파일 URL       | 다운로드되어 `download-file` 또는 `pdf` 같은 도구에서 파일 컨텍스트로 제공됩니다 | Slack 인바운드는 PDF를 이미지 비전 입력으로 자동 변환하지 않습니다       |
| 기타 파일                      | Slack 파일 URL       | 가능한 경우 다운로드되어 파일 컨텍스트로 제공됩니다                             | 바이너리 파일은 이미지 입력으로 처리되지 않습니다                        |
| 스레드 답글                    | 스레드 시작 메시지의 파일 | 답글에 직접 첨부된 미디어가 없으면 루트 메시지의 파일을 컨텍스트로 불러올 수 있습니다 | 파일만 있는 시작 메시지에는 첨부 파일 자리표시자를 사용합니다            |
| 여러 파일이 포함된 메시지      | 여러 Slack 파일      | 각 파일을 개별적으로 평가합니다                                                   | Slack 처리는 메시지당 8개 파일로 제한됩니다                              |

### 인바운드 파이프라인

파일이 첨부된 Slack 메시지가 도착하면 다음과 같이 처리됩니다.

1. OpenClaw는 봇 토큰을 사용하여 Slack의 비공개 URL에서 파일을 다운로드합니다.
2. 성공하면 파일을 미디어 저장소에 기록합니다.
3. 다운로드한 미디어 경로와 콘텐츠 유형을 인바운드 컨텍스트에 추가합니다.
4. 오디오 클립은 공유 텍스트 변환 파이프라인으로 라우팅됩니다. 이미지 기능을 지원하는 모델/도구 경로는 동일한 컨텍스트의 이미지 첨부 파일을 사용할 수 있습니다.
5. 그 외 파일은 이를 처리할 수 있는 도구에서 사용할 수 있도록 파일 메타데이터 또는 미디어 참조로 유지됩니다.

### 스레드 루트 첨부 파일 상속

메시지가 스레드에 도착하면(`thread_ts` 부모가 있는 경우) 다음과 같이 처리됩니다.

- 답글 자체에 직접 첨부된 미디어가 없고 포함된 루트 메시지에 파일이 있으면 Slack은 루트 파일을 스레드 시작 컨텍스트로 불러올 수 있습니다.
- 루트 파일은 새 스레드 세션 또는 재설정된 스레드 세션을 초기화할 때만 불러옵니다. 이후 텍스트만 있는 답글은 기존 세션 컨텍스트를 재사용하며 루트 파일을 새 미디어로 다시 첨부하지 않습니다.
- 답글에 직접 첨부된 파일이 루트 메시지 첨부 파일보다 우선합니다.
- 텍스트 없이 파일만 있는 루트 메시지는 폴백에서도 해당 파일을 포함할 수 있도록 첨부 파일 자리표시자로 나타냅니다.

### 다중 첨부 파일 처리

하나의 Slack 메시지에 여러 파일이 첨부되어 있으면 다음과 같이 처리됩니다.

- 각 첨부 파일을 미디어 파이프라인에서 개별적으로 처리합니다.
- 다운로드한 미디어 참조를 메시지 컨텍스트에 집계합니다.
- 처리 순서는 이벤트 페이로드의 Slack 파일 순서를 따릅니다.
- 한 첨부 파일의 다운로드가 실패해도 다른 파일의 처리는 차단되지 않습니다.

### 크기, 다운로드 및 모델 제한

- **크기 한도**: 기본값은 파일당 20 MB입니다. `channels.slack.mediaMaxMb`을 통해 구성할 수 있습니다.
- **오디오 텍스트 변환 한도**: 다운로드한 파일을 텍스트 변환 제공자 또는 CLI로 전송할 때도 `tools.media.audio.maxBytes`이 적용됩니다.
- **다운로드 실패**: Slack에서 제공할 수 없는 파일, 만료된 URL, 접근할 수 없는 파일, 크기 초과 파일, Slack 인증/로그인 HTML 응답은 지원되지 않는 형식으로 보고되지 않고 건너뜁니다.
- **비전 모델**: 이미지 분석에는 비전을 지원하는 경우 활성 응답 모델을 사용하고, 그렇지 않으면 `agents.defaults.imageModel`에 구성된 이미지 모델을 사용합니다.

### 알려진 제한 사항

| 시나리오                                      | 현재 동작                                                                          | 해결 방법                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 만료된 Slack 파일 URL                         | 파일을 건너뛰며 오류를 표시하지 않습니다                                           | Slack에 파일을 다시 업로드하십시오                                            |
| 오디오 텍스트 변환을 사용할 수 없음          | 클립은 첨부된 상태로 유지되지만 텍스트 변환 결과가 생성되지 않습니다               | `tools.media.audio`을 구성하거나 지원되는 로컬 텍스트 변환 CLI를 설치하십시오 |
| 캡션 없는 클립이 멘션 게이트를 통과하지 못함 | 비공개 추정 텍스트 변환 후 삭제되며 텍스트 변환 결과와 다운로드도 폐기됩니다       | 음성 이름 멘션 패턴을 구성하거나, 입력한 봇 멘션을 추가하거나, DM을 사용하십시오 |
| 비전 모델이 구성되지 않음                    | 이미지 첨부 파일은 미디어 참조로 저장되지만 이미지로 분석되지 않습니다            | `agents.defaults.imageModel`을 구성하거나 비전 기능을 지원하는 응답 모델을 사용하십시오 |
| 매우 큰 이미지(기본값 기준 > 20 MB)          | 크기 한도에 따라 건너뜁니다                                                        | Slack에서 허용하는 경우 `channels.slack.mediaMaxMb`을 늘리십시오                      |
| 전달되거나 공유된 첨부 파일                  | 텍스트 및 Slack 호스팅 이미지/파일 미디어는 최선의 방식으로 처리됩니다             | OpenClaw 스레드에서 직접 다시 공유하십시오                                   |
| PDF 첨부 파일                                 | 파일/미디어 컨텍스트로 저장되며 이미지 비전을 통해 자동으로 라우팅되지 않습니다    | 파일 메타데이터에는 `download-file`을, PDF 분석에는 `pdf` 도구를 사용하십시오 |

### 관련 문서

- [미디어 이해 파이프라인](/ko/nodes/media-understanding)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [PDF 도구](/ko/tools/pdf)

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
