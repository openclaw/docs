---
read_when:
    - 透過本機控制 API 編寫腳本或偵錯代理瀏覽器
    - 正在尋找 `openclaw browser` 命令列介面參考
    - 新增含快照與 refs 的自訂瀏覽器自動化
summary: OpenClaw 瀏覽器控制 API、命令列介面參考與指令碼動作
title: 瀏覽器控制 API
x-i18n:
    generated_at: "2026-07-05T11:44:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72412826cdf61f59fc9470be41834c9a35b0af2dff162fcc401e9d0f5790a2bb
    source_path: tools/browser-control.md
    workflow: 16
---

For setup, configuration, and troubleshooting, see [Browser](/zh-TW/tools/browser).
This page is the reference for the local control HTTP API, the `openclaw browser`
CLI, and scripting patterns (snapshots, refs, waits, debug flows).

## Control API (optional)

For local integrations only, the Gateway exposes a small loopback HTTP API.
This standalone server is opt-in — set the environment variable
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` in the gateway service environment
and restart the gateway before the HTTP endpoints become available. Without
this variable the browser control runtime still works through the CLI and
agent tools, but nothing listens on the loopback control port.

- Status/start/stop: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profiles: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Permissions: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` is the batched form the CLI uses internally for
`browser tab` subcommands (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
prefer the single-purpose tab routes above when scripting directly.

All endpoints accept `?profile=<name>`. `POST /start?headless=true` requests a
one-shot headless launch for local managed profiles without changing persisted
browser config; attach-only, remote CDP, and existing-session profiles reject
that override because OpenClaw does not launch those browser processes.

For tab endpoints, `targetId` is the compatibility field name. Prefer passing
`suggestedTargetId` from `GET /tabs` or `POST /tabs/open`; labels and `tabId`
handles such as `t1` are also accepted. Raw CDP target ids and unique raw
target-id prefixes still work, but they are volatile diagnostic handles.

If shared-secret gateway auth is configured, browser HTTP routes require auth too:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` or HTTP Basic auth with that password

Notes:

- This standalone loopback browser API does **not** consume trusted-proxy or
  Tailscale Serve identity headers.
- If `gateway.auth.mode` is `none` or `trusted-proxy`, these loopback browser
  routes do not inherit those identity-bearing modes; keep them loopback-only.

### `/act` error contract

`POST /act` uses a structured error response for route-level validation and
policy failures:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Current `code` values:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` is missing or unrecognized.
- `ACT_INVALID_REQUEST` (HTTP 400): action payload failed normalization or validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` was used with an unsupported action kind.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (or `wait --fn`) is disabled by config.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): top-level or batched `targetId` conflicts with request target.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action is not supported for existing-session profiles.

Other runtime failures may still return `{ "error": "<message>" }` without a
`code` field.

### Playwright requirement

Some features (navigate/act/AI snapshot/role snapshot, element screenshots,
PDF) require Playwright. If Playwright isn't installed, those endpoints return
a clear 501 error.

What still works without Playwright:

- ARIA snapshots
- Role-style accessibility snapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`) when a per-tab CDP WebSocket is available. This is
  a fallback for inspection and ref discovery; Playwright remains the primary
  action engine.
- Page screenshots for the managed `openclaw` browser when a per-tab CDP
  WebSocket is available
- Page screenshots for `existing-session` / Chrome MCP profiles
- `existing-session` ref-based screenshots (`--ref`) from snapshot output

What still needs Playwright:

- `navigate`
- `act`
- AI snapshots that depend on Playwright's native AI snapshot format
- CSS-selector element screenshots (`--element`)
- full browser PDF export

Element screenshots also reject `--full-page`; the route returns `fullPage is
not supported for element screenshots`.

If you see `Playwright is not available in this gateway build`, the packaged
Gateway is missing the core browser runtime dependency. Reinstall or update
OpenClaw, then restart the gateway. For Docker, also install the Chromium
browser binaries as shown below.

#### Docker Playwright install

If your Gateway runs in Docker, avoid `npx playwright` (npm override conflicts).
For custom images, bake Chromium into the image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

For an existing image, install through the bundled CLI instead:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

To persist browser downloads, set `PLAYWRIGHT_BROWSERS_PATH` (for example,
`/home/node/.cache/ms-playwright`) and make sure `/home/node` is persisted via
`OPENCLAW_HOME_VOLUME` or a bind mount. OpenClaw auto-detects the persisted
Chromium on Linux. See [Docker](/zh-TW/install/docker).

