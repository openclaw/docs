---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway の launchd サービスのデバッグ
    - macOS 用 Gateway CLI のインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-05-07T13:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun または Gateway ランタイムを同梱しなくなりました。macOS アプリは**外部**の `openclaw` CLI インストールを前提とし、Gateway を子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway を実行し続けます（または、既存のローカル Gateway がすでに実行中の場合はそれに接続します）。

## CLI をインストールする（ローカルモードでは必須）

Mac では Node 24 がデフォルトのランタイムです。Node 22 LTS（現在は `22.16+`）も互換性のため引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **CLI をインストール**ボタンは、アプリが内部で使用するものと同じグローバルインストールフローを実行します。まず npm を優先し、次に pnpm、bun が検出された唯一のパッケージマネージャーである場合は bun を使用します。Node は引き続き推奨される Gateway ランタイムです。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。従来の `com.openclaw.*` が残っている場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリは、ローカルモードで LaunchAgent のインストール/更新を管理します。
- CLI でもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」は LaunchAgent を有効/無効にします。
- アプリを終了しても Gateway は停止しません（launchd が稼働状態を維持します）。
- 設定済みポートで Gateway がすでに実行中の場合、アプリは新しい Gateway を起動する代わりにそれへ接続します。

ログ:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## バージョン互換性

macOS アプリは Gateway のバージョンを自身のバージョンと照合します。互換性がない場合は、グローバル CLI をアプリのバージョンに合わせて更新してください。

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

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway ランブック](/ja-JP/gateway)
