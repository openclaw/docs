---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを確認する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-06-27T11:01:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

分離されたエージェント実行用のサンドボックスランタイムを管理します。

## 概要

OpenClaw は、セキュリティのためにエージェントを分離されたサンドボックスランタイム内で実行できます。`sandbox` コマンドは、更新後や設定変更後にそれらのランタイムを検査し、再作成するのに役立ちます。

現在、通常これは次を意味します。

- Docker サンドボックスコンテナ
- `agents.defaults.sandbox.backend = "ssh"` の場合の SSH サンドボックスランタイム
- `agents.defaults.sandbox.backend = "openshell"` の場合の OpenShell サンドボックスランタイム

`ssh` と OpenShell `remote` では、Docker よりも再作成が重要です。

- 初回シード後は、リモートワークスペースが正準です
- `openclaw sandbox recreate` は、選択したスコープの正準リモートワークスペースを削除します
- 次回使用時に、現在のローカルワークスペースから再度シードされます

## コマンド

### `openclaw sandbox explain`

**有効な**サンドボックスのモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ゲートを検査します（修正用の設定キー パス付き）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

すべてのサンドボックスランタイムを、ステータスと設定とともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**出力に含まれるもの:**

- ランタイム名とステータス
- バックエンド（`docker`、`openshell` など）
- 設定ラベルと、それが現在の設定と一致するかどうか
- 経過時間（作成からの時間）
- アイドル時間（最後の使用からの時間）
- 関連付けられたセッション/エージェント

### `openclaw sandbox recreate`

更新された設定で強制的に再作成するために、サンドボックスランタイムを削除します。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**オプション:**

- `--all`: すべてのサンドボックスコンテナを再作成します
- `--session <key>`: 特定のセッション用のコンテナを再作成します
- `--agent <id>`: 特定のエージェント用のコンテナを再作成します
- `--browser`: ブラウザコンテナのみを再作成します
- `--force`: 確認プロンプトをスキップします

<Note>
ランタイムは、次にエージェントが使用されたときに自動的に再作成されます。
</Note>

## ユースケース

### Docker イメージの更新後

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### サンドボックス設定の変更後

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### SSH ターゲットまたは SSH 認証素材の変更後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

コアの `ssh` バックエンドでは、再作成により SSH ターゲット上のスコープごとのリモートワークスペースルートが削除されます。次回実行時に、ローカルワークスペースから再度シードされます。

### OpenShell のソース、ポリシー、モードの変更後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` モードでは、再作成によりそのスコープの正準リモートワークスペースが削除されます。次回実行時に、ローカルワークスペースから再度シードされます。

### setupCommand の変更後

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 特定のエージェントのみの場合

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## これが必要な理由

サンドボックス設定を更新すると、次のようになります。

- 既存のランタイムは古い設定のまま実行を続けます。
- ランタイムは 24 時間非アクティブな場合にのみ整理されます。
- 定期的に使用されるエージェントは、古いランタイムを無期限に維持します。

`openclaw sandbox recreate` を使用して、古いランタイムを強制的に削除します。次に必要になったとき、現在の設定で自動的に再作成されます。

<Tip>
手動のバックエンド固有クリーンアップよりも `openclaw sandbox recreate` を優先してください。これは Gateway のランタイムレジストリを使用し、スコープやセッションキーが変わった場合の不一致を避けます。
</Tip>

## レジストリ移行

OpenClaw は、サンドボックスランタイムのメタデータを共有 SQLite 状態データベースに保存します。古いインストールには、従来のサンドボックスレジストリファイルがまだ残っている場合があります。

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

一部のアップグレードでは、`~/.openclaw/sandbox/containers/` または `~/.openclaw/sandbox/browsers/` の下に、コンテナ/ブラウザごとに 1 つの JSON シャードが存在する場合もあります。通常のサンドボックスランタイム読み取りでは、これらの従来ソースは書き換えられません。有効な従来エントリを SQLite に移行するには、`openclaw doctor --fix` を実行してください。無効な従来ファイルは隔離されるため、古い不正なレジストリ 1 つが現在のランタイムエントリを隠すことはありません。

## 設定

サンドボックス設定は、`agents.defaults.sandbox` の下の `~/.openclaw/openclaw.json` にあります（エージェントごとの上書きは `agents.list[].sandbox` に入ります）。

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
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
- [Doctor](/ja-JP/gateway/doctor): サンドボックスのセットアップをチェックします。
