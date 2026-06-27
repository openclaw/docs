---
read_when:
    - '`openclaw browser` を使用しており、一般的なタスクの例が必要です'
    - 別のマシンで動作しているブラウザを Node ホスト経由で制御したい場合
    - Chrome MCP 経由でローカルのサインイン済み Chrome に接続したい
summary: 'CLI リファレンス: `openclaw browser`（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: ブラウザー
x-i18n:
    generated_at: "2026-06-27T10:52:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw のブラウザー制御サーフェスを管理し、ブラウザーアクション（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）を実行します。

関連:

- ブラウザーツール + API: [ブラウザーツール](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: 最終 Gateway レスポンスを待ちます。
- `--browser-profile <name>`: ブラウザープロファイルを選択します（デフォルトは設定から）。
- `--json`: 機械可読出力（サポートされている場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは `browser({ action: "doctor" })` で同じ準備完了チェックを実行できます。

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP の準備完了状態をトラブルシュートしてください。`start` と `tabs` は成功するのに `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは正常で、通常はナビゲーションの SSRF ポリシーが原因です。

最小シーケンス:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細ガイド: [ブラウザーのトラブルシューティング](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

注記:

- `doctor --deep` はライブスナップショットプローブを追加します。基本的な CDP
  準備完了状態は緑でも、現在のタブを検査できる証拠が欲しい場合に便利です。
- `attachOnly` とリモート CDP プロファイルでは、OpenClaw がブラウザープロセス自体を起動していない場合でも、`openclaw browser stop` は
  アクティブな制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。
- ローカル管理プロファイルでは、`openclaw browser stop` は生成されたブラウザー
  プロセスを停止します。
- `openclaw browser start --headless` はその start リクエストにのみ適用され、
  OpenClaw がローカル管理ブラウザーを起動する場合にのみ有効です。`browser.headless` やプロファイル設定を書き換えず、すでに実行中の
  ブラウザーには何もしません。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、`OPENCLAW_BROWSER_HEADLESS=0`、
  `browser.headless=false`、または `browser.profiles.<name>.headless=false` が
  表示ブラウザーを明示的に要求しない限り、ローカル管理プロファイルは
  自動的にヘッドレスで実行されます。

## コマンドが見つからない場合

`openclaw browser` が未知のコマンドの場合は、
`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。

`plugins.allow` が存在する場合、設定にルートの `browser` ブロックがすでにない限り、
バンドルされたブラウザー Plugin を明示的に列挙します。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

たとえば `browser.enabled=true` や
`browser.profiles.<name>` のような明示的なルート `browser` ブロックも、
制限的な Plugin 許可リストの下でバンドルされたブラウザー Plugin を有効化します。

関連: [ブラウザーツール](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きのブラウザールーティング設定です。実際には:

- `openclaw`: 専用の OpenClaw 管理 Chrome インスタンスを起動または接続します（分離されたユーザーデータディレクトリ）。
- `user`: Chrome DevTools MCP 経由で、既存のサインイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP エンドポイントを指します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

特定のプロファイルを使う:

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
任意のラベル、そして生の `targetId` を返します。エージェントは
`suggestedTargetId` を `focus`、`close`、スナップショット、アクションに渡し返す必要があります。`open --label`、`tab new --label`、または `tab label` でラベルを割り当てられます。ラベル、
タブ ID、生のターゲット ID、一意のターゲット ID プレフィックスはすべて受け付けられます。
互換性のためリクエストフィールド名は引き続き `targetId` ですが、これらのタブ参照を受け付けます。生のターゲット ID は永続的なエージェントメモリではなく、診断用ハンドルとして扱ってください。
Chromium がナビゲーションやフォーム送信中に基盤となる生ターゲットを置き換える場合、OpenClaw は一致を証明できるとき、安定した `tabId`/ラベルを置換後のタブに付けたままにします。生のターゲット ID は揮発的なままです。`suggestedTargetId` を優先してください。

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

注記:

- `--full-page` はページキャプチャ専用です。`--ref`
  や `--element` と組み合わせることはできません。
- `existing-session` / `user` プロファイルは、ページスクリーンショットとスナップショット出力からの `--ref`
  スクリーンショットをサポートしますが、CSS `--element` スクリーンショットはサポートしません。
- `--labels` は現在のスナップショット参照をスクリーンショット上にオーバーレイします。
  Playwright ベースのプロファイルでは、`--full-page`（フルページラベル
  オーバーレイ）、`--ref`（ARIA ref による要素クリップラベルオーバーレイ）、`--element`
  （CSS セレクターによる要素クリップラベルオーバーレイ）と連携します。要素クリップモードでは、ラベルは要素を基準に投影されます。レスポンスには、各 ref の境界ボックスを含む
  `annotations` 配列も含まれます。各項目には `ref`、
  `number`、`role`、任意の `name`、および `box: {x, y, width, height}` があります。
  座標はキャプチャ画像の空間（ビューポート / フルページ /
  要素相対）内です。空の場合、このフィールドは省略されます。
  `existing-session` プロファイルはページスクリーンショットに chrome-mcp オーバーレイを描画しますが、
  Playwright 投影ヘルパーは使用せず、
  `annotations` も含めません。そこでは CSS `--element` スクリーンショットはサポートされません。Playwright または chrome-mcp がない場合、
  ラベル付きスクリーンショットは利用できません。以前のリリースでは、ラベル付き
  Playwright スクリーンショットで `--full-page`、`--ref`、`--element` が無視され、
  常にビューポートキャプチャが返されていました。現在、ラベル付き
  スクリーンショットはこれらのスコープを尊重します。
- `snapshot --urls` は検出されたリンク先を AI スナップショットに追加するため、
  エージェントはリンクテキストだけから推測する代わりに、直接ナビゲーションターゲットを選択できます。

Navigate/click/type（ref ベースの UI 自動化）:

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` は関数ソース、式、または文本体を受け付けます。
文本体は async 関数としてラップされるため、返したい値には `return` を使ってください。ページ側の関数が
デフォルトの evaluate タイムアウトより長い時間を必要とする可能性がある場合は、`evaluate --timeout-ms <ms>` を使用してください。

アクションレスポンスは、OpenClaw が置換タブを証明できる場合、アクションによってトリガーされたページ
置換後の現在の生 `targetId` を返します。スクリプトはそれでも、
長時間実行されるワークフローには `suggestedTargetId`/ラベルを保存して渡す必要があります。

ファイル + ダイアログヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

管理 Chrome プロファイルは、通常のクリックでトリガーされるダウンロードを OpenClaw
ダウンロードディレクトリ（デフォルトは `/tmp/openclaw/downloads`、または設定済みの一時
ルート）に保存します。エージェントが特定のファイルを待ってそのパスを返す必要がある場合は、
`waitfordownload` または `download` を使ってください。これらの明示的なウェイターが次のダウンロードを所有します。
アップロードは、OpenClaw の一時アップロードルートと OpenClaw 管理の
インバウンドメディアからのファイルを受け付けます。これには `media://inbound/<id>` とサンドボックス相対の
`media/inbound/<id>` 参照が含まれます。ネストした media ref、トラバーサル、任意の
ローカルパスは引き続き拒否されます。
アクションがモーダルダイアログを開くと、アクションレスポンスは
`browserState.dialogs.pending` とともに `blockedByDialog` を返します。直接応答するには
`--dialog-id` を渡してください。OpenClaw の外部で処理されたダイアログは
`browserState.dialogs.recent` の下に表示されます。

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

組み込みの `user` プロファイルを使用するか、独自の `existing-session` プロファイルを作成します。

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

デフォルトの existing-session パスは、ホスト専用の Chrome MCP 自動接続です。ブラウザーがすでに
DevTools エンドポイント付きで実行されている場合は、Chrome MCP が代わりにそのエンドポイントへ接続するよう `--cdp-url` を渡してください。
Docker、Browserless、または Chrome MCP セマンティクスが不要なその他のリモートセットアップでは、
CDP プロファイルを使用します。

現在の existing-session の制限:

- スナップショット駆動のアクションは CSS セレクターではなく refs を使用します
- `browser.actionTimeoutMs` は、呼び出し元が `timeoutMs` を省略した場合、サポートされている `act` リクエストのデフォルトを 60000 ms にします。呼び出しごとの `timeoutMs` が引き続き優先されます。
- `click` は左クリックのみです
- `type` は `slowly=true` をサポートしていません
- `press` は `delayMs` をサポートしていません
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate` は、呼び出しごとのタイムアウト上書きを拒否します
- `select` は 1 つの値のみをサポートします
- `wait --load networkidle` は既存セッションのプロファイルではサポートされていません（管理対象および raw/remote CDP では動作します）
- ファイルアップロードには `--ref` / `--input-ref` が必要です。CSS `--element` はサポートせず、現時点では一度に 1 ファイルのみサポートします
- ダイアログフックは `--timeout` をサポートしていません
- スクリーンショットはページキャプチャと `--ref` をサポートしますが、CSS `--element` はサポートしていません
- `responsebody`、ダウンロードインターセプト、PDF エクスポート、バッチアクションには、引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です

## リモートブラウザー制御（Node ホストプロキシ）

Gateway がブラウザーとは別のマシンで実行されている場合は、Chrome/Brave/Edge/Chromium があるマシンで **Node ホスト**を実行します。Gateway はブラウザーアクションをその Node にプロキシします（別個のブラウザー制御サーバーは不要です）。

自動ルーティングを制御するには `gateway.nodes.browser.mode` を使用し、複数が接続されている場合に特定の Node を固定するには `gateway.nodes.browser.node` を使用します。

セキュリティ + リモートセットアップ: [ブラウザーツール](/ja-JP/tools/browser)、[リモートアクセス](/ja-JP/gateway/remote)、[Tailscale](/ja-JP/gateway/tailscale)、[セキュリティ](/ja-JP/gateway/security)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ブラウザー](/ja-JP/tools/browser)
