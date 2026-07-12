---
read_when:
    - ACP 기반 IDE 통합 설정하기
    - Gateway로의 ACP 세션 라우팅 디버깅
summary: IDE 통합을 위한 ACP 브리지를 실행합니다
title: ACP
x-i18n:
    generated_at: "2026-07-12T15:01:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

OpenClaw Gateway와 통신하는 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 브리지를 실행합니다.

`openclaw acp`는 IDE를 위해 stdio를 통해 ACP로 통신하고 WebSocket을 통해 프롬프트를 Gateway로 전달하며, ACP 세션을 Gateway 세션 키에 매핑된 상태로 유지합니다. 이는 완전한 ACP 네이티브 편집기 런타임이 아니라 Gateway 기반 ACP 브리지로, 세션 라우팅, 프롬프트 전달, 스트리밍 업데이트에 중점을 둡니다.

ACP 하네스 세션을 호스팅하는 대신 외부 MCP 클라이언트가 OpenClaw 채널 대화와 직접 통신하도록 하려면 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하십시오.

## 해당하지 않는 기능

`openclaw acp`는 OpenClaw가 ACP 서버로 작동한다는 의미입니다. IDE 또는 ACP 클라이언트가 OpenClaw에 연결하면 OpenClaw가 해당 작업을 Gateway 세션으로 전달합니다.

이는 OpenClaw가 `acpx`를 통해 Codex 또는 Claude Code 같은 외부 하네스를 실행하는 [ACP 에이전트](/ko/tools/acp-agents)와 다릅니다.

간단한 기준:

- 편집기/클라이언트가 ACP를 통해 OpenClaw와 통신하려는 경우: `openclaw acp`를 사용합니다.
- OpenClaw가 Codex/Claude/Gemini를 ACP 하네스로 실행해야 하는 경우: `/acp spawn`과 [ACP 에이전트](/ko/tools/acp-agents)를 사용합니다.

## 호환성 매트릭스

| ACP 영역                                                              | 상태      | 참고                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 구현됨 | stdio에서 Gateway chat/send + abort로 이어지는 핵심 브리지 흐름입니다.                                                                                                                                                                             |
| `listSessions`, 슬래시 명령                                        | 구현됨 | Gateway 세션 행에 작업 공간 메타데이터가 있는 경우 제한된 커서 페이지 매김 및 `cwd` 필터링을 사용하여 Gateway 세션 상태에서 세션 목록이 작동하며, 명령은 `available_commands_update`를 통해 공개됩니다.                     |
| 세션 계보 메타데이터                                              | 구현됨 | ACP 클라이언트가 비공개 Gateway 사이드 채널 없이 하위 에이전트 그래프를 렌더링할 수 있도록 세션 목록과 세션 정보 스냅샷의 `_meta`에 OpenClaw 부모 및 자식 계보가 포함됩니다.                                                     |
| `resumeSession`, `closeSession`                                       | 구현됨 | 재개는 기록을 재생하지 않고 ACP 세션을 기존 Gateway 세션에 다시 바인딩합니다. 종료는 활성 브리지 작업을 취소하고, 대기 중인 프롬프트를 취소된 상태로 처리하며, 브리지 세션 상태를 해제합니다.                                   |
| `loadSession`                                                         | 부분 지원     | ACP 세션을 Gateway 세션 키에 다시 바인딩하고 브리지에서 생성한 세션의 ACP 이벤트 원장 기록을 재생합니다. 이전 세션이나 원장이 없는 세션은 저장된 사용자/어시스턴트 텍스트로 대체됩니다.                                                  |
| 프롬프트 콘텐츠(`text`, 포함된 `resource`, 이미지)                  | 부분 지원     | 텍스트/리소스는 채팅 입력으로 평탄화되고, 이미지는 Gateway 첨부 파일이 됩니다.                                                                                                                                                            |
| 세션 모드                                                         | 부분 지원     | `session/set_mode`가 지원됩니다. 브리지는 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 권한 상승 작업을 위한 Gateway 기반 세션 제어 기능을 제공합니다. 더 광범위한 ACP 네이티브 모드/구성 영역은 여전히 범위에 포함되지 않습니다. |
| 사고 스트리밍                                                     | 구현됨 | 모델의 사고 콘텐츠가 `agent_thought_chunk` 세션 업데이트로 스트리밍됩니다. ACP 네이티브 세션 계획은 내보내지 않습니다.                                                                                                                    |
| 세션 정보 및 사용량 업데이트                                        | 부분 지원     | 브리지는 캐시된 Gateway 세션 스냅샷에서 `session_info_update` 및 최선형 `usage_update` 알림을 내보냅니다. 사용량은 근사치이며 Gateway 토큰 합계가 최신으로 표시된 경우에만 전송됩니다.                             |
| 도구 스트리밍                                                        | 부분 지원     | `tool_call`/`tool_call_update` 이벤트에는 원시 I/O, 텍스트 콘텐츠, 그리고 Gateway 도구 인수/결과에 파일 위치가 노출되는 경우 최선형 파일 위치가 포함됩니다. 내장 터미널과 더 풍부한 diff 네이티브 출력은 제공되지 않습니다.                     |
| 실행 승인                                                        | 부분 지원     | 활성 ACP 프롬프트 턴 중 Gateway 실행 승인 프롬프트가 `session/request_permission`을 통해 ACP 클라이언트로 전달됩니다.                                                                                                               |
| 세션별 MCP 서버(`mcpServers`)                                | 지원되지 않음 | 브리지 모드는 세션별 MCP 서버 요청을 거부합니다. 대신 OpenClaw Gateway 또는 에이전트에서 MCP를 구성하십시오.                                                                                                                          |
| 클라이언트 파일 시스템 메서드(`fs/read_text_file`, `fs/write_text_file`) | 지원되지 않음 | 브리지는 ACP 클라이언트 파일 시스템 메서드를 호출하지 않습니다.                                                                                                                                                                               |
| 클라이언트 터미널 메서드(`terminal/*`)                                | 지원되지 않음 | 브리지는 ACP 클라이언트 터미널을 생성하거나 도구 호출을 통해 터미널 ID를 스트리밍하지 않습니다.                                                                                                                                            |

