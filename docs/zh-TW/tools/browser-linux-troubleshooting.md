---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修正 Linux 上 OpenClaw 瀏覽器控制的 Chrome/Brave/Edge/Chromium CDP 啟動問題
title: 瀏覽器疑難排解
x-i18n:
    generated_at: "2026-07-05T11:44:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 問題：無法在連接埠 18800 上啟動 Chrome CDP

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 根本原因

在 Ubuntu 和多數 Linux 發行版上，`apt install chromium` 安裝的是 snap
包裝器，而不是真正的瀏覽器：

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap 的 AppArmor 限制會干擾 OpenClaw 產生並監控
瀏覽器程序的方式。

其他常見的 Linux 啟動失敗：

- `The profile appears to be in use by another Chromium process`：受管設定檔目錄中有過期的
  `Singleton*` 鎖定檔。當鎖定指向已結束或不同主機的程序時，OpenClaw 會移除
  這些鎖定並重試一次。
- `Missing X server or $DISPLAY`：在沒有桌面工作階段的主機上明確要求了可見瀏覽器。
  在 Linux 上，當 `DISPLAY` 和 `WAYLAND_DISPLAY` 都未設定時，本機受管設定檔會退回
  無頭模式。如果你設定了 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false`，或
  `browser.profiles.<name>.headless: false`，請移除該有頭覆寫、設定
  `OPENCLAW_BROWSER_HEADLESS=1`、啟動 `Xvfb`、執行
  `openclaw browser start --headless` 進行一次性受管啟動，或在真正的桌面工作階段中執行
  OpenClaw。

### 解決方案 1：安裝 Google Chrome（建議）

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
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

### 解決方案 2：以僅附加模式使用 snap Chromium

如果你必須保留 snap Chromium，請設定 OpenClaw 附加到
手動啟動的瀏覽器，而不是由 OpenClaw 啟動它：

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

也可以選擇使用 systemd 使用者服務自動啟動它：

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

### 驗證瀏覽器可正常運作

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 設定參考

| 選項                             | 說明                                                                 | 預設值                                                             |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | 啟用瀏覽器控制                                                       | `true`                                                             |
| `browser.executablePath`         | Chromium 系瀏覽器二進位檔路徑（Chrome/Brave/Edge/Chromium）          | 自動偵測（若作業系統預設瀏覽器為 Chromium 系，則優先使用）        |
| `browser.headless`               | 不使用 GUI 執行                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | 本機受管瀏覽器無頭模式的單一程序覆寫                                | 未設定                                                             |
| `browser.noSandbox`              | 加入 `--no-sandbox` 旗標（某些 Linux 設定需要）                      | `false`                                                            |
| `browser.attachOnly`             | 不啟動瀏覽器；只附加到現有瀏覽器                                    | `false`                                                            |
| `browser.cdpPortRangeStart`      | 自動指派設定檔的起始本機 CDP 連接埠                                 | `18800`（由閘道連接埠衍生）                                       |
| `browser.localLaunchTimeoutMs`   | 本機受管 Chrome 探索逾時，最高 `120000`                              | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | 本機受管啟動後 CDP 就緒逾時，最高 `120000`                           | `8000`                                                             |

兩個逾時值都必須是最高 `120000` 毫秒的正整數；其他值會在載入設定時被拒絕。
在 Raspberry Pi、較舊的 VPS 主機，或速度較慢的儲存裝置上，當 Chrome 需要更多時間
公開其 CDP HTTP 端點時，請提高 `browser.localLaunchTimeoutMs`。當啟動成功但
`openclaw browser start` 仍回報 `not reachable after start` 時，請提高
`browser.localCdpReadyTimeoutMs`。

### 問題：找不到 profile="user" 的 Chrome 分頁

你正在使用 `user`（`existing-session` / Chrome MCP）設定檔，且沒有可附加的
已開啟分頁。

修復選項：

1. 改用受管瀏覽器：
   `openclaw browser --browser-profile openclaw start`（或設定
   `browser.defaultProfile: "openclaw"`）。
2. 保持本機 Chrome 執行並至少開啟一個分頁，然後使用
   `--browser-profile user` 重試。

注意事項：

- `user` 僅限主機使用。在 Linux 伺服器、容器或遠端主機上，請優先使用
  CDP 設定檔。
- `user` 和其他 `existing-session` 設定檔共用目前的 Chrome MCP
  限制：僅限 ref 驅動動作、每次上傳一個檔案、沒有對話框 `timeoutMs`
  覆寫、沒有 `wait --load networkidle`，且沒有 `responsebody`、PDF 匯出、
  下載攔截或批次動作。
- 本機 `openclaw` 驅動程式設定檔會自動指派 `cdpPort`/`cdpUrl`；只有遠端 CDP
  才需要手動設定這些值。
- 遠端 CDP 設定檔接受 `http://`、`https://`、`ws://` 和 `wss://`。
  使用 HTTP(S) 進行 `/json/version` 探索，或在瀏覽器服務提供直接 DevTools
  socket URL 時使用 WS(S)。

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [瀏覽器登入](/zh-TW/tools/browser-login)
- [瀏覽器 WSL2 疑難排解](/zh-TW/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
