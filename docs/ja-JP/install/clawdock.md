---
read_when:
    - OpenClaw を Docker で頻繁に実行しており、日常的に使うコマンドを短くしたい場合
    - ダッシュボード、ログ、トークン設定、ペアリングフロー向けのヘルパーレイヤーが必要な場合
summary: Docker ベースの OpenClaw インストール用 ClawDock シェルヘルパー
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T05:09:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock は、Docker ベースの OpenClaw インストール向けの小さなシェルヘルパーレイヤーです。

長い `docker compose ...` 呼び出しの代わりに、`clawdock-start`、`clawdock-dashboard`、`clawdock-fix-token` のような短いコマンドを使えます。

まだ Docker をセットアップしていない場合は、[Docker](/ja-JP/install/docker) から始めてください。

## インストール

正規のヘルパーパスを使用します。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前に `scripts/shell-helpers/clawdock-helpers.sh` から ClawDock をインストールしていた場合は、新しい `scripts/clawdock/clawdock-helpers.sh` パスから再インストールしてください。古い raw GitHub パスは削除されました。

## 利用できるもの

### 基本操作

| コマンド           | 説明                   |
| ------------------ | ---------------------- |
| `clawdock-start`   | Gateway を起動する     |
| `clawdock-stop`    | Gateway を停止する     |
| `clawdock-restart` | Gateway を再起動する   |
| `clawdock-status`  | コンテナの状態を確認する |
| `clawdock-logs`    | Gateway ログを追跡する |

### コンテナアクセス

| コマンド                  | 説明                                      |
| ------------------------- | ----------------------------------------- |
| `clawdock-shell`          | Gateway コンテナ内でシェルを開く         |
| `clawdock-cli <command>`  | Docker 内で OpenClaw CLI コマンドを実行する |
| `clawdock-exec <command>` | コンテナ内で任意のコマンドを実行する     |

### Web UI とペアリング

| コマンド                | 説明                         |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | Control UI の URL を開く     |
| `clawdock-devices`      | 保留中のデバイスペアリングを一覧表示する |
| `clawdock-approve <id>` | ペアリング要求を承認する     |

### セットアップとメンテナンス

| コマンド             | 説明                                      |
| -------------------- | ----------------------------------------- |
| `clawdock-fix-token` | コンテナ内の Gateway トークンを設定する  |
| `clawdock-update`    | 取得、再ビルド、再起動を行う             |
| `clawdock-rebuild`   | Docker イメージのみを再ビルドする        |
| `clawdock-clean`     | コンテナとボリュームを削除する           |

### ユーティリティ

| コマンド               | 説明                                      |
| ---------------------- | ----------------------------------------- |
| `clawdock-health`      | Gateway のヘルスチェックを実行する       |
| `clawdock-token`       | Gateway トークンを出力する               |
| `clawdock-cd`          | OpenClaw プロジェクトディレクトリへ移動する |
| `clawdock-config`      | `~/.openclaw` を開く                      |
| `clawdock-show-config` | 値を秘匿した設定ファイルを出力する       |
| `clawdock-workspace`   | ワークスペースディレクトリを開く         |

## 初回フロー

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

ブラウザーにペアリングが必要と表示された場合:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 設定とシークレット

ClawDock は、[Docker](/ja-JP/install/docker) で説明されているものと同じ Docker 設定分割で動作します。

- イメージ名、ポート、Gateway トークンなどの Docker 固有の値用の `<project>/.env`
- env ベースのプロバイダーキーとボットトークン用の `~/.openclaw/.env`
- 保存されたプロバイダー OAuth/API-key 認証用の `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 動作設定用の `~/.openclaw/openclaw.json`

`.env` ファイルと `openclaw.json` をすばやく確認したい場合は、`clawdock-show-config` を使用してください。出力される内容では `.env` の値が秘匿されます。

## 関連

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    OpenClaw の正規 Docker インストール。
  </Card>
  <Card title="Docker VM runtime" href="/ja-JP/install/docker-vm-runtime" icon="cube">
    強化された分離のための Docker 管理 VM ランタイム。
  </Card>
  <Card title="Updating" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    OpenClaw パッケージと管理対象サービスの更新。
  </Card>
</CardGroup>
