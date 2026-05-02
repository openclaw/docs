---
read_when:
    - 开发 Google Chat 渠道功能
summary: Google Chat 应用支持状态、能力和配置
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T07:01:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

状态：可下载插件，通过 Google Chat API webhooks（仅 HTTP）支持私信 + 空间。

## 安装

在配置渠道之前先安装 Google Chat：

```bash
openclaw plugins install @openclaw/googlechat
```

本地 checkout（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速设置（初学者）

1. 创建一个 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果 API 尚未启用，请启用它。
2. 创建一个 **Service Account**：
   - 点击 **Create Credentials** > **Service Account**。
   - 使用任意名称（例如 `openclaw-chat`）。
   - 权限留空（点击 **Continue**）。
   - 可访问的主体留空（点击 **Done**）。
3. 创建并下载 **JSON Key**：
   - 在服务账号列表中，点击你刚创建的服务账号。
   - 前往 **Keys** 标签页。
   - 点击 **Add Key** > **Create new key**。
   - 选择 **JSON** 并点击 **Create**。
4. 将下载的 JSON 文件存储到你的 Gateway 网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建一个 Google Chat 应用：
   - 填写 **Application info**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers**，并将其设置为你的 Gateway 网关公开 URL，后接 `/googlechat`。
     - _提示：运行 `openclaw status` 查找你的 Gateway 网关公开 URL。_
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in `<Your Domain>`**。
   - 在文本框中输入你的电子邮件地址（例如 `user@example.com`）。
   - 点击底部的 **Save**。
6. **启用应用状态**：
   - 保存后，**刷新页面**。
   - 查找 **App status** 区域（通常在保存后出现在页面顶部或底部附近）。
   - 将状态更改为 **Live - available to users**。
   - 再次点击 **Save**。
7. 使用服务账号路径 + webhook audience 配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 设置 webhook audience 类型 + 值（与你的 Chat 应用配置匹配）。
9. 启动 Gateway 网关。Google Chat 会向你的 webhook 路径发送 POST 请求。

## 添加到 Google Chat

Gateway 网关运行后，并且你的电子邮件已加入可见性列表：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3. 在搜索栏中（通常添加联系人的位置），输入你在 Google Cloud Console 中配置的 **App name**。
   - **注意**：因为这是一个私有应用，机器人_不会_出现在 “Marketplace” 浏览列表中。你必须按名称搜索它。
4. 从结果中选择你的机器人。
5. 点击 **Add** 或 **Chat** 来开始 1:1 对话。
6. 发送 “你好” 以触发助手！

## 公开 URL（仅 Webhook）

Google Chat webhooks 需要一个公开的 HTTPS 端点。出于安全考虑，**只将 `/googlechat` 路径暴露到互联网**。将 OpenClaw 仪表盘和其他敏感端点保留在你的私有网络中。

### 选项 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 承载私有仪表盘，并使用 Funnel 承载公开 webhook 路径。这样可以让 `/` 保持私有，同时只暴露 `/googlechat`。

1. **检查你的 Gateway 网关绑定到哪个地址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   记下 IP 地址（例如 `127.0.0.1`、`0.0.0.0`，或你的 Tailscale IP，如 `100.x.x.x`）。

2. **仅向 tailnet 暴露仪表盘（端口 8443）：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **仅公开暴露 webhook 路径：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授权节点访问 Funnel：**
   如果收到提示，请访问输出中显示的授权 URL，在你的 tailnet 策略中为此节点启用 Funnel。

5. **验证配置：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公开 webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私有仪表盘保持仅限 tailnet 访问：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用公开 URL（不带 `:8443`）。

> 注意：此配置会在重启后保留。稍后如需移除，请运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 选项 B：反向代理（Caddy）

如果你使用 Caddy 之类的反向代理，只代理特定路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此配置时，任何对 `your-domain.com/` 的请求都会被忽略或返回 404，而 `your-domain.com/googlechat` 会安全地路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel

配置你的 tunnel ingress 规则，只路由 webhook 路径：

- **Path**：`/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**：HTTP 404（未找到）

## 工作原理

1. Google Chat 向 Gateway 网关发送 webhook POST。每个请求都包含 `Authorization: Bearer <token>` 标头。
   - 当标头存在时，OpenClaw 会在读取/解析完整 webhook body 之前验证 bearer auth。
   - 支持在 body 中携带 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 请求，并使用更严格的预认证 body 预算。
2. OpenClaw 会根据配置的 `audienceType` + `audience` 验证 token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 项目编号。
3. 消息按 space 路由：
   - 私信使用会话键 `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 空间使用会话键 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私信访问默认使用 pairing。未知发送者会收到 pairing code；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组空间默认需要 @ 提及。如果提及检测需要应用的用户名，请使用 `botUser`。

## 目标

使用这些标识符进行投递和 allowlist：

- 私信：`users/<userId>`（推荐）。
- 原始电子邮件 `name@example.com` 是可变的，并且仅在 `channels.googlechat.dangerouslyAllowNameMatching: true` 时用于直接 allowlist 匹配。
- 已弃用：`users/<email>` 会被视为 user id，而不是电子邮件 allowlist。
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
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
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

备注：

- 服务账号凭据也可以通过 `serviceAccount`（JSON 字符串）内联传入。
- 也支持 `serviceAccountRef`（env/file SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的每账号引用。
- 如果未设置 `webhookPath`，默认 webhook 路径为 `/googlechat`。
- `dangerouslyAllowNameMatching` 会重新启用用于 allowlist 的可变电子邮件 principal 匹配（break-glass 兼容模式）。
- 当启用 `actions.reactions` 时，可通过 `reactions` 工具和 `channels action` 使用回应。
- 消息操作为文本公开 `send`，并为显式附件发送公开 `upload-file`。`upload-file` 接受 `media` / `filePath` / `path`，以及可选的 `message`、`filename` 和 thread 目标。
- `typingIndicator` 支持 `none`、`message`（默认）和 `reaction`（reaction 需要用户 OAuth）。
- 附件会通过 Chat API 下载并存储在媒体管道中（大小受 `mediaMaxMb` 限制）。

Secrets 引用详情：[Secrets Management](/zh-CN/gateway/secrets)。

## 故障排除

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示如下错误：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这表示 webhook handler 未注册。常见原因：

1. **渠道未配置**：你的配置中缺少 `channels.googlechat` 部分。使用以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回 “Config path not found”，请添加配置（见[配置要点](#config-highlights)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示 “disabled”，请将 `plugins.entries.googlechat.enabled: true` 添加到你的配置中。

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

- 检查 `openclaw channels status --probe` 以查看认证错误或缺失的 audience 配置。
- 如果没有消息到达，请确认 Chat 应用的 webhook URL + 事件订阅。
- 如果提及门控阻止回复，请将 `botUser` 设置为应用的用户资源名称，并验证 `requireMention`。
- 发送测试消息时使用 `openclaw logs --follow`，查看请求是否到达 Gateway 网关。

相关文档：

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [Security](/zh-CN/gateway/security)
- [Reactions](/zh-CN/tools/reactions)

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证和 pairing 流程
- [Groups](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
