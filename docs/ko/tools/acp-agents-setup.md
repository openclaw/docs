---
read_when:
    - Claude Code / Codex / Gemini CLI용 acpx harness 설치 또는 구성하기
    - plugin-tools 또는 OpenClaw-tools MCP 브리지 활성화하기
    - ACP 권한 모드 구성하기
summary: 'ACP 에이전트 설정: acpx harness 구성, Plugin 설정, 권한'
title: ACP 에이전트 — 설정
x-i18n:
    generated_at: "2026-04-25T06:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

개요, 운영자 런북, 개념은 [ACP agents](/ko/tools/acp-agents)를 참조하세요.

아래 섹션은 acpx harness 구성, MCP 브리지용 Plugin 설정, 권한 구성을 다룹니다.

## acpx harness 지원(현재)

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

OpenClaw가 acpx 백엔드를 사용할 때는, acpx config에서 커스텀 agent 별칭을 정의하지 않았다면 `agentId`에 이 값들을 사용하는 것이 좋습니다.
로컬 Cursor 설치가 아직 ACP를 `agent acp`로 노출한다면, 내장 기본값을 바꾸는 대신 acpx config에서 `cursor` agent 명령을 override하세요.

직접 acpx CLI 사용 시에는 `--agent <command>`로 임의의 adapter를 대상으로 할 수도 있지만, 이 raw escape hatch는 일반적인 OpenClaw `agentId` 경로가 아니라 acpx CLI 기능입니다.

## 필수 구성

핵심 ACP 기준선:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어는 유지하면서 ACP 디스패치를 일시 중지하려면 false로 설정합니다.
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

스레드 바인딩 구성은 채널 adapter별입니다. Discord 예시:

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

스레드 바인딩 ACP spawn이 동작하지 않으면 먼저 adapter 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩은 자식 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 adapter가 필요합니다.

[Configuration Reference](/ko/gateway/configuration-reference)를 참조하세요.

## acpx 백엔드용 Plugin 설정

새 설치에서는 번들된 `acpx` runtime Plugin이 기본적으로 활성화되어 있으므로, 보통 수동 Plugin 설치 단계 없이 ACP가 동작합니다.

다음으로 시작하세요:

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 거부했거나,
로컬 개발 체크아웃으로 전환하려면 명시적 Plugin 경로를 사용하세요.

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 워크스페이스 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그런 다음 백엔드 상태를 확인합니다.

```text
/acp doctor
```

### acpx 명령 및 버전 구성

기본적으로 번들된 `acpx` Plugin은 Plugin 로컬에 고정된 바이너리(Plugin 패키지 내부의 `node_modules/.bin/acpx`)를 사용합니다. 시작 시 백엔드는 not-ready로 등록되고 백그라운드 작업이 `acpx --version`을 검증합니다. 바이너리가 없거나 버전이 맞지 않으면 `npm install --omit=dev --no-save acpx@<pinned>`를 실행하고 다시 검증합니다. 이 과정에서도 gateway는 계속 non-blocking 상태를 유지합니다.

Plugin config에서 명령 또는 버전을 override하세요.

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

- `command`는 절대 경로, 상대 경로(OpenClaw 워크스페이스 기준으로 해석), 또는 명령 이름을 받을 수 있습니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- 커스텀 `command` 경로는 Plugin 로컬 자동 설치를 비활성화합니다.

[Plugins](/ko/tools/plugin)를 참조하세요.

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면, acpx
runtime 의존성(플랫폼별 바이너리)은 postinstall hook을 통해 자동으로
설치됩니다. 자동 설치가 실패해도 gateway는 정상적으로 시작되며,
누락된 의존성은 `openclaw acp doctor`를 통해 보고됩니다.

### Plugin tools MCP 브리지

기본적으로 ACPX 세션은 ACP harness에 OpenClaw Plugin 등록 도구를 **노출하지 않습니다**.

Codex나 Claude Code 같은 ACP 에이전트가 메모리 recall/store 같은 설치된
OpenClaw Plugin 도구를 호출하게 하려면, 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이것이 하는 일:

- ACPX 세션
  bootstrap에 `openclaw-plugin-tools`라는 내장 MCP 서버를 주입합니다.
- 설치 및 활성화된 OpenClaw
  Plugin이 이미 등록한 Plugin 도구를 노출합니다.
