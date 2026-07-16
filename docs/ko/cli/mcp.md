---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결하기
    - 실행 중 `openclaw mcp serve`
    - OpenClaw에 저장된 MCP 서버 정의 관리하기
sidebarTitle: MCP
summary: MCP를 통해 OpenClaw 채널 대화를 제공하고 저장된 MCP 서버 정의를 관리합니다
title: MCP
x-i18n:
    generated_at: "2026-07-16T12:26:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp`에는 두 가지 역할이 있습니다.

- `openclaw mcp serve`을 사용하여 OpenClaw를 MCP 서버로 실행합니다
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, `unset`을 사용하여 OpenClaw가 관리하는 아웃바운드 MCP 서버 정의를 관리합니다

`serve`은 MCP 서버 역할을 하는 OpenClaw입니다. 다른 하위 명령은 자체 런타임에서 나중에 사용할 수 있는 서버를 위한 MCP 클라이언트 측 레지스트리 역할을 하는 OpenClaw입니다.

<Note>
  `list`, `show`, `set`, `unset`은 OpenClaw 구성에서 OpenClaw가 관리하는 `mcp.servers` 항목만 읽고 씁니다. `config/mcporter.json`의 mcporter 서버는 포함하지 않습니다. 해당 레지스트리에는 `mcporter list`을 사용하십시오.
</Note>

OpenClaw가 코딩 하네스 세션 자체를 호스팅하고 해당 런타임을 ACP를 통해 라우팅해야 하는 경우 [`openclaw acp`](/ko/cli/acp)을 사용하십시오.

## 적절한 MCP 경로 선택

| 목표                                                                | 사용                                                                  | 이유                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 외부 MCP 클라이언트가 OpenClaw 채널 대화를 읽고 보내도록 허용 | `openclaw mcp serve`                                                 | OpenClaw가 MCP 서버이며 stdio를 통해 Gateway 기반 대화를 노출합니다.                                 |
| OpenClaw 관리 에이전트 실행을 위해 서드 파티 MCP 서버 저장        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw가 MCP 클라이언트 측 레지스트리이며 나중에 해당 서버를 적합한 런타임에 투영합니다.               |
| 에이전트 턴을 실행하지 않고 저장된 서버 확인                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` 및 `doctor`은 구성을 검사하고, `probe`은 라이브 MCP 연결을 열어 기능을 나열합니다.               |
| 브라우저에서 MCP 구성 편집                                      | Control UI `/settings/mcp` (`/mcp` 별칭)                            | 이 페이지에는 인벤토리, 활성화 상태, OAuth/필터 요약, 명령 힌트 및 범위가 지정된 `mcp` 편집기가 표시됩니다.         |
| Codex app-server에 범위가 지정된 네이티브 MCP 서버 제공                    | `mcp.servers.<name>.codex`                                           | `codex` 블록은 Codex app-server 스레드 투영에만 영향을 주며 네이티브 구성 전달 전에 제거됩니다. |
| ACP 호스팅 하네스 세션 실행                                     | [`openclaw acp`](/ko/cli/acp) 및 [ACP 에이전트](/ko/tools/acp-agents-setup) | ACP 브리지 모드는 세션별 MCP 서버 주입을 허용하지 않습니다. 대신 Gateway/Plugin 브리지를 구성하십시오.     |

<Tip>
필요한 경로를 잘 모르겠다면 `openclaw mcp status --verbose`부터 시작하십시오. MCP 서버를 시작하지 않고 OpenClaw에 저장된 항목을 보여 줍니다.
</Tip>

## MCP 서버로서의 OpenClaw

이는 `openclaw mcp serve` 경로입니다.

### serve를 사용해야 하는 경우

다음과 같은 경우 `openclaw mcp serve`을 사용하십시오.

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 합니다
- 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 이미 있습니다
- 채널별 브리지를 별도로 실행하는 대신 OpenClaw의 여러 채널 백엔드에서 작동하는 하나의 MCP 서버를 사용하려고 합니다

OpenClaw가 코딩 런타임 자체를 호스팅하고 에이전트 세션을 OpenClaw 내부에 유지해야 하는 경우 대신 [`openclaw acp`](/ko/cli/acp)을 사용하십시오.

### 작동 방식

`openclaw mcp serve`은 stdio MCP 서버를 시작합니다. MCP 클라이언트가 해당 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 두는 동안 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고 라우팅된 채널 대화를 MCP를 통해 노출합니다.

<Steps>
  <Step title="클라이언트가 브리지를 생성합니다">
    MCP 클라이언트가 `openclaw mcp serve`을 생성합니다.
  </Step>
  <Step title="브리지가 Gateway에 연결됩니다">
    브리지가 WebSocket을 통해 OpenClaw Gateway에 연결됩니다.
  </Step>
  <Step title="세션이 MCP 대화로 변환됩니다">
    라우팅된 세션이 MCP 대화 및 트랜스크립트/기록 도구로 변환됩니다.
  </Step>
  <Step title="라이브 이벤트가 대기열에 추가됩니다">
    브리지가 연결되어 있는 동안 라이브 이벤트가 메모리의 대기열에 추가됩니다.
  </Step>
  <Step title="선택적 Claude 푸시">
    Claude 채널 모드가 활성화된 경우 같은 세션에서 Claude 전용 푸시 알림도 받을 수 있습니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="중요한 동작">
    - 라이브 대기열 상태는 브리지가 연결될 때 시작됩니다
    - 이전 트랜스크립트 기록은 `messages_read`을 사용하여 읽습니다
    - Claude 푸시 알림은 MCP 세션이 활성 상태인 동안에만 존재합니다
    - 클라이언트의 연결이 끊어지면 브리지가 종료되고 라이브 대기열이 사라집니다
    - `openclaw agent` 및 `openclaw infer model run`과 같은 일회성 에이전트 진입점은 응답이 완료될 때 자신이 연 번들 MCP 런타임을 종료하므로 반복되는 스크립트 실행에서 stdio MCP 자식 프로세스가 누적되지 않습니다
    - OpenClaw가 실행한 stdio MCP 서버는 번들 또는 사용자 구성 여부와 관계없이 종료 시 프로세스 트리 단위로 종료되므로, 서버가 시작한 자식 하위 프로세스는 상위 stdio 클라이언트가 종료된 후에도 남아 있지 않습니다
    - 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트가 폐기되므로, 제거된 세션에 연결된 stdio 연결이 남지 않습니다

  </Accordion>
</AccordionGroup>

### 클라이언트 모드 선택

<Tabs>
  <Tab title="일반 MCP 클라이언트">
    표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` 및 승인 도구를 사용하십시오.
  </Tab>
  <Tab title="Claude Code">
    표준 MCP 도구와 Claude 전용 채널 어댑터를 함께 사용합니다. `--claude-channel-mode on`을 활성화하거나 기본값인 `auto`을 그대로 두십시오.
  </Tab>
