---
read_when:
    - 新增由代理程式控制的瀏覽器自動化
    - 偵錯 OpenClaw 為何會干擾你自己的 Chrome
    - 在 macOS App 中實作瀏覽器設定與生命週期
summary: 整合式瀏覽器控制服務與操作命令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-22T10:49:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3afa2dda17520ae6c53fe3f1a7a12e7ca8a1414b2c12b79cf4a09ac8906bb3ca
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行由代理程式控制的**專用 Chrome/Brave/Edge/Chromium 設定檔**。它透過閘道內的小型本機控制服務（僅限迴路位址）執行，並與你的個人瀏覽器隔離。

- 可將它視為**獨立且僅供代理程式使用的瀏覽器**。`openclaw` 設定檔絕不會接觸你的個人瀏覽器設定檔。
- 代理程式會在這個隔離環境中開啟分頁、讀取頁面、點按及輸入內容。
- 內建的 `user` 設定檔則會透過 Chrome DevTools MCP，附加至你實際已登入的 Chrome 工作階段。

## 你可獲得的功能

- 名為 **openclaw** 的獨立瀏覽器設定檔（預設使用橘色強調色）。
- 可預期的分頁控制（列出／開啟／聚焦／關閉）。
- 代理程式動作（點按／輸入／拖曳／選取）、快照、螢幕截圖及 PDF。
- 由 Playwright 支援的設定檔會將直接附件導覽儲存在受管理的下載目錄下，並在最終 URL 通過政策驗證後傳回 `{ url, suggestedFilename, path }` 中繼資料。
- 當動作立即開始一或多個下載時，由 Playwright 支援的代理程式動作會傳回包含相同受管理中繼資料的 `downloads` 陣列。
- 啟用瀏覽器外掛時，隨附的 `browser-automation` skill 會教導代理程式快照、
  穩定分頁、過期參照及手動阻礙的復原流程。
- 選用的多設定檔支援（`openclaw`、`work`、`remote` 等）。

此瀏覽器**不是**你的日常主要瀏覽器。它是供代理程式自動化與驗證使用的
安全隔離介面。

