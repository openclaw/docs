---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修复 Linux 上 OpenClaw 浏览器控制的 Chrome/Brave/Edge/Chromium CDP 启动问题
title: 浏览器故障排查
x-i18n:
    generated_at: "2026-07-11T20:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## 问题：无法在端口 18800 上启动 Chrome CDP

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### 根本原因

在 Ubuntu 和大多数 Linux 发行版上，`apt install chromium` 安装的是 snap
封装程序，而不是真正的浏览器：

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap 的 AppArmor 隔离机制会干扰 OpenClaw 启动和监控
浏览器进程的方式。

其他常见的 Linux 启动故障：

- `The profile appears to be in use by another Chromium process`：托管配置文件目录中存在过期的
  `Singleton*` 锁文件。当锁指向已终止或
  位于其他主机上的进程时，OpenClaw 会移除这些锁并重试一次。
- `Missing X server or $DISPLAY`：在没有桌面会话的主机上明确请求了可见浏览器。
  在 Linux 上，当 `DISPLAY` 和 `WAYLAND_DISPLAY` 均未设置时，本地托管配置文件会回退到
  无头模式。如果你设置了 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false` 或
  `browser.profiles.<name>.headless: false`，请移除该有头模式覆盖设置，设置
  `OPENCLAW_BROWSER_HEADLESS=1`，启动 `Xvfb`，运行
  `openclaw browser start --headless` 进行一次性托管启动，或者在
  真正的桌面会话中运行 OpenClaw。

### 解决方案 1：安装 Google Chrome（推荐）

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

### 解决方案 2：以仅附加模式使用 snap Chromium

如果你必须保留 snap Chromium，请配置 OpenClaw，使其附加到
手动启动的浏览器，而不是自行启动浏览器：

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

手动启动 Chromium：

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

你也可以选择使用 systemd 用户服务自动启动它：

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

### 验证浏览器是否正常工作

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 配置参考

| 选项                             | 描述                                                                 | 默认值                                                               |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | 启用浏览器控制                                                        | `true`                                                             |
| `browser.executablePath`         | 基于 Chromium 的浏览器二进制文件路径（Chrome/Brave/Edge/Chromium）     | 自动检测（如果操作系统默认浏览器基于 Chromium，则优先使用它）          |
| `browser.headless`               | 在没有图形界面的情况下运行                                             | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | 针对本地托管浏览器无头模式的进程级覆盖设置                              | 未设置                                                              |
| `browser.noSandbox`              | 添加 `--no-sandbox` 标志（某些 Linux 环境需要）                         | `false`                                                            |
| `browser.attachOnly`             | 不启动浏览器；仅附加到现有浏览器                                       | `false`                                                            |
| `browser.cdpPortRangeStart`      | 自动分配配置文件时使用的本地 CDP 起始端口                               | `18800`（从 Gateway 网关端口派生）                                  |
| `browser.localLaunchTimeoutMs`   | 本地托管 Chrome 的发现超时时间，最高为 `120000`                         | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | 本地托管浏览器启动后等待 CDP 就绪的超时时间，最高为 `120000`             | `8000`                                                             |

两个超时值都必须是最大不超过 `120000` 毫秒的正整数；其他值
会在加载配置时被拒绝。在 Raspberry Pi、较旧的 VPS 主机或速度较慢的
存储设备上，如果 Chrome 需要更多时间公开其 CDP HTTP 端点，请增大
`browser.localLaunchTimeoutMs`。如果启动成功，但
`openclaw browser start` 仍然报告 `not reachable
after start`，请增大 `browser.localCdpReadyTimeoutMs`。

### 问题：找不到 profile="user" 的 Chrome 标签页

你正在使用 `user`（`existing-session` / Chrome MCP）配置文件，但没有
可供附加的已打开标签页。

修复方法：

1. 改用托管浏览器：
   `openclaw browser --browser-profile openclaw start`（或者设置
   `browser.defaultProfile: "openclaw"`）。
2. 保持本地 Chrome 运行并至少打开一个标签页，然后使用
   `--browser-profile user` 重试。

注意：

- `user` 仅限主机使用。在 Linux 服务器、容器或远程主机上，应优先使用
  CDP 配置文件。
- `user` 和其他 `existing-session` 配置文件受当前 Chrome MCP
  限制约束：仅支持基于引用的操作；每次上传一个文件；不支持对话框 `timeoutMs`
  覆盖；不支持 `wait --load networkidle`；也不支持 `responsebody`、PDF 导出、
  下载拦截或批量操作。
- 本地 `openclaw` 驱动程序配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在使用
  远程 CDP 时手动设置这些值。
- 远程 CDP 配置文件接受 `http://`、`https://`、`ws://` 和 `wss://`。
  使用 HTTP(S) 进行 `/json/version` 发现；如果浏览器服务提供直接的
  DevTools 套接字 URL，则使用 WS(S)。

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [浏览器登录](/zh-CN/tools/browser-login)
- [浏览器 WSL2 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