</Tabs>

<Note>
현재 `auto`은 `on`과 동일하게 동작합니다. 아직 클라이언트 기능 감지는 지원되지 않습니다.
</Note>

### serve가 노출하는 항목

브리지는 기존 Gateway 세션 경로 메타데이터를 사용하여 채널 기반 대화를 노출합니다. 다음과 같은 알려진 경로를 포함하는 세션 상태가 OpenClaw에 이미 있으면 대화가 표시됩니다.

- `channel`
- 수신자 또는 대상 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한 곳에서 다음 작업을 수행할 수 있습니다.

- 최근 라우팅된 대화 나열
- 최근 트랜스크립트 기록 읽기
- 새 수신 이벤트 대기
- 동일한 경로를 통해 응답 다시 보내기
- 브리지가 연결된 동안 도착한 승인 요청 확인

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
  <Tab title="상세 출력 / Claude 끄기">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 브리지 도구

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway 세션 상태에 경로 메타데이터가 이미 있는 최근 세션 기반 대화를 나열합니다.

    필터: `limit`(최대 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    직접 Gateway 세션 조회를 사용하여 `session_key`별로 대화 하나를 반환합니다.
  </Accordion>
  <Accordion title="messages_read">
    세션 기반 대화 하나의 최근 트랜스크립트 메시지를 읽습니다. `limit`의 기본값은 20이며 최대값은 200입니다.
  </Accordion>
  <Accordion title="attachments_fetch">
    트랜스크립트 메시지 하나에서 텍스트가 아닌 메시지 콘텐츠 블록을 추출합니다. 이는 트랜스크립트 콘텐츠에 대한 메타데이터 보기이며 독립적인 영구 첨부 파일 블롭 저장소가 아닙니다.
  </Accordion>
  <Accordion title="events_poll">
    숫자 커서 이후 대기열에 추가된 라이브 이벤트를 읽습니다. `limit`의 최대값은 200입니다.
  </Accordion>
  <Accordion title="events_wait">
    일치하는 다음 대기 이벤트가 도착하거나 제한 시간이 만료될 때까지 롱 폴링합니다(기본값 30초, 최대 300초).

    일반 MCP 클라이언트에 Claude 전용 푸시 프로토콜 없이 준실시간 전달이 필요한 경우 사용하십시오.

  </Accordion>
  <Accordion title="messages_send">
    세션에 이미 기록된 동일한 경로를 통해 텍스트를 다시 보냅니다.

    현재 동작:

    - 기존 대화 경로가 필요합니다
    - 세션의 채널, 수신자, 계정 ID 및 스레드 ID를 사용합니다
    - 텍스트만 보냅니다

  </Accordion>
  <Accordion title="permissions_list_open">
    브리지가 Gateway에 연결된 이후 관찰한 대기 중인 실행/Plugin 승인 요청을 나열합니다.
  </Accordion>
  <Accordion title="permissions_respond">
    다음 중 하나로 대기 중인 실행/Plugin 승인 요청 하나를 처리합니다.

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 이벤트 모델

브리지는 연결되어 있는 동안 메모리 내 이벤트 대기열을 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 대기열은 라이브 전용이며 MCP 브리지가 시작될 때 시작됩니다
- `events_poll` 및 `events_wait`은 자체적으로 이전 Gateway 기록을 재생하지 않습니다
- 영구 백로그는 `messages_read`을 사용하여 읽어야 합니다

</Warning>

### Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이는 Claude Code 채널 어댑터에 해당하는 OpenClaw 기능입니다. 표준 MCP 도구는 계속 사용할 수 있지만 라이브 수신 메시지가 Claude 전용 MCP 알림으로도 도착할 수 있습니다.

<Tabs>
  <Tab title="끄기">
    `--claude-channel-mode off`: 표준 MCP 도구만 사용합니다.
  </Tab>
  <Tab title="켜기">
    `--claude-channel-mode on`: Claude 채널 알림을 활성화합니다.
  </Tab>
  <Tab title="자동(기본값)">
    `--claude-channel-mode auto`: 현재 기본값이며 브리지 동작은 `on`과 동일합니다.
  </Tab>
</Tabs>

Claude 채널 모드가 활성화되면 서버는 Claude 실험적 기능을 알리고 다음을 내보낼 수 있습니다.

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- 수신 `user` 트랜스크립트 메시지는 `notifications/claude/channel`로 전달됩니다
- MCP를 통해 수신된 Claude 권한 요청은 메모리에서 추적됩니다
- 연결된 대화의 명령 소유자가 나중에 `yes <id>` 또는 `no <id>`을 보내면(`<id>`은 `l`을 제외한 5글자 요청 ID), 브리지는 이를 `notifications/claude/channel/permission`로 변환합니다
- 이러한 알림은 라이브 세션에서만 제공됩니다. MCP 클라이언트의 연결이 끊어지면 푸시 대상이 없습니다

이는 의도적으로 클라이언트별로 동작합니다. 일반 MCP 클라이언트는 표준 폴링 도구를 사용해야 합니다.

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

대부분의 일반 MCP 클라이언트에서는 표준 도구 표면으로 시작하고 Claude 모드는 무시하십시오. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에서만 Claude 모드를 켜십시오.

### 옵션

`openclaw mcp serve`에서 지원하는 항목은 다음과 같습니다.

<ParamField path="--url" type="string">
  Gateway WebSocket URL입니다. 구성된 경우 기본값은 `gateway.remote.url`입니다.
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
  Claude 알림 모드입니다. 기본값은 `auto`입니다.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr에 상세 로그를 출력합니다.
</ParamField>

<Tip>
가능하면 인라인 시크릿보다 `--token-file` 또는 `--password-file`을 사용하십시오.
</Tip>

### 보안 및 신뢰 경계

브리지는 라우팅을 임의로 만들지 않습니다. Gateway가 이미 라우팅하는 방법을 알고 있는 대화만 노출합니다.

이는 다음을 의미합니다.

- 발신자 허용 목록, 페어링 및 채널 수준 신뢰는 여전히 기반 OpenClaw 채널 구성에서 관리합니다.
- `messages_send`은 저장된 기존 경로를 통해서만 응답할 수 있습니다.
- 승인 상태는 현재 브리지 세션에서만 실시간/메모리 내 상태로 유지됩니다.
- 브리지 인증에는 다른 원격 Gateway 클라이언트에 신뢰할 수 있는 것과 동일한 Gateway 토큰 또는 비밀번호 제어를 사용해야 합니다.

`conversations_list`에 대화가 없다면 일반적인 원인은 MCP 구성이 아닙니다. 기반 Gateway 세션의 경로 메타데이터가 없거나 불완전하기 때문입니다.

### 테스트

OpenClaw에는 이 브리지를 위한 결정론적 Docker 스모크 테스트가 포함되어 있습니다.

```bash
pnpm test:docker:mcp-channels
```

이 스모크 테스트는 단일 컨테이너를 실행합니다. 대화 상태를 시드하고 Gateway를 시작한 다음, `openclaw mcp serve`을 stdio 자식 프로세스로 생성하여 MCP 클라이언트로 구동합니다. 실제 stdio MCP 브리지를 통해 대화 검색, 트랜스크립트 읽기, 첨부 파일 메타데이터 읽기, 실시간 이벤트 큐 동작, Claude 스타일 채널 및 권한 알림을 검증합니다. 저장된 대화 경로를 재사용하는 아웃바운드 전송 라우팅(`messages_send`)은 `src/mcp/channel-server.test.ts`의 단위 테스트에서 별도로 다룹니다.

이는 실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고 브리지가 작동함을 입증하는 가장 빠른 방법입니다.

더 광범위한 테스트 맥락은 [테스트](/ko/help/testing)를 참조하십시오.

### 문제 해결

<AccordionGroup>
  <Accordion title="반환된 대화가 없음">
    일반적으로 Gateway 세션을 아직 라우팅할 수 없음을 의미합니다. 기반 세션에 채널/제공자, 수신자 및 선택적 계정/스레드 경로 메타데이터가 저장되어 있는지 확인하십시오.
  </Accordion>
  <Accordion title="events_poll 또는 events_wait에서 이전 메시지를 놓침">
    예상된 동작입니다. 실시간 큐는 브리지가 연결될 때 시작됩니다. `messages_read`을 사용하여 이전 트랜스크립트 기록을 읽으십시오.
  </Accordion>
  <Accordion title="Claude 알림이 표시되지 않음">
    다음을 모두 확인하십시오.

    - 클라이언트가 stdio MCP 세션을 열린 상태로 유지했습니다.
    - `--claude-channel-mode`이 `on` 또는 `auto`입니다.
    - 클라이언트가 실제로 Claude 전용 알림 메서드를 이해합니다.
    - 브리지가 연결된 후 인바운드 메시지가 발생했습니다.

  </Accordion>
  <Accordion title="승인이 없음">
    `permissions_list_open`에는 브리지가 연결되어 있는 동안 관찰된 승인 요청만 표시됩니다. 이는 영구적인 승인 기록 API가 아닙니다.
  </Accordion>
</AccordionGroup>

## MCP 클라이언트 레지스트리로서의 OpenClaw

이는 `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` 및 `unset` 경로입니다.

이 명령들은 MCP를 통해 OpenClaw를 노출하지 않습니다. OpenClaw 구성의 `mcp.servers` 아래에 있는 OpenClaw 관리 MCP 서버 정의를 관리합니다. `config/mcporter.json`에서 mcporter 서버를 읽지 않습니다.

저장된 정의는 임베디드 OpenClaw 및 기타 런타임 어댑터처럼 OpenClaw가 나중에 시작하거나 구성하는 런타임을 위한 것입니다. OpenClaw는 해당 런타임이 자체적으로 중복 MCP 서버 목록을 유지할 필요가 없도록 정의를 중앙에 저장합니다.

<AccordionGroup>
  <Accordion title="중요 동작">
    - 이 명령들은 OpenClaw 구성만 읽거나 씁니다.
    - `--probe`, `set`, `configure`, `tools`, `logout`, `reload` 및 `unset` 없이 실행한 `status`, `list`, `show`, `doctor`은 대상 MCP 서버에 연결하지 않습니다.
    - `login`은 구성된 HTTP 서버에 대해 MCP OAuth 네트워크 흐름을 수행하고 그 결과로 생성된 로컬 자격 증명을 저장합니다.
    - `status --verbose`은 연결하지 않고 확인된 전송, 인증, 시간 제한, 필터 및 병렬 도구 호출 힌트를 출력합니다.
    - `doctor`은 누락된 stdio 명령, 잘못된 작업 디렉터리, 누락된 TLS 파일, 비활성화된 서버, 리터럴 민감 헤더/환경 값 및 불완전한 OAuth 권한 부여와 같은 로컬 설정 문제를 저장된 정의에서 확인합니다.
    - `doctor --probe`은 정적 검사를 통과한 후 `probe`과 동일한 실시간 연결 검증을 추가합니다.
    - `probe`은 선택한 서버 또는 구성된 모든 서버에 연결하고 도구를 나열하며 기능/진단을 보고합니다.
    - `add`은 플래그에서 정의를 구성하고, `--no-probe`이 설정되어 있거나 먼저 OAuth 권한 부여가 필요한 경우가 아니면 저장하기 전에 프로브합니다.
    - 런타임 어댑터는 실행 시점에 실제로 지원할 전송 형식을 결정합니다.
    - `enabled: false`은 서버를 저장된 상태로 유지하지만 임베디드 런타임 검색에서는 제외합니다.
    - `timeout` 및 `connectTimeout`은 서버별 요청 및 연결 시간 제한을 초 단위로 설정합니다.
    - `supportsParallelToolCalls: true`은 어댑터가 동시에 호출할 수 있는 서버를 표시합니다.
    - HTTP 서버는 정적 헤더, OAuth 로그인, TLS 검증 제어 및 mTLS 인증서/키 경로를 사용할 수 있습니다.
    - 임베디드 OpenClaw는 구성된 MCP 도구를 일반 `coding` 및 `messaging` 도구 프로필에 노출합니다. `minimal`은 여전히 해당 도구를 숨기며, `tools.deny: ["bundle-mcp"]`은 명시적으로 비활성화합니다.
    - 서버별 `toolFilter.include` 및 `toolFilter.exclude`은 검색된 MCP 도구가 OpenClaw 도구가 되기 전에 필터링합니다.
    - 리소스 또는 프롬프트를 알리는 서버는 리소스 나열/읽기 및 프롬프트 나열/가져오기를 위한 유틸리티 도구도 노출합니다. 생성된 유틸리티 이름(`resources_list`, `resources_read`, `prompts_list`, `prompts_get`)에는 동일한 포함/제외 필터가 적용됩니다.
    - 동적 MCP 도구 목록 변경은 해당 세션의 캐시된 카탈로그를 무효화합니다. 다음 검색/사용 시 서버에서 새로 고칩니다.
    - MCP 도구 요청/프로토콜 실패가 반복되면 하나의 고장 난 서버가 전체 턴을 소비하지 않도록 해당 서버를 잠시 일시 중지합니다.
    - 세션 범위의 번들 MCP 런타임은 `mcp.sessionIdleTtlMs`밀리초 동안 유휴 상태이면 정리되며(기본값 10분, 비활성화하려면 `0` 설정), 일회성 임베디드 실행은 실행 종료 시 이를 정리합니다.

  </Accordion>
</AccordionGroup>

런타임 어댑터는 이 공유 레지스트리를 다운스트림 클라이언트가 기대하는 형식으로 정규화할 수 있습니다. 예를 들어 임베디드 OpenClaw는 OpenClaw `transport` 값을 직접 사용하는 반면 Claude Code와 Gemini는 `http`, `sse` 또는 `stdio`과 같은 CLI 네이티브 `type` 값을 받습니다.

Codex app-server는 각 서버의 선택적 `codex` 블록도 준수합니다. 이는
Codex app-server 스레드에만 적용되는 OpenClaw 프로젝션 메타데이터이며,
ACP 세션, 일반 Codex 하네스 구성 또는 기타 런타임 어댑터는 변경하지 않습니다.
비어 있지 않은 `codex.agents`을 사용하여 서버를 특정 OpenClaw
에이전트 ID에만 프로젝션하십시오. 비어 있거나 공백이거나 잘못된 에이전트 목록은 구성
검증에서 거부되며 전역으로 적용되는 대신 런타임 프로젝션 경로에서 생략됩니다.
신뢰할 수 있는 서버에 Codex의 네이티브 `default_tools_approval_mode`을 내보내려면
`codex.defaultToolsApprovalMode`(`auto`, `prompt` 또는 `approve`)을 사용하십시오.
OpenClaw는 네이티브 `mcp_servers` 구성을 Codex에 전달하기 전에
`codex` 메타데이터를 제거합니다.

### 저장된 MCP 서버 정의

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

- `list`은 서버 이름을 정렬합니다.
- 이름 없이 `show`을 실행하면 구성된 전체 MCP 서버 객체를 출력합니다.
- `status`은 연결하지 않고 구성된 전송을 분류합니다. `--verbose`에는 확인된 시작, 시간 제한, OAuth, 필터 및 병렬 호출 세부 정보가 포함됩니다.
- `doctor`은 연결하지 않고 정적 검사를 수행합니다. 활성화된 서버가 연결되는지도 명령에서 검증해야 하는 경우 `--probe`을 추가하십시오.
- `probe`은 연결하여 도구 수, 리소스/프롬프트 지원, 목록 변경 지원 및 진단을 보고합니다.
- `add`은 `--command`, `--arg`, `--env` 및 `--cwd`과 같은 stdio 플래그 또는 `--url`, `--transport`, `--header`, `--auth oauth`, TLS, 시간 제한 및 도구 선택 플래그와 같은 HTTP 플래그를 허용합니다.
- `set`은 명령줄에 하나의 JSON 객체 값이 있어야 합니다.
- `configure`은 전체 서버 정의를 교체하지 않고 활성화 상태, 도구 필터, 시간 제한, OAuth, TLS 및 병렬 도구 호출 힌트를 업데이트합니다. 저장하기 전에 업데이트된 서버를 검증하려면 `--probe`을 추가하십시오.
- `tools`은 서버별 도구 필터를 업데이트합니다. 포함/제외 항목은 MCP 도구 이름 및 단순 `*` 글롭입니다.
- `login`은 `auth: "oauth"`로 구성된 HTTP 서버의 OAuth 흐름을 실행합니다. 첫 실행에서 권한 부여 URL을 출력하며, 승인 후 `--code`을 사용하여 다시 실행하십시오.
- `logout`은 저장된 서버 정의를 제거하지 않고 명명된 서버에 저장된 OAuth 자격 증명을 지웁니다.
- `reload`은 현재 CLI 프로세스의 캐시된 프로세스 내 MCP 런타임만 폐기합니다. 다른 프로세스의 Gateway 또는 에이전트 프로세스에는 여전히 자체 다시 로드 또는 재시작 경로가 필요합니다.
- Streamable HTTP MCP 서버에는 `transport: "streamable-http"`을 사용하십시오. `openclaw mcp set`은 호환성을 위해 CLI 네이티브 `type: "http"`도 동일한 표준 구성 형식으로 정규화합니다.
- 명명된 서버가 존재하지 않으면 `unset`은 실패합니다.

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

### 일반적인 서버 구성 예시

이 예시는 서버 정의만 저장합니다. 서버가 시작되고 도구를 노출하는지 확인하려면 이후에 `openclaw mcp doctor --probe`을 실행하십시오.

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

    파일 시스템 서버의 범위를 에이전트가 읽거나 편집해야 하는 최소 디렉터리 트리로 제한하십시오.

  </Tab>
  <Tab title="메모리">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    서버가 일반 에이전트에 제공해서는 안 되는 쓰기 도구를 노출하는 경우 도구 필터를 사용하십시오.

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

    `doctor`은 `cwd`이 존재하고 구성된 환경에서 명령이 확인되는지 검사합니다.

  </Tab>
  <Tab title="원격 HTTP">
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

    원격 서버가 OAuth를 지원하면 OAuth를 사용하십시오. 서버에 정적 헤더가 필요한 경우 리터럴 전달자 토큰을 커밋하지 마십시오.

  </Tab>
  <Tab title="데스크톱/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    직접 데스크톱을 제어하는 서버는 자신이 시작한 프로세스의 권한을 상속합니다. 제한적인 도구 필터와 OS 수준 권한 프롬프트를 사용하십시오.

  </Tab>
</Tabs>

### JSON 출력 형식

스크립트와 대시보드에는 `--json`을 사용하십시오. 필드 집합은 시간이 지나면서 늘어날 수 있으므로 소비자는 알 수 없는 키를 무시해야 합니다.

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth 자격 증명이 승인되지 않았습니다. openclaw mcp login docs를 실행하십시오"
            }
          ]
        }
      ]
    }
    ```

    활성화되어 검사된 서버 중 하나라도 `error` 수준의 문제가 있으면 `doctor --json`은 0이 아닌 값으로 종료됩니다. `warning` 및 `info` 문제는 보고되지만 그 자체만으로 명령이 실패하지는 않습니다.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json`은 실시간 MCP 클라이언트 세션을 열고 결과를 직접 출력합니다. `status`/`doctor`과 달리 출력에 최상위 `path` 필드가 없습니다. `resources` 및 `prompts` 키는 서버가 실제로 해당 기능을 알릴 때만 표시됩니다. 프롬프트가 없는 서버는 `false`을 보고하는 대신 `prompts` 키를 생략합니다. 정적 구성 감사가 아니라 연결 가능성과 기능을 입증하려면 `probe`을 사용하십시오.

  </Accordion>
