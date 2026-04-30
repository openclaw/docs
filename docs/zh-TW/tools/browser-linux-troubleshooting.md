---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修正 Linux 上 OpenClaw 瀏覽器控制的 Chrome/Brave/Edge/Chromium CDP 啟動問題
title: 瀏覽器疑難排解
x-i18n:
    generated_at: "2026-04-30T03:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題：「無法在連接埠 18800 啟動 Chrome CDP」

OpenClaw 的瀏覽器控制伺服器無法啟動 Chrome/Brave/Edge/Chromium，並出現錯誤：

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

在 Ubuntu（以及許多 Linux 發行版）上，預設的 Chromium 安裝是 **snap 套件**。Snap 的 AppArmor 限制會干擾 OpenClaw 產生並監控瀏覽器程序的方式。

`apt install chromium` 指令會安裝一個重新導向到 snap 的 stub 套件：

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

這不是真正的瀏覽器，只是一個包裝器。

其他常見的 Linux 啟動失敗：

- `The profile appears to be in use by another Chromium process` 表示 Chrome
  在受管理的設定檔目錄中找到了過期的 `Singleton*` 鎖定檔。當該鎖定指向已停止或不同主機的程序時，OpenClaw
  會移除這些鎖定並重試一次。
- `Missing X server or $DISPLAY` 表示在沒有桌面工作階段的主機上明確要求使用可見瀏覽器。預設情況下，當 `DISPLAY` 和
  `WAYLAND_DISPLAY` 都未設定時，本機受管理設定檔現在會在 Linux 上退回無頭模式。如果你設定了 `OPENCLAW_BROWSER_HEADLESS=0`、
  `browser.headless: false` 或 `browser.profiles.<name>.headless: false`，
  請移除該有頭模式覆寫、設定 `OPENCLAW_BROWSER_HEADLESS=1`、啟動 `Xvfb`、
  執行 `openclaw browser start --headless` 進行一次性受管理啟動，或在真正的桌面工作階段中執行
  OpenClaw。

### 解決方案 1：安裝 Google Chrome（建議）

安裝官方 Google Chrome `.deb` 套件，該套件不受 snap 沙箱限制：

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

接著更新你的 OpenClaw 設定（`~/.openclaw/openclaw.json`）：

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

如果你必須使用 snap Chromium，請設定 OpenClaw 附加到手動啟動的瀏覽器：

1. 更新設定：

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

2. 手動啟動 Chromium：

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 可選擇建立 systemd 使用者服務來自動啟動 Chrome：

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

使用以下指令啟用：`systemctl --user enable --now openclaw-browser.service`

### 驗證瀏覽器是否可用

檢查狀態：

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

測試瀏覽：

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定參考

| 選項                             | 說明                                                                 | 預設值                                                         |
| -------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `browser.enabled`                | 啟用瀏覽器控制                                                     | `true`                                                         |
| `browser.executablePath`         | Chromium 型瀏覽器二進位檔路徑（Chrome/Brave/Edge/Chromium）         | 自動偵測（偏好基於 Chromium 的預設瀏覽器）                    |
| `browser.headless`               | 不使用 GUI 執行                                                     | `false`                                                        |
| `OPENCLAW_BROWSER_HEADLESS`      | 本機受管理瀏覽器無頭模式的單程序覆寫                               | 未設定                                                         |
| `browser.noSandbox`              | 加入 `--no-sandbox` 旗標（某些 Linux 設定需要）                     | `false`                                                        |
| `browser.attachOnly`             | 不啟動瀏覽器，只附加到既有瀏覽器                                   | `false`                                                        |
| `browser.cdpPort`                | Chrome DevTools Protocol 連接埠                                     | `18800`                                                        |
| `browser.localLaunchTimeoutMs`   | 本機受管理 Chrome 探索逾時                                         | `15000`                                                        |
| `browser.localCdpReadyTimeoutMs` | 本機受管理啟動後 CDP 就緒逾時                                      | `8000`                                                         |

在 Raspberry Pi、較舊的 VPS 主機或慢速儲存裝置上，當 Chrome 需要更多時間公開其 CDP HTTP
端點時，請提高 `browser.localLaunchTimeoutMs`。當啟動成功但
`openclaw browser start` 仍回報 `not reachable after start` 時，請提高 `browser.localCdpReadyTimeoutMs`。值必須是最高到
`120000` ms 的正整數；無效的設定值會被拒絕。

### 問題：「找不到 profile="user" 的 Chrome 分頁」

你正在使用 `existing-session` / Chrome MCP 設定檔。OpenClaw 可以看到本機 Chrome，
但沒有可供附加的已開啟分頁。

修正選項：

1. **使用受管理瀏覽器：** `openclaw browser start --browser-profile openclaw`
   （或設定 `browser.defaultProfile: "openclaw"`）。
2. **使用 Chrome MCP：** 確認本機 Chrome 已執行且至少有一個已開啟分頁，然後使用 `--browser-profile user` 重試。

注意事項：

- `user` 僅限主機使用。對於 Linux 伺服器、容器或遠端主機，建議使用 CDP 設定檔。
- `user` / 其他 `existing-session` 設定檔保留目前的 Chrome MCP 限制：
  以 ref 驅動的動作、單一檔案上傳 hook、沒有對話框逾時覆寫、沒有
  `wait --load networkidle`，且沒有 `responsebody`、PDF 匯出、下載
  攔截或批次動作。
- 本機 `openclaw` 設定檔會自動指派 `cdpPort`/`cdpUrl`；只有遠端 CDP 才需要設定這些值。
- 遠端 CDP 設定檔接受 `http://`、`https://`、`ws://` 和 `wss://`。
  使用 HTTP(S) 進行 `/json/version` 探索，或在你的瀏覽器
  服務提供直接的 DevTools socket URL 時使用 WS(S)。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
