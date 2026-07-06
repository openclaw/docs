---
read_when:
    - 在 WSL2 中執行 OpenClaw 閘道，而 Chrome 位於 Windows 上
    - 在 WSL2 與 Windows 上看到重疊的瀏覽器/控制介面錯誤
    - 在分離主機設定中決定使用主機本機 Chrome MCP 或原始遠端 CDP
summary: 分層疑難排解 WSL2 閘道 + Windows Chrome 遠端 CDP
title: WSL2 + Windows + 遠端 Chrome CDP 疑難排解
x-i18n:
    generated_at: "2026-07-06T10:54:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常見的分離主機設定中，OpenClaw 閘道在 WSL2 內執行，Chrome 在
Windows 上執行，而瀏覽器控制必須跨越 WSL2/Windows 邊界。多個
獨立問題可能同時浮現（請參閱
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP
傳輸、控制介面來源安全性，以及權杖/配對都可能各自失敗，卻產生
看起來相似的錯誤。請依序處理下列各層，而不是猜測哪一層壞了。

## 先選擇正確的瀏覽器模式

### 選項 1：從 WSL2 到 Windows 的原始遠端 CDP

使用從 WSL2 指向 Windows Chrome CDP 端點的遠端瀏覽器設定檔。
當閘道留在 WSL2 內、Chrome 在 Windows 上執行，且瀏覽器控制需要
跨越 WSL2/Windows 邊界時，請選擇此方式。

### 選項 2：主機本機 Chrome MCP

只有在閘道與 Chrome 執行於同一台主機、你想使用本機已登入的瀏覽器狀態、
不需要跨主機瀏覽器傳輸，且不需要 `responsebody`、PDF 匯出、
下載攔截或批次動作時，才使用 `existing-session` 驅動程式
（`user` 設定檔）（Chrome MCP 設定檔不支援這些功能）。

若是 WSL2 閘道 + Windows Chrome，請使用原始遠端 CDP。Chrome MCP 是
主機本機方案，不是 WSL2 到 Windows 的橋接。

## 可運作的架構

- WSL2 在 `127.0.0.1:18789` 上執行閘道
- Windows 在一般瀏覽器中開啟位於 `http://127.0.0.1:18789/` 的控制介面
- Windows Chrome 在連接埠 `9222` 暴露 CDP 端點
- WSL2 可以連到該 Windows CDP 端點
- OpenClaw 將瀏覽器設定檔指向可從 WSL2 連到的位址

## 控制介面的關鍵規則

從 Windows 開啟介面時，除非你有刻意設定 HTTPS，否則請使用 Windows localhost：

```text
http://127.0.0.1:18789/
```

不要預設使用 LAN IP。在 LAN 或 tailnet 位址上使用純 HTTP，可能會
觸發與 CDP 本身無關的不安全來源/裝置驗證行為。請參閱
[控制介面](/zh-TW/web/control-ui)。

## 分層驗證

請由上到下進行；不要跳步。修好其中一層後，仍可能因為更下層的不同錯誤而
看到另一個問題。

