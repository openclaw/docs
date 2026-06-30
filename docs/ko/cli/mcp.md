---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결하기
    - '`openclaw mcp serve` 실행 중'
    - OpenClaw에 저장된 MCP 서버 정의 관리
sidebarTitle: MCP
summary: MCP를 통해 OpenClaw 채널 대화를 노출하고 저장된 MCP 서버 정의 관리
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:10:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp`에는 두 가지 역할이 있습니다.

- `openclaw mcp serve`로 OpenClaw를 MCP 서버로 실행
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, `unset`으로 OpenClaw가 관리하는 아웃바운드 MCP 서버 정의 관리

즉:

- `serve`는 OpenClaw가 MCP 서버로 동작하는 것입니다
- 다른 하위 명령은 OpenClaw가 런타임이 나중에 사용할 수 있는 MCP 서버의 MCP 클라이언트 측 레지스트리로 동작하는 것입니다

<Note>
  `list`, `show`, `set`, `unset`은 OpenClaw config에서 OpenClaw가 관리하는 `mcp.servers` 항목만 읽고 씁니다. `config/mcporter.json`의 mcporter 서버는 포함하지 않습니다. 해당 레지스트리에는 `mcporter list`를 사용하세요.
</Note>

OpenClaw가 코딩 하네스 세션을 직접 호스트하고 해당 런타임을 ACP를 통해 라우팅해야 할 때는 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## 올바른 MCP 경로 선택

OpenClaw에는 여러 MCP 표면이 있습니다. 에이전트 런타임의 소유자와 도구의 소유자에 맞는 것을 선택하세요.

| 목표                                                                | 사용                                                                  | 이유                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 외부 MCP 클라이언트가 OpenClaw 채널 대화를 읽거나 보내도록 허용 | `openclaw mcp serve`                                                 | OpenClaw가 MCP 서버이며 stdio를 통해 Gateway 기반 대화를 노출합니다.                                 |
| OpenClaw가 관리하는 에이전트 실행을 위해 타사 MCP 서버 저장        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw가 MCP 클라이언트 측 레지스트리이며 나중에 해당 서버를 적격 런타임에 투영합니다.               |
| 에이전트 턴을 실행하지 않고 저장된 서버 확인                  | `openclaw mcp status`, `doctor`, `probe`                             | `status`와 `doctor`는 config를 검사하고, `probe`는 실시간 MCP 연결을 열어 기능을 나열합니다.               |
| 브라우저에서 MCP config 편집                                      | Control UI `/mcp`                                                    | 이 페이지는 인벤토리, 활성화 상태, OAuth/필터 요약, 명령 힌트, 범위가 지정된 `mcp` 편집기를 표시합니다.         |
| Codex 앱 서버에 범위가 지정된 네이티브 MCP 서버 제공                    | `mcp.servers.<name>.codex`                                           | `codex` 블록은 Codex 앱 서버 스레드 투영에만 영향을 주며 네이티브 config 전달 전에 제거됩니다. |
| ACP 호스트 하네스 세션 실행                                     | [`openclaw acp`](/ko/cli/acp) 및 [ACP 에이전트](/ko/tools/acp-agents-setup) | ACP 브리지 모드는 세션별 MCP 서버 주입을 허용하지 않습니다. 대신 gateway/Plugin 브리지를 구성하세요.     |

<Tip>
필요한 경로가 확실하지 않다면 `openclaw mcp status --verbose`로 시작하세요. MCP 서버를 시작하지 않고 OpenClaw가 저장한 내용을 보여줍니다.
</Tip>

## MCP 서버로서의 OpenClaw

이것은 `openclaw mcp serve` 경로입니다.

### `serve`를 사용할 때

다음과 같은 경우 `openclaw mcp serve`를 사용하세요.

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 할 때
- 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 이미 있을 때
- 채널별 브리지를 별도로 실행하는 대신 OpenClaw의 채널 백엔드 전반에서 작동하는 하나의 MCP 서버를 원할 때

OpenClaw가 코딩 런타임 자체를 호스트하고 에이전트 세션을 OpenClaw 내부에 유지해야 할 때는 대신 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

### 작동 방식

`openclaw mcp serve`는 stdio MCP 서버를 시작합니다. MCP 클라이언트가 해당 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 둔 동안 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고, 라우팅된 채널 대화를 MCP로 노출합니다.

<Steps>
  <Step title="클라이언트가 브리지를 시작">
    MCP 클라이언트가 `openclaw mcp serve`를 시작합니다.
  </Step>
  <Step title="브리지가 Gateway에 연결">
    브리지가 WebSocket을 통해 OpenClaw Gateway에 연결합니다.
  </Step>
  <Step title="세션이 MCP 대화가 됨">
    라우팅된 세션이 MCP 대화와 transcript/history 도구가 됩니다.
  </Step>
  <Step title="실시간 이벤트 큐">
    브리지가 연결된 동안 실시간 이벤트가 메모리에 큐잉됩니다.
  </Step>
  <Step title="선택적 Claude 푸시">
    Claude 채널 모드가 활성화된 경우 같은 세션이 Claude 전용 푸시 알림도 받을 수 있습니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="중요한 동작">
    - 실시간 큐 상태는 브리지가 연결될 때 시작됩니다
    - 이전 transcript 기록은 `messages_read`로 읽습니다
    - Claude 푸시 알림은 MCP 세션이 살아 있는 동안에만 존재합니다
    - 클라이언트 연결이 끊기면 브리지는 종료되고 실시간 큐는 사라집니다
    - `openclaw agent` 및 `openclaw infer model run` 같은 일회성 에이전트 진입점은 응답이 완료되면 자신이 연 번들 MCP 런타임을 종료하므로 반복된 스크립트 실행이 stdio MCP 자식 프로세스를 누적하지 않습니다
    - OpenClaw가 시작한 stdio MCP 서버(번들 또는 사용자 구성)는 종료 시 프로세스 트리로 정리되므로, 서버가 시작한 자식 하위 프로세스는 부모 stdio 클라이언트가 종료된 뒤에도 남아 있지 않습니다
    - 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트가 해제되므로, 제거된 세션에 묶인 stdio 연결이 남지 않습니다

  </Accordion>
</AccordionGroup>

### 클라이언트 모드 선택

같은 브리지를 두 가지 방식으로 사용할 수 있습니다.

<Tabs>
  <Tab title="일반 MCP 클라이언트">
    표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, 승인 도구를 사용하세요.
  </Tab>
  <Tab title="Claude Code">
    표준 MCP 도구에 Claude 전용 채널 어댑터를 더합니다. `--claude-channel-mode on`을 활성화하거나 기본값 `auto`를 그대로 두세요.
  </Tab>
</Tabs>

<Note>
현재 `auto`는 `on`과 동일하게 동작합니다. 아직 클라이언트 기능 감지는 없습니다.
</Note>

### `serve`가 노출하는 것

브리지는 기존 Gateway 세션 라우트 메타데이터를 사용하여 채널 기반 대화를 노출합니다. OpenClaw에 다음과 같은 알려진 라우트가 포함된 세션 상태가 이미 있으면 대화가 나타납니다.

- `channel`
- 수신자 또는 대상 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한곳에서 다음을 수행할 수 있습니다.

- 최근 라우팅된 대화 나열
- 최근 transcript 기록 읽기
- 새 인바운드 이벤트 대기
- 같은 라우트를 통해 답장 보내기
- 브리지가 연결된 동안 도착하는 승인 요청 보기

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
  <Tab title="자세한 출력 / Claude 끄기">
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
    직접 Gateway 세션 조회를 사용하여 `session_key`로 대화 하나를 반환합니다.
  </Accordion>
  <Accordion title="messages_read">
    세션 기반 대화 하나의 최근 transcript 메시지를 읽습니다.
  </Accordion>
  <Accordion title="attachments_fetch">
    transcript 메시지 하나에서 텍스트가 아닌 메시지 콘텐츠 블록을 추출합니다. 이것은 transcript 콘텐츠에 대한 메타데이터 보기이며, 독립적인 영구 첨부 파일 blob 저장소가 아닙니다.
  </Accordion>
  <Accordion title="events_poll">
    숫자 커서 이후 큐잉된 실시간 이벤트를 읽습니다.
  </Accordion>
  <Accordion title="events_wait">
    다음으로 일치하는 큐잉된 이벤트가 도착하거나 제한 시간이 만료될 때까지 long-poll합니다.

    일반 MCP 클라이언트가 Claude 전용 푸시 프로토콜 없이 거의 실시간에 가까운 전달이 필요할 때 사용하세요.

  </Accordion>
  <Accordion title="messages_send">
    세션에 이미 기록된 같은 라우트를 통해 텍스트를 다시 보냅니다.

    현재 동작:

    - 기존 대화 라우트가 필요합니다
    - 세션의 채널, 수신자, 계정 ID, 스레드 ID를 사용합니다
    - 텍스트만 보냅니다

  </Accordion>
  <Accordion title="permissions_list_open">
    브리지가 Gateway에 연결된 이후 관찰한 대기 중인 exec/Plugin 승인 요청을 나열합니다.
  </Accordion>
  <Accordion title="permissions_respond">
    대기 중인 exec/Plugin 승인 요청 하나를 다음 중 하나로 해결합니다.

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 이벤트 모델

브리지는 연결된 동안 인메모리 이벤트 큐를 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 큐는 실시간 전용입니다. MCP 브리지가 시작될 때 시작됩니다
- `events_poll`과 `events_wait`는 이전 Gateway 기록을 자체적으로 재생하지 않습니다
- 영구 백로그는 `messages_read`로 읽어야 합니다

</Warning>

### Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이것은 Claude Code 채널 어댑터에 해당하는 OpenClaw 방식입니다. 표준 MCP 도구는 계속 사용할 수 있지만, 실시간 인바운드 메시지도 Claude 전용 MCP 알림으로 도착할 수 있습니다.

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

Claude 채널 모드가 활성화되면 서버는 Claude 실험적 기능을 광고하고 다음을 내보낼 수 있습니다.

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- 인바운드 `user` transcript 메시지는 `notifications/claude/channel`로 전달됩니다
- MCP를 통해 받은 Claude 권한 요청은 메모리에서 추적됩니다
- 연결된 대화의 명령 소유자가 나중에 `yes abcde` 또는 `no abcde`를 보내면 브리지는 이를 `notifications/claude/channel/permission`으로 변환합니다
- 이러한 알림은 실시간 세션 전용입니다. MCP 클라이언트 연결이 끊기면 푸시 대상이 없습니다

이는 의도적으로 클라이언트 전용입니다. 일반 MCP 클라이언트는 표준 폴링 도구에 의존해야 합니다.

### MCP 클라이언트 config

stdio 클라이언트 config 예시:

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

대부분의 일반 MCP 클라이언트는 표준 도구 표면으로 시작하고 Claude 모드는 무시하세요. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에서만 Claude 모드를 켜세요.

### 옵션

`openclaw mcp serve`는 다음을 지원합니다.

<ParamField path="--url" type="string">
  Gateway WebSocket URL입니다.
</ParamField>
<ParamField path="--token" type="string">
  Gateway 토큰입니다.
</ParamField>
<ParamField path="--token-file" type="string">
  파일에서 토큰을 읽습니다.
</ParamField>
<ParamField path="--password" type="string">
  Gateway 비밀번호입니다.
</ParamField>
<ParamField path="--password-file" type="string">
  파일에서 비밀번호를 읽습니다.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 알림 모드입니다.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr에 자세한 로그를 출력합니다.
</ParamField>

<Tip>
가능하면 인라인 비밀값보다 `--token-file` 또는 `--password-file`을 사용하는 것이 좋습니다.
</Tip>

### 보안 및 신뢰 경계

브리지는 라우팅을 새로 만들지 않습니다. Gateway가 이미 라우팅 방법을 알고 있는 대화만 노출합니다.

즉, 다음을 의미합니다.

- 발신자 허용 목록, 페어링, 채널 수준 신뢰는 여전히 기반 OpenClaw 채널 구성에 속합니다.
- `messages_send`는 기존에 저장된 라우트를 통해서만 답장할 수 있습니다.
- 승인 상태는 현재 브리지 세션에 대해서만 라이브/인메모리입니다.
- 브리지 인증은 다른 원격 Gateway 클라이언트에 신뢰할 수 있는 것과 동일한 Gateway 토큰 또는 비밀번호 제어를 사용해야 합니다.

`conversations_list`에 대화가 없으면 일반적인 원인은 MCP 구성이 아닙니다. 기반 Gateway 세션의 라우트 메타데이터가 없거나 불완전한 것입니다.

### 테스트

OpenClaw는 이 브리지를 위한 결정적 Docker 스모크 테스트를 제공합니다.

```bash
pnpm test:docker:mcp-channels
```

이 스모크 테스트는 다음을 수행합니다.

- 시드된 Gateway 컨테이너를 시작합니다.
- `openclaw mcp serve`를 실행하는 두 번째 컨테이너를 시작합니다.
- 대화 검색, 트랜스크립트 읽기, 첨부 파일 메타데이터 읽기, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅을 검증합니다.
- 실제 stdio MCP 브리지를 통해 Claude 스타일 채널 및 권한 알림을 검증합니다.

이는 실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고 브리지가 작동하는지 증명하는 가장 빠른 방법입니다.

더 넓은 테스트 맥락은 [테스트](/ko/help/testing)를 참조하세요.

### 문제 해결

<AccordionGroup>
  <Accordion title="반환된 대화가 없음">
    일반적으로 Gateway 세션이 아직 라우팅 가능하지 않다는 뜻입니다. 기반 세션에 저장된 채널/제공자, 수신자, 선택적 계정/스레드 라우트 메타데이터가 있는지 확인하세요.
  </Accordion>
  <Accordion title="events_poll 또는 events_wait가 이전 메시지를 놓침">
    예상된 동작입니다. 라이브 큐는 브리지가 연결될 때 시작됩니다. 이전 트랜스크립트 기록은 `messages_read`로 읽으세요.
  </Accordion>
  <Accordion title="Claude 알림이 표시되지 않음">
    다음을 모두 확인하세요.

    - 클라이언트가 stdio MCP 세션을 열린 상태로 유지했습니다.
    - `--claude-channel-mode`가 `on` 또는 `auto`입니다.
    - 클라이언트가 실제로 Claude 전용 알림 메서드를 이해합니다.
    - 인바운드 메시지가 브리지 연결 후에 발생했습니다.

  </Accordion>
  <Accordion title="승인이 없음">
    `permissions_list_open`은 브리지가 연결되어 있는 동안 관찰된 승인 요청만 표시합니다. 지속적인 승인 기록 API가 아닙니다.
  </Accordion>
</AccordionGroup>

## MCP 클라이언트 레지스트리로서의 OpenClaw

이는 `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, `unset` 경로입니다.