</AccordionGroup>

구성 형식 예시:

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

로컬 자식 프로세스를 시작하고 stdin/stdout을 통해 통신합니다.

| 필드                       | 설명                              |
| -------------------------- | --------------------------------- |
| `command`                  | 생성할 실행 파일(필수)            |
| `args`                     | 명령줄 인수 배열                   |
| `env`                      | 추가 환경 변수                    |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리          |

<Warning>
**Stdio 환경 변수 안전 필터**

OpenClaw는 stdio MCP 서버를 시작하기 전에 서버의 `env` 블록에 포함되어 있더라도 인터프리터 시작, 로더 하이재킹, 셸 초기화 환경 변수 키를 거부합니다. 이는 OpenClaw가 시작하는 다른 프로세스와 동일한 호스트 환경 보안 정책을 사용합니다. 알려진 인터프리터 시작 후크(예: `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), 공유 라이브러리 및 함수 삽입 접두사(`DYLD_*`, `LD_*`, `BASH_FUNC_*`), 이와 유사한 런타임 제어 변수를 차단합니다. 시작 시 이러한 변수를 자동으로 제거하고 경고를 기록하므로 stdio 프로세스에 암시적 전처리 코드를 삽입하거나, 인터프리터를 바꾸거나, 디버거를 활성화하거나, 동적 링커를 하이재킹할 수 없습니다. 명시적 허용 목록을 통해 일반적인 MCP 자격 증명 환경 변수(`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)와 일반 프록시 및 서버별 환경 변수(`HTTP_PROXY`, 사용자 정의 `*_API_KEY` 등)는 계속 사용할 수 있습니다. `AWS_CONFIG_FILE` 및 `AWS_SHARED_CREDENTIALS_FILE`과 같은 다른 `AWS_*` 키는 자격 증명 값을 직접 전달하는 대신 자격 증명 파일을 가리키므로 계속 차단됩니다.

