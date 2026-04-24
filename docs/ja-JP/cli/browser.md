---
read_when:
    - '`openclaw browser` を使用していて、一般的なタスクの例が必要です'
    - ノードホスト経由で別のマシン上で動作しているブラウザーを制御したい場合
    - Chrome MCP を使って、ローカルでサインイン済みの Chrome にアタッチしたい場合
summary: '`openclaw browser` の CLI リファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: Browser
x-i18n:
    generated_at: "2026-04-24T04:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw のブラウザー制御サーフェスを管理し、ブラウザーアクション（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）を実行します。

関連:

- Browser ツール + API: [Browser ツール](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定値）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: 最終的な Gateway 応答を待機します。
- `--browser-profile <name>`: ブラウザープロファイルを選択します（デフォルトは設定値）。
- `--json`: 機械可読出力（対応している場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了状態を確認してください。`start` と `tabs` は成功するのに `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは正常であり、失敗原因は通常ナビゲーション SSRF ポリシーです。

最小手順:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細ガイド: [Browser トラブルシューティング](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## ライフサイクル

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

注意:

- `attachOnly` およびリモート CDP プロファイルでは、`openclaw browser stop` は、OpenClaw 自身がブラウザープロセスを起動していない場合でも、アクティブな制御セッションを閉じて一時的なエミュレーション上書きをクリアします。
- ローカル管理プロファイルでは、`openclaw browser stop` は起動されたブラウザープロセスを停止します。

## コマンドが見つからない場合

`openclaw browser` が不明なコマンドである場合は、`~/.openclaw/openclaw.json` の
`plugins.allow` を確認してください。

`plugins.allow` が存在する場合、バンドル済み browser Plugin は明示的に一覧に含める必要があります。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`plugins.allow` の許可リストから `browser` が除外されている場合、`browser.enabled=true` を設定しても CLI サブコマンドは復元されません。

関連: [Browser ツール](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きのブラウザールーティング設定です。実際には次の意味になります。

- `openclaw`: OpenClaw 管理の専用 Chrome インスタンスを起動またはアタッチします（分離されたユーザーデータディレクトリ）。
- `user`: Chrome DevTools MCP 経由で、既存のサインイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP エンドポイントを指します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

特定のプロファイルを使用する:

```bash
openclaw browser --browser-profile work tabs
```

## タブ

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## スナップショット / スクリーンショット / アクション

スナップショット:

```bash
openclaw browser snapshot
```

スクリーンショット:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

注意:

- `--full-page` はページキャプチャ専用で、`--ref`
  や `--element` と組み合わせることはできません。
- `existing-session` / `user` プロファイルは、ページスクリーンショットとスナップショット出力からの `--ref`
  スクリーンショットはサポートしますが、CSS `--element` スクリーンショットはサポートしません。

navigate/click/type（ref ベースの UI 自動化）:

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

ファイル + ダイアログヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## 状態とストレージ

ビューポート + エミュレーション:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + ストレージ:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## デバッグ

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP 経由の既存 Chrome

組み込みの `user` プロファイルを使うか、独自の `existing-session` プロファイルを作成します。

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

この経路はホスト専用です。Docker、ヘッドレスサーバー、Browserless、その他のリモートセットアップでは、代わりに CDP プロファイルを使用してください。

現在の existing-session の制限:

- スナップショット駆動アクションは CSS セレクターではなく ref を使用します
- `click` は左クリックのみです
- `type` は `slowly=true` をサポートしません
- `press` は `delayMs` をサポートしません
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate` は
  呼び出しごとのタイムアウト上書きを拒否します
- `select` は 1 つの値のみサポートします
- `wait --load networkidle` はサポートされません
- ファイルアップロードは `--ref` / `--input-ref` が必要で、CSS
  `--element` はサポートせず、現在は一度に 1 ファイルのみサポートします
- ダイアログフックは `--timeout` をサポートしません
- スクリーンショットはページキャプチャと `--ref` はサポートしますが、CSS `--element`
  はサポートしません
- `responsebody`、ダウンロードのインターセプト、PDF エクスポート、バッチアクションは引き続き
  管理ブラウザーまたは生の CDP プロファイルが必要です

## リモートブラウザー制御（ノードホストプロキシ）

Gateway がブラウザーとは別のマシンで動作している場合は、Chrome/Brave/Edge/Chromium があるマシンで **node host** を実行します。Gateway はブラウザーアクションをそのノードへプロキシします（別個のブラウザー制御サーバーは不要です）。

`gateway.nodes.browser.mode` を使って自動ルーティングを制御し、複数のノードが接続されている場合は `gateway.nodes.browser.node` で特定のノードを固定します。

セキュリティ + リモートセットアップ: [Browser ツール](/ja-JP/tools/browser)、[リモートアクセス](/ja-JP/gateway/remote)、[Tailscale](/ja-JP/gateway/tailscale)、[セキュリティ](/ja-JP/gateway/security)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Browser](/ja-JP/tools/browser)
