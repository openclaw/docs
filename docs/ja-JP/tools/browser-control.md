---
read_when:
    - local control API 経由で agent browser をスクリプト化またはデバッグする
    - '`openclaw browser` CLI リファレンスを探している'
    - カスタムブラウザー自動化をスナップショットと refs で追加する
summary: OpenClaw ブラウザー制御 API、CLI リファレンス、スクリプトアクション
title: ブラウザ制御 API
x-i18n:
    generated_at: "2026-07-05T11:52:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72412826cdf61f59fc9470be41834c9a35b0af2dff162fcc401e9d0f5790a2bb
    source_path: tools/browser-control.md
    workflow: 16
---

セットアップ、設定、トラブルシューティングについては、[Browser](/ja-JP/tools/browser) を参照してください。
このページは、ローカル制御 HTTP API、`openclaw browser`
CLI、スクリプトパターン（スナップショット、ref、待機、デバッグフロー）のリファレンスです。

## 制御 API（任意）

ローカル統合専用に、Gateway は小さなループバック HTTP API を公開します。
このスタンドアロンサーバーはオプトインです。HTTP エンドポイントを利用可能にするには、gateway サービス環境で環境変数
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` を設定し、
gateway を再起動します。この変数がない場合でも、ブラウザー制御ランタイムは CLI と
agent tools 経由で動作しますが、ループバック制御ポートでは何も待ち受けません。

- ステータス/開始/停止: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
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

`POST /tabs/action` は、CLI が `browser tab` サブコマンド
（`{"action":"new"|"label"|"select"|"close"|"list", ...}`）に内部で使用するバッチ形式です。
直接スクリプトを書く場合は、上記の単一目的のタブルートを優先してください。

すべてのエンドポイントは `?profile=<name>` を受け付けます。`POST /start?headless=true` は、
永続化されたブラウザー設定を変更せずに、ローカル管理プロファイルの
1 回限りのヘッドレス起動を要求します。OpenClaw はそれらのブラウザープロセスを起動しないため、
アタッチ専用、リモート CDP、既存セッションプロファイルはその上書きを拒否します。

タブエンドポイントでは、`targetId` は互換性のためのフィールド名です。`GET /tabs` または `POST /tabs/open` から得た
`suggestedTargetId` を渡すことを推奨します。ラベルと、`t1` のような `tabId`
ハンドルも受け付けます。生の CDP target id と一意な生の
target-id 接頭辞も引き続き動作しますが、これらは揮発的な診断用ハンドルです。

共有シークレットの gateway 認証が設定されている場合、ブラウザー HTTP ルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードを使った HTTP Basic 認証

注:

- このスタンドアロンのループバックブラウザー API は、trusted-proxy または
  Tailscale Serve の identity header を**消費しません**。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらのループバックブラウザー
  ルートは、それらの identity-bearing モードを継承しません。ループバック専用に保ってください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証と
ポリシー失敗に対して構造化エラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` が欠落しているか認識されません。
- `ACT_INVALID_REQUEST` (HTTP 400): アクションペイロードの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` がサポートされていないアクション種別で使用されました。
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`（または `wait --fn`）が設定で無効化されています。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): トップレベルまたはバッチ内の `targetId` がリクエストターゲットと競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 既存セッションプロファイルではアクションがサポートされていません。

その他のランタイム失敗では、`code` フィールドなしで
`{ "error": "<message>" }` が返る場合があります。

### Playwright 要件

一部の機能（navigate/act/AI スナップショット/role スナップショット、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、それらのエンドポイントは
明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA スナップショット
- タブごとの CDP WebSocket が利用可能な場合の role-style アクセシビリティスナップショット（`--interactive`, `--compact`,
  `--depth`, `--efficient`）。これは検査と ref 検出のための
  フォールバックです。Playwright は引き続き主要な
  アクションエンジンです。
- タブごとの CDP WebSocket が利用可能な場合の管理対象 `openclaw` ブラウザーのページスクリーンショット
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
Gateway にコアブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新してから、
gateway を再起動してください。Docker の場合は、以下に示すように Chromium
ブラウザーバイナリもインストールしてください。

#### Docker Playwright インストール

