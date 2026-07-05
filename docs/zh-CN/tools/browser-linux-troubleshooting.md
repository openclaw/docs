---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修复 Linux 上用于 OpenClaw 浏览器控制的 Chrome/Brave/Edge/Chromium CDP 启动问题
title: 浏览器故障排查
x-i18n:
    generated_at: "2026-07-05T11:45:17Z"
    model: gpt-5.5
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
包装器，而不是真正的浏览器：

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap 的 AppArmor 限制会干扰 OpenClaw 启动和监控
浏览器进程的方式。

其他常见的 Linux 启动失败：

- `The profile appears to be in use by another Chromium process`：托管配置文件目录中存在陈旧的
  `Singleton*` 锁文件。当锁指向已退出或
  不同主机上的进程时，OpenClaw 会移除这些锁并重试一次。
- `Missing X server or $DISPLAY`：在没有桌面会话的主机上显式请求了可见浏览器。Linux 上的本地托管配置文件在
  `DISPLAY` 和 `WAYLAND_DISPLAY` 都未设置时会回退到
  headless 模式。如果你设置了 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false` 或
  `browser.profiles.<name>.headless: false`，请移除该有界面覆盖，设置
  `OPENCLAW_BROWSER_HEADLESS=1`，启动 `Xvfb`，运行
  `openclaw browser start --headless` 进行一次性托管启动，或在真实桌面会话中运行
  OpenClaw。

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

如果你必须保留 snap Chromium，请将 OpenClaw 配置为附加到
手动启动的浏览器，而不是由它启动浏览器：

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

也可以选择用 systemd 用户服务自动启动它：

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

| 选项                             | 描述                                                          | 默认值                                                            |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | 启用浏览器控制                                               | `true`                                                             |
| `browser.executablePath`         | Chromium 系浏览器二进制文件的路径（Chrome/Brave/Edge/Chromium） | 自动检测（当基于 Chromium 时优先使用 OS 默认浏览器） |
| `browser.headless`               | 无 GUI 运行                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | 本地托管浏览器 headless 模式的按进程覆盖         | 未设置                                                              |
| `browser.noSandbox`              | 添加 `--no-sandbox` 标志（某些 Linux 设置需要）               | `false`                                                            |
| `browser.attachOnly`             | 不启动浏览器；仅附加到现有浏览器              | `false`                                                            |
| `browser.cdpPortRangeStart`      | 自动分配配置文件的本地 CDP 端口起始值                   | `18800`（派生自 Gateway 网关端口）                            |
| `browser.localLaunchTimeoutMs`   | 本地托管 Chrome 发现超时，最高 `120000`               | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | 本地托管启动后 CDP 就绪超时，最高 `120000`      | `8000`                                                             |

两个超时值都必须是最高 `120000` ms 的正整数；其他值
会在配置加载时被拒绝。在 Raspberry Pi、较旧的 VPS 主机或慢速
存储上，当 Chrome 需要更多时间暴露其 CDP HTTP 端点时，请提高
`browser.localLaunchTimeoutMs`。当启动成功但
`openclaw browser start` 仍报告 `not reachable
after start` 时，请提高 `browser.localCdpReadyTimeoutMs`。

### 问题：未找到 profile="user" 的 Chrome 标签页

你正在使用 `user`（`existing-session` / Chrome MCP）配置文件，且没有
可附加的已打开标签页。

修复选项：

1. 改用托管浏览器：
   `openclaw browser --browser-profile openclaw start`（或设置
   `browser.defaultProfile: "openclaw"`）。
2. 保持本地 Chrome 运行并至少打开一个标签页，然后使用
   `--browser-profile user` 重试。

说明：

- `user` 仅限主机。在 Linux 服务器、容器或远程主机上，优先使用
  CDP 配置文件。
- `user` 和其他 `existing-session` 配置文件共享当前 Chrome MCP
  限制：仅支持 ref 驱动的操作、每次上传一个文件、无对话框 `timeoutMs`
  覆盖、不支持 `wait --load networkidle`，也不支持 `responsebody`、PDF 导出、
  下载拦截或批量操作。
- 本地 `openclaw` 驱动配置文件会自动分配 `cdpPort`/`cdpUrl`；仅为
  远程 CDP 手动设置这些值。
- 远程 CDP 配置文件接受 `http://`、`https://`、`ws://` 和 `wss://`。
  使用 HTTP(S) 进行 `/json/version` 发现，或者当你的浏览器
  服务提供直接 DevTools socket URL 时使用 WS(S)。

## 相关

- [Browser](/zh-CN/tools/browser)
- [Browser login](/zh-CN/tools/browser-login)
- [Browser WSL2 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
