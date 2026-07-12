---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，而 Chrome 位于 Windows 上
    - 在 WSL2 和 Windows 上出现重叠的浏览器/Control UI 错误
    - 在主机分离部署中选择主机本地 Chrome MCP 还是原始远程 CDP
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 故障
title: WSL2 + Windows + 远程 Chrome CDP 故障排查
x-i18n:
    generated_at: "2026-07-11T20:59:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常见的分主机设置中，OpenClaw Gateway 网关运行在 WSL2 内，Chrome 运行在 Windows 上，而浏览器控制必须跨越 WSL2/Windows 边界。多个相互独立的问题可能同时出现（参见 [issue #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP 传输、Control UI 来源安全性以及令牌/配对都可能各自失败，却产生外观相似的错误。请按顺序逐层排查，而不要猜测究竟是哪一层出现了故障。

## 首先选择正确的浏览器模式

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用远程浏览器配置文件，从 WSL2 指向 Windows Chrome 的 CDP 端点。当 Gateway 网关位于 WSL2 内、Chrome 运行在 Windows 上，并且浏览器控制需要跨越 WSL2/Windows 边界时，请选择此模式。

### 选项 2：主机本地 Chrome MCP

仅当 Gateway 网关与 Chrome 运行在同一主机上、你希望使用本地已登录的浏览器状态、不需要跨主机浏览器传输，并且不需要 `responsebody`、PDF 导出、下载拦截或批量操作时，才使用 `existing-session` 驱动程序（`user` 配置文件）；Chrome MCP 配置文件不支持这些功能。

对于 WSL2 Gateway 网关 + Windows Chrome，请使用原始远程 CDP。Chrome MCP 仅限主机本地使用，并不是连接 WSL2 与 Windows 的桥接方案。

## 工作架构

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 使用普通浏览器打开 `http://127.0.0.1:18789/` 上的 Control UI
- Windows Chrome 在端口 `9222` 上公开 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器配置文件指向可从 WSL2 访问的地址

## Control UI 的关键规则

从 Windows 打开 UI 时，除非你特意配置了 HTTPS，否则请使用 Windows localhost：

```text
http://127.0.0.1:18789/
```

不要默认使用局域网 IP。通过局域网或 tailnet 地址使用普通 HTTP，可能触发与 CDP 本身无关的不安全来源/设备身份验证行为。参见 [Control UI](/zh-CN/web/control-ui)。

## 分层验证

请从上到下依次排查，不要跳过中间步骤。修复某一层后，较下层的其他错误仍可能继续显示。

