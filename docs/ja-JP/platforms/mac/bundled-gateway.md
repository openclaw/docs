---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchd サービスのデバッグ
    - macOS 向け Gateway CLI のインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS上のGateway
x-i18n:
    generated_at: "2026-06-28T00:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun や Gateway ランタイムを同梱しなくなりました。macOS アプリは**外部**の `openclaw` CLI インストールを想定し、Gateway を子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway を実行し続けます（または、既存のローカル Gateway がすでに実行中の場合はそれに接続します）。

## CLI をインストールする（ローカルモードでは必須）

Mac では Node 24 がデフォルトのランタイムです。Node 22 LTS（現在は `22.19+`）も互換性のため引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **CLI をインストール** ボタンは、アプリが内部で使用するものと同じグローバルインストールフローを実行します。まず npm を優先し、次に pnpm、その後 bun が唯一検出されたパッケージマネージャーである場合のみ bun を使用します。Gateway ランタイムとしては引き続き Node が推奨されます。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーの `com.openclaw.*` が残っている場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリはローカルモードで LaunchAgent のインストール/更新を管理します。
- CLI でもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw アクティブ」は LaunchAgent を有効化/無効化します。
- アプリを終了しても gateway は停止しません（launchd が維持します）。
- 設定されたポートで Gateway がすでに実行中の場合、アプリは新しい Gateway を起動せずに既存のものへ接続します。

ログ:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用）
- launchd stderr: 抑制

## バージョン互換性

macOS アプリは gateway のバージョンを自身のバージョンと照合します。互換性がない場合は、グローバル CLI をアプリのバージョンに合わせて更新してください。

## macOS の状態ディレクトリ

OpenClaw の状態は、ローカルで同期されないディスクに保持してください。iCloud Drive などのクラウド同期フォルダーは避けてください。同期の遅延やファイルロックがセッション、認証情報、Gateway の状態に影響する可能性があります。

上書きが必要な場合にのみ、`OPENCLAW_STATE_DIR` をローカルパスに設定してください。`openclaw doctor` は一般的なクラウド同期状態パスについて警告し、ローカルストレージへ戻すことを推奨します。[環境変数](/ja-JP/help/environment#path-related-env-vars) と [Doctor](/ja-JP/gateway/doctor) を参照してください。

## アプリ接続をデバッグする

ソースチェックアウトから macOS デバッグ CLI を使用して、アプリが使用するものと同じ Gateway WebSocket ハンドシェイクと検出ロジックを実行します。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` は `--url`、`--token`、`--timeout`、`--json` を受け付けます。`discover` は `--timeout`、`--json`、`--include-local` を受け付けます。CLI 検出とアプリ側の接続問題を切り分ける必要がある場合は、検出出力を `openclaw gateway discover --json` と比較してください。

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