## 알려진 제한 사항

- `loadSession`은 브리지에서 생성한 세션에 대해서만 전체 ACP 이벤트 원장 기록을 재생합니다. 이전 세션이나 원장이 없는 세션은 트랜스크립트 대체 방식을 사용하며 과거 도구 호출이나 시스템 알림을 재구성하지 않습니다.
- 여러 ACP 클라이언트가 동일한 Gateway 세션 키를 공유하는 경우 이벤트 및 취소 라우팅은 클라이언트별로 엄격하게 격리되지 않고 최선형으로 처리됩니다. 편집기 로컬 턴을 깔끔하게 유지해야 할 때는 기본적으로 격리된 `acp-bridge:<uuid>` 세션을 사용하는 것이 좋습니다.
- Gateway 중지 상태는 ACP 중지 사유로 변환되지만, 이 매핑은 완전한 ACP 네이티브 런타임보다 표현력이 떨어집니다.
- 세션 제어는 Gateway 조정 항목 중 사고 수준, 도구 상세도, 추론, 사용량 세부 정보, 권한 상승 작업에 초점을 맞춘 일부만 제공합니다. 모델 선택 및 실행 호스트 제어는 ACP 구성 옵션으로 제공되지 않습니다.
- `session_info_update` 및 `usage_update`는 실시간 ACP 네이티브 런타임 집계가 아닌 Gateway 세션 스냅샷에서 파생됩니다. 사용량은 근사치이며 비용 데이터가 없고 Gateway가 총 토큰 데이터를 최신으로 표시한 경우에만 내보냅니다.
- 도구 추적 데이터는 최선형입니다. 브리지는 알려진 도구 인수/결과에 나타나는 파일 경로를 제공하지만 ACP 터미널이나 구조화된 파일 diff는 내보내지 않습니다.
- 실행 승인 전달은 활성 ACP 프롬프트 턴으로 제한되며, 다른 Gateway 세션의 승인은 무시됩니다.

## 사용법

```bash
openclaw acp

# 원격 Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# 원격 Gateway(파일에서 토큰 가져오기)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 기존 세션 키에 연결
openclaw acp --session agent:main:main

# 레이블로 연결(이미 존재해야 함)
openclaw acp --session-label "support inbox"

# 첫 번째 프롬프트 전에 세션 키 재설정
openclaw acp --session agent:main:main --reset-session
```

## ACP 클라이언트(디버그)

IDE 없이 브리지를 간단히 점검하려면 기본 제공 ACP 클라이언트를 사용하십시오. 이 클라이언트는 ACP 브리지를 생성하고 대화형으로 프롬프트를 입력할 수 있게 합니다.