이 명령들은 OpenClaw를 MCP를 통해 노출하지 않습니다. OpenClaw 구성의 `mcp.servers` 아래에서 OpenClaw가 관리하는 MCP 서버 정의를 관리합니다. `config/mcporter.json`에서 mcporter 서버를 읽지 않습니다.

저장된 정의는 임베디드 OpenClaw 및 다른 런타임 어댑터처럼 OpenClaw가 나중에 실행하거나 구성하는 런타임을 위한 것입니다. OpenClaw는 해당 런타임이 자체 중복 MCP 서버 목록을 유지할 필요가 없도록 정의를 중앙에 저장합니다.

<AccordionGroup>
  <Accordion title="중요 동작">
    - 이 명령들은 OpenClaw 구성만 읽거나 씁니다.
    - `--probe` 없는 `status`, `list`, `show`, `doctor`, `set`, `configure`, `tools`, `logout`, `reload`, `unset`은 대상 MCP 서버에 연결하지 않습니다.
    - `login`은 구성된 HTTP 서버에 대해 MCP OAuth 네트워크 흐름을 수행하고 결과 로컬 자격 증명을 저장합니다.
    - `status --verbose`는 연결하지 않고 해석된 전송, 인증, 시간 제한, 필터, 병렬 도구 호출 힌트를 출력합니다.
    - `doctor`는 누락된 stdio 명령, 잘못된 작업 디렉터리, 누락된 TLS 파일, 비활성화된 서버, 리터럴 민감 헤더/env 값, 불완전한 OAuth 승인 같은 로컬 설정 문제에 대해 저장된 정의를 검사합니다.
    - `doctor --probe`는 정적 검사가 통과한 뒤 `probe`와 동일한 라이브 연결 증명을 추가합니다.
    - `probe`는 선택한 서버 또는 구성된 모든 서버에 연결하고, 도구를 나열하며, 기능/진단을 보고합니다.
    - `add`는 플래그에서 정의를 만들고 저장하기 전에 프로브합니다. 단, `--no-probe`가 설정되었거나 OAuth 승인이 먼저 필요한 경우는 제외합니다.
    - 런타임 어댑터는 실행 시점에 실제로 지원하는 전송 형태를 결정합니다.
    - `enabled: false`는 서버를 저장된 상태로 유지하지만 임베디드 런타임 검색에서 제외합니다.
    - `timeout` 및 `connectTimeout`은 서버별 요청 및 연결 시간 제한을 초 단위로 설정합니다.
    - `supportsParallelToolCalls: true`는 어댑터가 동시에 호출할 수 있는 서버를 표시합니다.
    - HTTP 서버는 정적 헤더, OAuth 로그인, TLS 검증 제어, mTLS 인증서/키 경로를 사용할 수 있습니다.
    - 임베디드 OpenClaw는 구성된 MCP 도구를 일반 `coding` 및 `messaging` 도구 프로필에 노출합니다. `minimal`은 여전히 이를 숨기며, `tools.deny: ["bundle-mcp"]`는 이를 명시적으로 비활성화합니다.
    - 서버별 `toolFilter.include` 및 `toolFilter.exclude`는 발견된 MCP 도구가 OpenClaw 도구가 되기 전에 필터링합니다.
    - 리소스 또는 프롬프트를 광고하는 서버는 리소스 나열/읽기 및 프롬프트 나열/가져오기를 위한 유틸리티 도구도 노출합니다. 생성된 유틸리티 이름(`resources_list`, `resources_read`, `prompts_list`, `prompts_get`)은 동일한 include/exclude 필터를 사용합니다.
    - 동적 MCP 도구 목록 변경은 해당 세션의 캐시된 카탈로그를 무효화합니다. 다음 검색/사용 시 서버에서 새로 고칩니다.
    - 반복되는 MCP 도구 요청/프로토콜 실패는 하나의 고장 난 서버가 전체 턴을 소비하지 않도록 해당 서버를 잠시 일시 중지합니다.
    - 세션 범위 번들 MCP 런타임은 유휴 시간이 `mcp.sessionIdleTtlMs`밀리초를 지나면 정리됩니다(기본값 10분, 비활성화하려면 `0` 설정). 일회성 임베디드 실행은 실행 종료 시 이를 정리합니다.

  </Accordion>
