---
read_when:
    - OpenClaw.app のパッケージ化
    - macOSのGateway launchdサービスのデバッグ
    - macOS 向け Gateway CLI のインストール
summary: macOS 上の Gateway ランタイム（外部 launchd サービス）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-07-12T14:41:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6a871678fcbc617cb87dc4f0610419187a0b67cea7105e02a6cde70d44e85f3
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app には Node/Bun や Gateway ランタイムは同梱されていません。macOS アプリは
**外部**の `openclaw` CLI インストールを必要とし、Gateway を子プロセスとして
起動しません。また、Gateway を実行し続けるためにユーザー単位の launchd サービスを
管理します（または、すでに実行中のローカル Gateway に接続します）。

## 自動セットアップ

新しい Mac では、オンボーディング中に **This Mac** を選択します。アプリは
Gateway ウィザードの前に、署名済みの同梱インストーラースクリプトを実行します。
このスクリプトはユーザー空間の Node ランタイムと対応する `openclaw` CLI を
`~/.openclaw` 配下にインストールした後、ユーザー単位の launchd サービスを
インストールして起動します。この方法では、Terminal、Homebrew、管理者権限は
必要ありません。

アプリに同梱されるのはインストーラースクリプトのみで、Node や Gateway の
ペイロードは含まれません。セットアップでランタイムと対応する OpenClaw
パッケージをダウンロードするには、インターネット接続が必要です。

## 手動復旧

手動インストールには Node 24 を推奨します。Node 22.19+ でも動作します。
`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

自動セットアップに失敗した後は **Retry setup** を使用します。それでも失敗する場合は、
上記のコマンドで CLI を手動インストールしてから、オンボーディングで
**Check again** を選択します。

## Launchd（LaunchAgent としての Gateway）

ラベル: デフォルトプロファイルでは `ai.openclaw.gateway`、名前付きプロファイルでは
`ai.openclaw.<profile>`。

plist の場所（ユーザー単位）: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（または `ai.openclaw.<profile>.plist`）。

ローカルモードでは、macOS アプリがデフォルトプロファイルの LaunchAgent の
インストールと更新を管理します。CLI から直接インストールすることもできます:
`openclaw gateway install`（名前付きプロファイルは `OPENCLAW_PROFILE`
環境変数で選択します）。

動作:

- 「OpenClaw Active」で LaunchAgent を有効化または無効化します。
- アプリを終了しても Gateway は停止**しません**（launchd が実行状態を維持します）。
- 設定済みのポートですでに Gateway が実行中の場合、アプリは新しい Gateway を
  起動せず、その Gateway に接続します。

ログ:

- launchd の標準出力: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは
  `gateway-<profile>.log` を使用）
- launchd の標準エラー出力: 抑制
- ホストで `EADDRINUSE` が繰り返し発生するループや高速な再起動が発生する場合は、
  重複している `ai.openclaw.gateway` / `ai.openclaw.node` LaunchAgent と、
  [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)
  に記載されている launchd マーカーの回避策を確認してください。

## バージョンの互換性

macOS アプリは Gateway のバージョンを自身のバージョンと照合します。既存の CLI が
存在しないか互換性がない場合、オンボーディングで管理対象セットアップが自動的に
実行されます。インストールを繰り返すには **Retry setup** を使用し、外部 CLI の
修復後には **Check again** を使用します。

## macOS の状態ディレクトリ

OpenClaw の状態は、同期されないローカルディスクに保存してください。iCloud Drive
などのクラウド同期フォルダーは避けてください。同期の遅延やファイルロックにより、
セッション、認証情報、Gateway の状態に影響する可能性があります。

上書きが必要な場合に限り、`OPENCLAW_STATE_DIR` をローカルパスに設定します。
`openclaw doctor` は、一般的なクラウド同期対象の状態パスについて警告し、
ローカルストレージへ戻すことを推奨します。
[環境変数](/ja-JP/help/environment#path-related-env-vars)と
[Doctor](/ja-JP/gateway/doctor)を参照してください。

## アプリの接続をデバッグする

ソースチェックアウトから macOS デバッグ CLI を使用して、アプリと同じ Gateway
WebSocket ハンドシェイクおよび検出ロジックを実行します。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` は `--url`、`--token`、`--timeout`、`--probe`、`--json`
を受け付けます（クライアント ID の上書きも可能です。完全な一覧は `--help` を
指定して実行してください）。`discover` は `--timeout`、`--json`、
`--include-local` を受け付けます。CLI の検出とアプリ側の接続問題を切り分ける
必要がある場合は、検出出力を `openclaw gateway discover --json` と比較してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

続いて:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway ランブック](/ja-JP/gateway)