MCP 서버에 차단된 변수 중 하나가 실제로 필요한 경우 stdio 서버의 `env` 아래가 아니라 Gateway 호스트 프로세스에 설정하십시오.
</Warning>

### SSE / HTTP 전송

HTTP 서버 전송 이벤트를 통해 원격 MCP 서버에 연결합니다.

| 필드                           | 설명                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | 원격 서버의 HTTP 또는 HTTPS URL(필수)                            |
| `headers`                      | 선택적 HTTP 헤더 키-값 맵(예: 인증 토큰)                        |
| `connectionTimeoutMs`          | 서버별 연결 제한 시간(밀리초, 선택 사항)                         |
| `connectTimeout`               | 서버별 연결 제한 시간(초, 선택 사항)                             |
| `timeout` / `requestTimeoutMs` | 서버별 MCP 요청 제한 시간(초 또는 밀리초)                        |
| `auth: "oauth"`                | `openclaw mcp login`에서 저장한 MCP OAuth 자격 증명 사용          |
| `sslVerify`                    | 명시적으로 신뢰하는 비공개 HTTPS 엔드포인트에만 false로 설정     |
| `clientCert` / `clientKey`     | mTLS 클라이언트 인증서 및 키 경로                                |
| `supportsParallelToolCalls`    | 이 서버에서 동시 호출이 안전하다는 힌트                          |

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

