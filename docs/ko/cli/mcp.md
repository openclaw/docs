---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결하기
    - '`openclaw mcp serve` 실행 중'
    - OpenClaw에 저장된 MCP 서버 정의 관리
sidebarTitle: MCP
summary: MCP를 통해 OpenClaw 채널 대화를 노출하고 저장된 MCP 서버 정의를 관리합니다
title: MCP
x-i18n:
    generated_at: "2026-04-30T06:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp`에는 두 가지 역할이 있습니다.

- `openclaw mcp serve`로 OpenClaw를 MCP 서버로 실행
- `list`, `show`, `set`, `unset`으로 OpenClaw가 소유한 아웃바운드 MCP 서버 정의 관리

다시 말해:

- `serve`는 OpenClaw가 MCP 서버로 동작하는 것입니다.
- `list` / `show` / `set` / `unset`은 OpenClaw가 런타임에서 나중에 사용할 수 있는 다른 MCP 서버를 위한 MCP 클라이언트 측 레지스트리로 동작하는 것입니다.

OpenClaw가 코딩 하네스 세션을 직접 호스팅하고 해당 런타임을 ACP를 통해 라우팅해야 할 때는 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## MCP 서버로서의 OpenClaw

이는 `openclaw mcp serve` 경로입니다.

### `serve`를 사용할 때

다음과 같은 경우 `openclaw mcp serve`를 사용하세요.

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 하는 경우
- 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 이미 있는 경우
- 채널별 브리지를 따로 실행하는 대신 OpenClaw의 채널 백엔드 전반에서 작동하는 하나의 MCP 서버를 원하는 경우

OpenClaw가 코딩 런타임 자체를 호스팅하고 에이전트 세션을 OpenClaw 내부에 유지해야 할 때는 대신 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

### 작동 방식

`openclaw mcp serve`는 stdio MCP 서버를 시작합니다. MCP 클라이언트가 해당 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 두는 동안 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고 라우팅된 채널 대화를 MCP로 노출합니다.

<Steps>
  <Step title="클라이언트가 브리지를 생성">
    MCP 클라이언트가 `openclaw mcp serve`를 생성합니다.
  </Step>
  <Step title="브리지가 Gateway에 연결">
    브리지는 WebSocket을 통해 OpenClaw Gateway에 연결합니다.
  </Step>
  <Step title="세션이 MCP 대화가 됨">
    라우팅된 세션은 MCP 대화와 transcript/기록 도구가 됩니다.
  </Step>
  <Step title="라이브 이벤트 큐">
    브리지가 연결되어 있는 동안 라이브 이벤트가 메모리에 큐잉됩니다.
  </Step>
  <Step title="선택적 Claude 푸시">
    Claude 채널 모드가 활성화된 경우 같은 세션은 Claude 전용 푸시 알림도 받을 수 있습니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="중요 동작">
    - 라이브 큐 상태는 브리지가 연결될 때 시작됩니다.
    - 이전 transcript 기록은 `messages_read`로 읽습니다.
    - Claude 푸시 알림은 MCP 세션이 살아 있는 동안에만 존재합니다.
    - 클라이언트가 연결을 끊으면 브리지가 종료되고 라이브 큐는 사라집니다.
    - `openclaw agent`, `openclaw infer model run` 같은 일회성 에이전트 진입점은 응답이 완료되면 자신이 연 번들 MCP 런타임을 정리하므로 반복되는 스크립트 실행이 stdio MCP 자식 프로세스를 누적하지 않습니다.
    - OpenClaw가 시작한 stdio MCP 서버(번들 또는 사용자 구성)는 종료 시 프로세스 트리로 함께 정리되므로, 서버가 시작한 자식 subprocess는 부모 stdio 클라이언트가 종료된 뒤에도 남지 않습니다.
    - 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트가 해제되므로, 제거된 세션에 묶인 stdio 연결이 남지 않습니다.

  </Accordion>
</AccordionGroup>

### 클라이언트 모드 선택

