---
read_when:
    - 新しいマシンをセットアップする
    - 自分の環境を壊さずに「最新かつ最高」を使いたい場合
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-05-02T05:06:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新頻度と Gateway を自分で実行するかどうかに基づいて、セットアップワークフローを選択します。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に保持すると、リポジトリ更新の影響を受けません。
- **安定ワークフロー（大半の用途に推奨）:** macOS アプリをインストールし、同梱 Gateway を実行させます。
- **最先端ワークフロー（開発）:** `pnpm gateway:watch` で Gateway を自分で実行し、その後 macOS アプリを Local モードで接続します。

## 前提条件（ソースから）

- Node 24 推奨（Node 22 LTS、現在は `22.14+` も引き続きサポート）
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は dev モードで
  `extensions/*` pnpm ワークスペースパッケージから同梱Pluginを読み込むため、ルートでの `npm install` だけでは
  ソースツリー全体は準備されません。
- Docker（任意。コンテナ化セットアップ/e2e の場合のみ。[Docker](/ja-JP/install/docker)を参照）

## カスタマイズ戦略（更新で困らないために）

「100% 自分向けにカスタマイズ」しつつ簡単に更新したい場合は、カスタマイズを次の場所に保持します。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5 風）
- **ワークスペース:** `~/.openclaw/workspace`（skills、プロンプト、メモリ。非公開 git リポジトリにするとよい）

一度だけブートストラップします。

```bash
openclaw setup
```

このリポジトリ内からは、ローカル CLI エントリを使用します。

```bash
openclaw setup
```

グローバルインストールがまだない場合は、`pnpm openclaw setup` 経由で実行します。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定ワークフロー（macOS アプリ優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限チェックリスト（TCC プロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. サーフェスをリンクします（例: WhatsApp）。

```bash
openclaw channels login
```

5. サニティチェックを実行します。

```bash
openclaw health
```

ビルドでオンボーディングを利用できない場合:

- `openclaw setup` を実行し、次に `openclaw channels login` を実行してから、Gateway を手動で起動します（`openclaw gateway`）。

## 最先端ワークフロー（ターミナル内の Gateway）

目的: TypeScript Gateway で作業し、ホットリロードを有効にし、macOS アプリ UI を接続したままにします。

### 0) （任意）macOS アプリもソースから実行する

macOS アプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) dev Gateway を起動する

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux
セッションで Gateway 監視プロセスを起動または再起動し、対話型ターミナルから自動接続します。非対話型シェルは
切断されたままで `tmux attach -t openclaw-gateway-watch-main` を出力します。対話型実行を
切断したままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使用し、
フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使用します。監視プロセスは、
関連するソース、設定、同梱Pluginメタデータの変更でリロードします。
`pnpm openclaw setup` は、新しいチェックアウトに対する一度限りのローカル設定/ワークスペース初期化手順です。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` の変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使用してください。

### 2) 実行中の Gateway を macOS アプリに向ける

**OpenClaw.app** で:

- Connection Mode: **Local**
  アプリは設定されたポートで実行中の Gateway に接続します。

### 3) 検証

- アプリ内 Gateway ステータスは **「既存の gateway を使用中 …」** と表示されるはずです
- または CLI 経由:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI を同じポートに揃えてください。
- **状態の保存場所:**
  - チャンネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報ストレージマップ

認証のデバッグ時やバックアップ対象を決めるときに使用してください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: 設定/env または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）
- **Discord ボットトークン**: 設定/env または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: 設定/env（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイル backed シークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/ja-JP/gateway/security#credential-storage-map)。

## 更新（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のもの」として保持します。個人用プロンプト/設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使用します。

## Linux（systemd ユーザーサービス）

Linux インストールでは systemd **ユーザー**サービスを使用します。デフォルトでは、systemd はログアウト/アイドル時にユーザー
サービスを停止するため、Gateway が終了します。オンボーディングは
lingering を有効化しようとします（sudo を求める場合があります）。それでも無効な場合は、次を実行します。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーサーバーでは、ユーザーサービスではなく **システム**サービスを検討してください
（lingering は不要です）。systemd の注記については [Gateway ランブック](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway 設定](/ja-JP/gateway/configuration)（設定スキーマ + 例）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（返信タグ + replyToMode 設定）
- [OpenClaw アシスタント設定](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos)（gateway ライフサイクル）
