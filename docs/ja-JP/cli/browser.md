---
read_when:
    - '`openclaw browser` を使用しており、一般的なタスクの例が必要な場合'
    - 別のマシン上で実行されているブラウザを Node ホスト経由で制御したい場合
    - Chrome MCP 経由でローカルのサインイン済み Chrome に接続する
summary: '`openclaw browser` のCLIリファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: ブラウザー
x-i18n:
    generated_at: "2026-07-05T11:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82070c47ee06bf8dc5e3463ea17d2ef4b9c6adcc9a1e830d745986e7162fd6b1
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw のブラウザー制御サーフェスを管理し、ブラウザーアクションを実行します: ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ。

関連: [ブラウザーツール](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (デフォルトは設定)。
- `--token <token>`: Gateway トークン (必要な場合)。
- `--timeout <ms>`: リクエストタイムアウト (ms、デフォルト: `30000`)。
- `--expect-final`: 最終 Gateway レスポンスを待ちます。
- `--browser-profile <name>`: ブラウザープロファイルを選択します (デフォルト: `openclaw`、または `browser.defaultProfile`)。
- `--json`: 機械可読な出力 (対応している場合)。

## クイックスタート (ローカル)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは `browser({ action: "doctor" })` で同じ準備状態チェックを実行できます。

## クイックトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まず CDP 準備状態をトラブルシュートしてください。`start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザー制御プレーンは正常で、失敗の原因は通常ナビゲーション SSRF ポリシーブロックです。

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

- `doctor --deep` はライブスナップショットプローブを追加します: 基本的な CDP 準備状態は正常だが、現在のタブを検査できる証拠が必要な場合に便利です。
- `stop` はアクティブな制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。これは OpenClaw がブラウザープロセス自体を起動していない `attachOnly` やリモート CDP プロファイルでも同様です。ローカル管理プロファイルでは、`stop` は生成されたブラウザープロセスも停止します。
- `start --headless` はその起動リクエストにのみ適用され、OpenClaw がローカル管理ブラウザーを起動する場合にのみ有効です。`browser.headless` やプロファイル設定を書き換えることはなく、すでに実行中のブラウザーには何もしません。
- `DISPLAY` または `WAYLAND_DISPLAY` がない Linux ホストでは、`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false`、または `browser.profiles.<name>.headless=false` が表示可能なブラウザーを明示的に要求していない限り、ローカル管理プロファイルは自動的にヘッドレスで実行されます。

## コマンドが見つからない場合

`openclaw browser` が不明なコマンドの場合は、`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。`plugins.allow` が存在する場合、設定にルート `browser` ブロックがすでにない限り、同梱ブラウザー Plugin を明示的に一覧に含めます:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明示的なルート `browser` ブロック (例: `browser.enabled=true` または `browser.profiles.<name>`) も、制限付き Plugin 許可リスト下で同梱ブラウザー Plugin を有効化します。

関連: [ブラウザーツール](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きのブラウザールーティング設定です:

- `openclaw` (デフォルト): 専用の OpenClaw 管理 Chrome インスタンスを起動または接続します (分離されたユーザーデータディレクトリ)。
- `user`: Chrome DevTools MCP 経由で、既存のサインイン済み Chrome セッションを制御します。
- カスタム CDP プロファイル: ローカルまたはリモートの CDP エンドポイントを指します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

任意のサブコマンドで `--browser-profile <name>` を使って特定のプロファイルを使用します。例: `openclaw browser --browser-profile work tabs`。

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

`tabs` は最初に `suggestedTargetId` を返し、次に安定した `tabId` (`t1` など)、任意のラベル、生の `targetId` を返します。`suggestedTargetId` を `focus`、`close`、スナップショット、アクションに渡してください。`open --label`、`tab new --label`、または `tab label` でラベルを割り当てます。ラベル、タブ ID、生のターゲット ID、一意なターゲット ID プレフィックスはいずれも受け付けられます。リクエストフィールド名は互換性のため引き続き `targetId` ですが、これらのタブ参照のいずれも受け付けます。

生のターゲット ID は揮発性の診断用ハンドルであり、永続的なエージェントメモリではありません。ナビゲーションやフォーム送信中に Chromium が基になる生ターゲットを置き換える場合、OpenClaw は一致を証明できるとき、安定した `tabId`/ラベルを置き換え後のタブに紐付けたままにします。`suggestedTargetId` を優先してください。

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

- `--full-page` はページキャプチャ専用です。`--ref` や `--element` と組み合わせることはできません。
- `existing-session` / `user` プロファイルはページスクリーンショットと、スナップショット出力からの `--ref` スクリーンショットに対応していますが、CSS `--element` スクリーンショットには対応していません。
- `--labels` は現在のスナップショット参照をスクリーンショット上に重ねます。Playwright ベースのプロファイルでは、`--full-page` (フルページオーバーレイ)、`--ref` (ARIA ref による要素クリップオーバーレイ)、`--element` (CSS セレクターによる要素クリップオーバーレイ) で動作します。要素クリップモードでは、ラベルは要素を基準に投影されます。レスポンスには `annotations` 配列 (空の場合は省略) も含まれ、各 ref の境界ボックスが含まれます: キャプチャ画像の座標空間 (ビューポート / フルページ / 要素相対) における `ref`、`number`、`role`、任意の `name`、および `box: {x, y, width, height}`。
  `existing-session` プロファイルはページスクリーンショット上に chrome-mcp オーバーレイをレンダリングしますが、Playwright 投影ヘルパーは使用せず、`annotations` も含めません。CSS `--element` スクリーンショットはそこでサポートされません。Playwright または chrome-mcp がない場合、ラベル付きスクリーンショットは利用できません。
- `snapshot --urls` は検出されたリンク先を AI スナップショットに追加し、エージェントがリンクテキストだけから推測するのではなく、直接ナビゲーションターゲットを選べるようにします。

ナビゲート/クリック/入力 (ref ベースの UI 自動化):

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

`evaluate --fn` は関数ソース、式、または文の本体を受け付けます。文の本体は async 関数としてラップされるため、返したい値には `return` を使用してください。ページ側の関数がデフォルトの evaluate タイムアウトより長くかかる可能性がある場合は、`--timeout-ms` を使用してください。`browser.evaluateEnabled=false` (デフォルト: `true`) は `evaluate` と `wait --fn` の両方を無効にします。

アクションレスポンスは、OpenClaw が置き換え後のタブを証明できる場合、アクションによってページが置き換えられた後の現在の生の `targetId` を返します。長期間のワークフローでは、スクリプトは引き続き `suggestedTargetId`/ラベルを保存して渡す必要があります。

ファイル + ダイアログヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

管理 Chrome プロファイルは、通常のクリックで開始されたダウンロードを OpenClaw ダウンロードディレクトリ (デフォルトでは `/tmp/openclaw/downloads`、または設定済みの一時ルート) に保存します。エージェントが特定のファイルを待ってそのパスを返す必要がある場合は、`waitfordownload` または `download` を使用してください。これらの明示的な待機処理が次のダウンロードを所有します。アップロードは、OpenClaw 一時アップロードルートと OpenClaw 管理の受信メディアからのファイルを受け付けます。これには `media://inbound/<id>` とサンドボックス相対の `media/inbound/<id>` 参照が含まれます。ネストされたメディア参照、トラバーサル、任意のローカルパスは拒否されます。

アクションがモーダルダイアログを開いた場合、アクションレスポンスは `browserState.dialogs.pending` とともに `blockedByDialog` を返します。直接応答するには `--dialog-id` を渡してください。OpenClaw 外で処理されたダイアログは `browserState.dialogs.recent` に表示されます。

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

組み込みの `user` プロファイルを使用するか、独自の `existing-session` プロファイルを作成します:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

デフォルトの existing-session パスは、ホスト専用 Chrome MCP 自動接続です。ブラウザーがすでに DevTools エンドポイント付きで実行されている場合は、Chrome MCP が代わりにそのエンドポイントへ接続するように `--cdp-url` を渡してください。Docker、Browserless、または Chrome MCP セマンティクスが不要なその他のリモートセットアップでは、代わりに CDP プロファイルを使用してください。

現在の existing-session の制限:

- スナップショット駆動のアクションは CSS セレクターではなく refs を使用します。
- `browser.actionTimeoutMs` は、呼び出し元が `timeoutMs` を省略した場合、対応する `act` リクエストのデフォルトを 60000 ms にします。呼び出しごとの `timeoutMs` が引き続き優先されます。
- `click` は左クリックのみです。
- `type` は `slowly=true` に対応していません。
- `press` は `delayMs` に対応していません。
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのタイムアウト上書きを拒否します。
- `select` は 1 つの値のみ対応します。
- `wait --load networkidle` はサポートされません (管理プロファイルおよび raw/remote CDP プロファイルでは動作します)。
- ファイルアップロードには `--ref` / `--input-ref` が必要で、CSS `--element` には対応せず、一度に 1 ファイルのみ対応します。
- ダイアログフックは `--timeout` に対応していません。
- スクリーンショットはページキャプチャと `--ref` に対応しますが、CSS `--element` には対応していません。
- `responsebody`、ダウンロードインターセプト、PDF エクスポート、バッチアクションには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

## リモートブラウザー制御（ノードホストプロキシ）

Gateway がブラウザーとは別のマシンで実行されている場合は、Chrome/Brave/Edge/Chromium があるマシンで**ノードホスト**を実行します。Gateway はブラウザー操作をそのノードにプロキシします。別個のブラウザー制御サーバーは不要です。

自動ルーティングを制御するには `gateway.nodes.browser.mode` を使用し、複数のノードが接続されている場合に特定のノードへ固定するには `gateway.nodes.browser.node` を使用します。

セキュリティ + リモートセットアップ: [ブラウザーツール](/ja-JP/tools/browser), [リモートアクセス](/ja-JP/gateway/remote), [Tailscale](/ja-JP/gateway/tailscale), [セキュリティ](/ja-JP/gateway/security)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ブラウザー](/ja-JP/tools/browser)
