---
read_when:
    - Claude Code / Codex / Gemini CLI용 acpx 하네스 설치 또는 구성
    - plugin-tools 또는 OpenClaw-tools MCP 브리지 활성화
    - ACP 권한 모드 구성하기
summary: 'ACP 에이전트 설정: acpx 하니스 구성, Plugin 설정, 권한'
title: ACP 에이전트 — 설정
x-i18n:
    generated_at: "2026-07-12T01:12:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

개요, 운영자 런북 및 개념은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

이 페이지에서는 acpx 하네스 구성, MCP 브리지용 Plugin 설정 및 권한 구성을 다룹니다.

ACP/acpx 경로를 설정할 때만 이 페이지를 사용하세요. 네이티브 Codex
앱 서버 런타임 구성은 [Codex 하네스](/ko/plugins/codex-harness)를 사용하세요.
OpenAI API 키 또는 Codex OAuth 모델 공급자 구성은
[OpenAI](/ko/providers/openai)를 사용하세요.

Codex에는 두 가지 OpenClaw 경로가 있습니다.

| 경로                       | 구성/명령                                              | 설정 페이지                             |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 네이티브 Codex 앱 서버     | `/codex ...`, `openai/gpt-*` 에이전트 참조             | [Codex 하네스](/ko/plugins/codex-harness) |
| 명시적 Codex ACP 어댑터    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 이 페이지                               |

ACP/acpx 동작이 명시적으로 필요한 경우가 아니라면 네이티브 경로를 우선 사용하세요.

## acpx 하네스 지원(현재)

내장 acpx 하네스 별칭(고정된 `acpx` 종속성에서 제공):

| 별칭         | 래핑 대상                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP 브리지(네이티브 `openclaw acp`)                                                                    |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid`와 `factorydroid`도 내장 `droid` 어댑터로 해석됩니다.

OpenClaw에서 acpx 백엔드를 사용할 때는 acpx 구성에 사용자 지정 에이전트 별칭이 정의되어 있지 않은 한 `agentId`에 이 값을 우선 사용하세요.
로컬 Cursor 설치가 여전히 ACP를 `agent acp`로 노출한다면 내장 기본값을 변경하지 말고 acpx 구성에서 `cursor` 에이전트 명령을 재정의하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`를 통해 임의의 어댑터를 대상으로 지정할 수도 있지만, 이 원시 우회 경로는 acpx CLI 기능이며 일반적인 OpenClaw `agentId` 경로는 아닙니다.

모델 제어는 어댑터 기능에 따라 달라집니다. Codex ACP 모델 참조는 시작 전에
OpenClaw에서 정규화됩니다. 다른 하네스에는 ACP `models`와
`session/set_model` 지원이 필요합니다. 하네스가 해당 ACP 기능과
자체 시작 모델 플래그를 모두 제공하지 않으면 OpenClaw/acpx에서 모델 선택을 강제할 수 없습니다.

## 필수 구성

핵심 ACP 기준 구성:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true입니다. /acp 제어를 유지하면서 ACP 디스패치를 일시 중지하려면 false로 설정합니다.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // 기본값은 coalesceIdleMs: 350, maxChunkChars: 1800이며, 여기서는 명시적으로 표시합니다.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

스레드 바인딩 구성은 채널 어댑터마다 다릅니다. Discord 예시:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        // 기본값은 이미 true이며, 여기서는 명시적으로 표시합니다.
        spawnSessions: true,
      },
    },
  },
}
```

스레드에 바인딩된 ACP 생성이 작동하지 않으면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnSessions=true`

현재 대화 바인딩에는 하위 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