### 第 1 層：確認 Chrome 正在 Windows 上提供 CDP

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 及更新版本會忽略預設 Chrome 資料目錄的遠端偵錯命令列開關。
請如上所示使用獨立的非預設資料目錄。請參閱 Chrome 的
[遠端偵錯安全性變更](https://developer.chrome.com/blog/remote-debugging-port)。
這不會讓一般已登入的 Chrome 設定檔變成可遠端控制。

先從 Windows 驗證 Chrome 本身：

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

如果這裡失敗，請診斷下方的 Windows 監聽器。OpenClaw 還不是問題所在。

#### 變更 portproxy 前先診斷 IPv4 和 IPv6

Chromium 會先嘗試將遠端偵錯繫結到 `127.0.0.1`，只有在 IPv4 繫結失敗時
才會退回到 `[::1]`。持續存在且監聽 `127.0.0.1:9222` 的 `v4tov4`
規則，可能會在 Chrome 啟動前佔用該端點。Chrome 接著退回到
`[::1]:9222`，而舊規則會將 IPv4 流量轉送回自己的監聽器並回傳空回覆。

請從 Windows 檢查實際的監聽器和代理規則，而不是從 Chrome 版本推測：

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

針對 `netstat` 中的每個 PID 使用 `tasklist /fi "PID eq <PID>"`。

- 如果 `chrome.exe` 在 `127.0.0.1` 上有回應，請移除任何同樣監聽
  `127.0.0.1:9222` 的 portproxy 規則。只將 WSL2 可連到的 Windows 介面卡
  位址轉送到 `127.0.0.1`。
- 如果 `chrome.exe` 只在 `[::1]` 上有回應，請使用 `v4tov6` 將 WSL2 可連到的監聽器
  指向 `::1`，而不是轉送到未使用的 IPv4 位址：

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

將監聽器繫結到 WSL2 需要的介面卡位址。不要在 `0.0.0.0`、LAN 位址或
tailnet 位址上暴露 CDP 連接埠：CDP 會授予瀏覽器工作階段的控制權。

### 第 2 層：確認 WSL2 可以連到該 Windows 端點

從 WSL2 測試你計畫在 `cdpUrl` 中使用的確切位址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好結果：

- `/json/version` 回傳含有 Browser / Protocol-Version 中繼資料的 JSON
- `/json/list` 回傳 JSON（如果沒有開啟頁面，空陣列也可以）

如果這裡失敗，表示 Windows 尚未將連接埠暴露給 WSL2、位址對 WSL2 端不正確，
或缺少防火牆/連接埠轉送/代理設定。請先修好這些，再碰 OpenClaw 設定。

### 第 3 層：設定正確的瀏覽器設定檔

將 OpenClaw 指向可從 WSL2 連到的位址：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

注意事項：

- 使用 WSL2 可連到的位址，而不是只能在 Windows 上運作的位址
- 對外部管理的瀏覽器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 當你想讓 OpenClaw 探索 `/json/version` 時，請使用 HTTP(S)
- 只有在瀏覽器提供者給你直接的 DevTools
  socket URL 時，才使用 WS(S)
- 在期待 OpenClaw 成功前，先用 `curl` 測試相同 URL

### 第 4 層：獨立驗證控制介面層

從 Windows 開啟 `http://127.0.0.1:18789/`，然後確認：

- 頁面來源符合 `gateway.controlUi.allowedOrigins` 預期
- 權杖驗證或配對已正確設定
- 你不是把控制介面驗證問題當成瀏覽器問題來偵錯

有用頁面：[控制介面](/zh-TW/web/control-ui)。

### 第 5 層：驗證端對端瀏覽器控制

從 WSL2：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好結果：

- 分頁會在 Windows Chrome 中開啟
- `browser tabs` 回傳目標
- 後續動作（`snapshot`、`screenshot`、`navigate`）可從相同設定檔運作

## 常見的誤導性錯誤

| 訊息                                                                                    | 含義                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI 來源/安全情境問題，不是 CDP 傳輸問題                                                                                                                                          |
| `token_missing`                                                                         | 驗證設定問題                                                                                                                                                                     |
| `pairing required`                                                                      | 裝置核准問題                                                                                                                                                                     |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 無法連到已設定的 `cdpUrl`                                                                                                                                                   |
| 空的 CDP 回覆 / 透過 portproxy 出現 `other side closed`                                 | Windows 監聽器不相符或自我迴圈；檢查兩種 loopback 位址族和 `netsh interface portproxy show all`                                                                                  |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端點有回應，但無法開啟 DevTools WebSocket                                                                                                                                   |
| 遠端工作階段後仍有過時的視窗大小 / 深色模式 / 語言地區 / 離線覆寫                      | 執行 `openclaw browser --browser-profile remote stop` 來關閉工作階段並釋放快取的 Playwright/CDP 連線，而不必重新啟動閘道或外部瀏覽器                                           |
| `remoteCdpTimeoutMs` 附近逾時（預設 1500ms）                                            | 通常仍是 CDP 可達性問題，或遠端端點緩慢/不可達                                                                                                                                  |
| `Playwright page enumeration timed out after 3000ms`                                    | 遠端 CDP 已連線，但其持久分頁讀取停滯；期限為 `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 中較大的值                                                                  |
| `No Chrome tabs found for profile="user"`                                               | 選用了本機 Chrome MCP 設定檔，但沒有可用的主機本機分頁                                                                                                                          |

## 快速分流檢查清單

1. Windows：`127.0.0.1` 或 `[::1]` 哪一個會在 `/json/version` 上回應，
   且該監聽器是否屬於 `chrome.exe`？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可運作？
3. OpenClaw 設定：`browser.profiles.<name>.cdpUrl` 是否使用該確切的
   WSL2 可連到位址？
4. 控制介面：你開啟的是 `http://127.0.0.1:18789/`，而不是 LAN IP 嗎？
5. 你是否嘗試跨 WSL2 和 Windows 使用 `existing-session`，
   而不是原始遠端 CDP？

請先在本機驗證 Windows Chrome 端點，接著從 WSL2 驗證相同端點，
然後才偵錯 OpenClaw 設定或控制介面驗證。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
