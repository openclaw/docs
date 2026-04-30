---
read_when:
    - Claude Code / Codex / Gemini CLI용 acpx 하네스 설치 또는 구성
    - plugin-tools 또는 OpenClaw-tools MCP 브리지 활성화
    - ACP 권한 모드 구성
summary: 'ACP 에이전트 설정: acpx 하네스 구성, Plugin 설정, 권한'
title: ACP 에이전트 — 설정
x-i18n:
    generated_at: "2026-04-30T06:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

개요, 운영자 런북, 개념은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

아래 섹션에서는 acpx 하네스 설정, MCP 브리지용 Plugin 설정, 권한 구성을 다룹니다.

ACP/acpx 경로를 설정할 때만 이 페이지를 사용하세요. 네이티브 Codex
app-server 런타임 설정은 [Codex 하네스](/ko/plugins/codex-harness)를 사용하세요. OpenAI
API 키 또는 Codex OAuth 모델 제공자 설정은
[OpenAI](/ko/providers/openai)를 사용하세요.

Codex에는 두 가지 OpenClaw 경로가 있습니다.

| 경로                       | 설정/명령                                              | 설정 페이지                             |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 네이티브 Codex app-server  | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex 하네스](/ko/plugins/codex-harness) |
| 명시적 Codex ACP 어댑터    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 이 페이지                               |

ACP/acpx 동작이 명시적으로 필요한 경우가 아니면 네이티브 경로를 선호하세요.

## acpx 하네스 지원(현재)

현재 acpx 기본 제공 하네스 별칭:

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

OpenClaw가 acpx 백엔드를 사용할 때는 acpx 설정에서 사용자 지정 에이전트 별칭을 정의하지 않았다면 `agentId`에 이 값들을 선호하세요.
로컬 Cursor 설치가 아직 ACP를 `agent acp`로 노출한다면, 기본 제공 기본값을 변경하지 말고 acpx 설정에서 `cursor` 에이전트 명령을 재정의하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`를 통해 임의의 어댑터를 대상으로 할 수도 있지만, 이 원시 우회 수단은 acpx CLI 기능입니다(일반 OpenClaw `agentId` 경로가 아님).

모델 제어는 어댑터 기능에 따라 달라집니다. Codex ACP 모델 참조는 시작 전에
OpenClaw가 정규화합니다. 다른 하네스에는 ACP `models`와
`session/set_model` 지원이 필요합니다. 하네스가 해당 ACP 기능도 자체 시작 모델 플래그도 노출하지 않으면 OpenClaw/acpx는 모델 선택을 강제할 수 없습니다.

## 필수 설정

핵심 ACP 기준선:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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

스레드 바인딩 설정은 채널 어댑터별로 다릅니다. Discord 예시:

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

스레드에 바인딩된 ACP 생성이 작동하지 않으면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩에는 자식 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

[설정 참조](/ko/gateway/configuration-reference)를 참조하세요.

## acpx 백엔드용 Plugin 설정

새 설치에는 번들된 `acpx` 런타임 Plugin이 기본적으로 활성화된 상태로 제공되므로 ACP는
일반적으로 수동 Plugin 설치 단계 없이 작동합니다.

다음으로 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`를 통해 거부했거나, 로컬 개발 체크아웃으로
전환하려면 명시적 Plugin 경로를 사용하세요.

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

### acpx 명령 및 버전 설정

