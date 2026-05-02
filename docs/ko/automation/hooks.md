---
read_when:
    - /new, /reset, /stop 및 에이전트 수명 주기 이벤트를 위한 이벤트 기반 자동화를 원합니다
    - 훅을 빌드, 설치 또는 디버그하려는 경우
summary: '후크: 명령 및 수명 주기 이벤트를 위한 이벤트 기반 자동화'
title: 훅
x-i18n:
    generated_at: "2026-05-02T20:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks는 Gateway 내부에서 어떤 일이 발생할 때 실행되는 작은 스크립트입니다. 디렉터리에서 발견할 수 있으며 `openclaw hooks`로 검사할 수 있습니다. Gateway는 hooks를 활성화하거나 hook 항목, hook pack, legacy handler, 추가 hook 디렉터리 중 하나 이상을 구성한 뒤에만 internal hooks를 로드합니다.

OpenClaw에는 두 종류의 hooks가 있습니다.

- **Internal hooks**(이 페이지): `/new`, `/reset`, `/stop` 또는 lifecycle events 같은 agent events가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhook**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있게 하는 외부 HTTP endpoints입니다. [Webhook](/ko/automation/cron-jobs#webhooks)을 참조하세요.

Hooks는 plugins 내부에 함께 번들될 수도 있습니다. `openclaw hooks list`는 standalone hooks와 plugin-managed hooks를 모두 표시합니다.

## 빠른 시작

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## 이벤트 유형

| 이벤트                   | 발생 시점                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` 명령이 실행됨                                       |
| `command:reset`          | `/reset` 명령이 실행됨                                     |
| `command:stop`           | `/stop` 명령이 실행됨                                      |
| `command`                | 모든 명령 이벤트(일반 리스너)                              |
| `session:compact:before` | Compaction이 기록을 요약하기 전                            |
| `session:compact:after`  | Compaction이 완료된 후                                     |
| `session:patch`          | 세션 속성이 수정될 때                                      |
| `agent:bootstrap`        | workspace bootstrap 파일이 주입되기 전                     |
| `gateway:startup`        | 채널이 시작되고 hooks가 로드된 후                          |
| `gateway:shutdown`       | Gateway 종료가 시작될 때                                   |
| `gateway:pre-restart`    | 예상된 Gateway 재시작 전                                   |
| `message:received`       | 모든 채널에서 들어온 인바운드 메시지                       |
| `message:transcribed`    | 오디오 전사가 완료된 후                                    |
| `message:preprocessed`   | 미디어와 링크 전처리가 완료되거나 건너뛴 후                |
| `message:sent`           | 아웃바운드 메시지가 전달됨                                 |

## Hooks 작성

### Hook 구조

각 hook은 두 파일이 포함된 디렉터리입니다.

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md 형식

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**메타데이터 필드**(`metadata.openclaw`):

| 필드       | 설명                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI에 표시할 이모지                                  |
| `events`   | 수신할 이벤트 배열                                   |
| `export`   | 사용할 named export(기본값은 `"default"`)            |
| `os`       | 필요한 플랫폼(예: `["darwin", "linux"]`)             |
| `requires` | 필요한 `bins`, `anyBins`, `env` 또는 `config` 경로    |
| `always`   | 적격성 검사를 우회(boolean)                          |
| `install`  | 설치 방법                                            |

### Handler 구현

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

각 이벤트에는 `type`, `action`, `sessionKey`, `timestamp`, `messages`(사용자에게 보내려면 push), `context`(이벤트별 데이터)가 포함됩니다. Agent와 tool plugin hook 컨텍스트에는 `trace`도 포함될 수 있으며, 이는 plugins가 OTEL 상관관계를 위해 구조화된 로그에 전달할 수 있는 읽기 전용 W3C 호환 진단 trace 컨텍스트입니다.

### 이벤트 컨텍스트 주요 사항

**명령 이벤트**(`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**메시지 이벤트**(`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata`(`senderId`, `senderName`, `guildId`를 포함한 provider별 데이터). `context.content`는 command-like 메시지의 비어 있지 않은 명령 본문을 우선 사용한 다음, 원시 인바운드 본문과 일반 본문으로 fallback합니다. thread history나 link summaries 같은 agent 전용 보강 내용은 포함하지 않습니다.

**메시지 이벤트**(`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**메시지 이벤트**(`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**메시지 이벤트**(`message:preprocessed`): `context.bodyForAgent`(최종 보강 본문), `context.from`, `context.channelId`.

**Bootstrap 이벤트**(`agent:bootstrap`): `context.bootstrapFiles`(변경 가능한 배열), `context.agentId`.

**세션 패치 이벤트**(`session:patch`): `context.sessionEntry`, `context.patch`(변경된 필드만), `context.cfg`. 권한이 있는 클라이언트만 patch events를 트리거할 수 있습니다.

**Compaction 이벤트**: `session:compact:before`에는 `messageCount`, `tokenCount`가 포함됩니다. `session:compact:after`는 `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`를 추가합니다.

`command:stop`은 사용자가 `/stop`을 실행하는 것을 관찰합니다. 이는 cancellation/command lifecycle이지 agent-finalization gate가 아닙니다. 자연스러운 최종 답변을 검사하고 agent에게 한 번 더 처리하도록 요청해야 하는 plugins는 대신 typed plugin hook인 `before_agent_finalize`를 사용해야 합니다. [Plugin hooks](/ko/plugins/hooks)를 참조하세요.

**Gateway lifecycle 이벤트**: `gateway:shutdown`에는 `reason`과 `restartExpectedMs`가 포함되며, Gateway 종료가 시작될 때 발생합니다. `gateway:pre-restart`는 동일한 컨텍스트를 포함하지만, 종료가 예상된 재시작의 일부이고 유한한 `restartExpectedMs` 값이 제공된 경우에만 발생합니다. 종료 중에는 각 lifecycle hook 대기가 최선 노력 방식이며 제한 시간이 적용되어 handler가 멈춰도 종료가 계속됩니다.

## Hook 발견

Hooks는 다음 디렉터리에서 발견되며, 뒤로 갈수록 override 우선순위가 높아집니다.

1. **Bundled hooks**: OpenClaw와 함께 제공됨
2. **Plugin hooks**: 설치된 plugins 내부에 번들된 hooks
3. **Managed hooks**: `~/.openclaw/hooks/`(사용자가 설치하고 workspace 간에 공유됨). `hooks.internal.load.extraDirs`의 추가 디렉터리도 이 우선순위를 공유합니다.
4. **Workspace hooks**: `<workspace>/hooks/`(agent별, 명시적으로 활성화할 때까지 기본적으로 비활성화됨)

Workspace hooks는 새 hook 이름을 추가할 수 있지만, 동일한 이름의 bundled, managed 또는 plugin-provided hooks를 override할 수는 없습니다.

Gateway는 internal hooks가 구성될 때까지 시작 시 internal hook discovery를 건너뜁니다. `openclaw hooks enable <name>`으로 bundled 또는 managed hook을 활성화하거나, hook pack을 설치하거나, `hooks.internal.enabled=true`를 설정해 opt in하세요. 이름이 지정된 hook 하나를 활성화하면 Gateway는 해당 hook의 handler만 로드합니다. `hooks.internal.enabled=true`, 추가 hook 디렉터리, legacy handlers는 broad discovery에 opt in합니다.

### Hook packs

Hook packs는 `package.json`의 `openclaw.hooks`를 통해 hooks를 내보내는 npm packages입니다. 다음으로 설치하세요.

```bash
openclaw plugins install <path-or-spec>
```

Npm 명세는 레지스트리 전용입니다(패키지 이름 + 선택적 정확한 버전 또는 dist-tag). Git/URL/file 명세와 semver 범위는 거부됩니다.

## 번들된 훅

| 훅                    | 이벤트                       | 수행 작업                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | 세션 컨텍스트를 `<workspace>/memory/`에 저장합니다    |
| bootstrap-extra-files | `agent:bootstrap`              | glob 패턴에서 추가 부트스트랩 파일을 주입합니다      |
| command-logger        | `command`                      | 모든 명령을 `~/.openclaw/logs/commands.log`에 기록합니다 |
| boot-md               | `gateway:startup`              | Gateway가 시작될 때 `BOOT.md`를 실행합니다            |

번들된 훅을 활성화하려면:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 세부 정보

마지막 사용자/어시스턴트 메시지 15개를 추출하고, LLM을 통해 설명적인 파일 이름 슬러그를 생성한 뒤, 호스트 로컬 날짜를 사용해 `<workspace>/memory/YYYY-MM-DD-slug.md`에 저장합니다. `workspace.dir`이 구성되어 있어야 합니다.

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 구성

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

경로는 워크스페이스를 기준으로 확인됩니다. 인식되는 부트스트랩 기본 이름만 로드됩니다(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger 세부 정보

모든 슬래시 명령을 `~/.openclaw/logs/commands.log`에 기록합니다.

<a id="boot-md"></a>

### boot-md 세부 정보

Gateway가 시작될 때 활성 워크스페이스의 `BOOT.md`를 실행합니다.

## Plugin 훅

Plugin은 더 깊은 통합을 위해 Plugin SDK를 통해 형식화된 훅을 등록할 수 있습니다:
도구 호출 가로채기, 프롬프트 수정, 메시지 흐름 제어 등이 가능합니다.
`before_tool_call`, `before_agent_reply`, `before_install` 또는 기타 프로세스 내 수명 주기 훅이 필요할 때 Plugin 훅을 사용하세요.

전체 Plugin 훅 참조는 [Plugin 훅](/ko/plugins/hooks)을 참조하세요.

## 구성

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

훅별 환경 변수:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

추가 훅 디렉터리:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
레거시 `hooks.internal.handlers` 배열 구성 형식은 하위 호환성을 위해 여전히 지원되지만, 새 훅은 검색 기반 시스템을 사용해야 합니다.
</Note>

## CLI 참조

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 모범 사례

- **핸들러를 빠르게 유지하세요.** 훅은 명령 처리 중에 실행됩니다. `void processInBackground(event)`로 무거운 작업을 실행 후 대기하지 않게 처리하세요.
- **오류를 우아하게 처리하세요.** 위험한 작업은 try/catch로 감싸세요. 다른 핸들러가 실행될 수 있도록 throw하지 마세요.
- **이벤트를 일찍 필터링하세요.** 이벤트 유형/작업이 관련 없으면 즉시 반환하세요.
- **구체적인 이벤트 키를 사용하세요.** 오버헤드를 줄이려면 `"events": ["command"]`보다 `"events": ["command:new"]`를 선호하세요.

## 문제 해결

### 훅이 발견되지 않음

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 훅이 적합하지 않음

```bash
openclaw hooks info my-hook
```

누락된 바이너리(PATH), 환경 변수, 구성 값 또는 OS 호환성을 확인하세요.

### 훅이 실행되지 않음

1. 훅이 활성화되어 있는지 확인합니다: `openclaw hooks list`
2. 훅이 다시 로드되도록 Gateway 프로세스를 다시 시작합니다.
3. Gateway 로그를 확인합니다: `./scripts/clawlog.sh | grep hook`

## 관련 항목

- [CLI 참조: 훅](/ko/cli/hooks)
- [Webhook](/ko/automation/cron-jobs#webhooks)
- [Plugin 훅](/ko/plugins/hooks) — 프로세스 내 Plugin 수명 주기 훅
- [구성](/ko/gateway/configuration-reference#hooks)
