---
read_when:
    - Docker で OpenClaw をよく実行していて、日常的なコマンドをもっと短くしたい場合
    - dashboard、ログ、token 設定、ペアリングフロー向けのヘルパーレイヤーが欲しい場合
summary: Docker ベースの OpenClaw インストール向け ClawDock シェルヘルパー
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T05:03:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock は、Docker ベースの OpenClaw インストール向けの小さなシェルヘルパーレイヤーです。

これにより、長い `docker compose ...` 呼び出しの代わりに、`clawdock-start`、`clawdock-dashboard`、`clawdock-fix-token` のような短いコマンドを使えます。

まだ Docker をセットアップしていない場合は、まず [Docker](/ja-JP/install/docker) から始めてください。

## インストール

正規のヘルパーパスを使ってください。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前に `scripts/shell-helpers/clawdock-helpers.sh` から ClawDock をインストールしていた場合は、新しい `scripts/clawdock/clawdock-helpers.sh` パスから再インストールしてください。古い raw GitHub パスは削除されました。

## 使えるもの

### 基本操作

| Command | 説明 |
| ------------------ | ---------------------- |
| `clawdock-start` | gateway を起動 |
| `clawdock-stop` | gateway を停止 |
| `clawdock-restart` | gateway を再起動 |
| `clawdock-status` | コンテナー状態を確認 |
| `clawdock-logs` | gateway ログを追跡 |

### コンテナーアクセス

| Command | 説明 |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell` | gateway コンテナー内でシェルを開く |
| `clawdock-cli <command>` | Docker 内で OpenClaw CLI コマンドを実行 |
| `clawdock-exec <command>` | コンテナー内で任意のコマンドを実行 |

### Web UI とペアリング

| Command | 説明 |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard` | Control UI の URL を開く |
| `clawdock-devices` | 保留中のデバイスペアリングを一覧表示 |
| `clawdock-approve <id>` | ペアリングリクエストを承認 |

### セットアップとメンテナンス

| Command | 説明 |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | コンテナー内で gateway token を設定 |
| `clawdock-update` | pull、rebuild、restart を実行 |
| `clawdock-rebuild` | Docker イメージのみ rebuild |
| `clawdock-clean` | コンテナーと volume を削除 |

### ユーティリティ

| Command | 説明 |
| ---------------------- | --------------------------------------- |
| `clawdock-health` | gateway ヘルスチェックを実行 |
| `clawdock-token` | gateway token を表示 |
| `clawdock-cd` | OpenClaw プロジェクトディレクトリへ移動 |
| `clawdock-config` | `~/.openclaw` を開く |
| `clawdock-show-config` | マスク済みの値で config ファイルを表示 |
| `clawdock-workspace` | workspace ディレクトリを開く |

## 初回フロー

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

ブラウザにペアリングが必要と表示された場合:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Config とシークレット

ClawDock は、[Docker](/ja-JP/install/docker) で説明されているのと同じ Docker config 分割で動作します。

- Docker 固有の値（イメージ名、port、gateway token など）には `<project>/.env`
- env ベースの provider key や bot token には `~/.openclaw/.env`
- 保存済み provider OAuth/API-key auth には `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 振る舞い config には `~/.openclaw/openclaw.json`

`.env` ファイルと `openclaw.json` をすばやく確認したい場合は `clawdock-show-config` を使ってください。表示出力では `.env` の値をマスクします。

## 関連ページ

- [Docker](/ja-JP/install/docker)
- [Docker VM Runtime](/ja-JP/install/docker-vm-runtime)
- [Updating](/ja-JP/install/updating)
