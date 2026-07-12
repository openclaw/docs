---
read_when:
    - 여러 개의 격리된 에이전트(작업 공간 + 라우팅 + 인증)가 필요한 경우
summary: '`openclaw agents` CLI 참조(목록/추가/삭제/바인딩/바인딩/바인딩 해제/ID 설정)'
title: 에이전트
x-i18n:
    generated_at: "2026-07-12T00:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

격리된 에이전트(작업 공간 + 인증 + 라우팅)를 관리합니다. 하위 명령 없이 `openclaw agents`를 실행하면 `openclaw agents list`를 실행하는 것과 같습니다.

관련 문서:

- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [에이전트 작업 공간](/ko/concepts/agent-workspace)
- [Skills 구성](/ko/tools/skills-config): Skills 표시 범위 구성.

## 예시

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 명령 표면

### `agents list`

옵션: `--json`, `--bindings`(에이전트별 개수/요약뿐만 아니라 전체 라우팅 규칙도 포함).

### `agents add [name]`

옵션: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>`(반복 가능), `--non-interactive`, `--json`.

- 명시적인 추가 플래그를 하나라도 전달하면 명령이 비대화형 경로로 전환됩니다.
- 비대화형 모드에는 에이전트 이름과 `--workspace`가 모두 필요합니다.
- `main`은 예약되어 있으므로 새 에이전트 ID로 사용할 수 없습니다.
- 대화형 모드는 자격 증명에서 `copyToAgents: false`로 제외하지 않는 한 이식 가능한 정적 자격 증명(`api_key` 및 정적 `token` 프로필)만 복사하여 인증을 초기화합니다. 공급자가 `copyToAgents: true`로 명시적으로 허용하지 않는 한 OAuth 갱신 토큰 프로필은 복사되지 않습니다. 복사본이 없으면 OAuth는 실제 `main` 에이전트 저장소의 읽기 통과 상속을 통해서만 사용할 수 있습니다. 구성된 기본 에이전트가 `main`이 아니면 새 에이전트에서 OAuth 프로필에 별도로 로그인하세요.

### `agents bindings`

옵션: `--agent <id>`, `--json`.

### `agents bind`

옵션: `--agent <id>`(현재 기본 에이전트가 기본값), `--bind <channel[:accountId]>`(반복 가능), `--json`.

### `agents unbind`

옵션: `--agent <id>`(현재 기본 에이전트가 기본값), `--bind <channel[:accountId]>`(반복 가능), `--all`, `--json`. `--all` 또는 하나 이상의 `--bind` 값 중 하나만 사용할 수 있으며, 둘을 함께 사용할 수는 없습니다.

### `agents set-identity`

옵션: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. 아래의 [정체성 설정](#set-identity)을 참조하세요.

### `agents delete <id>`

옵션: `--force`, `--json`.

- `main`은 삭제할 수 없습니다.
- `--force`를 사용하지 않으면 대화형 확인이 필요합니다(TTY가 아닌 세션에서는 실패하며 `--force`를 사용하여 다시 실행해야 합니다).
- 작업 공간, 에이전트 상태 및 세션 기록 디렉터리는 영구 삭제되지 않고 휴지통으로 이동합니다.
- Gateway에 연결할 수 있으면 삭제가 Gateway를 통해 라우팅되므로 구성 및 세션 저장소 정리가 런타임 트래픽과 동일한 작성자를 공유합니다. Gateway에 연결할 수 없으면 CLI가 오프라인 로컬 경로로 대체합니다.
- 다른 에이전트의 작업 공간이 동일한 경로이거나 이 작업 공간 내부에 있거나 이 작업 공간을 포함하면 작업 공간이 유지되며, `--json`은 `workspaceRetained`, `workspaceRetainedReason`, `workspaceSharedWith`를 보고합니다.

## 라우팅 바인딩

라우팅 바인딩을 사용하여 수신 채널 트래픽을 특정 에이전트에 고정합니다.

에이전트별로 표시되는 Skills도 다르게 하려면 `openclaw.json`에서 `agents.defaults.skills`와 `agents.list[].skills`를 구성하세요. [Skills 구성](/ko/tools/skills-config)과 [구성 참조](/ko/gateway/config-agents#agentsdefaultsskills)를 참조하세요.

바인딩 목록 표시:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

바인딩 추가:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

에이전트를 생성할 때 바인딩을 추가할 수도 있습니다.

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

`accountId`를 생략하면(`--bind <channel>`) OpenClaw는 Plugin 설정 훅, 강제 계정 바인딩 또는 채널에 구성된 계정 수를 사용하여 이를 결정합니다.

`bind` 또는 `unbind`에서 `--agent`를 생략하면 OpenClaw는 현재 기본 에이전트를 대상으로 지정합니다.

### `--bind` 형식

| 형식                         | 의미                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--bind <channel>:*`         | 채널의 모든 계정과 일치합니다.                                                                         |
| `--bind <channel>:<account>` | 하나의 계정과 일치합니다.                                                                              |
| `--bind <channel>`           | CLI가 Plugin별 계정 범위를 안전하게 결정할 수 있는 경우를 제외하고 기본 계정에만 일치합니다.            |

