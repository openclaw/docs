---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，而 Chrome 位于 Windows 上
    - 在 WSL2 和 Windows 上看到重叠的浏览器/Control UI 错误
    - 在拆分主机设置中，在主机本地 Chrome MCP 和原始远程 CDP 之间做选择
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-07-06T10:52:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常见的分主机设置中，OpenClaw Gateway 网关在 WSL2 内运行，Chrome 在 Windows 上运行，浏览器控制必须跨越 WSL2/Windows 边界。多个独立问题可能同时出现（见 [issue #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP 传输、Control UI 源安全以及 token/配对都可能各自失败，同时产生看起来相似的错误。请按下面的层级顺序排查，而不是猜测哪一层出了问题。

## 先选择正确的浏览器模式

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用从 WSL2 指向 Windows Chrome CDP 端点的远程浏览器配置文件。当 Gateway 网关留在 WSL2 内、Chrome 在 Windows 上运行，并且浏览器控制需要跨越 WSL2/Windows 边界时，选择此方式。

### 选项 2：主机本地 Chrome MCP

仅当 Gateway 网关与 Chrome 运行在同一台主机上、你需要本地已登录的浏览器状态、不需要跨主机浏览器传输，并且不需要 `responsebody`、PDF 导出、下载拦截或批量操作时，才使用 `existing-session` driver（`user` 配置文件）（Chrome MCP 配置文件不支持这些功能）。

对于 WSL2 Gateway 网关 + Windows Chrome，请使用原始远程 CDP。Chrome MCP 是主机本地的，不是 WSL2 到 Windows 的桥接。

## 工作架构

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中打开位于 `http://127.0.0.1:18789/` 的 Control UI
- Windows Chrome 在端口 `9222` 上暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器配置文件指向可从 WSL2 访问的地址

## Control UI 的关键规则

从 Windows 打开 UI 时，除非你有明确的 HTTPS 设置，否则使用 Windows localhost：

```text
http://127.0.0.1:18789/
```

不要默认使用 LAN IP。LAN 或 tailnet 地址上的普通 HTTP 可能触发与 CDP 本身无关的不安全源/设备认证行为。参见 [Control UI](/zh-CN/web/control-ui)。

## 分层验证

从上到下排查；不要跳过层级。修复一层后，下面某一层仍可能显示不同错误。

### 第 1 层：验证 Chrome 正在 Windows 上提供 CDP

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 及更高版本会忽略默认 Chrome 数据目录的远程调试命令行开关。请使用如上所示的单独非默认数据目录。参见 Chrome 的 [remote-debugging security change](https://developer.chrome.com/blog/remote-debugging-port)。这不会让普通已登录的 Chrome 配置文件可被远程控制。

先从 Windows 验证 Chrome 本身：

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

如果这里失败，请诊断下面的 Windows 监听器。OpenClaw 还不是问题所在。

#### 更改 portproxy 前先诊断 IPv4 和 IPv6

Chromium 会先尝试将远程调试绑定到 `127.0.0.1`，只有当 IPv4 绑定失败时才回退到 `[::1]`。一个持久的 `v4tov4` 规则如果监听在 `127.0.0.1:9222`，可能会在 Chrome 启动前占用该端点。随后 Chrome 会回退到 `[::1]:9222`，而旧规则会把 IPv4 流量转发回自己的监听器并返回空回复。

请从 Windows 检查实际监听器和代理规则，而不是根据 Chrome 版本推断：

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

对 `netstat` 中的每个 PID 使用 `tasklist /fi "PID eq <PID>"`。

- 如果 `chrome.exe` 在 `127.0.0.1` 上响应，请移除任何同样监听 `127.0.0.1:9222` 的 portproxy 规则。只将 WSL2 可访问的 Windows 适配器地址转发到 `127.0.0.1`。
- 如果 `chrome.exe` 只在 `[::1]` 上响应，请使用 `v4tov6` 将 WSL2 可访问的监听器指向 `::1`，而不是转发到未使用的 IPv4 地址：

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

将监听器绑定到 WSL2 所需的适配器地址。不要在 `0.0.0.0`、LAN 地址或 tailnet 地址上暴露 CDP 端口：CDP 会授予对浏览器会话的控制权。

### 第 2 层：验证 WSL2 可以访问该 Windows 端点

从 WSL2 测试你计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开页面，空数组也可以）

如果这里失败，说明 Windows 还没有向 WSL2 暴露该端口、该地址对 WSL2 侧来说不正确，或者缺少防火墙/端口转发/代理设置。在修改 OpenClaw 配置前先修复这些问题。

### 第 3 层：配置正确的浏览器配置文件

将 OpenClaw 指向可从 WSL2 访问的地址：

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

说明：

- 使用 WSL2 可访问的地址，而不是只在 Windows 上可用的地址
- 对外部管理的浏览器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)
- 仅当浏览器提供商提供直接的 DevTools socket URL 时才使用 WS(S)
- 在期望 OpenClaw 成功前，用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 层

从 Windows 打开 `http://127.0.0.1:18789/`，然后验证：

- 页面 origin 与 `gateway.controlUi.allowedOrigins` 预期一致
- token auth 或配对配置正确
- 你没有把 Control UI auth 问题当成浏览器问题来调试

有用页面：[Control UI](/zh-CN/web/control-ui)。

### 第 5 层：验证端到端浏览器控制

从 WSL2：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好结果：

- 标签页在 Windows Chrome 中打开
- `browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可从同一配置文件正常工作

## 常见误导性错误

| 消息                                                                                    | 含义                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI origin/安全上下文问题，不是 CDP 传输问题                                                                                                                                       |
| `token_missing`                                                                         | auth 配置问题                                                                                                                                                                     |
| `pairing required`                                                                      | 设备审批问题                                                                                                                                                                      |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 无法访问配置的 `cdpUrl`                                                                                                                                                      |
| 空 CDP 回复 / 通过 portproxy 出现 `other side closed`                                   | Windows 监听器不匹配或自循环；检查两个 loopback 地址族以及 `netsh interface portproxy show all`                                                                                   |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端点已响应，但无法打开 DevTools WebSocket                                                                                                                                    |
| 远程会话后出现过时 viewport / 深色模式 / locale / offline overrides                     | 运行 `openclaw browser --browser-profile remote stop` 关闭会话并释放缓存的 Playwright/CDP 连接，无需重启 Gateway 网关或外部浏览器                                                |
| `remoteCdpTimeoutMs` 附近超时（默认 1500ms）                                            | 通常仍是 CDP 可访问性问题，或远程端点很慢/不可访问                                                                                                                               |
| `Playwright page enumeration timed out after 3000ms`                                    | 远程 CDP 已连接，但其持久标签页读取卡住；截止时间取 `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 中较大的一个                                                           |
| `No Chrome tabs found for profile="user"`                                               | 选择了本地 Chrome MCP 配置文件，但没有可用的主机本地标签页                                                                                                                       |

## 快速分诊清单

1. Windows：`127.0.0.1` 和 `[::1]` 中哪个会在 `/json/version` 上响应，并且该监听器是否属于 `chrome.exe`？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可用？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了这个确切的 WSL2 可访问地址？
4. Control UI：你是否打开的是 `http://127.0.0.1:18789/`，而不是 LAN IP？
5. 你是否在尝试跨 WSL2 和 Windows 使用 `existing-session`，而不是原始远程 CDP？

先在本地验证 Windows Chrome 端点，再从 WSL2 验证同一端点，然后才调试 OpenClaw 配置或 Control UI auth。

## 相关

- [Browser](/zh-CN/tools/browser)
- [Browser login](/zh-CN/tools/browser-login)
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
