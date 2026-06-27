---
read_when:
    - local control API 経由で agent browser をスクリプト操作またはデバッグする
    - '`openclaw browser` CLI リファレンスを探しています'
    - スナップショットと参照を使ったカスタムブラウザー自動化の追加
summary: OpenClaw ブラウザー制御 API、CLI リファレンス、スクリプト操作
title: ブラウザー制御 API
x-i18n:
    generated_at: "2026-06-27T13:08:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、構成、トラブルシューティングについては、[ブラウザー](/ja-JP/tools/browser)を参照してください。
このページは、ローカル制御HTTP API、`openclaw browser`
CLI、スクリプト作成パターン（スナップショット、ref、待機、デバッグフロー）のリファレンスです。

## コントロールAPI（任意）

ローカル連携専用に、Gateway は小さな local loopback HTTP API を公開します。
このスタンドアロンサーバーはオプトインです。HTTP エンドポイントを利用可能にするには、
Gateway サービス環境で環境変数
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` を設定し、Gateway を再起動します。この変数がない場合でも、
ブラウザー制御ランタイムは CLI と
エージェントツール経由で動作しますが、local loopback 制御ポートでは何も待ち受けません。

- ステータス/開始/停止: `GET /`, `POST /start`, `POST /stop`
- タブ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- スナップショット/スクリーンショット: `GET /snapshot`, `POST /screenshot`
- アクション: `POST /navigate`, `POST /act`
- フック: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ダウンロード: `POST /download`, `POST /wait/download`
- 権限: `POST /permissions/grant`
- デバッグ: `GET /console`, `POST /pdf`
- デバッグ: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- ネットワーク: `POST /response/body`
- 状態: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 状態: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 設定: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け付けます。`POST /start?headless=true` は、
永続化されたブラウザー設定を変更せずに、ローカル管理プロファイルの
1回限りのヘッドレス起動を要求します。attach-only、リモート CDP、既存セッションのプロファイルでは、
OpenClaw がそれらのブラウザープロセスを起動しないため、このオーバーライドは拒否されます。

タブエンドポイントでは、`targetId` は互換性用のフィールド名です。
`GET /tabs` または `POST /tabs/open` から返される
`suggestedTargetId` を渡すことを推奨します。`t1` のようなラベルや `tabId`
ハンドルも受け付けます。生の CDP ターゲットIDと一意な生の
ターゲットIDプレフィックスも引き続き機能しますが、揮発的な診断用ハンドルです。

共有シークレットによる Gateway 認証が構成されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使った HTTP Basic 認証

注:

- このスタンドアロンの local loopback ブラウザーAPIは、trusted-proxy や
  Tailscale Serve のIDヘッダーを使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらの local loopback ブラウザー
  ルートは、それらのIDを含むモードを継承しません。local loopback 専用のままにしてください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証と
ポリシー失敗に対して構造化エラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` がない、または認識されません。
- `ACT_INVALID_REQUEST`（HTTP 400）: アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: 未対応のアクション種別で `selector` が使用されました。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: `evaluate`（または `wait --fn`）が設定で無効化されています。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: トップレベルまたはバッチ内の `targetId` がリクエスト対象と競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: 既存セッションプロファイルではアクションがサポートされていません。

その他のランタイム失敗では、`code` フィールドなしで
`{ "error": "<message>" }` が返される場合があります。

### Playwright 要件

一部の機能（navigate/act/AI スナップショット/ロールスナップショット、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、これらのエンドポイントは
明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合のロール形式アクセシビリティスナップショット（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。これは検査と ref 探索のための
  フォールバックです。Playwright は引き続き主要な
  アクションエンジンです。
- タブごとの CDP
  WebSocket が利用可能な場合の、管理対象 `openclaw` ブラウザーのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` ref ベースのスクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- Playwright のネイティブAIスナップショット形式に依存するAIスナップショット
- CSSセレクター要素スクリーンショット（`--element`）
- ブラウザー全体のPDFエクスポート

要素スクリーンショットでは `--full-page` も拒否されます。このルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` が表示される場合、パッケージ化された
Gateway にコアブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新し、
Gateway を再起動してください。Docker の場合は、以下に示すように Chromium
ブラウザーバイナリもインストールしてください。

#### Docker Playwright のインストール