### 第 1 层：验证 Chrome 是否在 Windows 上提供 CDP 服务

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 及更高版本会忽略针对默认 Chrome 数据目录的远程调试命令行开关。请像上面所示，使用单独的非默认数据目录。参见 Chrome 的[远程调试安全性变更](https://developer.chrome.com/blog/remote-debugging-port)。这不会让正常的已登录 Chrome 配置文件变得可远程控制。

首先从 Windows 验证 Chrome 本身：

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

如果失败，请排查下述 Windows 监听器。此时问题还不在 OpenClaw。

#### 在更改 portproxy 之前排查 IPv4 和 IPv6

Chromium 会先尝试将远程调试绑定到 `127.0.0.1`，仅当 IPv4 绑定失败时才回退到 `[::1]`。持续存在且监听 `127.0.0.1:9222` 的 `v4tov4` 规则可能会在 Chrome 启动前占用该端点。随后 Chrome 会回退到 `[::1]:9222`，而旧规则会将 IPv4 流量转发回自己的监听器并返回空响应。

请从 Windows 检查实际监听器和代理规则，不要根据 Chrome 版本推断：

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

对 `netstat` 中的每个 PID 使用 `tasklist /fi "PID eq <PID>"`。

- 如果 `chrome.exe` 在 `127.0.0.1` 上响应，请删除所有同样监听 `127.0.0.1:9222` 的 portproxy 规则。仅将 WSL2 可访问的 Windows 适配器地址转发到 `127.0.0.1`。
- 如果 `chrome.exe` 仅在 `[::1]` 上响应，请使用 `v4tov6` 将 WSL2 可访问的监听器指向 `::1`，而不是转发到未使用的 IPv4 地址：

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

将监听器绑定到 WSL2 所需的适配器地址。不要在 `0.0.0.0`、局域网地址或 tailnet 地址上公开 CDP 端口：CDP 会授予对浏览器会话的控制权。

### 第 2 层：验证 WSL2 能否访问该 Windows 端点

从 WSL2 测试你计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正常结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开任何页面，空数组也正常）

如果失败，说明 Windows 尚未向 WSL2 公开该端口、此地址不适用于 WSL2 一侧，或者缺少防火墙/端口转发/代理配置。在修改 OpenClaw 配置之前，请先修复此问题。

### 第 3 层：配置正确的浏览器配置文件

让 OpenClaw 指向可从 WSL2 访问的地址：

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

注意：

- 使用 WSL2 可访问的地址，而不是只能在 Windows 上使用的地址
- 对于外部管理的浏览器，保持 `attachOnly: true`
- `cdpUrl` 可以使用 `http://`、`https://`、`ws://` 或 `wss://`
- 如果希望 OpenClaw 发现 `/json/version`，请使用 HTTP(S)
- 仅当浏览器提供商向你提供直接的 DevTools 套接字 URL 时，才使用 WS(S)
- 在期望 OpenClaw 成功之前，先使用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 层

从 Windows 打开 `http://127.0.0.1:18789/`，然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 的预期值一致
- 令牌身份验证或配对已正确配置
- 你没有把 Control UI 身份验证问题当作浏览器问题进行排查

相关页面：[Control UI](/zh-CN/web/control-ui)。

### 第 5 层：验证端到端浏览器控制

从 WSL2 运行：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

正常结果：

- 标签页在 Windows Chrome 中打开
- `browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可通过同一配置文件正常执行

## 常见的误导性错误

| 消息                                                                                    | 含义                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI 来源/安全上下文问题，不是 CDP 传输问题                                                                                                                                                |
| `token_missing`                                                                         | 身份验证配置问题                                                                                                                                                                         |
| `pairing required`                                                                      | 设备审批问题                                                                                                                                                                             |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 无法访问已配置的 `cdpUrl`                                                                                                                                                           |
| 通过 portproxy 时收到空 CDP 响应 / `other side closed`                                  | Windows 监听器不匹配或发生自循环；请检查两个环回地址族以及 `netsh interface portproxy show all`                                                                                          |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端点已响应，但无法打开 DevTools WebSocket                                                                                                                                           |
| 远程会话后出现过期的视口/深色模式/语言区域/离线覆盖设置                                 | 运行 `openclaw browser --browser-profile remote stop` 关闭会话并释放缓存的 Playwright/CDP 连接，无需重启 Gateway 网关或外部浏览器                                                       |
| `remoteCdpTimeoutMs` 附近超时（默认值为 1500ms）                                        | 通常仍是 CDP 可访问性问题，或者远程端点响应缓慢/无法访问                                                                                                                                  |
| `Playwright page enumeration timed out after 3000ms`                                    | 远程 CDP 已连接，但其持久标签页读取停滞；截止时间取 `remoteCdpTimeoutMs` 与 `remoteCdpHandshakeTimeoutMs` 中的较大值                                                                      |
| `No Chrome tabs found for profile="user"`                                               | 选择了本地 Chrome MCP 配置文件，但没有可用的主机本地标签页                                                                                                                               |

## 快速排查清单

1. Windows：`127.0.0.1` 和 `[::1]` 中哪个地址会在 `/json/version` 上响应，该监听器是否属于 `chrome.exe`？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否正常工作？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了该确切的 WSL2 可访问地址？
4. Control UI：你是否打开了 `http://127.0.0.1:18789/`，而不是局域网 IP？
5. 你是否尝试使用 `existing-session` 跨越 WSL2 和 Windows，而不是使用原始远程 CDP？

首先在 Windows 本地验证 Chrome 端点，然后从 WSL2 验证同一端点，最后再排查 OpenClaw 配置或 Control UI 身份验证。

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [浏览器登录](/zh-CN/tools/browser-login)
- [浏览器 Linux 故障排查](/zh-CN/tools/browser-linux-troubleshooting)
