---
read_when:
    - ローカル制御 API を介したエージェントブラウザーのスクリプト操作またはデバッグ
    - '`openclaw browser` CLI リファレンスをお探しですか'
    - スナップショットと参照を使ったカスタムブラウザー自動化の追加
summary: OpenClaw のブラウザー制御 API、CLI リファレンス、スクリプティングアクション
title: ブラウザー制御 API
x-i18n:
    generated_at: "2026-05-06T05:19:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、設定、トラブルシューティングについては、[ブラウザー](/ja-JP/tools/browser)を参照してください。
このページは、ローカル制御 HTTP API、`openclaw browser` CLI、スクリプトパターン（スナップショット、refs、待機、デバッグフロー）のリファレンスです。

## 制御 API（任意）

ローカル統合専用に、Gateway は小さなループバック HTTP API を公開します。

- ステータス/起動/停止: `GET /`, `POST /start`, `POST /stop`
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

すべてのエンドポイントは `?profile=<name>` を受け付けます。`POST /start?headless=true` は、永続化されたブラウザー設定を変更せずに、ローカル管理プロファイルの1回限りのヘッドレス起動を要求します。アタッチ専用、リモート CDP、既存セッションのプロファイルでは、OpenClaw がそれらのブラウザープロセスを起動しないため、このオーバーライドは拒否されます。

共有シークレットの Gateway 認証が設定されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使った HTTP Basic 認証

注意:

- このスタンドアロンのループバックブラウザー API は、trusted-proxy または Tailscale Serve の ID ヘッダーを**使用しません**。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらのループバックブラウザールートは、それらの ID を含むモードを継承しません。ループバック専用に保ってください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証およびポリシー失敗に構造化エラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` が欠落しているか認識されません。
- `ACT_INVALID_REQUEST` (HTTP 400): アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): サポートされていないアクション種別で `selector` が使用されました。
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`（または `wait --fn`）が設定で無効化されています。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): トップレベルまたはバッチ内の `targetId` がリクエストターゲットと競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 既存セッションプロファイルではアクションがサポートされていません。

その他の実行時失敗は、`code` フィールドなしで `{ "error": "<message>" }` を返す場合があります。

### Playwright 要件

