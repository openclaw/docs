---
read_when:
    - ACP 기반 IDE 통합 설정
    - Gateway로의 ACP 세션 라우팅 디버깅
summary: IDE 통합을 위해 ACP 브리지 실행
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 브리지를 실행하여 OpenClaw Gateway와 통신합니다.

이 명령은 IDE용으로 stdio를 통해 ACP를 사용하고, 프롬프트를 WebSocket을 통해 Gateway로 전달합니다. ACP 세션을 Gateway 세션 키에 매핑된 상태로 유지합니다.

`openclaw acp`는 완전한 ACP 네이티브 편집기 런타임이 아니라 Gateway 기반 ACP 브리지입니다. 세션 라우팅, 프롬프트 전달, 기본 스트리밍 업데이트에 중점을 둡니다.

ACP 하네스 세션을 호스팅하는 대신 외부 MCP 클라이언트가 OpenClaw 채널 대화와 직접 통신하게 하려면 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.

## 이것이 아닌 것

이 페이지는 ACP 하네스 세션과 자주 혼동됩니다.

`openclaw acp`의 의미는 다음과 같습니다.

- OpenClaw가 ACP 서버로 동작합니다
- IDE 또는 ACP 클라이언트가 OpenClaw에 연결합니다
- OpenClaw가 해당 작업을 Gateway 세션으로 전달합니다

이는 OpenClaw가 `acpx`를 통해 Codex 또는 Claude Code 같은 외부 하네스를 실행하는 [ACP Agents](/ko/tools/acp-agents)와 다릅니다.

간단한 규칙:

- 편집기/클라이언트가 OpenClaw와 ACP로 통신하려는 경우: `openclaw acp`를 사용하세요
- OpenClaw가 Codex/Claude/Gemini를 ACP 하네스로 실행해야 하는 경우: `/acp spawn` 및 [ACP Agents](/ko/tools/acp-agents)를 사용하세요

## 호환성 매트릭스

| ACP 영역                                                              | 상태        | 참고                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 구현됨      | Gateway chat/send + abort로 이어지는 stdio 기반 핵심 브리지 흐름입니다.                                                                                                                                                                         |
| `listSessions`, slash commands                                        | 구현됨      | 세션 목록은 제한된 커서 페이지네이션과, Gateway 세션 행에 작업공간 메타데이터가 있는 경우 `cwd` 필터링을 사용해 Gateway 세션 상태를 기준으로 동작합니다. 명령은 `available_commands_update`를 통해 알립니다.                                |
| `resumeSession`, `closeSession`                                       | 구현됨      | 재개는 기록을 다시 재생하지 않고 ACP 세션을 기존 Gateway 세션에 다시 바인딩합니다. 종료는 활성 브리지 작업을 취소하고, 대기 중인 프롬프트를 취소됨으로 해결하며, 브리지 세션 상태를 해제합니다.                                              |
| `loadSession`                                                         | 부분적      | ACP 세션을 Gateway 세션 키에 다시 바인딩하고, 브리지에서 생성한 세션의 ACP 이벤트 원장 기록을 다시 재생합니다. 오래되었거나 원장이 없는 세션은 저장된 사용자/어시스턴트 텍스트로 폴백합니다.                                                |
| 프롬프트 콘텐츠(`text`, 포함된 `resource`, 이미지)                    | 부분적      | 텍스트/리소스는 채팅 입력으로 평탄화되고, 이미지는 Gateway 첨부 파일이 됩니다.                                                                                                                                                                  |
| 세션 모드                                                             | 부분적      | `session/set_mode`가 지원되며 브리지는 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 승격된 작업에 대한 초기 Gateway 기반 세션 제어를 노출합니다. 더 넓은 ACP 네이티브 모드/구성 표면은 아직 범위 밖입니다.                                |
| 세션 정보 및 사용량 업데이트                                          | 부분적      | 브리지는 캐시된 Gateway 세션 스냅샷에서 `session_info_update`와 최선의 `usage_update` 알림을 내보냅니다. 사용량은 근사치이며 Gateway 토큰 합계가 최신으로 표시된 경우에만 전송됩니다.                                                        |
| 도구 스트리밍                                                         | 부분적      | `tool_call` / `tool_call_update` 이벤트에는 Gateway 도구 인수/결과가 이를 노출할 때 원시 I/O, 텍스트 콘텐츠, 최선의 파일 위치가 포함됩니다. 내장 터미널과 더 풍부한 diff 네이티브 출력은 아직 노출되지 않습니다.                              |
| 실행 승인                                                             | 부분적      | 활성 ACP 프롬프트 턴 중의 Gateway 실행 승인 프롬프트는 `session/request_permission`을 사용해 ACP 클라이언트로 전달됩니다.                                                                                                                       |
| 세션별 MCP 서버(`mcpServers`)                                         | 지원되지 않음 | 브리지 모드는 세션별 MCP 서버 요청을 거부합니다. 대신 OpenClaw Gateway 또는 에이전트에서 MCP를 구성하세요.                                                                                                                                       |
| 클라이언트 파일시스템 메서드(`fs/read_text_file`, `fs/write_text_file`) | 지원되지 않음 | 브리지는 ACP 클라이언트 파일시스템 메서드를 호출하지 않습니다.                                                                                                                                                                                  |
| 클라이언트 터미널 메서드(`terminal/*`)                                | 지원되지 않음 | 브리지는 ACP 클라이언트 터미널을 생성하거나 도구 호출을 통해 터미널 ID를 스트리밍하지 않습니다.                                                                                                                                                  |
| 세션 계획 / 사고 스트리밍                                             | 지원되지 않음 | 현재 브리지는 ACP 계획 또는 사고 업데이트가 아니라 출력 텍스트와 도구 상태를 내보냅니다.                                                                                                                                                       |

