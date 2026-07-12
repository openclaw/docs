---
read_when:
    - 新しいマシンのセットアップ
    - 個人用のセットアップを壊さずに「最新かつ最高」の状態にしたい場合
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-07-12T14:50:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から開始してください。
オンボーディングの詳細については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新の頻度と、Gateway を自分で実行するかどうかに応じて、セットアップワークフローを選択してください。

- **カスタマイズはリポジトリの外に置く:** 設定とワークスペースを `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に保持すれば、リポジトリの更新による影響を受けません。
- **安定版ワークフロー（ほとんどの場合に推奨）:** macOS アプリをインストールし、同梱の Gateway をアプリに実行させます。
- **最新開発版ワークフロー（開発者向け）:** `pnpm gateway:watch` で Gateway を自分で実行し、macOS アプリを Local モードで接続します。

## 前提条件（ソースから実行する場合）

- Node 24 を推奨（Node 22 LTS、現在は `22.19+` も引き続きサポート）
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は開発モードで、`extensions/*` の pnpm ワークスペースパッケージから同梱 Plugin を読み込むため、ルートでの `npm install` ではソースツリー全体の準備が完了しません。
- Docker（任意。コンテナ化されたセットアップ/E2E でのみ必要。[Docker](/ja-JP/install/docker)を参照）

## カスタマイズ戦略（更新の影響を避けるため）

「自分専用に 100% カスタマイズ」しつつ簡単に更新したい場合は、カスタマイズ内容を次の場所に保持してください。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5 風）
- **ワークスペース:** `~/.openclaw/workspace`（Skills、プロンプト、メモリ。非公開 git リポジトリにすることを推奨）

完全なオンボーディングウィザードを実行せずに、設定とワークスペースのフォルダーを一度だけ初期化します。

```bash
openclaw setup --baseline
```

まだグローバルインストールしていない場合は、代わりにこのリポジトリから実行します。

```bash
pnpm openclaw setup --baseline
```

（`--baseline` を付けない単独の `openclaw setup` は `openclaw onboard` のエイリアスで、完全な対話式ウィザードを実行します。）

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー（macOS アプリを優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディングと権限のチェックリスト（TCC プロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. 接続先をリンクします（例: WhatsApp）。

```bash
openclaw channels login
```

5. 簡易チェックを実行します。

```bash
openclaw health
```

使用中のビルドでオンボーディングを利用できない場合:

- `openclaw setup`、`openclaw channels login` の順に実行してから、Gateway を手動で起動します（`openclaw gateway`）。

## 最新開発版ワークフロー（ターミナルで Gateway を実行）

目的: TypeScript Gateway を開発し、ホットリロードを利用しながら、macOS アプリの UI を接続したままにします。

### 0) （任意）macOS アプリもソースから実行する

macOS アプリも最新開発版にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を起動する

```bash
pnpm install
# 初回実行時のみ（またはローカルの OpenClaw 設定/ワークスペースをリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` は、名前付き tmux セッション（`openclaw-gateway-watch-main`）で Gateway の監視プロセスを起動または再起動し、対話型ターミナルでは自動的にアタッチします。非対話型シェルではデタッチしたままとなり、`tmux attach -t openclaw-gateway-watch-main` が表示されます。対話型実行でもデタッチしたままにするには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使用し、フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使用します。ウォッチャーは、関連するソース、設定、同梱 Plugin のメタデータが変更されると再読み込みします。監視対象の Gateway が起動中に終了した場合、`gateway:watch` は `openclaw doctor --fix --non-interactive` を一度実行して再試行します。この開発専用の修復処理を無効にするには、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` を変更した後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使用してください。

### 2) macOS アプリを実行中の Gateway に接続する

**OpenClaw.app** で:

- Connection Mode: **Local**
  アプリは、設定されたポートで実行中の Gateway に接続します。

### 3) 確認する

- アプリ内の Gateway ステータスに **"Using existing gateway …"** と表示される必要があります。
- または CLI から確認します。

```bash
openclaw health
```

### よくある落とし穴

- **ポートが違う:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI で同じポートを使用してください。
- **状態の保存場所:**
  - チャネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッションとトランスクリプト: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - レガシー/アーカイブ済みセッションの成果物: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報の保存場所一覧

認証をデバッグする場合や、バックアップ対象を決める場合に使用してください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: 設定/環境変数または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否されます）
- **Discord ボットトークン**: 設定/環境変数または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: 設定/環境変数（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細については、[セキュリティ](/ja-JP/gateway/security#credential-storage-map)を参照してください。

## 更新する（セットアップを壊さずに）

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のデータ」として保持し、個人用のプロンプトや設定を `openclaw` リポジトリに入れないでください。
- ソースを更新するには、`git pull` と `pnpm install` を実行し、引き続き `pnpm gateway:watch` を使用します。

## Linux（systemd ユーザーサービス）

Linux へのインストールでは、systemd の**ユーザー**サービスを使用します。デフォルトでは、ログアウト時またはアイドル時に systemd がユーザーサービスを停止するため、Gateway も終了します。オンボーディングは lingering の有効化を試みます（sudo の入力を求められる場合があります）。まだ無効な場合は、次を実行してください。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーでは、ユーザーサービスではなく**システム**サービスの使用を検討してください（lingering は不要です）。systemd に関する注意事項については、[Gateway 運用ガイド](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway 運用ガイド](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway の設定](/ja-JP/gateway/configuration)（設定スキーマと例）
- [Discord](/ja-JP/channels/discord)と[Telegram](/ja-JP/channels/telegram)（返信タグと replyToMode 設定）
- [OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos)（Gateway のライフサイクル）