一部の機能（navigate/act/AI スナップショット/ロールスナップショット、要素スクリーンショット、PDF）には Playwright が必要です。Playwright がインストールされていない場合、それらのエンドポイントは明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合のロール形式のアクセシビリティスナップショット（`--interactive`、`--compact`、`--depth`、`--efficient`）。これは検査と ref 発見のためのフォールバックです。Playwright は引き続き主要なアクションエンジンです。
- タブごとの CDP WebSocket が利用可能な場合の、管理対象 `openclaw` ブラウザーのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` ref ベーススクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- Playwright のネイティブ AI スナップショット形式に依存する AI スナップショット
- CSS セレクターによる要素スクリーンショット（`--element`）
- ブラウザー全体の PDF エクスポート

要素スクリーンショットでは `--full-page` も拒否されます。ルートは `fullPage is not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` が表示される場合、パッケージ化された Gateway にコアブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新してから、gateway を再起動してください。Docker の場合は、以下のように Chromium ブラウザーバイナリもインストールしてください。

#### Docker Playwright インストール

Gateway を Docker で実行している場合は、`npx playwright`（npm override の競合）を避けてください。代わりにバンドルされた CLI を使用します。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザーのダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（例: `/home/node/.cache/ms-playwright`）を設定し、`/home/node` が `OPENCLAW_HOME_VOLUME` またはバインドマウントで永続化されるようにしてください。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

小さなループバック制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベースのブラウザーに接続します。高度なアクション（click/type/snapshot/PDF）は CDP の上で Playwright を介して実行されます。Playwright がない場合は、非 Playwright 操作のみが利用できます。エージェントからは1つの安定したインターフェースが見え、その下でローカル/リモートブラウザーとプロファイルを自由に差し替えられます。

## CLI クイックリファレンス

すべてのコマンドは特定のプロファイルを対象にするための `--browser-profile <name>` と、機械可読出力のための `--json` を受け付けます。

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

<Accordion title="検査: スクリーンショット、スナップショット、コンソール、エラー、リクエスト">

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

<Accordion title="状態: Cookie、ストレージ、オフライン、ヘッダー、位置情報、デバイス">

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

注意:

- `upload` と `dialog` は**準備**呼び出しです。chooser/dialog をトリガーするクリック/キー押下の前に実行してください。
- `click`/`type` などには `snapshot` からの `ref`（数値 `12`、ロール ref `e12`、またはアクション可能な ARIA ref `ax12`）が必要です。アクションに CSS セレクターは意図的にサポートされていません。表示中のビューポート位置だけが信頼できるターゲットである場合は、`click-coords` を使用してください。
- ダウンロード、トレース、アップロードのパスは OpenClaw の一時ルート `/tmp/openclaw{,/downloads,/uploads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）に制限されます。
- `upload` は `--input-ref` または `--element` を介してファイル入力を直接設定することもできます。

OpenClaw が置換タブを証明できる場合、たとえば同じ URL、またはフォーム送信後に1つの古いタブが1つの新しいタブになった場合には、Chromium の raw-target 置換後も安定したタブ ID とラベルが維持されます。raw target ID は引き続き変動します。スクリプトでは `tabs` の `suggestedTargetId` を優先してください。

スナップショットフラグ早見表:

- `--format ai`（Playwright 使用時のデフォルト）: 数値 refs（`aria-ref="<n>"`）付きの AI スナップショット。
- `--format aria`: `axN` refs 付きのアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw は backend DOM ids を使って refs をライブページにバインドするため、後続アクションで使用できます。それ以外の場合は、出力を検査専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトなロールスナップショットプリセット。これをデフォルトにするには、`browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway 設定](/ja-JP/gateway/configuration-reference#browser)を参照）。
- `--interactive`、`--compact`、`--depth`、`--selector` は、`ref=e12` refs 付きのロールスナップショットを強制します。`--frame "<iframe>"` はロールスナップショットを iframe にスコープします。
- `--labels` は、ref ラベルを重ねたビューポート専用スクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `--urls` は、検出されたリンク先を AI スナップショットに追加します。

## スナップショットと refs

OpenClaw は2種類の「スナップショット」形式をサポートします。

- **AI スナップショット（数値 refs）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 refs を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` 経由で解決されます。

- **ロールスナップショット（`e12` のようなロール refs）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）付きのロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複には `nth()` を追加）で解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたビューポートスクリーンショットを含めます。
  - リンクテキストが曖昧で、エージェントが具体的なナビゲーションターゲットを必要とする場合は、`--urls` を追加します。

- **ARIA スナップショット（`ax12` のような ARIA refs）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: スナップショットパスが Playwright と Chrome backend DOM ids を通じて ref をバインドできる場合、`openclaw browser click ax12` が動作します。
- Playwright が利用できない場合でも、ARIA スナップショットは検査に役立つことがありますが、refs はアクション可能でない場合があります。アクション refs が必要な場合は、`--format ai` または `--interactive` で再スナップショットしてください。
- raw-CDP フォールバックパスの Docker 証明: `pnpm test:docker:browser-cdp-snapshot` は CDP 付きで Chromium を起動し、`browser doctor --deep` を実行して、ロールスナップショットにリンク URL、カーソル昇格されたクリック可能要素、iframe メタデータが含まれることを検証します。

Ref の挙動:

- 参照は**ナビゲーションをまたいで安定しません**。何かが失敗した場合は、`snapshot` を再実行し、新しい参照を使用してください。
- `/act` は、置換先タブを証明できる場合、アクションによって発生した置換後の現在の生の `targetId` を返します。
  後続のコマンドには、安定したタブ ID/ラベルを使い続けてください。
- ロールスナップショットが `--frame` 付きで取得された場合、ロール参照は次のロールスナップショットまで、その iframe にスコープされます。
- 不明または古くなった `axN` 参照は、Playwright の `aria-ref` セレクターにフォールスルーするのではなく、すばやく失敗します。
  その場合は、同じタブで新しいスナップショットを実行してください。

## 待機の強化機能

時間/テキスト以外にも待機できます。

- URL を待機（Playwright による glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機:
  - `openclaw browser wait --load networkidle`
- JS 述語を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示状態になるのを待機:
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
2. `click <ref>` / `type <ref>` を使用します（インタラクティブモードではロール参照を優先）
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright がターゲットにしているものを確認します
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグの場合: トレースを記録します:
   - `openclaw browser trace start`
   - 問題を再現します
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

JSON のロールスナップショットには、`refs` に加えて小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、ツールはペイロードサイズと密度について判断できます。

## 状態と環境の調整項目

これらは「サイトを X のように振る舞わせる」ワークフローに役立ちます。

- Cookie: `cookies`、`cookies set`、`cookies clear`
- ストレージ: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'`（レガシーの `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP ベーシック認証: `set credentials user pass`（または `--clear`）
- 位置情報: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- メディア: `set media dark|light|no-preference|none`
- タイムゾーン / ロケール: `set timezone ...`、`set locale ...`
- デバイス / ビューポート:
  - `set device "iPhone 14"`（Playwright デバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser プロファイルにはログイン済みセッションが含まれる場合があります。機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションにより、
  これが誘導される可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効にしてください。
- ログインとボット対策メモ（X/Twitter など）については、[ブラウザログイン + X/Twitter 投稿](/ja-JP/tools/browser-login) を参照してください。
- Gateway/Node ホストはプライベートに保ってください（ループバックまたは tailnet-only）。
- リモート CDP エンドポイントは強力です。トンネルし、保護してください。

厳格モードの例（デフォルトでプライベート/内部宛先をブロック）:

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
