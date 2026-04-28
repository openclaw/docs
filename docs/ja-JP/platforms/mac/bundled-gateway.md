---
read_when:
- Packaging OpenClaw.app
- macOS の `launchd` Gateway サービスをデバッグする場合
- macOS 用の Gateway CLI をインストールする場合
summary: macOS 上の Gateway ランタイム（外部 `launchd` サービス）
title: macOS 上の Gateway
x-i18n:
  generated_at: '2026-04-24T05:08:11Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
  source_path: platforms/mac/bundled-gateway.md
  workflow: 15
---

OpenClaw.app は、もはや Node/Bun や Gateway ランタイムを同梱しません。macOS アプリは **外部の** `openclaw` CLI インストールを前提とし、Gateway を子プロセスとして起動せず、Gateway を動かし続けるためにユーザーごとの `launchd` サービスを管理します（または、すでにローカル Gateway が実行中ならそれに接続します）。

## CLI をインストールする（ローカルモードでは必須）

Mac 上のデフォルトランタイムは Node 24 です。互換性のために Node 22 LTS（現在は `22.14+`）も引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **Install CLI** ボタンは、アプリが内部で使うのと同じグローバルインストールフローを実行します。npm を最優先し、次に pnpm、検出されたパッケージマネージャーがそれしかない場合のみ bun を使います。Gateway ランタイムとしては引き続き Node を推奨します。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーな `com.openclaw.*` が残っている場合があります）

plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリは、ローカルモードで LaunchAgent のインストール/更新を担当します。
- CLI からもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」で LaunchAgent の有効/無効を切り替えます。
- アプリを終了しても gateway は停止しません（`launchd` が生かし続けます）。
- 設定されたポートですでに Gateway が実行中の場合、アプリは
  新しいものを起動せずそれに接続します。

ログ:

- `launchd` の stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## バージョン互換性

macOS アプリは gateway バージョンを自身のバージョンと照合します。互換性がない場合は、アプリのバージョンに合わせてグローバル CLI を更新してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

その後:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Gateway runbook](/ja-JP/gateway)
