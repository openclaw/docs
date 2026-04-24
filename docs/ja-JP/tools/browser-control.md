---
read_when:
    - ローカルcontrol API経由でagentブラウザをスクリプト操作またはデバッグする
    - '`openclaw browser` CLIリファレンスを探している場合'
    - snapshotとrefを使ったカスタムブラウザ自動化の追加
summary: OpenClawブラウザ制御API、CLIリファレンス、スクリプト操作
title: ブラウザ制御API
x-i18n:
    generated_at: "2026-04-24T05:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

セットアップ、設定、トラブルシューティングについては、[Browser](/ja-JP/tools/browser) を参照してください。
このページは、ローカルcontrol HTTP API、`openclaw browser`
CLI、およびスクリプトパターン（snapshot、ref、wait、debug flow）のリファレンスです。

## Control API（任意）

ローカル統合専用として、Gatewayは小さなloopback HTTP APIを公開します:

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

すべてのendpointは `?profile=<name>` を受け付けます。

shared-secret Gateway authが設定されている場合、browser HTTP routeにもauthが必要です:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` または、そのpasswordを使ったHTTP Basic auth

注記:

- この独立したloopback browser APIは、trusted-proxy や
  Tailscale Serve identity headerを**消費しません**。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらのloopback browser
  routeはそれらのidentity付きmodeを継承しません。loopback-onlyのままにしてください。

### `/act` error contract

`POST /act` は、route-level validationと
policy failureに対して構造化error responseを使います:

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` が存在しない、または認識されない。
- `ACT_INVALID_REQUEST` (HTTP 400): action payloadのnormalizationまたはvalidationに失敗した。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): 未対応のaction kindで `selector` が使われた。
- `ACT_EVALUATE_DISABLED` (HTTP 403): configにより `evaluate`（または `wait --fn`）が無効化されている。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): top-levelまたはbatched `targetId` がrequest targetと衝突している。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): actionがexisting-session profileではサポートされていない。

その他のruntime failureでは、`code` fieldなしで
`{ "error": "<message>" }` が返る場合もあります。

### Playwright要件

一部の機能（navigate/act/AI snapshot/role snapshot、element screenshot、
PDF）にはPlaywrightが必要です。Playwrightがインストールされていない場合、それらのendpointは
明確な501 errorを返します。

Playwrightなしでも動作するもの:

- ARIA snapshot
- per-tab CDP
  WebSocketが利用可能な場合の、管理対象 `openclaw` browserのpage screenshot
- `existing-session` / Chrome MCP profileのpage screenshot
- snapshot outputからの `existing-session` のrefベースscreenshot（`--ref`）

引き続きPlaywrightが必要なもの:

- `navigate`
- `act`
- AI snapshot / role snapshot
- CSS-selectorによるelement screenshot（`--element`）
- full browser PDF export

element screenshotは `--full-page` も拒否します。routeは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、
`playwright-core` がインストールされるよう、同梱browser plugin runtime dependencyを修復し、
その後Gatewayを再起動してください。packaged installでは `openclaw doctor --fix` を実行してください。
Dockerでは、下記のようにChromium browser binaryもインストールしてください。

#### Docker Playwright install

