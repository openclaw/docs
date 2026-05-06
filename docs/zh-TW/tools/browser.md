---
read_when:
    - 新增由代理控制的瀏覽器自動化
    - 偵錯 OpenClaw 為何會干擾你自己的 Chrome
    - 在 macOS 應用程式中實作瀏覽器設定與生命週期
summary: 整合式瀏覽器控制服務 + 動作指令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-05-06T09:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行由代理控制的 **專用 Chrome/Brave/Edge/Chromium 設定檔**。
它與你的個人瀏覽器隔離，並透過 Gateway 內的小型本機
控制服務管理（僅限 loopback）。

初學者觀點：

- 把它想成一個**獨立、僅供代理使用的瀏覽器**。
- `openclaw` 設定檔**不會**碰觸你的個人瀏覽器設定檔。
- 代理可以在安全通道中**開啟分頁、讀取頁面、點擊和輸入**。
- 內建的 `user` 設定檔會透過 Chrome MCP 附加到你真正已登入的 Chrome 工作階段。

## 你會得到什麼

- 名為 **openclaw** 的獨立瀏覽器設定檔（預設為橘色強調色）。
- 可確定的分頁控制（列出/開啟/聚焦/關閉）。
- 代理動作（點擊/輸入/拖曳/選取）、快照、螢幕截圖、PDF。
- 隨附的 `browser-automation` skill，會在啟用瀏覽器
  Plugin 時，教導代理快照、穩定分頁、過期參照，以及手動阻擋復原流程。
- 選用的多設定檔支援（`openclaw`、`work`、`remote`、...）。

這個瀏覽器**不是**你的日常主要瀏覽器。它是供
代理自動化與驗證使用的安全隔離介面。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你收到「Browser disabled」，請在設定中啟用它（見下方）並重新啟動
Gateway。

