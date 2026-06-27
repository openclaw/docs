---
read_when:
    - ACP 기반 IDE 통합 설정하기
    - Gateway로의 ACP 세션 라우팅 디버깅
summary: IDE 통합을 위해 ACP 브리지를 실행하기
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

OpenClaw Gateway와 통신하는 [에이전트 클라이언트 프로토콜(ACP)](https://agentclientprotocol.com/) 브리지를 실행합니다.

이 명령은 IDE용 stdio를 통해 ACP를 사용하고, 프롬프트를 WebSocket을 통해 Gateway로 전달합니다. ACP 세션을 Gateway 세션 키에 매핑된 상태로 유지합니다.

`openclaw acp`는 완전한 ACP 네이티브 편집기 런타임이 아니라 Gateway 기반 ACP 브리지입니다. 세션 라우팅, 프롬프트 전달, 기본 스트리밍 업데이트에 중점을 둡니다.

ACP 하네스 세션을 호스팅하는 대신 외부 MCP 클라이언트가 OpenClaw 채널 대화와 직접 통신하게 하려면 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.

## 이것이 아닌 것

이 페이지는 ACP 하네스 세션과 자주 혼동됩니다.

`openclaw acp`의 의미는 다음과 같습니다.

- OpenClaw가 ACP 서버로 동작합니다
- IDE 또는 ACP 클라이언트가 OpenClaw에 연결합니다
- OpenClaw가 해당 작업을 Gateway 세션으로 전달합니다

이는 [ACP 에이전트](/ko/tools/acp-agents)와 다릅니다. ACP 에이전트에서는 OpenClaw가 `acpx`를 통해 Codex 또는 Claude Code 같은 외부 하네스를 실행합니다.

간단한 기준:

- 편집기/클라이언트가 ACP로 OpenClaw와 통신하려는 경우: `openclaw acp`를 사용하세요
- OpenClaw가 Codex/Claude/Gemini를 ACP 하네스로 실행해야 하는 경우: `/acp spawn`과 [ACP 에이전트](/ko/tools/acp-agents)를 사용하세요

## 호환성 매트릭스

| ACP 영역                                                              | 상태        | 참고                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 구현됨      | stdio에서 Gateway chat/send + abort로 이어지는 핵심 브리지 흐름입니다.                                                                                                                                                                           |
| `listSessions`, 슬래시 명령                                           | 구현됨      | 세션 목록은 제한된 커서 페이지네이션과 Gateway 세션 행에 워크스페이스 메타데이터가 있는 경우 `cwd` 필터링을 사용해 Gateway 세션 상태에 대해 동작합니다. 명령은 `available_commands_update`를 통해 공지됩니다.                                |
| 세션 계보 메타데이터                                                  | 구현됨      | 세션 목록과 세션 정보 스냅샷은 `_meta`에 OpenClaw 부모 및 자식 계보를 포함하므로 ACP 클라이언트가 비공개 Gateway 사이드 채널 없이 하위 에이전트 그래프를 렌더링할 수 있습니다.                                                                |
| `resumeSession`, `closeSession`                                       | 구현됨      | 재개는 기록을 재생하지 않고 ACP 세션을 기존 Gateway 세션에 다시 바인딩합니다. 닫기는 활성 브리지 작업을 취소하고, 대기 중인 프롬프트를 취소됨으로 해결하며, 브리지 세션 상태를 해제합니다.                                                     |
| `loadSession`                                                         | 부분 지원   | ACP 세션을 Gateway 세션 키에 다시 바인딩하고 브리지가 만든 세션의 ACP 이벤트 원장 기록을 재생합니다. 더 오래되었거나 원장이 없는 세션은 저장된 사용자/어시스턴트 텍스트로 폴백합니다.                                                         |
| 프롬프트 콘텐츠(`text`, 내장 `resource`, 이미지)                      | 부분 지원   | 텍스트/리소스는 채팅 입력으로 평탄화되고, 이미지는 Gateway 첨부 파일이 됩니다.                                                                                                                                                                  |
| 세션 모드                                                             | 부분 지원   | `session/set_mode`가 지원되며 브리지는 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 상승된 작업을 위한 초기 Gateway 기반 세션 제어를 노출합니다. 더 넓은 ACP 네이티브 모드/구성 표면은 아직 범위 밖입니다. |
| 세션 정보 및 사용량 업데이트                                          | 부분 지원   | 브리지는 캐시된 Gateway 세션 스냅샷에서 `session_info_update`와 최선 노력 방식의 `usage_update` 알림을 내보냅니다. 사용량은 근사치이며 Gateway 토큰 합계가 최신으로 표시된 경우에만 전송됩니다.                                                |
| 도구 스트리밍                                                         | 부분 지원   | `tool_call` / `tool_call_update` 이벤트에는 Gateway 도구 인수/결과가 노출하는 경우 원시 I/O, 텍스트 콘텐츠, 최선 노력 방식의 파일 위치가 포함됩니다. 내장 터미널과 더 풍부한 diff 네이티브 출력은 아직 노출되지 않습니다.                        |
| Exec 승인                                                             | 부분 지원   | 활성 ACP 프롬프트 턴 중 Gateway exec 승인 프롬프트는 `session/request_permission`으로 ACP 클라이언트에 릴레이됩니다.                                                                                                                            |
| 세션별 MCP 서버(`mcpServers`)                                         | 지원되지 않음 | 브리지 모드는 세션별 MCP 서버 요청을 거부합니다. 대신 OpenClaw Gateway 또는 에이전트에서 MCP를 구성하세요.                                                                                                                                     |
| 클라이언트 파일 시스템 메서드(`fs/read_text_file`, `fs/write_text_file`) | 지원되지 않음 | 브리지는 ACP 클라이언트 파일 시스템 메서드를 호출하지 않습니다.                                                                                                                                                                                  |
| 클라이언트 터미널 메서드(`terminal/*`)                                | 지원되지 않음 | 브리지는 ACP 클라이언트 터미널을 만들거나 도구 호출을 통해 터미널 ID를 스트리밍하지 않습니다.                                                                                                                                                   |
| 세션 계획 / 사고 스트리밍                                             | 지원되지 않음 | 브리지는 현재 ACP 계획 또는 사고 업데이트가 아니라 출력 텍스트와 도구 상태를 내보냅니다.                                                                                                                                                       |

## 알려진 제한 사항

- `loadSession`은 브리지가 만든 세션에 대해서만 전체 ACP 이벤트 원장 기록을 재생할 수 있습니다. 더 오래되었거나 원장이 없는 세션은 여전히 대화 기록 폴백을 사용하며 과거 도구 호출이나 시스템 알림을 재구성하지 않습니다.
- 여러 ACP 클라이언트가 같은 Gateway 세션 키를 공유하는 경우 이벤트 및 취소 라우팅은 클라이언트별로 엄격하게 격리되기보다 최선 노력 방식으로 동작합니다. 깨끗한 편집기 로컬 턴이 필요하면 기본 격리 `acp-bridge:<uuid>` 세션을 선호하세요.
- Gateway 중지 상태는 ACP 중지 사유로 변환되지만, 이 매핑은 완전한 ACP 네이티브 런타임보다 표현력이 낮습니다.
- 초기 세션 제어는 현재 Gateway 노브의 집중된 하위 집합인 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 상승된 작업을 노출합니다. 모델 선택과 exec 호스트 제어는 아직 ACP 구성 옵션으로 노출되지 않습니다.
- `session_info_update`와 `usage_update`는 라이브 ACP 네이티브 런타임 계정이 아니라 Gateway 세션 스냅샷에서 파생됩니다. 사용량은 근사치이며 비용 데이터가 없고, Gateway가 전체 토큰 데이터를 최신으로 표시할 때만 내보내집니다.
- 도구 팔로우어롱 데이터는 최선 노력 방식입니다. 브리지는 알려진 도구 인수/결과에 나타나는 파일 경로를 표시할 수 있지만, 아직 ACP 터미널이나 구조화된 파일 diff를 내보내지 않습니다.
- Exec 승인 릴레이는 활성 ACP 프롬프트 턴으로 범위가 제한됩니다. 다른 Gateway 세션의 승인은 무시됩니다.

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

IDE 없이 브리지를 간단히 점검하려면 내장 ACP 클라이언트를 사용하세요.
ACP 브리지를 생성하고 프롬프트를 대화식으로 입력할 수 있게 합니다.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

권한 모델(클라이언트 디버그 모드):

- 자동 승인은 허용 목록 기반이며 신뢰된 핵심 도구 ID에만 적용됩니다.
- `read` 자동 승인은 현재 작업 디렉터리(`--cwd`가 설정된 경우)로 범위가 제한됩니다.
- ACP는 좁은 읽기 전용 클래스만 자동 승인합니다. 활성 cwd 아래의 범위 지정 `read` 호출과 읽기 전용 검색 도구(`search`, `web_search`, `memory_search`)입니다. 알 수 없거나 핵심이 아닌 도구, 범위 밖 읽기, exec 가능 도구, 제어 플레인 도구, 변경 도구, 대화식 흐름은 항상 명시적 프롬프트 승인이 필요합니다.
- 서버가 제공한 `toolCall.kind`는 신뢰할 수 없는 메타데이터로 취급됩니다(권한 부여 소스가 아님).
- 이 ACP 브리지 정책은 ACPX 하네스 권한과 별개입니다. `acpx` 백엔드를 통해 OpenClaw를 실행하는 경우 `plugins.entries.acpx.config.permissionMode=approve-all`은 해당 하네스 세션의 비상용 "yolo" 스위치입니다.

## 프로토콜 스모크 테스트

프로토콜 수준 디버깅을 위해 격리된 상태로 Gateway를 시작하고 ACP JSON-RPC 클라이언트로 stdio를 통해 `openclaw acp`를 구동하세요. `initialize`, `session/new`, 절대 `cwd`를 사용한 `session/list`, `session/resume`, `session/close`, 중복 닫기, 누락된 재개를 포함하세요.

증명에는 공지된 수명 주기 기능, Gateway 기반 세션 행, 업데이트 알림, Gateway `sessions.list` 로그가 포함되어야 합니다.

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

유일한 ACP 증명으로 `openclaw gateway call sessions.list`를 사용하지 마세요. 해당 CLI 경로는 fresh-token 운영자 범위 업그레이드를 요청할 수 있습니다. ACP 브리지의 정확성은 ACP stdio 프레임과 Gateway `sessions.list` 로그로 증명됩니다.

## 이것을 사용하는 방법

IDE 또는 다른 클라이언트가 에이전트 클라이언트 프로토콜을 사용하고 이를 통해 OpenClaw Gateway 세션을 구동하려는 경우 ACP를 사용하세요.

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

ACP는 에이전트를 직접 선택하지 않습니다. Gateway 세션 키로 라우팅합니다.

특정 에이전트를 대상으로 하려면 에이전트 범위 세션 키를 사용하세요.

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 단일 Gateway 세션 키에 매핑됩니다. 하나의 agent는 여러
세션을 가질 수 있습니다. ACP는 키나 레이블을 재정의하지 않는 한 격리된
`acp-bridge:<uuid>` 세션을 기본값으로 사용합니다.

세션별 `mcpServers`는 브리지 모드에서 지원되지 않습니다. ACP 클라이언트가
`newSession` 또는 `loadSession` 중에 이를 보내면, 브리지는 조용히 무시하는
대신 명확한 오류를 반환합니다.

ACPX 기반 세션에서 OpenClaw Plugin 도구나 `cron` 같은 선택된 기본 제공
도구를 보게 하려면, 세션별 `mcpServers`를 전달하려고 하지 말고 Gateway 측
ACPX MCP 브리지를 활성화하세요. 자세한 내용은
[ACP Agents](/ko/tools/acp-agents-setup#plugin-tools-mcp-bridge) 및
[OpenClaw 도구 MCP 브리지](/ko/tools/acp-agents-setup#openclaw-tools-mcp-bridge)를 참조하세요.

## `acpx`에서 사용하기(Codex, Claude, 기타 ACP 클라이언트)

Codex 또는 Claude Code 같은 코딩 agent가 ACP를 통해 OpenClaw bot과
통신하게 하려면, 기본 제공 `openclaw` 대상과 함께 `acpx`를 사용하세요.

일반적인 흐름:

1. Gateway를 실행하고 ACP 브리지가 Gateway에 연결할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 설정합니다.
3. 코딩 agent가 사용할 OpenClaw 세션 키를 대상으로 지정합니다.

예시:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw`이 매번 특정 Gateway와 세션 키를 대상으로 하게 하려면
`~/.acpx/config.json`에서 `openclaw` agent 명령을 재정의하세요.

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

repo 로컬 OpenClaw 체크아웃의 경우 ACP 스트림이 깔끔하게 유지되도록 dev
runner 대신 직접 CLI 진입점을 사용하세요. 예:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이 방법은 Codex, Claude Code 또는 다른 ACP 인식 클라이언트가 터미널을
스크래핑하지 않고 OpenClaw agent에서 컨텍스트 정보를 가져오게 하는 가장
쉬운 방법입니다.

## Zed 편집기 설정

`~/.config/zed/settings.json`에 사용자 지정 ACP agent를 추가하세요(또는 Zed의 Settings UI 사용):

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

특정 Gateway 또는 에이전트를 대상으로 지정하려면:

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

Zed에서 에이전트 패널을 열고 "OpenClaw ACP"를 선택해 스레드를 시작합니다.

## 세션 매핑

기본적으로 ACP 브리지 세션은 `acp-bridge:` 접두사가 붙은 격리된 Gateway 세션 키를 받습니다. 이러한 일반 모델 브리지 세션은 합성 세션이며, 오래된 항목 정리와 항목 수 제한의 적용을 받습니다. 알려진 세션을 재사용하려면 세션 키나 레이블을 전달하세요.

- `--session <key>`: 특정 Gateway 세션 키를 사용합니다.
- `--session-label <label>`: 레이블로 기존 세션을 확인합니다.
- `--reset-session`: 해당 키에 대해 새 세션 ID를 발급합니다(같은 키, 새 트랜스크립트).

ACP 클라이언트가 메타데이터를 지원하는 경우, 세션별로 재정의할 수 있습니다.

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

세션 키에 대해 자세히 알아보려면 [/concepts/session](/ko/concepts/session)을 참고하세요.

## 옵션

- `--url <url>`: Gateway WebSocket URL입니다(gateway.remote.url이 구성된 경우 기본값).
- `--token <token>`: Gateway 인증 토큰입니다.
- `--token-file <path>`: 파일에서 Gateway 인증 토큰을 읽습니다.
- `--password <password>`: Gateway 인증 비밀번호입니다.
- `--password-file <path>`: 파일에서 Gateway 인증 비밀번호를 읽습니다.
- `--session <key>`: 기본 세션 키입니다.
- `--session-label <label>`: 확인할 기본 세션 레이블입니다.
- `--require-existing`: 세션 키/레이블이 없으면 실패합니다.
- `--reset-session`: 처음 사용하기 전에 세션 키를 재설정합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 붙이지 않습니다.
- `--provenance <off|meta|meta+receipt>`: ACP 출처 메타데이터 또는 영수증을 포함합니다.
- `--verbose, -v`: stderr에 자세한 로그를 출력합니다.

보안 참고:

- `--token` 및 `--password`는 일부 시스템에서 로컬 프로세스 목록에 표시될 수 있습니다.
- `--token-file`/`--password-file` 또는 환경 변수(`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) 사용을 권장합니다.
- Gateway 인증 확인은 다른 Gateway 클라이언트에서 사용하는 공유 계약을 따릅니다.
  - 로컬 모드: env(`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` 폴백은 `gateway.auth.*`가 설정되지 않은 경우에만 사용됩니다(구성되었지만 확인되지 않은 로컬 SecretRefs는 실패로 닫힘).
  - 원격 모드: 원격 우선순위 규칙에 따라 env/config 폴백과 함께 `gateway.remote.*`를 사용합니다.
  - `--url`은 재정의에 안전하며 암시적 config/env 자격 증명을 재사용하지 않습니다. 명시적 `--token`/`--password`(또는 파일 변형)를 전달하세요.
- ACP 런타임 백엔드 자식 프로세스는 `OPENCLAW_SHELL=acp`를 받으며, 이는 컨텍스트별 셸/프로필 규칙에 사용할 수 있습니다.
- `openclaw acp client`는 생성된 브리지 프로세스에 `OPENCLAW_SHELL=acp-client`를 설정합니다.

### `acp client` 옵션

- `--cwd <dir>`: ACP 세션의 작업 디렉터리입니다.
- `--server <command>`: ACP 서버 명령입니다(기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버에 전달되는 추가 인수입니다.
- `--server-verbose`: ACP 서버에서 자세한 로깅을 활성화합니다.
- `--verbose, -v`: 자세한 클라이언트 로깅입니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [ACP 에이전트](/ko/tools/acp-agents)
