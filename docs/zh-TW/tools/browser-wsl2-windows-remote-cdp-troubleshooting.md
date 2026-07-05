---
read_when:
    - 在 WSL2 中執行 OpenClaw 閘道，而 Chrome 位於 Windows 上
    - 看到 WSL2 和 Windows 上重疊的瀏覽器/控制介面錯誤
    - 在分離主機設定中，於主機本機 Chrome MCP 與原始遠端 CDP 之間做選擇
summary: 分層疑難排解 WSL2 閘道 + Windows Chrome 遠端 CDP
title: WSL2 + Windows + 遠端 Chrome CDP 疑難排解
x-i18n:
    generated_at: "2026-07-05T11:44:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a2cd455663add52b53d2b880db884b3d798afac63e8a943d28550726cf0ea7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常見的分離主機設定中，OpenClaw 閘道在 WSL2 內執行，Chrome 在
Windows 上執行，而瀏覽器控制必須跨越 WSL2/Windows 邊界。幾個
彼此獨立的問題可能同時浮現（請參閱
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP
傳輸、控制介面來源安全性，以及權杖/配對都可能各自失敗，卻產生
看起來相似的錯誤。請依序處理下列各層，而不是猜測哪一層壞了。

## 先選擇正確的瀏覽器模式

### 選項 1：從 WSL2 到 Windows 的原始遠端 CDP

使用從 WSL2 指向 Windows Chrome CDP 端點的遠端瀏覽器設定檔。
當閘道留在 WSL2 內、Chrome 在 Windows 上執行，且瀏覽器控制需要
跨越 WSL2/Windows 邊界時，請選擇此方式。

### 選項 2：主機本機 Chrome MCP

只有在閘道與 Chrome 執行於同一台主機上、你想使用本機已登入的
瀏覽器狀態、不需要跨主機瀏覽器傳輸，且不需要 `responsebody`、
PDF 匯出、下載攔截或批次動作時，才使用 `existing-session` 驅動程式
（`user` 設定檔）（Chrome MCP 設定檔不支援這些功能）。

對於 WSL2 閘道 + Windows Chrome，請使用原始遠端 CDP。Chrome MCP 是
主機本機方案，不是 WSL2 到 Windows 的橋接器。

## 可運作的架構

- WSL2 在 `127.0.0.1:18789` 上執行閘道
- Windows 在一般瀏覽器中開啟 `http://127.0.0.1:18789/` 的控制介面
- Windows Chrome 在連接埠 `9222` 暴露 CDP 端點
- WSL2 可以連到該 Windows CDP 端點
- OpenClaw 將瀏覽器設定檔指向可從 WSL2 存取的位址

## 控制介面的關鍵規則

當 UI 從 Windows 開啟時，除非你有刻意設定 HTTPS，否則請使用 Windows localhost：

```text
http://127.0.0.1:18789/
```

不要預設使用 LAN IP。在 LAN 或 tailnet 位址上使用純 HTTP，可能會
觸發與 CDP 本身無關的不安全來源/裝置驗證行為。請參閱
[控制介面](/zh-TW/web/control-ui)。

## 分層驗證

請由上到下處理；不要跳過前面的層。修好某一層後，仍可能留下
更下層的另一個錯誤。

### 第 1 層：確認 Chrome 正在 Windows 上提供 CDP

```powershell
chrome.exe --remote-debugging-port=9222
```

先從 Windows 確認 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果這在 Windows 上失敗，OpenClaw 還不是問題所在。

### 第 2 層：確認 WSL2 可以連到該 Windows 端點

從 WSL2 測試你計畫在 `cdpUrl` 中使用的確切位址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好結果：

- `/json/version` 傳回包含 Browser / Protocol-Version 中繼資料的 JSON
- `/json/list` 傳回 JSON（如果沒有開啟頁面，空陣列也可以）

如果這失敗，代表 Windows 尚未將連接埠暴露給 WSL2、該位址對 WSL2 端
來說不正確，或缺少防火牆/連接埠轉送/代理設定。請先修好這一點，
再碰 OpenClaw 設定。

### 第 3 層：設定正確的瀏覽器設定檔

將 OpenClaw 指向可從 WSL2 存取的位址：

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

- 使用 WSL2 可存取的位址，不要使用只在 Windows 上有效的位址
- 對外部管理的瀏覽器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 當你希望 OpenClaw 探查 `/json/version` 時，請使用 HTTP(S)
- 只有在瀏覽器提供者給你直接的 DevTools
  socket URL 時，才使用 WS(S)
- 在期待 OpenClaw 成功前，先用 `curl` 測試相同 URL

### 第 4 層：分開驗證控制介面層

從 Windows 開啟 `http://127.0.0.1:18789/`，然後確認：

- 頁面來源符合 `gateway.controlUi.allowedOrigins` 的預期
- 權杖驗證或配對已正確設定
- 你沒有把控制介面驗證問題當成瀏覽器問題在除錯

實用頁面：[控制介面](/zh-TW/web/control-ui)。

### 第 5 層：驗證端到端瀏覽器控制

從 WSL2：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好結果：

- 分頁會在 Windows Chrome 中開啟
- `browser tabs` 會傳回目標
- 後續動作（`snapshot`、`screenshot`、`navigate`）可從相同
  設定檔運作

## 常見的誤導性錯誤

| 訊息                                                                                 | 含義                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI 來源/安全內容問題，不是 CDP 傳輸問題                                                                                                                     |
| `token_missing`                                                                         | 驗證設定問題                                                                                                                                                        |
| `pairing required`                                                                      | 裝置核准問題                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 無法連到已設定的 `cdpUrl`                                                                                                                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端點有回應，但無法開啟 DevTools WebSocket                                                                                                        |
| 遠端工作階段後出現過期的視窗大小 / 深色模式 / 語言地區 / 離線覆寫          | 執行 `openclaw browser --browser-profile remote stop` 以關閉工作階段，並釋放快取的 Playwright/CDP 連線，而不必重新啟動閘道或外部瀏覽器 |
| `remoteCdpTimeoutMs` 附近逾時（預設 1500ms）                                    | 通常仍是 CDP 可達性問題，或是遠端端點很慢/無法連線                                                                                                             |
| `No Chrome tabs found for profile="user"`                                               | 選到了本機 Chrome MCP 設定檔，但沒有可用的主機本機分頁                                                                                                          |

## 快速分診清單

1. Windows：`curl http://127.0.0.1:9222/json/version` 是否可運作？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可運作？
3. OpenClaw 設定：`browser.profiles.<name>.cdpUrl` 是否使用該確切的
   WSL2 可存取位址？
4. 控制介面：你是否開啟 `http://127.0.0.1:18789/`，而不是 LAN IP？
5. 你是否正嘗試跨 WSL2 和 Windows 使用 `existing-session`，
   而不是原始遠端 CDP？

請先在 Windows 本機驗證 Chrome 端點，接著從 WSL2 驗證相同端點，
然後才除錯 OpenClaw 設定或控制介面驗證。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
