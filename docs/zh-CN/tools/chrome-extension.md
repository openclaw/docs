---
read_when:
    - 你想让智能体从你的手机驱动你已登录的真实 Chrome
    - 你一直遇到 Chrome 的“允许远程调试？”提示，但桌边没人。
    - 你想了解通过扩展接管浏览器的安全模型
summary: Chrome 扩展：让 OpenClaw 驱动你已登录的 Chrome，且不会出现远程调试提示
title: Chrome 扩展
x-i18n:
    generated_at: "2026-07-06T10:52:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c189e8f5585fb28544190690a2177e247d6f7e213b1e33c0534d74dde2eeae62
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 扩展程序

OpenClaw Chrome 扩展程序让智能体控制你的**已登录 Chrome 标签页**，无需启动单独的托管浏览器，也**不会**触发 Chrome 阻塞式的“允许远程调试？”提示。

当你通过手机（Telegram、WhatsApp 等）驱动 OpenClaw 时，这一点很重要：[ `user` 配置文件](/zh-CN/tools/browser#profiles-openclaw-user-chrome)会通过 Chrome 的远程调试端口连接，这会弹出一个桌面同意对话框，而你不在电脑旁时没人能点击。扩展程序改用 `chrome.debugger` API，因此页面内唯一提示是 Chrome 可关闭的“OpenClaw 已开始调试此浏览器”横幅。

这与 Anthropic 的 Claude in Chrome 和 OpenAI 的 Codex Chrome 扩展程序采用的形态相同。

## 工作原理

三部分：

- **浏览器控制服务**（Gateway 网关或节点主机）：`browser` 工具调用的 API。
- **扩展中继**（loopback WebSocket）：控制服务在 `127.0.0.1` 上启动的小型服务器。它向 OpenClaw 提供 Chrome DevTools Protocol 端点，并与扩展程序通信。双方都使用主机本地令牌进行身份验证（见下文）。
- **OpenClaw Chrome 扩展程序**（MV3）：使用 `chrome.debugger` 附加到标签页，转发 CDP 流量，并管理 **OpenClaw 标签页组**。

OpenClaw 只能看到和控制位于 **OpenClaw 标签页组**中的标签页。该标签页组就是同意边界：将标签页拖入即可共享，拖出（或点击工具栏按钮）即可立即撤销访问权限。

## 安装和配对

1. 打印未打包扩展程序路径：

   ```bash
   openclaw browser extension path
   ```

2. 打开 `chrome://extensions`，启用**开发者模式**，点击**加载已解压的扩展程序**，然后选择打印出的目录。

3. 打印配对字符串：

   ```bash
   openclaw browser extension pair
   ```

4. 点击 OpenClaw 工具栏图标，并将配对字符串粘贴到弹窗中。当扩展程序连接到中继时，徽章会变为**开启**。

配对令牌是在首次使用时创建的**主机本地密钥**，存储在状态目录下的 `credentials/` 中（模式 `0600`）。每台运行浏览器的机器（Gateway 网关主机和每个浏览器节点主机）都拥有自己的令牌，因此凭据不需要在机器之间传递。要轮换令牌，请删除 `browser-extension-relay.secret` 文件并重新配对。

## 使用方式

在 `browser` 工具调用中选择内置的 `chrome` 配置文件，或将其设为默认值：

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

- 共享标签页：在该标签页上点击 OpenClaw 工具栏按钮（它会加入 OpenClaw 标签页组），或将任意标签页拖入该组。
- 智能体也可以打开新标签页；这些标签页会自动进入该组。
- 撤销：再次点击按钮、将标签页拖出该组，或关闭 Chrome 的调试横幅。智能体会立即失去对该标签页的访问权限。

## 远程浏览器节点

无论 Chrome 运行在 Gateway 网关主机上，还是运行在单独的[浏览器节点主机](/zh-CN/tools/browser#local-vs-remote-control)上，扩展程序都可以工作。中继始终仅限 loopback，并运行在**带有浏览器的机器**上：

- **同一主机**（Gateway 网关 + Chrome 在一台机器上）：在该机器上配对。
- **远程节点**（Chrome 在节点上，Gateway 网关在其他位置）：在**节点上**运行 `openclaw browser extension path` / `pair`，并在那里加载和配对扩展程序。Gateway 网关会通过现有的已认证节点链路将浏览器操作代理到节点；节点的本地中继驱动扩展程序。节点上不会打开新的入站端口。

配对令牌按主机分配，因此每个节点都会打印自己的字符串。

## 诊断

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

在扩展程序弹窗显示**已连接**之前，`doctor` 会报告 **Chrome 扩展中继**检查失败。

## 安全模型

- 中继仅绑定 loopback；两个 WebSocket 端都使用派生令牌进行身份验证，并且扩展端会进行来源检查，限定为 `chrome-extension://`。
- 智能体只能看到和驱动 **OpenClaw 标签页组**中的标签页。你的其他标签页保持私密。
- 与 `user`（Chrome MCP）配置文件相比，后者在你批准远程调试提示后会暴露整个已登录浏览器；扩展程序将共享范围限定在你一眼就能控制的标签页组内。

另请参阅：[浏览器](/zh-CN/tools/browser)，了解完整的配置文件模型，以及托管的 `openclaw` 和 Chrome MCP `user` 配置文件。
