---
read_when:
    - 透過本機控制 API 為代理瀏覽器編寫指令碼或進行偵錯
    - 正在尋找 `openclaw browser` CLI 參考文件
    - 新增具備快照和參照的自訂瀏覽器自動化
summary: OpenClaw 瀏覽器控制 API、CLI 參考與指令碼動作
title: 瀏覽器控制 API
x-i18n:
    generated_at: "2026-05-11T20:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

如需設定、組態與疑難排解，請參閱 [Browser](/zh-TW/tools/browser)。
本頁是 local control HTTP API、`openclaw browser` CLI，以及腳本模式（快照、ref、等待、偵錯流程）的參考資料。

## Control API（選用）

僅供本機整合使用，Gateway 會公開一個小型 local loopback HTTP API：

- 狀態/啟動/停止：`GET /`、`POST /start`、`POST /stop`
- 分頁：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/螢幕截圖：`GET /snapshot`、`POST /screenshot`
- 動作：`POST /navigate`、`POST /act`
- Hook：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下載：`POST /download`、`POST /wait/download`
- 權限：`POST /permissions/grant`
- 偵錯：`GET /console`、`POST /pdf`
- 偵錯：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 網路：`POST /response/body`
- 狀態：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 狀態：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 設定：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端點都接受 `?profile=<name>`。`POST /start?headless=true` 會為本機受管理設定檔請求一次性的 headless 啟動，且不變更持久化的瀏覽器組態；attach-only、遠端 CDP，以及 existing-session 設定檔會拒絕該覆寫，因為 OpenClaw 不會啟動那些瀏覽器程序。

如果已設定共享密鑰 Gateway 驗證，瀏覽器 HTTP 路由也需要驗證：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用該密碼的 HTTP Basic auth

注意事項：

- 這個獨立的 local loopback 瀏覽器 API **不會**使用 trusted-proxy 或 Tailscale Serve 身分標頭。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，這些 local loopback 瀏覽器路由不會繼承那些帶有身分的模式；請讓它們僅限於 local loopback。

### `/act` 錯誤契約

`POST /act` 對路由層級驗證與政策失敗使用結構化錯誤回應：

```json
{ "error": "<message>", "code": "ACT_*" }
```

目前的 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：`kind` 缺失或無法辨識。
- `ACT_INVALID_REQUEST`（HTTP 400）：動作酬載正規化或驗證失敗。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：`selector` 用於不支援的動作種類。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：`evaluate`（或 `wait --fn`）已由組態停用。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：最上層或批次的 `targetId` 與請求目標衝突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：existing-session 設定檔不支援該動作。

其他執行階段失敗仍可能回傳沒有 `code` 欄位的 `{ "error": "<message>" }`。

### Playwright 需求

部分功能（導覽/動作/AI 快照/角色快照、元素螢幕截圖、PDF）需要 Playwright。如果未安裝 Playwright，那些端點會回傳清楚的 501 錯誤。

沒有 Playwright 時仍可運作的項目：

- ARIA 快照
- 當每個分頁的 CDP WebSocket 可用時，可使用角色樣式的無障礙快照（`--interactive`、`--compact`、`--depth`、`--efficient`）。這是用於檢查與 ref 探索的備援；Playwright 仍是主要動作引擎。
- 當每個分頁的 CDP WebSocket 可用時，受管理的 `openclaw` 瀏覽器可使用頁面螢幕截圖
- `existing-session` / Chrome MCP 設定檔的頁面螢幕截圖
- 來自快照輸出的 `existing-session` ref 型螢幕截圖（`--ref`）

仍需要 Playwright 的項目：

- `navigate`
- `act`
- 依賴 Playwright 原生 AI 快照格式的 AI 快照
- CSS-selector 元素螢幕截圖（`--element`）
- 完整瀏覽器 PDF 匯出

元素螢幕截圖也會拒絕 `--full-page`；該路由會回傳 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，表示封裝的 Gateway 缺少核心瀏覽器執行階段相依項。請重新安裝或更新 OpenClaw，然後重新啟動 Gateway。若使用 Docker，也請依下方所示安裝 Chromium 瀏覽器二進位檔。

