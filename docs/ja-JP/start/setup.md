---
read_when:
    - 新しいマシンのセットアップ
    - 最新かつ最良の状態を望みつつ、自分用のセットアップは壊したくない
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-07-05T11:52:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae0dd0e8ea999367440898f54354a76405e310fee6e05846aab13cba14a65f37
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新をどのくらい頻繁に受け取りたいか、Gatewayを自分で実行したいかに基づいて、セットアップワークフローを選びます。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に置いて、リポジトリの更新がそれらに触れないようにします。
- **安定版ワークフロー (ほとんどの人に推奨):** macOSアプリをインストールし、バンドルされたGatewayを実行させます。
- **最先端ワークフロー (開発):** `pnpm gateway:watch` でGatewayを自分で実行し、macOSアプリをローカルモードで接続させます。

## 前提条件 (ソースから)

- Node 24を推奨 (Node 22 LTS、現在は `22.19+`、も引き続きサポート)
- ソースチェックアウトには `pnpm` が必要です。OpenClawは開発モードで、バンドル済みPluginを
  `extensions/*` pnpmワークスペースパッケージから読み込むため、ルートでの `npm install` では
  ソースツリー全体の準備は完了しません。
- Docker (任意。コンテナ化セットアップ/e2eでのみ使用 - [Docker](/ja-JP/install/docker)を参照)

## カスタマイズ戦略 (更新で壊れないようにする)

「100%自分向けにカスタマイズ」しつつ簡単に更新したい場合は、カスタマイズを次に置いてください。

- **設定:** `~/.openclaw/openclaw.json` (JSON/JSON5風)
- **ワークスペース:** `~/.openclaw/workspace` (Skills、プロンプト、メモリ。プライベートgitリポジトリにします)

完全なオンボーディングウィザードを実行せずに、設定/ワークスペースフォルダーを一度だけブートストラップします。

```bash
openclaw setup --baseline
```

まだグローバルインストールしていない場合は、代わりにこのリポジトリから実行します。

```bash
pnpm openclaw setup --baseline
```

(`--baseline` なしの素の `openclaw setup` は `openclaw onboard` のエイリアスで、完全な対話式ウィザードを実行します。)

## このリポジトリからGatewayを実行する

`pnpm build` の後、パッケージ化されたCLIを直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー (macOSアプリを先に使う)

1. **OpenClaw.app** (メニューバー)をインストールして起動します。
2. オンボーディング/権限チェックリスト (TCCプロンプト)を完了します。
3. Gatewayが**ローカル**で実行中であることを確認します (アプリが管理します)。
4. サーフェスをリンクします (例: WhatsApp)。

```bash
openclaw channels login
```

5. サニティチェックを行います。

```bash
openclaw health
```

ビルドでオンボーディングを利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gatewayを手動で起動します (`openclaw gateway`)。

## 最先端ワークフロー (ターミナル内のGateway)

目標: TypeScript Gatewayで作業し、ホットリロードを得つつ、macOSアプリUIを接続したままにします。

### 0) (任意) macOSアプリもソースから実行する

macOSアプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用Gatewayを起動する

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付きtmuxセッション
(`openclaw-gateway-watch-main`) でGatewayのウォッチプロセスを起動または再起動し、対話式
ターミナルから自動接続します。非対話式シェルは切断されたままになり、
`tmux attach -t openclaw-gateway-watch-main` を出力します。対話式実行を
切断したままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使い、
フォアグラウンドのウォッチモードには `pnpm gateway:watch:raw` を使います。ウォッチャーは
関連するソース、設定、バンドル済みPluginメタデータの変更でリロードします。監視対象の
Gatewayが起動中に終了した場合、`gateway:watch` は
`openclaw doctor --fix --non-interactive` を一度実行して再試行します。この開発専用の修復パスを無効にするには
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` 変更後は `pnpm ui:build` を再実行するか、Control UIの開発中は `pnpm ui:dev` を使ってください。

### 2) macOSアプリを実行中のGatewayに向ける

**OpenClaw.app** で:

- 接続モード: **ローカル**
  アプリは設定済みポートで実行中のGatewayに接続します。

### 3) 検証する

- アプリ内のGatewayステータスは**「既存のGatewayを使用中 …」**と表示されるはずです
- またはCLIで:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WSのデフォルトは `ws://127.0.0.1:18789` です。アプリとCLIを同じポートに揃えてください。
- **状態の保存場所:**
  - チャンネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージマップ

認証をデバッグする場合やバックアップ対象を決める場合に使います。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegramボットトークン**: 設定/envまたは `channels.telegram.tokenFile` (通常ファイルのみ。シンボリックリンクは拒否されます)
- **Discordボットトークン**: 設定/envまたはSecretRef (env/file/execプロバイダー)
- **Slackトークン**: 設定/env (`channels.slack.*`)
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (デフォルトアカウント)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (非デフォルトアカウント)
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード (任意)**: `~/.openclaw/secrets.json`
- **レガシーOAuthインポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [Security](/ja-JP/gateway/security#credential-storage-map)。

## 更新 (セットアップを壊さずに)

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として扱います。個人用プロンプト/設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使います。

## Linux (systemdユーザーサービス)

Linuxインストールではsystemdの**ユーザー**サービスを使います。デフォルトでは、systemdはログアウト/アイドル時にユーザー
サービスを停止するため、Gatewayが終了します。オンボーディングはlingeringを有効にしようとします
(sudoを求める場合があります)。まだオフの場合は、次を実行してください。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーサーバーでは、ユーザーサービスではなく**システム**サービスを検討してください
(lingeringは不要です)。systemdのメモは[Gatewayランブック](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gatewayランブック](/ja-JP/gateway) (フラグ、監視、ポート)
- [Gateway設定](/ja-JP/gateway/configuration) (設定スキーマ + 例)
- [Discord](/ja-JP/channels/discord)と[Telegram](/ja-JP/channels/telegram) (返信タグ + replyToMode設定)
- [OpenClawアシスタントセットアップ](/ja-JP/start/openclaw)
- [macOSアプリ](/ja-JP/platforms/macos) (Gatewayライフサイクル)
