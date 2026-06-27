---
read_when:
    - 开发 Google Chat 渠道功能
summary: Google Chat 应用支持状态、能力和配置
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T01:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

状态：可下载插件，通过 Google Chat API webhook（仅 HTTP）支持私信 + 空间。

## 安装

在配置渠道之前安装 Google Chat：

```bash
openclaw plugins install @openclaw/googlechat
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速设置（初学者）

1. 创建 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API 凭据](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果 API 尚未启用，请启用它。
2. 创建一个 **Service Account**：
   - 点击 **Create Credentials** > **Service Account**。
   - 按你的需要命名（例如 `openclaw-chat`）。
   - 权限留空（点击 **Continue**）。
   - 有访问权限的主体留空（点击 **Done**）。
3. 创建并下载 **JSON Key**：
   - 在服务账号列表中，点击你刚创建的那个。
   - 转到 **Keys** 标签页。
   - 点击 **Add Key** > **Create new key**。
   - 选择 **JSON** 并点击 **Create**。
4. 将下载的 JSON 文件存储到你的 Gateway 网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建 Google Chat 应用：
   - 填写 **Application info**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers**，并将其设置为你的 Gateway 网关公开 URL 后接 `/googlechat`。
     - _提示：运行 `openclaw status` 查找你的 Gateway 网关公开 URL。_
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in `<Your Domain>`**。
   - 在文本框中输入你的电子邮件地址（例如 `user@example.com`）。
   - 点击底部的 **Save**。
6. **启用应用状态**：
   - 保存后，**刷新页面**。
   - 查找 **App status** 部分（保存后通常在页面顶部或底部附近）。
   - 将状态更改为 **Live - available to users**。
   - 再次点击 **Save**。
7. 使用服务账号路径 + webhook audience 配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 设置 webhook audience 类型 + 值（与你的 Chat 应用配置匹配）。
9. 启动 Gateway 网关。Google Chat 会向你的 webhook 路径发送 POST。

## 添加到 Google Chat

Gateway 网关运行后，并且你的邮箱已添加到可见性列表中：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3. 在搜索栏（通常用于添加人员的位置）中，输入你在 Google Cloud Console 中配置的 **App name**。
   - **注意**：该机器人不会出现在“应用市场”浏览列表中，因为它是私有应用。你必须按名称搜索它。
4. 从结果中选择你的机器人。
5. 点击 **Add** 或 **Chat** 开始 1:1 对话。
6. 发送“你好”来触发助手！

## 公开 URL（仅 Webhook）

Google Chat webhook 需要公开 HTTPS 端点。出于安全考虑，**只将 `/googlechat` 路径**暴露到互联网。将 OpenClaw 仪表板和其他敏感端点保留在你的私有网络中。

### 选项 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 访问私有仪表板，并使用 Funnel 暴露公开 webhook 路径。这样可以让 `/` 保持私有，同时只暴露 `/googlechat`。

1. **检查你的 Gateway 网关绑定到了哪个地址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   记下 IP 地址（例如 `127.0.0.1`、`0.0.0.0`，或你的 Tailscale IP，如 `100.x.x.x`）。

2. **仅向 tailnet 暴露仪表板（端口 8443）：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **只公开暴露 webhook 路径：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授权该节点使用 Funnel 访问：**
   如果出现提示，请访问输出中显示的授权 URL，以便在你的 tailnet 策略中为此节点启用 Funnel。

5. **验证配置：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公开 webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私有仪表板保持仅限 tailnet 访问：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用公开 URL（不带 `:8443`）。

> 注意：此配置会在重启后保留。若稍后要移除它，请运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 选项 B：反向代理（Caddy）

如果你使用 Caddy 这样的反向代理，只代理指定路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此配置时，对 `your-domain.com/` 的任何请求都会被忽略或返回 404，而 `your-domain.com/googlechat` 会安全地路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel

配置你的 tunnel 入口规则，使其只路由 webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（未找到）

## 工作原理

1. Google Chat 向 Gateway 网关发送 webhook POST。每个请求都包含 `Authorization: Bearer <token>` 标头。
   - 当该标头存在时，OpenClaw 会在读取/解析完整 webhook 正文之前验证 bearer auth。
   - 正文中携带 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 请求通过更严格的预认证正文预算获得支持。
2. OpenClaw 根据配置的 `audienceType` + `audience` 验证 token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 项目编号。
3. 消息按空间路由：
   - 私信使用会话键 `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 空间使用会话键 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私信访问默认使用配对。未知发送者会收到配对码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组空间默认需要 @ 提及。如果提及检测需要应用的用户名，请使用 `botUser`。