```bash
openclaw acp client

# 생성된 브리지가 원격 Gateway를 가리키도록 설정
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 서버 명령 재정의(기본값: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

권한 모델(클라이언트 디버그 모드):

- 자동 승인은 허용 목록을 기반으로 하며 신뢰할 수 있는 핵심 도구 ID에만 적용됩니다.
- `read` 자동 승인은 현재 작업 디렉터리(`--cwd`가 설정된 경우 해당 값)로 제한됩니다.
- ACP는 제한된 읽기 전용 클래스만 자동 승인합니다. 활성 cwd 아래로 범위가 제한된 `read` 호출과 읽기 전용 검색 도구(`search`, `web_search`, `memory_search`)가 이에 해당합니다. 알 수 없거나 핵심이 아닌 도구, 범위를 벗어난 읽기, 실행 가능 도구, 제어 영역 도구, 변경 도구, 대화형 흐름에는 항상 명시적인 프롬프트 승인이 필요합니다.
- 서버에서 제공하는 `toolCall.kind`는 권한 부여 소스가 아니라 신뢰할 수 없는 메타데이터로 취급됩니다.
- 이 ACP 브리지 정책은 ACPX 하네스 권한과 별개입니다. `acpx` 백엔드를 통해 OpenClaw를 실행하는 경우 `plugins.entries.acpx.config.permissionMode=approve-all`은 해당 하네스 세션을 위한 비상용 "yolo" 스위치입니다.

## 프로토콜 스모크 테스트

프로토콜 수준에서 디버깅하려면 격리된 상태로 Gateway를 시작하고 ACP JSON-RPC 클라이언트를 사용하여 stdio를 통해 `openclaw acp`를 구동하십시오. `initialize`, `session/new`, 절대 `cwd`를 사용한 `session/list`, `session/resume`, `session/close`, 중복 종료, 존재하지 않는 세션 재개를 다루십시오.

증명 자료에는 공개된 수명 주기 기능, Gateway 기반 세션 행, 업데이트 알림, Gateway `sessions.list` 로그가 포함되어야 합니다.

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
  "gatewayLogTail": ["[gateway] 준비됨", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

`openclaw gateway call sessions.list`를 유일한 ACP 증명으로 사용하지 마십시오. 이 CLI 경로는 최신 토큰의 운영자 범위 승격을 요청할 수 있습니다. ACP 브리지의 정확성은 ACP stdio 프레임과 Gateway `sessions.list` 로그로 증명됩니다.

## 사용 방법

IDE 또는 다른 클라이언트가 Agent Client Protocol을 사용하며 이를 통해 OpenClaw Gateway 세션을 구동하려는 경우 ACP를 사용하십시오.

1. Gateway가 실행 중인지 확인합니다(로컬 또는 원격).
2. Gateway 대상을 구성합니다(구성 또는 플래그).
3. IDE가 stdio를 통해 `openclaw acp`를 실행하도록 지정합니다.

구성 예시(영구 저장):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

직접 실행 예시(구성을 기록하지 않음):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 로컬 프로세스 안전을 위해 권장됨
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 에이전트 선택

ACP는 에이전트를 직접 선택하지 않습니다. Gateway 세션 키를 기준으로 라우팅합니다. 특정 에이전트를 대상으로 지정하려면 에이전트 범위 세션 키를 사용하십시오.

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 하나의 Gateway 세션 키에 매핑됩니다. 하나의 에이전트가 여러 세션을 가질 수 있으며, 키나 레이블을 재정의하지 않으면 ACP는 기본적으로 격리된 `acp-bridge:<uuid>` 세션을 사용합니다.

세션별 `mcpServers`는 브리지 모드에서 지원되지 않습니다. ACP 클라이언트가 `newSession` 또는 `loadSession` 중에 이를 전송하면 브리지는 조용히 무시하지 않고 명확한 오류를 반환합니다.

ACPX 기반 세션에서 OpenClaw Plugin 도구 또는 `cron`과 같은 일부 기본 제공 도구를 사용하려면 세션별 `mcpServers`를 전달하려 하지 말고 Gateway 측 ACPX MCP 브리지를 활성화하십시오. [ACP 에이전트](/ko/tools/acp-agents-setup#plugin-tools-mcp-bridge) 및 [OpenClaw 도구 MCP 브리지](/ko/tools/acp-agents-setup#openclaw-tools-mcp-bridge)를 참조하십시오.

## `acpx`에서 사용하기(Codex, Claude, 기타 ACP 클라이언트)

Codex 또는 Claude Code와 같은 코딩 에이전트가 ACP를 통해 OpenClaw 봇과 통신하도록 하려면 기본 제공 `openclaw` 대상을 지정하여 `acpx`를 사용하십시오.

일반적인 흐름:

1. Gateway를 실행하고 ACP 브리지가 Gateway에 연결할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 합니다.
3. 코딩 에이전트에서 사용할 OpenClaw 세션 키를 지정합니다.

예:

```bash
# 기본 OpenClaw ACP 세션에 일회성 요청
acpx openclaw exec "활성 OpenClaw 세션 상태를 요약하십시오."

