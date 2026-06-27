---
read_when:
    - 新しいマシンのセットアップ
    - 個人設定を壊さずに「最新かつ最高」を使いたい
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-06-27T13:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
初回セットアップの場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新頻度と Gateway を自分で実行するかどうかに基づいて、セットアップワークフローを選択します。

- **カスタマイズはリポジトリ外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に保持すると、リポジトリ更新の影響を受けません。
- **安定ワークフロー（大半のユーザーに推奨）:** macOS アプリをインストールし、同梱の Gateway を実行させます。
- **最新開発版ワークフロー（開発者向け）:** `pnpm gateway:watch` で Gateway を自分で実行し、その後 macOS アプリを Local モードで接続させます。

## 前提条件（ソースから）

- Node 24 推奨（Node 22 LTS、現在は `22.19+`、も引き続きサポート）
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は開発モードで、同梱 Plugin を
  `extensions/*` pnpm ワークスペースパッケージから読み込むため、ルートでの `npm install` では
  ソースツリー全体は準備されません。
- Docker（任意。コンテナ化されたセットアップ/e2e の場合のみ - [Docker](/ja-JP/install/docker)を参照）

## カスタマイズ戦略（更新で壊れないようにする）

「自分向けに 100% カスタマイズ」しつつ簡単に更新したい場合は、カスタマイズを次に保持します。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5 風）
- **ワークスペース:** `~/.openclaw/workspace`（Skills、プロンプト、メモリ。プライベート git リポジトリにします）

一度だけブートストラップします。

```bash
openclaw setup
```

このリポジトリ内からは、ローカル CLI エントリを使用します。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行します。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定ワークフロー（まず macOS アプリ）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限チェックリスト（TCC プロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. サーフェスをリンクします（例: WhatsApp）。

```bash
openclaw channels login
```

5. 健全性チェック:

```bash
openclaw health
```

ビルドでオンボーディングを利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gateway を手動で起動します（`openclaw gateway`）。

## 最新開発版ワークフロー（ターミナル内の Gateway）

目的: TypeScript Gateway に取り組み、ホットリロードを得て、macOS アプリ UI を接続したままにします。

### 0) （任意）macOS アプリもソースから実行する

macOS アプリも最新開発版にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を開始する

```bash
pnpm install
# 初回実行時のみ（またはローカル OpenClaw 設定/ワークスペースをリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux
セッションで Gateway の監視プロセスを開始または再起動し、インタラクティブなターミナルからは自動接続します。非インタラクティブシェルは
切断状態のままになり、`tmux attach -t openclaw-gateway-watch-main` を出力します。インタラクティブな実行を
切断状態のままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使用し、
フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使用します。ウォッチャーは、
関連するソース、設定、同梱 Plugin メタデータの変更で再読み込みします。監視対象の
Gateway が起動中に終了した場合、`gateway:watch` は
`openclaw doctor --fix --non-interactive` を一度実行して再試行します。この開発専用の修復パスを無効にするには
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。
`pnpm openclaw setup` は、新しいチェックアウト向けの一度きりのローカル設定/ワークスペース初期化ステップです。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` の変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使用してください。

### 2) macOS アプリを実行中の Gateway に向ける

**OpenClaw.app** で:

- 接続モード: **Local**
  アプリは設定済みポートで実行中の gateway に接続します。

### 3) 検証

- アプリ内の Gateway ステータスは **「既存の gateway を使用中 …」** と表示されるはずです
- または CLI で:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WS の既定値は `ws://127.0.0.1:18789` です。アプリと CLI を同じポートに保ってください。
- **状態の保存場所:**
  - チャネル/プロバイダー状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージマップ

認証をデバッグする場合やバックアップ対象を決める場合に使用します。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: 設定/env または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否されます）
- **Discord ボットトークン**: 設定/env または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: 設定/env（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（既定アカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非既定アカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイル裏付けのシークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/ja-JP/gateway/security#credential-storage-map)。

## 更新（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として保持します。個人用のプロンプト/設定を `openclaw` リポジトリに置かないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使用します。

## Linux（systemd ユーザーサービス）

Linux インストールでは systemd **ユーザー**サービスを使用します。既定では、systemd はログアウト/アイドル時にユーザー
サービスを停止するため、Gateway が終了します。オンボーディングは
lingering を有効にしようとします（sudo を求める場合があります）。まだ無効な場合は、次を実行します。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーでは、ユーザーサービスではなく
**システム**サービスを検討してください（lingering は不要です）。systemd の注記については [Gateway ランブック](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway 設定](/ja-JP/gateway/configuration)（設定スキーマ + 例）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（返信タグ + `replyToMode` 設定）
- [OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos)（gateway ライフサイクル）