</AccordionGroup>

런타임 어댑터는 이 공유 레지스트리를 다운스트림 클라이언트가 기대하는 형태로 정규화할 수 있습니다. 예를 들어 임베디드 OpenClaw는 OpenClaw `transport` 값을 직접 소비하지만, Claude Code와 Gemini는 `http`, `sse`, `stdio` 같은 CLI 네이티브 `type` 값을 받습니다.

Codex app-server도 각 서버의 선택적 `codex` 블록을 존중합니다. 이는
Codex app-server 스레드 전용 OpenClaw 투영 메타데이터입니다. ACP 세션,
일반 Codex 하네스 구성 또는 다른 런타임 어댑터를 변경하지 않습니다.
서버를 특정 OpenClaw 에이전트 ID에만 투영하려면 비어 있지 않은
`codex.agents`를 사용하세요. 비어 있거나 공백이거나 잘못된 에이전트
목록은 구성 검증에서 거부되며, 전역이 되는 대신 런타임 투영 경로에서
생략됩니다. 신뢰할 수 있는 서버에 대해 Codex의 네이티브
`default_tools_approval_mode`를 내보내려면 `codex.defaultToolsApprovalMode`
(`auto`, `prompt`, `approve`)를 사용하세요. OpenClaw는 네이티브
`mcp_servers` 구성을 Codex에 전달하기 전에 `codex` 메타데이터를 제거합니다.

