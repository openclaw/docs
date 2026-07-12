---
read_when:
    - Docker で OpenClaw を頻繁に実行し、日常的なコマンドを短くしたい場合
    - ダッシュボード、ログ、トークン設定、ペアリングフロー用のヘルパーレイヤーが必要な場合
summary: Docker ベースの OpenClaw インストール向け ClawDock シェルヘルパー
title: ClawDock
x-i18n:
    generated_at: "2026-07-11T22:18:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock は、Docker ベースの OpenClaw インストール向けの小さなシェルヘルパーレイヤーです。

長い `docker compose ...` 呼び出しの代わりに、`clawdock-start`、`clawdock-dashboard`、`clawdock-fix-token` などの短いコマンドを使用できます。

Docker をまだセットアップしていない場合は、[Docker](/ja-JP/install/docker) から始めてください。

## インストール

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前に `scripts/shell-helpers/clawdock-helpers.sh` から ClawDock をインストールした場合は、現在の `scripts/clawdock/clawdock-helpers.sh` パスから再インストールしてください。以前の GitHub Raw パスは削除されています。

ヘルパーは初回使用時に OpenClaw のチェックアウトを自動検出し（`~/openclaw`、`~/projects/openclaw` などの一般的なパスを確認します）、結果を `~/.clawdock/config` にキャッシュします。チェックアウトが別の場所にある場合は、`CLAWDOCK_DIR` を自分で設定してください。

## 使用できる機能

### 基本操作

| コマンド           | 説明                       |
| ------------------ | -------------------------- |
| `clawdock-start`   | Gateway を起動する         |
| `clawdock-stop`    | Gateway を停止する         |
| `clawdock-restart` | Gateway を再起動する       |
| `clawdock-status`  | コンテナの状態を確認する   |
| `clawdock-logs`    | Gateway のログを追跡する   |

### コンテナへのアクセス

| コマンド                  | 説明                                       |
| ------------------------- | ------------------------------------------ |
| `clawdock-shell`          | Gateway コンテナ内でシェルを開く           |
| `clawdock-cli <command>`  | Docker 内で OpenClaw CLI コマンドを実行する |
| `clawdock-exec <command>` | コンテナ内で任意のコマンドを実行する       |

### Web UI とペアリング

| コマンド                | 説明                                 |
| ----------------------- | ------------------------------------ |
| `clawdock-dashboard`    | Control UI の URL を開く             |
| `clawdock-devices`      | 保留中のデバイスペアリングを一覧表示する |
| `clawdock-approve <id>` | ペアリング要求を承認する             |

### セットアップとメンテナンス

| コマンド             | 説明                                           |
| -------------------- | ---------------------------------------------- |
| `clawdock-fix-token` | Gateway トークンをコンテナ設定に書き込む       |
| `clawdock-update`    | プル、再ビルド、再起動を行う                   |
| `clawdock-rebuild`   | Docker イメージのみを再ビルドする              |
| `clawdock-clean`     | コンテナとボリュームを削除する                 |

### ユーティリティ

| コマンド               | 説明                                         |
| ---------------------- | -------------------------------------------- |
| `clawdock-health`      | Gateway のヘルスチェックを実行する           |
| `clawdock-token`       | Gateway トークンを出力する                   |
| `clawdock-cd`          | OpenClaw プロジェクトディレクトリに移動する   |
| `clawdock-config`      | `~/.openclaw` を開く                         |
| `clawdock-show-config` | 値を伏せて設定ファイルを出力する             |
| `clawdock-workspace`   | ワークスペースディレクトリを開く             |
| `clawdock-help`        | すべての ClawDock コマンドを一覧表示する      |

## 初回の手順

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

ブラウザーにペアリングが必要と表示された場合：

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 設定とシークレット

ClawDock は、[Docker](/ja-JP/install/docker) で説明されている分離構成に従い、2 つの別々の `.env` ファイルを読み込みます。

- `docker-compose.yml` の隣にあるプロジェクトの `.env`：イメージ名、ポート、`OPENCLAW_GATEWAY_TOKEN` など、Docker 固有の値です。`clawdock-token` はここからトークンを読み取ります。
- `~/.openclaw/.env`（コンテナ内にマウントされます）：OpenClaw 自体が管理する環境変数ベースのシークレットです。`openclaw.json` および `agents/<agentId>/agent/auth-profiles.json` とともに管理されます。

`clawdock-fix-token` は、プロジェクトの `.env` からトークンをコンテナの `gateway.remote.token` と `gateway.auth.token` の設定値にコピーし、Gateway を再起動します。

`clawdock-show-config` を使用すると、`openclaw.json` と両方の `.env` ファイルをすばやく確認できます。出力時には `.env` の値が伏せられます。

## 関連項目

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    OpenClaw の標準的な Docker インストール方法。
  </Card>
  <Card title="Docker VM ランタイム" href="/ja-JP/install/docker-vm-runtime" icon="cube">
    分離を強化するための Docker 管理 VM ランタイム。
  </Card>
  <Card title="更新" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    OpenClaw パッケージと管理対象サービスの更新方法。
  </Card>
</CardGroup>
