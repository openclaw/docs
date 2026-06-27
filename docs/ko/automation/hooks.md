---
read_when:
    - /new, /reset, /stop 및 에이전트 수명 주기 이벤트에 대한 이벤트 기반 자동화가 필요합니다
    - OpenClaw를 빌드, 설치 또는 디버그하려는 경우
summary: '훅: 명령 및 수명 주기 이벤트를 위한 이벤트 기반 자동화'
title: 훅
x-i18n:
    generated_at: "2026-06-27T17:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks는 Gateway 내부에서 어떤 일이 발생할 때 실행되는 작은 스크립트입니다. 디렉터리에서 발견할 수 있으며 `openclaw hooks`로 검사할 수 있습니다. Gateway는 hooks를 활성화하거나 하나 이상의 hook 항목, hook pack, 레거시 handler, 또는 추가 hook 디렉터리를 구성한 뒤에만 내부 hooks를 로드합니다.

OpenClaw에는 두 종류의 hooks가 있습니다.

- **내부 hooks**(이 페이지): `/new`, `/reset`, `/stop` 또는 수명 주기 이벤트처럼 에이전트 이벤트가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhooks**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있게 하는 외부 HTTP 엔드포인트입니다. [Webhooks](/ko/automation/cron-jobs#webhooks)를 참조하세요.

Hooks는 plugins 안에 번들로 포함될 수도 있습니다. `openclaw hooks list`는 독립 실행형 hooks와 plugin 관리 hooks를 모두 표시합니다.

## 올바른 표면 선택

OpenClaw에는 비슷해 보이지만 서로 다른 문제를 해결하는 여러 확장 표면이 있습니다.

| 원하는 작업...                                                                                                     | 사용 항목...                                | 이유                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/new`에서 스냅샷 저장, `/reset` 로깅, `message:sent` 이후 외부 API 호출, 또는 대략적인 운영자 자동화 추가 | 내부 hooks(`HOOK.md`, 이 페이지) | 파일 기반 hooks는 운영자가 관리하는 부수 효과와 명령/수명 주기 자동화를 위한 것입니다 |
| 프롬프트 재작성, 도구 차단, 발신 메시지 취소, 또는 순서가 있는 미들웨어/정책 추가                              | `api.on(...)`을 통한 typed plugin hooks  | typed hooks에는 명시적 계약, 우선순위, 병합 규칙, 차단/취소 의미가 있습니다      |
| 텔레메트리 전용 내보내기 또는 관측 가능성 추가                                                                            | 진단 이벤트                     | 관측 가능성은 정책 hook 표면이 아니라 별도의 이벤트 버스입니다                              |

작게 설치된 통합처럼 동작하는 자동화를 원할 때 내부 hooks를 사용하세요. 런타임 수명 주기 제어가 필요할 때는 typed plugin hooks를 사용하세요.

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

| 이벤트                    | 발생 시점                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` 명령이 실행됨                                      |
| `command:reset`          | `/reset` 명령이 실행됨                                    |
| `command:stop`           | `/stop` 명령이 실행됨                                     |
| `command`                | 모든 명령 이벤트(일반 리스너)                       |
| `session:compact:before` | Compaction이 기록을 요약하기 전                       |
| `session:compact:after`  | Compaction이 완료된 후                                 |
| `session:patch`          | 세션 속성이 수정될 때                       |
| `agent:bootstrap`        | 워크스페이스 부트스트랩 파일이 주입되기 전              |
| `gateway:startup`        | 채널이 시작되고 hooks가 로드된 후                  |
| `gateway:shutdown`       | Gateway 종료가 시작될 때                               |
| `gateway:pre-restart`    | 예상된 Gateway 재시작 전                         |
| `message:received`       | 모든 채널에서 들어오는 수신 메시지                           |
| `message:transcribed`    | 오디오 전사가 완료된 후                        |
| `message:preprocessed`   | 미디어와 링크 전처리가 완료되거나 건너뛴 후 |
| `message:sent`           | 발신 메시지가 전달됨                                 |

## hooks 작성

### Hook 구조

각 hook은 두 파일을 포함하는 디렉터리입니다.

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

| 필드      | 설명                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI에 표시할 이모지                                |
| `events`   | 수신할 이벤트 배열                        |
| `export`   | 사용할 명명된 export(기본값은 `"default"`)        |
| `os`       | 필요한 플랫폼(예: `["darwin", "linux"]`)     |
| `requires` | 필요한 `bins`, `anyBins`, `env`, 또는 `config` 경로 |
| `always`   | 적격성 검사를 우회(부울)                  |
| `install`  | 설치 방법                                 |

### Handler 구현

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

각 이벤트에는 `type`, `action`, `sessionKey`, `timestamp`, `messages`(응답 가능한 표면에서만 여기에 응답 push), `context`(이벤트별 데이터)가 포함됩니다. 에이전트와 도구 plugin hook 컨텍스트에는 plugins가 OTEL 상관관계를 위해 구조화된 로그에 전달할 수 있는 읽기 전용 W3C 호환 진단 trace 컨텍스트인 `trace`도 포함될 수 있습니다.

`event.messages`는 `command:*` 및 `message:received` 같은 응답 가능한 표면에서만 자동으로 전달됩니다. `agent:bootstrap`, `session:*`, `gateway:*`, 또는 `message:sent` 같은 수명 주기 전용 이벤트에는 응답 채널이 없으며 push된 메시지를 무시합니다.

### 이벤트 컨텍스트 주요 사항

**명령 이벤트**(`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**메시지 이벤트**(`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata`(`senderId`, `senderName`, `guildId`를 포함하는 제공자별 데이터). `context.content`는 명령과 유사한 메시지에 대해 비어 있지 않은 명령 본문을 우선 사용한 뒤 원시 수신 본문과 일반 본문으로 대체됩니다. 스레드 기록이나 링크 요약 같은 에이전트 전용 보강 내용은 포함하지 않습니다.

**메시지 이벤트**(`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**메시지 이벤트**(`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**메시지 이벤트**(`message:preprocessed`): `context.bodyForAgent`(최종 보강 본문), `context.from`, `context.channelId`.

**부트스트랩 이벤트**(`agent:bootstrap`): `context.bootstrapFiles`(변경 가능한 배열), `context.agentId`.

**세션 patch 이벤트**(`session:patch`): `context.sessionEntry`, `context.patch`(변경된 필드만), `context.cfg`. 권한 있는 클라이언트만 patch 이벤트를 트리거할 수 있습니다.

**Compaction 이벤트**: `session:compact:before`에는 `messageCount`, `tokenCount`가 포함됩니다. `session:compact:after`는 `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`를 추가합니다.

`command:stop`은 사용자가 `/stop`을 실행하는 것을 관찰합니다. 이는 취소/명령 수명 주기이며 에이전트 최종화 gate가 아닙니다. 자연스러운 최종 답변을 검사하고 에이전트에게 한 번 더 처리하도록 요청해야 하는 plugins는 대신 typed plugin hook `before_agent_finalize`를 사용해야 합니다. [Plugin hooks](/ko/plugins/hooks)를 참조하세요.

**Gateway 수명 주기 이벤트**: `gateway:shutdown`에는 `reason`과 `restartExpectedMs`가 포함되며 Gateway 종료가 시작될 때 발생합니다. `gateway:pre-restart`는 같은 컨텍스트를 포함하지만 종료가 예상된 재시작의 일부이고 유한한 `restartExpectedMs` 값이 제공된 경우에만 발생합니다. 종료 중에는 handler가 멈추더라도 종료가 계속되도록 각 수명 주기 hook 대기가 최선 노력 방식이며 제한됩니다. 기본 대기 예산은 `gateway:shutdown`의 경우 5초, `gateway:pre-restart`의 경우 10초입니다.

채널이 아직 사용 가능한 동안 짧은 재시작 알림에는 `gateway:pre-restart`를 사용하세요.

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

`gateway:shutdown`(또는 `gateway:pre-restart`) 이벤트와 나머지 종료 시퀀스 사이에 Gateway는 프로세스가 중지될 때 아직 활성 상태였던 모든 세션에 대해 typed `session_end` plugin hook도 발생시킵니다. 이벤트의 `reason`은 일반 SIGTERM/SIGINT 중지의 경우 `shutdown`이고, 닫기가 예상된 재시작의 일부로 예약된 경우 `restart`입니다. 이 drain은 느린 `session_end` handler가 프로세스 종료를 막을 수 없도록 제한되며, replace / reset / delete / compaction을 통해 이미 최종화된 세션은 중복 발생을 방지하기 위해 건너뜁니다.

## Hook 발견

Hooks는 다음 디렉터리에서 override 우선순위가 증가하는 순서로 발견됩니다.

1. **번들 hooks**: OpenClaw와 함께 제공됨
2. **Plugin hooks**: 설치된 plugins 안에 번들로 포함된 hooks
3. **관리형 hooks**: `~/.openclaw/hooks/`(사용자가 설치하며 워크스페이스 간 공유). `hooks.internal.load.extraDirs`의 추가 디렉터리도 이 우선순위를 공유합니다.
4. **워크스페이스 hooks**: `<workspace>/hooks/`(에이전트별, 명시적으로 활성화되기 전까지 기본적으로 비활성화)

워크스페이스 hooks는 새 hook 이름을 추가할 수 있지만, 같은 이름의 번들, 관리형 또는 plugin 제공 hooks를 override할 수는 없습니다.

Gateway는 내부 hooks가 구성될 때까지 시작 시 내부 hook 발견을 건너뜁니다. `openclaw hooks enable <name>`으로 번들 또는 관리형 hook을 활성화하거나, hook pack을 설치하거나, `hooks.internal.enabled=true`를 설정해 opt in하세요. 이름이 지정된 hook 하나를 활성화하면 Gateway는 해당 hook의 handler만 로드합니다. `hooks.internal.enabled=true`, 추가 hook 디렉터리, 레거시 handlers는 넓은 발견에 opt in합니다.

### Hook packs

Hook packs는 `package.json`의 `openclaw.hooks`를 통해 hooks를 export하는 npm packages입니다. 다음으로 설치하세요.

```bash
openclaw plugins install <path-or-spec>
```

Npm specs는 registry 전용입니다(package name + optional exact version or dist-tag). Git/URL/file specs와 semver ranges는 거부됩니다.

## 번들 hooks

| 후크                  | 이벤트                                            | 수행 작업                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 세션 컨텍스트를 `<workspace>/memory/`에 저장                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 글롭 패턴에서 추가 부트스트랩 파일을 주입          |
| command-logger        | `command`                                         | 모든 명령을 `~/.openclaw/logs/commands.log`에 기록           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 세션 Compaction이 시작/종료될 때 보이는 채팅 알림을 보냄 |
| boot-md               | `gateway:startup`                                 | Gateway가 시작될 때 `BOOT.md`를 실행                         |

번들 후크를 활성화합니다.

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 세부 정보

마지막 15개의 사용자/어시스턴트 메시지를 추출하고 호스트 로컬 날짜를 사용해 `<workspace>/memory/YYYY-MM-DD-HHMM.md`에 저장합니다. 메모리 캡처는 백그라운드에서 실행되므로 `/new` 및 `/reset` 확인 응답이 트랜스크립트 읽기나 선택적 슬러그 생성으로 지연되지 않습니다. 구성된 모델로 설명적인 파일 이름 슬러그를 생성하려면 `hooks.internal.entries.session-memory.llmSlug: true`를 설정하세요. `workspace.dir`이 구성되어 있어야 합니다.

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

경로는 워크스페이스를 기준으로 해석됩니다. 인식되는 부트스트랩 기본 파일명만 로드됩니다(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger 세부 정보

모든 슬래시 명령을 `~/.openclaw/logs/commands.log`에 기록합니다.

<a id="compaction-notifier"></a>

### compaction-notifier 세부 정보

OpenClaw가 세션 트랜스크립트 압축을 시작하고 완료할 때 현재 대화에 짧은 상태 메시지를 보냅니다. 사용자가 어시스턴트가 컨텍스트를 요약 중이며 Compaction 후 계속 진행한다는 것을 볼 수 있으므로, 채팅 화면에서 긴 턴이 덜 혼란스럽습니다.

<a id="boot-md"></a>

### boot-md 세부 정보

Gateway가 시작될 때 활성 워크스페이스의 `BOOT.md`를 실행합니다.

## Plugin 후크

Plugin은 더 깊은 통합을 위해 Plugin SDK를 통해 형식화된 후크를 등록할 수 있습니다.
도구 호출 가로채기, 프롬프트 수정, 메시지 흐름 제어 등을 수행할 수 있습니다.
`before_tool_call`, `before_agent_reply`,
`before_install` 또는 기타 프로세스 내부 수명 주기 후크가 필요할 때 Plugin 후크를 사용하세요.

Plugin이 관리하는 내부 후크는 다릅니다. 이 후크들은 이 페이지의
대략적인 명령/수명 주기 이벤트 시스템에 참여하며 `openclaw hooks list`에
`plugin:<id>`로 표시됩니다. 정렬된 미들웨어나 정책 게이트가 아니라, 부수 효과와 후크 팩과의 호환성에 사용하세요.

전체 Plugin 후크 참조는 [Plugin 후크](/ko/plugins/hooks)를 참조하세요.

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

후크별 환경 변수:

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

추가 후크 디렉터리:

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
레거시 `hooks.internal.handlers` 배열 구성 형식은 이전 버전과의 호환성을 위해 계속 지원되지만, 새 후크는 탐색 기반 시스템을 사용해야 합니다.
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

- **핸들러를 빠르게 유지하세요.** 후크는 명령 처리 중에 실행됩니다. 무거운 작업은 `void processInBackground(event)`로 실행 후 잊는 방식으로 처리하세요.
- **오류를 우아하게 처리하세요.** 위험한 작업은 try/catch로 감싸고, 다른 핸들러가 실행될 수 있도록 throw하지 마세요.
- **이벤트를 일찍 필터링하세요.** 이벤트 유형/작업이 관련이 없으면 즉시 반환하세요.
- **구체적인 이벤트 키를 사용하세요.** 오버헤드를 줄이려면 `"events": ["command"]`보다 `"events": ["command:new"]`를 선호하세요.

## 문제 해결

### 후크가 발견되지 않음

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 후크가 적격하지 않음

```bash
openclaw hooks info my-hook
```

누락된 바이너리(PATH), 환경 변수, 구성 값 또는 OS 호환성을 확인하세요.

### 후크가 실행되지 않음

1. 후크가 활성화되어 있는지 확인하세요: `openclaw hooks list`
2. 후크가 다시 로드되도록 Gateway 프로세스를 다시 시작하세요.
3. Gateway 로그를 확인하세요: `./scripts/clawlog.sh | grep hook`

## 관련 항목

- [CLI 참조: hooks](/ko/cli/hooks)
- [Webhook](/ko/automation/cron-jobs#webhooks)
- [Plugin 후크](/ko/plugins/hooks) — 프로세스 내부 Plugin 수명 주기 후크
- [구성](/ko/gateway/configuration-reference#hooks)