### 저장된 MCP 서버 정의

OpenClaw는 OpenClaw가 관리하는 MCP 정의를 원하는 표면을 위해 구성에 경량 MCP 서버 레지스트리도 저장합니다.

명령:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

참고:

- `list`는 서버 이름을 정렬합니다.
- 이름 없이 `show`를 실행하면 전체 구성된 MCP 서버 객체를 출력합니다.
- `status`는 연결하지 않고 구성된 전송을 분류합니다. `--verbose`는 해석된 실행, 시간 제한, OAuth, 필터, 병렬 호출 세부 정보를 포함합니다.
- `doctor`는 연결하지 않고 정적 검사를 수행합니다. 명령이 활성화된 서버의 연결도 검증해야 할 때 `--probe`를 추가하세요.
- `probe`는 연결하고 도구 수, 리소스/프롬프트 지원, 목록 변경 지원, 진단을 보고합니다.
- `add`는 `--command`, `--arg`, `--env`, `--cwd` 같은 stdio 플래그 또는 `--url`, `--transport`, `--header`, `--auth oauth`, TLS, 시간 제한, 도구 선택 플래그 같은 HTTP 플래그를 받습니다.
- `set`은 명령줄에서 하나의 JSON 객체 값을 기대합니다.
- `configure`는 전체 서버 정의를 교체하지 않고 활성화 여부, 도구 필터, 시간 제한, OAuth, TLS, 병렬 도구 호출 힌트를 업데이트합니다.
- `tools`는 서버별 도구 필터를 업데이트합니다. include/exclude 항목은 MCP 도구 이름 및 간단한 `*` 글롭입니다.
- `login`은 `auth: "oauth"`로 구성된 HTTP 서버에 대해 OAuth 흐름을 실행합니다. 첫 실행은 승인 URL을 출력합니다. 승인 후 `--code`로 다시 실행하세요.
- `logout`은 저장된 서버 정의를 제거하지 않고 명명된 서버의 저장된 OAuth 자격 증명을 지웁니다.
- `reload`는 캐시된 인프로세스 MCP 런타임을 폐기합니다. 다른 프로세스의 Gateway 또는 에이전트 프로세스에는 여전히 자체 reload 또는 restart 경로가 필요합니다.
- Streamable HTTP MCP 서버에는 `transport: "streamable-http"`를 사용하세요. `openclaw mcp set`은 호환성을 위해 CLI 네이티브 `type: "http"`도 동일한 표준 구성 형태로 정규화합니다.
- 명명된 서버가 없으면 `unset`은 실패합니다.

예:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### 일반 서버 레시피

이 예시는 서버 정의만 저장합니다. 이후 `openclaw mcp doctor --probe`를 실행해 서버가 시작되고 도구를 노출하는지 증명하세요.

<Tabs>
  <Tab title="파일 시스템">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    파일 시스템 서버의 범위는 에이전트가 읽거나 편집해야 하는 가장 작은 디렉터리 트리로 제한하세요.

  </Tab>
  <Tab title="메모리">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    서버가 일반 에이전트에 제공되어서는 안 되는 쓰기 도구를 노출하는 경우 도구 필터를 사용하세요.

  </Tab>
  <Tab title="로컬 스크립트">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor`는 `cwd`가 존재하는지, 명령이 구성된 환경에서 해석되는지 확인합니다.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    원격 서버가 OAuth를 지원할 때 OAuth를 사용하세요. 서버에 정적 헤더가 필요한 경우 리터럴 bearer 토큰을 커밋하지 마세요.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    직접 데스크톱 제어 서버는 실행하는 프로세스의 권한을 상속합니다. 좁은 도구 필터와 OS 수준 권한 프롬프트를 사용하세요.

  </Tab>
</Tabs>

### JSON 출력 형태

스크립트와 대시보드에는 `--json`을 사용하세요. 필드 집합은 시간이 지나며 확장될 수 있으므로 소비자는 알 수 없는 키를 무시해야 합니다.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    활성화되어 검사된 서버 중 하나라도 오류가 있으면 `doctor --json`은 0이 아닌 코드로 종료됩니다. 경고는 보고되지만 그 자체만으로 명령을 실패시키지는 않습니다.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe`는 실시간 MCP 클라이언트 세션을 엽니다. 정적 구성 감사가 아니라 도달 가능성과 기능 증명에 사용하세요.

  </Accordion>
