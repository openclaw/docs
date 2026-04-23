---
read_when:
    - '`openclaw browser` を使用していて、一般的なタスクの例が必要な場合'
    - node host 経由で別のマシン上で動作している browser を制御したい場合
    - Chrome MCP 経由でローカルのサインイン済み Chrome に接続したい場合
summary: '`openclaw browser` の CLI リファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: browser
x-i18n:
    generated_at: "2026-04-23T14:01:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw の browser 制御サーフェスを管理し、browser アクションを実行します（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）。

関連:

- Browser tool + API: [Browser tool](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定から取得）。
- `--token <token>`: Gateway token（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: 最終 Gateway 応答を待機します。
- `--browser-profile <name>`: browser プロファイルを選択します（デフォルトは設定から取得）。
- `--json`: 機械可読な出力（対応している場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了状態をトラブルシューティングしてください。`start` と `tabs` は成功するのに `open` または `navigate` が失敗する場合、browser 制御プレーンは正常であり、失敗の原因は通常ナビゲーション SSRF ポリシーです。

最小シーケンス:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細なガイダンス: [Browser troubleshooting](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## ライフサイクル

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

注意:

- `attachOnly` とリモート CDP プロファイルでは、`openclaw browser stop` は
  OpenClaw 自身が browser プロセスを起動していない場合でも、アクティブな
  制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。
- ローカル管理プロファイルでは、`openclaw browser stop` は起動した browser
  プロセスを停止します。

## コマンドが見つからない場合

`openclaw browser` が未知のコマンドである場合は、
`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。

`plugins.allow` が存在する場合、バンドルされた browser plugin は明示的に
列挙する必要があります:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

plugin の許可リストから `browser` が除外されている場合、
`browser.enabled=true` を設定しても CLI サブコマンドは復元されません。

関連: [Browser tool](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きの browser ルーティング設定です。実際には次の意味になります:

- `openclaw`: 専用の OpenClaw 管理 Chrome インスタンスを起動または接続します（分離された user data dir）。
- `user`: Chrome DevTools MCP 経由で既存のサインイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP endpoint を指します。

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

- `--full-page` はページキャプチャ専用であり、`--ref`
  や `--element` とは組み合わせられません。
- `existing-session` / `user` プロファイルは、ページスクリーンショットと
  スナップショット出力の `--ref` スクリーンショットをサポートしますが、
  CSS `--element` スクリーンショットはサポートしません。

移動/クリック/入力（ref ベースの UI 自動化）:

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

ファイル + ダイアログ補助:

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

組み込みの `user` プロファイルを使うか、自分用の `existing-session` プロファイルを作成します:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

この経路は host 専用です。Docker、ヘッドレスサーバー、Browserless、その他のリモート構成では、代わりに CDP プロファイルを使用してください。

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
- スクリーンショットはページキャプチャと `--ref` をサポートしますが、CSS `--element`
  はサポートしません
- `responsebody`、ダウンロードインターセプト、PDF エクスポート、バッチアクションは引き続き
  管理対象 browser または raw CDP プロファイルが必要です

## リモート browser 制御（node host プロキシ）

Gateway が browser とは別のマシンで動作している場合は、Chrome/Brave/Edge/Chromium があるマシン上で **node host** を実行してください。Gateway は browser アクションをその node にプロキシします（別個の browser 制御サーバーは不要です）。

`gateway.nodes.browser.mode` を使用して自動ルーティングを制御し、複数の node が接続されている場合は `gateway.nodes.browser.node` で特定の node を固定します。

セキュリティ + リモートセットアップ: [Browser tool](/ja-JP/tools/browser), [Remote access](/ja-JP/gateway/remote), [Tailscale](/ja-JP/gateway/tailscale), [Security](/ja-JP/gateway/security)