## 알려진 제한 사항

- `loadSession`은 브리지에서 생성한 세션에 대해서만 완전한 ACP 이벤트 원장 기록을 다시 재생할 수 있습니다. 오래되었거나 원장이 없는 세션은 여전히 대화 기록 폴백을 사용하며, 과거 도구 호출이나 시스템 알림을 재구성하지 않습니다.
- 여러 ACP 클라이언트가 같은 Gateway 세션 키를 공유하는 경우, 이벤트 및 취소 라우팅은 클라이언트별로 엄격히 격리되기보다 최선의 방식으로 동작합니다. 편집기 로컬 턴을 깔끔하게 유지해야 할 때는 기본 격리 `acp:<uuid>` 세션을 선호하세요.
- Gateway 중지 상태는 ACP 중지 사유로 변환되지만, 이 매핑은 완전한 ACP 네이티브 런타임보다 표현력이 낮습니다.
- 초기 세션 제어는 현재 Gateway 조정 항목의 집중된 하위 집합만 표시합니다: 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 승격된 작업. 모델 선택 및 실행 호스트 제어는 아직 ACP 구성 옵션으로 노출되지 않습니다.
- `session_info_update` 및 `usage_update`는 라이브 ACP 네이티브 런타임 회계가 아니라 Gateway 세션 스냅샷에서 파생됩니다. 사용량은 근사치이며, 비용 데이터가 없고, Gateway가 총 토큰 데이터를 최신으로 표시할 때만 내보내집니다.
- 도구 동행 데이터는 최선의 방식으로 제공됩니다. 브리지는 알려진 도구 인수/결과에 나타나는 파일 경로를 표시할 수 있지만, 아직 ACP 터미널이나 구조화된 파일 diff를 내보내지는 않습니다.
- 실행 승인 전달은 활성 ACP 프롬프트 턴으로 범위가 제한되며, 다른 Gateway 세션의 승인은 무시됩니다.

## 사용법

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP 클라이언트(디버그)

IDE 없이 브리지를 간단히 확인하려면 내장 ACP 클라이언트를 사용하세요.
이 클라이언트는 ACP 브리지를 생성하고 프롬프트를 대화식으로 입력할 수 있게 합니다.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

권한 모델(클라이언트 디버그 모드):

