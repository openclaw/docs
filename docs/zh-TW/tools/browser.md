---
read_when:
    - 新增由代理程式控制的瀏覽器自動化
    - 偵錯 OpenClaw 為何會干擾你自己的 Chrome 瀏覽器
    - 在 macOS App 中實作瀏覽器設定與生命週期
summary: 整合式瀏覽器控制服務與操作命令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-12T14:50:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行由代理程式控制的**專用 Chrome/Brave/Edge/Chromium 設定檔**。它透過閘道內的小型本機控制服務執行（僅限回送介面），並與你的個人瀏覽器隔離。

- 將它視為**獨立且僅供代理程式使用的瀏覽器**。`openclaw` 設定檔絕不會接觸你的個人瀏覽器設定檔。
- 代理程式會在這個隔離環境中開啟分頁、讀取頁面、點擊及輸入。
- 內建的 `user` 設定檔則會透過 Chrome DevTools MCP 連接到你實際已登入的 Chrome 工作階段。

## 你會獲得什麼

- 名為 **openclaw** 的獨立瀏覽器設定檔（預設使用橘色強調色）。
- 確定性的分頁控制（列出／開啟／聚焦／關閉）。
- 代理程式動作（點擊／輸入／拖曳／選取）、快照、螢幕截圖及 PDF。
- Playwright 支援的設定檔會將直接導向附件的瀏覽儲存至受管理的下載目錄，並在最終 URL 通過政策驗證後傳回 `{ url, suggestedFilename, path }` 中繼資料。
- 當 Playwright 支援的代理程式動作立即啟動一或多個下載時，會傳回包含相同受管理中繼資料的 `downloads` 陣列。
- 內附的 `browser-automation` skill，會在啟用瀏覽器外掛時，教導代理程式如何執行快照、穩定分頁、過期參照及手動阻礙的復原迴圈。
- 選用的多設定檔支援（`openclaw`、`work`、`remote` 等）。

此瀏覽器**不適合**作為你的日常主要瀏覽器。它是供代理程式自動化與驗證使用的安全隔離介面。

