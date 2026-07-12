---
read_when:
    - ローカル制御 API を介したエージェントブラウザのスクリプト作成またはデバッグ
    - '`openclaw browser` CLI リファレンスをお探しですか'
    - スナップショットと参照を使用したカスタムブラウザー自動化の追加
summary: OpenClaw ブラウザ制御 API、CLI リファレンス、スクリプト操作
title: ブラウザー制御 API
x-i18n:
    generated_at: "2026-07-12T14:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、設定、トラブルシューティングについては、[ブラウザー](/ja-JP/tools/browser)を参照してください。
このページは、ローカル制御 HTTP API、`openclaw browser`
CLI、およびスクリプト作成パターン（スナップショット、参照、待機、デバッグフロー）のリファレンスです。

## 制御 API（任意）

ローカル統合専用として、Gateway は小規模な loopback HTTP API を公開します。
このスタンドアロンサーバーはオプトインです。HTTP エンドポイントを利用可能にするには、
Gateway サービス環境で環境変数
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` を設定し、Gateway を再起動してください。
この変数がなくても、ブラウザー制御ランタイムは CLI と
エージェントツールを通じて動作しますが、loopback 制御ポートでは何も待ち受けません。

- ステータス/起動/停止: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- プロファイル: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- タブ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- スナップショット/スクリーンショット: `GET /snapshot`, `POST /screenshot`
- アクション: `POST /navigate`, `POST /act`
- フック: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ダウンロード: `POST /download`, `POST /wait/download`
- 権限: `POST /permissions/grant`
- デバッグ: `GET /console`, `POST /pdf`
- デバッグ: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- ネットワーク: `POST /response/body`
- 状態: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 状態: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 設定: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` は、CLI が内部で
`browser tab` サブコマンドに使用するバッチ形式です（`{"action":"new"|"label"|"select"|"close"|"list", ...}`）。
直接スクリプトを作成する場合は、上記の単一目的のタブルートを使用してください。

すべてのエンドポイントは `?profile=<name>` を受け付けます。`POST /start?headless=true` は、
永続化されたブラウザー設定を変更せずに、ローカル管理プロファイルを一度だけヘッドレスで起動するよう要求します。
アタッチ専用、リモート CDP、既存セッションのプロファイルでは、OpenClaw がそれらのブラウザープロセスを起動しないため、
この上書きは拒否されます。

タブエンドポイントでは、`targetId` は互換性のためのフィールド名です。
`GET /tabs` または `POST /tabs/open` から取得した
`suggestedTargetId` を渡すことを推奨します。ラベルや、`t1` のような `tabId`
ハンドルも使用できます。生の CDP ターゲット ID と一意な生の
ターゲット ID プレフィックスも引き続き機能しますが、これらは揮発性の診断用ハンドルです。

共有シークレットによる Gateway 認証が設定されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>`、またはそのパスワードを使用する HTTP Basic 認証

注意:

- このスタンドアロン loopback ブラウザー API は、信頼済みプロキシまたは
  Tailscale Serve の ID ヘッダーを使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらの loopback ブラウザー
  ルートは、その ID を伴うモードを継承しません。loopback のみに限定してください。

### `/act` のエラー契約

`POST /act` は、ルートレベルの検証エラーと
ポリシー違反に対して構造化されたエラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` がないか、認識されません。
- `ACT_INVALID_REQUEST`（HTTP 400）: アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: サポートされていないアクション種別で `selector` が使用されました。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: `evaluate`（または `wait --fn`）が設定で無効化されています。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: トップレベルまたはバッチ内の `targetId` がリクエストのターゲットと競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: 既存セッションのプロファイルでは、そのアクションはサポートされていません。

その他のランタイムエラーでは、`code` フィールドなしで
`{ "error": "<message>" }` が返される場合があります。

### Playwright の要件

一部の機能（ナビゲーション/アクション/AI スナップショット/ロールスナップショット、要素のスクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、これらのエンドポイントは
明確な 501 エラーを返します。

Playwright がなくても動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合の、ロール形式のアクセシビリティスナップショット（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。これは検査と参照の検出に使用する
  フォールバックです。主要なアクションエンジンは引き続き Playwright です。