如果 `openclaw browser` 完全不存在，或代理表示瀏覽器工具
不可用，請跳到[缺少瀏覽器命令或工具](/zh-TW/tools/browser#missing-browser-command-or-tool)。

## Plugin 控制

預設的 `browser` 工具是隨附的 Plugin。停用它即可改用另一個註冊相同 `browser` 工具名稱的 Plugin：

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

預設值需要同時有 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。只停用 Plugin 會將 `openclaw browser` CLI、`browser.request` gateway 方法、代理工具和控制服務作為一個單元移除；你的 `browser.*` 設定會保留，供替代項使用。

瀏覽器設定變更需要重新啟動 Gateway，Plugin 才能重新註冊其服務。

## 代理指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果代理或
衍生的子代理應使用瀏覽器自動化，請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

對於單一代理，請使用 `agents.list[].tools.alsoAllow: ["browser"]`。
單獨使用 `tools.subagents.tools.allow: ["browser"]` 不足夠，因為子代理
政策會在設定檔篩選後套用。

瀏覽器 Plugin 隨附兩層代理指引：

- `browser` 工具描述帶有精簡且永遠啟用的契約：選擇
  正確的設定檔、讓參照維持在同一個分頁、使用 `tabId`/標籤進行分頁
  目標指定，並為多步驟工作載入瀏覽器 skill。
- 隨附的 `browser-automation` skill 帶有較長的操作流程：
  先檢查狀態/分頁、標記任務分頁、動作前建立快照、UI 變更後重新建立快照、
  過期參照復原一次，並將登入/2FA/captcha 或
  攝影機/麥克風阻擋回報為需要手動操作，而不是猜測。

啟用 Plugin 時，Plugin 隨附的 skills 會列在代理可用的 Skills 中。
完整的 skill 指示會按需載入，因此例行回合不會支付完整的 token 成本。

## 缺少瀏覽器命令或工具

如果升級後 `openclaw browser` 未知、`browser.request` 缺失，或代理回報瀏覽器工具不可用，通常原因是 `plugins.allow` 清單省略了 `browser`，且沒有根層級的 `browser` 設定區塊。加入它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，即使在限制性的 `plugins.allow` 下，也會啟用隨附的瀏覽器 Plugin，與通道設定行為相符。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能替代允許清單成員資格。完全移除 `plugins.allow` 也會還原預設值。

## 設定檔：`openclaw` 與 `user`

- `openclaw`：受管理、隔離的瀏覽器（不需要擴充功能）。
- `user`：內建的 Chrome MCP 附加設定檔，用於你的**真正已登入 Chrome**
  工作階段。

對於代理瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 當既有登入工作階段很重要，且使用者在電腦前可點擊/核准任何附加提示時，
  優先使用 `profile="user"`。
- 當你想要特定瀏覽器模式時，`profile` 是明確覆寫。

如果你希望預設使用受管理模式，請設定 `browser.defaultProfile: "openclaw"`。

## 設定

瀏覽器設定位於 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
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

<AccordionGroup>

<Accordion title="連接埠與可達性">

- 控制服務會繫結到從 `gateway.port` 衍生的連接埠上的 loopback（預設 `18791` = gateway + 2）。覆寫 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 會讓衍生連接埠在同一族中位移。
- 本機 `openclaw` 設定檔會自動指派 `cdpPort`/`cdpUrl`；僅對遠端 CDP 設定這些值。未設定時，`cdpUrl` 預設為受管理的本機 CDP 連接埠。
- `remoteCdpTimeoutMs` 會套用到遠端與 `attachOnly` CDP HTTP 可達性
  檢查，以及開啟分頁的 HTTP 請求；`remoteCdpHandshakeTimeoutMs` 會套用到
  它們的 CDP WebSocket 交握。
- `localLaunchTimeoutMs` 是本機啟動的受管理 Chrome
  程序公開其 CDP HTTP 端點的預算。`localCdpReadyTimeoutMs` 是程序被發現後，
  CDP websocket 就緒狀態的後續預算。
  在 Raspberry Pi、低階 VPS 或 Chromium
  啟動較慢的舊硬體上提高這些值。值必須是最高 `120000` ms 的正整數；無效的
  設定值會被拒絕。
- 重複的受管理 Chrome 啟動/就緒失敗會依
  設定檔啟用斷路。連續多次失敗後，OpenClaw 會短暫暫停新的啟動
  嘗試，而不是在每次瀏覽器工具呼叫時都產生 Chromium。修正
  啟動問題、在不需要時停用瀏覽器，或在修復後重新啟動
  Gateway。
- 當呼叫端未傳遞 `timeoutMs` 時，`actionTimeoutMs` 是瀏覽器 `act` 請求的預設預算。用戶端傳輸會加入小幅寬限視窗，讓長時間等待能完成，而不是在 HTTP 邊界逾時。
- `tabCleanup` 是針對主要代理瀏覽器工作階段開啟分頁的盡力清理。子代理、Cron 和 ACP 生命週期清理仍會在工作階段結束時關閉其明確追蹤的分頁；主要工作階段會讓作用中分頁可重複使用，接著在背景關閉閒置或過量的已追蹤分頁。

</Accordion>

<Accordion title="SSRF 政策">

- 瀏覽器導覽和開啟分頁會在導覽前受到 SSRF 防護，並在之後的最終 `http(s)` URL 上盡力重新檢查。
- 在嚴格 SSRF 模式中，遠端 CDP 端點探索和 `/json/version` 探測（`cdpUrl`）也會被檢查。
- Gateway/提供者的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 環境變數不會自動代理 OpenClaw 管理的瀏覽器。受管理的 Chrome 預設直接啟動，因此提供者代理設定不會削弱瀏覽器 SSRF 檢查。
- 若要代理受管理的瀏覽器本身，請透過 `browser.extraArgs` 傳遞明確的 Chrome 代理旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。嚴格 SSRF 模式會封鎖明確的瀏覽器代理路由，除非已刻意啟用 private-network 瀏覽器存取。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設為關閉；僅在刻意信任 private-network 瀏覽器存取時啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。

</Accordion>

<Accordion title="設定檔行為">

- `attachOnly: true` 表示絕不啟動本機瀏覽器；只有在已有瀏覽器執行時才附加。
- `headless` 可以設定為全域或針對每個本機受管理設定檔設定。個別設定檔的值會覆寫 `browser.headless`，因此一個本機啟動的設定檔可以維持無頭模式，而另一個則保持可見。
- `POST /start?headless=true` 與 `openclaw browser start --headless` 會要求對本機受管理設定檔進行一次性無頭啟動，而不重寫 `browser.headless` 或設定檔組態。既有工作階段、僅附加，以及遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動這些瀏覽器程序。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，當環境或設定檔/全域組態都未明確選擇有頭模式時，本機受管理設定檔會自動預設為無頭模式。`openclaw browser status --json` 會將 `headlessSource` 回報為 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前程序的本機受管理啟動使用無頭模式。`OPENCLAW_BROWSER_HEADLESS=0` 會強制一般啟動使用有頭模式，並且在沒有顯示伺服器的 Linux 主機上回傳可操作的錯誤；明確的 `start --headless` 要求仍會對該次啟動優先適用。
- `executablePath` 可以設定為全域或針對每個本機受管理設定檔設定。個別設定檔的值會覆寫 `browser.executablePath`，因此不同的受管理設定檔可以啟動不同的 Chromium 系瀏覽器。兩種形式都接受 `~` 代表你的作業系統主目錄。
- `color`（最上層與每個設定檔）會為瀏覽器 UI 上色，讓你能看出目前作用中的設定檔。
- 預設設定檔是 `openclaw`（受管理的獨立設定檔）。使用 `defaultProfile: "user"` 以選用已登入使用者的瀏覽器。
- 自動偵測順序：如果系統預設瀏覽器是 Chromium 系，則使用它；否則依序使用 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要為該驅動程式設定 `cdpUrl`。
- 當既有工作階段設定檔應附加到非預設的 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受 `~` 代表你的作業系統主目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系瀏覽器

如果你的**系統預設**瀏覽器是 Chromium 系（Chrome/Brave/Edge/等），OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫自動偵測。最上層與個別設定檔的 `executablePath` 值都接受 `~` 代表你的作業系統主目錄：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或依平台在組態中設定：

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

個別設定檔的 `executablePath` 只會影響 OpenClaw 啟動的本機受管理設定檔。`existing-session` 設定檔則會附加到已在執行的瀏覽器，而遠端 CDP 設定檔會使用 `cdpUrl` 後面的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：** Gateway 會啟動 loopback 控制服務，並且可以啟動本機瀏覽器。
- **遠端控制（Node 主機）：** 在有瀏覽器的機器上執行 Node 主機；Gateway 會將瀏覽器動作代理給它。
- **遠端 CDP：** 設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到遠端 Chromium 系瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於 loopback 上由外部管理的 CDP 服務（例如在 Docker 中發布到 `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。沒有 `attachOnly` 的 Loopback CDP 會被視為本機 OpenClaw 管理的瀏覽器設定檔。
- `headless` 只會影響 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更既有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。在執行中的本機受管理設定檔上變更它，會將該設定檔標記為需要重新啟動/調和，讓下一次啟動使用新的二進位檔。

停止行為會依設定檔模式而不同：

- 本機受管理設定檔：`openclaw browser stop` 會停止 OpenClaw 啟動的瀏覽器程序
- 僅附加與遠端 CDP 設定檔：`openclaw browser stop` 會關閉作用中的控制工作階段，並釋放 Playwright/CDP 模擬覆寫（檢視區、色彩配置、語言環境、時區、離線模式與類似狀態），即使 OpenClaw 並未啟動任何瀏覽器程序

遠端 CDP URL 可以包含驗證：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic 驗證（例如 `https://user:pass@provider.example`）

OpenClaw 會在呼叫 `/json/*` 端點以及連線到 CDP WebSocket 時保留驗證。權杖建議使用環境變數或祕密管理工具，而不是提交到組態檔。

## Node 瀏覽器代理（零組態預設）

如果你在有瀏覽器的機器上執行 **Node 主機**，OpenClaw 可以在不需要任何額外瀏覽器組態的情況下，自動將瀏覽器工具呼叫路由到該 Node。這是遠端 Gateway 的預設路徑。

注意：

- Node 主機會透過**代理命令**公開其本機瀏覽器控制伺服器。
- 設定檔來自 Node 自己的 `browser.profiles` 組態（與本機相同）。
- `nodeHost.browserProxy.allowProfiles` 是選用的。將其留空可使用舊版/預設行為：所有已設定的設定檔仍可透過代理存取，包括設定檔建立/刪除路由。
- 如果你設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將它視為最小權限邊界：只有允許清單中的設定檔可被指定為目標，且持久設定檔建立/刪除路由會在代理表面上被封鎖。
- 如果不想使用，請停用它：
  - 在 Node 上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（託管遠端 CDP）

[Browserless](https://browserless.io) 是一項託管 Chromium 服務，會透過 HTTPS 與 WebSocket 公開 CDP 連線 URL。OpenClaw 可以使用任一形式，但對於遠端瀏覽器設定檔，最簡單的選項是使用 Browserless 連線文件中的直接 WebSocket URL。

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

注意：

- 將 `<BROWSERLESS_API_KEY>` 替換為你的真實 Browserless 權杖。
- 選擇符合你的 Browserless 帳戶的區域端點（請參閱其文件）。
- 如果 Browserless 提供 HTTPS 基底 URL，你可以將它轉換為 `wss://` 以進行直接 CDP 連線，或保留 HTTPS URL 並讓 OpenClaw 探索 `/json/version`。

### 同一主機上的 Browserless Docker

當 Browserless 自行託管於 Docker 中且 OpenClaw 在主機上執行時，請將 Browserless 視為由外部管理的 CDP 服務：

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

`browser.profiles.browserless.cdpUrl` 中的位址必須可從 OpenClaw 程序連到。Browserless 也必須宣告相符且可連到的端點；將 Browserless `EXTERNAL` 設定為相同的公開至 OpenClaw WebSocket 基底，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的私有 Docker 網路位址。如果 `/json/version` 回傳的 `webSocketDebuggerUrl` 指向 OpenClaw 無法連到的位址，CDP HTTP 可能看起來正常，但 WebSocket 附加仍會失敗。

不要讓 loopback Browserless 設定檔的 `attachOnly` 保持未設定。沒有 `attachOnly` 時，OpenClaw 會將 loopback 連接埠視為本機受管理瀏覽器設定檔，並可能回報該連接埠正在使用中但不歸 OpenClaw 所有。

## 直接 WebSocket CDP 提供者

有些託管瀏覽器服務會公開**直接 WebSocket**端點，而不是標準的 HTTP 型 CDP 探索（`/json/version`）。OpenClaw 接受三種 CDP URL 形式，並會自動選擇正確的連線策略：

- **HTTP(S) 探索** - `http://host[:port]` 或 `https://host[:port]`。OpenClaw 會呼叫 `/json/version` 以探索 WebSocket 偵錯工具 URL，然後連線。沒有 WebSocket 後援。
- **直接 WebSocket 端點** - `ws://host[:port]/devtools/<kind>/<id>` 或具有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路徑的 `wss://...`。OpenClaw 會透過 WebSocket 握手直接連線，並完全略過 `/json/version`。
- **裸 WebSocket 根端點** - `ws://host[:port]` 或沒有 `/devtools/...` 路徑的 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試 HTTP `/json/version` 探索（將通訊協定正規化為 `http`/`https`）；如果探索回傳 `webSocketDebuggerUrl`，就會使用它，否則 OpenClaw 會在裸根端點後援為直接 WebSocket 握手。如果宣告的 WebSocket 端點拒絕 CDP 握手，但設定的裸根端點接受，OpenClaw 也會後援到該根端點。這讓指向本機 Chrome 的裸 `ws://` 仍可連線，因為 Chrome 只接受來自 `/json/version` 的特定每目標路徑上的 WebSocket 升級，而託管提供者在其探索端點宣告不適合 Playwright CDP 的短效 URL 時，仍可使用其根 WebSocket 端點。

### Browserbase

[Browserbase](https://www.browserbase.com) 是用於執行無頭瀏覽器的雲端平台，內建 CAPTCHA 解決、隱形模式與住宅代理。

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

注意：

- [註冊](https://www.browserbase.com/sign-up)並從[總覽儀表板](https://www.browserbase.com/overview)複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你的真實 Browserbase API key。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段步驟。
- 免費方案允許一個並行工作階段，以及每月一個瀏覽器小時。付費方案限制請參閱[價格](https://www.browserbase.com/pricing)。
- 完整 API 參考、SDK 指南與整合範例，請參閱 [Browserbase 文件](https://docs.browserbase.com)。

## 安全性

核心概念：

- 瀏覽器控制僅限 loopback；存取流程會經由 Gateway 的驗證或 node 配對。
- 獨立 loopback 瀏覽器 HTTP API **只使用共享密鑰驗證**：
  Gateway token bearer 驗證、`x-openclaw-password`，或使用已設定 Gateway 密碼的 HTTP Basic auth。
- Tailscale Serve 身分標頭與 `gateway.auth.mode: "trusted-proxy"` **不會**驗證這個獨立 loopback 瀏覽器 API。
- 如果已啟用瀏覽器控制且未設定共享密鑰驗證，OpenClaw
  會在啟動時自動產生 `gateway.auth.token`，並將它保存到設定。
- 當 `gateway.auth.mode` 已經是
  `password`、`none` 或 `trusted-proxy` 時，OpenClaw **不會**自動產生該 token。
- 將 Gateway 與任何 node 主機保留在私有網路（Tailscale）中；避免公開暴露。
- 將遠端 CDP URL/token 視為機密；優先使用環境變數或密鑰管理工具。

遠端 CDP 提示：

- 盡可能優先使用加密端點（HTTPS 或 WSS）與短效 token。
- 避免將長效 token 直接嵌入設定檔。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **openclaw-managed**：專用的 Chromium-based 瀏覽器實例，具備自己的使用者資料目錄 + CDP 連接埠
- **remote**：明確的 CDP URL（在其他位置執行的 Chromium-based 瀏覽器）
- **existing session**：透過 Chrome DevTools MCP 自動連線使用你現有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，會自動建立。
- `user` 設定檔是內建的，用於 Chrome MCP 現有工作階段附加。
- 除了 `user` 之外，現有工作階段設定檔都需要選擇啟用；使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設從 **18800-18899** 配置。
- 刪除設定檔會將其本機資料目錄移到垃圾桶。

所有控制端點都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用現有工作階段

OpenClaw 也可以透過官方 Chrome DevTools MCP 伺服器附加到執行中的 Chromium-based 瀏覽器設定檔。這會重複使用該瀏覽器設定檔中已開啟的分頁與登入狀態。

官方背景與設定參考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：

- `user`

選用：如果你想要不同的名稱、顏色或瀏覽器資料目錄，可以建立自己的自訂現有工作階段設定檔。

預設行為：

- 內建的 `user` 設定檔使用 Chrome MCP 自動連線，目標是預設的本機 Google Chrome 設定檔。

對 Brave、Edge、Chromium 或非預設 Chrome 設定檔使用 `userDataDir`。
`~` 會展開為你的作業系統家目錄：

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

接著在相符的瀏覽器中：

1. 開啟該瀏覽器的遠端偵錯 inspect 頁面。
2. 啟用遠端偵錯。
3. 讓瀏覽器保持執行，並在 OpenClaw 附加時核准連線提示。

常見 inspect 頁面：

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

即時附加煙霧測試：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時會像這樣：

- `status` 顯示 `driver: existing-session`
- `status` 顯示 `transport: chrome-mcp`
- `status` 顯示 `running: true`
- `tabs` 列出你已開啟的瀏覽器分頁
- `snapshot` 從選取的即時分頁傳回 refs

如果附加無法運作，請檢查：

- 目標 Chromium-based 瀏覽器版本是 `144+`
- 已在該瀏覽器的 inspect 頁面啟用遠端偵錯
- 瀏覽器已顯示附加同意提示，且你已接受
- `openclaw doctor` 會遷移舊的 extension-based 瀏覽器設定，並檢查預設自動連線設定檔是否已在本機安裝 Chrome，但它無法替你啟用瀏覽器端的遠端偵錯

代理使用方式：

- 需要使用者已登入的瀏覽器狀態時，使用 `profile="user"`。
- 如果使用自訂現有工作階段設定檔，請傳入該明確設定檔名稱。
- 只有在使用者位於電腦前、可核准附加提示時，才選擇此模式。
- Gateway 或 node 主機可以產生 `npx chrome-devtools-mcp@latest --autoConnect`

注意：

- 這條路徑的風險高於隔離的 `openclaw` 設定檔，因為它可以在你已登入的瀏覽器工作階段內執行操作。
- OpenClaw 不會為此驅動程式啟動瀏覽器；它只會附加。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果設定了 `userDataDir`，它會被傳遞以鎖定該使用者資料目錄。
- 現有工作階段可以在所選主機上附加，或透過已連線的瀏覽器 node 附加。如果 Chrome 位於其他位置且未連線瀏覽器 node，請改用遠端 CDP 或 node 主機。

### 自訂 Chrome MCP 啟動

當預設的 `npx chrome-devtools-mcp@latest` 流程不是你想要的方式時（離線主機、釘選版本、vendored binaries），可依設定檔覆寫所產生的 Chrome DevTools MCP 伺服器：

| 欄位         | 作用                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要產生的可執行檔，用於取代 `npx`。會依原樣解析；支援絕對路徑。                                          |
| `mcpArgs`    | 逐字傳遞給 `mcpCommand` 的引數陣列。取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。 |

當 `cdpUrl` 設定在現有工作階段設定檔上時，OpenClaw 會略過
`--autoConnect`，並自動將端點轉送給 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標與 `userDataDir` 不能合併使用：設定 `cdpUrl` 時，
Chrome MCP 啟動會忽略 `userDataDir`，因為 Chrome MCP 會附加到端點後方執行中的瀏覽器，而不是開啟設定檔目錄。

<Accordion title="Existing-session feature limitations">

與受管理的 `openclaw` 設定檔相比，現有工作階段驅動程式限制較多：

- **螢幕截圖** - 頁面擷取與 `--ref` 元素擷取可運作；CSS `--element` 選取器不支援。`--full-page` 不能與 `--ref` 或 `--element` 搭配使用。頁面或基於 ref 的元素螢幕截圖不需要 Playwright。
- **動作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 與 `select` 需要快照 refs（不支援 CSS 選取器）。`click-coords` 會點擊可見 viewport 座標，且不需要快照 ref。`click` 僅支援左鍵。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 與 `evaluate` 不支援每次呼叫的逾時。`select` 接受單一值。
- **等待 / 上傳 / 對話框** - `wait --url` 支援精確、子字串與 glob 模式；不支援 `wait --load networkidle`。上傳 hooks 需要 `ref` 或 `inputRef`，一次一個檔案，不支援 CSS `element`。對話框 hooks 不支援逾時覆寫。
- **僅受管理功能** - 批次動作、PDF 匯出、下載攔截與 `responsebody` 仍需要受管理瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不碰觸你的個人瀏覽器設定檔。
- **專用連接埠**：避免使用 `9222`，防止與開發工作流程衝突。
- **確定性的分頁控制**：`tabs` 先傳回 `suggestedTargetId`，接著是穩定的 `tabId` 控制代碼，例如 `t1`、選用標籤，以及原始 `targetId`。代理應重複使用 `suggestedTargetId`；原始 ID 仍可供偵錯與相容性使用。

## 瀏覽器選擇

在本機啟動時，OpenClaw 會選取第一個可用項目：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆寫。

平台：

- macOS：檢查 `/Applications` 與 `~/Applications`。
- Linux：檢查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 與
  `/usr/lib/chromium-browser` 底下常見的 Chrome/Brave/Edge/Chromium 位置。
- Windows：檢查常見安裝位置。

## 控制 API（選用）

對於指令碼與偵錯，Gateway 會公開一個小型的**僅限 loopback HTTP 控制 API**，以及相符的 `openclaw browser` CLI（快照、refs、等待加強、JSON 輸出、偵錯工作流程）。完整參考請參閱
[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

Linux 特定問題（尤其是 snap Chromium）請參閱
[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

WSL2 Gateway + Windows Chrome 分離主機設定請參閱
[WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 封鎖

這些是不同的失敗類型，並指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面健康。
- **導覽 SSRF 封鎖**表示瀏覽器控制平面健康，但頁面導覽目標遭到政策拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 當設定 loopback 外部 CDP 服務但未設定 `attachOnly: true` 時，出現 `Port <port> is in use for profile "<name>" but not by openclaw`
- 導覽 SSRF 封鎖：
  - `open`、`navigate`、快照或分頁開啟流程因瀏覽器/網路政策錯誤而失敗，但 `start` 與 `tabs` 仍可運作

使用這個最小序列區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解讀結果：

- 如果 `start` 因 `not reachable after start` 失敗，請先疑難排解 CDP 就緒狀態。
- 如果 `start` 成功但 `tabs` 失敗，控制平面仍不健康。請將這視為 CDP 可達性問題，而不是頁面導覽問題。
- 如果 `start` 與 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面已啟動，而失敗位於導覽政策或目標頁面。
- 如果 `start`、`tabs` 與 `open` 全部成功，表示基本受管理瀏覽器控制路徑健康。

重要行為細節：

- 即使你未設定 `browser.ssrfPolicy`，瀏覽器設定預設仍為 fail-closed SSRF 政策物件。
- 對於本機 loopback `openclaw` 受管理設定檔，CDP 健康檢查會刻意略過 OpenClaw 自己本機控制平面的瀏覽器 SSRF 可達性強制執行。
- 導覽保護是分開的。成功的 `start` 或 `tabs` 結果並不代表後續的 `open` 或 `navigate` 目標會被允許。

安全指引：

- 預設**不要**放寬瀏覽器 SSRF 政策。
- 優先使用狹窄的主機例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是寬泛的私有網路存取。
- 只有在有意信任、需要並已審查私有網路瀏覽器存取的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 代理工具 + 控制如何運作

代理取得**一個工具**用於瀏覽器自動化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹狀結構（AI 或 ARIA）。
- `browser act` 使用快照的 `ref` ID 來點擊、輸入、拖曳或選取。
- `browser screenshot` 會擷取像素（整頁、元素或已標記的 refs）。
- `browser doctor` 會檢查 Gateway、Plugin、設定檔、瀏覽器和分頁是否就緒。
- `browser` 接受：
  - `profile`：選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target`（`sandbox` | `host` | `node`）：選擇瀏覽器所在的位置。
  - 在沙盒化工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙盒化工作階段預設為 `sandbox`，非沙盒工作階段預設為 `host`。
  - 如果已連線具備瀏覽器能力的 Node，除非你固定使用 `target="host"` 或 `target="node"`，否則工具可能會自動路由到該 Node。

這可讓代理程式保持確定性，並避免脆弱的選取器。

## 相關

- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
- [沙盒化](/zh-TW/gateway/sandboxing) - 沙盒化環境中的瀏覽器控制
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制風險與強化
