---
read_when:
    - ACP를 통해 코딩 harness 실행
    - 메시징 채널에서 대화에 바인딩된 ACP 세션 설정
    - 메시지 채널 대화를 영구 ACP 세션에 바인딩
    - ACP 백엔드 및 Plugin 배선 문제 해결
    - ACP 완료 전송 또는 에이전트 간 루프 디버깅
    - 채팅에서 `/acp` 명령 운영
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP 및 기타 harness 에이전트에 ACP 런타임 세션 사용
title: ACP 에이전트
x-i18n:
    generated_at: "2026-04-23T14:09:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP 에이전트

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면 OpenClaw는 ACP 백엔드 Plugin을 통해 외부 코딩 harness(Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI 및 기타 지원되는 ACPX harness 등)를 실행할 수 있습니다.

OpenClaw에 자연어로 "이걸 Codex에서 실행해" 또는 "스레드에서 Claude Code를 시작해"라고 요청하면, OpenClaw는 그 요청을 네이티브 sub-agent 런타임이 아니라 ACP 런타임으로 라우팅해야 합니다. 각 ACP 세션 생성은 [background task](/ko/automation/tasks)로 추적됩니다.

Codex나 Claude Code가 기존 OpenClaw 채널 대화에 외부 MCP 클라이언트로 직접 연결되게 하려면, ACP 대신 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.

## 어떤 페이지를 봐야 하나요?

헷갈리기 쉬운 세 가지 인접한 표면이 있습니다.

| 원하는 작업 | 사용해야 할 것 | 참고 |
| --- | --- | --- |
| Codex, Claude Code, Gemini CLI 또는 다른 외부 harness를 OpenClaw _를 통해_ 실행 | 이 페이지: ACP 에이전트 | 채팅 바인딩 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background tasks, 런타임 제어 |
| OpenClaw Gateway 세션을 에디터 또는 클라이언트를 위한 ACP 서버 _로_ 노출 | [`openclaw acp`](/ko/cli/acp) | 브리지 모드. IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw와 ACP로 통신 |
| 로컬 AI CLI를 텍스트 전용 fallback 모델로 재사용 | [CLI Backends](/ko/gateway/cli-backends) | ACP 아님. OpenClaw 도구 없음, ACP 제어 없음, harness 런타임 없음 |

## 바로 사용할 수 있나요?

보통은 그렇습니다.

- 새 설치에는 이제 번들 `acpx` 런타임 Plugin이 기본 활성화 상태로 포함됩니다.
- 번들 `acpx` Plugin은 자체 Plugin 로컬에 고정된 `acpx` 바이너리를 우선 사용합니다.
- 시작 시 OpenClaw는 해당 바이너리를 점검하고 필요하면 자체 복구합니다.
- 빠른 준비 상태 점검을 원하면 `/acp doctor`부터 시작하세요.

처음 사용할 때 여전히 일어날 수 있는 일:

- 대상 harness 어댑터는 해당 harness를 처음 사용할 때 `npx`로 필요 시 가져올 수 있습니다.
- 해당 harness용 벤더 auth는 여전히 호스트에 존재해야 합니다.
- 호스트에 npm/네트워크 액세스가 없으면, 캐시가 미리 준비되거나 어댑터가 다른 방식으로 설치될 때까지 첫 실행 어댑터 가져오기가 실패할 수 있습니다.

예시:

- `/acp spawn codex`: OpenClaw는 `acpx` 부트스트랩 준비가 되어 있어야 하지만, Codex ACP 어댑터는 여전히 첫 실행 가져오기가 필요할 수 있습니다.
- `/acp spawn claude`: Claude ACP 어댑터도 동일하며, 그 외에도 해당 호스트에 Claude 측 auth가 필요합니다.

## 빠른 운영자 흐름

실용적인 `/acp` 운영 가이드를 원할 때 사용하세요.

1. 세션 생성:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 바인딩된 대화 또는 스레드에서 작업(또는 해당 세션 키를 명시적으로 지정)
3. 런타임 상태 확인:
   - `/acp status`
4. 필요에 따라 런타임 옵션 조정:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 컨텍스트를 바꾸지 않고 활성 세션에 지시:
   - `/acp steer tighten logging and continue`
6. 작업 중지:
   - `/acp cancel` (현재 턴 중지), 또는
   - `/acp close` (세션 닫기 + 바인딩 제거)

## 사용자를 위한 빠른 시작

자연어 요청 예시:

- "이 Discord 채널을 Codex에 바인딩해."
- "여기서 스레드에 영구 Codex 세션을 시작하고 계속 유지해."
- "이 작업을 일회성 Claude Code ACP 세션으로 실행하고 결과를 요약해."
- "이 iMessage 채팅을 Codex에 바인딩하고 후속 작업도 같은 workspace에서 계속해."
- "이 작업은 Gemini CLI로 스레드에서 실행하고, 이후 후속 작업도 그 같은 스레드에서 계속해."