기본적으로 번들된 `acpx` Plugin은 Gateway 시작 중 ACP 에이전트를 생성하지 않고
내장 ACP 백엔드를 등록합니다. 명시적 라이브 프로브는 `/acp doctor`를 실행하세요.
시작 시 Gateway가 설정된 에이전트를 프로브해야 하는 경우에만 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`을 설정하세요.

Plugin 설정에서 명령 또는 버전을 재정의하세요.

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

- `command`는 절대 경로, 상대 경로(OpenClaw 워크스페이스 기준으로 해석됨), 또는 명령 이름을 허용합니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- 사용자 지정 `command` 경로는 Plugin 로컬 자동 설치를 비활성화합니다.

[Plugin](/ko/tools/plugin)을 참조하세요.

### 자동 종속성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면 acpx
런타임 종속성(플랫폼별 바이너리)이 postinstall 훅을 통해 자동으로 설치됩니다.
자동 설치가 실패해도 Gateway는 정상적으로 시작되며 누락된 종속성을 `openclaw acp doctor`를 통해 보고합니다.

### Plugin 도구 MCP 브리지

기본적으로 ACPX 세션은 OpenClaw Plugin 등록 도구를
ACP 하네스에 노출하지 **않습니다**.

Codex 또는 Claude Code와 같은 ACP 에이전트가 memory recall/store 같은 설치된
OpenClaw Plugin 도구를 호출하게 하려면 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 기능이 하는 일:

- ACPX 세션 부트스트랩에 `openclaw-plugin-tools`라는 기본 제공 MCP 서버를
  주입합니다.
- 설치되고 활성화된 OpenClaw Plugin이 이미 등록한 Plugin 도구를 노출합니다.
- 이 기능을 명시적이며 기본적으로 꺼진 상태로 유지합니다.

보안 및 신뢰 참고 사항:

- 이는 ACP 하네스 도구 표면을 확장합니다.
- ACP 에이전트는 Gateway에서 이미 활성화된 Plugin 도구에만 접근할 수 있습니다.
- 이를 해당 Plugin이 OpenClaw 자체에서 실행되도록 허용하는 것과 동일한 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 Plugin을 검토하세요.

사용자 지정 `mcpServers`는 이전처럼 계속 작동합니다. 기본 제공 Plugin 도구 브리지는
일반 MCP 서버 설정을 대체하는 것이 아니라 추가적인 선택형 편의 기능입니다.

### OpenClaw 도구 MCP 브리지

기본적으로 ACPX 세션은 MCP를 통해 기본 제공 OpenClaw 도구도
노출하지 **않습니다**. ACP 에이전트가 `cron` 같은 선택된 기본 제공
도구가 필요할 때 별도의 코어 도구 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이 기능이 하는 일:

- ACPX 세션 부트스트랩에 `openclaw-tools`라는 기본 제공 MCP 서버를
  주입합니다.
- 선택된 기본 제공 OpenClaw 도구를 노출합니다. 초기 서버는 `cron`을 노출합니다.
- 코어 도구 노출을 명시적이며 기본적으로 꺼진 상태로 유지합니다.

### 런타임 시간 제한 설정

번들된 `acpx` Plugin은 내장 런타임 턴의 기본값을 120초
시간 제한으로 설정합니다. 이렇게 하면 Gemini CLI 같은 느린 하네스가
ACP 시작과 초기화를 완료할 충분한 시간을 얻습니다. 호스트에 다른
런타임 제한이 필요하면 재정의하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 후 Gateway를 다시 시작하세요.

### 상태 프로브 에이전트 설정

`/acp doctor` 또는 선택형 시작 프로브가 백엔드를 확인할 때, 번들된
`acpx` Plugin은 하나의 하네스 에이전트를 프로브합니다. `acp.allowedAgents`가 설정되어 있으면
기본값은 첫 번째 허용 에이전트이고, 그렇지 않으면 `codex`가 기본값입니다. 배포에서
상태 확인에 다른 ACP 에이전트가 필요하면 프로브 에이전트를 명시적으로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 후 Gateway를 다시 시작하세요.

## 권한 구성

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기와 셸 실행 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 가지 설정 키를 제공합니다.

이러한 ACPX 하네스 권한은 OpenClaw 실행 승인과 별개이며, Claude CLI `--permission-mode bypassPermissions` 같은 CLI 백엔드 공급업체 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션용 하네스 수준 비상 스위치입니다.

### `permissionMode`

하네스 에이전트가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값              | 동작                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 셸 명령을 자동 승인합니다.              |
| `approve-reads` | 읽기만 자동 승인하며, 쓰기와 실행에는 프롬프트가 필요합니다. |
| `deny-all`      | 모든 권한 프롬프트를 거부합니다.                         |

### `nonInteractivePermissions`

권한 프롬프트가 표시되어야 하지만 대화형 TTY를 사용할 수 없을 때(ACP 세션에서는 항상 해당) 발생하는 동작을 제어합니다.

| 값     | 동작                                                            |
| ------ | --------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션을 중단합니다. **(기본값)**        |
| `deny` | 권한을 조용히 거부하고 계속합니다(우아한 성능 저하).            |

### 설정

Plugin 설정을 통해 지정합니다.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 Gateway를 다시 시작하세요.

<Warning>
OpenClaw의 기본값은 `permissionMode=approve-reads` 및 `nonInteractivePermissions=fail`입니다. 비대화형 ACP 세션에서 권한 프롬프트를 트리거하는 쓰기 또는 실행은 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.

권한을 제한해야 한다면 세션이 충돌하는 대신 우아하게 성능 저하되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.
</Warning>

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents) — 개요, 운영자 런북, 개념
- [하위 에이전트](/ko/tools/subagents)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
