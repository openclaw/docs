---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: サンドボックスランタイムを管理し、有効なサンドボックスポリシーを確認する
title: サンドボックス CLI
x-i18n:
    generated_at: "2026-04-24T04:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

分離されたエージェント実行のためのサンドボックスランタイムを管理します。

## 概要

OpenClaw は、セキュリティのために分離されたサンドボックスランタイム内でエージェントを実行できます。`sandbox` コマンドは、アップデートや設定変更後にそれらのランタイムを確認し、再作成するのに役立ちます。

現在、通常これに該当するのは次のとおりです。

- Docker サンドボックスコンテナ
- `agents.defaults.sandbox.backend = "ssh"` のときの SSH サンドボックスランタイム
- `agents.defaults.sandbox.backend = "openshell"` のときの OpenShell サンドボックスランタイム

`ssh` と OpenShell の `remote` では、Docker よりも再作成が重要です。

- 初回シード後はリモートワークスペースが正本になります
- `openclaw sandbox recreate` は、選択したスコープのその正本リモートワークスペースを削除します
- 次回使用時に、現在のローカルワークスペースから再度シードされます

## コマンド

### `openclaw sandbox explain`

**有効な**サンドボックスモード/スコープ/ワークスペースアクセス、サンドボックスツールポリシー、昇格ゲートを確認します（修正用設定キーパス付き）。

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
openclaw sandbox list --browser  # ブラウザーコンテナのみ一覧表示
openclaw sandbox list --json     # JSON 出力
```

**出力に含まれる内容:**

- ランタイム名と状態
- バックエンド（`docker`、`openshell` など）
- 設定ラベルと、現在の設定に一致するかどうか
- 経過時間（作成からの時間）
- アイドル時間（最終使用からの時間）
- 関連するセッション/エージェント

### `openclaw sandbox recreate`

更新された設定で再作成を強制するために、サンドボックスランタイムを削除します。

```bash
openclaw sandbox recreate --all                # すべてのコンテナを再作成
openclaw sandbox recreate --session main       # 特定のセッション
openclaw sandbox recreate --agent mybot        # 特定のエージェント
openclaw sandbox recreate --browser            # ブラウザーコンテナのみ
openclaw sandbox recreate --all --force        # 確認をスキップ
```

**オプション:**

- `--all`: すべてのサンドボックスコンテナを再作成
- `--session <key>`: 特定のセッションのコンテナを再作成
- `--agent <id>`: 特定のエージェントのコンテナを再作成
- `--browser`: ブラウザーコンテナのみ再作成
- `--force`: 確認プロンプトをスキップ

**重要:** ランタイムは、次回そのエージェントが使われるときに自動的に再作成されます。

## 使用例

### Docker イメージを更新した後

```bash
# 新しいイメージを pull
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 新しいイメージを使うよう設定を更新
# 設定を編集: agents.defaults.sandbox.docker.image (または agents.list[].sandbox.docker.image)

# コンテナを再作成
openclaw sandbox recreate --all
```

### サンドボックス設定を変更した後

```bash
# 設定を編集: agents.defaults.sandbox.* (または agents.list[].sandbox.*)

# 新しい設定を適用するため再作成
openclaw sandbox recreate --all
```

### SSH ターゲットまたは SSH 認証情報を変更した後

```bash
# 設定を編集:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

コアの `ssh` バックエンドでは、再作成により SSH ターゲット上のスコープごとのリモートワークスペースルートが削除されます。次回実行時にローカルワークスペースから再度シードされます。

### OpenShell の source、policy、または mode を変更した後

```bash
# 設定を編集:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell の `remote` モードでは、再作成によりそのスコープの正本リモートワークスペースが削除されます。次回実行時にローカルワークスペースから再度シードされます。

### setupCommand を変更した後

```bash
openclaw sandbox recreate --all
# または 1 つのエージェントだけ:
openclaw sandbox recreate --agent family
```

### 特定のエージェントのみ対象にする

```bash
# 1 つのエージェントのコンテナだけを更新
openclaw sandbox recreate --agent alfred
```

## なぜこれが必要なのか？

**問題:** サンドボックス設定を更新しても:

- 既存のランタイムは古い設定のまま動き続ける
- ランタイムは 24 時間非アクティブになるまで削除されない
- 定期的に使われるエージェントは古いランタイムを無期限に保持し続ける

**解決策:** `openclaw sandbox recreate` を使って古いランタイムを強制的に削除します。次回必要になったときに、現在の設定で自動的に再作成されます。

ヒント: 手動でバックエンド固有のクリーンアップを行うより、`openclaw sandbox recreate` を優先してください。
これは Gateway のランタイムレジストリを使用するため、スコープ/セッションキーが変わったときの不整合を回避できます。

## 設定

サンドボックス設定は `~/.openclaw/openclaw.json` の `agents.defaults.sandbox` にあります（エージェントごとの上書きは `agents.list[].sandbox` に置きます）。

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
- [Doctor](/ja-JP/gateway/doctor) — サンドボックス設定を確認します
