---
read_when:
    - 新しいマシンのセットアップ
    - 個人設定を壊さずに「最新かつ最高」の状態にしたい場合
summary: OpenClaw の高度なセットアップと開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-07-14T14:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
初めてセットアップする場合は、[はじめに](/ja-JP/start/getting-started)から開始してください。
オンボーディングの詳細については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
</Note>

## 要約

更新頻度と、Gateway を自分で実行するかどうかに応じて、セットアップのワークフローを選択します。

- **カスタマイズはリポジトリの外に配置:** 設定とワークスペースは `~/.openclaw/openclaw.json` と `~/.openclaw/workspace/` に保持し、リポジトリの更新による影響を受けないようにします。
- **安定版ワークフロー（ほとんどの場合に推奨）:** macOS アプリをインストールし、同梱の Gateway を実行させます。
- **最新開発版ワークフロー（開発用）:** `pnpm gateway:watch` で Gateway を自分で実行し、macOS アプリを Local モードで接続します。

## 前提条件（ソースから実行する場合）

- Node 24.15+ を推奨（Node 22 LTS、現在は `22.22.3+` も引き続きサポート）
- ソースチェックアウトには `pnpm` が必要です。OpenClaw は開発モードで、同梱 Plugin を
  `extensions/*` pnpm ワークスペースパッケージから読み込むため、ルートの `npm install` では
  ソースツリー全体の準備は行われません。
- Docker（任意。コンテナ化されたセットアップ/E2E の場合のみ。[Docker](/ja-JP/install/docker)を参照）

## カスタマイズ方針（更新の影響を避けるため）

「自分向けに 100% カスタマイズ」しつつ更新を容易にしたい場合は、カスタマイズを次の場所に保持します。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5 形式に近い）
- **ワークスペース:** `~/.openclaw/workspace`（Skills、プロンプト、メモリ。非公開 git リポジトリにすることを推奨）

完全なオンボーディングウィザードを実行せずに、設定とワークスペースのフォルダーを一度だけ初期化します。

```bash
openclaw setup --baseline
```

まだグローバルインストールしていない場合は、代わりにこのリポジトリから実行します。

```bash
pnpm openclaw setup --baseline
```

（`--baseline` を付けない単独の `openclaw setup` は `openclaw onboard` のエイリアスであり、完全な対話型ウィザードを実行します。）

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定版ワークフロー（macOS アプリを優先）

1. **OpenClaw.app**（メニューバー）をインストールして起動します。
2. オンボーディング/権限のチェックリスト（TCC プロンプト）を完了します。
3. Gateway が **Local** で実行中であることを確認します（アプリが管理します）。
4. サービスを連携します（例: WhatsApp）。

```bash
openclaw channels login
```

5. 正常性を確認します。

```bash
openclaw health
```

使用しているビルドでオンボーディングを利用できない場合:

- `openclaw setup`、続いて `openclaw channels login` を実行し、Gateway を手動で起動します（`openclaw gateway`）。

## 最新開発版ワークフロー（ターミナルで Gateway を実行）

目的: TypeScript Gateway を開発し、ホットリロードを利用しながら、macOS アプリの UI を接続した状態に保ちます。

### 0) （任意）macOS アプリもソースから実行する

macOS アプリも最新開発版で使用する場合:

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

`gateway:watch` は、名前付き tmux セッション
（`openclaw-gateway-watch-main`）で Gateway の監視プロセスを起動または再起動し、対話型
ターミナルからは自動的に接続します。非対話型シェルは接続せず、
`tmux attach -t openclaw-gateway-watch-main` を出力します。対話型実行を
接続しない状態に保つには `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` を使用し、
フォアグラウンド監視モードには `pnpm gateway:watch:raw` を使用します。ウォッチャーは、
設定済みまたはデフォルトのポートを引き継ぐ前に、アクティブなプロファイルにインストールされた Gateway サービスを
停止し、サービススーパーバイザーがソースプロセスを置き換えることを防ぎます。
サービスはインストールされたままです。監視を終了したら `pnpm openclaw gateway start` を
実行してください。起動に失敗した後も tmux ペインは利用可能なため、
別のターミナルやエージェントから接続したり、ログを取得したりできます。ウォッチャーは、
関連するソース、設定、同梱 Plugin のメタデータが変更されると再読み込みします。監視対象の
Gateway が起動中に終了した場合、`gateway:watch` は
`openclaw doctor --fix --non-interactive` を一度実行して再試行します。この開発専用の修復処理を無効にするには、
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。
`pnpm gateway:watch` は `dist/control-ui` を再ビルドしないため、`ui/` の変更後は `pnpm ui:build` を再実行するか、Control UI の開発中は `pnpm ui:dev` を使用してください。

### 2) 実行中の Gateway に macOS アプリを接続する

**OpenClaw.app** で:

- Connection Mode: **Local**
  アプリは、設定されたポートで実行中の Gateway に接続します。

### 3) 確認する

- アプリ内の Gateway ステータスに **"Using existing gateway …"** と表示されることを確認します。
- または CLI で確認します。

```bash
openclaw health
```

### よくある落とし穴

- **ポートが違う:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI で同じポートを使用してください。
- **状態の保存場所:**
  - チャンネル/プロバイダーの状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッションとトランスクリプト: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - レガシー/アーカイブ済みセッションの成果物: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 認証情報の保存場所

認証をデバッグする場合や、バックアップ対象を判断する場合に使用してください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: 設定/環境変数または `channels.telegram.tokenFile`（通常のファイルのみ。シンボリックリンクは拒否されます）
- **Discord ボットトークン**: 設定/環境変数または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: 設定/環境変数（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースのシークレットペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/ja-JP/gateway/security#credential-storage-map)。

## セットアップを壊さずに更新する

- `~/.openclaw/workspace` と `~/.openclaw/` は「自分のデータ」として保持し、個人用のプロンプトや設定を `openclaw` リポジトリに入れないでください。
- ソースの更新: `git pull` + `pnpm install` + 引き続き `pnpm gateway:watch` を使用します。

## Linux（systemd ユーザーサービス）

Linux のインストールでは、systemd の **ユーザー**サービスを使用します。デフォルトでは、systemd はログアウト時やアイドル時にユーザー
サービスを停止するため、Gateway も停止します。オンボーディングはユーザーの lingering を
有効にしようとします（sudo を求められる場合があります）。まだ無効な場合は、次を実行します。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーでは、ユーザー
サービスではなく **システム**サービスの使用を検討してください（lingering は不要です）。systemd に関する注意事項は、[Gateway 運用ガイド](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway 運用ガイド](/ja-JP/gateway)（フラグ、監視、ポート）
- [Gateway の設定](/ja-JP/gateway/configuration)（設定スキーマと例）
- [Discord](/ja-JP/channels/discord) と [Telegram](/ja-JP/channels/telegram)（返信タグと replyToMode の設定）
- [OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)
- [macOS アプリ](/ja-JP/platforms/macos)（Gateway のライフサイクル）