</AccordionGroup>

예시 구성 형태:

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio 전송

로컬 자식 프로세스를 실행하고 stdin/stdout을 통해 통신합니다.

| 필드                       | 설명                              |
| -------------------------- | --------------------------------- |
| `command`                  | 생성할 실행 파일(필수)           |
| `args`                     | 명령줄 인수 배열                 |
| `env`                      | 추가 환경 변수                   |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리         |

<Warning>
**Stdio env 안전 필터**

OpenClaw는 stdio MCP 서버의 `env` 블록에 나타나더라도, 첫 RPC 전에 해당 서버가 시작되는 방식을 바꿀 수 있는 인터프리터 시작 env 키를 거부합니다. 차단되는 키에는 `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` 및 유사한 런타임 제어 변수가 포함됩니다. 시작 시 이러한 키를 구성 오류로 거부하여 stdio 프로세스에 대해 암시적 prelude를 주입하거나, 인터프리터를 바꾸거나, 디버거를 활성화하거나, 런타임 출력을 리디렉션할 수 없게 합니다. 일반 자격 증명, 프록시, 서버별 env 변수(`GITHUB_TOKEN`, `HTTP_PROXY`, 사용자 지정 `*_API_KEY` 등)는 영향을 받지 않습니다.

MCP 서버에 차단된 변수 중 하나가 실제로 필요하다면 stdio 서버의 `env` 아래가 아니라 Gateway 호스트 프로세스에 설정하세요.
</Warning>