- 이 기능을 명시적이며 기본 비활성 상태로 유지합니다.

보안 및 신뢰 참고:

- 이는 ACP harness 도구 표면을 확장합니다.
- ACP 에이전트는 gateway에서 이미 활성화된 Plugin 도구에만 접근합니다.
- 이를 해당 Plugin이 OpenClaw 자체에서 실행되도록 허용하는 것과 같은 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 Plugin을 검토하세요.

커스텀 `mcpServers`는 이전과 동일하게 계속 동작합니다. 내장 plugin-tools 브리지는
기존 generic MCP 서버 구성을 대체하는 것이 아니라 추가적인 옵트인 편의 기능입니다.

### OpenClaw tools MCP 브리지

기본적으로 ACPX 세션은 내장 OpenClaw 도구도
MCP를 통해 노출하지 않습니다. ACP 에이전트가 `cron` 같은 선택된
내장 도구가 필요할 때는 별도의 core-tools 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이것이 하는 일:

- ACPX 세션
  bootstrap에 `openclaw-tools`라는 내장 MCP 서버를 주입합니다.
- 선택된 내장 OpenClaw 도구를 노출합니다. 초기 서버는 `cron`을 노출합니다.
- core-tool 노출을 명시적이며 기본 비활성 상태로 유지합니다.

### 런타임 timeout 구성

번들된 `acpx` Plugin은 내장 runtime 턴의 기본 timeout을 120초로 설정합니다.
이렇게 하면 Gemini CLI 같은 느린 harness도 ACP 시작과 초기화를 완료할
충분한 시간을 가질 수 있습니다. 호스트에 다른 runtime 제한이 필요하면 override하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 뒤 Gateway를 재시작하세요.

### 상태 probe agent 구성

번들된 `acpx` Plugin은 내장 runtime 백엔드가 준비되었는지 판단할 때
하나의 harness agent를 probe합니다. `acp.allowedAgents`가 설정되어 있으면 기본적으로
첫 번째 허용 agent를 사용하고, 그렇지 않으면 `codex`를 기본값으로 사용합니다. 배포에
다른 ACP agent가 상태 검사에 필요하다면 probe agent를 명시적으로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 뒤 Gateway를 재시작하세요.

## 권한 구성

ACP 세션은 non-interactive로 실행됩니다 — 파일 쓰기 및 shell 실행 권한 프롬프트를 승인 또는 거부할 TTY가 없습니다. acpx Plugin은 권한 처리를 제어하는 두 개의 config 키를 제공합니다.

이 ACPX harness 권한은 OpenClaw exec approval과 별개이며, Claude CLI `--permission-mode bypassPermissions` 같은 CLI 백엔드 vendor 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션을 위한 harness 수준의 비상 스위치입니다.

### `permissionMode`

프롬프트 없이 harness agent가 어떤 작업을 수행할 수 있는지 제어합니다.

| Value           | 동작                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 shell 명령을 자동 승인합니다.            |
| `approve-reads` | 읽기만 자동 승인하며, 쓰기와 exec는 프롬프트가 필요합니다. |
| `deny-all`      | 모든 권한 프롬프트를 거부합니다.                          |

### `nonInteractivePermissions`

권한 프롬프트가 표시되어야 하지만 interactive TTY를 사용할 수 없는 경우(ACP 세션에서는 항상 해당) 어떻게 할지를 제어합니다.

| Value  | 동작                                                                  |
| ------ | --------------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션을 중단합니다. **(기본값)**              |
| `deny` | 권한을 조용히 거부하고 계속 진행합니다(우아한 성능 저하).             |

### 구성

Plugin config를 통해 설정합니다.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 뒤 Gateway를 재시작하세요.

> **중요:** OpenClaw는 현재 기본값으로 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`을 사용합니다. non-interactive ACP 세션에서는 권한 프롬프트를 트리거하는 모든 쓰기 또는 exec가 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`로 실패할 수 있습니다.
>
> 권한을 제한해야 한다면, 세션이 크래시하는 대신 우아하게 성능 저하되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.

## 관련 항목

- [ACP agents](/ko/tools/acp-agents) — 개요, 운영자 런북, 개념
- [Sub-agents](/ko/tools/subagents)
- [Multi-agent routing](/ko/concepts/multi-agent)
