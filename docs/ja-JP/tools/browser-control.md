---
read_when:
    - ローカル制御API経由でエージェントブラウザーをスクリプト化またはデバッグする
    - '`openclaw browser` CLI リファレンスを探しています'
    - スナップショットと参照を使ったカスタムブラウザー自動化の追加
summary: OpenClaw ブラウザー制御 API、CLI リファレンス、スクリプトアクション
title: ブラウザー制御 API
x-i18n:
    generated_at: "2026-04-30T05:36:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、構成、トラブルシューティングについては、[ブラウザー](/ja-JP/tools/browser)を参照してください。
このページは、ローカル制御 HTTP API、`openclaw browser`
CLI、およびスクリプトパターン（スナップショット、ref、待機、デバッグフロー）のリファレンスです。

## 制御 API（任意）

ローカル統合専用に、Gateway は小さなループバック HTTP API を公開します。

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

すべてのエンドポイントは `?profile=<name>` を受け入れます。`POST /start?headless=true` は、永続化されたブラウザー構成を変更せずに、ローカル管理プロファイルに対して
1 回限りのヘッドレス起動を要求します。OpenClaw はそれらのブラウザープロセスを起動しないため、アタッチ専用、リモート CDP、既存セッションのプロファイルは
そのオーバーライドを拒否します。

共有シークレットの Gateway 認証が構成されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使った HTTP Basic 認証

注記:

- このスタンドアロンのループバックブラウザー API は、信頼済みプロキシまたは
  Tailscale Serve の ID ヘッダーを使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらのループバックブラウザー
  ルートは、それらの ID を含むモードを継承しません。ループバック専用にしてください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証とポリシー失敗に対して
構造化されたエラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` がない、または認識されません。
- `ACT_INVALID_REQUEST` (HTTP 400): アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): サポートされていないアクション種別で `selector` が使用されました。
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`（または `wait --fn`）が構成で無効化されています。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): トップレベルまたはバッチの `targetId` がリクエストターゲットと競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 既存セッションプロファイルではアクションがサポートされていません。

その他のランタイム失敗は、`code` フィールドなしで
`{ "error": "<message>" }` を返す場合があります。

### Playwright 要件

一部の機能（navigate/act/AI スナップショット/ロールスナップショット、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、それらのエンドポイントは
明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合の、ロール形式のアクセシビリティスナップショット（`--interactive`, `--compact`,
  `--depth`, `--efficient`）。これは調査と ref 検出のフォールバックです。主要な
  アクションエンジンは引き続き Playwright です。
- タブごとの CDP
  WebSocket が利用可能な場合の、管理対象 `openclaw` ブラウザーのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` ref ベースのスクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- Playwright のネイティブ AI スナップショット形式に依存する AI スナップショット
- CSS セレクター要素スクリーンショット（`--element`）
- ブラウザー全体の PDF エクスポート

要素スクリーンショットは `--full-page` も拒否します。このルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` が表示された場合は、
バンドルされたブラウザーPluginのランタイム依存関係を修復して `playwright-core` がインストールされるようにし、
Gateway を再起動してください。パッケージ版インストールでは、`openclaw doctor --fix` を実行します。
Docker では、以下に示すように Chromium ブラウザーバイナリもインストールしてください。

#### Docker Playwright インストール

