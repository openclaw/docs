---
read_when:
    - 複数の分離されたエージェント（ワークスペース + ルーティング + 認証）が必要な場合
summary: '`openclaw agents` の CLI リファレンス（list/add/delete/bindings/bind/unbind/set identity）'
title: エージェント
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

分離されたエージェント（ワークスペース + 認証 + ルーティング）を管理します。

関連:

- マルチエージェントルーティング: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)
- Agent workspace: [Agent workspace](/ja-JP/concepts/agent-workspace)
- Skills の可視性設定: [Skills config](/ja-JP/tools/skills-config)

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

## ルーティングバインディング

受信チャネルのトラフィックを特定のエージェントに固定するには、ルーティングバインディングを使用します。

エージェントごとに見える Skills も変えたい場合は、
`openclaw.json` の `agents.defaults.skills` と `agents.list[].skills` を設定してください。  
[Skills config](/ja-JP/tools/skills-config) と
[Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

バインディングを一覧表示:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

バインディングを追加:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`（`--bind <channel>`）を省略すると、利用可能な場合は OpenClaw がチャネルのデフォルト値と Plugin のセットアップフックからそれを解決します。

`bind` または `unbind` で `--agent` を省略すると、OpenClaw は現在のデフォルトエージェントを対象にします。

### バインディングスコープの動作

- `accountId` なしのバインディングは、チャネルのデフォルトアカウントのみに一致します。
- `accountId: "*"` はチャネル全体のフォールバック（全アカウント）であり、明示的なアカウントバインディングより具体性が低くなります。
- 同じエージェントに、すでに `accountId` なしの一致するチャネルバインディングがある状態で、後から明示的または解決済みの `accountId` を付けてバインドすると、OpenClaw は重複を追加する代わりに、その既存バインディングをその場でアップグレードします。

例:

```bash
# 初期のチャネルのみのバインディング
openclaw agents bind --agent work --bind telegram

# 後でアカウントスコープのバインディングにアップグレード
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後、そのバインディングのルーティングは `telegram:ops` にスコープされます。デフォルトアカウントのルーティングも必要な場合は、明示的に追加してください（たとえば `--bind telegram:default`）。

バインディングを削除:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` は `--all` か、1つ以上の `--bind` 値のどちらか一方のみを受け付けます。両方は指定できません。

## コマンドサーフェス

### `agents`

サブコマンドなしで `openclaw agents` を実行すると、`openclaw agents list` と同等です。

### `agents list`

オプション:

- `--json`
- `--bindings`: エージェントごとの件数/要約だけでなく、完全なルーティングルールを含める

### `agents add [name]`

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--non-interactive`
- `--json`

注意:

- 明示的な add フラグを1つでも渡すと、そのコマンドは非対話モードになります。
- 非対話モードでは、エージェント名と `--workspace` の両方が必要です。
- `main` は予約済みであり、新しいエージェント id としては使用できません。

### `agents bindings`

オプション:

- `--agent <id>`
- `--json`

### `agents bind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--json`

### `agents unbind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--all`
- `--json`

### `agents delete <id>`

オプション:

- `--force`
- `--json`

注意:

- `main` は削除できません。
- `--force` がない場合は、対話的な確認が必要です。
- ワークスペース、エージェント状態、セッショントランスクリプトのディレクトリは完全削除されず、Trash に移動されます。
- 別のエージェントのワークスペースが同じパスである場合、そのワークスペース内にある場合、またはそのワークスペースを含んでいる場合、
  そのワークスペースは保持され、`--json` では `workspaceRetained`、
  `workspaceRetainedReason`、`workspaceSharedWith` が報告されます。

## IDENTITY ファイル

各エージェントワークスペースには、ワークスペースルートに `IDENTITY.md` を含めることができます。

- パス例: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` はワークスペースルートから読み取ります（または明示的な `--identity-file`）

アバターパスはワークスペースルート基準で解決されます。

## IDENTITY を設定

`set-identity` はフィールドを `agents.list[].identity` に書き込みます:

- `name`
- `theme`
- `emoji`
- `avatar`（ワークスペース相対パス、http(s) URL、または data URI）

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

注意:

- 対象エージェントの選択には `--agent` または `--workspace` を使用できます。
- `--workspace` に依存していて複数のエージェントがそのワークスペースを共有している場合、コマンドは失敗し、`--agent` を渡すよう求められます。
- 明示的な identity フィールドが指定されていない場合、コマンドは `IDENTITY.md` から identity データを読み取ります。

`IDENTITY.md` から読み込む:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

フィールドを明示的に上書きする:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

設定例:

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

## 関連

- [CLI reference](/ja-JP/cli)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Agent workspace](/ja-JP/concepts/agent-workspace)
