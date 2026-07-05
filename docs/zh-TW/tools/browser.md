---
read_when:
    - 新增由代理控制的瀏覽器自動化
    - 偵錯 OpenClaw 為何干擾你自己的 Chrome
    - 在 macOS App 中實作瀏覽器設定與生命週期
summary: 整合式瀏覽器控制服務 + 動作命令
title: 瀏覽器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-05T11:44:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee559960dc0a07855c46d339b25786d7e58cfbd91a3e150853642d9cc9c99137
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以執行一個由代理程式控制的**專用 Chrome/Brave/Edge/Chromium 設定檔**。它會透過閘道內的小型本機控制服務執行（僅限 loopback），並與你的個人瀏覽器隔離。

- 可將它視為一個**獨立、僅供代理程式使用的瀏覽器**。`openclaw` 設定檔絕不會碰觸你的個人瀏覽器設定檔。
- 代理程式會在這個隔離通道中開啟分頁、讀取頁面、點擊和輸入。
- 內建的 `user` 設定檔則會透過 Chrome DevTools MCP 附加到你真正已登入的 Chrome 工作階段。

## 你會得到什麼

- 名為 **openclaw** 的獨立瀏覽器設定檔（預設為橘色強調色）。
- 確定性的分頁控制（列出/開啟/聚焦/關閉）。
- 代理程式動作（點擊/輸入/拖曳/選取）、快照、截圖、PDF。
- 隨附的 `browser-automation` 技能，會在瀏覽器
  外掛啟用時，教導代理程式快照、穩定分頁、過期參照和
  手動阻擋復原迴圈。
- 選用的多設定檔支援（`openclaw`、`work`、`remote`、...）。

這個瀏覽器**不是**你的日常主力瀏覽器。它是用於
代理程式自動化與驗證的安全隔離介面。