- 자동 승인은 허용 목록 기반이며 신뢰할 수 있는 핵심 도구 ID에만 적용됩니다.
- `read` 자동 승인은 현재 작업 디렉터리(`--cwd`가 설정된 경우 해당 값)로 범위가 제한됩니다.
- ACP는 좁은 범위의 읽기 전용 클래스만 자동 승인합니다: 활성 cwd 아래의 범위 지정 `read` 호출과 읽기 전용 검색 도구(`search`, `web_search`, `memory_search`). 알 수 없는/비핵심 도구, 범위 밖 읽기, 실행 가능 도구, 제어 평면 도구, 변경 도구, 대화형 흐름은 항상 명시적 프롬프트 승인이 필요합니다.
- 서버가 제공하는 `toolCall.kind`는 신뢰할 수 없는 메타데이터로 취급됩니다(권한 부여 소스가 아님).
- 이 ACP 브리지 정책은 ACPX 하네스 권한과 별개입니다. `acpx` 백엔드를 통해 OpenClaw를 실행하는 경우, `plugins.entries.acpx.config.permissionMode=approve-all`은 해당 하네스 세션의 비상용 "yolo" 스위치입니다.

## 프로토콜 스모크 테스트

프로토콜 수준 디버깅을 위해 격리된 상태로 Gateway를 시작하고 ACP JSON-RPC 클라이언트로 stdio를 통해 `openclaw acp`를 구동하세요. `initialize`, `session/new`, 절대 `cwd`가 포함된 `session/list`, `session/resume`, `session/close`, 중복 종료, 누락된 재개를 포함하세요.

증거에는 광고된 수명 주기 기능, Gateway 기반 세션 행, 업데이트 알림, Gateway `sessions.list` 로그가 포함되어야 합니다.

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

유일한 ACP 증거로 `openclaw gateway call sessions.list`를 사용하지 마세요. 해당 CLI 경로는 fresh-token 운영자 범위 업그레이드를 요청할 수 있습니다. ACP 브리지의 정확성은 ACP stdio 프레임과 Gateway `sessions.list` 로그로 입증됩니다.

## 사용 방법

IDE(또는 다른 클라이언트)가 Agent Client Protocol을 사용하고, 그것이 OpenClaw Gateway 세션을 구동하게 하려는 경우 ACP를 사용하세요.

1. Gateway가 실행 중인지 확인합니다(로컬 또는 원격).
2. Gateway 대상을 구성합니다(구성 또는 플래그).
3. IDE가 stdio를 통해 `openclaw acp`를 실행하도록 지정합니다.

예시 구성(영구 저장):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

예시 직접 실행(구성 쓰기 없음):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 에이전트 선택

ACP는 에이전트를 직접 선택하지 않습니다. Gateway 세션 키를 기준으로 라우팅합니다.

특정 에이전트를 대상으로 하려면 에이전트 범위 세션 키를 사용하세요.

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 단일 Gateway 세션 키에 매핑됩니다. 하나의 에이전트는 여러 세션을 가질 수 있습니다. 키나 레이블을 재정의하지 않는 한 ACP는 격리된 `acp:<uuid>` 세션을 기본값으로 사용합니다.

세션별 `mcpServers`는 브리지 모드에서 지원되지 않습니다. ACP 클라이언트가
`newSession` 또는 `loadSession` 중에 이를 보내면, 브리지는 조용히 무시하는 대신
명확한 오류를 반환합니다.

