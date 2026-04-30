---
read_when:
    - 複数の分離されたエージェントが必要な場合（ワークスペース + ルーティング + 認証）
summary: '`openclaw agents` の CLI リファレンス (list/add/delete/bindings/bind/unbind/set identity)'
title: エージェント
x-i18n:
    generated_at: "2026-04-30T05:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

分離されたエージェント（ワークスペース + 認証 + ルーティング）を管理します。

関連:

- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [Skills 設定](/ja-JP/tools/skills-config): skill の表示設定。

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

ルーティングバインディングを使うと、受信チャネルのトラフィックを特定のエージェントに固定できます。

エージェントごとに表示される skill も変えたい場合は、`openclaw.json` で `agents.defaults.skills` と `agents.list[].skills` を設定します。[Skills 設定](/ja-JP/tools/skills-config) と [設定リファレンス](/ja-JP/gateway/config-agents#agents-defaults-skills) を参照してください。

バインディングを一覧表示します:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

バインディングを追加します:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`（`--bind <channel>`）を省略すると、利用可能な場合、OpenClaw はチャネルのデフォルトと Plugin セットアップフックからそれを解決します。

`bind` または `unbind` で `--agent` を省略すると、OpenClaw は現在のデフォルトエージェントを対象にします。

### バインディングスコープの動作

- `accountId` なしのバインディングは、チャネルのデフォルトアカウントのみに一致します。
- `accountId: "*"` はチャネル全体のフォールバック（すべてのアカウント）であり、明示的なアカウントバインディングよりも具体性が低くなります。
- 同じエージェントに `accountId` なしの一致するチャネルバインディングがすでにあり、後で明示的または解決済みの `accountId` を使ってバインドした場合、OpenClaw は重複を追加する代わりに、その既存のバインディングをその場でアップグレードします。

例:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後、そのバインディングのルーティングは `telegram:ops` にスコープされます。デフォルトアカウントのルーティングも必要な場合は、明示的に追加してください（例: `--bind telegram:default`）。

バインディングを削除します:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` は `--all`、または 1 つ以上の `--bind` 値のいずれかを受け付けますが、両方は受け付けません。

## コマンドサーフェス

### `agents`

サブコマンドなしで `openclaw agents` を実行することは、`openclaw agents list` と同等です。

### `agents list`

オプション:

- `--json`
- `--bindings`: エージェントごとの件数や概要だけでなく、完全なルーティングルールを含めます

### `agents add [name]`

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し指定可能）
- `--non-interactive`
- `--json`

注記:

- 明示的な追加フラグを渡すと、コマンドは非対話パスに切り替わります。
- 非対話モードでは、エージェント名と `--workspace` の両方が必要です。
- `main` は予約済みであり、新しいエージェント ID としては使用できません。
- 対話モードでは、認証シードはポータブルな静的プロファイルのみをコピーします
  （デフォルトでは `api_key` と静的な `token`）。OAuth 更新トークンプロファイルは、
  実際の `main` エージェントストアからの読み取り継承によってのみ引き続き利用できます。
  設定されたデフォルトエージェントが `main` ではない場合、新しいエージェントで OAuth
  プロファイルに個別にサインインしてください。

### `agents bindings`

オプション:

- `--agent <id>`
- `--json`

### `agents bind`

オプション:

- `--agent <id>`（現在のデフォルトエージェントがデフォルト）
- `--bind <channel[:accountId]>`（繰り返し指定可能）
- `--json`

### `agents unbind`

オプション:

- `--agent <id>`（現在のデフォルトエージェントがデフォルト）
- `--bind <channel[:accountId]>`（繰り返し指定可能）
- `--all`
- `--json`

### `agents delete <id>`

オプション:

- `--force`
- `--json`

注記:

- `main` は削除できません。
- `--force` なしでは、対話的な確認が必要です。
- ワークスペース、エージェント状態、セッショントランスクリプトディレクトリは完全削除されず、ゴミ箱に移動されます。
- 別のエージェントのワークスペースが同じパスである、このワークスペース内にある、またはこのワークスペースを含む場合、
  ワークスペースは保持され、`--json` は `workspaceRetained`、
  `workspaceRetainedReason`、`workspaceSharedWith` を報告します。

## ID ファイル

各エージェントワークスペースは、ワークスペースルートに `IDENTITY.md` を含めることができます:

- パス例: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` はワークスペースルート（または明示的な `--identity-file`）から読み取ります

アバターパスはワークスペースルートからの相対パスとして解決されます。

## ID を設定する

`set-identity` はフィールドを `agents.list[].identity` に書き込みます:

- `name`
- `theme`
- `emoji`
- `avatar`（ワークスペース相対パス、http(s) URL、またはデータ URI）

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

注記:

- `--agent` または `--workspace` を使って対象エージェントを選択できます。
- `--workspace` に依存していて、複数のエージェントがそのワークスペースを共有している場合、コマンドは失敗し、`--agent` を渡すよう求めます。
- 明示的な ID フィールドが指定されていない場合、コマンドは `IDENTITY.md` から ID データを読み取ります。

`IDENTITY.md` から読み込みます:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

フィールドを明示的に上書きします:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

設定サンプル:

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

- [CLI リファレンス](/ja-JP/cli)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
