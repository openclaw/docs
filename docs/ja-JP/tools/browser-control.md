---
read_when:
    - ローカル制御 API 経由で agent browser をスクリプト化またはデバッグする შემთხვევაში
    - '`openclaw browser` CLI リファレンスをお探しの場合'
    - snapshot と ref を使ったカスタム browser 自動化の追加
summary: OpenClaw の browser 制御 API、CLI リファレンス、およびスクリプト action
title: Browser 制御 API
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

セットアップ、設定、トラブルシューティングについては [Browser](/ja-JP/tools/browser) を参照してください。  
このページは、ローカル制御 HTTP API、`openclaw browser` CLI、およびスクリプトパターン（snapshot、ref、wait、debug フロー）のリファレンスです。

## 制御 API（任意）

ローカル連携専用として、Gateway は小さな loopback HTTP API を公開します。

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

すべての endpoint は `?profile=<name>` を受け付けます。`POST /start?headless=true` は、永続化された browser config を変更せずに、ローカル管理 profile に対する一回限りの headless 起動を要求します。attach-only、remote CDP、existing-session profile は、その browser プロセスを OpenClaw が起動しないため、この override を拒否します。

共有シークレットの gateway auth が設定されている場合、browser HTTP ルートにも auth が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` または、その password を使った HTTP Basic auth

注意:

- この独立した loopback browser API は、trusted-proxy や Tailscale Serve の ID ヘッダーを利用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらの loopback browser ルートはそうした ID 付き mode を継承しません。loopback のみに保ってください。

### `/act` のエラー契約

`POST /act` は、route レベルの検証とポリシー失敗に対して構造化エラーレスポンスを使います。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` が欠落している、または未認識。
- `ACT_INVALID_REQUEST`（HTTP 400）: action ペイロードの正規化または検証に失敗した。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: 非対応 action kind で `selector` が使われた。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: config により `evaluate`（または `wait --fn`）が無効。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: 最上位またはバッチの `targetId` がリクエスト対象と競合する。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: existing-session profile ではその action は未対応。

その他のランタイム失敗では、`code` フィールドなしで `{ "error": "<message>" }` が返ることもあります。

### Playwright 要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素 screenshot、PDF）には Playwright が必要です。Playwright がインストールされていない場合、これらの endpoint は明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA snapshot
- per-tab CDP WebSocket が利用可能な場合の、role 形式アクセシビリティ snapshot（`--interactive`、`--compact`、`--depth`、`--efficient`）。これは検査と ref 発見のためのフォールバックです。Playwright は依然として主要 action engine です。
- per-tab CDP WebSocket が利用可能な場合の、管理された `openclaw` browser のページ screenshot
- `existing-session` / Chrome MCP profile のページ screenshot
- snapshot 出力からの `existing-session` ref ベース screenshot（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- Playwright ネイティブ AI snapshot 形式に依存する AI snapshot
- CSS selector ベースの要素 screenshot（`--element`）
- browser 全体の PDF export

