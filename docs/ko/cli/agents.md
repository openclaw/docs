---
read_when:
    - 여러 개의 격리된 에이전트(workspaces + routing + auth)가 필요함
summary: '`openclaw agents`용 CLI 참조(`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)'
title: agents
x-i18n:
    generated_at: "2026-04-23T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

격리된 에이전트(workspaces + auth + routing)를 관리합니다.

관련 항목:

- 다중 에이전트 라우팅: [Multi-Agent Routing](/ko/concepts/multi-agent)
- 에이전트 workspace: [Agent workspace](/ko/concepts/agent-workspace)
- Skills 가시성 구성: [Skills config](/ko/tools/skills-config)

## 예시

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 라우팅 바인딩

라우팅 바인딩을 사용해 inbound 채널 트래픽을 특정 에이전트에 고정하세요.

에이전트별로 보이는 Skills도 다르게 하려면 `openclaw.json`에서
`agents.defaults.skills`와 `agents.list[].skills`를 구성하세요. 자세한 내용은
[Skills config](/ko/tools/skills-config) 및
[Configuration Reference](/ko/gateway/configuration-reference#agents-defaults-skills)를 참조하세요.

바인딩 나열:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

바인딩 추가:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`(`--bind <channel>`)를 생략하면, OpenClaw는 가능한 경우 채널 기본값과 Plugin 설정 hook에서 이를 확인합니다.

`bind` 또는 `unbind`에서 `--agent`를 생략하면, OpenClaw는 현재 기본 에이전트를 대상으로 합니다.

### 바인딩 범위 동작

- `accountId`가 없는 바인딩은 채널 기본 계정에만 일치합니다.
- `accountId: "*"`는 채널 전체 fallback(모든 계정)이며, 명시적 계정 바인딩보다 구체성이 낮습니다.
- 동일한 에이전트에 이미 `accountId` 없는 일치하는 채널 바인딩이 있고, 이후 명시적이거나 확인된 `accountId`로 바인딩하면, OpenClaw는 중복을 추가하는 대신 기존 바인딩을 그 자리에서 업그레이드합니다.

예시:

```bash
# 초기 채널 전용 바인딩
openclaw agents bind --agent work --bind telegram

# 이후 계정 범위 바인딩으로 업그레이드
openclaw agents bind --agent work --bind telegram:ops
```

업그레이드 후 해당 바인딩의 라우팅 범위는 `telegram:ops`로 제한됩니다. 기본 계정 라우팅도 원한다면 명시적으로 추가하세요(예: `--bind telegram:default`).

바인딩 제거:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`는 `--all` 또는 하나 이상의 `--bind` 값 중 하나만 받을 수 있으며, 둘 다 함께 사용할 수는 없습니다.

## 명령 표면

### `agents`

하위 명령 없이 `openclaw agents`를 실행하면 `openclaw agents list`와 동일합니다.

### `agents list`

옵션:

- `--json`
- `--bindings`: 에이전트별 개수/요약만이 아니라 전체 라우팅 규칙 포함

### `agents add [name]`

옵션:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (반복 가능)
- `--non-interactive`
- `--json`

참고:

- 명시적인 add 플래그를 하나라도 전달하면 명령은 non-interactive 경로로 전환됩니다.
- non-interactive 모드에는 에이전트 이름과 `--workspace`가 모두 필요합니다.
- `main`은 예약어이므로 새 에이전트 id로 사용할 수 없습니다.

### `agents bindings`

옵션:

- `--agent <id>`
- `--json`

### `agents bind`

옵션:

- `--agent <id>` (기본값은 현재 기본 에이전트)
- `--bind <channel[:accountId]>` (반복 가능)
- `--json`

### `agents unbind`

옵션:

- `--agent <id>` (기본값은 현재 기본 에이전트)
- `--bind <channel[:accountId]>` (반복 가능)
- `--all`
- `--json`

### `agents delete <id>`

옵션:

- `--force`
- `--json`

참고:

- `main`은 삭제할 수 없습니다.
- `--force`가 없으면 대화형 확인이 필요합니다.
- workspace, 에이전트 상태, 세션 transcript 디렉터리는 완전 삭제되지 않고 휴지통으로 이동됩니다.

## identity 파일

각 에이전트 workspace는 workspace 루트에 `IDENTITY.md`를 포함할 수 있습니다.

- 예시 경로: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`는 workspace 루트(또는 명시적인 `--identity-file`)에서 읽습니다

아바타 경로는 workspace 루트를 기준으로 확인됩니다.

## identity 설정

`set-identity`는 필드를 `agents.list[].identity`에 기록합니다.

- `name`
- `theme`
- `emoji`
- `avatar` (workspace 상대 경로, http(s) URL, 또는 data URI)

옵션:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

참고:

- 대상 에이전트 선택에는 `--agent` 또는 `--workspace`를 사용할 수 있습니다.
- `--workspace`에 의존하는데 여러 에이전트가 해당 workspace를 공유하면, 명령은 실패하고 `--agent`를 전달하라고 안내합니다.
- 명시적인 identity 필드가 제공되지 않으면, 명령은 `IDENTITY.md`에서 identity 데이터를 읽습니다.

`IDENTITY.md`에서 로드:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

필드를 명시적으로 재정의:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Config 예시:

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
