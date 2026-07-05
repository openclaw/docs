---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを調査する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-07-05T11:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e05563570bae3a93a41c85a5f6c0ce6fcdcf20ce9c391b051561c1eb7141d382
    source_path: cli/sandbox.md
    workflow: 16
---

分離されたエージェント実行用のサンドボックスランタイムを管理します: Docker コンテナ、SSH ターゲット、または OpenShell バックエンド。

## コマンド

### `openclaw sandbox list`

サンドボックスランタイムを、ステータス、バックエンド、設定一致、経過時間、アイドル時間、関連付けられたセッション/エージェントとともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

サンドボックスランタイムを削除し、現在の設定で再作成されるようにします。ランタイムは、次回エージェントが使用されたときに自動的に再作成されます。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

オプション:

- `--all`: すべてのサンドボックスコンテナを再作成します
- `--session <key>`: この正確なスコープキー（`sandbox list` で表示されるもの）を持つランタイムを再作成します。短縮名の展開は行いません
- `--agent <id>`: 1 つのエージェントのランタイムを再作成します（`agent:<id>` と `agent:<id>:*` に一致）
- `--browser`: ブラウザーコンテナのみに影響します
- `--force`: 確認プロンプトをスキップします

`--all`、`--session`、`--agent` のうち正確に 1 つだけを渡してください。

`ssh` と OpenShell `remote` では、再作成は Docker よりも重要です。リモートワークスペースは初回シード後に正規の状態となり、`recreate` は選択されたスコープのその正規リモートワークスペースを削除し、次回実行時に現在のローカルワークスペースから再シードします。

### `openclaw sandbox explain`

有効なサンドボックスモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ツールゲート（修正用の設定キーパス付き）を調査します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session` とは異なり、これは短いセッション名（例: `main`）を受け付け、解決されたエージェントに対して展開します。

## 再作成が必要な理由

サンドボックス設定を更新しても、実行中のコンテナには影響しません。既存のランタイムは古い設定を保持し、アイドル状態のランタイムは `prune.idleHours`（デフォルト 24h）の後にのみ削除されます。定期的に使用されるエージェントでは、古いランタイムが無期限に存続することがあります。`openclaw sandbox recreate` は古いランタイムを削除し、次回使用時に現在の設定から再構築されるようにします。

<Tip>
バックエンド固有の手動クリーンアップよりも `openclaw sandbox recreate` を優先してください。これは Gateway のランタイムレジストリを使用し、スコープやセッションキーが変わったときの不一致を避けます。
</Tip>

## 一般的なトリガー

| 変更                                                                                                                                                           | コマンド                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker イメージ更新（`agents.defaults.sandbox.docker.image`）                                                                                                  | `openclaw sandbox recreate --all`                                   |
| サンドボックス設定（`agents.defaults.sandbox.*`）                                                                                                              | `openclaw sandbox recreate --all`                                   |
| SSH ターゲット/認証（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell ソース/ポリシー/モード（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                       | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（または 1 つのエージェントには `--agent <id>`） |

<Note>
ランタイムは、次回エージェントが使用されたときに自動的に再作成されます。
</Note>

## レジストリ移行

サンドボックスランタイムのメタデータは共有 SQLite 状態データベースに保存されます。古いインストールには、通常の読み取りではもう書き換えられないレガシーレジストリファイルが残っている場合があります。

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` または `~/.openclaw/sandbox/browsers/` 配下のコンテナ/ブラウザーごとの JSON シャード

有効なレガシーエントリを SQLite に移行するには、`openclaw doctor --fix` を実行します。破損した古いレジストリが現在のランタイムエントリを隠せないように、無効なレガシーファイルは隔離されます。

## 設定

サンドボックス設定は `~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（エージェントごとの上書きは `agents.list[].sandbox` に入ります）。

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // auto-prune after 24h idle
          "maxAgeDays": 7, // auto-prune after 7 days
        },
      },
    },
  },
}
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [サンドボックス化](/ja-JP/gateway/sandboxing)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [Doctor](/ja-JP/gateway/doctor): サンドボックスのセットアップを確認します。
