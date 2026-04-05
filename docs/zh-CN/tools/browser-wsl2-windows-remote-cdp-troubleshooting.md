---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，而 Chrome 位于 Windows 上时
    - 在 WSL2 和 Windows 之间看到重叠的 browser/control-ui 错误时
    - 在分离主机设置中决定使用宿主机本地 Chrome MCP 还是原始远程 CDP 时
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 问题
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-04-05T10:10:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# WSL2 + Windows + 远程 Chrome CDP 故障排除

本指南涵盖一种常见的分离主机设置，其中：

- OpenClaw Gateway 网关运行在 WSL2 内部
- Chrome 运行在 Windows 上
- browser 控制必须跨越 WSL2/Windows 边界

它还涵盖了 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 中的分层故障模式：多个独立问题可能会同时出现，这会让错误的那一层看起来先坏掉。

## 先选择正确的浏览器模式

你有两种有效模式：

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用一个远程 browser profile，从 WSL2 指向 Windows Chrome CDP 端点。

适用场景：

- Gateway 网关保持运行在 WSL2 内
- Chrome 运行在 Windows 上
- 你需要让 browser 控制跨越 WSL2/Windows 边界

### 选项 2：宿主机本地 Chrome MCP

只有当 Gateway 网关本身运行在与 Chrome 相同的主机上时，才使用 `existing-session` / `user`。

适用场景：

- OpenClaw 和 Chrome 在同一台机器上运行
- 你想使用本地已登录的浏览器状态
- 你不需要跨主机的 browser 传输
- 你不需要高级的托管/仅原始 CDP 路由，例如 `responsebody`、PDF
  导出、下载拦截或批量操作

对于 WSL2 Gateway 网关 + Windows Chrome，优先使用原始远程 CDP。Chrome MCP 是宿主机本地模式，不是从 WSL2 到 Windows 的桥接方案。

## 可工作的架构

参考结构：

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中打开控制 UI，地址为 `http://127.0.0.1:18789/`
- Windows Chrome 在端口 `9222` 上暴露一个 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将某个 browser profile 指向从 WSL2 可访问的地址

## 为什么这种设置容易让人困惑

多个故障可能会重叠：

- WSL2 无法访问 Windows CDP 端点
- 控制 UI 是从非安全来源打开的
- `gateway.controlUi.allowedOrigins` 与页面来源不匹配
- 缺少 token 或 pairing
- browser profile 指向了错误地址

因此，修复其中一层后，仍可能看到另一种不同错误。

## 控制 UI 的关键规则

当 UI 从 Windows 打开时，除非你有明确的 HTTPS 设置，否则请使用 Windows localhost。

使用：

`http://127.0.0.1:18789/`

不要默认对控制 UI 使用局域网 IP。局域网或 tailnet 地址上的纯 HTTP 可能会触发与 CDP 本身无关的不安全来源/设备认证行为。参见 [控制 UI](/web/control-ui)。

## 按层验证

请自上而下逐层排查。不要跳步。

### 第 1 层：验证 Chrome 是否在 Windows 上提供 CDP

在 Windows 上启动启用了远程调试的 Chrome：

```powershell
chrome.exe --remote-debugging-port=9222
```

先在 Windows 上验证 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果这里在 Windows 上失败，那么问题还不在 OpenClaw。

### 第 2 层：验证 WSL2 能否访问该 Windows 端点

在 WSL2 中，测试你计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正确结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开任何页面，空数组也没问题）

如果失败：

- Windows 还没有把该端口暴露给 WSL2
- 对 WSL2 这一侧来说地址是错的
- 防火墙 / 端口转发 / 本地代理仍然缺失

在修改 OpenClaw 配置之前，先修复这个问题。

### 第 3 层：配置正确的 browser profile

对于原始远程 CDP，请让 OpenClaw 指向从 WSL2 可访问的地址：

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

- 使用从 WSL2 可访问的地址，而不是只在 Windows 上可用的地址
- 对外部管理的浏览器保持 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)
- 只有在 browser 提供商给你直接的 DevTools socket URL 时才使用 WS(S)
- 在期待 OpenClaw 成功之前，先用 `curl` 测试同一个 URL

### 第 4 层：单独验证控制 UI 层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 的预期一致
- token 认证或 pairing 已正确配置
- 你没有把控制 UI 认证问题误当成 browser 问题来调试

有帮助的页面：

- [控制 UI](/web/control-ui)

### 第 5 层：验证端到端 browser 控制

从 WSL2 运行：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

正确结果：

- 该标签页会在 Windows Chrome 中打开
- `openclaw browser tabs` 返回该目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可通过同一个 profile 工作

## 常见的误导性错误

请将每条消息都视为某一层的特定线索：

- `control-ui-insecure-auth`
  - UI 来源 / 安全上下文问题，不是 CDP 传输问题
- `token_missing`
  - 认证配置问题
- `pairing required`
  - 设备批准问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问已配置的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端点已经响应，但 DevTools WebSocket 仍无法打开
- 远程会话结束后残留的 viewport / dark-mode / locale / offline 覆盖状态
  - 运行 `openclaw browser stop --browser-profile remote`
  - 这会关闭当前控制会话并释放 Playwright/CDP 模拟状态，而无需重启 gateway 或外部浏览器
- `gateway timeout after 1500ms`
  - 通常仍是 CDP 可达性问题，或者远程端点缓慢/不可达
- `No Chrome tabs found for profile="user"`
  - 选择了本地 Chrome MCP profile，但当前没有可用的宿主机本地标签页

## 快速排查清单

1. 在 Windows 上：`curl http://127.0.0.1:9222/json/version` 能工作吗？
2. 在 WSL2 中：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 能工作吗？
3. OpenClaw 配置中：`browser.profiles.<name>.cdpUrl` 是否使用了那个确切的、可从 WSL2 访问的地址？
4. 控制 UI：你打开的是 `http://127.0.0.1:18789/`，而不是局域网 IP 吗？
5. 你是否在 WSL2 和 Windows 之间尝试使用 `existing-session`，而不是原始远程 CDP？

## 实际结论

这种设置通常是可行的。难点在于 browser 传输、控制 UI 来源安全性以及 token/pairing 都可能彼此独立失败，而且从用户角度看起来很相似。

拿不准时：

- 先在本地验证 Windows Chrome 端点
- 再从 WSL2 验证同一个端点
- 只有这样之后，才去调试 OpenClaw 配置或控制 UI 认证