- タブごとの CDP WebSocket が利用可能な場合の、管理対象 `openclaw` ブラウザーのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` の参照ベースのスクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- Playwright のネイティブ AI スナップショット形式に依存する AI スナップショット
- CSS セレクターによる要素のスクリーンショット（`--element`）
- ブラウザー全体の PDF エクスポート

要素のスクリーンショットでは `--full-page` も拒否されます。ルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` が表示された場合、パッケージ化された
Gateway にコアブラウザーランタイムの依存関係がありません。OpenClaw を再インストールまたは更新してから、
Gateway を再起動してください。Docker の場合は、以下の手順に従って Chromium
ブラウザーバイナリもインストールしてください。

#### Docker での Playwright のインストール

Gateway を Docker で実行している場合は、`npx playwright` を避けてください（npm の上書きと競合します）。
カスタムイメージでは、Chromium をイメージに組み込んでください。

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

既存のイメージでは、代わりにバンドルされた CLI を通じてインストールしてください。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザーのダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（例:
`/home/node/.cache/ms-playwright`）を設定し、`OPENCLAW_HOME_VOLUME` または bind mount を使用して
`/home/node` が永続化されるようにしてください。OpenClaw は Linux 上で永続化された
Chromium を自動検出します。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

小規模な loopback 制御サーバーが HTTP リクエストを受け付け、CDP を介して Chromium ベースのブラウザーに接続します。高度なアクション（クリック/入力/スナップショット/PDF）は、CDP 上の Playwright を通じて実行されます。Playwright がない場合は、Playwright を使用しない操作のみ利用できます。ローカル/リモートのブラウザーやプロファイルが内部で自由に切り替わっても、エージェントからは単一の安定したインターフェースとして見えます。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にする `--browser-profile <name>` と、機械可読な出力を得る `--json` を受け付けます。

<AccordionGroup>

<Accordion title="基本: ステータス、タブ、開く/フォーカス/閉じる">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # ライブスナップショットのプローブを追加
openclaw browser start
openclaw browser start --headless # ローカル管理ブラウザーを一度だけヘッドレスで起動
openclaw browser stop            # アタッチ専用/リモート CDP のエミュレーションもクリア
openclaw browser reset-profile   # プロファイルのブラウザーデータをゴミ箱に移動
openclaw browser tabs
openclaw browser tab             # 現在のタブへのショートカット
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="プロファイル: 一覧、作成、削除">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="検査: スクリーンショット、スナップショット、コンソール、エラー、リクエスト">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # またはロール参照には --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="アクション: ナビゲーション、クリック、入力、ドラッグ、待機、評価">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # またはロール参照には e12
openclaw browser click-coords 120 340        # ビューポート座標
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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
openclaw browser set credentials user pass            # 削除するには --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意:

- エージェント向けの `browser` ツールは、`action=download`（`ref` と
  `path` が必須）および `action=waitfordownload`（`path` は任意）を公開します。どちらも、保存された
  ダウンロード URL、推奨ファイル名、保護されたローカルパスを返します。明示的なダウンロード
  インターセプトは、管理対象の Playwright プロファイルで利用できます。既存セッションの
  プロファイルでは、未サポート操作エラーが返されます。
- アトミックなチューザーアップロードを推奨します。OpenClaw が 1 回のリクエストで準備とクリックを行えるように、アップロード時にトリガーの `--ref` を渡します。後で意図的にトリガーする場合は、パスのみの `upload` も引き続きサポートされます。ファイル入力を直接設定するには、`--input-ref` または `--element` を使用します。`dialog` は準備呼び出しです。ダイアログをトリガーするクリックまたはキー操作の前に実行してください。アクションによってモーダルが開く場合、アクション応答には `blockedByDialog` と `browserState.dialogs.pending` が含まれます。直接応答するには、その `dialogId` を渡します。OpenClaw の外部で処理されたダイアログは、`browserState.dialogs.recent` に表示されます。
- `click`/`type` などには、`snapshot` から取得した `ref`（数値の `12`、ロール ref の `e12`、または操作可能な ARIA ref の `ax12`）が必要です。アクションでは、CSS セレクターは意図的にサポートされていません。表示中のビューポート位置だけが信頼できる対象である場合は、`click-coords` を使用します。
- ダウンロードとトレースのパスは、OpenClaw の一時ルート `/tmp/openclaw{,/downloads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）に制限されます。
- `upload` は、OpenClaw の一時アップロードルートおよび
  OpenClaw が管理する受信メディア内のファイルを受け付けます。管理対象の受信メディアは、
  `media://inbound/<id>`、サンドボックス相対の `media/inbound/<id>`、または管理対象の
  受信メディアディレクトリ内で解決されたパスとして参照できます。ネストされたメディア ref、
  トラバーサル、シンボリックリンク、ハードリンク、および任意のローカルパスは、引き続き拒否されます。