같은 브리지를 두 가지 방식으로 사용할 수 있습니다.

<Tabs>
  <Tab title="일반 MCP 클라이언트">
    표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, 승인 도구를 사용하세요.
  </Tab>
  <Tab title="Claude Code">
    표준 MCP 도구와 Claude 전용 채널 어댑터를 함께 사용합니다. `--claude-channel-mode on`을 활성화하거나 기본값 `auto`를 그대로 두세요.
  </Tab>
</Tabs>

<Note>
현재 `auto`는 `on`과 동일하게 동작합니다. 아직 클라이언트 기능 감지는 없습니다.
</Note>

### `serve`가 노출하는 것

브리지는 기존 Gateway 세션 경로 메타데이터를 사용해 채널 기반 대화를 노출합니다. 대화는 OpenClaw가 다음과 같은 알려진 경로가 포함된 세션 상태를 이미 가지고 있을 때 나타납니다.

- `channel`
- 수신자 또는 대상 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한 곳에서 다음을 수행할 수 있습니다.

- 최근 라우팅된 대화 나열
- 최근 transcript 기록 읽기
- 새 인바운드 이벤트 대기
- 같은 경로를 통해 응답 보내기
- 브리지가 연결되어 있는 동안 도착하는 승인 요청 확인

### 사용법

<Tabs>
  <Tab title="로컬 Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="원격 Gateway(토큰)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="원격 Gateway(비밀번호)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="상세 로그 / Claude 끄기">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 브리지 도구

현재 브리지는 다음 MCP 도구를 노출합니다.

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway 세션 상태에 경로 메타데이터가 이미 있는 최근 세션 기반 대화를 나열합니다.

    유용한 필터:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    `session_key`로 대화 하나를 반환합니다.
  </Accordion>
  <Accordion title="messages_read">
    세션 기반 대화 하나의 최근 transcript 메시지를 읽습니다.
  </Accordion>
  <Accordion title="attachments_fetch">
    transcript 메시지 하나에서 텍스트가 아닌 메시지 콘텐츠 블록을 추출합니다. 이는 transcript 콘텐츠에 대한 메타데이터 보기이며, 독립적인 영구 첨부 파일 blob 저장소가 아닙니다.
  </Accordion>
  <Accordion title="events_poll">
    숫자 커서 이후 큐에 쌓인 라이브 이벤트를 읽습니다.
  </Accordion>
  <Accordion title="events_wait">
    다음으로 일치하는 큐 이벤트가 도착하거나 timeout이 만료될 때까지 long-poll합니다.

    Claude 전용 푸시 프로토콜 없이 일반 MCP 클라이언트에 거의 실시간 전달이 필요할 때 사용하세요.

  </Accordion>
  <Accordion title="messages_send">
    세션에 이미 기록된 같은 경로를 통해 텍스트를 다시 보냅니다.

    현재 동작:

    - 기존 대화 경로가 필요합니다.
    - 세션의 채널, 수신자, 계정 ID, 스레드 ID를 사용합니다.
    - 텍스트만 보냅니다.

  </Accordion>
  <Accordion title="permissions_list_open">
    브리지가 Gateway에 연결된 이후 관찰한 대기 중인 exec/plugin 승인 요청을 나열합니다.
  </Accordion>
  <Accordion title="permissions_respond">
    대기 중인 exec/plugin 승인 요청 하나를 다음 중 하나로 해결합니다.

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 이벤트 모델

브리지는 연결되어 있는 동안 인메모리 이벤트 큐를 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 큐는 라이브 전용이며 MCP 브리지가 시작될 때 시작됩니다.
- `events_poll`과 `events_wait`는 이전 Gateway 기록을 자체적으로 재생하지 않습니다.
- 영구 backlog는 `messages_read`로 읽어야 합니다.

</Warning>

### Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이는 Claude Code 채널 어댑터에 해당하는 OpenClaw 기능입니다. 표준 MCP 도구는 계속 사용할 수 있으며, 라이브 인바운드 메시지도 Claude 전용 MCP 알림으로 도착할 수 있습니다.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 표준 MCP 도구만 사용합니다.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude 채널 알림을 활성화합니다.
  </Tab>
  <Tab title="auto(기본값)">
    `--claude-channel-mode auto`: 현재 기본값이며, `on`과 같은 브리지 동작입니다.
  </Tab>
</Tabs>

Claude 채널 모드가 활성화되면 서버는 Claude 실험적 기능을 광고하고 다음을 emit할 수 있습니다.

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- 인바운드 `user` transcript 메시지는 `notifications/claude/channel`로 전달됩니다.
- MCP를 통해 받은 Claude 권한 요청은 인메모리로 추적됩니다.
- 연결된 대화가 나중에 `yes abcde` 또는 `no abcde`를 보내면, 브리지는 이를 `notifications/claude/channel/permission`으로 변환합니다.
- 이러한 알림은 라이브 세션 전용입니다. MCP 클라이언트가 연결을 끊으면 푸시 대상이 없습니다.

이는 의도적으로 클라이언트별 기능입니다. 일반 MCP 클라이언트는 표준 polling 도구를 사용해야 합니다.

### MCP 클라이언트 구성

stdio 클라이언트 구성 예시:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

대부분의 일반 MCP 클라이언트는 표준 도구 surface로 시작하고 Claude 모드는 무시하세요. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에만 Claude 모드를 켜세요.

### 옵션

`openclaw mcp serve`는 다음을 지원합니다.

<ParamField path="--url" type="string">
  Gateway WebSocket URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway 토큰.
</ParamField>
<ParamField path="--token-file" type="string">
  파일에서 토큰을 읽습니다.
</ParamField>
<ParamField path="--password" type="string">
  Gateway 비밀번호.
</ParamField>
<ParamField path="--password-file" type="string">
  파일에서 비밀번호를 읽습니다.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 알림 모드.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr에 상세 로그를 출력합니다.
</ParamField>

<Tip>
가능하면 inline secret보다 `--token-file` 또는 `--password-file`을 선호하세요.
</Tip>

### 보안 및 신뢰 경계

브리지는 라우팅을 새로 만들지 않습니다. Gateway가 이미 라우팅 방법을 아는 대화만 노출합니다.

즉:

- 발신자 allowlist, pairing, 채널 수준 신뢰는 여전히 기반 OpenClaw 채널 구성에 속합니다.
- `messages_send`는 기존에 저장된 경로를 통해서만 응답할 수 있습니다.
- 승인 상태는 현재 브리지 세션에 대해서만 라이브/인메모리입니다.
- 브리지 인증은 다른 원격 Gateway 클라이언트에 신뢰할 동일한 Gateway 토큰 또는 비밀번호 제어를 사용해야 합니다.

대화가 `conversations_list`에 없으면 일반적인 원인은 MCP 구성이 아닙니다. 기반 Gateway 세션에 경로 메타데이터가 없거나 불완전한 것입니다.

### 테스트

OpenClaw는 이 브리지를 위한 결정론적 Docker smoke를 제공합니다.

```bash
pnpm test:docker:mcp-channels
```

이 smoke는 다음을 수행합니다.