OpenClaw가 해야 할 일:

1. `runtime: "acp"`를 선택합니다.
2. 요청된 harness 대상(`agentId`, 예: `codex`)을 확인합니다.
3. 현재 대화 바인딩이 요청되었고 활성 채널이 이를 지원하면, ACP 세션을 해당 대화에 바인딩합니다.
4. 그렇지 않고 스레드 바인딩이 요청되었으며 현재 채널이 이를 지원하면, ACP 세션을 해당 스레드에 바인딩합니다.
5. 바인딩된 후속 메시지는 unfocused/closed/expired될 때까지 같은 ACP 세션으로 라우팅합니다.

## ACP와 sub-agent의 차이

외부 harness 런타임을 원하면 ACP를 사용하세요. OpenClaw 네이티브 위임 실행을 원하면 sub-agent를 사용하세요.

| 영역 | ACP 세션 | sub-agent 실행 |
| --- | --- | --- |
| 런타임 | ACP 백엔드 Plugin(예: acpx) | OpenClaw 네이티브 sub-agent 런타임 |
| 세션 키 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 주요 명령 | `/acp ...` | `/subagents ...` |
| 생성 도구 | `runtime:"acp"`가 포함된 `sessions_spawn` | `sessions_spawn`(기본 런타임) |

참조: [Sub-agents](/ko/tools/subagents).

## ACP가 Claude Code를 실행하는 방식

ACP를 통한 Claude Code의 스택은 다음과 같습니다.

1. OpenClaw ACP 세션 제어 평면
2. 번들 `acpx` 런타임 Plugin
3. Claude ACP 어댑터
4. Claude 측 런타임/세션 메커니즘

중요한 차이:

- ACP Claude는 ACP 제어, 세션 재개, background-task 추적, 선택적인 대화/스레드 바인딩을 갖춘 harness 세션입니다.
- CLI 백엔드는 별도의 텍스트 전용 로컬 fallback 런타임입니다. [CLI Backends](/ko/gateway/cli-backends)를 참조하세요.

운영자 입장에서의 실용 규칙:

- `/acp spawn`, 바인딩 가능한 세션, 런타임 제어, 영구적인 harness 작업이 필요하면 ACP 사용
- 원시 CLI를 통한 단순 로컬 텍스트 fallback이 필요하면 CLI 백엔드 사용

## 바인딩된 세션

### 현재 대화 바인딩

현재 대화를 자식 스레드를 만들지 않는 영속 ACP workspace로 만들고 싶다면 `/acp spawn <harness> --bind here`를 사용하세요.

동작:

- OpenClaw는 계속해서 채널 전송, auth, 안전성, 전송을 소유합니다.
- 현재 대화는 생성된 ACP 세션 키에 고정됩니다.
- 해당 대화의 후속 메시지는 같은 ACP 세션으로 라우팅됩니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 세션을 닫고 현재 대화 바인딩을 제거합니다.

실제로 의미하는 바:

- `--bind here`는 같은 채팅 표면을 유지합니다. Discord에서는 현재 채널이 그대로 현재 채널입니다.
- `--bind here`는 새 작업을 생성하는 경우 새 ACP 세션을 만들 수도 있습니다. 바인딩은 그 세션을 현재 대화에 연결합니다.
- `--bind here` 자체는 자식 Discord 스레드나 Telegram topic을 만들지 않습니다.
- ACP 런타임은 여전히 자체 작업 디렉터리(`cwd`)나 백엔드가 관리하는 디스크상의 workspace를 가질 수 있습니다. 이 런타임 workspace는 채팅 표면과 별개이며 새 메시징 스레드를 의미하지 않습니다.
- 다른 ACP 에이전트로 생성하고 `--cwd`를 전달하지 않으면, OpenClaw는 기본적으로 요청자의 workspace가 아니라 **대상 에이전트의** workspace를 상속합니다.
- 상속된 workspace 경로가 없으면(`ENOENT`/`ENOTDIR`), OpenClaw는 잘못된 트리를 조용히 재사용하는 대신 백엔드 기본 cwd로 fallback합니다.
- 상속된 workspace가 존재하지만 접근할 수 없으면(예: `EACCES`), 생성은 `cwd`를 무시하지 않고 실제 접근 오류를 반환합니다.

정신 모델:

