---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchd サービスのデバッグ
    - macOS向けGateway CLIのインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-07-04T06:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app は Node/Bun や Gateway ランタイムを同梱しなくなりました。macOS アプリは**外部**の `openclaw` CLI インストールを前提とし、Gateway を子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway の実行を維持します（既存のローカル Gateway がすでに実行中の場合はそれに接続します）。

## 自動セットアップ

新しい Mac では、オンボーディング中に **This Mac** を選択します。アプリは Gateway ウィザードの前に、署名済みで同梱されたインストーラーを実行し、ユーザー空間の Node ランタイムと対応する `openclaw` CLI を `~/.openclaw` 配下にインストールしてから、ユーザーごとの launchd サービスをインストールして開始します。この経路では Terminal、Homebrew、管理者権限は不要です。

アプリが同梱するのはインストーラースクリプトであり、Node や Gateway のペイロードではありません。そのため、セットアップにはランタイムと対応する OpenClaw パッケージをダウンロードするためのインターネット接続が必要です。

## 手動復旧

手動インストールには Node 24 を推奨します。現在 `22.19+` の Node 22 LTS でも動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

自動セットアップに失敗した後は **Retry setup** を使用します。それでも失敗する場合は、上記のコマンドで CLI を手動インストールしてから、オンボーディングで **Check again** を選択します。Node は引き続き推奨 Gateway ランタイムです。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーの `com.openclaw.*` が残る場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

マネージャー:

- macOS アプリは Local モードで LaunchAgent のインストール/更新を所有します。
- CLI でもインストールできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」は LaunchAgent を有効化/無効化します。
- アプリを終了しても gateway は停止しません（launchd が維持します）。
- 設定済みポートで Gateway がすでに実行中の場合、アプリは新しい Gateway を起動せずにそれへ接続します。

ログ:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用）
- launchd stderr: 抑制

## バージョン互換性

macOS アプリは Gateway のバージョンを自身のバージョンと照合します。既存の CLI が見つからない、または互換性がない場合、オンボーディングは管理セットアップを自動的に実行します。インストールをやり直すには **Retry setup** を使用し、外部 CLI を修復した後は **Check again** を使用します。

## macOS の状態ディレクトリ

OpenClaw の状態は、ローカルで同期されないディスクに保持してください。iCloud Drive やその他のクラウド同期フォルダーは避けてください。同期遅延やファイルロックがセッション、認証情報、Gateway の状態に影響する可能性があります。

上書きが必要な場合にのみ、`OPENCLAW_STATE_DIR` をローカルパスに設定してください。`openclaw doctor` は一般的なクラウド同期状態パスについて警告し、ローカルストレージへ戻すことを推奨します。[環境変数](/ja-JP/help/environment#path-related-env-vars) と [Doctor](/ja-JP/gateway/doctor) を参照してください。

## アプリ接続のデバッグ

ソースチェックアウトから macOS デバッグ CLI を使用して、アプリが使用するものと同じ Gateway WebSocket ハンドシェイクと検出ロジックを実行します。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` は `--url`、`--token`、`--timeout`、`--json` を受け付けます。`discover` は `--timeout`、`--json`、`--include-local` を受け付けます。CLI の検出とアプリ側の接続問題を切り分ける必要がある場合は、検出出力を `openclaw gateway discover --json` と比較してください。

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
