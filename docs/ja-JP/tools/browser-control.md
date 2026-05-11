---
read_when:
    - ローカル制御 API 経由でエージェントブラウザーをスクリプト化またはデバッグする
    - '`openclaw browser` CLI リファレンスを探す'
    - スナップショットと参照を使ったカスタムブラウザー自動化の追加
summary: OpenClaw のブラウザー制御 API、CLI リファレンス、およびスクリプト操作
title: ブラウザー制御 API
x-i18n:
    generated_at: "2026-05-11T20:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、設定、トラブルシューティングについては、[ブラウザー](/ja-JP/tools/browser)を参照してください。
このページは、ローカル制御 HTTP API、`openclaw browser`
CLI、およびスクリプト作成パターン（スナップショット、ref、待機、デバッグフロー）のリファレンスです。

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

すべてのエンドポイントは `?profile=<name>` を受け付けます。`POST /start?headless=true` は、永続化された
ブラウザー設定を変更せずに、ローカル管理プロファイル向けの
一度限りのヘッドレス起動を要求します。attach-only、リモート CDP、既存セッションのプロファイルは、
OpenClaw がそれらのブラウザープロセスを起動しないため、そのオーバーライドを拒否します。

共有シークレットの Gateway 認証が設定されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使った HTTP Basic 認証

注:

- このスタンドアロンのループバックブラウザー API は、trusted-proxy または
  Tailscale Serve のアイデンティティヘッダーを使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらのループバックブラウザー
  ルートは、アイデンティティを運ぶそれらのモードを継承しません。ループバック専用に保ってください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証と