## 快速開始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「瀏覽器已停用」表示外掛或 `browser.enabled` 已關閉；請參閱
[設定](#configuration)和[外掛控制](#plugin-control)。

如果 `openclaw browser` 完全不存在，或代理程式表示瀏覽器工具
不可用，請跳至[缺少瀏覽器命令或工具](#missing-browser-command-or-tool)。

## 外掛控制

預設的 `browser` 工具是隨附外掛。停用它即可改用另一個註冊相同 `browser` 工具名稱的外掛：

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

預設值需要同時設定 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。只停用外掛會將 `openclaw browser` 命令列介面、`browser.request` 閘道方法、代理程式工具和控制服務作為一個整體移除；你的 `browser.*` 設定會保留，供替代方案使用。

瀏覽器設定變更需要重新啟動閘道，外掛才能重新註冊其服務。

## 代理程式指引

工具設定檔注意事項：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。若要讓代理程式或
產生的子代理程式使用瀏覽器自動化，請在設定檔
階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

對於單一代理程式，請使用 `agents.list[].tools.alsoAllow: ["browser"]`。
僅設定 `tools.subagents.tools.allow: ["browser"]` 並不足夠，因為子代理程式
政策會在設定檔篩選之後才套用。

瀏覽器外掛提供兩層代理程式指引：

- `browser` 工具描述會帶有精簡的常駐合約：選擇
  正確設定檔、讓參照留在同一個分頁、使用 `tabId`/標籤進行分頁
  目標指定，並在多步驟工作中載入瀏覽器技能。
- 隨附的 `browser-automation` 技能帶有較長的操作迴圈：
  先檢查狀態/分頁、標記任務分頁、動作前擷取快照、UI 變更後重新擷取快照、
  對過期參照復原一次，並將登入/2FA/captcha 或
  相機/麥克風阻擋回報為需要手動動作，而不是猜測。

外掛隨附技能會在外掛啟用時列在代理程式可用技能中。
完整技能指令會依需求載入，因此例行
回合不會支付完整 token 成本。

## 缺少瀏覽器命令或工具

如果升級後 `openclaw browser` 不明、缺少 `browser.request`，或代理程式回報瀏覽器工具不可用，通常原因是 `plugins.allow` 清單省略了 `browser`，且不存在根層級 `browser` 設定區塊。加入它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊（`browser` 下的任何鍵，例如
`browser.enabled=true` 或 `browser.profiles.<name>`）會啟用隨附的
瀏覽器外掛，即使在限制性的 `plugins.allow` 下也一樣，這與隨附
頻道設定行為一致。`plugins.entries.browser.enabled=true` 和
`tools.alsoAllow: ["browser"]` 本身無法取代允許清單成員資格。
完全移除 `plugins.allow` 也會恢復預設值。

## 設定檔：`openclaw` 與 `user`

- `openclaw`：受管理、隔離的瀏覽器（不需要擴充功能）。
- `user`：內建 Chrome DevTools MCP 附加設定檔，用於你的**真正
  已登入 Chrome** 工作階段。

對於代理程式瀏覽器工具呼叫：

- 預設：使用隔離的 `openclaw` 瀏覽器。
- 當既有登入工作階段很重要，且使用者在電腦前可點擊/核准任何附加提示時，偏好使用 `profile="user"`。
- 當你想要特定瀏覽器模式時，`profile` 是明確覆寫。

如果你希望預設使用受管理模式，請設定 `browser.defaultProfile: "openclaw"`。

## 設定

瀏覽器設定位於 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false disables act:evaluate (arbitrary JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
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
    // snapshotDefaults: { mode: "efficient" }, // default snapshot mode when the caller omits one
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

`browser.snapshotDefaults.mode: "efficient"` 會在呼叫端未傳入明確的 `snapshotFormat` 或
`mode` 時，變更預設的 `snapshot`
擷取模式；請參閱[瀏覽器控制 API](/zh-TW/tools/browser-control)以了解每次呼叫的
快照選項。

### 截圖視覺（純文字模型支援）

當主模型是純文字（不支援視覺/多模態）時，瀏覽器
截圖會傳回模型無法讀取的圖片區塊。瀏覽器截圖
會重用既有圖片理解設定，因此設定用於媒體理解的圖片模型
可以在沒有任何瀏覽器專用模型設定的情況下，將截圖描述為文字。

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

1. 代理程式呼叫 `browser screenshot`，圖片會照常擷取到磁碟。
2. 瀏覽器工具會詢問既有圖片理解執行階段，是否
   能使用已設定的媒體圖片模型、共享媒體
   模型、圖片模型預設值，或有驗證支援的圖片提供者來描述截圖。
3. 視覺模型會傳回文字描述，該描述會以
   `wrapExternalContent`（提示注入防護）包裝，並傳回給代理程式，
   作為文字區塊而不是圖片區塊。
4. 如果圖片理解不可用、被略過或失敗，瀏覽器會
   回退為傳回原始圖片區塊。

使用既有的 `tools.media.image` / `tools.media.models` 欄位來設定模型
備援、逾時、位元組限制、設定檔和提供者請求設定。

如果作用中的主模型已支援視覺，且未設定明確的圖片
理解模型，OpenClaw 會保留一般圖片結果，讓
主模型可以直接讀取截圖。

<AccordionGroup>

<Accordion title="連接埠與可達性">

- 控制服務會繫結到 loopback，連接埠衍生自 `gateway.port`（預設 `18791` = 閘道 + 2）。`OPENCLAW_GATEWAY_PORT` 的優先順序高於 `gateway.port`；任一設定都會移動同一族群中的衍生連接埠。
- 本機 `openclaw` 設定檔會從控制連接埠上方 9 個連接埠開始的範圍自動指派 `cdpPort`/`cdpUrl`（預設 `18800`-`18899`）；只有在
  遠端 CDP 設定檔或既有工作階段端點附加時才設定這些值。未設定時，`cdpUrl` 預設為
  受管理的本機 CDP 連接埠。
- `remoteCdpTimeoutMs` 適用於遠端和 `attachOnly` CDP HTTP 可達性
  檢查及分頁開啟 HTTP 請求；`remoteCdpHandshakeTimeoutMs` 適用於
  它們的 CDP WebSocket 交握。
- `localLaunchTimeoutMs` 是本機啟動的受管理 Chrome
  程序公開其 CDP HTTP 端點的時間預算。`localCdpReadyTimeoutMs` 是
  程序被發現後，CDP websocket 就緒的後續時間預算。
  在 Raspberry Pi、低階 VPS 或 Chromium
  啟動較慢的舊硬體上提高這些值。值必須是最高 `120000` ms 的正整數；無效的
  設定值會被拒絕。
- 重複的受管理 Chrome 啟動/就緒失敗會依
  設定檔觸發熔斷。連續失敗數次後，OpenClaw 會短暫暫停新的啟動
  嘗試，而不是在每次瀏覽器工具呼叫時產生 Chromium。修正
  啟動問題、在不需要時停用瀏覽器，或在修復後重新啟動
  閘道。
- `actionTimeoutMs` 是呼叫端未傳入 `timeoutMs` 時，瀏覽器 `act` 請求的預設時間預算。用戶端傳輸會加入一小段寬限視窗，讓長時間等待可以完成，而不是在 HTTP 邊界逾時。
- `tabCleanup` 是針對主要代理程式瀏覽器工作階段所開分頁的盡力清理。子代理程式、排程和 ACP 生命週期清理仍會在工作階段結束時關閉其明確追蹤的分頁；主要工作階段會讓作用中分頁保持可重用，然後在背景關閉閒置或超量的已追蹤分頁。

</Accordion>

<Accordion title="SSRF 政策">

- 瀏覽器導覽與開啟分頁會在導覽前受到 SSRF 防護，並在之後以最佳努力方式針對最終的 `http(s)` URL 重新檢查。
- 在嚴格 SSRF 模式中，也會檢查遠端 CDP 端點探索與 `/json/version` 探測（`cdpUrl`）。
- 閘道/提供者的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 環境變數不會自動代理 OpenClaw 管理的瀏覽器。受管理的 Chrome 預設直接啟動，因此提供者代理設定不會削弱瀏覽器 SSRF 檢查。
- OpenClaw 管理的本機 CDP 就緒探測與 DevTools WebSocket 連線，會針對精確啟動的 loopback 端點繞過受管理的網路代理，因此當操作員代理封鎖 loopback 輸出時，`openclaw browser start` 仍可運作。
- 若要代理受管理的瀏覽器本身，請透過 `browser.extraArgs` 傳入明確的 Chrome 代理旗標，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。嚴格 SSRF 模式會封鎖明確的瀏覽器代理路由，除非有意啟用私有網路瀏覽器存取。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 預設關閉；只有在有意信任私有網路瀏覽器存取時才啟用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` 表示絕不啟動本機瀏覽器；只有在已有瀏覽器執行時才附加。
- `headless` 可全域設定，或針對每個本機受管理設定檔設定。個別設定檔的值會覆寫 `browser.headless`，因此一個本機啟動的設定檔可以保持無頭模式，而另一個仍維持可見。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 會針對本機受管理設定檔要求一次性的無頭啟動，而不重寫
  `browser.headless` 或設定檔組態。既有工作階段、僅附加，以及
  遠端 CDP 設定檔會拒絕此覆寫，因為 OpenClaw 不會啟動那些
  瀏覽器行程。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，當環境和設定檔/全域
  組態都未明確選擇有頭模式時，本機受管理設定檔
  會自動預設為無頭。`openclaw browser status --json`
  會將 `headlessSource` 回報為 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 會強制目前行程的本機受管理啟動採用無頭模式。
  `OPENCLAW_BROWSER_HEADLESS=0` 會強制一般啟動採用有頭模式，
  並在沒有顯示伺服器的 Linux 主機上傳回可操作的錯誤；
  明確的 `start --headless` 要求仍會在該次啟動中優先。
- `executablePath` 可全域設定，或針對每個本機受管理設定檔設定。個別設定檔的值會覆寫 `browser.executablePath`，因此不同的受管理設定檔可以啟動不同的 Chromium 系瀏覽器。兩種形式都接受 `~` 作為你的作業系統家目錄。
- `color`（頂層與個別設定檔）會為瀏覽器 UI 著色，讓你看出目前作用中的設定檔。
- 預設設定檔是 `openclaw`（受管理的獨立執行個體）。使用 `defaultProfile: "user"` 可選擇使用已登入的使用者瀏覽器。
- 自動偵測順序：若系統預設瀏覽器是 Chromium 系，則使用它；否則依序使用 Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` 會使用 Chrome DevTools MCP，而不是原始 CDP。它可以透過 Chrome MCP 自動連線附加，或在你已有執行中瀏覽器的 DevTools 端點時透過 `cdpUrl` 附加。
- 當既有工作階段設定檔應附加至非預設的 Chromium 使用者設定檔（Brave、Edge 等）時，請設定 `browser.profiles.<name>.userDataDir`。此路徑也接受 `~` 作為你的作業系統家目錄。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系瀏覽器

如果你的**系統預設**瀏覽器是 Chromium 系（Chrome/Brave/Edge 等），
OpenClaw 會自動使用它。設定 `browser.executablePath` 可覆寫
自動偵測。頂層與個別設定檔的 `executablePath` 值都接受 `~`
作為你的作業系統家目錄：

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

個別設定檔的 `executablePath` 只會影響 OpenClaw
啟動的本機受管理設定檔。`existing-session` 設定檔會改為附加至
已在執行的瀏覽器，而遠端 CDP 設定檔則使用 `cdpUrl` 後方的瀏覽器。

## 本機與遠端控制

- **本機控制（預設）：**閘道會啟動 loopback 控制服務，並可啟動本機瀏覽器。
- **遠端控制（節點主機）：**在有瀏覽器的機器上執行節點主機；閘道會將瀏覽器動作代理到該主機。
- **遠端 CDP：**設定 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加至遠端 Chromium 系瀏覽器。在此情況下，OpenClaw 不會啟動本機瀏覽器。
- 對於 loopback 上由外部管理的 CDP 服務（例如 Docker 中發布到
  `127.0.0.1` 的 Browserless），也請設定 `attachOnly: true`。沒有
  `attachOnly` 的 loopback CDP 會被視為本機 OpenClaw 管理的瀏覽器設定檔。
- `headless` 只會影響 OpenClaw 啟動的本機受管理設定檔。它不會重新啟動或變更既有工作階段或遠端 CDP 瀏覽器。
- `executablePath` 遵循相同的本機受管理設定檔規則。若在
  執行中的本機受管理設定檔上變更它，會將該設定檔標記為需要重新啟動/協調，
  讓下一次啟動使用新的二進位檔。

停止行為會依設定檔模式而不同：

- 本機受管理設定檔：`openclaw browser stop` 會停止
  OpenClaw 啟動的瀏覽器行程
- 僅附加與遠端 CDP 設定檔：`openclaw browser stop` 會關閉作用中的
  控制工作階段，並釋放 Playwright/CDP 模擬覆寫（視窗大小、
  色彩配置、地區設定、時區、離線模式與類似狀態），即使
  沒有瀏覽器行程是由 OpenClaw 啟動

遠端 CDP URL 可以包含驗證資訊：

- 查詢權杖（例如 `https://provider.example?token=<token>`）
- HTTP Basic 驗證（例如 `https://user:pass@provider.example`）

OpenClaw 會在呼叫 `/json/*` 端點與連線到
CDP WebSocket 時保留驗證資訊。權杖建議使用環境變數或祕密管理器，
不要提交到組態檔。

## 節點瀏覽器代理（零組態預設）

如果你在有瀏覽器的機器上執行**節點主機**，OpenClaw 可以
自動將瀏覽器工具呼叫路由到該節點，而不需要任何額外瀏覽器組態。
這是遠端閘道的預設路徑。

注意事項：

- 節點主機會透過**代理命令**公開其本機瀏覽器控制伺服器。
- 設定檔來自節點自己的 `browser.profiles` 組態（與本機相同）。
- 無論 `allowProfiles` 為何，代理命令絕不允許持久性設定檔變更（`create-profile`、`delete-profile`、`reset-profile`）；請直接在節點上進行那些變更。
- `nodeHost.browserProxy.allowProfiles` 是選用的。留空可使用舊版/預設行為：所有已設定的設定檔都仍可透過代理存取。
- 如果你設定 `nodeHost.browserProxy.allowProfiles`，OpenClaw 會將它視為最小權限邊界，用來限制代理可鎖定的設定檔名稱。
- 如果你不想使用它，請停用：
  - 在節點上：`nodeHost.browserProxy.enabled=false`
  - 在閘道上：`gateway.nodes.browser.mode="off"`（也接受 `"auto"` 以選擇單一已連線的瀏覽器節點，或 `"manual"` 以要求明確的節點參數）

## Browserless（託管的遠端 CDP）

[Browserless](https://browserless.io) 是一項託管的 Chromium 服務，會透過 HTTPS 與 WebSocket 公開
CDP 連線 URL。OpenClaw 可使用任一形式，但
對遠端瀏覽器設定檔而言，最簡單的選項是 Browserless 連線文件中的直接 WebSocket URL。

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
- 如果 Browserless 提供 HTTPS 基底 URL，你可以將它轉換為
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

`browser.profiles.browserless.cdpUrl` 中的位址必須可從
OpenClaw 行程連線。Browserless 也必須宣告相符且可連線的端點；
將 Browserless `EXTERNAL` 設為同一個對 OpenClaw 可公開連線的 WebSocket 基底，
例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或穩定的私有 Docker
網路位址。如果 `/json/version` 傳回的 `webSocketDebuggerUrl` 指向
OpenClaw 無法連線的位址，CDP HTTP 可能看起來正常，但 WebSocket
附加仍會失敗。

不要讓 loopback Browserless 設定檔未設定 `attachOnly`。沒有
`attachOnly` 時，OpenClaw 會將該 loopback 連接埠視為本機受管理瀏覽器
設定檔，並可能回報該連接埠正在使用中但不屬於 OpenClaw。

## 直接 WebSocket CDP 提供者

某些託管瀏覽器服務會公開**直接 WebSocket** 端點，而不是
標準的 HTTP 型 CDP 探索（`/json/version`）。OpenClaw 接受三種
CDP URL 形態，並會自動選擇正確的連線策略：

- **HTTP(S) 探索** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 會呼叫 `/json/version` 以探索 WebSocket 偵錯器 URL，然後
  連線。沒有 WebSocket 備援。
- **直接 WebSocket 端點** - `ws://host[:port]/devtools/<kind>/<id>` 或
  具有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  路徑的 `wss://...`。OpenClaw 會直接透過 WebSocket 交握連線，並完全略過
  `/json/version`。
- **裸 WebSocket 根路徑** - 沒有
  `/devtools/...` 路徑的 `ws://host[:port]` 或 `wss://host[:port]`
  （例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 會先嘗試 HTTP
  `/json/version` 探索（將配置正規化為 `http`/`https`）；
  如果探索傳回 `webSocketDebuggerUrl`，就會使用它，否則 OpenClaw
  會退回到裸根路徑上的直接 WebSocket 交握。如果宣告的
  WebSocket 端點拒絕 CDP 交握，但已設定的裸根路徑
  接受它，OpenClaw 也會退回使用該根路徑。這讓指向本機 Chrome 的裸 `ws://`
  仍可連線，因為 Chrome 只接受來自 `/json/version` 的特定每目標路徑上的 WebSocket
  升級，而託管提供者在其探索
  端點宣告不適合 Playwright CDP 的短期 URL 時，仍可使用其根 WebSocket 端點。

`openclaw browser doctor` 會使用與執行階段附加相同的先探索、再 WebSocket 備援
邏輯，因此可成功連線的裸根 URL 不會被
診斷回報為無法連線。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一個雲端平台，可用於執行
無頭瀏覽器，並內建 CAPTCHA 解決、隱身模式與住宅
代理。

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

- [註冊](https://www.browserbase.com/sign-up)並從[總覽儀表板](https://www.browserbase.com/overview)複製你的 **API Key**。
- 將 `<BROWSERBASE_API_KEY>` 替換為你真正的 Browserbase API 金鑰。
- Browserbase 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段的步驟。
- 如需目前免費方案限制與付費方案，請參閱[定價](https://www.browserbase.com/pricing)。
- 如需完整 API 參考、SDK 指南與整合範例，請參閱 [Browserbase 文件](https://docs.browserbase.com)。

### Notte

[Notte](https://www.notte.cc) 是一個雲端平台，可執行具備內建隱匿、住宅代理與 CDP 原生 WebSocket 閘道的無頭瀏覽器。

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
- Notte 會在 WebSocket 連線時自動建立瀏覽器工作階段，因此不需要手動建立工作階段的步驟。工作階段會在 WebSocket 中斷連線時銷毀。
- 如需目前免費方案限制與付費方案，請參閱[定價](https://www.notte.cc/#pricing)。
- 如需完整 API 參考、SDK 指南與整合範例，請參閱 [Notte 文件](https://docs.notte.cc)。

## 安全性

核心概念：

- 瀏覽器控制僅限 local loopback；存取會透過閘道的驗證或節點配對流程。
- 獨立的 loopback 瀏覽器 HTTP API **僅使用共享密鑰驗證**：閘道 token bearer 驗證、`x-openclaw-password`，或使用已設定閘道密碼的 HTTP Basic 驗證。
- Tailscale Serve 身分標頭與 `gateway.auth.mode: "trusted-proxy"` **不會**驗證這個獨立的 loopback 瀏覽器 API。
- 如果已啟用瀏覽器控制且未設定共享密鑰驗證，OpenClaw 會在啟動時自動產生並保存瀏覽器控制憑證：當 `gateway.auth.mode` 為 `none` 時產生 token，或當其為 `trusted-proxy` 時產生密碼（透過 `gateway.auth.password` 保存，讓程序外的 loopback 用戶端可以解析它）。當該模式已明確設定字串憑證，或 `gateway.auth.mode` 為 `password` 時，會略過自動產生。
- 如果你想使用由你控制的穩定密鑰，而不是產生的密鑰，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。

遠端 CDP 提示：

- 盡可能優先使用加密端點（HTTPS 或 WSS）與短期 token。
- 避免將長期 token 直接嵌入設定檔。
- 將閘道與任何節點主機保留在私有網路（Tailscale）上；避免公開暴露。
- 將遠端 CDP URL/token 視為密鑰；優先使用環境變數或密鑰管理器。

## 設定檔（多瀏覽器）

OpenClaw 支援多個具名設定檔（路由設定）。設定檔可以是：

- **由 OpenClaw 管理**：專用的 Chromium 型瀏覽器執行個體，具備自己的使用者資料目錄 + CDP 連接埠
- **遠端**：明確的 CDP URL（在其他位置執行的 Chromium 型瀏覽器）
- **現有工作階段**：透過 Chrome DevTools MCP 自動連線使用你現有的 Chrome 設定檔

預設值：

- 如果缺少 `openclaw` 設定檔，會自動建立。
- `user` 設定檔是內建的，用於 Chrome MCP 現有工作階段附加。
- 除了 `user` 之外，現有工作階段設定檔採取選擇加入；請使用 `--driver existing-session` 建立。
- 本機 CDP 連接埠預設會從 **18800-18899** 分配。
- 刪除設定檔會將其本機資料目錄移至垃圾桶。

所有控制端點都接受 `?profile=<name>`；命令列介面使用 `--browser-profile`。

## 透過 Chrome DevTools MCP 使用現有工作階段

OpenClaw 也可以透過官方 Chrome DevTools MCP 伺服器附加到執行中的 Chromium 型瀏覽器設定檔。這會重複使用該瀏覽器設定檔中已開啟的分頁與登入狀態。

官方背景與設定參考：

- [Chrome for Developers：Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

內建設定檔：`user`。如果你想要不同的名稱、顏色或瀏覽器資料目錄，請建立自己的自訂現有工作階段設定檔。

預設情況下，內建的 `user` 設定檔使用 Chrome MCP 自動連線，其目標是預設的本機 Google Chrome 設定檔。對於 Brave、Edge、Chromium 或非預設 Chrome 設定檔，請使用 `userDataDir`。`~` 會展開為你的作業系統家目錄：

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

然後在相符的瀏覽器中：

1. 開啟該瀏覽器的遠端偵錯 inspect 頁面。
2. 啟用遠端偵錯。
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
- `snapshot` 從選取的即時分頁傳回 refs

如果附加無法運作，請檢查：

- 目標 Chromium 型瀏覽器版本為 `144+`
- 已在該瀏覽器的 inspect 頁面啟用遠端偵錯
- 瀏覽器已顯示附加同意提示，且你已接受
- 如果 Chrome 是以明確的 `--remote-debugging-port` 啟動，請將 `browser.profiles.<name>.cdpUrl` 設為該 DevTools 端點，而不是依賴 Chrome MCP 自動連線
- `openclaw doctor` 會遷移舊的擴充功能型瀏覽器設定，並檢查本機是否已安裝 Chrome 以供預設自動連線設定檔使用，但它無法替你啟用瀏覽器端的遠端偵錯

代理使用：

- 需要使用者已登入的瀏覽器狀態時，請使用 `profile="user"`。
- 如果你使用自訂現有工作階段設定檔，請傳入該明確的設定檔名稱。
- 只有當使用者在電腦前可以核准附加提示時，才選擇此模式。
- 閘道或節點主機可以產生 `npx chrome-devtools-mcp@latest --autoConnect`。

注意事項：

- 此路徑的風險高於隔離的 `openclaw` 設定檔，因為它可以在你已登入的瀏覽器工作階段內操作。
- OpenClaw 不會為此驅動程式啟動瀏覽器；它只會附加。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果已設定 `userDataDir`，它會被傳遞以指向該使用者資料目錄。
- 現有工作階段可以在選取的主機上附加，或透過已連線的瀏覽器節點附加。如果 Chrome 位於其他位置且沒有連線的瀏覽器節點，請改用遠端 CDP 或節點主機。

### 自訂 Chrome MCP 啟動

當預設的 `npx chrome-devtools-mcp@latest` 流程不是你想要的情況（離線主機、釘選版本、供應商封裝的二進位檔）時，請依設定檔覆寫產生的 Chrome DevTools MCP 伺服器：

| 欄位         | 作用                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要產生的可執行檔，而不是 `npx`。會依原樣解析；支援絕對路徑。                                          |
| `mcpArgs`    | 逐字傳遞給 `mcpCommand` 的引數陣列。取代預設的 `chrome-devtools-mcp@latest --autoConnect` 引數。 |

當在現有工作階段設定檔上設定 `cdpUrl` 時，OpenClaw 會略過 `--autoConnect` 並自動將端點轉送給 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 探索端點）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端點旗標與 `userDataDir` 不能合併使用：當已設定 `cdpUrl` 時，Chrome MCP 啟動會忽略 `userDataDir`，因為 Chrome MCP 會附加到端點後方正在執行的瀏覽器，而不是開啟設定檔目錄。

<Accordion title="現有工作階段功能限制">

與受管理的 `openclaw` 設定檔相比，現有工作階段驅動程式受到更多限制：

- **螢幕截圖** - 頁面擷取與 `--ref` 元素擷取可運作；CSS `--element` 選擇器不支援。頁面或以 ref 為基礎的元素螢幕截圖不需要 Playwright。（在任何設定檔上，`--full-page` 都不能與 `--ref` 或 `--element` 合併使用，不只限於現有工作階段。）
- **動作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不能使用 CSS 選擇器）。`click-coords` 會點擊可見視埠座標，且不需要 snapshot ref。`click` 僅限左鍵（不支援按鈕覆寫或修飾鍵）。`type` 不支援 `slowly=true`；請使用 `fill` 或 `press`。`press` 不支援 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支援逐次呼叫的 `timeoutMs` 覆寫。`select` 接受單一值。`batch` 不支援；請個別傳送動作。
- **等待 / 上傳 / 對話方塊** - `wait --url` 支援精確、子字串與 glob 模式（與受管理相同）；`wait --load networkidle` 不支援現有工作階段設定檔（可在受管理與原始/遠端 CDP 設定檔上運作）。上傳 hook 需要 `ref` 或 `inputRef`，一次一個檔案，不支援 CSS `element`。對話方塊 hook 不支援逾時覆寫或 `dialogId`。
- **對話方塊可見性** - 當動作開啟模態對話方塊時，受管理瀏覽器動作回應會包含 `blockedByDialog` 和 `browserState.dialogs.pending`；snapshot 也會包含待處理對話方塊狀態。當對話方塊待處理時，使用 `browser dialog --accept/--dismiss --dialog-id <id>` 回應。在 OpenClaw 外處理的對話方塊會顯示在 `browserState.dialogs.recent` 底下。
- **僅限受管理的功能** - PDF 匯出、下載攔截和 `responsebody` 仍需要受管理瀏覽器路徑。

</Accordion>

## 隔離保證

- **專用使用者資料目錄**：絕不觸碰你的個人瀏覽器設定檔。
- **專用連接埠**：避免使用 `9222`，以防與開發工作流程發生衝突。
- **確定性分頁控制**：`tabs` 會先傳回 `suggestedTargetId`，接著是穩定的 `tabId` 控制代碼，例如 `t1`、選用標籤，以及原始 `targetId`。代理應重複使用 `suggestedTargetId`；原始 ID 仍可用於偵錯與相容性。

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
- Linux：檢查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 底下常見的 Chrome/Brave/Edge/Chromium 位置，以及 `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 底下由 Playwright 管理的 Chromium。
- Windows：檢查常見安裝位置。

## 控制 API（選用）

對於指令碼撰寫與偵錯，閘道提供一個小型的**僅限 loopback 的 HTTP
控制 API**，以及對應的 `openclaw browser` 命令列介面（快照、refs、等待
power-ups、JSON 輸出、偵錯工作流程）。完整參考請參閱
[瀏覽器控制 API](/zh-TW/tools/browser-control)。

## 疑難排解

Linux 特定問題（尤其是 snap Chromium）請參閱
[瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)。

WSL2 閘道 + Windows Chrome 分離主機設定，請參閱
[WSL2 + Windows + 遠端 Chrome CDP 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 啟動失敗與導覽 SSRF 阻擋

這些是不同的失敗類別，並且指向不同的程式碼路徑。

- **CDP 啟動或就緒失敗**表示 OpenClaw 無法確認瀏覽器控制平面健康。
- **導覽 SSRF 阻擋**表示瀏覽器控制平面健康，但頁面導覽目標被政策拒絕。

常見範例：

- CDP 啟動或就緒失敗：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 當設定 loopback 外部 CDP 服務但未使用 `attachOnly: true` 時，出現
    `Port <port> is in use for profile "<name>" but not by openclaw`
- 導覽 SSRF 阻擋：
  - `open`、`navigate`、快照或開啟分頁流程因瀏覽器/網路政策錯誤而失敗，但 `start` 和 `tabs` 仍可運作

使用這個最小序列來區分兩者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解讀結果：

- 如果 `start` 因 `not reachable after start` 失敗，請先疑難排解 CDP 就緒狀態。
- 如果 `start` 成功但 `tabs` 失敗，控制平面仍不健康。請將此視為 CDP 可達性問題，而不是頁面導覽問題。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面已啟動，失敗點在導覽政策或目標頁面。
- 如果 `start`、`tabs` 和 `open` 全部成功，基本的受管理瀏覽器控制路徑是健康的。

重要行為細節：

- 即使你未設定 `browser.ssrfPolicy`，瀏覽器設定也預設為失敗即關閉的 SSRF 政策物件。
- 對於 local loopback `openclaw` 受管理設定檔，CDP 健康檢查會刻意略過 OpenClaw 自身本機控制平面的瀏覽器 SSRF 可達性強制執行。
- 導覽保護是分開的。成功的 `start` 或 `tabs` 結果不代表後續的 `open` 或 `navigate` 目標會被允許。

安全指引：

- 預設**不要**放寬瀏覽器 SSRF 政策。
- 優先使用精確的主機例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是廣泛的私人網路存取。
- 只有在刻意信任、需要並已審查私人網路瀏覽器存取的環境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 代理工具 + 控制運作方式

代理會取得**一個工具**用於瀏覽器自動化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

對應方式：

- `browser snapshot` 會傳回穩定的 UI 樹（AI 或 ARIA）。
- `browser act` 會使用快照 `ref` ID 來點擊/輸入/拖曳/選取。
- `browser screenshot` 會擷取像素（整頁、元素或已標記的 refs）。
- `browser doctor` 會檢查閘道、外掛、設定檔、瀏覽器與分頁就緒狀態。
- `browser` 接受：
  - `profile` 用於選擇具名瀏覽器設定檔（openclaw、chrome 或遠端 CDP）。
  - `target` (`sandbox` | `host` | `node`) 用於選擇瀏覽器所在位置。
  - 在沙盒化工作階段中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙盒化工作階段預設為 `sandbox`，非沙盒工作階段預設為 `host`。
  - 如果已連線具備瀏覽器能力的節點，除非你固定 `target="host"` 或 `target="node"`，否則工具可能會自動路由到該節點。

這能讓代理保持決定性，並避免脆弱的選擇器。

## 相關

- [工具總覽](/zh-TW/tools) - 所有可用的代理工具
- [沙盒化](/zh-TW/gateway/sandboxing) - 沙盒化環境中的瀏覽器控制
- [安全性](/zh-TW/gateway/security) - 瀏覽器控制風險與強化
