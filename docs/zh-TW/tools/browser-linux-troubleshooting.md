---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修正 Linux 上 OpenClaw 瀏覽器控制的 Chrome/Brave/Edge/Chromium CDP 啟動問題
title: 瀏覽器疑難排解
x-i18n:
    generated_at: "2026-07-11T21:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題：無法在連接埠 18800 啟動 Chrome CDP

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 根本原因

在 Ubuntu 和大多數 Linux 發行版上，`apt install chromium` 安裝的是 Snap
包裝程式，而不是真正的瀏覽器：

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap 的 AppArmor 限制會干擾 OpenClaw 啟動及監控瀏覽器程序的方式。

其他常見的 Linux 啟動失敗情況：

- `The profile appears to be in use by another Chromium process`：受管理設定檔目錄中有過時的
  `Singleton*` 鎖定檔案。當鎖定指向已終止或位於不同主機上的程序時，OpenClaw 會移除
  這些鎖定並重試一次。
- `Missing X server or $DISPLAY`：在沒有桌面工作階段的主機上，明確要求使用可見的瀏覽器。
  在 Linux 上，如果 `DISPLAY` 和 `WAYLAND_DISPLAY` 都未設定，本機受管理設定檔會改用
  無介面模式。如果你設定了 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false` 或
  `browser.profiles.<name>.headless: false`，請移除該有介面模式覆寫、設定
  `OPENCLAW_BROWSER_HEADLESS=1`、啟動 `Xvfb`、執行
  `openclaw browser start --headless` 進行一次性的受管理啟動，或在真正的桌面工作階段中執行
  OpenClaw。

### 解決方案 1：安裝 Google Chrome（建議）

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 如果發生相依性錯誤
```

更新 `~/.openclaw/openclaw.json`：

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 解決方案 2：以僅附加模式使用 Snap Chromium

如果必須保留 Snap Chromium，請將 OpenClaw 設定為附加至手動啟動的瀏覽器，而不是自行啟動：

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

手動啟動 Chromium：

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

也可以選擇透過 systemd 使用者服務自動啟動：

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### 驗證瀏覽器是否正常運作

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定參考

| 選項                             | 說明                                                                  | 預設值                                                               |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `browser.enabled`                | 啟用瀏覽器控制                                                        | `true`                                                               |
| `browser.executablePath`         | Chromium 核心瀏覽器執行檔的路徑（Chrome/Brave/Edge/Chromium）         | 自動偵測（如果作業系統預設瀏覽器以 Chromium 為基礎，則優先使用該瀏覽器） |
| `browser.headless`               | 在沒有圖形介面的情況下執行                                            | `false`                                                              |
| `OPENCLAW_BROWSER_HEADLESS`      | 針對本機受管理瀏覽器無介面模式的個別程序覆寫                          | 未設定                                                               |
| `browser.noSandbox`              | 新增 `--no-sandbox` 旗標（某些 Linux 設定需要）                        | `false`                                                              |
| `browser.attachOnly`             | 不啟動瀏覽器；僅附加至現有瀏覽器                                      | `false`                                                              |
| `browser.cdpPortRangeStart`      | 自動指派設定檔的起始本機 CDP 連接埠                                   | `18800`（衍生自閘道連接埠）                                          |
| `browser.localLaunchTimeoutMs`   | 本機受管理 Chrome 的探索逾時，上限為 `120000`                          | `15000`                                                              |
| `browser.localCdpReadyTimeoutMs` | 本機受管理 Chrome 啟動後的 CDP 就緒逾時，上限為 `120000`               | `8000`                                                               |

兩個逾時值都必須是最大不超過 `120000` 毫秒的正整數；其他值會在載入設定時遭到拒絕。
在 Raspberry Pi、較舊的 VPS 主機或速度較慢的儲存裝置上，如果 Chrome 需要更多時間才能公開其
CDP HTTP 端點，請提高 `browser.localLaunchTimeoutMs`。如果啟動成功，但
`openclaw browser start` 仍回報 `not reachable after start`，請提高
`browser.localCdpReadyTimeoutMs`。

### 問題：找不到 profile="user" 的 Chrome 分頁

你正在使用 `user`（`existing-session` / Chrome MCP）設定檔，但沒有可供附加的已開啟分頁。

修正方式：

1. 改用受管理瀏覽器：
   `openclaw browser --browser-profile openclaw start`（或設定
   `browser.defaultProfile: "openclaw"`）。
2. 保持本機 Chrome 執行且至少開啟一個分頁，然後使用
   `--browser-profile user` 重試。

注意事項：

- `user` 僅適用於主機。在 Linux 伺服器、容器或遠端主機上，請改用
  CDP 設定檔。
- `user` 和其他 `existing-session` 設定檔共用目前的 Chrome MCP
  限制：僅支援以參照為基礎的操作、每次上傳一個檔案、不支援對話方塊 `timeoutMs`
  覆寫、不支援 `wait --load networkidle`，也不支援 `responsebody`、PDF 匯出、
  下載攔截或批次操作。
- 本機 `openclaw` 驅動程式設定檔會自動指派 `cdpPort`/`cdpUrl`；只有遠端 CDP
  才需要手動設定這些值。
- 遠端 CDP 設定檔接受 `http://`、`https://`、`ws://` 和 `wss://`。
  使用 HTTP(S) 進行 `/json/version` 探索；如果瀏覽器服務提供直接的 DevTools
  通訊端 URL，則使用 WS(S)。

## 相關內容

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