# 후속 요청을 위한 이름이 지정된 영구 세션
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "이 저장소와 관련된 최근 컨텍스트를 내 OpenClaw 작업 에이전트에 요청하십시오."
```

`acpx openclaw`가 매번 특정 Gateway와 세션 키를 대상으로 하게 하려면 `~/.acpx/config.json`에서 `openclaw` 에이전트 명령을 재정의하십시오.

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

저장소 로컬 OpenClaw 체크아웃에서는 ACP 스트림이 깔끔하게 유지되도록 개발 실행기 대신 직접 CLI 진입점을 사용하십시오.

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이는 Codex, Claude Code 또는 기타 ACP 지원 클라이언트가 터미널을 스크래핑하지 않고 OpenClaw 에이전트에서 컨텍스트 정보를 가져오도록 하는 가장 쉬운 방법입니다.

## Zed 편집기 설정

`~/.config/zed/settings.json`에 사용자 지정 ACP 에이전트를 추가하십시오(또는 Zed의 Settings UI를 사용하십시오).

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

특정 Gateway 또는 에이전트를 대상으로 지정하려면 다음과 같이 설정합니다.

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

Zed에서 Agent 패널을 열고 "OpenClaw ACP"를 선택하여 스레드를 시작하십시오.

## 세션 매핑

기본적으로 ACP 브리지 세션에는 `acp-bridge:` 접두사가 포함된 격리된 Gateway 세션 키가 할당됩니다. 이러한 일반 모델 브리지 세션은 합성된 일회용 세션입니다. 오래된 항목 정리 대상이며, 보호되는 사용자 대화 표면으로 취급되지 않습니다. 알려진 세션을 재사용하려면 세션 키 또는 레이블을 전달하십시오.

- `--session <key>`: 특정 Gateway 세션 키를 사용합니다.
- `--session-label <label>`: 레이블로 기존 세션을 확인합니다.
- `--reset-session`: 해당 키에 새 세션 ID를 발급합니다(같은 키, 새 대화 기록).

ACP 클라이언트가 메타데이터를 지원하는 경우 세션별로 재정의할 수 있습니다.

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "지원 받은편지함",
    "resetSession": true
  }
}
```

세션 키에 대한 자세한 내용은 [/concepts/session](/ko/concepts/session)을 참조하십시오.

## 옵션

- `--url <url>`: Gateway WebSocket URL입니다(구성된 경우 기본값은 `gateway.remote.url`).
- `--token <token>`: Gateway 인증 토큰입니다.
- `--token-file <path>`: 파일에서 Gateway 인증 토큰을 읽습니다.
- `--password <password>`: Gateway 인증 비밀번호입니다.
- `--password-file <path>`: 파일에서 Gateway 인증 비밀번호를 읽습니다.
- `--session <key>`: 기본 세션 키입니다.
- `--session-label <label>`: 확인할 기본 세션 레이블입니다.
- `--require-existing`: 세션 키/레이블이 존재하지 않으면 실패합니다.
- `--reset-session`: 처음 사용하기 전에 세션 키를 재설정합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 추가하지 않습니다.
- `--provenance <off|meta|meta+receipt>`: ACP 출처 메타데이터 또는 영수증을 포함합니다.
- `--verbose, -v`: stderr에 상세 로그를 출력합니다.

보안 참고 사항:

- 일부 시스템에서는 `--token`과 `--password`가 로컬 프로세스 목록에 표시될 수 있습니다. `--token-file`/`--password-file` 또는 환경 변수(`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)를 사용하는 것이 좋습니다.
- Gateway 인증 확인은 다른 Gateway 클라이언트에서 사용하는 공유 계약을 따릅니다.
  - 로컬 모드: env(`OPENCLAW_GATEWAY_*`), 이어서 `gateway.auth.*`를 사용하며, `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`로 폴백합니다(구성되었지만 확인되지 않은 로컬 SecretRef는 조용히 폴백하지 않고 실패 시 닫힘 방식으로 처리됩니다).
  - 원격 모드: 원격 우선순위 규칙에 따라 env/config 폴백과 함께 `gateway.remote.*`를 사용합니다.
  - `--url`은 재정의에 안전하며 암시적 config/env 자격 증명을 재사용하지 않습니다. 명시적 `--token`/`--password`(또는 파일 변형)를 전달하십시오.

### `acp client` 옵션

- `--cwd <dir>`: ACP 세션의 작업 디렉터리입니다.
- `--server <command>`: ACP 서버 명령입니다(기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버에 전달할 추가 인수입니다.
- `--server-verbose`: ACP 서버에서 상세 로깅을 활성화합니다.
- `--verbose, -v`: 상세 클라이언트 로깅입니다.
- `openclaw acp client`는 생성된 브리지 프로세스에 `OPENCLAW_SHELL=acp-client`를 설정하며, 이를 컨텍스트별 셸/프로필 규칙에 사용할 수 있습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [ACP 에이전트](/ko/tools/acp-agents)