- `upload` は、`--input-ref` または `--element` を使用してファイル入力を直接設定することもできます。

OpenClaw が置換先のタブを特定できる場合、Chromium の生ターゲットが置き換えられても、安定したタブ ID とラベルは維持されます。たとえば、同じ URL に対して旧タブと新タブがそれぞれ 1 つだけ存在する場合や、フォーム送信後に 1 つの旧タブが 1 つの新タブになった場合です。同じ URL が重複していて置換先が曖昧な場合は、新しいハンドルが割り当てられます。生のターゲット ID は引き続き変動するため、スクリプトでは `tabs` の `suggestedTargetId` を優先してください。

スナップショットフラグの概要:

- `--format ai`（Playwright 使用時のデフォルト）: 数値 ref（`aria-ref="<n>"`）を含む AI スナップショット。
- `--format aria`: `axN` ref を含むアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw はバックエンド DOM ID を使用して ref をライブページに関連付けるため、後続のアクションで使用できます。それ以外の場合、出力は確認専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトなロールスナップショットのプリセット。これをデフォルトにするには、`browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway の設定](/ja-JP/gateway/configuration-reference#browser)を参照）。
- `--interactive`、`--compact`、`--depth`、`--selector` は、`ref=e12` ref を含むロールスナップショットを強制します。`--frame "<iframe>"` は、ロールスナップショットの範囲を iframe に限定します。
- Playwright を使用する場合、`--labels` は ref ラベルを重ねたスクリーンショット
  （`MEDIA:<path>` を出力）と、各 ref の境界ボックスを含む `annotations` 配列を追加します。
  `screenshot` では、Playwright ベースのラベルを `--full-page`、`--ref`、
  `--element` と組み合わせて使用できます。`snapshot` では、付随するスクリーンショットは
  ビューポートのみに限定されます。既存セッション/chrome-mcp プロファイルでは、ページの
  スクリーンショットにオーバーレイラベルを描画しますが、`annotations` は返さず、Playwright の
  全ページ/ref/要素プロジェクションヘルパーも使用しません。Playwright または chrome-mcp が
  ない場合、ラベル付きスクリーンショットは利用できません。
- `--urls` は、検出されたリンク先を AI スナップショットに追加します。

## スナップショットと ref

OpenClaw は、3 種類の「スナップショット」形式をサポートします。

- **AI スナップショット（数値 ref）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 ref を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部では、ref は Playwright の `aria-ref` を介して解決されます。

- **ロールスナップショット（`e12` などのロール ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）を含む、ロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部では、ref は `getByRole(...)`（重複時は `nth()` も使用）を介して解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたスクリーンショットが含まれます。
    Playwright ベースのプロファイルでは、ref ごとの境界ボックスメタデータ
    （`annotations[]`）も返されます。
  - リンクテキストが曖昧で、エージェントが具体的な移動先を必要とする場合は、`--urls` を追加します。

- **ARIA スナップショット（`ax12` などの ARIA ref）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: スナップショットのパスで Playwright と Chrome バックエンドの DOM ID を介して
    ref を関連付けられる場合、`openclaw browser click ax12` が機能します。
- Playwright が利用できない場合でも、ARIA スナップショットは
  確認に役立ちますが、ref は操作に使用できないことがあります。アクション用の ref が必要な場合は、
  `--format ai` または `--interactive` でスナップショットを再取得してください。
- 生 CDP フォールバックパスの Docker 検証: `pnpm test:docker:browser-cdp-snapshot` は
  CDP で Chromium を起動し、`browser doctor --deep` を実行して、ロール
  スナップショットにリンク URL、カーソルによってクリック可能と判定された要素、iframe メタデータが含まれることを検証します。

ref の動作:

- ref は**ナビゲーションをまたいで安定しません**。何かが失敗した場合は、`snapshot` を再実行して新しい ref を使用してください。
- `/act` は、アクションによってターゲットが置き換えられ、置換先のタブを特定できる場合、
  現在の生 `targetId` を返します。後続のコマンドでは、引き続き安定したタブ ID/ラベルを使用してください。
- ロールスナップショットを `--frame` 付きで取得した場合、ロール ref は次のロールスナップショットまで、その iframe にスコープされます。
- 不明または古い `axN` ref は、Playwright の `aria-ref` セレクターにフォールスルーせず、
  即座に失敗します。この場合は、同じタブで新しいスナップショットを実行してください。

## 待機機能の強化

時間やテキスト以外の条件も待機できます。

- URL を待機（Playwright の glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機:
  - `openclaw browser wait --load networkidle`
  - 管理対象の `openclaw` および生/リモート CDP プロファイルでサポートされます。`existing-session` ドライバーを使用するプロファイル（デフォルトの `user` プロファイルを含む）は `networkidle` を拒否します。その場合は、`--url`、`--text`、セレクター、または `--fn` による待機を使用してください。
- JS 述語を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示されるまで待機:
  - `openclaw browser wait "#main"`

これらは組み合わせて使用できます。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗した場合（例: 「表示されていない」、「strict mode 違反」、「覆われている」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使用（インタラクティブモードではロール ref を優先）
3. それでも失敗する場合: Playwright が対象としているものを確認するため、`openclaw browser highlight <ref>` を実行
4. ページの動作がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグでは、トレースを記録:
   - `openclaw browser trace start`
   - 問題を再現
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` は、スクリプト処理および構造化ツール向けです。

例:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON のロールスナップショットには `refs` に加えて、小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、ツールはペイロードのサイズと密度を判断できます。

## 状態と環境の調整項目

これらは「サイトを X のように動作させる」ワークフローに役立ちます。

- Cookie: `cookies`、`cookies set`、`cookies clear`
- ストレージ: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'`（または位置引数形式の `set headers '{"X-Debug":"1"}'`）
- HTTP Basic 認証: `set credentials user pass`（または `--clear`）
- 位置情報: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- メディア: `set media dark|light|no-preference|none`
- タイムゾーン / ロケール: `set timezone ...`、`set locale ...`
- デバイス / ビューポート:
  - `set device "iPhone 14"`（Playwright のデバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザプロファイルにはログイン済みセッションが含まれる可能性があるため、機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` および `wait --fn` は、
  ページコンテキスト内で任意の JavaScript を実行します。プロンプトインジェクションによって
  この動作が誘導される可能性があります。不要な場合は、`browser.evaluateEnabled=false` で無効にしてください。
- `openclaw browser evaluate --fn` は、関数ソース、式、または
  文本体を受け付けます。文本体は非同期関数としてラップされるため、返したい値には
  `return` を使用してください。ページ側の関数がデフォルトの評価タイムアウトより
  長い時間を必要とする可能性がある場合は、`--timeout-ms <ms>` を使用します。
- ログインとアンチボットに関する注意事項（X/Twitter など）については、[ブラウザログイン + X/Twitter への投稿](/ja-JP/tools/browser-login)を参照してください。
- Gateway/Node ホストは非公開（ループバックまたは tailnet のみ）にしてください。
- リモート CDP エンドポイントは強力です。トンネルを使用し、保護してください。

strict モードの例（デフォルトでプライベート/内部の宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 任意の完全一致許可
    },
  },
}
```

## 関連項目

- [ブラウザ](/ja-JP/tools/browser) - 概要、設定、プロファイル、セキュリティ
- [ブラウザログイン](/ja-JP/tools/browser-login) - サイトへのサインイン
- [Linux でのブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [WSL2 でのブラウザのトラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
