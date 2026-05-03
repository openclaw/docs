---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、適用されるサンドボックスポリシーを確認する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-05-03T21:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

隔離されたエージェント実行用のサンドボックスランタイムを管理します。

## 概要

OpenClaw はセキュリティのために、隔離されたサンドボックスランタイムでエージェントを実行できます。`sandbox` コマンドは、更新後や設定変更後にそれらのランタイムを検査し、再作成するのに役立ちます。

現在、通常は次を意味します。

- Docker サンドボックスコンテナ
- `agents.defaults.sandbox.backend = "ssh"` の場合の SSH サンドボックスランタイム
- `agents.defaults.sandbox.backend = "openshell"` の場合の OpenShell サンドボックスランタイム

`ssh` と OpenShell `remote` では、Docker よりも再作成が重要です。

- 初回シード後はリモートワークスペースが正本になります
- `openclaw sandbox recreate` は、選択されたスコープのその正本リモートワークスペースを削除します
- 次回使用時に、現在のローカルワークスペースから再度シードされます

## コマンド

### `openclaw sandbox explain`

**有効な** サンドボックスモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ゲートを検査します（修正用の設定キーパス付き）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

すべてのサンドボックスランタイムを、その状態と設定とともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**出力に含まれるもの:**

- ランタイム名と状態
- バックエンド（`docker`、`openshell` など）
- 設定ラベルと、現在の設定に一致しているかどうか
- 経過時間（作成からの時間）
- アイドル時間（最後の使用からの時間）
- 関連付けられたセッション/エージェント

### `openclaw sandbox recreate`

サンドボックスランタイムを削除し、更新された設定で強制的に再作成します。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**オプション:**

- `--all`: すべてのサンドボックスコンテナを再作成します
- `--session <key>`: 特定のセッションのコンテナを再作成します
- `--agent <id>`: 特定のエージェントのコンテナを再作成します
- `--browser`: ブラウザコンテナのみを再作成します
- `--force`: 確認プロンプトをスキップします

<Note>
ランタイムは、次にエージェントが使用されたときに自動的に再作成されます。
</Note>

## ユースケース

### Docker イメージを更新した後

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### サンドボックス設定を変更した後

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### SSH ターゲットまたは SSH 認証素材を変更した後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

コアの `ssh` バックエンドでは、再作成によって SSH ターゲット上のスコープごとのリモートワークスペースルートが削除されます。次回実行時に、ローカルワークスペースから再度シードされます。

### OpenShell のソース、ポリシー、またはモードを変更した後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` モードでは、再作成によってそのスコープの正本リモートワークスペースが削除されます。次回実行時に、ローカルワークスペースから再度シードされます。

### setupCommand を変更した後

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 特定のエージェントのみ

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## なぜこれが必要か

サンドボックス設定を更新すると、次のようになります。

- 既存のランタイムは古い設定のまま実行され続けます。
- ランタイムは 24 時間非アクティブだった後にのみ刈り取られます。
- 定期的に使用されるエージェントは、古いランタイムを無期限に存続させます。

古いランタイムを強制的に削除するには、`openclaw sandbox recreate` を使用します。次に必要になったとき、現在の設定で自動的に再作成されます。

<Tip>
手動のバックエンド固有クリーンアップよりも `openclaw sandbox recreate` を優先してください。これは Gateway のランタイムレジストリを使用し、スコープやセッションキーが変わったときの不一致を避けます。
</Tip>

## レジストリ移行

OpenClaw は、サンドボックスランタイムのメタデータを、サンドボックス状態ディレクトリ配下にコンテナ/ブラウザエントリごとに 1 つの JSON シャードとして保存します。古いインストールでは、まだモノリシックなレガシーファイルが残っている場合があります。

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

通常のサンドボックスランタイム読み取りでは、これらのファイルは書き換えられません。有効なレガシーエントリをシャード化されたレジストリディレクトリに移行するには、`openclaw doctor --fix` を実行します。無効なレガシーファイルは隔離されるため、古い不正なレジストリが現在のランタイムエントリを隠すことはありません。

## 設定

サンドボックス設定は、`~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（エージェントごとの上書きは `agents.list[].sandbox` に置きます）。

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
- [Doctor](/ja-JP/gateway/doctor): サンドボックス設定を確認します。