`url`(사용자 정보) 및 `headers`의 민감한 값은 로그와 상태 출력에서 마스킹됩니다. 민감한 정보로 보이는 `headers` 또는 `env` 항목에 리터럴 값이 포함된 경우 `openclaw mcp doctor`이 경고하여 운영자가 해당 값을 커밋된 구성 외부로 이동할 수 있게 합니다.

### OAuth 워크플로

OAuth는 MCP OAuth 흐름을 알리는 HTTP MCP 서버용입니다. `auth: "oauth"`이 활성화된 동안에는 서버의 정적 `Authorization` 헤더가 무시됩니다. `openclaw mcp login`에서 저장한 자격 증명은 내장 MCP, CLI 실행기, 로컬 Codex 앱 서버에서 작동합니다.

자격 증명을 사용할 수 있을 때까지 OpenClaw는 에이전트 턴을 실패시키는 대신 해당 MCP 서버만 에이전트 런타임에서 제외합니다. 이후 운영자 또는 셸 접근 권한이 있는 에이전트가 `openclaw mcp login <name>`을 실행하여 다음 턴부터 서버를 사용할 수 있습니다.

원격 MCP 서비스가 이미 갱신 가능한 별도의 OpenClaw 인증 프로필을 기반으로 하는 경우 선택적으로 `oauth.authProfileId`을 설정할 수 있습니다. OpenClaw는 런타임 프로젝션 전에 두 자격 증명 소스 중 하나를 갱신하고 현재 액세스 토큰만 다운스트림 MCP 클라이언트에 전달합니다.

