---
read_when:
    - '`openclaw browser` を使用しており、一般的なタスクの例を確認したい場合'
    - Node ホスト経由で別のマシン上で実行されているブラウザを制御したい場合
    - Chrome MCP 経由で、ローカルでサインイン済みの Chrome に接続する場合
summary: '`openclaw browser` の CLI リファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: ブラウザ
x-i18n:
    generated_at: "2026-07-12T14:21:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw のブラウザー制御サーフェスを管理し、ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグなどのブラウザー操作を実行します。

関連項目: [ブラウザーツール](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定値）。
- `--token <token>`: Gateway トークン（必要な場合）。
- `--timeout <ms>`: リクエストのタイムアウト（ミリ秒、デフォルト: `30000`）。
- `--expect-final`: Gateway の最終レスポンスを待機します。
- `--browser-profile <name>`: ブラウザープロファイルを選択します（デフォルト: `openclaw`、または `browser.defaultProfile`）。
- `--json`: 機械可読な出力（サポートされている場合）。これはブラウザーレベルのオプションであるため、
  `openclaw browser --json status` のように、曖昧さを避けるにはサブコマンドの前に
  指定してください。選択した子コマンドに独自の `--json` が
  定義されていない場合は、`openclaw browser status --json` のように末尾へ指定しても機能します。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは `browser({ action: "doctor" })` を使用して、同じ準備状況チェックを実行できます。

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP の準備状況をトラブルシューティングしてください。`start` と `tabs` は成功するものの、`open` または `navigate` が失敗する場合、ブラウザー制御プレーンは正常であり、通常はナビゲーションの SSRF ポリシーによるブロックが原因です。

最小限の手順:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細なガイダンス: [ブラウザーのトラブルシューティング](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` はライブスナップショットのプローブを追加します。基本的な CDP の準備状況は正常でも、現在のタブを検査できることを確認したい場合に役立ちます。
- 実行中のローカル管理プロファイルでは、`status` と `doctor` が Chrome からキャッシュされた
  グラフィックス診断情報を報告します。これには、ハードウェア／ソフトウェアの分類、レンダラー、
  バックエンド、デバイス／ドライバー、機能と無効化状態の詳細、およびアクセラレーションされた
  動画機能が含まれます。`openclaw browser --json status` は完全な構造化ペイロードを返します。
  受動的なステータス確認では、これらの情報を収集するためだけに Chrome を起動することはありません。
- `stop` は、OpenClaw 自体がブラウザープロセスを起動していない `attachOnly` プロファイルやリモート CDP プロファイルでも、アクティブな制御セッションを閉じ、一時的なエミュレーションのオーバーライドを消去します。ローカル管理プロファイルの場合、`stop` は生成されたブラウザープロセスも停止します。
- `start --headless` はその起動リクエストにのみ適用され、OpenClaw がローカル管理ブラウザーを起動する場合に限られます。`browser.headless` やプロファイル設定を書き換えることはなく、すでに実行中のブラウザーに対しては何も行いません。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false`、または `browser.profiles.<name>.headless=false` によって表示可能なブラウザーが明示的に要求されていない限り、ローカル管理プロファイルは自動的にヘッドレスで実行されます。

## コマンドが見つからない場合

`openclaw browser` が不明なコマンドの場合は、`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。`plugins.allow` が存在する場合、設定にルートの `browser` ブロックがすでに含まれていなければ、バンドルされたブラウザー Plugin を明示的にリストへ追加します。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック（たとえば `browser.enabled=true` や `browser.profiles.<name>`）も、制限的な Plugin 許可リストの下でバンドルされたブラウザー Plugin を有効にします。

関連項目: [ブラウザーツール](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは、名前付きのブラウザールーティング設定です。

- `openclaw`（デフォルト）: OpenClaw が管理する専用の Chrome インスタンスを起動するか、そこへ接続します（分離されたユーザーデータディレクトリ）。
- `user`: Chrome DevTools MCP を介して、既存のログイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP エンドポイントを指定します。

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

任意のサブコマンドで `--browser-profile <name>` を使用して特定のプロファイルを指定します。たとえば、`openclaw browser --browser-profile work tabs` のように指定します。

macOS では、`system-profiles` はホスト上で利用可能な実際の Chrome、Brave、Edge、または Chromium のプロファイルを一覧表示します。`import-profile` は、macOS のキーチェーン／Touch ID による同意プロンプトを一度表示した後、それらの Cookie を復号し、新しい OpenClaw 管理プロファイルへ注入します。インポートされるのは Cookie のみで、ローカルストレージと IndexedDB は変更されません。一部の Google セッションはデバイスバインドセッション認証情報（DBSC）を使用しており、インポート後も再認証が必要になる場合があります。

macOS アプリがローカル Gateway を使用している場合、このインポートを一度提示し、分離されたインポート済みプロファイルをエージェントのブラウジング用デフォルトに設定できます。インポートには常に明示的なクリックが必要です。インポートに成功するか表示を閉じると、その後の自動プロンプトは抑止されますが、**Settings → General → Browser login** から再インポートできます。

システムプロファイルのインポートはデフォルトで有効です。CLI とエージェントによって開始されるインポートの両方を無効にするには、`browser.allowSystemProfileImport=false` を設定します。インポートはホストローカルであり、ブラウザー Node プロキシ経由では実行できません。

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

`tabs` は最初に `suggestedTargetId` を返し、続いて安定した `tabId`（`t1` など）、省略可能なラベル、生の `targetId` を返します。`suggestedTargetId` を `focus`、`close`、スナップショット、アクションに渡してください。ラベルは `open --label`、`tab new --label`、または `tab label` で割り当てます。ラベル、タブ ID、生のターゲット ID、一意なターゲット ID プレフィックスはすべて使用できます。互換性のためリクエストフィールドの名前は引き続き `targetId` ですが、これらのタブ参照のいずれも受け付けます。

生のターゲット ID は揮発性の診断用ハンドルであり、永続的なエージェントメモリではありません。ナビゲーションやフォーム送信中に Chromium が基盤となる生のターゲットを置き換えた場合、OpenClaw は一致を証明できれば、安定した `tabId`／ラベルを置換後のタブに引き続き関連付けます。`suggestedTargetId` を優先してください。

## スナップショット／スクリーンショット／アクション

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

- `--full-page` はページキャプチャ専用であり、`--ref` または `--element` と組み合わせることはできません。
- `existing-session`／`user` プロファイルは、ページのスクリーンショットとスナップショット出力の `--ref` を使用したスクリーンショットをサポートしますが、CSS `--element` スクリーンショットはサポートしません。
- `--labels` は、現在のスナップショット参照をスクリーンショット上に重ねて表示します。Playwright ベースのプロファイルでは、`--full-page`（ページ全体へのオーバーレイ）、`--ref`（ARIA 参照による要素クリップへのオーバーレイ）、`--element`（CSS セレクターによる要素クリップへのオーバーレイ）で機能します。要素クリップモードでは、ラベルは要素を基準に投影されます。レスポンスには、各参照の境界ボックスを含む `annotations` 配列（空の場合は省略）も含まれます。内容は、`ref`、`number`、`role`、省略可能な `name`、およびキャプチャ画像の座標空間（ビューポート／フルページ／要素相対）における `box: {x, y, width, height}` です。
  `existing-session` プロファイルは、ページのスクリーンショットに chrome-mcp オーバーレイを描画しますが、Playwright の投影ヘルパーは使用せず、`annotations` も含めません。CSS `--element` スクリーンショットもサポートされません。Playwright または chrome-mcp がない場合、ラベル付きスクリーンショットは利用できません。
- `snapshot --urls` は検出したリンク先を AI スナップショットに追加し、エージェントがリンクテキストだけから推測する代わりに、直接のナビゲーション先を選択できるようにします。

ナビゲーション／クリック／入力（参照ベースの UI 自動化）:

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

`evaluate --fn` は、関数のソース、式、または文の本体を受け付けます。文の本体は非同期関数としてラップされるため、返したい値には `return` を使用してください。ページ側の関数にデフォルトの evaluate タイムアウトより長い時間が必要な場合は、`--timeout-ms` を使用します。`browser.evaluateEnabled=false`（デフォルト: `true`）にすると、`evaluate` と `wait --fn` の両方が無効になります。

アクションによってページが置き換えられた後、OpenClaw が置換後のタブを特定できた場合、アクションレスポンスは現在の生の `targetId` を返します。長時間実行するワークフローでは、スクリプトは引き続き `suggestedTargetId`／ラベルを保存して渡す必要があります。

ファイルとダイアログのヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

管理対象の Chrome プロファイルでは、通常のクリックによって開始されたダウンロードは OpenClaw のダウンロードディレクトリ（デフォルトでは `/tmp/openclaw/downloads`、または設定済みの一時ルート）に保存されます。エージェントが特定のファイルを待機してそのパスを返す必要がある場合は、`waitfordownload` または `download` を使用します。これらの明示的な待機処理が次のダウンロードを担当します。アップロードでは、OpenClaw の一時アップロードルートおよび OpenClaw が管理する受信メディア内のファイルを使用できます。これには、`media://inbound/<id>` とサンドボックス相対の `media/inbound/<id>` 参照が含まれます。ネストされたメディア参照、ディレクトリトラバーサル、任意のローカルパスは拒否されます。

アクションによってモーダルダイアログが開かれた場合、アクションレスポンスは `browserState.dialogs.pending` とともに `blockedByDialog` を返します。直接応答するには `--dialog-id` を渡します。OpenClaw の外部で処理されたダイアログは `browserState.dialogs.recent` に表示されます。

## 状態とストレージ

ビューポートとエミュレーション:

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

Cookie とストレージ:

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

デフォルトの existing-session パスは、ホスト限定の Chrome MCP 自動接続です。ブラウザがすでに DevTools エンドポイント付きで実行されている場合は、Chrome MCP が代わりにそのエンドポイントへ接続するよう `--cdp-url` を渡します。Chrome MCP のセマンティクスが不要な Docker、Browserless、またはその他のリモート構成では、代わりに CDP プロファイルを使用します。

現在の existing-session の制限事項：

- スナップショット駆動のアクションでは、CSS セレクターではなく ref を使用します。
- 呼び出し元が `timeoutMs` を省略した場合、`browser.actionTimeoutMs` はサポートされている `act` リクエストのデフォルトを 60000 ms に設定します。呼び出しごとの `timeoutMs` が指定されている場合は、そちらが優先されます。
- `click` は左クリックのみです。
- `type` は `slowly=true` をサポートしていません。
- `press` は `delayMs` をサポートしていません。
- `hover`、`scrollintoview`、`drag`、`select`、`fill` は呼び出しごとのタイムアウト上書きを拒否します。`evaluate` は `--timeout-ms` を受け付けます。
- `select` は 1 つの値のみをサポートします。
- `wait --load networkidle` はサポートされていません（管理対象および raw/remote CDP プロファイルでは動作します）。
- ファイルのアップロードには `--ref` / `--input-ref` が必要で、CSS の `--element` はサポートされず、一度に 1 ファイルのみサポートされます。
- ダイアログフックは `--timeout` をサポートしていません。
- スクリーンショットはページキャプチャと `--ref` をサポートしますが、CSS の `--element` はサポートしていません。
- `responsebody`、ダウンロードのインターセプト、PDF エクスポート、バッチアクションには、引き続き管理対象ブラウザまたは raw CDP プロファイルが必要です。

## リモートブラウザ制御（Node ホストプロキシ）

Gateway がブラウザとは異なるマシンで実行されている場合は、Chrome/Brave/Edge/Chromium があるマシンで **Node ホスト**を実行します。Gateway はブラウザアクションをその Node にプロキシします。個別のブラウザ制御サーバーは必要ありません。

自動ルーティングを制御するには `gateway.nodes.browser.mode` を使用し、複数の Node が接続されている場合に特定の Node を固定するには `gateway.nodes.browser.node` を使用します。

セキュリティとリモート設定：[ブラウザツール](/ja-JP/tools/browser)、[リモートアクセス](/ja-JP/gateway/remote)、[Tailscale](/ja-JP/gateway/tailscale)、[セキュリティ](/ja-JP/gateway/security)

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ブラウザ](/ja-JP/tools/browser)