要素 screenshot では `--full-page` も拒否されます。route は `fullPage is not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、バンドル済み browser Plugin runtime 依存関係を修復して `playwright-core` がインストールされるようにし、その後 gateway を再起動してください。パッケージ済みインストールでは `openclaw doctor --fix` を実行してください。Docker では、下記のとおり Chromium browser バイナリもインストールしてください。

#### Docker での Playwright インストール

Gateway が Docker 上で動作している場合、`npx playwright` は使わないでください（npm override の衝突があります）。代わりに、バンドル済み CLI を使ってください。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser ダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば `/home/node/.cache/ms-playwright`）を設定し、`/home/node` が `OPENCLAW_HOME_VOLUME` または bind mount により永続化されていることを確認してください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

小さな loopback 制御サーバーが HTTP リクエストを受け付け、CDP 経由で Chromium ベース browser に接続します。高度な action（click/type/snapshot/PDF）は CDP 上の Playwright 経由で実行されます。Playwright がない場合は、非 Playwright 操作だけが利用可能です。agent からは、下層でローカル/リモート browser や profile が入れ替わっても、1 つの安定したインターフェースに見えます。

## CLI クイックリファレンス

すべてのコマンドは、特定 profile を対象にする `--browser-profile <name>` と、機械可読出力用の `--json` を受け付けます。

<AccordionGroup>

<Accordion title="基本: status、tabs、open/focus/close">

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

<Accordion title="検査: screenshot、snapshot、console、errors、requests">

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

<Accordion title="Actions: navigate、click、type、drag、wait、evaluate">

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

<Accordion title="State: cookies、storage、offline、headers、geo、device">

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

- `upload` と `dialog` は **arm 用** の呼び出しです。file chooser/dialog を発生させる click/press より前に実行してください。
- `click`/`type` などには `snapshot` の `ref` が必要です（数値 `12`、role ref `e12`、または actionable な ARIA ref `ax12`）。action には意図的に CSS selector はサポートされていません。可視 viewport 上の位置だけが信頼できる対象なら `click-coords` を使ってください。
- download、trace、upload のパスは OpenClaw の temp ルートに制限されます: `/tmp/openclaw{,/downloads,/uploads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）。
- `upload` は `--input-ref` または `--element` によって file input を直接設定することもできます。

OpenClaw が置換 tab を証明できる場合、たとえば同じ URL や、フォーム送信後に 1 つの old tab が 1 つの new tab に変わる場合などでは、安定した tab id と label は Chromium の raw-target 置換をまたいで維持されます。raw target id は依然として不安定です。スクリプトでは `tabs` の `suggestedTargetId` を優先してください。

snapshot フラグの概要:

- `--format ai`（Playwright ありのデフォルト）: 数値 ref（`aria-ref="<n>"`）を持つ AI snapshot。
- `--format aria`: `axN` ref を持つアクセシビリティツリー。Playwright が利用可能なら、OpenClaw は ref を backend DOM id とともに live page にバインドするので、後続 action でも使用できます。そうでない場合は、出力は検査専用として扱ってください。
- `--efficient`（または `--mode efficient`）: コンパクトな role snapshot プリセット。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
- `--interactive`、`--compact`、`--depth`、`--selector` は `ref=e12` ref を持つ role snapshot を強制します。`--frame "<iframe>"` は role snapshot を iframe にスコープします。
- `--labels` は、ref ラベルを重ねた viewport 限定 screenshot を追加します（`MEDIA:<path>` を出力）。
- `--urls` は、検出されたリンク先を AI snapshot に追加します。

## Snapshot と ref

OpenClaw は 2 種類の「snapshot」スタイルをサポートします。

- **AI snapshot（数値 ref）**: `openclaw browser snapshot`（デフォルト。`--format ai`）
  - 出力: 数値 ref を含むテキスト snapshot
  - Action: `openclaw browser click 12`、`openclaw browser type 23 "hello"`
  - 内部的には、ref は Playwright の `aria-ref` で解決されます

- **Role snapshot（`e12` のような role ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意で `[nth=1]`）を持つ role ベースの一覧/ツリー
  - Action: `openclaw browser click e12`、`openclaw browser highlight e12`
  - 内部的には、ref は `getByRole(...)`（重複には `nth()` を併用）で解決されます
  - `--labels` を追加すると、`e12` ラベルを重ねた viewport screenshot も含められます
  - リンクテキストが曖昧で、agent が具体的なナビゲーション先を必要とする場合は `--urls` を追加してください

- **ARIA snapshot（`ax12` のような ARIA ref）**: `openclaw browser snapshot --format aria`
  - 出力: 構造化ノードとしてのアクセシビリティツリー
  - Action: `openclaw browser click ax12` は、snapshot パスが Playwright と Chrome backend DOM id を通じて ref をバインドできる場合に機能します
- Playwright が利用できない場合でも、ARIA snapshot は検査には有用ですが、ref は action 可能でないことがあります。action 用 ref が必要な場合は、`--format ai` または `--interactive` で再度 snapshot を取ってください。
- raw-CDP フォールバックパスの Docker 実証: `pnpm test:docker:browser-cdp-snapshot` は CDP 付きで Chromium を起動し、`browser doctor --deep` を実行し、role snapshot にリンク URL、カーソル昇格された click 対象、iframe メタデータが含まれることを検証します。

ref の挙動:

- ref は**ナビゲーションをまたいで安定しません**。何か失敗したら、`snapshot` を再実行して新しい ref を使ってください。
- `/act` は、置換 tab を証明できる場合、action による置換後の現在の raw `targetId` を返します。後続コマンドでは、引き続き安定した tab id/label を使ってください。
- role snapshot を `--frame` 付きで取得した場合、role ref は次の role snapshot までその iframe にスコープされます。
- 未知または古い `axN` ref は、Playwright の `aria-ref` selector にフォールスルーせず、即座に失敗します。その場合は同じ tab で新しい snapshot を取得してください。

## Wait の強化機能

時間やテキストだけでなく、他の条件でも待機できます。

- URL を待機（Playwright の glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- load state を待機:
  - `openclaw browser wait --load networkidle`
- JS predicate を待機:
  - `openclaw browser wait --fn "window.ready===true"`
- selector が visible になるのを待機:
  - `openclaw browser wait "#main"`

これらは組み合わせ可能です。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

action が失敗した場合（例: 「not visible」「strict mode violation」「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（interactive mode では role ref を推奨）
3. それでも失敗する場合: `openclaw browser highlight <ref>` で Playwright が何を対象にしているか確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いデバッグのために trace を記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` はスクリプトや構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON の role snapshot には `refs` と小さな `stats` ブロック（lines/chars/refs/interactive）も含まれるため、ツールはペイロードのサイズや密度を推論できます。

## State と環境ノブ

これらは、「サイトを X のように振る舞わせる」ワークフローで役立ちます。

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（旧式の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP Basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright device preset）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser profile にはログイン済みセッションが含まれる可能性があるため、機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、ページコンテキストで任意の JavaScript を実行します。prompt injection によって誘導される可能性があります。不要な場合は `browser.evaluateEnabled=false` で無効化してください。
- ログインやアンチボット注意事項（X/Twitter など）については [Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node host は非公開に保ってください（loopback または tailnet-only）。
- remote CDP endpoint は強力です。トンネル化して保護してください。

strict mode の例（デフォルトで private/internal 宛先をブロック）:

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

- [Browser](/ja-JP/tools/browser) — 概要、設定、profiles、セキュリティ
- [Browser login](/ja-JP/tools/browser-login) — サイトへのサインイン
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