在 macOS 上，你可以明確地將 Cookie 從 Chrome 系列的系統設定檔複製到獨立的受管理設定檔。受管理瀏覽器仍會使用自己的使用者資料目錄；只會複製選取的 Cookie，而本機儲存空間與 IndexedDB 會保留在原處。匯入指令與限制請參閱[設定檔](#profiles-multi-browser)或 [`openclaw browser` 命令列介面參考](/zh-TW/cli/browser)。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」表示外掛或 `browser.enabled` 已關閉；請參閱
[設定](#configuration)和[外掛控制](#plugin-control)。

如果完全缺少 `openclaw browser`，或代理程式表示瀏覽器工具無法使用，請跳至[缺少瀏覽器指令或工具](#missing-browser-command-or-tool)。

## 外掛控制

預設的 `browser` 工具是隨附外掛。停用它，即可改用另一個註冊相同 `browser` 工具名稱的外掛：

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

預設值同時需要 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。只停用外掛，會將 `openclaw browser` 命令列介面、`browser.request` 閘道方法、代理程式工具及控制服務作為一個整體移除；你的 `browser.*` 設定會保持不變，以供替代項目使用。

瀏覽器設定變更後必須重新啟動閘道，外掛才能重新註冊其服務。

## 代理程式指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。若要讓代理程式或
衍生的子代理程式使用瀏覽器自動化，請在設定檔
階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

若只針對單一代理程式，請使用 `agents.entries.*.tools.alsoAllow: ["browser"]`。
由於子代理程式政策是在設定檔篩選後套用，因此僅設定
`tools.subagents.tools.allow: ["browser"]` 並不足夠。

瀏覽器外掛提供兩個層級的代理程式指引：

- `browser` 工具說明包含精簡且一律有效的規範：選擇
  正確的設定檔、讓參照保持在同一分頁上、使用 `tabId`／標籤指定分頁，
  並在多步驟工作中載入瀏覽器 skill。
- 隨附的 `browser-automation` skill 包含較完整的操作流程：
  先檢查狀態／分頁、為工作分頁加上標籤、執行動作前建立快照、UI 變更後重新建立快照、
  嘗試復原過期參照一次，並將登入／雙因素驗證／CAPTCHA 或
  相機／麥克風阻礙回報為需要手動操作，而非自行猜測。

啟用外掛後，外掛隨附的 skill 會列在代理程式的可用 skill 中。
完整的 skill 指示會依需要載入，因此例行
回合不必承擔完整的權杖成本。

## 缺少瀏覽器指令或工具

如果升級後無法識別 `openclaw browser`、缺少 `browser.request`，或代理程式回報瀏覽器工具無法使用，常見原因是 `plugins.allow` 清單未包含 `browser`，且不存在根層級的 `browser` 設定區塊。請加入：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊（`browser` 下的任何鍵，例如
`browser.enabled=true` 或 `browser.profiles.<name>`）即使在限制嚴格的 `plugins.allow` 下，
也會啟用隨附的瀏覽器外掛，這與隨附的頻道設定行為一致。`plugins.entries.browser.enabled=true` 和
`tools.alsoAllow: ["browser"]` 本身無法取代允許清單成員資格。
完全移除 `plugins.allow` 也會恢復預設值。

## 設定檔：`openclaw`、`user`、`chrome`

- `openclaw`：受管理的隔離瀏覽器（不需要擴充功能）。
- `user`：內建的 Chrome DevTools MCP 附加設定檔，用於你**實際
  已登入的 Chrome** 工作階段。OpenClaw 第一次附加時，Chrome 會顯示阻擋式的「Allow remote debugging?」
  提示，因此必須有人在電腦前。
- `chrome`：內建的 [Chrome 擴充功能](/zh-TW/tools/chrome-extension)設定檔，用於你
  **實際已登入的 Chrome** 工作階段。即使無人在電腦前，也能從手機運作，
  因為它是透過 OpenClaw 瀏覽器擴充功能控制分頁，而非遠端偵錯連接埠，
  因此不會出現「Allow remote debugging?」提示。

針對代理程式瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 需要既有的登入工作階段，且使用者**不在電腦前**（Telegram、WhatsApp 等）時，
  優先使用 `profile="chrome"`（擴充功能）。
- 需要既有的登入工作階段，且使用者**在電腦前**可核准附加提示時，
  優先使用 `profile="user"`（Chrome MCP）。
- 若要使用特定瀏覽器模式，`profile` 是明確的覆寫選項。

若想預設使用受管理模式，請設定 `browser.defaultProfile: "openclaw"`。

## 設定

瀏覽器設定位於 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 預設值：true
    evaluateEnabled: true, // 預設值：true；false 會停用 act:evaluate（任意 JS）
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 僅針對受信任的私人網路存取選擇啟用
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 舊版單一設定檔覆寫
    tabCleanup: {
      enabled: true, // 預設值：true
    },
    // snapshotDefaults: { mode: "efficient" }, // 呼叫端省略時的預設快照模式
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

當呼叫端未明確傳入 `snapshotFormat` 或
`mode` 時，`browser.snapshotDefaults.mode: "efficient"` 會變更預設的 `snapshot`
擷取模式；每次呼叫的快照選項請參閱[瀏覽器控制 API](/zh-TW/tools/browser-control)。

### 分頁清理擁有權

工作階段分頁清理僅適用於 OpenClaw 瀏覽器工具使用
`action: "open"` 建立的分頁。OpenClaw 不會接管原先已開啟、
由使用者開啟，或擁有權不明的分頁。
`browser.tabCleanup` 區塊控制主要工作階段的定期閒置與上限清理；
停用它不會停用明確的工作階段生命週期清理。

對於主機本機開啟的分頁，具有穩定原生 CDP 目標與瀏覽器
身分識別的擁有權會儲存在共用 SQLite 狀態中。這些記錄在閘道
重新啟動後仍會保留，並繼續符合 `/new` 和其他工作階段生命週期清理的條件；
工作階段生命週期清理包括子代理程式、排程及 ACP 工作階段結束。
工具端目標為原生 CDP 目標的記錄，在重新啟動後也仍符合
閒置與每工作階段上限清理的條件。Chrome MCP 目標控點僅存在於
處理程序內，因此冷啟動的既有工作階段記錄會等待生命週期清理，
避免對重新啟動後無法安全歸因的活動冒險執行閒置清理。
這個持久化路徑可涵蓋 OpenClaw 管理的設定檔、
一般遠端 CDP 設定檔，以及具有明確
`cdpUrl` 的既有工作階段設定檔，前提是 OpenClaw 能解析原生目標與穩定的
瀏覽器身分識別。關閉持久化記錄前，OpenClaw 會驗證
已設定的設定檔與瀏覽器執行個體仍相符。

Chrome MCP `--autoConnect`、其 `/json/version` 回應缺少
穩定瀏覽器身分識別的 CDP 端點，以及無法解析原生目標的開啟操作，
仍採用僅限處理程序內的盡力追蹤。它們可在該
閘道處理程序執行期間清理，但不會在
閘道重新啟動後自動關閉。在持久化追蹤功能可用之前留下的分頁不會
被追溯接管；請手動關閉這些分頁。

清理採盡力而為，不保證每個符合條件的分頁都會
立即關閉。暫時性的擁有權檢查或關閉失敗會讓持久化
清理保持待處理，以便稍後重試。重試並非無上限：當瀏覽器
持續無法連線，且分頁超過一天未使用時，追蹤資料列
會被淘汰，避免持久化儲存區充斥永遠無法
再次驗證的分頁。

### 螢幕截圖視覺理解（支援純文字模型）

當主要模型僅支援文字（不支援視覺／多模態）時，瀏覽器
螢幕截圖會傳回模型無法讀取的圖片區塊。瀏覽器螢幕截圖
會重複使用現有的圖片理解設定，因此為媒體理解設定的
圖片模型可以將螢幕截圖描述為文字，而不需要任何
瀏覽器專用的模型設定。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // 加入備援候選項目；第一個成功者勝出
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // 標記為支援圖片時，共用媒體模型也能運作。
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // 也會採用既有的圖片模型預設值。
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**運作方式：**

1. 代理程式呼叫 `browser screenshot`，影像會如往常一樣擷取至磁碟。
2. 瀏覽器工具會詢問現有的影像理解執行階段，確認其是否能使用已設定的媒體影像模型、共用媒體模型、影像模型預設值或有驗證支援的影像提供者來描述螢幕截圖。
3. 視覺模型會傳回文字描述，該描述會以 `wrapExternalContent`（提示注入防護）包裝，並以文字區塊而非影像區塊傳回代理程式。
4. 如果影像理解功能無法使用、遭略過或失敗，瀏覽器會改為傳回原始影像區塊。

螢幕截圖影像區塊是私有工具結果：代理程式可以檢查它們，但 OpenClaw 不會自動將它們附加至頻道回覆。若要分享螢幕截圖，請要求代理程式使用訊息工具明確傳送。

使用現有的 `tools.media.image` / `tools.media.models` 欄位來設定模型備援、逾時、位元組限制、設定檔及提供者要求設定。

如果目前使用中的主要模型已支援視覺功能，且未明確設定影像理解模型，OpenClaw 會保留一般影像結果，讓主要模型可以直接讀取螢幕截圖。

<AccordionGroup>

<Accordion title="連接埠與可連線性">

- 控制服務會繫結至迴送介面，其連接埠衍生自 `gateway.port`（預設為 `18791` = 閘道 + 2）。`OPENCLAW_GATEWAY_PORT` 的優先順序高於 `gateway.port`；兩者都會使同一系列的衍生連接埠一起位移。
- 本機 `openclaw` 設定檔會從控制連接埠上方 9 個連接埠開始的範圍，自動指派 `cdpPort`/`cdpUrl`（預設為 `18800`-`18899`）；僅針對遠端 CDP 設定檔或附加至現有工作階段端點時設定這些值。未設定 `cdpUrl` 時，預設使用受管理的本機 CDP 連接埠。
- 遠端與 `attachOnly` CDP 的可連線性、WebSocket 交握，以及本機受管理 Chrome 的啟動，都使用內建期限。
- 受管理 Chrome 重複啟動或就緒失敗時，會依設定檔啟動斷路機制。連續失敗數次後，OpenClaw 會短暫暫停新的啟動嘗試，而不會在每次呼叫瀏覽器工具時都產生 Chromium。請修正啟動問題；如果不需要瀏覽器，請將其停用；或在修復後重新啟動閘道。

</Accordion>

<Accordion title="SSRF 政策">

- 瀏覽器導覽與開啟分頁要求會經過預檢。在動作執行期間及有界限的動作後寬限期內，受防護的 Playwright 互動（點擊、座標點擊、游標停留、拖曳、捲動、選取、按鍵、輸入、表單填寫與評估）會在送出 HTTP 要求位元組之前，攔截政策拒絕的頂層與子框架文件載入，然後盡力重新檢查最終的 `http(s)` URL。
- 每次全新啟動由 OpenClaw 管理的 Chrome 前，OpenClaw 都會盡力停用網路預測，以抑制 Chromium 對這些遭拒載入所進行的已觀察到之推測性預先連線。這是縱深防禦，而非政策邊界：跨控制服務重新啟動而重複使用的瀏覽器及其他瀏覽器後端，可能不具備相同的強化措施。Playwright 路由仍不是網路防火牆，也不會攔截重新導向跳轉、彈出式視窗的第一個要求、Service Worker 流量、在有界限防護視窗結束後執行的頁面程式碼，或所有背景／子資源路徑。完整的輸出流量隔離需要由擁有者端進行隔離，或使用強制執行政策的 Proxy。
- 在嚴格 SSRF 模式下，也會檢查遠端 CDP 端點探索與 `/json/version` 探測（`cdpUrl`）。
- 閘道／提供者的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 與 `NO_PROXY` 環境變數不會自動代理由 OpenClaw 管理的瀏覽器。受管理的 Chrome 預設直接連線，因此提供者的 Proxy 設定不會削弱瀏覽器 SSRF 檢查。
- 由 OpenClaw 管理的本機 CDP 就緒探測與 DevTools WebSocket 連線，會針對實際啟動的迴送端點略過受管理的網路 Proxy，因此當操作人員的 Proxy 封鎖迴送輸出流量時，`openclaw browser start` 仍可運作。
- 若要代理受管理的瀏覽器本身，請透過 `browser.extraArgs` 傳入明確的 Chrome Proxy 旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非刻意啟用瀏覽器的私人網路存取，否則嚴格 SSRF 模式會封鎖明確的瀏覽器 Proxy 路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設為關閉；僅在刻意信任私人網路瀏覽器存取時啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。

</Accordion>

<Accordion title="設定檔行為">

- `attachOnly: true` 表示絕不啟動本機瀏覽器；僅在已有瀏覽器執行時附加。
- `headless` 可設定於全域或各個本機受管理設定檔。各設定檔的值會覆寫 `browser.headless`，因此一個本機啟動的設定檔可以維持無頭模式，而另一個仍保持可見。
- `POST /start?headless=true` 與 `openclaw browser start --headless` 會要求為本機受管理設定檔進行一次性無頭啟動，而不重寫 `browser.headless` 或設定檔組態。現有工作階段、僅附加與遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動這些瀏覽器程序。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，若環境及設定檔／全域組態都未明確選擇有頭模式，本機受管理設定檔會自動預設為無頭模式。請使用意思明確的瀏覽器層級形式 `openclaw browser --json status`；尾隨的 `openclaw browser status --json` 也能運作，因為 `status` 並未定義自己的 `--json`。該命令會將 `headlessSource` 回報為 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前程序以無頭模式啟動本機受管理瀏覽器。`OPENCLAW_BROWSER_HEADLESS=0` 會強制一般啟動使用有頭模式，並在沒有顯示伺服器的 Linux 主機上傳回可採取行動的錯誤；針對該次啟動明確提出的 `start --headless` 要求仍具有優先權。
- 瀏覽器控制路由與程式化用戶端會保留無顯示器錯誤中人類可讀的 `error`，並公開穩定的原因 `no_display_for_headed_profile`。其 `details` 僅包含 `profile`、`requestedHeadless`、`headlessSource` 與 `displayPresent`，讓 API 用戶端無須比對訊息文字，即可選擇正確的修復方式。
- 對於執行中的本機受管理設定檔，狀態與 doctor 會查詢 Chrome 的瀏覽器層級 CDP 端點，以取得算繪器、後端、裝置／驅動程式、功能狀態、驅動程式因應措施及加速視訊功能。結果會針對該瀏覽器程序快取，並由 `openclaw browser --json status` 完整公開。被動狀態呼叫不會啟動 Chrome。現有工作階段、擴充功能、遠端 CDP 與沙箱瀏覽器會維持分離，不會透過此受管理主機路徑檢查。
- 無頭模式的受管理 Chrome 仍使用保守的 `--disable-gpu` 預設值。診斷不會啟用加速、新增全域加速設定，或授予沙箱瀏覽器裝置存取權。
- `executablePath` 可設定於全域或各個本機受管理設定檔。各設定檔的值會覆寫 `browser.executablePath`，因此不同的受管理設定檔可以啟動不同的 Chromium 系瀏覽器。兩種形式均接受以 `~` 代表你的作業系統主目錄。
- `color`（頂層及各設定檔）會為瀏覽器 UI 套用色調，讓你看出目前使用中的設定檔。
- 預設設定檔為 `openclaw`（受管理的獨立模式）。使用 `defaultProfile: "user"` 以選擇使用已登入的使用者瀏覽器。
- 自動偵測順序：若系統預設瀏覽器以 Chromium 為基礎，則優先使用；否則依序為 Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而非原始 CDP。它可以透過 Chrome MCP 自動連線附加，或在你已有執行中瀏覽器的 DevTools 端點時透過 `cdpUrl` 附加。
- `driver: "extension"` 會透過 [OpenClaw Chrome 擴充功能](/zh-TW/tools/chrome-extension)操控你已登入的 Chrome。轉送器擁有自己的迴送端點，因此這些設定檔不接受 `cdpUrl`。這是唯一能在電腦前無人操作時運作的已登入瀏覽器模式。
- 當現有工作階段設定檔應附加至非預設 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受以 `~` 代表你的作業系統主目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系瀏覽器

如果你的**系統預設**瀏覽器以 Chromium 為基礎（Chrome/Brave/Edge 等），OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫自動偵測。頂層及各設定檔的 `executablePath` 值接受以 `~` 代表你的作業系統主目錄：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或者依平台在組態中設定：

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

各設定檔的 `executablePath` 僅影響由 OpenClaw 啟動的本機受管理設定檔。`existing-session` 設定檔會改為附加至已執行的瀏覽器，而遠端 CDP 設定檔則使用 `cdpUrl` 後方的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：**閘道會啟動迴送控制服務，且可啟動本機瀏覽器。
- **遠端控制（節點主機）：**在具有瀏覽器的機器上執行節點主機；閘道會將瀏覽器動作代理至該主機。
- **遠端 CDP：**設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`），以附加至遠端 Chromium 系瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於迴送介面上由外部管理的 CDP 服務（例如在 Docker 中發布至 `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。沒有 `attachOnly` 的迴送 CDP 會被視為由 OpenClaw 管理的本機瀏覽器設定檔。
- `headless` 僅影響由 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更現有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。在執行中的本機受管理設定檔上變更此值，會將該設定檔標記為需要重新啟動／協調，讓下次啟動使用新的二進位檔。

停止行為會因設定檔模式而異：

- 本機受管理設定檔：`openclaw browser stop` 會停止由 OpenClaw 啟動的瀏覽器程序
- 僅附加與遠端 CDP 設定檔：`openclaw browser stop` 會關閉使用中的控制工作階段，並釋放 Playwright/CDP 模擬覆寫（檢視區、配色、語言地區、時區、離線模式及類似狀態），即使 OpenClaw 並未啟動任何瀏覽器程序

遠端 CDP URL 可以包含驗證資訊：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic 驗證（例如 `https://user:pass@provider.example`）

OpenClaw 在呼叫 `/json/*` 端點及連線至 CDP WebSocket 時會保留驗證資訊。權杖請優先使用環境變數或密鑰管理工具，而不要提交至設定檔。

## 節點瀏覽器 Proxy（零設定預設值）

如果你在裝有瀏覽器的機器上執行 **節點主機**，OpenClaw 可以自動將瀏覽器工具呼叫路由至該節點，不需要任何額外的瀏覽器設定。這是遠端閘道的預設路徑。

注意事項：

- 節點主機透過 **Proxy 命令** 公開其本機瀏覽器控制伺服器。
- 設定檔來自節點本身的 `browser.profiles` 設定（與本機相同）。
- 無論 `allowProfiles` 為何，Proxy 命令都不允許永久變更設定檔（`create-profile`、`delete-profile`、`reset-profile`）；請直接在節點上進行這些變更。
- `nodeHost.browserProxy.allowProfiles` 是選用項目。將其留空即可使用舊版／預設行為：所有已設定的設定檔仍可透過 Proxy 存取。
- 如果設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將其視為最小權限邊界，用來限制 Proxy 可連線的設定檔名稱。
- 如果不需要此功能，請將其停用：
  - 在節點上：`nodeHost.browserProxy.enabled=false`
  - 在閘道上：`gateway.nodes.browser.mode="off"`（也接受 `"auto"` 以選擇單一已連線的瀏覽器節點，或使用 `"manual"` 以要求明確指定節點參數）

## Browserless（託管式遠端 CDP）

[Browserless](https://browserless.io) 是一項託管式 Chromium 服務，透過 HTTPS 和 WebSocket 公開 CDP 連線 URL。OpenClaw 可使用任一形式，但對遠端瀏覽器設定檔而言，最簡單的選項是使用 Browserless 連線文件中的直接 WebSocket URL。

範例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注意事項：

- 將 `<BROWSERLESS_API_KEY>` 替換為你真正的 Browserless 權杖。
- 選擇與你的 Browserless 帳號相符的區域端點（請參閱其文件）。
- 如果 Browserless 提供 HTTPS 基底 URL，你可以將其轉換為
  `wss://` 以直接連線至 CDP，或保留 HTTPS URL，讓 OpenClaw
  探索 `/json/version`。

### 位於同一主機上的 Browserless Docker

當 Browserless 自行託管於 Docker 中，而 OpenClaw 在主機上執行時，請將 Browserless 視為由外部管理的 CDP 服務：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` 中的位址必須可由 OpenClaw 程序連線。Browserless 也必須公布相符且可連線的端點；請將 Browserless 的 `EXTERNAL` 設為同一個可供 OpenClaw 連線的 WebSocket 公開基底位址，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的 Docker 私有網路位址。如果 `/json/version` 傳回 `webSocketDebuggerUrl`，且其指向 OpenClaw 無法連線的位址，CDP HTTP 可能看似正常，但 WebSocket 附加仍會失敗。

對於迴路位址的 Browserless 設定檔，請勿讓 `attachOnly` 保持未設定。若沒有 `attachOnly`，OpenClaw 會將迴路連接埠視為本機受管理的瀏覽器設定檔，並可能回報該連接埠正由其他程序使用，而非由 OpenClaw 擁有。

## 直接 WebSocket CDP 供應商

部分託管式瀏覽器服務公開的是 **直接 WebSocket** 端點，而非標準的 HTTP 型 CDP 探索（`/json/version`）。OpenClaw 接受三種 CDP URL 格式，並會自動選擇正確的連線策略：

- **HTTP(S) 探索** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 會呼叫 `/json/version` 以探索 WebSocket 偵錯工具 URL，然後建立連線。不會回退至 WebSocket。
- **直接 WebSocket 端點** - `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，並包含 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  路徑。OpenClaw 會直接透過 WebSocket 交握建立連線，並完全略過
  `/json/version`。
- **裸 WebSocket 根位址** - `ws://host[:port]` 或 `wss://host[:port]`，且沒有
  `/devtools/...` 路徑（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試 HTTP
  `/json/version` 探索（將配置正規化為 `http`/`https`）；
  如果探索傳回 `webSocketDebuggerUrl`，就會使用該位址，否則 OpenClaw
  會回退至裸根位址上的直接 WebSocket 交握。如果公布的
  WebSocket 端點拒絕 CDP 交握，但設定的裸根位址
  接受交握，OpenClaw 也會回退至該根位址。如此一來，指向本機 Chrome 的裸 `ws://`
  仍可連線，因為 Chrome 只接受來自 `/json/version` 的特定目標路徑上的 WebSocket
  升級；同時，當託管供應商的探索端點公布不適合 Playwright CDP 的短效 URL 時，
  仍可使用其根 WebSocket 端點。

`openclaw browser doctor` 使用與執行階段附加相同的「先探索、再回退至 WebSocket」邏輯，因此可成功連線的裸根 URL 不會被診斷工具回報為無法連線。

### Browserbase

[Browserbase](https://www.browserbase.com) 是用於執行無頭瀏覽器的雲端平台，內建 CAPTCHA 解決功能、隱匿模式和住宅 Proxy。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注意事項：

- [註冊](https://www.browserbase.com/sign-up)，並從 [Overview dashboard](https://www.browserbase.com/overview) 複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你真正的 Browserbase API 金鑰。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段。
- 如需目前免費方案的限制與付費方案，請參閱[定價](https://www.browserbase.com/pricing)。
- 如需完整的 API 參考資料、SDK 指南與整合範例，請參閱 [Browserbase 文件](https://docs.browserbase.com)。

### Notte

[Notte](https://www.notte.cc) 是用於執行無頭瀏覽器的雲端平台，內建隱匿功能、住宅 Proxy，以及原生支援 CDP 的 WebSocket 閘道。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

注意事項：

- [註冊](https://console.notte.cc)，並從主控台設定頁面複製你的 **API Key**。
- 將 `<NOTTE_API_KEY>` 替換為你真正的 Notte API 金鑰。
- Notte 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段。WebSocket 中斷連線時，該工作階段會被銷毀。
- 如需目前免費方案的限制與付費方案，請參閱[定價](https://www.notte.cc/#pricing)。
- 如需完整的 API 參考資料、SDK 指南與整合範例，請參閱 [Notte 文件](https://docs.notte.cc)。

## 安全性

核心概念：

- 瀏覽器控制僅限迴路位址；存取會經過閘道驗證或節點配對。
- 獨立的迴路瀏覽器 HTTP API **僅使用共用密鑰驗證**：
  閘道權杖的 Bearer 驗證、`x-openclaw-password`，或使用
  已設定閘道密碼的 HTTP Basic 驗證。
- Tailscale Serve 身分標頭和 `gateway.auth.mode: "trusted-proxy"`
  **無法**驗證此獨立的迴路瀏覽器 API。
- 如果已啟用瀏覽器控制，但尚未設定共用密鑰驗證，OpenClaw
  會在啟動時自動產生並保存瀏覽器控制的認證資訊：
  當 `gateway.auth.mode` 為 `none` 時產生權杖，為
  `trusted-proxy` 時則產生密碼（透過 `gateway.auth.password` 保存，
  讓程序外的迴路用戶端可以解析）。如果已針對該模式明確設定
  字串認證資訊，或 `gateway.auth.mode` 為 `password`，
  則會略過自動產生。
- 如果想使用由你控制的固定密鑰，而非產生的密鑰，
  請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或
  `OPENCLAW_GATEWAY_PASSWORD`。

遠端 CDP 提示：

- 可行時，請優先使用加密端點（HTTPS 或 WSS）與短效權杖。
- 避免將長效權杖直接嵌入設定檔。
- 將閘道與所有節點主機保留在私人網路（Tailscale）中；避免公開暴露。
- 將遠端 CDP URL／權杖視為密鑰；請優先使用環境變數或密鑰管理工具。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **由 OpenClaw 管理**：專用的 Chromium 型瀏覽器執行個體，具有自己的使用者資料目錄與 CDP 連接埠
- **遠端**：明確的 CDP URL（在其他位置執行的 Chromium 型瀏覽器）
- **現有工作階段**：透過 Chrome DevTools MCP 自動連線使用你現有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，系統會自動建立。
- `user` 設定檔為內建設定，用於附加至 Chrome MCP 現有工作階段。
- 除 `user` 外，現有工作階段設定檔需選擇啟用；請使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設從 **18800-18899** 範圍配置。
- 刪除設定檔會將其本機資料目錄移至垃圾桶。

所有控制端點都接受 `?profile=<name>`；命令列介面使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用現有工作階段

OpenClaw 也可以透過官方 Chrome DevTools MCP 伺服器附加至執行中的 Chromium 型瀏覽器設定檔。這會重複使用已在該瀏覽器設定檔中開啟的分頁和登入狀態。

官方背景資訊與設定參考資料：

- [Chrome for Developers：搭配瀏覽器工作階段使用 Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：`user`。如果想使用不同的名稱、顏色或瀏覽器資料目錄，請自行建立自訂的現有工作階段設定檔。

內建的 `user` 設定檔預設使用 Chrome MCP 自動連線，目標是預設的本機 Google Chrome 設定檔。若要使用 Brave、Edge、Chromium 或非預設的 Chrome 設定檔，請使用 `userDataDir`。`~` 會展開為你的作業系統家目錄：

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

接著，在相符的瀏覽器中：

1. 開啟該瀏覽器用於遠端偵錯的檢查頁面。
2. 啟用遠端偵錯。
3. 保持瀏覽器執行，並在 OpenClaw 附加時核准連線提示。

常見的檢查頁面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

即時附加冒煙測試：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時的情況：

- `status` 顯示 `driver: existing-session`
- `status` 顯示 `transport: chrome-mcp`
- `status` 顯示 `running: true`
- `tabs` 列出你已開啟的瀏覽器分頁
- `snapshot` 傳回所選即時分頁中的參照

附加無法運作時的檢查項目：

- 目標 Chromium 系瀏覽器的版本為 `144+`
- 已在該瀏覽器的檢查頁面啟用遠端偵錯
- 瀏覽器顯示附加同意提示，且你已接受
- 如果 Chrome 是使用明確的 `--remote-debugging-port` 啟動，請將
  `browser.profiles.<name>.cdpUrl` 設為該 DevTools 端點，而不要依賴
  Chrome MCP 自動連線
- `openclaw doctor` 會遷移舊的擴充功能式瀏覽器設定，並檢查
  預設自動連線設定檔所需的 Chrome 是否已安裝於本機，但它無法
  代你啟用瀏覽器端的遠端偵錯

代理程式用法：

- 需要使用使用者已登入的瀏覽器狀態時，請使用 `profile="user"`。
- 如果使用自訂的現有工作階段設定檔，請傳入該明確的設定檔名稱。
- 只有在使用者位於電腦前，可核准附加
  提示時，才選擇此模式。
- 閘道或節點主機可以產生 `npx chrome-devtools-mcp@latest --autoConnect`。

注意事項：

- 此路徑的風險高於隔離的 `openclaw` 設定檔，因為它可以
  在你已登入的瀏覽器工作階段中執行操作。
- OpenClaw 不會為此驅動程式啟動瀏覽器；它只會附加。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果
  已設定 `userDataDir`，系統會將其原樣傳遞，以指定該使用者資料目錄。
- 現有工作階段可在所選主機上，或透過已連線的
  瀏覽器節點進行附加。如果 Chrome 位於其他位置，且沒有瀏覽器節點連線，請改用
  遠端 CDP 或節點主機。
- Chrome MCP 目標與快照參照的範圍限定於單一 MCP 子程序。該
  程序重新啟動後，請再次執行 `browser tabs`，在進行目標特定工作前明確選擇新的
  目標，並在使用參照前取得新快照。
  每個參照僅對其目標和最新快照有效。即使 URL 相符，舊別名也不會
  轉移至替代分頁。
- Chrome DevTools MCP 目前依程序本機的數字頁面
  ID 路由頁面工具。程序範圍的控制代碼可防止在子程序替換後重複使用，但在
  相鄰工具呼叫之間，如果瀏覽器內容在程序內被替換，仍可能
  將操作重新指向其他目標。完全不可分割的路由需要上游頁面工具支援
  穩定的目標 ID。

### 自訂 Chrome MCP 啟動方式

當預設的 `npx chrome-devtools-mcp@latest` 流程不符合需求（離線主機、
固定版本、隨附的二進位檔）時，可針對每個設定檔覆寫所產生的 Chrome DevTools MCP 伺服器：

| 欄位        | 功能                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要產生以取代 `npx` 的可執行檔。依原樣解析；會採用絕對路徑。                                          |
| `mcpArgs`    | 逐字傳遞給 `mcpCommand` 的引數陣列。取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。 |

在現有工作階段設定檔中設定 `cdpUrl` 時，OpenClaw 會略過
`--autoConnect`，並自動將端點轉送至 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標與 `userDataDir` 無法合併使用：設定 `cdpUrl` 時，
Chrome MCP 啟動會忽略 `userDataDir`，因為 Chrome MCP 會附加至
端點後方正在執行的瀏覽器，而不是開啟設定檔
目錄。

<Accordion title="現有工作階段功能限制">

相較於受管理的 `openclaw` 設定檔，現有工作階段驅動程式受到較多限制：

- **螢幕截圖** - 頁面擷取和 `--ref` 元素擷取可正常運作；CSS `--element` 選取器則不支援。頁面或基於參照的元素螢幕截圖不需要 Playwright。（任何設定檔的 `--full-page` 都無法與 `--ref` 或 `--element` 合併使用，不僅限於現有工作階段。）
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照參照（不支援 CSS 選取器）。`click-coords` 會按一下可見檢視區座標，不需要快照參照。`click` 僅支援滑鼠左鍵（不支援按鈕覆寫或輔助按鍵）。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select` 和 `fill` 不支援各次呼叫的 `timeoutMs` 覆寫；`evaluate` 則支援。`select` 接受單一值。不支援 `batch`；請逐一傳送操作。
- **等待／上傳／對話方塊** - `wait --url` 支援完全相符、子字串和 glob 模式（與受管理設定檔相同）；現有工作階段設定檔不支援 `wait --load networkidle`（受管理和原始／遠端 CDP 設定檔支援）。上傳掛鉤需要 `ref` 或 `inputRef`，一次一個檔案，不支援 CSS `element`。對話方塊掛鉤不支援逾時覆寫或 `dialogId`。
- **對話方塊可見性** - 當操作開啟強制回應對話方塊時，受管理瀏覽器的操作回應會包含 `blockedByDialog` 和 `browserState.dialogs.pending`；快照也會包含待處理的對話方塊狀態。對話方塊待處理時，請使用 `browser dialog --accept/--dismiss --dialog-id <id>` 回應。在 OpenClaw 之外處理的對話方塊會顯示於 `browserState.dialogs.recent` 下。
- **僅限受管理模式的功能** - PDF 匯出、下載攔截和 `responsebody` 仍需要使用受管理瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不存取你的個人瀏覽器設定檔。
- **專用連接埠**：避免使用 `9222`，以防止與開發工作流程發生衝突。
- **確定性的分頁控制**：`tabs` 會先傳回 `suggestedTargetId`，接著是
  穩定的 `tabId` 控制代碼，例如 `t1`、選用標籤，以及原始 `targetId`。
  代理程式應重複使用 `suggestedTargetId`；原始 ID 仍可用於
  偵錯與相容性用途。

## 瀏覽器選擇

在本機啟動時，OpenClaw 會選擇第一個可用的瀏覽器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆寫。

平台：

- macOS：檢查 `/Applications` 和 `~/Applications`。
- Linux：檢查 `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常見的 Chrome／Brave／Edge／Chromium 位置，以及
  `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下由 Playwright 管理的 Chromium。
- Windows：檢查常見的安裝位置。

## 控制 API（選用）

為了撰寫指令碼與偵錯，閘道會公開一個小型的**僅限回送的 HTTP
控制 API**，以及相對應的 `openclaw browser` 命令列介面（快照、參照、增強等待功能、
JSON 輸出、偵錯工作流程）。完整參考資料請參閱
[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

如需 Linux 特定問題（尤其是 snap Chromium）的相關資訊，請參閱
[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

如需 WSL2 閘道與 Windows Chrome 分離主機設定的相關資訊，請參閱
[WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 封鎖

這是兩種不同的失敗類別，分別指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面是否正常。
- **導覽 SSRF 封鎖**表示瀏覽器控制平面正常，但頁面導覽目標遭原則拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 當設定回送外部 CDP 服務但未設定 `attachOnly: true` 時的
    `Port <port> is in use for profile "<name>" but not by openclaw`
- 導覽 SSRF 封鎖：
  - `open`、`navigate`、快照或開啟分頁流程因瀏覽器／網路原則錯誤而失敗，但 `start` 和 `tabs` 仍可運作

使用以下最小操作順序來區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果判讀方式：

- 如果 `start` 因 `not reachable after start` 而失敗，請先排解 CDP 就緒問題。
- 如果 `start` 成功但 `tabs` 失敗，表示控制平面仍不正常。請將此視為 CDP 可連線性問題，而非頁面導覽問題。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面已啟動，而失敗原因位於導覽原則或目標頁面。
- 如果 `start`、`tabs` 和 `open` 全部成功，表示基本的受管理瀏覽器控制路徑正常。

重要行為詳細資訊：

- 即使未設定 `browser.ssrfPolicy`，瀏覽器設定仍預設使用失敗時拒絕的 SSRF 原則物件。
- 對於本機回送 `openclaw` 受管理設定檔，CDP 健康狀態檢查會刻意略過 OpenClaw 自有本機控制平面的瀏覽器 SSRF 可連線性強制執行。
- 導覽保護是分開的。`start` 或 `tabs` 成功並不表示後續的 `open` 或 `navigate` 目標受到允許。

安全性指引：

- 預設情況下，**請勿**放寬瀏覽器 SSRF 原則。
- 應優先使用 `hostnameAllowlist` 或 `allowedHostnames` 等精確的主機例外，而非廣泛的私人網路存取。
- 只有在刻意設定為受信任，且需要並已審查私人網路瀏覽器存取的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 代理程式工具與控制運作方式

代理程式會取得**一項工具**來進行瀏覽器自動化：

- `browser` - 診斷／狀態／啟動／停止／分頁／開啟／聚焦／關閉／快照／螢幕截圖／導覽／操作

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹狀結構（AI 或 ARIA）。
- `browser act` 使用快照的 `ref` ID 來點擊／輸入／拖曳／選取。
- `browser screenshot` 擷取像素（整個頁面、元素或帶標籤的參照）。
- `browser doctor` 檢查閘道、外掛、設定檔、瀏覽器及分頁是否就緒。
- `browser` 接受：
  - `profile`，用於選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target`（`sandbox` | `host` | `node`），用於選擇瀏覽器所在位置。
  - 在沙箱化工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 若省略 `target`：沙箱化工作階段預設為 `sandbox`，非沙箱工作階段預設為 `host`。
  - 若已連線具備瀏覽器功能的節點，除非你指定 `target="host"` 或 `target="node"`，否則此工具可能會自動將請求路由至該節點。

這可讓代理程式維持確定性，並避免使用脆弱的選擇器。

## 相關資訊

- [工具總覽](/zh-TW/tools) - 所有可用的代理程式工具
- [沙箱化](/zh-TW/gateway/sandboxing) - 在沙箱化環境中控制瀏覽器
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制的風險與強化措施
