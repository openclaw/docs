---
read_when:
    - 新增由代理控制的瀏覽器自動化
    - 偵錯 OpenClaw 為何干擾你自己的 Chrome
    - 在 macOS 應用程式中實作瀏覽器設定 + 生命週期
summary: 整合式瀏覽器控制服務 + 動作命令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-05-06T18:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行一個由代理控制的**專用 Chrome/Brave/Edge/Chromium 設定檔**。
它與你的個人瀏覽器隔離，並透過 Gateway 內的小型本機
控制服務管理（僅限迴送）。

初學者視角：

- 把它想成一個**獨立、僅供代理使用的瀏覽器**。
- `openclaw` 設定檔**不會**碰觸你的個人瀏覽器設定檔。
- 代理可以在安全通道中**開啟分頁、讀取頁面、點擊和輸入**。
- 內建的 `user` 設定檔會透過 Chrome MCP 附加到你真正已登入的 Chrome 工作階段。

## 你會得到什麼

- 名為 **openclaw** 的獨立瀏覽器設定檔（預設為橘色強調色）。
- 確定性的分頁控制（列出/開啟/聚焦/關閉）。
- 代理動作（點擊/輸入/拖曳/選取）、快照、螢幕截圖、PDF。
- 內建的 `browser-automation` Skill，會在瀏覽器
  Plugin 啟用時，教導代理快照、穩定分頁、過期參照和手動阻擋復原迴圈。
- 選用的多設定檔支援（`openclaw`、`work`、`remote`，...）。

這個瀏覽器**不是**你的日常主力瀏覽器。它是供
代理自動化和驗證使用的安全、隔離介面。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你收到「Browser disabled」，請在設定中啟用它（見下方），然後重新啟動
Gateway。