Gateway を Docker で実行している場合は、`npx playwright` を避けてください（npm override が競合します）。
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
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` または bind mount で永続化されていることを確認してください。OpenClaw は Linux 上で永続化された
Chromium を自動検出します。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

小さなループバック制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベースのブラウザーに接続します。高度なアクション（click/type/snapshot/PDF）は CDP 上の Playwright を経由します。Playwright がない場合は、非 Playwright 操作のみ利用できます。ローカル/リモートブラウザーとプロファイルが背後で自由に入れ替わっても、agent からは 1 つの安定したインターフェイスとして見えます。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にする `--browser-profile <name>` と、機械可読出力用の `--json` を受け付けます。

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # add a live snapshot probe
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser reset-profile   # moves the profile's browser data to Trash
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
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

<Accordion title="Profiles: list, create, delete">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
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
openclaw browser snapshot --out snapshot.txt
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

- `upload` と `dialog` は**準備**呼び出しです。chooser/dialog をトリガーする click/press の前に実行してください。アクションがモーダルを開く場合、アクションレスポンスには `blockedByDialog` と `browserState.dialogs.pending` が含まれます。その `dialogId` を渡して直接応答してください。OpenClaw の外部で処理されたダイアログは `browserState.dialogs.recent` に表示されます。
- `click`/`type`/その他には、`snapshot` からの `ref`（数値 `12`、role ref `e12`、または操作可能な ARIA ref `ax12`）が必要です。CSS セレクターは、アクションでは意図的にサポートされていません。表示中のビューポート位置だけが信頼できるターゲットである場合は、`click-coords` を使用してください。
- ダウンロードと trace のパスは OpenClaw の一時ルート `/tmp/openclaw{,/downloads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）に制限されます。
- `upload` は、OpenClaw の一時 uploads ルートと
  OpenClaw 管理の inbound media からファイルを受け付けます。管理対象の inbound media は
  `media://inbound/<id>`、サンドボックス相対の `media/inbound/<id>`、または管理対象 inbound media ディレクトリ内の解決済み
  パスとして参照できます。ネストした media ref、
  traversal、symlink、hardlink、任意のローカルパスは引き続き拒否されます。
- `upload` は、`--input-ref` または `--element` 経由で file input を直接設定することもできます。

OpenClaw が置換後のタブを証明できる場合、たとえば同じ URL である場合や、フォーム送信後に単一の古いタブが単一の新しいタブになった場合、安定したタブ ID とラベルは Chromium の raw-target 置換後も維持されます。Raw target ID は引き続き揮発的です。スクリプトでは `tabs` の `suggestedTargetId` を優先してください。

Snapshot フラグの概要:

- `--format ai` (Playwright 使用時のデフォルト): 数値 refs (`aria-ref="<n>"`) を含む AI snapshot。
- `--format aria`: `axN` refs を含むアクセシビリティツリー。Playwright が利用可能な場合、OpenClaw は refs をバックエンド DOM ID でライブページにバインドするため、後続アクションで使用できます。それ以外の場合は、出力を検査専用として扱ってください。
- `--efficient` (または `--mode efficient`): コンパクトな role snapshot プリセット。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定します ([Gateway 設定](/ja-JP/gateway/configuration-reference#browser)を参照)。
- `--interactive`、`--compact`、`--depth`、`--selector` は `ref=e12` refs を含む role snapshot を強制します。`--frame "<iframe>"` は role snapshot のスコープを iframe に限定します。
- Playwright 使用時、`--labels` は ref ラベルを重ねたスクリーンショット
  (`MEDIA:<path>` を出力) と、各 ref の境界ボックスを含む `annotations`
  配列を追加します。`screenshot` では、Playwright ベースのラベルは
  `--full-page`、`--ref`、`--element` と連携します。`snapshot` では、付随するスクリーンショットは
  viewport のみに留まります。existing-session/chrome-mcp プロファイルは
  ページスクリーンショットにオーバーレイラベルを描画しますが、`annotations` を返さず、Playwright の
  full-page/ref/element projection helper も使用しません。Playwright または chrome-mcp がない場合、
  ラベル付きスクリーンショットは利用できません。
- `--urls` は検出されたリンク先を AI snapshots に追加します。

## Snapshots と refs

OpenClaw は 2 種類の「snapshot」スタイルをサポートします:

- **AI snapshot (数値 refs)**: `openclaw browser snapshot` (デフォルト、`--format ai`)
  - 出力: 数値 refs を含むテキスト snapshot。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部では、ref は Playwright の `aria-ref` によって解決されます。

- **Role snapshot (`e12` のような role refs)**: `openclaw browser snapshot --interactive` (または `--compact`、`--depth`、`--selector`、`--frame`)
  - 出力: `[ref=e12]` (および任意の `[nth=1]`) を含む role ベースのリスト/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部では、ref は `getByRole(...)` (重複時は `nth()` も使用) によって解決されます。
  - オーバーレイされた `e12` ラベル付きのスクリーンショットを含めるには `--labels` を追加します。Playwright ベースのプロファイルでは、これにより ref ごとの境界ボックスメタデータ
    (`annotations[]`) も返されます。
  - リンクテキストが曖昧で、エージェントが具体的なナビゲーションターゲットを必要とする場合は `--urls` を追加します。

- **ARIA snapshot (`ax12` のような ARIA refs)**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー。
  - アクション: snapshot パスが Playwright と Chrome バックエンド DOM ID を通じて
    ref をバインドできる場合、`openclaw browser click ax12` が機能します。
- Playwright が利用できない場合でも、ARIA snapshots は
  検査には有用なことがありますが、refs はアクション可能でない場合があります。アクション refs が必要な場合は、
  `--format ai` または `--interactive` で再 snapshot してください。
- raw-CDP fallback パスの Docker 証明: `pnpm test:docker:browser-cdp-snapshot` は
  Chromium を CDP で起動し、`browser doctor --deep` を実行し、role
  snapshots にリンク URL、カーソル昇格されたクリック可能要素、iframe メタデータが含まれることを検証します。

Ref の動作:

- Refs は**ナビゲーションをまたいで安定しません**。何かが失敗した場合は、`snapshot` を再実行して新しい ref を使用してください。
- `/act` は、アクションによってトリガーされた置換後の現在の raw `targetId` を、
  置換後のタブを証明できる場合に返します。後続コマンドには安定したタブ ID/ラベルを使い続けてください。
- role snapshot が `--frame` 付きで取得された場合、role refs は次の role snapshot までその iframe にスコープされます。
- 不明または古い `axN` refs は、Playwright の `aria-ref` selector にフォールスルーせず、
  即座に失敗します。その場合は、同じタブで新しい snapshot を実行してください。

## Wait の強化機能

時刻/テキスト以外のものも待機できます:

- URL を待機 (Playwright による glob をサポート):
  - `openclaw browser wait --url "**/dash"`
- load state を待機:
  - `openclaw browser wait --load networkidle`
  - 管理対象の `openclaw` および raw/remote CDP プロファイルでサポートされます。`existing-session` ドライバーを使用するプロファイル (デフォルトの `user` プロファイルを含む) は `networkidle` を拒否します。そこでは `--url`、`--text`、selector、または `--fn` waits を使用してください。
- JS predicate を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- selector が visible になるまで待機:
  - `openclaw browser wait "#main"`

これらは組み合わせることができます:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗した場合 (例: 「not visible」、「strict mode violation」、「covered」):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使用します (interactive mode では role refs を優先)
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright が何をターゲットにしているか確認します
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いデバッグの場合: trace を記録します:
   - `openclaw browser trace start`
   - 問題を再現します
   - `openclaw browser trace stop` (`TRACE:<path>` を出力)

## JSON 出力

`--json` はスクリプトと構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON の role snapshots には `refs` に加えて小さな `stats` ブロック (lines/chars/refs/interactive) が含まれるため、ツールはペイロードサイズと密度を判断できます。

## 状態と環境の調整ノブ

これらは「サイトを X のように動作させる」ワークフローに役立ちます:

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (または positional form `set headers '{"X-Debug":"1"}'`)
- HTTP basic auth: `set credentials user pass` (または `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (または `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright device presets)
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser プロファイルにはログイン済みセッションが含まれる場合があります。機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` および `wait --fn` は、
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションによって
  これが誘導される可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効化してください。
- `openclaw browser evaluate --fn` は関数ソース、式、または
  statement body を受け取ります。Statement bodies は async functions としてラップされるため、
  返したい値には `return` を使用してください。ページ側の関数がデフォルトの evaluate timeout より
  長く必要な場合は `--timeout-ms <ms>` を使用してください。
- ログインと anti-bot メモ (X/Twitter など) については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node ホストは非公開に保ってください (loopback または tailnet-only)。
- Remote CDP endpoints は強力です。トンネルし、保護してください。

Strict-mode の例 (デフォルトで private/internal destinations をブロック):

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

- [Browser](/ja-JP/tools/browser) - 概要、設定、プロファイル、セキュリティ
- [Browser login](/ja-JP/tools/browser-login) - サイトへのサインイン
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