### SSE / HTTP 전송

HTTP Server-Sent Events를 통해 원격 MCP 서버에 연결합니다.

| 필드                           | 설명                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `url`                          | 원격 서버의 HTTP 또는 HTTPS URL(필수)                             |
| `headers`                      | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                          |
| `connectionTimeoutMs`          | 서버별 연결 제한 시간(ms, 선택 사항)                              |
| `connectTimeout`               | 서버별 연결 제한 시간(초, 선택 사항)                              |
| `timeout` / `requestTimeoutMs` | 서버별 MCP 요청 제한 시간(초 또는 ms)                             |
| `auth: "oauth"`                | MCP OAuth 토큰 저장소와 `openclaw mcp login` 사용                 |
| `sslVerify`                    | 명시적으로 신뢰하는 비공개 HTTPS 엔드포인트에만 false로 설정      |
| `clientCert` / `clientKey`     | mTLS 클라이언트 인증서 및 키 경로                                 |
| `supportsParallelToolCalls`    | 이 서버에서 동시 호출이 안전하다는 힌트                           |

예시:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`(userinfo) 및 `headers`의 민감한 값은 로그와 상태 출력에서 가려집니다. 민감해 보이는 `headers` 또는 `env` 항목에 리터럴 값이 포함되어 있으면 `openclaw mcp doctor`가 경고하므로, 운영자는 해당 값을 커밋된 구성 밖으로 이동할 수 있습니다.

### OAuth 워크플로

OAuth는 MCP OAuth 흐름을 알리는 HTTP MCP 서버용입니다. `auth: "oauth"`가 활성화된 동안에는 해당 서버의 정적 `Authorization` 헤더가 무시됩니다.

<Steps>
  <Step title="Save the server">
    `auth: "oauth"`와 선택적 OAuth 메타데이터를 사용해 서버를 추가하거나 업데이트합니다.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    로그인을 실행해 권한 부여 요청을 생성합니다.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw는 권한 부여 URL을 출력하고 임시 OAuth 검증자 상태를 OpenClaw 상태 디렉터리 아래에 저장합니다.

  </Step>
  <Step title="Finish with the code">
    브라우저에서 승인한 뒤 반환된 코드를 OpenClaw에 다시 전달합니다.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    토큰이 있는지 확인하려면 status 또는 doctor를 사용하세요.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    로그아웃은 저장된 OAuth 자격 증명을 제거하지만 저장된 서버 정의는 유지합니다.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

제공자가 토큰을 순환하거나 권한 부여 상태가 멈추면 `openclaw mcp logout <name>`을 실행한 다음 `login`을 반복하세요. 서버 이름과 URL이 여전히 자격 증명 저장소 항목을 식별하는 한, `auth: "oauth"`가 구성에서 제거된 뒤에도 `logout`은 저장된 HTTP 서버의 자격 증명을 지울 수 있습니다.

### Streamable HTTP 전송

`streamable-http`는 `sse` 및 `stdio`와 함께 사용할 수 있는 추가 전송 옵션입니다. 원격 MCP 서버와의 양방향 통신에 HTTP 스트리밍을 사용합니다.

| 필드                           | 설명                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `url`                          | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                 |
| `transport`                    | 이 전송을 선택하려면 `"streamable-http"`로 설정합니다. 생략하면 OpenClaw는 `sse` 사용 |
| `headers`                      | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                                              |
| `connectionTimeoutMs`          | 서버별 연결 제한 시간(ms, 선택 사항)                                                  |
| `connectTimeout`               | 서버별 연결 제한 시간(초, 선택 사항)                                                  |
| `timeout` / `requestTimeoutMs` | 서버별 MCP 요청 제한 시간(초 또는 ms)                                                 |
| `auth: "oauth"`                | MCP OAuth 토큰 저장소와 `openclaw mcp login` 사용                                     |
| `sslVerify`                    | 명시적으로 신뢰하는 비공개 HTTPS 엔드포인트에만 false로 설정                          |
| `clientCert` / `clientKey`     | mTLS 클라이언트 인증서 및 키 경로                                                     |
| `supportsParallelToolCalls`    | 이 서버에서 동시 호출이 안전하다는 힌트                                               |

OpenClaw 구성은 `transport: "streamable-http"`를 표준 표기로 사용합니다. CLI 네이티브 MCP `type: "http"` 값은 `openclaw mcp set`을 통해 저장될 때 허용되고 기존 구성에서는 `openclaw doctor --fix`로 복구되지만, 내장된 OpenClaw가 직접 소비하는 것은 `transport`입니다.

예시:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
레지스트리 명령은 채널 브리지를 시작하지 않습니다. 대상 서버에 도달할 수 있음을 증명하기 위해 실시간 MCP 클라이언트 세션을 여는 것은 `probe`와 `doctor --probe`뿐입니다.
</Note>

## 제어 UI

브라우저 제어 UI에는 `/mcp`에 전용 MCP 설정 페이지가 포함되어 있습니다. 이 페이지는 구성된 서버 수, 활성화/OAuth/필터 요약, 서버별 전송 행, 활성화/비활성화 컨트롤, 일반 CLI 명령, 그리고 `mcp` 구성 섹션용 범위 지정 편집기를 표시합니다.

운영자 편집과 빠른 인벤토리에는 이 페이지를 사용하세요. 실시간 서버 증명이 필요할 때는 `openclaw mcp doctor --probe` 또는 `openclaw mcp probe`를 사용하세요.

운영자 워크플로:

1. Control UI를 열고 **MCP**를 선택합니다.
2. 전체, 활성화됨, OAuth, 필터링된 서버의 요약 카드를 검토합니다.
3. 각 서버 행에서 전송, 인증, 필터, 시간 제한, 명령 힌트를 확인합니다.
4. 정의는 유지하되 런타임 검색에서 제외하려면 활성화 여부를 전환합니다.
5. 새 서버, 헤더, TLS, OAuth 메타데이터, 도구 필터 같은 구조적 변경에는 범위가 지정된 `mcp` 구성 섹션을 편집합니다.
6. 구성만 유지하려면 **저장**을 선택하고, Gateway 구성 경로를 통해 적용하려면 **저장 및 게시**를 선택합니다.
7. 편집한 서버가 시작되고 도구를 나열한다는 실시간 증명이 필요하면 `openclaw mcp doctor --probe`를 실행합니다.

참고:

- 명령 스니펫은 서버 이름을 따옴표로 감싸므로 특이한 이름도 셸에서 복사해 사용할 수 있습니다
- 표시되는 URL 형식 값에 내장 자격 증명이 포함되어 있으면 렌더링 전에 편집 처리됩니다
- 이 페이지는 MCP 전송을 직접 시작하지 않습니다
- 활성 런타임은 어떤 프로세스가 MCP 클라이언트를 소유하는지에 따라 `openclaw mcp reload`, Gateway 구성 게시 또는 프로세스 재시작이 필요할 수 있습니다

## 현재 제한 사항

이 페이지는 현재 제공되는 브리지를 문서화합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 경로 메타데이터에 의존합니다
- Claude 전용 어댑터 외에는 범용 푸시 프로토콜이 없습니다
- 아직 메시지 편집 또는 반응 도구가 없습니다
- HTTP/SSE/streamable-http 전송은 단일 원격 서버에 연결됩니다. 아직 다중화된 업스트림은 없습니다
- `permissions_list_open`에는 브리지가 연결된 동안 관찰된 승인만 포함됩니다

## 관련 항목

- [CLI 참조](/ko/cli)
- [Plugin](/ko/cli/plugins)
