---
read_when:
    - /new, /reset, /stop 및 에이전트 수명 주기 이벤트를 위한 이벤트 기반 자동화를 원합니다
    - hooks를 빌드, 설치 또는 디버그하려고 합니다
summary: 'Hooks: 명령어 및 수명 주기 이벤트를 위한 이벤트 기반 자동화'
title: Hooks
x-i18n:
    generated_at: "2026-04-11T02:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14296398e4042d442ebdf071a07c6be99d4afda7cbf3c2b934e76dc5539742c7
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks는 Gateway 내부에서 어떤 일이 발생할 때 실행되는 작은 스크립트입니다. 디렉터리에서 자동으로 검색되며 `openclaw hooks`로 확인할 수 있습니다.

OpenClaw에는 두 가지 종류의 hooks가 있습니다.

- **내부 hooks**(이 페이지): `/new`, `/reset`, `/stop` 또는 수명 주기 이벤트처럼 에이전트 이벤트가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhooks**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있도록 해주는 외부 HTTP 엔드포인트입니다. [Webhooks](/ko/automation/cron-jobs#webhooks)를 참고하세요.

Hooks는 plugins 안에 번들로 포함될 수도 있습니다. `openclaw hooks list`는 독립형 hooks와 plugin이 관리하는 hooks를 모두 표시합니다.

## 빠른 시작

```bash
# 사용 가능한 hooks 나열
openclaw hooks list

# hook 활성화
openclaw hooks enable session-memory

# hook 상태 확인
openclaw hooks check

# 자세한 정보 가져오기
openclaw hooks info session-memory
```

## 이벤트 유형

| Event                    | 실행 시점 |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new` 명령이 실행될 때 |
| `command:reset`          | `/reset` 명령이 실행될 때 |
| `command:stop`           | `/stop` 명령이 실행될 때 |
| `command`                | 모든 명령 이벤트(일반 리스너) |
| `session:compact:before` | 압축이 기록을 요약하기 전 |
| `session:compact:after`  | 압축이 완료된 후 |
| `session:patch`          | 세션 속성이 수정될 때 |
| `agent:bootstrap`        | 워크스페이스 bootstrap 파일이 주입되기 전 |
| `gateway:startup`        | 채널이 시작되고 hooks가 로드된 후 |
| `message:received`       | 아무 채널에서나 수신 메시지가 들어올 때 |
| `message:transcribed`    | 오디오 전사가 완료된 후 |
| `message:preprocessed`   | 모든 미디어 및 링크 이해가 완료된 후 |
| `message:sent`           | 발신 메시지가 전달될 때 |

## hooks 작성하기

### Hook 구조

각 hook은 두 개의 파일이 들어 있는 디렉터리입니다.

```
my-hook/
├── HOOK.md          # 메타데이터 + 문서
└── handler.ts       # 핸들러 구현
```

### HOOK.md 형식

```markdown
---
name: my-hook
description: "이 hook이 수행하는 작업의 짧은 설명"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

자세한 문서는 여기에 작성합니다.
```

**메타데이터 필드** (`metadata.openclaw`):

| Field      | 설명 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI에 표시할 이모지 |
| `events`   | 수신할 이벤트 배열 |
| `export`   | 사용할 named export(기본값은 `"default"`) |
| `os`       | 필요한 플랫폼(예: `["darwin", "linux"]`) |
| `requires` | 필요한 `bins`, `anyBins`, `env` 또는 `config` 경로 |
| `always`   | 적격성 검사 우회(boolean) |
| `install`  | 설치 방법 |

### 핸들러 구현

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

각 이벤트에는 `type`, `action`, `sessionKey`, `timestamp`, `messages`(사용자에게 보내기 위해 push), 그리고 `context`(이벤트별 데이터)가 포함됩니다.

### 이벤트 context 주요 항목

**명령 이벤트** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**메시지 이벤트** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId`를 포함한 provider별 데이터).

**메시지 이벤트** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**메시지 이벤트** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**메시지 이벤트** (`message:preprocessed`): `context.bodyForAgent`(최종 강화된 본문), `context.from`, `context.channelId`.

**Bootstrap 이벤트** (`agent:bootstrap`): `context.bootstrapFiles`(변경 가능한 배열), `context.agentId`.

**세션 patch 이벤트** (`session:patch`): `context.sessionEntry`, `context.patch`(변경된 필드만), `context.cfg`. patch 이벤트는 권한이 있는 클라이언트만 트리거할 수 있습니다.

**압축 이벤트**: `session:compact:before`에는 `messageCount`, `tokenCount`가 포함됩니다. `session:compact:after`에는 `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`가 추가됩니다.

## Hook 검색

Hooks는 다음 디렉터리에서 검색되며, 아래 순서대로 재정의 우선순위가 높아집니다.

1. **번들 hooks**: OpenClaw와 함께 제공됨
2. **Plugin hooks**: 설치된 plugins 안에 번들된 hooks
3. **관리형 hooks**: `~/.openclaw/hooks/` (사용자가 설치하며 워크스페이스 간 공유). `hooks.internal.load.extraDirs`의 추가 디렉터리도 같은 우선순위를 가집니다.
4. **워크스페이스 hooks**: `<workspace>/hooks/` (에이전트별, 명시적으로 활성화하기 전까지 기본적으로 비활성화)

