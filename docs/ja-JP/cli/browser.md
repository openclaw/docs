---
read_when:
    - '`openclaw browser` を使用しており、一般的なタスクの例が必要です'
    - 別のマシンで実行されているブラウザーを Node ホスト経由で制御したい
    - ローカルでサインイン済みの Chrome に Chrome MCP 経由で接続したい場合
summary: '`openclaw browser` の CLI リファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: ブラウザー
x-i18n:
    generated_at: "2026-04-30T05:03:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw のブラウザ制御サーフェスを管理し、ブラウザアクション（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）を実行します。

関連:

- ブラウザツール + API: [ブラウザツール](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: 最終 Gateway レスポンスを待機します。
- `--browser-profile <name>`: ブラウザプロファイルを選択します（デフォルトは設定から取得）。
- `--json`: 機械可読出力（サポートされている場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは `browser({ action: "doctor" })` で同じ準備状況チェックを実行できます。

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP の準備状況をトラブルシュートしてください。`start` と `tabs` は成功するのに `open` または `navigate` が失敗する場合、ブラウザ制御プレーンは正常で、通常はナビゲーション SSRF ポリシーが原因です。

最小シーケンス:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細ガイダンス: [ブラウザのトラブルシューティング](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## ライフサイクル

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

注:

- `doctor --deep` はライブスナップショットプローブを追加します。基本的な CDP
  準備状況が正常でも、現在のタブを検査できる証拠が必要な場合に便利です。
- `attachOnly` とリモート CDP プロファイルでは、`openclaw browser stop` は
  アクティブな制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。これは
  OpenClaw 自体がブラウザプロセスを起動していない場合でも同じです。
- ローカル管理プロファイルでは、`openclaw browser stop` は生成されたブラウザ
  プロセスを停止します。
- `openclaw browser start --headless` は、その start リクエストにのみ適用され、
  OpenClaw がローカル管理ブラウザを起動する場合にのみ適用されます。これは
  `browser.headless` やプロファイル設定を書き換えず、すでに実行中の
  ブラウザでは何もしません。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、ローカル管理プロファイルは
  `OPENCLAW_BROWSER_HEADLESS=0`、
  `browser.headless=false`、または `browser.profiles.<name>.headless=false` が
  表示ブラウザを明示的に要求しない限り、自動的にヘッドレスで実行されます。

## コマンドが見つからない場合

`openclaw browser` が不明なコマンドの場合は、
`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。

`plugins.allow` が存在する場合、設定にルート `browser` ブロックがすでにない限り、
バンドルされたブラウザ Plugin を明示的に一覧に含めます。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

たとえば `browser.enabled=true` や `browser.profiles.<name>` のような明示的なルート `browser` ブロックも、
制限付き Plugin 許可リストの下でバンドルされたブラウザ Plugin を有効化します。

関連: [ブラウザツール](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きのブラウザルーティング設定です。実際には次のように使われます。

- `openclaw`: 専用の OpenClaw 管理 Chrome インスタンス（分離されたユーザーデータディレクトリ）を起動または接続します。
- `user`: Chrome DevTools MCP 経由で、既存のサインイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP エンドポイントを指します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

特定のプロファイルを使用します。

```bash
openclaw browser --browser-profile work tabs
```

## タブ

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` はまず `suggestedTargetId` を返し、次に `t1` などの安定した `tabId`、
任意のラベル、未加工の `targetId` を返します。エージェントは
`suggestedTargetId` を `focus`、`close`、スナップショット、アクションに渡し直す必要があります。
ラベルは `open --label`、`tab new --label`、または `tab label` で割り当てられます。ラベル、
タブ ID、未加工ターゲット ID、一意なターゲット ID プレフィックスはいずれも受け付けられます。
ナビゲーションまたはフォーム送信中に Chromium が基盤の未加工ターゲットを置き換える場合、
OpenClaw は一致を証明できるとき、安定した `tabId`/ラベルを置き換え後のタブに紐付けたままにします。
未加工ターゲット ID は変化しやすいため、`suggestedTargetId` を優先してください。

## スナップショット / スクリーンショット / アクション

スナップショット:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

スクリーンショット:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

注:

- `--full-page` はページキャプチャ専用です。`--ref`
  または `--element` と組み合わせることはできません。
- `existing-session` / `user` プロファイルは、ページスクリーンショットとスナップショット出力からの `--ref`
  スクリーンショットをサポートしますが、CSS `--element` スクリーンショットはサポートしません。
- `--labels` は現在のスナップショット参照をスクリーンショット上に重ねます。
- `snapshot --urls` は検出されたリンク先を AI スナップショットに追加するため、
  エージェントはリンクテキストだけから推測せずに直接ナビゲーション先を選択できます。

ナビゲート/クリック/入力（参照ベースの UI 自動化）:

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
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

アクションレスポンスは、OpenClaw が置き換え後のタブを証明できる場合、アクションによって発生したページ
置き換えの後に現在の未加工 `targetId` を返します。スクリプトは長期間のワークフローでは引き続き
`suggestedTargetId`/ラベルを保存して渡す必要があります。

ファイル + ダイアログヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

管理 Chrome プロファイルは、通常のクリックで開始されるダウンロードを OpenClaw
ダウンロードディレクトリ（デフォルトは `/tmp/openclaw/downloads`、または設定された一時
ルート）に保存します。エージェントが特定のファイルを待機してそのパスを返す必要がある場合は、
`waitfordownload` または `download` を使用してください。これらの明示的な待機処理が次のダウンロードを所有します。

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

## MCP 経由の既存の Chrome

組み込みの `user` プロファイルを使用するか、独自の `existing-session` プロファイルを作成します。

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

このパスはホスト専用です。Docker、ヘッドレスサーバー、Browserless、その他のリモート構成では、代わりに CDP プロファイルを使用してください。

現在の existing-session の制限:

- スナップショット駆動のアクションは CSS セレクタではなく参照を使用します
- 呼び出し元が `timeoutMs` を省略した場合、`browser.actionTimeoutMs` はサポート対象の `act` リクエストをデフォルトで 60000 ms にします。呼び出しごとの `timeoutMs` がある場合はそちらが優先されます。
- `click` は左クリックのみです
- `type` は `slowly=true` をサポートしません
- `press` は `delayMs` をサポートしません
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate` は
  呼び出しごとのタイムアウト上書きを拒否します
- `select` は 1 つの値のみサポートします
- `wait --load networkidle` はサポートされていません
- ファイルアップロードには `--ref` / `--input-ref` が必要で、CSS
  `--element` はサポートせず、現在は一度に 1 ファイルのみサポートします
- ダイアログフックは `--timeout` をサポートしません
- スクリーンショットはページキャプチャと `--ref` をサポートしますが、CSS `--element` はサポートしません
- `responsebody`、ダウンロードインターセプト、PDF エクスポート、バッチアクションには、引き続き
  管理ブラウザまたは未加工 CDP プロファイルが必要です

## リモートブラウザ制御（ノードホストプロキシ）

Gateway がブラウザとは別のマシンで実行されている場合、Chrome/Brave/Edge/Chromium があるマシンで **ノードホスト** を実行します。Gateway はブラウザアクションをそのノードにプロキシします（別個のブラウザ制御サーバーは不要です）。

`gateway.nodes.browser.mode` を使用して自動ルーティングを制御し、複数のノードが接続されている場合は `gateway.nodes.browser.node` で特定のノードを固定します。

セキュリティ + リモート設定: [ブラウザツール](/ja-JP/tools/browser), [リモートアクセス](/ja-JP/gateway/remote), [Tailscale](/ja-JP/gateway/tailscale), [セキュリティ](/ja-JP/gateway/security)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ブラウザ](/ja-JP/tools/browser)
