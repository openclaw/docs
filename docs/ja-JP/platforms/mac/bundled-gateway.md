---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchd サービスのデバッグ
    - macOS 用 Gateway CLI のインストール
summary: macOS での Gateway ランタイム（外部 launchd サービス）
title: macOS での Gateway
x-i18n:
    generated_at: "2026-06-27T12:03:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun や Gateway ランタイムをバンドルしなくなりました。macOS アプリは**外部**の `openclaw` CLI インストールを想定し、Gateway を子プロセスとして起動せず、Gateway を実行し続けるためにユーザーごとの launchd サービスを管理します（または、既存のローカル Gateway がすでに実行中の場合はそれに接続します）。

## CLI をインストールする（ローカルモードでは必須）

Mac では Node 24 がデフォルトのランタイムです。互換性のため、現在 `22.19+` の Node 22 LTS も引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **Install CLI** ボタンは、アプリが内部で使用するものと同じグローバルインストールフローを実行します。最初に npm を優先し、次に pnpm、検出されたパッケージマネージャーが bun だけの場合は bun を使用します。Node は引き続き推奨される Gateway ランタイムです。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーの `com.openclaw.*` が残っている場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリは、ローカルモードで LaunchAgent のインストール/更新を所有します。
- CLI でもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」は LaunchAgent を有効化/無効化します。
- アプリを終了しても Gateway は停止しません（launchd が維持します）。
- Gateway が設定済みポートですでに実行中の場合、アプリは新しい Gateway を起動せずに接続します。

ログ:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用）
- launchd stderr: 抑制

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