Gateway が Docker 内で動作している場合は、`npx playwright`（npm オーバーライド競合）を避けてください。
代わりにバンドルされた CLI を使用します。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザーダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（例:
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` またはバインドマウントで永続化されていることを確認してください。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

小さなループバック制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベースのブラウザーに接続します。高度なアクション（クリック/入力/スナップショット/PDF）は CDP の上の Playwright を通じて実行されます。Playwright がない場合は、Playwright を使わない操作のみが利用可能です。エージェントは、ローカル/リモートのブラウザーとプロファイルが下層で自由に切り替わっても、1 つの安定したインターフェイスを認識します。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にする `--browser-profile <name>` と、機械可読出力のための `--json` を受け入れます。

<AccordionGroup>

<Accordion title="基本: ステータス、タブ、開く/フォーカス/閉じる">

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

<Accordion title="調査: スクリーンショット、スナップショット、コンソール、エラー、リクエスト">

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

<Accordion title="アクション: 移動、クリック、入力、ドラッグ、待機、評価">

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="状態: Cookie、ストレージ、オフライン、ヘッダー、地理位置、デバイス">

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

注記:

- `upload` と `dialog` は**待ち受け設定**呼び出しです。選択ダイアログ/ダイアログをトリガーするクリック/キー押下の前に実行してください。
- `click`/`type`/その他には、`snapshot` からの `ref`（数値 `12`、ロール ref `e12`、または操作可能な ARIA ref `ax12`）が必要です。CSS セレクターはアクションでは意図的にサポートされていません。表示中のビューポート位置だけが信頼できるターゲットである場合は、`click-coords` を使用してください。
- ダウンロード、トレース、アップロードのパスは OpenClaw 一時ルートに制限されます: `/tmp/openclaw{,/downloads,/uploads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）。
- `upload` は `--input-ref` または `--element` を通じてファイル入力を直接設定することもできます。

OpenClaw が置き換え後のタブを証明できる場合、たとえば URL が同じ場合やフォーム送信後に単一の古いタブが
単一の新しいタブになった場合、安定したタブ ID とラベルは Chromium の生ターゲット置換後も維持されます。
生のターゲット ID は引き続き揮発的です。スクリプトでは `tabs` の
`suggestedTargetId` を優先してください。

スナップショットフラグの概要:

- `--format ai`（Playwright ありの場合のデフォルト）: 数値 ref（`aria-ref="<n>"`）付きの AI スナップショット。
- `--format aria`: `axN` ref 付きのアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw はバックエンド DOM ID を使って ref をライブページに紐付け、後続のアクションで使用できるようにします。それ以外の場合は、出力を調査専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトなロールスナップショットプリセット。これをデフォルトにするには、`browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway 構成](/ja-JP/gateway/configuration-reference#browser)を参照）。
- `--interactive`, `--compact`, `--depth`, `--selector` は、`ref=e12` ref 付きのロールスナップショットを強制します。`--frame "<iframe>"` はロールスナップショットを iframe にスコープします。
- `--labels` は、ref ラベルを重ねたビューポート専用スクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `--urls` は、検出されたリンク先を AI スナップショットに追加します。

## スナップショットと ref

OpenClaw は 2 つの「スナップショット」スタイルをサポートします。

- **AI スナップショット（数値 ref）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 ref を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`, `openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` 経由で解決されます。

- **ロールスナップショット（`e12` のようなロール ref）**: `openclaw browser snapshot --interactive`（または `--compact`, `--depth`, `--selector`, `--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）付きのロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`, `openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複には `nth()` を追加）経由で解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたビューポートスクリーンショットが含まれます。
  - リンクテキストが曖昧で、エージェントが具体的な
    移動先を必要とする場合は `--urls` を追加します。

- **ARIA スナップショット（`ax12` のような ARIA ref）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: スナップショットパスが Playwright と Chrome バックエンド DOM ID を通じて
    ref を紐付けられる場合、`openclaw browser click ax12` が動作します。
- Playwright が利用できない場合でも、ARIA スナップショットは
  調査に役立つことがありますが、ref が操作可能でない場合があります。アクション ref が必要な場合は、`--format ai`
  または `--interactive` で再スナップショットしてください。
- 生 CDP フォールバックパスの Docker 証明: `pnpm test:docker:browser-cdp-snapshot` は
  CDP 付きで Chromium を起動し、`browser doctor --deep` を実行して、ロール
  スナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe メタデータが含まれることを検証します。

ref の動作:

- 参照は**ナビゲーション間で安定しません**。何かが失敗した場合は、`snapshot` を再実行して新しい参照を使ってください。
- `/act` は、置換後のタブを証明できる場合、アクションによってトリガーされた置換後の現在の生の `targetId` を返します。
  後続コマンドでは、安定したタブID/ラベルを使い続けてください。
- ロールスナップショットが `--frame` 付きで取得された場合、次のロールスナップショットまで、ロール参照はその iframe にスコープされます。
- 不明または古い `axN` 参照は、Playwright の `aria-ref` セレクターへフォールスルーする代わりに
  即座に失敗します。その場合は同じタブで新しいスナップショットを実行してください。

## 待機の強化機能

時間/テキスト以外にも待機できます。

- URL を待機する（Playwright がサポートする glob）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機する:
  - `openclaw browser wait --load networkidle`
- JS の判定式を待機する:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示状態になるまで待機する:
  - `openclaw browser wait "#main"`

これらは組み合わせられます。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗した場合（例: 「表示されていない」、「strict mode violation」、「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（対話モードではロール参照を推奨）
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright が対象にしているものを確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグには、トレースを記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` はスクリプト作成と構造化ツール用です。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON のロールスナップショットには、`refs` に加えて小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、ツールはペイロードのサイズと密度を推論できます。

## 状態と環境ノブ

これらは「サイトを X のように振る舞わせる」ワークフローに役立ちます。

- Cookie: `cookies`, `cookies set`, `cookies clear`
- ストレージ: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'`（従来の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP 基本認証: `set credentials user pass`（または `--clear`）
- 位置情報: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- メディア: `set media dark|light|no-preference|none`
- タイムゾーン / ロケール: `set timezone ...`, `set locale ...`
- デバイス / ビューポート:
  - `set device "iPhone 14"`（Playwright のデバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザプロファイルにはログイン済みセッションが含まれる場合があります。機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションによって
  これが誘導される可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効にしてください。
- ログインとボット対策に関する注意事項（X/Twitter など）については、[ブラウザログイン + X/Twitter 投稿](/ja-JP/tools/browser-login)を参照してください。
- Gateway/node ホストは非公開にしてください（loopback または tailnet のみ）。
- リモート CDP エンドポイントは強力です。トンネルし、保護してください。

strict mode の例（デフォルトでプライベート/内部宛先をブロック）:

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

- [ブラウザ](/ja-JP/tools/browser) — 概要、設定、プロファイル、セキュリティ
- [ブラウザログイン](/ja-JP/tools/browser-login) — サイトへのサインイン
- [ブラウザ Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザ WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