#### Docker Playwright 安裝

如果你的 Gateway 在 Docker 中執行，請避免使用 `npx playwright`（npm 覆寫衝突）。
若使用自訂映像檔，請將 Chromium 烘焙進映像檔：

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

若使用既有映像檔，請改透過隨附的 CLI 安裝：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

若要持久化瀏覽器下載項目，請設定 `PLAYWRIGHT_BROWSERS_PATH`（例如 `/home/node/.cache/ms-playwright`），並確保 `/home/node` 透過 `OPENCLAW_HOME_VOLUME` 或 bind mount 持久化。OpenClaw 會在 Linux 上自動偵測持久化的 Chromium。請參閱 [Docker](/zh-TW/install/docker)。

## 運作方式（內部）

小型 local loopback 控制伺服器會接受 HTTP 請求，並透過 CDP 連線到 Chromium 型瀏覽器。進階動作（點擊/輸入/快照/PDF）會在 CDP 之上透過 Playwright 執行；當缺少 Playwright 時，只有非 Playwright 操作可用。代理會看到一個穩定介面，而本機/遠端瀏覽器與設定檔可在底層自由替換。

## CLI 快速參考

所有命令都接受 `--browser-profile <name>` 來指定特定設定檔，並接受 `--json` 以輸出機器可讀格式。

<AccordionGroup>

<Accordion title="基礎：狀態、分頁、開啟/聚焦/關閉">

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

<Accordion title="檢查：螢幕截圖、快照、主控台、錯誤、請求">

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

<Accordion title="動作：導覽、點擊、輸入、拖曳、等待、求值">

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

<Accordion title="狀態：Cookie、儲存空間、離線、標頭、地理位置、裝置">

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

注意事項：

