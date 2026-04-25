---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修复 Linux 上 OpenClaw 浏览器控制中 Chrome / Brave / Edge / Chromium 的 CDP 启动问题
title: 浏览器故障排除
x-i18n:
    generated_at: "2026-04-25T05:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b972e9f611962b60c76088487a8db628bc1cbf8447f73f75d33606f177c701a
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## 问题：“在端口 18800 上启动 Chrome CDP 失败”

OpenClaw 的浏览器控制服务器在启动 Chrome / Brave / Edge / Chromium 时失败，并报出如下错误：

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

在 Ubuntu（以及许多 Linux 发行版）上，默认的 Chromium 安装是 **snap 包**。Snap 的 AppArmor 限制会干扰 OpenClaw 启动和监控浏览器进程的方式。

`apt install chromium` 命令安装的是一个会重定向到 snap 的存根包：

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

这**不是**真正的浏览器——它只是一个包装器。

其他常见的 Linux 启动失败：

- `The profile appears to be in use by another Chromium process` 表示 Chrome 在托管配置文件目录中发现了陈旧的 `Singleton*` 锁文件。当锁指向已退出的进程或不同主机上的进程时，OpenClaw 会移除这些锁并重试一次。
- `Missing X server or $DISPLAY` 表示 OpenClaw 正在尝试在没有桌面会话的主机上启动一个可见浏览器。请使用 `browser.headless: true`、启动 `Xvfb`，或在真实桌面会话中运行 OpenClaw。

### 解决方案 1：安装 Google Chrome（推荐）

安装官方 Google Chrome `.deb` 包，它不会受到 snap 的沙箱限制：

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

然后更新你的 OpenClaw 配置（`~/.openclaw/openclaw.json`）：

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

### 解决方案 2：以仅附加模式使用 Snap Chromium

如果你必须使用 snap Chromium，请将 OpenClaw 配置为附加到一个手动启动的浏览器：

1. 更新配置：

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

2. 手动启动 Chromium：

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 可选：创建一个 systemd 用户服务以自动启动 Chrome：

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

启用方式：`systemctl --user enable --now openclaw-browser.service`

### 验证浏览器是否正常工作

检查状态：

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

测试浏览：

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 配置参考

| 选项 | 描述 | 默认值 |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | 启用浏览器控制 | `true` |
| `browser.executablePath` | 基于 Chromium 的浏览器二进制路径（Chrome / Brave / Edge / Chromium） | 自动检测（优先选择默认浏览器，如果它基于 Chromium） |
| `browser.headless` | 无 GUI 运行 | `false` |
| `browser.noSandbox` | 添加 `--no-sandbox` 标志（某些 Linux 设置需要） | `false` |
| `browser.attachOnly` | 不启动浏览器，只附加到现有浏览器 | `false` |
| `browser.cdpPort` | Chrome DevTools Protocol 端口 | `18800` |

### 问题：“未找到 profile=\"user\" 的 Chrome 标签页”

你正在使用 `existing-session` / Chrome MCP profile。OpenClaw 可以看到本地 Chrome，
但没有可供附加的打开标签页。

修复选项：

1. **使用托管浏览器：** `openclaw browser start --browser-profile openclaw`
   （或设置 `browser.defaultProfile: "openclaw"`）。
2. **使用 Chrome MCP：** 确保本地 Chrome 正在运行且至少打开了一个标签页，然后使用 `--browser-profile user` 重试。

说明：

- `user` 仅限主机本地。对于 Linux 服务器、容器或远程主机，请优先使用 CDP profiles。
- `user` / 其他 `existing-session` profiles 保留当前的 Chrome MCP 限制：
  基于 ref 的操作、单文件上传钩子、不支持对话框超时覆盖、不支持
  `wait --load networkidle`，也不支持 `responsebody`、PDF 导出、下载拦截
  或批量操作。
- 本地 `openclaw` profiles 会自动分配 `cdpPort` / `cdpUrl`；仅在远程 CDP 场景中才设置这些值。
- 远程 CDP profiles 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  对 `/json/version` 发现请使用 HTTP(S)，或者当你的浏览器
  服务提供直接的 DevTools socket URL 时使用 WS(S)。

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [Browser 登录](/zh-CN/tools/browser-login)
- [Browser WSL2 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