在 macOS 上，你可以明確地將 Cookie 從 Chrome 系列的系統設定檔複製到獨立的受管理設定檔。受管理瀏覽器仍會使用自己的使用者資料目錄；只會複製所選的 Cookie，本機儲存空間和 IndexedDB 則會保留在原處。請參閱[設定檔](#profiles-multi-browser)或 [`openclaw browser` 命令列介面參考](/zh-TW/cli/browser)，以瞭解匯入命令與限制。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“瀏覽器已停用”表示外掛或 `browser.enabled` 已關閉；請參閱[設定](#configuration)和[外掛控制](#plugin-control)。

如果完全找不到 `openclaw browser`，或代理程式表示瀏覽器工具無法使用，請直接前往[缺少瀏覽器命令或工具](#missing-browser-command-or-tool)。

## 外掛控制

預設的 `browser` 工具是內附外掛。若要以另一個註冊相同 `browser` 工具名稱的外掛取代它，請停用此工具：

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

預設運作需要同時設定 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。只停用外掛會將 `openclaw browser` 命令列介面、`browser.request` 閘道方法、代理程式工具及控制服務視為一個整體移除；你的 `browser.*` 設定會保持不變，供替代項目使用。

變更瀏覽器設定後必須重新啟動閘道，外掛才能重新註冊其服務。

## 代理程式指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和 `web_fetch`，但不包含完整的 `browser` 工具。若要允許代理程式或產生的子代理程式使用瀏覽器自動化，請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

若是單一代理程式，請使用 `agents.list[].tools.alsoAllow: ["browser"]`。只設定 `tools.subagents.tools.allow: ["browser"]` 並不足夠，因為子代理程式政策是在設定檔篩選後才套用。

瀏覽器外掛提供兩個層級的代理程式指引：

- `browser` 工具說明包含精簡且永遠生效的契約：選擇正確的設定檔、讓參照維持在同一分頁、使用 `tabId`／標籤指定分頁，並在多步驟工作中載入瀏覽器 skill。
- 內附的 `browser-automation` skill 包含較完整的操作迴圈：先檢查狀態／分頁、為工作分頁加上標籤、操作前建立快照、介面變更後重新建立快照、嘗試復原過期參照一次，並將登入／2FA／驗證碼或相機／麥克風阻礙回報為需手動處理的動作，而不是猜測。

啟用外掛後，外掛內附的 skill 會列在代理程式的可用 skill 中。完整的 skill 指示會依需求載入，因此一般操作不必承擔完整的 token 成本。

## 缺少瀏覽器命令或工具

如果升級後無法辨識 `openclaw browser`、缺少 `browser.request`，或代理程式回報瀏覽器工具無法使用，常見原因是 `plugins.allow` 清單省略了 `browser`，且沒有根層級的 `browser` 設定區塊。請加入：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊（`browser` 下的任何鍵，例如 `browser.enabled=true` 或 `browser.profiles.<name>`）即使在限制性的 `plugins.allow` 下，也會啟用內附的瀏覽器外掛，這與內附頻道的設定行為一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身無法取代允許清單成員資格。完全移除 `plugins.allow` 也會恢復預設行為。

## 設定檔：`openclaw`、`user`、`chrome`

- `openclaw`：受管理的隔離瀏覽器（不需要擴充功能）。
- `user`：內建的 Chrome DevTools MCP 連接設定檔，用於你**實際已登入的 Chrome** 工作階段。OpenClaw 第一次連接時，Chrome 會顯示阻擋操作的 "Allow remote debugging?" 提示，因此必須有人在電腦旁。
- `chrome`：內建的 [Chrome 擴充功能](/zh-TW/tools/chrome-extension)設定檔，用於你**實際已登入的 Chrome** 工作階段。即使沒有人在電腦旁，也可以透過手機運作，因為它是透過 OpenClaw 瀏覽器擴充功能操控分頁，而不是使用遠端偵錯連接埠，因此不會顯示 "Allow remote debugging?" 提示。

對於代理程式的瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 當現有登入工作階段很重要，且使用者**不在電腦旁**（Telegram、WhatsApp 等）時，優先使用 `profile="chrome"`（擴充功能）。
- 當現有登入工作階段很重要，且使用者**在電腦旁**可核准連接提示時，優先使用 `profile="user"`（Chrome MCP）。
- 當你想使用特定瀏覽器模式時，`profile` 是明確的覆寫設定。

若要預設使用受管理模式，請設定 `browser.defaultProfile: "openclaw"`。

## 設定

瀏覽器設定位於 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 預設值：true
    evaluateEnabled: true, // 預設值：true；false 會停用 act:evaluate（任意 JS）
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 僅針對受信任的私人網路存取明確啟用
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 舊版單一設定檔覆寫
    remoteCdpTimeoutMs: 1500, // 遠端 CDP HTTP 逾時（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 遠端 CDP WebSocket 交握逾時（毫秒）
    localLaunchTimeoutMs: 15000, // 本機受管理 Chrome 探索逾時（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本機受管理 Chrome 啟動後 CDP 就緒逾時（毫秒）
    actionTimeoutMs: 60000, // 預設瀏覽器 act 逾時（毫秒）
    tabCleanup: {
      enabled: true, // 預設值：true
      idleMinutes: 120, // 設為 0 可停用閒置清理
      maxTabsPerSession: 8, // 設為 0 可停用每個工作階段的上限
      sweepMinutes: 5,
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

當呼叫端未傳入明確的 `snapshotFormat` 或 `mode` 時，`browser.snapshotDefaults.mode: "efficient"` 會變更預設的 `snapshot` 擷取模式；如需每次呼叫的快照選項，請參閱[瀏覽器控制 API](/zh-TW/tools/browser-control)。

### 螢幕截圖視覺理解（支援純文字模型）

當主要模型是純文字模型（不支援視覺／多模態）時，瀏覽器螢幕截圖會傳回模型無法讀取的圖片區塊。瀏覽器螢幕截圖會重複使用現有的圖片理解設定，因此設定為理解媒體內容的圖片模型可以將螢幕截圖描述成文字，而不需要任何瀏覽器專用的模型設定。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // 新增備援候選項目；第一個成功的項目優先
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // 標記為支援圖片時，共用媒體模型也可運作。
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // 也會採用現有的圖片模型預設值。
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**運作方式：**

1. 代理程式呼叫 `browser screenshot`，並照常將圖片擷取至磁碟。
2. 瀏覽器工具會詢問現有的圖片理解執行階段，是否能使用已設定的媒體圖片模型、共用媒體模型、圖片模型預設值或由驗證支援的圖片提供者來描述螢幕截圖。
3. 視覺模型傳回文字描述，該描述會以 `wrapExternalContent`（提示注入防護）包裝，並以文字區塊而非圖片區塊的形式傳回代理程式。
4. 如果圖片理解功能無法使用、遭略過或失敗，瀏覽器會改為傳回原始圖片區塊。

螢幕截圖圖片區塊是私有工具結果：代理程式可以檢查它們，但 OpenClaw 不會自動將它們附加至頻道回覆。若要分享螢幕截圖，請要求代理程式明確使用訊息工具傳送。

請使用現有的 `tools.media.image`／`tools.media.models` 欄位設定模型備援、逾時、位元組限制、設定檔及提供者要求設定。

如果使用中的主要模型已支援視覺，且未設定明確的圖片理解模型，OpenClaw 會保留一般圖片結果，讓主要模型可以直接讀取螢幕截圖。

<AccordionGroup>

<Accordion title="連接埠與可達性">

- 控制服務會繫結至迴送介面上的連接埠，該連接埠衍生自 `gateway.port`（預設為 `18791`，即閘道 + 2）。`OPENCLAW_GATEWAY_PORT` 的優先順序高於 `gateway.port`；任一設定都會使同一系列的衍生連接埠一併位移。
- 本機 `openclaw` 設定檔會從控制連接埠上方第 9 個連接埠開始的範圍，自動指派 `cdpPort`/`cdpUrl`（預設為 `18800`-`18899`）；只有遠端 CDP 設定檔或附加至既有工作階段端點時，才需設定這些值。未設定 `cdpUrl` 時，預設使用受管理的本機 CDP 連接埠。
- `remoteCdpTimeoutMs` 適用於遠端與 `attachOnly` CDP HTTP 可連線性檢查，以及開啟分頁的 HTTP 要求；`remoteCdpHandshakeTimeoutMs` 適用於其 CDP WebSocket 交握。持續性的遠端 Playwright 分頁列舉會取兩者中較大的值作為操作期限。
- `localLaunchTimeoutMs` 是在本機啟動的受管理 Chrome 程序公開其 CDP HTTP 端點的時間預算。`localCdpReadyTimeoutMs` 是發現程序後，等待 CDP websocket 就緒的後續時間預算。在 Chromium 啟動較慢的 Raspberry Pi、低階 VPS 或較舊硬體上，請提高這些值。值必須是最大為 `120000` ms 的正整數；無效的設定值會遭拒絕。
- 系統會依設定檔對重複發生的受管理 Chrome 啟動／就緒失敗啟用斷路機制。連續失敗數次後，OpenClaw 會暫停新的啟動嘗試，而不會在每次呼叫瀏覽器工具時都產生 Chromium 程序。請修正啟動問題；若不需要瀏覽器，請將其停用；或在修復後重新啟動閘道。
- 當呼叫端未傳入 `timeoutMs` 時，`actionTimeoutMs` 是瀏覽器 `act` 要求的預設時間預算。用戶端傳輸層會增加一小段寬限時間，讓長時間等待能夠完成，而不是在 HTTP 邊界逾時。
- `tabCleanup` 會盡力清理由主要代理瀏覽器工作階段開啟的分頁。子代理、排程與 ACP 的生命週期清理仍會在工作階段結束時關閉其明確追蹤的分頁；主要工作階段會保留可重複使用的作用中分頁，然後在背景關閉閒置或超出數量的已追蹤分頁。

</Accordion>

<Accordion title="SSRF 政策">

- 瀏覽器導覽與開啟分頁要求會先執行預檢。在動作期間及有界限的動作後寬限期內，受防護的 Playwright 互動（點擊、座標點擊、懸停、拖曳、捲動、選取、按鍵、輸入、表單填寫及 evaluate）會在送出 HTTP 要求位元組前攔截政策拒絕的頂層與子框架文件載入，之後再盡力重新檢查最終的 `http(s)` URL。
- 每次全新啟動由 OpenClaw 管理的 Chrome 前，OpenClaw 都會盡力停用網路預測，以抑制觀察到 Chromium 對這些遭拒絕載入進行的推測性預先連線。這是縱深防禦，而非政策邊界：跨控制服務重新啟動重複使用的瀏覽器及其他瀏覽器後端，可能不會套用相同強化措施。Playwright 路由仍不是網路防火牆，而且不會攔截重新導向的各個躍點、彈出視窗的第一個要求、Service Worker 流量、在有界限防護時段結束後執行的頁面程式碼，或所有背景／子資源路徑。完整的輸出流量隔離需要由擁有者端進行隔離，或使用強制執行政策的 Proxy。
- 在嚴格 SSRF 模式下，也會檢查遠端 CDP 端點探索及 `/json/version` 探查（`cdpUrl`）。
- 閘道／提供者的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及 `NO_PROXY` 環境變數不會自動代理由 OpenClaw 管理的瀏覽器。受管理的 Chrome 預設會直接啟動，因此提供者的 Proxy 設定不會削弱瀏覽器 SSRF 檢查。
- 由 OpenClaw 管理的本機 CDP 就緒探查及 DevTools WebSocket 連線，會針對實際啟動的迴送端點略過受管理的網路 Proxy，因此當操作員的 Proxy 封鎖迴送輸出流量時，`openclaw browser start` 仍可運作。
- 若要代理受管理的瀏覽器本身，請透過 `browser.extraArgs` 傳入明確的 Chrome Proxy 旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非刻意啟用瀏覽器的私人網路存取，否則嚴格 SSRF 模式會封鎖明確的瀏覽器 Proxy 路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設為關閉；只有在刻意信任瀏覽器存取私人網路時才啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍以舊版別名的形式受到支援。

</Accordion>

<Accordion title="設定檔行為">

- `attachOnly: true` 表示永不啟動本機瀏覽器；只有當瀏覽器已在執行時才附加。
- `headless` 可設定於全域或個別本機受管理設定檔。個別設定檔的值會覆寫 `browser.headless`，因此某個本機啟動的設定檔可維持無頭模式，而另一個則保持可見。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 會要求本機受管理設定檔以無頭模式啟動一次，而不會改寫 `browser.headless` 或設定檔組態。既有工作階段、僅附加與遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動這些瀏覽器程序。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，如果環境及設定檔／全域組態都未明確選擇有介面模式，本機受管理設定檔會自動預設為無頭模式。請使用語意明確的瀏覽器層級形式 `openclaw browser --json status`；尾置形式 `openclaw browser status --json` 也可運作，因為 `status` 未定義自己的 `--json`。此命令會將 `headlessSource` 回報為 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前程序的本機受管理啟動使用無頭模式。`OPENCLAW_BROWSER_HEADLESS=0` 會強制一般啟動使用有介面模式，並在沒有顯示伺服器的 Linux 主機上傳回可採取行動的錯誤；明確的 `start --headless` 要求仍會在該次啟動中優先套用。
- 瀏覽器控制路由與程式化用戶端會保留無顯示器錯誤中可供人閱讀的 `error`，並公開穩定的原因 `no_display_for_headed_profile`。其 `details` 僅包含 `profile`、`requestedHeadless`、`headlessSource` 及 `displayPresent`，讓 API 用戶端無須比對訊息文字即可選擇正確的補救措施。
- 對於正在執行的本機受管理設定檔，狀態與 doctor 會查詢 Chrome 的瀏覽器層級 CDP 端點，以取得轉譯器、後端、裝置／驅動程式、功能狀態、驅動程式因應措施及加速視訊能力。結果會針對該瀏覽器程序進行快取，並由 `openclaw browser --json status` 完整公開。被動狀態呼叫不會啟動 Chrome。既有工作階段、擴充功能、遠端 CDP 及沙箱瀏覽器仍彼此分離，不會透過此受管理主機路徑進行檢查。
- 無頭模式的受管理 Chrome 仍會使用保守的 `--disable-gpu` 預設值。診斷不會啟用加速、新增全域加速設定，或授予沙箱瀏覽器裝置存取權。
- `executablePath` 可設定於全域或個別本機受管理設定檔。個別設定檔的值會覆寫 `browser.executablePath`，因此不同的受管理設定檔可以啟動不同的 Chromium 系瀏覽器。兩種形式皆接受以 `~` 代表你的作業系統家目錄。
- `color`（頂層及個別設定檔）會為瀏覽器 UI 加上色調，讓你看出目前作用中的設定檔。
- 預設設定檔為 `openclaw`（受管理的獨立執行個體）。使用 `defaultProfile: "user"` 可選擇使用已登入的使用者瀏覽器。
- 自動偵測順序：若系統預設瀏覽器是 Chromium 系瀏覽器，則優先使用；否則依序為 Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而非原始 CDP。它可透過 Chrome MCP 自動連線附加，或在你已有執行中瀏覽器的 DevTools 端點時透過 `cdpUrl` 附加。
- `driver: "extension"` 會透過 [OpenClaw Chrome 擴充功能](/zh-TW/tools/chrome-extension)操控你已登入的 Chrome。轉送器擁有其迴送端點，因此這些設定檔不接受 `cdpUrl`。這是唯一能在電腦前無人操作時運作的已登入瀏覽器模式。
- 當既有工作階段設定檔應附加至非預設的 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受以 `~` 代表你的作業系統家目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系瀏覽器

如果你的**系統預設**瀏覽器是 Chromium 系瀏覽器（Chrome/Brave/Edge 等），
OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫
自動偵測。頂層及個別設定檔的 `executablePath` 值皆接受以 `~`
代表你的作業系統家目錄：

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

個別設定檔的 `executablePath` 只會影響由 OpenClaw
啟動的本機受管理設定檔。`existing-session` 設定檔會改為附加至已在執行的瀏覽器，
遠端 CDP 設定檔則使用 `cdpUrl` 背後的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：**閘道會啟動迴送控制服務，並可啟動本機瀏覽器。
- **遠端控制（節點主機）：**在具備瀏覽器的機器上執行節點主機；閘道會將瀏覽器動作代理至該主機。
- **遠端 CDP：**設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加至遠端 Chromium 系瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於迴送介面上由外部管理的 CDP 服務（例如 Docker 中發布至 `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。未設定 `attachOnly` 的迴送 CDP 會被視為由 OpenClaw 管理的本機瀏覽器設定檔。
- `headless` 只會影響由 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更既有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。在執行中的本機受管理設定檔上變更此值，會將該設定檔標記為需要重新啟動／協調，以便下次啟動使用新的二進位檔。

停止行為會依設定檔模式而異：

- 本機受管理設定檔：`openclaw browser stop` 會停止由
  OpenClaw 啟動的瀏覽器程序
- 僅附加與遠端 CDP 設定檔：`openclaw browser stop` 會關閉作用中的
  控制工作階段，並釋放 Playwright/CDP 模擬覆寫（可視區域、
  配色、地區設定、時區、離線模式及類似狀態），即使
  OpenClaw 並未啟動任何瀏覽器程序

遠端 CDP URL 可以包含驗證資訊：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic 驗證（例如 `https://user:pass@provider.example`）

OpenClaw 在呼叫 `/json/*` 端點及連線至 CDP WebSocket 時，
會保留驗證資訊。請優先使用環境變數或祕密管理工具來儲存
權杖，而不要將其提交至組態檔案。

## 節點瀏覽器 Proxy（零組態預設）

如果你在具備瀏覽器的機器上執行**節點主機**，OpenClaw 可以
自動將瀏覽器工具呼叫路由至該節點，不需要任何額外的瀏覽器組態。
這是遠端閘道的預設路徑。

注意事項：

- 節點主機透過**代理命令**公開其本機瀏覽器控制伺服器。
- 設定檔來自節點本身的 `browser.profiles` 設定（與本機相同）。
- 無論 `allowProfiles` 為何，代理命令一律不允許永久變更設定檔（`create-profile`、`delete-profile`、`reset-profile`）；請直接在節點上進行這些變更。
- `nodeHost.browserProxy.allowProfiles` 為選用設定。將其留空即可使用舊版／預設行為：所有已設定的設定檔仍可透過代理存取。
- 如果設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將其視為最小權限邊界，限制代理可指定的設定檔名稱。
- 如果你不需要此功能，請停用：
  - 在節點上：`nodeHost.browserProxy.enabled=false`
  - 在閘道上：`gateway.nodes.browser.mode="off"`（也接受 `"auto"`，以選取單一已連線的瀏覽器節點；或接受 `"manual"`，以要求明確指定節點參數）

## Browserless（託管式遠端 CDP）

[Browserless](https://browserless.io) 是一項託管式 Chromium 服務，透過 HTTPS 和 WebSocket 公開
CDP 連線 URL。OpenClaw 可使用任一種形式，但對於遠端瀏覽器設定檔，
最簡單的選項是使用 Browserless 連線文件中的直接 WebSocket URL。

範例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
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

- 將 `<BROWSERLESS_API_KEY>` 替換為你實際的 Browserless 權杖。
- 選擇與你的 Browserless 帳戶相符的區域端點（請參閱其文件）。
- 如果 Browserless 提供 HTTPS 基底 URL，你可以將其轉換為
  `wss://` 以直接建立 CDP 連線，或保留 HTTPS URL，讓 OpenClaw
  探索 `/json/version`。

### 同一主機上的 Browserless Docker

當 Browserless 自行託管於 Docker 中，而 OpenClaw 在主機上執行時，請將
Browserless 視為由外部管理的 CDP 服務：

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

OpenClaw 程序必須能存取 `browser.profiles.browserless.cdpUrl` 中的位址。
Browserless 也必須公布相符且可存取的端點；請將 Browserless 的 `EXTERNAL`
設為 OpenClaw 可存取的相同 WebSocket 公開基底位址，例如
`ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的 Docker 私有
網路位址。如果 `/json/version` 傳回的 `webSocketDebuggerUrl` 指向
OpenClaw 無法存取的位址，CDP HTTP 看起來可能運作正常，但 WebSocket
附加仍會失敗。

對於迴路位址的 Browserless 設定檔，請勿讓 `attachOnly` 保持未設定。
若未設定 `attachOnly`，OpenClaw 會將迴路連接埠視為由本機管理的瀏覽器
設定檔，並可能回報該連接埠已被使用，但並非由 OpenClaw 擁有。

## 直接 WebSocket CDP 供應商

某些託管式瀏覽器服務會公開**直接 WebSocket** 端點，而非
標準的 HTTP 型 CDP 探索端點（`/json/version`）。OpenClaw 接受三種
CDP URL 形式，並會自動選擇正確的連線策略：

- **HTTP(S) 探索**－`http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 會呼叫 `/json/version` 以探索 WebSocket 偵錯工具 URL，然後
  建立連線。不會後援至 WebSocket。
- **直接 WebSocket 端點**－`ws://host[:port]/devtools/<kind>/<id>`，或
  路徑為 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  的 `wss://...`。OpenClaw 會直接透過 WebSocket 交握建立連線，並完全略過
  `/json/version`。
- **裸 WebSocket 根端點**－沒有 `/devtools/...` 路徑的
  `ws://host[:port]` 或 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試透過 HTTP
  `/json/version` 進行探索（將通訊協定正規化為 `http`／`https`）；
  如果探索傳回 `webSocketDebuggerUrl`，便會使用該 URL；否則 OpenClaw
  會後援至裸根端點上的直接 WebSocket 交握。如果公布的
  WebSocket 端點拒絕 CDP 交握，但設定的裸根端點接受，OpenClaw
  也會後援至該根端點。如此一來，指向本機 Chrome 的裸 `ws://`
  仍可建立連線，因為 Chrome 只接受 `/json/version` 所提供之特定目標路徑上的
  WebSocket 升級；同時，若託管供應商的探索端點公布不適合 Playwright CDP
  使用的短期 URL，仍可使用其 WebSocket 根端點。

`openclaw browser doctor` 採用與執行階段附加相同的先探索、再後援至 WebSocket
邏輯，因此診斷不會將可成功連線的裸根 URL 回報為無法存取。

### Browserbase

[Browserbase](https://www.browserbase.com) 是用於執行無頭瀏覽器的雲端平台，
內建 CAPTCHA 解題、隱匿模式及住宅代理伺服器。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
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

- [註冊](https://www.browserbase.com/sign-up)並從 [Overview dashboard](https://www.browserbase.com/overview)
  複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你實際的 Browserbase API 金鑰。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要
  手動建立工作階段。
- 如需目前免費方案限制與付費方案，請參閱[定價](https://www.browserbase.com/pricing)。
- 如需完整 API 參考、SDK 指南及整合範例，請參閱 [Browserbase 文件](https://docs.browserbase.com)。

### Notte

[Notte](https://www.notte.cc) 是用於執行無頭
瀏覽器的雲端平台，內建隱匿功能、住宅代理伺服器及原生 CDP
WebSocket 閘道。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
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

- [註冊](https://console.notte.cc)並從
  主控台設定頁面複製你的 **API Key**。
- 將 `<NOTTE_API_KEY>` 替換為你實際的 Notte API 金鑰。
- Notte 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要
  手動建立工作階段。WebSocket 中斷連線時，該工作階段會被銷毀。
- 如需目前免費方案限制與付費方案，請參閱[定價](https://www.notte.cc/#pricing)。
- 如需完整 API 參考、SDK 指南及整合範例，請參閱 [Notte 文件](https://docs.notte.cc)。

## 安全性

核心概念：

- 瀏覽器控制僅限迴路位址；存取會經過閘道的驗證或節點配對。
- 獨立的迴路瀏覽器 HTTP API **僅使用共享密鑰驗證**：
  閘道權杖承載者驗證、`x-openclaw-password`，或使用已設定閘道密碼的
  HTTP Basic 驗證。
- Tailscale Serve 身分標頭與 `gateway.auth.mode: "trusted-proxy"`
  **不會**驗證此獨立迴路瀏覽器 API。
- 如果啟用了瀏覽器控制，但未設定共享密鑰驗證，OpenClaw
  會在啟動時自動產生並保存瀏覽器控制認證資訊：
  當 `gateway.auth.mode` 為 `none` 時產生權杖；當其為
  `trusted-proxy` 時產生密碼（透過 `gateway.auth.password` 保存，
  讓程序外的迴路用戶端可解析該密碼）。若該模式已明確設定
  字串認證資訊，或 `gateway.auth.mode` 為 `password`，則會略過自動產生。
- 如果你想使用自行控制的穩定密鑰，而非自動產生的密鑰，請明確設定
  `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或
  `OPENCLAW_GATEWAY_PASSWORD`。

遠端 CDP 提示：

- 在可能的情況下，優先使用加密端點（HTTPS 或 WSS）及短期權杖。
- 避免將長期權杖直接嵌入設定檔。
- 將閘道及所有節點主機置於私人網路（Tailscale）中；避免公開暴露。
- 將遠端 CDP URL／權杖視為機密；優先使用環境變數或機密管理工具。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **由 OpenClaw 管理**：具備自身使用者資料目錄及 CDP 連接埠的專用 Chromium 型瀏覽器執行個體
- **遠端**：明確的 CDP URL（在其他位置執行的 Chromium 型瀏覽器）
- **現有工作階段**：透過 Chrome DevTools MCP 自動連線使用你現有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，系統會自動建立。
- `user` 設定檔為 Chrome MCP 現有工作階段附加的內建設定檔。
- 除了 `user` 之外，現有工作階段設定檔都必須選擇啟用；請使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設從 **18800-18899** 範圍配置。
- 刪除設定檔時，會將其本機資料目錄移至垃圾桶。

所有控制端點均接受 `?profile=<name>`；命令列介面使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用現有工作階段

OpenClaw 也可透過官方 Chrome DevTools MCP 伺服器附加至正在執行的
Chromium 型瀏覽器設定檔。如此會重複使用該瀏覽器設定檔中
已開啟的分頁及登入狀態。

官方背景資訊與設定參考：

- [Chrome 開發人員：在你的瀏覽器工作階段中使用 Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：`user`。如果你需要不同的名稱、色彩或瀏覽器資料目錄，
請建立自訂的現有工作階段設定檔。

內建 `user` 設定檔預設使用 Chrome MCP 自動連線，其目標為預設的本機
Google Chrome 設定檔。若使用 Brave、Edge、Chromium 或非預設 Chrome 設定檔，
請使用 `userDataDir`。`~` 會展開為你的作業系統家目錄：

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
3. 讓瀏覽器保持執行，並在 OpenClaw 附加時核准連線提示。

常見檢查頁面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

即時附加煙霧測試：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時的狀態：

- `status` 顯示 `driver: existing-session`
- `status` 顯示 `transport: chrome-mcp`
- `status` 顯示 `running: true`
- `tabs` 列出你已開啟的瀏覽器分頁
- `snapshot` 傳回所選即時分頁的參照

如果附加無法運作，請檢查：

- 目標 Chromium 型瀏覽器的版本為 `144+`
- 已在該瀏覽器的檢查頁面中啟用遠端偵錯
- 瀏覽器已顯示附加同意提示，且你已接受
- 如果 Chrome 是使用明確的 `--remote-debugging-port` 啟動，請將
  `browser.profiles.<name>.cdpUrl` 設為該 DevTools 端點，而非依賴
  Chrome MCP 自動連線
- `openclaw doctor` 會遷移舊版基於擴充功能的瀏覽器設定，並檢查本機是否
  已安裝 Chrome，以供預設的自動連線設定檔使用；但它無法代替你啟用
  瀏覽器端的遠端偵錯

代理程式使用方式：

- 當你需要使用者已登入的瀏覽器狀態時，請使用 `profile="user"`。
- 如果你使用自訂的現有工作階段設定檔，請傳入該設定檔的明確名稱。
- 只有在使用者位於電腦前、能核准附加提示時，才選擇此模式。
- 閘道或節點主機可以啟動 `npx chrome-devtools-mcp@latest --autoConnect`。

注意：

- 此路徑的風險高於隔離的 `openclaw` 設定檔，因為它可以在你已登入的瀏覽器工作階段中執行操作。
- OpenClaw 不會為此驅動程式啟動瀏覽器；它只會附加至瀏覽器。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果設定了 `userDataDir`，系統會將其原樣傳遞，以指定該使用者資料目錄。
- 現有工作階段可以附加至所選主機，或透過已連線的瀏覽器節點附加。如果 Chrome 位於其他位置，且沒有已連線的瀏覽器節點，請改用遠端 CDP 或節點主機。
- Chrome MCP 目標與快照參照僅限於單一 MCP 子程序。該程序重新啟動後，請再次執行 `browser tabs`，在進行目標特定的操作前明確選擇新的目標，並在使用參照前擷取新快照。每個參照僅對其目標和最新快照有效。即使替代分頁的 URL 相同，舊別名也不會轉移至該分頁。
- Chrome DevTools MCP 目前會依程序本機的數字頁面 ID 路由頁面工具。程序範圍的控制代碼可防止跨子程序替換重複使用，但相鄰工具呼叫之間若在程序內替換瀏覽器內容，仍可能讓操作重新指向其他目標。若要達成完全不可分割的路由，需要上游頁面工具支援穩定的目標 ID。

### 自訂 Chrome MCP 啟動方式

當預設的 `npx chrome-devtools-mcp@latest` 流程不符合需求時（離線主機、固定版本、隨附二進位檔），可依設定檔覆寫要啟動的 Chrome DevTools MCP 伺服器：

| 欄位         | 功能                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 取代 `npx` 啟動的可執行檔。依原值解析；支援絕對路徑。                                                                     |
| `mcpArgs`    | 原樣傳遞至 `mcpCommand` 的引數陣列。取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。                            |

當現有工作階段設定檔設定了 `cdpUrl` 時，OpenClaw 會略過 `--autoConnect`，並自動將端點轉送至 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標無法與 `userDataDir` 合併使用：設定 `cdpUrl` 時，Chrome MCP 啟動會忽略 `userDataDir`，因為 Chrome MCP 會附加至端點後方正在執行的瀏覽器，而非開啟設定檔目錄。

<Accordion title="現有工作階段功能限制">

相較於受管理的 `openclaw` 設定檔，現有工作階段驅動程式的限制較多：

- **螢幕擷取畫面** - 支援頁面擷取與 `--ref` 元素擷取；不支援 CSS `--element` 選擇器。以頁面或參照為基礎的元素螢幕擷取畫面不需要 Playwright。（任何設定檔的 `--full-page` 都無法與 `--ref` 或 `--element` 合併使用，並非只有現有工作階段如此。）
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照參照（不支援 CSS 選擇器）。`click-coords` 會點擊可見檢視區座標，不需要快照參照。`click` 僅支援滑鼠左鍵（不支援按鍵覆寫或輔助鍵）。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select` 和 `fill` 不支援每次呼叫的 `timeoutMs` 覆寫；`evaluate` 支援。`select` 接受單一值。不支援 `batch`；請逐一傳送操作。
- **等待／上傳／對話方塊** - `wait --url` 支援完全符合、子字串和 glob 模式（與受管理設定檔相同）；現有工作階段設定檔不支援 `wait --load networkidle`（受管理與原始／遠端 CDP 設定檔支援）。上傳掛鉤需要 `ref` 或 `inputRef`，每次一個檔案，不支援 CSS `element`。對話方塊掛鉤不支援逾時覆寫或 `dialogId`。
- **對話方塊可見性** - 當操作開啟強制回應對話方塊時，受管理瀏覽器的操作回應會包含 `blockedByDialog` 和 `browserState.dialogs.pending`；快照也會包含待處理的對話方塊狀態。對話方塊待處理時，請使用 `browser dialog --accept/--dismiss --dialog-id <id>` 回應。在 OpenClaw 外部處理的對話方塊會顯示於 `browserState.dialogs.recent`。
- **僅限受管理模式的功能** - PDF 匯出、下載攔截和 `responsebody` 仍需要受管理瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不存取你的個人瀏覽器設定檔。
- **專用連接埠**：避開 `9222`，防止與開發工作流程衝突。
- **確定性的分頁控制**：`tabs` 會先傳回 `suggestedTargetId`，再傳回穩定的 `tabId` 控制代碼（例如 `t1`）、選用標籤，以及原始 `targetId`。代理程式應重複使用 `suggestedTargetId`；原始 ID 仍可用於偵錯和相容性用途。

## 瀏覽器選擇

在本機啟動時，OpenClaw 會選擇第一個可用項目：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆寫。

平台：

- macOS：檢查 `/Applications` 和 `~/Applications`。
- Linux：檢查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下常見的 Chrome／Brave／Edge／Chromium 位置，以及 `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下由 Playwright 管理的 Chromium。
- Windows：檢查常見的安裝位置。

## 控制 API（選用）

為便於編寫指令碼與偵錯，閘道提供一個小型的**僅限迴送 HTTP 控制 API**，以及相對應的 `openclaw browser` 命令列介面（快照、參照、增強等待功能、JSON 輸出、偵錯工作流程）。完整參考資料請參閱[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

如需 Linux 特定問題（尤其是 snap Chromium）的資訊，請參閱[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

如需 WSL2 閘道與 Windows Chrome 分離主機設定的資訊，請參閱 [WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 封鎖的差異

這兩者是不同的失敗類別，指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面是否正常運作。
- **導覽 SSRF 封鎖**表示瀏覽器控制平面正常運作，但頁面導覽目標遭原則拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 當設定了迴送外部 CDP 服務，卻未設定 `attachOnly: true` 時，會出現 `Port <port> is in use for profile "<name>" but not by openclaw`
- 導覽 SSRF 封鎖：
  - `start` 和 `tabs` 仍可運作，但 `open`、`navigate`、快照或開啟分頁流程因瀏覽器／網路原則錯誤而失敗

使用以下最小序列區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果判讀方式：

- 如果 `start` 因 `not reachable after start` 而失敗，請先排解 CDP 就緒問題。
- 如果 `start` 成功但 `tabs` 失敗，表示控制平面仍不正常。請將其視為 CDP 可連線性問題，而非頁面導覽問題。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面已啟動，而失敗原因在於導覽原則或目標頁面。
- 如果 `start`、`tabs` 和 `open` 全部成功，表示基本的受管理瀏覽器控制路徑運作正常。

重要行為細節：

- 即使你未設定 `browser.ssrfPolicy`，瀏覽器設定預設仍會使用失敗時關閉的 SSRF 原則物件。
- 對於本機迴送的 `openclaw` 受管理設定檔，CDP 健康狀態檢查會刻意略過針對 OpenClaw 自有本機控制平面的瀏覽器 SSRF 可連線性強制執行。
- 導覽保護是獨立機制。`start` 或 `tabs` 成功並不代表後續的 `open` 或 `navigate` 目標會獲得允許。

安全指引：

- 預設情況下，請**勿**放寬瀏覽器 SSRF 原則。
- 應優先使用 `hostnameAllowlist` 或 `allowedHostnames` 等範圍較窄的主機例外，而非廣泛開放私人網路存取。
- 僅在刻意設為受信任、需要且已審查私人網路瀏覽器存取權的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 代理程式工具與控制方式

代理程式取得**一個工具**進行瀏覽器自動化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹狀結構（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 執行點擊／輸入／拖曳／選取。
- `browser screenshot` 擷取像素（完整頁面、元素或帶標籤的參照）。
- `browser doctor` 檢查閘道、外掛、設定檔、瀏覽器和分頁的就緒狀態。
- `browser` 接受：
  - `profile`：選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target`（`sandbox` | `host` | `node`）：選擇瀏覽器所在位置。
  - 在沙箱工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱工作階段預設為 `sandbox`，非沙箱工作階段預設為 `host`。
  - 如果已連線具備瀏覽器功能的節點，工具可能會自動路由至該節點，除非你固定指定 `target="host"` 或 `target="node"`。

這可讓代理程式保持確定性，並避免使用脆弱的選擇器。

## 相關內容

- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
- [沙箱化](/zh-TW/gateway/sandboxing) - 沙箱環境中的瀏覽器控制
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制風險與強化措施