<Steps>
  <Step title="서버 저장">
    `auth: "oauth"` 및 선택적 OAuth 메타데이터를 사용하여 서버를 추가하거나 업데이트하십시오.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    인증 프로필 기반 전달자의 경우 프로필 바인딩을 저장하십시오.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="로그인 시작">
    로그인 명령을 실행하여 승인 요청을 생성하십시오.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw는 승인 URL을 출력하고 임시 OAuth 검증자 상태를 OpenClaw 상태 디렉터리에 저장합니다.

  </Step>
  <Step title="코드로 완료">
    브라우저에서 승인한 후 반환된 코드를 OpenClaw에 다시 전달하십시오.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="권한 부여 확인">
    status 또는 doctor를 사용하여 토큰이 있는지 확인하십시오.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="자격 증명 삭제">
    로그아웃하면 저장된 OAuth 자격 증명은 삭제되지만 저장된 서버 정의는 유지됩니다.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

공급자가 토큰을 교체하거나 권한 부여 상태가 멈춘 경우 `openclaw mcp logout <name>`을 실행한 다음 `login`을 다시 수행하십시오. 서버 이름과 URL로 자격 증명 저장소 항목을 계속 식별할 수 있다면, 구성에서 `auth: "oauth"`이 제거된 후에도 `logout`을 사용하여 저장된 HTTP 서버의 자격 증명을 삭제할 수 있습니다.

