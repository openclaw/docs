---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを確認する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-04-30T05:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

分離されたエージェント実行用のサンドボックスランタイムを管理します。

## 概要

OpenClaw はセキュリティのために、分離されたサンドボックスランタイムでエージェントを実行できます。`sandbox` コマンドは、更新後や設定変更後にそれらのランタイムを検査し、再作成するのに役立ちます。

現在、通常は次を意味します。

- Docker サンドボックスコンテナ
- `agents.defaults.sandbox.backend = "ssh"` の場合の SSH サンドボックスランタイム
- `agents.defaults.sandbox.backend = "openshell"` の場合の OpenShell サンドボックスランタイム

`ssh` と OpenShell `remote` では、Docker よりも recreate が重要です。

- 初回シード後はリモートワークスペースが正本になります
- `openclaw sandbox recreate` は、選択されたスコープの正本リモートワークスペースを削除します
- 次回使用時に、現在のローカルワークスペースから再度シードされます

## コマンド

### `openclaw sandbox explain`

**有効な** サンドボックスのモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ゲートを検査します（修正用の設定キーパス付き）。

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
openclaw sandbox list --browser  # ブラウザコンテナのみを一覧表示
openclaw sandbox list --json     # JSON 出力
```

**出力に含まれるもの:**

- ランタイム名と状態
- バックエンド（`docker`、`openshell` など）
- 設定ラベルと、それが現在の設定に一致するかどうか
- 経過時間（作成からの時間）
- アイドル時間（最後の使用からの時間）
- 関連付けられたセッション/エージェント

### `openclaw sandbox recreate`

サンドボックスランタイムを削除し、更新された設定で強制的に再作成します。

```bash
openclaw sandbox recreate --all                # すべてのコンテナを再作成
openclaw sandbox recreate --session main       # 特定のセッション
openclaw sandbox recreate --agent mybot        # 特定のエージェント
openclaw sandbox recreate --browser            # ブラウザコンテナのみ
openclaw sandbox recreate --all --force        # 確認をスキップ
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

### Docker イメージを更新した後

```bash
# 新しいイメージを取得
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 新しいイメージを使用するように設定を更新
# 設定を編集: agents.defaults.sandbox.docker.image（または agents.list[].sandbox.docker.image）

# コンテナを再作成
openclaw sandbox recreate --all
```

### サンドボックス設定を変更した後

```bash
# 設定を編集: agents.defaults.sandbox.*（または agents.list[].sandbox.*）

# 新しい設定を適用するために再作成
openclaw sandbox recreate --all
```

### SSH ターゲットまたは SSH 認証素材を変更した後

```bash
# 設定を編集:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

コアの `ssh` バックエンドでは、recreate は SSH ターゲット上のスコープごとのリモートワークスペースルートを削除します。次回実行時に、ローカルワークスペースから再度シードされます。

### OpenShell のソース、ポリシー、またはモードを変更した後

```bash
# 設定を編集:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` モードでは、recreate はそのスコープの正本リモートワークスペースを削除します。次回実行時に、ローカルワークスペースから再度シードされます。

### setupCommand を変更した後

```bash
openclaw sandbox recreate --all
# または 1 つのエージェントだけ:
openclaw sandbox recreate --agent family
```

### 特定のエージェントのみ

```bash
# 1 つのエージェントのコンテナのみを更新
openclaw sandbox recreate --agent alfred
```

## これが必要な理由

サンドボックス設定を更新した場合:

- 既存のランタイムは古い設定で実行され続けます。
- ランタイムは 24 時間非アクティブになった後にのみ削除されます。
- 定期的に使用されるエージェントは、古いランタイムを無期限に維持します。

`openclaw sandbox recreate` を使用して、古いランタイムの削除を強制します。次に必要になったとき、現在の設定で自動的に再作成されます。

<Tip>
バックエンド固有の手動クリーンアップよりも `openclaw sandbox recreate` を優先してください。これは Gateway のランタイムレジストリを使用し、スコープやセッションキーが変わった場合の不一致を避けます。
</Tip>

## 設定

サンドボックス設定は、`~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（エージェントごとの上書きは `agents.list[].sandbox` に入ります）。

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off、non-main、all
        "backend": "docker", // docker、ssh、openshell
        "scope": "agent", // session、agent、shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... その他の Docker オプション
        },
        "prune": {
          "idleHours": 24, // 24 時間アイドル後に自動削除
          "maxAgeDays": 7, // 7 日後に自動削除
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
- [Doctor](/ja-JP/gateway/doctor): サンドボックス設定をチェックします。
