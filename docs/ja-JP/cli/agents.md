---
read_when:
    - 複数の独立した agents（workspaces + routing + auth）が必要です
summary: '`openclaw agents` の CLI リファレンス（list/add/delete/bindings/bind/unbind/set identity）'
title: agents
x-i18n:
    generated_at: "2026-04-23T14:00:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

独立した agents（workspaces + auth + routing）を管理します。

関連:

- Multi-agent routing: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)
- Agent workspace: [Agent workspace](/ja-JP/concepts/agent-workspace)
- Skill visibility config: [Skills config](/ja-JP/tools/skills-config)

## 例

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

## ルーティング bindings

ルーティング bindings を使うと、入力 channel traffic を特定の agent に固定できます。

agent ごとに表示される Skills も変えたい場合は、
`openclaw.json` で `agents.defaults.skills` と `agents.list[].skills` を設定してください。[Skills config](/ja-JP/tools/skills-config) と
[Configuration Reference](/ja-JP/gateway/configuration-reference#agents-defaults-skills) を参照してください。

bindings を一覧表示:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

bindings を追加:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`（`--bind <channel>`）を省略すると、利用可能な場合は channel defaults と plugin setup hooks から OpenClaw が解決します。

`bind` または `unbind` で `--agent` を省略すると、OpenClaw は現在のデフォルト agent を対象にします。

### Binding スコープの動作

- `accountId` なしの binding は、その channel のデフォルト account にのみ一致します。
- `accountId: "*"` は channel 全体の fallback（すべての accounts）であり、明示的な account binding より具体性が低くなります。
- 同じ agent に対して `accountId` なしの一致する channel binding がすでにあり、その後で明示的または解決済みの `accountId` を付けて bind すると、OpenClaw は重複を追加するのではなく、その既存 binding をその場で更新します。

例:

```bash
# 初期の channel-only binding
openclaw agents bind --agent work --bind telegram

# 後で account スコープの binding に更新
openclaw agents bind --agent work --bind telegram:ops
```

更新後、その binding のルーティングは `telegram:ops` にスコープされます。デフォルト account のルーティングも必要なら、明示的に追加してください（例: `--bind telegram:default`）。

bindings を削除:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` は `--all` か 1 つ以上の `--bind` 値のどちらか一方のみを受け付け、両方は指定できません。

## コマンドサーフェス

### `agents`

subcommand なしで `openclaw agents` を実行すると、`openclaw agents list` と同等です。

### `agents list`

オプション:

- `--json`
- `--bindings`: agent ごとの件数や要約だけでなく、完全な routing rules を含めます

### `agents add [name]`

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し可）
- `--non-interactive`
- `--json`

注:

- 明示的な add flags を 1 つでも渡すと、コマンドは non-interactive path に切り替わります。
- non-interactive mode では、agent 名と `--workspace` の両方が必要です。
- `main` は予約済みで、新しい agent id としては使用できません。

### `agents bindings`

オプション:

- `--agent <id>`
- `--json`

### `agents bind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルト agent）
- `--bind <channel[:accountId]>`（繰り返し可）
- `--json`

### `agents unbind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルト agent）
- `--bind <channel[:accountId]>`（繰り返し可）
- `--all`
- `--json`

### `agents delete <id>`

オプション:

- `--force`
- `--json`

注:

- `main` は削除できません。
- `--force` がない場合は、対話式の確認が必要です。
- Workspace、agent state、session transcript directories は完全削除されず、Trash に移動されます。

## Identity ファイル

各 agent workspace には、workspace root に `IDENTITY.md` を含められます。

- 例のパス: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` は workspace root（または明示的な `--identity-file`）から読み取ります

avatar path は workspace root からの相対パスとして解決されます。

## identity を設定する

`set-identity` は `agents.list[].identity` に以下の fields を書き込みます。

- `name`
- `theme`
- `emoji`
- `avatar`（workspace-relative path、http(s) URL、または data URI）

オプション:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注:

- 対象 agent の選択には `--agent` または `--workspace` を使用できます。
- `--workspace` に依存していて複数の agents がその workspace を共有している場合、このコマンドは失敗し、`--agent` を渡すよう求められます。
- 明示的な identity fields が指定されていない場合、このコマンドは `IDENTITY.md` から identity data を読み取ります。

`IDENTITY.md` から読み込む:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

fields を明示的に上書きする:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Config の例:

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
