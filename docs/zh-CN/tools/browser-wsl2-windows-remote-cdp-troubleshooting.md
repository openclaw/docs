---
read_when:
    - 在 WSL2 中运行 OpenClaw Gateway 网关，同时让 Chrome 运行在 Windows 上
    - 在 WSL2 和 Windows 之间看到重叠的浏览器 / Control UI 错误
    - 在分离主机设置中决定使用主机本地 Chrome MCP 还是原始远程 CDP
summary: 分层排查 WSL2 Gateway 网关 + Windows Chrome 远程 CDP 问题
title: WSL2 + Windows + 远程 Chrome CDP 故障排除
x-i18n:
    generated_at: "2026-04-27T06:07:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
    postprocess_version: locale-links-v1
---

在常见的分离主机设置中，OpenClaw Gateway 网关运行在 WSL2 内，Chrome 运行在 Windows 上，而浏览器控制必须跨越 WSL2 和 Windows 边界。[issue #39369](https://github.com/openclaw/openclaw/issues/39369) 中的分层故障模式意味着多个相互独立的问题可能会同时出现，这会让错误的那一层先看起来像是坏掉了。

## 先选择正确的浏览器模式

你有两种有效模式：

### 选项 1：从 WSL2 到 Windows 的原始远程 CDP

使用一个远程浏览器 profile，让它从 WSL2 指向 Windows Chrome CDP 端点。

适用场景：

- Gateway 网关保持运行在 WSL2 中
- Chrome 运行在 Windows 上
- 你需要让浏览器控制跨越 WSL2 / Windows 边界

### 选项 2：主机本地 Chrome MCP

仅当 Gateway 网关本身运行在与 Chrome 相同的主机上时，才使用 `existing-session` / `user`。

适用场景：

- OpenClaw 和 Chrome 在同一台机器上运行
- 你想使用本地已登录的浏览器状态
- 你不需要跨主机的浏览器传输
- 你不需要高级托管 / 仅原始 CDP 路径，例如 `responsebody`、PDF
  导出、下载拦截或批量操作

对于 WSL2 Gateway 网关 + Windows Chrome，优先选择原始远程 CDP。Chrome MCP 是主机本地机制，不是 WSL2 到 Windows 的桥接。

## 可工作的架构

参考结构：

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway 网关
- Windows 在普通浏览器中打开 Control UI：`http://127.0.0.1:18789/`
- Windows Chrome 在端口 `9222` 上暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器 profile 指向 WSL2 可访问的地址

## 为什么这个设置容易让人困惑

多个故障可能会重叠：

- WSL2 无法访问 Windows CDP 端点
- Control UI 是从非安全来源打开的
- `gateway.controlUi.allowedOrigins` 与页面来源不匹配
- 缺少 token 或配对
- 浏览器 profile 指向了错误地址

因此，即使修复了一层，仍然可能看到另一种错误。

## Control UI 的关键规则

当 UI 从 Windows 打开时，除非你明确配置了 HTTPS，否则请使用 Windows localhost。

使用：

`http://127.0.0.1:18789/`

不要默认对 Control UI 使用局域网 IP。局域网或 tailnet 地址上的纯 HTTP 可能会触发与 CDP 本身无关的不安全来源 / 设备认证行为。参见 [Control UI](/zh-CN/web/control-ui)。

## 按层验证

从上到下逐层处理。不要跳步。

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

如果这里在 Windows 上就失败了，那么问题还不在 OpenClaw。

### 第 2 层：验证 WSL2 是否能访问该 Windows 端点

在 WSL2 中，测试你计划在 `cdpUrl` 中使用的精确地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

理想结果：

- `/json/version` 返回带有 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开页面，空数组也可以）

如果失败：

- Windows 还没有把该端口暴露给 WSL2
- 对于 WSL2 一侧，该地址是错误的
- 防火墙 / 端口转发 / 本地代理仍然缺失

在动 OpenClaw 配置之前，先修复这一层。

### 第 3 层：配置正确的浏览器 profile

对于原始远程 CDP，将 OpenClaw 指向 WSL2 可访问的地址：

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
- 对外部托管的浏览器保留 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 当你希望 OpenClaw 自动发现 `/json/version` 时，使用 HTTP(S)
- 只有当浏览器提供商直接给你 DevTools socket URL 时，才使用 WS(S)
- 在期待 OpenClaw 成功之前，先用 `curl` 测试同一个 URL

### 第 4 层：单独验证 Control UI 层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 的预期一致
- token 认证或配对已正确配置
- 你没有把一个 Control UI 认证问题误当成浏览器问题来调试

有帮助的页面：

- [Control UI](/zh-CN/web/control-ui)

### 第 5 层：验证端到端浏览器控制

在 WSL2 中：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

理想结果：

- 标签页会在 Windows Chrome 中打开
- `openclaw browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）可在同一个 profile 上正常工作

## 常见的误导性错误

请将每条消息都视为某一层的线索：

- `control-ui-insecure-auth`
  - 是 UI 来源 / 安全上下文问题，不是 CDP 传输问题
- `token_missing`
  - 是认证配置问题
- `pairing required`
  - 是设备批准问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问已配置的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端点已经响应，但 DevTools WebSocket 仍无法打开
- 远程会话结束后出现过期的 viewport / dark-mode / locale / offline 覆盖
  - 运行 `openclaw browser stop --browser-profile remote`
  - 这会关闭当前控制会话，并释放 Playwright / CDP 模拟状态，而无需重启 Gateway 网关或外部浏览器
- `gateway timeout after 1500ms`
  - 通常仍然是 CDP 可达性问题，或远程端点过慢 / 不可达
- `No Chrome tabs found for profile="user"`
  - 选中了本地 Chrome MCP profile，但没有可用的主机本地标签页

## 快速排查清单

1. Windows：`curl http://127.0.0.1:9222/json/version` 能工作吗？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 能工作吗？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了那个精确的 WSL2 可访问地址？
4. Control UI：你打开的是 `http://127.0.0.1:18789/`，而不是局域网 IP 吗？
5. 你是否在 WSL2 和 Windows 之间尝试使用 `existing-session`，而不是原始远程 CDP？

## 实际结论

这个设置通常是可行的。难点在于：浏览器传输、Control UI 来源安全，以及 token / 配对都可能各自独立失败，而从用户侧看起来又很相似。

如果不确定：

- 先在本地验证 Windows Chrome 端点
- 再从 WSL2 验证同一个端点
- 只有在这之后，才去调试 OpenClaw 配置或 Control UI 认证

## 相关内容

- [Browser](/zh-CN/tools/browser)
- [Browser login](/zh-CN/tools/browser-login)
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