6. 当 exec 或插件审批请求从 Google Chat 发起，并且配置了稳定的 `users/<id>` 审批者时，OpenClaw 会在发起请求的空间或线程中发布原生 Google Chat 审批卡片。卡片按钮使用不透明回调 token，只有在原生审批投递不可用时，才会显示手动 `/approve <id> <decision>` 提示。

## 目标

使用这些标识符进行投递和 allowlist：

- 私信：`users/<userId>`（推荐）。
- 原始电子邮件 `name@example.com` 是可变的，并且仅当 `channels.googlechat.dangerouslyAllowNameMatching: true` 时用于直接 allowlist 匹配。
- 已弃用：`users/<email>` 会被视为用户 ID，而不是电子邮件 allowlist。
- 空间：`spaces/<spaceId>`。

## 配置要点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

说明：

- 服务账号凭据也可以通过 `serviceAccount`（JSON 字符串）内联传入。
- 也支持 `serviceAccountRef`（环境变量/文件 SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的按账号 ref。
- 如果未设置 `webhookPath`，默认 webhook 路径为 `/googlechat`。
- `dangerouslyAllowNameMatching` 会重新启用可变电子邮件主体匹配用于 allowlist（break-glass 兼容模式）。
- 启用 `actions.reactions` 后，可通过 `reactions` 工具和 `channels action` 使用回应。
- 原生审批卡片使用 Google Chat `cardsV2` 按钮点击，而不是回应事件。审批者来自 `dm.allowFrom` 或 `defaultTo`，并且必须是稳定的数字 `users/<id>` 值。
- 消息操作为文本暴露 `send`，并为显式附件发送暴露 `upload-file`。`upload-file` 接受 `media` / `filePath` / `path`，以及可选的 `message`、`filename` 和线程目标。
- `typingIndicator` 支持 `message`（默认）、`none` 和 `reaction`（reaction 需要用户 OAuth）。
- 附件通过 Chat API 下载并存储在媒体管线中（大小受 `mediaMaxMb` 限制）。
- 默认会忽略机器人作者的 Google Chat 消息。如果你有意设置 `allowBots: true`，被接受的机器人作者消息会使用共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。配置 `channels.defaults.botLoopProtection`，然后当某个空间需要不同预算时，用 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆盖。

密钥参考详情：[密钥管理](/zh-CN/gateway/secrets)。

## 故障排除

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示如下错误：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这表示 webhook 处理程序未注册。常见原因：

1. **渠道未配置**：你的配置中缺少 `channels.googlechat` 部分。使用以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回“未找到配置路径”，请添加配置（参见[配置要点](#config-highlights)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示“disabled”，请将 `plugins.entries.googlechat.enabled: true` 添加到你的配置中。

3. **Gateway 网关未重启**：添加配置后，重启 Gateway 网关：

   ```bash
   openclaw gateway restart
   ```

验证渠道正在运行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他问题

- 检查 `openclaw channels status --probe`，查看 auth 错误或缺失的 audience 配置。
- 如果没有收到消息，请确认 Chat 应用的 webhook URL + 事件订阅。
- 如果提及门控阻止回复，请将 `botUser` 设置为应用的用户资源名称，并验证 `requireMention`。
- 发送测试消息时使用 `openclaw logs --follow`，查看请求是否到达 Gateway 网关。

相关文档：

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [安全](/zh-CN/gateway/security)
- [回应](/zh-CN/tools/reactions)

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
