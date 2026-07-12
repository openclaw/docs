---
read_when:
    - 开发 Google Chat 渠道功能
summary: Google Chat 应用支持状态、功能和配置
title: Google Chat
x-i18n:
    generated_at: "2026-07-11T20:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat 通过官方 `@openclaw/googlechat` 插件运行：使用 Google Chat API Webhook（仅限 HTTP 端点，不使用 Pub/Sub）处理私信和聊天室。

## 安装

```bash
openclaw plugins install @openclaw/googlechat
```

本地检出版本（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速设置（初学者）

1. 创建一个 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API 凭据](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未启用该 API，请将其启用。
2. 创建一个 **Service Account**：
   - 点击 **Create Credentials** > **Service Account**。
   - 根据需要命名（例如 `openclaw-chat`）。
   - 将权限和主账号留空（点击 **Continue**，然后点击 **Done**）。
3. 创建并下载 **JSON 密钥**：
   - 点击新建的服务账号 > **Keys** 选项卡 > **Add Key** > **Create new key** > **JSON** > **Create**。
4. 将下载的 JSON 文件存放在你的 Gateway 网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat 配置](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)中创建 Google Chat 应用：
   - 填写 **Application info**（应用名称、头像 URL 和说明）。
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers**，并将其设置为你的公共 Gateway 网关 URL，末尾附加 `/googlechat`（参见[公共 URL](#public-url-webhook-only)）。
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in `<Your Domain>`**，然后输入你的电子邮件地址。
   - 点击 **Save**。
6. 启用应用状态：刷新页面，找到 **App status**，将其设置为 **Live - available to users**，然后再次点击 **Save**。
7. 使用服务账号和 Webhook 受众配置 OpenClaw（必须与 Chat 应用配置匹配）：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（仅适用于默认账号），或者
   - 配置：参见[配置要点](#config-highlights)。`openclaw channels add --channel googlechat` 也接受 `--audience-type`、`--audience`、`--webhook-path` 和 `--webhook-url`。
8. 启动 Gateway 网关。Google Chat 会向你的 Webhook 路径发送 POST 请求（默认为 `/googlechat`）。

## 添加到 Google Chat

Gateway 网关运行后，且你的电子邮件地址已加入可见性列表：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3. 搜索你在 Google Cloud Console 中配置的 **App name**。
   - 由于它是私有应用，因此该 Bot _不会_ 出现在 Marketplace 浏览列表中；请按名称搜索。
4. 选择该 Bot，点击 **Add** 或 **Chat**，然后发送消息。

## 公共 URL（仅限 Webhook）

Google Chat Webhook 需要公共 HTTPS 端点。为确保安全，请**仅将 `/googlechat` 路径**暴露到互联网，并将 OpenClaw 仪表板和其他端点保持为私有。

### 方案 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 提供私有仪表板，并使用 Funnel 提供公共 Webhook 路径。

1. 检查 Gateway 网关绑定到哪个地址：

   ```bash
   ss -tlnp | grep 18789
   ```

   记下该 IP（例如 `127.0.0.1`、`0.0.0.0` 或 Tailscale `100.x.x.x` 地址）。

2. 仅向 tailnet 暴露仪表板（端口 8443）：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. 仅公开 Webhook 路径：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. 如果系统提示，请访问输出中显示的授权 URL，为此节点启用 Funnel。

5. 验证：

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公共 Webhook URL 为 `https://<node-name>.<tailnet>.ts.net/googlechat`；仪表板仍然仅限 tailnet 访问，地址为 `https://<node-name>.<tailnet>.ts.net:8443/`。在 Google Chat 应用配置中使用公共 URL（不带 `:8443`）。

> 注意：此配置会在重启后保留。之后可使用 `tailscale funnel reset` 和 `tailscale serve reset` 将其移除。

### 方案 B：反向代理（Caddy）

仅代理 Webhook 路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

对 `your-domain.com/` 的请求会被忽略或返回 404，而 `your-domain.com/googlechat` 会路由到 OpenClaw。

### 方案 C：Cloudflare Tunnel

配置隧道入口规则，使其仅路由 Webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（未找到）

## 工作原理

1. Google Chat 向 Gateway 网关的 Webhook 路径发送 JSON POST 请求（仅限 POST、要求 JSON 内容类型，并按 IP 进行速率限制）。
2. OpenClaw 在分发之前对每个请求进行身份验证：
   - Chat 应用事件携带 `Authorization: Bearer <token>`；在解析完整请求正文之前会先验证该令牌。
   - Google Workspace Add-on 事件在请求正文中携带令牌（`authorizationEventObject.systemIdToken`），并在更严格的预身份验证预算（16 KB、3 秒）下读取后再进行验证。
3. 根据 `audienceType` + `audience` 检查令牌：
   - `audienceType: "app-url"` → 受众是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → 受众是 Cloud 项目编号。
   - 使用 `app-url` 时，Add-on 令牌还要求将 `appPrincipal` 设置为应用的数字 OAuth 2.0 客户端 ID（21 位数字，不是电子邮件地址）；否则验证会失败并记录警告。
4. 消息按聊天室路由：
   - 聊天室使用各自独立的会话 `agent:<agentId>:googlechat:group:<spaceId>`；回复会发送到对应的消息线程。
   - 默认情况下，私信会合并到智能体的主会话中；如需为每个对端创建独立私信会话，请设置 `session.dmScope`（参见[会话](/zh-CN/concepts/session)）。
5. 私信访问默认使用配对。未知发送者会收到配对码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
6. 群组聊天室默认要求 @提及。系统通过目标为应用的 Chat `USER_MENTION` 注解检测提及；如果检测需要应用的用户资源名称，请设置 `botUser`（例如 `users/1234567890`）。
7. 当 Exec 或插件审批从 Google Chat 发起，且配置了稳定的 `users/<id>` 审批者时，OpenClaw 会在发起审批的聊天室或线程中发布原生审批卡片（`cardsV2`）。卡片按钮携带不透明的回调令牌；只有在无法进行原生投递时，才会显示手动 `/approve <id> <decision>` 提示。

## 目标

使用以下标识符进行投递和配置允许列表：

- 私信：`users/<userId>`（推荐）。
- 聊天室：`spaces/<spaceId>`。
- 原始电子邮件地址 `name@example.com` 可发生变化，仅当 `channels.googlechat.dangerouslyAllowNameMatching: true` 时才用于允许列表匹配。
- 已弃用：`users/<email>` 会被视为用户 ID，而不是电子邮件允许列表条目。
- 接受并会移除前缀 `googlechat:`、`google-chat:` 和 `gchat:`。

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
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注意：

- 服务账号凭据：`serviceAccountFile`（路径）、`serviceAccount`（内联 JSON 字符串或对象）或 `serviceAccountRef`（环境变量/文件 SecretRef）。环境变量 `GOOGLE_CHAT_SERVICE_ACCOUNT`（内联 JSON）和 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（路径）仅适用于默认账号。多账号设置使用 `channels.googlechat.accounts.<id>`，并使用相同的键，包括每个账号各自的 `serviceAccountRef`。
- 未设置 `webhookPath` 时，默认 Webhook 路径为 `/googlechat`；也可以通过 `webhookUrl` 提供路径。
- 群组键必须是稳定的聊天室 ID（`spaces/<spaceId>`）。显示名称键已弃用，并会相应记录日志。
- `dangerouslyAllowNameMatching` 会重新启用使用可变电子邮件主体进行允许列表匹配的功能（紧急兼容模式）；Doctor 会对电子邮件条目发出警告。
- 不提供 Google Chat 表情回应操作。该插件使用服务账号身份验证，而 Google Chat 表情回应端点要求用户身份验证。为了兼容性，仍会接受现有的 `actions.reactions` 配置，但该配置不起作用。
- 原生审批卡片使用 Google Chat `cardsV2` 按钮点击，而不是表情回应事件。审批者来自 `dm.allowFrom` 或 `defaultTo`，且必须是稳定的数字 `users/<id>` 值。
- 消息操作仅提供文本 `send`。Google Chat 附件上传要求用户身份验证，而此插件使用服务账号身份验证，因此不提供出站文件上传。
- `typingIndicator`：`message`（默认）会发布 `_<Bot> is typing..._` 占位消息，并在首次回复时将其编辑为回复内容；`none` 会禁用该功能；`reaction` 要求用户 OAuth，在服务账号身份验证下目前会回退到 `message` 并记录错误。
- 入站附件（每条消息的第一个附件）会通过 Chat API 下载到媒体管道，并受 `mediaMaxMb` 限制（默认为 20）。
- 默认忽略 Bot 发送的消息。设置 `allowBots: true` 后，接受的 Bot 消息会使用共享的 [Bot 循环保护](/zh-CN/channels/bot-loop-protection)：先配置 `channels.defaults.botLoopProtection`，然后通过 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆盖。

Secret 引用详情：[Secret 管理](/zh-CN/gateway/secrets)。

## 故障排查

### 405 方法不允许

如果 Google Cloud Logs Explorer 显示如下错误：

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook 处理程序未注册。常见原因：

1. **未配置渠道**：缺少 `channels.googlechat` 部分。使用以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回 "Config path not found"，请添加配置（参见[配置要点](#config-highlights)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示 "disabled"，请在配置中添加 `plugins.entries.googlechat.enabled: true`。

3. 配置更改后**未重启 Gateway 网关**：

   ```bash
   openclaw gateway restart
   ```

验证渠道是否正在运行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他问题

- `openclaw channels status --probe` 会显示身份验证错误和缺失的受众配置（`audience` 和 `audienceType` 均为必填项）。
- 如果未收到任何消息，请确认 Chat 应用的 Webhook URL 和触发器配置。
- 如果提及门控阻止回复，请将 `botUser` 设置为应用的用户资源名称，并检查 `requireMention`。
- 发送测试消息时运行 `openclaw logs --follow`，可查看请求是否到达 Gateway 网关。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Gateway 配置](/zh-CN/gateway/configuration)
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [安全性](/zh-CN/gateway/security) — 访问模型和安全加固
