---
read_when:
    - 透過本機控制 API 編寫代理程式瀏覽器指令碼或進行偵錯
    - 正在尋找 `openclaw browser` 命令列介面參考文件
    - 使用快照與參照新增自訂瀏覽器自動化
summary: OpenClaw 瀏覽器控制 API、命令列介面參考與指令碼動作
title: 瀏覽器控制 API
x-i18n:
    generated_at: "2026-07-12T14:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

關於設定、組態與疑難排解，請參閱[瀏覽器](/zh-TW/tools/browser)。
本頁是本機控制 HTTP API、`openclaw browser` 命令列介面，以及指令碼模式（快照、參照、等待、偵錯流程）的參考資料。

## 控制 API（選用）

僅供本機整合使用，閘道會公開一個小型的回送 HTTP API。
此獨立伺服器需選擇啟用——請在閘道服務環境中設定環境變數
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1`，並重新啟動閘道，HTTP 端點才會可用。若未設定
此變數，瀏覽器控制執行階段仍可透過命令列介面與
代理工具運作，但不會有任何服務監聽回送控制連接埠。

- 狀態／啟動／停止：`GET /`、`GET /doctor`、`POST /start`、`POST /stop`、`POST /reset-profile`
- 設定檔：`GET /profiles`、`POST /profiles/create`、`DELETE /profiles/:name`
- 分頁：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`、`POST /tabs/action`
- 快照／螢幕擷取畫面：`GET /snapshot`、`POST /screenshot`
- 動作：`POST /navigate`、`POST /act`
- 鉤子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下載：`POST /download`、`POST /wait/download`
- 權限：`POST /permissions/grant`
- 偵錯：`GET /console`、`POST /pdf`
- 偵錯：`GET /errors`、`GET /requests`、`GET /dialogs`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 網路：`POST /response/body`
- 狀態：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 狀態：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 設定：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

`POST /tabs/action` 是命令列介面在內部用於
`browser tab` 子命令的批次形式（`{"action":"new"|"label"|"select"|"close"|"list", ...}`）；
直接撰寫指令碼時，建議優先使用上述單一用途的分頁路由。

所有端點都接受 `?profile=<name>`。`POST /start?headless=true` 會要求
針對本機受管理設定檔進行一次性無頭啟動，且不變更持久儲存的
瀏覽器組態；僅附加、遠端 CDP 與現有工作階段設定檔會拒絕
此覆寫，因為 OpenClaw 不會啟動這些瀏覽器程序。

對於分頁端點，`targetId` 是相容性欄位名稱。建議優先傳入
來自 `GET /tabs` 或 `POST /tabs/open` 的 `suggestedTargetId`；也接受標籤與
`t1` 等 `tabId` 控制代碼。原始 CDP 目標 ID 與唯一的原始
目標 ID 前綴仍然有效，但它們是易變動的診斷控制代碼。