ACPX 기반 세션에서 OpenClaw Plugin 도구 또는 `cron` 같은 선택된 기본 제공 도구를
사용하게 하려면, 세션별 `mcpServers`를 전달하려고 하지 말고 Gateway 측 ACPX MCP
브리지를 활성화하세요. 다음을 참조하세요:
[ACP 에이전트](/ko/tools/acp-agents-setup#plugin-tools-mcp-bridge) 및
[OpenClaw 도구 MCP 브리지](/ko/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## `acpx`에서 사용하기 (Codex, Claude, 기타 ACP 클라이언트)

Codex 또는 Claude Code 같은 코딩 에이전트가 ACP를 통해 OpenClaw 봇과 통신하게
하려면, 기본 제공 `openclaw` 대상과 함께 `acpx`를 사용하세요.

일반적인 흐름:

1. Gateway를 실행하고 ACP 브리지가 Gateway에 접근할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 합니다.
3. 코딩 에이전트가 사용할 OpenClaw 세션 키를 대상으로 지정합니다.

예시:

```bash
# 기본 OpenClaw ACP 세션에 한 번만 요청
acpx openclaw exec "Summarize the active OpenClaw session state."

# 후속 턴을 위한 영구 명명 세션
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw`이 매번 특정 Gateway 및 세션 키를 대상으로 하게 하려면
`~/.acpx/config.json`에서 `openclaw` 에이전트 명령을 재정의하세요.

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

저장소 로컬 OpenClaw 체크아웃의 경우 ACP 스트림이 깔끔하게 유지되도록 개발
러너 대신 직접 CLI 엔트리포인트를 사용하세요. 예:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이는 Codex, Claude Code 또는 다른 ACP 인식 클라이언트가 터미널을 스크래핑하지
않고 OpenClaw 에이전트에서 컨텍스트 정보를 가져오게 하는 가장 쉬운 방법입니다.

## Zed 편집기 설정

`~/.config/zed/settings.json`에 사용자 지정 ACP 에이전트를 추가합니다(또는 Zed의 설정 UI 사용).

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

특정 Gateway 또는 에이전트를 대상으로 하려면:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed에서 에이전트 패널을 열고 "OpenClaw ACP"를 선택해 스레드를 시작하세요.

## 세션 매핑

기본적으로 ACP 세션은 `acp:` 접두사가 붙은 격리된 Gateway 세션 키를 받습니다.
알려진 세션을 재사용하려면 세션 키 또는 레이블을 전달하세요.

- `--session <key>`: 특정 Gateway 세션 키를 사용합니다.
- `--session-label <label>`: 레이블로 기존 세션을 확인합니다.
- `--reset-session`: 해당 키에 대해 새 세션 ID를 발급합니다(같은 키, 새 트랜스크립트).

ACP 클라이언트가 메타데이터를 지원하는 경우 세션별로 재정의할 수 있습니다.

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

세션 키에 대한 자세한 내용은 [/concepts/session](/ko/concepts/session)을 참조하세요.

## 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 gateway.remote.url이 기본값).
- `--token <token>`: Gateway 인증 토큰.
- `--token-file <path>`: 파일에서 Gateway 인증 토큰을 읽습니다.
- `--password <password>`: Gateway 인증 비밀번호.
- `--password-file <path>`: 파일에서 Gateway 인증 비밀번호를 읽습니다.
- `--session <key>`: 기본 세션 키.
- `--session-label <label>`: 확인할 기본 세션 레이블.
- `--require-existing`: 세션 키/레이블이 없으면 실패합니다.
- `--reset-session`: 처음 사용하기 전에 세션 키를 재설정합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 붙이지 않습니다.
- `--provenance <off|meta|meta+receipt>`: ACP 출처 메타데이터 또는 영수증을 포함합니다.
- `--verbose, -v`: stderr에 상세 로깅을 출력합니다.

보안 참고:

- `--token` 및 `--password`는 일부 시스템의 로컬 프로세스 목록에 표시될 수 있습니다.
- `--token-file`/`--password-file` 또는 환경 변수(`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)를 선호하세요.
- Gateway 인증 확인은 다른 Gateway 클라이언트가 사용하는 공유 계약을 따릅니다.
  - 로컬 모드: env(`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*` 폴백(구성되었지만 확인되지 않은 로컬 SecretRefs는 안전하게 실패)
  - 원격 모드: 원격 우선순위 규칙에 따른 env/config 폴백과 함께 `gateway.remote.*`
  - `--url`은 재정의 안전하며 암시적 config/env 자격 증명을 재사용하지 않습니다. 명시적 `--token`/`--password`(또는 파일 변형)를 전달하세요.
- ACP 런타임 백엔드 자식 프로세스는 `OPENCLAW_SHELL=acp`를 받으며, 이는 컨텍스트별 셸/프로필 규칙에 사용할 수 있습니다.
- `openclaw acp client`는 생성된 브리지 프로세스에 `OPENCLAW_SHELL=acp-client`를 설정합니다.

### `acp client` 옵션

- `--cwd <dir>`: ACP 세션의 작업 디렉터리.
- `--server <command>`: ACP 서버 명령(기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버에 전달할 추가 인수.
- `--server-verbose`: ACP 서버에서 상세 로깅을 활성화합니다.
- `--verbose, -v`: 상세 클라이언트 로깅.

## 관련 항목

- [CLI 참조](/ko/cli)
- [ACP 에이전트](/ko/tools/acp-agents)
