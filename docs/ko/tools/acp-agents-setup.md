---
read_when:
    - Claude Code / Codex / Gemini CLI용 acpx harness 설치 또는 구성
    - plugin-tools 또는 OpenClaw-tools MCP 브리지 활성화
    - ACP 권한 모드 구성
summary: 'ACP 에이전트 설정: acpx harness 구성, Plugin 설정, 권한'
title: ACP 에이전트 — 설정
x-i18n:
    generated_at: "2026-04-26T11:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

개요, 운영자 런북, 개념은 [ACP agents](/ko/tools/acp-agents)를 참고하세요.

아래 섹션에서는 acpx harness 구성, MCP 브리지용 Plugin 설정, 권한 구성을 다룹니다.

이 페이지는 ACP/acpx 경로를 설정할 때만 사용하세요. 네이티브 Codex
app-server 런타임 구성은 [Codex harness](/ko/plugins/codex-harness)를 사용하세요. OpenAI API key 또는 Codex OAuth model-provider 구성은
[OpenAI](/ko/providers/openai)를 사용하세요.

Codex에는 두 가지 OpenClaw 경로가 있습니다.

| 경로                      | 구성/명령                                         | 설정 페이지                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 네이티브 Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/ko/plugins/codex-harness) |
| 명시적 Codex ACP 어댑터 | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 이 페이지                               |

명시적으로 ACP/acpx 동작이 필요한 경우가 아니라면 네이티브 경로를 권장합니다.

## acpx harness 지원 (현재)

현재 acpx 내장 harness 별칭:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw가 acpx 백엔드를 사용할 때는, acpx 구성에서 사용자 지정 에이전트 별칭을 정의한 경우가 아니라면 `agentId`에 이 값들을 사용하는 것을 권장합니다.
로컬 Cursor 설치에서 여전히 ACP를 `agent acp`로 노출하는 경우, 내장 기본값을 변경하지 말고 acpx 구성에서 `cursor` 에이전트 명령을 재정의하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`를 통해 임의의 어댑터를 대상으로 지정할 수도 있지만, 이 원시 우회 경로는 acpx CLI 기능이며(일반적인 OpenClaw `agentId` 경로가 아님)입니다.

모델 제어는 어댑터 기능에 따라 달라집니다. Codex ACP 모델 ref는
시작 전에 OpenClaw가 정규화합니다. 다른 harness는 ACP `models`와
`session/set_model` 지원이 필요합니다. harness가 해당 ACP 기능도,
자체 시작 모델 플래그도 노출하지 않으면 OpenClaw/acpx는 모델 선택을
강제할 수 없습니다.

## 필수 구성

핵심 ACP 기본 구성:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어를 유지한 채 ACP 디스패치를 일시 중지하려면 false로 설정합니다.
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
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
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
        spawnAcpSessions: true,
      },
    },
  },
}
```

스레드 바인딩된 ACP spawn이 작동하지 않으면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩에는 하위 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

[Configuration Reference](/ko/gateway/configuration-reference)를 참고하세요.

## acpx 백엔드용 Plugin 설정

새 설치에서는 번들된 `acpx` 런타임 Plugin이 기본적으로 활성화되어 있으므로, ACP는
대개 수동 Plugin 설치 단계 없이 작동합니다.

다음으로 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 차단했거나,
로컬 개발 체크아웃으로 전환하려는 경우에는 명시적인 Plugin 경로를 사용하세요.

```bash
openclaw plugins install acpx
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

### acpx 명령 및 버전 구성

기본적으로 번들된 `acpx` Plugin은 Gateway 시작 중 ACP 에이전트를
spawn하지 않고 내장 ACP 백엔드를 등록합니다. 명시적인 라이브 프로브는
`/acp doctor`를 실행하세요. Gateway가 시작 시 구성된 에이전트를
프로브해야 하는 경우에만 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`을 설정하세요.

