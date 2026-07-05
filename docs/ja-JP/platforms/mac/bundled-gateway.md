---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchd サービスのデバッグ
    - macOS 用 Gateway CLI のインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-07-05T11:29:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1637aaf009383045ce25c0c13d8b39223ea08d5d26b9fa376d2c97f0030c9eb
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun や Gateway ランタイムをバンドルしません。macOS アプリは**外部の** `openclaw` CLI インストールを想定しており、Gateway を子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway を実行し続けます（または、すでに実行中のローカル Gateway に接続します）。

## 自動セットアップ

新しい Mac では、オンボーディング中に **This Mac** を選択します。アプリは Gateway ウィザードの前に、署名済みのバンドル済みインストーラースクリプトを実行します。これにより、ユーザー領域の Node ランタイムと対応する `openclaw` CLI が `~/.openclaw` 配下にインストールされ、その後ユーザーごとの launchd サービスがインストールされて開始されます。この経路では Terminal、Homebrew、管理者権限は不要です。

アプリがバンドルするのはインストーラースクリプトのみで、Node や Gateway のペイロードは含まれません。セットアップには、ランタイムと対応する OpenClaw パッケージをダウンロードするためのインターネット接続が必要です。

## 手動復旧

手動インストールには Node 24 を推奨します。Node 22.19+ でも動作します。`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

自動セットアップに失敗した後は **Retry setup** を使用します。それでも失敗する場合は、上記のコマンドで CLI を手動インストールし、オンボーディングで **Check again** を選択します。

## Launchd（LaunchAgent としての Gateway）

ラベル: `ai.openclaw.gateway`（デフォルトプロファイル）、または名前付きプロファイルの場合は `ai.openclaw.<profile>`。

Plist の場所（ユーザーごと）: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`（または `ai.openclaw.<profile>.plist`）。

macOS アプリは、Local モードのデフォルトプロファイルについて LaunchAgent のインストール/更新を所有します。CLI から直接インストールすることもできます: `openclaw gateway install`（名前付きプロファイルは `OPENCLAW_PROFILE` env var で選択します）。

動作:

- 「OpenClaw Active」は LaunchAgent を有効化/無効化します。
- アプリを終了しても Gateway は停止しません（launchd が実行状態を維持します）。
- 設定済みポートですでに Gateway が実行中の場合、アプリは新しい Gateway を起動せずに接続します。

ログ:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用）
- launchd stderr: 抑制

## バージョン互換性

macOS アプリは Gateway のバージョンを自身のバージョンと照合します。既存の CLI がない、または互換性がない場合、オンボーディングは管理対象セットアップを自動的に実行します。インストールを繰り返すには **Retry setup** を使用し、外部 CLI を修復した後は **Check again** を使用します。

## macOS の状態ディレクトリ

OpenClaw の状態は、ローカルで同期されないディスクに保持します。iCloud Drive やその他のクラウド同期フォルダーは避けてください。同期遅延やファイルロックが、セッション、認証情報、Gateway の状態に影響する場合があります。

上書きが必要な場合にのみ、`OPENCLAW_STATE_DIR` をローカルパスに設定してください。`openclaw doctor` は一般的なクラウド同期の状態パスについて警告し、ローカルストレージへ戻すことを推奨します。[環境変数](/ja-JP/help/environment#path-related-env-vars) と [Doctor](/ja-JP/gateway/doctor) を参照してください。

## アプリ接続のデバッグ

ソースチェックアウトから macOS デバッグ CLI を使用して、アプリが使うものと同じ Gateway WebSocket ハンドシェイクと検出ロジックを実行します。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` は `--url`、`--token`、`--timeout`、`--probe`、`--json` を受け付けます（さらにクライアント ID の上書きもあります。完全な一覧は `--help` 付きで実行してください）。`discover` は `--timeout`、`--json`、`--include-local` を受け付けます。CLI 検出とアプリ側の接続問題を切り分ける必要がある場合は、検出出力を `openclaw gateway discover --json` と比較してください。

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
