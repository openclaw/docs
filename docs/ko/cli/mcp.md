---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결하기
    - '`openclaw mcp serve` 실행하기'
    - OpenClaw에 저장된 MCP 서버 정의 관리하기
summary: MCP를 통해 OpenClaw 채널 대화를 노출하고 저장된 MCP 서버 정의를 관리합니다.
title: mcp
x-i18n:
    generated_at: "2026-04-23T14:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp`에는 두 가지 역할이 있습니다:

- `openclaw mcp serve`로 OpenClaw를 MCP 서버로 실행
- `list`, `show`, `set`, `unset`으로 OpenClaw 소유의 outbound MCP 서버 정의 관리

즉:

- `serve`는 OpenClaw가 MCP 서버로 동작하는 경우입니다
- `list` / `show` / `set` / `unset`은 OpenClaw가 나중에 자체 런타임에서 사용할 수 있는 다른 MCP 서버를 위한 클라이언트 측 레지스트리로 동작하는 경우입니다

OpenClaw가 직접 코딩 하네스 세션을 호스팅하고 그 런타임을 ACP를 통해 라우팅해야 한다면 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## MCP 서버로서의 OpenClaw

이것은 `openclaw mcp serve` 경로입니다.

## `serve`를 사용할 때

다음과 같은 경우 `openclaw mcp serve`를 사용하세요:

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 하는 경우
- 이미 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 있는 경우
- 채널별 브리지를 각각 실행하는 대신 OpenClaw의 채널 백엔드 전반에서 동작하는 하나의 MCP 서버를 원하는 경우

반대로 OpenClaw가 코딩 런타임 자체를 호스팅하고 에이전트 세션을 OpenClaw 내부에 유지해야 한다면 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## 작동 방식

`openclaw mcp serve`는 stdio MCP 서버를 시작합니다. MCP 클라이언트가 이 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 두는 동안, 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고, 라우팅된 채널 대화를 MCP를 통해 노출합니다.

수명 주기:

1. MCP 클라이언트가 `openclaw mcp serve`를 시작합니다
2. 브리지가 Gateway에 연결합니다
3. 라우팅된 세션이 MCP 대화 및 transcript/history 도구로 노출됩니다
4. 브리지가 연결되어 있는 동안 라이브 이벤트가 메모리에 큐잉됩니다
5. Claude 채널 모드가 활성화되어 있으면, 같은 세션이 Claude 전용 푸시 알림도 받을 수 있습니다

중요한 동작:

- 라이브 큐 상태는 브리지가 연결될 때부터 시작됩니다
- 이전 transcript 기록은 `messages_read`로 읽습니다
- Claude 푸시 알림은 MCP 세션이 살아 있는 동안에만 존재합니다
- 클라이언트 연결이 끊기면 브리지가 종료되고 라이브 큐도 사라집니다
- OpenClaw가 시작한 stdio MCP 서버(번들 또는 사용자 구성)는 종료 시 프로세스 트리로 정리되므로, 서버가 시작한 자식 서브프로세스는 상위 stdio 클라이언트가 종료된 뒤에도 남아 있지 않습니다
- 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트도 정리되므로, 제거된 세션에 묶인 stdio 연결이 남지 않습니다

## 클라이언트 모드 선택

같은 브리지를 두 가지 방식으로 사용할 수 있습니다:

- 일반 MCP 클라이언트: 표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, 승인 도구를 사용하세요.
- Claude Code: 표준 MCP 도구에 Claude 전용 채널 어댑터가 추가됩니다. `--claude-channel-mode on`을 활성화하거나 기본값인 `auto`를 그대로 두세요.

현재 `auto`는 `on`과 동일하게 동작합니다. 아직 클라이언트 기능 감지는 없습니다.

## `serve`가 노출하는 것

브리지는 기존 Gateway 세션 라우트 메타데이터를 사용해 채널 기반 대화를 노출합니다. 다음과 같은 알려진 라우트가 있는 세션 상태가 OpenClaw에 이미 존재하면 대화가 나타납니다:

- `channel`
- recipient 또는 destination 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한 곳에서 다음 작업을 수행할 수 있습니다:

- 최근 라우팅된 대화 나열
- 최근 transcript 기록 읽기
- 새 수신 이벤트 대기
- 같은 라우트를 통해 답장 보내기
- 브리지가 연결된 동안 도착한 승인 요청 보기

## 사용법

```bash
# 로컬 Gateway
openclaw mcp serve

# 원격 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 비밀번호 인증을 사용하는 원격 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 자세한 브리지 로그 활성화
openclaw mcp serve --verbose

# Claude 전용 푸시 알림 비활성화
openclaw mcp serve --claude-channel-mode off
```

## 브리지 도구

현재 브리지는 다음 MCP 도구를 노출합니다:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gateway 세션 상태에 이미 라우트 메타데이터가 있는 최근 세션 기반 대화를 나열합니다.

유용한 필터:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key`로 하나의 대화를 반환합니다.

### `messages_read`

하나의 세션 기반 대화에 대한 최근 transcript 메시지를 읽습니다.

### `attachments_fetch`

하나의 transcript 메시지에서 텍스트가 아닌 메시지 콘텐츠 블록을 추출합니다. 이는 독립적인 영속 첨부파일 blob 저장소가 아니라 transcript 콘텐츠에 대한 메타데이터 보기입니다.

### `events_poll`

숫자 커서 이후 큐에 쌓인 라이브 이벤트를 읽습니다.

### `events_wait`

다음으로 일치하는 큐 이벤트가 도착하거나 타임아웃이 만료될 때까지 롱폴링합니다.

일반 MCP 클라이언트가 Claude 전용 푸시 프로토콜 없이 거의 실시간 전달이 필요할 때 사용하세요.

### `messages_send`

세션에 이미 기록된 동일한 라우트를 통해 텍스트를 전송합니다.

현재 동작:

- 기존 대화 라우트가 필요합니다
- 세션의 채널, recipient, account id, thread id를 사용합니다
- 텍스트만 전송합니다

### `permissions_list_open`

브리지가 Gateway에 연결된 이후 관찰한 대기 중인 exec/plugin 승인 요청을 나열합니다.

### `permissions_respond`

다음 값 중 하나로 하나의 대기 중인 exec/plugin 승인 요청을 처리합니다:

- `allow-once`
- `allow-always`
- `deny`

## 이벤트 모델

브리지는 연결되어 있는 동안 메모리 내 이벤트 큐를 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

중요한 제한:

- 큐는 라이브 전용이며, MCP 브리지가 시작될 때부터 시작됩니다
- `events_poll`과 `events_wait`는 이전 Gateway 기록을 자체적으로 재생하지 않습니다
- 영속적인 backlog는 `messages_read`로 읽어야 합니다

## Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이것은 Claude Code 채널 어댑터에 해당하는 OpenClaw 측 기능입니다. 표준 MCP 도구는 계속 사용할 수 있고, 라이브 수신 메시지도 Claude 전용 MCP 알림으로 도착할 수 있습니다.

플래그:

- `--claude-channel-mode off`: 표준 MCP 도구만 사용
- `--claude-channel-mode on`: Claude 채널 알림 활성화
- `--claude-channel-mode auto`: 현재 기본값, `on`과 같은 브리지 동작

Claude 채널 모드가 활성화되면, 서버는 Claude 실험적 기능을 알리고 다음을 내보낼 수 있습니다:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- 수신 `user` transcript 메시지는 `notifications/claude/channel`로 전달됩니다
- MCP를 통해 받은 Claude 권한 요청은 메모리에서 추적됩니다
- 연결된 대화에서 이후 `yes abcde` 또는 `no abcde`를 보내면, 브리지는 이를 `notifications/claude/channel/permission`으로 변환합니다
- 이 알림들은 라이브 세션 전용이며, MCP 클라이언트 연결이 끊기면 푸시 대상도 없어집니다

이는 의도적으로 클라이언트 전용입니다. 일반 MCP 클라이언트는 표준 폴링 도구에 의존해야 합니다.

## MCP 클라이언트 구성

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

대부분의 일반 MCP 클라이언트는 표준 도구 표면부터 시작하고 Claude 모드는 무시하면 됩니다. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에서만 Claude 모드를 켜세요.

## 옵션

`openclaw mcp serve`는 다음을 지원합니다:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--token-file <path>`: 파일에서 토큰 읽기
- `--password <password>`: Gateway 비밀번호
- `--password-file <path>`: 파일에서 비밀번호 읽기
- `--claude-channel-mode <auto|on|off>`: Claude 알림 모드
- `-v`, `--verbose`: stderr로 자세한 로그 출력

