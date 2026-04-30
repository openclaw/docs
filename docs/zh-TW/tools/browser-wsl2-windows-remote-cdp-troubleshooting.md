---
read_when:
    - 在 WSL2 中執行 OpenClaw Gateway，而 Chrome 位於 Windows 上
    - 在 WSL2 和 Windows 上看到重疊的瀏覽器/control-ui 錯誤
    - 在分離式主機設定中決定使用主機本機 Chrome MCP 或原始遠端 CDP
summary: 分層疑難排解 WSL2 Gateway + Windows Chrome 遠端 CDP
title: WSL2 + Windows + 遠端 Chrome CDP 疑難排解
x-i18n:
    generated_at: "2026-04-30T03:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常見的分離主機設定中，OpenClaw Gateway 在 WSL2 內執行，Chrome 在 Windows 上執行，而瀏覽器控制必須跨越 WSL2 與 Windows 的邊界。來自 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 的分層故障模式表示多個獨立問題可能同時出現，導致錯誤的層級看起來像是最先故障。

## 先選擇正確的瀏覽器模式

你有兩種有效模式：

### 選項 1：從 WSL2 到 Windows 的原始遠端 CDP

使用從 WSL2 指向 Windows Chrome CDP 端點的遠端瀏覽器設定檔。

在以下情況選擇此模式：

- Gateway 保持在 WSL2 內
- Chrome 在 Windows 上執行
- 你需要瀏覽器控制跨越 WSL2/Windows 邊界

### 選項 2：主機本機 Chrome MCP

只有當 Gateway 本身與 Chrome 在同一台主機上執行時，才使用 `existing-session` / `user`。

在以下情況選擇此模式：

- OpenClaw 和 Chrome 位於同一台機器上
- 你想使用本機已登入的瀏覽器狀態
- 你不需要跨主機瀏覽器傳輸
- 你不需要進階的受控/僅限原始 CDP 路由，例如 `responsebody`、PDF
  匯出、下載攔截或批次動作

對於 WSL2 Gateway + Windows Chrome，優先使用原始遠端 CDP。Chrome MCP 是主機本機模式，不是 WSL2 到 Windows 的橋接。

## 可用架構

參考形狀：

- WSL2 在 `127.0.0.1:18789` 上執行 Gateway
- Windows 在一般瀏覽器中開啟位於 `http://127.0.0.1:18789/` 的控制 UI
- Windows Chrome 在連接埠 `9222` 上公開 CDP 端點
- WSL2 可以連到該 Windows CDP 端點
- OpenClaw 將瀏覽器設定檔指向可從 WSL2 連線的位址

## 為什麼這個設定令人困惑

多種故障可能重疊：

- WSL2 無法連到 Windows CDP 端點
- 控制 UI 是從非安全來源開啟
- `gateway.controlUi.allowedOrigins` 與頁面來源不相符
- 權杖或配對缺失
- 瀏覽器設定檔指向錯誤的位址

因此，即使修好其中一層，仍可能留下另一個可見錯誤。

## 控制 UI 的關鍵規則

從 Windows 開啟 UI 時，除非你有刻意設定 HTTPS，否則請使用 Windows localhost。

使用：

`http://127.0.0.1:18789/`

不要預設對控制 UI 使用 LAN IP。LAN 或 tailnet 位址上的純 HTTP 可能觸發與 CDP 本身無關的不安全來源/裝置驗證行為。請參閱[控制 UI](/zh-TW/web/control-ui)。

## 分層驗證

從上到下處理。不要跳步。

### 第 1 層：確認 Chrome 正在 Windows 上提供 CDP

在 Windows 上啟動已啟用遠端偵錯的 Chrome：

```powershell
chrome.exe --remote-debugging-port=9222
```

先從 Windows 驗證 Chrome 本身：

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

- `/json/version` 回傳含有 Browser / Protocol-Version 中繼資料的 JSON
- `/json/list` 回傳 JSON（如果沒有開啟頁面，空陣列也可以）

如果這失敗：

- Windows 尚未將連接埠公開給 WSL2
- 對 WSL2 端來說位址錯誤
- 防火牆 / 連接埠轉送 / 本機代理仍然缺失

在修改 OpenClaw 設定前，先修好這一點。

### 第 3 層：設定正確的瀏覽器設定檔

對於原始遠端 CDP，將 OpenClaw 指向可從 WSL2 連線的位址：

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

- 使用 WSL2 可連線的位址，而不是只在 Windows 上有效的位址
- 對外部管理的瀏覽器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 當你希望 OpenClaw 探索 `/json/version` 時，使用 HTTP(S)
- 只有當瀏覽器供應者提供直接 DevTools socket URL 時，才使用 WS(S)
- 在期待 OpenClaw 成功前，先用 `curl` 測試相同 URL

### 第 4 層：另外驗證控制 UI 層

從 Windows 開啟 UI：

`http://127.0.0.1:18789/`

接著確認：

- 頁面來源符合 `gateway.controlUi.allowedOrigins` 的預期
- 權杖驗證或配對已正確設定
- 你不是把控制 UI 驗證問題當成瀏覽器問題在偵錯

有用的頁面：

- [控制 UI](/zh-TW/web/control-ui)

### 第 5 層：驗證端到端瀏覽器控制

從 WSL2：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

良好結果：

- 分頁在 Windows Chrome 中開啟
- `openclaw browser tabs` 回傳目標
- 後續動作（`snapshot`、`screenshot`、`navigate`）可從相同設定檔運作

## 常見的誤導性錯誤

將每則訊息視為特定層級的線索：

- `control-ui-insecure-auth`
  - UI 來源 / 安全情境問題，不是 CDP 傳輸問題
- `token_missing`
  - 驗證設定問題
- `pairing required`
  - 裝置核准問題
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 無法連到已設定的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端點有回應，但 DevTools WebSocket 仍無法開啟
- 遠端工作階段後殘留的 viewport / 深色模式 / 地區設定 / 離線覆寫
  - 執行 `openclaw browser stop --browser-profile remote`
  - 這會關閉作用中的控制工作階段，並釋放 Playwright/CDP 模擬狀態，而不會重新啟動 Gateway 或外部瀏覽器
- `gateway timeout after 1500ms`
  - 通常仍是 CDP 可連線性問題，或遠端端點緩慢/無法連線
- `No Chrome tabs found for profile="user"`
  - 選擇了本機 Chrome MCP 設定檔，但沒有可用的主機本機分頁

## 快速分診檢查清單

1. Windows：`curl http://127.0.0.1:9222/json/version` 是否可用？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可用？
3. OpenClaw 設定：`browser.profiles.<name>.cdpUrl` 是否使用該確切的 WSL2 可連線位址？
4. 控制 UI：你是否開啟 `http://127.0.0.1:18789/`，而不是 LAN IP？
5. 你是否試圖跨 WSL2 和 Windows 使用 `existing-session`，而不是原始遠端 CDP？

## 實務重點

這個設定通常可行。困難之處在於瀏覽器傳輸、控制 UI 來源安全性，以及權杖/配對可能各自獨立失敗，但從使用者端看起來很相似。

有疑問時：

- 先在本機驗證 Windows Chrome 端點
- 接著從 WSL2 驗證相同端點
- 然後才偵錯 OpenClaw 設定或控制 UI 驗證

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 Linux 疑難排解](/zh-TW/tools/browser-linux-troubleshooting)
