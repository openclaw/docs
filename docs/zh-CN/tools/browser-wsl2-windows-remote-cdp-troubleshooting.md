---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，而 Chrome 位于 Windows 上
    - 看到 WSL2 和 Windows 上出现重叠的浏览器/Control UI 错误
    - 在分离主机场景中选择主机本地 Chrome MCP 还是原始远程 CDP
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 故障
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-07-05T11:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a2cd455663add52b53d2b880db884b3d798afac63e8a943d28550726cf0ea7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

在常见的分主机设置中，OpenClaw Gateway 网关在 WSL2 内运行，Chrome 在 Windows 上运行，而浏览器控制必须跨越 WSL2/Windows 边界。几个独立问题可能会同时出现（见 [issue #39369](https://github.com/openclaw/openclaw/issues/39369)）：CDP 传输、Control UI 来源安全以及令牌/配对都可能各自失败，同时产生看起来相似的错误。请按下面的层级顺序排查，而不是猜测哪一层坏了。

## 先选择正确的浏览器模式

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用一个从 WSL2 指向 Windows Chrome CDP 端点的远程浏览器配置文件。当 Gateway 网关留在 WSL2 内、Chrome 在 Windows 上运行，并且浏览器控制需要跨越 WSL2/Windows 边界时，请选择此方式。

### 选项 2：主机本地 Chrome MCP

仅当 Gateway 网关与 Chrome 在同一台主机上运行、你需要本地已登录的浏览器状态、不需要跨主机浏览器传输，并且不需要 `responsebody`、PDF 导出、下载拦截或批量操作时，才使用 `existing-session` 驱动（`user` 配置文件）（Chrome MCP 配置文件不支持这些）。

对于 WSL2 Gateway 网关 + Windows Chrome，请使用原始远程 CDP。Chrome MCP 是主机本地的，不是 WSL2 到 Windows 的桥接。

## 工作架构

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中通过 `http://127.0.0.1:18789/` 打开 Control UI
- Windows Chrome 在端口 `9222` 上暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器配置文件指向可从 WSL2 访问的地址

## Control UI 的关键规则

从 Windows 打开 UI 时，请使用 Windows localhost，除非你有有意配置的 HTTPS 设置：

```text
http://127.0.0.1:18789/
```

不要默认使用 LAN IP。LAN 或 tailnet 地址上的纯 HTTP 可能触发与 CDP 本身无关的不安全来源/设备认证行为。请参阅 [Control UI](/zh-CN/web/control-ui)。

## 分层验证

从上到下排查；不要跳过。修复一层后，仍可能从更下面的层看到另一个不同错误。

### 第 1 层：验证 Chrome 是否在 Windows 上提供 CDP 服务

```powershell
chrome.exe --remote-debugging-port=9222
```

先在 Windows 上验证 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果这一步在 Windows 上失败，那么问题还不在 OpenClaw。

### 第 2 层：验证 WSL2 能否访问该 Windows 端点

在 WSL2 中，测试你计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

良好结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开的页面，空数组也可以）

如果这一步失败，说明 Windows 尚未向 WSL2 暴露该端口、地址对 WSL2 侧来说不正确，或者缺少防火墙/端口转发/代理配置。先修复这些，再改 OpenClaw 配置。

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

- 使用可从 WSL2 访问的地址，而不是只在 Windows 上可用的地址
- 对外部管理的浏览器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 发现 `/json/version` 时，使用 HTTP(S)
- 只有当浏览器提供商给你直接的 DevTools socket URL 时，才使用 WS(S)
- 在期望 OpenClaw 成功之前，先用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 层

从 Windows 打开 `http://127.0.0.1:18789/`，然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 预期匹配
- 令牌认证或配对配置正确
- 你没有把 Control UI 认证问题当成浏览器问题来调试

有用页面：[Control UI](/zh-CN/web/control-ui)。

### 第 5 层：验证端到端浏览器控制

从 WSL2 执行：

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

良好结果：

- 标签页在 Windows Chrome 中打开
- `browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可从同一个配置文件正常工作

## 常见误导性错误

| 消息                                                                                    | 含义                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI 来源/安全上下文问题，不是 CDP 传输问题                                                                                                                                              |
| `token_missing`                                                                         | 认证配置问题                                                                                                                                                                           |
| `pairing required`                                                                      | 设备审批问题                                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 无法访问已配置的 `cdpUrl`                                                                                                                                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP 端点有响应，但 DevTools WebSocket 无法打开                                                                                                                                        |
| 远程会话后的陈旧视口 / 深色模式 / 区域设置 / 离线覆盖                                  | 运行 `openclaw browser --browser-profile remote stop` 关闭会话并释放缓存的 Playwright/CDP 连接，无需重启 Gateway 网关或外部浏览器                                                    |
| `remoteCdpTimeoutMs`（默认 1500ms）附近超时                                             | 通常仍是 CDP 可访问性问题，或远程端点缓慢/不可访问                                                                                                                                     |
| `No Chrome tabs found for profile="user"`                                               | 选择了本地 Chrome MCP 配置文件，但没有可用的主机本地标签页                                                                                                                            |

## 快速分诊清单

1. Windows：`curl http://127.0.0.1:9222/json/version` 是否可用？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否可用？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了那个确切的、可从 WSL2 访问的地址？
4. Control UI：你打开的是 `http://127.0.0.1:18789/`，而不是 LAN IP 吗？
5. 你是否试图跨 WSL2 和 Windows 使用 `existing-session`，而不是使用原始远程 CDP？

先在 Windows 本地验证 Windows Chrome 端点，然后从 WSL2 验证同一个端点，之后再调试 OpenClaw 配置或 Control UI 认证。

## 相关

- [Browser](/zh-CN/tools/browser)
- [Browser login](/zh-CN/tools/browser-login)
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
