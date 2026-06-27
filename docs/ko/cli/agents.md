---
read_when:
    - 여러 개의 격리된 에이전트(작업 공간 + 라우팅 + 인증)가 필요합니다
summary: '`openclaw agents`에 대한 CLI 참조(list/add/delete/bindings/bind/unbind/set identity)'
title: 에이전트
x-i18n:
    generated_at: "2026-06-27T17:16:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

격리된 에이전트(작업공간 + 인증 + 라우팅)를 관리합니다.

관련 항목:

- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [에이전트 작업공간](/ko/concepts/agent-workspace)
- [Skills 구성](/ko/tools/skills-config): 스킬 표시 여부 구성.

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

## 라우팅 바인딩

라우팅 바인딩을 사용해 인바운드 채널 트래픽을 특정 에이전트에 고정합니다.

에이전트마다 보이는 스킬도 다르게 설정하려면 `openclaw.json`에서 `agents.defaults.skills` 및 `agents.list[].skills`를 구성하세요. [Skills 구성](/ko/tools/skills-config) 및 [구성 참조](/ko/gateway/config-agents#agents-defaults-skills)를 참고하세요.

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

에이전트를 만들 때도 바인딩을 추가할 수 있습니다.

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

`accountId`(`--bind <channel>`)를 생략하면 OpenClaw가 Plugin 설정 훅, 강제 계정 바인딩 또는 채널에 구성된 계정 수에서 이를 확인합니다.

`bind` 또는 `unbind`에 `--agent`를 생략하면 OpenClaw는 현재 기본 에이전트를 대상으로 합니다.

### `--bind` 형식

| 형식                         | 의미                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | 채널의 모든 계정과 일치합니다.                                                                   |
| `--bind <channel>:<account>` | 계정 하나와 일치합니다.                                                                          |
| `--bind <channel>`           | CLI가 Plugin별 계정 범위를 안전하게 확인할 수 없는 한 기본 계정에만 일치합니다.                  |

### 바인딩 범위 동작

- `accountId` 없이 저장된 바인딩은 채널 기본 계정에만 일치합니다.
- `accountId: "*"`는 채널 전체 폴백(모든 계정)이며, 명시적 계정 바인딩보다 덜 구체적입니다.
- 같은 에이전트에 이미 `accountId` 없는 일치 채널 바인딩이 있고, 나중에 명시적 또는 확인된 `accountId`로 바인딩하면 OpenClaw는 중복을 추가하지 않고 기존 바인딩을 제자리에서 업그레이드합니다.

예시:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

업그레이드 후 해당 바인딩의 라우팅은 `telegram:alerts`로 범위가 지정됩니다. 기본 계정 라우팅도 원한다면 명시적으로 추가하세요(예: `--bind telegram:default`).

바인딩 제거:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`는 `--all` 또는 하나 이상의 `--bind` 값을 받지만, 둘을 함께 받을 수는 없습니다.

## 명령 표면

### `agents`

하위 명령 없이 `openclaw agents`를 실행하는 것은 `openclaw agents list`와 동일합니다.

### `agents list`

옵션:

- `--json`
- `--bindings`: 에이전트별 개수/요약만이 아니라 전체 라우팅 규칙을 포함합니다.

### `agents add [name]`

옵션:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (반복 가능)
- `--non-interactive`
- `--json`

참고:

- 명시적인 add 플래그를 전달하면 명령이 비대화형 경로로 전환됩니다.
- 비대화형 모드에는 에이전트 이름과 `--workspace`가 모두 필요합니다.
- `main`은 예약되어 있으며 새 에이전트 ID로 사용할 수 없습니다.
- 대화형 모드에서 인증 시드는 이식 가능한 정적 프로필만 복사합니다
  (기본적으로 `api_key` 및 정적 `token`). OAuth 리프레시 토큰 프로필은 실제 `main` 에이전트 저장소의 읽기 관통 상속을 통해서만 계속 사용할 수 있습니다.
  구성된 기본 에이전트가 `main`이 아닌 경우 새 에이전트에서 OAuth 프로필에 대해 별도로 로그인하세요.

### `agents bindings`

옵션:

- `--agent <id>`
- `--json`

### `agents bind`

옵션:

- `--agent <id>` (현재 기본 에이전트가 기본값)
- `--bind <channel[:accountId]>` (반복 가능)
- `--json`

### `agents unbind`

옵션:

- `--agent <id>` (현재 기본 에이전트가 기본값)
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
- 작업공간, 에이전트 상태, 세션 트랜스크립트 디렉터리는 완전 삭제되지 않고 휴지통으로 이동됩니다.
- Gateway에 연결할 수 있으면 런타임 트래픽과 동일한 작성자가 구성 및 세션 저장소 정리를 공유하도록 삭제가 Gateway를 통해 전송됩니다. Gateway에 연결할 수 없으면 CLI가 오프라인 로컬 경로로 폴백합니다.
- 다른 에이전트의 작업공간이 같은 경로이거나, 이 작업공간 내부에 있거나, 이 작업공간을 포함하는 경우
  작업공간은 유지되고 `--json`은 `workspaceRetained`,
  `workspaceRetainedReason`, `workspaceSharedWith`를 보고합니다.

## ID 파일

각 에이전트 작업공간은 작업공간 루트에 `IDENTITY.md`를 포함할 수 있습니다.

- 예시 경로: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`는 작업공간 루트(또는 명시적 `--identity-file`)에서 읽습니다.

아바타 경로는 작업공간 루트를 기준으로 확인됩니다.

## ID 설정

`set-identity`는 필드를 `agents.list[].identity`에 씁니다.

- `name`
- `theme`
- `emoji`
- `avatar` (작업공간 상대 경로, http(s) URL 또는 data URI)

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

- `--agent` 또는 `--workspace`를 사용해 대상 에이전트를 선택할 수 있습니다.
- `--workspace`에 의존하고 여러 에이전트가 해당 작업공간을 공유하는 경우 명령이 실패하며 `--agent`를 전달하라고 요청합니다.
- 로컬 작업공간 상대 아바타 이미지 파일은 2 MB로 제한됩니다. HTTP(S) URL 및 `data:` URI는 로컬 파일 크기 제한으로 검사되지 않습니다.
- 명시적 ID 필드가 제공되지 않으면 명령은 `IDENTITY.md`에서 ID 데이터를 읽습니다.

`IDENTITY.md`에서 로드:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

필드 명시적 재정의:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

구성 샘플:

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

## 관련 항목

- [CLI 참조](/ko/cli)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [에이전트 작업공간](/ko/concepts/agent-workspace)
