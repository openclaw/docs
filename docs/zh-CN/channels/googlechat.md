---
read_when:
    - 开发 Google Chat 渠道功能
summary: Google Chat 应用支持状态、能力和配置
title: Google Chat
x-i18n:
    generated_at: "2026-07-05T11:01:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb0a6298652a8bac48f5e7249884f8387bc72f9c849a9b39e73aff008b848780
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat 以官方 `@openclaw/googlechat` 插件运行：通过 Google Chat API Webhooks（仅 HTTP 端点，无 Pub/Sub）处理私信和空间。

## 安装

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
   - 随意命名（例如 `openclaw-chat`）。
   - 将权限和主体留空（**Continue**，然后 **Done**）。
3. 创建并下载 **JSON key**：
   - 点击新的服务账号 > **Keys** 标签页 > **Add Key** > **Create new key** > **JSON** > **Create**。
4. 将下载的 JSON 文件存放在你的 Gateway 网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建 Google Chat 应用：
   - 填写 **Application info**（应用名称、头像 URL、描述）。
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers**，并将其设置为你的公开 Gateway 网关 URL，后接 `/googlechat`（参见 [公开 URL](#public-url-webhook-only)）。
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in `<Your Domain>`**，并输入你的电子邮件地址。
   - 点击 **Save**。
6. 启用应用状态：刷新页面，找到 **App status**，将其设置为 **Live - available to users**，然后再次 **Save**。
7. 使用服务账号和 Webhook 受众配置 OpenClaw（必须与 Chat 应用配置匹配）：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（仅默认账号），或
   - 配置：参见 [配置要点](#config-highlights)。`openclaw channels add --channel googlechat` 也接受 `--audience-type`、`--audience`、`--webhook-path` 和 `--webhook-url`。
8. 启动 Gateway 网关。Google Chat 会 POST 到你的 Webhook 路径（默认 `/googlechat`）。

## 添加到 Google Chat

Gateway 网关运行且你的电子邮件在可见性列表中后：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3. 搜索你在 Google Cloud Console 中配置的 **App name**。
   - 该 bot 不会出现在 Marketplace 浏览列表中，因为它是私有应用；请按名称搜索。
4. 选择该 bot，点击 **Add** 或 **Chat**，然后发送消息。

## 公开 URL（仅 Webhook）

Google Chat Webhooks 需要公开 HTTPS 端点。为安全起见，只将 **`/googlechat` 路径** 暴露到互联网，并保持 OpenClaw 仪表板和其他端点私有。

### 选项 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 暴露私有仪表板，并使用 Funnel 暴露公开 Webhook 路径。

1. 检查你的 Gateway 网关绑定到哪个地址：

   ```bash
   ss -tlnp | grep 18789
   ```

   记下 IP（例如 `127.0.0.1`、`0.0.0.0` 或 Tailscale `100.x.x.x` 地址）。

2. 仅向 tailnet 暴露仪表板（端口 8443）：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. 仅公开暴露 Webhook 路径：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. 如果出现提示，请访问输出中显示的授权 URL，为此节点启用 Funnel。

5. 验证：

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公开 Webhook URL 是 `https://<node-name>.<tailnet>.ts.net/googlechat`；仪表板保持仅 tailnet 可访问，地址为 `https://<node-name>.<tailnet>.ts.net:8443/`。在 Google Chat 应用配置中使用公开 URL（不带 `:8443`）。

> 注意：此配置会在重启后保留。之后可用 `tailscale funnel reset` 和 `tailscale serve reset` 移除它。

### 选项 B：反向代理（Caddy）

仅代理 Webhook 路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

对 `your-domain.com/` 的请求会被忽略或返回 404，而 `your-domain.com/googlechat` 会路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel

配置隧道入口规则，使其仅路由 Webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（Not Found）

## 工作原理

1. Google Chat 将 JSON POST 到 Gateway 网关 Webhook 路径（仅 POST，要求 JSON 内容类型，并按 IP 限速）。
2. OpenClaw 在分发前对每个请求进行身份验证：
   - Chat 应用事件携带 `Authorization: Bearer <token>`；在解析完整正文之前会先验证令牌。
   - Google Workspace Add-on 事件在正文中携带令牌（`authorizationEventObject.systemIdToken`），并在更严格的预身份验证预算（16 KB，3 秒）下读取后再验证。
3. 令牌会根据 `audienceType` + `audience` 检查：
   - `audienceType: "app-url"` → 受众是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → 受众是 Cloud 项目编号。
   - `app-url` 下的 Add-on 令牌还要求 `appPrincipal` 设置为应用的数字 OAuth 2.0 客户端 ID（21 位数字，不是电子邮件）；否则验证失败并记录警告。
4. 消息按空间路由：
   - 空间会获得按空间划分的会话 `agent:<agentId>:googlechat:group:<spaceId>`；回复会发送到消息线程。
   - 默认情况下，私信会合并到智能体的主会话；为按对端划分的私信会话设置 `session.dmScope`（参见 [会话](/zh-CN/concepts/session)）。
5. 默认情况下，私信访问需要配对。未知发送者会收到配对代码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
6. 默认情况下，群组空间需要 @ 提及。提及会从指向应用的 Chat `USER_MENTION` 注解中检测；如果检测需要应用的用户资源名称，请设置 `botUser`（例如 `users/1234567890`）。
7. 当来自 Google Chat 的 exec 或插件审批开始，并且配置了稳定的 `users/<id>` 审批者时，OpenClaw 会在来源空间或线程中发布原生审批卡片（`cardsV2`）。卡片按钮携带不透明回调令牌；只有在原生投递不可用时，才会出现手动 `/approve <id> <decision>` 提示。

## 目标

使用这些标识符进行投递和允许列表配置：

- 私信：`users/<userId>`（推荐）。
- 空间：`spaces/<spaceId>`。
- 原始电子邮件 `name@example.com` 是可变的，仅在 `channels.googlechat.dangerouslyAllowNameMatching: true` 时用于允许列表匹配。
- 已弃用：`users/<email>` 会被视为用户 ID，而不是电子邮件允许列表条目。
- 前缀 `googlechat:`、`google-chat:` 和 `gchat:` 会被接受并移除。

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
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
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

- 服务账号凭据：`serviceAccountFile`（路径）、`serviceAccount`（内联 JSON 字符串或对象）或 `serviceAccountRef`（环境变量/文件 SecretRef）。环境变量 `GOOGLE_CHAT_SERVICE_ACCOUNT`（内联 JSON）和 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（路径）仅应用于默认账号。多账号设置使用 `channels.googlechat.accounts.<id>`，并使用相同键名，包括每账号的 `serviceAccountRef`。
- 未设置 `webhookPath` 时，默认 Webhook 路径为 `/googlechat`；`webhookUrl` 也可以提供路径。
- 群组键必须是稳定的空间 ID（`spaces/<spaceId>`）。显示名称键已弃用，并会按此记录日志。
- `dangerouslyAllowNameMatching` 会重新启用可变电子邮件主体匹配用于允许列表（应急兼容模式）；Doctor 会对电子邮件条目发出警告。
- 表情回应默认启用，并通过 `reactions` 工具和 `channels action` 暴露；使用 `actions.reactions: false` 禁用。
- 原生审批卡片使用 Google Chat `cardsV2` 按钮点击，而不是表情回应事件。审批者来自 `dm.allowFrom` 或 `defaultTo`，且必须是稳定的数字 `users/<id>` 值。
- 消息操作会暴露用于文本的 `send`，以及用于显式发送附件的 `upload-file`。`upload-file` 接受 `media` / `filePath` / `path`，以及可选的 `message`、`filename` 和线程目标（`threadId` / `replyTo`）。
- `typingIndicator`：`message`（默认）会发布 `_<Bot> is typing..._` 占位符，并将其编辑为第一条回复；`none` 会禁用它；`reaction` 需要用户 OAuth，目前在服务账号身份验证下会回退到 `message` 并记录错误。
- 入站附件（每条消息的第一个附件）会通过 Chat API 下载到媒体流水线，并受 `mediaMaxMb` 限制（默认 20）。
- 默认情况下会忽略 bot 发送的消息。设置 `allowBots: true` 后，已接受的 bot 消息会使用共享的 [bot 循环保护](/zh-CN/channels/bot-loop-protection)：配置 `channels.defaults.botLoopProtection`，然后用 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆盖。

密钥参考详情：[密钥管理](/zh-CN/gateway/secrets)。

## 故障排查

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示如下错误：

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook 处理器未注册。常见原因：

1. **未配置渠道**：缺少 `channels.googlechat` 部分。使用以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回 "Config path not found"，请添加配置（参见 [配置要点](#config-highlights)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示 "disabled"，请将 `plugins.entries.googlechat.enabled: true` 添加到你的配置中。

3. 配置更改后 **Gateway 网关未重启**：

   ```bash
   openclaw gateway restart
   ```

验证渠道是否正在运行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他问题

- `openclaw channels status --probe` 会显示身份验证错误和缺失的受众配置（`audience` 和 `audienceType` 都是必需的）。
- 如果没有消息到达，请确认 Chat 应用的 Webhook URL 和触发器配置。
- 如果提及门控阻止回复，请将 `botUser` 设置为应用的用户资源名称，并检查 `requireMention`。
- 发送测试消息时运行 `openclaw logs --follow`，可以看到请求是否到达 Gateway 网关。

## 相关

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Gateway 配置](/zh-CN/gateway/configuration)
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [表情回应](/zh-CN/tools/reactions)
- [安全](/zh-CN/gateway/security) — 访问模型和加固
