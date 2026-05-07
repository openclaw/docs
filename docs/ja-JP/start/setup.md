---
read_when:
    - 新しいマシンのセットアップ
    - 個人用の設定を壊さずに「最新かつ最高のもの」を使いたい
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-05-07T13:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
初回セットアップの場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## TL;DR

更新頻度と Gateway を自分で実行するかどうかに基づいて、セットアップのワークフローを選びます。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースは `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に保持し、リポジトリ更新で触れられないようにします。
- **安定版ワークフロー (ほとんどの人に推奨):** macOS アプリをインストールし、同梱 Gateway を実行させます。
- **最先端ワークフロー (開発):** `pnpm gateway:watch` で Gateway を自分で実行し、その後 macOS アプリを Local モードで接続します。

## 前提条件 (ソースから)

- Node 24 推奨 (Node 22 LTS、現在は `22.16+`、引き続きサポート)
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は開発モードで、同梱Pluginを
  `extensions/*` pnpm ワークスペースパッケージから読み込むため、ルートの `npm install` では
  ソースツリー全体の準備は完了しません。
- Docker (任意。コンテナ化セットアップ/e2e の場合のみ。[Docker](/ja-JP/install/docker)を参照)

## カスタマイズ戦略 (更新で壊れないようにする)

「自分向けに 100% カスタマイズ」しつつ簡単に更新したい場合は、カスタマイズを次の場所に保持します。

- **設定:** `~/.openclaw/openclaw.json` (JSON/JSON5 風)
- **ワークスペース:** `~/.openclaw/workspace` (Skills、プロンプト、メモリ。プライベートな git リポジトリにします)

一度だけブートストラップします。

```bash
openclaw setup
```

このリポジトリ内では、ローカル CLI エントリを使用します。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行します。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ済み CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー (macOS アプリを先に使う)

1. **OpenClaw.app** (メニューバー)をインストールして起動します。
2. オンボーディング/権限チェックリスト (TCC プロンプト)を完了します。
3. Gateway が **Local** で実行中であることを確認します (アプリが管理します)。
4. サーフェスをリンクします (例: WhatsApp)。

```bash
openclaw channels login
```

5. 簡易確認:

```bash
openclaw health
```

ビルドでオンボーディングが利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gateway を手動で起動します (`openclaw gateway`)。

## 最先端ワークフロー (ターミナル内の Gateway)

目標: TypeScript Gateway を開発し、ホットリロードを得て、macOS アプリ UI を接続したままにします。

### 0) (任意) macOS アプリもソースから実行する

macOS アプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を起動する

```bash
pnpm install
# 初回実行時のみ (またはローカル OpenClaw 設定/ワークスペースをリセットした後)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux
セッションで Gateway 監視プロセスを開始または再起動し、対話型ターミナルからは自動接続します。非対話型シェルは
切り離されたままになり、`tmux attach -t openclaw-gateway-watch-main` を表示します。対話型実行を
切り離したままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使用し、
フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使用します。ウォッチャーは、
関連するソース、設定、同梱Pluginメタデータの変更でリロードします。監視対象の
Gateway が起動中に終了した場合、`gateway:watch` は
`openclaw doctor --fix --non-interactive` を一度実行して再試行します。その開発専用修復パスを無効にするには
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。
`pnpm openclaw setup` は、新しいチェックアウトに対する一度だけのローカル設定/ワークスペース初期化ステップです。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` 変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使用します。

### 2) 実行中の Gateway を macOS アプリに向ける

**OpenClaw.app** で:

- 接続モード: **Local**
  アプリは、設定されたポート上で実行中の gateway に接続します。

### 3) 検証

- アプリ内の Gateway ステータスは **「既存の gateway を使用中 …」** と表示されるはずです
- または CLI から:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI を同じポートに保ちます。
- **状態の保存場所:**
  - チャネル/プロバイダー状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージマップ

認証をデバッグする場合や、何をバックアップするかを判断する場合に使用します。

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

## 更新 (セットアップを壊さずに)

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として保持します。個人用プロンプト/設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使用します。

## Linux (systemd ユーザーサービス)

Linux インストールでは systemd **ユーザー**サービスを使用します。デフォルトでは、systemd はログアウト/アイドル時にユーザー
サービスを停止するため、Gateway が終了します。オンボーディングは
lingering の有効化を試みます (sudo を求める場合があります)。まだオフの場合は、次を実行します。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーサーバーでは、
ユーザーサービスではなく **システム**サービスを検討してください (lingering は不要です)。systemd の注記は [Gateway ランブック](/ja-JP/gateway) を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway) (フラグ、監視、ポート)
- [Gateway 設定](/ja-JP/gateway/configuration) (設定スキーマ + 例)
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram) (返信タグ + replyToMode 設定)
- [OpenClaw アシスタントセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos) (gateway ライフサイクル)