- 채팅 표면: 사람들이 계속 대화하는 곳(`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP 세션: OpenClaw가 라우팅하는 영속적인 Codex/Claude/Gemini 런타임 상태
- 자식 스레드/topic: `--thread ...`에 의해서만 생성되는 선택적 추가 메시징 표면
- 런타임 workspace: harness가 실행되는 파일시스템 위치(`cwd`, 리포지토리 체크아웃, 백엔드 workspace)

예시:

- `/acp spawn codex --bind here`: 이 채팅을 유지하고, Codex ACP 세션을 생성하거나 연결한 뒤, 이후 메시지를 여기에서 그 세션으로 라우팅
- `/acp spawn codex --thread auto`: OpenClaw가 자식 스레드/topic을 만들고 ACP 세션을 거기에 바인딩할 수 있음
- `/acp spawn codex --bind here --cwd /workspace/repo`: 위와 같은 채팅 바인딩이지만 Codex는 `/workspace/repo`에서 실행

현재 대화 바인딩 지원:

- 현재 대화 바인딩 기능을 제공하는 채팅/메시지 채널은 공유 대화 바인딩 경로를 통해 `--bind here`를 사용할 수 있습니다.
- 사용자 지정 스레드/topic 의미를 가진 채널도 같은 공유 인터페이스 뒤에서 채널별 정규화를 제공할 수 있습니다.
- `--bind here`는 항상 "현재 대화를 제자리에서 바인딩"을 의미합니다.
- 일반적인 현재 대화 바인딩은 공유 OpenClaw 바인딩 저장소를 사용하며, 일반적인 gateway 재시작 후에도 유지됩니다.

참고:

- `/acp spawn`에서 `--bind here`와 `--thread ...`는 서로 배타적입니다.
- Discord에서 `--bind here`는 현재 채널 또는 스레드를 제자리에서 바인딩합니다. `spawnAcpSessions`는 OpenClaw가 `--thread auto|here`를 위해 자식 스레드를 생성해야 할 때만 필요합니다.
- 활성 채널이 현재 대화 ACP 바인딩을 노출하지 않으면, OpenClaw는 명확한 미지원 메시지를 반환합니다.
- `resume` 및 "new session" 관련 질문은 채널 질문이 아니라 ACP 세션 질문입니다. 현재 채팅 표면을 바꾸지 않고도 런타임 상태를 재사용하거나 교체할 수 있습니다.

### 스레드 바인딩 세션

채널 어댑터에서 스레드 바인딩이 활성화되어 있으면 ACP 세션을 스레드에 바인딩할 수 있습니다.

- OpenClaw는 스레드를 대상 ACP 세션에 바인딩합니다.
- 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됩니다.
- ACP 출력은 같은 스레드로 다시 전달됩니다.
- unfocus/close/archive/idle-timeout 또는 max-age 만료 시 바인딩이 제거됩니다.

스레드 바인딩 지원은 어댑터별입니다. 활성 채널 어댑터가 스레드 바인딩을 지원하지 않으면, OpenClaw는 명확한 unsupported/unavailable 메시지를 반환합니다.

스레드 바인딩 ACP에 필요한 기능 플래그:

- `acp.enabled=true`
- `acp.dispatch.enabled`는 기본적으로 켜져 있음(ACP dispatch를 일시 중지하려면 `false` 설정)
- 채널 어댑터 ACP 스레드 생성 플래그 활성화(어댑터별)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### 스레드를 지원하는 채널

- 세션/스레드 바인딩 기능을 제공하는 모든 채널 어댑터
- 현재 내장 지원:
  - Discord 스레드/채널
  - Telegram topic(그룹/supergroup의 forum topic 및 DM topic)
- Plugin 채널도 같은 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.

## 채널별 설정

비일시적 워크플로우의 경우 최상위 `bindings[]` 항목에 영구 ACP 바인딩을 구성하세요.

### 바인딩 모델

- `bindings[].type="acp"`는 영구 ACP 대화 바인딩을 표시합니다.
- `bindings[].match`는 대상 대화를 식별합니다.
  - Discord 채널 또는 스레드: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/그룹 채팅: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 권장합니다.
  - iMessage DM/그룹 채팅: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*`를 권장합니다.
- `bindings[].agentId`는 소유 OpenClaw 에이전트 id입니다.
- 선택적 ACP 재정의는 `bindings[].acp` 아래에 둡니다.
  - `mode` (`persistent` 또는 `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### 에이전트별 런타임 기본값

에이전트별로 ACP 기본값을 한 번 정의하려면 `agents.list[].runtime`을 사용하세요.

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 바인딩 세션의 재정의 우선순위:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 전역 ACP 기본값(예: `acp.backend`)

예시:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

동작:

- OpenClaw는 사용 전에 구성된 ACP 세션이 존재하도록 보장합니다.
- 해당 채널 또는 topic의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 바인딩된 대화에서 `/new`와 `/reset`은 같은 ACP 세션 키를 제자리에서 재설정합니다.
- 임시 런타임 바인딩(예: thread-focus 흐름에서 생성된 것)은 존재하는 경우 계속 적용됩니다.
- 명시적 `cwd` 없이 다른 에이전트에 대해 ACP를 생성하면, OpenClaw는 에이전트 config의 대상 에이전트 workspace를 상속합니다.
- 상속된 workspace 경로가 없으면 백엔드 기본 cwd로 fallback되고, 존재하지만 접근 실패가 있으면 생성 오류로 표시됩니다.

## ACP 세션 시작(인터페이스)

### `sessions_spawn`에서 시작

에이전트 턴 또는 도구 호출에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용하세요.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

참고:

- `runtime`의 기본값은 `subagent`이므로 ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요.
- `agentId`를 생략하면, 설정된 경우 OpenClaw는 `acp.defaultAgent`를 사용합니다.
- `mode: "session"`은 영구 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.

인터페이스 세부 사항:

- `task` (필수): ACP 세션에 보내는 초기 프롬프트
- `runtime` (ACP에 필수): 반드시 `"acp"`여야 함
- `agentId` (선택 사항): ACP 대상 harness id. 설정된 경우 `acp.defaultAgent`로 fallback
- `thread` (선택 사항, 기본값 `false`): 지원되는 경우 스레드 바인딩 흐름 요청
- `mode` (선택 사항): `run`(일회성) 또는 `session`(영구)
  - 기본값은 `run`
  - `thread: true`이고 mode를 생략하면 OpenClaw는 런타임 경로에 따라 영구 동작을 기본으로 선택할 수 있음
  - `mode: "session"`은 `thread: true`가 필요
- `cwd` (선택 사항): 요청된 런타임 작업 디렉터리(백엔드/런타임 정책에 따라 검증됨). 생략하면, ACP 생성은 설정된 경우 대상 에이전트 workspace를 상속합니다. 상속된 경로가 없으면 백엔드 기본값으로 fallback되고, 실제 접근 오류는 그대로 반환됩니다.
- `label` (선택 사항): 세션/배너 텍스트에 사용되는 운영자용 레이블
- `resumeSessionId` (선택 사항): 새 세션을 만드는 대신 기존 ACP 세션을 재개. 에이전트는 `session/load`를 통해 대화 히스토리를 다시 재생합니다. `runtime: "acp"`가 필요합니다.
- `streamTo` (선택 사항): `"parent"`는 초기 ACP 실행 진행 요약을 요청자 세션에 시스템 이벤트로 다시 스트리밍합니다.
  - 가능하면 반환값에 세션 범위 JSONL 로그(` <sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함되며, 전체 relay 히스토리를 tail할 수 있습니다.
- `model` (선택 사항): ACP child 세션의 명시적 모델 재정의. `runtime: "acp"`에서 적용되며, child가 대상 에이전트 기본값으로 조용히 fallback되지 않고 요청된 모델을 사용하게 됩니다.

## 전송 모델

ACP 세션은 인터랙티브 workspace일 수도 있고 부모가 소유하는 background 작업일 수도 있습니다. 전송 경로는 그 형태에 따라 달라집니다.

### 인터랙티브 ACP 세션

인터랙티브 세션은 보이는 채팅 표면에서 계속 대화하도록 설계되었습니다.

- `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인딩합니다.
- `/acp spawn ... --thread ...`는 채널 스레드/topic을 ACP 세션에 바인딩합니다.
- 영구적으로 구성된 `bindings[].type="acp"`는 일치하는 대화를 같은 ACP 세션으로 라우팅합니다.

바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅되며, ACP 출력은 같은 채널/스레드/topic으로 다시 전달됩니다.

### 부모 소유 일회성 ACP 세션

다른 에이전트 실행에 의해 생성된 일회성 ACP 세션은 sub-agent와 비슷한 background child입니다.

- 부모는 `sessions_spawn({ runtime: "acp", mode: "run" })`로 작업을 요청합니다.
- child는 자체 ACP harness 세션에서 실행됩니다.
- 완료는 내부 task-completion announce 경로를 통해 보고됩니다.
- 사용자에게 보이는 답글이 유용한 경우 부모는 child 결과를 일반 assistant 음성으로 다시 작성합니다.

이 경로를 부모와 child 간 peer-to-peer 채팅처럼 취급하지 마세요. child는 이미 부모에게 결과를 돌려보내는 완료 채널을 가지고 있습니다.

### `sessions_send`와 A2A 전송

`sessions_send`는 생성 후 다른 세션을 대상으로 할 수 있습니다. 일반 peer 세션의 경우, OpenClaw는 메시지를 주입한 후 A2A(agent-to-agent) 후속 경로를 사용합니다.

- 대상 세션의 답글 대기
- 선택적으로 요청자와 대상이 제한된 횟수의 후속 턴을 교환하도록 허용
- 대상에게 announce 메시지를 생성하도록 요청
- 그 announce를 보이는 채널 또는 스레드에 전달

이 A2A 경로는 발신자가 보이는 후속 응답을 필요로 하는 peer 전송을 위한 fallback입니다. 예를 들어 넓은 `tools.sessions.visibility` 설정 아래에서 관련 없는 세션이 ACP 대상을 보고 메시지를 보낼 수 있는 경우에도 계속 활성화됩니다.

OpenClaw는 요청자가 자신이 소유한 부모 소유 일회성 ACP child의 부모인 경우에만 A2A 후속을 건너뜁니다. 이 경우 task completion 위에 A2A를 겹치면 부모가 child 결과로 깨워지고, 부모의 답글을 다시 child로 전달해 부모/child echo 루프가 생길 수 있습니다. 이 소유 child의 경우 완료 경로가 이미 결과를 담당하므로, `sessions_send` 결과는 `delivery.status="skipped"`를 보고합니다.

### 기존 세션 재개

새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를 사용하세요. 에이전트는 `session/load`를 통해 대화 히스토리를 다시 재생하므로, 이전에 무엇을 했는지의 전체 컨텍스트를 가지고 이어서 시작합니다.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

일반적인 사용 사례:

- 노트북에서 하던 Codex 세션을 휴대폰으로 넘기기 — 에이전트에게 하던 곳부터 이어 달라고 요청
- CLI에서 인터랙티브하게 시작한 코딩 세션을 이제 에이전트를 통해 헤드리스로 계속하기
- gateway 재시작이나 idle timeout으로 중단된 작업 이어서 하기

참고:

- `resumeSessionId`는 `runtime: "acp"`가 필요하며, sub-agent 런타임에서 사용하면 오류를 반환합니다.
- `resumeSessionId`는 상위 ACP 대화 히스토리를 복원합니다. `thread`와 `mode`는 여전히 새로 만드는 OpenClaw 세션에 정상적으로 적용되므로, `mode: "session"`에는 여전히 `thread: true`가 필요합니다.
- 대상 에이전트는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원함).
- 세션 ID를 찾을 수 없으면, 새 세션으로 조용히 fallback하지 않고 명확한 오류와 함께 생성이 실패합니다.

### 운영자 스모크 테스트

gateway 배포 후 ACP 생성이 단순히 단위 테스트만 통과하는 것이 아니라
실제로 종단 간 동작하는지 빠르게 확인하고 싶을 때 사용하세요.

권장 게이트:

1. 대상 호스트에서 배포된 gateway 버전/커밋 확인
2. 배포된 소스에 `src/gateway/sessions-patch.ts`의 ACP 계보 허용이 포함되어 있는지 확인
   (`subagent:* 또는 acp:* sessions`)
3. 라이브 에이전트(예: `jpclawhq`의 `razor(main)`)에 임시 ACPX 브리지 세션 열기
4. 해당 에이전트에게 다음으로 `sessions_spawn`을 호출하라고 요청:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. 에이전트가 다음을 보고하는지 확인:
   - `accepted=yes`
   - 실제 `childSessionKey`
   - validator 오류 없음
6. 임시 ACPX 브리지 세션 정리

라이브 에이전트에 보낼 예시 프롬프트:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

참고:

- 스레드 바인딩 영구 ACP 세션을 의도적으로 테스트하는 경우가 아니라면 이 스모크 테스트는 `mode: "run"`으로 유지하세요.
- 기본 게이트에 `streamTo: "parent"`를 요구하지 마세요. 이 경로는 요청자/세션 기능에 의존하며 별도의 통합 점검입니다.
- 스레드 바인딩 `mode: "session"` 테스트는 실제 Discord 스레드 또는 Telegram topic에서의 두 번째, 더 풍부한 통합 점검으로 취급하세요.

## sandbox 호환성

현재 ACP 세션은 OpenClaw sandbox 내부가 아니라 호스트 런타임에서 실행됩니다.

현재 제한 사항:

- 요청자 세션이 sandbox된 경우, `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두 ACP 생성이 차단됩니다.
  - 오류: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`가 포함된 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.
  - 오류: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox 강제가 필요한 경우 `runtime: "subagent"`를 사용하세요.

### `/acp` 명령에서 시작

필요할 때 채팅에서 명시적 운영자 제어를 위해 `/acp spawn`을 사용하세요.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

주요 플래그:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

참조: [Slash Commands](/ko/tools/slash-commands).

## 세션 대상 확인

대부분의 `/acp` 액션은 선택적 세션 대상(`session-key`, `session-id`, 또는 `session-label`)을 받습니다.

확인 순서:

1. 명시적 대상 인자(`/acp steer`의 경우 `--session`)
   - 먼저 키 시도
   - 그다음 UUID 형태의 session id
   - 그다음 label
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인딩된 경우)
3. 현재 요청자 세션 fallback

현재 대화 바인딩과 스레드 바인딩 모두 2단계에 참여합니다.

대상이 확인되지 않으면 OpenClaw는 명확한 오류(`Unable to resolve session target: ...`)를 반환합니다.

## 생성 bind 모드

`/acp spawn`은 `--bind here|off`를 지원합니다.

| 모드 | 동작 |
| --- | --- |
| `here` | 현재 활성 대화를 제자리에서 바인딩하며, 활성 대화가 없으면 실패 |
| `off` | 현재 대화 바인딩을 만들지 않음 |

참고:

- `--bind here`는 "이 채널이나 채팅을 Codex 기반으로 만들기"를 위한 가장 단순한 운영자 경로입니다.
- `--bind here`는 자식 스레드를 만들지 않습니다.
- `--bind here`는 현재 대화 바인딩 지원을 노출하는 채널에서만 사용할 수 있습니다.
- 같은 `/acp spawn` 호출에서는 `--bind`와 `--thread`를 함께 사용할 수 없습니다.

## 생성 thread 모드

`/acp spawn`은 `--thread auto|here|off`를 지원합니다.

| 모드 | 동작 |
| --- | --- |
| `auto` | 활성 스레드 안에서는 해당 스레드를 바인딩. 스레드 밖에서는 지원되는 경우 자식 스레드를 만들고 바인딩 |
| `here` | 현재 활성 스레드를 요구하며, 스레드 안이 아니면 실패 |
| `off` | 바인딩 없음. 세션은 바인딩되지 않은 상태로 시작 |

참고:

- 스레드 바인딩 표면이 아닌 경우 기본 동작은 사실상 `off`입니다.
- 스레드 바인딩 생성에는 채널 정책 지원이 필요합니다.
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 자식 스레드를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용하세요.

## ACP 제어

사용 가능한 명령 계열:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status`는 유효 런타임 옵션과, 가능한 경우 런타임 수준 및 백엔드 수준 세션 식별자를 모두 표시합니다.

일부 제어는 백엔드 기능에 의존합니다. 백엔드가 특정 제어를 지원하지 않으면, OpenClaw는 명확한 unsupported-control 오류를 반환합니다.

## ACP 명령 cookbook

| 명령 | 수행 작업 | 예시 |
| --- | --- | --- |
| `/acp spawn` | ACP 세션 생성, 선택적 현재 바인딩 또는 스레드 바인딩 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 대상 세션의 진행 중인 턴 취소 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 실행 중인 세션에 조정 지시 전송 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 세션 닫기 및 스레드 대상 바인딩 해제 | `/acp close` |
| `/acp status` | 백엔드, 모드, 상태, 런타임 옵션, 기능 표시 | `/acp status` |
| `/acp set-mode` | 대상 세션의 런타임 모드 설정 | `/acp set-mode plan` |
| `/acp set` | 일반 런타임 config 옵션 쓰기 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 런타임 작업 디렉터리 재정의 설정 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 승인 정책 프로필 설정 | `/acp permissions strict` |
| `/acp timeout` | 런타임 timeout(초) 설정 | `/acp timeout 120` |
| `/acp model` | 런타임 모델 재정의 설정 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 세션 런타임 옵션 재정의 제거 | `/acp reset-options` |
| `/acp sessions` | 저장소에서 최근 ACP 세션 목록 조회 | `/acp sessions` |
| `/acp doctor` | 백엔드 상태, 기능, 실행 가능한 수정 사항 | `/acp doctor` |
| `/acp install` | 결정적인 설치 및 활성화 단계 출력 | `/acp install` |

`/acp sessions`는 현재 바인딩되었거나 요청자 세션의 저장소를 읽습니다. `session-key`, `session-id`, `session-label` 토큰을 받는 명령은 사용자 지정 에이전트별 `session.store` 루트를 포함한 gateway 세션 검색을 통해 대상을 확인합니다.

## 런타임 옵션 매핑

`/acp`는 편의 명령과 일반 setter를 모두 제공합니다.

동등한 작업:

- `/acp model <id>`는 런타임 config 키 `model`에 매핑됩니다.
- `/acp permissions <profile>`은 런타임 config 키 `approval_policy`에 매핑됩니다.
- `/acp timeout <seconds>`는 런타임 config 키 `timeout`에 매핑됩니다.
- `/acp cwd <path>`는 런타임 cwd 재정의를 직접 갱신합니다.
- `/acp set <key> <value>`는 일반 경로입니다.
  - 특수 사례: `key=cwd`는 cwd 재정의 경로를 사용합니다.
- `/acp reset-options`는 대상 세션의 모든 런타임 재정의를 지웁니다.

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

OpenClaw가 acpx 백엔드를 사용할 때는, acpx config에 사용자 지정 에이전트 별칭이 정의되어 있지 않은 한 `agentId`에 이 값들을 사용하는 것이 좋습니다.
로컬 Cursor 설치가 여전히 ACP를 `agent acp`로 노출한다면, 내장 기본값을 바꾸는 대신 acpx config에서 `cursor` 에이전트 명령을 재정의하세요.

직접 acpx CLI를 사용할 경우 `--agent <command>`를 통해 임의 어댑터를 대상으로 할 수도 있지만, 이 원시 이스케이프 해치는 일반적인 OpenClaw `agentId` 경로가 아니라 acpx CLI 기능입니다.

## 필수 config

핵심 ACP 기본 기준:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어는 유지한 채 ACP dispatch를 일시 중지하려면 false로 설정
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

스레드 바인딩 config는 채널 어댑터별입니다. Discord 예시:

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

스레드 바인딩 ACP 생성이 작동하지 않는다면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩은 자식 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

참조: [Configuration Reference](/ko/gateway/configuration-reference).

## acpx 백엔드용 Plugin 설정

새 설치에는 번들 `acpx` 런타임 Plugin이 기본 활성화 상태로 포함되므로, 보통
수동 Plugin 설치 단계 없이 ACP가 동작합니다.

다음부터 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 차단했거나,
로컬 개발 checkout으로 전환하려면 명시적 Plugin 경로를 사용하세요.

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 workspace 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그런 다음 백엔드 상태를 확인하세요.

```text
/acp doctor
```

### acpx 명령 및 버전 config

기본적으로 번들 acpx 백엔드 Plugin(`acpx`)은 Plugin 로컬에 고정된 바이너리를 사용합니다.

1. 명령은 ACPX Plugin 패키지 내부의 Plugin 로컬 `node_modules/.bin/acpx`를 기본값으로 사용합니다.
2. 기대 버전은 extension pin을 기본값으로 사용합니다.
3. 시작 시 ACP 백엔드는 즉시 not-ready 상태로 등록됩니다.
4. 백그라운드 ensure 작업이 `acpx --version`을 확인합니다.
5. Plugin 로컬 바이너리가 없거나 버전이 맞지 않으면 다음을 실행합니다.
   `npm install --omit=dev --no-save acpx@<pinned>` 후 다시 확인합니다.

Plugin config에서 명령/버전을 재정의할 수 있습니다.

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

참고:

- `command`는 절대 경로, 상대 경로 또는 명령 이름(`acpx`)을 받을 수 있습니다.
- 상대 경로는 OpenClaw workspace 디렉터리를 기준으로 확인됩니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- `command`가 사용자 지정 바이너리/경로를 가리키면 Plugin 로컬 자동 설치는 비활성화됩니다.
- 백엔드 상태 점검이 실행되는 동안에도 OpenClaw 시작은 비차단으로 유지됩니다.

참조: [Plugins](/ko/tools/plugin).

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면, acpx
런타임 의존성(플랫폼별 바이너리)은 postinstall hook을 통해 자동으로 설치됩니다. 자동 설치가 실패해도 gateway는 여전히
정상적으로 시작되며, 누락된 의존성은 `openclaw acp doctor`를 통해 보고됩니다.

### Plugin 도구 MCP 브리지

기본적으로 ACPX 세션은 OpenClaw Plugin 등록 도구를 ACP harness에
노출하지 않습니다.

Codex나 Claude Code 같은 ACP 에이전트가 memory recall/store 같은
설치된 OpenClaw Plugin 도구를 호출할 수 있게 하려면, 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 설정이 하는 일:

- `openclaw-plugin-tools`라는 내장 MCP 서버를 ACPX 세션
  bootstrap에 주입합니다.
- 이미 설치되고 활성화된 OpenClaw
  plugins가 등록한 Plugin 도구를 노출합니다.
- 이 기능을 명시적이며 기본 비활성화 상태로 유지합니다.

보안 및 신뢰 참고:

- 이는 ACP harness 도구 표면을 넓힙니다.
- ACP 에이전트는 gateway에서 이미 활성 상태인 Plugin 도구에만 접근할 수 있습니다.
- 이는 해당 plugins를 OpenClaw 자체에서 실행하도록 허용하는 것과 같은 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 plugins를 검토하세요.

사용자 지정 `mcpServers`는 이전과 동일하게 계속 작동합니다. 내장 plugin-tools 브리지는
추가적인 opt-in 편의 기능이지, 일반 MCP 서버 config를 대체하는 것은 아닙니다.

### OpenClaw 도구 MCP 브리지

기본적으로 ACPX 세션은 내장 OpenClaw 도구도 MCP를 통해
노출하지 않습니다. ACP 에이전트가 `cron` 같은 일부
내장 도구를 필요로 할 때는 별도의 core-tools 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

이 설정이 하는 일:

- `openclaw-tools`라는 내장 MCP 서버를 ACPX 세션
  bootstrap에 주입합니다.
- 선택된 내장 OpenClaw 도구를 노출합니다. 초기 서버는 `cron`을 노출합니다.
- core-tool 노출을 명시적이며 기본 비활성화 상태로 유지합니다.

### 런타임 timeout config

번들 `acpx` Plugin은 기본적으로 임베드된 런타임 턴에 120초
timeout을 사용합니다. 이렇게 하면 Gemini CLI 같은 느린 harness도 ACP 시작과 초기화를 완료할 충분한 시간을 확보할 수 있습니다. 호스트에 다른
런타임 제한이 필요하다면 재정의하세요.

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 뒤에는 gateway를 재시작하세요.

### 상태 프로브 에이전트 config

번들 `acpx` Plugin은 임베드된 런타임 백엔드가 준비되었는지 판단할 때
하나의 harness 에이전트를 프로브합니다. 기본값은 `codex`입니다. 배포에서 다른 기본 ACP 에이전트를 사용한다면, 프로브 에이전트도 같은 id로 설정하세요.

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 뒤에는 gateway를 재시작하세요.

## 권한 config

ACP 세션은 non-interactive로 실행됩니다. 파일 쓰기 및 셸 exec 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 개의 config 키를 제공합니다.

이 ACPX harness 권한은 OpenClaw exec 승인과도 별개이고, Claude CLI `--permission-mode bypassPermissions` 같은 CLI-backend 벤더 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션을 위한 harness 수준의 비상 스위치입니다.

### `permissionMode`

harness 에이전트가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값 | 동작 |
| --- | --- |
| `approve-all` | 모든 파일 쓰기와 셸 명령을 자동 승인 |
| `approve-reads` | 읽기만 자동 승인, 쓰기와 exec는 프롬프트 필요 |
| `deny-all` | 모든 권한 프롬프트 거부 |

### `nonInteractivePermissions`

권한 프롬프트를 보여야 하지만 대화형 TTY를 사용할 수 없을 때(ACP 세션에서는 항상 해당) 어떻게 동작할지 제어합니다.

| 값 | 동작 |
| --- | --- |
| `fail` | `AcpRuntimeError`와 함께 세션 중단. **(기본값)** |
| `deny` | 권한을 조용히 거부하고 계속 진행(점진적 성능 저하) |

### 구성

Plugin config를 통해 설정:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 뒤에는 gateway를 재시작하세요.

> **중요:** OpenClaw는 현재 기본값으로 `permissionMode=approve-reads` 및 `nonInteractivePermissions=fail`을 사용합니다. non-interactive ACP 세션에서는 권한 프롬프트를 트리거하는 모든 쓰기 또는 exec가 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.
>
> 권한을 제한해야 한다면, 세션이 중단되는 대신 점진적으로 성능이 저하되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.

## 문제 해결

| 증상 | 가능한 원인 | 수정 방법 |
| --- | --- | --- |
| `ACP runtime backend is not configured` | 백엔드 Plugin이 없거나 비활성화됨 | 백엔드 Plugin을 설치하고 활성화한 뒤 `/acp doctor` 실행 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP가 전역적으로 비활성화됨 | `acp.enabled=true` 설정 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 일반 스레드 메시지에서의 dispatch가 비활성화됨 | `acp.dispatch.enabled=true` 설정 |
| `ACP agent "<id>" is not allowed by policy` | 에이전트가 allowlist에 없음 | 허용된 `agentId` 사용 또는 `acp.allowedAgents` 업데이트 |
| `Unable to resolve session target: ...` | 잘못된 key/id/label 토큰 | `/acp sessions` 실행 후 정확한 key/label을 복사해 다시 시도 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 바인딩 가능한 활성 대화 없이 `--bind here` 사용 | 대상 채팅/채널로 이동해 다시 시도하거나 바인딩 없는 spawn 사용 |
| `Conversation bindings are unavailable for <channel>.` | 어댑터에 현재 대화 ACP 바인딩 기능이 없음 | 지원되는 경우 `/acp spawn ... --thread ...` 사용, 최상위 `bindings[]` 구성, 또는 지원 채널로 이동 |
| `--thread here requires running /acp spawn inside an active ... thread` | 스레드 컨텍스트 밖에서 `--thread here` 사용 | 대상 스레드로 이동하거나 `--thread auto`/`off` 사용 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 다른 사용자가 현재 바인딩 대상을 소유함 | 소유자로 다시 바인딩하거나 다른 대화 또는 스레드 사용 |
| `Thread bindings are unavailable for <channel>.` | 어댑터에 스레드 바인딩 기능이 없음 | `--thread off` 사용 또는 지원되는 어댑터/채널로 이동 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 런타임은 호스트 측이며 요청자 세션이 sandbox됨 | sandbox된 세션에서는 `runtime="subagent"` 사용, 또는 sandbox되지 않은 세션에서 ACP spawn 실행 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | ACP 런타임에 대해 `sandbox="require"` 요청됨 | 필수 sandboxing에는 `runtime="subagent"` 사용, 또는 sandbox되지 않은 세션에서 `sandbox="inherit"`로 ACP 사용 |
| 바인딩된 세션의 ACP 메타데이터 누락 | 오래되었거나 삭제된 ACP 세션 메타데이터 | `/acp spawn`으로 다시 만든 뒤 스레드 재바인딩/포커스 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode`가 non-interactive ACP 세션의 쓰기/exec를 차단 | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway 재시작. [Permission configuration](#permission-configuration) 참조 |
| ACP 세션이 거의 출력 없이 초기에 실패 | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됨 | gateway 로그에서 `AcpRuntimeError` 확인. 전체 권한이 필요하면 `permissionMode=approve-all`, 점진적 성능 저하를 원하면 `nonInteractivePermissions=deny` 설정 |
| 작업 완료 후 ACP 세션이 무기한 멈춤 | harness 프로세스는 끝났지만 ACP 세션이 완료를 보고하지 않음 | `ps aux \| grep acpx`로 확인하고 오래된 프로세스를 수동 종료 |
