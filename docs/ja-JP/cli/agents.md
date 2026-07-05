---
read_when:
    - 複数の分離されたエージェント（ワークスペース + ルーティング + 認証）が必要な場合
summary: '`openclaw agents` の CLI リファレンス（list/add/delete/bindings/bind/unbind/set identity）'
title: エージェント
x-i18n:
    generated_at: "2026-07-05T11:07:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

分離されたエージェント（ワークスペース + 認証 + ルーティング）を管理します。サブコマンドなしで `openclaw agents` を実行することは、`openclaw agents list` と同等です。

関連:

- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [Skills 設定](/ja-JP/tools/skills-config): skill の可視性設定。

## 例

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

## コマンド一覧

### `agents list`

オプション: `--json`、`--bindings`（エージェントごとの件数や概要だけでなく、完全なルーティングルールを含めます）。

### `agents add [name]`

オプション: `--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（繰り返し指定可）、`--non-interactive`、`--json`。

- 明示的な追加フラグを渡すと、コマンドは非対話パスに切り替わります。
- 非対話モードでは、エージェント名と `--workspace` の両方が必要です。
- `main` は予約済みで、新しいエージェント ID としては使用できません。
- 対話モードでは、認証はポータブルな静的認証情報（`api_key` と静的な `token` プロファイル）のみをコピーしてシードします。ただし、認証情報が `copyToAgents: false` で除外している場合はコピーされません。OAuth リフレッシュトークンプロファイルは、プロバイダーが `copyToAgents: true` で明示的に許可しない限りコピーされません。コピーがない場合、OAuth は実際の `main` エージェントストアからの読み取り継承を通じてのみ利用できます。設定済みのデフォルトエージェントが `main` でない場合は、新しいエージェントで OAuth プロファイルに別途サインインしてください。

### `agents bindings`

オプション: `--agent <id>`、`--json`。

### `agents bind`

オプション: `--agent <id>`（現在のデフォルトエージェントが既定）、`--bind <channel[:accountId]>`（繰り返し指定可）、`--json`。

### `agents unbind`

オプション: `--agent <id>`（現在のデフォルトエージェントが既定）、`--bind <channel[:accountId]>`（繰り返し指定可）、`--all`、`--json`。`--all`、または 1 つ以上の `--bind` 値のどちらか一方のみを受け付けます。両方は指定できません。

### `agents set-identity`

オプション: `--agent <id>`、`--workspace <dir>`、`--identity-file <path>`、`--from-identity`、`--name <name>`、`--theme <theme>`、`--emoji <emoji>`、`--avatar <value>`、`--json`。下の [アイデンティティを設定](#set-identity) を参照してください。

### `agents delete <id>`

オプション: `--force`、`--json`。

- `main` は削除できません。
- `--force` なしでは、対話的な確認が必要です（非 TTY セッションでは失敗します。`--force` を付けて再実行してください）。
- ワークスペース、エージェント状態、セッショントランスクリプトディレクトリは完全削除されず、ゴミ箱へ移動されます。
- Gateway に到達できる場合、削除は Gateway 経由でルーティングされるため、設定とセッションストアのクリーンアップはランタイムトラフィックと同じ writer を共有します。Gateway に到達できない場合、CLI はオフラインのローカルパスへフォールバックします。
- 別のエージェントのワークスペースが同じパス、このワークスペース内、またはこのワークスペースを含む場合、ワークスペースは保持され、`--json` は `workspaceRetained`、`workspaceRetainedReason`、`workspaceSharedWith` を報告します。

## ルーティングバインディング

ルーティングバインディングを使用して、受信チャネルのトラフィックを特定のエージェントに固定します。

エージェントごとに表示される Skills も変えたい場合は、`openclaw.json` の `agents.defaults.skills` と `agents.list[].skills` を設定してください。[Skills 設定](/ja-JP/tools/skills-config) と [設定リファレンス](/ja-JP/gateway/config-agents#agentsdefaultsskills) を参照してください。

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

エージェント作成時にバインディングを追加することもできます:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

`accountId`（`--bind <channel>`）を省略すると、OpenClaw は Plugin セットアップフック、強制アカウントバインディング、またはチャネルの設定済みアカウント数から解決します。

`bind` または `unbind` で `--agent` を省略すると、OpenClaw は現在のデフォルトエージェントを対象にします。

### `--bind` 形式

| 形式                         | 意味                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | チャネル上のすべてのアカウントに一致します。                                                       |
| `--bind <channel>:<account>` | 1 つのアカウントに一致します。                                                                     |
| `--bind <channel>`           | CLI が Plugin 固有のアカウントスコープを安全に解決できる場合を除き、デフォルトアカウントのみに一致します。 |

### バインディングスコープの動作

- `accountId` なしで保存されたバインディングは、チャネルのデフォルトアカウントのみに一致します。
- `accountId: "*"` はチャネル全体のフォールバック（すべてのアカウント）であり、明示的なアカウントバインディングより具体性が低くなります。
- 同じエージェントに `accountId` なしの一致するチャネルバインディングがすでにあり、後から明示的または解決済みの `accountId` でバインドすると、OpenClaw は重複を追加するのではなく、その既存バインディングをその場でアップグレードします。

例:

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

アップグレード後、そのバインディングのルーティングは `telegram:alerts` にスコープされます。デフォルトアカウントのルーティングも必要な場合は、明示的に追加してください（例: `--bind telegram:default`）。

バインディングを削除します:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## アイデンティティファイル

各エージェントワークスペースは、ワークスペースルートに `IDENTITY.md` を含めることができます:

- 例のパス: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` は、ワークスペースルート（または明示的な `--identity-file`）から読み取ります。

アバターパスはワークスペースルートからの相対として解決され、シンボリックリンク経由であってもそこから抜け出すことはできません。

## アイデンティティを設定

`set-identity` は `agents.list[].identity` にフィールドを書き込みます: `name`、`theme`、`emoji`、`avatar`（ワークスペース相対パス、http(s) URL、または data URI）。

- `--agent` または `--workspace` が対象エージェントを選択します。`--workspace` が複数のエージェントに一致する場合、コマンドは失敗し、`--agent` を渡すよう求めます。
- ローカルのワークスペース相対アバター画像ファイルは 2 MB に制限されます。HTTP(S) URL と `data:` URI は、ローカルファイルサイズ制限の対象としてチェックされません。
- 明示的なアイデンティティフィールドが指定されていない場合、コマンドは `IDENTITY.md` からアイデンティティデータを読み取ります。

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