- seeded Gateway 컨테이너를 시작합니다.
- `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작합니다.
- 대화 검색, transcript 읽기, 첨부 파일 메타데이터 읽기, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅을 검증합니다.
- 실제 stdio MCP 브리지를 통해 Claude 스타일 채널 및 권한 알림을 검증합니다.

이는 실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고 브리지가 작동함을 증명하는 가장 빠른 방법입니다.

더 넓은 테스트 맥락은 [테스트](/ko/help/testing)를 참고하세요.

### 문제 해결

<AccordionGroup>
  <Accordion title="대화가 반환되지 않음">
    일반적으로 Gateway 세션이 아직 라우팅 가능하지 않다는 뜻입니다. 기반 세션에 저장된 채널/제공자, 수신자, 선택적 계정/스레드 경로 메타데이터가 있는지 확인하세요.
  </Accordion>
  <Accordion title="events_poll 또는 events_wait가 이전 메시지를 놓침">
    예상된 동작입니다. 라이브 큐는 브리지가 연결될 때 시작됩니다. 이전 transcript 기록은 `messages_read`로 읽으세요.
  </Accordion>
  <Accordion title="Claude 알림이 표시되지 않음">
    다음을 모두 확인하세요.

    - 클라이언트가 stdio MCP 세션을 열어 두었습니다.
    - `--claude-channel-mode`가 `on` 또는 `auto`입니다.
    - 클라이언트가 실제로 Claude 전용 알림 메서드를 이해합니다.
    - 인바운드 메시지가 브리지 연결 이후에 발생했습니다.

  </Accordion>
  <Accordion title="승인이 누락됨">
    `permissions_list_open`은 브리지가 연결되어 있는 동안 관찰한 승인 요청만 표시합니다. 이는 영구 승인 기록 API가 아닙니다.
  </Accordion>
</AccordionGroup>

## MCP 클라이언트 레지스트리로서의 OpenClaw

이는 `openclaw mcp list`, `show`, `set`, `unset` 경로입니다.

이 명령들은 MCP를 통해 OpenClaw를 노출하지 않습니다. 이 명령들은 OpenClaw 구성의 `mcp.servers` 아래에 있는 OpenClaw 소유 MCP 서버 정의를 관리합니다.

저장된 정의는 임베디드 Pi 및 기타 런타임 어댑터처럼 OpenClaw가 나중에 실행하거나 구성하는 런타임을 위한 것입니다. OpenClaw는 이러한 정의를 중앙에 저장하므로 해당 런타임이 자체 중복 MCP 서버 목록을 유지할 필요가 없습니다.

<AccordionGroup>
  <Accordion title="중요 동작">
    - 이 명령들은 OpenClaw 구성만 읽거나 씁니다
    - 대상 MCP 서버에 연결하지 않습니다
    - 명령, URL 또는 원격 전송이 지금 도달 가능한지 검증하지 않습니다
    - 런타임 어댑터는 실행 시점에 실제로 지원할 전송 형태를 결정합니다
    - 임베디드 Pi는 일반 `coding` 및 `messaging` 도구 프로필에서 구성된 MCP 도구를 노출합니다. `minimal`은 여전히 이를 숨기며, `tools.deny: ["bundle-mcp"]`는 이를 명시적으로 비활성화합니다
    - 세션 범위 번들 MCP 런타임은 유휴 시간이 `mcp.sessionIdleTtlMs` 밀리초에 도달하면 정리됩니다(기본값 10분, 비활성화하려면 `0` 설정). 일회성 임베디드 실행은 실행 종료 시 이를 정리합니다

  </Accordion>
</AccordionGroup>

런타임 어댑터는 이 공유 레지스트리를 다운스트림 클라이언트가 기대하는 형태로 정규화할 수 있습니다. 예를 들어 임베디드 Pi는 OpenClaw `transport` 값을 직접 사용하지만, Claude Code와 Gemini는 `http`, `sse`, `stdio` 같은 CLI 네이티브 `type` 값을 받습니다.

### 저장된 MCP 서버 정의

OpenClaw는 OpenClaw 관리 MCP 정의를 원하는 표면을 위해 구성에 경량 MCP 서버 레지스트리도 저장합니다.

명령:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

참고:

- `list`는 서버 이름을 정렬합니다.
- 이름 없이 `show`를 실행하면 구성된 전체 MCP 서버 객체를 출력합니다.
- `set`은 명령줄에서 하나의 JSON 객체 값을 기대합니다.
- Streamable HTTP MCP 서버에는 `transport: "streamable-http"`를 사용하세요. `openclaw mcp set`은 호환성을 위해 CLI 네이티브 `type: "http"`도 동일한 표준 구성 형태로 정규화합니다.
- `unset`은 지정된 서버가 없으면 실패합니다.

예시:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

구성 형태 예시:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio 전송

로컬 자식 프로세스를 실행하고 stdin/stdout을 통해 통신합니다.

| 필드                       | 설명                              |
| -------------------------- | --------------------------------- |
| `command`                  | 생성할 실행 파일(필수)            |
| `args`                     | 명령줄 인수 배열                  |
| `env`                      | 추가 환경 변수                    |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리          |

<Warning>
**Stdio env 안전 필터**

OpenClaw는 stdio MCP 서버가 첫 RPC 전에 시작되는 방식을 변경할 수 있는 인터프리터 시작 환경 키를 거부합니다. 서버의 `env` 블록에 나타나더라도 거부됩니다. 차단되는 키에는 `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` 및 유사한 런타임 제어 변수가 포함됩니다. 시작 시 구성 오류로 이를 거부하여 stdio 프로세스에 암묵적 프렐류드를 주입하거나, 인터프리터를 바꾸거나, 디버거를 활성화할 수 없게 합니다. 일반 자격 증명, 프록시, 서버별 환경 변수(`GITHUB_TOKEN`, `HTTP_PROXY`, 사용자 지정 `*_API_KEY` 등)는 영향을 받지 않습니다.

MCP 서버에 차단된 변수 중 하나가 정말 필요하다면 stdio 서버의 `env` 아래가 아니라 Gateway 호스트 프로세스에 설정하세요.
</Warning>

### SSE / HTTP 전송

HTTP Server-Sent Events를 통해 원격 MCP 서버에 연결합니다.

| 필드                  | 설명                                                          |
| --------------------- | ------------------------------------------------------------- |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                         |
| `headers`             | HTTP 헤더의 선택적 키-값 맵(예: 인증 토큰)                    |
| `connectionTimeoutMs` | 서버별 연결 제한 시간(ms)(선택 사항)                          |

예시:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`(사용자 정보) 및 `headers`의 민감한 값은 로그와 상태 출력에서 수정되어 표시됩니다.