### 바인딩 범위 동작

- 저장된 바인딩에 `accountId`가 없으면 채널 기본 계정에만 일치합니다.
- `accountId: "*"`는 채널 전체 대체 경로(모든 계정)이며 명시적인 계정 바인딩보다 구체성이 낮습니다.
- 동일한 에이전트에 이미 `accountId`가 없는 일치 채널 바인딩이 있고 나중에 명시적이거나 결정된 `accountId`를 사용하여 바인딩하면, OpenClaw는 중복 항목을 추가하는 대신 기존 바인딩을 그 자리에서 업그레이드합니다.

예시:

```bash
# 채널의 모든 계정과 일치
openclaw agents bind --agent work --bind telegram:*

# 특정 계정과 일치
openclaw agents bind --agent work --bind telegram:ops

# 초기 채널 전용 바인딩
openclaw agents bind --agent work --bind telegram

# 이후 계정 범위 바인딩으로 업그레이드
openclaw agents bind --agent work --bind telegram:alerts
```

업그레이드 후 해당 바인딩의 라우팅 범위는 `telegram:alerts`로 제한됩니다. 기본 계정 라우팅도 사용하려면 명시적으로 추가하세요(예: `--bind telegram:default`).

바인딩 제거:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## 정체성 파일

각 에이전트 작업 공간은 작업 공간 루트에 `IDENTITY.md`를 포함할 수 있습니다.

- 경로 예시: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`는 작업 공간 루트(또는 명시적인 `--identity-file`)에서 읽습니다.

아바타 경로는 작업 공간 루트를 기준으로 결정되며 심볼릭 링크를 통하더라도 작업 공간을 벗어날 수 없습니다.

## 정체성 설정

`set-identity`는 `agents.list[].identity`에 `name`, `theme`, `emoji`, `avatar`(작업 공간 기준 상대 경로, http(s) URL 또는 데이터 URI) 필드를 기록합니다.

- `--agent` 또는 `--workspace`로 대상 에이전트를 선택합니다. `--workspace`가 둘 이상의 에이전트와 일치하면 명령이 실패하고 `--agent`를 전달하라는 메시지가 표시됩니다.
- 로컬 작업 공간 기준 상대 아바타 이미지 파일은 2MB로 제한됩니다. HTTP(S) URL과 `data:` URI에는 로컬 파일 크기 제한이 적용되지 않습니다.
- 명시적인 정체성 필드를 제공하지 않으면 명령이 `IDENTITY.md`에서 정체성 데이터를 읽습니다.

`IDENTITY.md`에서 불러오기:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

필드를 명시적으로 재정의:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

구성 예시:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [에이전트 작업 공간](/ko/concepts/agent-workspace)
