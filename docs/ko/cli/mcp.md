---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결하기
    - '`openclaw mcp serve` 실행 중'
    - OpenClaw에 저장된 MCP 서버 정의 관리하기
sidebarTitle: MCP
summary: MCP를 통해 OpenClaw 채널 대화를 노출하고 저장된 MCP 서버 정의를 관리합니다
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp`에는 두 가지 역할이 있습니다.

- `openclaw mcp serve`로 OpenClaw를 MCP 서버로 실행
- `list`, `show`, `set`, `unset`으로 OpenClaw 소유의 outbound MCP 서버 정의 관리

즉:

- `serve`는 OpenClaw가 MCP 서버로 동작하는 경우입니다
- `list` / `show` / `set` / `unset`은 OpenClaw가 나중에 런타임에서 사용할 수 있는 다른 MCP 서버를 위한 클라이언트 측 레지스트리로 동작하는 경우입니다

OpenClaw가 직접 코딩 harness 세션을 호스팅하고 해당 런타임을 ACP를 통해 라우팅해야 한다면 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## MCP 서버로서의 OpenClaw

이 경로는 `openclaw mcp serve`입니다.

### `serve`를 사용할 때

다음과 같은 경우 `openclaw mcp serve`를 사용하세요.

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 하는 경우
- 이미 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 있는 경우
- 채널별 브리지를 각각 실행하는 대신 OpenClaw의 채널 백엔드 전반에서 동작하는 하나의 MCP 서버를 원하는 경우

OpenClaw가 코딩 런타임 자체를 호스팅하고 에이전트 세션을 OpenClaw 내부에 유지해야 한다면 대신 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

### 동작 방식

`openclaw mcp serve`는 stdio MCP 서버를 시작합니다. MCP 클라이언트가 이 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 두는 동안 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고, 라우팅된 채널 대화를 MCP를 통해 노출합니다.

<Steps>
  <Step title="클라이언트가 브리지를 시작">
    MCP 클라이언트가 `openclaw mcp serve`를 시작합니다.
  </Step>
  <Step title="브리지가 Gateway에 연결">
    브리지가 WebSocket을 통해 OpenClaw Gateway에 연결합니다.
  </Step>
  <Step title="세션이 MCP 대화가 됨">
    라우팅된 세션이 MCP 대화 및 transcript/history 도구로 노출됩니다.
  </Step>
  <Step title="라이브 이벤트 큐">
    브리지가 연결된 동안 라이브 이벤트가 메모리에 큐잉됩니다.
  </Step>
  <Step title="선택적 Claude 푸시">
    Claude 채널 모드가 활성화되어 있으면 같은 세션이 Claude 전용 푸시 알림도 받을 수 있습니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="중요한 동작">
    - 라이브 큐 상태는 브리지가 연결될 때 시작됩니다
    - 이전 transcript 히스토리는 `messages_read`로 읽습니다
    - Claude 푸시 알림은 MCP 세션이 살아 있는 동안에만 존재합니다
    - 클라이언트가 연결을 끊으면 브리지가 종료되고 라이브 큐도 사라집니다
    - `openclaw agent`, `openclaw infer model run` 같은 일회성 에이전트 진입점은 응답이 완료되면 자신이 연 번들 MCP 런타임을 종료하므로, 반복 스크립트 실행 시 stdio MCP 하위 프로세스가 누적되지 않습니다
    - OpenClaw가 시작한 stdio MCP 서버(번들 또는 사용자 구성)는 종료 시 프로세스 트리 단위로 정리되므로, 부모 stdio 클라이언트가 종료된 뒤에도 서버가 시작한 하위 프로세스가 살아남지 않습니다
    - 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트도 함께 해제되므로, 제거된 세션에 연결된 stdio 연결이 남지 않습니다

  </Accordion>
</AccordionGroup>

### 클라이언트 모드 선택

같은 브리지를 두 가지 방식으로 사용할 수 있습니다.

<Tabs>
  <Tab title="일반 MCP 클라이언트">
    표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, 승인 도구를 사용하세요.
  </Tab>
  <Tab title="Claude Code">
    표준 MCP 도구와 Claude 전용 채널 어댑터를 함께 사용합니다. `--claude-channel-mode on`을 활성화하거나 기본값인 `auto`를 그대로 두세요.
  </Tab>
</Tabs>

<Note>
현재 `auto`는 `on`과 동일하게 동작합니다. 아직 클라이언트 capability 감지는 없습니다.
</Note>

### `serve`가 노출하는 내용

브리지는 기존 Gateway 세션 라우트 메타데이터를 사용해 채널 기반 대화를 노출합니다. OpenClaw가 이미 다음과 같은 알려진 라우트를 포함한 세션 상태를 가지고 있으면 대화가 나타납니다.

- `channel`
- recipient 또는 destination 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한 곳에서 다음을 수행할 수 있습니다.

- 최근 라우팅된 대화 나열
- 최근 transcript 히스토리 읽기
- 새 inbound 이벤트 대기
- 같은 라우트를 통해 답장 다시 보내기
- 브리지가 연결된 동안 도착한 승인 요청 보기

### 사용법

<Tabs>
  <Tab title="로컬 Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="원격 Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="원격 Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude 끔">
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
    Gateway 세션 상태에 이미 라우트 메타데이터가 있는 최근 세션 기반 대화를 나열합니다.

    유용한 필터:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    `session_key`로 하나의 대화를 반환합니다.
  </Accordion>
  <Accordion title="messages_read">
    하나의 세션 기반 대화에 대한 최근 transcript 메시지를 읽습니다.
  </Accordion>
  <Accordion title="attachments_fetch">
    하나의 transcript 메시지에서 비텍스트 메시지 콘텐츠 블록을 추출합니다. 이것은 transcript 콘텐츠에 대한 메타데이터 뷰이며, 독립적인 영구 첨부 blob 저장소는 아닙니다.
  </Accordion>
  <Accordion title="events_poll">
    숫자 cursor 이후 큐에 쌓인 라이브 이벤트를 읽습니다.
  </Accordion>
  <Accordion title="events_wait">
    다음 일치하는 큐잉 이벤트가 도착하거나 시간 초과가 날 때까지 long-poll합니다.

    Claude 전용 푸시 프로토콜 없이 일반 MCP 클라이언트가 거의 실시간 전달을 필요로 할 때 사용하세요.

  </Accordion>
  <Accordion title="messages_send">
    세션에 이미 기록된 같은 라우트를 통해 텍스트를 다시 보냅니다.

    현재 동작:

    - 기존 대화 라우트가 필요합니다
    - 세션의 channel, recipient, account id, thread id를 사용합니다
    - 텍스트만 전송합니다

  </Accordion>
  <Accordion title="permissions_list_open">
    브리지가 Gateway에 연결된 이후 관찰한 대기 중인 exec/Plugin 승인 요청을 나열합니다.
  </Accordion>
  <Accordion title="permissions_respond">
    하나의 대기 중인 exec/Plugin 승인 요청을 다음 중 하나로 처리합니다.

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 이벤트 모델

브리지는 연결된 동안 메모리 내 이벤트 큐를 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 큐는 라이브 전용이며, MCP 브리지가 시작될 때 시작됩니다
- `events_poll`과 `events_wait`는 오래된 Gateway 히스토리를 자체적으로 재생하지 않습니다
- 영구 backlog는 `messages_read`로 읽어야 합니다

</Warning>

### Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이는 Claude Code 채널 어댑터에 대한 OpenClaw 버전입니다. 표준 MCP 도구는 계속 사용할 수 있지만, 라이브 inbound 메시지가 Claude 전용 MCP 알림으로도 도착할 수 있습니다.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 표준 MCP 도구만 사용합니다.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude 채널 알림을 활성화합니다.
  </Tab>
  <Tab title="auto (기본값)">
    `--claude-channel-mode auto`: 현재 기본값이며, 브리지 동작은 `on`과 같습니다.
  </Tab>
</Tabs>

Claude 채널 모드가 활성화되면 서버는 Claude 실험 capability를 광고하고 다음을 전송할 수 있습니다.

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- inbound `user` transcript 메시지는 `notifications/claude/channel`로 전달됩니다
- MCP를 통해 받은 Claude 권한 요청은 메모리 내에서 추적됩니다
- 연결된 대화가 나중에 `yes abcde` 또는 `no abcde`를 보내면 브리지는 이를 `notifications/claude/channel/permission`으로 변환합니다
- 이 알림은 라이브 세션 전용이며, MCP 클라이언트가 연결을 끊으면 푸시 대상도 사라집니다

이것은 의도적으로 클라이언트 전용입니다. 일반 MCP 클라이언트는 표준 polling 도구를 사용해야 합니다.

### MCP 클라이언트 구성

예시 stdio 클라이언트 구성:

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

대부분의 일반 MCP 클라이언트에서는 표준 도구 표면으로 시작하고 Claude 모드는 무시하세요. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에 대해서만 Claude 모드를 활성화하세요.

### 옵션

`openclaw mcp serve`는 다음을 지원합니다.

<ParamField path="--url" type="string">
  Gateway WebSocket URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway token.
</ParamField>
<ParamField path="--token-file" type="string">
  파일에서 token을 읽습니다.
</ParamField>
<ParamField path="--password" type="string">
  Gateway password.
</ParamField>
<ParamField path="--password-file" type="string">
  파일에서 password를 읽습니다.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 알림 모드.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr에 Verbose 로그를 출력합니다.
</ParamField>

<Tip>
가능하면 인라인 비밀 정보 대신 `--token-file` 또는 `--password-file`을 사용하세요.
</Tip>

### 보안 및 신뢰 경계

브리지는 라우팅을 새로 만들지 않습니다. Gateway가 이미 라우팅 방법을 알고 있는 대화만 노출합니다.

즉:

- sender allowlist, 페어링, 채널 수준 신뢰는 여전히 기본 OpenClaw 채널 구성에 속합니다
- `messages_send`는 기존에 저장된 라우트를 통해서만 답장할 수 있습니다
- 승인 상태는 현재 브리지 세션에 대해서만 라이브/메모리 내에 존재합니다
- 브리지 인증에는 다른 원격 Gateway 클라이언트와 동일하게 신뢰할 수 있는 Gateway token 또는 password 제어를 사용해야 합니다

`conversations_list`에 대화가 나타나지 않는다면 보통 MCP 구성 문제는 아닙니다. 일반적으로 기본 Gateway 세션에 라우트 메타데이터가 없거나 불완전한 경우입니다.

### 테스트

OpenClaw는 이 브리지를 위한 결정적 Docker 스모크 테스트를 제공합니다.

```bash
pnpm test:docker:mcp-channels
```

이 스모크 테스트는 다음을 수행합니다.

- 시드된 Gateway 컨테이너 시작
- `openclaw mcp serve`를 시작하는 두 번째 컨테이너 시작
- 대화 검색, transcript 읽기, 첨부 메타데이터 읽기, 라이브 이벤트 큐 동작, outbound 전송 라우팅 검증
- 실제 stdio MCP 브리지를 통한 Claude 스타일 채널 및 권한 알림 검증

실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고도 브리지가 동작함을 증명하는 가장 빠른 방법입니다.

더 넓은 테스트 맥락은 [Testing](/ko/help/testing)을 참고하세요.

### 문제 해결

<AccordionGroup>
  <Accordion title="반환되는 대화가 없음">
    일반적으로 Gateway 세션이 아직 라우팅 가능한 상태가 아니라는 뜻입니다. 기본 세션에 저장된 channel/provider, recipient, 선택적 account/thread 라우트 메타데이터가 있는지 확인하세요.
  </Accordion>
  <Accordion title="events_poll 또는 events_wait가 이전 메시지를 놓침">
    예상된 동작입니다. 라이브 큐는 브리지가 연결될 때 시작됩니다. 이전 transcript 히스토리는 `messages_read`로 읽으세요.
  </Accordion>
  <Accordion title="Claude 알림이 표시되지 않음">
    다음 항목을 모두 확인하세요.

    - 클라이언트가 stdio MCP 세션을 계속 열어 두었는지
    - `--claude-channel-mode`가 `on` 또는 `auto`인지
    - 클라이언트가 실제로 Claude 전용 알림 메서드를 이해하는지
    - 브리지가 연결된 이후 inbound 메시지가 발생했는지

  </Accordion>
  <Accordion title="승인이 보이지 않음">
    `permissions_list_open`은 브리지가 연결된 동안 관찰된 승인 요청만 보여줍니다. 영구적인 승인 히스토리 API는 아닙니다.
  </Accordion>
</AccordionGroup>

## MCP 클라이언트 레지스트리로서의 OpenClaw

이 경로는 `openclaw mcp list`, `show`, `set`, `unset`입니다.

이 명령들은 MCP를 통해 OpenClaw를 노출하지 않습니다. 대신 OpenClaw config의 `mcp.servers` 아래에 있는 OpenClaw 소유 MCP 서버 정의를 관리합니다.

이렇게 저장된 정의는 나중에 OpenClaw가 실행하거나 구성하는 런타임(예: 내장 Pi 및 기타 런타임 어댑터)을 위한 것입니다. OpenClaw는 이러한 정의를 중앙에서 저장하므로, 각 런타임이 자체적으로 중복된 MCP 서버 목록을 유지할 필요가 없습니다.

<AccordionGroup>
  <Accordion title="중요한 동작">
    - 이 명령들은 OpenClaw config만 읽거나 씁니다
    - 대상 MCP 서버에 연결하지 않습니다
    - 명령, URL 또는 원격 transport가 현재 도달 가능한지 검증하지 않습니다
    - 런타임 어댑터는 실행 시점에 실제로 지원하는 transport 형태를 결정합니다
    - 내장 Pi는 구성된 MCP 도구를 일반 `coding` 및 `messaging` 도구 프로필에 노출합니다. `minimal`은 여전히 이를 숨기며, `tools.deny: ["bundle-mcp"]`는 이를 명시적으로 비활성화합니다
    - 세션 범위 번들 MCP 런타임은 유휴 시간이 `mcp.sessionIdleTtlMs`밀리초를 넘으면 회수됩니다(기본값 10분, 비활성화하려면 `0`). 일회성 내장 실행은 실행 종료 시 이를 정리합니다

  </Accordion>
</AccordionGroup>

런타임 어댑터는 이 공용 레지스트리를 하위 클라이언트가 기대하는 형태로 정규화할 수 있습니다. 예를 들어, 내장 Pi는 OpenClaw `transport` 값을 직접 사용하고, Claude Code와 Gemini는 `http`, `sse`, `stdio` 같은 CLI 기본 `type` 값을 받습니다.

### 저장된 MCP 서버 정의

OpenClaw는 OpenClaw 관리형 MCP 정의가 필요한 표면을 위해 config에 경량 MCP 서버 레지스트리도 저장합니다.

명령어:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

참고:

- `list`는 서버 이름을 정렬해서 출력합니다.
- 이름 없이 `show`를 실행하면 구성된 전체 MCP 서버 객체를 출력합니다.
- `set`은 명령줄에서 하나의 JSON 객체 값을 기대합니다.
- `unset`은 지정한 서버가 존재하지 않으면 실패합니다.

예시:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

예시 config 형태:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio transport

로컬 하위 프로세스를 시작하고 stdin/stdout을 통해 통신합니다.

| 필드                       | 설명                        |
| -------------------------- | --------------------------- |
| `command`                  | 시작할 실행 파일(필수)      |
| `args`                     | 명령줄 인수 배열            |
| `env`                      | 추가 환경 변수              |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리    |

<Warning>
**Stdio env 안전 필터**

OpenClaw는 서버의 `env` 블록에 나타나더라도, 첫 번째 RPC 이전에 stdio MCP 서버가 시작되는 방식을 바꿀 수 있는 인터프리터 시작 환경 키를 거부합니다. 차단되는 키에는 `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` 및 유사한 런타임 제어 변수가 포함됩니다. 시작 시 이러한 키는 구성 오류와 함께 거부되므로, 암묵적인 prelude 삽입, 인터프리터 교체, stdio 프로세스에 대한 디버거 활성화를 방지할 수 있습니다. 일반적인 자격 증명, 프록시, 서버별 환경 변수(`GITHUB_TOKEN`, `HTTP_PROXY`, 사용자 정의 `*_API_KEY` 등)는 영향을 받지 않습니다.

MCP 서버에 실제로 이러한 차단된 변수가 필요하다면, stdio 서버의 `env` 아래가 아니라 Gateway 호스트 프로세스에 설정하세요.
</Warning>

### SSE / HTTP transport

HTTP Server-Sent Events를 통해 원격 MCP 서버에 연결합니다.

| 필드                  | 설명                                                        |
| --------------------- | ----------------------------------------------------------- |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                       |
| `headers`             | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                    |
| `connectionTimeoutMs` | 서버별 연결 시간 초과(ms, 선택 사항)                        |

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

`url`의 민감한 값(userinfo)과 `headers`는 로그 및 상태 출력에서 마스킹됩니다.

### Streamable HTTP transport

`streamable-http`는 `sse`, `stdio`와 함께 사용할 수 있는 추가 transport 옵션입니다. 원격 MCP 서버와 양방향 통신을 위해 HTTP 스트리밍을 사용합니다.

| 필드                  | 설명                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                      |
| `transport`           | 이 transport를 선택하려면 `"streamable-http"`로 설정하세요. 생략하면 OpenClaw는 `sse`를 사용합니다 |
| `headers`             | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                                                   |
| `connectionTimeoutMs` | 서버별 연결 시간 초과(ms, 선택 사항)                                                       |

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
이 명령들은 저장된 config만 관리합니다. 채널 브리지를 시작하거나, 라이브 MCP 클라이언트 세션을 열거나, 대상 서버에 실제로 도달 가능한지 증명하지는 않습니다.
</Note>

## 현재 제한 사항

이 페이지는 현재 배포된 브리지를 기준으로 설명합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 라우트 메타데이터에 의존합니다
- Claude 전용 어댑터 외에는 일반 푸시 프로토콜이 없습니다
- 아직 메시지 수정 또는 반응 도구는 없습니다
- HTTP/SSE/streamable-http transport는 하나의 원격 서버에 연결하며, 아직 멀티플렉스된 업스트림은 없습니다
- `permissions_list_open`에는 브리지가 연결된 동안 관찰된 승인만 포함됩니다

## 관련 항목

- [CLI reference](/ko/cli)
- [Plugins](/ko/cli/plugins)