워크스페이스 hooks는 새 hook 이름을 추가할 수는 있지만, 같은 이름의 번들, 관리형 또는 plugin 제공 hooks를 재정의할 수는 없습니다.

### Hook packs

Hook packs는 `package.json`의 `openclaw.hooks`를 통해 hooks를 내보내는 npm 패키지입니다. 다음으로 설치합니다.

```bash
openclaw plugins install <path-or-spec>
```

Npm spec은 레지스트리 전용입니다(패키지 이름 + 선택적 정확한 버전 또는 dist-tag). Git/URL/file spec과 semver 범위는 거부됩니다.

## 번들 hooks

| Hook                  | Events                         | 수행 작업 |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | 세션 context를 `<workspace>/memory/`에 저장 |
| bootstrap-extra-files | `agent:bootstrap`              | glob 패턴에서 추가 bootstrap 파일 주입 |
| command-logger        | `command`                      | 모든 명령을 `~/.openclaw/logs/commands.log`에 기록 |
| boot-md               | `gateway:startup`              | gateway 시작 시 `BOOT.md` 실행 |

번들 hook 활성화:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 세부 정보

마지막 사용자/assistant 메시지 15개를 추출하고, LLM을 통해 설명적인 파일명 slug를 생성한 뒤, `<workspace>/memory/YYYY-MM-DD-slug.md`에 저장합니다. `workspace.dir`이 설정되어 있어야 합니다.

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 설정

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

경로는 워크스페이스 기준으로 해석됩니다. 인식되는 bootstrap basename만 로드됩니다(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger 세부 정보

모든 슬래시 명령을 `~/.openclaw/logs/commands.log`에 기록합니다.

<a id="boot-md"></a>

### boot-md 세부 정보

gateway가 시작될 때 활성 워크스페이스의 `BOOT.md`를 실행합니다.

## Plugin hooks

Plugins는 Plugin SDK를 통해 hooks를 등록하여 더 깊이 통합할 수 있습니다. 예를 들어 도구 호출 가로채기, 프롬프트 수정, 메시지 흐름 제어 등이 가능합니다. Plugin SDK는 모델 확인, 에이전트 수명 주기, 메시지 흐름, 도구 실행, 하위 에이전트 조정, gateway 수명 주기를 포함해 28개의 hooks를 제공합니다.

`before_tool_call`, `before_agent_reply`, `before_install` 및 기타 모든 plugin hooks를 포함한 전체 plugin hook 참조는 [Plugin Architecture](/ko/plugins/architecture#provider-runtime-hooks)를 참고하세요.

## 설정

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

hook별 환경 변수:

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

추가 hook 디렉터리:

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
레거시 `hooks.internal.handlers` 배열 설정 형식도 이전 버전과의 호환성을 위해 계속 지원되지만, 새 hooks는 검색 기반 시스템을 사용해야 합니다.
</Note>

## CLI 참조

```bash
# 모든 hooks 나열(--eligible, --verbose 또는 --json 추가 가능)
openclaw hooks list

# hook의 자세한 정보 표시
openclaw hooks info <hook-name>

# 적격성 요약 표시
openclaw hooks check

# 활성화/비활성화
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 모범 사례

- **핸들러를 빠르게 유지하세요.** Hooks는 명령 처리 중에 실행됩니다. 무거운 작업은 `void processInBackground(event)`로 fire-and-forget 방식으로 처리하세요.
- **오류를 우아하게 처리하세요.** 위험한 작업은 try/catch로 감싸고, 다른 핸들러가 실행될 수 있도록 예외를 던지지 마세요.
- **이벤트를 초기에 필터링하세요.** 이벤트 type/action이 관련 없으면 즉시 반환하세요.
- **구체적인 이벤트 키를 사용하세요.** 오버헤드를 줄이기 위해 `"events": ["command"]`보다 `"events": ["command:new"]`를 선호하세요.

## 문제 해결

### Hook이 검색되지 않음

```bash
# 디렉터리 구조 확인
ls -la ~/.openclaw/hooks/my-hook/
# 표시되어야 하는 항목: HOOK.md, handler.ts

# 검색된 모든 hooks 나열
openclaw hooks list
```

### Hook이 적격하지 않음

```bash
openclaw hooks info my-hook
```

누락된 바이너리(PATH), 환경 변수, 설정 값 또는 OS 호환성을 확인하세요.

### Hook이 실행되지 않음

1. hook이 활성화되어 있는지 확인합니다: `openclaw hooks list`
2. hooks가 다시 로드되도록 gateway 프로세스를 재시작합니다.
3. gateway 로그를 확인합니다: `./scripts/clawlog.sh | grep hook`

## 관련 문서

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/ko/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ko/plugins/architecture#provider-runtime-hooks) — 전체 plugin hook 참조
- [Configuration](/ko/gateway/configuration-reference#hooks)
