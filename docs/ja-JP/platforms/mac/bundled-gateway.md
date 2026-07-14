---
read_when:
    - OpenClaw.app のパッケージ化
    - macOS Gateway launchdサービスのデバッグ
    - macOS向けGateway CLIのインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-07-14T13:51:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app には Node や Gateway ランタイムはバンドルされていません。macOS アプリは
**外部**の `openclaw` CLI インストールを必要とし、Gateway を
子プロセスとして起動せず、ユーザーごとの launchd サービスを管理して Gateway の
実行を維持します（または、すでに実行中のローカル Gateway に接続します）。

## 自動セットアップ

新しい Mac では、オンボーディング中に **This Mac** を選択します。アプリは
Gateway ウィザードの前に、署名済みのバンドルされたインストーラースクリプトを実行します。
このスクリプトは、ユーザー領域の Node ランタイムと対応する `openclaw` CLI を
`~/.openclaw` 配下にインストールしてから、ユーザーごとの launchd サービスを
インストールして起動します。この手順では Terminal、Homebrew、管理者アクセスは
必要ありません。

アプリにバンドルされるのはインストーラースクリプトのみで、Node や Gateway の
ペイロードは含まれません。セットアップでランタイムと対応する OpenClaw パッケージを
ダウンロードするには、インターネット接続が必要です。

## 手動復旧

手動インストールには Node 24.15+ を推奨します。Node 22.22.3+ も使用できます。
`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

自動セットアップに失敗した後は、**Retry setup** を使用します。それでも失敗する場合は、
上記のコマンドで CLI を手動インストールしてから、オンボーディングで **Check again**
を選択します。

## Launchd（LaunchAgent としての Gateway）

ラベル: デフォルトプロファイルでは `ai.openclaw.gateway`、名前付きプロファイルでは
`ai.openclaw.<profile>`。

Plist の場所（ユーザーごと）: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（または `ai.openclaw.<profile>.plist`）。

ローカルモードでは、macOS アプリがデフォルトプロファイルの LaunchAgent の
インストールと更新を管理します。CLI から直接インストールすることもできます:
`openclaw gateway install`
（名前付きプロファイルは `OPENCLAW_PROFILE` 環境変数で選択します）。

動作:

- 「OpenClaw Active」で LaunchAgent を有効化または無効化します。
- アプリを終了しても Gateway は**停止しません**（launchd が実行を維持します）。
- 設定されたポートですでに Gateway が実行されている場合、アプリは
  新しい Gateway を起動せず、その Gateway に接続します。

ログ:

- launchd の標準出力: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは
  `gateway-<profile>.log`）
- launchd の標準エラー出力: 抑制
- ホストで `EADDRINUSE` が繰り返し発生するループや高速な再起動が
  発生する場合は、重複する `ai.openclaw.gateway` / `ai.openclaw.node` LaunchAgent と、
  [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)にある
  launchd マーカーの回避策を確認してください。

## バージョン互換性

macOS アプリは Gateway のバージョンを自身のバージョンと照合します。既存の CLI が
見つからないか互換性がない場合、オンボーディングによって管理対象セットアップが
自動的に実行されます。インストールを再実行するには **Retry setup** を使用し、
外部 CLI の修復後は **Check again** を使用します。

## macOS の状態ディレクトリ

OpenClaw の状態は、同期されないローカルディスクに保存してください。iCloud Drive や
その他のクラウド同期フォルダーは避けてください。同期の遅延やファイルロックが、
セッション、認証情報、Gateway の状態に影響する可能性があります。

上書きが必要な場合に限り、`OPENCLAW_STATE_DIR` にローカルパスを設定します。
`openclaw doctor` は、一般的なクラウド同期対象の状態パスについて警告し、
ローカルストレージへ戻すことを推奨します。
[環境変数](/ja-JP/help/environment#path-related-env-vars)と
[Doctor](/ja-JP/gateway/doctor)を参照してください。

## アプリ接続のデバッグ

ソースチェックアウトから macOS デバッグ CLI を使用して、アプリと同じ Gateway
WebSocket ハンドシェイクおよび検出ロジックを実行します。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` は `--url`、`--token`、`--timeout`、`--probe`、`--json`
を受け付けます（クライアント ID の上書きも可能です。完全な一覧は
`--help` を指定して実行してください）。
`discover` は `--timeout`、`--json`、`--include-local` を受け付けます。
CLI の検出とアプリ側の接続の問題を切り分ける必要がある場合は、検出結果を
`openclaw gateway discover --json` と比較してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

次に実行します。

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway 運用手順書](/ja-JP/gateway)