가능하면 인라인 비밀값보다 `--token-file` 또는 `--password-file`을 권장합니다.

## 보안 및 신뢰 경계

브리지는 라우팅을 새로 만들어내지 않습니다. Gateway가 이미 라우팅 방법을 알고 있는 대화만 노출합니다.

즉:

- 발신자 허용 목록, 페어링, 채널 수준 신뢰는 여전히 기본 OpenClaw 채널 구성에 속합니다
- `messages_send`는 기존에 저장된 라우트를 통해서만 답장할 수 있습니다
- 승인 상태는 현재 브리지 세션에서만 라이브/메모리 내에 존재합니다
- 브리지 인증에는 다른 원격 Gateway 클라이언트에 대해 신뢰할 것과 동일한 Gateway 토큰 또는 비밀번호 제어를 사용해야 합니다

`conversations_list`에 대화가 나타나지 않는다면, 원인은 보통 MCP 구성이 아닙니다. 기본 Gateway 세션에 라우트 메타데이터가 없거나 불완전한 경우가 대부분입니다.

## 테스트

OpenClaw는 이 브리지를 위한 결정적 Docker 스모크 테스트를 제공합니다:

```bash
pnpm test:docker:mcp-channels
```

이 스모크 테스트는 다음을 수행합니다:

- 시드된 Gateway 컨테이너를 시작합니다
- `openclaw mcp serve`를 실행하는 두 번째 컨테이너를 시작합니다
- 대화 검색, transcript 읽기, 첨부파일 메타데이터 읽기, 라이브 이벤트 큐 동작, outbound 전송 라우팅을 검증합니다
- 실제 stdio MCP 브리지를 통해 Claude 스타일 채널 및 권한 알림을 검증합니다

실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고 브리지가 동작함을 증명하는 가장 빠른 방법입니다.

더 넓은 테스트 맥락은 [Testing](/ko/help/testing)을 참조하세요.

## 문제 해결

### 반환되는 대화가 없음

보통 Gateway 세션이 아직 라우팅 가능한 상태가 아니라는 뜻입니다. 기본 세션에 채널/provider, recipient, 선택적 account/thread 라우트 메타데이터가 저장되어 있는지 확인하세요.

### `events_poll` 또는 `events_wait`가 이전 메시지를 놓침

예상된 동작입니다. 라이브 큐는 브리지가 연결될 때부터 시작됩니다. 이전 transcript 기록은 `messages_read`로 읽으세요.

### Claude 알림이 표시되지 않음

다음을 모두 확인하세요:

- 클라이언트가 stdio MCP 세션을 계속 열어 두고 있는지
- `--claude-channel-mode`가 `on` 또는 `auto`인지
- 클라이언트가 실제로 Claude 전용 알림 메서드를 이해하는지
- 수신 메시지가 브리지 연결 이후에 발생했는지

### 승인이 표시되지 않음

`permissions_list_open`은 브리지가 연결되어 있는 동안 관찰한 승인 요청만 보여줍니다. 이는 영속적인 승인 기록 API가 아닙니다.

## MCP 클라이언트 레지스트리로서의 OpenClaw

이것은 `openclaw mcp list`, `show`, `set`, `unset` 경로입니다.

이 명령들은 OpenClaw를 MCP를 통해 노출하지 않습니다. 대신 OpenClaw config의 `mcp.servers` 아래에 있는 OpenClaw 소유 MCP 서버 정의를 관리합니다.

이렇게 저장된 정의는 나중에 OpenClaw가 시작하거나 구성하는 런타임(예: 내장 Pi 및 기타 런타임 어댑터)을 위한 것입니다. OpenClaw는 이러한 정의를 중앙에서 저장하므로, 각 런타임이 자체적으로 중복된 MCP 서버 목록을 유지할 필요가 없습니다.

중요한 동작:

- 이 명령들은 OpenClaw config만 읽거나 씁니다
- 대상 MCP 서버에 연결하지 않습니다
- 명령, URL 또는 원격 전송이 지금 실제로 도달 가능한지 검증하지 않습니다
- 어떤 전송 형태를 실제 실행 시 지원할지는 런타임 어댑터가 결정합니다
- 내장 Pi는 구성된 MCP 도구를 일반 `coding` 및 `messaging` 도구 프로필에 노출합니다. `minimal`은 여전히 이를 숨기며, `tools.deny: ["bundle-mcp"]`는 이를 명시적으로 비활성화합니다

## 저장된 MCP 서버 정의

OpenClaw는 OpenClaw 관리 MCP 정의가 필요한 표면을 위해 config에 경량 MCP 서버 레지스트리도 저장합니다.

명령:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

참고:

- `list`는 서버 이름을 정렬합니다.
- 이름 없이 `show`를 실행하면 전체 구성된 MCP 서버 객체를 출력합니다.
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

### Stdio 전송

로컬 자식 프로세스를 시작하고 stdin/stdout을 통해 통신합니다.

| 필드                       | 설명                              |
| -------------------------- | --------------------------------- |
| `command`                  | 실행할 실행 파일(필수)            |
| `args`                     | 명령줄 인자 배열                  |
| `env`                      | 추가 환경 변수                    |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리          |

#### Stdio env 안전 필터

OpenClaw는 서버의 `env` 블록에 포함되어 있더라도, 첫 번째 RPC 이전에 stdio MCP 서버가 시작되는 방식을 바꿀 수 있는 인터프리터 시작 환경 키를 거부합니다. 차단되는 키에는 `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` 및 유사한 런타임 제어 변수가 포함됩니다. 시작 시 이러한 키는 구성 오류로 거부되므로, 암묵적 프렐류드 주입, 인터프리터 교체, stdio 프로세스에 대한 디버거 활성화를 할 수 없습니다. 일반적인 자격 증명, 프록시, 서버별 환경 변수(`GITHUB_TOKEN`, `HTTP_PROXY`, 사용자 지정 `*_API_KEY` 등)는 영향을 받지 않습니다.

MCP 서버가 차단된 변수 중 하나를 정말로 필요로 한다면, stdio 서버의 `env` 아래가 아니라 gateway 호스트 프로세스에서 설정하세요.

### SSE / HTTP 전송

HTTP Server-Sent Events를 통해 원격 MCP 서버에 연결합니다.

| 필드                  | 설명                                                          |
| --------------------- | ------------------------------------------------------------- |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                         |
| `headers`             | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                     |
| `connectionTimeoutMs` | 서버별 연결 타임아웃(ms, 선택 사항)                           |

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

`url`의 민감한 값(userinfo)과 `headers`의 민감한 값은 로그와 상태 출력에서 마스킹됩니다.

### Streamable HTTP 전송

`streamable-http`는 `sse`, `stdio`와 함께 사용할 수 있는 추가 전송 옵션입니다. 원격 MCP 서버와의 양방향 통신에 HTTP 스트리밍을 사용합니다.

| 필드                  | 설명                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                |
| `transport`           | 이 전송을 선택하려면 `"streamable-http"`로 설정합니다. 생략하면 OpenClaw는 `sse`를 사용합니다 |
| `headers`             | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                                            |
| `connectionTimeoutMs` | 서버별 연결 타임아웃(ms, 선택 사항)                                                  |

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

이 명령들은 저장된 config만 관리합니다. 채널 브리지를 시작하거나, 라이브 MCP 클라이언트 세션을 열거나, 대상 서버에 도달 가능한지 증명하지는 않습니다.

## 현재 제한 사항

이 페이지는 현재 배포된 브리지를 기준으로 설명합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 라우트 메타데이터에 의존합니다
- Claude 전용 어댑터 외에는 일반적인 푸시 프로토콜이 없습니다
- 아직 메시지 편집 또는 반응 도구가 없습니다
- HTTP/SSE/streamable-http 전송은 단일 원격 서버에 연결하며, 아직 다중 업스트림은 지원하지 않습니다
- `permissions_list_open`에는 브리지가 연결된 동안 관찰된 승인만 포함됩니다
