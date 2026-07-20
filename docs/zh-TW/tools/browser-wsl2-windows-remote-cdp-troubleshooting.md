---
read_when:
    - 在 WSL2 中執行 OpenClaw 閘道，而 Chrome 位於 Windows 上
    - 在 WSL2 與 Windows 上發現重疊的瀏覽器／控制介面錯誤
    - 在分離主機設定中，選擇主機本機 Chrome MCP 或原始遠端 CDP
summary: 分層疑難排解 WSL2 閘道與 Windows Chrome 遠端 CDP
title: WSL2 + Windows + 遠端 Chrome CDP 疑難排解
x-i18n:
    generated_at: "2026-07-20T00:55:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 66ec4ed5bfccc66b594a43d56296c69242e8b9cf50b36c6cb3990b1d6ea58faa
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常見的分離主機設定中，OpenClaw 閘道在 WSL2 內執行，Chrome 在
Windows 上執行，而瀏覽器控制必須跨越 WSL2/Windows 邊界。數個
互相獨立的問題可能同時出現（請參閱
[問題 #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP
傳輸、控制介面來源安全性，以及權杖／配對都可能各自失敗，
同時產生外觀相似的錯誤。請依序逐層排查下列項目，
不要猜測是哪一項發生故障。

## 先選擇正確的瀏覽器模式

### 選項 1：從 WSL2 到 Windows 的原始遠端 CDP

使用從 WSL2 指向 Windows Chrome CDP
端點的遠端瀏覽器設定檔。當閘道留在 WSL2 內、Chrome 在
Windows 上執行，且瀏覽器控制需要跨越 WSL2/Windows 邊界時，請選擇此模式。

### 選項 2：主機本機 Chrome MCP

僅當閘道與 Chrome 在同一部主機上執行、你想使用本機已登入的瀏覽器狀態、
不需要跨主機瀏覽器傳輸，且不需要 `responsebody`、
PDF 匯出、下載攔截或批次操作時，才使用 `existing-session` 驅動程式
（`user` 設定檔；Chrome MCP 設定檔不支援這些功能）。

若是 WSL2 閘道 + Windows Chrome，請使用原始遠端 CDP。Chrome MCP
僅供主機本機使用，不是 WSL2 到 Windows 的橋接器。

## 運作架構

- WSL2 在 `127.0.0.1:18789` 上執行閘道
- Windows 在一般瀏覽器中開啟 `http://127.0.0.1:18789/` 的控制介面
- Windows Chrome 在連接埠 `9222` 上公開 CDP 端點
- WSL2 可以連線到該 Windows CDP 端點
- OpenClaw 將瀏覽器設定檔指向可從 WSL2 連線的位址

## 控制介面的關鍵規則

從 Windows 開啟介面時，除非你刻意設定了 HTTPS，
否則請使用 Windows localhost：

```text
http://127.0.0.1:18789/
```

不要預設使用區域網路 IP。透過區域網路或 tailnet 位址使用純 HTTP，
可能觸發與 CDP 本身無關的不安全來源／裝置驗證行為。請參閱
[控制介面](/zh-TW/web/control-ui)。

## 分層驗證

請由上而下進行，不要跳過前面的步驟。即使修正其中一層，
較下層的其他錯誤仍可能繼續顯示。

### 第 1 層：確認 Chrome 正在 Windows 上提供 CDP

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 及更新版本會忽略預設 Chrome 資料目錄的遠端偵錯命令列開關。
請依照上方範例使用獨立的非預設資料目錄。請參閱 Chrome 的
[遠端偵錯安全性變更](https://developer.chrome.com/blog/remote-debugging-port)。
這不會讓一般已登入的 Chrome 設定檔可受遠端控制。

先從 Windows 確認 Chrome 本身：

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

如果失敗，請診斷下方的 Windows 接聽程式。此時問題尚不在
OpenClaw。

#### 先診斷 IPv4 和 IPv6，再變更 portproxy

Chromium 會先嘗試將遠端偵錯繫結至 `127.0.0.1`，只有在
IPv4 繫結失敗時才會改用 `[::1]`。持續存在且接聽
`127.0.0.1:9222` 的 `v4tov4` 規則，可能會在 Chrome 啟動前占用該端點。Chrome 隨後
會改用 `[::1]:9222`，而舊規則會將 IPv4 流量轉送回
自身的接聽程式，並傳回空白回覆。

請從 Windows 檢查實際的接聽程式與 Proxy 規則，
不要根據 Chrome 版本推斷：

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

針對 `netstat` 中的每個 PID 使用 `tasklist /fi "PID eq <PID>"`。

- 如果 `chrome.exe` 在 `127.0.0.1` 上有回應，請移除任何也
  接聽 `127.0.0.1:9222` 的 portproxy 規則。僅將 WSL2 可連線的 Windows 網路介面
  位址轉送至 `127.0.0.1`。
- 如果 `chrome.exe` 僅在 `[::1]` 上有回應，請使用
  `v4tov6`，讓 WSL2 可連線的接聽程式指向 `::1`，而不是轉送至未使用的 IPv4 位址：

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

請將接聽程式繫結至 WSL2 所需的網路介面位址。不要在
`0.0.0.0`、區域網路位址或 tailnet 位址上公開 CDP
連接埠：CDP 會授予瀏覽器工作階段的控制權。

### 第 2 層：確認 WSL2 可以連線至該 Windows 端點

從 WSL2 測試你計畫在 `cdpUrl` 中使用的確切位址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好結果：

- `/json/version` 傳回包含 Browser / Protocol-Version 中繼資料的 JSON
- `/json/list` 傳回 JSON（若沒有開啟任何頁面，空陣列也沒問題）

如果失敗，表示 Windows 尚未向 WSL2 公開該連接埠、該位址不適用於
WSL2 端，或缺少防火牆／連接埠轉送／Proxy 設定。請先修正此問題，
再修改 OpenClaw 設定。

### 第 3 層：設定正確的瀏覽器設定檔

讓 OpenClaw 指向可從 WSL2 連線的位址：

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

- 使用 WSL2 可連線的位址，而非僅可在 Windows 上運作的位址
- 對於由外部管理的瀏覽器，請保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 當你希望 OpenClaw 探索 `/json/version` 時，請使用 HTTP(S)
- 僅當瀏覽器提供者提供直接 DevTools
  通訊端 URL 時，才使用 WS(S)
- 在預期 OpenClaw 能成功前，先使用 `curl` 測試相同的 URL

### 第 4 層：分別驗證控制介面層

從 Windows 開啟 `http://127.0.0.1:18789/`，接著確認：

- 頁面來源符合 `gateway.controlUi.allowedOrigins` 的預期
- 權杖驗證或配對已正確設定
- 你沒有將控制介面驗證問題誤當成瀏覽器
  問題進行偵錯

實用頁面：[控制介面](/zh-TW/web/control-ui)。

### 第 5 層：驗證端對端瀏覽器控制

從 WSL2 執行：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好結果：

- 分頁在 Windows Chrome 中開啟
- `browser tabs` 傳回目標
- 後續操作（`snapshot`、`screenshot`、`navigate`）可透過相同
  設定檔運作

## 常見的誤導性錯誤

| 訊息                                                                                    | 意義                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | 介面來源／安全內容問題，並非 CDP 傳輸問題                                                                                                                                        |
| `token_missing`                                                                         | 驗證設定問題                                                                                                                                                                      |
| `pairing required`                                                                      | 裝置核准問題                                                                                                                                                                      |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 無法連線至設定的 `cdpUrl`                                                                                                                                         |
| 空白 CDP 回覆／透過 portproxy 出現 `other side closed`                                  | Windows 接聽程式不符或發生自我迴圈；請檢查兩種回送位址系列與 `netsh interface portproxy show all`                                                               |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端點已有回應，但無法開啟 DevTools WebSocket                                                                                                                                |
| 遠端工作階段結束後仍有過時的檢視區／深色模式／地區設定／離線覆寫                       | 執行 `openclaw browser --browser-profile remote stop` 以關閉工作階段並釋放快取的 Playwright/CDP 連線，而不必重新啟動閘道或外部瀏覽器 |
| CDP 連線能力檢查期間逾時                                                                | 通常仍是 CDP 連線能力問題，或遠端端點緩慢／無法連線                                                                                                                              |
| `Playwright page enumeration timed out after 3000ms`                                    | 遠端 CDP 已連線，但持續分頁讀取停滯                                                                                                                                               |
| `No Chrome tabs found for profile="user"`                                               | 在沒有可用主機本機分頁的位置選用了本機 Chrome MCP 設定檔                                                                                                                         |

## 快速分流檢查清單

1. Windows：`127.0.0.1` 或 `[::1]` 中，哪一個會在 `/json/version` 上回應？該接聽程式
   是否屬於 `chrome.exe`？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否正常運作？
3. OpenClaw 設定：`browser.profiles.<name>.cdpUrl` 是否使用該確切的
   WSL2 可連線位址？
4. 控制介面：你是否開啟 `http://127.0.0.1:18789/`，而不是區域網路 IP？
5. 你是否嘗試跨 WSL2 與 Windows 使用 `existing-session`，
   而非原始遠端 CDP？

請先在 Windows 本機驗證 Windows Chrome 端點，再從 WSL2
驗證相同端點，然後才偵錯 OpenClaw 設定或控制介面驗證。

## 相關內容

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
