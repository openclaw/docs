---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchd サービスのデバッグ
    - macOS 用 Gateway CLI のインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-05-06T09:06:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun や Gateway ランタイムをバンドルしなくなりました。macOS アプリは**外部**の `openclaw` CLI インストールを想定し、Gateway を子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway の実行を維持します（または既存のローカル Gateway がすでに実行中の場合は、それに接続します）。

## CLI をインストールする（ローカルモードに必須）

Mac では Node 24 がデフォルトのランタイムです。互換性のため、現在 `22.14+` の Node 22 LTS も引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **Install CLI** ボタンは、アプリが内部で使用するものと同じグローバルインストールフローを実行します。まず npm を優先し、次に pnpm、検出されたパッケージマネージャーが bun だけの場合は bun を使用します。Node は引き続き推奨される Gateway ランタイムです。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーの `com.openclaw.*` が残っている場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリはローカルモードで LaunchAgent のインストール/更新を所有します。
- CLI でもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」は LaunchAgent を有効化/無効化します。
- アプリを終了しても gateway は停止しません（launchd が維持します）。
- 設定済みポートで Gateway がすでに実行中の場合、アプリは新しい Gateway を起動せずに接続します。

ログ:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## バージョン互換性

macOS アプリは gateway のバージョンを自身のバージョンと照合します。互換性がない場合は、グローバル CLI をアプリのバージョンに合わせて更新してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

次に:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway ランブック](/ja-JP/gateway)