若已設定共用祕密閘道驗證，瀏覽器 HTTP 路由也需要驗證：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>`，或使用該密碼的 HTTP 基本驗證

注意事項：

- 此獨立回送瀏覽器 API **不會**使用受信任的 Proxy 或
  Tailscale Serve 身分識別標頭。
- 若 `gateway.auth.mode` 為 `none` 或 `trusted-proxy`，這些回送瀏覽器
  路由不會繼承這些帶有身分識別資訊的模式；請將其限制為僅供回送使用。

### `/act` 錯誤合約

`POST /act` 會針對路由層級驗證與
政策失敗使用結構化錯誤回應：

```json
{ "error": "<message>", "code": "ACT_*" }
```

目前的 `code` 值：

- `ACT_KIND_REQUIRED` (HTTP 400)：`kind` 遺漏或無法辨識。
- `ACT_INVALID_REQUEST` (HTTP 400)：動作承載資料正規化或驗證失敗。
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400)：`selector` 與不支援的動作種類搭配使用。
- `ACT_EVALUATE_DISABLED` (HTTP 403)：`evaluate`（或 `wait --fn`）已由設定停用。
- `ACT_TARGET_ID_MISMATCH` (HTTP 403)：頂層或批次的 `targetId` 與請求目標衝突。
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501)：現有工作階段設定檔不支援此動作。

其他執行階段失敗仍可能傳回 `{ "error": "<message>" }`，但不含
`code` 欄位。

### Playwright 需求

部分功能（導覽／動作／AI 快照／角色快照、元素螢幕截圖、
PDF）需要 Playwright。如果未安裝 Playwright，這些端點會傳回
明確的 501 錯誤。

沒有 Playwright 仍可運作的功能：

- ARIA 快照
- 當每個分頁的 CDP WebSocket 可用時，可使用角色樣式的無障礙快照（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。這是用於檢查與參照探索的
  備援方式；Playwright 仍是主要的動作引擎。
- 當每個分頁的 CDP WebSocket 可用時，受管理的 `openclaw` 瀏覽器可擷取
  頁面螢幕截圖
- `existing-session`／Chrome MCP 設定檔的頁面螢幕截圖
- 從快照輸出取得的 `existing-session` 參照式螢幕截圖（`--ref`）

仍需要 Playwright 的功能：

- `navigate`
- `act`
- 仰賴 Playwright 原生 AI 快照格式的 AI 快照
- 使用 CSS 選擇器的元素螢幕截圖（`--element`）
- 完整瀏覽器 PDF 匯出

元素螢幕截圖也不接受 `--full-page`；該路由會傳回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，表示封裝的
閘道缺少核心瀏覽器執行階段相依套件。請重新安裝或更新
OpenClaw，然後重新啟動閘道。若使用 Docker，還需依下方說明安裝 Chromium
瀏覽器二進位檔。

#### Docker Playwright 安裝

如果你的閘道在 Docker 中執行，請避免使用 `npx playwright`（會發生 npm 覆寫衝突）。
若使用自訂映像檔，請將 Chromium 內建至映像檔中：

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

若使用現有映像檔，請改為透過內附的命令列介面安裝：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

若要持久保存瀏覽器下載內容，請設定 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），並確保透過
`OPENCLAW_HOME_VOLUME` 或繫結掛載持久保存 `/home/node`。OpenClaw 會在 Linux 上自動偵測持久保存的
Chromium。請參閱 [Docker](/zh-TW/install/docker)。

## 運作方式（內部）

一個小型迴路控制伺服器會接受 HTTP 要求，並透過 CDP 連線至 Chromium 系瀏覽器。進階動作（點擊／輸入／快照／PDF）會在 CDP 之上透過 Playwright 執行；缺少 Playwright 時，僅能使用不依賴 Playwright 的操作。代理程式會看到一個穩定的介面，而底層可自由切換本機／遠端瀏覽器與設定檔。

## 命令列介面快速參考

所有命令都接受 `--browser-profile <name>` 以指定特定設定檔，並接受 `--json` 以產生機器可讀的輸出。

<AccordionGroup>

<Accordion title="基本操作：狀態、分頁、開啟／聚焦／關閉">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # 新增即時快照探測
openclaw browser start
openclaw browser start --headless # 單次啟動本機受管理的無頭瀏覽器
openclaw browser stop            # 也會清除僅附加／遠端 CDP 上的模擬設定
openclaw browser reset-profile   # 將設定檔的瀏覽器資料移至垃圾桶
openclaw browser tabs
openclaw browser tab             # 目前分頁的捷徑
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

<Accordion title="設定檔：列出、建立、刪除">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="檢查：螢幕截圖、快照、主控台、錯誤、要求">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 或對角色參照使用 --ref e12
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

<Accordion title="動作：導覽、點擊、輸入、拖曳、等待、求值">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 或對角色參照使用 e12
openclaw browser click-coords 120 340        # 視區座標
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
openclaw browser set credentials user pass            # 使用 --clear 移除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意事項：

- 面向代理程式的 `browser` 工具提供 `action=download`（必要的 `ref` 和
  `path`）以及 `action=waitfordownload`（選用的 `path`）。兩者都會傳回已儲存的
  下載 URL、建議的檔名，以及受保護的本機路徑。受管理的 Playwright 設定檔支援
  明確攔截下載；現有工作階段設定檔則會傳回不支援此操作的錯誤。
- 優先使用原子式選擇器上傳：上傳時一併傳入觸發器 `--ref`，讓 OpenClaw 在單一請求中完成準備與點擊。若刻意要稍後才觸發，仍支援僅指定路徑的 `upload`。使用 `--input-ref` 或 `--element` 可直接設定檔案輸入欄位。`dialog` 是準備呼叫；請在觸發對話方塊的點擊／按鍵操作前執行。若某個動作開啟強制回應視窗，動作回應會包含 `blockedByDialog` 和 `browserState.dialogs.pending`；傳入該 `dialogId` 即可直接回應。在 OpenClaw 外部處理的對話方塊會顯示於 `browserState.dialogs.recent`。
- `click`／`type`／其他動作需要來自 `snapshot` 的 `ref`（數字 `12`、角色參照 `e12`，或可操作的 ARIA 參照 `ax12`）。動作刻意不支援 CSS 選擇器。當可見視埠位置是唯一可靠的目標時，請使用 `click-coords`。
- 下載與追蹤路徑僅限於 OpenClaw 暫存根目錄：`/tmp/openclaw{,/downloads}`（備援：`${os.tmpdir()}/openclaw/...`）。
- `upload` 接受來自 OpenClaw 暫存上傳根目錄和
  OpenClaw 管理之傳入媒體的檔案。受管理的傳入媒體可透過
  `media://inbound/<id>`、沙箱相對路徑 `media/inbound/<id>`，或受管理傳入媒體
  目錄內的解析後路徑來參照。巢狀媒體參照、路徑遍歷、符號連結、硬連結及任意本機路徑仍會遭到拒絕。
