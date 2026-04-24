---
read_when:
    - 複数の分離されたエージェント（ワークスペース + ルーティング + 認証）が必要な場合
summary: '`openclaw agents` のCLIリファレンス（list/add/delete/bindings/bind/unbind/set identity）'
title: エージェント
x-i18n:
    generated_at: "2026-04-24T04:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

分離されたエージェント（ワークスペース + 認証 + ルーティング）を管理します。

関連:

- マルチエージェントルーティング: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)
- エージェントワークスペース: [Agent workspace](/ja-JP/concepts/agent-workspace)
- Skills可視性設定: [Skills config](/ja-JP/tools/skills-config)

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

受信チャネルトラフィックを特定のエージェントに固定するには、ルーティングバインディングを使用します。

エージェントごとに表示されるSkillsも変えたい場合は、`openclaw.json`で
`agents.defaults.skills`と`agents.list[].skills`を設定してください。詳細は
[Skills config](/ja-JP/tools/skills-config)および
[Configuration Reference](/ja-JP/gateway/config-agents#agents-defaults-skills)を参照してください。

バインディングを一覧表示するには:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

バインディングを追加するには:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`（`--bind <channel>`）を省略した場合、OpenClawは利用可能な場合にチャネルのデフォルト値とPluginセットアップフックからそれを解決します。

`bind`または`unbind`で`--agent`を省略した場合、OpenClawは現在のデフォルトエージェントを対象にします。

### バインディングスコープの動作

- `accountId`なしのバインディングは、チャネルのデフォルトアカウントにのみ一致します。
- `accountId: "*"`はチャネル全体のフォールバック（すべてのアカウント）であり、明示的なアカウントバインディングより具体性が低くなります。
- 同じエージェントに対して`accountId`なしの一致するチャネルバインディングがすでに存在し、後から明示的または解決済みの`accountId`でバインドした場合、OpenClawは重複を追加する代わりに既存のバインディングをその場でアップグレードします。

例:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

アップグレード後、そのバインディングのルーティングは`telegram:ops`にスコープされます。デフォルトアカウントのルーティングも必要な場合は、明示的に追加してください（たとえば`--bind telegram:default`）。

バインディングを削除するには:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`は`--all`または1つ以上の`--bind`値のいずれかを受け付けます。両方は指定できません。

## コマンド一覧

### `agents`

サブコマンドなしで`openclaw agents`を実行することは、`openclaw agents list`と同等です。

### `agents list`

オプション:

- `--json`
- `--bindings`: エージェントごとの件数/要約だけでなく、完全なルーティングルールを含める

### `agents add [name]`

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し可能）
- `--non-interactive`
- `--json`

注意:

- 明示的なaddフラグを1つでも渡すと、コマンドは非対話パスに切り替わります。
- 非対話モードでは、エージェント名と`--workspace`の両方が必要です。
- `main`は予約済みであり、新しいエージェントIDとして使用できません。

### `agents bindings`

オプション:

- `--agent <id>`
- `--json`

### `agents bind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し可能）
- `--json`

### `agents unbind`

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し可能）
- `--all`
- `--json`

### `agents delete <id>`

オプション:

- `--force`
- `--json`

注意:

- `main`は削除できません。
- `--force`なしでは、対話的な確認が必要です。
- ワークスペース、エージェント状態、セッショントランスクリプトのディレクトリは完全削除されず、Trashに移動されます。

## IDENTITYファイル

各エージェントワークスペースには、ワークスペースルートに`IDENTITY.md`を含めることができます。

- 例のパス: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`はワークスペースルート（または明示的な`--identity-file`）から読み取ります

アバターパスはワークスペースルートからの相対パスとして解決されます。

## identityの設定

`set-identity`はフィールドを`agents.list[].identity`に書き込みます。

- `name`
- `theme`
- `emoji`
- `avatar`（ワークスペース相対パス、http(s) URL、またはdata URI）

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

- 対象エージェントの選択には`--agent`または`--workspace`を使用できます。
- `--workspace`に依存していて、複数のエージェントがそのワークスペースを共有している場合、コマンドは失敗し、`--agent`を渡すよう求められます。
- 明示的なidentityフィールドが指定されていない場合、コマンドは`IDENTITY.md`からidentityデータを読み取ります。

`IDENTITY.md`から読み込むには:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

フィールドを明示的に上書きするには:

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
