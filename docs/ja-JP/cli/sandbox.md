---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを確認する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-07-11T22:08:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

分離されたエージェント実行用のサンドボックスランタイム（Docker コンテナ、SSH ターゲット、OpenShell バックエンド）を管理します。

## コマンド

### `openclaw sandbox list`

サンドボックスランタイムを、ステータス、バックエンド、設定の一致状況、経過時間、アイドル時間、関連付けられたセッション／エージェントとともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # ブラウザーコンテナのみ
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

サンドボックスランタイムを削除し、現在の設定で強制的に再作成します。ランタイムは、次にエージェントが使用されたときに自動的に再作成されます。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # agent:mybot:* サブセッションを含む
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # ブラウザーコンテナのみ
openclaw sandbox recreate --all --force        # 確認を省略
```

オプション：

- `--all`：すべてのサンドボックスコンテナを再作成
- `--session <key>`：この完全一致のスコープキー（`sandbox list` に表示されるもの）を持つランタイムを再作成。短縮名の展開は行わない
- `--agent <id>`：1 つのエージェントのランタイムを再作成（`agent:<id>` および `agent:<id>:*` に一致）
- `--browser`：ブラウザーコンテナのみに適用
- `--force`：確認プロンプトを省略

`--all`、`--session`、`--agent` のいずれか 1 つだけを指定してください。

`ssh` および OpenShell の `remote` では、再作成は Docker の場合よりも重要です。初回シード後はリモートワークスペースが正規のワークスペースとなり、`recreate` は選択したスコープの正規リモートワークスペースを削除します。次回の実行時に、現在のローカルワークスペースから再シードされます。

### `openclaw sandbox explain`

有効なサンドボックスのモード／スコープ／ワークスペースアクセス、サンドボックスのツールポリシー、および昇格ツールのゲートを調査します（修正用の設定キーパスを含む）。

レポートでは、`workspaceRoot` を設定済みのサンドボックスルートとして維持し、有効なホストワークスペース、バックエンドランタイムの作業ディレクトリ、Docker マウントテーブルを個別に表示します。`workspaceAccess: "rw"` の場合、有効なホストワークスペースは `workspaceRoot` 配下のディレクトリではなく、エージェントワークスペースです。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session` とは異なり、これは短いセッション名（例：`main`）を受け入れ、解決されたエージェントに対して展開します。

## 再作成が必要な理由

サンドボックス設定を更新しても、実行中のコンテナには反映されません。既存のランタイムは古い設定を保持し、アイドル状態のランタイムは `prune.idleHours`（デフォルトは 24 時間）を経過した後にのみ削除されます。定期的に使用されるエージェントでは、古いランタイムが無期限に維持される可能性があります。`openclaw sandbox recreate` は古いランタイムを削除し、次回の使用時に現在の設定から再構築されるようにします。

<Tip>
バックエンド固有の手動クリーンアップよりも、`openclaw sandbox recreate` を使用してください。これは Gateway のランタイムレジストリを使用し、スコープまたはセッションキーが変更された場合の不整合を回避します。
</Tip>

## 一般的な実行契機

| 変更                                                                                                                                                           | コマンド                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker イメージの更新（`agents.defaults.sandbox.docker.image`）                                                                                                | `openclaw sandbox recreate --all`                                   |
| サンドボックス設定（`agents.defaults.sandbox.*`）                                                                                                             | `openclaw sandbox recreate --all`                                   |
| SSH ターゲット／認証（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell のソース／ポリシー／モード（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                  | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（または 1 つのエージェントには `--agent <id>`） |

<Note>
ランタイムは、次にエージェントが使用されたときに自動的に再作成されます。
</Note>

## レジストリの移行

サンドボックスランタイムのメタデータは、共有 SQLite 状態データベースに保存されます。古いインストールには、通常の読み取りでは書き換えられなくなった従来のレジストリファイルが存在する場合があります。

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` または `~/.openclaw/sandbox/browsers/` 配下にある、コンテナ／ブラウザーごとの JSON シャード

`openclaw doctor --fix` を実行して、有効な従来のエントリを SQLite に移行してください。無効な従来のファイルは隔離されるため、破損した古いレジストリによって現在のランタイムエントリが隠されることはありません。

## 設定

サンドボックス設定は、`~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（エージェントごとのオーバーライドは `agents.list[].sandbox` に設定します）。

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // オフ、メイン以外、すべて
        "backend": "docker", // docker、ssh、openshell（Plugin が提供）
        "scope": "agent", // セッション、エージェント、共有
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... その他の Docker オプション
        },
        "prune": {
          "idleHours": 24, // 24 時間アイドル状態が続いた後に自動削除
          "maxAgeDays": 7, // 7 日後に自動削除
        },
      },
    },
  },
}
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [サンドボックス化](/ja-JP/gateway/sandboxing)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [Doctor](/ja-JP/gateway/doctor)：サンドボックスのセットアップを確認します。