Plugin 구성에서 명령 또는 버전을 재정의합니다.

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command`는 절대 경로, 상대 경로(OpenClaw 워크스페이스 기준으로 해석), 또는 명령 이름을 허용합니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- 사용자 지정 `command` 경로는 Plugin 로컬 자동 설치를 비활성화합니다.

[Plugins](/ko/tools/plugin)를 참고하세요.

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면, acpx
런타임 의존성(플랫폼별 바이너리)은 postinstall 훅을 통해 자동으로
설치됩니다. 자동 설치가 실패하더라도 gateway는 정상적으로 시작되며,
누락된 의존성은 `openclaw acp doctor`를 통해 보고됩니다.

### Plugin 도구 MCP 브리지

기본적으로 ACPX 세션은 **OpenClaw Plugin에 등록된 도구를 ACP harness에 노출하지 않습니다**.

Codex나 Claude Code 같은 ACP 에이전트가 설치된
OpenClaw Plugin 도구(예: 메모리 recall/store)를 호출하도록 하려면,
전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 설정이 수행하는 작업:

- ACPX 세션 bootstrap에 `openclaw-plugin-tools`라는 내장 MCP 서버를 주입합니다.
- 설치되고 활성화된 OpenClaw Plugin이 이미 등록한 Plugin 도구를 노출합니다.
- 이 기능을 명시적이고 기본 비활성화 상태로 유지합니다.

보안 및 신뢰 참고 사항:

- ACP harness 도구 표면이 확장됩니다.
- ACP 에이전트는 gateway에서 이미 활성화된 Plugin 도구에만 액세스할 수 있습니다.
- 이는 해당 Plugin을 OpenClaw 자체에서 실행하도록 허용하는 것과 같은 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 Plugin을 검토하세요.

사용자 지정 `mcpServers`는 이전과 동일하게 계속 작동합니다. 내장 plugin-tools 브리지는
일반 MCP 서버 구성을 대체하는 것이 아니라, 추가로 선택할 수 있는 편의 기능입니다.

### OpenClaw 도구 MCP 브리지

기본적으로 ACPX 세션은 MCP를 통해 내장 OpenClaw 도구도 노출하지 않습니다.
ACP 에이전트에 `cron` 같은 선택된 내장 도구가 필요하면 별도의 core-tools 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이 설정이 수행하는 작업:

- ACPX 세션 bootstrap에 `openclaw-tools`라는 내장 MCP 서버를 주입합니다.
- 선택된 내장 OpenClaw 도구를 노출합니다. 초기 서버는 `cron`을 노출합니다.
- 핵심 도구 노출을 명시적이고 기본 비활성화 상태로 유지합니다.

### 런타임 타임아웃 구성

번들된 `acpx` Plugin은 기본적으로 내장 런타임 턴에 120초
타임아웃을 적용합니다. 이렇게 하면 Gemini CLI 같은 느린 harness도
ACP 시작 및 초기화를 완료할 충분한 시간을 확보할 수 있습니다. 호스트에
다른 런타임 제한이 필요하면 재정의하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 후 gateway를 재시작하세요.

### 상태 프로브 에이전트 구성

`/acp doctor` 또는 선택적 시작 프로브가 백엔드를 검사할 때, 번들된
`acpx` Plugin은 하나의 harness 에이전트를 프로브합니다. `acp.allowedAgents`가 설정된 경우
기본값은 첫 번째 허용 에이전트이며, 그렇지 않으면 기본값은 `codex`입니다. 배포 환경에서 상태 검사에 다른 ACP 에이전트가 필요하면 프로브 에이전트를 명시적으로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 후 gateway를 재시작하세요.

## 권한 구성

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기 및 셸 실행 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 개의 구성 key를 제공합니다.

이 ACPX harness 권한은 OpenClaw exec 승인과 별개이며, Claude CLI의 `--permission-mode bypassPermissions` 같은 CLI 백엔드 벤더 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션을 위한 harness 수준의 비상 우회 스위치입니다.

### `permissionMode`

harness 에이전트가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값           | 동작                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기 및 셸 명령을 자동 승인합니다.          |
| `approve-reads` | 읽기만 자동 승인하며, 쓰기와 실행은 프롬프트가 필요합니다. |
| `deny-all`      | 모든 권한 프롬프트를 거부합니다.                              |

### `nonInteractivePermissions`

권한 프롬프트가 표시되어야 하지만 대화형 TTY를 사용할 수 없을 때(ACP 세션에서는 항상 해당) 어떻게 처리할지 제어합니다.

| 값  | 동작                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`로 세션을 중단합니다. **(기본값)**           |
| `deny` | 권한을 조용히 거부하고 계속 진행합니다(점진적 성능 저하). |

### 구성

Plugin 구성으로 설정합니다.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 gateway를 재시작하세요.

> **중요:** OpenClaw의 현재 기본값은 `permissionMode=approve-reads` 및 `nonInteractivePermissions=fail`입니다. 비대화형 ACP 세션에서는 권한 프롬프트를 유발하는 모든 쓰기 또는 실행이 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.
>
> 권한을 제한해야 한다면, 세션이 충돌하는 대신 점진적으로 성능 저하되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.

## 관련 항목

- [ACP agents](/ko/tools/acp-agents) — 개요, 운영자 런북, 개념
- [Sub-agents](/ko/tools/subagents)
- [Multi-agent routing](/ko/concepts/multi-agent)
