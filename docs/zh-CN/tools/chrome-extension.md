---
read_when:
    - 你想让智能体通过手机操控你已登录真实账户的 Chrome 浏览器
    - 你总是遇到 Chrome 的“允许远程调试？”提示，但桌前却无人操作
    - 你想了解通过扩展接管浏览器的安全模型
summary: Chrome 扩展：让 OpenClaw 控制你已登录的 Chrome，无需远程调试提示
title: Chrome 扩展程序
x-i18n:
    generated_at: "2026-07-11T20:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 扩展

OpenClaw Chrome 扩展让智能体无需启动单独的托管浏览器，即可控制你**已登录的 Chrome 标签页**，并且**不会**触发 Chrome 阻塞操作的 “Allow remote debugging?” 提示。

当你通过手机（Telegram、WhatsApp 等）操控 OpenClaw 时，这一点很重要：[​​`user` 配置文件](/zh-CN/tools/browser#profiles-openclaw-user-chrome)会通过 Chrome 的远程调试端口连接，这会弹出桌面同意对话框，而你不在电脑旁时无人可以点击。该扩展改用 `chrome.debugger` API，因此页面内唯一的提示是 Chrome 可关闭的 “OpenClaw started debugging this browser” 横幅。

Anthropic 的 Claude in Chrome 和 OpenAI 的 Codex Chrome 扩展也采用相同的架构。

## 工作原理

它由三部分组成：

- **浏览器控制服务**（Gateway 网关或节点主机）：`browser` 工具调用的 API。
- **扩展中继**（local loopback WebSocket）：控制服务在 `127.0.0.1` 上启动的小型服务器。它向 OpenClaw 提供 Chrome DevTools Protocol 端点，并与扩展通信。双方都使用主机本地令牌进行身份验证（见下文）。
- **OpenClaw Chrome 扩展**（MV3）：使用 `chrome.debugger` 连接标签页、转发 CDP 流量，并管理 **OpenClaw 标签页组**。

OpenClaw 只能看到和控制 **OpenClaw 标签页组**中的标签页。该标签页组是用户授权边界：将标签页拖入组中即可共享，将其拖出（或点击工具栏按钮）即可立即撤销访问权限。

## 安装并配对

1. 输出未打包扩展的路径：

   ```bash
   openclaw browser extension path
   ```

2. 打开 `chrome://extensions`，启用 **Developer mode**，点击 **Load
   unpacked**，然后选择输出的目录。

3. 输出配对字符串：

   ```bash
   openclaw browser extension pair
   ```

4. 点击 OpenClaw 工具栏图标，将配对字符串粘贴到弹出窗口中。
   扩展连接到中继后，徽标会变为 **ON**。

配对令牌是首次使用时创建的**主机本地密钥**，存储在状态目录的 `credentials/` 下（权限模式为 `0600`）。每台运行浏览器的机器（Gateway 网关主机以及每台浏览器节点主机）都拥有自己的令牌，因此无需在机器之间传输凭据。若要轮换令牌，请删除 `browser-extension-relay.secret` 文件，然后重新配对。

## 使用方法

在 `browser` 工具调用中选择内置的 `chrome` 配置文件，或将其设为默认配置文件：

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- 共享标签页：在该标签页中点击 OpenClaw 工具栏按钮（它会加入 OpenClaw 标签页组），或将任意标签页拖入该组。
- 智能体也可以打开新标签页；这些标签页会自动加入该组。
- 撤销访问权限：再次点击按钮、将标签页拖出组，或关闭 Chrome 的调试横幅。智能体会立即失去对该标签页的访问权限。

## 远程／跨机器使用

Chrome 无需运行在 Gateway 网关主机上。支持以下三种拓扑：

- **同一主机**（Gateway 网关与 Chrome 位于同一台机器）：在该机器上使用
  `openclaw browser extension pair` 进行配对。中继仅限 local loopback。
- **直接连接远程 Gateway 网关**（Chrome 位于你的笔记本电脑上，Gateway 网关位于 VPS 上，并且笔记本电脑上**没有运行任何其他组件**）：在 Gateway 网关上运行
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`。
  它会输出一个 `wss://…/browser/extension#<secret>` 字符串；在笔记本电脑上加载扩展并进行配对。扩展通过 `wss://` **直接连接 Gateway 网关**——笔记本电脑上无需安装 OpenClaw、Node 或 CLI，也无需开放入站端口。这是托管服务场景使用的路径。
- **通过浏览器节点主机**（Chrome 位于已运行 OpenClaw 节点的机器上）：在节点上运行 `pair` 并进行本地配对；Gateway 网关通过现有的已验证节点链路，将浏览器操作代理到该节点。

配对密钥按主机独立设置（直接连接时为 Gateway 网关的密钥），由 Gateway 网关的 `/browser/extension` 路由验证。使用直接连接路径时，请通过 TLS（`wss://`）提供 Gateway 网关服务，以加密配对密钥和 CDP 流量。
密钥保留在配对字符串的 URL 片段中，并在 WebSocket 握手期间作为子协议凭据提供，因此常规代理访问日志不会从请求 URL 中获取该密钥。请确保所有反向代理都保留标准的 `Sec-WebSocket-Protocol` 标头。

## 诊断

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在扩展弹出窗口显示 **Connected** 之前，`doctor` 会将 **Chrome 扩展中继**检查报告为失败。

## 安全模型

- 中继仅绑定 local loopback；WebSocket 双方都使用派生令牌进行身份验证，并且扩展端会检查来源是否为 `chrome-extension://`。
- 直接 Gateway 网关配对不接受请求 URL 中的中继令牌；内置扩展改为通过 WebSocket 子协议列表携带该令牌。
- 智能体只能查看和操控 **OpenClaw 标签页组**中的标签页。你的其他标签页会保持私密。
- 相较于 `user`（Chrome MCP）配置文件——一旦你批准远程调试提示，它就会开放整个已登录的浏览器——该扩展将共享范围限定在你一眼即可查看和控制的标签页组内。

另请参阅：[浏览器](/zh-CN/tools/browser)，了解完整的配置文件模型，以及托管的 `openclaw` 配置文件和 Chrome MCP `user` 配置文件。