ポリシー失敗に対して構造化されたエラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` が欠落しているか認識されません。
- `ACT_INVALID_REQUEST` (HTTP 400): アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` がサポートされていないアクション種別で使用されました。
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`（または `wait --fn`）は設定で無効化されています。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): トップレベルまたはバッチ内の `targetId` がリクエスト対象と競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): アクションは既存セッションのプロファイルではサポートされていません。

その他の実行時失敗は、`code` フィールドなしで
`{ "error": "<message>" }` を返す場合があります。

### Playwright 要件

一部の機能（navigate/act/AI スナップショット/ロールスナップショット、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、それらのエンドポイントは
明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合のロール形式アクセシビリティスナップショット（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。これは
  検査と ref 検出のためのフォールバックです。Playwright は引き続き主要な
  アクションエンジンです。
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

`Playwright is not available in this gateway build` が表示される場合、パッケージ化された
Gateway にコアブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新し、
Gateway を再起動してください。Docker の場合は、以下のように Chromium
ブラウザーバイナリもインストールしてください。

#### Docker Playwright インストール

Gateway を Docker で実行している場合は、`npx playwright` を避けてください（npm オーバーライドと競合します）。
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
`/home/node/.cache/ms-playwright`）を設定し、`OPENCLAW_HOME_VOLUME` または bind mount 経由で
`/home/node` が永続化されるようにします。OpenClaw は Linux 上で永続化された
Chromium を自動検出します。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

小さなループバック制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベースのブラウザーに接続します。高度なアクション（クリック/入力/スナップショット/PDF）は CDP 上の Playwright を経由します。Playwright がない場合は、Playwright 以外の操作のみ利用できます。エージェントは 1 つの安定したインターフェイスを参照し、その下でローカル/リモートブラウザーとプロファイルが自由に入れ替わります。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするための `--browser-profile <name>` と、機械可読出力用の `--json` を受け付けます。

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

<Accordion title="アクション: navigate、クリック、入力、ドラッグ、待機、evaluate">

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

注:

- `upload` と `dialog` は**準備**呼び出しです。chooser/dialog をトリガーするクリック/キー押下の前に実行してください。
- `click`/`type`/その他には、`snapshot` からの `ref`（数値 `12`、ロール ref `e12`、または操作可能な ARIA ref `ax12`）が必要です。CSS セレクターは、アクションでは意図的にサポートされていません。表示中の viewport 位置だけが信頼できる対象である場合は、`click-coords` を使用してください。
- ダウンロード、トレース、アップロードのパスは、OpenClaw の一時ルートに制限されます: `/tmp/openclaw{,/downloads,/uploads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）。
- `upload` は `--input-ref` または `--element` 経由でファイル入力を直接設定することもできます。

OpenClaw が置き換え先のタブを証明できる場合、安定したタブ ID とラベルは Chromium の raw-target 置換をまたいで維持されます。
たとえば、同じ URL、またはフォーム送信後に 1 つの古いタブが
1 つの新しいタブになった場合です。raw target ID は依然として揮発的です。スクリプトでは
`tabs` の `suggestedTargetId` を優先してください。

スナップショットフラグの概要:

- `--format ai`（Playwright 使用時のデフォルト）: 数値 ref（`aria-ref="<n>"`）付きの AI スナップショット。
- `--format aria`: `axN` ref 付きのアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw は backend DOM ID を使って ref をライブページにバインドし、後続アクションで使用できるようにします。利用できない場合は、出力を検査専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトなロールスナップショットプリセット。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway 設定](/ja-JP/gateway/configuration-reference#browser)を参照）。
- `--interactive`、`--compact`、`--depth`、`--selector` は `ref=e12` ref 付きのロールスナップショットを強制します。`--frame "<iframe>"` はロールスナップショットを iframe にスコープします。
- `--labels` は、ref ラベルをオーバーレイした viewport のみのスクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `--urls` は、検出されたリンク先を AI スナップショットに追加します。

## スナップショットと ref

OpenClaw は 2 つの「スナップショット」形式をサポートします。

- **AI スナップショット（数値 ref）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 ref を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部では、ref は Playwright の `aria-ref` 経由で解決されます。

- **ロールスナップショット（`e12` のようなロール ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）付きのロールベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部では、ref は `getByRole(...)`（重複には `nth()` を追加）経由で解決されます。
  - viewport スクリーンショットにオーバーレイされた `e12` ラベルを含めるには、`--labels` を追加します。
  - リンクテキストが曖昧で、エージェントが具体的な
    ナビゲーション対象を必要とする場合は、`--urls` を追加します。

- **ARIAスナップショット（`ax12` のような ARIA 参照）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: スナップショットパスが Playwright と Chrome バックエンドの DOM ID を通じて
    参照をバインドできる場合、`openclaw browser click ax12` が機能します。
- Playwright を利用できない場合でも、ARIA スナップショットは
  調査に役立つことがありますが、参照はアクション可能でない場合があります。アクション参照が必要な場合は、
  `--format ai` または `--interactive` で再度スナップショットを取得してください。
- raw-CDP フォールバックパスの Docker 証明: `pnpm test:docker:browser-cdp-snapshot` は
  CDP で Chromium を起動し、`browser doctor --deep` を実行し、ロール
  スナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe メタデータが含まれることを検証します。

参照の挙動:

- 参照は**ナビゲーションをまたいで安定しません**。何かが失敗した場合は、`snapshot` を再実行して新しい参照を使用してください。
- `/act` は、置き換えタブを証明できる場合、アクションによってトリガーされた置き換え後の
  現在の raw `targetId` を返します。後続コマンドには、安定したタブ ID/ラベルを引き続き使用してください。
- ロールスナップショットが `--frame` 付きで取得された場合、ロール参照は次のロールスナップショットまでその iframe にスコープされます。
- 不明または古い `axN` 参照は、Playwright の `aria-ref` セレクターへフォールスルーする代わりに
  即座に失敗します。その場合は、同じタブで新しいスナップショットを実行してください。

## 待機の強化機能

時間/テキスト以外にも待機できます:

- URL を待機（Playwright による glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機:
  - `openclaw browser wait --load networkidle`
- JS 述語を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示されるまで待機:
  - `openclaw browser wait "#main"`

これらは組み合わせられます:

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
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright が対象としているものを確認します
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いデバッグには、トレースを記録します:
   - `openclaw browser trace start`
   - 問題を再現します
   - `openclaw browser trace stop`（`TRACE:<path>` を出力します）

## JSON 出力

`--json` はスクリプトと構造化ツール用です。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON のロールスナップショットには、`refs` に加えて小さな `stats` ブロック（lines/chars/refs/interactive）が含まれるため、ツールはペイロードサイズと密度を推論できます。

## 状態と環境の調整項目

これらは「サイトを X のように動作させる」ワークフローに役立ちます:

- Cookie: `cookies`、`cookies set`、`cookies clear`
- ストレージ: `storage local|session get|set|clear`
- オフライン: `set offline on|off`
- ヘッダー: `set headers --headers-json '{"X-Debug":"1"}'`（レガシーの `set headers --json '{"X-Debug":"1"}'` も引き続きサポートされます）
- HTTP ベーシック認証: `set credentials user pass`（または `--clear`）
- 位置情報: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- メディア: `set media dark|light|no-preference|none`
- タイムゾーン / ロケール: `set timezone ...`、`set locale ...`
- デバイス / ビューポート:
  - `set device "iPhone 14"`（Playwright のデバイスプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザープロファイルにはログイン済みセッションが含まれる場合があります。機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、
  ページコンテキスト内で任意の JavaScript を実行します。プロンプトインジェクションが
  これを誘導する可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効化してください。
- ログインとボット対策に関する注意事項（X/Twitter など）については、[ブラウザーログイン + X/Twitter 投稿](/ja-JP/tools/browser-login)を参照してください。
- Gateway/node ホストは非公開に保ってください（ループバックまたは tailnet のみ）。
- リモート CDP エンドポイントは強力です。トンネル化して保護してください。

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

- [ブラウザー](/ja-JP/tools/browser) - 概要、設定、プロファイル、セキュリティ
- [ブラウザーログイン](/ja-JP/tools/browser-login) - サイトへのサインイン
- [ブラウザー Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザー WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
