---
read_when:
    - 新增由代理控制的瀏覽器自動化
    - 偵錯 openclaw 為什麼會干擾你自己的 Chrome
    - 在 macOS 應用程式中實作瀏覽器設定與生命週期
summary: 整合式瀏覽器控制服務 + 動作命令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-06-27T20:04:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行一個由代理程式控制的**專用 Chrome/Brave/Edge/Chromium 設定檔**。
它與你的個人瀏覽器隔離，並透過閘道內的小型本機
控制服務管理（僅限 loopback）。

初學者視角：

- 把它想成一個**獨立、僅供代理程式使用的瀏覽器**。
- `openclaw` 設定檔**不會**碰觸你的個人瀏覽器設定檔。
- 代理程式可以在安全通道中**開啟分頁、讀取頁面、點擊和輸入**。
- 內建的 `user` 設定檔會透過 Chrome MCP 附加到你真正已登入的 Chrome 工作階段。

## 你會得到什麼

- 一個名為 **openclaw** 的獨立瀏覽器設定檔（預設為橘色強調色）。
- 可預測的分頁控制（列出/開啟/聚焦/關閉）。
- 代理程式動作（點擊/輸入/拖曳/選取）、快照、截圖、PDF。
- 內建的 `browser-automation` skill，會在瀏覽器
  外掛啟用時，教導代理程式快照、穩定分頁、過期參照和手動阻擋復原迴圈。
- 可選的多設定檔支援（`openclaw`、`work`、`remote`、...）。

這個瀏覽器**不是**你的日常主力瀏覽器。它是供代理程式自動化與驗證使用的安全、隔離介面。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到「瀏覽器已停用」，請在設定中啟用它（見下方），並重新啟動
閘道。