GatewayがDockerで動いている場合、`npx playwright` は避けてください（npm override conflict）。
代わりに同梱CLIを使ってください:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser downloadを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` またはbind mountで永続化されていることを確認してください。[Docker](/ja-JP/install/docker) を参照してください。

## 動作の仕組み（内部）

小さなloopback control serverがHTTP requestを受け取り、CDP経由でChromium系browserに接続します。高度なaction（click/type/snapshot/PDF）は、CDP上のPlaywright経由で処理されます。Playwrightがない場合は、非Playwright操作だけが利用可能です。agentからは1つの安定したinterfaceが見え、ローカル/リモートbrowserやprofileはその下で自由に切り替わります。

## CLIクイックリファレンス

すべてのcommandは、特定profileを対象にする `--browser-profile <name>` と、machine-readable outputのための `--json` を受け付けます。

<AccordionGroup>

<Accordion title="基本: status、tabs、open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # attach-only/remote CDPのemulationもクリアする
openclaw browser tabs
openclaw browser tab             # 現在のtabへのshortcut
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot、snapshot、console、errors、requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # またはrole refなら --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
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
openclaw browser click 12 --double           # またはrole refなら e12
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
openclaw browser set credentials user pass            # 削除するには --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注記:

- `upload` と `dialog` は **arming** callです。file chooser/dialogを発生させるclick/pressの前に実行してください。
- `click` / `type` / などには、`snapshot` からの `ref`（数値の `12` またはrole refの `e12`）が必要です。actionに対するCSS selectorは意図的にサポートされていません。
- download、trace、upload pathはOpenClaw temp rootに制限されます: `/tmp/openclaw{,/downloads,/uploads}`（fallback: `${os.tmpdir()}/openclaw/...`）。
- `upload` は、`--input-ref` または `--element` でfile inputを直接設定することもできます。

snapshot flagの要点:

- `--format ai`（Playwrightありの場合のデフォルト）: 数値ref（`aria-ref="<n>"`）付きのAI snapshot。
- `--format aria`: accessibility tree。refなし。inspection専用。
- `--efficient`（または `--mode efficient`）: compact role snapshot preset。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
- `--interactive`, `--compact`, `--depth`, `--selector` はrole snapshotを強制し、`ref=e12` refを使います。`--frame "<iframe>"` はrole snapshotを特定iframeに限定します。
- `--labels` は、ref labelを重ねたviewport-only screenshotを追加します（`MEDIA:<path>` を表示します）。

## Snapshotとref

OpenClawは2種類の「snapshot」スタイルをサポートします:

- **AI snapshot（数値ref）**: `openclaw browser snapshot`（デフォルト; `--format ai`）
  - 出力: 数値refを含むtext snapshot。
  - Action: `openclaw browser click 12`, `openclaw browser type 23 "hello"`。
  - 内部的には、refはPlaywrightの `aria-ref` 経由で解決されます。

- **Role snapshot（`e12` のようなrole ref）**: `openclaw browser snapshot --interactive`（または `--compact`, `--depth`, `--selector`, `--frame`）
  - 出力: `[ref=e12]`（および任意で `[nth=1]`）を持つroleベースのlist/tree。
  - Action: `openclaw browser click e12`, `openclaw browser highlight e12`。
  - 内部的には、refは `getByRole(...)`（重複時は `nth()` を追加）で解決されます。
  - `--labels` を追加すると、重ねた `e12` label付きviewport screenshotが含まれます。

refの挙動:

- refは**navigationをまたいで安定しません**。何か失敗したら、`snapshot` を再実行して新しいrefを使ってください。
- role snapshotを `--frame` 付きで取った場合、role refは次のrole snapshotまでそのiframeにスコープされます。

## Waitの強化機能

time/text以外にも待機できます:

- URLを待つ（Playwright対応のglobをサポート）:
  - `openclaw browser wait --url "**/dash"`
- load stateを待つ:
  - `openclaw browser wait --load networkidle`
- JS predicateを待つ:
  - `openclaw browser wait --fn "window.ready===true"`
- selectorが可視になるのを待つ:
  - `openclaw browser wait "#main"`

これらは組み合わせ可能です:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug workflow

actionが失敗したとき（例: 「not visible」、「strict mode violation」、「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（interactive modeではrole refを推奨）
3. それでも失敗する場合: `openclaw browser highlight <ref>` でPlaywrightが何を対象にしているか確認する
4. pageの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いdebugにはtraceを記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を表示）

## JSON出力

`--json` はスクリプトや構造化tooling向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSONのrole snapshotには、`refs` に加えて小さな `stats` block（lines/chars/refs/interactive）が含まれるため、tool側でpayload sizeや密度を判断できます。

## Stateとenvironmentのノブ

これらは「サイトをXのように振る舞わせる」workflowで便利です:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（レガシーの `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP Basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright device preset）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser profileにはログイン済みsessionが含まれることがあるため、機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn`
  は、page context内で任意のJavaScriptを実行します。prompt injectionにより
  これが誘導される可能性があります。不要であれば `browser.evaluateEnabled=false` で無効化してください。
- ログインやanti-botに関する注記（X/Twitter など）については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node hostはprivate（loopbackまたはtailnet-only）に保ってください。
- リモートCDP endpointは強力です。tunnel化し、保護してください。

strict-modeの例（デフォルトでprivate/internal宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 任意の完全一致allow
    },
  },
}
```

## 関連

- [Browser](/ja-JP/tools/browser) — 概要、設定、profile、セキュリティ
- [Browser login](/ja-JP/tools/browser-login) — サイトへのサインイン
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