### 스트리밍 가능 HTTP 전송

`streamable-http`은 `sse` 및 `stdio`과 함께 사용할 수 있는 추가 전송 옵션입니다. 원격 MCP 서버와 양방향으로 통신하기 위해 HTTP 스트리밍을 사용합니다.

| 필드                           | 설명                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                  |
| `transport`                    | 이 전송을 선택하려면 `"streamable-http"`으로 설정합니다. 생략하면 OpenClaw는 `sse`을 사용합니다. |
| `headers`                      | HTTP 헤더의 선택적 키-값 맵(예: 인증 토큰)                                             |
| `connectionTimeoutMs`          | 서버별 연결 제한 시간(밀리초, 선택 사항)                                               |
| `connectTimeout`               | 서버별 연결 제한 시간(초, 선택 사항)                                                   |
| `timeout` / `requestTimeoutMs` | 서버별 MCP 요청 제한 시간(초 또는 밀리초)                                              |
| `auth: "oauth"`                | `openclaw mcp login`에서 저장한 MCP OAuth 자격 증명을 사용합니다.                         |
| `sslVerify`                    | 명시적으로 신뢰하는 비공개 HTTPS 엔드포인트에만 false로 설정합니다.                    |
| `clientCert` / `clientKey`     | mTLS 클라이언트 인증서 및 키 경로                                                       |
| `supportsParallelToolCalls`    | 이 서버에서 동시 호출이 안전하다는 힌트                                                |

OpenClaw 구성에서는 `transport: "streamable-http"`을 표준 표기로 사용합니다. CLI 기본 MCP `type: "http"` 값은 `openclaw mcp set`을 통해 저장할 때 허용되며 기존 구성에서는 `openclaw doctor --fix`으로 수정되지만, 내장된 OpenClaw가 직접 사용하는 것은 `transport`입니다.

예:

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
레지스트리 명령은 채널 브리지를 시작하지 않습니다. `probe` 및 `doctor --probe`만 실제 MCP 클라이언트 세션을 열어 대상 서버에 연결할 수 있는지 확인합니다.
</Note>

## 제어 UI

브라우저 제어 UI에는 `/settings/mcp`에 전용 MCP 설정 페이지가 있으며, 이전 `/mcp` 경로는 별칭으로 유지됩니다. 이 페이지에는 구성된 서버 수, 활성화/OAuth/필터 요약, 서버별 전송 행, 활성화/비활성화 컨트롤, 일반적인 CLI 명령 및 `mcp` 구성 섹션용 범위 지정 편집기가 표시됩니다.

운영자 편집과 빠른 목록 확인에는 이 페이지를 사용하십시오. 실제 서버 검증이 필요하면 `openclaw mcp doctor --probe` 또는 `openclaw mcp probe`을 사용하십시오.

운영자 작업 흐름:

1. 제어 UI를 열고 **MCP**를 선택하십시오.
2. 전체 서버, 활성화된 서버, OAuth 서버 및 필터링된 서버의 요약 카드를 검토하십시오.
3. 각 서버 행에서 전송, 인증, 필터, 제한 시간 및 명령 힌트를 확인하십시오.
4. 정의는 유지하면서 런타임 검색에서 제외하려면 활성화 상태를 전환하십시오.
5. 새 서버, 헤더, TLS, OAuth 메타데이터 또는 도구 필터와 같은 구조적 변경을 하려면 범위가 지정된 `mcp` 구성 섹션을 편집하십시오.
6. 구성만 저장하려면 **Save**를, Gateway 구성 경로를 통해 적용하려면 **Save & Publish**를 선택하십시오.
7. 편집한 서버가 시작되고 도구 목록을 표시하는지 실제로 확인해야 할 때 `openclaw mcp doctor --probe`을 실행하십시오.

참고:

- 명령 스니펫에서는 특이한 서버 이름도 셸에 복사할 수 있도록 서버 이름을 따옴표로 묶습니다.
- 표시되는 URL 형태의 값에 자격 증명이 포함되어 있으면 렌더링 전에 해당 값이 가려집니다.
- 이 페이지 자체에서는 MCP 전송을 시작하지 않습니다.
- MCP 클라이언트를 소유한 프로세스에 따라 활성 런타임에 `openclaw mcp reload`, Gateway 구성 게시 또는 프로세스 재시작이 필요할 수 있습니다.

## MCP 앱

OpenClaw는 안정적인 [MCP 앱 확장](https://modelcontextprotocol.io/extensions/apps)을 구현하는 도구를 렌더링할 수 있습니다. 앱의 HTML은 구성된 MCP 서버에서 제공되며 같은 서버의 앱 표시 가능 도구나 리소스를 요청할 수 있으므로 앱은 옵트인 방식입니다.

호스트 브리지를 활성화하십시오.

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

이 설정을 변경한 후 Gateway를 재시작하십시오. 활성화되면 OpenClaw는 Gateway 포트에 1을 더한 포트(기본 Gateway의 경우 `18790`)에서 샌드박스 전용 HTTP(S) 리스너를 시작합니다. 제어 UI는 이 별도 출처에서 앱을 로드합니다. 리스너는 제어 UI, 인증된 Gateway 경로 또는 사용자 데이터를 절대 제공하지 않습니다.

Gateway에 직접 연결하려면 두 포트 모두에 접근할 수 있어야 합니다. 리버스 프록시 또는 TLS 터미네이터가 제어 UI를 노출하는 경우 앱에 전용 공개 출처를 지정하고 해당 출처만 샌드박스 리스너로 프록시하십시오.

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

샌드박스 출처는 제어 UI 출처와 달라야 합니다. 여기에 인증된 콘텐츠나 민감한 다른 콘텐츠를 호스팅하지 마십시오.

예를 들어 공식 기본 React 데모는 다음과 같이 구성할 수 있습니다.

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

동작 및 보안 경계:

- OpenClaw는 앱이 활성화된 경우에만 `io.modelcontextprotocol/ui` 확장을 알립니다.
- 정확히 `text/html;profile=mcp-app` MIME 유형인 `ui://` 리소스만 렌더링됩니다.
- UI 리소스는 2 MiB로 제한되고 전용 외부 출처의 이중 iframe 프록시 뒤에 배치되며, 불투명한 내부 앱 출처에 로드되고 리소스 메타데이터에서 파생된 CSP의 제약을 받습니다.
- 앱 전용 도구(`_meta.ui.visibility: ["app"]`)는 모델 도구 목록에서 제외됩니다. 앱은 자체 서버에 속하고 앱에서 볼 수 있으며, 해당 뷰를 생성한 실행의 유효한 OpenClaw 도구 정책도 통과하는 도구만 호출할 수 있습니다.
- 내부 앱 문서가 앱 간 격리를 위해 불투명한 출처를 사용하는 동안에는 카메라, 마이크, 위치 정보와 같은 출처 종속 앱 권한이 부여되지 않습니다.
- 앱 HTML, 전체 도구 인수 및 원시 결과는 제한된 10분짜리 메모리 내 뷰 임대에 보관되며 디스크에 기록되거나 대화 기록 미리보기 메타데이터로 복사되지 않습니다. 대화 기록에는 원래 도구 호출 ID에 연결된 제한된 서버/도구/리소스 설명자만 저장됩니다. Gateway가 재시작된 후 제어 UI는 인증된 세션 대화 기록을 기준으로 해당 설명자를 검증하고 `ui://` 리소스를 다시 가져올 수 있습니다. 재구성된 뷰는 새로운 실행이 현재 도구 권한을 설정할 때까지 읽기 전용입니다.
- 브리지가 활성화된 동안 `openclaw security audit`에서 경고합니다. 필요하지 않을 때는 `openclaw config set mcp.apps.enabled false --strict-json`으로 비활성화하십시오.

## 현재 제한 사항

이 페이지에서는 현재 제공되는 브리지를 설명합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 경로 메타데이터에 의존합니다.
- Claude 전용 어댑터 외에는 범용 푸시 프로토콜이 없습니다.
- 아직 메시지 편집 또는 반응 도구가 없습니다.
- HTTP/SSE/streamable-http 전송은 단일 원격 서버에 연결됩니다. 아직 다중화된 업스트림은 없습니다.
- `permissions_list_open`에는 브리지가 연결된 동안 관찰된 승인만 포함됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Plugins](/ko/cli/plugins)
