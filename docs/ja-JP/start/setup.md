---
read_when:
    - 新しいマシンをセットアップしている場合
    - 個人セットアップを壊さずに「最新かつ最高」を使いたい場合
summary: OpenClaw向けの高度なセットアップおよび開発ワークフロー
title: セットアップ
x-i18n:
    generated_at: "2026-04-24T05:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
初めてセットアップする場合は、まず[はじめに](/ja-JP/start/getting-started)から始めてください。
オンボーディングの詳細は[Onboarding (CLI)](/ja-JP/start/wizard)を参照してください。
</Note>

## TL;DR

どのくらい頻繁に更新したいか、そしてGatewayを自分で実行したいかに応じて、セットアップワークフローを選んでください。

- **カスタマイズはリポジトリ外に置く:** 設定とワークスペースは`~/.openclaw/openclaw.json`と`~/.openclaw/workspace/`に保持すると、リポジトリ更新で触られません。
- **安定ワークフロー（大半の人向けに推奨）:** macOSアプリをインストールし、バンドルされたGatewayを実行させる。
- **最先端ワークフロー（開発）:** `pnpm gateway:watch`でGatewayを自分で実行し、その後macOSアプリをLocalモードで接続させる。

## 前提条件（ソースから）

- Node 24推奨（Node 22 LTS、現在`22.14+`も引き続きサポート）
- `pnpm`推奨（または意図的に[Bun workflow](/ja-JP/install/bun)を使う場合はBun）
- Docker（任意。コンテナ化セットアップ/e2e用のみ — [Docker](/ja-JP/install/docker)参照）

## カスタマイズ戦略（更新で壊れないようにする）

「自分向けに100%カスタマイズ」しつつ、更新も簡単にしたい場合は、カスタマイズを次に置いてください。

- **設定:** `~/.openclaw/openclaw.json`（JSON/JSON5風）
- **ワークスペース:** `~/.openclaw/workspace`（Skills、プロンプト、メモリ。非公開gitリポジトリにするのがおすすめ）

最初に一度bootstrapします。

```bash
openclaw setup
```

このリポジトリ内からは、ローカルCLI entryを使ってください。

```bash
openclaw setup
```

まだグローバルインストールがない場合は、`pnpm openclaw setup`（またはBun workflowを使っているなら`bun run openclaw setup`）で実行してください。

## このリポジトリからGatewayを実行する

`pnpm build`の後、パッケージ化されたCLIを直接実行できます。

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定ワークフロー（macOSアプリ優先）

1. **OpenClaw.app**をインストールして起動する（メニューバー）。
2. オンボーディング/権限チェックリスト（TCCプロンプト）を完了する。
3. Gatewayが**Local**であり、動作中であることを確認する（アプリが管理します）。
4. インターフェースをリンクする（例: WhatsApp）:

```bash
openclaw channels login
```

5. 正常性確認:

```bash
openclaw health
```

ビルドにオンボーディングが含まれていない場合:

- `openclaw setup`を実行し、その後`openclaw channels login`を実行し、手動でGatewayを起動してください（`openclaw gateway`）。

## 最先端ワークフロー（ターミナル内のGateway）

目的: TypeScript Gatewayを作業対象にし、ホットリロードを得ながら、macOSアプリUIは接続したままにする。

### 0) （任意）macOSアプリもソースから実行する

macOSアプリも最先端にしたい場合:

```bash
./scripts/restart-mac.sh
```

### 1) 開発用Gatewayを起動する

```bash
pnpm install
# 初回のみ（またはローカルOpenClaw設定/ワークスペースをリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`はwatchモードでgatewayを実行し、関連ソース、
設定、およびバンドルPluginメタデータの変更でリロードします。
`pnpm openclaw setup`は、新しいcheckout向けの一度きりのローカル設定/ワークスペース初期化です。
`pnpm gateway:watch`は`dist/control-ui`を再ビルドしないため、`ui/`変更後は`pnpm ui:build`を再実行するか、Control UI開発中は`pnpm ui:dev`を使ってください。

意図的にBun workflowを使っている場合、対応するコマンドは次のとおりです。

```bash
bun install
# 初回のみ（またはローカルOpenClaw設定/ワークスペースをリセットした後）
bun run openclaw setup
bun run gateway:watch
```

### 2) 実行中のGatewayへmacOSアプリを向ける

**OpenClaw.app**内で:

- Connection Mode: **Local**
  アプリは、設定済みポート上で実行中のgatewayへ接続します。

### 3) 確認する

- アプリ内Gatewayステータスが**“Using existing gateway …”**と表示されるはずです
- またはCLI経由で:

```bash
openclaw health
```

### よくある落とし穴

- **ポート違い:** Gateway WSのデフォルトは`ws://127.0.0.1:18789`です。アプリとCLIは同じポートにそろえてください。
- **stateの場所:**
  - チャネル/プロバイダー状態: `~/.openclaw/credentials/`
  - モデル認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 資格情報ストレージマップ

認証をデバッグするとき、または何をバックアップすべきか判断するときに使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: 設定/env、または`channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否されます）
- **Discord bot token**: 設定/env、またはSecretRef（env/file/exec provider）
- **Slack token**: 設定/env（`channels.slack.*`）
- **Pairing allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルバックsecretペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシーOAuth import**: `~/.openclaw/credentials/oauth.json`
  詳細: [Security](/ja-JP/gateway/security#credential-storage-map)。

## 更新（セットアップを壊さずに）

- `~/.openclaw/workspace`と`~/.openclaw/`は「自分のもの」として保ち、個人的なプロンプト/設定を`openclaw`リポジトリ内へ置かないでください。
- ソース更新: `git pull` + 使用しているパッケージマネージャーのインストール手順（デフォルトは`pnpm install`、Bun workflowなら`bun install`）+ 対応する`gateway:watch`コマンドを継続利用します。

## Linux（systemd user service）

Linuxインストールではsystemd **user** serviceを使います。デフォルトでは、systemdは
ログアウト/アイドル時にuser serviceを停止するため、Gatewayも終了します。オンボーディングは
これを防ぐためにlingeringの有効化を試みます（sudoを求めることがあります）。それでも無効なら、次を実行してください。

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーサーバーでは、user serviceではなく**system** serviceを検討してください
（lingering不要）。systemdに関する注意は[Gateway runbook](/ja-JP/gateway)を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)（フラグ、supervision、ポート）
- [Gateway configuration](/ja-JP/gateway/configuration)（設定スキーマ + 例）
- [Discord](/ja-JP/channels/discord)および[Telegram](/ja-JP/channels/telegram)（返信タグ + replyToMode設定）
- [OpenClaw assistant setup](/ja-JP/start/openclaw)
- [macOS app](/ja-JP/platforms/macos)（gatewayライフサイクル）