[구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## acpx 백엔드용 Plugin 설정

패키지 설치에서는 ACP용 공식 `@openclaw/acpx` 런타임 Plugin을 사용합니다.
ACP 하네스 세션을 사용하기 전에 설치하고 활성화하세요.

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

소스 체크아웃에서는 `pnpm install` 후 로컬 워크스페이스 Plugin도 사용할 수 있습니다.

다음으로 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나 `plugins.allow` / `plugins.deny`를 통해 거부했거나
패키지 Plugin으로 다시 전환하려면 명시적 패키지 경로를 사용하세요.

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 워크스페이스 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그런 다음 백엔드 상태를 확인하세요.

```text
/acp doctor
```

### acpx 런타임 시작 프로브

`acpx` Plugin은 ACP 런타임을 직접 내장합니다(별도로 구성할 `acpx` 바이너리나
버전이 없음). 기본적으로 Gateway 시작 중에 내장 백엔드를 등록하고
Gateway `ready` 신호 전에 시작 프로브를 기다립니다.
시작 프로브를 의도적으로 비활성화하는 스크립트나 환경에서만
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 또는
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`을 설정하세요. 명시적인
온디맨드 프로브에는 `/acp doctor`를 실행하세요.

경로나 플래그 값을 하나의 argv 토큰으로 유지해야 할 때 구조화된 인수를 사용하여
개별 ACP 에이전트 명령을 재정의하세요.

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command`는 해당 ACP 에이전트의 실행 파일 또는 기존 명령 문자열입니다.
- `agents.<id>.args`는 선택 사항입니다. OpenClaw가 현재 acpx 명령 문자열 레지스트리를 통해 전달하기 전에 각 배열 항목을 셸 인용 처리합니다.

[Plugin](/ko/tools/plugin)을 참조하세요.

### 자동 어댑터 다운로드

`acpx`는 처음 사용할 때 `npx`를 통해 ACP 어댑터(예: Claude 및 Codex ACP
브리지)를 자동으로 다운로드합니다. 어댑터 패키지를 수동으로 설치할 필요가
없으며 OpenClaw 자체에도 별도의 설치 후 단계가 없습니다. 어댑터
다운로드 또는 생성에 실패하면 `/acp doctor`에서 실패를 보고합니다.

### Plugin 도구 MCP 브리지

기본적으로 ACPX 세션은 OpenClaw Plugin에서 등록한 도구를 ACP 하네스에
노출하지 **않습니다**.

Codex 또는 Claude Code 같은 ACP 에이전트가 메모리 조회/저장 등의 설치된
OpenClaw Plugin 도구를 호출하도록 하려면 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 기능의 동작:

- `openclaw-plugin-tools`라는 내장 MCP 서버를 ACPX 세션
  부트스트랩에 삽입합니다.
- 설치 및 활성화된 OpenClaw Plugin에서 이미 등록한 Plugin 도구를
  노출합니다.
- 기능을 명시적인 선택 사항으로 유지하며 기본적으로 비활성화합니다.

보안 및 신뢰 관련 참고 사항:

- ACP 하네스의 도구 범위가 확장됩니다.
- ACP 에이전트는 Gateway에서 이미 활성화된 Plugin 도구에만 접근할 수 있습니다.
- 해당 Plugin이 OpenClaw 자체에서 실행되도록 허용하는 것과 동일한 신뢰 경계로 간주하세요.
- 활성화하기 전에 설치된 Plugin을 검토하세요.

사용자 지정 `mcpServers`는 이전과 동일하게 작동합니다. 내장 Plugin 도구 브리지는
일반 MCP 서버 구성을 대체하는 기능이 아니라 추가로 선택할 수 있는 편의 기능입니다.

### OpenClaw 도구 MCP 브리지

기본적으로 ACPX 세션은 내장 OpenClaw 도구도 MCP를 통해 노출하지
**않습니다**. ACP 에이전트에 `cron` 같은 일부 내장 도구가 필요하면
별도의 핵심 도구 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이 기능의 동작:

- `openclaw-tools`라는 내장 MCP 서버를 ACPX 세션
  부트스트랩에 삽입합니다.
- 선택된 내장 OpenClaw 도구를 노출합니다. 초기 서버는 `cron`을 노출합니다.
- 핵심 도구 노출을 명시적인 선택 사항으로 유지하며 기본적으로 비활성화합니다.

### 런타임 작업 시간 제한 구성

`acpx` Plugin은 기본적으로 내장 런타임 시작 및 제어 작업에 120초를
부여합니다. 따라서 Gemini CLI처럼 속도가 느린 하네스도 ACP 시작 및 초기화를
완료할 충분한 시간을 확보할 수 있습니다. 호스트에 다른 작업 제한이 필요하면
재정의하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

런타임 턴에는 `/acp timeout`을 포함한 OpenClaw 에이전트/실행 시간 제한이 적용됩니다.
`sessions_spawn`은 호출별 시간 제한 재정의를 허용하지 않습니다. 운영자용 경로는
`agents.defaults.subagents.runTimeoutSeconds`입니다. `timeoutSeconds`를
변경한 후 Gateway를 다시 시작하세요.

### 상태 프로브 에이전트 구성

`/acp doctor` 또는 시작 프로브에서 백엔드를 확인할 때 번들 `acpx`
Plugin은 하나의 하네스 에이전트를 프로브합니다. `acp.allowedAgents`가 설정되어 있으면
첫 번째 허용 에이전트가 기본값이고, 그렇지 않으면 `codex`가 기본값입니다. 배포 환경의
상태 검사에 다른 ACP 에이전트가 필요하면 프로브 에이전트를 명시적으로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 후 Gateway를 다시 시작하세요.

## 권한 구성

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기 및 셸 실행 권한 프롬프트를 승인하거나
거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 가지 구성 키를 제공합니다.

이러한 ACPX 하네스 권한은 OpenClaw 실행 승인 및 Claude CLI의 `--permission-mode bypassPermissions` 같은 CLI 백엔드 공급업체 우회 플래그와 별개입니다. ACPX `approve-all`은 ACP 세션용 하네스 수준의 비상 전환 스위치입니다.

OpenClaw `tools.exec.mode`, Codex Guardian 승인 및 ACPX 하네스 권한의
포괄적인 비교는 [권한 모드](/ko/tools/permission-modes)를 참조하세요.

### `permissionMode`

하네스 에이전트가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값              | 동작                                                         |
| --------------- | ------------------------------------------------------------ |
| `approve-all`   | 모든 파일 쓰기와 셸 명령을 자동 승인합니다.                  |
| `approve-reads` | 읽기만 자동 승인하며, 쓰기와 실행에는 승인을 요청합니다.     |
| `deny-all`      | 모든 권한 요청을 거부합니다.                                 |

### `nonInteractivePermissions`

권한 요청을 표시해야 하지만 대화형 TTY를 사용할 수 없을 때의 동작을 제어합니다(ACP 세션은 항상 이에 해당합니다).

| 값     | 동작                                                                       |
| ------ | -------------------------------------------------------------------------- |
| `fail` | `PermissionPromptUnavailableError`와 함께 세션을 중단합니다. **(기본값)** |
| `deny` | 권한을 알림 없이 거부하고 계속 진행합니다(정상적인 기능 축소).             |

### 구성

Plugin 구성으로 설정합니다.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 Gateway를 다시 시작합니다.

<Warning>
OpenClaw의 기본값은 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`입니다. 비대화형 ACP 세션에서는 권한 요청을 유발하는 모든 쓰기 또는 실행이 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 오류와 함께 실패할 수 있습니다.

권한을 제한해야 하는 경우 세션이 비정상 종료되지 않고 정상적으로 기능을 축소하도록 `nonInteractivePermissions`를 `deny`로 설정하세요.
</Warning>

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents) — 개요, 운영자 실행 지침, 개념
- [하위 에이전트](/ko/tools/subagents)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