### Streamable HTTP 전송

`streamable-http`는 `sse` 및 `stdio`와 함께 사용할 수 있는 추가 전송 옵션입니다. 원격 MCP 서버와의 양방향 통신에 HTTP 스트리밍을 사용합니다.

| 필드                  | 설명                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                 |
| `transport`           | 이 전송을 선택하려면 `"streamable-http"`로 설정합니다. 생략하면 OpenClaw는 `sse`를 사용합니다 |
| `headers`             | HTTP 헤더의 선택적 키-값 맵(예: 인증 토큰)                                           |
| `connectionTimeoutMs` | 서버별 연결 제한 시간(ms)(선택 사항)                                                 |

OpenClaw 구성은 `transport: "streamable-http"`를 표준 표기로 사용합니다. CLI 네이티브 MCP `type: "http"` 값은 `openclaw mcp set`을 통해 저장할 때 허용되며 기존 구성에서는 `openclaw doctor --fix`로 복구되지만, 임베디드 Pi가 직접 사용하는 것은 `transport`입니다.

예시:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
이 명령들은 저장된 구성만 관리합니다. 채널 브리지를 시작하거나, 라이브 MCP 클라이언트 세션을 열거나, 대상 서버에 도달할 수 있음을 증명하지 않습니다.
</Note>

## 현재 제한 사항

이 페이지는 현재 제공되는 브리지를 문서화합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 라우트 메타데이터에 의존합니다
- Claude 전용 어댑터를 넘어서는 범용 푸시 프로토콜은 없습니다
- 아직 메시지 편집 또는 반응 도구는 없습니다
- HTTP/SSE/streamable-http 전송은 단일 원격 서버에 연결합니다. 아직 다중화된 업스트림은 없습니다
- `permissions_list_open`은 브리지가 연결되어 있는 동안 관찰된 승인만 포함합니다

## 관련 항목

- [CLI 참조](/ko/cli)
- [Plugin](/ko/cli/plugins)