Gateway が Docker で実行されている場合、`npx playwright` は避けてください（npm オーバーライドが競合します）。
カスタムイメージでは、Chromium をイメージに組み込みます。

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

既存のイメージでは、代わりにバンドルされた CLI 経由でインストールします。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザーダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（例:
`/home/node/.cache/ms-playwright`）を設定し、`OPENCLAW_HOME_VOLUME` またはバインドマウントによって
`/home/node` が永続化されるようにしてください。OpenClaw は Linux 上の永続化された
Chromium を自動検出します。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

小さな local loopback 制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベースのブラウザーに接続します。高度なアクション（クリック/入力/スナップショット/PDF）は CDP 上の Playwright を経由します。Playwright がない場合は、Playwright を使わない操作のみ利用できます。ローカル/リモートブラウザーとプロファイルが下層で自由に入れ替わっても、エージェントからは1つの安定したインターフェイスとして見えます。

## CLIクイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするための `--browser-profile <name>` と、機械可読出力のための `--json` を受け付けます。

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注:

- `upload` と `dialog` は**準備**呼び出しです。chooser/dialog を発火させるクリック/キー入力の前に実行してください。アクションがモーダルを開く場合、アクションレスポンスには `blockedByDialog` と `browserState.dialogs.pending` が含まれます。その `dialogId` を渡すと直接応答できます。OpenClaw 外で処理されたダイアログは `browserState.dialogs.recent` に表示されます。
- `click`/`type` などには、`snapshot` からの `ref`（数値の `12`、ロール ref の `e12`、または操作可能な ARIA ref の `ax12`）が必要です。CSS セレクターは、意図的にアクションではサポートしていません。表示ビューポート上の位置だけが信頼できる対象である場合は、`click-coords` を使用してください。
- ダウンロードパスとトレースパスは、OpenClaw の一時ルート `/tmp/openclaw{,/downloads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）に制限されます。
- `upload` は、OpenClaw の一時アップロードルートと
  OpenClaw 管理の受信メディアからのファイルを受け付けます。管理対象の受信メディアは、
  `media://inbound/<id>`、サンドボックス相対の `media/inbound/<id>`、または管理対象受信メディアディレクトリ内の解決済み
  パスとして参照できます。ネストされたメディア ref、
  トラバーサル、シンボリックリンク、ハードリンク、任意のローカルパスは引き続き拒否されます。
- `upload` は `--input-ref` または `--element` 経由でファイル入力を直接設定することもできます。

OpenClaw が置換後のタブを証明できる場合、たとえば同じ URL、またはフォーム送信後に単一の古いタブが
単一の新しいタブになった場合、安定したタブIDとラベルは Chromium の生ターゲット置換後も維持されます。
生のターゲットIDは引き続き揮発的です。スクリプトでは `tabs` からの
`suggestedTargetId` を推奨します。

スナップショットフラグの概要:

- `--format ai`（Playwright 使用時のデフォルト）: 数値 refs（`aria-ref="<n>"`）付きの AI スナップショット。
- `--format aria`: `axN` refs 付きのアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw はバックエンド DOM ID を使って refs をライブページにバインドするため、後続アクションで使用できます。それ以外の場合は、出力を検査専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトなロールスナップショットプリセット。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway 設定](/ja-JP/gateway/configuration-reference#browser)を参照）。
- `--interactive`、`--compact`、`--depth`、`--selector` は `ref=e12` refs 付きのロールスナップショットを強制します。`--frame "<iframe>"` はロールスナップショットのスコープを iframe に限定します。
- Playwright では、`--labels` により、ref ラベルを重ねたスクリーンショット
  （`MEDIA:<path>` を出力）と、各 ref の境界ボックスを含む `annotations` 配列が
  追加されます。`screenshot` では、Playwright ベースのラベルは `--full-page`、
  `--ref`、`--element` と連携します。`snapshot` では、付随するスクリーンショットは
  ビューポートのみのままです。既存セッション/chrome-mcp プロファイルはページの
  スクリーンショットにオーバーレイラベルを描画しますが、`annotations` を返さず、
  Playwright のフルページ/ref/要素投影ヘルパーも使用しません。Playwright または
  chrome-mcp がない場合、ラベル付きスクリーンショットは利用できません。
- `--urls` は検出されたリンク先を AI スナップショットに追加します。

## スナップショットと refs

OpenClaw は 2 種類の「スナップショット」スタイルをサポートします。

- **AI スナップショット（数値 refs）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 refs を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` 経由で解決されます。

- **ロールスナップショット（`e12` のようなロール refs）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）付きのロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複には `nth()` も使用）経由で解決されます。
  - オーバーレイされた `e12` ラベル付きのスクリーンショットを含めるには `--labels` を追加します。
    Playwright ベースのプロファイルでは、これにより ref ごとの境界ボックスメタデータ
    （`annotations[]`）も返されます。
  - リンクテキストが曖昧で、エージェントが具体的なナビゲーション先を必要とする場合は
    `--urls` を追加します。

- **ARIA スナップショット（`ax12` のような ARIA refs）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: スナップショットパスが Playwright と Chrome バックエンド DOM ID を通じて
    ref をバインドできる場合、`openclaw browser click ax12` が機能します。
- Playwright が利用できない場合でも、ARIA スナップショットは検査には有用な場合がありますが、
  refs はアクション可能でないことがあります。アクション用 refs が必要な場合は、
  `--format ai` または `--interactive` で再スナップショットしてください。
- raw-CDP フォールバックパスの Docker 証明: `pnpm test:docker:browser-cdp-snapshot` は
  CDP 付きで Chromium を起動し、`browser doctor --deep` を実行し、ロールスナップショットに
  リンク URL、カーソル昇格されたクリック可能要素、iframe メタデータが含まれることを検証します。

Ref の動作:

- Refs は**ナビゲーションをまたいで安定しません**。何かが失敗した場合は、`snapshot` を再実行して新しい ref を使用してください。
- `/act` は、置換タブを証明できる場合、アクションによってトリガーされた置換後の現在の raw `targetId` を返します。
  後続コマンドには安定したタブ ID/ラベルを使い続けてください。
- ロールスナップショットが `--frame` 付きで取得された場合、次のロールスナップショットまで、ロール refs はその iframe にスコープされます。
- 不明または古い `axN` refs は、Playwright の `aria-ref` セレクターにフォールスルーする代わりに
  早期に失敗します。その場合は、同じタブで新しいスナップショットを実行してください。

## 待機の強化

時間/テキスト以外にも待機できます。

- URL を待機（Playwright による glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機:
  - `openclaw browser wait --load networkidle`
  - 管理対象の `openclaw` および raw/remote CDP プロファイルでサポートされます。`user` および `existing-session` プロファイルは `networkidle` を拒否します。そこでは `--url`、`--text`、セレクター、または `--fn` 待機を使用してください。
- JS 述語を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示されるまで待機:
  - `openclaw browser wait "#main"`

これらは組み合わせることができます。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗した場合（例: 「not visible」、「strict mode violation」、「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使用します（interactive モードではロール refs を推奨）
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright がターゲットにしているものを確認します
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグ: トレースを記録します:
   - `openclaw browser trace start`
   - 問題を再現します
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` はスクリプトおよび構造化ツール用です。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON のロールスナップショットには `refs` に加え、小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、ツールはペイロードサイズと密度を推論できます。

## 状態と環境の調整項目

これらは「サイトを X のように振る舞わせる」ワークフローで役立ちます。

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（従来の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright デバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザプロファイルにはログイン済みセッションが含まれる場合があります。機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションが
  これを誘導する可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効にしてください。
- `openclaw browser evaluate --fn` は関数ソース、式、または文本体を受け入れます。
  文本体は async 関数としてラップされるため、返したい値には `return` を使用してください。
  ページ側の関数がデフォルトの evaluate タイムアウトより長い時間を必要とする場合は、
  `--timeout-ms <ms>` を使用してください。
- ログインとアンチボットの注記（X/Twitter など）については、[ブラウザログイン + X/Twitter 投稿](/ja-JP/tools/browser-login)を参照してください。
- Gateway/node ホストは非公開に保ってください（ループバックまたは tailnet 専用）。
- Remote CDP エンドポイントは強力です。トンネルし、保護してください。

strict モードの例（デフォルトでプライベート/内部宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## 関連

- [ブラウザ](/ja-JP/tools/browser) - 概要、設定、プロファイル、セキュリティ
- [ブラウザログイン](/ja-JP/tools/browser-login) - サイトへのサインイン
- [ブラウザ Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザ WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
