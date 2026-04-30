---
read_when:
    - 新しいマシンのセットアップ
    - 個人用のセットアップを壊さずに「最新かつ最高」を使いたい場合
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-04-30T05:35:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新をどのくらい頻繁に受け取りたいか、Gateway を自分で実行したいかに基づいて、セットアップワークフローを選びます。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に置き、リポジトリの更新がそれらに触れないようにします。
- **安定版ワークフロー（ほとんどの場合に推奨）:** macOS アプリをインストールし、同梱の Gateway を実行させます。
- **最先端ワークフロー（開発）:** `pnpm gateway:watch` で Gateway を自分で実行し、その後 macOS アプリを Local モードで接続させます。

## 前提条件（ソースから）

- Node 24 を推奨（Node 22 LTS、現在は `22.14+` も引き続きサポート）
- `pnpm` を推奨（または意図的に [Bun ワークフロー](/ja-JP/install/bun)を使う場合は Bun）
- Docker（任意。コンテナ化されたセットアップ/e2e の場合のみ — [Docker](/ja-JP/install/docker)を参照）

## カスタマイズ戦略（更新で壊れないように）

「100% 自分向けに調整」しつつ簡単に更新したい場合は、カスタマイズを次に置きます。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5 風）
- **ワークスペース:** `~/.openclaw/workspace`（Skills、プロンプト、メモリ。プライベート git リポジトリにします）

一度だけブートストラップします。

```bash
openclaw setup
```

このリポジトリ内からは、ローカル CLI エントリを使います。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup` で実行します（Bun ワークフローを使っている場合は `bun run openclaw setup`）。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー（macOS アプリ優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限チェックリスト（TCC プロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. サーフェスをリンクします（例: WhatsApp）。

```bash
openclaw channels login
```

5. 健全性を確認します。

```bash
openclaw health
```

ビルドでオンボーディングが利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gateway を手動で起動します（`openclaw gateway`）。

## 最先端ワークフロー（ターミナル内の Gateway）

目標: TypeScript Gateway を作業対象にし、ホットリロードを使い、macOS アプリ UI を接続したままにします。

### 0) （任意）macOS アプリもソースから実行する

macOS アプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を起動する

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux セッションで Gateway の watch プロセスを開始または再起動し、対話型ターミナルから自動でアタッチします。非対話型シェルはデタッチされたままになり、`tmux attach -t openclaw-gateway-watch-main` を出力します。対話型実行をデタッチしたままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使い、フォアグラウンド watch モードには `pnpm gateway:watch:raw` を使います。ウォッチャーは、関連するソース、設定、同梱 Plugin メタデータの変更時にリロードします。
`pnpm openclaw setup` は、新しいチェックアウトに対するローカル設定/ワークスペースの一回限りの初期化手順です。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` の変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使います。

意図的に Bun ワークフローを使っている場合、同等のコマンドは次のとおりです。

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS アプリを実行中の Gateway に向ける

**OpenClaw.app** で:

- 接続モード: **Local**
  アプリは、設定されたポートで実行中の Gateway に接続します。

### 3) 確認する

- アプリ内の Gateway ステータスに **「既存の gateway を使用中 …」** と表示されるはずです
- または CLI から:

```bash
openclaw health
```

### よくある落とし穴

- **ポートが違う:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI を同じポートにそろえてください。
- **状態の保存場所:**
  - チャンネル/プロバイダー状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージマップ

認証のデバッグ時やバックアップ対象を決めるときに使います。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot トークン**: 設定/env または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否されます）
- **Discord bot トークン**: 設定/env または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: 設定/env（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイル backed シークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/ja-JP/gateway/security#credential-storage-map)。

## 更新（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として保ちます。個人用プロンプト/設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + 選択したパッケージマネージャーのインストール手順（デフォルトは `pnpm install`、Bun ワークフローでは `bun install`）+ 対応する `gateway:watch` コマンドを使い続けます。

## Linux（systemd ユーザーサービス）

Linux インストールでは systemd **ユーザー**サービスを使います。デフォルトでは、systemd はログアウト/アイドル時にユーザーサービスを停止し、これにより Gateway が終了します。オンボーディングは lingering の有効化を試みます（sudo を求める場合があります）。まだオフの場合は、次を実行します。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーでは、ユーザーサービスの代わりに **システム**サービスを検討してください（lingering は不要です）。systemd の注記については [Gateway ランブック](/ja-JP/gateway) を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway 設定](/ja-JP/gateway/configuration)（設定スキーマ + 例）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（返信タグ + replyToMode 設定）
- [OpenClaw アシスタントセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos)（gateway ライフサイクル）
