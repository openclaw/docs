---
read_when:
    - /new, /reset, /stop 및 에이전트 수명 주기 이벤트를 위한 이벤트 기반 자동화를 원합니다
    - 훅을 빌드, 설치 또는 디버그하려는 경우
summary: '후크: 명령 및 수명 주기 이벤트를 위한 이벤트 기반 자동화'
title: 훅
x-i18n:
    generated_at: "2026-07-12T00:32:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hook은 에이전트 이벤트가 발생할 때 Gateway 내부에서 실행되는 작은 스크립트입니다. 이벤트에는 `/new`, `/reset`, `/stop` 같은 명령, 세션 Compaction, Gateway 수명 주기, 메시지 흐름이 포함됩니다. Hook은 디렉터리에서 검색되며 `openclaw hooks`로 관리됩니다. Gateway는 Hook을 활성화하거나 하나 이상의 Hook 항목, Hook 팩, 레거시 핸들러 또는 추가 Hook 디렉터리를 구성한 후에만 내부 Hook을 로드합니다.

OpenClaw에는 두 종류의 Hook이 있습니다.

- **내부 Hook**(이 페이지): 에이전트 이벤트가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhook**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있게 하는 외부 HTTP 엔드포인트입니다. [Webhook](/ko/automation/cron-jobs#webhooks)을 참조하세요.

Hook은 Plugin 내부에 번들로 포함할 수도 있습니다. `openclaw hooks list`는 독립형 Hook과 Plugin에서 관리하는 Hook을 모두 표시합니다. Plugin 관리 Hook은 `plugin:<id>`로 표시됩니다.

## 적절한 확장 지점 선택

OpenClaw에는 비슷해 보이지만 서로 다른 문제를 해결하는 여러 확장 지점이 있습니다.

| 원하는 작업                                                                                                                  | 사용할 항목                               | 이유                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/new`에서 스냅샷 저장, `/reset` 기록, `message:sent` 후 외부 API 호출 또는 개괄적인 운영자 자동화 추가                      | 내부 Hook(`HOOK.md`, 이 페이지)           | 파일 기반 Hook은 운영자가 관리하는 부수 효과와 명령/수명 주기 자동화를 위한 것입니다     |
| 프롬프트 재작성, 도구 차단, 발신 메시지 취소 또는 순서가 지정된 미들웨어/정책 추가                                           | `api.on(...)`을 통한 형식화된 Plugin Hook | 형식화된 Hook에는 명시적인 계약, 우선순위, 병합 규칙 및 차단/취소 의미 체계가 있습니다   |
| 원격 측정 전용 내보내기 또는 관측 가능성 추가                                                                                | 진단 이벤트                               | 관측 가능성은 별도의 이벤트 버스이며 정책 Hook 확장 지점이 아닙니다                      |

작은 설치형 통합처럼 작동하는 자동화가 필요하면 내부 Hook을 사용하세요. 런타임 수명 주기를 제어해야 하면 형식화된 Plugin Hook을 사용하세요.

## 빠른 시작

```bash
# 사용 가능한 Hook 목록 표시
openclaw hooks list

# Hook 활성화
openclaw hooks enable session-memory

# Hook 상태 확인
openclaw hooks check

# 상세 정보 확인
openclaw hooks info session-memory
```

## 이벤트 유형

Hook은 이 표의 특정 키를 구독하거나, 해당 계열의 모든 동작을 수신하기 위해
계열 이름만 지정한 키(`command`, `session`, `agent`, `gateway`, `message`)를
구독합니다. OpenClaw 코어는 이외의 이벤트를 내보내지 않으므로 다른 이름은 거의
항상 오타이며, 이 경우 Hook은 아무 알림 없이 작동하지 않습니다. 단, Plugin이
사용자 지정 이벤트를 내보내는 경우에는 실행될 수 있습니다. Hook 로더는 그러한
이름(예: `command:nwe`)에 대해 경고를 기록하며, `openclaw hooks info <name>`도
이를 표시하므로 실행되지 않는 Hook의 원인을 진단할 수 있습니다.

| 이벤트                   | 발생 시점                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` 명령이 실행될 때                                    |
| `command:reset`          | `/reset` 명령이 실행될 때                                  |
| `command:stop`           | `/stop` 명령이 실행될 때                                   |
| `command`                | 모든 명령 이벤트(일반 리스너)                             |
| `session:compact:before` | Compaction이 기록을 요약하기 전                            |
| `session:compact:after`  | Compaction이 완료된 후                                     |
| `session:patch`          | 세션 속성이 수정될 때                                      |
| `agent:bootstrap`        | 작업 공간 부트스트랩 파일이 삽입되기 전                    |
| `gateway:startup`        | 채널이 시작되고 Hook이 로드된 후                           |
| `gateway:shutdown`       | Gateway 종료가 시작될 때                                   |
| `gateway:pre-restart`    | 예정된 Gateway 재시작 전                                   |
| `message:received`       | 모든 채널에서 수신된 메시지                                |
| `message:transcribed`    | 오디오 전사가 완료된 후                                    |
| `message:preprocessed`   | 미디어 및 링크 전처리가 완료되거나 건너뛴 후               |
| `message:sent`           | 발신 전송을 시도했을 때(`context.success`에 결과가 있음)   |

## Hook 작성

### Hook 구조

각 Hook은 두 파일이 포함된 디렉터리입니다.

```text
my-hook/
├── HOOK.md          # 메타데이터 + 문서
└── handler.ts       # 핸들러 구현
```

핸들러 파일은 `handler.ts`, `handler.js`, `index.ts` 또는 `index.js`일 수 있습니다.

### HOOK.md 형식

```markdown
---
name: my-hook
description: "이 Hook의 기능에 대한 간단한 설명"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# 내 Hook

여기에 상세 문서를 작성합니다.
```

**메타데이터 필드**(`metadata.openclaw`):

| 필드       | 설명                                                         |
| ---------- | ------------------------------------------------------------ |
| `emoji`    | CLI에 표시할 이모지                                           |
| `events`   | 수신할 이벤트 배열                                            |
| `export`   | 사용할 명명된 내보내기(기본값은 `"default"`)                 |
| `os`       | 필수 플랫폼(예: `["darwin", "linux"]`)                       |
| `requires` | 필수 `bins`, `anyBins`, `env` 또는 `config` 경로              |
| `always`   | 적격성 검사 우회(부울 값)                                     |
| `hookKey`  | 구성 키 재정의(기본값은 Hook 이름)                            |
| `homepage` | `openclaw hooks info`에 표시되는 문서 URL                     |
| `install`  | 설치 방법                                                     |

### 핸들러 구현

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

각 이벤트에는 `type`, `action`, `sessionKey`, `timestamp`, `messages` 및 `context`(이벤트별 데이터)가 포함됩니다. 에이전트 및 도구 Hook의 형식화된 Plugin Hook 컨텍스트에는 읽기 전용 W3C 호환 진단 추적 컨텍스트인 `trace`도 포함될 수 있으며, Plugin은 OTEL 상관관계를 위해 이를 구조화된 로그에 전달할 수 있습니다.

`event.messages`에 추가된 문자열은 `command:new` 및 `command:reset`에서만
채팅으로 다시 전달되며, 원래 대화에 대한 답장으로 라우팅됩니다.
`session:compact:before`와 `session:compact:after`에서는 Compaction 상태 알림으로
전송됩니다. `command:stop`, `message:*`, `agent:bootstrap`, `session:patch`,
`gateway:*`를 포함한 그 밖의 모든 이벤트에서는 추가된 메시지를 무시합니다.

### 주요 이벤트 컨텍스트

**명령 이벤트**(`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**명령 이벤트**(`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**메시지 이벤트**(`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata`(`senderId`, `senderName`, `guildId`를 포함한 제공자별 데이터). `context.content`는 명령 형태의 메시지에 공백이 아닌 명령 본문이 있으면 이를 우선 사용하고, 없으면 원시 수신 본문과 일반 본문을 차례로 사용합니다. 스레드 기록이나 링크 요약처럼 에이전트 전용으로 보강된 내용은 포함하지 않습니다.

**메시지 이벤트**(`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, 그리고 전송에 실패한 경우 `context.error`.

**메시지 이벤트**(`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**메시지 이벤트**(`message:preprocessed`): `context.bodyForAgent`(최종 보강 본문), `context.from`, `context.channelId`.

**부트스트랩 이벤트**(`agent:bootstrap`): `context.bootstrapFiles`(변경 가능한 배열), `context.agentId`.

**세션 패치 이벤트**(`session:patch`): `context.sessionEntry`, `context.patch`(변경된 필드만), `context.cfg`. 권한 있는 클라이언트만 패치 이벤트를 트리거할 수 있습니다. 컨텍스트는 복제본이므로 핸들러는 실제 세션 항목을 변경할 수 없습니다.

**Compaction 이벤트**: `session:compact:before`에는 `messageCount`, `tokenCount`가 포함됩니다. `session:compact:after`에는 `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`가 추가됩니다.

`command:stop`은 사용자가 `/stop`을 실행하는 것을 관찰합니다. 이는 취소/명령
수명 주기에 해당하며 에이전트 완료 확정 단계가 아닙니다. 자연스러운 최종 답변을
검사하고 에이전트에 한 번 더 처리를 요청해야 하는 Plugin은 대신 형식화된 Plugin
Hook `before_agent_finalize`를 사용해야 합니다. [Plugin Hook](/ko/plugins/hooks)을 참조하세요.

**Gateway 수명 주기 이벤트**: `gateway:shutdown`에는 `reason`과 `restartExpectedMs`가 포함되며 Gateway 종료가 시작될 때 발생합니다. `gateway:pre-restart`에는 동일한 컨텍스트가 포함되지만, 종료가 예정된 재시작의 일부이고 유한한 `restartExpectedMs` 값이 제공된 경우에만 발생합니다. 종료 중에는 각 수명 주기 Hook 대기가 최선 노력 방식으로 제한되므로 핸들러가 중단되더라도 종료는 계속됩니다. 기본 대기 시간 한도는 `gateway:shutdown`의 경우 5초, `gateway:pre-restart`의 경우 10초입니다.

채널을 계속 사용할 수 있는 동안 짧은 재시작 알림을 보내려면 `gateway:pre-restart`를 사용하세요.

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

`gateway:shutdown`(또는 `gateway:pre-restart`) 이벤트와 나머지 종료 절차 사이에 Gateway는 프로세스가 중지될 때 여전히 활성 상태였던 각 세션에 대해 형식화된 `session_end` Plugin Hook도 실행합니다. 일반적인 SIGTERM/SIGINT 중지의 경우 이벤트의 `reason`은 `shutdown`이고, 예정된 재시작의 일부로 종료가 예약된 경우에는 `restart`입니다. 이 정리 작업에는 시간 제한이 있으므로 느린 `session_end` 핸들러가 프로세스 종료를 막을 수 없습니다. 교체, 재설정, 삭제 또는 Compaction을 통해 이미 완료된 세션은 중복 실행을 방지하기 위해 건너뜁니다.

## Hook 검색

Hook은 네 가지 소스에서 검색됩니다.

1. **번들 Hook**: OpenClaw와 함께 제공됩니다.
2. **Plugin Hook**: 설치된 Plugin 내부에 번들로 포함되며, 이름이 같은 번들 Hook을 재정의할 수 있습니다.
3. **관리형 Hook**: `~/.openclaw/hooks/`(사용자가 설치하며 작업 공간 간 공유). 번들 및 Plugin Hook을 재정의할 수 있습니다. `hooks.internal.load.extraDirs`의 추가 디렉터리에도 동일한 우선순위가 적용됩니다.
4. **작업 공간 Hook**: `<workspace>/hooks/`(에이전트별이며 명시적으로 활성화하기 전까지 기본적으로 비활성화됨)

작업 공간 Hook은 새 Hook 이름을 추가할 수 있지만, 이름이 같은 번들, 관리형 또는 Plugin 제공 Hook을 재정의할 수 없습니다.

Gateway는 내부 Hook이 구성될 때까지 시작 시 내부 Hook 검색을 건너뜁니다. 번들 또는 관리형 Hook을 활성화하려면 `openclaw hooks enable <name>`을 사용하거나 Hook 팩을 설치하거나 `hooks.internal.enabled=true`를 설정하여 옵트인하세요. 이름을 지정한 Hook 하나를 활성화하면 Gateway는 해당 Hook의 핸들러만 로드합니다. `hooks.internal.enabled=true`, 추가 Hook 디렉터리 및 레거시 핸들러는 광범위한 검색을 활성화합니다.

### Hook 팩

Hook 팩은 `package.json`의 `openclaw.hooks`를 통해 Hook을 내보내는 npm 패키지입니다. 다음 명령으로 설치하세요:

```bash
openclaw plugins install <path-or-spec>
```

Npm 사양은 레지스트리 전용입니다(패키지 이름 + 선택적 정확한 버전 또는 dist-tag). Git/URL/파일 사양과 semver 범위는 거부됩니다. 이전 `openclaw hooks install` 및 `openclaw hooks update` 명령은 `openclaw plugins install` / `openclaw plugins update`의 더 이상 권장되지 않는 별칭입니다.

## 번들 훅

| 훅                    | 이벤트                                            | 기능                                                               |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | 세션 컨텍스트를 `<workspace>/memory/`에 저장합니다                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob 패턴에서 추가 부트스트랩 파일을 삽입합니다                    |
| command-logger        | `command`                                         | 모든 명령을 `~/.openclaw/logs/commands.log`에 기록합니다           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 세션 Compaction 시작/종료 시 표시되는 채팅 알림을 전송합니다       |
| boot-md               | `gateway:startup`                                 | Gateway가 시작될 때 `BOOT.md`를 실행합니다                         |

번들 훅을 활성화하려면 다음을 실행합니다.

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 세부 정보

마지막 사용자/어시스턴트 메시지(기본값 15개, `hooks.internal.entries.session-memory.messages`로 구성 가능)를 추출하고 호스트의 로컬 날짜를 사용하여 `<workspace>/memory/YYYY-MM-DD-HHMM.md`에 저장합니다. 메모리 캡처는 백그라운드에서 실행되므로 대화 기록 읽기 또는 선택적 슬러그 생성 때문에 `/new` 및 `/reset` 확인 응답이 지연되지 않습니다. 설명적인 파일 이름 슬러그를 생성하려면 `hooks.internal.entries.session-memory.llmSlug: true`를 설정하고, 필요하면 `hooks.internal.entries.session-memory.model`을 `sonnet` 같은 구성된 별칭, 에이전트 기본 공급자의 단독 모델 ID 또는 `provider/model` 참조로 설정합니다. `model`을 생략하면 슬러그 생성에 에이전트의 기본 모델을 사용하며, 사용할 수 없으면 타임스탬프 슬러그로 대체합니다. `workspace.dir`이 구성되어 있어야 합니다.

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

`patterns`와 `files`는 `paths`의 별칭으로 허용됩니다. 경로는 워크스페이스를 기준으로 해석되며 그 내부에 있어야 합니다. 인식되는 부트스트랩 기본 파일 이름만 로드됩니다(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger 세부 정보

모든 슬래시 명령을 JSON 라인(타임스탬프, 작업, 세션 키, 발신자 ID, 소스)으로 `~/.openclaw/logs/commands.log`에 기록합니다.

<a id="compaction-notifier"></a>

### compaction-notifier 세부 정보

OpenClaw가 세션 대화 기록의 Compaction을 시작하고 완료할 때 현재 대화에 짧은 상태 메시지를 전송합니다. 사용자가 어시스턴트가 컨텍스트를 요약하고 있으며 Compaction 후 계속 진행할 것임을 확인할 수 있으므로, 채팅 화면에서 긴 턴이 덜 혼란스러워집니다.

<a id="boot-md"></a>

### boot-md 세부 정보

각각의 구성된 에이전트 범위에서 해당 에이전트의 해석된 워크스페이스에 파일이 존재하면 Gateway 시작 시 `BOOT.md`를 실행합니다.

## Plugin 훅

Plugin은 더 심층적인 통합을 위해 Plugin SDK를 통해 형식화된 훅을 등록할 수 있습니다.
도구 호출 가로채기, 프롬프트 수정, 메시지 흐름 제어 등을 수행할 수 있습니다.
`before_tool_call`, `before_agent_reply`, `before_install` 또는 기타 프로세스 내 수명 주기 훅이 필요할 때 Plugin 훅을 사용하세요.

Plugin이 관리하는 내부 훅은 다릅니다. 이 훅은 이 페이지의 거친 명령/수명 주기 이벤트 시스템에 참여하며 `openclaw hooks list`에 `plugin:<id>`로 표시됩니다. 순서가 지정된 미들웨어나 정책 게이트가 아니라 훅 팩과의 호환성 및 부수 효과를 위해 사용하세요.

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

훅별 환경 값은 프로세스 환경과 함께 훅의 `requires.env` 적격성 검사를 충족하며, 핸들러는 훅 구성 항목에서 이를 읽을 수 있습니다.

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
레거시 `hooks.internal.handlers` 배열 구성 형식은 이전 버전과의 호환성을 위해 계속 지원되지만, 새 훅은 검색 기반 시스템을 사용해야 합니다.
</Note>

## CLI 참조

```bash
# 모든 훅 나열(--eligible, --verbose 또는 --json 추가)
openclaw hooks list

# 훅에 대한 자세한 정보 표시
openclaw hooks info <hook-name>

# 적격성 요약 표시
openclaw hooks check

# 활성화/비활성화
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 모범 사례

- **핸들러를 빠르게 유지하세요.** 훅은 명령 처리 중에 실행됩니다. `void processInBackground(event)`를 사용하여 무거운 작업을 실행 후 대기하지 않는 방식으로 처리하세요.
- **오류를 적절하게 처리하세요.** 위험한 작업을 try/catch로 감싸고 다른 핸들러가 실행될 수 있도록 예외를 던지지 마세요.
- **이벤트를 조기에 필터링하세요.** 이벤트 유형/작업이 관련 없으면 즉시 반환하세요.
- **구체적인 이벤트 키를 사용하세요.** 오버헤드를 줄이려면 `"events": ["command"]`보다 `"events": ["command:new"]`을 사용하세요.

## 문제 해결

### 훅이 검색되지 않음

```bash
# 디렉터리 구조 확인
ls -la ~/.openclaw/hooks/my-hook/
# 다음 항목이 표시되어야 함: HOOK.md, handler.ts

# 검색된 모든 훅 나열
openclaw hooks list
```

### 훅이 적격하지 않음

```bash
openclaw hooks info my-hook
```

누락된 바이너리(PATH), 환경 변수, 구성 값 또는 OS 호환성을 확인하세요.

### 훅이 실행되지 않음

1. 훅이 활성화되어 있는지 확인하세요: `openclaw hooks list`
2. 훅이 다시 로드되도록 Gateway 프로세스를 다시 시작하세요.
3. Gateway 로그를 확인하세요: `openclaw logs --follow | grep -i hook`

## 관련 항목

- [CLI 참조: 훅](/ko/cli/hooks)
- [Webhook](/ko/automation/cron-jobs#webhooks)
- [Plugin 훅](/ko/plugins/hooks) — 프로세스 내 Plugin 수명 주기 훅
- [구성](/ko/gateway/configuration-reference#hooks)
