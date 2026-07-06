---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを検査する
title: サンドボックスCLI
x-i18n:
    generated_at: "2026-07-06T10:48:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

分離された agent 実行のためのサンドボックスランタイムを管理します: Docker コンテナ、SSH ターゲット、または OpenShell バックエンド。

## コマンド

### `openclaw sandbox list`

サンドボックスランタイムを、ステータス、バックエンド、設定の一致、経過時間、アイドル時間、関連付けられたセッション/agent とともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

サンドボックスランタイムを削除し、現在の設定で再作成を強制します。ランタイムは次に agent が使用されるときに自動的に再作成されます。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

オプション:

- `--all`: すべてのサンドボックスコンテナを再作成します
- `--session <key>`: この正確なスコープキー（`sandbox list` に表示されるもの）を持つランタイムを再作成します。短縮名の展開はありません
- `--agent <id>`: 1 つの agent のランタイムを再作成します（`agent:<id>` と `agent:<id>:*` に一致）
- `--browser`: ブラウザコンテナのみに影響します
- `--force`: 確認プロンプトをスキップします

`--all`、`--session`、`--agent` のいずれか 1 つだけを渡してください。

`ssh` と OpenShell `remote` では、Docker よりも recreate が重要です。リモートワークスペースは初期シード後に正規の状態となり、`recreate` は選択したスコープの正規リモートワークスペースを削除し、次回実行時に現在のローカルワークスペースから再シードします。

### `openclaw sandbox explain`

有効なサンドボックスのモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ツールゲート（修正用の設定キーパス付き）を検査します。

レポートでは、`workspaceRoot` を設定されたサンドボックスルートとして保持し、有効なホストワークスペース、バックエンドランタイムの workdir、Docker マウントテーブルを個別に表示します。`workspaceAccess: "rw"` の場合、有効なホストワークスペースは `workspaceRoot` 配下のディレクトリではなく agent ワークスペースです。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session` とは異なり、これは短いセッション名（例: `main`）を受け付け、解決済みの agent に対して展開します。

## recreate が必要な理由

サンドボックス設定を更新しても、実行中のコンテナには影響しません。既存のランタイムは古い設定を保持し、アイドル状態のランタイムは `prune.idleHours`（デフォルト 24h）後にのみ削除されます。定期的に使用される agent では、古いランタイムが無期限に残ることがあります。`openclaw sandbox recreate` は古いランタイムを削除し、次回使用時に現在の設定から再構築されるようにします。

<Tip>
バックエンド固有の手動クリーンアップよりも `openclaw sandbox recreate` を優先してください。これは Gateway のランタイムレジストリを使用し、スコープやセッションキーが変わったときの不一致を避けます。
</Tip>

## よくあるトリガー

| 変更                                                                                                                                                           | コマンド                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker イメージの更新（`agents.defaults.sandbox.docker.image`）                                                                                                | `openclaw sandbox recreate --all`                                   |
| サンドボックス設定（`agents.defaults.sandbox.*`）                                                                                                              | `openclaw sandbox recreate --all`                                   |
| SSH ターゲット/認証（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell のソース/ポリシー/モード（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                    | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（または 1 つの agent には `--agent <id>`） |

<Note>
ランタイムは、次に agent が使用されるときに自動的に再作成されます。
</Note>

## レジストリ移行

サンドボックスランタイムのメタデータは、共有 SQLite 状態データベースに格納されます。古いインストールには、通常の読み取りでは再書き込みされなくなったレガシーレジストリファイルがある場合があります。

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` または `~/.openclaw/sandbox/browsers/` 配下のコンテナ/ブラウザごとの JSON シャード

有効なレガシーエントリを SQLite に移行するには、`openclaw doctor --fix` を実行します。無効なレガシーファイルは隔離されるため、破損した古いレジストリが現在のランタイムエントリを隠すことはありません。

## 設定

サンドボックス設定は `~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（agent ごとの上書きは `agents.list[].sandbox` に入れます）。

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
- [Agent ワークスペース](/ja-JP/concepts/agent-workspace)
- [Doctor](/ja-JP/gateway/doctor): サンドボックスのセットアップをチェックします。