## How it works (internal)

A small loopback control server accepts HTTP requests and connects to Chromium-based browsers via CDP. Advanced actions (click/type/snapshot/PDF) go through Playwright on top of CDP; when Playwright is missing, only non-Playwright operations are available. The agent sees one stable interface while local/remote browsers and profiles swap freely underneath.

## CLI quick reference

All commands accept `--browser-profile <name>` to target a specific profile, and `--json` for machine-readable output.

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

Notes:

- `upload` and `dialog` are **arming** calls; run them before the click/press that triggers the chooser/dialog. If an action opens a modal, the action response includes `blockedByDialog` and `browserState.dialogs.pending`; pass that `dialogId` to respond directly. Dialogs handled outside OpenClaw appear under `browserState.dialogs.recent`.
- `click`/`type`/etc require a `ref` from `snapshot` (numeric `12`, role ref `e12`, or actionable ARIA ref `ax12`). CSS selectors are intentionally not supported for actions. Use `click-coords` when the visible viewport position is the only reliable target.
- Download and trace paths are constrained to OpenClaw temp roots: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` accepts files from the OpenClaw temp uploads root and
  OpenClaw-managed inbound media. Managed inbound media can be referenced as
  `media://inbound/<id>`, sandbox-relative `media/inbound/<id>`, or a resolved
  path inside the managed inbound media directory. Nested media refs,
  traversal, symlinks, hardlinks, and arbitrary local paths are still rejected.
- `upload` can also set file inputs directly via `--input-ref` or `--element`.

穩定的分頁 ID 和標籤會在 Chromium 原始目標替換時保留下來，只要 OpenClaw
能證明替換後的分頁，例如相同 URL，或表單提交後單一舊分頁變成單一新分頁。原始目標 ID 仍然不穩定；在腳本中請優先使用 `tabs` 的
`suggestedTargetId`。

快照旗標速覽：

