---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: 修复 Linux 上 OpenClaw 浏览器控制中 Chrome/Brave/Edge/Chromium 的 CDP 启动问题
title: 浏览器故障排除
x-i18n:
    generated_at: "2026-04-05T10:10:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# 浏览器故障排除（Linux）

## 问题：“Failed to start Chrome CDP on port 18800”

OpenClaw 的浏览器控制服务器在启动 Chrome/Brave/Edge/Chromium 时失败，并显示以下错误：

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

在 Ubuntu（以及许多 Linux 发行版）上，默认的 Chromium 安装是 **snap 软件包**。Snap 的 AppArmor 限制会干扰 OpenClaw 启动和监控浏览器进程的方式。

`apt install chromium` 命令安装的是一个会重定向到 snap 的占位软件包：

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

这**不**是真正的浏览器——它只是一个包装器。

### 解决方案 1：安装 Google Chrome（推荐）

安装官方的 Google Chrome `.deb` 软件包，它不受 snap 沙箱限制：

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

### 解决方案 2：将 Snap Chromium 与仅附加模式一起使用

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

3. 可选：创建一个 systemd 用户服务，以自动启动 Chrome：

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

启用命令：`systemctl --user enable --now openclaw-browser.service`

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

| 选项 | 说明 | 默认值 |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled` | 启用浏览器控制 | `true` |
| `browser.executablePath` | 基于 Chromium 的浏览器二进制路径（Chrome/Brave/Edge/Chromium） | 自动检测（如果默认浏览器基于 Chromium，则优先使用默认浏览器） |
| `browser.headless` | 无 GUI 运行 | `false` |
| `browser.noSandbox` | 添加 `--no-sandbox` 标志（某些 Linux 设置需要） | `false` |
| `browser.attachOnly` | 不启动浏览器，只附加到现有实例 | `false` |
| `browser.cdpPort` | Chrome DevTools Protocol 端口 | `18800` |

### 问题：“No Chrome tabs found for profile="user"”

你正在使用 `existing-session` / Chrome MCP 配置文件。OpenClaw 可以看到本地 Chrome，但没有可附加的打开标签页。

修复选项：

1. **使用受管浏览器：** `openclaw browser start --browser-profile openclaw`
   （或设置 `browser.defaultProfile: "openclaw"`）。
2. **使用 Chrome MCP：** 确保本地 Chrome 正在运行，并且至少有一个打开的标签页，然后使用 `--browser-profile user` 重试。

说明：

- `user` 仅限主机本地。对于 Linux 服务器、容器或远程主机，请优先使用 CDP 配置文件。
- `user` / 其他 `existing-session` 配置文件仍受当前 Chrome MCP 限制：
  基于引用驱动的操作、单文件上传钩子、无对话框超时覆盖、无
  `wait --load networkidle`，以及不支持 `responsebody`、PDF 导出、下载
  拦截或批量操作。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些值。
- 远程 CDP 配置文件接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当使用 `/json/version` 发现时，请使用 HTTP(S)；当你的浏览器
  服务直接提供 DevTools socket URL 时，请使用 WS(S)。