如果 `openclaw browser` 完全不存在，或代理表示瀏覽器工具
不可用，請跳到[缺少瀏覽器命令或工具](/zh-TW/tools/browser#missing-browser-command-or-tool)。

## Plugin 控制

預設的 `browser` 工具是內建 Plugin。停用它即可改用另一個註冊相同 `browser` 工具名稱的 Plugin：

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

預設值需要同時有 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。只停用 Plugin 會把 `openclaw browser` CLI、`browser.request` gateway 方法、代理工具和控制服務作為一個單位移除；你的 `browser.*` 設定會保留給替代方案使用。

瀏覽器設定變更需要重新啟動 Gateway，讓 Plugin 能重新註冊其服務。

## 代理指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果代理或
衍生子代理應使用瀏覽器自動化，請在設定檔
階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

對單一代理，使用 `agents.list[].tools.alsoAllow: ["browser"]`。
只有 `tools.subagents.tools.allow: ["browser"]` 不足夠，因為子代理
政策是在設定檔過濾之後才套用。

瀏覽器 Plugin 提供兩層代理指引：

- `browser` 工具描述帶有精簡且始終啟用的契約：選擇
  正確的設定檔、讓參照保持在同一個分頁上、使用 `tabId`/標籤進行分頁
  目標指定，並在多步驟工作時載入瀏覽器 Skill。
- 內建的 `browser-automation` Skill 帶有較長的操作迴圈：
  先檢查狀態/分頁、標記任務分頁、動作前擷取快照、UI 變更後重新擷取快照、
  對過期參照復原一次，並把登入/2FA/captcha 或
  攝影機/麥克風阻擋回報為需要手動動作，而不是猜測。

Plugin 內建的 Skills 會在 Plugin 啟用時列在代理可用 Skills 中。
完整 Skill 指示會按需載入，因此例行
回合不需要承擔完整 token 成本。

## 缺少瀏覽器命令或工具

如果升級後 `openclaw browser` 未知、`browser.request` 遺失，或代理回報瀏覽器工具不可用，通常原因是 `plugins.allow` 清單省略了 `browser`，且根層沒有 `browser` 設定區塊。加入它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層 `browser` 區塊，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，即使在限制性的 `plugins.allow` 下，也會啟用內建瀏覽器 Plugin，與頻道設定行為一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能替代允許清單成員資格。完全移除 `plugins.allow` 也會恢復預設值。

## 設定檔：`openclaw` 與 `user`

- `openclaw`：受管理、隔離的瀏覽器（不需要擴充功能）。
- `user`：內建的 Chrome MCP 附加設定檔，用於你的**真正已登入 Chrome**
  工作階段。

對代理瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 當現有登入工作階段很重要，且使用者在電腦前可點擊/核准任何附加提示時，
  偏好使用 `profile="user"`。
- 當你想要特定瀏覽器模式時，`profile` 是明確覆寫項。

如果你想預設使用受管理模式，請設定 `browser.defaultProfile: "openclaw"`。

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

<Accordion title="Ports and reachability">

- 控制服務會繫結到從 `gateway.port` 衍生的連接埠上的迴送位址（預設 `18791` = gateway + 2）。覆寫 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 會以同一系列位移衍生連接埠。
- 本機 `openclaw` 設定檔會自動指派 `cdpPort`/`cdpUrl`；只為遠端 CDP 設定這些值。未設定時，`cdpUrl` 預設為受管理的本機 CDP 連接埠。
- `remoteCdpTimeoutMs` 適用於遠端和 `attachOnly` CDP HTTP 可達性
  檢查以及開啟分頁的 HTTP 請求；`remoteCdpHandshakeTimeoutMs` 適用於
  它們的 CDP WebSocket 交握。
- `localLaunchTimeoutMs` 是本機啟動的受管理 Chrome
  程序公開其 CDP HTTP 端點的預算。`localCdpReadyTimeoutMs` 是程序被發現後，
  CDP websocket 就緒的後續預算。
  在 Chromium 啟動較慢的 Raspberry Pi、低階 VPS 或舊硬體上提高這些值。
  值必須是最高 `120000` ms 的正整數；無效
  設定值會被拒絕。
- 重複的受管理 Chrome 啟動/就緒失敗會依
  設定檔進入斷路狀態。連續失敗數次後，OpenClaw 會短暫暫停新的啟動
  嘗試，而不是在每次瀏覽器工具呼叫時都產生 Chromium。修正
  啟動問題、在不需要瀏覽器時停用它，或在修復後重新啟動
  Gateway。
- `actionTimeoutMs` 是呼叫端未傳入 `timeoutMs` 時，瀏覽器 `act` 請求的預設預算。用戶端傳輸會加入一小段寬限視窗，讓長時間等待能完成，而不是在 HTTP 邊界逾時。
- `tabCleanup` 是對主要代理瀏覽器工作階段所開啟分頁的盡力清理。子代理、cron 和 ACP 生命週期清理仍會在工作階段結束時關閉其明確追蹤的分頁；主要工作階段會保持作用中分頁可重用，然後在背景關閉閒置或超量的已追蹤分頁。

</Accordion>

<Accordion title="SSRF policy">

- 瀏覽器導覽和開啟分頁會在導覽前受到 SSRF 防護，之後也會在最終 `http(s)` URL 上盡力重新檢查。
- 在嚴格 SSRF 模式中，也會檢查遠端 CDP 端點探索和 `/json/version` 探查（`cdpUrl`）。
- Gateway/provider 的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 環境變數不會自動代理 OpenClaw 管理的瀏覽器。受管理 Chrome 預設直接啟動，因此 provider 代理設定不會削弱瀏覽器 SSRF 檢查。
- 若要代理受管理瀏覽器本身，請透過 `browser.extraArgs` 傳入明確的 Chrome 代理旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非已刻意啟用私人網路瀏覽器存取，否則嚴格 SSRF 模式會封鎖明確的瀏覽器代理路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設關閉；只有在刻意信任私人網路瀏覽器存取時才啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` 表示絕不啟動本機瀏覽器；只有在已有瀏覽器執行時才附加。
- `headless` 可設為全域或針對每個本機受管理設定檔設定。每個設定檔的值會覆寫 `browser.headless`，因此一個本機啟動的設定檔可以保持無頭模式，而另一個仍維持可見。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 會針對本機受管理設定檔要求
  一次性的無頭啟動，而不會重寫
  `browser.headless` 或設定檔組態。既有工作階段、僅附加，以及
  遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動那些
  瀏覽器程序。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，若環境或設定檔/全域
  組態都未明確選擇有介面模式，本機受管理設定檔
  會自動預設為無頭模式。`openclaw browser status --json`
  會將 `headlessSource` 回報為 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前程序的本機受管理啟動採用無頭模式。
  `OPENCLAW_BROWSER_HEADLESS=0` 會強制一般
  啟動採用有介面模式，並在沒有顯示伺服器的 Linux 主機上傳回可採取行動的錯誤；
  明確的 `start --headless` 要求仍會在該次啟動中優先。
- `executablePath` 可設為全域或針對每個本機受管理設定檔設定。每個設定檔的值會覆寫 `browser.executablePath`，因此不同受管理設定檔可以啟動不同的 Chromium 型瀏覽器。兩種形式都接受 `~` 代表你的作業系統家目錄。
- `color`（頂層和每個設定檔）會為瀏覽器 UI 著色，讓你看出目前使用中的設定檔。
- 預設設定檔是 `openclaw`（受管理的獨立設定檔）。使用 `defaultProfile: "user"` 可改用已登入的使用者瀏覽器。
- 自動偵測順序：若系統預設瀏覽器為 Chromium 型則使用它；否則依序為 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要為該驅動程式設定 `cdpUrl`。
- 當既有工作階段設定檔應附加至非預設 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受 `~` 代表你的作業系統家目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 型瀏覽器

如果你的**系統預設**瀏覽器是 Chromium 型（Chrome/Brave/Edge 等），
OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫
自動偵測。頂層和每個設定檔的 `executablePath` 值都接受 `~`
代表你的作業系統家目錄：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或在組態中依平台設定：

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

每個設定檔的 `executablePath` 只會影響由 OpenClaw
啟動的本機受管理設定檔。`existing-session` 設定檔會改為附加至已執行的瀏覽器，
而遠端 CDP 設定檔會使用 `cdpUrl` 後方的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：**Gateway 會啟動 loopback 控制服務，並可啟動本機瀏覽器。
- **遠端控制（node 主機）：**在有瀏覽器的機器上執行 node 主機；Gateway 會將瀏覽器操作代理到該主機。
- **遠端 CDP：**設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加至遠端 Chromium 型瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於 loopback 上由外部管理的 CDP 服務（例如發布到
  Docker 中 `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。沒有 `attachOnly`
  的 Loopback CDP 會被視為本機 OpenClaw 受管理瀏覽器設定檔。
- `headless` 只會影響由 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更既有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。在執行中的本機受管理設定檔上
  變更它，會將該設定檔標記為需要重新啟動/協調，使
  下一次啟動使用新的二進位檔。

停止行為會依設定檔模式而不同：

- 本機受管理設定檔：`openclaw browser stop` 會停止
  OpenClaw 啟動的瀏覽器程序
- 僅附加和遠端 CDP 設定檔：`openclaw browser stop` 會關閉作用中的
  控制工作階段，並釋放 Playwright/CDP 模擬覆寫（視窗大小、
  色彩配置、語言地區、時區、離線模式和類似狀態），即使
  OpenClaw 並未啟動任何瀏覽器程序

遠端 CDP URL 可包含驗證資訊：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 會在呼叫 `/json/*` 端點以及連線到
CDP WebSocket 時保留驗證資訊。權杖請優先使用環境變數或祕密管理器，
而不是提交到組態檔。

## Node 瀏覽器代理（零組態預設）

如果你在有瀏覽器的機器上執行 **node 主機**，OpenClaw 可以
自動將瀏覽器工具呼叫路由到該 node，而不需要任何額外瀏覽器組態。
這是遠端 Gateway 的預設路徑。

注意事項：

- node 主機會透過**代理命令**公開其本機瀏覽器控制伺服器。
- 設定檔來自 node 自己的 `browser.profiles` 組態（與本機相同）。
- `nodeHost.browserProxy.allowProfiles` 是選用的。將它留空即可使用舊版/預設行為：所有已設定的設定檔都仍可透過代理存取，包括設定檔建立/刪除路由。
- 如果你設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將其視為最小權限邊界：只能鎖定允許清單中的設定檔，且代理介面上的持久設定檔建立/刪除路由會被封鎖。
- 若不需要它，請停用：
  - 在 node 上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（託管遠端 CDP）

[Browserless](https://browserless.io) 是一項託管 Chromium 服務，會透過
HTTPS 和 WebSocket 公開 CDP 連線 URL。OpenClaw 可使用任一形式，但
對於遠端瀏覽器設定檔，最簡單的選項是使用 Browserless 連線文件中的
直接 WebSocket URL。

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

- 將 `<BROWSERLESS_API_KEY>` 替換為你的真實 Browserless 權杖。
- 選擇符合你 Browserless 帳戶的區域端點（請參閱其文件）。
- 如果 Browserless 提供 HTTPS 基礎 URL，你可以將它轉換為
  `wss://` 以進行直接 CDP 連線，或保留 HTTPS URL，讓 OpenClaw
  探索 `/json/version`。

### 同一主機上的 Browserless Docker

當 Browserless 在 Docker 中自行託管，且 OpenClaw 在主機上執行時，請將
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

`browser.profiles.browserless.cdpUrl` 中的位址必須能從
OpenClaw 程序連線。Browserless 也必須公告相符且可連線的端點；
請將 Browserless `EXTERNAL` 設為相同的公開到 OpenClaw WebSocket 基底，
例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的私有 Docker
網路位址。如果 `/json/version` 傳回的 `webSocketDebuggerUrl` 指向
OpenClaw 無法連線的位址，CDP HTTP 可能看似正常，但 WebSocket
附加仍會失敗。

不要讓 loopback Browserless 設定檔的 `attachOnly` 保持未設定。沒有
`attachOnly` 時，OpenClaw 會將該 loopback 連接埠視為本機受管理瀏覽器
設定檔，並可能回報該連接埠正在使用中，但並非由 OpenClaw 擁有。

## 直接 WebSocket CDP 提供者

某些託管瀏覽器服務公開的是**直接 WebSocket** 端點，而不是
標準的 HTTP 型 CDP 探索（`/json/version`）。OpenClaw 接受三種
CDP URL 形式，並會自動選擇正確的連線策略：

- **HTTP(S) 探索** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 會呼叫 `/json/version` 來探索 WebSocket 偵錯工具 URL，然後
  連線。沒有 WebSocket 後備。
- **直接 WebSocket 端點** - `ws://host[:port]/devtools/<kind>/<id>` 或
  具有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  路徑的 `wss://...`。OpenClaw 會透過 WebSocket 交握直接連線，並完全略過
  `/json/version`。
- **裸 WebSocket 根路徑** - 沒有
  `/devtools/...` 路徑的 `ws://host[:port]` 或 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試 HTTP
  `/json/version` 探索（將配置正規化為 `http`/`https`）；
  如果探索傳回 `webSocketDebuggerUrl`，就會使用它，否則 OpenClaw
  會後備到裸根路徑上的直接 WebSocket 交握。如果公告的
  WebSocket 端點拒絕 CDP 交握，但設定的裸根路徑
  接受它，OpenClaw 也會後備到該根路徑。這讓指向本機 Chrome 的裸 `ws://`
  仍可連線，因為 Chrome 只接受來自 `/json/version` 的特定每目標路徑上的 WebSocket
  升級，而託管提供者在其探索
  端點公告不適合 Playwright CDP 的短效 URL 時，仍可使用其根 WebSocket 端點。

### Browserbase

[Browserbase](https://www.browserbase.com) 是用於執行
無頭瀏覽器的雲端平台，內建 CAPTCHA 解決、隱匿模式和住宅代理。

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

- [註冊](https://www.browserbase.com/sign-up)，並從 [Overview dashboard](https://www.browserbase.com/overview) 複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你的真實 Browserbase API 金鑰。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要
  手動建立工作階段步驟。
- 免費方案允許一個並行工作階段，以及每月一個瀏覽器小時。
  付費方案限制請參閱 [pricing](https://www.browserbase.com/pricing)。
- 完整 API
  參考、SDK 指南和整合範例，請參閱 [Browserbase 文件](https://docs.browserbase.com)。

## 安全性

關鍵概念：

- 瀏覽器控制僅限 loopback；存取流程會透過 Gateway 的驗證或節點配對。
- 獨立的 loopback 瀏覽器 HTTP API **僅使用共享密鑰驗證**：
  gateway token bearer 驗證、`x-openclaw-password`，或使用已設定 Gateway 密碼的 HTTP Basic 驗證。
- Tailscale Serve 身分標頭與 `gateway.auth.mode: "trusted-proxy"` **不會**驗證這個獨立的 loopback 瀏覽器 API。
- 如果已啟用瀏覽器控制但未設定共享密鑰驗證，OpenClaw
  會為該次啟動產生僅限執行階段使用的 Gateway token。如果用戶端需要在重新啟動後仍有穩定密鑰，請明確設定
  `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`，或
  `OPENCLAW_GATEWAY_PASSWORD`。
- 當 `gateway.auth.mode` 已經是 `password`、`none` 或 `trusted-proxy` 時，OpenClaw **不會**自動產生該 token。
- 將 Gateway 與任何節點主機保留在私人網路（Tailscale）上；避免公開暴露。
- 將遠端 CDP URL/token 視為機密；優先使用 env vars 或密鑰管理器。

遠端 CDP 提示：

- 儘可能優先使用加密端點（HTTPS 或 WSS）與短效 token。
- 避免將長效 token 直接嵌入設定檔。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **openclaw-managed**：專用的 Chromium-based 瀏覽器執行個體，具有自己的使用者資料目錄 + CDP 連接埠
- **remote**：明確的 CDP URL（在其他地方執行的 Chromium-based 瀏覽器）
- **existing session**：透過 Chrome DevTools MCP 自動連線使用你現有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，會自動建立。
- `user` 設定檔是內建的，用於 Chrome MCP 既有工作階段附加。
- 除了 `user` 之外，既有工作階段設定檔需要選擇啟用；使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設從 **18800-18899** 分配。
- 刪除設定檔會將其本機資料目錄移至垃圾桶。

所有控制端點都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用既有工作階段

OpenClaw 也可以透過官方 Chrome DevTools MCP server 附加到正在執行的 Chromium-based 瀏覽器設定檔。這會重用該瀏覽器設定檔中已開啟的分頁與登入狀態。

官方背景與設定參考：

- [Chrome for Developers：搭配你的瀏覽器工作階段使用 Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：

- `user`

選用：如果你想使用不同名稱、顏色或瀏覽器資料目錄，可以建立自己的自訂既有工作階段設定檔。

預設行為：

- 內建的 `user` 設定檔使用 Chrome MCP 自動連線，其目標是預設的本機 Google Chrome 設定檔。

若要使用 Brave、Edge、Chromium，或非預設 Chrome 設定檔，請使用 `userDataDir`。
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

接著在對應的瀏覽器中：

1. 開啟該瀏覽器用於遠端偵錯的 inspect 頁面。
2. 啟用遠端偵錯。
3. 讓瀏覽器保持執行，並在 OpenClaw 附加時核准連線提示。

常見 inspect 頁面：

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

成功時會看到：

- `status` 顯示 `driver: existing-session`
- `status` 顯示 `transport: chrome-mcp`
- `status` 顯示 `running: true`
- `tabs` 列出你已開啟的瀏覽器分頁
- `snapshot` 從選取的即時分頁傳回 refs

如果附加無法運作，請檢查：

- 目標 Chromium-based 瀏覽器版本是 `144+`
- 已在該瀏覽器的 inspect 頁面中啟用遠端偵錯
- 瀏覽器已顯示且你已接受附加同意提示
- `openclaw doctor` 會遷移舊的 extension-based 瀏覽器設定，並檢查本機是否已安裝 Chrome 以供預設自動連線設定檔使用，但它無法代你啟用瀏覽器端的遠端偵錯

Agent 使用：

- 當你需要使用者的已登入瀏覽器狀態時，使用 `profile="user"`。
- 如果你使用自訂既有工作階段設定檔，請傳入該明確的設定檔名稱。
- 只有在使用者位於電腦前可核准附加提示時，才選擇此模式。
- Gateway 或節點主機可以產生 `npx chrome-devtools-mcp@latest --autoConnect`

注意事項：

- 這條路徑比隔離的 `openclaw` 設定檔風險更高，因為它可以在你已登入的瀏覽器工作階段內操作。
- OpenClaw 不會為此 driver 啟動瀏覽器；它只會附加。
- OpenClaw 在這裡使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果設定了 `userDataDir`，它會被傳遞以鎖定該使用者資料目錄。
- 既有工作階段可以在選取的主機上附加，或透過已連線的瀏覽器節點附加。如果 Chrome 位於其他地方且沒有瀏覽器節點連線，請改用遠端 CDP 或節點主機。

### 自訂 Chrome MCP 啟動

當預設的 `npx chrome-devtools-mcp@latest` 流程不是你想要的情境（離線主機、釘選版本、vendored binaries）時，可依設定檔覆寫產生的 Chrome DevTools MCP server：

| 欄位         | 作用                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 用於產生而非 `npx` 的可執行檔。會依原樣解析；絕對路徑會受到支援。                                                        |
| `mcpArgs`    | 逐字傳遞給 `mcpCommand` 的引數陣列。會取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。 |

當既有工作階段設定檔設定了 `cdpUrl` 時，OpenClaw 會略過
`--autoConnect`，並自動將端點轉送給 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP discovery 端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標與 `userDataDir` 不能合併使用：設定 `cdpUrl` 時，Chrome MCP 啟動會忽略
`userDataDir`，因為 Chrome MCP 會附加到端點後方正在執行的瀏覽器，而不是開啟設定檔目錄。

<Accordion title="既有工作階段功能限制">

相較於受管理的 `openclaw` 設定檔，既有工作階段 driver 的限制較多：

- **螢幕截圖** - 頁面擷取與 `--ref` 元素擷取可運作；CSS `--element` selector 不支援。`--full-page` 無法與 `--ref` 或 `--element` 合併使用。頁面或 ref-based 元素螢幕截圖不需要 Playwright。
- **動作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支援 CSS selectors）。`click-coords` 會點擊可見 viewport 座標，且不需要 snapshot ref。`click` 僅支援左鍵。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支援逐次呼叫 timeout。`select` 接受單一值。
- **等待 / 上傳 / 對話框** - `wait --url` 支援精確、子字串與 glob 模式；不支援 `wait --load networkidle`。上傳 hooks 需要 `ref` 或 `inputRef`，一次一個檔案，不支援 CSS `element`。對話框 hooks 不支援 timeout 覆寫。
- **僅受管理功能** - 批次動作、PDF 匯出、下載攔截與 `responsebody` 仍需要受管理的瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不觸碰你的個人瀏覽器設定檔。
- **專用連接埠**：避免使用 `9222`，以防與開發工作流程衝突。
- **決定性的分頁控制**：`tabs` 會先傳回 `suggestedTargetId`，接著是穩定的 `tabId` 控制代碼，例如 `t1`、選用標籤，以及原始 `targetId`。Agents 應重用 `suggestedTargetId`；原始 id 仍可用於偵錯與相容性。

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
- Linux：檢查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常見的 Chrome/Brave/Edge/Chromium 位置。
- Windows：檢查常見安裝位置。

## 控制 API（選用）

對於指令碼撰寫與偵錯，Gateway 會公開一個小型的**僅限 loopback HTTP 控制 API**，以及對應的 `openclaw browser` CLI（snapshots、refs、wait power-ups、JSON 輸出、偵錯工作流程）。完整參考請見
[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

若是 Linux-specific 問題（尤其是 snap Chromium），請見
[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

若是 WSL2 Gateway + Windows Chrome 分離主機設定，請見
[WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 封鎖

這些是不同的失敗類別，且指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面狀態良好。
- **導覽 SSRF 封鎖**表示瀏覽器控制平面狀態良好，但頁面導覽目標遭原則拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 當設定 loopback 外部 CDP 服務卻未設定 `attachOnly: true` 時，`Port <port> is in use for profile "<name>" but not by openclaw`
- 導覽 SSRF 封鎖：
  - `open`、`navigate`、snapshot 或開啟分頁流程失敗，並出現瀏覽器/網路原則錯誤，但 `start` 和 `tabs` 仍可運作

使用這個最小序列區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解讀結果：

- 如果 `start` 因 `not reachable after start` 失敗，請先排查 CDP 就緒狀態。
- 如果 `start` 成功但 `tabs` 失敗，控制平面仍然不健康。請將此視為 CDP 可達性問題，而不是頁面導覽問題。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，代表瀏覽器控制平面已啟動，失敗位於導覽原則或目標頁面。
- 如果 `start`、`tabs` 和 `open` 全部成功，基本的受管理瀏覽器控制路徑狀態良好。

重要行為細節：

- 即使你沒有設定 `browser.ssrfPolicy`，瀏覽器設定也會預設為 fail-closed SSRF 原則物件。
- 對於 local loopback `openclaw` 受管理設定檔，CDP 健康檢查會刻意略過針對 OpenClaw 自身本機控制平面的瀏覽器 SSRF 可達性強制檢查。
- 導覽保護是獨立的。成功的 `start` 或 `tabs` 結果不代表後續的 `open` 或 `navigate` 目標會被允許。

安全指引：

- 預設情況下，**不要**放寬瀏覽器 SSRF 原則。
- 優先使用狹窄的主機例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是廣泛的私人網路存取。
- 只有在刻意信任、需要且已審查私人網路瀏覽器存取的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## Agent tools + 控制如何運作

代理程式會取得 **一個工具** 用於瀏覽器自動化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹狀結構（AI 或 ARIA）。
- `browser act` 使用快照的 `ref` ID 來點選/輸入/拖曳/選取。
- `browser screenshot` 會擷取像素（整頁、元素或已標記的 refs）。
- `browser doctor` 會檢查 Gateway、Plugin、設定檔、瀏覽器和分頁是否就緒。
- `browser` 接受：
  - `profile` 用來選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target`（`sandbox` | `host` | `node`）用來選擇瀏覽器所在位置。
  - 在沙盒化工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙盒化工作階段預設為 `sandbox`，非沙盒工作階段預設為 `host`。
  - 如果已連線支援瀏覽器的節點，工具可能會自動路由到該節點，除非你固定指定 `target="host"` 或 `target="node"`。

這能讓代理程式保持決定性，並避免脆弱的選取器。

## 相關

- [工具總覽](/zh-TW/tools) - 所有可用的代理程式工具
- [沙盒化](/zh-TW/gateway/sandboxing) - 沙盒化環境中的瀏覽器控制
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制風險與強化措施