如果完全沒有 `openclaw browser`，或代理程式表示瀏覽器工具
無法使用，請跳到[缺少瀏覽器命令或工具](/zh-TW/tools/browser#missing-browser-command-or-tool)。

## 外掛控制

預設的 `browser` 工具是內建外掛。停用它即可改用另一個註冊相同 `browser` 工具名稱的外掛：

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

預設值同時需要 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。只停用外掛會將 `openclaw browser` 命令列介面、`browser.request` 閘道方法、代理程式工具和控制服務作為一個整體移除；你的 `browser.*` 設定會保留給替代方案使用。

瀏覽器設定變更需要重新啟動閘道，外掛才能重新註冊其服務。

## 代理程式指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果代理程式或
產生的子代理程式應使用瀏覽器自動化，請在設定檔
階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

對單一代理程式，請使用 `agents.list[].tools.alsoAllow: ["browser"]`。
單獨使用 `tools.subagents.tools.allow: ["browser"]` 不足夠，因為子代理程式
政策是在設定檔篩選後才套用。

瀏覽器外掛提供兩層代理程式指引：

- `browser` 工具說明帶有精簡的常駐契約：選擇
  正確的設定檔、讓參照留在同一分頁、使用 `tabId`/標籤進行分頁
  目標指定，並在多步驟工作中載入瀏覽器 skill。
- 內建的 `browser-automation` skill 帶有較長的操作迴圈：
  先檢查狀態/分頁、標記工作分頁、動作前建立快照、UI 變更後重新建立快照、
  過期參照復原一次，並將登入/2FA/驗證碼或
  相機/麥克風阻擋回報為需要手動處理，而不是猜測。

外掛內建的 Skills 會在外掛啟用時列在代理程式可用的 Skills 中。
完整 skill 指示會依需求載入，因此例行
回合不需要支付完整 token 成本。

## 缺少瀏覽器命令或工具

如果升級後 `openclaw browser` 未知、`browser.request` 缺失，或代理程式回報瀏覽器工具不可用，常見原因是 `plugins.allow` 清單省略了 `browser`，且根層沒有 `browser` 設定區塊。加入它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層 `browser` 區塊，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，即使在限制性的 `plugins.allow` 下也會啟用內建瀏覽器外掛，與通道設定行為一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能取代 allowlist 成員資格。完全移除 `plugins.allow` 也會恢復預設值。

## 設定檔：`openclaw` 與 `user`

- `openclaw`：受管理、隔離的瀏覽器（不需要擴充功能）。
- `user`：內建 Chrome MCP 附加設定檔，用於你的**真實已登入 Chrome**
  工作階段。

對代理程式瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 當既有已登入工作階段很重要，且使用者在電腦前可點擊/核准任何附加提示時，
  優先使用 `profile="user"`。
- 當你想要特定瀏覽器模式時，`profile` 是明確覆寫。

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

### 截圖視覺（僅文字模型支援）

當主要模型僅支援文字（不支援視覺/多模態）時，瀏覽器
截圖會回傳模型無法讀取的圖片區塊。瀏覽器截圖
會重用既有圖片理解設定，因此為媒體理解
設定的圖片模型可以將截圖描述為文字，而不需要任何
瀏覽器專用模型設定。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**運作方式：**

1. 代理程式呼叫 `browser screenshot` → 圖片照常擷取到磁碟。
2. 瀏覽器工具會詢問既有圖片理解執行階段，是否
   可以使用已設定的媒體圖片模型、共享媒體
   模型、圖片模型預設值或由驗證支援的圖片提供者來描述截圖。
3. 視覺模型會回傳文字描述，該描述會以
   `wrapExternalContent`（提示注入防護）包裝，並作為文字區塊回傳給代理程式，
   而不是圖片區塊。
4. 如果圖片理解不可用、被略過或失敗，瀏覽器會
   退回回傳原始圖片區塊。

請使用既有的 `tools.media.image` / `tools.media.models` 欄位來設定模型
備援、逾時、位元組限制、設定檔和提供者請求設定。

如果作用中的主要模型已支援視覺，且未設定明確的圖片
理解模型，OpenClaw 會保留正常圖片結果，讓
主要模型可以直接讀取截圖。

<AccordionGroup>

<Accordion title="Ports and reachability">

- 控制服務會綁定到 loopback，連接埠衍生自 `gateway.port`（預設 `18791` = gateway + 2）。覆寫 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 會使同一系列中的衍生連接埠一起位移。
- 本機 `openclaw` 設定檔會自動指派 `cdpPort`/`cdpUrl`；只有在
  遠端 CDP 設定檔或既有工作階段端點附加時才設定這些值。未設定時，`cdpUrl` 預設為
  受管理的本機 CDP 連接埠。
- `remoteCdpTimeoutMs` 套用於遠端和 `attachOnly` CDP HTTP 可達性
  檢查以及開啟分頁的 HTTP 請求；`remoteCdpHandshakeTimeoutMs` 套用於
  它們的 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本機啟動的受管理 Chrome
  程序公開其 CDP HTTP 端點的預算。`localCdpReadyTimeoutMs` 是
  程序被發現後，CDP websocket 就緒的後續預算。
  在 Raspberry Pi、低階 VPS 或 Chromium
  啟動較慢的舊硬體上提高這些值。值必須是最高 `120000` ms 的正整數；無效的
  設定值會被拒絕。
- 重複的受管理 Chrome 啟動/就緒失敗會依
  設定檔觸發斷路。在數次連續失敗後，OpenClaw 會短暫暫停新的啟動
  嘗試，而不是在每次瀏覽器工具呼叫時都產生 Chromium。請修正
  啟動問題、在不需要瀏覽器時停用它，或在修復後重新啟動
  閘道。
- 當呼叫端未傳入 `timeoutMs` 時，`actionTimeoutMs` 是瀏覽器 `act` 請求的預設預算。用戶端傳輸會加入小幅緩衝時間，讓長時間等待可以完成，而不是在 HTTP 邊界逾時。
- `tabCleanup` 是針對主要代理程式瀏覽器工作階段所開啟分頁的盡力清理。子代理程式、排程和 ACP 生命週期清理仍會在工作階段結束時關閉其明確追蹤的分頁；主要工作階段會保留作用中分頁以便重用，然後在背景關閉閒置或超量的追蹤分頁。

</Accordion>

<Accordion title="SSRF policy">

- 瀏覽器導覽與開啟分頁會在導覽前套用 SSRF 防護，之後也會在最終的 `http(s)` URL 上盡力重新檢查。
- 在嚴格 SSRF 模式中，也會檢查遠端 CDP 端點探索與 `/json/version` 探測（`cdpUrl`）。
- 閘道/供應商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 環境變數不會自動代理 OpenClaw 管理的瀏覽器。受管理的 Chrome 預設會直接啟動，因此供應商代理設定不會削弱瀏覽器 SSRF 檢查。
- OpenClaw 管理的本機 CDP 就緒探測與 DevTools WebSocket 連線，會針對實際啟動的回送端點略過受管理的網路代理，因此即使操作員代理封鎖回送流出，`openclaw browser start` 仍可運作。
- 若要代理受管理的瀏覽器本身，請透過 `browser.extraArgs` 傳入明確的 Chrome 代理旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非刻意啟用私有網路瀏覽器存取，否則嚴格 SSRF 模式會封鎖明確的瀏覽器代理路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設為關閉；只有在刻意信任私有網路瀏覽器存取時才啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作為舊版別名受到支援。

</Accordion>

<Accordion title="設定檔行為">

- `attachOnly: true` 表示絕不啟動本機瀏覽器；只有在已經有瀏覽器執行時才附加。
- `headless` 可全域設定，也可針對每個本機受管理設定檔設定。每個設定檔的值會覆寫 `browser.headless`，因此一個本機啟動的設定檔可以保持無頭模式，而另一個保持可見。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 會針對本機受管理設定檔要求一次性的無頭啟動，而不會重寫 `browser.headless` 或設定檔組態。既有工作階段、僅附加以及遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動那些瀏覽器程序。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，若環境或設定檔/全域組態都未明確選擇有頭模式，本機受管理設定檔會自動預設為無頭模式。`openclaw browser status --json` 會將 `headlessSource` 回報為 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前程序的本機受管理啟動使用無頭模式。`OPENCLAW_BROWSER_HEADLESS=0` 會強制一般啟動使用有頭模式，並在沒有顯示伺服器的 Linux 主機上傳回可操作的錯誤；明確的 `start --headless` 要求仍會在該次啟動中優先。
- `executablePath` 可全域設定，也可針對每個本機受管理設定檔設定。每個設定檔的值會覆寫 `browser.executablePath`，因此不同受管理設定檔可以啟動不同的 Chromium 系瀏覽器。兩種形式都接受 `~` 作為作業系統主目錄。
- `color`（頂層和每個設定檔）會為瀏覽器介面上色，讓你看出目前作用中的設定檔。
- 預設設定檔是 `openclaw`（受管理的獨立設定檔）。使用 `defaultProfile: "user"` 可選擇使用已登入的使用者瀏覽器。
- 自動偵測順序：若系統預設瀏覽器以 Chromium 為基礎則使用它；否則依序為 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。它可透過 Chrome MCP 自動連線附加，或在你已經有執行中瀏覽器的 DevTools 端點時透過 `cdpUrl` 附加。
- 當既有工作階段設定檔應附加到非預設 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受 `~` 作為作業系統主目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系瀏覽器

如果你的**系統預設**瀏覽器以 Chromium 為基礎（Chrome/Brave/Edge/等），OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫自動偵測。頂層和每個設定檔的 `executablePath` 值都接受 `~` 作為作業系統主目錄：

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

每個設定檔的 `executablePath` 只會影響由 OpenClaw 啟動的本機受管理設定檔。`existing-session` 設定檔會改為附加到已經執行中的瀏覽器，而遠端 CDP 設定檔會使用 `cdpUrl` 後方的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：**閘道會啟動回送控制服務，並可啟動本機瀏覽器。
- **遠端控制（節點主機）：**在有瀏覽器的機器上執行節點主機；閘道會將瀏覽器動作代理到該主機。
- **遠端 CDP：**設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到遠端 Chromium 系瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於在回送上由外部管理的 CDP 服務（例如在 Docker 中發布到 `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。沒有 `attachOnly` 的回送 CDP 會被視為本機 OpenClaw 管理的瀏覽器設定檔。
- `headless` 只會影響由 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更既有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。在執行中的本機受管理設定檔上變更它，會將該設定檔標記為需要重新啟動/協調，讓下一次啟動使用新的二進位檔。

停止行為會依設定檔模式而異：

- 本機受管理設定檔：`openclaw browser stop` 會停止 OpenClaw 啟動的瀏覽器程序
- 僅附加和遠端 CDP 設定檔：`openclaw browser stop` 會關閉作用中的控制工作階段，並釋放 Playwright/CDP 模擬覆寫（視窗大小、色彩配置、地區設定、時區、離線模式及類似狀態），即使 OpenClaw 並未啟動任何瀏覽器程序

遠端 CDP URL 可以包含驗證資訊：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic 驗證（例如 `https://user:pass@provider.example`）

OpenClaw 在呼叫 `/json/*` 端點以及連線到 CDP WebSocket 時會保留驗證資訊。請優先使用環境變數或密鑰管理工具存放權杖，而不是將它們提交到組態檔。

## 節點瀏覽器代理（零組態預設）

如果你在有瀏覽器的機器上執行**節點主機**，OpenClaw 可以自動將瀏覽器工具呼叫路由到該節點，而不需要任何額外的瀏覽器組態。這是遠端閘道的預設路徑。

注意事項：

- 節點主機會透過**代理命令**公開其本機瀏覽器控制伺服器。
- 設定檔來自節點自己的 `browser.profiles` 組態（與本機相同）。
- `nodeHost.browserProxy.allowProfiles` 是選用的。將它留空可使用舊版/預設行為：所有已設定的設定檔都仍可透過代理存取，包括設定檔建立/刪除路由。
- 如果你設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將它視為最小權限邊界：只有允許清單中的設定檔可被指定為目標，且持久設定檔建立/刪除路由會在代理介面上被封鎖。
- 若不想使用它，請停用：
  - 在節點上：`nodeHost.browserProxy.enabled=false`
  - 在閘道上：`gateway.nodes.browser.mode="off"`

## Browserless（託管遠端 CDP）

[Browserless](https://browserless.io) 是一項託管的 Chromium 服務，會透過 HTTPS 和 WebSocket 公開 CDP 連線 URL。OpenClaw 可以使用任一形式，但對於遠端瀏覽器設定檔，最簡單的選項是 Browserless 連線文件中的直接 WebSocket URL。

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

- 將 `<BROWSERLESS_API_KEY>` 替換為你的實際 Browserless 權杖。
- 選擇符合你 Browserless 帳戶的區域端點（請參閱其文件）。
- 如果 Browserless 提供 HTTPS 基底 URL，你可以將它轉換為 `wss://` 以建立直接 CDP 連線，或保留 HTTPS URL 並讓 OpenClaw 探索 `/json/version`。

### 同一主機上的 Browserless Docker

當 Browserless 以 Docker 自行託管，且 OpenClaw 在主機上執行時，請將 Browserless 視為由外部管理的 CDP 服務：

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

`browser.profiles.browserless.cdpUrl` 中的位址必須可從 OpenClaw 程序連線。Browserless 也必須宣告相符且可連線的端點；請將 Browserless `EXTERNAL` 設為相同的、從 OpenClaw 可達的 WebSocket 基底，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的私有 Docker 網路位址。如果 `/json/version` 傳回的 `webSocketDebuggerUrl` 指向 OpenClaw 無法連線的位址，CDP HTTP 可能看似正常，但 WebSocket 附加仍會失敗。

不要讓回送 Browserless 設定檔的 `attachOnly` 保持未設定。若沒有 `attachOnly`，OpenClaw 會將回送連接埠視為本機受管理瀏覽器設定檔，並可能回報該連接埠正在使用中但不屬於 OpenClaw。

## 直接 WebSocket CDP 供應商

部分託管瀏覽器服務會公開**直接 WebSocket** 端點，而不是標準的 HTTP 型 CDP 探索（`/json/version`）。OpenClaw 接受三種 CDP URL 形狀，並會自動選擇正確的連線策略：

- **HTTP(S) 探索** - `http://host[:port]` 或 `https://host[:port]`。OpenClaw 會呼叫 `/json/version` 以探索 WebSocket 偵錯工具 URL，然後連線。沒有 WebSocket 備援。
- **直接 WebSocket 端點** - `ws://host[:port]/devtools/<kind>/<id>` 或帶有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路徑的 `wss://...`。OpenClaw 會透過 WebSocket 交握直接連線，並完全略過 `/json/version`。
- **裸 WebSocket 根目錄** - `ws://host[:port]` 或沒有 `/devtools/...` 路徑的 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試 HTTP `/json/version` 探索（將通訊協定標準化為 `http`/`https`）；如果探索傳回 `webSocketDebuggerUrl`，就會使用它，否則 OpenClaw 會在裸根目錄回退到直接 WebSocket 交握。如果宣告的 WebSocket 端點拒絕 CDP 交握，但設定的裸根目錄接受它，OpenClaw 也會回退到該根目錄。這可讓指向本機 Chrome 的裸 `ws://` 仍能連線，因為 Chrome 只接受來自 `/json/version` 的特定逐目標路徑上的 WebSocket 升級，而託管供應商在其探索端點宣告不適合 Playwright CDP 的短期 URL 時，仍可使用其根 WebSocket 端點。

`openclaw browser doctor` 使用與執行階段附加相同的探索優先、WebSocket 備援邏輯，因此可成功連線的裸根 URL 不會被診斷回報為無法連線。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一個用於執行無頭瀏覽器的雲端平台，內建 CAPTCHA 解題、隱身模式和住宅代理。

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

- [註冊](https://www.browserbase.com/sign-up)並從[概覽儀表板](https://www.browserbase.com/overview)複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你真正的 Browserbase API 金鑰。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段的步驟。
- 免費方案允許一個並行工作階段，以及每月一個瀏覽器小時。付費方案限制請參閱[定價](https://www.browserbase.com/pricing)。
- 完整 API 參考、SDK 指南和整合範例請參閱 [Browserbase 文件](https://docs.browserbase.com)。

### Notte

[Notte](https://www.notte.cc) 是一個雲端平台，用於執行無頭瀏覽器，內建隱匿功能、住宅代理，以及原生 CDP 的 WebSocket 閘道。

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

- [註冊](https://console.notte.cc)並從主控台設定頁面複製你的 **API Key**。
- 將 `<NOTTE_API_KEY>` 替換為你真正的 Notte API 金鑰。
- Notte 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段的步驟。WebSocket 中斷連線時，該工作階段會被銷毀。
- 免費方案允許五個並行工作階段，以及 100 個終身瀏覽器小時。付費方案限制請參閱[定價](https://www.notte.cc/#pricing)。
- 完整 API 參考、SDK 指南和整合範例請參閱 [Notte 文件](https://docs.notte.cc)。

## 安全性

核心概念：

- 瀏覽器控制僅限 local loopback；存取會經由閘道的驗證或節點配對流程。
- 獨立的 local loopback 瀏覽器 HTTP API **僅使用共享密鑰驗證**：閘道權杖 bearer 驗證、`x-openclaw-password`，或使用已設定閘道密碼的 HTTP Basic 驗證。
- Tailscale Serve 身分標頭與 `gateway.auth.mode: "trusted-proxy"` **不會**驗證這個獨立的 local loopback 瀏覽器 API。
- 如果已啟用瀏覽器控制且未設定共享密鑰驗證，OpenClaw 會為該次啟動產生僅限執行期使用的閘道權杖。如果用戶端需要在重新啟動後仍穩定的密鑰，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。
- 當 `gateway.auth.mode` 已經是 `password`、`none` 或 `trusted-proxy` 時，OpenClaw **不會**自動產生該權杖。
- 請將閘道與任何節點主機保留在私人網路（Tailscale）上；避免公開暴露。
- 將遠端 CDP URL/權杖視為密鑰；優先使用環境變數或密鑰管理器。

遠端 CDP 提示：

- 盡可能優先使用加密端點（HTTPS 或 WSS）與短效權杖。
- 避免將長效權杖直接嵌入設定檔。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **OpenClaw 管理**：專用的 Chromium 系瀏覽器執行個體，具備自己的使用者資料目錄與 CDP 連接埠
- **遠端**：明確的 CDP URL（在其他位置執行的 Chromium 系瀏覽器）
- **既有工作階段**：透過 Chrome DevTools MCP 自動連線到你既有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，系統會自動建立。
- `user` 設定檔是內建的，用於 Chrome MCP 既有工作階段附加。
- 除了 `user` 之外，既有工作階段設定檔都是選用；請使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設從 **18800-18899** 配置。
- 刪除設定檔會將其本機資料目錄移到垃圾桶。

所有控制端點都接受 `?profile=<name>`；命令列介面使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用既有工作階段

OpenClaw 也可以透過官方 Chrome DevTools MCP 伺服器附加到正在執行的 Chromium 系瀏覽器設定檔。這會重用該瀏覽器設定檔中已開啟的分頁與登入狀態。

官方背景與設定參考：

- [Chrome for Developers：Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：

- `user`

選用：如果你想要不同的名稱、顏色或瀏覽器資料目錄，可以建立自己的自訂既有工作階段設定檔。

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

1. 開啟該瀏覽器用於遠端除錯的 inspect 頁面。
2. 啟用遠端除錯。
3. 保持瀏覽器執行，並在 OpenClaw 附加時核准連線提示。

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
- `snapshot` 從所選即時分頁傳回 refs

如果附加無法運作，請檢查：

- 目標 Chromium 系瀏覽器版本是 `144+`
- 該瀏覽器的 inspect 頁面已啟用遠端除錯
- 瀏覽器已顯示附加同意提示，且你已接受
- 如果 Chrome 是以明確的 `--remote-debugging-port` 啟動，請將 `browser.profiles.<name>.cdpUrl` 設為該 DevTools 端點，而不是依賴 Chrome MCP 自動連線
- `openclaw doctor` 會遷移舊的擴充功能式瀏覽器設定，並檢查預設自動連線設定檔是否已在本機安裝 Chrome，但它無法替你啟用瀏覽器端遠端除錯

代理使用方式：

- 需要使用者已登入的瀏覽器狀態時，使用 `profile="user"`。
- 如果你使用自訂既有工作階段設定檔，請傳入該明確的設定檔名稱。
- 只有在使用者位於電腦前、能核准附加提示時，才選擇此模式。
- 閘道或節點主機可以產生 `npx chrome-devtools-mcp@latest --autoConnect`

注意事項：

- 這條路徑比隔離的 `openclaw` 設定檔風險更高，因為它可以在你已登入的瀏覽器工作階段內操作。
- OpenClaw 不會為此驅動程式啟動瀏覽器；它只會附加。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果已設定 `userDataDir`，它會被傳遞下去以指定該使用者資料目錄。
- 既有工作階段可以在所選主機上附加，或透過已連線的瀏覽器節點附加。如果 Chrome 位於其他位置且沒有連線的瀏覽器節點，請改用遠端 CDP 或節點主機。

### 自訂 Chrome MCP 啟動

當預設的 `npx chrome-devtools-mcp@latest` 流程不符合你的需求（離線主機、釘選版本、隨附二進位檔）時，請依設定檔覆寫產生的 Chrome DevTools MCP 伺服器：

| 欄位         | 功能                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要產生的可執行檔，而不是 `npx`。會依原樣解析；支援絕對路徑。                                                              |
| `mcpArgs`    | 逐字傳給 `mcpCommand` 的引數陣列。會取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。 |

當既有工作階段設定檔設定了 `cdpUrl` 時，OpenClaw 會略過 `--autoConnect`，並自動將端點轉發給 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標和 `userDataDir` 不能合併使用：當設定 `cdpUrl` 時，Chrome MCP 啟動會忽略 `userDataDir`，因為 Chrome MCP 會附加到端點後方正在執行的瀏覽器，而不是開啟設定檔目錄。

<Accordion title="既有工作階段功能限制">

與受管理的 `openclaw` 設定檔相比，既有工作階段驅動程式限制更多：

- **螢幕截圖** - 頁面擷取和 `--ref` 元素擷取可運作；CSS `--element` 選擇器不可用。`--full-page` 不能與 `--ref` 或 `--element` 合併使用。頁面或 ref 型元素螢幕截圖不需要 Playwright。
- **動作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 refs（沒有 CSS 選擇器）。`click-coords` 會點擊可見視口座標，且不需要快照 ref。`click` 僅限左鍵。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支援逐次呼叫逾時。`select` 接受單一值。
- **等待 / 上傳 / 對話框** - `wait --url` 支援精確、子字串和 glob 模式；既有工作階段設定檔不支援 `wait --load networkidle`（它可在受管理與原始/遠端 CDP 設定檔上運作）。上傳 hook 需要 `ref` 或 `inputRef`，一次一個檔案，沒有 CSS `element`。對話框 hook 不支援逾時覆寫或 `dialogId`。
- **對話框可見性** - 當動作開啟模態對話框時，受管理瀏覽器動作回應會包含 `blockedByDialog` 和 `browserState.dialogs.pending`；快照也會包含待處理對話框狀態。對話框待處理時，使用 `browser dialog --accept/--dismiss --dialog-id <id>` 回應。在 OpenClaw 外部處理的對話框會出現在 `browserState.dialogs.recent` 下。
- **僅受管理功能** - 批次動作、PDF 匯出、下載攔截和 `responsebody` 仍需要受管理瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不觸碰你的個人瀏覽器設定檔。
- **專用連接埠**：避免使用 `9222`，以防與開發工作流程衝突。
- **確定性分頁控制**：`tabs` 會先傳回 `suggestedTargetId`，再傳回穩定的 `tabId` 控制代碼，例如 `t1`、選用標籤，以及原始 `targetId`。代理應重用 `suggestedTargetId`；原始 ID 仍可用於除錯與相容性。

## 瀏覽器選擇

本機啟動時，OpenClaw 會選擇第一個可用項目：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆寫。

平台：

- macOS：檢查 `/Applications` 和 `~/Applications`。
- Linux：檢查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下常見的 Chrome/Brave/Edge/Chromium 位置，以及 `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下由 Playwright 管理的 Chromium。
- Windows：檢查常見安裝位置。

## 控制 API（選用）

為了指令碼與除錯，閘道會公開一個小型的**僅限 local loopback HTTP 控制 API**，以及相符的 `openclaw browser` 命令列介面（快照、refs、等待強化功能、JSON 輸出、除錯工作流程）。完整參考請參閱[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

針對 Linux 特定問題（尤其是 snap Chromium），請參閱
[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

針對 WSL2 閘道 + Windows Chrome 分離主機設定，請參閱
[WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 封鎖

這些是不同的失敗類別，並且指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面是否健康。
- **導覽 SSRF 封鎖**表示瀏覽器控制平面健康，但頁面導覽目標被政策拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`，當設定了
    local loopback 外部 CDP 服務但未設定 `attachOnly: true` 時
- 導覽 SSRF 封鎖：
  - `open`、`navigate`、快照或開啟分頁流程在 `start` 和 `tabs` 仍可運作時，因瀏覽器/網路政策錯誤而失敗

使用這個最小序列來區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何判讀結果：

- 如果 `start` 因 `not reachable after start` 而失敗，請先疑難排解 CDP 就緒狀態。
- 如果 `start` 成功但 `tabs` 失敗，控制平面仍不健康。請將這視為 CDP 可達性問題，而不是頁面導覽問題。
- 如果 `start` 和 `tabs` 成功但 `open` 或 `navigate` 失敗，瀏覽器控制平面已啟動，失敗原因在導覽政策或目標頁面。
- 如果 `start`、`tabs` 和 `open` 全都成功，基本的受管理瀏覽器控制路徑是健康的。

重要行為細節：

- 即使你未設定 `browser.ssrfPolicy`，瀏覽器設定也會預設為故障關閉的 SSRF 政策物件。
- 對於 local loopback `openclaw` 受管理設定檔，CDP 健康檢查會刻意略過 OpenClaw 自己本機控制平面的瀏覽器 SSRF 可達性強制檢查。
- 導覽保護是分開的。`start` 或 `tabs` 成功，不代表之後的 `open` 或 `navigate` 目標會被允許。

安全性指引：

- 預設情況下**不要**放寬瀏覽器 SSRF 政策。
- 優先使用窄範圍主機例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是寬鬆的私人網路存取。
- 只有在刻意信任、需要並已審查私人網路瀏覽器存取的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## Agent 工具 + 控制方式

Agent 會取得**一個工具**用於瀏覽器自動化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹（AI 或 ARIA）。
- `browser act` 會使用快照 `ref` ID 來點擊/輸入/拖曳/選取。
- `browser screenshot` 會擷取像素（完整頁面、元素或加上標籤的 refs）。
- `browser doctor` 會檢查閘道、外掛、設定檔、瀏覽器和分頁就緒狀態。
- `browser` 接受：
  - `profile` 用於選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target` (`sandbox` | `host` | `node`) 用於選擇瀏覽器所在位置。
  - 在沙箱化工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱化工作階段預設為 `sandbox`，非沙箱工作階段預設為 `host`。
  - 如果已連線具備瀏覽器能力的節點，該工具可能會自動路由至該節點，除非你固定使用 `target="host"` 或 `target="node"`。

這能讓 Agent 保持確定性，並避免脆弱的選取器。

## 相關

- [工具總覽](/zh-TW/tools) - 所有可用的 Agent 工具
- [沙箱化](/zh-TW/gateway/sandboxing) - 沙箱化環境中的瀏覽器控制
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制風險與強化