- `upload` 也可透過 `--input-ref` 或 `--element` 直接設定檔案輸入欄位。

當 OpenClaw 能證明替代分頁的對應關係時，例如同一 URL 具有唯一的舊／新配對，
或提交表單後單一舊分頁變成單一新分頁，穩定的分頁 ID 與標籤可在 Chromium 原始目標替換後繼續保留。
具有相同 URL 且無法判定的替換會取得新的控制代碼。原始目標 ID 仍不穩定；
指令碼應優先使用 `tabs` 中的 `suggestedTargetId`。

快覽快照旗標：

- `--format ai`（使用 Playwright 時的預設值）：包含數字參照（`aria-ref="<n>"`）的 AI 快照。
- `--format aria`：包含 `axN` 參照的無障礙功能樹狀結構。當 Playwright 可用時，OpenClaw 會透過後端 DOM ID，將參照繫結至即時頁面，讓後續動作可以使用；否則應將輸出視為僅供檢查。
- `--efficient`（或 `--mode efficient`）：精簡角色快照預設集。設定 `browser.snapshotDefaults.mode: "efficient"` 可將其設為預設值（請參閱[閘道設定](/zh-TW/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 會強制產生使用 `ref=e12` 參照的角色快照。`--frame "<iframe>"` 會將角色快照範圍限定於 iframe。
- 使用 Playwright 時，`--labels` 會加入帶有疊加參照標籤的螢幕截圖
  （輸出 `MEDIA:<path>`），以及包含每個參照邊界框的 `annotations` 陣列。
  在 `screenshot` 上，Playwright 支援的標籤可與 `--full-page`、
  `--ref` 和 `--element` 搭配使用；在 `snapshot` 上，隨附的螢幕截圖仍僅涵蓋
  視埠。現有工作階段／chrome-mcp 設定檔會在頁面螢幕截圖上呈現疊加標籤，
  但不會傳回 `annotations`，也不使用 Playwright 的
  全頁／參照／元素投影輔助程式。若沒有 Playwright 或 chrome-mcp，
  則無法使用帶標籤的螢幕截圖。
- `--urls` 會將探索到的連結目的地附加至 AI 快照。

## 快照與參照

OpenClaw 支援兩種「快照」樣式：

- **AI 快照（數字參照）**：`openclaw browser snapshot`（預設；`--format ai`）
  - 輸出：包含數字參照的文字快照。
  - 動作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在內部，參照會透過 Playwright 的 `aria-ref` 解析。

- **角色快照（如 `e12` 的角色參照）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 輸出：包含 `[ref=e12]`（以及選用的 `[nth=1]`）且以角色為基礎的清單／樹狀結構。
  - 動作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在內部，參照會透過 `getByRole(...)` 解析（重複項目另加 `nth()`）。
  - 加入 `--labels` 可包含疊加 `e12` 標籤的螢幕截圖。在
    Playwright 支援的設定檔上，這也會傳回各參照的邊界框中繼資料
    （`annotations[]`）。
  - 當連結文字含義不明，而代理程式需要具體的
    導覽目標時，請加入 `--urls`。

- **ARIA 快照（如 `ax12` 的 ARIA 參照）**：`openclaw browser snapshot --format aria`
  - 輸出：以結構化節點呈現的無障礙功能樹狀結構。
  - 動作：當快照路徑可透過 Playwright 和 Chrome 後端 DOM ID
    繫結參照時，`openclaw browser click ax12` 可正常運作。
- 若 Playwright 無法使用，ARIA 快照仍可用於
  檢查，但參照可能無法操作。需要動作參照時，請以 `--format ai`
  或 `--interactive` 重新擷取快照。
- 原始 CDP 備援路徑的 Docker 證明：`pnpm test:docker:browser-cdp-snapshot`
  會以 CDP 啟動 Chromium、執行 `browser doctor --deep`，並驗證角色
  快照包含連結 URL、由游標提升為可點擊的元素，以及 iframe 中繼資料。

參照行為：

- 參照在導覽之間**並不穩定**；若發生失敗，請重新執行 `snapshot` 並使用新的參照。
- 當 `/act` 能證明動作觸發的替換分頁時，會傳回目前的原始 `targetId`。
  後續命令請繼續使用穩定的分頁 ID／標籤。
- 若角色快照是使用 `--frame` 擷取，角色參照的範圍會限定於該 iframe，直到下一次角色快照為止。
- 未知或過期的 `axN` 參照會快速失敗，而不會退回
  Playwright 的 `aria-ref` 選擇器。發生此情況時，請在同一分頁上
  擷取新的快照。

## 強化等待功能

除了時間／文字之外，你還能等待更多條件：

- 等待 URL（支援 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待載入狀態：
  - `openclaw browser wait --load networkidle`
  - 受管理的 `openclaw` 和原始／遠端 CDP 設定檔均支援此功能。使用 `existing-session` 驅動程式的設定檔（包括預設的 `user` 設定檔）會拒絕 `networkidle`；在這些設定檔中，請使用 `--url`、`--text`、選擇器或 `--fn` 等待條件。
- 等待 JS 判斷條件：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待選擇器變為可見：
  - `openclaw browser wait "#main"`

這些條件可以組合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 偵錯工作流程

當動作失敗時（例如「不可見」、「嚴格模式違規」、「遭遮蓋」）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>`／`type <ref>`（互動模式下優先使用角色參照）
3. 若仍然失敗：使用 `openclaw browser highlight <ref>` 查看 Playwright 的目標元素
4. 若頁面行為異常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 若需深入偵錯，請記錄追蹤：
   - `openclaw browser trace start`
   - 重現問題
   - `openclaw browser trace stop`（輸出 `TRACE:<path>`）

## JSON 輸出

`--json` 用於指令碼與結構化工具。

範例：

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON 中的角色快照包含 `refs`，以及一個小型 `stats` 區塊（行數／字元數／參照數／互動元素數），讓工具可以判斷承載資料的大小與密度。

## 狀態與環境調整項目

這些功能適合「讓網站呈現 X 行為」的工作流程：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 儲存空間：`storage local|session get|set|clear`
- 離線：`set offline on|off`
- 標頭：`set headers --headers-json '{"X-Debug":"1"}'`（或位置參數形式 `set headers '{"X-Debug":"1"}'`）
- HTTP 基本驗證：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒體：`set media dark|light|no-preference|none`
- 時區／語言環境：`set timezone ...`、`set locale ...`
- 裝置／視埠：
  - `set device "iPhone 14"`（Playwright 裝置預設集）
  - `set viewport 1280 720`

## 安全性與隱私權

- openclaw 瀏覽器設定檔可能包含已登入的工作階段；請將其視為敏感資料。
- `browser act kind=evaluate`／`openclaw browser evaluate` 和 `wait --fn`
  會在頁面情境中執行任意 JavaScript。提示注入可能會操控
  此行為。若不需要此功能，請使用 `browser.evaluateEnabled=false` 停用。
- `openclaw browser evaluate --fn` 接受函式原始碼、運算式或
  陳述式主體。陳述式主體會包裝為非同步函式，因此請使用
  `return` 傳回你想取得的值。若頁面端函式所需時間可能超過預設的求值逾時，
  請使用 `--timeout-ms <ms>`。
- 如需登入及反機器人注意事項（X/Twitter 等），請參閱[瀏覽器登入與 X/Twitter 發文](/zh-TW/tools/browser-login)。
- 將閘道／節點主機保持為私人存取（僅限迴路介面或 tailnet）。
- 遠端 CDP 端點具備強大權限；請透過隧道連線並加以保護。

嚴格模式範例（預設封鎖私人／內部目的地）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 選用的精確允許項目
    },
  },
}
```

## 相關內容

- [瀏覽器](/zh-TW/tools/browser) - 概觀、設定、設定檔、安全性
- [瀏覽器登入](/zh-TW/tools/browser-login) - 登入網站
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