- `upload` 與 `dialog` 是**預先武裝**呼叫；請在觸發選擇器/對話方塊的點擊/按鍵之前執行它們。
- `click`/`type`/等需要來自 `snapshot` 的 `ref`（數字 `12`、角色 ref `e12`，或可動作 ARIA ref `ax12`）。動作刻意不支援 CSS selector。當可見視窗位置是唯一可靠目標時，請使用 `click-coords`。
- 下載、追蹤與上傳路徑會受限於 OpenClaw 暫存根目錄：`/tmp/openclaw{,/downloads,/uploads}`（備援：`${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以透過 `--input-ref` 或 `--element` 直接設定檔案輸入。

當 OpenClaw 能證明替換後的分頁時，例如相同 URL，或表單提交後單一舊分頁變成單一新分頁，穩定的分頁 ID 與標籤會在 Chromium 原始目標替換後保留下來。原始目標 ID 仍然易變；在腳本中請偏好使用 `tabs` 的 `suggestedTargetId`。

快照旗標一覽：

- `--format ai`（搭配 Playwright 時的預設）：含數字 ref（`aria-ref="<n>"`）的 AI 快照。
- `--format aria`：含 `axN` ref 的無障礙樹。當 Playwright 可用時，OpenClaw 會將 ref 以後端 DOM ID 綁定到即時頁面，讓後續動作可以使用它們；否則請將輸出視為僅供檢查。
- `--efficient`（或 `--mode efficient`）：精簡角色快照預設。設定 `browser.snapshotDefaults.mode: "efficient"` 可讓它成為預設（請參閱 [Gateway 組態](/zh-TW/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 會強制使用含 `ref=e12` ref 的角色快照。`--frame "<iframe>"` 會將角色快照限制在 iframe 範圍內。
- `--labels` 會加入僅限 viewport 的螢幕截圖，並覆疊 ref 標籤（列印 `MEDIA:<path>`）。
- `--urls` 會將發現的連結目的地附加到 AI 快照。

## 快照與 ref

OpenClaw 支援兩種「快照」樣式：

- **AI 快照（數字 ref）**：`openclaw browser snapshot`（預設；`--format ai`）
  - 輸出：包含數字 ref 的文字快照。
  - 動作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 內部會透過 Playwright 的 `aria-ref` 解析 ref。

- **角色快照（如 `e12` 的角色 ref）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 輸出：含 `[ref=e12]`（以及選用 `[nth=1]`）的角色型清單/樹。
  - 動作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 內部會透過 `getByRole(...)` 解析 ref（重複項則加上 `nth()`）。
  - 加上 `--labels` 可包含覆疊 `e12` 標籤的 viewport 螢幕截圖。
  - 當連結文字有歧義且代理需要具體導覽目標時，請加上 `--urls`。

- **ARIA 快照（像 `ax12` 這樣的 ARIA 參照）**：`openclaw browser snapshot --format aria`
  - 輸出：以結構化節點表示的無障礙樹。
  - 動作：當快照路徑可透過 Playwright 和 Chrome 後端 DOM ID 綁定該參照時，
    `openclaw browser click ax12` 便可運作。
- 如果 Playwright 無法使用，ARIA 快照對檢查仍可能有用，
  但參照可能無法操作。需要動作參照時，請用 `--format ai`
  或 `--interactive` 重新產生快照。
- 原始 CDP 後援路徑的 Docker 證明：`pnpm test:docker:browser-cdp-snapshot`
  會以 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證角色
  快照包含連結 URL、由游標提升的可點擊項目，以及 iframe 中繼資料。

參照行為：

- 參照**不會在導覽之間保持穩定**；如果某件事失敗，請重新執行 `snapshot` 並使用新的參照。
- `/act` 會在動作觸發替換後，於能證明替換分頁時回傳目前的原始 `targetId`。
  後續命令請繼續使用穩定的分頁 ID/標籤。
- 如果角色快照是用 `--frame` 取得，角色參照會限定在該 iframe 內，直到下一次角色快照為止。
- 未知或過期的 `axN` 參照會快速失敗，而不是落入
  Playwright 的 `aria-ref` 選擇器。發生這種情況時，請在同一分頁上執行新的快照。

## 等待強化功能

你可以等待的不只是時間/文字：

- 等待 URL（支援 Playwright 的 glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待載入狀態：
  - `openclaw browser wait --load networkidle`
- 等待 JS 述詞：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待選擇器變為可見：
  - `openclaw browser wait "#main"`

這些可以合併使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 偵錯工作流程

當動作失敗時（例如「不可見」、「嚴格模式違規」、「被遮住」）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在互動模式中優先使用角色參照）
3. 如果仍然失敗：使用 `openclaw browser highlight <ref>` 查看 Playwright 正在定位的目標
4. 如果頁面行為異常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深入偵錯時：錄製追蹤：
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

JSON 中的角色快照包含 `refs`，以及一小段 `stats` 區塊（lines/chars/refs/interactive），讓工具能推論酬載大小和密度。

## 狀態與環境旋鈕

這些對「讓網站表現得像 X」的工作流程很有用：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 儲存空間：`storage local|session get|set|clear`
- 離線：`set offline on|off`
- 標頭：`set headers --headers-json '{"X-Debug":"1"}'`（舊版 `set headers --json '{"X-Debug":"1"}'` 仍受支援）
- HTTP 基本驗證：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒體：`set media dark|light|no-preference|none`
- 時區 / 地區設定：`set timezone ...`、`set locale ...`
- 裝置 / 視窗：
  - `set device "iPhone 14"`（Playwright 裝置預設值）
  - `set viewport 1280 720`

## 安全性與隱私

- openclaw 瀏覽器設定檔可能包含已登入的工作階段；請將其視為敏感資料。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  會在頁面內容脈絡中執行任意 JavaScript。提示注入可能會引導
  這個行為。如果不需要，請用 `browser.evaluateEnabled=false` 停用。
- 如需登入和反機器人注意事項（X/Twitter 等），請參閱[瀏覽器登入 + X/Twitter 發文](/zh-TW/tools/browser-login)。
- 保持 Gateway/Node 主機私有（loopback 或僅限 tailnet）。
- 遠端 CDP 端點權限很強；請建立通道並保護它們。

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
- [Browser Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
- [Browser WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
