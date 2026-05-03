---
read_when:
    - 新しいマシンのセットアップ
    - 個人用のセットアップを壊さずに「最新 + 最高」を使いたい
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-05-03T21:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## TL;DR

更新をどれくらい頻繁に取り込みたいか、Gateway を自分で実行したいかに基づいてセットアップワークフローを選びます。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に置くことで、リポジトリの更新がそれらに影響しないようにします。
- **安定版ワークフロー (ほとんどのユーザーに推奨):** macOS アプリをインストールし、同梱の Gateway を実行させます。
- **最先端ワークフロー (開発者向け):** `pnpm gateway:watch` で Gateway を自分で実行し、その後 macOS アプリを Local モードで接続します。

## 前提条件 (ソースから)

- Node 24 を推奨 (Node 22 LTS、現在は `22.14+`、も引き続きサポート)
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は開発モードで、
  `extensions/*` pnpm ワークスペースパッケージから同梱 Plugin を読み込むため、ルートでの `npm install` だけでは
  ソースツリー全体は準備されません。
- Docker (任意。コンテナ化されたセットアップ/e2e の場合のみ — [Docker](/ja-JP/install/docker)を参照)

## カスタマイズ戦略 (更新で壊れないようにする)

「100% 自分向けに調整」しつつ簡単に更新したい場合は、カスタマイズを次に置いてください。

- **設定:** `~/.openclaw/openclaw.json` (JSON/JSON5 風)
- **ワークスペース:** `~/.openclaw/workspace` (Skills、プロンプト、メモリ。プライベート git リポジトリにします)

一度だけブートストラップします。

```bash
openclaw setup
```

このリポジトリ内からは、ローカル CLI エントリを使います。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行します。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー (macOS アプリから開始)

1. **OpenClaw.app** (メニューバー)をインストールして起動します。
2. オンボーディング/権限チェックリスト (TCC プロンプト)を完了します。
3. Gateway が **Local** で実行中であることを確認します (アプリが管理します)。
4. サーフェスをリンクします (例: WhatsApp)。

```bash
openclaw channels login
```

5. 健全性を確認します。

```bash
openclaw health
```

ビルドでオンボーディングが利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gateway を手動で起動します (`openclaw gateway`)。

## 最先端ワークフロー (ターミナル内の Gateway)

目的: TypeScript Gateway を作業し、ホットリロードを使い、macOS アプリ UI を接続したままにします。

### 0) (任意) macOS アプリもソースから実行する

macOS アプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を起動する

```bash
pnpm install
# 初回のみ (またはローカル OpenClaw 設定/ワークスペースをリセットした後)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux
セッションで Gateway の監視プロセスを起動または再起動し、対話型ターミナルから自動でアタッチします。非対話型シェルは
デタッチされたままになり、`tmux attach -t openclaw-gateway-watch-main` を表示します。対話型実行を
デタッチしたままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使い、
フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使います。ウォッチャーは
関連するソース、設定、同梱 Plugin メタデータの変更でリロードします。監視対象の
Gateway が起動中に終了した場合、`gateway:watch` は
`openclaw doctor --fix --non-interactive` を一度実行して再試行します。その開発専用の修復パスを無効にするには
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。
`pnpm openclaw setup` は、新しいチェックアウト用のローカル設定/ワークスペースを初期化する一度だけの手順です。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` 変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使ってください。

### 2) 実行中の Gateway に macOS アプリを向ける

**OpenClaw.app** で:

- 接続モード: **Local**
  アプリは設定済みポートで実行中の gateway に接続します。

### 3) 検証する

- アプリ内の Gateway ステータスは **「Using existing gateway …」** と表示されるはずです
- または CLI から:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI を同じポートにそろえてください。
- **状態の保存場所:**
  - チャネル/プロバイダー状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 資格情報ストレージマップ

認証のデバッグやバックアップ対象の判断に使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: 設定/env または `channels.telegram.tokenFile` (通常ファイルのみ。シンボリックリンクは拒否されます)
- **Discord ボットトークン**: 設定/env または SecretRef (env/file/exec プロバイダー)
- **Slack トークン**: 設定/env (`channels.slack.*`)
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (デフォルトアカウント)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (非デフォルトアカウント)
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード (任意)**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/ja-JP/gateway/security#credential-storage-map)。

## 更新する (セットアップを壊さずに)

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として扱ってください。個人用プロンプト/設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使います。

## Linux (systemd ユーザーサービス)

Linux インストールでは systemd **ユーザー**サービスを使います。デフォルトでは、systemd はログアウト/アイドル時にユーザー
サービスを停止するため、Gateway が終了します。オンボーディングは
lingering を有効にしようとします (sudo を求める場合があります)。まだ無効な場合は、次を実行してください。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーでは、
ユーザーサービスの代わりに **システム**サービスを検討してください (lingering は不要です)。systemd の注記については [Gateway ランブック](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway) (フラグ、監視、ポート)
- [Gateway 設定](/ja-JP/gateway/configuration) (設定スキーマ + 例)
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram) (返信タグ + replyToMode 設定)
- [OpenClaw アシスタントセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos) (gateway ライフサイクル)