- `--format ai`（搭配 Playwright 時為預設）：含數字參照的 AI 快照（`aria-ref="<n>"`）。
- `--format aria`：含 `axN` 參照的無障礙樹。當 Playwright 可用時，OpenClaw 會使用後端 DOM ID 將參照綁定到即時頁面，讓後續動作可以使用它們；否則請將輸出視為僅供檢查。
- `--efficient`（或 `--mode efficient`）：精簡角色快照預設。設定 `browser.snapshotDefaults.mode: "efficient"` 可讓它成為預設（請參閱[閘道設定](/zh-TW/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 會強制使用含 `ref=e12` 參照的角色快照。`--frame "<iframe>"` 會將角色快照範圍限制在 iframe。
- 搭配 Playwright 時，`--labels` 會加入一張含覆疊參照標籤的螢幕截圖
  （列印 `MEDIA:<path>`），並附上 `annotations` 陣列，其中包含每個參照的邊界框。在 `screenshot` 上，Playwright 支援的標籤可搭配 `--full-page`、
  `--ref` 和 `--element` 使用；在 `snapshot` 上，隨附的螢幕截圖仍然只限於
  視窗範圍。既有工作階段/chrome-mcp 設定檔會在
  頁面螢幕截圖上呈現覆疊標籤，但不會回傳 `annotations`，也不會使用 Playwright
  全頁/參照/元素投影輔助工具。沒有 Playwright 或 chrome-mcp 時，
  無法使用帶標籤的螢幕截圖。
- `--urls` 會將探索到的連結目的地附加到 AI 快照。

## 快照與參照

OpenClaw 支援兩種「快照」樣式：

- **AI 快照（數字參照）**：`openclaw browser snapshot`（預設；`--format ai`）
  - 輸出：包含數字參照的文字快照。
  - 動作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 內部會透過 Playwright 的 `aria-ref` 解析參照。

- **角色快照（像 `e12` 的角色參照）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 輸出：含 `[ref=e12]`（以及可選 `[nth=1]`）的角色式清單/樹狀結構。
  - 動作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 內部會透過 `getByRole(...)`（重複項目另加 `nth()`）解析參照。
  - 加上 `--labels` 可包含一張覆疊 `e12` 標籤的螢幕截圖。在
    Playwright 支援的設定檔上，這也會回傳每個參照的邊界框中繼資料
    （`annotations[]`）。
  - 當連結文字不明確且代理需要具體
    導航目標時，請加上 `--urls`。

- **ARIA 快照（像 `ax12` 的 ARIA 參照）**：`openclaw browser snapshot --format aria`
  - 輸出：作為結構化節點的無障礙樹。
  - 動作：當快照路徑可透過 Playwright 和 Chrome 後端 DOM ID 綁定
    參照時，`openclaw browser click ax12` 可運作。
- 如果 Playwright 不可用，ARIA 快照仍可用於
  檢查，但參照可能無法用於動作。需要動作參照時，請使用 `--format ai`
  或 `--interactive` 重新擷取快照。
- 原始 CDP 後備路徑的 Docker 證明：`pnpm test:docker:browser-cdp-snapshot`
  會以 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證角色
  快照包含連結 URL、游標提升的可點擊項目，以及 iframe 中繼資料。

參照行為：

- 參照**不會跨導航保持穩定**；如果發生失敗，請重新執行 `snapshot` 並使用新的參照。
- `/act` 會在動作觸發替換後，於能證明替換分頁時回傳目前的原始 `targetId`。
  後續命令請繼續使用穩定的分頁 ID/標籤。
- 如果角色快照是用 `--frame` 擷取，角色參照會限制在該 iframe，直到下一次角色快照為止。
- 未知或過期的 `axN` 參照會快速失敗，而不是落入
  Playwright 的 `aria-ref` 選擇器。發生這種情況時，請在同一分頁上執行新的快照。

## 等待強化功能

你可以等待的不只是時間/文字：

- 等待 URL（支援 Playwright 的 glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待載入狀態：
  - `openclaw browser wait --load networkidle`
  - 支援受管理的 `openclaw` 與原始/遠端 CDP 設定檔。使用 `existing-session` 驅動程式的設定檔（包含預設 `user` 設定檔）會拒絕 `networkidle`；在那裡請使用 `--url`、`--text`、選擇器或 `--fn` 等待。
- 等待 JS 謂詞：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待選擇器變成可見：
  - `openclaw browser wait "#main"`

這些可以組合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 偵錯工作流程

當動作失敗時（例如「不可見」、「嚴格模式違規」、「被覆蓋」）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（互動模式中請優先使用角色參照）
3. 如果仍然失敗：使用 `openclaw browser highlight <ref>` 查看 Playwright 的目標
4. 如果頁面行為異常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深入偵錯：記錄追蹤：
   - `openclaw browser trace start`
   - 重現問題
   - `openclaw browser trace stop`（列印 `TRACE:<path>`）

## JSON 輸出

`--json` 用於腳本和結構化工具。

範例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 中的角色快照包含 `refs`，以及小型 `stats` 區塊（行數/字元數/參照數/互動式），讓工具可以推理酬載大小與密度。

## 狀態與環境旋鈕

這些適用於「讓網站表現得像 X」的工作流程：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 儲存空間：`storage local|session get|set|clear`
- 離線：`set offline on|off`
- 標頭：`set headers --headers-json '{"X-Debug":"1"}'`（或位置形式 `set headers '{"X-Debug":"1"}'`）
- HTTP 基本驗證：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒體：`set media dark|light|no-preference|none`
- 時區 / 語系：`set timezone ...`、`set locale ...`
- 裝置 / 視窗：
  - `set device "iPhone 14"`（Playwright 裝置預設）
  - `set viewport 1280 720`

## 安全性與隱私

- openclaw 瀏覽器設定檔可能包含已登入的工作階段；請將其視為敏感資料。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  會在頁面內容中執行任意 JavaScript。提示注入可能會引導
  這項行為。如果不需要，請用 `browser.evaluateEnabled=false` 停用它。
- `openclaw browser evaluate --fn` 接受函式來源、運算式或
  陳述式主體。陳述式主體會包裝成 async 函式，因此請使用
  `return` 取得你想回傳的值。當
  頁面端函式可能需要比預設 evaluate 逾時更久時，請使用 `--timeout-ms <ms>`。
- 關於登入與反機器人注意事項（X/Twitter 等），請參閱[瀏覽器登入 + X/Twitter 發文](/zh-TW/tools/browser-login)。
- 保持閘道/節點主機私密（local loopback 或僅限 tailnet）。
- 遠端 CDP 端點功能強大；請以通道連線並加以保護。

嚴格模式範例（預設封鎖私有/內部目的地）：

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

## 相關

- [瀏覽器](/zh-TW/tools/browser) - 概觀、設定、設定檔、安全性
- [瀏覽器登入](/zh-TW/tools/browser-login) - 登入網站
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
